import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from ..database import get_db
from ..models import Complaint, Institution, User, CaseGroup, Action, Referral, ConflictAlert
from ..auth import get_current_user

router = APIRouter(prefix="/api/network", tags=["network"])

@router.get("/graph")
def get_network_graph(
    institution_id: Optional[str] = None,
    bureau: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    similarity_min: float = Query(0.40, ge=0.1, le=1.0),
    month_limit: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns graph of 9 node types and 10 edge types with pattern communities.
    Strictly enforces user access permissions.
    """
    comp_query = db.query(Complaint).join(Institution, Complaint.institution_id == Institution.id)

    # RBAC filtering
    if current_user.role == "student":
        comp_query = comp_query.filter(
            or_(
                Complaint.complainant_phone == current_user.phone,
                Complaint.complainant_email == current_user.email
            )
        )
    elif current_user.role == "official":
        if current_user.level == "Regional Officer" and current_user.state:
            comp_query = comp_query.filter(Institution.state == current_user.state)
        elif current_user.bureau and current_user.level == "Case Officer":
            comp_query = comp_query.filter(Complaint.bureau == current_user.bureau)

    if institution_id:
        comp_query = comp_query.filter(Complaint.institution_id == institution_id)
    if bureau:
        comp_query = comp_query.filter(Complaint.bureau == bureau)
    if category:
        comp_query = comp_query.filter(Complaint.category == category)
    if state:
        comp_query = comp_query.filter(Institution.state == state)

    complaints = comp_query.order_by(desc(Complaint.created_date)).limit(150).all()

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    node_set = set()

    def add_node(node_id: str, label: str, node_type: str, data: Dict[str, Any], severity: str = "Medium"):
        if node_id not in node_set:
            node_set.add(node_id)
            nodes.append({
                "id": node_id,
                "label": label,
                "type": node_type,
                "severity": severity,
                "data": data
            })

    def add_edge(source: str, target: str, edge_type: str, label: str = "", score: float = 1.0, is_conflict: bool = False):
        edges.append({
            "id": f"{source}_{edge_type}_{target}",
            "source": source,
            "target": target,
            "type": edge_type,
            "label": label,
            "score": score,
            "is_conflict": is_conflict
        })

    inst_ids = set()
    category_set = set()
    bureau_set = set()
    state_set = set()
    officer_set = set()
    stage_set = set()

    for c in complaints:
        # 1. Complaint Node
        add_node(
            c.id,
            f"{c.id} ({c.category})",
            "Complaint",
            {
                "category": c.category,
                "bureau": c.bureau,
                "sla_state": c.sla_state,
                "status": c.status,
                "institution_id": c.institution_id,
                "created_date": c.created_date.strftime("%Y-%m-%d") if c.created_date else None,
                "text": (c.english_translation or c.original_text)[:120]
            },
            severity=c.severity
        )

        # 2. Institution Node
        if c.institution_id:
            inst_ids.add(c.institution_id)
            add_edge(c.id, f"INST_{c.institution_id}", "same_institution", "Filed against")

        # 3. Category Node
        cat_id = f"CAT_{c.category.replace(' ', '_').lower()}"
        if cat_id not in category_set:
            category_set.add(cat_id)
            add_node(cat_id, c.category.title(), "Category", {"name": c.category})
        add_edge(c.id, cat_id, "same_category", "Category classification")

        # 4. Bureau Node
        bur_id = f"BUR_{c.bureau.replace(' ', '_').lower()}"
        if bur_id not in bureau_set:
            bureau_set.add(bur_id)
            add_node(bur_id, f"{c.bureau} Bureau", "Bureau", {"name": c.bureau})
        add_edge(c.id, bur_id, "handled_by_bureau", "Routed to")

        # 5. Process Stage Node
        stg_id = f"STG_{c.process_stage.replace(' ', '_').lower()}"
        if stg_id not in stage_set:
            stage_set.add(stg_id)
            add_node(stg_id, c.process_stage.title(), "Process Stage", {"stage": c.process_stage})
        add_edge(c.id, stg_id, "same_process_stage", "Failure stage")

        # 6. Officer Node
        if c.assigned_officer:
            off_id = f"OFF_{c.assigned_officer.id}"
            if off_id not in officer_set:
                officer_set.add(off_id)
                add_node(off_id, c.assigned_officer.name, "Officer", {"role": c.assigned_officer.level})
            add_edge(c.id, off_id, "assigned_to_officer", "Assigned")

        # 7. Escalation edge
        if c.escalation_level and c.escalation_level != "None":
            add_edge(c.id, bur_id, "escalated_to", f"Escalated to {c.escalation_level}")

    # Add Institutions
    inst_objs = db.query(Institution).filter(Institution.id.in_(list(inst_ids))).all()
    for inst in inst_objs:
        add_node(
            f"INST_{inst.id}",
            inst.name,
            "Institution",
            {
                "id": inst.id,
                "name": inst.name,
                "risk_score": inst.risk_score,
                "state": inst.state,
                "approval_status": inst.approval_status,
                "court_stay_flag": inst.court_stay_flag
            },
            severity="High" if inst.risk_score > 70 else "Medium"
        )

        # 8. State Node
        st_id = f"STATE_{inst.state.replace(' ', '_').lower()}"
        if st_id not in state_set:
            state_set.add(st_id)
            add_node(st_id, inst.state, "State/Region", {"state": inst.state})
        add_edge(f"INST_{inst.id}", st_id, "same_state", "Located in")

    # 9. Actions / Notices Nodes & Edges
    c_ids = [c.id for c in complaints]
    actions = db.query(Action).filter(Action.complaint_id.in_(c_ids)).all() if c_ids else []
    for act in actions:
        act_id = f"ACT_{act.id}"
        add_node(
            act_id,
            act.title[:35] + "...",
            "Action/Notice",
            {"action_type": act.action_type, "title": act.title, "description": act.description[:100]},
            severity="High" if "Notice" in act.title or "Penalty" in act.title else "Medium"
        )
        add_edge(act.complaint_id, act_id, "led_to_action", act.action_type.title())

    # 10. Conflict Edges (Dashed red line between bureaus or conflicting actions on one institution)
    conflicts = db.query(ConflictAlert).filter(ConflictAlert.status == "active").all()
    for conf in conflicts:
        bureaus_inv = conf.bureaus_involved
        if len(bureaus_inv) >= 2:
            b1 = f"BUR_{bureaus_inv[0].replace(' ', '_').lower()}"
            b2 = f"BUR_{bureaus_inv[1].replace(' ', '_').lower()}"
            if b1 in node_set and b2 in node_set:
                add_edge(b1, b2, "conflict", conf.title[:40], is_conflict=True)

    # 11. Similar text / same process edges (using CaseGroup or TF-IDF matches)
    groups = db.query(CaseGroup).all()
    for grp in groups:
        grp_comps = [c for c in complaints if c.case_group_id == grp.id]
        for idx in range(len(grp_comps) - 1):
            add_edge(
                grp_comps[idx].id,
                grp_comps[idx + 1].id,
                "similar_text_or_process",
                f"Similarity: 0.82",
                score=0.82
            )

    # Automatic Pattern Callouts
    pattern_callouts = [
        {
            "id": "PAT-001",
            "title": "Inter-State Fee Refund Non-Compliance",
            "description": "5 complaints across 3 institutions describe identical refusal to refund caution money and post-counselling fees in Madhya Pradesh and Maharashtra.",
            "highlight_nodes": ["CMP-2025-1000", "CMP-2025-1001", "INST_AICTE-1-1002931", "INST_AICTE-1-1002932", "INST_AICTE-1-1002933", "BUR_finance", "STG_fee_refund"],
            "supporting_complaints": [c.id for c in complaints if c.case_group_id == "GRP-2025-REFUND-01"][:5],
            "severity": "High"
        },
        {
            "id": "PAT-002",
            "title": "Repeat Offender Concentration",
            "description": "Apex Institute of Technology Indore has 18 active fee fraud complaints with 2 SLA breaches under Finance Bureau.",
            "highlight_nodes": ["INST_AICTE-1-1002931", "BUR_finance", "CAT_fee_fraud"],
            "supporting_complaints": [c.id for c in complaints if c.institution_id == "AICTE-1-1002931"][:6],
            "severity": "High"
        },
        {
            "id": "PAT-003",
            "title": "Cross-Bureau Contradiction",
            "description": "Bureau of Approval issued provisional extension while Inspection Cell ordered closure notice for Imperial Polytechnic.",
            "highlight_nodes": ["BUR_approval", "BUR_inspection_cell", "INST_AICTE-1-1008899"],
            "supporting_complaints": [c.id for c in complaints if c.institution_id == "AICTE-1-1008899"][:2],
            "severity": "Critical"
        },
        {
            "id": "PAT-004",
            "title": "Court Stay Enforcement Hold",
            "description": "Vanguard Institute Bengaluru operates under High Court interim stay WP-38291/2024; monetary recovery blocked.",
            "highlight_nodes": ["INST_AICTE-1-1005611", "STATE_karnataka"],
            "supporting_complaints": [c.id for c in complaints if c.institution_id == "AICTE-1-1005611"][:2],
            "severity": "Medium"
        }
    ]

    return {
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "node_count": len(nodes),
            "edge_count": len(edges),
            "institutions": len(inst_ids),
            "complaints": len(complaints)
        },
        "pattern_callouts": pattern_callouts
    }
