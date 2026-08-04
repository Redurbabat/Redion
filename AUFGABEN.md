# AUFGABEN.md

Diese Datei ist die Arbeitsliste für Redion.

Sie beantwortet:

```txt
Was wird als Nächstes gemacht?
Warum ist es wichtig?
Wo gehört es hin?
Wann ist es fertig?
Welche Tests müssen laufen?
```

**Wo was steht**

| Datei | Frage |
|---|---|
| `ENTSCHEIDUNGEN.md` | Warum wurde etwas so entschieden? |
| `AUFGABEN.md` | Was wird als Nächstes gebaut? |
| `LUECKEN.md` | Was fehlt noch im Produkt? |

---

## Grundregel

Jede Aufgabe braucht:

```txt
Ziel
Warum
Dateien
Fertig wenn
Tests
Priorität
```

Aufgaben sind nach Reihenfolge sortiert. Was oben steht, macht das darunter
leichter.

---

## Aktueller Stand

**Stand: 4. August 2026 · 75 Prüfläufe grün**

Redion kann bereits:

- lokal starten
- offline arbeiten
- Seiten und Blöcke speichern
- Datenbanken verwenden
- Formeln ausführen
- lokale KI vorbereiten und nutzen
- Versionen speichern
- Papierkorb nutzen
- JSON exportieren und importieren
- `.redion` mit Anhängen sichern
- große Dateien stückweise behandeln
- Tests ausführen

**Wichtigste aktuelle Grenze:**

```txt
Redion ist noch nicht TypeScript.
Die Grundlage steht (Typecheck, zentrale Typen); der Bestand unter quell/
ist weiterhin JavaScript. Nächster Schritt: TS-3, die kleinen Kernhelfer.
```

---

## Phase 1 · Ordnung und Projektsteuerung · **erledigt**

Die drei Steuerdateien haben jetzt klar getrennte Rollen. Vorher erzählten sie
vor allem, was gefunden wurde; jetzt sagen sie, was gilt, was offen ist und
was als Nächstes kommt.

### ~~A1 — Entscheidungen neu ordnen~~ · erledigt

`ENTSCHEIDUNGEN.md` trägt jetzt E1–E17 als langfristige Produkt- und
Architekturentscheidungen, dazu E18–E23 als die Regeln, die beim Bauen
entstanden sind — darunter die Markenregel, die CSP-Entscheidung wegen
`file://` und die Schonfrist beim Papierkorb.

### ~~A2 — Aufgaben neu ordnen~~ · erledigt

Diese Datei: Phasen statt Historie, TypeScript als eigene Phase, Cloudflare
später eingeordnet.

### ~~A3 — Lücken neu ordnen~~ · erledigt

`LUECKEN.md` trägt jetzt L1–L30 nach Bereichen, mit den gemessenen Zahlen als
Anhang und einer Zeile je erledigtem Punkt statt der ausführlichen Befunde.

---

## Phase 2 · TypeScript-Grundlage · **erledigt**

Siehe `ENTSCHEIDUNGEN.md` E6 und E7: TypeScript ja, React nicht automatisch,
und die Nutzung per Doppelklick bleibt erhalten.

Der ausführliche Plan steht jetzt in **`doku/TYPESCRIPT-MIGRATION.md`** —
die Phasen TS-0 bis TS-10, die Regeln beim Umziehen einer Datei und die
Frage, wann ein Bauschritt nötig wird und wann nicht.

**Zwei Abweichungen vom ursprünglichen Entwurf**, beide bewusst:

1. **Die Namen sind deutsch.** Der Entwurf nannte `RedionBlock`,
   `RedionDatabase`, `database.ts`, `file.ts`. Die Projektregel aus
   `CLAUDE.md` verlangt deutsche Namen, und der gesamte Bestand unter
   `quell/` hält sie ein. Zwei Namenswelten nebeneinander wären genau der
   Fehler, der sich durch dieses Projekt zieht: an einer Stelle so, an der
   Nachbarstelle anders. Also `Block`, `Sammlung`, `Ansicht`, `Datei`,
   `Sicherung` — und die Dateien heissen entsprechend.
2. **`result.ts` gibt es nicht.** `Ergebnis<T>` steht in `basis.ts`, weil
   es zu den Grundbausteinen gehört und sonst eine Datei mit vier Zeilen
   entstanden wäre.

### ~~B1 — TypeScript technisch vorbereiten~~ · erledigt

`typescript@5.9.3` als `devDependency`, `npm run typecheck` (`tsc --noEmit`),
`tsconfig.json` mit `strict` **plus** `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes` und `useUnknownInCatchVariables`.

Geprüft ist auch das Gegenteil: ein absichtlich falscher Typ wurde
eingesetzt und der Lauf wurde rot (`TS2740`). Ein Typecheck, der nur grün
sein kann, weil er keine Datei findet, sagt nichts.

**`noEmit` steht auf `true`.** Es entsteht kein JavaScript und damit kein
Bauschritt, den jemand vergessen kann. Nachgewiesen: `node bauen.js`
schreibt `redion-einzeldatei.html` byteweise unverändert — keine
App-Funktion ist berührt.

### ~~B2 — Zentrale Redion-Typen anlegen~~ · erledigt

Sieben Dateien unter `src/core/types/`:

```txt
basis.ts        ID · ISODateTime · BlockId … FileId · Ergebnis<T>
block.ts        Block · Zeile · Seite · Fassung
datenbank.ts    Sammlung · Schema · Spalte · Ansicht · Filter · Sortierung
datei.ts        Datei · Stueck · Uploadzustand
sicherung.ts    Sicherung · Sicherungskopf · Dateienkarte · RedionPaket
ablage.ts       FAECHER (alle neun) · Speicherort · Speicherlage
index.ts        eine Tür für alles davon
```

Jedes Feld ist aus dem laufenden Code **abgelesen** — `addBlock` in
`quell/kern/ablage/indexdb.js:255`, `quell/bereiche/dateien/ablage.js` für
die Anhänge, `quell/register/ansichten.js` für die zwölf Ansichtsarten,
`sicherungSpeichern` in `quell/schale/aufbau/schale.js` für den Aufbau des
`.redion`. Das ist E21 angewandt: nachsehen statt raten.

### ~~B3 — Migrationsdokument schreiben~~ · erledigt

`doku/TYPESCRIPT-MIGRATION.md`.

### ~~B4 — Typecheck in GitHub Actions~~ · erledigt

Im Job „Quelltext und Logik (ohne Browser)", vor den übrigen Prüfungen.
Die Pakete kommen mit `--ignore-scripts` herein: Chromium wird dort nicht
gebraucht und wiegt ein Vielfaches von allem anderen.

---

## Phase 3 · Backup und `.redion` · **erledigt**

### ~~C1 — `.redion`-Format dokumentieren~~ · erledigt

`doku/REDION-FORMAT.md`. Beschreibt: warum zwei Formate · Aufbau des Archivs ·
`daten.json` · `dateien.json` · die Namensregel bei gleichnamigen Anhängen ·
die zwei Einspielarten und warum es keine Vorgabe gibt · die drei ZIP-Grenzen ·
ZIP64 beim Lesen · wie man ein `.redion` ohne Redion öffnet · was noch fehlt.

Beim Schreiben ist aufgefallen, dass es ein **zweites** Sicherungsformat gibt
— siehe C4.

---

### ~~C3 — ZIP64-Entscheidung vorbereiten~~ · erledigt

Die drei Grenzen stehen jetzt in `doku/REDION-FORMAT.md`, ZIP64 bleibt als
Lücke markiert (`LUECKEN.md` L4), und es wird weiterhin kein kaputtes Archiv
geschrieben.

**Dabei kam eine vierte Grenze heraus, die es gar nicht geben sollte.** Zwei
Grenzen (4 GB je Datei, 4 GB je Archiv) hatten seit jeher eine Prüfung mit
einer verständlichen Meldung. Die dritte — **65 535 Einträge, ein 16-Bit-Feld**
— hatte keine und scheiterte still: 65 536 Einträge wurden im Schlusssatz zu
`0`, 70 000 zu `4 464`. Das Archiv liess sich öffnen, sah gesund aus und zeigte
einen Bruchteil.

Auf der Leseseite war es schlimmer. Ein fremdes ZIP64-Archiv liess
`zipLesenAusBlob` **null Dateien und keinen Fehler** melden — wer eine
Sicherung mit 70 000 Anhängen einspielte, sah „0 Anhänge" und hatte keinen
Grund zu zweifeln.

Beides behoben, gehalten von `pruefungen/lauf/test103.mjs` (14 Prüfungen).
Erkannt wird ZIP64 am Wegweiser `0x07064b50`, nicht an den Platzhaltern —
sonst würde ein gültiges Archiv mit genau 65 535 Einträgen fälschlich
abgelehnt.

---

### ~~C4 — Die verschlüsselte Sicherung auf denselben Stand bringen~~ · erledigt

Vier Befunde auf einem Weg, gefunden beim Schreiben von `REDION-FORMAT.md`.

**1 · Sie sicherte weniger und sagte es nicht.** `bestandSammeln()` schrieb
ein eigenes Format ohne `versions`, ohne Anhänge — und ohne
`enthaelt`/`fehlt`/`hinweis`, die genau dafür erfunden wurden. Jetzt benutzt
sie `Store.exportAll()`, denselben Weg wie die Sicherung ohne Passwort.
`art` und `fassung` bleiben zusätzlich stehen, damit ältere Dateien weiter
gelesen werden.

**2 · Der Dialog sagte „ersetzt", der Code führte zusammen.**
`Object.assign` legt dazu. Jetzt läuft beides über `Store.importAll` mit
ausdrücklicher Angabe.

**3 · Das Eingespielte wurde nie geschrieben.** Die vier `Object.assign`
fassten nur `Store.cache` an; danach stand `Store.alles && Store.alles()` —
**diese Funktion gibt es nicht**, der Aufruf war ein stiller Leerlauf.
Neunhundert Millisekunden später lud die Seite neu, las aus der Ablage und
fand dort unverändert den alten Bestand. Die Wiederherstellung wurde als
geglückt gemeldet und war eine Sekunde später weg. Wer sie brauchte, brauchte
sie meistens dringend.

**4 · Verschlüsseln scheiterte ab etwa 128 KB.**
`btoa(String.fromCharCode(...bytes))` reicht jedes Byte als eigenen
Aufruf-Parameter weiter; darüber ist der Aufrufstapel voll. Ein Bestand aus
ein paar Dutzend Seiten liegt über der Grenze — wer genug hatte, dass sich
das Sichern lohnt, konnte nicht sichern. Die Meldung sprach dabei von
Aufrufstapeln und nicht von Grössen.

Dieselbe Zeile stand an **drei** Stellen: verschlüsselte Sicherung,
Seitensperre (`wissen/werkzeuge.js`), Abgleich (`kern/abgleich/maschine.js`)
— also an genau den drei Stellen, an denen verschlüsselt wird und die
Datenmenge gross ist. Es gibt jetzt eine Fassung in
`quell/kern/helfer/bytes.js`; `test87` verbietet eine vierte.

**Gehalten von** `pruefungen/lauf/test104.mjs` (20 Prüfungen) und `test87`
(Punkt 9). Gegengeprüft: die alte Fassung wieder eingesetzt, beide Läufe
wurden rot an genau den Stellen, die sie halten sollen.

---

### ~~C2 — Backup-Tests schützen~~ · erledigt

`pruefungen/LIESMICH.md` hat einen neuen Abschnitt: **„Die vier Läufe, die
man nicht abschwächen darf"** — `test96`, `test100`, `test103`, `test104`
und `test87` Punkt 9. Zu jedem steht dort, *was* er hält und *wodurch* man
ihn versehentlich entschärfen würde.

Nachgesehen statt behauptet: `test100` vergleicht wirklich Byte für Byte
(„Der Anhang ist zurück, Byte für Byte identisch") und prüft wirklich beide
Richtungen — „Beim Ersetzen räumt der Import fremde Anhänge weg" und „Eine
.json-Sicherung lässt die Anhänge in Ruhe". Die zweite ist die wichtigere:
sie hält fest, dass eine unvollständige Sicherung nicht zum Datenverlust
wird.

Die Übersichtstabelle in `LIESMICH.md` reichte nur bis Lauf 96; sie steht
jetzt bis 104.

---

## Phase 4 · Speicher und Datenmodell

### ~~D1 — Speicher-Typen definieren~~ · erledigt

`src/core/types/ablage.ts`: `FAECHER` mit allen neun Fächern —
`blocks · collections · views · meta · versions · dateien · stuecke ·
basis · vorrat` —, dazu `Speicherort` (browser/ordner/server) und
`Speicherlage`.

Die Liste steht ausdrücklich als **eine** Liste. Jede Stelle, die über alle
Fächer läuft — Sicherung, `wipe()`, das Aufräumen des Papierkorbs —, ist
genau so lange richtig, wie sie alle neun kennt. Das war schon zweimal der
Fehler: `wipe()` leerte fünf von neun, und die Papierkorb-Reinigung lief an
zwei Stellen unterschiedlich.

---

### D2 — Kleine DOM-freie Helfer migrieren · ◐ begonnen

**Der Weg steht.** Die Frage, die `doku/TYPESCRIPT-MIGRATION.md` offen
liess — wie kommt `.ts` nach `.js`, ohne dass die App einen Pflicht-Bauschritt
bekommt —, ist entschieden:

```
src/kern/helfer/kennungen.ts      die Quelle
        ↓  npm run bauen:ts
quell/kern/helfer/kennungen.js    wird geladen, wird mitcommittet
```

`tsconfig.bauen.json` bildet `rootDir: src` auf `outDir: quell` ab. Die
Datei landet genau dort, wo `index.html` und `sw.js` sie schon laden —
**keine der beiden musste geändert werden**, `bauen.js` auch nicht. Ein
Bauschritt für den Entwickler, keiner für den Nutzer.

`module: none` verbietet `import`/`export` schon beim Bauen; eine migrierte
Datei bekommt ihre Typen aus `src/global.d.ts`. Sonst entstünde ein ES-Modul,
und das liefe von `file://` nicht.

**Erste Datei: `kennungen.ts`** — mit Absicht die kleinste. Keine Berührung
mit DOM oder Ablage, acht Funktionen. Verhalten nachweislich unverändert:
alt und neu nebeneinander geladen und über 36 Vergleiche geprüft (alle acht
Funktionen, dazu Form und Länge der drei Zufallsformen) — keine Abweichung.

**Gehalten von** `pruefungen/lauf/test105.mjs`: gibt frisch nach `/tmp` aus
und vergleicht Zeichen für Zeichen mit dem, was im Repository liegt.
Gegengeprüft — eine Zeile von Hand ins `.js` geschrieben, und der Lauf nennt
die Datei beim Namen. Läuft auch in der CI.

**Noch offen** — die übrigen Kandidaten:

```txt
datum.js · objekte.js · bremse.js · melder.js · saeubern.js · bytes.js
```

**Nicht anfangen mit** `editor.js` · `steuerung.js` · `indexdb.js` ·
`bauen.js` · `server/kern.js`.

**Fertig wenn** alle sechs migriert sind, keine Verhaltensänderung
eingetreten ist, der Typecheck läuft und alle Prüfläufe grün sind.

**Priorität** — hoch.

---

## Phase 5 · Aufräumarbeiten am Bestand

Zwei Umbauten, die noch aus der ersten Etappe offen sind. Beide sind Umzüge
ohne Verhaltensänderung — genau die Art Arbeit, die vor der TypeScript-
Migration Ordnung schafft.

### A4-Rest — Die übrigen Bereiche in `dienst` und `ansicht` trennen

**Ziel**

Reine Logik ohne DOM lässt sich prüfen, ohne einen Browser zu starten.

**Stand**

`datenbanken` und `wissen` sind geschnitten. `test88` (Datenbank-Logik) und
`test89` (Werkzeug-Logik) laufen ohne Browser in Millisekunden — ein
Browserlauf braucht zwölf Sekunden.

**Warum es beim nächsten Bereich anders aussehen kann**

Bei `wissen` war die Annahme falsch, jede grosse Datei liesse sich in eine
rechnende und eine zeichnende Hälfte teilen: alle vierzehn Abschnitte fassen
das Dokument an. Herausgelöst wurden deshalb nur die neun Stellen, die
wirklich nur rechnen.

**Erst messen, dann schneiden:** über alle Namen zählen, in welche Richtung
die Abhängigkeit läuft. Bei `datenbanken` brauchte der Logikteil **nichts**
aus dem Rest, der Rest aber 16 Namen von dort. Wäre es auch nur an einer
Stelle andersherum gewesen, hätte sich nichts trennen lassen, ohne Verhalten
zu ändern.

**Fertig wenn** für den nächsten Bereich gemessen ist, ob ein Schnitt
überhaupt geht — und er entweder sauber vollzogen oder mit Begründung
verworfen wurde.

**Priorität** — mittel.

---

### A5-Rest — Die `esc`-Kopien durch `Saeubern.alsText` ersetzen

**Ziel**

Eine Stelle, die Text sicher macht, statt rund fünfzig Kopien derselben vier
Zeilen.

**Stand**

Adressen und Mail-HTML gehen bereits durch `Saeubern`. Die verbliebenen
`esc`-Kopien nicht.

**Warum**

Beim Messen kam heraus: 30 von 50 Kopien waren korrekt, die übrigen nicht —
und genau das ist das Muster, das sich durch diese Session zieht: an einer
Stelle getan, an der benachbarten nicht.

**Dateien**

```txt
quell/kern/sicherheit/saeubern.js
und die aufrufenden Bereiche
```

**Tests**

```
node pruefungen/lauf/test87.mjs
npm run pruefen -- --schnell
```

**Priorität** — mittel.

---

## Phase 6 · README und öffentliche Darstellung

### E1 — README kürzen und schärfen

**Ziel**

Die README soll klar sein und nicht zu lang.

**Stand**

Die README wurde neu geschrieben und erklärt local-first, Schnellstart,
Funktionen und Cloud bereits gut. Offen ist die **Länge**: aktuell 1484
Zeilen.

**Fertig wenn**

- die README auf etwa 300–600 Zeilen kommt, höchstens 1000
- Was ist Redion? · local-first · Schnellstart · Funktionen · `.redion` ·
  Cloud optional · TypeScript-Ziel · Tests · Grenzen weiterhin vorkommen
- Ausführliches nach `doku/` wandert statt gelöscht zu werden

**Priorität** — hoch.

---

### E2 — Die alte JavaScript-Aussage nachziehen

**Ziel**

Kein Dokument soll mehr so klingen, als wäre TypeScript unerwünscht.

**Wo es steht**

Nicht mehr in der README — dort wurde es bereits entfernt. Es steht in
**`CLAUDE.md:1564`**:

> Redion ist aktuell klassisches HTML/CSS/JavaScript ohne Build-Pflicht.

**Neue Formulierung**

```txt
Redion läuft weiterhin einfach lokal.
Redion wird schrittweise auf TypeScript migriert.
Die Nutzung per index.html und redion-einzeldatei.html bleibt erhalten.
```

**Priorität** — hoch.

---

## Phase 6b · Excel-Recherche und Entscheidung

Redion soll Excel-**Probleme** lösen, nicht Excel klonen — siehe
`ENTSCHEIDUNGEN.md` E24. Bevor eine einzige Tabellenfunktion gebaut wird,
muss klar sein, welche Fälle sie abdecken soll.

### ~~X1 — Recherche schreiben~~ · erledigt

`doku/EXCEL-IN-REDION-RECHERCHE.md`.

**Und das Ergebnis dreht die Reihenfolge um.** Diese Phase ging davon aus,
dass rund sechzig Funktionen zu bauen sind. Gemessen — Register geladen,
Laufzeit geladen, Namen abgeglichen:

```txt
158  Funktionen im Register, davon 0 ohne Implementierung
 37  von 63 des Startpakets sind bereits da und laufen
  0  davon sind unter ihrem deutschen Namen erreichbar
```

Wer aus Excel kommt und `=SUMME(A1:A10)` tippt, bekommt einen Fehler. `sum`
hätte funktioniert.

Es fehlen also **26 Funktionen und 37 Namen** — und die Namen sind fast
umsonst: der Zerteiler kennt Umlaute schon (`/[A-Za-zÄÖÜäöüß_]/`), und Namen
werden vor dem Nachschlagen kleingeschrieben. Ein Alias ist eine Zeile.

---

### X2 — Deutsche Excel-Namen · ◐ Schritt 1 erledigt

**Schritt 1 — die 37 Namen · erledigt.**

Die Aliase stehen in `quell/bereiche/datenbanken/formeln/laufzeit.js` als
**Namenstabelle**, die ganz zu Beginn der Auswertung greift. Beschrieben
stehen sie in `quell/register/formeln.js`, damit die Suche im Formeleditor
sie findet — sonst gäbe es sie und niemand entdeckte sie.

**Der erste Wurf war falsch, und das gehört hierhin.** Er schrieb
`F.summe = F.sum` — Zeiger auf dieselben Funktionen, scheinbar sauber.
`evaluate` behandelt aber dreizehn Namen besonders, **bevor** es in `F`
schaut, darunter `if` und `ifs` mit ihrer faulen Auswertung. Ein Alias, der
nur in `F` steht, läuft daran vorbei:

```txt
if(true, 1, teuer())      rechnete teuer() nicht
WENN(true, 1, teuer())    rechnete es
```

Beide gaben `1` zurück — und deshalb fiel es nicht auf: der Prüflauf verglich
Ergebnisse, und die waren gleich. Ein Zweig mit `prop()` hätte in einer
Umgebung ohne Verknüpfung geworfen, obwohl er nicht genommen wurde, und
`WENNFEHLER` liesse sich so gar nicht bauen.

Jetzt wird der deutsche Name **vor** allem anderen auf den englischen
zurückgeführt. Danach gibt es im ganzen Auswerter nur noch einen Namen je
Funktion, und jede Sonderbehandlung — die heutigen dreizehn und jede spätere
— gilt für beide Schreibweisen von selbst.

`MIN`, `MAX` und `ABS` brauchten keinen Alias (gleicher Name in beiden
Sprachen), haben aber jetzt eine Beschreibung: sie standen unbeschrieben
unter „Sonstiges", und wer aus Excel kommt, sucht genau nach ihnen.

**Gehalten von** `pruefungen/lauf/test106.mjs` (78 Prüfungen). Er prüft nicht,
ob ein Name *antwortet*, sondern ob er **dasselbe rechnet** wie sein
englisches Gegenstück — ein Alias, der leicht anders rechnet, ist schlimmer
als keiner, weil er richtig aussieht. Dazu die Gegenrichtung: alle englischen
Namen rechnen weiter (ein Alias, der das Original verdrängt, hätte jede
bestehende Formel in jedem Bestand gebrochen).

Er prüft ausserdem, dass der **nicht genommene Zweig nicht rechnet** — die
Eigenschaft, die der erste Wurf verletzte und die kein Ergebnisvergleich
findet.

Gegengeprüft: die Namenstabelle wieder aus der Auswertung genommen, und 39
von 80 Prüfungen wurden rot. Dass es 39 sind und nicht 3, ist der Beweis,
dass die Tabelle jetzt der einzige Weg ist — es liegt keine zweite Fassung
mehr daneben.

**Schritt 2 — die 16 kleinen fehlenden · 14 erledigt, 2 bewusst nicht.**

Gebaut:

```txt
PRODUKT · ANZAHL · ANZAHL2 · POTENZ · GANZZAHL · ZEIT · WOCHENTAG
LINKS · RECHTS · SÄUBERN · SUCHEN · FINDEN · ISTZAHL · ISTTEXT
```

**Dabei kam ein Fehler in Schritt 1 heraus.** `ABRUNDEN` zeigte auf `floor`,
`AUFRUNDEN` auf `ceil`. Für positive Zahlen stimmt das — deshalb fiel es
nicht auf. Excel rundet aber **zur Null hin** und **von der Null weg**:

```txt
                 Excel    floor/ceil
ABRUNDEN(-2,5)     -2         -3
AUFRUNDEN(-2,1)    -3         -2
```

Wer eine Ausgabenliste mit negativen Beträgen rundet, bekommt sonst je Zeile
einen Rappen Unterschied — die Sorte Fehler, die man erst in der Summe sieht
und dann nicht mehr findet. Behoben mit eigenen `rounddown`/`roundup`;
`GANZZAHL` ist jetzt der Name für das, was `floor` tut. `floor` und `ceil`
behalten ihre mathematische Bedeutung, und der Prüflauf hält beide Seiten.

**`FINDEN` heisst intern `findtext`.** `find` ist die Listenfunktion und wird
in `evaluate` besonders behandelt — ein `F.find` wäre davon verdeckt worden
und nie aufgerufen. Nachgesehen statt geraten: geprüft, dass `F.find = …`
tatsächlich wirkungslos bleibt.

**Nicht gebaut: `WENNFEHLER` und `ISTFEHLER` — mit Absicht.**

Redions Laufzeit ist abwehrend gebaut und erzeugt gar keine Fehlerwerte:
`1/0` ist `0`, `WERT("abc")` ist `0`. Excels WENNFEHLER fängt `#DIV/0!` und
`#WERT!` — hier gäbe es nichts zu fangen. Es sähe aus wie Excels und wäre
etwas anderes.

Echte Fehlerwerte wären keine neue Funktion, sondern eine Änderung am Rechnen
selbst — und sie änderten das Ergebnis **bestehender Formelspalten in
bestehenden Datenbanken**. Das ist Priorität 1 und braucht eine eigene
Entscheidung. Siehe `ENTSCHEIDUNGEN.md` E24, Nachtrag 3.

`test106` Abschnitt 4d hält den Zustand fest, damit er eine Entscheidung
bleibt und nicht zu einer Lücke wird, die jemand aus Versehen füllt.

**Stand: `test106` hat 111 Prüfungen.**

**Priorität** — der Rest von X2 ist erledigt; als Nächstes X3.

---

### ~~X3 — Suche und Verweise~~ · erledigt

`ZÄHLENWENN(S)` · `SUMMEWENN(S)` · `MITTELWERTWENN(S)` · `SVERWEIS` ·
`WVERWEIS` · `XVERWEIS` · `INDEX` · `FILTER` — dazu `VERGLEICH`, das vorher
falsch zeigte.

**Die Bedingungssprache.** Excel schreibt Bedingungen als Text:
`ZÄHLENWENN(Betrag; ">100")`. Das ist eine eigene kleine Sprache — `>`, `>=`,
`<`, `<=`, `<>`, `=`, dazu `*` und `?`. Redion versteht sie, obwohl es mit
`filter(liste, current > 100)` einen mächtigeren eigenen Weg hätte: wer diese
Funktionen sucht, kommt aus Excel und tippt, was er kennt. Eine Funktion, die
`ZÄHLENWENN` heisst und etwas anderes verlangt, ist eine Falle mit vertrautem
Namen.

Kein `eval`, kein regulärer Ausdruck aus Nutzertext ohne Maskierung: das
Muster wird Zeichen für Zeichen gebaut und alles ausser `*` und `?` maskiert.

**Ungleich lange Listen brechen nichts.** In Excel ist das ein Fehler; hier
wird gekürzt. Eine Sicherung oder ein Import kann Listen verschiedener Länge
liefern, und ein Absturz mitten in einer Ansicht ist die schlechtere Antwort.

**Gehalten von** `pruefungen/lauf/test107.mjs` (44 Prüfungen).

---

### Der teuerste Fehler dieser Phase — elf falsche Zuordnungen

Beim Bauen von X3 kam heraus, dass **elf** der siebenunddreissig Zuordnungen
aus X2 nach Namensähnlichkeit gemacht waren statt nach Bedeutung:

```txt
                          zeigte auf    tat              Excel
TEIL("Redion";2;3)        slice         "d"              "edi"
TEXTKETTE("a";"b")        concat        ["a","b"]        "ab"
TEXTVERKETTEN("-";"a";"b") join         "-"              "a-b"
DATUM(2026;8;4)           date          1                2026-08-04
ERSETZEN("Redion";1;3;"XX") replace     "Redion"         "XXion"
WECHSELN("a.b.c";".";"-") replaceall    "-----"          "a-b-c"
TEXT(1234,5;"0.00")       format        "1234.5"         "1234.50"
VERGLEICH(…)              match         ["Genf"]         die Stelle
TAG("2026-08-04")         day           2 (Wochentag)    4
REST(-7;3)                mod           -1               2
RUNDEN(-2,5)              round         -2               -3
```

**Warum der Prüflauf sie nicht fand.** Er verglich den deutschen Namen mit
dem, worauf er zeigt. Zeigt der Name auf die verkehrte Funktion, rechnen
beide Seiten dasselbe Verkehrte — und der Vergleich ist zufrieden. Ein
solcher Vergleich findet nur einen *fehlenden* Zweitnamen, nie einen
*falschen*.

Alle elf haben jetzt eigene Funktionen mit Excel-Bedeutung; die englischen
Namen behalten ihre bisherige, weil bestehende Formeln daran hängen.
`test106` Abschnitt 4e prüft gegen **feste erwartete Werte** statt gegen die
Gegenseite. Die Regel steht in `ENTSCHEIDUNGEN.md` E24, Nachtrag 4.

**Nebenbefund:** `namen()` meldete neun Funktionen nicht, die `evaluate`
sehr wohl kann (`map`, `filter`, `find`, `some`, `every`, `let`, `lets`,
`findIndex`, `prop`). Die Vervollständigung im Formeleditor bot sie deshalb
nie an, und `abgleich()` hätte jede Beschreibung dafür als „Versprechen ohne
Funktion" gemeldet. Behoben.

**Stand: `test106` 168 Prüfungen, `test107` 44.**

---

## Phase 6c · Spreadsheet-MVP

### X4 — Der Tabellenblock

**Ziel**

Ein Block, in dem man rechnet.

**Warum**

Der Unterschied zu einer Datenbank: eine Datenbank hat ein Schema, eine
Tabelle hat Zellen. Beides wird gebraucht.

**Dateien**

```txt
quell/register/bloecke.js          neue Blockart
quell/bereiche/tabelle/dienst.js   reine Logik, ohne DOM
quell/bereiche/tabelle/ansicht.js  das Zeichnen
```

**Fertig wenn**

- Zellen, Zeilen, Spalten
- Bezüge `A1`, `B2` und Bereiche `A1:C10`
- Formeln in Zellen
- automatische Neuberechnung
- Abhängigkeiten zwischen Zellen
- **Zirkelbezüge werden erkannt und benannt**, nicht als Absturz
- Fehlerwerte wie `#WERT!` statt stiller `NaN`
- die Logik lässt sich in Node prüfen, ohne Browser

**Regel** — der Bereich `tabelle` benutzt `kern/` und `register/`, nicht
`bereiche/datenbanken` (`CLAUDE.md` Regel 1).

**Priorität** — hoch.

---

### X5 — Spreadsheet-Ansicht für Datenbanken

**Ziel**

Eine Datenbank soll sich anfassen lassen wie eine Tabelle.

**Fertig wenn** vorhanden: Kopieren und Einfügen über mehrere Zellen ·
Masseneingabe · Ausfüllen nach unten · Tastaturbedienung wie erwartet

**Priorität** — mittel.

---

## Phase 6d · Analyse

### X6 — Bedingte Formatierung

Datenbalken · Farbskalen · Zeilenfarbe per Formel · Symbolregeln · Duplikate
markieren · leere Werte · überfällige Werte. Siehe `LUECKEN.md` L15.

**Priorität** — mittel.

---

### X7 — Diagramme erweitern

Vorhanden sind `chart` und `dashboard`. Es fehlen: Ringdiagramm · Histogramm ·
Wasserfall · Pareto · Boxplot · Treemap · Radar · Kombination · KPI-Karte ·
Fortschrittsanzeige.

**Priorität** — mittel.

---

### X8 — CSV und XLSX

CSV rein und raus gibt es. Offen: XLSX-Import, XLSX-Export, ODS später.

**Vorbehalt** — XLSX ist ein ZIP mit XML. Der ZIP-Teil ist gebaut
(`Ausgeben.zipSchreiben`, `Einlesen.zipLesenAusBlob`). Für den XML-Teil gilt
E26: erst prüfen, ob es ohne grosse Abhängigkeit geht.

**Priorität** — mittel.

---

## Phase 7 · Notion-ähnliche Funktionen

### F1 — Formelfunktionen vollständig beschreiben

**Ziel**

Alle Formelfunktionen sollen im Editor erklärt werden.

**Warum**

Die Laufzeit kennt 158 Funktionen, beschrieben sind 34. Die übrigen 129
erscheinen als Gruppe „Sonstiges", ohne Argumentliste, ohne Erklärung, ohne
Beispiel. Eine Funktion, die niemand findet, ist fast wie nicht vorhanden.

**Dateien**

```txt
quell/register/formeln.js
```

**Fertig wenn** jede Funktion Signatur, Beschreibung und Beispiel hat und der
Editor keine bekannte Funktion mehr unter „Sonstiges" zeigt.

**Tests**

Die Gegenprobe ist schon da: `Register.formeln.abgleich()` meldet beide
Richtungen — `ohneFunktion` ist bereits 0, `ohneBeschreibung` ist 129. Ein
eigener Prüflauf dafür **fehlt noch** und gehört zu dieser Aufgabe.

```
npm run pruefen -- --schnell
```

**Priorität** — mittel.

---

### F2 — Fehlende Blocktypen prüfen

**Ziel**

Die Blocktypen Zeile für Zeile gegen die Notion-Liste prüfen.

**Warum**

Gemessen: 97 gegen 58. Unklar ist, welche wirklich fehlen und welche nur
anders heissen.

**Dateien**

```txt
LUECKEN.md
quell/register/bloecke.js
```

**Fertig wenn** die Liste durchgegangen ist, fehlende Blöcke benannt und nach
Nutzen sortiert sind und **keine doppelten Blockarten erfunden** wurden.

**Priorität** — mittel.

---

### F3 — Automationen erweitern

**Ziel**

If/Else und Schleifen in Aktionsketten.

**Dateien**

```txt
quell/bereiche/editor/ansicht/editor.js
quell/register/befehle.js
quell/bereiche/datenbanken/dienst.js
```

**Fertig wenn** es die Aktionen `wenn`, `sonst` und `fuerJede` gibt, mit
Vorschau und Prüflauf.

**Priorität** — mittel.

---

## Phase 8 · Cloudflare, Konto und Sync

### G1 — Konto-Modus planen

**Ziel**

Das Konto bleibt optional (siehe E1 und E2 in `ENTSCHEIDUNGEN.md`).

**Dateien**

```txt
SERVER-EINRICHTEN.md
CLOUDFLARE.md
server/
```

**Fertig wenn** der Nutzer wählen kann: nur lokal · lokal + Backup ·
lokal + Sync · Cloud-Arbeitsbereich

**Priorität** — mittel.

---

### G2 — R2-Dateispeicher planen

**Ziel**

Große Dateien und `.redion`-Backups gehören nach R2, nicht nach D1.

**Dateien**

```txt
CLOUDFLARE.md
server/
doku/REDION-FORMAT.md
```

**Fertig wenn** Bucket-Struktur, Rechteprüfung, Upload-Limits und
Download-Regeln beschrieben sind.

**Priorität** — mittel.

---

### G3 — Sync-Konflikte testen

**Ziel**

Sync darf keine Daten verlieren.

**Dateien**

```txt
server/
quell/kern/abgleich/
pruefungen/
```

**Fertig wenn** es Prüfläufe gibt für: zwei Geräte · zwei Tabs · Änderung
offline · späterer Abgleich · Konflikt · Löschung · Datei-Anhang

**Priorität** — hoch, sobald Cloud-Sync aktiv gebaut wird.

---

## Phase 9 · Mobile und iPhone

### H1 — iPhone-Ansicht verbessern

**Ziel**

Redion soll auf dem iPhone gut nutzbar sein.

**Fokus**

```txt
iPhone 13 Pro Max · Safari · PWA · Touch
Bottom Sheets · Editor ohne Tastaturprobleme
```

**Fertig wenn** die Seitenleiste auf dem Handy gut funktioniert, das Blockmenü
touchfreundlich ist, Datenbanken horizontal nutzbar sind, Dialoge nicht aus
dem Bildschirm laufen und Dateiimport/-export verständlich ist.

**Priorität** — mittel.

---

## Dauerhafte Regeln

Nach jeder wichtigen Änderung:

```
npm run pruefen -- --schnell
node bauen.js
```

Bei Speicher, Backup, Import oder Export zusätzlich:

```
node pruefungen/lauf/test100.mjs
```

Bei Architektur oder Sicherheit:

```
node pruefungen/lauf/test87.mjs
```

**Keine Änderung darf:**

- Datenverlust riskieren
- das Backup schwächen
- die Offline-Nutzung brechen
- `redion-einzeldatei.html` kaputtmachen
- private Daten ungefragt hochladen

---

## Wo alles steht

```txt
quell/kern/        Ablage, Sicherheit, Abgleich, Helfer — ohne DOM
quell/register/    die Kataloge: Blöcke, Ansichten, Formeln, Tasten …
quell/schale/      Gerüst und Stil
quell/bereiche/    die Fachbereiche
server/            Cloudflare Worker und Prüfserver
pruefungen/lauf/   die Prüfläufe
doku/              die ausführliche Dokumentation
```
