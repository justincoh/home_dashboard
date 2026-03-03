import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import MaintenanceTask
from schemas import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from datetime import date
from dateutil.relativedelta import relativedelta

router = APIRouter()

FREQUENCY_PATTERN = re.compile(r'^(\d+)\s*(d|w|m|y)$', re.IGNORECASE)

UNIT_DELTAS = {
    'd': lambda n: relativedelta(days=n),
    'w': lambda n: relativedelta(weeks=n),
    'm': lambda n: relativedelta(months=n),
    'y': lambda n: relativedelta(years=n),
}


def parse_frequency(freq: str) -> relativedelta | None:
    match = FREQUENCY_PATTERN.match(freq.strip())
    if not match:
        return None
    amount = int(match.group(1))
    unit = match.group(2).lower()
    return UNIT_DELTAS[unit](amount)


@router.get("", response_model=list[MaintenanceOut])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(MaintenanceTask).order_by(MaintenanceTask.next_due).all()


@router.get("/{task_id}", response_model=MaintenanceOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("", response_model=MaintenanceOut, status_code=201)
def create_task(task: MaintenanceCreate, db: Session = Depends(get_db)):
    if not parse_frequency(task.frequency):
        raise HTTPException(status_code=422, detail="Invalid frequency format. Use e.g. 3d, 2w, 6m, 1y")
    db_task = MaintenanceTask(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.put("/{task_id}", response_model=MaintenanceOut)
def update_task(task_id: int, task: MaintenanceUpdate, db: Session = Depends(get_db)):
    if not parse_frequency(task.frequency):
        raise HTTPException(status_code=422, detail="Invalid frequency format. Use e.g. 3d, 2w, 6m, 1y")
    db_task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task.model_dump().items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()


@router.post("/{task_id}/complete", response_model=MaintenanceOut)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    today = date.today()
    db_task.last_completed = today
    delta = parse_frequency(db_task.frequency)
    if delta:
        db_task.next_due = today + delta
    db.commit()
    db.refresh(db_task)
    return db_task
