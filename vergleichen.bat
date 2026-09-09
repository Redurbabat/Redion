@echo off
chcp 65001 >nul
REM ===========================================================================
REM  vergleichen.bat  -  NUR NACHSEHEN, NICHTS ANFASSEN
REM ---------------------------------------------------------------------------
REM  Die dritte Richtung neben  holen.bat  und  hochladen.bat , und die
REM  einzige, die gar nichts tut: sie sagt nur, ob dein Ordner und GitHub
REM  denselben Stand haben - und wenn nicht, was auseinandergeht.
REM
REM  KEIN checkout, KEIN merge, KEIN reset, KEIN push. Das einzige, was
REM  dieses Skript schreibt, ist  git fetch  - und das faesst nur die Kopie
REM  der Fernstaende an, nie deine Dateien. Man kann es also bedenkenlos
REM  doppelklicken, auch mitten in der Arbeit.
REM
REM  WARUM ES DAS GIBT (E438): Redur fragte, wie er seinen Stand mit GitHub
REM  vergleicht. Die Antwort war bis dahin "starte holen.bat und lies, was
REM  es sagt" - nur HOLT das eben auch. Wer nur wissen will, wo er steht,
REM  soll nicht etwas anstossen muessen, das seinen Ordner veraendert.
REM
REM  ES VERGLEICHT GEGEN DEINEN ZWEIG (E519). Bis eben stand hier fest
REM   main  - und seit  holen.bat  einen Arbeitszweig holen kann (E517), war
REM  das die falsche Antwort auf die richtige Frage. Wer auf einem Zweig
REM  steht und fragt "habe ich dasselbe wie auf GitHub", bekam den Vergleich
REM  gegen den GEPRUEFTEN Stand: hunderte Unterschiede, die keine sind.
REM
REM  DIE VORGABE IST DESHALB EINE ANDERE ALS BEI  holen.bat , und das ist
REM  Absicht:
REM
REM     holen.bat        ohne Angabe:  main   - es AENDERT den Ordner,
REM                                             also die sichere Wahl
REM     vergleichen.bat  ohne Angabe:  dein Zweig - es SIEHT NUR NACH,
REM                                             also die ehrliche Wahl
REM
REM  Wer ausdruecklich gegen den geprueften Stand sehen will:
REM     vergleichen.bat  main
REM
REM  Doppelklick genuegt. Das Fenster bleibt am Ende offen.
REM ===========================================================================
cd /d "%~dp0"

echo.
echo   ============================================================
echo    Redion vergleichen        dieser Ordner  ^<==^>  GitHub
echo   ============================================================
echo.

REM --- Gibt es git? ----------------------------------------------------------
where git >nul 2>nul
if errorlevel 1 (
  echo   [X] Git ist nicht installiert, oder Windows findet es nicht.
  echo.
  echo       Kostenlos hier holen:  https://git-scm.com/download/win
  goto ende
)

REM --- Ist das der richtige Ordner? ------------------------------------------
if not exist ".git" (
  echo   [X] Dieser Ordner gehoert nicht zu Redion.
  echo.
  echo       Diese Datei gehoert dorthin, wo auch  index.html  liegt.
  echo       Gerade steht sie in:
  echo       "%CD%"
  goto ende
)

echo   Ordner:  "%CD%"

REM --- Gegen WAS wird verglichen? -------------------------------------------
REM  Ohne Angabe: der Zweig, auf dem dieser Ordner steht. Bei losgeloestem
REM  HEAD gibt  rev-parse  das Wort  HEAD  zurueck - dann bleibt nur  main .
set "ZIEL=%~1"
if "%ZIEL%"=="" (
  for /f "delims=" %%c in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "ZIEL=%%c"
)
if "%ZIEL%"=="" set "ZIEL=main"
if "%ZIEL%"=="HEAD" set "ZIEL=main"
echo   Vergleich gegen:  %ZIEL%
echo.

REM --- Den Fernstand holen. Das ist der einzige Schreibvorgang. --------------
echo   Frage GitHub ...
git fetch origin %ZIEL% >nul 2>nul
if errorlevel 1 (
  echo   [!] GitHub war nicht erreichbar.
  echo.
  echo       Alles Weitere waere ein Vergleich gegen eine alte Kopie und
  echo       damit eine Auskunft, auf die man sich nicht verlassen kann.
  echo       Also lieber gar keine.
  echo.
  echo       Zwei Gruende gibt es: keine Netzverbindung - oder den Zweig
  echo       %ZIEL% gibt es auf GitHub nicht. Diese hier gibt es:
  echo.
  git ls-remote --heads origin
  goto ende
)
echo.

REM --- Wo stehe ich, wo steht GitHub? ---------------------------------------
set "HIER="
set "DORT="
set "ZWEIG="
for /f "delims=" %%c in ('git rev-parse --short HEAD 2^>nul') do set "HIER=%%c"
for /f "delims=" %%c in ('git rev-parse --short origin/%ZIEL% 2^>nul') do set "DORT=%%c"
for /f "delims=" %%c in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "ZWEIG=%%c"

echo   Dein Stand:    %HIER%   ^(Zweig: %ZWEIG%^)
echo   Auf GitHub:    %DORT%   ^(%ZIEL%^)
echo.

REM --- Der eigentliche Vergleich: laeuft bei mir dasselbe? -------------------
REM  INHALTE, nicht Kennungen. Nach einem Merge sind die Kennungen
REM  verschieden und die Dateien trotzdem gleich - und genau das ist die
REM  Frage, die ein Mensch stellt: "habe ich dieselbe App wie auf GitHub?"
REM  NICHT ZAEHLEN, SONDERN FRAGEN OB ES ETWAS GIBT. `find /c /v ""` liefert
REM  die Zahl mitunter mit fuehrenden Leerzeichen, und dann ist
REM  `if "%X%"=="0"` still falsch - ein Skript, das bei Unterschieden
REM  "gleicher Stand" meldet, waere schlimmer als keines. `if defined`
REM  kann das nicht passieren.
set "ANDERS="
for /f "delims=" %%c in ('git diff --name-only origin/%ZIEL% HEAD 2^>nul') do set "ANDERS=1"

REM --- Und: liegt hier Unfertiges herum? ------------------------------------
set "OFFEN="
for /f "delims=" %%c in ('git status --porcelain 2^>nul') do set "OFFEN=1"

REM  Wie viele Schritte in welche Richtung - schon hier, weil auch bei
REM  gleichem INHALT die Historie auseinandergehen kann (nach einem Merge
REM  ist genau das der Normalfall). Ein Skript, das dann "alles gleich"
REM  sagt und den Rest verschweigt, macht eine Sicherheit, die es nicht hat.
REM  Mit 0 vorbelegt: scheitert git, bleibt die Zahl 0 statt leer. Sonst
REM  wuerde aus  if not "%ZURUECK%"=="0"  ein  if not ""=="0"  - immer wahr,
REM  und das Skript meldete Schritte, die es nicht gezaehlt hat.
set "VOR=0"
set "ZURUECK=0"
for /f "delims=" %%c in ('git rev-list --count origin/%ZIEL%..HEAD 2^>nul') do set "VOR=%%c"
for /f "delims=" %%c in ('git rev-list --count HEAD..origin/%ZIEL% 2^>nul') do set "ZURUECK=%%c"

if not defined ANDERS (
  if not defined OFFEN (
    echo   [OK] Gleicher Stand. Deine Dateien und GitHub sind identisch.
    if not "%ZURUECK%"=="0" (
      echo.
      echo        Die Kennungen sind trotzdem verschieden: GitHub hat
      echo        %ZURUECK% Schritt^(e^), die du nicht hast. Nach einem
      echo        Zusammenfuehren ist das normal - dieselben Dateien,
      echo        ein anderer Weg dorthin. Fuer die App macht es keinen
      echo        Unterschied.
    )
    goto daten
  )
  echo   [OK] Gegenueber GitHub ist nichts anders - aber es liegen
  echo        ungespeicherte Aenderungen im Ordner:
  echo.
  git status --short
  echo.
  echo        Mit  hochladen.bat  gehen sie zu GitHub.
  goto daten
)

echo   [!] Es gibt Unterschiede. Im Einzelnen:
echo.

REM --- Wieviele Commits in welche Richtung? (oben schon gemessen) -----------
if not "%ZURUECK%"=="0" (
  echo       GitHub ist %ZURUECK% Schritt^(e^) weiter. Das fehlt dir:
  git log --oneline HEAD..origin/%ZIEL%
  echo.
  echo       So holst du es:   holen.bat %ZIEL%
  echo.
)
if not "%VOR%"=="0" (
  echo       Du bist %VOR% Schritt^(e^) weiter. Das hat GitHub nicht:
  git log --oneline origin/%ZIEL%..HEAD
  echo.
  echo       Mit  hochladen.bat  bringst du es hin.
  echo.
)

echo       Diese Dateien unterscheiden sich:
echo.
git diff --stat origin/%ZIEL% HEAD
echo.

if defined OFFEN (
  echo       Dazu liegen ungespeicherte Aenderungen im Ordner:
  echo.
  git status --short
  echo.
)

:daten
echo.
echo   ------------------------------------------------------------
echo    UND DEINE NOTIZEN?
echo   ------------------------------------------------------------
echo    Die stehen hier NICHT drin, und das ist Absicht.
echo.
echo    Auf GitHub liegt der Bauplan von Redion - Quelltext, Doku,
echo    Pruefungen. Deine Seiten, Datenbanken, Dateien und Termine
echo    liegen im Speicher deines Browsers, auf diesem Rechner, und
echo    verlassen ihn nie von selbst.
echo.
echo    Dieses Skript kann sie deshalb nicht vergleichen - und
echo    niemand sonst kann sie sehen. Wer sie sichern will, nimmt in
echo    Redion  Sicherung  und legt eine  .redion -Datei an.
echo.

:ende
echo.
echo   ------------------------------------------------------------
echo    Dieses Skript hat nichts an deinen Dateien geaendert.
echo   ------------------------------------------------------------
echo.
pause
