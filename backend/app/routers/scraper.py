from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services.vin_scraper import extract_vin, get_search_listing_urls

router = APIRouter(prefix="/scraper", tags=["scraper"])

ALLOWED_PORTALS = ("otomoto.pl", "olx.pl")


class VinResponse(BaseModel):
    vin: str | None


class SearchUrlsResponse(BaseModel):
    urls: list[str]
    count: int
    portal: str


@router.get("/vin", response_model=VinResponse)
async def get_vin(listing_url: str = Query(..., description="URL ogłoszenia do ekstrakcji VIN")):
    vin = await extract_vin(listing_url)
    return {"vin": vin}


@router.get("/search-urls", response_model=SearchUrlsResponse)
async def get_search_urls(
    search_url: str = Query(..., description="URL wyszukiwania otomoto lub olx"),
    max_pages: int = Query(default=2, ge=1, le=5, description="Maksymalna liczba stron do przeskanowania"),
):
    """
    Scrapes listing URLs from an otomoto.pl or olx.pl search results page.
    Returns a deduplicated list of listing URLs found.
    """
    if not search_url.strip():
        raise HTTPException(status_code=400, detail="search_url jest wymagany")

    detected_portal = next(
        (p for p in ALLOWED_PORTALS if p in search_url),
        None,
    )
    if not detected_portal:
        raise HTTPException(
            status_code=400,
            detail=f"search_url musi być adresem jednego z obsługiwanych portali: {', '.join(ALLOWED_PORTALS)}",
        )

    try:
        urls = await get_search_listing_urls(search_url, max_pages)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Błąd scrapowania wyników wyszukiwania: {e!s}",
        ) from e

    return SearchUrlsResponse(urls=urls, count=len(urls), portal=detected_portal)
