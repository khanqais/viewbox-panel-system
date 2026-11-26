import pytest
from datetime import date, timedelta
from app.models import Survey, SurveyRule, Source


def test_health_endpoints(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_auth_send_and_verify_otp(client, db):
    phone = "9822233344"
    res_send = client.post("/api/auth/send-otp", json={"phone": phone})
    assert res_send.status_code == 200
    data_send = res_send.json()
    assert data_send["success"] is True
    otp = data_send["mock_otp"]
    assert otp is not None

    res_verify = client.post("/api/auth/verify-otp", json={"phone": phone, "otp": otp})
    assert res_verify.status_code == 200
    data_verify = res_verify.json()
    assert "access_token" in data_verify
    assert data_verify["user"]["phone"] == phone


def test_active_surveys_and_join(client, db, test_member, member_headers):
    survey = Survey(
        title="Automobile Preferences Survey",
        description="10 min study on electric vehicles",
        reward_amount=750,
        quota=25,
        deadline=date.today() + timedelta(days=12),
        category="Technology & Gadgets",
        status="active",
    )
    db.add(survey)
    db.commit()

    rule = SurveyRule(survey_id=survey.id, field="city", operator="in", value="Mumbai", strictness="strict")
    db.add(rule)
    db.commit()

    res = client.get("/api/surveys/active", headers=member_headers)
    assert res.status_code == 200
    surveys = res.json()
    assert len(surveys) >= 1
    target_survey = next(s for s in surveys if s["id"] == survey.id)
    assert target_survey["eligibility"] == "approved"
    assert target_survey["matches_interests"] is True

    res_join = client.post(f"/api/surveys/{survey.id}/join", headers=member_headers)
    assert res_join.status_code == 200
    assert res_join.json()["success"] is True


def test_admin_respondent_grid_and_csv_export(client, db, test_admin, admin_headers, test_member):
    res_grid = client.get("/api/admin/respondents?search=Test", headers=admin_headers)
    assert res_grid.status_code == 200
    grid_data = res_grid.json()
    assert grid_data["total"] >= 1
    assert any(r["phone"] == test_member.phone for r in grid_data["respondents"])

    res_csv = client.get("/api/admin/export-csv", headers=admin_headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Respondent ID,Full Name,Phone Number" in res_csv.text


def test_admin_sources_dashboard_and_create(client, db, test_admin, admin_headers):
    res_dash = client.get("/api/admin/sources/dashboard", headers=admin_headers)
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert "summary" in dash_data
    assert "sources" in dash_data

    new_src = {
        "name": "Twitter / X Campaign",
        "type": "twitter",
        "slug": "twitter-campaign-q1",
    }
    res_create = client.post("/api/admin/sources", json=new_src, headers=admin_headers)
    assert res_create.status_code == 201
    assert res_create.json()["source"]["slug"] == "twitter-campaign-q1"
