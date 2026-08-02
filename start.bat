@echo off
REM ===========================================================================
REM  Notizen lokal starten
REM ---------------------------------------------------------------------------
REM  Die App laeuft auch per Doppelklick auf index.html. Fuer die Anmeldung bei
REM  Google braucht es aber eine echte Adresse - dieses Skript liefert sie:
REM  http://localhost:8080
REM ===========================================================================
cd /d "%~dp0"
echo.
echo   Notizen laeuft gleich unter  http://localhost:8080
echo   Zum Beenden dieses Fenster schliessen.
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  py -m http.server 8080
  goto ende
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  python -m http.server 8080
  goto ende
)
where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  npx --yes serve -l 8080 .
  goto ende
)
echo   Es wurde weder Python noch Node gefunden.
echo   Python gibt es kostenlos unter python.org
pause
:ende
