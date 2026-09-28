import threading
import uuid
from datetime import datetime
from typing import Optional
from ..models import (
    CircuitBreakerConfig, CircuitBreakerState, CircuitState, HaltReason, HaltTrace
)


class CircuitBreaker:
    """
    Core circuit breaker engine. 
    Runs in the backend execution layer - actual halt decision made here.
    """

    def __init__(self, config: Optional[CircuitBreakerConfig] = None):
        self.config = config or CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._token_usage = 0
        self._iteration_count = 0
        self._trigger_reason: Optional[HaltReason] = None
        self._triggered_at: Optional[datetime] = None
        self._triggered_node: Optional[str] = None
        self._triggered_iteration: Optional[int] = None
        self._halt_event = threading.Event()  # actual execution interrupt
        self._lock = threading.Lock()

    @property
    def is_halted(self) -> bool:
        return self._halt_event.is_set()

    @property
    def state(self) -> CircuitState:
        return self._state

    def update_config(self, config: CircuitBreakerConfig):
        with self._lock:
            self.config = config

    def check_halt(self):
        """Raises exception if circuit is open - interrupts execution."""
        if self._halt_event.is_set():
            raise CircuitBreakerHaltException(
                reason=self._trigger_reason,
                node=self._triggered_node,
                iteration=self._triggered_iteration,
                failure_count=self._failure_count,
                token_usage=self._token_usage,
            )

    def record_iteration(self, iteration: int, node: str = "agent.loop"):
        with self._lock:
            self._iteration_count = iteration
            if iteration >= self.config.max_iterations:
                self._trigger(HaltReason.MAX_LOOP_ITERATIONS_EXCEEDED, node, iteration)

    def record_tokens(self, tokens: int, node: str = "llm.call", iteration: int = 0):
        with self._lock:
            self._token_usage += tokens
            if self._token_usage >= self.config.max_tokens:
                self._trigger(HaltReason.TOKEN_BUDGET_EXCEEDED, node, iteration)

    def record_tool_result(self, success: bool, tool_name: str, iteration: int):
        with self._lock:
            if success:
                self._failure_count = 0  # reset on success
            else:
                self._failure_count += 1
                if self._failure_count >= self.config.max_consecutive_failures:
                    self._trigger(HaltReason.CONSECUTIVE_TOOL_FAILURE_LIMIT, tool_name, iteration)

    def _trigger(self, reason: HaltReason, node: str, iteration: int):
        if self._state == CircuitState.HALTED:
            return  # already triggered
        self._state = CircuitState.OPEN
        self._trigger_reason = reason
        self._triggered_at = datetime.utcnow()
        self._triggered_node = node
        self._triggered_iteration = iteration
        self._halt_event.set()  # signal all waiting execution

    def manual_stop(self):
        with self._lock:
            self._trigger(HaltReason.MANUAL_STOP, "manual", self._iteration_count)

    def finalize_halt(self):
        with self._lock:
            self._state = CircuitState.OPEN

    def reset(self):
        with self._lock:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._token_usage = 0
            self._iteration_count = 0
            self._trigger_reason = None
            self._triggered_at = None
            self._triggered_node = None
            self._triggered_iteration = None
            self._halt_event.clear()

    def get_state(self) -> CircuitBreakerState:
        return CircuitBreakerState(
            state=self._state,
            failure_count=self._failure_count,
            token_usage=self._token_usage,
            iteration_count=self._iteration_count,
            config=self.config,
            trigger_reason=self._trigger_reason,
            triggered_at=self._triggered_at,
            triggered_node=self._triggered_node,
            triggered_iteration=self._triggered_iteration,
        )

    def build_halt_trace(self, trace_id: str, workflow_id: str, agent_id: str) -> HaltTrace:
        reason = self._trigger_reason or HaltReason.MANUAL_STOP
        explanations = {
            HaltReason.CONSECUTIVE_TOOL_FAILURE_LIMIT: (
                f"The tool '{self._triggered_node}' failed {self._failure_count} consecutive times. "
                f"The circuit breaker halted agent execution to prevent runaway retries."
            ),
            HaltReason.TOKEN_BUDGET_EXCEEDED: (
                f"Total token consumption ({self._token_usage}) exceeded the configured budget "
                f"of {self.config.max_tokens} tokens. Execution halted to prevent cost overrun."
            ),
            HaltReason.MAX_LOOP_ITERATIONS_EXCEEDED: (
                f"Agent reached {self._iteration_count} iterations, exceeding the configured "
                f"maximum of {self.config.max_iterations}. Execution halted to prevent infinite loop."
            ),
            HaltReason.MANUAL_STOP: "Agent was manually stopped by operator.",
        }
        decision = {
            "trigger_node": self._triggered_node or "unknown",
            "observed_condition": self._get_observed_condition(reason),
            "configured_safety_rule": self._get_safety_rule(reason),
            "decision": "HALT",
            "reason": reason.value,
        }
        return HaltTrace(
            trace_id=trace_id,
            workflow_id=workflow_id,
            agent_id=agent_id,
            timestamp=self._triggered_at or datetime.utcnow(),
            node=self._triggered_node,
            iteration=self._triggered_iteration or 0,
            tool=self._triggered_node,
            failure_count=self._failure_count,
            token_usage=self._token_usage,
            config=self.config,
            circuit_state=self._state,
            halt_reason=reason,
            explanation=explanations.get(reason, "Execution halted."),
            decision_explanation=decision,
        )

    def _get_observed_condition(self, reason: HaltReason) -> str:
        if reason == HaltReason.CONSECUTIVE_TOOL_FAILURE_LIMIT:
            return f"{self._failure_count} consecutive tool failures"
        elif reason == HaltReason.TOKEN_BUDGET_EXCEEDED:
            return f"{self._token_usage} total tokens consumed"
        elif reason == HaltReason.MAX_LOOP_ITERATIONS_EXCEEDED:
            return f"{self._iteration_count} loop iterations completed"
        return "Unknown condition"

    def _get_safety_rule(self, reason: HaltReason) -> str:
        if reason == HaltReason.CONSECUTIVE_TOOL_FAILURE_LIMIT:
            return f"Maximum {self.config.max_consecutive_failures} consecutive failures"
        elif reason == HaltReason.TOKEN_BUDGET_EXCEEDED:
            return f"Maximum token budget of {self.config.max_tokens}"
        elif reason == HaltReason.MAX_LOOP_ITERATIONS_EXCEEDED:
            return f"Maximum {self.config.max_iterations} loop iterations"
        return "Unknown rule"


class CircuitBreakerHaltException(Exception):
    def __init__(self, reason, node, iteration, failure_count, token_usage):
        self.reason = reason
        self.node = node
        self.iteration = iteration
        self.failure_count = failure_count
        self.token_usage = token_usage
        super().__init__(f"Circuit breaker halted: {reason}")
