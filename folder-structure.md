# AICTE Complaint Intelligence Hub (CIH) — Folder Structure

This structure follows the supplied project brief. It separates the React frontend, FastAPI backend, offline AI layer, seed data, tests and documentation. Start with the core workflow and add signature features in the order described below.

```text
aicte-complaint-intelligence-hub/
├── README.md
├── architecture.md
├── design.md
├── folder-structure.md
├── DEMO_SCRIPT.md
├── .env.example
├── .gitignore
├── docker-compose.yml                 # Optional one-command container startup
├── Makefile                           # Optional shortcuts for dev/test/seed/reset
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── public/
│   │   ├── favicon.svg
│   │   └── maps/
│   │       └── india-states.geojson
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── vite-env.d.ts
│       ├── app/
│       │   ├── router.tsx
│       │   ├── route-guards.tsx
│       │   ├── providers.tsx
│       │   └── query-client.ts
│       ├── assets/
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── PageContainer.tsx
│       │   ├── common/
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── PriorityBadge.tsx
│       │   │   ├── SlaIndicator.tsx
│       │   │   ├── RiskScoreCard.tsx
│       │   │   ├── AiGeneratedLabel.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   ├── LoadingState.tsx
│       │   │   └── ErrorState.tsx
│       │   ├── institutions/
│       │   │   ├── InstitutionSearch.tsx
│       │   │   └── InstitutionSummaryCard.tsx
│       │   ├── complaints/
│       │   │   ├── ComplaintTable.tsx
│       │   │   ├── ComplaintTimeline.tsx
│       │   │   ├── ComplaintWizard.tsx
│       │   │   ├── EvidenceCapture.tsx
│       │   │   ├── AttachmentViewer.tsx
│       │   │   ├── AiTriageTrace.tsx
│       │   │   ├── AiSummaryCard.tsx
│       │   │   ├── SourceEvidenceHighlight.tsx
│       │   │   ├── RelatedCasesPanel.tsx
│       │   │   └── ConflictAlertCard.tsx
│       │   ├── filters/
│       │   │   ├── FilterBar.tsx
│       │   │   └── SavedPresetMenu.tsx
│       │   ├── charts/
│       │   │   ├── ChartCard.tsx
│       │   │   ├── SankeyChart.tsx
│       │   │   ├── CalendarHeatmap.tsx
│       │   │   ├── IndiaChoropleth.tsx
│       │   │   ├── CategoryAreaChart.tsx
│       │   │   ├── ThemeTreemap.tsx
│       │   │   ├── InstitutionRadarChart.tsx
│       │   │   ├── InstitutionBubbleChart.tsx
│       │   │   ├── BureauWorkloadChart.tsx
│       │   │   ├── ComplaintFunnel.tsx
│       │   │   ├── PeriodComparison.tsx
│       │   │   └── RiskLeaderboard.tsx
│       │   ├── network/
│       │   │   ├── ConnectedCaseNetwork.tsx
│       │   │   ├── NetworkToolbar.tsx
│       │   │   ├── NetworkLegend.tsx
│       │   │   ├── NetworkDetailsPanel.tsx
│       │   │   └── PatternCallout.tsx
│       │   └── notifications/
│       │       └── NotificationCenter.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── StudentPortal.tsx                  # Student Portal: File (30-day anti-duplicate), Track, Timeline, College Record
│       │   ├── OfficialWorkspace.tsx              # Official Case Officer & Bureau Head Workspace
│       │   ├── AdminDashboard.tsx                 # Admin Section 1: National KPI cards, State Heatmap, 12m Pendency, Risky Institutes
│       │   ├── RootCauseDashboard.tsx             # Admin Section 2: Insights, Process Failures, Treemap, 6 Insight Cards
│       │   ├── NetworkGraph.tsx                   # Admin Section 3: Full-screen Connected Case Network
│       │   ├── Institution360.tsx                 # Admin Section 4: Institution Registry, 360 Dossier, Radar Compare, Admin Edit
│       │   ├── AdminEscalationsPage.tsx           # Admin Section 5: Chairman Escalation Queue & Cross-Bureau Conflicts
│       │   ├── VisualAnalyticsStudio.tsx          # Admin Section 6: Reports Studio & Downloads
│       │   └── SettingsPage.tsx                   # Admin Section 7: Users, Rules, Categories, AI Oversight, CSV Import, SHA-256 Audit Log
│       ├── features/
│       │   ├── auth/
│       │   │   ├── auth-api.ts
│       │   │   ├── auth-store.ts
│       │   │   └── permissions.ts
│       │   ├── complaints/
│       │   │   ├── complaint-api.ts
│       │   │   └── complaint-types.ts
│       │   ├── institutions/
│       │   │   ├── institution-api.ts
│       │   │   ├── reports/
│       │   │   └── report-api.ts
│       │   └── network/
│       │       └── network-api.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useSpeechRecognition.ts
│       │   ├── useSpeechSynthesis.ts
│       │   ├── useCamera.ts
│       │   └── useDebounce.ts
│       ├── lib/
│       │   ├── api-client.ts
│       │   ├── formatters.ts
│       │   ├── permissions.ts
│       │   └── constants.ts
│       ├── i18n/
│       │   ├── index.ts
│       │   └── locales/
│       │       ├── en.json
│       │       ├── hi.json
│       │       ├── mr.json
│       │       ├── bn.json
│       │       ├── ta.json
│       │       └── te.json
│       ├── styles/
│       │   └── index.css
│       └── tests/
│           ├── setup.ts
│           ├── login.test.tsx
│           ├── permissions.test.tsx
│           └── complaint-wizard.test.tsx
│
├── backend/
│   ├── pyproject.toml                 # Or requirements.txt; choose one primary dependency file
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app and router registration
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py            # JWT and password hashing
│   │   │   ├── permissions.py         # Role, level, Bureau and state scope checks
│   │   │   └── logging_config.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── init_db.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── institution.py
│   │   │   ├── complaint.py
│   │   │   ├── case_group.py
│   │   │   ├── bureau.py
│   │   │   ├── action.py
│   │   │   ├── referral.py
│   │   │   ├── notification.py
│   │   │   ├── audit_log.py
│   │   │   ├── conflict_alert.py
│   │   │   └── risk_score_snapshot.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── institution.py
│   │   │   ├── complaint.py
│   │   │   ├── triage.py
│   │   │   ├── action.py
│   │   │   ├── referral.py
│   │   │   ├── report.py
│   │   │   ├── network.py
│   │   │   └── notification.py
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   └── routers/
│   │   │       ├── auth_router.py
│   │   │       ├── institutions_router.py     # Includes PUT /api/institutions/{id}/admin-edit
│   │   │       ├── complaints_router.py       # Includes 30-day anti-duplicate filing rule check
│   │   │       ├── analytics_router.py        # Includes GET /api/analytics/resolution-timeline
│   │   │       ├── cases_router.py
│   │   │       ├── network_router.py
│   │   │       ├── notifications_router.py
│   │   │       ├── settings_router.py         # Includes escalations, conflicts, AI oversight, CSV import, SHA-256 audit verification
│   │   │       └── reports_router.py
│   │   ├── services/
│   │   │   ├── complaint_service.py
│   │   │   ├── institution_service.py
│   │   │   ├── triage_service.py
│   │   │   ├── case_group_service.py
│   │   │   ├── action_service.py
│   │   │   ├── referral_service.py
│   │   │   ├── sla_service.py
│   │   │   ├── conflict_service.py
│   │   │   ├── risk_score_service.py
│   │   │   ├── report_service.py
│   │   │   ├── network_service.py
│   │   │   ├── insight_service.py
│   │   │   ├── notification_service.py
│   │   │   └── audit_service.py
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── interface.py            # AIService protocol/interface
│   │   │   ├── offline_service.py      # Rules, keyword dictionaries and TF-IDF
│   │   │   ├── language_service.py
│   │   │   ├── institution_matcher.py
│   │   │   ├── classifier.py
│   │   │   ├── similarity.py
│   │   │   ├── summarizer.py
│   │   │   ├── query_parser.py
│   │   │   └── insight_generator.py
│   │   ├── utils/
│   │   │   ├── file_validation.py
│   │   │   ├── text_normalization.py
│   │   │   ├── pagination.py
│   │   │   └── date_helpers.py
│   │   └── tests/
│   │       ├── conftest.py
│   │       ├── test_auth_permissions.py
│   │       ├── test_complaints.py
│   │       ├── test_triage.py
│   │       ├── test_related_cases.py
│   │       ├── test_sla_escalation.py
│   │       ├── test_conflict_rules.py
│   │       ├── test_reports.py
│   │       └── test_audit_chain.py
│   ├── scripts/
│   │   ├── seed_demo_data.py
│   │   ├── reset_database.py
│   │   └── verify_audit_chain.py
│   └── data/
│       └── .gitkeep
│
├── storage/
│   ├── uploads/
│   │   └── .gitkeep
│   └── exports/
│       └── .gitkeep
│
├── docs/
│   ├── api-contracts.md
│   ├── database-schema.md
│   ├── security-and-privacy.md
│   ├── testing-plan.md
│   ├── demo-walkthrough.md
│   └── screenshots/
│       └── .gitkeep
│
└── scripts/
    ├── dev.sh
    ├── dev.ps1
    ├── reset-demo-data.sh
    └── reset-demo-data.ps1
```

## Directory Responsibilities

### `frontend/`
All browser-facing code: shared shell, role-specific pages, complaint wizard, institution profile, reports, network map, localization and accessibility.

### `backend/app/api/`
Thin HTTP routes. Parse and validate requests, authenticate users, call services and return schemas. Keep business logic out of route functions where possible.

### `backend/app/services/`
Business workflows: complaint creation, triage orchestration, SLA transitions, case groups, referrals, conflict checks, risk snapshots, reports, notifications and audit entries.

### `backend/app/ai/`
The offline-first AI implementation and its interface. Every AI feature must work without an external provider. Keep provider-specific code behind the interface.

### `backend/app/models/` and `schemas/`
SQLAlchemy persistence models are separate from Pydantic request/response schemas.

### `backend/scripts/`
Seed and reset commands for reproducible demo data. The seed script should create synthetic institutions, users, complaints and intentional patterns described in `architecture.md`.

### `storage/`
Local prototype uploads and generated exports. Keep these out of Git; validate uploaded files and avoid committing real or sensitive data.

### `docs/`
Supporting documentation and test/demo notes. The root-level three markdown files remain the primary architecture, design and folder reference requested for project setup.
