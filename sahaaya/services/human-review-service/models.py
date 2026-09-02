"""
Human-in-the-Loop Review Models for SAHAAYA
Defines alert lifecycle, review actions, interventions, and audit logging.
"""
from enum import Enum
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from dataclasses import dataclass, field
import uuid


class AlertStatus(str, Enum):
    """Alert lifecycle states"""
    NEW = "new"                    # AI generated, awaiting review
    ASSIGNED = "assigned"          # Assigned to counsellor/officer
    IN_REVIEW = "in_review"        # Human actively reviewing
    INTERVENTION_DECIDED = "intervention_decided"  # Action decided
    INTERVENTION_IN_PROGRESS = "intervention_in_progress"  # Action being executed
    RESOLVED = "resolved"          # Intervention complete, outcome recorded
    ESCALATED = "escalated"        # Escalated to higher authority
    FALSE_POSITIVE = "false_positive"  # Reviewed and dismissed


class AlertPriority(str, Enum):
    """Alert priority based on distress band"""
    LOW = "low"           # Yellow band
    MEDIUM = "medium"     # Orange band
    HIGH = "high"         # Red band
    CRITICAL = "critical" # Red band + urgent_help flag


class ReviewDecision(str, Enum):
    """Human review decisions"""
    CONFIRM_INTERVENE = "confirm_intervene"   # Confirm distress, plan intervention
    CONFIRM_MONITOR = "confirm_monitor"       # Confirm distress, increase monitoring
    DISMISS = "dismiss"                       # False positive, dismiss alert
    ESCALATE = "escalate"                     # Escalate to supervisor/authority
    REQUEST_MORE_INFO = "request_more_info"   # Need additional data before decision


class InterventionType(str, Enum):
    """Types of interventions per PDR Section 3.12"""
    COUNSELLING = "counselling"
    LEGAL_AID = "legal_aid"
    PROTECTION_SUPPORT = "protection_support"
    FINANCIAL_ASSISTANCE = "financial_assistance"
    REHABILITATION_REFERRAL = "rehabilitation_referral"
    SAFETY_PLANNING = "safety_planning"
    CRISIS_HOTLINE = "crisis_hotline"
    MEDICAL_REFERRAL = "medical_referral"  # Referral only, not prescription


class InterventionStatus(str, Enum):
    """Intervention execution status"""
    PLANNED = "planned"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class UserRole(str, Enum):
    """RBAC roles per PDR Section 6"""
    VICTIM = "victim"
    COUNSELLOR = "counsellor"
    DISTRICT_OFFICER = "district_officer"
    STATE_OFFICER = "state_officer"
    NATIONAL_ADMIN = "national_admin"


@dataclass
class AuditLogEntry:
    """Immutable audit log entry"""
    log_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)
    actor_id: str = ""           # User who performed action
    actor_role: UserRole = UserRole.COUNSELLOR
    action: str = ""             # Action performed
    resource_type: str = ""      # alert, intervention, victim, etc.
    resource_id: str = ""        # ID of affected resource
    details: Dict[str, Any] = field(default_factory=dict)
    ip_address: str = ""
    user_agent: str = ""
    success: bool = True
    error_message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "log_id": self.log_id,
            "timestamp": self.timestamp.isoformat(),
            "actor_id": self.actor_id,
            "actor_role": self.actor_role.value,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "success": self.success,
            "error_message": self.error_message,
        }


class Alert(BaseModel):
    """Alert model with full lifecycle tracking"""
    alert_id: str = Field(default_factory=lambda: f"ALERT_{uuid.uuid4().hex[:12].upper()}")
    victim_id: str
    distress_score: float
    band: str
    priority: AlertPriority
    status: AlertStatus = AlertStatus.NEW
    
    # AI-generated explanation
    narrative: str
    clinical_summary: str
    primary_factors: List[Dict[str, Any]]
    recommended_actions: List[str]
    confidence: float
    escalation_probability_7d: float = 0.0
    escalation_probability_30d: float = 0.0
    trend_direction: str = "stable"

    # Assignment
    assigned_to: Optional[str] = None
    assigned_role: Optional[UserRole] = None
    assigned_at: Optional[datetime] = None
    
    # Review
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_decision: Optional[ReviewDecision] = None
    review_notes: str = ""
    
    # Escalation
    escalated_to: Optional[str] = None
    escalated_at: Optional[datetime] = None
    escalation_reason: str = ""
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    
    # Metadata
    source: str = "ai_pipeline"  # ai_pipeline, manual, scheduled
    tags: List[str] = Field(default_factory=list)


class Intervention(BaseModel):
    """Intervention tracking model"""
    intervention_id: str = Field(default_factory=lambda: f"INT_{uuid.uuid4().hex[:12].upper()}")
    alert_id: str
    victim_id: str
    
    # Intervention details
    type: InterventionType
    title: str
    description: str
    priority: AlertPriority
    
    # Assignment
    assigned_to: Optional[str] = None
    assigned_role: Optional[UserRole] = None
    assigned_by: str  # Who created this intervention
    
    # Status tracking
    status: InterventionStatus = InterventionStatus.PLANNED
    status_history: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Timeline
    planned_start: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    
    # Outcome
    outcome: str = ""
    outcome_notes: str = ""
    effectiveness_rating: Optional[int] = None  # 1-5 scale
    victim_feedback: str = ""
    
    # Follow-up
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    follow_up_notes: str = ""
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def add_status_change(self, new_status: InterventionStatus, actor_id: str, notes: str = ""):
        """Record status change in history"""
        self.status_history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "from_status": self.status.value,
            "to_status": new_status.value,
            "actor_id": actor_id,
            "notes": notes,
        })
        self.status = new_status
        self.updated_at = datetime.utcnow()


class ReviewAction(BaseModel):
    """Record of a human review action"""
    action_id: str = Field(default_factory=lambda: f"ACT_{uuid.uuid4().hex[:12].upper()}")
    alert_id: str
    actor_id: str
    actor_role: UserRole
    
    action: ReviewDecision
    notes: str = ""
    
    # Interventions created from this review
    interventions_created: List[str] = Field(default_factory=list)
    
    # Time spent reviewing (seconds)
    review_duration_seconds: Optional[int] = None
    
    # Context
    previous_status: AlertStatus
    new_status: AlertStatus
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# In-memory stores (replace with database in production)
class ReviewStore:
    """In-memory store for alerts, interventions, and audit logs"""
    
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.interventions: Dict[str, Intervention] = {}
        self.review_actions: List[ReviewAction] = []
        self.audit_logs: List[AuditLogEntry] = []
    
    # Alert operations
    def create_alert(self, alert: Alert) -> Alert:
        self.alerts[alert.alert_id] = alert
        self._audit("create_alert", "alert", alert.alert_id, alert.dict())
        return alert
    
    def get_alert(self, alert_id: str) -> Optional[Alert]:
        return self.alerts.get(alert_id)
    
    def update_alert(self, alert: Alert) -> Alert:
        alert.updated_at = datetime.utcnow()
        self.alerts[alert.alert_id] = alert
        return alert
    
    def list_alerts(self, 
                   status: Optional[AlertStatus] = None,
                   priority: Optional[AlertPriority] = None,
                   assigned_to: Optional[str] = None,
                   victim_id: Optional[str] = None) -> List[Alert]:
        results = list(self.alerts.values())
        if status:
            results = [a for a in results if a.status == status]
        if priority:
            results = [a for a in results if a.priority == priority]
        if assigned_to:
            results = [a for a in results if a.assigned_to == assigned_to]
        if victim_id:
            results = [a for a in results if a.victim_id == victim_id]
        return sorted(results, key=lambda a: a.created_at, reverse=True)
    
    # Intervention operations
    def create_intervention(self, intervention: Intervention) -> Intervention:
        self.interventions[intervention.intervention_id] = intervention
        self._audit("create_intervention", "intervention", intervention.intervention_id, 
                   intervention.dict())
        return intervention
    
    def get_intervention(self, intervention_id: str) -> Optional[Intervention]:
        return self.interventions.get(intervention_id)
    
    def update_intervention(self, intervention: Intervention) -> Intervention:
        intervention.updated_at = datetime.utcnow()
        self.interventions[intervention.intervention_id] = intervention
        return intervention
    
    def list_interventions(self,
                          alert_id: Optional[str] = None,
                          victim_id: Optional[str] = None,
                          status: Optional[InterventionStatus] = None,
                          assigned_to: Optional[str] = None) -> List[Intervention]:
        results = list(self.interventions.values())
        if alert_id:
            results = [i for i in results if i.alert_id == alert_id]
        if victim_id:
            results = [i for i in results if i.victim_id == victim_id]
        if status:
            results = [i for i in results if i.status == status]
        if assigned_to:
            results = [i for i in results if i.assigned_to == assigned_to]
        return sorted(results, key=lambda i: i.created_at, reverse=True)
    
    # Review action operations
    def record_review_action(self, action: ReviewAction) -> ReviewAction:
        self.review_actions.append(action)
        self._audit("review_action", "alert", action.alert_id, action.dict())
        return action
    
    def get_review_history(self, alert_id: str) -> List[ReviewAction]:
        return [a for a in self.review_actions if a.alert_id == alert_id]
    
    # Audit logging
    def _audit(self, action: str, resource_type: str, resource_id: str, details: Dict):
        entry = AuditLogEntry(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
        )
        self.audit_logs.append(entry)
    
    def get_audit_logs(self,
                      resource_type: Optional[str] = None,
                      resource_id: Optional[str] = None,
                      actor_id: Optional[str] = None,
                      action: Optional[str] = None,
                      limit: int = 100) -> List[AuditLogEntry]:
        results = self.audit_logs
        if resource_type:
            results = [l for l in results if l.resource_type == resource_type]
        if resource_id:
            results = [l for l in results if l.resource_id == resource_id]
        if actor_id:
            results = [l for l in results if l.actor_id == actor_id]
        if action:
            results = [l for l in results if l.action == action]
        return sorted(results, key=lambda l: l.timestamp, reverse=True)[:limit]


# Global store instance
review_store = ReviewStore()


# ===== Helper Functions =====

def determine_priority(band: str, distress_score: float, urgent_help: bool = False) -> AlertPriority:
    """Determine alert priority from distress band and score"""
    if band == "Red" or urgent_help:
        return AlertPriority.CRITICAL if urgent_help else AlertPriority.HIGH
    elif band == "Orange":
        return AlertPriority.MEDIUM
    elif band == "Yellow":
        return AlertPriority.LOW
    return AlertPriority.LOW


def create_alert_from_distress(victim_id: str, distress_result, explanation) -> Alert:
    """Create an alert from distress engine output"""
    priority = determine_priority(distress_result.band, distress_result.distress_score)
    
    return Alert(
        victim_id=victim_id,
        distress_score=distress_result.distress_score,
        band=distress_result.band,
        priority=priority,
        narrative=explanation.narrative,
        clinical_summary=explanation.clinical_summary,
        primary_factors=[vars(f) for f in explanation.primary_factors],
        recommended_actions=explanation.recommended_actions,
        confidence=distress_result.confidence,
        escalation_probability_7d=distress_result.escalation_probability_7d,
        escalation_probability_30d=distress_result.escalation_probability_30d,
        trend_direction=distress_result.trend_direction,
    )


# ===== API Schemas =====

class AssignAlertRequest(BaseModel):
    assigned_to: str
    assigned_role: UserRole


class ReviewAlertRequest(BaseModel):
    actor_id: str
    actor_role: UserRole
    decision: ReviewDecision
    notes: str = ""
    review_duration_seconds: Optional[int] = None


class CreateInterventionRequest(BaseModel):
    created_by: str
    type: InterventionType
    title: str
    description: str
    priority: AlertPriority
    assigned_to: Optional[str] = None
    assigned_role: Optional[UserRole] = None
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None


class UpdateInterventionRequest(BaseModel):
    actor_id: str
    status: Optional[InterventionStatus] = None
    outcome: Optional[str] = None
    outcome_notes: Optional[str] = None
    effectiveness_rating: Optional[int] = None
    victim_feedback: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[datetime] = None
    follow_up_notes: Optional[str] = None


class StartInterventionRequest(BaseModel):
    actor_id: str


class CompleteInterventionRequest(BaseModel):
    actor_id: str
    outcome: str
    effectiveness_rating: int = Field(..., ge=1, le=5)
    victim_feedback: str = ""


class AlertResponse(BaseModel):
    alert_id: str
    victim_id: str
    distress_score: float
    band: str
    priority: str
    status: str
    assigned_to: Optional[str]
    created_at: str
    updated_at: str
    narrative: str
    clinical_summary: str
    primary_factors: List[Dict]
    recommended_actions: List[str]
    reviewed_by: Optional[str]
    review_decision: Optional[str]
    resolved_at: Optional[str]
    escalation_probability_7d: float = 0.0
    escalation_probability_30d: float = 0.0
    trend_direction: str = "stable"


class InterventionResponse(BaseModel):
    intervention_id: str
    alert_id: str
    victim_id: str
    type: str
    title: str
    description: str
    status: str
    priority: str
    assigned_to: Optional[str]
    created_at: str
    updated_at: str
    actual_start: Optional[str]
    actual_end: Optional[str]
    outcome: str
    effectiveness_rating: Optional[int]


# Initialize with demo alerts
def seed_demo_alerts(distress_engine, explainability_engine, emotion_model, vectorizer, synthetic_data):
    """Create demo alerts from synthetic data for testing"""
    from distress_engine import DistressEngine
    from explainability import ExplainabilityEngine
    
    # We'll use the distress engine to compute scores for all victims
    # This is called from the API gateway startup
    pass