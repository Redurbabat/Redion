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
✗ Lokales Löschen wandert nicht zum Server — es gibt keinen lokalen
  Grabstein; gelöscht wird bisher nur vom Server zum Gerät
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

**Fehlt ausserdem:** Side Peek auf kleinen
Bildschirmen · gemeinsame Gestaltungswerte statt verstreuter Pixelzahlen —
die Masse stehen an einem Dutzend Stellen in `bausteine.css` und wurden
schon zweimal auseinandergeschrieben (28 gegen 18 beim Rand).

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

1. Das eigentliche Vorschau-BILD. Unverändert eine Speicheränderung mit
   eigenem Plan.
2. `pdfseite` und `zeichenflaeche` haben nirgends einen deutschen Namen. Sie
   stehen nicht im Blockregister, weil sie nicht einfügbar sind — und der
   Editor liest genau dieses Register als `TYPEN` für Slash-Menü und Suche.
   Sie bekommen deshalb einen leeren Streifen. Wer ihnen einen Namen geben
   will, braucht dafür einen Weg, der sie NICHT einfügbar macht.

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

L64 — Die echten Zeichenwerkzeuge fehlen im Reiter „Zeichnen"
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


L65 — „Elektro" öffnet einen Dialog, keine Seite
--------------------------------------------------------------------------------
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


L66 — test181 ist unter Last unzuverlässig
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

WAS FEHLT: der Schritt braucht entweder mehr Zeit oder eine Absicherung
gegen den Kontextverlust. Solange das offen ist, kann ein voller Durchlauf
hier zufällig rot werden, ohne dass etwas kaputt ist — und genau das macht
ihn als Aussage schwächer.


================================================================================
L67 — 110 Zählwerte ohne Einzahl-Verzweigung
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
