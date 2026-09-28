from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALTED = "HALTED"


class HaltReason(str, Enum):
    CONSECUTIVE_TOOL_FAILURE_LIMIT = "CONSECUTIVE_TOOL_FAILURE_LIMIT"
    TOKEN_BUDGET_EXCEEDED = "TOKEN_BUDGET_EXCEEDED"
    MAX_LOOP_ITERATIONS_EXCEEDED = "MAX_LOOP_ITERATIONS_EXCEEDED"
    MANUAL_STOP = "MANUAL_STOP"


class AgentStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    HALTED = "HALTED"
    ERROR = "ERROR"


class CircuitBreakerConfig(BaseModel):
    max_consecutive_failures: int = Field(default=4, ge=1, le=20)
    max_tokens: int = Field(default=4000, ge=100, le=100000)
    max_iterations: int = Field(default=10, ge=1, le=50)


class CircuitBreakerState(BaseModel):
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    token_usage: int = 0
    iteration_count: int = 0
    config: CircuitBreakerConfig = Field(default_factory=CircuitBreakerConfig)
    trigger_reason: Optional[HaltReason] = None
    triggered_at: Optional[datetime] = None
    triggered_node: Optional[str] = None
    triggered_iteration: Optional[int] = None


class TelemetryEvent(BaseModel):
    id: str
    timestamp: datetime
    trace_id: str
    span_id: str
    event_type: str
    node: Optional[str] = None
    iteration: Optional[int] = None
    tool: Optional[str] = None
    tokens: Optional[int] = None
    status: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentRun(BaseModel):
    id: str
    workflow_id: str
    agent_id: str
    scenario: str
    status: AgentStatus = AgentStatus.IDLE
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    iterations: int = 0
    tokens_used: int = 0
    tool_calls: int = 0
    failed_calls: int = 0
    halt_reason: Optional[HaltReason] = None
    trace_id: str = ""
    events: List[TelemetryEvent] = Field(default_factory=list)


class HaltTrace(BaseModel):
    trace_id: str
    workflow_id: str
    agent_id: str
    timestamp: datetime
    node: Optional[str]
    iteration: int
    tool: Optional[str]
    failure_count: int
    token_usage: int
    config: CircuitBreakerConfig
    circuit_state: CircuitState
    halt_reason: HaltReason
    explanation: str
    decision_explanation: Dict[str, str]


class ScenarioRunRequest(BaseModel):
    config_override: Optional[CircuitBreakerConfig] = None


class ConfigUpdateRequest(BaseModel):
    config: CircuitBreakerConfig
