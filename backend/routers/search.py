from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Vendor, Project, Contract, Utility, MaintenanceTask

router = APIRouter()

LIMIT_PER_TYPE = 5


@router.get("")
def search(q: str = Query(min_length=2), db: Session = Depends(get_db)):
    term = f"%{q}%"
    results = []

    # Vendors
    vendors = (
        db.query(Vendor)
        .filter(Vendor.name.ilike(term) | Vendor.service_type.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    for v in vendors:
        results.append({
            "entity_type": "vendor",
            "id": v.id,
            "name": v.name,
            "subtitle": v.service_type,
        })

    # Projects
    projects = (
        db.query(Project)
        .filter(Project.name.ilike(term) | Project.description.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    for p in projects:
        results.append({
            "entity_type": "project",
            "id": p.id,
            "name": p.name,
            "subtitle": p.status.value.replace("_", " ") if p.status else None,
        })

    # Contracts
    contracts = (
        db.query(Contract)
        .filter(Contract.name.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    for c in contracts:
        results.append({
            "entity_type": "contract",
            "id": c.id,
            "name": c.name,
            "subtitle": c.type.value if c.type else None,
        })

    # Utilities
    utilities = (
        db.query(Utility)
        .filter(Utility.provider_name.ilike(term) | Utility.utility_type.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    for u in utilities:
        results.append({
            "entity_type": "utility",
            "id": u.id,
            "name": u.provider_name,
            "subtitle": u.utility_type,
        })

    # Maintenance tasks
    tasks = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.name.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    for t in tasks:
        results.append({
            "entity_type": "maintenance",
            "id": t.id,
            "name": t.name,
            "subtitle": t.frequency,
        })

    return results
