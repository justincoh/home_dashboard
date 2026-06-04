from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import MaintenanceTask, Project, Contract, Bill, Service, ProjectStatus
from schemas import DashboardData, DashboardBillOut
from datetime import date, timedelta

router = APIRouter()


@router.get("", response_model=DashboardData)
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    in_30_days = today + timedelta(days=30)
    in_90_days = today + timedelta(days=90)

    upcoming_maintenance = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.next_due <= in_90_days)
        .order_by(MaintenanceTask.next_due)
        .limit(10)
        .all()
    )

    active_projects = (
        db.query(Project)
        .filter(Project.status.in_([ProjectStatus.planned, ProjectStatus.in_progress]))
        .all()
    )

    expiring_contracts = (
        db.query(Contract)
        .filter(Contract.end_date != None, Contract.end_date <= in_30_days)
        .order_by(Contract.end_date)
        .limit(10)
        .all()
    )

    recent_bills = (
        db.query(Bill)
        .filter(Bill.entity_type == "service")
        .order_by(Bill.bill_date.desc())
        .limit(10)
        .all()
    )

    service_names = {
        s.id: s.provider_name
        for s in db.query(Service).filter(
            Service.id.in_([b.entity_id for b in recent_bills])
        )
    }

    recent_bills_out = [
        DashboardBillOut(
            id=b.id,
            entity_type=b.entity_type,
            entity_id=b.entity_id,
            bill_date=b.bill_date,
            amount=b.amount,
            usage_value=b.usage_value,
            usage_unit=b.usage_unit,
            entity_name=service_names.get(b.entity_id, ""),
        )
        for b in recent_bills
    ]

    return DashboardData(
        upcoming_maintenance=upcoming_maintenance,
        active_projects=active_projects,
        expiring_contracts=expiring_contracts,
        recent_bills=recent_bills_out,
    )
