@echo off
chcp 65001 >nul
REM ===========================================================================
REM  holen.bat  -  GITHUB  ==^>  LAPTOP
REM ---------------------------------------------------------------------------
REM  Holt den Stand von GitHub in diesen Ordner. Eine Richtung, immer dieselbe.
REM  Dieses Skript laedt NICHTS hoch. Kein push, nie. Wer hochladen will,
REM  nimmt  hochladen.bat  daneben.
REM
REM  UND ES WIRFT NICHTS WEG. Liegt hier eigene Arbeit, wird sie VORHER
REM  gesichert und benannt. Der Bildschirm sagt am Ende, wo sie liegt.
REM
REM  WAS EINE PRUEFUNG AM 30. AUGUST 2026 IN ECHTEN GIT-REPOS GEMESSEN HAT,
REM  und was daraufhin hier steht (E271):
REM
REM    * Ein Commit, der nur auf dem oertlichen  main  lag, war nach
REM      checkout -B  von keiner Referenz mehr erreichbar - und der
REM      Bildschirm meldete "[OK] Fertig". Der Zaehler mass HEAD, zurueck-
REM      gesetzt wurde aber main. Jetzt werden BEIDE gemessen.
REM    * Der Vergleich "sind wir schon gleich" verglich INHALTE. Zwei
REM      verschiedene Commits mit gleichem Inhalt - der Normalfall nach
REM      einem Merge - galten als gleich, und das Skript sprang heraus,
REM      ohne den Zweig zu wechseln. Jetzt werden Kennungen verglichen.
REM    * Der Zeitstempel hat nie funktioniert: ein verirrtes Anfuehrungs-
REM      zeichen liess PowerShell scheitern, und die Rettungszweige hiessen
REM      "vor-holen-24187". Behoben.
REM    * git status --porcelain meldet bei reinen Zeilenenden-Unterschieden
REM      Dateien, die git selbst fuer unveraendert haelt (der 309-Dateien-
REM      Vorfall aus .gitattributes). Jetzt wird anders gemessen.
REM    * stash pop schreibt bei Kollision Konfliktmarken IN die Dateien und
REM      kann Redion unstartbar machen. Der Rat lautet jetzt  apply .
REM
REM  KEIN  setlocal EnableDelayedExpansion : damit verschwindet jedes
REM  Ausrufezeichen aus den Meldungen, und die Warnzeilen heissen  [!] .
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
  echo       Kostenlos hier holen:  https://git-scm.com/download/win
  echo       Danach  holen.bat  noch einmal doppelklicken.
  goto ende
)

REM --- Ist das der richtige Ordner? ------------------------------------------
if not exist ".git" (
  echo   [X] Dieser Ordner gehoert nicht zu Redion.
  echo.
  echo       Diese Datei gehoert dorthin, wo auch  index.html  liegt.
  echo       Gerade steht sie in:
  echo       "%CD%"
  echo.
  echo       Hast du den Ordner ueberhaupt noch nicht, dann einmalig:
  echo         git clone https://github.com/Redurbabat/Redion.git Redion-src
  goto ende
)

echo   Ordner:  "%CD%"
echo.

REM --- Steckt hier etwas Halbfertiges? ---------------------------------------
REM  Eine steckengebliebene Zusammenfuehrung war eine dauerhafte Sackgasse:
REM  stash scheiterte, das Skript brach ab, und jeder weitere Doppelklick tat
REM  dasselbe. Jetzt wird es VOR allem anderen erkannt und benannt.
if exist ".git\MERGE_HEAD"   goto steckengeblieben
if exist ".git\rebase-merge" goto steckengeblieben
if exist ".git\rebase-apply" goto steckengeblieben

REM --- Zeitstempel fuer die Rettungsnamen ------------------------------------
REM  Ueber PowerShell, weil %DATE% und %TIME% je nach Windows-Sprache anders
REM  aussehen. Mit Sekunden, damit zwei Laeufe in derselben Minute nicht auf
REM  denselben Namen fallen - bei Namensgleichheit bricht git ab.
set "STEMPEL="
for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss" 2^>nul`) do set "STEMPEL=%%s"
if "%STEMPEL%"=="" set "STEMPEL=%RANDOM%%RANDOM%"

REM --- Von GitHub holen ------------------------------------------------------
echo   Frage GitHub ...
git fetch origin main
if errorlevel 1 (
  echo.
  echo   [X] GitHub war nicht erreichbar.
  echo.
  echo       Das Verzeichnis ist oeffentlich lesbar - zum HOLEN braucht es
  echo       also keine Anmeldung. Bleibt nur: keine Netzverbindung.
  echo       Spaeter noch einmal versuchen.
  echo.
  echo       Dein Ordner ist unveraendert, und deine Notizen sind nicht
  echo       betroffen - die liegen im Browser.
  goto ende
)

git rev-parse --verify --quiet origin/main >nul
if errorlevel 1 (
  echo.
  echo   [X] Auf GitHub gibt es keinen Zweig  main .
  echo       Dein Ordner ist unveraendert. Bitte sag Claude Bescheid.
  goto ende
)

REM --- Sind wir schon gleich? ------------------------------------------------
REM  KENNUNGEN vergleichen, nicht Inhalte. Zwei verschiedene Commits mit
REM  gleichem Inhalt sind NICHT dasselbe: wer nach einem Merge auf einem
REM  anderen Zweig steht, muss trotzdem umziehen.
set "HIER="
set "DORT="
for /f "delims=" %%a in ('git rev-parse HEAD 2^>nul')        do set "HIER=%%a"
for /f "delims=" %%b in ('git rev-parse origin/main 2^>nul') do set "DORT=%%b"

REM  Und der Zweigname muss auch stimmen, sonst bleibt er auf einem fremden
REM  Zweig sitzen und glaubt, er sei auf main.
set "ZWEIG="
for /f "delims=" %%z in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "ZWEIG=%%z"

REM --- Liegt hier eigene Arbeit? ---------------------------------------------
REM  NICHT ueber  git status --porcelain : das meldet bei reinen Zeilenenden-
REM  Unterschieden Dateien, die git selbst fuer unveraendert haelt. Genau der
REM  Vorfall, den .gitattributes beschreibt - 309 Dateien, kein Zeichen
REM  Inhalt. Diese drei Fragen antworten auch dann richtig.
set "SCHMUTZ="
git diff --quiet 2>nul        || set "SCHMUTZ=1"
git diff --cached --quiet 2>nul || set "SCHMUTZ=1"
for /f "delims=" %%d in ('git ls-files -o --exclude-standard 2^>nul') do set "SCHMUTZ=1"

if "%HIER%"=="%DORT%" if "%ZWEIG%"=="main" if not defined SCHMUTZ (
  echo   [OK] Dieser Ordner ist schon genau auf dem Stand von GitHub.
  goto ende
)

REM --- Was kommt dazu? -------------------------------------------------------
echo.
echo   Das kommt von GitHub dazu ^(hoechstens die letzten 20 gezeigt^):
echo.
git --no-pager log --oneline --max-count=20 HEAD..origin/main
echo.

REM --- ZUERST RETTEN, DANN ERST ANFASSEN -------------------------------------
set "GERETTET="

REM  Eigene Commits auf dem GEOEFFNETEN Zweig.
set "EIGENE=0"
for /f "delims=" %%c in ('git rev-list --count origin/main..HEAD 2^>nul') do set "EIGENE=%%c"
if not "%EIGENE%"=="0" (
  echo   [!] Auf dem geoeffneten Zweig liegen %EIGENE% eigene Aenderungen,
  echo       die auf GitHub fehlen. Sie werden vorher gesichert.
  git branch "sicherung/vor-holen-%STEMPEL%"
  if errorlevel 1 goto sicherngeht_nicht
  set "GERETTET=1"
  echo       Gesichert als:  sicherung/vor-holen-%STEMPEL%
  echo.
)

REM  UND DER OERTLICHE main SELBST. Gemessen: stand HEAD auf einem anderen
REM  Zweig, waehrend main eigene Commits trug, war nach checkout -B davon
REM  nichts mehr erreichbar - und der Bildschirm meldete Erfolg.
set "MAINEIGEN=0"
for /f "delims=" %%c in ('git rev-list --count origin/main..main 2^>nul') do set "MAINEIGEN=%%c"
if not "%MAINEIGEN%"=="0" (
  echo   [!] Auch der Zweig  main  hier traegt %MAINEIGEN% eigene Aenderungen.
  git branch "sicherung/vor-holen-%STEMPEL%-main" main
  if errorlevel 1 goto sicherngeht_nicht
  set "GERETTET=1"
  echo       Gesichert als:  sicherung/vor-holen-%STEMPEL%-main
  echo.
)

REM  Geaenderte und neue Dateien.
if defined SCHMUTZ (
  echo   [!] Hier liegen eigene Aenderungen an Dateien:
  echo       ^(M = geaendert, ?? = neu^)
  echo.
  git --no-pager status --short
  echo.
  echo       Sie werden vorher beiseitegelegt.
  git stash push -u -m "vor-holen-%STEMPEL%"
  if errorlevel 1 (
    echo.
    echo   [X] Das Beiseitelegen ging nicht. Es wurde NICHTS veraendert.
    echo       Dein Ordner ist unveraendert. Bitte sag Claude Bescheid -
    echo       bis dahin arbeite normal weiter, deine Notizen im Browser
    echo       sind nicht betroffen.
    goto ende
  )
  set "GERETTET=1"
  echo.
)

REM --- Jetzt auf den Stand von GitHub bringen --------------------------------
echo   Bringe den Ordner auf den Stand von GitHub ...
git checkout -B main origin/main
if errorlevel 1 (
  echo.
  echo   [X] Das ging nicht. Nichts ist dabei verlorengegangen -
  echo       das Gerettete liegt, wo es oben steht.
  echo       Bitte sag Claude Bescheid.
  goto ende
)

echo.
echo   [OK] Fertig. Der Ordner hat jetzt genau den Stand von GitHub.
echo.

if defined GERETTET (
  echo   ------------------------------------------------------------
  echo    Was vorher hier lag, ist nicht weg. Es liegt hier:
  echo.
  if not "%EIGENE%"=="0"    echo      sicherung/vor-holen-%STEMPEL%
  if not "%MAINEIGEN%"=="0" echo      sicherung/vor-holen-%STEMPEL%-main
  if defined SCHMUTZ (
    echo      und in Gits Ablage. Ansehen:
    echo        git stash show -p --include-untracked stash@{0}
    echo      Zurueckholen:
    echo        git stash apply stash@{0}
    echo      [!] Absichtlich  apply  und nicht  pop :  apply  laesst die
    echo          Ablage liegen, falls etwas schiefgeht.  pop  wirft sie weg.
    echo          Taucht dabei  ^<^<^<^<^<^<^<  in einer Datei auf: nichts weiter
    echo          tun, sondern melden.
  )
  echo.
  echo    WICHTIG: wolltest du diese Arbeit zu GitHub bringen, dann ist
  echo    sie jetzt NICHT mehr im Ordner - hochladen.bat wuerde sagen,
  echo    es gebe nichts zu tun. Sag Claude Bescheid, dann holen wir sie
  echo    zusammen zurueck. Von selbst passiert damit nichts.
  echo   ------------------------------------------------------------
  echo.
)

echo   ------------------------------------------------------------
echo    Damit der Browser es auch sieht:
echo      Redion offen lassen und ZWEIMAL neu laden ^(F5^).
echo      Sieht es dann noch alt aus: ein drittes Mal.
echo      Tabs schliessen musst du nicht.
echo      Hast du Redion ueber  oeffnen.bat  gestartet, genuegt einmal.
echo.
echo    Deine Notizen bleiben, wo sie sind: im Browser. Dieser Ordner
echo    enthaelt das Programm - ausser du haettest die automatische
echo    Sicherung auf genau diesen Ordner gestellt. Das solltest du
echo    nicht; nimm einen Ordner in iCloud oder OneDrive.
echo   ------------------------------------------------------------
goto ende

:sicherngeht_nicht
echo.
echo   [X] Das Sichern ging nicht. Es wurde NICHTS veraendert.
echo       Dein Ordner ist unveraendert. Bitte sag Claude Bescheid -
echo       bis dahin arbeite normal weiter, deine Notizen im Browser
echo       sind nicht betroffen.
goto ende

:steckengeblieben
echo   [X] Hier ist eine Zusammenfuehrung steckengeblieben.
echo.
echo       Es wurde NICHTS veraendert, und es geht nichts verloren.
echo       Das laesst sich nicht per Doppelklick aufloesen.
echo       Bitte sag Claude Bescheid - bis dahin arbeite normal weiter,
echo       deine Notizen im Browser sind nicht betroffen.
goto ende

:ende
echo.
pause
