$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Analajzer - Automatyczny Start Appki   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# --- BACKEND ---
Write-Host "`n[1/4] Sprawdzanie środowiska Backend..." -ForegroundColor Yellow
Set-Location "$RootDir\backend"

if (-not (Test-Path ".venv")) {
    Write-Host "Tworzenie wirtualnego środowiska (venv)..." -ForegroundColor White
    python -m venv .venv
}

Write-Host "Instalowanie zależności Pythona..." -ForegroundColor White
.\.venv\Scripts\python.exe -m pip install --upgrade pip | Out-Null
.\.venv\Scripts\pip.exe install -r requirements.txt

Write-Host "Instalowanie przeglądarki Playwright (wymagane skryptem VIN)..." -ForegroundColor White
.\.venv\Scripts\playwright.exe install chromium

# --- FRONTEND ---
Write-Host "`n[2/4] Sprawdzanie środowiska Frontend..." -ForegroundColor Yellow
Set-Location "$RootDir\car-extractor"

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalowanie zależności NPM (może potrwać chwilę)..." -ForegroundColor White
    npm install
}

# --- URUCHAMIANIE ---
Write-Host "`n[3/4] Uruchamianie serwerów..." -ForegroundColor Yellow

# Backend Server
Write-Host "Startowanie backendu FastAPI (w nowym oknie)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit -Title `"Analajzer Backend`" -Command `"cd '$RootDir\backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`""

# Frontend Server
Write-Host "Startowanie frontendu React (w nowym oknie)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit -Title `"Analajzer Frontend`" -Command `"cd '$RootDir\car-extractor'; npm run dev`""

# --- KONIEC ---
Set-Location $RootDir
Write-Host "`n[4/4] Gotowe! Appka została poprawnie przygotowana i uruchomiona." -ForegroundColor Cyan
Write-Host "Zaraz powinny otworzyć się nowe okna konsoli." -ForegroundColor Cyan
Start-Sleep -Seconds 3
