"""One-time migration: move file uploads from disk (uploads/) into SQLite BLOBs."""

import mimetypes
import os
import sys

from sqlalchemy import inspect, text

from database import engine, SessionLocal
from models import Base, FileAttachment, FileData

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


def run():
    inspector = inspect(engine)

    # 1. Create file_data table if missing
    if "file_data" not in inspector.get_table_names():
        FileData.__table__.create(engine)
        print("Created file_data table.")
    else:
        print("file_data table already exists.")

    # 2. Add content_type column to file_attachments if missing
    columns = [c["name"] for c in inspector.get_columns("file_attachments")]
    if "content_type" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE file_attachments ADD COLUMN content_type TEXT"))
        print("Added content_type column to file_attachments.")
    else:
        print("content_type column already exists.")

    # 3. Migrate existing files from disk into file_data
    db = SessionLocal()
    try:
        attachments = db.query(FileAttachment).all()
        migrated = 0
        skipped = 0
        missing = 0

        for att in attachments:
            # Skip if already migrated
            existing = db.query(FileData).filter(FileData.id == att.id).first()
            if existing:
                skipped += 1
                continue

            file_path = os.path.join(UPLOADS_DIR, att.filepath)
            if not os.path.exists(file_path):
                print(f"  WARNING: file not found on disk: {file_path} (attachment id={att.id})")
                missing += 1
                continue

            with open(file_path, "rb") as f:
                data = f.read()

            content_type, _ = mimetypes.guess_type(att.filename)
            att.content_type = content_type

            file_data = FileData(id=att.id, data=data)
            db.add(file_data)
            migrated += 1
            print(f"  Migrated: {att.filename} ({len(data)} bytes, {content_type})")

        db.commit()
        print(f"\nDone. Migrated: {migrated}, Skipped (already migrated): {skipped}, Missing on disk: {missing}")
        print("You can now manually delete the uploads/ directory.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
