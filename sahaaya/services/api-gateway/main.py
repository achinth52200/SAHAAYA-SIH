"""
SAHAAYA API Gateway - FastAPI Backend
Exposes the AI pipeline as REST endpoints for the frontend.
"""
import sys
import json
import os
import uuid
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

# Load .env file from project root (two levels up from this file)
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).parent.parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
        print(f"[ENV] Loaded environment from {_env_path}")
    else:
        # Try same dir as services/
        _env_path2 = Path(__file__).parent.parent / ".env"
        if _env_path2.exists():
            load_dotenv(_env_path2)
            print(f"[ENV] Loaded environment from {_env_path2}")
except ImportError:
    print("[ENV] python-dotenv not installed, using system env vars only")

from fastapi import FastAPI, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Add service paths
BASE = Path(__file__).parent.parent
if not (BASE / "nlp-ai-service").exists():
    BASE = Path(__file__).parent
sys.path.insert(0, str(BASE / "nlp-ai-service"))
sys.path.insert(0, str(BASE / "distress-engine"))
sys.path.insert(0, str(BASE / "explainability-service"))

from emotion_model_lightweight import predict_emotion, load_trained_model
from distress_engine import DistressEngine, DistressScoreResult
from explainability import ExplainabilityEngine


# Global state for models
class AppState:
    emotion_model = None
    vectorizer = None
    distress_engine = None
    explainability_engine = None
    synthetic_data = {}


app_state = AppState()
support_requests: List[Dict[str, Any]] = []

# Import human review service
import sys
import os
sys.path.insert(0, os.path.join(BASE, "human-review-service"))
from api import router as review_router, generate_alerts_from_distress_results
from models import review_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models and data on startup"""
    print("Loading models and data...")
    
    # Load emotion model
    model_path = BASE / "nlp-ai-service" / "models"
    app_state.emotion_model, app_state.vectorizer = load_trained_model(
        str(model_path / "emotion_classifier_lightweight.joblib"),
        str(model_path / "tfidf_vectorizer.joblib")
    )
    print("  Emotion model loaded")
    
    # Initialize engines
    app_state.distress_engine = DistressEngine()
    app_state.explainability_engine = ExplainabilityEngine(distress_engine=app_state.distress_engine)
    print("  Distress & Explainability engines initialized")
    
    # Load synthetic data
    data_dir = BASE / "nlp-ai-service" / "data" / "synthetic"
    app_state.synthetic_data = {
        "victims": pd.read_json(data_dir / "victims.jsonl", lines=True).to_dict("records"),
        "checkins": pd.read_json(data_dir / "checkins.jsonl", lines=True).to_dict("records"),
        "case_events": pd.read_json(data_dir / "case_events.jsonl", lines=True).to_dict("records"),
        "text_interactions": pd.read_json(data_dir / "text_interactions.jsonl", lines=True).to_dict("records"),
        "voice_features": pd.read_json(data_dir / "voice_features.jsonl", lines=True).to_dict("records"),
        "behavioural_patterns": pd.read_json(data_dir / "behavioural_patterns.jsonl", lines=True).to_dict("records"),
    }
    print(f"  Synthetic data loaded: {len(app_state.synthetic_data['victims'])} victims")
    
    yield
    
    print("Shutting down...")


app = FastAPI(
    title="SAHAAYA API",
    description="AI-Powered Mental Health Monitoring & Distress Prediction API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — read from env, fall back to safe defaults
_raw_cors = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
)
_cors_origins = [o.strip() for o in _raw_cors.split(",") if o.strip()]
print(f"[CORS] Allowing origins: {_cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include human review router
app.include_router(review_router)


# ===== Pydantic Models =====

class EmotionPredictionRequest(BaseModel):
    text: str = Field(..., description="Text to analyze for emotion")


class EmotionPredictionResponse(BaseModel):
    emotion: str
    confidence: float
    all_probabilities: Dict[str, float]


class VictimSummary(BaseModel):
    victim_id: str
    case_type: str
    district: str
    state: str
    preferred_language: str
    latest_score: Optional[float] = None
    latest_band: Optional[str] = None
    trend: Optional[str] = None


class DistressScoreRequest(BaseModel):
    victim_id: str
    checkin: Optional[Dict[str, Any]] = None
    text_interactions: Optional[List[Dict[str, Any]]] = None
    behavioural_patterns: Optional[List[Dict[str, Any]]] = None
    voice_features: Optional[List[Dict[str, Any]]] = None
    case_events: Optional[List[Dict[str, Any]]] = None
    historical_scores: Optional[List[float]] = None


class DistressScoreResponse(BaseModel):
    victim_id: str
    timestamp: str
    distress_score: float
    band: str
    components: Dict[str, float]
    personal_baseline: float
    contributing_factors: List[Dict[str, Any]]
    escalation_probability_7d: float
    escalation_probability_30d: float
    trend_direction: str
    confidence: float


class ExplanationResponse(BaseModel):
    victim_id: str
    timestamp: str
    distress_score: float
    band: str
    narrative: str
    clinical_summary: str
    recommended_actions: List[str]
    primary_factors: List[Dict[str, Any]]
    secondary_factors: List[Dict[str, Any]]
    protective_factors: List[Dict[str, Any]]
    risk_factors: List[Dict[str, Any]]
    counterfactuals: List[Dict[str, Any]]
    confidence: float
    requires_human_review: bool


class AlertResponse(BaseModel):
    alert_id: str
    victim_id: str
    timestamp: str
    distress_score: float
    band: str
    narrative: str
    clinical_summary: str
    primary_factors: List[Dict[str, Any]]
    recommended_actions: List[str]
    requires_human_review: bool


class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: bool
    data_loaded: bool


class DistressTrendPoint(BaseModel):
    date: str
    score: float
    band: str


class SupportRequestCreate(BaseModel):
    victim_id: str
    request_type: str = Field(..., description="urgent_safety, counselling, or legal_aid")
    message: Optional[str] = None


class SupportRequest(BaseModel):
    request_id: str
    victim_id: str
    request_type: str
    message: Optional[str]
    routed_roles: List[str]
    status: str
    created_at: str


class CheckinCreate(BaseModel):
    victim_id: str
    scores: Dict[str, float]
    message: Optional[str] = None


# ===== Helper Functions =====

def parse_ts(ts):
    """Parse timestamp from various formats"""
    if isinstance(ts, str):
        return datetime.fromisoformat(ts.replace('Z', '+00:00'))
    return ts


def get_victim_data(victim_id: str) -> Dict[str, List[Dict]]:
    """Get all data for a victim"""
    data = app_state.synthetic_data
    return {
        "profile": next((v for v in data["victims"] if v["victim_id"] == victim_id), None),
        "checkins": [c for c in data["checkins"] if c["victim_id"] == victim_id],
        "case_events": [c for c in data["case_events"] if c["victim_id"] == victim_id],
        "text_interactions": [c for c in data["text_interactions"] if c["victim_id"] == victim_id],
        "voice_features": [c for c in data["voice_features"] if c["victim_id"] == victim_id],
        "behavioural_patterns": [c for c in data["behavioural_patterns"] if c["victim_id"] == victim_id],
    }


def compute_latest_distress(victim_id: str) -> DistressScoreResult:
    """Compute latest distress score for a victim using synthetic data"""
    vdata = get_victim_data(victim_id)
    if not vdata["profile"]:
        raise HTTPException(status_code=404, detail="Victim not found")
    
    # Sort by date
    checkins = sorted(vdata["checkins"], key=lambda x: str(x["checkin_date"]))
    case_events = sorted(vdata["case_events"], key=lambda x: str(x["event_date"]))
    text_interactions = sorted(vdata["text_interactions"], key=lambda x: str(x["timestamp"]))
    voice_features = sorted(vdata["voice_features"], key=lambda x: str(x["timestamp"]))
    behavioural = sorted(vdata["behavioural_patterns"], key=lambda x: str(x["date"]))
    
    # Add predicted emotions to text
    for t in text_interactions:
        if "predicted_emotion" not in t:
            pred = predict_emotion(t["text"], app_state.emotion_model, app_state.vectorizer)
            t["predicted_emotion"] = pred["emotion"]
    
    # Compute historical scores
    historical_scores = []
    for checkin in checkins[:-1]:  # All but latest
        checkin_date = parse_ts(checkin["checkin_date"])
        week_cutoff = checkin_date + timedelta(days=7)
        
        week_texts = [t for t in text_interactions if parse_ts(t["timestamp"]) <= week_cutoff]
        week_voice = [v for v in voice_features if parse_ts(v["timestamp"]) <= week_cutoff]
        week_behaviour = [b for b in behavioural if parse_ts(b["date"]) <= week_cutoff]
        week_events = [e for e in case_events if parse_ts(e["event_date"]) <= week_cutoff]
        
        result = app_state.distress_engine.compute_distress_score(
            victim_id=victim_id,
            checkin=checkin,
            text_interactions=week_texts[-10:],
            behavioural_patterns=week_behaviour[-10:],
            voice_features=week_voice[-5:],
            case_events=week_events,
            historical_scores=historical_scores,
            emotion_model=app_state.emotion_model,
        )
        historical_scores.append(result.distress_score)
    
    # Latest score
    latest_checkin = checkins[-1]
    checkin_date = parse_ts(latest_checkin["checkin_date"])
    week_cutoff = checkin_date + timedelta(days=7)
    
    week_texts = [t for t in text_interactions if parse_ts(t["timestamp"]) <= week_cutoff]
    week_voice = [v for v in voice_features if parse_ts(v["timestamp"]) <= week_cutoff]
    week_behaviour = [b for b in behavioural if parse_ts(b["date"]) <= week_cutoff]
    week_events = [e for e in case_events if parse_ts(e["event_date"]) <= week_cutoff]
    
    return app_state.distress_engine.compute_distress_score(
        victim_id=victim_id,
        checkin=latest_checkin,
        text_interactions=week_texts[-10:],
        behavioural_patterns=week_behaviour[-10:],
        voice_features=week_voice[-5:],
        case_events=week_events,
        historical_scores=historical_scores,
        emotion_model=app_state.emotion_model,
    )


def compute_distress_trend(victim_id: str) -> List[Dict[str, Any]]:
    """
    Recompute the actual distress score at each historical check-in (real model
    inference per point, not fabricated) so the frontend can render a genuine trend
    line instead of a single latest-score point.
    """
    vdata = get_victim_data(victim_id)
    if not vdata["profile"]:
        raise HTTPException(status_code=404, detail="Victim not found")

    checkins = sorted(vdata["checkins"], key=lambda x: str(x["checkin_date"]))
    case_events = sorted(vdata["case_events"], key=lambda x: str(x["event_date"]))
    text_interactions = sorted(vdata["text_interactions"], key=lambda x: str(x["timestamp"]))
    voice_features = sorted(vdata["voice_features"], key=lambda x: str(x["timestamp"]))
    behavioural = sorted(vdata["behavioural_patterns"], key=lambda x: str(x["date"]))

    for t in text_interactions:
        if "predicted_emotion" not in t:
            pred = predict_emotion(t["text"], app_state.emotion_model, app_state.vectorizer)
            t["predicted_emotion"] = pred["emotion"]

    trend: List[Dict[str, Any]] = []
    historical_scores: List[float] = []
    for checkin in checkins:
        checkin_date = parse_ts(checkin["checkin_date"])
        week_cutoff = checkin_date + timedelta(days=7)

        week_texts = [t for t in text_interactions if parse_ts(t["timestamp"]) <= week_cutoff]
        week_voice = [v for v in voice_features if parse_ts(v["timestamp"]) <= week_cutoff]
        week_behaviour = [b for b in behavioural if parse_ts(b["date"]) <= week_cutoff]
        week_events = [e for e in case_events if parse_ts(e["event_date"]) <= week_cutoff]

        result = app_state.distress_engine.compute_distress_score(
            victim_id=victim_id,
            checkin=checkin,
            text_interactions=week_texts[-10:],
            behavioural_patterns=week_behaviour[-10:],
            voice_features=week_voice[-5:],
            case_events=week_events,
            historical_scores=historical_scores,
            emotion_model=app_state.emotion_model,
        )
        trend.append({
            "date": checkin["checkin_date"],
            "score": result.distress_score,
            "band": result.band,
        })
        historical_scores.append(result.distress_score)

    return trend


# ===== API Endpoints =====

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        models_loaded=app_state.emotion_model is not None,
        data_loaded=len(app_state.synthetic_data.get("victims", [])) > 0,
    )


@app.get("/api/v1/victims", response_model=List[VictimSummary])
async def list_victims():
    """List all victims with their latest distress status"""
    victims = []
    for v in app_state.synthetic_data["victims"]:
        try:
            result = compute_latest_distress(v["victim_id"])
            victims.append(VictimSummary(
                victim_id=v["victim_id"],
                case_type=v["case_type"],
                district=v["district"],
                state=v["state"],
                preferred_language=v["preferred_language"],
                latest_score=result.distress_score,
                latest_band=result.band,
                trend=result.trend_direction,
            ))
        except Exception as e:
            # If scoring fails, still include victim
            victims.append(VictimSummary(
                victim_id=v["victim_id"],
                case_type=v["case_type"],
                district=v["district"],
                state=v["state"],
                preferred_language=v["preferred_language"],
            ))
    return victims


@app.get("/api/v1/victims/{victim_id}", response_model=Dict[str, Any])
async def get_victim(victim_id: str):
    """Get full victim profile and history"""
    vdata = get_victim_data(victim_id)
    if not vdata["profile"]:
        raise HTTPException(status_code=404, detail="Victim not found")
    
    # Get latest distress score
    latest_result = compute_latest_distress(victim_id)
    
    return {
        "profile": vdata["profile"],
        "latest_distress": {
            "score": latest_result.distress_score,
            "band": latest_result.band,
            "components": vars(latest_result.components),
            "baseline": latest_result.personal_baseline,
            "trend": latest_result.trend_direction,
            "escalation_7d": latest_result.escalation_probability_7d,
            "escalation_30d": latest_result.escalation_probability_30d,
        },
        "history": {
            "checkins": vdata["checkins"][-10:],  # Last 10
            "case_events": vdata["case_events"],
            "text_interactions": vdata["text_interactions"][-20:],
            "voice_features": vdata["voice_features"][-10:],
            "behavioural_patterns": vdata["behavioural_patterns"][-10:],
        }
    }


@app.post("/api/v1/support-requests", response_model=SupportRequest)
async def create_support_request(request: SupportRequestCreate):
    """Route a victim's request to humans; this endpoint never triggers an automatic intervention."""
    if not any(v["victim_id"] == request.victim_id for v in app_state.synthetic_data["victims"]):
        raise HTTPException(status_code=404, detail="Victim not found")
    if request.request_type not in {"urgent_safety", "counselling", "legal_aid"}:
        raise HTTPException(status_code=400, detail="Unsupported support request type")

    routed_roles = (
        ["counsellor", "district_officer"]
        if request.request_type == "urgent_safety"
        else ["counsellor"]
        if request.request_type == "counselling"
        else ["counsellor", "district_officer"]
    )
    item = SupportRequest(
        request_id=f"SUPPORT_{uuid.uuid4().hex[:10].upper()}",
        victim_id=request.victim_id,
        request_type=request.request_type,
        message=request.message,
        routed_roles=routed_roles,
        status="new",
        created_at=datetime.utcnow().isoformat(),
    )
    support_requests.insert(0, item.model_dump())
    return item


@app.post("/api/v1/checkins", response_model=DistressScoreResponse)
async def submit_checkin(request: CheckinCreate):
    """Store a consented check-in and recompute the victim's longitudinal score."""
    if not any(v["victim_id"] == request.victim_id for v in app_state.synthetic_data["victims"]):
        raise HTTPException(status_code=404, detail="Victim not found")
    required_scores = {"mood", "anxiety_stress", "sleep_quality", "safety", "hopelessness", "isolation"}
    if not required_scores.issubset(request.scores):
        raise HTTPException(status_code=422, detail="All wellbeing scores are required")

    checkin_date = datetime.utcnow().isoformat()
    app_state.synthetic_data["checkins"].append({
        "victim_id": request.victim_id,
        "checkin_date": checkin_date,
        "scores": {key: max(0, min(100, float(value))) for key, value in request.scores.items()},
    })
    if request.message:
        app_state.synthetic_data["text_interactions"].append({
            "victim_id": request.victim_id,
            "timestamp": checkin_date,
            "text": request.message,
        })
    result = compute_latest_distress(request.victim_id)
    return DistressScoreResponse(
        victim_id=result.victim_id,
        timestamp=result.timestamp,
        distress_score=result.distress_score,
        band=result.band,
        components=vars(result.components),
        personal_baseline=result.personal_baseline,
        contributing_factors=result.contributing_factors,
        escalation_probability_7d=result.escalation_probability_7d,
        escalation_probability_30d=result.escalation_probability_30d,
        trend_direction=result.trend_direction,
        confidence=result.confidence,
    )


@app.get("/api/v1/support-requests", response_model=List[SupportRequest])
async def list_support_requests(
    role: Optional[str] = Query(None),
    since: Optional[str] = Query(None),
):
    """Return requests routed to a role for dashboard polling."""
    requests = support_requests
    if role:
        requests = [item for item in requests if role in item["routed_roles"]]
    if since:
        requests = [item for item in requests if item["created_at"] > since]
    return requests


@app.post("/api/v1/emotion/predict", response_model=EmotionPredictionResponse)
async def predict_emotion_endpoint(request: EmotionPredictionRequest):
    """Predict emotion from text"""
    pred = predict_emotion(request.text, app_state.emotion_model, app_state.vectorizer)
    return EmotionPredictionResponse(**pred)


@app.post("/api/v1/distress/score", response_model=DistressScoreResponse)
async def compute_distress_score(request: DistressScoreRequest):
    """Compute distress score from provided data"""
    result = app_state.distress_engine.compute_distress_score(
        victim_id=request.victim_id,
        checkin=request.checkin,
        text_interactions=request.text_interactions,
        behavioural_patterns=request.behavioural_patterns,
        voice_features=request.voice_features,
        case_events=request.case_events,
        historical_scores=request.historical_scores,
        emotion_model=app_state.emotion_model,
    )
    
    return DistressScoreResponse(
        victim_id=result.victim_id,
        timestamp=result.timestamp,
        distress_score=result.distress_score,
        band=result.band,
        components=vars(result.components),
        personal_baseline=result.personal_baseline,
        contributing_factors=result.contributing_factors,
        escalation_probability_7d=result.escalation_probability_7d,
        escalation_probability_30d=result.escalation_probability_30d,
        trend_direction=result.trend_direction,
        confidence=result.confidence,
    )


@app.get("/api/v1/victims/{victim_id}/distress", response_model=DistressScoreResponse)
async def get_victim_distress(victim_id: str):
    """Get latest distress score for a victim"""
    result = compute_latest_distress(victim_id)
    
    return DistressScoreResponse(
        victim_id=result.victim_id,
        timestamp=result.timestamp,
        distress_score=result.distress_score,
        band=result.band,
        components=vars(result.components),
        personal_baseline=result.personal_baseline,
        contributing_factors=result.contributing_factors,
        escalation_probability_7d=result.escalation_probability_7d,
        escalation_probability_30d=result.escalation_probability_30d,
        trend_direction=result.trend_direction,
        confidence=result.confidence,
    )


@app.get("/api/v1/victims/{victim_id}/distress/history", response_model=List[DistressTrendPoint])
async def get_victim_distress_history(victim_id: str):
    """Get the actual computed distress score at every historical check-in"""
    return compute_distress_trend(victim_id)


@app.get("/api/v1/victims/{victim_id}/explanation", response_model=ExplanationResponse)
async def get_victim_explanation(victim_id: str):
    """Get full explainable AI output for a victim"""
    result = compute_latest_distress(victim_id)
    
    explanation = app_state.explainability_engine.explain_distress_score(
        victim_id=victim_id,
        distress_result=result,
        include_counterfactuals=True,
    )
    
    return ExplanationResponse(
        victim_id=explanation.victim_id,
        timestamp=explanation.timestamp,
        distress_score=explanation.distress_score,
        band=explanation.band,
        narrative=explanation.narrative,
        clinical_summary=explanation.clinical_summary,
        recommended_actions=explanation.recommended_actions,
        primary_factors=[vars(f) for f in explanation.primary_factors],
        secondary_factors=[vars(f) for f in explanation.secondary_factors],
        protective_factors=[vars(f) for f in explanation.protective_factors],
        risk_factors=[vars(f) for f in explanation.risk_factors],
        counterfactuals=explanation.counterfactuals if hasattr(explanation, 'counterfactuals') else [],
        confidence=explanation.confidence,
        requires_human_review=explanation.band in ["Orange", "Red"],
    )


@app.get("/api/v1/alerts", response_model=List[AlertResponse])
async def get_alerts(
    band: Optional[str] = Query(None, description="Filter by band: Green, Yellow, Orange, Red"),
    limit: int = Query(50, ge=1, le=200),
):
    """Get high-risk alerts for officer dashboard"""
    alerts = []
    
    for v in app_state.synthetic_data["victims"]:
        try:
            result = compute_latest_distress(v["victim_id"])
            
            # Filter by band if specified
            if band and result.band != band:
                continue
            
            # Only include Yellow+ for alerts
            if result.band not in ["Yellow", "Orange", "Red"]:
                continue
            
            explanation = app_state.explainability_engine.explain_distress_score(
                victim_id=v["victim_id"],
                distress_result=result,
            )
            
            alert_explanation = app_state.explainability_engine.explain_alert({
                "alert_id": f"ALERT_{v['victim_id']}_{int(datetime.now().timestamp())}",
                "victim_id": v["victim_id"],
                "distress_result": result,
            })
            
            alerts.append(AlertResponse(**alert_explanation))
            
        except Exception as e:
            continue
    
    # Sort by distress score descending (highest risk first)
    alerts.sort(key=lambda a: a.distress_score, reverse=True)
    
    return alerts[:limit]


@app.get("/api/v1/dashboard/district/{district_id}")
async def get_district_dashboard(district_id: str):
    """Aggregate dashboard for district officer"""
    district_victims = [
        v for v in app_state.synthetic_data["victims"] 
        if v["district"] == district_id
    ]
    
    if not district_victims:
        raise HTTPException(status_code=404, detail="District not found")
    
    band_counts = {"Green": 0, "Yellow": 0, "Orange": 0, "Red": 0}
    victim_summaries = []
    
    for v in district_victims:
        try:
            result = compute_latest_distress(v["victim_id"])
            band_counts[result.band] += 1
            victim_summaries.append({
                "victim_id": v["victim_id"],
                "case_type": v["case_type"],
                "score": result.distress_score,
                "band": result.band,
                "trend": result.trend_direction,
                "escalation_7d": result.escalation_probability_7d,
            })
        except Exception:
            pass
    
    return {
        "district": district_id,
        "total_victims": len(district_victims),
        "band_distribution": band_counts,
        "high_risk_count": band_counts["Orange"] + band_counts["Red"],
        "victims": sorted(victim_summaries, key=lambda x: x["score"], reverse=True),
    }


@app.get("/api/v1/dashboard/state/{state_id}")
async def get_state_dashboard(state_id: str):
    """Aggregate dashboard for state officer"""
    state_victims = [
        v for v in app_state.synthetic_data["victims"] 
        if v["state"] == state_id
    ]
    
    if not state_victims:
        raise HTTPException(status_code=404, detail="State not found")
    
    # Group by district
    districts = {}
    for v in state_victims:
        d = v["district"]
        if d not in districts:
            districts[d] = {"victims": [], "band_counts": {"Green": 0, "Yellow": 0, "Orange": 0, "Red": 0}}
        districts[d]["victims"].append(v)
    
    district_summaries = []
    for d_id, d_data in districts.items():
        band_counts = {"Green": 0, "Yellow": 0, "Orange": 0, "Red": 0}
        for v in d_data["victims"]:
            try:
                result = compute_latest_distress(v["victim_id"])
                band_counts[result.band] += 1
            except Exception:
                pass
        district_summaries.append({
            "district": d_id,
            "total_victims": len(d_data["victims"]),
            "band_distribution": band_counts,
            "high_risk_count": band_counts["Orange"] + band_counts["Red"],
        })
    
    total_bands = {"Green": 0, "Yellow": 0, "Orange": 0, "Red": 0}
    for d in district_summaries:
        for band, count in d["band_distribution"].items():
            total_bands[band] += count
    
    return {
        "state": state_id,
        "total_victims": len(state_victims),
        "total_districts": len(districts),
        "band_distribution": total_bands,
        "high_risk_count": total_bands["Orange"] + total_bands["Red"],
        "districts": sorted(district_summaries, key=lambda x: x["high_risk_count"], reverse=True),
    }


@app.get("/api/v1/dashboard/national")
async def get_national_dashboard():
    """Aggregate dashboard for national administrator"""
    all_victims = app_state.synthetic_data["victims"]
    
    band_counts = {"Green": 0, "Yellow": 0, "Orange": 0, "Red": 0}
    state_counts = {}
    
    for v in all_victims:
        try:
            result = compute_latest_distress(v["victim_id"])
            band_counts[result.band] += 1
            
            state = v["state"]
            if state not in state_counts:
                state_counts[state] = {"Green": 0, "Yellow": 0, "Orange": 0, "Red": 0}
            state_counts[state][result.band] += 1
        except Exception:
            pass
    
    return {
        "total_victims": len(all_victims),
        "total_states": len(state_counts),
        "band_distribution": band_counts,
        "high_risk_count": band_counts["Orange"] + band_counts["Red"],
        "high_risk_percentage": round((band_counts["Orange"] + band_counts["Red"]) / len(all_victims) * 100, 1),
        "states": state_counts,
    }


@app.post("/api/v1/review/alerts/generate")
async def generate_alerts():
    """Generate alerts from current distress scores for all victims"""
    distress_results = []
    
    for v in app_state.synthetic_data["victims"]:
        try:
            result = compute_latest_distress(v["victim_id"])
            if result.band in ["Yellow", "Orange", "Red"]:
                distress_results.append(result)
        except Exception as e:
            print(f"Error computing distress for {v['victim_id']}: {e}")
    
    created = generate_alerts_from_distress_results(
        distress_results, 
        app_state.explainability_engine
    )
    
    return {
        "generated": len(created),
        "alerts": [{"alert_id": a.alert_id, "victim_id": a.victim_id, "band": a.band} for a in created],
    }


@app.get("/api/v1/review/alerts/refresh")
async def refresh_alerts():
    """Refresh alerts - update existing, create new for current distress levels"""
    return await generate_alerts()


if __name__ == "__main__":
    import uvicorn
    _host = os.environ.get("HOST", "0.0.0.0")
    _port = int(os.environ.get("PORT", "8000"))
    print(f"[SERVER] Starting on {_host}:{_port}")
    uvicorn.run(app, host=_host, port=_port, reload=False)