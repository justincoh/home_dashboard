from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Contract
from schemas import ContractCreate, ContractUpdate, ContractOut, ContractDetail

router = APIRouter()


@router.get("", response_model=list[ContractDetail])
def list_contracts(db: Session = Depends(get_db)):
    return db.query(Contract).options(joinedload(Contract.vendor)).all()


@router.get("/{contract_id}", response_model=ContractDetail)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).options(
        joinedload(Contract.vendor)
    ).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.post("", response_model=ContractOut, status_code=201)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    db_contract = Contract(**contract.model_dump())
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: int, contract: ContractUpdate, db: Session = Depends(get_db)):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    for key, value in contract.model_dump().items():
        setattr(db_contract, key, value)
    db.commit()
    db.refresh(db_contract)
    return db_contract


@router.delete("/{contract_id}", status_code=204)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(db_contract)
    db.commit()
