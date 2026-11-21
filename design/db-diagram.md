erDiagram
  SOURCE ||--o{ MEMBER : "first source"
  SOURCE ||--o{ SIGNUP_EVENT : "touched via"
  MEMBER ||--o{ SIGNUP_EVENT : has
  MEMBER ||--o{ REFERRAL : "referrer"
  MEMBER ||--o{ REFERRAL : "referred"
  SURVEY ||--o{ SURVEY_RULE : has
  SURVEY ||--o{ PARTICIPATION : has
  MEMBER ||--o{ PARTICIPATION : takes
  REFERRAL ||--o{ REFERRAL_STAGE_LOG : tracks
  MEMBER ||--o{ FLAG : "may have"
  PARTICIPATION ||--o{ PAYOUT : earns
  REFERRAL ||--o{ PAYOUT : earns

  SOURCE { int id string name string type string slug bool active }
  MEMBER { int id string phone string name date dob string gender string city string income_range string interests int source_id int referred_by_id string meta_campaign_id string meta_lead_id }
  SIGNUP_EVENT { int id int member_id int source_id datetime at string ip string device }
  SURVEY { int id string title int quota date deadline string status }
  SURVEY_RULE { int id int survey_id string field string operator string value string strictness }
  PARTICIPATION { int id int member_id int survey_id string result string reason date completed_on }
  REFERRAL { int id int referrer_id int referred_id string stage string fail_reason }
  REFERRAL_STAGE_LOG { int id int referral_id string stage datetime at int ops_user }
  FLAG { int id int member_id string type string status }
  PAYOUT { int id string kind decimal amount string status int approved_by }