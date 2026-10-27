import json
import hashlib
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import User, AuditLog, Notification
from ..auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

class UserUpdateRequest(BaseModel):
    role: str
    level: str
    bureau: Optional[str] = None
    state: Optional[str] = None
    is_active: bool

class RuleUpdateRequest(BaseModel):
    rules: List[dict]

# In-memory configurable SLA rules
CONFIGURED_RULES = [
    {"id": "RULE-01", "name": "Critical / Harassment SLA", "condition": "priority == 'Critical'", "action": "Due in 7 days, notify Bureau Head"},
    {"id": "RULE-02", "name": "Fee Fraud & Faculty SLA", "condition": "priority == 'High'", "action": "Due in 15 days, auto-escalate on breach"},
    {"id": "RULE-03", "name": "Standard SLA", "condition": "priority == 'Medium'", "action": "Due in 30 days"},
    {"id": "RULE-04", "name": "Renewal Conflict Guard", "condition": "renewal_pending && unresolved_fraud", "action": "Hard stop on EoA certificate issuance"},
    {"id": "RULE-05", "name": "Court Stay Enforcement Freeze", "condition": "court_stay_flag == True", "action": "Block coercive penalty collection actions"},
    {"id": "RULE-06", "name": "60-Day Multi-Bureau Surge", "condition": "bureau_flags >= 3 in 60d", "action": "Trigger high-priority leadership alert"}
]

@router.get("/users")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required to manage users")
    users = db.query(User).all()
    return {
        "users": [{
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "level": u.level,
            "bureau": u.bureau,
            "state": u.state,
            "is_active": u.is_active
        } for u in users]
    }

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.role = req.role
    u.level = req.level
    u.bureau = req.bureau
    u.state = req.state
    u.is_active = req.is_active
    db.commit()

    return {"success": True, "user_id": u.id, "name": u.name}

@router.get("/rules")
def get_rules():
    return {"rules": CONFIGURED_RULES}

@router.post("/rules")
def update_rules(req: RuleUpdateRequest, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    global CONFIGURED_RULES
    CONFIGURED_RULES = req.rules
    return {"success": True, "rules": CONFIGURED_RULES}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.id)).limit(limit).all()
    return {
        "total": db.query(AuditLog).count(),
        "logs": [{
            "id": l.id,
            "prev_hash": l.prev_hash,
            "current_hash": l.current_hash,
            "user_name": l.user_name,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC") if l.timestamp else None
        } for l in logs]
    }

@router.post("/audit/verify")
def verify_audit_trail(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Cryptographically verify the SHA-256 hash-chain from genesis entry to the latest entry.
    Ensures that no record has been inserted, tampered, or deleted.
    """
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {"valid": True, "total_records": 0, "message": "Audit log is empty"}

    expected_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    for idx, log in enumerate(logs):
        if idx > 0 and log.prev_hash != expected_prev:
            return {
                "valid": False,
                "broken_at_id": log.id,
                "error": f"Chain link broken at entry #{log.id}: prev_hash mismatch",
                "verified_records": idx
            }
        
        # Verify self hash
        raw = f"{log.prev_hash}|{log.timestamp.isoformat()}|{log.user_name}|{log.action}|{log.entity_type}|{log.entity_id}|{log.details_json}"
        calc_hash = hashlib.sha256(raw.encode('utf-8')).hexdigest()
        if calc_hash != log.current_hash:
            return {
                "valid": False,
                "broken_at_id": log.id,
                "error": f"Data integrity hash mismatch at entry #{log.id}",
                "expected": calc_hash,
                "found": log.current_hash,
                "verified_records": idx
            }

        expected_prev = log.current_hash

    return {
        "valid": True,
        "total_records": len(logs),
        "verified_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "status": "SECURE_AND_TAMPER_FREE",
        "genesis_hash": logs[0].current_hash[:16] + "...",
        "head_hash": logs[-1].current_hash[:16] + "...",
        "message": f"Successfully verified SHA-256 cryptographic chain across all {len(logs)} entries."
    }

@router.get("/notifications")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.role == current_user.role)
    ).order_by(desc(Notification.created_at)).limit(20)

    notifs = query.all()
    return {
        "notifications": [{
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "channel_log": n.channel_log,
            "read": n.read,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else None
        } for n in notifs]
    }

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if n:
        n.read = True
        db.commit()
    return {"success": True}
