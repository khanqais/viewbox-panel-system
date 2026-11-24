from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, MemberProfile
from app.auth import get_current_user

router = APIRouter(prefix="/api/members", tags=["Members"])


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(MemberProfile)
        .filter(MemberProfile.user_id == current_user.id)
        .first()
    )

    return {
        "id": current_user.id,
        "phone": current_user.phone,
        "name": current_user.name,
        "role": current_user.role,
        "has_profile": profile is not None,
        "profile": {
            "date_of_birth": (
                profile.date_of_birth.isoformat()
                if profile and profile.date_of_birth
                else None
            ),
            "gender": profile.gender if profile else None,
            "city": profile.city if profile else None,
            "income_range": profile.income_range if profile else None,
            "interests": profile.interests if profile else None,
        }
        if profile
        else None,
    }
