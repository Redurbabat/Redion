@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Redion PR #207 - Aktuellen Zweig holen und live starten

echo.
echo ==============================================================
echo   REDION PR #207 - AKTUELLEN STAND LIVE ANSEHEN
echo ==============================================================
echo   Das Programm wird aus diesem Projektordner gestartet.
echo   Keine Aenderungen werden auf GitHub gepusht oder gemergt.
echo.
echo   Der PR ist noch ungetestet. Wenn holen.bat bei ROT fragt,
echo   mit J bestaetigen, um den Arbeitszweig bewusst zu holen.
echo.

set "ZIEL=ux/windows-schaltplan-dock-20261108"
if not exist "package.json" (
  echo [FEHLER] Nicht der Redion-Projektordner.
  goto fehlgeschlagen
)
if not exist ".git" (
  echo [FEHLER] Dies ist kein Git-Checkout.
  goto fehlgeschlagen
)
if not exist "holen.bat" (
  echo [FEHLER] holen.bat fehlt.
  goto fehlgeschlagen
)
if not exist "Redion-Live.bat" (
  echo [FEHLER] Redion-Live.bat fehlt.
  goto fehlgeschlagen
)
where git >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] Git ist nicht installiert oder nicht im PATH.
  goto fehlgeschlagen
)

REM Verwende den EINEN vorhandenen sicheren Hol-Ablauf. Er sichert
REM lokale Aenderungen und warnt vor rotem CI. Kein eigenes git reset,
REM checkout, stash oder merge in dieser Datei.
call "%~dp0holen.bat" "%ZIEL%"

REM holen.bat darf bei Warnungen oder Fehlern ohne Fehlercode enden.
REM Deshalb nach der Rueckkehr die BRANCH- UND REMOTE-SHA pruefen.
REM Eine alte lokale Version darf nie als der neue PR-Stand erscheinen.
set "LOKALZWEIG="
set "LOKALSHA="
set "REMOTESHA="
for /f "delims=" %%z in ('git branch --show-current 2^>nul') do set "LOKALZWEIG=%%z"
if /I not "%LOKALZWEIG%"=="%ZIEL%" (
  echo.
  echo [FEHLER] Der Ordner steht noch auf Zweig: %LOKALZWEIG%
  echo         Erwartet: %ZIEL%
  echo         Die App wird NICHT mit dem falschen Zweig gestartet.
  goto fehlgeschlagen
)
for /f "delims=" %%z in ('git rev-parse HEAD 2^>nul') do set "LOKALSHA=%%z"

REM Fragt den GitHub-Stand frisch ab. Ohne Netz oder Zugriffsrecht NICHT
REM behaupten, dass der lokale Stand aktuell ist.
for /f "tokens=1" %%z in ('git ls-remote --heads origin "refs/heads/%ZIEL%" 2^>nul') do set "REMOTESHA=%%z"
if not defined REMOTESHA (
  echo.
  echo [FEHLER] Der aktuelle Commit auf GitHub kann nicht gelesen werden.
  echo         Netzwerk/GitHub-Zugriff pruefen. Kein Start einer alten App.
  goto fehlgeschlagen
)
if /I not "%LOKALSHA%"=="%REMOTESHA%" (
  echo.
  echo [FEHLER] Lokaler Stand ist nicht der aktuelle PR-Stand.
  echo         Lokal:  %LOKALSHA%
  echo         GitHub: %REMOTESHA%
  echo         Der Live-Start wird aus Sicherheitsgruenden abgebrochen.
  goto fehlgeschlagen
)

echo.
echo [OK] Zweig und GitHub-Commit stimmen ueberein:
echo      %LOKALSHA%
echo.
echo [START] Redion-Live baut die Web- und Windows-Dateien neu.
echo         Das Live-Fenster zeigt den lokalen Entwicklungsstand,
echo         keine freigegebene App-Version.
echo.
call "%~dp0Redion-Live.bat"
if errorlevel 1 goto fehlgeschlagen
exit /b 0

:fehlgeschlagen
echo.
echo ==============================================================
echo   REDION LIVE NICHT GESTARTET - siehe Grund oben.
echo   Vorhandene Dateien wurden von diesem Starter nicht verworfen.
echo ==============================================================
echo.
pause
exit /b 1
