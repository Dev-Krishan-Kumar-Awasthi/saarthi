"""
SAARTHI — Multi-Factor Risk Engine
Combines deterministic risk factors with the ML Anomaly signal into an explainable 0-100 score.
"""
from typing import Dict, Any

def calculate_risk(
    action_data: Dict[str, Any],
    verification: Dict[str, Any],
    policy: Dict[str, Any],
    ml_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Weighted multi-factor risk calculation:
    - Financial Impact (0 - 100)
    - Policy Severity (0 - 100)
    - Evidence Integrity Deficit (0 - 100)
    - Irreversibility Factor (0 - 100)
    - ML Anomaly Signal (0 - 100)
    """
    amount = float(action_data.get("amount", 0))

    # Factor 1: Financial Impact
    if amount <= 2000:
        financial_impact = int((amount / 2000) * 30)
    elif amount <= 5000:
        financial_impact = int(30 + ((amount - 2000) / 3000) * 35)
    else:
        financial_impact = int(min(100, 65 + ((amount - 5000) / 10000) * 35))

    # Factor 2: Policy Severity
    if policy.get("has_critical_violation"):
        policy_severity = 95
    elif policy.get("has_high_violation"):
        policy_severity = 80
    elif policy.get("warnings"):
        policy_severity = 45
    else:
        policy_severity = 10

    # Factor 3: Evidence Integrity Deficit
    if verification.get("has_contradiction"):
        evidence_deficit = 95  # Hallucination / false premise
    elif verification.get("has_missing"):
        evidence_deficit = 65
    else:
        evidence_deficit = int((1.0 - verification.get("confidence", 1.0)) * 100)

    # Factor 4: Irreversibility
    action_type = action_data.get("action", "").lower()
    if any(w in action_type for w in ["transfer", "wire", "delete", "destroy"]):
        irreversibility = 90
    else:
        irreversibility = 35

    # Factor 5: ML Anomaly Signal
    ml_anomaly_score = int(ml_result.get("anomaly_score", 15))

    # Weighted Overall Score
    # 25% Policy + 25% Evidence + 20% Financial + 15% ML Anomaly + 15% Irreversibility
    overall = int(
        (policy_severity * 0.25) +
        (evidence_deficit * 0.25) +
        (financial_impact * 0.20) +
        (ml_anomaly_score * 0.15) +
        (irreversibility * 0.15)
    )

    # Hard overrides for safety invariants:
    if verification.get("has_contradiction"):
        overall = max(overall, 80)
    if policy.get("has_critical_violation"):
        overall = max(overall, 88)

    overall = max(0, min(100, overall))

    if overall >= 85:
        level = "CRITICAL"
    elif overall >= 70:
        level = "HIGH"
    elif overall >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    factors = {
        "financial_impact": financial_impact,
        "policy_severity": policy_severity,
        "evidence_deficit": evidence_deficit,
        "irreversibility": irreversibility,
        "ml_anomaly_score": ml_anomaly_score
    }

    return {
        "overall": overall,
        "level": level,
        "factors": factors,
        "ml_contribution": round(ml_anomaly_score * 0.15, 1)
    }
