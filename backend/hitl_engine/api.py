from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from .workflow_manager import workflow_manager

router = APIRouter(tags=["TrustBridge HITL Engine"])

class WorkflowStartRequest(BaseModel):
    scenario: str = "bank_transfer"
    custom_params: Optional[Dict[str, Any]] = None

class ModifyRequest(BaseModel):
    modified_parameters: Dict[str, Any]
    reason: Optional[str] = "Modified by compliance reviewer"

class RejectRequest(BaseModel):
    reason: Optional[str] = "Beneficiary details need correction"

@router.post("/workflows/start")
def start_workflow(req: WorkflowStartRequest):
    try:
        return workflow_manager.start_workflow(req.scenario, req.custom_params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/workflows")
def list_workflows():
    return workflow_manager.get_workflows()

@router.get("/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    wf = workflow_manager.get_workflow(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

@router.get("/workflows/{workflow_id}/state")
def get_workflow_state(workflow_id: str):
    wf = workflow_manager.get_workflow(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {
        "workflow_id": wf["id"],
        "status": wf["status"],
        "current_step": wf["current_step"],
        "checkpoint": wf.get("checkpoint")
    }

@router.get("/hitl/requests")
def list_hitl_requests():
    return workflow_manager.get_hitl_requests()

@router.get("/hitl/requests/{request_id}")
def get_hitl_request(request_id: str):
    req = workflow_manager.get_hitl_request(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="HITL Request not found")
    return req

@router.post("/hitl/requests/{request_id}/approve")
def approve_hitl_request(request_id: str):
    try:
        return workflow_manager.approve_request(request_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/hitl/requests/{request_id}/modify")
def modify_hitl_request(request_id: str, body: ModifyRequest):
    try:
        return workflow_manager.modify_request(request_id, body.modified_parameters, body.reason or "")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/hitl/requests/{request_id}/reject")
def reject_hitl_request(request_id: str, body: RejectRequest):
    try:
        return workflow_manager.reject_request(request_id, body.reason or "")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/hitl/audit")
def get_hitl_audit():
    return workflow_manager.get_audit_trail()

@router.get("/hitl/metrics")
def get_hitl_metrics():
    return workflow_manager.get_metrics()
