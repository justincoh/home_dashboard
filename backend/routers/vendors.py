from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Vendor
from schemas import VendorCreate, VendorUpdate, VendorOut

router = APIRouter()


@router.get("", response_model=list[VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    return db.query(Vendor).all()


@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("", response_model=VendorOut, status_code=201)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    db_vendor = Vendor(**vendor.model_dump())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor


@router.put("/{vendor_id}", response_model=VendorOut)
def update_vendor(vendor_id: int, vendor: VendorUpdate, db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in vendor.model_dump().items():
        setattr(db_vendor, key, value)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor


@router.delete("/{vendor_id}", status_code=204)
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(db_vendor)
    db.commit()
