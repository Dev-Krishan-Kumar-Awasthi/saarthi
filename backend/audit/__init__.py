"""
SAARTHI — Tamper-Evident SHA-256 Audit Trail Module
Persists events into SQLite and links each event cryptographically to the preceding event.
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

try:
    from database.repository import repo
except ImportError:
    from ..database.repository import repo

def canonicalize(data: Any) -> str:
    """Produces deterministic canonical JSON string."""
    return json.dumps(data, sort_keys=True, separators=(',', ':'), default=str)

def compute_hash(previous_hash: str, event_body: Dict[str, Any]) -> str:
    """Computes SHA-256 hash linking previous hash and event payload."""
    payload_str = canonicalize(event_body)
    content = f"{previous_hash}:{payload_str}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def record_audit_event(
    actor: str,
    event_type: str,
    payload: Dict[str, Any],
    workflow_id: Optional[str] = None
) -> Dict[str, Any]:
    """Records an audit event into persistent SQLite storage with a SHA-256 hash link."""
    latest = repo.get_latest_audit_event()
    previous_hash = latest["current_hash"] if latest else "GENESIS"
    
    event_id = f"EVT-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{hashlib.md5(canonicalize(payload).encode()).hexdigest()[:6]}"
    timestamp = datetime.now(timezone.utc).isoformat()
    
    event_data = {
        "id": event_id,
        "timestamp": timestamp,
        "actor": actor,
        "event_type": event_type,
        "workflow_id": workflow_id,
        "payload": payload
    }
    
    current_hash = compute_hash(previous_hash, event_data)
    
    record = {
        **event_data,
        "previous_hash": previous_hash,
        "current_hash": current_hash,
        "integrity": "VERIFIED"
    }
    
    repo.save_audit_event(record)
    return record

def verify_audit_chain() -> Dict[str, Any]:
    """
    Verifies the entire cryptographic SHA-256 chain from GENESIS to the latest record.
    Returns: { valid: bool, total_events: int, broken_at: Optional[str] }
    """
    events = repo.get_all_audit_events_ascending()
    if not events:
        return {"valid": True, "total_events": 0, "broken_at": None, "message": "Genesis chain (empty ledger)"}
    
    expected_prev = "GENESIS"
    for ev in events:
        if ev["previous_hash"] != expected_prev:
            return {
                "valid": False,
                "total_events": len(events),
                "broken_at": ev["id"],
                "message": f"Hash chain broken at event {ev['id']}: previous_hash mismatch"
            }
        
        event_data = {
            "id": ev["id"],
            "timestamp": ev["timestamp"],
            "actor": ev["actor"],
            "event_type": ev["event_type"],
            "workflow_id": ev.get("workflow_id"),
            "payload": ev.get("payload", {})
        }
        recomputed = compute_hash(expected_prev, event_data)
        if recomputed != ev["current_hash"]:
            return {
                "valid": False,
                "total_events": len(events),
                "broken_at": ev["id"],
                "message": f"Tampering detected at event {ev['id']}: payload does not match current_hash"
            }
        expected_prev = ev["current_hash"]
        
    return {
        "valid": True,
        "total_events": len(events),
        "broken_at": None,
        "latest_hash": expected_prev,
        "message": f"Audit chain verified across all {len(events)} events"
    }
