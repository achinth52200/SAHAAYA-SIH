# SAHAAYA — SIH 2026 Demo Guide

**AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities**

---

## 📋 **PRE-DEMO SETUP CHECKLIST**

### **1. Start Backend Services**
```bash
# Terminal 1: Start API Gateway
cd sahaaya/services/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Verify health: http://localhost:8000/health
# Expected: {"status": "healthy", "version": "1.0.0", "models_loaded": true, "data_loaded": true}
```

### **2. Build & Start Web Dashboard**
```bash
# Terminal 2: Start Officer Dashboard (Next.js)
cd sahaaya/apps/web
npm install
npm run dev

# Access: http://localhost:3000
# Default route: http://localhost:3000/dashboard/alerts
```

### **3. Prepare Mobile App (Flutter)**
```bash
# Terminal 3: Start Flutter development server (or use emulator)
cd sahaaya/apps/mobile
flutter run
```

---

## 🎬 **15-MINUTE LIVE DEMO SCRIPT**

### **Act 1: Victim Interaction (3 minutes)**

**Goal:** Show victim-facing interface and check-in submission

**Steps:**
1. **Open Mobile App** (or web version at http://localhost:3000/victim)
   - Show login screen → authenticate as "VICTIM_0001"
   - Display home screen with current distress score (56.0 - Orange band)
   - Show historical trend chart (28 → 41 → 58 → 87 progression)

2. **Perform Check-in**
   - Click "Check In" button
   - Select mood: "Very Distressed" (from options: Better/Okay/Stressed/Very Distressed/I Need Help)
   - Show optional text field: "I'm worried about the upcoming court hearing and the threats I received"
   - Click "Submit"
   - Display confirmation: "Check-in submitted. Your distress score is being updated..."

3. **View Updated Score**
   - Show new distress score (should update to 65-72, moving toward Red band)
   - Show updated trend chart with new data point
   - Emphasize: "Your responses are being analyzed to understand how you're doing"

**Talking Points:**
- ✅ Victim provides information in their own language
- ✅ Low-friction check-in (single question + optional details)
- ✅ Personal trend visible (not clinical jargon)
- ✅ Never alarming tone — supportive and confidential

---

### **Act 2: Backend Processing (2 minutes)**

**Goal:** Demonstrate AI analysis pipeline

**Steps:**

1. **Show API Gateway Logs**
   - Terminal where API is running shows:
   ```
   [POST] /api/v1/victims/VICTIM_0001/checkin 
   → Received check-in for 2026-09-02
   → Text emotion detected: anxiety (0.78), fear (0.65)
   → Distress score computed: 67.2 (was 56.0)
   → Alert triggered: Band shifted to Red (>75 risk)
   ```

2. **Explain Processing Chain**
   - ✅ Self-report analysis (mood + safety + anxiety + hope)
   - ✅ NLP emotion detection on text ("court hearing" → fear/anxiety)
   - ✅ Behavioral pattern check (missed check-ins? recent engagement drop?)
   - ✅ Case event correlation (court hearing scheduled = stress trigger)
   - ✅ Personal baseline comparison (score vs. their own history)
   - ✅ Trend analysis (worsening over 7-30 days?)
   - ✅ Escalation probability (is this likely to get worse?)

3. **Show Distress Score Formula**
   - Display (on screen or printed):
   ```
   Distress Score (0–100) = Weighted Composite of:
   • Self-reported well-being:     35% (35.5 / 100)
   • Text emotion & sentiment:     20% (65.0 / 100)
   • Behavioral patterns:          15% ( 20.0 / 100)
   • Voice indicators (optional):  10% ( 72.6 / 100)
   • Case & external events:       10% ( 90.0 / 100)
   • Longitudinal trend:           10% ( 65.8 / 100)
   ─────────────────────────────────────────────────
   **Total: 67.2 (RED band: urgent human review)**
   ```

**Talking Points:**
- ✅ AI never makes decisions alone — it explains everything
- ✅ Every component is traceable and auditable
- ✅ Multiple signals required (never single-message triggered)
- ✅ Personal baseline protects against false positives

---

### **Act 3: Officer Alert & Review (5 minutes)**

**Goal:** Show officer dashboard and alert explanation workflow

**Steps:**

1. **Officer Logs In & Sees Alert Inbox**
   - URL: http://localhost:3000/dashboard/alerts
   - Show alerts sorted by priority (Red > Orange > Yellow > Green)
   - Highlight new RED alert for VICTIM_0001 with timestamp "just now"
   - Display red alert card with:
     - Victim name / ID
     - Current score: 67.2 (RED)
     - Previous score: 56.0
     - Time since last contact: 2 hours
     - Assigned status: "Unreviewed"

2. **Click Alert to See Explanation**
   - URL: http://localhost:3000/dashboard/alerts/ALERT_VICTIM_0001_XXX
   - Display full alert detail page with:

   **🔴 ALERT DETAIL**
   - Victim: VICTIM_0001
   - Distress Score: 67.2 / 100 (RED band)
   - Personal Baseline: 50.3
   - Deviation: +16.9 (significantly above baseline)
   - 7-Day Escalation Risk: 78%
   - 30-Day Escalation Risk: 91%
   - Status: "Requires Human Review"

   **🔍 PRIMARY CONTRIBUTING FACTORS**
   1. **Self-Report Score**: +18.5 points
      - Rationale: Victim reported "Very Distressed"
      - Supporting details: Anxiety increased, safety concerns noted
   
   2. **Text Emotion Analysis**: +15.2 points
      - Detected emotions: fear (78%), anxiety (72%)
      - Key phrases: "court hearing", "threats received", "worried"
      - Multilingual analysis: Analyzed in English + local language
   
   3. **Case Events Correlation**: +12.1 points
      - Upcoming court hearing (high-stress event)
      - Recent threat report (safety risk)
      - Investigation delay (frustration factor)

   4. **Behavioral Pattern**: +8.7 points
      - Missed 1 check-in in past week (slight disengagement)
      - Check-in response time increased (was 30 mins, now 2 hrs)
      - Chat frequency stable

   **📊 TREND ANALYSIS**
   - 7-Day Trend: Worsening ↗️ (28 → 35 → 41 → 56 → 67)
   - Change velocity: +4.5 points/day (concerning)
   - Pattern: Score rises ~5 points after court-related communications

   **✅ RECOMMENDED INTERVENTIONS**
   1. Schedule urgent counsellor follow-up within 12 hours
   2. Provide legal aid support (court hearing on 2026-09-05)
   3. Coordinate with protection services (threat report on file)
   4. Increase check-in frequency to twice daily until court hearing
   5. Offer crisis support helpline number

   **📋 CASE TIMELINE** (with distress context)
   ```
   2026-08-15  Complaint Registered          → Score: 28 (Green)
   2026-08-20  Investigation Started         → Score: 28 (Green)
   2026-08-25  Threat Report Filed           → Score: 35 (Yellow)
   2026-08-28  Court Hearing Scheduled       → Score: 41 (Yellow)
   2026-09-01  Victim Missed Counselling     → Score: 56 (Orange) ⚠️
   2026-09-02  Victim Check-in (Today)       → Score: 67 (Red)    🚨
   2026-09-05  Court Hearing Date (Planned)
   ```

3. **Assign & Review Alert**
   - Click "Assign to Officer" → select current logged-in officer
   - Click "Mark as Reviewed"
   - Status changes to "Assigned" → "In Review"
   - Show audit log: "Officer XYZ reviewed alert at 2026-09-02 21:52:00"

**Talking Points:**
- ✅ Every alert explains WHY it was triggered
- ✅ Primary factors listed in priority order
- ✅ Evidence provided (victim quotes, behavioral data)
- ✅ Confidence scores shown (e.g., "fear detected with 78% confidence")
- ✅ No AI diagnosis or prescription — only decision support
- ✅ Every review is audited and logged

---

### **Act 4: Intervention & Outcome (3 minutes)**

**Goal:** Show human-in-the-loop workflow and intervention tracking

**Steps:**

1. **Create Intervention**
   - Click "Create Intervention" on alert detail page
   - Form appears:
     ```
     Intervention Type: Counsellor Follow-up
     Priority: HIGH
     Assigned To: Counsellor_001
     Planned Start: 2026-09-02 22:00
     Planned End: 2026-09-02 23:00
     Description: Urgent counsellor session to discuss court hearing fears and threats
     ```
   - Click "Create"
   - Status: "PLANNED" ✅

2. **Start Intervention**
   - Intervention ID: INT_ALERT_VICTIM_0001_001
   - Counsellor_001 logs in, sees assigned interventions
   - Click "Start Intervention" → status changes to "IN_PROGRESS" 🔵
   - Timestamp: 2026-09-02 22:05

3. **Complete & Rate Intervention**
   - After counselling session (simulate 30 minutes later):
   - Click "Mark as Complete"
   - Form:
     ```
     Outcome: Victim expressed concerns about court hearing.
              Provided coping strategies. Scheduled daily check-ins.
              Referred to legal aid desk.
     
     Effectiveness Rating: 4/5 (Very Helpful)
     
     Victim Feedback: "Thank you for listening. I feel more prepared now."
     ```
   - Click "Complete"
   - Status: "COMPLETED" ✅
   - Alert status: "Intervention in Progress" → "Intervention Completed"

4. **View Audit Trail**
   - Click "View History" on alert
   - Shows complete timeline:
     ```
     2026-09-02 21:51:33  Alert auto-generated (score: 67.2)
     2026-09-02 21:52:00  Officer_XYZ reviewed alert
     2026-09-02 21:53:00  Officer_XYZ assigned to Counsellor_001
     2026-09-02 22:05:00  Counsellor_001 started intervention
     2026-09-02 22:35:00  Counsellor_001 completed intervention (rating: 4/5)
     ```
   - All actions immutable and logged for accountability

**Talking Points:**
- ✅ AI detects and alerts, but humans decide and act
- ✅ Every intervention is tracked from start to finish
- ✅ Outcome and effectiveness logged
- ✅ No automated interventions — all human-reviewed
- ✅ Audit trail for compliance and learning

---

### **Act 5: Dashboard Insights (2 minutes)**

**Goal:** Show aggregate dashboards for district/state/national overview

**Steps:**

1. **District Dashboard**
   - URL: http://localhost:3000/dashboard/districts
   - Show district-level summary:
     ```
     District: District_4
     Total Victims: 156
     
     Distress Distribution:
       Green:  84 victims (54%)
       Yellow: 45 victims (29%)
       Orange: 21 victims (13%)
       Red:     6 victims (4%)  🚨 Requires immediate attention
     
     Response Metrics:
       Avg time to review alert: 8 min
       % alerts within SLA (24 hr): 94%
       Avg intervention effectiveness: 4.1/5
     
     Top Stressors This Week:
       • Court hearings (23 cases)
       • Investigation delays (18 cases)
       • Threat reports (12 cases)
     ```

2. **State Dashboard** (aggregate of all districts)
   - URL: http://localhost:3000/dashboard/states
   - Show state-level trends
   - Identify high-need districts

3. **National Dashboard** (executive summary)
   - URL: http://localhost:3000/dashboard/national
   - Show national trends
   - Anonymized insights

**Talking Points:**
- ✅ Officers can see their own caseload
- ✅ District leads see district overview
- ✅ State officers see cross-district trends
- ✅ National admin sees anonymized aggregates
- ✅ All based on role-based access control (RBAC)

---

## 🎯 **Key Demo Narratives**

### **Narrative 1: "Early Warning Saves Lives"**
> "VICTIM_0001 seemed stable for two weeks (score 28-41). But when the court hearing was scheduled, coupled with a threat report, their distress rose to 56, then 67 in just 3 days. Without this monitoring, the officer would never know. SAHAAYA alerts within 24 hours, giving the officer time to provide support BEFORE a crisis."

### **Narrative 2: "Explainability Builds Trust"**
> "The alert doesn't just say 'high risk.' It shows exactly why: self-report score, text emotion, case events, behavioral change, trend direction. The officer can see the evidence and make an informed decision. AI is not a black box — every decision is auditable."

### **Narrative 3: "Personal Baseline Prevents False Positives"**
> "VICTIM_0001 has a personal baseline of 50.3 based on their own history, not a universal threshold. A score of 56 is a +5.7 point deviation for them, significant. Another victim with a baseline of 65 at 56 would be in Green (improvement). We compare people to themselves, not to each other."

### **Narrative 4: "Never Diagnosis, Always Human Review"**
> "SAHAAYA never diagnoses mental illness. It never prescribes medication. It never auto-escalates or auto-intervenes. Every alert goes to a trained human who reviews the evidence and decides the next step. We are not replacing counsellors — we are supporting them."

---

## ✅ **Live Demo Checklist (Before SIH Panel)**

- [ ] API server running and healthy (`/health` endpoint shows `true`)
- [ ] Synthetic data loaded (5 victims with varying risk levels)
- [ ] Officer dashboard accessible (http://localhost:3000/dashboard)
- [ ] Mobile/victim app running (or emulated)
- [ ] All endpoints tested:
  - [ ] GET /api/v1/victims → returns 5+ victims
  - [ ] GET /api/v1/victims/{id}/distress → returns score with band
  - [ ] GET /api/v1/alerts?band=Red → returns high-risk alerts
  - [ ] GET /api/v1/victims/{id}/explanation → returns detailed explanation
  - [ ] GET /api/v1/review/alerts → returns review alerts
- [ ] Browser developer tools open (Network tab) to show API calls
- [ ] Distress scores visible and updating
- [ ] Alert cards displaying with color-coding (Green/Yellow/Orange/Red)
- [ ] Intervention creation/completion working
- [ ] Audit logs showing all actions

---

## 🚨 **Troubleshooting**

### **Problem: API returns 404 on endpoints**
**Solution:** Ensure you're using the correct port (8000 for API, 3000 for web). Check CORS_ORIGINS in .env.

### **Problem: Emotion model not loading**
**Solution:** Run `python services/nlp-ai-service/emotion_model_lightweight.py` to generate `.joblib` files.

### **Problem: Synthetic data not found**
**Solution:** Run `python services/nlp-ai-service/synthetic_data_generator.py` to generate data files.

### **Problem: Web dashboard shows no data**
**Solution:** Verify API is running and accessible. Check browser console for CORS errors. Ensure API_BASE_URL in web app matches actual API address.

### **Problem: Distress score not updating**
**Solution:** Check that distress engine is computing scores correctly. Test with `/api/v1/victims/{victim_id}/distress` endpoint directly.

---

## 📊 **Expected Demo Outcomes**

By the end of the 15-minute demo, the SIH panel should understand:

1. ✅ **Problem:** Victims of atrocities face prolonged distress; changes often go unnoticed until crisis
2. ✅ **Solution:** SAHAAYA continuously monitors through check-ins, analyzes through AI, alerts through humans
3. ✅ **Proof:** Distress score rising from 28 → 67 as case events accumulate
4. ✅ **Explainability:** Every alert explains the contributing factors
5. ✅ **Human-in-the-loop:** Officer reviews, decides, tracks intervention outcome
6. ✅ **Privacy:** Role-based access, consent, encryption, audit logs
7. ✅ **Impact:** Early intervention prevents crisis, tracks effectiveness

---

## 🏆 **Winning Message for SIH Panel**

> *"SAHAAYA is not trying to replace counsellors or diagnose trauma. It is a decision-support system that keeps vulnerable people connected to care. By combining check-ins, AI analysis, and human review, we catch distress early — when support is most effective. Every alert is explainable. Every intervention is audited. Every person's data is protected. This is technology in service of humanity."*

---

## 📚 **Additional Resources**

- **1_PDR.md** — Full product requirements
- **2_Design_Document.md** — UI/UX design direction (Leafcare-inspired)
- **3_Tech_Stack.md** — Technical architecture
- **API Documentation** — Swagger at http://localhost:8000/docs
- **Code** — GitHub repo structure in `sahaaya/`

---

**Good luck with your SIH 2026 submission! 🚀**
