"""
SAARTHI — TrustBridge Human Oversight (HITL) Router
Manages persistent review checkpoints, approval, modification, rejection, and workflow resumption.
All actions update authoritative SQLite state and record SHA-256 audit events.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

try:
    from database.repository import repo
    from audit import record_audit_event
except ImportError:
    from .database.repository import repo
    from .audit import record_audit_event

router = APIRouter(tags=["TrustBridge HITL"])

class ReviewActionRequest(BaseModel):
    decision: Optional[str] = None
    modified_amount: Optional[float] = None
    modified_parameters: Optional[Dict[str, Any]] = None
    reason: Optional[str] = "Operator review decision"

@router.get("/api/hitl/metrics")
def get_hitl_metrics():
    reviews = repo.list_human_reviews()
    pending = len([r for r in reviews if r.get("status") == "PENDING"])
    approved = len([r for r in reviews if r.get("status") == "APPROVED"])
    modified = len([r for r in reviews if r.get("status") == "MODIFIED"])
    rejected = len([r for r in reviews if r.get("status") == "REJECTED"])
    return {
        "active_workflows": pending,
        "waiting_for_human": pending,
        "approved": approved,
        "modified": modified,
        "rejected": rejected,
        "completed": approved + modified + rejected
    }

@router.get("/api/hitl/audit")
def get_hitl_audit():
    return repo.list_audit_events(limit=50)

# ── List & Detail Endpoints ──

@router.get("/api/human-review")
@router.get("/api/hitl/requests")
def list_pending_reviews(status: Optional[str] = None):
    """Returns human review requests from SQLite."""
    reviews = repo.list_human_reviews(status=status)
    enriched = []
    for r in reviews:
        amt = float(r.get("amount", 0.0))
        enriched.append({
            **r,
            "action": "customer_refund",
            "customer_id": r.get("customer", ""),
            "original_parameters": {
                "amount": amt,
                "customer_id": r.get("customer", ""),
                "order_id": r.get("order_id", ""),
                "source_account": "ACC-CORP-01",
                "destination_account": "ACC-CUST-8831"
            },
            "agent_context": {
                "customer": r.get("customer", ""),
                "order_id": r.get("order_id", ""),
                "beneficiary": "Customer Wallet",
                "invoice_id": r.get("order_id", "")
            }
        })
    return enriched

@router.get("/api/human-review/{review_id}")
@router.get("/api/hitl/requests/{review_id}")
def get_human_review_detail(review_id: str):
    """Returns human review details along with its persistent checkpoint state."""
    rev = repo.get_human_review(review_id)
    if not rev:
        raise HTTPException(status_code=404, detail="Review request not found")
    
    checkpoint = None
    if rev.get("checkpoint_id"):
        checkpoint = repo.get_checkpoint(rev["checkpoint_id"])
    
    return {
        **rev,
        "checkpoint": checkpoint
    }

# ── Approve ──

@router.post("/api/human-review/{review_id}/approve")
@router.post("/api/hitl/requests/{review_id}/approve")
def approve_review(review_id: str, body: Optional[ReviewActionRequest] = None):
    """
    Operator approves consequential action.
    Resumes the paused checkpoint and marks the workflow completed.
    """
    rev = repo.get_human_review(review_id)
    if not rev:
        raise HTTPException(status_code=404, detail="Review request not found")

    now = datetime.now(timezone.utc).isoformat()

    # 1. Update review in SQLite
    rev["status"] = "APPROVED"
    rev["decision"] = "APPROVED"
    rev["decided_at"] = now
    repo.save_human_review(rev)

    # 2. Resume Checkpoint
    if rev.get("checkpoint_id"):
        cp = repo.get_checkpoint(rev["checkpoint_id"])
        if cp:
            cp["status"] = "RESUMED"
            cp["resumed_at"] = now
            repo.save_checkpoint(cp)

    # 3. Resume & Complete Workflow in SQLite
    wf = repo.get_workflow(rev["workflow_id"])
    if wf:
        wf["status"] = "COMPLETED"
        wf["progress"] = 100
        wf["current_step"] = "Completed — Human Approved"
        wf["decision"] = "APPROVED"
        wf["completed_at"] = now
        repo.save_workflow(wf)

    # 4. Audit Trail
    record_audit_event("HUMAN", "HUMAN_APPROVED", {
        "review_id": review_id,
        "workflow_id": rev["workflow_id"],
        "reason": body.reason if body else "Approved by human compliance operator"
    }, workflow_id=rev["workflow_id"])

    return {
        "status": "approved",
        "review_id": review_id,
        "workflow_id": rev["workflow_id"],
        "message": "Action approved; checkpoint resumed and workflow completed."
    }

# ── Modify ──

@router.post("/api/human-review/{review_id}/modify")
@router.post("/api/hitl/requests/{review_id}/modify")
def modify_review(review_id: str, body: ReviewActionRequest):
    """
    Operator modifies parameters/amount (e.g. adjusts refund from ₹8,500 down to ₹4,500).
    Resumes workflow under adjusted safe bounds.
    """
    rev = repo.get_human_review(review_id)
    if not rev:
        raise HTTPException(status_code=404, detail="Review request not found")

    now = datetime.now(timezone.utc).isoformat()
    new_amount = body.modified_amount
    if new_amount is None and body.modified_parameters and "amount" in body.modified_parameters:
        new_amount = float(body.modified_parameters["amount"])
    if new_amount is None:
        new_amount = rev["amount"]

    # 1. Update review in SQLite
    rev["status"] = "MODIFIED"
    rev["decision"] = "MODIFIED"
    rev["modified_amount"] = new_amount
    rev["decided_at"] = now
    repo.save_human_review(rev)

    # 2. Resume Checkpoint with modified state
    if rev.get("checkpoint_id"):
        cp = repo.get_checkpoint(rev["checkpoint_id"])
        if cp:
            cp["status"] = "RESUMED_MODIFIED"
            cp["resumed_at"] = now
            cp["state"]["amount"] = new_amount
            repo.save_checkpoint(cp)

    # 3. Resume & Complete Workflow with adjusted amount
    wf = repo.get_workflow(rev["workflow_id"])
    if wf:
        wf["status"] = "COMPLETED"
        wf["progress"] = 100
        wf["current_step"] = f"Completed — Human Modified (₹{new_amount:,.0f})"
        wf["amount"] = new_amount
        wf["decision"] = "MODIFIED"
        wf["completed_at"] = now
        repo.save_workflow(wf)

    # 4. Audit Trail
    record_audit_event("HUMAN", "HUMAN_MODIFIED", {
        "review_id": review_id,
        "workflow_id": rev["workflow_id"],
        "original_amount": rev["amount"],
        "modified_amount": new_amount,
        "reason": body.reason or "Modified parameters by human operator"
    }, workflow_id=rev["workflow_id"])

    return {
        "status": "modified",
        "review_id": review_id,
        "workflow_id": rev["workflow_id"],
        "new_amount": new_amount,
        "message": f"Action modified to ₹{new_amount:,.0f}; checkpoint resumed."
    }

# ── Reject ──

@router.post("/api/human-review/{review_id}/reject")
@router.post("/api/hitl/requests/{review_id}/reject")
def reject_review(review_id: str, body: Optional[ReviewActionRequest] = None):
    """
    Operator rejects the action.
    Terminates the checkpoint and blocks the workflow.
    """
    rev = repo.get_human_review(review_id)
    if not rev:
        raise HTTPException(status_code=404, detail="Review request not found")

    now = datetime.now(timezone.utc).isoformat()

    # 1. Update review in SQLite
    rev["status"] = "REJECTED"
    rev["decision"] = "REJECTED"
    rev["decided_at"] = now
    repo.save_human_review(rev)

    # 2. Terminate Checkpoint
    if rev.get("checkpoint_id"):
        cp = repo.get_checkpoint(rev["checkpoint_id"])
        if cp:
            cp["status"] = "TERMINATED"
            cp["resumed_at"] = now
            repo.save_checkpoint(cp)

    # 3. Block Workflow
    wf = repo.get_workflow(rev["workflow_id"])
    if wf:
        wf["status"] = "BLOCKED"
        wf["progress"] = 78
        wf["current_step"] = "Blocked — Operator Rejected"
        wf["decision"] = "REJECTED"
        wf["completed_at"] = now
        repo.save_workflow(wf)

    # 4. Audit Trail
    record_audit_event("HUMAN", "HUMAN_REJECTED", {
        "review_id": review_id,
        "workflow_id": rev["workflow_id"],
        "reason": body.reason if body else "Rejected by human compliance operator"
    }, workflow_id=rev["workflow_id"])

    return {
        "status": "rejected",
        "review_id": review_id,
        "workflow_id": rev["workflow_id"],
        "message": "Action rejected; workflow safely terminated."
    }
