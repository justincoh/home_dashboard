"""One-time migration: collapse Service + MaintenanceTask + Bill into LogEntry,
and merge Vendor + Service into Provider.

Idempotent-guarded: if a `providers` table already exists the script exits without
touching anything. Old tables are renamed to *_legacy (never dropped) so the owner can
verify before a separate, explicit cleanup step.

Run once:  python3 backend/migrate_to_log.py
Back up first:  cp house_dashboard.db house_dashboard_pre_log_migration.db
"""

from sqlalchemy import inspect, text

from database import engine


def run():
    tables = set(inspect(engine).get_table_names())

    if "providers" in tables:
        print("providers table already exists — migration already ran. Nothing to do.")
        return

    if "vendors" not in tables:
        raise SystemExit("Expected legacy 'vendors' table not found; aborting.")

    with engine.begin() as conn:
        # 1. Provider table (merge of vendors + services) ------------------------
        conn.execute(text(
            "CREATE TABLE providers ("
            "id INTEGER NOT NULL PRIMARY KEY, "
            "name VARCHAR NOT NULL, "
            "service_type VARCHAR NOT NULL, "
            "phone VARCHAR, "
            "email VARCHAR, "
            "account_number VARCHAR, "
            "contract_terms TEXT, "
            "notes TEXT)"
        ))

        # Vendors keep their ids so existing contracts/quotes FKs stay valid.
        conn.execute(text(
            "INSERT INTO providers (id, name, service_type, phone, email) "
            "SELECT id, name, service_type, phone, email FROM vendors"
        ))

        # Services fold in with fresh ids; record service_id -> provider_id.
        service_provider_map = {}
        services = conn.execute(text(
            "SELECT id, provider_name, service_type, account_number, contact_info, "
            "contract_terms, notes FROM services ORDER BY id"
        )).fetchall()
        for s in services:
            result = conn.execute(
                text(
                    "INSERT INTO providers "
                    "(name, service_type, phone, account_number, contract_terms, notes) "
                    "VALUES (:name, :stype, :phone, :acct, :terms, :notes)"
                ),
                {
                    "name": s.provider_name,
                    "stype": s.service_type,
                    "phone": s.contact_info,
                    "acct": s.account_number,
                    "terms": s.contract_terms,
                    "notes": s.notes,
                },
            )
            service_provider_map[s.id] = result.lastrowid

        # 2. Repoint contracts/quotes FK column: vendor_id -> provider_id --------
        conn.execute(text("ALTER TABLE contracts RENAME COLUMN vendor_id TO provider_id"))
        conn.execute(text("ALTER TABLE quotes RENAME COLUMN vendor_id TO provider_id"))

        # 3. Log entries table --------------------------------------------------
        conn.execute(text(
            "CREATE TABLE log_entries ("
            "id INTEGER NOT NULL PRIMARY KEY, "
            "entry_date DATE, "
            "title VARCHAR NOT NULL, "
            "description TEXT, "
            "category VARCHAR, "
            "provider_id INTEGER REFERENCES providers(id), "
            "project_id INTEGER REFERENCES projects(id), "
            "amount NUMERIC(10, 2), "
            "usage_value NUMERIC(10, 2), "
            "usage_unit VARCHAR, "
            "recurring BOOLEAN DEFAULT 0, "
            "frequency VARCHAR, "
            "next_due DATE, "
            "created_at DATETIME)"
        ))

        bill_logentry_map = {}

        # 3a. Service bills -> completion log entries.
        service_bills = conn.execute(text(
            "SELECT b.id, b.entity_id, b.bill_date, b.amount, b.usage_value, b.usage_unit, "
            "s.provider_name, s.service_type "
            "FROM bills b JOIN services s ON s.id = b.entity_id "
            "WHERE b.entity_type = 'service' ORDER BY b.id"
        )).fetchall()
        for b in service_bills:
            result = conn.execute(
                text(
                    "INSERT INTO log_entries "
                    "(entry_date, title, category, provider_id, amount, usage_value, "
                    "usage_unit, recurring) "
                    "VALUES (:d, :title, :cat, :pid, :amt, :uv, :uu, 0)"
                ),
                {
                    "d": b.bill_date,
                    "title": b.provider_name,
                    "cat": b.service_type,
                    "pid": service_provider_map[b.entity_id],
                    "amt": b.amount,
                    "uv": b.usage_value,
                    "uu": b.usage_unit,
                },
            )
            bill_logentry_map[b.id] = result.lastrowid

        # 3b. Maintenance bills -> completion log entries.
        maint_bills = conn.execute(text(
            "SELECT b.id, b.bill_date, b.amount, m.name "
            "FROM bills b JOIN maintenance_tasks m ON m.id = b.entity_id "
            "WHERE b.entity_type = 'maintenance_task' ORDER BY b.id"
        )).fetchall()
        for b in maint_bills:
            result = conn.execute(
                text(
                    "INSERT INTO log_entries "
                    "(entry_date, title, category, amount, recurring) "
                    "VALUES (:d, :title, 'maintenance', :amt, 0)"
                ),
                {"d": b.bill_date, "title": b.name, "amt": b.amount},
            )
            bill_logentry_map[b.id] = result.lastrowid

        # 3c. Maintenance tasks with NO bills -> one inert reminder row each.
        #     entry_date preserves any historical last_completed.
        orphan_tasks = conn.execute(text(
            "SELECT id, name, recurring, frequency, last_completed, next_due "
            "FROM maintenance_tasks "
            "WHERE id NOT IN (SELECT entity_id FROM bills WHERE entity_type='maintenance_task') "
            "ORDER BY id"
        )).fetchall()
        for t in orphan_tasks:
            conn.execute(
                text(
                    "INSERT INTO log_entries "
                    "(entry_date, title, category, recurring, frequency, next_due) "
                    "VALUES (:d, :title, 'maintenance', :rec, :freq, :due)"
                ),
                {
                    "d": t.last_completed,
                    "title": t.name,
                    "rec": t.recurring,
                    "freq": t.frequency or None,
                    "due": t.next_due,
                },
            )

        # 4. Remap polymorphic file attachments: 'bill' -> 'log_entry' ----------
        #    (Only 'bill' and 'contract' attachment types exist; contract stays.)
        for old_bill_id, new_log_id in bill_logentry_map.items():
            conn.execute(
                text(
                    "UPDATE file_attachments SET entity_type='log_entry', entity_id=:new "
                    "WHERE entity_type='bill' AND entity_id=:old"
                ),
                {"new": new_log_id, "old": old_bill_id},
            )

        # 5. Retire legacy tables (renamed, not dropped) ------------------------
        conn.execute(text("ALTER TABLE vendors RENAME TO vendors_legacy"))
        conn.execute(text("ALTER TABLE services RENAME TO services_legacy"))
        conn.execute(text("ALTER TABLE maintenance_tasks RENAME TO maintenance_tasks_legacy"))
        conn.execute(text("ALTER TABLE bills RENAME TO bills_legacy"))

        # Report
        providers_n = conn.execute(text("SELECT count(*) FROM providers")).scalar()
        logentries_n = conn.execute(text("SELECT count(*) FROM log_entries")).scalar()
        remapped = conn.execute(text(
            "SELECT count(*) FROM file_attachments WHERE entity_type='log_entry'"
        )).scalar()
        print(f"providers:   {providers_n}  (expected vendors+services)")
        print(f"log_entries: {logentries_n}  (expected bills + bill-less tasks)")
        print(f"file_attachments remapped to log_entry: {remapped}")
        print("Legacy tables renamed *_legacy (not dropped). Migration complete.")


if __name__ == "__main__":
    run()
