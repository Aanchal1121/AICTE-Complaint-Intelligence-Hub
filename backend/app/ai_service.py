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
    "शिक्षक": "teacher", "परीक्षा": "examination", "प्रवेश": "admission", "रैगिंग": "ragging", "अनुमोदन": "approval",
    "सुविधा": "facility", "रुपये": "rupees", "जमा": "deposit", "दस्तावेज": "documents", "प्रमाणपत्र": "certificates",
    "लैब": "laboratory", "हॉस्टल": "hostel", "धमकी": "threat", "मान्यता": "affiliation/approval",
    "अवैध": "illegal", "रिश्वत": "bribe", "मार्कशीट": "marksheet", "रिजल्ट": "results", "डिग्री": "degree",
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
        "fee", "fees", "refund", "refunding", "refunded", "withhold", "withheld", "caution money",
        "capitation", "extortion", "excess fee", "tuition", "receipt", "fine", "penalty",
        "money back", "development fee", "overcharged", "security deposit", "dues", "scholarship",
        "फीस", "रिफंड", "वापस", "पैसे", "रुपये", "अनामत", "शुल्क", "काशन मनी"
    ],
    "fake faculty": [
        "faculty", "teacher", "teachers", "professor", "professors", "fake faculty", "ghost faculty",
        "unqualified", "phd", "staff", "absent", "biometric", "salary", "unpaid", "visiting",
        "ad-hoc", "lecturer", "lecturers", "teaching", "classes", "अध्यापक", "शिक्षक", "बायोमेट्रिक", "वेतन"
    ],
    "harassment/ragging": [
        "ragging", "harassment", "bully", "bullying", "abuse", "threat", "threatened", "caste",
        "mental torture", "violence", "assault", "senior", "seniors", "dormitory", "anti-ragging",
        "suicide", "depression", "marpit", "रैगिंग", "उत्पीड़न", "मारपीट", "सीनियर", "धमकी"
    ],
    "infrastructure": [
        "infrastructure", "lab", "laboratory", "labs", "library", "hostel", "building", "fire safety",
        "broken equipment", "computers", "hygiene", "drinking water", "power outage", "sanitation",
        "washroom", "washrooms", "toilet", "toilets", "internet", "wifi", "सुविधा", "प्रयोगशाला", "लैब", "लाइब्रेरी", "हॉस्टल"
    ],
    "admission irregularity": [
        "admission", "admissions", "counselling", "seat", "seats", "seat selling", "management quota",
        "backdoor", "merit bypass", "eligibility", "bribe", "donation", "cutoff", "allotment", "quota",
        "प्रवेश", "काउंसिलिंग", "सीट", "रिश्वत", "डोनेशन", "मेरिट"
    ],
    "approval-related": [
        "approval", "aicte approval", "renewal", "affiliation", "fake approval", "unapproved course",
        "bogus degrees", "intake violation", "seat excess", "recognition", "eoa", "extension of approval",
        "accreditation", "unrecognized", "अनुमोदन", "मान्यता", "एआईसीटीई", "अवैध"
    ],
    "affiliation": [
        "university affiliation", "disaffiliation", "unaffiliated", "syllabus change", "curriculum",
        "tie-up", "dispute", "autonomous", "संबद्धता", "विश्वविद्यालय", "यूनिवर्सिटी"
    ],
    "examination": [
        "exam", "exams", "examination", "paper leak", "evaluation", "grace marks", "revaluation",
        "mass copying", "admit card", "results delayed", "marksheet", "degree certificate", "convocation",
        "परीक्षा", "पेपर लीक", "रिजल्ट", "मार्कशीट", "डिग्री", "मूल्यांकन"
    ]
}

CATEGORY_CORPUS = {
    "fee fraud": (
        "fee fees refund refunding refunded withhold withholding caution money capitation extortion excess fee "
        "tuition fee fine penalty money back development fee overcharged security deposit dues scholarship reimbursement "
        "receipt demand draft college not refunding money cheated financial extortion "
        "फीस रिफंड वापस पैसे रुपये अनामत शुल्क जमा रसीद पैसा वापसी जुर्माना काशन मनी अतिरिक्त शुल्क "
        "fee wapas paise wapas refund nahi mila fees refund extra fees security deposit no dues"
    ),
    "fake faculty": (
        "faculty teacher teachers professor professors fake faculty ghost faculty unqualified phd absent absence "
        "attendance biometric attendance spoof salary unpaid salaries visiting ad-hoc lecturer lecturers teaching classes "
        "qualification shortage proxy attendance fake teacher "
        "अध्यापक शिक्षक प्राध्यापक शिक्षकों बायोमेट्रिक वेतन अनुपस्थित फर्जी शिक्षक फैकल्टी पढ़ाते नहीं हाजिरी "
        "faculty absent teacher absent teachers nahi aate fake teacher biometric fake salary nahi di classes nahi lagti"
    ),
    "harassment/ragging": (
        "ragging harassment bully bullying abuse abused threat threatened caste discrimination mental torture violence "
        "assault assaulted senior seniors dormitory anti-ragging suicide depression humiliation molestation safety beaten beating "
        "रैगिंग उत्पीड़न धमकी मारपीट सीनियर प्रताड़ना हिंसा अपमान गाली सुरक्षा डर प्रताड़ित "
        "ragging ho rahi seniors mar rahe marpit dhamki de rahe ragging complaint bullying mental torture seniors pareshan"
    ),
    "infrastructure": (
        "infrastructure lab laboratory laboratories library hostel building fire safety broken equipment computers hygiene "
        "drinking water power outage sanitation washroom washrooms toilet toilets internet wifi water facilities campus "
        "broken computers instruments toxic fumes no books "
        "सुविधा प्रयोगशाला लैब लाइब्रेरी पुस्तकालय हॉस्टल शौचालय पानी बिजली सफाई कंप्यूटर टूटे उपकरण "
        "lab kharab computer nahi hai drinking water ganda washroom dirty hostel me pani nahi lab band internet nahi"
    ),
    "admission irregularity": (
        "admission admissions counselling seat seats seat selling management quota backdoor merit bypass eligibility bribe "
        "donation cutoff allotment quota capitation fee rank reservation merit list bypassed cash donation "
        "प्रवेश काउंसिलिंग सीट मेरिट रिश्वत डोनेशन कोटा कटऑफ दाखिला "
        "seat bech rahe admission bribe donation mang rahe management quota backdoor admission counselling me seat"
    ),
    "approval-related": (
        "approval aicte approval renewal affiliation fake approval unapproved course bogus degrees intake violation seat excess "
        "recognition eoa extension of approval accreditation nba validity illegal college unrecognized expired approval "
        "अनुमोदन मान्यता एआईसीटीई नवीनीकरण फर्जी कॉलेज अवैध मान्यता रद्द सीट संख्या "
        "aicte approval nahi fake college unapproved course approval expired illegal course aicte affiliation fake"
    ),
    "affiliation": (
        "university affiliation disaffiliation unaffiliated syllabus curriculum tie-up board university cancelled dispute "
        "affiliating state university outdated curriculum "
        "संबद्धता विश्वविद्यालय यूनिवर्सिटी पाठ्यक्रम "
        "university affiliation disaffiliated syllabus purana"
    ),
    "examination": (
        "exam exams examination paper leak evaluation grace marks revaluation mass copying admit card results delayed marksheet "
        "degree certificate certificate withheld convocation hall ticket marksheet detained "
        "परीक्षा पेपर लीक रिजल्ट डिग्री अंकतालिका मूल्यांकन एडमिट कार्ड मार्कशीट "
        "paper leak result nahi aaya marksheet nahi di degree nahi mili admit card rok diya revaluation nahi ho raha"
    )
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
        self.categories_list = list(CATEGORY_CORPUS.keys())
        self.category_docs = [CATEGORY_CORPUS[cat] for cat in self.categories_list]
        self.tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', sublinear_tf=True)
        self.category_tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.category_docs)
        self.vectorizer = self.tfidf_vectorizer

    def detect_language(self, text: str) -> Tuple[str, float]:
        """Detect language among en, hi, mr, bn, ta, te using script and keyword analysis."""
        if not text:
            return "en", 0.90
        
        # Unicode script detection
        if re.search(r'[\u0900-\u097F]', text):
            if any(w in text for w in ["आहे", "नाही", "तक्रार", "विद्यार्थी", "परतावा"]):
                return "mr", 0.92
            return "hi", 0.96
        if re.search(r'[\u0B80-\u0BFF]', text):
            return "ta", 0.98
        if re.search(r'[\u0C00-\u0C7F]', text):
            return "te", 0.98
        if re.search(r'[\u0980-\u09FF]', text):
            return "bn", 0.98
            
        return "en", 0.92

    def translate(self, text: str, source_lang: str) -> str:
        """Translate text to English using glossary while preserving Indic unicode characters."""
        if source_lang == "en":
            return text
        
        words = text.split()
        translated_words = []
        for w in words:
            # Strip punctuation without stripping Indic vowel matras
            clean_w = re.sub(r'[\.,!\?;:\(\)\[\]\{\}"\'`~@#\$%\^&\*\-_=+/\\]', '', w)
            if clean_w in TRANSLATION_DICT:
                translated_words.append(TRANSLATION_DICT[clean_w])
            else:
                translated_words.append(w)
        
        translated_text = " ".join(translated_words)
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

            candidates = [inst_name, inst_id] + aliases
            for cand in candidates:
                ratio = difflib.SequenceMatcher(None, query_norm, cand).ratio()
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
        """Classify complaint into one of 8 AICTE complaint categories using TF-IDF + Rules."""
        clean_text = text.strip()
        if not clean_text or len(clean_text) < 4:
            return "unclassified", 0.0

        text_lower = clean_text.lower()
        
        # Filter pure non-grievance greetings or random gibberish
        non_grievance_set = {"hello", "hi", "hey", "test", "testing", "asdf", "qwerty", "kuch", "bhi", "xyz", "check", "good", "morning", "evening", "okay", "ok", "fine"}
        tokens = re.findall(r'\b\w+\b', text_lower)
        if tokens and all(t in non_grievance_set for t in tokens):
            return "unclassified", 0.0

        # Translate if needed for combined lexical coverage
        det_lang, _ = self.detect_language(clean_text)
        eng_trans = self.translate(clean_text, det_lang).lower() if det_lang != "en" else text_lower

        combined_text = f"{text_lower} {eng_trans}"

        # 1. TF-IDF Cosine Similarity against Category Prototypes
        try:
            q_vec = self.tfidf_vectorizer.transform([combined_text])
            sims = cosine_similarity(q_vec, self.category_tfidf_matrix)[0]
        except Exception:
            sims = np.zeros(len(self.categories_list))

        # 2. Domain Rule & Keyword Scoring
        scores = {}
        for idx, cat in enumerate(self.categories_list):
            kws = CATEGORY_KEYWORDS.get(cat, [])
            kw_score = 0.0
            for kw in kws:
                pattern = r'(?<!\w)' + re.escape(kw.lower()) + r'(?!\w)'
                if re.search(pattern, combined_text):
                    kw_score += 3.5 if " " in kw else 2.0

            tfidf_score = float(sims[idx]) * 10.0
            scores[cat] = kw_score + tfidf_score

        best_cat = max(scores, key=scores.get)
        max_score = scores[best_cat]

        # Minimum threshold check to prevent false positives on random text
        if max_score < 1.0:
            return "unclassified", 0.0

        confidence = min(0.98, max(0.70, 0.65 + (max_score * 0.04)))
        return best_cat, round(confidence, 2)

    def detect_process_stage(self, text: str, category: str) -> Tuple[str, float]:
        """Identify which process stage is failing."""
        if category == "unclassified":
            return "Pending Review", 0.0
            
        text_lower = text.lower()
        for stage, kws in PROCESS_STAGE_KEYWORDS.items():
            if any(kw in text_lower for kw in kws):
                return stage, 0.88
        
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
        if category == "unclassified":
            return "Low", "Low"

        text_lower = text.lower()
        critical_triggers = ["suicide", "violence", "threat", "assault", "court stay", "mass boycott", "lakhs", "massive bribe"]
        high_triggers = ["fraud", "fake", "extortion", "withholding original documents", "degrees invalid", "sexual harassment", "strike"]

        if any(trig in text_lower for trig in critical_triggers) or category == "harassment/ragging":
            return "High", "Critical"
        if any(trig in text_lower for trig in high_triggers) or category in ["fee fraud", "fake faculty"]:
            return "High", "High"
        if category in ["infrastructure", "admission irregularity", "examination"]:
            return "Medium", "Medium"
        return "Low", "Low"

    def route_bureau(self, category: str) -> Tuple[str, float]:
        """Map category to AICTE bureau with confidence."""
        if category == "unclassified":
            return "Pending Review", 0.0
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
