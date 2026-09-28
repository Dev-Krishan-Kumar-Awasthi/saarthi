"""
SAARTHI — Demo AI Agent Client
Simulates an external autonomous agent submitting action requests to SAARTHI via REST.
Proves that SAARTHI sits outside the agent as an authoritative governance boundary.
Instrumented with OpenTelemetry to capture agent.run, agent.iteration, llm.call, tool.call,
circuit.check, and governance.evaluate spans.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import httpx

try:
    from agent.scenarios import LOCKED_SCENARIOS
    from config import API_PORT
    from circuitguard.telemetry import create_otel_span, new_trace_id, new_span_id
    from circuitguard.services import agent_service
    from circuitguard.models import TelemetryEvent, AgentRun, AgentStatus
except ImportError:
    from .scenarios import LOCKED_SCENARIOS
    from ..config import API_PORT
    from ..circuitguard.telemetry import create_otel_span, new_trace_id, new_span_id
    from ..circuitguard.services import agent_service
    from ..circuitguard.models import TelemetryEvent, AgentRun, AgentStatus

BASE_URL = f"http://127.0.0.1:{API_PORT}"


class DemoAgentClient:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url

    async def execute_scenario(self, scenario_id: str) -> Dict[str, Any]:
        """
        Loads the scenario inputs, packages into ActionRequest, and sends over HTTP
        to SAARTHI's public governance evaluation endpoint.
        Captures OpenTelemetry spans throughout the execution flow.
        """
        sc = LOCKED_SCENARIOS.get(scenario_id)
        if not sc:
            raise ValueError(f"Unknown scenario '{scenario_id}'. Valid: {list(LOCKED_SCENARIOS.keys())}")

        workflow_id = f"wf-{uuid.uuid4().hex[:8]}"
        trace_id = new_trace_id()
        agent_id = "demo-agent-01"

        payload = {
            "scenario_id": scenario_id,
            "workflow_id": workflow_id,
            "agent_id": agent_id,
            "customer": sc["customer"],
            "order_id": sc["order_id"],
            "action": sc["action"],
            "amount": sc["amount"],
            "agent_claim": sc["agent_claim"],
            "trusted_state": sc["trusted_state"],
            "context": sc["context"]
        }

        # 1. OpenTelemetry Root Span: agent.run
        root_span = create_otel_span("agent.run", {
            "workflow_id": workflow_id,
            "agent_id": agent_id,
            "scenario_id": scenario_id,
            "customer": sc["customer"],
            "order_id": sc["order_id"],
            "trace_id": trace_id
        })

        run_record = AgentRun(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            agent_id=agent_id,
            scenario=scenario_id,
            status=AgentStatus.RUNNING,
            started_at=datetime.utcnow(),
            trace_id=trace_id
        )

        def emit_event(ev_type: str, node: Optional[str] = None, **kwargs):
            ev = TelemetryEvent(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                trace_id=trace_id,
                span_id=new_span_id(),
                event_type=ev_type,
                node=node,
                **kwargs
            )
            run_record.events.append(ev)
            agent_service._on_event(ev)
            return ev

        emit_event("agent.start", node="agent.run", metadata={"scenario": scenario_id, "customer": sc["customer"]})

        # 2. OpenTelemetry Span: agent.iteration
        iter_span = create_otel_span("agent.iteration", {
            "iteration": "1",
            "workflow_id": workflow_id
        }, parent_span=root_span)
        emit_event("agent.iteration", node="agent.iteration", iteration=1)

        # 3. OpenTelemetry Span: llm.call
        llm_thought = f"Autonomous analysis for customer {sc['customer']}: evaluating {sc['action']} of ₹{sc['amount']:,.0f}"
        llm_span = create_otel_span("llm.call", {
            "prompt_tokens": "380",
            "completion_tokens": "95",
            "thought": llm_thought
        }, parent_span=iter_span)
        emit_event("llm.call", node="llm.call", iteration=1, tokens=475, status="SUCCESS", metadata={"thought": llm_thought})
        llm_span.end()

        # 4. OpenTelemetry Span: tool.call
        tool_span = create_otel_span("tool.call", {
            "tool_name": "governance_gateway",
            "action": sc["action"],
            "amount": str(sc["amount"])
        }, parent_span=iter_span)
        emit_event("tool.call", node="tool.call", tool="governance_gateway", status="DISPATCHED", metadata={"action": sc["action"], "amount": sc["amount"]})

        # 5. OpenTelemetry Span: circuit.check
        cb_state = agent_service.get_circuit_breaker_state()
        cb_span = create_otel_span("circuit.check", {
            "circuit_state": cb_state.state.value,
            "failure_count": str(cb_state.failure_count),
            "status": "PASS"
        }, parent_span=iter_span)
        emit_event("circuit.check", node="circuit.check", status="PASS", metadata={"circuit_state": cb_state.state.value})
        cb_span.end()

        # 6. OpenTelemetry Span: governance.evaluate (sends REST POST request to FastAPI)
        gov_span = create_otel_span("governance.evaluate", {
            "endpoint": "/api/governance/evaluate",
            "method": "POST",
            "scenario": scenario_id
        }, parent_span=tool_span)

        try:
            resp_data = None
            try:
                async with httpx.AsyncClient(base_url=self.base_url, timeout=8.0) as client:
                    resp = await client.post("/api/governance/evaluate", json=payload)
                    if resp.status_code == 200:
                        resp_data = resp.json()
            except Exception:
                # Direct in-process ASGI fallback
                from main import app
                transport = httpx.ASGITransport(app=app)
                async with httpx.AsyncClient(transport=transport, base_url="http://localhost") as client:
                    resp = await client.post("/api/governance/evaluate", json=payload)
                    if resp.status_code == 200:
                        resp_data = resp.json()
                    else:
                        raise RuntimeError(f"Governance API returned error {resp.status_code}: {resp.text}")

            if not resp_data:
                raise RuntimeError("Failed to receive response from Governance API")

            # Enrich OTel span with authoritative governance result
            gov_span.set_attribute("decision", resp_data.get("decision", ""))
            gov_span.set_attribute("risk_overall", str(resp_data.get("risk", {}).get("overall", 0)))
            gov_span.set_attribute("ml_anomaly_score", str(resp_data.get("ml_anomaly", {}).get("anomaly_score", 0)))
            gov_span.set_attribute("reason", resp_data.get("reason", ""))
            gov_span.end()
            tool_span.end()
            iter_span.end()

            decision_status = resp_data.get("decision", "ALLOW")
            run_record.status = AgentStatus.SUCCESS if decision_status == "ALLOW" else AgentStatus.HALTED
            emit_event("governance.decision", node="governance.evaluate", status=decision_status, metadata={
                "decision": decision_status,
                "reason": resp_data.get("reason", ""),
                "risk": resp_data.get("risk", {}).get("overall", 0),
                "ml_anomaly": resp_data.get("ml_anomaly", {}).get("anomaly_score", 0)
            })
            emit_event("agent.complete", node="agent.run", status="COMPLETED")

            root_span.set_attribute("final_decision", decision_status)
            root_span.end()

            # Record run in agent service history so trace viewer shows it
            run_record.ended_at = datetime.utcnow()
            run_record.iterations = 1
            run_record.tokens_used = 475
            run_record.tool_calls = 1
            agent_service.run_history.append(run_record)
            agent_service.current_run = run_record

            return {
                **resp_data,
                "trace_id": trace_id
            }

        except Exception as e:
            gov_span.set_attribute("error", str(e))
            gov_span.end()
            tool_span.end()
            iter_span.end()
            root_span.set_attribute("error", str(e))
            root_span.end()
            run_record.status = AgentStatus.ERROR
            emit_event("agent.error", status="ERROR", metadata={"error": str(e)})
            raise


demo_agent = DemoAgentClient()
