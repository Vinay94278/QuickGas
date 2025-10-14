from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL
NEON_CONNECTION_STRING = settings.NEON_CONNECTION_STRING

from sqlalchemy.pool import NullPool

engine = create_engine(
    NEON_CONNECTION_STRING,
    echo=False,
    future=True,
    pool_size=10,       # max connections in pool
    max_overflow=5      # extra connections allowed
)

# engine = create_engine(
#     DATABASE_URL,
#     connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
#     echo=False,
#     future=True
# )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()