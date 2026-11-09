@echo off
setlocal
cd /d "%~dp0"
title Redion Windows Live
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte Node.js 22.18 oder neuer installieren.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm fehlt. Bitte Node.js mit npm installieren.
  pause
  exit /b 1
)
REM Der Live-Bau nutzt .mts-Dateien mit Node-Type-Stripping (>=22.18).
REM Ohne diese Schranke waere beim Start ein schwer lesbarer Syntaxfehler
REM statt einer klaren Versionsmeldung zu sehen.
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major>22||(major===22&&minor>=18)?0:1)"
if errorlevel 1 (
  echo [FEHLER] Node.js ist zu alt. Redion-Live braucht mindestens 22.18.
  node --version
  pause
  exit /b 1
)
if not exist "node_modules\typescript\bin\tsc" (
  echo [Redion-Live] Projekt-Abhaengigkeiten einmalig installieren...
  call npm ci
  if errorlevel 1 goto fehlgeschlagen
)
if not exist "windows\node_modules\electron\dist\electron.exe" (
  echo [Redion-Live] Windows-App-Abhaengigkeiten einmalig installieren...
  call npm install --prefix windows --no-package-lock --no-audit --no-fund
  if errorlevel 1 goto fehlgeschlagen
)
echo [Redion-Live] Die App uebernimmt Aenderungen im Redion-Ordner automatisch.
call npm --prefix windows start
if errorlevel 1 goto fehlgeschlagen
exit /b 0

:fehlgeschlagen
echo.
echo Redion-Live konnte nicht starten. Fehlermeldung oben beachten.
pause
exit /b 1
