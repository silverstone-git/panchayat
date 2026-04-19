# Panchayat 🏛️

**Panchayat** is an event-driven, highly scalable civic participation platform. It empowers citizens to submit ideas to solve local or national problems, allows the community to vote on them, and forwards consensus-backed ideas to government portals or crowdfunding campaigns.

---

## ✨ Features
- **Modern Hybrid UI:** A "Reddit x Twitter" inspired interface with a 3-column layout, glassmorphism, and a persistent Light/Dark mode.
- **Smart Idea Submission:** Structured proposal workflow with built-in ML-driven moderation and category-based routing.
- **Real-Time Paginated Feeds:** High-performance feeds powered by Elasticsearch, supporting keyword search, category filtering, and sorting (Latest vs. Top Voted).
- **Expert Review Workflow:** Automated assignment of proposals to specialized experts for scoring and consensus validation.
- **Automated Civic Action:** Consensus-backed ideas (Expert Score > 7.0) are automatically prepared for submission to government portals.
- **Event-Driven Architecture:** Decoupled microservices communicating asynchronously via Apache Kafka for maximum resilience.
- **Identity & Gamification:** JWT-based authentication with profile personalization (avatars) and a civic XP/Leveling system.

## 🛠️ Tech Stack
Panchayat uses a polyglot microservice architecture designed for maximum concurrency and scale.

**Frontend:**
- **React + TypeScript:** High-speed, responsive user interface.
- **Vite:** Blazing fast build tool and dev server.
- **CSS3:** Modern design system using variables, glassmorphism, and pill-shaped navigation.

**Backend Ecosystem (Python 3.12+ / FastAPI):**
- **Threads Service:** Core content management (Ideas, Comments) and Elasticsearch integration.
- **Voting Service:** Atomic high-speed voting logic using Redis Lua scripting.
- **User Service:** Identity provider, JWT issuance, and gamification engine.
- **Moderation Service:** ML-based content filtering (alt-profanity-check).


**Orchestration & Advanced Services (Java 21 / Spring MVC):**
- **Expert Review Service:** Panel assignments, scoring rubrics, and quorum logic.
- **Notification Service:** Centralized, event-driven push and email notification engine.
- **Gov Submit Service:** Bridge for automated government portal submissions.
- **Crowdfund Service:** Lobbying fund campaigns per approved idea.

**Edge Layer:**
- **API Gateway (Java 21 + Spring Cloud Gateway):** The reactive front door handling JWT verification, routing, and identity propagation.

**Infrastructure:**
- **PostgreSQL:** Primary relational storage (asyncpg).
- **Redis:** High-speed caching, atomic counters, and write-behind queues.
- **Elasticsearch:** Real-time full-text search and geo-filtering.
- **Apache Kafka (KRaft):** High-throughput event bus for inter-service communication.
- **Docker & Docker Compose:** Standardized container orchestration.

---

## 🚀 How to Start (Development)

### 1. Prerequisites
- Docker and Docker Compose
- Available Ports: `8080` (Gateway), `5173` (Client), `5432` (Postgres), `6379` (Redis), `9200` (Elasticsearch), `9092` (Kafka).

### 2. Environment Setup
Create a `.env` file for the gateway (shared among services in dev mode):
```bash
cp .env.example gateway/.env
```
*(Ensure `JWT_SECRET_KEY` is at least 32 characters long).*

### 3. Run the Ecosystem
Spin up the entire platform:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### 4. Access the Application
- **Web UI:** [http://localhost:5173](http://localhost:5173)
- **API Gateway:** `http://localhost:8080` (Proxied via Web UI)

---

## 🔮 Project Status

**Completed Phases:**
- **Phase 1-2:** Walking Skeleton & Consensus Engine.
- **Phase 3:** Identity, Trust, and Gamification.
- **Phase 4:** Moderation, Expert Review, Notifications, and Gov-Submit workflows + UI Overhaul.
- **Phase 5:** Scale & Monitoring (Docker Swarm, Prometheus, Grafana).

**Next Up:**
- **Phase 6 (Advanced Governance):** Action Group (Sub-Panchayat) extraction and crowdfunding integration.

*For detailed architectural mandates, refer to `GEMINI.md`.*
