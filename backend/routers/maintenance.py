import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import MaintenanceTask, MaintenanceLog
from schemas import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut, MaintenanceLogOut, MaintenanceCompleteBody, MaintenanceLogUpdate
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
    return db.query(MaintenanceTask).order_by(
        MaintenanceTask.recurring.desc(),
        MaintenanceTask.next_due.asc(),
    ).all()


@router.get("/{task_id}", response_model=MaintenanceOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("", response_model=MaintenanceOut, status_code=201)
def create_task(task: MaintenanceCreate, db: Session = Depends(get_db)):
    if task.recurring and not parse_frequency(task.frequency):
        raise HTTPException(status_code=422, detail="Invalid frequency format. Use e.g. 3d, 2w, 6m, 1y")
    db_task = MaintenanceTask(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.put("/{task_id}", response_model=MaintenanceOut)
def update_task(task_id: int, task: MaintenanceUpdate, db: Session = Depends(get_db)):
    if task.recurring and not parse_frequency(task.frequency):
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
def complete_task(task_id: int, body: MaintenanceCompleteBody = None, db: Session = Depends(get_db)):
    db_task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    today = date.today()
    db_task.last_completed = today
    if db_task.recurring:
        delta = parse_frequency(db_task.frequency)
        if delta:
            db_task.next_due = today + delta
    log = MaintenanceLog(task_id=task_id, completed_at=today, cost=body.cost if body else None)
    db.add(log)
    db.commit()
    db.refresh(db_task)
    return db_task


def _sync_last_completed(task_id: int, db: Session):
    latest = (
        db.query(func.max(MaintenanceLog.completed_at))
        .filter(MaintenanceLog.task_id == task_id)
        .scalar()
    )
    task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if task:
        task.last_completed = latest


@router.put("/log/{log_id}", response_model=MaintenanceLogOut)
def update_log(log_id: int, body: MaintenanceLogUpdate, db: Session = Depends(get_db)):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    log.completed_at = body.completed_at
    log.cost = body.cost
    _sync_last_completed(log.task_id, db)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/log/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    task_id = log.task_id
    db.delete(log)
    db.flush()
    _sync_last_completed(task_id, db)
    db.commit()


@router.get("/{task_id}/log", response_model=list[MaintenanceLogOut])
def list_task_logs(task_id: int, db: Session = Depends(get_db)):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db.query(MaintenanceLog).filter(MaintenanceLog.task_id == task_id).order_by(MaintenanceLog.completed_at.desc()).all()
