"""
Build api/snapshot.json from real engine output.

The Vercel demo API (api/index.py) serves a snapshot rather than running live
inference, because the real stack (scikit-learn, pandas, scipy, xgboost) bundles
well past Vercel's 500 MB function limit. The snapshot must therefore be genuine
output from the same code the Render/Docker deployment runs live — this script
boots the real api-gateway app in-process, exercises its routes, and records the
responses verbatim.

Nothing here invents a score, a band or an explanation. Every value written to
snapshot.json came out of DistressEngine / ExplainabilityEngine / the emotion
classifier over the synthetic dataset in services/nlp-ai-service/data/synthetic.

Run it whenever the engine or the dataset changes:

    python scripts/build_snapshot.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "services" / "api-gateway"))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402


def get(client: TestClient, path: str):
    response = client.get(path)
    response.raise_for_status()
    return response.json()


def build() -> dict:
    main.initialise_runtime()

    with TestClient(main.app) as client:
        # Alerts are derived from current scores, so they have to be regenerated
        # before they are read, or the snapshot would carry alerts for a previous
        # version of the dataset.
        client.post("/api/v1/review/alerts/generate").raise_for_status()

        victims = get(client, "/api/v1/victims")
        snapshot = {
            "generated_from": "services/api-gateway (real DistressEngine + ExplainabilityEngine)",
            "victims": victims,
            "detail": {},
            "distress": {},
            "history": {},
            "explanation": {},
            "alerts": get(client, "/api/v1/review/alerts?limit=200"),
            "review_summary": get(client, "/api/v1/review/stats/summary"),
            "national": get(client, "/api/v1/dashboard/national"),
        }

        for victim in victims:
            vid = victim["victim_id"]
            snapshot["detail"][vid] = get(client, f"/api/v1/victims/{vid}")
            snapshot["distress"][vid] = get(client, f"/api/v1/victims/{vid}/distress")
            snapshot["history"][vid] = get(client, f"/api/v1/victims/{vid}/distress/history")
            snapshot["explanation"][vid] = get(client, f"/api/v1/victims/{vid}/explanation")
            print(f"  captured {vid}")

    return snapshot


def main_() -> None:
    snapshot = build()
    out = ROOT / "api" / "snapshot.json"
    out.write_text(json.dumps(snapshot, indent=1, default=str), encoding="utf-8")

    bands: dict[str, int] = {}
    for victim in snapshot["victims"]:
        band = victim.get("latest_band", "?")
        bands[band] = bands.get(band, 0) + 1

    size_kb = out.stat().st_size / 1024
    print(f"\nWrote {out.relative_to(ROOT)} ({size_kb:.0f} KB)")
    print(f"  victims: {len(snapshot['victims'])}")
    print(f"  alerts:  {len(snapshot['alerts'])}")
    print(f"  bands:   {bands}")


if __name__ == "__main__":
    main_()
