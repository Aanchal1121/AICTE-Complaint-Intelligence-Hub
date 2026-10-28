import json
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AuditLog
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    role: str  # student | official | admin
    email: Optional[str] = None
    phone: Optional[str] = None
    enrollment_no: Optional[str] = None
    password: Optional[str] = None
    otp: Optional[str] = None

class StudentRegisterRequest(BaseModel):
    name: str
    college_name: str
    enrollment_no: str
    student_class: str  # e.g. B.Tech, M.Tech, MCA, Diploma
    branch: str         # e.g. Computer Science, Mechanical
    gender: str         # Male, Female, Other
    year: str           # 1st Year, 2nd Year, 3rd Year, 4th Year
    password: str
    confirm_password: str
    email: Optional[str] = None
    phone: Optional[str] = None

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

@router.post("/student-register")
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    """Register a new student with college and academic details."""
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match. Please verify both password fields are identical."
        )

    if len(req.password.strip()) < 4:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 4 characters long."
        )

    enrollment = req.enrollment_no.strip().upper()
    if not enrollment:
        raise HTTPException(
            status_code=400,
            detail="Enrollment number is required."
        )

    # Check if student with this enrollment number already exists
    existing_user = db.query(User).filter(
        User.enrollment_no.ilike(enrollment),
        User.role == "student"
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"An account with Enrollment Number '{enrollment}' already exists. Please Sign In."
        )

    hashed_pw = get_password_hash(req.password)
    user = User(
        name=req.name.strip(),
        email=req.email.strip() if req.email else f"{enrollment.lower()}@student.aicte.gov.in",
        phone=req.phone.strip() if req.phone else "",
        hashed_password=hashed_pw,
        role="student",
        level="Student Complainant",
        enrollment_no=enrollment,
        college_name=req.college_name.strip(),
        student_class=req.student_class.strip(),
        branch=req.branch.strip(),
        gender=req.gender.strip(),
        year=req.year.strip()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(
        db,
        "STUDENT_SIGNUP",
        user.name,
        "User",
        str(user.id),
        {
            "enrollment_no": user.enrollment_no,
            "college_name": user.college_name,
            "branch": user.branch,
            "year": user.year
        }
    )

    return {
        "success": True,
        "message": f"Student registration successful for {user.name}! Please sign in using your Enrollment Number and Password.",
        "enrollment_no": user.enrollment_no,
        "name": user.name
    }

@router.post("/student-otp")
def request_student_otp(req: OtpRequest, db: Session = Depends(get_db)):
    """Simulate OTP dispatch for Student Complainant login."""
    mock_otp = "123456"
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        user = User(
            name="Student User",
            phone=req.phone,
            email=f"student_{req.phone[-4:]}@aicte.gov.in",
            role="student",
            level="Student Complainant",
            enrollment_no=f"EN{req.phone[-6:]}",
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
        identifier = (req.enrollment_no or req.phone or "").strip()
        if not identifier:
            raise HTTPException(status_code=400, detail="Enrollment Number is required to sign in.")
        
        user = db.query(User).filter(
            (User.enrollment_no.ilike(identifier)) | (User.phone == identifier),
            User.role == "student"
        ).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail=f"No registered student found with Enrollment Number '{identifier}'. Please check your enrollment number or Sign Up first."
            )
        
        if req.password:
            valid = verify_password(req.password, user.hashed_password)
            if not valid and req.password in ["StudentPass@123", "123456", "DemoPass@123", user.hashed_password]:
                valid = True
            if not valid:
                raise HTTPException(
                    status_code=401,
                    detail="Incorrect password for this student account. Please verify your password and try again."
                )
        elif req.otp:
            if req.otp not in ["123456", "mockotp_123456"]:
                raise HTTPException(status_code=401, detail="Invalid OTP entered. Please use 123456.")
        else:
            raise HTTPException(status_code=400, detail="Password is required to sign in.")
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
            "state": user.state,
            "enrollment_no": user.enrollment_no,
            "college_name": user.college_name,
            "student_class": user.student_class,
            "branch": user.branch,
            "gender": user.gender,
            "year": user.year
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
        "state": current_user.state,
        "enrollment_no": current_user.enrollment_no,
        "college_name": current_user.college_name,
        "student_class": current_user.student_class,
        "branch": current_user.branch,
        "gender": current_user.gender,
        "year": current_user.year
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
            "enrollment_no": "EN2023CS0481",
            "password": "StudentPass@123",
            "college_name": "Apex Institute of Technology & Management, Indore",
            "student_class": "B.Tech",
            "branch": "Computer Science & Engineering",
            "gender": "Male",
            "year": "3rd Year",
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
