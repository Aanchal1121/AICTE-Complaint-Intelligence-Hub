import os
import sys
import json
import hashlib
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import (
    Institution, User, Complaint, CaseGroup, Action, Referral, ConflictAlert, AuditLog, Notification
)
from .auth import get_password_hash
from .ai_service import ai_service, SLA_POLICY

STATES = [
    "Madhya Pradesh", "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu",
    "Uttar Pradesh", "Gujarat", "Telangana", "Rajasthan", "West Bengal",
    "Kerala", "Punjab", "Haryana", "Odisha", "Andhra Pradesh"
]

CITIES_BY_STATE = {
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "Dwarka"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
    "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur", "Varanasi", "Ghaziabad"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Udaipur"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"]
}

BUREAUS = [
    "Approval",
    "Academic",
    "Examination and Quality",
    "Finance",
    "Inspection Cell",
    "Student Welfare Cell"
]

CATEGORIES = [
    "fee fraud",
    "fake faculty",
    "infrastructure",
    "affiliation",
    "admission irregularity",
    "harassment/ragging",
    "examination",
    "approval-related"
]

PROCESS_STAGES = [
    "fee refund",
    "approval renewal",
    "inspection",
    "admission counselling",
    "faculty verification",
    "exam evaluation",
    "scholarship disbursement",
    "anti-ragging enquiry"
]

CHANNELS = ["Web Portal", "Voice Helpline", "Mobile App", "Physical Letter", "Email", "CPGRAMS Portal"]

PROGRAMS_POOL = [
    ["Computer Science Engineering", "Mechanical Engineering", "MBA"],
    ["Electronics & Communication", "Civil Engineering", "MCA"],
    ["Information Technology", "AI & Data Science", "Pharmacy"],
    ["Electrical Engineering", "Applied Sciences", "B.Tech"],
    ["Mechanical Engineering", "Automobile", "Management Studies"],
    ["Cybersecurity", "Cloud Computing", "Robotics", "MCA"]
]

SAMPLE_COMPLAINT_TEMPLATES = {
    "fee fraud": [
        "College administration is refusing to refund my caution money deposit of Rs 25,000 even after submitting no-dues clearance certificate in August. Accounts department says AICTE guidelines do not apply to private institutions.",
        "Management demanded Rs 50,000 excess capitation fee under 'development charge' before releasing my 7th semester hall ticket. Receipt was denied.",
        "Admission cancelled within 15 days of counselling round, but Registrar deducted 60% of total fees in clear violation of AICTE refund notification.",
        "Withholding original 10th and 12th marksheets until an unauthorized campus placement registration fee of Rs 15,000 is deposited in cash."
    ],
    "fake faculty": [
        "Four senior professors shown on AICTE portal for Computer Science department have never visited the campus. Biometric attendance is being spoofed by ad-hoc staff.",
        "College appointed B.Tech freshers to teach M.Tech postgraduate courses without required PhD or NET qualification. Inspection committee was shown hired visiting faculty.",
        "Faculty salaries have not been disbursed for the last 5 months, forcing core faculty to resign while college continues displaying their names on mandatory disclosure.",
        "Biometric logs submitted to AICTE for NBA accreditation show faculty presence on days when institute was closed for vacations."
    ],
    "harassment/ragging": [
        "Hostel seniors subjected first-year students to severe mental harassment and physical abuse in Block B dormitory. Anti-ragging cell refused to register written complaint.",
        "Senior batch students forced juniors to perform humiliating physical chores after 11 PM. Warden threatened victims with suspension if reported to national helpline.",
        "Hostel premises lack basic security guards, and complaints of bullying and caste-based discrimination are dismissed by the Chief Proctor.",
        "A first-year engineering student was mentally traumatized during hostel initiation; college authorities concealed the incident from local police."
    ],
    "infrastructure": [
        "Computer lab has 60 workstations but only 8 are functional with internet connectivity. Microprocessor lab equipment has been non-operational for 2 semesters.",
        "Chemistry and material testing laboratories lack mandatory fire extinguishers and proper ventilation. Toxic fumes present direct hazard to students.",
        "Library does not subscribe to mandated IEEE journals or prescribed textbooks. E-library terminals are broken and locked.",
        "Girls hostel lacks safe drinking water filtration and hygienic sanitation facilities. Multiple representations to Principal went unaddressed."
    ],
    "admission irregularity": [
        "Institute sold 14 vacant seats in Computer Science quota for Rs 6 Lakhs cash donation bypassing official state entrance counselling merit rank.",
        "Management quota seats were allocated to non-eligible candidates whose entrance scores were below the minimum cutoff prescribed by AICTE.",
        "Candidates on state merit waitlist were turned away claiming zero vacancy while backdoor admissions were offered to relatives of trustees.",
        "College collected full tuition fee from reserved category candidates despite government post-matric scholarship entitlement."
    ],
    "approval-related": [
        "College started an unapproved B.Tech in Artificial Intelligence without obtaining Extension of Approval (EoA) from AICTE for the academic year.",
        "Sanctioned intake is 120 seats for Mechanical Engineering, but college admitted 185 students in violation of approved intake capacity.",
        "Provisional affiliation expired in 2024, yet college issued admission advertisement claiming permanent recognition.",
        "Campus address submitted to AICTE does not match physical location where classes are currently conducted in a commercial rented complex."
    ],
    "affiliation": [
        "University cancelled affiliation for 3 engineering departments due to faculty shortage, but college admitted new batch hiding this status.",
        "Curriculum taught is outdated and not aligned with affiliating university scheme; students not permitted to appear in semester exams.",
        "Dispute between trust and affiliating state university has put degrees of 450 passing-out students at risk."
    ],
    "examination": [
        "End-semester question paper for Applied Mathematics was leaked 3 hours prior to exam via private messaging groups.",
        "Evaluation results delayed by over 7 months, causing final year students to lose multinational campus employment offers.",
        "Mass copying was facilitated in examination hall Room 204 with active connivance of external invigilators.",
        "College withheld degree certificates of 80 students demanding an additional Rs 10,000 for convocation gown and alumni fund."
    ]
}

# Multilingual seeds for authentic demonstration
MULTILINGUAL_SEEDS = [
    {
        "lang": "hi",
        "text": "कॉलेज प्रशासन 25,000 रुपये की फीस वापस करने से मना कर रहा है। नो-ड्यूज प्रमाण पत्र देने के बाद भी एकाउंट्स विभाग कोई रिफंड नहीं दे रहा है और धमकी दे रहा है कि मूल दस्तावेज नहीं मिलेंगे।",
        "cat": "fee fraud",
        "inst_id": "AICTE-1-1002931"
    },
    {
        "lang": "hi",
        "text": "इंदौर परिसर में कंप्यूटर लैब में 50 में से 40 कंप्यूटर खराब पड़े हैं। छात्रों से 15,000 रुपये लैब फीस ली गई लेकिन प्रैक्टिकल क्लास कभी नहीं कराई जाती।",
        "cat": "infrastructure",
        "inst_id": "AICTE-1-1002931"
    },
    {
        "lang": "mr",
        "text": "महाविद्यालयाने प्रवेश रद्द केल्यानंतरही आमची अनामत रक्कम आणि शुल्क परतावा दिलेला नाही. विद्यार्थ्यांचे शैक्षणिक नुकसान होत आहे.",
        "cat": "fee fraud",
        "inst_id": "AICTE-1-1002933"
    },
    {
        "lang": "bn",
        "text": "কলেজ কর্তৃপক্ষ নো-ডিউজ জমা দেওয়ার পরেও সিকিউরিটি ডিপোজিট ও ফি ফেরত দিতে অস্বীকার করছে।",
        "cat": "fee fraud",
        "inst_id": "AICTE-1-1002932"
    },
    {
        "lang": "ta",
        "text": "கல்லூரி நிர்வாகம் கட்டணத்தை திருப்பித் தர மறுக்கிறது. ஆய்வக வசதிகள் மிகவும் மோசமாக உள்ளன.",
        "cat": "fee fraud",
        "inst_id": "AICTE-1-1002931"
    },
    {
        "lang": "te",
        "text": "కళాశాల పరిపాలన ఫీజు వాపసు ఇవ్వడానికి నిరాకరిస్తోంది. హాస్టల్ సౌకర్యాలు లేవు.",
        "cat": "fee fraud",
        "inst_id": "AICTE-1-1002931"
    }
]

def seed_database(reset: bool = False):
    print("Beginning AICTE Complaint Intelligence Hub database seeding...")
    if reset:
        print("Reset flag detected: dropping and recreating all database tables...")
        Base.metadata.drop_all(bind=engine)
    
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # 1. Seed Demo Users
    users_data = [
        {
            "name": "Aarav Sharma",
            "phone": "9876543210",
            "email": "student.aarav@example.com",
            "role": "student",
            "level": "Student Complainant",
            "bureau": None,
            "state": "Madhya Pradesh",
            "password": "mockotp_123456"
        },
        {
            "name": "Vikram Malhotra",
            "email": "officer.finance@aicte.gov.in",
            "phone": "9811122233",
            "role": "official",
            "level": "Case Officer",
            "bureau": "Finance",
            "state": None,
            "password": "DemoPass@123"
        },
        {
            "name": "Dr. Sunita Deshmukh",
            "email": "head.finance@aicte.gov.in",
            "phone": "9822233344",
            "role": "official",
            "level": "Bureau Head",
            "bureau": "Finance",
            "state": None,
            "password": "DemoPass@123"
        },
        {
            "name": "Rajeshwar Verma",
            "email": "ro.mp@aicte.gov.in",
            "phone": "9833344455",
            "role": "official",
            "level": "Regional Officer",
            "bureau": None,
            "state": "Madhya Pradesh",
            "password": "DemoPass@123"
        },
        {
            "name": "Prof. Anil Sahasrabudhe (Chairman's Office)",
            "email": "admin@aicte.gov.in",
            "phone": "9844455566",
            "role": "admin",
            "level": "Leadership",
            "bureau": None,
            "state": None,
            "password": "DemoPass@123"
        }
    ]

    seeded_users = []
    for u in users_data:
        existing = db.query(User).filter((User.email == u["email"]) | (User.phone == u["phone"])).first()
        if not existing:
            user = User(
                name=u["name"],
                email=u["email"],
                phone=u["phone"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                level=u["level"],
                bureau=u["bureau"],
                state=u["state"],
                is_active=True
            )
            db.add(user)
            db.flush()
            seeded_users.append(user)
        else:
            seeded_users.append(existing)

    case_officer_finance = next((u for u in seeded_users if u.level == "Case Officer" and u.bureau == "Finance"), seeded_users[1])

    # 2. Seed 60 Institutions
    print("Generating 60 institutions with deliberate intelligence patterns...")
    institutions_dict = {}

    # Deliberate Key Institutions:
    # 1. Repeat Fee Offender
    inst_1 = Institution(
        id="AICTE-1-1002931",
        name="Apex Institute of Technology & Management",
        aliases_json=json.dumps(["Apex Tech Indore", "Apex College of Engineering", "Apex Indore", "AITM Indore"]),
        state="Madhya Pradesh",
        district="Indore",
        programs_json=json.dumps(["Computer Science", "Information Technology", "MBA", "Mechanical Engineering"]),
        approval_status="Approved",
        renewal_date="2026-06-30",
        court_stay_flag=False,
        penalties_json=json.dumps([{"date": "2024-11-10", "type": "Monetary Fine", "amount": 250000, "reason": "Caution money withholding violation"}]),
        risk_score=88.5,
        risk_factors_json=json.dumps({
            "severity_score": 35.0,
            "repeat_frequency": 28.5,
            "sla_ageing": 15.0,
            "penalties": 10.0,
            "summary": "Severe repeat offender: 18+ complaints on caution money withholding, 2 SLA breaches."
        })
    )
    db.add(inst_1)
    institutions_dict[inst_1.id] = inst_1

    # 2. Cluster Institution 2 (MP)
    inst_2 = Institution(
        id="AICTE-1-1002932",
        name="Bhopal Engineering Academy",
        aliases_json=json.dumps(["BEA Bhopal", "Bhopal Engg College", "BEA Institute"]),
        state="Madhya Pradesh",
        district="Bhopal",
        programs_json=json.dumps(["Civil Engineering", "Electrical Engineering", "MCA"]),
        approval_status="Approved",
        renewal_date="2026-05-31",
        court_stay_flag=False,
        penalties_json=json.dumps([]),
        risk_score=68.0,
        risk_factors_json=json.dumps({
            "severity_score": 25.0,
            "repeat_frequency": 20.0,
            "sla_ageing": 13.0,
            "penalties": 0.0,
            "summary": "High refund refusal rate following counselling round cancellations."
        })
    )
    db.add(inst_2)
    institutions_dict[inst_2.id] = inst_2

    # 3. Cluster Institution 3 (Maharashtra)
    inst_3 = Institution(
        id="AICTE-1-1002933",
        name="Vidarbha Institute of Science & Technology",
        aliases_json=json.dumps(["VIST Nagpur", "Vidarbha Tech", "VIST College"]),
        state="Maharashtra",
        district="Nagpur",
        programs_json=json.dumps(["Electronics & Telecomm", "Computer Science", "MBA"]),
        approval_status="Approved",
        renewal_date="2026-07-15",
        court_stay_flag=False,
        penalties_json=json.dumps([]),
        risk_score=64.0,
        risk_factors_json=json.dumps({
            "severity_score": 22.0,
            "repeat_frequency": 22.0,
            "sla_ageing": 10.0,
            "penalties": 0.0,
            "summary": "Shared systemic refund delay process pattern with central India colleges."
        })
    )
    db.add(inst_3)
    institutions_dict[inst_3.id] = inst_3

    # 4. Serious Open Complaints with Renewal Pending
    inst_4 = Institution(
        id="AICTE-1-1004520",
        name="National College of Engineering & Research",
        aliases_json=json.dumps(["NCER Pune", "National Engg Pune", "National College Pune"]),
        state="Maharashtra",
        district="Pune",
        programs_json=json.dumps(["Mechanical", "Automobile", "Robotics", "Computer Science"]),
        approval_status="Extension Pending",
        renewal_date="2025-12-15",
        court_stay_flag=False,
        penalties_json=json.dumps([{"date": "2024-08-14", "type": "Warning Letter", "reason": "Non-compliance with Anti-Ragging regulations"}]),
        risk_score=92.0,
        risk_factors_json=json.dumps({
            "severity_score": 40.0,
            "repeat_frequency": 24.0,
            "sla_ageing": 18.0,
            "penalties": 10.0,
            "summary": "CRITICAL RISK: Annual EoA renewal in process while 3 serious ragging and ghost faculty cases are active."
        })
    )
    db.add(inst_4)
    institutions_dict[inst_4.id] = inst_4

    # 5. Court Stay Order Active
    inst_5 = Institution(
        id="AICTE-1-1005611",
        name="Vanguard Institute of Advanced Technology",
        aliases_json=json.dumps(["Vanguard Tech Bengaluru", "VIAT Bangalore", "Vanguard Engg"]),
        state="Karnataka",
        district="Bengaluru",
        programs_json=json.dumps(["AI & Data Science", "Cloud Computing", "Biotechnology"]),
        approval_status="Provisional",
        renewal_date="2026-08-31",
        court_stay_flag=True,
        court_stay_details="High Court of Karnataka Interim Stay Order No. WP-38291/2024 restraining AICTE from enforcing monetary penalty and intake reduction pending final hearing.",
        penalties_json=json.dumps([{"date": "2024-09-01", "type": "Stayed Penalty", "amount": 500000, "status": "Stayed by Court"}]),
        risk_score=75.0,
        risk_factors_json=json.dumps({
            "severity_score": 30.0,
            "repeat_frequency": 15.0,
            "sla_ageing": 20.0,
            "penalties": 10.0,
            "summary": "Sub-judice status: Active high court stay halts regulatory penalty collection."
        })
    )
    db.add(inst_5)
    institutions_dict[inst_5.id] = inst_5

    # 6. Conflicting Bureau Actions
    inst_6 = Institution(
        id="AICTE-1-1008899",
        name="Imperial Polytechnic & Engineering Campus",
        aliases_json=json.dumps(["Imperial College Lucknow", "IPEC Lucknow", "Imperial Poly"]),
        state="Uttar Pradesh",
        district="Lucknow",
        programs_json=json.dumps(["Civil Engineering", "Electrical Engineering", "Polytechnic"]),
        approval_status="Under Review",
        renewal_date="2026-04-30",
        court_stay_flag=False,
        penalties_json=json.dumps([{"date": "2025-01-20", "type": "Show Cause Notice", "reason": "Inspection Cell deficiency finding"}]),
        risk_score=84.0,
        risk_factors_json=json.dumps({
            "severity_score": 32.0,
            "repeat_frequency": 22.0,
            "sla_ageing": 20.0,
            "penalties": 10.0,
            "summary": "CROSS-BUREAU CONFLICT: Approval Bureau granted provisional extension while Inspection Cell ordered closure notice."
        })
    )
    db.add(inst_6)
    institutions_dict[inst_6.id] = inst_6

    # 54 additional realistic institutions
    names_pool = [
        "Saraswati Institute of Technology", "Kaveri Engineering College", "Himalayan Institute of Higher Tech",
        "Deccan Institute of Advanced Studies", "Malwa Institute of Science & Technology", "Konkan Technical Campus",
        "Chanakya Institute of Management", "Aryabhatta College of Engineering", "Tagore Institute of Technology",
        "Ramanujan Science & Tech Institute", "Ashoka College of Engineering", "Shivaji Institute of Technology",
        "Maurya Engineering Academy", "Ganga Institute of Technology & Mgmt", "Godavari Institute of Engineering",
        "Kalinga Institute of Polytechnic", "Nalanda Institute of Technology", "Bhartiya Engineering College",
        "Pragati Institute of Technology", "Vidyasagar Technical Institute", "Vivekananda College of Engineering",
        "Mahatma Gandhi Institute of Tech", "Sardar Patel College of Engineering", "Netaji Subhash Institute of Tech",
        "Indus Valley Institute of Tech", "Satpura Institute of Engineering", "Vindhya Technical Academy",
        "Brahmaputra Engineering College", "Coromandel Institute of Tech", "Thar Institute of Engineering",
        "Bundelkhand Technical Campus", "Rohilkhand College of Engineering", "Doab Institute of Science",
        "Aravalli Institute of Technology", "Nilgiri College of Engineering", "Sahyadri Science & Tech Campus",
        "Surat Institute of Technology", "Rajkot Engineering Academy", "Gwalior Institute of Tech & Science",
        "Ujjain Engineering College", "Jabalpur Technical Institute", "Mysore College of Engineering",
        "Mangalore Institute of Technology", "Hubli Technical Academy", "Warangal Institute of Science",
        "Nizamabad College of Engineering", "Coimbatore Institute of Tech & Mgmt", "Madurai Engineering Academy",
        "Trichy Technical Institute", "Varanasi Institute of Higher Tech", "Kanpur College of Engineering",
        "Durgapur Institute of Technology", "Siliguri College of Engineering", "Asansol Engineering Campus"
    ]

    for i, name in enumerate(names_pool, start=7):
        st = STATES[i % len(STATES)]
        city = CITIES_BY_STATE.get(st, ["City Center"])[i % len(CITIES_BY_STATE.get(st, ["City Center"]))]
        inst_id = f"AICTE-1-{1000000 + i * 117}"
        aliases = [f"{name.split()[0]} {city}", f"{name.split()[0]} College", f"{''.join([w[0] for w in name.split()[:4]])} {city}"]
        inst = Institution(
            id=inst_id,
            name=name,
            aliases_json=json.dumps(aliases),
            state=st,
            district=city,
            programs_json=json.dumps(PROGRAMS_POOL[i % len(PROGRAMS_POOL)]),
            approval_status=random.choice(["Approved", "Approved", "Approved", "Provisional", "Extension Pending"]),
            renewal_date=(datetime(2025, 1, 1) + timedelta(days=random.randint(60, 450))).strftime("%Y-%m-%d"),
            court_stay_flag=False,
            penalties_json=json.dumps([]),
            risk_score=round(random.uniform(15.0, 72.0), 1),
            risk_factors_json=json.dumps({
                "severity_score": round(random.uniform(5.0, 30.0), 1),
                "repeat_frequency": round(random.uniform(5.0, 25.0), 1),
                "sla_ageing": round(random.uniform(2.0, 15.0), 1),
                "penalties": 0.0,
                "summary": "Regular compliance monitoring profile."
            })
        )
        db.add(inst)
        institutions_dict[inst.id] = inst

    db.flush()
    print(f"Seeded {len(institutions_dict)} institutions.")

    # 3. Seed Case Groups
    print("Seeding Case Groups...")
    grp_fee_refund = CaseGroup(
        id="GRP-2025-REFUND-01",
        title="Inter-State Caution Money & Fee Refund Non-Compliance",
        theme="Systemic refusal of mandatory caution money and post-counselling fee refund under Regulation 14(b)",
        category="fee fraud",
        institution_ids_json=json.dumps([inst_1.id, inst_2.id, inst_3.id]),
        complaint_count=26,
        created_at=datetime.utcnow() - timedelta(days=180)
    )
    db.add(grp_fee_refund)

    grp_fake_faculty = CaseGroup(
        id="GRP-2025-FACULTY-02",
        title="Ghost Faculty & Biometric Spoofing Scheme",
        theme="Hired temporary faculty shown on portal during AICTE inspection with falsified Aadhaar logs",
        category="fake faculty",
        institution_ids_json=json.dumps([inst_4.id, inst_6.id]),
        complaint_count=9,
        created_at=datetime.utcnow() - timedelta(days=120)
    )
    db.add(grp_fake_faculty)
    db.flush()

    # 4. Seed 400 Complaints across 12 months with rich deliberate patterns
    print("Generating 400 complaints across 12 months with deliberate patterns...")
    now = datetime.utcnow()
    all_inst_keys = list(institutions_dict.keys())
    
    complaints_created = []

    # A. Seed Repeat Fee Pattern on inst_1 (Apex Institute) - 20 complaints
    for j in range(20):
        c_date = now - timedelta(days=random.randint(10, 350))
        due_date = c_date + timedelta(days=30)
        overdue_days = max(0, (now - due_date).days)
        is_breached = overdue_days > 0 and j < 8

        text = random.choice(SAMPLE_COMPLAINT_TEMPLATES["fee fraud"])
        summary = ai_service.generate_ai_summary(text, inst_1.name, "fee fraud", c_date.strftime("%d %b %Y"))

        cmp_obj = Complaint(
            id=f"CMP-2025-{1000 + len(complaints_created)}",
            institution_id=inst_1.id,
            complainant_name=f"Student {j+1}" if j % 3 != 0 else "Anonymous",
            complainant_phone=f"98765{43200 + j}",
            complainant_email=f"complainant_{j+1}@gmail.com",
            is_anonymous=(j % 3 == 0),
            channel=CHANNELS[j % len(CHANNELS)],
            original_text=text,
            original_language="en",
            english_translation=text,
            category="fee fraud",
            bureau="Finance",
            process_stage="fee refund",
            priority="High" if j % 4 == 0 else "Medium",
            severity="High",
            status="resolved" if (j > 14 and not is_breached) else ("open" if is_breached else "under review"),
            assigned_officer_id=case_officer_finance.id,
            created_date=c_date,
            due_date=due_date,
            sla_state="Breached" if is_breached else ("Approaching Breach" if overdue_days > -5 and overdue_days <= 0 else "Within SLA"),
            sla_days_overdue=overdue_days if is_breached else 0,
            escalation_level="Bureau Head" if is_breached else "None",
            escalation_history_json=json.dumps([{"date": (c_date + timedelta(days=31)).strftime("%Y-%m-%d"), "to": "Bureau Head", "reason": "SLA period exceeded 30 days"}] if is_breached else []),
            attachments_json=json.dumps([{"file_name": "fee_receipt_2025.pdf", "file_url": "/mock_receipt.jpg", "file_type": "image/jpeg", "ocr_text": "AMOUNT PAID RS 25,000 CAUTION MONEY REFUNDABLE RECEIPT NO 9841"}]),
            ai_summary_json=json.dumps(summary),
            case_group_id=grp_fee_refund.id,
            ai_triage_trace_json=json.dumps({
                "detected_language": "en",
                "language_confidence": 0.99,
                "matched_institution_id": inst_1.id,
                "institution_confidence": 0.96,
                "classified_category": "fee fraud",
                "category_confidence": 0.94,
                "routed_bureau": "Finance",
                "duplicate_similarity": 0.82,
                "case_group_assigned": grp_fee_refund.id
            })
        )
        db.add(cmp_obj)
        complaints_created.append(cmp_obj)

    # B. Seed Multilingual complaints
    for m in MULTILINGUAL_SEEDS:
        c_date = now - timedelta(days=random.randint(2, 60))
        due_date = c_date + timedelta(days=30)
        target_inst = institutions_dict.get(m["inst_id"], inst_1)
        eng_trans = ai_service.translate(m["text"], m["lang"])
        summary = ai_service.generate_ai_summary(eng_trans, target_inst.name, m["cat"], c_date.strftime("%d %b %Y"))

        cmp_obj = Complaint(
            id=f"CMP-2025-{1000 + len(complaints_created)}",
            institution_id=target_inst.id,
            complainant_name="Aarav Sharma" if m["lang"] == "hi" else "Multilingual Complainant",
            complainant_phone="9876543210",
            complainant_email="aarav.student@gov.in",
            is_anonymous=False,
            channel="Web Portal",
            original_text=m["text"],
            original_language=m["lang"],
            english_translation=eng_trans,
            category=m["cat"],
            bureau=ai_service.route_bureau(m["cat"])[0],
            process_stage="fee refund",
            priority="High",
            severity="High",
            status="open",
            assigned_officer_id=case_officer_finance.id,
            created_date=c_date,
            due_date=due_date,
            sla_state="Within SLA",
            sla_days_overdue=0,
            escalation_level="None",
            escalation_history_json=json.dumps([]),
            attachments_json=json.dumps([{"file_name": "receipt_photo.jpg", "file_url": "/mock_receipt.jpg", "file_type": "image/jpeg", "ocr_text": "INSTITUTE OF TECH & MGMT RECEIPT CAUTION MONEY RS 25,000 REFUNDABLE"}]),
            ai_summary_json=json.dumps(summary),
            case_group_id=grp_fee_refund.id,
            ai_triage_trace_json=json.dumps({
                "detected_language": m["lang"],
                "language_confidence": 0.94,
                "matched_institution_id": target_inst.id,
                "institution_confidence": 0.95,
                "classified_category": m["cat"],
                "category_confidence": 0.92,
                "routed_bureau": "Finance",
                "duplicate_similarity": 0.79,
                "case_group_assigned": grp_fee_refund.id
            })
        )
        db.add(cmp_obj)
        complaints_created.append(cmp_obj)

    # C. Seed Inter-state Fee-Refund cluster complaints on Inst 2 and Inst 3
    for inst_target in [inst_2, inst_3]:
        for k in range(5):
            c_date = now - timedelta(days=random.randint(20, 200))
            due_date = c_date + timedelta(days=30)
            text = random.choice(SAMPLE_COMPLAINT_TEMPLATES["fee fraud"])
            summary = ai_service.generate_ai_summary(text, inst_target.name, "fee fraud", c_date.strftime("%d %b %Y"))

            cmp_obj = Complaint(
                id=f"CMP-2025-{1000 + len(complaints_created)}",
                institution_id=inst_target.id,
                complainant_name=f"Applicant {k+1}",
                complainant_phone=f"98711{33400 + k}",
                complainant_email=f"applicant_{k+1}@rediffmail.com",
                is_anonymous=False,
                channel=random.choice(CHANNELS),
                original_text=text,
                original_language="en",
                english_translation=text,
                category="fee fraud",
                bureau="Finance",
                process_stage="fee refund",
                priority="Medium",
                severity="High",
                status="under review",
                assigned_officer_id=case_officer_finance.id,
                created_date=c_date,
                due_date=due_date,
                sla_state="Within SLA",
                sla_days_overdue=0,
                escalation_level="None",
                escalation_history_json=json.dumps([]),
                attachments_json=json.dumps([]),
                ai_summary_json=json.dumps(summary),
                case_group_id=grp_fee_refund.id,
                ai_triage_trace_json=json.dumps({
                    "detected_language": "en",
                    "language_confidence": 0.99,
                    "matched_institution_id": inst_target.id,
                    "institution_confidence": 0.93,
                    "classified_category": "fee fraud",
                    "category_confidence": 0.91,
                    "routed_bureau": "Finance",
                    "duplicate_similarity": 0.76,
                    "case_group_assigned": grp_fee_refund.id
                })
            )
            db.add(cmp_obj)
            complaints_created.append(cmp_obj)

    # D. Seed Serious complaints on Inst 4 (National College - Renewal Pending + Harassment/Faculty)
    for k, cat in enumerate(["harassment/ragging", "harassment/ragging", "fake faculty", "infrastructure"]):
        c_date = now - timedelta(days=random.randint(15, 90))
        due_date = c_date + timedelta(days=15 if cat == "harassment/ragging" else 30)
        text = random.choice(SAMPLE_COMPLAINT_TEMPLATES[cat])
        bureau = "Student Welfare Cell" if cat == "harassment/ragging" else ("Academic" if cat == "fake faculty" else "Inspection Cell")
        summary = ai_service.generate_ai_summary(text, inst_4.name, cat, c_date.strftime("%d %b %Y"))

        cmp_obj = Complaint(
            id=f"CMP-2025-{1000 + len(complaints_created)}",
            institution_id=inst_4.id,
            complainant_name="Confidential Complainant",
            complainant_phone="9870099887",
            complainant_email="confidential@ncer.edu",
            is_anonymous=True,
            channel="Web Portal",
            original_text=text,
            original_language="en",
            english_translation=text,
            category=cat,
            bureau=bureau,
            process_stage="anti-ragging enquiry" if cat == "harassment/ragging" else "faculty verification",
            priority="Critical" if cat == "harassment/ragging" else "High",
            severity="High",
            status="open",
            assigned_officer_id=None,
            created_date=c_date,
            due_date=due_date,
            sla_state="Approaching Breach",
            sla_days_overdue=0,
            escalation_level="None",
            escalation_history_json=json.dumps([]),
            attachments_json=json.dumps([{"file_name": "enquiry_representation.pdf", "file_url": "/mock_doc.pdf", "file_type": "application/pdf"}]),
            ai_summary_json=json.dumps(summary),
            case_group_id=grp_fake_faculty.id if cat == "fake faculty" else None,
            ai_triage_trace_json=json.dumps({
                "detected_language": "en",
                "language_confidence": 0.98,
                "matched_institution_id": inst_4.id,
                "institution_confidence": 0.97,
                "classified_category": cat,
                "category_confidence": 0.95,
                "routed_bureau": bureau
            })
        )
        db.add(cmp_obj)
        complaints_created.append(cmp_obj)

    # E. Seed Growing Backlog in Inspection Cell month by month
    # We will distribute across the 12 months with increasing overdue count
    target_total = 400
    remaining_count = target_total - len(complaints_created)

    for idx in range(remaining_count):
        # Determine month offset (0 = current month, 11 = 11 months ago)
        month_offset = idx % 12
        # Month days ago
        days_ago = (month_offset * 30) + random.randint(1, 28)
        c_date = now - timedelta(days=days_ago)

        # Force Inspection Cell to have growing backlog in recent months
        if idx % 5 == 0:
            cat = "infrastructure"
            bureau = "Inspection Cell"
            stage = "inspection"
            # Deliberate pattern: more recent months have higher overdue count
            is_overdue = (random.random() < (0.25 + (0.5 * (12 - month_offset) / 12.0)))
        else:
            cat = CATEGORIES[idx % len(CATEGORIES)]
            bureau = ai_service.route_bureau(cat)[0]
            stage = PROCESS_STAGES[idx % len(PROCESS_STAGES)]
            is_overdue = (random.random() < 0.18)

        priority = "Critical" if cat == "harassment/ragging" else ("High" if cat in ["fee fraud", "fake faculty"] else ("Medium" if idx % 2 == 0 else "Low"))
        severity = "High" if priority in ["Critical", "High"] else "Medium"
        due_days = SLA_POLICY.get(priority, 30)
        due_date = c_date + timedelta(days=due_days)

        overdue_days = max(0, (now - due_date).days) if is_overdue else 0
        sla_state = "Breached" if overdue_days > 0 else ("Approaching Breach" if (due_date - now).days <= 3 else "Within SLA")

        inst_key = all_inst_keys[idx % len(all_inst_keys)]
        inst_target = institutions_dict[inst_key]

        text_pool = SAMPLE_COMPLAINT_TEMPLATES.get(cat, SAMPLE_COMPLAINT_TEMPLATES["fee fraud"])
        text = text_pool[idx % len(text_pool)]

        summary = ai_service.generate_ai_summary(text, inst_target.name, cat, c_date.strftime("%d %b %Y"))

        status = "resolved" if (days_ago > 90 and not is_overdue and idx % 2 == 0) else ("open" if is_overdue else "under review")

        cmp_obj = Complaint(
            id=f"CMP-2025-{1000 + len(complaints_created)}",
            institution_id=inst_target.id,
            complainant_name=f"Complainant {len(complaints_created)+1}" if idx % 4 != 0 else "Anonymous Complainant",
            complainant_phone=f"98100{10000 + (idx % 90000)}",
            complainant_email=f"user_{len(complaints_created)+1}@mail.gov.in",
            is_anonymous=(idx % 4 == 0),
            channel=CHANNELS[idx % len(CHANNELS)],
            original_text=text,
            original_language="en",
            english_translation=text,
            category=cat,
            bureau=bureau,
            process_stage=stage,
            priority=priority,
            severity=severity,
            status=status,
            assigned_officer_id=case_officer_finance.id if bureau == "Finance" else None,
            created_date=c_date,
            due_date=due_date,
            sla_state=sla_state,
            sla_days_overdue=overdue_days,
            escalation_level="Bureau Head" if (sla_state == "Breached" and overdue_days > 7) else "None",
            escalation_history_json=json.dumps([{"date": (c_date + timedelta(days=due_days+1)).strftime("%Y-%m-%d"), "to": "Bureau Head", "reason": "SLA breach threshold breached"}] if sla_state == "Breached" else []),
            attachments_json=json.dumps([{"file_name": "supporting_evidence.pdf", "file_url": "/mock_doc.pdf", "file_type": "application/pdf"}] if idx % 3 == 0 else []),
            ai_summary_json=json.dumps(summary),
            case_group_id=None,
            ai_triage_trace_json=json.dumps({
                "detected_language": "en",
                "language_confidence": 0.99,
                "matched_institution_id": inst_target.id,
                "institution_confidence": 0.94,
                "classified_category": cat,
                "category_confidence": 0.91,
                "routed_bureau": bureau
            })
        )
        db.add(cmp_obj)
        complaints_created.append(cmp_obj)

    db.flush()
    print(f"Total seeded complaints: {len(complaints_created)}")

    # 5. Seed Cross-Bureau Conflict Alerts
    print("Seeding Conflict Alerts from Rule Engine...")
    conflicts_to_seed = [
        # Conflict 1: Renewal pending with serious unresolved complaints on Inst 4
        ConflictAlert(
            institution_id=inst_4.id,
            conflict_type="renewal_with_open_fraud",
            severity="Critical",
            title="Approval Renewal In Process with Open Serious Harassment & Faculty Cases",
            description="Bureau of Approval is processing Extension of Approval (EoA) renewal for academic year 2025-26 while 3 serious harassment and fake faculty complaints remain unresolved in Student Welfare Cell and Inspection Cell.",
            bureaus_involved_json=json.dumps(["Approval", "Student Welfare Cell", "Inspection Cell"]),
            related_complaint_ids_json=json.dumps([c.id for c in complaints_created if c.institution_id == inst_4.id][:4]),
            status="active"
        ),
        # Conflict 2: Opposing bureau directions on Inst 6
        ConflictAlert(
            institution_id=inst_6.id,
            conflict_type="opposing_bureau_directions",
            severity="High",
            title="Contradictory Bureau Orders: Provisional Extension vs Cancellation Notice",
            description="Bureau of Approval issued letter granting provisional approval for intake of 120 seats on 15 Jan 2025, while Inspection Cell issued show-cause notice for immediate closure due to critical lab deficiency on 20 Jan 2025.",
            bureaus_involved_json=json.dumps(["Approval", "Inspection Cell"]),
            related_complaint_ids_json=json.dumps([c.id for c in complaints_created if c.institution_id == inst_6.id][:2]),
            status="active"
        ),
        # Conflict 3: Active court stay order on Inst 5
        ConflictAlert(
            institution_id=inst_5.id,
            conflict_type="court_stay_active",
            severity="Medium",
            title="Court Stay Active: Regulatory Penalty Enforcement Blocked",
            description="Finance Bureau has initiated recovery proceedings for Rs 5,00,000 penalty, but High Court of Karnataka interim stay order WP-38291/2024 legally prohibits coercive action.",
            bureaus_involved_json=json.dumps(["Finance", "Legal Cell"]),
            related_complaint_ids_json=json.dumps([c.id for c in complaints_created if c.institution_id == inst_5.id][:2]),
            status="active"
        ),
        # Conflict 4: Multi-bureau complaint spike (60 days) on Inst 1
        ConflictAlert(
            institution_id=inst_1.id,
            conflict_type="multi_bureau_spike_60d",
            severity="High",
            title="Cross-Bureau Complaint Surge: 4 Bureaus Flagged within 60 Days",
            description="Institution flagged simultaneously by Finance (18 fee complaints), Inspection Cell (lab deficiencies), Approval (unapproved intake), and Academic (syllabus issues) within 60 days.",
            bureaus_involved_json=json.dumps(["Finance", "Inspection Cell", "Approval", "Academic"]),
            related_complaint_ids_json=json.dumps([c.id for c in complaints_created if c.institution_id == inst_1.id][:6]),
            status="active"
        )
    ]
    for ca in conflicts_to_seed:
        db.add(ca)

    # 6. Seed Actions & Referrals
    print("Seeding Official Actions and Inter-Bureau Referrals...")
    action_1 = Action(
        complaint_id=complaints_created[0].id,
        institution_id=inst_1.id,
        action_type="show-cause",
        title="Show-Cause Notice Issued under AICTE Regulation 14(b)",
        description="Formal show-cause notice served to Registrar directing immediate deposit and accounting of caution money refund within 14 calendar days.",
        created_by_user_id=case_officer_finance.id,
        created_at=datetime.utcnow() - timedelta(days=12)
    )
    db.add(action_1)

    referral_1 = Referral(
        complaint_id=complaints_created[0].id,
        from_bureau="Finance",
        to_bureau="Approval",
        request_note="Requesting Approval Bureau to put holding flag on annual EoA renewal until pending fee refund demands are satisfied by Apex Institute.",
        status="responded",
        response_note="Holding tag placed on portal. Renewal will require no-objection certificate (NOC) from Finance Bureau.",
        requested_at=datetime.utcnow() - timedelta(days=10),
        responded_at=datetime.utcnow() - timedelta(days=7)
    )
    db.add(referral_1)

    # 7. Seed Tamper-Evident Hash-Chained Audit Log
    print("Generating SHA-256 tamper-evident hash-chained audit log...")
    audit_events = [
        {"action": "SYSTEM_INIT", "user": "System", "entity_type": "System", "entity_id": "CIH-001", "details": {"version": "2.0.0", "status": "Initialized"}},
        {"action": "LOGIN", "user": "admin@aicte.gov.in", "entity_type": "User", "entity_id": "5", "details": {"ip": "10.0.0.1", "role": "admin"}},
        {"action": "FILE_COMPLAINT", "user": "Aarav Sharma", "entity_type": "Complaint", "entity_id": complaints_created[0].id, "details": {"category": "fee fraud", "channel": "Web Portal"}},
        {"action": "AI_TRIAGE_AUTO", "user": "AIService", "entity_type": "Complaint", "entity_id": complaints_created[0].id, "details": {"bureau": "Finance", "confidence": 0.96}},
        {"action": "ISSUE_NOTICE", "user": "Vikram Malhotra", "entity_type": "Complaint", "entity_id": complaints_created[0].id, "details": {"notice_type": "Show-Cause", "regulation": "14(b)"}},
        {"action": "CREATE_REFERRAL", "user": "Vikram Malhotra", "entity_type": "Referral", "entity_id": "REF-001", "details": {"from": "Finance", "to": "Approval"}},
        {"action": "TRIGGER_CONFLICT_ALERT", "user": "RuleEngine", "entity_type": "Institution", "entity_id": inst_4.id, "details": {"conflict_type": "renewal_with_open_fraud"}},
        {"action": "EXPORT_REPORT", "user": "Vikram Malhotra", "entity_type": "Report", "entity_id": "REP-PDF-MP-FEE", "details": {"format": "PDF", "filter": "overdue fee Madhya Pradesh"}}
    ]

    prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    for ev in audit_events:
        ts = datetime.utcnow() - timedelta(days=random.randint(1, 20))
        details_str = json.dumps(ev["details"], sort_keys=True)
        raw_string = f"{prev_hash}|{ts.isoformat()}|{ev['user']}|{ev['action']}|{ev['entity_type']}|{ev['entity_id']}|{details_str}"
        curr_hash = hashlib.sha256(raw_string.encode('utf-8')).hexdigest()

        alog = AuditLog(
            prev_hash=prev_hash,
            current_hash=curr_hash,
            user_name=ev["user"],
            action=ev["action"],
            entity_type=ev["entity_type"],
            entity_id=ev["entity_id"],
            details_json=details_str,
            ip_address="127.0.0.1",
            timestamp=ts
        )
        db.add(alog)
        prev_hash = curr_hash

    # 8. Seed Sample Notifications
    print("Seeding role notifications...")
    notifs = [
        Notification(
            user_id=seeded_users[1].id,  # Case officer Finance
            role="official",
            title="SLA Breach Alert: Complaint CMP-2025-1002",
            message="Complaint at Apex Institute regarding caution money withholding is 8 days overdue and escalated.",
            type="sla_breach",
            channel_log_json=json.dumps({"in_app": True, "sms": "Sent to +919811122233", "email": "Sent to officer.finance@aicte.gov.in", "whatsapp": "Delivered"}),
            read=False
        ),
        Notification(
            user_id=seeded_users[2].id,  # Head Finance
            role="official",
            title="Bureau Escalation: Multiple Fee Breaches",
            message="8 fee fraud cases across Madhya Pradesh have breached standard 30-day SLA.",
            type="escalation",
            channel_log_json=json.dumps({"in_app": True, "email": "Sent to head.finance@aicte.gov.in"}),
            read=False
        ),
        Notification(
            user_id=seeded_users[4].id,  # Admin
            role="admin",
            title="Critical Conflict Alert: Renewal vs Harassment Complaints",
            message="National College of Engineering & Research has active EoA renewal with 3 unresolved harassment/ragging cases.",
            type="conflict_alert",
            channel_log_json=json.dumps({"in_app": True, "email": "Sent to admin@aicte.gov.in"}),
            read=False
        )
    ]
    for nf in notifs:
        db.add(nf)

    db.commit()
    db.close()
    print("Database seeding completed successfully! All 60 institutions, 400 complaints, deliberate patterns, hash-chained audit log, and demo users are ready.")

if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed_database(reset=reset)
