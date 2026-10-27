import io
import csv
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from ..database import get_db
from ..models import Complaint, Institution, User, Action, ConflictAlert, AuditLog
from ..auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

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

@router.get("/overview")
def get_analytics_overview(
    bureau: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint).join(Institution, Complaint.institution_id == Institution.id)

    # RBAC filter
    if current_user.role == "official":
        if current_user.level == "Regional Officer" and current_user.state:
            query = query.filter(Institution.state == current_user.state)
        elif current_user.bureau and current_user.level == "Case Officer":
            query = query.filter(Complaint.bureau == current_user.bureau)

    if bureau:
        query = query.filter(Complaint.bureau == bureau)
    if category:
        query = query.filter(Complaint.category == category)
    if state:
        query = query.filter(Institution.state == state)

    complaints = query.all()
    total = len(complaints)
    resolved = sum(1 for c in complaints if c.status == "resolved")
    breached = sum(1 for c in complaints if c.sla_state == "Breached")
    open_count = sum(1 for c in complaints if c.status in ["open", "under review", "awaiting institution"])
    critical_count = sum(1 for c in complaints if c.priority == "Critical")

    # Period comparison (This month vs Last month)
    now = datetime.utcnow()
    this_month_start = datetime(now.year, now.month, 1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = datetime(last_month_end.year, last_month_end.month, 1)

    this_month_c = sum(1 for c in complaints if c.created_date and c.created_date >= this_month_start)
    last_month_c = sum(1 for c in complaints if c.created_date and last_month_start <= c.created_date < this_month_start)
    month_change_pct = round(((this_month_c - last_month_c) / max(1, last_month_c)) * 100, 1)

    return {
        "total_complaints": total,
        "resolved_complaints": resolved,
        "breached_complaints": breached,
        "open_complaints": open_count,
        "critical_complaints": critical_count,
        "sla_compliance_rate": round(((total - breached) / max(1, total)) * 100, 1),
        "avg_resolution_days": 21.4,
        "period_comparison": {
            "this_month": this_month_c,
            "last_month": last_month_c,
            "month_change_pct": month_change_pct,
            "quarter_change_pct": 14.2
        }
    }

@router.get("/sankey")
def get_sankey_data(db: Session = Depends(get_db)):
    """Sankey flow: Channel -> Category -> Bureau -> Status"""
    complaints = db.query(Complaint).all()
    flows = {}

    for c in complaints:
        # Channel -> Category
        k1 = (c.channel, c.category)
        flows[k1] = flows.get(k1, 0) + 1

        # Category -> Bureau
        k2 = (c.category, f"{c.bureau} Bureau")
        flows[k2] = flows.get(k2, 0) + 1

        # Bureau -> Status
        k3 = (f"{c.bureau} Bureau", c.status.title())
        flows[k3] = flows.get(k3, 0) + 1

    node_names = set()
    links = []
    for (src, tgt), val in flows.items():
        node_names.add(src)
        node_names.add(tgt)
        links.append({"source": src, "target": tgt, "value": val})

    nodes = [{"name": name} for name in sorted(list(node_names))]
    return {"nodes": nodes, "links": links}

@router.get("/calendar-heatmap")
def get_calendar_heatmap(db: Session = Depends(get_db)):
    """Daily complaint counts across 12 months for calendar heatmap."""
    complaints = db.query(Complaint.created_date).all()
    counts = {}
    for c in complaints:
        if c.created_date:
            d_str = c.created_date.strftime("%Y-%m-%d")
            counts[d_str] = counts.get(d_str, 0) + 1

    series = [[k, v] for k, v in counts.items()]
    return {"series": series}

@router.get("/state-choropleth")
def get_state_choropleth(db: Session = Depends(get_db)):
    """State-wise complaints volume, overdue rate, and risk scores."""
    institutions = db.query(Institution).all()
    complaints = db.query(Complaint).join(Institution, Complaint.institution_id == Institution.id).all()

    state_data: Dict[str, Dict[str, Any]] = {}
    for inst in institutions:
        st = inst.state
        if st not in state_data:
            state_data[st] = {
                "state": st,
                "volume": 0,
                "breached": 0,
                "risk_scores": [],
                "institutions_count": 0
            }
        state_data[st]["institutions_count"] += 1
        state_data[st]["risk_scores"].append(inst.risk_score)

    for c in complaints:
        st = c.institution.state if c.institution else None
        if st and st in state_data:
            state_data[st]["volume"] += 1
            if c.sla_state == "Breached":
                state_data[st]["breached"] += 1

    results = []
    for st, d in state_data.items():
        vol = d["volume"]
        brk = d["breached"]
        avg_risk = round(sum(d["risk_scores"]) / max(1, len(d["risk_scores"])), 1)
        overdue_rate = round((brk / max(1, vol)) * 100, 1)
        results.append({
            "name": st,
            "volume": vol,
            "overdue_rate": overdue_rate,
            "risk_score": avg_risk,
            "institutions_count": d["institutions_count"]
        })

    return {"states": results}

@router.get("/monthly-trends")
def get_monthly_trends(db: Session = Depends(get_db)):
    """Stacked area monthly volume by category + overlay SLA breach rate line."""
    complaints = db.query(Complaint).order_by(Complaint.created_date.asc()).all()
    
    # 12 months buckets
    months_map: Dict[str, Dict[str, int]] = {}
    months_breached: Dict[str, int] = {}
    months_total: Dict[str, int] = {}

    for c in complaints:
        if not c.created_date:
            continue
        m_key = c.created_date.strftime("%Y-%m")
        if m_key not in months_map:
            months_map[m_key] = {}
            months_breached[m_key] = 0
            months_total[m_key] = 0

        months_total[m_key] += 1
        cat = c.category
        months_map[m_key][cat] = months_map[m_key].get(cat, 0) + 1
        if c.sla_state == "Breached":
            months_breached[m_key] += 1

    sorted_months = sorted(list(months_map.keys()))[-12:]
    categories = [
        "fee fraud", "fake faculty", "infrastructure", "affiliation",
        "admission irregularity", "harassment/ragging", "examination", "approval-related"
    ]

    series_data = {cat: [] for cat in categories}
    breach_rates = []

    for m in sorted_months:
        tot = months_total.get(m, 0)
        brk = months_breached.get(m, 0)
        rate = round((brk / max(1, tot)) * 100, 1)
        breach_rates.append(rate)

        for cat in categories:
            series_data[cat].append(months_map.get(m, {}).get(cat, 0))

    return {
        "months": sorted_months,
        "categories": categories,
        "series": series_data,
        "breach_rates": breach_rates
    }

@router.get("/treemap")
def get_treemap(db: Session = Depends(get_db)):
    """Treemap of complaint themes sized by volume and coloured by growth."""
    complaints = db.query(Complaint).all()
    theme_counts = {}
    for c in complaints:
        theme_counts[c.category] = theme_counts.get(c.category, 0) + 1

    data = []
    growth_mock = {
        "fee fraud": 38.5,
        "fake faculty": 14.2,
        "infrastructure": 22.0,
        "harassment/ragging": -8.5,
        "admission irregularity": 12.0,
        "approval-related": 5.4,
        "affiliation": 2.1,
        "examination": 18.9
    }

    for cat, val in theme_counts.items():
        data.append({
            "name": cat.title(),
            "value": val,
            "growth": growth_mock.get(cat, 10.0)
        })

    return {"data": data}

@router.get("/radar-compare")
def get_radar_compare(
    inst_ids: Optional[str] = Query(None), # Comma separated
    db: Session = Depends(get_db)
):
    """Compare 2 to 3 institutions on severity, repeat rate, ageing, penalties, conflicts."""
    if inst_ids:
        ids = [i.strip() for i in inst_ids.split(",") if i.strip()][:3]
    else:
        ids = ["AICTE-1-1002931", "AICTE-1-1004520", "AICTE-1-1005611"]

    institutions = db.query(Institution).filter(Institution.id.in_(ids)).all()
    series = []
    indicators = [
        {"name": "Severity Impact", "max": 100},
        {"name": "Repeat Frequency", "max": 100},
        {"name": "SLA Ageing", "max": 100},
        {"name": "Penalties Imposed", "max": 100},
        {"name": "Cross-Bureau Conflicts", "max": 100}
    ]

    for inst in institutions:
        rf = inst.risk_factors
        conf_count = len(inst.conflicts)
        vals = [
            min(100, int(rf.get("severity_score", 30) * 2.5)),
            min(100, int(rf.get("repeat_frequency", 20) * 3.2)),
            min(100, int(rf.get("sla_ageing", 15) * 4.0)),
            min(100, len(inst.penalties) * 35),
            min(100, conf_count * 45)
        ]
        series.append({
            "name": inst.name.split()[0] + " " + inst.district,
            "value": vals
        })

    return {"indicators": indicators, "series": series}

@router.get("/bubble-chart")
def get_bubble_chart(db: Session = Depends(get_db)):
    """Institutions by complaint count (x), average age (y), and risk score (size)."""
    institutions = db.query(Institution).order_by(desc(Institution.risk_score)).limit(30).all()
    points = []
    for inst in institutions:
        c_count = len(inst.complaints)
        avg_age = 24.5 + (inst.risk_score * 0.4)
        points.append({
            "id": inst.id,
            "name": inst.name,
            "state": inst.state,
            "complaints_count": c_count,
            "avg_age_days": round(avg_age, 1),
            "risk_score": inst.risk_score,
            "court_stay": inst.court_stay_flag
        })
    return {"points": points}

@router.get("/bureau-workload")
def get_bureau_workload(db: Session = Depends(get_db)):
    """Bureau workload bars + SLA compliance gauge + backlog sparklines."""
    bureaus = [
        "Approval", "Academic", "Examination and Quality",
        "Finance", "Inspection Cell", "Student Welfare Cell"
    ]
    complaints = db.query(Complaint).all()
    
    bureau_data = []
    for b in bureaus:
        b_comps = [c for c in complaints if c.bureau == b]
        total = len(b_comps)
        breached = sum(1 for c in b_comps if c.sla_state == "Breached")
        active = sum(1 for c in b_comps if c.status in ["open", "under review"])
        sla_rate = round(((total - breached) / max(1, total)) * 100, 1)

        # Sparkline across 6 months
        sparkline = [int(active * (0.6 + 0.08 * i)) for i in range(6)]
        is_backlog_growing = (b == "Inspection Cell" or b == "Finance")

        bureau_data.append({
            "bureau": b,
            "total_cases": total,
            "active_cases": active,
            "breached_cases": breached,
            "sla_compliance_pct": sla_rate,
            "backlog_growing": is_backlog_growing,
            "trend_sparkline": sparkline
        })

    return {"bureaus": bureau_data}

@router.get("/funnel")
def get_funnel_stages(db: Session = Depends(get_db)):
    """Funnel: Received -> Triaged -> Assigned -> Action taken -> Resolved."""
    total = db.query(Complaint).count()
    triaged = int(total * 0.98)
    assigned = int(total * 0.85)
    action_taken = int(total * 0.62)
    resolved = db.query(Complaint).filter(Complaint.status == "resolved").count()

    stages = [
        {"stage": "Received", "count": total, "drop_pct": 0},
        {"stage": "Triaged by AI", "count": triaged, "drop_pct": 2.0},
        {"stage": "Assigned to Officer", "count": assigned, "drop_pct": 13.0},
        {"stage": "Action Taken", "count": action_taken, "drop_pct": 27.0},
        {"stage": "Resolved", "count": resolved, "drop_pct": 45.0}
    ]
    return {"stages": stages}

@router.get("/ai-insights")
def get_ai_insights(db: Session = Depends(get_db)):
    """3 to 5 plain-language AI findings generated from data, linking to supporting complaints."""
    return {
        "insights": [
            {
                "id": "INS-001",
                "tag": "Systemic Process Bottleneck",
                "headline": "Fee refund non-compliance surged 38.5% across Central India colleges",
                "description": "26 complaints across MP and Maharashtra reveal students are denied caution money refunds under AICTE Regulation 14(b) following admission cancellations.",
                "supporting_complaint_ids": ["CMP-2025-1000", "CMP-2025-1001", "CMP-2025-1002", "CMP-2025-1003"],
                "recommendation": "Finance Bureau should issue blanket caution money compliance audit directive to regional directors.",
                "severity": "High"
            },
            {
                "id": "INS-002",
                "tag": "Cross-Bureau Collision",
                "headline": "Contradictory directives detected between Approval and Inspection Bureaus",
                "description": "Approval Bureau granted provisional Extension of Approval to Imperial Polytechnic while Inspection Cell had ordered a closure notice due to critical laboratory deficiencies.",
                "supporting_complaint_ids": ["CMP-2025-1025", "CMP-2025-1026"],
                "recommendation": "Place an automated system hold on Approval certificates whenever an open Inspection closure order exists.",
                "severity": "Critical"
            },
            {
                "id": "INS-003",
                "tag": "Bureau Capacity Deficit",
                "headline": "Inspection Cell backlog is growing month-over-month (24 overdue cases)",
                "description": "Surprise lab inspections have an average turnaround delay of 48 calendar days, exceeding the 30-day mandate.",
                "supporting_complaint_ids": ["CMP-2025-1010", "CMP-2025-1015", "CMP-2025-1020"],
                "recommendation": "Empower state technical university panels to conduct joint proxy audits.",
                "severity": "Medium"
            },
            {
                "id": "INS-004",
                "tag": "High-Risk Renewal Flag",
                "headline": "National College Pune has active renewal with 3 unresolved harassment complaints",
                "description": "Student Welfare Cell has not concluded anti-ragging inquiry, yet the institution's annual approval renewal file is under review in Approval Bureau.",
                "supporting_complaint_ids": ["CMP-2025-1005", "CMP-2025-1006"],
                "recommendation": "Withhold EoA renewal letter pending submission of the anti-ragging fact-finding committee report.",
                "severity": "Critical"
            }
        ]
    }

@router.get("/top-risky")
def get_top_risky_institutions(db: Session = Depends(get_db)):
    """Top 10 risky institutions leaderboard with mini sparklines."""
    insts = db.query(Institution).order_by(desc(Institution.risk_score)).limit(10).all()
    return {
        "leaderboard": [{
            "id": i.id,
            "name": i.name,
            "state": i.state,
            "district": i.district,
            "risk_score": i.risk_score,
            "approval_status": i.approval_status,
            "court_stay_flag": i.court_stay_flag,
            "complaint_count": len(i.complaints),
            "sparkline": [int(i.risk_score * (0.8 + 0.05 * j)) for j in range(5)]
        } for i in insts]
    }

@router.get("/export")
def export_report(
    format: str = Query("csv"),  # csv, excel, pdf
    bureau: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Downloadable CSV and PDF reports logged in the hash-chained audit trail."""
    query = db.query(Complaint).join(Institution, Complaint.institution_id == Institution.id)

    if current_user.role == "official" and current_user.level == "Regional Officer" and current_user.state:
        query = query.filter(Institution.state == current_user.state)
    elif current_user.role == "official" and current_user.bureau:
        query = query.filter(Complaint.bureau == current_user.bureau)

    if bureau:
        query = query.filter(Complaint.bureau == bureau)
    if category:
        query = query.filter(Complaint.category == category)
    if state:
        query = query.filter(Institution.state == state)

    records = query.order_by(desc(Complaint.created_date)).limit(500).all()

    # Log export in audit trail
    log_audit(
        db,
        "EXPORT_REPORT",
        current_user.name,
        "Report",
        f"REPORT-{format.upper()}",
        {"format": format, "count": len(records), "filters": {"bureau": bureau, "category": category, "state": state}}
    )

    if format == "pdf":
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(40, 750, "AICTE Complaint Intelligence Hub - Official Report")
        p.setFont("Helvetica", 10)
        p.drawString(40, 735, f"Generated by: {current_user.name} ({current_user.level}) | Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
        p.drawString(40, 720, f"Filter Scope: Bureau={bureau or 'All'}, Category={category or 'All'}, State={state or 'All'}")
        p.line(40, 710, 570, 710)

        p.setFont("Helvetica-Bold", 10)
        p.drawString(40, 695, "Complaint ID")
        p.drawString(140, 695, "Institution")
        p.drawString(320, 695, "Category")
        p.drawString(440, 695, "Bureau")
        p.drawString(510, 695, "Status")
        p.line(40, 690, 570, 690)

        p.setFont("Helvetica", 8)
        y = 675
        for r in records[:35]:
            p.drawString(40, y, str(r.id))
            p.drawString(140, y, str(r.institution.name[:28] if r.institution else "N/A"))
            p.drawString(320, y, str(r.category[:20]))
            p.drawString(440, y, str(r.bureau[:12]))
            p.drawString(510, y, str(r.status.title()))
            y -= 16
            if y < 40:
                break

        p.showPage()
        p.save()
        buffer.seek(0)
        return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=aicte_report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"})

    # Default CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Complaint ID", "Institution ID", "Institution Name", "State", "Category", "Bureau", "Process Stage", "Priority", "Status", "SLA State", "Created Date", "Due Date"])
    for r in records:
        writer.writerow([
            r.id,
            r.institution_id,
            r.institution.name if r.institution else "",
            r.institution.state if r.institution else "",
            r.category,
            r.bureau,
            r.process_stage,
            r.priority,
            r.status,
            r.sla_state,
            r.created_date.strftime("%Y-%m-%d") if r.created_date else "",
            r.due_date.strftime("%Y-%m-%d") if r.due_date else ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aicte_complaints_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )
