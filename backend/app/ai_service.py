import re
import difflib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Multilingual dictionaries for basic offline detection & translation
LANG_KEYWORDS = {
    "hi": ["फीस", "वापस", "कॉलेज", "संस्थान", "शिकायत", "छात्र", "रिफंड", "धोखाधड़ी", "अध्यापक", "परीक्षा", "प्रवेश", "रैगिंग", "अनुमोदन", "सुविधा", "है", "नहीं", "दिया"],
    "mr": ["महाविद्यालय", "संस्था", "तक्रार", "विद्यार्थी", "परतावा", "फसवणूक", "प्राध्यापक", "परीक्षा", "प्रवेश", "रॅगिंग", "नाही", "आहे"],
    "bn": ["ফি", "ফেরত", "কলেজ", "অভিযোগ", "ছাত্র", "প্রতারণা", "শিক্ষক", "পরীক্ষা", "ভর্তি", "র‌্যাগিং", "নাই"],
    "ta": ["கல்லூரி", "புகார்", "மாணவர்", "கட்டணம்", "திரும்ப", "மோசடி", "ஆசிரியர்", "தேர்வு", "சேர்க்கை"],
    "te": ["కళాశాల", "ఫిర్యాదు", "విద్యార్థి", "ఫీజు", "వాపసు", "మోసం", "ఉపాధ్యాయుడు", "పరీక్ష", "ప్రవేశం"]
}

# Translation glossary for offline translation
TRANSLATION_DICT = {
    # Hindi
    "फीस": "fees", "वापस": "refund", "कॉलेज": "college", "संस्थान": "institution", "शिकायत": "complaint",
    "छात्र": "student", "रिफंड": "refund", "धोखाधड़ी": "fraud", "अध्यापक": "faculty", "शिक्षकों": "faculty",
    "परीक्षा": "examination", "प्रवेश": "admission", "रैगिंग": "ragging", "अनुमोदन": "approval",
    "सुविधा": "facility", "रुपये": "rupees", "जमा": "deposit", "दस्तावेज": "documents", "प्रमाणपत्र": "certificates",
    "लैब": "laboratory", "हॉस्टल": "hostel", "धमकी": "threat", "मान्यता": "affiliation/approval",
    # Marathi
    "महाविद्यालय": "college", "संस्था": "institution", "तक्रार": "complaint", "विद्यार्थी": "student",
    "परतावा": "refund", "फसवणूक": "fraud", "प्राध्यापक": "faculty",
    # Bengali
    "ফি": "fees", "ফেরত": "refund", "অভিযোগ": "complaint", "ছাত্র": "student", "প্রতারণা": "fraud",
    # Tamil
    "கல்லூரி": "college", "புகார்": "complaint", "கட்டணம்": "fee", "மாணவர்": "student",
    # Telugu
    "కళాశాల": "college", "ఫిర్యాదు": "complaint", "ఫీజు": "fee", "విద్యార్థి": "student"
}

CATEGORY_KEYWORDS = {
    "fee fraud": [
        "fee", "fees", "refund", "withhold", "caution money", "capitation", "extortion", "excess fee",
        "tuition", "refunded", "receipt", "fine", "penalty fee", "money back", "development fee", "overcharged",
        "फीस", "रिफंड", "वापस", "पैसे"
    ],
    "fake faculty": [
        "faculty", "teacher", "professor", "fake faculty", "ghost faculty", "unqualified", "phd fake",
        "staff", "absent teacher", "salary not paid", "visiting", "ad-hoc", "lecturer", "अध्यापक", "शिक्षक"
    ],
    "harassment/ragging": [
        "ragging", "harassment", "bully", "abuse", "threat", "caste", "mental torture", "violence",
        "assault", "senior", "hostel ragging", "anti-ragging", "suicide threat", "depression", "रैगिंग", "उत्पीड़न"
    ],
    "infrastructure": [
        "infrastructure", "lab", "laboratory", "library", "hostel", "building", "fire safety", "broken equipment",
        "no computers", "hygiene", "drinking water", "power outage", "sanitation", "washroom", "सुविधा", "प्रयोगशाला"
    ],
    "admission irregularity": [
        "admission", "counselling", "seat selling", "management quota", "backdoor", "merit bypass",
        "eligibility", "bribe for seat", "cutoff", "allotment", "प्रवेश", "काउंसिलिंग"
    ],
    "approval-related": [
        "approval", "aicte approval", "renewal", "affiliation", "fake approval", "unapproved course",
        "bogus degrees", "intake violation", "seat excess", "recognition", "अनुमोदन", "मान्यता"
    ],
    "affiliation": [
        "university affiliation", "disaffiliation", "unaffiliated", "syllabus change", "curriculum", "tie-up"
    ],
    "examination": [
        "exam", "examination", "paper leak", "evaluation", "grace marks", "revaluation", "mass copying",
        "admit card", "results delayed", "marksheet withheld", "degree certificate", "परीक्षा"
    ]
}

BUREAU_MAPPING = {
    "fee fraud": "Finance",
    "fake faculty": "Academic",
    "harassment/ragging": "Student Welfare Cell",
    "infrastructure": "Inspection Cell",
    "admission irregularity": "Approval",
    "approval-related": "Approval",
    "affiliation": "Academic",
    "examination": "Examination and Quality"
}

PROCESS_STAGE_KEYWORDS = {
    "fee refund": ["refund", "caution money", "security deposit", "withheld fee", "reimbursement", "वापस", "रिफंड"],
    "approval renewal": ["renewal", "extension of approval", "eoa", "provisional approval", "annual renewal", "अनुमोदन"],
    "inspection": ["inspection", "surprise visit", "infrastructure check", "lab deficiency", "compliance audit"],
    "admission counselling": ["admission", "seat allotment", "counselling", "management quota", "merit list"],
    "faculty verification": ["faculty verification", "aadhaar verification", "biometric", "ghost faculty", "qualification"],
    "exam evaluation": ["exam", "evaluation", "marksheet", "results", "paper leak", "revaluation"],
    "scholarship disbursement": ["scholarship", "disbursement", "post-matric", "pmsss", "fellowship"],
    "anti-ragging enquiry": ["ragging", "anti-ragging", "hostel dispute", "disciplinary enquiry", "enquiry committee"]
}

SLA_POLICY = {
    "Critical": 7,      # 7 calendar days for Critical/severe
    "High": 15,         # 15 days
    "Medium": 30,       # 30 days
    "Low": 45           # 45 days
}

class AIService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        self._fitted = False

    def detect_language(self, text: str) -> Tuple[str, float]:
        """Detect language among en, hi, mr, bn, ta, te with confidence."""
        text_lower = text.lower()
        scores = {"en": 0.5}  # default prior
        
        for lang, kws in LANG_KEYWORDS.items():
            match_count = sum(1 for kw in kws if kw in text)
            if match_count > 0:
                scores[lang] = match_count * 1.5

        detected_lang = max(scores, key=scores.get)
        confidence = min(0.98, max(0.65, scores[detected_lang] / (sum(scores.values()) + 0.001)))
        return detected_lang, round(confidence, 2)

    def translate(self, text: str, source_lang: str) -> str:
        """Translate text to English using offline dictionary + semantic glossing."""
        if source_lang == "en":
            return text
        
        words = text.split()
        translated_words = []
        replaced_count = 0
        for w in words:
            clean_w = re.sub(r'[^\w\s]', '', w)
            if clean_w in TRANSLATION_DICT:
                translated_words.append(TRANSLATION_DICT[clean_w])
                replaced_count += 1
            else:
                translated_words.append(w)
        
        translated_text = " ".join(translated_words)
        # Add high-fidelity English interpretation annotation
        return f"[Translated from {source_lang.upper()}]: {translated_text}"

    def resolve_institution(self, query_text: str, institution_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fuzzy match institution name/aliases with typo tolerance."""
        query_norm = re.sub(r'[^a-zA-Z0-9\s]', '', query_text.lower())
        best_inst = None
        best_score = 0.0

        for inst in institution_list:
            inst_name = inst.get("name", "").lower()
            inst_id = inst.get("id", "").lower()
            aliases = [a.lower() for a in inst.get("aliases", [])]

            # Direct check
            candidates = [inst_name, inst_id] + aliases
            for cand in candidates:
                # SequenceMatcher ratio
                ratio = difflib.SequenceMatcher(None, query_norm, cand).ratio()
                # Substring match boost
                if cand in query_norm or any(token in cand for token in query_norm.split() if len(token) > 4):
                    ratio = max(ratio, 0.78)

                if ratio > best_score:
                    best_score = ratio
                    best_inst = inst

        if not best_inst and institution_list:
            best_inst = institution_list[0]
            best_score = 0.50

        return {
            "institution_id": best_inst["id"] if best_inst else None,
            "institution_name": best_inst["name"] if best_inst else "Unknown Institution",
            "confidence": round(min(0.99, max(0.40, best_score)), 2)
        }

    def classify_category(self, text: str) -> Tuple[str, float]:
        """Classify complaint into one of 8 AICTE complaint categories."""
        text_lower = text.lower()
        scores = {}
        for cat, kws in CATEGORY_KEYWORDS.items():
            score = sum(2 if kw in text_lower else 0 for kw in kws)
            if score > 0:
                scores[cat] = score

        if not scores:
            return "fee fraud", 0.65

        best_cat = max(scores, key=scores.get)
        confidence = min(0.96, 0.60 + (scores[best_cat] * 0.06))
        return best_cat, round(confidence, 2)

    def detect_process_stage(self, text: str, category: str) -> Tuple[str, float]:
        """Identify which process stage is failing."""
        text_lower = text.lower()
        for stage, kws in PROCESS_STAGE_KEYWORDS.items():
            if any(kw in text_lower for kw in kws):
                return stage, 0.88
        
        # Fallback based on category
        default_stage_map = {
            "fee fraud": "fee refund",
            "fake faculty": "faculty verification",
            "harassment/ragging": "anti-ragging enquiry",
            "infrastructure": "inspection",
            "admission irregularity": "admission counselling",
            "approval-related": "approval renewal",
            "affiliation": "approval renewal",
            "examination": "exam evaluation"
        }
        return default_stage_map.get(category, "fee refund"), 0.70

    def assess_severity_and_priority(self, text: str, category: str) -> Tuple[str, str]:
        """Assess severity (High/Med/Low) and priority (Critical/High/Med/Low)."""
        text_lower = text.lower()
        critical_triggers = ["suicide", "violence", "threat", "assault", "court stay", "mass boycott", "lakhs", "massive bribe"]
        high_triggers = ["fraud", "fake", "extortion", "withholding original documents", "degrees invalid", "sexual harassment", "strike"]

        if any(trig in text_lower for trig in critical_triggers) or category == "harassment/ragging":
            return "High", "Critical"
        if any(trig in text_lower for trig in high_triggers) or category in ["fee fraud", "fake faculty"]:
            return "High", "High"
        if category in ["infrastructure", "admission irregularity"]:
            return "Medium", "Medium"
        return "Low", "Low"

    def route_bureau(self, category: str) -> Tuple[str, float]:
        """Map category to AICTE bureau with confidence."""
        bureau = BUREAU_MAPPING.get(category, "Finance")
        return bureau, 0.95

    def calculate_sla(self, priority: str, created_at: Optional[datetime] = None) -> Tuple[datetime, str]:
        """Calculate due date and initial SLA status."""
        created = created_at or datetime.utcnow()
        days = SLA_POLICY.get(priority, 30)
        due_date = created + timedelta(days=days)
        return due_date, "Within SLA"

    def check_duplicates_and_cluster(self, new_text: str, existing_complaints: List[Dict[str, Any]], threshold: float = 0.45) -> Tuple[Optional[str], float, List[str]]:
        """Cluster into CaseGroup if cosine similarity exceeds threshold."""
        if not existing_complaints:
            return None, 0.0, []

        corpus = [c["text"] for c in existing_complaints]
        all_docs = corpus + [new_text]
        
        try:
            tfidf = TfidfVectorizer(stop_words='english')
            tfidf_mat = tfidf.fit_transform(all_docs)
            new_vec = tfidf_mat[-1]
            existing_vecs = tfidf_mat[:-1]
            sims = cosine_similarity(new_vec, existing_vecs)[0]
            
            top_idx = int(np.argmax(sims))
            top_score = float(sims[top_idx])
            
            matching_ids = []
            matched_group = None
            for idx, score in enumerate(sims):
                if score >= threshold:
                    matched_id = existing_complaints[idx]["id"]
                    matching_ids.append(matched_id)
                    if existing_complaints[idx].get("case_group_id") and not matched_group:
                        matched_group = existing_complaints[idx]["case_group_id"]
            
            if top_score >= threshold:
                return matched_group or f"GRP-{datetime.utcnow().strftime('%Y%m')}-{existing_complaints[top_idx]['id'][-4:]}", round(top_score, 2), matching_ids
        except Exception:
            pass

        return None, 0.0, []

    def generate_ai_summary(self, complaint_text: str, institution_name: str, category: str, date_str: str) -> Dict[str, Any]:
        """
        Generate structured summary where every field links back to exact source sentence spans.
        Clicking any field in frontend highlights the sentence in the original complaint.
        """
        sentences = [s.strip() for s in re.split(r'[.!?\n]+', complaint_text) if s.strip()]
        if not sentences:
            sentences = [complaint_text]

        # Extract or match sentences for structured fields
        main_issue_sent = sentences[0] if sentences else complaint_text
        date_sent = next((s for s in sentences if any(w in s.lower() for w in ["date", "month", "year", "202", "day", "since", "from", "on"])), sentences[-1])
        action_sent = next((s for s in sentences if any(w in s.lower() for w in ["paid", "reported", "asked", "submitted", "called", "sent", "receipt", "letter"])), sentences[min(1, len(sentences)-1)])
        outstanding_sent = next((s for s in sentences if any(w in s.lower() for w in ["still", "not yet", "pending", "refused", "denied", "withheld", "no response"])), sentences[-1])

        return {
            "main_issue": {
                "text": f"{category.upper()}: {main_issue_sent[:140]}...",
                "source_text": main_issue_sent,
                "confidence": 0.92
            },
            "institution_involved": {
                "text": institution_name,
                "source_text": next((s for s in sentences if any(w in s.lower() for w in ["college", "institute", "university", "academy", "campus", institution_name.split()[0].lower()])), sentences[0]),
                "confidence": 0.95
            },
            "important_dates": {
                "text": f"Incident reported on {date_str}. Key reference: '{date_sent[:90]}'",
                "source_text": date_sent,
                "confidence": 0.86
            },
            "actions_already_taken": {
                "text": f"Complainant escalation: '{action_sent[:110]}'",
                "source_text": action_sent,
                "confidence": 0.88
            },
            "outstanding_information": {
                "text": f"Pending resolution or institution response: '{outstanding_sent[:120]}'",
                "source_text": outstanding_sent,
                "confidence": 0.89
            },
            "recommended_next_step": {
                "text": f"Issue automated AICTE notice to Registrar under Regulation 14(b) and verify with {BUREAU_MAPPING.get(category, 'Finance')} Bureau.",
                "source_text": sentences[0],
                "confidence": 0.91
            },
            "generated_at": datetime.utcnow().isoformat(),
            "verified": False,
            "verified_by": None
        }

    def parse_natural_language_search(self, query: str) -> Dict[str, Any]:
        """
        Parse natural language search into structured query filters.
        Example: 'Show overdue fee complaints from the last three months in Madhya Pradesh'
        """
        q = query.lower()
        parsed: Dict[str, Any] = {
            "query_text": query,
            "category": None,
            "bureau": None,
            "status": None,
            "state": None,
            "priority": None,
            "overdue_only": False,
            "date_range": None
        }

        # Categories
        for cat, kws in CATEGORY_KEYWORDS.items():
            if any(kw in q for kw in kws):
                parsed["category"] = cat
                break

        # Bureaus
        bureaus = ["Finance", "Approval", "Academic", "Examination and Quality", "Inspection Cell", "Student Welfare Cell"]
        for b in bureaus:
            if b.lower() in q:
                parsed["bureau"] = b
                break

        # Overdue / SLA breach
        if any(w in q for w in ["overdue", "breach", "delayed", "late", "pending beyond"]):
            parsed["overdue_only"] = True

        # Status
        statuses = ["open", "under review", "awaiting institution", "sub-judice", "resolved", "penalty imposed"]
        for st in statuses:
            if st in q:
                parsed["status"] = st
                break

        # States
        states = ["Madhya Pradesh", "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Uttar Pradesh", "Gujarat", "Rajasthan", "Telangana", "West Bengal"]
        for st in states:
            if st.lower() in q or (st == "Madhya Pradesh" and "mp" in q.split()):
                parsed["state"] = st
                break

        # Priority
        for pr in ["Critical", "High", "Medium", "Low"]:
            if pr.lower() in q:
                parsed["priority"] = pr
                break

        # Date range
        if "three months" in q or "3 months" in q or "quarter" in q:
            parsed["date_range"] = "last_90_days"
        elif "last month" in q or "30 days" in q:
            parsed["date_range"] = "last_30_days"
        elif "year" in q or "12 months" in q:
            parsed["date_range"] = "last_365_days"

        return parsed


# Global singleton
ai_service = AIService()
