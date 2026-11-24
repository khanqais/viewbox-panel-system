from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import Survey, SurveyRule, Participation, User
from app.auth import get_current_user
from app.services.eligibility import check_member_eligibility
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])


class SurveyRuleRequest(BaseModel):
    field: str
    operator: str
    value: str
    strictness: str = "strict"


class SurveyCreateRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = None
    reward_amount: int = Field(default=500, ge=0)
    quota: int = Field(default=50, ge=1)
    category: Optional[str] = None
    deadline: date
    rules: List[SurveyRuleRequest] = []


class SurveyResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    reward_amount: int
    quota: int
    category: Optional[str]
    deadline: date
    status: str
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
def create_survey(
    payload: SurveyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Admin-only check
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create surveys",
        )

    new_survey = Survey(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        reward_amount=payload.reward_amount,
        quota=payload.quota,
        category=payload.category.strip() if payload.category else None,
        deadline=payload.deadline,
        status="active",
    )
    db.add(new_survey)
    db.flush()

    # Add rules
    for rule_data in payload.rules:
        rule = SurveyRule(
            survey_id=new_survey.id,
            field=rule_data.field.strip().lower(),
            operator=rule_data.operator.strip().lower(),
            value=rule_data.value.strip(),
            strictness=rule_data.strictness.strip().lower(),
        )
        db.add(rule)

    db.commit()
    db.refresh(new_survey)
    return new_survey


@router.get("/active", response_model=List[dict])
def get_active_surveys_with_eligibility(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all active surveys with member eligibility status and reason
    """
    surveys = (
        db.query(Survey)
        .filter(Survey.status == "active", Survey.deadline >= date.today())
        .order_by(Survey.created_at.desc())
        .all()
    )

    result = []
    for survey in surveys:
        # Check eligibility
        eligibility = check_member_eligibility(current_user, survey, db)

        # Count approved participations for quota display
        approved_count = (
            db.query(Participation)
            .filter(
                Participation.survey_id == survey.id,
                Participation.result.in_(["approved", "completed"]),
            )
            .count()
        )

        # Check if member has already participated
        existing_participation = (
            db.query(Participation)
            .filter(
                Participation.member_id == current_user.id,
                Participation.survey_id == survey.id,
            )
            .first()
        )

        # Check if matches member interests
        member_interests = [
            i.strip().lower()
            for i in (
                current_user.profile.interests.split(",")
                if current_user.profile and current_user.profile.interests
                else []
            )
        ]
        matches_interests = (
            survey.category.strip().lower() in member_interests
            if survey.category
            else False
        )

        result.append(
            {
                "id": survey.id,
                "title": survey.title,
                "description": survey.description,
                "reward_amount": survey.reward_amount,
                "quota": survey.quota,
                "category": survey.category,
                "matches_interests": matches_interests,
                "deadline": survey.deadline.isoformat(),
                "status": survey.status,
                "filled": approved_count,
                "eligibility": eligibility["status"],
                "eligibility_reason": eligibility["reason"],
                "cool_off_until": eligibility.get("cool_off_until"),
                "already_joined": existing_participation is not None,
                "participation_result": existing_participation.result
                if existing_participation
                else None,
            }
        )

    return result


@router.post("/{survey_id}/join")
def join_survey(
    survey_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Member joins a survey - creates participation record with eligibility check
    """
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found"
        )

    # Check if already participated
    existing = (
        db.query(Participation)
        .filter(
            Participation.member_id == current_user.id,
            Participation.survey_id == survey_id,
        )
        .first()
    )

    if existing:
        return {
            "success": False,
            "message": f"You have already joined this survey with status: {existing.result}",
            "participation": {
                "result": existing.result,
                "reason": existing.reason,
            },
        }

    # Run eligibility check
    eligibility = check_member_eligibility(current_user, survey, db)

    participation = Participation(
        member_id=current_user.id,
        survey_id=survey_id,
        result=eligibility["status"],
        reason=eligibility["reason"],
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)

    return {
        "success": True,
        "message": f"Survey join request recorded with status: {eligibility['status']}",
        "participation": {
            "result": participation.result,
            "reason": participation.reason,
        },
    }
