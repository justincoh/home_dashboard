from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Quote
from schemas import QuoteCreate, QuoteUpdate, QuoteOut, QuoteDetail

router = APIRouter()


@router.get("", response_model=list[QuoteDetail])
def list_quotes(vendor_id: int | None = None, project_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Quote).options(joinedload(Quote.vendor), joinedload(Quote.project))
    if vendor_id:
        query = query.filter(Quote.vendor_id == vendor_id)
    if project_id:
        query = query.filter(Quote.project_id == project_id)
    return query.all()


@router.get("/{quote_id}", response_model=QuoteDetail)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.query(Quote).options(
        joinedload(Quote.vendor), joinedload(Quote.project)
    ).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.post("", response_model=QuoteOut, status_code=201)
def create_quote(quote: QuoteCreate, db: Session = Depends(get_db)):
    db_quote = Quote(**quote.model_dump())
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote


@router.put("/{quote_id}", response_model=QuoteOut)
def update_quote(quote_id: int, quote: QuoteUpdate, db: Session = Depends(get_db)):
    db_quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not db_quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    for key, value in quote.model_dump().items():
        setattr(db_quote, key, value)
    db.commit()
    db.refresh(db_quote)
    return db_quote


@router.delete("/{quote_id}", status_code=204)
def delete_quote(quote_id: int, db: Session = Depends(get_db)):
    db_quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not db_quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    db.delete(db_quote)
    db.commit()
