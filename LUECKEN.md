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

## L8b · Der Service Worker und die ehrliche Ersatzantwort

**Stand** — ✅ behoben, aber der Gedanke gilt weiter.

Der Arbeiter gab die Startseite für **jede** unbeantwortbare Anfrage zurück,
auch für ein Skript. Der Browser bekam Status 200 mit HTML, führte HTML als
JavaScript aus, und die Meldung nannte am Ende einen Namen, der mit der
Ursache nichts zu tun hatte („Wissen is not defined").

**Was bleibt** — jede Ersatzantwort in diesem Projekt daraufhin ansehen, ob
sie zur Frage passt. Eine Antwort in der falschen Form ist schlimmer als
keine: sie sieht wie Erfolg aus.

## L9 · Formelfunktionen ohne Beschreibung

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

## L13 · Prüfläufe für migrierten TypeScript-Code

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

## L15 · Bedingte Formatierung

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

## L17 · Dashboards und Pivot ausbauen

Fehlt: mehrere Datenquellen je Dashboard · KPI-Karten · Layout ·
Diagrammquellen.

Hier stand „Pivot mit Prozent von Gesamt" — den Modus gibt es seit dem
Pivot-Bau (`pivotProzent: aus | zeile | spalte | gesamt`). Die Behauptung
war falsch; beim Nachsehen fand sich stattdessen ein echter Fehler: die
Quer-Ränder zeigten in den Modi Zeile/Spalte überall „0 %", auch in der
CSV. Behoben und Zelle für Zelle geprüft (E92, test166).

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

## L19 · Fehlende oder ungeprüfte Blocktypen

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

## L21 · Vollständige Verschlüsselung

**Stand** — ◐ einzelne Seiten und die Sicherung lassen sich verschlüsseln.

Fehlt: verschlüsseltes `.redion` (heute deckt die verschlüsselte Sicherung
nur den Textbestand ab) · verschlüsselte Anhänge · Schlüsselwechsel.

## L22 · Leistung bei sehr grossen Arbeitsbereichen

Fehlt: Messungen mit zehntausend Seiten · virtualisierte Listen ·
Suchindex, der nicht bei jedem Start neu entsteht · Speichermessung bei
Export und Import.

## L34 · Ein Wert, der an zwei Stellen steht

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

## L36 · Rein numerische Spaltenschlüssel im Bestand

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

## L23 · Abfragesprache für normale Nutzer

Suche über Titel, Inhalt, Zeilen und Kennungen mit einfacher Syntax.

## L24 · Entscheidungs- und Wissensgraph

**Stand — ✅ geschlossen.** Redion besitzt einen einzigen abgeleiteten Graphen
für Seiten, Zeilen, Entscheidungen, Quellen und Schlagwörter. Backlinks,
Relationen, Baumkanten, Filter und begrenzte 1-/2-Hop-Ausschnitte verwenden
denselben Bestand; Lernquellen werden am normalen Block verknüpft. Ink-Striche
werden bewusst nicht zu Graphknoten.

## L25 · Universelle Begriffe und Aliase

**Stand — ✅ geschlossen mit E129.** Seiten tragen additive `aliases`. Titel,
Alias, Vault-/Hierarchiepfad und `redion:<id>` laufen durch einen zentralen
Resolver. Suche, Wikilinks, Picker, Backlinks, unverlinkte Erwähnungen, Graph
und Obsidian-Import verwenden ihn. Eine Kollision liefert Kandidaten und nie
willkürlich den ersten Treffer.

## L26 · Import aus anderen Werkzeugen

Trello, Evernote, Obsidian, Notion-Export und CSV gibt es. Asana, Jira und
Apple Notes fehlen.

## L27 · Import-Assistent (Power-Query-ähnlich)

Spalten bereinigen · Typen erkennen · Werte ersetzen · Duplikate entfernen ·
Dateien kombinieren · Vorschau vor dem Übernehmen.

## L28 · Was-wäre-wenn: Zielwertsuche, Szenarien, Solver

Zielwert eingeben und rückwärts rechnen · Best/Normal/Worst Case ·
einfache Optimierung.

## L29 · Suche in Bildern, PDFs und Audio

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

## L30 · Erweiterungen und Marktplatz

Erweiterung installieren · Rechte anzeigen · Sandbox · deaktivieren ·
löschen · Signaturen.

## L31 · Öffentliche Seiten, SEO und Demo

Demo-Modus · `robots.txt` · `sitemap.xml` · `ai.txt` · Export als statische
Seite · keine privaten Daten für Crawler.

## L32 · Die 62 Integrationen

**Stand** — ◐ 8 von 62. Die meisten brauchen OAuth-Geheimnisse und damit
einen Server; ohne ihn geht nur, was einen persönlichen Schlüssel
akzeptiert. Siehe `ENTSCHEIDUNGEN.md` E23.

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

## L33 · Erinnerungen, wenn Redion geschlossen ist

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

## L37 · Was am PDF noch fehlt

**19. August 2026, nach E103.** Ein PDF wird jetzt zu Seiten, die man
durchblättert und beschreibt. Vier Dinge kann es noch nicht, und keines
davon ist ein Fehler — es ist Arbeit, die nicht getan ist.

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

**Neurasterung.** Seiten entstehen bei 1654 px Breite, rund 140 dpi. Wer
stark hineinzoomt, sieht Unschärfe. Eine Seite liesse sich auf Wunsch
neu und feiner rechnen — die Marken blieben dabei liegen, weil sie in
Seitenpunkten gespeichert sind und nicht in Bildpunkten (E100). Nötig
dafür ist, dass das Original noch da ist; es ist da (E103).

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

## L40 · Was der Markdown-Rundlauf noch nicht kann

**19. August 2026, mit E113 halb geschlossen.** „Quelltext ansehen →
Übernehmen" löscht nichts mehr: alles, was Markdown nicht tragen kann, steht
seither als Platzhalter im Text und bleibt unangetastet.

Drei Dinge gehen trotzdem verloren, und sie sind jetzt wenigstens im Dialog
benannt statt still:

```txt
⚠ Farbe, Schriftgrösse und Schriftart je Block (E101). Markdown kennt sie
  nicht. Sie zu Platzhaltern zu machen hiesse, den Knopf abzuschaffen — von
  einer Seite mit farbigen Absätzen bliebe kein lesbarer Text übrig.

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

**Was von L40 bleibt, ist eine Frage der Form, nicht des Formats.** Farbe,
Schriftgrösse und Schriftart liessen sich nur retten, indem man beim
Übernehmen die vorhandenen Blöcke WIEDERVERWENDET, statt sie zu leeren und
neu zu bauen — Zeile für Zeile gegen den Bestand abgleichen und nur ändern,
was sich geändert hat. Das brächte nebenbei stabile Kennungen und einen
brauchbaren Rückgängig-Schritt. Es ist ein Umbau von `ausMarkdown` und
keine Ergänzung, und deshalb steht es hier und nicht in einer Änderung
nebenbei.

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

**Was offen bleibt, ist der Rand davon:**

```txt
⚠ `test192` kennt nur den Weg über `umwandeln`, also über das Slash-Menü.
  Blockarten, die auf anderem Weg entstehen und in keinem Register stehen
  — `pdfseite`, `spalte` —, erfasst er nicht. Beide sind heute in Ordnung,
  aber nicht durch ihn.

⚠ Er prüft, ob man HINEINKOMMT, nicht ob das Richtige passiert, wenn man
  drin ist. Dafür sind die Suiten je Blockart da, und die gibt es nicht für
  alle 66.
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

## L49 · Was in der Lernwelt noch Fassade ist

**24. August 2026.** Beim Beheben von E128 mit acht Agenten durchgesehen und
gegengeprüft. Was hier steht, ist NICHT von mir einzeln nachgemessen — die
Fundstellen sind belegt, die Wirkung nicht überall. Wer daran arbeitet, misst
zuerst nach.

**Zwei davon sind mit E136 erledigt** — und die Erklärung stimmte bei beiden
nicht ganz: die Tastatur scheiterte nicht am Neuzeichnen, sondern an der
Richtung, in die Ereignisse steigen. Was bleibt:

```txt
Die Zuordnung Prüfung → Karten ist reine Wortsuche (`passendeKarten`
:868-877) und fällt bei null Treffern auf ALLE Karten zurück.

Die Prüfungszentrale hat kein Gedächtnis: Simulationsergebnisse liegen nur
in `zustand.simulation` und sind nach dem Reiterwechsel weg.

Der Lernpfad ist eine geordnete Liste, kein Lernpfad im Sinne des
Auftrags — und seine Reihenfolge ist auf elf deutsche Elektro-Stichwörter
fest verdrahtet (:1127-1128).
```

Nachgemessen habe ich davon nur eines: `bilder.mts` kennt die Lernwelt
nicht, die Ansicht taucht in keinem Bildschirmfoto-Durchgang auf. Genau
deshalb sind die vier Zahlen aus E128 so lange unbemerkt geblieben.


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


## L51 · Die zwei Hauptwelten stehen in keinem Register

**24. August 2026.** CLAUDE.md §5 Regel 2: „Neuer Bereich = zwei
Register-Einträge." `Register.module` kennt editor, datenbanken, wissen, ki,
verbinden, dateien — aber weder Lernwelt noch Arbeitswelt noch
Lebensbereiche. Sie hängen ausschliesslich an `produktwelten.ts:63-64`, das
sie über `globalThis` sucht.

Dasselbe gilt für Electrical, Recognition und DocumentMode: kein
Register-Eintrag, kein Befehl, kein Tastenkürzel.

Das ist kein Fehler im Betrieb — es läuft. Es ist eine Abweichung von der
Architekturregel, und sie hat einen Preis: ein Modul ohne Register-Eintrag
ist für jede Übersicht unsichtbar, auch für die nächste Prüfung, die „alle
Bereiche" durchgehen will.


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


## L53 · „⌁ Erkennen" braucht einen Dienst, den Redion nicht mitliefert

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


## L43 · Ein Anhang ohne `blockId` bleibt für immer liegen

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


## L54 · Was das Whiteboard noch nicht kann

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

Alle vier sind Arbeit an derselben Datei und sollten zusammen gemacht
werden, nicht einzeln.


## L55 · Die Suche findet keine Dateinamen

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
