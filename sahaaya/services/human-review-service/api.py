"""
Human-in-the-Loop Review API Endpoints
Exposes alert management, review actions, and intervention tracking.
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional
from datetime import datetime
import uuid

from models import (
    review_store, Alert, Intervention, ReviewAction, AuditLogEntry,
    AlertStatus, AlertPriority, ReviewDecision, InterventionType, InterventionStatus, UserRole,
    AssignAlertRequest, ReviewAlertRequest, CreateInterventionRequest, UpdateInterventionRequest,
    StartInterventionRequest, CompleteInterventionRequest,
    AlertResponse, InterventionResponse,
    create_alert_from_distress, determine_priority,
)

router = APIRouter(prefix="/api/v1/review", tags=["Human Review"])


# ===== Alert Endpoints =====

@router.get("/alerts", response_model=List[AlertResponse])
async def list_alerts(
    status: Optional[AlertStatus] = Query(None),
    priority: Optional[AlertPriority] = Query(None),
    assigned_to: Optional[str] = Query(None),
    victim_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """List alerts with filters for officer dashboard"""
    alerts = review_store.list_alerts(
        status=status, priority=priority, assigned_to=assigned_to, victim_id=victim_id
    )
    return [alert_to_response(a) for a in alerts[:limit]]


@router.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str):
    """Get full alert details"""
    alert = review_store.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert_to_response(alert)


@router.post("/alerts/{alert_id}/assign", response_model=AlertResponse)
async def assign_alert(alert_id: str, request: AssignAlertRequest):
    """Assign alert to a counsellor/officer"""
    alert = review_store.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if alert.status not in [AlertStatus.NEW, AlertStatus.ASSIGNED]:
        raise HTTPException(status_code=400, detail=f"Cannot assign alert in {alert.status} status")
    
    alert.status = AlertStatus.ASSIGNED
    alert.assigned_to = request.assigned_to
    alert.assigned_role = request.assigned_role
    alert.assigned_at = datetime.utcnow()
    alert.updated_at = datetime.utcnow()
    
    review_store.update_alert(alert)
    
    # Record review action
    action = ReviewAction(
        alert_id=alert_id,
        actor_id=request.assigned_to,
        actor_role=request.assigned_role,
        action=ReviewDecision.CONFIRM_MONITOR,  # Assignment is a form of acknowledgement
        notes=f"Assigned to {request.assigned_role.value}",
        previous_status=AlertStatus.NEW,
        new_status=AlertStatus.ASSIGNED,
    )
    review_store.record_review_action(action)
    
    return alert_to_response(alert)


@router.post("/alerts/{alert_id}/review", response_model=AlertResponse)
async def review_alert(alert_id: str, request: ReviewAlertRequest):
    """Record human review decision on an alert"""
    alert = review_store.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    actor_id = request.actor_id
    actor_role = request.actor_role
    
    if alert.status not in [AlertStatus.NEW, AlertStatus.ASSIGNED, AlertStatus.IN_REVIEW]:
        raise HTTPException(status_code=400, detail=f"Cannot review alert in {alert.status} status")
    
    previous_status = alert.status
    alert.status = AlertStatus.IN_REVIEW
    alert.reviewed_by = actor_id
    alert.reviewed_at = datetime.utcnow()
    alert.review_decision = request.decision
    alert.review_notes = request.notes
    alert.updated_at = datetime.utcnow()
    
    # Update status based on decision
    if request.decision == ReviewDecision.DISMISS:
        alert.status = AlertStatus.FALSE_POSITIVE
        alert.resolved_at = datetime.utcnow()
    elif request.decision == ReviewDecision.ESCALATE:
        alert.status = AlertStatus.ESCALATED
    elif request.decision in [ReviewDecision.CONFIRM_INTERVENE, ReviewDecision.CONFIRM_MONITOR]:
        alert.status = AlertStatus.INTERVENTION_DECIDED
    elif request.decision == ReviewDecision.REQUEST_MORE_INFO:
        alert.status = AlertStatus.IN_REVIEW  # Stays in review
    
    review_store.update_alert(alert)
    
    # Record review action
    action = ReviewAction(
        alert_id=alert_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action=request.decision,
        notes=request.notes,
        review_duration_seconds=request.review_duration_seconds,
        previous_status=previous_status,
        new_status=alert.status,
    )
    review_store.record_review_action(action)
    
    return alert_to_response(alert)


@router.post("/alerts/{alert_id}/interventions", response_model=InterventionResponse)
async def create_intervention(alert_id: str, request: CreateInterventionRequest):
    """Create an intervention from an alert review"""
    alert = review_store.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    created_by = request.created_by
    
    if alert.review_decision not in [ReviewDecision.CONFIRM_INTERVENE, ReviewDecision.CONFIRM_MONITOR]:
        raise HTTPException(status_code=400, detail="Alert must be reviewed and confirmed before creating intervention")
    
    intervention = Intervention(
        alert_id=alert_id,
        victim_id=alert.victim_id,
        type=request.type,
        title=request.title,
        description=request.description,
        priority=request.priority,
        assigned_to=request.assigned_to,
        assigned_role=request.assigned_role,
        assigned_by=created_by,
        planned_start=request.planned_start,
        planned_end=request.planned_end,
    )
    
    review_store.create_intervention(intervention)
    
    # Update alert status
    alert.status = AlertStatus.INTERVENTION_IN_PROGRESS
    alert.updated_at = datetime.utcnow()
    review_store.update_alert(alert)
    
    return intervention_to_response(intervention)


@router.get("/alerts/{alert_id}/interventions", response_model=List[InterventionResponse])
async def list_alert_interventions(alert_id: str):
    """List all interventions for an alert"""
    interventions = review_store.list_interventions(alert_id=alert_id)
    return [intervention_to_response(i) for i in interventions]


@router.get("/alerts/{alert_id}/history", response_model=List[dict])
async def get_alert_review_history(alert_id: str):
    """Get review history for an alert"""
    actions = review_store.get_review_history(alert_id)
    return [a.dict() for a in actions]


# ===== Intervention Endpoints =====

@router.get("/interventions", response_model=List[InterventionResponse])
async def list_interventions(
    alert_id: Optional[str] = Query(None),
    victim_id: Optional[str] = Query(None),
    status: Optional[InterventionStatus] = Query(None),
    assigned_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """List interventions with filters"""
    interventions = review_store.list_interventions(
        alert_id=alert_id, victim_id=victim_id, status=status, assigned_to=assigned_to
    )
    return [intervention_to_response(i) for i in interventions[:limit]]


@router.get("/interventions/{intervention_id}", response_model=InterventionResponse)
async def get_intervention(intervention_id: str):
    """Get full intervention details"""
    intervention = review_store.get_intervention(intervention_id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")
    return intervention_to_response(intervention)


@router.patch("/interventions/{intervention_id}", response_model=InterventionResponse)
async def update_intervention(intervention_id: str, request: UpdateInterventionRequest):
    """Update intervention status and outcome"""
    intervention = review_store.get_intervention(intervention_id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")
    
    actor_id = request.actor_id
    old_status = intervention.status
    
    if request.status and request.status != intervention.status:
        intervention.add_status_change(request.status, actor_id, "Status updated via API")
    
    if request.outcome is not None:
        intervention.outcome = request.outcome
        if request.status == InterventionStatus.COMPLETED:
            intervention.actual_end = datetime.utcnow()
    
    if request.outcome_notes is not None:
        intervention.outcome_notes = request.outcome_notes
    
    if request.effectiveness_rating is not None:
        if not 1 <= request.effectiveness_rating <= 5:
            raise HTTPException(status_code=400, detail="Effectiveness rating must be 1-5")
        intervention.effectiveness_rating = request.effectiveness_rating
    
    if request.victim_feedback is not None:
        intervention.victim_feedback = request.victim_feedback
    
    if request.follow_up_required is not None:
        intervention.follow_up_required = request.follow_up_required
    
    if request.follow_up_date is not None:
        intervention.follow_up_date = request.follow_up_date
    
    if request.follow_up_notes is not None:
        intervention.follow_up_notes = request.follow_up_notes
    
    intervention.updated_at = datetime.utcnow()
    review_store.update_intervention(intervention)
    
    # Update alert if intervention completed
    if request.status == InterventionStatus.COMPLETED:
        alert = review_store.get_alert(intervention.alert_id)
        if alert and alert.status == AlertStatus.INTERVENTION_IN_PROGRESS:
            # Check if all interventions for this alert are complete
            all_interventions = review_store.list_interventions(alert_id=alert.alert_id)
            if all(i.status == InterventionStatus.COMPLETED for i in all_interventions):
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = datetime.utcnow()
                review_store.update_alert(alert)
    
    return intervention_to_response(intervention)


@router.post("/interventions/{intervention_id}/start", response_model=InterventionResponse)
async def start_intervention(intervention_id: str, request: StartInterventionRequest):
    """Mark intervention as started"""
    intervention = review_store.get_intervention(intervention_id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")
    
    actor_id = request.actor_id
    
    intervention.add_status_change(InterventionStatus.IN_PROGRESS, actor_id, "Intervention started")
    intervention.actual_start = datetime.utcnow()
    review_store.update_intervention(intervention)
    
    # Update alert
    alert = review_store.get_alert(intervention.alert_id)
    if alert:
        alert.status = AlertStatus.INTERVENTION_IN_PROGRESS
        alert.updated_at = datetime.utcnow()
        review_store.update_alert(alert)
    
    return intervention_to_response(intervention)


@router.post("/interventions/{intervention_id}/complete", response_model=InterventionResponse)
async def complete_intervention(
    intervention_id: str, 
    request: CompleteInterventionRequest,
):
    """Mark intervention as completed with outcome"""
    intervention = review_store.get_intervention(intervention_id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")
    
    actor_id = request.actor_id
    outcome = request.outcome
    effectiveness_rating = request.effectiveness_rating
    victim_feedback = request.victim_feedback
    
    intervention.add_status_change(InterventionStatus.COMPLETED, actor_id, "Intervention completed")
    intervention.actual_end = datetime.utcnow()
    intervention.outcome = outcome
    intervention.effectiveness_rating = effectiveness_rating
    intervention.victim_feedback = victim_feedback
    intervention.updated_at = datetime.utcnow()
    
    review_store.update_intervention(intervention)
    
    # Update alert if all interventions complete
    alert = review_store.get_alert(intervention.alert_id)
    if alert:
        all_interventions = review_store.list_interventions(alert_id=alert.alert_id)
        if all(i.status == InterventionStatus.COMPLETED for i in all_interventions):
            alert.status = AlertStatus.RESOLVED
            alert.resolved_at = datetime.utcnow()
            review_store.update_alert(alert)
    
    return intervention_to_response(intervention)


# ===== Audit Log Endpoints =====

@router.get("/audit-logs", response_model=List[dict])
async def get_audit_logs(
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    """Get audit logs with filters"""
    logs = review_store.get_audit_logs(
        resource_type=resource_type,
        resource_id=resource_id,
        actor_id=actor_id,
        action=action,
        limit=limit,
    )
    return [log.to_dict() for log in logs]


@router.get("/audit-logs/alert/{alert_id}", response_model=List[dict])
async def get_alert_audit_trail(alert_id: str):
    """Get complete audit trail for an alert (including interventions)"""
    logs = review_store.get_audit_logs(resource_id=alert_id, limit=200)
    return [log.to_dict() for log in logs]


# ===== Dashboard/Stats Endpoints =====

@router.get("/stats/summary")
async def get_review_summary():
    """Get summary stats for review dashboard"""
    alerts = list(review_store.alerts.values())
    interventions = list(review_store.interventions.values())
    
    alert_by_status = {}
    for s in AlertStatus:
        alert_by_status[s.value] = len([a for a in alerts if a.status == s])
    
    alert_by_priority = {}
    for p in AlertPriority:
        alert_by_priority[p.value] = len([a for a in alerts if a.priority == p])
    
    intervention_by_status = {}
    for s in InterventionStatus:
        intervention_by_status[s.value] = len([i for i in interventions if i.status == s])
    
    # Overdue interventions
    overdue = len([i for i in interventions 
                  if i.status in [InterventionStatus.PLANNED, InterventionStatus.ASSIGNED, InterventionStatus.IN_PROGRESS]
                  and i.planned_end and i.planned_end < datetime.utcnow()])
    
    # Pending reviews
    pending_review = len([a for a in alerts if a.status in [AlertStatus.NEW, AlertStatus.ASSIGNED]])
    
    return {
        "alerts": {
            "total": len(alerts),
            "by_status": alert_by_status,
            "by_priority": alert_by_priority,
            "pending_review": pending_review,
        },
        "interventions": {
            "total": len(interventions),
            "by_status": intervention_by_status,
            "overdue": overdue,
        },
        "review_actions_today": len([
            a for a in review_store.review_actions 
            if a.timestamp.date() == datetime.utcnow().date()
        ]),
    }


@router.get("/stats/officer/{officer_id}")
async def get_officer_workload(officer_id: str, role: UserRole = Query(UserRole.COUNSELLOR)):
    """Get workload for a specific officer/counsellor"""
    assigned_alerts = review_store.list_alerts(assigned_to=officer_id)
    assigned_interventions = review_store.list_interventions(assigned_to=officer_id)
    
    # Active (not resolved) items
    active_alerts = [a for a in assigned_alerts if a.status not in [AlertStatus.RESOLVED, AlertStatus.FALSE_POSITIVE]]
    active_interventions = [i for i in assigned_interventions if i.status not in [InterventionStatus.COMPLETED, InterventionStatus.CANCELLED]]
    
    # High priority
    high_priority = [a for a in active_alerts if a.priority in [AlertPriority.HIGH, AlertPriority.CRITICAL]]
    
    # Overdue
    overdue = [i for i in active_interventions 
              if i.planned_end and i.planned_end < datetime.utcnow()]
    
    return {
        "officer_id": officer_id,
        "role": role.value,
        "assigned_alerts": len(assigned_alerts),
        "active_alerts": len(active_alerts),
        "high_priority_alerts": len(high_priority),
        "assigned_interventions": len(assigned_interventions),
        "active_interventions": len(active_interventions),
        "overdue_interventions": len(overdue),
        "alerts": [alert_to_response(a) for a in active_alerts[:10]],
        "interventions": [intervention_to_response(i) for i in active_interventions[:10]],
    }


# ===== Response Helpers =====

def alert_to_response(alert: Alert) -> AlertResponse:
    return AlertResponse(
        alert_id=alert.alert_id,
        victim_id=alert.victim_id,
        distress_score=alert.distress_score,
        band=alert.band,
        priority=alert.priority.value,
        status=alert.status.value,
        assigned_to=alert.assigned_to,
        created_at=alert.created_at.isoformat(),
        updated_at=alert.updated_at.isoformat(),
        narrative=alert.narrative,
        clinical_summary=alert.clinical_summary,
        primary_factors=alert.primary_factors,
        recommended_actions=alert.recommended_actions,
        reviewed_by=alert.reviewed_by,
        review_decision=alert.review_decision.value if alert.review_decision else None,
        resolved_at=alert.resolved_at.isoformat() if alert.resolved_at else None,
        escalation_probability_7d=alert.escalation_probability_7d,
        escalation_probability_30d=alert.escalation_probability_30d,
        trend_direction=alert.trend_direction,
    )


def intervention_to_response(intervention: Intervention) -> InterventionResponse:
    return InterventionResponse(
        intervention_id=intervention.intervention_id,
        alert_id=intervention.alert_id,
        victim_id=intervention.victim_id,
        type=intervention.type.value,
        title=intervention.title,
        description=intervention.description,
        status=intervention.status.value,
        priority=intervention.priority.value,
        assigned_to=intervention.assigned_to,
        created_at=intervention.created_at.isoformat(),
        updated_at=intervention.updated_at.isoformat(),
        actual_start=intervention.actual_start.isoformat() if intervention.actual_start else None,
        actual_end=intervention.actual_end.isoformat() if intervention.actual_end else None,
        outcome=intervention.outcome,
        effectiveness_rating=intervention.effectiveness_rating,
    )


# ===== Alert Generation (called from API Gateway) =====

def generate_alerts_from_distress_results(distress_results: List, explainability_engine) -> List[Alert]:
    """Generate alerts from distress engine results for all victims"""
    created_alerts = []
    
    for result in distress_results:
        if result.band in ["Yellow", "Orange", "Red"]:
            # Check if alert already exists for this victim (avoid duplicates)
            existing = review_store.list_alerts(victim_id=result.victim_id, status=AlertStatus.NEW)
            if existing:
                # Update existing alert with latest score
                alert = existing[0]
                alert.distress_score = result.distress_score
                alert.band = result.band
                alert.priority = determine_priority(result.band, result.distress_score)
                alert.updated_at = datetime.utcnow()
                review_store.update_alert(alert)
                continue
            
            # Get explanation
            explanation = explainability_engine.explain_distress_score(
                victim_id=result.victim_id,
                distress_result=result,
            )
            
            # Create new alert
            alert = create_alert_from_distress(result.victim_id, result, explanation)
            review_store.create_alert(alert)
            created_alerts.append(alert)
    
    return created_alerts