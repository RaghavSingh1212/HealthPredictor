# HealthPredictor

AI-powered medical intake triage system: patients complete a secure symptom conversation, clinicians review structured cases in real time.

Built with **FastAPI**, **Next.js**, **MongoDB**, **Google Gemini**, and **Kubernetes**.

---

## Architecture

```
[Patient UI (Next.js)] ----(HTTPS)----> [Triage API (FastAPI)]
                                              |         |
                                   (Gemini AI)   (MongoDB)
                                              |         |
[Clinician Dashboard (React)] <---(REST)------+---------+
```

| Component | Role |
|-----------|------|
| **Patient app** (`/`) | Chat-based intake; streams messages to the API |
| **Clinician dashboard** (`/dashboard`) | Lists pending cases, severity tags, sign-off |
| **Triage API** | Gemini conversation + structured JSON summary + persistence |
| **MongoDB** | Stores triage records with indexes on `status` and `created_at` |
| **Kubernetes** | Optional production deploy (see `med-triage-system/k8s/`) |

---

## Features

- Empathetic AI intake assistant (HIPAA-oriented system prompt; no diagnosis)
- Structured clinical summary: chief complaint, duration, severity, symptoms, history
- Real-time clinician feed (5s polling)
- Case workflow: `pending_review` → `reviewed`
- Local dev without Docker: in-memory MongoDB + mock AI mode
- Production-ready K8s manifests with health checks and secrets

---

## Project structure

```
HealthPredictor/
├── README.md
└── med-triage-system/
    ├── backend/          # FastAPI + Motor + Gemini
    ├── frontend/         # Next.js 14 + Tailwind
    ├── k8s/              # Kubernetes deployments
    ├── docker-compose.yml
    └── scripts/run-local.sh
```

---

## Quick start (localhost)

### Prerequisites

- Python 3.13+ (or 3.11+)
- Node.js 18+
- (Optional) Docker — for persistent MongoDB
- (Optional) [Google AI API key](https://aistudio.google.com/app/apikey) — for live Gemini; mock mode works without it

### One-command start

```bash
cd med-triage-system
chmod +x scripts/run-local.sh
./scripts/run-local.sh
```

### Manual start

**1. Backend**

```bash
cd med-triage-system/backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # edit GEMINI_API_KEY if you have one
uvicorn main:app --reload --port 8000
```

**2. Frontend**

```bash
cd med-triage-system/frontend
npm install
cp .env.example .env.local
npm run dev
```

### URLs

| Service | URL |
|---------|-----|
| Patient chat | http://localhost:3000 |
| Clinician dashboard | http://localhost:3000/dashboard |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Health check | http://localhost:8000/healthz |

### Demo flow (mock AI)

With `GEMINI_API_KEY=dev-mock-key` in `backend/.env`:

1. Open the patient chat and describe symptoms.
2. Answer 2–3 follow-ups (or type **finish**).
3. Open the dashboard — the case appears within ~5 seconds.
4. Click **Sign-off Case**.

---

## Configuration

### Backend (`med-triage-system/backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://root:example@localhost:27017/med_db?authSource=admin` |
| `USE_IN_MEMORY_DB` | Use mongomock (no Docker) | `true` |
| `GEMINI_API_KEY` | Google AI key; `dev-mock-key` = mock | `dev-mock-key` |
| `ENCRYPTION_KEY` | App-level encryption (32+ chars) | (see `.env.example`) |
| `PORT` | API port | `8000` |

### Frontend (`med-triage-system/frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (browser-facing) | `http://localhost:8000` |

### Persistent MongoDB (Docker)

```bash
cd med-triage-system
docker compose up -d mongodb
```

Set in `backend/.env`:

```env
USE_IN_MEMORY_DB=false
MONGO_URI=mongodb://root:example@localhost:27017/med_db?authSource=admin
```

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/triage` | Send chat history; returns converse or completed summary |
| `GET` | `/api/clinician/cases` | List `pending_review` cases |
| `POST` | `/api/clinician/cases/{id}/resolve` | Mark case as reviewed |
| `GET` | `/healthz` | Liveness probe |

**Triage request body:**

```json
{
  "patient_id": "PT-8831A",
  "history": [
    { "role": "model", "content": "Hello..." },
    { "role": "user", "content": "Headache for 2 days" }
  ]
}
```

---

## Docker

```bash
# MongoDB only
cd med-triage-system && docker compose up -d mongodb

# Backend image
cd med-triage-system/backend && docker build -t triage-backend .

# Frontend image
cd med-triage-system/frontend && docker build -t triage-frontend .
```

---

## Kubernetes

```bash
# Update base64 secrets in k8s/secrets.yaml with your keys
kubectl apply -f med-triage-system/k8s/
```

Deploys MongoDB, 2× backend, 2× frontend (LoadBalancer). Set `GEMINI_API_KEY` and `ENCRYPTION_KEY` in `med-system-secrets` before production use.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| API | FastAPI, Uvicorn, Pydantic, Motor |
| AI | Google Generative AI (Gemini 1.5 Flash) |
| Database | MongoDB 6.0 |
| Frontend | Next.js 14, React 18, Tailwind CSS, Lucide |
| Ops | Docker, Kubernetes |

---

## License

MIT — use freely for learning and portfolio projects.
