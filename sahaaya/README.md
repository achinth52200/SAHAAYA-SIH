# SAHAAYA - AI-Powered Mental Health Monitoring & Distress Prediction System

**SIH 2026 · Problem Statement 26094**

SAHAAYA is a multilingual, privacy-first, AI-assisted platform that monitors the psychological well-being of victims of atrocities through their legal, investigation, compensation and rehabilitation journey. It combines periodic check-ins, self-reports, text/voice analysis, behavioural signals and case-timeline events into a **Dynamic Distress Score (0–100)**, predicts escalation, and routes explainable alerts to trained human professionals.

> ⚠️ **Prototype Notice**: This is a prototype for SIH 2026 hackathon. All data is synthetic and clearly labelled. No real victim data is used. The AI never diagnoses, prescribes, or triggers interventions without human review.

---

## 🏗️ Architecture

```
SAHAAYA/
├── apps/
│   ├── web/                    # Next.js 14 (Public site + Officer Dashboard)
│   └── mobile/                 # Flutter (Victim-facing mobile app)
├── services/
│   ├── api-gateway/            # FastAPI backend (port 8000)
│   ├── nlp-ai-service/         # Emotion detection (TF-IDF + XGBoost)
│   ├── distress-engine/        # Dynamic Distress Score engine
│   ├── explainability-service/ # SHAP/rule-based explanations
│   └── human-review-service/   # Alert review & intervention tracking
├── packages/
│   └── design-system/          # Leafcare-inspired design tokens
├── infra/
│   ├── Dockerfile.api          # API Gateway Dockerfile
│   ├── docker-compose.yml      # Full stack orchestration
│   ├── nginx.conf              # Reverse proxy config
│   └── init.sql                # Database schema
└── .env.example                # Environment variables template
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for web development)
- Flutter 3.16+ (for mobile development)
- Python 3.11+ (for AI services development)

### 1. Clone and Configure
```bash
git clone <repo-url>
cd sahaaya
cp .env.example .env
# Edit .env with your values
```

### 2. Start Full Stack (Docker)
```bash
docker-compose up -d --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **API Gateway** on port 8000
- **Web Frontend** on port 3000
- **Nginx** on ports 80/443

### 3. Access the Application
- **Public Site**: http://localhost:3000
- **Officer Dashboard**: http://localhost:3000/dashboard
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 4. Demo Credentials
All demo accounts use password: `demo123`

| Role | Email |
|------|-------|
| Victim | victim@sahaaya.gov.in |
| Counsellor | counsellor@sahaaya.gov.in |
| District Officer | district@sahaaya.gov.in |
| State Officer | state@sahaaya.gov.in |
| National Admin | national@sahaaya.gov.in |

---

## 🧠 AI Pipeline (Development)

### Run Individual Services
```bash
# Synthetic data generation
cd services/nlp-ai-service
python synthetic_data_generator.py

# Train emotion model
python emotion_model_lightweight.py

# Run distress engine demo
cd ../distress-engine
python distress_engine.py

# Run explainability demo
cd ../explainability-service
python explainability.py

# Full integration test
cd ../api-gateway
python integration_test.py
```

### API Endpoints
```bash
# Health
GET /health

# Victims
GET /api/v1/victims
GET /api/v1/victims/{id}
GET /api/v1/victims/{id}/distress
GET /api/v1/victims/{id}/explanation

# Emotion
POST /api/v1/emotion/predict {"text": "I am scared"}

# Distress
POST /api/v1/distress/score {...}
GET /api/v1/victims/{id}/distress

# Alerts & Review
GET /api/v1/alerts
GET /api/v1/review/alerts
POST /api/v1/review/alerts/{id}/assign
POST /api/v1/review/alerts/{id}/review
POST /api/v1/review/alerts/{id}/interventions
GET /api/v1/review/stats/summary

# Dashboards
GET /api/v1/dashboard/district/{id}
GET /api/v1/dashboard/state/{id}
GET /api/v1/dashboard/national
```

---

## 🎨 Design System (Leafcare-Inspired)

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Primary 500 | `#3E7C59` | Main actions, links |
| Secondary 100 | `#F6F5EF` | Background |
| Distress Green | `#4E9E6B` | Stable (0-29) |
| Distress Yellow | `#E8A23D` | Mild (30-49) |
| Distress Orange | `#E8703D` | Significant (50-74) |
| Distress Red | `#D9534F` | Urgent (75-100) |

### Typography
- **Headings**: Poppins / Nunito / Satoshi
- **Body**: Inter

### Motion
- Transitions: 200-350ms ease-out
- Scroll reveal: fade + slide-up (20-30px)
- Stagger: 80-120ms per element

---

## 🔒 Security & Compliance

### Implemented
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (Victim/Counsellor/District/State/National)
- ✅ Rate limiting (API: 100r/s, Auth: 10r/s)
- ✅ Audit logging for all actions
- ✅ HTTPS enforcement via Nginx
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Input validation with Pydantic/Zod
- ✅ Bcrypt password hashing

### Data Privacy
- ✅ Synthetic prototype data only
- ✅ Explicit consent management
- ✅ Data minimization
- ✅ Encryption in transit (TLS 1.2+)
- ✅ Encryption at rest (PostgreSQL)

---

## 📊 Development Order (Per AGENTS.md)

1. ✅ Data collection & case-event pipeline
2. ✅ Synthetic dataset preparation
3. ✅ NLP / emotion detection model
4. ✅ Voice feature analysis (optional module)
5. ✅ Behavioural pattern detection
6. ✅ Dynamic Distress Score engine
7. ✅ Personal baseline model
8. ✅ Trend & escalation prediction
9. ✅ Explainable AI layer (SHAP / feature importance / rule-based)
10. ✅ FastAPI backend
11. ✅ Human-in-the-loop alert & review workflow
12. 🔄 React/Next.js web (public site + officer dashboard)
13. 🔄 Flutter mobile app (victim-facing)
14. 🔄 Integration
15. 🔄 Privacy & security hardening
16. 🔄 Testing
17. 🔄 Deployment

---

## 🧪 Testing

```bash
# API Integration Tests
cd services/api-gateway
python test_api.py
python test_review.py

# Frontend
cd apps/web
npm run type-check
npm run lint
npm run build

# Mobile
cd apps/mobile
flutter analyze
flutter test
```

---

## 📦 Deployment

### Production Checklist
- [ ] Set strong `SECRET_KEY` and `POSTGRES_PASSWORD`
- [ ] Configure SSL certificates (Let's Encrypt recommended)
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Set up log aggregation (ELK/Loki)
- [ ] Run security scan (Trivy, Snyk)
- [ ] Load test API endpoints

### Deploy with Docker Compose
```bash
# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale API workers
docker-compose up -d --scale api-gateway=4
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is developed for **SIH 2026 (Problem Statement 26094)**. 
Prototype code - not for clinical use.

---

## 🙏 Acknowledgments

- **Design Inspiration**: Leafcare by Masudur Rahman (Uigeek Studio)
- **AI/ML**: Hugging Face Transformers, XGBoost, SHAP
- **Framework**: FastAPI, Next.js, Flutter
- **Infrastructure**: Docker, Nginx, PostgreSQL, Redis

---

**Built with ❤️ for SIH 2026**  
*SAHAAYA - Supporting victims through technology*