from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re
from app.database import get_db
from app.models import Source
from app.schemas import SourceCreateRequest, SourceResponse

router = APIRouter(prefix="/api/sources", tags=["Sources"])

DEFAULT_SOURCES = [
    {"name": "WhatsApp - Mumbai Group", "type": "whatsapp", "slug": "wa-mumbai"},
    {"name": "WhatsApp - Delhi Group", "type": "whatsapp", "slug": "wa-delhi"},
    {"name": "WhatsApp - Bangalore Group", "type": "whatsapp", "slug": "wa-bangalore"},
    {"name": "Staff Outreach", "type": "staff", "slug": "staff-outreach"},
    {"name": "Instagram Post", "type": "instagram", "slug": "instagram-post"},
    {"name": "Facebook Post", "type": "facebook", "slug": "facebook-post"},
    {"name": "Website Direct", "type": "website", "slug": "website-direct"},
    {"name": "Meta Ads", "type": "meta_ads", "slug": "meta-ads"},
    {"name": "Friend / Member Referral", "type": "referral", "slug": "member-referral"},
    {"name": "Other / Word of Mouth", "type": "other", "slug": "other"},
]


def seed_default_sources(db: Session):
    for s in DEFAULT_SOURCES:
        exists = db.query(Source).filter(Source.slug == s["slug"]).first()
        if not exists:
            new_source = Source(
                name=s["name"],
                type=s["type"],
                slug=s["slug"],
                is_active=True,
            )
            db.add(new_source)
    db.commit()


@router.get("/", response_model=List[SourceResponse])
def get_sources(db: Session = Depends(get_db)):
    # Auto-seed if table is empty
    count = db.query(Source).count()
    if count == 0:
        seed_default_sources(db)
    return db.query(Source).filter(Source.is_active == True).order_by(Source.id.asc()).all()


@router.post("/", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
def create_source(payload: SourceCreateRequest, db: Session = Depends(get_db)):
    clean_slug = re.sub(r"[^a-zA-Z0-9_-]", "-", payload.slug.strip().lower())
    existing = db.query(Source).filter(Source.slug == clean_slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Source with slug '{clean_slug}' already exists",
        )

    new_source = Source(
        name=payload.name.strip(),
        type=payload.type.strip().lower(),
        slug=clean_slug,
        is_active=True,
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    return new_source
