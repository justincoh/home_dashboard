# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

```bash
./run.sh          # starts both backend and frontend
```

- Backend (FastAPI): http://localhost:8000 — API docs at http://localhost:8000/docs
- Frontend (Vite dev): http://localhost:5173 — proxies `/api` to backend

Manual startup:
- `cd backend && uvicorn main:app --reload`
- `cd frontend && npm run dev`

## Build & Lint

- `cd frontend && npm run build` — TypeScript check + Vite production build
- `cd frontend && npm run lint` — ESLint
- `cd frontend && npx tsc --noEmit` — type check only

## Architecture

**Backend**: FastAPI + SQLAlchemy + SQLite (`house_dashboard.db` in project root, auto-created on first run). Each entity has a router in `backend/routers/` following standard REST CRUD. All routes use `Depends(get_db)` for session injection. Pydantic v2 schemas in `backend/schemas.py` use `model_config = {"from_attributes": True}`.

**Frontend**: React 19 + TypeScript + Vite 5 + Tailwind CSS v4. All API calls go through `frontend/src/api/client.ts` which exports a single `api` object with typed methods. Pages live in `frontend/src/pages/`, shared components in `frontend/src/components/`.

**Routing**: React Router v7 with `Layout` component wrapping all routes. Each entity has a list page (`/entities`) and detail page (`/entities/:id`). Additional pages: `/reports` (annual expense report).

**Search**: Global search bar in nav (`SearchBar.tsx`) with 300ms debounce. Backend `GET /api/search?q=` searches across vendors, projects, contracts, services, and maintenance tasks (case-insensitive LIKE, 5 results per entity type).

**Reports**: `GET /api/reports/annual?year=` aggregates service bills (grouped by provider), projects with actual_cost, contracts with cost, and maintenance bills for a given year. Router in `backend/routers/reports.py`.

## Key Conventions

- **Type imports**: Use `import type { Foo }` separate from value imports (required by Vite 5's module handling)
- **Forms**: All create/edit forms use a `Modal` component (`components/Modal.tsx`), not inline forms
- **File attachments**: Polymorphic via `entity_type` + `entity_id` on `FileAttachment` model. Files stored in `uploads/` with UUID names
- **Styling**: Tailwind utility classes only, no custom CSS files
- **Enums**: `ProjectStatus` (planned/in_progress/done), `ContractType` (contract/warranty)
- **Maintenance frequency**: Free-text interval format (e.g. `3d`, `2w`, `6m`, `1y`) — not an enum. Parsed by regex in `backend/routers/maintenance.py`
- **Backend routers**: All follow the same pattern — list, get, create, update, delete. Status 201 for creates, 204 for deletes
- **Service**: `Service` (formerly `Utility`) is any recurring provider relationship — utility, lawn care, pest control, etc. `service_type` is free-text. Router `backend/routers/services.py`, pages `/services`.
- **Bill**: `Bill` is a polymorphic cost record (`entity_type` ∈ `service` | `maintenance_task`, plus `entity_id`) — same pattern as `FileAttachment`. There is no FK cascade; `delete` routes for `Service` and `MaintenanceTask` manually delete matching `Bill` rows. Generic CRUD at `/api/bills` (`backend/routers/bills.py`). `amount` is nullable (a cost-free maintenance completion is a Bill with `amount` NULL).
- **Maintenance completions**: a completion = a `Bill` with `entity_type='maintenance_task'`. `POST /api/maintenance/{id}/complete` creates the Bill and advances `next_due`. Editing/deleting a maintenance Bill via `/api/bills` resyncs the task's `last_completed` from `max(Bill.bill_date)` (in `bills.py`), but does not touch `next_due`. `last_completed` is therefore derived from Bill history.
- **Maintenance types**: `MaintenanceTask` has a `recurring` boolean (default True). One-time tasks have no frequency or next_due. Frequency is only validated/used for recurring tasks.
- **File attachments for bills**: use `entity_type='bill'` with the Bill id (both service and maintenance bills).

## Database

- **Schema is locked.** Never drop or recreate the database.
- All schema changes must use migrations (ALTER TABLE or similar) to preserve existing data.
- Only drop records if the user explicitly asks for it.

### Monthly Backup

At the start of each session, check if the last backup is more than 1 month old. If so, automatically create a backup:

```bash
cp house_dashboard.db house_dashboard_YYYYMMDD.db
```

Then update the "Last backup" date below. Do not delete old backups.

**Last backup: 2026-05-22**

## Python

- Always use `python3`, never `python`.

## Node Version

Requires Node.js 18, 20, or >=22. Vite 5 is used for compatibility (Node 21 is not supported by Vite 7).
