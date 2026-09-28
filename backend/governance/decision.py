"""
SAARTHI — Governance Decision Gate
Produces authoritative ALLOW / BLOCK / HUMAN_REVIEW / RETRY outcome with explicit 'Why?' rationale.
"""
from typing import Dict, Any, List
from enum import Enum
try:
    from config import HIGH_RISK_THRESHOLD, CRITICAL_RISK_THRESHOLD
except ImportError:
    from ..config import HIGH_RISK_THRESHOLD, CRITICAL_RISK_THRESHOLD

class Decision(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    RETRY = "RETRY"

def decision_gate(
    verification: Dict[str, Any],
    policy: Dict[str, Any],
    risk: Dict[str, Any],
    ml_result: Dict[str, Any],
    action_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates the complete governance matrix and produces:
    - decision: Decision (ALLOW | BLOCK | HUMAN_REVIEW | RETRY)
    - reason: explicit concise 'Why?' summary
    - reasons: list of contributing factor details
    """
    reasons: List[str] = []
    overall_risk = risk["overall"]

    # Invariant 1: Evidence Contradiction / Hallucination -> Immediate BLOCK
    if verification.get("has_contradiction"):
        contradicted_fields = ", ".join(verification.get("contradictions", []))
        reason = f"BLOCKED — Agent claim conflicts with trusted state ({contradicted_fields})."
        reasons.append(f"Contradiction detected in field(s): {contradicted_fields}")
        reasons.append("Premise invalidation prevents execution on false grounds (Hallucination Shield)")
        return {
            "decision": Decision.BLOCK,
            "reason": reason,
            "reasons": reasons,
            "requires_hitl": False
        }

    # Invariant 2: Critical Policy Violation or Critical Risk -> BLOCK
    if policy.get("has_critical_violation") or overall_risk >= CRITICAL_RISK_THRESHOLD:
        crit_reasons = policy.get("violations", ["Critical risk threshold breached"])
        reason = f"BLOCKED — Critical safety violation: {crit_reasons[0]}"
        reasons.extend(crit_reasons)
        if ml_result.get("is_anomaly"):
            reasons.append(f"ML Anomaly signal elevated: {ml_result.get('explanation')}")
        return {
            "decision": Decision.BLOCK,
            "reason": reason,
            "reasons": reasons,
            "requires_hitl": False
        }

    # Invariant 3: High Risk or Autonomous Policy Boundary Exceeded -> HUMAN_REVIEW (TrustBridge)
    if policy.get("has_high_violation") or overall_risk >= HIGH_RISK_THRESHOLD or verification.get("has_missing"):
        explanations = []
        if policy.get("violations"):
            explanations.append(policy["violations"][0])
        elif verification.get("has_missing"):
            explanations.append(f"Missing verification evidence: {', '.join(verification['missing'])}")
        elif overall_risk >= HIGH_RISK_THRESHOLD:
            explanations.append(f"Risk score ({overall_risk}/100) exceeds autonomous boundary")

        ml_note = ""
        if ml_result.get("is_anomaly"):
            ml_note = f"; ML anomaly is elevated ({ml_result.get('anomaly_score')}/100)"
            reasons.append(f"ML Anomaly: {ml_result.get('explanation')}")

        reason = f"HUMAN REVIEW — {explanations[0]}{ml_note}."
        reasons.extend(policy.get("violations", []))
        if verification.get("has_missing"):
            reasons.append(f"Awaiting evidence for: {', '.join(verification['missing'])}")
        reasons.append(f"Checkpoint state preserved for human operator approval or adjustment")
        
        return {
            "decision": Decision.HUMAN_REVIEW,
            "reason": reason,
            "reasons": reasons,
            "requires_hitl": True
        }

    # Invariant 4: Retry condition (e.g. transient network or flaky upstream)
    if action_data.get("is_transient_error"):
        reason = "RETRY — Transient operational condition detected; safe to re-evaluate."
        reasons.append("Temporary failure condition amenable to backoff retry")
        return {
            "decision": Decision.RETRY,
            "reason": reason,
            "reasons": reasons,
            "requires_hitl": False
        }

    # Invariant 5: Safe Autonomous Approval -> ALLOW
    ml_msg = "ML anomaly is low" if ml_result.get("anomaly_score", 0) < 50 else f"ML anomaly is {ml_result.get('anomaly_score')}/100"
    reason = f"ALLOW — Evidence verified; policy compliant; risk score ({overall_risk}/100) within boundary; {ml_msg}."
    reasons.append("All claims verified against trusted system state")
    reasons.append("Zero policy violations detected")
    reasons.append(f"Risk score {overall_risk}/100 is approved for autonomous execution")
    
    return {
        "decision": Decision.ALLOW,
        "reason": reason,
        "reasons": reasons,
        "requires_hitl": False
    }
