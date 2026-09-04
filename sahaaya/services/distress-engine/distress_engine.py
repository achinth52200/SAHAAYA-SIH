"""
Dynamic Distress Score Engine for SAHAAYA
Computes weighted composite distress score (0-100) per PDR Section 4.
Implements personal baseline model, trend analysis, and escalation prediction.
"""
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

XGB_AVAILABLE = False
xgb = None
try:
    import xgboost as _xgb
    XGB_AVAILABLE = True
    xgb = _xgb
except Exception:
    pass

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error


class DistressBand(Enum):
    GREEN = "Green"      # 0-29: Stable
    YELLOW = "Yellow"    # 30-49: Mild/Emerging
    ORANGE = "Orange"    # 50-74: Significant, follow-up recommended
    RED = "Red"          # 75-100: Urgent human review


@dataclass
class DistressComponents:
    """Individual component scores (0-100 each)"""
    self_report: float = 0.0          # 35% weight
    text_emotion: float = 0.0         # 20% weight
    behavioural: float = 0.0          # 15% weight
    voice: float = 0.0                # 10% weight
    case_events: float = 0.0          # 10% weight
    trend: float = 0.0                # 10% weight


@dataclass
class DistressScoreResult:
    """Complete distress score result"""
    victim_id: str
    timestamp: str
    distress_score: float
    band: str
    components: DistressComponents
    personal_baseline: float
    contributing_factors: List[Dict[str, Any]]
    escalation_probability_7d: float
    escalation_probability_30d: float
    trend_direction: str  # "improving", "stable", "worsening"
    confidence: float


# PDR Section 4 Weights
WEIGHTS = {
    "self_report": 0.35,
    "text_emotion": 0.20,
    "behavioural": 0.15,
    "voice": 0.10,
    "case_events": 0.10,
    "trend": 0.10,
}

BAND_THRESHOLDS = {
    DistressBand.GREEN: (0, 29),
    DistressBand.YELLOW: (30, 49),
    DistressBand.ORANGE: (50, 74),
    DistressBand.RED: (75, 100),
}

EMOTION_DISTRESS_WEIGHTS = {
    "fear": 0.85,
    "anger": 0.75,
    "hopelessness": 0.95,
    "threat": 1.0,
    "sadness": 0.65,
    "anxiety": 0.75,
    "neutral": 0.05,
}


class PersonalBaselineModel:
    """Personal baseline model - compares individual against their own history"""
    
    def __init__(self, min_history_weeks: int = 4):
        self.min_history_weeks = min_history_weeks
        self.baselines: Dict[str, float] = {}
        self.history: Dict[str, List[float]] = {}
    
    def update(self, victim_id: str, distress_score: float):
        """Update baseline with new score"""
        if victim_id not in self.history:
            self.history[victim_id] = []
        self.history[victim_id].append(distress_score)
        
        # Recompute baseline using recent history (last 12 weeks or all if less)
        recent = self.history[victim_id][-12:]
        if len(recent) >= self.min_history_weeks:
            # Use trimmed mean (exclude top/bottom 10%) for robustness
            sorted_scores = sorted(recent)
            trim = max(1, len(sorted_scores) // 10)
            trimmed = sorted_scores[trim:-trim] if trim > 0 else sorted_scores
            self.baselines[victim_id] = np.mean(trimmed)
        else:
            # Not enough history, use population default
            self.baselines[victim_id] = 30.0
    
    def get_baseline(self, victim_id: str) -> float:
        return self.baselines.get(victim_id, 30.0)
    
    def get_deviation(self, victim_id: str, current_score: float) -> float:
        """Get deviation from personal baseline"""
        baseline = self.get_baseline(victim_id)
        return current_score - baseline


class DistressEngine:
    """Main Dynamic Distress Score Engine"""
    
    def __init__(self, baseline_model: Optional[PersonalBaselineModel] = None):
        self.baseline_model = baseline_model or PersonalBaselineModel()
        self.escalation_model = None
        self.feature_names = [
            "self_report", "text_emotion", "behavioural", "voice", 
            "case_events", "trend", "personal_baseline", "week_number"
        ]
    
    def compute_self_report_score(self, checkin: Dict[str, Any]) -> float:
        """Compute self-reported well-being component (0-100, higher = more distress)"""
        scores = checkin.get("scores", {})
        # Invert: higher well-being scores = lower distress
        well_being = (
            scores.get("mood", 50) * 0.30 +
            (100 - scores.get("anxiety_stress", 50)) * 0.20 +
            scores.get("sleep_quality", 50) * 0.15 +
            scores.get("safety", 50) * 0.15 +
            (100 - scores.get("hopelessness", 50)) * 0.10 +
            (100 - scores.get("isolation", 50)) * 0.10
        )
        # Convert to distress (0-100)
        distress = 100 - well_being
        # Urgent help flag adds significant distress.
        # Treated as truthy rather than compared to exactly 1: the flag arrives from
        # several channels (app, chatbot, SMS, IVRS) and any of them could deliver it
        # as true, "1", or a count of requests. Dropping an explicit request for
        # urgent help because it did not equal the integer 1 is the most costly
        # failure this component can have, so the comparison is deliberately lenient.
        try:
            urgent = float(scores.get("urgent_help", 0) or 0)
        except (TypeError, ValueError):
            urgent = 0.0
        if urgent >= 1:
            distress = min(100, distress + 30)
        return max(0, min(100, distress))
    
    def compute_text_emotion_score(self, text_interactions: List[Dict], emotion_model=None) -> float:
        """Compute text emotion & sentiment component (0-100)"""
        if not text_interactions:
            return 0.0
        
        total_distress = 0.0
        for interaction in text_interactions:
            # Use ground truth for synthetic data, model prediction for real
            emotion = interaction.get("predicted_emotion") or interaction.get("ground_truth_emotion", "neutral")
            weight = EMOTION_DISTRESS_WEIGHTS.get(emotion, 0.1)
            total_distress += weight
        
        avg_distress = (total_distress / len(text_interactions)) * 100
        return max(0, min(100, avg_distress))
    
    def compute_behavioural_score(self, patterns: List[Dict]) -> float:
        """
        Compute behavioural pattern change component (0-100).

        Behavioural disengagement is measured on two axes:
          * intensity  - how severe the concerning patterns are when they occur
          * frequency  - what share of the observation window is concerning

        Averaging severity across every observation (including "normal" days) meant a
        window that is mostly normal drove the component toward zero no matter how
        severe the concerning days were, so this component could never meaningfully
        rise. Normal days now set the frequency denominator instead of diluting severity.
        """
        if not patterns:
            return 0.0

        severity_map = {
            "missed_checkin": 25,
            "cancelled_counselling": 30,
            "reduced_engagement": 20,
            "late_response": 15,
            "normal": 0,
        }
        # Worst single observation: cancelled counselling at severity 3.
        max_observation = 30 * 3

        concerning = [
            p for p in patterns
            if severity_map.get(p.get("pattern_type", "normal"), 0) > 0
        ]
        if not concerning:
            return 0.0

        weighted = [
            severity_map.get(p.get("pattern_type", "normal"), 0) * max(p.get("severity", 1), 1)
            for p in concerning
        ]
        intensity = (sum(weighted) / len(weighted)) / max_observation * 100
        frequency = len(concerning) / len(patterns) * 100

        score = 0.6 * intensity + 0.4 * frequency
        return max(0.0, min(100.0, score))
    
    def compute_voice_score(self, voice_features: List[Dict]) -> float:
        """Compute voice-based supporting indicators component (0-100)"""
        if not voice_features:
            return 0.0
        
        # Use latest voice sample
        v = voice_features[-1].get("features", {})
        
        # Higher distress indicators: high pitch variability, low energy, slow rate, high jitter/shimmer
        pitch_distress = (v.get("pitch_std", 0.2) / 0.4) * 30
        energy_distress = ((1 - v.get("energy_mean", 0.5)) / 0.8) * 30
        rate_distress = ((1 - v.get("speaking_rate", 0.5)) / 0.9) * 20
        jitter_distress = (v.get("jitter", 0.02) / 0.05) * 10
        shimmer_distress = (v.get("shimmer", 0.02) / 0.05) * 10
        
        total = pitch_distress + energy_distress + rate_distress + jitter_distress + shimmer_distress
        return max(0, min(100, total))
    
    def compute_case_events_score(self, case_events: List[Dict]) -> float:
        """
        Compute case & external stress events component (0-100).

        Events carry a signed stress_impact: a threat or an adjournment adds stress,
        while compensation or an assigned counsellor relieves it. Summing raw impact
        across the whole case history meant a victim with a few stressful events
        saturated at the 100 cap, while one whose positive and negative events roughly
        cancelled was clamped to a flat 0 - neither reflecting how recent the events
        were.

        Impact is now decayed with a 30-day half-life, so an adjournment last week
        weighs far more than a hearing three months ago, and the component keeps
        moving as a case progresses.
        """
        if not case_events:
            return 0.0

        def parsed(event):
            ts = event.get("event_date")
            if isinstance(ts, str):
                try:
                    return datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    return None
            return ts if isinstance(ts, datetime) else None

        dated = [(parsed(e), e.get("stress_impact", 0)) for e in case_events]
        dated = [(ts, impact) for ts, impact in dated if ts is not None]
        if not dated:
            # No usable timestamps - fall back to an undecayed sum.
            return max(0.0, min(100.0, float(sum(e.get("stress_impact", 0) for e in case_events))))

        # Decay relative to the most recent event in the window.
        reference = max(ts for ts, _ in dated)
        half_life_days = 30.0

        decayed = 0.0
        for ts, impact in dated:
            age_days = max((reference - ts).days, 0)
            decayed += impact * (0.5 ** (age_days / half_life_days))

        return max(0.0, min(100.0, decayed))
    
    def compute_trend_score(self, victim_id: str, historical_scores: List[float]) -> float:
        """Compute longitudinal distress trend component (0-100)"""
        if len(historical_scores) < 3:
            return 0.0
        
        # Linear trend over last 8 weeks
        recent = historical_scores[-8:]
        x = np.arange(len(recent))
        slope = np.polyfit(x, recent, 1)[0] if len(recent) > 1 else 0
        
        # Convert slope to 0-100 scale (positive slope = worsening = higher distress)
        # Slope of +5 per week = 100 distress, slope of -5 = 0 distress
        trend_distress = 50 + (slope * 10)
        return max(0, min(100, trend_distress))
    
    def compute_composite_score(self, components: DistressComponents) -> float:
        """Compute weighted composite distress score"""
        return (
            components.self_report * WEIGHTS["self_report"] +
            components.text_emotion * WEIGHTS["text_emotion"] +
            components.behavioural * WEIGHTS["behavioural"] +
            components.voice * WEIGHTS["voice"] +
            components.case_events * WEIGHTS["case_events"] +
            components.trend * WEIGHTS["trend"]
        )
    
    def get_band(self, score: float) -> DistressBand:
        """Get distress band from score"""
        if score < 30:
            return DistressBand.GREEN
        elif score < 50:
            return DistressBand.YELLOW
        elif score < 75:
            return DistressBand.ORANGE
        else:
            return DistressBand.RED
    
    def get_trend_direction(self, historical_scores: List[float]) -> str:
        """Determine trend direction"""
        if len(historical_scores) < 3:
            return "stable"
        recent = historical_scores[-4:]
        slope = np.polyfit(np.arange(len(recent)), recent, 1)[0]
        if slope > 2:
            return "worsening"
        elif slope < -2:
            return "improving"
        return "stable"
    
    def compute_contributing_factors(self, components: DistressComponents, 
                                     victim_id: str, baseline: float) -> List[Dict[str, Any]]:
        """Identify top contributing factors for explainability"""
        factors = []
        
        # Component contributions with explicit mapping
        component_map = [
            ("Self-reported well-being", "self_report", components.self_report, WEIGHTS["self_report"]),
            ("Text emotion & sentiment", "text_emotion", components.text_emotion, WEIGHTS["text_emotion"]),
            ("Behavioural patterns", "behavioural", components.behavioural, WEIGHTS["behavioural"]),
            ("Voice indicators", "voice", components.voice, WEIGHTS["voice"]),
            ("Case events", "case_events", components.case_events, WEIGHTS["case_events"]),
            ("Distress trend", "trend", components.trend, WEIGHTS["trend"]),
        ]
        
        # Sort by contribution
        sorted_factors = sorted(component_map, key=lambda x: x[2] * x[3], reverse=True)
        
        for name, attr, value, weight in sorted_factors:
            contribution = value * weight
            if contribution > 1.0:  # Only include meaningful contributions
                factors.append({
                    "factor": name,
                    "contribution": round(contribution, 1),
                    "component_score": round(value, 1),
                    "weight": weight,
                })
        
        # Add baseline deviation
        composite = sum(value * weight for _, _, value, weight in component_map)
        deviation = composite - baseline
        if abs(deviation) > 5:
            factors.append({
                "factor": "Personal baseline deviation",
                "contribution": round(deviation, 1),
                "component_score": round(baseline, 1),
                "weight": "N/A",
            })
        
        return factors
    
    def compute_distress_score(
        self,
        victim_id: str,
        checkin: Optional[Dict] = None,
        text_interactions: Optional[List[Dict]] = None,
        behavioural_patterns: Optional[List[Dict]] = None,
        voice_features: Optional[List[Dict]] = None,
        case_events: Optional[List[Dict]] = None,
        historical_scores: Optional[List[float]] = None,
        emotion_model=None,
    ) -> DistressScoreResult:
        """Compute complete distress score for a victim at current time"""
        
        # Compute each component
        self_report = self.compute_self_report_score(checkin) if checkin else 0.0
        text_emotion = self.compute_text_emotion_score(text_interactions or [], emotion_model)
        behavioural = self.compute_behavioural_score(behavioural_patterns or [])
        voice = self.compute_voice_score(voice_features or [])
        case_events_score = self.compute_case_events_score(case_events or [])
        trend = self.compute_trend_score(victim_id, historical_scores or [])
        
        components = DistressComponents(
            self_report=self_report,
            text_emotion=text_emotion,
            behavioural=behavioural,
            voice=voice,
            case_events=case_events_score,
            trend=trend,
        )
        
        # Composite score
        composite = self.compute_composite_score(components)
        
        # Adjust for personal baseline
        baseline = self.baseline_model.get_baseline(victim_id)
        adjusted_score = composite + (baseline - 30) * 0.3  # Baseline adjustment factor
        adjusted_score = max(0, min(100, adjusted_score))
        
        # Update baseline
        self.baseline_model.update(victim_id, adjusted_score)
        
        # Band
        band = self.get_band(adjusted_score)
        
        # Trend direction
        trend_direction = self.get_trend_direction(historical_scores or [])
        
        # Contributing factors
        contributing_factors = self.compute_contributing_factors(
            components, victim_id, baseline
        )
        
        # Escalation probabilities (simplified - would use trained model in production)
        escalation_7d = min(1.0, adjusted_score / 100 * 1.2)
        escalation_30d = min(1.0, adjusted_score / 100 * 1.5)
        
        # Confidence based on data completeness
        data_completeness = sum([
            1 if checkin else 0,
            1 if text_interactions else 0,
            1 if behavioural_patterns else 0,
            1 if voice_features else 0,
            1 if case_events else 0,
        ]) / 5
        confidence = 0.5 + 0.5 * data_completeness
        
        return DistressScoreResult(
            victim_id=victim_id,
            timestamp=datetime.now().isoformat(),
            distress_score=round(adjusted_score, 1),
            band=band.value,
            components=components,
            personal_baseline=round(baseline, 1),
            contributing_factors=contributing_factors,
            escalation_probability_7d=round(escalation_7d, 3),
            escalation_probability_30d=round(escalation_30d, 3),
            trend_direction=trend_direction,
            confidence=round(confidence, 3),
        )
    
    def train_escalation_model(self, historical_data: List[Dict]):
        """Train escalation prediction model on historical data"""
        # Prepare features: component scores + baseline + time features
        X = []
        y_7d = []
        y_30d = []
        
        for record in historical_data:
            features = [
                record["components"]["self_report"],
                record["components"]["text_emotion"],
                record["components"]["behavioural"],
                record["components"]["voice"],
                record["components"]["case_events"],
                record["components"]["trend"],
                record["personal_baseline"],
                record.get("week_number", 0),
            ]
            X.append(features)
            y_7d.append(record.get("escalated_7d", 0))
            y_30d.append(record.get("escalated_30d", 0))
        
        if len(X) < 10:
            return  # Not enough data
        
        X = np.array(X)
        y_7d = np.array(y_7d)
        y_30d = np.array(y_30d)
        
        # Train model for escalation prediction
        if not XGB_AVAILABLE or xgb is None:
            from sklearn.ensemble import GradientBoostingRegressor
            self.escalation_model_7d = GradientBoostingRegressor(
                n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42
            )
            self.escalation_model_30d = GradientBoostingRegressor(
                n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42
            )
        else:
            self.escalation_model_7d = xgb.XGBRegressor(
                n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42
            )
            self.escalation_model_30d = xgb.XGBRegressor(
                n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42
            )
        
        self.escalation_model_7d.fit(X, y_7d)
        self.escalation_model_30d.fit(X, y_30d)
    
    def predict_escalation(self, components: DistressComponents, baseline: float, week: int) -> Tuple[float, float]:
        """Predict escalation probability using trained model"""
        if self.escalation_model_7d is None:
            # Fallback to heuristic
            score = self.compute_composite_score(components)
            return min(1.0, score / 100 * 1.2), min(1.0, score / 100 * 1.5)
        
        features = np.array([[
            components.self_report, components.text_emotion, components.behavioural,
            components.voice, components.case_events, components.trend,
            baseline, week
        ]])
        
        p7 = float(self.escalation_model_7d.predict(features)[0])
        p30 = float(self.escalation_model_30d.predict(features)[0])
        
        return max(0, min(1, p7)), max(0, min(1, p30))


def load_synthetic_data(data_dir: str) -> Dict[str, List[Dict]]:
    """Load all synthetic data for processing"""
    data = {}
    for file in Path(data_dir).glob("*.jsonl"):
        name = file.stem
        data[name] = pd.read_json(file, lines=True).to_dict("records")
    return data


def load_synthetic_data_from_nlp_service() -> Dict[str, List[Dict]]:
    """Load synthetic data from nlp-ai-service data directory"""
    base_path = Path(__file__).parent.parent / "nlp-ai-service" / "data" / "synthetic"
    return load_synthetic_data(str(base_path))


def run_demo():
    """Run demo distress scoring on synthetic data"""
    print("Loading synthetic data...")
    data = load_synthetic_data_from_nlp_service()
    
    # Initialize engine
    engine = DistressEngine()
    
    # Group data by victim
    victims = {}
    for victim in data["victims"]:
        vid = victim["victim_id"]
        victims[vid] = {
            "profile": victim,
            "checkins": [c for c in data["checkins"] if c["victim_id"] == vid],
            "case_events": [c for c in data["case_events"] if c["victim_id"] == vid],
            "text_interactions": [c for c in data["text_interactions"] if c["victim_id"] == vid],
            "voice_features": [c for c in data["voice_features"] if c["victim_id"] == vid],
            "behavioural_patterns": [c for c in data["behavioural_patterns"] if c["victim_id"] == vid],
            "distress_scores": [c for c in data["distress_scores"] if c["victim_id"] == vid],
        }
    
# Load emotion model for text predictions
        model_path = Path(__file__).parent.parent / "nlp-ai-service" / "models"
        emotion_model = joblib.load(model_path / "emotion_classifier_lightweight.joblib")
        vectorizer = joblib.load(model_path / "tfidf_vectorizer.joblib")
    
    # Process each victim
    for vid, vdata in victims.items():
        print(f"\n{'='*60}")
        print(f"Processing {vid} ({vdata['profile']['case_type']})")
        print(f"{'='*60}")
        
        # Sort by date
        checkins = sorted(vdata["checkins"], key=lambda x: x["checkin_date"])
        case_events = sorted(vdata["case_events"], key=lambda x: x["event_date"])
        text_interactions = sorted(vdata["text_interactions"], key=lambda x: x["timestamp"])
        voice_features = sorted(vdata["voice_features"], key=lambda x: x["timestamp"])
        behavioural = sorted(vdata["behavioural_patterns"], key=lambda x: x["date"])
        
        # Parse timestamps for comparison
        for t in text_interactions:
            if isinstance(t["timestamp"], str):
                t["_parsed_ts"] = datetime.fromisoformat(t["timestamp"].replace('Z', '+00:00'))
            else:
                t["_parsed_ts"] = t["timestamp"]
        
        for v in voice_features:
            if isinstance(v["timestamp"], str):
                v["_parsed_ts"] = datetime.fromisoformat(v["timestamp"].replace('Z', '+00:00'))
            else:
                v["_parsed_ts"] = v["timestamp"]
        
        for b in behavioural:
            if isinstance(b["date"], str):
                b["_parsed_ts"] = datetime.fromisoformat(b["date"].replace('Z', '+00:00'))
            else:
                b["_parsed_ts"] = b["date"]
        
        for e in case_events:
            if isinstance(e["event_date"], str):
                e["_parsed_ts"] = datetime.fromisoformat(e["event_date"].replace('Z', '+00:00'))
            else:
                e["_parsed_ts"] = e["event_date"]
        
        for c in checkins:
            if isinstance(c["checkin_date"], str):
                c["_parsed_ts"] = datetime.fromisoformat(c["checkin_date"].replace('Z', '+00:00'))
            else:
                c["_parsed_ts"] = c["checkin_date"]
        
        # Simulate weekly scoring
        historical_scores = []
        
        for week_idx, checkin in enumerate(checkins[::3]):  # Every 3rd checkin ~ weekly
            checkin_date = checkin["_parsed_ts"]
            
            # Get data up to this week
            week_cutoff = checkin_date + timedelta(days=7)
            
            week_texts = [t for t in text_interactions if t["_parsed_ts"] <= week_cutoff]
            week_voice = [v for v in voice_features if v["_parsed_ts"] <= week_cutoff]
            week_behaviour = [b for b in behavioural if b["_parsed_ts"] <= week_cutoff]
            week_events = [e for e in case_events if e["_parsed_ts"] <= week_cutoff]
            
            # Add predicted emotions to text interactions
            for t in week_texts:
                if "predicted_emotion" not in t:
                    pred = predict_emotion(t["text"], emotion_model, vectorizer)
                    t["predicted_emotion"] = pred["emotion"]
            
            # Compute distress score
            result = engine.compute_distress_score(
                victim_id=vid,
                checkin=checkin,
                text_interactions=week_texts[-10:],  # Last 10 interactions
                behavioural_patterns=week_behaviour[-10:],
                voice_features=week_voice[-5:],
                case_events=week_events,
                historical_scores=historical_scores,
                emotion_model=emotion_model,
            )
            
            historical_scores.append(result.distress_score)
            
            print(f"\nWeek {week_idx+1} ({checkin_date.strftime('%Y-%m-%d')}):")
            print(f"  Distress Score: {result.distress_score} ({result.band})")
            print(f"  Personal Baseline: {result.personal_baseline}")
            print(f"  Trend: {result.trend_direction}")
            print(f"  Escalation (7d/30d): {result.escalation_probability_7d:.2f} / {result.escalation_probability_30d:.2f}")
            print(f"  Confidence: {result.confidence:.2f}")
            print("  Components:")
            for name, value in asdict(result.components).items():
                print(f"    {name}: {value:.1f}")
            print("  Top Contributing Factors:")
            for f in result.contributing_factors[:3]:
                print(f"    - {f['factor']}: +{f['contribution']:.1f}")


def predict_emotion(text: str, model, vectorizer) -> Dict[str, Any]:
    """Predict emotion for a single text."""
    X = vectorizer.transform([text])
    probs = model.predict_proba(X)[0]
    pred_id = np.argmax(probs)
    confidence = probs[pred_id]
    return {
        "emotion": ID_TO_EMOTION[pred_id],
        "confidence": round(float(confidence), 4),
        "all_probabilities": {ID_TO_EMOTION[i]: round(float(probs[i]), 4) for i in range(len(EMOTIONS))}
    }


# Local constants for demo
EMOTIONS = ["fear", "anger", "hopelessness", "threat", "sadness", "anxiety", "neutral"]
ID_TO_EMOTION = {i: e for i, e in enumerate(EMOTIONS)}


if __name__ == "__main__":
    run_demo()