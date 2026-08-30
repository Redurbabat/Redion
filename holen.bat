@echo off
chcp 65001 >nul
REM ===========================================================================
REM  holen.bat  —  GITHUB  ==^>  LAPTOP
REM ---------------------------------------------------------------------------
REM  Holt den Stand von GitHub in diesen Ordner. Eine Richtung, immer dieselbe:
REM  GitHub ist die Wahrheit, dieser Ordner wird gleichgemacht.
REM
REM  Dieses Skript laedt NICHTS hoch. Kein push, nie. Wer hochladen will,
REM  nimmt  hochladen.bat  daneben.
REM
REM  UND ES WIRFT NICHTS WEG. Liegt hier eigene Arbeit — geaenderte Dateien
REM  oder eigene Commits —, wird sie VORHER beiseitegelegt und benannt,
REM  bevor irgendetwas ueberschrieben wird. Am Ende steht, wo sie liegt und
REM  wie man sie zurueckholt.
REM
REM  KEIN  setlocal EnableDelayedExpansion  hier: damit verschwindet jedes
REM  Ausrufezeichen aus den Meldungen, und die Warnzeilen unten heissen
REM  genau deshalb  [!] .
REM
REM  Doppelklick genuegt. Das Fenster bleibt am Ende offen.
REM ===========================================================================
cd /d "%~dp0"

echo.
echo   ============================================================
echo    Redion holen        GitHub  ==^>  dieser Ordner
echo   ============================================================
echo.

REM --- Gibt es git? ----------------------------------------------------------
where git >nul 2>nul
if errorlevel 1 (
  echo   [X] Git ist nicht installiert, oder Windows findet es nicht.
  echo.
  echo       Holen von  https://git-scm.com/download/win
  echo       Danach dieses Fenster schliessen und neu starten.
  goto ende
)

REM --- Ist das der richtige Ordner? ------------------------------------------
if not exist ".git" (
  echo   [X] Hier liegt kein Git-Verzeichnis.
  echo.
  echo       Diese Datei gehoert in den Ordner, in dem auch  index.html  liegt.
  echo       Gerade steht sie in:
  echo       %CD%
  echo.
  echo       Wenn du den Ordner ueberhaupt noch nicht hast, brauchst du
  echo       einmalig einen frischen Klon:
  echo         git clone https://github.com/Redurbabat/Redion.git
  goto ende
)

echo   Ordner:  %CD%
echo.

REM --- Zeitstempel fuer die Rettungsnamen ------------------------------------
REM  Ueber PowerShell, weil %DATE% und %TIME% je nach Windows-Sprache anders
REM  aussehen — ein Name, der mal "30.08.2026" und mal "08/30/2026" enthaelt,
REM  ist als Zweigname unbrauchbar.
set "STEMPEL="
for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm'" 2^>nul`) do set "STEMPEL=%%s"
if "%STEMPEL%"=="" set "STEMPEL=%RANDOM%"

REM --- Von GitHub holen ------------------------------------------------------
echo   Frage GitHub ...
git fetch origin main
if errorlevel 1 (
  echo.
  echo   [X] GitHub war nicht erreichbar.
  echo.
  echo       Kein Netz? Oder die Anmeldung fehlt. Beim ersten Mal fragt
  echo       Windows nach deinem GitHub-Konto. Kommt die Frage nicht:
  echo       GitHub Desktop oeffnen, dann File ^> Options ^> Accounts.
  echo.
  echo       Deine Notizen sind davon nicht betroffen — sie liegen im
  echo       Browser, nicht in diesem Ordner.
  goto ende
)

REM  Steht drueben ueberhaupt etwas?
git rev-parse --verify --quiet origin/main >nul
if errorlevel 1 (
  echo.
  echo   [X] Auf GitHub gibt es keinen Zweig  main .
  echo       Das sollte nicht sein — bitte melden.
  goto ende
)

REM --- Ist hier schon alles gleich? ------------------------------------------
set "GLEICH="
git diff --quiet HEAD origin/main 2>nul && set "GLEICH=1"
set "SCHMUTZ="
for /f "delims=" %%d in ('git status --porcelain 2^>nul') do set "SCHMUTZ=1"

if defined GLEICH if not defined SCHMUTZ (
  echo.
  echo   [OK] Dieser Ordner ist schon genau auf dem Stand von GitHub.
  goto ende
)

REM --- Was kommt dazu? -------------------------------------------------------
echo.
echo   Das kommt von GitHub dazu:
echo.
git log --oneline --max-count=20 HEAD..origin/main
echo.

REM --- ZUERST RETTEN, DANN ERST ANFASSEN -------------------------------------
REM  Eigene Commits, die drueben fehlen: sie bekommen einen eigenen Zweig.
REM  Ein Zweig ist dauerhaft — ein geretteter Commit ohne Zweig waere nach
REM  ein paar Wochen von der Muellabfuhr geholt.
set "GERETTET="
set "EIGENE=0"
for /f "delims=" %%c in ('git rev-list --count origin/main..HEAD 2^>nul') do set "EIGENE=%%c"

if not "%EIGENE%"=="0" (
  echo   [!] Hier liegen %EIGENE% eigene Commit^(s^), die auf GitHub fehlen.
  echo       Sie werden vorher auf einem Zweig gesichert.
  git branch "sicherung/vor-holen-%STEMPEL%"
  if errorlevel 1 (
    echo.
    echo   [X] Das Sichern ging nicht. Es wurde NICHTS veraendert.
    goto ende
  )
  set "GERETTET=1"
  echo       Gesichert als:  sicherung/vor-holen-%STEMPEL%
  echo.
)

REM  Geaenderte und neue Dateien: in die Ablage legen (mit -u auch die neuen).
if defined SCHMUTZ (
  echo   [!] Hier liegen eigene Aenderungen an Dateien:
  echo.
  git status --short
  echo.
  echo       Sie werden vorher beiseitegelegt.
  git stash push -u -m "vor-holen-%STEMPEL%"
  if errorlevel 1 (
    echo.
    echo   [X] Das Beiseitelegen ging nicht. Es wurde NICHTS veraendert.
    goto ende
  )
  set "GERETTET=1"
  echo.
)

REM --- Jetzt gleichmachen ----------------------------------------------------
REM  checkout -B main origin/main  heisst: main gibt es ab jetzt und es zeigt
REM  genau dorthin, wohin GitHub zeigt. Das gilt auch, wenn gerade ein
REM  anderer Zweig offen war.
echo   Gleichmachen mit GitHub ...
git checkout -B main origin/main
if errorlevel 1 (
  echo.
  echo   [X] Das ging nicht. Nichts ging dabei verloren:
  if defined GERETTET echo       das Gerettete liegt, wo es oben steht.
  goto ende
)

echo.
echo   [OK] Fertig. Der Ordner hat jetzt genau den Stand von GitHub.
echo.

if defined GERETTET (
  echo   ------------------------------------------------------------
  echo    Was vorher hier lag, ist nicht weg:
  if not "%EIGENE%"=="0" (
    echo      Eigene Commits:   git log sicherung/vor-holen-%STEMPEL%
    echo      Zurueckholen:     git cherry-pick ^<kennung^>
  )
  if defined SCHMUTZ (
    echo      Eigene Dateien:   git stash list
    echo      Ansehen:          git stash show -p stash@{0}
    echo      Zurueckholen:     git stash pop
  )
  echo    Nichts davon musst du jetzt tun. Es liegt einfach da.
  echo   ------------------------------------------------------------
  echo.
)

echo   ------------------------------------------------------------
echo    Damit der Browser es auch sieht:
echo      Redion einmal GANZ schliessen ^(alle Tabs^) und neu oeffnen.
echo      Sonst haelt der Offline-Speicher die alte Fassung fest.
echo      Notfalls im Browser  Strg + F5.
echo.
echo    Deine Notizen bleiben, wo sie sind: im Browser.
echo    Dieser Ordner enthaelt das Programm, nicht deine Daten.
echo   ------------------------------------------------------------

:ende
echo.
pause
