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

**6. August 2026 · 87 Prüfläufe grün**

Redion kann heute: lokal starten · offline arbeiten · Seiten und Blöcke
speichern · Datenbanken · Formeln (158 Funktionen, davon 61 unter deutschem
Excel-Namen) · Tabellenblock (E29) · lokale KI · Versionen · Papierkorb ·
`.json`- und `.redion`-Sicherung mit Anhängen · grosse Dateien stückweise ·
Sicherungsstand auf dem Start-Bildschirm · `.ods` lesen und schreiben.

**Die drei wichtigsten offenen Punkte**

```txt
1. ~~Die TypeScript-Migration selbst~~ · **erledigt** am 6. August —
   0 handgeschriebene JS-Dateien, siehe doku/BUENDEL-11-BIS-24.md
2. ~~Der Spreadsheet-Block — die Funktionen sind da, die Tabelle fehlt~~
   · **erledigt**, siehe Phase 7a und `ENTSCHEIDUNGEN.md` E29
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

### ~~5a — `spreadsheet.ts`, `formula.ts` und `excel.ts`~~ · erledigt

Drei Dateien, zehn Typen mehr im Sammelpunkt `index.ts`.

**Erst gemessen, dann getippt** — und das Messen war die Arbeit. `formula.ts`
beschreibt, was `laufzeit.js` wirklich zurückgibt: sechs Werttypen, zwei
Ergebnisformen, und bei `ok: false` immer `wert: ''`. Beim Messen kamen
**drei Fehler** heraus, die niemand vermutet hatte — das Semikolon als
Trennzeichen gab es nicht, `2e6` ergab 2, und `check('')` widersprach
`run('')`. Alle drei behoben.

**Die Fehlerwert-Entscheidung steckt in den Typen, nicht in einem Satz.**
`FormulaValue` enthält **keinen** `FormulaErrorCode`, `CellValue` schon. Damit
kann der Spreadsheet-Block später `#DIV/0!` zeigen, ohne dass eine einzige
bestehende Datenbankspalte ihr Ergebnis ändert. Stünden die Fehlerwerte in
`FormulaValue`, müsste jeder Aufrufer damit rechnen — und genau das hat
niemand beschlossen.

**`spreadsheet.ts` ist die einzige Datei im Ordner, die eine Absicht
beschreibt statt eines Zustands.** Ihr Kopf sagt das ausdrücklich: solange
der Block nicht gebaut ist, darf sie ohne Messung geändert werden — danach
nicht mehr.

**Und ein Befund im Vorbeigehen:** `register/formeln.js` bringt 82
beschriebene Einträge mit, `laufzeit.js` meldet danach **180 weitere ohne
Satz** an. 262 Einträge, 180 davon stumm. `was` ist deshalb im Typ
freiwillig — nicht aus Bequemlichkeit, sondern weil es die Wirklichkeit ist.

**Neu: `test108`** hält die Typen gegen die laufende Maschine. `tsc` prüft
sie nur gegen sich selbst; ein Typ, der etwas Schöneres behauptet, ist dort
grün. Genau so sind die vier erfundenen Feldnamen entstanden.

---

## Phase 6 · Erste sichere Migrationen · **erledigt**

Nur kleine, DOM-freie Helfer. **Nicht zuerst:** `editor.js` ·
`steuerung.js` · `indexdb.js` · `bauen.mts` · `server/kern.ts`.

### ~~6a — Kennungen~~ · erledigt

`src/core/helpers/ids.ts` → `quell/core/helpers/ids.js`.

Erste Datei mit vollständig englischer Schnittstelle: aus `Kennungen.lang()`
wurde `Ids.long()`. Vertretbar, weil gemessen nur **fünfzehn Aufrufe in drei
Dateien** — nicht die verbotene Massenumbenennung, sondern der Fall „im
Rahmen einer geplanten Migration".

Verhalten nachweislich unverändert; `test85` prüft alle acht Funktionen,
`test105` hält `.ts` und erzeugtes `.js` zusammen.

### ~~6b — Datum, Objekte, Bytes~~ · erledigt

`date.ts` · `objects.ts` · `bytes.ts` → `quell/core/helpers/`.

**Gezählt, bevor umbenannt wurde** — das ist der Schritt, den E27 verlangt:

| Modul | in `quell/` | in Prüfläufen | Schnittstelle umbenannt? |
|---|--:|--:|---|
| `Datum` | 1 (`pruefen.js`) | 9 | ja → `Dates` |
| `Objekte` | 0 | 9 | ja → `Objects` |
| `Bytes` | 6 (3 Dateien) | 2 | Name blieb, Methoden englisch |

**Verhalten nachweislich unverändert.** Alte und neue Fassung wurden
nebeneinander geladen und über dieselben Eingaben geschickt: 1923 · 1488 · 72
Vergleiche, kein einziger Unterschied. Bei `date` waren die Eingaben die
teuren — beide Zeitumstellungstage, 31. Januar, Schaltjahr, Jahreswechsel,
kaputte `Date`-Objekte. Bei `bytes` Puffer bis 1 000 000 Bytes, also über die
Klippe bei 128 000 hinweg, an der die alte Spread-Fassung brach.

**Eine Regel kam dabei dazu:** eine migrierte Datei lässt **keinen Alias
unter dem alten Namen** zurück. `test85` prüft jetzt ausdrücklich, dass
`Datum` und `Objekte` als globale Namen weg sind. Ein zurückgelassener Alias
wäre bequem und würde genau deshalb dafür sorgen, dass niemand die
Aufrufstellen nachzieht — bis der Alias eines Tages verschwindet und es still
bricht.

### ~~6c — Bremse und Melder~~ · erledigt

`throttle.ts` · `reporter.ts` → `quell/core/helpers/`.

| Modul | in `quell/` | in Prüfläufen | Schnittstelle |
|---|--:|--:|---|
| `Bremse` | 0 | 5 | → `Throttle` |
| `Melder` | 17 (10 Dateien) | 6 | → `Reporter` |

**Verhalten gemessen:** 17 bzw. 22 Abläufe verglichen, kein Unterschied. Bei
den Bremsen mit einer **gefälschten Uhr** für beide Fassungen — sonst hinge
das Ergebnis am Rechner und nicht am Code.

**Zwei Dinge blieben absichtlich deutsch:** die Stufennamen `spur` `info`
`warnung` `fehler` (sie stehen so in der ausgegebenen Protokolldatei) und die
Feldnamen eines Eintrags (`stufe` `wo` `text` `daten` `wann`) — sie sind die
Form eines Datensatzes, den `all()` nach aussen gibt.

**`Tempo` ist ausgesetzt**, nicht vergessen: es greift vierzehnmal ins DOM
und fällt damit nicht unter „kleine, DOM-freie Helfer". Es gehört zu dem
Schritt, der die Bereiche in `dienst` und `ansicht` trennt.

### ~~6d — Säubern~~ · erledigt

`src/core/security/sanitize.ts` → `quell/core/security/sanitize.js`.
Zehn Aufrufe in drei Dateien, siebzehn in Prüfläufen. Aus `Saeubern` wurde
`Sanitize`.

**Nicht unter `helpers/`, sondern unter `security/`** — weil es kein Helfer
ist. Was hier schiefgeht, ist fremder Code im Ursprung der Seite, mit Zugriff
auf alle Notizen und den KI-Schlüssel.

**Das machte zwei Erweiterungen nötig, und die zweite war die wichtigere.**
`tsconfig.bauen.json` schloss nur `src/core/helpers/**` ein, und `test105`
sah auch nur dort nach. Ein neuer Ordner wäre also gebaut worden, ohne dass
irgendetwas ihn prüft — oder gar nicht gebaut worden, während sein veraltetes
`.js` weiterläuft. `test105` sieht jetzt alles unter `src/core/` ausser den
Typen **und meldet jeden Ordner, der im Bauplan fehlt**.

**Verhalten gemessen** — 362 Vergleiche zwischen alter und neuer Fassung,
beide in derselben Browserseite geladen, kein Unterschied. Die Sammlung von
dreissig Angriffen daraus steht jetzt dauerhaft in `test91` Abschnitt 6, samt
Gegenprobe: gewöhnliches HTML muss vollständig ankommen. Ein Säuberer, der
alles wegwirft, wäre sonst in allem grün.

---

## Phase 6 ist damit abgeschlossen.

---

## Phase 6e · Die Sprachregel · **erledigt**

`ENTSCHEIDUNGEN.md` **E28**: die zehn Sprachen dieses Projekts, und der eine
Satz, auf den es ankommt — **es entsteht kein neues JavaScript.**

**Warum das vorher nicht ging und jetzt geht.** Neuer Code für den Browser
musste als `.js` entstehen, weil die App ohne Bauschritt startet — und für
Node schien es keinen Grund zu geben, TypeScript zu nehmen. Nachgemessen:
**Node führt TypeScript seit 22.18 direkt aus.** Es entfernt die Typen und
startet. Damit gibt es zwei Wege, und beide kommen ohne Bauschritt aus:

| Wohin | Wie |
|---|---|
| Browser | `src/…/x.ts` → `npm run bauen:ts` → `quell/…/x.js` |
| Node | `x.mts`, direkt mit `node x.mts` |

**Durchgesetzt, nicht erklärt.** `pruefungen/js-bestand.json` führt jede von
Hand geschriebene `.js`; das Verzeichnis darf nur schrumpfen. Eine neue
`.js` macht `test109.mts` sofort rot — gegengeprobt, in beide Richtungen.

`test109.mts` ist zugleich die erste TypeScript-Datei unter `pruefungen/`
und damit der Beweis, dass der zweite Weg trägt.

**Drei Dinge, die dabei nötig waren:**

- Node-Untergrenze auf **22.18** — in `package.json` und in beiden CI-Jobs.
  Ein Lauf, der auf Node 20 an einem Syntaxfehler scheitert, zeigt in die
  falsche Richtung.
- `pruefungen/**/*.mts` in `tsconfig.json`. Node *entfernt* die Typen, es
  prüft sie nicht — ohne diesen Eintrag wären sie Zierde statt Zusage.
- `@types/node` als einzige neue Abhängigkeit. Reine Typinformation: läuft
  nie, landet nie im Browser, steht unter `devDependencies`.

**Stand beim Beschluss:** 218 Dateien JavaScript, 18 TypeScript.

```txt
quell (Produktcode)   89
pruefungen/lauf       79
pruefungen (sonst)    32
server                12
Wurzel                 4
functions              1
oeffentlich            1
```

**Was das für die nächsten Phasen heisst:** die Zahl 218 ist ab jetzt die
Fortschrittsanzeige. Jede migrierte Datei ist eine Zeile weniger in
`js-bestand.json`.

**Warum** — sie sind klein, DOM-frei und einzeln testbar. Jede migrierte
Datei nimmt einen Eintrag aus der `any`-Liste in `src/global.d.ts`.

**Fertig wenn** je Datei: englischer Name · Verhalten unverändert ·
`npm run bauen:ts` erzeugt das `.js` · `index.html` und `sw.js` nachgezogen ·
alle Läufe grün.

**Achtung** — `Saeubern` gehört zuletzt und ist der einzige der vier, an dem
Sicherheitsverhalten hängt. Aufrufer **zählen**; bei zu vielen bleibt der
öffentliche Name vorerst, und die XSS-Prüfungen laufen vor und nach dem
Umzug.

**Tests** — `npm run typecheck` · `npm run bauen:ts` · `test105` · `test87` ·
`node bauen.mts`

**Priorität** — hoch.

---

## Phase 7a · Der Tabellenkern ohne Oberfläche · **erledigt**

`src/core/spreadsheet/address.ts` und `engine.ts` → `quell/core/spreadsheet/`.
Geprüft von `test110.mts` — **68 Prüfungen in zwei Sekunden, ohne Browser.**

**Die Entscheidung, die alles andere trägt: es gibt keine zweite
Formelmaschine.** Eine Zellformel wird in die Sprache übersetzt, die
`laufzeit.js` seit jeher spricht:

```txt
=SUMME(A1:A3)   →   SUMME(prop("A1"), prop("A2"), prop("A3"))
=A1*2           →   prop("A1")*2
```

`prop()` ist der Zugriff auf eine Spalte einer Datenbankzeile; hier ist es
der Zugriff auf eine Zelle. Dieselbe Maschine, ein anderer Nachschlager. Die
Maschine zu erweitern hätte 158 Funktionen durch neuen Code laufen lassen —
die Sorte Änderung, deren Schaden man Wochen später sieht. Übersetzen kostet
dreissig Zeilen und kann nichts kaputtmachen, was es schon gibt.

**Was der Kern kann:** Adressen (`A1` ↔ Zeile/Spalte, auch `AA`, `ZZ`, `AAA`),
Bereiche in beide Richtungen (`C3:A1` = `A1:C3`), Zellen setzen und lesen,
deutsches Komma als Zahl, Abhängigkeitsgraph in beide Richtungen,
Neuberechnung in der richtigen Reihenfolge, **Zirkelbezüge mit Namen** —
nicht „irgendwo ist einer", sondern welche Zellen.

**Drei Fehler beim Bauen, alle drei vom Lauf gefunden:**

- Der Übersetzer lief dreimal über die Formel und traf im dritten Durchgang
  das `A1` **im Ergebnis des zweiten**: aus `prop("A1")` wurde
  `prop("prop("A1")")`. Jetzt ein einziger Ausdruck mit drei Zweigen — was
  ein Zweig zurückgibt, wird nicht noch einmal angesehen.
- Der Platzhalter für Zeichenketten sah selbst wie eine Zelladresse aus
  (`TXT0` — drei Buchstaben, eine Ziffer) und wurde mitersetzt. Mit dem
  einen Durchgang braucht es gar keinen Platzhalter mehr.
- **Zwei rohe Steuerzeichen** hatten sich in meine Quelle geschlichen. In der
  Einzeldatei hätten sie den ganzen Skriptblock mitgerissen — genau der
  Fehler, für den `test87` Abschnitt 1 existiert.

**Und eine ehrliche Lücke, benannt statt vorgetäuscht:** `#DIV/0!` und
`#ZAHL!` gibt es noch nicht. Die Laufzeit rechnet abwehrend (`1/0 → 0`), sie
*meldet* nichts, also kann der Kern nichts weiterreichen. Dafür bräuchte
`laufzeit.js` einen `FormulaErrorMode` — der Typ steht schon da, der Schritt
ist eigen. Ein halber Fehlerwert wäre schlimmer als keiner: er sähe aus wie
Excel und wäre es an der nächsten Zelle nicht mehr.

---

## Phase 7 · Spreadsheet-MVP

**Der Stand ist besser als erwartet:** alle elf Funktionen, die für den
ersten Wurf vorgesehen waren, rechnen bereits —
`SUMME` `MITTELWERT` `MIN` `MAX` `ANZAHL` `WENN` `UND` `ODER` `HEUTE`
`JETZT` `TEXT`. Es fehlt der **Block**, nicht die Rechenkraft.

### ~~7a — Der Spreadsheet-Block~~ · **erledigt**

**Ziel** — ein Block mit einem echten Zellraster.

**Fertig wenn** — ~~Block im Register~~ · ~~kleine Tabelle anzeigen~~ ·
~~Zellen bearbeiten~~ · ~~`A1`-Bezüge~~ · ~~Bereiche `A1:C10`~~ ·
~~automatische Neuberechnung~~ · ~~Zirkelbezüge erkennen und melden~~ ·
~~Fehlerwerte anzeigen~~

**Und darüber hinaus, weil ein Tabellenblock ohne sie keiner ist:** Zeilen und
Spalten einfügen und löschen mit nachgezogenen Bezügen · Ausfüllen über den
Anfasser · Sortieren · Spaltenbreiten · Ausgabe als `.xlsx` und CSV ·
Bedienung mit der Tastatur.

**Wo es steht** — `src/core/spreadsheet/{address,engine}.ts` (rechnet, kennt
keinen Bildschirm) · `src/bereiche/spreadsheet/ansicht.ts` (zeichnet, rechnet
nicht) · `quell/schale/stil/tabelle.css` · `DESIGN-TABELLE.md`.

**Was es hält** — `test110` (Kern ohne Browser, 111 Punkte) · `test111`
(Browser, 60 Punkte: Neustart, Speichern, Tastatur, hell und dunkel gemessen,
390 px gemessen).

**Was bewusst offen blieb** — mehrere Blätter je Block · Diagramme ·
`#DIV/0!` und `#ZAHL!` · Ziehauswahl am Telefon. Die Gründe stehen in
`ENTSCHEIDUNGEN.md` E29.

**Warum es ein eigener Block ist** — Excel und Redions Datenbanken sind zwei
verschiedene Werkzeuge: dort die Zelle, hier die Zeile als Seite. Ein
Spreadsheet-Block ist ein Block wie jeder andere und passt ohne Sonderfall in
Editor, Sicherung und `.redion`.

**Vorher zu entscheiden** — Fehlerwerte. Ohne sie kann der Block keine
anzeigen; mit ihnen ändert sich das Ergebnis bestehender Formelspalten.
Siehe `ENTSCHEIDUNGEN.md` E24, Regel 3.

**Priorität** — hoch, nach Phase 5a.

### ~~7b — Spreadsheet-Ansicht für Datenbanken~~ · **erledigt**

Als eigene Ansichtsart `raster` (🧮 „Raster") neben Tabelle, Board und den
übrigen. Dieselben Daten, die Bedienung eines Tabellenprogramms:

Pfeiltasten · Umschalt+Pfeil für Bereiche · Tab und Enter · Tippen fängt
sofort an · Entf leert einen ganzen Bereich · Strg+A · Spaltenbreiten zum
Ziehen · Summe und Anzahl in der Fusszeile.

**Und das Eigentliche:** Kopieren und Einfügen als Tabulatortext, also mit
Excel in **beide** Richtungen — und **Einfügen legt fehlende Zeilen an.** Wer
dreissig Zeilen einfügt und zehn hat, verlöre sonst zwanzig, und zwar
lautlos. Genau hier verliert Notion die Leute, die wirklich Daten haben.

**Zwei Vorsichtsmassnahmen:**

- Einfügen ist eine Massenänderung. Vorher wird nachgezählt gesagt, wie viele
  Zeilen dazukommen, wie viele gefüllte Zellen überschrieben werden und wie
  viele Werte wegfallen, weil die Spalte gerechnet wird.
- Gerechnete Spalten (Formel, Rollup, „erstellt am") sind gesperrt und dabei
  **sichtbar**. Ausblenden wäre schlechter: dann fehlte genau die Spalte,
  wegen der man hinsieht.

**Wo es steht** — `src/bereiche/datenbanken/raster.ts`.
**Was es hält** — `test112` (29 Punkte, darunter der Neustart und 390 px).

---

## Phase 8 · CSV/XLSX Import und Export · ◐ **grösstenteils erledigt**

**Reihenfolge**

- ~~CSV-Vorschau vor dem Übernehmen~~ — im Tabellenblock **und** in den
  Datenbanken. Beide sagen vorher nachgezählt, was passiert; der
  Datenbankimport nennt zusätzlich, wie viele Spalten **neu angelegt**
  werden, und legt sie erst nach der Antwort an.
- ~~XLSX-Export~~ — echte `.xlsx` aus dem Tabellenblock und aus jeder
  Datenbank.
- ~~XLSX-Import~~ — in den Tabellenblock, über `Einlesen.xlsxLesen`.
- ~~Typerkennung beim Import in eine Datenbank~~ — `core/import/spaltentyp.ts`
  erkennt Zahl, Datum, Ja/Nein und Auswahl aus den Werten selbst. Die Regel
  dabei: **lieber Text als falsch.** Eine Spalte wird nur dann eine
  Zahlenspalte, wenn JEDER gefüllte Wert eine Zahl ist — ein einziges
  „k. A." in vierhundert Zeilen macht sie zur Textspalte. Eine Zahlenspalte,
  die einen Wert verschluckt, ist schlimmer als eine Textspalte, die keinen
  verschluckt.
- **Offen:** XLSX direkt in eine Datenbank (heute geht XLSX in den
  Tabellenblock, CSV in beides) · Export mit mehreren Blättern aus einer
  Mappe · ODS.

**~~Fertig wenn~~ — ein Rundlauf mit echten Bytes: exportieren, löschen,
importieren, vergleichen.** Erledigt: `test111` baut eine echte `.xlsx`
— ZIP, CRC32, die vier Beipackzettel —, nimmt sie wieder auseinander und
vergleicht Zelle für Zelle, mit Semikolon im Feld, Anführungszeichen,
deutschem Komma, Umlaut und leerer Zeile.

**Der Fund dabei:** der bisherige CSV-Zerleger trennt bei Komma UND
Semikolon UND Tabulator gleichzeitig. Aus `Miete;1450,50;Januar` wurden fünf
Felder statt drei, und der Betrag war weg — es sah nicht nach einem Fehler
aus, sondern nach zwei Spalten mehr. `core/spreadsheet/csv.ts` erkennt das
Zeichen jetzt, ausserhalb von Anführungszeichen gezählt.

**Priorität** — der Rest: niedrig.

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

**~~G3 — Sync-Konflikte.~~** ◐ **grösstenteils erledigt** — `test113`,
52 Punkte, ohne Browser.

Geprüft: ~~derselbe Block geändert~~ · ~~Konflikt wird sichtbar~~ ·
~~keine Daten verloren~~ (sieben Fälle, jeder gegen dieselbe Frage: *steht
am Ende die eine oder die andere Fassung da — oder ist ein Konflikt
gemeldet?*) · ~~die Ausgangsschlange~~.

**Der Fund dabei, und er ist der Grund für diese Reihenfolge:** `zuSchicken`
filtert mit `edited <= marke`, und die Marke wandert nach jeder Runde auf den
Zeitstempel des letzten gesendeten Satzes. Lägen zwei Sätze in **derselben
Millisekunde** und fiele der Schnitt der Runde zwischen sie, wäre der zweite
ab sofort ausgeschlossen — für immer. Er stünde auf dem Gerät und käme nie in
der Wolke an. Kein Fehler, keine Meldung.

Von Hand passiert das nie; beim Einfügen aus Excel, beim CSV-Import und bei
Vorlagen entstehen Sätze in Reihe. Eine Runde zerschneidet jetzt keine
Millisekunde mehr.

**Noch offen:** „Änderung offline" und „Anhänge bleiben verbunden" brauchen
einen Lauf gegen einen echten Server — und Anhänge gehen heute gar nicht mit
(das ist G2). `test113` hält beides ausdrücklich fest, damit niemand seine
Bilder für abgeglichen hält.

**Priorität** — der Rest von G3 **vor** echtem Cloud-Sync.

---

## Phase 10 · Mobile und iPhone · ◐ **begonnen**

Fokus: iPhone 13 Pro Max (428 px), Safari.

**Gemessen statt geschätzt** — bei 428 px, mit `bilder.mts` und einer
Messung im Browser. Was dabei herauskam:

| | Befund |
|---|---|
| ✓ | Die letzte Zeile jeder Seite ist erreichbar — `#scroll` hat 86 px Platz, die Leiste ist 57 px hoch. Das hatte ich zuerst für kaputt gehalten und **am falschen Element gemessen**. |
| ✓ | Die Knöpfe der unteren Leiste sind 83 × 48 px. |
| ✓ | Die Tabelle und das Raster rollen waagerecht, statt zu quetschen; `env(safe-area-inset-bottom)` ist in Gebrauch; die ganze App rollt **nicht** seitlich. |
| ✗→✓ | Die Zeilen im aufgeklappten Menü waren 33 px hoch. Jetzt 48 — das ist die Liste, mit der man durch die ganze App navigiert. |
| ✗→✓ | Die Symbolknöpfe der Kopfleiste waren 28 px hoch. Jetzt 44. |

**Und ein Fehler, den ich dabei selbst gemacht habe:** Der erste Versuch gab
den Kopfleisten-Knöpfen auch `min-width: 44px`. Acht Knöpfe zu 44 px sind
352 von 390 Pixeln — der **Seitentitel war weg**. Die Skill sagt beides
(„56 px hoch, mit kurzem Seitentitel" und „keine sieben Buttons im Header"),
und eine Kopfleiste ohne Titel ist schlimmer als eine mit schmaleren
Knöpfen: man weiss dann nicht mehr, wo man ist. In einer waagerechten Leiste
ist die Höhe die wichtigere Hälfte.

**Noch offen** — die Blocksteuerung im Editor (`⋯` und `+`) ist mit 22 × 21
px zu klein für einen Finger · zwei Symbolknöpfe in der Seitenleiste ·
Kopfleiste 44 statt 56 px · mobiler Dateiimport · Offline-Hinweise.

**Priorität** — mittel.

---

## Dauerhafte Regeln

**Nach jeder Codeänderung**

```
npm run pruefen -- --schnell
node bauen.mts
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
