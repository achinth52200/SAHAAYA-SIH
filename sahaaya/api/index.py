"""
Vercel serverless entry point for the SAHAAYA API.

This mounts the *real* gateway from services/api-gateway/main.py: the distress
engine, the explainability layer and the lightweight emotion classifier running
over the synthetic dataset.

It replaces an earlier stub that derived every distress score arithmetically from
the victim ID (`25 + ((number * 17) % 70)`) and never loaded the model. That stub
is kept alongside as index_mock_backup.py for reference only - it must not be
served, because it puts invented numbers in front of reviewers.

Two things differ from running uvicorn locally:

  * Serverless runtimes do not reliably execute ASGI lifespan events, so the
    models and dataset are initialised lazily on the first request via
    initialise_runtime(), which is idempotent.
  * Each cold instance starts with an empty in-memory review store, so alerts are
    seeded from the engine on demand rather than assumed to already exist.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GATEWAY = ROOT / "services" / "api-gateway"

# main.py derives its own BASE from __file__ and inserts the sibling service
# directories onto sys.path, so it only needs to be importable from here.
if str(GATEWAY) not in sys.path:
    sys.path.insert(0, str(GATEWAY))

import main as gateway  # noqa: E402
from main import app  # noqa: E402  (re-exported as the ASGI handler)


@app.middleware("http")
async def ensure_runtime_loaded(request, call_next):
    """Populate models and data on the first request handled by this instance."""
    gateway.initialise_runtime()
    return await call_next(request)


# Vercel's Python runtime looks for a module-level ASGI app.
__all__ = ["app"]
