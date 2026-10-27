# AICTE Complaint Intelligence Hub (CIH) - End-to-End Demo Script

**Tagline:** *One institution, one complaint view, across every bureau and cell.*

---

## Demo Credentials & Seeded Personas

| Role Tab | Persona Name | Role / Level | Jurisdiction / Bureau | Login Credential |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Aarav Sharma | Student Complainant | Madhya Pradesh | Mobile: `9876543210`<br/>Mock OTP: `123456` |
| **Official** | Vikram Malhotra | Case Officer | Finance Bureau | `officer.finance@aicte.gov.in`<br/>Password: `DemoPass@123` |
| **Official** | Dr. Sunita Deshmukh | Bureau Head | Finance Bureau | `head.finance@aicte.gov.in`<br/>Password: `DemoPass@123` |
| **Official** | Rajeshwar Verma | Regional Officer | Madhya Pradesh State | `ro.mp@aicte.gov.in`<br/>Password: `DemoPass@123` |
| **Admin** | Prof. Anil Sahasrabudhe | Leadership (Chairman's Office) | National (All Bureaus & States) | `admin@aicte.gov.in`<br/>Password: `DemoPass@123` |

> [!TIP]
> **1-Click Demo Mode:** On the login page, you can click any of the 5 seeded persona cards at the top of the screen to sign in instantly without typing! Alternatively, you can use the **Demo Guide** drawer in the top navigation bar at any time.

---

## 8-Step Walkthrough Scenario

### Step 1: Multimodal Grievance Filing (Student)
1. On the Login page (`http://127.0.0.1:5173/login`), click the **Aarav Sharma** persona card (or enter Mobile: `9876543210` with OTP: `123456`).
2. You land on the **Student Portal** (`/student`).
3. Notice the **Voice Assistance** banner. Click the microphone button to dictate in Hindi or type in the description:
   > *"कॉलेज प्रशासन 25,000 रुपये की फीस वापस करने से मना कर रहा है। नो-ड्यूज प्रमाण पत्र देने के बाद भी एकाउंट्स विभाग कोई रिफंड नहीं दे रहा है।"*
4. In the **Institution Search** field, test the typo-tolerant fuzzy search by entering:
   > `Apex College of Engineering Indore` (a misspelling of *Apex Institute of Technology & Management*).
5. Notice the autocomplete instantly matches `AICTE-1-1002931`.
6. Click **Open Camera** or upload a sample receipt to test in-browser camera capture and OCR text extraction via Tesseract.js.
7. Click **Submit Complaint to AICTE**.

### Step 2: Live AI Triage Confirmation & Entity Resolution
1. Immediately upon submission, the live **AI Triage & Routing Confirmation** appears on screen.
2. Review the automated determinations:
   - **Detected Language:** Hindi (`hi`) with confidence `0.94`, translated to English.
   - **Resolved Entity:** *Apex Institute of Technology & Management* (`AICTE-1-1002931`) with confidence `0.96`.
   - **Classified Category:** `fee fraud` (Confidence: `0.94`).
   - **Routed Bureau:** `Finance Bureau`.
   - **Citizen Charter SLA Target:** 30-Day deadline computed.
   - **Clustered Case Group:** `GRP-2025-REFUND-01` (*Inter-State Caution Money & Fee Refund Non-Compliance*) with cosine similarity `0.82`.
3. Click the **Track Status Timeline** button to view the milestone history and simulated SMS, Email, and WhatsApp dispatch logs.

### Step 3: Official Workspace & Sentence-Highlighted AI Summary
1. Open the **Demo Guide** in the top navigation bar and select **Step 3 (Vikram Malhotra - Case Officer)**.
2. You land on the **Official Workspace** (`/official`).
3. Select complaint `CMP-2025-1000` on the left.
4. Review the **Cross-Bureau Conflict Alert** banner:
   > *"Cross-Bureau Complaint Surge: 4 Bureaus Flagged within 60 Days on Apex Institute."*
5. Inspect the **AI Structured Summary Card**:
   - **Main Issue**
   - **Institution Involved**
   - **Important Dates**
   - **Actions Already Taken**
   - **Outstanding Information**
   - **Recommended Next Step**
6. **Sentence Highlighting:** Click on **Main Issue** or **Institution Involved**. Notice the corresponding source sentence in the original complaint text below immediately highlights in yellow!
7. Click **Record Official Action**. In the modal, review the pre-filled template for *Show-Cause Notice Issued under AICTE Regulation 14(b)*, and click **Log Action & Update Audit Trail**.

### Step 4: Connected Case Network & Timeline Replay
1. Navigate to `/network` or click **View in Network Map** from the case dossier.
2. The full-screen dark canvas network displays 105+ nodes and 420+ edges rendered at 60 FPS:
   - **9 Node Types:** Complaints (Cyan), Institutions (Blue), Categories (Emerald), Bureaus (Purple), States (Amber), Officers (Pink), Process Stages (Teal), Actions (Red).
   - **10 Edge Types:** Similarity links, institution links, bureau assignments, and dashed red conflict edges.
3. In the right-hand **Detected Pattern Communities** panel, click **Highlight in Graph** on:
   > *"PAT-001: Inter-State Fee Refund Non-Compliance"*
   Notice the graph isolates and pulses the 3 institutions across MP and Maharashtra.
4. Click the **Timeline Replay (Play)** button in the top toolbar to watch the network dynamically assemble month by month.

### Step 5: Natural Language Search & PDF Report Export
1. From the top navigation or demo drawer, switch to **Rajeshwar Verma (Regional Officer - Madhya Pradesh)**.
2. In the AI Natural Language Search box, type or speak:
   > *"overdue fee complaints from the last three months in Madhya Pradesh"*
3. Observe the AI parser convert the sentence into editable filter chips: `Category: fee fraud`, `State: Madhya Pradesh`, `SLA: Overdue Only`.
4. The list filters instantly to matching breached cases in MP.
5. Click **Export Report** -> **Export PDF**. A downloadable official PDF document is generated with tabular records and registered in the audit trail.

### Step 6: Bureau Head Workload & SLA Breach Command
1. Switch to **Dr. Sunita Deshmukh (Bureau Head - Finance)**.
2. Notice the prominent **Bureau Head Command Overview** banner highlighting:
   > *"8 fee fraud cases have breached the 30-day Citizen Charter SLA and escalated to your desk."*
3. Toggle **Filter SLA Breaches** to review aging cases with red tags showing overdue day counts.

### Step 7: Leadership Root-Cause Diagnostic Studio
1. Switch to **Prof. Anil Sahasrabudhe (Admin / Leadership)** and navigate to `/root-cause`.
2. Review the **Frequently Occurring Topic Clusters**:
   - *Mandatory Caution Money Non-Refund (+38.5% surge)*
   - *Biometric Aadhaar Spoofing for Inspection (+14.2% surge)*
   - *Hazardous Lab Infrastructure Deficiencies (+22.0% surge)*
3. Read the plain-language AI diagnostic for why the systemic breakdown is occurring.
4. Click **Show Supporting** on any cluster to view the supporting complaint cases, and click **Open in Network** to visualize the community.

### Step 8: Cryptographic SHA-256 Audit Trail Verification
1. Navigate to `/settings`.
2. Select the **Audit Trail & Cryptography** tab.
3. Review the immutable audit ledger displaying sequential actions, timestamps, officers, and SHA-256 digests.
4. Click **Verify Audit Trail Integrity**.
5. The backend traverses every entry from the genesis hash to the head, recomputing `SHA256(prev_hash + timestamp + user + action + details)`.
6. A verified green badge appears:
   > **`SECURE_AND_TAMPER_FREE`** — *Successfully verified SHA-256 cryptographic chain across all entries.*
