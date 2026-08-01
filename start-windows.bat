@echo off
chcp 65001 >nul
cd /d "%~dp0"
title REDNOTEN
echo ============================================================
echo    REDNOTEN wird gestartet ...
echo    Der Browser oeffnet sich gleich automatisch.
echo    Adresse:  http://localhost:8000/index.html
echo.
echo    Dieses Fenster offen lassen, solange du REDNOTEN nutzt.
echo    Zum Beenden dieses Fenster schliessen.
echo ============================================================
echo.

rem Browser 2 Sekunden nach dem Serverstart oeffnen (eigener Prozess)
start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000/index.html"

rem Lokalen Webserver starten (Python 3, dann Fallback py-Launcher)
python -m http.server 8000 2>nul || py -m http.server 8000 2>nul || (
  echo.
  echo Python wurde nicht gefunden.
  echo Entweder Python von https://python.org installieren
  echo ODER die Datei index.html direkt per Doppelklick im Browser oeffnen.
  echo.
  pause
)
