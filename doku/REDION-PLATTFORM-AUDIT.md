# Redion Plattform-Audit — der Bestand vor dem ersten GFX-Schritt

Stand: 25. September 2026
HEAD der Bestandsaufnahme: `a196b65` (Zweig `claude/cool-mccarthy-hjpi1v`)
Auftrag: Redurs Master-Prompt vom 25. September 2026 („REDION PLATFORM AUDIT")

```txt
Prüfläufe                 509      ls pruefungen/lauf/test*.mts | wc -l
TypeScript in src/        156 826  Zeilen — core 13 077 · kern 12 745 · register 11 021 ·
                                   schale 15 327 · bereiche 103 569
<script> in index.html    217
Register                  17       ls src/register/ | wc -l
Bereichs-Querverweise     517 in 125 Paaren   pruefungen/bereiche-bestand.json (_gesetzt)
Entscheidungen            E1 … E680
Lücken                    L1 … L210
```

Jede Zahl in dieser Datei trägt ihr Datum und, wo es einen gibt, ihren
Befehl (§30: „sie wird nicht geschätzt, sie wird gezählt"). Was gemessen
wurde, steht mit der Ausgabe da; was nur gelesen wurde, steht mit Datei und
Zeile da; was weder das eine noch das andere ist, steht als Vermutung da
oder gar nicht.

---

## 0. Warum dieser Audit, und was er nicht ist

Redur will Redion zur Plattform ausbauen, in dieser Reihenfolge:

1. ein gemeinsamer GFX-/Canvas-Kern für Whiteboard, Gedankenkarte, PDF-Ink,
   Präsentation und Schaltplan;
2. ein Plugin-SDK auf den vorhandenen Erweiterungspunkten (kein `eval`,
   Sandbox, Rechte);
3. ein Katalog dafür;
4. ein Redion-CLI auf MCP/API, dazu optional ein SQL-Leseblock, Dateien auf
   Abruf, native Hüllen; CRDT zuletzt; Self-Hosting erst, wenn Cloudflare
   geprüft ist.

**Vor jedem Umbau kommt dieser Audit.** Er beantwortet je System die sieben
Fragen des Auftrags (§25): Dateien · Schnittstellen · was schon gemeinsam
ist · echte Duplikate · Prüfläufe · kleinster nächster Schritt · Daten- und
Kompatibilitätsrisiken.

**Was er nicht ist:** kein Code, kein Umbau, keine neue Schicht. Wo der
Auftrag und `CLAUDE.md` auseinandergehen, gilt `CLAUDE.md` — und an einer
Stelle gehen sie auseinander (Abschnitt 3: L30/E181).

**Die Referenzen.** AFFiNE (`AFFiNE-canary`) und SiYuan (`siyuan-master`)
wurden **nur gelesen**:

```txt
AFFiNE   blocksuite/framework/std: MIT (package.json "license": "MIT");
         das Repository insgesamt: LICENSE mit Abschnitten, packages/backend
         unter eigener Lizenz. Angesehen: blocksuite/framework/std/src/gfx/
         (viewport, grid, layer, selection, tool, model/surface, interactivity)
SiYuan   AGPL-3.0 (LICENSE). Angesehen: kernel/ (Go: api mit 212 Dateien, av,
         sync, mcp, bazaar), app/src/ (protyle, plugin, history, sync)
```

Kein Code, kein Asset, kein Markenzeichen und keine Oberfläche wurde
übernommen. AGPL schliesst eine Übernahme in Redion aus; MIT liesse sie zu,
sie ist aber weder geschehen noch geplant — die beiden dienen als
**Massstab**, was ein GFX-Kern und ein Plugin-System umfassen, nicht als
Vorlage. Die Archive liegen ausserhalb des Verzeichnisses und kommen nicht
hinein (§1, §42 sinngemäss: fremder Quelltext ist kein Redion-Quelltext).

*Nachtrag vom selben Tag:* Redur hat die Regel dazu entschieden (E683,
§57, `FREMDCODE.md`) — fremder Code darf herein, wenn er Redion
verbessert, nichts hinausschickt und Redur vorher gefragt wurde. Für
diesen Audit ändert das nichts: genommen wurde nichts, und vor jeder
Übernahme steht jetzt die Frage.

**Methode.** Elf Leser je System und zwei für die Referenzen, jeder Befund
mit `Datei:Zeile`; je System die ersten zwei gemeldeten Duplikate
gegengeprüft von einem Leser, der sie widerlegen sollte (die übrigen stehen
ungeprüft, aber mit Zitat, in der Karte); dazu zwei eigene Messungen im
laufenden Programm (Abschnitt 2.4), deren Ausgabe hier wörtlich steht.

**Die Karte.** Die Befunde der Leser liegen vollständig in
`doku/karte/karte.json`; `node karte.mts` schreibt daraus `doku/karte/` —
eine Notiz je System, eine je gemeinsamem Kern, eine Übersicht mit Graph
(Redur, 25. September: „erstelle dabei eine obsidein/graphy datei damit du
nicht jedes mal alles daten nue lesen musstest"). Dieser Audit ist die
Auswertung; die Karte ist das Nachschlagewerk. Was hier in einer Zeile
steht, steht dort mit jeder Datei und jedem Prüflauf.

---

## 1. Kurzbefund — zehn Sätze

1. **Redion hat schon einen halben GFX-Kern.** `SheetSpace` (der Blattraum,
   165 Zeilen), `InkGeometry` (1071), `InkShapes` (279), `InkStroke` (493),
   `InkThumbnail` (151) und `Folien` (198) liegen unter `src/core/`. Sie
   werden von der PDF-/Blatt-Schicht benutzt — **und von keinem anderen
   räumlichen Block** (2.2).
2. **Fünf räumliche Systeme, drei eigene Zeigerumrechnungen, vier eigene
   Rückgängig-Stapel.** Alle vier Stapel folgen demselben Muster
   (JSON-Abbild, zwei Listen, feste Tiefe 40/40/60/100); Whiteboard und
   Gedankenkarte haben ihn Zeile für Zeile gleich (2.3).
3. **Strg+Z ist doppelt belegt — gemessen.** Im Schaltplan und auf dem Blatt
   nimmt der Block seinen Schritt zurück, und die Schale nimmt gleichzeitig
   den ganzen Seitenverlauf zurück: Meldung „Rückgängig", Block neu
   gezeichnet, **Block-Kennung gewechselt** (2.4).
4. **Der Seitenverlauf gibt beim Zurücknehmen allen Blöcken der Seite neue
   Kennungen.** `Verlauf.anwenden` → `Store.kinderLeeren` (purgt jeden
   Block) → `Store.baumEinfuegen` („immer mit frischen IDs",
   `indexdb.ts:2508`). `test70.mts:351-352` hält das als Tatsache fest;
   keinen Wächter gibt es für das Gegenteil. Das ist kein GFX-Thema, aber
   die schwerste Zeile dieses Audits (§9: „Kennungen nicht unnötig ändern").
5. **Erweiterungspunkte gibt es** — `melde()` in 16 von 17 Registern,
   Vorlagen mit `bauen`, die Prüfsätze und Probeläufe der Datenbanken, die
   `/v1/`-Schnittstelle im Browser, `.redion`. Aber **L30/E181 hat ein
   Plugin-System am 25. August 2026 ausdrücklich verworfen**. Priorität 2 des
   Auftrags widerspricht einer geschriebenen Entscheidung; das entscheidet
   Redur (Abschnitt 3, Frage 1).
6. **`esc` steht 68-mal in `src/`**, 54-mal ohne die Apostroph-Ersetzung,
   die §19 vorschreibt (gezählt am 25. September: `grep -rl "const esc = "
   src`, danach je Fassung auf `&#39;` geprüft).
7. **`doku/ARCHITEKTUR.md` ist vom 3. August 2026** und beschreibt elf
   Register und einen `core/` aus einer Datei. Heute sind es 17 Register
   und 13 077 Zeilen. Wer die Plattform plant, plant heute gegen eine Karte,
   die sieben Wochen alt ist.
8. **Der Ereignisbus steht aus.** 59 Ereignisarten in
   `src/kern/ereignisse/arten.ts`, Schalter `ereignisbus` in
   `src/kern/einstellung/schalter.ts:65` auf `aus`. §5 Regel 1 nennt ihn
   als ersten Weg zwischen Bereichen; benutzt wird er nicht.
9. **Ein CLI hätte heute nichts, woran es andocken kann.** `Api`
   (`src/bereiche/verbinden/schnittstelle.ts`, 906 Zeilen) beantwortet
   `/v1/pages`, `/v1/blocks/…`, `/v1/search`, `/v1/users/me` **im Browser**
   — der Servicearbeiter reicht `fetch()` dorthin durch. Der Server
   (`server/`, 2854 Zeilen) kennt Konto, Abgleich, Freigabe, Dateien; eine
   Block-Schnittstelle von aussen hat er nicht (Abschnitt 4).
10. **Der kleinste nächste Schritt** ist kein Kern, sondern ein Wächter und
    eine Zeile: der Prüflauf, der Satz 3 rot hält, dann die Regel „eine
    Taste, die ein Block schon genommen hat, nimmt die Schale nicht noch
    einmal". Erst dahinter kommt der gemeinsame Verlauf (2.7).

---

## 2. Die räumlichen Systeme — Priorität 1

### 2.1 Bestand

Gelesen am 25. September 2026. „Raum" heisst: in welcher Einheit die
gespeicherten Zahlen stehen. „Zeiger→Raum" heisst: wie ein `clientX/Y` zu
einer gespeicherten Zahl wird.

| System | Datei (Zeilen) | Feld am Block | Raum | Zeiger→Raum | Rückgängig | Strg+Z | gemeinsame Kerne | Prüfläufe |
|---|---|---|---|---|---|---|---|---|
| Whiteboard (`Zusatz.whiteboard`) | `bereiche/bloecke/arten/zeichenflaeche.ts` (1513; dazu Diagramm, Tabelle, Mathe) | `shapes[]` (`art`: stift, text, notiz, bild, verbindung, Formen mit x/y/w/h), `hoehe`, `sicht` | Flächenpunkte = CSS-Pixel bei Massstab 1; seit E138 mit `viewBox`, also nicht mehr breitenabhängig; **ohne `raumVersion`** | eigen: `getBoundingClientRect` + `sicht.z` (Z. 493-498) | eigen, 40 Abbilder (Z. 164-172), nur im Speicher | **keins** — die Taste fällt zur Schale durch | `Store` | 10: 114 174 187 206 209 214 265 267 428 504 |
| Gedankenkarte | `bereiche/bloecke/arten/gedankenkarte.ts` (1596) | `karte` {knoten[] {id, text, eltern, seite, farbe, zu, form}, sicht} | Knoten sind HTML, die Lage wird gerechnet, nicht gespeichert; Linien als SVG `viewBox 0 0 breite hoehe` | eigen: `offsetWidth/Height` und `getBoundingClientRect` (Z. 977, 1214) | eigen, 40 Abbilder (Z. 646-660) — **wörtlich der Whiteboard-Code** | eigen, mit `stopPropagation` (Z. 1482) — richtig | `Store` | 4: 86 529 537 538 |
| Schaltplan — Modell und Bild | `bereiche/bloecke/arten/schaltplan.ts` (828) | `plan` {art, teile[], leitungen[], texte[], ebenen, breite, hoehe} | Planpunkte auf `Register.fachzeichen.RASTER` | — (kein Ereignis, absichtlich) | — | — | `Register.fachzeichen` (12×), `Register.symbole` | 21, darunter 238-240, 263 |
| Schaltplan — Bedienung (`Planflaeche`) | `bereiche/bloecke/arten/planflaeche.ts` (1104) | dito | dito | eigen: `ortAus` = `(clientX - r.left) * plan.breite / r.width` (Z. 137-145) — kennt weder Letterbox noch CSS-Verwandlung | eigen, 60 Abbilder (`z.zurueck/z.vorwaerts`, Z. 173-195) | eigen, **ohne** `stopPropagation` (Z. 1017) → fällt zusätzlich zur Schale durch | `Schaltplan.*` (33×), `Register.fachzeichen` (11×), `Store` | s. o. |
| Blatt und PDF-Seite (`Marken`) | `bereiche/pdf/marken.ts` (7268), `document-mode.ts` (4916), `seite.ts`, `blatt.ts`, `einlesen.ts` | `marken[]` (`type`: stift, marker, text, bild, form, …; `raumVersion`) | **A4 in PDF-Punkten** (`viewBox 0 0 595.28 841.89`), `SheetSpace.RAUM_VERSION = 1` | `SheetSpace.umrechner` (`getScreenCTM`, E511) — die einzige Umrechnung, die Zoom, Rollstand und CSS-Drehung kennt | eigen, 100 flache Abbilder mit `listenGleich` (Z. 37, 1950-1972) | eigen, **ohne** `stopPropagation` (Z. 4320-4326) → fällt zusätzlich zur Schale durch | `SheetSpace`, `InkGeometry` (points 13×, bounds 12×, rectangle 9×, …), `InkShapes.recognize`, `InkStroke` (vorhersage, glaetter, druckGlaetter, Feder), `Register.fachzeichen/symbole/textstile` | 145 Läufe nennen `Marken` |
| Skizzen im Formelbuch | `bereiche/elektro/skizzen.ts` (1189) | — (erzeugt Bilder) | Planpunkte | — | — | — | `Schaltplan.alsSvg`, `Schaltplan.neuerPlan` — **ein Zeichner, keine zweite Symbolliste** (so gewollt) | 6: 209 244 339 430 442 524 |
| Folien / Präsentation | `core/slides/folien.ts` (198, rein), `bereiche/vorlagen/folien.ts` (452), Vortragsmodus in `wissen/werkzeuge.ts` | — (eine Folie ist eine Blockfolge; E540: „eine Folie ist ein Blatt, kein neuer Blocktyp") | — | — | — | — | `Folien.teilen/alsZeilen` | 13: 35 114 183 191 293 500 504-509 528 532 |

Zwei Dinge fallen an der Tabelle auf, bevor man eine Zeile davon liest:

- **Die Präsentation ist kein räumliches System.** Sie ist eine Ansicht auf
  Blöcke; was auf einer Folie gezeichnet wird, ist ein `blatt`-Block mit
  Marken (E540, E544). Ein GFX-Kern muss sie nicht kennen — er kennt das
  Blatt.
- **Der Schaltplan hat die sauberste Trennung** (Modell/Bild ohne Ereignis,
  Bedienung getrennt) und zugleich die schwächste Zeigerumrechnung.

### 2.2 Der vorhandene Kern — und wer ihn benutzt

```txt
src/core/sheet/space.ts      SheetSpace    A4 in Punkten, viewBox, getScreenCTM,
                                           raumVersion, Drehung (E467), Umrechner (E511)
src/core/ink/geometry.ts     InkGeometry   points, bounds, rectangle, move, drehung,
                                           union, textLayout, insidePolygon, path, outline
src/core/ink/shapes.ts       InkShapes     Formerkennung aus Strichen
src/core/ink/stroke.ts       InkStroke     Vorhersage, Glätter, Druckglätter, Feder
src/core/ink/thumbnail.ts    InkThumbnail  Miniaturen
src/core/slides/folien.ts    Folien        Folienteilung, rein, ohne DOM
```

Wer `SheetSpace` benutzt (gezählt am 25. September, `grep -rl SheetSpace
src`): `pdf/marken.ts`, `pdf/document-mode.ts`, `pdf/seite.ts`,
`pdf/einlesen.ts`, `bloecke/arten/blatt.ts`, `wissen/notebook.ts`,
`dateien/recognition.ts`, `core/export/pdfWriter.ts`. **Nicht:**
`zeichenflaeche.ts`, `gedankenkarte.ts`, `planflaeche.ts`.

`space.ts` sagt in seiner ersten Zeile, was es sein will: „EINE STELLE, DIE
BILDSCHIRM IN BLATT ÜBERSETZT — und keine zweite." Und nennt als Gegenbeispiel
wörtlich die Zeichenfläche (`e.clientX - r.left`). **Diese Zeile stimmt für
das Blatt und ist für das Programm falsch:** es gibt heute drei weitere
Übersetzungen (2.1). Das ist der Kern des GFX-Befunds — nicht, dass ein
Kern fehlt, sondern dass er dort endet, wo die PDF-Schicht endet.

Zwei Nebenfunde aus derselben Lesung, beide geprüft am 25. September:

- **Die Felder der räumlichen Blöcke haben keinen Typ.** `src/core/types/block.ts`
  kennt weder `shapes`, `sicht`, `hoehe` (Whiteboard) noch `karte`, `plan`,
  `marken` (`grep -rn "shapes\|karte\|plan\b\|marken" src/core/types/` → nur
  ein Kommentar). Was gespeichert wird, steht nur im Code, der es schreibt
  — und in `doku/REDION-FORMAT.md` steht keins der sechs Felder.
- **`test537` sieht `(globalThis as any)` nicht.** Der Bereichswächter kennt
  den Namen und den Umweg über `(window as any)` (test537.mts:164, 185);
  über `(globalThis as any).X` greifen heute 32 Stellen in fremde Bereiche
  (`grep -rno "(globalThis as any)\.[A-Z][a-zA-Z]*" src/bereiche`), darunter
  das Whiteboard nach `Dateien` (`zeichenflaeche.ts:257, 271`). Das ist kein
  neuer Querverweis, sondern ein blinder Fleck des Wächters — er gehört
  in `LUECKEN.md` neben L191.

### 2.3 Echte Duplikate — jede mit Beleg

Ein Duplikat ist hier nur, was **zweimal dasselbe tut** und wo die eine
Stelle von der anderen nichts weiss. Ähnliches mit anderem Zweck zählt nicht.

| Nr. | Was | Wo | Beleg |
|---|---|---|---|
| D1 | **Rückgängig-Stapel aus JSON-Abbildern** | `zeichenflaeche.ts:164-172` · `gedankenkarte.ts:646-660` · `planflaeche.ts:173-195` · `marken.ts:37, 1950-1972` — dazu der Seitenverlauf `kern/zustand/verlauf.ts` (MAX 60) und zwei ausserhalb GFX (`datenbanken/whatif.ts`, `hilfe/rundgang.ts`) | Whiteboard und Gedankenkarte wörtlich: `const SCHRITTE = 40; const zurueckStapel: string[] = []; const vorStapel: string[] = []; const abbild = (): string => JSON.stringify(…); … if (zurueckStapel.length > SCHRITTE) zurueckStapel.shift();`. Planfläche dasselbe mit 60 und `abzug()`. Marken anders gebaut (flache Abbilder, Vergleich vor dem Merken, E378) — dasselbe Ziel, bessere Fassung. |
| D2 | **Bildschirm → Raum** | `zeichenflaeche.ts:493-498` · `planflaeche.ts:137-145` · (`gedankenkarte.ts` misst statt zu rechnen) · `core/sheet/space.ts:77-92` | Drei Formeln, eine Matrix. Nur die Matrix kennt CSS-Verwandlungen, Rollstand und Zoom (E511). |
| D3 | **Strg+Z** | `schale/aufbau/schale.ts:3178, 3252` (Dokument, → `Verlauf.zurueck()`, ohne Prüfung auf `defaultPrevented` oder Ziel) · `gedankenkarte.ts:1482` (stopPropagation) · `planflaeche.ts:1017` (nur preventDefault) · `marken.ts:4325` (nur preventDefault) · Whiteboard: keiner | Vier Horcher, zwei Ergebnisse — gemessen in 2.4. |
| D4 | **`sv(name, attrs)`** — SVG-Element mit Attributschleife | `zeichenflaeche.ts:31-36` · `gedankenkarte.ts:113-118` · fünf weitere Dateien (`grep -rln "createElementNS(NS" src` → 7) | wörtlich gleich bis auf den Rückgabetyp |
| D5 | **`esc`** | 68 Dateien in `src/`, davon 54 ohne `'` → `&#39;` (§19 nennt die fünf Ersetzungen; `zeichenflaeche.ts:28-29` hat vier) | `grep -rl "const esc = " src | wc -l` → 68 (25. September) |
| D6 | **`uid()` mit Präfix und `performance.now`-Rückfall** | `gedankenkarte.ts:159-161` (`'gk'`) · `schaltplan.ts:184-186` (`'sp'`) | bis auf den Präfix gleich |
| D7 | **`zahl(wert, ersatz)`** und **`farbeVon(i)`** (E414-Modulo) | `gedankenkarte.ts:167-168, 156-157` · `zeichenflaeche.ts:88-89, 67-68` | wörtlich gleich; bei `farbeVon` nur der Rückfallwert anders |
| D8 | **Höhen-Griff** (pointerdown → Höhe ziehen → `Store.updateBlock({hoehe})`) | `gedankenkarte.ts:1559-1573` · `zeichenflaeche.ts:792-805` | gleicher Ablauf, gleicher Titel „Höhe ziehen" |
| D9 | **Zweifinger-Kneifzoom** (`finger`-Map, `kneifen`-Zustand, `Math.hypot`) | `zeichenflaeche.ts:546-562` · `pdf/document-mode.ts:4797-4818` | gleicher Aufbau, andere Feldnamen (`z` / `zoom`) |
| D10 | **Rahmen und Pfad einer Whiteboard-Form** — ein ZWEITER Bereich rechnet dieselben Daten nach | `zeichenflaeche.ts:202-212, 373` (`rahmenVon`, Stiftpfad) · `wissen/arbeitswelt.ts:1263-1291` (Miniatur) | `'M' + pts.map(q => q[0] + ' ' + q[1]).join(' L')` an beiden Stellen; `InkGeometry.rectangle/bounds/path` (geometry.ts:291, 625, 278) könnten beides — werden von keinem der zwei gerufen |

**Kein Duplikat, obwohl es so aussieht:** `Schaltplan.alsSvg` in
`elektro/skizzen.ts` — das ist die gewollte Wiederverwendung (ein Zeichner);
und `Folien` — die Präsentation zeichnet nichts selbst.

### 2.4 Zwei Messungen — Strg+Z im Schaltplan und auf dem Blatt

Vermutung aus dem Lesen (D3): Planfläche und Marken nehmen die Taste, rufen
`preventDefault()`, aber nicht `stopPropagation()`; der Horcher der Schale
hängt am Dokument (`schale.ts:3178`) und fragt nicht, ob jemand die Taste
schon genommen hat. Also müssten **beide** zurücknehmen.

Gemessen am 25. September 2026, Chromium über `file://…/index.html`, zwei
Sonden im Scratchpad (kein Prüflauf des Bestands; Aufbau wie `test238`
bzw. `test345`).

**Sonde 1 — Schaltplan.** Ein Plan mit zwei Teilen, ein drittes über die
Palette gesetzt, 800 ms gewartet (der Zaun des Seitenverlaufs ist 700 ms),
Fokus auf `.sp-wrap`, Strg+Z:

```txt
0 · Ausgang        domTeile 2  storeTeile 2  blockId b04888d1…  wrapMarke "alt"   toasts []
1 · Teil gesetzt   domTeile 3  storeTeile 3  blockId b04888d1…  wrapMarke "alt"   toasts []
   Fokus liegt auf: sp-wrap
2 · nach Strg+Z    domTeile 3  storeTeile 3  blockId eb6edc4f…  wrapMarke null    toasts ["Rückgängig"]
3 · zweites Teil   domTeile 4  storeTeile 4  blockId eb6edc4f…  wrapMarke "alt2"
   Knopf: Rückgängig
4 · nach ↶-Knopf   domTeile 3  storeTeile 3  blockId eb6edc4f…  wrapMarke "alt2"  toasts ["Rückgängig"]  (kein neuer Toast)

Befund: Strg+Z hat sichtbar NICHTS zurückgenommen · Block wurde NEU GEZEICHNET
(Seitenverlauf hat zugeschlagen) · BLOCK-KENNUNG GEÄNDERT
```

Was passiert ist, Zeile für Zeile: `Planflaeche.zurueck()` nimmt das Teil
weg und schreibt den Plan (`aendere(…, false)` → `Store.updateBlock`); der
Seitenverlauf merkt sich dabei den Stand **mit** drei Teilen; die Taste
fällt zur Schale durch, `Verlauf.zurueck()` holt genau diesen Stand zurück
— drei Teile, Seite neu gezeichnet, alle Blöcke mit frischer Kennung, der
eigene 60er-Stapel der Planfläche ist weg, weil das Element weg ist. Der
↶-Knopf des Blocks (Schritt 4) tut, was er soll.

**Sonde 2 — Blatt.** Stift gewählt, zwei Striche 800 ms auseinander,
Strg+Z auf `.blatt-marken`:

```txt
0 · Ausgang        domMarken 0  storeMarken 0  altBlockLebt true   blockId ff683223…  svgMarke "alt"
1 · zwei Striche   domMarken 2  storeMarken 2  altBlockLebt true   blockId ff683223…  svgMarke "alt"
2 · nach Strg+Z    domMarken 1  storeMarken 1  altBlockLebt false  blockId 24ba45cf…  svgMarke null  toasts ["Rückgängig"]

Befund: 2 → 1 Marken · Schicht NEU GEZEICHNET (Seitenverlauf) · BLOCK-KENNUNG GEÄNDERT
```

Hier stimmt die Zahl am Ende (ein Strich weniger), aber aus dem falschen
Grund: der Block hat einen Strich zurückgenommen **und** die Schale hat die
Seite auf den Stand von vorher gesetzt; welcher der beiden Stände gewinnt,
hängt am 700-ms-Zaun. Der alte Block existiert nicht mehr
(`altBlockLebt false`), sein 100er-Verlauf (E378) ist verloren, die Kennung
ist neu.

**Was die Kennung kostet.** `Store.kinderLeeren` (`indexdb.ts`, „für
Wiederherstellen und Sperren") ruft für jedes Kind `purgeBlock`; das
schreibt Grabsteine für den Abgleich (E254), löst Versionen und Anhänge
(`purgeAnhaenge` mit `dateiAnspruch()`, asynchron); dann setzt
`baumEinfuegen` alles **mit frischen Kennungen** wieder ein
(`indexdb.ts:2508`, `delete patch.id`). Für den Abgleich ist ein Strg+Z
also N Löschungen plus N Neuanlagen. Ob Anhänge dabei sicher sind, hängt an
der Reihenfolge von `dateiAnspruch()` und dem Wiedereinsetzen — das ist
**nicht gemessen** und gehört gemessen (Abschnitt 6, R1). E174 hat für den
Markdown-Rundlauf schon einmal entschieden, dass Kennungen zu behalten
sind; für den Verlauf steht diese Entscheidung nicht.

### 2.5 Was ein GFX-Kern für Redion heisst — und was nicht

AFFiNE als Massstab (`blocksuite/framework/std/src/gfx/`, nur Struktur):
`viewport`, `grid`, `layer`, `selection`, `tool`, `model/surface`,
`interactivity`, `keyboard`, `cursor`. Übersetzt auf Redion:

| Baustein | Redion heute | Fehlt |
|---|---|---|
| Raum und Zeiger (viewport) | `SheetSpace` (Blatt) | Whiteboard, Planfläche, Gedankenkarte rechnen selbst |
| Geometrie (model) | `InkGeometry`, `InkShapes` | — (Whiteboard/Schaltplan nutzen sie nicht, brauchen sie heute auch kaum) |
| Verlauf (history) | vier eigene Stapel + `Verlauf` | **ein** Stapel je Fläche, der mit der Seite zusammenarbeitet |
| Auswahl (selection) | `SelectionFlow` (`schale/bedienung/selection-flow.ts`, 373) für die Auswahlleiste; Marken haben eigene Auswahl | eine Auswahl für Flächen — offen als L204 |
| Werkzeug (tool) | je Fläche eigene Werkzeugleiste; E674 merkt Farbe/Stärke je Werkzeug (Marken) | — |
| Ebenen (layer) | Schaltplan `ebenen`, Marken Reihenfolge = Stapel | nicht nötig als Kern |
| Tastatur | vier Horcher (D3) | **eine Regel** |

Was Redion **nicht** braucht und nicht bauen soll: eine eigene Zeichen-Pipeline
(Canvas2D/WebGL — Redion zeichnet SVG und HTML, und das ist richtig für
Text, Druck und Barrierefreiheit), ein CRDT-Dokumentmodell (Yjs), ein
Framework. AFFiNE braucht diese Dinge, weil es auf Yjs steht; Redion steht
auf Blöcken in IndexedDB, und der Auftrag setzt CRDT zuletzt.

**Der GFX-Kern ist deshalb kein neues Ding, sondern das Ende von vier
Sonderwegen:** `SheetSpace` für alle Flächen, ein Verlauf für alle Flächen,
eine Tastenregel. Alles drei liegt schon halb da.

**Und die sichtbare Seite davon** hat Redur am 25. September mit einem
Bild von AFFiNEs Edgeless-Leiste benannt („ich will so was haben wie die
affine" · „integriere alles zusammen"): **eine** Werkzeugleiste für alle
Flächen, aus einem Register (§5 Regel 3), mit Kürzeln, Untermenüs, Ziehen
auf die Fläche und einem dichten Modus fürs Telefon — `AUFGABEN.md` W6.
Der Kern bekommt damit einen Ort, `src/core/gfx/`, und vier Bewohner in
dieser Reihenfolge: der Verlauf (Bogen 4), der Raum (heute `core/sheet/`,
Bogen 3 bindet das Whiteboard an), die Werkzeuge (Bogen 5), die Tasten
(E682 hat die Regel, das Register die Kürzel).

### 2.6 Datenrisiken je System

| System | Risiko | Grad |
|---|---|---|
| Whiteboard | `shapes` ohne `raumVersion`: jede Änderung der Deutung der Zahlen wäre eine stille Verschiebung (so steht es in `space.ts:26-30`). Wer die Umrechnung auf `SheetSpace` umstellt, muss die **Einheit lassen** oder eine Version einführen. | hoch, solange jemand die Formel anfasst |
| Gedankenkarte | Lage gerechnet, nicht gespeichert — kein Raumrisiko. Neue Felder (`form`, E628) sind rückwärts gutmütig. L192/L199 offen. | niedrig |
| Schaltplan | Planpunkte auf Raster, `breite/hoehe` im Plan — stabil. Zeigerformel falsch bei Letterbox (`preserveAspectRatio`) — heute unauffällig, weil das SVG sein Seitenverhältnis behält. | niedrig |
| Marken | `raumVersion 1`, A4-Punkte, Drehung getrennt (E467) — das Vorbild. Eigener Verlauf verliert beim Strg+Z der Schale (2.4). | mittel (Verlauf), niedrig (Daten) |
| Seitenverlauf | frische Kennungen bei jedem Zurücknehmen (2.4) | **hoch** — betrifft jede Seite, nicht nur GFX |

### 2.7 Der kleinste nächste Schritt — in der Form von §26

> **Erledigt am 25. September 2026 (E682, `test568`).** Redur hat die
> Reihenfolge freigegeben; der Rest dieses Abschnitts ist der Plan, wie er
> vor dem Bogen stand.

```txt
Problem        Strg+Z in Planfläche und Marken nimmt zweimal zurück (2.4).
Bereiche       bloecke (planflaeche), pdf (marken), schale (Horcher); das
               Whiteboard hat gar keine Taste und bekommt sie derselben Regel nach.
Dateien        1 neuer Prüflauf test568 (rot gegen a196b65: die Sonde oben,
               als Wächter) · schale.ts: die Schale lässt eine Taste liegen,
               die ein Block schon genommen hat (`defaultPrevented`) —
               eine Zeile, nur für z/y · danach, zweiter Bogen:
               src/core/gfx/history.ts (englisch, neu, rein, ohne DOM) —
               der Abbild-Stapel aus D1 EINMAL, mit Tiefe als Parameter;
               zeichenflaeche.ts, gedankenkarte.ts, planflaeche.ts rufen ihn.
Kein Kern?     `Verlauf` ist ein Seiten-Verlauf (ganzer Baum, 700-ms-Zaun) —
               ein Block-Verlauf ist etwas anderes, und Marken zeigen, dass
               es ihn braucht (100 Schritte, ohne die Seite zu bewegen).
Tests          test568 (Strg+Z bleibt beim Block; Kennung bleibt), test238-240,
               test345, test529/538, test537 (bereiche-bestand darf nicht
               wachsen), test105/109; Gegenprobe: die Zeile in der Schale
               wieder raus → test568 rot.
Daten          keine Feldänderung, kein Format, keine Migration.
```

**Der zweite Kandidat**, den der Whiteboard-Leser vorschlägt und der als
zweiter Bogen richtig ist: `punkt()` (`zeichenflaeche.ts:494-498`) auf
`SheetSpace.zuBlatt(flaeche, e)` umstellen. Weil der `viewBox` schon
`sicht.x sicht.y w/z h/z` ist (Z. 227-228), liefert die Matrix **dieselben
Flächenkoordinaten** — ohne den Fehler bei Rollstand und CSS-Verwandlung.
Wächter: test209 §3 („in Flächenkoordinaten, nicht in
Bildschirmkoordinaten", Z. 182) plus eine Gegenprobe mit einer
CSS-Verwandlung über dem Block, die mit der alten Rechnung rot wird.
Vorher aber (2.6, R3): die Einheit bleibt CSS-Pixel bei Massstab 1, und
das gehört als `raumVersion` an den Block, bevor irgendjemand die
Rechnung tauscht — sonst ist die nächste Änderung eine stille Verschiebung.

Warum nicht damit anfangen? Weil D2 die **gespeicherten Zahlen** berührt
(auch wenn sie gleich bleiben sollen — „sollen" ist eine Behauptung, bis
ein Wächter sie hält), und weil R2 heute jeden Menschen trifft, der auf
einem Blatt Strg+Z drückt.

---

## 3. Erweiterungspunkte und die Plugin-Frage — Priorität 2 und 3

### 3.1 Was es gibt

| Punkt | Wo | Wie | Wer nutzt es heute |
|---|---|---|---|
| Register `melde()` | 16 von 17 Registern (`textstile.ts` hat keins) — `bloecke`, `befehle`, `eigenschaften`, `formeln`, `ansichten`, `tasten`, `vorlagen`, `verbindungen`, `navigation`, `module`, `fachzeichen`, `symbole`, `menueband`, `context`, `einstellungen`, `elektroformeln` | ein Objekt eintragen (§5 Regel 3, §8) | Bereiche zur Ladezeit; `bloecke.melde` hat in `src/` keinen Aufrufer, nur test86/test272 |
| Vorlagen mit `bauen` | `register/vorlagen.ts:59`, `trainer: true` (E679) | eine Funktion, die Blöcke anlegt | `nin-quiz.ts`, `staatskunde-inhalt.ts`, Galerie |
| Prüfsätze und Probeläufe der Datenbanken | `bereiche/datenbanken/pruefsaetze/`, `probelauf/`, `steuerung.ts` | Regeln als Daten | Datenbanken |
| `/v1/`-Schnittstelle | `bereiche/verbinden/schnittstelle.ts` (`Api`) | Notion-Form im Browser, Token, `Notion-Version`; der Servicearbeiter reicht `fetch('/v1/…')` durch | Skripte auf der Seite, Konsole |
| `.redion` | `doku/REDION-FORMAT.md` | Daten hinein und hinaus | Sicherung, Umzug |

### 3.2 Der Widerspruch

`LUECKEN.md` L30 (25. August 2026, E181):

> Eine Erweiterung ist FREMDER CODE im selben Fenster wie die Notizen. Er
> sieht IndexedDB, `Store`, die Zwischenablage und jedes offene Dokument. …
> Es sicher zu bauen bräuchte: eine echte Sandbox (eigener Ursprung,
> `iframe`, Nachrichten statt Zugriff), ein Rechtemodell je Erweiterung,
> Signaturen und einen Weg, eine Erweiterung im Nachhinein zurückzuziehen.
> Das ist ein eigenes Projekt und nicht eine Zeile in einer Lückenliste.
> **Also: nicht gebaut, und das ist die Entscheidung — kein Versäumnis.**

Der Auftrag verlangt genau das (Sandbox, Rechte, kein `eval`) — er
widerspricht L30 nicht in der Sache, sondern im Entschluss. Ein Plugin-SDK
ist damit **keine Aufgabe dieses Audits**, sondern eine Frage an Redur
(Abschnitt 7, Frage 1). Was der Audit sagen kann: die Sandbox, die L30
fordert, hat in Redion einen natürlichen Ort — der Servicearbeiter reicht
`/v1/` heute schon als Nachricht durch, und ein `iframe` mit eigenem
Ursprung könnte denselben Weg nehmen. Das ist eine Beobachtung, kein Plan.

Was SiYuan hier zeigt (nur gelesen): ein Plugin-System (`app/src/plugin/`)
und ein Marktplatz (`kernel/bazaar/`) — beides AGPL, also nicht zur
Übernahme, aber ein Massstab für den Umfang: SiYuans Plugins laufen **im
selben Fenster** mit vollem Zugriff. Genau das schliesst L30 aus.

---

## 4. Schnittstellen nach aussen — CLI, MCP, API (Priorität 4)

*(wird aus der Lesung der Systeme K und M ergänzt — siehe Abschnitt 5)*

---

## 5. Die Systeme A bis S

*(Abschnitt folgt: je System Dateien · Datenmodell · Schnittstellen · Tests ·
gemeinsam genutzt · Duplikate · Doku-Stand · Risiken · kleinster Schritt)*

---

## 6. Datenrisiken — gesammelt und nach §46 geordnet

| Nr. | Risiko | Woher | Was fehlt |
|---|---|---|---|
| R1 | Seitenverlauf vergibt frische Kennungen und purgt die alten Blöcke. **Nachgemessen (messungen.md, 25. September):** ein Bild überlebt (Dateisatz wird umgehängt); eine **Unterseite** verliert Kennung und Fassungen (1 → 0), ein Favorit zeigt ins Leere | 2.4 (gemessen), `indexdb.ts:2508`, `verlauf.ts:58-67`, `test70.mts:351-352`, zwei Sonden | ein Wächter „Kennungen und Fassungen überleben Strg+Z", `Verlauf.anwenden`, das abgleicht statt purgt — Bogen 2, von Redur freigegeben |
| R2 | Strg+Z doppelt (Block + Seite) in Planfläche und Marken; Whiteboard ohne Taste | 2.4 (gemessen) | test568 + eine Zeile in der Schale (2.7) |
| R3 | Whiteboard-Koordinaten ohne `raumVersion` | `space.ts:26-30`, `zeichenflaeche.ts` | vor jeder Formeländerung eine Version |
| R4 | `esc` 54× ohne Apostroph | D5 | ein Helfer, ein Wächter (test87 prüft heute `esc` an einer Stelle) |

*(weitere aus Abschnitt 5 folgen)*

---

## 7. Fragen an Redur

Redur hat gebeten, gefragt zu werden. Das sind die Fragen, die dieser Audit
nicht selbst beantworten darf:

1. **L30 wieder öffnen?** Ein Plugin-SDK widerspricht E181 („nicht gebaut,
   und das ist die Entscheidung"). Wenn ja: als eigenes Projekt mit Sandbox
   im eigenen Ursprung — und dann gehört E181 umgeschrieben, nicht
   übergangen.
2. **Diese Datei an dieser Stelle?** `doku/REDION-PLATTFORM-AUDIT.md`, nach
   dem Vorbild von `doku/REDION-STUDY-SUITE-AUDIT.md`. Wenn sie woanders
   hingehört, wird sie verschoben, nicht kopiert.
3. **GFX zuerst — oder R1 zuerst?** Der Auftrag sagt GFX; §46 sagt „Daten
   sicher halten" vor allem anderen. R1 (Kennungen beim Zurücknehmen) ist
   kein GFX-Thema und wiegt schwerer als jedes Duplikat. Mein Vorschlag:
   R2 (eine Zeile, ein Wächter) sofort, weil es beides ist; R1 als eigener
   Bogen direkt danach; der gemeinsame Verlauf (D1) als dritter.
4. **`raumVersion` fürs Whiteboard** — darf das Whiteboard eine bekommen
   (ein neues Feld, rückwärts gutmütig), bevor jemand seine Umrechnung
   anfasst?

---

## Anhang A · Zahlen mit Befehl (25. September 2026)

```txt
509     ls pruefungen/lauf/test*.mts | wc -l
68      grep -rl "const esc = " src --include=*.ts | wc -l
54      davon ohne &#39; (je Datei: grep -A4 "const esc = " | grep -q "&#39;")
7       grep -rln "createElementNS(NS" src --include=*.ts | wc -l
8       grep -rl SheetSpace src --include=*.ts | wc -l   (space.ts selbst mitgezählt)
517/125 pruefungen/bereiche-bestand.json → _gesetzt
59      Ereignisarten in src/kern/ereignisse/arten.ts
217     grep -c "<script" index.html
```

## Anhang B · Die Sonden

Zwei Skripte im Scratchpad der Sitzung (`audit/probe-strgz.mts`,
`audit/probe-strgz-blatt.mts`), Chromium über `file://`, Aufbau wie
`test238` (Schaltplan) und `test345` (Blatt). Sie sind **keine
Prüfläufe** des Bestands; der Wächter, der aus ihnen wird, heisst test568
und kommt mit dem ersten Bogen (2.7). Ihre Ausgabe steht in 2.4 wörtlich.

## Anhang C · Die Karte

`doku/karte/Redion.md` ist der Einstieg: der Graph zeigt, welches System
welchen Kern **benutzt** (Pfeil) und wo belegte Duplikate liegen
(gestrichelt). Jede Systemnotiz führt Dateien, Datenmodell, Schnittstellen,
Geometrie (was das System selbst rechnet), Prüfläufe, Duplikate mit Zitat,
Doku-Stand, Risiken und den Vorschlag des Lesers für den kleinsten Schritt.
Pflege: `karte.json` ändern, `node karte.mts`, fertig; `--pruefen` sagt, ob
die Notizen zum JSON passen.
