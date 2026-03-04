import io
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import FileAttachment, FileData
from schemas import FileAttachmentOut

router = APIRouter()


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
    contents = await file.read()
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0]

    db_file = FileAttachment(
        entity_type=entity_type,
        entity_id=entity_id,
        filename=file.filename or "upload",
        filepath="blob",
        content_type=content_type,
    )
    db.add(db_file)
    db.flush()

    db.add(FileData(id=db_file.id, data=contents))
    db.commit()
    db.refresh(db_file)
    return db_file


@router.get("/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    file_data = db.query(FileData).filter(FileData.id == file_id).first()
    if not file_data:
        raise HTTPException(status_code=404, detail="File data not found")

    media_type = db_file.content_type or "application/octet-stream"
    return StreamingResponse(
        io.BytesIO(file_data.data),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{db_file.filename}"'},
    )


@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    db.delete(db_file)
    db.commit()
