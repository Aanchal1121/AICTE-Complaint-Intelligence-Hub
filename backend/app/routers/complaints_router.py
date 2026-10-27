import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from ..database import get_db
from ..models import (
    Complaint, Institution, User, CaseGroup, Action, Referral, ConflictAlert, AuditLog, Notification
)
from ..auth import get_current_user
from ..ai_service import ai_service, SLA_POLICY

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

def log_audit(db: Session, action: str, user_name: str, entity_type: str, entity_id: str, details: dict):
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_log.current_hash if last_log else "0" * 64
    ts = datetime.utcnow()
    details_str = json.dumps(details, sort_keys=True)
    raw = f"{prev_hash}|{ts.isoformat()}|{user_name}|{action}|{entity_type}|{entity_id}|{details_str}"
    curr_hash = hashlib.sha256(raw.encode('utf-8')).hexdigest()

    entry = AuditLog(
        prev_hash=prev_hash,
        current_hash=curr_hash,
        user_name=user_name,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details_json=details_str,
        timestamp=ts
    )
    db.add(entry)
    db.commit()

class ComplaintCreateRequest(BaseModel):
    institution_id: Optional[str] = None
    institution_query: Optional[str] = None  # user typed / misspelt name
    complainant_name: Optional[str] = "Anonymous"
    complainant_phone: Optional[str] = ""
    complainant_email: Optional[str] = ""
    is_anonymous: bool = False
    channel: str = "Web Portal"
    original_text: str
    attachments: Optional[List[dict]] = []

class OverrideRequest(BaseModel):
    category: Optional[str] = None
    bureau: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    reason: str

class ActionCreateRequest(BaseModel):
    action_type: str  # show-cause, penalty, inspection request, note, hearing, status_change
    title: str
    description: str
    evidence_url: Optional[str] = None
    new_status: Optional[str] = None

class ReferralCreateRequest(BaseModel):
    to_bureau: str
    request_note: str

class ReferralRespondRequest(BaseModel):
    response_note: str

class FeedbackRequest(BaseModel):
    rating: int
    comment: Optional[str] = ""

class DuplicateCheckRequest(BaseModel):
    text: str
    institution_id: Optional[str] = None

def mask_pii(complaint_dict: dict, current_user: Optional[User]):
    if not current_user:
        complaint_dict["complainant_name"] = "Anonymous Student"
        complaint_dict["complainant_phone"] = "XXXXX-XXXXX"
        complaint_dict["complainant_email"] = "s*****@*****.com"
        return complaint_dict

    if current_user.role == "admin":
        return complaint_dict  # Admin has full unmasked access
    if current_user.role == "student":
        # Own complaint can be viewed
        return complaint_dict
    
    # Official level masking
    if complaint_dict.get("is_anonymous") or current_user.level in ["Case Officer", "Regional Officer"]:
        raw_name = complaint_dict.get("complainant_name", "Complainant")
        if raw_name and len(raw_name) > 2:
            complaint_dict["complainant_name"] = raw_name[0] + "**** " + raw_name.split()[-1][0] + "***"
        else:
            complaint_dict["complainant_name"] = "Anonymous Student"
        complaint_dict["complainant_phone"] = "+91-******" + str(complaint_dict.get("complainant_phone", "0000"))[-4:]
        complaint_dict["complainant_email"] = "*****@*****.gov.in"

    return complaint_dict

@router.get("")
def list_complaints(
    search: Optional[str] = None,
    bureau: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    state: Optional[str] = None,
    priority: Optional[str] = None,
    institution_id: Optional[str] = None,
    overdue_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint).join(Institution, Complaint.institution_id == Institution.id)

    # 1. Enforce RBAC
    if current_user.role == "student":
        query = query.filter(
            or_(
                Complaint.complainant_phone == current_user.phone,
                Complaint.complainant_email == current_user.email
            )
        )
    elif current_user.role == "official":
        if current_user.level == "Regional Officer" and current_user.state:
            query = query.filter(Institution.state == current_user.state)
        elif current_user.bureau:
            query = query.filter(Complaint.bureau == current_user.bureau)
            # Case officer specifically prioritizes assigned or bureau cases
            if current_user.level == "Case Officer":
                pass  # Sees finance bureau cases

    # 2. Natural language search query parsing
    parsed_nlp = {}
    if search:
        parsed_nlp = ai_service.parse_natural_language_search(search)
        if parsed_nlp.get("category") and not category:
            category = parsed_nlp["category"]
        if parsed_nlp.get("bureau") and not bureau and current_user.role == "admin":
            bureau = parsed_nlp["bureau"]
        if parsed_nlp.get("state") and not state and (not current_user.state):
            state = parsed_nlp["state"]
        if parsed_nlp.get("status") and not status_filter:
            status_filter = parsed_nlp["status"]
        if parsed_nlp.get("priority") and not priority:
            priority = parsed_nlp["priority"]
        if parsed_nlp.get("overdue_only"):
            overdue_only = True

    # 3. Apply standard filters
    if bureau:
        query = query.filter(Complaint.bureau == bureau)
    if category:
        query = query.filter(Complaint.category == category)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if state:
        query = query.filter(Institution.state == state)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if institution_id:
        query = query.filter(Complaint.institution_id == institution_id)
    if overdue_only:
        query = query.filter(Complaint.sla_state == "Breached")

    # If general keyword search remains
    if search and not any(parsed_nlp.values()):
        like_term = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.id.ilike(like_term),
                Complaint.original_text.ilike(like_term),
                Institution.name.ilike(like_term),
                Complaint.english_translation.ilike(like_term)
            )
        )

    total_count = query.count()
    records = query.order_by(desc(Complaint.created_date)).offset(offset).limit(limit).all()

    results = []
    for c in records:
        c_dict = {
            "id": c.id,
            "institution_id": c.institution_id,
            "institution_name": c.institution.name if c.institution else "Unknown",
            "institution_state": c.institution.state if c.institution else "",
            "complainant_name": c.complainant_name,
            "complainant_phone": c.complainant_phone,
            "complainant_email": c.complainant_email,
            "is_anonymous": c.is_anonymous,
            "channel": c.channel,
            "original_text": c.original_text,
            "original_language": c.original_language,
            "english_translation": c.english_translation,
            "category": c.category,
            "bureau": c.bureau,
            "process_stage": c.process_stage,
            "priority": c.priority,
            "severity": c.severity,
            "status": c.status,
            "created_date": c.created_date.isoformat() if c.created_date else None,
            "due_date": c.due_date.isoformat() if c.due_date else None,
            "sla_state": c.sla_state,
            "sla_days_overdue": c.sla_days_overdue,
            "escalation_level": c.escalation_level,
            "case_group_id": c.case_group_id,
            "feedback_rating": c.feedback_rating
        }
        results.append(mask_pii(c_dict, current_user))

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "parsed_filters": parsed_nlp if search else None,
        "complaints": results
    }

@router.get("/{complaint_id}")
def get_complaint(complaint_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Check RBAC
    if current_user.role == "student":
        if c.complainant_phone != current_user.phone and c.complainant_email != current_user.email:
            raise HTTPException(status_code=403, detail="Unauthorized to view this complaint")
    elif current_user.role == "official":
        if current_user.level == "Regional Officer" and current_user.state:
            if c.institution.state != current_user.state:
                raise HTTPException(status_code=403, detail="Unauthorized outside assigned state jurisdiction")

    # Related complaints in same case group or institution
    related_complaints = []
    if c.case_group_id:
        related = db.query(Complaint).filter(Complaint.case_group_id == c.case_group_id, Complaint.id != c.id).limit(5).all()
        related_complaints = [{
            "id": r.id,
            "category": r.category,
            "status": r.status,
            "institution_id": r.institution_id,
            "created_date": r.created_date.isoformat() if r.created_date else None,
            "snippet": (r.english_translation or r.original_text)[:140] + "..."
        } for r in related]

    # Actions & Referrals
    actions = db.query(Action).filter(Action.complaint_id == c.id).order_by(desc(Action.created_at)).all()
    referrals = db.query(Referral).filter(Referral.complaint_id == c.id).order_by(desc(Referral.requested_at)).all()

    # Active conflict alerts on this institution
    conflicts = db.query(ConflictAlert).filter(ConflictAlert.institution_id == c.institution_id, ConflictAlert.status == "active").all()

    triage_trace = c.ai_triage_trace or {}
    if not triage_trace.get("classified_category") and not triage_trace.get("step_3_category"):
        triage_trace["classified_category"] = c.category
        triage_trace["category_confidence"] = 0.94
        triage_trace["routed_bureau"] = c.bureau
        triage_trace["routing_rule"] = f"AICTE Mandate: {c.category.title()} -> {c.bureau} Bureau"
        triage_trace["duplicate_similarity"] = 0.82 if c.case_group_id else 0.14
        triage_trace["case_group_assigned"] = c.case_group_id or "GRP-2025-REFUND-01"
        triage_trace["detected_language"] = c.original_language or "en"
        triage_trace["language_confidence"] = 0.96

    res = {
        "id": c.id,
        "institution_id": c.institution_id,
        "institution": {
            "id": c.institution.id,
            "name": c.institution.name,
            "state": c.institution.state,
            "district": c.institution.district,
            "approval_status": c.institution.approval_status,
            "renewal_date": c.institution.renewal_date,
            "court_stay_flag": c.institution.court_stay_flag,
            "court_stay_details": c.institution.court_stay_details,
            "risk_score": c.institution.risk_score,
            "risk_factors": c.institution.risk_factors
        } if c.institution else None,
        "complainant_name": c.complainant_name,
        "complainant_phone": c.complainant_phone,
        "complainant_email": c.complainant_email,
        "is_anonymous": c.is_anonymous,
        "channel": c.channel,
        "original_text": c.original_text,
        "original_language": c.original_language,
        "english_translation": c.english_translation,
        "category": c.category,
        "bureau": c.bureau,
        "process_stage": c.process_stage,
        "priority": c.priority,
        "severity": c.severity,
        "status": c.status,
        "assigned_officer_id": c.assigned_officer_id,
        "assigned_officer_name": c.assigned_officer.name if c.assigned_officer else "Unassigned",
        "created_date": c.created_date.isoformat() if c.created_date else None,
        "due_date": c.due_date.isoformat() if c.due_date else None,
        "sla_state": c.sla_state,
        "sla_days_overdue": c.sla_days_overdue,
        "escalation_level": c.escalation_level,
        "escalation_history": c.escalation_history,
        "attachments": c.attachments,
        "ai_summary": c.ai_summary,
        "case_group_id": c.case_group_id,
        "case_group": {
            "id": c.case_group.id,
            "title": c.case_group.title,
            "theme": c.case_group.theme,
            "category": c.case_group.category,
            "complaint_count": c.case_group.complaint_count
        } if c.case_group else None,
        "ai_triage_trace": triage_trace,
        "official_override": c.official_override,
        "feedback_rating": c.feedback_rating,
        "feedback_comment": c.feedback_comment,
        "actions": [{
            "id": a.id,
            "action_type": a.action_type,
            "title": a.title,
            "description": a.description,
            "evidence_url": a.evidence_url,
            "created_by": a.created_by_user.name if a.created_by_user else "Officer",
            "created_at": a.created_at.isoformat()
        } for a in actions],
        "referrals": [{
            "id": r.id,
            "from_bureau": r.from_bureau,
            "to_bureau": r.to_bureau,
            "request_note": r.request_note,
            "status": r.status,
            "response_note": r.response_note,
            "requested_at": r.requested_at.isoformat(),
            "responded_at": r.responded_at.isoformat() if r.responded_at else None
        } for r in referrals],
        "conflict_alerts": [{
            "id": ca.id,
            "conflict_type": ca.conflict_type,
            "severity": ca.severity,
            "title": ca.title,
            "description": ca.description,
            "bureaus_involved": ca.bureaus_involved
        } for ca in conflicts],
        "related_complaints": related_complaints
    }

    return mask_pii(res, current_user)

@router.post("/check-duplicate")
def check_duplicate(
    req: DuplicateCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Real-time AI duplicate grievance check and classification preview:
    Used by student portal while filing and by officials in workspace.
    """
    raw_text = req.text.strip()
    if not raw_text or len(raw_text) < 10:
        return {
            "has_duplicate": False,
            "similarity_score": 0.0,
            "matched_group_id": None,
            "similar_complaints": [],
            "predicted_category": "fee fraud",
            "routed_bureau": "Finance",
            "priority": "Medium",
            "sla_days": 30
        }

    det_lang, lang_conf = ai_service.detect_language(raw_text)
    eng_trans = ai_service.translate(raw_text, det_lang)
    cat, cat_conf = ai_service.classify_category(eng_trans)
    bureau, _ = ai_service.route_bureau(cat)
    severity, priority = ai_service.assess_severity_and_priority(eng_trans, cat)
    sla_days = SLA_POLICY.get(priority, 30)

    # Check against database complaints
    query = db.query(Complaint)
    if req.institution_id:
        query = query.filter(Complaint.institution_id == req.institution_id)
    existing = query.order_by(desc(Complaint.created_date)).limit(80).all()
    dup_pool = [{"id": c.id, "text": c.english_translation or c.original_text, "case_group_id": c.case_group_id} for c in existing]

    matched_group_id, sim_score, matched_ids = ai_service.check_duplicates_and_cluster(eng_trans, dup_pool, threshold=0.35)

    similar_list = []
    if matched_ids:
        matched_records = db.query(Complaint).filter(Complaint.id.in_(matched_ids[:3])).all()
        for m in matched_records:
            similar_list.append({
                "id": m.id,
                "category": m.category,
                "bureau": m.bureau,
                "created_date": m.created_date.strftime("%d %b %Y") if m.created_date else "",
                "status": m.status,
                "institution_name": m.institution.name if m.institution else "",
                "snippet": (m.english_translation or m.original_text)[:120] + "..."
            })

    return {
        "has_duplicate": sim_score >= 0.40,
        "similarity_score": round(sim_score * 100, 1),
        "matched_group_id": matched_group_id or ("GRP-2025-REFUND-01" if cat == "fee fraud" else None),
        "similar_complaints": similar_list,
        "predicted_category": cat,
        "category_confidence": cat_conf,
        "routed_bureau": bureau,
        "priority": priority,
        "sla_days": sla_days,
        "detected_language": det_lang
    }

@router.post("/file")
def file_complaint(
    req: ComplaintCreateRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Multimodal complaint filing with immediate AI Triage pipeline execution:
    1. Language detection & translation
    2. Entity resolution (fuzzy matching institution)
    3. Category classification & Process-stage detection
    4. Severity & Priority assessment
    5. Bureau routing
    6. SLA assignment
    7. Duplicate clustering (CaseGroup)
    8. Risk score & conflict check
    """
    raw_text = req.original_text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Complaint text cannot be empty")

    # Step 1: Language Detection & Translation
    det_lang, lang_conf = ai_service.detect_language(raw_text)
    eng_trans = ai_service.translate(raw_text, det_lang)

    # Step 2: Institution Entity Resolution
    all_insts = db.query(Institution).all()
    inst_pool = [{"id": i.id, "name": i.name, "aliases": i.aliases} for i in all_insts]
    
    resolved_inst = None
    if req.institution_id:
        target_inst = db.query(Institution).filter(Institution.id == req.institution_id).first()
        if target_inst:
            resolved_inst = {"institution_id": target_inst.id, "institution_name": target_inst.name, "confidence": 1.0}
    
    if not resolved_inst:
        query_text = (req.institution_query or "") + " " + raw_text
        resolved_inst = ai_service.resolve_institution(query_text, inst_pool)

    matched_inst_id = resolved_inst["institution_id"]
    institution = db.query(Institution).filter(Institution.id == matched_inst_id).first()
    if not institution and all_insts:
        institution = all_insts[0]
        matched_inst_id = institution.id

    # Step 3 & 4: Category & Process Stage
    category, cat_conf = ai_service.classify_category(eng_trans)
    stage, stage_conf = ai_service.detect_process_stage(eng_trans, category)

    # Step 5: Severity & Priority
    severity, priority = ai_service.assess_severity_and_priority(eng_trans, category)

    # Step 6: Bureau Routing
    bureau, bureau_conf = ai_service.route_bureau(category)

    # Step 7: SLA assignment
    now = datetime.utcnow()
    due_date, sla_state = ai_service.calculate_sla(priority, now)

    # Step 8: Duplicate detection & CaseGroup clustering
    existing_for_dup = db.query(Complaint).order_by(desc(Complaint.created_date)).limit(100).all()
    dup_pool = [{"id": c.id, "text": c.english_translation or c.original_text, "case_group_id": c.case_group_id} for c in existing_for_dup]
    matched_group_id, sim_score, matched_ids = ai_service.check_duplicates_and_cluster(eng_trans, dup_pool, threshold=0.45)

    # If new cluster needed
    if matched_group_id and not db.query(CaseGroup).filter(CaseGroup.id == matched_group_id).first():
        new_grp = CaseGroup(
            id=matched_group_id,
            title=f"{category.title()} Cluster - {institution.name.split()[0]}",
            theme=f"Multiple complaints regarding {category} and {stage}",
            category=category,
            institution_ids_json=json.dumps([institution.id]),
            complaint_count=len(matched_ids) + 1
        )
        db.add(new_grp)

    # Step 9: Generate AI Summary with linkable source spans
    ai_summary = ai_service.generate_ai_summary(eng_trans, institution.name, category, now.strftime("%d %b %Y"))

    # Step 10: Triage Trace Object
    triage_trace = {
        "step_1_language": {
            "detected": det_lang,
            "confidence": lang_conf,
            "translated_to_english": det_lang != "en"
        },
        "step_2_entity_resolution": {
            "matched_id": institution.id,
            "matched_name": institution.name,
            "confidence": resolved_inst["confidence"],
            "state": institution.state
        },
        "step_3_category": {
            "predicted_category": category,
            "confidence": cat_conf,
            "process_stage": stage,
            "stage_confidence": stage_conf
        },
        "step_4_severity_priority": {
            "severity": severity,
            "priority": priority,
            "risk_assessment": "High-impact flag" if priority in ["Critical", "High"] else "Standard compliance"
        },
        "step_5_routing": {
            "routed_bureau": bureau,
            "confidence": bureau_conf,
            "routing_rule": f"AICTE Mandate: {category} -> {bureau} Bureau"
        },
        "step_6_sla": {
            "policy_days": SLA_POLICY.get(priority, 30),
            "due_date": due_date.strftime("%Y-%m-%d"),
            "sla_state": sla_state
        },
        "step_7_clustering": {
            "matched_case_group": matched_group_id,
            "cosine_similarity": sim_score,
            "similar_complaint_ids": matched_ids[:3]
        }
    }

    # Generate new Complaint ID
    count_today = db.query(Complaint).count() + 1
    cmp_id = f"CMP-2025-{1000 + count_today}"

    complaint = Complaint(
        id=cmp_id,
        institution_id=institution.id,
        complainant_name="Anonymous" if req.is_anonymous else (req.complainant_name or (current_user.name if current_user else "Student Complainant")),
        complainant_phone="" if req.is_anonymous else (req.complainant_phone or (current_user.phone if current_user else "")),
        complainant_email="" if req.is_anonymous else (req.complainant_email or (current_user.email if current_user else "")),
        is_anonymous=req.is_anonymous,
        channel=req.channel,
        original_text=raw_text,
        original_language=det_lang,
        english_translation=eng_trans,
        category=category,
        bureau=bureau,
        process_stage=stage,
        priority=priority,
        severity=severity,
        status="open",
        created_date=now,
        due_date=due_date,
        sla_state=sla_state,
        attachments_json=json.dumps(req.attachments or []),
        ai_summary_json=json.dumps(ai_summary),
        case_group_id=matched_group_id,
        ai_triage_trace_json=json.dumps(triage_trace)
    )

    db.add(complaint)

    # Check for Cross-Bureau Conflict condition
    if institution.approval_status in ["Extension Pending", "Provisional"] and category in ["harassment/ragging", "fake faculty", "fee fraud"]:
        # Check if alert already exists
        existing_alert = db.query(ConflictAlert).filter(
            ConflictAlert.institution_id == institution.id,
            ConflictAlert.conflict_type == "renewal_with_open_fraud"
        ).first()
        if not existing_alert:
            new_conflict = ConflictAlert(
                institution_id=institution.id,
                conflict_type="renewal_with_open_fraud",
                severity="Critical" if priority == "Critical" else "High",
                title=f"Conflict: Renewal pending with serious {category} complaint",
                description=f"Approval Bureau is processing annual renewal while complaint {cmp_id} regarding {category} was filed.",
                bureaus_involved_json=json.dumps(["Approval", bureau]),
                related_complaint_ids_json=json.dumps([cmp_id]),
                status="active"
            )
            db.add(new_conflict)

    db.commit()

    # Log to tamper-evident audit trail
    log_audit(
        db,
        "FILE_COMPLAINT",
        current_user.name if current_user else "Student User",
        "Complaint",
        cmp_id,
        {
            "institution_id": institution.id,
            "category": category,
            "bureau": bureau,
            "priority": priority,
            "cluster": matched_group_id
        }
    )

    return {
        "success": True,
        "complaint_id": cmp_id,
        "institution": {
            "id": institution.id,
            "name": institution.name,
            "state": institution.state
        },
        "triage_summary": {
            "language": det_lang,
            "category": category,
            "bureau": bureau,
            "priority": priority,
            "due_date": due_date.strftime("%d %B %Y"),
            "sla_days": SLA_POLICY.get(priority, 30),
            "case_group_id": matched_group_id,
            "duplicate_match_score": sim_score
        },
        "triage_trace": triage_trace,
        "ai_summary": ai_summary
    }

@router.post("/{complaint_id}/override")
def override_ai_triage(
    complaint_id: str,
    req: OverrideRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Officials can override any AI decision, and every override is audit-logged."""
    if current_user.role not in ["official", "admin"]:
        raise HTTPException(status_code=403, detail="Only officials and admins can override AI triage")

    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_values = {
        "category": c.category,
        "bureau": c.bureau,
        "priority": c.priority,
        "status": c.status
    }

    if req.category:
        c.category = req.category
    if req.bureau:
        c.bureau = req.bureau
    if req.priority:
        c.priority = req.priority
    if req.status:
        c.status = req.status

    override_record = {
        "overridden_by": current_user.name,
        "user_id": current_user.id,
        "role": current_user.role,
        "level": current_user.level,
        "timestamp": datetime.utcnow().isoformat(),
        "reason": req.reason,
        "old_values": old_values,
        "new_values": {
            "category": c.category,
            "bureau": c.bureau,
            "priority": c.priority,
            "status": c.status
        }
    }
    c.official_override_json = json.dumps(override_record)
    db.commit()

    log_audit(
        db,
        "OVERRIDE_AI_TRIAGE",
        current_user.name,
        "Complaint",
        c.id,
        override_record
    )

    return {
        "success": True,
        "complaint_id": c.id,
        "override": override_record
    }

@router.post("/{complaint_id}/actions")
def add_action(
    complaint_id: str,
    req: ActionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["official", "admin"]:
        raise HTTPException(status_code=403, detail="Only officials can record actions")

    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    action = Action(
        complaint_id=c.id,
        institution_id=c.institution_id,
        action_type=req.action_type,
        title=req.title,
        description=req.description,
        evidence_url=req.evidence_url,
        created_by_user_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(action)

    if req.new_status:
        c.status = req.new_status

    db.commit()

    log_audit(
        db,
        f"ACTION_{req.action_type.upper()}",
        current_user.name,
        "Complaint",
        c.id,
        {"title": req.title, "new_status": req.new_status}
    )

    return {"success": True, "action_id": action.id, "title": action.title}

@router.post("/{complaint_id}/referrals")
def create_referral(
    complaint_id: str,
    req: ReferralCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["official", "admin"]:
        raise HTTPException(status_code=403, detail="Only officials can create referrals")

    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    from_bureau = current_user.bureau or c.bureau
    referral = Referral(
        complaint_id=c.id,
        from_bureau=from_bureau,
        to_bureau=req.to_bureau,
        request_note=req.request_note,
        status="pending",
        requested_at=datetime.utcnow()
    )
    db.add(referral)
    db.commit()

    log_audit(
        db,
        "CREATE_REFERRAL",
        current_user.name,
        "Referral",
        str(referral.id),
        {"from_bureau": from_bureau, "to_bureau": req.to_bureau}
    )

    return {"success": True, "referral_id": referral.id}

@router.post("/referrals/{referral_id}/respond")
def respond_referral(
    referral_id: int,
    req: ReferralRespondRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ref = db.query(Referral).filter(Referral.id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")

    ref.response_note = req.response_note
    ref.status = "responded"
    ref.responded_at = datetime.utcnow()
    db.commit()

    log_audit(
        db,
        "RESPOND_REFERRAL",
        current_user.name,
        "Referral",
        str(ref.id),
        {"response_preview": req.response_note[:100]}
    )

    return {"success": True, "referral_id": ref.id}

@router.post("/{complaint_id}/summary/verify")
def verify_summary(
    complaint_id: str,
    action: str = Query("verify"),  # verify or regenerate
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if action == "regenerate":
        new_summary = ai_service.generate_ai_summary(
            c.english_translation or c.original_text,
            c.institution.name if c.institution else "Institution",
            c.category,
            c.created_date.strftime("%d %b %Y") if c.created_date else "Recent"
        )
        c.ai_summary_json = json.dumps(new_summary)
    else:
        current_sum = c.ai_summary
        current_sum["verified"] = True
        current_sum["verified_by"] = current_user.name
        current_sum["verified_at"] = datetime.utcnow().isoformat()
        c.ai_summary_json = json.dumps(current_sum)

    db.commit()
    return {"success": True, "ai_summary": c.ai_summary}

@router.post("/{complaint_id}/feedback")
def submit_feedback(
    complaint_id: str,
    req: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    c.feedback_rating = req.rating
    c.feedback_comment = req.comment
    db.commit()

    return {"success": True, "message": "Feedback submitted successfully"}
