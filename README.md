# Clinic Client Registration System

The Clinic backend is now a single FastAPI application that serves both authentication and basic profile management features.  It exposes a lightweight REST API.

## 🏗 Architecture

```
┌──────────────────────┐       ┌────────────────┐
│ Unified FastAPI API  │◄────►|  PostgreSQL    │
│  (auth + profiles)   │       │  database      │
└──────────────────────┘       └────────────────┘
```

## 🚀 Backend service

* **Framework:** FastAPI running on Python 3.11
* **Persistence:** SQLAlchemy ORM targeting PostgreSQL
* **Auth:** Stateless JWT access tokens signed with HS256
* **Password hashing:** `passlib` (bcrypt)
* **Configuration:** Environment driven via `pydantic-settings`

## 📦 Getting started

### 1. Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment (optional)

All settings are read from environment variables.  Common overrides include:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://clinic_user:clinic_pass@localhost:5432/clinic_db` |
| `SECRET_KEY` | JWT signing secret | `change-me` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `60` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `*` |
| `DIAGNOSTIC_TESTS_FILE` | Optional path to a JSON file that seeds the `/tests` catalogue | _unset_ |

### 3. Run the API

```bash
uvicorn app.main:app --port 8001 --reload 
```

The service listens on `http://localhost:8000` by default. To pre-populate the
diagnostic test catalogue, set `DIAGNOSTIC_TESTS_FILE` to point at a JSON file
containing the desired entries (e.g. `backend/app/data/diagnostic_tests.json`).
If the variable is omitted the catalogue table remains empty and `/tests`
returns an empty list.

