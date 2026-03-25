import asyncio
from app.services.vin_scraper import extract_vin

async def main():
    url = "https://www.otomoto.pl/osobowe/oferta/bmw-z4-ID6HHctU"
    print("Testuję", url)
    vin = await extract_vin(url)
    print("Otrzymany VIN:", vin)

if __name__ == "__main__":
    asyncio.run(main())
