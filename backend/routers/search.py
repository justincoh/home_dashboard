from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Vendor, Project, Contract, Utility, MaintenanceTask
from schemas import SearchResult

router = APIRouter()

LIMIT_PER_TYPE = 5


@router.get("", response_model=list[SearchResult])
def search(q: str = Query(min_length=2), db: Session = Depends(get_db)):
    term = f"%{q}%"
    results: list[SearchResult] = []

    vendors = (
        db.query(Vendor)
        .filter(Vendor.name.ilike(term) | Vendor.service_type.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(entity_type="vendor", id=v.id, name=v.name, subtitle=v.service_type)
        for v in vendors
    )

    projects = (
        db.query(Project)
        .filter(Project.name.ilike(term) | Project.description.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(
            entity_type="project", id=p.id, name=p.name,
            subtitle=p.status.value.replace("_", " ") if p.status else None,
        )
        for p in projects
    )

    contracts = (
        db.query(Contract)
        .filter(Contract.name.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(
            entity_type="contract", id=c.id, name=c.name,
            subtitle=c.type.value if c.type else None,
        )
        for c in contracts
    )

    utilities = (
        db.query(Utility)
        .filter(Utility.provider_name.ilike(term) | Utility.utility_type.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(entity_type="utility", id=u.id, name=u.provider_name, subtitle=u.utility_type)
        for u in utilities
    )

    tasks = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.name.ilike(term))
        .limit(LIMIT_PER_TYPE)
        .all()
    )
    results.extend(
        SearchResult(entity_type="maintenance", id=t.id, name=t.name, subtitle=t.frequency)
        for t in tasks
    )

    return results
