# SAHAAYA — Design Document

Design language reference: *Leafcare — Mental Health Website / App Flow* by Masudur Rahman, Uigeek Studio (Dribbble: https://dribbble.com/uigeek)

---

## 1. Design Direction & Rationale

The visual and interaction language for SAHAAYA's victim-facing surfaces (website + app) is inspired by **Leafcare**, a calming mental-health/wellness product designed by Masudur Rahman for Uigeek Studio. Leafcare's direction fits SAHAAYA because it treats a sensitive, emotionally loaded subject with a soft, trustworthy, low-anxiety interface rather than a clinical or alarming one — exactly the tone SAHAAYA needs for trauma-informed interaction.

**Design principles carried over from Leafcare:**
- Calm, organic visual tone — soft gradients, rounded shapes, generous white space, nothing sharp or clinical.
- Nature/wellness motifs (leaf, breath, growth) used as supporting iconography rather than literal medical imagery.
- Smooth, purposeful scroll and section-reveal animations on the marketing/landing site — content eases in rather than snapping, reinforcing a sense of safety and control.
- Card-based, breathable layouts for content blocks (features, impact stats, how-it-works steps).
- Soft, friendly illustration style over photography for anything touching personal/emotional content.
- Micro-interactions on interactive elements (buttons, toggles, mood selectors) are gentle — subtle scale/opacity easing, never abrupt.
- Clear typographic hierarchy with a warm, rounded sans-serif for headings and a highly legible body font — readability under stress is a functional requirement, not just aesthetics.

**Where SAHAAYA must deliberately diverge from Leafcare:**
- Leafcare is a consumer wellness product; SAHAAYA also needs officer-facing dashboards. Dashboard screens should stay in the same calm palette but shift to a denser, data-oriented layout (tables, trend charts, timeline) rather than the marketing-site airiness.
- Alert/escalation states (Orange/Red distress levels) must remain visually distinct and legible even within a soft palette — do not let "calm" design suppress urgency where a human review is required.

> Note: exact hex values and assets below are a working direction for the code-generation pass based on Leafcare's known style (calming wellness aesthetic, leaf motifs, rounded cards), not a pixel-accurate extraction. Verify against the live shots — "Leafcare Mental Health App Flow" and "Leafcare Sleep Homepage Design" on Uigeek Studio's Dribbble — before final implementation.

---

## 2. Design System / Tokens

| Token | Value / Direction |
|---|---|
| Primary | Sage / forest green (trust, calm, growth) — e.g. `#3E7C59` |
| Secondary | Soft cream / off-white background — e.g. `#F6F5EF` |
| Stable/Green state | `#4E9E6B` |
| Alert — Yellow (mild concern) | Muted amber `#E8A23D` |
| Alert — Orange (significant concern) | Warm orange `#E8703D` |
| Alert — Red (urgent) | Soft red `#D9534F` (desaturated so alert colors don't feel punitive, but stay legible) |
| Text | Charcoal `#1F2A24` on light backgrounds, off-white on dark surfaces |
| Typography — headings | Rounded/humanist sans (e.g. Poppins, Nunito, or Satoshi) |
| Typography — body | Inter or similar, optimized for legibility |
| Corner radius | Large — 16–24px on cards, 12px on buttons/inputs |
| Motion | 200–350ms ease-out for UI transitions; scroll-triggered fade + slide-up (20–30px) for landing sections |
| Iconography | Rounded line icons, leaf/breath/heart motifs for wellness states |

---

## 3. Information Architecture

### 3.1 Public Website (marketing / informational)
- Home (hero, mission, how it works, trust & privacy section, CTA)
- How SAHAAYA Works (victim journey, human-in-the-loop explanation)
- Privacy & Consent (plain-language explainer)
- For Officers / Institutions (login entry point)
- Contact / Support

### 3.2 Victim-Facing App (mobile-first, PWA-capable)
- Onboarding: language selection → consent → communication preference
- Home / Check-in (mood selector: Better / Okay / Stressed / Very Distressed / I Need Help)
- Chatbot (multilingual, trauma-informed conversational UI)
- Voice interaction (optional, with clear consent state)
- My Distress Trend (simple, non-alarming personal view)
- Support Request (emergency / counselling appointment)
- Case Update Notifications

### 3.3 Officer / Admin Dashboard
- Alerts inbox (high-risk first, explainable reasons attached)
- Case detail (distress trend graph, contributing factors, case timeline)
- District Dashboard (aggregate risk distribution, response time)
- State Dashboard (district clusters, counselling availability)
- National Dashboard (aggregated, anonymised trends)
- Role-based access control screens (Victim / Counsellor / District / State / National)

---

## 4. Key Screen Notes

- **Check-in screen:** minimise cognitive load — a single simple question ("How are you feeling today?") with five large, calm-colored tap targets (Better / Okay / Stressed / Very Distressed / I Need Help). Leafcare-style gentle bounce/scale on selection.
- **Chatbot UI:** empathetic tone, generous message spacing, no pressure to disclose — soft rounded message bubbles, slow typing-indicator animation rather than instant replies, to feel considered rather than automated.
- **Distress trend (victim view):** deliberately softened — a simple line/area chart in calm palette, framed around "how you've been feeling" rather than clinical scoring language.
- **Officer alert card:** structured explanation block (contributing factors listed clearly), color-coded by band (Green/Yellow/Orange/Red) using the alert token colors, single clear CTA ("Review Case").
- **Case timeline:** horizontal or vertical stepper showing case + wellbeing events together (Complaint Registered → Investigation Started → Threat Reported → Distress Score Increased → Counselling Assigned → Court Hearing → Compensation → Rehabilitation).

---

## 5. Animation & Micro-interaction Guidelines

- Landing page sections fade + slide up on scroll (Leafcare-style), staggered by ~80–120ms per element.
- Buttons/toggles: subtle scale (0.97 → 1) and opacity ease on press, 150–200ms.
- Mood/check-in selection: gentle scale-up + soft glow on the selected state.
- Chart transitions (dashboards): smooth value interpolation when scores update, not abrupt jumps — reinforces trend over snapshot.
- Alerts: a restrained pulse or highlight on new high-risk alerts in the officer inbox — noticeable, not alarming.
