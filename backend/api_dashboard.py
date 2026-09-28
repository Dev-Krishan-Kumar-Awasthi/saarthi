"""
SAARTHI — Dashboard & Workflows API Router
Provides single-source-of-truth metrics and workflow records from SQLite.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any, List

try:
    from database.repository import repo
    from database.db import get_connection, init_db
    from config import (
        MAX_AUTONOMOUS_REFUND, MAX_RETRY_ATTEMPTS,
        HIGH_RISK_THRESHOLD, CRITICAL_RISK_THRESHOLD
    )
except ImportError:
    from .database.repository import repo
    from .database.db import get_connection, init_db
    from .config import (
        MAX_AUTONOMOUS_REFUND, MAX_RETRY_ATTEMPTS,
        HIGH_RISK_THRESHOLD, CRITICAL_RISK_THRESHOLD
    )

router = APIRouter(tags=["Dashboard & Workflows"])

@router.get("/health")
def health_check():
    return {
        "status": "operational",
        "service": "SAARTHI Governance API",
        "version": "2.0.0"
    }

@router.get("/api/metrics")
def get_dashboard_metrics():
    """
    Computes key governance indicators directly from the authoritative SQLite database.
    """
    metrics = repo.get_metrics()
    metrics["governance_config"] = {
        "max_autonomous_refund": MAX_AUTONOMOUS_REFUND,
        "max_retry_attempts": MAX_RETRY_ATTEMPTS,
        "high_risk_threshold": HIGH_RISK_THRESHOLD,
        "critical_risk_threshold": CRITICAL_RISK_THRESHOLD,
    }
    return metrics

@router.get("/api/workflows")
def list_workflows(limit: int = 50):
    """Returns persistent workflows from SQLite."""
    return repo.list_workflows(limit=limit)

@router.get("/api/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    """Returns single workflow record from SQLite."""
    wf = repo.get_workflow(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

@router.post("/api/reset-demo")
def reset_demo_database():
    """
    Resets SQLite tables and repopulates baseline seed records.
    """
    conn = get_connection()
    with conn:
        conn.executescript("""
        DELETE FROM workflows;
        DELETE FROM governance_decisions;
        DELETE FROM human_reviews;
        DELETE FROM workflow_checkpoints;
        DELETE FROM audit_events;
        DELETE FROM agent_runs;
        """)
    try:
        from seed import seed_initial_state
    except ImportError:
        from .seed import seed_initial_state
    seed_initial_state()
    return {"message": "Database reset and seeded with initial baseline state"}
