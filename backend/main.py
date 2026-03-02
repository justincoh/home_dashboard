from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import projects, maintenance, utilities, contracts, vendors, quotes, files, dashboard
import os

Base.metadata.create_all(bind=engine)

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
app.include_router(utilities.router, prefix="/api/utilities", tags=["utilities"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

# Serve built frontend in production
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
