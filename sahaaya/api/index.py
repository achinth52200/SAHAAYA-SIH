"""Lightweight Vercel API for the SAHAAYA prototype demo."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid
import re
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="SAHAAYA API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sih-sahaaya.vercel.app", "http://localhost:3000"],
    allow_origin_regex=r"https://sih-sahaaya-[a-z0-9-]+-achinth52200s-projects\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

victim = {
    "id": "V-001",
    "name": "Synthetic Demo Victim",
    "status": "active",
    "district": "Demo District",
    "state": "Demo State",
    "consent_given": True,
}
checkins: List[Dict[str, Any]] = []
support_requests: List[Dict[str, Any]] = []


def supabase_request(method: str, table: str, payload: Optional[Any] = None, query: str = "") -> Optional[Any]:
    base_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not base_url or not service_key:
        return None
    request = Request(
        f"{base_url.rstrip('/')}/rest/v1/{table}{query}",
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method=method,
    )
    try:
        with urlopen(request, timeout=8) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else []
    except (HTTPError, URLError) as error:
        print(f"Supabase {method} {table} failed: {error}")
        return None


def persistent_items(table: str, fallback: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result = supabase_request("GET", table, query="?select=*&order=created_at.desc")
    return result if isinstance(result, list) else fallback


def store_item(table: str, item: Dict[str, Any], fallback: List[Dict[str, Any]]) -> None:
    fallback.append(item)
    supabase_request("POST", table, item)


def synthetic_victim(victim_id: str) -> Dict[str, Any]:
    match = re.fullmatch(r"VICTIM_(\d{4})", victim_id.upper())
    number = int(match.group(1)) if match else 1
    score = float(25 + ((number * 17) % 70))
    band = "Red" if score >= 75 else "Orange" if score >= 50 else "Yellow" if score >= 30 else "Green"
    districts = ["Demo District", "River District", "Hill District", "Coastal District"]
    states = ["Demo State", "Prototype State"]
    return {
        "victim_id": f"VICTIM_{number:04d}",
        "case_type": "synthetic demo case",
        "district": districts[(number - 1) % len(districts)],
        "state": states[(number - 1) % len(states)],
        "preferred_language": ["English", "Hindi", "Tamil", "Bengali"][(number - 1) % 4],
        "latest_score": score,
        "latest_band": band,
        "trend": ["stable", "improving", "worsening"][(number - 1) % 3],
        "escalation_probability_7d": round(max(0, score - 30) / 100, 2),
        "synthetic": True,
    }


class LoginRequest(BaseModel):
    email: str
    password: str


class CheckInRequest(BaseModel):
    victim_id: str = "V-001"
    scores: Optional[Dict[str, float]] = None
    mood: int = Field(default=5, ge=1, le=10)
    sleep: int = Field(default=5, ge=1, le=10)
    safety: int = Field(default=5, ge=1, le=10)
    message: Optional[str] = None


class SupportRequest(BaseModel):
    victim_id: str = "V-001"
    request_type: Optional[str] = None
    support_type: Optional[str] = None
    message: Optional[str] = Field(default="", max_length=2000)


def concerning_checkin_message(message: Optional[str]) -> bool:
    if not message:
        return False
    text = message.lower()
    return bool(re.search(
        r"\b(unsafe|danger|threat|threatened|hurt myself|self harm|"
        r"harm myself|suicid|kill myself|cannot go on|can't go on|"
        r"no hope|hopeless|afraid|scared for my life|violence|"
        r"not good|feel bad|feeling bad|very bad|terrible)\b",
        text,
    ))


def route_for_checkin(message: Optional[str], scores: Dict[str, float]) -> List[str]:
    safety_concern = float(scores.get("safety", 50)) <= 15
    urgent_help = float(scores.get("urgent_help", 0)) == 1
    if safety_concern or urgent_help or concerning_checkin_message(message):
        return ["counsellor", "district_officer"]
    return []


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "sahaaya-api", "data": "synthetic prototype"}


@app.post("/auth/login")
def login(request: LoginRequest) -> Dict[str, Any]:
    roles = {
        "victim@sahaaya.gov.in": "victim",
        "counsellor@sahaaya.gov.in": "counsellor",
        "district@sahaaya.gov.in": "district_officer",
        "state@sahaaya.gov.in": "state_officer",
        "national@sahaaya.gov.in": "national_admin",
    }
    role = roles.get(request.email.lower())
    victim_match = re.fullmatch(r"victim(\d*)@sahaaya\.gov\.in", request.email.lower())
    if victim_match:
        number = int(victim_match.group(1) or "1")
        if 1 <= number <= 25:
            role = "victim"
    if not role or request.password != "demo123":
        raise HTTPException(status_code=401, detail="Invalid demo credentials")
    return {
        "access_token": f"demo-{uuid.uuid4()}",
        "refresh_token": f"demo-refresh-{uuid.uuid4()}",
        "user": {"id": f"VICTIM_{number:04d}" if role == "victim" else request.email, "email": request.email, "role": role},
    }


def current_score() -> float:
    if not checkins:
        return 56.0
    latest = checkins[-1]
    return round((10 - latest["mood"] + 10 - latest["sleep"] + 10 - latest["safety"]) / 30 * 100, 1)


@app.get("/api/v1/victims")
def victims() -> List[Dict[str, Any]]:
    return [synthetic_victim(f"VICTIM_{number:04d}") for number in range(1, 26)]


@app.get("/api/v1/victims/{victim_id}")
def victim_detail(victim_id: str) -> Dict[str, Any]:
    profile = synthetic_victim(victim_id)
    victim_checkins = [item for item in persistent_items("checkins", checkins) if item.get("victim_id") == victim_id]
    return {"profile": profile | {"id": victim_id, "name": f"Synthetic Demo Victim {victim_id[-4:]}", "status": "active", "consent_given": True, "case_registered_date": "2026-01-15"},
            "history": {"checkins": victim_checkins, "case_events": [
                {"event_type": "case_registered", "event_date": "2026-01-15", "description": "Synthetic demo case registered"}
            ]},
            "synthetic": True}


@app.get("/api/v1/victims/{victim_id}/distress")
def distress(victim_id: str) -> Dict[str, Any]:
    score = synthetic_victim(victim_id)["latest_score"]
    band = "Red" if score >= 75 else "Orange" if score >= 50 else "Yellow" if score >= 30 else "Green"
    return {"victim_id": victim_id, "timestamp": datetime.now(timezone.utc).isoformat(),
            "distress_score": score, "band": band, "components": {"self_report": score, "text_emotion": 0, "behavioural": 0, "voice": 0, "case_events": 0, "trend": 0},
            "personal_baseline": 50, "contributing_factors": [], "escalation_probability_7d": 0,
            "escalation_probability_30d": 0, "trend_direction": "stable", "confidence": 0.5,
            "explanation": "Derived from synthetic check-in inputs and personal trend."}


@app.get("/api/v1/victims/{victim_id}/distress/history")
def distress_history(victim_id: str) -> List[Dict[str, Any]]:
    score = synthetic_victim(victim_id)["latest_score"]
    return [{"date": datetime.now(timezone.utc).isoformat(), "score": score, "band": synthetic_victim(victim_id)["latest_band"]}]


@app.get("/api/v1/victims/{victim_id}/explanation")
def explanation(victim_id: str) -> Dict[str, Any]:
    score = synthetic_victim(victim_id)["latest_score"]
    return {"victim_id": victim_id, "timestamp": datetime.now(timezone.utc).isoformat(), "distress_score": score,
            "band": "Orange", "narrative": "Synthetic prototype explanation based on recent self-report trend.",
            "clinical_summary": "Not a clinical assessment.", "recommended_actions": ["Review with a trained human"],
            "primary_factors": [], "secondary_factors": [], "protective_factors": [], "risk_factors": [],
            "counterfactuals": [], "confidence": 0.5, "requires_human_review": True}


@app.post("/api/v1/checkins")
def create_checkin(request: CheckInRequest) -> Dict[str, Any]:
    scores = request.scores or {"mood": request.mood * 10, "sleep_quality": request.sleep * 10, "safety": request.safety * 10}
    score = round(sum(float(scores.get(key, 50)) for key in ("mood", "anxiety_stress", "sleep_quality", "safety", "hopelessness", "isolation")) / 6, 1)
    item = {"victim_id": request.victim_id, "scores": scores, "message": request.message,
            "id": str(uuid.uuid4()), "timestamp": datetime.now(timezone.utc).isoformat(), "score": score}
    store_item("checkins", item, checkins)
    routed_roles = route_for_checkin(request.message, scores)
    if routed_roles:
        store_item("support_requests", {
            "victim_id": request.victim_id,
            "request_type": "checkin_review",
            "message": request.message or "Concerning check-in response requires human review.",
            "id": str(uuid.uuid4()),
            "status": "pending",
            "routed_roles": routed_roles,
            "created_at": item["timestamp"],
            "source": "checkin",
            "checkin_id": item["id"],
        }, support_requests)
    item["human_review"] = bool(routed_roles)
    item["routed_roles"] = routed_roles
    return item


@app.post("/api/v1/support-requests")
def create_support_request(request: SupportRequest) -> Dict[str, Any]:
    request_type = request.request_type or request.support_type or "counselling"
    item = {"victim_id": request.victim_id, "request_type": request_type, "message": request.message,
            "id": str(uuid.uuid4()), "status": "pending", "routed_roles": ["counsellor"],
            "created_at": datetime.now(timezone.utc).isoformat()}
    if request_type in {"urgent_safety", "legal_aid"}:
        item["routed_roles"].append("district_officer")
    store_item("support_requests", item, support_requests)
    return item


@app.get("/api/v1/support-requests")
def list_support_requests(victim_id: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
    requests = persistent_items("support_requests", support_requests)
    if victim_id:
        requests = [item for item in requests if item["victim_id"] == victim_id]
    if role:
        requests = [item for item in requests if role in item["routed_roles"]]
    return requests


@app.get("/api/v1/review/stats/summary")
def review_summary() -> Dict[str, Any]:
    total = len(support_requests)
    return {"alerts": {"total": total, "pending_review": total, "by_status": {"new": total, "resolved": 0}, "by_priority": {"low": 0, "medium": total, "high": 0, "critical": 0}},
            "interventions": {"total": 0, "overdue": 0, "by_status": {}}, "review_actions_today": 0}


@app.get("/api/v1/review/alerts")
def review_alerts(limit: int = 10) -> List[Dict[str, Any]]:
    return [{"alert_id": item["id"], "victim_id": item["victim_id"], "distress_score": current_score(),
             "band": "Orange", "priority": "medium", "status": "new", "created_at": item["created_at"],
             "updated_at": item["created_at"], "narrative": item["message"], "clinical_summary": "Human review required.",
             "primary_factors": [], "recommended_actions": ["Review support request"], "escalation_probability_7d": 0,
             "escalation_probability_30d": 0} for item in support_requests[-limit:]]


def alert_payload(alert_id: str) -> Dict[str, Any]:
    item = next((item for item in support_requests if item["id"] == alert_id), None)
    victim_id = item["victim_id"] if item else "VICTIM_0001"
    score = synthetic_victim(victim_id)["latest_score"]
    now = datetime.now(timezone.utc).isoformat()
    return {"alert_id": alert_id, "victim_id": victim_id, "distress_score": score,
            "band": synthetic_victim(victim_id)["latest_band"], "priority": "high", "status": "new",
            "created_at": item["created_at"] if item else now, "updated_at": now,
            "narrative": item["message"] if item else "Synthetic demo alert awaiting human review.",
            "clinical_summary": "Not a clinical assessment. Human review is required.",
            "primary_factors": [], "recommended_actions": ["Review with the assigned support professional"],
            "escalation_probability_7d": synthetic_victim(victim_id)["escalation_probability_7d"],
            "escalation_probability_30d": synthetic_victim(victim_id)["escalation_probability_7d"],
            "trend_direction": synthetic_victim(victim_id)["trend"]}


@app.get("/api/v1/review/alerts/{alert_id}")
def get_alert(alert_id: str) -> Dict[str, Any]:
    return alert_payload(alert_id)


@app.get("/api/v1/review/alerts/{alert_id}/history")
def get_alert_history(alert_id: str) -> List[Dict[str, Any]]:
    return [{"timestamp": datetime.now(timezone.utc).isoformat(), "action": "created", "actor_id": "system", "notes": "Synthetic prototype alert created."}]


@app.get("/api/v1/review/interventions")
def get_interventions(alert_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return []


@app.post("/api/v1/review/alerts/{alert_id}/review")
def review_alert(alert_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    result = alert_payload(alert_id)
    result["status"] = "in_review"
    result["review_decision"] = payload.get("decision")
    result["reviewed_by"] = payload.get("actor_id")
    return result


@app.post("/api/v1/emotion/predict")
def emotion_predict(payload: Dict[str, str]) -> Dict[str, Any]:
    return {"emotion": "not_analyzed", "confidence": None, "text": payload.get("text", ""), "message": "Model inference is available in the full backend deployment."}
