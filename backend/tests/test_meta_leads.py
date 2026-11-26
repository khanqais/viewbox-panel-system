import pytest


def test_meta_leads_valid_ingest(client, db):
    payload = {
        "object_type": "leadgen",
        "lead_data": {
            "leadgen_id": "meta_lead_123456789",
            "form_id": "form_demo_001",
            "ad_id": "ad_demo_001",
            "campaign_id": "campaign_qais_001",
            "created_time": "2026-11-25T14:00:00Z",
            "full_name": "Karan Malhotra",
            "phone_number": "+91 99887 76655",
            "city": "Mumbai",
        },
    }

    res = client.post("/api/meta-leads/webhook", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "created"
    assert data["phone"] == "9988776655"
    assert data["name"] == "Karan Malhotra"


def test_meta_leads_duplicate_lead_id(client, db):
    payload = {
        "object_type": "leadgen",
        "lead_data": {
            "leadgen_id": "meta_lead_duplicate_test",
            "form_id": "form_demo_001",
            "created_time": "2026-11-25T14:00:00Z",
            "full_name": "First Lead",
            "phone_number": "9811122233",
            "city": "Delhi NCR",
        },
    }

    res1 = client.post("/api/meta-leads/webhook", json=payload)
    assert res1.status_code == 200
    assert res1.json()["status"] == "created"

    # Second time with same leadgen_id -> skipped gracefully
    res2 = client.post("/api/meta-leads/webhook", json=payload)
    assert res2.status_code == 200
    assert res2.json()["success"] is False
    assert res2.json()["status"] == "skipped"
    assert "Duplicate lead" in res2.json()["message"]


def test_meta_leads_duplicate_phone(client, db, test_member):
    payload = {
        "object_type": "leadgen",
        "lead_data": {
            "leadgen_id": "meta_lead_diff_id",
            "form_id": "form_demo_001",
            "created_time": "2026-11-25T14:00:00Z",
            "full_name": "Already Member",
            "phone_number": test_member.phone,
            "city": "Mumbai",
        },
    }

    res = client.post("/api/meta-leads/webhook", json=payload)
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert res.json()["status"] == "duplicate_phone"
    assert "Phone number already registered" in res.json()["message"]


def test_meta_leads_invalid_phone_validation_error(client):
    payload = {
        "object_type": "leadgen",
        "lead_data": {
            "leadgen_id": "meta_lead_bad_phone",
            "form_id": "form_demo_001",
            "created_time": "2026-11-25T14:00:00Z",
            "full_name": "Bad Phone",
            "phone_number": "123",
            "city": "Mumbai",
        },
    }

    res = client.post("/api/meta-leads/webhook", json=payload)
    assert res.status_code == 422


def test_meta_leads_webhook_handshake(client):
    params = {
        "hub.mode": "subscribe",
        "hub.verify_token": "any_secret",
        "hub.challenge": "11582012",
    }
    res = client.get("/api/meta-leads/webhook", params=params)
    assert res.status_code == 200
    assert "11582012" in res.text
