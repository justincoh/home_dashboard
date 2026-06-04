from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models import Bill, Service, Project, Contract, MaintenanceTask
from schemas import AnnualReport, ServiceExpenseBreakdown, MaintenanceExpenseItem
from datetime import date

router = APIRouter()


@router.get("/annual", response_model=AnnualReport)
def get_annual_report(year: int = Query(default_factory=lambda: date.today().year), db: Session = Depends(get_db)):
    service_rows = (
        db.query(
            Service.id,
            Service.provider_name,
            Service.service_type,
            func.sum(Bill.amount).label("total"),
        )
        .join(Bill, (Bill.entity_type == "service") & (Bill.entity_id == Service.id))
        .filter(extract("year", Bill.bill_date) == year)
        .group_by(Service.id)
        .all()
    )

    services_breakdown = [
        ServiceExpenseBreakdown(
            service_id=row.id,
            provider_name=row.provider_name,
            service_type=row.service_type,
            total=float(row.total or 0),
        )
        for row in service_rows
    ]
    services_total = sum(s.total for s in services_breakdown)

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
        db.query(Bill, MaintenanceTask.name)
        .join(MaintenanceTask, Bill.entity_id == MaintenanceTask.id)
        .filter(
            Bill.entity_type == "maintenance_task",
            Bill.amount.isnot(None),
            extract("year", Bill.bill_date) == year,
        )
        .all()
    )
    maintenance_items = [
        MaintenanceExpenseItem(
            task_id=bill.entity_id,
            task_name=task_name,
            completed_at=bill.bill_date,
            cost=float(bill.amount),
        )
        for bill, task_name in maint_rows
    ]
    maintenance_total = sum(item.cost for item in maintenance_items)

    return AnnualReport(
        year=year,
        services_total=services_total,
        services_breakdown=services_breakdown,
        projects_total=projects_total,
        projects=projects,
        contracts_total=contracts_total,
        contracts=contracts,
        maintenance_total=maintenance_total,
        maintenance_items=maintenance_items,
        grand_total=services_total + projects_total + contracts_total + maintenance_total,
    )
