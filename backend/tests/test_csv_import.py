import pytest
from app.services.csv_import import (
    clean_phone_number,
    clean_date_of_birth,
    parse_and_import_respondents_csv,
)
from app.models import User, MemberProfile


def test_clean_phone_number():
    phone, err = clean_phone_number("9876543210")
    assert phone == "9876543210"
    assert err == ""

    phone, err = clean_phone_number("+91 98765 43210")
    assert phone == "9876543210"
    assert err == ""

    phone, err = clean_phone_number("919876543210")
    assert phone == "9876543210"
    assert err == ""

    phone, err = clean_phone_number("09876543210")
    assert phone == "9876543210"
    assert err == ""

    phone, err = clean_phone_number("(987) 654-3210")
    assert phone == "9876543210"
    assert err == ""

    phone, err = clean_phone_number("12345")
    assert phone == ""
    assert "expected 10 digits" in err

    phone, err = clean_phone_number("123456789012345")
    assert phone == ""
    assert "expected 10 digits" in err

    phone, err = clean_phone_number("")
    assert phone == ""
    assert "Missing" in err


def test_clean_date_of_birth():
    d, err = clean_date_of_birth("15/05/1992")
    assert d is not None
    assert d.year == 1992
    assert d.month == 5
    assert d.day == 15
    assert err == ""

    d, err = clean_date_of_birth("1995-08-22")
    assert d is not None
    assert d.year == 1995
    assert d.month == 8
    assert d.day == 22

    d, err = clean_date_of_birth("10-03-1988")
    assert d is not None
    assert d.year == 1988

    d, err = clean_date_of_birth("01/01/1850")
    assert d is None
    assert "Unrealistic age" in err

    d, err = clean_date_of_birth("not-a-date")
    assert d is None
    assert "Unrecognized date format" in err


def test_parse_and_import_respondents_csv(db):
    csv_content = """Phone,Name,Date of Birth,Gender,City,Income Range,Interests,Source
9123456790,Priya Sharma,15/05/1992,Female,Mumbai,₹10 - ₹20 Lakhs,Technology & Gadgets,whatsapp-mumbai
8765432190,Rahul Verma,22/08/1995,Male,Delhi NCR,₹5 - ₹10 Lakhs,Fashion & Beauty,instagram-fashion
7654321098,Anita Desai,10/03/1988,Female,Bengaluru,₹20 Lakhs+,Finance & Investment,website-direct
123,Invalid Phone,10/03/1988,Female,Bengaluru,₹20 Lakhs+,Finance,website-direct
9123456790,Duplicate In File,15/05/1992,Female,Mumbai,₹10 - ₹20 Lakhs,Tech,whatsapp-mumbai
"""
    result = parse_and_import_respondents_csv(csv_content.encode("utf-8"), db)

    assert result["success"] is True
    assert result["total_rows"] == 5
    assert result["imported"] == 3
    assert result["skipped"] == 2
    assert len(result["errors"]) == 2

    user = db.query(User).filter(User.phone == "9123456790").first()
    assert user is not None
    assert user.name == "Priya Sharma"
    assert user.profile is not None
    assert user.profile.city == "Mumbai"
