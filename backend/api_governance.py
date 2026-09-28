"""
SAARTHI — Governance API Router
Exposes the core governance evaluation endpoint:
Agent Request -> Evidence Verification + Policy Engine + ML Anomaly Model -> Risk Engine -> Decision Gate
"""
import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

try:
    from agent.models import ActionRequest, ActionEvaluationResponse
    from agent.scenarios import LOCKED_SCENARIOS
    from governance import evaluate_action
    from database.repository import repo
except ImportError:
    from .agent.models import ActionRequest, ActionEvaluationResponse
    from .agent.scenarios import LOCKED_SCENARIOS
    from .governance import evaluate_action
    from .database.repository import repo

router = APIRouter(prefix="/api/governance", tags=["Governance"])

@router.post("/evaluate", response_model=ActionEvaluationResponse)
async def evaluate_agent_request(req: ActionRequest):
    """
    Public entry point for any AI agent proposing an action.
    SAARTHI evaluates evidence, policy, ML anomaly score, and risk to produce
    an authoritative ALLOW, BLOCK, or HUMAN_REVIEW decision.
    """
    workflow_id = req.workflow_id or f"wf-{uuid.uuid4().hex[:8]}"

    res = evaluate_action(
        workflow_id=workflow_id,
        scenario_id=req.scenario_id,
        customer=req.customer,
        order_id=req.order_id,
        action=req.action,
        amount=req.amount,
        agent_claim=req.agent_claim,
        trusted_state=req.trusted_state,
        context=req.context
    )

    return ActionEvaluationResponse(
        workflow_id=res["workflow_id"],
        decision=res["decision"],
        reason=res["reason"],
        reasons=res["reasons"],
        verification=res["verification"],
        policy=res["policy"],
        ml_anomaly=res["ml_anomaly"],
        risk=res["risk"],
        status=res["status"],
        review_id=res.get("review_id")
    )

@router.get("/latest")
async def get_latest_governance_decision():
    """Returns the most recent governance decision with full 'Why?' explanation."""
    decision = repo.get_latest_decision()
    if not decision:
        return {"decision": None, "reason": "No actions evaluated yet."}
    return decision

@router.get("/scenarios")
async def list_locked_scenarios():
    """Returns catalog of locked demo scenarios (pure inputs)."""
    return [
        {
            "id": sc["scenario_id"],
            "name": sc["name"],
            "badge": sc["badge"],
            "description": sc["description"],
            "action": sc["action"],
            "amount": sc["amount"],
            "customer": sc["customer"],
            "order_id": sc["order_id"]
        }
        for sc in LOCKED_SCENARIOS.values()
    ]
