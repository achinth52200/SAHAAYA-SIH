# 🚀 SAHAAYA SIH Demo — Quick Reference Card

**Print this and bring to the presentation!**

---

## 📍 **SYSTEM STARTUP (5 minutes before demo)**

```bash
# Terminal 1: Start API (Port 8000)
cd D:\SIH project\sahaaya\services\api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start Web Dashboard (Port 3000)
cd D:\SIH project\sahaaya\apps\web
npm run dev

# Verify both running:
# API:  http://localhost:8000/health   → {"status": "healthy", ...}
# WEB:  http://localhost:3000          → Officer dashboard loads
```

---

## 🎬 **DEMO SCRIPT (15 minutes)**

### **00:00–00:30 | Problem Statement**
- Victims of atrocities suffer prolonged distress
- Changes go unnoticed until crisis occurs
- Need: continuous monitoring + early alerts + human review

### **00:30–03:30 | VICTIM INTERACTION (Act 1)**
1. **Open victim app** (http://localhost:3000/victim or Flutter emulator)
2. **Log in:** VICTIM_0001 / password
3. **Current state:** Score 56 (Orange) — show trend chart
4. **Check-in:** Click "Check In" → Select "Very Distressed" → Type optional message
5. **Submit & observe:** Score updates to 65–72 (Red) 🚨

### **03:30–05:30 | BACKEND PROCESSING (Act 2)**
1. **Show API terminal:** Point to distress calculation logs
2. **Explain pipeline:**
   - ✅ Self-report analysis (mood + safety + anxiety)
   - ✅ NLP emotion (fear 78%, anxiety 72%)
   - ✅ Behavior pattern (missed counselling)
   - ✅ Case events (court hearing, threat)
   - ✅ Personal baseline (deviation: +16.9 pts)
   - ✅ Trend analysis (rising 28 → 67 over 19 days)
3. **Result:** Escalation risk 78% (7-day), 91% (30-day)

### **05:30–10:30 | OFFICER ALERT (Act 3)**
1. **Switch to officer dashboard:** http://localhost:3000/dashboard/alerts
2. **Refresh or wait:** New RED alert appears (VICTIM_0001)
3. **Click alert detail:** URL shows full explanation
4. **Point out:**
   - Score: 67.0 / 100 (RED)
   - Primary factors: Self Report, Text Emotion, Case Events
   - Evidence quotes: "court hearing", "threats", "worried"
   - Recommended actions: Counsellor follow-up, legal aid, protection
   - Case timeline: Shows events + distress context
5. **Show audit log:** Every action timestamped

### **10:30–13:30 | INTERVENTION (Act 4)**
1. **Create intervention:**
   - Type: "Counsellor Follow-up"
   - Priority: HIGH
   - Assigned: Counsellor_001
   - Click "Create" → Status: PLANNED
2. **Start intervention:**
   - Counsellor_001 sees task
   - Click "Start" → Status: IN_PROGRESS
3. **Complete intervention:**
   - Outcome: "Provided coping strategies, scheduled daily check-ins"
   - Rating: 4/5 (Very Helpful)
   - Click "Complete" → Status: COMPLETED
4. **Show audit trail:** Complete action history

### **13:30–14:30 | INSIGHTS (Act 5)**
1. **District Dashboard:** http://localhost:3000/dashboard/districts
   - Show: 156 total victims, 4% Red, 13% Orange, 29% Yellow, 54% Green
   - Response metrics: 8 min avg review time, 94% within SLA
2. **Trend:** "Court hearings (23 cases), Investigation delays (18 cases)"

### **14:30–15:00 | CLOSING**
- **Recap:** "28 to 87" shows early intervention possible
- **Key message:** AI alerts → Human reviews → Lives saved
- **No diagnosis, no auto-intervention, always explained**

---

## 🎯 **KEY TALKING POINTS**

| Point | Evidence |
|-------|----------|
| **Problem is real** | Victims' distress commonly missed until crisis |
| **Monitoring works** | Automated check-ins + sentiment analysis |
| **Early alert saves time** | Officer notified within hours, not after crisis |
| **Explainability builds trust** | Every alert shows WHY (3+ contributing factors) |
| **Personal baseline prevents false positives** | Compare people to themselves, not universal threshold |
| **Human always in control** | AI detects → officer reviews → officer decides |
| **Privacy-first design** | Synthetic data only, consent-driven, audit trail |

---

## 🔴 **IF SOMETHING BREAKS**

| Problem | Fix |
|---------|-----|
| API returns 500 error | Check terminal for exception, restart API |
| Dashboard shows no data | Refresh browser, check API health endpoint |
| Distress score not updating | Test `/api/v1/victims/VICTIM_0001/distress` directly |
| Alert not showing | Wait 5 seconds and refresh, or regenerate alerts |
| CORS error in browser | Verify API_BASE_URL in .env matches http://localhost:8000 |
| Web app won't start | Check if port 3000 already in use, kill and restart |

**Backup plan:** If live demo breaks, show pre-recorded video or explain the workflow with screenshots.

---

## 📱 **DEMO ACCOUNTS**

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Victim | VICTIM_0001 | (any) | Primary demo victim |
| Officer | Officer_001 | (any) | Can review alerts |
| Counsellor | Counsellor_001 | (any) | Handles interventions |

---

## 📊 **EXPECTED DEMO RESULTS**

By end of 15 minutes, panel should observe:

1. ✅ **Live System:** Victim app + API + Officer dashboard all working
2. ✅ **Real Data Flow:** Check-in → processing → alert → review → intervention
3. ✅ **Score Progression:** 56 (Orange) → 67+ (Red) from single check-in
4. ✅ **Explainability:** Alert shows 3+ contributing factors with evidence
5. ✅ **Human-in-the-Loop:** Officer reviews, decides, completes intervention
6. ✅ **Audit Trail:** Every action logged with timestamp
7. ✅ **Impact:** Intervention rated 4+/5 effective

---

## 🏆 **WINNING NARRATIVE**

> "SAHAAYA is technology in service of humanity. We don't replace counsellors or diagnose trauma. We simply watch for distress signals and alert trained professionals so they can act before crisis. Every alert explains why. Every decision is human-made. Every action is audited. This is what responsible AI looks like in the real world."

---

## ⏱️ **TIMING TIPS**

- **Don't rush:** Spend 1 minute on each action (submit check-in, refresh dashboard, etc.)
- **Narrate:** Explain what's happening as you demo, not silent clicking
- **Pause for questions:** Build 1-2 minutes of Q&A into each act
- **Have backup:** If live break, transition to discussion or video

---

## 📱 **BROWSER SETUP**

Open 2 tabs:
1. **Tab 1:** http://localhost:3000/dashboard/alerts (Officer dashboard)
2. **Tab 2:** http://localhost:3000/victim (Victim app, or mobile device)

Open 1 terminal:
- **Terminal:** API logs visible, showing `/api/v1/victims/{id}/distress` calls

Open 1 browser console:
- **Developer tools → Network tab:** Shows API requests in real-time

---

## 🎥 **PRESENTATION MATERIALS** (bring on USB)

- [ ] Slides: Problem statement + architecture diagram
- [ ] SIH_DEMO_GUIDE.md (full walkthrough)
- [ ] SIH_SUBMISSION_CHECKLIST.md (verification steps)
- [ ] This Quick Reference Card (printed)
- [ ] Screenshots/diagrams of Leafcare design system
- [ ] Pre-recorded video (backup if live breaks)

---

## ✨ **FINAL CHECKLIST (1 hour before)**

- [ ] All terminals running (API, Web, Mobile)
- [ ] Browser tabs open (Victim app + Officer dashboard)
- [ ] Network tab open in DevTools
- [ ] Demo accounts verified (login works)
- [ ] Sample data visible (VICTIM_0001 score: 56.0)
- [ ] Alert exists (Red alert visible in dashboard)
- [ ] Internet connection stable
- [ ] No other apps competing for ports 3000, 8000
- [ ] Presenter comfortable with talking points
- [ ] Q&A prepared (privacy, scalability, implementation)

---

**Good luck! Remember: You're solving a real problem with working technology. Let it speak for itself.** 🚀

---

*Prepared for SIH 2026 · Problem 26094*  
*Last updated: 2026-09-02 22:00 UTC*
