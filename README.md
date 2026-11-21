# viewbox-panel-system

Panel management system for respondent onboarding, survey eligibility screening, referral tracking, and payouts.

## Docs

- `design/user-flow.md` - User flow diagram (respondent, admin, ops, Meta leads)
- `design/db-diagram.md` - Database ER diagram

## Overview

- **Respondent**: Phone + OTP auth, demographic profile, live survey matching, referral tracking
- **Admin**: Source attribution, survey builder with screening rules, data exports/imports
- **Ops**: Referral review pipeline (Lead -> Fit -> Completed / Failed)
- **Integrations**: Inbound Meta Ads lead capture
