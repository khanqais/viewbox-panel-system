import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    # On Vercel / AWS Lambda serverless, only /tmp is writable for SQLite
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        DATABASE_URL = "sqlite:////tmp/viewbox_fallback.db"
    else:
        DATABASE_URL = "sqlite:///./viewbox_fallback.db"

# Neon, Supabase, Heroku postgres:// -> postgresql:// compatibility for SQLAlchemy 2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")
engine_kwargs = {}
if not is_sqlite:
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
else:
    engine_kwargs = {
        "connect_args": {"check_same_thread": False}
    }

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()