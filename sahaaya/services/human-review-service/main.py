"""
Human Review Service - Standalone FastAPI App
Can run independently or be mounted in API Gateway.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api import router as review_router
from models import review_store, Alert, AlertStatus, AlertPriority, UserRole
from datetime import datetime
import uuid


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed with demo data if empty
    if not review_store.alerts:
        print("Seeding demo alerts...")
        seed_demo_data()
    yield
    print("Shutting down...")


app = FastAPI(
    title="SAHAAYA Human Review Service",
    description="Human-in-the-loop alert review and intervention tracking",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router)


def seed_demo_data():
    """Create sample alerts for testing"""
    demo_alerts = [
        Alert(
            alert_id="ALERT_DEMO_001",
            victim_id="VICTIM_0001",
            distress_score=68.6,
            band="Orange",
            priority=AlertPriority.MEDIUM,
            status=AlertStatus.NEW,
            narrative="The distress score of 68.6 is in the Orange band (significant concern, follow-up recommended). This is 38.6 points above the personal baseline of 30.0. Primary drivers: Self Report (+23.2), Text Emotion (+18.0). The trend shows worsening distress over recent weeks.",
            clinical_summary="DISTRESS ASSESSMENT SUMMARY\nVictim ID: VICTIM_0001\nCurrent Score: 68.6 (Orange Band)\nPersonal Baseline: 30.0\nTrend: Worsening\n7-day Escalation Risk: 82%\n30-day Escalation Risk: 100%\n\nKEY CONTRIBUTING FACTORS:\n1. Self Report: +23.2 points - Self-reported well-being indicates significant distress across mood, anxiety, sleep, safety, hopelessness, and isolation\n2. Text Emotion: +18.0 points - Text communications show strong indicators of fear, anger, hopelessness, or threat language\n3. Trend: +10.0 points - Distress trend shows clear worsening trajectory over recent weeks",
            primary_factors=[
                {"factor_name": "Self Report", "contribution": 23.2, "direction": "increasing", "description": "Self-reported well-being indicates significant distress", "confidence": 0.9},
                {"factor_name": "Text Emotion", "contribution": 18.0, "direction": "increasing", "description": "Text communications show strong indicators of fear, anger, hopelessness", "confidence": 0.85},
                {"factor_name": "Trend", "contribution": 10.0, "direction": "increasing", "description": "Distress trend shows clear worsening trajectory", "confidence": 0.9},
            ],
            recommended_actions=[
                "Schedule counsellor follow-up within 24 hours",
                "Review case timeline for upcoming stressors (court dates, hearings)",
                "Increase check-in frequency to daily",
            ],
            confidence=1.0,
        ),
        Alert(
            alert_id="ALERT_DEMO_002",
            victim_id="VICTIM_0004",
            distress_score=55.5,
            band="Orange",
            priority=AlertPriority.MEDIUM,
            status=AlertStatus.ASSIGNED,
            assigned_to="COUNSELLOR_001",
            assigned_role=UserRole.COUNSELLOR,
            assigned_at=datetime.utcnow(),
            narrative="The distress score of 55.5 is in the Orange band (significant concern, follow-up recommended). This is 12.8 points above the personal baseline of 42.8. Primary drivers: Text Emotion (+14.7), Self Report (+13.2). The trend shows worsening distress over recent weeks.",
            clinical_summary="DISTRESS ASSESSMENT SUMMARY\nVictim ID: VICTIM_0004\nCurrent Score: 55.5 (Orange Band)\nPersonal Baseline: 42.8\nTrend: Worsening\n7-day Escalation Risk: 67%\n30-day Escalation Risk: 84%\n\nKEY CONTRIBUTING FACTORS:\n1. Text Emotion: +14.7 points - Text communications show strong indicators of fear, anger, hopelessness\n2. Self Report: +13.2 points - Self-reported well-being indicates significant distress\n3. Trend: +10.0 points - Distress trend shows worsening trajectory",
            primary_factors=[
                {"factor_name": "Text Emotion", "contribution": 14.7, "direction": "increasing", "description": "Text communications show strong indicators of fear, anger, hopelessness", "confidence": 0.85},
                {"factor_name": "Self Report", "contribution": 13.2, "direction": "increasing", "description": "Self-reported well-being indicates significant distress", "confidence": 0.9},
                {"factor_name": "Trend", "contribution": 10.0, "direction": "increasing", "description": "Distress trend shows worsening trajectory", "confidence": 0.9},
            ],
            recommended_actions=[
                "Schedule counsellor follow-up within 24 hours",
                "Increase check-in frequency to daily",
                "Coordinate with legal team on upcoming hearings",
            ],
            confidence=0.95,
        ),
        Alert(
            alert_id="ALERT_DEMO_003",
            victim_id="VICTIM_0002",
            distress_score=48.3,
            band="Yellow",
            priority=AlertPriority.LOW,
            status=AlertStatus.NEW,
            narrative="The distress score of 48.3 falls in the Yellow band (mild/emerging concern). This represents a 18.3-point increase from the personal baseline of 30.0. Primary drivers: Self Report (+16.9), Text Emotion (+12.2). The trend shows worsening distress over recent weeks.",
            clinical_summary="DISTRESS ASSESSMENT SUMMARY\nVictim ID: VICTIM_0002\nCurrent Score: 48.3 (Yellow Band)\nPersonal Baseline: 30.0\nTrend: Worsening\n7-day Escalation Risk: 58%\n30-day Escalation Risk: 73%\n\nKEY CONTRIBUTING FACTORS:\n1. Self Report: +16.9 points - Self-reported well-being shows moderate concerns\n2. Text Emotion: +12.2 points - Text communications show negative emotional content\n3. Trend: +9.3 points - Distress trend shows slight upward movement",
            primary_factors=[
                {"factor_name": "Self Report", "contribution": 16.9, "direction": "increasing", "description": "Self-reported well-being shows moderate concerns", "confidence": 0.85},
                {"factor_name": "Text Emotion", "contribution": 12.2, "direction": "increasing", "description": "Text communications show some negative emotional content", "confidence": 0.8},
                {"factor_name": "Trend", "contribution": 9.3, "direction": "increasing", "description": "Distress trend shows slight upward movement", "confidence": 0.8},
            ],
            recommended_actions=[
                "Schedule counsellor check-in within 72 hours",
                "Monitor for escalation, increase check-in frequency",
                "Review self-report trends for specific domains",
            ],
            confidence=0.9,
        ),
    ]
    
    for alert in demo_alerts:
        review_store.create_alert(alert)
    
    print(f"Seeded {len(demo_alerts)} demo alerts")


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "human-review",
        "alerts_count": len(review_store.alerts),
        "interventions_count": len(review_store.interventions),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)