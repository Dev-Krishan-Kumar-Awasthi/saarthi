import uuid
import asyncio
from datetime import datetime
from typing import List, Optional
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource

# Setup OTel provider
resource = Resource.create({"service.name": "circuitguard", "service.version": "1.0.0"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(provider)

tracer = trace.get_tracer("circuitguard.agent", "1.0.0")


def new_trace_id() -> str:
    return f"tr_{uuid.uuid4().hex[:8]}"


def new_span_id() -> str:
    return f"sp_{uuid.uuid4().hex[:6]}"


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def create_otel_span(
    span_name: str,
    attributes: dict,
    parent_span=None,
) -> trace.Span:
    """Create an OpenTelemetry span with given attributes."""
    ctx = trace.set_span_in_context(parent_span) if parent_span else None
    span = tracer.start_span(span_name, context=ctx)
    for k, v in attributes.items():
        span.set_attribute(k, str(v))
    return span
