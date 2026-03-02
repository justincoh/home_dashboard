from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import MaintenanceTask, Project, Contract, UtilityBill, ProjectStatus
from schemas import DashboardData
from datetime import date, timedelta

router = APIRouter()


@router.get("", response_model=DashboardData)
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    in_30_days = today + timedelta(days=30)

    upcoming_maintenance = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.next_due <= in_30_days)
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
        db.query(UtilityBill)
        .order_by(UtilityBill.bill_date.desc())
        .limit(10)
        .all()
    )

    return DashboardData(
        upcoming_maintenance=upcoming_maintenance,
        active_projects=active_projects,
        expiring_contracts=expiring_contracts,
        recent_bills=recent_bills,
    )
