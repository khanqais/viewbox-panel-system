from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, MemberProfile

router = APIRouter(prefix="/api/members", tags=["Members"])


@router.get("/me")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"error": "User not found"}

    profile = db.query(MemberProfile).filter(MemberProfile.user_id == user.id).first()

    return {
        "id": user.id,
        "phone": user.phone,
        "name": user.name,
        "role": user.role,
        "profile": profile,
    }
