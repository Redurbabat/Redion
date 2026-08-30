@echo off
chcp 65001 >nul
REM ===========================================================================
REM  hochladen.bat  -  LAPTOP  ==^>  GITHUB
REM ---------------------------------------------------------------------------
REM  Bringt, was du in diesem Ordner geaendert hast, zu GitHub. Die andere
REM  Richtung als  holen.bat , und die beiden fassen sich nie gegenseitig an.
REM
REM  DIE EINE REGEL: es ueberschreibt nie fremde Arbeit. Steht auf GitHub
REM  etwas Neueres, bricht es ab. Kein force, nirgends - ein erzwungener
REM  Push wirft die Arbeit anderer weg und ist nicht rueckgaengig zu machen.
REM
REM  WAS EINE PRUEFUNG AM 30. AUGUST 2026 GEMESSEN HAT (E271):
REM
REM    * Der Zaehler liess einen Push von einem FREMDEN Zweig nach main
REM      durch: der Riegel prueft nur "vorwaertsspulbar", und das ist ein
REM      Arbeitszweig sehr wohl. Jetzt wird der Zweigname geprueft.
REM    * Der fetch wurde nicht auf Erfolg geprueft. Ohne Netz rechnete das
REM      Skript gegen eine alte Kopie und behauptete "GitHub hat schon
REM      alles". Jetzt wird geprueft.
REM    * git add -A  in einer ungeloesten Zusammenfuehrung traegt die
REM      Konfliktmarken als Loesung ein - und der Push gelingt. Jetzt
REM      wird das vorher erkannt.
REM    * Ein Anfuehrungszeichen in der Beschreibung zerlegte die Zeile.
REM      Jetzt werden sie entfernt.
REM    * git status --porcelain meldet bei reinen Zeilenenden-Unterschieden
REM      Dateien, die git fuer unveraendert haelt - der Commit scheiterte,
REM      und das Skript uebersprang den Push mit falscher Begruendung.
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

where git >nul 2>nul
if errorlevel 1 (
  echo   [X] Git ist nicht installiert, oder Windows findet es nicht.
  echo       Kostenlos hier holen:  https://git-scm.com/download/win
  goto ende
)

if not exist ".git" (
  echo   [X] Dieser Ordner gehoert nicht zu Redion.
  echo       Diese Datei gehoert dorthin, wo auch  index.html  liegt.
  echo       Gerade steht sie in:  "%CD%"
  goto ende
)

echo   Ordner:  "%CD%"

REM --- Steckt hier etwas Halbfertiges? ---------------------------------------
if exist ".git\MERGE_HEAD"   goto steckengeblieben
if exist ".git\rebase-merge" goto steckengeblieben
if exist ".git\rebase-apply" goto steckengeblieben
for /f "delims=" %%u in ('git ls-files --unmerged 2^>nul') do goto steckengeblieben

REM --- Stehen wir ueberhaupt auf main? ---------------------------------------
REM  Der Riegel weiter unten prueft nur, ob der Push vorwaertsspulbar ist -
REM  und das ist ein Arbeitszweig auch. Gemessen: von  claude/...  aus waere
REM  jeder Zwischenstand dieses Zweiges auf main gelandet, und zurueckholen
REM  ginge nur mit einem erzwungenen Push, den dieses Skript zu Recht nicht
REM  kann. Also vorher fragen, auf welchem Zweig wir sind.
set "ZWEIG="
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "ZWEIG=%%b"
if not "%ZWEIG%"=="main" (
  echo.
  echo   [X] Du bist nicht auf  main , sondern auf:  %ZWEIG%
  echo.
  echo       Es wurde NICHTS hochgeladen und NICHTS veraendert.
  echo       Das ist keine Sache fuer einen Doppelklick.
  echo       Bitte sag Claude Bescheid.
  goto ende
)
echo   Zweig:   %ZWEIG%
echo.

REM --- Liegt noch Gerettetes herum? ------------------------------------------
REM  holen.bat legt eigene Arbeit auf sicherung/-Zweige und in die Ablage.
REM  Wer danach hier landet, soll nicht "es gibt nichts hochzuladen" lesen,
REM  waehrend seine Arbeit daneben liegt.
for /f "delims=" %%b in ('git branch --list "sicherung/*" 2^>nul') do echo   [!] Gerettete Arbeit liegt noch auf: %%b
for /f "delims=" %%s in ('git stash list 2^>nul')                  do echo   [!] In Gits Ablage liegt noch:      %%s

REM --- Was ist hier los? -----------------------------------------------------
REM  Nicht ueber  git status --porcelain  - siehe Kopf, Zeilenenden.
set "SCHMUTZ="
git diff --quiet 2>nul          || set "SCHMUTZ=1"
git diff --cached --quiet 2>nul || set "SCHMUTZ=1"
for /f "delims=" %%d in ('git ls-files -o --exclude-standard 2^>nul') do set "SCHMUTZ=1"

echo   Frage GitHub ...
git fetch origin main
if errorlevel 1 (
  echo.
  echo   [X] GitHub war nicht erreichbar. Es wurde NICHTS veraendert.
  echo.
  echo       Kein Netz? Oder die Anmeldung fehlt - zum HOCHLADEN wird sie
  echo       gebraucht. Beim ersten Mal oeffnet Windows dafuer ein
  echo       Browserfenster. Ein GitHub-Passwort wird dort NICHT
  echo       angenommen, nur die Anmeldung im Browser.
  goto ende
)

set "VORNE=0"
set "HINTEN=0"
for /f "delims=" %%c in ('git rev-list --count origin/main..HEAD 2^>nul') do set "VORNE=%%c"
for /f "delims=" %%c in ('git rev-list --count HEAD..origin/main 2^>nul') do set "HINTEN=%%c"

if not defined SCHMUTZ if "%VORNE%"=="0" (
  echo.
  echo   [OK] Es gibt nichts hochzuladen - GitHub hat schon alles.
  echo        Stehen oben [!]-Zeilen, liegt trotzdem noch etwas da.
  goto ende
)

REM --- Steht drueben etwas Neueres? ------------------------------------------
REM  Diese Frage kommt VOR dem Committen: wer erst committet und dann merkt,
REM  dass er hinterher ist, steht mit einem Commit da, den er nicht wollte.
if not "%HINTEN%"=="0" (
  echo.
  echo   [!] Auf GitHub steht Neueres, das du noch nicht hast ^(%HINTEN%^).
  echo.
  echo       Es wurde NICHTS hochgeladen und NICHTS veraendert.
  echo.
  echo       Starte zuerst  holen.bat . Am Ende von  holen.bat  steht,
  echo       wo deine eigene Arbeit liegt - die musst du dann zuerst
  echo       zurueckholen, sonst kommt sie hier nicht an. Wenn du dabei
  echo       unsicher bist: sag Claude Bescheid, statt zu raten.
  goto ende
)

REM --- Was geht mit? ---------------------------------------------------------
REM  ACHTUNG, DER GRUND FUER DIE SPRUNGMARKEN STATT EINES KLAMMERBLOCKS:
REM  cmd.exe ersetzt %MELDUNG% schon beim EINLESEN des ganzen Blocks - also
REM  bevor  set /p  ueberhaupt gefragt hat. In einem  if ( ... )  waere die
REM  getippte Beschreibung immer leer gewesen, und jeder Commit haette den
REM  Ersatztext getragen. Ausserhalb eines Blocks stimmt die Reihenfolge.
if not defined SCHMUTZ goto nurschieben

echo.
echo   Das wird hochgeladen ^(M = geaendert, ?? = neu^):
echo.
git --no-pager status --short
echo.

set "MELDUNG="
set /p "MELDUNG=  Was hast du geaendert? (Enter = ohne eigenen Text): "

REM  Anfuehrungszeichen raus: bei ungerader Anzahl schluckt das offene
REM  Zeichen den Rest der Zeile, und cmd meldet einen Syntaxfehler.
REM  Und reine Leerzeichen zaehlen als nichts - git lehnt sie ohnehin ab.
if defined MELDUNG set "MELDUNG=%MELDUNG:"=%"
if defined MELDUNG if "%MELDUNG: =%"=="" set "MELDUNG="

git add -A
if errorlevel 1 (
  echo.
  echo   [X] Das Vormerken ging nicht. Es wurde nichts hochgeladen.
  echo       Dein Ordner ist unveraendert. Bitte sag Claude Bescheid.
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
  echo.
  echo       Ein Grund kann sein, dass Name und Mail fehlen. Einmalig:
  echo         git config --global user.name  "Redur Babat"
  echo         git config --global user.email "redurbabat7@gmail.com"
  echo.
  echo       Stand oben "nothing to commit", dann waren es nur
  echo       Zeilenenden und es gab wirklich nichts zu tun.
  goto ende
)
echo.

:nurschieben
echo   Lade zu GitHub hoch ...
git push origin main
if errorlevel 1 (
  echo.
  echo   [X] Das Hochladen ging nicht.
  echo.
  echo       Zwei haeufige Gruende:
  echo         1. Die Anmeldung fehlt. Beim ersten Mal oeffnet Windows
  echo            dafuer ein Browserfenster. Ein GitHub-Passwort wird
  echo            dort NICHT angenommen.
  echo         2. Drueben ist inzwischen doch etwas dazugekommen.
  echo            Dann:  holen.bat  starten und hier noch einmal.
  echo.
  echo       Deine Arbeit ist festgehalten und liegt sicher in diesem
  echo       Ordner - es fehlt nur der Weg nach GitHub.
  goto ende
)

echo.
echo   [OK] Fertig. GitHub hat jetzt deinen Stand.
echo.
git --no-pager log --oneline --max-count=3
goto ende

:steckengeblieben
echo.
echo   [X] Hier ist eine Zusammenfuehrung steckengeblieben.
echo.
echo       Es wurde NICHTS hochgeladen und NICHTS veraendert.
echo       Das laesst sich nicht per Doppelklick aufloesen - und ein
echo       Hochladen wuerde die Konfliktmarken mit veroeffentlichen.
echo       Bitte sag Claude Bescheid.
goto ende

:ende
echo.
pause
