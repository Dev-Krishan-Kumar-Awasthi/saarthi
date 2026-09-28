"""
SAARTHI — Governance Pipeline Coordinator
Evaluates incoming action requests through Evidence -> Policy -> ML -> Risk -> Decision.
Persists decisions and audit events to SQLite.
"""
import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from .evidence import verify_evidence
from .policy import evaluate_policy
from .ml_anomaly import ml_detector
from .risk import calculate_risk
from .decision import decision_gate, Decision

try:
    from database.repository import repo
    from audit import record_audit_event
except ImportError:
    from ..database.repository import repo
    from ..audit import record_audit_event

def evaluate_action(
    workflow_id: str,
    scenario_id: str,
    customer: str,
    order_id: str,
    action: str,
    amount: float,
    agent_claim: Dict[str, Any],
    trusted_state: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main evaluation pipeline:
    Agent Request -> Evidence Verification + Policy Engine + ML Anomaly Model -> Risk Engine -> Decision Gate
    """
    ctx = context or {}
    action_data = {"action": action, "amount": amount, **ctx}

    # 1. Evidence Verification
    verification = verify_evidence(agent_claim, trusted_state)

    # 2. Policy Engine
    policy = evaluate_policy(action, action_data)

    # 3. ML Anomaly Model
    ml_result = ml_detector.evaluate(action_data, {
        **ctx,
        "evidence_confidence": verification.get("confidence", 1.0)
    })

    # 4. Risk Engine (combines deterministic factors + ML anomaly signal)
    risk = calculate_risk(action_data, verification, policy, ml_result)

    # 5. Decision Gate (ALLOW / BLOCK / HUMAN_REVIEW / RETRY with 'Why?' explanation)
    gate = decision_gate(verification, policy, risk, ml_result, action_data)
    decision = gate["decision"]
    reason = gate["reason"]

    now = datetime.now(timezone.utc).isoformat()
    decision_id = f"DEC-{str(uuid.uuid4())[:8]}"

    # Persist Decision to SQLite
    decision_record = {
        "id": decision_id,
        "workflow_id": workflow_id,
        "action": action,
        "decision": decision.value if isinstance(decision, Decision) else str(decision),
        "reason": reason,
        "reasons": gate["reasons"],
        "risk_overall": risk["overall"],
        "risk_level": risk["level"],
        "risk_factors": risk["factors"],
        "evidence_verified": verification["verified"],
        "policy_passed": policy["policy_pass"],
        "ml_anomaly_score": ml_result.get("anomaly_score", 0),
        "ml_is_anomaly": ml_result.get("is_anomaly", False),
        "ml_explanation": ml_result.get("explanation", ""),
        "created_at": now
    }
    repo.save_decision(decision_record)

    # Determine Workflow Status
    if decision == Decision.ALLOW:
        wf_status = "COMPLETED"
        progress = 100
        current_step = "Completed — Allowed"
    elif decision == Decision.BLOCK:
        wf_status = "BLOCKED"
        progress = 60
        current_step = f"Blocked — {verification['contradictions'][0] if verification.get('contradictions') else 'Policy Violation'}"
    elif decision == Decision.HUMAN_REVIEW:
        wf_status = "PAUSED"
        progress = 75
        current_step = "Awaiting Human Review (TrustBridge)"
    else:
        wf_status = "EXECUTING"
        progress = 50
        current_step = "Retrying Evaluation"

    # Persist or update Workflow in SQLite
    wf_record = {
        "id": workflow_id,
        "scenario_id": scenario_id,
        "objective": f"{action.replace('_', ' ').title()} ₹{amount:,.0f} for {customer}",
        "customer": customer,
        "order_id": order_id,
        "amount": amount,
        "status": wf_status,
        "progress": progress,
        "current_step": current_step,
        "decision": decision.value if isinstance(decision, Decision) else str(decision),
        "decision_reason": reason,
        "risk_overall": risk["overall"],
        "risk_level": risk["level"],
        "started_at": now,
        "completed_at": now if decision == Decision.ALLOW else None,
        "payload": {
            "verification": verification,
            "policy": policy,
            "risk": risk,
            "ml_anomaly": ml_result,
            "gate": gate
        }
    }
    repo.save_workflow(wf_record)

    # Handle TrustBridge Checkpoint & Human Review if HUMAN_REVIEW
    review_record = None
    if decision == Decision.HUMAN_REVIEW:
        rev_id = f"REV-{str(uuid.uuid4())[:8]}"
        cp_id = f"CHK-{str(uuid.uuid4())[:8]}"
        
        # Save persistent checkpoint
        repo.save_checkpoint({
            "id": cp_id,
            "workflow_id": workflow_id,
            "review_id": rev_id,
            "action_name": action,
            "state": wf_record,
            "status": "PAUSED"
        })

        review_record = repo.save_human_review({
            "id": rev_id,
            "workflow_id": workflow_id,
            "customer": customer,
            "order_id": order_id,
            "amount": amount,
            "risk": risk,
            "reason": reason,
            "status": "PENDING",
            "decision": None,
            "checkpoint_id": cp_id
        })

    # Record tamper-evident SHA-256 audit events
    record_audit_event("AGENT", "ACTION_PROPOSED", {
        "workflow_id": workflow_id,
        "action": action,
        "amount": amount,
        "customer": customer
    }, workflow_id=workflow_id)

    record_audit_event("SAARTHI", "GOVERNANCE_EVALUATION", {
        "workflow_id": workflow_id,
        "decision": decision.value if isinstance(decision, Decision) else str(decision),
        "reason": reason,
        "risk": risk["overall"],
        "ml_anomaly": ml_result.get("anomaly_score", 0),
        "evidence_verified": verification["verified"],
        "policy_passed": policy["policy_pass"]
    }, workflow_id=workflow_id)

    if decision == Decision.HUMAN_REVIEW and review_record:
        record_audit_event("SAARTHI", "CHECKPOINT_CREATED", {
            "review_id": review_record["id"],
            "workflow_id": workflow_id,
            "checkpoint_id": review_record.get("checkpoint_id")
        }, workflow_id=workflow_id)

    return {
        "workflow_id": workflow_id,
        "decision": decision.value if isinstance(decision, Decision) else str(decision),
        "reason": reason,
        "reasons": gate["reasons"],
        "verification": verification,
        "policy": policy,
        "ml_anomaly": ml_result,
        "risk": risk,
        "status": wf_status,
        "review_id": review_record["id"] if review_record else None
    }
