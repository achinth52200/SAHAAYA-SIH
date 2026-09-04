# SAHAAYA — Agent Instructions

Before modifying the project, read:
- 1_PDR.md — Functional requirements
- 2_Design_Document.md — Visual/UI requirements
- 3_Tech_Stack.md — Technical architecture

These files define the requirements and architecture of SAHAAYA.

## Priority Order
1. 1_PDR.md → Functional requirements
2. 2_Design_Document.md — Visual/UI requirements
3. 3_Tech_Stack.md — Technical architecture

## Rules
- Do not fabricate case data, victim data, distress scores, ML metrics, predictions, SHAP/explainability outputs, confidence values, or clinical/psychological claims
- Do not hard-code distress scores, alerts, or explainable-AI outputs — use actual model inference for all outputs
- Never use real victim data — synthetic/simulated data only, and label it clearly as prototype data
- Keep the interaction layer, AI/scoring layer, explainability layer, human-review layer, and dashboard/UI layer separate
- Do not introduce unnecessary technologies beyond what's in 3_Tech_Stack.md
- Do not add features that let the AI diagnose mental illness, prescribe medication, or independently trigger an intervention — every serious action requires human review
- Voice analysis must remain a supporting signal only — never the sole basis for a risk decision
- A single check-in or message must never alone determine a person's risk level — always evaluate against trend and multiple signals
- Preserve the personal-baseline model — compare individuals against their own history, not a universal threshold
- Do not weaken or bypass consent management, role-based access control, or audit logging
- Follow the Leafcare-inspired design system in 2_Design_Document.md for tone and visual language, but keep officer/admin dashboards data-dense and alert states clearly legible
- Test every major feature before considering it complete

## Development Order
1. Data collection & case-event pipeline
2. Synthetic dataset preparation
3. NLP / emotion detection model
4. Voice feature analysis (optional module)
5. Behavioural pattern detection
6. Dynamic Distress Score engine
7. Personal baseline model
8. Trend & escalation prediction
9. Explainable AI layer (SHAP / feature importance / rule-based)
10. FastAPI backend
11. Human-in-the-loop alert & review workflow
12. React/Next.js web (public site + officer dashboard)
13. Flutter mobile app (victim-facing)
14. Integration
15. Privacy & security hardening (RBAC, encryption, audit logs)
16. Testing
17. Deployment

Do not skip directly to UI implementation while the underlying distress-scoring and explainability pipeline is non-functional.

## Core Principle
**Never show a distress score or alert without an explanation, and never let the AI act without a human in the loop.**
