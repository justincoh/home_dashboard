from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import Bill, MaintenanceTask
from schemas import BillCreate, BillUpdate, BillOut

router = APIRouter()


def _sync_maintenance_task(task_id: int, db: Session):
    """Keep a maintenance task's last_completed in sync with its bill dates."""
    latest = (
        db.query(func.max(Bill.bill_date))
        .filter(Bill.entity_type == "maintenance_task", Bill.entity_id == task_id)
        .scalar()
    )
    task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if task:
        task.last_completed = latest


@router.get("", response_model=list[BillOut])
def list_bills(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    db: Session = Depends(get_db),
):
    return (
        db.query(Bill)
        .filter(Bill.entity_type == entity_type, Bill.entity_id == entity_id)
        .order_by(Bill.bill_date.desc())
        .all()
    )


@router.post("", response_model=BillOut, status_code=201)
def create_bill(bill: BillCreate, db: Session = Depends(get_db)):
    db_bill = Bill(**bill.model_dump())
    db.add(db_bill)
    db.flush()
    if db_bill.entity_type == "maintenance_task":
        _sync_maintenance_task(db_bill.entity_id, db)
    db.commit()
    db.refresh(db_bill)
    return db_bill


@router.put("/{bill_id}", response_model=BillOut)
def update_bill(bill_id: int, bill: BillUpdate, db: Session = Depends(get_db)):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    for key, value in bill.model_dump().items():
        setattr(db_bill, key, value)
    db.flush()
    if db_bill.entity_type == "maintenance_task":
        _sync_maintenance_task(db_bill.entity_id, db)
    db.commit()
    db.refresh(db_bill)
    return db_bill


@router.delete("/{bill_id}", status_code=204)
def delete_bill(bill_id: int, db: Session = Depends(get_db)):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    entity_type = db_bill.entity_type
    entity_id = db_bill.entity_id
    db.delete(db_bill)
    db.flush()
    if entity_type == "maintenance_task":
        _sync_maintenance_task(entity_id, db)
    db.commit()
