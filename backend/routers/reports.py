from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models import UtilityBill, Utility, Project, Contract, MaintenanceLog, MaintenanceTask
from schemas import AnnualReport, UtilityExpenseBreakdown, MaintenanceExpenseItem
from datetime import date

router = APIRouter()


@router.get("/annual", response_model=AnnualReport)
def get_annual_report(year: int = Query(default_factory=lambda: date.today().year), db: Session = Depends(get_db)):
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
        UtilityExpenseBreakdown(
            utility_id=row.id,
            provider_name=row.provider_name,
            utility_type=row.utility_type,
            total=float(row.total),
        )
        for row in bill_rows
    ]
    utilities_total = sum(u.total for u in utilities_breakdown)

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

    contracts = (
        db.query(Contract)
        .filter(
            Contract.cost.isnot(None),
            extract("year", Contract.start_date) == year,
        )
        .all()
    )
    contracts_total = float(sum(float(c.cost) for c in contracts))

    maint_rows = (
        db.query(MaintenanceLog, MaintenanceTask.name)
        .join(MaintenanceTask, MaintenanceLog.task_id == MaintenanceTask.id)
        .filter(
            MaintenanceLog.cost.isnot(None),
            extract("year", MaintenanceLog.completed_at) == year,
        )
        .all()
    )
    maintenance_items = [
        MaintenanceExpenseItem(
            task_id=log.task_id,
            task_name=task_name,
            completed_at=log.completed_at,
            cost=float(log.cost),
        )
        for log, task_name in maint_rows
    ]
    maintenance_total = sum(item.cost for item in maintenance_items)

    return AnnualReport(
        year=year,
        utilities_total=utilities_total,
        utilities_breakdown=utilities_breakdown,
        projects_total=projects_total,
        projects=projects,
        contracts_total=contracts_total,
        contracts=contracts,
        maintenance_total=maintenance_total,
        maintenance_items=maintenance_items,
        grand_total=utilities_total + projects_total + contracts_total + maintenance_total,
    )
