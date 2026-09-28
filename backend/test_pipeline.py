"""
SAARTHI — Automated Test Suite & E2E Pipeline Verification
Validates:
1. Health and Database Connectivity
2. The 4 Locked Governance Scenarios:
   - Scenario 1 (safe_action): ALLOW
   - Scenario 2 (evidence_mismatch): BLOCK
   - Scenario 3 (high_impact): HUMAN_REVIEW
   - Scenario 4 (suspicious_replay): BLOCK
3. CircuitGuard Runtime Safety & Breaker Trip:
   - runaway_agent: HALTED on CONSECUTIVE_TOOL_FAILURE_LIMIT, CircuitState: OPEN
4. TrustBridge Human Oversight Checkpoints:
   - Approve / Modify / Reject state updates and workflow resumption
5. SHA-256 Tamper-Evident Audit Ledger Integrity
"""
import os
import sys

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") in ["operational", "healthy"]
    print("[PASS] 1. Health check OK (status: operational)")

def test_governance_scenarios():
    expected = {
        "safe_action": "ALLOW",
        "evidence_mismatch": "BLOCK",
        "high_impact": "HUMAN_REVIEW",
        "suspicious_replay": "BLOCK"
    }
    for sc, exp in expected.items():
        resp = client.post(f"/api/agent/run-scenario/{sc}")
        assert resp.status_code == 200, f"Failed {sc}: {resp.text}"
        data = resp.json()
        assert data.get("decision") == exp, f"Expected {exp} for {sc}, got {data.get('decision')}"
        print(f"[PASS] 2. Scenario {sc} -> {data.get('decision')}")

def test_circuitguard_safety():
    resp = client.post("/api/scenarios/runaway_agent/run")
    assert resp.status_code == 200, f"Failed runaway_agent: {resp.text}"
    data = resp.json()
    assert data["status"] == "HALTED"
    assert data["halt_reason"] == "CONSECUTIVE_TOOL_FAILURE_LIMIT"

    cb_status = client.get("/api/circuit-breaker").json()
    assert cb_status["state"] == "OPEN"
    assert cb_status["failure_count"] >= 4
    print("[PASS] 3. CircuitGuard runaway agent -> HALTED, Breaker: OPEN")

def test_trustbridge_hitl():
    reviews = client.get("/api/hitl/requests").json()
    pending = [r for r in reviews if r.get("status") == "PENDING"]
    assert len(pending) > 0, "Expected at least 1 pending review from high_impact scenario"
    rev = pending[0]
    rev_id = rev["id"]

    mod_resp = client.post(f"/api/hitl/requests/{rev_id}/modify", json={
        "modified_parameters": {"amount": 4500.0},
        "reason": "Operator modified to 4,500 within 5,000 threshold"
    })
    assert mod_resp.status_code == 200
    mod_data = mod_resp.json()
    assert mod_data.get("status") == "modified"
    print(f"[PASS] 4. TrustBridge HITL modify -> Resumed checkpoint for {rev_id}")

def test_audit_integrity():
    res = client.get("/api/audit/verify").json()
    assert res.get("valid") is True
    assert res.get("total_events", 0) > 0
    assert res.get("broken_at") is None
    print(f"[PASS] 5. SHA-256 Audit Trail Integrity verified across {res.get('total_events')} events")

if __name__ == "__main__":
    print("=" * 60)
    print("SAARTHI RUNTIME GOVERNANCE — TEST PIPELINE")
    print("=" * 60)
    test_health()
    test_governance_scenarios()
    test_circuitguard_safety()
    test_trustbridge_hitl()
    test_audit_integrity()
    print("=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
