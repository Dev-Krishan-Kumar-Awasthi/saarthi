import asyncio
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime

from ..models import (
    AgentRun, AgentStatus, CircuitBreakerConfig, CircuitBreakerState, TelemetryEvent, HaltTrace
)
from ..circuit_breaker import CircuitBreaker
from ..agent import AgentSimulator


class AgentService:
    """Global service managing agent runs and circuit breaker state."""

    def __init__(self):
        self.circuit_breaker = CircuitBreaker()
        self.current_run: Optional[AgentRun] = None
        self.run_history: List[AgentRun] = []
        self.all_events: List[TelemetryEvent] = []
        self._task: Optional[asyncio.Task] = None
        self._halt_traces: Dict[str, HaltTrace] = {}
        self._run_counter: int = 0
        self._circuit_breaks: int = 0
        self._total_llm_calls: int = 0
        self._total_tool_calls: int = 0

    def _on_event(self, event: TelemetryEvent):
        self.all_events.append(event)
        if event.event_type == "llm.call":
            self._total_llm_calls += 1
        if event.event_type == "tool.call":
            self._total_tool_calls += 1

    async def run_scenario(
        self, scenario: str, config_override: Optional[CircuitBreakerConfig] = None
    ) -> AgentRun:
        if self.current_run and self.current_run.status == AgentStatus.RUNNING:
            raise ValueError("Agent already running")

        self._run_counter += 1
        workflow_id = f"workflow-{scenario}-{self._run_counter:03d}"
        agent_id = f"agent-circuitguard-{self._run_counter:03d}"

        simulator = AgentSimulator(
            circuit_breaker=self.circuit_breaker,
            event_callback=self._on_event,
        )

        run = await simulator.run_scenario(
            scenario=scenario,
            workflow_id=workflow_id,
            agent_id=agent_id,
            config=config_override,
        )

        self.current_run = run
        self.run_history.append(run)

        if run.status == AgentStatus.HALTED:
            self._circuit_breaks += 1
            trace = self.circuit_breaker.build_halt_trace(
                run.trace_id, workflow_id, agent_id
            )
            self._halt_traces[run.trace_id] = trace

        return run

    def stop_agent(self):
        self.circuit_breaker.manual_stop()

    def reset(self):
        self.circuit_breaker.reset()
        self.current_run = None
        self.all_events.clear()

    def get_status(self) -> Dict[str, Any]:
        run = self.current_run
        cb = self.circuit_breaker.get_state()
        return {
            "agent_status": run.status.value if run else "IDLE",
            "circuit_state": cb.state.value,
            "iteration": cb.iteration_count,
            "failure_count": cb.failure_count,
            "token_usage": cb.token_usage,
            "trigger_reason": cb.trigger_reason.value if cb.trigger_reason else None,
            "triggered_node": cb.triggered_node,
            "triggered_iteration": cb.triggered_iteration,
            "run_id": run.id if run else None,
            "trace_id": run.trace_id if run else None,
            "app_status": "HEALTHY",
        }

    def get_metrics(self) -> Dict[str, Any]:
        cb = self.circuit_breaker.get_state()
        run = self.current_run
        return {
            "active_agents": 1 if (run and run.status == AgentStatus.RUNNING) else 0,
            "llm_calls": self._total_llm_calls,
            "tool_calls": self._total_tool_calls,
            "iterations": cb.iteration_count,
            "tokens_used": cb.token_usage,
            "failed_calls": run.failed_calls if run else 0,
            "circuit_breaks": self._circuit_breaks,
            "total_runs": self._run_counter,
        }

    def get_events(self, limit: int = 100) -> List[TelemetryEvent]:
        events = self.all_events[-limit:]
        return list(reversed(events))

    def get_circuit_breaker_state(self) -> CircuitBreakerState:
        return self.circuit_breaker.get_state()

    def update_config(self, config: CircuitBreakerConfig):
        self.circuit_breaker.update_config(config)

    def get_traces(self) -> List[Dict]:
        result = []
        for run in self.run_history:
            result.append({
                "trace_id": run.trace_id,
                "workflow_id": run.workflow_id,
                "agent_id": run.agent_id,
                "scenario": run.scenario,
                "status": run.status.value,
                "started_at": run.started_at.isoformat() if run.started_at else None,
                "ended_at": run.ended_at.isoformat() if run.ended_at else None,
                "iterations": run.iterations,
                "tokens_used": run.tokens_used,
                "tool_calls": run.tool_calls,
                "failed_calls": run.failed_calls,
                "halt_reason": run.halt_reason.value if run.halt_reason else None,
                "event_count": len(run.events),
            })
        return list(reversed(result))

    def get_trace_detail(self, trace_id: str) -> Optional[Dict]:
        run = next((r for r in self.run_history if r.trace_id == trace_id), None)
        if not run:
            return None
        halt_trace = self._halt_traces.get(trace_id)
        return {
            "run": run.model_dump(),
            "halt_trace": halt_trace.model_dump() if halt_trace else None,
            "events": [e.model_dump() for e in run.events],
        }


# Singleton service
agent_service = AgentService()
