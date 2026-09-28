"""
SAARTHI — SQLite Database Module
Manages tables, connections, and schemas for persistent governance state.
"""
import sqlite3
import threading
from pathlib import Path
try:
    from config import DATABASE_PATH
except ImportError:
    from ..config import DATABASE_PATH

_local = threading.local()

def get_connection() -> sqlite3.Connection:
    """Returns a thread-local SQLite connection with dictionary-like row access."""
    if not hasattr(_local, "conn") or _local.conn is None:
        db_path = Path(DATABASE_PATH)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA foreign_keys = ON")
        _local.conn = conn
    return _local.conn


def init_db():
    """Initializes tables and indexes."""
    conn = get_connection()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS workflows (
            id TEXT PRIMARY KEY,
            scenario_id TEXT NOT NULL,
            objective TEXT NOT NULL,
            customer TEXT,
            order_id TEXT,
            amount REAL DEFAULT 0,
            status TEXT NOT NULL,
            progress INTEGER DEFAULT 0,
            current_step TEXT,
            decision TEXT,
            decision_reason TEXT,
            risk_overall INTEGER DEFAULT 0,
            risk_level TEXT DEFAULT 'LOW',
            started_at TEXT NOT NULL,
            completed_at TEXT,
            updated_at TEXT NOT NULL,
            payload_json TEXT
        );

        CREATE TABLE IF NOT EXISTS governance_decisions (
            id TEXT PRIMARY KEY,
            workflow_id TEXT NOT NULL,
            action TEXT NOT NULL,
            decision TEXT NOT NULL,
            reason TEXT NOT NULL,
            reasons_json TEXT,
            risk_overall INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            risk_factors_json TEXT,
            evidence_verified INTEGER NOT NULL,
            policy_passed INTEGER NOT NULL,
            ml_anomaly_score REAL,
            ml_is_anomaly INTEGER,
            ml_explanation TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS human_reviews (
            id TEXT PRIMARY KEY,
            workflow_id TEXT NOT NULL,
            customer TEXT,
            order_id TEXT,
            amount REAL DEFAULT 0,
            modified_amount REAL,
            risk_overall INTEGER,
            risk_level TEXT,
            reason TEXT NOT NULL,
            status TEXT NOT NULL,
            decision TEXT,
            checkpoint_id TEXT,
            created_at TEXT NOT NULL,
            decided_at TEXT
        );

        CREATE TABLE IF NOT EXISTS workflow_checkpoints (
            id TEXT PRIMARY KEY,
            workflow_id TEXT NOT NULL,
            review_id TEXT,
            action_name TEXT NOT NULL,
            state_json TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            resumed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            actor TEXT NOT NULL,
            event_type TEXT NOT NULL,
            workflow_id TEXT,
            payload_json TEXT NOT NULL,
            previous_hash TEXT NOT NULL,
            current_hash TEXT NOT NULL,
            integrity TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS agent_runs (
            id TEXT PRIMARY KEY,
            workflow_id TEXT NOT NULL,
            agent_id TEXT NOT NULL,
            scenario TEXT NOT NULL,
            status TEXT NOT NULL,
            iterations INTEGER DEFAULT 0,
            tokens_used INTEGER DEFAULT 0,
            tool_calls INTEGER DEFAULT 0,
            failed_calls INTEGER DEFAULT 0,
            halt_reason TEXT,
            trace_id TEXT,
            started_at TEXT NOT NULL,
            ended_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
        CREATE INDEX IF NOT EXISTS idx_human_reviews_status ON human_reviews(status);
        """)
