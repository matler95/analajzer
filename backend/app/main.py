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
    
    # Check session file on startup
    await check_and_login_session()
        
    yield


app = FastAPI(title="Analajzer API", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
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
