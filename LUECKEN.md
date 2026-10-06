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

## L34 · ~~Ein Wert, der an zwei Stellen steht~~ — GESCHLOSSEN

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

**25. September 2026 — die Regel dahinter hat Redur geändert (E683, §57,
`FREMDCODE.md`):** fremder Code darf in Redion, wenn er Redion verbessert,
nichts hinausschickt und Redur vorher gefragt wurde. Für Erweiterungen, die
ein **Nutzer** einspielt, bleibt die Sandbox-Bedingung unten stehen — Redur
hat diesen Code nicht gesehen. Der Weg, wie er im Plattform-Audit
vorgeschlagen ist (`doku/REDION-PLATTFORM-AUDIT.md` 3.2, 7): **erst Pakete
aus Daten** (Vorlagen, Quiz-Kapitel, Fachzeichen, Formeln über die
vorhandenen Register — kein Code, keine Sandbox nötig), **dann
Code-Erweiterungen nur in der Sandbox** (eigener Ursprung, Nachrichten
über `/v1/`, Rechte je Erweiterung, Widerruf), Katalog erst, wenn der
Server steht. Und vorher: das Erweiterungsfenster, das es heute schon gibt
(`src/bereiche/einstellungen/erweiterungen.ts`, `new Function` im selben
Ursprung — Audit R5), in die Register zurückführen. Diese Lücke bleibt
offen, bis das steht.

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

# Weitere offene Lücken · in der Reihenfolge ihres Fundes

Diese Einträge standen bis zum 20. September 2026 **unterhalb** der
Überschrift „Anhang B · Was erledigt ist" — nicht in ihren Tabellen,
sondern dahinter: der Anhang endete mit seiner letzten Tabelle, und alles
Spätere wurde ans Dateiende geschrieben. Wer von oben las, hielt sie für
erledigt. Das ist genau die Sorte stiller Fehler, gegen die es diese Datei
gibt (§35).

Sie stehen hier in der Reihenfolge, in der sie gefunden wurden, und **nicht**
in die vier Dringlichkeitsstufen oben einsortiert: welche Lücke wie dringend
ist, ist eine Entscheidung je Eintrag, und die gehört Redur. Eine falsche
Einsortierung wäre derselbe stille Fehler in neu.

`test549` hält den Zustand: kein offener Eintrag steht mehr unter „Was
erledigt ist".

---

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
8. ~~**Ein Zurücknehmen dreht die Fassungsnummer mit zurück.**~~ GESCHLOSSEN
   in E610. Punkt 3 hat die Erhöhung zugesichert, aber nicht, dass eine
   Nummer nur EINMAL vergeben wird: `git revert` nimmt `sw.ts` und
   `stand.ts` mit, E609 hat v1145 auf v1141 gedreht, und v1142…v1145 waren
   wieder frei — mit anderem Inhalt beim zweiten Mal, aber demselben
   Ablagenamen. Der Name trägt jetzt den Inhaltsstempel
   (`ABLAGE = VERSION + '-' + INHALT`), damit gleicher Name gleiche Bytes
   heisst, per Konstruktion. `test530`, 16 Zusicherungen, Gegenprobe rot
   gesehen.

Gefunden am 30. August 2026 (beim Bau von E271, durch die Prüfung);
Punkt 8 am 16. September 2026, beim Nachsehen, warum ein zurückgeholtes
Auge am Ordner im Browser trotzdem nicht ankam.

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

1. **Der Kalender liefert still FALSCHE Daten.** — **GESCHLOSSEN, und zwar
   lange vor heute: mit E290 (BYDAY), E335–E338 (Rundlauf, Dauer, EXDATE)
   und dem eigenen Modul `src/core/calendar/wiederholung.ts`. Nachgesehen
   am 17. September 2026.**

   Hier stand: „`wiederholungen()` (`kalender.ts:143-182`) liest nur vier
   Schlüssel und wirft den Rest wortlos weg. `FREQ=MONTHLY;BYDAY=2TU` wird
   zu ‚jeden Monat am selben Tag'. Repo-weit null Treffer für BYDAY,
   EXDATE, RDATE, BYMONTHDAY, BYSETPOS — auch in Doku und Prüfläufen."

   **Nachgezählt gilt heute das Gegenteil:**

   ```txt
   BYDAY        src: 2 Dateien   Prüfläufe: test284 §2 und §3
   EXDATE       src: 2           Prüfläufe: 2
   RDATE        src: 5           Prüfläufe: 2
   BYMONTHDAY   src: 1           Prüfläufe: 1
   BYSETPOS     src: 1           Prüfläufe: 1
   ```

   `wiederholung.ts` wertet **FREQ, INTERVAL, COUNT, UNTIL, BYDAY (auch mit
   Ordnungszahl: `2TU`, `-1FR`), BYMONTHDAY (auch negativ), BYMONTH,
   BYSETPOS und WKST** aus — und was es nicht kann, sagt es: jeder nicht
   gelesene Teil steht in `nichtVerstanden` und reist als `regelUnklar` mit
   dem Termin bis zur Anzeige. Genau die Regel, die dieser Punkt verlangt
   hat. `test284` hält es mit **49 Zusicherungen**, darunter der Fall aus
   dem Absatz oben („zweiter Dienstag", „letzter Freitag") und der
   Grenzfall „der 31. in einem Monat ohne 31. fällt AUS statt auf den
   3. März zu rutschen". Gelaufen am 17. September: **49/49.**

   **Offen bleibt nur, was der Absatz gar nicht nannte:** `VTIMEZONE` gibt
   es im ganzen Verzeichnis nicht (0 Treffer), `TZID` steht an drei
   Stellen. Zeitzonen sind damit die echte Restlücke dieses Punktes — und
   eine kleinere und andere als „der Kalender zeigt falsche Tage".

   **Die Lehre ist die von §49, und sie hat diesmal richtig weh getan:**
   dieser Punkt stand als **Rang 1 nach §46** ganz oben in der Übersicht
   vom 16. September und wurde Redur als der dringendste offene Punkt
   angeboten — auf Aktenlage, die seit E290 falsch war. Ein Punkt, der als
   offen dasteht, ohne dass jemand nachgesehen hat, ist schlimmer als gar
   keiner.

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

3. ~~**Die Stiftleiste zum Schweben bringen.**~~ IM SCHREIBSTUDIO ERLEDIGT,
   nachgemessen am 16. September 2026: dort steht sie längst
   `position:fixed` am unteren Rand (`pdf-studio.css`), ist 62 px hoch und
   kostet **0 px Layouthöhe**; `--visual-bottom` hält sie seit E588 auch vor
   der Bildschirmtastatur frei. Die erwarteten „rund 120 px" sind an dieser
   Stelle nicht mehr zu holen — der Platz lag oben, und E612 hat ihn dort
   geholt (301 → 160 px). OFFEN BLEIBT die Leiste auf einer gewöhnlichen
   Seite: dort steht `.blatt-reihe` weiter im Fluss (`bausteine.css`, zwei
   Zeilen unter 100 px, drei unter 140).

4. **Die Heft-Leiste an den Fuss des Papiers**, wie in GoodNotes.

5. ~~**Ein Prüflauf, der die Zahl der sichtbaren Bedienelemente je Zustand
   festhält**~~ — GESCHLOSSEN mit E612 für das Schreibstudio: `test532` misst
   die Höhe der Bedienung über der Folie gegen eine Decke von 175 px und
   prüft jeden Zustand einzeln (ruhig, aufgeklappt, Reiter „Zeichnen", ohne
   Ruhe). Zwei Gegenproben rot gesehen; die Decke fängt jeden der beiden
   Eingriffe auch einzeln (224 und 227 px).
   OFFEN BLEIBT dieselbe Decke für die ÜBRIGEN Ansichten — `test384` und
   `test532` halten je eine; „eine Decke über alle" ist damit halb.

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

L133 — Was am PDF-Teil gegenüber GoodNotes noch fehlt (Stand nach G23)
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
  · **Verbinder** des Shape-Tools — offen, aber **kein Rückstand gegenüber
    GoodNotes** (berichtigt mit E498): dessen Formenwerkzeug hat auch keine
    Verbinder. Es ist ein Wunsch für den Schaltplan-Teil. Etwas anderes als
    die Kurve wäre es auch: eine Marke, die an ZWEI anderen hängt und
    mitgeht, wenn eine sich bewegt — Anker an fremden Marken und ein
    Nachziehen bei jeder Änderung, keinen dritten Punkt, sondern eine
    Beziehung.
  · ~~**Formerkennung für gedrehte Dreiecke**~~ — **GESCHLOSSEN mit E478.**
    Die Marke kann seit E466 schief stehen und seit E474 rechnet die
    Geometrie damit; also bekommt ein gedrehtes Dreieck jetzt seinen
    Winkel statt einer Absage. Aufrecht bleibt aufrecht (unter 4° kein
    Feld), und ein fast gleichseitiges bekommt die KLEINSTE der drei
    möglichen Drehungen — das fand das Bild, nicht der Prüflauf.
    `test451`.
  · ~~**Radierer-Filter** nach Werkzeugart~~ — **GESCHLOSSEN mit E482.**
    Fünf Arten: Ganz und Teil sagen, wie viel weggeht; Stift, Marker und
    Band, wovon. **Nachtrag E489:** „Band" radierte anfangs nichts — es
    verglich gegen `art: 'band'`, und die Marke heisst `abdeck`. Der
    Prüflauf hatte sich seine Marke selbst falsch gebaut und war deshalb
    grün. Behoben, Gegenprobe rot gesehen. **Offen bleibt „nur Bleistift":** der Bleistift ist in
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
  · **Auswahl über mehrere Blätter** — das Lasso gilt je Blatt (E353), und
    das ist **kein Rückstand gegenüber GoodNotes** (berichtigt mit E498):
    dessen Lasso gilt ebenfalls je Seite. Ein Wunsch, kein Rückstand.
  · ~~**Sperren im Inspector**~~ — **GESCHLOSSEN mit E492.** Die Liste steht
    im Inspector, mit Namen aus derselben Quelle wie die Werkzeugleiste, je
    einem „Entsperren" und einem „Alle N entsperren". Das war mehr als eine
    fehlende Liste: sperren geht über die Auswahl, und die geht bei einer
    gesperrten Marke nicht — die Sperre liess sich anlegen und nicht mehr
    lösen. Zwei Funde kamen vom Bild: zwei Zeilen hiessen beide „Linie"
    (jetzt steht der Stil dabei), und auch dann bleiben zwei gleiche Linien
    gleich — deshalb leuchtet die Marke auf, wenn man ihre Zeile berührt.
    `test462`.

Seiten (nach G3, E467): einfügen, duplizieren, drehen, schieben,
Lesezeichen und löschen stehen im Inspector; seit **E496** auch
**„In anderes Dokument"** — GoodNotes' „Copy to…" und „Move to…". Kopieren
gibt frische Kennungen und ein eigenes Seitenbild, Verschieben behält die
Kennung (sonst zeigte jeder Verweis auf die Seite ins Leere). Die einzige
Seite eines Dokuments lässt sich nur kopieren. `test466`.
Offen bleibt:

  · ~~**Seiten ziehen in der Miniaturenleiste** und ein Menü je Miniatur~~
    — **GESCHLOSSEN mit E480.** Jede Miniatur hat ihren „⋯"-Knopf mit
    denselben acht Griffen wie der Inspector, die aber SEINE Seite meinen
    (dafür nehmen alle Seitengriffe jetzt entgegen, wen sie meinen).
    Gezogen wird mit dem Zeiger: mit der Maus nach acht Pixeln, mit dem
    Finger erst nach 350 ms Halten, damit die Leiste rollbar bleibt.
    **Auch über Spaltengrenzen — GESCHLOSSEN mit E498:** die Seite wandert
    in die Eltern der Seite, vor die sie fällt, mit derselben sicheren
    Reihenfolge wie E496 (erst dazulegen, dann umhängen, zuletzt
    wegnehmen). Bis dahin sagte die Stelle nein, und das war ehrlich,
    solange es keinen Weg gab, einen Block umzuhängen. `test453`,
    `test467 §3`.
  · **Einfügen aus einer Vorlage mit Inhalt** — bleibt offen, aber die
    Zahl darin stimmt nicht mehr: „Seite danach" kennt seit **E495**
    SIEBEN Papiere. Dazugekommen sind **Cornell-Notizen** und
    **Notenlinien** — die zwei, an denen man GoodNotes' Vorlagenwähler
    erkennt, und zugleich das, was er zum grössten Teil ist: Papiere, keine
    Seiten mit Inhalt. Beide sind reine Darstellung (E100), beide stehen im
    selben Katalog und damit auch im Wähler des Studios. `test465`.
    Was offen bleibt, ist der Rest: eine Vorlagenseite aus dem
    Vorlagenregister, MIT Text und Marken, ist ein eigener Bogen.
    Nicht kommen wird **isometrisches Papier**, obwohl GoodNotes es hat:
    ein schräger Verlauf misst seinen Abstand senkrecht zur Linie, und in
    Prozent einer Fläche ändert der sich mit dem Seitenverhältnis — am
    Telefon wären es andere Dreiecke als am Rechner (dieselbe Falle wie
    E100). Das ginge nur mit einem gezeichneten Muster.
  · ~~**Mehrseitige Notizhefte als EIN Block**~~ — **GESCHLOSSEN mit E499,
    und zwar ohne die Form abzuschaffen.** Ein `blatt` darf weiter in die
    Höhe wachsen (E118) — das IST ein Heft, in das man fortlaufend
    schreibt. Neu ist der Griff „In Seiten zerlegen": aus einem Blatt von
    drei A4 werden drei Blätter von je einem, und danach greifen Drehen,
    Löschen und Verschieben je Seite.
    Jede Marke kommt auf die Seite, in der ihre MITTE liegt, und bleibt
    GANZ — keine wird geschnitten. Eine Marke über einer Seitengrenze ragt
    danach über den Rand hinaus und ist dort nicht mehr zu sehen (das
    Papier schneidet); verloren ist sie nicht, und der Dialog sagt es mit
    Zahl, bevor etwas geschieht. `test468`.

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
    ~~Die Schalensuche (Strg P) findet weiterhin Seiten, nicht Stellen~~ —
    **GESCHLOSSEN mit E500:** sie nennt jetzt „Seite 3" statt „Inhalt",
    zeigt den Ausschnitt der Stelle und springt dorthin. Und sie findet
    seither überhaupt erst, was von HAND geschrieben ist: Text auf einem
    Blatt steht in einer Marke, Marken stehen in keinem Suchindex — ein
    Heft mit „Knotensatz" als Textmarke war über Strg P unauffindbar.
    Der Zweig greift nur bei einer reinen Wortsuche, sonst ginge er an den
    Filtern der Abfragesprache vorbei (E175). `test459`, `test469`.
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
    zieht um); seit E472 rückt es am rechten Rand von selbst weiter.
    ~~„Ausschnitt" und „Erkennen" ruhen, solange es offen ist~~ —
    **GESCHLOSSEN mit E498:** sie ruhen jetzt SICHTBAR, am Knopf statt erst
    als Meldung nach dem Druck, mit einem Hinweis, der sagt warum (§38).
    Die Meldung bleibt für den Weg über Tastatur und Befehlspalette.
    `test467 §1, §2`.
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
  · ~~**Elemente-Bibliothek (Sticker)**~~ — **GESCHLOSSEN mit E494, und die
    Begründung dieser Zeile war keine.** „Wäre neu" ist eine Beschreibung,
    kein Grund; und wiederverwendbare Marken sind in Redion nichts Neues —
    es sind dieselben, die die Zwischenablage seit E353 kopiert, nur
    überleben sie das Dokument.
    Gebaut: das zwölfte Werkzeug ⭐, „Als Element" bei der Auswahl als
    einziger Weg hinein, ein Feld von Kacheln mit dem Bild jedes Elements
    (gezeichnet mit `zeichneMarke`, nicht mit einem zweiten Zeichner), und
    der Stempel mittig unter dem Zeiger — der erste Tipp öffnet die
    Bibliothek, jeder weitere setzt dasselbe wieder.
    Sie liegt in `meta` und reist damit in jeder Sicherung mit (§9, §11).
    **Offen bleibt der Anhang:** ein Element mit einer BILDMARKE trägt die
    Kennung der Datei, nicht die Datei. Wer es aus einer `.json`-Sicherung
    zurückholt (die keine Anhänge kennt), hat das Element und nicht sein
    Bild; die Marke bleibt stehen und zeigt ihren Platzhalter, statt still
    gelöscht zu werden (§18). `test464`.
  · **GIPHY** bleibt draussen, und das ist der Teil der Zeile, der stimmt:
    eine Bildersuche im Netz widerspricht §21 und §22 und brächte fremde
    Inhalte in eine App, die ohne Netz vollständig sein soll.
    **Ein eigenes GIF geht dagegen seit E502** — und das war der Teil, der
    Redur gemeint hat: die Datei geht mit IHREM Typ und IHRER Länge in die
    Ablage, läuft also auf dem Blatt weiter, statt als Standbild
    dazustehen. Nicht geprüft war das vorher nie; jetzt hält es `test470`.
    Dasselbe Werkzeug nimmt seither eine PDF-SEITE als Bildmarke —
    verschieben, ziehen, drehen, sperren wie jede andere Marke.
  · **Stift-Favoriten** kommen NICHT, und das ist eine Entscheidung, keine
    Lücke (E498). GoodNotes' drei Favoriten sind FARB-Voreinstellungen —
    die hat Redion seit E486 als benannte Farbsätze, und die können mehr.
    **Seit E501 können sie wirklich mehr**, und bis dahin war der Satz
    grosszügig: ein Farbsatz merkt sich jetzt AUCH den Stift und die
    Strichstärke. Damit ist der Preset-Satz des Dossiers („Farben und
    Stärken … als Presets") ganz erfüllt, ohne einen zweiten Katalog —
    zwei optionale Felder am vorhandenen Satz, und ein alter Satz ohne sie
    lädt weiter genau seine Farben.
    Ein zweiter Katalog daneben wäre genau das, wovor §8 warnt. Der Satz
    steht hier, damit die Frage beim nächsten Durchgang nicht wiederkommt.
    Nachgemessen wäre es ausserdem nicht umsonst: die Zubehörzeile des
    Stifts fasst bei 596 px genau vierzehn Knöpfe und ist mit vierzehn
    voll — drei Plätze mehr brächen sie in eine dritte Zeile und die
    Leiste über die 100 px aus E359.
  · **Vom Stift bleiben Azimut und Drehung ungenutzt.** Seit **E507** liest
    Redion die NEIGUNG (`tiltX`/`tiltY`) und schattiert damit den
    Bleistift. Was Pointer Events darüber hinaus gibt, liegt weiter brach:
    `azimuthAngle` (in welche Richtung der Stift zeigt) würde eine
    Keilspitze für den Marker tragen — flach quer breit, längs schmal, wie
    ein echter Textmarker; `twist` (die Drehung um die Längsachse) einen
    Kalligrafie-Federkiel; `tangentialPressure` das Rädchen mancher
    Stifte. Keines davon ist eine Lücke gegenüber GoodNotes — es sind
    Wünsche, und sie stehen hier, damit die Frage beim nächsten Durchgang
    nicht wieder bei null anfängt.
  · ~~**Der PDF-Export ist ein Bild je Seite**~~ — **zur Hälfte
    GESCHLOSSEN mit E506.** Die HANDSCHRIFT geht seither als echte
    `/Ink`-Annotation heraus: `/Rect`, `/InkList` im Default User Space,
    `/C`, `/CA`, `/BS` und ein `/AP`-Erscheinungsbild mit veränderlicher
    Breite. In Adobe Reader steht sie damit unter „Kommentare" und lässt
    sich anklicken, verschieben, färben und löschen. `test474` prüft es an
    zurückgelesenen Bytes.
    **Offen bleibt der Rest der Seite und die anderen Markenarten:**
    · Die SEITE selbst ist weiter ein JPEG — ihr Text ist nicht
      durchsuchbar, nicht markierbar, und ein Screenreader liest nichts.
      Dafür müsste Redion den Inhalt der Original-PDF übernehmen, statt
      ihn zu rastern; das heisst einen PDF-Leser UND -Schreiber, der
      Seitenobjekte kopiert.
    · FORMEN (Rechteck, Ellipse, Dreieck, Pfeil, Kurve) liegen als zwei
      bis drei Stützpunkte in der Ablage. PDF hätte `/Square`, `/Circle`
      und `/Line`.
    · TEXT- UND ZETTELMARKEN bräuchten `/FreeText` mit eingebetteter
      Schrift (Dossier S.10: „FreeText sollte nicht mit Handschrift
      verwechselt werden"). Heute sind sie Pixel: nicht markierbar, nicht
      kopierbar, kein Screenreader liest sie.
    · BILDMARKEN wären `/Stamp` mit eigenem Bild-XObject.
    · Das ABDECKBAND bleibt mit Absicht im Bild und soll es bleiben: eine
      Annotation liesse sich wegschieben, und darunter käme zum Vorschein,
      was abgedeckt werden sollte.
    · Und die Frage, ob die ROHDATEN (Druck je Punkt) als private Einträge
      im Annotation-Dictionary mitreisen dürfen — das Referenzdesign aus
      dem Dossier S.9. Das ist eine Datenschutzfrage (S.15): dynamische
      Handschrift ist als biometrisches Signal erforscht, und sie gehört
      nicht ungefragt in eine Datei, die weitergegeben wird.
  · **Das eigene Formelheft am TELEFON** ist ein fester Vorhang unten und
    lässt sich dort weder schieben noch in der Grösse ziehen (`.fh-fenster`
    im Block ab 640 px). Am Rechner geht beides seit E503 wirklich — dort
    war der Griff seit jeher weggemalt worden. Am Telefon ist die feste
    untere Hälfte eine bewusste Wahl (§37: ein 420-px-Fenster auf einem
    360-px-Bildschirm ist kein Fenster), aber Redurs Satz „so dass ich es
    schieben, kleiner grösser machen kann" gilt dort eben nicht. Was
    fehlt, ist eine Höhe, die sich am Griff der Kopfzeile ziehen lässt —
    ein Vorhang, den man höher und tiefer zieht, nicht ein Fenster.
  · ~~**Präsentationsmodus mit Laserpointer**~~ — **GESCHLOSSEN mit E493,
    und diese Zeile war falsch.** Präsentieren ist nicht ausserhalb des
    PDF-Teils: es ist das Zeigen des Dokuments, und es braucht weder
    Server noch Konto noch Netz. Es war mit den drei Punkten darunter in
    einen Absatz geraten und hat sich ihre Begründung geliehen.
    Gebaut: Vollbild ohne Leisten, eine Seite ganz, blättern mit Tipp und
    Taste, und ein roter Punkt, der ZEIGT und nicht schreibt — das misst
    `test463 §2` an der Zahl der Marken, nicht am Bild.
  · **Wolken-Abgleich der Dokumente**, **Freigabe-Links**, **Marketplace**
    — die brauchen wirklich einen Server (§22, §24).
  · **DOCX/PPTX-Import** — GoodNotes wandelt sie zu PDF um (nur auf
    Apple); im Browser ohne Bibliothek nicht möglich, und eine grosse
    Abhängigkeit ist keine (§6).

Gefunden beim Lesen des Dossiers gegen den Bestand, 7. September 2026.

---

L134 · Fachzeichnen: was der Leiterstift noch nicht kann
--------------------------------------------------------------------------

E509 hat die zehn Adern eines Schaltplans als eigene Farbreihe gebaut.
Was daran ehrlich fehlt:

  · **Die Ader steht nur im Strich, nicht am Blatt.** Ein Strich trägt
    `leiter: 'l1'`, aber nirgends steht das Kürzel als Beschriftung neben
    der Ader — in einem echten Schaltplan schreibt man es dazu. Wer es
    heute will, setzt eine Textmarke daneben und muss sie selbst
    mitbewegen.
  · **Der PDF-Export weiss nichts davon.** Seit E506 wird Handschrift
    eine `/Ink`-Annotation mit `/T` und `/Contents`; dort stünde die Ader
    gut („L1 — Aussenleiter"). Heute steht dort der Stiftname.
  · **Die Adernreihe ist am Telefon länger als das Bild.** Zehn Tupfer zu
    44 px sind 440 px plus Abstände; die Leiste rollt, aber man muss
    schieben, um an die Korrespondierenden zu kommen. Eine zweite Zeile
    oder ein Blatt zum Aufklappen wäre besser — beides ist ein eigener
    Bogen (§37).
  · **Kein Sammelschienen- oder Klemmensymbol.** Redurs Auftrag nannte
    nur die Adern; ein Schaltplan hat mehr. Was davon Redion wirklich
    braucht, weiss nur er.

L135 · Die Hälfte-Regel gilt jetzt an der Länge — aber nur beim Kritzeln
--------------------------------------------------------------------------

E510 hat den Kritzel-Radierer von „die Hälfte der gespeicherten Punkte"
auf „die halbe Länge" umgestellt (`InkGeometry.densify`). Derselbe
Unterschied zwischen einem dichten Strich und einer zweipunktigen Linie
steckt noch an anderen Stellen, die mit gespeicherten Punkten rechnen —
`touchesCircle` und `splitByCircle` für den gewöhnlichen Radierer messen
dagegen schon am Weg, nicht an den Punkten, und sind damit in Ordnung.
Was NICHT nachgesehen wurde: die Lasso-Auswahl (`insidePolygon` über die
Punkte einer Marke). Eine lange Linie, deren Enden ausserhalb der Schlinge
liegen und deren Mitte darin, wird dort vermutlich nicht gewählt. Vermutet,
nicht gemessen — und nach §36 heisst das: erst messen, dann bauen.

L136 · Was am Zeichnen gemessen ist — und was nicht
--------------------------------------------------------------------------

E511 hat gemessen, statt zu vermuten. Damit steht auch fest, was NICHT
gemessen ist, und das gehört hierher statt in eine Behauptung:

  · **Gemessen im Container, nicht auf Redurs Geräten.** Der Prüfrechner
    hat keine GPU und keinen echten Stift. Die 16,7 ms je Bild sind ein
    unterer Riegel („selbst hier reicht es"), keine Aussage über ein
    Telefon mit einer 300-seitigen PDF im Hintergrund.
  · **`getCoalescedEvents` ist nie mit echten Daten gelaufen.** Ein
    synthetisches Zeigerereignis trägt keine gesammelten Meldungen; der
    Weg dafür steht im Code und ist ungeprüft. Ein 240-Hz-Stift auf einem
    echten Gerät ist der einzige Weg, ihn zu prüfen.
  · **`getPredictedEvents` genauso.** Wo der Browser selbst vorhersagt,
    nimmt Redion dessen Punkte — dieser Zweig ist im Container tot.
  · **Die Zeichenkette des nassen Strichs wächst weiter mit ihm.** Ein
    1600-Punkte-Strich schreibt je Bild 94 kB `d`. In JavaScript kostet
    das gemessene 0,2 ms; was der Browser darunter an Aufwand hat, ist
    hier nicht messbar. Wenn ein echtes Gerät bei langen Strichen ruckelt,
    liegt es hier — und die Antwort wäre, den ruhenden Teil des Strichs
    von seinem laufenden Ende zu trennen. Das ist ein eigener Bogen und
    nicht ohne Not zu bauen: bei durchscheinenden Stiften (Bleistift,
    Marker) würde die Nahtstelle zweier Flächen doppelt dunkel.
  · **Der Vorlauf ist auf ein Bild bei 60 Hz eingestellt** (`VORHER_MS`
    = 14 ms). Ein 120-Hz-Schirm bräuchte die Hälfte. Die Bildrate lässt
    sich messen; getan ist es nicht.

L137 · Die Werkzeugleiste ist voll
--------------------------------------------------------------------------

E512 hat die Stiftreihe gebracht, E509 die zehn Adern. Beides wollte Redur,
beides steht — und beides kostet Platz. Was daraus offen bleibt:

  · **Oben braucht die Leiste jetzt drei Zeilen statt zwei.** E359
    versprach zwei für vierzehn Zubehörknöpfe. Sechs Stifte sind ohne ihre
    Namen rund 160 px; bei 596 px Leistenbreite ist die dritte Zeile
    Arithmetik. `test351` und `test438` messen seither „höchstens drei
    Zeilen". Der Ausweg ist gebaut (die Leiste an der Seite), aber er ist
    eine Wahl, keine Vorgabe.
  · **Am Telefon steht die erste Farbe hinter den Stiften.** Sechs Knöpfe
    zu 44 px (§37) sind 264 px auf einer 390 px breiten Leiste. Man kommt
    mit einer Wischbewegung hin; ohne Rollen sieht man sie nicht.
    Denkbar wäre eine zweite Zeile am Telefon statt einer rollenden — das
    ist ein eigener Bogen und braucht ein Bild, bevor man es baut.
  · **Der Platz der Leiste gilt für alle Blätter gemeinsam.** Wer links
    arbeitet, arbeitet überall links. Ob das je Dokument gehören sollte,
    hat niemand gefragt; bis dahin ist eine Einstellung besser als zwanzig.
  · **Die Seitenleiste liegt ÜBER dem Blatt**, wie in GoodNotes. Bei einer
    sehr schmalen Seite verdeckt sie deren linken Rand. Sie danebenzustellen
    hiesse, das Blatt schmaler zu machen — das ist eine Abwägung, die
    Redur treffen soll, kein Fehler.
  · **Die Wörter stehen erst ab 1150 px Leistenbreite, und der Rand ist
    schmaler geworden** (E515). Gemessen bei 1600 px Fenster: die dreizehn
    Werkzeuge mit Wort brauchen 1099 px von 1168 vorhandenen — 69 px Luft.
    An der Schwelle selbst (1150 px Leiste) sind es 35. Das reicht heute;
    ein vierzehntes Werkzeug mit einem langen Namen kippt die Zeile wieder.
    Wer eins hinzufügt, misst vorher — `test351 §3` sagt es sonst hinterher.
  · **Das Seitenmenü im Dokument trägt noch Emoji** (E516, Fund am Rand).
    Die dreizehn Griffe dort — ＋ ⧉ ⟳ ↑ ↓ 🔖 🗑 🖼 📷 📕 ⬇ ↗ ⌸ — sind
    dieselbe Mischung, die E515 aus der Zeichenleiste geholt hat, nur eine
    Fläche weiter. Sie stehen in `document-mode.ts` und gehören in denselben
    Durchgang; die Zeichen dafür liegen bereits im Register (`page`, `copy`,
    `trash`, `inkImage`, `inkNote`, …). Ein eigener Bogen, kein Nachtrag.
  · **Nur die sechs Stifte werden auf Ähnlichkeit gemessen** (E515,
    `test480 §7`). Die dreizehn Werkzeuge, die vierzehn Zubehörzeichen und
    die sieben Formen nicht — dort steht heute nichts zu dicht beieinander,
    aber es gibt keine Zusage, die es hielte. Der Prüflauf misst pro Paar
    in 16 × 16; ihn auf alle Zeichen des Registers auszuweiten wären über
    tausend Paare statt fünfzehn und ein spürbar längerer Lauf. Wer ein
    neues Zeichen anlegt, nimmt es in §7 auf oder sieht es sich an.

L138 · Was am Laserpointer noch fehlt
--------------------------------------------------------------------------

  · **Die Farbe ist rot und fest.** GoodNotes lässt sie wählen; hier steht
    sie im Stilblatt.
  · **Der Präsentationsmodus hat weiterhin seinen eigenen Laser** (E493).
    Er lebt auf einer anderen Fläche — einem `div` über der Vollbildseite,
    nicht auf der Zeichenschicht —, deshalb sind es zwei Wege für dieselbe
    Sache. Das ist genau das, wovor §8 warnt, und es steht hier, damit es
    nicht in Vergessenheit gerät: wer den einen ändert, muss den anderen
    ansehen.
  · **Am Telefon ist der Laser mit dem Finger nicht erreichbar**, wenn ein
    Stift gesehen wurde (die Finger-Sperre aus E354 greift vorher).
    Nachgemessen ist das nicht — es steht als Vermutung hier, und §36 sagt:
    erst messen, dann bauen.

L139 · „Eine neue PDF kopiert die aktuelle" — GESCHLOSSEN (E516)
--------------------------------------------------------------------------

**Gefunden am 9. September 2026, und es war kein Import-Fehler.**

Im Regal waren oben zwei Knöpfe zu sehen. Der eine hiess **„PDF öffnen"**
und holte die ZULETZT GEÖFFNETE PDF zurück; der andere hiess **„PDF
importieren"** und las eine neue ein. Der Knopf der Kopfleiste, der
ebenfalls „PDF öffnen" heisst und wirklich importiert, ist im Regal
ausgeblendet (`body:has(#page .bib-studio-import) #studio-import`).

Wer eine PDF öffnen will, drückt „PDF öffnen" — und bekommt seine aktuelle
PDF. Jedes Mal, völlig korrekt, und es sieht aus wie eine Kopie.

Deshalb waren die drei Messungen aus E513 sauber: sie haben gefragt, ob der
Import die richtige Datei ablegt. Er tat es immer. Die Frage, die Redurs
Satz stellte, war eine andere — welchen Knopf drückt er.

Jetzt heissen beide Importknöpfe „PDF öffnen" und die Karte „Weiterlesen".
`test482 §1` misst den SICHTBAREN Text jedes Knopfes und lässt kein zweites
„PDF öffnen" zu.

**Auch der vierte Weg ist gefahren** — „PDF hier einfügen" im Seitenmenü,
den E513 nicht öffnen konnte, weil er im Inspector sitzt: zwei Seiten
vorher, fünf nachher, zwei Quellen, fünf verschiedene Seitenbilder, und die
drei neuen tragen den Text der neuen Datei an der richtigen Stelle. Sauber.

Was in derselben Arbeit mit auffiel und behoben wurde: `pdfImportieren`
schrieb in `button.textContent` und nahm dem Knopf damit sein gezeichnetes
Zeichen (E515) — für den Rest der Sitzung, weil der Kopfknopf fest in
`index.html` steht.

<details>
<summary>Der Stand, solange die Lücke offen war</summary>


Redur, 8. September: „wenn ich oben eine neue PDF einfügen will, kopiert es
immer die aktuelle PDF."

Drei Wege gemessen (E513), alle drei sauber:

  · `ArchivImport.dateiAlsDokument` mit zwei verschiedenen PDFs — zwei
    Dokumente, zwei Quellen, 2 gegen 4 Seiten, 600 gegen 420 pt.
  · Der Kopfknopf „PDF öffnen" bei offener erster Akte.
  · Das „+" → „PDF einlesen" bei offener erster Akte.

Ungeprüft blieb der vierte: `page-add-pdf` im Seitenmenü des Dokuments
(„PDF hier einfügen", E482). Der Knopf sitzt in einem Menü, das der
Prüflauf nicht geöffnet bekam — er steht damit als EINZIGER Kandidat noch
offen, und dort wäre auch die plausibelste Ursache: dieser Weg fügt mit
Absicht IN das offene Dokument ein, und wer das nicht erwartet, sieht
danach seine alte PDF mit etwas dahinter.

Was fehlt, ist Redurs Antwort auf eine Frage: welcher Knopf, in welcher
Ansicht. Bis dahin ist der Fehler weder behoben noch widerlegt — er ist
nicht gefunden, und das ist etwas anderes als nicht vorhanden (§35).

</details>

L140 · Der Zugangscode der Chronik ist ein Türschild
--------------------------------------------------------------------------

Die sechs Ziffern stehen im Quelltext, im Klartext. Sie müssen dort stehen:
Redion läuft ohne Server, es gibt niemanden, der eine Prüfung vornehmen
könnte (§22). Wer den Quelltext liest, ist drin.

Was der Code leistet, ist das, wofür er gedacht war: die Chronik geht nicht
versehentlich auf. Was er NICHT leistet, ist Schutz vor jemandem, der ihn
sucht — und das steht hier, weil ein Passwortfeld sonst etwas verspricht,
was es nicht hält (§33).

Ein echtes Schloss gäbe es und wäre ein eigener Bogen: dieselbe
AES-GCM-Verschlüsselung, die Redion für verschlüsselte Seiten benutzt
(§19). Die Chronik läge dann verschlüsselt in der Ablage, und ohne das
Passwort im Kopf wäre sie unlesbar — auch für den, der den Quelltext hat.
Der Preis: ein vergessenes Passwort heisst eine verlorene Chronik, und
`chronik/chronik.json` müsste dann aus dem Verzeichnis heraus (§42).

L141 · Die Token je Tag fehlen in der Chronik
--------------------------------------------------------------------------

Redur hat sie ausdrücklich verlangt: „wie viele Token du genutzt hast".
Die Zahl steht der Sitzung nicht zur Verfügung — es gibt keinen Weg, sie
von innen zu lesen.

Was stattdessen da ist und wirklich gemessen wurde: Commits je Tag, Bögen,
neue Prüfläufe, Zusagen, Zeiträume aus den Commit-Zeiten und die Dauer je
Arbeit. Eine erfundene Tokenzahl wäre schlimmer als eine fehlende (§35).

Möglich wäre es von aussen: wer die Sitzungsprotokolle hat, kann sie
zählen und in `chronik/chronik.json` unter `zahlen.token` eintragen — das
Feld wird von der Ansicht gelesen, sobald es da ist.

L142 · Was am Weg auf den Laptop noch fehlt
--------------------------------------------------------------------------

E517 hat `holen.bat` einen Zweig beigebracht. Was daraus offen bleibt:

  · ~~`vergleichen.bat` sieht weiterhin nur gegen `main`.~~
    **GESCHLOSSEN mit E519** — es vergleicht jetzt gegen den Zweig, auf dem
    der Ordner steht, und `vergleichen.bat main` ausdrücklich gegen den
    geprüften Stand. Sieben git-Stellen einzeln geprüft; die vier Antworten
    von `git status -sb` in einem echten Repo gemessen statt behauptet.
  · **`hochladen.bat` ebenso.** Es lädt auf den Zweig, auf dem der Ordner
    steht — das ist heute schon richtig, aber es ist nirgends geprüft.
  · **Der Doppelklick selbst ist nicht geprüft.** Windows-Batch lässt sich
    im Container nicht ausführen; geprüft sind der Text der Datei und die
    git-Befehle darin, einzeln nachgefahren. Diese Grenze steht seit E438
    in `test353` und gilt weiter. Was sie nicht abdeckt: Anführungszeichen,
    Klammern und Umlaute in der Batch-Hülle selbst.
  · **Ein Zweig, den es auf GitHub nicht gibt**, führt zu „Auf GitHub gibt
    es keinen Zweig X" — richtig, aber ohne Vorschlag, welche es gibt. Ein
    `git ls-remote --heads` daneben wäre eine Zeile und eine Hilfe.

L143 · Die D1-Datenbank liegt im falschen Konto — offen
--------------------------------------------------------------------------

Aus dem Cloudflare-Protokoll vom 9. September, der Zeile, an der es
wirklich abbrach:

```txt
✘ [ERROR] D1 binding 'DB' references database
  '2a4f6708-b7e7-43c5-9e18-17b33713dbb9' which was not found.
  Verify the database exists in your account and that the database_id in
  your configuration is correct. [code: 10181]
```

**BERICHTIGT AM 12. SEPTEMBER 2026 — DIESER ABSATZ WAR FALSCH.**

Hier stand: „Diese Kennung steht seit E323 in `wrangler.toml` und gehört zu
keiner Datenbank in Redurs Konto (`56cd8e4d…`). Sie war nie eine echte."

Gemessen, statt weiter geschlossen zu werden. `npx wrangler d1 list`:

```txt
uuid  2a4f6708-b7e7-43c5-9e18-17b33713dbb9
name  redion      angelegt 2026-09-02      0 Tabellen
```

**Die Kennung ist echt, und es ist genau dieselbe.** Die Datenbank liegt nur
in einem ANDEREN Konto: `90a488aa2d0abf7c254f797d5b1aa575`
(redbbt7@gmail.com), während der gescheiterte Deploy gegen `56cd8e4d…` lief.
Ein Worker findet eine D1-Datenbank ausschliesslich in seinem eigenen Konto —
die Fehlermeldung „which was not found" meinte also „nicht hier", nicht
„nirgends".

Die Lehre ist die aus E21, nur von der anderen Seite: Ich habe aus einer
Fehlermeldung geschlossen, die Kennung sei erfunden, statt eine Zeile
laufen zu lassen, die es beantwortet. Zwischen „der Worker findet sie
nicht" und „es gibt sie nicht" liegt ein ganzes Konto.

**Und die Datenbank bleibt trotzdem draussen.** Redur am 12. September: „es
sollte nicht im konto redbbt7 sein". Sie im falschen Konto einzutragen,
hiesse denselben Deploy-Fehler noch einmal zu bauen. Dasselbe gilt für den
R2-Eimer `redion-dateien`, der ebenfalls dort und nicht hier steht.

**Kein Prüflauf im Container kann das schliessen.** Es braucht Redurs
Cloudflare-Konto. Drei Wege stehen offen, und die Wahl gehört ihm:

  1. **Die Datenbank anlegen.** `npx wrangler d1 create redion` gibt eine
     echte `database_id` aus; sie ersetzt die alte in `wrangler.toml`. Der
     Server kann danach alles: Konto, Abgleich, Rechte, Teilen.
  2. **Die vorhandene finden.** Gibt es sie schon unter anderer Kennung,
     nennt `npx wrangler d1 list` sie, und nur die Kennung wird getauscht.
  3. **Die Bindung stilllegen.** `[[d1_databases]]` auskommentieren — der
     Deploy geht sofort durch, und Redion läuft vollständig: der Server ist
     freiwillig (§22), und `server/cloudflare.ts` behandelt `!env.DB`
     ausdrücklich. Nur Konto und Abgleich schlafen dann.

Nachgesehen, nicht vermutet: `bedienen()` prüft `if (!env || !env.DB)` und
antwortet auf `/api/stand` auch ohne Datenbank. Weg 3 macht die App also
nicht kaputt — er macht sie zu dem, was sie ohne Server ohnehin ist.

L144 · Ein Zweig je Bogen — und was daraus wächst
--------------------------------------------------------------------------

E521 hat entschieden: ein Zweig, ein Push, dann ein neuer. Was daraus
offen bleibt:

  · **Die Zahl der Zweige wächst mit jedem Bogen.** Bei BABAT-RED sind
    daraus 265 geworden. Der Unterschied ist real — dort wurde nie
    zusammengeführt, hier holt `main` sie ein, sobald ein voller Lauf grün
    ist (§46). Aber genau dieser Lauf steht seit E511 aus: elf Bögen liegen
    auf Zweigen, `main` bewegt sich nicht. Wenn die Zahl zum Problem wird,
    ist die Antwort nicht „wieder weiterschieben", sondern `main` öfter
    vorspulen.
  · **Alte Zweige werden nie aufgeräumt.** Absicht (§43: nichts löschen
    ohne Rückfrage), aber es fehlt ein Weg, einen gemergten Zweig als
    erledigt zu KENNZEICHNEN — sonst sieht in einem Jahr niemand mehr, welche
    noch etwas tragen. Ein Präfix wie `fertig/` beim Zusammenführen wäre
    eine Möglichkeit; entschieden ist nichts.
  · **Der Name muss beim Anlegen erraten werden.** Ein Zweig wird benannt,
    bevor die Arbeit darin getan ist — der aktuelle heisst nach dem, was
    als Nächstes offen ist (`claude/redion-cloudflare-l143`), nicht nach dem,
    was daraus wird. Das geht meistens gut und wird gelegentlich daneben
    liegen. Umbenennen ist möglich, solange nichts gepusht ist.
  · **`holen-zweig.bat` schlägt den Zweig vor, auf dem der Ordner steht.**
    Nach einem Zweigwechsel hier ist das der ALTE. Redur muss den neuen
    Namen einmal eintippen — deshalb steht er ab jetzt unter jeder Meldung.
    Ein `git ls-remote --heads origin | sort` als Vorschlagsliste wäre die
    bequemere Lösung und ist nicht gebaut.

L145 · Wirkt `.assetsignore` überhaupt? — offen
--------------------------------------------------------------------------

E270 hat `.assetsignore` gebaut, E520 sie um das Persönliche erweitert, und
**beide haben die Wirkung nie gemessen**. Geprüft wurde jeweils der INHALT
der Datei (`test270 §1`, `§1b`) — ob die genannten Zeilen darin stehen.

Gemessen am 9. September mit `wrangler deploy --dry-run`, Fassung 4.130.0,
dieselbe wie auf Cloudflare:

```txt
mit den Ausschlüssen              5348 Dateien
ohne die Ausschlüsse              5348 Dateien
zusätzlich quell/ ausgeschlossen  5348 Dateien
.assetsignore ganz entfernt       5347 Dateien
```

Nicht einmal `quell/` mit seinen 305 Dateien macht einen Unterschied. **Was
das heisst, ist offen**, und es wird hier nicht behauptet:

  · Entweder wirkt `.assetsignore` in dieser Fassung an dieser Stelle
    nicht — dann wären `src/`, `pruefungen/`, eine etwaige `.env` und das
    Persönliche allesamt im Netz, sobald ein Deploy durchgeht. Das wäre
    schwer.
  · Oder „Read N files" ist der Rohscan VOR dem Filtern und sagt über die
    hochgeladene Menge nichts. Dann ist alles in Ordnung und nur die
    Messung war die falsche.

**Was dagegen spricht, dass alles offen ist:** E270 hat gemessen, dass der
Deploy OHNE `.assetsignore` an `.git/objects/pack/…` scheiterte (78,6 MB
gegen ein 25-MB-Limit). Er scheitert heute nicht daran. Etwas filtert also.

**Was dagegen spricht, dass alles in Ordnung ist:** Cloudflare las am
9. September um 09:03 noch 2264 Dateien und um 09:35 nur 2254 — zehn
weniger. Ausgeschlossen wurden zwischen den beiden Läufen aber 83
(79 unter `quell/entwicklung/`, die Chronik, die PDF, „Schul Inhalt",
`.gitattributes`). Zehn ist nicht 83.

**Wie man es entscheidet** — und keiner der Wege geht von hier aus:

  1. Ein Deploy, der DURCHGEHT (dafür muss L143 gelöst sein), und danach
     `https://<adresse>/Redur_Babat_FZ_MOE_Lehrpersonen.pdf` aufrufen.
     404 heisst: es wirkt. Ein PDF heisst: es wirkt nicht.
  2. `npx wrangler deploy --dry-run` mit `WRANGLER_LOG=debug` — im
     Protokoll vom 9. September stand der Hinweis, dass das den vollen
     Datei-Vergleich zeigt.
  3. Im Cloudflare-Dashboard unter Workers → red-ion → Assets nachsehen,
     was wirklich dort liegt.

## GEMESSEN AM 9. SEPTEMBER, 11:54 — der dringende Teil ist beantwortet

Redur hat die Adresse aufgerufen. Unter
`https://red-ion.redurbabat7.workers.dev/` steht **„Hello world"** in
Schreibmaschinenschrift — Cloudflares Standard-Worker, die Vorlage, die
beim Anlegen des Projekts entsteht.

Und auf JEDER Adresse dasselbe: `/index.html`, die persönliche PDF, die
Chronik — überall „Hello world". Das ist kein Zufall, sondern die Bauart
dieser Vorlage: sie sieht den Pfad gar nicht an und antwortet immer gleich.

**Damit ist die dringende Frage beantwortet: es ist NICHTS erreichbar.**
Weder Redion noch die persönliche PDF. Beide Deploys sind am D1-Fehler
abgebrochen (L143), es wurde nie eine Fassung aktiv, und ohne aktive Fassung
zeigt niemand auf die hochgeladenen Dateien.

Der Zustand aus E520 — „ein Zeugnis lag im Netz" — war also eine begründete
Sorge und keine Tatsache. Die Datei war hochgeladen, aber nicht ausgeliefert.
Das ist ein Unterschied, und er gehört hierher, damit niemand später den
falschen Schluss zieht.

## Was offen BLEIBT

Die eigentliche Frage — **wirkt `.assetsignore`?** — ist nicht beantwortet,
nur nicht mehr dringend. Sie wird es in dem Augenblick wieder, in dem der
erste Deploy DURCHGEHT (L143). Dann gilt:

```txt
red-ion.redurbabat7.workers.dev/Redur_Babat_FZ_MOE_Lehrpersonen.pdf
```

  · **404 oder die Startseite** → die Ausschlussliste wirkt.
  · **die PDF** → sie wirkt nicht, und dann ist es dringend.

Diese eine Adresse ist die ganze Prüfung. Sie gehört in den ersten
Durchgang nach dem ersten erfolgreichen Deploy, und sie steht deshalb hier
und nicht in einem Prüflauf — kein Lauf im Container erreicht sie.

Bis dahin gilt: **die Wirkung ist unbekannt**, und der Satz aus E520 („sie
gehen nur nicht mehr mit ins Netz") ist nicht belegt. Er steht in E522
richtiggestellt.

---

L146 · Die Startnutzlast steht über ihrer Decke — ~~offen~~ **GESCHLOSSEN am 16. September 2026 durch E613**
--------------------------------------------------------------------------

> **Geschlossen, und zwar so, wie Punkt 1 bis 3 unten es verlangt haben:
> erst die Posten gezählt, dann gehandelt, und die Decke nur mit
> geschriebenem Grund angehoben.**
>
> Gemessen am laufenden Programm: **2637 KB** am 16. September (nicht 2389 —
> die Zahl vom 9. September war sieben Bögen alt). Die 512 KB seit dem
> 5. September teilen sich in **229 KB aus 26 neuen Dateien** und **291 KB
> aus 206 gewachsenen**. Die zwei grössten Wachser sind `pdf/marken.js`
> (+68) und `pdf/document-mode.js` (+64) — das Zeichen- und das
> Schreibstudio, gewachsen weil dort gearbeitet wurde (E568–E612). Das ist
> Produkt, kein Ballast.
>
> Der eine echte Ballast war **`chronik/daten.js`**: 182 KB Chronikprosa bei
> jedem Start, für einen Bildschirm hinter einem Zugangscode. Seit E613 holt
> `chronik/laden.js` sie nach — dasselbe Muster wie pdf.js in E389.
> **2637 → 2585 KB.**
>
> Die Decke steht jetzt auf **2700** statt 2300: nicht 2600 (dann reisst sie
> beim nächsten Bogen und wird zum Rauschen), nicht 3000 (dann passte pdf.js
> wieder unbemerkt hinein). Die zweite Zusicherung `kb + 526 > DECKE` prüft
> genau das und bleibt damit eine Zusicherung.
>
> **Was offen BLEIBT, als Kandidat und nicht als Lücke:** `motion.css`
> (47,6 KB) liesse sich genauso nachladen. Dagegen spricht, dass ein
> Stilblatt beim Nachladen SICHTBAR ist — die Seite stünde einen Moment ohne
> seine Regeln da. Ein JSON-Literal hinter einem Zugangscode hat dieses
> Problem nicht. Wer es trotzdem angeht, misst zuerst, wie lange dieser
> Moment dauert.
>
> Und der zweite Fund des Bogens, der nicht hierher gehört und trotzdem
> teuer war: **die Läufe auf GitHub brechen seit Wochen nach drei Sekunden
> ab**, ohne Protokoll. Deshalb ist diese Lücke zwölf Tage lang rot
> dagestanden, ohne dass jemand es merkte. Das ist Konto-Ebene und kein
> Codefehler — aber solange es so ist, ist „die CI hätte es gefunden" keine
> Aussage über Redion.

*Der ursprüngliche Eintrag vom 9. September, unverändert:*

`test388 §5` deckelt, was der Start überhaupt holt, auf **2300 KB gzip**.
Gemessen am 9. September: **2389 KB über 225 Dateien.** Der Lauf ist damit
rot, und zwar nicht seit heute.

**Woher die Zahl kommt.** Die Decke wurde am 4. September auf 2300 gesetzt,
als der Start 2081 KB holte — mit Absicht mit Luft. Diese Luft ist
aufgebraucht:

```txt
 4. September (E389)      2081 KB   Decke gesetzt: 2300
 9. September, vorher     2379 KB   79 KB über der Decke
 9. September, E525       2389 KB   +10 KB: die Marke im Kopf (8,7 KB)
 9. September, E526       2396 KB   +7 KB: wischen.js
```

**Die siebzehn Kilobyte aus E525 und E526 sind meine, und sie sind der
kleinere Teil.**
Die 79 davor sind über mehrere Bögen dazugekommen, ohne dass jemand
hingesehen hat — genau das, wogegen die Decke gebaut wurde.

**Was zu tun ist**, in dieser Reihenfolge:

1. **Nachsehen, was seit dem 4. September dazugekommen ist.** Die 225
   Dateien einzeln nach Grösse auflisten; die Decke ist eine Summe, und
   Summen haben Posten. Ohne diese Liste ist jede Massnahme geraten.
2. **Erst dann entscheiden**, ob etwas später geladen werden kann (wie
   pdf.js in E389), ob etwas zusammengelegt gehört, oder ob die Decke mit
   geschriebenem Grund steigt.
3. **Nicht** die Decke anheben, weil der Lauf rot ist. Eine Decke, die
   nachgibt, sobald sie greift, ist keine.

Was hier NICHT hingehört: die 1,6 MB der Symbole aus E525. Der Start holt
davon nur `favicon-16` und `favicon-32` (zusammen 3 KB); die grossen
Symbole holt das Betriebssystem beim Installieren, nicht der Browser beim
Öffnen.

---

L147 · Innerhalb der Lernwelt umschalten meldet den Ort nicht neu — offen
--------------------------------------------------------------------------

Gefunden beim Bau des Wischens (E526), als Rest des dort behobenen Fehlers.

Die untere Leiste liest den Schauplatz, und den rechnet `schale.ts` aus dem
TITEL, unter dem sich ein Bildschirm über `App.zeigeSonder` anmeldet. E526
hat `lernwelt.ts` beigebracht, zwei Titel zu benutzen statt einem: „Heute"
für die Tagesansicht, „Lernzentrum" für die übrigen zehn.

**Das gilt aber nur beim Öffnen.** `wechseln()` schaltet die Ansicht
innerhalb der Welt um — über die Navigation im Lernzentrum — und ruft
`zeigeSonder` NICHT noch einmal. Der Titel bleibt der vom Öffnen:

```txt
über „Heute" hereinkommen  →  Titel „Heute"  →  unten „Heute"   richtig
drinnen auf „Lernweg"      →  Titel „Heute"  →  unten „Heute"   falsch
```

**Was zu tun ist:** `wechseln()` muss den Schauplatz neu melden. Der Weg
dafür existiert — `App.zeigeSonder` mit dem neuen Titel —, aber er zeichnet
die Welt neu, und genau das soll `wechseln()` nicht: es tauscht nur den
Inhalt aus. Es braucht also entweder einen schmalen Weg „nur den Titel
ändern" in der Schale, oder `wechseln()` geht über `zeigeSonder` und die
Welt muss ein Neuzeichnen vertragen.

**Warum es hier steht und nicht behoben ist:** beides ist ein eigener Bogen
mit eigener Prüfung. Der Fall aus E526 — über die untere Leiste auf „Lernen"
tippen — geht IMMER über `oeffnen()` und ist damit vollständig behoben; das
hier trifft nur, wer drinnen weiterklickt.

---

L148 · Die Marken-Decke steht zehn zu tief — offen
--------------------------------------------------------------------------

`pruefungen/marken-decke.json` hält fest, wie oft rohe Pixelwerte in den
Stildateien stehen, und die Regel dazu ist streng: **genau gleich, nicht
höchstens** (`test362 §7`). Wer eine rohe 44px durch die Marke ersetzt, sieht
den Lauf rot und trägt die kleinere Zahl nach; wer eine hinzufügt, ebenso.

Gemessen am 9. September, mit derselben Zählung wie im Prüflauf, einmal
gegen den letzten Commit und einmal gegen den Arbeitsbaum:

```txt
Wert |  Decke |  HEAD |  jetzt
  16 |    246 |   253 |    253
  22 |     77 |    78 |     78
  28 |     56 |    56 |     56
  44 |    153 |   155 |    155
  46 |     14 |    14 |     14
  56 |     12 |    12 |     12
```

**HEAD und Arbeitsbaum sind gleich.** Die Abweichung von zehn ist also
älter als E526 und stammt aus früheren Bögen — jemand hat rohe Werte
hinzugefügt, ohne die Decke nachzuziehen, und der Lauf steht seither rot.

**Was NICHT zu tun ist:** die Zahlen einfach hochsetzen. Damit wäre der
Lauf grün und die Decke um zehn gestiegen — genau das, was sie verhindern
soll. Das Verzeichnis darf nur schrumpfen.

**Was zu tun ist:** die zehn Stellen finden (`git log -p` über
`quell/schale/stil/` seit dem letzten Stand der Decke) und je Stelle
entscheiden, ob dort eine Marke hingehört. `--radius-xl` ist 16, `--touch-min`
und `--table-row-touch` sind 44 — für die meisten wird es eine geben. Was
wirklich keine Marke braucht (ein Zeichen, das zufällig 44 px misst), wird
eingetragen; dann steigt die Decke mit geschriebenem Grund statt still.

E526 selbst ist auf null: die zwei rohen `22px` der Kapsel sind durch
`var(--radius-2xl)` ersetzt, und ihr Radius wird aus `--mobile-nav-height`
gerechnet statt als Zahl wiederholt.

### Nachgemessen am 13. September (E554) — der Abstand ist gewachsen, und er war von Anfang an da

```txt
Wert |  Decke |  jetzt |  Abstand
  16 |    246 |    260 |   +14
  22 |     77 |     86 |    +9
  28 |     56 |     59 |    +3
  44 |    153 |    168 |   +15
  46 |     14 |     15 |    +1
  56 |     12 |     14 |    +2
```

**Und der Befund, der hier vorher fehlte:** die Decke war schon bei ihrem
letzten Schreiben nicht synchron. Der Commit, der `marken-decke.json` zuletzt
angefasst hat, ist E509/E510 — und an genau jenem Commit nachgezählt standen
in den Stildateien **252 / 81 / 58 / 160 / 14 / 18**, nicht die eingetragenen
246 / 77 / 56 / 153 / 14 / 12. Die Zahlen wurden also nie gegen die Wirklichkeit
gemessen, sondern von woanders übernommen. Bei `56` stand die Decke damals
sogar SECHS zu tief.

Das ändert, was zu tun ist: es sind nicht „zehn Stellen seit dem letzten
Stand", sondern zwei getrennte Sachen — die Stellen, die seit E509 wirklich
dazugekommen sind, und ein Anfangsfehler in der Decke selbst.

**Die fünf Folienbögen E549 bis E553 tragen null dazu bei.** Nachgezählt über
jeden der fünf Commits, nur `quell/schale/stil/`: keine einzige hinzugefügte
Zeile enthält einen der sechs gezählten Werte. Das neue Folienband benutzt
`var(--touch-min)`, `var(--space-*)` und `var(--radius-*)`. Es ist also weiter
nicht dieser Arbeit anzulasten — aber jetzt steht die Zahl dafür da, statt
nur die Behauptung.

---

L149 · Die Bögen E532/E533 sind ohne eigene Prüfläufe gebaut — offen
--------------------------------------------------------------------------

Redur hat am 12. September 2026 entschieden: „baue es so schnell wie
möglich alles ohne viel test machen" (E533). Gebaut und typgeprüft ist
alles, die App startet, die Einzeldatei ist neu — aber **kein einziger
Prüflauf hält die neuen Wirkungen**, und keine Gegenprobe war rot.

Was nachzuholen ist, je Stelle ein Lauf nach dem Muster von `test495`:

- E532: Glasknopf-Körper wirklich sichtbar (`getComputedStyle` des
  `.fbtns button.prim` zeigt den `inset`-Schatten des Attributs, nicht
  den der Klassenregel); `.pf-karte::after` hat `content`; Regler-Knauf
  hat Rand und Schein; Funkel-Hover ist heller als Fokus.
- E533, je Block: Markup vorhanden (`ensure`-Kinder), im Leerlauf
  `animationName === 'none'` an jedem neuen Element (das ist der Wächter
  aus `test494`, der hier erweitert gehört), bei Aktivität/Hover die
  benannte Animation genau einmal bzw. endlich, `prefers-reduced-motion`
  stellt alles still.
- Bilder je Zustand (§55.3): aus/an, Ruhe/Hover, hell/dunkel — die zwei
  Fehler, die in E525 und E531 nur das Bild fand, sind der Grund.

Bis dahin gilt für E533 ausdrücklich: **eine Behauptung, kein Beleg.**

**Berichtigung vom 12. September, abends:** Dieser Eintrag sagte oben
„gebaut und typgeprüft ist alles". Das stimmte für E532 und stimmte für
E533 **nicht** — der erste Bauanlauf mit zehn gleichzeitigen Agenten starb
geschlossen am Sitzungslimit (HTTP 429), acht ohne eine Zeile, zwei mit
gerade noch geschriebenem Fragment. Gebaut wurde daran nichts, und der
Satz war vorab geschrieben statt nachgezogen. Der zweite Anlauf läuft
unter **E535**; was dort landet, braucht dieselben Nachweise wie oben.

**Teilnachweis E534 (auf ad4ccbc, 12. September):** `test496` hält nun
den echten Glasknopf-Schatten, Statistikherz, kollisionsfreie Ringposition
auf schmalen Karten und die zustandsgebundene Ticket-Wendekarte. Die
fehlenden Elemente und die beiden CSS-Fehler wurden zuerst rot gesehen,
danach 148 Zusagen grün. Damit ist L149 nur teilweise bearbeitet:
Pflegekarten-Lichtschlitz, Regler-Knauf und Funkel-Abstufungen haben hier
noch keine eigenen Gegenproben; die pauschale E533-Bauzusage ist nicht
durch diese vier Ergänzungen bewiesen. Auch ein vollständiger Gesamtlauf
und physische Safari-/Chrome-Geräteprüfungen bleiben ausstehend.

---

L150 · §5 Regel 1 hat keinen Wächter — ~~offen~~ **GESCHLOSSEN am 19. September 2026 durch E626 (test537) — mit einer Richtigstellung**
--------------------------------------------------------------------------

CLAUDE.md §5 Regel 1 ist **[hart]**: „Bereiche importieren sich nicht
gegenseitig." Darunter stand ein Satz, der nicht stimmte: „Der Wächter dafür
ist `test87`."

**Nachgemessen am 12. September 2026.** `test87` prüft rohe Steuerzeichen,
den Abgleich der Rollen zwischen Oberfläche und Server, die A1/A2-Grenze
(`seitenleiste.js`, `kopfleiste.js` und `inhaltsflaeche.js` rufen `App` nicht
an), die Reihenfolge der Stilblätter, das Manifest, `esc`, das Schema, ein
paar globale Namen, Base64, Umlaute und die beiden `.bat`. Ein Bereich, der
einen anderen anfasst, kommt darin nicht vor.

**Und die Regel beschreibt einen Mechanismus, den es hier nicht gibt.**
Gezählt: `grep -rh "^import " src/bereiche --include=*.ts | wc -l` → **0**.
Kein einziger Import in keinem Bereich. Geladen wird über 208 `<script>` in
`index.html`, geredet wird über globale Namen. Das `import`-Beispiel in §5
kann also gar nicht auftreten; brechen lässt sich die Regel heute nur so:

```js
// irgendwo in bereiche/editor/…
Bibliothek.oeffneRegal(id)        // ein fremder Bereich über seinen globalen Namen
```

**Was zu tun ist:** ein Lauf, der die globalen Namen der Bereiche gegen
einander prüft — für jeden Bereich die Namen sammeln, die er anbietet, und
in seinen Dateien nach den Namen der anderen suchen. Das Muster dafür steht
fertig in `test87` §3 (`nurCode()` entfernt Kommentare und Zeichenketten,
damit die Prüfung das Programm liest und nicht die Prosa) — dort für `App`,
hier für jeden Bereichsnamen.

**Vorher messen, ob er rot werden kann** (§55.2): heute hält die Regel,
gemessen über alle `src/bereiche/*/` — es gibt keinen Querverweis. Ein Lauf,
der auf einem sauberen Bestand geschrieben wird, ist genau der Fall, in dem
eine Prüfung für immer grün bleibt, weil sie das Falsche misst. Also zuerst
einen Querverweis von Hand einsetzen, rot sehen, wieder herausnehmen.

Bis dahin steht die Regel ohne Beweis da — und stand es, seit sie
geschrieben wurde.

---

L151 · Was beim PowerPoint-Lesen NICHT ankommt — offen
--------------------------------------------------------------------------

E540 liest `.pptx`: Folien in der richtigen Ordnung, Textkästen mit Lage,
Grösse, Schriftgrad und Fett, Bilder mit ihren Bytes. Das ist der erste
Schritt, nicht der letzte. Was heute **nicht** ankommt, damit niemand es für
verloren hält:

- ~~**Geerbtes vom Layout und vom Master.**~~ **GESCHLOSSEN mit E558** für
  die drei Dinge, die man sieht: Lage, Schriftgrad und Hintergrundfarbe
  werden über `Folie → Layout → Master` geerbt, verbunden über `.rels` und
  nicht über Dateinamen. Vorher stand `slideLayout` und `slideMaster` kein
  einziges Mal im Leser — eine Folie, die selbst nichts angibt (also jede,
  in die nur getippt wurde), bekam eine geratene Stelle und 40 pt. **Offen
  bleiben darin**: Fusszeilen und Foliennummern aus dem Master (sie sind
  Platzhalter OHNE Text, und ihr Inhalt käme erst aus `p:hf`) sowie das
  Farbthema — eine `schemeClr` bleibt bewusst liegen, weil sie ohne
  `theme1.xml` nicht auflösbar ist und eine falsche Hintergrundfarbe
  schlimmer wäre als keine. **Und der Preis davon steht gleich mit dabei**:
  ein Absatz ohne eigene Farbe bekommt auf einem dunklen geerbten Grund
  ausdrücklich Weiss — gerechnet über den WCAG-Kontrast gegen `#111111`,
  Schwelle 4,5:1 (§38). Das ist keine Themenfarbe, sondern nur die
  Untergrenze der Lesbarkeit; die echte Farbe käme erst aus `theme1.xml`.
- ~~**Ein Schriftgrad je Kasten.**~~ **GESCHLOSSEN mit E557** für den Fall,
  der zählt: je ABSATZ werden Grad, Gewicht und Farbe gelesen, und wo sie
  auseinandergehen, entsteht eine Marke je Absatz. Gemessen vorher:
  „klein"(12) + „GROSS"(36, fett, blau) kam als eine Marke in 12 pt schwarz
  an. ~~**Offen bleibt der Fall darin**: gemischte Läufe INNERHALB eines
  Absatzes.~~ **GESCHLOSSEN mit E561**: die Textmarke trägt jetzt optional
  `laeufe` — mehrere Formate in einem Absatz, jedes mit eigenem Grad,
  Gewicht und eigener Farbe. Die Stücke werden von SVG selbst gesetzt, nicht
  gerechnet (siehe L155). Eine Marke OHNE das Feld geht unverändert den
  alten Weg, und ein Absatz, dessen Läufe alle dasselbe Format haben,
  bekommt gar keins — der Normalfall bleibt damit wörtlich der alte.
- ~~**Absatzebenen und Aufzählungszeichen.**~~ **GESCHLOSSEN mit E557**:
  `a:pPr@lvl` rückt ein (und verschmälert den Kasten entsprechend),
  `a:buChar` kommt als Zeichen davor, `a:buNone` unterdrückt es. `buAutoNum`
  bekommt ein neutrales „·" — die echte Nummer käme erst aus der Absatzfolge,
  und eine falsche Nummer wäre schlimmer als ein neutrales Zeichen.
- ~~**Ausrichtung** (`a:pPr@algn`).~~ **GESCHLOSSEN mit E560**: `ctr` und `r`
  werden gelesen, gezeichnet (SVG-Anker, jede Zeile eines umbrechenden
  Absatzes) und sind über einen eigenen Knopf in der Zeichenleiste auch von
  Hand setzbar — die Lücke war nie nur eine Importlücke. **Offen bleibt der
  Blocksatz**: `just` und `dist` kommen linksbündig an, weil die
  Markenschicht keine gestreckten Wortabstände kann. Links ist die Kante,
  die der Blocksatz mit ihr teilt; zentriert wäre an jeder Zeile falsch.
- ~~**Tabellen (`a:tbl`)**~~ **GESCHLOSSEN mit E565**: eine Tabelle kommt als
  Gitter auf die Folie — ein Rechteck und ein Text je Zelle, mit Zellfüllung,
  Textfarbe und `gridSpan`. Sie wird bewusst KEIN Tabellenblock: eine Folie
  ist ein Blatt mit Marken, und die Tabelle herauszunehmen hiesse, die Folie
  anders aussehen zu lassen als das Original.
  **Offen bleiben davon**: Zellränder mit eigener Farbe und Stärke
  (`a:lnL`/`a:lnR`/…) und `vMerge` über mehrere Zeilen, wenn kein `rowSpan`
  dabeisteht.
- **Diagramme.** Werden weiter übersprungen und genannt („NICHT übernommen:
  1 Diagramme"). Ein fremder Zeichner hätte sie auf einen Schlag gelöst;
  Redur hat ihn am 13. September abgelehnt (**E564**), und die Gründe stehen
  dort. Der Weg ist damit: selbst lesen, und wer es exakt sehen will, nimmt
  den PDF-Weg.
- ~~**Formen ohne Text** (Pfeile, Rechtecke, Linien aus `a:prstGeom`).~~
  **GESCHLOSSEN mit E566** für die Formen, die Redion kennt: `rect`,
  `roundRect`, `ellipse`, `triangle` und `line` kommen mit Füllung, Umriss
  (`a:ln`) und Drehung an — und liegen UNTER dem Text. **Gefunden an Redurs
  echter Datei**, nicht an einem Prüfstück: der dunkelblaue Kasten hinter
  einem Titel und ein roter Balken fehlten beide, und ohne sie steht der
  Titel im Nichts.
  **Offen bleibt alles andere**: über hundert PowerPoint-Formen haben in der
  Markenschicht kein Gegenstück. Sie werden gezählt und genannt („NICHT
  übernommen: 1 Formen") statt geraten — ein Stern als Rechteck wäre
  schlimmer als ein Stern, der fehlt.
- ~~**Die Schriftart** (`a:latin@typeface`).~~ **GESCHLOSSEN mit E567**:
  gelesen aus dem Lauf, aus dem `a:defRPr` des Layouts und über
  `+mj-lt`/`+mn-lt` aus dem Schriftpaar des Themas — der dritte Weg ist der
  häufigste, PowerPoint schreibt fast immer so. Die Zuordnung auf Redions
  fünf Familien ist eine Näherung, die nur in EINE Richtung irrt: was nicht
  erkannt wird, bleibt `standard`, also der heutige Zustand.
  **Offen bleiben zwei Dinge**: zwei Schriften in EINER Zeile (die Marke hat
  eine Familie für alle ihre Stücke — zwischen Absätzen geht es), und jede
  Schrift, die weder in der Liste steht noch ihren Charakter im Namen trägt
  („Optima" ist serifenlos, „Rockwell" hat Serifen). Wer eine vermisst,
  trägt sie in `SCHRIFT_SERIF` und die drei Nachbarlisten ein.
- ~~**Drehung** (`a:xfrm@rot`).~~ **GESCHLOSSEN mit E563**: gelesen für
  Text, Bild und Abdeckung, in 60000steln Grad, auf 0…360 gebracht, gedreht
  um die Mitte des Kastens. Sie erbt bewusst NICHT vom Layout — dass eine
  Form schief steht, ist eine Entscheidung der einzelnen Folie.
  **Offen bleiben**: Spiegelung (`flipH`/`flipV` — die Marke hat kein
  allgemeines Spiegeln) und die Drehung einer GRUPPE. Für die zweite müsste
  `abbilden` die Kindpositionen mitdrehen; nur den Winkel durchzureichen
  wäre schlimmer als nichts.
- **Notizen** (`ppt/notesSlides/`), Übergänge, Animationen.
- ~~**Das Farbthema** (`ppt/theme/theme1.xml`).~~ **GESCHLOSSEN mit E559**:
  `schemeClr` wird über `p:clrMap` (die Stufe, die man vergisst) und
  `a:clrScheme` aufgelöst, `sysClr` über `lastClr`, dazu `lumMod`, `lumOff`,
  `tint` und `shade`. Nachgemessen an PowerPoints eigenen Feldern: „Dunkler
  25 %", „Heller 40 %" und „Dunkler 50 %" von `accent1` stimmen auf das Byte.
  **Offen bleiben davon drei Kleinigkeiten:**
  - `phClr` — die Farbe des Platzhalters, der eine Vorlage benutzt. Sie steht
    nirgends in der Datei und ist nicht auflösbar; sie bleibt leer.
  - `alpha` (Durchsichtigkeit), `satMod` und `hueMod` werden nicht gerechnet.
    Für `alpha` hat die Markenschicht ohnehin kein Gegenstück.
  - `tint`/`shade` rechnet Redion linear auf dem Kanal. Das ist die
    verbreitete Auslegung, aber — anders als `lumMod`/`lumOff` — **nicht
    gegen eine PowerPoint-Ausgabe nachgemessen**. Wer eine Datei hat, in der
    eine Tönung sichtbar danebenliegt, hat den Beleg, der hier fehlt.

**GEMESSEN am 12. September**, an einer echten Datei von Redur
(27 Folien, 36 Bilder, 11 Layouts, 4:3, beide Packmethoden gemischt). Sie
liest sich in 385 ms ohne einen Browserfehler, die Bilder sitzen an ihrem
Platz, und die gerenderte Folie entspricht dem Original. Vier Funde daraus
stehen in E541.

### Einer der Punkte oben war schlimmer als „fehlt" — GESCHLOSSEN mit E555

**Gruppen (`p:grpSp`) standen hier gar nicht**, und sie waren der einzige
Punkt mit Datenverlust-Rang. Die Schleife lief über `baum.children` und
kannte `p:sp` und `p:pic`; eine Gruppe fiel durch beide Siebe, mit allem
darin. An einer eigens gebauten Datei gemessen:

```txt
gruppierter Deckel   →  DIE ANTWORT STAND OFFEN
Gruppe mit Text+Bild →  0 Marken
Hinweis              →  „1 Folien übernommen", kein Wort davon
```

Derselbe Fehler wie E541, eine Verschachtelung tiefer. Seit E555 wird
rekursiv gelesen, samt der Abbildung von `a:chOff`/`a:chExt` (eine Gruppe
darf ihren Inhalt skalieren) und einer Tiefenbremse bei acht Ebenen.
`test511` hält es, drei Gegenproben gefahren.

### Und die Reihenfolge für den Rest, nach Nutzen (untersucht, nicht geraten)

1. **Format je Absatz statt je Kasten.** Heute nimmt der Leser
   `txBody.getElementsByTagName('a:rPr')[0]` — den ersten Lauf der ersten
   Zeile — für den GANZEN Kasten. Gemessen: „klein"(12 pt) + „GROSS"(36 pt,
   fett, kursiv, unterstrichen, blau) kommt als EINE Marke „klein GROSS" in
   12 pt normal an. Ein roter Titel (`srgbClr CC0000`) kommt schwarz. Drei
   Aufzählungsebenen kommen als ein flacher Block. Rund 60 Zeilen, kein neues
   Markenfeld — die Textmarke kann `farbe`, `fontSize`, `fett` und
   `breiteBox` längst.
2. **Tabellen** als Tabellenblock statt als Hinweiszeile.
3. **Layout und Master** — der grösste Brocken, weil er ein zweites
   Auflösungssystem braucht.

**Weiter nicht gemessen:** eine Datei aus LibreOffice Impress und eine aus
Google Slides. Beide schreiben gültiges OOXML, aber anders — vor allem bei
Platzhaltern und geerbten Schriftgraden. Je eine Prüfung wert.

---

L152 · Eine Präsentation aus Bildern bringt keinen Text mit — offen
--------------------------------------------------------------------------

An Redurs Lehrunterlage gemessen (12. September): 27 Folien, 237 Formen —
und **vier** Textstücke je Folie, allesamt Kopf- und Fusszeile. Der ganze
Lehrinhalt sind **Bilder**: Tabellen, Diagramme, Formeln, Kennlinien. Die
zwölf Formen einer Folie sind leere Rechtecke.

Der Leser arbeitet dabei richtig — es ist schlicht kein Text da. Aber die
Folge ist ernst: eine so gebaute Präsentation lässt sich in Redion **nicht
durchsuchen**, ihr Text ist nicht vorlesbar (§38), und „den Text ändern"
geht an ihr nicht, weil es keinen gibt.

**Was das hiesse:** Text in einem Folienbild sichtbar zu machen, ist OCR —
und den Dienst hat Redion bereits (`bereiche/dateien/recognition.ts`, lokal
und opt-in). Eine eingelesene Folie durch die Texterkennung zu schicken wäre
der Weg; er ist nicht gebaut, und er kostet Rechenzeit je Folie.

**Nicht als Fehler behandeln:** Eine Präsentation aus Bildern ist eine
zulässige Präsentation. Was Redion tun muss, ist es zu SAGEN — nicht so zu
tun, als sei die Folie leer.

---

L153 · Der Klick schaltet die Folie weiter — GESCHLOSSEN bis auf die Pfeile
--------------------------------------------------------------------------

**Geschlossen am 12. September 2026 mit E544** (`test500`, 45 Zusagen, vier
Gegenproben gefahren). Was hier stand und jetzt gebaut ist:

- **Der Schrittzähler.** Ein Klick irgendwo auf die Folie deckt alle
  Abdeckungen mit `schritt <= n` auf; erst wenn keine mehr aussteht, kommt
  die nächste Folie. Zurück landet auf der vollen Folie, wie in PowerPoint.
- **Der Übergang.** Der Deckel löst sich auf, statt zu verschwinden — ein
  `transition`, kein `@keyframes`, im Leerlauf bewegt sich nichts (E528).
- **Die Entscheidung, die hier offen stand:** Der Schrittstand wird NICHT
  gespeichert. E266 sagt „Lernen darf den Speicher nicht anfassen", und das
  ist dieselbe Frage.

**Und ein Fehler, den diese Lücke nicht kannte, war der grössere.** Bevor
ein Schrittzähler zählen kann, muss es Folien geben. Eine eingelesene
PowerPoint-Datei war EINE Folie mit 27 Blättern übereinander — gemessen, und
auf `bilder/l153-vorher.png` zu sehen. `EIGENE_FOLIE` im Kern gibt jedem
Blatt und jeder PDF-Seite eine eigene Folie. Dazu füllt ein Blatt jetzt die
Leinwand statt acht Prozent davon; die Regel dafür brauchte drei Anläufe,
zwei davon sahen an genau einer Bildschirmgrösse richtig aus (E544).

**Und der Verlauf am Deckel: GESCHLOSSEN am 13. September mit E545**
(`test501`, 29 Zusagen, fünf Gegenproben gefahren). Er liegt als Feld
`verlauf` an der Marke und als EIN `<defs>` am Blatt — keine Gruppe um die
Marke, die hätte vier Stellen gebrochen, drei davon still. Es waren am Ende
nicht zwei Zeichner, sondern vier. Dazu zwei Funde, die hier nicht standen:
der Deckel wäre bei fehlender Vorlage UNSICHTBAR geworden — also eine offene
Antwort, und damit genau der Schaden, den ein Abdeckband verhindern soll;
dagegen steht jetzt immer die feste Farbe daneben. Und eine Markenkennung
mit einem Leerzeichen darin machte ihn schwarz, gefunden nur auf dem Bild.

**Was offen bleibt — eine einzige Sache, und die ist Redion fremd:**

- **Die Navigationspfeile der Folie fehlen.** Unten rechts stehen im
  Original drei blaue Pfeile (zurück, eine Folie zurück, weiter). Es sind
  Formen ohne Text und ohne Animation, also weder Textkasten noch Abdeckung
  — sie fallen durch beide Zweige. Für Redion sind sie ohnehin fremd: das
  Blättern macht dort der Vortragsmodus, und seit E544 macht es der Klick.

---

L154 · Das Blatt „Neu erstellen" ist eine Liste geworden — offen
--------------------------------------------------------------------------

Hinter dem „+" liegt seit E45 ein Blatt, das FRAGT, was entstehen soll,
statt sofort eine leere Seite anzulegen. Der Gedanke war ein **Wegweiser**:
es zeigt alles, was Redion kann, auch dem, der nicht weiss, dass es
Karteikarten gibt.

`test114` trägt diese Frage seit E236 mit: „Wegweiser oder Liste?" Bei
einundzwanzig Wegen stand dort, der nächste Zuwachs brauche eine Antwort,
nicht nur eine neue Zahl. E549 hat den zweiundzwanzigsten gebracht (die
Präsentation) — hier ist die Antwort, gemessen bei 428 × 926, das Blatt
offen, bevor gerollt wird:

```txt
22 Wege in 6 Überschriften
Liste 757 px hoch, Inhalt 1787 px          →  sie rollt
ohne zu rollen sichtbar:  10 von 22
nach dem Rollen ans Ende: der letzte Weg liegt ganz darin, 64 px hoch
```

**Zehn von zweiundzwanzig.** Damit ist die Frage beantwortet, und zwar mit
„Liste". Ein Wegweiser zeigt, was es gibt; dieses Blatt zeigt noch ein
Drittel davon, und die anderen zwei Drittel findet nur, wer rollt — also
genau der nicht, für den das Blatt gebaut wurde.

**Was hier NICHT die Lösung ist:** einen Weg wegnehmen. Jeder davon ist eine
echte Funktion, und die verschwindet nicht, weil eine Liste lang wird (§47).
Eine kürzere Liste wäre kein besserer Wegweiser, sondern ein kleineres
Redion.

**Was die Lösung wäre** (offen, keine davon ist entschieden):

- **Zusammenklappbare Gruppen.** Sechs Überschriften, zugeklappt, sind sechs
  Zeilen — alles auf einem Bild. Kostet einen Tipp pro Weg.
- **Ein Suchfeld oben.** Wer „Kartei" tippt, ist da. Hilft aber nur dem, der
  den Namen schon kennt — und das ist nicht der, für den das Blatt da ist.
- **Zwei Ebenen:** die sechs Gruppen als Kacheln, dahinter die Wege. Am
  nächsten an dem, was das Blatt sein wollte; der grösste Umbau.

**Was bis dahin gilt und geprüft ist:** `test114` hält seit E549 zwei
Zusagen, die für eine rollende Liste gelten — dass sie wirklich rollt und
dass ihr letzter Eintrag unten ankommt (64 px, ganz sichtbar). Beide
Gegenproben gefahren, beide rot geworden. Das macht aus der Liste keinen
Wegweiser; es hält nur fest, dass niemand unten abgeschnitten wird.


L155 · Die Breitenschätzung für Text lag zu niedrig — GESCHLOSSEN mit E562
--------------------------------------------------------------------------

`InkGeometry.textWidth` rechnet die Breite eines Textes aus einer Tabelle
von Buchstabenbreiten (`geometry.ts:237`): ein Grundwert je Schriftfamilie,
mal einem Faktor für schmale Zeichen (`.,:;ijlt`), breite (`mwMW`) und
Grossbuchstaben, mal 1,06 für fett. Daraus entsteht der Zeilenumbruch
**jeder** Textmarke in Redion.

**Gefunden am 13. September 2026 — durch ein Bild, nicht durch eine
Prüfung.** Eine Folie mit gemischten Formaten (E561) zeigte eine Zeile, die
über den Blattrand hinauslief, obwohl die Schätzung sagte, sie passe.

### Nachgemessen mit `canvas.measureText`, gegen denselben Schriftstapel

```txt
Text                              echt      geschätzt   Verhältnis
„Ein Satz mit "                    6,31 em     6,00        1,05
„einem hervorgehobenen Wort" fett 16,88 em    14,89        1,13
„ mittendrin, der über mehrere"   15,02 em    13,09        1,15
„Zeilen läuft und dabei sein …"   21,00 em    19,22        1,09
„GROSS" fett                       3,84 em     3,88        0,99

ganze Zeile bei 18 pt:  echt 688 pt · geschätzt 611 pt · Kasten 636 pt
```

Es ist also **nicht nur der Fett-Faktor**, sondern das Modell insgesamt, und
die Abweichung schwankt zwischen 0,99 und 1,15. Eine Zeile, die den Kasten
ausfüllt, läuft dadurch um rund ein Achtel darüber hinaus.

### GESCHLOSSEN mit E562 — und zwar auf dem zweiten Weg

Bei E561 blieb das hier bewusst liegen: die Zahl steuert den Umbruch jeder
Textmarke, auch jeder alten Notiz, und das ist eine eigene Arbeit mit
eigener Prüfung (§45). E562 ist diese Arbeit.

**Keine bessere Konstante.** Die Abweichung schwankt je nach Text zwischen
0,99 und 1,15; ein einziger Faktor verschöbe den Fehler nur. Stattdessen
wird im Browser **exakt gemessen** (`canvas.measureText`, bei 100 px
gemessen und geteilt, gemerkt je Text und Format). Die Tabelle bleibt der
Rückfall für Node, wo es kein Canvas gibt; `InkGeometry.gemessenAn()` sagt,
welcher Weg gerade gilt.

Geprüft wird nicht eine Zahl, sondern der Satz, den der alte Weg gebrochen
hat: **keine gezeichnete Zeile darf breiter sein als ihr Kasten**
(`test517` §3, gemessen mit `getComputedTextLength` am echten SVG). Die
Gegenprobe mit der alten Schätzung nennt zwei Übertreter von 21 Zeilen.

**Was seit E561 NICHT mehr davon abhängt:** die Stelle, an der ein Stück
eines gemischten Absatzes gezeichnet wird. Die kommt jetzt von SVG selbst —
nur das erste Stück einer Zeile bekommt ein `x`, die übrigen fliessen. Die
Schätzung entscheidet weiterhin, WO umgebrochen wird, aber sie schreibt
keine Stelle mehr ins Bild.


L156 · Eine tote Regel im Stilblatt fällt niemandem auf — offen
--------------------------------------------------------------------------

**Gefunden am 14. September 2026** beim Umbau der Stiftleiste (E568).

Drei Eigenschaften standen im Stilblatt, waren richtig geschrieben, und
galten nie:

```txt
.blatt-farbe{width:22px}          geschlagen von min-width:36px
.blatt-farbe{border-radius:50%}   geschlagen von .blatt-werk button{…:6px}
background-clip:content-box       zurückgesetzt von style="background:…"
```

Die ersten zwei seit E351 (eingeführt am 8. September), die dritte im
Studio seit E554. Auf dem Bildschirm standen dadurch Kacheln, wo Tupfer
gemeint waren — und **niemand hat es gemeldet**, weil keine Prüfung je
`getComputedStyle` an dieser Stelle gefragt hat und weil beim Lesen der
Datei beide Zeilen richtig aussehen.

**Was fehlt:** ein Wächter, der tote Stil-Regeln findet. Denkbar wäre er
so: ein Prüflauf öffnet die App, geht eine Liste von Stellen durch, an
denen eine Gestalt zugesagt ist (Tupfer rund, Knopf 44 px, Kante sichtbar),
und vergleicht den BERECHNETEN Wert mit der Zusage. `test522` tut das jetzt
für die Stiftleiste — für die anderen achtzig Bauteile der Schale tut es
niemand.

**Warum das nicht eben so geht:** die Zusage muss irgendwo stehen, sonst
prüft der Lauf nur, dass der Browser rechnen kann. Eine zweite Liste neben
dem Stilblatt wäre ein zweiter Katalog (§8) und liefe vom ersten weg. Der
gangbare Weg ist deshalb vermutlich der schmalere: **die paar Stellen, an
denen eine Gestalt wirklich etwas bedeutet**, bekommen ihren Wächter beim
Bauen — und die Regel dazu steht als Arbeitsschritt, nicht als Werkzeug:
*wer eine Gestaltung ändert, misst hinterher am echten Knoten nach, statt
die Datei noch einmal zu lesen* (§55, P47).

Eingetragen als offen, weil der Wächter fehlt — nicht der Befund.

## L159 · Das CSS-Verzeichnis wandert schneller, als es geprüft wird

**Gemessen am 15. September 2026:** von 157 Präfixen hatten **45 eine
falsche Zahl** im Verzeichnis (`rmo` stand auf 40 und ist 561), eines fehlte
ganz (`fv`), und bei einem war die Hauptdatei gewandert (`els`, E323 → E537).

Die Namen und die Hauptdatei hält `test290`. **Die Zahlenspalte hält
niemand** — sie wird geparst und dann weggeworfen. Sie ist am 15. September
einmal aus dem Stil neu gerechnet worden und wird wieder abwandern.

**Warum sie trotzdem nicht geprüft wird:** ein Wächter, der bei jeder
hinzugefügten CSS-Regel rot wird, wird abgeschaltet statt gelesen — genau
das steht im Kopf von `test290` über seinen eigenen ersten Entwurf. Die
ehrliche Lösung wäre, die Spalte ganz zu streichen; das bricht das Format,
das `test290` liest, und ist ein eigener kleiner Bogen. Bis dahin steht im
Verzeichnis, von wann die Zahlen sind.

## L163 · Drei rote Läufe, und nur einer war ein Produktfehler — 15. September 2026

An einem Tag gefunden und alle drei geschlossen:

| Lauf | seit | Ursache | war es ein Produktfehler? |
|---|---|---|---|
| `test290` | E537 | Verzeichnis abgewandert, 45 falsche Zahlen | nein, Doku |
| `test429` | ≥ E571 | mass `getComputedStyle().transform` an einem SVG-Attribut | **nein** |
| `test476` | ≥ E571 | zielte mit der Maus auf eine laufende Animation | **nein** |
| `test508` | E573 | Verlaufskapsel schob die Folienfläche | **ja — meiner** |

**Die Lücke, die bleibt, ist keine Zeile Code:** ein Lauf, der lange rot
ist, nimmt dem nächsten echten Fehler die Aufmerksamkeit. `test429` und
`test476` haben monatelang ein rotes Kreuz gemacht, hinter dem nichts stand
— und `test508` stand daneben und wurde deshalb für „auch so einer"
gehalten. Er war es nicht.

**Was daraus folgt, ohne neue Regel:** §46 sagt „rot zuerst", und das gilt
auch, wenn das Rot alt aussieht. Wie alt es wirklich ist, sagt ein
Arbeitsbaum auf den Commits in zwei Minuten (§30).

---

## L164 · Drei Abschnitte tragen dieselben dreissig Zeilen — 15. September 2026

`test480` misst Zeichen gegen Zeichen an drei Stellen, und alle drei tragen
denselben Rasterer:

| Abschnitt | Liste | seit |
|---|---|---|
| `§7` | `Marken.STIFTE` — die sechs Stiftarten | E515 |
| `§7b` | `Marken.WERKZEUGE` — die dreizehn Werkzeuge | E577 |
| `§7c` | `Marken.FORMEN` — die sieben Formen | E584 |

Jeder der drei rastert auf 16 × 16, zählt Tinte gegen Tinte und vergleicht
gegen dieselbe Grenze von 60 %. Dreissig Zeilen, dreimal.

**Warum es trotzdem dreimal dasteht:** §7 und §7b sind laufende, grüne
Wächter. Sie zum Teilen umzubauen, während ein dritter dazukommt, hiesse
zwei Dinge auf einmal zu tun — und wenn danach etwas rot ist, weiss niemand,
welches davon (§45). Der Kommentar in `§7b` sagt das seit E577; `§7c` sagt
es auch.

**Was zu tun ist, und wann:** eine gemeinsame Messung, sobald einer der drei
Abschnitte aus einem anderen Grund angefasst werden muss. Nicht vorher, und
nicht als eigener Bogen — ein Umbau ohne Anlass ist auch nur ein Umbau.

**Was NICHT zu tun ist:** die drei Listen in einen Vergleich werfen. Ein
Werkzeugzeichen und ein Formzeichen dürfen sich ähneln — `inkShapes` ist ein
Rechteck, und `formRect` ist eins. Sie stehen nie nebeneinander.

**Nachtrag 15. September 2026 (E587):** dazugekommen ist `§7d`, und der
zählt hier NICHT mit. Er rastert zwar auch auf 16 × 16, misst danach aber
etwas ganz anderes — die Hauptachse der Tinte statt der Deckung. Eine
gemeinsame Messung für die vier müsste also zwei Masse tragen, nicht eins.
Das ist ein Grund mehr, sie erst anzufassen, wenn es einen Anlass gibt.

---

## L169 · Eine zurückgeschriebene Folie geht ungepackt hinein — 15. September 2026

**Was fehlt:** Redions ZIP-Schreiber packt nicht. Eine Folie, die E593
geändert hat, wird deshalb mit Methode 0 abgelegt, während alle
durchgereichten Einträge ihre Methode 8 behalten. Gemessen wuchs die
Probedatei dadurch von 6432 auf 7104 Bytes.

**Warum es so bleibt, bis es stört:** eine Folie ist ein paar Kilobyte. Ein
Packwerk einzuführen, bevor die Grösse jemandem auffällt, wäre die falsche
Reihenfolge (§45, §36: erst messen, dann bauen). Der Browser kann es
ohnehin — `CompressionStream('deflate-raw')` steht schon in zwei Prüfläufen
—, es ist also ein kleiner Bogen, wenn er denn gebraucht wird.

**Woran man merkt, dass er gebraucht wird:** eine Präsentation mit vielen
geänderten Folien. Bei zwanzig Folien zu je 30 KB wären es 600 KB
ungepackt gegen etwa 90 KB gepackt.

---

## L170 · Was in Redion NEU dazukommt, steht nicht in der Original-`.docx` — 15. September 2026

**Was fehlt:** Seit E595 geht eine eingelesene `.docx` als ihr Original
wieder heraus — Eintrag für Eintrag durchgereicht, mit den geänderten
Absätzen an ihrer Stelle darin. Wer in Redion aber einen **neuen** Block
anlegt, findet ihn in der Datei nicht wieder. Dasselbe gilt für gelöschte
Absätze: sie bleiben im Dokument stehen.

**Warum es so entschieden wurde:** Der frische Schreiber kann neue Blöcke —
er kann dafür nichts anderes. Gemessen verlor er an einer Probedatei
`docProps/core.xml`, ein PNG und eine Zeichenfarbe und schrieb den
Anhangsblock als Absatz mit hinein (E595). Zwischen „ein neuer Absatz fehlt"
und „das Bild, die Farbe und die Dateiangaben fehlen" ist das erste der
kleinere Schaden (§46 Punkt 1, §51).

**Was dagegen hilft, wenn es stört:** Ein neuer Block trägt keine
`quelle`-Spur. Er liesse sich am Ende des Körpers als frischer `<w:p>`
anhängen, mit dem Stil, den sein Typ vorgibt — das ist ein kleiner Bogen,
weil das Durchreichen und das Schreiben schon stehen. Ein gelöschter Block
ist schwieriger: gelöscht ist in Redion nicht dasselbe wie „soll aus der
Datei verschwinden", und wer das verwechselt, löscht fremden Text.

**Woran man merkt, dass es gebraucht wird:** Wer eine Word-Datei einliest
und in Redion daran weiterschreibt statt nur zu korrigieren.

---

## L171 · Das Regressionsbündel eines Bogens sieht nur, was der Bogen anfasst — 15. September 2026

**Was fehlt:** `test252` war 56 Commits lang rot, ohne dass es jemand sah
(E596). Der Grund ist keine Nachlässigkeit an einer Stelle, sondern die
Form der Arbeit: jeder Bogen fährt am Ende ein **Bündel** der Läufe, die zu
seinem Thema gehören. Ein Lauf, der von einer Änderung an einem anderen
Thema getroffen wird, steht in keinem dieser Bündel.

E538 („Office war die einzige Gruppe ohne Originalschutz") änderte den
Einleseweg; `test252` prüft den Word-Rundlauf. Beide gehören zu Office, und
trotzdem lief der eine im Bündel des anderen nicht mit.

**Warum kein voller Lauf nach jedem Bogen:** Ein voller Lauf über 467
Prüfungen dauert länger, als eine Sitzung sicher steht — deshalb steht in
§30 ausdrücklich, dass er in Stücken und wiederaufnehmbar gefahren wird, und
in §46, dass `main` sich erst bewegt, wenn er grün ist. Die Regel ist also
da; was fehlt, ist der Weg dorthin innerhalb einer Sitzung.

**Was helfen würde, in der Reihenfolge der Kosten:**

1. **Ein Bündel je Bereich statt je Bogen.** Wer `src/bereiche/dateien/`
   anfasst, fährt ALLE Läufe, die diesen Ordner laden — nicht die, an die er
   gedacht hat. Das ist eine Liste, kein Werkzeug.
2. **Ein Lauf, der nachsieht, wann jeder Lauf zuletzt grün war.** Eine
   Merkdatei, wie sie der volle Lauf für seine Stücke schon führt (§30).
3. **Der volle Lauf vor jedem Vorspulen von `main`.** Das steht als Regel
   schon da; was fehlt, ist die Gewohnheit, ihn auch dann zu starten, wenn
   der Bogen klein war.

**Was es nicht heisst:** dass die Bündel weg sollen. Ein schnelles Bündel
nach jedem Bogen findet den eigenen Fehler sofort — es findet nur nicht den
fremden.

---

## L173 · Der Umbruch im SVG ist geschätzt, der im Feld gemessen — 15. September 2026

**Was fehlt:** `InkGeometry.textLines` entscheidet, wo ein Textkasten
umbricht, aus einer SCHÄTZUNG der Buchstabenbreiten
(`src/core/ink/geometry.ts`, `textWidth`). Das Schreibfeld aus E597 bricht
dagegen mit den ECHTEN Massen des Browsers um. Beide stimmen fast immer
überein — aber „fast" ist keine Zusicherung.

**Warum die Schätzung überhaupt da ist:** Ein SVG kann nicht selbst
umbrechen; die Zeilen müssen gerechnet werden, bevor sie als `<tspan>`
dastehen. E561 hat die Schätzung bereits einmal aus dem Bild verbannt — sie
darf nicht mehr sagen, wo ein Stück ANFÄNGT, weil das sichtbar danebenlag.
Wo umgebrochen wird, entscheidet sie weiter.

**Was helfen würde:** Der Browser kann Text messen —
`CanvasRenderingContext2D.measureText` oder ein `<canvas>` mit derselben
Schrift. Das wäre genauer und kostet einen Messaufruf je Zeile. Ob das der
Mühe wert ist, hängt davon ab, wie oft die zwei auseinanderlaufen — und das
ist bisher nicht gemessen.

**Woran man merkt, dass es stört:** Ein Kasten, in dem beim Schreiben zwei
Zeilen standen und danach drei — bei einer Zeile, die genau an der Grenze
endet. `test527` §10 hält den Fall am Telefon fest; er prüft die beiden
gegeneinander, nicht gegen eine Zahl.

---

## L174 · Die Auswahl-Werkzeugleiste ist breiter als das Fenster — 15. September 2026

**Was fehlt:** Mit dem Auswahlwerkzeug zeigt die untere Leiste
vierundzwanzig Knöpfe. Gemessen an der laufenden App:

```txt
Fenster      Werkzeug   sichtbare Knöpfe   davon ausserhalb   rollbar
1280 × 900   stift      18                 0                  nein
1280 × 900   text       12                 0                  nein
1280 × 900   select     24                 10                 ja
1440 × 960   select     24                  8                 ja
 390 × 844   select     24                 17                 ja
 390 × 844   stift      18                 11                 ja
```

Die Leiste rollt, die Knöpfe sind also erreichbar — aber nur, wenn man
weiss, dass dort noch etwas ist. Am Rechner erwartet das niemand: bei
Stift und Text passt alles, und genau deshalb sieht es bei der Auswahl
nicht nach „weiterrollen" aus, sondern nach „das ist alles".

**Warum es hier steht und nicht repariert ist:** Es ist kein Fehler dieses
Bogens — die Leiste war vorher schon so, und E572/E574 haben ihren Inhalt
je Werkzeug ausdrücklich so beschlossen (`test524` zählt ihn nach). Was
fehlt, ist eine Antwort auf die Frage, was bei vierundzwanzig Knöpfen
passieren soll: zweite Zeile, Überlaufmenü, oder weniger Knöpfe.

**Am Telefon ist es Absicht** (§37: die Leiste rollt statt umzubrechen).
Am Rechner ist es eine Überraschung.

**Woran man merkt, dass es stört:** Wer „Sperren" oder „Verweis" sucht und
sie nicht findet, obwohl sie da sind.

---

## L175 · Auszeichnung lässt sich im Feld noch nicht auf einen Teil anwenden — 16. September 2026

**Was fehlt:** Seit E606 hält das Schreibfeld mehrere Formate in einem Kasten
— es **bewahrt** sie. Was es noch nicht kann: ein Stück markieren und ihm
ein neues Format geben. „Fett" in der Leiste wirkt auf den GANZEN Kasten
(E599), nicht auf die Auswahl im Feld.

Neu getippter Text erbt das Format der Stelle, an der er landet — tippt man
mitten in ein fettes Wort, wird das Getippte fett. Das ist das Verhalten
jedes Textprogramms und deckt den Alltag; was fehlt, ist die bewusste
Änderung an einem markierten Stück.

**Warum es nicht gleich mitgebaut wurde:** Es ist eine andere Aufgabe. Ein
Format auf eine Auswahl anzuwenden heisst, Textknoten an den Grenzen der
Auswahl zu teilen, Spans einzuziehen und benachbarte gleicher Art wieder
zusammenzufassen — und dabei den Cursor stehen zu lassen. `execCommand` täte
es in zwei Zeilen und ist genau deshalb nicht der Weg: es erzeugt `<b>`,
`<font>` und verschachtelte Spans, die `feldLesen` nicht kennt, und es ist
abgekündigt. Der eigene Weg ist richtig und braucht einen eigenen Bogen.

**Woran man merkt, dass er gebraucht wird:** Wer eine eingelesene
Präsentation nicht nur korrigiert, sondern gestaltet.

---

## L177 · Marker, Notizen und Grenzen fehlen der Gedankenkarte — 16. September 2026

**Was fehlt:** In Redurs Liste stehen sie ausdrücklich — „Labels und Marker:
Themen nach Wichtigkeit, Fortschritt oder Kategorie kennzeichnen",
„Notizen zu Themen: hinter einem kurzen Stichpunkt längere Erklärungen
hinterlegen", „Grenzen/Zusammenfassungen: mehrere Themen optisch gruppieren".
Die Gedankenkarte kennt heute nur Text, Farbe und Zuklappen.

**Was dazu gehört:**

| Sache | Am Knoten | Was man sieht |
|---|---|---|
| Marker | `marken: string[]` | kleine Zeichen vor dem Text (Priorität 1–3, Fortschritt 0–100 %, Aufgabe) |
| Notiz | `notiz: string` | ein Zeichen am Knoten, der Text in einem Feld daneben |
| Grenze | eigene Liste | ein gestrichelter Rahmen um einen Ast, mit Namen |
| Zusammenfassung | eigene Liste | eine geschweifte Klammer rechts davon, mit einem Knoten daran |

**Warum nicht gleich:** Jedes davon ist ein eigener Aufbau-Fall. Eine Grenze
muss den Platzbedarf des Astes kennen, eine Zusammenfassung wächst über
mehrere Geschwister — beides greift in `aufbauen` ein, und das sollte erst
stehen, bevor es wächst.

**Und ein Punkt, der nicht vergessen werden darf:** Ein Marker, der nur eine
Farbe ist, verstösst gegen §38. Er braucht ein Zeichen und einen Namen.

---

## L178 · Die Gedankenkarte kann keine fremden Formate lesen oder schreiben — 16. September 2026

**Was fehlt:** Redurs drittes Bild ist die Ein-/Ausgabetafel von ConceptDraw
— eine Wand aus Formaten, die ineinander übergehen: MindManager, FreeMind,
XMind, NovaMind, MindMeister, OPML, Markdown-Gliederung. Redion kann heute
keines davon, weder hinein noch hinaus.

**Was machbar ist, und in welcher Reihenfolge:**

| Format | Wie es ginge | Aufwand |
|---|---|---|
| Markdown-Gliederung | `#`/`##`/`###` und Einrückung ⇄ Ebenen | klein, und es ist der ehrlichste erste Schritt |
| OPML | XML mit verschachtelten `<outline text="…">` | klein, `DOMParser` ist da |
| FreeMind `.mm` | XML mit verschachtelten `<node TEXT="…">` | klein, dasselbe Werkzeug |
| `.xmind` | ZIP mit `content.json` (neu) oder `content.xml` (alt) | mittel — der ZIP-Leser aus `.redion` trägt es schon |
| MindManager `.mmap` | ZIP mit eigenem XML | gross, und das Format ist nicht offen |

**Der Weg dahin geht über den ZIP-Leser, den es schon gibt.** `Einlesen.zipLesenAusBlob`
öffnet `.redion`, `.docx`, `.pptx` — `.xmind` ist derselbe Griff mit einem
anderen Inhalt. Das ist der Grund, warum diese Lücke machbar ist und nicht
gross.

**Und was dabei zu beachten ist (§18):** Was Redion nicht kennt, darf nicht
verschwinden. Ein `.xmind` mit Markern und Beziehungen, das Redion einliest
und wieder ausgibt, hätte sie sonst verloren — und das ist ein Datenverlust,
auch wenn er in einer fremden Datei passiert.

---

## L179 · Die Gedankenkarte lässt sich nicht als Bild speichern — 16. September 2026

**Was fehlt:** Das Whiteboard hat den Knopf ⭳ und schreibt ein PNG. Die
Gedankenkarte hat ihn nicht.

**Warum das genau am Preis von E607 hängt:** Die Knoten sind HTML, nicht
SVG — deshalb misst der Browser ihren Text, statt dass Redion ihn schätzt.
Der Preis dafür ist genau hier fällig: ein `<canvas>` kann kein HTML
zeichnen. Das Whiteboard kommt mit `toDataURL` aus, weil bei ihm alles im
SVG liegt.

**Was ginge:** beim Speichern ein zweites Bild aufbauen — dieselben Orte,
aber die Knoten als `<rect>` und `<text>` im SVG, mit den **gemessenen**
Grössen aus dem Aufbau. Die Schätzung käme dadurch nicht zurück: gerechnet
wird weiter am HTML, das SVG bekommt das Ergebnis vorgesetzt. Umbrüche
müssten dabei als `<tspan>` je Zeile ausgegeben werden, und die Zeilen
kennt nur der Browser — also zusätzlich `Range.getClientRects()` je Knoten,
um zu erfahren, wo er umgebrochen hat.

**Ein Umweg, der heute schon geht:** die Seite drucken. Das ist keine Lösung,
aber es ist keine Sackgasse.

---

## L181 · Das Lineal steht zweimal, sobald „Zeichnen" offen ist — 16. September 2026

**Gemessen** im Schreibstudio bei offenem Foliensatz, 1440 × 852, Reiter
„Zeichnen":

```txt
[data-document-action="ink-ruler"]   oben in der Zeichenleiste   1 sichtbar
[data-act="lineal"]                  unten im Dock               1 sichtbar
```

Zwei Schalter, **ein** Zustand — der obere klickt den unteren durch
(`document-mode.ts`). Beim Reiter „Präsentation" ist die Zeichenleiste
`hidden`, und dann ist der im Dock der einzige; dort gibt es die Doppelung
nicht. Auf Redurs Bild vom 16. September steht deshalb nur eines.

**Warum es in E612 NICHT behoben wurde.** Die naheliegende Regel — den
unteren im geschlossenen Dock ausblenden, sobald die Zeichenleiste steht —
dreht **E574** um. Der Eintrag dort sagt ausdrücklich:

> „Wer mit dem Stift ein Lineal wollte, kam nur über die Taste „r" oder über
> „···" daran. Ein Weg, den man kennen muss, ist am Telefon kein Weg."

`test524` hält beides fest: „Lineal oben direkt erreichbar" (Zeile 53) und
„Lineal-Schalter steht beim Stift im Dock" (Zeile 116). Es ist also eine
zweite Entscheidung, keine Nebenwirkung — und sie gehört Redur.

**Die drei Möglichkeiten, keine davon entschieden:**

1. **Den unteren ausblenden, solange die Zeichenleiste steht.** Der Schalter
   bleibt oben erreichbar. Dreht E574 an dieser Stelle um.
2. **Den oberen ausblenden, solange das Dock ihn trägt.** Dann erscheint das
   Lineal nur bei den Werkzeugen, die es können (`stift`, `marker`, `line`,
   `arrow`) — näher an E574, aber gegen die Zeichenleiste aus E572.
3. **Beide stehen lassen** und es als bewusste Doppelung schreiben.

**Woran man merkt, dass es drückt:** sobald jemand im Foliensatz den Reiter
„Zeichnen" benutzt und sich fragt, welches der beiden Lineale gilt.

L182 · «Einrichten» steht allein in einer dritten Zeile — 16. September 2026
--------------------------------------------------------------------------

**Beim Hinsehen gefunden, nicht beim Prüfen** (§55.1). Auf dem Bild zu W3
steht der Knopf «Einrichten» als einziges Bedienteil in einer dritten
Leistenzeile, links unten, mit einer leeren Zeile daneben.

**Gemessen** an der laufenden App, 1280 px Fenster, breite Seite, Stift
gewählt — und zwar auf BEIDEN Ständen:

```txt
                  origin/main      mit E614
Leiste                 860 px        860 px
Höhe                   127 px        128 px
Zeile 1 (y≈0)      13 Werkzeuge   13 Werkzeuge
Zeile 2 (y≈50)     26 Zubehör     26 Zubehör
Zeile 3 (y≈80/90)  «Einrichten»   «Einrichten»
```

**Er ist also älter als E614** — dieser Bogen hat ihn nur sichtbar gemacht.
Wahrscheinlich stammt er aus **E571**, als «Einrichten» als letzter Eintrag
an die Leiste kam.

**Warum er nicht in E614 behoben wurde.** Drei Wege stehen offen, und jeder
ist eine Entscheidung und keine Nebenwirkung:

1. **«Einrichten» zum festen Teil rechts** (`.blatt-fest`, wo schon Seite
   und Papier stehen). Er gehört dorthin: er bedient die Leiste, nicht das
   Blatt. Kostet die Breite dort.
2. **Ihn ans Ende der Zubehörzeile hängen**, mit `order:9999` wie den
   Verlauf. Dann steht er neben Zurück/Vor — und die kleben dort am Telefon.
3. **Ihn nur im Menü lassen.** «Als Liste» erreicht dasselbe, und der Weg
   über die Befehlspalette steht ohnehin. Das wäre allerdings ein Knopf
   weniger im Bild, und §47 verlangt dafür Redurs Zusage.

**Woran man merkt, dass es drückt:** an jedem Fenster zwischen rund 1100 und
1400 px, wo die Zubehörzeile voll ist und er als Einzelgänger umbricht.
Breiter fällt er in die zweite Zeile zurück, schmaler rollt die Leiste
ohnehin.

L183 · Unter der Folie stehen 130 px, die niemandem gehören — 16. September 2026
--------------------------------------------------------------------------

**Ein Nebenprodukt von E612, gefunden durch einen roten Lauf, nicht durch
Hinsehen.** `test507 §1` verlangte „die Folie nutzt über 85 % der Höhe" und
meldete 77 %. Der Lauf war auf `origin/main` mit derselben Zahl rot — E612
hat ihn übersehen, wie auch `test437`.

**Gemessen** (1440 × 852, Foliensatz, stehende Folie):

```txt
                    vor E612            nach E612
Arbeitsfläche       1440 × 588          1440 × 720
Folie                980 × 551           980 × 551
Anteil Höhe              94 %                77 %
Anteil Breite            68 %                68 %
leer darunter            ~10 px              130 px
```

**Die Folie ist weder breiten- noch höhengebunden.** Sie steht auf
`--pdf-paper-max: 980px` (`pdf-studio.css:36`) — ein **Lesemass**, kein
Zufall: der Kommentar dort sagt „KEINE FARBE, sondern ein Lesemass — und
`test285.mts:223` rechnet damit. Es bleibt, wie es ist."

**Warum das jetzt drückt und vorher nicht.** E551 hat an genau dieser Stelle
gemessen und geschlossen: *„Am Rechner ist nichts zu tun — 94 % sind voll"*
— und daraus folgte die zweite Entscheidung, am Rechner **nicht** zu
zentrieren (`safe center` fällt dort auf `start` zurück). Beide Sätze standen
auf den 588 px von damals. Seit E612 sind es 720, und damit steht die Folie
oben mit 130 px Leere darunter.

**Die drei Möglichkeiten, keine davon entschieden:**

1. **Zentrieren statt oben.** Die kleinste Änderung: E551s Grund für `start`
   ist weggefallen, die Leere verteilt sich auf oben und unten. Ändert
   nichts an der Grösse — nur an der Lage. Achtung: `safe center` war gegen
   kurze Fenster gebaut (gemessen −28, −204, −464 px), die Vorsicht bleibt
   nötig.
2. **Das Lesemass für den Foliensatz anheben.** Bei 720 px Fläche passte
   eine Folie von rund 1156 × 650 hinein — 80 % der Breite eines
   1440er-Bildschirms. Das dreht das Lesemass für DIESEN einen Fall um, und
   `test285` rechnet damit; es wäre ein eigener Eintrag nach dem Muster von
   E554.
3. **So lassen.** 130 px Luft unter einer Folie sind kein Fehler, und
   Redurs Bitte galt der Bedienung über der Folie, nicht der Folie selbst.

**Woran man merkt, dass es drückt:** an jedem breiten Bildschirm im
Foliensatz — die Folie klebt oben, darunter steht ein Streifen Nichts.
Am Telefon nicht: dort steht sie seit E551 mittig.

L184 · Ist `laptop` in `bilder.mts` ein Tastgerät? — 17. September 2026
--------------------------------------------------------------------------

**Beim Einbau des breiten Bildschirms (E617) aufgefallen, nicht gesucht.**

`bilder.mts` stellte bis E617 jedes Gerät ausser `rechner` als **Tastgerät**
nach (`isMobile: true, hasTouch: true`) und machte davon nur ein Bild statt
zwei. Das stand an zwei Stellen als `g !== 'rechner'`, und solange es genau
ein Rechnergerät gab, war es richtig.

Mit `breit` (1920 × 1080) ist es das nicht mehr — dort entscheidet jetzt die
Menge `ZEIGER_GERAETE`. **`laptop` (1024 × 768) blieb dabei absichtlich
draussen**, damit seine bisherigen Bilder sich nicht ändern.

**Die Frage, die damit offen steht:** ist 1024 × 768 ein Laptop oder ein
Tablet? Der Name sagt Laptop, das Verhalten sagt Tablet.

```txt
heute       laptop  →  isMobile, hasTouch, nur dunkel
der Name    „laptop"
die Folge   in jedem laptop-Bild gilt `hover: none` und `pointer: coarse`
```

Ist es wirklich ein Laptop gemeint, dann zeigen alle seine Bilder seit je
den falschen Zustand — dasselbe wie L108, nur andersherum und für ein
anderes Gerät. Ist ein Tablet gemeint, dann stimmt das Verhalten und der
**Name** ist falsch.

**Was es kostet, das nachzusehen:** wenig — ein Lauf von `node bilder.mts`
mit und ohne die Umstellung und ein Blick auf zwei Bilder. **Was es kostet,
es nicht zu tun:** eine Gerätegrösse, deren Bilder niemand richtig deuten
kann.

**Nicht mit E617 entschieden**, weil es eine Änderung an Bildern wäre, die
mit diesem Bogen nichts zu tun haben.

---

## L190 · Das Namensfähnchen am Farbtupfer fehlt — 19. September 2026

Redurs Bild 8 zeigt neben dem Farb-Dock ein Fähnchen mit dem Farbnamen. Das
Dock ist mit E625 gebaut, das Fähnchen nicht — und zwar nicht aus
Vergesslichkeit, sondern weil am Tupfer **beide Pseudoelemente vergeben
sind** und keines entbehrlich ist:

```txt
::before   die 1-px-Kante gegen den im Dunkelmodus verschwindenden
           schwarzen Tupfer (E568)
::after    die 44-px-Trefffläche (§37, E406)
```

Zwei Versuche, beide gemessen:

1. **Auf `::before`** — erbt das `inset:5px` der Kantenregel, die später im
   Stilblatt steht und gewinnt. Das Fähnchen lag mitten auf dem Tupfer.
2. **Unter den Tupfer gelegt** — zu sechzig Prozent vom Papier verdeckt,
   weil die Leiste in mehreren Lagen rollt und damit auch nach unten
   klemmt. `getComputedStyle` meldete dabei `opacity: 1`; das Bild zeigte
   die Hälfte (§55.1).

**Was heute schon stimmt:** jeder Tupfer trägt `title` und `aria-label` mit
seinem Namen — die Kurzinfo des Browsers zeigt ihn, ein Vorleser nennt ihn.
Was fehlt, ist die Gestalt aus Redurs Bild, nicht die Auskunft.

**Drei Wege, wenn es doch sein soll:**

1. Ein echtes Element statt eines Pseudoelements, beim Überfahren aus
   JavaScript an die Leiste gehängt. Kostet einen Zuhörer und einen Weg
   mehr, kann aber überall stehen.
2. Die Kante aus `::before` in ein `box-shadow` am Knopf verwandeln und
   `::before` freimachen. Risiko: `background-clip:content-box` macht den
   Schatten zu einem Ring um den Knopf statt zu einer Kante am Punkt —
   genau deshalb war es ein Pseudoelement (E568).
3. So lassen. Der Name ist da, nur nicht als Fähnchen.

---

## L150 — nachgetragen am 19. September 2026 (E626)

**Der Wächter steht: `test537`.** Und mit ihm eine Richtigstellung an dieser
Lücke selbst.

Oben steht: „heute hält die Regel, gemessen über alle `src/bereiche/*/` — es
gibt keinen Querverweis", und daraus folgte die Sorge, ein Lauf auf sauberem
Bestand bliebe für immer grün. **Das war falsch.** Gemessen mit genau dem
Verfahren, das diese Lücke vorschlägt (`nurCode()` aus `test87`, für jeden
Bereichsnamen statt für `App`):

```txt
523 Querverweise   in 63 von 306 möglichen Bereichspaaren
                   127 Einträge (Bereich + fremder Name), 61 fremde Namen
  6 davon über `(window as any).X`
```

Woran es lag, ist lehrreich: die alte Messung suchte nach `import`. Den gibt
es hier nicht — und der Schluss „also keine Querverweise" ist derselbe
Fehler wie eine Prüfung, die das Falsche misst und deshalb immer grün sagt
(§55.2). Die Lücke warnte vor genau diesem Fehler und machte ihn selbst.

**Verschoben wurde nichts**, und der Grund steht in E626 mit Zahlen: die
grossen Namen sind die Kerne ihrer Bereiche (`Datenbank` = 502 KB
Datenbanksteuerung), keine gemeinsamen Helfer. Stattdessen führt
`pruefungen/bereiche-bestand.json` den Stand, darf nur schrumpfen, und jeder
NEUE Verweis macht `test537` rot.

**Was damit offen bleibt** — und zwar als Frage an Redur, nicht als Arbeit:
ob die 523 über `register/` aufgelöst werden (§5s dritter Weg, 523 Stellen),
oder ob §5 Regel 1 umgeschrieben gehört, weil achtzehn Bereiche einander in
63 von 306 Paaren anrufen und das der Normalfall dieses Programms ist. §5 ist
**[hart]** — das ist seine Entscheidung.

---

## L191 · Der dritte Kopplungsweg hat keine Zuordnung — 19. September 2026

`test537` prüft zwei Wege, auf denen ein Bereich einen anderen anfasst: den
Namen und den Umweg über `(window as any)`. **Der dritte fehlt**, und der
Grund ist gemessen, nicht gemeint.

Ein `querySelector('.lw-karte')` mitten im Editor koppelt genauso fest wie
ein Aufruf. Um das zu prüfen, bräuchte der Lauf die Zuordnung
Präfix → Bereich. Die gibt es nicht: `doku/CSS-NAMENSRAEUME.md` führt
**144 Präfixe auf Stilblätter**

```txt
aw      261  arbeitswelt.css
ai       97  motion.css
```

— und ein Stilblatt gehört keinem Bereich. `bausteine.css` gehört allen.

Eine zweite, von Hand gepflegte Zuordnung wäre genau der Katalog, den §8
verbietet: „Ein zweiter Katalog für dasselbe läuft mit dem ersten
auseinander, und niemand merkt, welcher gilt."

**Zwei Wege, wenn es doch sein soll:**

1. Die Zugehörigkeit aus der Quelle lesen, wie `test537` es mit den Namen
   tut: ein Präfix gehört dem Bereich, in dessen `.ts` es vorkommt — und
   nur, wenn es in **genau einem** vorkommt und in `kern/`/`schale/` gar
   nicht. Präfixe, die mehrere führen, gehören niemandem.
2. `doku/CSS-NAMENSRAEUME.md` um eine dritte Spalte erweitern (Bereich), und
   `test290` — der Lauf, der dieses Verzeichnis schon hält — prüft sie mit.

---

## L192 · Eine Verbindung kann nichts sagen — 19. September 2026

**Was fehlt:** E628 hat die freien Verbindungen gebaut — ziehen, wählen,
löschen, zurückholen. Beschriften kann man sie nicht. In XMind steht auf der
Linie ein Wort („widerspricht", „führt zu", „siehe auch"), und genau das ist
oft der Inhalt: DASS zwei Themen zusammenhängen, sieht man an der Linie;
WIE sie zusammenhängen, steht nirgends.

**Was dazu gehört:**

| Sache | Wo | Wie |
|---|---|---|
| das Wort | `verbindungen[i].text` | ein Feld mehr, alte Karten bleiben lesbar (§9) |
| die Anzeige | auf der Linie | ein `<text>` auf der Bogenmitte, mit einer Decke in der Flächenfarbe darunter — sonst liest man Linie und Wort übereinander |
| das Schreiben | Doppelklick auf die Linie | derselbe Weg wie beim Knoten (F2/Doppelklick) |

**Warum nicht gleich:** Der Text braucht einen Platz, der beim Zoomen
mitwächst und bei kurzen Bögen nicht über die Knoten ragt — das ist ein
eigener Aufbau-Fall, und der Bogen hier sollte erst stehen. Wer ihn baut,
misst die Deckung nach (§19: der Text ist Nutzertext und wird escapet; im
SVG heisst das `textContent`, nicht `innerHTML`).

**Und ein zweiter Punkt am selben Ort:** Die sechs Vorlagen sind fest
eingebaut. Eine eigene Karte als Vorlage zu SICHERN geht nicht — anders als
beim Schaltplan, der das kann (`elektro:planvorlagen`). Das ist bewusst so
gelassen und keine vergessene Zeile: eine eigene Vorlagenliste ist ein
eigener Speicherort mit eigener Sicherungsfrage (§11), und die gehört in
einen eigenen Bogen.

---

## L193 · Ein Name, der mehreren Bereichen gehört, gehört im Wächter keinem — 19. September 2026

`test537` ordnet einen globalen Namen dem Bereich zu, der ihn anmeldet.
Steht derselbe Name in **zwei** Bereichen, gehört er nach der Regel des
Laufs keinem — und jeder Zugriff darauf wird nicht mehr gemeldet.

Das ist absichtlich so (eine Zuordnung, die geraten wäre, sagt nichts), aber
es hat einen Preis, und der wurde am selben Abend sichtbar. Mit der
Berichtigung des Katalogs (E629) bekommen 59 Namen zum ersten Mal einen
Besitzer — und **zehn verlieren ihn**:

```txt
ANSICHTEN   chronik + wissen          REITER      wissen + register
AUSLOESER   datenbanken + editor      STUFEN      spreadsheet + core + kern
BEREICHE    einstellungen + elektro   WERKZEUGE   ki + pdf + register
FORMEN      bloecke + dateien + pdf   M           elektro + core
NAMEN       ki + core + schale        RANG        dateien + kern
```

Zwei Einträge sind dadurch aus dem Verzeichnis gefallen:

```txt
bereiche/ki     → AUSLOESER → bereiche/datenbanken   (2 Treffer)
bereiche/wissen → ANSICHTEN → bereiche/chronik       (4 Treffer)
```

**Sie stehen weiter im Code.** Der Lauf kann sie nur niemandem mehr
zuordnen. Das Verzeichnis ist von 127/523 auf 125/517 gefallen, und diese
sechs Treffer sind **kein Fortschritt** — sie sind unsichtbar geworden.
Genau deshalb steht es hier und im Kopf des Verzeichnisses.

**Was helfen würde**, in der Reihenfolge des Aufwands:

1. Die Zuordnung am ORT der Benutzung entscheiden statt am Namen: wer
   `FORMEN` in `bereiche/pdf` benutzt und dort auch anmeldet, meint die
   eigene. Nur ein Zugriff OHNE eigene Anmeldung im selben Bereich ist ein
   Querverweis. Das fängt neun der zehn Fälle.
2. Gleichnamige globale Namen überhaupt melden — zwei Bereiche mit
   derselben Konstanten sind auch ohne Wächter eine Stolperstelle.
3. Die Namen auseinanderziehen. Das ist die sauberste und die teuerste
   Lösung, und sie gehört nicht in denselben Bogen wie der Wächter.

---

## L194 · Wie viele Wächter Prosa für Code halten, ist nicht gezählt — 19. September 2026

An einem Tag haben **drei** Wächter etwas gemeldet, das es nicht gab, und
jedes Mal stand der „Fund" in einem Satz: `test537` (E629), `test444` und
`test483` (E631). Alle drei sind repariert; `pruefungen/hilfe/quelltext.mts`
ist die gemeinsame Stelle.

**Was nicht beantwortet ist: wie viele es noch gibt.**

```txt
196   Prüfläufe lesen eine Datei unter src/ oder quell/ als Text
        (readFileSync + ein Pfad dorthin, gezählt am 19. September)
  4   davon lesen sie durch quelltext.mts, also als Code
```

Die 196 sind eine **Obergrenze, keine Fehlerzahl.** Viele davon prüfen zu
Recht den rohen Text: ob eine Datei eine Zeile enthält, ob ein erzeugtes
`.js` zu seiner `.ts` passt, ob ein Name im Register steht. Ein Wächter ist
nur dann anfällig, wenn er nach einem **Code-Muster** sucht — und das sagt
die Zahl nicht.

**Warum es trotzdem hier steht:** Die drei gefundenen Fälle waren nicht
gesucht, sondern gestolpert. Ein vierter fällt beim nächsten vollen Lauf
auf, oder er fällt nie auf und macht eine Zusage still wertlos.

**Was zu tun wäre**, und zwar als eigener Bogen:

1. Die 196 danach trennen, ob sie nach einer Zeichenfolge (harmlos) oder
   nach einem Muster mit Klammern und Punkten (anfällig) suchen.
2. Für die anfälligen je eine Gegenprobe schreiben, die einen echten
   Verstoss einsetzt — die einzige Art, das zu beantworten (§55.2).
3. Erst danach umstellen. Die Reihenfolge ist wichtig: die Gegenprobe zu
   `test444` hat gezeigt, dass eine Reparatur einen Wächter **blind**
   machen kann, ohne dass eine einzige Zeile rot wird.

---

## L195 · Die Blocktypen-Inventur behauptet, erzeugt zu sein — sie ist es nicht — 19. September 2026

`doku/BLOCKTYPEN.md` beginnt mit dem Satz:

> Diese Liste ist aus dem laufenden Register erzeugt (`Register.bloecke`),
> nicht abgetippt.

**Einen Erzeuger gibt es im ganzen Baum nicht.** Die Datei wird von Hand
gepflegt, und `test164` ist das einzige, was sie zusammenhält.

Genau deshalb konnte sie driften: Am 16. September kam die Gedankenkarte
ins Register (E607), die Doku blieb auf 78 stehen, und der Lauf war drei
Tage rot, ohne dass jemand ihn fuhr. Nachgetragen am 19. September (E632).

**Zwei Wege, und beide sind vertretbar:**

1. **Den Erzeuger wirklich bauen.** Ein kleines `.mts`, das die Tabelle aus
   `src/register/bloecke.ts` schreibt — dann kann sie nie wieder abweichen.
   Kosten: die Gruppenüberschriften und die drei erklärenden Abschnitte am
   Ende („Bausteine ohne Menüeintrag", „Die sechs Kandidaten aus L19", „Die
   alte Zählung") müssten erhalten bleiben; ein Erzeuger, der sie
   überschreibt, macht die Datei ärmer.
2. **Den Satz berichtigen.** Eine Zeile, und die Datei sagt die Wahrheit
   über sich selbst: von Hand gepflegt, von `test164` gehalten.

Der zweite Weg ist ehrlich und kostet nichts; der erste ist besser und
kostet einen eigenen Bogen. Solange keiner gegangen ist, steht hier, dass
der Kopf der Datei nicht stimmt.

---

## L196 · Die Zeitleiste der Chronik ragt aus ihrem Fenster — 19. September 2026

Auf dem Bild vom 19. September (`bilder.mts chronik`) stehen die
3D-Platten der Tage unten über den Rand des Chronik-Fensters hinaus: die
vierte Platte ist angeschnitten, und sie liegt über dem erklärenden Satz
„Zeiger darüber zeigt die Arbeit des Tages", von dem nur noch die ersten
und letzten Wörter zu lesen sind.

**Gefunden beim Nachsehen zu E633**, nicht gesucht — und deshalb hier und
nicht im Bogen: die Ursache ist der 3D-Stapel (`--i` schiebt jede Platte
um 70 px in die Tiefe und 84 px nach unten), nicht die Farbe, die E633
angefasst hat.

**Was zu klären ist:** ob der Stapel eine eigene Höhe bekommt, ob das
Fenster mitwächst, oder ob die Platten bei vielen Tagen flacher gestapelt
werden. Mit elf Tagen fällt es auf; mit dreissig wird der Satz darunter
unlesbar.
## L197 · Zwei Zehntel lang ist die Zählpille nicht zu treffen — 19. September 2026

Der Auftritt der Ordnerkarte aus E537 malt die Zählpille mit
`transform:scale(0)` und einer Verzögerung von 0,2 s, gehalten durch
`animation-fill-mode:both` (`bausteine.css:8764`). In diesen zwei Zehnteln
ist die Pille **0 × 0 Punkte gross** — nicht nur unsichtbar, sondern ohne
Trefferfläche. Die Suchzeile daneben beginnt bei `width:30px` hinter
`overflow:hidden` (`bausteine.css:8793`), ihr Eingabefeld ist dabei auf
etwa null Punkte gequetscht.

**Gefunden nicht am Bild, sondern am Prüflauf:** `test432` mass im selben
Tick wie das Aufklappen und meldete „verdeckt", wo nichts verdeckte. Der
Lauf wartet jetzt den Auftritt ab (E635) — die Lücke im Produkt bleibt
davon unberührt und steht deshalb hier.

**Wie schwer es wiegt.** Die Pille trägt `role="status"` und ist kein
Bedienelement, §37 greift für sie nicht. Die Suchzeile ist ein `<label>`,
und wer die Karte gerade erst aufgeklappt hat, tippt selten in derselben
Fünftelsekunde hinein. Es ist eine dünne Stelle, kein Fehler.

**Was zu klären ist:** ob der Auftritt statt `width` und `transform:scale(0)`
mit `clip-path` und `opacity` gemalt wird. Dann stimmt die Trefferfläche ab
dem ersten Bild, das Auge sieht dasselbe, und ein Prüflauf müsste gar nicht
warten. Das wäre die bessere Lösung, aber sie ändert Redurs Auftritt, und
das ist seine Entscheidung.

## L198 · Ein Gekritzel wird am GEGLÄTTETEN Weg gemessen — 19. September 2026

`istKritzel` (`src/bereiche/pdf/marken.ts:2606`) entscheidet über die Frage
„ist dieser Zug ein Radiergekritzel oder ein Strich?" an der **Weglänge**:
sie muss mindestens das 2,2-fache der Kastendiagonale betragen. Gemessen
wird der Weg, der nach dem Glätter übrigbleibt.

Seit E504 rechnet der Glätter in **Zeit** statt je Messpunkt
(`src/core/ink/stroke.ts:286`). Damit hängt die geglättete Weglänge an der
Meldefrequenz des Eingabegeräts: je dichter die Punkte zeitlich liegen,
desto stärker wird gedämpft. Nachgerechnet für den schrägen Zickzack aus
`test449`:

```txt
dt = 1 ms  (1000 Hz, nur ein Prüflauf)   Weg 1037 gegen Schwelle 1262  ✗
dt = 4 ms  (240 Hz)                      Weg 1520 gegen Schwelle 1286  ✓
dt = 8 ms  (120 Hz)                      Weg 1648 gegen Schwelle 1292  ✓
dt = 16 ms (60 Hz)                       Weg 1357 gegen Schwelle 1279  ✓
```

**Kein Gerät erreicht heute den Auslöser** — 1000 Hz bei diesem Punktabstand
wären rund 9500 Punkte je Sekunde. Und die Fehlrichtung ist die sichere: wer
durchfällt, radiert **nicht**, sondern hinterlässt einen sichtbaren Strich,
den ein Zurück wegnimmt. Der gefährliche Fall aus E476 — eine Marke ist weg,
die nie überquert wurde — kann daraus nicht entstehen.

**Aber bei 60 Hz beträgt die Reserve nur sechs Prozent.** Wer den Glätter das
nächste Mal anfasst, verschiebt damit unbemerkt, ab wann ein Gekritzel eines
ist.

**Der Prüflauf misst inzwischen wie ein Gerät** (E636, `takt: 8` = 125 Hz).
Damit ist der Lauf ehrlich — die Frage am Produkt bleibt offen und steht
deshalb hier.

**Was zu klären ist:** ob `istKritzel` am **rohen** Weg messen sollte statt
am geglätteten. Der rohe Weg ist von der Meldefrequenz unabhängig; die
Glättung ist eine Frage des Aussehens, nicht der Absicht. Das wäre ein
Eingriff in eine Funktion, die Daten löscht, und gehört deshalb in einen
eigenen Bogen mit eigener Gegenprobe (§30).

## L199 · „Alles einpassen" lässt den linken Rand draussen — 19. September 2026

Auf dem Bild vom 19. September (`bilder.mts gedankenkarte`, hell und dunkel
gleichermassen) steht der Massstab auf **72 %** — die Karte wurde also
eingepasst — und trotzdem ist der linke Knoten angeschnitten: von
„Schutzklassen I bis III" fehlt das S, rechts bleibt dagegen ein Streifen
frei.

**Gefunden beim Nachsehen zu E637**, nicht gesucht.

Die Rechnung in `einpassen` (`gedankenkarte.ts:1251`) sieht richtig aus: der
Kasten kommt aus `maxX - minX + RAND * 2`, und `maxX` nimmt `o.x + m.w`, also
die Breite der Knoten mit. Dass die Karte trotzdem links übersteht, heisst
also: entweder misst `mass(id)` beim ersten Einpassen etwas anderes als
später — Schrift noch nicht geladen, Umbruch noch nicht entschieden —, oder
die Verschiebung `karte.sicht.x` und der Kasten rechnen mit verschiedenen
Ursprüngen.

**Nicht geraten, sondern gemessen werden muss:** `plan.breite`, `buehne`-Breite
und `karte.sicht.x` zum Zeitpunkt des ersten Einpassens gegen dieselben Werte
nach einem Druck auf ⤢. Stimmen die zweiten, ist es die Messung zum falschen
Zeitpunkt; stimmen beide, ist es der Ursprung. Erst danach die Reparatur
(§36, §55.2).

**Wie schwer es wiegt:** man kann die Karte schieben, es geht also nichts
verloren. Aber der erste Blick auf eine Gedankenkarte ist der, für den ⤢
gebaut wurde, und ein angeschnittenes Wort im ersten Blick sieht aus wie ein
Fehler — weil es einer ist.

## L200 · Die vier Zahlen aus §31 stehen jetzt im Aufklapper — 19. September 2026

§31 des Auftrags beschreibt das Telefonbild wörtlich so:

```txt
    18 Karten fällig
    5 neue
    2 Fehler

    [ Lernen starten ]
```

Seit Redurs Umbau vom **6. September** (`4d3748e`, „Was ich geändert habe")
stehen diese vier Zahlen nicht mehr auf dem Startbild, sondern in einem
zugeklappten `<details class="lw-insights">` namens „Lernübersicht &
Fortschritt". Der Umbau hat dazu einen eigenen Satz im Quelltext
(`lernwelt.ts:1416`):

> Eine klare Startfolge: Dokument öffnen, Lernrunde, dann der Tagesplan.
> Auswertungen bleiben vollständig über native Details erreichbar.

**Das ist keine Lücke, solange Redur es so will** — und einiges spricht
dafür: die Zahl, um die es beim Öffnen geht, steht weiterhin gross auf der
Karte mit dem Knopf („5 Karten für heute"), und vier Kacheln über dem
Startknopf waren genau das, was E151 einmal unter die Falz gedrückt hat.

**Offen ist nur, ob §31 damit als erfüllt gilt.** `doku/AUFTRAG-STAND.md`
stand dafür bis heute auf ✅ und nannte einen Knopfnamen, den es seit dem
6. September nicht mehr gibt; jetzt steht dort ◐ und dieser Verweis.

**Was zu entscheiden ist (Redur):** entweder §31 gilt als erfüllt, weil die
Zahl des Tages oben steht und die Aufschlüsselung einen Griff entfernt ist —
dann wird die Zeile in `AUFTRAG-STAND.md` wieder ✅ und diese Lücke
GESCHLOSSEN. Oder die vier gehören aufs Startbild, dann wandert `.lw-metrics`
aus dem `<details>` heraus und wird in der `order`-Leiter mit aufgeführt.
Beides ist in einer Sitzung gemacht; die Frage ist, was er sehen will.

## L201 · Der Hauptknopf der Lernwelt ist schwarz statt violett — 19. September 2026

Auf dem Telefonbild vom 19. September (`bilder.mts heute handy`) sieht
„Lernen starten →" aus wie der Nebenknopf „Lernplan ansehen" darunter: fast
schwarz, mit dünnem Rand. Der Knopf daneben im Dokumentenstudio
(„Dokumente öffnen") ist dagegen leuchtend violett.

**Gemessen** im Browser, nicht geschätzt:

```txt
Lernen starten →    background-image: none          background-color: rgb(16,16,16)
Dokumente öffnen    background-image: linear-gradient(rgb(109,74,255), …)
--accent            #6d4aff
--haupt-flaeche     linear-gradient(180deg, #6d4aff, color-mix(…))
```

Die Tokens sind also da und richtig. Von den Regeln, die auf den Knopf
passen, ist die letzte diese (`bausteine.css`):

```css
.lernwelt button.is-primary.ru-funkel{background:var(--ru-funkel-farbe)}
```

Der Funkel-Schmuck legt seine eigene Fläche über die Hauptfläche. Ob
`--ru-funkel-farbe` dabei zu dunkel ist oder gar nicht aufgelöst wird, ist
**noch nicht gemessen** — das ist der erste Schritt vor jeder Reparatur (§36).

**Warum es zählt:** §38 verlangt, dass Information nicht nur über Farbe
läuft — hier läuft sie über *gar nichts*: Haupt- und Nebenknopf sind optisch
gleich, und der Nebenknopf steht darunter, also am Daumen. Wer schnell tippt,
öffnet den Lernplan statt zu lernen.

## L202 · Am Telefon rollt die Werkzeugleiste, statt aufzuklappen — 20. September 2026

GoodNotes zeigt am aktiven Werkzeug ein kleines Aufklapp-Zeichen; dahinter
liegen seine Einstellungen. Redion braucht das am **Rechner** nicht — dort
stehen sie ohnehin in der Zeile darunter, ohne einen Klick.

**Am Telefon ist es anders.** Gemessen bei E396 (4. September, 390 × 844, im
Dokumentmodus mit einem A4-Blatt):

```txt
dreizehn Werkzeuge, alle 44 px hoch (§37 stimmt)
Leiste 368 px breit, Inhalt 636 px
sieben Werkzeuge stehen im Bild, sechs erst nach einem Wisch
```

Dazu kommt das Zubehör des gewählten Werkzeugs in derselben rollenden Zeile.
Wer den Stift einstellen will, wischt — und wer wischt, verliert die Stelle,
an der er war. E356 hat das entschärft („die Leiste rollt zum Werkzeug"),
aber nicht gelöst.

**Was zu klären ist:** ob das Zubehör am Telefon aus der Zeile herausgeht und
als Blatt von unten kommt, angestossen vom Werkzeug selbst — dann trüge das
aktive Werkzeug mit Recht ein Aufklapp-Zeichen, und die Zeile hielte nur noch
die dreizehn. Das ist ein eigener Bogen mit eigener Messung: er ändert, wo
jede Einstellung wohnt, und Redur zeichnet auf dem Telefon.

**Was es NICHT sein darf:** das Aufklapp-Zeichen ohne das Blatt. Ein Zeichen,
das etwas verspricht, das schon offen daneben steht, ist Zierde — und das
Design-System nennt es beim Namen: *„placeholder controls presented as
complete features."*

## L203 · Ob „keine Durchsicht" wirkt, ist ungemessen — 20. September 2026

`bausteine.css` hat seit E639 eine Regel für `prefers-reduced-transparency`:
die untere Leiste gibt ihr Glas ab, die Linse ihre Brechung, und an ihre
Stelle tritt die volle Marke — damit der aktive Reiter markiert bleibt (§38).

**Dass die Regel dasteht, ist geprüft. Dass sie wirkt, nicht.** Am
20. September nachgemessen:

```txt
page.emulateMedia({ reducedTransparency: 'reduce' })   matches → false
Start mit --force-prefers-reduced-transparency          matches → false
```

Der Chromium, den Playwright hier mitbringt, kennt das Merkmal nicht. Eine
Zusage, die den Zustand nicht herstellen kann, den sie prüft, wäre immer rot —
und das ist kein Wächter, sondern eine Dauerbeschwerde (§55.2). `test539` §6
prüft deshalb die QUELLE: dass die Regel da ist und das Richtige sagt.

**Was zu klären ist:** ob ein neuerer Chromium das Merkmal kennt. Dann wird
§6 von einer Quellenprüfung zu einer echten Messung — und erst dann ist die
Zusage „ohne Durchsicht bleibt die Auswahl sichtbar" belegt statt behauptet.

Dasselbe gilt für die drei älteren Regeln derselben Art:
`studio.css:233` (Menü, Finder, Auswahlleiste), `pdf-studio.css:107` (die
Werkzeugleiste) und `bausteine.css:8467` (die Textur). Keine von ihnen ist je
gegen eine Seite gemessen worden.

## L205 · 382 Prüfläufe vergeben ihren Port von Hand — 20. September 2026

Jeder Prüflauf startet einen eigenen kleinen Webserver. **382 von 481**
schreiben die Portnummer als feste Zahl in die Datei:

```ts
const PORT = 9645;
```

Zwei Läufe mit derselben Zahl können nie nebeneinander laufen — und genau
das ist an zwei Tagen zweimal passiert (E405 am 4. September, E643 am
20. September, zusammen elf Kollisionen). Der Wächter `test400` findet sie
jetzt zuverlässig, aber er behebt nur die Folge: **die Ursache ist, dass die
Zahl von Hand vergeben wird.**

**Sechs Läufe machen es schon richtig** — `test492`, `test524`, `test527`,
`test528`, `test529`, `test538`:

```ts
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const port = (server.address() as { port: number }).port;
```

`listen(0)` heisst „such du dir einen freien". Zwei solche Läufe können sich
**gar nicht** in die Quere kommen, und niemand muss eine Liste führen.

**Warum es nicht in diesem Bogen erledigt ist:** 382 Dateien anzufassen,
während achtzehn Prüfläufe rot sind, ist die falsche Reihenfolge (§46). Und
es ist nicht ganz mechanisch: jeder Lauf baut seine Adressen aus `PORT`, und
wer die Konstante erst nach dem `listen` kennt, muss die Reihenfolge im Kopf
der Datei umstellen. Bei 382 Dateien ist ein Fehler darin teurer als die
Kollisionen, die er verhindern soll.

**Der kleine Schritt, der jederzeit geht:** jeder NEUE Lauf nimmt `listen(0)`.
Dann schrumpft die Liste von selbst, statt zu wachsen. Das steht seit E643
auch im Kommentar von `test400`, wo es gelesen wird.


---

## L206 · `test402` sieht nur deklarierte Höhen, nicht gerenderte

**Gefunden am 20. September 2026 beim Bogen E660.**

`test402` hält §37 („44 px auf den Hauptwegen") über eine Textsuche in den
Stilblättern:

```js
const h = body.match(/(?<!max-)(?:min-)?height\s*:\s*(\d+)px/);
```

Er findet also nur, was als `height` oder `min-height` **dasteht**. Die
Werkzeugzeile der einfachen Tabelle war 26 px hoch, ohne dass irgendwo eine
Höhe stand:

```css
.stab-tools button{ font-size:12px; padding:3px 9px; … }
```

12 px Schrift, zweimal 3 px Innenabstand, zwei Ränder — gerendert 26 px.
Für `test402` unsichtbar, und deshalb stand die Regel auch nicht in
`masse-bestand.json`: er hat sie nie gesehen, also nie eingetragen.

**Das ist derselbe Fund wie in §55.2**, nur an einer anderen Stelle: eine
Messung, die nicht messen KANN, was sie behauptet, sagt immer „passt schon".
Dort war es `scrollWidth` gegen `clientWidth` bei einem Flex-Element, hier
ist es eine Textsuche gegen eine gerechnete Höhe.

**Was heute dagegen hilft:** `test551` misst die gerenderte Box im echten
Browser — für die Tabellenwerkzeuge. Das ist eine Stelle, nicht alle.

**Was fehlt:** ein Lauf, der die Trefflächen der Hauptwege am Telefon
allesamt im Browser nachmisst, statt sie in den Stilblättern zu suchen.
`test402` bleibt trotzdem nützlich: er ist in einer Sekunde durch und fängt
den offensichtlichen Fall (`height:30px`) schon beim Schreiben ab. Die zwei
Prüfungen schliessen einander nicht aus — die zweite fehlt.


---

## L207 · Das Bereichs-Verzeichnis zählt zu wenig — und Redur entscheidet, was daraus folgt

**Gefunden am 20. September 2026 beim ersten vollen Lauf seit E626.**

`test537` hält §5 Regel 1 über `pruefungen/bereiche-bestand.json`: 125 Paare,
517 Treffer, und das Verzeichnis darf nur schrumpfen. Der Lauf wurde rot mit
518 gegen 517. Nachgemessen ist der eine zusätzliche Treffer **kein neuer
Querverweis**, sondern ein alter aus E500, den der Wächter bisher nicht sehen
konnte:

```txt
Einstellungen.oeffne('schluessel')   in src/bereiche/ki/dienst.ts
  in der Fassung, als das Verzeichnis gesetzt wurde:  roh 2 · gefiltert 1
  heute:                                              roh 2 · gefiltert 2
```

`ohneSchablonen` hatte ihn für Text in einer Schablone gehalten. Ein Umbau
des Menüs (E661) hat ihn hervorgeholt.

**Wie viel sonst noch verdeckt ist**, gemessen über alle 86 Dateien in
`src/bereiche/`:

```txt
Aufrufe nach nurCode:              7907
davon nach ohneSchablonen:         7641
verdeckt:                           266   (3,4 %)

  136  editor/ansicht/editor.ts       (457 → 321)
   30  wissen/werkzeuge.ts            (471 → 441)
   26  einstellungen/ansicht/seite.ts (215 → 189)
   21  datenbanken/steuerung.ts      (1119 → 1098)
```

**Die 517 sind ein Mindestwert, kein Stand.** Die Regel dahinter ist richtig
— E626 hat `ohneSchablonen` eingeführt, weil 88 Treffer aus deutscher Prosa
in Backticks mitzählten. Sie wirft nur zu viel weg: `${Datenbank.name(x)}`
in einer Schablone ist ein Aufruf, kein Text.

**Drei Wege, und die Wahl gehört Redur** (§5 sagt es selbst: „Offen ist damit
die Richtung, und sie gehört Redur"):

| Weg | was er kostet |
|---|---|
| **A** Den einen Eintrag von 1 auf 2 korrigieren, mit Grund im Verzeichnis | eine Zeile. Die Zahl bleibt weich, und das Verzeichnis lernt, dass Anheben manchmal geht — genau die Aufweichung, gegen die es gebaut ist. |
| **B** Den Filter genauer machen (nur Textteile weg, `${…}` bleibt) und das Verzeichnis EINMAL auf die Wahrheit setzen | ein halber Tag, ein sprunghaft höherer Stand (bis +266), und danach zählt der Wächter wirklich. Die Schuld wird grösser, weil sie sichtbar wird — nicht weil sie wächst. |
| **C** `ki → Einstellungen` wirklich auflösen | der Menüpunkt „Schlüssel hinterlegen …" müsste über Bus oder Register gehen. Löst EINEN Fall und lässt die 266 stehen. |

Bis dahin ist `test537` rot und `main` bewegt sich nicht (§46). Das ist
Absicht: eine rote Zahl, die auf eine Entscheidung wartet, ist besser als
eine grüne, die nicht stimmt.

**Redur hat entschieden, am 27. September 2026:** „C jetzt, B später" (E698).
Weg C ist gebaut: die KI öffnet die Einstellungen über die Schale
(`App.einstellungen('schluessel')`, `App.einstellungen('mcp')`), das Paar
`ki → Einstellungen` gibt es nicht mehr, das Verzeichnis steht auf
124 Paaren und 516 Treffern, `test537` ist grün. **Offen bleibt Weg B** — der
Filter, der `${…}` in Schablonen mitzählt, und das eine Setzen des
Verzeichnisses auf die Wahrheit. Diese Lücke bleibt offen, bis B gebaut ist.

## L210 · Der Trainer nach E677 — was offen bleibt

**Gefunden am 22. September 2026**, beim Bau von E677. Der Trainer wohnt
im Lernzentrum (`test565`, 54 Zusagen); das hier ist, was nicht in den
Bogen gehörte oder Redurs Wort braucht (§35, §43).

1. **Der Rest des Lösungshefts.** Kapitel 6 hat die Verstanden-Fragen
   6.1–6.41; im Trainer stehen 6.1–6.13, weil nur die Seiten 155–160 im
   Test drankommen. Redur, 21. September: „nehemn was wir brauch nur für
   momentan aber die anderen machst du später legen das im lügen md". Die
   Lösungen 6.14–6.41 und die übrigen Kapitel liegen als Text vor
   (`Lehrmittel_Lösungen18.pdf`); zu jedem braucht es die Buchseiten, sonst
   gibt es die Frage nur als Nummer. Weg: je Kapitel eine Vorlage
   (`<kapitel>-kapitel`), derselbe Bau wie `staatskunde-kapitel`.
2. **Die vorläufige Seite ist ein zweiter Trainer.** `lernen/staatskunde.html`
   und `src/bereiche/wissen/staatskunde-trainer.ts` (Commit `f7f47c7`)
   halten denselben Inhalt mit eigener Lernmaschine und eigenem Stand in
   `localStorage` — genau der doppelte Katalog, den §8 verbietet. Sie bleiben
   stehen, bis Redur sagt, dass sie weg dürfen (§43: nichts löschen ohne
   Rückfrage). Danach beide Dateien samt `quell/…/staatskunde-trainer.js`
   entfernen und diese Zeile schliessen.
3. **Die Route kennt Noten und Stundenplan nicht.** `routeAusHash` in
   `produktwelten.ts` erlaubt `#welt-lernen-<ansicht>` nur für eine feste
   Liste — `noten` und `stundenplan` fehlen darin seit E241/E243, `trainer`
   kam mit E677 dazu. Wer einen Link auf die Noten teilt, landet auf
   „Heute". Ein Wort je Ansicht; dazu ein Wächter, der die Liste gegen
   `Lernwelt.ansichten` hält, damit die nächste Ansicht nicht wieder
   vergessen wird.
4. **`test105` hält nur `src/core`.** Nachgesehen: `ausfuehrbar('src/core')`.
   Für `src/bereiche/**` gibt es keinen Lauf, der sagt, ob das gebaute `.js`
   zur `.ts` passt — `trainer.ts` und `staatskunde-inhalt.ts` sind also
   nur so aktuell wie der letzte `npm run bauen:ts`. Der Lauf müsste
   `src/` ganz lesen (ohne `types/`).
5. **`WissenDienst.heute` rechnet in UTC.** `new Date().toISOString()
   .slice(0, 10)` — in der Schweiz wechselt der Lerntag damit um 01:00
   beziehungsweise 02:00, nicht um Mitternacht. Wer um halb eins lernt,
   zählt für gestern. Ein Leser hat es gemeldet, nachgesehen stimmt es;
   nicht gemessen ist, wer die Funktion alles liest (Tagesziel, Streak,
   Wochenrückschau) — erst zählen, dann eine Zeile.
6. **Im Trainer lässt sich eine Karte nicht ändern.** Wer einen Tippfehler
   in einer Frage sieht, geht auf die Seite und ändert ihn dort — das
   stimmt mit §2 (die Seite ist die Wahrheit), aber ein „Karte öffnen" am
   Kopf der Karte fehlt.
7. **Die KI legt Karten ohne `quiz` an.** `karteikartenAnlegen` (E655)
   schreibt „Frage :: Antwort"; der Trainer sieht solche Karten nicht, weil
   er nur Karten mit `quiz` nimmt. Entweder nimmt der Trainer jede
   Lernkarte (als `schreiben` mit der Antwort als Musterlösung), oder das
   Werkzeug lernt die drei Formen. Das erste ist eine Zeile und
   wahrscheinlich das Richtige — Redurs Wort.

## L211 · `test537` sieht `(globalThis as any)` nicht — 25. September 2026

**Gefunden am 25. September 2026**, beim Plattform-Audit
(`doku/REDION-PLATTFORM-AUDIT.md`, 2.2). Der Bereichswächter aus E626 kennt
zwei Wege, auf denen ein Bereich einen anderen anfasst: den Namen
(`Datenbank.oeffne(…)`) und den Umweg über `(window as any).Name`
(`test537.mts:164, 185`). Es gibt einen dritten, und der ist ihm unsichtbar:

```txt
(globalThis as any).Dateien.ablegen(…)      zeichenflaeche.ts:257, 271  bloecke → dateien
(globalThis as any).Kalender…               datenbanken → …             5 Stellen
(globalThis as any).Bibliothek…             wissen → …                  4 Stellen
```

Gezählt am 25. September: **32 Stellen** in `src/bereiche/` greifen so in
einen fremden Bereich (`grep -rno "(globalThis as any)\.[A-Z][a-zA-Z]*"
src/bereiche`). Keine davon steht in `pruefungen/bereiche-bestand.json`. Das
ist kein neuer Verstoss — es sind alte —, aber ein Verzeichnis, das „nur
schrumpfen" darf, zählt zu wenig, wenn ein ganzer Weg fehlt; dieselbe Sorte
Fund wie L207.

**Was fehlt:** `test537` um `globalThis` erweitern, den Bestand einmal
nachziehen (er wächst dabei — das ist die Wahrheit, keine Verschlechterung)
und L191 daneben stehen lassen: der Griff ins fremde Markup bleibt der vierte
Weg, den niemand prüft.

---

## L212 · ~~Strg+Z nimmt zweimal zurück — und der Seitenverlauf vergibt neue Kennungen~~ — GESCHLOSSEN am 25. September 2026 (Punkt 1 E682/`test568`, Punkt 2 E684/`test569`)

**Gefunden am 25. September 2026**, gemessen mit zwei Sonden im laufenden
Programm (Ausgabe wörtlich in `doku/REDION-PLATTFORM-AUDIT.md`, 2.4).

**1 · Zweimal zurück.** `Planflaeche` (`planflaeche.ts:1017`) und `Marken`
(`marken.ts:4325`) nehmen Strg+Z mit `preventDefault()`, aber ohne
`stopPropagation()`. Der Horcher der Schale hängt am Dokument
(`schale.ts:3178`) und fragt nicht, ob jemand die Taste schon genommen hat;
bei `z` ruft er `Verlauf.zurueck()` (Z. 3252). Ergebnis im Schaltplan: ein
gesetztes Teil, Strg+Z — und es sind wieder drei Teile, Meldung
„Rückgängig", Block neu gezeichnet. Auf dem Blatt: 2 → 1 Striche, aber der
alte Block existiert nicht mehr, sein 100er-Verlauf (E378) ist weg. Die
Gedankenkarte macht es richtig (`stopPropagation`, Z. 1482); das Whiteboard
hat gar keine Taste.

**2 · Neue Kennungen.** `Verlauf.anwenden` (`verlauf.ts:58-67`) leert die
Seite mit `Store.kinderLeeren` — das ist `purgeBlock` je Kind — und setzt den
Baum mit `Store.baumEinfuegen` wieder ein, „immer mit frischen IDs"
(`indexdb.ts:2508`). Gemessen: `b04888d1…` → `eb6edc4f…`. `test70.mts:351`
hält das als Tatsache fest; keinen Wächter gibt es für das Gegenteil. Was
dabei mitläuft, ist gelesen, nicht gemessen: Grabsteine für den Abgleich
(E254) je Block, Versionen weg, Anhänge über `purgeAnhaenge` mit
`dateiAnspruch()` — ob ein Bild ein Strg+Z sicher überlebt, hängt an der
Reihenfolge dieser Kette. E174 hat für den Markdown-Rundlauf entschieden,
dass Kennungen bleiben; für den Verlauf steht die Entscheidung nicht.

**Punkt 1 ist erledigt — 25. September 2026, E682, `test568`:** die
Schale lässt eine Taste liegen, die ein Block schon genommen hat
(`defaultPrevented`), und das Whiteboard hat seine Taste. Die Lücke bleibt
für Punkt 2 offen.

**Gemessen am 25. September (messungen.md):** ein Bild überlebt — der
Dateisatz wird auf den neuen Block umgehängt, die Bytes bleiben. Eine
**Unterseite** überlebt nicht als sie selbst: neue Kennung, ihre geplante
Fassung ist gelöscht (1 → 0), ein Favorit zeigt auf die alte Kennung.
Ein Strg+Z auf der Elternseite löscht den Verlauf der Unterseite (§15).

**Punkt 2 ist erledigt — 25. September 2026, E684, `test569` (36 Zusagen):**
`Store.baumAbgleichen` gleicht über die Kennung ab, Papierkorb statt Purge,
Unterseiten und Zeilen als Blätter; nach dem Bau: Unterseite Kennung gleich,
Fassungen 1 → 1, Favorit gültig. **Damit ist die Lücke geschlossen.** Die
zwei Fassungs-Wiederherstellungen (`fassungen.ts:327`, `werkzeuge.ts:902`)
gehen seit E685 denselben Weg (`test569` §13/§14). Was davon offen bleibt,
hat eigene Nummern: L213 bis L215 darunter.

---

## L213 · Sperren rechnet den Dateianspruch NACH dem Purge — gehen die Bytes eines Bildes mit? — 25. September 2026

**Gelesen, nicht gemessen** — von den Richtern des Bogens E684. `sperren`
(`src/bereiche/wissen/werkzeuge.ts:991`) ruft `Store.kinderLeeren`, also
`purgeBlock` je Kind. `purgeBlock` (`indexdb.ts`) rechnet `dateiAnspruch()`
erst NACH `purgeTief` — wenn die Kinder der gesperrten Seite schon aus dem
Zwischenspeicher sind. Nach dieser Lesart hat dann niemand mehr Anspruch
auf ein Bild der Seite: `purgeAnhaenge` löst die Stücke und meldet dem
Server die Datei als weg. Entsperren legt die Blöcke aus dem Chiffrat
wieder an — mit einer `dateiId`, hinter der keine Bytes mehr liegen.

Wenn das stimmt, ist es §9 und §51 in einem Satz: **Sperren einer Seite
mit Bild löscht das Bild.** Wenn es nicht stimmt, gehört der Grund daneben.
Erst messen (eine Sonde wie in messungen.md, 25. September: Seite mit Bild
sperren, entsperren, Bytes zählen), dann entscheiden — und bis dahin fasst
kein Bogen `sperren`/`entsperren` an (E684 Punkt 7).

---

## L214 · `baumEinfuegen` übernimmt `edited` und `created` aus dem Knoten — 25. September 2026

**Gelesen, nicht gemessen.** `baumEinfuegen` (`indexdb.ts`) löscht aus dem
Knoten nur `id`, `kinder`, `collection`, `views`, `content`; `addBlock`
lässt den Patch gewinnen. Ein dupliziertes, eingefügtes oder aus einer
Vorlage gesetztes Stück trägt damit den `edited`-Stempel des Originals —
und `zuSchicken` (`maschine.ts`) fragt nach `edited > wolkeMarkeHoch`. Ist
das Original älter als die Marke, käme das Duplikat nie zum Server: lokal
da, drüben nie. Dieselbe Falle wie E250/L73, nur eine Ebene tiefer.

**Was fehlt:** eine Messung mit gesetzter Marke (`Abgleich.zuSchicken()`
enthält das Duplikat?), dann — wenn es stimmt — `delete patch.edited` an
der einen Stelle und ein Wächter, der ein Duplikat mit frischem Stempel
verlangt (`test226` als Nachbar).

---

## L215 · `baum` hängt die Sammlung auch an verknüpfte Ansichten — Duplizieren kopiert die Datenbank — 25. September 2026

**Gelesen, nicht gemessen.** `baum` (`indexdb.ts`) prüft nur
`x.collectionId`, nicht `verknuepft`; `baumEinfuegen` legt bei
`k.collection` eine NEUE Sammlung samt Ansichten und Zeilen an. Ein
dupliziertes verknüpftes Datenbank-Fenster (`verknuepft: true`, E?) müsste
damit eine Kopie der ganzen Datenbank erzeugen statt eines zweiten
Fensters auf dieselbe. `purgeTief` kennt die Ausnahme (`!b.verknuepft`),
`baum`/`baumEinfuegen` nicht.

**Was fehlt:** duplizieren, Sammlungen zählen; wenn es stimmt, in `baum`
die Sammlung nur an nicht-verknüpfte Blöcke hängen — mit Wächter.

---

## L217 · Am Telefon steht die Werkzeugleiste im Ruhezustand hinter der unteren Leiste — 26. September 2026

**Gemessen, und auf dem Bild zu sehen** (E689, Bogen 5a): bei 390×844 px
liegt die Leiste des Whiteboards nach dem Öffnen bei 796…866 px, die untere
Leiste der Schale (`#handy-oben`) bei 775…835 — sie überdecken sich um
39 px. Man kommt mit einem Wisch heran (`#scroll` hält `--hunten` = 93 px am
Ende frei), aber im ersten Bild sieht man von der Leiste nur den oberen Rand.

**Warum es kein einfacher Fix war.** Naheliegend wäre `position:sticky;
bottom:var(--hunten)` am Sockel — aber `.wb` trägt `overflow:hidden` (für
die runden Ecken und den SVG-Schnitt), und damit ist `.wb` selbst der
Haltebereich: sticky hätte nichts, woran es kleben könnte. Die andere
Antwort wäre, die untere Leiste beim Zeichnen auszublenden, wie es der
Dokumentmodus tut (`bausteine.css:6485`) — das ist eine Entscheidung über
die Schale, nicht über eine Blockart, und gehört Redur.

**Was fehlt:** die Wahl zwischen (a) so lassen (jede Zeile im Fluss kann
hinter der Leiste liegen, das ist der Preis einer festen unteren Leiste),
(b) `.wb` ohne `overflow:hidden` und dann sticky, (c) die untere Leiste
ausblenden, solange ein Werkzeug gewählt ist. Mit Wächter, egal welche.

---

## L242 · Ein Menü je Ding nach E721: was noch seine eigene Liste hat — 6. Oktober 2026

**Gefunden beim Bau von E721** (Redur, Masterprompt S. 19: „Hier füge ...
und oder beim rechts klicke sollte es mir zeigen löschen" — „Für den rechts
klick bei eine dokument oder eine text usw wo es passen kann"). E721 hat die
Dinge, die Seiten SIND — Ordner, Seite, PDF, Heft, Fach, in Bibliothek
(Deckel, Regal, Tabelle, Ablagebaum), Notizheften, Seitenleiste und
Seitenmenü —, auf EINE Quelle gestellt (`Register.aktionen`). Offen bleibt,
damit es nicht in einem Commit verschwindet (§35):

1. **Die Dinge IN einem Dokument behalten ihre eigenen Listen.** Kopfzeile
   und Spalte einer Tabelle (`spreadsheet/ansicht.ts`), der Reiter eines
   Blatts, Spalte und Zeile der Leinwand-Tabelle (`zeichenflaeche.ts`), ein
   Kasten auf der Fläche, eine PDF-Seite (Miniatur und Seitenknopf),
   Schaltplan und Gedankenkarte. Sie sind keine Seiten; ihre Aktionen
   gehören nicht ins Register einer Seite. In E721 bekamen ihre
   Lösch-Einträge nur `data-gefahr` — sie stehen jetzt am Rechner wie am
   Telefon rot. Rechtsklick ohne Tastaturweg (Blatt-Reiter, Leinwand-Spalte)
   haben noch keinen Binder.
2. **Die Zeile einer Datenbank hat ihr `zeilenMenue` (mit Suche) behalten.**
   Ihr „In den Papierkorb" ist seit E718 derselbe Griff (`App.inPapierkorb`)
   und seit E721 rot; ihr Umbenennen ruft `App.umbenennen`. Gemeldet im
   Register sind ihre Einträge nicht — die Datenbanken laden spät (E715),
   und ihre Liste trägt, was es nur dort gibt (Archivieren, das Suchfeld).
   Zwei Wege zum selben Griff, nicht zwei Griffe.
3. **Die Zeilen der Seitenleiste und der Tabelle der Bibliothek haben
   keinen Tabstopp.** Die Leiste ist eine virtuelle Liste; mit der Tastatur
   führt der Weg über das ⋯ der Zeile (jetzt benannt). Die Tabelle der
   Bibliothek kennt Rechtsklick und langes Drücken, die Tastatur erreicht
   dieselben Dinge in Deckel und Ablagebaum. Das ⋯ der Seitenleiste misst am
   Rechner weiter 20 × 20 und erscheint beim Überfahren (E219, `test114`
   hält das fest) — für die Maus ein Nebenweg neben dem Rechtsklick auf die
   Zeile; am Telefon ist es gross (§37).
4. **„Rückgängig" in der Meldung ist mit Tab weiterhin erst am Ende der
   Seite.** L239 Punkt 4 hat es diesem Zweig zugewiesen. Entf auf einer
   Karte legt weg und meldet es; der Fokus springt dabei NICHT in die
   Meldung — ein Fokus, der von selbst wandert, ist für den Vorleser
   schlimmer als ein weiter Weg. Der Papierkorb bleibt der zweite Rückweg.

## L239 · Ordner nach E718: alte Papierkorb-Seiten ohne Frist, und zwei Regeln für ein Fach — 6. Oktober 2026

**Gefunden beim Bau von E718** (Redur, Masterprompt S. 13: „… die ordner
farbe oder die ordner selbst nicht bearbeiten, behebe das problem"). E718
hat das Weglegen der Bibliothek auf `Store.trashBlock` umgestellt. Zwei
Dinge bleiben offen, weil sie Redur gehören (§35):

1. **Seiten, die VOR E718 über die Bibliothek in den Papierkorb gelegt
   wurden, tragen kein `trashedAt`.** Der alte Weg schrieb nur
   `alive:false` (gemessen: `trashedAt` fehlt, die Seite blieb im Inhalt
   ihres Elternteils, `test594` §13 gegen 1bfaca53). `papierkorbAufraeumen`
   lässt Seiten ohne Stempel liegen — sie laufen nie ab, der Papierkorb
   sortiert sie ans Ende, und „Wiederherstellen" holt sie weiter zurück.
   Verloren ist nichts. Nachtragen (`trashedAt = edited`, einmal) wäre eine
   Datenänderung (§9): nur mit Redurs Wort.
2. **Ein Fach der Notizhefte folgt einer anderen Regel als ein Ordner der
   Bibliothek.** Seit E718 ist der Inhalt eines weggelegten Ordners mit ihm
   weg — in Alle, Zuletzt, Favoriten, Baum und Karten, wie in der
   Seitenleiste — und kommt mit „Rückgängig" zurück. Das Fach dagegen sagt
   „Fach in den Papierkorb gelegt. Seine Hefte bleiben im Regal."
   (`notebook.ts`, `fachKontextMenue`) — und in der Bibliothek verschwinden
   genau diese Hefte jetzt, weil ihr Vorfahr im Papierkorb liegt. Beides
   ist eine bewusste Regel; welche für das Fach gelten soll, entscheidet
   Redur (AUFGABEN, „Nach E718").
3. **Weglegen verlangt „bearbeiten", nicht „loeschen".** Seit der
   Durchsicht vom 6. Oktober fragt `App.inPapierkorb` das Recht an der
   angefassten Seite (`test594` §16). Gewählt ist „bearbeiten", weil die
   Rolle „Bearbeiten" schon vorher weglegen konnte und der Papierkorb
   umkehrbar ist — die Rollenbeschreibung von „Vollzugriff" sagt aber
   „auch … die Seite löschen". Welche gilt, entscheidet Redur (AUFGABEN,
   „Nach E718" Punkt 4).
4. **„Rückgängig" ist mit Tab erst am Ende der Seite erreichbar.** Der
   Knopf ist 44 px, benannt und fokussierbar (§38 formal erfüllt), aber
   `#toast` ist das letzte Kind von `body`. Die Maus und der Finger treffen
   ihn sofort, die Tastatur erst nach allem anderen; der Papierkorb bleibt
   der zweite Rückweg. Gehört zu `claude/menue-eine-quelle`.

## L235 · Zwei Fragen an die Ecke aus E676: eine Probe in `test201` und die Tinte einer zitternden Hand — 28. September 2026

**Gefunden beim Bau von E708** (rot zuerst am Stift, Redur: „ohne eine
funktione löschen … besssere efeckten"). E708 hat `test461` und `test343` §6
im Code repariert. Zwei Dinge aus derselben Wurzel — dem Eckensprung, den
E676 dem Glätter gegeben hat — bleiben offen, damit sie nicht in einem Commit
verschwinden (§35):

1. **`test201` §1 fragt einen rechten Winkel nach einer Kurve.** Die Probe
   `InkGeometry.path([[0, 0], [10, 20], [30, 10]])` verlangt ein ` Q`; seit
   E676 ist ein Knick über rund 57° (`ECKE_COS` = 0,55, hier cos 0) mit
   Absicht eine Ecke, auch in `path`, und heraus kommt
   `M0 0 L10 20 L20 15 L30 10`. Rot seit `04b8c4d5` (E676), auf `main` seit
   PR #112. Die Zusage („Freihand wird geglättet") gilt weiter; überholt ist
   nur die Probe. **Vorschlag:** die Probe wird ein Bogen,
   `[[0, 0], [10, 20], [30, 30]]` (cos 0,8, heraus kommt
   `M0 0 Q10 20 20 25 L30 30`), und der rechte Winkel steht als zweite Zusage
   daneben: „… und ein rechter Winkel bleibt eine Ecke (E676)" (`L10 20`,
   kein ` Q`). Das ändert einen Wächter; das darf ein Rot-zuerst-Bogen nicht
   selbst (§31, §47) — es braucht Redurs Wort oder einen eigenen Eintrag.
   Bis dahin steht `test201` bei 31 von 32, und das ist die ehrliche Zahl.
2. **Die Tinte einer haltenden, zitternden Hand zittert mit.** Der
   Eckensprung liefert bei jedem Kippen der Richtung einen rohen Punkt; ab
   ±2 Einheiten Zittern (die „ruhige Hand" aus E490) lässt der Glätter das
   Zittern fast ungemindert aufs Papier. Spanne der Tinte während eines
   Haltens von 900 ms, nachgerechnet mit dem Glätter vor und seit E676:
   ±1,5 → 1,26 und 1,26; ±2 → 1,78 und **5,07** (roh 5,14); ±3 → 2,96 und
   **7,60** (roh 7,71). `test366` §3 misst bei ±0,4 und sieht es nicht.
   Dasselbe Knäuel hatte auch die Formerkennung blind gemacht (die Sehne
   war keine 90 % des Wegs mehr); das hat E708 geheilt, indem die Erkennung
   eines gehaltenen Strichs nur bis zur Ruhe der Hand schaut. Wo eine Form
   erkannt wird, wird der Strich ersetzt; sonst steht am Ende weiter ein
   kleines Knäuel in der Tinte. Und eine Pause MITTEN im Strich schneidet
   die Erkennung nicht ab (Durchsicht von E708, 4. Oktober, im echten
   App-Lauf): eine gerade Linie, nach der Hälfte 700 ms mit ±2 Zittern
   angehalten, weitergezogen und am Ende gehalten, bleibt auf dem
   Grundstand und mit E708 ein Strich (53 Punkte) — gemessen ist nur der
   Ausgang; dass es das Knäuel der Pause ist, liegt nahe, ist aber nicht
   nachgerechnet. **Vorschlag:** der Sprung erst, wenn die alte
   Richtung weiter gegangen ist als ein Ruhekreis — oder erst die Hand
   (E708) fragen, ob sie hält. Mit Wächter (`test366` §3 auch bei ±2),
   rot zuerst, und `test564` (Zickzack, „M") als Nachbar, denn es ändert
   die Tinte.

**Wächter:** Punkt 1 ist selbst ein Wächter; für Punkt 2 gibt es noch keinen.

---

## L234 · Die „läuft"-Pille gibt es nur für den Zeitmesser — der Ton der Zeitmarken läuft weiter unsichtbar — 28. September 2026

**Gefunden beim Bau von E713.** Redurs Video „LIQUID GLASS" (27. September,
ca. 22:05: „Schau mal das auch an ich will das auch haben") zeigt eine
dunkle Pille, die sagt, dass etwas läuft, und zur Karte aufgeht. E713 hat
sie für den Zeitmesser gebaut. Dieselbe Lücke hat ein zweiter Ort: ein
Zeitmarken-Knopf „▶ mm:ss" (`editor.ts`, `audioRefSpielen`) spielt den Ton
über ein losgelöstes `new Audio()`, wenn der Audio-Block nicht auf der Seite
steht — dann gibt es KEIN Bedienelement: kein Anhalten, kein Springen.

**Warum nicht gleich mit:** der Editor und der Zeitmesser sind zwei Bereiche
(`bereiche/editor`, `bereiche/wissen`), und §5 Regel 1 verbietet, dass einer
den anderen ruft (`test537`). Die Pille muss dafür in die Schale, als EIN
Baustein für beide („läuft": Zeichen, Zeit, Titel, Aufgehen zur Karte,
Escape) — mit eigener Datei, `index.html`, GRUNDSTOCK und Startlast
(`test388`).

**Dazu offen:**
- Die laufende Besprechung (`Meeting.panel`, besprechung.ts) und die
  Aufträge könnten dieselbe Pille nutzen.
- ~~Am Telefon rückt ein Toast nicht über die Pille~~ — erledigt in der
  Durchsicht von E713 (4./5. Oktober): der Toast war am Telefon so breit
  wie der Schirm und lag für seine Sekunden genau auf ihr. Jetzt rückt, was
  meldet, um ihre Höhe darüber (`test590` §10).
- `RedionSpring.sample` ruht bei einem Hundertstel des Weges; wer über 0…1
  rechnet, bekommt am Ende einen Sprung. E713 rechnet in Pixeln; eine
  Warnung am Helfer selbst fehlt.
- Wischen über die Balken des Verlaufs (heute Tipp, Pfeile, Pos1/Ende).
  Seit der Durchsicht steht der Monatsverlauf in Zeilen zu zehn, jede
  Spalte mindestens 32 px (Nebenweg, §37) — treffbar, aber Wischen wäre der
  schnellere Weg.
- Am Rechner kann ein langer Toast in einem schmalen Fenster die offene
  Karte streifen (gemessen in der dritten Durchsicht bei 1024 px: Schnitt
  3'840 px², mit dem alten Feld auf `b3cf1933` 2'560) — der Toast steht
  mittig, die Karte rechts; er nimmt keine Klicks an. Am Telefon geht er bei
  offener Karte nach oben (`test590` §15). Ebenso berührt dort der
  Offline-Streifen die linke untere Ecke der Karte (34 × 33 px Polster,
  keine Taste — wie auf `b3cf1933`); am Telefon steht die offene Karte seit
  der vierten Durchsicht über Streifen, Einladung und Lader (`test590`
  §16). Stehen Lader und Streifen zugleich da, liegen sie am Telefon
  aufeinander (beide auf `--melde-boden` + 12 px, schon vor E713 so) — die
  Karte steht über beiden, aber die zwei decken einander.
- Die Tasten Stoppuhr, 5 Min und 25 Min sind 34 px hoch, das ✕ am Rechner
  34 × 34 — so seit E268, ohne geschriebenen Grund am Ort (§37).

**Was fehlt:** die gemeinsame Pille in `schale/`, mit Wächter (rot zuerst),
und der Zeitmarken-Ton als ihr zweiter Nutzer.

---

## L233 · Der Tropfen nach E712 — was aus dem Video noch fehlt — 28. September 2026

**Gefunden beim Bau von E712**, als Rest seines Auftrags. Redur hat am
27. September um ca. 22:05 das Video „LIQUID GLASS" geschickt: „Schau mal
das auch an ich will das auch haben". E712 hat drei seiner Szenen gebaut:
das „+" und das „⋯" fliessen in ihr Menü (01), die Linse gleitet über
„Heute" (03), die Glaskacheln oben in „Mehr" und in den Einstellungen (04)
(`test589`).

**Was fehlt, ausdrücklich:**

1. **Die Kacheln verschmelzen nicht zur Leiste.** Im Video fliessen sie beim
   Rollen zäh zusammen; hier gleitet die Chipleiste herein. Der Goo dafür
   stünde bereit (`Linse.TROPFEN`), braucht aber eine Bühne über einer
   rollenden Fläche — mit eigenem Lauf, der zeigt, dass beim Rollen kein
   Bild fällt.
2. **Am Telefon fliesst nach dem Wegwischen nichts zurück.** Das Blatt hat
   dort seinen eigenen Abgang (E302); ein Tropfen danach käme zu spät.
   Nach Escape, Wahl oder Tipp daneben fliesst er zurück.
3. **Ein Goo für alle.** Wer als Nächstes einen zähen Übergang baut (der
   Löschen-Knopf aus dem Video von ca. 22:02), nimmt `Linse.TROPFEN` und
   eine kurzlebige Bühne — keinen zweiten Filter, keinen Filter je Zeile
   (Liquid-Karte, „Must-fix" 2).
4. **Die Startgrösse.** E712 wächst den Start um 14,3 KB gzip, mit der
   Durchsicht um 15,5, mit dem Nachtrag um 16,1, mit der dritten
   Durchsicht um 16,3; jedem Zweig der zweiten Welle waren rund 10
   zugeteilt. `test388` §5 auf diesem Zweig allein: 2841 KB von 2850
   (5. Oktober). Wer zusammenführt, zählt nach; sparen liesse sich zuerst
   an den Kommentaren von `linse.ts` und `menue.ts`.

**Was es NICHT ist:** kein Fehler. Jeder Eintrag beider Menüs steht, wo er
stand, und jede Einstellung hat ihren alten Ort (§43).

---

## L232 · Suche und Meldungen nach E711 — was aus den Szenen 07 und 08 noch fehlt — 28. September 2026

**Gefunden beim Bau von E711**, als Rest seines Auftrags. Redur hat am
27. September um ca. 22:05 das Video „Liquid Glass" geschickt: „Schau mal
das auch an ich will das auch haben". E711 hat daraus gebaut: die Suche
wächst aus der Kapsel, neue Treffer kommen nacheinander, EINE Marke gleitet
mit ↑ ↓ (Suche, Befehlspalette, Menü mit Suche) und trägt „↵ Enter";
`#toast` wird ein Stapel aus bis zu drei Meldungen; die Glocke fächert die
letzten drei auf und fliesst nach „Alle gelesen" in sich zurück; der
Posteingang zeigt Glaskarten (`test588`).

**Was fehlt, ausdrücklich:**

1. **Escape in der Suche leert zuerst das Feld** (Szene 07: „Escape clears
   the text first and, pressed again, closes"). Heute schliesst Escape
   sofort, wie seit jeher; mehrere Läufe verlassen sich darauf. Braucht
   einen eigenen Lauf, der beide Wege zeigt.
2. **Die Liste als Combobox für den Vorleser** (`role="combobox"` am Feld,
   `listbox`/`option`, `aria-activedescendant`). Die Marke ist nur Bild
   (`aria-hidden`); gesagt wird die Wahl heute nicht.
3. **Enter als Übergabe** (Szene 07, 13,40–13,75 s): die Scheibe hebt sich,
   der Inhalt geht, die Fläche wird zur Meldung. Heute schliesst Enter und
   öffnet — ohne die Übergabe.
4. **Der Kick und der Tropfen** (Szene 08, 14,50 s): vor dem
   Zusammenfliessen ein kurzer Schlag (Skalierung und Drehung), danach ein
   Glastropfen als „nichts mehr da". Bewusst weggelassen (ruhig, §39);
   Redur entscheidet, ob er es will.
5. **Wischen mit der Maus.** Am Rechner greifen die Karten des Stapels nicht
   nach dem Zeiger (wie `#toast`, sonst verschluckten sie Klicks auf das
   darunter); weggenommen werden sie dort mit Escape oder von selbst.
6. **EIN Goo-Filter für alle Zweige.** `SelectionFlow.goo` legt `#ru-goo`
   einmal an. Die Zweige `claude/loeschen-fluessig` (E709) und
   `claude/tropfen-und-kacheln` (E712) bauen dieselbe Technik; beim
   Zusammenführen bleibt EIN Filter.

7. **Meldungen als Glas.** Der Auftrag nannte „glass toasts"; E703 (c) hat
   Glas für Toast und Lader verworfen (doppelter Druck beim Einblenden über
   `opacity`, Glas auf Glas). Der Stapel ist deshalb deckend mit
   Lichtkante. Glas hier nur, wenn Redur E703 (c) dafür aufhebt.
8. **Wegwischen ist am Telefon ein Schnippen, kein Ziehen** (Durchsicht,
   4. Oktober). Die Karten sind `pointer-events:none` wie `#toast` — ein
   Tipp geht durch sie hindurch. Darunter liegt meist Inhalt, der rollen
   darf; der Browser nimmt den Zug deshalb nach ein, zwei Bewegungen an sich
   (`pointercancel`). Gezählt wird seither die letzte Bewegung: deutlich zur
   Seite ist ein Schnippen und nimmt die Karte weg; langsam mitziehen geht
   nicht. Echt ziehen hiesse, die Karten am Telefon zu Zielen zu machen —
   dann nähmen sie den Knöpfen darunter den Tipp. Redur entscheidet.
   Seit der sechsten Durchsicht (5. Oktober): ruhte der Finger länger als
   300 ms, bevor er losging, ist es kein Schnippen — der Zug gehört dem,
   was darunter liegt (eine Kladde, ein Block, eine Marke im PDF werden
   nach 400 bis 500 ms gehoben; `test588` §14, `test360`).
9. **Die Trefferzeilen der Suche sind am Telefon 39 px hoch** (gefunden in
   der Durchsicht, 5. Oktober; NICHT von E711 — auf `b3cf1933` genauso,
   gemessen mit derselben Sonde). §37 verlangt 44 px auf dem Hauptweg. Die
   Zeilen tragen jetzt die Marke; ihre Höhe hat E711 nicht angefasst. Ein
   eigener Bogen: die Zeilen am Telefon auf `var(--touch-min)`, mit
   `test362` (exakte Zahlen in `marken-decke.json`) und `test402` als
   Nachbarn und einem Lauf, der die Höhe am Telefon misst.
10. ~~**Der Fächer beim Zeigen liegt über „KI" und „Favorit"**~~ —
   GESCHLOSSEN am 5. Oktober (fünfte Durchsicht). Gefunden in der vierten
   Durchsicht: am Rechner ging er 8 px unter der Glocke auf, 340 × 242 px,
   und deckte die zwei Knöpfe rechts in der Kopfzeile der Seite. Wer auf
   der Glocke verweilte und dann dorthin wollte, fuhr in den Fächer; solange
   der Zeiger darauf lag, blieb er offen, und ein Klick traf eine Meldung.
   Die vierte Durchsicht liess es Redur offen; die fünfte hat es repariert,
   weil der Weg länger war als auf `b3cf1933`: der Fächer geht jetzt unter
   der Reihe auf, die direkt unter der Glocke steht (`unterDerReihe` in
   hinweis.ts), „KI", „Favorit" und „…" bleiben frei. Beweis: `test588`
   §13 — rot gegen die Reparatur der vierten Durchsicht, grün danach; die
   Gegenprobe (Fächer wieder 8 px unter der Glocke) macht ihn wieder rot.
   Ob der Fächer beim Zeigen überhaupt aufgehen soll, bleibt Redurs Wahl.

**Was es NICHT ist:** kein Fehler. Jeder Griff geht wie vorher (Klick auf
die Glocke, Strg P, Strg K, `#q`, `[data-i]`, Enter, Escape).

---

## L231 · Noch 45 Fenster des Browsers: confirm, prompt und alert — 28. September 2026

**Seit E710** fragen `Dialog.frage`, `Dialog.wahl` und `Dialog.mehrzeilig`
im Fenster des Touch Kits, und für `confirm()` und `alert()` gibt es
`Dialog.bestaetigen` und `Dialog.melden`. Sechs Stellen sind umgezogen (die
Gefahrzone der Einstellungen und das Löschen mehrerer Datenbankzeilen).
**45 stehen noch** in `src/` — grau, anhaltend, ohne roten Knopf; `test587`
§10 zählt sie und lässt die Zahl nur sinken.

```txt
schale.ts            8   Papierkorb leeren/löschen (confirm), Sicherung
                         und Einspielen (alert, fünfmal)
wissen/werkzeuge.ts 11   Verschlüsseln: Passwort zweimal (prompt), Fehler
                         (alert) — test265 §7 beantwortet das Passwort über
                         das Fenster des Browsers; Titel/Notiz (prompt),
                         Fassung wiederherstellen (confirm)
datenbanken/         8   Optionen, Ansichten, Datenbank benennen (prompt),
steuerung.ts             Zeilen, Spalte, Datenbank löschen (confirm)
verbinden/           6   Abmelden, Wolke, Besprechung (confirm)
übrige              12   Editor-Knopf, Links, Erwähnung (Datum), KI-Websuche,
                         Fassungen, Zeichenfläche leeren, Protokoll,
                         Ordnersicherung, OCR-Adresse, Chronik-Zugang,
                         Staatskunde
```

**Warum nicht alle in E710.** Viele liegen an Wegen, die ein Prüflauf über
das Fenster des Browsers bedient (`page.on('dialog', …)`): der Umzug muss
dort im selben Bogen den Lauf mitnehmen, sonst wartet er auf ein Fenster,
das nicht mehr kommt. Und aus einem `confirm()` in einer gewöhnlichen
Funktion wird ein `await` — jede Stelle braucht einen Blick darauf, ob
danach etwas stillschweigend vorausgesetzt hat, dass die Antwort sofort da
ist (E710 hat dafür bei den Datenbankzeilen das Löschen in das `then`
gezogen).

**Was fehlt:** je Datei umziehen, mit ihrem Lauf (rot zuerst), und den
Bestand in `test587` §10 senken. Das Passwort des Verschlüsselns gehört
zuerst dazu: `Dialog.frage(…, 'passwort')` zeigt es nicht im Klartext —
das Fenster des Browsers schon. Geschlossen ist die Lücke bei 0.

---

## L230 · Der Löschen-Knopf nach E709 — was noch nicht zerfliesst, und ein Knopf, den die Tastatur nicht erreicht — 28. September 2026

**Gefunden beim Bau von E709.** Redur, 27. September, ca. 22:02: „Ich will
das du löschen button so ist überla wo etwas zum löschen eine buton gibt".
E709 hat alle 23 runden Löschen-Knöpfe (`🗑` als eigener Knopf, dazu das ✕
der Chatliste) auf `RedionDelete` gestellt. Drei Dinge sind offen:

1. **„Endgültig löschen" im Papierkorb ist mit der Tastatur nicht
   erreichbar** — älter als E709. Die Tat-Stellen (`.pk-tat`, ↩ ↳ 🗑) sind
   `<span>` IN einer Zeile, die selbst ein `<button>` ist (zurückholen und
   öffnen). Ein Knopf in einem Knopf ist kein gültiges HTML; mit der
   Tastatur kommt man nur an die ganze Zeile. E709 gibt den Fokus nach
   „Abbrechen" deshalb an die Zeile zurück. Richtig wäre eine Zeile aus
   einem Knopf und daneben drei echten Knöpfen — ein Umbau des Papierkorbs,
   den `test33` und `test59` bewachen.
2. **Löschen, das KEIN runder Knopf ist, fragt weiter auf seine Art.** Die
   Menüzeilen („In den Papierkorb verschieben", „Datenbank löschen" …)
   bleiben Menüzeilen (Auftrag: ein Menüeintrag ist kein runder Knopf). Die
   Wortknöpfe „Löschen" in Werkzeugleisten (Auswahl im PDF, `Entf`) und im
   Seitenblatt des Dokuments legen weg, was Strg Z oder der Papierkorb
   zurückholt; ein zweiter Schritt dort bremst das Zeichnen. Ebenso
   Wortknöpfe ohne Papierkorb: „Löschen" an Kommentar und Antwort
   (`kommentare/ansicht/faden.ts`), am Datensatz-Blatt einer Datenbank
   (`datenbanken/steuerung.ts`), „Löschen"/„Entfernen" bei Workern und
   „Öffnen mit" in den Einstellungen. Ob auch sie zum runden Knopf werden
   und zerfliessen sollen, entscheidet Redur mit einem Bild.
3. **Kleine ✕ zum „Entfernen" in Formularen** (eine Filterregel, eine
   Kachel, eine eigene Farbe) sind Bearbeiten, nicht Löschen von
   Gespeichertem, und blieben, wie sie sind.
4. **Nachgesehen am 3. Oktober (Durchsicht E709): zwei Zeichen-Knöpfe, die
   die Suche von `test586` §2 nicht sieht.** Sie liest `<button …>🗑</button>`
   wörtlich und `x.textContent = '🗑'` — nicht einen Knopf, der aus einer
   Tabelle gebaut wird:
   - die Leiste der Gedankenkarte, `['weg', '🗑', 'Ast löschen (Entf)']`
     (`bloecke/arten/gedankenkarte.ts`, gebaut über `${ico}`): ein eckiger
     Leistenknopf (28 × 26 px, Radius 5) neben ＋ ⏎ T ⊟, er nimmt den
     gewählten Ast mit allen Unterthemen, `Entf` tut dasselbe in einem
     Schritt;
   - die Auswahlleiste der Planfläche, `✕` „Löschen (Entf)"
     (`bloecke/arten/planflaeche.ts`) neben ↻ ⇄ ⧉ ⬚.
   Beides sind Werkzeugleisten über einer Auswahl wie die Auswahl im PDF
   (Punkt 2), keine runden Knöpfe — umgestellt ist keiner. Dazu, ebenfalls
   unverändert: „🗑 Löschen" im Seitenblatt des Dokuments
   (`pdf/document-mode.ts`, Wort mit Zeichen, Punkt 2) und die Liste „Eine
   Vorlage löschen" (`datenbanken/steuerung.ts`, `🗑 <Name>` je Vorlage, ein
   Untermenü).
5. **Nachgesehen am 5. Oktober (zweite Durchsicht E709)**, über jedes
   `data-weg`/`data-del`, jedes ✕ und 🗑 und jeden Namen mit „löschen" oder
   „entfernen" im Quelltext. Kein weiterer runder 🗑-Knopf. Neu genannt,
   NICHT umgestellt:
   - das ✕ „Entfernen" auf der **Kennzahl-Karte**
     (`datenbanken/datenmodell/ansicht.ts`): nimmt eine gespeicherte
     Kennzahl weg, ein kleines ✕ im Kopf der Karte;
   - das ✕ einer **Freigabe in der Wolke** (`verbinden/ansicht/wolke.ts`,
     12 px, ohne Namen): nimmt einer eingeladenen Person den Zugang;
   - die **eigenen Emoji** in den Einstellungen
     (`einstellungen/ansicht/seite.ts`, `data-tun="emoji-weg:…"`): das Bild
     selbst löscht beim ersten Klick („klicken zum Entfernen"), ohne Frage;
   - das ✕ einer **Sortierung** (`datenbanken/steuerung.ts`), wie die
     Filterregel und die Kachel aus Punkt 3 eine Formularzeile.
   Keiner ist ein runder Löschen-Knopf; ob sie es werden, ist Redurs Wahl
   (mit einem Bild), wie bei 2 bis 4.
6. **Die Warnung des alten `confirm()` im Papierkorb fehlt** (gesehen am
   5. Oktober): es sagte „… Mit ihm gehen seine Fassungen und Anhänge. Das
   lässt sich nicht rückgängig machen." Die rote Pille sagt „Endgültig
   löschen" — das Unumkehrbare steht da, die Fassungen und Anhänge nennt
   niemand mehr. Ein Satz unter dem Paar (oder im Namen der roten Pille)
   brächte es zurück, ohne das Paar zu verbreitern.

**Was fehlt:** zu 1 der Umbau der Papierkorbzeile mit Wächter; zu 2, 3,
4 und 5 Redurs Wahl (mit einem Bild der Leiste); zu 6 der Satz; zu 4 ausserdem, dass
`test586` §2 auch aus Tabellen gebaute Knöpfe liest — erst, wenn Redur
gewählt hat, sonst würde der Wächter eine offene Wahl als Fehler melden.

---

## L229 · Das Material zum Ziehen gibt es an der unteren Leiste — noch nicht am Zubehör und in den Einstellungen — 28. September 2026

**Gefunden beim Bau von E706**, als Rest seines Auftrags. Redur hat am
27. September um ca. 21:47 die Tab-Leiste seines Touch Kits geschickt: „ich
will das du auch das ¨berla nutze will wo es nötig ich also beim stift
übergangen usw". E706 hat das Material an drei Orten gebaut: die Pille der
unteren Leiste lässt sich mit dem Daumen ziehen (hebt sich, dehnt sich,
rastet ein), der Werkzeugflug der Stiftleiste fährt auf der Feder des Kits,
und in sechs Reihen (Seite/Fläche/Redion, Heute, die Wege im Regal, die
Reiter von „Aussehen", die Liste der Einstellungen, das Zubehör der
Stiftleiste) fliegt die Wahl, statt zu springen (`test585`).

**Was fehlt, ausdrücklich:**

1. **Schieben über das Zubehör der Stiftleiste.** Die Karte (material-5)
   schlägt vor, den Finger über Stifte, Farben und Breiten zu ziehen, mit
   Vorschau unter dem Finger — wie an der unteren Leiste. Der Helfer dafür
   steht (`SelectionFlow.ziehbar` mit `baue`, einer kurzlebigen Fläche),
   ist dort aber NICHT gebunden: die Reihe rollt am Telefon waagerecht, und
   ein Zug muss sich mit dem Rollen der Reihe und mit einem Strich auf dem
   Blatt einigen. Das braucht einen eigenen Lauf, der beides zeigt.
2. **Wahl-Listen mit zwei oder drei Möglichkeiten** in den Einstellungen
   (Hell/Dunkel/System, Klein/Normal/Gross, Normal/Ruhig …) sind weiterhin
   `<select>`. Die Karte schlägt `Segment` vor; das ändert den Weg, auf dem
   acht Prüfläufe die Einstellungen setzen, und gehört in einen Bogen mit
   diesen Läufen zusammen.
3. **Die Feder als Marke.** `SelectionFlow.FEDERN` führt `knapp` und
   `druck` mit den Zahlen des Kits (`--ui-spring-snappy`,
   `--ui-spring-press`). Sobald `grund.css` die Kit-Federn als Marken hat
   (Zweig `claude/fluessige-bewegung`: `--feder-knapp`, `--feder-druck`),
   soll die Tafel sie von dort lesen —
   die Zahlen stünden dann an EINER Stelle (§8).

**Was es NICHT ist:** kein Fehler. Alles, was es vorher gab, geht wie
vorher (Tipp, Tastatur, Vorleser, ohne Bewegung).

---

## L228 · Weiss auf der Astfarbe der Gedankenkarte ist im Dunkeln zu blass — 28. September 2026

**Gefunden beim Bau von E705**, nicht gesucht. Die Gedankenkarte malt drei
kleine Dinge WEISS auf die Farbe eines Astes: die Zahl an einem
zugeklappten Ast (`.gk-zahl`), das „+" der vier Griffe (`.gk-griffel`) und
— über `--ast-zug` — deren Fläche. Die acht Astfarben (`Gedankenkarte.PALETTE`)
sind mittelhelle Töne; Weiss darauf hat gerechnet:

```txt
Gelb #c9a227 2,4 · Orange #e08a2e 2,7 · Türkis #3fa3a0 3,0 · Grün #4a9d5f 3,3
Blau #2f8ab5 3,9 · Rot #d9534f 4,0 · Rosa #c2549b 4,2 · Violett #7a5cc5 5,0
```

Im Hellen nimmt die Karte seit E705 die dunklere Tinte (`--ast-hell`,
4,6 : 1 auf hellem Grund), und Weiss darauf wird besser; im Dunkeln bleibt
die gespeicherte Farbe, und dort ist die Zahl auf Gelb kaum zu lesen. Die
Astfarben selbst zu ändern hiesse, gespeicherte Karten umzufärben (§9).

**Was fehlt:** die Schrift auf dem Ast gerechnet statt fest — wie
`--auf-accent` (E705): Weiss, wo es reicht, sonst ein getöntes Dunkel im Ton
des Astes. Mit einem Punkt in `test584` oder `test529`, der die Zahl an
einem gelben Ast misst.

---

## L227 · Der Stift nach E704 — was an Messung und Weg noch offen ist — 28. September 2026

**Gefunden beim Bau von E704** (Redur: „bessere stift efeckte beim
zeichnen"). Was E704 gebaut hat, steht dort und in `test583`; das hier ist der
Rest, damit er nicht in einem Commit verschwindet (§35).

1. **Das iPad ist nicht gemessen.** Alle Zahlen zum nassen Strich kommen aus
   Chromium am Rechner mit künstlichen Stiftereignissen (CDP). Wie oft
   Safari `getPredictedEvents` und `getCoalescedEvents` liefert, und ob ein
   Bild dort unter 8 ms bleibt (L209 Punkt 5), weiss niemand. Vorschlag
   stift-11: ein Schalter „Stift messen" unter Einstellungen, zehn Sekunden
   schreiben, Zahlen zum Kopieren — lokal, ohne Netz. Erst danach eine
   Canvas-Ebene, mit eigenem E-Eintrag.
2. **Das Absetzen ist auf einer vollen Seite nicht billig** (stift-10):
   6–16 ms bei 60 Punkten, 36–46 ms bei 800 Punkten mit 300 Marken (Dossier).
   `points()` wird mehrfach gerechnet, Kritzel- und Lassoprüfung laufen
   ohne Vorprüfung. Zielwert ≤ 8 ms bei 250 Punkten. Die Speicherung um ein
   Bild zu verschieben braucht den Nachweis, dass `pagehide` sie mitnimmt
   (§51).
3. **Ein Keilmarker ist ein grosser Pfad**: 300 Punkte ≈ 28 KB `d`, nass
   1,35 ms je Bild (messungen §76). Unter der Schwelle, aber das Zehnfache
   des Umrisses. Wenn es drückt: gröber abtasten (heute 1 pt) oder die
   Bänder vor dem Ablegen vereinfachen.
4. **Auf der Tafel gibt es nur den Kugelschreiber.** Seit E704 glättet sie
   und zeichnet durch die Mittelpunkte, aber ohne Druck, Füller, Spitze und
   Marker. Dafür müssten `druckFaktor`, `halbeBreiten` und `STIFTE` aus
   `bereiche/pdf/marken.ts` in den Kern (§5 Regel 1) — ein eigener Bogen.
5. **Die Kachel-Strichprobe ist ein Balken geblieben** (18 px breit). Die
   Probe im Farbfeld ist seit E704 ein echter Strich; in der Kachel wäre ein
   Schwung unlesbar. Sie trägt Farbe und Deckung (E623), beim Marker die der
   Spitze.
6. **Die Vorhersage bei gleichmässig schneller Hand**: wer ohne Bremsen und
   ohne Druckabfall abhebt, sieht bis zu `VORHER_PX` (26 pt) Schwanz
   verschwinden — die Bremse greift nur, wenn Hand oder Druck es ankündigen.
   Am Gerät messen (Punkt 1), bevor der Deckel enger wird: zu eng bringt den
   Rückstand zurück, den E511 weggenommen hat.
7. **Die Startgrösse wächst um 14,7 KB gzip** (messungen §76) — mehr als
   die rund 10 KB, die jedem Zweig der Bitte vom 27. September zugedacht
   sind. Rund 6 KB davon sind Kommentare, die `tsc` in `quell/` mitnimmt.
   Wer zusammenführt, zählt die Summe aller Zweige gegen die 83 KB Luft unter
   der Decke von `test388` §5; reicht sie nicht, sind die Kommentare in
   `marken.ts` der erste Ort (das Warum steht vollständig in E704).

**Wächter:** `test583` hält, was gebaut ist; für 1–7 gibt es noch keinen
(Punkt 7 zählt `test388` §5 nur als Ganzes).

---

## L226 · Was das Glas nicht selbst lösen kann: Sands stille Schrift, die Kapsel, das Kit-Glas — 28. September 2026

**Seit E703** ist Glas, was schwebt: Menüs, Finder, Auswahlleiste, die
untere Leiste am Telefon und die zwei schwebenden Werkzeugleisten. `test582`
misst die Lesbarkeit an Pixeln über dem schlimmsten Grund, in allen zehn
Schemata. Drei Dinge bleiben offen, und keines gehört der Dichte:

```txt
1  SAND, STILLE SCHRIFT  `--text-dim` (#66655f, aus hell.css — Sand setzt nur
                         --text) hat auf der Sand-Karte #efe6d6 schon VOLL
                         nur 4,72 : 1. Auf Glas über reinem Schwarz: 3,97
                         (Menü-Gruppentitel, Kürzel, Namen der unteren
                         Leiste). Damit das Glas 4,5 hält, bräuchte Sand
                         97 % Dichte — also kein Glas. Die Farbe gehört dem
                         Farbzweig (claude/bessere-farben). `test582` nennt
                         Sand in SCHEMAFARBE; die Liste darf nur schrumpfen,
                         und ein Eintrag, den keine Messung mehr braucht,
                         macht den Lauf rot.
2  DIE KAPSEL ZURÜCK/VOR Im Dokument bleibt `.document-ink-history` deckend
                         (E396, `test393` §3: nichts darf durchblitzen). Mit
                         echter Unschärfe blitzt nichts mehr scharf durch —
                         ob sie wie der Dock Glas wird, ist Redurs Wahl.
3  KIT-GLAS IN DER BRÜCKE Die Glas-Bauteile des Kits (Dialog, Aktionsblatt,
                         Popover, Toast …) schreiben die Präfix-Folge
                         verkehrt (L222 Punkt 3) und 24 statt 20 px. Sobald
                         Stufe 1b sie zeigt, braucht `src/islands/bridge.css`
                         dieselbe Unschärfe (`--glas-blur`) in der richtigen
                         Folge — `test582` §11 liest `bridge.css` schon mit.
```

**Was fehlt:** (1) eine Sand-Farbe für die stille Schrift mit mindestens
5,4 : 1 auf der Karte, dann Sand aus `SCHEMAFARBE` streichen; (2) Redurs
Wort zur Kapsel; (3) die Brücke, sobald eine Kit-Insel Glas zeigt.

**Punkt 1 erledigt beim Zusammenführen (28. September 2026, E703 × E705):**
E705 gab Sands stiller Schrift 5,31 : 1 auf der Karte — knapp unter den
5,4, aber genug: mit dem dichten Glas hell bei 93 % (statt 92) hält sie über
reinem Schwarz 4,5 (`test582` §9/§10 ohne Ausnahme). Sand ist aus
`SCHEMAFARBE` gestrichen; die Liste ist leer. Offen bleiben (2) und (3).
Geschlossen ist die Lücke, wenn `SCHEMAFARBE` leer ist, die Kapsel
entschieden ist und `test582` §11 auch das gebaute Inselblatt liest.

---

## L225 · Flüssige Bewegung: was nach E702 noch aussteht — 28. September 2026

**Gefunden beim Bau von E702** (Redur, 27. September, ca. 21:45: „Wie im
UI-Kit (Empfohlen)"; ca. 22:10: „bessere übergagnge besssere efeckten").
E702 hat die Federn des Kits in Redions Schale gebracht — Marken, Federkern,
Druckfeder, Schalter, Blätter von unten, Ankunft, „Ruhig". Gemessen und
nicht getan, jedes mit seinem Ort (Karte „bewegung", 27. September):

```txt
Was                                   Wo                                   Warum offen
Rechner-Menüs und Dialoge: Abgang     menue.ts (Rechner), dialog.ts        kommt mit den Inselstufen (E699
  und leichtes Nachschwingen          (.finder, studio-arrive)             Punkt 10: Popover, Dialog snappy)
Material der Leiste, Stiftwahl,       seitenleiste.ts, SelectionFlow       Zweig claude/material-ueberall
  Umschalter (knappe Feder)                                                (nutzt RedionSpring, E646 ergänzt)
Blöcke ziehen: Marke springt 2 px     editor.ts:2038-2105                  bewegung-ziehen, kein Wächter
Balken und Knebel über width/left     bausteine.css:3974/7781/8217/8419,   bewegung-layoutfrei
                                      ki.css:89, motion.css:976
157 rohe Dauern, 145 blosse `ease`    quell/schale/stil (ohne motion.css)  bewegung-marken
Einzeichnen der Lernwelt ruckelt      motion.ts, lernwelt.ts:646-691       bewegung-einzeichnen
  beim Aufbau
Blatt der Datensätze bewegt height    sheet.ts:168-172, 244                bewegung-blatt-transform
`linear()` ohne Rückfall              quell/islands/islands.css            upstream UI-Kit (L222)
Querformat am Telefon (> 760 px,      menue.ts amTelefon()                 Bewegung gleich, nicht mit
  grober Zeiger)                                                           Bildern angesehen
```

**Was fehlt:** jeder Punkt mit einem Wächter, rot zuerst, und Bildern vor
und nach — am Telefon Bild für Bild (alle 33 ms), wie `test581` es für
Druck, Schalter, Blatt und Ankunft tut.

---

## L224 · Die kleinen Kurven in den Kennzahlkarten zeigen feste Werte, keine echten — 28. September 2026

**Gefunden beim Bau von E701**, als die Kennzahlkarten des Lernzentrums in
Ruhe grau wurden. Jede Karte („fällige Fehler", „fällige Karten", „neue
Karten", „nächste Wiederholung") trägt unten eine kleine Kurve
(`.rmo-pfad`). Sie kommt aus `src/schale/bedienung/motion.ts:218-240` und
zeichnet in JEDER Karte dieselben fünf festen Höhen:

```txt
[8, 13, 6, 17, 11]
```

Sie sieht aus wie ein Verlauf der Zahl darüber — und ist keiner. Bei
„fällige Fehler 0" steigt und fällt dieselbe Kurve wie bei „neue Karten 4".
Farbig im Akzent las sie sich wie eine Aussage.

**Was E701 getan hat, und was nicht:** die Kurve ist in Ruhe neutral (grau,
`filter:saturate(0)`), damit sie nichts behauptet; angefasst wird sie
farbig wie bisher. Sie ist NICHT gelöscht (Redur, 16:45 UTC: „ohne etwas
lösche") und es sind KEINE Daten dafür erfunden worden. Redurs Frage aus
dem Fragebogen der Karte — grau lassen, echte Werte zeigen oder weglassen?
— ist damit nur für die Farbe beantwortet.

**Was fehlt:** echte Werte. Für „fällige Karten" und „fällige Fehler" gibt
es sie (`reviewVerlauf` je Karte, die sieben Tage aus „Letzte 7 Tage");
für „nächste Wiederholung" ist eine Kurve vielleicht gar nicht sinnvoll.
Dann: die Kurve aus den echten Tageswerten zeichnen, oder dort, wo es keine
gibt, keine zeichnen — mit einem Prüflauf, der die Kurve gegen die Zahlen
hält (§30), und nach Redurs Wahl.

---

## L223 · Im Ordnerbetrieb steht in der Fehlerliste nur „Script error." — 27. September 2026

**Gefunden beim Bau von E699**, nicht gesucht. Die erste Fehlergrenze der
React-Inseln meldete über `reportError` — also über denselben Weg, den jeder
unbehandelte Fehler in Redion nimmt: `Pflege` hört auf `window` „error" und
schreibt die Meldung in die Fehlerliste („Erste Hilfe → Fehler ansehen").
`test579` §8 fand dort aber keinen Text, sondern:

```txt
{ text: "Script error.", wo: ":" }
```

**Nachgemessen, und es betrifft nicht nur die Inseln.** Ein Fehler aus
Redions eigenem Code (`Sanitize.html` mit einem Wert, der beim Umwandeln
wirft, aus einem Zeitgeber heraus) landet per Doppelklick (`file://`)
genauso: „Script error." ohne Datei und ohne Zeile. Unter `file://` ist
jede Datei ihr eigener Ursprung, und der Browser schwärzt Meldungen aus
fremdem Ursprung für `window.onerror`. Die Fehlerliste — gebaut, damit ein
Mensch später sieht, was schiefging (§7, `reporter.ts`) — ist im
Ordnerbetrieb für unbehandelte Fehler also leer an Inhalt. Über das Netz
und in der Einzeldatei (alles in einer Datei) gilt es nicht.

**Die Inseln sind schon ausgenommen:** sie melden als Ereignis an ihren
Lader, und der an `Reporter.error` — dort steht der Text (E699).

**Was fehlt:** ein Weg, auf dem Redions eigene unbehandelte Fehler auch im
Ordnerbetrieb ihren Text behalten. Denkbar: die Einstiegspunkte (Zeitgeber,
Zuhörer der Schale) über `Reporter.guarded` laufen lassen, oder
`crossorigin` prüfen (hilft unter `file://` vermutlich nicht). Zuerst ein
Prüflauf, der den Fall per Doppelklick zeigt (§30), dann die Reparatur.

---

## L222 · Das Touch Kit in Redion: was upstream in UI-Kit noch fehlt — 27. September 2026

**Seit E699** liegt das Touch Kit als Kopie von UI-Kit @c192821 in
`fremd/touch/`, und hier wird darin nichts von Hand geändert. Sechs Dinge
gehören deshalb nach UI-Kit, nicht nach Redion (der sechste kam bei der
Durchsicht dazu):

```txt
1  STRENGE TYPEN      Unter Redions Schaltern (§52.6) hat das Kit 73 Fehler:
                      56 noUncheckedIndexedAccess, 15 exactOptionalProperty-
                      Types, 2 noImplicitReturns. Bis UI-Kit den Durchgang
                      macht, prüft tsconfig.islands.json mit den Schaltern
                      des Kits — eine Abweichung von §52.6. Redions eigener
                      Inselcode hält die strengen (test578 §8).
2  RUHIGE DARSTELLUNG Die Federn des Kits in JavaScript (animateSpring,
                      useReducedMotion) fragen nur das System
                      (prefers-reduced-motion), nicht body[data-bewegung=
                      "ruhig"]. Für CSS reicht Redions Regel; für die
                      JS-Federn (Blatt, Navigation, Tab-Leiste — ab den
                      Stufen, die sie benutzen) braucht es einen Haken im
                      Kit, über den Redion „ruhig" melden kann.
3  GLAS-REIHENFOLGE   Das Kit schreibt backdrop-filter VOR -webkit-backdrop-
                      filter. lightningcss (im Bau von Vite) fasst diese Folge
                      zu EINER Zeile mit Präfix zusammen — Chrome hätte kein
                      Glas. Im Inselblatt ist das heute nur
                      .ui-touch-button--glass, benannt als Ausnahme in
                      test578 §9, von keiner Insel benutzt.
4  LIZENZANHANG       glass/field.ts und glass/filter.ts verweisen für den
                      MIT-Text auf HERKUNFT.md; dessen Anhang sagt bei
                      c192821 „keine Code-Übernahme". Redion legt den Text
                      daneben (glass/LIZENZ-ALEXalesha.txt).
5  STABILER STAND     c192821 liegt auf dem Zweig claude/apple-ui-kit-react-
                      i2ew4y, nicht auf main von UI-Kit.
6  AKZENT ALS SCHRIFT Das Kit hat EINE Akzentmarke für Fläche UND Schrift
                      (--ui-color-accent: Knopf „plain"/„tinted"/„gray",
                      Dialog, Aktionsblatt, Liste, Chip, Stepper, Toast,
                      Navbar, Suchfeld — zwölf Stellen). Redion trennt beides:
                      --accent füllt, --accent-text schreibt (dunkel.css,
                      122 Stellen). Die Brücke kann die eine Marke nur auf
                      EINE legen, und sie liegt auf --accent: im dunklen
                      „Standard" stünde Akzentschrift mit 3,16 : 1 auf
                      --bg-card (mit --accent-text wären es 5,67). In
                      Stufe 1a zeigt keine Insel so eine Schrift (die Probe
                      hat einen gefüllten Knopf und einen Schalter); die
                      Dialoge in Stufe 1b schon. Gebraucht wird im Kit eine
                      eigene Marke für Akzent als Schrift, die die Brücke
                      auf --accent-text legt.
```

**Nachgesehen bei der Durchsicht von E699 (27. September, Abend) — UI-Kit
ist am selben Nachmittag weitergegangen,** auf demselben Zweig, nach dem
festgenagelten c192821:

```txt
Punkt 1  erledigt in UI-Kit 0d6222b  „strict-clean kit": die drei Schalter
                                     an, 109 Fehler behoben
Punkt 2  erledigt in UI-Kit 13e7844  data-ui-motion="reduce" am
                                     Wurzelelement beruhigt Federn in JS
                                     und CSS — die Brücke kann Redions
                                     „ruhig" dorthin spiegeln
Punkt 4  erledigt in UI-Kit a82fcb3  der MIT-Text im Anhang von HERKUNFT.md
                                     (Wort für Wort derselbe wie
                                     glass/LIZENZ-ALEXalesha.txt)
Punkt 3, 5, 6                        noch offen (Button.css schreibt die
                                     Glas-Folge bei a82fcb3 unverändert)
```

Redion bleibt bei c192821, weil Redur diesen Stand freigegeben hat
(„React 19.3.0, Touch Kit (dein UI-Kit), Glas-Code (ALEXalesha, MIT)" —
festgenagelt in E699); ein neuer Stand kommt mit dem nächsten Holen, also
mit Stufe 1b, und mit ihm fallen die Punkte 1, 2 und 4 hier weg.

**Nachgesehen am 28. September (E703):** in Redions EIGENEN Blättern stand
dieselbe verkehrte Folge an zwei Stellen (`.ru-fach-art` in
`bausteine.css`, die Regel für weniger Transparenz in `studio.css`). Beide
sind umgedreht, und `test582` §11 hält die Folge für jedes Blatt unter
`quell/schale/stil/` und für `src/islands/bridge.css`. Im Kit bleibt Punkt 3
offen (UI-Kit schreibt die Folge in `Button.css` weiter verkehrt).

**Nachgesehen am 28. September (E710): neu geholt von d21c402.** Punkt 1
ist geschlossen: `tsconfig.islands.json` trägt Redions strenge Schalter,
und das Kit ist darunter sauber (`test578` §8 prüft beides). Punkt 2 ist
geschlossen: die Brücke spiegelt „ruhig" nach `data-ui-motion="reduce"`
(`test587` §4). Punkt 4 ist geschlossen (der MIT-Text steht in UI-Kits
README-Anhang; Redions Kopie daneben bleibt). Punkt 6 ist für die Dialoge
gelöst — die Brücke legt die Akzentmarke des Kits in Dialog und
Aktionsblatt auf `--accent-text` (`test587` §5, zehn Schemata ≥ 4,5 : 1);
eine eigene Marke im Kit fehlt weiter. Punkt 3 gilt auch für Dialog und
Aktionsblatt (lightningcss fasst dort die Glas-Folge zusammen); die
Brücke setzt dort Redions Glas neu, und `test578` §9 erkennt das. Punkt 5
bleibt: d21c402 liegt weiter auf `claude/apple-ui-kit-react-i2ew4y`, nicht
auf main von UI-Kit.

**Was fehlt:** Punkt 3, 5 und 6 in UI-Kit; dann `node
skripte/touch-holen.mts <UI-Kit> <neuer Commit>`, die Prüfsummen in
`fremd-bestand.json` nachziehen, für Punkt 1 `tsconfig.islands.json` auf
Redions Schalter stellen und für Punkt 2 die Brücke `data-ui-motion`
spiegeln lassen. Geschlossen ist die Lücke, wenn `test578` §8 das Kit mit
Redions Schaltern prüft, die Ausnahme in §9 leer ist und Akzentschrift in
einer Insel `--accent-text` trägt.

---

## L221 · Die leichten Glasleisten sind gerechnet, nicht gemessen — GESCHLOSSEN am 28. September 2026 (E703)

**Seit E695 gibt es zwei Glasdichten** mit einer Regel: Fläche mit Schrift
dicht (`--bg-schwebend-dicht`), Fläche mit Zeichen leicht
(`--bg-schwebend`, 74 % hell / 72 % dunkel). Für die dichten Flächen —
Menüs und die untere Leiste am Telefon — misst `test576` den Kontrast an
gerenderten Pixeln über dem schlimmsten Grund (reines Schwarz, Weiss, Rot,
Blau), hell und dunkel.

**Die leichten nicht.** `.rb.glas` und die PDF-Werkzeugleiste
(`.document-studio .blatt-werk`) tragen Zeichen, keine Schrift; §38 (und
WCAG 1.4.11) verlangt dafür 3 : 1. Gerechnet reicht es: `--text-dim` über
74 % Weiss mit reinem Schwarz dahinter gibt ungefähr 3,05 : 1. Das ist
knapp, und es ist eine Rechnung über `rgba` — genau die Art, die die
Unschärfe nicht kennt (L206). Bei den Menüs lag die erste Rechnung neben
der Messung.

**Was fehlt:** `test576` um einen Abschnitt für die PDF-Werkzeugleiste
erweitern — ein Dokument öffnen, das Muster darunter, den Kontrast der
Zeichen an Pixeln messen, Grenze 3 : 1. Wenn es nicht reicht: dieselbe
Regel wie bei der Schrift (die Zeichen auf Glas eine Stufe kräftiger),
nicht eine dichtere Fläche.

**GESCHLOSSEN am 28. September 2026 (E703), gemessen statt gerechnet.**
`test582` §9 legt ein leichtes Glas (`.rb.glas`, 340 × 120, mit einem
gezeichneten Zeichen) über das Prüfmuster aus Weiss, Schwarz, Rot und Blau
und misst die Zeichenfarbe gegen jedes Pixel der Fläche, in allen zehn
Schemata — seit E703 folgt das leichte Glas dem Schema (`color-mix` der
Karte). Das schlimmste Prozent liegt überall über 3 : 1 (messungen §75).
Die Rechnung von 3,05 : 1 war knapp richtig; die Stufe kräftiger war nicht
nötig.

---

## L220 · Drei Nebenwirkungen des Ausblendens — GESCHLOSSEN am 26. September 2026 (E692)

**Seit E691** kann ein Block auf „nur Fläche" stehen (`sichtbarIn:
'flaeche'`) und wird dann in der Textansicht nicht gezeichnet. Drei Stellen
rechneten weiter mit der UNGEFILTERTEN Geschwisterliste. Keine verlor
Daten; alle drei waren „der Bildschirm bewegt sich nicht, und niemand sagt
warum". Gefunden hat sie ein Leser beim Nachsehen, nicht ein Mensch beim
Benutzen.

```txt
1  Rücktaste am Anfang eines leeren Blocks nahm eltern.content[idx-1] und
   setzte den Fokus dorthin. Stand der Vorgänger auf „nur Fläche", zeigte
   der Fokus auf ein [data-bid], das auf dieser Seite nicht gezeichnet ist.
   GESCHLOSSEN: `nachbarImText` sucht den nächsten SICHTBAREN; gibt es
   keinen, geschieht nichts (test574 §10).

2  Strg+Umschalt+↑/↓ tauschte zwei Plätze in eltern.content. War der
   Nachbar ausgeblendet, änderten sich die DATEN und auf dem Bildschirm
   bewegte sich nichts.
   GESCHLOSSEN: ein Druck springt ÜBER den unsichtbaren Nachbarn, mit
   `splice` statt Tausch, damit die übrigen stehen bleiben (test574 §11).

3  `b.nr` (die laufende Nummer einer Nummernliste) wurde beim Zeichnen in
   den Block im Arbeitsspeicher geschrieben und wanderte über `exportAll`
   in jede .redion — seit E691 gezählt über die GEFILTERTE Liste.
   GESCHLOSSEN: gezählt wird beim Zeichnen, weitergereicht an
   `Blocks.render(b, tiefe, nr)`, und `block.nr` wird nirgends mehr
   gelesen (test574 §12).
```

**Und ein vierter Fund, der nicht auf dieser Liste stand.** `test574 §11`
wollte Punkt 2 messen — und es bewegte sich GAR NICHTS, auch in den Daten
nicht. Die Pfeilnavigation zwischen Blöcken stand im selben Tastenbehandler
VOR dem Verschieben und kehrte um, sobald der Cursor am Anfang (für ↑) oder
am Ende (für ↓) stand. In einem einzeiligen Block ist er fast immer beides:
das Kürzel, das im Blockmenü als „Ctrl+Shift+↑" steht, war praktisch nie
erreichbar. Die Reparatur ist eine Bedingung (nur ohne Strg/Cmd), und
`test574 §11` hält seither auch den Normalfall ohne versteckte Nachbarn.

**Was offen BLEIBT:** verschachtelte Nummernlisten zeigen weiter „1." —
gezählt wird nur auf der obersten Ebene. Diese Grenze gab es vor E692 auch;
sie wandert seither nur nicht mehr in die Sicherung. Und alte Blöcke tragen
ihr `nr` noch als totes Feld: es wird nicht mehr gelesen und nicht mehr
geschrieben, aber auch nicht nachträglich entfernt (§43).

---

## L219 · Was der Fläche noch fehlt — Zeichnen GESCHLOSSEN am 26. September 2026 (E693)

**Seit E690** gibt es die Ansicht „Fläche", **seit E691** darf jeder Block
darauf liegen, und **seit E693** kann man darauf zeichnen: Stift, Linie,
Pfeil, Rechteck, Ellipse, Radierer, Farbmenü und Strg+Z — mit demselben
Formenzeichner wie das Whiteboard (`core/gfx/shapes.ts`) und demselben Feld
`shapes` am Block.

```txt
✅  zeichnen        Stift, Linie, Pfeil, Rechteck, Ellipse (E693)
✅  radieren        nimmt genau eine Form weg (E693)
✅  Rückgängig      aus `GfxHistory` im Kern, gehört der Fläche (E682/E693)
✅  Farben          die acht des Whiteboards, mit Namen für den Vorleser
✅  mehrere Kästen  jeder Block darf einen haben (E691)
✗   auswählen       eine gezeichnete Form anfassen, verschieben, löschen
✗   beschriften     Text auf der Fläche, Haftnotizen
✗   Verbinder       zwei Formen aneinanderhängen
✗   Bilder          ein Bild auf die Fläche legen
```

**Was noch fehlt, kann das Whiteboard längst** — Auswählen, Verschieben,
Grösse ändern, Text, Haftnotiz, Verbinder, Bild. Der Zeichner dafür steht
seit E693 im Kern; was fehlt, ist die BEDIENUNG, und die liegt im
Whiteboard in rund sechshundert Zeilen (Auswahlrahmen, Griffe,
Verbindungslogik). Sie in den Kern zu holen ist der nächste Schritt dieser
Reihe — dasselbe Muster wie `GfxHistory`, `GfxToolbar`, `GfxShapes`, und
der grösste Brocken davon.

**Und eine kleine Folge, die kein Fehler ist, aber auffällt:** eine Seite
mit Zeichnung taucht in der Flächen-Übersicht der Arbeitswelt nicht auf.
Die listet Blöcke vom Typ `whiteboard` und `blatt`
(`wissen/arbeitswelt.ts:738-748`), nicht Seiten mit `shapes`. Wer seine
Zeichnungen dort sucht, findet die auf Seiten nicht.

---

## L218 · Drei Werkzeuglisten für eine Sache — GESCHLOSSEN (E694, 26. September 2026)

**Der Zustand war:** seit E689 gab es den Katalog (`Register.werkzeuge`, 22
Einträge), und das Whiteboard las daraus. Das Studio las weiter seine eigene
Liste (`Marken.WERKZEUGE`, 14 Einträge mit Kennung, Zeichen, Symbol, Name,
Titel), und das Menüband eine dritte (`register/menueband.ts`, 13 Vierertupel
`[Kennung, Name, Zeichen, Hinweis]`). Drei Listen für eine Sache — genau das,
wovor §8 warnt, und in diesem Projekt keine Vermutung: als „Abdecken" im
Studio einmal still zu „Abdeckband" wurde, sagte das Menüband weiter
„Abdecken" (`test266 §1`).

**GESCHLOSSEN mit E694.** Das Studio hält nur noch die REIHENFOLGE der
vierzehn Kennungen und ruft `Register.werkzeuge.auswahl([…])`; die
Reihenfolge gehört wirklich dorthin, weil `ordnungAbgleichen` den Nutzer sie
umstellen lässt. Das Menüband hält eine Folge mit Herkunft
(`['abdeck','werkzeug']`, `['line','form']`) und holt Name, Zeichen und
Hinweis aus dem zuständigen Katalog. `Marken.WERKZEUGE` bleibt als NAME
stehen — es ist jetzt eine Sicht auf den Katalog, damit `document-mode.ts`
(E572), der Inspector und `ordnungAbgleichen` weiter dasselbe Feld lesen.

**Der Beleg:** `test572 §3` prüft jetzt nicht mehr, dass zwei Listen dasselbe
sagen, sondern dass die zwei Abschriften WEG sind — gemessen am Quelltext, in
`nurCode`, damit der Kopfkommentar nicht mitzählt. Gegen den Stand davor war
er rot mit vier Zeilen. `test572 §12` misst dazu das laufende Programm; seine
Gegenprobe (einen Namen von Hand zurückschreiben) druckt genau den
historischen Fehler: `abdeck`.

**Was dabei herauskam und vorher niemand wusste:** die Kennung `ellipse` gibt
es **zweimal** — als Flächenwerkzeug (`◯`, deutscher Kennungsraum neben
`linie`, `pfeil`, `rechteck`) und als Studio-Form (`○`, englischer
Kennungsraum, weil sie so in jeder gespeicherten Marke steht, §53.3). Die drei
anderen kollidieren nicht, weil die Sprachen verschieden sind. Deshalb sagt im
Menüband jede Zeile, aus welchem Katalog sie kommt, statt „erst hier, sonst
dort" zu raten.

**Was NICHT dazugehört und offen bleibt:** Gedankenkarte und Planfläche haben
ihre Werkzeuge weiter im Code (Bogen 5c/5d), und die Tasten der Flächen sind
in `Register.werkzeuge` noch nicht eingetragen (5e) — ein Hinweis auf eine
Taste, die nichts tut, wäre ein falsches Versprechen (§32).
---

## L216 · Lerninhalte im Startweg — 19,5 KB Lernstoff bei jedem Start, für einen Bildschirm, den nicht jeder öffnet — 25. September 2026

**Gemessen, nicht vermutet** (`messungen.md`, E688): `test388 §5` war
wieder gerissen, 2711 KB gegen 2700. Von den 127 KB seit E613 sind zwei
Posten Inhalt statt Code — `quell/bereiche/wissen/nin-quiz.js` (12,2 KB
gzip, die NIN-Kapitel 5–7 aus E679) und
`quell/bereiche/wissen/staatskunde-inhalt.js` (7,3 KB, E677). Beide werden
beim Start geladen und geparst, ob jemand den Trainer öffnet oder nicht.
Genau dafür hat E613 die Chronik aus dem Startweg genommen
(`chronik/laden.js` holt sie nach, wie pdf.js in `test388 §2/§3`).

**Warum es nicht einfach nachgezogen wurde:** der Trainer findet seine
Kapitel beim Start über `Register.vorlagen` (`trainer: true`, E679,
`test567`). Nachladen hiesse: das Register kennt die Kapitel dem Namen
nach, der Inhalt kommt beim Öffnen — eine Änderung am Register-Eintrag
(§8), nicht nur am Laden. Und 19,5 KB brächten die Zahl nur auf 2692 —
die Decke wäre beim nächsten Bogen wieder gerissen. Deshalb steht die
Decke seit E688 auf 2850, und diese Lücke bleibt offen.

> **Stand seit E715 (3. Oktober 2026).** Das erzeugte JavaScript reist ohne
> Kommentare; der Start holt 1805 KB, die Decke steht auf 1950. Die zwei
> Posten sind ohne Kommentare noch 17,5 KB gzip (`messungen.md` §86). Die
> Frage an Redur bleibt, und die Lücke bleibt offen.

**Die Frage an Redur:** sollen Lerninhalte (und künftige Kapitel — jedes
NIN-Kapitel sind rund 4 KB gzip) grundsätzlich erst beim Öffnen des
Trainers kommen? Wenn ja: ein Bogen mit `wissen/lerninhalt-laden.ts` nach
dem Muster von E613, einem Registereintrag, der nur Name und Umfang trägt,
und einer Zusage in `test388 §5` („Lerninhalte werden beim Start nicht
geholt"), die gegen den heutigen Stand rot ist.

---

## L209 · Der Stift gegen GoodNotes — was nach E673, E674 und E675 offen bleibt

**Gefunden am 21. September 2026**, beim Lesen für Redurs Satz „die stift
und zeichnen verbessern, und gleich wie goodnotes machen". Zwei Leser
haben den Stiftweg (`stroke.ts`, `geometry.ts`, `marken.ts`) und die
Werkzeuge gelesen — nur gelesen, kein Prüflauf daneben (§30). Drei Bögen
sind gelandet: die Spitze (E673), Farbe und Stärke je Werkzeug (E674), der
Sensor-Aussetzer (E675). Das hier ist der Rest, damit er nicht in einem
Gesprächsprotokoll verschwindet (§35). Die GoodNotes-Seite jedes Punktes
stammt aus dem Kenntnisstand der Leser, nicht aus dem Repo — wo Redur
anderes sieht, gilt sein Bild.

**Am Strich selbst:**

1. **Erledigt am 28. September (E704, `test583` §5/§6):** mit Sensor wird
   der Füller im Schnellen bis 35 % dünner (Pinsel 50 %), gespeichert als
   eigenes optionales `tempo[]` statt im Druck — `druckArt` bleibt wahr.
   Der Befund von damals:
   **Das Tempo wirkt beim echten Stift nicht auf die Breite.** Der
   Tempo→Breite-Weg ist nur der Druck-ERSATZ für Maus und Finger
   (`druckAus`); ein Stift mit Sensor bekommt reinen Sensordruck, und eine
   schnell gezogene Verbindungslinie ist so dick wie ein langsam gesetzter
   Bogen. GoodNotes' Füller wird auch mit dem Pencil schneller dünner. Der
   Faktor müsste beim Aufsetzen in `pressure` eingerechnet werden (kein
   neues Feld, §9) — dann sagt `druckArt: 'stift'` nur die halbe Wahrheit;
   besser ein drittes Wort. Wächter: `test343` bleibt grün; neu: gleicher
   Druck, doppeltes Tempo → schmaler.
2. **Zur Hälfte erledigt am 28. September (E704, `test583` §6):** NEUE
   Kugelschreiber- und Markerstriche legen ihre Breite am Anfang fest
   (`breiteFest`) und atmen nicht mehr; ALTE bleiben, wie sie sind, und die
   Kennlinie ist weiter eine Gerade — beides bleibt Redurs Frage.
   **Die Druckkennlinie ist eine Gerade, und Kugelschreiber wie Marker
   haben EINE Breite je Strich aus dem Mittelwert**, die `nassZeichnen`
   jedes Bild neu setzt — der Anfang eines Kugelschreiberstrichs wird
   nachträglich dicker oder dünner. Ein `d^0,7` oder eine Tabelle mit
   Schwerpunkt bei 0,3…0,6 gäbe der leichten Hand mehr Ausdruck; für Kugel
   und Marker gehört der Druck aus `strokeWidth` heraus (wie GoodNotes'
   Ball pen) oder beim Aufsetzen festgehalten. **Beides ändert, wie ALTE
   Striche in der Mitte aussehen** (`strokeWidth` liest `pressure` des
   Bestands) — das ist eine Entscheidung von Redur, kein Bogen (§9, §34).
3. **Erledigt am 28. September (E704, `test583` §1/§2):** Gelenke an
   jeder Ecke (Läufe mit eigenen Kappen), gemessen am „M": 0 statt 23
   Punkte der Mittellinie ausserhalb, halbe Breite 1,26 statt 0,8 pt. Dabei
   gefunden: die Kappen bogen sich nach innen — jetzt nach aussen.
   Der Befund von damals:
   **Scharfe Kehren im Umriss haben kein Gelenk** — Vermutung aus
   `seiten`/`versatz`, nicht gemessen. Bei einer Kehre um ~180° ist die
   Normale aus prev→next beliebig, und die Innenkante kreuzt sich selbst.
   Erst messen: `outlinePunkte` auf einen 30°-Zickzack, Selbstschnitte
   zählen (reines Rechnen). Wenn > 0: an Kehren einen kleinen Halbkreis
   einfügen; `Feder` muss dann bis n−3 offen halten (`test366 §1`).
4. ~~**Der Glätter rundet Ecken.**~~ **Erledigt am 21. September (E676,
   `test564`).** Er war ein Filter erster Ordnung ohne Kehren-Reset — an
   der Spitze eines langsam gezogenen „M" 2,62 px daneben. Jetzt merkt er
   sich die Richtung über eine feste Strecke (2,5 px, nicht Punkte — E504)
   und gibt an der Kehre die Ecke selbst zurück: 0 px, bei 60 und 240 Hz
   gleich. `test366 §3`, `test472` und `test449` (L198) blieben grün.
5. **Der nasse Strich lebt im selben SVG wie alle Marken** — je Bild wird
   der ganze Pfad neu gerastert, keine Canvas-Ebene. GoodNotes zeichnet den
   nassen Strich auf eine eigene Ebene. Erst messen (§36): Performance-
   Marks um `nassZeichnen` auf einer Seite mit 300 Marken und einem
   800-Punkte-Strich; erst wenn ein Bild > 8 ms braucht, ein `<canvas>`
   nur für den nassen Strich. Architekturentscheid → E-Eintrag.
6. **Formsprung beim Absetzen durch die RDP-Ausdünnung** — unbewiesen.
   `finish` wirft Punkte weg (Toleranz 0,55…1,4 pt) und zeichnet den Umriss
   neu; kein Lauf vergleicht nass gegen trocken NACH der Ausdünnung. Ein
   Lauf mit Hausdorff-Distanz der Konturen, Grenze ~0,3 pt; wenn rot: die
   Druck-Extrema als Pflichtpunkte behalten — RDP kennt nur die Lage.
7. **Der Marker hat seit E704 eine Keilspitze** (28. September, `test583`
   §3/§6; der runde bleibt wählbar). Offen bleibt:
   **Pinsel ist nur ein steilerer Füller.**
   `azimuthAngle`, `twist`, `tangentialPressure` liest niemand (siehe
   auch L59 Neigung, E507). Nachrangig gegenüber 1–6.

**An den Werkzeugen:**

8. **Drei Stiftplätze in der Leiste** (Stift + Farbe + Stärke als EIN
   Knopf, langes Drücken sichert). **E498 hat Stift-Favoriten abgelehnt**,
   und der Grund steht oben in dieser Datei: die Zubehörzeile ist bei
   596 px mit vierzehn Knöpfen voll, und die Farbsätze (E486/E501) können
   mehr. Der Leser schlägt einen Weg ohne zweiten Katalog vor — drei
   Farbsätze als „angeheftet" kennzeichnen (Feld `platz` am vorhandenen
   Satz) und in der Stilreihe zeigen, die nur beim Stift steht. Das wäre
   eine Rücknahme von E498, und die gehört Redur.
9. **Eigene Farbe nur über den Browser-Farbwähler** (`input type="color"`,
   am iPad das System-Blatt). Kein Hex-Feld, kein Gitter. Klein: ein
   Eintrag „Hex eingeben" über `Dialog.frage` (Prüfung `/^#[0-9a-f]{6}$/`
   liegt in `farbenRein`) plus ein festes Gitter aus den zehn
   `LEITER`-Farben zuerst (sie sind der Katalog, §8). `test458` erweitern.
   **Geschlossen mit E697 am 23. September 2026:** „+“ öffnet direkt ein
   benanntes Farbgitter, zuletzt verwendete Farben, geprüftes Hex-Feld und
   Systemfarbwähler. Der Marker erhält sechs eigene Farbvorschläge mit
   Vorschau bei derselben Deckung wie der echte Strich (0,32). Bewusste
   Abweichung vom Vorschlag: keine Aderfarben für Textmarker; die bestehenden
   Leiterfarben bleiben beim Leiterstift. Bestehende Tupfer, Farbsätze und
   alte Marken bleiben unverändert. `test577` hält Eingabe, Fokus, Cursor,
   echte Strichfarbe, Vorschau, Neuladen und 320/390-px-Fenster; `test458`
   hält weiterhin Speichern, Laden, Zurücksetzen und acht erreichbare Sätze.
10. **Radiermodus nur im Rundlauf** (fünf Modi über EINEN Knopf, der
    weiterschaltet) und kein „danach zurück zum Stift". Fünf Knöpfe mit
    `aria-pressed` in der Gruppe `radierer` (wie `LASER` und `FORMEN`),
    dazu ein Haken `zeichnen:radiererzurueck`. `test344 §6` erweitern.
    Am Rechner steht die Radierer-Gruppe nur beim Radierer und hätte
    Platz — nachzumessen (§55.2).
11. **Auswahl-Menü an der Auswahl** (schwebend über dem Kasten), nicht
    nur in der Leiste — am Telefon weit weg vom Finger. Über
    `InkMenu.open` mit denselben `data-act`-Knöpfen, kein zweiter Katalog.
12. **Lineal-Zustand wird nicht gemerkt** (`lineal` startet auf jeder
    Seite `false`), und das Lineal sagt die Länge des Zugs nicht.
13. **Handballenschutz nicht einstellbar** (4 s fest; kein Schalter für
    Linkshänder oder „aus").
14. **Zwischenablage überlebt die Sitzung nicht und geht nicht ins
    System** (kein `image/png` beim Kopieren).
15. **Handschrift → Text** bleibt bewusst offen (§21, kein lokales
    Modell) — steht schon weiter oben, hier nur der Vollständigkeit halber.

**Was davon zuerst, ist Redurs Wahl.** Zwei Punkte brauchen sein Wort,
bevor eine Zeile geschrieben wird: 2 (verändert alte Striche) und 8
(nimmt E498 zurück). Die übrigen sind Bögen wie E673–E675: Wächter zuerst,
rot sehen, reparieren, Gegenprobe, Bild, wo es eines gibt.


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

---

## L208 · ~~Die Einstellungen versprachen eine Geräteliste, die es nicht gab~~ — GESCHLOSSEN

**Gefunden am 21. September 2026, geschlossen am selben Tag (E669).**

In den Einstellungen stand unter „Angemeldete Geräte" der Satz:

> „Die Liste und der Freigabe-Code stehen im Wolke-Fenster"

Den Freigabe-Code gab es. **Die Liste nicht.** Das Wolke-Fenster zeigte eine
einzige Zeile — „Gerät: <dieses hier>" —, und das ist ein Spiegel, kein
Verzeichnis. Wer wissen wollte, ob noch ein altes Telefon an seinem Konto
hängt, erfuhr es nirgends; wer eines abmelden wollte, konnte es nicht.

**Der Server wusste es die ganze Zeit.** `sitzungen` hält `geraet`,
`angelegt` und `bis`, seit es die Tabelle gibt — drei Spalten, die
`sitzungGeben` schreibt und niemand las. Es fehlte nur der Weg, sie zu
erfragen.

Das ist §47 in seiner leisesten Form: nicht „im README versprechen, was
nicht läuft", sondern es in der Oberfläche versprechen, wo es noch
glaubwürdiger klingt — und wo es niemandem auffällt, weil die Stelle, an
der man nachsähe, genau die fehlende ist.

**Geschlossen mit:** `GET /konto/geraete` und `POST /konto/geraete/weg` am
Server, dem Gerätefenster im Wolke-Fenster, und `test558` mit 28 Zusagen.
Gegen den alten Stand war er rot mit 0 von 18.

**Und was dabei nebenbei herauskam:** die Knöpfe „Zurückziehen" und
„Abmelden" massen **18 px**. Nicht 44, nicht die 32 eines Nebenwegs — und
zwar in beiden Fenstern, denn das Markenfenster nebenan baut dieselbe Zeile
(§45: die Nachbarstelle ansehen). Gemessen wurde die gerenderte Box, nicht
eine Zeile im Stilblatt (L206).


# Anhang C · Geschlossene Lücken in der Reihenfolge ihres Fundes

*(Hier stand bis zum 20. September „Hier endet Anhang B" — eine Überschrift,
die sagt, was AUFHÖRT, und nicht, was folgt. Gefolgt sind ihr damals
siebenundsechzig Einträge.)*

**Gemessen am 28. September 2026, nachgezählt statt fortgeschrieben:** die
Datei führt 133 Lücken, 77 offene und 56 geschlossene. Der Befehl dazu ist
`node pruefungen/lauf/test549.mts` — er zählt sie und sagt die drei Zahlen.

**Vorher standen 33 offene Lücken unterhalb von „Anhang B · Was erledigt
ist"** — nicht IN seinen Tabellen, sondern dahinter: der Anhang endete mit
seiner letzten Tabelle, und alles Spätere wurde ans Dateiende geschrieben.
Wer von oben las, hielt sie für erledigt. Das ist genau die Sorte stiller
Fehler, gegen die es diese Datei gibt (§35).

Die dreiunddreissig stehen jetzt oben unter **„Weitere offene Lücken"**.
Was ab hier folgt, ist geschlossen — und `test549` hält es so: er wird rot,
sobald ein offener Eintrag wieder hierher gerät.

**Was „geschlossen" heisst, ist jetzt EIN Wort.** Fünf Überschriften sagten
„abgearbeitet", „erledigt" oder „GELANDET"; §35 nennt das Wort GESCHLOSSEN,
und drei Wörter für dieselbe Sache heissen, dass niemand zählen kann. Der
alte Wortlaut steht, wo er etwas trug, in Klammern daneben.

---

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

## L38 · ~~Die Präsentation kennt die neuen Blöcke nicht~~ — GESCHLOSSEN (E109)

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

## L39 · ~~Was der Gegenlese-Durchgang am PDF-Teil gefunden hat~~ — GESCHLOSSEN

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

## L49 · ~~Was in der Lernwelt noch Fassade ist~~ — GESCHLOSSEN

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

## L157 · ~~Zeichenstudio nach Referenzbildern und bewegtes Dock~~ — GESCHLOSSEN (gelandet)

> **Nachgesehen am 16. September 2026 (E612):** hier stand „IN ARBEIT", und
> das stimmt nicht mehr. Der Zweig `codex/drawing-reference-toolbar`
> existiert nicht mehr, und die Bogen E572 bis E588 sind auf `main` — bis
> hin zu „E588 — Die Tastatur schiebt das Dock nicht weg". Was unten unter
> „Ausdrücklich NICHT geschlossen" steht, gilt weiter; der Zweig-Hinweis
> nicht. Eine Lücke, die einen toten Zweig nennt, schickt den Nächsten an
> eine Stelle, an der nichts steht.

**14. September 2026 · E572 · `codex/drawing-reference-toolbar` (gelandet).**
Der vollständige Entscheidungs- und Ausführungsplan steht in E572. Diese
Liste hält den Produktstatus fest; „geplant“ heißt ausdrücklich nicht fertig.

| Punkt | Status zu Beginn | Geplante Schließung / Beleg |
|---|---|---|
| Neuester Zweig | ✅ geprüft | Remote nach Commitdatum: `claude/redion-tafel-wort`, `d4a53c8e`; neuer Arbeitszweig statt alter `main` |
| Laser direkt oben | ✗ im Dokumentmodus vergessen | Werkzeugkatalog gemeinsam verwenden; `test524` bereits rot |
| Formen direkt im Dock | ✗ ohne Alle-Optionen versteckt | alle sieben vorhandenen Formen sichtbar; `test524` bereits rot |
| Radierer-Modusfeld und Größen | ◐ Modi vorhanden, nur Rundlauf; Größe an Strich gekoppelt | Auswahlfeld und drei unabhängige Größen; `test524` bereits rot |
| Haftnotiz-Pastellpalette | ✗ normale Tintenfarben statt Notizpalette | neun klare Farben, echte gespeicherte Haftnotiz prüfen |
| Elemente-Vorschaufeld | ◐ Bibliothek vorhanden, nicht wie Referenz angeordnet | verankertes Feld, eigene Elemente, Haftnotiz-Vorschauen, Verwaltungsweg erhalten |
| Sichtbares Lineal | ✗ bisher nur unsichtbare Winkelrastung | verschieben, drehen, Kantenführung; `test524` für direkten Zugang rot |
| Dock-Bewegung | ✗ noch nicht im gewünschten Stil | Hover-Vergrößerung, Nachbarn, federnder Wechsel; Reduced Motion und Touch |
| Icons | ◐ kleine uneinheitliche Zeichen in der Dokumentleiste | gemeinsames SVG-Register, Konturen überarbeiten, Größen messen und Bilder ansehen |
| Redion-Extras und eigene Reihenfolge | ✅ vorhanden, muss erhalten bleiben | Katalogvergleich und Nachbarprüfungen; keine still entfernten Bedienelemente |
| Mobile/Fokus/Themen | ⚠ neue Anordnung noch ungeprüft | 390 px sowie niedrige Höhe; Fokus, Escape, Außenklick; Hell/Dunkel |
| Build/Offline/Einzeldatei | ⚠ Quellcode in Änderung | Typecheck, Build, Dienststand, Einzeldatei und Startprüfung ausstehend |
| Abschlussbilder und Regression | ⚠ ausstehend | reale Screenshots und gezielte grüne Läufe, Ergebnisse in E572 nachtragen |

### Vollständiger Rest, der nicht durch bloße Gestaltung verschwindet

1. **GIF-Katalog / Online-Suche:** nicht vorhanden und nicht eingeplant. Keine
   Netzwerkabfragen oder funktionslosen GIF-Tabs als Tarnung einer fehlenden Funktion.
2. **Zusätzliche Formtypen aus der Referenz:** Raute, Winkelverbinder und
   gebogener Pfeil sind nicht gleichbedeutend mit Rechteck oder Kurve.
   Sie bleiben offen; neue Typen benötigen Geometrie-, Auswahl- und Exporttests.
3. **Echte Stifthardware:** Druck, Neigung, Handballenerkennung und
   Hochfrequenz-Eingaben auf einem realen Gerät bleiben manuell zu prüfen.
4. **Lineal:** Skala in Dokument-Zentimetern, nicht in physischen
   Bildschirm-Zentimetern. Maus-/Tastaturbedienung wird gebaut; freie
   Zwei-Finger-Drehung ist nicht Teil dieses Bogens.
5. **Weitere Zeichenwelten:** Schwerpunkt ist die gemeinsame PDF-/Heft-
   Zeichenschicht. Whiteboard-/Schaltplan-Editor sind eigene Oberflächen;
   deren komplette Neuordnung ist hier nicht stillschweigend zugesagt.
6. **Gesamttest:** gezielte Läufe sind geplant. Ein voller grüner Lauf und
   Freigabe für `main`/Push sind dadurch nicht behauptet oder beauftragt.

**Aktueller Nachweis:** der neue Browserlauf war vor der Umsetzung rot:
1 grün, 4 rot. Abschlussstatus wird erst nach den tatsächlichen Prüfungen
aktualisiert; offene Punkte bleiben sichtbar.

**Übergabeplan:** `doku/CODEX-UEBERGABE-ZEICHENSTUDIO.md` enthält den vollständigen
Auftrag für die nächste Codex-Aufgabe, die begonnenen Änderungen und alle
ausstehenden Umsetzungsschritte. Die Übergabe selbst schließt keine Produktlücke.

Typprüfung und `git diff --check` sind zum Übergabezeitpunkt grün. Build und
neue Browser-/Gestaltungsabnahme sind weiterhin offen.

### Stand am 14. September 2026, abends — was davon gemessen zu ist

Die Tabelle oben ist der Stand **zu Beginn** und bleibt stehen. Hier steht,
was seither wirklich geschlossen ist, mit Beleg — und was ausdrücklich nicht.

| Punkt | jetzt | Beleg |
|---|---|---|
| Der gepushte Zweig lud zwei fehlende Dateien | ✅ zu | `quell/bereiche/pdf/ink-menu.js` und `ink-ruler.js` sind eingecheckt; `index.html` und der `GRUNDSTOCK` nennen sie, Dienststand v1072 (E573) |
| Lineal frisst jeden Zeiger | ✅ zu | `pointer-events="none"` am `<g>`, Griffe unter dem Glas; `test267` 16/16 (E573) |
| Lineal verschwindet nach „Zurück" | ✅ zu | `remount()` nach jedem `redraw()`; die Kante bleibt dabei erhalten (E573) |
| „Zurück"/„Vor" im Studio unerreichbar | ✅ zu | eigene Kapsel am Dokumentkörper, Lage aus dem Stilblatt; `test393` 19/19, `test461` 34/34 (E573) |
| Formen, Schrift, Auswahl nur hinter „···" | ✅ zu | das Dock liest die Gruppenliste (E356) statt acht Dinge pauschal zu verstecken; `test524` misst es je Werkzeug (E573) |
| Lineal beim Stift nicht schaltbar | ✅ zu | `lineal` steht jetzt auch bei `stift` — die Kantenführung liess ihn längst zu; `test348`, `test351`, `test524` (E574) |
| Haftnotizfarben in jedem Werkzeug | ✅ zu | eigene Gruppe `notizfarbe`, nur beim Zettel; `leiterReihe()` fasst sie nicht mehr an; `test524` 24/24 (E574) |
| Tintenfarben zusätzlich beim Zettel | ✅ zu | der Zettel hat seine neun und das „+", sonst nichts (E574, Plan 7 B 4) |
| `test464` suchte eine Abschrift, die E572 abgeschafft hat | ✅ zu | prüft jetzt `Marken.WERKZEUGE.map(` statt `'elemente', 'star'`; 63/63 (E574) |

**Ausdrücklich NICHT geschlossen** — jeder Punkt ist unverändert offen:

1. **„Alle Optionen" zeigt weiterhin alles** (Plan 7 B 9). Der geschlossene
   Zustand ist kontextbezogen, der geöffnete nicht. Vier Prüfläufe
   (`test177`, `test228`, `test437`, `test515`) erreichen über diesen Weg
   Dinge, die sonst nirgends stehen — ein einfaches Wegnehmen wäre ein
   Funktionsverlust, kein Aufräumen.
2. **`InkMenu` hat kein Ende.** Kein Weg ruft `hidePopover()` ausser dem
   Helfer selbst; ein Menü überlebt Seitenwechsel, Neuaufbau und das
   Verlassen des Studios. Gemessen schwebte es über einer fremden Textseite.
3. **`inkSync()` hängt bei jedem Aufruf alle dreizehn Knöpfe um** — 78 bei
   einem einzigen Klick. Der Fokus fällt dabei auf `BODY`, Übergänge brechen
   ab, und der Beobachter hört nur auf Attribute, nicht auf `childList`:
   eine Sortierbewegung kommt live gar nicht an.
4. **Radierergrössen** sind 14 px breit und optisch leer (kein Stil für
   `--eraser-preview`), der alte Rundlaufknopf steht doppelt neben dem neuen
   Modusfeld, und die gewählte Grösse überlebt keinen Seitenwechsel.
5. **Stilblatt, Dock-Bewegung und Icons** (Plan 7 B 6, 7 C) sind unberührt:
   `.blatt-popover`, Moduswahl, `.blatt-laser-options`, Galerie-Tabs,
   Vorschauraster; Vergrösserung nur unter `(hover:hover)`, federnder
   Wechsel, `prefers-reduced-motion`.
6. **Tastatur „P" zeichnet in einem GESPERRTEN Dokument** (`marken.ts`,
   Tastenweg). Älter als E572 und nicht von diesem Bogen verursacht —
   gehört als eigene Lücke mit eigenem rot gesehenen Wächter repariert.
7. **Ein voller grüner Lauf ist nicht behauptet.** `test290`
   (CSS-Namensräume) ist rot und älter als dieser Zweig.

### Nachtrag, 14. September 2026, spät — Zweig `codex/zeichenstudio-menues-radierer`

Die Liste darüber bleibt stehen. Vier ihrer sieben offenen Punkte sind
seither zu; die Punkte 1, 5 (teilweise) und 6 sind es nicht.

| Punkt von oben | jetzt | Beleg |
|---|---|---|
| 2 · `InkMenu` hat kein Ende | ✅ zu | Das Feld beobachtet seinen Anker; verlässt der den Baum, geht es zu. Dazu `closeAll()`, ein Ersatzweg ohne `showPopover` und die Fokusregel „Escape zurück, Aussenklick nicht". `test524` (E575) |
| 3 · `inkSync()` hängt alles um | ✅ zu | Gemessen 156 → **0** Knotenbewegungen je Klick; der angetippte Knopf behält den Fokus. Ein zweiter Beobachter bringt Sortierbewegungen live nach oben. `test524` (E575) |
| 4 · Radierergrössen | ✅ zu | Drei sichtbare Kreise (14/22/30 px) in 44-px-Knöpfen, der Modus einmal statt zweimal, die Wahl in `meta`. `test524` (E576) |
| 5 · Stilblatt für die Bedienfelder | ◐ halb | `.blatt-popover` hatte KEINE Regel und hat jetzt Kopf, „×", Zeilen, Auswahlzustand mit Haken; Laserarten und Radiererkreise gestaltet. **Offen bleiben** Galerie-Tabs, Vorschauraster, Dock-Bewegung und die Icons (Plan 7 B 6 Rest, 7 C) |

**Neu dazugekommen und offen:** nichts. Die zwei Funde, die beim Bauen
auffielen, sind im selben Zug geschlossen: ein Flex-Element staucht den
grössten Radiererkreis auf die Breite des mittleren (E576), und eine
Zusicherung verglich die Kreise in Baumreihenfolge, die seit E570 dem
Nutzer gehört.

**Weiterhin offen und unverändert:** Punkt 1 („Alle Optionen" zeigt alles),
Punkt 6 (Tastatur „P" zeichnet in einem gesperrten Dokument — älter als
E572) und Punkt 7 (`test290` rot, kein voller Lauf behauptet).

**Nachgemessen und dabei korrigiert:** Die Übergabe nannte „19 handgeschriebene
Inline-SVGs in `index.html`, davon 15 bytegleiche Kopien des Registers". Gezählt
sind es **19 SVG mit zusammen 35 Pfaden, von denen 27 wörtlich auch in
`src/register/symbole.ts` stehen** — also echte Doppelpflege im Sinn von §8, aber
in anderer Gestalt als beschrieben. Sie wird hier NICHT nebenbei geschlossen:
ein Teil dieser Zeichen steht in der Startschale, die gezeichnet sein muss,
bevor das Register überhaupt geladen ist. Das ist ein eigener Bogen mit eigenem
Wächter, kein Anhängsel an die Gestaltung.

### Nachtrag, 15. September 2026 — Zweig `codex/zeichenstudio-dock-bewegung`

| Punkt | jetzt | Beleg |
|---|---|---|
| 5 · Stilblatt für die Bedienfelder | ✅ zu | Galerie-Reiter, Dreispaltenraster, Vorschaukarten für Elemente und Haftnotizen; damit ist Plan 7 B 6 vollständig (E577) |
| Dock-Bewegung (Plan 7 C 3–6) | ✅ zu | Das ZEICHEN wächst (25 → 32,5 px), der Knopf bleibt 44 × 44; Nachbarn 28,3 px; nur unter `(hover:hover) and (pointer:fine)`; `prefers-reduced-motion` nimmt sie weg; der federnde Wechsel läuft einmal. `test524 §7` (E577) |
| Icons (Plan 7 C 1–2) | ◐ halb | Die zwei schlimmsten Paare sind weg: `inkPen`/`inkLaser` 69 % → 24 %, `inkText`/`inkImage` 64 % → unter 43 %; schlimmstes Paar jetzt 52 %. `test480 §7b` misst alle dreizehn dauerhaft (E577). **Offen:** `penBrush` und `penPencil` sehen einander mit blossem Auge weiterhin ähnlich — gemessen unter der Grenze, und E515 hat ihre Gestalt bewusst gewählt |
| Verlaufskapsel am Telefon | ✅ zu | Sie deckte 87 × 39 px der Schreibfläche ab, genau die erste Zeile; steht jetzt unten links über dem Dock (E577) |

**Weiterhin offen, unverändert:** „Alle Optionen" zeigt alles (Plan 7 B 9);
Tastatur „P" zeichnet in einem gesperrten Dokument; `test290` rot; Plan 7 B 2
(Stift-Dock im Detail), 7 B 5 (Form-Dock), 7 B 7 (die alten Toolbar-Styles
an der History), 7 B 8 (kleine Breite, Bildschirmtastatur, sichtbarer
Hinweis auf weitere Werkzeuge beim Rollen).

**Neu gesehen und offen:** Am Telefon rollt die untere Leiste waagrecht, und
nichts sagt, dass rechts noch etwas steht (Plan 7 B 8). Gesehen auf
`bilder/studio-telefon.png`, nicht gemessen — deshalb steht es hier und
nicht als geschlossen.

## L158 · Lesemodus und Sperre — GESCHLOSSEN am 15. September 2026

**Fund:** Ein Dokument, das ausdrücklich zum LESEN geöffnet war, nahm
Striche an. Zwei Wege hinein, und der zweite war der grössere:

1. Die Taste „P" klickte einen Werkzeugknopf in der eingeklappten unteren
   Leiste — einen Knopf, den niemand sehen konnte. Gemessen: Schicht von
   `schreiben`/`none` zurück auf `stift`/`auto`, ein Zug danach **0 → 1
   Marke**.
2. Der obere Werkzeugknopf war im Lesemodus **sichtbar und nicht
   `disabled`**. Ein gewöhnlicher Mausklick genügte, ebenfalls **0 → 1**.

Älter als E572; der Tastengriff steht seit E465 so da, die obere Reihe seit
E464. Gehört zu §46 Punkt 1 und §51 — es ist kein Gestaltungsfehler,
sondern eine Änderung an Nutzerdaten gegen den erklärten Willen des Nutzers.

**Beleg der Schliessung:** `test438 §4b`, elf Zusicherungen, **sieben davon
vorher rot gesehen** — darunter die Marke, die wirklich entstand. Die
Gegenprobe „Im Schreibmodus holt H den Marker wieder" steht mit darin, damit
die Reparatur die Abkürzung nicht einfach abschalten kann. Entscheidung
E578. `test437` musste dabei nachgezogen werden: er klickte im Lesemodus
direkt wieder auf den Stift und verliess sich damit auf genau diese Tür.

**Was dabei ausdrücklich NICHT geschlossen wurde**, und warum:

- **„Zurück" und „Vor" bleiben im Lesemodus bedienbar.** Rückgängig ist kein
  Zeichnen, und der Lesemodus ist ein Ansichtsschalter, keine Rechtegrenze.
  Bei einer gesperrten Seite greift ohnehin `canAnnotate`.
- **Ein Klick auf ein Werkzeug schaltet den Modus NICHT mit.** Das wäre
  freundlicher, und für eine gesperrte Seite oder fehlende Rechte wäre es
  falsch — dort gibt es kein „doch". Ob das für den reinen Lesemodus anders
  sein soll, ist eine Frage an Redur und keine an den Code.

---

## L160 · Die Verlaufskapsel schob die Folienfläche — GESCHLOSSEN am 15. September 2026

**Fund:** Die Rasterzelle aus E573 (`grid-column:2; grid-row:1`) überlagerte
im Studio das Papier, bekam im **Foliensatz** aber eine eigene Zeile und schob
`.document-center` um ihre Höhe nach unten: gemessen oben 272 statt 206,
580 px statt 646. Die Folienfläche war damit seit E573 um 66 px kleiner.

**Beleg:** `test508 §2` war rot und ist wieder 40/40. Entscheidung E579:
`position:absolute` in jedem Raster, eine Regel statt zweier. Auch das
Studio hat die Höhe zurückbekommen.

**Und die Lehre, die mehr wert ist als der Fund:** ich hielt den roten Lauf
zuerst für einen Altbestand wie `test290`. Ein Arbeitsbaum auf den einzelnen
Commits (§30) hat gezeigt, dass er bei E571 und E572 grün war und mit E573
rot wurde. „Älter als mein Zweig" ist eine Vermutung, solange niemand die
Commits durchgeht — und sie ist die bequeme Antwort.

## L161 · Kein Hinweis auf das, was ausserhalb des Bildes steht — GESCHLOSSEN am 15. September 2026

**Fund:** Am Telefon standen **390 px der oberen Leiste und 562 px des
unteren Docks ausserhalb des Bildes** — mehr als darin, acht von sechzehn
Werkzeugen oben und zwei Drittel im Dock — und nichts sagte es. Plan 7 B 8.

**Beleg der Schliessung:** Rollschatten aus vier Hintergrundschichten, ohne
eine Zeile JavaScript; er zeigt sich nur dort, wo es etwas zu rollen gibt.
`test524 §9`, sechs Zusicherungen, davon zwei vorher rot gesehen.
Entscheidung E580.

**Und der Fund im Fund:** der erste Schatten war schwarz und im Dunkelmodus
nachgemessen **8 von 255** Helligkeitsunterschied — unsichtbar. Der Wächter
misst deshalb Pixel, nicht CSS-Text (§55.1), und war mit dem schwarzen
Schatten genau im dunklen Thema rot.

**Offen bleibt aus 7 B 8:** die Bildschirmtastatur. Was passiert, wenn sie
aufgeht und die schwebende Leiste verdeckt, ist nicht gemessen — dafür
braucht es ein echtes Gerät (L157 nennt echte Stifthardware aus demselben
Grund).

## L162 · Das sichtbare Lineal im Druck — GESCHLOSSEN am 15. September 2026

**Fund:** Die letzte offene Zusage aus Abschnitt 8 des Übergabeplans. Zwei
der drei Ausgabewege waren in Ordnung, weil sie aus `marken` neu bauen; der
**Druck** rendert das DOM, und dort war `[data-ink-ui="ruler"]` sichtbar.
Kein Stilblatt nannte `[data-ink-ui]` — dieselbe Lücke galt damit für die
Laserspur und die Auswahlgriffe.

**Beleg:** `test524 §10`, vier Zusicherungen, zwei vorher rot gesehen; sie
prüft beide Richtungen (nach dem Druck ist das Lineal wieder da).
Entscheidung E581. Eine Zeile deckt alle drei Schichten ab, weil sie dem
ATTRIBUT gilt und nicht einer Liste von Klassen.

---

## L165 · Eine CSS-Zeile, die aussah wie eine Regel — GESCHLOSSEN am 15. September 2026

**Was fehlte:** `.blatt-werk .zeichen[data-sym]{width:16px}` und die drei
Abwandlungen darunter bemassen die Hülle des Zeichens. Das `<svg>` darin
trug seine eigene Breite als Attribut (`width="18"`) und hat sich nie darum
gekümmert. Drei der vier Zahlen hatten deshalb keine Wirkung; die seitliche
Leiste stand seit ihrer Einführung auf 18 statt auf den dort geschriebenen
20 px.

**Wie es gefunden wurde:** nicht beim Lesen — die Zeilen sehen richtig aus.
Beim Nachmessen von Plan 7 C 2 („24–28 px in festen 44-px-Flächen") kamen
in allen vier Zuständen 18 px heraus, und erst der Vergleich von Hülle und
SVG zeigte, warum.

**Geschlossen mit** E585: das SVG bekommt seine Grösse von seiner Hülle
(`width:100%`), damit es nur noch EINE Stelle gibt, an der die Zahl steht.
`test524 §12` hält es: Hülle und Zeichen müssen dieselbe Zahl sein, und am
Telefon müssen es 24 bis 28 px sein, obwohl im Attribut weiter „18" steht.

**Was daraus folgt, ohne neue Regel:** §39 warnt vor Tokens, die es nicht
gibt. Dies ist derselbe Fehler eine Ebene tiefer — eine Eigenschaft am
falschen Element. Beides findet nur eine Messung an der laufenden Seite.


---

## L166 · Ein Zugriff nach Platz — GESCHLOSSEN am 15. September 2026

**Was fehlte:** `wsBtn.querySelectorAll('span')[1]` stand an zwei Stellen
(`schale.ts`, `einstellungen/ansicht/seite.ts`) und meinte den Namen des
Arbeitsbereichs. Seit die Bewegungsschicht (`motion.ts`) eine
`rmo-sliders`-Hülle als erstes Kind einsetzt, zeigt `[1]` auf das ZEICHEN —
und die Zeile darunter schrieb den Namen hinein. In der Seitenleiste stand
zweimal „Redion" nebeneinander, und ein eingestelltes Zeichen kam dort nie an.

**Warum es niemand meldete:** `test37` war rot, und zwar lange. Ein Lauf,
der lange rot ist, nimmt dem nächsten echten Fehler die Aufmerksamkeit —
derselbe Satz wie in L163, nur diesmal mit einem Fehler dahinter.

**Geschlossen mit** E590: `class="ws-name"` am Namensspan, und beide Stellen
fragen jetzt nach Bedeutung. `test37` hält es mit einer Zusicherung, die
sagt, was wirklich gemeint ist: „Das Zeichen trägt nicht den Namen des
Arbeitsbereichs".

**Was daraus folgt, ohne neue Regel:** eine Schicht, die Hüllen einsetzt,
darf das — sie weiss von keiner Zeile, die zählt. Wer zählt, muss damit
rechnen. Ein Platz hält nur so lange, wie niemand etwas davorstellt.

---

## L167 · Hundertvierzehn Trefferflächen standen als rohe Zahl — GESCHLOSSEN am 15. September 2026

**Was fehlte:** `min-height:44px` und `min-width:44px` standen 114-mal roh
in elf Stildateien, obwohl `--touch-min` seit je genau dafür da ist und an
genau einer Stelle als 44px definiert wird. Wer die Trefferfläche je ändern
wollte, hätte 114 Stellen suchen müssen — und `test362` zählte die rohen
Zahlen seit E509/E510 gegen ein Verzeichnis, das niemand nachzog (Δ +15 bei
44px, +20 bei 16px).

**Geschlossen mit** E590: 114 Stellen tragen die Marke; die rohe 44 sank von
168 auf 54 und liegt damit UNTER der alten Decke. Das Verzeichnis steht auf
den gemessenen Zahlen.

**Was offen bleibt, und mit Grund:** 28px und 22px haben zwar Marken
(`--mobile-gutter`, `--mobile-gutter-small`), aber die sind semantisch —
`marken.css` sagt es selbst: „Gleiche Zahl bedeutet nur dann dieselbe Marke,
wenn sie dieselbe Aufgabe hat." Ein Polster von 22 px, das kein Seitenrand
ist, dürfte die Marke nicht tragen. Diese Zahlen einzeln anzusehen ist ein
eigener Bogen, und er braucht Augen, nicht ein Skript.

---

## L168 · Geänderte Folien kommen noch nicht in die Datei — GESCHLOSSEN am 15. September 2026

**Was fehlt:** Eine eingelesene `.pptx` geht seit E592 vollständig und
unverändert wieder heraus. Was in Redion an einer Folie geändert wurde,
steht aber noch nicht darin — die Folien gehen so zurück, wie sie
hereinkamen.

**Warum es nicht einfach nachgereicht wurde:** Eine Marke trägt keine
Rückspur zu ihrem `<a:t>`. Ohne diese Spur bliebe nur ein Zuordnen nach
Reihenfolge — der nte Text in der Folie zum nten Text im Block. Das hält
nicht: Gruppen (E555), Tabellen (E565) und über Layout und Master geerbte
Platzhalter (E558) tragen alle Text bei, und nicht jeder davon steht als
`<a:t>` in der Folie selbst. Ein Zuordnen nach Reihenfolge schriebe Text in
die **falsche** Form, und ein falscher Text ist schlimmer als ein fehlender
(§51).

**Was zu tun ist — Bogen O5b:** die Spur beim EINLESEN anlegen. Jede
Textmarke bekommt, woher sie kommt: Folie, Form, Absatz, Lauf. Damit ist das
Zurückschreiben kein Raten mehr, sondern ein Nachschlagen. Das Feld ist
additiv — vorhandene Marken ohne Spur werden weiterhin nicht
zurückgeschrieben, und das ist der richtige Rückfall.

**Was NICHT zu tun ist:** die ganze Folie neu erzeugen. Redion liest heute
mehr aus einer `.pptx`, als es schreiben kann — Diagramme, Zellränder,
Spiegelungen, Gruppendrehung (L151). Eine neu erzeugte Folie verlöre genau
das, was E592 gerade gerettet hat.

**Bis dahin steht es da, statt still zu sein:** die Ausgabe zeigt „Die
Originaldatei ist vollständig erhalten. In Redion geänderte Folieninhalte
stehen noch nicht darin." `test525` hält beide Hälften dieses Satzes fest.


**Geschlossen mit E593** am selben Tag: die Rückspur entsteht beim Einlesen.
Jede Textmarke, die genau EINEM Absatz mit genau EINEM Lauf und ohne
Aufzählungszeichen entspricht, bekommt `quelle: { sp, p }`; das
Zurückschreiben schlägt Form und Absatz nach und ersetzt genau das eine
`<a:t>`. Mit Pythons `zipfile` gegengeprüft: genau ein Eintrag anders, alles
andere Byte für Byte gleich, XML wohlgeformt, Vorspann erhalten.

**Was mit Absicht offen bleibt** — und deshalb steht diese Lücke weiter hier,
nur als Rest: Absätze mit mehreren Läufen, zusammengefasste Absätze und
Aufzählungen bekommen keine Spur. Ihr Text wird nicht zurückgeschrieben,
weil er auf mehrere Stellen verteilt werden müsste und jede Verteilung
geraten wäre (§51). Wer das schliessen will, braucht keine Spur je Marke
mehr, sondern eine je LAUF — und dann auch eine Antwort darauf, was
geschehen soll, wenn der neue Text kürzer ist als die Läufe, auf die er sich
verteilen müsste.

---

## L172 · ~~Mehrere Formate in einem Kasten fallen beim Ändern zusammen~~ — GESCHLOSSEN am 16. September 2026

> **GESCHLOSSEN durch E606.** Das Schreibfeld ist kein `<textarea>` mehr,
> sondern ein `contenteditable` mit einem `<span>` je Lauf. Die Formate
> stehen beim Öffnen im Feld, überleben das Tippen und kommen unverändert
> zurück in die Marke. Beleg: `test527` §16, sieben Zusicherungen — gegen
> den Stand davor vier davon rot. Was unten steht, ist der Befund von
> damals und bleibt stehen (§35).

**Was fehlt:** Ein Textkasten kann seit E561 mehrere Formate in einem Absatz
tragen (`laeufe` — so kommen Texte aus einer `.pptx`: ein Wort fett, eines
farbig, eines grösser). Wer ihn seit E597 auf dem Blatt weiterschreibt,
bekommt einen Kasten mit EINEM Format zurück: dem des ersten Stücks.

**Warum es so entschieden wurde:** Das Schreibfeld ist ein `<textarea>` und
hält reinen Text. Es kann nicht sagen, welches Stück der neue Satz ist —
jede Zuordnung wäre geraten, und ein falsch ausgezeichneter Text ist
schlimmer als ein einfarbiger (§51, dieselbe Überlegung wie E593 und L168).

Die Alternative wäre gewesen, `laeufe` stehen zu lassen. Sie ist schlechter:
`textLayout` setzt dann weiter aus den ALTEN Läufen, und die Änderung wäre
unsichtbar verschluckt — der Nutzer tippt, drückt Escape, und auf dem Blatt
steht der alte Satz. Ein sichtbarer Verlust an Auszeichnung schlägt einen
unsichtbaren Verlust an Text.

**Was dagegen hilft, wenn es stört:** ein Schreibfeld, das Auszeichnung
kann. Das heisst `contenteditable` statt `<textarea>` — und damit die ganze
Frage, wie eingefügtes HTML gesäubert wird (§19), plus eine Abbildung
zwischen dem DOM und `laeufe`. Das ist ein eigener Bogen, kein Nachtrag.

**Woran man merkt, dass er gebraucht wird:** Wer eine eingelesene
Präsentation in Redion redigiert statt sie nur zu lesen.

---

## L176 · Die Gedankenkarte kennt noch keine Querverbindungen — ~~16. September 2026~~ **GESCHLOSSEN am 19. September durch E628 — bis auf die Beschriftung, die als L192 weiterlebt**

**Was fehlt:** Seit E607 gibt es die Gedankenkarte, und sie zeichnet einen
Baum: jeder Knoten hat genau einen Elternteil, jede Linie geht von oben nach
unten. Redurs zweites Bild zeigt aber etwas anderes — eine Karte, in der
gestrichelte Linien quer durch den Baum laufen und „Blog about how to write"
mit „creative writing" verbinden, obwohl beide in verschiedenen Ästen sitzen.
Das ist in XMind die **Beziehung** (relationship), und Redion hat sie nicht.

**Was dazu gehört:** eine zweite Liste am Block (`beziehungen`), zwei
Knotenkennungen je Eintrag, eine gestrichelte Linie, eine Beschriftung
darauf, und ein Weg, sie zu ziehen — in XMind: einen Knoten wählen, das
Werkzeug greifen, auf den zweiten tippen.

**Warum nicht gleich:** Der erste Bogen sollte die Karte selbst tragen.
Eine Beziehung, die man nicht löschen und nicht beschriften kann, wäre eine
halbe Sache; und sie braucht eine eigene Prüfung dafür, dass sie eine
gelöschte Gegenseite überlebt, statt ins Leere zu zeigen (§9).

**Woran man merkt, dass sie gebraucht wird:** Sobald jemand mit der Karte
nicht mehr gliedert, sondern denkt. Ein Baum ordnet; ein Gedanke springt.

**Geschlossen am 19. September 2026 (E628).** Es gibt die zweite Liste
(`verbindungen`), die gestrichelte Linie mit Spitze, den Weg, sie zu ziehen
(vom Griff auf den anderen Knoten) und den Weg, sie zu löschen (anklicken,
Entf — und ↶ holt sie zurück). Die Prüfung, die dieser Eintrag verlangt hat,
steht als `test538 §6`: eine Verbindung zu einem gelöschten Knoten fällt
still weg, statt ins Leere zu zeigen.

**Was NICHT geschlossen ist: die Beschriftung.** Der Absatz oben nennt sie
ausdrücklich („eine Beschriftung darauf"), und sie fehlt. Sie steht als
**L192**, damit dieser Eintrag nicht halb geschlossen im Raum hängt.

---

## L180 · Der Stift öffnet den Blick in den Ordner nicht — ~~16. September 2026~~ **GESCHLOSSEN am 17. September 2026 durch E615**

> **Geschlossen, und zwar genau so, wie es hier stand: „zwei Zeilen in
> `bibliothek.ts`" — es wurden drei.**
>
> `pointerType` lässt jetzt `pen` zu; `zeigerHatHover()` fragt `any-hover`
> statt `hover` (die alte Abfrage beschrieb den HAUPTZEIGER und hätte auf
> einem Laptop mit Berührungsbildschirm auch die MAUS ausgesperrt — der
> unterschätzte der beiden Gründe); und `pointerdown` sagt die Uhr ab, damit
> ein Tipp nicht als Hinschauen zählt.
>
> `test476` 31/31, fünf Zusicherungen neu. **Zwei Gegenproben einzeln rot
> gesehen:** gegen den alten Stand 27/31, mit entfernter `pointerdown`-Absage
> 29/31 — jede Hälfte ist damit für sich gehütet.
>
> Der Finger bleibt draussen, unverändert und mit Grund (`test476 §6`).

**Was fehlt:** Das Auge am Ordnerdeckel öffnet die Ordnerkarte beim
Hinschauen (E508) — aber nur mit der **Maus**. Mit einem Laptop-Stift, der
über dem Glas schwebt, passiert nichts.

**Warum, nachgesehen und nicht vermutet.** Die Bedingung in
`bibliothek.ts` lautet:

```ts
if (e.pointerType !== 'mouse' || !zeigerHatHover()) return;
```

Beides schliesst einen Stift aus, und zwar unabhängig voneinander:

1. Seine Art ist `pen`, nicht `mouse`.
2. `zeigerHatHover()` fragt `matchMedia('(hover: hover) and (pointer: fine)')`.
   Das beschreibt den **Hauptzeiger** des Geräts — auf einem Laptop mit
   Berührungsbildschirm ist das der Finger, und die Abfrage sagt dort „kein
   Überfahren".

**Und ein zweiter Punkt an derselben Stelle:** Beim Antippen kommt erst
`pointerenter`, dann `pointerdown`. Es gibt keine Absage dazwischen, die Uhr
läuft also weiter. Am Auge fällt das kaum auf, weil ein Klick dort ohnehin
die Karte öffnet — es wäre aber überall dort ein Fehler, wo Tippen und
Hinschauen Verschiedenes bedeuten.

**Warum es noch offen ist:** Beides war in E608 gebaut und geprüft. E608 ist
durch E609 vollständig zurückgenommen worden, weil Redur die Ordnerkachel
wieder wie vorher wollte — der Fund ist damit zurück in die Lücke gefallen,
nicht widerlegt. Er lässt sich jederzeit einzeln einsetzen, ohne am Auge
etwas zu ändern: zwei Zeilen in `bibliothek.ts`.

**Woran man merkt, dass er gebraucht wird:** Sobald jemand Redion mit einem
Stift bedient — Surface, iPad mit Tastatur, Wacom. Genau das hat Redur am
16. September genannt.

--------------------------------------------------------------------------------

## L185 · Der Platz-Knopf versprach im Studio etwas, das er nicht konnte — 19. September 2026, **GESCHLOSSEN am selben Tag durch E619**

Gefunden beim Nachmessen des Papiers vom 19. September, nicht beim Lesen des
Codes. `pdf-studio.css` setzte die Leiste im Dokumentmodus ohne `[data-lage]`
im Wähler fest; die Spaltenform aus `bausteine.css` griff trotzdem.

```txt
Studio, 1440 × 960, data-lage="links"
   Leiste   x=683  y=197   74 × 749       Papier   x=225 … 1205
```

Eine 74 px schmale Spalte mitten auf dem Papier, während der `title` des
Knopfes „Leiste verschieben — jetzt links" sagte. Geschlossen, indem der
Knopf im Studio nicht mehr erscheint und ein gemerkter Platz den Dock nicht
mehr verformt (`test534 §2`). Redurs Satz vom 14. September — „Die untere
Dock sollte bleiben" — war dabei der Entscheider, nicht der Geschmack.

---

## L186 · «unten in der Mitte» war auf der gewöhnlichen Seite zwei Pixel breit — 19. September 2026, **GESCHLOSSEN am selben Tag durch E620**

Einer der vier Plätze aus E512 funktionierte seit seinem Bau nicht.
GEMESSEN, 1440 × 960: `2 × 1409 px`, ein Streifen quer über das Blatt
(`bilder/messung-unten-seite.png`). Ursache: `container-type:inline-size`
(E359) nimmt der Leiste ihren Beitrag zur eigenen Breite, und ein Kasten,
der auf seinen Inhalt schrumpfen soll, bleibt dann leer. Behoben mit
`container-type:normal` in dieser Lage; nachher `1112 × 46 px`
(`test534 §1`).

**Die Lehre gehört zu §55.1 und nicht in eine Fussnote:** drei Wochen lang
sah niemand hin. Der Platz war gebaut, der Prüflauf dafür prüfte, dass sich
`data-lage` ändert — nicht, dass danach etwas Sichtbares dasteht.

---

## L187 · «unten» steht am Fuss des BLATTES, nicht am Fuss des Fensters — ~~19. September 2026~~ **GESCHLOSSEN am selben Tag durch E622**

Offen, und es ist eine Frage an Redur, keine technische.

Seit E620 ist der Platz «unten in der Mitte» wieder eine echte Leiste. Nur
steht sie am unteren Rand der **Blatthülle** (`position:absolute`), nicht am
unteren Rand des **Fensters**. Bei einem A4-Blatt in einem 900 px hohen
Fenster heisst das: wer oben auf dem Blatt zeichnet, sieht sie nicht.

```txt
gemessen    Blatt ~1400 px hoch, Fenster 900 px
            Leiste bei y = 1885 (Blattfuss)   —   ausserhalb des Bildes
```

Im Schreibstudio ist es anders gelöst: dort ist der Dock `position:fixed` und
klebt am Fenster (E588 rechnet sogar die Bildschirmtastatur heraus). Dasselbe
hier zu tun wäre ein Eingriff, der über diesen Bogen hinausgeht: eine
gewöhnliche Seite kann **mehrere** Blätter tragen, und zwei Leisten, die
beide am Fensterfuss kleben, lägen übereinander.

Drei Wege, und keiner ist offensichtlich richtig:

1. **So lassen.** «Unten» heisst „unten am Blatt". Ehrlich, aber beim langen
   Blatt unbrauchbar.
2. **`position:fixed` für die Leiste des Blattes, an dem gerade gezeichnet
   wird.** Das ist die GoodNotes-Form und was das Papier vom 19. September
   meint. Braucht eine Regel dafür, welches Blatt „das aktive" ist.
3. **`position:sticky` am Blattfuss.** Sie wandert mit, solange das Blatt im
   Bild ist, und bleibt beim Blatt. Der kleinste Eingriff.


**GESCHLOSSEN am 19. September 2026 durch E622.** Redur hat Weg 3 gewählt
(`position:sticky`). Dazu kam ein Zug im Baum, den die Beschreibung oben noch
nicht kannte: sticky mit `bottom` zieht ein Element nach OBEN, wenn es sonst
unter den Fensterrand rutschte — es schiebt keines nach unten. Die Leiste
musste also im Fluss hinter das Papier. Gemessen: y = 1885 → y = 904 in einem
960 px hohen Fenster, und über dem Papier bleibt keine Lücke
(`test534 §1b`, sechs Zusagen).

---

## L188 · Die Deckkraft stand viermal, obwohl ein Kommentar das Gegenteil behauptete — 19. September 2026, **GESCHLOSSEN am selben Tag durch E623**

Gefunden beim Bau der Strichprobe, nicht gesucht. Über `alsAnnotation` steht
seit E506:

> Farbe, Breite, Druckkurve und Deckkraft stehen hier und nirgends sonst (§8).

Nachgemessen stimmte das für die Deckkraft nicht: sie stand am Bildschirm
beim Pinsel (0,92), beim Bleistift (0,72 − Neigung × 0,22) und beim Marker
(0,32) — und noch einmal im PDF-Export. Vier Stellen, zwei Rechnungen,
dieselben Zahlen.

Das ist die gefährliche Sorte Doppelung: sie fällt nicht auf, solange
niemand eine der beiden ändert. Danach sieht das PDF anders aus als der
Bildschirm, und kein Prüflauf merkt etwas — es gab keinen, der beide
verglichen hätte.

Geschlossen mit `deckungVon(art, stil, neigung)`. `test535 §3` zieht seither
einen echten Strich und vergleicht seine Deckung am gezeichneten SVG mit der
Zahl auf der Kachel.

---

## L189 · Der Radierer hatte auf einer gewöhnlichen Seite keine Grösse — 19. September 2026, **GESCHLOSSEN am selben Tag durch E624**

Gezählt am 19. September: drei Grössen im Studio, **null** auf einer
gewöhnlichen Seite. Der Grund war ein Ort, kein Wille: sie wurden im Hörer
auf `ink-studio-ready` gebaut, und den löst allein `document-mode.ts` aus.

Dazu der Haken «Automatisch an den Strich anpassen» aus Redurs Bild 4: den
Zustand gab es seit je (`radierRadius()` ist `eraserSize ?? max(5, Breite ×
3)`), nur führte kein Weg zurück — das Studio setzte beim Aufbau immer eine
Zahl. Jetzt ist er ein Schalter; gemessen am Radierkreis: r = 28 gewählt,
r = 7,2 automatisch.


---

## L204 · ~~Die Auswahl fängt bei jedem Wechsel wieder bei null an~~ — GESCHLOSSEN am 20. September 2026 (E646)

**Geschlossen für die untere Leiste, offen für die Werkzeugleiste.**
`SelectionFlow` (`src/schale/bedienung/selection-flow.ts`) ist genau der
Helfer, den dieser Eintrag verlangt hat: er liest beim Umlenken Ort UND
Tempo aus der Federformel und gibt beides an die neue Bahn weiter. Gemessen
in `test541` §3: nach dem zweiten Tipp steht die Fläche weiter als beim
ersten, statt neu anzusetzen.

Der Weg war ein anderer als hier vermutet. Der Eintrag schlug
`element.animate()` mit ausgelesener Geschwindigkeit vor; gebaut ist eine
Federbahn, die EINMAL ausgerechnet und als Keyframes übergeben wird — denn
eine Feder, die je Bild JavaScript braucht, steht genau dann still, wenn der
Hauptfaden arbeitet, und das tut er beim Reiterwechsel immer (E646).

**Und seit E647 auch für die Werkzeugleiste.** `wahlFliegen` in `marken.ts`
benutzt `SelectionFlow.fliege()` — dieselbe Feder, als FLIP auf `transform`
gerechnet. Damit ist dieser Eintrag ganz geschlossen.

### Was hier stand — zum Nachlesen

Das Design-System verlangt für schnelle Wechsel zweierlei:

> Preserve velocity during rapid changes and target the newest selection
> instead of completing stale animations.

**Die zweite Hälfte ist erfüllt.** Wer A → B → C tippt, sieht die neueste
Wahl: beide Uhren werden gelöscht, nichts steht in einer Schlange, und im
Studio wird die fliegende Fläche dort abgeholt, wo sie gerade ist (E640).

**Die erste nicht.** Beide Stellen bewegen sich mit einem CSS-Übergang, und
ein Übergang kennt keine Geschwindigkeit: wird er mitten im Lauf auf ein
neues Ziel gesetzt, beginnt er wieder bei Tempo null. Auf dem Bildschirm
sieht das aus, als bliebe die Fläche kurz stehen, bevor sie weiterzieht —
bei ruhigem Tippen unsichtbar, bei schnellem spürbar.

**Was es bräuchte:** die Web Animations API. `element.animate()` gibt die
laufende Bewegung als Objekt zurück; ihre aktuelle Geschwindigkeit lässt sich
auslesen und als Anfangswert der nächsten mitgeben. Betroffen wären
`pilleSchieben` (`seitenleiste.ts`) und `wahlFliegen` (`marken.ts`) — zwei
Stellen, dieselbe Rechnung, also gehört sie in EINEN Helfer (§8).

**Warum es nicht nebenbei geht:** die Geschwindigkeit muss gemessen werden,
nicht geschätzt, und eine Feder ohne Messung ist eine Zahl, die jemand
hingeschrieben hat. Dazu kommt `prefers-reduced-motion`, das bei
`element.animate()` von Hand behandelt werden muss — CSS nimmt einem das ab,
JavaScript nicht. Eigener Bogen, eigene Gegenprobe.

---
