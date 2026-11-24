from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models import User, Survey, Participation


def calculate_age(dob: date) -> int:
    today = date.today()
    return (
        today.year
        - dob.year
        - ((today.month, today.day) < (dob.month, dob.day))
    )


def normalize_income(val: str) -> str:
    """Normalize income strings: strip currency symbols, spaces, case."""
    if not val:
        return ""
    cleaned = (
        val.replace("₹", "")
        .replace("Rs.", "")
        .replace("Rs", "")
        .replace("INR", "")
    )
    return " ".join(cleaned.lower().split())


def check_member_eligibility(
    member: User,
    survey: Survey,
    db: Session,
) -> dict:
    today = date.today()

    # 1. Check 3-Month Cool-off Rule
    # Any survey completed within the last 90 days prevents joining any new survey
    last_completion = (
        db.query(Participation)
        .filter(
            Participation.member_id == member.id,
            Participation.completed_on.isnot(None),
        )
        .order_by(Participation.completed_on.desc())
        .first()
    )

    if last_completion and last_completion.completed_on:
        cool_off_end = last_completion.completed_on + timedelta(days=90)
        if today < cool_off_end:
            return {
                "status": "rejected",
                "reason": (
                    f"Not eligible: 3-month cool-off active. Completed prior survey on "
                    f"{last_completion.completed_on.isoformat()}. Eligible on "
                    f"{cool_off_end.isoformat()}."
                ),
                "cool_off_until": cool_off_end.isoformat(),
            }

    # 2. Survey Status & Deadline Check
    if survey.status != "active":
        return {
            "status": "rejected",
            "reason": f"Survey is currently {survey.status}.",
            "cool_off_until": None,
        }

    if survey.deadline < today:
        return {
            "status": "rejected",
            "reason": f"Not eligible: Survey deadline passed on {survey.deadline.isoformat()}.",
            "cool_off_until": None,
        }

    # 3. Quota Check
    approved_count = (
        db.query(Participation)
        .filter(
            Participation.survey_id == survey.id,
            Participation.result.in_(["approved", "completed"]),
        )
        .count()
    )
    if approved_count >= survey.quota:
        return {
            "status": "rejected",
            "reason": f"Not eligible: Quota reached ({survey.quota}/{survey.quota} responses).",
            "cool_off_until": None,
        }

    # 4. Profile check
    profile = member.profile
    if not profile or not profile.date_of_birth:
        return {
            "status": "waitlisted",
            "reason": "Waitlisted: Profile incomplete. Please complete your profile to verify fit.",
            "cool_off_until": None,
        }

    member_age = calculate_age(profile.date_of_birth)
    strict_fails = []
    flexible_fails = []

    # 5. Rule by rule evaluation
    for rule in survey.rules:
        field = rule.field.strip().lower()
        strict = rule.strictness.strip().lower() == "strict"
        val = rule.value.strip()

        if field == "age":
            # Handles "18-35" or single values
            if "-" in val:
                try:
                    min_age, max_age = map(int, val.split("-"))
                    if member_age < min_age or member_age > max_age:
                        msg = f"age {member_age}, this survey needs {min_age} to {max_age}"
                        if strict:
                            strict_fails.append(msg)
                        else:
                            flexible_fails.append(msg)
                except ValueError:
                    pass
            elif rule.operator == "gte" and member_age < int(val):
                msg = f"age {member_age}, needs at least {val}"
                if strict:
                    strict_fails.append(msg)
                else:
                    flexible_fails.append(msg)
            elif rule.operator == "lte" and member_age > int(val):
                msg = f"age {member_age}, needs at most {val}"
                if strict:
                    strict_fails.append(msg)
                else:
                    flexible_fails.append(msg)

        elif field == "city":
            allowed_cities = [c.strip().lower() for c in val.split(",") if c.strip()]
            user_city = (profile.city or "").strip().lower()
            if user_city not in allowed_cities:
                msg = f"city is {profile.city}, this survey needs {val}"
                if strict:
                    strict_fails.append(msg)
                else:
                    flexible_fails.append(msg)

        elif field == "gender":
            allowed_genders = [g.strip().lower() for g in val.split(",") if g.strip()]
            user_gender = (profile.gender or "").strip().lower()
            if user_gender not in allowed_genders:
                msg = f"gender is {profile.gender}, this survey needs {val}"
                if strict:
                    strict_fails.append(msg)
                else:
                    flexible_fails.append(msg)

        elif field == "income_range":
            allowed_incomes = [
                normalize_income(i) for i in val.split(",") if i.strip()
            ]
            user_income = normalize_income(profile.income_range or "")
            if user_income not in allowed_incomes:
                msg = f"income is {profile.income_range}, this survey needs {val}"
                if strict:
                    strict_fails.append(msg)
                else:
                    flexible_fails.append(msg)

    # 6. Synthesize result
    if strict_fails:
        return {
            "status": "rejected",
            "reason": f"Not eligible: {'; '.join(strict_fails)}",
            "cool_off_until": None,
        }
    elif flexible_fails:
        return {
            "status": "waitlisted",
            "reason": f"Waitlisted: {'; '.join(flexible_fails)}",
            "cool_off_until": None,
        }
    else:
        return {
            "status": "approved",
            "reason": "Approved: You meet all survey criteria!",
            "cool_off_until": None,
        }
