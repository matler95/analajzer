# Analajzer API (FastAPI)

## Lokalnie (SQLite — domyślnie)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## PostgreSQL + Redis (Docker)

```bash
docker compose up -d db redis
```

Ustaw w `.env` w katalogu `backend/`:

```
DATABASE_URL=postgresql+psycopg2://analajzer:analajzer@localhost:5432/analajzer
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=twoj-bardzo-dlugi-sekret
```

Dodaj do `requirements.txt` sterownik: `psycopg2-binary` (dla synchronicznego SQLAlchemy).

## Endpointy

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- `GET/POST /searches`, `GET/PATCH /searches/{id}`
- `POST /cepik/verify`

## CORS

Zmienna `CORS_ORIGINS` (przecinki): np. `http://localhost:5173`
