import time
import random
import os
import asyncio
import sys
from starlette.concurrency import run_in_threadpool
from playwright.sync_api import sync_playwright

# Punkt do pliku w głównym katalogu
AUTH_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../otomoto_session.json"))
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def apply_stealth(page):
    try:
        import playwright_stealth
        try:
            playwright_stealth.stealth_sync(page)
        except AttributeError:
            # stealth_async might just be stealth
            playwright_stealth.stealth(page)
    except Exception as e:
        print(f"Uwaga: Nie udało się nałożyć pełnego stealth: {e}")

def login_and_save_state_sync():
    """ Runs the playwright UI login sequence synchronously. """
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, 
            args=["--disable-blink-features=AutomationControlled"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")        
        
        print("\n" + "="*50)
        print("KROK 1: LOGOWANIE")
        print("Zaloguj się teraz w otwartym oknie przeglądarki.")
        print("="*50)
        
        page.goto("https://www.otomoto.pl/authentication?redirectUrl=%2Fpost-login")
        
        try:
            print("[*] Czekam na wykrycie konta (do 2 minut)...")
            page.wait_for_selector('[data-testid="logout-button"], [data-test="link-account"], .ooa-1sd0kbw', timeout=120000)
            
            user_name = "użytkownik"
            try:
                user_name = page.inner_text('.ooa-1sd0kbw')
            except:
                pass

            print(f"[+] Sukces! Zalogowano jako: {user_name}")
            print("[*] Zapisuję sesję, nie zamykaj okna...")
            
            time.sleep(5) 
            context.storage_state(path=AUTH_FILE)
            print(f"[+] Plik {AUTH_FILE} został utworzony.")
            
        except Exception as e:
            print(f"[-] Timeout: Nie udało się automatycznie wykryć zalogowania.")
            print(f"[*] Szczegóły błędu: {e}")
        
        browser.close()

def _get_vin_stealth_sync(url: str) -> str | None:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    if not os.path.exists(AUTH_FILE):
        print(f"[-] Plik sesji {AUTH_FILE} nie istnieje! Uruchamiam logowanie...")
        login_and_save_state_sync()
    else:
        print(f"[+] Plik sesji {AUTH_FILE} znaleziony.")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) 
        context = browser.new_context(
            storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None,
            user_agent=USER_AGENT,
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        apply_stealth(page)

        try:
            print(f"[*] Ładowanie ogłoszenia: {url}")
            page.goto(url, wait_until="domcontentloaded")
            time.sleep(random.uniform(3, 5)) 

            try:
                cookie_btn = page.locator("#onetrust-accept-btn-handler")
                if cookie_btn.is_visible(timeout=3000):
                    cookie_btn.click()
                else:
                    alt_cookie_btn = page.locator("button:has-text('Zezwól na wszystkie')")
                    if alt_cookie_btn.is_visible(timeout=1000):
                        alt_cookie_btn.click()
            except:
                pass

            vin_container = page.locator("[data-testid='vin']")
            btn = vin_container.get_by_role("button", name="Wyświetl VIN")

            if btn.is_visible():
                btn.scroll_into_view_if_needed()
                time.sleep(random.uniform(1, 2))
                print("[*] Klikam w 'Wyświetl VIN'...")
                btn.click()
                
                target_selector = "[data-testid='advert-vin'] p"
                page.wait_for_selector(target_selector, timeout=10000)
                
                vin = page.locator(target_selector).inner_text()
                return vin.strip()
            else:
                already_visible = page.locator("[data-testid='advert-vin'] p")
                if already_visible.is_visible():
                    text = already_visible.inner_text()
                    return text.strip()
                
                print("[-] Nie znaleziono przycisku VIN.")
                return None

        except Exception as e:
            print(f"[-] Błąd podczas pobierania: {e}")
            return None
        finally:
            time.sleep(2)
            browser.close()

async def extract_vin(url: str) -> str | None:
    return await run_in_threadpool(_get_vin_stealth_sync, url)

async def check_and_login_session():
    if not os.path.exists(AUTH_FILE):
        print(f"[-] Brak pliku {AUTH_FILE} na starcie! Generowanie...")
        await run_in_threadpool(login_and_save_state_sync)
    else:
        print(f"[+] Znaleziono sesję otomoto na starcie: {AUTH_FILE}")

