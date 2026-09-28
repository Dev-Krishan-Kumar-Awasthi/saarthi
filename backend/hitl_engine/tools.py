import uuid
from datetime import datetime, timezone
from typing import Dict, Any

def execute_bank_transfer(source_account: str, destination_account: str, amount: float, currency: str = "INR", reason: str = "") -> Dict[str, Any]:
    """
    SIMULATED EXTERNAL ACTION:
    Simulates executing an irreversible inter-bank wire transfer.
    """
    tx_id = f"TXN-SIM-{uuid.uuid4().hex[:8].upper()}"
    return {
        "status": "EXECUTED",
        "action": "execute_bank_transfer",
        "simulated": True,
        "transaction_id": tx_id,
        "source_account": source_account,
        "destination_account": destination_account,
        "amount": amount,
        "currency": currency,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ledger_hash": f"sha256:{hash(tx_id) & 0xffffffff:08x}"
    }

def delete_customer_record(customer_id: str, reason: str = "") -> Dict[str, Any]:
    """
    SIMULATED EXTERNAL ACTION:
    Simulates deleting a record from the production database.
    """
    return {
        "status": "EXECUTED",
        "action": "delete_customer_record",
        "simulated": True,
        "customer_id": customer_id,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "affected_rows": 1
    }

def deploy_production_service(service_name: str, target_env: str = "production", release_version: str = "v2.4.0") -> Dict[str, Any]:
    """
    SIMULATED EXTERNAL ACTION:
    Simulates triggering a production container rollout.
    """
    return {
        "status": "EXECUTED",
        "action": "deploy_production_service",
        "simulated": True,
        "service_name": service_name,
        "target_env": target_env,
        "release_version": release_version,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def read_account_balance(account_id: str) -> Dict[str, Any]:
    """
    SAFE READ-ONLY ACTION:
    No external side effects.
    """
    return {
        "status": "SUCCESS",
        "action": "read_account_balance",
        "account_id": account_id,
        "balance": 150000.0,
        "currency": "INR",
        "simulated": True
    }
