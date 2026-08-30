@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
REM ===========================================================================
REM  holen.bat - den neuesten Stand von GitHub in diesen Ordner holen
REM ---------------------------------------------------------------------------
REM  Das Gegenstueck zu auto-hochladen.bat. Die Anleitung sagte bisher, wie
REM  man Aenderungen HOCHlaedt, aber nirgends, wie man sie wieder HERUNTER-
REM  bekommt - und seit Claude an einem anderen Rechner arbeitet und nach
REM  GitHub schiebt, ist genau das der Weg, der zaehlt.
REM
REM  DIE WICHTIGSTE REGEL DIESES SKRIPTS: es wirft NIE etwas weg.
REM  Wenn hier eigene, noch nicht gesicherte Aenderungen liegen, bricht es ab
REM  und sagt, welche. Lieber ein Abbruch mit Erklaerung als ein stiller
REM  Verlust - das ist dieselbe Regel, unter der die ganze App gebaut ist.
REM
REM  Doppelklick genuegt. Das Fenster bleibt am Ende offen.
REM ===========================================================================
cd /d "%~dp0"

echo.
echo   ============================================================
echo    Redion - Stand von GitHub holen
echo   ============================================================
echo.

REM --- 1. Gibt es git ueberhaupt? -------------------------------------------
where git >nul 2>nul
if errorlevel 1 (
  echo   [X] Git ist nicht installiert - oder Windows findet es nicht.
  echo.
  echo       Hol es von  https://git-scm.com/download/win
  echo       Danach dieses Fenster schliessen und neu starten.
  echo.
  goto ende
)

REM --- 2. Ist das hier ueberhaupt das Redion-Verzeichnis? -------------------
if not exist ".git" (
  echo   [X] In diesem Ordner liegt kein Git-Verzeichnis.
  echo.
  echo       Diese Datei muss dort liegen, wo auch  index.html  liegt:
  echo       %CD%
  echo.
  goto ende
)

REM --- 3. Auf welchem Zweig sind wir? ---------------------------------------
for /f "delims=" %%z in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "ZWEIG=%%z"
if "%ZWEIG%"=="" set "ZWEIG=main"
echo   Ordner:  %CD%
echo   Zweig:   %ZWEIG%
echo.

REM --- 4. Liegt hier etwas Eigenes herum? -----------------------------------
REM  git status --porcelain gibt eine Zeile je geaenderter Datei aus und
REM  NICHTS, wenn alles sauber ist. Das ist die Frage, auf die es ankommt:
REM  ein  git pull  ueber eigene Aenderungen kann sie in einen Konflikt
REM  reissen, und wer das nicht erwartet, verliert Arbeit.
set "SCHMUTZ="
for /f "delims=" %%d in ('git status --porcelain 2^>nul') do set "SCHMUTZ=1"

if defined SCHMUTZ (
  echo   [!] In diesem Ordner liegen eigene Aenderungen:
  echo.
  git status --short
  echo.
  echo       Es wurde NICHTS geholt und NICHTS ueberschrieben.
  echo.
  echo       Drei Wege:
  echo         1. Die Aenderungen hochladen  ^(auto-hochladen.bat^),
  echo            danach dieses Skript noch einmal starten.
  echo         2. Die Aenderungen behalten, aber beiseitelegen:
  echo              git stash push -m "beiseite"
  echo            zurueckholen spaeter mit  git stash pop
  echo         3. Die Aenderungen wegwerfen - nur wenn du sie wirklich
  echo            nicht brauchst:
  echo              git checkout -- .
  echo.
  goto ende
)

REM --- 5. Holen ---------------------------------------------------------------
echo   Frage GitHub ...
git fetch origin %ZWEIG%
if errorlevel 1 (
  echo.
  echo   [X] GitHub war nicht erreichbar.
  echo.
  echo       Kein Netz? Oder die Anmeldung fehlt. Beim ersten Mal fragt
  echo       Windows nach deinem GitHub-Konto. Wenn das nicht kommt:
  echo       GitHub Desktop oeffnen  ^>  File  ^>  Options  ^>  Accounts
  echo.
  echo       Deine Notizen sind davon nicht betroffen - sie liegen im
  echo       Browser, nicht in diesem Ordner.
  echo.
  goto ende
)

REM  Wie viele Commits liegen drueben, die hier fehlen?
set "NEU=0"
for /f "delims=" %%n in ('git rev-list --count HEAD..FETCH_HEAD 2^>nul') do set "NEU=%%n"

if "%NEU%"=="0" (
  echo.
  echo   [OK] Dieser Ordner ist schon auf dem neuesten Stand.
  echo.
  goto ende
)

echo.
echo   %NEU% neue Aenderung^(en^). Das kommt dazu:
echo.
git log --oneline HEAD..FETCH_HEAD
echo.

REM  --ff-only: nur vorspulen. Gaebe es hier eigene Commits, die drueben
REM  fehlen, wuerde ein normales  git pull  einen Zusammenfuehr-Commit
REM  bauen - und den erwartet niemand, der nur "aktualisieren" wollte.
git merge --ff-only FETCH_HEAD
if errorlevel 1 (
  echo.
  echo   [!] Vorspulen ging nicht: hier liegen eigene Commits, die auf
  echo       GitHub fehlen. Es wurde NICHTS veraendert.
  echo.
  echo       Zuerst hochladen  ^(auto-hochladen.bat^), dann noch einmal
  echo       hier starten.
  echo.
  goto ende
)

echo.
echo   [OK] Fertig. Der Ordner hat jetzt den Stand von GitHub.
echo.
echo   ------------------------------------------------------------
echo    Damit der Browser es auch sieht:
echo      Redion einmal ganz schliessen ^(alle Tabs^) und neu oeffnen.
echo      Sonst haelt der Offline-Speicher noch die alte Fassung fest.
echo      Notfalls im Browser  Strg + F5.
echo.
echo    Deine Notizen bleiben dabei, wo sie sind: im Browser.
echo    Dieser Ordner enthaelt das Programm, nicht deine Daten.
echo   ------------------------------------------------------------
echo.

:ende
echo.
pause
endlocal
