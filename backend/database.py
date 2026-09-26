import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# On Render free tier, SQLite is ephemeral (wiped on restart).
# Use DATABASE_URL for PostgreSQL in production, fallback to SQLite for local dev.
_raw_url = os.getenv("DATABASE_URL", "sqlite:///./interview_simulator.db")
# Render PostgreSQL URLs use postgres:// but SQLAlchemy requires postgresql://
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql://", 1)
SQLALCHEMY_DATABASE_URL = _raw_url

_connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=_connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
