from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User
from app.auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str


@router.post("/send-otp")
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()

    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    # Mock OTP: any OTP will work
    return {"message": "OTP sent successfully", "mock_otp": "123456"}


@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    otp = payload.otp.strip()

    if not otp:
        raise HTTPException(status_code=400, detail="OTP is required")

    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        user = User(phone=phone)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "phone": user.phone,
            "name": user.name,
            "role": user.role,
        },
    }
