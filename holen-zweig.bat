@echo off
chcp 65001 >nul
REM ===========================================================================
REM  holen-zweig.bat  -  DEN ARBEITSSTAND VON GITHUB HOLEN
REM ---------------------------------------------------------------------------
REM  WOFUER ES DAS GIBT (E517).
REM
REM   main  bewegt sich erst, wenn ein voller Lauf gruen ist (Paragraph 46).
REM  Solange an etwas gearbeitet wird, liegt das Neue also auf einem ZWEIG,
REM  und  holen.bat  - das immer  main  holt - bringt es nicht her. Auf dem
REM  Laptop stand deshalb der letzte GEPRUEFTE Stand, und das Neue war nicht
REM  zu sehen. Das war kein Fehler, aber es sah aus wie einer.
REM
REM  Diese Datei fragt nach dem Zweig und reicht ihn an  holen.bat  weiter.
REM  SIE ENTHAELT KEINE EIGENE LOGIK: alles, was rettet, sichert und warnt,
REM  steht in  holen.bat  und nur dort (Paragraph 8 - kein zweiter Katalog).
REM  Waere es hier noch einmal, liefen die beiden nach dem dritten Durchgang
REM  auseinander, und niemand wuesste, welche Datei gilt.
REM
REM  Vorgeschlagen wird der Zweig, auf dem dieser Ordner GERADE steht. Wer
REM  schon einmal geholt hat, drueckt also nur Enter.
REM
REM  Doppelklick genuegt.
REM ===========================================================================
cd /d "%~dp0"

echo.
echo   ============================================================
echo    Redion holen - ein ARBEITSZWEIG statt  main
echo   ============================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo   [X] Git ist nicht installiert, oder Windows findet es nicht.
  echo       Kostenlos hier holen:  https://git-scm.com/download/win
  echo.
  pause
  goto :eof
)
if not exist ".git" (
  echo   [X] Dieser Ordner gehoert nicht zu Redion.
  echo       Diese Datei gehoert dorthin, wo auch  index.html  liegt.
  echo.
  pause
  goto :eof
)

REM --- Der Zweig, auf dem wir gerade stehen, ist der Vorschlag ---------------
set "VORGABE="
for /f "delims=" %%z in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "VORGABE=%%z"
if "%VORGABE%"=="" set "VORGABE=main"
if "%VORGABE%"=="HEAD" set "VORGABE=main"

echo   Welchen Zweig willst du holen?
echo.
echo   Enter nimmt den Vorschlag. Den Namen sagt dir Claude nach jeder
echo   Aenderung; du kannst ihn auch aus der Adresszeile von GitHub
echo   kopieren ^(der Teil hinter  /tree/ ^).
echo.
set "ZIEL="
set /p "ZIEL=  Zweig [%VORGABE%]: "
if "%ZIEL%"=="" set "ZIEL=%VORGABE%"

echo.
call "%~dp0holen.bat" "%ZIEL%"
