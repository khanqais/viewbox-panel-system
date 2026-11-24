from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    phone = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    role = Column(String, default="member")  # member or admin
    referral_code = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("MemberProfile", back_populates="user", uselist=False)


class MemberProfile(Base):
    __tablename__ = "member_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    city = Column(String, nullable=True)
    income_range = Column(String, nullable=True)
    interests = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # whatsapp, instagram, staff, website, meta_ads, other
    slug = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SignupLink(Base):
    __tablename__ = "signup_links"

    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    referrer_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    token = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Signup(Base):
    __tablename__ = "signups"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    signup_link_id = Column(Integer, ForeignKey("signup_links.id"), nullable=True)
    referrer_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    referred_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    stage = Column(String, default="lead")  # lead, fit, completed, failed
    fail_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    referrer = relationship("User", foreign_keys=[referrer_id], backref="referrals_made")
    referred = relationship("User", foreign_keys=[referred_id], backref="referral_received")

