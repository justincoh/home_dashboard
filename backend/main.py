import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from database import engine, Base
from routers import projects, maintenance, services, bills, contracts, vendors, quotes, files, dashboard, reports, search

# --- Migration: Utility/UtilityBill/MaintenanceLog -> Service/Bill ---
# Runs before create_all so renamed tables are not re-created empty.
tables = set(inspect(engine).get_table_names())

if "utilities" in tables and "services" not in tables:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE utilities RENAME TO services"))
        conn.execute(text("ALTER TABLE services RENAME COLUMN utility_type TO service_type"))

if "utility_bills" in tables and "bills" not in tables:
    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE bills ("
            "id INTEGER NOT NULL PRIMARY KEY, "
            "entity_type VARCHAR NOT NULL, "
            "entity_id INTEGER NOT NULL, "
            "bill_date DATE NOT NULL, "
            "amount NUMERIC(10, 2), "
            "usage_value NUMERIC(10, 2), "
            "usage_unit VARCHAR)"
        ))
        # Service bills keep their original ids.
        conn.execute(text(
            "INSERT INTO bills (id, entity_type, entity_id, bill_date, amount, usage_value, usage_unit) "
            "SELECT id, 'service', utility_id, bill_date, amount, usage_value, usage_unit FROM utility_bills"
        ))
        conn.execute(text(
            "UPDATE file_attachments SET entity_type = 'bill' WHERE entity_type = 'utility_bill'"
        ))
        # Maintenance completions become bills with fresh ids; remap their file attachments.
        log_rows = conn.execute(text(
            "SELECT id, task_id, completed_at, cost FROM maintenance_log ORDER BY id"
        )).fetchall()
        for row in log_rows:
            result = conn.execute(
                text(
                    "INSERT INTO bills (entity_type, entity_id, bill_date, amount) "
                    "VALUES ('maintenance_task', :task_id, :bill_date, :amount)"
                ),
                {"task_id": row.task_id, "bill_date": row.completed_at, "amount": row.cost},
            )
            conn.execute(
                text(
                    "UPDATE file_attachments SET entity_type = 'bill', entity_id = :new_id "
                    "WHERE entity_type = 'maintenance_log' AND entity_id = :old_id"
                ),
                {"new_id": result.lastrowid, "old_id": row.id},
            )
        conn.execute(text("DROP TABLE maintenance_log"))
        conn.execute(text("DROP TABLE utility_bills"))

Base.metadata.create_all(bind=engine)

# Migration: add recurring column to pre-existing maintenance_tasks tables.
maintenance_task_cols = [c["name"] for c in inspect(engine).get_columns("maintenance_tasks")]
if "recurring" not in maintenance_task_cols:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE maintenance_tasks ADD COLUMN recurring BOOLEAN DEFAULT 1"))

app = FastAPI(title="House Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vendors.router, prefix="/api/vendors", tags=["vendors"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(quotes.router, prefix="/api/quotes", tags=["quotes"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["maintenance"])
app.include_router(services.router, prefix="/api/services", tags=["services"])
app.include_router(bills.router, prefix="/api/bills", tags=["bills"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

# Serve built frontend in production
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
