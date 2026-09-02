"""
Explainable AI Layer for SAHAAYA
Provides SHAP-based feature importance, rule-based explanations, and human-readable 
reasoning for every distress score and alert.
"""
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

# SHAP is optional - handle gracefully
SHAP_AVAILABLE = False
shap = None
try:
    import shap as _shap
    SHAP_AVAILABLE = True
    shap = _shap
except ImportError:
    pass
except Exception:
    pass


class ExplanationType(Enum):
    SHAP = "shap"
    FEATURE_IMPORTANCE = "feature_importance"
    RULE_BASED = "rule_based"
    COUNTERFACTUAL = "counterfactual"


@dataclass
class FactorExplanation:
    """Single factor explanation"""
    factor_name: str
    contribution: float
    direction: str  # "increasing" or "decreasing"
    description: str
    evidence: Dict[str, Any]
    confidence: float


@dataclass
class DistressExplanation:
    """Complete explanation for a distress score"""
    victim_id: str
    timestamp: str
    distress_score: float
    band: str
    explanation_type: str
    primary_factors: List[FactorExplanation]
    secondary_factors: List[FactorExplanation]
    protective_factors: List[FactorExplanation]
    risk_factors: List[FactorExplanation]
    narrative: str
    clinical_summary: str
    recommended_actions: List[str]
    confidence: float


class RuleBasedExplainer:
    """Rule-based explanations for distress components"""
    
    # Human-readable descriptions for each component
    COMPONENT_DESCRIPTIONS = {
        "self_report": {
            "high": "Self-reported well-being indicates significant distress across mood, anxiety, sleep, safety, hopelessness, and isolation",
            "medium": "Self-reported well-being shows moderate concerns in several areas",
            "low": "Self-reported well-being is relatively stable",
        },
        "text_emotion": {
            "high": "Text communications show strong indicators of fear, anger, hopelessness, or threat language",
            "medium": "Text communications show some negative emotional content",
            "low": "Text communications are predominantly neutral or positive",
        },
        "behavioural": {
            "high": "Significant behavioural changes detected: missed check-ins, cancelled counselling sessions, reduced engagement",
            "medium": "Some behavioural changes noted: occasional missed check-ins or delayed responses",
            "low": "Behavioural patterns are consistent with normal engagement",
        },
        "voice": {
            "high": "Voice analysis shows acoustic markers of distress: elevated pitch variability, reduced energy, slower speech rate",
            "medium": "Voice analysis shows some acoustic variations that may indicate stress",
            "low": "Voice acoustic features are within normal range",
        },
        "case_events": {
            "high": "Recent case events (threats, court hearings, delays) are contributing significantly to distress",
            "medium": "Some case events are adding to stress levels",
            "low": "No recent high-stress case events",
        },
        "trend": {
            "high": "Distress trend shows clear worsening trajectory over recent weeks",
            "medium": "Distress trend shows slight upward movement",
            "low": "Distress trend is stable or improving",
        },
    }
    
    THRESHOLDS = {
        "high": 60,
        "medium": 30,
        "low": 0,
    }
    
    @classmethod
    def get_level(cls, score: float) -> str:
        if score >= cls.THRESHOLDS["high"]:
            return "high"
        elif score >= cls.THRESHOLDS["medium"]:
            return "medium"
        return "low"
    
    @classmethod
    def explain_component(cls, component_name: str, score: float, weight: float) -> FactorExplanation:
        """Generate rule-based explanation for a single component"""
        level = cls.get_level(score)
        contribution = score * weight
        direction = "increasing" if contribution > 0 else "decreasing"
        
        desc = cls.COMPONENT_DESCRIPTIONS.get(component_name, {}).get(level, "")
        
        return FactorExplanation(
            factor_name=component_name.replace("_", " ").title(),
            contribution=round(contribution, 1),
            direction=direction,
            description=desc,
            evidence={"component_score": round(score, 1), "weight": weight, "level": level},
            confidence=0.9 if level != "low" else 0.7,
        )


class SHAPExplainer:
    """SHAP-based explanations using trained models"""
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.explainer = None
        self.feature_names = [
            "self_report", "text_emotion", "behavioural", "voice", 
            "case_events", "trend", "personal_baseline", "week_number"
        ]
        if model_path and SHAP_AVAILABLE:
            self.load_model(model_path)
    
    def load_model(self, model_path: str):
        """Load trained escalation prediction model for SHAP"""
        try:
            import xgboost as xgb
            self.model = xgb.XGBRegressor()
            self.model.load_model(model_path)
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            print(f"Could not load SHAP model: {e}")
    
    def explain(self, features: np.ndarray) -> Dict[str, float]:
        """Generate SHAP values for feature importance"""
        if self.explainer is None or not SHAP_AVAILABLE:
            # Fallback to weight-based importance
            return dict(zip(self.feature_names[:6], [0.35, 0.20, 0.15, 0.10, 0.10, 0.10]))
        
        shap_values = self.explainer.shap_values(features)
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
        
        # Mean absolute SHAP values per feature
        importance = np.mean(np.abs(shap_values), axis=0)
        return dict(zip(self.feature_names, importance))


class CounterfactualExplainer:
    """Generate counterfactual explanations: what would need to change to improve score"""
    
    def __init__(self, distress_engine):
        self.engine = distress_engine
    
    def generate_counterfactuals(
        self, 
        victim_id: str,
        current_components: Dict[str, float],
        current_score: float,
        target_band: str = "Green"
    ) -> List[Dict[str, Any]]:
        """Generate counterfactual scenarios to reach target band"""
        target_score = {"Green": 25, "Yellow": 40, "Orange": 60}.get(target_band, 25)
        
        if current_score <= target_score:
            return []
        
        # Calculate required reduction
        required_reduction = current_score - target_score
        
        # Find most impactful components to change
        component_weights = {
            "self_report": 0.35,
            "text_emotion": 0.20,
            "behavioural": 0.15,
            "voice": 0.10,
            "case_events": 0.10,
            "trend": 0.10,
        }
        
        # Sort by potential impact (score * weight)
        impacts = []
        for comp, score in current_components.items():
            if comp in component_weights:
                weight = component_weights[comp]
                max_reduction = score * weight  # If component went to 0
                impacts.append((comp, score, weight, max_reduction))
        
        impacts.sort(key=lambda x: x[3], reverse=True)
        
        counterfactuals = []
        remaining_reduction = required_reduction
        
        for comp, score, weight, max_red in impacts:
            if remaining_reduction <= 0:
                break
            
            # How much this component needs to reduce
            needed_reduction = min(max_red, remaining_reduction)
            target_component_score = max(0, score - (needed_reduction / weight))
            
            counterfactuals.append({
                "component": comp.replace("_", " ").title(),
                "current_score": round(score, 1),
                "target_score": round(target_component_score, 1),
                "required_change": round(score - target_component_score, 1),
                "impact_on_total": round(needed_reduction, 1),
                "description": self._get_counterfactual_description(comp, score, target_component_score),
            })
            
            remaining_reduction -= needed_reduction
        
        return counterfactuals
    
    def _get_counterfactual_description(self, component: str, current: float, target: float) -> str:
        """Human-readable counterfactual description"""
        descriptions = {
            "self_report": f"Improve self-reported well-being from {current:.0f} to {target:.0f} "
                          f"(better mood, reduced anxiety, improved sleep, increased safety feeling)",
            "text_emotion": f"Reduce negative emotional content in communications from {current:.0f} to {target:.0f}",
            "behavioural": f"Improve engagement patterns from {current:.0f} to {target:.0f} "
                          f"(attend check-ins, keep counselling appointments)",
            "voice": f"Voice stress indicators reduce from {current:.0f} to {target:.0f}",
            "case_events": f"Resolution of case stressors reducing impact from {current:.0f} to {target:.0f}",
            "trend": f"Distress trend stabilizes from worsening ({current:.0f}) to stable ({target:.0f})",
        }
        return descriptions.get(component, f"Reduce {component} from {current:.0f} to {target:.0f}")


class ExplainabilityEngine:
    """Main explainability engine combining multiple explanation methods"""
    
    def __init__(self, distress_engine=None, shap_model_path: str = None):
        self.rule_explainer = RuleBasedExplainer()
        self.shap_explainer = SHAPExplainer(shap_model_path)
        self.counterfactual_explainer = CounterfactualExplainer(distress_engine) if distress_engine else None
        self.distress_engine = distress_engine
    
    def explain_distress_score(
        self,
        victim_id: str,
        distress_result,  # DistressScoreResult from distress_engine
        include_counterfactuals: bool = True,
        target_band: str = "Green",
    ) -> DistressExplanation:
        """Generate comprehensive explanation for a distress score"""
        
        # Get component scores
        components = asdict(distress_result.components)
        
        # Rule-based explanations for each component
        all_factors = []
        for comp_name, score in components.items():
            weight = {"self_report": 0.35, "text_emotion": 0.20, "behavioural": 0.15, 
                     "voice": 0.10, "case_events": 0.10, "trend": 0.10}.get(comp_name, 0)
            if weight > 0:
                factor = self.rule_explainer.explain_component(comp_name, score, weight)
                all_factors.append(factor)
        
        # Sort by absolute contribution
        all_factors.sort(key=lambda f: abs(f.contribution), reverse=True)
        
        # Categorize factors
        primary_factors = [f for f in all_factors if abs(f.contribution) >= 5.0][:3]
        secondary_factors = [f for f in all_factors if 1.0 <= abs(f.contribution) < 5.0]
        risk_factors = [f for f in all_factors if f.direction == "increasing" and f.contribution > 1.0]
        protective_factors = [f for f in all_factors if f.direction == "decreasing" or f.contribution < -1.0]
        
        # Generate narrative
        narrative = self._generate_narrative(distress_result, primary_factors)
        
        # Generate clinical summary
        clinical_summary = self._generate_clinical_summary(distress_result, primary_factors)
        
        # Generate recommended actions
        recommended_actions = self._generate_recommended_actions(distress_result, risk_factors)
        
        # Counterfactuals
        counterfactuals = []
        if include_counterfactuals and self.counterfactual_explainer:
            counterfactuals = self.counterfactual_explainer.generate_counterfactuals(
                victim_id, components, distress_result.distress_score, target_band
            )
        
        return DistressExplanation(
            victim_id=victim_id,
            timestamp=distress_result.timestamp,
            distress_score=distress_result.distress_score,
            band=distress_result.band,
            explanation_type="hybrid",
            primary_factors=primary_factors,
            secondary_factors=secondary_factors,
            protective_factors=protective_factors,
            risk_factors=risk_factors,
            narrative=narrative,
            clinical_summary=clinical_summary,
            recommended_actions=recommended_actions,
            confidence=distress_result.confidence,
        )
    
    def _generate_narrative(self, result, primary_factors: List[FactorExplanation]) -> str:
        """Generate human-readable narrative explanation"""
        band = result.band
        score = result.distress_score
        baseline = result.personal_baseline
        
        narratives = {
            "Green": f"The current distress score of {score:.1f} indicates a stable state (Green band). "
                    f"This is {abs(score - baseline):.1f} points {'above' if score > baseline else 'below'} "
                    f"the personal baseline of {baseline:.1f}.",
            "Yellow": f"The distress score of {score:.1f} falls in the Yellow band (mild/emerging concern). "
                     f"This represents a {abs(score - baseline):.1f}-point {'increase' if score > baseline else 'decrease'} "
                     f"from the personal baseline of {baseline:.1f}.",
            "Orange": f"The distress score of {score:.1f} is in the Orange band (significant concern, "
                     f"follow-up recommended). This is {abs(score - baseline):.1f} points "
                     f"{'above' if score > baseline else 'below'} the personal baseline of {baseline:.1f}.",
            "Red": f"URGENT: The distress score of {score:.1f} is in the Red band (urgent human review required). "
                  f"This is {abs(score - baseline):.1f} points {'above' if score > baseline else 'below'} "
                  f"the personal baseline of {baseline:.1f}.",
        }
        
        base = narratives.get(band, narratives["Green"])
        
        if primary_factors:
            factor_desc = ", ".join([f"{f.factor_name} ({f.contribution:+.1f})" for f in primary_factors[:2]])
            base += f" Primary drivers: {factor_desc}."
        
        trend = result.trend_direction
        if trend == "worsening":
            base += " The trend shows worsening distress over recent weeks."
        elif trend == "improving":
            base += " The trend shows improvement over recent weeks."
        
        return base
    
    def _generate_clinical_summary(self, result, primary_factors: List[FactorExplanation]) -> str:
        """Generate clinical-style summary for human reviewers"""
        lines = [
            f"DISTRESS ASSESSMENT SUMMARY",
            f"Victim ID: {result.victim_id}",
            f"Timestamp: {result.timestamp}",
            f"Current Score: {result.distress_score:.1f} ({result.band} Band)",
            f"Personal Baseline: {result.personal_baseline:.1f}",
            f"Trend: {result.trend_direction.capitalize()}",
            f"7-day Escalation Risk: {result.escalation_probability_7d:.0%}",
            f"30-day Escalation Risk: {result.escalation_probability_30d:.0%}",
            f"Confidence: {result.confidence:.0%}",
            "",
            "KEY CONTRIBUTING FACTORS:",
        ]
        
        for i, factor in enumerate(primary_factors, 1):
            lines.append(f"  {i}. {factor.factor_name}: {factor.contribution:+.1f} points - {factor.description}")
        
        lines.extend([
            "",
            "COMPONENT BREAKDOWN:",
            f"  Self-reported well-being (35%): {result.components.self_report:.1f}",
            f"  Text emotion & sentiment (20%): {result.components.text_emotion:.1f}",
            f"  Behavioural patterns (15%): {result.components.behavioural:.1f}",
            f"  Voice indicators (10%): {result.components.voice:.1f}",
            f"  Case events (10%): {result.components.case_events:.1f}",
            f"  Longitudinal trend (10%): {result.components.trend:.1f}",
        ])
        
        return "\n".join(lines)
    
    def _generate_recommended_actions(self, result, risk_factors: List[FactorExplanation]) -> List[str]:
        """Generate recommended actions based on risk factors and band"""
        actions = []
        
        # Band-based actions
        if result.band == "Red":
            actions.extend([
                "IMMEDIATE: Assign counsellor for urgent outreach within 4 hours",
                "Activate safety protocol if urgent_help flag was triggered",
                "Notify district officer for protection assessment",
            ])
        elif result.band == "Orange":
            actions.extend([
                "Schedule counsellor follow-up within 24 hours",
                "Review case timeline for upcoming stressors (court dates, hearings)",
                "Increase check-in frequency to daily",
            ])
        elif result.band == "Yellow":
            actions.extend([
                "Schedule counsellor check-in within 72 hours",
                "Monitor for escalation, increase check-in frequency",
                "Review self-report trends for specific domains (sleep, safety, hopelessness)",
            ])
        else:  # Green
            actions.append("Continue routine monitoring at current frequency")
        
        # Factor-specific actions
        factor_actions = {
            "Self-reported well-being": "Focused counselling on reported domains (mood, anxiety, sleep, safety)",
            "Text emotion & sentiment": "Review chatbot conversations for threat/hopelessness language; crisis resources",
            "Behavioural patterns": "Address engagement barriers; outreach for missed appointments",
            "Voice indicators": "Consider voice-based check-in for additional context (with consent)",
            "Case events": "Coordinate with legal team on upcoming hearings; victim support during proceedings",
            "Distress trend": "Implement early intervention; review personal baseline for recalibration",
        }
        
        for factor in risk_factors[:3]:
            action = factor_actions.get(factor.factor_name)
            if action and action not in actions:
                actions.append(action)
        
        return actions[:5]  # Limit to top 5 actions
    
    def explain_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanation for an alert (for officer dashboard)"""
        explanation = self.explain_distress_score(
            victim_id=alert_data["victim_id"],
            distress_result=alert_data["distress_result"],
            include_counterfactuals=True,
        )
        
        return {
            "alert_id": alert_data.get("alert_id"),
            "victim_id": explanation.victim_id,
            "timestamp": explanation.timestamp,
            "distress_score": explanation.distress_score,
            "band": explanation.band,
            "narrative": explanation.narrative,
            "clinical_summary": explanation.clinical_summary,
            "primary_factors": [asdict(f) for f in explanation.primary_factors],
            "recommended_actions": explanation.recommended_actions,
            "counterfactuals": explanation.counterfactuals if hasattr(explanation, 'counterfactuals') else [],
            "confidence": explanation.confidence,
            "requires_human_review": explanation.band in ["Orange", "Red"],
        }


def create_explanation_for_demo():
    """Create a demo explanation using the distress engine results"""
    # This would be called with actual distress engine results
    pass


if __name__ == "__main__":
    # Test the explainability engine with mock data (standalone test)
    print("Testing Explainability Engine...")
    
    # Create mock distress result using local classes
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
        contributing_factors: List = None
        escalation_probability_7d: float = 0.72
        escalation_probability_30d: float = 0.85
        trend_direction: str = "worsening"
        confidence: float = 0.85
    
    mock_components = MockComponents()
    mock_result = MockResult(components=mock_components)
    
    # Create explainability engine
    class MockDistressEngine:
        pass
    
    engine = MockDistressEngine()
    explainer = ExplainabilityEngine(distress_engine=engine)
    
    # Generate explanation
    explanation = explainer.explain_distress_score("VICTIM_0001", mock_result)
    
    print(f"\n{'='*60}")
    print("EXPLANATION OUTPUT")
    print(f"{'='*60}")
    print(f"Victim: {explanation.victim_id}")
    print(f"Score: {explanation.distress_score} ({explanation.band})")
    print(f"\nNarrative:\n{explanation.narrative}")
    print(f"\nClinical Summary:\n{explanation.clinical_summary}")
    print(f"\nRecommended Actions:")
    for i, action in enumerate(explanation.recommended_actions, 1):
        print(f"  {i}. {action}")
    print(f"\nPrimary Factors:")
    for f in explanation.primary_factors:
        print(f"  - {f.factor_name}: {f.contribution:+.1f} - {f.description}")
    print(f"\nProtective Factors:")
    for f in explanation.protective_factors:
        print(f"  - {f.factor_name}: {f.contribution:+.1f}")