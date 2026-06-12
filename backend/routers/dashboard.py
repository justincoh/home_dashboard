from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import LogEntry, Project, Contract, Provider, ProjectStatus
from schemas import DashboardData, DashboardLogEntry
from datetime import date, timedelta

router = APIRouter()


@router.get("", response_model=DashboardData)
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    in_30_days = today + timedelta(days=30)
    in_90_days = today + timedelta(days=90)

    upcoming_reminders = (
        db.query(LogEntry)
        .filter(LogEntry.next_due.isnot(None), LogEntry.next_due <= in_90_days)
        .order_by(LogEntry.next_due)
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

    recent = (
        db.query(LogEntry)
        .filter(LogEntry.entry_date.isnot(None))
        .order_by(LogEntry.entry_date.desc(), LogEntry.id.desc())
        .limit(10)
        .all()
    )
    provider_names = {
        p.id: p.name
        for p in db.query(Provider).filter(
            Provider.id.in_([e.provider_id for e in recent if e.provider_id])
        )
    }
    recent_entries = [
        DashboardLogEntry(
            **{c.name: getattr(e, c.name) for c in LogEntry.__table__.columns},
            provider_name=provider_names.get(e.provider_id),
        )
        for e in recent
    ]

    return DashboardData(
        upcoming_reminders=upcoming_reminders,
        active_projects=active_projects,
        expiring_contracts=expiring_contracts,
        recent_entries=recent_entries,
    )
