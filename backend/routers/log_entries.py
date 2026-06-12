from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import LogEntry, FileAttachment
from schemas import LogEntryCreate, LogEntryUpdate, LogEntryOut, LogEntryDetail

router = APIRouter()


@router.get("", response_model=list[LogEntryOut])
def list_log_entries(
    category: str | None = None,
    provider_id: int | None = None,
    project_id: int | None = None,
    year: int | None = None,
    limit: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(LogEntry)
    if category:
        query = query.filter(LogEntry.category == category)
    if provider_id:
        query = query.filter(LogEntry.provider_id == provider_id)
    if project_id:
        query = query.filter(LogEntry.project_id == project_id)
    if year:
        query = query.filter(extract("year", LogEntry.entry_date) == year)
    # Most-recent first; NULL entry_date (pure reminders) sort last.
    query = query.order_by(LogEntry.entry_date.is_(None), LogEntry.entry_date.desc(), LogEntry.id.desc())
    if limit:
        query = query.limit(limit)
    return query.all()


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(LogEntry.category)
        .filter(LogEntry.category.isnot(None), LogEntry.category != "")
        .distinct()
        .order_by(LogEntry.category)
        .all()
    )
    return [r[0] for r in rows]


@router.get("/{entry_id}", response_model=LogEntryDetail)
def get_log_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = (
        db.query(LogEntry)
        .options(joinedload(LogEntry.provider), joinedload(LogEntry.project))
        .filter(LogEntry.id == entry_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return entry


@router.post("", response_model=LogEntryOut, status_code=201)
def create_log_entry(entry: LogEntryCreate, db: Session = Depends(get_db)):
    db_entry = LogEntry(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.put("/{entry_id}", response_model=LogEntryOut)
def update_log_entry(entry_id: int, entry: LogEntryUpdate, db: Session = Depends(get_db)):
    db_entry = db.query(LogEntry).filter(LogEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    for key, value in entry.model_dump().items():
        setattr(db_entry, key, value)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/{entry_id}", status_code=204)
def delete_log_entry(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(LogEntry).filter(LogEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    # Polymorphic file attachments have no FK cascade — delete via ORM so the
    # associated FileData blob is cascaded too.
    attachments = db.query(FileAttachment).filter(
        FileAttachment.entity_type == "log_entry", FileAttachment.entity_id == entry_id
    ).all()
    for att in attachments:
        db.delete(att)
    db.delete(db_entry)
    db.commit()
