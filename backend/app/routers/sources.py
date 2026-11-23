from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Source

router = APIRouter(prefix="/api/sources", tags=["Sources"])


@router.get("/")
def get_sources(db: Session = Depends(get_db)):
    return db.query(Source).filter(Source.is_active == True).all()
