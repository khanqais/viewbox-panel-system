from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class SendOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str


class ProfileSubmitRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: str
    city: str
    income_range: str
    interests: List[str] = []
    source_slug: Optional[str] = None
    referral_token: Optional[str] = None
    fallback_source_id: Optional[int] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    name: Optional[str]
    phone: str
    date_of_birth: Optional[date]
    gender: Optional[str]
    city: Optional[str]
    income_range: Optional[str]
    interests: Optional[str]
    referral_code: Optional[str]
    referral_link: Optional[str]


class SourceCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str  # whatsapp, instagram, facebook, staff, website, meta_ads, other
    slug: str = Field(..., min_length=2, max_length=100)


class SourceResponse(BaseModel):
    id: int
    name: str
    type: str
    slug: str
    is_active: bool

    class Config:
        from_attributes = True
