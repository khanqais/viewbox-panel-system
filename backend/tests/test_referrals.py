import pytest
from app.models import User, Referral, Participation
from app.routers.referrals import mask_phone


def test_mask_phone():
    assert mask_phone("9876543210") == "98******10"
    assert mask_phone("8454803210") == "84******10"
    assert mask_phone("123") == "123"
    assert mask_phone("") == ""


def test_referral_lifecycle(client, db, test_member, member_headers, admin_headers):
    friend = User(
        phone="9812345678",
        name="Friend B",
        role="member",
        referral_code="VBFRIEND",
    )
    db.add(friend)
    db.commit()

    ref = Referral(
        referrer_id=test_member.id,
        referred_id=friend.id,
        stage="lead",
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)

    # Check member sees masked phone in /api/referrals/my-referrals
    res = client.get("/api/referrals/my-referrals", headers=member_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    item = next(r for r in data["referrals"] if r["id"] == ref.id)
    assert item["phone"] == "98******78"
    assert item["stage"] == "lead"

    # Stage 2: Ops updates to 'fit'
    res_fit = client.patch(
        f"/api/referrals/{ref.id}/stage",
        json={"stage": "fit"},
        headers=admin_headers,
    )
    assert res_fit.status_code == 200
    assert res_fit.json()["referral"]["stage"] == "fit"

    # Stage 3: Friend completes survey -> Ops marks 'completed'
    res_comp = client.patch(
        f"/api/referrals/{ref.id}/stage",
        json={"stage": "completed"},
        headers=admin_headers,
    )
    assert res_comp.status_code == 200
    assert res_comp.json()["referral"]["stage"] == "completed"

    # Check stats calculate bonus
    res_stats = client.get("/api/referrals/stats", headers=member_headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["completed_referrals"] >= 1
    assert stats["potential_earnings"] >= 100


def test_referral_stage_failed_requires_reason(client, db, test_member, admin_headers):
    friend = User(phone="9877766655", name="Friend C", role="member")
    db.add(friend)
    db.commit()

    ref = Referral(referrer_id=test_member.id, referred_id=friend.id, stage="lead")
    db.add(ref)
    db.commit()

    res_fail = client.patch(
        f"/api/referrals/{ref.id}/stage",
        json={"stage": "failed"},
        headers=admin_headers,
    )
    assert res_fail.status_code == 400
    assert "fail_reason is required" in res_fail.json()["detail"]

    res_ok = client.patch(
        f"/api/referrals/{ref.id}/stage",
        json={"stage": "failed", "fail_reason": "Did not meet target demographic criteria"},
        headers=admin_headers,
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["referral"]["stage"] == "failed"
    assert res_ok.json()["referral"]["fail_reason"] == "Did not meet target demographic criteria"
