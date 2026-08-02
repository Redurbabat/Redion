@echo off
chcp 65001 >nul
REM ===========================================================================
REM  Notizen starten
REM ---------------------------------------------------------------------------
REM  Die App laeuft auch per Doppelklick auf  public\index.html.
REM  Fuer die Anmeldung bei Google und fuer das Installieren als App braucht
REM  es aber eine echte Adresse - die liefert dieses Skript:
REM      http://localhost:8080
REM ===========================================================================
cd /d "%~dp0public"
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
