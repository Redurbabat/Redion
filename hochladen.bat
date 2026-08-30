@echo off
chcp 65001 >nul
REM ===========================================================================
REM  hochladen.bat  —  LAPTOP  ==^>  GITHUB
REM ---------------------------------------------------------------------------
REM  Bringt, was du in diesem Ordner geaendert hast, zu GitHub. Die andere
REM  Richtung als  holen.bat , und die beiden fassen sich nie gegenseitig an.
REM
REM  DIE EINE REGEL, DIE HIER ZAEHLT: es ueberschreibt nie fremde Arbeit.
REM  Steht auf GitHub etwas Neueres, als du hast, bricht dieses Skript ab und
REM  sagt dir, dass zuerst  holen.bat  dran ist. Kein force, nie — ein
REM  erzwungener Push wirft die Arbeit von jemand anderem weg, und das ist
REM  nicht rueckgaengig zu machen.
REM
REM  KEIN  setlocal EnableDelayedExpansion : damit verschwindet jedes
REM  Ausrufezeichen aus den Meldungen, und die Warnzeilen heissen  [!] .
REM
REM  Doppelklick genuegt. Das Fenster bleibt am Ende offen.
REM ===========================================================================
cd /d "%~dp0"

echo.
echo   ============================================================
echo    Redion hochladen    dieser Ordner  ==^>  GitHub
echo   ============================================================
echo.

REM --- Gibt es git? ----------------------------------------------------------
where git >nul 2>nul
if errorlevel 1 (
  echo   [X] Git ist nicht installiert, oder Windows findet es nicht.
  echo       Holen von  https://git-scm.com/download/win
  goto ende
)

if not exist ".git" (
  echo   [X] Hier liegt kein Git-Verzeichnis.
  echo       Diese Datei gehoert in den Ordner, in dem auch  index.html  liegt.
  echo       Gerade steht sie in:  %CD%
  goto ende
)

echo   Ordner:  %CD%
echo.

REM --- Gibt es ueberhaupt etwas hochzuladen? ---------------------------------
set "SCHMUTZ="
for /f "delims=" %%d in ('git status --porcelain 2^>nul') do set "SCHMUTZ=1"

set "VORNE=0"
git fetch origin main >nul 2>nul
for /f "delims=" %%c in ('git rev-list --count origin/main..HEAD 2^>nul') do set "VORNE=%%c"

if not defined SCHMUTZ if "%VORNE%"=="0" (
  echo   [OK] Es gibt nichts hochzuladen — GitHub hat schon alles.
  goto ende
)

REM --- Steht drueben etwas Neueres? ------------------------------------------
REM  Diese Frage kommt VOR dem Committen. Wer erst committet und dann merkt,
REM  dass er hinterher ist, steht mit einem Commit da, den er nicht wollte.
set "HINTEN=0"
for /f "delims=" %%c in ('git rev-list --count HEAD..origin/main 2^>nul') do set "HINTEN=%%c"

if not "%HINTEN%"=="0" (
  echo   [!] Auf GitHub stehen %HINTEN% Aenderung^(en^), die du noch nicht hast.
  echo.
  echo       Es wurde NICHTS hochgeladen und NICHTS veraendert.
  echo.
  echo       Zuerst  holen.bat  starten. Danach hier noch einmal.
  echo       So kann nichts von dem verlorengehen, was drueben liegt.
  goto ende
)

REM --- Was geht mit? ---------------------------------------------------------
REM  ACHTUNG, DER GRUND FUER DIE SPRUNGMARKEN STATT EINES KLAMMERBLOCKS:
REM  cmd.exe ersetzt %MELDUNG% schon beim EINLESEN des ganzen Blocks — also
REM  bevor  set /p  ueberhaupt gefragt hat. In einem  if ( ... )  waere die
REM  getippte Beschreibung immer leer gewesen, und jeder Commit haette den
REM  Ersatztext getragen. Ausserhalb eines Blocks stimmt die Reihenfolge.
REM  (Der uebliche Ausweg  EnableDelayedExpansion  geht hier nicht: der
REM  frisst jedes Ausrufezeichen aus den Meldungen.)
if not defined SCHMUTZ goto nurschieben

echo   Das wird hochgeladen:
echo.
git status --short
echo.

REM  Eine Beschreibung, damit man spaeter noch weiss, was das war.
set "MELDUNG="
set /p "MELDUNG=  Was hast du geaendert? (Enter = ohne Beschreibung): "

git add -A
if errorlevel 1 (
  echo.
  echo   [X] Das Vormerken ging nicht. Es wurde nichts hochgeladen.
  goto ende
)

if "%MELDUNG%"=="" goto standardtext
git commit -m "%MELDUNG%"
goto nachcommit

:standardtext
git commit -m "Aenderungen von Redurs Rechner"

:nachcommit
if errorlevel 1 (
  echo.
  echo   [X] Das Festhalten ging nicht. Es wurde nichts hochgeladen.
  echo       Meistens fehlt dann nur Name und Mail. Einmalig setzen:
  echo         git config --global user.name  "Redur Babat"
  echo         git config --global user.email "redurbabat7@gmail.com"
  goto ende
)
echo.

:nurschieben

REM --- Hochladen -------------------------------------------------------------
echo   Lade zu GitHub ...
git push origin HEAD:main
if errorlevel 1 (
  echo.
  echo   [X] Das Hochladen ging nicht.
  echo.
  echo       Zwei haeufige Gruende:
  echo         1. Kein Netz, oder die Anmeldung fehlt. Beim ersten Mal
  echo            fragt Windows nach deinem GitHub-Konto. Kommt die Frage
  echo            nicht: GitHub Desktop, dann File ^> Options ^> Accounts.
  echo         2. Drueben ist inzwischen doch etwas dazugekommen.
  echo            Dann:  holen.bat  starten und hier noch einmal.
  echo.
  echo       Deine Arbeit ist festgehalten und liegt sicher in diesem
  echo       Ordner — es fehlt nur der Weg nach GitHub.
  goto ende
)

echo.
echo   [OK] Fertig. GitHub hat jetzt deinen Stand.
echo.
git log --oneline --max-count=3
echo.

:ende
echo.
pause
