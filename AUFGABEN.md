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

Jede Aufgabe braucht: **Ziel · Warum · Dateien · Fertig wenn · Tests ·
Priorität.**

Die Phasen stehen in der Reihenfolge, in der sie einander leichter machen.
Was **erledigt** ist, bleibt mit zwei bis fünf Zeilen stehen — damit man
sieht, worauf das Nächste aufbaut, ohne die ganze Geschichte zu lesen.

---

## Aktueller Stand

**4. August 2026 · 78 Prüfläufe grün**

Redion kann heute: lokal starten · offline arbeiten · Seiten und Blöcke
speichern · Datenbanken · Formeln (158 Funktionen, davon 61 unter deutschem
Excel-Namen) · lokale KI · Versionen · Papierkorb · `.json`- und
`.redion`-Sicherung mit Anhängen · grosse Dateien stückweise.

**Die drei wichtigsten offenen Punkte**

```txt
1. Die TypeScript-Migration selbst — die Grundlage steht, quell/ ist noch JS
2. Der Spreadsheet-Block — die Funktionen sind da, die Tabelle fehlt
3. Cloudflare, Konto und Sync sind nicht produktionsreif
```

---

## Phase 1 · Ordnung und Dokumentation · **erledigt**

Die fünf Steuerdateien sagen jetzt dasselbe.

Vorher widersprachen sie sich: `CLAUDE.md` §3 verlangte deutsche Dateinamen,
§52 gab die Zielstruktur englisch vor, die README ebenfalls. Wer neuen Code
schrieb, konnte beide Seiten belegen — und schrieb deshalb zuerst deutsch.

**Erledigt**

- `ENTSCHEIDUNGEN.md`: **E27 · Code-Sprache** neu · E24 von 196 auf 132
  Zeilen konsolidiert (vier Nachträge, von denen einer einen früheren
  widerrief, sind zu geltenden Regeln geworden)
- `AUFGABEN.md`: diese Datei, zehn Phasen mit ehrlichem Stand
- `LUECKEN.md`: nach Priorität statt nach Nummer
- `CLAUDE.md`: **Abschnitt 53 · Code-Sprache und TypeScript** neu · §3
  präzisiert · 39 Zeilen unredigierter Chat-Text entfernt
- `README.md`: Code-Stil um die Sprachregel ergänzt
- `doku/TYPESCRIPT-MIGRATION.md`, `doku/ARCHITEKTUR.md`,
  `pruefungen/LIESMICH.md`: auf die englischen Pfade nachgezogen

**Dabei gefunden: erfundene Feldnamen an zwei Stellen.** `CLAUDE.md` §52.8
und `README.md` zeigten `createdAt`, `updatedAt`, `properties`, `children`
und `deleted` als Felder eines Blocks. Vier davon gibt es nicht, und
`deleted` hätte die Bedeutung von `alive` genau umgekehrt. Beide Beispiele
waren nie gegen `quell/kern/ablage/indexdb.js:255` geprüft — dieselbe
Fehlerklasse wie die elf falschen Excel-Zuordnungen. Jetzt steht dort die
gemessene Form, mit `src/core/types/` als Wahrheit und dem Rest als Beispiel.

**Fertig wenn** — alles erfüllt: TypeScript-Ziel klar · Code-Sprache klar ·
`.redion` klar · Excel-Ziel klar · Cloudflare als optional klar.

---

## Phase 2 · TypeScript-Grundlage · **erledigt**

```txt
typescript@5.9.3        devDependency
tsconfig.json           strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
npm run typecheck       tsc --noEmit
npm run bauen:ts        tsc -p tsconfig.bauen.json
src/core/types/         sieben Dateien
doku/TYPESCRIPT-MIGRATION.md
GitHub Actions          Typecheck im schnellen Auftrag
```

**`noEmit` ist die Kernentscheidung.** Es entsteht kein JavaScript und damit
kein Bauschritt, den jemand vergessen kann — die App startet weiterhin per
Doppelklick. Für ausführbaren Code gibt es `tsconfig.bauen.json`, das nach
`quell/` ausgibt; das Erzeugnis wird mitversioniert.

Gegengeprüft: ein absichtlich falscher Typ macht den Lauf rot (`TS2740`). Ein
Typecheck, der grün ist, weil er keine Datei findet, sagt nichts.

---

## Phase 3 · Backup und `.redion` dokumentieren · **erledigt**

`doku/REDION-FORMAT.md` — Aufbau des Archivs · `daten.json` ·
`dateien.json` · Dateinamen- und Kennungsregeln · die zwei Einspielarten und
warum es keine Vorgabe gibt · die Grenzen · wie man ein `.redion` ohne
Redion öffnet.

`pruefungen/LIESMICH.md` beschreibt die fünf Läufe, die man nicht abschwächen
darf, und **wodurch** man sie versehentlich entschärfen würde.

**Dabei gefunden und behoben** — drei Fehler, die alle still waren:

```txt
ein ZIP mit 70 000 Einträgen nannte 4 464 und sah gesund aus
ein fremdes ZIP64-Archiv importierte als „0 Anhänge", ohne Fehler
die verschlüsselte Wiederherstellung meldete Erfolg und warf die Daten weg
```

Gehalten von `test103` (14) und `test104` (20).

**Offen: ZIP64.** Die heutige Regel ist eine ehrliche Fehlermeldung statt
eines kaputten Archivs. Siehe `LUECKEN.md`.

---

## Phase 4 · Excel-Recherche und Tabellenkern planen · **erledigt**

`doku/EXCEL-IN-REDION-RECHERCHE.md`.

**Das Ergebnis drehte die Reihenfolge um.** Angenommen waren rund sechzig zu
bauende Funktionen. Gemessen:

```txt
158  Funktionen im Register, davon 0 ohne Implementierung
 37  des Excel-Startpakets liefen bereits — keine unter deutschem Namen
```

Es fehlten also nicht Funktionen, sondern **Namen**. Heute laufen 61 von 63
unter deutschem Namen; die zwei fehlenden fehlen mit Absicht
(`ENTSCHEIDUNGEN.md` E24, Regel 3).

VBA und Makros sind ausgeschlossen (E25), grosse Abhängigkeiten nur nach
Prüfung (E26).

---

## Phase 5 · Erste TypeScript-Typen · ◐ **grösstenteils erledigt**

Sieben Dateien unter `src/core/types/`, alle aus dem laufenden Code
**gemessen** und seit Phase 1 englisch benannt (E27):

```txt
id.ts        ID · ISODateTime · BlockId … FileId · Result<T> · Done
block.ts     RedionBlock · RedionRow · RedionPage · RedionVersion
database.ts  RedionDatabase · RedionView · Schema · Column · Filter · Sort
file.ts      RedionFile · FileChunk · UploadState
backup.ts    RedionPackageData · RedionPackageManifest · RedionPackage · ImportMode
storage.ts   STORES (alle neun) · StorageLocation · StorageInfo
index.ts     eine Tür für alles davon
```

**Typnamen englisch, Feldnamen nicht.** `RedionBlock` trägt weiter
`created`, `edited`, `erstelltVon`, `alive`, `parentTable` — so stehen sie in
IndexedDB. Ein Feldname, der nicht dem gespeicherten Feld entspricht, wäre
keine Übersetzung, sondern eine falsche Behauptung.

### 5a — `spreadsheet.ts` und `formula.ts`

**Ziel** — die Typen für den Tabellenkern, bevor er gebaut wird.

**Fertig wenn** vorhanden: `Workbook` · `Sheet` · `Cell` · `Range` ·
`FormulaResult`

**Wichtig** — erst messen, was der bestehende Formelauswerter wirklich
zurückgibt, dann tippen. `FormulaResult` muss die abwehrende Laufzeit
abbilden (`1/0 → 0`), nicht Excels Fehlerwerte, solange die Entscheidung
darüber offen ist.

**Tests** — `npm run typecheck`

**Priorität** — hoch, vor Phase 7.

---

## Phase 6 · Erste sichere Migrationen · ◐ **begonnen**

Nur kleine, DOM-freie Helfer. **Nicht zuerst:** `editor.js` ·
`steuerung.js` · `indexdb.js` · `bauen.js` · `server/kern.js`.

### ~~6a — Kennungen~~ · erledigt

`src/core/helpers/ids.ts` → `quell/core/helpers/ids.js`.

Erste Datei mit vollständig englischer Schnittstelle: aus `Kennungen.lang()`
wurde `Ids.long()`. Vertretbar, weil gemessen nur **fünfzehn Aufrufe in drei
Dateien** — nicht die verbotene Massenumbenennung, sondern der Fall „im
Rahmen einer geplanten Migration".

Verhalten nachweislich unverändert; `test85` prüft alle acht Funktionen,
`test105` hält `.ts` und erzeugtes `.js` zusammen.

### 6b — Die übrigen kleinen Helfer

**Ziel** — Datum · Objekte · Bremse · Melder · Säubern · Bytes nach
`src/core/helpers/`.

**Warum** — sie sind klein, DOM-frei und einzeln testbar. Jede migrierte
Datei nimmt einen Eintrag aus der `any`-Liste in `src/global.d.ts`.

**Fertig wenn** je Datei: englischer Name · Verhalten unverändert ·
`npm run bauen:ts` erzeugt das `.js` · `index.html` und `sw.js` nachgezogen ·
alle Läufe grün.

**Achtung** — `Saeubern` hat deutlich mehr Aufrufer als `Kennungen`. Vor dem
Umbenennen der Schnittstelle **zählen**; bei zu vielen Aufrufern bleibt der
öffentliche Name vorerst.

**Tests** — `npm run typecheck` · `npm run bauen:ts` · `test105` · `test87` ·
`node bauen.js`

**Priorität** — hoch.

---

## Phase 7 · Spreadsheet-MVP

**Der Stand ist besser als erwartet:** alle elf Funktionen, die für den
ersten Wurf vorgesehen waren, rechnen bereits —
`SUMME` `MITTELWERT` `MIN` `MAX` `ANZAHL` `WENN` `UND` `ODER` `HEUTE`
`JETZT` `TEXT`. Es fehlt der **Block**, nicht die Rechenkraft.

### 7a — Der Spreadsheet-Block

**Ziel** — ein Block mit einem echten Zellraster.

**Fertig wenn** — Block im Register · kleine Tabelle anzeigen · Zellen
bearbeiten · `A1`-Bezüge · Bereiche `A1:C10` · automatische Neuberechnung ·
Zirkelbezüge erkennen und melden · Fehlerwerte anzeigen

**Warum es ein eigener Block ist** — Excel und Redions Datenbanken sind zwei
verschiedene Werkzeuge: dort die Zelle, hier die Zeile als Seite. Ein
Spreadsheet-Block ist ein Block wie jeder andere und passt ohne Sonderfall in
Editor, Sicherung und `.redion`.

**Vorher zu entscheiden** — Fehlerwerte. Ohne sie kann der Block keine
anzeigen; mit ihnen ändert sich das Ergebnis bestehender Formelspalten.
Siehe `ENTSCHEIDUNGEN.md` E24, Regel 3.

**Priorität** — hoch, nach Phase 5a.

### 7b — Spreadsheet-Ansicht für Datenbanken

Tabellenansicht mit Copy/Paste und Masseneingabe — das Excel-Gefühl auf
vorhandenen Daten.

**Priorität** — mittel, nach 7a.

---

## Phase 8 · CSV/XLSX Import und Export

**Teilweise vorhanden:** CSV rein und raus gibt es in den Datenbanken,
einfaches XLSX-Lesen und -Schreiben in `bereiche/dateien/`.

**Reihenfolge** — CSV-Vorschau vor dem Übernehmen · XLSX-Export mit mehreren
Blättern · XLSX-Import mit Typerkennung · ODS später prüfen

**Fertig wenn** — ein Rundlauf mit echten Bytes: exportieren, löschen,
importieren, vergleichen.

**Priorität** — mittel.

---

## Phase 9 · Cloudflare, Konto und Sync

**G1 — Konto-Modus.** Ohne Konto nutzen · Konto anlegen · anmelden ·
abmelden · lokal bleiben · lokal + Sync wählen · Cloud-Arbeitsbereich ·
Konto löschen · alles exportieren.
**Regel:** lokale Daten werden **nie** ohne ausdrückliche Zustimmung
hochgeladen (E1).

**G2 — R2 für Dateien.** Bucket-Struktur · Upload · Download ·
Rechteprüfung · `.redion` und Anhänge in R2.
**Regel:** grosse Dateien gehören nicht in D1 (E2).

**G3 — Sync-Konflikte.** Prüfläufe für: zwei Geräte · Änderung offline ·
derselbe Block geändert · Konflikt wird sichtbar · keine Daten verloren ·
Anhänge bleiben mit ihren Blöcken verbunden.

**Priorität** — G3 **vor** echtem Cloud-Sync.

---

## Phase 10 · Mobile und iPhone

Fokus: iPhone 13 Pro Max, Safari.

Touch-Editor · mobile Datenbankansicht · mobile Spreadsheet-Ansicht ·
Dateiimport und -export mobil · PWA · Tastatur · Offline-Hinweise.

**Priorität** — mittel.

---

## Dauerhafte Regeln

**Nach jeder Codeänderung**

```
npm run pruefen -- --schnell
node bauen.js
```

**Bei Backup, Import oder Export**

```
node pruefungen/lauf/test100.mjs
```

**Bei Architektur oder Sicherheit**

```
node pruefungen/lauf/test87.mjs
```

**Bei TypeScript**

```
npm run typecheck
npm run bauen:ts          wenn eine Datei unter src/core/helpers/ liegt
node pruefungen/lauf/test105.mjs
```

**Vor jedem Push** die volle Runde: `npm run pruefen`.

---

## Fünf Regeln, die aus Fehlern entstanden sind

1. **Nachsehen statt raten.** Kataloge werden geladen und befragt,
   Schnittstellen nachgeschlagen. Der teuerste wiederkehrende Fehler war,
   eine Schnittstelle aus dem Gedächtnis zu schreiben.
2. **Ein Zweitname wird gegen feste Werte geprüft**, nicht gegen die
   Gegenseite — sonst rechnen beide Seiten dasselbe Verkehrte.
3. **Die Nachbarstelle prüfen.** Der häufigste Befund war nie „etwas
   vergessen", sondern „an einer Stelle getan und an der Nachbarstelle
   nicht".
4. **Jede Reparatur gegenprüfen:** zurückdrehen, rot sehen, wieder
   einsetzen. Sonst weiss niemand, ob der Lauf die Sache wirklich hält.
5. **Feldnamen gespeicherter Daten sind keine Namensfrage**, sondern eine
   Migrationsfrage.
