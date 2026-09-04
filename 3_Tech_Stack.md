# SAHAAYA — Technology Stack & Architecture

---

## 1. Recommended Technology Stack

| Layer | Technology |
|---|---|
| Mobile Application | Flutter |
| Public Website + Officer Dashboard | React or Next.js (Next.js recommended for the marketing site's animated, SEO-relevant pages) |
| Backend API | Python — FastAPI |
| Primary Database | PostgreSQL |
| Vector layer (if semantic search/embeddings needed) | FAISS or `pgvector` |
| NLP / Emotion Detection | Multilingual BERT, IndicBERT, MuRIL (fine-tuned) |
| Voice Feature Analysis | librosa, OpenSMILE, wav2vec-based models |
| Speech-to-Text | Whisper-based or suitable Indian-language ASR |
| Risk Prediction (prototype) | XGBoost, LightGBM, or Random Forest |
| Time-series (future) | LSTM / Temporal Transformer |
| Explainability | SHAP, feature importance, rule-based explanations |
| ML/DL runtime | PyTorch, Transformers, scikit-learn |
| Auth | Token-based API auth (JWT), role-based access control |
| Animation (web) | Framer Motion (React) for scroll-reveal and micro-interactions in the Leafcare-style landing experience |
| Cloud (prototype) | AWS, Azure, or Google Cloud |

---

## 2. Suggested Repository Structure

```
sahaaya/
├── apps/
│   ├── web/                # Next.js public site + officer dashboard
│   └── mobile/              # Flutter victim-facing app
├── services/
│   ├── api-gateway/
│   ├── interaction-service/  # check-ins, chatbot, IVRS, SMS
│   ├── case-event-service/
│   ├── nlp-ai-service/
│   ├── voice-ai-service/
│   ├── distress-engine/      # dynamic scoring + trend/escalation
│   └── explainability-service/
├── packages/
│   └── design-system/        # shared tokens (colors, type, spacing, motion — Leafcare-inspired)
└── infra/
```

---

## 3. System Architecture — Six Layers

1. **Victim Interaction Layer** — mobile application, chatbot, IVRS, voice and SMS.
2. **Data Collection Layer** — collects consented self-reports, text, behavioural signals, optional voice features and case events.
3. **AI Analysis Layer** — processes multimodal information.
4. **Dynamic Risk Engine** — calculates current distress level and predicts possible escalation.
5. **Human Intervention Layer** — sends explainable alerts to authorised counsellors and officials.
6. **Administrative Dashboard** — district, state and national-level monitoring and aggregated insights.

---

## 4. System Flow

```
Mobile App / Web / Chatbot / IVRS / SMS
        ↓
    API Gateway
        ↓
Interaction Service + Case Event Service
        ↓
    Data Processing Layer
        ↓
NLP AI + Voice AI + Behaviour AI
        ↓
  Dynamic Distress Engine
        ↓
  Distress Trend Prediction
        ↓
  Explainable AI Layer
        ↓
Human Review and Alert Engine
        ↓
Counsellor + District + State/National Dashboards
```

---

## 5. Security & Privacy Architecture

**Consent management:** clear explanation of collected data, purpose of collection, who can access information, consent review and management.

**Role-based access control:**
- Victim — access to personal information
- Counsellor — access to relevant well-being information
- District Officer — authorised case and intervention information
- State Officer — district-level oversight
- National Administrator — primarily aggregated insights

**Additional security measures:** encryption in transit, encryption at rest, secure authentication, token-based API access, data minimisation, audit logs.

---

## 6. Dataset Strategy (Prototype)

Do not use real victim data without proper authorisation. For the prototype, use:
- Public multilingual sentiment and emotion datasets
- Public speech emotion datasets
- Synthetic victim interactions
- Simulated case timelines

A synthetic demonstration dataset should clearly contain case events, interaction history, distress trends and intervention outcomes — labelled explicitly as prototype data, never represented as real victim data.
