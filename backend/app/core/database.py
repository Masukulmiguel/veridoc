from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

_db_url = settings.DATABASE_URL

_connect_args: dict = {}
if _db_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(_db_url, connect_args=_connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
