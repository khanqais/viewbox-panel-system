from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Referral, Participation
from app.auth import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])


class UpdateReferralStageRequest(BaseModel):
    stage: str  # lead, fit, completed, failed
    fail_reason: Optional[str] = None


def mask_phone(phone: str) -> str:
    """Mask phone number: 9876543210 -> 98******10"""
    if not phone or len(phone) < 4:
        return phone
    return phone[:2] + "*" * (len(phone) - 4) + phone[-2:]


@router.get("/my-referrals")
def get_my_referrals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all referrals made by current user with masked phone numbers
    """
    referrals = (
        db.query(Referral)
        .filter(Referral.referrer_id == current_user.id)
        .order_by(Referral.created_at.desc())
        .all()
    )

    result = []
    for ref in referrals:
        referred_user = db.query(User).filter(User.id == ref.referred_id).first()
        if not referred_user:
            continue

        # Check if referred user has completed any survey
        completed_participation = (
            db.query(Participation)
            .filter(
                Participation.member_id == ref.referred_id,
                Participation.result == "completed",
            )
            .first()
        )

        result.append(
            {
                "id": ref.id,
                "referred_id": ref.referred_id,
                "phone": mask_phone(referred_user.phone),
                "name": referred_user.name or "Profile Pending",
                "stage": ref.stage,
                "fail_reason": ref.fail_reason,
                "has_completed_survey": completed_participation is not None,
                "created_at": ref.created_at.isoformat(),
                "updated_at": ref.updated_at.isoformat(),
            }
        )

    return {
        "total": len(result),
        "referrals": result,
        "summary": {
            "lead": sum(1 for r in result if r["stage"] == "lead"),
            "fit": sum(1 for r in result if r["stage"] == "fit"),
            "completed": sum(1 for r in result if r["stage"] == "completed"),
            "failed": sum(1 for r in result if r["stage"] == "failed"),
        },
    }


@router.patch("/{referral_id}/stage")
def update_referral_stage(
    referral_id: int,
    payload: UpdateReferralStageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update referral stage - admin or referrer only
    Stages: lead -> fit -> completed/failed
    """
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found"
        )

    # Authorization: admin or the referrer themselves
    if current_user.role != "admin" and current_user.id != referral.referrer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this referral",
        )

    # Validate stage transition
    valid_stages = ["lead", "fit", "completed", "failed"]
    if payload.stage not in valid_stages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid stage. Must be one of: {', '.join(valid_stages)}",
        )

    # Require fail_reason when marking as failed
    if payload.stage == "failed" and not payload.fail_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="fail_reason is required when marking referral as failed",
        )

    referral.stage = payload.stage
    referral.fail_reason = payload.fail_reason if payload.stage == "failed" else None
    db.commit()
    db.refresh(referral)

    return {
        "success": True,
        "message": f"Referral stage updated to: {payload.stage}",
        "referral": {
            "id": referral.id,
            "stage": referral.stage,
            "fail_reason": referral.fail_reason,
            "updated_at": referral.updated_at.isoformat(),
        },
    }


@router.get("/stats")
def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get referral performance stats for current user
    """
    total_referrals = (
        db.query(Referral).filter(Referral.referrer_id == current_user.id).count()
    )

    completed_referrals = (
        db.query(Referral)
        .filter(Referral.referrer_id == current_user.id, Referral.stage == "completed")
        .count()
    )

    # Potential earnings (completed referrals * bonus amount)
    # Assuming ₹100 bonus per completed referral
    REFERRAL_BONUS = 100
    potential_earnings = completed_referrals * REFERRAL_BONUS

    return {
        "total_referrals": total_referrals,
        "completed_referrals": completed_referrals,
        "potential_earnings": potential_earnings,
        "bonus_per_referral": REFERRAL_BONUS,
    }
