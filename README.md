# Panchayat 🏛️

**Panchayat** is an event-driven, highly scalable civic participation platform. It empowers citizens to submit ideas to solve local or national problems, allows the community to vote on them, and forwards consensus-backed ideas to government portals or crowdfunding campaigns.

---

## ✨ Features
- **Idea Submission:** Users can propose structured ideas/solutions with automatic profanity checks.
- **Real-Time Feeds:** High-performance, full-text searchable feeds powered by Elasticsearch and cached via Redis.
- **Consensus Engine (Voting):** High-concurrency voting system using Redis Lua scripting for atomic, idempotent operations. Features optimistic UI updates for instant user feedback.
- **Event-Driven:** Microservices communicate asynchronously via Apache Kafka.

## 🛠️ Tech Stack
Panchayat uses a polyglot microservice architecture designed for maximum concurrency and scale.

**Frontend:**
- **React + TypeScript:** Lightweight, snappy user interface.
- **Vite:** High-speed development server and bundler.

**Backend Services:**
- **API Gateway (Java 26 + Spring Cloud Gateway):** The reactive front door handling authentication, routing, and identity propagation.
- **Threads & Voting Services (Python 3.12+ + FastAPI):** Blazing fast, async-native microservices managed by the `uv` toolchain.

**Infrastructure:**
- **PostgreSQL:** Primary relational datastore (asyncpg/R2DBC).
- **Redis:** High-speed caching, atomic counters, and write-behind queues.
- **Elasticsearch:** Fast, geo-aware, full-text search indexing.
- **Apache Kafka (KRaft):** Central event bus for decoupled inter-service communication (e.g., `VOTE_CAST`, `IDEA_CREATED`).
- **Docker & Docker Compose:** Containerized orchestration for development and production.

---

## 🚀 How to Start (Development)

### 1. Prerequisites
- Docker and Docker Compose
- Ensure ports `8080`, `8002`, `8003`, `5173`, `5432`, `6379`, `9200`, and `9092` are available.

### 2. Environment Setup
Create a `.env` file for the gateway (which is shared among the services in dev mode):
```bash
cp .env.example gateway/.env
```
*(Make sure to update the passwords inside `gateway/.env` if desired).*

### 3. Run the Ecosystem
Spin up the entire platform in development mode with live-reloading enabled:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### 4. Access the Application
- **Web UI:** [http://localhost:5173](http://localhost:5173)
- **API Gateway:** `http://localhost:8080` (Proxied automatically by the Web UI)

---

## 🔮 Project Status
Panchayat is being built in phases.

**Completed Phases:**
- **Phase 1 (Walking Skeleton):** Basic end-to-end traversal.
- **Phase 2 (Consensus Engine):** High-concurrency voting and Kafka integration.
- **Phase 3 (Identity & Trust):** Dedicated User Service, JWT authentication, and Gamification.
- **Phase 4 (Action & Moderation):** ML-driven moderation, Expert Review workflows, Notification engine, Gov-Submit simulation, and a modern UI overhaul with paginated search.

**Upcoming Phases:**
- **Phase 5 (Scale & Monitoring):** Docker Swarm orchestration, Prometheus metrics, and Grafana dashboards.
- **Phase 6 (Advanced Governance):** Action Group (Subreddit) extraction into a dedicated service, localized domain management, and crowdfunding integration.
