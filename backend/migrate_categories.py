"""One-time migration: promote LogEntry.category (free-text string) to a real
table-backed `categories` row referenced by LogEntry.category_id.

Idempotent-guarded: if a `categories` table already exists the script exits.
Requires SQLite >= 3.35 for ALTER TABLE ... DROP COLUMN (3.42 in this env).

Run once:  python3 backend/migrate_categories.py
Back up first:  cp house_dashboard.db house_dashboard_pre_categories.db
"""

from sqlalchemy import inspect, text

from database import engine


def run():
    tables = set(inspect(engine).get_table_names())
    if "categories" in tables:
        print("categories table already exists — migration already ran. Nothing to do.")
        return
    if "log_entries" not in tables:
        raise SystemExit("Expected 'log_entries' table not found; aborting.")

    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE categories ("
            "id INTEGER NOT NULL PRIMARY KEY, "
            "name VARCHAR NOT NULL UNIQUE)"
        ))

        # Seed from existing distinct, non-empty category strings.
        conn.execute(text(
            "INSERT INTO categories (name) "
            "SELECT DISTINCT category FROM log_entries "
            "WHERE category IS NOT NULL AND category != ''"
        ))

        conn.execute(text(
            "ALTER TABLE log_entries ADD COLUMN category_id INTEGER REFERENCES categories(id)"
        ))

        conn.execute(text(
            "UPDATE log_entries SET category_id = "
            "(SELECT id FROM categories WHERE categories.name = log_entries.category) "
            "WHERE category IS NOT NULL AND category != ''"
        ))

        # Drop the now-redundant free-text column.
        conn.execute(text("ALTER TABLE log_entries DROP COLUMN category"))

        cats = conn.execute(text("SELECT count(*) FROM categories")).scalar()
        linked = conn.execute(text(
            "SELECT count(*) FROM log_entries WHERE category_id IS NOT NULL"
        )).scalar()
        print(f"categories: {cats}")
        print(f"log_entries linked to a category: {linked}")
        print("Dropped log_entries.category string column. Migration complete.")


if __name__ == "__main__":
    run()
