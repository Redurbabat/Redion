# TypeScript-Migration

Wie Redion von JavaScript nach TypeScript kommt, ohne unterwegs Daten zu
verlieren und ohne die Nutzung per Doppelklick aufzugeben.

Grundlage: **E6** in `ENTSCHEIDUNGEN.md` (Redion wird vollständig
TypeScript) und **§52** in `CLAUDE.md` (die Phasen TS-0 bis TS-10).

---

## Die eine Regel

> Die App muss nach **jedem** einzelnen Schritt weiterhin per Doppelklick auf
> `index.html` starten — ohne Bauschritt, ohne Server, ohne `npm install`.

Alles Weitere folgt daraus. Wer diese Regel bricht, hat nicht eine Migration
gemacht, sondern eine andere App gebaut.

---

## Was das für die Werkzeuge heisst

TypeScript ist hier **ein Prüflauf, kein Compiler**.

```
npm run typecheck     →  tsc --noEmit
```

`noEmit` steht in `tsconfig.json` bewusst auf `true`. Es entsteht kein
JavaScript, das ausgeliefert werden müsste — und damit gibt es auch keinen
Bauschritt, den jemand vergessen kann. Der Typecheck sagt, ob etwas nicht
zusammenpasst; er ändert nichts.

**Was das kostet:** solange `noEmit` gilt, kann `.ts` nicht direkt in
`index.html` geladen werden. TypeScript beschreibt in dieser Phase also
Daten, es führt sie nicht aus. Das ist eine bewusste Reihenfolge, keine
Auslassung: erst muss beschrieben sein, was da ist, bevor es umzieht.

**Ab TS-3 gibt es einen zweiten Weg — entschieden am 4. August 2026.**

Sobald ausführbarer `.ts`-Code umzieht, muss daraus `.js` werden. Gewählt:
**das erzeugte JavaScript wird mitversioniert.**

```
src/core/helpers/ids.ts           die Quelle, wird bearbeitet
        ↓  npm run bauen:ts       (tsc -p tsconfig.bauen.json)
quell/core/helpers/ids.js         wird geladen, wird mitcommittet
```

`tsconfig.bauen.json` bildet `rootDir: src` auf `outDir: quell` ab. Die
ausgegebene Datei landet also unter demselben Pfad wie ihre Quelle, nur unter
`quell/` statt `src/`. Wird eine Datei bei ihrer Migration umbenannt — wie
hier `kennungen.ts` → `ids.ts` (`ENTSCHEIDUNGEN.md` E27) —, müssen
`index.html` und `sw.js` den neuen Pfad nennen. `test87` erzwingt das: es
prüft, dass jede in `index.html` geladene Datei auch im `sw.js` steht.
`bauen.mts` liest `index.html` und zieht von selbst nach.

Ein Bauschritt für den Entwickler, keiner für den Nutzer. Die App startet
weiterhin per Doppelklick.

**`module: none`, also kein `import`.** Die App lädt Skripte über
`<script src>`. Eine `.ts`-Datei mit `import`/`export` würde als ES-Modul
ausgegeben und liefe von `file://` gar nicht. `none` verbietet beides schon
beim Bauen — der Fehler kommt sofort und nicht erst im Browser.

Die Folge: migrierte Dateien holen ihre Typen nicht per `import`, sondern
aus **`src/global.d.ts`**. Dort stehen auch die Module aus `quell/`, die
noch nicht umgezogen sind — als `any`, weil über sie wirklich nichts bekannt
ist. Diese Liste soll schrumpfen; jeder Eintrag, der verschwindet, ist eine
Datei, die umgezogen ist.

**Der Preis, und wie er bezahlt wird.** Zwei Dateien mit demselben Inhalt
driften auseinander: wer das `.js` bearbeitet — weil es das ist, was im
Browser läuft, weil die Fehlermeldung dorthin zeigt —, verliert seine
Änderung beim nächsten Bauen. Wortlos.

Dagegen zwei Dinge:

1. **`pruefungen/lauf/test105.mjs`** gibt frisch nach `/tmp` aus und
   vergleicht Zeichen für Zeichen mit dem, was im Repository liegt. Läuft
   auch in der CI, im schnellen Auftrag.
2. Jede migrierte Datei trägt **ganz oben** „ERZEUGT — NICHT VON HAND
   ÄNDERN" samt Pfad zur Quelle. Der Prüflauf kontrolliert, dass die Warnung
   da ist.

Dieselbe Falle stand schon einmal in diesem Projekt: `redion-einzeldatei.html`
wurde aus den Quellen gebaut, jemand änderte die Quellen und zog die
Einzeldatei nicht nach — und in der weitergegebenen Datei fehlte die
komplette HTML-Säuberung. Niemandem fiel es auf.

**Vite** ist erlaubt (CLAUDE.md §52.5) und seit dem 27. September 2026
eingeführt — aber nicht für diese Migration: sie bleibt beim klassischen
`tsc -p tsconfig.bauen.json` mit `module: none`. Vite baut allein die
**React-Inseln** (`bauen-inseln.mts`, `src/islands/*.tsx` →
`quell/fremd/react/react.js` und `quell/islands/islands.js`). Die eigene,
geschriebene Entscheidung dafür ist **E699**; React ist also weiterhin keine
FOLGE dieser Migration (E7), sondern ein eigener Beschluss.

**Ein Hinweis für später, gemessen beim Bau von E699:** TypeScript 6.0 meldet
`module: none` und `moduleResolution: classic` als veraltet (TS5107), und
TypeScript 7.0 lehnt beide ab (TS6046, TS5108). Dieses Projekt hängt deshalb
an TypeScript 5.x (`^5.9.3`). Wer auf 6 oder 7 will, braucht für den
klassischen Bau einen anderen Weg — der Bündler ist seit E699 da.

---

## Wo der neue Code liegt

```txt
src/
├─ global.d.ts        Typen für migrierte Dateien (kein `import` erlaubt)
├─ core/
│  ├─ types/          die zentralen Typen — werden nie ausgegeben
│  ├─ helpers/        migrierter Code → wird nach quell/ ausgegeben
│  │  ├─ ids.ts
│  │  ├─ date.ts
│  │  ├─ objects.ts
│  │  ├─ bytes.ts
│  │  ├─ throttle.ts
│  │  └─ reporter.ts
│  └─ security/
│     └─ sanitize.ts
├─ registry/
├─ areas/
└─ app/

quell/                der bestehende Code. Bleibt unangetastet, bis eine
                      Phase ihn abholt — und ist zugleich das Ziel für das
                      erzeugte JavaScript.
```

**Ein neuer Ordner unter `src/core/` braucht zwei Einträge**, sonst entsteht
still ein Loch:

```txt
tsconfig.bauen.json   "include": [… "src/core/<neu>/**/*.ts"]
```

Fehlt er dort, wird nichts erzeugt — und das alte `.js` läuft weiter, während
die Quelle davonzieht. `pruefungen/lauf/test105.mjs` sucht deshalb
ausführbaren TypeScript-Code unter ganz `src/core/` (ohne `types/`) und meldet
jeden Ordner, der im Bauplan fehlt. Es ist die Erinnerung an den Eintrag, den
man beim zweiten Ordner vergisst.

```txt
```

**Zwei Sorten `.ts` unter `src/`, und der Unterschied zählt:**

| | wird geprüft | wird ausgegeben | darf `import` |
|---|---|---|---|
| `src/core/types/` | ✅ | ✗ | ✅ |
| `src/core/helpers/…` | ✅ | ✅ → `quell/` | ✗ |

`tsconfig.json` prüft alles unter `src/`. `tsconfig.bauen.json` gibt nur die
Ordner mit ausführbarem Code aus — zur Zeit `src/core/helpers/**`.

**Achtung beim Erweitern:** `include` darf nicht einfach auf `src/core/**`
gehen. Dann lägen die Typdateien mit im Bauschritt und schrieben leere
`.js`-Dateien nach `quell/`. Entweder Ordner einzeln aufzählen — so wie
jetzt — oder `src/core/types/**` ausdrücklich ausschliessen.

`quell/` (soweit nicht erzeugt), `server/`, `pruefungen/` und `bauen.mts`
sind vom Typecheck ausgeschlossen. Das ist kein Aufschieben:
gewöhnliches JavaScript ohne Module mitzuprüfen ergäbe hunderte Meldungen
über Dinge, die absichtlich so sind — und eine Liste, die niemand liest,
findet nichts.

---

## Die Phasen

Die Nummern sind die aus `CLAUDE.md` §52.16. Der Stand hier ist der wahre.

| Phase | Was | Stand |
|---|---|---|
| **TS-0** | Analyse: Struktur lesen, grosse Dateien finden, Import/Export/Backup finden, Testlage prüfen | ✅ erledigt |
| **TS-1** | Werkzeuge: `typescript`, `tsconfig.json`, `npm run typecheck` | ✅ erledigt |
| **TS-2** | Zentrale Typen unter `src/core/types/` | ✅ erledigt |
| **TS-3** | Kleine Kernhelfer: Kennungen, Datum, Objekte, Bytes, Bremse, Melder, Säubern | ✅ erledigt — sieben Dateien |
| **TS-4** | `.redion`, ZIP, Dateien, Export/Import — mit Tests | offen |
| **TS-5** | Die IndexedDB-Schicht. Sehr vorsichtig. | offen |
| **TS-6** | Die Register | offen |
| **TS-7** | Datenbanken und Formeln: Zerleger, Parser, Laufzeit, Filter, Sortierung, Rollups | offen |
| **TS-8** | Editor — erst aufteilen, dann migrieren | offen |
| **TS-9** | Server: Cloudflare, D1, R2, Sitzungen, Abgleich, Rechte | offen |
| **TS-10** | Die alten `.js`-Dateien entfernen | offen |

### Zwei Wege, und beide ohne Bauschritt

`ENTSCHEIDUNGEN.md` E28 hat die Regel geschärft: **es entsteht kein neues
JavaScript.** Möglich ist das, weil es zwei Wege gibt statt einem.

| Wohin der Code läuft | Wie er dorthin kommt |
|---|---|
| in den **Browser** | `src/…/x.ts` → `npm run bauen:ts` → `quell/…/x.js` |
| in **Node** (Prüfläufe, Server, Bauen) | `x.mts`, direkt mit `node x.mts` |

Der zweite Weg ist neu und kostet nichts: Node entfernt die Typen seit 22.18
von selbst. Der Preis sind **löschbare** Typen — kein `enum`, kein
`namespace`, keine Parameter-Felder. `pruefungen/lauf/test109.mts` ist der
erste Lauf dieser Art und prüft die Regel gleich mit.

**Der Fortschritt hat jetzt eine Anzeige.** `pruefungen/js-bestand.json`
führt jede von Hand geschriebene `.js`; das Verzeichnis darf nur schrumpfen.
Beim Beschluss: 218 Dateien JavaScript, 18 TypeScript.

### Warum diese Reihenfolge

Sie läuft von aussen nach innen: erst das, was nichts kaputt machen kann
(Typen beschreiben nur), dann kleine Helfer ohne DOM, dann die Formate,
dann die Ablage, dann die Oberfläche.

Der Editor kommt spät und der Papierkorb der Ablage noch später, weil beide
Stellen sind, an denen ein Fehler nicht auffällt, sondern still Daten
kostet. Die Priorität aus `CLAUDE.md` §46 gilt auch hier: **1 Daten sicher**,
und erst danach alles andere.

`TS-10` ist keine Aufräumarbeit, sondern der Beweis. Es darf erst laufen,
wenn alle Prüfläufe grün sind, die Einzeldatei funktioniert und Import und
Export mit echten Bytes nachgewiesen sind.

---

## Was in `src/core/types/` steht

| Datei | Inhalt |
|---|---|
| `id.ts` | `ID`, `ISODateTime`, die Kennungstypen, `Result<T>` |
| `block.ts` | `RedionBlock`, `RedionRow`, `RedionPage`, `RedionVersion` |
| `database.ts` | `RedionDatabase`, `Schema`, `Column`, `RedionView`, Filter, Sortierung |
| `file.ts` | `RedionFile`, `FileChunk`, `UploadState` |
| `backup.ts` | `RedionPackageData`, `RedionPackageManifest`, `RedionFileMap`, `RedionPackage`, `ImportMode`, `ImportReport` |
| `storage.ts` | `STORES` (alle neun), `StorageLocation`, `StorageInfo` |
| `index.ts` | eine Tür für alles davon |

Die Namen sind englisch, seit `ENTSCHEIDUNGEN.md` **E27** die Code-Sprache
festlegt: Deutsch für Menschen, Englisch für Code. Die **Feldnamen** darin
sind es nicht — sie heissen so, wie sie in IndexedDB gespeichert sind
(`created`, `edited`, `erstelltVon`, `alive`, `groesse`, `enthaelt`). Ein
Feld umzubenennen wäre keine Übersetzung, sondern eine Datenmigration.

### Diese Typen sind gemessen, nicht erfunden

Jedes Feld ist aus dem laufenden Code abgelesen — `addBlock` in
`quell/kern/ablage/indexdb.js:255`, `versionSpeichern` ebenda,
`quell/bereiche/dateien/ablage.js` für die Anhänge,
`quell/register/ansichten.js` für die zwölf Ansichtsarten.

Das ist `ENTSCHEIDUNGEN.md` **E21** angewandt: Kataloge werden geladen und
befragt, nicht geraten. Der teuerste wiederkehrende Fehler dieses Projekts
war, eine Schnittstelle aus dem Gedächtnis zu schreiben statt sie
nachzusehen.

Wer hier ein Feld ändert, ändert eine Behauptung über Daten, die auf den
Geräten von Nutzern liegen. Also: erst nachsehen, dann tippen.

---

## Die zwei Regeln beim Umziehen einer Datei

**1. Eine Datei pro Schritt, mit grünem Prüflauf davor und danach.**

```
npm run bauen:ts                  falls die Datei ausführbaren Code enthält
npm run typecheck
npm run pruefen -- --schnell
node bauen.mts
```

Alle vier. `bauen.mts` ist nicht optional — die Einzeldatei ist ein
Auslieferungsweg, und sie bricht anders als die App.

**2. `any` ist erlaubt, aber nur an der Grenze.**

Wo `.ts`-Code auf `quell/`-JavaScript trifft, ist `any` das ehrliche Wort:
dort ist wirklich nichts bekannt. Innerhalb einer migrierten Datei ist es
eine Ausrede. Die Strenge in `tsconfig.json` — `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `useUnknownInCatchVariables` — steht dort,
damit die Fälle auffallen, in denen mit `undefined` weitergerechnet wird.

---

## Was diese Migration nicht ist

- **Kein Alles-auf-einmal.** Steht so in der Funktionsplanung unter
  *besser nicht*. Eine Umstellung in einem Zug hätte keinen Zeitpunkt, an
  dem man sie noch prüfen kann.
- **Keine Umschreibung.** Eine migrierte Datei tut danach dasselbe wie
  vorher. Wenn dabei ein Fehler auffällt, wird er als eigener Schritt
  behoben, nicht nebenbei — sonst weiss hinterher niemand, ob der Umzug
  oder die Reparatur etwas kaputt gemacht hat.
- **Kein Anlass für neue Abhängigkeiten.** Grosse Pakete kommen nur nach
  Prüfung herein (`ENTSCHEIDUNGEN.md` E26). `typescript` ist eine
  Entwicklungsabhängigkeit; ausgeliefert wird davon nichts.
