"""
SAARTHI — Runtime Governance Layer for Autonomous AI Systems
FastAPI Application Entry Point
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import API_HOST, API_PORT, CORS_ORIGINS
from database.db import init_db
from seed import seed_initial_state

# Routers
from api_governance import router as governance_router
from api_agent import router as agent_router
from api_human_review import router as human_review_router
from api_audit import router as audit_router
from api_dashboard import router as dashboard_router

# CircuitGuard Router
try:
    from circuitguard.api import router as circuitguard_router
except Exception as e:
    print(f"Warning loading circuitguard router: {e}")
    circuitguard_router = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite tables and seed baseline if empty
    init_db()
    seed_initial_state()
    print("SAARTHI Runtime Governance Engine initialized with SQLite persistence.")
    yield
    # Shutdown
    print("SAARTHI Runtime Governance Engine shutdown.")

app = FastAPI(
    title="SAARTHI Runtime Governance API",
    description="Authoritative AI-agent runtime governance and safety platform.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(dashboard_router)
app.include_router(governance_router)
app.include_router(agent_router)
app.include_router(human_review_router)
app.include_router(audit_router)

if circuitguard_router:
    app.include_router(circuitguard_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
