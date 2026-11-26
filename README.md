# ViewBox Panel System

A complete respondent management and survey eligibility system for market research operations, with source tracking, referral management, and Meta Ads lead integration.

---

## 1. Project Overview

ViewBox Panel System manages a consumer panel for market research. It tracks sign-ups from multiple sources (WhatsApp groups, Instagram, website, Meta Ads, member referrals), screens respondents for survey eligibility using demographic rules and a 3-month cool-off period, and manages a referral lifecycle (Lead → Fit → Completed). Admin tools include searchable respondent grids, CSV import/export, source conversion funnels, and a Meta Lead Ads webhook endpoint.

---

## 2. Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL (Neon)
- **Frontend**: React 18, Vite, React Router
- **Database**: PostgreSQL with connection pooling via Neon
- **Authentication**: JWT tokens, mock OTP (no SMS service)
- **Deployment**: Local development (backend: uvicorn, frontend: Vite dev server)

**Main Libraries**:
- Backend: `fastapi`, `sqlalchemy`, `pydantic`, `python-jose[cryptography]`, `passlib`, `psycopg2-binary`
- Frontend: `react`, `react-router-dom`, `axios`

---

## 3. Setup and Run

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL database (or Neon cloud database)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure database connection
# Create .env file with:
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET_KEY=your-secret-key-here

# Run backend server
python -m uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend dev server
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## 4. Demo Logins and Test Data

### Admin Account
- **Phone**: `8454803210`
- **OTP**: Any value (e.g., `123456`) - OTP is mocked for development
- **Role**: Admin - Access to admin panel, respondent grid, source dashboard, CSV import/export

### Member Account
- **Phone**: `9876500001`
- **OTP**: Any value
- **Role**: Member - Access to surveys, referral tracking, profile management

### Test CSV Import
- File: `backend/viewbox_respondents_sample.csv`
- Contains 10 realistic respondents with messy data (tests phone cleaning, date parsing, duplicate detection)

### Sample Data Available
- 10 sources (WhatsApp groups, Instagram, Website, Meta Ads, Member Referral, etc.)
- 5+ registered members with complete profiles
- 1 active survey with eligibility rules
- Referral relationships and cool-off examples

---

## 5. Features

### Core Features (Section 3)

| Feature | Status | Description |
|---------|--------|-------------|
| **A. Source Tracking** | ✅ Done | Dynamic sources stored as data, unique signup links per source, referral links per member, fallback dropdown "How did you hear about us?" |
| **B. Respondent Portal** | ✅ Done | Phone + OTP login (mocked), profile onboarding (name, DOB, gender, city, income, interests), live surveys with interest-based highlighting |
| **C. Eligibility Check** | ✅ Done | Survey rules (age, city, gender, income, quota, deadline) marked Strict/Flexible, results: Approved/Rejected/Waitlisted with plain-text reasons, 3-month cool-off tracking |
| **D. Referral Flow** | ✅ Done | Stages: Lead → Fit → Completed (with fail reasons), referrer dashboard with masked phone numbers (98******10), referral bonus tracking |
| **E. Admin Panel** | ✅ Done | Respondent grid with instant search (name, ID, phone, city) and filters (source, city, status), CSV export (filtered results), CSV import (resilient parser with error reporting), source dashboard (signups → fit → completed funnel) |
| **F. Meta Ads Lead Endpoint** | ✅ Done | Webhook endpoint for Meta Lead Ads, deduplication by lead ID and phone, campaign ID tracking, validation and error handling, documented API with sample requests |

### Advanced Enhancements (Section 4 - Bonus)

| Feature | Status | Description |
|---------|--------|-------------|
| **Fraud and Duplicate Flags** | ⚠️ Partly Done | Duplicate phone detection (blocks re-registration), duplicate lead ID detection (Meta webhook retries). Missing: device/IP tracking, self-referral detection, referral ring detection, review queue UI |
| **Payout Ledger** | ❌ Not Done | No payout calculation or approval workflow. See section 8 for implementation plan. |
| **Import Preview and Error Report** | ⚠️ Partly Done | Shows summary (total, imported, skipped, fixed count, top 50 errors) after import. Missing: pre-save preview UI with row-by-row fixes shown before commit. |

---

## 6. Database Design

### Main Tables

**users**
- Core identity: `id`, `phone` (unique), `name`, `role` (member/admin), `referral_code` (unique)
- Relationships: `profile` (1:1), `signups` (1:many), `participations` (1:many), `referrals_made` (1:many)

**member_profiles**
- Demographics: `user_id` (FK), `date_of_birth`, `gender`, `city`, `income_range`, `interests`

**sources**
- Marketing channels: `id`, `name`, `type`, `slug`, `is_active`
- Examples: WhatsApp - Mumbai Group, Instagram - Fashion, Website - Direct, Meta Ads

**signups**
- Attribution: `id`, `user_id` (FK), `source_id` (FK), `signup_link_id` (FK), `referrer_user_id` (FK), `created_at`

**signup_links**
- Trackable URLs: `id`, `source_id` (FK), `token` (unique), `created_at`

**referrals**
- Referral lifecycle: `id`, `referrer_id` (FK), `referred_id` (FK), `stage` (lead/fit/completed/failed), `fail_reason`, `created_at`, `updated_at`

**surveys**
- Survey metadata: `id`, `title`, `description`, `reward_amount`, `quota`, `deadline`, `category`, `status`

**survey_rules**
- Eligibility criteria: `id`, `survey_id` (FK), `field` (age/city/gender/income_range), `operator` (equals/in/range), `value`, `strictness` (strict/flexible)

**participations**
- Survey enrollment: `id`, `member_id` (FK), `survey_id` (FK), `result` (approved/waitlisted/rejected), `completed_on`, `created_at`

### Relationships Diagram
```
users (1) ─┬─ (1) member_profiles
           ├─ (many) signups ─── (1) sources
           ├─ (many) participations ─── (1) surveys ─── (many) survey_rules
           └─ (many) referrals (as referrer or referred)

signup_links (many) ─── (1) sources
```

**Full Diagram**: See `/design/database-diagram.png` (created on Day 2)

---

## 7. API Endpoints

### Authentication

#### POST `/api/auth/send-otp`
**Purpose**: Request OTP for phone login (mocked)

**Request**:
```json
{
  "phone": "9876543210"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP sent to 9876543210",
  "mock_otp": "123456"
}
```

#### POST `/api/auth/verify-otp`
**Purpose**: Verify OTP and get JWT token

**Request**:
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "phone": "9876543210",
    "name": "Priya Sharma",
    "role": "member",
    "referral_code": "VB3210",
    "has_profile": true
  }
}
```

---

### Members

#### GET `/api/members/me`
**Purpose**: Get current user profile and status

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "id": 1,
  "phone": "9876543210",
  "name": "Priya Sharma",
  "role": "member",
  "referral_code": "VB3210",
  "has_profile": true,
  "referral_link": "http://localhost:5173/login?ref=VB3210",
  "profile": {
    "date_of_birth": "1995-05-15",
    "gender": "Female",
    "city": "Mumbai",
    "income_range": "₹10 - ₹20 Lakhs",
    "interests": "Technology & Gadgets,Fashion & Beauty"
  }
}
```

#### POST `/api/members/profile`
**Purpose**: Create or update member profile

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "name": "Priya Sharma",
  "date_of_birth": "1995-05-15",
  "gender": "Female",
  "city": "Mumbai",
  "income_range": "₹10 - ₹20 Lakhs",
  "interests": "Technology & Gadgets,Fashion & Beauty",
  "source_slug": "whatsapp-mumbai"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Profile saved successfully!",
  "user": { ... }
}
```

---

### Surveys

#### POST `/api/surveys`
**Purpose**: Create a new survey (admin only)

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "title": "Consumer Electronics Purchase Behavior",
  "description": "15-minute survey about tech purchases",
  "reward_amount": 500,
  "quota": 50,
  "deadline": "2026-12-08",
  "category": "Technology & Gadgets",
  "rules": [
    {
      "field": "age",
      "operator": "range",
      "value": "18-45",
      "strictness": "strict"
    },
    {
      "field": "city",
      "operator": "in",
      "value": "Mumbai,Delhi NCR,Bengaluru",
      "strictness": "strict"
    },
    {
      "field": "income_range",
      "operator": "in",
      "value": "₹10 - ₹20 Lakhs,₹20 Lakhs+",
      "strictness": "flexible"
    }
  ]
}
```

**Response** (201):
```json
{
  "id": 1,
  "title": "Consumer Electronics Purchase Behavior",
  "status": "active",
  ...
}
```

#### GET `/api/surveys/active`
**Purpose**: Get active surveys with eligibility status for current member

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "id": 1,
    "title": "Consumer Electronics Purchase Behavior",
    "description": "15-minute survey about tech purchases",
    "reward_amount": 500,
    "quota": 50,
    "filled": 5,
    "category": "Technology & Gadgets",
    "matches_interests": true,
    "deadline": "2026-12-08",
    "status": "active",
    "eligibility": "approved",
    "eligibility_reason": "Approved: You meet all survey criteria!",
    "cool_off_until": null,
    "already_joined": false,
    "participation_result": null
  }
]
```

#### POST `/api/surveys/{survey_id}/join`
**Purpose**: Member joins a survey

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Successfully joined survey!",
  "participation": {
    "id": 1,
    "survey_id": 1,
    "member_id": 1,
    "result": "approved",
    "created_at": "2026-11-25T14:00:00Z"
  }
}
```

---

### Referrals

#### GET `/api/referrals/my-referrals`
**Purpose**: Get list of referrals made by current member

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "total": 3,
  "summary": {
    "lead": 1,
    "fit": 1,
    "completed": 1,
    "failed": 0
  },
  "referrals": [
    {
      "id": 1,
      "name": "Rahul Verma",
      "phone": "98******10",
      "stage": "completed",
      "fail_reason": null,
      "bonus_earned": true,
      "created_at": "2026-11-20",
      "updated_at": "2026-11-23"
    }
  ]
}
```

#### GET `/api/referrals/stats`
**Purpose**: Get referral statistics

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "total_referrals": 3,
  "completed_referrals": 1,
  "potential_earnings": 100
}
```

#### PATCH `/api/referrals/{referral_id}/stage`
**Purpose**: Update referral stage (admin/ops)

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "stage": "completed"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Referral stage updated",
  "referral": { ... }
}
```

---

### Admin Panel

#### GET `/api/admin/respondents`
**Purpose**: Search and filter respondents

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `search`: Search by name, ID, phone, or city
- `source_id`: Filter by source ID
- `city`: Filter by city
- `status`: Filter by status (active/cool-off/completed/waitlisted/profile pending)
- `limit`: Results per page (default: 100, max: 500)
- `offset`: Pagination offset

**Response** (200):
```json
{
  "total": 150,
  "returned": 10,
  "respondents": [
    {
      "id": 1,
      "name": "Priya Sharma",
      "phone": "9876543210",
      "role": "member",
      "referral_code": "VB3210",
      "city": "Mumbai",
      "gender": "Female",
      "dob": "1995-05-15",
      "income_range": "₹10 - ₹20 Lakhs",
      "interests": "Technology & Gadgets",
      "source": "WhatsApp - Mumbai Group",
      "status": "Active",
      "in_cool_off": false,
      "cool_off_until": null,
      "created_at": "2026-11-20 10:30"
    }
  ]
}
```

#### GET `/api/admin/export-csv`
**Purpose**: Export filtered respondents as CSV

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**: Same as `/api/admin/respondents`

**Response**: CSV file download with headers:
```
Respondent ID,Full Name,Phone Number,City,Gender,Date of Birth,Income Range,Interests,Source,Status,Cool-off Until,Joined At
```

#### POST `/api/admin/import-csv`
**Purpose**: Import respondents from CSV file

**Headers**: `Authorization: Bearer <token>`

**Request**: `multipart/form-data` with file attachment

**Response** (200):
```json
{
  "success": true,
  "total_rows": 10,
  "imported": 8,
  "skipped": 2,
  "errors": [
    {
      "row": 3,
      "phone": "123",
      "reason": "Invalid phone format: '123' (expected 10 digits, got 3)"
    },
    {
      "row": 7,
      "phone": "9876543210",
      "reason": "Duplicate phone number: already registered in database"
    }
  ],
  "total_errors": 2,
  "fixed_count": 3,
  "fixed": [
    {
      "row": 2,
      "field": "city",
      "original": "mumbai",
      "fixed": "Mumbai"
    }
  ]
}
```

#### GET `/api/admin/sources/dashboard`
**Purpose**: Get source conversion funnel metrics

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "summary": {
    "total_sources": 10,
    "total_signups": 150,
    "total_fit": 120,
    "total_completed": 45,
    "overall_conversion": "30.0%"
  },
  "sources": [
    {
      "id": 1,
      "name": "WhatsApp - Mumbai Group",
      "type": "whatsapp",
      "slug": "whatsapp-mumbai",
      "is_active": true,
      "signups": 50,
      "fit": 42,
      "completed": 18,
      "conversion_rate": "36.0%"
    }
  ]
}
```

#### POST `/api/admin/sources`
**Purpose**: Create a new source

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "name": "LinkedIn - B2B Panel",
  "type": "linkedin",
  "slug": "linkedin-b2b"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Source 'LinkedIn - B2B Panel' created successfully",
  "source": {
    "id": 11,
    "name": "LinkedIn - B2B Panel",
    "slug": "linkedin-b2b",
    "type": "linkedin"
  }
}
```

---

### Meta Ads Lead Webhook

#### POST `/api/meta-leads/webhook`
**Purpose**: Receive leads from Meta (Facebook/Instagram) Lead Ads

**Authentication**: None (webhook endpoint)

**Request** (Meta Lead Ads webhook format):
```json
{
  "object_type": "leadgen",
  "lead_data": {
    "leadgen_id": "12345678901234567",
    "form_id": "form_abc123",
    "ad_id": "ad_xyz789",
    "campaign_id": "campaign_meta_001",
    "adset_id": "adset_456",
    "created_time": "2026-11-25T14:00:00Z",
    "full_name": "Priya Sharma",
    "phone_number": "+91 98765 43210",
    "city": "Mumbai"
  }
}
```

**Response** (200 - Success):
```json
{
  "success": true,
  "message": "Lead successfully imported",
  "lead_id": "12345678901234567",
  "user_id": 15,
  "phone": "9876543210",
  "name": "Priya Sharma",
  "campaign_id": "campaign_meta_001",
  "status": "created"
}
```

**Response** (200 - Duplicate Lead ID):
```json
{
  "success": false,
  "message": "Duplicate lead: already processed",
  "lead_id": "12345678901234567",
  "user_id": 15,
  "status": "skipped"
}
```

**Response** (200 - Duplicate Phone):
```json
{
  "success": false,
  "message": "Phone number already registered",
  "lead_id": "12345678901234567",
  "user_id": 8,
  "phone": "9876543210",
  "status": "duplicate_phone"
}
```

**Response** (400 - Invalid Phone):
```json
{
  "detail": [
    {
      "loc": ["body", "lead_data", "phone_number"],
      "msg": "Phone must be 10 digits after cleaning (got 3)",
      "type": "value_error"
    }
  ]
}
```

**Response** (400 - Invalid Object Type):
```json
{
  "detail": "Invalid object_type: expected 'leadgen', got 'page'"
}
```

#### GET `/api/meta-leads/webhook`
**Purpose**: Meta webhook verification endpoint

**Query Parameters**:
- `hub.mode`: Should be "subscribe"
- `hub.verify_token`: Verification token (not validated in demo)
- `hub.challenge`: Challenge string to echo back

**Response** (200):
```
<hub.challenge value as integer>
```

---

## 8. Assumptions and Decisions

### Source Conflict (Section 5.1)
**Question**: A person signs up through an Instagram link but also types a member's name as their referrer. Who gets the credit?

**Decision**: **Referral link takes priority over tagged source links.**

**Reasoning**:
1. Referral links represent direct, personal advocacy with higher value.
2. The referrer expects credit and bonus payout.
3. Implementation: During profile onboarding, if `referral_code` is present in localStorage, we create a `Referral` record and set `referrer_user_id` in the `Signup` record. If a `source_tag` is also present (Instagram link), we store `source_id` but attribute the sign-up to the referrer.
4. Attribution hierarchy: Referral link > Tagged source link > Fallback dropdown.

---

### First Touch vs Last Touch (Section 5.2)
**Question**: A person sees a WhatsApp link, doesn't sign up, then signs up a week later through Instagram. Which source gets credit?

**Decision**: **Last touch attribution.**

**Reasoning**:
1. Last touch reflects the final conversion action.
2. Browser-based tracking (localStorage) only persists the most recent source or referral token.
3. Without device fingerprinting or server-side session tracking, we cannot reliably track cross-visit journeys.
4. Implementation: When a user clicks a source link or referral link, we save the token to localStorage. On signup, we read that token. If they click a new link before completing signup, the new token overwrites the old one.
5. Future improvement: Track all touches with server-side sessions and use a configurable attribution model (first touch, last touch, linear, time decay).

---



### Additional Assumptions

**Cool-off Rule Application**:
- Applies globally: completing *any* survey blocks joining *any* survey for 90 days.
- Alternative considered: per-category cool-off (completing a tech survey blocks tech surveys for 90 days but not fashion surveys). Rejected for simplicity and to maintain panel freshness.

**Survey Quota Enforcement**:
- Quota counts only `approved` and `completed` participations.
- `waitlisted` participations do not count toward quota (ops may later approve them if slots open up).

**Phone Number Uniqueness**:
- One account per phone number.
- If the same phone appears in Meta Lead Ads, CSV import, or manual signup, the system rejects it as duplicate (except for the initial registration).

**Referral Bonus Amount**:
- Fixed at ₹100 per completed referral.
- Future: Make configurable per campaign or source.

---

## 9. Known Issues and Next Steps

### Known Issues

1. **No Real OTP Service**: OTP is mocked (shown on screen for development). Production requires SMS gateway integration (Twilio, MSG91, AWS SNS).

2. **No Webhook Signature Verification**: Meta Lead Ads webhook accepts requests without verifying Meta's signature. Production must verify `x-hub-signature-256` header.

3. **No Device/IP Tracking**: Cannot detect same device/IP signing up multiple times or referral rings. Requires session tracking middleware and IP logging.

4. **No Payout Ledger**: Referral bonuses are tracked but not calculated or paid. Requires payout table, ops approval workflow, and payment gateway integration.

5. **CSV Import No Preview**: Import happens immediately on file upload. Best practice: show preview with row-by-row fixes before commit, let user approve.

6. **No Email Notifications**: Members don't receive email notifications for survey eligibility, referral stage changes, or payout status.

7. **No Real-Time Updates**: Dashboard doesn't auto-refresh when new surveys are added or eligibility changes. Requires WebSocket or polling.

### Next Steps (Prioritized by Impact)

#### High Priority (Production Blockers)

1. **Real OTP Service** (1-2 days)
   - Integrate Twilio or MSG91
   - Add OTP rate limiting (max 3 per hour per phone)
   - Add OTP expiry (5 minutes)

2. **Webhook Security** (1 day)
   - Verify Meta webhook signatures
   - Add IP whitelist for Meta webhooks
   - Add webhook secret token verification

3. **Error Logging and Monitoring** (2 days)
   - Integrate Sentry for error tracking
   - Add structured logging with request IDs
   - Set up uptime monitoring (Pingdom, UptimeRobot)

4. **Database Backups** (1 day)
   - Configure automated daily backups on Neon
   - Test backup restoration procedure

5. **Environment Variable Management** (1 day)
   - Move all secrets to `.env` (JWT secret, database URL, webhook tokens)
   - Add `.env.example` template
   - Document required env vars in README

#### Medium Priority (Feature Completeness)

6. **Payout Ledger** (3-4 days)
   - Create `payouts` table
   - Build admin payout approval UI
   - Integrate Razorpay test mode
   - Add member payout history page

7. **Email Notifications** (2-3 days)
   - Integrate SendGrid or AWS SES
   - Templates: Welcome, Survey Match, Referral Update, Payout Status
   - Add email preferences (opt-in/opt-out)

8. **Fraud Detection** (3-5 days)
   - Add device fingerprinting (FingerprintJS)
   - Track IP addresses per signup
   - Build admin fraud review queue
   - Flag: Same device >3 signups in 24h, Self-referral, Referral rings

9. **CSV Import Preview** (2 days)
   - Parse CSV on upload, don't commit
   - Show preview table with error/fix annotations per row
   - Add "Confirm Import" button to commit

10. **Real-Time Dashboard Updates** (2 days)
    - Add WebSocket support (FastAPI WebSocket or Pusher)
    - Auto-refresh survey list when new surveys added
    - Show live eligibility status changes

#### Low Priority (Nice to Have)

11. **Multi-Language Support** (3-4 days)
    - Add i18n for Hindi, Marathi, Tamil
    - Translate survey titles and descriptions
    - User language preference setting

12. **Survey Analytics Dashboard** (2-3 days)
    - Response rates per survey
    - Demographics breakdown of respondents
    - Time-to-complete tracking
    - Export analytics as PDF report

13. **Referral Leaderboard** (1-2 days)
    - Top referrers by completed referrals
    - Monthly leaderboard with rewards
    - Public page showing top 10 (anonymized)

14. **Survey Preview for Members** (2 days)
    - Show survey questions before joining
    - Estimated time to complete
    - Sample questions preview

15. **Admin Role Permissions** (2 days)
    - Granular permissions (view-only, ops, super-admin)
    - Audit log for admin actions
    - Role assignment UI

---



## Project Structure

```
viewbox-panel-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app, CORS, router registration
│   │   ├── database.py              # SQLAlchemy engine, session, Base
│   │   ├── models.py                # Database models (User, Survey, etc.)
│   │   ├── auth.py                  # JWT token creation, get_current_user
│   │   ├── routers/
│   │   │   ├── auth.py              # /api/auth (send-otp, verify-otp)
│   │   │   ├── members.py           # /api/members (profile, me)
│   │   │   ├── sources.py           # /api/sources (list, create link)
│   │   │   ├── surveys.py           # /api/surveys (create, active, join)
│   │   │   ├── referrals.py         # /api/referrals (my-referrals, stats, update stage)
│   │   │   ├── admin.py             # /api/admin (respondents, export, import, sources dashboard)
│   │   │   └── meta_leads.py        # /api/meta-leads (webhook)
│   │   └── services/
│   │       ├── eligibility.py       # Eligibility engine with cool-off rule
│   │       └── csv_import.py        # Resilient CSV parser
│   ├── requirements.txt
│   ├── .env.example
│   ├── viewbox_respondents_sample.csv
│   └── test_meta_leads.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Router, ProtectedRoute, AdminRoute
│   │   ├── api/
│   │   │   └── client.js            # Axios instance with auth interceptor
│   │   └── pages/
│   │       ├── Login.jsx            # Phone + OTP auth
│   │       ├── ProfileOnboarding.jsx # Profile form with source attribution
│   │       ├── Dashboard.jsx        # Live surveys with eligibility
│   │       ├── Referrals.jsx        # Referrals tracking
│   │       ├── AdminRespondents.jsx # Respondent grid, search, filter, CSV
│   │       └── AdminSources.jsx     # Source dashboard
│   ├── package.json
│   └── PS.md                        # Technical assessment spec
├── design/
│   ├── user-flow.png                # Main user flow diagram (Day 2)
│   └── database-diagram.png         # Database schema (Day 2)
└── README.md                        # This file
```

---

## License

This project is a technical assessment submission for Concave Insights. All rights reserved.
