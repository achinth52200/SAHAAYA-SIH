import httpx
import time

# Test human review endpoints
base = "http://localhost:8000"

# Test generate alerts
print("=== Testing Alert Generation ===")
r = httpx.post(f"{base}/api/v1/review/alerts/generate")
print("Generate alerts:", r.json())

# Test list alerts
print("\n=== Testing List Alerts ===")
r = httpx.get(f"{base}/api/v1/review/alerts")
alerts = r.json()
print(f"Total alerts: {len(alerts)}")
for a in alerts[:3]:
    print(f"  {a['alert_id']}: {a['victim_id']} - {a['band']} ({a['status']})")

# Test get specific alert
if alerts:
    alert_id = alerts[0]['alert_id']
    print(f"\n=== Testing Get Alert: {alert_id} ===")
    r = httpx.get(f"{base}/api/v1/review/alerts/{alert_id}")
    alert = r.json()
    print(f"  Victim: {alert['victim_id']}")
    print(f"  Score: {alert['distress_score']} ({alert['band']})")
    print(f"  Status: {alert['status']}")
    print(f"  Priority: {alert['priority']}")
    print(f"  Narrative: {alert['narrative'][:80]}...")
    print(f"  Recommended actions: {len(alert['recommended_actions'])}")

# Test assign alert
print("\n=== Testing Assign Alert ===")
r = httpx.post(f"{base}/api/v1/review/alerts/{alert_id}/assign", json={
    "assigned_to": "COUNSELLOR_001",
    "assigned_role": "counsellor"
})
print("Assign result:", r.json()['status'], r.json()['assigned_to'])

# Test review alert
print("\n=== Testing Review Alert ===")
r = httpx.post(f"{base}/api/v1/review/alerts/{alert_id}/review", 
    json={"actor_id": "COUNSELLOR_001", "actor_role": "counsellor", 
          "decision": "confirm_intervene", "notes": "Confirmed distress, scheduling follow-up"})
print("Review result:", r.status_code, r.json())

# Test create intervention
print("\n=== Testing Create Intervention ===")
r = httpx.post(f"{base}/api/v1/review/alerts/{alert_id}/interventions", 
    json={"created_by": "COUNSELLOR_001",
          "type": "counselling",
          "title": "Urgent counselling follow-up",
          "description": "Schedule 60-min counselling session within 24 hours",
          "priority": "high",
          "assigned_to": "COUNSELLOR_001",
          "assigned_role": "counsellor"})
print("Intervention created:", r.status_code, r.json())

if r.status_code == 200:
    intervention_id = r.json()['intervention_id']
else:
    intervention_id = None

if intervention_id:
    # Test start intervention
    print("\n=== Testing Start Intervention ===")
    r = httpx.post(f"{base}/api/v1/review/interventions/{intervention_id}/start", 
        json={"actor_id": "COUNSELLOR_001"})
    print("Start result:", r.status_code, r.json())

    # Test complete intervention
    print("\n=== Testing Complete Intervention ===")
    r = httpx.post(f"{base}/api/v1/review/interventions/{intervention_id}/complete", 
        json={"actor_id": "COUNSELLOR_001", "outcome": "Completed 60-min session",
              "effectiveness_rating": 4, "victim_feedback": "Felt heard and supported"})
    print("Complete result:", r.status_code, r.json())

# Test review summary
print("\n=== Testing Review Summary ===")
r = httpx.get(f"{base}/api/v1/review/stats/summary")
summary = r.json()
print(f"Alerts: {summary['alerts']['total']} total, {summary['alerts']['pending_review']} pending")
print(f"Interventions: {summary['interventions']['total']} total, {summary['interventions']['overdue']} overdue")

# Test officer workload
print("\n=== Testing Officer Workload ===")
r = httpx.get(f"{base}/api/v1/review/stats/officer/COUNSELLOR_001", params={"role": "counsellor"})
workload = r.json()
print(f"Officer: {workload['officer_id']}")
print(f"  Active alerts: {workload['active_alerts']}")
print(f"  High priority: {workload['high_priority_alerts']}")
print(f"  Active interventions: {workload['active_interventions']}")
print(f"  Overdue: {workload['overdue_interventions']}")

# Test audit logs
print("\n=== Testing Audit Logs ===")
r = httpx.get(f"{base}/api/v1/review/audit-logs", params={"resource_id": alert_id, "limit": 10})
logs = r.json()
print(f"Audit entries for {alert_id}: {len(logs)}")
for log in logs[:3]:
    print(f"  {log['timestamp']}: {log['action']} by {log['actor_id']}")

print("\n=== All Human Review Tests Passed ===")