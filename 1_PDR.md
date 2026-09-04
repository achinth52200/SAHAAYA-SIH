# SAHAAYA — Product Design Requirements (PDR)

**SIH 2026 · Problem Statement 26094**
**AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities**

---

## 1. Product Overview

SAHAAYA is a multilingual, privacy-first, AI-assisted platform that monitors the psychological well-being of victims of atrocities through their legal, investigation, compensation and rehabilitation journey. It combines periodic check-ins, self-reports, text/voice analysis, behavioural signals and case-timeline events into a **Dynamic Distress Score (0–100)**, predicts escalation, and routes explainable alerts to trained human professionals.

SAHAAYA does **not** diagnose or replace clinicians — it is an early-warning, decision-support layer that keeps a human in the loop for every serious action.

**Primary users:**
- Victim (mobile app / chatbot / IVRS / SMS)
- Counsellor
- District Officer
- State Officer
- National Administrator

---

## 2. Problem Statement

Victims of atrocities may experience prolonged psychological distress after complaint registration due to threats, intimidation, repeated court appearances, delays in investigation or trial, social isolation, financial hardship, compensation delays and rehabilitation challenges. These changes can remain unnoticed until a severe crisis occurs.

**Core question:** How can authorities continuously identify worsening psychological distress and provide timely support before the situation becomes critical?

---

## 3. Core Functional Requirements

1. **Check-ins** — periodic, low-friction, multilingual, multi-channel (app, chatbot, IVRS, SMS).
2. **Self-report capture** — mood, anxiety/stress, sleep, safety, hopelessness, isolation, urgent-help flag.
3. **Text analysis** — sentiment/emotion detection (fear, anger, hopelessness, threat language) on consented chatbot text; never single-message-triggered.
4. **Voice analysis (optional, consented)** — supporting acoustic signal only, never sole basis for intervention.
5. **Behavioural pattern detection** — missed check-ins, cancelled counselling, reduced engagement quality.
6. **Case-event ingestion** — FIR, investigation delay, court hearing, threat report, bail hearing, compensation/rehab delay.
7. **Dynamic Distress Score (0–100)** — weighted composite, configurable thresholds (Green/Yellow/Orange/Red).
8. **Personal baseline model** — compares an individual against their own history, not a universal threshold.
9. **Trend & escalation prediction** — 7-day / 30-day trend, escalation probability, contributing factors.
10. **Explainable AI layer** — every high-risk alert ships with human-readable reasons (SHAP / feature importance / rule-based).
11. **Human-in-the-loop workflow** — AI detects → explains → routes to authorised human → human decides/acts → outcome logged.
12. **Intervention recommendation** — counselling, legal aid, protection support, financial assistance, rehabilitation referral (never medication or diagnosis).
13. **Adaptive follow-up scheduling** — check-in frequency scales with risk level.
14. **Dashboards** — district / state / national, role-scoped.
15. **Privacy & security** — consent management, RBAC, encryption in transit/at rest, audit logs, data minimisation.

---

## 4. Scoring Model (prototype weights)

| Signal | Weight |
|---|---|
| Self-reported well-being | 35% |
| Text emotion & sentiment | 20% |
| Behavioural pattern change | 15% |
| Voice-based supporting indicators | 10% |
| Case & external stress events | 10% |
| Longitudinal distress trend | 10% |

**Bands:** Green 0–29 (stable) · Yellow 30–49 (mild/emerging) · Orange 50–74 (significant, follow-up recommended) · Red 75–100 (urgent human review).

Thresholds must remain configurable and should eventually be validated with qualified domain experts.

---

## 5. MVP Scope for Hackathon Demo

**Victim side:** login/onboarding, language selection, text chatbot, mood check-in, voice demo, distress reporting, support-request button.

**AI side:** sentiment analysis, emotion classification, Dynamic Distress Score, trend analysis, escalation prediction, explainable output.

**Officer side:** high-risk alerts, case timeline, distress graph, contributing factors, recommended intervention, intervention status.

**Demo narrative:** a single simulated victim journey showing distress score rising from 28 → 87 across case events (threat report, missed check-ins, court hearing), ending in an explainable alert and human review.

---

## 6. Privacy & Trust Requirements (non-negotiable)

- Explicit, reviewable consent before any data collection.
- Role-based access: Victim / Counsellor / District Officer / State Officer / National Administrator.
- Encryption in transit and at rest, token-based API access, audit logging, data minimisation.
- No real victim data in the prototype — synthetic/simulated datasets only, clearly labelled.
- AI never diagnoses, prescribes, or makes irreversible decisions — human review is mandatory for Orange/Red states.

---

## 7. Major Risks & Mitigation

| Risk | Mitigation |
|---|---|
| False positives | Require human review before serious intervention |
| False negatives | Combine multiple signals + direct support-request mechanism |
| Voice AI bias | Treat voice as a supporting signal only; fairness testing across languages/accents |
| AI replacing professionals | Position strictly as early-warning / decision-support |
| Sensitive data exposure | Consent, encryption, RBAC, audit logging |
| Loss of victim trust | Transparent communication about what is collected and why |
