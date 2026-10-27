import json
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AuditLog
from ..auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    role: str  # student | official | admin
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    otp: Optional[str] = None

class OtpRequest(BaseModel):
    phone: str

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

@router.post("/student-otp")
def request_student_otp(req: OtpRequest, db: Session = Depends(get_db)):
    """Simulate OTP dispatch for Student Complainant login."""
    # Seeded student is 9876543210
    mock_otp = "123456"
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        # Create student if not exists
        user = User(
            name="Student User",
            phone=req.phone,
            email=f"student_{req.phone[-4:]}@aicte.gov.in",
            role="student",
            level="Student Complainant",
            hashed_password=mock_otp
        )
        db.add(user)
        db.commit()

    return {
        "success": True,
        "phone": req.phone,
        "otp": mock_otp,
        "message": f"Demo OTP is {mock_otp} (dispatched to {req.phone})"
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = None
    if req.role == "student":
        if not req.phone:
            raise HTTPException(status_code=400, detail="Mobile number is required")
        user = db.query(User).filter(User.phone == req.phone, User.role == "student").first()
        if not user or (req.otp != "123456" and req.otp != "mockotp_123456"):
            raise HTTPException(status_code=400, detail="Invalid Mobile number or OTP. Use OTP: 123456")
    else:
        if not req.email or not req.password:
            raise HTTPException(status_code=400, detail="Email and password are required")
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if req.role == "admin" and user.role != "admin":
            raise HTTPException(status_code=403, detail="User does not have Admin credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role, "level": user.level, "bureau": user.bureau, "state": user.state})
    
    # Audit log login
    log_audit(db, "LOGIN", user.name, "User", str(user.id), {"role": user.role, "level": user.level, "bureau": user.bureau})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "level": user.level,
            "bureau": user.bureau,
            "state": user.state
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "level": current_user.level,
        "bureau": current_user.bureau,
        "state": current_user.state
    }

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """Returns seeded demo personas for 1-click login and Fill credentials buttons."""
    return [
        {
            "role_tab": "Student",
            "name": "Aarav Sharma",
            "role": "student",
            "level": "Student Complainant",
            "phone": "9876543210",
            "otp": "123456",
            "description": "Student who filed caution money withholding complaint against Apex Institute Indore."
        },
        {
            "role_tab": "Official",
            "name": "Vikram Malhotra",
            "role": "official",
            "level": "Case Officer",
            "bureau": "Finance",
            "email": "officer.finance@aicte.gov.in",
            "password": "DemoPass@123",
            "description": "Case Officer handling Finance Bureau complaints, fee audits, and action drafts."
        },
        {
            "role_tab": "Official",
            "name": "Dr. Sunita Deshmukh",
            "role": "official",
            "level": "Bureau Head",
            "bureau": "Finance",
            "email": "head.finance@aicte.gov.in",
            "password": "DemoPass@123",
            "description": "Bureau Head viewing bureau workload metrics, aging trends, and SLA escalations."
        },
        {
            "role_tab": "Official",
            "name": "Rajeshwar Verma",
            "role": "official",
            "level": "Regional Officer",
            "bureau": None,
            "state": "Madhya Pradesh",
            "email": "ro.mp@aicte.gov.in",
            "password": "DemoPass@123",
            "description": "Regional Officer with jurisdictional filter scoped strictly to Madhya Pradesh cases."
        },
        {
            "role_tab": "Admin/Leadership",
            "name": "Prof. Anil Sahasrabudhe (Chairman's Office)",
            "role": "admin",
            "level": "Leadership",
            "bureau": None,
            "email": "admin@aicte.gov.in",
            "password": "DemoPass@123",
            "description": "AICTE Leadership overseeing national dashboard, root-cause studio, conflict alerts, and audit trail."
        }
    ]
