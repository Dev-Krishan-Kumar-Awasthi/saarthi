import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from .database import get_connection
from .policies import evaluate_action_policy
from .tools import execute_bank_transfer, delete_customer_record, deploy_production_service, read_account_balance

class WorkflowManager:
    """
    TrustBridge State-Preserving HITL Workflow Orchestrator.
    Manages checkpoints, pause gates, and resumption from SQLite.
    """

    def __init__(self):
        pass

    def start_workflow(self, scenario_type: str = "bank_transfer", custom_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Starts an autonomous workflow. Runs through preparatory steps until a consequential action is reached.
        """
        workflow_id = f"wf_{uuid.uuid4().hex[:6]}"
        now = datetime.now(timezone.utc).isoformat()

        conn = get_connection()
        cursor = conn.cursor()

        if scenario_type == "bank_transfer":
            task_name = "Transfer ₹25,000 from Account A to Account B"
            current_step = "execute_transfer"
            completed_steps = [
                "receive_request",
                "verify_customer",
                "check_balance",
                "validate_beneficiary"
            ]
            pending_step = "execute_transfer"
            context = {
                "customer": "Rahul Sharma",
                "customer_id": "CUST-9921",
                "invoice_id": "INV-20481",
                "source_balance": 150000,
                "reason": "Approved invoice payment",
                "beneficiary": "Acme Tech Solutions",
                "verification_checks": {
                    "identity_verified": True,
                    "balance_sufficient": True,
                    "beneficiary_active": True,
                    "anti_fraud_score": 12
                }
            }
            proposed_action = {
                "tool": "execute_bank_transfer",
                "amount": 25000,
                "currency": "INR",
                "source_account": "ACC-1001",
                "destination_account": "ACC-2044",
                "reason": "Approved invoice payment"
            }
            tool_name = "execute_bank_transfer"
            tool_parameters = proposed_action

        elif scenario_type == "database_mutation":
            task_name = "Permanent Cleanup: Delete Inactive Customer Record"
            current_step = "delete_record"
            completed_steps = ["query_inactivity", "verify_zero_balance", "archive_audit_log"]
            pending_step = "delete_record"
            context = {
                "customer_id": "CUST-OLD-4412",
                "name": "Inactive Enterprise Account",
                "inactivity_days": 730,
                "reason": "GDPR compliance purge"
            }
            proposed_action = {
                "tool": "delete_customer_record",
                "customer_id": "CUST-OLD-4412",
                "reason": "GDPR right to be forgotten compliance"
            }
            tool_name = "delete_customer_record"
            tool_parameters = proposed_action

        elif scenario_type == "production_deploy":
            task_name = "Deploy v2.4.0 Container to Cloud Production"
            current_step = "deploy_service"
            completed_steps = ["run_unit_tests", "build_docker_image", "smoke_test_staging"]
            pending_step = "deploy_service"
            context = {
                "service_name": "payments-core",
                "target_env": "production",
                "release_version": "v2.4.0",
                "change_summary": "High-throughput webhook worker upgrade"
            }
            proposed_action = {
                "tool": "deploy_production_service",
                "service_name": "payments-core",
                "target_env": "production",
                "release_version": "v2.4.0"
            }
            tool_name = "deploy_production_service"
            tool_parameters = proposed_action

        elif scenario_type == "safe_query":
            # Safe read-only action: NO HITL required, completes immediately!
            task_name = "Query Account Ledger Balance"
            cursor.execute("""
            INSERT INTO workflows (id, task, status, current_step, created_at, updated_at)
            VALUES (?, ?, 'COMPLETED', 'completed', ?, ?)
            """, (workflow_id, task_name, now, now))
            
            result = read_account_balance("ACC-1001")
            
            cursor.execute("""
            INSERT INTO audit_events (id, workflow_id, checkpoint_id, event_type, actor, payload, timestamp)
            VALUES (?, ?, ?, 'SAFE_EXECUTION_COMPLETED', 'AGENT', ?, ?)
            """, (str(uuid.uuid4()), workflow_id, "cp_safe", json.dumps({"action": "read_account_balance", "result": result}), now))
            
            conn.commit()
            conn.close()

            return {
                "workflow_id": workflow_id,
                "status": "COMPLETED",
                "message": "Safe read-only action executed automatically without requiring HITL pause.",
                "requires_hitl": False,
                "result": result
            }
        else:
            raise ValueError(f"Unknown scenario: {scenario_type}")

        # Check policy
        requires_hitl, risk, reason = evaluate_action_policy(tool_name, tool_parameters)

        checkpoint_id = f"cp_{uuid.uuid4().hex[:6]}"
        request_id = f"hitl_{uuid.uuid4().hex[:6]}"

        status = "WAITING_FOR_HUMAN" if requires_hitl else "COMPLETED"

        # 1. Insert Workflow
        cursor.execute("""
        INSERT INTO workflows (id, task, status, current_step, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (workflow_id, task_name, status, current_step, now, now))

        # 2. Persist Checkpoint (Serialized State)
        cursor.execute("""
        INSERT INTO workflow_checkpoints (
            id, workflow_id, checkpoint_id, current_step, completed_steps,
            pending_step, agent_context, proposed_action, tool_name,
            tool_parameters, created_at, updated_at, resume_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), workflow_id, checkpoint_id, current_step,
            json.dumps(completed_steps), pending_step, json.dumps(context),
            json.dumps(proposed_action), tool_name, json.dumps(tool_parameters),
            now, now, "PENDING"
        ))

        # 3. Create HITL Request if required
        if requires_hitl:
            cursor.execute("""
            INSERT INTO hitl_requests (
                id, workflow_id, checkpoint_id, action, risk_level,
                status, original_parameters, created_at
            ) VALUES (?, ?, ?, ?, ?, 'WAITING_FOR_HUMAN', ?, ?)
            """, (
                request_id, workflow_id, checkpoint_id, tool_name, risk,
                json.dumps(tool_parameters), now
            ))

            # 4. Audit Log: Workflow Paused
            cursor.execute("""
            INSERT INTO audit_events (id, workflow_id, checkpoint_id, event_type, actor, payload, timestamp)
            VALUES (?, ?, ?, 'WORKFLOW_PAUSED_AT_GATE', 'HITL_GATE', ?, ?)
            """, (
                str(uuid.uuid4()), workflow_id, checkpoint_id,
                json.dumps({
                    "consequential_action": tool_name,
                    "risk_level": risk,
                    "reason": reason,
                    "saved_checkpoint": checkpoint_id
                }), now
            ))

        conn.commit()
        conn.close()

        return {
            "workflow_id": workflow_id,
            "checkpoint_id": checkpoint_id,
            "hitl_request_id": request_id,
            "status": status,
            "current_step": current_step,
            "proposed_action": proposed_action,
            "requires_hitl": requires_hitl,
            "risk_level": risk,
            "message": "Workflow paused at HITL safety gate. Complete state serialized and persisted to SQLite."
        }

    def get_workflows(self) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM workflows ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,))
        wf = cursor.fetchone()
        if not wf:
            conn.close()
            return None
        
        cursor.execute("SELECT * FROM workflow_checkpoints WHERE workflow_id = ? ORDER BY created_at DESC LIMIT 1", (workflow_id,))
        cp = cursor.fetchone()
        conn.close()

        res = dict(wf)
        if cp:
            cp_dict = dict(cp)
            cp_dict["completed_steps"] = json.loads(cp_dict["completed_steps"] or "[]")
            cp_dict["agent_context"] = json.loads(cp_dict["agent_context"] or "{}")
            cp_dict["proposed_action"] = json.loads(cp_dict["proposed_action"] or "{}")
            cp_dict["tool_parameters"] = json.loads(cp_dict["tool_parameters"] or "{}")
            res["checkpoint"] = cp_dict
        return res

    def get_hitl_requests(self) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT h.*, w.task, c.agent_context
        FROM hitl_requests h
        JOIN workflows w ON h.workflow_id = w.id
        JOIN workflow_checkpoints c ON h.checkpoint_id = c.checkpoint_id
        ORDER BY h.created_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        results = []
        for r in rows:
            item = dict(r)
            item["original_parameters"] = json.loads(item["original_parameters"] or "{}")
            item["modified_parameters"] = json.loads(item["modified_parameters"] or "{}")
            item["agent_context"] = json.loads(item["agent_context"] or "{}")
            results.append(item)
        return results

    def get_hitl_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT h.*, w.task, c.agent_context, c.completed_steps, c.current_step
        FROM hitl_requests h
        JOIN workflows w ON h.workflow_id = w.id
        JOIN workflow_checkpoints c ON h.checkpoint_id = c.checkpoint_id
        WHERE h.id = ?
        """, (request_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        item = dict(row)
        item["original_parameters"] = json.loads(item["original_parameters"] or "{}")
        item["modified_parameters"] = json.loads(item["modified_parameters"] or "{}")
        item["agent_context"] = json.loads(item["agent_context"] or "{}")
        item["completed_steps"] = json.loads(item["completed_steps"] or "[]")
        return item

    def approve_request(self, request_id: str, reviewer: str = "Compliance Officer") -> Dict[str, Any]:
        """
        Requirement 6: Restore saved state and resume agent to execute approved action.
        """
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM hitl_requests WHERE id = ?", (request_id,))
        req = cursor.fetchone()
        if not req:
            conn.close()
            raise ValueError(f"HITL request '{request_id}' not found")
        
        # Idempotency check (Requirement 29)
        if req["status"] in ["APPROVED", "MODIFIED", "REJECTED"]:
            conn.close()
            return {
                "status": "ALREADY_PROCESSED",
                "decision": req["status"],
                "message": f"This request was already finalized as {req['status']}"
            }

        workflow_id = req["workflow_id"]
        checkpoint_id = req["checkpoint_id"]
        action_name = req["action"]
        orig_params = json.loads(req["original_parameters"] or "{}")
        now = datetime.now(timezone.utc).isoformat()

        # Execute tool
        if action_name == "execute_bank_transfer":
            exec_result = execute_bank_transfer(
                source_account=orig_params.get("source_account", "ACC-1001"),
                destination_account=orig_params.get("destination_account", "ACC-2044"),
                amount=float(orig_params.get("amount", 25000)),
                currency=orig_params.get("currency", "INR"),
                reason=orig_params.get("reason", "Approved invoice")
            )
        elif action_name == "delete_customer_record":
            exec_result = delete_customer_record(orig_params.get("customer_id", "CUST-UNKNOWN"), orig_params.get("reason", ""))
        elif action_name == "deploy_production_service":
            exec_result = deploy_production_service(orig_params.get("service_name", "app"), orig_params.get("target_env", "production"))
        else:
            exec_result = {"status": "SUCCESS", "simulated": True}

        # Update HITL Request
        cursor.execute("""
        UPDATE hitl_requests
        SET status = 'APPROVED', human_decision = 'APPROVED', human_reason = 'Approved by human operator',
            resolved_at = ?
        WHERE id = ?
        """, (now, request_id))

        # Update Workflow
        cursor.execute("""
        UPDATE workflows
        SET status = 'COMPLETED', current_step = 'confirm_transaction', updated_at = ?
        WHERE id = ?
        """, (now, workflow_id))

        # Update Checkpoint
        cursor.execute("""
        UPDATE workflow_checkpoints
        SET resume_status = 'RESUMED_AND_COMPLETED', human_decision = 'APPROVED', updated_at = ?
        WHERE checkpoint_id = ?
        """, (now, checkpoint_id))

        # Audit Event
        cursor.execute("""
        INSERT INTO audit_events (id, workflow_id, checkpoint_id, event_type, actor, payload, timestamp)
        VALUES (?, ?, ?, 'WORKFLOW_RESUMED_ON_APPROVAL', ?, ?, ?)
        """, (
            str(uuid.uuid4()), workflow_id, checkpoint_id, reviewer,
            json.dumps({
                "decision": "APPROVED",
                "restored_checkpoint": checkpoint_id,
                "executed_action": action_name,
                "execution_result": exec_result
            }), now
        ))

        conn.commit()
        conn.close()

        return {
            "status": "APPROVED",
            "workflow_id": workflow_id,
            "checkpoint_id": checkpoint_id,
            "resume_from": "execute_transfer",
            "executed_action": action_name,
            "execution_result": exec_result,
            "message": "State restored from SQLite. Original workflow resumed and successfully completed."
        }

    def modify_request(self, request_id: str, modified_parameters: Dict[str, Any], reason: str = "", reviewer: str = "Compliance Officer") -> Dict[str, Any]:
        """
        Requirement 7: Apply modified parameters, restore state, and resume safely.
        """
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM hitl_requests WHERE id = ?", (request_id,))
        req = cursor.fetchone()
        if not req:
            conn.close()
            raise ValueError(f"HITL request '{request_id}' not found")

        if req["status"] in ["APPROVED", "MODIFIED", "REJECTED"]:
            conn.close()
            return {
                "status": "ALREADY_PROCESSED",
                "decision": req["status"],
                "message": f"This request was already finalized as {req['status']}"
            }

        workflow_id = req["workflow_id"]
        checkpoint_id = req["checkpoint_id"]
        action_name = req["action"]
        orig_params = json.loads(req["original_parameters"] or "{}")
        now = datetime.now(timezone.utc).isoformat()

        # Merge modified parameters onto original parameters
        final_params = dict(orig_params)
        final_params.update(modified_parameters)

        # Execute tool with MODIFIED parameters
        if action_name == "execute_bank_transfer":
            exec_result = execute_bank_transfer(
                source_account=final_params.get("source_account", "ACC-1001"),
                destination_account=final_params.get("destination_account", "ACC-2044"),
                amount=float(final_params.get("amount", 10000)),
                currency=final_params.get("currency", "INR"),
                reason=reason or "Modified by human reviewer"
            )
        elif action_name == "delete_customer_record":
            exec_result = delete_customer_record(final_params.get("customer_id", "CUST-UNKNOWN"), reason)
        elif action_name == "deploy_production_service":
            exec_result = deploy_production_service(final_params.get("service_name", "app"), final_params.get("target_env", "production"))
        else:
            exec_result = {"status": "SUCCESS", "simulated": True}

        # Update HITL Request
        cursor.execute("""
        UPDATE hitl_requests
        SET status = 'MODIFIED', human_decision = 'MODIFIED', human_reason = ?,
            modified_parameters = ?, resolved_at = ?
        WHERE id = ?
        """, (reason, json.dumps(modified_parameters), now, request_id))

        # Update Workflow
        cursor.execute("""
        UPDATE workflows
        SET status = 'COMPLETED', current_step = 'confirm_transaction', updated_at = ?
        WHERE id = ?
        """, (now, workflow_id))

        # Update Checkpoint
        cursor.execute("""
        UPDATE workflow_checkpoints
        SET resume_status = 'RESUMED_WITH_MODIFICATIONS', human_decision = 'MODIFIED',
            human_reason = ?, modified_parameters = ?, updated_at = ?
        WHERE checkpoint_id = ?
        """, (reason, json.dumps(modified_parameters), now, checkpoint_id))

        # Audit Event
        cursor.execute("""
        INSERT INTO audit_events (id, workflow_id, checkpoint_id, event_type, actor, payload, timestamp)
        VALUES (?, ?, ?, 'WORKFLOW_RESUMED_WITH_MODIFICATION', ?, ?, ?)
        """, (
            str(uuid.uuid4()), workflow_id, checkpoint_id, reviewer,
            json.dumps({
                "decision": "MODIFIED",
                "restored_checkpoint": checkpoint_id,
                "original_parameters": orig_params,
                "modified_parameters": modified_parameters,
                "executed_parameters": final_params,
                "reason": reason,
                "execution_result": exec_result
            }), now
        ))

        conn.commit()
        conn.close()

        return {
            "status": "MODIFIED",
            "workflow_id": workflow_id,
            "checkpoint_id": checkpoint_id,
            "resume_from": "execute_transfer",
            "original_parameters": orig_params,
            "modified_parameters": modified_parameters,
            "execution_result": exec_result,
            "message": "State restored from SQLite with human-modified parameters. Agent successfully resumed."
        }

    def reject_request(self, request_id: str, reason: str = "Beneficiary details require verification", reviewer: str = "Compliance Officer") -> Dict[str, Any]:
        """
        Requirement 8: Do NOT execute original action. Adapt workflow safely.
        """
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM hitl_requests WHERE id = ?", (request_id,))
        req = cursor.fetchone()
        if not req:
            conn.close()
            raise ValueError(f"HITL request '{request_id}' not found")

        if req["status"] in ["APPROVED", "MODIFIED", "REJECTED"]:
            conn.close()
            return {
                "status": "ALREADY_PROCESSED",
                "decision": req["status"],
                "message": f"This request was already finalized as {req['status']}"
            }

        workflow_id = req["workflow_id"]
        checkpoint_id = req["checkpoint_id"]
        now = datetime.now(timezone.utc).isoformat()

        # Update HITL Request
        cursor.execute("""
        UPDATE hitl_requests
        SET status = 'REJECTED', human_decision = 'REJECTED', human_reason = ?, resolved_at = ?
        WHERE id = ?
        """, (reason, now, request_id))

        # Workflow Adaptation: Return to 'validate_beneficiary'
        next_adaptive_step = "validate_beneficiary"
        cursor.execute("""
        UPDATE workflows
        SET status = 'ADAPTED', current_step = ?, updated_at = ?
        WHERE id = ?
        """, (next_adaptive_step, now, workflow_id))

        # Update Checkpoint
        cursor.execute("""
        UPDATE workflow_checkpoints
        SET resume_status = 'ACTION_BLOCKED_ADAPTED', human_decision = 'REJECTED', human_reason = ?, updated_at = ?
        WHERE checkpoint_id = ?
        """, (reason, now, checkpoint_id))

        # Audit Event
        cursor.execute("""
        INSERT INTO audit_events (id, workflow_id, checkpoint_id, event_type, actor, payload, timestamp)
        VALUES (?, ?, ?, 'ACTION_REJECTED_WORKFLOW_ADAPTED', ?, ?, ?)
        """, (
            str(uuid.uuid4()), workflow_id, checkpoint_id, reviewer,
            json.dumps({
                "decision": "REJECTED",
                "original_action_blocked": True,
                "reason": reason,
                "adaptive_fallback_step": next_adaptive_step
            }), now
        ))

        conn.commit()
        conn.close()

        return {
            "status": "REJECTED",
            "workflow_id": workflow_id,
            "checkpoint_id": checkpoint_id,
            "action_executed": False,
            "next_step": next_adaptive_step,
            "adaptation": "Original irreversible action was BLOCKED. Agent adapted workflow and returned to beneficiary verification.",
            "message": "Action safely blocked. Workflow adapted."
        }

    def get_audit_trail(self) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 100")
        rows = cursor.fetchall()
        conn.close()
        results = []
        for r in rows:
            item = dict(r)
            item["payload"] = json.loads(item["payload"] or "{}")
            results.append(item)
        return results

    def get_metrics(self) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT status, count(*) as count FROM workflows GROUP BY status")
        wf_stats = {r["status"]: r["count"] for r in cursor.fetchall()}

        cursor.execute("SELECT status, count(*) as count FROM hitl_requests GROUP BY status")
        req_stats = {r["status"]: r["count"] for r in cursor.fetchall()}
        conn.close()

        return {
            "total_workflows": sum(wf_stats.values()),
            "active_workflows": wf_stats.get("WAITING_FOR_HUMAN", 0),
            "waiting_for_human": req_stats.get("WAITING_FOR_HUMAN", 0),
            "approved": req_stats.get("APPROVED", 0),
            "modified": req_stats.get("MODIFIED", 0),
            "rejected": req_stats.get("REJECTED", 0),
            "completed": wf_stats.get("COMPLETED", 0) + wf_stats.get("ADAPTED", 0)
        }

# Global Singleton Manager
workflow_manager = WorkflowManager()
