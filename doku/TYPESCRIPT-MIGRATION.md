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

**Wann sich das ändern darf:** ab Phase TS-3, wenn erstmals ausführbarer
`.ts`-Code umzieht, braucht es einen Weg von `.ts` nach `.js`. Dafür gibt es
zwei Möglichkeiten, und beide sind zulässig:

| Weg | Was er bedeutet |
|---|---|
| **Erzeugtes JS wird mitversioniert** | `tsc` schreibt `.js` neben `.ts`, beides liegt im Repository, `index.html` lädt wie bisher. Kein Bauschritt für den Nutzer, ein Bauschritt für den Entwickler. |
| **`bauen.js` erweitern** | Der bestehende Bündler ruft `tsc` mit auf. Nur nötig, wenn die Einzeldatei betroffen ist. |

Was **nicht** zulässig ist: ein Zustand, in dem `index.html` ohne
vorherigen `npm run build` nicht mehr startet. Die Entscheidung zwischen den
zwei Wegen fällt zu Beginn von TS-3 und wird dann hier eingetragen — nicht
vorher geraten.

**Vite** ist erlaubt (CLAUDE.md §52.4), aber bis heute nicht eingeführt und
für die Phasen TS-0 bis TS-2 auch nicht nötig. **React** ist ausdrücklich
keine Folge dieser Migration (`ENTSCHEIDUNGEN.md` E7): TypeScript ja, React
nur nach einer eigenen, geschriebenen Entscheidung.

---

## Wo der neue Code liegt

```txt
src/
├─ core/
│  └─ types/          ← hier steht heute alles
├─ registry/
├─ areas/
├─ app/
└─ tests/

quell/                ← der bestehende Code. Bleibt unangetastet,
                        bis eine Phase ihn ausdrücklich abholt.
```

`tsconfig.json` prüft **nur** `src/**/*.ts`. `quell/`, `server/`,
`pruefungen/` und `bauen.js` sind ausgeschlossen. Das ist kein Aufschieben:
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
| **TS-3** | Kleine Kernhelfer: Kennungen, Datum, Objekte, Entprellen, Fehler, Säubern | offen |
| **TS-4** | `.redion`, ZIP, Dateien, Export/Import — mit Tests | offen |
| **TS-5** | Die IndexedDB-Schicht. Sehr vorsichtig. | offen |
| **TS-6** | Die Register | offen |
| **TS-7** | Datenbanken und Formeln: Zerleger, Parser, Laufzeit, Filter, Sortierung, Rollups | offen |
| **TS-8** | Editor — erst aufteilen, dann migrieren | offen |
| **TS-9** | Server: Cloudflare, D1, R2, Sitzungen, Abgleich, Rechte | offen |
| **TS-10** | Die alten `.js`-Dateien entfernen | offen |

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
| `basis.ts` | `ID`, `ISODateTime`, die Kennungstypen, `Ergebnis<T>` |
| `block.ts` | `Block`, `Zeile`, `Seite`, `Fassung` |
| `datenbank.ts` | `Sammlung`, `Schema`, `Spalte`, `Ansicht`, Filter, Sortierung |
| `datei.ts` | `Datei`, `Stueck`, `Uploadzustand` |
| `sicherung.ts` | `Sicherung`, `Sicherungskopf`, `Einspielart`, `Einspielbericht` |
| `ablage.ts` | `FAECHER` (alle neun), `Speicherort`, `Speicherlage` |
| `index.ts` | eine Tür für alles davon |

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
npm run typecheck
npm run pruefen -- --schnell
node bauen.js
```

Alle drei. `bauen.js` ist nicht optional — die Einzeldatei ist ein
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
