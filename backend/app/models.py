import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from .database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(64), primary_key=True)  # AICTE ID e.g. "AICTE-1-1029384"
    name = Column(String(255), nullable=False, index=True)
    aliases_json = Column(Text, default="[]")  # List of alternate names
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False)
    programs_json = Column(Text, default="[]")  # e.g. ["Engineering", "Management"]
    approval_status = Column(String(64), default="Approved")  # Approved, Provisional, Extension Pending, Under Review, De-affiliated
    renewal_date = Column(String(32), nullable=True)
    court_stay_flag = Column(Boolean, default=False)
    court_stay_details = Column(Text, nullable=True)
    penalties_json = Column(Text, default="[]")
    risk_score = Column(Float, default=0.0)
    risk_factors_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    complaints = relationship("Complaint", back_populates="institution", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="institution")
    conflicts = relationship("ConflictAlert", back_populates="institution")

    @property
    def aliases(self):
        try:
            return json.loads(self.aliases_json) if self.aliases_json else []
        except Exception:
            return []

    @property
    def programs(self):
        try:
            return json.loads(self.programs_json) if self.programs_json else []
        except Exception:
            return []

    @property
    def penalties(self):
        try:
            return json.loads(self.penalties_json) if self.penalties_json else []
        except Exception:
            return []

    @property
    def risk_factors(self):
        try:
            return json.loads(self.risk_factors_json) if self.risk_factors_json else {}
        except Exception:
            return {}


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=True, index=True)
    phone = Column(String(32), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False)  # student | official | admin
    level = Column(String(64), nullable=False)  # "Student Complainant", "Case Officer", "Bureau Head", "Regional Officer", "Leadership"
    bureau = Column(String(64), nullable=True)  # "Finance", "Approval", "Academic", "Examination and Quality", "Inspection Cell", "Student Welfare Cell"
    state = Column(String(64), nullable=True)  # e.g. "Madhya Pradesh"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assigned_complaints = relationship("Complaint", back_populates="assigned_officer")
    actions = relationship("Action", back_populates="created_by_user")
    notifications = relationship("Notification", back_populates="user")


class CaseGroup(Base):
    __tablename__ = "case_groups"

    id = Column(String(64), primary_key=True)  # e.g. "GRP-2025-001"
    title = Column(String(255), nullable=False)
    theme = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    institution_ids_json = Column(Text, default="[]")
    complaint_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="case_group")

    @property
    def institution_ids(self):
        try:
            return json.loads(self.institution_ids_json) if self.institution_ids_json else []
        except Exception:
            return []


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(64), primary_key=True)  # e.g. "CMP-2025-0849"
    institution_id = Column(String(64), ForeignKey("institutions.id"), nullable=False, index=True)
    complainant_name = Column(String(128), default="Anonymous")
    complainant_phone = Column(String(32), default="")
    complainant_email = Column(String(128), default="")
    is_anonymous = Column(Boolean, default=False)
    channel = Column(String(64), default="Web Portal")  # Web Portal, Voice Helpline, Mobile App, Physical Letter, Email, CPGRAMS Portal
    original_text = Column(Text, nullable=False)
    original_language = Column(String(16), default="en")  # en, hi, mr, bn, ta, te
    english_translation = Column(Text, nullable=True)
    category = Column(String(64), nullable=False, index=True)  # fee fraud, fake faculty, infrastructure, affiliation, admission irregularity, harassment/ragging, examination, approval-related
    bureau = Column(String(64), nullable=False, index=True)  # Approval, Academic, Examination and Quality, Finance, Inspection Cell, Student Welfare Cell
    process_stage = Column(String(64), default="fee refund", index=True)  # fee refund, approval renewal, inspection, admission counselling, faculty verification, exam evaluation, scholarship disbursement, anti-ragging enquiry
    priority = Column(String(32), default="Medium")  # Critical, High, Medium, Low
    severity = Column(String(32), default="Medium")  # High, Medium, Low
    status = Column(String(64), default="open", index=True)  # open, under review, awaiting institution, sub-judice, resolved, penalty imposed, withdrawn
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)
    due_date = Column(DateTime, nullable=False)
    sla_state = Column(String(32), default="Within SLA")  # Within SLA, Approaching Breach, Breached
    sla_days_overdue = Column(Integer, default=0)
    escalation_level = Column(String(64), default="None")  # None, Bureau Head, Chairman Office
    escalation_history_json = Column(Text, default="[]")
    attachments_json = Column(Text, default="[]")
    ai_summary_json = Column(Text, default="{}")
    embedding_vector_json = Column(Text, default="[]")
    case_group_id = Column(String(64), ForeignKey("case_groups.id"), nullable=True)
    ai_triage_trace_json = Column(Text, default="{}")
    official_override_json = Column(Text, nullable=True)
    feedback_rating = Column(Integer, nullable=True)
    feedback_comment = Column(Text, nullable=True)

    # Relationships
    institution = relationship("Institution", back_populates="complaints")
    assigned_officer = relationship("User", back_populates="assigned_complaints")
    case_group = relationship("CaseGroup", back_populates="complaints")
    actions = relationship("Action", back_populates="complaint", cascade="all, delete-orphan")
    referrals = relationship("Referral", back_populates="complaint", cascade="all, delete-orphan")

    @property
    def attachments(self):
        try:
            return json.loads(self.attachments_json) if self.attachments_json else []
        except Exception:
            return []

    @property
    def ai_summary(self):
        try:
            return json.loads(self.ai_summary_json) if self.ai_summary_json else {}
        except Exception:
            return {}

    @property
    def ai_triage_trace(self):
        try:
            return json.loads(self.ai_triage_trace_json) if self.ai_triage_trace_json else {}
        except Exception:
            return {}

    @property
    def official_override(self):
        try:
            return json.loads(self.official_override_json) if self.official_override_json else None
        except Exception:
            return None

    @property
    def escalation_history(self):
        try:
            return json.loads(self.escalation_history_json) if self.escalation_history_json else []
        except Exception:
            return []


class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(64), ForeignKey("complaints.id"), nullable=False, index=True)
    institution_id = Column(String(64), ForeignKey("institutions.id"), nullable=False)
    action_type = Column(String(64), nullable=False)  # show-cause, penalty, court order, inspection request, note, hearing, status_change
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    evidence_url = Column(String(255), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="actions")
    institution = relationship("Institution", back_populates="actions")
    created_by_user = relationship("User", back_populates="actions")


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(64), ForeignKey("complaints.id"), nullable=False, index=True)
    from_bureau = Column(String(64), nullable=False)
    to_bureau = Column(String(64), nullable=False)
    request_note = Column(Text, nullable=False)
    status = Column(String(32), default="pending")  # pending, responded, closed
    response_note = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

    complaint = relationship("Complaint", back_populates="referrals")


class ConflictAlert(Base):
    __tablename__ = "conflict_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    institution_id = Column(String(64), ForeignKey("institutions.id"), nullable=False, index=True)
    conflict_type = Column(String(64), nullable=False)  # renewal_with_open_fraud, opposing_bureau_directions, court_stay_active, multi_bureau_spike_60d
    severity = Column(String(32), default="High")  # Critical, High, Medium
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    bureaus_involved_json = Column(Text, default="[]")
    related_complaint_ids_json = Column(Text, default="[]")
    status = Column(String(32), default="active")  # active, acknowledged, resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="conflicts")

    @property
    def bureaus_involved(self):
        try:
            return json.loads(self.bureaus_involved_json) if self.bureaus_involved_json else []
        except Exception:
            return []

    @property
    def related_complaint_ids(self):
        try:
            return json.loads(self.related_complaint_ids_json) if self.related_complaint_ids_json else []
        except Exception:
            return []


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prev_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, unique=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(128), default="System")
    action = Column(String(64), nullable=False, index=True)  # LOGIN, FILE_COMPLAINT, OVERRIDE_AI_TRIAGE, CHANGE_STATUS, ISSUE_NOTICE, EXPORT_REPORT, VERIFY_AUDIT_TRAIL, etc.
    entity_type = Column(String(64), nullable=True)  # Complaint, Institution, User, Report, Audit
    entity_id = Column(String(64), nullable=True)
    details_json = Column(Text, default="{}")
    ip_address = Column(String(64), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    @property
    def details(self):
        try:
            return json.loads(self.details_json) if self.details_json else {}
        except Exception:
            return {}


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String(32), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(64), default="info")  # sla_breach, conflict_alert, escalation, status_change, assignment
    channel_log_json = Column(Text, default="{}")  # {in_app: true, sms: "+91...", email: "...", whatsapp: "..."}
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

    @property
    def channel_log(self):
        try:
            return json.loads(self.channel_log_json) if self.channel_log_json else {}
        except Exception:
            return {}
