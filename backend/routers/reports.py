from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models import LogEntry, Provider, Project, Contract
from schemas import (
    AnnualReport,
    CategoryBreakdown,
    ProviderBreakdown,
    ProjectBreakdown,
)
from datetime import date

router = APIRouter()


@router.get("/annual", response_model=AnnualReport)
def get_annual_report(year: int = Query(default_factory=lambda: date.today().year), db: Session = Depends(get_db)):
    in_year = extract("year", LogEntry.entry_date) == year
    has_amount = LogEntry.amount.isnot(None)

    log_total = float(
        db.query(func.coalesce(func.sum(LogEntry.amount), 0))
        .filter(in_year, has_amount)
        .scalar()
        or 0
    )

    cat_rows = (
        db.query(
            func.coalesce(LogEntry.category, "uncategorized").label("category"),
            func.sum(LogEntry.amount).label("total"),
        )
        .filter(in_year, has_amount)
        .group_by("category")
        .order_by(func.sum(LogEntry.amount).desc())
        .all()
    )
    by_category = [
        CategoryBreakdown(category=r.category, total=float(r.total or 0)) for r in cat_rows
    ]

    prov_rows = (
        db.query(
            Provider.id,
            Provider.name,
            func.sum(LogEntry.amount).label("total"),
        )
        .join(LogEntry, LogEntry.provider_id == Provider.id)
        .filter(in_year, has_amount)
        .group_by(Provider.id)
        .order_by(func.sum(LogEntry.amount).desc())
        .all()
    )
    by_provider = [
        ProviderBreakdown(provider_id=r.id, provider_name=r.name, total=float(r.total or 0))
        for r in prov_rows
    ]

    proj_rows = (
        db.query(
            Project.id,
            Project.name,
            func.sum(LogEntry.amount).label("total"),
        )
        .join(LogEntry, LogEntry.project_id == Project.id)
        .filter(in_year, has_amount)
        .group_by(Project.id)
        .order_by(func.sum(LogEntry.amount).desc())
        .all()
    )
    by_project = [
        ProjectBreakdown(project_id=r.id, project_name=r.name, total=float(r.total or 0))
        for r in proj_rows
    ]

    contracts = (
        db.query(Contract)
        .filter(
            Contract.cost.isnot(None),
            extract("year", Contract.start_date) == year,
        )
        .all()
    )
    contracts_total = float(sum(float(c.cost) for c in contracts))

    return AnnualReport(
        year=year,
        log_total=log_total,
        by_category=by_category,
        by_provider=by_provider,
        by_project=by_project,
        contracts_total=contracts_total,
        contracts=contracts,
        grand_total=log_total + contracts_total,
    )
