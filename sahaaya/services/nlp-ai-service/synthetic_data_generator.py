"""
Synthetic Dataset Generator for SAHAAYA
Generates prototype data for victims, case events, check-ins, text interactions, and voice features.
ALL DATA IS SYNTHETIC AND CLEARLY LABELLED AS PROTOTYPE DATA.
"""
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd


PROTOTYPE_LABEL = "[PROTOTYPE DATA - NOT REAL VICTIM DATA]"

LANGUAGES = ["en", "hi", "bn", "te", "ta", "mr", "gu", "kn", "ml", "or"]
DISTRESS_BANDS = ["Green", "Yellow", "Orange", "Red"]
CASE_EVENT_TYPES = [
    "FIR Registered",
    "Investigation Started",
    "Threat Reported",
    "Court Hearing Scheduled",
    "Court Hearing Attended",
    "Bail Hearing",
    "Compensation Delay",
    "Rehabilitation Delay",
    "Counselling Session",
    "Protection Order Granted",
    "Case Closed",
]
SELF_REPORT_CATEGORIES = [
    "mood",
    "anxiety_stress",
    "sleep_quality",
    "safety",
    "hopelessness",
    "isolation",
    "urgent_help",
]
EMOTIONS = ["fear", "anger", "hopelessness", "threat", "sadness", "anxiety", "neutral"]
BEHAVIOURAL_PATTERNS = [
    "missed_checkin",
    "cancelled_counselling",
    "reduced_engagement",
    "late_response",
    "normal",
]


def generate_victim_profile(victim_id: str, base_date: datetime) -> Dict[str, Any]:
    """Generate a synthetic victim profile."""
    return {
        "victim_id": victim_id,
        "label": PROTOTYPE_LABEL,
        "age_group": random.choice(["18-25", "26-35", "36-45", "46-55", "55+"]),
        "gender": random.choice(["M", "F", "Other"]),
        "preferred_language": random.choice(LANGUAGES),
        "case_registered_date": (base_date - timedelta(days=random.randint(30, 365))).isoformat(),
        "district": f"District_{random.randint(1, 20)}",
        "state": f"State_{random.randint(1, 5)}",
        "case_type": random.choice([
            "Physical Assault",
            "Sexual Violence",
            "Domestic Violence",
            "Caste-based Atrocity",
            "Human Trafficking",
        ]),
        "consent_given": True,
        "consent_date": (base_date - timedelta(days=random.randint(1, 30))).isoformat(),
        "communication_preferences": random.sample(
            ["app", "chatbot", "sms", "ivrs"], k=random.randint(1, 3)
        ),
    }


def generate_case_events(victim_id: str, base_date: datetime, num_events: int = 8) -> List[Dict[str, Any]]:
    """Generate synthetic case events for a victim."""
    events = []
    case_start = base_date - timedelta(days=random.randint(60, 180))
    
    for i in range(num_events):
        event_date = case_start + timedelta(days=random.randint(0, 180))
        event_type = random.choice(CASE_EVENT_TYPES)
        
        # Stress impact based on event type
        stress_impact = {
            "FIR Registered": 10,
            "Investigation Started": 5,
            "Threat Reported": 25,
            "Court Hearing Scheduled": 15,
            "Court Hearing Attended": 20,
            "Bail Hearing": 20,
            "Compensation Delay": 15,
            "Rehabilitation Delay": 15,
            "Counselling Session": -10,
            "Protection Order Granted": -15,
            "Case Closed": -20,
        }.get(event_type, 5)
        
        events.append({
            "event_id": str(uuid.uuid4()),
            "victim_id": victim_id,
            "label": PROTOTYPE_LABEL,
            "event_type": event_type,
            "event_date": event_date.isoformat(),
            "description": f"Synthetic {event_type} event for prototype",
            "stress_impact": stress_impact,
            "source": "case_management_system",
        })
    
    return sorted(events, key=lambda x: x["event_date"])


def generate_checkins(victim_id: str, base_date: datetime, num_checkins: int = 30) -> List[Dict[str, Any]]:
    """Generate synthetic self-report check-ins."""
    checkins = []
    start_date = base_date - timedelta(days=90)
    
    # Personal baseline - each victim has their own "normal"
    personal_baseline = {
        "mood": random.randint(40, 70),
        "anxiety_stress": random.randint(30, 60),
        "sleep_quality": random.randint(40, 70),
        "safety": random.randint(50, 80),
        "hopelessness": random.randint(20, 50),
        "isolation": random.randint(20, 50),
        "urgent_help": 0,
    }
    
    # Trend direction - some victims improving, some declining
    trend_direction = random.choice([-1, 1, 0])  # -1 = improving, 1 = declining, 0 = stable
    
    for i in range(num_checkins):
        checkin_date = start_date + timedelta(days=i * 3)
        
        # Add some noise and trend
        noise = {k: random.randint(-10, 10) for k in personal_baseline}
        trend = {k: trend_direction * random.randint(0, 5) for k in personal_baseline}
        
        scores = {}
        for k in personal_baseline:
            val = personal_baseline[k] + noise[k] + trend[k]
            scores[k] = max(0, min(100, val))
        
        # Occasionally add urgent help flag
        if random.random() < 0.05:
            scores["urgent_help"] = 1
        
        checkins.append({
            "checkin_id": str(uuid.uuid4()),
            "victim_id": victim_id,
            "label": PROTOTYPE_LABEL,
            "checkin_date": checkin_date.isoformat(),
            "scores": scores,
            "channel": random.choice(["app", "chatbot", "sms", "ivrs"]),
            "completed": True,
        })
    
    return checkins


def generate_text_interactions(victim_id: str, base_date: datetime, num_interactions: int = 20) -> List[Dict[str, Any]]:
    """Generate synthetic text interactions (chatbot messages)."""
    interactions = []
    start_date = base_date - timedelta(days=60)
    
    # Synthetic message templates per emotion
    message_templates = {
        "fear": [
            "I am scared to go out alone",
            "They threatened me again yesterday",
            "I fear for my family's safety",
            "What if they come back?",
        ],
        "anger": [
            "This is so unfair, nothing is happening",
            "Why is the case taking so long?",
            "I am angry at the system",
            "They think they can get away with it",
        ],
        "hopelessness": [
            "I don't think things will ever get better",
            "Nothing changes no matter what I do",
            "I feel like giving up",
            "There is no hope for justice",
        ],
        "threat": [
            "They said they will hurt me if I testify",
            "Received threatening message",
            "Someone followed me home",
            "They know where I live",
        ],
        "sadness": [
            "I miss my normal life",
            "Everything feels heavy",
            "I cry every night",
            "I feel so alone in this",
        ],
        "anxiety": [
            "I can't sleep thinking about the hearing",
            "My heart races when I see police",
            "Constant worry about the case",
            "Panic attacks before court dates",
        ],
        "neutral": [
            "Just checking in",
            "How is my case progressing?",
            "When is the next appointment?",
            "Thank you for the update",
        ],
    }
    
    for i in range(num_interactions):
        interaction_date = start_date + timedelta(days=random.randint(0, 60))
        emotion = random.choices(
            EMOTIONS,
            weights=[0.15, 0.15, 0.15, 0.1, 0.15, 0.15, 0.15]
        )[0]
        message = random.choice(message_templates[emotion])
        
        interactions.append({
            "interaction_id": str(uuid.uuid4()),
            "victim_id": victim_id,
            "label": PROTOTYPE_LABEL,
            "timestamp": interaction_date.isoformat(),
            "text": message,
            "language": random.choice(LANGUAGES),
            "source": "chatbot",
            "ground_truth_emotion": emotion,  # For evaluation only
        })
    
    return sorted(interactions, key=lambda x: x["timestamp"])


def generate_voice_features(victim_id: str, base_date: datetime, num_samples: int = 10) -> List[Dict[str, Any]]:
    """Generate synthetic voice acoustic features (supporting signal only)."""
    samples = []
    start_date = base_date - timedelta(days=30)
    
    for i in range(num_samples):
        sample_date = start_date + timedelta(days=random.randint(0, 30))
        
        # Synthetic acoustic features (normalized 0-1)
        samples.append({
            "voice_id": str(uuid.uuid4()),
            "victim_id": victim_id,
            "label": PROTOTYPE_LABEL,
            "timestamp": sample_date.isoformat(),
            "features": {
                "pitch_mean": round(random.uniform(0.3, 0.7), 3),
                "pitch_std": round(random.uniform(0.1, 0.4), 3),
                "energy_mean": round(random.uniform(0.2, 0.8), 3),
                "speaking_rate": round(random.uniform(0.3, 0.9), 3),
                "pause_duration": round(random.uniform(0.1, 0.5), 3),
                "jitter": round(random.uniform(0.01, 0.05), 3),
                "shimmer": round(random.uniform(0.01, 0.05), 3),
                "mfcc_1": round(random.uniform(-1, 1), 3),
                "mfcc_2": round(random.uniform(-1, 1), 3),
                "mfcc_3": round(random.uniform(-1, 1), 3),
            },
            "duration_seconds": random.randint(10, 60),
            "consented": True,
        })
    
    return sorted(samples, key=lambda x: x["timestamp"])


def generate_behavioural_patterns(victim_id: str, base_date: datetime, num_records: int = 30) -> List[Dict[str, Any]]:
    """Generate synthetic behavioural pattern records."""
    patterns = []
    start_date = base_date - timedelta(days=90)
    
    for i in range(num_records):
        record_date = start_date + timedelta(days=i * 3)
        
        # Mostly normal, occasionally concerning patterns
        pattern = random.choices(
            BEHAVIOURAL_PATTERNS,
            weights=[0.08, 0.05, 0.1, 0.07, 0.7]
        )[0]
        
        severity = {
            "missed_checkin": random.randint(1, 3),
            "cancelled_counselling": random.randint(1, 2),
            "reduced_engagement": random.randint(1, 3),
            "late_response": random.randint(1, 2),
            "normal": 0,
        }[pattern]
        
        patterns.append({
            "pattern_id": str(uuid.uuid4()),
            "victim_id": victim_id,
            "label": PROTOTYPE_LABEL,
            "date": record_date.isoformat(),
            "pattern_type": pattern,
            "severity": severity,
            "details": f"Synthetic {pattern} pattern" if pattern != "normal" else "Normal engagement",
        })
    
    return patterns


def generate_distress_scores(victim_id: str, checkins: List[Dict], case_events: List[Dict], 
                            text_interactions: List[Dict], voice_features: List[Dict],
                            behavioural_patterns: List[Dict], base_date: datetime) -> List[Dict[str, Any]]:
    """
    Generate synthetic distress scores using the weighted formula from PDR Section 4.
    This simulates what the Dynamic Distress Engine would compute.
    """
    scores = []
    
    # Group data by date (weekly buckets)
    weekly_data = {}
    for checkin in checkins:
        dt = datetime.fromisoformat(checkin["checkin_date"])
        week_key = dt.strftime("%Y-W%U")
        if week_key not in weekly_data:
            weekly_data[week_key] = {"checkins": [], "case_events": [], "text": [], "voice": [], "behaviour": []}
        weekly_data[week_key]["checkins"].append(checkin)
    
    for event in case_events:
        dt = datetime.fromisoformat(event["event_date"])
        week_key = dt.strftime("%Y-W%U")
        if week_key not in weekly_data:
            weekly_data[week_key] = {"checkins": [], "case_events": [], "text": [], "voice": [], "behaviour": []}
        weekly_data[week_key]["case_events"].append(event)
    
    for interaction in text_interactions:
        dt = datetime.fromisoformat(interaction["timestamp"])
        week_key = dt.strftime("%Y-W%U")
        if week_key not in weekly_data:
            weekly_data[week_key] = {"checkins": [], "case_events": [], "text": [], "voice": [], "behaviour": []}
        weekly_data[week_key]["text"].append(interaction)
    
    for voice in voice_features:
        dt = datetime.fromisoformat(voice["timestamp"])
        week_key = dt.strftime("%Y-W%U")
        if week_key not in weekly_data:
            weekly_data[week_key] = {"checkins": [], "case_events": [], "text": [], "voice": [], "behaviour": []}
        weekly_data[week_key]["voice"].append(voice)
    
    for pattern in behavioural_patterns:
        dt = datetime.fromisoformat(pattern["date"])
        week_key = dt.strftime("%Y-W%U")
        if week_key not in weekly_data:
            weekly_data[week_key] = {"checkins": [], "case_events": [], "text": [], "voice": [], "behaviour": []}
        weekly_data[week_key]["behaviour"].append(pattern)
    
    # Personal baseline (first 4 weeks average)
    baseline_weeks = sorted(weekly_data.keys())[:4]
    baseline_scores = []
    for wk in baseline_weeks:
        if weekly_data[wk]["checkins"]:
            ci = weekly_data[wk]["checkins"][-1]
            # Self-reported well-being score (inverted: higher distress = higher score)
            well_being = 100 - (
                ci["scores"]["mood"] * 0.3 +
                (100 - ci["scores"]["anxiety_stress"]) * 0.2 +
                ci["scores"]["sleep_quality"] * 0.15 +
                ci["scores"]["safety"] * 0.15 +
                (100 - ci["scores"]["hopelessness"]) * 0.1 +
                (100 - ci["scores"]["isolation"]) * 0.1
            )
            baseline_scores.append(max(0, min(100, well_being)))
    
    personal_baseline = sum(baseline_scores) / len(baseline_scores) if baseline_scores else 30
    
    # Compute weekly distress scores
    for week_key in sorted(weekly_data.keys()):
        data = weekly_data[week_key]
        
        # 1. Self-reported well-being (35%)
        if data["checkins"]:
            ci = data["checkins"][-1]
            self_report = 100 - (
                ci["scores"]["mood"] * 0.3 +
                (100 - ci["scores"]["anxiety_stress"]) * 0.2 +
                ci["scores"]["sleep_quality"] * 0.15 +
                ci["scores"]["safety"] * 0.15 +
                (100 - ci["scores"]["hopelessness"]) * 0.1 +
                (100 - ci["scores"]["isolation"]) * 0.1
            )
        else:
            self_report = personal_baseline
        
        # 2. Text emotion & sentiment (20%)
        text_distress = 0
        if data["text"]:
            emotion_weights = {
                "fear": 0.8, "anger": 0.7, "hopelessness": 0.9, 
                "threat": 1.0, "sadness": 0.6, "anxiety": 0.7, "neutral": 0.1
            }
            text_distress = sum(emotion_weights.get(t.get("ground_truth_emotion", "neutral"), 0.1) 
                              for t in data["text"]) / len(data["text"]) * 100
        
        # 3. Behavioural pattern change (15%)
        behaviour_distress = sum(p["severity"] * 15 for p in data["behaviour"]) / max(len(data["behaviour"]), 1)
        behaviour_distress = min(100, behaviour_distress)
        
        # 4. Voice-based supporting indicators (10%)
        voice_distress = 0
        if data["voice"]:
            # Higher pitch variability, lower energy, slower rate = more distress
            v = data["voice"][-1]["features"]
            voice_distress = (
                (v["pitch_std"] / 0.4) * 30 +
                ((1 - v["energy_mean"]) / 0.8) * 30 +
                ((1 - v["speaking_rate"]) / 0.9) * 20 +
                (v["jitter"] / 0.05) * 10 +
                (v["shimmer"] / 0.05) * 10
            )
            voice_distress = min(100, voice_distress)
        
        # 5. Case & external stress events (10%)
        case_distress = sum(e["stress_impact"] for e in data["case_events"])
        case_distress = min(100, case_distress)
        
        # 6. Longitudinal distress trend (10%)
        trend_distress = 0  # Would compute from historical trend
        
        # Weighted composite
        composite = (
            self_report * 0.35 +
            text_distress * 0.20 +
            behaviour_distress * 0.15 +
            voice_distress * 0.10 +
            case_distress * 0.10 +
            trend_distress * 0.10
        )
        
        # Adjust relative to personal baseline
        adjusted_score = composite + (personal_baseline - 30) * 0.3
        adjusted_score = max(0, min(100, adjusted_score))
        
        # Determine band
        if adjusted_score < 30:
            band = "Green"
        elif adjusted_score < 50:
            band = "Yellow"
        elif adjusted_score < 75:
            band = "Orange"
        else:
            band = "Red"
        
        week_start = datetime.strptime(week_key + "-1", "%Y-W%U-%w")
        
        scores.append({
            "score_id": str(uuid.uuid4()),
            "victim_id": victim_id,
            "label": PROTOTYPE_LABEL,
            "week": week_key,
            "date": week_start.isoformat(),
            "distress_score": round(adjusted_score, 1),
            "band": band,
            "components": {
                "self_report": round(self_report, 1),
                "text_emotion": round(text_distress, 1),
                "behavioural": round(behaviour_distress, 1),
                "voice": round(voice_distress, 1),
                "case_events": round(case_distress, 1),
                "trend": round(trend_distress, 1),
            },
            "personal_baseline": round(personal_baseline, 1),
            "contributing_factors": [],  # Filled by explainability layer
        })
    
    return scores


def generate_all_synthetic_data(num_victims: int = 5, output_dir: str = "data/synthetic") -> None:
    """Generate complete synthetic dataset for all victims."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    base_date = datetime.now()
    all_victims = []
    all_case_events = []
    all_checkins = []
    all_text_interactions = []
    all_voice_features = []
    all_behavioural_patterns = []
    all_distress_scores = []
    
    for i in range(num_victims):
        victim_id = f"VICTIM_{str(i+1).zfill(4)}"
        
        # Generate all data for this victim
        victim = generate_victim_profile(victim_id, base_date)
        case_events = generate_case_events(victim_id, base_date)
        checkins = generate_checkins(victim_id, base_date)
        text_interactions = generate_text_interactions(victim_id, base_date)
        voice_features = generate_voice_features(victim_id, base_date)
        behavioural_patterns = generate_behavioural_patterns(victim_id, base_date)
        distress_scores = generate_distress_scores(
            victim_id, checkins, case_events, text_interactions, 
            voice_features, behavioural_patterns, base_date
        )
        
        all_victims.append(victim)
        all_case_events.extend(case_events)
        all_checkins.extend(checkins)
        all_text_interactions.extend(text_interactions)
        all_voice_features.extend(voice_features)
        all_behavioural_patterns.extend(behavioural_patterns)
        all_distress_scores.extend(distress_scores)
    
    # Save as JSONL files
    datasets = {
        "victims": all_victims,
        "case_events": all_case_events,
        "checkins": all_checkins,
        "text_interactions": all_text_interactions,
        "voice_features": all_voice_features,
        "behavioural_patterns": all_behavioural_patterns,
        "distress_scores": all_distress_scores,
    }
    
    for name, data in datasets.items():
        with open(output_path / f"{name}.jsonl", "w") as f:
            for record in data:
                f.write(json.dumps(record) + "\n")
    
    # Also save as CSV for easy inspection
    for name, data in datasets.items():
        if data:
            df = pd.DataFrame(data)
            df.to_csv(output_path / f"{name}.csv", index=False)
    
    print(f"Generated synthetic data for {num_victims} victims in {output_path}")
    print(f"  Victims: {len(all_victims)}")
    print(f"  Case events: {len(all_case_events)}")
    print(f"  Check-ins: {len(all_checkins)}")
    print(f"  Text interactions: {len(all_text_interactions)}")
    print(f"  Voice features: {len(all_voice_features)}")
    print(f"  Behavioural patterns: {len(all_behavioural_patterns)}")
    print(f"  Distress scores: {len(all_distress_scores)}")


if __name__ == "__main__":
    generate_all_synthetic_data(num_victims=5)