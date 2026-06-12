from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Provider, Project, Contract, LogEntry
from schemas import SearchResult

router = APIRouter()

LIMIT_PER_TYPE = 5


@router.get("", response_model=list[SearchResult])
def search(q: str = Query(min_length=2), db: Session = Depends(get_db)):
    term = f"%{q}%"
    results: list[SearchResult] = []

    providers = (
        db.query(Provider)
        .filter(Provider.name.ilike(term) | Provider.service_type.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(entity_type="provider", id=p.id, name=p.name, subtitle=p.service_type)
        for p in providers
    )

    projects = (
        db.query(Project)
        .filter(Project.name.ilike(term) | Project.description.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(
            entity_type="project", id=p.id, name=p.name,
            subtitle=p.status.value.replace("_", " ") if p.status else None,
        )
        for p in projects
    )

    contracts = (
        db.query(Contract)
        .filter(Contract.name.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(
            entity_type="contract", id=c.id, name=c.name,
            subtitle=c.type.value if c.type else None,
        )
        for c in contracts
    )

    entries = (
        db.query(LogEntry)
        .filter(LogEntry.title.ilike(term) | LogEntry.category.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(entity_type="log_entry", id=e.id, name=e.title, subtitle=e.category)
        for e in entries
    )

    return results
