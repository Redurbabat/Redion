@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Redion Schaltplan - Lokaler Build und Tests
echo.
echo ==============================================================
echo   Redion Schaltplan - Build und Regressionstests (Windows)
echo ==============================================================
echo.
echo Dieser Lauf prueft den lokalen Quellcode. Er merged und pusht nichts.
echo Vorher den PR-Zweig mit holen-zweig.bat lokal holen:
echo   ux/windows-schaltplan-dock-20261108
echo.

if not exist "package.json" (
  echo [FEHLER] Diese Datei muss im Redion-Projektordner liegen.
  goto fehlgeschlagen
)
where git >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] Git fehlt. Bitte Git fuer Windows installieren.
  goto fehlgeschlagen
)
set "ZWEIG="
for /f "delims=" %%z in ('git branch --show-current 2^>nul') do set "ZWEIG=%%z"
if /I not "%ZWEIG%"=="ux/windows-schaltplan-dock-20261108" (
  echo [FEHLER] Falscher Zweig: %ZWEIG%
  echo Erst holen-zweig.bat starten und den PR-Zweig waehlen.
  goto fehlgeschlagen
)
where node >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] Node.js fehlt. Erforderlich: mindestens 22.18.
  goto fehlgeschlagen
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] npm fehlt.
  goto fehlgeschlagen
)
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major>22||(major===22&&minor>=18)?0:1)"
if errorlevel 1 (
  echo [FEHLER] Die Node-Version ist zu alt. Erforderlich: 22.18 oder neuer.
  node --version
  goto fehlgeschlagen
)

node windows\schaltplan-protokoll.mjs --start
if errorlevel 1 goto fehlgeschlagen
set "PROTOKOLL_BEGONNEN=1"

echo.
echo [Vorbereitung] Pruefprotokollierung und PR-Live-Starter testen ...
node windows\schaltplan-protokoll.mjs -- node --test windows\schaltplan-protokoll.test.mjs windows\pr207-launcher.test.mjs
if errorlevel 1 goto fehlgeschlagen

set "PAKETE_FEHLEN="
if not exist "node_modules\typescript\bin\tsc" set "PAKETE_FEHLEN=1"
if not exist "node_modules\playwright\package.json" set "PAKETE_FEHLEN=1"
if defined PAKETE_FEHLEN (
  echo.
  echo [Vorbereitung] Redion-Abhaengigkeiten installieren ...
  node windows\schaltplan-protokoll.mjs -- npm ci --no-audit --no-fund
  if errorlevel 1 goto fehlgeschlagen
)

echo.
echo [1/9] Vollstaendiger TypeScript-Typecheck ...
node windows\schaltplan-protokoll.mjs -- npm run typecheck
if errorlevel 1 goto fehlgeschlagen

echo.
echo [2/9] Web/TypeScript-Dateien aus den Quellen bauen ...
node windows\schaltplan-protokoll.mjs -- npm run bauen:ts
if errorlevel 1 goto fehlgeschlagen

echo.
echo [3/9] Redion-Einzeldatei bauen ...
node windows\schaltplan-protokoll.mjs -- npm run bauen
if errorlevel 1 goto fehlgeschlagen

echo.
echo [Vorbereitung] Chromium fuer Playwright pruefen ...
node -e "const fs=require('node:fs');const p=require('playwright').chromium.executablePath();process.exit(fs.existsSync(p)?0:1)" >nul 2>&1
if errorlevel 1 (
  echo Chromium fehlt. Browser einmalig installieren ...
  node windows\schaltplan-protokoll.mjs -- npx --no-install playwright install chromium
  if errorlevel 1 goto fehlgeschlagen
)

echo.
echo [4/9] Anschlussfang-Test (ohne Browser) ...
node windows\schaltplan-protokoll.mjs -- node pruefungen\lauf\test635.mts
if errorlevel 1 goto fehlgeschlagen

echo.
echo [5/9] Gespeicherte Vorlagen: Chromium ...
node windows\schaltplan-protokoll.mjs -- node pruefungen\lauf\test636.mts
if errorlevel 1 goto fehlgeschlagen

echo.
echo [6/9] Mobile Touch-Flaechen: Chromium ...
node windows\schaltplan-protokoll.mjs -- node pruefungen\lauf\test638.mts
if errorlevel 1 goto fehlgeschlagen

echo.
echo [7/9] Netztreue und Gestenwechsel: Chromium ...
node windows\schaltplan-protokoll.mjs -- node pruefungen\lauf\test611.mts
if errorlevel 1 goto fehlgeschlagen

echo.
echo [8/9] Zeichenflaeche, Zoom und Stift: Chromium ...
node windows\schaltplan-protokoll.mjs -- node pruefungen\lauf\test625.mts
if errorlevel 1 goto fehlgeschlagen

echo.
echo [9/9] Erzeugtes JavaScript gegen TypeScript pruefen ...
node windows\schaltplan-protokoll.mjs -- node pruefungen\lauf\test105.mts
if errorlevel 1 goto fehlgeschlagen

echo.
echo ==============================================================
echo   ERFOLG: Alle neun Schritte sind lokal bestanden.
echo   Aenderungen an generierten Dateien mit git status pruefen.
echo   Es wurde nichts auf GitHub gepusht oder gemergt.
echo   Das vollstaendige Pruefprotokoll liegt in deinem Benutzerordner.
echo ==============================================================
git status --short
echo.
node windows\schaltplan-protokoll.mjs --where
pause
exit /b 0

:fehlgeschlagen
echo.
echo ==============================================================
echo   NICHT BESTANDEN. Die Fehlermeldung oben nennt den Blocker.
echo   Keine Freigabe zum Merge auf main.
echo ==============================================================
echo.
if defined PROTOKOLL_BEGONNEN (
  echo Das vollstaendige Fehlerprotokoll liegt hier:
  node windows\schaltplan-protokoll.mjs --where
)
pause
exit /b 1
