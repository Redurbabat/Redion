# Ein Modul nach TypeScript umziehen — das Rezept

Acht Schritte, an einer echten Datei durchgeführt und geprüft
(`quell/schale/ueberlagerung/ui.js` → `src/schale/ueberlagerung/ui.ts`).

---

## Die Zahlen, um die es geht

Gemessen, nicht geschätzt:

```txt
218 Dateien        76 550 Zeilen JavaScript
  1 Typfehler je 4,4 Zeilen   (Pilot: 64 Fehler auf 279 Zeilen)
────────────────────────────────────────────
rund 17 000 Fehler insgesamt
```

Und ihre Verteilung im Pilot:

| Anteil | Fehlerart | Aufwand |
|--:|---|---|
| 34 % | `Cannot find name X` — ein globaler Name | **einmalig, an einer Stelle** |
| 22 % | `is of type 'unknown'` | je Stelle nachdenken |
| 25 % | `Parameter implicitly has an 'any' type` | je Stelle entscheiden |
| 19 % | Indexzugriff, Rest | je Stelle |

**Das erste Drittel ist erledigt.** `src/global.d.ts` erklärt jetzt alle
64 übrigen Module. Das kostet jede einzelne der 217 verbleibenden
Migrationen weniger — und zwar bevor sie beginnt.

---

## Das Werkzeug: `umzug.mts`

Fünf der acht Schritte brauchen kein Urteil — 1, 2, 4, 6, 7. Die macht
`umzug.mts`:

```sh
node umzug.mts quell/kern/zustand/verlauf.js quell/register/module.js
node umzug.mts --stand        # was noch offen ist, nach Ordner
```

Drei Schritte bleiben Handarbeit, und zwar mit Absicht: **3** (der Ordner in
`tsconfig.bauen.json`), **5** (die Typen) und **8** (bauen und prüfen). Wer
Schritt 5 mechanisiert, schreibt `any` — und dann war der Umzug umsonst.

Die Schritte stehen trotzdem alle einzeln unten. Man muss wissen, was ein
Werkzeug tut, sonst merkt man nicht, wenn es etwas nicht tut.

## Das zweite Werkzeug: `typenhilfe.mts`

```sh
node typenhilfe.mts                 was es täte, ohne es zu tun
node typenhilfe.mts --schreiben     und jetzt wirklich
```

`TS7006: Parameter 'x' implicitly has an 'any' type` heisst etwas sehr
Genaues: **TypeScript hatte hier keinen Typ anzubieten.** Wo ein Rückruf
einen Zusammenhang hat — `[1,2,3].map(n => …)` —, wird `n` von selbst zur
Zahl und die Meldung kommt gar nicht.

Sie kommt dort, wo der Empfänger `any` ist, weil er aus `quell/` stammt:
`Store.cache.blocks`, `Werkzeuge.erinnerungen()`. An solchen Stellen `: any`
hinzuschreiben verliert **nichts** — es schreibt hin, was ohnehin gilt.

Das Werkzeug fasst deshalb **nur Rückrufe** an (`.map(`, `.forEach(`,
`.filter(`, `addEventListener(` und Verwandte). Ein benannter Parameter —
`const oeffne = (id) => …` — bleibt liegen und wird gemeldet. Dort IST etwas
bekannt, und `any` wäre der Verzicht auf genau das, wofür der Umzug
stattfindet. Gemessen an einem Stapel von sechs Dateien: **36 Rückrufe
maschinell, 68 benannte Parameter von Hand** — gut ein Drittel gespart, und
die zwei Drittel, die zählen, bleiben Handarbeit.

> **Die Falle, die mich siebenundzwanzigmal erwischt hat.** Ein einzelner
> Parameter ohne Klammern nimmt keine Angabe an: aus `filter(r => …)` wird
> `filter(r: any => …)`, und das ist kein TypeScript, sondern ein
> Syntaxfehler, der die ganze Datei unlesbar macht. Das Werkzeug erkennt den
> Fall jetzt daran, dass gleich hinter dem Namen `=>` steht, und klammert.

---

## Der Weg, Schritt für Schritt

### 1 · Verschieben, und zwar pfadgleich

```sh
git mv quell/schale/ueberlagerung/ui.js src/schale/ueberlagerung/ui.ts
```

**Der Pfad unter `src/` muss dem unter `quell/` entsprechen.** `tsconfig.bauen.json`
bildet `src/` auf `quell/` ab; wer `src/schale/ui.ts` schreibt, bekommt
`quell/schale/ui.js` — und `index.html` sucht weiter an der alten Stelle und
findet nichts. Beim Pilot ist genau das passiert.

### 2 · Den Warnhinweis in den Kopf

```txt
ERZEUGT — NICHT VON HAND ÄNDERN.
Die Quelle ist `src/…/x.ts`. `npm run bauen:ts` schreibt daraus `quell/…/x.js`.
```

In die **ersten 1200 Zeichen** — `test105` prüft das, und zwar aus einem
Grund: weiter unten liest ihn niemand mehr.

**Seit E715 (3. Oktober 2026) als eigene erste Zeile.** `tsconfig.bauen.json`
nimmt alle Kommentare aus dem erzeugten `.js` (`removeComments`) — bis auf
die, die mit `/*!` beginnen. Ein Hinweis im gewöhnlichen Kopfkommentar
käme also nicht mehr an. Jede Quelle beginnt deshalb mit

```txt
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/…/x.ts (npm run bauen:ts). */
```

und `test105` §3 meldet jede erzeugte Datei, der sie fehlt oder deren
Zeile eine andere Quelle nennt. `umzug.mts` setzt sie selbst, mit dem
richtigen Pfad.

### 3 · Den Ordner in `tsconfig.bauen.json` eintragen

Die `include`-Liste ist bewusst eine Aufzählung und kein `src/**`.
`test105` meldet jeden Ordner, der fehlt — sonst entstünde die stille
Fassung des Fehlers: eine Datei, die niemand baut.

### 4 · `window.X = X` → `(window as any).X = X`

### 5 · Die Typfehler beheben

Die Reihenfolge, die am schnellsten trägt:

1. **Erst die Rückgabewerte**, dann die Argumente. Ein getippter Rückgabewert
   erklärt an jeder Aufrufstelle etwas mit.
2. **`any` nur an der Grenze** zum alten Code — CLAUDE.md §52. Innerhalb der
   migrierten Datei ist es der Verzicht auf genau das, wofür der Umzug
   stattfindet.
3. **Nichts erfinden.** Wer nicht weiss, was ein Feld enthält, sieht nach.
   `test108` steht als Mahnung da: dort war ein Feld als Pflicht getippt, und
   die Messung zeigte 180 von 262 Einträgen ohne es.

### 6 · Aus `src/global.d.ts` streichen

Das Modul erklärt sich jetzt selbst. Bleibt der Eintrag stehen, meldet
TypeScript `Cannot redeclare block-scoped variable`.

### 7 · Aus `pruefungen/js-bestand.json` streichen

```txt
218  ->  217
```

Das Verzeichnis darf **nur schrumpfen**. Es ist die Fortschrittsanzeige.

### 8 · Bauen und prüfen

```sh
npm run bauen:ts
node bauen.mts
node pruefungen/lauf/test87.mjs     # Quelltextregeln
node pruefungen/lauf/test105.mjs    # erzeugtes JavaScript passt zur Quelle
node pruefungen/lauf/test109.mts    # das Verzeichnis stimmt
npm run typecheck                   # src/ und alle .mts, streng
npm run pruefen -- --schnell        # der schnelle Lauf (ohne Browser, E745)
```

> **Nicht bauen, während ein voller Lauf läuft.** Der Lauf lädt `index.html`
> und mit ihr sechzig Dateien aus `quell/`. Wer mittendrin `npm run bauen:ts`
> ruft, tauscht ihm den Boden unter den Füssen aus: in dieser Sitzung wurden
> `test33` und `test34` genau so rot — und einzeln nachgefahren beide grün,
> 76/76. Zwei rote Läufe, die nichts bedeuteten, und zwanzig Minuten, um das
> herauszufinden. Erst der Lauf, dann das Bauen.

---

## Die Reihenfolge, in der umgezogen wird

**Von den Blättern zur Wurzel.** Ein Modul, das nichts anderes ruft, kostet
am wenigsten und bringt seine Typen sofort allen, die es rufen.

Was zuletzt kommt, ist absichtlich zuletzt:

| Datei | Zeilen | warum spät |
|---|--:|---|
| `datenbanken/steuerung.js` | ~9 000 | ruft fast alles |
| `hilfe/wissensseiten.js` | ~4 500 | fast nur Text |
| `editor/ansicht/editor.js` | ~2 800 | hier tut ein Fehler am meisten weh |
| `schale/aufbau/schale.js` | ~2 300 | setzt die App zusammen |

Diese vier sind zusammen 500 KB von 3752 KB — **ein Achtel der Dateien, ein
Fünftel des Codes.**

---

## Was das nicht heisst

**Nicht: die Endung ändern und `any` überall hinschreiben.** Das ergäbe 218
Dateien, die `.ts` heissen und nichts beweisen — und schlimmer: ein falsches
`any` bringt eine echte Meldung zum Schweigen. Dann sähe der Code nach
Typsicherheit aus und wäre keine.

Jeder der neunzehn Fehler dieser Sitzung war von der Sorte, die Typen
verhindern oder finden. Das ist der Gewinn, um den es geht — nicht die
Dateiendung.
