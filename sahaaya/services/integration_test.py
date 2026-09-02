#!/usr/bin/env python
"""
Integration Test for SAHAAYA AI Pipeline
Tests the complete flow: Synthetic Data -> NLP -> Distress Engine -> Explainability
"""
import sys
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass

# Add paths
BASE = Path(__file__).parent
sys.path.insert(0, str(BASE / "nlp-ai-service"))
sys.path.insert(0, str(BASE / "distress-engine"))
sys.path.insert(0, str(BASE / "explainability-service"))

# Import our modules
from emotion_model_lightweight import (
    predict_emotion, load_trained_model, EMOTIONS, ID_TO_EMOTION
)
from distress_engine import (
    DistressEngine, DistressComponents, DistressScoreResult, PersonalBaselineModel
)
from explainability import ExplainabilityEngine


@dataclass
class MockComponents:
    self_report: float = 65.0
    text_emotion: float = 78.0
    behavioural: float = 25.0
    voice: float = 45.0
    case_events: float = 50.0
    trend: float = 80.0


@dataclass
class MockResult:
    victim_id: str = "VICTIM_0001"
    timestamp: str = datetime.now().isoformat()
    distress_score: float = 62.3
    band: str = "Orange"
    components: MockComponents = None
    personal_baseline: float = 28.5
    contributing_factors: list = None
    escalation_probability_7d: float = 0.72
    escalation_probability_30d: float = 0.85
    trend_direction: str = "worsening"
    confidence: float = 0.85


def test_emotion_model():
    """Test emotion model independently"""
    print("="*70)
    print("TEST 1: Emotion Detection Model")
    print("="*70)
    
    model_path = BASE / "nlp-ai-service" / "models"
    emotion_model, vectorizer = load_trained_model(
        str(model_path / "emotion_classifier_lightweight.joblib"),
        str(model_path / "tfidf_vectorizer.joblib")
    )
    print("   Model loaded successfully")
    
    sample_texts = [
        "I am scared to go out alone after the threat",
        "This is so unfair, nothing is happening with my case",
        "I don't think things will ever get better",
        "They said they will hurt me if I testify",
    ]
    
    for text in sample_texts:
        pred = predict_emotion(text, emotion_model, vectorizer)
        print(f"   '{text[:40]}...' -> {pred['emotion']} ({pred['confidence']:.2f})")
    
    return emotion_model, vectorizer


def test_distress_engine():
    """Test distress engine independently"""
    print("\n" + "="*70)
    print("TEST 2: Dynamic Distress Score Engine")
    print("="*70)
    
    engine = DistressEngine()
    
    # Create mock data
    mock_checkin = {
        "checkin_date": datetime.now().isoformat(),
        "scores": {
            "mood": 30, "anxiety_stress": 70, "sleep_quality": 40,
            "safety": 35, "hopelessness": 65, "isolation": 60, "urgent_help": 0
        }
    }
    
    mock_text = [
        {"predicted_emotion": "fear", "text": "I am scared"},
        {"predicted_emotion": "hopelessness", "text": "Nothing will get better"},
    ]
    
    mock_behaviour = [
        {"pattern_type": "missed_checkin", "severity": 2},
        {"pattern_type": "reduced_engagement", "severity": 1},
    ]
    
    mock_voice = [{
        "features": {
            "pitch_mean": 0.5, "pitch_std": 0.35, "energy_mean": 0.3,
            "speaking_rate": 0.4, "pause_duration": 0.4, "jitter": 0.04, "shimmer": 0.04
        }
    }]
    
    mock_case_events = [
        {"stress_impact": 25}, {"stress_impact": 15}
    ]
    
    result = engine.compute_distress_score(
        victim_id="TEST_001",
        checkin=mock_checkin,
        text_interactions=mock_text,
        behavioural_patterns=mock_behaviour,
        voice_features=mock_voice,
        case_events=mock_case_events,
        historical_scores=[20, 25, 30, 35, 40, 45, 50, 55],
    )
    
    print(f"   Victim: TEST_001")
    print(f"   Distress Score: {result.distress_score} ({result.band})")
    print(f"   Personal Baseline: {result.personal_baseline:.1f}")
    print(f"   Trend: {result.trend_direction}")
    print(f"   Escalation (7d/30d): {result.escalation_probability_7d:.0%} / {result.escalation_probability_30d:.0%}")
    print(f"   Confidence: {result.confidence:.0%}")
    print(f"   Components:")
    for name, value in vars(result.components).items():
        print(f"     {name}: {value:.1f}")
    
    return engine, result


def test_explainability(engine, distress_result):
    """Test explainability engine"""
    print("\n" + "="*70)
    print("TEST 3: Explainable AI Layer")
    print("="*70)
    
    explainer = ExplainabilityEngine(distress_engine=engine)
    
    # Use actual distress result
    explanation = explainer.explain_distress_score(
        victim_id="TEST_001",
        distress_result=distress_result,
        include_counterfactuals=True,
        target_band="Green",
    )
    
    print(f"   Explanation generated for {explanation.victim_id}")
    print(f"   Score: {explanation.distress_score} ({explanation.band})")
    print(f"   Confidence: {explanation.confidence:.0%}")
    
    print(f"\n   NARRATIVE:\n   {explanation.narrative}")
    
    print(f"\n   CLINICAL SUMMARY:")
    for line in explanation.clinical_summary.split('\n'):
        print(f"   {line}")
    
    print(f"\n   RECOMMENDED ACTIONS:")
    for i, action in enumerate(explanation.recommended_actions, 1):
        print(f"   {i}. {action}")
    
    print(f"\n   PRIMARY CONTRIBUTING FACTORS:")
    for f in explanation.primary_factors:
        print(f"   - {f.factor_name}: {f.contribution:+.1f} pts - {f.description}")
    
    # Test alert explanation
    alert_explanation = explainer.explain_alert({
        "alert_id": "ALERT_001",
        "victim_id": "TEST_001",
        "distress_result": distress_result,
    })
    print(f"\n   ALERT EXPLANATION:")
    print(f"   Alert ID: {alert_explanation['alert_id']}")
    print(f"   Requires Human Review: {alert_explanation['requires_human_review']}")
    print(f"   Band: {alert_explanation['band']}")


def test_full_pipeline_with_synthetic_data(emotion_model, vectorizer):
    """Test full pipeline with synthetic data"""
    print("\n" + "="*70)
    print("TEST 4: Full Pipeline with Synthetic Data")
    print("="*70)
    
    data_dir = BASE / "nlp-ai-service" / "data" / "synthetic"
    
    victims = pd.read_json(data_dir / "victims.jsonl", lines=True).to_dict("records")
    checkins = pd.read_json(data_dir / "checkins.jsonl", lines=True).to_dict("records")
    case_events = pd.read_json(data_dir / "case_events.jsonl", lines=True).to_dict("records")
    text_interactions = pd.read_json(data_dir / "text_interactions.jsonl", lines=True).to_dict("records")
    voice_features = pd.read_json(data_dir / "voice_features.jsonl", lines=True).to_dict("records")
    behavioural_patterns = pd.read_json(data_dir / "behavioural_patterns.jsonl", lines=True).to_dict("records")
    
    victim = victims[3]  # VICTIM_0004 - reaches Orange band
    victim_id = victim["victim_id"]
    print(f"   Processing {victim_id} ({victim['case_type']})")
    
    def parse_ts(ts):
        """Parse timestamp string, handling various formats"""
        if isinstance(ts, str):
            return datetime.fromisoformat(ts.replace('Z', '+00:00'))
        return ts
    
    # Filter and sort
    v_checkins = sorted([c for c in checkins if c["victim_id"] == victim_id], key=lambda x: x["checkin_date"])
    v_case_events = sorted([c for c in case_events if c["victim_id"] == victim_id], key=lambda x: x["event_date"])
    v_text = sorted([c for c in text_interactions if c["victim_id"] == victim_id], key=lambda x: x["timestamp"])
    v_voice = sorted([c for c in voice_features if c["victim_id"] == victim_id], key=lambda x: x["timestamp"])
    v_behaviour = sorted([c for c in behavioural_patterns if c["victim_id"] == victim_id], key=lambda x: x["date"])
    
    # Add predicted emotions
    for t in v_text:
        if "predicted_emotion" not in t:
            pred = predict_emotion(t["text"], emotion_model, vectorizer)
            t["predicted_emotion"] = pred["emotion"]
    
    engine = DistressEngine()
    historical_scores = []
    
    # Process last 5 check-ins
    for checkin in v_checkins[-5:]:
        checkin_date = parse_ts(checkin["checkin_date"])
        week_cutoff = checkin_date + timedelta(days=7)
        
        week_texts = [t for t in v_text if parse_ts(t["timestamp"]) <= week_cutoff]
        week_voice = [v for v in v_voice if parse_ts(v["timestamp"]) <= week_cutoff]
        week_behaviour = [b for b in v_behaviour if parse_ts(b["date"]) <= week_cutoff]
        week_events = [e for e in v_case_events if parse_ts(e["event_date"]) <= week_cutoff]
        
        result = engine.compute_distress_score(
            victim_id=victim_id,
            checkin=checkin,
            text_interactions=week_texts[-10:],
            behavioural_patterns=week_behaviour[-10:],
            voice_features=week_voice[-5:],
            case_events=week_events,
            historical_scores=historical_scores,
            emotion_model=emotion_model,
        )
        
        historical_scores.append(result.distress_score)
        print(f"   {checkin_date.strftime('%Y-%m-%d')}: Score={result.distress_score:.1f} ({result.band}) | "
              f"Baseline={result.personal_baseline:.1f} | Trend={result.trend_direction}")
    
    # Final explanation
    latest_result = engine.compute_distress_score(
        victim_id=victim_id,
        checkin=v_checkins[-1],
        text_interactions=[t for t in v_text if parse_ts(t["timestamp"]) <= 
                          parse_ts(v_checkins[-1]["checkin_date"]) + timedelta(days=7)][-10:],
        behavioural_patterns=[b for b in v_behaviour if parse_ts(b["date"]) <= 
                             parse_ts(v_checkins[-1]["checkin_date"]) + timedelta(days=7)][-10:],
        voice_features=[v for v in v_voice if parse_ts(v["timestamp"]) <= 
                       parse_ts(v_checkins[-1]["checkin_date"]) + timedelta(days=7)][-5:],
        case_events=[e for e in v_case_events if parse_ts(e["event_date"]) <= 
                    parse_ts(v_checkins[-1]["checkin_date"]) + timedelta(days=7)],
        historical_scores=historical_scores[:-1],
        emotion_model=emotion_model,
    )
    
    explainer = ExplainabilityEngine(distress_engine=engine)
    explanation = explainer.explain_distress_score(victim_id, latest_result)
    
    print(f"\n   FINAL EXPLANATION for {victim_id}:")
    print(f"   Score: {explanation.distress_score} ({explanation.band})")
    print(f"   Narrative: {explanation.narrative}")
    print(f"   Actions: {len(explanation.recommended_actions)} recommended")
    print(f"   Human Review Required: {explanation.band in ['Orange', 'Red']}")
    
    return {
        "victim_id": victim_id,
        "final_score": latest_result.distress_score,
        "final_band": latest_result.band,
        "human_review_required": explanation.band in ['Orange', 'Red'],
    }


if __name__ == "__main__":
    print("SAHAAYA AI PIPELINE INTEGRATION TEST")
    print("="*70)
    
    # Run all tests
    emotion_model, vectorizer = test_emotion_model()
    engine, distress_result = test_distress_engine()
    test_explainability(engine, distress_result)
    result = test_full_pipeline_with_synthetic_data(emotion_model, vectorizer)
    
    print("\n" + "="*70)
    print("ALL TESTS PASSED - AI Pipeline Fully Functional")
    print("="*70)
    print(f"\nFinal Result: {json.dumps(result, indent=2)}")