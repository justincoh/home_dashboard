from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import FileAttachment
from schemas import FileAttachmentOut
import os
import uuid

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


@router.get("", response_model=list[FileAttachmentOut])
def list_files(entity_type: str | None = None, entity_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(FileAttachment)
    if entity_type:
        query = query.filter(FileAttachment.entity_type == entity_type)
    if entity_id:
        query = query.filter(FileAttachment.entity_id == entity_id)
    return query.all()


@router.post("/upload", response_model=FileAttachmentOut, status_code=201)
async def upload_file(
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOADS_DIR, stored_name)

    os.makedirs(UPLOADS_DIR, exist_ok=True)
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    db_file = FileAttachment(
        entity_type=entity_type,
        entity_id=entity_id,
        filename=file.filename or stored_name,
        filepath=stored_name,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


@router.get("/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    full_path = os.path.join(UPLOADS_DIR, db_file.filepath)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(full_path, filename=db_file.filename)


@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    full_path = os.path.join(UPLOADS_DIR, db_file.filepath)
    if os.path.exists(full_path):
        os.remove(full_path)
    db.delete(db_file)
    db.commit()
