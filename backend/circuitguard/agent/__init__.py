import asyncio
import uuid
from datetime import datetime
from typing import List, Optional, Callable
from ..models import (
    AgentRun, AgentStatus, TelemetryEvent, HaltReason, CircuitBreakerConfig
)
from ..circuit_breaker import CircuitBreaker, CircuitBreakerHaltException
from ..telemetry import new_trace_id, new_span_id, create_otel_span


TOOL_DEFINITIONS = {
    "payment_lookup": {"latency": 0.4, "description": "Look up payment record"},
    "payment_confirmation": {"latency": 0.3, "description": "Confirm payment status"},
    "account_status": {"latency": 0.35, "description": "Check account status"},
    "web_search": {"latency": 0.25, "description": "Search the web"},
    "data_fetch": {"latency": 0.3, "description": "Fetch external data"},
}

LLM_THOUGHTS = [
    "Analyzing the payment record to determine next steps...",
    "The payment lookup failed. I need to retry the verification process.",
    "Verifying transaction status across multiple systems...",
    "Cross-referencing account data with payment records...",
    "Evaluating retry strategy based on previous failures...",
    "Attempting alternative verification pathway...",
    "Checking payment gateway response codes...",
    "Analyzing error patterns to determine best recovery action...",
    "Computing optimal token allocation for next verification step...",
    "Recursively validating payment chain integrity...",
]


class AgentSimulator:
    """
    Deterministic autonomous agent simulator.
    Labeled: SIMULATED AGENT - PROTOTYPE
    Demonstrates the circuit breaker architecture without needing real LLM APIs.
    """

    def __init__(
        self,
        circuit_breaker: CircuitBreaker,
        event_callback: Optional[Callable] = None,
    ):
        self.cb = circuit_breaker
        self.event_callback = event_callback
        self._run: Optional[AgentRun] = None
        self._cancelled = False

    def _emit(self, event_type: str, **kwargs) -> TelemetryEvent:
        event = TelemetryEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            trace_id=self._run.trace_id if self._run else "",
            span_id=new_span_id(),
            event_type=event_type,
            **kwargs,
        )
        if self._run:
            self._run.events.append(event)
        if self.event_callback:
            self.event_callback(event)
        return event

    async def run_scenario(
        self,
        scenario: str,
        workflow_id: str,
        agent_id: str,
        config: Optional[CircuitBreakerConfig] = None,
    ) -> AgentRun:
        """Main agent execution entry point."""
        if config:
            self.cb.update_config(config)
        self.cb.reset()
        self._cancelled = False

        run = AgentRun(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            agent_id=agent_id,
            scenario=scenario,
            status=AgentStatus.RUNNING,
            started_at=datetime.utcnow(),
            trace_id=new_trace_id(),
        )
        self._run = run

        # OTel root span
        root_span = create_otel_span("agent.run", {
            "workflow_id": workflow_id,
            "agent_id": agent_id,
            "scenario": scenario,
        })

        self._emit("agent.start", node="agent.run", metadata={
            "workflow_id": workflow_id, "agent_id": agent_id, "scenario": scenario
        })

        try:
            if scenario in ["safe"]:
                await self._run_safe_scenario(root_span)
            elif scenario in ["runaway_agent", "tool_failure"]:
                await self._run_tool_failure_scenario(root_span)
            elif scenario == "token_exhaustion":
                await self._run_token_exhaustion_scenario(root_span)
            elif scenario == "infinite_loop":
                await self._run_infinite_loop_scenario(root_span)
            else:
                await self._run_safe_scenario(root_span)

            run.status = AgentStatus.SUCCESS
            self._emit("agent.complete", node="agent.run", status="SUCCESS")

        except CircuitBreakerHaltException as e:
            self.cb.finalize_halt()
            run.status = AgentStatus.HALTED
            run.halt_reason = e.reason
            run.ended_at = datetime.utcnow()

            cb_span = create_otel_span("circuit_breaker.halt", {
                "reason": e.reason.value if e.reason else "UNKNOWN",
                "node": str(e.node),
                "iteration": str(e.iteration),
                "failure_count": str(e.failure_count),
                "token_usage": str(e.token_usage),
                "circuit_state": "HALTED",
            }, parent_span=root_span)

            self._emit("circuit_breaker.halt",
                node="circuit_breaker.halt",
                iteration=e.iteration,
                tool=str(e.node),
                status="HALTED",
                metadata={
                    "reason": e.reason.value if e.reason else "UNKNOWN",
                    "failure_count": e.failure_count,
                    "token_usage": e.token_usage,
                }
            )
            cb_span.end()

        except asyncio.CancelledError:
            run.status = AgentStatus.HALTED
            run.halt_reason = HaltReason.MANUAL_STOP
        except Exception as e:
            run.status = AgentStatus.ERROR
            self._emit("agent.error", status="ERROR", metadata={"error": str(e)})
        finally:
            run.ended_at = run.ended_at or datetime.utcnow()
            run.iterations = self.cb._iteration_count
            run.tokens_used = self.cb._token_usage
            run.tool_calls = sum(1 for ev in run.events if ev.event_type == "tool.call")
            run.failed_calls = sum(
                1 for ev in run.events
                if ev.event_type == "tool.call" and ev.status == "FAILED"
            )
            root_span.end()

        return run

    async def _loop_step(self, iteration: int, tool_name: str, tool_success: bool,
                          tokens: int, root_span, fail_fast: bool = True):
        """One iteration of the agent loop."""
        self.cb.check_halt()

        loop_span = create_otel_span("agent.loop", {
            "iteration": iteration, "workflow_id": self._run.workflow_id,
        }, parent_span=root_span)

        self._emit("agent.loop", node="agent.loop", iteration=iteration,
                    metadata={"iteration": iteration})
        await asyncio.sleep(0.4)
        self.cb.check_halt()

        # LLM Call
        llm_span = create_otel_span("llm.call", {
            "tokens_total": tokens, "iteration": iteration,
        }, parent_span=loop_span)
        self.cb.record_iteration(iteration)
        self.cb.check_halt()
        self.cb.record_tokens(tokens, iteration=iteration)
        self.cb.check_halt()

        self._emit("llm.call", node="llm.call", iteration=iteration, tokens=tokens,
                    status="SUCCESS", metadata={"thought": LLM_THOUGHTS[iteration % len(LLM_THOUGHTS)]})
        await asyncio.sleep(0.3)
        llm_span.end()
        self.cb.check_halt()

        # Tool Call
        tool_status = "SUCCESS" if tool_success else "FAILED"
        tool_span = create_otel_span("tool.call", {
            "tool_name": tool_name, "status": tool_status, "iteration": iteration,
        }, parent_span=loop_span)

        self.cb.record_tool_result(tool_success, tool_name, iteration)
        cb_check_span = create_otel_span("circuit_breaker.check", {
            "consecutive_failures": self.cb._failure_count,
            "threshold": self.cb.config.max_consecutive_failures,
            "token_usage": self.cb._token_usage,
            "token_budget": self.cb.config.max_tokens,
            "iteration": iteration,
            "max_iterations": self.cb.config.max_iterations,
            "decision": "HALT" if self.cb.is_halted else "CONTINUE",
            "circuit_state": self.cb.state.value,
        }, parent_span=tool_span)
        cb_check_span.end()

        self._emit("tool.call", node="tool.call", iteration=iteration, tool=tool_name,
                    status=tool_status, metadata={"consecutive_failures": self.cb._failure_count})
        await asyncio.sleep(0.35)
        tool_span.end()
        loop_span.end()

        self.cb.check_halt()  # Final check - raises if triggered

    async def _run_safe_scenario(self, root_span):
        """Scenario 1: Agent completes successfully."""
        tools = ["payment_lookup", "payment_confirmation", "account_status", "payment_confirmation"]
        for i in range(1, 5):
            await self._loop_step(i, tools[i-1], True, 400 + i * 50, root_span)
            await asyncio.sleep(0.2)

    async def _run_tool_failure_scenario(self, root_span):
        """Scenario 2: Repeated tool failure - triggers CONSECUTIVE_TOOL_FAILURE_LIMIT."""
        for i in range(1, 20):  # max 20 but breaker will stop it
            await self._loop_step(i, "payment_lookup", False, 640 + i * 30, root_span)
            await asyncio.sleep(0.2)

    async def _run_token_exhaustion_scenario(self, root_span):
        """Scenario 3: Token budget exceeded."""
        token_per_iter = [700, 850, 900, 1000, 800, 600]
        for i in range(1, 20):
            tokens = token_per_iter[(i - 1) % len(token_per_iter)]
            await self._loop_step(i, "data_fetch", True, tokens, root_span)
            await asyncio.sleep(0.2)

    async def _run_infinite_loop_scenario(self, root_span):
        """Scenario 4: Infinite loop protection."""
        for i in range(1, 50):  # will be stopped at max_iterations
            await self._loop_step(i, "web_search", True, 200, root_span)
            await asyncio.sleep(0.15)
