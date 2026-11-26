import pytest
from datetime import date, timedelta
from app.models import User, MemberProfile, Survey, SurveyRule, Participation
from app.services.eligibility import (
    calculate_age,
    normalize_income,
    check_member_eligibility,
)


def test_calculate_age():
    today = date.today()
    dob_25 = date(today.year - 25, today.month, today.day)
    assert calculate_age(dob_25) == 25

    if today.month == 12 and today.day == 31:
        dob_edge = date(today.year - 25, 12, 30)
    else:
        tomorrow = today + timedelta(days=1)
        dob_edge = date(today.year - 25, tomorrow.month, tomorrow.day)
        assert calculate_age(dob_edge) == 24


def test_normalize_income():
    assert normalize_income("₹10 - ₹20 Lakhs") == "10 - 20 lakhs"
    assert normalize_income("Rs. 5-10 Lakhs") == "5-10 lakhs"
    assert normalize_income("INR 20 Lakhs+") == "20 lakhs+"
    assert normalize_income(None) == ""


def test_eligibility_approved_when_all_rules_match(db, test_member):
    survey = Survey(
        title="Tech Survey",
        description="Consumer tech",
        reward_amount=500,
        quota=10,
        deadline=date.today() + timedelta(days=15),
        status="active",
        category="Technology & Gadgets",
    )
    db.add(survey)
    db.commit()

    rules = [
        SurveyRule(survey_id=survey.id, field="age", operator="between", value="18-35", strictness="strict"),
        SurveyRule(survey_id=survey.id, field="city", operator="in", value="Mumbai,Delhi NCR", strictness="strict"),
        SurveyRule(survey_id=survey.id, field="income_range", operator="in", value="₹10 - ₹20 Lakhs", strictness="flexible"),
    ]
    db.add_all(rules)
    db.commit()

    res = check_member_eligibility(test_member, survey, db)
    assert res["status"] == "approved"
    assert "Approved" in res["reason"]
    assert res["cool_off_until"] is None


def test_eligibility_cool_off_period_within_90_days(db, test_member):
    completed_date = date.today() - timedelta(days=30)
    prior_survey = Survey(
        title="Past Survey",
        quota=10,
        deadline=date.today() + timedelta(days=10),
        status="active",
    )
    db.add(prior_survey)
    db.commit()

    part = Participation(
        member_id=test_member.id,
        survey_id=prior_survey.id,
        result="completed",
        completed_on=completed_date,
    )
    db.add(part)
    db.commit()

    new_survey = Survey(
        title="New Study",
        quota=10,
        deadline=date.today() + timedelta(days=10),
        status="active",
    )
    db.add(new_survey)
    db.commit()

    res = check_member_eligibility(test_member, new_survey, db)
    assert res["status"] == "rejected"
    assert "3-month cool-off active" in res["reason"]
    expected_cool_off = completed_date + timedelta(days=90)
    assert res["cool_off_until"] == expected_cool_off.isoformat()


def test_eligibility_cool_off_period_expired_over_90_days(db, test_member):
    completed_date = date.today() - timedelta(days=95)
    prior_survey = Survey(
        title="Old Survey",
        quota=10,
        deadline=date.today() + timedelta(days=10),
        status="active",
    )
    db.add(prior_survey)
    db.commit()

    part = Participation(
        member_id=test_member.id,
        survey_id=prior_survey.id,
        result="completed",
        completed_on=completed_date,
    )
    db.add(part)
    db.commit()

    new_survey = Survey(
        title="Brand Study",
        quota=10,
        deadline=date.today() + timedelta(days=10),
        status="active",
    )
    db.add(new_survey)
    db.commit()

    res = check_member_eligibility(test_member, new_survey, db)
    assert res["status"] == "approved"
    assert res["cool_off_until"] is None


def test_eligibility_strict_rule_rejection(db, test_member):
    survey = Survey(
        title="Senior Tech Survey",
        quota=10,
        deadline=date.today() + timedelta(days=10),
        status="active",
    )
    db.add(survey)
    db.commit()

    rule = SurveyRule(survey_id=survey.id, field="age", operator="between", value="50-60", strictness="strict")
    db.add(rule)
    db.commit()

    res = check_member_eligibility(test_member, survey, db)
    assert res["status"] == "rejected"
    assert "Not eligible:" in res["reason"]
    assert "age" in res["reason"]


def test_eligibility_flexible_rule_waitlist(db, test_member):
    survey = Survey(
        title="Chennai Lifestyle",
        quota=10,
        deadline=date.today() + timedelta(days=10),
        status="active",
    )
    db.add(survey)
    db.commit()

    rule = SurveyRule(survey_id=survey.id, field="city", operator="in", value="Chennai", strictness="flexible")
    db.add(rule)
    db.commit()

    res = check_member_eligibility(test_member, survey, db)
    assert res["status"] == "waitlisted"
    assert "Waitlisted:" in res["reason"]
    assert "city is Mumbai" in res["reason"]


def test_eligibility_quota_reached(db, test_member):
    survey = Survey(
        title="Limited Quota Survey",
        quota=1,
        deadline=date.today() + timedelta(days=10),
        status="active",
    )
    db.add(survey)
    db.commit()

    other_user = User(phone="9999988888", name="Other User", role="member")
    db.add(other_user)
    db.commit()

    part = Participation(
        member_id=other_user.id,
        survey_id=survey.id,
        result="approved",
    )
    db.add(part)
    db.commit()

    res = check_member_eligibility(test_member, survey, db)
    assert res["status"] == "rejected"
    assert "Quota reached" in res["reason"]


def test_eligibility_deadline_passed(db, test_member):
    survey = Survey(
        title="Expired Survey",
        quota=10,
        deadline=date.today() - timedelta(days=1),
        status="active",
    )
    db.add(survey)
    db.commit()

    res = check_member_eligibility(test_member, survey, db)
    assert res["status"] == "rejected"
    assert "deadline passed" in res["reason"]
