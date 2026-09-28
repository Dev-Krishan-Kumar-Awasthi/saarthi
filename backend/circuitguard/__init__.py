from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import router

app = FastAPI(
    title="CircuitGuard API",
    description="Real-Time Circuit Breaker for Autonomous AI - OpenTelemetry Tracing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "HEALTHY", "service": "CircuitGuard", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "CircuitGuard API - Real-Time Safety for Autonomous AI"}
