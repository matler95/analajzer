from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services.vin_scraper import extract_vin

router = APIRouter(prefix="/scraper", tags=["scraper"])

class VinResponse(BaseModel):
    vin: str | None

@router.get("/vin", response_model=VinResponse)
async def get_vin(listing_url: str = Query(..., description="URL ogłoszenia do ekstrakcji VIN")):
    vin = await extract_vin(listing_url)
    return {"vin": vin}
