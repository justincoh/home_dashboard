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

**Search**: Global search bar in nav (`SearchBar.tsx`) with 300ms debounce. Backend `GET /api/search?q=` searches across providers, projects, contracts, and log entries (case-insensitive LIKE, 5 results per entity type).

**Reports**: `GET /api/reports/annual?year=` aggregates log-entry amounts for the year, broken down `by_category`, `by_provider`, and `by_project`, plus contracts with cost. `grand_total = log_total + contracts_total` (project spend lives in log entries, so projects are a breakdown, not a separate additive bucket). Router in `backend/routers/reports.py`.

## Key Conventions

- **Type imports**: Use `import type { Foo }` separate from value imports (required by Vite 5's module handling)
- **Forms**: All create/edit forms use a `Modal` component (`components/Modal.tsx`), not inline forms
- **Styling**: Tailwind utility classes only, no custom CSS files
- **Enums**: `ProjectStatus` (planned/in_progress/done), `ContractType` (contract/warranty)
- **Backend routers**: All follow the same pattern — list, get, create, update, delete. Status 201 for creates, 204 for deletes
- **LogEntry**: the central object — one thing that happened on a date (`entry_date`, nullable for pure reminders). Optional `amount` (cost-free events like "cleaned dryer vent" are a LogEntry with `amount` NULL), `category_id`, `provider_id`, `project_id`, `usage_value`/`usage_unit`. Replaces the former `Service`/`MaintenanceTask`/`Bill` trio. Router `backend/routers/log_entries.py`, home page `/` (`LogPage`), detail `/log/:id`. `GET /api/log-entries` filters by `category_id`/`provider_id`/`project_id`/`year`/`limit`.
- **Category**: table-backed (`categories`, unique `name`), referenced by `LogEntry.category_id` (nullable). Full CRUD at `/api/categories` (`backend/routers/categories.py`), managed at `/categories` (`CategoriesPage`); log forms also offer inline "+ New category…". Deleting a category nulls (detaches) its log entries, not deletes them. Not free-text — was migrated from a free-text string column via `backend/migrate_categories.py`.
- **Reminders are inert**: a LogEntry with `recurring=true` carries `frequency` (free-text, e.g. `6m`, `1y`) and `next_due` for display only — there is no scheduling engine and no `/complete` endpoint. Recurrence is just stored so the app is a single pane of glass; the calendar is the real reminder system.
- **Provider**: merge of the former `Vendor` + `Service` — any company/person (utility, contractor, lawn care…). `service_type` is free-text. Referenced by `Contract.provider_id`, `Quote.provider_id`, `LogEntry.provider_id`. Router `backend/routers/providers.py`, pages `/providers`. Deleting a provider detaches (nulls) its log entries rather than deleting them.
- **Polymorphic deletes (no FK cascade)**: `LogEntry` delete manually deletes its `FileAttachment` rows; do it via ORM (`db.delete(att)`), not bulk `.delete()`, so the `FileData` blob cascades.
- **File attachments**: Polymorphic via `entity_type` + `entity_id` on `FileAttachment`; blob stored in `FileData` (`backend/routers/files.py`). For a log entry's attachments use `entity_type='log_entry'` with the LogEntry id.
- **Schema migration**: the Service/Bill/Maintenance → Provider/LogEntry collapse was a one-shot raw-SQL migration `backend/migrate_to_log.py`. Old tables were renamed `*_legacy` (vendors/services/maintenance_tasks/bills), NOT dropped — drop only on explicit instruction.

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
