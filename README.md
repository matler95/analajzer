# Analajzer — ekstrakcja ogłoszeń + CEPiK

## Frontend (`car-extractor`)

Vite + React. Parsowanie Otomoto/OLX przez **Jina Reader** w przeglądarce.

```bash
cd car-extractor
npm install
npm run dev
```

Opcjonalnie skopiuj `.env.example` → `.env` i ustaw `VITE_API_URL` (domyślnie `http://127.0.0.1:8000`).

## Backend (`backend`)

FastAPI: konta użytkowników (JWT), historia wyszukiwań, weryfikacja **Historia pojazdu** (moj.gov.pl), cache (SQLite/DB lub Redis), limit wywołań CEPiK.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Szczegóły: [backend/README.md](backend/README.md).

## Docker (PostgreSQL + Redis)

```bash
docker compose up -d
```

Następnie w `backend/.env` ustaw `DATABASE_URL`, `REDIS_URL` i doinstaluj `psycopg2-binary`.

## Zmienne backendu (`.env`)

- `SECRET_KEY` — silny sekret produkcyjny  
- `DATABASE_URL` — domyślnie SQLite `sqlite:///./analajzer.db`  
- `REDIS_URL` — opcjonalnie, np. `redis://localhost:6379/0`  
- `CORS_ORIGINS` — np. `http://localhost:5173`  
- `ODOMETER_TOLERANCE_KM` — tolerancja przebiegu (domyślnie 999)  
- `CEPIK_RATE_LIMIT_PER_MINUTE` — limit zapytań do gov (domyślnie 10)
