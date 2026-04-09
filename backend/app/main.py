from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, cepik, searches, scraper
from app.services.vin_scraper import check_and_login_session

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    await check_and_login_session()
    yield


app = FastAPI(title="Analajzer API", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

# FIX (CORS): Previous code fell back to allow_origins=["*"] when CORS_ORIGINS
# was empty. That is an open backdoor in production. The fix defaults to an
# empty list (reject all cross-origin requests) so you must explicitly set
# CORS_ORIGINS in .env for any frontend to work.
# Development default in config.py is already
#   "http://localhost:5173,http://127.0.0.1:5173"
# so this only bites misconfigured production deployments — which is correct.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # empty list = no wildcard fallback
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(searches.router)
app.include_router(cepik.router)
app.include_router(scraper.router)


@app.get("/health")
def health():
    return {"status": "ok"}
