from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Utility, UtilityBill
from schemas import (
    UtilityCreate, UtilityUpdate, UtilityOut,
    UtilityBillCreate, UtilityBillUpdate, UtilityBillOut,
)

router = APIRouter()


# --- Utilities ---
@router.get("", response_model=list[UtilityOut])
def list_utilities(db: Session = Depends(get_db)):
    return db.query(Utility).all()


@router.get("/{utility_id}", response_model=UtilityOut)
def get_utility(utility_id: int, db: Session = Depends(get_db)):
    utility = db.query(Utility).filter(Utility.id == utility_id).first()
    if not utility:
        raise HTTPException(status_code=404, detail="Utility not found")
    return utility


@router.post("", response_model=UtilityOut, status_code=201)
def create_utility(utility: UtilityCreate, db: Session = Depends(get_db)):
    db_utility = Utility(**utility.model_dump())
    db.add(db_utility)
    db.commit()
    db.refresh(db_utility)
    return db_utility


@router.put("/{utility_id}", response_model=UtilityOut)
def update_utility(utility_id: int, utility: UtilityUpdate, db: Session = Depends(get_db)):
    db_utility = db.query(Utility).filter(Utility.id == utility_id).first()
    if not db_utility:
        raise HTTPException(status_code=404, detail="Utility not found")
    for key, value in utility.model_dump().items():
        setattr(db_utility, key, value)
    db.commit()
    db.refresh(db_utility)
    return db_utility


@router.delete("/{utility_id}", status_code=204)
def delete_utility(utility_id: int, db: Session = Depends(get_db)):
    db_utility = db.query(Utility).filter(Utility.id == utility_id).first()
    if not db_utility:
        raise HTTPException(status_code=404, detail="Utility not found")
    db.delete(db_utility)
    db.commit()


# --- Utility Bills ---
@router.get("/{utility_id}/bills", response_model=list[UtilityBillOut])
def list_bills(utility_id: int, db: Session = Depends(get_db)):
    return db.query(UtilityBill).filter(UtilityBill.utility_id == utility_id).order_by(UtilityBill.bill_date.desc()).all()


@router.post("/{utility_id}/bills", response_model=UtilityBillOut, status_code=201)
def create_bill(utility_id: int, bill: UtilityBillCreate, db: Session = Depends(get_db)):
    db_bill = UtilityBill(**bill.model_dump())
    db_bill.utility_id = utility_id
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill


@router.put("/bills/{bill_id}", response_model=UtilityBillOut)
def update_bill(bill_id: int, bill: UtilityBillUpdate, db: Session = Depends(get_db)):
    db_bill = db.query(UtilityBill).filter(UtilityBill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    for key, value in bill.model_dump().items():
        setattr(db_bill, key, value)
    db.commit()
    db.refresh(db_bill)
    return db_bill


@router.delete("/bills/{bill_id}", status_code=204)
def delete_bill(bill_id: int, db: Session = Depends(get_db)):
    db_bill = db.query(UtilityBill).filter(UtilityBill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    db.delete(db_bill)
    db.commit()
