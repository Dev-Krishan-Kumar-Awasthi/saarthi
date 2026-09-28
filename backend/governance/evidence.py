"""
SAARTHI — Evidence Verification Engine
Validates agent claims against authoritative trusted state.
Determines whether the agent's premises are accurate, contradicted, or missing.
"""
from typing import Dict, Any, List

def verify_evidence(agent_claim: Dict[str, Any], trusted_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compares what the agent claims vs what the system's trusted records show.
    Returns:
    - verified: bool
    - has_contradiction: bool
    - has_missing: bool
    - contradictions: List[str]
    - missing: List[str]
    - fields: Dict[str, Any]
    - confidence: float (0.0 to 1.0)
    """
    contradictions = []
    missing = []
    fields = {}
    total_checks = 0
    matched_checks = 0

    for key, claimed_val in agent_claim.items():
        total_checks += 1
        if key not in trusted_state:
            missing.append(key)
            fields[key] = {"claim": claimed_val, "trusted": None, "status": "MISSING"}
            continue

        trusted_val = trusted_state[key]

        # Numeric comparison with small tolerance
        if isinstance(claimed_val, (int, float)) and isinstance(trusted_val, (int, float)):
            if abs(claimed_val - trusted_val) > 0.01:
                contradictions.append(key)
                fields[key] = {
                    "claim": claimed_val,
                    "trusted": trusted_val,
                    "status": "CONTRADICTION",
                    "diff": abs(claimed_val - trusted_val)
                }
            else:
                matched_checks += 1
                fields[key] = {"claim": claimed_val, "trusted": trusted_val, "status": "MATCH"}
        else:
            if str(claimed_val).strip().lower() != str(trusted_val).strip().lower():
                contradictions.append(key)
                fields[key] = {"claim": claimed_val, "trusted": trusted_val, "status": "CONTRADICTION"}
            else:
                matched_checks += 1
                fields[key] = {"claim": claimed_val, "trusted": trusted_val, "status": "MATCH"}

    has_contradiction = len(contradictions) > 0
    has_missing = len(missing) > 0
    verified = not has_contradiction and not has_missing and total_checks > 0

    confidence = round(matched_checks / max(1, total_checks), 2)
    if has_contradiction:
        confidence = min(confidence, 0.15)

    return {
        "verified": verified,
        "has_contradiction": has_contradiction,
        "has_missing": has_missing,
        "contradictions": contradictions,
        "missing": missing,
        "fields": fields,
        "confidence": confidence
    }
