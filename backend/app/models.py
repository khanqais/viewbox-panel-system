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


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    reward_amount = Column(Integer, default=500)
    quota = Column(Integer, default=50)
    category = Column(String, nullable=True)  # matches member interests
    deadline = Column(Date, nullable=False)
    status = Column(String, default="active")  # active, completed, closed
    created_at = Column(DateTime, default=datetime.utcnow)

    rules = relationship("SurveyRule", back_populates="survey", cascade="all, delete-orphan")
    participations = relationship("Participation", back_populates="survey")


class SurveyRule(Base):
    __tablename__ = "survey_rules"

    id = Column(Integer, primary_key=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    field = Column(String, nullable=False)  # age, city, gender, income_range
    operator = Column(String, nullable=False)  # between, in, eq, gte, lte
    value = Column(String, nullable=False)  # e.g. "18-35", "Mumbai,Delhi NCR"
    strictness = Column(String, default="strict")  # strict or flexible

    survey = relationship("Survey", back_populates="rules")


class Participation(Base):
    __tablename__ = "participations"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    result = Column(String, nullable=False)  # approved, rejected, waitlisted, completed
    reason = Column(String, nullable=True)
    completed_on = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("User", backref="participations")
    survey = relationship("Survey", back_populates="participations")


