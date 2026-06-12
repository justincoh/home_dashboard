import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import projects, log_entries, contracts, providers, quotes, files, dashboard, reports, search

# Schema migrations are handled by standalone scripts (see backend/migrate_to_log.py).
# create_all only fills in any tables missing entirely; it never alters existing ones.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="House Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router, prefix="/api/providers", tags=["providers"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(quotes.router, prefix="/api/quotes", tags=["quotes"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])
app.include_router(log_entries.router, prefix="/api/log-entries", tags=["log-entries"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

# Serve built frontend in production
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
