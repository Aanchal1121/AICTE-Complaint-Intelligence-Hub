# AICTE Complaint Intelligence Hub (CIH) — Architecture

**Tagline:** One institution, one complaint view, across every bureau and cell.  
**Problem statement:** Integrated dashboard for monitoring and tracking institution-related complaint cases across AICTE Bureaus/Cells.

## 1. Architecture Goals

- Make the **institution** the central entity: every complaint should link to an AICTE Institution ID.
- Give authorized users a consolidated view of complaint history, status, risk, related cases and pending actions.
- Support cross-Bureau coordination, duplicate/related-case detection, SLA monitoring and conflict alerts.
- Keep the prototype fully usable offline through a rule/keyword/TF-IDF AI implementation.
- Enforce permissions in both frontend routes and backend data queries.
- Make AI outputs explainable, reviewable and auditable.

## 2. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Web frontend | React, Vite, TypeScript | SPA, role-based screens and workflows |
| Styling/accessibility | Tailwind CSS, IBM Plex Sans | Responsive government-grade UI, focus states and large-text option |
| Charts | Apache ECharts, Recharts | Analysis studio, dashboards and simple charts |
| Relationship map | `react-force-graph-2d` or Cytoscape.js with fcose | Connected Case Network |
| Localization | `react-i18next` | English, Hindi, Marathi, Bengali, Tamil and Telugu |
| Maps | Leaflet | Geographic views where applicable |
| API | FastAPI (Python) | REST endpoints and authorization |
| ORM/database | SQLAlchemy, SQLite | Prototype persistence; schema designed to be PostgreSQL-compatible |
| Authentication | JWT + role-based access control | Sign-in and permission enforcement |
| AI layer | Pluggable `AIService` | Offline language tagging, translation hook, triage, classification, similarity, summaries and insights |
| Browser capabilities | Web Speech API, `getUserMedia`, `tesseract.js` | Speech, camera capture and basic OCR |
| Testing | pytest plus frontend tests | API, permissions, workflow and UI checks |

## 3. High-Level System Diagram

```mermaid
flowchart TD
    U[Student / Case Officer / Bureau Head / Regional Officer / Admin] --> FE[React + Vite + TypeScript SPA]
    FE --> AUTH[JWT Authentication + Role/Scope Guards]
    FE --> API[FastAPI REST API]
    API --> RBAC[Authorization and Data-Scope Checks]
    RBAC --> SVC[Application Services]
    SVC --> DB[(SQLite / SQLAlchemy)]
    SVC --> AI[AIService Interface]
    AI --> OFF[Offline Rules + Keywords + TF-IDF]
    AI -. optional provider via environment variable .-> LLM[Optional LLM Provider]
    SVC --> AUD[Hash-Chained Audit Log]
    SVC --> NOTIF[In-App / Mock SMS, Email and WhatsApp Notifications]
    FE --> BROWSER[Speech API / Camera / OCR]
    FE --> VIS[Charts + Connected Case Network]
```

## 4. Application Layers

### 4.1 Frontend
- One login page with three tabs: **Student**, **Official**, and **Admin/Leadership**.
- Role-specific home screens after login:
  - **Student Complainant Portal (`/student`)**:
    - **Tab 1: File Grievance**: Multimodal input (speech dictation, camera OCR, fuzzy institution search), live AI triage preview, and **30-day anti-duplicate filing rule** (preventing refiling of active complaints for the same college + category).
    - **Tab 2: My Grievances & Tracking**: Detailed custody trail, statutory Citizen Charter deadline progress meter, and post-closure feedback.
    - **Tab 3: AICTE Resolution Timeline & Progress**: Authentic AICTE-wide complaint resolution performance metrics (on-time vs delayed, pending on-track vs overdue, average turnaround time, multi-segment lifecycle progress indicator, year-wise comparative chart, prescribed category timelines distinguishing statutory mandates from service standards, and disclosed metadata).
    - **Tab 4: AICTE College Record Explorer**: Searchable registry of AICTE-approved technical colleges, permanent institute IDs, Extension of Approval (EoA) status, approved programs, and mandatory statutory committee compliance (ICC, Anti-Ragging, SGRC).
  - **Official Workspace (`/official`)**:
    - Role-based Case Officer and Bureau Head inbox, live AI classification runner, duplicate tester, cross-dept alerts, deadline tracker, college risk score, and root cause hub.
  - **Admin / Leadership Module (`/admin`)**:
    - Left sidebar: **Dashboard, Insights, Network, Institutions, Escalations, Reports, Settings**.
    - Top bar: Global natural-language search with Web Speech voice input, multilingual selector, theme toggle, and notification bell.
    - **Section 1: Dashboard (`/admin`)**: Clickable KPI cards with MoM trends, interactive state heatmap (volume/overdue/risk toggle), 12-month pendency bar chart, top 10 risky institutions with explainable factor breakdown modal, 6 bureaus performance panel with "Backlog Growing" badge, system SLA circular gauge, and unified filter bar.
    - **Section 2: Insights (`/admin/insights`)**: Root-cause insight dashboard with executive AI insight strip, period comparisons, recurring process failure ranking, topic cluster treemap, and 6 evidence-backed insight cards with review and assign-to-bureau-head controls and supporting complaint drawer.
    - **Section 3: Network (`/network`)**: Full-screen Connected Case Network with pattern highlight filters.
    - **Section 4: Institutions (`/institutions`)**: Searchable/sortable institution table, 2-to-3 college radar comparison matrix, Institution 360 dossier, and Admin Regulatory Status Override modal with audit logging.
    - **Section 5: Escalations & Conflicts (`/admin/escalations`)**: Chairman-level escalation queue with custody history, direction note / reassignment / due date extension / resolve actions, and cross-bureau conflict alert queue with mandatory resolution notes.
    - **Section 6: Reports (`/analytics`)**: Visual Analytics Studio and report library with CSV, Excel, and PDF exports logged to the audit log.
    - **Section 7: Settings (`/settings`)**: Multi-tab control center covering Users (RBAC validation), Rules & SLA thresholds, Category Routing Map, AI Oversight with precision metrics, CSV Ingestion with fuzzy match preview, and SHA-256 Hash-Chained Audit Trail with verification, tamper simulation, and restore tools.

### 4.2 Backend
FastAPI is organized into routers, schemas, models and service modules. API handlers validate input and call services; services enforce permissions and business rules before reading or changing records.

Endpoints:
- `/api/auth/*` — login, demo mode, mock OTP and current user.
- `/api/institutions/*` — institution search, Institution 360, and `PUT /api/institutions/{id}/admin-edit`.
- `/api/complaints/*` — submission with 30-day anti-duplicate validation, list, details, status, and tracking.
- `/api/analytics/resolution-timeline` — authentic statistical aggregator computing AICTE-wide on-time vs delayed resolution, category statutory timelines, multi-year trends, and metadata disclosures.
- `/api/settings/escalations/*` — Chairman-level escalation queue and actions (reassign, direction_note, extend_due_date, resolve).
- `/api/settings/conflicts/*` — cross-bureau conflict alerts and resolution with mandatory notes.
- `/api/settings/ai-oversight` — computed acceptance rates and override records.
- `/api/settings/import-csv` — fuzzy matching institution preview and bulk commit.
- `/api/settings/audit/*` — audit log query, cryptographic hash-chain verification, tamper simulation, and restore.

### 4.3 AIService
Every AI-dependent workflow calls a common interface, so the default offline implementation can be replaced without changing application routes.

Expected operations:
- `detect_language(text)`
- `translate(text, source_language, target_language="en")`
- `resolve_institution(query)`
- `classify_category(text)`
- `detect_process_stage(text)`
- `assess_severity_priority(text, context)`
- `suggest_bureau(text, category)`
- `assign_sla(category, priority)`
- `find_similar_cases(complaint, threshold)`
- `summarize_complaint(complaint)`
- `parse_natural_language_query(query)`
- `generate_root_cause_insights(records)`

The default implementation uses language tagging, a small offline dictionary, rules/keywords and TF-IDF/cosine similarity. Translation and summary quality must be clearly labelled according to the capability available; optional external LLM use is controlled by an environment variable. AI recommendations are not final regulatory decisions.

### 4.4 Data and audit
- SQLAlchemy models persist institutions, complaints, case groups, actions, referrals, bureaus, users, notifications, audit logs, conflict alerts and risk-score snapshots.
- Use foreign keys and indexes for institution IDs, complaint status, bureau, dates and case-group membership.
- Each audit entry stores the previous entry hash and its own hash; an admin action verifies the chain.
- Seed data is synthetic and clearly identified as demo data.
- One documented command resets and reseeds the prototype database.

## 5. Core Data Relationships

```mermaid
erDiagram
    INSTITUTION ||--o{ COMPLAINT : has
    COMPLAINT }o--o| CASE_GROUP : belongs_to
    COMPLAINT ||--o{ ACTION : has
    COMPLAINT ||--o{ REFERRAL : creates
    BUREAU ||--o{ COMPLAINT : handles
    USER ||--o{ COMPLAINT : assigned_to
    USER ||--o{ ACTION : records
    USER ||--o{ NOTIFICATION : receives
    COMPLAINT ||--o{ CONFLICT_ALERT : triggers
    INSTITUTION ||--o{ RISK_SCORE_SNAPSHOT : has
    USER ||--o{ AUDIT_LOG : performs
```

### Core entities
- **Institution:** AICTE ID, name, aliases, state, district, programs, approval status, renewal date, court-stay flag and penalties.
- **Complaint:** institution link, complainant details (maskable), channel, original text/language, English translation, category, Bureau, process stage, priority, severity, status, assigned officer, dates, SLA state, attachments, AI summary, similarity representation and case-group ID.
- **CaseGroup:** related complaints grouped for review; membership can be changed only through authorized workflow.
- **Action:** show-cause, penalty, court order, notes and supporting evidence.
- **Referral:** inter-Bureau request, response and timestamps.
- **User:** role (`student`, `official`, `admin`), level, bureau and/or state scope.
- **AuditLog:** actor, action, target, timestamp, previous hash and current hash.
- **ConflictAlert / RiskScoreSnapshot / Notification:** explainable alerts, dated risk calculations and user notifications.

## 6. Role and Data Access

| Role / level | Expected scope |
|---|---|
| Student | Own submitted complaints and related status/notifications; complainant privacy controls apply |
| Official — Case Officer | Cases assigned to the officer and permitted related-case context |
| Official — Bureau Head | Bureau cases, workload and SLA breaches |
| Official — Regional Officer | Cases within the assigned state |
| Admin/Leadership | National dashboard, root-cause insights, settings and audit log |

The database query layer must enforce role, level, Bureau and state restrictions on every relevant endpoint. Never rely only on hiding frontend components.

## 7. Complaint Triage and Case Workflow

1. Receive complaint text, institution query, channel and optional evidence.
2. Detect language and retain original text; provide English translation where available.
3. Resolve the institution to an AICTE ID with a confidence value.
4. Suggest category and process stage.
5. Assess severity and priority using transparent rules.
6. Suggest the responsible Bureau and assign an SLA.
7. Search for similar complaints and recommend a CaseGroup.
8. Update institution risk snapshot and check configured cross-Bureau conflict rules.
9. Display an AI triage trace with confidence/reasons.
10. Let an authorized officer verify or override recommendations; log each override.

Suggested complaint statuses: `open`, `under review`, `awaiting institution`, `sub-judice`, `resolved`, `penalty imposed`, `withdrawn`. Status transitions should be validated by the backend.

## 8. Institution 360 and Conflict Rules

Institution 360 consolidates approval status, renewal date, risk score with factor breakdown, complaint timeline across Bureaus, Bureau-wise status, court cases, penalties and linked case groups.

The rule engine should flag:
- Approval renewal in progress while unresolved fee or faculty complaints exist.
- Different directions issued by two Bureaus for the same institution.
- Active court stay where enforcement should be held for review.
- The same institution flagged by three or more Bureaus within 60 days.

Alerts are prompts for authorized human review; they do not automatically determine guilt or regulatory outcomes.

## 9. Reporting and Intelligence

- Filtered reports: Bureau pendency, category-wise, state-wise, SLA breaches, institution risk ranking and root-cause summaries.
- Visual analysis: Sankey, calendar heatmap, state choropleth, stacked area, treemap, radar, bubble chart, Bureau workload/SLA gauge, funnel, period comparisons, risky-institution leaderboard and AI insight strip.
- Connected Case Network: at least nine node types and ten edge types, graph filters, similarity threshold, timeline replay, cluster callouts, shortest path and exports.
- Root-Cause dashboard: complaint themes, period change, growing backlogs, recurring process issues and links to supporting complaints.
- Exports: CSV, Excel and PDF where permitted; every download is audit-logged.

## 10. Seed Data and Demo Scenario

Seed synthetic data for:
- 60 institutions and 400 complaints over 12 months.
- Six Bureaus: Approval, Academic, Examination and Quality, Finance, Inspection Cell and Student Welfare Cell.
- Eight categories: fee fraud, fake faculty, infrastructure, affiliation, admission irregularity, harassment/ragging, examination and approval-related.
- Deliberate patterns: a fee-refund issue across three institutions in two states; repeated fee complaints at one institution; renewal pending with serious open complaints; an institution with a court stay; conflicting actions from two Bureaus; and a Bureau with month-on-month backlog growth.

End-to-end demo:
1. Student submits a Hindi voice complaint with a camera photo of a fee receipt and a misspelled institution name.
2. Triage trace shows language handling, institution match, fee-fraud classification, Finance routing, SLA and a related-case cluster.
3. Case Officer verifies the AI summary and investigates a renewal/complaint conflict alert.
4. Officer explores the Connected Case Network and supporting complaints.
5. Officer searches for overdue fee complaints from the last three months in Madhya Pradesh and exports a report.
6. SLA breach escalates; Bureau Head and Admin dashboards update.
7. Admin reviews root-cause insights and verifies the audit chain.

## 11. Security, Reliability and Quality

- Passwords must be hashed; never store plaintext passwords.
- Use short-lived JWTs and validate permissions on the server.
- Validate file type and size; do not trust uploaded filenames.
- Mask complainant details for roles that do not need them.
- Keep demo data synthetic; do not use real complaint or student data in public demos.
- Provide loading, empty, success and actionable error states.
- Add tests for role boundaries, complaint submission, triage, case linking, SLA escalation, exports and audit verification.
- Configure secrets and optional AI provider through environment variables; commit only `.env.example`.
- Provide one-command startup and one-command seed reset.

## 12. Suggested Build Order

1. Foundation: database, seed data, single login, roles, localization and theme.
2. Student complaint submission and tracking.
3. Offline AI triage and trace.
4. Official workspace, actions, referrals and SLA.
5. Institution 360 and conflict alerts.
6. Search, reports and analysis studio.
7. Connected Case Network.
8. Root-cause dashboard.
9. Admin settings, audit verification and notifications.
10. Accessibility, responsive polish, tests and guided demo.

## 13. Architecture Acceptance Checks

- One login page with three role tabs and role-specific home screens.
- Student, Case Officer and Regional Officer cannot access unauthorized records.
- AI outputs expose reasons/confidence and can be reviewed or overridden.
- Summary fields link to supporting original text.
- Connected Case Network supports the required node/edge types, filters, timeline and pattern callouts.
- Reports and exports work on seeded data and downloads are audited.
- No dead buttons; database reset and demo setup are documented.
