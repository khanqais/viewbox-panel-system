# ViewBox Panel System - Architecture & Design

## 1. Main User Flows

```
[New User] 
     │
     ├─── Clicks tagged link (WhatsApp/Instagram/Website/Meta)
     │         └──> Saves source_token to localStorage
     │
     ├─── Clicks referral link (?ref=VB1234)
     │         └──> Saves referral_code to localStorage
     │
     └─── Visits directly
               └──> Asks "How did you hear about us?" on profile
     │
     ▼
[Login Screen] (/login)
     │
     ├─── Enters phone number
     ├─── Requests OTP (mocked: shown on screen)
     └─── Enters OTP and verifies
     │
     ▼
[Profile Check]
     │
     ├─── If profile exists ───> Redirect to /dashboard
     │
     └─── If no profile ───────> Redirect to /profile
               │
               ▼
          [Profile Onboarding] (/profile)
               ├─── Full Name
               ├─── Date of Birth (calculates age)
               ├─── Gender (Male/Female/Non-Binary/Prefer not to say)
               ├─── City (Mumbai/Delhi NCR/Bengaluru/etc.)
               ├─── Income Range (₹5-10L / ₹10-20L / ₹20L+)
               ├─── Interests multi-select (Tech, Fashion, Food, etc.)
               └─── Source Attribution:
                         ├─── If referral_code present ───> Creates Referral in 'lead' stage
                         ├─── If source_token present ────> Saves source_id
                         └─── Fallback dropdown ──────────> Saves selected source
               │
               ▼
          [Respondent Dashboard] (/dashboard)
               ├─── Welcome & Personal Referral Link
               ├─── Navigation: [👥 My Referrals] | [👑 Admin Panel (if admin)]
               │
               └─── Live Surveys List:
                         ├─── Highlight: ⭐ Matches Your Interests
                         ├─── Reward, Quota, Deadline
                         ├─── Eligibility Status Badge:
                         │         ├─── [✓ Eligible] ───> Shows "Join Survey →" button
                         │         ├─── [⏳ Waitlisted] ─> Shows "Join Waitlist →" button
                         │         └─── [Not Eligible] ─> Shows plain-text reason
                         │
                         └─── 3-Month Cool-off Rule:
                                   └──> If completed prior survey in last 90 days:
                                        Shows: "Not eligible: 3-month cool-off active. Eligible on YYYY-MM-DD"
```

## 2. Referral Lifecycle

```
[Member A shares referral link] 
     │
     ▼
[Friend B clicks link and signs up]
     │
     ▼
[Referral Record Created]
     ├─── Stage: "lead"
     └─── Referrer: Member A, Referred: Friend B
     │
     ▼
[Ops Reviews Friend B's Profile]
     │
     ├─── If matches target demographics:
     │         └──> Ops updates stage to "fit"
     │
     └─── If doesn't fit criteria:
               └──> Ops updates stage to "failed" with fail_reason
     │
     ▼
[Friend B Joins and Completes Survey]
     │
     ▼
[Ops Runs Quality Check]
     │
     ├─── If passed:
     │         ├─── Ops updates stage to "completed"
     │         ├─── Records survey participation as "completed"
     │         └─── Member A earns ₹100 referral bonus!
     │
     └─── If failed quality check:
               └──> Ops updates stage to "failed" with fail_reason
```

## 3. Database Schema

```
┌─────────────────────────────────┐
│              users              │
├─────────────────────────────────┤
│ id (PK)                         │
│ phone (VARCHAR, UNIQUE)         │
│ name (VARCHAR)                  │
│ role (VARCHAR: member/admin)    │
│ referral_code (VARCHAR, UNIQUE) │
│ created_at (TIMESTAMP)          │
└────────────────┬────────────────┘
                 │
                 ├─────────────────────────────────┐
                 │ 1:1                             │ 1:N
                 ▼                                 ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│         member_profiles         │   │             signups             │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ id (PK)                         │   │ id (PK)                         │
│ user_id (FK -> users.id)        │   │ user_id (FK -> users.id)        │
│ date_of_birth (DATE)            │   │ source_id (FK -> sources.id)    │
│ gender (VARCHAR)                │   │ signup_link_id (FK)             │
│ city (VARCHAR)                  │   │ referrer_user_id (FK -> users)  │
│ income_range (VARCHAR)          │   │ created_at (TIMESTAMP)          │
│ interests (VARCHAR)             │   └────────────────┬────────────────┘
└─────────────────────────────────┘                    │
                                                       │ N:1
                                                       ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│          signup_links           │   │             sources             │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ id (PK)                         │   │ id (PK)                         │
│ source_id (FK -> sources.id)    │──>│ name (VARCHAR)                  │
│ token (VARCHAR, UNIQUE)         │   │ type (VARCHAR)                  │
│ created_at (TIMESTAMP)          │   │ slug (VARCHAR, UNIQUE)          │
└─────────────────────────────────┘   │ is_active (BOOLEAN)             │
                                      └─────────────────────────────────┘

┌─────────────────────────────────┐
│            referrals            │
├─────────────────────────────────┤
│ id (PK)                         │
│ referrer_id (FK -> users.id)    │
│ referred_id (FK -> users.id)    │
│ stage (lead/fit/completed/fail) │
│ fail_reason (VARCHAR)           │
│ created_at (TIMESTAMP)          │
│ updated_at (TIMESTAMP)          │
└─────────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│             surveys             │   │          survey_rules           │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ id (PK)                         │   │ id (PK)                         │
│ title (VARCHAR)                 │   │ survey_id (FK -> surveys.id)    │<──┐
│ description (TEXT)              │   │ field (age/city/gender/income)  │   │ 1:N
│ reward_amount (DECIMAL)         │   │ operator (equals/in/range)      │   │
│ quota (INTEGER)                 │   │ value (VARCHAR)                 │   │
│ deadline (DATE)                 │   │ strictness (strict/flexible)    │   │
│ category (VARCHAR)              │   └─────────────────────────────────┘   │
│ status (active/closed)          │                                         │
└────────────────┬────────────────┘                                         │
                 │                                                          │
                 │ 1:N                                                      │
                 ▼                                                          │
┌─────────────────────────────────┐                                         │
│         participations          │                                         │
├─────────────────────────────────┤                                         │
│ id (PK)                         │                                         │
│ member_id (FK -> users.id)      │                                         │
│ survey_id (FK -> surveys.id)    │─────────────────────────────────────────┘
│ result (approved/waitlist/rejc) │
│ completed_on (DATE)             │
│ created_at (TIMESTAMP)          │
└─────────────────────────────────┘
```
