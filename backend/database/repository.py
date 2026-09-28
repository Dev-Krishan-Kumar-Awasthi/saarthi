"""
SAARTHI — Repository Module
Authoritative data access layer backed by SQLite.
"""
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from .db import get_connection

class Repository:
    # ── Workflows ──
    def save_workflow(self, wf: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_connection()
        now = datetime.now(timezone.utc).isoformat()
        with conn:
            conn.execute("""
            INSERT INTO workflows (
                id, scenario_id, objective, customer, order_id, amount,
                status, progress, current_step, decision, decision_reason,
                risk_overall, risk_level, started_at, completed_at, updated_at, payload_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                progress = excluded.progress,
                current_step = excluded.current_step,
                decision = excluded.decision,
                decision_reason = excluded.decision_reason,
                risk_overall = excluded.risk_overall,
                risk_level = excluded.risk_level,
                amount = excluded.amount,
                completed_at = excluded.completed_at,
                updated_at = excluded.updated_at,
                payload_json = excluded.payload_json
            """, (
                wf["id"],
                wf.get("scenario_id", ""),
                wf.get("objective", ""),
                wf.get("customer", ""),
                wf.get("order_id", ""),
                float(wf.get("amount", 0)),
                str(wf.get("status", "EXECUTING")),
                int(wf.get("progress", 0)),
                wf.get("current_step") or wf.get("currentStep", "Started"),
                wf.get("decision", ""),
                wf.get("decision_reason", ""),
                int(wf.get("risk_overall", wf.get("risk", {}).get("overall", 0) if isinstance(wf.get("risk"), dict) else 0)),
                wf.get("risk_level", wf.get("risk", {}).get("level", "LOW") if isinstance(wf.get("risk"), dict) else "LOW"),
                wf.get("started_at") or wf.get("startedAt") or now,
                wf.get("completed_at") or wf.get("completedAt"),
                now,
                json.dumps(wf.get("payload_json") or wf.get("payload") or {})
            ))
        return self.get_workflow(wf["id"])

    def get_workflow(self, wf_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM workflows WHERE id = ?", (wf_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["risk"] = {"overall": d["risk_overall"], "level": d["risk_level"]}
        d["currentStep"] = d["current_step"]
        d["startedAt"] = d["started_at"]
        d["completedAt"] = d["completed_at"]
        try:
            d["payload"] = json.loads(d["payload_json"]) if d["payload_json"] else {}
        except Exception:
            d["payload"] = {}
        return d

    def list_workflows(self, limit: int = 50) -> List[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM workflows ORDER BY started_at DESC LIMIT ?", (limit,))
        res = []
        for row in cur.fetchall():
            d = dict(row)
            d["risk"] = {"overall": d["risk_overall"], "level": d["risk_level"]}
            d["currentStep"] = d["current_step"]
            d["startedAt"] = d["started_at"]
            d["completedAt"] = d["completed_at"]
            try:
                d["payload"] = json.loads(d["payload_json"]) if d["payload_json"] else {}
            except Exception:
                d["payload"] = {}
            res.append(d)
        return res

    # ── Governance Decisions ──
    def save_decision(self, dec: Dict[str, Any]):
        conn = get_connection()
        with conn:
            conn.execute("""
            INSERT INTO governance_decisions (
                id, workflow_id, action, decision, reason, reasons_json,
                risk_overall, risk_level, risk_factors_json,
                evidence_verified, policy_passed, ml_anomaly_score,
                ml_is_anomaly, ml_explanation, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                dec["id"],
                dec["workflow_id"],
                dec["action"],
                dec["decision"],
                dec["reason"],
                json.dumps(dec.get("reasons", [])),
                int(dec.get("risk_overall", 0)),
                dec.get("risk_level", "LOW"),
                json.dumps(dec.get("risk_factors", {})),
                1 if dec.get("evidence_verified") else 0,
                1 if dec.get("policy_passed") else 0,
                float(dec.get("ml_anomaly_score", 0.0)),
                1 if dec.get("ml_is_anomaly") else 0,
                dec.get("ml_explanation", ""),
                dec.get("created_at", datetime.now(timezone.utc).isoformat())
            ))

    def get_latest_decision(self) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM governance_decisions ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["reasons"] = json.loads(d["reasons_json"]) if d["reasons_json"] else []
        d["risk_factors"] = json.loads(d["risk_factors_json"]) if d["risk_factors_json"] else {}
        d["evidence_verified"] = bool(d["evidence_verified"])
        d["policy_passed"] = bool(d["policy_passed"])
        d["ml_is_anomaly"] = bool(d["ml_is_anomaly"])

        # Fetch associated workflow to populate customer, order_id, amount, parameters, and full pipeline payloads
        wf = self.get_workflow(d["workflow_id"])
        if wf:
            d["customer"] = wf.get("customer")
            d["order_id"] = wf.get("order_id")
            d["amount"] = wf.get("amount", 0.0)
            d["agent_id"] = "demo-agent-01"
            d["parameters"] = {
                "amount": wf.get("amount", 0.0),
                "customer_id": wf.get("customer"),
                "order_id": wf.get("order_id")
            }
            payload = wf.get("payload", {})
            d["verification"] = payload.get("verification", {
                "verified": d["evidence_verified"],
                "valid": d["evidence_verified"],
                "contradictions": [r for r in d["reasons"] if "conflict" in r.lower() or "contradiction" in r.lower()]
            })
            d["policy"] = payload.get("policy", {
                "policy_pass": d["policy_passed"],
                "passed": d["policy_passed"],
                "violations": [r for r in d["reasons"] if "exceed" in r.lower() or "violation" in r.lower()]
            })
            d["ml_anomaly"] = payload.get("ml_anomaly", {
                "anomaly_score": d["ml_anomaly_score"],
                "score": d["ml_anomaly_score"],
                "is_anomaly": d["ml_is_anomaly"],
                "explanation": d["ml_explanation"],
                "model_version": "isoforest-v1.0.0"
            })
            d["risk"] = payload.get("risk", {
                "overall": d["risk_overall"],
                "score": d["risk_overall"],
                "level": d["risk_level"],
                "factors": d["risk_factors"]
            })
        else:
            d["agent_id"] = "demo-agent-01"
            d["parameters"] = {"amount": 0.0}
            d["verification"] = {"verified": d["evidence_verified"], "valid": d["evidence_verified"], "contradictions": []}
            d["policy"] = {"policy_pass": d["policy_passed"], "passed": d["policy_passed"], "violations": []}
            d["ml_anomaly"] = {"anomaly_score": d["ml_anomaly_score"], "score": d["ml_anomaly_score"], "is_anomaly": d["ml_is_anomaly"], "explanation": d["ml_explanation"], "model_version": "isoforest-v1.0.0"}
            d["risk"] = {"overall": d["risk_overall"], "score": d["risk_overall"], "level": d["risk_level"], "factors": d["risk_factors"]}

        return d

    # ── Human Reviews ──
    def save_human_review(self, rev: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_connection()
        with conn:
            conn.execute("""
            INSERT INTO human_reviews (
                id, workflow_id, customer, order_id, amount, modified_amount,
                risk_overall, risk_level, reason, status, decision, checkpoint_id,
                created_at, decided_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                decision = excluded.decision,
                modified_amount = excluded.modified_amount,
                decided_at = excluded.decided_at
            """, (
                rev["id"],
                rev["workflow_id"],
                rev.get("customer", ""),
                rev.get("order_id", ""),
                float(rev.get("amount", 0)),
                float(rev["modified_amount"]) if rev.get("modified_amount") is not None else None,
                int(rev.get("risk_overall", rev.get("risk", {}).get("overall", 0) if isinstance(rev.get("risk"), dict) else 0)),
                rev.get("risk_level", rev.get("risk", {}).get("level", "HIGH") if isinstance(rev.get("risk"), dict) else "HIGH"),
                rev["reason"],
                rev.get("status", "PENDING"),
                rev.get("decision"),
                rev.get("checkpoint_id"),
                rev.get("created_at", datetime.now(timezone.utc).isoformat()),
                rev.get("decided_at")
            ))
        return self.get_human_review(rev["id"])

    def get_human_review(self, rev_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM human_reviews WHERE id = ?", (rev_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["risk"] = {"overall": d["risk_overall"], "level": d["risk_level"]}
        return d

    def list_human_reviews(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        if status:
            cur = conn.execute("SELECT * FROM human_reviews WHERE status = ? ORDER BY created_at DESC", (status,))
        else:
            cur = conn.execute("SELECT * FROM human_reviews ORDER BY created_at DESC")
        res = []
        for r in cur.fetchall():
            d = dict(r)
            d["risk"] = {"overall": d["risk_overall"], "level": d["risk_level"]}
            res.append(d)
        return res

    # ── Checkpoints ──
    def save_checkpoint(self, cp: Dict[str, Any]):
        conn = get_connection()
        with conn:
            conn.execute("""
            INSERT INTO workflow_checkpoints (
                id, workflow_id, review_id, action_name, state_json, status, created_at, resumed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                resumed_at = excluded.resumed_at
            """, (
                cp["id"],
                cp["workflow_id"],
                cp.get("review_id"),
                cp["action_name"],
                json.dumps(cp["state"]),
                cp.get("status", "PAUSED"),
                cp.get("created_at", datetime.now(timezone.utc).isoformat()),
                cp.get("resumed_at")
            ))

    def get_checkpoint(self, cp_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM workflow_checkpoints WHERE id = ?", (cp_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["state"] = json.loads(d["state_json"]) if d["state_json"] else {}
        return d

    # ── Audit Events ──
    def save_audit_event(self, ev: Dict[str, Any]):
        conn = get_connection()
        with conn:
            conn.execute("""
            INSERT INTO audit_events (
                id, timestamp, actor, event_type, workflow_id, payload_json,
                previous_hash, current_hash, integrity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ev["id"],
                ev["timestamp"],
                ev["actor"],
                ev["event_type"],
                ev.get("workflow_id"),
                json.dumps(ev.get("payload", {})),
                ev["previous_hash"],
                ev["current_hash"],
                ev.get("integrity", "VERIFIED")
            ))

    def get_latest_audit_event(self) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM audit_events ORDER BY rowid DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["payload"] = json.loads(d["payload_json"]) if d["payload_json"] else {}
        return d

    def list_audit_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM audit_events ORDER BY rowid DESC LIMIT ?", (limit,))
        res = []
        for r in cur.fetchall():
            d = dict(r)
            d["payload"] = json.loads(d["payload_json"]) if d["payload_json"] else {}
            res.append(d)
        return res

    def get_all_audit_events_ascending(self) -> List[Dict[str, Any]]:
        conn = get_connection()
        cur = conn.execute("SELECT * FROM audit_events ORDER BY rowid ASC")
        res = []
        for r in cur.fetchall():
            d = dict(r)
            d["payload"] = json.loads(d["payload_json"]) if d["payload_json"] else {}
            res.append(d)
        return res

    # ── Dashboard / Metrics Calculation ──
    def get_metrics(self) -> Dict[str, Any]:
        conn = get_connection()
        total_eval = conn.execute("SELECT COUNT(*) FROM workflows").fetchone()[0]
        allowed = conn.execute("SELECT COUNT(*) FROM workflows WHERE decision = 'ALLOW'").fetchone()[0]
        blocked = conn.execute("SELECT COUNT(*) FROM workflows WHERE decision = 'BLOCK'").fetchone()[0]
        human_review = conn.execute("SELECT COUNT(*) FROM human_reviews WHERE status = 'PENDING'").fetchone()[0]
        total_reviews = conn.execute("SELECT COUNT(*) FROM human_reviews").fetchone()[0]
        
        # Reliability score = allowed / (allowed + blocked) * 100 if evaluated > 0
        denom = allowed + blocked
        reliability = round((allowed / denom * 100)) if denom > 0 else 100

        evidence_mismatches = conn.execute("SELECT COUNT(*) FROM governance_decisions WHERE evidence_verified = 0").fetchone()[0]
        policy_violations = conn.execute("SELECT COUNT(*) FROM governance_decisions WHERE policy_passed = 0").fetchone()[0]
        active_workflows = conn.execute("SELECT COUNT(*) FROM workflows WHERE status IN ('EXECUTING', 'PAUSED')").fetchone()[0]

        return {
            "total_decisions": total_eval,
            "actions_evaluated": total_eval,
            "allowed": allowed,
            "blocked": blocked,
            "human_reviews_pending": human_review,
            "human_review": human_review,
            "total_human_reviews": total_reviews,
            "reliability_score": reliability,
            "evidence_mismatches": evidence_mismatches,
            "policy_violations": policy_violations,
            "active_workflows": active_workflows
        }

repo = Repository()
