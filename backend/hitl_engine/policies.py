from typing import Dict, Any, Tuple

CONSEQUENTIAL_ACTIONS = {
    "execute_bank_transfer": {
        "risk": "HIGH",
        "description": "Financial fund transfer irreversible execution",
        "requires_hitl": True,
    },
    "delete_customer_record": {
        "risk": "CRITICAL",
        "description": "Permanent destructive database mutation",
        "requires_hitl": True,
    },
    "deploy_production_service": {
        "risk": "HIGH",
        "description": "External production cloud infrastructure rollout",
        "requires_hitl": True,
    },
    "read_account_balance": {
        "risk": "NONE",
        "description": "Read-only ledger query",
        "requires_hitl": False,
    },
    "customer_refund": {
        "risk": "HIGH",
        "description": "Customer refund action — requires HITL if > ₹5,000",
        "requires_hitl": True,
    },
    "calculate_interest": {
        "risk": "NONE",
        "description": "Internal deterministic computation",
        "requires_hitl": False,
    }
}

def evaluate_action_policy(action_name: str, parameters: Dict[str, Any]) -> Tuple[bool, str, str]:
    """
    Returns (requires_hitl, risk_level, reason)
    """
    amount = float(parameters.get("amount", 0.0) or 0.0)
    if action_name in ["customer_refund", "process_refund", "refund"]:
        if amount > 5000.0:
            return True, "HIGH", f"Refund amount ₹{amount:,.0f} exceeds autonomous limit of ₹5,000"
        return False, "LOW", f"Refund amount ₹{amount:,.0f} within autonomous limit of ₹5,000"

    policy = CONSEQUENTIAL_ACTIONS.get(action_name)
    if not policy:
        # Default safety: any unknown write or execute tool requires human check
        if any(w in action_name.lower() for w in ["execute", "delete", "transfer", "pay", "write", "deploy"]):
            return True, "HIGH", f"Action '{action_name}' contains consequential keywords"
        return False, "LOW", "Read-only or safe internal action"

    if policy["requires_hitl"]:
        return True, policy["risk"], policy["description"]
    
    return False, policy["risk"], policy["description"]
