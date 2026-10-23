from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool
from .config import settings
import os

# Get the absolute path to the database
db_path = settings.database_url
if db_path.startswith('sqlite:'):
    # Extract the path from the URL
    db_file = db_path.replace('sqlite:///', '')
    if not os.path.isabs(db_file):
        # Make it absolute relative to the backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_file = os.path.join(backend_dir, db_file)

    # Ensure the directory exists and is writable
    db_dir = os.path.dirname(db_file)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, mode=0o755)

    # Set proper permissions on the database directory
    os.chmod(db_dir, 0o755)

    # Use absolute path in the database URL
    db_url = f'sqlite:///{db_file}'
else:
    db_url = db_path

# Database engine with SQLite-specific settings
if db_url.startswith('sqlite:'):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False, "timeout": 30},
        poolclass=StaticPool,
        echo=False
    )

    # Enable foreign keys and WAL mode for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()
else:
    engine = create_engine(
        db_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()