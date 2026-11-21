```mermaid
flowchart TD
    subgraph R["Respondent"]
        R1["Opens sign-up link"] --> R2{"Source tag in link?"}
        R2 -->|Yes| R3["Save source"]
        R2 -->|No| R4["Ask: how did you hear about us?"]
        R3 --> R5["Phone + OTP (shown on screen)"]
        R4 --> R5
        R5 --> R6{"Profile done?"}
        R6 -->|No| R7["Fill profile"]
        R6 -->|Yes| R8["Home: live surveys"]
        R7 --> R8
        R8 --> R9["Eligibility result + reason"]
        R8 --> R10["My Referrals (phone masked)"]
    end

    subgraph A["Admin"]
        A1["Create and manage sources"] --> A2["Create survey + rules"]
        A2 --> A3["Respondent grid + CSV export"]
        A3 --> A4["Source dashboard"]
        A4 --> A5["CSV import with error report"]
    end

    subgraph O["Ops"]
        O1["Referral is Lead"] --> O2["Mark Fit"]
        O2 --> O3["Mark Completed"]
        O1 --> O4["Mark Failed + reason"]
        O2 --> O4
    end

    subgraph M["Meta Ads"]
        M1["Lead comes in"] --> M2["Validate"]
        M2 --> M3{"Already exists?"}
        M3 -->|Yes| M4["Return existing lead"]
        M3 -->|No| M5["Create member, source = Meta Ads"]
    end

    R5 -.->|"referral link"| O1
    A1 -.->|"generates links"| R1
    M5 -.->|"member logs in later"| R5
    O3 -.->|"status visible"| R10
```
