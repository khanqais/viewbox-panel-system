

**Technical Assessment: ViewBox Panel System**

| Role: Full Stack Developer \- Python | Timeline: 7 days \- Submission Window |
| :---- | :---- |

**1\. Background**

**Who We Are**  
Concave Insights is a market research and consumer insights firm. We help major brands understand customer behavior by running targeted consumer surveys and studies.

At present, we create custom survey forms and share them on social media. Participants get paid to fill in these lengthy surveys. We also pay people for referring the survey to others in their circle. Participants often contact our team with queries about their payments, profile details or survey status.

Note: We pay only for complete participation.

Our operations move at an incredibly fast pace:

* **15-Day Project Cycles:** Every research project or survey must be launched, completed and wrapped up within a strict 15-day window.  
* **The 3-Month Cool-off Rule:** To keep our data accurate and unbiased, a consumer who takes part in a project cannot join any other survey for the next 3 months.

**How Members Join**  
New members reach ViewBox Club through 50+ city-wise WhatsApp groups, WhatsApp messages from staff, Instagram and Facebook posts, the website, and links forwarded by existing members. Instagram and Facebook ads are planned next.

**The Referral Bonus**  
A referral bonus is paid only when the new person passes three stages:

* **1\. The Lead:** An existing member shares their referral link with a new person, who signs up.  
* **2\. The Fit:** The operations team checks that the new person's profile matches the survey's criteria.  
* **3\. The Completion:** The new person completes the survey and passes the quality check.

**2\. The Problem Statement**

As the company moves from WhatsApp groups and spreadsheets to an in-house platform, one gap stands out: when links are forwarded from chat to chat, the source of each sign-up is lost. This causes three problems:

* **No Source Tracking:** There is no way to tell which channel brings people who actually complete surveys. New members often forget to enter who referred them.  
* **Unhappy Referrers:** Referrers cannot see whether their friends joined or whether they earned a bonus, so they stop sharing.  
* **Manual Eligibility Checks:** The operations team checks each person by hand for survey fit, cool-off and repeat entries, and members keep calling to ask about their status.

**The Core Objective**  
Build a full-stack web application prototype that records where every new member comes from, credits the right referrer, checks who qualifies for each survey, and lets members see their own status without calling the team.

**3\. Core System Requirements**

**A. Source Tracking**

* **Source Links:** Admin can create a unique sign-up link for each source: one per WhatsApp city group, one per staff member, one per Instagram or Facebook post, and one for the website. Each member also gets a personal referral link.  
* **Sources as Data:** Sources must be stored as data, not written into the code. Admin must be able to add a new source (for example LinkedIn) from the admin screen.  
* **Sign-up and Fallback:** Signing up through a link saves the source automatically. If a person arrives without a tagged link, the sign-up form asks "How did you hear about us?"

**B. Respondent Portal (mobile-first)**

* **Login:** Phone number and OTP. The OTP can be mocked (for example, shown on screen); no SMS service is needed.  
* **Profile:** Filled once after the first login: name, date of birth, gender, city, income range and interests.  
* **Live Surveys:** The home screen lists live surveys. Surveys that match the member's interests are highlighted.

**C. Eligibility Check**

* **Survey Rules:** Admin creates a survey with rules such as age range, city, gender, income range, quota and deadline. Each rule is marked **Strict** or **Flexible**.  
* **Result:** For each member, the system shows **Approved** (all rules met), **Rejected** (a strict rule failed, or the quota or deadline is reached) or **Waitlisted** (a flexible rule failed).  
* **Reason:** Every result shows the reason in plain words, for example "Not eligible: age 17, this survey needs 18 to 35".  
* **3-Month Cool-off:** A member who completed a survey cannot be approved for another one for 3 months. Show the date they become eligible again.

**D. Referral Flow**

* **Stages:** A referred person moves from **Lead** (signed up) to **Fit** (marked by ops) to **Completed** (marked by ops after the survey and quality check). If a referral fails, ops records the reason.  
* **My Referrals:** The referrer sees each friend's current stage and the reason if it failed. Hide the friend's full phone number (for example 98XXXXXX21).

**E. Admin Panel**

* **Respondent Grid:** Search by name, ID or city as you type, and filter by source, city and status.  
* **Data Export:** Download the currently searched or filtered grid as a CSV or Excel file.  
* **Source Dashboard:** For each source, show sign-ups, Fit and Completed counts.  
* **Data Import:** Import the sample file **viewbox\_respondents\_sample.csv** (about 200 existing members). The file is messy on purpose. The app must not crash: skip or fix bad rows and tell the user what happened.  
* **Local Setup:** The app must run locally with the steps in your README.

**F. Meta Ads Lead Endpoint**

* **Research:** Find out how an Instagram or Facebook (Meta) lead ad sends a new lead to a company, and what data it sends (for example lead ID, form ID, campaign or ad ID, time, and the form fields such as name, phone and city).  
* **Mock Endpoint:** Build an API endpoint that accepts a lead in that format and creates a member with the source "Meta Ads", saving the campaign ID. Reject or flag a lead with missing or invalid details, and do not create a duplicate if the same lead is sent twice.  
* **Document It:** In the README, show the endpoint, a sample request and a sample response, so it can be tested without a real ad.

**4\. Advanced Enhancements (Bonus)**

Optional. Attempt these only after the core requirements work.

* **Fraud and Duplicate Flags:** Flag the same phone number signing up twice, self-referral, many sign-ups from one device or IP in a short time, and referral rings (A refers B, B refers A). Flagged cases go to a review queue; never delete them automatically.  
* **Payout Ledger:** Calculate the amount owed for each completed survey and each successful referral. An ops person must approve each payout before it is marked Paid. Connecting a payment gateway in its test (sandbox) mode earns extra points; ops approval must still come first. If you do not connect one, explain in the README how you would (see section 5).  
* **Import Preview and Error Report:** Before saving, show a preview of the CSV and a report of every row that was fixed or skipped, with the reason.

**5\. Decisions and Answers for Your README**

These points are left open on purpose, with no single right answer. Decide, build around your decision, and write your answer and reasoning in the README.

* **Source Conflict:** A person signs up through an Instagram link but also types a member's name as their referrer. Who gets the credit?  
* **First Touch or Last Touch:** A person sees a sign-up link in a WhatsApp group, does not sign up, and signs up a week later through an Instagram post. Which source gets the credit?  
* **Payment Gateway Plan:** If you did not connect a payment gateway, explain how you would: which gateway you would pick and why, the steps and API calls from ops approval to money reaching the member, and how you would handle a failed or pending payout.

**6\. Timeline and Submission**

You have **7 days**, counted from the day you receive this assessment (Day 1).

* **End of Day 2 \- Repository Link:** Email your GitHub repository link. By then, the repository must have a folder named **/design** with (a) a user flow of the main screens and steps, and (b) a database diagram of your tables and how they connect. A photo of a hand-drawn diagram is fine.  
* **End of Day 7 \- Final Submission:** When you are done, email again with the same repository link and your video link.

**Where to Send**  
Email: miloni@concaveinsights.com, CC: genis@concaveinsights.com

Subject: Technical Assessment \- \<Your Name\> \- \<Assessment Name\>

**What to Submit**

* **Language:** Python only for the backend. Use any frontend you are comfortable with.  
* **Code Repository:** A public GitHub repository with your complete source code.  
* **README.md:** Written in the format given below.  
* **Design Folder:** The /design folder from Day 2\. Do not change it after Day 2; add any later changes as new files.  
* **Walkthrough Video:** A 3 to 5 minute screen recording. Run the app from scratch, show the main flow, and explain your database design and how you track sources and referrals.

**README Format**

| README section | What to write |
| :---- | :---- |
| 1\. Project Overview | What the app does, in 3 to 4 lines |
| 2\. Tech Stack | Backend, frontend, database and main libraries |
| 3\. Setup and Run | Step-by-step commands to run the app locally in under 5 minutes, with demo data loaded |
| 4\. Demo Logins and Test Data | Login details for each role, and sample data to try |
| 5\. Features | Every core and bonus feature, marked Done, Partly done or Not done |
| 6\. Database Design | Main tables and how they connect, with a link to your /design folder |
| 7\. API Endpoints | For each endpoint: method, URL, purpose, and a sample request and response |
| 8\. Assumptions and Decisions | Your answers to every point in section 5, and any other assumption you made |
| 9\. Known Issues and Next Steps | What does not work yet, and what you would improve with more time |

**7\. How We Score**

| Area | Weight | What is assessed |
| :---- | :---- | :---- |
| Thinking and approach | 30% | Your Day 2 design, your data model, and how clearly you handled the open decisions |
| UI / UX | 30% | Clear and simple screens, mobile layout, empty, loading and error states |
| Code quality | 20% | Clean structure, input validation, no crash on bad data |
| Git history and documentation | 20% | Regular commits, a clear README and a clear walkthrough video |

**Evaluation Note:** A single code push just before the deadline is a major red flag. Regular, small Git commits across the 7 days should show how the solution was built step by step. A working core scores higher than many half-built extras.