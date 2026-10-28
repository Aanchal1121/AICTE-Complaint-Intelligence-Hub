import json
import hashlib
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from ..database import get_db
from ..models import Institution, Complaint, CaseGroup, Action, ConflictAlert, User, AuditLog
from ..auth import get_current_user

router = APIRouter(prefix="/api/institutions", tags=["institutions"])

@router.get("")
def list_institutions(
    search: Optional[str] = None,
    state: Optional[str] = None,
    risk_min: Optional[float] = None,
    limit: int = 60,
    db: Session = Depends(get_db)
):
    query = db.query(Institution)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Institution.name.ilike(term),
                Institution.id.ilike(term),
                Institution.aliases_json.ilike(term),
                Institution.district.ilike(term)
            )
        )

    if state:
        query = query.filter(Institution.state == state)

    if risk_min is not None:
        query = query.filter(Institution.risk_score >= risk_min)

    total = query.count()
    records = query.order_by(desc(Institution.risk_score)).limit(limit).all()

    return {
        "total": total,
        "institutions": [{
            "id": i.id,
            "name": i.name,
            "aliases": i.aliases,
            "state": i.state,
            "district": i.district,
            "programs": i.programs,
            "approval_status": i.approval_status,
            "renewal_date": i.renewal_date,
            "court_stay_flag": i.court_stay_flag,
            "risk_score": i.risk_score,
            "complaint_count": len(i.complaints)
        } for i in records]
    }

@router.get("/{institution_id}")
def get_institution_360(institution_id: str, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    complaints = db.query(Complaint).filter(Complaint.institution_id == inst.id).order_by(desc(Complaint.created_date)).all()
    actions = db.query(Action).filter(Action.institution_id == inst.id).order_by(desc(Action.created_at)).all()
    conflicts = db.query(ConflictAlert).filter(ConflictAlert.institution_id == inst.id).all()

    # Bureau-wise breakdown
    bureau_stats = {}
    for c in complaints:
        bureau_stats[c.bureau] = bureau_stats.get(c.bureau, 0) + 1

    # Category-wise breakdown
    category_stats = {}
    for c in complaints:
        category_stats[c.category] = category_stats.get(c.category, 0) + 1

    # SLA and Status distribution
    status_stats = {}
    breached_count = 0
    for c in complaints:
        status_stats[c.status] = status_stats.get(c.status, 0) + 1
        if c.sla_state == "Breached":
            breached_count += 1

    # Linked case groups
    case_group_ids = list(set([c.case_group_id for c in complaints if c.case_group_id]))
    case_groups = db.query(CaseGroup).filter(CaseGroup.id.in_(case_group_ids)).all() if case_group_ids else []

    # Dynamic Cross-Bureau Conflict Alert Check
    active_conflict_alerts = [{
        "id": cf.id,
        "conflict_type": cf.conflict_type,
        "severity": cf.severity,
        "title": cf.title,
        "description": cf.description,
        "bureaus_involved": cf.bureaus_involved,
        "related_complaint_ids": cf.related_complaint_ids,
        "status": cf.status
    } for cf in conflicts]

    return {
        "institution": {
            "id": inst.id,
            "name": inst.name,
            "aliases": inst.aliases,
            "state": inst.state,
            "district": inst.district,
            "programs": inst.programs,
            "approval_status": inst.approval_status,
            "renewal_date": inst.renewal_date,
            "court_stay_flag": inst.court_stay_flag,
            "court_stay_details": inst.court_stay_details,
            "penalties": inst.penalties,
            "risk_score": inst.risk_score,
            "risk_factors": inst.risk_factors
        },
        "stats": {
            "total_complaints": len(complaints),
            "open_complaints": status_stats.get("open", 0) + status_stats.get("under review", 0),
            "resolved_complaints": status_stats.get("resolved", 0),
            "breached_complaints": breached_count,
            "bureau_breakdown": bureau_stats,
            "category_breakdown": category_stats,
            "status_breakdown": status_stats
        },
        "conflict_alerts": active_conflict_alerts,
        "timeline": [{
            "id": c.id,
            "date": c.created_date.strftime("%Y-%m-%d") if c.created_date else None,
            "bureau": c.bureau,
            "category": c.category,
            "status": c.status,
            "priority": c.priority,
            "sla_state": c.sla_state,
            "text": c.english_translation or c.original_text
        } for c in complaints[:20]],
        "official_actions": [{
            "id": a.id,
            "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else None,
            "action_type": a.action_type,
            "title": a.title,
            "description": a.description
        } for a in actions],
        "linked_case_groups": [{
            "id": cg.id,
            "title": cg.title,
            "theme": cg.theme,
            "category": cg.category,
            "complaint_count": cg.complaint_count
        } for cg in case_groups]
    }

class InstitutionAdminEditRequest(BaseModel):
    approval_status: str
    renewal_date: Optional[str] = None
    court_stay_flag: bool
    reason_note: str

@router.put("/{institution_id}/admin-edit")
def admin_edit_institution(
    institution_id: str,
    req: InstitutionAdminEditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin control over institutional regulatory records (approval status, renewal date, stay flag).
    Mandatory administrative reason note is required and recorded in the hash-chained audit trail.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required to modify institutional regulatory record")
    if not req.reason_note or len(req.reason_note.strip()) < 5:
        raise HTTPException(status_code=400, detail="Mandatory administrative reason note required for audit logging (min 5 characters)")

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    old_state = {
        "approval_status": inst.approval_status,
        "renewal_date": inst.renewal_date,
        "court_stay_flag": inst.court_stay_flag
    }

    inst.approval_status = req.approval_status
    if req.renewal_date:
        inst.renewal_date = req.renewal_date
    inst.court_stay_flag = req.court_stay_flag
    db.commit()

    # Log to tamper-evident cryptographic audit trail
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_h = last_log.current_hash if last_log else "0" * 64
    ts = datetime.utcnow()
    dt_str = json.dumps({
        "old_state": old_state,
        "new_state": {
            "approval_status": inst.approval_status,
            "renewal_date": inst.renewal_date,
            "court_stay_flag": inst.court_stay_flag
        },
        "reason_note": req.reason_note
    }, sort_keys=True)
    raw = f"{prev_h}|{ts.isoformat()}|{current_user.name}|ADMIN_EDIT_INSTITUTION|Institution|{inst.id}|{dt_str}"
    ch = hashlib.sha256(raw.encode('utf-8')).hexdigest()
    db.add(AuditLog(
        prev_hash=prev_h, current_hash=ch, user_name=current_user.name,
        action="ADMIN_EDIT_INSTITUTION", entity_type="Institution", entity_id=inst.id,
        details_json=dt_str, timestamp=ts
    ))
    db.commit()

    return {
        "success": True,
        "institution_id": inst.id,
        "message": "Institutional regulatory standing successfully updated and logged to audit trail."
    }

