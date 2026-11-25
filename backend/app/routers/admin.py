import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List
from datetime import date, timedelta

from app.database import get_db
from app.models import User, MemberProfile, Source, Signup, Referral, Participation
from app.services.csv_import import parse_and_import_respondents_csv
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class SourceCreateAdminRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(..., min_length=2, max_length=50)  # whatsapp, instagram, staff, website, etc.
    slug: str = Field(..., min_length=2, max_length=100)


@router.get("/respondents")
def get_respondents_grid(
    search: Optional[str] = None,
    source_id: Optional[int] = None,
    city: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Search by name, ID, phone or city as you type, and filter by source, city, and status.
    """
    query = (
        db.query(User, MemberProfile, Source.name.label("source_name"))
        .outerjoin(MemberProfile, User.id == MemberProfile.user_id)
        .outerjoin(Signup, User.id == Signup.user_id)
        .outerjoin(Source, Signup.source_id == Source.id)
    )

    # 1. Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        try:
            int_term = int(search.strip())
            query = query.filter(
                or_(
                    User.id == int_term,
                    User.name.ilike(term),
                    User.phone.ilike(term),
                    MemberProfile.city.ilike(term),
                )
            )
        except ValueError:
            query = query.filter(
                or_(
                    User.name.ilike(term),
                    User.phone.ilike(term),
                    MemberProfile.city.ilike(term),
                )
            )

    # 2. Source filter
    if source_id:
        query = query.filter(Signup.source_id == source_id)

    # 3. City filter
    if city and city.strip() and city != "all":
        query = query.filter(MemberProfile.city.ilike(city.strip()))

    total_count = query.count()
    rows = query.order_by(desc(User.created_at)).offset(offset).limit(limit).all()

    today = date.today()

    respondents = []
    for user, profile, source_name in rows:
        # Check participation status
        last_participation = (
            db.query(Participation)
            .filter(Participation.member_id == user.id)
            .order_by(desc(Participation.created_at))
            .first()
        )

        in_cool_off = False
        cool_off_until = None
        if last_participation and last_participation.completed_on:
            cool_off_end = last_participation.completed_on + timedelta(days=90)
            if today < cool_off_end:
                in_cool_off = True
                cool_off_until = cool_off_end.isoformat()

        # Compute user status label
        user_status = "Active"
        if in_cool_off:
            user_status = "Cool-off"
        elif last_participation and last_participation.result == "completed":
            user_status = "Completed"
        elif last_participation and last_participation.result == "waitlisted":
            user_status = "Waitlisted"
        elif not profile:
            user_status = "Profile Pending"

        # Apply status filter in memory if provided
        if status_filter and status_filter.lower() != "all":
            if user_status.lower() != status_filter.lower():
                continue

        respondents.append({
            "id": user.id,
            "name": user.name or "N/A",
            "phone": user.phone,
            "role": user.role,
            "referral_code": user.referral_code,
            "city": profile.city if profile else "N/A",
            "gender": profile.gender if profile else "N/A",
            "dob": profile.date_of_birth.isoformat() if profile and profile.date_of_birth else "N/A",
            "income_range": profile.income_range if profile else "N/A",
            "interests": profile.interests if profile else "N/A",
            "source": source_name or "Direct",
            "status": user_status,
            "in_cool_off": in_cool_off,
            "cool_off_until": cool_off_until,
            "created_at": user.created_at.strftime("%Y-%m-%d %H:%M") if user.created_at else "",
        })

    return {
        "total": total_count,
        "returned": len(respondents),
        "respondents": respondents,
    }


@router.get("/export-csv")
def export_respondents_csv(
    search: Optional[str] = None,
    source_id: Optional[int] = None,
    city: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Downloads the currently searched or filtered grid as a CSV file.
    """
    # Fetch all matching rows (up to 2000)
    data = get_respondents_grid(
        search=search,
        source_id=source_id,
        city=city,
        status_filter=status_filter,
        limit=2000,
        offset=0,
        db=db,
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "Respondent ID",
        "Full Name",
        "Phone Number",
        "City",
        "Gender",
        "Date of Birth",
        "Income Range",
        "Interests",
        "Source",
        "Status",
        "Cool-off Until",
        "Joined At",
    ])

    for r in data["respondents"]:
        writer.writerow([
            r["id"],
            r["name"],
            r["phone"],
            r["city"],
            r["gender"],
            r["dob"],
            r["income_range"],
            r["interests"],
            r["source"],
            r["status"],
            r["cool_off_until"] or "N/A",
            r["created_at"],
        ])

    csv_content = output.getvalue()
    filename = f"viewbox_respondents_{date.today().isoformat()}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/sources/dashboard")
def get_source_dashboard(db: Session = Depends(get_db)):
    """
    For each source, show sign-ups, Fit and Completed counts.
    """
    sources = db.query(Source).order_by(Source.id.asc()).all()

    result = []
    total_signups = 0
    total_fit = 0
    total_completed = 0

    for src in sources:
        # Signups count
        signups_count = db.query(Signup).filter(Signup.source_id == src.id).count()

        # Members from this source
        user_ids_select = (
            db.query(Signup.user_id)
            .filter(Signup.source_id == src.id)
            .scalar_subquery()
        )

        # Fit count (profile complete and matched or marked fit in referral)
        fit_count = (
            db.query(MemberProfile)
            .filter(MemberProfile.user_id.in_(user_ids_select))
            .count()
        )

        # Completed count (completed a survey)
        completed_count = (
            db.query(Participation)
            .filter(
                Participation.member_id.in_(user_ids_select),
                Participation.result == "completed",
            )
            .distinct(Participation.member_id)
            .count()
        )

        total_signups += signups_count
        total_fit += fit_count
        total_completed += completed_count

        conversion_rate = (
            round((completed_count / signups_count * 100), 1)
            if signups_count > 0
            else 0.0
        )

        result.append({
            "id": src.id,
            "name": src.name,
            "type": src.type,
            "slug": src.slug,
            "is_active": src.is_active,
            "signups": signups_count,
            "fit": fit_count,
            "completed": completed_count,
            "conversion_rate": f"{conversion_rate}%",
        })

    return {
        "summary": {
            "total_sources": len(sources),
            "total_signups": total_signups,
            "total_fit": total_fit,
            "total_completed": total_completed,
            "overall_conversion": f"{round((total_completed / total_signups * 100), 1) if total_signups > 0 else 0.0}%",
        },
        "sources": result,
    }


@router.post("/sources", status_code=status.HTTP_201_CREATED)
def create_new_source(
    payload: SourceCreateAdminRequest,
    db: Session = Depends(get_db),
):
    """
    Create a new marketing or referral source.
    """
    clean_slug = payload.slug.strip().lower()
    existing = db.query(Source).filter(Source.slug == clean_slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Source with slug '{clean_slug}' already exists",
        )

    new_source = Source(
        name=payload.name.strip(),
        type=payload.type.strip().lower(),
        slug=clean_slug,
        is_active=True,
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)

    return {
        "success": True,
        "message": f"Source '{new_source.name}' created successfully",
        "source": {
            "id": new_source.id,
            "name": new_source.name,
            "slug": new_source.slug,
            "type": new_source.type,
        },
    }


@router.post("/import-csv")
async def import_respondents_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Imports viewbox_respondents_sample.csv.
    Never crashes on bad rows; skips or fixes them and returns a detailed report.
    """
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a .csv file",
        )

    content = await file.read()
    report = parse_and_import_respondents_csv(content, db)
    return report
