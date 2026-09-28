"""
SAARTHI — Deterministic Policy Engine
Evaluates hard governance rules and limits. Does not depend on frontend or ML state.
"""
from typing import Dict, Any, List
try:
    from config import MAX_AUTONOMOUS_REFUND
except ImportError:
    from ..config import MAX_AUTONOMOUS_REFUND

# Predefined consequential action definitions
CONSEQUENTIAL_ACTIONS = {
    "bank_transfer": {"risk": "HIGH", "max_limit": 0, "reversible": False},
    "customer_refund": {"risk": "MEDIUM", "max_limit": MAX_AUTONOMOUS_REFUND, "reversible": True},
    "delete_record": {"risk": "CRITICAL", "max_limit": 0, "reversible": False},
    "deploy_service": {"risk": "HIGH", "max_limit": 0, "reversible": False},
    "read_data": {"risk": "NONE", "max_limit": float("inf"), "reversible": True}
}

def evaluate_policy(action_name: str, action_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates proposed action against deterministic governance policies.
    """
    violations = []
    warnings = []
    passed_rules = []
    amount = float(action_data.get("amount", 0))

    # Rule 1: Autonomous Financial Limit
    if amount > MAX_AUTONOMOUS_REFUND:
        violations.append(
            f"Financial amount ₹{amount:,.0f} exceeds maximum autonomous limit of ₹{MAX_AUTONOMOUS_REFUND:,.0f}"
        )
    elif amount > (MAX_AUTONOMOUS_REFUND * 0.7):
        warnings.append(
            f"Financial amount ₹{amount:,.0f} approaches autonomous boundary (70%+ of ₹{MAX_AUTONOMOUS_REFUND:,.0f})"
        )
    else:
        passed_rules.append(f"Amount ₹{amount:,.0f} is within autonomous threshold (<= ₹{MAX_AUTONOMOUS_REFUND:,.0f})")

    # Rule 2: Consequential / Irreversible Action Classification
    action_key = action_name.lower().strip()
    policy_def = CONSEQUENTIAL_ACTIONS.get(action_key)
    
    if policy_def and policy_def["risk"] in ["HIGH", "CRITICAL"]:
        violations.append(
            f"Action '{action_name}' is classified as consequential ({policy_def['risk']}) requiring mandatory oversight"
        )
    elif any(w in action_key for w in ["delete", "drop", "terminate"]):
        violations.append(f"Destructive operation detected in action '{action_name}'")
    else:
        passed_rules.append(f"Action '{action_name}' permitted under standard execution scope")

    # Rule 3: Replay / Repeated Action Check
    if action_data.get("is_replay"):
        violations.append("Duplicate execution request detected for identical order transaction token (Replay Guard)")

    has_critical_violation = any("destructive" in v.lower() or "critical" in v.lower() or "replay" in v.lower() for v in violations)
    has_high_violation = len(violations) > 0 and not has_critical_violation
    policy_pass = len(violations) == 0

    return {
        "policy_pass": policy_pass,
        "has_high_violation": has_high_violation,
        "has_critical_violation": has_critical_violation,
        "violations": violations,
        "warnings": warnings,
        "passed_rules": passed_rules,
        "autonomous_threshold": MAX_AUTONOMOUS_REFUND
    }
