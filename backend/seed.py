"""
SAARTHI — Initial SQLite Baseline Seed
Populates clean baseline records if SQLite database is empty on startup.
Ensures backend is the sole source of truth from first launch.
"""
from datetime import datetime, timezone, timedelta

try:
    from database.repository import repo
    from audit import record_audit_event
except ImportError:
    from .database.repository import repo
    from .audit import record_audit_event

def seed_initial_state():
    """Seeds baseline records into SQLite if no workflows exist."""
    existing = repo.list_workflows(limit=1)
    if existing:
        return  # Database already contains data; do not overwrite

    now = datetime.now(timezone.utc)
    t1 = (now - timedelta(hours=3)).isoformat()
    t2 = (now - timedelta(hours=2)).isoformat()
    t3 = (now - timedelta(hours=1)).isoformat()

    # 1. Safe Action (ALLOW)
    wf1 = {
        "id": "wf-1041",
        "scenario_id": "safe_action",
        "objective": "Customer Refund ₹1,800 for Priya Verma",
        "customer": "Priya Verma",
        "order_id": "ORD-28391",
        "amount": 1800.0,
        "status": "COMPLETED",
        "progress": 100,
        "current_step": "Completed — Allowed",
        "decision": "ALLOW",
        "decision_reason": "ALLOW — Evidence verified; policy compliant; risk score (22/100) within boundary; ML anomaly is low.",
        "risk_overall": 22,
        "risk_level": "LOW",
        "started_at": t1,
        "completed_at": t1,
        "payload": {
            "action": "customer_refund",
            "evidence": {"verified": True, "contradictions": []},
            "policy": {"policy_pass": True, "violations": []},
            "ml_anomaly": {"anomaly_score": 12, "is_anomaly": False, "explanation": "Conforms to historical baseline"}
        }
    }
    repo.save_workflow(wf1)
    repo.save_decision({
        "id": "DEC-1041",
        "workflow_id": "wf-1041",
        "action": "customer_refund",
        "decision": "ALLOW",
        "reason": wf1["decision_reason"],
        "reasons": ["Evidence verified", "Policy compliant", "Risk score within limit"],
        "risk_overall": 22,
        "risk_level": "LOW",
        "risk_factors": {"financial_impact": 20, "policy_severity": 10, "evidence_deficit": 5, "irreversibility": 35, "ml_anomaly_score": 12},
        "evidence_verified": True,
        "policy_passed": True,
        "ml_anomaly_score": 12,
        "ml_is_anomaly": False,
        "ml_explanation": "Conforms to historical baseline",
        "created_at": t1
    })

    # 2. Evidence Mismatch (BLOCK)
    wf2 = {
        "id": "wf-1042",
        "scenario_id": "evidence_mismatch",
        "objective": "Customer Refund ₹6,000 for Amit Joshi",
        "customer": "Amit Joshi",
        "order_id": "ORD-39201",
        "amount": 6000.0,
        "status": "BLOCKED",
        "progress": 60,
        "current_step": "Blocked — wallet_balance contradiction (claimed ₹15,000 vs trusted ₹10,000)",
        "decision": "BLOCK",
        "decision_reason": "BLOCKED — Agent claim conflicts with trusted state (wallet_balance: claimed ₹15,000 vs trusted ₹10,000).",
        "risk_overall": 88,
        "risk_level": "CRITICAL",
        "started_at": t2,
        "completed_at": t2,
        "payload": {
            "action": "customer_refund",
            "evidence": {"verified": False, "contradictions": ["wallet_balance"]},
            "policy": {"policy_pass": False, "violations": ["Amount exceeds autonomous limit"]},
            "ml_anomaly": {"anomaly_score": 68, "is_anomaly": True, "explanation": "Behavioral deviation"}
        }
    }
    repo.save_workflow(wf2)
    repo.save_decision({
        "id": "DEC-1042",
        "workflow_id": "wf-1042",
        "action": "customer_refund",
        "decision": "BLOCK",
        "reason": wf2["decision_reason"],
        "reasons": ["Contradiction detected in wallet_balance", "Hallucination Shield triggered"],
        "risk_overall": 88,
        "risk_level": "CRITICAL",
        "risk_factors": {"financial_impact": 70, "policy_severity": 80, "evidence_deficit": 95, "irreversibility": 35, "ml_anomaly_score": 68},
        "evidence_verified": False,
        "policy_passed": False,
        "ml_anomaly_score": 68,
        "ml_is_anomaly": True,
        "ml_explanation": "Behavioral deviation",
        "created_at": t2
    })

    # 3. High Impact Action (HUMAN_REVIEW Checkpoint)
    wf3 = {
        "id": "wf-1043",
        "scenario_id": "high_impact",
        "objective": "High-Value Refund ₹8,500 for Rahul Sharma",
        "customer": "Rahul Sharma",
        "order_id": "ORD-48291",
        "amount": 8500.0,
        "status": "PAUSED",
        "progress": 75,
        "current_step": "Awaiting Human Review (TrustBridge)",
        "decision": "HUMAN_REVIEW",
        "decision_reason": "HUMAN REVIEW — Financial amount ₹8,500 exceeds maximum autonomous limit of ₹5,000; ML anomaly is elevated (72/100).",
        "risk_overall": 84,
        "risk_level": "HIGH",
        "started_at": t3,
        "completed_at": None,
        "payload": {
            "action": "customer_refund",
            "evidence": {"verified": True, "contradictions": []},
            "policy": {"policy_pass": False, "violations": ["Financial amount ₹8,500 exceeds maximum autonomous limit of ₹5,000"]},
            "ml_anomaly": {"anomaly_score": 72, "is_anomaly": True, "explanation": "Financial amount significantly exceeds normal training distribution"}
        }
    }
    repo.save_workflow(wf3)
    repo.save_decision({
        "id": "DEC-1043",
        "workflow_id": "wf-1043",
        "action": "customer_refund",
        "decision": "HUMAN_REVIEW",
        "reason": wf3["decision_reason"],
        "reasons": ["Financial amount exceeds limit", "ML anomaly elevated"],
        "risk_overall": 84,
        "risk_level": "HIGH",
        "risk_factors": {"financial_impact": 85, "policy_severity": 80, "evidence_deficit": 10, "irreversibility": 35, "ml_anomaly_score": 72},
        "evidence_verified": True,
        "policy_passed": False,
        "ml_anomaly_score": 72,
        "ml_is_anomaly": True,
        "ml_explanation": "Financial amount significantly exceeds normal training distribution",
        "created_at": t3
    })

    # Save Checkpoint & Review for wf3
    repo.save_checkpoint({
        "id": "CHK-1043",
        "workflow_id": "wf-1043",
        "review_id": "REV-1043",
        "action_name": "customer_refund",
        "state": wf3,
        "status": "PAUSED"
    })
    repo.save_human_review({
        "id": "REV-1043",
        "workflow_id": "wf-1043",
        "customer": "Rahul Sharma",
        "order_id": "ORD-48291",
        "amount": 8500.0,
        "risk": {"overall": 84, "level": "HIGH"},
        "reason": wf3["decision_reason"],
        "status": "PENDING",
        "decision": None,
        "checkpoint_id": "CHK-1043"
    })

    # Seed Cryptographic Audit Trail
    record_audit_event("AGENT", "ACTION_PROPOSED", {"workflow_id": "wf-1041", "amount": 1800, "customer": "Priya Verma"}, "wf-1041")
    record_audit_event("SAARTHI", "GOVERNANCE_EVALUATION", {"workflow_id": "wf-1041", "decision": "ALLOW", "risk": 22}, "wf-1041")
    record_audit_event("AGENT", "ACTION_PROPOSED", {"workflow_id": "wf-1042", "amount": 6000, "customer": "Amit Joshi"}, "wf-1042")
    record_audit_event("SAARTHI", "GOVERNANCE_EVALUATION", {"workflow_id": "wf-1042", "decision": "BLOCK", "risk": 88}, "wf-1042")
    record_audit_event("AGENT", "ACTION_PROPOSED", {"workflow_id": "wf-1043", "amount": 8500, "customer": "Rahul Sharma"}, "wf-1043")
    record_audit_event("SAARTHI", "CHECKPOINT_CREATED", {"workflow_id": "wf-1043", "checkpoint_id": "CHK-1043", "review_id": "REV-1043"}, "wf-1043")
