from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from database import get_db
from models import UtilityBill, Utility, Project, Contract
from datetime import date

router = APIRouter()


@router.get("/annual")
def get_annual_report(year: int = Query(default_factory=lambda: date.today().year), db: Session = Depends(get_db)):
    # Utility bills: group by utility, sum amounts
    bill_rows = (
        db.query(
            Utility.id,
            Utility.provider_name,
            Utility.utility_type,
            func.sum(UtilityBill.amount).label("total"),
        )
        .join(UtilityBill, UtilityBill.utility_id == Utility.id)
        .filter(extract("year", UtilityBill.bill_date) == year)
        .group_by(Utility.id)
        .all()
    )

    utilities_breakdown = [
        {
            "utility_id": row.id,
            "provider_name": row.provider_name,
            "utility_type": row.utility_type,
            "total": float(row.total),
        }
        for row in bill_rows
    ]
    utilities_total = sum(item["total"] for item in utilities_breakdown)

    # Projects: actual_cost set, and start_date or end_date falls in year
    projects = (
        db.query(Project)
        .filter(
            Project.actual_cost.isnot(None),
            (
                (extract("year", Project.start_date) == year)
                | (extract("year", Project.end_date) == year)
            ),
        )
        .all()
    )
    projects_total = float(sum(float(p.actual_cost) for p in projects))

    # Contracts: cost set, start_date falls in year
    contracts = (
        db.query(Contract)
        .filter(
            Contract.cost.isnot(None),
            extract("year", Contract.start_date) == year,
        )
        .all()
    )
    contracts_total = float(sum(float(c.cost) for c in contracts))

    grand_total = utilities_total + projects_total + contracts_total

    return {
        "year": year,
        "utilities_total": utilities_total,
        "utilities_breakdown": utilities_breakdown,
        "projects_total": projects_total,
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "status": p.status.value if p.status else None,
                "budget": float(p.budget) if p.budget else None,
                "actual_cost": float(p.actual_cost) if p.actual_cost else None,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
            }
            for p in projects
        ],
        "contracts_total": contracts_total,
        "contracts": [
            {
                "id": c.id,
                "name": c.name,
                "type": c.type.value if c.type else None,
                "vendor_id": c.vendor_id,
                "start_date": c.start_date.isoformat() if c.start_date else None,
                "end_date": c.end_date.isoformat() if c.end_date else None,
                "cost": float(c.cost) if c.cost else None,
                "payment_terms": c.payment_terms,
                "notes": c.notes,
            }
            for c in contracts
        ],
        "grand_total": grand_total,
    }
