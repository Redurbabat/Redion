@echo off
chcp 65001 >nul
cd /d "%~dp0"
title REDNOTEN
echo ============================================================
echo    REDNOTEN wird gestartet ...
echo    Der Browser oeffnet sich gleich automatisch.
echo    Adresse:  http://localhost:8080/
echo.
echo    Der Abgleich zwischen Geraeten ist mit dabei:
echo    in der App  Strg+K  -^>  "Abgleich einrichten"
echo.
echo    Dieses Fenster offen lassen, solange du REDNOTEN nutzt.
echo    Zum Beenden dieses Fenster schliessen.
echo ============================================================
echo.

rem Bevorzugt server.py (App + Abgleich). Ohne server.py reicht der
rem einfache Dateiserver - dann gibt es nur keinen Abgleich.
if exist "%~dp0server.py" (
  python server.py --port 8080 2>nul || py server.py --port 8080 2>nul || goto keinpython
) else (
  start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8080/index.html"
  python -m http.server 8080 2>nul || py -m http.server 8080 2>nul || goto keinpython
)
goto ende

:keinpython
echo.
echo Python wurde nicht gefunden.
echo Entweder Python von https://python.org installieren
echo ODER die Datei index.html direkt per Doppelklick im Browser oeffnen.
echo.
pause

:ende
