import os
import pytest
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import User, MemberProfile, Source, Survey, SurveyRule, Participation, Referral, Signup
from app.auth import create_access_token

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed baseline sources
    if not session.query(Source).filter(Source.slug == "website-direct").first():
        sources = [
            Source(name="Website - Direct", type="website", slug="website-direct"),
            Source(name="WhatsApp - Mumbai Group", type="whatsapp", slug="whatsapp-mumbai"),
            Source(name="Instagram - Fashion", type="instagram", slug="instagram-fashion"),
            Source(name="Meta Ads", type="meta_ads", slug="meta-ads"),
            Source(name="Member Referral", type="member_referral", slug="member-referral"),
        ]
        session.add_all(sources)
        session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin(db):
    user = User(
        phone="8454803210",
        name="Admin User",
        role="admin",
        referral_code="VBADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_member(db):
    user = User(
        phone="9876500001",
        name="Test Member",
        role="member",
        referral_code="VBMEM01",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = MemberProfile(
        user_id=user.id,
        date_of_birth=date(1995, 5, 15),
        gender="Female",
        city="Mumbai",
        income_range="₹10 - ₹20 Lakhs",
        interests="Technology & Gadgets,Fashion & Beauty",
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_headers(test_admin):
    token = create_access_token(data={"sub": str(test_admin.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def member_headers(test_member):
    token = create_access_token(data={"sub": str(test_member.id)})
    return {"Authorization": f"Bearer {token}"}
