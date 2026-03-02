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

**Routing**: React Router v7 with `Layout` component wrapping all routes. Each entity has a list page (`/entities`) and detail page (`/entities/:id`).

## Key Conventions

- **Type imports**: Use `import type { Foo }` separate from value imports (required by Vite 5's module handling)
- **Forms**: All create/edit forms use a `Modal` component (`components/Modal.tsx`), not inline forms
- **File attachments**: Polymorphic via `entity_type` + `entity_id` on `FileAttachment` model. Files stored in `uploads/` with UUID names
- **Styling**: Tailwind utility classes only, no custom CSS files
- **Enums**: `ProjectStatus` (planned/in_progress/done), `ContractType` (contract/warranty), `Frequency` (monthly/quarterly/semi_annual/annual)
- **Backend routers**: All follow the same pattern — list, get, create, update, delete. Status 201 for creates, 204 for deletes
- **Cascade deletes**: `Utility` → `UtilityBill` via SQLAlchemy relationship cascade

## Node Version

Requires Node.js 18, 20, or >=22. Vite 5 is used for compatibility (Node 21 is not supported by Vite 7).
