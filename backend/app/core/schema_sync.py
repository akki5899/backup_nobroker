"""Idempotent schema reconciliation for tables that predate newer columns.

`Base.metadata.create_all()` creates missing *tables* but never adds new
*columns* to a table that already exists. On long-lived databases (e.g. the
Render Postgres instance) this causes drift: the SQLAlchemy model gains columns
(amenities, connectivity flags, ...) that the live table is missing, and every
query that selects them fails with `UndefinedColumn`.

This module inspects the live table and adds any boolean columns present in the
model but absent in the database, using `ADD COLUMN IF NOT EXISTS` so it is safe
to run on every startup. It only targets Boolean columns with a default, which
covers the amenity/connectivity flags that have caused drift; richer types are
left to Alembic migrations.
"""
import logging

from sqlalchemy import Boolean, inspect, text
from sqlalchemy.engine import Engine

from ..models.property import Property

logger = logging.getLogger(__name__)


def _missing_boolean_columns(engine: Engine, model) -> list[str]:
    table = model.__tablename__
    inspector = inspect(engine)
    if not inspector.has_table(table):
        # Fresh DB: create_all will build the table with every column.
        return []
    existing = {col["name"] for col in inspector.get_columns(table)}
    missing = []
    for column in model.__table__.columns:
        if column.name in existing:
            continue
        if isinstance(column.type, Boolean):
            missing.append(column.name)
    return missing


def _ensure_moderation_status_column(engine: Engine) -> None:
    """Add the `moderation_status` column to an existing properties table.

    New listings are created as "pending", but rows that predate this column
    were already live, so we backfill them to "approved" — otherwise every
    existing listing would silently disappear from public search. Works on both
    SQLite (local dev) and Postgres (Render). Idempotent and non-fatal.
    """
    table = Property.__tablename__
    column = "moderation_status"
    try:
        inspector = inspect(engine)
        if not inspector.has_table(table):
            # Fresh DB: create_all builds the column with its model default.
            return
        existing = {col["name"] for col in inspector.get_columns(table)}
        if column in existing:
            return
    except Exception:  # pragma: no cover - inspection failure is non-fatal
        logger.exception("Moderation column inspection failed; skipping")
        return

    logger.info("Schema sync: adding %s.%s (backfilling existing rows to 'approved')", table, column)
    try:
        with engine.begin() as conn:
            # Add the column defaulting existing rows to 'approved' so currently
            # live listings stay visible. SQLite and Postgres both accept this form.
            conn.execute(
                text(
                    f"ALTER TABLE {table} "
                    f"ADD COLUMN {column} VARCHAR(20) NOT NULL DEFAULT 'approved'"
                )
            )
    except Exception:  # pragma: no cover - migration failure is non-fatal
        logger.exception("Failed to add %s.%s", table, column)


def sync_schema(engine: Engine) -> None:
    """Reconcile columns added to the Property model after its table was created.

    Adds the `moderation_status` column, then backfills any missing boolean
    amenity/connectivity columns. Runs on both SQLite (local dev DBs that
    predate these columns) and Postgres (Render). `_missing_boolean_columns`
    already narrows to columns the live table lacks, so SQLite — which has no
    `ADD COLUMN IF NOT EXISTS` — can safely use a plain `ADD COLUMN`. On any
    error this is logged but not raised, so a DB hiccup cannot block startup.
    """
    _ensure_moderation_status_column(engine)

    try:
        missing = _missing_boolean_columns(engine, Property)
    except Exception:  # pragma: no cover - inspection failure is non-fatal
        logger.exception("Schema sync inspection failed; skipping")
        return

    if not missing:
        return

    is_postgres = engine.dialect.name == "postgresql"
    table = Property.__tablename__
    logger.info("Schema sync: adding %d missing columns to %s: %s", len(missing), table, missing)
    try:
        with engine.begin() as conn:
            for name in missing:
                if is_postgres:
                    stmt = f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS "{name}" BOOLEAN NOT NULL DEFAULT FALSE'
                else:
                    # SQLite: plain ADD COLUMN (only missing columns reach here).
                    stmt = f'ALTER TABLE {table} ADD COLUMN "{name}" BOOLEAN NOT NULL DEFAULT 0'
                conn.execute(text(stmt))
        logger.info("Schema sync complete for %s", table)
    except Exception:  # pragma: no cover - migration failure is non-fatal
        logger.exception("Schema sync failed adding boolean columns to %s", table)
