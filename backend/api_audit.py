"""
SAARTHI — Audit Trail API Router
Exposes the persistent, tamper-evident SHA-256 audit ledger and verification endpoint.
"""
from fastapi import APIRouter
from typing import Optional, List, Dict, Any

try:
    from database.repository import repo
    from audit import verify_audit_chain
except ImportError:
    from .database.repository import repo
    from .audit import verify_audit_chain

router = APIRouter(tags=["Audit Trail"])

@router.get("/api/audit")
@router.get("/api/hitl/audit")
def list_audit_events(limit: int = 100):
    """Returns persistent audit log entries ordered newest first."""
    return repo.list_audit_events(limit=limit)

@router.get("/api/audit/verify")
def verify_hash_chain():
    """
    Verifies every link in the SHA-256 hash chain from GENESIS to the latest record.
    Returns whether the ledger integrity is intact or if any event payload was altered.
    """
    return verify_audit_chain()
