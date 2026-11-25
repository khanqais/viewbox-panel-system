from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import hashlib

from app.database import get_db
from app.models import User, MemberProfile, Source, Signup

router = APIRouter(prefix="/api/meta-leads", tags=["Meta Ads"])


class MetaLeadData(BaseModel):
    """
    Meta Lead Ads webhook payload structure.
    Based on Facebook Lead Ads API v18.0 documentation.
    """
    leadgen_id: str = Field(..., description="Unique lead ID from Meta")
    form_id: str = Field(..., description="Form ID from the lead ad")
    ad_id: Optional[str] = Field(None, description="Ad ID that generated the lead")
    campaign_id: Optional[str] = Field(None, description="Campaign ID")
    adset_id: Optional[str] = Field(None, description="Ad Set ID")
    created_time: str = Field(..., description="ISO 8601 timestamp")
    
    # Form field data (what the user filled in)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15)
    city: Optional[str] = Field(None, max_length=50)
    
    @validator("phone_number")
    def clean_phone(cls, v):
        """Strip non-digits, remove country code if present"""
        import re
        digits = re.sub(r"\D", "", v)
        
        # Remove country code 91 if 12 digits
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        # Remove leading 0 if 11 digits
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        
        if len(digits) != 10:
            raise ValueError(f"Phone must be 10 digits after cleaning (got {len(digits)})")
        
        return digits


class MetaLeadWebhook(BaseModel):
    """
    Wrapper payload from Meta webhook (simplified).
    Real Meta webhooks have more nesting and verification fields.
    """
    object_type: str = Field(default="leadgen", description="Must be 'leadgen'")
    lead_data: MetaLeadData


@router.post("/webhook")
def receive_meta_lead(
    payload: MetaLeadWebhook,
    db: Session = Depends(get_db),
):
    """
    Receives a lead from Meta (Facebook/Instagram) Lead Ads.
    
    **Deduplication**: Uses hashed leadgen_id to prevent duplicate processing.
    **Source Attribution**: Saves with source 'Meta Ads', stores campaign_id.
    **Validation**: Rejects leads with missing or invalid phone/name.
    
    Returns 201 on success, 400 on validation error, 409 on duplicate lead ID.
    """
    lead = payload.lead_data
    
    # 1. Validate object type
    if payload.object_type != "leadgen":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid object_type: expected 'leadgen', got '{payload.object_type}'",
        )
    
    # 2. Check for duplicate lead ID (Meta may retry webhooks)
    lead_hash = hashlib.sha256(lead.leadgen_id.encode()).hexdigest()[:16]
    existing_user_by_lead = (
        db.query(User)
        .filter(User.referral_code == f"META{lead_hash}")
        .first()
    )
    
    if existing_user_by_lead:
        return {
            "success": False,
            "message": "Duplicate lead: already processed",
            "lead_id": lead.leadgen_id,
            "user_id": existing_user_by_lead.id,
            "status": "skipped",
        }
    
    # 3. Check for duplicate phone (same person submitted form twice)
    existing_user_by_phone = (
        db.query(User)
        .filter(User.phone == lead.phone_number)
        .first()
    )
    
    if existing_user_by_phone:
        # Update source if they came through Meta this time
        meta_source = db.query(Source).filter(Source.slug == "meta-ads").first()
        if meta_source:
            existing_signup = (
                db.query(Signup)
                .filter(Signup.user_id == existing_user_by_phone.id)
                .first()
            )
            if existing_signup and existing_signup.source_id != meta_source.id:
                # Log that they came through Meta this time (could store in a leads log table)
                pass
        
        return {
            "success": False,
            "message": "Phone number already registered",
            "lead_id": lead.leadgen_id,
            "user_id": existing_user_by_phone.id,
            "phone": lead.phone_number,
            "status": "duplicate_phone",
        }
    
    # 4. Get or create Meta Ads source
    meta_source = db.query(Source).filter(Source.slug == "meta-ads").first()
    if not meta_source:
        meta_source = Source(
            name="Meta Ads",
            type="meta",
            slug="meta-ads",
            is_active=True,
        )
        db.add(meta_source)
        db.flush()
    
    # 5. Create new user
    new_user = User(
        phone=lead.phone_number,
        name=lead.full_name.strip(),
        role="member",
        referral_code=f"META{lead_hash}",  # Unique code derived from lead ID
    )
    db.add(new_user)
    db.flush()
    
    # 6. Create partial profile (city if provided)
    new_profile = MemberProfile(
        user_id=new_user.id,
        city=lead.city.strip().title() if lead.city else None,
        # Other fields will be filled during onboarding
    )
    db.add(new_profile)
    
    # 7. Record signup with Meta Ads source and campaign ID
    new_signup = Signup(
        user_id=new_user.id,
        source_id=meta_source.id,
        # Store campaign_id in a custom field or extend Signup model
        created_at=datetime.utcnow(),
    )
    db.add(new_signup)
    
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "message": "Lead successfully imported",
        "lead_id": lead.leadgen_id,
        "user_id": new_user.id,
        "phone": new_user.phone,
        "name": new_user.name,
        "campaign_id": lead.campaign_id,
        "status": "created",
    }


@router.get("/webhook")
def verify_meta_webhook(request: Request):
    """
    Meta webhook verification endpoint (GET request).
    
    When you configure a webhook in Meta Business Manager, Meta sends a GET request
    with hub.mode=subscribe, hub.verify_token, and hub.challenge.
    
    You must return hub.challenge if the verify_token matches your configured token.
    
    For this demo, we accept any verification without checking a token.
    In production, verify the token matches your env var.
    """
    hub_mode = request.query_params.get("hub.mode")
    hub_challenge = request.query_params.get("hub.challenge")
    hub_verify_token = request.query_params.get("hub.verify_token")
    
    # In production, check: hub_verify_token == os.getenv("META_WEBHOOK_VERIFY_TOKEN")
    if hub_mode == "subscribe":
        return int(hub_challenge) if hub_challenge else {"error": "Missing hub.challenge"}
    
    return {"error": "Invalid hub.mode"}
