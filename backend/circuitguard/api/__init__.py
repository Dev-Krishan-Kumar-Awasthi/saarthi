from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
from ..services import agent_service
from ..models import ScenarioRunRequest, ConfigUpdateRequest, CircuitBreakerConfig
import asyncio

router = APIRouter()

VALID_SCENARIOS = ["safe", "runaway_agent", "tool_failure", "token_exhaustion", "infinite_loop"]


@router.post("/agent/run")
async def run_agent(request: Optional[ScenarioRunRequest] = None):
    """Run the default safe scenario."""
    config_override = request.config_override if request else None
    return await _run_scenario("safe", config_override)


@router.post("/agent/stop")
async def stop_agent():
    agent_service.stop_agent()
    return {"message": "Stop signal sent", "status": "HALTING"}


@router.post("/agent/reset")
async def reset_agent():
    agent_service.reset()
    return {"message": "Agent and circuit breaker reset", "circuit_state": "CLOSED"}


@router.get("/agent/status")
async def get_status():
    return agent_service.get_status()


@router.get("/agent/metrics")
async def get_metrics():
    return agent_service.get_metrics()


@router.get("/agent/events")
async def get_events(limit: int = 100):
    events = agent_service.get_events(limit)
    return [e.model_dump() for e in events]


@router.post("/scenarios/{scenario}/run")
async def run_scenario(scenario: str, request: Optional[ScenarioRunRequest] = None):
    if scenario not in VALID_SCENARIOS:
        try:
            from agent.scenarios import LOCKED_SCENARIOS
            from agent.client import demo_agent
            if scenario in LOCKED_SCENARIOS:
                return await demo_agent.execute_scenario(scenario)
        except Exception:
            pass
        raise HTTPException(400, f"Invalid scenario. Valid: {VALID_SCENARIOS}")
    config_override = request.config_override if request else None
    return await _run_scenario(scenario, config_override)


async def _run_scenario(scenario: str, config_override: Optional[CircuitBreakerConfig]):
    try:
        run = await agent_service.run_scenario(scenario, config_override)
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
        raise HTTPException(409, str(e))
    except Exception as e:
        raise HTTPException(500, f"Agent error: {str(e)}")


@router.get("/traces")
async def get_traces():
    return agent_service.get_traces()


@router.get("/traces/{trace_id}")
async def get_trace(trace_id: str):
    detail = agent_service.get_trace_detail(trace_id)
    if not detail:
        raise HTTPException(404, "Trace not found")
    return detail


@router.get("/circuit-breaker")
async def get_circuit_breaker():
    return agent_service.get_circuit_breaker_state().model_dump()


@router.put("/circuit-breaker/config")
async def update_circuit_breaker_config(request: ConfigUpdateRequest):
    agent_service.update_config(request.config)
    return {"message": "Configuration updated", "config": request.config.model_dump()}
