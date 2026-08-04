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

**Stand: 4. August 2026 · 73 Prüfläufe grün**

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

## Phase 2 · TypeScript-Grundlage

Siehe `ENTSCHEIDUNGEN.md` E6 und E7: TypeScript ja, React nicht automatisch,
und die Nutzung per Doppelklick bleibt erhalten.

### B1 — TypeScript technisch vorbereiten

**Ziel**

Redion bekommt die Grundlage für TypeScript.

**Warum**

Ohne Typecheck ist jede weitere Migration ein Blindflug.

**Dateien**

```txt
package.json
package-lock.json
tsconfig.json
src/core/types/index.ts
doku/TYPESCRIPT-MIGRATION.md
```

**Fertig wenn**

- `typescript` als `devDependency` vorhanden ist
- `npm run typecheck` existiert und läuft
- `tsconfig.json` existiert
- `src/core/types/index.ts` existiert
- **keine App-Funktion verändert wurde**
- alle bisherigen Prüfläufe weiter grün sind

**Tests**

```
npm run typecheck
npm run pruefen -- --schnell
node bauen.js
```

**Priorität** — sehr hoch.

---

### B2 — Zentrale Redion-Typen anlegen

**Ziel**

Gemeinsame Typen für Blöcke, Seiten, Datenbanken, Dateien, Backups und Sync.

**Dateien**

```txt
src/core/types/index.ts
src/core/types/block.ts
src/core/types/database.ts
src/core/types/file.ts
src/core/types/backup.ts
src/core/types/result.ts
```

**Fertig wenn** Typen existieren für:

```txt
ID · BlockId · PageId · CollectionId · ViewId · FileId · ISODateTime
RedionBlock · RedionPage · RedionFile · RedionDatabase · RedionView
RedionPackageManifest · RedionPackageData · Ergebnis<T>
```

**Tests**

```
npm run typecheck
```

**Priorität** — sehr hoch.

---

### B3 — Migrationsdokument schreiben

**Ziel**

Eine klare Anleitung, damit die Migration nicht in Etappen ohne Netz zerfällt.

**Dateien**

```txt
doku/TYPESCRIPT-MIGRATION.md
```

**Fertig wenn** das Dokument enthält: Ziel · Nicht-Ziele · Reihenfolge ·
sichere Migrationsregeln · welche Dateien zuerst · welche zuletzt ·
Testpflicht · Umgang mit `quell/` · Umgang mit `src/` · Verbot der
Alles-auf-einmal-Migration

**Priorität** — hoch.

---

### B4 — Typecheck in GitHub Actions

**Ziel**

GitHub prüft TypeScript automatisch mit.

**Dateien**

```txt
.github/workflows/pruefen.yml
package.json
```

**Fertig wenn** CI ausführt:

```
npm run typecheck
npm run pruefen -- --schnell
node bauen.js
```

**Priorität** — hoch.

---

## Phase 3 · Backup und `.redion`

### C1 — `.redion`-Format dokumentieren

**Ziel**

Das Format bekommt eine eigene Dokumentation.

**Warum**

Backup ist eine Vertrauensfunktion. Wer es in zehn Jahren öffnet, muss
verstehen, was drinsteht.

**Dateien**

```txt
doku/REDION-FORMAT.md
README.md
ENTSCHEIDUNGEN.md
```

**Fertig wenn** das Dokument erklärt: Warum `.redion`? · Warum nicht nur
JSON? · Aufbau · `daten.json` · `dateien.json` · `dateien/` · Dateinamen ·
Datei-IDs · Import-Regeln · Lösch-Regeln · 4-GB-Grenze · ZIP64 ·
Kompatibilität

**Priorität** — sehr hoch.

---

### C2 — Backup-Tests schützen

**Ziel**

Die Backup-Prüfungen dürfen nicht versehentlich abgeschwächt werden.

**Dateien**

```txt
pruefungen/lauf/test100.mjs
pruefungen/LIESMICH.md
```

**Fertig wenn**

- dokumentiert ist, was `test100` schützt
- `.redion`-Import/Export weiter **echte Bytes** vergleicht
- der JSON-Import weiterhin keine Anhänge löscht

**Tests**

```
node pruefungen/lauf/test100.mjs
npm run pruefen -- --schnell
```

**Priorität** — hoch.

---

### C3 — ZIP64-Entscheidung vorbereiten

**Ziel**

Klären, ob Redion später Dateien über 4 GB unterstützt.

**Dateien**

```txt
ENTSCHEIDUNGEN.md
LUECKEN.md
doku/REDION-FORMAT.md
```

**Fertig wenn** die aktuelle Grenze und die Fehlermeldung dokumentiert sind,
ZIP64 als spätere Lücke markiert ist und weiterhin **kein kaputtes Archiv**
geschrieben wird.

**Priorität** — mittel.

---

## Phase 4 · Speicher und Datenmodell

### D1 — Speicher-Typen definieren

**Ziel**

Die IndexedDB-Fächer typisieren.

**Dateien**

```txt
src/core/types/storage.ts
quell/kern/ablage/indexdb.js
doku/ARCHITEKTUR.md
```

**Fertig wenn** Typen existieren für:

```txt
blocks · collections · views · meta · versions
dateien · stuecke · basis · vorrat
```

**Tests**

```
npm run typecheck
npm run pruefen -- --schnell
```

**Priorität** — hoch.

---

### D2 — Kleine DOM-freie Helfer migrieren

**Ziel**

Mit sicheren kleinen Dateien anfangen.

**Warum**

Nicht mit Editor oder Datenbanken anfangen — dort ist das Risiko am höchsten.

**Geeignete Kandidaten**

```txt
Kennungen · Datum · Objekt-Helfer · Ergebnis-Typ
Datei-Metadaten · Backup-Manifest
```

**Nicht anfangen mit**

```txt
editor.js · steuerung.js · indexdb.js komplett
bauen.js · server/kern.js
```

**Fertig wenn** die Helfer in TypeScript existieren, **keine
Verhaltensänderung** eingetreten ist, der Typecheck läuft und alle Prüfläufe
grün sind.

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

### X1 — Recherche schreiben

**Ziel**

Festhalten, welche Excel-Fälle Redion wirklich lösen muss.

**Dateien**

```txt
doku/EXCEL-IN-REDION-RECHERCHE.md
```

**Fertig wenn** darin steht: die häufigsten Alltagsfälle (Budget, Rechnungen,
Materiallisten, Projektkosten, Lernfortschritt, Inventar) · welche Funktionen
sie brauchen · was Redion davon schon kann · was der Formelsprache fehlt ·
was der Datenmodellierung fehlt · was **nicht** gebaut wird

**Priorität** — hoch, vor X2.

---

### X2 — Funktionsnamen und Aliase

**Ziel**

Deutsche Excel-Namen mit englischen Aliasen, in **einem** Register.

**Warum**

Die Formelsprache gibt es schon (`register/formeln.js`, sicherer Parser ohne
`eval()`). Ein zweiter Auswerter für Tabellen wäre ein zweites Regelwerk mit
eigenen Fehlern — siehe E24.

**Dateien**

```txt
quell/register/formeln.js
quell/bereiche/datenbanken/formeln/laufzeit.js
```

**Fertig wenn** das Startpaket steht:

```txt
Mathematik  SUMME PRODUKT MITTELWERT MIN MAX ANZAHL ANZAHL2 ABS
            POTENZ WURZEL REST RUNDEN ABRUNDEN AUFRUNDEN GANZZAHL
Logik       WENN WENNS UND ODER NICHT WENNFEHLER
Datum       HEUTE JETZT DATUM ZEIT JAHR MONAT TAG WOCHENTAG KALENDERWOCHE
Text        LÄNGE LINKS RECHTS TEIL GLÄTTEN SÄUBERN GROSS KLEIN SUCHEN
            FINDEN WECHSELN ERSETZEN TEXT WERT TEXTKETTE TEXTVERKETTEN
Info        ISTZAHL ISTTEXT ISTLEER ISTFEHLER
```

Jede mit englischem Alias, Beschreibung, Beispiel und Prüflauf.

**Priorität** — hoch.

---

### X3 — Suche und Verweise

**Ziel**

Die Funktionen, wegen derer Menschen bei Excel bleiben.

**Fertig wenn** vorhanden: `ZÄHLENWENN(S)` · `SUMMEWENN(S)` ·
`MITTELWERTWENN(S)` · `SVERWEIS` · `WVERWEIS` · `XVERWEIS` · `INDEX` ·
`VERGLEICH` · `FILTER` · `SORTIEREN` · `EINDEUTIG`

**Priorität** — hoch.

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
