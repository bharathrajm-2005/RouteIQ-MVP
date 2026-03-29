# RouteIQ MVP — Build Walkthrough

## What Was Built

A complete, production-ready **dispatch intelligence and carbon compliance platform** with 3 microservices and **67 source files**.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React 18  │────▶│  Spring Boot 3   │────▶│  Python FastAPI  │
│  Vite + TW  │     │   JWT + JPA      │     │ Isolation Forest │
│  :3000      │     │   :8080          │     │  :8000           │
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │     MySQL 8      │
                    └──────────────────┘
```

---

## Backend (Java Spring Boot 3)

| Layer | Files | Key Points |
|-------|-------|------------|
| Entities | 5 JPA entities | User, Shipment, CourierMetric, Alert, CourierOption |
| Repositories | 5 Spring Data repos | Custom JPQL for monthly aggregation & corridor queries |
| Security | JWT filter + config | Bearer token auth, CORS, BCrypt password hashing |
| Controllers | 7 REST controllers | Auth, Shipment, Alert, Recommend, Carbon, NLQuery, GlobalExceptionHandler |
| Services | 6 service classes | Auth, Shipment, Anomaly (scheduled), Recommendation, Carbon, NLQuery |
| Config | DataSeeder, AppConfig | Auto-seeds 3 couriers, 30 days metrics, 50 shipments, demo user |

**Seed data highlight:** Shiprocket shows a degradation spike on corridor `110001-400001` in the last 2 hours, making the anomaly detection feature immediately visible on demo.

---

## Python ML Microservice (FastAPI)

| Endpoint | Logic |
|----------|-------|
| `POST /detect` | Isolation Forest on courier metrics → anomaly detection with severity scoring |
| `POST /rank` | Composite score = SLA(50%) + Cost(30%) + Carbon(20%) → ranked courier list |
| `POST /carbon` | Emission factors: bike(0.05), van(0.15), truck(0.20), air(0.60) kg CO₂/tonne-km |

---

## Frontend (React + TailwindCSS + Recharts)

| Screen | Features |
|--------|----------|
| **Login/Register** | Toggle form, demo credentials shown, glassmorphism effects |
| **Dashboard** | 3 metric cards, alert banner, SLA trend chart, recent shipments table |
| **Dispatch** | Pin selector form, ranked recommendation cards with SLA/cost/CO₂, dispatch button |
| **Alerts** | Severity badges, timestamps, mark-as-read, empty state |
| **Carbon Report** | Month/year selector, 4 metric cards, courier bar chart, daily trend, savings insight |
| **NL Query Widget** | Floating chat drawer on all screens, Claude API integration |

---

## How to Run

### Docker (Recommended)
```bash
cd d:\RouteIQ
docker-compose up --build
# Frontend: http://localhost:3000
# Demo: demo@routeiq.in / demo123
```

### Local Development
1. Start MySQL (port 3306, database: `routeiq`)
2. `cd python-service && pip install -r requirements.txt && python main.py`
3. `cd backend && mvn spring-boot:run`
4. `cd frontend && npm install && npm run dev`

---

## File Count Summary

| Component | Files |
|-----------|-------|
| Backend (Java) | 35 source files |
| Python Service | 2 files |
| Frontend (React) | 12 source files |
| Docker/Config | 6 files |
| Documentation | 1 file |
| **Total** | **~56 source files** (67 including build artifacts) |
