from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

if not database_url.startswith("postgresql://"):
    raise RuntimeError("DATABASE_URL must be a PostgreSQL connection string for Supabase.")

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=300
)

with engine.connect():
    pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
