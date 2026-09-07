# LUECKEN.md

Diese Datei listet auf, was Redion noch fehlt.

```txt
Eine Lücke ist nicht automatisch eine Aufgabe.
Eine Lücke beschreibt den Produktzustand.
AUFGABEN.md entscheidet, wann und wie daran gearbeitet wird.
ENTSCHEIDUNGEN.md erklärt, warum bestimmte Wege gewählt wurden.
```

Zeichen: ✅ vorhanden · ◐ teilweise · ✗ fehlt · ⚠ Risiko

---

## Stand

**24. August 2026 · 170 Prüfläufe** — Study Suite im Abschlusslauf

Stark in: local-first · Offline · blockbasierter Editor · Datenbanken ·
Formeln · Tabellenblock mit bedingter Formatierung · lokale KI mit Grenzen ·
Versionen · Papierkorb · `.json`- und `.redion`-Sicherung mit Anhängen, auch
über 4 GB · durchgängig TypeScript · Tests.

**Was seit dem 7. August dazukam**

```txt
—    Ink V2 (E125) — Marker, Linie, Pfeil, Rechteck, Ellipse, sichere
     Textanmerkung, Mehrfachauswahl, Verschieben/Löschen und Aktionsverlauf
     auf derselben stabilen A4-/PDF-Zeichenschicht
L11  Grenzen für Agenten (E52) — Notaus, Tageslimit, Rückfrage, und
     ohne Aufsicht nur lesen
L12  Barrierefreiheit gemessen und behoben (E51) — 106 Überlagerungen
     waren für ein Vorleseprogramm keine Dialoge
L15  bedingte Formatierung im Tabellenblock (E53), vollständig mit
     Symbol- und Datumsregeln (E60)
L33  Web Push (E54) — mit Server klingelt es auch bei geschlossener App;
     der Stoss trägt dabei keinen Erinnerungstext
L10  aus dem Nocturne-Entwurf: Marken statt Auswahlfelder, gleitende
     Reiterpille, 56-px-Leiste, Willkommensbildschirm (E48–E50, E55)
L20  Markdown gemessen statt gezählt (E59) — das Kürzelzeichen blieb
     seit jeher im Text stehen, und Strg V las kein Markdown zurück
L16  Probelauf für Automationen (E61) — der ▶-Knopf hiess „probeweise"
     und änderte echte Daten; dazu Fehler im Laufverlauf
—    „Kopiert" muss stimmen (E62) — dreissig Stellen meldeten Erfolg,
     ohne hinzusehen, und eine löschte danach endgültig
—    Fünf Prüfläufe reichten ihren Rumpf als Zeichenkette weiter und
     starben etwa jedes dritte Mal an einem Socketfehler
L10  die weiche Kante am Rollfeld (E63) — am Telefon stand `1'450.00 CHF`
     als `1'45` da, mit scharfer Kante und damit als andere Zahl
L10  Fingermasse im Tabellenblock (E64) — Zelle 40 px, Formelzeile 32,
     wo §37 44 verlangt; dazu eine Zahl, die an zwei Stellen steht
L22  fensterweise Zeichnen rechnete mit 34 px je Zeile (E65) — bei „alle
     Einträge" und weitem Rollen sah man die falschen Zeilen
—    zwei Typen, die über das eigene Format logen (E66)
—    ein Lesefehler sah aus wie ein leerer Bestand (E71) — „Ersetzen"
     löschte dann nichts und meldete Erfolg; der Verlauf zeigte „0
     Fassungen", wenn er nicht lesbar war
—    auch `stueckeVon` verwechselt einen Lesefehler nicht mehr mit einer
     leeren Datei (E121, L35) — Sicherung, Sync und Löschen brechen ehrlich
     ab; Dateisatz und Stücke bleiben unverändert
—    Heilen überschrieb Inhalt mit Vorgaben (E72) — ein `text` in fremder
     Verpackung wurde bei jedem Start zu `''`; jetzt liegt er beiseite
—    test100 prüfte eine Abschrift statt der echten Sicherung (E73) —
     der zerbrochene Entdoppler blieb grün, bis der Lauf die Funktion rief
—    ein halber Upload wanderte als halbes Video in die Sicherung (E74) —
     `alsBlob` hält jetzt Stückzahl gegen Sollzahl
—    sechs Prüfpunkte konnten nicht rot werden (E75) — `<= 4`, `>= 0`,
     -1 gegen -1, eine erfundene Klasse, ein Literal, eine Endlosschleife
L10  alle Menüs sind am Telefon Blätter — die letzten zwei Handmenüs
     laufen übers Menü-Modul (test155)
L10  die Formatleiste über der Tastatur, mit Augen gemessen (E81) — sie
     hätte am iPhone HINTER der Tastatur gelegen, die Reiterleiste ragte
     durch eine tote Regel hindurch, Fertig rollte aus dem Bild; und die
     Auswahlleiste war 442 px breit bei 390 px Bildschirm
L10  Ziehen am Telefon (E83) — langes Drücken hebt, der Finger trägt,
     die Fallmarke zeigt die Lücke; das Menü kommt beim Loslassen ohne
     Bewegung. Dabei zwei Altfehler: das Wischen war seit dem Bau
     unerreichbar (der Berührungsradius traf immer Checkbox oder Text,
     beide waren tabu), und nach einem Wisch frass der Nachzügler-Fänger
     den nächsten Tipp
—    der Review der Geste fand ein Datenverlust-Loch, das auch am
     RECHNER klaffte, seit es Ziehen gibt: ein Block neben dem eigenen
     Kind abgelegt hängte die Elternkette im Kreis auf — der Teilbaum
     verschwand, ohne gelöscht zu sein (E83-Nachtrag; lege() weist ab)
L10  Mehrfachauswahl am Telefon (E84) — „Auswählen" im Blockmenü, Tipp
     schaltet dazu/weg, Leiste ab dem ersten Block mit 44-px-Knöpfen.
     Dabei: der dunkle Menü-Grund blieb nach JEDER einfachen
     Menü-Aktion stehen und frass einen Tipp — seit es Blätter gibt
L16  der sonst-Zweig ist erstklassig (E85) — treffen die Bedingungen
     nicht, laufen die sonst-Aktionen statt gar keiner; dazu der tote
     Probelauf-Pfad, der `a.aktionen` las (die Liste heisst `dann`)
L16  Automationen drehen keine Kreisel mehr (E86) — „wenn X sich
     ändert → setze X" lief endlos (720 Schreibvorgänge in drei
     Sekunden); jetzt Gleichwert-Schutz plus Ketten-Deckel bei Tiefe 5
     mit ⚠ im Verlauf. Und die Schleife über die EIGENEN Zeilen gab es
     entgegen dieser Liste längst — erst jetzt ist sie gefahrlos
L20  Ausfüllen im Raster (E87) — Strg+D nach unten, Strg+R nach
     rechts, Excel-Semantik. Der Fund darunter: nach einem Zellklick
     lag der Fokus auf BODY — die ganze Rastertastatur ging bis zum
     ersten Tab ins Leere, und kein Lauf sah es, weil der Prüfstand
     per feld.focus() den Tab-Druck tat, den der Mensch nicht wusste
L20  Markdown-Tabellen (E88) — Einfügen wird ein Tabellenblock (Zahlen
     als Zahlen, =Formeln als Formeln), Strg+C schreibt ihn als
     |-Zeilen zurück; vorher verschwand der Block beim Kopieren
L10  der Tabellenblock zeigt am Telefon Karten (E89, Vorschlag) — die
     Kopfzeile liefert die Feldnamen, Formeln ausgerechnet, ⊞/☰
     schalten je Block ins Raster und zurück; Redur entscheidet am Bild
```

**Die Lücken, die jetzt obenauf liegen**

```txt
1. Mobile (L10): Bottom Sheets (test155), Formatleiste (E81), Ziehen
   (E83), Mehrfachauswahl (E84) und der Tabellenblock-Entwurf (E89,
   Karten als Vorschlag — Redur entscheidet am Bild) sind da.
   Wirklich offen: geprüft ist alles nur im Bildmass, nie am Gerät
2. Ein Durchlauf mit einem echten Vorleseprogramm fehlt (L12)
   (L14 ist seit test148 gemessen: 144 MB bei +0,0 MB Heap; offen bleibt
   nur die Zehn-Gigabyte-Frage am echten Gerät)

Die Wolke ist seit dem 6. August durch: Konto (L7), Anhänge (L6),
Konflikte (L5) und Rechte (L8) stehen und sind geprüft.
```

---

# Sehr hohe Priorität

## L1 · Die TypeScript-Migration selbst

**Stand** — ✅ der Bestand ist migriert (6. August 2026).

159 → 0 handgeschriebene JavaScript-Dateien. `tsc` meldet in allen drei
Konfigurationen nichts; `pruefungen/js-bestand.json` ist leer, und `test109`
wacht darüber, dass keine neue `.js` von Hand dazukommt. Das JavaScript
unter `quell/` ist seither **Ausgabe** von `npm run bauen:ts` — `test105`
hält es an seiner Quelle unter `src/`.

Die Nachrichten zu den Übertragungs-Bündeln stehen in
`doku/BUENDEL-11-BIS-24.md`; die Fragen der alten Läufe in
`doku/ALTE-PRUEFLAEUFE.md`.

**Status** — ✅ abgeschlossen. Offen bleibt nur die Benennung des Bestands
(L2), und die wandert ausdrücklich nicht rückwirkend.

## L2 · Die Code-Sprache ist entschieden, aber nicht durchgezogen

**Stand** — ◐ die Regel gilt (E27/E28); der migrierte Bestand behielt seine
deutschen Namen.

Neuer TypeScript-Code ist englisch, Nutzertexte und Dokumentation bleiben
deutsch. Englisch benannt ist, was neu geschnitten wurde (`src/core/`); die
gewachsenen Module heissen weiter deutsch (`src/bereiche/dateien/ausgeben.ts`),
weil ihre Ausgabepfade unter `quell/` stabil bleiben müssen — `index.html`
und `sw.js` laden sie namentlich.

**Das ist kein Versehen, sondern die Regel** — massenhaft umbenannt wird
nicht. Eine Datei wechselt die Sprache nur, wenn sie ohnehin migriert wird,
und dann gemessen: `ids.ts` hatte fünfzehn Aufrufe in drei Dateien.

**Was fehlt** — bei jeder künftigen Migration die Aufrufer **zählen**, bevor
die Schnittstelle umbenannt wird. Gemessen bisher: `Kennungen` 15 · `Datum` 1
· `Objekte` 0 · `Bytes` 6 · `Bremse` 0 · `Melder` 17 · `Saeubern` 10. Alle
sieben lagen in derselben Grössenordnung und waren deshalb erlaubt. Die
Grenze ist nicht die Zahl allein: bei `Saeubern` kamen drei Prüfungen dazu,
die den **Quelltext** lesen (`test91`), und die mussten mitgezogen werden.

**Status** — ⏳ Regel gilt, Umsetzung wandert mit der Migration.

## L3 · Der Spreadsheet-Block

**Stand** — ✅ der Tabellenblock ist gebaut — siehe `ENTSCHEIDUNGEN.md` E29,
`DESIGN-TABELLE.md` und `AUFGABEN.md` Phase 7a. Es gibt keine zweite
Formelmaschine: Zellformeln werden in die Sprache von `formeln/laufzeit.js`
übersetzt.

Was er **bewusst nicht** ist, steht in E29. Was noch fehlt, hat eigene
Nummern:

```txt
✗ Spreadsheet-Ansicht für Datenbanken (eine der Ansichtsarten ist sie nicht)
✓ bedingte Formatierung — L15, seit E53 und E60 vollständig
✗ Zielwertsuche, Szenarien, Solver — L28
```

**Status** — ✅ Kern fertig; Ausbau siehe L18 · L28.

## L4 · Fehlerwerte — beantwortet, ohne das Rechnen umzustellen

**Stand** — ✅ die Frage ist beantwortet (6. August, E36). `WENNFEHLER` und
`ISTFEHLER` gibt es; blockiert ist nichts mehr.

Redions Laufzeit bleibt **abwehrend**, und das ist die Zusicherung, unter
der jede bestehende Datenbank läuft:

```txt
1 / 0        →  0
WURZEL(-1)   →  0
WERT("abc")  →  0
```

Neu ist die **strenge Insel**: `WENNFEHLER(1/0; "—")` rechnet nur das
Argument in der Klammer streng und ergibt „—". Ausserhalb ändert sich
nichts — `iferror(1/0, 0) + 1/0` ist weiterhin 0. Damit kann keine
bestehende Formelspalte ihr Ergebnis ändern; sie enthält diese Funktionen
nicht, denn es gab sie bis heute nicht.

`test106` Abschnitt 4d hält den abwehrenden Zustand weiter fest, `test123`
die Insel und ihre Grenzen — samt der Regel, dass ein Tippfehler nicht als
Rechenfehler verschluckt wird.

**Was offen bleibt** — echte Fehlerwerte als **Zellinhalt** in
Datenbankspalten (also `#DIV/0!` in einer Liste statt 0). Das wäre die
Umstellung, die E36 ausdrücklich nicht macht. Ob sie je kommt, ist eine
eigene Entscheidung mit Migrationsgedanken.

## L5 · Sync-Konflikte zwischen Geräten

**Stand** — ✅ geprüft, gegen echten Server und echte Geräte.

`test113` (Zusammenführung: sieben Konfliktfälle, jeder gegen die Frage
„steht am Ende die eine oder die andere Fassung da — oder ist ein Konflikt
gemeldet?"), `test78` (zwei Chromium-Geräte ändern gleichzeitig) und seit
dem 6. August `test118`: Gerät A ändert offline, das **Wiederverbinden
allein** stösst den Abgleich an, und Anhänge kommen samt Bytes hinüber —
Byte für Byte, verschlüsselt unterwegs (seit G2, E33).

Zwei Fehler, die diese Läufe gefunden haben: der `online`-Handler zeigte
nur einen Toast statt abzugleichen, und `/sync/runter` liess die Marke vor
unlesbaren Sätzen stehen — die eigenen dahinter kamen nie.

**Status** — ✅ die Läufe stehen. Offen bleibt, was Anhänge wirklich
mitnimmt: L6.

---

# Hohe Priorität

## L6 · Cloudflare R2 für Dateien

**Stand** — ✅ Anhänge syncen (6. August, E33) — mit vier benannten Resten.

Server: `server/dateien.ts` (melden · stueck · runter · stand · weg),
Metadaten in D1, Bytes in R2 bzw. im Prüfserver in einer Map. Client:
Abschnitt 6b in `maschine.ts` — nach den Sätzen gehen die Stücke, hoch wie
runter, verschlüsselt wie die Sätze. Geprüft: `test119` (Server, 19
Punkte), `test118` Abschnitt 3 (zwei echte Geräte, Byte für Byte),
`test113` Abschnitt 8 (der frühere Stolperdraht, planmässig umgedreht).

**Was benannt offen bleibt:**

```txt
✓ Lokales Löschen wandert zum Server — GESCHLOSSEN am 29. August (E249):
  Merkliste wolkeDateienWeg mit Oben-Wache, Versand VOR dem Holen,
  404/403-Regeln; test256 mit echtem Server und zwei Geräten, 16 Punkte
✗ Der Download ist eifrig — am Telefon kann ein grosser Bereich viel
  Datenvolumen ziehen; ein „nur bei Bedarf" ist eine eigene Entscheidung
✗ .redion-Archiv in R2 als Cloud-Sicherung
✗ Dateien über 100 MB bleiben bewusst lokal (E33) — ihr Weg ist .redion
```

**Regel** — grosse Dateien gehören nicht in D1 (`ENTSCHEIDUNGEN.md` E2);
das Wie steht in E33.

## L7 · Konto-Modus

**Stand** — ✅ der Nutzerfluss steht (6. August, E34).

Anmelden (GitHub, Google, Gerätecode) gab es schon; neu ist die
Entscheidung dahinter: **anmelden ist nicht zustimmen.** Der Schalter
`wolkeAbgleich` trennt „nur lokal" von „lokal + Abgleich", die Oberfläche
fragt ausdrücklich, und ohne das Ja verlässt kein Satz das Gerät —
`test120` beweist es am echten Server. Abmelden warnt und lässt die
Notizen da; **Konto löschen** räumt serverseitig die volle Kaskade und
verlangt die abgetippte Mail-Adresse; „Alles als .redion sichern" steht
direkt daneben.

Offen bleibt der Cloud-Arbeitsbereich als eigenes Konzept (mehrere
Bereiche wählen und anlegen in der Oberfläche) — bisher nimmt das Gerät
den ersten Bereich des Kontos.

**Regel** — ein Konto darf nie Pflicht sein, und lokale Daten werden nie
ungefragt hochgeladen (E1). Das Tor dazu steht in `abgleichen()` (E34).

## L8 · Rechte und Freigaben produktionsreif machen

**Stand** — ✅ die Rechte sperren, und sie erlauben auch (6. August, E35).

```txt
✅ serverseitige Prüfung  test75, test79, test121 — je Seite und je Spalte
✅ öffentliche Seiten     Unterseiten gehen NICHT mit; nur der Titel steht da
✅ private Anhänge        eine offene Seite macht keinen Anhang öffentlich
✅ Feldrechte             feldFilter beim Lesen, feldSchutz beim Schreiben
✅ Kommentarrechte        kommentarSchutz — die Rolle komm darf wirklich
✅ Widerruf               Seite zurückziehen · Freigabe entziehen · Marke löschen
```

Drei Fehler kamen dabei heraus, alle aus derselben Richtung — eine Regel
stand da, aber niemand hat sie je gefragt: Veröffentlichen nahm jede
Unterseite mit, die Kommentarrolle konnte nicht kommentieren, und eine
Marke mit `lesen` konnte nichts lesen. Die drei stehen in E35.

**Was hier offen bleibt:** Rechte für Datenbank-ZEILEN (heute gilt die
Seite, zu der die Zeile gehört) und ein Weg, eine Freigabe zeitlich zu
begrenzen — beides ist eine eigene Entscheidung, kein Loch.

## L8b · ~~Der Service Worker und die ehrliche Ersatzantwort~~ — GESCHLOSSEN

**Stand** — ✅ behoben, aber der Gedanke gilt weiter.

Der Arbeiter gab die Startseite für **jede** unbeantwortbare Anfrage zurück,
auch für ein Skript. Der Browser bekam Status 200 mit HTML, führte HTML als
JavaScript aus, und die Meldung nannte am Ende einen Namen, der mit der
Ursache nichts zu tun hatte („Wissen is not defined").

**Was bleibt** — jede Ersatzantwort in diesem Projekt daraufhin ansehen, ob
sie zur Frage passt. Eine Antwort in der falschen Form ist schlimmer als
keine: sie sieht wie Erfolg aus.

## L9 · ~~Formelfunktionen ohne Beschreibung~~ — GESCHLOSSEN

**Stand** — ✅ geschlossen (6. August). 0 ohne Beschreibung, 0 ohne Funktion.

Es waren zuletzt 170, nicht 180 — die alte Zahl stammte aus einer Zählung
vor den deutschen Excel-Namen. Jede hat jetzt Gruppe, Argumente und einen
Satz, und **jeder Satz ist am Quelltext gemessen**, nicht aus dem Namen
geraten. Wo die Maschine etwas anderes tut, als der Name vermuten lässt,
steht genau das da:

```txt
date()     gibt den Tag im Monat, nicht das Datum
sort()     sortiert als Text — 10 steht damit vor 9
divide()   durch null ergibt 0 und keinen Fehler (siehe L4)
sqrt(-1)   ergibt 0, nicht einen Fehler
id()       gibt heute immer leer zurück
```

**Warum es so lange offen war, und was sich daran geändert hat.** Der Kopf
von `register/formeln.ts` sagte: „eine Liste, die man doppelt pflegen muss,
wird nicht gepflegt." Das stimmt, solange niemand nachsieht — und
`abgleich()` hat die Lücke die ganze Zeit korrekt gemeldet, nur hat niemand
gefragt. `test122` fragt jetzt bei jedem Lauf, in beide Richtungen, samt
Gegenprobe, dass es auch rot werden kann.

## L10 · Mobile und iPhone

**Stand** — ◐ die Schale steht, die Bereiche darin noch nicht ganz.

Seit dem 6. August ist das Telefon die Hauptumgebung (E37). Die Schale ist
gebaut: fünf Wege oben (R · Start · Seiten · Termine · Eingang, E38), die
feste Leiste unten (Suche · KI fragen · Neue Seite), das R-Blatt über den
ganzen Bildschirm, der Start-Bereich beim Öffnen. `test114` misst das an
390 und 428 px; jede Fläche ist mindestens 44 px.

Termine und Eingang haben ihre eigenen Bereiche bekommen; der Codeblock
seine Kopfzeile. Was das Hinsehen dabei fand, steht in E38 — fünf Fehler,
und keinen davon hatte ein Prüflauf.

**Aus Redurs Entwurf „Nocturne" gebaut** (E42–E50): der Reiter „Mehr" und
der Bereich dahinter · der Kompass als Seite darin · die Farbwelt mit
nachgerechneten Kontrasten · die Bewegungsmarken und die
Berührungsrückmeldung · das Blatt „Neu erstellen" · das KI-Fenster als
Blatt von unten · der Speicherbalken im R-Blatt · „Zuletzt gesucht" und
ein Leer, das etwas sagt · die Ladeskelette · die versetzt einblendenden
Listenzeilen · die Suchfilter als Marken · die gleitende Reiterpille · die
56-px-Leiste oben, deren Höhe jetzt an einer Stelle steht · der
Willkommensbildschirm (§11, E55).

**Aus dem Entwurf ist damit alles gebaut**, was Redur beschrieben hat —
zuletzt die Zustandswechsel der Sicherungskarte (E57) und die Einstellungen
als zwei Seiten statt zwei Spalten (E58).

**Was das Hinsehen am 8. August fand** (E63): Tabellenblock und
Datenbankraster rollen am Telefon seitlich, und die angeschnittene Spalte
hatte eine **scharfe** Kante. `1'450.00 CHF` stand dort als `1'45` — eine
gültige Zahl, nur eine andere. Jetzt verläuft der letzte Streifen; das Auge
liest „geht weiter" statt „hört auf". `test136` hält es.

**Und eine Behauptung weniger.** Die Datenbank zeigt am Telefon längst
**Karten** statt einer Tabelle — eine Zeile, ihre Felder untereinander,
nichts rollt seitlich. Diese Lücke sagte das Gegenteil. Die rollende
Tabelle gibt es dort nur, wer sie im Ansichtsmenü ausdrücklich anschaltet
(`handyTabelle`), und auch die hat jetzt ihre Kante.

**Was das Hinsehen am 9. August fand** (E81): die Formatleiste über der
Tastatur gab es längst — aber sie hätte am echten iPhone HINTER der
Tastatur gelegen (`bottom:0` ohne visualViewport), ihre Versteck-Regel
zielte auf ein Element, das es nicht mehr gibt (die Reiterleiste ragte
dahinter hervor), die Knöpfe massen 44×38, und der Fertig-Knopf rollte
seitlich aus dem Bild. Dazu die schwebende Auswahlleiste: 442 px breit
bei 390 px Bildschirm, Knöpfe 28×31. Alles repariert; `test156` hält es,
samt Tastatur-Stummel für die Höhenrechnung. Seit test155 sind auch alle
Menüs am Telefon Blätter — beides stand hier noch als offen.

**Ziehen gibt es seit E83** — langes Drücken hebt den Block, der Finger
trägt ihn, die Fallmarke zeigt die Lücke; das Menü kommt beim Loslassen
ohne Bewegung. `test157` prüft die Geste mit echten CDP-Berührungen und
fand dabei zwei Altfehler (Wischen unerreichbar, Fänger frass den
nächsten Tipp — beide behoben, siehe E83).

**Die Mehrfachauswahl gibt es seit E84** — „Auswählen" im Blockmenü
steigt ein, ein Tipp schaltet Blöcke dazu und wieder weg, die
Aktionsleiste steht am Telefon ab dem ersten Block (test158). Der Bau
fand den nächsten Altfehler: der dunkle Menü-Grund blieb nach jeder
einfachen Menü-Aktion stehen und frass einen Tipp (jetzt Wächter im
Menü-Modul, test155 §4) — und die Leisten-Knöpfe massen 31 px statt 44.

**Die „eigene Frage" ist als Vorschlag beantwortet** (E89): der
Tabellenblock zeigt am Telefon Zeilen als **Karten** — die Kopfzeile
liefert die Feldnamen, Formeln stehen ausgerechnet da, ⊞/☰ schalten je
Block ins Raster und zurück, am Rechner ändert sich nichts (test163).
Redur entscheidet am Bild; kippt er den Standard, ist das eine Zeile.

**Die Vorschau ist seit E371 ein Blatt** — Side Peek am Telefon war der
letzte grosse offene Punkt dieser Lücke. Bis dahin sprang eine angetippte
Zeile zur ganzen Seite, und die Tabelle darunter war weg: zehn Zeilen
ansehen hiess zwanzig Mal navigieren. Jetzt kommt ein Blatt von unten mit
drei Höhen (zu · halb · voll), das die Tabelle stehen lässt; am Rechner
bleibt es das Seitenfenster, und der Inhalt wird nur einmal gebaut
(`peekInhalt`). `test361` hält es mit 36 Punkten, darunter zwei echte
Berührungen über CDP.

**Die Marken sind seit E372 gemessen, nicht behauptet.** Der Punkt hiess
hier „gemeinsame Gestaltungswerte statt verstreuter Pixelzahlen"; gezählt
sind es 7172 rohe px-Werte in 18 Stildateien, und die meisten davon sollen
gar keine Marke werden — ein Polster ist kein gemeinsames Mass. Der echte
Fund lag woanders: **zwei der sieben Telefonmarken waren falsch.**
`--mobile-topbar` sagte 46 bei einem 56 px hohen Balken, und die eine
Stelle, die sie benutzte, war die Kerbenregel — am iPhone war der Balken
dadurch zehn Pixel zu flach. `--mobile-nav-height` sagte 56 bei 59 und
wurde nirgends benutzt. `test362` misst jetzt jede Marke gegen ihr echtes
Element in zwei Bildmassen; `pruefungen/marken-decke.json` hält die rohen
Wiederholungen fest und darf nur schrumpfen.

**Fehlt ausserdem:** die 113 rohen `44px` einzeln durchzugehen — welche
davon eine Trefferfläche meinen (dann `var(--touch-min)`) und welche
zufällig 44 sind (dann bleiben sie). Das ist Kleinarbeit ohne Risiko und
der Rest von L10.

**Geprüft auf echtem Gerät** — nein. Alles bisher gemessen mit Playwright
im Telefon-Bildmass. Das findet Grössen und Überdeckungen, aber nicht das
Verhalten von Safari selbst; der Fehlerbalken kam vom iPhone, nicht aus
einem Prüflauf.

## L11 · Agenten-Sicherheit

**Stand** — ✅ die fünf genannten Grenzen stehen (8. August, E52).

Zwei davon gab es längst und standen nur nicht in der Liste: Rechte je
Agent (jedes Werkzeug trägt `recht`, gefiltert über `Konten.darf`) und ein
Protokoll (`agent:laeufe`, die letzten 30 samt Rücknahme). Drei fehlten:

```txt
✓ Notausschalter   hält alle Agenten an, zuerst die Auslöser — und wirkt
                   mitten im Lauf, nicht erst beim nächsten
✓ Tageslimit       120 Schritte für alle Agenten zusammen, geprüft auch
                   mitten im Lauf. Das Guthaben gilt nur je Auftrag; ein
                   täglicher Auslöser war damit unbegrenzt
✓ Bestätigung      vor jeder ändernden Handlung, mit Werkzeug, Vorhaben
                   und Argumenten im Text. Drei Antworten: nicht ändern ·
                   einmal · für diesen Lauf
```

Dazu die Regel, die in der Liste fehlte und die wichtigste ist: **ohne
Aufsicht nur lesen**. Ein Auslöser läuft, während niemand hinsieht — dort
ist eine Rückfrage keine Sicherung, sondern eine Sperre, die nie
beantwortet wird. Wer es anders will, setzt beim Agenten ausdrücklich
„darf auch ohne Aufsicht ändern".

**Fehlt weiterhin:** ein Limit für Worker (`workerLaufen` führt eigenen
Code in einem Web Worker aus und zählt nicht mit) · eine Obergrenze für
die Grösse dessen, was ein Agent in einem Schritt schreibt · und ein Weg,
einen laufenden Agenten von aussen abzubrechen, ohne den Notaus für alle
umzulegen.

## L12 · Barrierefreiheit

**Stand** — ◐ gemessen und grösstenteils behoben (7. August, E51); der
Durchlauf mit einem echten Vorleseprogramm fehlt.

Fünf Punkte standen hier. Gemessen ergab das:

```txt
✓ Fokus sichtbar        2 px Rahmen in der Akzentfarbe, überall
✓ Escape schliesst      Suche, Befehle, Einstellungen, Papierkorb
✓ Kontrast hell/dunkel  gerechnet in test127 (E44), 20 Punkte
✓ nur über Farbe        der rote Punkt „ungelesen" war leer und still —
                        jetzt steht die Zahl im Namen des Knopfes, und
                        die Reiter sagen mit `aria-selected` /
                        `aria-current`, wo man ist
✓ Fokusreihenfolge      der Fokus blieb hinter dem Dialog stehen, lief
                        mit Tab hinaus und kam nie zurück — repariert an
                        einer Stelle für alle 106 Überlagerungen
```

Dazu kam, was beim Messen auffiel und in keinem der fünf Punkte stand:
null Überschriften auf einer Seite mit Titel und Überschrift · Meldungen
ohne Live-Bereich · ein Fenstertitel, der immer „Redion" hiess.

**Fehlt weiterhin:** ein Durchlauf mit VoiceOver oder NVDA. `test128`
prüft, worauf jedes Vorleseprogramm angewiesen ist — Rollen, Namen,
Zustände, den Weg der Tastatur. Das ist nicht dasselbe wie zuhören, wie es
wirklich klingt. Ausserdem ungeprüft: die Bereiche unterhalb der Schale
(Datenbankansichten, Tabellenblatt, KI-Fenster) und die Bedienung ganz
ohne Maus über einen längeren Arbeitsablauf.

## L13 · ~~Prüfläufe für migrierten TypeScript-Code~~ — GESCHLOSSEN

**Stand** — ✅ erledigt.

Alle Prüfläufe sind `.mts` und laufen direkt unter Node (Typen werden
entfernt, `CLAUDE.md` §54.3); `npm run typecheck` prüft sie mit,
`test109` hält den JS-Bestand bei null. Die alten Läufe unter
`pruefungen/alt/` sind gegangen; ihre Fragen stehen in
`doku/ALTE-PRUEFLAEUFE.md`.

---

# Mittlere Priorität

## L14 · ZIP64 / Dateien über 4 GB

**Stand** — ✅ die Grenzen des Formats sind gefallen (6. August 2026, E39).

```txt
eine Datei          über 4 GB    ZIP64, geprüft
das ganze Archiv    über 4 GB    ZIP64, geprüft
Anzahl Einträge     über 65 535  ZIP64, mit 70 000 wirklich geschrieben
fremdes ZIP64                    wird gelesen
kaputtes ZIP64                   wird abgelehnt, nicht als leer gemeldet
```

**Warum es doch kam.** Die alte Regel — eine ehrliche Meldung statt eines
kaputten Archivs — war richtig und trotzdem zu wenig. Die Meldung riet, „die
Anhänge in zwei Schritten" zu sichern, und diesen zweiten Schritt gibt es in
Redion nicht: jeder Weg mündet in dasselbe eine Archiv. Wer 5 GB Fotos
hatte, konnte gar nicht sichern. Eine ehrliche Fehlermeldung ist keine
Sicherung.

Gehalten wird das von `test103` (36 Punkte) — und zwar von **`unzip` und
`zipinfo`** mitgehalten, nicht nur von Redion selbst.

**Seit dem 8. August ist auch der Browser gemessen** — im Rahmen dessen,
was der Prüfcontainer hergibt. `test148` schickt 144 MB (drei Dateien à
48 MB) durch den ganzen Kreis, mit der ECHTEN `sicherungSpeichern` und dem
echten Import:

```txt
Export   0,8 s · JS-Heap-Spitze +0,0 MB   → wirklich stückweise (§14):
                                            die Blobs verwaltet der Browser,
                                            der Heap fasst sie nie an
Import   1,6 s · Byte für Byte gleich      48 Stichproben + Vollvergleich
```

**Der Fund dabei war einer in den eigenen Prüfwerkzeugen:** der
Import-Nachbau schrieb `datei:` statt `dateiId:` — der Index heisst
`datei`, das FELD heisst `dateiId`, dieselbe Falle wie `page`/`pageId`
(E21). Alle 48 Stücke lagen im Fach und waren für `stueckeVon` unsichtbar.
Und die Stichproben-Prüfung war dabei GRÜN — als „0 von 0 stimmen". Seither
prüft test148 zuerst, DASS Stichproben genommen wurden (§55.2). Derselbe
Feldfehler steckte im ersten Wurf der Dexie-Schicht (E78) und ist dort samt
Kommentar berichtigt.

**Weiter offen:** die Zehn-Gigabyte-Frage. Ob Chrome oder Safari einen
Blob dieser Grösse zusammensetzen und herunterladen, entscheidet der
Browser; dafür braucht es ein echtes Gerät mit Platz und Geduld — im
Prüfcontainer geht es nicht.

## L15 · ~~Bedingte Formatierung~~ — GESCHLOSSEN

**Stand** — ✅ vollständig (8. August, E53 und E60).

Die Hälfte war beim Nachsehen längst da, aber in den **Datenbanken**:
`farbregeln` färbt dort ganze Zeilen, und die Spaltenanzeige kennt
`skala`, `heat`, `bar` und `ring`. Im **Tabellenblock**, wo der Begriff
herkommt, gab es nichts.

```txt
✓ Zellfarbe nach Regel   acht Vergleiche: grösser · kleiner · gleich ·
                         zwischen · enthält · leer · nicht leer · mehrfach
✓ Zeilenfarbe            in den Datenbanken, über `farbregeln`
✓ Datenbalken            im Blatt und in den Datenbankspalten
✓ Farbskalen             ebenso
✓ Duplikate              die Art „kommt mehrfach vor"
✓ Symbolregeln           vier Sätze — Ampel, Pfeile, Formen, Noten; drei
                         Stufen, gedrittelt oder mit eigenen Grenzen
✓ überfällige Werte      und „wird fällig in den nächsten … Tagen"
```

Die Ortszeit war die eigentliche Frage, und sie ist beantwortet:
`new Date('2026-08-08')` liest ISO als **UTC**. In Zürich fällt das nicht
auf; in Los Angeles ist derselbe Zeitpunkt der 7. August um 17 Uhr — und
damit wäre jede *heute* fällige Aufgabe schon am Morgen rot. `alsDatum`
baut das Datum deshalb aus seinen Teilen. `test130` §11b rechnet dasselbe
in `America/Los_Angeles` nach; mit einem naiven `new Date(text)` wird
genau dieser Punkt rot.

Das Symbol steht über `content` und eine CSS-Eigenschaft vor dem Wert,
nicht *im* Wert: die Zelle rechnet weiter mit ihrer Zahl, und beim
Kopieren nach Excel geht kein Emoji als Text mit.

## L16 · Automationen erweitern

**Stand** — ✅ komplett seit dem 9. August: 19 Aktionsarten · Bedingungen
je Aktion und je Automation · Variablen · Vorschau, Protokoll und
Fehleranzeige (E61) · sonst-Zweig erstklassig (E85) · Schleifenschutz
(E86: Gleichwert + Ketten-Deckel) · Schleife über eigene Zeilen.

Die letzte „fehlende" Sache stand hier falsch: „Über die eigenen Zeilen
läuft nichts" stimmte nie — `fremd-setzen` listete die eigene Datenbank
seit jeher als Ziel. Was wirklich fehlte, war der Schleifenschutz, ohne
den jede Eigen-Massenänderung ein Kreisel-Kandidat war (E86, test160 §5).

Diese Lücke stand mit einer Zahl da, die niemand nachgezählt hatte, und
listete als fehlend, was teils längst gebaut war. Was das Nachsehen fand:

```txt
✓ 19 Aktionsarten          setze-prop · ki-fuellen · erinnerung ·
                           unterseite · zaehler · wiederholen ·
                           fremd-setzen · webhook · melden · variablen ·
                           neue-zeile · benachricht · mail · archivieren ·
                           loeschen · leeren · duplizieren · kommentar ·
                           zurueckstellen
✓ Bedingung je Aktion      `d.wenn` samt `umkehren` — ein If/Else lässt
                           sich damit als zwei gespiegelte Aktionen
                           schreiben
✓ Variablen                `{{name}}` in jedem Textfeld, aus Formeln
✓ Protokoll                Laufverlauf je Automation (100 Läufe) und ein
                           Eintrag im gemeinsamen Protokoll
✓ Vorschau                 seit E61 — zeigt den Plan, schreibt nichts
✓ Fehleranzeige            seit E61 — vorher war das Feld da, das ⚠ im
                           Verlauf auch, und gesetzt hat es nie jemand
✓ sonst-Zweig              seit E85 erstklassig: `sonst` als Schwester
                           von `dann` — treffen die Bedingungen nicht,
                           läuft er statt gar nichts; Verlauf, Liste und
                           Probelauf zeigen den Zweig
✓ für jede Zeile           `fremd-setzen` (höchstens 500 Zeilen) nimmt
                           auch die EIGENE Datenbank — das ging entgegen
                           dieser Zeile schon immer und ist seit dem
                           Schleifenschutz (E86) gefahrlos (test160 §5)
```

**Und was dabei aufgefallen ist** — der ▶-Knopf hiess „Einmal probeweise
laufen lassen" und liess die Automation **wirklich** laufen. Siehe E61;
das war Priorität 1, nicht Feinschliff.

## L17 · ~~Dashboards und Pivot ausbauen~~ — GESCHLOSSEN

**Stand — ✅ seit E185 (25. August 2026).** Die vier genannten Punkte hingen
alle an derselben Stelle: daran, was in einer Kachel stehen darf.

```txt
mehrere Datenquellen   `quelle`   eine FREMDE Datenbank statt der eigenen
KPI-Karten             `ziel`     eine Zahl gegen ein Ziel, mit Richtung
Layout                 —          jede Kachel einzeln weg und verschieben
Diagrammquellen        `wertKey`  die Verteilung SUMMIERT eine Spalte
```

**Die fremden Zeilen kommen ungefiltert**, und das ist Absicht: ein Filter
gehört zu einer Ansicht, und die fremde Datenbank hat ihre eigenen — welche
davon gälte? Eine Zahl, deren Bedeutung von einer Einstellung anderswo
abhängt, ist eine Zahl, der man nicht trauen kann. Unter der Karte steht die
Quelle, im Fuss steht, wie viele Kacheln von woanders kommen.

**Die Diagrammquelle ist der Punkt, den man am ehesten übersieht und am
meisten braucht.** Die Verteilung zählte immer nur Zeilen — „12 Aufträge in
Zürich". Die Frage ist fast immer „180 000 Umsatz in Zürich": dieselbe
Gruppierung, ein anderer Wert.

**Was das Hinsehen fand:** die neuen Kachelgriffe lagen auf der Zahl.
`408000` stand mit einem Knopf über der letzten Null da und las sich als
`40800` — beide gültig, eine richtig. Derselbe Fund wie CLAUDE.md §55.2.

Hier stand „Pivot mit Prozent von Gesamt" — den Modus gibt es seit dem
Pivot-Bau (`pivotProzent: aus | zeile | spalte | gesamt`). Die Behauptung
war falsch; beim Nachsehen fand sich stattdessen ein echter Fehler: die
Quer-Ränder zeigten in den Modi Zeile/Spalte überall „0 %", auch in der
CSV. Behoben und Zelle für Zelle geprüft (E92, test166).

**Was NICHT gebaut ist:** ein freies Raster, in dem Kacheln beliebig breit
und hoch gezogen werden. Die Kacheln fliessen; das reicht für einen
Überblick und kostet keine Einstellung, die man pflegen muss. Wenn jemand
das vermisst, ist es eine eigene Entscheidung wert.

Prüflauf: `test237`, 55 Punkte, sieben einzeln nachgewiesene Gegenproben.

## L18 · XLSX und ODS

**Stand** — ◐ Lesen und Schreiben gibt es, seit E91 mit ALLEN Blättern:
der Export trug vorher nur das aktive Blatt (stille §13-Lücke — die
Datei sah vollständig aus), der Import nahm nur Blatt 1 mit einer
Begründung, die Mehrblatt je Block verneinte, während die Blattreiter es
längst konnten. Jetzt: Rundreise Mappe → .xlsx → Mappe mit echten Bytes
belegt (test165). Formeln gehen bewusst als Werte hinaus.

Seit E93 kann auch der Tabellenblock ODS in beide Richtungen: ⋯ →
„Als OpenDocument (.ods) speichern" gibt die ganze Mappe aus, die
Öffnen-Weiche nimmt `.ods` an und legt je Blatt ein eigenes an —
geprüft bis zum echten Download und durch den echten Dateiwähler
(test167). Der echte Weg fand dabei einen Absturz nach dem
Mehrblatt-Anlegen, der auch den E91-Excel-Import betraf — behoben
(Blattwechsel über `zuBlatt`).

Seit E94/E95 tragen BEIDE Ausgänge des Blocks ROHWERTE samt
Zellformat: 0.15 kommt als Zahl mit Prozentformat an, nicht als Text
„15 %", das de-CH-Tausenderzeichen macht grosse Zahlen nicht mehr zu
Text, und fett/kursiv/Ausrichtung gehen mit — als styles.xml (test168)
bzw. automatic-styles in der content.xml (test169).

Seit E97 kommt die Zellformatierung auch HEREIN: beide Leser geben je
Blatt eine Stil-Matrix zurück (fett · kursiv · Ausrichtung · Prozent ·
Währung), und der Block trägt sie auf beiden Einlese-Wegen an
(test171). Der Austausch der Zellformate ist damit in beide
Richtungen geschlossen.

Fehlt: Kommentare · Bilder · Diagramme · bedingte Formatierung im
Austausch.

## L19 · ~~Fehlende oder ungeprüfte Blocktypen~~ — GESCHLOSSEN

**Stand** — ✅ inventarisiert am 9. August (E90): das Register führt
**76** Einträge, aufgeschrieben in `doku/BLOCKTYPEN.md` — erzeugt aus
dem Register, nicht abgetippt, und `test164` hält beide zusammen.

Die alte Zeile hier war doppelt falsch: sie zählte 58 (das Register
führte 76 — seit E29 kamen unter anderem Kalkulationstabelle,
Whiteboard, Diagramm und Karteikarte dazu), und von den sechs
„Kandidaten" gab es VIER längst: Breadcrumb (`breadcrumb`), Synced view
(`linkeddb` und `synced`), AI summary (`ai-summary`), Button (`button`).
Die übrigen zwei sind anders gelöst — File gallery über die
Galerie-Ansicht und den Dateien-Bereich, Relation preview ist
Eigenschafts-Verhalten (Zeilen-Peek), kein Blocktyp.

Die Notion-Seite der alten Zählung (97) ist eine Alt-Messung ohne
archivierte Einzelliste; ohne neuen Blick in Notion ist sie nicht
belegbar, und geraten wird nicht (E21).

## L20 · Markdown- und Tastenkürzel

**Stand** — ✅ Markdown, gemessen statt gezählt (Tabellen seit E88 in
beide Richtungen) · ✅ Tastenkürzel: die Referenz
(doku/SLASH-UND-TASTEN.md) führt nichts Offenes mehr — Strg+R/Strg+D
zum Ausfüllen kamen mit E87, Alt+Umschalt+Klick als letztes (test158
§7). Übrig sind nur die als — markierten Programmfunktionen, die es im
Browser nicht geben kann, und die ◐-Halbheiten der Datenbank-Vorschau.

Der Zeile-für-Zeile-Vergleich ist da: `pruefungen/lauf/test132.mts` **tippt**
jedes Kürzel und liest ab, was daraus wird. Er hat vier Behauptungen
umgeworfen, die `doku/SLASH-UND-TASTEN.md` als ✅ führte — und einen Fehler
gefunden, der die ganze Zeit sichtbar war:

**Das Zeichen blieb stehen.** `# Titel` wurde eine Überschrift namens
`#Titel`. Der Block bekam den richtigen Typ, aber `ct.textContent = ''`
räumte nur das Feld; das `#` war einen Tastendruck vorher schon gespeichert,
und das Neuzeichnen holte es zurück. Kein Prüflauf sah es, weil alle nur den
**Typ** verglichen. Genau der Fall aus CLAUDE.md §55.2.

Dazu: `a.` `i.` `1)` `a)` `i)` wandelten nicht um, obwohl die Doku sie
führte. `~Text~` strich nicht durch, obwohl die Doku es führte. `[x]` gab es
nicht. ` ```js ` ergab einen Codeblock ohne Sprache.

Und die grosse Lücke, die vorher gar nicht in dieser Liste stand: **Strg C
schrieb Markdown, Strg V las es nicht.** Wer eine Seite kopierte und
woanders einfügte, bekam einen einzigen Block mit allen Rautezeichen darin —
der Text war da, die Gliederung weg. Es gab überhaupt keinen `paste`-Griff
im Editor.

**Konflikte, Stand 8. August.** `test134` schickt jedes Kürzel ab und
liest `defaultPrevented`: fünfzehn nimmt Redion dem Browser ab (Strg N, P,
K, J, F, L, [, ], \, Komma und fünf mit Umschalt), und die acht, die dem
Menschen gehören, lässt es in Ruhe — Strg C, V, X, A, R, S. Das ist der
Teil, der zählt: wer Strg C global abfängt, nimmt dem Menschen das
Kopieren aus jedem Textfeld.

**Zwei standen auf der falschen Seite.** Strg T und Strg W waren an
Redions eigene Reiter gebunden. Der Browser gibt beide nicht her, also
geschah beides — Redion schloss seinen Reiter, der Browser das Fenster
darüber. Seit E62 liegen sie auf **Strg Alt N** und **Strg Alt W**.

**Was dabei NICHT nachweisbar ist.** Dass der Browser sie nicht hergibt,
kann dieser Prüfstand nicht zeigen: Playwright schickt Tastendrücke an die
Seite, nicht an die Browseroberfläche. Es wurde deshalb nicht bewiesen,
sondern ausgewichen — die Abwägung dazu steht in E62.

Strg Tab und Strg 1…9 sind derselbe Fall und bleiben gebunden: sie
zerstören nichts, im schlimmsten Fall wechselt zusätzlich der
Browserreiter.

Fehlt noch: ein Weg, Browserkürzel wirklich zu messen · die 33 fehlenden
Tastenkürzel · Markdown-Tabellen beim Einfügen (`| a | b |`) ·
verschachtelte Zitate.

## L21 · ~~Vollständige Verschlüsselung~~ — GESCHLOSSEN

**Stand — ✅ die drei genannten Punkte gibt es seit E122.** Dieser Absatz
stand hier, seit er geschrieben wurde, und wurde danach nie nachgesehen:

```txt
verschlüsseltes `.redion` mit Anhängen   Paketfassung 2, `paketBauen`
verschlüsselte Anhänge                   als eigene Einträge im Paket
Schlüsselwechsel                         `paketPasswortWechseln`
```

Alle drei fährt `test199` ab — mit einem echten Anhang, dem Zurückholen
daraus und dem Passwortwechsel ohne Neuverschlüsseln (33 Punkte).

**Was NICHT gebaut ist und auch nicht gemeint war:** Verschlüsselung des
LAUFENDEN Bestands. Heute liegt die IndexedDB im Klartext, und einzelne
Seiten lassen sich sperren. Alles zu verschlüsseln hiesse: jeder Lese- und
Schreibvorgang durch AES, ein verschlüsselter Suchindex — und ein
vergessenes Passwort bedeutet Totalverlust, nicht eine gesperrte Seite. Das
ist eine eigene Entscheidung mit eigenen Abwägungen und keine Lücke, die man
nebenbei schliesst.

## L22 · ~~Leistung bei sehr grossen Arbeitsbereichen~~ — GEMESSEN

**Stand — ✅ gemessen mit E180 (25. August 2026).** Diese Lücke bestand aus
einer Vermutung. Nachgemessen an 8000 Blöcken sieht es so aus:

```txt
8000 Blöcke anlegen und einmal schreiben        1,5 s
Neu laden, bis der Bestand steht                0,5 s
`Store.search` über alles                       68 ms
`Store.baum` über den ganzen Baum               20 ms
`exportAll` über 4,9 MB                         29 ms
2000 Zeilen filtern und sortieren                2 ms
Eine Seite mit 201 Kindern zeichnen             53 ms
```

Die vier genannten Punkte einzeln:

```txt
Messungen mit zehntausend Seiten   jetzt da — `test233`, an 8000 Blöcken
virtualisierte Listen              die Ansicht zeigt 50 von 2000; das ist
                                   die Begrenzung, nicht das Problem
Suchindex, der nicht neu entsteht  liegt im Fach `suchindex` und wird beim
                                   Start gelesen, nicht gebaut
Speichermessung bei Export/Import  eine 4,9-MB-Sicherung entsteht in 29 ms
```

**Und der eine Fund, der dabei herauskam, ist kein Leistungsproblem.** Eine
Ansicht zeigte 50 von 2000 Zeilen und sagte es nicht. Eine Tabelle, die
einen Teil zeigt und aussieht wie das Ganze, ist die gefährlichere Sorte
Unvollständigkeit: man merkt sie erst, wenn man etwas sucht, das dasteht und
nicht gefunden wird. Jetzt steht „50 von 2000 Zeilen" darunter, mit „Mehr
laden" und „Alle zeigen" daneben.

**Was offen bleibt:** die Zahlen oben stammen von einer Maschine. Ob sie auf
einem sechs Jahre alten Telefon ebenso aussehen, sagt kein Prüflauf im
Container. `test233` misst deshalb Formen und Zahlen — wie viele Sätze
angefasst werden, wie viele Knoten im Bild stehen — und setzt Zeitschranken
so weit, dass sie eine langsame Maschine nicht reissen und ein quadratischer
Algorithmus sofort.

Prüflauf: `test233`, 22 Punkte.

## L34 · ~~Ein Wert, der an zwei Stellen steht~~ — abgearbeitet

**Stand** — ◐ dreimal behoben (E64 zweimal, E65), der Rest ist gelistet.

Am 8. August dreimal an einem Tag gefunden: eine Zahl steht an zwei
Stellen, nichts erzwingt Gleichheit, und die Abweichung ist erst nach dem
Rollen sichtbar. Danach wurde gezielt gesucht — fünf Blickwinkel,
22 Kandidaten.

**Behoben**

```txt
ZH_HANDY gegen --tbl-zh, im Tabellenblock          E64
ZH_HANDY gegen --tbl-zh, im Datenbankraster        E64
tempo.ts rechnete mit 34 px je Zeile               E65 — jetzt gemessen
RedionPackageData sagte Listen, es sind Verzeichnisse  E66
ViewLayout kannte `raster` nicht                   E66
Überschriften standen in zwei Katalogen            E66 — jetzt im Register
STUECK, KLEIN und DATEI_MAX je zweimal             E67 — jetzt aus KONSTANTEN
Die Serverzahl 100 MB stand blank in maschine.ts   E67 — benannt und geprüft
Die Telefongrenze stand als 700, 760 und 768       E68 — jetzt eine
Die Schublade begann bei 60 px, die Leiste bei 80  E68 — jetzt --hoben
Ziffer→Blockart stand viermal                      E69 — jetzt aus `kurz`
Das Typmenü hatte keine Auffanggruppe              E69 — jetzt schon
Der Ablagename stand blank im Dienstarbeiter        E70 — benannt, geprüft
Offline-Vorrat gegen index.html                     E70 — beide Richtungen
EINFACHE_TYPEN stand zweimal in einer Datei         E70
```

**Stand: ✅ abgearbeitet** (8. August 2026). Auch die letzten drei:

```txt
`Register.eigenschaften` hat jetzt `nimmZurueck` — nach dem Vorbild von
`bloecke`, Eingebautes bleibt unabmeldbar. test142 benutzt es, statt die
Unwucht nur festzuhalten.
KACHEL (256) und die Seitenleistenbreite (260) stehen weiter je zweimal —
CSS kann keine Konstante importieren. test143 §5 rechnet beide Paare nach
und misst den Doppelklick-Rücksetzer obendrein.
```

**Ein Fehlalarm war auch dabei** — `#topbar .nur-telefon` wird absichtlich
ausgeblendet, seit die Pillenleiste die Kopfleiste ist.

**Die Lehre, dreimal bestätigt** — wo ein Wert schon irgendwo steht, soll
man ihn **lesen**, nicht abschreiben. Geht das nicht, weil das Rechnen ihn
vor dem Zeichnen braucht, dann muss ein Prüflauf die Gleichheit nachrechnen.
Ein Kommentar „muss übereinstimmen" reicht nicht: genau der stand bei
`ZH_HANDY` und hat nichts verhindert.

# Später

## L36 · ~~Rein numerische Spaltenschlüssel im Bestand~~ — GESCHLOSSEN

Bis E96 entstanden Spaltenschlüssel als Hex-Schnipsel — 9,6 % davon
rein numerisch, und solche Schlüssel sortiert JavaScript in
`Object.keys` vor alle anderen: die Spalte steht immer ganz links,
egal wo sie eingefügt wurde. Neue Schlüssel beginnen seit E96 nie mehr
mit einer Ziffer (test170); test33s alte Erklärung dafür („fremdes
Menü") ist berichtigt.

Offen bleibt der BESTAND: eine vor E96 angelegte Spalte kann einen
rein numerischen Schlüssel tragen und bleibt dann vorn einsortiert,
bis sie neu angelegt wird. Eine stille Umbenennung wäre eine
Datenmigration (Bezüge in Zeilen, Ansichten, Formeln, Automationen,
Sicherungen) — die gibt es nur mit eigenem Plan und Tests (§9).

---

**25. August 2026 — E172. Der Plan und die Tests sind da.**

Der Umzug `spaltenschluessel-ohne-ziffer` benennt `4711` in `s4711` um und
zieht den Namen überall mit — nachgesehen ergaben sich zwölf Stellen:

```txt
schema[key] · props[key] in jeder Zeile · auch im Papierkorb
groupBy · sorts[].key · filters.rules[].key · hidden[] · calc{} · breiten{}
automationen: wenn.key und die dann-Schritte
Rollups: relation hier, zielKey drüben
```

Und eine Stelle, an der ausdrücklich NICHTS geändert wird: Formeln.
`prop("Punkte")` spricht die Spalte über ihren Anzeigenamen an, nicht über
den Schlüssel — nachgesehen in `dienst.ts`, `formelRechnen`.

Drei Dinge, die beim Bauen herauskamen:

```txt
· Die ursprüngliche Stelle der Spalte ist NICHT wiederherstellbar. Sie war
  nie gespeichert; `Object.keys` hat sie schon beim Anlegen nach vorn
  gezogen. Der Umzug erfindet sie deshalb nicht — er lässt die Spalte, wo
  sie zu sehen war, und macht sie beweglich. Das ist der ganze Gewinn, und
  test227 §2 misst genau ihn: vorher ans Ende geschoben und wieder vorn,
  nachher ans Ende geschoben und dort geblieben.

· Stumpfes Ersetzen wäre falsch. „4711" ist in einer Farbregel ein WERT und
  in einer Zelle Inhalt. Also: Objektschlüssel überall, Werte nur an
  benannten Stellen. Gegengeprobt, indem `wert` in die Liste aufgenommen
  wurde — die Farbregel bricht.

· Der Weg, auf dem der Fall heute überhaupt noch auftritt, ist die
  eingespielte Sicherung — und genau dort lief der Umzug nicht. Er läuft
  beim Start, die Sicherung kommt danach. `importAll` stösst die Umzüge
  jetzt noch einmal an.
```

Prüflauf: `test227`, 29 Punkte, sechs Gegenproben.

## L23 · ~~Abfragesprache für normale Nutzer~~ — GESCHLOSSEN

**Stand — ✅ geschlossen mit E175 (25. August 2026).**

Diese Lücke bestand aus einem Satz, und der Satz war zur Hälfte schon
erfüllt: die Abfragesprache steht seit dem 22. August in
`src/kern/suche/query.ts` — neun Suchbefehle (`titel:`, `inhalt:`, `tag:`,
`typ:`, `geändert:`, `status:`, `in:`, `nach:`, `vor:`), Anführungszeichen
für die genaue Wendung, Erkennung widersprüchlicher Angaben und
Fehlermeldungen in Worten statt null Treffern.

**Und kein einziger Prüflauf nannte sie.** Das ist die gefährlichere
Hälfte: bei E122 lag genauso viel fertiger Code herum, dessen
Einstiegspunkte gar nicht erreichbar waren, und niemand hatte es gemerkt.
`test229` fährt die Sprache jetzt über das echte Suchfenster ab.

Beim Abfahren fand sich der Teil, der wirklich fehlte: **Kennungen.**
`Store.search` findet eine Seite über ihre Kennung, schneidet sie sogar aus
einer ganzen Adresse heraus — das Suchfenster ging seit der Abfragesprache
daran vorbei und sagte „Nichts gefunden". Der Zweig steht jetzt in der
Schale und nicht in `query.ts`: die Sprache kennt weder DOM noch Ablage,
und das soll so bleiben.

## L24 · ~~Entscheidungs- und Wissensgraph~~ — geschlossen

**Stand — ✅ geschlossen.** Redion besitzt einen einzigen abgeleiteten Graphen
für Seiten, Zeilen, Entscheidungen, Quellen und Schlagwörter. Backlinks,
Relationen, Baumkanten, Filter und begrenzte 1-/2-Hop-Ausschnitte verwenden
denselben Bestand; Lernquellen werden am normalen Block verknüpft. Ink-Striche
werden bewusst nicht zu Graphknoten.

## L25 · ~~Universelle Begriffe und Aliase~~ — GESCHLOSSEN

**Stand — ✅ geschlossen mit E129.** Seiten tragen additive `aliases`. Titel,
Alias, Vault-/Hierarchiepfad und `redion:<id>` laufen durch einen zentralen
Resolver. Suche, Wikilinks, Picker, Backlinks, unverlinkte Erwähnungen, Graph
und Obsidian-Import verwenden ihn. Eine Kollision liefert Kandidaten und nie
willkürlich den ersten Treffer.

## L26 · ~~Import aus anderen Werkzeugen~~ — GESCHLOSSEN

**Stand — ✅ seit E182 (25. August 2026).**

Trello, Evernote, Obsidian, Notion-Export, CSV — und jetzt Asana und Apple
Notes mit eigenem Einleser. Jira gibt es als gespiegelte Datenbank über
`datenbanken/spiegel/dienst.ts`, zusammen mit GitHub; das ist etwas anderes
als ein einmaliger Import (es hält die Verbindung), deckt aber denselben
Wunsch.

**Der Knopf, der den Export kennt, war der ganze Unterschied.** Asana kam
schon über den allgemeinen CSV-Weg herein — aber als lauter Textspalten:

```txt
Section/Column  →  Text     statt  Status (und Gruppierung)
Due Date        →  Text     statt  Datum
Tags            →  Text     statt  Mehrfachauswahl
Completed At    →  Text     statt  Haken
Notes           →  EINE ZELLE mit der ganzen Beschreibung darin
```

Die letzte Zeile ist der eigentliche Verlust: eine Aufgabenbeschreibung in
einer Tabellenzelle kann man nicht lesen und nicht gliedern. Sie steht da
und ist unbenutzbar, und das sieht nicht nach einem Fehler aus, sondern nach
einer langen Spalte. Jetzt wird sie Seiteninhalt.

Apple Notes kam gar nicht herein; jetzt wird der Ordner mit den HTML-Dateien
gelesen, Unterordner bleiben Unterordner, und Checklisten werden echte
Aufgaben statt Aufzählungspunkte mit einem Kästchen im Text.

**Was NICHT gebaut ist:** ein Einleser je Werkzeug für alles Übrige. Der
allgemeine CSV-Weg steht weiter daneben — jetzt unter eigenem Namen („Jira,
Monday, sonstige CSV") statt als Anhängsel von Asana — und er liest jede
Tabelle. Ein eigener Knopf lohnt erst, wenn ein Export feste Spaltennamen
hat, die man kennen KANN. Bei Asana und Apple Notes ist das so; bei „irgend
eine CSV" ist es das nicht.

Prüflauf: `test235`, 63 Punkte, mit fünf nachgewiesenen Gegenproben.

## L27 · ~~Import-Assistent (Power-Query-ähnlich)~~ — GESCHLOSSEN

**Stand — ✅ geschlossen mit E178 (25. August 2026).**

Vier der sechs Handgriffe gab es schon, als diese Lücke geschrieben wurde —
nachgesehen, nicht angenommen:

```txt
Typen erkennen                `Spaltentyp.erkenne`, beim CSV-Einlesen
Vorschau vor dem Übernehmen   derselbe Weg: erst nachsehen, dann fragen
Duplikate entfernen           `Pflege.dublettenDialog`
Dateien kombinieren           ein zweites CSV in dieselbe Datenbank
```

Die zwei fehlenden — **Spalten bereinigen** und **Werte ersetzen** — stehen
jetzt unter „Spalten aufräumen …" im Datenbankmenü, mit Vorschau davor und
einer Prüfung des Plans gegen den Bestand beim Übernehmen.

Prüflauf: `test232`, 32 Punkte.

## L28 · ~~Was-wäre-wenn: Zielwertsuche, Szenarien, Solver~~ — GESCHLOSSEN

**Stand — ✅ geschlossen mit E176 (25. August 2026).**

Alle drei laufen über dieselbe kleine Maschine in
`src/bereiche/datenbanken/whatif.ts`: eine Stellschraube (eine schreibbare
Zahlenspalte) und ein Ziel (eine gerechnete Spalte) in derselben Zeile.

```txt
Zielwertsuche   Fenster öffnen, dann halbieren — keine Ableitung nötig,
                also auch bei Formeln mit WENN belastbar
Optimierung     Goldener Schnitt zwischen zwei Grenzen
Szenarien       benannte Sätze von Annahmen an der Sammlung, mit Vorschau
```

**Die Regel, an der alles hängt: beim Suchen wird nichts geschrieben.**
Gerechnet wird auf einer Kopie der Zeile; erst „Übernehmen" schreibt.
Gegengeprobt, indem der Probewert doch in die Zelle geschrieben wurde —
danach steht in der Zelle irgendein Zwischenwert, die Optimierung läuft an
den Rand und der Zeitstempel der Zeile ist verschoben.

Und ein Fehler, der ohne Messung nicht aufgefallen wäre: die Probezeile
trägt dieselbe Kennung wie das Original, und `Tempo` wie `Vorrat` merken
sich Formelwerte unter der Zeilenkennung. Die Suche sah eine Gerade, wo eine
Kurve ist, und fand gar nichts. `Datenbank.wertFrisch` rechnet ohne beide.

Prüflauf: `test230`, 36 Punkte, zwei Gegenproben.

## L29 · Suche in Bildern, PDFs und Audio — GRUNDSTUFE STEHT, REST ENTSCHIEDEN

**Stand — ◐ die local-first Grundstufe steht (E130).** Native PDF-Textebene
und optionale OCR bleiben getrennt. Bilder, PDF-Ausschnitte und Ink-Regionen
können nach sichtbarer Zustimmung an einen konfigurierten localhost-Dienst
gehen; Text, Engine, Sprache, Vertrauen und Region werden zusätzlich
gespeichert und durchsucht, das Original wird nie überschrieben. Audio-
Transkripte sind normale durchsuchbare Textblöcke mit Zeitmarken.

Bewusst offen bleiben eine eingebettete OCR-Engine samt Grössen-/Lizenzbudget,
automatische Perspektivkorrektur mehrseitiger Kamera-Scans und fortlaufende
Segmenttranskription während sehr langer Aufnahmen. Ohne diese Zusätze bleibt
Erfassen, Lesen und Aufnehmen vollständig benutzbar.

**25. August 2026 — warum die eingebettete Engine nicht kommt.** Eine OCR-
Engine im Browser wiegt zweistellige Megabyte, und sie wiegt sie bei JEDEM
Start, für jeden Nutzer, auch für die grosse Mehrheit, die nie ein Bild
durchsuchen will. Das steht gegen §36 (Redion soll auf schwachen Geräten
laufen) und gegen §29 (die Einzeldatei bleibt handhabbar). Der eingerichtete
localhost-Dienst kostet dagegen nichts, solange man ihn nicht benutzt — und
er verlässt den Rechner nicht.

Das ist dieselbe Abwägung wie bei WebLLM (§21: „nicht automatisch laden"),
und sie fällt hier genauso aus. Nicht gebaut, mit Grund, nicht vergessen.

## L30 · Erweiterungen und Marktplatz — BEWUSST NICHT GEBAUT

**25. August 2026 — entschieden statt offengelassen (E181).**

Diese Zeile stand als Wunschliste da, ohne einen Satz dazu, ob sie überhaupt
zu Redion passt. Sie tut es nicht ohne Weiteres:

```txt
Eine Erweiterung ist FREMDER CODE im selben Fenster wie die Notizen.
Er sieht IndexedDB, `Store`, die Zwischenablage und jedes offene Dokument.
```

CLAUDE.md §19 verbietet `eval()` und ungeprüftes `innerHTML`; §47 verbietet
fremden Code aus Formeln. Ein Erweiterungssystem wäre die grösste Ausnahme
von beidem, die es je gäbe.

Es sicher zu bauen bräuchte: eine echte Sandbox (eigener Ursprung, `iframe`,
Nachrichten statt Zugriff), ein Rechtemodell je Erweiterung, Signaturen und
einen Weg, eine Erweiterung im Nachhinein zurückzuziehen. Das ist ein
eigenes Projekt und nicht eine Zeile in einer Lückenliste.

**Also: nicht gebaut, und das ist die Entscheidung — kein Versäumnis.** Wer
Redion erweitern will, hat heute drei Wege, die ohne Fremdcode auskommen:
die Register (`bloecke`, `eigenschaften`, `formeln`, `befehle`), die
Automationen, und `.redion`-Sicherungen als Datenschnittstelle.

## L31 · ~~Öffentliche Seiten, SEO und Demo~~ — GESCHLOSSEN

**Stand — ✅ geschlossen mit E177 (25. August 2026).**

```txt
Export als statische Seite   gab es schon — `Werkzeuge.htmlExport`
robots.txt · ai.txt          neu in `oeffentlich/`
sitemap.xml                  neu, mit EINER Adresse: ohne Server gibt es
                             keine zweite, und eine erfundene Liste altert
Demo-Modus                   `index.html?demo` — eine EIGENE Ablage
keine privaten Daten         gemessen, nicht behauptet: `test231 §2` liest
                             das ausgelieferte HTML und sucht darin nach
                             Notizinhalt
```

Der Vorführmodus trennt über den ABLAGENAMEN (`notizen-demo`), nicht über
einen Schalter im Code: zwei Namen sind zwei Datenbanken, und die Trennung
setzt der Browser durch. Ein Schalter, der an dreissig Stellen abgefragt
wird, ist an der einunddreissigsten vergessen.

Zwei Fehler, die nur das Hinsehen fand (§55):

```txt
· Der Balken war `position:sticky` und damit ein Flex-Element von `body` —
  und `body` ist eine Flex-ZEILE. Er bekam eine eigene Spalte über die
  volle Höhe: der halbe Bildschirm orange, der Text ein Streifen am Rand.
  „Ein Balken steht da" war dabei grün.
· Weiss auf dem Orange ergibt 2,6:1 — unter den 4,5:1 aus §38. Jetzt
  dunkles Braun, 7,7:1, und `test231` misst das Verhältnis.
```

Prüflauf: `test231`, 29 Punkte.

## L32 · Die 62 Integrationen — ENTSCHIEDEN, NICHT OFFEN

**Stand — ◐ 8 von 62, und die Zahl ist kein Rückstand.**

Die meisten der 62 brauchen ein OAuth-Geheimnis. Ein OAuth-Geheimnis im
Browser ist kein Geheimnis — es steht im Quelltext jeder ausgelieferten
Seite. Also gehen ohne Server nur die, die einen persönlichen Schlüssel
akzeptieren, den der Nutzer selbst einträgt. Das sind die 8.

Der Rest hängt an E2 (Cloudflare) und wird dort eingeordnet, nicht hier.
Die vollständige Begründung steht in `ENTSCHEIDUNGEN.md` E23.

**Was daneben schon geht, ohne in dieser Zahl zu stehen:** gespiegelte
Datenbanken zu Jira und GitHub (`datenbanken/spiegel/dienst.ts`), Import aus
Trello, Evernote, Obsidian, Notion, Asana, Apple Notes und beliebiger CSV
(L26, E182), und `.redion` als Datenschnittstelle in beide Richtungen. Der
Wunsch hinter „Integration" ist meistens „meine Daten aus X hier haben" —
und dafür braucht es keinen OAuth-Server.

**Nicht tun:** Integrationen zählen, ohne zu prüfen, ob sie ohne Server
überhaupt gehen können.

---

# Anhang A · Was gemessen wurde

Diese Zahlen sind die Grundlage für mehrere Lücken. Sie stehen hier, damit
sie nicht neu gemessen werden müssen.

| Liste | Notion | Redion | Stand |
|---|--:|--:|:--:|
| Blocktypen | 97 *(Alt-Messung, Einzelliste nicht archiviert)* | 76 — `doku/BLOCKTYPEN.md`, gehalten von test164 | ✅ |
| Eigenschaftstypen | 29 | 35 | ✅ |
| Ansichten | 11 | 12 | ✅ |
| Tastenkürzel | 160 | 127 | ◐ |
| Markdown-Kürzel | 48 | 33 | ✅ — siehe L20, jetzt getippt statt gezählt |
| Einstellungs-Optionen | 111 | 143 | ✅ |
| Formelfunktionen | 125 | 158 | ✅, aber 129 ohne Beschreibung |
| Excel-Startpaket | 63 | 61 | ✅, 2 fehlen mit Absicht |
| Integrationen | 62 | 8 | ◐ — siehe E23 |

**Nicht gezählt:** Bedienelemente (Notion: 175) · Trigger, Bedingungen und
Aktionen (15/24/19) · Aggregationen (21).

**Wie gezählt wurde.** Nicht per `grep` über `id:` — das zählt Kommentare und
Beispiele mit. Die Register wurden **geladen und befragt**, mit der
Formel-Laufzeit daneben. Die erste Messung ohne das lag um den Faktor zehn
daneben: 12 Kürzel statt 127, 20 Formeln statt 158. Siehe `ENTSCHEIDUNGEN.md`
E21.

---

# Anhang B · Was erledigt ist

Eine Zeile je Punkt, mit dem Prüflauf, der ihn hält.

**Etappe 1 — die lokale App stabil machen**

| | was es war | hält es |
|---|---|---|
| E1 | Der Umzug einer alten Ablage war nie durchgespielt worden | `test95` |
| E2 | Die Sicherung enthielt den Versionsverlauf nicht | `test96` |
| E3 | Der Papierkorb zeigte keine Blöcke; „endgültig gelöscht" liess Fassungen und Anhänge liegen | `test97` |
| E4 | Dreissig Fassungen reichten zwei Stunden zurück — jetzt wird ausgedünnt | `test98` |
| E5 | Zwei Tabs wussten nichts voneinander und überschrieben einander | `test99` |
| E6 | Anhänge fehlten in der Sicherung — jetzt `.redion`, auch mit 500 MB | `test100` |

**Sicherheit und Rechte**

| | was es war | hält es |
|---|---|---|
| D1 | Keine Obergrenze für den Anfragekörper | `test101` |
| D2 | Kein Bremsen bei Fehlversuchen an Login und öffentlichen Seiten | `test93` |
| D3 | Sicherheits-Kopfzeilen fehlten für die Antworten des Workers | `test93`, `test94` |
| D4 | Der 500er gab die Meldung einer Ausnahme ungeprüft nach draussen | `test93` |
| D5 | Eine Marke mit „nur lesen" konnte sich selbst eine mit „alles" ausstellen | `test102` |
| D6 | „Rechts einfügen" setzte die Spalte manchmal ganz nach links | `test33` |

**Sicherung und Format**

| | was es war | hält es |
|---|---|---|
| C1 | Ein ZIP mit 70 000 Einträgen nannte 4 464 und sah gesund aus | `test103` |
| C2 | Ein fremdes ZIP64-Archiv importierte als „0 Anhänge", ohne Fehler | `test103` |
| C3 | Die verschlüsselte Wiederherstellung meldete Erfolg und warf die Daten 900 ms später weg | `test104` |
| C4 | Verschlüsseln scheiterte ab ~128 KB — dieselbe Zeile an drei Stellen | `test104`, `test87` |
| C5 | Die verschlüsselte Sicherung enthielt weder Verlauf noch `fehlt`-Angabe | `test104` |

**Formeln und Excel**

| | was es war | hält es |
|---|---|---|
| X1 | 37 Excel-Funktionen liefen, keine unter deutschem Namen | `test106` |
| X2 | `WENN` rechnete den nicht genommenen Zweig mit, `if` nicht | `test106` |
| X3 | `ABRUNDEN(-2,5)` gab −3 statt −2 — floor statt „zur Null hin" | `test106` |
| X4 | Elf deutsche Namen zeigten auf Funktionen mit anderer Bedeutung | `test106` |
| X5 | Suche/Verweis fehlte ganz — `SVERWEIS`, `SUMMEWENN`, `INDEX`, `FILTER` | `test107` |
| X6 | `namen()` verschwieg neun Funktionen, die die Maschine kann | `test107` |

**TypeScript**

| | was es war | hält es |
|---|---|---|
| B1 | Keine Typen, kein Typecheck | `npm run typecheck` |
| B2 | Kein Weg von `.ts` nach `.js` ohne Pflicht-Bauschritt | `test105` |
| B3 | Erzeugtes JavaScript konnte still von seiner Quelle abdriften | `test105` |

**Umbauten am Aufbau** — Seitenleiste, Kopfleiste und Inhaltsfläche aus
`schale.js` herausgelöst · Stilblatt in sechs Dateien geteilt · `datenbanken`
und `wissen` in `dienst` und `ansicht` getrennt · PWA und Icons repariert.

Die zwölf Muss-Regeln Sicherheit aus dem Auftrag sind alle erfüllt: Tokens und
Passwörter nur als Abdruck · zeitkonstanter Vergleich · HTML gesäubert · keine
ungeprüften Weiterleitungen nach OAuth · CORS eingeschränkt · serverseitige
Rechte · keine geheimen Schlüssel im Frontend · Eingaben begrenzt · Bremse ·
Kopfzeilen · keine sensiblen Daten in Logs.

**Der Tabellenblock** — gefunden beim Bauen, alle mit einem Prüflauf dahinter.

| | was es war | hält es |
|---|---|---|
| T1 | Feste Bezüge gab es nicht: `\b` passt nicht vor `$`, aus `=$A$1` wurde `$prop("A1")` — beim Ausfüllen wanderte `$A$1` mit, statt stehen zu bleiben | `test110` |
| T2 | Eine zu lange Zahl wurde vorne abgeschnitten und zeigte damit **eine andere Zahl** (`634.21…` als `34.21…`) | `test111` |
| T3 | Das blosse Öffnen einer Seite schrieb in die Ablage: neues `edited`, ein Schritt im Rückgängig-Stapel. Beim Abgleich hätte das nur-angesehene Gerät gegen die echte Änderung gewonnen | `test111` |
| T4 | Jedes Neuzeichnen hängte einen `mouseup` ans Dokument, den nichts abhängte | `test111` |
| T5 | `Entf` löschte mit dem Inhalt auch Fett, Ausrichtung und Währung | `test110` |
| T6 | Am Telefon stand die halbe Werkzeugleiste ausserhalb des Bildes — darunter der Weg zu „Als Excel speichern" — und das Eingabefeld war auf null Pixel gequetscht | `test111` |
| T7 | Am Telefon war jede Spalte zu schmal für einen Betrag: bei 16 px Schrift stand bei jedem `1’450.00 CHF` ein `###` | `test111` |
| T8 | Das Raster hatte keinen sichtbaren Fokus — mit der Tastatur sprang man hinein, und nichts änderte sich | `test111` |
| T9 | Ein Fehlerwert stand ohne Erklärung da: `#NAME?` und sonst nichts | `test111` |

**Und ein Fehler an einer Prüfung**, der schlimmer ist als die neun oben: die
erste Prüfung gegen T2 mass `scrollWidth` gegen `clientWidth` und bekam für
eine 21-stellige Zahl in 109 px: 109 gegen 109. Flexbox staucht den Text,
statt ihn überstehen zu lassen — es gibt gar keinen überstehenden Inhalt.
Die Prüfung hätte für immer grün gesagt.

**Der Tabellenblock, zweite Runde** — Einlesen, mehrere Blätter, Fehlerwerte.

| | was es war | hält es |
|---|---|---|
| T10 | Der Block konnte „Als Excel speichern", aber nicht öffnen — ein Rundlauf, der nicht rundläuft | `test111` |
| T11 | Der vorhandene CSV-Zerleger trennt bei Komma UND Semikolon: aus `Miete;1450,50;Januar` werden fünf Felder statt drei, und der Betrag ist weg | `test110` |
| T12 | … und er wirft leere Zeilen weg, wodurch in einer Tabelle alles darunter um eins hochrutscht | `test110` |
| T13 | `'Mein Blatt'!A1` wurde als Zeichenkette gelesen — heraus kam `'Mein Blatt'!prop("A1")` | `test110` |
| T14 | `=1/0` ergab 0. In einer Datenbank richtig, in einer Tabelle eine Null, die aussieht wie ein Ergebnis | `test110` |
| T15 | Beim Prüfen des Arguments wurde nicht nachgesehen, ob es die Funktion gibt: `=LOG(0)` ergab `#ZAHL!` statt `#NAME?` — ein Rechenfehler für einen Tippfehler | `test110` |

**Das Datenbankraster** — gefunden beim Bauen.

| | was es war | hält es |
|---|---|---|
| T16 | Ein Zeitstempel stand roh in der Spalte: `2026-08-04T17:57:39.184Z`. Ein gültiger Text, der durch jede Typprüfung geht — und den niemand liest. Gesehen erst auf dem Bildschirmfoto | `test112` |

**Import** — die Sorte Fehler, die man an der falschen Summe merkt.

| | was es war | hält es |
|---|---|---|
| T17 | Der CSV-Import der Datenbanken trennte bei Komma UND Semikolon: aus `Miete;1450,50;Januar` wurden fünf Felder statt drei | `test112` |
| T18 | … und übernahm alles wortlos — Zeilen anlegen UND Spalten ans Schema hängen, ohne zu fragen | `test112` |
| T19 | Jede eingelesene Spalte wurde Text. Eine Summe darüber ergibt 0, Sortieren sortiert alphabetisch (`100` vor `20`), „grösser als" hat nichts zu vergleichen — gemerkt an der falschen Summe, nicht am Import | `test110` |

**Der Abgleich** — Phase 9, G3. Geprüft, bevor Cloud-Sync gebaut wird.

| | was es war | hält es |
|---|---|---|
| S1 | Die Ausgangsschlange konnte eine Millisekunde zerschneiden: `edited <= marke` schloss den Rest **für immer** aus. Der Satz stand auf dem Gerät und kam nie in der Wolke an — kein Fehler, keine Meldung | `test113` |

## L33 · ~~Erinnerungen, wenn Redion geschlossen ist~~ — GESCHLOSSEN (E54)

**Stand** — ✅ mit Server (8. August, E54); ohne Server melden sie sich
weiterhin beim nächsten Öffnen.

Seit dem 6. August: der Dialog schlägt die Zeit in **Ortszeit** vor (vorher
zwei Stunden daneben — Weltzeit), er übernimmt die Zeit aus der
Datumsspalte eines Kalendereintrags, und eine verpasste Erinnerung sagt
„Verpasst um 08:00" statt zu tun, als sei es gerade jetzt. `test124`, 20
Punkte, mit Telefon-Bildmass und Zeitzone.

**Am 7. August behoben: sie erschienen auf dem iPhone GAR NICHT.** Redion
zeigte sie mit `new Notification(…)` in einem `try/catch`. Eine
**installierte** Web-App kennt diesen Konstruktor auf iOS nicht — Apple
unterstützt ausschliesslich `registration.showNotification()`. Der Aufruf
warf `Illegal constructor`, das `catch` verschluckte es, und übrig blieb der
Hinweis innerhalb der App. Wer Redion offen hatte, hielt den Toast für
alles, was es gibt; wer sie geschlossen hatte, bekam nichts.

Jetzt geht der Weg über die Registrierung, mit `new Notification` als
Rückfall für den Start ohne Dienst-Skript (Doppelklick aus dem
Dateisystem, §6). Ein Tipp auf die Meldung landet im Dienst-Skript
(`notificationclick`) und holt ein offenes Fenster nach vorn, statt ein
zweites zu öffnen. `test124` Abschnitt 6, elf Punkte — geprüft, indem der
Prüflauf dem Browser dieselbe Einschränkung gibt wie iOS.

**Am 8. August gebaut: Web Push (E54).** Ist Redion um acht Uhr
geschlossen, klingelt es jetzt trotzdem — sofern ein Server mit VAPID-
Schlüsseln dahintersteht. Anmeldung je Gerät, ein Zeitpunkt in der
Tabelle `weckrufe`, ein geplanter Lauf jede Minute.

**Der Stoss trägt dabei nichts.** Der Server erfährt einen Zeitpunkt und
die Adresse eines Geräts — nicht den Text, nicht die Seite, nicht den
Grund. „Zahnarzt 14:00" ist genau die Sorte Satz, die local-first
schützen soll. Das Dienst-Skript liest nach dem Aufwachen aus der lokalen
IndexedDB, was fällig ist. `test131`, 44 Punkte; Abschnitt 5 prüft
ausdrücklich, dass kein Erinnerungstext hinausgeht.

**Was dafür nötig ist:** ein Server mit D1, VAPID-Schlüssel als Secrets und
der Cron-Eintrag in `wrangler.toml` (steht auskommentiert da, mit der
Anleitung daneben). Ohne all das bleibt alles, wie es war — Web Push ist
eine Zugabe des Cloud-Modus, keine Voraussetzung (CLAUDE.md §22).

**Auf dem iPhone kommt eine Bedingung dazu:** Systemmeldungen zeigt dort nur
die **installierte** App (Teilen → „Zum Home-Bildschirm", ab iOS 16.4). In
Safari selbst erscheint die Erinnerung nur innerhalb von Redion. Der Dialog
sagt das jetzt, statt es den Menschen herausfinden zu lassen.

**Regel** — was die App verspricht, muss sie halten können. Lieber „meldet
sich beim nächsten Öffnen" als eine Weckerfunktion, die schweigt.

**25. August 2026 — die Überschrift war die letzte offene Stelle.** Der Text
darunter sagt seit dem 8. August „✅ mit Server (E54)"; gebaut ist Web Push,
geprüft mit `test131` (44 Punkte), und „ohne Server beim nächsten Öffnen"
ist keine Lücke, sondern die Regel drei Zeilen darüber. Dieselbe Sorte
Papierlücke wie L24 und L34: im Text erledigt, in der Überschrift offen.

## L37 · ~~Was am PDF noch fehlt~~ — GESCHLOSSEN

**19. August 2026, nach E103.** Ein PDF wird jetzt zu Seiten, die man
durchblättert und beschreibt. Vier Dinge kann es noch nicht, und keines
davon ist ein Fehler — es ist Arbeit, die nicht getan ist.

**25. August 2026 — alle vier sind erledigt.** Seitenanker (E105),
Zurückholen (E106), Textsuche (E107), feiner rechnen (E173). Was von dieser
Lücke bleibt, ist eine Grenze, die bleiben soll (unten) und ein Verweis auf
L29 für eingescannte Seiten ohne Textebene.

**~~Seitenanker~~ · erledigt (E105).** Jede PDF-Seite hat neben ihrer
Seitenzahl einen 🔗, der einen Verweis auf genau sie kopiert. Beim
Nachsehen stellte sich heraus, dass Redion solche Verweise seit Langem
SCHRIEB (Strg + Umschalt + C) und nie las — der Link öffnete irgendeine
Seite, und das sah aus wie ein Erfolg.

**~~Neurasterung~~ · erledigt (E106) — und der Rest war ein Rechenfehler.**
Fehlende Seitenbilder holt ein Knopf aus dem Original zurück; das ist der
Weg, den E103 versprochen und nicht gebaut hatte.

Die „höhere Auflösung", die hier noch als Lücke stand, gibt es nicht:
1654 px über eine A4-Breite sind 1654 × 72 / 595,28 = **200 dpi**, nicht die
140, die hier und in E103 standen. 200 dpi ist Scan-Qualität. Die Lücke war
eine falsch gerechnete Zahl, nicht ein fehlendes Merkmal — nachgerechnet am
19. August (E107).

**~~Textsuche im PDF~~ · erledigt (E107).** Der Text jeder Seite wandert
beim Einlesen an den Block und steht in der Sicherung; die Suche findet ihn
und springt zur Fundstelle statt bloss zur Seite. Was bleibt: eine
EINGESCANNTE Seite hat gar keine Textebene — dafür bräuchte es OCR, und das
ist L29.

**~~Feiner rechnen~~ · erledigt (E173).** Neben der Seitenzahl steht ein ⊕,
das diese eine Seite auf 3308 px neu rechnet — 400 dpi bei A4. Die Marken
bleiben liegen, weil sie in Seitenpunkten gespeichert sind und nicht in
Bildpunkten (E100); die alte Bilddatei geht weg, sonst wüchse der Bestand
mit jedem Klick; und die gewählte Breite steht am Block, damit ein
Zurückholen aus dem Original sie nicht still auf grob zurückstellt.

Dieser Absatz stand hier zweimal mit zwei verschiedenen Zahlen: weiter
oben „200 dpi, nicht die 140, die hier standen" — und dann wieder „rund 140
dpi". Die zweite war die alte, falsch gerechnete, die E107 schon berichtigt
hatte; sie stand nur an zwei Stellen. 1654 px über 595,28 pt sind 200 dpi.

**~~Verschlüsselte PDFs~~ · erledigt (E110).** Redion fragt jetzt nach dem
Passwort, sagt beim zweiten Anlauf, dass das erste falsch war, und legt es
nirgends ab — nicht im Block, nicht in der Sicherung, nicht im Browser-
Speicher. Wer abbricht, bekommt die Datei vollständig als Anhang.

**Und eine Grenze, die bleiben soll:** Redion schreibt nie in das PDF
zurück. Anmerkungen liegen daneben. Weitergeben lässt sich das seit E108
trotzdem — Strg + P druckt Seite, Striche und Notizblätter, oder speichert
sie über den Druckdialog als PDF.

## L38 · ~~Die Präsentation kennt die neuen Blöcke nicht~~ · erledigt (E109)

**19. August 2026, bei E108 gefunden, am selben Tag geschlossen.**
`Werkzeuge.praesentation` baute Folien über eine **eigene** Kette von
Blockarten. PDF-Seiten, A4-Blätter, Tabellen und Datenbanken standen darin
nicht — und `sammle` stieg in Spalten gar nicht erst hinab, sodass eine
Schulaufgabe (die seit E104 immer in Spalten liegt) als Vortrag vollständig
leer war.

Dass es zwei Ketten gibt, ist dabei nicht falsch: Folien sind ein anderes
Medium als Fliesstext. Falsch war, dass die eine mitwuchs und die andere den
Stand von damals hielt — der wiederkehrende Befund dieses Projekts: nicht
„etwas vergessen", sondern „an einer Stelle getan und an der Nachbarstelle
nicht".

Was dabei noch auffiel und mit behoben ist: `.praesi img{max-height:52vh}`
deckelte das Seitenbild und brach damit sein Seitenverhältnis — zwei gleich
grosse A4-Seiten standen 442 gegen 541 px hoch nebeneinander.

## L39 · ~~Was der Gegenlese-Durchgang am PDF-Teil gefunden hat~~ · erledigt

**19. August 2026.** Nachdem E103–E110 grün waren, habe ich den neuen Code
noch einmal gegenlesen lassen — nicht auf „läuft es", sondern auf „was geht
schief, wenn jemand etwas anderes tut als vorgesehen".

Zwei Funde waren sofort behoben (E111 · das Manifest der Sicherung log ·
E112 · drei Stellen, an denen fremder Text ungeprüft ins HTML ging). **Die
sieben hier sind es inzwischen auch** — E115, E116 und E117, am selben Tag.
Sie bleiben stehen, weil die Liste zeigt, wonach zu suchen sich gelohnt hat:

```txt
✅ E115 · Ein Strich, der gerade gezogen wird, ist verloren, wenn der Block in
  diesem Moment neu gezeichnet wird. Zwischen `pointerdown` und `pointerup`
  steht er nur in einer Schliessungsvariablen und als Knoten im SVG — nicht
  in `marken`, nicht im Speicher. Neuzeichnen kommt beim PDF-Einlesen und
  beim Abgleich von selbst. Das ist Datenverlust, wenn auch kleiner.

✅ E116 · „Aus dem Original zurückholen" hat keine Sperre gegen sich selbst. Jede
  bildlose Seite hat einen eigenen Knopf; jeder Knopf sperrt nur SICH, und
  zwei Klicks starten zwei vollständige Läufe über dieselbe Liste. Das
  Seitenbild des Verlierers bleibt als fertiger Datei-Satz mit lebendigem
  `blockId` liegen, wo `Dateien.verwaist()` es grundsätzlich nicht findet.

✅ E116 · Bricht das Zurückholen ab, bleibt der Knopf für immer auf „wird
  gerechnet …", und die bereits gerechneten Seiten erscheinen nicht — der
  Erfolgsweg zeichnet neu, der Fehlerweg nicht.

✅ E116 · Der Fortschritt beim Zurückholen zählt zwei verschiedene Dinge
  gegeneinander: links die Seitennummer im Dokument, rechts die Anzahl der
  noch zu rechnenden Seiten. „Seite 80 von 1" ist das Ergebnis.

✅ E116 · Der Fortschrittsbalken verstummt nach 120 Sekunden und nach jeder anderen
  Meldung — `UI.toast` ist EIN Element mit EINEM Zeitgeber. Genau im langen
  Lauf, für den er da ist.

✅ E115 · `Marken.schicht` meldet seinen `pagehide`-Zuhörer nie ab. Bei jedem
  Neuzeichnen kommt einer je Blatt und je PDF-Seite dazu, samt der tiefen
  Kopie von `block.marken` und dem abgehängten SVG.

✅ E117 · Drucken hält alle Seitenbilder eines Dokuments GLEICHZEITIG als
  Base64-Zeichenketten im Speicher — ohne Obergrenze, ohne Stückelung. Bei
  achtzig Seiten sind das mehrere hundert Megabyte, und §36 sagt das
  Gegenteil.
```

Der gemeinsame Nenner der ersten vier: der Weg, auf dem alles klappt, war
gebaut; der Weg daneben — zweimal geklickt, abgebrochen, lange gewartet —
nicht. Das ist keine Nachlässigkeit im Einzelnen, sondern die Stelle, an der
ein Prüflauf nachfragen muss, statt den Erfolgsfall noch einmal zu prüfen.
`test189` und `test190` tun jetzt genau das.

**Zwei Nachbarn habe ich beim Suchen mitgefunden und NICHT behoben** — sie
gehören nicht in dieselbe Änderung, aber sie sollen nicht verschwiegen sein:

```txt
⚠ `Verweise.graph()` meldet seinen `resize`-Zuhörer nie ab
  (verweise.ts:349). Wer den Graphen fünfzigmal öffnet, hat fünfzig
  Zuhörer, jeder mit einer Zeichenfläche daran. Anders als bei E115 hängt
  das aber am Öffnen von Hand, nicht am automatischen Neuzeichnen — es
  wächst also nur, wenn jemand es wachsen lässt.

⚠ Dasselbe im Rundgang (rundgang.ts:129), einmal je Rundgang. Noch
  seltener, aber dieselbe Form.
```

**Was von der Liste bleibt, ist die Lehre, nicht der Rest.** Sieben Funde,
und nicht einer davon war ein Fehler im Erfolgsfall — jeder sass daneben:
beim zweiten Klick, beim Abbruch, nach zwanzig Neuzeichnungen, nach 120
Sekunden, bei fünfhundert Seiten. Ein Prüflauf, der nur den Erfolgsfall
abfährt, hätte keinen einzigen davon gefunden, und alle Prüfläufe vor E115
haben genau das getan.

## L40 · ~~Was der Markdown-Rundlauf noch nicht kann~~ — GESCHLOSSEN

**19. August 2026, mit E113 halb geschlossen.** „Quelltext ansehen →
Übernehmen" löscht nichts mehr: alles, was Markdown nicht tragen kann, steht
seither als Platzhalter im Text und bleibt unangetastet.

Drei Dinge gehen trotzdem verloren, und sie sind jetzt wenigstens im Dialog
benannt statt still:

```txt
✅ E165 · Farbe, Schriftgrösse und Schriftart je Block (E101). Markdown
  kennt sie weiterhin nicht — sie müssen den Weg aber auch nicht mitgehen.
  Vor dem Leeren gemerkt, nach dem Bauen wieder aufgesetzt, zugeordnet über
  Art UND Text (nicht über die Position: wer eine Zeile einfügt, bekäme
  sonst überall die Farbe der Vorgängerin). test187 §6.

✅ E120 · Die Verschachtelung von Listen. `alsMarkdown` schrieb die
  Einrückung schon immer, `ausMarkdown` las sie nicht — jede Zeile wurde
  mit `trim()` beschnitten und landete direkt unter der Seite. Seit E120
  gibt es einen Stapel von Eltern nach Einrücktiefe, und der `.md`-Import
  wurde davon besser statt schlechter: dort ist die Einrückung die einzige
  Strukturangabe, die es gibt.

✗ Ein `toggle` wird beim Zurücklesen zum `quote` — beide schreiben `> `.
  Seit E113 ist das folgenlos, weil `toggle` gar nicht mehr durch Markdown
  geht, sondern als Platzhalter überlebt. Beim Einlesen einer FREMDEN
  `.md`-Datei bleibt es dabei: was dort `> ` heisst, kann Redion nicht
  auseinanderhalten, und ein Zitat ist die harmlosere Wahl.
```

**Was von L40 blieb, war als „Frage der Form" beschrieben — und war
keine.** Dieser Absatz sagte, die Kennungen änderten sich weiter, und liess
offen, was das kostet. Nachgemessen kostet es das hier:

```txt
vier Absätze · EINEN im Quelltext geändert · übernommen
  → keine einzige der vier Kennungen überlebt
  → ein Blockverweis (#block=…, E105) zeigt ins Leere
  → ein Kommentar hängt an einem Block, den es nicht mehr gibt
```

Eine Kennung ist die Adresse eines Absatzes. Sie zu verlieren heisst, jeden
Verweis darauf zu verlieren — und zwar auch für Zeilen, die niemand
angefasst hat.

**25. August 2026 — E174 schliesst das.** Der beschriebene grosse Umbau war
nicht nötig: `ausMarkdown` legt Blöcke an genau EINER Stelle an (`lege`).
Dort wird jetzt nachgesehen, ob es diesen Block (Art, Text) schon gab, und
wenn ja, bekommt der neue Block dessen Kennung zurück. `kinderLeeren` hat
sie eben endgültig gelöscht, sie ist also frei.

Nach derselben Regel wie die Farbe seit E165 — und deshalb gibt es jetzt nur
noch EIN Gedächtnis für beides und einen Durchgang statt zweier.
`setzeWiederAuf` ist fort.

Prüflauf: `test187` §7.

Der Platzhalter selbst hat eine Eigenschaft, die man kennen muss: **wer die
Zeile löscht, löscht den Block.** Das ist so gewollt — sonst wäre „Quelltext
ansehen" nur noch zum Ansehen da — und `test187` §4 hält es fest.

## L41 · Der Weg zu einem Baustein ist nicht der Baustein

**19. August 2026, mit E118 geschlossen — aber die Frage bleibt offen.**

Drei Fehler auf einmal, und alle drei sassen nicht IN einer Funktion,
sondern an ihrem **Eingang**:

```txt
`/blatt`        legte Papier ohne beschreibbare Zeile an — die Blockart war
                im Register eingetragen, aber `umwandeln` stellt keinen
                Anfangszustand her.
Suchvorschau    las nur die direkten Kinder und nannte volle Seiten leer.
Folie           kannte nur die neue Spaltenform, nicht den Bestand.
```

Behoben sind sie. Was NICHT behoben ist, ist die Ursache dahinter: **es gibt
keine Stelle, die sagt, was eine Blockart zum Leben braucht.** `Register.
bloecke` sagt, wie sie heisst und wie man sie findet — nicht, ob sie ohne
Kinder überhaupt bedienbar ist. `spalte` weiss es selbst, `blatt` wusste es
nicht, und niemand hätte es gemerkt.

Zwei Dinge wären denkbar und sind beide nicht gemacht:

```txt
✗ Ein Feld `braucht` am Registereintrag ('eine leere Textzeile'), das
  `umwandeln` und die Zeichner gemeinsam lesen. Dann steht die Antwort an
  EINER Stelle statt in jedem Zeichner einzeln.

✗ Ein Prüflauf, der ALLE Blockarten aus dem Register über den Slash-Weg
  anlegt und für jede fragt: kann man damit etwas anfangen? `test191` fragt
  es für `blatt`, weil dort der Fehler war — die anderen sind ungeprüft,
  und die Wahrscheinlichkeit, dass `blatt` der einzige war, ist nicht hoch.
```

**Der zweite ist inzwischen gemacht — `test192`, E119.** Er legt alle 66
Blockarten an und fragt zwei Dinge: ist der Block ein leeres Rechteck, und —
falls er andere Blöcke aufnimmt — bietet er leer eine Stelle zum
Hineinschreiben? Ergebnis: `blatt` war wirklich der einzige.

Damit erledigt sich auch der erste Punkt: ein Feld `braucht` am
Registereintrag wäre eine zweite Wahrheit neben der Prüfung, und die Prüfung
ist die verlässlichere — sie misst, statt zu behaupten.

**Der Rand davon ist seit E170 mitgeprüft.**

Die erste der beiden Randbemerkungen lautete: `test192` kennt nur den Weg
über `umwandeln`, also über das Slash-Menü, und `pdfseite` und `spalte`
entstehen anders. Das stimmt nicht mehr — beide gehen jetzt durch dieselbe
Messung, und `test192 §3` rechnet aus, ob es eine dritte gibt:

```txt
alle `case`-Zweige des Zeichners
  minus alles, was §2 über das Slash-Menü wirklich erzeugt hat
  = muss genau das sein, wofür oben ein Weg von Hand steht
```

Beim Schreiben fand das drei Dinge, und das dritte ist das eigentliche
Ergebnis:

```txt
· Der erste Anlauf mass die Spalte auf dem falschen Weg. `columns` legt die
  Zeile darin GLEICH MIT an — der Auffang beim Zeichnen kommt dort nie zum
  Zug. Gegengeprobt: E102 zurückgedreht, alles blieb grün. Jetzt steht die
  leere Spalte als eigener Weg daneben — der Fall aus dem Bestand, aus der
  eingespielten Sicherung, aus der umgewandelten Folie (E118). Damit wird
  sie rot.

· Die Behauptung über den Text der PDF-Seite las die GEKÜRZTE Berichtszeile
  (26 Zeichen) statt den Text. Sie wäre für immer rot gewesen.

· `page` sah weglos aus, weil §2b sie prüft und nicht §2. Der Weg dorthin
  wird jetzt dort vermerkt, wo er begangen wird.
```

**Was weiterhin offen bleibt:**

```txt
⚠ `test192` prüft, ob man HINEINKOMMT, nicht ob das Richtige passiert, wenn
  man drin ist. Dafür sind die Suiten je Blockart da, und die gibt es nicht
  für alle 66.
```

## L42 · ~~Das verschlüsselte `.redion` schreibt, aber holt nicht zurück~~ — GESCHLOSSEN

**22. August 2026, geschlossen am selben Tag mit E123.**

Der Befund stimmte, die Vermutung darin nicht. Es lag weder an der
Aufräumschleife in `geoeffnetesPaketEinspielen` noch am verschlüsselten Paket
überhaupt: `Store.purgeBlock` löschte die Anhänge in einer abgelösten Aufgabe,
auf die niemand warten konnte, und die kam an, nachdem das Zurückholen sie
schon neu geschrieben hatte.

Betroffen war damit auch die gewöhnliche `.redion`-Sicherung — der Weg, den es
heute in den Einstellungen gibt. Gemessen, 1972 Blöcke im Bestand, dreimal von
drei Läufen der Anhang weg; mit der Behebung dreimal von drei Läufen 900 Bytes
zurück.

Die ganze Geschichte samt Messung steht in ENTSCHEIDUNGEN.md unter E123. Das
verschlüsselte Paket ist seitdem im Sicherheitsdialog erreichbar.

---

## L49 · ~~Was in der Lernwelt noch Fassade ist~~ — abgearbeitet

**24. August 2026.** Beim Beheben von E128 mit acht Agenten durchgesehen und
gegengeprüft. Was hier steht, ist NICHT von mir einzeln nachgemessen — die
Fundstellen sind belegt, die Wirkung nicht überall. Wer daran arbeitet, misst
zuerst nach.

**Zwei davon sind mit E136 erledigt** — und die Erklärung stimmte bei beiden
nicht ganz: die Tastatur scheiterte nicht am Neuzeichnen, sondern an der
Richtung, in die Ereignisse steigen. Was bleibt:

**Auch der Lernpfad ist erledigt (E164, 25. August)** — und anders als
hier stand. Die elf Stichwörter sind keine Nachlässigkeit: sie sind die
Folge aus §9 des Auftrags, und test215 §2 hält sie fest. Sie zu ersetzen
hiesse, eine Vorgabe zu brechen.

Falsch war der Satz DANEBEN. Der Kopf der Seite sagte „Der Pfad ordnet den
Stoff" auch dann, wenn keines der elf Wörter traf und die Sortierung auf
das Alphabet zurückfiel — Stufe 1 Calvin-Zyklus, Stufe 2 Lichtreaktion,
Stufe 3 Zellatmung, durchnummeriert und wie Didaktik aussehend.

Der Kopf sagt jetzt nur, was in beiden Fällen stimmt, und ein Kasten
darunter nennt die Reihenfolge oder sagt, dass es keine gibt. Eine
allgemeine Reihenfolge wäre Raten: Abhängigkeiten zwischen Themen sind
Daten, die Redion nicht hat. test215 §3 und §8.

**Das fehlende Gedächtnis ist erledigt (E163, 25. August).** `wechseln()`
setzte `zustand.simulation` auf null — wer eine Simulation beendete, das
Ergebnis ansah und dann auf „Heute" tippte, verlor die Bewertung von bis zu
dreissig Aufgaben ohne Warnung. Beendete Simulationen stehen jetzt in
`Store.setMeta` (also auch in der Sicherung, §52.10), begrenzt auf zwanzig,
und die Prüfungszentrale zeigt sie unter „Letzte Simulationen". test224 §5,
mit der Gegenprobe „unstabile Kennung → sieben Einträge statt einem".

**Der Rückfall auf alle Karten ist erledigt (E162, 25. August)** — und er
war schlimmer als hier stand. E136 hatte `nurPassendeKarten` neben
`passendeKarten` gestellt und nur die Kachel „Prüfungsfokus" umgestellt.
Drei Stellen blieben, und alle drei standen sichtbar auf dem Bildschirm:

```txt
Ohmsches Gesetz                    (dazu passt keine einzige Karte)
Fachlicher Lernstand        67 %
KARTEN 3   FEHLER 0
[Simulation starten]
```

Die Zahl, der Balken und die Simulation nahmen den ganzen Bestand. Jetzt
gibt es nur noch die ehrliche Funktion; der Rückfall steht an der einen
Stelle, wo er gewollt ist — der Simulation —, und sagt sich an. test224,
14 Punkte, mit der Gegenrichtung als §4.

**Berichtigt.** Der letzte Absatz behauptete, `bilder.mts` kenne die
Lernwelt nicht. Das stimmt seit E128/E151 nicht mehr: es gibt
`lernzentrale`, `lernpfad`, `fehler` und `pruefungen`.


## L50 · Zwei Wahrheiten über dieselben Aggregate

**24. August 2026.** `Lebensbereiche` bietet `heute`, `aufgaben`, `termine`,
`zuletzt`, `projekte`, `pdfs` und `lernkarten` an. Die Arbeitswelt benutzt
KEINE davon, sondern baut Aufgaben, Termine und PDFs ein zweites Mal nach
(arbeitswelt.ts:683-787).

Das ist keine Kopie von Daten — beide lesen denselben Bestand, und die
Produktregel „ein Objekt, viele Ansichten" bleibt gewahrt (test206 misst
das). Es sind zwei Rechenwege für dieselbe Frage, und der zweite ist immer
der schlechtere (§34). Wer eine Regel ändert, muss sie künftig an zwei
Stellen ändern und wird die zweite vergessen.

Zusammenlegen ist Arbeit mit Prüfungen dran, nicht nebenbei.

**Nachgemessen am 25. August**, damit der nächste Durchgang nicht bei null
anfängt. Die zwei Wege liefern nicht dieselbe Form, und das ist der Grund,
warum „einfach den anderen aufrufen" nicht reicht:

```txt
Lebensbereiche.aufgaben()   art · erledigt · status · faellig ·
                            ueberfaellig · collectionId  (+ AggregatBasis)

arbeitswelt.ts              id · blockId · pageId · titel · quelle ·
                            quelleName · status · datum · zeit ·
                            fertig · bearbeitbar · bereichIds
```

Die Arbeitswelt trägt zwei Dinge, die der andere Weg nicht hat: die
RECHTEPRÜFUNG (`lesbareIds`, `erlaubt('bearbeiten', …)` → `bearbeitbar`)
und die Angabe, WOHER die Aufgabe kommt (`quelle`/`quelleName`:
Datenbankzeile oder Todo-Block).

Der Weg wäre also: einen Aggregatkern bauen, der beides kann, und die zwei
vorhandenen Formen als dünne Sichten darauf. Nicht: den einen durch den
anderen ersetzen — dabei fiele die Rechteprüfung weg, und das ist die
gefährliche Richtung (§46).

**Und einmal verglichen (E169, 25. August).** Bevor man zusammenlegt, lohnt
die Frage, ob die zwei Wege heute überhaupt dasselbe sagen. Antwort: fast.
Bei Aufgaben aus Seiten und aus Datenbanken kam Zeichen für Zeichen
dasselbe heraus — bis auf einen Fall.

Ein Haken im JOURNAL stand in `Lebensbereiche.aufgaben()` und fehlte in
`Arbeitswelt.snapshot().aufgaben`. Der Grund waren zwei Fragen in einer
Zeile: die Rechtefrage und der Ausschluss von Systemseiten aus der
Seitenliste. Am gemeinsamen Ergebnis hingen fünf ganz andere Listen —
Aufgaben, Dateien, PDFs, Flächen, Inhaltsblöcke —, und damit verschwand
alles, was in Journal, Schnellnotizen oder Vorlagen steht. Behoben; test215
§9 hält beide Richtungen fest.

**Damit ist diese Lücke Hygiene, keine Fehlerbehebung.** Die zwei Wege
liefern dasselbe — gemessen, nicht behauptet. Das Zusammenlegen steht
tiefer in der Reihenfolge als vorher gedacht.

---

**25. August 2026 — E181. Das Zusammenlegen ist kleiner als gedacht, und
eine Hälfte davon war überfällig.**

Beim Nachsehen, WAS die zwei Wege wirklich teilen, stand die Rechtefrage
zweimal da — in zwei Funktionen mit demselben Namen und zwei Antworten:

```txt
arbeitswelt     pageId ? Konten.darf(a, pageId) : Konten.darf(a)
lebensbereiche  !!pageId && Konten.darf(a, pageId)
```

Bei einer LEEREN Seitenkennung sagte die eine „frag den Arbeitsbereich" und
die andere „nein". Derselbe Block war in der einen Ansicht sichtbar und in
der anderen nicht. Das ist L34 in Reinform, eine Ebene höher: ein Wert steht
an zwei Stellen, nichts erzwingt Gleichheit.

Sie steht jetzt einmal in `kern/zugang/lesefrage.ts`, mit einer
ausgeschriebenen Regel — und der Unterschied zwischen „leer" und
„weggelassen" ist Absicht, denn nur dadurch fallen beide alten Fassungen
zusammen, ohne dass sich für einen Aufrufer etwas ändert.

**Der grosse Aggregatkern bleibt ungebaut, und das ist die Entscheidung.**
Die zwei Wege liefern dasselbe (E169, gemessen), und der eine trägt die
Rechteprüfung, die der andere nicht hat. Sie zusammenzulegen hiesse, diese
Prüfung neu zu verdrahten — für ein Ergebnis, das der Mensch nicht sieht.
Die gemeinsame Frage ist jetzt gemeinsam; das war der Teil mit dem Risiko.

Prüflauf: `test234`, 14 Punkte.


## L51 · ~~Die Hauptwelten stehen in keinem Register~~ — 36 Zeilen fehlen noch

**24. August 2026.** CLAUDE.md §5 Regel 2: „Neuer Bereich = zwei
Register-Einträge." `Register.module` kannte editor, datenbanken, wissen,
ki, verbinden, dateien — aber weder Lernwelt noch Arbeitswelt noch
Lebensbereiche. Dasselbe galt für Electrical, Recognition und DocumentMode:
kein Register-Eintrag, kein Befehl, kein Tastenkürzel.

Kein Fehler im Betrieb — es lief. Der Preis stand woanders: ein Modul ohne
Eintrag ist für jede Übersicht unsichtbar, auch für die nächste Prüfung, die
„alle Bereiche" durchgehen will.

**Erster Teil erledigt** (E158, 25. August): die sechs stehen in
`src/register/module.ts`, und `pruefungen/lauf/test222.mts` ist genau die
Prüfung, die es vorher nicht geben konnte. Sie prüft nicht, dass Einträge da
sind — das wäre eine Liste, die sich selbst zählt —, sondern dass jeder
etwas AUFMACHT. Beim ersten Lauf fand sie sofort einen: `lebensbereiche`
rief dieselbe Zeile wie sein Nachbar auf, und auf dem Bildschirm änderte
sich nichts.

**Zweiter Teil erledigt** (E160, 25. August) — und er war grösser als
gedacht. Beim Nachzählen im Browser:

```txt
45   Zeilen zeichnet die Seitenleiste
12   Einträge kannte das Register
 1   Aufruf las davon:  anPlatz('unten') mit `vonAussen`
```

Der Kopf von `register/navigation.ts` behauptete „Hier steht die Ordnung.
Die Seitenleiste liest sie und zeichnet, was sie findet." Das war falsch,
und weil es falsch war, war der Katalog auch inhaltlich verrottet: `suche`
rief die Befehlspalette auf, `posteingang` die Meldungsliste, `ki` stand
drin und wird nirgends gezeigt. Drei Fehler, die nie auffallen konnten.

Die oberste Gruppe hängt jetzt am Register: Aussehen in `index.html`,
Handlung im Register, verbunden über `knopfId`. test222 §5 vergleicht beide
Listen Zeile für Zeile — Anzahl, Folge, Beschriftung, Kürzel.

**Dritter Teil erledigt** (E166, 25. August): die zwanzig unter „Meine
Apps" standen als Datentabelle in `seitenleiste.ts` und daneben als Kette
aus zwanzig `if (a === '…')`. Sie stehen jetzt im Register, und die
Seitenleiste zeichnet daraus. Gemessen: 45 gezeichnete Zeilen vorher wie
nachher, Zeile für Zeile identisch; Registereinträge 17 → 37.

**Was weiter offen ist**, und es ist weniger, als hier stand. Von den 45
Zeilen stehen 29 im Register. Von den übrigen 16 sind 11 kein Katalog,
sondern INHALT — sieben Systemseiten (Journal, Schnellnotizen, Vorlagen,
Graph, Schlagwörter, Karteikarten, Umsetzungsstand), drei angeheftete
Seiten und „Willkommen". Seiten gehören in den Baum, nicht in ein Register.

**Vierter Teil erledigt** (E167): Papierkorb und Tastenkürzel im Fuss
hängen ebenfalls am Register, über einen eigenen Platz `fuss` — unter
`oben` hätten sie den Zeilenvergleich in test222 §5 rot gemacht, ohne dass
sich am Bildschirm etwas ändert.

**Und damit steht L58.** Was übrig bleibt, bleibt mit Begründung:

```txt
btn-import                 sein Menü braucht das Klickereignis, und
                           fünfundzwanzig Zeilen Menüaufbau gehören in die
                           Schale, nicht in einen Katalog
Neuer Agent                je eine einzelne Zeile am Ende ihres Abschnitts,
Neue Besprechungsnotiz     direkt neben den Daten. Keine zweite Liste, die
                           abdriften könnte — ein Eintrag brächte Umweg
                           ohne Gewinn
```

Ein Katalog verdient seinen Platz, wenn es viele gleichartige Dinge gibt
oder wenn sonst zwei Listen entstünden. Beides trifft auf diese drei nicht
zu.

Und die Seitenleiste zeichnet weiterhin selbst, statt aus dem Register zu
lesen. Das ist Absicht, kein Rest: Register und Leiste sind so weit
auseinander, dass „ab jetzt zeichnet das Register" heute sechs Zeilen
verschieben würde — `bibliothek` steht unter `unten` und erscheint oben,
`vorlagen` steht unter `unten` und erscheint bei den Werkzeugen, `ki`
stünde plötzlich da. Erst muss der Katalog stimmen, dann darf er zeichnen.


## L52 · ~~Zwei Willkommensdialoge~~ — die Prüfseite bleibt offen

**24. August 2026.** Die Einrichtung der Hauptwelten setzte `rundgangGesehen`
nicht. `schale.ts` startete den Rundgang nur, wenn das Onboarding NICHT
gezeigt wurde — beim nächsten Start war das Onboarding durch, und der
Rundgang kam dann doch. Zwei Begrüssungen an zwei Tagen hintereinander.

**Der Produktteil ist behoben** (E137, Nummer 1): die Einrichtung öffnet
sich nicht mehr von selbst, der Willkommensbildschirm gehört wieder dem
Rundgang. Was offen bleibt, steht unten — und es ist die Hälfte, die beim
nächsten Mal wieder zubeisst.

Selbst gesehen, und es kostete mehr als einen Prüflauf: das Onboarding legt
sich beim ersten Start über alles und fängt Klicks ab. Im vollen Durchgang
scheiterte test32 daran mit einer Zeitüberschreitung, und 76 weitere Läufe
hätten dasselbe getan — sie entlassen den Rundgang nach dem Laden, kannten
den neuen Überlager aber nicht.

Nachgezogen wurde die bestehende Konvention: 74 Läufe entlassen ihn jetzt
mit derselben Zeile, mit der sie den Rundgang entlassen. Das ist eine
Reparatur an der Prüfseite, keine am Produkt — und damit bleibt die Falle
für den NÄCHSTEN Prüflauf bestehen, der klickt und die Zeile vergisst.

Die saubere Lösung wäre eine gemeinsame Vorbereitung für alle Läufe, statt
derselben acht Zeilen in achtzig Dateien. Das ist eine eigene Aufgabe: sie
fasst achtzig Dateien an, und dabei will man nichts anderes gleichzeitig
ändern.


## L53 · „⌁ Erkennen" braucht einen Dienst — GESCHLOSSEN am 25. August 2026

**Erledigt mit E150, geprüft mit test216 (32 Punkte).** Von den drei
Möglichkeiten ist es die erste geworden: der Dienst liegt jetzt bei
(`dienste/ocr.mts`), die Anleitung steht in `doku/OCR-DIENST.md`, und der
Einrichtungsdialog sagt, was zu tun ist, bevor er nach einer Adresse fragt.
Der widersprechende Satz in `doku/WAS-REDION-MEHR-KANN.md` ist berichtigt.
Der Rest dieses Eintrags bleibt als Aufnahme des Standes vom 24. August.


**24. August 2026.** `recognition.ts:405-409` erwartet einen selbst
betriebenen Dienst unter `http://127.0.0.1:8765/ocr`. Im Verzeichnis liegt
keiner, und es gibt keine Anleitung dafür. Der Knopf ist damit für jeden
Nutzer eine Sackgasse — der Code dahinter ist echt, der Weg endet im Nichts.

Dazu widerspricht die Doku dem ausgelieferten Stand:
`doku/WAS-REDION-MEHR-KANN.md:962` sagt weiterhin „Kein OCR, keine
Transkripte".

Entweder einen Dienst mitliefern und beschreiben, oder den Knopf ausbauen,
oder ehrlich beschriften. Ein Knopf, hinter dem nichts ist, ist die
schlechteste der drei Möglichkeiten.


## L43 · ~~Ein Anhang ohne `blockId` bleibt für immer liegen~~ — GESCHLOSSEN

**22. August 2026.** Beim Messen für E123 aufgefallen, nicht gesucht.

`purgeAnhaenge` findet die Anhänge eines endgültig gelöschten Blocks auf zwei
Wegen: über den Index `dateien.block` und über `cache.blocks[id].dateiId`. Der
zweite Weg läuft ins Leere, weil der Block zu diesem Zeitpunkt schon aus dem
Zwischenspeicher entfernt ist. Bleibt der erste — und der greift nur, wenn der
Dateisatz ein `blockId` trägt.

Gemessen mit `Dateien.ablegen(datei, {})`, also ohne `blockId`:

```txt
nach purgeBlock, sofort   dateiHolen=true
nach settled()            dateiHolen=true
nach 1200 ms              dateiHolen=true
```

Die Datei und ihre Stücke liegen für immer in der Ablage, ohne dass ein Block
noch auf sie zeigt.

**Wie schlimm ist das heute?** Wenig. Alle sechs echten Aufrufer von
`Dateien.ablegen` übergeben `blockId` — Editor, Wissen, Dateiablage und die
drei PDF-Wege. Der Fall entsteht also nur über einen Aufruf, den es noch nicht
gibt. `Dateien.verwaist()` und die Pflege-Seite finden solche Dateien, und der
Mensch kann sie dort wegräumen.

**Warum trotzdem nicht sofort behoben?** Weil die naheliegende Behebung —
`purgeAnhaenge` die Kennung merken lassen, BEVOR der Block aus dem
Zwischenspeicher fliegt — dazu führt, dass mehr gelöscht wird als heute. Mehr
zu löschen ist die gefährliche Richtung (§46), und das gehört in eine eigene
Entscheidung mit eigenen Prüfungen, nicht nebenbei in eine Fehlerbehebung.

---

**25. August 2026 — E171. Diese Sorge war berechtigt, und zwei Sätze oben
waren falsch.**

Die Sorge zuerst: sie stimmt. Gegengeprobt, indem nur das Merken eingebaut
und die Anspruchsfrage weggelassen wurde — dann nimmt das Löschen eines
Duplikats dem Original sein Bild. Genau der Schaden, den dieser Absatz
befürchtet hat.

Beim Nachmessen kam aber heraus, dass er schon vorher da war, nur durch die
andere Tür:

```txt
Bild einfügen · duplizieren · das ORIGINAL endgültig löschen
  → das Duplikat lebt, seine dateiId zeigt auf nichts, das Bild ist weg
```

`Store.baum` nimmt den ganzen Satz mit, also tragen beide Blöcke dieselbe
`dateiId`. Der Dateisatz zeigte über seinen Index auf das Original — mit ihm
ging er. Datenverlust im Normalbetrieb, ohne dass jemand etwas falsch macht.

Behoben wurde deshalb nicht die Lücke, sondern ihre Ursache: **es wird
gefragt, ob eine Datei noch jemand zeigt, bevor sie weggeht.** Damit ist das
Merken sicher, und L43 fällt nebenbei mit.

Und die zwei falschen Sätze:

```txt
„`Dateien.verwaist()` und die Pflege-Seite finden solche Dateien"
    Nein. `verwaist()` sagte `if (!d.blockId) return false` — eine Datei ohne
    Blockangabe galt als in Ordnung. Gemessen: 0 verwaiste, während die Datei
    aus dem Fall oben in der Ablage lag.

„Der Fall entsteht nur über einen Aufruf, den es noch nicht gibt"
    Für den Weg über `blockId` stimmt es. Der Weg über `dateiId` am Block
    brauchte gar keinen neuen Aufruf — Duplizieren genügte.
```

`verwaist()` stellt jetzt dieselbe Frage, aber eine Stufe schärfer: dort
zählt nur, wer die Datei HEUTE zeigt. Beim endgültigen Löschen zählt auch
ein Block im Papierkorb, weil Löschen nicht umkehrbar ist.

**Was offen bleibt:** eine Datei, die nie an einem Block hing — ein Upload,
dessen Verknüpfung nie kam — findet `verwaist()` weiterhin nicht. Alle sechs
echten Aufrufer von `Dateien.ablegen` übergeben `blockId`, der Fall entsteht
also nur über einen Aufruf, den es noch nicht gibt. Ihn automatisch zu
löschen wäre wieder die gefährliche Richtung: zwischen „abgelegt" und
„verknüpft" liegen Millisekunden, in denen die Datei echt und herrenlos ist.

Prüflauf: `test226`.

---

## L44 · ~~Dokument-Ink war nur Freihand und Radierer~~ — GESCHLOSSEN

**22. August 2026, geschlossen mit E125.** Die gemeinsame Markenschicht von
A4-Blatt und PDF-Seite trägt jetzt Marker, Linie, Pfeil, Rechteck, Ellipse
und sichere Textanmerkungen. Mehrere Marken lassen sich auswählen, gemeinsam
verschieben oder löschen; Rückgängig/Wiederholen arbeitet je abgeschlossener
Aktion. Stifteingaben nutzen Druckwerte, zusammengefasste Zeigerereignisse,
Glättung und Punktreduktion.

Bewusst offen ist kein fehlender Teil davon, sondern eine Grenze: Redion
importiert PDF-Markierungen nicht in die pixelgebundene alte Zeichenfläche.
Der neutrale Geometriekern kann später von weiteren Flächen verwendet werden,
ohne zwei gespeicherte Wahrheiten zu erzeugen. Geprüft in `test201`.


## L54 · ~~Was das Whiteboard noch nicht kann~~ — grösstenteils geschlossen

**24. August 2026.** E138 hat die Fläche unendlich gemacht, Verbindungen und
Bilder gebracht und ihr einen eigenen Bereich gegeben. Vier Dinge fehlen
weiterhin, und keines davon ist versteckt:

**Die Miniatur zeichnet keine Verbindungen.** `miniatur()` filtert sie
heraus und malt nur Formen. Für ein Wiedererkennungszeichen reicht das; wer
seine Karte an der Struktur erkennen will, findet sie dort nicht.

**Formen lassen sich nicht in der Grösse ändern.** Wer ein Rechteck zu klein
gezogen hat, muss es löschen und neu ziehen. Verschieben geht, Skalieren
nicht.

**Es gibt kein Wiederherstellen.** `↶` nimmt die letzte Form zurück, mehr
nicht — kein zweiter Schritt zurück, kein Schritt vorwärts. Der Radierer
löscht endgültig.

**Der Text auf einer Haftnotiz kommt aus `prompt()`.** Das ist ein Fenster
des Browsers, kein Feld auf der Fläche: man sieht beim Tippen nicht, wohin
der Text kommt, und am Telefon nimmt es den halben Bildschirm.

**Drei davon sind mit E144 erledigt:** Grösse ändern am Griff, vierzig
Schritte zurück und vorwärts, Text auf der Fläche statt im Browserfenster
(mit Doppeltipp zum Ändern). Dabei kamen zwei Fehler heraus, die niemand
gesucht hatte: ein Rechteck ohne Füllung nahm in SVG gar keine Klicks an,
und ein Strich mit 2,5 px war mit dem Finger nicht zu treffen.

**Und einer ist beim Bauen dazugekommen:** der Griff ändert Breite und Höhe
unabhängig voneinander. Bei einem Bild verzerrt das — es gibt keine Taste,
die das Seitenverhältnis festhält. Für Rechteck, Ellipse und Haftnotiz ist
freies Ziehen richtig; beim Bild wäre gehaltenes Umschalten die gewohnte
Geste.

**Offen bleibt der erste Punkt:** die Miniatur im Whiteboard-Bereich
zeichnet weiterhin keine Verbindungen. Sie ist ein Wiedererkennungszeichen,
keine Vorschau — wer seine Karte an der Struktur erkennen will, findet sie
dort nicht.


## L55 · Die Suche findet keine Dateinamen — GESCHLOSSEN am 25. August 2026

**Erledigt mit E147, geprüft mit test213 (20 Punkte).** Beim Bauen zeigte
sich, dass die Überschrift zu weit ging: ein Anhang IST auffindbar, weil
jeder Weg im Produkt den Dateinamen auch als Blocktext setzt. Verloren geht
er erst, wenn jemand den Text überschreibt. Und der eigentliche Fehler lag
tiefer als hier vermutet — im Beschleuniger `Kontext.kandidaten`, der aus
einer zweiten Feldliste gebaut wurde. Der Rest dieses Eintrags bleibt als
Aufnahme des Standes vom 24. August stehen.



**24. August 2026.** Beim Schreiben von `doku/AUFTRAG-STAND.md` nachgesehen
statt behauptet: §28 des Auftrags zählt zwölf Dinge auf, die die globale
Suche finden soll. Elf davon findet sie — weil sie alle Blocktext sind oder
in `suchtext`/`ocrText` daneben stehen.

Zwei nicht:

**Dateinamen.** Das Fach `dateien` hat einen `name`, und `findInside` sieht
nur `text`, `suchtext` und `ocrText` an Blöcken. Wer „Rechnung-2026-08.pdf"
sucht, findet sie nur, wenn der Name zufällig auch im Blocktext steht.

**Quellenangaben.** Sie stehen an Lernkarten aus Paketen unter
`quiz.source.title` und an erkannten Inhalten unter der Provenienz — beides
ausserhalb der drei durchsuchten Felder.

Beides ist dieselbe Art Arbeit: ein weiteres Feld in die Schleife, und für
die Dateien ein eigener Durchgang über das Fach. Nicht schwierig, aber eine
Änderung an der Suche — und die Suche ist die Stelle, an der ein Fehler alle
anderen Wege gleichzeitig trifft. Deshalb steht sie hier und nicht nebenbei.


## L56 · Mit einem benannten Konto gehört keine Zeile mehr irgendwem — GESCHLOSSEN am 25. August 2026

**Gemessen und behoben mit E153, geprüft mit test218 §8/§9.** Die Vermutung
unten stimmte, und es war schlimmer: nicht einzelne Zeilen fehlten, sondern
die ganze Liste. Der naheliegende Fix — `addRow` schreibt `erstelltVon` —
reichte nicht: wer sich umbenennt, verlöre sonst rückwirkend, was er selbst
angelegt hat. Die Regel lautet jetzt: eine gefüllte Personenzelle sagt, wem
die Zeile gehört; steht nirgends ein Name, gehört sie dem, der zusieht.
Dieselbe Regel steht auch in `lebensbereiche.ts`, wo derselbe Fehler war.
Der Rest dieses Eintrags bleibt als Aufnahme vom Vormittag.


**25. August 2026.** Beim Bauen von E152 nebenbei gemessen, nicht gesucht.

`Bibliothek.meineAufgaben` entscheidet für eine Datenbank **ohne**
Personenspalte so:

```js
(row.erstelltVon || 'Ich') === meinName
```

`Store.addRow` setzt `erstelltVon` aber gar nicht — nur `addBlock` tut das.
Für jede Datenbankzeile ist der Wert also `undefined` und damit `'Ich'`.

Solange niemand ein Konto anlegt, geht das gut: `meinName` ist ebenfalls
`'Ich'`, und alles zählt. Sobald ein Konto einen Namen hat — sagen wir
`Redur` —, ist `'Ich' === 'Redur'` falsch, und **keine einzige** Zeile aus
einer Datenbank ohne Personenspalte erscheint noch in der Aufgabenliste. Die
Zeilen sind da, die Datenbank ist da, die Liste ist leer.

**Wie schlimm ist das heute?** Ungeprüft — und genau deshalb steht es hier.
Der lokale Normalfall ohne Konto ist nicht betroffen. Wer aber ein Konto
anlegt, verliert stillschweigend seine Aufgabenliste, und nichts sagt ihm
warum.

**Warum nicht sofort behoben.** Zwei Wege, und beide brauchen einen eigenen
Gedanken:

* `addRow` schreibt künftig `erstelltVon`. Dann gilt es nur für neue Zeilen;
  alte bleiben herrenlos, und ein Nachtragen wäre eine Datenmigration (§9).
* Ohne Personenspalte zählt jede Zeile als meine. Einfacher, aber in einem
  geteilten Arbeitsbereich falsch.

Erst messen, wie ein benanntes Konto sich heute wirklich verhält — die
Vermutung oben ist aus dem Quelltext gelesen, nicht am laufenden Programm
nachgewiesen.


## L57 · Die Aufgabe aus der Besprechung findet die Minute nicht

**25. August 2026.** Beim Bauen von E155 gemessen, nicht gesucht.

§44 des Auftrags nennt zwei Beispiele für den Weg zurück zur Quelle:

```txt
Karte    → PDF     → Seite 14 → Ausschnitt     seit E155 vollständig
Aufgabe  → Meeting → 00:07                     nur bis „Meeting"
```

**Berichtigung vom 25. August (E161).** Dieser Satz stand hier: „Die
Aufgabe findet ihre Besprechung — der Rücksprung steht, geprüft in test220
§3." Er war falsch, und zwar zu freundlich.

test220 §3 baut sich seinen `sourceRef` VON HAND und prüft damit den
Zeichner. `besprechung.ts` schrieb gar keinen — der Knopf wäre an einer
echten Besprechungsaufgabe nie erschienen. Seit E161 schreibt das Produkt
ihn, an den Aufgabenblock und an die Datenbankzeile, und test223 geht dafür
den Produktweg statt eines Fixtures.

Was fehlte, war also mehr als die **Sekunde** — und die fehlt jetzt nur
noch halb.

Der Grund ist kein Versäumnis, sondern eine fehlende Angabe: `auswerten()`
lässt die KI Aufgaben aus dem Protokoll ziehen, und die Antwort enthält
`{ was, wer, bis }` — keine Zeit. Die Transkriptzeilen tragen ihre Sekunde
sehr wohl (`audioRef.sek`, E152), aber welche Zeile zu welcher Aufgabe
gehört, weiss niemand.

**Warum nicht einfach den Text vergleichen.** Weil es raten wäre. Eine
Aufgabe heisst „Verteiler UV3 versetzen", im Protokoll steht „dann müssen wir
den Verteiler halt noch verschieben". Ein Textabgleich träfe manchmal, und
manchmal spränge er an die falsche Stelle — und eine Zeitmarke, die an der
falschen Stelle landet, ist schlechter als gar keine: man hört hin, hört
etwas anderes und glaubt, die Aufnahme sei kaputt.

**Gebaut am 25. August (E161).** Die KI wird nach `sek` gefragt, und die
Antwort wird nur übernommen, wenn im Protokoll wirklich eine Zeile mit
dieser Zeit steht. Der Knopf zeigt sie dann an: „↩ Bauleitung KW 35 ·
25.8.2026 · 00:07".

**Was weiterhin offen ist**, und deshalb bleibt diese Lücke stehen: ob ein
echtes Modell brauchbare Sekunden liefert. Geprüft ist die Hälfte, die Code
ist — die Frage wird gestellt (test223 §1), und eine erfundene Zeitmarke
wird verworfen (§3). Ob die Antworten taugen, lässt sich nur mit einem
laufenden Modell messen, und ohne eines wäre jede Aussage darüber eine
Behauptung.


## L58 · ~~Die Werkzeugzeile über dem Titel rollt, ohne es zu zeigen~~

**25. August 2026.** Beim Bauen von E156 gemessen, nicht gesucht.

`.pg-tools` — die Zeile mit „Cover · Volle Breite · Normale Seite · Schrift ·
Vorlage" — ist am Telefon breiter als der Bildschirm und schiebbar:

```txt
617 px Inhalt in 390 px Kasten
```

Erreichbar ist damit alles. Sichtbar ist es nicht: nichts zeigt an, dass es
rechts weitergeht. Ein abgeschnittenes Wort sieht aus wie ein Fehler, nicht
wie eine Einladung zum Wischen — genau der Satz aus E151.

**Behoben am 25. August (E159)** — und der Weg dahin war lehrreicher als
die Lücke.

Den gemeinsamen Helfer gab es längst: `kern/helfer/rollrand.ts`, gebaut für
die Tabellen. Nur kannten ihn die zwei älteren Stellen nicht. Zusammengelegt
ist jetzt die RECHNUNG; die Darstellung darf verschieden bleiben, und `an`
sagt, wo gemalt wird, wenn das nicht dasselbe Element ist wie das rollende.

Der eigentliche Fund kam beim Hinsehen. Für die neue Stelle schrieb ich den
Schatten von `.lw-nav` ab; die Prüfung mass Deckkraft 1 und war grün, und auf
dem Bildschirmfoto war nichts. `rgba(0,0,0,.34)` über `#141414` ist kein
Schatten. Dieselbe Stelle, von der ich abgeschrieben hatte, war seit E151
genauso wirkungslos — mit grüner Prüfung.

Was jetzt dasteht, ist ein Verlauf in die Farbe der Fläche, wie ihn
`.blatt-reihe` seit E140 an der linken Kante hat. Er trägt in beiden Themen.
Geprüft wird zusätzlich die ART der Kante (test221 §6, test217 §3): das geht
rot, wenn jemand zum Schatten zurückkehrt. Dass man sie SIEHT, beweist keine
dieser Zahlen — das bleibt eine Frage ans Bild (§55).

## L59

**Ein Schalter sieht offen und geschlossen gleich aus**

`Register.fachzeichen` hält je Symbol EINEN Pfad. Ein Schliesser wird immer
in derselben Lage gezeichnet, egal welche Stellung gemeint ist. `alsSvg`
kennt darum auch keinen Parameter dafür — weder im Symbolregister noch im
Planzeichner.

Zu sehen war das bei `plan-leuchtet` (E192): die Frage sagte „S1:
geschlossen", und im Bild daneben stand S1 offen.

**Behoben am 26. August (E193) — aber anders als hier zuerst geplant.**

Der Plan war, jedem Schaltersymbol einen zweiten Pfad zu geben. Beim
Nachdenken über die achtundzwanzig Symbole fiel auf, dass das der falsche
Weg gewesen wäre: **ein Kontakt wird im Schaltplan in seiner RUHELAGE
gezeichnet.** Ein Schliesser ist offen, auch während er geschlossen ist. Wer
ihn geschlossen zeichnet, zeichnet keinen Schaltplan mehr.

Die Lücke war also nicht „das Symbol ist falsch", sondern „die Stellung steht
nur im Fragetext und nicht dort, wo man sie braucht". Gedruckte Lehrmittel
lösen das mit einer Stellungstabelle neben dem Plan. Redion schreibt sie
direkt ans Bauteil — über `plan.texte`, dieselbe Beschriftungsart, die es
für Punkt 47 ohnehin gibt.

Dabei ist prompt ein neuer Fehler entstanden und im selben Zug gefunden
worden: die Beschriftung „geschlossen" landete bei manchen Startwerten auf
einem Tippgriff und schluckte den Klick. Man tippt, und es passiert nichts —
schlimmer als ein zu kleines Ziel, weil man nicht sieht, warum. `test243`
prüft jetzt für zwölf Aufgaben nacheinander, dass über keinem Griff etwas
anderes liegt; mit EINER Aufgabe blieb die Prüfung grün, obwohl der Fehler
noch drin war.


--------------------------------------------------------------------------------
L61 — Es gibt kein Vorschaubild zu einer Seite
--------------------------------------------------------------------------------

„Weiter wo du warst" (E205) zeigt den Anfang einer Seite als TEXT nach: Über-
schriften fett, Haken als Kästchen, Listenpunkte mit Punkt. Das reicht zum
Wiedererkennen und ist ehrlich — aber es ist kein Bild.

Was fehlt: Redion legt zu keiner Seite ein Vorschaubild an. Eine Seite, die
hauptsächlich aus einem Schaltplan, einer PDF-Seite oder einer Zeichnung
besteht, hat kaum Text — und ihre Miniatur ist deshalb fast leer, obwohl die
Seite voll ist. Genau die Seiten, die man am Bild am schnellsten wiedererkennt,
zeigen am wenigsten.

Am nächsten dran ist `page.cover` (gesetzt über `Kopfleiste.coverWaehlen`);
das ist ein vom Nutzer gewähltes Titelbild und keine Vorschau des Inhalts.

Ein Weg wäre, beim Speichern einer Seite mit Zeichenschicht oder PDF-Seite ein
kleines Bild mitzuschreiben — stückweise und in die Dateiablage, nicht als
Data-URL (§14). Das ist eine Speicheränderung und braucht deshalb einen
eigenen Plan mit Prüflauf (§9, §30).

TEILWEISE ERLEDIGT mit E216 — die SICHTBARKEIT, nicht das Bild.

Gemessen war die Miniatur einer Seite aus sechs textlosen Blöcken 0 Zeichen
lang, und `umfang` meldete 6: die Karte fiel nicht heraus, sie stand weiss da.
Jetzt bekommt jeder Block, der seinen Inhalt nicht im `text` trägt, einen
Streifen mit Zeichen und Namen aus `Register.bloecke`.

WAS OFFEN BLEIBT, und zwar zweierlei:

1. ~~Das eigentliche Vorschau-BILD.~~ GESCHLOSSEN am 1. September 2026 mit
   E313 — auf einem anderen Weg als hier vorgeschlagen, und das ist der
   Punkt: nicht mitschreiben, sondern zeigen, was schon da ist. Eine
   eingelesene PDF-Seite trägt `bildDateiId`, ein Bildblock `dateiId`;
   `Vorschau.bildDatei()` nimmt die erste in Lesereihenfolge, und der Deckel
   zeigt sie. Keine Speicheränderung, keine Migration, und es kann nicht
   veralten — ein mitgeschriebenes Bild von gestern zeigt die Seite von
   gestern.

   ~~ES BLEIBT GENAU EIN FALL: ein leeres A4-Blatt, auf das nur von Hand
   gezeichnet wurde, hat keine Datei. Sein Deckel bleibt weiss.~~
   GESCHLOSSEN am 3. September 2026 mit E374 — und ohne das Rendern, das
   dieser Absatz noch verlangt hat. Die Striche liegen im Block
   (`marken`); `core/ink/thumbnail.ts` rechnet daraus die Pfade,
   `Vorschau.tinteSvg` macht ein SVG daraus, Regal und Bibliothek zeigen
   es. Keine Datei, keine Migration, und es kann nicht veralten.

   Der Deckel bekommt dabei WEISSES PAPIER unter die Tinte — sonst stünde
   eine Handschrift in `#1a1a1a` im Dunkelmodus schwarz auf schwarz, und
   genau das zeigte das erste Bild. Ein gesperrtes Heft zeigt nichts
   (§26). test364, 54 Punkte.
2. ~~`pdfseite` und `zeichenflaeche` haben nirgends einen deutschen Namen.~~
   GESCHLOSSEN mit E239 — und es waren FÜNF, nicht zwei: `database`,
   `pdfseite`, `spalte`, `tabelle`, `zeichenflaeche`.

   Der gesuchte Weg, der sie nicht einfügbar macht, ist eine zweite Liste im
   selben Register: `eines()` sieht sie, `alle()` nicht. „Wie heisst diese
   Art?" und „was kann ich einfügen?" sind zwei Fragen und haben jetzt zwei
   Antworten. Slash-Menü, Umwandeln, Suche und Markdown bleiben unverändert;
   `anzahl()` steht weiter bei 78.

   Gemessen: vorher vier von sechs Streifen benannt, jetzt sechs von sechs
   (test33). Dabei fiel auf, dass „+ Neu → Neue Tabelle" einen Block anlegte,
   den niemand zeichnet — siehe E239.

L62 — „PDF einlesen" fehlt im Menüband
--------------------------------------------------------------------------------
`PdfEinlesen.alsSeiten(datei, elternId)` braucht eine `File`. Das Menüband ist
ein KATALOG (`register/menueband.ts`), und dort einen Dateiwähler zu bauen wäre
neues Verhalten in einer Datei, die keines haben darf (E210).

Der Weg gibt es weiterhin: eine PDF auf die Seite ziehen. Er ist nur nicht im
Band, und das ist für einen Berufsschüler mit Vorlesungs-PDFs die wichtigste
Stelle, an der er ihn suchen würde.

Was fehlt: ein `PdfEinlesen.waehlen()` im Bereich selbst, das den Wähler öffnet
und dann `alsSeiten` ruft. Dann kann das Band es aufführen, ohne selbst etwas
zu tun.

ERLEDIGT mit E214. Genau so gebaut: `PdfEinlesen.waehlen(elternId?)` öffnet den
Wähler und ruft `alsSeiten`; im Band steht nur der Eintrag `z-pdf` unter
„Aufnehmen". Ohne offene Seite kommt ein Satz statt eines stillen Nichts.
Geprüft in test247 §13 — nicht daran, ob die Funktion existiert, sondern daran,
ob wirklich ein Dateiwähler aufgeht und wonach er fragt.

L63 — Die Slash-Aktionen fehlen im Menüband
--------------------------------------------------------------------------------
`Register.bloecke` führt elf Einträge mit `aktion` — „Umwandeln in …",
„Duplizieren", „Person oder Seite erwähnen", „Datum einfügen", „Emoji". Sie
brauchen den Schreibzeiger und den Block darunter
(`Blocks.slashAktion(ct, block, was)`), und beides hat ein Knopf im Band nicht.

Sie stehen deshalb weiterhin nur im Slash-Menü. „Erwähnung", „Datum" und
„Emoji" gehören inhaltlich sehr wohl unter „Einfügen"; was fehlt, ist ein
Einstieg, der ohne Schreibzeiger auskommt und am Ende der Seite anfügt.

ERLEDIGT mit E215 — aber als ZWEI und nicht als drei. `Blocks.aktionAmEnde`
hängt einen leeren Textblock ans Ende; die Gruppe „Im Text" im Reiter
„Einfügen" führt auf, was `Blocks.AM_ENDE` nennt.

„Datum" ist bewusst NICHT dabei: nachgemessen öffnet es dasselbe Menü wie
„Erwähnung" (das Seiten, Personen und Datumsangaben führt). Zwei Kacheln für
dasselbe Menü, davon eine mit einer Überschrift, die nicht dazu passt, führen
in die Irre. Der eine Einstieg nennt im Hinweis alle drei.

Beim Emoji kam dabei ein ÄLTERER Fehler heraus: „:" allein öffnet nichts, das
Menü verlangt zwei Buchstaben dahinter. Der Slash-Befehl `/emoji` hinterliess
also seit jeher einen einsamen Doppelpunkt. Der Weg geht jetzt über den
Ereignisbus zur vollen Auswahl mit Suchfeld.

Die anderen acht Aktionen bleiben im Slash-Menü — sie handeln von EINEM
bestimmten Block, und ohne Schreibzeiger gibt es keinen.

L64 — Die echten Zeichenwerkzeuge fehlen im Reiter „Zeichnen" — GESCHLOSSEN
--------------------------------------------------------------------------------
Auf einem Bildschirmfoto der PDF-Seite steht eine vollständige Zeichenleiste:
Schreiben, Auswahl, Stift, Marker, Linie, Pfeil, Rechteck, Ellipse, Text,
Fachzeichen, Radieren, Zurück, Vor, Löschen, vier Farben, drei Strichstärken.

Der Reiter „Zeichnen" im Menüband (E210) kennt davon nichts. Dort stehen nur
Blatt, Whiteboard, Schaltplan und Kamera — also, WOMIT man anfängt, nicht,
WOMIT man zeichnet.

Warum es noch nicht drin ist: die Werkzeuge gehören zur jeweiligen Fläche
(PDF-Seite, Blatt, Whiteboard, Planfläche) und wirken auf deren Zustand. Ein
Knopf im Band bräuchte den Bezug zur offenen Fläche — sonst ist er entweder
tot oder er wirkt auf die falsche.

Was fehlt: ein gemeinsamer Weg, über den eine Zeichenfläche ihr aktuelles
Werkzeug meldet und entgegennimmt. Dann kann das Band sie aufführen, ohne
selbst etwas zu tun (die Regel aus `register/menueband.ts`).

ERLEDIGT mit E212. `src/kern/helfer/zeichenziel.ts` ist dieser Weg: die
zuletzt berührte Fläche ist die gemeinte. Elf Werkzeuge plus Zurück, Vor und
Löschen stehen im Reiter „Zeichnen" und erscheinen nur, wenn es eine Fläche
gibt. Beide Richtungen sind geprüft (test247 §11) — Band → Leiste und Leiste
→ Band, jeder Punkt einzeln als rot-fähig belegt.


L65 — „Elektro" öffnet einen Dialog, keine Seite — GESCHLOSSEN am 28. August 2026
--------------------------------------------------------------------------------

GESCHLOSSEN mit E238. `src/bereiche/elektro/start.ts` ist die Seite:
`App.zeigeSonder('Elektro', …)`, Krume „Elektro", Zurück-Pfeil wie überall.
Die acht Wege kommen aus `Register.menueband.inReiter('elektro')` — kein
zweiter Katalog (§8). Der Rechner ist einer ihrer Knöpfe statt ihrer
Vordertür. Geprüft in test247 §15, jeder Punkt einzeln rot gemacht.

Der Text darunter ist der Stand von vorher und bleibt als Begründung stehen.

Seit E219 steht „Elektro" als fünfter Weg in der Seitenleiste, neben Heute,
Lernzentrum, Bibliothek und Aufgaben. Vier davon führen an einen ORT: die
Pfadnavigation ändert sich, man ist woanders, der Zurück-Pfeil bringt einen
zurück.

„Elektro" nicht. Es ruft `Electrical.open()`, und das ist eine Überlagerung —
ein Rechner mit Modusauswahl und den Lernpaket-Knöpfen. Der Rechner
funktioniert; das ist keine Lücke im Sinn von „kaputt". Die Lücke ist, dass
ein Eintrag zwischen vier Zielen steht und als einziger keines ist.

Aufgefallen ist es beim Durchklicken aller fünf Wege nach E219: der Rundgang
räumte Überlagerungen weg, bevor er das Bild machte, und danach sah es aus,
als führe der Knopf ins Leere. Er tut es nicht — aber die Verwechslung war
möglich, und das sagt etwas über die Sache selbst.

Was fehlt: Elektrotechnik hat viel mehr als den Rechner — Fachzeichen,
Schaltplan mit Simulation, Formelheft, Prüfung, Werkstatt (Elektro A bis E).
Es gibt nur keine Seite, die das zusammen zeigt. Der Menüband-Reiter
„Elektro" mit acht Einträgen ist bisher das Nächste dazu.

Was es bräuchte: eine Elektro-Startseite in derselben Form wie „Heute" —
weiter wo du warst, was ansteht, die Werkzeuge als Kacheln. Dann wäre der
fünfte Weg ein Ort wie die anderen vier, und der Rechner einer seiner
Knöpfe statt seiner Vordertür.

Bis dahin ist es ehrlicher, es hier stehen zu haben, als so zu tun, als
wären die fünf Wege gleichartig.


L66 — test181 war unzuverlässig (behoben, E234 — und die Ursache war
      eine andere als hier zuerst vermutet)
--------------------------------------------------------------------------------
Im vollen Durchlauf am 27. August brach test181 ab:

    page.evaluate: Execution context was destroyed, most likely because of
    a navigation.  (test181.mts:221)

Zeile 221 ist der Schritt, in dem die Prüfung ALLES löscht und aus einer
Sicherung wieder einspielt — die teuerste Stelle des Laufs.

WAS ES NICHT IST. Der Verdacht fiel zuerst auf die Änderungen von E219/E221:
auf einem Stand vor E219 lief die Suite grün, im Arbeitsverzeichnis rot. Die
Eingrenzung schien sogar eine Datei zu benennen — `aufbau.css`, deren
Änderung aus einer einzigen Farbregel besteht. Eine Farbregel kann keine
Navigation auslösen.

Dreimal hintereinander auf demselben Stand gelaufen: grün, grün, rot. Es war
also nie die Datei, sondern die Rechenlast — der volle Durchlauf lief die
ganze Zeit im Hintergrund weiter und teilte sich die Kerne.

DIE LEHRE, teurer als der Befund: eine Eingrenzung, bei der jeder Durchgang
für sich zufällig ausgehen kann, grenzt nichts ein. Wer bisektiert, muss
zuerst wissen, ob der Lauf überhaupt wiederholbar ist. Drei Wiederholungen
hätten das in zwei Minuten geklärt und den ganzen Umweg gespart.

────────────────────────────────────────────────────────────────────────────
ERLEDIGT AM 27. AUGUST (E234) — UND DIE ERKLÄRUNG OBEN WAR FALSCH
────────────────────────────────────────────────────────────────────────────

Die Last war es nicht. Nachgemessen auf einem Abzug des Standes von E228,
ganz ohne Nebenlast:

    drei von drei Läufen rot

Und im Arbeitsverzeichnis zwei von drei. Die Lehre über die Wiederholbarkeit
oben stimmt also — nur ihr Ergebnis nicht: „drei Wiederholungen hätten es in
zwei Minuten geklärt" war richtig gesagt und dann trotzdem nicht getan, denn
DREI Wiederholungen auf einem lastfreien Abzug hätten sofort gezeigt, dass
es die Last nicht ist.

WAS ES WIRKLICH IST. Über CDP mitgehört meldet Chromium während des Aufrufs

    Runtime.executionContextsCleared

und gleichzeitig:

    kein `beforeunload`, kein `pagehide`, kein `hashchange`
    eine vorher gesetzte Fenstervariable lebt weiter
    `document.readyState` = complete, die Adresse nur am ANKER anders

Die Seite wird also nicht neu geladen. Chromium meldet
`executionContextsCleared` auch bei einer reinen Anker-Navigation, und
Playwright hält den gebundenen Kontext danach für tot. Der ersetzende Import
zeichnet die Seite neu, dabei wandert `location.hash` — und wer gerade in
einem langen `evaluate` steckt, verliert es.

Kein Fehler in Redion, keiner in der Prüfung: ein Wettlauf zwischen beiden.

BEHOBEN durch vier kurze Aufrufe statt eines langen (jeder Schritt dauert
einzeln 3 bis 350 ms).

    vorher    2 von 5 grün
    nachher   8 von 8, davor 5 von 5 auf der Messkopie

DIE LEHRE FÜR ANDERE PRÜFUNGEN: ein `evaluate`, das lange läuft UND dabei
die App etwas neu zeichnen lässt, ist ein Wettlauf. Wer so etwas schreibt,
teilt es besser gleich.


================================================================================
L67 — 110 Zählwerte ohne Einzahl-Verzweigung — HELFER DA, Umbau bewusst offen
================================================================================

Beim Beheben von E231 („1 Einträge") wurde einmal über `src/` gesucht: wo
steht eine Zahl direkt vor einem Wort, ohne dass in derselben Zeile eine
Einzahl-Verzweigung vorkommt?

    110 Stellen.

Fünf davon standen in LISTEN, die bei jedem Öffnen zu sehen sind — die sind
mit E231 auf `zahlWort()` umgestellt. Der Rest ist nicht behoben.

WAS DER REST IST. Fast alles sind Meldungen nach einer Massenaktion:

    „17 Zeilen eingefügt"        „3 Spalten angelegt"
    „5 Einträge gelöscht"        „12 Werte fallen weg"
    „vor 5 Minuten"              „Text (43 Zeichen)"

Bei diesen kommt die Eins selten vor, und wenn, stört sie kaum: „1 Zeilen
eingefügt" ist hässlich, aber niemand liest es zweimal. Ein paar Stellen
haben ausserdem schon die Klammerform „Datenbank(en)", die zwar unschön,
aber nicht falsch ist.

WAS FEHLT: eine Entscheidung, ob `zahlWort()` aus der Arbeitswelt in einen
gemeinsamen Helfer wandert (`kern/helfer/`) und die Meldungen mitzieht. Das
ist Fleissarbeit über zwölf Dateien und lohnt sich erst, wenn jemand die
Meldungen ohnehin anfasst — vorher wäre es 110 Änderungen ohne Prüfung
dahinter, und das ist genau die Sorte Umbau, vor der §45 warnt.

GEZÄHLT WIRD ES HIER, damit die Zahl nicht verloren geht. Wer sie neu
erheben will:

    Zahl + Leerzeichen + Grossbuchstabenwort, ohne `=== 1` in derselben Zeile

**Die HÄLFTE davon ist am 31. August 2026 mit E281 erledigt:** den
gemeinsamen Helfer gibt es, er steht in `core/helpers/plural.ts` und ist
damit für jeden Bereich erreichbar (vorher lag er in `arbeitswelt.ts`, also
in einem Bereich — §5 verbot den anderen, ihn zu holen; DAS war der
eigentliche Grund, warum elf Dateien es weiter von Hand machten).

Er kann ausserdem drei Dinge, die die naive Fassung falsch machte: minus
eins ist Einzahl, `NaN` kommt nicht als „NaN Einträge" auf den Bildschirm,
und es gibt eine Null-Sonderform („Keine Einträge"), die ohne ausdrückliche
Angabe NICHT einspringt.

**Offen bleibt der Umbau selbst, und zwar mit Absicht** (Redur in E277,
§45). Nachgezählt am 31. August: **104 Stellen**. Sie werden umgestellt,
wenn jemand die betreffende Meldung ohnehin anfasst.


L68 — Die Reiterzeile der Lernwelt hat im verschmolzenen Kopf 234 px — GESCHLOSSEN
================================================================================

E235 lässt einen Bereich seine eigene oberste Zeile mit
`data-kopfzeile="eigene"` melden; die Schale legt ihre Krumenzeile dann
DARÜBER, statt eine zweite Bank zu bauen. Das spart am Telefon eine ganze
Bank Höhe und ist genau das, worum Redur gebeten hatte.

Der Preis steht in `lernwelt.css`: das Raster hält 44 px links für den
Zurück-Knopf frei, 44 px rechts für die drei Punkte und dazwischen noch
den Bereichs-Chip. Gemessen auf 390 px bleibt der Reiterzeile

    vorher (eigene Bank)     11 → 377      366 px
    jetzt (verschmolzen)     55 → 289      234 px

Sichtbar sind damit etwa zweieinhalb Reiter; „Prüfungen" steht am Rand als
„Prü" da.

WAS SCHON DAGEGEN GETAN IST — und warum das die Lücke klein hält:

  · Die Zeile rollt waagerecht, und `data-mehr` blendet an der Seite ein,
    wo noch mehr steht. Kein Weg ist unerreichbar (§47).
  · `Rollrand.zeige()` rollt beim Zeichnen zum AKTIVEN Reiter. Wer auf
    „Prüfungen" steht, sieht „Prüfungen" — abgeschnitten ist immer nur,
    wo man gerade nicht ist.

WAS OFFEN BLEIBT: man sieht nicht auf einen Blick, welche Reiter es gibt.
Zwei Wege wären denkbar, beide ungeprüft:

  · Die drei Punkte weglassen, wenn der Bereich gar kein Seitenmenü hat —
    dann sind es 278 statt 234 px. Setzt voraus, dass die Schale weiss,
    wann das Menü leer ist; heute weiss sie es nicht.
  · Den Bereichs-Chip in eine zweite Reihe nehmen. Das kostet Höhe und
    nimmt damit genau zurück, wofür E235 da ist — deshalb steht es hier
    als Möglichkeit und nicht als Vorschlag.

Gemessen am 28. August 2026 auf 390 × 844.


L69 — ~~Es gibt keinen Weg zu einer .pptx-Datei~~ — die .pptx STEHT seit dem
1. September 2026 (E297). OFFEN BLEIBT das Folien-PDF; siehe unten.
================================================================================

Der Vortragsmodus ist gebaut und geprüft (test183, test35): eine Seite
wird im Vollbild als Folien gezeigt, jede Überschrift 1/2 und jede
Trennlinie beginnt eine neue. Für den Vortrag vom eigenen Gerät reicht
das.

Aber die Berufsschule verlangt oft eine ABGABE: eine PowerPoint-Datei
hochladen oder auf dem Schul-PC öffnen. Dafür gibt es nichts — `grep -ri
pptx` über `src/`, `quell/` und `pruefungen/` liefert null Treffer. Auch
den Umweg gibt es nicht: der Druckweg druckt die SEITE als Fliesstext
(quell/bereiche/wissen/werkzeuge.js, Druckrahmen), nicht die Folien —
nicht einmal ein Folien-PDF als Handout ist möglich.

Was ein Anfang wäre, in dieser Reihenfolge:

  · Folien-PDF: den Druckrahmen die FOLIEN setzen lassen (eine Folie =
    eine Seite quer) statt des Fliesstexts. Kein neues Format, nur ein
    zweiter Druckpfad — und deckt Handout und „als PDF abgeben" ab.
  · .pptx-Export danach: ist wie .docx/.xlsx ein ZIP mit XML, und den
    eigenen ZIP-Schreiber gibt es schon (src/bereiche/dateien/
    ausgeben.ts). Der Aufwand liegt im Folien-XML, nicht im Container.

Gemessen am 28. August 2026 (Visionskarte, Leser „PowerPoint").


WAS AM 1. SEPTEMBER 2026 GESCHAH (E297)
--------------------------------------------------------------------------------
Der zweite Punkt ist gebaut, und die Schätzung darin hat gestimmt: der
Aufwand lag im Folien-XML. „Exportieren → Diese Seite → PowerPoint (.pptx)"
in der Backstage. Die Trennregel liegt seither in `src/core/slides/folien.ts`
und wird vom Vortragsmodus UND vom Export benutzt — zwei Teilungen, die
auseinanderlaufen, wären schlimmer als eine gewesen.

DER ERSTE PUNKT STEHT WEITER OFFEN. Der Druckweg setzt nach wie vor die Seite
als Fliesstext; ein Handout „eine Folie = eine Seite quer" gibt es nicht.

UND EINES IST NICHT NACHGEMESSEN, das gehört dazu: dass PowerPoint selbst die
Datei öffnet. Ein echtes PowerPoint gibt es hier nicht, und LibreOffice läuft
im Prüfcontainer nicht — nachgemessen: es lädt dort nicht einmal eine `.txt`
(„source file could not be loaded"). test293 prüft deshalb die STRUKTUR, und
zwar streng: jede Beziehung zeigt auf eine Datei, die es gibt; jeder Teil hat
seinen Content-Type; jedes XML ist wohlgeformt; und der ganze Weg wird mit
Redions eigenem ZIP-Leser wieder aufgemacht. Das ist nicht dasselbe wie ein
Doppelklick in der Schule, und es soll auch nicht so klingen.


L70 — ~~Hinter dem Knopf „Stundenplan" steht kein Stundenplan~~ — GESCHLOSSEN am 28. August 2026 (E243)
================================================================================

Auf dem Schul-Dashboard gibt es einen Knopf mit der Aufschrift
„Stundenplan" (src/bereiche/wissen/lernwelt.ts:2154). Er öffnet die
Ausbildungsseite. Das ist alles — es gibt kein Wochenraster, keine
Lektion, keine Zeiten je Fach, kein „was habe ich jetzt" auf dem
Heute-Dashboard.

Ein Knopf, der etwas anderes tut, als er verspricht, ist schlimmer als
kein Knopf (dieselbe Sorte Fehler wie E239, „Neue Tabelle").

Der Unterbau ist da: Termine-Datenbanken, Kalender-Ansicht, ICS-Import
mit Wiederholungsterminen (quell/bereiche/verbinden/kalender.js). Was
fehlt, ist ein Wochenraster, das Lektionen je Fach mit Zeiten zeigt, und
seine Zeile auf dem Heute-Dashboard.

Gemessen am 28. August 2026 (Visionskarte, Leser „Schule").

GESCHLOSSEN am selben Abend (E243): eigene Lernwelt-Ansicht
„Stundenplan" mit Wochenraster Mo–Sa, Sortierung nach Uhrzeit,
„Jetzt:"-Kopfzeile und zwei Leerfällen; die Schulvorlage legt die
Datenbank an (Tag, Von, Bis, Fach, Raum, Hinweis), auch nachträglich
und ohne Doppel. Der Knopf führt jetzt zur Ansicht. Geprüft in
test250. OFFEN BLEIBT nur die Zeile auf dem Heute-Dashboard
(„was habe ich jetzt" ausserhalb der Stundenplan-Ansicht).


L71 — ~~Die Zeugnisnote mittelt alle Semester in einen Topf~~ — GESCHLOSSEN am 28. August 2026 (E242)
================================================================================

Die Noten-Ansicht (E241, test249) rechnet je Fach den gewichteten Schnitt
und die Zeugnisnote — über ALLE Zeilen der Fach-Datenbank, ohne
Zeitraumfilter. Im ersten Semester stimmt das. Ab dem zweiten zeigt die
Kopfzeile „X.X im Zeugnis" das Allzeit-Mittel — eine Zahl, die auf keinem
echten Zeugnis steht.

Das ist die gefährliche Sorte falsch: plausibel, leicht daneben, und wer
ihr vertraut, rechnet sein „was brauche ich für die 4.0" auf der falschen
Summe.

Klein zu schliessen: das Datum je Note wird schon gelesen und sortiert
(notenEintraege, datumKey) — es fehlt nur ein Semester-/Zeitraumfilter
über der Bilanz und ein Prüfpunkt in test249, der zwei Semester anlegt
und nachweist, dass die Kopfzeile nur das gewählte mittelt.

Gemessen am 28. August 2026 (Visionskarte, Leser „Schule").

GESCHLOSSEN am selben Abend (E242): drei Zeitraum-Knöpfe (Dieses
Semester / Letztes Semester / Alle) mit Zählern, Vorgabe „Dieses
Semester", Semestergrenzen an Feb/Aug ausgerichtet. Eine Note ohne
Datum zählt zum aktuellen Semester, und die Kopfzeile sagt das dazu;
unter „Alle" heisst die Überschrift ehrlich „über alle Semester" statt
„im Zeugnis". Geprüft in test249 §5.


L72 — DOCX trägt in beide Richtungen nur Klartext, und der Import ist ungeprüft
================================================================================

Der DOCX-Export (test49, 50/50) baut eine echte Word-Datei mit eigenem
ZIP-Schreiber — aber wAbsatz schreibt den ROHEN Blocktext: `**fett**`
steht in Word wörtlich mit Sternchen da statt als fetter Lauf, Bilder
werden zum Platzhaltertext „[Bild: …]", und nummerierte Listen bekommen
Punkte (numbering.xml kennt nur bullet). Der DOCX-Import (docxLesen,
src/bereiche/dateien/einlesen.ts:767) sammelt nur w:t-Texte: fett/kursiv,
Bilder, Kopf-/Fusszeilen und Fussnoten gehen verloren.

Und: docxLesen ist der einzige Einlese-Weg OHNE Prüflauf — kein Test in
pruefungen/lauf/ ruft ihn auf (grep leer). Nach §30 ist das eine
Pflichtlücke, unabhängig davon, wann die Formatierung kommt: erst der
Prüflauf (klein), dann echte w:rPr-Läufe im Export (mittel).

Gemessen am 28. August 2026 (Visionskarte, Leser „Word").

TEIL 1 GESCHLOSSEN am selben Abend (E245): test252 prüft den Import auf
drei Wegen — Rundlauf über Redions eigenen Word-Export (Titel wird H1,
Überschrift bleibt Überschrift, Zitat bleibt Zitat, Listenpunkte und
Tabellenzeilen bleiben, kΩ und äöüß überleben), eine handgebaute
DEUTSCHE Word-Datei (Stil-IDs „berschrift2" und „Zitat", Nummerierung
über w:numPr — die toleranten Erkennungswege, die der Rundlauf nie
berührt), und die Verlust-Ehrlichkeit: `**fett**` steht wörtlich da.
Zwei Gegenproben einzeln rot.

TEIL 2 GESCHLOSSEN am 1. September 2026 (E315), bis auf die Bilder.
`core/text/inline.ts` zerlegt Redions Blocktext in Läufe und setzt sie
wieder zusammen; beide Richtungen benutzen denselben Kern. Fett, kursiv,
durchgestrichen und feste Breite gehen als `w:rPr` hinaus und kommen als
Auszeichnung zurück — in Word stehen keine Sternchen mehr. test309 (25)
misst den ganzen Weg, §6 hält fest, dass gewöhnlicher Text KEIN `w:rPr`
bekommt (sonst greifen Words Vorlagen nicht mehr).

ES BLEIBEN ZWEI BENANNTE VERLUSTE, beide gemessen statt vermutet:

  · Ein Redion-Seitenverweis (`[[Seite]]`) hat in Word keine Entsprechung
    und kommt als gewöhnlicher Text an. Für einen Leser richtig, für den
    Rundlauf ein Verlust — test309 §5b misst ihn ausdrücklich.
  · ~~Bilder bleiben Platzhaltertext.~~ — **GESCHLOSSEN am 1. September 2026
    durch E346**, auf genau dem hier beschriebenen Weg: Medienteile unter
    `word/media/`, je eine Beziehung in `document.xml.rels`, ein `Default`
    je Endung in den Content-Types. Der ZIP-Schreiber konnte es schon.

    Ein Vorlauf sammelt die Bilder, bevor der Text gebaut wird — sonst
    hinge die Reihenfolge der Absätze an der Ladegeschwindigkeit. Das Mass
    wird mit `createImageBitmap` GEMESSEN und auf die Textspalte gestutzt;
    lässt es sich nicht messen, bleibt der Platzhalter, denn ein Bild mit
    erfundenen Massen wäre schlimmer als keines.

    Und der Platzhalter sagt jetzt, WARUM (§35): „SVG, kommt in Word nicht
    mit", „kein Bild hinterlegt", „liess sich nicht lesen".

    ~~WAS OFFEN BLEIBT: SVG.~~ — **GESCHLOSSEN am 1. September 2026 durch
    E347.** Beim Nachmessen des Blocks, um den es Redur geht, fand sich
    Schlimmeres als ein Platzhalter: ein `schaltplan`-Block kam in Word
    als NICHTS an — Seitentitel und Beschriftung, keine Zeichnung, keine
    Meldung. Er ist kein `image`-Block und hatte im Export keinen Weg.

    Jetzt rastert Redion, was es selbst zeichnet, zu einem PNG: derselbe
    Zeichner wie am Bildschirm (`Schaltplan.alsSvg`), doppelte Auflösung
    bei logischem Mass, weisser Grund. SVG-Dateien in `image`-Blöcken gehen
    denselben Weg. WebP bleibt Platzhalter.

    Zwei Fallen, beide erst beim Zählen der Pixel sichtbar: ein SVG im
    `<img>` ist ein eigenes Dokument — ohne `xmlns` lädt es nicht, und
    `var(--text)` wird dort zu `none`, also zu einem weissen Blatt, das
    keinen Fehler auslöst. `svgAlleinstehend` trägt Namensraum und Farben
    nach (Schwarz, nicht die Bildschirmfarbe: die Vorgabe ist dunkel).

    test339, 31 Punkte, zählt dunkle Pixel im Medienteil und misst Hell
    und Dunkel gegeneinander. Belegt rot in drei Richtungen, jede einzeln.

    test338, 34 Punkte, §1 mit einem Byte-für-Byte-Vergleich. Belegt rot in
    drei Richtungen — darunter eine, die beim Nachmessen erst entstand: die
    Liste erlaubter Typen schützte gar nicht vor SVG (das scheitert schon
    an der Messung), sondern vor WebP, das der Browser liest und Word nicht
    annimmt. Der Prüflauf misst jetzt den Fall, für den die Liste da ist.


L73 — Der Block-Grabstein hat zwei eigene Löcher — GESCHLOSSEN
================================================================================

**GESCHLOSSEN am 29. August 2026.** Teil 1 (trashBlock ohne edited) mit
E250/test257; Teil 2 (trash+purge im selben Tick, Frist-Purge offline,
Wiederbelebung beim Holen) mit E254/test261: Merkliste `wolkeBloeckeWeg`
nach dem E249-Muster, Schreibpunkt in purgeTief (samt Zeilen, Ansichten
und Sammlung — deren Löschen war über den Abgleich vorher gar nicht
ausdrückbar), Versand vor dem Holen, basis-Wache, zwei Runter-Wachen
gegen Echo und Leichen. Rein clientseitig; der Server konnte geloescht
längst. Zwei Folgelücken daraus: L74 (Import „ersetzen" verliert die
Wolke-Merklisten) und L75 (Merklisten-Schreibfenster bei mehreren Tabs).

Der ursprüngliche Eintrag:


Beim Vermessen für E249 (Datei-Grabsteine) fand der Leser, dass das
VORBILD — der Weg, auf dem Block-Löschungen zum Server wandern — selbst
undicht ist. Zwei Fälle, beide nach reiner Code-Lage:

  · **trashBlock hebt `edited` nicht an** (src/kern/ablage/indexdb.ts,
    trashBlock setzt nur alive:false und trashedAt). `zuSchicken` filtert
    aber mit `edited||created <= wolkeMarkeHoch`. Ein Block, dessen
    letzte Bearbeitung vor der letzten Hoch-Marke liegt, trägt sein
    Papierkorb-Flag nie zum Server. Genau für dieses Muster bekamen
    updateCollection/updateView eigens ihren Zeitstempel.

  · **trash + purge im selben Tick**: das verbreitete Muster
    `Store.trashBlock(id); Store.purgeBlock(id);` (Editor, Mehrfach-
    auswahl, KI-Dienst) entfernt den Satz aus dem Cache, bevor je ein
    Abgleich lief — auch das weiche geloescht-Flag erreicht den Server
    dann nie. Der Satz verschwindet lokal, drüben lebt er weiter.

Beides gehört NICHT als Beifang in E249 (eine Änderung, ein Ziel — §45),
sondern als eigener Eingriff: trashBlock einen Zeitstempel geben und für
den Sofort-Purge dasselbe Merklisten-Muster erwägen, das E249 für
Dateien gebaut hat. Bis dahin gilt: eine Block-Löschung, die den Server
erreichen soll, braucht einen Abgleich zwischen Papierkorb und
endgültigem Löschen.

Gefunden am 29. August 2026 (L6-Leser, Belegstellen in E249).

================================================================================
L74 — Import „ersetzen" verliert die Wolke-Merklisten — GESCHLOSSEN
================================================================================

**GESCHLOSSEN am 29. August 2026** mit E255/test261 §11: importAll
rettet im Ersetzen-Zweig die Vereinigung von wolkeDateienWeg,
wolkeBloeckeWeg und wolkeDateienOben; Grabsteine für Kennungen, die die
Sicherung selbst wieder mitbringt, fallen (Wieder-Anlage-Prinzip). Die
Frage nach Token/Marken nach dem Ersetzen ist L76.

Der ursprüngliche Eintrag:


`importAll` im Ersetzen-Modus tauscht auch das Fach `meta` vollständig.
Eine noch nicht versandte `wolkeDateienWeg`- oder `wolkeBloeckeWeg`-Liste
stirbt dabei bzw. wird durch die der Sicherung ersetzt: eine kurz vor dem
Import getätigte endgültige Löschung erreicht den Server dann doch nie.

Das Löschen des BESTANDS beim Ersetzen bleibt mit Absicht ohne
Grabsteine (E249/E254): eine alte Sicherung einzuspielen darf nicht als
Massenlöschung zum Server durchschlagen. Offen ist nur das Hinüberretten
der beiden Merklisten (und wohl der Wolke-Marken) aus dem alten Bestand —
ein eigener, kleiner Eingriff am Import, nicht am Abgleich.

Gefunden am 29. August 2026 (E254-Leser, Risiko 4).

================================================================================
L75 — Merklisten-Schreibfenster bei mehreren Tabs
================================================================================

`setMeta` schreibt den Zwischenspeicher sofort, die Platte folgt nach
dem Flush — ein Tab-Schluss unmittelbar nach einem Sofort-Löschen kann
den frischen Grabstein-Eintrag verlieren. Und Lesen-Ändern-Schreiben
derselben Liste in zwei Tabs kann Einträge des jeweils anderen
überschreiben. Beides betrifft `wolkeDateienWeg` (seit E249) und
`wolkeBloeckeWeg` (seit E254) gleichermassen und ist dieselbe bereits
hingenommene Restlücke: der doppelte Versand ist serverseitig
idempotent, das Überleben eines normalen Neuladens ist geprüft
(test256 §3, test261 §3). Ein echter Verbund bräuchte Merklisten als
eigene Sätze statt als EINE Meta-Liste — erst angehen, wenn Multi-Tab
plus Wolke wirklich zusammen gemessen wird.

Gefunden am 29. August 2026 (E254-Leser, Risiko 3).

**HALB GESCHLOSSEN am 1. September 2026 durch E341 — und zuerst GEMESSEN.**
Das „kann" oben war drei Tage lang eine Vermutung. Nachgemessen mit zwei
Seiten auf derselben Ablage: beide hängen einen Grabstein an, danach steht
EINER da. Kein „kann", sondern ein „tut".

`metaListeAendern` liest die Liste aus der ABLAGE, lässt sie ändern und
schreibt zurück — in EINER Transaktion, die IndexedDB auch über Tabs hinweg
hintereinander reiht. Danach überleben beide. Die fünf Schreibstellen der
drei Merklisten gehen darüber; test333 hält es fest, samt der Gegenprobe,
dass der ALTE Weg im selben Aufbau einen verliert.

Gerechnet wird ZWEIMAL: einmal sofort gegen den Zwischenspeicher, damit ein
Lesen unmittelbar nach dem Schreiben stimmt, und einmal in der Transaktion
gegen den echten Stand — der zweite gewinnt. Der erste Wurf liess das erste
weg und riss damit fünf bestehende Zusagen ein (test256 zweimal, test261
sechsmal): `purgeTief` liest die Liste im nächsten Atemzug wieder. Deshalb
muss jede Änderungsfunktion, die hier hineingegeben wird, zweimal aufrufbar
sein, ohne dass es etwas ausmacht.

WAS OFFEN BLEIBT, und die Bedingung von oben gilt unverändert: die Liste
ist weiterhin EIN Satz. Zwei GERÄTE über die Wolke bringt das nicht
zusammen — dafür braucht jede Merknotiz einen eigenen Satz, und das lohnt
erst, wenn Multi-Tab plus Wolke wirklich zusammen gemessen wird. Ebenso
offen: der Tab-Schluss unmittelbar nach einem Sofort-Löschen, bei dem der
Flush nicht mehr durchkommt.

**Nachtrag vom 1. September 2026 (E314):** es ist jetzt eine Liste mehr.
`wolkeNachtrag` merkt sich die Kennungen einer dazugelegten Sicherung und
wird nach dem Versand gestrichen — dasselbe Lesen-Ändern-Schreiben, dieselbe
Restlücke. Und derselbe Trost: ein doppelt geschickter Satz ist serverseitig
harmlos, ein verlorener Eintrag bedeutet nur, dass der nächste
Vollabgleich ihn holt. Die Bedingung von oben gilt unverändert — ein echter
Verbund braucht Merklisten als eigene Sätze, und das lohnt erst, wenn
Multi-Tab plus Wolke wirklich zusammen gemessen wird.

================================================================================
L76 — Wolke-Zustand nach Import „ersetzen" ist unentschieden — GESCHLOSSEN
================================================================================

E255 rettet die drei Lösch-Merklisten — Token, Bereich, Salz, Marken
und das Abgleich-Ja folgen weiter der Sicherung (bzw. verschwinden,
wenn sie dort fehlen). Beides ist verteidigbar und beides hat Haken:
Marken mitnehmen hiesse, der wiederhergestellte (ältere) Bestand ist
für zuSchicken unsichtbar — der Server behielte den neueren Stand und
die Geräte lögen auseinander; Marken verlieren hiesse Voll-Neuabgleich
mit „veraltet"-Gewitter. Auch `basis` bleibt beim Import unangetastet
und beschreibt danach einen Bestand, den es nicht mehr gibt. Gehört
als EIGENE Entscheidung geplant (Import-Dialog könnte fragen: „Konto
behalten und Bestand neu abgleichen?"), nicht als Beifang.

Gefunden am 29. August 2026 (beim Bau von E255).

**GESCHLOSSEN am 31. August 2026 durch E279.** Und zwar genau so, wie es
hier gefordert stand — als eigene Entscheidung, nicht als Beifang: die
Identität des Geräts überlebt das Einspielen, die drei Marken gehen auf
null, die `basis` wird geleert UND für die überlebenden Grabsteine neu
gesät (ohne das Neusäen wären E254/E255 durch die Hintertür wieder offen
gewesen). Danach hält Redion den Abgleich an und FRAGT, statt eine Richtung
zu wählen. Die Frage steht in einem eigenen Meta-Schlüssel und nicht in
`wolkeAbgleich` — dessen Rückfallweg liest die Marken, und die eben zu
leeren hätte still „nur lokal" gewählt.

Was E279 NICHT deckt, steht als L100: beim Dazulegen bleiben die Marken
stehen.

================================================================================
L77 — Was das Notizhefte-Regal (E264) bewusst noch nicht kann
================================================================================

Fünf hingenommene Grenzen der ersten Fassung, jede mit Grund:

1. ✅ Die Regal-Suche findet nur TITEL — seit E282 führt sie aber
   dorthin: unter dem Ergebnis steht eine Zeile, die das getippte Wort
   in die grosse Suche mitnimmt (auch bei Treffern, nicht nur bei
   null). Nachgebaut wird die grosse Suche weiterhin nicht (E29).
2. Die Heft-Regel liest nur DIREKTE Kinder. Ein Blatt zwei Ebenen tief
   macht die Seite nicht zum Heft — dieselbe Lesart wie die
   Bibliotheks-Deckelart, und billig; wer tief verschachtelt, findet
   die Seite weiter in Bibliothek und Baum.
3. Eine Seite mit PDF-Seiten UND Blättern zählt als PDF, nicht als
   Heft (PDF-Vorrang wie in der Bibliothek) — sie steht in der
   Bibliothek, nicht im Regal. Bleibt offen und ist seit E366 die
   verbliebene Hälfte von L114 Punkt 3.
4. ✅ Keine Deckelfarben — seit E265 erledigt: `p.color` wird als
   Kante am Deckel gezeichnet, mit Whitelist.
5. Kein Ziehen-Sortieren im Gitter; sortiert wird nach zuletzt
   bearbeitet, was die Weiterschreiben-Frage am besten beantwortet.

Gefunden am 30. August 2026 (beim Bau von E264).

================================================================================
L78 — Was die Heft-Bibliothek (E265) bewusst noch nicht kann
================================================================================

L77 Punkt 4 (Deckelfarben) ist damit erledigt. Neu hingenommen:

1. ~~Kein Ziehen-und-Ablegen ins Fach~~ — ERLEDIGT in E368, dem eigenen
   Bogen mit Telefon-Fassung, den dieser Punkt verlangt hatte. EINE Geste
   über Pointer-Ereignisse für Maus und Finger (`dragstart` wie in der
   Seitenleiste wäre am Telefon gar nichts); am Finger hebt langes Drücken
   (400 ms), ein Wisch davor rollt weiter. Ziel sind ein Fach, die
   Brotkrume (nimmt heraus) und die freie Fläche; alles ausserhalb tut
   nichts. Der Ring ist gesperrt, die Ablegezone trägt Rahmen UND Fläche
   (§38), und danach steht ein Satz, der Heft und Ziel nennt — beim Ziehen
   gibt es kein Menü, in dem man den Zielnamen eben noch gelesen hätte.
   test360, 32 Punkte. Was bleibt: keine Mehrfachauswahl (ein Heft je Zug),
   und kein Sortieren innerhalb eines Fachs durch Ziehen (Punkt 5 von L77
   steht weiter).
2. ~~Das Regal zeigt EINE Fach-Ebene~~ — ERLEDIGT in E366, dem eigenen
   Bogen, den Redur in E277 dafür verlangt hatte. Ein Fach ist jetzt auch
   dann ein Fach, wenn nur ein FACH darin liegt (rekursiv, mit Tiefen- und
   Ringbremse bei zwölf); die Wurzel zeigt nur die obersten, das offene
   Fach seine Unterfächer, und eine Brotkrume nennt den ganzen Weg — ab
   der zweiten Ebene, an einem Wurzelfach schweigt sie. Der Zurück-Knopf
   führt EINE Ebene hoch und trägt den Namen des Ortes, an den er führt.
   Das Verschieben-Menü kennt jedes Fach mit seinem Weg, nicht nur die
   obersten. test358, 58 Punkte. Was bleibt: kein Ziehen-und-Ablegen
   zwischen den Ebenen (Punkt 1), und ein Fach, das nur über ein
   Unterfach eines ist, bekommt bewusst KEINEN `heftArt`-Merker — sonst
   behauptete der Merker eine Zugehörigkeit, die es nach dem Löschen des
   Unterfachs nicht mehr gibt.

   Nachtrag E283: Die Reiterzeile fehlt im offenen Fach weiterhin mit
   Absicht (die Brotkrume führt zurück, ein Reiterwechsel dort wäre
   zweideutig). Die DARSTELLUNGSWAHL steht seit E283 dagegen auch dort
   — sie wirkte im Fach längst, war aber nur an der Wurzel erreichbar,
   und seit E282 das Fach überlebt, war das eine Sackgasse.
3. ✅ Seit E282 überleben Reiter und offenes Fach das Neuladen
   (`heft:reiter`, `heft:fach`, geschrieben beim Wechseln). Zwei
   Wächter fangen den gelöschten Fall ab. Der Hash bleibt
   `#notizhefte` — ein Fach-Hash bräuchte einen zweiten Start-Leseweg
   und ist damit keine offene Lücke mehr, sondern eine bewusst nicht
   gebaute Zusatzform (ein Fach lässt sich nicht verlinken).
4. ~~Ein Heft, das ANDERSWO verschlüsselt wurde, fehlt im Regal~~ —
   ERLEDIGT in E364: `Werkzeuge.sperren` FRAGT vor dem Verschlüsseln über
   den Bus (`ARTEN.seiteWirdGesperrt`), was die Seite mitnehmen soll, und
   das Regal antwortet „heftArt: heft", solange die Kinder lesbar sind.
   werkzeuge.ts kennt die Heft-Regel weiter nicht — es trägt, was ihm
   gesagt wird (die Regel-Maschine ist der Bus). test356 §1.
5. ~~Ein Fach verliert seine Fach-Eigenschaft, wenn sein letztes Heft im
   Papierkorb liegt~~ — ERLEDIGT in E364: beim Zeichnen des Regals wird
   jedes abgeleitete Fach ohne Merker als `heftArt:'fach'` gemerkt; die
   Karte bleibt, wenn das letzte Heft im Papierkorb liegt. Der Merker
   lügt nicht (eine Seite mit eigenen Blättern fällt vorher heraus).
   Was bleibt: ein Fach, dessen letztes Heft VOR E364 in den Papierkorb
   kam und das seither nie im Regal stand, bekommt den Merker erst,
   wenn das Heft zurückgeholt ist. test356 §2.
6. ✅ Die Listenform lief volle Breite — seit E282 hört sie bei 92ch
   auf (`ch`, damit die Grenze an der Schrift hängt und nicht an einer
   Zahl), links ausgerichtet wie die Kopfzeile darüber.

Gefunden am 30. August 2026 (beim Bau von E265).

================================================================================
L79 — Was das Abdeckband (E266) bewusst noch nicht kann
================================================================================

1. Nur Rechteckform — kein Freihand-Band, keine Muster/Streifen-Optik.
2. Aufdecken zählt nirgends mit: keine Lernstatistik, kein „5 von 8
   gewusst". Wer zählen will, nimmt Lernkarten — das Band ist bewusst
   das leichtere Werkzeug daneben.
3. „Alle aufdecken/zudecken" auf einen Schlag fehlt; bei zwanzig
   Bändern heisst das zwanzig Tipps.

Gefunden am 30. August 2026 (beim Bau von E266).

================================================================================
L80 — Was Haftnotiz und Lineal (E267) bewusst noch nicht können
================================================================================

1. Der Zettel-Umbruch ist GESCHÄTZT (Zeichenzahl je Breite), kein
   echtes Textmass — bei sehr schmalen Zetteln kann eine Zeile knapp
   überstehen. Ein echtes Mass bräuchte getComputedTextLength je
   Zeile beim Zeichnen.
2. Zettel lassen sich verschieben, aber nicht nachträglich in der
   Grösse ziehen — das gehört zum Auswahl-Feinschliff (E269,
   Skalier-Griffe für alle Marken).
3. Das Lineal gilt nur für Linie und Pfeil; Rechteck/Ellipse rasten
   nicht (dort fehlt der Bedarf: die Form ist schon gerade).
4. Der Lineal-Zustand ist je Fläche und Laufzeit — zwei Blätter auf
   einer Seite haben je ihr eigenes Lineal, nach Neuladen ist es aus.

Gefunden am 30. August 2026 (beim Bau von E267).

================================================================================
L81 — Was der Zeitmesser (E268) bewusst noch nicht kann
================================================================================

1. Der Verlauf wird nirgends AUSGEWERTET — es gibt keine Wochensumme,
   kein Fach-Diagramm, keinen Vergleich. Die Zahlen liegen in
   `zeit:sitzungen` bereit; die Auswertung gehört in die Lernwelt, wo
   der Ort dafür schon existiert (dort steht die Lernzeit bis heute
   als Schätzung).
2. ~~Läuft die Uhr, während der Rechner schläft, zählt sie die Schlafzeit
   mit~~ — ERLEDIGT in E364: gezählt wird WACHE Zeit. Kommt ein Tick nach
   mehr als dreissig Sekunden (Schlaf, eingeschläferte Registerkarte),
   wird die Spanne gesehen und nicht gezählt; eine verborgene
   Registerkarte zählt nicht; eine rückwärts gestellte Uhr zählt nicht
   rückwärts. Das Feld nennt den nicht gezählten Schlaf. test356 §3.
3. Kein Ton und keine Systemmeldung beim Ablauf, nur der Hinweis in
   der App. Wer wegklickt, sieht ihn beim Zurückkommen.
4. ~~Die Uhr überlebt kein Neuladen~~ — ERLEDIGT in E364: der laufende
   Stand geht alle fünf Sekunden (und bei Start, Pause, Ende) nach
   `zeit:laufend`; beim Laden der Ablage wird er wieder aufgenommen — die
   Spanne seit dem Sichern zählt nicht. Beenden vergisst ihn. test356 §4.
5. Nur eine Uhr gleichzeitig; ein zweiter Start beendet die erste
   (und merkt sie, wenn sie lang genug lief).

Gefunden am 30. August 2026 (beim Bau von E268).

================================================================================
L82 — Was der Geräte-Abgleich und die Ordner-Sicherung (E270) noch nicht können
================================================================================

1. **Der Server ist scharfschaltbar, aber nicht scharfgeschaltet.** Alles
   Vorbereitende ist getan; die sechs Befehle in SERVER-EINRICHTEN.md
   (Schritt 0) muss Redur in seinem eigenen Cloudflare-Konto ausführen.
   Bis dahin sagt „Wolke → Server prüfen" in Worten, was fehlt — aber
   abgleichen tut nichts.
2. **Die Ordner-Sicherung geht nur am Rechner.** Safari auf iPhone und
   iPad und Firefox kennen `showDirectoryPicker` nicht. Dort steht ein
   Satz statt eines Knopfs, und der Weg heisst Abgleich.
3. **Läuft der Rechner nicht, sichert nichts.** Es gibt keinen Dienst im
   Hintergrund; der Fünf-Minuten-Takt lebt im offenen Fenster. Ein
   geschlossener Reiter sichert nicht, und beim Schliessen zu sichern
   kann die Plattform nicht (siehe E270).
4. **Die Sicherungen im Ordner sind unverschlüsselt.** Absicht — sonst
   wären sie ohne Redion nicht zu öffnen, und genau das soll dieser Weg
   leisten. Wer den Ordner in einen Cloud-Dienst legt, legt seine Daten
   in die Hand dieses Dienstes. Der Dialog sagt es beim Einschalten; in
   den Einstellungen steht es nicht noch einmal.
5. **Der Abdruck erkennt keine Änderung an einem Anhang.** Er läuft über
   Blöcke, Sammlungen und Ansichten. Wer nur eine Datei austauscht, ohne
   dass ein Block sich ändert, löst keine Sicherung aus — bis zur
   nächsten echten Änderung.

   **GESCHLOSSEN am 1. September 2026 durch E294.** Die Dateischicht hebt
   bei jedem `dateiPut` und `dateiWeg` die Marke `dateien:stand`, und der
   Abdruck liest diese EINE — nicht `meta` als Ganzes, denn dort schreibt
   die Sicherung selbst zwei Marken hin und der Abdruck wäre nach jedem
   Sichern sofort ein anderer. `test288`, 8 Punkte, mit beiden
   Gegenproben.
6. **Kein Fortschritt beim Schreiben.** Ein 500-MB-Paket wird still
   geschrieben; man sieht nur hinterher, dass es da ist. Für die Grössen,
   um die es heute geht, reicht das.
7. **`ADRESSEN` (mehrere Adressen) ist gebaut, aber ungeprüft** — kein
   Prüflauf fährt zwei Ursprünge gegen denselben Server.
8. **Die Aufbewahrung ist nicht einstellbar.** Sieben Tage plus je Monat
   einer stehen fest im Code. Wer mehr will, hat den Ordner ja selbst.

9. **Das Wolke-Fenster war beim Hinsehen fast unbedienbar** — und das
   ist behoben, aber der Grund steht noch: `grund.css:169` nimmt JEDEM
   Knopf Rahmen und Hintergrund, und wer welche will, holt sie sich über
   eine Klasse. Das Wolke-Fenster hatte seit E251 keine. „Mit GitHub
   anmelden" stand als nackte Zeile da. Es gibt keinen Prüflauf, der
   fragt, ob ein Knopf wie einer aussieht — und andere Fenster mit
   demselben Muster sind ungeprüft. Wer das nächste baut, gibt ihm eine
   Klasse.

   **GESCHLOSSEN am 1. September 2026 durch E293.** `test289` fragt es:
   ein sichtbarer Knopf mit einem WORT muss sich von gewöhnlichem
   Fliesstext in mindestens einem Punkt unterscheiden — Rahmen,
   Hintergrund, Unterstreichung, Farbe oder Schriftstärke, am Knopf selbst
   oder an einem seiner Nachkommen. Geprüft werden sechs Fenster, das
   Menüband und die Kopfleiste. Er hat sofort etwas gefunden: die
   Trefferliste im Schlagwortregister stand als nackter Text da und heisst
   jetzt `.tagtreffer`.

Gefunden am 30. August 2026 (beim Bau von E270, beim Ansehen der Bilder).

================================================================================
L83 — Was zwischen „gepusht" und „Redur sieht es" noch fehlt (E271)
================================================================================

1. ~~**Der Prüflauf wird nicht abgewartet.**~~ ERLEDIGT in E361: `holen.bat`
   fragt vor dem Holen die GitHub-API nach dem letzten Lauf auf `main` —
   grün wird genannt, rot und „läuft noch" fragen (nach 30 s ohne Antwort
   Nein), ohne Antwort wird gewarnt und trotzdem geholt; danach vergleicht
   es die Kennung des Geprüften mit der des Geholten. Nicht auf Windows
   ausgeführt — test353 §5 liest nur den Text; der erste Doppelklick bei
   Redur ist die Probe.
2. ~~**Kein Skript sagt, auf welchem Weg Redur gerade schaut.**~~ ERLEDIGT
   in E361: Einstellungen → „Über diese App" → „Stand" nennt Fassung,
   Bauzeit und den Weg (Ordner, örtlicher Server, Cloudflare, Netz) — aus
   `stand.ts` und der Adresse. test353 §6.
3. ~~**Zweimal F5 ist ein Rennen, keine Zusicherung.**~~ ERLEDIGT in E361:
   `dienststand.mts` rechnet beim Bauen einen Stempel über den Grundstock
   und hebt `VERSION` in `sw.ts` von selbst, sobald er sich ändert;
   test353 §2 rechnet ihn nach, und der schnelle CI-Job (`npm run stand`)
   wird rot, wenn der Bau vergessen wurde. Das Rennen selbst bleibt (zwei
   Ladevorgänge) — nur die Erhöhung, ohne die es ein Rennen ohne Ziel war,
   ist jetzt zugesichert.
4. **Die Rettungen häufen sich an.** Jeder Lauf von `holen.bat` mit eigener
   Arbeit legt einen `sicherung/`-Zweig und eine Ablage an. Niemand räumt sie
   je weg, und niemand fragt, ob sie noch gebraucht werden. `hochladen.bat`
   nennt sie wenigstens.
5. **Der Rückweg aus der Rettung ist keine Doppelklick-Sache.** `git stash
   apply` und `git cherry-pick` stehen auf dem Bildschirm, aber wer sie
   braucht, ist per Definition in der Lage, in der er sie nicht sicher
   ausführen kann. Der Text sagt deshalb „melden" — das ist ehrlich, aber
   keine Lösung.
6. **`ADRESSEN` (mehrere Adressen) bleibt ungeprüft** — siehe L82.7.
7. **Die Skripte gibt es nur auf Windows.** Kein `.sh`-Gegenstück. Bisher
   kein Bedarf, aber es steht nirgends.

Gefunden am 30. August 2026 (beim Bau von E271, durch die Prüfung).

================================================================================
L84 — ERLEDIGT: „Simulation starten" war lesbar, die MESSUNG war falsch
================================================================================

**Aufgelöst am 30. August 2026 in E272 Phase G — und zwar anders, als hier
stand.** Der Knopf hatte nie einen Kontrastfehler. Nachgemessen am laufenden
Knopf:

    color            rgb(255, 255, 255)
    backgroundColor  rgba(0, 0, 0, 0)
    backgroundImage  linear-gradient(rgb(124,58,237), color(srgb 0.44 0.20 0.84))

Redions Hauptknöpfe tragen die Marke `--haupt-flaeche`, und die ist ein
Verlauf — also ein background-IMAGE. `getComputedStyle(el).backgroundColor`
gibt dafür `rgba(0,0,0,0)` zurück. Der Aufstieg in `test128` suchte den
ersten deckenden Grund, lief an der violetten Fläche vorbei und landete auf
der weissen Tafel dahinter: weiss auf weiss, 1,07 zu 1. Weiss auf #7c3aed
sind in Wahrheit rund 5,3 zu 1.

Der Absatz oben (E142, `lernwelt.css:538-544`) erreicht den Knopf also sehr
wohl — die Vermutung, ein Selektor sei dazwischengekommen, war falsch. Sie
stand hier drei Wochen und hat einen ganzen Abschnitt lang plausibel
geklungen; das ist genau der Grund, warum die Notiz „im Browser messen, nicht
aus der Datei lesen" darin steht.

Die Messung liest jetzt auch Verläufe (mit ihrer schlechtesten Farbstufe) und
rechnet halbdurchsichtige Schichten übereinander. Sie fand danach denselben
echten Fall, den ihre eigene Gegenprobe einbaut — sie ist also nicht blind
geworden, sondern genauer. **test128: 54 ok, 0 offen.**

Was hier vorher stand, bleibt als Beleg stehen:

--------------------------------------------------------------------------------

`test128` meldet: **Prüfungszentrale, hell — „Simulation starten" [1.07:1].**
Ein Kontrast von 1,07 zu 1 heisst: der Knopf ist da, er ist anklickbar, und
man sieht ihn nicht. §38 verlangt mindestens 4,5:1.

Nachgemessen, damit die Zuordnung stimmt: der Fehler fällt auch auf dem
Stand **vor** E270/E271 (Commit `18950b19`) — er stammt nicht aus dieser
Arbeit. Gefunden hat ihn der volle Prüflauf, der hier ohnehin lief.

Was schon bekannt ist: **E142 hat genau diesen Fall einmal behoben** —
weisse Schrift auf `--bg-side`, weil `.lernwelt .lw-exam-list footer button`
spezifischer war als die Hauptknopf-Regel und keine Schriftfarbe setzte. Die
Reparatur steht in `quell/schale/stil/lernwelt.css:538-544`. Offenbar
erreicht sie diesen Knopf heute nicht mehr, oder ein weiterer Selektor ist
dazwischengekommen.

Nicht behoben, weil es ein anderer Bogen ist als E271 und weil eine
Vermutung hier nichts wert wäre: welcher Selektor gewinnt, muss im Browser
gemessen werden, nicht aus der Datei gelesen. Ein Anlauf dazu ist gescheitert
(die Prüfungskarte wurde im Messaufbau nicht gezeichnet) — der nächste
beginnt am besten bei `test128:483-517`, das den Knopf nachweislich findet.

Gefunden am 30. August 2026 (voller Prüflauf während E271).

--------------------------------------------------------------------------------
L85 — Vier Prototyp-Knöpfe ohne Griff (E272) — GESCHLOSSEN
--------------------------------------------------------------------------------

GESCHLOSSEN am 31. August 2026 (E283). Redur hat in E277 nicht „alle vier
bauen" entschieden, sondern ausgewählt: Vollbild bauen, volle Breite
zusammenziehen, Zoom und Senden streichen. Zwei davon sind gebaut, zwei sind
BEANTWORTET — und eine beantwortete Frage ist keine Lücke mehr. Was jeweils
geschah, steht unten bei den Punkten.

Beim Inventar für die Premium-Schale (doku/PREMIUM-SHELL-MATRIX.md, Teil 5)
haben vier Knöpfe des v13-Entwurfs in Redion kein Gegenstück. Sie bekamen
KEINEN erfundenen — hier steht, was fehlte und was stattdessen dastand.

1. VOLLBILD. Im ganzen `src/`-Baum gibt es keinen Vollbild-Griff.
   `requestFullscreen` kommt zweimal vor: `werkzeuge.ts:995` im
   Präsentationsmodus und als `allowfullscreen`-Attribut einer Einbettung
   (`editor.ts:1342`). `Werkzeuge.fokus()` (`werkzeuge.ts:835`) setzt nur eine
   CSS-Klasse an `body`.
   → ✅ GEBAUT (E283). `App.vollbild()` / `vollbildAn()` / `vollbildGeht()`,
     der Knopf steht im Reiter Ansicht neben „Fokus" (die beiden tun
     Gegenteiliges: Fokus räumt Redion weg, Vollbild den Browser). Der
     Zustand wird NIE gemerkt, sondern frisch gelesen — Escape beendet das
     Vollbild ohne uns. Wo der Browser kein Element-Vollbild kann (iPhone,
     eingebetteter Rahmen), verschwindet der Knopf, statt dazustehen (§47).

2. ZOOM. Kein Griff. Strg + / − / 0 setzt `Store.setMeta('schriftgroesse', …)`
   in drei Stufen, inline im Tastenhandler `schale.ts:2436-2451`.
   → ✅ GESTRICHEN (E277/E283, Redurs Entscheidung). PDF, Whiteboard und
     Zeichenfläche haben ihren eigenen, echten Zoom. Ein vierter „globaler"
     wäre entweder dasselbe wie Strg + / − des Browsers (überflüssig) oder
     ein zweiter Massstab daneben (verwirrend). Die Schriftgrösse bleibt
     über Strg + / − / 0 und „Aussehen …" erreichbar. test277 §5 misst,
     dass kein halber Zoom-Knopf auftaucht.

3. VOLLE BREITE. Kein benannter Griff. Der Schalter lebt zweimal:
   `schale.ts:432` (Seitenmenü) und `kopfleiste.ts:269` (`data-a="wide"`),
   beide als `Store.updateBlock(p.id, { wide: … })`.
   → ✅ GEBAUT (E283) — und es waren DREI Stellen, nicht zwei: der Schalter
     in der Schalterzeile desselben Menüs war hier übersehen. Alle drei
     rufen jetzt `App.volleBreite(p, an?)`; die Kopfleiste bekommt ihn über
     `braucht('volleBreite')` gebunden, damit ein Vergessen laut wird statt
     still. test277 §4 misst den ausgelieferten Quelltext, nicht nur das
     Verhalten: alle drei taten schon das Richtige, sie taten es nur jeder
     für sich.

4. SENDEN. `Mail.senden` gibt es nicht. Der Code sagt es selbst,
   `editor.ts:2369-2372`: „Hier stand `Mail.senden(…)` — die Funktion gibt es
   nicht. Das Mail-Modul kann lesen und antworten, aber nicht von sich aus
   verschicken." Die zwei tatsächlichen Wege sind `location.href = 'mailto:…'`
   (`editor.ts:2373`, `steuerung.ts:7823`) und Gmails Compose-Fenster in einem
   neuen Tab (`mail.ts:363`).
   → ✅ GESTRICHEN (E277/E283, Redurs Entscheidung). Die Backstage-Sektion
     heisst „Weitergeben" und öffnet `Werkzeuge.teilenMenue` — den echten,
     vollständigen Weg. Ein Knopf „Senden", der in Wahrheit `mailto:`
     öffnet, behauptet mehr als er tut. Echtes Senden aus Redion heraus
     wäre ein eigener Bogen mit eigener Entscheidung (Anbieter, Konto,
     Zustellung), nicht eine Beschriftung.

Warum das hier steht und nicht einfach gebaut wird: ein Knopf, der dasteht und
beim Klick sagt, dass er hier nicht geht, ist schlimmer als einer, den es nicht
gibt. Das ist die Begründung von `zeigen()` im Menüband (§47), und sie gilt für
Backstage genauso.

--------------------------------------------------------------------------------
L86 — Drei tote Verdrahtungen in der Schale (E272, Phase A gefunden) — GESCHLOSSEN
--------------------------------------------------------------------------------

`schale.ts:3050` bindet Knöpfe mit
`document.getElementById(id)?.addEventListener(…)`. Der Optional-Chain
verschluckt jede Kennung, die es nicht mehr gibt — kein Fehler, keine Warnung,
kein Prüflauf. Drei Fälle sind heute so:

  · `hl-seiten`  (`schale.ts:3141-3145`) — Element seit E236 weg;
    `produktwelten.ts:278-280` hält das sogar fest, die Zeile in `schale.ts`
    wurde vergessen. Die Handlung `Produktwelten.workspace('start')` ist über
    `btn-workspace` weiter erreichbar.
  · `hl-konto`   (`schale.ts:3177`) — Element seit E236 weg. `arbeitsbereich()`
    ist über `mb-konto` (`menueband.ts:446`) und
    `ansichten/dienst.ts:693` weiter erreichbar.
  · `weltwechsel` (`produktwelten.ts:292`) — der Welt-Umschalter wurde mit E206
    entfernt.

Dazu totes CSS: `produktwelten.css:78` und `:81` ordnen `#hl-konto` und
`#hl-seiten` ein, die es nicht gibt.

Keine dieser drei kostet eine Funktion — alle drei Handlungen sind anderswo
erreichbar. Sie werden in E272 Phase J entfernt, zusammen mit der CSS-Leiche
`#handy-unten` (`bausteine.css:1817-1858`).

Der eigentliche Punkt ist aber allgemeiner und bleibt danach offen: SOLANGE
`an()` still bindet, entsteht die nächste tote Zeile genauso unbemerkt. Ein
Prüflauf, der jede in `schale.ts` verdrahtete Kennung gegen `index.html` hält,
gibt es nicht.

**GESCHLOSSEN am 31. August 2026 durch E280** — beide Hälften. Die drei
Verdrahtungen und die CSS-Leiche `#handy-unten` sind weg (keine Handlung
dabei verloren, jede nachgemessen). Und den fehlenden Prüflauf gibt es jetzt:
`test274` liest ZWEI Sammelstellen — `an('…')` in der Schale und
`getElementById('…')`/`element('…')` in ganz `src/` —, weil eine allein nur
zwei der drei gefunden hätte. Gemessen am Baum von vorher: 26 Bindungen, 142
Nachschlagestellen, genau drei verwaist.

Nebenfund beim Aufräumen: `#hl-dok` hatte gar keine `order`-Regel und stand
nur zufällig richtig (`order` ist ohne Angabe 0). Jetzt stehen alle fünf
Knöpfe durchnumeriert da.

--------------------------------------------------------------------------------
L87 — melde() prüft, meldeLieferant() nicht (E272, Phase A gefunden) — GESCHLOSSEN
--------------------------------------------------------------------------------

`Register.menueband` hat zwei Wege, von aussen Einträge nachzureichen, und sie
sind verschieden streng:

  · `melde(eintrag)` (`menueband.ts:609`) weist ab, was keine `id`, keinen
    `reiter` oder kein `tun` als Funktion hat.
  · `meldeLieferant(fn)` (`:616`) prüft nur, dass `fn` eine Funktion ist. Was
    sie ZURÜCKGIBT, wandert bei `:654` ungefiltert in `alle()`.

Ein Lieferant kann also einen Eintrag ohne `tun` ins Band schieben, den `melde`
abgewiesen hätte. Heute nutzt niemand die Lieferanten (beide Listen sind zur
Laufzeit leer), aber E272 Phase F wird es tun.

Dazu kommt: es gibt kein `nimmZurueckLieferant`. Ein einmal angemeldeter
Lieferant bleibt bis zum Neuladen. test272 §8 umgeht das mit einem Lieferanten,
der sich über eine Schaltmarke selbst entwaffnet — das ist ein Behelf, keine
Lösung.

Offen: dieselbe Prüfung in `alle()` ziehen (dann prüfen beide Wege gleich), und
`nimmZurueckLieferant` ergänzen.

--------------------------------------------------------------------------------
L88 — Zwei Wächter waren schon rot, bevor E272 anfing — GESCHLOSSEN
--------------------------------------------------------------------------------

Beim Ausgangsmessen für die Premium-Schale (Phase A) liefen alle Schalen-Wächter
mit. Zwei waren rot, und zwar auch dann, wenn man die Änderungen der Phase A
wieder herausnimmt (mit `git stash` gemessen, beide Male dasselbe Ergebnis):

  test247:547  „Und braucht dafür nur eine Zeile" — **227 px**, erlaubt ≤ 150
  test248:282  „Ausgeschaltet ist die Leiste wieder so voll wie früher"
               — **29** Knöpfe, erwartet ≥ 30

ZU test247. Das Band steht bei offener Seite in ZWEI Zeilen. Mit Augen bestätigt
(`node bilder.mts schaleBandStart`): im Reiter Start liegt „Absatz" mit neun
Knöpfen oben, „Schrift" mit fünf darunter, zusammen rund 270 px. Der Kommentar
über der Prüfung beschreibt genau diesen Fall schon einmal — „Mit der Gruppe
„Finden" waren es zwei und 221 px". Er ist wiedergekommen.

Und beim Hinsehen fiel ein zweiter Mangel auf, den keine Prüfung misst: die
Gruppentitel stehen UNTER ihren Knöpfen. „ABSATZ" steht zwischen der
Absatz-Zeile und der Schrift-Zeile und liest sich, als beschriftete es die
Zeile darunter.

  → Beides erledigt Phase C/D von E272: 58 px hohes Band, höchstens 15
    sichtbare Befehle, der Rest in das reitereigene `•••`. Genau dafür ist
    die 15er-Regel da.

ZU test248. Ohne die ruhige Fassung sollen mindestens 30 Knöpfe in der
Seitenleiste stehen; es sind 29. Einer ist irgendwann weggefallen, ohne dass
jemand die Zahl nachgezogen hat.

  → Phase F von E272 baut die Seitenleiste am Rechner ab; die Zählweise wird
    dort neu festgelegt (Kontextkante statt Leiste). Bis dahin bleibt der Punkt
    rot und ist hier festgehalten, statt still angepasst zu werden.

NACHTRAG AUS PHASE B — es sind fünf, nicht zwei. Beim Setzen der Gold-Marken
lief test245 mit und war ebenfalls rot, wieder vorher wie nachher:

  test245  „Die Seitenleiste liegt zwischen 220 und 250" — **320**
  test245  „Die Kopfleiste ist 52 bis 58 hoch" — **50**
  test245  „… und steht dabei ungefähr in der Mitte des Arbeitsbereichs"
           — **139 Punkte daneben**

Diese drei sind der Konflikt, den der E272-Plan vorhergesagt hat: `einfach.css`
aus PR #46 setzt die Seitenleiste auf 320 px, drückt die Kopfzeile auf 50 und
nimmt die Suche aus der Mitte — E258 wollte genau das Gegenteil. Zwei
Schalen-Vorhaben nebeneinander, die einander widersprechen.

  → Phase C hängt `einfach.css` an einem Präfix ab (Notausstieg bleibt), Phase J
    löscht sie. Danach misst test245 wieder die eine Schale, die es dann gibt.

NACHTRAG AUS PHASE C — vier der fünf sind erledigt, und der fünfte war ein
FALSCHES GRÜN.

Das Abhängen von `einfach.css` hat die drei test245-Punkte und den
test248-Punkt in einem Zug grün gemacht: Seitenleiste wieder 240, Kopfzeile
wieder 54, Suche wieder in der Mitte, 30 Knöpfe statt 29. Sie waren also
tatsächlich alle vier Folgen desselben Stilblatts.

test247:547 wurde dabei ebenfalls grün — und das ist der Fund. Die Prüfung
misst bei EINER Fensterbreite, und zwar bei 1440. Nachgemessen über drei
Breiten, je Reiter, mit offener Seite:

    Breite   start   einfügen   zeichnen   werkzeuge   elektro   ansicht
    1280 px  223 px   223 px     143 px     223 px      143 px   143 px
    1366 px  223 px   223 px     143 px     143 px      143 px   143 px
    1440 px  143 px   223 px     143 px     143 px      143 px   143 px

Bei 1440 passt „Start" zufällig in eine Zeile — das ist die einzige Zelle,
die die Prüfung ansieht. Bei 1280 und 1366 steht dasselbe Band in zwei
Zeilen, und „Einfügen" mit seinen 69 Knöpfen steht bei JEDER Breite in
zwei. Der Kommentar über der Prüfung warnt sogar davor („genau die Sorte
Kippkante, die man nur trifft, wenn man beide Breiten misst") — und misst
dann selbst nur eine.

  → Phase D gibt dem Band die 58 px und das reitereigene „•••" und erweitert
    dabei test247 auf mehrere Breiten UND mehrere Reiter. Vorher wäre eine
    feste Höhe ein Verstecken von Befehlen ohne Weg dorthin.

ERLEDIGT IN PHASE D — alle fünf. Das Band steht jetzt in einer Zeile von
72 px, und die Prüfung dazu misst nicht mehr eine Breite, sondern VIER
(1280 · 1366 · 1440 · 2400) über alle acht Reiter, in test272 §11.

Die 2400 sind kein Zierwert: bei 1280 bis 1440 greift immer schon der Platz —
mehr als zwölf Knöpfe passen dort gar nicht nebeneinander, und die Zahl 15
wird nie erreicht. Die Gegenprobe zeigte es: `HOECHSTENS` auf 99 gesetzt, und
der Lauf blieb grün. Erst auf einem breiten Bildschirm entscheidet wirklich
die Regel und nicht die Breite.

Warum die Punkte hier standen und nicht schnell repariert wurden: eine Zahl in
einem Wächter zu senken, weil sie nicht mehr passt, ist die Bewegung, gegen die
der Wächter gebaut wurde. Sie gehörten in die Phase, die den betroffenen Teil
ohnehin neu baut — und dort sind sie erledigt worden.


--------------------------------------------------------------------------------
L89 — Zwei blinde Prüfungen, gefunden durch ihre eigene Gegenprobe (E272 Phase D)
--------------------------------------------------------------------------------

Beim Schreiben von test272 §11 sind zwei Prüfpunkte entstanden, die NICHT rot
werden konnten. Beide sind behoben; sie stehen hier, weil das Muster
wiederkommt.

1. „NIE MEHR ALS FÜNFZEHN BEFEHLE SICHTBAR", gemessen bei 1280, 1366 und 1440.
   Gegenprobe: die Konstante `HOECHSTENS` von 15 auf 99 gesetzt — der Lauf
   blieb grün. Grund: bei diesen Breiten greift immer schon der PLATZ. Mehr
   als zwölf Knöpfe passen gar nicht nebeneinander, also wird die Zahl 15 nie
   erreicht, und die Prüfung bestätigte eine Grenze, die nichts begrenzte.
   → Behoben durch eine vierte Breite, 2400 px, bei der rund zwanzig passen.

2. „KEIN SICHTBARER KNOPF STEHT ÜBER DEN RAND HINAUS."
   Gegenprobe: die CSS-Regel entfernt, die `[hidden]` überhaupt wirken lässt
   (`.mb-knopf{display:inline-flex}` schlägt das Browser-Stilblatt) — der Lauf
   blieb grün. Grund: die Prüfung misst den letzten Knopf, dessen `hidden`
   FALSCH ist. Wirkt `hidden` nicht, stehen die verborgenen Knöpfe sichtbar
   da, und der gemessene ist trotzdem brav am Platz.
   → Behoben durch eine zweite Messung, `scrollWidth − clientWidth`, die
     fragt: ragt ÜBERHAUPT etwas über den Kasten hinaus.

Der gemeinsame Nenner: beide Prüfungen massen die richtige Grösse am falschen
Gegenstand. Beim nächsten Mal lohnt die Frage vor dem Schreiben — was müsste
kaputt sein, damit dieser Punkt rot wird, und kann das im gemessenen Zustand
überhaupt eintreten?

--------------------------------------------------------------------------------
L90 — Der Namensraum `bs-` ist doppelt vergeben (E272 Phase G)
--------------------------------------------------------------------------------

**GESCHLOSSEN am 1. September 2026 durch E293.** Nicht die eine Stelle war
die Lücke, sondern dass nichts davor warnte — das steht unten ausdrücklich
so. Beides ist jetzt da: `doku/CSS-NAMENSRAEUME.md` führt alle **143**
Präfixe (nicht vierzig, wie hier geschätzt), und `test290` hält Verzeichnis
und Stil zusammen. Ein neues Präfix, das nicht eingetragen ist, macht den
Lauf rot; wer es einträgt, sieht dabei die Liste und merkt, wenn sein
Wunschname schon vergeben ist. Die Gegenrichtung ist mitgeprüft: ein
Verzeichniseintrag ohne Stil ist eine Karteileiche, eine falsche Hauptdatei
zeigt einen unbemerkten Umzug.

Was NICHT gemessen wird und warum: „ein Präfix gehört genau einer Stildatei"
ergab 21 Treffer, von denen keiner ein Fehler war — `db` steht in vier
Dateien, weil der Datenbank-Bereich in vier Dateien wohnt. Redions
Stildateien sind nach Thema geschnitten, nicht nach Präfix.

Der Text darunter bleibt als Beleg stehen.

`bs-` gehört seit dem Formelbuch der BUCHSEITE: `.bs-zeile`, `.bs-kopf`,
`.bs-inhalt`, `.bs-groessen`, `.bs-formel` und ein Dutzend mehr stehen in
`bausteine.css`. Die Datei-Fläche griff beim ersten Entwurf danach — und
erbte prompt `font-weight:700` und `--accent-text` in ihren Unterzeilen. Sie
heisst jetzt `bst-`.

DIE LÜCKE IST NICHT DIESE EINE STELLE, SONDERN DASS NICHTS DAVOR WARNT.
Redion hat rund vierzig CSS-Namensräume mit zwei bis vier Buchstaben (`mb-`,
`lw-`, `dz-`, `rt-`, `sp-`, `fh-`, `bs-`, `bst-` …), und keiner ist
irgendwo aufgeschrieben. Der nächste neue Bereich greift genauso ins Leere,
und der Fehler sieht wieder nicht wie ein Fehler aus — er sieht aus wie ein
Stil, den man nicht bestellt hat.

Was helfen würde: ein Prüfpunkt, der die Präfixe aus allen Stildateien
sammelt und meldet, wenn zwei Bereiche denselben benutzen. Nicht gebaut —
das gehört in einen eigenen Bogen und nicht in eine Schalen-Phase.

Gefunden am 30. August 2026 (E272 Phase G, auf dem Bild).

--------------------------------------------------------------------------------
L91 — Die Seitenleiste ist am Rechner weg, und mit ihr drei Kleinigkeiten — GESCHLOSSEN
--------------------------------------------------------------------------------

E272 Phase F stellt `#sidebar` am Rechner auf `display:none`. Die Leiste
selbst ist NICHT gelöscht — am Telefon ist sie die Schublade, `#tree` darin
ist der einzige Seitenbaum, und die Lade der Kontextkante schiebt ihn sich
herüber. Drei Dinge sind damit trotzdem am Rechner nicht mehr erreichbar:

  1. ✅ DER ZIEHGRIFF — die Frage ist beantwortet (E277/E283). Redur:
     „Die Kante bleibt fest. 54 px, kein Ziehgriff am Rechner. Links
     stehen Werkzeuge und Zeichen, nicht die alte Seitenleiste. Die
     aufklappende Lade darf davon getrennt ihre rund 250 px haben."
     `.side-griff` selbst ist nicht gelöscht — die Mechanik wird weiter
     geprüft (test52, test143 blenden die Leiste für die Messung kurz
     ein). Es ist also nichts entfernt, nur nichts gebaut.

  2. DER ARBEITSBEREICHS-KNOPF `#btn-settings` (das „N Redion" oben links).
     Sein Weg lebt weiter: „Datei → Konto → Arbeitsbereich" (Phase G) und
     der Kontokreis rechts im Band.

  3. DIE DREI SEITENLEISTEN-REITER (`start`/`chat`/`bespr`). Chat und
     Besprechungen erreicht man über den Reiter „Gehen" und über das
     KI-Panel; der Umschalter selbst gibt es am Rechner nicht mehr. Der
     Plan sah dafür einen eigenen Commit vor („Griffwechsel w-agenten/
     w-bespr auf `App.kiPanel(true)`/`Meeting.panel()`") — der steht noch
     aus.

Gefunden am 30. August 2026 (E272 Phase F, beim Durchgehen der Wächter).

GESCHLOSSEN am 1. September 2026, nachgemessen statt behauptet:

  Punkt 1  war schon mit E277/E283 beantwortet.
  Punkt 2  der Weg lebt weiter — „Datei → Konto → Arbeitsbereich" und der
           Kontokreis im Band, beide gebaut.
  Punkt 3  die zwei Einträge stehen im Menüband unter „Gehen → Verbinden"
           (`register/menueband.ts:697` und `:702`) und rufen
           `Agent.panel()` bzw. `Meeting.panel()`. Beide Ziele gibt es
           (`bereiche/verbinden/besprechung.ts:544`). Das war genau der
           Commit, den der Plan noch vorsah.

--------------------------------------------------------------------------------
L92 — Blockarten haben kein Strichzeichen (E272 Phase F) — GESCHLOSSEN
--------------------------------------------------------------------------------

Die Lade „Blöcke" der Kontextkante zeigt den echten Bestand aus
`Register.bloecke` — 43 Arten, jede mit Namen, keine mit Bild. Der Grund
steht im Register: jeder Eintrag führt `icon` (ein Emoji oder ein Zeichen
wie `¶`), aber kein `zeichen` aus `Register.symbole`.

E202 hat Emoji aus der Schale verbannt, und zu Recht — sie sehen auf jedem
System anders aus und tragen nicht die Farbe ihrer Zeile. In Phase E hat
`Register.module` und `Register.navigation` deshalb ein Feld `zeichen`
bekommen. Für `Register.bloecke` wären das dreiundvierzig neue Striche;
das ist ein eigener Bogen und keine Nebensache in einer Schalen-Phase.

Bis dahin ist die Liste eine reine Textliste. Das ist nicht falsch — nur
weniger, als sie sein könnte.

Gefunden am 30. August 2026 (E272 Phase F, auf dem Bild).

GESCHLOSSEN am 31. August 2026 (E273). Es wurden nicht dreiundvierzig
Striche, sondern siebenundzwanzig: die typografischen Zeichen — `¶`, `H₁`,
`☑`, `•`, `1.`, `▸`, `❝`, `—`, `▦`, `☰`, `∑`, `⌨` — sind einfarbig, tragen
die Farbe ihrer Zeile und sehen im Band genau richtig aus. Sie bleiben.
Ersetzt wurden die echten Emoji.

Zwei davon waren auf dem Bild als Fehler zu sehen, und beide hätte keine
Messung gefunden (§55.1):

  · 💡 „Callout" war ein GELBER KLECKS in einer Reihe einfarbiger Zeichen.
  · 🖼 „Bild" war im Überlauf ein LEERES KÄSTCHEN — die Schrift hat das
    Zeichen gar nicht.

Elf Symbole kamen dafür neu ins Symbolregister (image · video · audio ·
paperclip · bookmark · lightbulb · palette · smile · move · grid ·
circleDot), zusammen achtzig. Das Feld heisst `zeichen`, ist freiwillig,
und `einfuegenEintraege` liest `zeichen ?? icon` — wer keines nennt,
behält sein Schriftzeichen.

test86 hat einen neuen Abschnitt: jedes `zeichen` muss ein Symbol nennen,
das es wirklich gibt. Ohne ihn wäre ein Tippfehler unsichtbar — `zeichenIn`
setzt einen unbekannten Namen als TEXT, und im Band stünde klein und grau
das Wort „lightbolb". Die Gegenprobe daneben meldet genau so einen Block
an und sieht ihn auffallen.

--------------------------------------------------------------------------------
L93 — Der Chatverlauf hat am Rechner kein Zuhause (E273) — GESCHLOSSEN
--------------------------------------------------------------------------------

Der Seitenleisten-Reiter „chat" zeigte `KI.seitenleiste(baum)`: die eigene
Person, die Agenten und den nach Tagen gruppierten Chatverlauf. Am Rechner
ist die Seitenleiste seit E272 Phase F `display:none`, und `KI.seitenleiste`
wird von nirgends sonst gerufen — die Liste ist dort also nicht mehr zu
sehen.

Was es weiter gibt: `App.kiPanel(true)` öffnet das KI-Panel mit dem
AKTUELLEN Chat (✦ in der Kontextkante, Strg + J), `KI.neuerChat()` beginnt
einen neuen, `Agent.panel()` zeigt die Agenten. Was fehlt, ist der Weg zu
einem ÄLTEREN Chat: `KI.chatsGruppiert()` und `KI.chatOeffnen(id)` gibt es,
sie werden am Rechner nur von niemandem gerufen.

Der richtige Ort ist die KI-Kontextkante — ein Knopf „Verlauf" mit
`liefern: () => KI.chatsGruppiert()`. Er steht nicht hier, weil erst zu
klären ist, unter welchem Schauplatz die KI überhaupt erscheint: sie ist ein
Panel NEBEN dem Inhalt und möglicherweise gar kein eigener Ort. Am Telefon
ist die Liste unverändert da.

Gefunden am 31. August 2026 (E273, beim Griffwechsel).

GESCHLOSSEN am 31. August 2026 (E273). Die Frage im Absatz darüber hat eine
Antwort bekommen, und sie lautet: **die KI ist kein Ort.** `kiPanel` schaltet
eine Klasse auf `#ai` und lässt `sonder` und `seiteId` in Ruhe — wer das
Fenster öffnet, steht weiter im Editor oder in der Bibliothek. Es gibt keinen
Schauplatz `ki`, auf den sich ein Kantenknopf melden könnte, und einen zu
erfinden hiesse, die Kante über die KI Bescheid wissen zu lassen (§5).

Der Verlauf steht deshalb im KOPF des KI-Fensters, neben „Neuer Chat" — das
Fenster ist sein eigenes Zuhause. Und nicht als zweite Liste: die Zeichnung
ist aus `seitenleiste()` herausgelöst (`chatBaum(ziel)`) und wird von beiden
Orten gerufen, vom Telefon und vom Rechner (§8).

Nebenbei drei Emoji weniger. Die Liste war nur Seitenleiste; seit sie auch
Schale ist, gelten dort E202-Regeln — 💬 war ein blaugrauer Fleck in einer
Reihe einfarbiger Striche. Jetzt `comment`, `star` und `close` aus dem
Symbolregister, und der Stern eines angehefteten Chats bleibt sichtbar statt
nur bei Hover (er sagt einen ZUSTAND, keinen Griff).

test34 hat sechs neue Punkte, darunter die Gegenprobe für den leeren Fall.

--------------------------------------------------------------------------------
L94 — Sechs Bildschirme meldeten ihren Ort nicht (E273) — GESCHLOSSEN
--------------------------------------------------------------------------------

`Ansichten.start/posteingang/seiten/termine/mehr/kompass` zeichneten sich
selbst in `#page`, ohne `App.zeigeSonder`. `App.schauplatz()` blieb deshalb
auf dem VORIGEN Bildschirm stehen — die Kontextkante zeigte auf „Start" die
Knöpfe von „Meine Aufgaben".

GESCHLOSSEN am 31. August 2026 (E273): die sechs gehen jetzt durch
`bildschirm()` → `App.zeigeSonder`. test272 §16 prüft es für neun Wege, mit
Gegenprobe.

--------------------------------------------------------------------------------
L95 — Die Datenbank kann keine Kontextkante haben (E273)
--------------------------------------------------------------------------------

Drei Dinge fehlen, und in dieser Reihenfolge:

1. **Einen Schauplatz, den es gibt.** Eine Datenbank auf einer Seite ist
   für `bereichJetzt()` der Editor. „Als ganze Seite öffnen" ruft
   `App.zeigeSonder(coll.name)` — der Schauplatz ist dann der NAME der
   Datenbank („projekte", „kunden"), je Datenbank ein anderer.
   `Register.kontext.fuer()` vergleicht auf Gleichheit, es gibt kein
   Muster. Der Weg wäre `bereichJetzt()` um den Fall „Seite zeigt eine
   Datenbank" zu erweitern, so wie es für PDF schon geschieht.
2. **Einen Griff auf die offene Datenbank.** `sammlungAufSeite(seiteId)`
   liefert eine collectionId — weder den Block noch dessen `aktiveView`.
   Ohne `{coll, view, block}` lässt sich keines der Panels aufrufen.
3. **Ausgeführte Panels.** `filterMenue` (steuerung.ts:5032), `sortMenue`
   (5251) und `eigenschaftenMenue` (5318) stehen NICHT im Rückgabeobjekt;
   von aussen sind sie undefined. `sortMenue` und `gruppierenMenue` lesen
   ausserdem sofort `anker.getBoundingClientRect()` — die Kante hätte kein
   Ankerelement zu bieten.

Dazu käme eine Abbildung der dreizehn Ansichtsarten aus
`Register.ansichten` auf Namen aus `Register.symbole`: die Zeichen dort
sind Zeichenketten wie `▦`, `🧮`, `📅` und keines davon ein Symbolname.

Gefunden am 31. August 2026 (E273, sechzehn Leser über acht Bereiche).

GESCHLOSSEN am 1. September 2026 mit E312. Alle drei stehen, dazu die
Abbildung und zwei neue Zeichen (`filter`, `sort`). Beim Bauen kamen zwei
weitere Gründe ans Licht, die niemand vermutet hatte:

  4 · `sortMenue` und `gruppierenMenue` hätten ohne Anker geworfen. Die
      Kante gibt jetzt ihren eigenen Knopf an `tun` weiter.
  5 · `schauplatzMelden()` meldete nur bei einer Änderung von
      `App.schauplatz()` — von Seite zu Seite bleibt der „seite". Die Kante
      zeichnete sich beim Seitenwechsel also NIE neu. Das betraf auch die
      PDF-Kante und war seit E272 Phase F da.

Und zwei tote Selektoren: `#page .pdfseite` und `#page .blattraum` trafen
nie etwas (der Editor zeichnet `.blk.b-pdfseite`). Sie sind weg, nicht
berichtigt — der Kommentar darüber beschreibt, was gelten soll, und das galt
durch den Fehler ohnehin schon.

--------------------------------------------------------------------------------
L96 — „Benachrichtigungen leeren" hat keinen harmlosen Zwilling (E273) — GESCHLOSSEN
--------------------------------------------------------------------------------

`Werkzeuge.meldungenLeeren()` setzt die Liste auf leer — es LÖSCHT. Als
Kantenknopf wäre das ein Klick ohne Rückfrage, der Daten wegnimmt; deshalb
steht er nicht dort.

Was fehlt, ist `meldungenAlleGelesen()`: dasselbe wie `meldungGelesen(id)`
(werkzeuge.ts:1177), nur über alle. Das ist der Griff, der an eine Kante
gehört — Zeichen `checkCircle`, sichtbar nur, solange etwas ungelesen ist.

Gefunden am 31. August 2026 (E273).

--------------------------------------------------------------------------------
L97 — `today` war eine zweite Sonne (E273) — GESCHLOSSEN
--------------------------------------------------------------------------------

`today` und `sun` im Symbolregister waren fast strichgleich: ein Kreis mit
acht Strahlen. Beide stehen in der Schale — `sun` für Hell/Dunkel und den
Reiter „Ansicht", `today` für „Heute", „Start", „Tagesplan" und „Lernen &
Alltag". An der Kalenderkante bedeutete die Sonne „Tagesplan", im Menüband
„helles Aussehen".

GESCHLOSSEN am 31. August 2026 (E273): `today` ist ein Kalenderblatt mit
eingerahmtem Tag.

Der eigentliche Punkt bleibt offen und steht deshalb hier: **es gibt keine
Prüfung darauf, dass zwei Symbole verschieden aussehen.** `hat()` sagt ja,
`fuelle` setzt etwas, jeder Punkt bleibt grün. Achtzig Zeichen, und ob zwei
davon dasselbe Bild sind, sieht nur das Auge (§55.1). Eine Prüfung darauf
müsste die gezeichneten Pfade vergleichen — machbar, aber sie bräuchte
zuerst eine Antwort darauf, wie ähnlich zu ähnlich ist.

Gefunden am 31. August 2026 (E273, auf dem Bild der Kalenderkante).

--------------------------------------------------------------------------------
L98 — Ein Kommentar an einem verschachtelten Block (E273) — GESCHLOSSEN
--------------------------------------------------------------------------------

`Kommentare.anMich()` liefert `{ block, k }`. Beide Stellen, die daraus eine
anklickbare Zeile bauen — die Posteingang-Seite (`ansichten/dienst.ts:383`)
und seit E273 die Kante —, rufen `App.oeffne(block.parentId)`.

Für einen Block auf oberster Ebene ist `parentId` die Seite, und es stimmt.
Für einen VERSCHACHTELTEN Block ist es der Elternblock.

Gefunden am 31. August 2026 (E273, beim Bauen der Posteingang-Kante).

BERICHTIGT und GESCHLOSSEN am 31. August 2026 (E275). Der Eintrag stand hier
mit zwei Behauptungen, die beide falsch waren — beide, weil ich geschrieben
habe, statt nachzusehen:

  · Die Überschrift sagte „öffnet nichts". Gemessen öffnet es SEHR WOHL
    etwas: `App.oeffne` zeichnet den Elternblock wie eine Seite. Die Krume
    stand auf „Skript / Kapitel 4", der Inhalt war die Toggle, der
    kommentierte Satz war zu sehen. Es führte also nicht ins Leere, sondern
    an einen Ort, den es als Seite nicht gibt — milder, und genau deshalb
    hat es nie jemand gemeldet.
  · „Heute steht die Rechnung an keiner Stelle" war schlicht unwahr. Es gibt
    sie DREIMAL: `Store.seiteVonHier` (indexdb.ts:600, für Grabsteine),
    `Store.seiteVon` (indexdb.ts:1447, nicht ausgeführt) und
    `Links.seiteVon`. Und darüber hinaus gibt es `App.zeigeBlock` seit E105,
    das genau das Richtige tut: echte Seite suchen, öffnen, zum Block
    rollen, und bei fehlender Seite einen ehrlichen Satz sagen.

Beide Stellen rufen jetzt `App.zeigeBlock(block.id)`. Nebenbei ist
`data-komm` weggefallen — es stand seit jeher an der Zeile und wurde nirgends
gelesen.

test56 hat vier neue Punkte, darunter die Gegenprobe: wäre `parentId` hier
schon die Seite, hätte der alte Weg gestimmt und der Punkt nichts gemessen.

OFFEN BLEIBT eine Kleinigkeit, die dabei aufgefallen ist: dieselbe Wanderung
nach oben steht an drei Stellen. Zwei davon dürfen es sein (`seiteVonHier`
muss IM Purge-Moment laufen, wenn der Zwischenspeicher schon leer ist — E254
erklärt es). `Store.seiteVon` und `Links.seiteVon` sind dagegen dasselbe
zweimal. Kein Schaden heute, aber §8.


--------------------------------------------------------------------------------
L99 — Ein Typfehler kam durch alle 235 Läufe (E276) — GESCHLOSSEN
--------------------------------------------------------------------------------

Gemessen am 31. August 2026: eine Zeile in `pruefungen/lauf/test56.mts`, die
das Ergebnis von `.find(...)` ohne Prüfung auf `undefined` benutzte, ging
durch den vollen Lauf und landete auf `main`.

Der Grund ist die Bauart, nicht die Nachlässigkeit. Node ENTFERNT beim
Ausführen die Typen, es prüft sie nicht (CLAUDE.md §54.3) — ein Prüflauf
läuft also grün, auch wenn er nicht typprüft. Und `tsc` lief nur einmal im
ganzen Netz: test105 ruft `tsc -p tsconfig.bauen.json`, und dieser Bauplan
kennt nur, was nach `quell/` ausgegeben wird. `pruefungen/` steht nicht
darin, `server/` auch nicht.

`npm run typecheck` war rot. Nur rief ihn niemand.

GESCHLOSSEN am 31. August 2026 (E276): test105 §3 ruft jetzt dasselbe wie
`npm run typecheck` — `tsc --noEmit` über das ganze Projekt. Mit Gegenprobe
(eine Wegwerfdatei mit echtem Typfehler muss beanstandet werden) und einmal
wirklich rot vorgeführt: ein eingeschleuster Fehler in test41.mts wurde
gemeldet, mit Datei, Zeile und TS-Nummer.

Ein Prüflauf, den man von Hand starten muss, ist kein Netz.

--------------------------------------------------------------------------------
L100 — „Dazulegen" lässt die Marken stehen, und alte Blöcke bleiben liegen
--------------------------------------------------------------------------------

L76 (E279) setzt beim Einspielen mit **Ersetzen** die drei Sync-Marken auf
null: der Bestand ist danach ein anderer, also stimmt „bis hierher waren
beide Seiten gleich" nicht mehr.

Beim **Dazulegen** bleiben sie stehen — und das ist eine Lücke, keine
Entscheidung.

`Wolke.zuSchicken()` überspringt jeden Satz mit `edited <= marke`. Wer eine
Sicherung von vor drei Monaten dazulegt, bringt Blöcke mit einem `edited`
von vor drei Monaten mit. Die Marke steht auf heute. Also sieht der nächste
Abgleich sie nie, und sie erreichen den Server nicht — auf den anderen
Geräten fehlen sie, ohne dass irgendwo etwas rot wird.

Der naheliegende Weg (die Marken auch beim Dazulegen leeren) hat einen
Preis: JEDES Dazulegen löste dann einen Vollabgleich aus, auch das, bei dem
eine einzige Seite dazukommt. Auf einem grossen Bestand ist das minutenlang.

Was es wirklich braucht, ist enger: nur die dazugelegten Kennungen für den
nächsten Versand vormerken. Das ist eine eigene Entscheidung und eine eigene
Prüfung, also steht es hier und nicht als halbe Umsetzung im Code.

**Betroffen:** `src/kern/ablage/indexdb.ts` (`importAll`, Zweig
`zusammenfuehren`), `src/kern/abgleich/maschine.ts` (`zuSchicken`).
**Gefunden:** beim Umsetzen von L76 (E279).

**GESCHLOSSEN am 1. September 2026 mit E314** — genau auf dem hier
beschriebenen engen Weg. `wolkeNachtrag` hält die dazugelegten Kennungen,
`zuSchicken` nimmt sie mit, und was angekommen ist, wird gestrichen. Über
20 000 Sätzen steht statt der Liste die Marke `wolkeNachtragAlles`.

Drei Dinge, die beim Bauen dazukamen und die hier fehlten:

  · Ein FEHLGESCHLAGENER Versand darf die Liste nicht leeren. Sonst wären
    die Sätze für immer weg — derselbe Fehler eine Ebene tiefer. Das
    Aufräumen steht deshalb nach der Schleife und nicht in einem `finally`.
  · Kennungen, zu denen es keinen Satz mehr gibt, werden gestrichen.
  · Die Merkliste steht in `NUR_HIER`: sie gehört diesem Gerät, wie der
    Ordnerzugriff und die Freigabeliste.

test308 misst mit einem winzigen Abgleich-Server im Lauf selbst, ob die drei
Monate alten Sätze wirklich ankommen.

================================================================================
L101 — Was die Import-Härtung (E284) bewusst noch nicht deckt
================================================================================

**VOLLSTÄNDIG GESCHLOSSEN am 1. September 2026.** Alle vier Punkte sind
abgearbeitet — Punkt 1 durch E316, Punkt 2 durch E317, Punkt 3 durch E292,
Punkt 4 durch E318. Der Abschnitt bleibt stehen, weil er beschreibt, WARUM
jeder einzelne so gelöst wurde und was bewusst NICHT übernommen wurde.

E284 hat das Loch geschlossen — fremde Prototypen kommen nicht mehr durch,
und die Formatfassung wird endlich gelesen. Vier Dinge blieben, jedes mit
Grund:

1. **Die „Vorschau" ist eine ZÄHLUNG.** `schale.ts:2012` zählt
   `Object.keys(vorschau.blocks).length` und zeigt „1247 Blöcke". Das sagt,
   wie GROSS die Sicherung ist, nicht WAS sich ändert. Wer wissen will, ob
   die eigene Seite von gestern überlebt, erfährt es erst danach.

   Eine echte Vorschau müsste den Bestand gegen die Sicherung stellen: wie
   viele Seiten kommen dazu, wie viele werden überschrieben, wie viele
   verschwinden beim Ersetzen. Das ist machbar (beide Verzeichnisse liegen
   vor), aber es ist Oberfläche und gehört in einen eigenen Bogen mit einem
   Bild dazu.

   **GESCHLOSSEN am 1. September 2026 durch E316**, und zwar genau so:
   `core/import/vergleich.ts` stellt beide Verzeichnisse gegeneinander und
   liefert vier Gruppen — neu, ersetzt, gleich, verschwindet. Gerechnet wird
   für beide Wege getrennt; der Satz steht am jeweiligen Knopf, weil die
   zwei Knöpfe Verschiedenes tun.

   Was verschwindet, wird beim NAMEN genannt (fünf Titel, die zuletzt
   geänderten zuerst) — „7 Sätze verschwinden" beantwortet die Frage nicht,
   die man hat; die Frage ist „meine?". Und was nicht geschieht, steht nicht
   da: keine Null, kein Wort von Verschwinden beim Dazulegen. `wolkeVersion`
   und `folge` zählen nicht mit, sonst wäre nach jedem Abgleich jeder Satz
   „geändert". test310, 23 Punkte.

2. **Die Transaktion deckt die ANHÄNGE nicht ab.** Die Alles-oder-nichts-
   Zusage gilt für fünf Fächer; die Anhänge kommen danach, Stück für Stück,
   jedes in einer eigenen Transaktion. Bricht es dort ab, sind Blöcke und
   Anhänge auseinander.

   **GESCHLOSSEN am 1. September 2026 durch E317** — nicht, indem die
   Transaktion ausgedehnt wurde (das bliebe falsch: ein grosses Video würde
   die Ablage minutenlang blockieren, §10), sondern indem das SCHWEIGEN
   aufhört. Die zwei stillen `continue` sind weg; `anhaengeEinspielen` gibt
   `{ da, erwartet, fehlend }` zurück, jeder Anhang steht in seinem eigenen
   `try`, und die Meldung nennt die fehlenden beim Namen samt Grund — aber
   nur, wenn welche fehlen. Ein Loch bricht die Schleife nicht mehr ab: wer
   neunzig von hundert retten kann, rettet neunzig. test311, 11 Punkte.

3. **Der offene Weg schreibt vor dem Ersetzen keine Sicherheitskopie.** Der
   Krypto-Dialog tut es (`krypto.ts:935 await sicherungSchreiben()`), der
   normale Weg nicht. Das ist genau umgekehrt zur Gefahr: den offenen Weg
   benutzen mehr Leute.

   **GESCHLOSSEN am 1. September 2026 durch E292.** Der offene Weg schreibt
   beim Ersetzen vorher eine Sicherheitskopie — über `sicherungSpeichern`,
   also MIT Anhängen, weil dieser Weg auch ein `.redion` annimmt und das
   Ersetzen dort auch Anhänge löscht. Klappt sie nicht, wird nicht
   eingespielt. `test287`, 9 Punkte, misst die Datei selbst.

4. **Die Sicherheit ist insgesamt verkehrt herum verteilt.** Der
   VERSCHLÜSSELTE `.redion`-Weg ist streng — Manifestfassung, KDF-Parameter,
   Pfad-Regex, keine undeklarierten ZIP-Einträge, Bytegrössen, vollständiger
   Trockenlauf vor dem ersten Schreibzugriff (`krypto.ts:404-693`). Der
   offene Weg hatte bis E284 einen einzigen Feldtest. E284 hat ihn
   angehoben, aber nicht auf dieselbe Höhe.

   **GESCHLOSSEN am 1. September 2026 durch E318**, und beim Nachmessen
   blieben von der Liste zwei Dinge übrig, die wirklich übertragbar sind:

   · **Die angekündigte Bytezahl wurde nie gelesen.** Jeder Dateisatz führt
     seine `groesse` mit, der offene Weg sah nicht hin und schrieb die
     tatsächliche Länge mit `zustand: 'fertig'` in die Ablage. Ein halbes
     Video hiess danach vollständig. Jetzt wird die Differenz genannt — in
     einer eigenen Liste, weil „fehlt" und „kam verkürzt an" zwei
     verschiedene Nachrichten sind. Übernommen wird der Anhang trotzdem
     (§46), und drei echte Normalfälle schweigen: keine Grösse angegeben,
     Satz beim Sichern noch unfertig, mehr Bytes als angekündigt.

   · **`dateien.json` ging an E284 vorbei.** Ein blankes `JSON.parse` auf
     eine fremde Datei, deren Inhalt gleich darauf durch `Object.assign` in
     die Ablage geht — wörtlich das Loch, das E284 für die fünf Fächer
     geschlossen hat, ein Stockwerk tiefer, bei geladenem Gegenmodul. Jetzt
     `ImportSicherheit.lesen`, und die Namenskarte prototyplos.

   Der Rest der Liste ist NICHT übertragbar, und das ist kein Nachlassen:
   KDF-Parameter gibt es ohne Verschlüsselung nicht, und ein Pfad-Regex
   schützt im Browser vor nichts — ein ZIP-Eintragsname ist dort ein
   Schlüssel in einer Map, kein Dateipfad. test312, 18 Punkte.

Gefunden am 31. August 2026 (E284, bei der gemessenen Bestandsaufnahme).

================================================================================
L102 — Was die Bestandsaufnahme vom 31. August sonst noch fand
================================================================================

**DER RECHTE-FEHLER KAM ZUM ZWEITEN MAL (7. September 2026, E471).** Im
Dokumentmodus wurde `Konten.darf` an sechs Stellen mit dem Seiten-OBJEKT
statt seiner Kennung gerufen; `rolleAuf` fand damit nichts und fiel auf die
Standardrolle „voll" zurück — jede Rechtefrage im PDF-Teil sagte ja. Behoben
und mit `test444` bewacht, diesmal über die ganze Quelle: jeder Aufruf muss
erkennbar eine Kennung übergeben. Wer L102 liest, liest damit auch, dass
eine Regel ohne Wächter zweimal gebrochen wird.

**PUNKT 1 GESCHLOSSEN am 31. August 2026 durch E290** (`core/calendar/
wiederholung.ts` liest BYDAY, BYMONTHDAY, BYMONTH, BYSETPOS, WKST, EXDATE,
RDATE; `test284`, 49 Punkte).
**PUNKT 2 GESCHLOSSEN am 1. September 2026 durch E291** (`darfAnSammlung`
prüft gegen die Datenbank, die das Werkzeug wirklich meint; `test286`,
16 Punkte).

Zehn Leser sind durch `src/` gegangen, jeder Befund von einem zweiten Agenten
angegriffen. Was dabei auffiel und NICHT zu E284 gehört, steht hier, damit es
nicht verlorengeht:

1. **Der Kalender liefert still FALSCHE Daten.** `wiederholungen()`
   (`kalender.ts:143-182`) zerlegt eine RRULE vollständig in `teile`, liest
   davon aber nur vier Schlüssel und wirft den Rest wortlos weg.
   `FREQ=MONTHLY;BYDAY=2TU` — „jeder zweite Dienstag" — wird zu „jeden Monat
   am selben Tag". Kein Fehler, keine Meldung, ein falscher Termin.
   Repo-weit null Treffer für BYDAY, EXDATE, RDATE, VTODO, TZID, VTIMEZONE,
   BYMONTHDAY, BYSETPOS — auch in Doku und Prüfläufen.

   Das ist schlimmer als „fehlt" und gehört vor die Ausbaupunkte.

2. **Die Rechteprüfung der Agenten fragt die falsche Seite.** — **GANZ
   GESCHLOSSEN am 1. September 2026: die eine Hälfte durch E291, die andere
   durch E331.**

   E291 gab `zeileAnlegen` und `feldFuellen` ihre verbindliche Prüfung.
   Nachgezählt blieben vier Werkzeuge ohne, darunter zwei, die SCHREIBEN
   (`seiteAnlegen`, `datenbankAnlegen`) und eines, das fremden Code
   ausführt (`worker`).

   DER WURZELFEHLER LAG TIEFER: `darf(was)` ohne Ort antwortete `true`,
   obwohl sein eigener Kommentar sagte, es sei „eine Frage nach der Rolle".
   Seit E132 war die Startansicht das Heute-Dashboard (seit E236 das
   Regal, seit E349 der zuletzt gesehene Ort) und damit keine
   Seite — der Normalfall beim Start war also: kein Ort, alles erlaubt, für
   jedes Konto. Jetzt zählt dort die Rolle, und es gibt `darfUeberhaupt`
   für Handlungen, die gar keinen Ort haben.

3. **Der ganze Vektorweg ist toter Code.** — **GESCHLOSSEN am 1. September
   2026 durch E333.** Verdrahtet in `bauenFuerFrage`, aber nicht naiv: die
   Funktion schickt für jede Frage eine Einbettung an eine kostenpflichtige
   API. Der Schalter ist das VORHANDENSEIN der Vektoren — wer sie gebaut
   hat, hat mit E287 einmal mit Betrag Ja gesagt; wer nicht, zahlt nichts
   und sucht wie vorher.

   BEIM VERDRAHTEN WÄRE BEINAHE EIN LECK ENTSTANDEN: `nurSeite` achtete der
   Vektorweg nicht, weil ihn nie jemand rief. Toter Code ist nicht nur
   ungenutzt, sondern auch ungeprüft.

4. ~~**Der Ereignisbus kann kein async.**~~ ERLEDIGT in E362: `frage`
   zählt eine Promise nicht mehr als Antwort, sondern meldet sie;
   `frageAsync` und `meldeAsync` warten ab, in der Reihenfolge der
   Anmeldung, und melden, was scheitert; ein asynchroner Zuhörer von
   `melde` versandet nicht mehr als „unhandled rejection"; `horche(name,
   fn, {nachreichen: true})` reicht spät Angemeldeten die letzte Meldung
   nach; `darf`/`darfAsync` sind das Veto. test354. Dabei gefunden: der
   EINZIGE Zuhörer auf `ablageGeladen` (Menüband) horchte auf die
   Zeichenkette `'ablageGeladen'`, gemeldet wird `'ablage.geladen'` — er
   hat nie etwas gehört. Was bleibt: von 42 Namen in `ARTEN` wird weiter
   nur einer benutzt; „Abbruch" (ein Zuhörer stoppt die weiteren) gibt es
   nicht — bewusst: ein Bus, in dem einer die anderen anhalten kann, ist
   wieder das Knäuel.

5. **`exportAll`/`importAll` tragen drei hartkodierte Fachlisten** —
   **GESCHLOSSEN am 1. September 2026 durch E332.** Nachgezählt: elf
   Fächer, sieben gesichert, vier mit Grund draussen — heute stimmt es. Die
   Gefahr ist das zwölfte.

   Dynamisch zu sichern ginge nicht (`stuecke` hält Blobs, `meta` braucht
   Filter, `versions` hat eine eigene Regel). Stattdessen eine ERKLÄRUNG,
   gegen die sich die Ablage abgleicht: was in keiner der drei Listen
   steht, landet im Manifest unter `fehlt`, mit einem Satz, der den Ort der
   Entscheidung nennt. Jedes ausgelassene Fach trägt seinen Grund neben dem
   Namen — damit der Nächste daran vorbeimuss.

   `enthaelt` kommt jetzt aus derselben Liste; vorher stand es zweimal da.
   test325 (20 Punkte), belegt rot.

6. **Das Fehlerzentrum zeigt ein Feld, das nie gefüllt wird.** —
   **GESCHLOSSEN am 1. September 2026 durch E333.** Vier tote Feldnamen
   weg. Der Grund war nicht Vergesslichkeit, sondern das Modell: eine
   Karteikarte wird nicht getippt, sondern SELBST BEWERTET — es gibt keine
   falsche Antwort, sondern eine Note. Die Überschrift heisst jetzt „Letzte
   Selbstbewertung" und der Wert „1 von 4 (nochmal)". Dieselbe Sorte wie
   E311, zwei Bildschirme weiter oben in derselben Datei.

7. **Der normale KI-Chat hat GAR KEIN Limit** — **WAR AM 1. SEPTEMBER
   SCHON ZU, nachgemessen in E333.** Der Satz stimmte am 31. August. E287
   kam einen Tag später und setzte die Prüfung an das EINE Tor, durch das
   alles geht: `frageKurz`, die Agentenschleife und der Chat. Sie prüft VOR
   dem Aufruf, bucht die Schätzung und berichtigt sie im `finally`. Auch
   `embeddingsBauen` fragt seither einmal mit Betrag und bucht, was es
   ausgibt.

   Die Messung steht in test326 §5 — eine Lücke ohne Messung zu schliessen
   wäre eine Behauptung mit Datum.

Gefunden am 31. August 2026 (gemessene Bestandsaufnahme vor E284).

================================================================================

--------------------------------------------------------------------------------
NACHTRAG vom selben Tag: der Kalenderpunkt ist ERLEDIGT (E290).

`wiederholungen()` liest jetzt die ganze Regel — BYDAY samt Ordnungszahl,
BYMONTHDAY, BYMONTH, BYSETPOS, WKST — dazu EXDATE und RDATE, die der
Einleser bis dahin nicht einmal aufgriff. Was übrig bleibt, wird GENANNT
statt verschwiegen. test284 (49 Punkte).

NACHTRAG vom 1. September: auch der zweite Fund ist zu (E331). Der
Nachsatz oben stand einen Tag lang im Widerspruch zur Kopfzeile dieses
Abschnitts, die E291 schon als Abschluss meldete — beide hatten halb
recht, und nachgezählt hat es erst E331.

L103 — Was die Auftragsmaschine (E286) noch nicht kann
================================================================================

Die Maschine steht und ist geprüft. Fünf Dinge fehlen ihr, jedes mit Grund:

1. **Kein Bereich ist angeschlossen.** — **GESCHLOSSEN am 1. September 2026
   durch E327.** Angeschlossen ist das ZURÜCKHOLEN der PDF-Seitenbilder,
   nicht das Einlesen selbst: das Einlesen legt Blöcke an, das Zurückholen
   füllt nur fehlende `bildDateiId` nach, und seine Wiederaufnahme war mit
   `ohneBild` schon fertig, bevor der Auftrag sie brauchte.

   Der Anschluss brachte drei Dinge, und das dritte war ein Datenschaden:
   der Lauf übersteht jetzt einen Neustart; er zeigt Stand, Balken und
   Abbrechen im Fenster aus E322; und ZWEI TABS rechnen nicht mehr beide
   dasselbe. Der bisherige Schutz war eine Map im Tab — bei zwei offenen
   Fenstern legten beide für denselben Block eine Datei ab, und die
   unterlegene blieb als Satz mit LEBENDEM `blockId` liegen, den
   `Dateien.verwaist()` grundsätzlich nie findet.

   WAS OFFEN BLEIBT: OCR, grosser Import, Sicherung und Embeddings laufen
   weiter im Arbeitsspeicher. Der Weg dahin ist jetzt aber getreten und
   gemessen — und beim Anschliessen kam heraus, dass der menschliche Name
   einer Art zu ihr gehört und nicht in eine geratene Liste in der Schale
   (siehe E327).

2. **Kein Web Worker.** Ein Auftrag läuft im selben Faden wie die
   Oberfläche. Der Agenten-Sandkasten (`agenten.ts:583`) zeigt, dass
   Redion Worker kann — über eine Blob-URL, also ohne Bauschritt (§6) —,
   ein Auftrag müsste dafür aber seinen Läufer als eigenständigen Code
   mitbringen, und das ist eine eigene Entscheidung.

   **NACHGEMESSEN AM 3. SEPTEMBER 2026 (E366), UND DER SATZ OBEN WAR EINE
   VERMUTUNG.** Hier stand: „Bei einem OCR über achtzig Seiten heisst das:
   die App ruckelt." Gemessen worden war das nie. Also gemessen — am
   einzigen schweren Auftrag, der wirklich angeschlossen ist, dem
   ZIP-Import (E365):

   · 120 Dateien à 18 KB (2 MB, ein Semester an Skripten): **1093 ms**
     für den ganzen Auftrag, längste Bildlücke **149 ms**, EINE Lücke über
     100 ms. Davon **165 ms** das reine Lesen der ZIP (Entpacken und
     Prüfsumme) — der Teil, den ein Worker überhaupt übernehmen könnte,
     ist also 15 % der Zeit.
   · 300 Dateien: **2784 ms**, rund **8 ms je Schritt**, und zwar FLACH
     über den ganzen Lauf (7,4 · 11,2 · 11,6 · 7,4 · 7,2 · 8,2 · 6,4 ·
     8,8 · 9,5 · 7,4 · 7,2 · 6,7 · 10,3 · 7,2 · 7,6). Es wird nicht zäher,
     je voller der Bestand ist.
   · `ausMarkdown` selbst ist linear: 0,01 ms je Block, 68 ms für eine
     Datei mit 5000 Absätzen, und 40 Dateien nacheinander kosten jede
     gleich viel (3 ms).

   Ein Ruckeln gibt es also — bei sehr grossem Einsatz. Der erste
   Messlauf mit einer absichtlich unrealistischen ZIP (25 MB, 336 000
   Blöcke) fror die Oberfläche einmal **7 Sekunden** ein und war nach
   fünf Minuten nicht fertig. Das ist echt, aber es ist keine
   Semesterablage, sondern ein Belastungsversuch.

   WAS DARAUS FOLGT: Ein Worker für die Auftragsmaschine ist ein grosser
   Umbau (jeder Läufer bräuchte eigenständigen Code und käme nicht mehr an
   `Store`), und er würde 15 % einer Sekunde gewinnen. Er bleibt offen —
   aber als Antwort auf eine GEMESSENE Not, nicht auf eine vermutete. Wer
   ihn baut, misst vorher den Auftrag, für den er ihn baut. Die drei
   Messskripte sind Wegwerfarbeit und stehen nicht im Verzeichnis; die
   Zahlen oben sind das Ergebnis.

   Und der eigentliche Kandidat ist ein anderer: L114 Punkt 7 — rund 0,35 s
   je PDF-Seite, vierzig Skripte à 80 Seiten sind zwanzig Minuten. Dort
   liegt die Zeit, und dort fehlt zuerst eine Schätzung VOR dem Start.

3. **Kein Fortschritt in der Oberfläche.** Die Ereignisse (`auftrag.schritt`
   mit Schritt/Schrittzahl/Text) werden gemeldet, und niemand hört zu. Es
   gibt keine Liste offener Aufträge, keinen Balken, keinen Abbrechen-Knopf
   — obwohl `Auftraege.offen()` und `Auftraege.abbrechen(id)` beide da
   sind. Das ist §47 von der leisen Seite: nicht ein Knopf, der nichts tut,
   sondern eine Sache, die läuft und die niemand sieht.

   **GESCHLOSSEN am 1. September 2026 durch E322.** Ein Knopf oben rechts,
   dahinter ein Fenster mit einer Zeile je Auftrag: Name, Satz, Balken,
   Stand, Abbrechen. Er erscheint NUR, solange etwas läuft (wie die Glocke,
   E251), und die Zahl erst ab zwei. Der Balken fehlt in zwei Fällen, und
   beide sind richtig so: bei unbekannter Gesamtzahl (`schritte: 0`) wäre er
   erfunden, und bei `wartet` sagte er „0 % fertig", wo „hat noch nicht
   angefangen" die Wahrheit ist — das fiel erst auf dem Bild auf.
   test315, 25 Punkte.

   Beim Bau kollidierte der erste Namensraum `auf-` mit dem der Aufgaben —
   wörtlich L90, gefangen vom Verzeichnis aus E293. Heisst jetzt `arb-`.

4. **Die Pacht ist kein `navigator.locks`.** Sie beruht darauf, dass
   IndexedDB Transaktionen serialisiert — das reicht gegen zwei Tabs, aber
   es gibt keine Absprache, wer arbeiten SOLL. Zwei Tabs nehmen
   verschiedene Aufträge und arbeiten beide; auf einem schwachen Gerät ist
   das doppelt so viel Last wie nötig.

   **GESCHLOSSEN am 1. September 2026 durch E323.** `navigator.locks` mit
   `ifAvailable`, JE TAKT statt als dauerhafte Anführerwahl: wer es nicht
   bekommt, überspringt diesen Takt. Eine Anführerwahl hätte einen Ausfall,
   aus dem man ohne Neustart nicht herauskommt. Ohne die API bleibt alles
   wie bisher — doppelte Last ist unschön, ein Auftrag, der nie läuft, ist
   Datenverlust auf Raten. test316, 15 Punkte, davon zwei Abschnitte allein
   für die Frage, ob die Messung überhaupt rot werden kann.

5. **Kein Zeitplan.** Ein Auftrag läuft, sobald er dran ist. Es gibt kein
   „heute Nacht", kein „wenn das Gerät am Strom hängt", kein „nur im
   WLAN". Für OCR und Embeddings wäre genau das die richtige Antwort.

   **GESCHLOSSEN am 1. September 2026 durch E342.** `core/jobs/zeitplan.ts`
   rechnet, `kern/auftraege/maschine.ts` beschafft die Lage, und unter
   Einstellungen → Speicher steht „Lange Arbeiten" — zwei Zeitfelder, zwei
   Schalter (§47).

   Die wichtigste Entscheidung ist eine, die nur auf fremden Browsern
   auffiele: UNBEKANNT HEISST JA. Firefox und Safari kennen `getBattery`
   nicht, Safari und Firefox `connection` auch nicht — wer dort `null` als
   „nein" liest, baut einen Auftrag, der NIE läuft. Das ist, mit E323s
   Worten, Datenverlust auf Raten. `test334` §2 hält es fest.

   „Nur im WLAN" heisst deshalb auch nicht so: `connection.type === 'wifi'`
   gibt es fast nirgends, und `effectiveType` misst Geschwindigkeit statt
   Kosten — ein langsames WLAN im Keller sähe damit aus wie ein
   Mobilfunkvertrag. Gemessen werden `saveData` und `type === 'cellular'`,
   und die Bedingung heisst, was sie misst.

   Der Zeitplan wirkt nur auf NEUE Aufträge; und im Auftragsfenster steht
   seit E342, WORAUF gewartet wird — „wartet" allein sieht aus wie
   „gleich", und in Wahrheit sind es acht Stunden. Steht dort nichts
   Besonderes, steht dort auch nichts. test334, 55 Punkte, belegt rot in
   fünf Richtungen.

   OFFEN BLEIBT Punkt 2 (kein Web Worker) — der ist von diesem unberührt:
   ein Auftrag, der nachts läuft, läuft nachts trotzdem im selben Faden.

Gefunden am 31. August 2026 (beim Bau von E286).


================================================================================
L104 — Das KI-Buch führt Schätzungen, keine gezählten Token (E287)
================================================================================

**VOLLSTÄNDIG GESCHLOSSEN am 1. September 2026.** Der Hauptpunkt durch E319,
Punkt 1 durch E321, Punkt 2 durch E295, Punkt 3 durch E319. Der Abschnitt
bleibt stehen, weil er beschreibt, WARUM jedes einzelne so gelöst wurde.

Jeder Anbieter schickt die WIRKLICHE Tokenzahl zurück — OpenAI im Feld
`usage`, Anthropic in `message_start`/`message_delta`. Redion liest sie
nicht. Der Strom-Leser in `bereiche/ki/dienst.ts` sucht in jedem Ereignis
nach `delta.content` (bzw. `choices[0].delta.content`) und wirft alles
andere weg — auch die Abrechnung, die am Ende mitkommt.

Das Buch trägt deshalb die SCHÄTZUNG ein, und weil die Schätzung mit 3,6
Zeichen je Token bewusst zu hoch greift, steht im Buch tendenziell mehr, als
der Anbieter berechnet. Für eine Bremse ist das die harmlose Richtung; für
die Frage „was habe ich diesen Monat wirklich ausgegeben" ist es die
falsche.

Der Platz dafür ist schon da: `buchen(…, gezaehlt)` hat den vierten
Parameter genau dafür, und `standAus` könnte gezählte und geschätzte
Beträge getrennt ausweisen. Was fehlt, ist das Auslesen im Strom-Leser — an
zwei Stellen, je Anbieter eine.

**GESCHLOSSEN am 1. September 2026 durch E319.** `core/ai/abrechnung.ts`
liest beide Dialekte — OpenAI-artig ein Schlussereignis mit `usage`,
Anthropic zwei Ereignisse, die zusammengelegt werden. Gebucht wird weiter
zuerst die Schätzung (eine Grenze, die nach dem Aufruf prüft, ist keine
Grenze), danach ERSETZT `KiBuch.berichtigen` sie durch die gezählte Zahl —
im `finally`, damit auch ein Abbruch nicht zu hoch gebucht stehen bleibt.
`stream_options` geht nur an die vier Anbieter, deren Adresse in Redion
steht; „Eigener Server" bekommt es nicht, weil ein Server, der unbekannte
Felder ablehnt, daran mit 400 scheiterte. Wo nichts kommt, bleibt die
Schätzung — als Schätzung gekennzeichnet. test313, 25 Punkte.

Drei weitere Dinge, die E287 bewusst offenlässt:

1. **Keine Oberfläche.** `KiBuch.stand()`, `monatJeAnbieter()` und
   `grenzenSetzen()` sind da; unter Einstellungen → KI steht nichts davon.
   Wer seine Grenzen ändern will, kann es heute nur über die Konsole. Das
   ist §47 von der leisen Seite — dieselbe Lücke wie L103 Punkt 3.

   **GESCHLOSSEN am 1. September 2026 durch E321.** Unter Einstellungen → KI
   steht „Kosten und Grenzen": Monatsbetrag, Tagesbetrag, Anbieter, die vier
   Grenzen als Felder, ein Weg zum Leeren. Die Summe nennt ihre Grundlage
   („2 von 3 Aufrufen gezählt") — möglich erst seit E319. Ohne Buchung steht
   kein Betrag da, sondern „Noch kein Wolken-Aufruf verbucht"; die Grenzen
   sind trotzdem einstellbar. Eigene Verdrahtung statt `data-set`, weil die
   vier Grenzen ZUSAMMEN in einem Eintrag liegen — vier neue Schlüssel wären
   ein Regler, der sich bewegt und nichts bewirkt. test314, 20 Punkte.

   Ausgerechnet die Bremsmeldung endete schon vorher mit „Die Grenzen stehen
   unter Einstellungen → KI." Jetzt stimmt der Satz.

2. **Der Agentenlauf ruft `laufBeginnen()` nicht.** `jeLauf` ist damit die
   einzige der vier Grenzen, die im Alltag nie anschlägt: `laufStand`
   beginnt beim Laden der Seite bei null und läuft dann durch. Sie
   FUNKTIONIERT (test281 §3 misst es), sie wird nur nicht zurückgesetzt.
   Der Aufruf gehört in `agenten.ts` an den Start einer Schleife.

   **GESCHLOSSEN am 1. September 2026 durch E295.** Der Aufruf steht am
   Start der Agentenschleife. `test291` §2 misst ihn am ERZEUGTEN
   JavaScript — der Browser lädt `quell/`, und eine Zeile, die nur in
   `src/` steht, wirkt nicht.

3. **Die Preisliste altert von selbst.** `STAND` sagt, von wann sie ist,
   und der Satz bei einem unbekannten Modell nennt das Datum. Aber niemand
   erinnert daran, sie zu pflegen; in einem Jahr rechnet sie mit Preisen
   von heute weiter. Ein Hinweis, wenn die Liste älter als ein halbes Jahr
   ist, wäre die kleine Antwort darauf.

   **GESCHLOSSEN am 1. September 2026 durch E319.** `KiKosten.listeAlt`
   und `standSatz` — nach 182 Tagen sagt Redion, dass die Beträge nach
   alten Preisen gerechnet sind, und vorher schweigt es. Die Zeit kommt als
   Zahl herein, damit sich „in einem Jahr" prüfen lässt, ohne die Systemuhr
   zu verstellen.

Gefunden am 31. August 2026 (beim Bau von E287).

NACHTRAG (E289): Punkt 1 hat einen Ort bekommen. `KiBuch.stand()` steht
weiterhin ohne Oberfläche da, aber die LERN-Statistik zeigt jetzt vor, wie
eine ehrliche Zahl aussieht — mit ihrer Belegzahl daneben. Wer die
KI-Kosten anzeigt, soll es genauso tun.


================================================================================
L105 — Was die Lückenansicht (E288) noch nicht kann
================================================================================

1. ~~**Kein Escape für die anderen Fenster.**~~ — **DIESE LÜCKE WAR FALSCH**,
   berichtigt am 1. September 2026 (E302).

   Hier stand: „Redion hat KEINEN gemeinsamen Escape-Griff für `.overlay`.
   Der Wissensgraph und das Schlagwortregister schliessen bis heute nicht auf
   Escape — man muss danebenklicken."

   Beim Bau des Griffs stellte sich heraus: ES GIBT IHN LÄNGST. Er steht seit
   E272 Phase G in `schale.ts` und nimmt das LETZTE `.menu`, sonst das letzte
   `.overlay`; die Begründung dort ist sogar ausführlich („die oberste, nicht
   die erste"). Nachgemessen am laufenden Programm: der Wissensgraph geht auf
   und ist nach einem Escape zu, das Schlagwortregister ebenso.

   WIE DER IRRTUM ENTSTAND, und das ist der lehrreiche Teil: die Lücke wurde
   aus dem Gedächtnis geschrieben, nicht gemessen. `verweise.ts` hat zwei
   Treffer auf „Escape", und beide stehen in der Linkvorschau. Daraus wurde
   „der Graph schliesst nicht" — ohne die Schale anzusehen, wo der Griff
   hängt. Genau das, wovor CLAUDE.md 52.8 warnt: nicht raten, nachsehen.

   Der gebaute zweite Griff wurde wieder ausgebaut. Zwei Zuständigkeiten für
   dieselbe Sache sind schlimmer als eine, und der neue hätte den alten nicht
   ersetzt, sondern danebengestanden.

   GEBLIEBEN IST EIN WÄCHTER: `test296` misst den bestehenden Griff — dass er
   das oberste Fenster nimmt, genau eines, und dass er mit einem eigenen
   Griff zusammen trotzdem nur eines schliesst. Gegengeprüft: nimmt man die
   vier Zeilen aus `schale.ts`, fallen sieben von siebzehn Punkten. Vorher
   bewachte diese Stelle nichts — deshalb konnte die Lücke behaupten, es gäbe
   sie gar nicht.

2. **Kein „erledigt".** Wer einen Fund gesehen und für unwichtig befunden
   hat, sieht ihn beim nächsten Öffnen wieder. Für Geister ist das richtig
   (sie verschwinden, sobald die Seite da ist), für offene Fragen und
   Inseln nicht: manche Frage bleibt absichtlich offen. Ein Merker in
   `meta` je Fund-Kennung wäre die kleine Antwort — die Kennung müsste
   dafür aber stabil sein, und die Frage-Kennung ist heute der Text selbst.

   **GESCHLOSSEN am 1. September 2026 durch E324**, und die Kennung war
   genau die Frage. `KnowledgeGaps.kennung(f)` nimmt Art, Seite und Titel
   zusammen, kleingeschrieben und mit zusammengezogenen Leerzeichen. Sie
   bleibt über Neuberechnungen gleich UND ändert sich, wenn sich der Fund
   ändert: wer seine Frage umformuliert, hat eine andere Frage und bekommt
   sie wieder vorgelegt. Ein Haken je Fund, ein Weg zurück im Kopf, und der
   Satz nennt, wieviel abgehakt ist — aber nur, wenn es welches gibt.
   test317, 25 Punkte.

3. **Die Ansicht rechnet bei jedem Öffnen neu.** — **GESCHLOSSEN am
   1. September 2026 durch E330, aber ANDERS als hier vorgeschlagen.**

   Erst gemessen: von 173 ms bei 1763 Seiten liegen 145 im SAMMELN (Graph,
   Rang, Seitentext) und 28 im Finden. Hochgerechnet auf die zehntausend
   aus dieser Zeile wäre es rund EINE SEKUNDE — spürbar, aber keine Arbeit,
   die einen Auftrag braucht. Ein Auftrag lohnt bei Minuten; er kostet
   einen Satz in der Ablage, einen Takt, ein Fenster, einen Abbrechen-Knopf
   und die Frage, was gilt, solange er läuft.

   Also ein Merker: das Sammeln wird gemerkt, das Finden läuft immer. Der
   Abdruck ist Zahl der Blöcke, neuester Zeitstempel und Summe aller
   Stempel — ohne die Summe wäre er blind gegen zwei Änderungen in
   derselben Millisekunde.

   Und der wirkliche Gewinn stand nicht in dieser Zeile: `befund()` läuft
   auch nach JEDEM Haken (E324), und ein Haken ändert nur `erledigt` — was
   gar nicht ins Sammeln eingeht. 157 ms kalt gegen 31 ms mit Merker.

   WAS OFFEN BLEIBT: bei wirklich zehntausend Seiten bleibt es rund eine
   Sekunde beim ersten Öffnen. Wenn das jemand einmal wirklich hat, ist der
   Auftrag der nächste Schritt — dann aber mit einer gemessenen Zahl
   dahinter statt mit einer geschätzten.

4. **„Wichtig, aber verstaubt" kennt keine Absicht.** — **GESCHLOSSEN am
   1. September 2026 durch E329, und der zweite Satz hier war falsch.**
   Ein Feld gibt es sehr wohl: `gesperrt`, seit langem, gelesen von
   `editor.ts` und geschaltet in den Einstellungen („Seite gegen Bearbeiten
   gesperrt"). Nur fragte die Lückensuche nie danach. Eine gesperrte Seite
   verstaubt jetzt nicht mehr — sie ist fertig, nicht liegengeblieben.

   NICHT bei den Inseln: eine gesperrte Insel bleibt eine Insel. Fertig
   heisst nicht auffindbar.

5. **Die dünnen Themen sind die schwächste Art.** — **GESCHLOSSEN am
   1. September 2026 durch E329**, und zwar mit genau der hier
   vorgeschlagenen Regel. Ein Schlagwort, das heute an einer Seite steht,
   ist eine angefangene Sache; eines, das seit einem Vierteljahr allein
   dort steht, eine liegengebliebene. Unter der Grenze bleibt es bei 25
   (gezeigt, nicht gezählt), darüber beginnt es bei der Schwelle. Geordnet
   wird nach Alter, damit der Schnitt bei dreissig nicht die
   liegengebliebenen wegwirft.

   Der Deckel ist an der INSEL geeicht (55), nicht am Geist — der erste
   Entwurf stand bei 70 mit der Begründung „nie stärker als ein Geist", und
   `staerkeGeist(1)` ist 40.

Gefunden am 31. August 2026 (beim Bau von E288).


================================================================================
L106 — Was die Lern-Evidenz (E289) und der Kalender (E290) noch nicht können
================================================================================

**Zur Lern-Evidenz (E289):**

1. **Die Karteikarten sind die einzige Quelle.** Prüfungsergebnisse,
   Elektro-Aufgaben, der Lernpfad und die Simulationen sind auch Belege für
   Können, und keiner davon zählt mit. `Kompetenz.jeThema` nimmt jede Liste
   mit `sr` und `reviewVerlauf` — der Anschluss ist Arbeit an den
   Bereichen, nicht am Kern.

   **HALB GESCHLOSSEN am 1. September 2026 durch E339.** Die
   PRÜFUNGSSIMULATIONEN zählen mit, und sie sind der bessere Beleg: eine
   Karteikarte wird selbst bewertet, eine Simulation zählt richtig und
   falsch. `core/learning/belege.ts` übersetzt ein Ergebnis je Thema in
   Belege mit Datum; der Kern zählt sie als Belege, aber NICHT als Karten,
   und der Satz nennt die Herkunft — aber nur, wenn es mehr als eine Art
   ist. test331, 40 Punkte.

   WAS OFFEN BLEIBT: Elektro-Aufgaben und der Lernpfad. Sie führen kein
   Ergebnis mit Thema und Datum, wie die Simulationen es tun — dort ist
   zuerst das AUFHEBEN zu bauen, nicht das Anschliessen. Und eine bekannte
   Grenze beim Anschliessen selbst: `learning.ts` nennt ein Thema über
   `topicLabel` (gekürzt auf 120 Zeichen), `lernwelt.ts` über `themaVon`
   (ungekürzt). `Belege.themaAus` kürzt genauso, also treffen sie sich —
   ausser bei einem Seitentitel über 120 Zeichen, dessen erste 120 nicht
   eindeutig sind. Dann landete der Beleg unter einem zweiten Thema.

2. **Die Haltbarkeit steht nicht in der Anzeige.** Der Satz nennt sie
   („davon dürfte heute noch 62 % sitzen"), aber es gibt keinen Balken, kein
   Sortieren danach, keine Liste „was zuerst auffrischen". Genau das wäre
   der Nutzen.

   **GESCHLOSSEN am 1. September 2026 durch E325.** Ein Abschnitt „Zuerst
   auffrischen" über dem Themenfortschritt, sortiert nach `karten × zerfall
   + faellig × zerfall`. Fällig zählt mit seinem ZERFALL und nicht mit
   seiner Zahl — der erste Entwurf addierte roh, und das Bild zeigte
   „Deutsch, 98 % sitzt noch" vor „Mathematik, 81 %". Schwelle: eine ganze
   verblasste Karte. Ohne Verblasstes kein Abschnitt. test318, 18 Punkte.

3. **`fensterTage` wird nirgends benutzt.** — **GESCHLOSSEN am 1. September
   2026 durch E328.** `Kompetenz.verlauf` ist der Aufrufer, und beim
   Anschliessen kam heraus, dass das Fenster gar keins war: es schloss nur
   nach unten (`[jetzt−fenster, ∞)`). Mit der echten Uhr fällt das nie auf;
   mit zurückgestellter zählte alles Spätere mit.

4. **Kein Vergleich über Zeit.** — **GESCHLOSSEN am 1. September 2026 durch
   E328.** Der Abschnitt „Geht es aufwärts?" vergleicht die letzten 90 Tage
   mit den 90 davor, je Thema, in beide Richtungen und mit der grössten
   Veränderung zuerst. Nur Themen mit genug Belegen in BEIDEN Zeiträumen —
   wer erst seit acht Wochen lernt, ist nicht besser geworden, sondern neu.
   Unter fünf Prozentpunkten heisst es „gleich"; eine Anzeige, die immer
   eine Richtung zeigt, zeigt keine.

   WAS OFFEN BLEIBT: es ist ein Vergleich zweier Fenster und keine Kurve.
   Das ist Absicht — bei fünf Antworten je Punkt wackelt eine Kurve so
   stark, dass jeder Ausschlag nach Fortschritt aussieht. Wer mehr will,
   braucht zuerst mehr Belege, nicht mehr Punkte.

**Zum Kalender (E290):**

5. **Keine Zeitzonen.** TZID wird gelesen und weitergereicht, nicht
   umgerechnet. Ein Termin aus einem fremden Kalender in einer anderen
   Zeitzone steht damit zur falschen Uhrzeit da. Das ist bewusst so
   (eine halbe Zeitzonenrechnung ist schlimmer als keine), aber es ist eine
   Lücke und keine Lösung.

   **GESCHLOSSEN am 1. September 2026 durch E344 — und der Grund oben war
   nie „es geht nicht", sondern „es geht nicht halb".** Das stimmte. Nur ist
   die GANZE Rechnung seit Jahren im Browser eingebaut:
   `Intl.DateTimeFormat` kennt die vollständige IANA-Datenbank samt aller
   Umstellungen. Keine Bibliothek (§6), keine Tabelle, die veraltet.

   `core/calendar/zeitzone.ts` rechnet ZWEIMAL, und das ist der ganze
   Unterschied zwischen ganz und halb: `Intl` kann nur Augenblick →
   Wandzeit, gebraucht wird die Umkehrung. Wer den Versatz nur an der rohen
   Wandzeit misst, liegt in jeder Umstellungsnacht eine Stunde daneben.
   test336 §2 misst es: 1:30 am 29. März 2026 wird ohne den zweiten
   Durchgang zu 0:30 statt 1:30 Weltzeit.

   WAS OFFEN BLEIBT, und zwar mit Absicht: Outlooks Windows-Namen
   (`W. Europe Standard Time`) kennt `Intl` nicht. Übersetzt werden sie
   nicht — eine Tabelle mit hundert Namen wäre genau die halbe Lösung, aus
   der dieser Bogen herauskommt. Die Zeit bleibt dann, wie sie in der Datei
   steht, und Redion sagt beim Abholen, welche Zonen es nicht kennt (§35).

   test336, 33 Punkte, belegt rot in vier Richtungen.

6. **VTODO wird nicht gelesen.** — **HALB GESCHLOSSEN (E326).**
   `icsLesen` versteht seit E326 `BEGIN:VTODO`, führt eine Art mit
   (`termin`/`aufgabe`) und liefert Aufgaben in einer eigenen Liste, mit
   `DUE`, `COMPLETED`, `PERCENT-COMPLETE` und `PRIORITY`. Ein Streifen
   nennt beim Abholen die Zahl der offenen.

   WAS OFFEN BLEIBT: die Aufgaben landen in keinem Aufgabenmodell. Sie
   werden gelesen und genannt, aber nicht einsortiert — bewusst, denn eine
   Aufgabe mit Fälligkeit als Termin in die Kalendertabelle zu schreiben
   wäre die stille Falschaussage, die E290 gerade abgeräumt hat. Der
   Anschluss an Redions eigene Aufgaben ist ein eigener Bogen.

   **GESCHLOSSEN am 1. September 2026 durch E345 — und der Einwand oben galt
   der falschen TABELLE, nicht der Sache.** Redion hat ein Aufgabenmodell:
   eine Sammlung mit `istAufgaben` plus Eintrag in `aufgabenQuellen`
   erscheint unter „Meine Apps → Meine Aufgaben". Dorthin gehen sie jetzt,
   mit den Spaltennamen, die das Modell erwartet.

   Zwei Dinge machen die Tabelle zu einer Quelle, und nur eines ist
   offensichtlich: die Markierung an der Sammlung UND der Eintrag in
   `aufgabenQuellen`. Ohne den zweiten fragt „Meine Aufgaben" sie nie ab —
   eine Tabelle, die aussieht wie Aufgaben und nirgends auftaucht (§47).

   `aufgWer` wird beim Abgleich NICHT geschrieben: wer zuständig ist,
   entscheidet der Mensch. Der Haken folgt der Quelle, denn den führt sie.

   Und die Tabelle entsteht nur, wenn der Kalender wirklich Aufgaben hat.

   NICHT AUFGERÄUMT WIRD: eine Aufgabe, die die Quelle nicht mehr liefert,
   bleibt stehen. Das Gedächtnis aus E343 zählt Termine; es auf Aufgaben
   auszuweiten ist ein eigener Schritt.

   test337, 24 Punkte, belegt rot in drei Richtungen.

7. **Der Hinweis „das kenne ich nicht" erreicht die Oberfläche noch
   nicht.** Der Termin trägt `regelUnklar` und `regelSatz` mit — angezeigt
   wird beides nirgends. Das ist §47 von der leisen Seite und der nächste
   kleine Schritt.

   **GESCHLOSSEN am 1. September 2026 durch E295.** Der Kalender sammelt
   die ungelesenen Teile über alle Termine in eine Menge und nennt sie
   EINMAL in einem Banner — nicht je Termin: bei vierzig Wochenterminen
   stünde derselbe Satz vierzigmal da, und ab dem dritten liest ihn keiner
   mehr. `test291` §3 und §4, mit der Gegenprobe, dass eine gewöhnliche
   Regel schweigt.

8. **Kein Schreiben von BYDAY.** `icsSchreiben` erzeugt keine
   Wiederholungsregeln. Was Redion einliest, kann es nicht wieder ausgeben —
   der Rundlauf ist einseitig.

   **GESCHLOSSEN am 1. September 2026 durch E338.** Die Regel liegt jetzt in
   einer Spalte „Wiederholung" an der ERSTEN Folge, und der Export schreibt
   sie als `RRULE` an den Kopf; eine gestrichene Folge wird zu `EXDATE`, eine
   verschobene zu einem Ersatz mit `RECURRENCE-ID`. Gemessen: aus fünf
   Stunden und einem Zahnarzt werden zwei Termine statt sechs, und nach dem
   Zurücklesen steht derselbe Stundenplan da — die verlegte Stunde an ihrer
   neuen Stelle, einmal und nicht zweimal. Dafür musste `RECURRENCE-ID` auch
   GELESEN werden; das tat Redion bis dahin nicht, was nie auffiel, weil es
   selbst nie eines schrieb. test330, 35 Punkte.

   Der Weg dahin, unterwegs notiert (E335, E337): Beim Nachmessen fiel
   auf, dass die GEGENRICHTUNG kaputt war und nicht nur unvollständig —
   siehe E335 und L112. Für das Ausgeben selbst kam dabei heraus, warum es
   nicht die kleine Zeile ist, nach der es aussieht: eine Reihe korrekt
   auszugeben heisst, den KOPF mit der Regel zu schreiben und die Folgen zu
   unterdrücken, ausser denen, die abweichen (`RECURRENCE-ID`). Fünf Zeilen
   mit demselben `RRULE` auszugeben wäre schlimmer als gar keins: der
   empfangende Kalender sähe fünf unendliche Reihen.

   **UND DER RUNDLAUF IST BEIM MESSEN UM EINE HALBE SACHE BESSER GEWORDEN
   (E337).** Er gab bis dahin auch kein `DTEND` aus, weil `wiederholungen`
   jeder Folge das Ende wegnahm — im Stundenplan stand jede Stunde ohne
   Dauer. Jetzt wiederholt sich die DAUER statt des Endes, und der Export
   trägt fünf von fünf Endzeiten statt null. Was fehlt, ist nur noch die
   Regel selbst.

Gefunden am 31. August 2026 (beim Bau von E289 und E290).


================================================================================
L107 — ~~Neben den Seiten zeichnen, wie in OneNote~~ — GESCHLOSSEN am
1. September 2026 (E301). Die Begründung unten war ein DENKFEHLER; wie er
sich auflöst, steht am Ende dieses Eintrags.
================================================================================

Redur hat es beim Auftrag zur Rolle mitgesagt: „ich sollte so neben das pdf
direk zeichnen können wie one note". Die Rolle steht (E299), das Zeichnen
NEBEN den Seiten nicht.

Warum es nicht nebenbei ging: die Zeichenschicht hängt im Papier und rechnet
in Blattkoordinaten — `viewBox="0 0 595 842"` bei einer A4-Seite. Ein Strich
ist als Punkt IN DIESEM RAUM gespeichert, und genau das macht ihn
breitenunabhängig (E100, geprüft von test177). Die Schicht zu verbreitern
heisst, diesen Raum zu ändern — und damit läge jede schon gezeichnete Marke
an einer anderen Stelle.

Das ist eine Datenfrage und kein Aussehen. §46: lieber langsamer als ein
verrutschter Strich in einem Skript, das jemand vor der Prüfung durchgeht.

Was zu klären ist, bevor gebaut wird:

  · Bekommt das Papier einen Randbereich mit EIGENEM Koordinatenraum, oder
    wächst der vorhandene? Nur das erste lässt alte Marken unberührt.
  · Wandert eine Randnotiz mit, wenn die Seite später feiner gerechnet wird
    (`schaerfer`, E173)?
  · Was passiert beim Drucken und beim Markdown-Rundlauf mit dem, was neben
    der Seite steht?

Bis dahin gibt es den Weg über „Seite und Notizblatt nebeneinander" beim
Einlesen (E104): dort steht rechts ein A4-Blatt, auf dem man frei schreibt.
Das ist nicht dasselbe, aber es ist da und es verliert nichts.

Gefunden am 1. September 2026 (beim Bau von E299).


WIE ES SICH AUFLÖSTE (E301, wenige Stunden später)
--------------------------------------------------------------------------------
Der Satz oben — „die Schicht zu verbreitern heisst, diesen Raum zu ändern" —
stimmt nur unter einer Bedingung, die hier nicht gilt: dass die Seite auf dem
Bildschirm ihre Breite BEHÄLT, während die Box wächst. Dann wird jede Einheit
kleiner, und ja, dann läge alles woanders.

Wächst die Box dagegen nur nach RECHTS, und behält die Seite ihren ANTEIL an
der Fläche, ändert sich keine einzige gespeicherte Zahl. Eine Marke bei x=300
ist weiterhin 300 Einheiten vom linken Seitenrand entfernt. Es braucht also
weder einen zweiten Koordinatenraum noch ein zweites Feld — und als Zugabe
darf ein Strich von der Seite in den Rand DURCHLAUFEN, was mit zwei Räumen
gar nicht ginge.

Die drei Fragen, die hier standen, beantworten sich damit von selbst: der
Raum wächst, ohne dass alte Marken sich bewegen (test295 §1 misst es); eine
Randnotiz wandert beim feineren Rechnen genauso mit wie jede andere Marke,
weil sie dieselbe Sorte Marke IST; und Druck und Rundlauf sehen ein
Markenfeld, nicht zwei.

Der Weg über „Seite und Notizblatt nebeneinander" (E104) bleibt daneben
bestehen — er ist etwas anderes: ein eigenes Blatt mit eigenem Text, nicht
ein Rand am Skript.


================================================================================
L108 — Jedes Telefonbild vor dem 1. September zeigte ein Gerät mit Maus
================================================================================

Gefunden beim Bau von E300, und es betrifft nicht nur E300.

`bilder.mts` hat das Telefon über die BILDGRÖSSE nachgestellt — 390×844,
deviceScaleFactor 2 — und sonst nichts. Damit galt in jedem Telefonbild
`hover:hover`. Alles, was in Redion erst beim Überfahren erscheint, war
darauf zu sehen, obwohl es auf einem echten Telefon niemand zu sehen bekommt.

Aufgefallen an einer Kleinigkeit: im Bild fehlte das Schliesskreuz des nicht
aktiven Reiters, während der Prüflauf an derselben Stelle `opacity: 1` mass.
Beide hatten recht. Sie sahen zwei verschiedene Geräte an.

`isMobile`/`hasTouch` sind seit E300 gesetzt. Offen bleibt der Rückblick:

  · Welche `:hover`-Regeln in Redion haben KEINE Entsprechung für Tastgeräte?
    Eine gezählte Antwort gibt es nicht — nur die eine, die E300 gefunden hat.
  · Bilder, die vor dem 1. September entstanden sind, taugen für diese Frage
    nicht mehr. Sie liegen ohnehin nicht im Verzeichnis (§55.4), aber die
    Schlüsse, die aus ihnen gezogen wurden, stehen in der Doku.

GESCHLOSSEN am 1. September 2026 mit E309. Der Wächter unten wurde gebaut
(test303), hat NEUN Fallen gefunden, und alle neun haben einen
`@media(hover:none)`-Zweig bekommen: `.tt-auf`, `.act`, `.bild-werk`,
`.bild-griff`, `.ki-pin`/`.ki-weg`, `.zeilen-aus`, `.stab-griff`,
`.stab-tools`, `.knopf-set`. Von 327 `:hover`-Regeln machen 39 etwas
sichtbar; die übrigen 30 heben nur hervor, was ohnehin dasteht, oder nehmen
den Griff am Telefon ausdrücklich weg — beides ist eine Entscheidung.

Der zweite Punkt oben bleibt richtig und ist nicht nachholbar: Schlüsse aus
Bildern vor dem 1. September stehen weiter in der Doku. Sie fallen auf,
sobald jemand dieselbe Stelle noch einmal ansieht.

Der Wächter, wie er geplant war und jetzt steht: er sieht jede
`:hover`-Regel in `quell/schale/stil/` daraufhin an, ob sie etwas SICHTBAR
macht — also `opacity`, `display` oder `visibility` setzt — und nicht nur
färbt. Nur die
erste Sorte kann auf einem Telefon einen Griff verstecken.

Gefunden am 1. September 2026 (beim Bau von E300).


================================================================================
L109 — Die Meldung unten deckt am Telefon die Knöpfe eines Fensters zu
================================================================================
1. September 2026, auf dem Bild zu E308 gefunden

Am Telefon lag „📕 1 Karteikarte ist fällig" (E184) genau über den beiden
Knöpfen im Fuss des Tagesplans — „Als Seite anlegen" und „Schliessen" waren
beide verdeckt. Die Meldung sitzt fest am unteren Rand (`bottom:14px`), der
Fuss eines Fensters sitzt am unteren Rand des Fensters, und auf einem
390 px breiten Schirm ist das derselbe Ort.

Das ist NICHT von E308 verursacht — es trifft jedes Fenster mit Fussleiste
und jede Meldung, die währenddessen kommt. Nur gesehen hat es bisher
niemand, weil die Telefonbilder erst seit E300 wirklich Telefonbilder sind
(L108).

Warum es hier nicht mitrepariert wurde: die Meldung ist ein Teil der Schale
und erscheint über der ganzen App. Sie höher zu setzen, während ein Fenster
offen ist, ist eine Änderung an jedem Dialog gleichzeitig — und der einzige
Beleg dafür, dass es danach überall besser aussieht, wären Bilder von jedem
Dialog. Das ist ein eigener Bogen, kein Nebensatz.

GESCHLOSSEN am 1. September 2026 mit E310 — am selben Tag, an dem sie
aufgeschrieben wurde. Der Toast geht am Telefon nach OBEN, sobald ein
`.overlay` offen ist; ein Stück höher hätte bedeutet, alle Kombinationen aus
vier schwebenden Dingen zu pflegen.

Die offene Frage ist beantwortet, und zwar gemessen: am Rechner verdeckt sie
nichts. Fuss 542 – 604, Meldung 835 – 878. Die Regel steht deshalb nur im
Telefon-Zweig.

test304 prüft drei Fenster mit Fussleiste und misst mit erzwungener alter
Lage nach, dass der Wächter rot werden KANN.


================================================================================
L110 — `durationMs` wird gelesen und nirgends geschrieben
================================================================================
1. September 2026, beim Bau von E308 nachgemessen

`lernwelt.ts:873` rechnet mit der Dauer einer Antwort:

    const ms  = zahl(eintrag.durationMs ?? eintrag.dauerMs, 0);
    const sek = zahl(eintrag.durationSeconds ?? eintrag.dauerSekunden, 0);

Alle vier Feldnamen kommen im ganzen Bestand genau hier vor. Niemand
schreibt sie. Die Zeile rechnet also immer mit 0 und tut das still.

Was daraus folgt, ist nicht schlimm — die Lernzeit wird anderswo geschätzt
—, aber es ist die gefährliche Sorte: eine Rechnung, die aussieht, als
benutzte sie eine Messung.

E308 hat für seinen eigenen Zweck den anderen Weg genommen: der Zeitpunkt
`at` steht wirklich an jeder Antwort (`wissen/dienst.ts:183`), und der
Abstand zwischen zwei Antworten ist die Dauer der zweiten
(`core/learning/lerntempo.ts`). Damit ist die Frage für den Planer
beantwortet, für `lernwelt.ts` aber nicht.

GESCHLOSSEN am 1. September 2026 mit E311, am selben Tag. Genommen wurde
der zweite der beiden Wege:

  1 · beim Antworten wirklich eine Dauer schreiben (`dauerMs` am Eintrag).
      Dann stimmen beide Stellen, aber alte Einträge haben sie nicht.
  2 · `lernwelt.ts:873` auf `Lerntempo` umstellen und die vier toten
      Feldnamen entfernen. Dann gibt es EINE Rechnung statt zwei.  ← so

Nicht beides halb. test305 §2 hält fest, dass keiner der vier Namen mehr in
ausführbarem Code steht — samt Gegenprobe, dass ein echter Feldname sehr
wohl gefunden würde.


================================================================================
L111 — ~~`.finder .res button{width:100%}` schlägt jede einzelne Klasse~~ — GESCHLOSSEN am
2. September 2026 (E348)
================================================================================

Dreimal an einem Tag dieselbe Falle, und beim dritten Mal war klar, dass es
keine Nachlässigkeit ist, sondern eine Eigenschaft dieses Stils.

Redions Fensterstil setzt breite Regeln auf Nachfahren:

    .finder label input, .finder label select { width:100% }   werkzeuge.css
    .finder .res button                       { width:100% }   werkzeuge.css
    .ez-steuer select, .ez-steuer input       { min-width:150px } einstellungen.css

Alle drei haben Spezifität (0,1,2) oder (0,1,1) mit einem Element mehr als
eine gewöhnliche Einzelklasse. Wer danach `.mein-feld{width:76px}` schreibt,
verliert — nicht sichtbar, nicht mit einer Warnung, sondern still. Das
Ergebnis sieht aus wie Absicht: ein Eingabefeld über die halbe Zeile, ein
Häkchen so breit wie ein Knopf.

WAS ES DREIMAL GEKOSTET HAT:

  · E320 — das Budgetfeld des Tagesplans war 479 px breit für eine
    zweistellige Zahl. Gefunden auf einem Bild, nicht von einem Prüflauf.
  · E321 — beim Grenzfeld der KI-Kosten von vornherein umgangen, WEIL E320
    am selben Tag danebenlag. Ohne diese Erinnerung wäre es der zweite
    Fehler geworden.
  · E324 — der Haken der Lückenliste war so breit wie „Seite anlegen".
    Wieder auf einem Bild gefunden.
  · E326 — DIE VIERTE VARIANTE, und die gefährlichste: hier war es keine
    Breite, sondern eine ganze Regel. `.banner.info` wurde nach
    `ansichten.css` geschrieben, obwohl es sie in `bausteine.css` schon
    gab. Gleiche Stärke, spätere Datei gewinnt — die neue Regel war TOT.
    Die Prüfung war trotzdem grün, weil sie das Ergebnis mass und nicht
    die Herkunft. Dahinter lag der eigentliche Fehler: die gewinnende
    Regel setzte `--c-blue` auf `--b-blue`, im dunklen Thema 3.11:1 gegen
    die 4.5 aus §38. Auch das fand das Bild, nicht der Prüflauf.

  · E334 — DIE FÜNFTE, und die einzige, gegen die es jetzt einen Wächter
    gibt. Hier war der Verlierer keine eigene Regel, sondern die des
    BROWSERS: `[hidden]{display:none}` gegen `.mb-rechts-knopf{display:grid}`.
    Die Autoren-Regel gewinnt, und `hidden` bedeutet dann gar nichts mehr.

    E251 hatte das schon einmal repariert — mit `#mb-glocke[hidden]`, also
    an einer KENNUNG. E322 hängte dreizehn Bögen später den nächsten Knopf
    mit derselben Klasse daneben, und der Fehler war zurück: `hidden`,
    trotzdem 44 px, Reitergruppe 190 → 234 px, über der Reserve der
    Reiterzeile (`scroll-padding-inline-end: 200px`). Gefunden hat es
    test247 — an einer BREITE, nicht an dem Knopf.

WARUM ES KEIN PRÜFLAUF FINDET: es ist kein Fehler, sondern gültiges CSS mit
einem unerwarteten Ausgang. Ein Wächter müsste jede neue Klasse gegen alle
breiten Regeln stellen — machbar, aber er würde Dutzende gewollter Fälle
melden.

FÜR DIE VIERTE GEHT ES DOCH, und zwar ohne Fehlalarm (E340): zwei
Erklärungen für DASSELBE in ZWEI Dateien, wo die frühere nie zum Zug kommt,
sind immer ein Versehen. Nachgezählt vor dem Bauen: 45 637 Erklärungen,
davon 27 tot — darunter ein fünfspaltiges Raster mit 56px-Knöpfen, das
niemand je gesehen hat. Alle 27 sind fort, und dass das folgenlos ist,
wurde gemessen statt behauptet: der gerechnete Stil von 21 320 Elementen in
zwanzig Lagen, vorher gegen nachher, null Unterschiede. test332 hält es
fest.

Nicht gemeldet wird dabei: zweimal derselbe WERT (unschön, aber verlustfrei
— und wer das meldete, meldete Dutzende gewollter Fälle mit) und zweimal
dasselbe in EINER Datei (das ist eine Umschaltung und liest sich von oben
nach unten richtig).

FÜR DIE FÜNFTE GEHT ES EBENSO, und zwar billig: `hidden` hat genau EINE
gewollte Bedeutung. Ein Element, das es trägt und trotzdem gezeichnet wird,
ist immer ein Fehler — es gibt keinen Fall, in dem man das will. test258 §9
geht deshalb über ALLES mit `hidden`, am Telefon und am Rechner, und
verlangt `display:none`. Gemessen: 14 bzw. 15 solche Elemente, keines
sichtbar. Nimmt man die Klassenregel wieder heraus, meldet er
`mb-auftraege.mb-rechts-knopf → grid 44×44`.

Das ist der Unterschied zwischen den fünf Fällen: bei BREITEN gibt es
gewollte Ausnahmen — dort bleibt es bei der kleinen Antwort. Bei `hidden`
und bei doppelt erklärten Regeln nicht, und dort steht jetzt je ein
Wächter.

DIE VIERTE HAT EINE EIGENE LEHRE: nicht nur „meine Regel könnte
verlieren", sondern „meine Regel könnte es schon geben". Vor einer neuen
Regel für eine Klasse, die es vielleicht schon gibt, hilft ein Blick, der
zehn Sekunden kostet:

    grep -n "\.banner\.info" quell/schale/stil/*.css

DIE KLEINE ANTWORT, die dreimal funktioniert hat: eine neue Regel in einem
`.finder`- oder `.ez-`-Fenster bekommt den Vorfahren mit davor
(`.finder .res .wl-hak`, `.ez-steuer input.ez-grenze`). Kostet drei Zeichen
und nimmt die Frage weg.

DIE GRÖSSERE ANTWORT wäre, die breiten Regeln auf das zu verengen, was sie
meinen — `.finder .res > button` statt `.finder .res button`. Das ist ein
eigener Bogen mit einem Bild je Fenster, denn es ändert bestehende
Oberflächen, und die Wirkung sieht man erst beim Hinsehen.

Gefunden am 1. September 2026 (E320, E321, E324, E326, E334);
zwei der fünf haben seit E334 und E340 einen Wächter.

**GESCHLOSSEN am 2. September 2026 durch E348 — die grössere Antwort, und
zuerst gemessen.** Ein Messlauf öffnete alle 163 Befehlsfenster und die 19
Einstellungsbereiche, am Rechner (1280 × 900) und am Telefon (390 × 844),
und verglich den gerechneten Stil jedes Elements vor und nach der
Verengung. Am Rechner änderten sich neun Fenster, am Telefon sechs; die
Einstellungen blieben in allen 19 Bereichen unverändert. Die neun waren
genau die, die es nötig hatten — und zwei mehr, als diese Lücke kannte:
das Antwortfeld des Elektro-Arbeitsplatzes hatte seit jeher einen Rand,
den `.finder input{border:none}` verdeckte, und ein Haken im Tempo-Fenster
war 496 px breit.

BERICHTIGUNG: die zwei Regeln, um die es geht, stehen in `aufbau.css`,
nicht in `werkzeuge.css`, wie oben steht — es sind die Regeln für
Suchfeld und Trefferzeile der BEFEHLSPALETTE, die mit E230 zu Regeln für
alles wurden. Jetzt `.finder > input`, `:where(.finder .res) > button` und
`:where(.finder label) > input` mit (0,0,1) — jede Klasse gewinnt — und
`.ez-steuer > select`. Die Fenster, die vorher von der Palettenzeile
lebten, tragen gewöhnliche Klassen (`.btn`, `.fn-feld`, `.fn-reihe`,
`.fn-aus`, `.fn-blatt`) statt Inline-Stil; der Vorbau aus E324 ist
zurückgebaut, die übrigen drei bleiben als gewöhnliche Regeln stehen.

Die kleine Antwort oben gilt damit nicht mehr als Pflicht, aber als
Erinnerung: wer eine Regel für ein Fenster schreibt, sieht sich das
Fenster an. Und `:not([type=…])` zählt wie ein Attribut — die erste
Fassung der Verengung war deshalb die STÄRKSTE Regel im Stil und machte
das Budgetfeld aus E320 wieder 480 px breit; test51 fing es, test340
nicht. Steht in E348.

test340, 52 Punkte, belegt rot in acht Richtungen.


================================================================================
L112 — ~~Eine verkürzte Reihe lässt Geisterstunden stehen~~ — GESCHLOSSEN am
1. September 2026 (E336). Was für EINZELNE Termine noch offen ist, steht
unten.
================================================================================

Gefunden beim Bau von E335, gemessen und nicht vermutet.

Die Quelle verkürzt eine Reihe — `COUNT=5` wird zu `COUNT=3`, oder die
Schule streicht die letzten beiden Stunden vor den Ferien. Danach:

    vorher      5 Zeilen, 7.9. bis 5.10.
    Abgleich    neu: 0, frisch: 3
    nachher     5 Zeilen, 7.9. bis 5.10.

Die beiden überzähligen bleiben mit ihren alten Daten stehen. Im
Stundenplan stehen zwei Stunden, die es nicht mehr gibt.

**GESCHLOSSEN für Reihen am 1. September 2026 durch E336.** Aufgeräumt wird
nur INNERHALB einer Reihe, die dieser Lauf wirklich geliefert hat — und in
den Papierkorb, nicht ins Nichts. Zwei Sperren, beide belegt rot: eine
Reihe, die gar nicht kam, wird nicht angefasst (sonst hätte eine
Netzstörung den Kalender geleert), und ein Einzeltermin nie. Eine dritte
Sperre („nur Zeilen dieser Quelle") hat der Prüflauf als falsch erlegt —
sie hätte ein umbenanntes Abo für immer unaufräumbar gemacht.

WARUM ES SO IST: `uebernehmen` löscht grundsätzlich nichts. Das ist keine
Nachlässigkeit, sondern eine Regel (§9, §13) — eine Zeile kann inzwischen
eigene Notizen tragen, eigene Spalten, eine Verknüpfung zu einer Seite. Ein
Abgleich, der wegräumt, was die Quelle gerade nicht liefert, ist genau der
Datenverlust, den §46 an erste Stelle setzt. Ein Abo, das bei einer
Netzstörung eine leere Antwort liefert, hätte damit den ganzen Kalender
gelöscht.

DIE GLEICHE LAGE GILT FÜR EINEN GESTRICHENEN EINZELTERMIN. E290 hat den
häufigeren Fall abgeräumt — eine per `EXDATE` abgesagte Stunde kommt nicht
mehr JEDES MAL zurück. Was schon angelegt war, bleibt aber liegen.

WAS OFFEN BLEIBT: EIN EINZELNER GESTRICHENER TERMIN

Streicht die Quelle einen Termin, der zu keiner Reihe gehört, bleibt er
stehen. Das ist mit Absicht so und keine halbe Arbeit: über einen
Einzeltermin lässt sich nichts sagen. Er kann von Hand angelegt worden
sein, er kann aus einer Datei stammen, die man einmal eingelesen hat, er
kann zu einem Abo gehören, das gerade nur ein kürzeres Zeitfenster
liefert. Ein Abgleich, der von Hand Angelegtes wegräumt, wäre schlimmer als
eine Karteileiche.

Eine Antwort dafür bräuchte etwas, das es noch nicht gibt: einen Vermerk am
Abo, WELCHE Kennungen es beim letzten Mal geliefert hat. Dann — und nur
dann — liesse sich sagen „diese Kennung kam von diesem Abo und kommt nicht
mehr". Das ist ein eigener Bogen, und er berührt die Sicherung (die Liste
müsste mitreisen).

WAS BIS DAHIN GILT: die Lücke ist genannt und nicht still. Das ist der
Unterschied zwischen einer bekannten Grenze und einem Fehler (§35).

**GESCHLOSSEN am 1. September 2026 durch E343 — auf genau dem hier
beschriebenen Weg.** Das Abo merkt sich in `geliefert`, welche Kennungen es
beim letzten Mal gebracht hat. Steht eine darin und kommt sie diesmal nicht
mehr, ist „die Quelle hat ihn gestrichen" belegt statt geraten, und der
Termin wandert in den Papierkorb.

Der Gewinn ist grösser als die eine Frage: die Liste lässt die schwierigen
Fälle gar nicht erst entstehen. Ein von Hand angelegter Termin stand nie
darin, ein eingelesener auch nicht — es braucht keine Heuristik, die „sieht
von Hand angelegt aus" rät.

Drei Sperren, jede nachgemessen: ohne alte Liste passiert nichts (der erste
Lauf nach der Umstellung SCHREIBT sie nur); ein leerer Lauf räumt nicht auf
(ohne diese Sperre leert der nächste Netzwackler den ganzen Kalender —
gemessen); und nur Kennungen aus der eigenen Liste, damit zwei Abos in einer
Tabelle einander nicht abräumen.

Die Liste reist mit der Sicherung, weil `ics:abos` weder in `NUR_HIER` noch
in `GERAETEIGEN` steht — im Prüflauf nachgemessen, nicht angenommen.

Was es kostet, steht in E343: ein Abo, das plötzlich ein kürzeres
Zeitfenster liefert, schiebt die Termine ausserhalb in den Papierkorb.
Derselbe Handel wie bei E336.

test335, 30 Punkte, belegt rot in vier Richtungen.

Gefunden am 1. September 2026 (E335), für Reihen geschlossen am selben Tag
(E336).


================================================================================
L113 — ~~Der Start vergass das Regal, den Papierkorb und die Seite in der PDF~~ — GESCHLOSSEN am
2. September 2026 (E349)
================================================================================

E236 versprach „das zuletzt geöffnete Dokument, sonst das Regal", und
test67 §12 mass es in zwei Fällen. Beim Nachlesen für Redurs Wunsch
(„immer die zuletzt geöffnete PDF, sonst der Dokumente-Teil") fanden sich
vier stille Löcher: das Regal hielt genau einen Start, weil der Start
davor die erste Wurzelseite öffnete und `letzte` überschrieb; `#dokumente`
in der Adresse schaltete die Startansicht ab; eine Seite im Papierkorb ging
wieder auf; das Onboarding setzte die Startansicht ungefragt auf „Heute"
oder „Workspace" — wer es durchlief, sah nie mehr seine PDF. Und der
Dokumentmodus begann jedes Mal auf Seite 1.

**GESCHLOSSEN am 2. September 2026 durch E349.** Eine Marke `zuletztOrt`
sagt, wo man war; das Regal kommt ohne Vorseite; ein Hash ist nur ein Ziel,
wenn es die Seite gibt; der Papierkorb ist kein Ort; „start"/„workspace"
fallen einmal auf „dokument" zurück (Marke `startAnsichtE349`); das
Onboarding schreibt nichts mehr; die zuletzt angesehene Seite eines
Dokuments steht als Meta `dokSeite:<id>`. test341, 37 Punkte, belegt rot
in sechs Richtungen.

Gefunden und geschlossen am 2. September 2026.


================================================================================
L114 — Was der ZIP-Import (E350) bewusst noch nicht kann
================================================================================

E350 holt eine ZIP so ins Regal, wie sie ist. Was bleibt, mit Grund:

1. ~~**Der Lauf ist kein Auftrag.**~~ ERLEDIGT in E365: die ZIP wandert
   als abgeleitete Arbeitskopie in die Ablage, der Auftrag
   (`zip-import`, „ZIP entpacken") trägt ihre Kennung, und jeder Eintrag
   ist ein Schritt mit Wiederaufsetzpunkt — Stelle, Wurzelfach und Zahlen
   stehen im Auftrag. Wer den Tab bei Datei 40 von 87 schliesst, sieht den
   Auftrag im Auftragsfenster stehen und bekommt die restlichen 47, sobald
   die Maschine ihn wieder aufnimmt; nichts wird doppelt (E363). Nach dem
   letzten Eintrag geht die Arbeitskopie, bei einem Abbruch bleibt sie
   liegen. Eine ZIP über der Ablagegrenze und ein Redion ohne Maschine
   laufen wie früher — mit einem Satz, der sagt, dass das Fenster offen
   bleiben muss. test357. Was bleibt: der Läufer rechnet weiter im Faden
   der Oberfläche (L103 Punkt 2), und ein zweiter Tab kann denselben
   Auftrag nicht gleichzeitig übernehmen (die Pacht der Maschine, E286).

2. **Jedes Bild wird ein Deckel.** Das ist die GoodNotes-Lesart „eine Datei,
   ein Dokument" — bei 500 Fotos in einem Ordner sind das 500 Deckel. Eine
   Sammelseite je Ordner wäre die Alternative; sie bräuchte eine Regel,
   ab wann ein Ordner „ein Fotoalbum" ist.

3. **Zwei Regale, zwei Regeln — HALB ERLEDIGT in E366.** Die eine Hälfte
   war die Tiefe: das Notizhefte-Regal zeigte Fächer nur eine Ebene tief
   (L78 Punkt 2). Das ist weg — die Schachtelung steht jetzt so da, wie
   die ZIP sie gebracht hat.

   Was bleibt, ist die andere Hälfte: das Notizhefte-Regal zeigt PDFs
   nicht (L77 Punkt 3 — eine Seite mit PDF-Seiten zählt als PDF und lebt
   in der Bibliothek). Ein Import mit `Schule/Physik/Skript.pdf` ist in
   der Bibliothek vollständig; im Notizhefte-Regal steht das Fach mit
   seinem Weg, aber ohne das Skript darin. Ob die beiden Regale zu einem
   werden sollen, ist eine eigene Entscheidung und keine Lücke — es ist
   die Frage, ob „Notizhefte" ein Filter oder ein Ort ist.

4. ~~**Keine Ablegezone-Optik.**~~ ERLEDIGT in E368: das Ziel trägt
   während des Zugs einen gestrichelten Rahmen und eine Fläche (nicht nur
   Farbe, §38), am Zeiger hängt der Name des Hefts, und die gehobene Karte
   bleibt an ihrem Platz stehen — nur blasser. Sichtbar ist das alles NUR
   während eines Zugs; danach ist die Ansicht wieder ruhig. test360 §2.

5. ~~**Der Leser kennt CP437 nicht, keine verschlüsselten Einträge, keine
   CRC-Prüfung.**~~ ERLEDIGT in E363: `ZipDetails` (Kern) rechnet die
   CRC-32 fortlaufend, liest Namen ohne UTF-8-Bit als CP437 (gültiges
   UTF-8 ohne Bit bleibt UTF-8) und erkennt Bit 0; beide Leser prüfen
   jeden Eintrag nach dem Entpacken gegen seine Prüfsumme (scheibchenweise,
   ohne ihn in den Speicher zu holen) und werfen bei Beschädigung und bei
   Verschlüsselung mit Grund; der Import stellt beides zu den
   Übersprungenen. `Austausch.zipSchreiben` setzt das UTF-8-Bit in beiden
   Köpfen. test355. Was bleibt: die Prüfung kostet einen zweiten Lesegang
   je Eintrag — bei einer 500-MB-Sicherung spürbar, aber ehrlich.

6. ~~**Keine Wiedererkennung beim zweiten Import.**~~ ERLEDIGT in E363:
   jedes Dokument aus einer ZIP trägt `importKennung` = Name, Rohgrösse und
   Prüfsumme aus dem Verzeichnis; beim zweiten Einlesen wird eine Datei mit
   derselben Kennung im selben Fach übersprungen und gezählt („3 schon da
   (unverändert)"), eine geänderte kommt als „ (2)" daneben — nichts wird
   überschrieben, Anmerkungen am alten Dokument bleiben. test355. Was
   bleibt: eine Datei, die in ein anderes Fach verschoben wurde, wird nicht
   wiedererkannt (die Kennung gilt je Fach); und die Frage, ob eine
   geänderte Datei das alte Dokument ERSETZEN soll, ist bewusst mit Nein
   beantwortet — das wäre der Weg, auf dem Anmerkungen verschwinden.
   Der ursprüngliche Absatz stand so: Eine
   Kennung je Datei (Name + Grösse + Prüfsumme) könnte das ändern — das
   ist der Obsidian-Weg (redion-id), nur ohne Kennung im Archiv.

7. ~~**Viele grosse PDFs kosten Zeit.**~~ ERLEDIGT in E373: die Schätzung
   steht jetzt VOR dem Start. `core/jobs/estimate.ts` rechnet aus Name und
   Rohgrösse jedes ZIP-Eintrags — beides steht im Verzeichnis, es muss
   nichts entpackt und keine Seite gerendert werden —, und der Anlauf sagt
   „Semester.zip: 12 Dateien · 96 PDF-Seiten — rund 9 Minuten".

   Zwei Dinge daran sind wichtiger als die Zahl selbst. Erstens: **unter
   zwanzig Sekunden sagt sie gar nichts.** Drei Bilder und zwei Notizen
   hören nichts über Minuten — sonst läse den Satz nach der dritten ZIP
   niemand mehr (die Lehre aus E284, E286, E288, E289 und E290). Zweitens:
   **sie lernt.** Redion misst beim Arbeiten mit, je Art und je PDF-Seite,
   und rechnet die nächste Schätzung daraus; der erste Lauf zählt ganz,
   nach acht Läufen verschiebt einer noch ein Achtel. Solange kein echter
   Lauf eingegangen ist, steht „(geschätzt, noch ohne Messung)" dabei.
   test363, 57 Punkte.

   Die Zahl 0,35 s je Seite steht weiterhin als Startwert im Kern — mit
   dem Vermerk, dass sie aus DIESER Zeile stammt und nicht aus einer
   eigenen Messung (siehe L117).

Gefunden am 2. September 2026 (E350).


L115 — Was die Zeichenschicht nach E351 noch nicht kann (Redurs Punkt 3, Rest)
================================================================================

E351 hat die Stifte gebaut: Füller, Kugelschreiber, Pinsel, Druck je Punkt,
Tempo als Ersatz, Marker am Lineal, eigene Farben. GoodNotes kann mehr, und
das hier ist die Liste — in der Reihenfolge, in der sie gebaut werden soll,
mit dem Grund, warum jeder Punkt ein eigener Bogen ist:

1. ~~**Der Radierer nimmt eine ganze Marke je Tipp.**~~ ERLEDIGT in E352:
   Streichen, drei Arten (Ganz, Teil, Marker), Kreis × Polylinie in
   `InkGeometry.splitByCircle` mit `pts` UND `pressure`, Rückknopf und
   Seitenknopf des Stifts, Ring beim Ziehen — test344. Was bleibt: die
   Zeichenfläche des Whiteboards (`zeichenflaeche.ts`) hat ihren eigenen
   Radierer, der weiter eine Form je Tipp nimmt.

2. ~~**Das Lasso fehlt, und die Auswahl kann nicht skalieren oder kopieren.**~~
   ERLEDIGT in E353: Lasso (`insidePolygon`, Schlinge nur mit Fläche),
   vier Griffe mit `InkGeometry.scale`, Kopieren und Einsetzen (Strg und
   Knöpfe, eine Ablage für alle Flächen), Farbe und Strich mit Auswahl,
   Escape — test345. Was bleibt: kein Drehgriff; der sichtbare Griffpunkt
   ist am Telefon drei Pixel klein (das Trefffeld ist 22 Einheiten, der
   Punkt nicht); keine Systemzwischenablage.

3. ~~**Kein Handballen-Schutz.**~~ ERLEDIGT in E354: `data-stift` mit vier
   Sekunden Fingersperre, ein Zug gehört seinem Zeiger, der Stift nimmt
   der aufliegenden Hand den Strich, ein zweiter Finger verwirft den
   Fingerzug — test346 mit Schrittfolgen mehrerer Zeiger. Was bleibt: die
   vier Sekunden sind Erfahrung, kein Mass.

4. ~~**Kein Zoom mit zwei Fingern, kein Strg+Rad.**~~ ERLEDIGT in E354 für
   das DOKUMENT: Strg+Rad und Kneifen schreiben in den Zoomregler, beides
   in dessen Grenzen. Was bleibt: das Kneifen zoomt um die Mitte, nicht um
   den Punkt zwischen den Fingern; das Blatt in einer gewöhnlichen Seite
   hat weiterhin keinen Zoom.

5. ~~**Keine Formerkennung.**~~ ERLEDIGT in E355 für Kreis, Ellipse,
   Rechteck und Linie: ziehen, 450 ms halten, `InkShapes.recognize` —
   test347. Was bleibt: kein Dreieck, kein Pfeil; keine Vorschau der Form
   während des Haltens; die Schwellen sind Erfahrung, keine Masse.

6. ~~**Kein Bild- und kein Textwerkzeug auf der Zeichenschicht.**~~ Das
   BILD ist ERLEDIGT in E357: Werkzeug „Bild" in der Leiste öffnet den
   Dateiwähler, die Datei geht in die Ablage (Stücke, das Blatt als Block),
   die Marke `{id, art:'bild', dateiId, pts}` zeichnet ein `<image>` aus der
   bekannten Adresse — synchron, damit Druck und Folien es sehen —, sonst
   einen Platzhalter; mittig, halb so breit, im Seitenverhältnis, danach
   gewählt. Skalieren hält das Verhältnis, der Radierer lässt es stehen,
   Kopieren teilt die Datei. test349. Der TEXT ist ERLEDIGT in E360: ein
   Tipp fragt mehrzeilig, der Text wird ein Kasten (`breiteBox`, 40 % der
   Blattbreite) mit Zeilen aus `InkGeometry.textLayout` — deterministisch,
   ohne DOM, dieselben Zeilen für Bildschirm, Druck und Auswahlkasten —,
   mit Schriftart (die fünf aus E101), Stufen (A−/A+), Fett und Rahmen aus
   der Leiste; mit Auswahl gilt es der Auswahl. Alte einzeilige Marken
   bleiben einzeilig. test352. Was am Text bleibt: keine Ausrichtung
   (links/mitte/rechts), keine Farbe je Wort, kein Kursiv, keine
   Hintergrundfüllung; die Zeichenbreiten sind Schätzungen je Familie, kein
   Schriftmass — ein Wort kann in einer Schrift etwas früher oder später
   brechen, als das Auge es täte, aber überall gleich; die Höhe des Kastens
   folgt dem Inhalt, man zieht nur die Breite. Und am Bild: eine gelöschte Bildmarke lässt
   ihre Datei am Blatt zurück (sie geht erst mit dem Blatt); ein Bild
   kommt nur aus dem Dateiwähler, nicht per Ziehen-und-Ablegen oder aus
   der Zwischenablage des Systems; kein Drehen, kein Zuschneiden; eine
   Vorschau, die synchron in eine Leinwand zeichnet, sieht beim ersten
   Mal den Platzhalter.

7. ~~**Undo verliert die Knoten-Zuordnung beim Neuzeichnen.**~~ ERLEDIGT
   in E358. Erst gemessen (2. September 2026, unter Last): Zurück bei
   100/1000/3000 Marken 7/59/155 ms, das Strichende 3/21/44 ms, der
   Strichanfang 3/8/14 ms. Dann gebaut: `redraw` gleicht Knoten und Marken
   über eine Merkliste der gezeichneten Fassung ab — gleich bleibt, anders
   wird geflickt, überzählig geht, fehlend kommt, und die Knotenfolge ist
   die Markenfolge. Zurück bei 1000 Marken: 24 ms (test350 §5). Was
   bleibt: Strichanfang und Strichende kopieren weiter den ganzen Bestand
   (`snapshot` für den Verlauf, zwei `JSON.stringify` in `commit`, dazu
   `save`) — bei dreitausend Marken 14 und 44 ms; ein Verlauf aus
   Änderungen statt aus Abbildern wäre der nächste Schritt.

8. ~~**Am Telefon steht die Leiste in einer langen Reihe.**~~ ERLEDIGT in
   E356: jeder Knopf trägt seine Gruppe, die Leiste ihr Werkzeug, und am
   Telefon zeigt das CSS nur die Gruppen des Werkzeugs — direkt dahinter,
   und die Leiste rollt hin (732 statt 1539 px beim Schreiben). test348.
   Was bleibt: keine Klappe unter dem Werkzeug wie in GoodNotes.

9. ~~**Am Rechner steht die Leiste über dem Blatt in fünf Zeilen.**~~
   ERLEDIGT in E359: die Gruppenregel aus E356 gilt bei jeder Breite, am
   Rechner zwei Zeilen (Werkzeuge, darunter ihr Zubehör) über einen
   Zeilenbruch, Wörter nach Breite der Leiste (`@container`), und die
   Papierwahl ist eine Klappe (100 statt 210 px). 84 statt rund 220 px.
   test351. ~~Was bleibt: vierzehn Werkzeuge sind viele (Linie, Pfeil,
   Rechteck, Ellipse als ein Formen-Werkzeug wäre GoodNotes näher).~~
   GESCHLOSSEN am 3. September 2026 mit E375: ein Knopf „Form", der die
   zuletzt gewählte trägt, und die vier im Zubehör darunter. Elf Werkzeuge
   statt vierzehn; die Kennungen der Marken bleiben `line`, `arrow`,
   `rectangle`, `ellipse` — zusammengefasst sind die KNÖPFE, nicht das
   Format. test365, 28 Punkte.

   Was bleibt: am Telefon steht der feste Teil weiter in einer eigenen
   Zeile.

Nicht auf der Liste, weil es Format wäre: eine Marke bleibt `{id, art,
farbe, breite, pts, pressure, stil?}`. Jeder Punkt oben lässt sich ohne
Migration bauen; sobald einer das Format ändern will, ist das eine eigene
Entscheidung. (E357 kam mit einer neuen ART und einem neuen Feld daran —
`bild` mit `dateiId`, wie `zettel` seinen `text` und `zeichen` seine
`zeichenId` hat. Keine Migration: ein älteres Redion zeichnet eine
unbekannte Art nicht, verliert sie aber auch nicht.)

Gefunden am 2. September 2026 (E351).


L116 — Was das Regal über seine eigene Zahl sagt
════════════════════════════════════════════════════════════════════════════

Gefunden am 3. September 2026 beim Ansehen der E365-Bilder — nicht durch
einen Prüflauf, sondern weil ein Bild nach 900 eingelesenen Dokumenten eine
zweistellige Zahl zeigte (§55).

1. ~~**„60 Dokumente" ist eine Decke, keine Zahl.**~~ ERLEDIGT in E367:
   der Kopf sagt „60 von 313 Dokumenten", solange die Decke greift, und
   ohne Decke steht die Zahl wieder allein da. Dasselbe im Regal und in
   der Liste, wo „auf diesem Gerät" über einer gedeckelten Zahl stand.
   Zwei Dinge gingen mit, die niemand gemeldet hatte: gesucht wurde nur
   in den sechzig neuesten (die Decke greift jetzt NACH der Suche), und
   sie greift weiter VOR der Umsortierung — sonst wären es beim Sortieren
   nach Namen die alphabetisch ersten sechzig statt der sechzig neuesten.
   test359, 24 Punkte. Der ursprüngliche Absatz stand so:

   Der Reiter „Kürzlich
   verwendet" schneidet seine Liste mit `.slice(0, 60)` ab
   (`src/bereiche/wissen/bibliothek.ts`, `gefiltert()`), und der Kopf
   zeigt danach die Länge der GESCHNITTENEN Liste an
   (`deckelKopf(liste.length)`). Bei 61 Dokumenten steht dort „60", bei
   900 ebenfalls „60". Wer eine grosse ZIP einliest und danach ins Regal
   sieht, bekommt eine Zahl, die aussieht wie eine Antwort auf „wie viele
   habe ich?" und keine ist.

   Das ist derselbe Fehler wie E288 („14 Lücken" bei drei Seiten) und
   E289 (ein Prozentwert ohne seine Grundlage), nur andersherum: eine
   Anzeige, die IMMER dieselbe Zahl zeigt, wird nicht gelesen — und wenn
   doch, dann falsch. §46.

   Zu tun: entweder die Zahl des ungeschnittenen Bestands nennen und die
   Decke als solche benennen („60 von 900"), oder die Decke fallen lassen.
   Ersteres ist ehrlicher und billiger; die Decke selbst hat einen Grund
   (900 Deckel zu zeichnen kostet), sie darf nur nicht schweigen.

2. **Die anderen fünf Reiter haben keine Decke** — „Alle", „Favoriten",
   „Geteilt", „Privat", „Datenbank" zeigen die volle Länge. Ihre Zahl
   stimmt also; nur bei sehr vielen Dokumenten zeichnen sie alles.

   **GEMESSEN am 3. September 2026 (E367), vor dem Bauen.** Der Reiter
   „Alle" zeichnet 60 · 213 · 513 · 913 · 2013 Deckel in 110 · 65 · 114 ·
   198 · 395 ms — linear, rund 0,19 ms je Deckel. Zweitausend Deckel
   kosten also eine gute Drittelsekunde, und das tut die App HEUTE schon,
   direkt neben dem Reiter mit der Decke.

   Daraus folgt zweierlei. Erstens: die Decke auf „Kürzlich verwendet" ist
   keine Leistungsbremse — sie ist eine Bedeutung („die letzten"), und
   deshalb durfte sie bleiben. Zweitens: eine Bremse braucht es hier
   trotzdem nicht; wer zehntausend Seiten hat, wird sie merken, aber das
   ist L22 und nicht L116. Punkt 2 ist damit beantwortet, nicht offen.



L117 — Die PDF-Umwandlung lässt sich im Prüfcontainer nicht messen
================================================================================

Beim Bau von E373 sollte der Startwert „0,35 s je PDF-Seite" nachgemessen
werden, statt ihn aus L114 Punkt 7 zu übernehmen. Der Versuch ist
gescheitert: ein gebautes Prüf-PDF mit vier Seiten kam über
`PdfEinlesen.alsSeiten` in **zwei Minuten nicht durch** — dieselbe Grenze bei
zehn und bei vierundzwanzig Seiten, also kein Zeitproblem, sondern ein
Stillstand.

Zwei Erklärungen sind offen, und beide sind unangenehm:

1. **Der kopflose Browser** kann etwas nicht, was pdf.js braucht — das wäre
   harmlos für Redur und lästig für die Prüfläufe.
2. **Das gebaute Prüf-PDF** ist für pdf.js nicht lesbar genug. Dann sagt der
   Versuch nichts über echte PDFs — aber es hiesse auch, dass ein PDF, das
   pdf.js nicht mag, den Import STEHEN LÄSST, statt mit einem Satz
   abzubrechen. Das wäre ein echter Fehler.

Was dagegen spricht, dass es der zweite Fall ist: `test177`, `test178`,
`test180`, `test181` und `test184` bauen ihre PDFs auf demselben Weg und
laufen grün. Was dafür spricht: sie legen die Datei über den Anhang-Weg ab,
nicht über `alsSeiten` mit vielen Seiten.

**Was fehlt:** eine Messung, die den Unterschied entscheidet — ein Lauf, der
`alsSeiten` mit einem Zeitlimit aufruft und sagt, WORAN er hängt. Solange
das offen ist, steht der Startwert im Kern mit dem Vermerk, woher er kommt,
und die Lernkurve ersetzt ihn nach dem ersten echten Import.

Gefunden am 3. September 2026 (E373).


L118 — test353 fällt unter Last aus, allein aber nicht
================================================================================

Im vollen Lauf voll21 (33 Stücke, 3. September 2026) war `test353` rot.
Allein auf dem neueren Stand: 39/39. Zweimal nachgefahren, beide Male grün.

Das ist die Sorte Befund, die man nicht ignorieren und nicht reparieren
kann, solange man nicht weiss, WAS unter Last anders ist. Drei Kandidaten,
und alle drei gab es hier schon einmal:

1. **Ein Port, den sich zwei Läufe teilen.** Jeder Lauf bringt seinen
   eigenen Server mit; zwei mit derselben Nummer im selben Stück wären ein
   stiller Fehler mit genau diesem Muster.
2. **Eine Zeitschranke, die auf einem ausgelasteten Rechner nicht reicht.**
   `test353` ist die Auswahl der Zeichenschicht — Lasso, Griffe, Kopieren —
   und misst nach Gesten.
3. **Ein Nachzügler aus dem vorigen Lauf im selben Stück.** Der Fall stand
   schon einmal in dieser Liste: „fünf Prüfläufe reichten ihren Rumpf als
   Zeichenkette weiter und starben etwa jedes dritte Mal an einem
   Socketfehler".

**Was fehlt:** den Lauf mehrfach IM STÜCK fahren und die Ausgabe des roten
Durchgangs aufheben — voll21 hat nur die Zusammenfassung behalten, nicht
den Prüfpunkt, der fiel. Ohne den weiss niemand, welcher der drei es ist.

Gefunden am 3. September 2026 (voll21, E374).


L119 — Was am flüssigen Stift (E376) noch offen ist
================================================================================

E376 hat den gemessenen Grund für die Zähigkeit beseitigt: der Umriss
wächst, statt bei jedem Zeigerereignis neu zu entstehen (9,2× über den
Strich, 10,1× am Ende). Drei Dinge sind damit NICHT erledigt, und sie
stehen hier, damit sie niemand für erledigt hält.

0c. **Und das Neuzeichnen auch — seit E379 zu.** `redraw()` fragte je Marke
   `JSON.stringify` (5,95 ms bei 800 Strichen, bei jedem Zurück). Seit der
   Regel aus E378 beantwortet die Identität des Objekts dieselbe Frage in
   17 µs. Damit ist in der Zeichenschicht keine Schleife mehr übrig, die
   bei einer gewöhnlichen Handlung die ganze Seite ausschreibt.

0b. **Und der Merkzettel fürs Zurück auch — seit E378 zu.** Er klonte bei
   jedem Aufsetzen des Stifts die ganze Seite; auf 800 Strichen 23,4 ms je
   Strich, zweimal (Aufsetzen und Abheben). Jetzt nimmt er die Liste flach
   und friert sie ein. Was DA noch offen ist: der Verlauf hält weiterhin
   ganze Listen, nur flache. Ein Verlauf aus Änderungsstücken spart
   SPEICHER (heute bis zu vierzig flache Listen je Blatt), nicht mehr Zeit
   — und er müsste jede Handlung anfassen. Erst messen, ob der Speicher
   irgendwo weh tut.

0. **Der Radierer hatte denselben Fehler — das ist seit E377 zu.** Er fragte
   bei jedem Teilschritt jeden Strich der Seite ganz ab; ein schneller Wisch
   über 400 Striche kostete 8,27 ms je Zeigerereignis, ein ganzes Bild bei
   120 Hz. Mit einem Kastenfilter davor sind es 1,00 ms. Bleibt als Hinweis
   stehen, weil die Stelle zeigt, wo man in dieser Schicht als Nächstes
   suchen würde: überall dort, wo eine Schleife über ALLE Marken läuft.

0d. **Nachgesehen und in Ordnung: der Weg in die Ablage.** `save()` schreibt
   NICHT je Strich in IndexedDB — `Store.updateBlock` legt den Block in eine
   Warteliste, und `flush` schreibt gebündelt nach 400 ms
   (`KONSTANTEN.SCHREIB_PAUSE_MS`). Der einzige Anteil, der sofort läuft,
   ist ein Zähler (`datenGeaendert`). Steht hier, damit niemand die Stelle
   noch einmal untersucht: sie war nie das Problem.

1. **Der letzte Rest ist die Zeichenkette selbst — 83 µs bei 600 Punkten.**
   Die Geometrie kostet nichts mehr; was bleibt, ist das Erzeugen einer
   17 kB langen `d`-Angabe je Bild. Das ist ein Prozent eines Bildes bei
   120 Hz und damit heute kein Problem — aber es wächst weiter linear mit
   dem Strich.

   Der nächste Schritt wäre, den nassen Strich in ZWEI Knoten zu teilen:
   einen langen fertigen Pfad, der selten angefasst wird, und einen kurzen
   lebenden. Verworfen wurde das in E376 aus einem konkreten Grund: beim
   Marker mit `opacity: 0.32` verdunkeln sich zwei überlappende Flächen an
   der Naht doppelt, und diese Naht steht mitten im Strich. Wer es angeht,
   braucht zuerst eine Antwort darauf.

2. **`getPredictedEvents()` ist im Prüfcontainer nicht messbar.** Chromium
   liefert die Vorhersage nur bei echter Zeigerhardware; unter Playwright
   kommt sie nie. Geprüft ist deshalb der Rückfallweg (`InkStroke.vorhersage`)
   und die VERDRAHTUNG des Browserwegs — nicht, wie gut die Vorhersage des
   Browsers auf einem echten Tablet aussieht. Das braucht Redur und ein
   Gerät mit Stift.

3. **Ob der Druck eines echten Stifts zappelt, ist unbekannt.** Der
   Median-Filter (drei Messungen) ist eingebaut, weil er nachweislich
   nichts kaputt macht — eine steigende Rampe geht unverändert durch. Ob
   er etwas AUSRICHTET, hängt daran, wie ruhig ein Apple Pencil oder ein
   Wacom-Stift wirklich misst. Im Container gibt es keinen Druck; der
   Ersatzdruck für Maus und Finger wird aus der Geschwindigkeit gerechnet
   und ist von sich aus glatt.

   Der erste Versuch war hier ein gleitendes Mittel, und der hat den
   Füller flach gemacht (`test343` rot). Das steht in E376 — und es ist
   der Grund, warum an dieser Stelle nichts mehr ohne Messung geändert
   wird.

Gefunden beim Bauen von E376 am 3. September 2026; die Punkte 0, 0b und 0c
beim Nachmessen der Nachbarwege (E377, E378, E379) am selben Tag.


L120 — Das Dokumente-Regal war flach; was nach E380 an GoodNotes noch fehlt
================================================================================

Redur hat vier GoodNotes-Fotos geschickt: die Wurzel zeigt wenige Einträge,
ein Tipp auf einen Ordner führt HINEIN, dort stehen genau seine Kinder, eine
Brotkrume führt zurück — und nach dem Entpacken einer ZIP steht man gleich
IN dem angelegten Ordner.

**Der Kern ist GESCHLOSSEN am 3. September 2026 durch E380.** Das
Dokumente-Regal (`bibliothek.ts`) hat jetzt einen Reiter „Ablage" mit
Ebenen: hineingehen, hochgehen, eine Brotkrume, ein gemerkter offener
Ordner, und `ansichtAuffrischen(wurzelId)` stellt den Bildschirm nach dem
Entpacken in den entstandenen Ordner. Belegt durch `test369` (36 Punkte,
zwei Gegenproben rot gesehen). Der Fund dabei: begehbare Ordner gab es
schon, aber im Heft-Regal (`notebook.ts`), dessen `heftArtig` PDFs und
Lernsets ausschliesst — deshalb die Ebene ins Dokumente-Regal statt das
Heft-Regal davor.

Was NICHT erledigt ist und niemand für erledigt halten soll:

a. **Zwei Regale für dieselbe Sache.** Das Dokumente-Regal
   (`bibliothek.ts`, untere Leiste → „Dokumente") und das Heft-Regal
   (`notebook.ts`, „Notizhefte") sind jetzt beide begehbar, nebeneinander.
   Der ehrlichere Weg wäre eines. Solange beide stehen, muss jede
   Regal-Änderung an zwei Stellen bedacht werden — genau die Art von
   Doppelkatalog, vor der §8 warnt. Zusammenlegen ist ein eigener Bogen
   (das Heft-Regal kann `openFach`, das Dokumente-Regal die Ebenen; keines
   kann beides), nicht nebenbei.

b. **Die untere Leiste am Telefon folgt noch nicht GoodNotes.** Sie zeigt
   Dokumente · Heute · Lernen · Termine · Mehr; GoodNotes zeigt Dokumente ·
   Favoriten · Geteilt · Marketplace. Redurs Leiste ist bewusst eine andere
   — Redion ist kein GoodNotes-Klon —, aber „Favoriten" und „Geteilt" als
   eigene Wege fehlen, und der Stern gibt es im Regal schon (E265). Ein
   Reiter „Favoriten" wäre die kleinste Annäherung.

c. **`openFach` ist modulprivat in `notebook.ts`.** Kein anderer Bereich
   erreicht die begehbare Heft-Navigation von aussen. Das war mit ein Grund,
   warum die Ebene neu ins Dokumente-Regal gebaut wurde, statt sie zu
   teilen. Wenn a) angegangen wird, gehört das mit gelöst.

Nachtrag (E381): Beim Nachsehen am Telefon (390 px) fiel auf, dass die
Brotkrume ab der dritten Ebene überlief und den AKTUELLEN Ordner abschnitt
statt der Wurzel. GESCHLOSSEN durch E381 — der Zurück-Pfeil klebt links,
die Krume scrollt ans Ende. Belegt mit test369 §8 (setzt 390 px, prüft
zuerst den Überlauf) und einem Telefonbild. E380 war am Rechner gebaut; das
ist genau der Fehler, den §37 meint: das Telefon ist der Normalfall.

Nachtrag (E384) zu b): Die untere Leiste ist im DOKUMENTMODUS jetzt ganz weg —
GoodNotes zeigt beim offenen Dokument keine Bereichsreiter, und Redion seit
E384 auch nicht mehr. Was b) meint, gilt weiter für das REGAL: dort fehlen
„Favoriten" und „Geteilt" als eigene Wege.

Nachtrag (E382): Die Ebenen waren zuerst nur in der Deckelansicht verdrahtet.
In der Listenform öffnete ein Klick auf ein Fach es als leere Seite, und der
Listenkopf hatte keine Brotkrume. GESCHLOSSEN durch E382 — die Liste ist jetzt
auch ein Ordner-Browser (test369 §9). Die Regalform bleibt absichtlich eine
Heft-Gruppierung, kein Ordner-Browser.

Gefunden beim Bauen von E380 am 3. September 2026.


L121 — Die ruhige Schale: vier von fünf Schritten stehen noch aus
================================================================================

Auftrag 01 ist gebaut (E383): das Menüband trägt keine Reiterzeile mehr,
solange es zugeklappt ist, und der Klapp-Pfeil heisst jetzt „Werkzeuge".
Gemessen: 44 → 34 anklickbare Dinge auf dem Startbild.

ZUR NUMMER: L117 bis L120 sind auf dem Zweig
`claude/redion-head2-desktop-move-j47chf` vergeben; diese Nummer weicht aus,
damit beim Zusammenführen nicht zwei Lücken dieselbe Nummer tragen.

Das war Schritt 1 von 5. Die anderen vier stehen offen, in dieser
Reihenfolge:

2. **Die 17 Ortsknöpfe in die linke Leiste.** „Heute", „Bibliothek",
   „Lernzentrum" und die übrigen stehen heute im Band unter „Gehen" — sie
   sind aber Orte, keine Werkzeuge. Sie stehen ohnehin schon in
   `register/navigation.ts` (39 Einträge), es ist also ein Umzug, keine
   Neuschöpfung.

3. **Die Stiftleiste zum Schweben bringen.** Der Schritt mit dem grössten
   Raumgewinn: rund 120 px. Auftrag 01 hat vertikal AUSDRÜCKLICH nichts
   gewonnen — die 36-px-Zeile bleibt, weil `.mb-rechts` darin steht. Wer
   Platz will, holt ihn hier.

4. **Die Heft-Leiste an den Fuss des Papiers**, wie in GoodNotes.

5. **Ein Prüflauf, der die Zahl der sichtbaren Bedienelemente je Zustand
   festhält** — damit die Leiste nicht in einem halben Jahr wieder zuwächst.
   Sie ist ja nicht aus Absicht so geworden. `test384` hält heute nur den
   einen Zustand des Menübandes; gemeint ist eine Decke über alle.

UND EIN FUND AM RANDE, der zu Schritt 5 gehört: `.mb-klapp` ist auf 32 px
Breite festgesetzt. Beim Einbau des Wortes ragten Wort und Pfeil aus dem
Knopf heraus, und der Pfeil lag ÜBER dem Suchknopf — ein Klick hätte das
Falsche getroffen. Gemessen, behoben (`width:auto`) und mit drei Punkten in
`test384` festgehalten. Wer dem Knopf später etwas hinzufügt, muss dieselbe
Messung im Kopf haben: eine feste Breite und ein wachsender Inhalt vertragen
sich nicht, und das Auge sieht es erst, wenn es sich überlappt.

Gefunden beim Bauen von Auftrag 01 am 3. September 2026.

================================================================================
L122 — Zwei Zeilen in test210 §4 waren rot; beide Male war die Prüfung falsch  [ZU]
================================================================================
3. September 2026 · gefunden beim Mitziehen von E384

`test210` §4 misst die Zeichenleiste am Telefon und meldet zwei Zeilen rot:

    ✗ Alle Werkzeuge sind gebaut (die sichtbaren) — 13   (erwartet ≥ 14)
    ✗ In der Mitte nach beiden Seiten — ist „links", soll „beides"

BELEG, DASS ES NICHT VON E384 KOMMT. In einem eigenen Arbeitsbaum auf
`da41dd78` — dem Stand VOR E384 — läuft dieselbe Suite mit **29/31 und genau
diesen zwei Zeilen**. Die Zahlen sind identisch, 13 und „links".

Warum es trotzdem erst jetzt auffiel: bis zur Reparatur der Anker in §3 klickte
sich der Lauf aus dem Dokument heraus, und §4 kam nie so weit, seine
Unter-Behauptungen zu prüfen. Der Abschnitt meldete stattdessen „Die Leiste ist
da ✗" und verdeckte damit die zwei echten Zeilen darunter. Ein Fehler, der
einen anderen versteckt — genau die Sorte, die §55.2 meint.

**GESCHLOSSEN am 3. September 2026, noch am selben Tag.** Nachgemessen statt
geraten — beide Male war die PRÜFUNG falsch und die Leiste richtig.

1 · DREIZEHN SIND VOLLSTÄNDIG. Ausgezählt, was mit dem Stift „Schreiben"
   wirklich dasteht, jeder Knopf 44 px breit und keiner abgeschnitten:

     Schreiben · Auswahl · Stift · Marker · Form · Abdecken · Haftnotiz ·
     Text · Fachzeichen · Bild · Radieren · Zurück · Vor

   Von 38 gebauten Knöpfen sind 13 sichtbar. Die Schranke „≥ 14" stammt aus
   der Zeit vor **E375**, das Linie, Pfeil, Rechteck und Ellipse zu EINEM
   „Form" zusammengezogen hat; die vier sind seither Zubehör dieses Werkzeugs
   und nach E356 ausgeblendet, solange ein anderes gewählt ist. Eine Schranke,
   die eine bewusste Vereinfachung als Verlust meldet, misst die Vergangenheit.
   Jetzt `gleich(…, 13)` statt `>= 14` — genau, nicht mindestens.

2 · DIE MITTE WAR FALSCH GERECHNET. Die Prüfung setzte
   `scrollLeft = scrollWidth / 2`. Gemessen am Telefon: die Leiste ist 368 px
   breit und hat 636 px Inhalt. `scrollWidth / 2` ist 318 — der grösste
   mögliche `scrollLeft` aber `636 − 368 = 268`. Der Browser klemmt auf 268 ab,
   und das ist das ENDE. Die Anzeige sagte deshalb völlig richtig „links", und
   die Prüfung nannte das falsch. Die Mitte des ROLLWEGS ist
   `(scrollWidth − clientWidth) / 2`.

WARUM ES ERST JETZT AUFFIEL: bis zur Anker-Reparatur in §3 (E384) klickte sich
der Lauf aus dem Dokument heraus, und §4 kam nie so weit, seine
Unter-Behauptungen zu prüfen. Es meldete stattdessen „Die Leiste ist da ✗" und
verdeckte damit die zwei echten Zeilen darunter. Ein Fehler, der einen anderen
versteckt.

BELEG: `test210` 31/31. Beide Wächter durch Mutation rot gesehen (§55.2) — ein
Werkzeug aus der Leiste genommen → „ist 12, soll 13"; den Rollstand-Melder
abgeschaltet → alle drei Rollpunkte „(nichts)". Die Mitte-Rechnung ist durch
den Befund selbst belegt: mit `scrollWidth / 2` steht dort „links".

================================================================================
L123 — Der UX-Prüfbericht vom 3. September: was davon noch offen ist
================================================================================
3. September 2026

Redur hat einen Prüfbericht geschickt: „Redion Web-App · Vollständiger UX-,
Funktions- und Responsive-Audit", geprüft gegen `redion.redurbabat7.workers.dev`
(also `main` auf E353). 18 Befunde, Gesamturteil 6,9/10.

**Der Sofort-Block ist ZU** — F04, F05, F06, F07, F15 und F16 durch E386,
belegt mit `test386` (38 Punkte, sieben Mutationen rot gesehen).

Was noch aussteht, in der Reihenfolge des Berichts:

NÄCHSTER SPRINT (F01 ✓, F02 ✓, F03 halb, F08 ✓, F11 ✓, F13 halb, F14 halb)

a. **F01 · NACHGEMESSEN, der Befund stimmt so nicht** (E388). Der Bericht
   sagt, der Inhalt sei nach dem Klick auf der Übersicht geblieben. Am
   3. September gemessen: er wechselt. `schauplatz` geht von `bibliothek`
   auf `heute`, die Adresse auf `#welt-lernen-heute`, der Text im
   Arbeitsraum von 1060 auf 2739 Zeichen. Was der Bericht sah, war E353.

   Der ECHTE Befund an dieser Stelle war ein anderer und stand nicht im
   Bericht: am Rechner gab es die fünf Knöpfe gar nicht. `#sidebar` ist
   seit E272 Phase F `display:none`, und die Kante trug zehn Knöpfe, von
   denen keiner ein Ort war. Behoben mit E388.

b. **F02 · P1 · ZU (E388 + E391).** Die Orte stehen oben in der linken
   Leiste, „Mehr Orte" öffnet den Rest, der Ort, an dem man steht, ist
   markiert — und seit E391 hat „Gehen" das Band verlassen. Das Menüband
   trägt nur noch dokumentbezogene Werkzeuge. Am Telefon trug die untere
   Leiste die fünf Pillen schon vorher.

   OFFEN BLEIBT EIN STÜCK:

   1. **Zwei verschiedene Fünfergruppen.** Gemessen: die linke Leiste und
      `index.html` sagen „Heute · Lernzentrum · Elektrotechnik ·
      Bibliothek · Aufgaben", die untere Telefonleiste sagt „Dokumente ·
      Heute · Lernen · Termine · Mehr". Seit E388 steht die eine Gruppe im
      Register (`haupt: true`); die Telefonleiste liest sie noch nicht.

      WELCHE FÜNF ES SEIN SOLLEN, IST REDURS ENTSCHEIDUNG. Am Telefon ist
      ein Platz für „Mehr" nötig, es bleiben also vier für Orte — und die
      untere Leiste trägt heute „Termine", das keiner der fünf Hauptwege
      ist, während „Elektrotechnik" und „Aufgaben" dort fehlen.

   2. **Der Ortskatalog — ZU, aber anders als gedacht (E393).** Die
      Dublette ist weg: „Zeitmesser" stand zweimal (`w-zeit` und
      `zeitmesser`), beide riefen `Zeitmesser.panel()`. Es bleibt der mit
      dem brauchbaren Hinweis; `test390 §3` hält es fest, und zwar auf
      DOPPELTE NAMEN, nicht auf diesen einen.

      Die andere Hälfte — „Orte und Handlungen mischen sich" — hat die
      Messung nicht bestätigt, sondern etwas Grösseres gefunden. Siehe
      **L126**.

c. **F03 · P1 · GANZ ZU (E387 + E398).** „Nur die aktive Seite zeigt
   Werkzeuge" ist gebaut und gemessen: von drei gebauten Leisten ist genau
   eine sichtbar, und genau eine Bühne trägt `data-aktiv`. Der DOM-Teil war
   schon durch E299 zu (ungesehene Seiten werden nicht gezeichnet).

   DIE ZWEITE HÄLFTE hat Redur am 4. September entschieden. Gefragt wurde
   zweiteilig — willst du die Wahl, und soll Einzelseite am Telefon die
   Vorgabe werden. Seine Antwort: „ja". Das Erste ist damit bestellt; für
   das Zweite gilt die Lesart, die seine eigene Ansage aus E299 nicht
   zurücknimmt („ganz öffnen komplett wie one note"):

       Die Wahl kommt. Die Vorgabe bleibt Fortlaufend, auch am Telefon.

   Gebaut als Schalter im Inspector, gemerkt je Dokument als Meta. `test395`
   hält beides — dass es die Wahl gibt und dass sie die Vorgabe NICHT
   angefasst hat. §1 ist der Wächter für E299 und wurde mit `einzeln: true`
   fünffach rot gesehen.

   NEBENBEI GEFUNDEN, EIGENER EINTRAG: **L127**.

d. **F08 · ZU (E394).** Gemessen auf 1360 × 900 mit einem A4-Blatt: das
   Feld blieb im Dokumentmodus stehen, 380 px breit, und liess dem Blatt
   980 von 1360 — 28 % für etwas, das man gerade nicht braucht. E384 hatte
   den Modus damit begründet, dass „die ganze Schale wegfällt"; das KI-Feld
   fehlte in der Liste. Jetzt klappt es beim Eintreten zu und beim
   Verlassen wieder auf — und lässt sich im Dokument von Hand öffnen, denn
   „fasse diese Seite zusammen" ist dort die naheliegende Frage.

   DIE ZWEITE HÄLFTE WAR SCHON DA: „am Telefon als Bottom Sheet" ist seit
   Längerem erfüllt. Nachgemessen bei 390 × 844: `position:fixed`, unten
   verankert, 20 px runde Ecken oben, Beginn 102 px unter den Kopfleisten.
   `test391 §5` hält es fest, damit die Forderung nicht ein zweites Mal
   als offen gilt.

e. **F11 · ZU (E392) — aber nicht so, wie der Bericht es meinte.** Die
   Behauptung „19 Kategorien auf einer Ebene" hat die Messung nicht
   überlebt: es gibt seit Langem VIER Gruppen — vier Einträge ohne
   Überschrift oben, dann „Funktionen" (7), „Verwaltung" (5) und „Zugriff
   und Abrechnung" (3). Die Überschriften stehen sichtbar da, am Rechner
   wie am Telefon. Sechs Obergruppen zu erfinden hätte eine Ordnung
   ersetzt, die es schon gibt.

   DER WIRKLICHE FEHLER stand daneben und war schwerer:

   | | Liste braucht | sichtbar | verdeckt |
   |---|---|---|---|
   | 1360 × 900 | 810 px | 718 px | 92 px |
   | 1280 × 720 | 810 px | 632 px | 178 px |
   | 1280 × 650 | 810 px | 570 px | 240 px |

   Verdeckt lagen IMMER dieselben drei: Speicher, Abrechnung, Über diese
   App. Nicht auf kleinen Bildschirmen — auf allen, denn `.einst-fenster`
   war auf `min(720px, 88vh)` gedeckelt und wuchs mit keinem Schirm mit.
   Dazu hing das Fenster an `.overlay` 14vh unter dem oberen Rand: bei
   1280×720 lag seine Unterkante 43 px ausserhalb des Bildes.

   Behoben mit E392: Fenster mittig und `min(920px, 92vh)`, Zeilen ein
   Pixel dichter, und für kleine Schirme ein Streifen, der sagt, dass es
   weitergeht — und wieder verschwindet, sobald man unten ist. `test389`,
   19 Punkte, fünf Mutationen rot gesehen.

f. **F13 · ZUR HÄLFTE ZU (E395).** Das Abnahmetor über die vier Grössen
   des Berichts gibt es: `test392`, 23 Punkte. Und es hat beim ersten Lauf
   einen echten Fehler gefunden.

   DIE DREI HOCHFORMATE waren sauber — nichts rollt waagerecht, die fünf
   Wege der unteren Leiste messen 48 px (§37 verlangt 44). DAS QUERFORMAT
   nicht: bei 844 × 390 ist die Kontextkante 353 px hoch, ihr Inhalt
   braucht 424, und `overflow` steht auf `hidden`. Acht Knöpfe lagen
   ausserhalb — darunter Suchen, Neu und Einstellungen —, und die untere
   Telefonleiste greift dort nicht, weil sie bei 760 px Breite endet. Auf
   einem quer gehaltenen Telefon führte kein Weg zu „Neu".

   Behoben mit E395: die Kante faltet sich gruppenweise, und `.k-unten`
   gibt nichts ab.

   OFFEN BLEIBT der echte Safari- und Chrome-Lauf auf Redurs Geräten. Das
   Tor prüft Masse und Erreichbarkeit, nicht Gesten, Tastatur, Zurück-Wisch
   oder die Eigenheiten von iOS-Safari.

g. **F14 · ZUR HÄLFTE ZU (E396) — der Rest ist Redurs Entscheidung.**
   Gemessen bei 390 × 844 im Dokumentmodus: dreizehn Werkzeuge, alle 44 px
   hoch (§37 stimmt), Leiste 368 px breit, Inhalt 636 px.

   | | |
   |---|---|
   | im Bild ohne Wischen | Schreiben · Auswahl · Stift · Marker · Form · Abdecken · Haftnotiz |
   | erst nach dem Wischen | Text · Fachzeichen · Bild · Radieren · Rückgängig · Wiederholen |

   ZWEI DAVON SIND KEINE WERKZEUGE: „Rückgängig" und „Wiederholen" ändern
   nicht, was der Finger tut. Am Rechner stehen sie seit E359 in einer
   eigenen Zeile; am Telefon kleben sie jetzt am rechten Rand (E396,
   `test393`).

   OFFEN BLEIBT DIE REIHENFOLGE. „Radieren" steht an elfter Stelle und
   damit hinter einem Wisch — beim Schreiben von Hand ist es das dritte
   Werkzeug, nicht das elfte. Der Bericht will „vier Primärwerkzeuge plus
   Mehr". Beides hiesse, die Reihenfolge der Zeichenwerkzeuge neu zu
   setzen, und die gehört Redur: er hat sie in E352, E355, E359 und E375
   selbst gebaut. **Frage an ihn:** welche vier Werkzeuge sollen ohne
   Wischen dastehen?

POLITUR (F09, F10, F12, F17, F18)

h. **F09** Befehlsmenü mit Suche, zuletzt verwendet, Favoriten.
i. **F10 · ZU (E397) — den Typ gab es schon, er öffnete nur nicht.** „Blatt"
   steht seit E100 unter „Zeichnen". Gemessen: der Weg legte eine Seite mit
   den Blöcken `["text", "blatt"]` an und liess `dokumentModus` auf `false`
   — man landete im Texteditor, mit einem leeren Absatz oben und dem Blatt
   als Kasten darunter, und musste „Dokumentmodus" erst selbst finden. Die
   Notizhefte setzen die Flagge längst beim Anlegen; dieser Weg nicht.

   Jetzt liegt das Blatt gleich zum Schreiben da, und die Unterzeile sagt
   den Zweck statt nur das Papier. DER NAME BLEIBT „BLATT": so heisst die
   Blockart, die Werkzeugleiste und alles, was E100, E359 und E375 gebaut
   haben. Ein zweiter Name für dieselbe Sache steht dann in der Suche, im
   Slash-Menü und im Papierkorb nicht (§8). `test394`, 16 Punkte.
j. **F12** Datenschutztexte nach Modus formulieren statt pauschal.
k. **F17** Progressive Offenlegung im Onboarding.
l. **F18** Visuelle Hierarchie — ein dominantes Arbeitsziel je Ansicht.
   E384 hat davon ein Stück vorweggenommen: im Dokumentmodus fällt die
   ganze Schale weg.

WAS DER BERICHT NICHT WISSEN KONNTE: er prüfte E353. Seither sind E354–E387
dazugekommen, darunter E384 (das Dokument ist der ganze Bildschirm) und
E296/E299 am PDF. Vor jedem dieser Punkte gehört deshalb eine Messung gegen
den HEUTIGEN Stand, nicht gegen den Bericht.


================================================================================
L124 — Der Start holt 2081 KB, und daran ändert keine Ladeart etwas
================================================================================
4. September 2026 · gefunden beim Bauen von E389

E389 hat den Start von 2607 auf 2081 KB (gzip) gebracht und ungedrosselt von
5051 auf 556 ms. Gedrosselt bleiben 12,4 Sekunden bis DOMContentLoaded, und
der Grund ist einfach: auf „Slow 4G" sind 2081 KB rund zehn Sekunden reine
Übertragung. Es müssten WENIGER BYTES werden; wie sie geladen werden, ist
ausgereizt.

GEMESSEN, 184 Skripte, die zehn grössten:

    122 KB  bereiche/datenbanken/steuerung.js
     96 KB  schale/stil/bausteine.css
     64 KB  schale/aufbau/schale.js
     61 KB  bereiche/hilfe/wissensseiten.js
     48 KB  kern/ablage/indexdb.js
     48 KB  register/elektroformeln.js
     47 KB  bereiche/editor/ansicht/editor.js
     46 KB  bereiche/wissen/lernwelt.js
     43 KB  bereiche/wissen/werkzeuge.js
     40 KB  bereiche/dateien/ausgeben.js

Danach ein langer Schwanz. Es gibt also keine zweite fette Datei, die man
wie pdf.js herausnehmen könnte — 1848 KB verteilen sich auf 184 Stücke.

DER NÄCHSTE HEBEL WÄRE, GANZE BEREICHE ERST BEIM BETRETEN ZU LADEN. Wer
nie das Elektro-Formelheft öffnet, braucht seine 48 KB nicht; wer nie eine
Datenbank anlegt, die 122 KB der Steuerung nicht. `Register.module` weiss
schon, welcher Bereich welcher ist — die Kenntnis ist also da.

WARUM DAS NICHT EINFACH GEBAUT WIRD: es rührt an §5 (Bereiche kennen
einander nicht — aber sie kennen einander AUCH NICHT, wenn sie noch gar
nicht geladen sind) und an §7 (`start.js` ist der einzige Einstiegspunkt).
Jeder Aufruf über einen globalen Namen — und davon lebt diese App, siehe
`test87 §8` — müsste vorher wissen, ob sein Modul schon da ist. Das ist
kein Bogen, das ist ein Umbau, und er gehört Redur.

Ein billigerer Zwischenschritt, der nichts an der Architektur rührt: den
Dienstarbeiter den Grundstock im HINTERGRUND holen lassen statt im ersten
Zug. Beim zweiten Besuch kommt ohnehin alles aus dem Zwischenspeicher —
gemessen ist bisher nur der kalte erste Besuch, und den misst auch
PageSpeed.


================================================================================
L125 — ~~Der Rundgang zeigt auf einen Reiter, den man nicht sieht~~ — GESCHLOSSEN am 4. September 2026 (E390)
================================================================================
4. September 2026 · gefunden beim Bauen von E389

**GESCHLOSSEN durch E390, und es war mehr als der eine Schritt.** Gemessen
zeigten im Grundzustand FÜNF der neun Schritte am Rechner auf nichts und
ACHT am Telefon. Jedes Ziel trägt jetzt mehrere Kandidaten; genommen wird
der erste, den man wirklich sieht. Danach: null von neun blind, an beiden
Grössen. `test61` läuft die Führung jetzt wirklich durch statt nur den
ersten Schritt zu messen (39 Punkte statt 36, vier Mutationen rot).

`test61` ist rot, zwei Punkte: „Das Loch liegt auf dem Ziel" und „Und ist
sichtbar". NACHGEMESSEN IN EINEM ARBEITSBAUM auf dem Stand davor — dort
ebenfalls rot. Es ist also kein Nachlauf der Leistungsarbeit.

Der Grund ist E383: der erste Schritt der Führung zeigt auf
`[data-mb-reiter="gehen"]`, und im ruhigen Band steht dieser Reiter gar
nicht da. `stellen()` versteckt das Loch, wenn das Ziel fehlt — genau die
stille Sorte Fehler, die `rundgang.ts` in seinem eigenen Kopf beschreibt:
„neun Schritte ohne Loch sehen aus wie eine Führung, zeigen aber auf
nichts."

ZU TUN: der erste Schritt gehört auf die Orte in der linken Leiste (E388) —
die stehen immer da. Am Telefon auf die untere Fünferleiste. Und `test61`
zieht den Anker mit, wie sein eigener Kommentar es verlangt.


================================================================================
L126 — Sechsundzwanzig von 45 Zielen sind das Suchfenster
================================================================================
4. September 2026 · gefunden beim Nachmessen von L123 F02 Punkt 2

Der UX-Bericht sagt, der Ortskatalog „mische Orte und Handlungen", und nennt
fünf: Neue Seite, Suchen, Befehle, App installieren, Passwort. Um das nicht
nach Gefühl zu entscheiden, wurde jeder der 45 Einträge aus
`Register.menueband.orte()` wirklich angeklickt und gemessen, was danach
anders ist.

DREI DURCHGÄNGE, UND DIE ERSTEN ZWEI WAREN FALSCH — das gehört mit
aufgeschrieben, weil beide Male die Messung plausibel aussah:

  1. „Legt sich ein Fenster darüber?" Damit wurden Kalender, Tagesplan und
     Datenbanken zu Handlungen. Sie sind Fenster und trotzdem Orte.
  2. „Wie gross ist das Neue?" Aber `.overlay` ist der verdunkelnde GRUND
     (`position:fixed; inset:0`) und deshalb immer so gross wie der
     Bildschirm. Sechsundzwanzig Einträge kamen auf glatte 100 %.
  3. Erst das FENSTER im Grund gemessen — `.overlay > *` — ergab Zahlen,
     die etwas bedeuten.

DAS ERGEBNIS:

    12   ändern den Schauplatz oder die Adresse — echte Orte
    26   öffnen ein `.finder`, zwischen 10 % und 58 % des Bildschirms
     3   öffnen ein Panel (Zeitmesser 280×226, KI 380×900)
     4   Randfälle (Dateiwahl, neue Seite)

`.finder` ist die Bauform der SCHNELLSUCHE. Kalender, Tagesplan,
Wochenrückblick, Zurückgestellt, Datenbanken, Datenmodell, Kennzahlen,
Agenten, Besprechungen, Marktplatz, Erweiterungen, Papierkorb, Was Redion
kann, Erste Hilfe, Tastenkürzel, Aussehen, Tempo, Passwort, App installieren,
Schnellnotizen, Vorlagen, Dateien, Wissen, Verbinden, Was hereinkommt und die
Suche selbst — alle sechsundzwanzig sind dasselbe Popup mit anderem Inhalt.

**DAS IST DER GRUND, WARUM DIE LADE SICH WIE EIN HAUFEN LIEST**, und es ist
kein Namensproblem. Die Trennung „Ort gegen Handlung" ist heute nicht
ziehbar, weil mehr als die Hälfte der Ziele als Suchfenster gebaut ist. Eine
Gruppe „Handlungen" darüberzulegen wäre ein Etikett auf einem Aufbau gewesen;
die nächste Messung hätte es wieder abgezogen. Deshalb steht es hier statt in
E393.

WAS DAS KOSTET, ehrlich beziffert: `.einst-fenster` (68 %) und die zwei
Marktplatz-Fenster (58 %) sind bereits so gross, dass sie Vollbild sein
wollen. Am Telefon werden ohnehin alle zu Vollbild — dort fällt es nicht auf.
Am Rechner steht die Bibliothek eines Menschen in einem 720 × 224 Pixel
grossen Kasten.

ZU TUN, wenn Redur es will — und es ist ein eigener Bogen, kein Nachlauf:
entscheiden, welche der 26 ein Schauplatz werden (Kalender, Tagesplan,
Datenbanken, Marktplatz sind die Kandidaten) und welche ein Fenster bleiben
(Suchen, Befehle, Passwort, App installieren). Danach kann `App.schauplatz()`
sie unterscheiden, und danach — erst danach — bekommt die Lade eine
Gliederung, die etwas behauptet, das auch stimmt.

BELEG: die drei Messläufe, zuletzt am 4. September; die Zahlen oben stammen
aus dem dritten.


================================================================================
L127 — Der Rollbalken zeigte ein Viertel des Wegs an (GESCHLOSSEN, E399)
================================================================================

GEFUNDEN BEIM MESSEN FÜR E398, nicht gesucht — und deshalb steht die Lücke
hier, obwohl sie im selben Zug zu war: wer später sucht, warum `passen()`
Platzhalter setzt, soll finden, wofür.

Im Dokumentmodus bekommt jede noch ungezeichnete Seite einen Platzhalter in
der Höhe, die sie später haben wird. E299 schrieb dazu wörtlich: „sonst
springt der Rollbalken, sobald sie gezeichnet ist." Gemessen an sechs
A4-Seiten auf 1360 × 900 tat er genau das:

    beim Öffnen    Rolle 3513   Höhen [1922, 283, 283, 283, 283, 283]
    nach 3000 px   Rolle 6620   Höhen [1837, 1922, 1837, 283, 283, 283]

Der Platzhalter war 283 px hoch, die Seite wird 1922. Bei achtzig Seiten —
der Zahl, mit der E299 ausdrücklich rechnet — zeigte der Balken von Anfang an
ein Viertel des Wegs an, und ein Griff daran landete jedes Mal woanders, als
er aussah.

URSACHE: `center.clientWidth` ist NULL, wenn die Bühnen gebaut werden; der
Kasten hängt zu dem Zeitpunkt noch nicht im DOM. Die Rechnung war nie falsch,
sie lief nur zu früh.

GESCHLOSSEN mit E399: sie steht jetzt in `passen()` und folgt damit auch dem
Zoom und der Fensterbreite mit, was sie vorher nicht tat. Gemessen 11 283 px
beim Öffnen und 11 283 px nach dem Rollen. `test395 §7` hält es fest, mit
`platzhalterSetzen(200)` rot gesehen.


================================================================================
L128 — Was die F09-Messung sonst noch fand (sieben offene Punkte)
================================================================================
4. September 2026 · gefunden beim Messen für E400

F09 des Prüfberichts lautet: „Befehlsmenü mit Suche, zuletzt verwendet,
Favoriten". Gemessen ist die erste Hälfte längst gebaut (E400 nennt die
Belege). Zwei Funde daraus waren so schwer, dass sie sofort behoben wurden.
Diese sieben bleiben offen — jeder mit Beleg, jeder ein eigener Bogen.

1. **GESCHLOSSEN (E401) · „Zuletzt verwendet" gibt es für Befehle nicht.** Es gibt nur
   `paletteOft` (`werkzeuge.ts:305-310`), einen reinen Zähler: `m[name] =
   (m[name]||0)+1`. Kein Zeitstempel, keine Reihenfolge. Die SUCHE hat das
   Gegenstück längst — `suchverlauf` mit der Überschrift „Zuletzt gesucht"
   (`schale.ts:1064/1082`) —, die Palette nicht. Das ist die eine Hälfte
   von F09, die wirklich fehlt.

2. **HALB GESCHLOSSEN (E401) · Favoriten für Befehle gibt es nicht.**
   `paletteFest` ist gebaut — Stern in der Zeile, Strg+Enter, Gruppe ganz
   oben. OFFEN bleibt das GEMEINSAME Register: es sind jetzt sechs
   Favoriten-Speicher, die einander nicht kennen. Der sechste ist Absicht
   (ein Befehl ist keine Seite), macht die Frage aber nicht kleiner.
   Ursprünglicher Befund: Fünf Favoriten-Sorten stehen im
   Haus (Seiten, Chats, Zeichenwerkzeuge, Seitenleisten-Abschnitte,
   Regal-Sterne) — keine für Befehle oder Orte, und kein gemeinsames
   Register dafür (§8: fünf Speicher, die einander nicht kennen). Das ist
   die zweite fehlende Hälfte von F09.

3. **GESCHLOSSEN (E402) · Ein toter Favoriten-Block.** Der Bildschirm fragt
   jetzt `Store.favorites()` statt eines eigenen Filters — ein Katalog, nicht
   zwei (§8). `test398`, Mutation rot gesehen. Ursprünglicher Befund: `ansichten/dienst.ts:491` filtert
   `alle.filter(b => b.fav)` — das Feld heisst `favorite`. Der Bildschirm
   „Seiten" ist erreichbar, die Liste bleibt immer leer, und weil `block()`
   leere Abschnitte ganz weglässt (`:510-511`), sieht man nicht einmal, dass
   etwas fehlt. Auch im gebauten Stand. Kein Prüflauf fasst ihn an.

4. **HALB GESCHLOSSEN (E401) · `paletteOft` wächst unbegrenzt und misst das
   Falsche.** Der Deckel steht bei 50, und Seitentitel landen nicht mehr
   darin. OFFEN bleibt, dass nur gezählt wird, was AUS DER PALETTE
   ausgeführt wird — wer ein Tastenkürzel benutzt, zählt nicht mit.
   Ursprünglicher Befund: Kein Deckel,
   kein Vergessen, kein Zurücksetzen — als einziger Verlauf im Haus (die
   anderen deckeln bei 8 / 12 / 60 / 100 / 2000). Ein umbenannter Befehl
   lässt seinen alten Namen für immer stehen. Seitentitel landen ungefiltert
   darin (`werkzeuge.ts:371-377` → `355`). Und gezählt wird nur, was AUS DER
   PALETTE ausgeführt wird — wer dasselbe per Tastenkürzel auslöst, zählt
   nicht mit. Das Objekt wandert über `indexdb.ts:1846-1857` in jede `.json`
   und `.redion`.

5. **Vier von acht Ausgängen des Befehlsregisters haben null Aufrufer.**
   `gruppen()`, `anzahl()`, `lieferanten()` und `nimmZurueck()` werden im
   ganzen Projekt nirgends gerufen, auch von keinem Prüflauf. Und ein Befehl
   hat keine stabile Kennung: `nimmZurueck()` findet über den `titel`, zwei
   gleichnamige Befehle sind nicht unterscheidbar.

6. **`kuerzel` in `register/navigation.ts` hat null Verbraucher.** Die
   Kürzel, die man in der Seitenleiste sieht, stehen von Hand in
   `index.html`. Genau dadurch konnte das falsche „Strg ⇧ P" unbemerkt
   bleiben (E400): die richtige Stelle (`register/tasten.ts:29`) und die
   sichtbare Stelle waren nicht verbunden. E400 hat die Zeichenkette
   berichtigt und einen Wächter gebaut, der die Taste DRÜCKT — die
   Verdrahtung fehlt weiter.

7. **`Aussehen.KUERZEL` zeigt zwei Vorgaben an, die nicht gelten.**
   `aussehen.ts:145` führt `['palette','Befehle','Ctrl+P']`; ausgeführt wird
   der Standard nie, weil `schale.ts:2882` nur über tatsächlich umbelegte
   Kürzel läuft. Wer im Einstellungsdialog nachsieht, liest ein Kürzel, das
   die Palette nicht öffnet — und das echte Strg ⇧ K steht dort gar nicht.
   Dasselbe gilt für `favorit`.

WIE ES GEFUNDEN WURDE: fünf Leser über Palette, Register, Suche, Verlauf und
Favoriten, dazu fünf Gegenprüfer mit dem Auftrag zu WIDERLEGEN. Die
Gegenprüfung war das Geld wert — sie hat unter anderem eine Zahl korrigiert
(111 statt 163 Paletteneinträge), einen toten Block gefunden (Punkt 3) und
eine naheliegende Vermutung ausdrücklich ENTKRÄFTET: die Palette hat sehr
wohl `role="dialog"` und `aria-modal`, weil der gemeinsame Overlay-Griff aus
E302 sie mitnimmt. Dort ist nichts nachzubauen.


================================================================================
L129 — Die Denkkugel hängt bisher an EINER Stelle
================================================================================
4. September 2026 · gefunden beim Bauen von E403

`Orb.setzen(element, zustand, groesse)` steht global bereit und ist geprüft
(`test399`, 22 Punkte). Benutzt wird sie bisher nur im Agentenfenster. Die
folgenden Stellen sind beim Messen aufgefallen und ABSICHTLICH nicht
mitgebaut worden — jede braucht ihre eigene Entscheidung, welcher Zustand
dort ehrlich wäre:

1. `steuerung.ts:1255` schreibt „… denkt nach" als ZELLWERT in eine
   KI-Spalte. Das ist Text in den DATEN, nicht in der Oberfläche. Die
   20-px-Kugel gehört dorthin, aber die Zelle müsste vorher lernen, einen
   Zustand statt eines Textes zu halten — sonst steht am Ende ein Bild im
   Export.

2. `arb-dreh` (`bausteine.css:6083`) und `hs-dreh` (`werkzeuge.css:514`)
   sind zwei Dreh-Rädchen. Beide sagen „es passiert etwas" und sonst nichts.
   Wer sie ersetzt, muss zuerst wissen, WAS an der Stelle passiert.

3. Der WebLLM-Modell-Download und die OCR zeigen einen Balken. Ein Balken
   ist dort BESSER als eine Kugel: er sagt, wie weit es ist. Hier
   ausdrücklich NICHT ändern — das steht hier, damit es niemand für
   vergessen hält.

Und zwei der neun Zustände haben in Redion noch gar keinen Ort:
`listening` gehört zur Spracheingabe, die es nicht gibt; `weaving` zum
Wissensgraphen, der heute ohne Warteanzeige auskommt. Sie sind trotzdem
gebaut und geprüft — eine Betriebsart wegzulassen und später nachzureichen
hätte bedeutet, den Vergleichspunkt aus `test399 §4` neu zu eichen.

---

L130 — Was der Ansichten-Durchgang sonst noch fand
==================================================

E409 hat die Breite und den Fortschrittsbalken geholt. Beim Hinsehen auf die
dreizehn Bilder blieben vier Dinge übrig, jedes für sich klein, aber jedes
kostet den Nutzer eine Auskunft.

1. **Die Werte auf einer Board-Karte sind nicht zuzuordnen.** GESCHLOSSEN
   mit E411. Angeschrieben wird, was seinen Namen braucht — nackte Zahlen,
   Daten, Zeitspannen, das leere Kontrollkästchen, und jeder Typ, der auf
   derselben Karte mehrfach vorkommt. Etiketten, Sterne und Ortsmarken
   bleiben ohne, weil eine Beschriftung an jedem Wert wieder niemand liest.
   Gehalten von `test406`.

2. **Der Kalender zeigt keine Zeitspannen.** GESCHLOSSEN mit E410. Der
   Balken war gebaut und sprang nie an: `endeKey` war das einzige Feld der
   Kalenderansicht ohne Vorgabewert. Er wird jetzt erkannt, wenn die Daten
   es belegen, und die Oberfläche sagt, dass geraten wurde. Nebenbei kamen
   zwei Fehler heraus, die seit jeher dastanden: die Balken hatten gar keine
   Farbe (`.cw-bar.q-blue` gab es nirgends), und sie lagen auf den
   Tageszahlen. Beide fand erst ein Bild. Gehalten von `test405`.

3. **Kein Hinweis, dass rechts noch etwas kommt.** GESCHLOSSEN — und zwar
   war es das schon, als dieser Punkt geschrieben wurde. Nachgemessen bei
   1280 px Fenster: `.db-rollbox` trägt `data-rand="rechts"`, und die weiche
   Kante aus `tabelle.css` greift mit einer echten Maske. `Rollrand.binde`
   (E63) setzt das seit jeher; niemand hatte die Zeile hier nachgezogen.
   Was WIRKLICH fehlte, war der Wächter: `test136` hielt die Kante nur am
   TELEFON, über den Schalter „Tabelle statt Karten". Genau der Fall, über
   den dieser Punkt klagte — die Tabelle am Rechner —, war ungeprüft.
   `test404 §10` hält ihn jetzt, samt der Gegenrichtung: ganz rechts
   angekommen zeigt die Kante nur noch nach links.
   Der Lehrsatz daraus steht in E420: eine Lücke, die niemand nachmisst,
   bleibt in der Liste, auch wenn sie zu ist — und eine geschlossene Lücke
   ohne Wächter geht wieder auf, ohne dass es jemand merkt.

4. **Eine Zahlenspalte kann keine Einheit tragen.** GESCHLOSSEN mit E412.
   `einheit` steht im Menü der Spalte, hängt beim Zeichnen mit schmalem
   Leerzeichen an und fasst den gespeicherten Wert nicht an — Formeln,
   Summen und Sortierung rechnen weiter mit der Zahl. Gehalten von
   `test407`. Dabei kam heraus, dass `Column.formel` in Wahrheit `formula`
   heisst und dem Typ dreizehn Felder fehlten; `test294 §5` misst diese
   Richtung jetzt mit.

5. **Der Zeitstrahl nutzt seine Fläche nicht.** GESCHLOSSEN mit E419.
   Nachgemessen waren es 325 px gezeichnete Fläche in einem Behälter von
   1130 — schlimmer als hier stand. `px` wird nach dem Einhängen gestreckt,
   wenn Platz übrig ist, und nur dann; ein langer Zeitraum rollt weiter.
   Die Sorge, das hiesse „alles auf Anteile umstellen", war unbegründet:
   Marken, Balken und Pfeile werden ohnehin ALLE aus `px` gerechnet, es
   genügte, `px` zu ändern und einmal neu zu zeichnen.
   Der Nebenschaden war der grössere: die Mindestbreite von 22 px zog jede
   Spanne unter fünf Tagen auf dieselbe Breite — gemessen waren ein Tag,
   zwei Tage und drei Tage alle genau 22 px breit. Jetzt 22, 35 und 52.
   Gehalten von `test413`.

6. **Die Zeitachse hat keine Marke am Anfang.** GESCHLOSSEN mit E419. Und
   die Ursache war eine andere als vermutet: die Marke FEHLTE nicht, sie
   stand links ausserhalb. `lauf.setDate(1)` springt auf den Monatsersten,
   und der liegt vor `minD` — gemessen x = −45, nach dem Strecken −156. Nur
   die Beschriftung wird jetzt auf 0 geklemmt, nicht die Gitterlinie: ein
   Strich bei 0 behauptete, hier beginne ein Monat.
   Gehalten von `test413 §3`.

Nachzusehen mit `node bilder.mts db-board`, `db-calendar`, `db-table`,
`db-timeline`.


L131 — Was der Telefon-Durchgang offen gelassen hat
====================================================

Am 5. September 2026 sind alle dreizehn Ansichtsarten am Rechner und die
wichtigsten am Telefon angesehen worden (E419–E427). Vier Dinge sind dabei
aufgefallen und NICHT repariert worden — jedes aus einem eigenen Grund, und
der Grund steht dabei, damit niemand die Arbeit doppelt macht.

Punkt 1 ist am 6. September geschlossen — er war keiner. Drei bleiben.

1. **Die Namensspalte des Side Peek am Telefon** — **GESCHLOSSEN am
   6. September 2026 durch E433, und zwar als NICHTBEFUND.**

   Der Verdacht war: `.pp-n` steht auf `width:170px; flex:0 0 170px`, auf
   390 px sind das 44 % der Breite für die Beschriftung einer Eigenschaft —
   dieselbe Bauform, die beim Zeitstrahl der Fehler war (E427, `.zs-namen`
   mit 190 px, am Telefon 57 %). Nicht repariert, weil die Messung den Peek
   am Telefon gar nicht öffnen konnte.

   NACHGEMESSEN STIMMT DIE VERMUTUNG NICHT. Am Telefon rendert `.peek`
   überhaupt nicht: `zeilePeek` verzweigt eine Zeile vorher zu
   `zeilePeekBlatt`, dem Blatt von unten (E371). Dort gilt
   `.iblatt-koerper .pp-n{width:118px}`. Gemessen auf 390 px:

       Hülle          Körper   Name    Anteil   abgeschnitten
       Blatt (Handy)   390 px  118 px    30 %   keiner
       Peek (Rechner)  559 px  170 px    30 %   keiner

   Dreissig Prozent an beiden Orten, und keine Beschriftung wird gekürzt.

   Die Rechnung in der Lücke war richtig, ihre Voraussetzung nicht: 170 px
   auf 390 px WÄREN 44 %, nur stehen dort nie 170 px. Das ist derselbe
   Fehler wie E21 — eine Schnittstelle aus dem Gedächtnis statt aus dem
   Quelltext —, nur an einer CSS-Regel statt an einer Funktion.

   UND DER PUNKT BLEIBT TROTZDEM BEWACHT. Die Telefon-Regel ist EINE Zeile
   in `bausteine.css`. `test361 §8` misst jetzt beide Hüllen: höchstens
   40 % der Körperbreite, und keine Beschriftung abgeschnitten. Die
   Gegenprobe — die eine Zeile weggenommen — liefert genau die 44 %, die
   hier standen.

2. **Die Karte sagt nicht, dass sie offline nichts zeigen kann.** Ohne Netz
   bleibt ein grosser grauer Kasten stehen, ohne ein Wort dazu. Die Kacheln
   kommen von OpenStreetMap, das Nachschlagen der Orte ebenfalls.
   NICHT REPARIERT, weil im Prüfcontainer gar kein Netz ist und sich „lädt
   noch" von „geht nicht" damit nicht unterscheiden lässt. Ein Hinweis, der
   IMMER erscheint, wäre schlimmer als keiner. `navigator.onLine` wäre der
   Ansatzpunkt.

3. **Drei Klassen werden gesetzt und haben keine Regel.** Gemessen: von
   1591 Klassen, die der Code setzt, haben 69 keine CSS-Regel; die meisten
   sind Griffe für `querySelector` oder Präfix-Bildungen. Drei bleiben:

       ea-rechts               elektro/arbeitsplatz.ts
       kal-block               datenbanken/steuerung.ts
       menu-liste-ohne-suche   schale/ueberlagerung/menue.ts

   NICHT REPARIERT, weil bei keiner der drei zu sehen ist, dass etwas
   fehlt: `kal-block` ist die Hülle des Kalenders, deren Kinder ihre eigene
   Gestaltung mitbringen. Eine Klasse ohne Regel ist eine Behauptung über
   Gestaltung, die es nicht gibt (E410) — aber eine Hülle ohne Regel ist
   nur eine Hülle. Wer das aufgreift, entscheidet je Klasse: Regel
   schreiben oder Klasse entfernen.

4. **`.orb-inline` ist eine tote Regel.** `bausteine.css:140`,
   `vertical-align:-4px; margin-right:6px`. Angelegt in E403 für die
   Denkkugel in einer Textzeile, nie gesetzt. Es ist die EINZIGE wirklich
   tote CSS-Regel im ganzen Bestand — 58 weitere Meldungen derselben
   Messung waren Fehlalarme aus Präfix-Bildungen (`b-` + Blocktyp,
   `q-` + Farbe).
   NICHT ENTFERNT, weil §43 sagt: nichts löschen ohne Rückfrage. Zwei Wege
   stehen offen — die Klasse dort setzen, wo sie gedacht war, oder die
   zwei Zeilen streichen. Das ist Redurs Entscheidung.

Und ein Befund, der KEINE Lücke ist und deshalb hier steht, damit ihn
niemand für eine hält: die Datumsfelder im Formular zeigen `mm/dd/yyyy`.
Das ist die Anzeige des Browsers und folgt seiner Spracheinstellung, nicht
der Seite — dieselbe bewusste Entscheidung wie beim Zeitfeld des
Zeitplans (`schale/aufbau/schale.ts`): „Wer seinen Browser auf Englisch
stellt, ERWARTET 10:00 PM." Ein eigenes Feld verlöre den Kalender zum
Antippen, die Tastaturbedienung und das Rad am Telefon.

---

L132 — „Nichts zu tun" sagt der Abgleich auch, wenn er gerade läuft
====================================================================

Gefunden am 6. September 2026 beim Nachgehen eines roten Punktes im vollen
Lauf (test261 §4, E436).

`abgleichen()` in `src/kern/abgleich/maschine.ts:810` kehrt in vier Fällen
sofort um und gibt `null` zurück:

    nicht angemeldet · kein Bereich · zustand.laeuft · Abgleich nicht erlaubt

Der Knopf „Jetzt abgleichen" in `src/bereiche/verbinden/ansicht/wolke.ts:119`
fängt zwei davon vorher ab und meldet sie richtig. Für die beiden anderen
sagt er:

    UI.toast(r ? … : 'Nichts zu tun');

**„Nichts zu tun" ist bei `zustand.laeuft` die falsche Auskunft.** Es gibt
etwas zu tun; es tut es gerade jemand. Wer den Knopf drückt, während der
Takt (Vorgabe 120 Sekunden) einen Abgleich fährt, bekommt eine Entwarnung
statt einer Auskunft — und im ungünstigen Fall glaubt er, sein Gerät sei
auf Stand, während gerade noch geschickt wird.

Es ist derselbe Fall wie der Bereichsdialog aus E434, nur eine Stufe
gefährlicher: dort nannte eine Meldung den falschen Grund, hier meldet sie
Ruhe, wo Arbeit läuft.

NICHT REPARIERT, weil die saubere Antwort mehr ist als ein anderer Satz:
`abgleichen()` müsste unterscheidbar antworten, statt viermal `null` zu
geben — ein kleiner Ergebnistyp (§52.12) wäre der richtige Weg, und der
berührt jeden Aufrufer. Das ist ein eigener Bogen und keiner, den man
nebenbei macht: der Abgleich ist die Stelle, an der Datenverlust am
teuersten wäre (§25).

WAS ES SCHON GIBT: `test261 §4` schaltet den Takt seither ausdrücklich ab
und prüft, dass der Abgleich wirklich lief (`kein null`), bevor es die
Grabsteine misst. Der Wettlauf kann die Prüfung also nicht mehr falsch rot
machen — er ist damit aber nur eingehegt, nicht behoben.

L117 — Was die ruhige Studio-Schale (E457) noch nicht kann
════════════════════════════════════════════════════════════════════════════

Gefunden am 6. September 2026 beim Abschluss des Umbaus — am Bild und an
den Prüfläufen, nicht vermutet.

1. **Die untere Telefonleiste hängt an fünf festen Knöpfen** — Dokumente ·
   Heute · Lernen · Termine · Mehr — und nicht an `haupt: true` wie die
   Kante am Rechner. Das ist der Rest von F02 (AUFGABEN.md §0): WELCHE
   vier es unten sein sollen, ist Redurs Entscheidung, und bis dahin
   stehen dort weiter die Fünf aus E236. Die Sammlungen erreicht man am
   Telefon über die Bibliothek („Sammlungen ⌄") und das Mehr-Blatt.

2. **Die Sammlung „Dateien & PDFs" listet jeden Textblock als Eintrag** —
   bis zu 80 Stück, jeder mit „text ↗ ⊞ ¶". Sie ist die alte Bibliothek
   der Arbeitswelt, unverändert übernommen, und noch nicht beruhigt.
   test428 stolperte darüber: ein Nutzerblock aus dem Notion-Wissen
   („in jedem Notion-Workspace") stand als Eintrag da, und die Prüfung
   „keine Workspace-Beschriftung" las den ganzen Inhalt statt der Schale.
   Die Prüfung ist umgeschrieben; die Sammlung nicht.

3. **Bei offener Werkzeuglade stehen Suche, KI und Konto doppelt** — im
   Studio-Kopf und rechts im Band. Glocke und Wolkenpunkt stehen seit
   E457 auch im Studio-Kopf (`#studio-glocke`, `#studio-account`; test258
   fand, dass die Glocke im Band bei zugeklappter Lade unsichtbar war);
   die Band-Rechtsgruppe bleibt trotzdem, weil das Band am Telefon die
   einzige Zeile ist. Im Ruhezustand (Lade zu) gibt es die Doppelung
   nicht.

4. **Im ruhigen Modus zeigt die Kante keinen Kontextgriff direkt** — nur
   „Seiten" und „Werkzeuge". Redurs Auftrag sagt „wenige", der
   Laptop-Stand hat null gewählt und test430 misst genau zwei Knöpfe. Ob
   ein oder zwei Griffe je Ort (Lesen/Annotieren im Dokument, Neu im
   Regal) direkt stehen sollen, ist offen.

5. **Nicht auf einem echten Gerät geprüft** — wie L10: alles gemessen mit
   Playwright im Telefon-Bildmass.

6. **Die Studio-Stilblätter haben zwei Wächter rot gemacht, die Schuld
   festhalten.** test332 (E340, L111): 55 Grundregeln in bausteine.css,
   premium.css, aufbau.css, einstellungen.css und lernwelt.css sind von
   studio.css, bibliothek-studio.css und pdf-studio.css vollständig
   überschrieben — tote Regeln, die noch nicht entfernt sind. test362
   (E372, L10): die Decken der rohen Pixelzahlen sind mit dem Studio-Stil
   gestiegen — 16px 224 → 245, 22px 68 → 74, 28px 52 → 55 — und wurden am
   6. September einmal auf den gemessenen Stand gesetzt, damit der Wächter
   wieder eine Decke hält statt dauerhaft rot zu stehen (E457). Die 44er
   sind in den vier Studio-Stilblättern auf `var(--touch-min)` umgestellt
   (175 → 153, unter die alte Decke von 152 kam sie nicht ganz: 56px sank
   von 13 auf 12). Ab hier dürfen alle sechs Zahlen wieder nur sinken.

7. **Vier Läufe sind unabhängig von der Schale rot und waren es schon vor
   diesem Bogen**: test180 (PDF-Sicherung einspielen, `App.oeffne` wirft
   beim Setzen der Adresse), test210 (der Inspector nennt das Dokument
   nicht beim Namen — „Dokumentdetails"), test217 (die Heute-Ansicht heisst
   ihren Knopf „Lernen starten →" statt „Tagesrunde starten" und stapelt
   die Zahlen unter das erste Bild), test225 (ENTSCHEIDUNGEN.md verweist
   auf „test423 §4" und „test427 §5", die es nicht gibt). test341 war im
   Parallel-Lauf rot (85 s, der Speicher wurde zu früh gelesen) und allein
   grün — ein Lastfehler, kein Produktfehler, aber einer, der zeigt, dass
   der Start den Merker `startAnsichtE349` liest, bevor die Ablage sicher
   da ist.

---

L118 — Der Deckelstern im Regal ist kein Knopf
--------------------------------------------------------------------------

Seit E460 gibt es EIN Merkzeichen für `favorite`, und es steht in der
Kopfleiste und im Heftregal. Im Dokumentregal steht es nicht: der Stern
auf dem Deckel (`.bib-deckel-stern`, `bibliothek.ts`) ist `aria-hidden`
und nicht klickbar.

DER GRUND IST KEINE FAULHEIT, SONDERN HTML. Der Deckel selbst ist ein
`<button class="bib-deckel">`, und der Stern sitzt darin. Ein Knopf im
Knopf ist ungültig; der Browser bricht die Verschachtelung auf, und was
dann klickbar ist, entscheidet er. Umschalten geht deshalb über das
⌄-Menü des Deckels („Zu Favoriten" / „Aus Favoriten") — das ist ein Weg,
aber ein versteckter.

WAS ES KOSTEN WÜRDE, es zu schliessen: der Deckel müsste vom Knopf zu
einer Fläche mit einem Knopf darin werden. Das berührt die Tastaturführung
des ganzen Regals, den Ziehen-und-Ablegen-Weg und drei Prüfläufe, die den
Deckel anklicken. Es ist eine eigene Arbeit, keine Zeile nebenbei.

---

L119 — Zwei der vier Lader stehen an Stellen, die kein Prüflauf auslöst
--------------------------------------------------------------------------

E461 hängt vier Lader an vier echte Vorgänge. Zwei davon laufen in
`test434` wirklich: die Presse und die Sterne am Auftragsfenster, mit
angelegten Aufträgen und echten Zahlen.

Die anderen zwei nicht:

  · **Der flüssige Ring am Modell-Download.** WebLLM holt ein Modell von
    mehreren hundert Megabyte; das dauert Minuten und braucht das Netz.
    Ein Prüflauf, der das täte, wäre kein Prüflauf mehr.
  · **Das Wort am Abgleich.** `Wolke.abgleichen()` braucht einen Server.
    Es gibt einen Prüfserver, aber der Weg dorthin führt über Konto,
    Anmeldung und Bereich — das ist eine eigene Suite und keine Zeile
    nebenbei.

`test434` §5 prüft deshalb dort die VERDRAHTUNG: dass `dienst.ts` den
echten Anteil an den Ring weitergibt und dass `wolke.ts` das Wort nimmt
und keinen Balken. Das ist ehrlich, aber es ist weniger — es sagt nicht,
wie die beiden im Betrieb aussehen.

WAS ES SCHLIESSEN WÜRDE: für den Ring ein Stellvertreter für
`webllmLaden`, der eine Folge von Anteilen abspult. Dafür müsste die
Funktion aus `dienst.ts` heraus oder überschreibbar werden — und das ist
eine Änderung am KI-Kern für einen Prüflauf, also eine eigene
Entscheidung. Für das Wort: die Server-Suite um einen Abgleichfall
erweitern.

---

L120 — Die Presse beim PDF-Einlesen läuft im Prüflauf nicht an einer echten PDF
--------------------------------------------------------------------------

E463 hängt die Presse (E461) an `PdfEinlesen.einlesen`: eine schwebende
Karte, die „Seite n von m" schreibt, während die Schleife läuft. `test436`
§3 prüft die Karte selbst mit echten Bytes im DOM — bauen, setzen,
entfernen, Lage am Telefon — und die VERDRAHTUNG in `einlesen.ts` als Text:
`Lader.schweben`, kein Toast daneben, fünfmal `wegMelden()`.

Was er nicht tut: eine PDF durch die Schleife schicken und dabei zusehen,
wie die Karte „Seite 3 von 12" sagt. Dafür bräuchte der Lauf eine
PDF-Datei und den PDF-Leser im Browser; die Suiten, die das haben
(test177, test180, test189, test192, test228, test285, test320), prüfen das
Ergebnis des Einlesens, nicht die Meldung währenddessen.

WAS ES SCHLIESSEN WÜRDE: in einer dieser Suiten während des Einlesens
nach `.ru-lader-schwebt .ru-lader-text` sehen — eine Zeile, aber in einem
Lauf, der der Presse nicht gehört. Derselbe Stand wie bei L119.

---

L133 — Was am PDF-Teil gegenüber GoodNotes noch fehlt (Stand nach G21)
--------------------------------------------------------------------------

Redurs Auftrag vom 7. September (E465): der PDF-Teil 1:1 wie GoodNotes,
ohne eine Funktion zu löschen. Die fünf Bögen (G1–G5, E465–E469,
`AUFGABEN.md` 7) sind gebaut; diese Lücke ist die ehrliche Restliste, und
was hier steht, ist NICHT gebaut, wie schön das Dossier es auch beschreibt.

Zeichnen (nach G1, E465):

  · ~~**Kurve**~~ des Shape-Tools — **GESCHLOSSEN mit E483.** Die erste
    Form mit drei Punkten (Anfang, Ende, Griff), ohne ein neues Feld:
    `pts` ist eine Liste, und `move`, `scale` und `rotate` fassen ohnehin
    alle Punkte an. Der Griff steht auf dem Steuerpunkt und biegt in den
    Achsen der Marke. `test456`.
  · **Verbinder** des Shape-Tools — offen, und etwas anderes als die
    Kurve: eine Marke, die an ZWEI anderen hängt und mitgeht, wenn eine
    sich bewegt. Das braucht Anker an fremden Marken und ein Nachziehen
    bei jeder Änderung — keinen dritten Punkt, sondern eine Beziehung.
  · ~~**Formerkennung für gedrehte Dreiecke**~~ — **GESCHLOSSEN mit E478.**
    Die Marke kann seit E466 schief stehen und seit E474 rechnet die
    Geometrie damit; also bekommt ein gedrehtes Dreieck jetzt seinen
    Winkel statt einer Absage. Aufrecht bleibt aufrecht (unter 4° kein
    Feld), und ein fast gleichseitiges bekommt die KLEINSTE der drei
    möglichen Drehungen — das fand das Bild, nicht der Prüflauf.
    `test451`.
  · ~~**Radierer-Filter** nach Werkzeugart~~ — **GESCHLOSSEN mit E482.**
    Fünf Arten: Ganz und Teil sagen, wie viel weggeht; Stift, Marker und
    Band, wovon. **Offen bleibt „nur Bleistift":** der Bleistift ist in
    Redion kein Werkzeug, sondern ein Stil des Stifts (E375) — er stünde
    in einer Reihe mit Werkzeugen und meinte etwas anderes als sie.
    `test455 §2`.
  · ~~**Farbsets** speichern und zurücksetzen~~ — **GESCHLOSSEN mit E486.**
    Ein Farbsatz ist die benannte Abschrift der vier eigenen Tupfer:
    sichern, laden, löschen, zurücksetzen. Sie stehen hinter dem „+" der
    Farbgruppe, zusammen mit dem Farbwähler — einen EIGENEN Knopf konnte
    die Leiste nicht tragen: nachgemessen fasst ihre Zubehörzeile bei
    596 px genau vierzehn, und sie war mit vierzehn voll. Das ist zugleich
    der Weg, den GoodNotes geht (ein Farbknopf, ein Feld). Höchstens acht
    Sätze, und der neunte bekommt eine Absage statt dass still der älteste
    verschwindet. Die Sätze liegen in `meta` und
    reisen damit in jeder Sicherung mit (`test458 §4`).
    **Und die Zahl in dieser Zeile war falsch:** es sind FÜNF feste Farben,
    nicht sieben — nachgezählt in `Marken.FARBEN`. E21 gilt auch für die
    eigenen Notizen.
    Der Bogen fand nebenbei zwei ältere Fehler: die Tupfer standen nach dem
    Wählen verkehrt herum (ein `reverse()` zu viel, E351), und `Dialog.wahl`
    schnitt bei elf Knöpfen den letzten ab, ohne es zu sagen. Beide behoben.
    `test458`.

Auswahl (nach G2, E466; Sperre nachgezogen in E473): Drehen,
Ausschneiden, nach vorn und hinten, Sperren, Kritzel-Löschen und
Kreis-Lasso stehen. Offen bleibt:

  · ~~**Treffer auf gedrehten Kästen**~~ — **GESCHLOSSEN mit E474.** Die
    Geometrie kennt seit `ecken`, `drehung` und `overlapConvex` die
    wirklichen vier Ecken einer schiefen Marke: der Radierer misst an
    ihnen (an 3000 Stellen gegen die genaue Rechnung geprüft, vorher 1013
    falsche Antworten), der Kastenzug fängt nicht mehr ein, was in der
    leeren Ecke steht, der Auswahlrahmen liegt auf der Marke statt weit um
    sie herum, und das Ziehen am Griff verzerrt sie nicht mehr. Der Tipp
    ging schon immer über den gezeichneten Knoten, das Lasso über die
    Mitte des Kastens — die ist beim Drehen dieselbe. `test447`.
  · **Auswahl über mehrere Blätter** — das Lasso gilt je Blatt (E353).
  · **Sperren im Inspector** — die Sperre sitzt am Knopf der Leiste; eine
    Liste aller gesperrten Marken gibt es nicht.

Seiten (nach G3, E467): einfügen, duplizieren, drehen, schieben,
Lesezeichen und löschen stehen im Inspector. Offen bleibt:

  · ~~**Seiten ziehen in der Miniaturenleiste** und ein Menü je Miniatur~~
    — **GESCHLOSSEN mit E480.** Jede Miniatur hat ihren „⋯"-Knopf mit
    denselben acht Griffen wie der Inspector, die aber SEINE Seite meinen
    (dafür nehmen alle Seitengriffe jetzt entgegen, wen sie meinen).
    Gezogen wird mit dem Zeiger: mit der Maus nach acht Pixeln, mit dem
    Finger erst nach 350 ms Halten, damit die Leiste rollbar bleibt.
    **Offen bleibt:** umgeordnet wird nur innerhalb derselben Eltern —
    liegen die Seiten eines Dokuments in mehreren Spalten, sagt es das,
    statt zu raten. `test453`.
  · **Einfügen aus einer Vorlage mit Inhalt** — „Seite danach" kennt die
    fünf Papiere; eine Vorlagenseite aus dem Vorlagenregister (mit Text
    und Marken) ist ein eigener Bogen.
  · **Mehrseitige Notizhefte als EIN Block** — ein `blatt` wächst in die
    Höhe (E118); Seitengriffe gelten ihm als Ganzem. Ein Heft mit drei
    Blattseiten lässt sich nicht seitenweise drehen oder löschen.

Suche und Verweise (nach G4, E468): die Suche im Studio mit Treffern an
der Stelle, die Verweise der PDF, eigene Verweise an Marken stehen.
Offen bleibt:

  · ~~**Treffer-Kästen sind eine Näherung**~~ — **GESCHLOSSEN mit E484.**
    Gemessen wird jetzt mit `InkGeometry.textWidth`, als Verhältnis
    innerhalb des Stücks; dass die Messschrift nicht die der PDF ist,
    fällt darin weitgehend heraus. Bei „iiiiWWWW" sitzt der Kasten für
    „WWWW" gemessen bei 13,3 % statt gezählt bei 17,8 % — und 13,3 ist
    richtig. `test457 §1`.
  · ~~**PDF-Verweise auf gedrehten Seiten**~~ — **GESCHLOSSEN mit E481.**
    Die Schicht liegt nicht mehr NEBEN dem Papier (von Hand nachgemessen,
    und bei einer gedrehten Seite misst man ihre Hülle), sondern IM
    Papier mit `inset:0`. Dort dreht sie mit — und liegt nebenbei auf dem
    Innenkasten, dort, wo auch das Seitenbild liegt. `test454 §3`.
  · ~~**Suche über mehrere Dokumente**~~ — **GESCHLOSSEN mit E487.** Der
    Schalter „📚" in der Suchleiste nimmt die anderen Dokumente dazu; ihre
    Treffer stehen als Klappe unter der Leiste, mit Name, Seitenzahl und
    Textausschnitt, und ein Tipp öffnet das Dokument auf DER Seite und
    sucht dort weiter.
    **Der Unterschied bleibt und steht am Knopf:** im offenen Dokument
    findet die Suche die STELLE (Kästen im Papier), in fremden die SEITE —
    denn die Stelle steht in der PDF-Textschicht, und die für jedes fremde
    Dokument zu lesen macht das Suchfeld unbenutzbar. Der Sprung ist der
    zweite Schritt, der die Stelle nachliefert.
    Die Schalensuche (Strg P) findet weiterhin Seiten, nicht Stellen — sie
    ist eine andere Suche, und das bleibt offen. `test459`.
  · ~~**Ziele der PDF innerhalb der Seite**~~ — **GESCHLOSSEN mit E481.**
    `/XYZ`, `/FitH` und `/FitR` nennen eine Höhe; sie steht seit dem
    Einlesen als `zielY` am Verweis, und der Sprung rollt dorthin. `/Fit`
    nennt keine — und dann steht auch keine da (dieselbe Regel wie E477).
    `test454 §1, §2`.
  · ~~**Verweise auf Striche antippen**~~ — **GESCHLOSSEN mit E484**, aber
    NICHT mit dem Kasten, den diese Zeile vorschlug: ein Bogen über eine
    halbe Seite hätte einen Kasten über die halbe Seite, und der finge
    alles ein, was daneben steht (dieselbe Lehre wie E476). Stattdessen
    derselbe WEG, nur breiter — eine durchsichtige Kopie des Pfades mit
    24 Punkten Strich. Gemessen: zehn Punkte daneben trifft, zwanzig
    nicht. `test457 §2`.

Import und Export (nach G5, E469): Bilder als Seiten, PDF an einer Stelle,
Seite als Bild, Zoom-Fenster stehen. Offen bleibt:

  · **Das Zoom-Fenster** ist seit E470 der Streifen, in den man schreibt,
    mit der ganzen Seite darüber — und mit EINER Zeichenfläche (das Papier
    zieht um); seit E472 rückt es am rechten Rand von selbst weiter. Was
    noch fehlt: „Ausschnitt" und „Erkennen" ruhen, solange es offen ist.
  · **Seite als Bild** lässt den getippten Text eines Blatts aus. Die
    BILDMARKEN kommen seit **E479** mit; dabei wurde nachgemessen, was
    ein SVG auf der Leinwand darf, und das Ergebnis gehört hierher, damit
    niemand die geschlossenen Türen ein zweites Mal aufdrückt:

        blob: im SVG      gesperrt (Pixel bleibt Platzhalterblau)
        data: im SVG      geht, und trübt die Leinwand nicht
        foreignObject     zeichnet — TRÜBT aber die Leinwand

    Die dritte Zeile schliesst den naheliegenden Weg für den Text:
    `foreignObject` würde ihn bringen und dafür die ganze Ausfuhr
    verlieren (`toBlob` schlägt danach fehl). Bliebe, den Text als
    SVG-`<text>` nachzubauen — das ist ein zweiter Blockrenderer und
    ein eigener Bogen. `Drucken` (E117) hat beides und bleibt der Weg
    für eine vollständige Seite.
  · ~~**Ganzes Dokument als PDF mit Marken**~~ — **GESCHLOSSEN mit E488.**
    Den PDF-Schreiber gibt es jetzt: `src/core/export/pdfWriter.ts`, rund
    hundertfünfzig Zeilen, jede Seite als JPEG in einem `DCTDecode`-Strom.
    Er liest die Bildbytes NIE — nur ihre Grösse geht in die Rechnung —,
    also kostet ein Dokument mit hundert Seiten so viel Arbeitsspeicher wie
    eines mit einer.
    **Was es NICHT kann, und das steht am Knopf:** es ist die Abbildung des
    Dokuments, nicht sein Text. Der Text der ursprünglichen PDF ist darin
    nicht mehr durchsuchbar, und Schriften sind keine Schriften mehr. Wer
    ihn braucht, behält das Original — Redion fasst es nie an (E106).
    Ein PDF mit echter Textschicht wäre ein eigener Bogen: er bräuchte
    Schrifteinbettung und den Text jeder Marke als PDF-Text, und er läuft
    in dieselbe Wand wie „getippter Text im gesicherten Bild" (unten).
    `test460` schreibt, liest mit Redions eigenem Leser zurück und misst
    einen Pixel dort, wo ein Strich liegen muss.
  · ~~**Fotografieren mit der Kamera** als Seite~~ — **GESCHLOSSEN mit
    E482.** „Foto aufnehmen" steht im Seitenmenü und im Menü an der
    Miniatur; der Wähler dahinter trägt `capture="environment"`. Am
    Rechner ohne Kamera öffnet sich der gewohnte Dateiwähler, und der
    Hinweis am Knopf sagt das. `test455 §1`.

Aus der Prüfung nach den Bögen (E473) bleibt ehrlich stehen:

  · ~~**Verweise auf alten Seiten.**~~ — **GESCHLOSSEN mit E477.** Der
    Nachtrag über die Auftragsmaschine ist gebaut: beim Öffnen eines
    Dokuments läuft je Original einmal `pdf-verweise`, schreibt jeder
    Seite ihr Feld (auch die leere Liste) und malt die Verweise danach
    ohne neues Öffnen. Ausserhalb des Anzeigewegs — `test450 §5` zählt
    nach, dass beim Ansehen und Rollen keine PDF geöffnet wird. **Offen
    bleibt nur der Fall ohne Original:** wer aus einer `.json`-Sicherung
    kommt, hat die PDF-Datei nicht, und ohne sie gibt es nichts
    nachzutragen — dort wird bewusst kein Auftrag angelegt, statt eine
    Fehlermeldung für etwas zu werfen, das niemand ändern kann.
  · **Der Rest der 33 Funde.** Acht wurden adversarial geprüft, fünf haben
    gehalten und sind behoben; die übrigen 25 sind nicht widerlegt,
    sondern nur nicht geprüft. Einer davon ist seit E474 erledigt
    (`InkGeometry.scale` kannte `dreh` nicht — eine gedrehte Marke
    verzerrte beim Ziehen am Eckgriff). Erledigt sind ausserdem die drei
    §37-Stellen mit E475: gemessen waren es 6,9 px am PDF-Verweis, 16 am
    Regler der Strichstärke und 36 an der Papierauswahl — alle drei jetzt
    44, der Verweis über eine Trefffläche, die beim halben Nachbarabstand
    haltmacht (`test448`). Mit E476 sind auch die letzten zwei benannten
    erledigt: das Kritzel-Löschen greift jetzt am WEG des Gekritzels statt
    an seinem Kasten (mit dem Kasten löschte ein schräger Zug drei Marken
    statt einer), und `trefferMalen` malt beim Nachziehen nur noch die
    eine Seite (`test449`). Was danach von den 25 bleibt, ist nicht mehr
    benannt: es sind die Funde, die niemand aufgeschrieben hat, weil sie
    keinen Satz wert schienen — wer sie sucht, liest die Bögen neu.

Was Redion auch nach G5 nicht haben wird, und warum:

  · **Audio mit Zeitbezug zur Handschrift (Note Replay)** — ein eigener
    Bereich (Aufnahme, Speicher in Stücken, Abspielen mit Marken-Zeit).
    Es gibt „Besprechung" im KI-Fenster; die Kopplung an Striche ist ein
    eigener Bogen mit eigener Entscheidung.
  · **Handschrift → Text, Mathe → Formel** — braucht eine Erkennung, die
    lokal läuft. Tesseract erkennt gedruckten Text (OCR-Auftrag), keine
    Handschrift; eine Wolken-Erkennung widerspricht §21 ohne Frage.
  · **Elemente-Bibliothek (Sticker, GIPHY)** — Redion hat die Fachzeichen;
    eine allgemeine Sammlung wiederverwendbarer Marken wäre neu.
  · **Präsentationsmodus mit Laserpointer**, **Wolken-Abgleich der
    Dokumente**, **Freigabe-Links**, **Marketplace** — ausserhalb des
    PDF-Teils oder ausserhalb von local-first (§22, §24).
  · **DOCX/PPTX-Import** — GoodNotes wandelt sie zu PDF um (nur auf
    Apple); im Browser ohne Bibliothek nicht möglich, und eine grosse
    Abhängigkeit ist keine (§6).

Gefunden beim Lesen des Dossiers gegen den Bestand, 7. September 2026.
