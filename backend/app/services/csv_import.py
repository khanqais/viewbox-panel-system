import csv
import io
import re
from datetime import datetime, date
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import User, MemberProfile, Source, Signup


DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%m/%d/%Y",
    "%Y/%m/%d",
    "%d.%m.%Y",
]


def clean_phone_number(raw_phone: str) -> Tuple[str, str]:
    """
    Cleans phone number. Returns (cleaned_phone, error_message).
    Valid if resolves to 10 digits.
    """
    if not raw_phone:
        return "", "Missing phone number"

    digits = re.sub(r"\D", "", str(raw_phone))

    # Strip country code 91 if 12 digits
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    # Strip leading 0 if 11 digits
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if len(digits) != 10:
        return "", f"Invalid phone format: '{raw_phone}' (expected 10 digits, got {len(digits)})"

    return digits, ""


def clean_date_of_birth(raw_dob: str) -> Tuple[date | None, str]:
    """
    Parses messy date of birth strings across common formats.
    """
    if not raw_dob or not str(raw_dob).strip():
        return None, "Missing date of birth"

    clean_str = str(raw_dob).strip()

    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(clean_str, fmt).date()
            today = date.today()
            age = today.year - dt.year - ((today.month, today.day) < (dt.month, dt.day))
            if age < 10 or age > 100:
                return None, f"Unrealistic age ({age} years) from date '{raw_dob}'"
            return dt, ""
        except ValueError:
            continue

    return None, f"Unrecognized date format: '{raw_dob}'"


def parse_and_import_respondents_csv(
    file_bytes: bytes,
    db: Session,
) -> Dict[str, Any]:
    """
    Resilient parser for viewbox_respondents_sample.csv.
    Never crashes on bad rows; fixes what it can and reports skipped items.
    """
    # 1. Decode text safely (try UTF-8, then fallback to Latin-1)
    text = None
    for enc in ["utf-8-sig", "utf-8", "latin-1"]:
        try:
            text = file_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue

    if text is None:
        return {
            "success": False,
            "total_rows": 0,
            "imported": 0,
            "skipped": 0,
            "errors": [{"row": 0, "reason": "Failed to decode CSV file: unsupported encoding"}],
            "fixed": [],
        }

    reader = csv.DictReader(io.StringIO(text))

    # Normalize header column names (lowercase, strip whitespace and punctuation)
    if not reader.fieldnames:
        return {
            "success": False,
            "total_rows": 0,
            "imported": 0,
            "skipped": 0,
            "errors": [{"row": 0, "reason": "Empty CSV or missing header row"}],
            "fixed": [],
        }

    # Map column headers flexibly
    def find_col(possible_names: List[str]) -> str | None:
        for f in reader.fieldnames:
            normalized = f.strip().lower().replace("_", "").replace(" ", "").replace("-", "")
            for p in possible_names:
                if normalized == p.lower().replace("_", "").replace(" ", ""):
                    return f
        return None

    col_phone = find_col(["phone", "phonenumber", "mobile", "contact"])
    col_name = find_col(["name", "fullname", "respondentname", "membername"])
    col_dob = find_col(["dob", "dateofbirth", "birthdate"])
    col_gender = find_col(["gender", "sex"])
    col_city = find_col(["city", "location", "residence"])
    col_income = find_col(["income", "incomerange", "annualincome"])
    col_interests = find_col(["interests", "categories", "preferences"])
    col_source = find_col(["source", "sourceid", "sourceslug", "channel"])

    if not col_phone:
        return {
            "success": False,
            "total_rows": 0,
            "imported": 0,
            "skipped": 0,
            "errors": [{"row": 0, "reason": "CSV must contain a 'phone' or 'mobile' column"}],
            "fixed": [],
        }

    # Pre-load existing sources into a lookup dictionary
    sources = db.query(Source).all()
    source_map = {s.slug.lower(): s.id for s in sources}
    for s in sources:
        source_map[s.name.lower()] = s.id

    # Fallback source
    default_source = db.query(Source).filter(Source.slug == "website-direct").first()
    default_source_id = default_source.id if default_source else None

    # Cache existing phones to avoid DB lookup for every row
    existing_phones = {p[0] for p in db.query(User.phone).all()}
    batch_phones = set()

    total_rows = 0
    imported = 0
    skipped = 0
    errors = []
    fixed = []

    for idx, row in enumerate(reader, start=2):  # line 2 is first data row
        total_rows += 1

        raw_phone = row.get(col_phone, "")
        clean_phone, phone_err = clean_phone_number(raw_phone)

        if phone_err:
            skipped += 1
            errors.append({"row": idx, "phone": raw_phone, "reason": phone_err})
            continue

        if clean_phone in existing_phones:
            skipped += 1
            errors.append({
                "row": idx,
                "phone": clean_phone,
                "reason": "Duplicate phone number: already registered in database",
            })
            continue

        if clean_phone in batch_phones:
            skipped += 1
            errors.append({
                "row": idx,
                "phone": clean_phone,
                "reason": "Duplicate phone number: repeated in this CSV file",
            })
            continue

        batch_phones.add(clean_phone)

        # Clean Name
        raw_name = (row.get(col_name) or "").strip()
        clean_name = raw_name if raw_name else f"Member {clean_phone[-4:]}"
        if not raw_name:
            fixed.append({"row": idx, "field": "name", "original": "", "fixed": clean_name})

        # Clean DOB
        raw_dob = row.get(col_dob, "") if col_dob else ""
        clean_dob, dob_err = clean_date_of_birth(raw_dob)
        if dob_err and raw_dob:
            fixed.append({"row": idx, "field": "dob", "original": raw_dob, "fixed": "Skipped invalid date"})

        # Clean City
        raw_city = (row.get(col_city) or "").strip() if col_city else ""
        clean_city = raw_city.title() if raw_city else "Other"
        if raw_city and raw_city != clean_city:
            fixed.append({"row": idx, "field": "city", "original": raw_city, "fixed": clean_city})

        # Clean Gender
        raw_gender = (row.get(col_gender) or "").strip() if col_gender else ""
        clean_gender = "Prefer not to say"
        if raw_gender:
            g_lower = raw_gender.lower()
            if g_lower in ["m", "male", "man"]:
                clean_gender = "Male"
            elif g_lower in ["f", "female", "woman"]:
                clean_gender = "Female"
            elif g_lower in ["non-binary", "nb", "other"]:
                clean_gender = "Non-Binary"

        # Clean Income
        raw_income = (row.get(col_income) or "").strip() if col_income else ""
        clean_income = raw_income if raw_income else "₹5 - ₹10 Lakhs"

        # Clean Interests
        raw_interests = (row.get(col_interests) or "").strip() if col_interests else ""
        clean_interests = raw_interests if raw_interests else "Technology & Gadgets"

        # Clean Source
        raw_source = (row.get(col_source) or "").strip().lower() if col_source else ""
        source_id = source_map.get(raw_source) or default_source_id

        # Insert User
        new_user = User(
            phone=clean_phone,
            name=clean_name,
            role="member",
            referral_code=f"VB{clean_phone[-4:]}",
        )
        db.add(new_user)
        db.flush()

        # Insert MemberProfile
        new_profile = MemberProfile(
            user_id=new_user.id,
            date_of_birth=clean_dob,
            gender=clean_gender,
            city=clean_city,
            income_range=clean_income,
            interests=clean_interests,
        )
        db.add(new_profile)

        # Record Signup
        new_signup = Signup(
            user_id=new_user.id,
            source_id=source_id,
            created_at=datetime.utcnow(),
        )
        db.add(new_signup)

        imported += 1

    db.commit()

    return {
        "success": True,
        "total_rows": total_rows,
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:50],  # Return up to 50 for clean display
        "total_errors": len(errors),
        "fixed_count": len(fixed),
        "fixed": fixed[:20],
    }
