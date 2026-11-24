from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import secrets

from app.database import get_db
from app.models import User, MemberProfile, Source, Signup, Referral, SignupLink
from app.auth import get_current_user
from app.schemas import ProfileSubmitRequest

router = APIRouter(prefix="/api/members", tags=["Members"])


def generate_referral_code(user_id: int) -> str:
    suffix = secrets.token_hex(2).upper()
    return f"VB{user_id:03d}{suffix}"


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ensure user has a personal referral code
    if not current_user.referral_code:
        current_user.referral_code = generate_referral_code(current_user.id)
        db.commit()
        db.refresh(current_user)

    profile = (
        db.query(MemberProfile)
        .filter(MemberProfile.user_id == current_user.id)
        .first()
    )

    # Check signup attribution
    signup = db.query(Signup).filter(Signup.user_id == current_user.id).first()
    source_name = None
    if signup and signup.source_id:
        src = db.query(Source).filter(Source.id == signup.source_id).first()
        if src:
            source_name = src.name

    return {
        "id": current_user.id,
        "phone": current_user.phone,
        "name": current_user.name,
        "role": current_user.role,
        "referral_code": current_user.referral_code,
        "referral_link": f"/login?ref={current_user.referral_code}",
        "has_profile": profile is not None,
        "source": source_name,
        "profile": {
            "date_of_birth": (
                profile.date_of_birth.isoformat()
                if profile and profile.date_of_birth
                else None
            ),
            "gender": profile.gender if profile else None,
            "city": profile.city if profile else None,
            "income_range": profile.income_range if profile else None,
            "interests": [
                item.strip()
                for item in profile.interests.split(",")
                if item.strip()
            ]
            if profile and profile.interests
            else [],
        }
        if profile
        else None,
    }


@router.post("/profile")
def submit_profile(
    payload: ProfileSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Update user name
    clean_name = payload.name.strip()
    current_user.name = clean_name
    if not current_user.referral_code:
        current_user.referral_code = generate_referral_code(current_user.id)

    # 2. Convert interests list to comma-separated string
    interests_str = (
        ",".join([i.strip() for i in payload.interests if i.strip()])
        if payload.interests
        else ""
    )

    # 3. Create or update MemberProfile
    profile = (
        db.query(MemberProfile)
        .filter(MemberProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        profile = MemberProfile(
            user_id=current_user.id,
            date_of_birth=payload.date_of_birth,
            gender=payload.gender.strip(),
            city=payload.city.strip(),
            income_range=payload.income_range.strip(),
            interests=interests_str,
        )
        db.add(profile)
    else:
        profile.date_of_birth = payload.date_of_birth
        profile.gender = payload.gender.strip()
        profile.city = payload.city.strip()
        profile.income_range = payload.income_range.strip()
        profile.interests = interests_str

    # 4. Handle Source & Referral attribution on first signup
    existing_signup = (
        db.query(Signup).filter(Signup.user_id == current_user.id).first()
    )

    if not existing_signup:
        source_id = None
        referrer_id = None
        signup_link_id = None

        # A. Check referral token/code first
        if payload.referral_token:
            clean_ref = payload.referral_token.strip().upper()

            # Check direct user referral code
            referrer_user = (
                db.query(User).filter(User.referral_code == clean_ref).first()
            )
            # Or signup link token
            if not referrer_user:
                link = (
                    db.query(SignupLink)
                    .filter(SignupLink.token == clean_ref)
                    .first()
                )
                if link and link.referrer_user_id:
                    referrer_user = (
                        db.query(User)
                        .filter(User.id == link.referrer_user_id)
                        .first()
                    )
                    signup_link_id = link.id

            # Avoid self-referral
            if referrer_user and referrer_user.id != current_user.id:
                referrer_id = referrer_user.id

                # Find or assign "Friend / Member Referral" source
                ref_source = (
                    db.query(Source)
                    .filter(Source.slug == "member-referral")
                    .first()
                )
                if ref_source:
                    source_id = ref_source.id

                # Create Referral record in "lead" stage
                existing_referral = (
                    db.query(Referral)
                    .filter(Referral.referred_id == current_user.id)
                    .first()
                )
                if not existing_referral:
                    new_referral = Referral(
                        referrer_id=referrer_id,
                        referred_id=current_user.id,
                        stage="lead",
                    )
                    db.add(new_referral)

        # B. Check tagged source slug
        if not source_id and payload.source_slug:
            src = (
                db.query(Source)
                .filter(Source.slug == payload.source_slug.strip().lower())
                .first()
            )
            if src:
                source_id = src.id

        # C. Fallback: "How did you hear about us?"
        if not source_id and payload.fallback_source_id:
            src = (
                db.query(Source)
                .filter(Source.id == payload.fallback_source_id)
                .first()
            )
            if src:
                source_id = src.id

        # Record signup event
        signup_record = Signup(
            user_id=current_user.id,
            source_id=source_id,
            signup_link_id=signup_link_id,
            referrer_user_id=referrer_id,
            created_at=datetime.utcnow(),
        )
        db.add(signup_record)

    db.commit()
    db.refresh(current_user)
    db.refresh(profile)

    return {
        "success": True,
        "message": "Profile saved successfully",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "phone": current_user.phone,
            "referral_code": current_user.referral_code,
            "referral_link": f"/login?ref={current_user.referral_code}",
        },
        "profile": {
            "date_of_birth": profile.date_of_birth.isoformat(),
            "gender": profile.gender,
            "city": profile.city,
            "income_range": profile.income_range,
            "interests": [
                i.strip() for i in profile.interests.split(",") if i.strip()
            ],
        },
    }
