import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "trustbridge.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        task TEXT,
        status TEXT,
        current_step TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflow_checkpoints (
        id TEXT PRIMARY KEY,
        workflow_id TEXT,
        checkpoint_id TEXT,
        current_step TEXT,
        completed_steps TEXT,
        pending_step TEXT,
        agent_context TEXT,
        proposed_action TEXT,
        tool_name TEXT,
        tool_parameters TEXT,
        created_at TEXT,
        updated_at TEXT,
        human_decision TEXT,
        human_reason TEXT,
        modified_parameters TEXT,
        resume_status TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hitl_requests (
        id TEXT PRIMARY KEY,
        workflow_id TEXT,
        checkpoint_id TEXT,
        action TEXT,
        risk_level TEXT,
        status TEXT,
        original_parameters TEXT,
        modified_parameters TEXT,
        human_decision TEXT,
        human_reason TEXT,
        created_at TEXT,
        resolved_at TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id),
        FOREIGN KEY (checkpoint_id) REFERENCES workflow_checkpoints(checkpoint_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        workflow_id TEXT,
        checkpoint_id TEXT,
        event_type TEXT,
        actor TEXT,
        payload TEXT,
        timestamp TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()
