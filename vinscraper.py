import time
import random
import os
from playwright.sync_api import sync_playwright
# Importujemy główny moduł
import playwright_stealth

AUTH_FILE = "otomoto_session.json"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def apply_stealth(page):
    """Funkcja pomocnicza do nakładania stealth niezależnie od wersji biblioteki."""
    try:
        # Próba wywołania jako funkcja bezpośrednia
        playwright_stealth.stealth_sync(page)
    except AttributeError:
        try:
            # Próba wywołania przez główny moduł
            playwright_stealth.stealth(page)
        except Exception as e:
            print(f"Uwaga: Nie udało się nałożyć pełnego stealth: {e}")

def login_and_save_state():
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
            # Szukamy po 'data-testid', który widnieje w Twoim kodzie HTML:
            # <a href="/konto/wyloguj/" data-testid="logout-button" ...>Wyloguj</a>
            print("[*] Czekam na wykrycie konta (do 2 minut)...")
            
            # Próbujemy trzech różnych metod wykrycia zalogowania jednocześnie
            page.wait_for_selector('[data-testid="logout-button"], [data-test="link-account"], .ooa-1sd0kbw', timeout=120000)
            
            # Pobieramy nazwę użytkownika z kodu, który wysłałeś (klasa ooa-1sd0kbw)
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
        
# Dodatkowa poprawka importu stealth dla Twojej wersji
def apply_stealth(page):
    try:
        import playwright_stealth
        # Próbujemy najpierw metody stealth()
        playwright_stealth.stealth(page)
    except Exception:
        # Jeśli nie działa, pomijamy - flaga AutomationControlled i tak robi robotę
        pass

def get_vin_stealth(url):
    if not os.path.exists(AUTH_FILE):
        login_and_save_state()

    with sync_playwright() as p:
        # Zostawiamy headless=False, żeby widzieć ewentualne Captcha
        browser = p.chromium.launch(headless=False) 
        context = browser.new_context(
            storage_state=AUTH_FILE,
            user_agent=USER_AGENT,
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        apply_stealth(page)

        try:
            print(f"[*] Ładowanie ogłoszenia: {url}")
            page.goto(url, wait_until="domcontentloaded")
            time.sleep(random.uniform(3, 5)) # Przerwa na 'ludzkie' załadowanie

            # Kliknięcie cookies jeśli się pojawią (mimo sesji)
            try:
                cookie_btn = page.locator("#onetrust-accept-btn-handler")
                if cookie_btn.is_visible(timeout=3000):
                    cookie_btn.click()
            except:
                pass

            # Szukanie przycisku w kontenerze VIN
            vin_container = page.locator("[data-testid='vin']")
            btn = vin_container.get_by_role("button", name="Wyświetl VIN")

            if btn.is_visible():
                btn.scroll_into_view_if_needed()
                time.sleep(random.uniform(1, 2))
                print("[*] Klikam w 'Wyświetl VIN'...")
                btn.click()
                
                # Czekamy na numer VIN (wg Twojego kodu HTML)
                target_selector = "[data-testid='advert-vin'] p"
                page.wait_for_selector(target_selector, timeout=10000)
                
                vin = page.locator(target_selector).inner_text()
                return vin.strip()
            else:
                # Sprawdzenie czy już jest widoczny
                already_visible = page.locator("[data-testid='advert-vin'] p")
                if already_visible.is_visible():
                    return already_visible.inner_text().strip()
                
                print("[-] Nie znaleziono przycisku VIN.")
                return None

        except Exception as e:
            print(f"[-] Błąd podczas pobierania: {e}")
            return None
        finally:
            time.sleep(2)
            browser.close()

if __name__ == "__main__":
    # PODAJ TUTAJ URL
    target_url = "https://www.otomoto.pl/osobowe/oferta/bmw-z4-ID6HHctU"
    
    wynik = get_vin_stealth(target_url)
    if wynik:
        print(f"\n[SUKCES] Wyciągnięty VIN: {wynik}")
    else:
        print("\n[PORAŻKA] Nie udało się uzyskać numeru VIN.")