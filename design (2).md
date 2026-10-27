# AICTE Complaint Intelligence Hub (CIH) — UI/UX Design

## 1. Product Identity

- **Product name:** AICTE Complaint Intelligence Hub (CIH)
- **Tagline:** One institution, one complaint view, across every bureau and cell.
- **Design objective:** A trustworthy, government-grade case-management interface that prioritizes clarity, traceability and actionable information over decoration.

## 2. Design Principles

1. **Institution-first:** Institution search and Institution 360 should be central navigation paths.
2. **Clear status at a glance:** Every complaint row and detail view should make status, priority, SLA age and responsible Bureau easy to scan.
3. **Evidence before conclusions:** AI suggestions must be labelled, explainable and linked to source text.
4. **Quiet operational UI:** Keep forms, tables and routine screens disciplined; reserve richer visuals for the Connected Case Network and Analysis Studio.
5. **Role-aware density:** Mobile-first student experience; dense desktop workspace for Officials and Admin/Leadership.
6. **Accessible by default:** Visible keyboard focus, ARIA labels, sufficient contrast and large-text option.
7. **Multilingual:** Language switcher appears in every header.

## 3. Visual System

### 3.1 Color tokens

Use navy and teal as the primary palette. Reserve red, amber and green for status/risk semantics rather than decoration.

| Token | Suggested value | Use |
|---|---|---|
| `navy-950` | `#10243A` | Main navigation / dark surfaces |
| `navy-800` | `#183A56` | Primary headings and selected navigation |
| `teal-700` | `#087F8C` | Primary action and key interactive states |
| `teal-100` | `#D9F1F0` | Subtle selected/background state |
| `surface` | `#FFFFFF` | Light-mode cards and panels |
| `page` | `#F4F7FA` | Light-mode page background |
| `text-primary` | `#182533` | Main text |
| `text-muted` | `#617283` | Secondary text |
| `risk-red` | `#C63D45` | High risk, breached SLA, conflict |
| `risk-amber` | `#B7791F` | At-risk / approaching deadline |
| `risk-green` | `#21845B` | Healthy / resolved / within SLA |
| `border` | `#DCE4EA` | Dividers and outlines |

Check all foreground/background combinations for WCAG contrast before release. Do not rely on color alone: pair status colors with text and/or icons.

### 3.2 Typography
- Primary font: **IBM Plex Sans**.
- Use clear hierarchy: page title, section heading, table labels and body text.
- Keep dense table text comfortably readable; support a large-text setting.
- Use tabular numerals for counts, dates and SLA durations where possible.

### 3.3 Shape, spacing and motion
- Use consistent spacing tokens and restrained card borders.
- Use modest corner radii; avoid excessive pills, gradients, glass effects or decorative shadows.
- Animation should explain change (chart transitions, network clustering, count-up values), not delay tasks.
- Respect reduced-motion preferences.

## 4. Global Application Shell

### Header (all authenticated roles)
- CIH logo/wordmark and current section.
- Global institution/case search entry point where appropriate.
- Language selector: English, Hindi, Marathi, Bengali, Tamil, Telugu.
- Light/dark mode toggle.
- Large-text/accessibility control.
- Notification centre.
- User menu with role/level and sign-out.

### Navigation
Navigation items are filtered by permissions, but backend authorization remains authoritative.

**Student navigation**
- Home
- File a Complaint
- Track My Complaints
- Notifications
- Help / Voice Guidance

**Official navigation**
- My Inbox
- Institution Search / Institution 360
- Related Cases / Case Groups
- Referrals
- SLA Tracker
- Reports / Analysis Studio
- Connected Case Network
- Notifications

**Bureau Head additions**
- Bureau Workload
- SLA Breaches
- Escalation History

**Regional Officer**
- State-scoped case views and reports only.

**Admin/Leadership**
- National Dashboard
- Root-Cause Insights
- Reports / Analysis Studio
- Connected Case Network
- Users and Rules
- Audit Log
- Settings

## 5. Login Experience

Build one login page with three role tabs; do not create separate login pages.

- **Student:** mobile number + mock OTP; OTP is visibly shown for the prototype.
- **Official:** email + password.
- **Admin/Leadership:** email + password.
- Each tab includes a **Fill demo credentials** action.
- A **Demo mode** action signs in as a seeded user.
- Show concise validation errors next to the relevant field.
- Clearly label prototype/demo authentication; do not imply production-grade identity verification.
- After login, redirect to the matching role home screen.

## 6. Student Portal

### 6.1 Student home
Mobile-first summary cards:
- Submitted complaints
- In progress
- Awaiting response
- Resolved

Show recent complaints as compact cards with complaint ID, institution, current status and last update. Avoid exposing internal officer-only details.

### 6.2 File Complaint Wizard
Use a short, step-based form with visible progress:
1. Find institution — searchable, typo-tolerant suggestions and verified AICTE ID.
2. Describe issue — text area, language selector, microphone and read-aloud controls.
3. Attach evidence — camera capture, photo preview/retake, multiple images and document upload.
4. Review — show institution and complaint details before submission.
5. Confirmation — complaint ID, triage result, suggested category/Bureau and expected resolution date.

Additional requirements:
- Offer anonymous submission where the workflow permits it.
- Voice-guided mode asks one question at a time using speech synthesis.
- OCR extracts text from a photographed receipt/notice and asks the user before adding it to the description.
- Show graceful browser-support fallback messages for speech, camera and OCR.
- Preserve the original complaint text and original language.
- Do not promise an exact resolution date unless the system has a configured SLA estimate; label it as an estimate.

### 6.3 Track Complaint
- Timeline of status changes and visible updates.
- Officer remarks that are permitted for complainant visibility.
- In-app notifications and a clearly labelled mock delivery log for SMS/email/WhatsApp.
- Feedback form after closure.
- Read-aloud control for status and instructions.

## 7. Official Workspace

### 7.1 Official home / inbox
- Summary row: assigned cases, overdue, high priority, awaiting institution and referrals pending.
- Search and filters above the table.
- Table columns: Complaint ID, Institution, Category, Priority, Bureau, Status, Assigned Officer, SLA Age, Due Date, Last Updated.
- Make overdue and conflict states visually clear with labels and icons.
- Support sorting, pagination, saved filter presets and empty/loading/error states.

### 7.2 Complaint detail
Suggested layout:
- **Top summary:** complaint ID, institution, category, priority, status and SLA state.
- **Main column:** original complaint, translation, attachments and action timeline.
- **Side column:** AI summary, AI triage trace, related cases, institution mini-profile and conflict alerts.
- **Lower sections:** referrals, officer notes, action history and escalation history.

AI summary must contain:
- Main issue
- Institution involved
- Important dates
- Actions already taken
- Outstanding information
- Recommended next step

Each summary field should link to source text. Selecting it highlights the supporting sentence in the original complaint or attachment where technically available. Include **Regenerate** and **Mark as verified** controls plus an **AI-generated** label.

### 7.3 Case actions
- Add action-taken note and evidence.
- Request input from another Bureau and track its response.
- Change status using valid transitions.
- Reassign cases when authorized.
- Use action templates such as show-cause notice draft and inspection request.
- Show a confirmation step for consequential changes.
- Every override, reassignment and status change should be audit-logged.

### 7.4 SLA tracker
- Green: within SLA.
- Amber: approaching due date.
- Red: overdue/breached.
- Show elapsed time, due date, responsible officer and escalation history.
- Explain the next escalation target.
- Bureau Heads see workload and SLA breaches for their Bureau.

## 8. Institution 360 Profile

This is a key screen because the institution is the central entity.

### Header
- Institution name and AICTE ID.
- State/district and programs.
- Approval status and renewal date.
- Court-stay indicator when present.
- Risk score from 0–100 with a visible “why this score?” breakdown.

### Main sections
1. Overview: status, renewal, risk factors and key alerts.
2. Complaint timeline: cases across all Bureaus.
3. Bureau-wise status: open, overdue and resolved counts.
4. Linked case groups: related complaint clusters.
5. Actions and penalties: show-cause, penalty, court order and notes.
6. Connected network: compact graph linking institution, complaints, Bureaus and actions.
7. Conflict alerts: rule, evidence, date and recommended review.

Risk factors should show their contribution (severity, repeat frequency, SLA ageing and penalties). Avoid presenting the score as a legal or regulatory verdict.

## 9. Analysis Studio

Every report has a visual analysis view above its underlying table. Shared filters update all charts together:
- Date range
- Bureau
- Category
- State
- Institution

Charts required by the brief:
1. Sankey: Channel → Category → Bureau → Status.
2. Calendar heatmap: daily complaint volume over 12 months.
3. India state choropleth: volume / overdue rate / risk toggle.
4. Stacked area: monthly volume by category and SLA breach-rate line.
5. Treemap: themes by volume, colored by growth.
6. Radar: compare two or three institutions on severity, repeat rate, ageing, penalties and conflicts.
7. Bubble: institution complaint count, average age and risk score.
8. Bureau workload bars with SLA gauge and backlog trend.
9. Funnel: Received → Triaged → Assigned → Action taken → Resolved.
10. Period comparisons: month vs previous month and quarter vs same quarter last year.
11. Top 10 risky institutions with sparklines.
12. AI insight strip with evidence links.

Interactions:
- Hover tooltips with clear units.
- Click a chart element to drill down to matching complaints.
- Date range and filters remain visible.
- Export chart as PNG; export full analysis to PDF and data to CSV/Excel where supported.
- Presentation mode cycles charts full-screen.
- Label generated findings as AI-generated and link each to supporting records.

## 10. Connected Case Network

The visual showpiece: a full-screen, dark canvas with glowing nodes, force-directed clusters and smooth but restrained motion. Provide a compact version in Institution 360 and Complaint Detail.

### Node types
Complaint, Institution, Category, Bureau/Department, State/Region, Officer, Process Stage, anonymized Complainant Group, Action/Notice.

### Edge types
Similar text/process, same institution, same category, handled by Bureau, same region/state, assigned to officer, same process stage, escalated/referred to, conflict, and led to action.

### Controls
- Toggle node and edge types.
- Similarity threshold slider.
- Date-range slider.
- Category/Bureau/state filters.
- Node search and “Focus on this institution”.
- Cluster by category, institution, Bureau, state or process stage.
- Force/radial/hierarchical layouts.
- Timeline play button to replay graph growth.
- Shortest path between two nodes.
- Zoom, pan, minimap and fullscreen.
- Export PNG and JSON.

### Interactions and safety
- Hover highlights a node and its neighbours; dim unrelated nodes.
- Tooltip shows a concise summary.
- Click opens a side panel with details, connection explanation and authorized record link.
- Double-click expands neighbours.
- Pattern callouts show a human-readable pattern and a **Show supporting complaints** action.
- Include a legend and “How to read this map” help.
- Enforce permissions before graph data reaches the browser; keep complainant data masked.
- Use a visible edge threshold/cap so 400+ complaints remain responsive.

## 11. Root-Cause Dashboard

For Admin/Leadership:
- Frequent complaint themes with keyword labels and counts.
- Period comparison with percentage change.
- Bureaus with increasing backlog and trend lines.
- Repeated process-stage issues across institutions.
- National heatmap, institution risk leaderboard, pendency trends and SLA compliance gauge.
- Each insight card includes:
  - AI-generated explanation of what changed and why it may be happening.
  - **Show supporting complaints** action.
  - **View in network** action that opens the related graph pattern.

Insights must be evidence-linked and phrased as hypotheses, not unsupported causal claims.

## 12. Admin Settings

One Settings page with tabs:
- **Users:** list users and edit allowed role/scope fields.
- **SLA & conflict rules:** editable table with validation and clear effect descriptions.
- **Audit log:** filterable event list and **Verify audit trail** action.

Use confirmation dialogs for impactful changes. Record settings changes in the audit log.

## 13. Multilingual, Accessibility and Responsive Behaviour

- UI languages: English, Hindi, Marathi, Bengali, Tamil and Telugu.
- Keep all UI text in `react-i18next` JSON resources.
- Preserve complaint original text and language; show English translation separately.
- Student screens prioritize mobile layouts and touch-friendly controls.
- Official/Admin screens prioritize desktop table density but remain usable on tablets.
- Keyboard navigation and visible focus for all controls.
- ARIA labels for icon-only controls.
- Statuses use text/icons as well as colors.
- Large-text option and high-contrast checks.
- Graceful fallback when speech, camera or OCR browser APIs are unavailable.

## 14. Reusable UI Components

- `AppShell`, `Header`, `Sidebar`, `LanguageSwitcher`, `ThemeToggle`
- `RoleLoginTabs`, `DemoCredentialsPanel`
- `StatusBadge`, `PriorityBadge`, `SlaIndicator`, `RiskScoreCard`
- `InstitutionSearch`, `InstitutionSummaryCard`, `ComplaintTable`
- `ComplaintTimeline`, `AttachmentViewer`, `EvidenceCapture`
- `AiGeneratedLabel`, `AiTriageTrace`, `AiSummaryCard`, `SourceEvidenceHighlight`
- `RelatedCasesPanel`, `ConflictAlertCard`, `ReferralPanel`
- `FilterBar`, `SavedPresetMenu`, `ChartCard`, `ExportMenu`
- `ConnectedCaseNetwork`, `NetworkLegend`, `NetworkDetailsPanel`
- `NotificationCenter`, `AuditTrailViewer`, `EmptyState`, `ErrorState`, `LoadingState`

## 15. UI Acceptance Checklist

- [ ] One login page with three role tabs and demo actions.
- [ ] Each role lands on a permitted home screen.
- [ ] Language switcher is available in every header.
- [ ] Light/dark mode and large-text option work.
- [ ] Student complaint wizard supports text, voice, camera and document evidence with graceful fallbacks.
- [ ] AI outputs are labelled, explainable and verifiable.
- [ ] Institution 360 displays cross-Bureau complaint history and explainable risk factors.
- [ ] Search, filters, chart drill-down and report exports work.
- [ ] Connected Case Network controls and pattern callouts work.
- [ ] Loading, empty and error states are designed; no dead buttons.
