"""
SAARTHI — Agent API Router
Executes scenarios via the separate Demo Agent layer.
Proves external agent boundary sending requests over the API.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any

try:
    from agent.scenarios import LOCKED_SCENARIOS
    from agent.client import demo_agent
    from circuitguard.services import agent_service
    from circuitguard.models import CircuitBreakerConfig, ScenarioRunRequest
except ImportError:
    from .agent.scenarios import LOCKED_SCENARIOS
    from .agent.client import demo_agent
    from .circuitguard.services import agent_service
    from .circuitguard.models import CircuitBreakerConfig, ScenarioRunRequest

from pydantic import BaseModel

class AgentRunPayload(BaseModel):
    scenario: Optional[str] = "safe_action"

router = APIRouter(prefix="/api", tags=["Demo Agent"])

@router.post("/agent/run")
async def run_agent_post(payload: Optional[AgentRunPayload] = None):
    sc = payload.scenario if payload and payload.scenario else "safe_action"
    return await run_scenario_dispatch(sc)

@router.post("/agent/run-scenario/{scenario_id}")
async def run_agent_scenario(scenario_id: str):
    """
    Instructs the external Demo Agent to generate the action request
    and submit it to SAARTHI's /api/governance/evaluate endpoint.
    """
    if scenario_id not in LOCKED_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{scenario_id}'. Valid: {list(LOCKED_SCENARIOS.keys())}"
        )
    try:
        return await demo_agent.execute_scenario(scenario_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scenarios/{scenario_id}/run")
async def run_scenario_dispatch(scenario_id: str, request: Optional[ScenarioRunRequest] = None):
    """
    Unified scenario execution dispatcher:
    - If governance demo scenario: sends via DemoAgentClient -> /api/governance/evaluate
    - If circuit breaker simulation scenario: runs via CircuitGuard
    """
    # 1. Check if it's one of the 4 locked governance scenarios
    if scenario_id in LOCKED_SCENARIOS:
        try:
            return await demo_agent.execute_scenario(scenario_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # 2. Check if it's a CircuitGuard scenario
    valid_cb = ["safe", "runaway_agent", "tool_failure", "token_exhaustion", "infinite_loop"]
    if scenario_id in valid_cb:
        try:
            config_override = request.config_override if request else None
            run = await agent_service.run_scenario(scenario_id, config_override)
            return {
                "run_id": run.id,
                "trace_id": run.trace_id,
                "status": run.status.value,
                "halt_reason": run.halt_reason.value if run.halt_reason else None,
                "iterations": run.iterations,
                "tokens_used": run.tokens_used,
                "tool_calls": run.tool_calls,
                "failed_calls": run.failed_calls,
            }
        except ValueError as e:
            raise HTTPException(status_code=409, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"CircuitGuard error: {str(e)}")

    raise HTTPException(
        status_code=400,
        detail=f"Invalid scenario '{scenario_id}'. Valid governance: {list(LOCKED_SCENARIOS.keys())}, Valid safety: {valid_cb}"
    )

@router.post("/workflows/start")
async def start_workflow_compat(request: Optional[Dict[str, Any]] = None):
    scenario = "high_impact"
    if request and "scenario" in request:
        sc = request["scenario"]
        if sc in ["safe_action", "evidence_mismatch", "high_impact", "suspicious_replay"]:
            scenario = sc
    res = await demo_agent.execute_scenario(scenario)
    return {
        "workflow_id": res.get("workflow_id"),
        "hitl_request_id": res.get("workflow_id"),
        "status": res.get("decision"),
        "result": res
    }

