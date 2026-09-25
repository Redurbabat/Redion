# Redion Plattform-Audit — der Bestand vor dem ersten GFX-Schritt

Stand: 25. September 2026
HEAD der Bestandsaufnahme: `a196b65`; Teil 2 auf `1b89c01` (Zweig `claude/cool-mccarthy-hjpi1v`)
Auftrag: Redurs Master-Prompt vom 25. September 2026 („REDION PLATFORM AUDIT")

```txt
Prüfläufe                 509 → 511  ls pruefungen/lauf/test*.mts | wc -l (test568, test569 aus diesem Audit)
TypeScript in src/        156 826  Zeilen — core 13 077 · kern 12 745 · register 11 021 ·
                                   schale 15 327 · bereiche 103 569
<script> in index.html    217
Register                  17       ls src/register/ | wc -l
Bereichs-Querverweise     517 in 125 Paaren   pruefungen/bereiche-bestand.json (_gesetzt)
Entscheidungen            E1 … E680 → E685
Lücken                    L1 … L210 → L215
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

**Methode — und was davon wirklich lief.** Elf Leser je System und zwei
für die Referenzen, jeder Befund mit `Datei:Zeile`: **alle dreizehn sind
durchgelaufen.** Je System sollten die ersten zwei gemeldeten Duplikate von
einem Gegenprüfer widerlegt werden: **elf Urteile liegen vor** (A–F), alle
elf bestätigen; die zehn Prüfer für G–K und der Vollständigkeitsprüfer sind
an der Sitzungsgrenze des Rechners gescheitert („session limit") und **nicht
gelaufen**. Was sie geprüft hätten, steht in der Karte als „ungeprüft, mit
Zitat" — nicht als bestätigt. Die Vollständigkeitsprüfung habe ich selbst
gemacht (Anhang D): 29 von 53 Quellordnern haben einen Leser, 21 021 Zeilen
in 24 Ordnern keinen. Dazu die vier eigenen Messungen im laufenden Programm
(2.4 und messungen.md), deren Ausgabe wörtlich dasteht.

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
   src`, danach je Fassung auf `&#39;` geprüft) — **und der gemeinsame
   Helfer existiert**: `Sanitize.escapeText` in
   `src/core/security/sanitize.ts:183` (Leser F). 68 Kopien neben einem
   Kern, den keine ruft.
7. **`doku/ARCHITEKTUR.md` ist vom 3. August 2026** und beschreibt elf
   Register und einen `core/` aus einer Datei. Heute sind es 17 Register
   und 13 077 Zeilen. Wer die Plattform plant, plant heute gegen eine Karte,
   die sieben Wochen alt ist.
8. **Der Ereignisbus steht aus.** 59 Ereignisarten in
   `src/kern/ereignisse/arten.ts`, Schalter `ereignisbus` in
   `src/kern/einstellung/schalter.ts:65` auf `aus`. §5 Regel 1 nennt ihn
   als ersten Weg zwischen Bereichen; benutzt wird er nicht.
9. **Drei Wege nach aussen, drei Datenformen — und ein CLI hätte keinen
   Datenpfad ohne Fenster.** `Api` beantwortet `/v1/` **im Browser** in
   Notions Form; der Server hat ein eigenes `/v1/` (rohes Redion-JSON) und
   ein `/mcp` (fünf Werkzeuge, Text); dazu ein MCP-Client mit einem
   **zweiten** Werkzeugkatalog. IndexedDB liegt im Browser, der
   Servicearbeiter antwortet 503 ohne Fenster — ein Node-CLI käme nur über
   den Server an Daten, und der schreibt ohne Store-Semantik (Abschnitt 4).
   *(Teil 1 sagte hier „eine Block-Schnittstelle von aussen hat er nicht" —
   das war falsch; der Leser I hat sie gefunden.)*
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
| D1 | **Rückgängig-Stapel aus JSON-Abbildern** | `zeichenflaeche.ts:164-172` · `gedankenkarte.ts:646-660` · `planflaeche.ts:173-195` · `marken.ts:37, 1950-1972` — dazu der Seitenverlauf `kern/zustand/verlauf.ts` (MAX 60) und zwei ausserhalb GFX (`datenbanken/whatif.ts`, `hilfe/rundgang.ts`) | Whiteboard und Gedankenkarte wörtlich: `const SCHRITTE = 40; const zurueckStapel: string[] = []; const vorStapel: string[] = []; const abbild = (): string => JSON.stringify(…); … if (zurueckStapel.length > SCHRITTE) zurueckStapel.shift();`. Planfläche dasselbe mit 60 und `abzug()`. Marken anders gebaut (flache Abbilder, Vergleich vor dem Merken, E378) — dasselbe Ziel, bessere Fassung. **Erledigt am Abend (E687, `test571`):** Whiteboard, Gedankenkarte und Planfläche rufen `GfxHistory.erstelle(tiefe)` aus `src/core/gfx/history.ts`; Marken und Seitenverlauf bleiben mit Grund eigen. |
| D2 | **Bildschirm → Raum** | `zeichenflaeche.ts:493-498` · `planflaeche.ts:137-145` · (`gedankenkarte.ts` misst statt zu rechnen) · `core/sheet/space.ts:77-92` | Drei Formeln, eine Matrix. **Berichtigt am Abend (E686, `test570`):** für das Whiteboard ist die Handformel bei jeder achsenparallelen Skalierung GLEICH der Matrix, weil der `viewBox` aus demselben Kasten kommt — gemessen mit `scale(0.8)`, grün; erst `rotate(180deg)` trennt sie. Das Duplikat bleibt eines (§8); die Fehlerbehauptung war zu scharf. Whiteboard seit E686 über die Matrix; Planfläche folgt. |
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
| Whiteboard | `shapes` ohne `raumVersion`: jede Änderung der Deutung der Zahlen wäre eine stille Verschiebung (so steht es in `space.ts:26-30`). **Seit E686 (Abend desselben Tages): `raumVersion: 1` mit jedem Speichern, Einheit unverändert, Umrechnung über `SheetSpace`.** | erledigt (E686) |
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

**Und was Redion heute schon hat, obwohl L30 „nicht gebaut" sagt** (Leser
H, `src/bereiche/einstellungen/erweiterungen.ts`): ein Erweiterungsfenster
mit der Schnittstelle `Redion` — `formel(name, fn)`, `befehl(titel, text,
fn)`, `knopf(titel, icon, fn)`, `beimStart(fn)`, `beiAenderung(fn)`,
`daten.seiten/bloecke/…`, `schreibe.block/seite/zeile`. Der Code läuft **im
selben Ursprung per `new Function`** (Z. 166); `ABGESCHIRMT` (Z. 154-158)
ist eine Parameterliste, kein Ursprungswechsel. Drei Umgehungen der
Register: Erweiterungsbefehle stehen in einem zweiten Katalog neben
`Register.befehle`, Erweiterungsformeln hängen direkt in der Maschine statt
in `Register.formeln`, Erweiterungsknöpfe in einer eigenen DOM-Liste.
`beimStart` läuft bei **jedem** `alleLaufen` (Z. 86) — ein Start-Hook, der
Seiten anlegt, legt sie mehrfach an. Was eine Erweiterung schreibt, trägt
`erstelltVon` = der Nutzer; §21 verlangt für KI „rückgängig, versioniert,
löschbar", für Erweiterungen gilt heute nur, was `Store` ohnehin tut.

Das ändert die Plugin-Frage: es geht nicht um „bauen oder nicht", sondern
um **das, was da ist, in die Register zurückzuführen** (Leser H, kleinster
Schritt: `Redion.befehl` → `Register.befehle.melde`, `Redion.formel` →
`Register.formeln.melde`, `zuruecksetzen` → `nimmZurueck`) und um die
Sandbox, die L30 fordert und die es nicht gibt. Redurs Regel vom
25. September (E683, §57) setzt den Rahmen: Fremdcode ja, wenn er Redion
verbessert, nichts geht hinaus, vorher fragen — für Code, den **ein
Nutzer** einspielt, gilt zusätzlich die Sandbox-Bedingung, weil Redur ihn
nicht vorher gesehen hat.

---

## 4. Schnittstellen nach aussen — CLI, MCP, API (Priorität 4)

Leser I (`doku/karte/mcp.md`, 24 Dateien, 14 Schnittstellen, 33 Prüfläufe).

### 4.1 Drei Wege, die nebeneinander stehen

| Weg | Wo | Form | Wer kommt dran |
|---|---|---|---|
| **`/v1/` im Browser** (`Api`, `src/bereiche/verbinden/schnittstelle.ts`) | der Servicearbeiter (`src/dienst/sw.ts:373-407`) reicht echte `fetch('/v1/…')` per `postMessage` ans Fenster; ohne Fenster 503, nach 5 s 504 | **Notions Form** (`{object:'page'|'block'|'database'|…}`, Werte als `{number: 80}`); Kopfzeilen `Notion-Version`/`Redion-Version` Pflicht, `Authorization: Bearer` = `meta.apiToken` | ein Skript auf der Seite, die Konsole, der eigene Servicearbeiter — niemand von aussen |
| **`/v1/` am Server** (`server/kern.ts`) | `GET|PATCH /v1/pages/{id}`, `POST /v1/search` (linear über ≤ 500 Sätze); Bereich aus Kopf `Redion-Bereich`, `?bereich=` oder Marke; 409 bei verschlüsselten Sätzen | **rohes Redion-JSON** aus `saetze.daten` | wer ein Konto und einen Token hat |
| **`/mcp` am Server** | JSON-RPC 2.0, nur POST: `initialize` (protocolVersion `2024-11-05`), `tools/list`, `tools/call`, `ping`; **fünf Werkzeuge** (`seiten_suchen`, `seite_lesen`, `seite_anlegen`, …) mit `inputSchema`; Rechte über Server-Konten | **Text** (`s.daten` als Zeichenkette) | ein MCP-Client mit Token |
| **MCP-Client im Browser** (`MCP.verbinden`, `werkzeugeHolen`, `werkzeugRufen`) | nur zu freigegebenen Hosts; über die Brücke (`/api/bruecke?ziel=` bzw. `localhost:8081/hol`, Allowlist `ERLAUBT`) | eigener Katalog `Agent.WERKZEUGE` | die KI in Redion |
| **Node-Werkzeuge** | `npm run bauen | pruefen | typecheck | bauen:ts | stand | server | veroeffentlichen`; `node chronik.mts | dienststand.mts | karte.mts | bilder.mts | bauen.mts` | — | wer das Verzeichnis hat |

### 4.2 Was daran doppelt ist (Leser I, ungeprüft — die Gegenprüfer für I liefen nicht)

- **Zwei MCP-Werkzeugkataloge** für dieselbe App — `Agent.WERKZEUGE` im Browser, `MCP_WERKZEUGE` am Server — mit verschiedenen Namen und Zahlen (§8: keine doppelten Kataloge).
- **Das D1-Schema steht zweimal**: als Datei `server/schema.sql` und als Zeichenkette.
- **Zwei CORS-Brücken mit zwei Allowlists**, die auseinandergelaufen sind.
- Pfad zerlegen, Fassungsprüfung mit Notions Fehlertext, Suche über `saetze` — je zweimal (Browser-`Api` und Server).
- `esc` sechsmal allein in `src/bereiche/verbinden/`; `elVon` 49 wörtliche Kopien im Projekt.

### 4.3 Die drei Risiken, die vor jedem CLI stehen

1. **Drei Datenformen, eine Wahrheit?** Notions Form (Browser), rohes JSON (Server-`/v1/`), Text (`/mcp`). Ein CLI muss EINE davon zur Wahrheit erklären — heute wählt der Weg die Form.
2. **Der Server schreibt ohne Store-Semantik.** `PATCH /v1/pages` mischt `properties` in `daten` (ein Feld, das `RedionBlock` nicht kennt — intern heisst es `props`); `seite_anlegen` per MCP schreibt `{type:'page', text, inhalt, parentId}` **ohne `content`, `alive`, `created`**. Was so entsteht, ist für den Browser ein halber Block (§9, §17).
3. **Ein CLI hat keinen Datenpfad ohne Fenster.** IndexedDB liegt im Browser; der Servicearbeiter antwortet 503 ohne Fenster. Ein Node-CLI erreicht die Daten nur (a) über einen laufenden Browser oder (b) über den Server — nur unverschlüsselte Sätze, nur mit Konto, und Cloudflare lief nie live (L82).

### 4.4 Der kleinste Schritt Richtung CLI (Leser I)

Ein `redion.mts` in der Wurzel (Node, `.mts` wie alle Werkzeuge, §54) mit
**einem** Unterbefehl `doctor`, der nichts an Daten anfasst: er ruft die
vorhandenen Prüfmodi nacheinander — `node dienststand.mts --pruefen`,
`node chronik.mts --pruefen`, `node karte.mts --pruefen`, `npm run
typecheck`, `node pruefungen/alle.mts 87 105 109 537` — und gibt den Stand
aus (HEAD, Zahl der Läufe, offener Sweep in `.volllauf-stand.json`, ob die
Einzeldatei älter ist als `quell/`). Reine Orchestrierung, kein neuer
Datenpfad. Alles, was Daten liest oder schreibt, wartet auf 4.3 Punkt 1
und 2 — und auf einen Server, der läuft.

---

## 5. Die Systeme A bis K — je die sieben Fragen des Auftrags

Kurzfassung je System; die volle Lesung mit jeder Datei, jeder Schnittstelle und jedem Prüflauf steht in der Karte (`doku/karte/<system>.md`). „Duplikate" sind hier nur die, die der Gegenprüfer bestätigt hat, oder — wo keiner lief — die des Lesers mit Zitat; die Karte kennzeichnet beides.

### A · Editor und Blockmodell

→ Karte: `doku/karte/editor.md`

**1 · Dateien.** `src/bereiche/editor/ansicht/editor.ts` (3565), `src/bereiche/editor/ansicht/auswahlleiste.ts` (357), `src/bereiche/editor/mehrfach.ts` (160), `src/register/bloecke.ts` (363), `src/kern/ablage/indexdb.ts` (3071), `src/kern/zustand/verlauf.ts` (112) — und 3 weitere

**2 · Schnittstellen.** `Blocks`, `Auswahl`, `Mehrfach`, `Register.bloecke`, `Store (Blockteil)`, `Verlauf`, `Ereignisse.melde`, `Store.on / notify` …

**3 · Gemeinsam genutzt.** src/kern/ablage/indexdb.ts — `Store`: updateBlock (65×), getBlock (58×), trashBlock (16×), addBlock (13×), childrenOf (11×), purgeBlock (8×), baum/baumEinfuegen (je 6×), getMeta, getCollection, addPage, addRow, addView, addDatabase, rowsOf, pathOf, now (gezählt per grep über editor.ts, mehrfach.ts, auswahlleiste.ts); src/register/bloecke.ts — `Register.bloecke.alle()` (editor.ts:41), `zifferZuTyp` (Z.113-115), `eines` (5 Treffer); src/kern/zustand/verlauf.ts — `Verlauf.merke` (2×); … **Nur genannt, nicht benutzt:** NICHT benutzt: src/core/ink/geometry.ts, src/core/orb/geometry.ts, kern/helfer/rollrand.ts, kern/helfer/zeichenziel.ts (kein Treffer in src/bereiche/editor)

**4 · Echte Duplikate.** 5 gemeldet, 1 bestätigt, 0 verworfen, 4 ungeprüft.

- ✓ Escape-Funktion `esc` (`src/bereiche/editor/ansicht/editor.ts:328-329` ↔ `src/kern/helfer/vorschau.ts:46-48 (und ~65 weitere Dateien, …`)
- · Zwei Mehrfachauswahl-Zustände für dieselben `.blk`-Elemente (`src/bereiche/editor/ansicht/editor.ts:3218-3223 …` ↔ `src/bereiche/editor/mehrfach.ts:15, 38-40, 52-58 (Set …`) — ungeprüft, mit Zitat
- · Ziffer→Blockart-Zuordnung als Literal-Rückfall (`src/bereiche/editor/ansicht/editor.ts:116-117` ↔ `src/register/bloecke.ts:333-340 (zifferZuTyp, aus `kurz` …`) — ungeprüft, mit Zitat
- · Telefon-Erkennung über max-width (`src/bereiche/editor/ansicht/editor.ts:3193 und …` ↔ `src/kern/einstellung/app.ts:70-74 (istTelefon mit …`) — ungeprüft, mit Zitat
- · Zwei Listen umwandelbarer Blocktypen in einer Datei (`src/bereiche/editor/ansicht/editor.ts:120-121 (UMWANDELBAR)` ↔ `src/bereiche/editor/ansicht/editor.ts:3325-3326 …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 21 genannt: `test39`, `test65`, `test66`, `test70`, `test86`, `test97`, `test111`, `test132`, `test139`, `test142`, `test158`, `test162`, `test164`, `test176` …

**6 · Kleinster nächster Schritt (Leser).** Einen Prüflauf schreiben, der misst, ob Blockkennungen ein `Verlauf.zurueck()` überleben (heute: nein, test70.mts:351-352), und ihn rot sehen. Dann `baumEinfuegen` um einen Schalter „Kennungen behalten“ erweitern (indexdb.ts:2508: `delete patch.id` nur, wenn die Kennung noch lebt) und `Verlauf.anwenden` (verlauf.ts:57-62) damit rufen — genau der Weg, den E174 für den Markdown-Rundlauf schon gegangen ist. Keine neue Schicht, keine Feldumbenennung, eine Datei plus ein Wächter; Nachbarstellen prüfen: dupliziere (editor.ts:2223) und Alt-Drop (Z.2033) wollen weiterhin FRISCHE Kennungen.

**7 · Daten- und Kompatibilitätsrisiken.**

- Rückgängig ändert Kennungen: `Verlauf.anwenden` (verlauf.ts:57-62) ruft `Store.kinderLeeren` (purgeBlock aller Kinder, indexdb.ts:2567-2572) und `Store.baumEinfuegen` („immer mit frischen IDs“, Z.2502, `delete patch.id` Z.2508). Nach einem Strg+Z zeigen `#block=`-Verweise (E105/test179), Kommentare und Abgleichs-Grabsteine auf tote Kennungen; …
- Der Undo geht über `purgeBlock` — endgültig, mit asynchronem Aufräumen der Anhänge (indexdb.ts:539-560). Ein Undo auf einer Seite mit Datei-Blöcken kann `purgeAnhaenge` anstossen, obwohl der Block gleich neu angelegt wird (nicht gemessen; Hypothese aus dem Code).
- Zwei Undo-Systeme mit zwei Knöpfen (menueband.ts:771-790): `Verlauf` (ganze Seite, 60 Schritte, 700-ms-Zaun) und Marken-Undo je Zeichenfläche über `Zeichenziel.ruf` (zeichenziel.ts:377). Strg+Z in schale.ts:3252 ruft immer `Verlauf.zurueck()` — welche Fläche gemeint ist, entscheidet nur der Fokus. Eine gemeinsame Schicht muss beide zusammenführen oder die …
- `Verlauf.start` patcht Store-Funktionen zur Laufzeit (verlauf.ts:100-108). Wer `Store.addBlock` an eine gemeinsame Schicht weiterreicht oder die Ladereihenfolge ändert (index.html:579 indexdb vor 633 verlauf), verliert den Hook still.
- Das Register wird EINMAL beim Laden geholt (`const TYPEN = Register.bloecke.alle()`, editor.ts:41; bloecke.ts:267-271 gibt bewusst dieselbe Liste) und danach mutiert (`TYPEN.push` der Einbettdienste, editor.ts:93-96). Ein Register-Ersatz, der Kopien liefert, macht später gemeldete Arten unsichtbar.
- … 4 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: kein eigener Abschnitt zum Editor/Blockmodell (Überschriften Z.43-1241: Cloudflare, Telefon, Auftragsmaschine, PDF/GoodNotes, UI-System, Office O1-O7, Werkzeugtafel W1-W5); Z.886 erwähnt „100 Schritte rückgängig“ der Markenschicht (Zeichnen, nicht Editor). LUECKEN.md offen (Überschrift ohne GESCHLOSSEN): L3 „Der Spreadsheet-Block“ (Z.171), L20 „Markdown- und Tastenkürzel“ (Z.739, Rest sind …

---

### B · Whiteboard / Zeichenfläche

→ Karte: `doku/karte/zeichenflaeche.md`

**1 · Dateien.** `src/bereiche/bloecke/arten/zeichenflaeche.ts` (1513), `quell/schale/stil/werkzeuge.css`, `src/bereiche/editor/ansicht/editor.ts`, `src/register/bloecke.ts`, `src/bereiche/wissen/arbeitswelt.ts`, `src/core/ink/geometry.ts` (1071) — und 6 weitere

**2 · Schnittstellen.** `Zusatz.whiteboard(block) → HTMLElement`, `Register.bloecke 'whiteboard'`, `Store.updateBlock / Store.uid`, `UI.toast`, `(globalThis as any).Dateien.adresse / .ablegen`, `DOM-Vertrag: `.wb`, `.wb-flaeche`, `[data-wz]`, `[data-a]`, `[data-c]`, `.wb-eingabe`, `.wb-massstab`, `[data-sid]``, `block.shapes (Datenschnittstelle)`, `Ereignisbus / Zeichenziel`

**3 · Gemeinsam genutzt.** src/kern/ablage/indexdb.ts — `Store.updateBlock` (440), `Store.uid` (374); src/schale/ueberlagerung/ui.ts — `UI.toast`; src/register/bloecke.ts:96 — Blockart-Eintrag; src/register/menueband.ts:500 — Anlegen; quell/schale/stil/werkzeuge.css:763–785, 1175 — Stil (gemeinsame Regel `.wb-massstab, .gk-massstab` seit E637); src/kern/helfer/vorschau.ts:196 — kennt `whiteboard`/`zeichenflaeche` als Arten ohne Text (Miniaturen), ohne dass das Whiteboard es ruft; Bereich→Bereich statt kern: `(globalThis as any).Dateien` … **Nur genannt, nicht benutzt:** NICHT genutzt, obwohl vorhanden: src/core/ink/geometry.ts (rectangle 291, bounds 625, union 962, scale 1018, rotate 679, distanceToPolyline 738, insidePolygon 936), src/core/ink/shapes.ts (recognize 63), src/core/sheet/space.ts (zuBlatt 56), src/kern/zustand/verlauf.ts (merke/zurueck/vor 107–111), …

**4 · Echte Duplikate.** 6 gemeldet, 2 bestätigt, 0 verworfen, 4 ungeprüft.

- ✓ Undo-Stapel aus JSON-Abbildern (40 Schritte) (`src/bereiche/bloecke/arten/zeichenflaeche.ts:161–176` ↔ `src/bereiche/bloecke/arten/gedankenkarte.ts:646–660 (und …`)
- ✓ Rahmen einer Whiteboard-Form (Stift über min/max der Punkte, sonst normalisiertes x/y/w/h) und Stiftpfad `M … L …` (`src/bereiche/bloecke/arten/zeichenflaeche.ts:202–212 …` ↔ `src/bereiche/wissen/arbeitswelt.ts:1265–1276 (Rahmen) und …`)
- · Zweifinger-Kneifzoom mit `finger`-Map und `kneifen`-Zustand (`src/bereiche/bloecke/arten/zeichenflaeche.ts:546–559, 621, …` ↔ `src/bereiche/pdf/document-mode.ts:4797–4818`) — ungeprüft, mit Zitat
- · Höhengriff am Block, der `hoehe` schreibt (`src/bereiche/bloecke/arten/zeichenflaeche.ts:720–733` ↔ `src/bereiche/bloecke/arten/gedankenkarte.ts:1559–1572`) — ungeprüft, mit Zitat
- · Bildschirmpunkt → Flächenkoordinaten (`src/bereiche/bloecke/arten/zeichenflaeche.ts:494–498 …` ↔ `src/core/sheet/space.ts:56–59 (`zuBlatt`, über …`) — ungeprüft, mit Zitat
- · Rad-Zoom am Block (mit abweichendem Verhalten) (`src/bereiche/bloecke/arten/zeichenflaeche.ts:741–747` ↔ `src/bereiche/bloecke/arten/gedankenkarte.ts:1466–1470`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 6 genannt: `test209`, `test206`, `test428`, `test187`, `test33`, `test114`

**6 · Kleinster nächster Schritt (Leser).** Erst die Form benennen, dann eine Rechnung tauschen: (1) In src/core/types/ einen reinen Typ `WhiteboardShape`/`WhiteboardView` für `shapes`/`sicht`/`hoehe` anlegen (noEmit, ändert nichts an Daten; Feldnamen bleiben wie gespeichert, §53.3) und `doku/REDION-FORMAT.md` um den Absatz „Whiteboard-Formen“ ergänzen — beides fehlt heute (block.ts:46–73, REDION-FORMAT.md grep leer). (2) Dann als erste Code-Änderung `punkt()` (zeichenflaeche.ts:494–498) auf `SheetSpace.zuBlatt(flaeche, e)` umstellen: weil `viewBox` bereits `sicht.x sicht.y w/z h/z` ist (227–228), liefert die CTM-Rechnung dieselben Formkoordinaten, aber ohne den Fehler aus space.ts:17–22 (Rollstand, CSS-Transform); Wächter ist …

**7 · Daten- und Kompatibilitätsrisiken.**

- Zwei Rückgängig-Systeme übereinander: `Verlauf.start()` umwickelt `Store.updateBlock` (kern/zustand/verlauf.ts:96–104), also legt JEDES `sichern()`/`sichtSichern()` des Whiteboards (zeichenflaeche.ts:178, 498) zusätzlich ein Seitenabbild in den Seitenverlauf (700-ms-Zaun). Strg+Z geht in der Schale immer an `Verlauf.zurueck()` (schale/aufbau/schale.ts:3252; …
- Datenform ohne Typ und ohne Versionsmarke: `shapes`, `sicht`, `hoehe` fehlen in src/core/types/block.ts (46–73); Koordinaten sind CSS-Pixel bei z=1 mit möglicherweise negativem `w/h` (210–211, 399–401), während InkGeometry `{x,y,width,height}` positiv erwartet (geometry.ts:291–294) und die Markenschicht in PDF-Punkten mit `raumVersion` rechnet …
- Zwei Leser derselben Daten: arbeitswelt.ts:1263–1300 liest `block.shapes` und rechnet Rahmen/Pfade selbst nach. Wer die Form ändert (Feldnamen, Pfadformat), muss beide Stellen und test209:378–383 mitnehmen.
- Kennungen: Form-IDs sind 8 Zeichen aus `Store.uid().slice(0, 8)` (289, 574, 600–601, 609–610) und werden von `verbindung.von/nach` referenziert; Bilder hängen über `dateiId` an der Dateiablage (291, 421–437). Import/Abgleich/Ersetzen darf beides nicht umschreiben (§13, §14) — eine `.json`-Sicherung ohne Anhänge zeigt korrekt „Bild fehlt“ (437), das muss so …
- Bereichsgrenze: das Whiteboard greift über `(globalThis as any).Dateien` (257, 271) in bereiche/dateien; test537 sieht nur `(window as any)` (test537.mts:185), der Bestand führt kein bloecke→Dateien. Wandert Geometrie nach core/kern, darf dort keine Abhängigkeit auf `Dateien`/`Store`/`UI` entstehen (§4: kern kennt keinen Bereich).
- … 3 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: kein offener Eintrag zu Whiteboard/Zeichenfläche/Zusatz (grep -i: nur 243 und 1154, beide zur PDF-Zeichenfläche; 699 nennt L115-Rest). LUECKEN.md: L54 (9059) „grösstenteils geschlossen“ — OFFEN bleiben: Miniatur zeichnet keine Verbindungen (9093–9096) und der Griff hält bei Bildern kein Seitenverhältnis (9086–9091); L115 Punkt 1 (4346, 4358–4359) OFFEN als Rest: „die Zeichenfläche des Whiteboards …

---

### C · Gedankenkarte (Mindmap)

→ Karte: `doku/karte/gedankenkarte.md`

**1 · Dateien.** `src/bereiche/bloecke/arten/gedankenkarte.ts` (1596), `quell/schale/stil/werkzeuge.css`, `src/register/bloecke.ts`, `src/bereiche/editor/ansicht/editor.ts`, `src/kern/helfer/vorschau.ts`, `index.html` — und 1 weitere

**2 · Schnittstellen.** `Gedankenkarte`, `Register.bloecke Eintrag 'mindmap'`, `editor.ts case 'mindmap'`, `Store.updateBlock`, `UI.toast / UI.menu`, `Dialog.wahl`, `Ids.short`, `Zeiger-/Tastenereignisse an .gk-buehne`

**3 · Gemeinsam genutzt.** Store.updateBlock aus src/kern/ablage/indexdb.ts:440 — einziger Schreibweg für karte und hoehe (gedankenkarte.ts:663, 1570); Ids.short aus src/core/helpers/ids.ts:69 (global Z. 118) — Kennungen der Knoten und Verbindungen (gedankenkarte.ts:159–161); UI.toast und UI.menu aus src/schale/ueberlagerung/ui.ts:30–33 — Hinweise und Vorlagenmenü; Dialog.wahl aus src/schale/ueberlagerung/dialog.ts:121 — Rückfrage vor dem Ersetzen durch eine Vorlage (gedankenkarte.ts:1295) **Nur genannt, nicht benutzt:** Register.bloecke (src/register/bloecke.ts:97) — Anmeldung der Blockart; keine weitere Register-Nutzung (Formen und Vorlagen sind NICHT im Register, sondern lokale Listen, Z. 147, 199); NICHT benutzt: src/core/ink/geometry.ts (InkPoint/InkBounds, simplify, distanceToSegment) — die Karte rechnet Bounds, Bézier und …

**4 · Echte Duplikate.** 7 gemeldet, 2 bestätigt, 0 verworfen, 5 ungeprüft.

- ✓ SVG-Elementhelfer `sv(name, attrs)` mit createElementNS + setAttribute-Schleife (`src/bereiche/bloecke/arten/gedankenkarte.ts:113-118` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:31-36`)
- ✓ `farbeVon(i)` — Palettenzugriff mit doppeltem Modulo auf ein [Farbe, Name]-Paar (E414) (`src/bereiche/bloecke/arten/gedankenkarte.ts:156-157` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:67-68`)
- · `uid()` — 'präfix' + Ids.short() mit performance.now-Rückfall (`src/bereiche/bloecke/arten/gedankenkarte.ts:159-161` ↔ `src/bereiche/bloecke/arten/schaltplan.ts:184-186`) — ungeprüft, mit Zitat
- · `zahl(wert, ersatz)` — endliche Zahl oder Ersatz (`src/bereiche/bloecke/arten/gedankenkarte.ts:167-168` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:88-89`) — ungeprüft, mit Zitat
- · Rückgängig-Stapel aus JSON-Abbildern (SCHRITTE=40, zurueckStapel/vorStapel, abbild, merken mit shift) (`src/bereiche/bloecke/arten/gedankenkarte.ts:646-660` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:164-172`) — ungeprüft, mit Zitat
- · Höhen-Griff des Blocks: pointerdown → Höhe ziehen → Store.updateBlock({ hoehe }) (`src/bereiche/bloecke/arten/gedankenkarte.ts:1559-1573` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:792-805`) — ungeprüft, mit Zitat
- · `esc()` — lokale Escape-Funktion statt eines gemeinsamen Helfers (`src/bereiche/bloecke/arten/gedankenkarte.ts:106-111` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts und ~20 …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 4 genannt: `test529`, `test538`, `test537`, `test86`

**6 · Kleinster nächster Schritt (Leser).** Die vier wörtlich gleichen Kleinhelfer aus gedankenkarte.ts und zeichenflaeche.ts/schaltplan.ts — `sv` (Z. 113–118 ↔ zeichenflaeche.ts:31–36), `zahl` (Z. 167–168 ↔ zeichenflaeche.ts:88–89), `farbeVon`-Modulo (Z. 156–157 ↔ zeichenflaeche.ts:67–68) und `uid` mit Präfix (Z. 159–161 ↔ schaltplan.ts:184–186) — in einen Helfer unter src/kern/helfer/ (oder src/core/helpers/) ziehen, ohne ein Datenfeld anzufassen; dann test529, test538, test537 (bereiche-bestand darf nicht wachsen) und test105/test109 fahren. Alles andere (Formen, Verbindungen, Viewport, Undo) hängt an gespeicherten Feldern und braucht zuerst eine Entscheidung zu L192/L199.

**7 · Daten- und Kompatibilitätsrisiken.**

- Das Feld `karte` ist der gesamte Zustand und nicht im zentralen Blocktyp deklariert (src/core/types/block.ts:61–70 kennt es nicht; leseKarte nimmt `block: any`). Eine gemeinsame Schicht, die den Blocktyp strenger fasst, darf `karte`, `hoehe` und darin `knoten/verbindungen/aufbau/sicht` nicht umbenennen (§53.3 Grenze 1) — jede gespeicherte Karte und jede …
- `rund` ist die Form OHNE Feld (gedankenkarte.ts:141–144, 1158). Eine gemeinsame Formen-/Shape-Schicht, die jedem Knoten immer eine Form schreibt, ändert stillschweigend alle Bestandsblöcke und macht `test538 §7` rot.
- Unbekannte Formen müssen erhalten bleiben (Z. 314–321, §18). Ein gemeinsamer Formenkatalog mit Whitelist (wie er in test538 als Gegenprobe rot gesehen wurde) löscht Daten neuerer Fassungen.
- Die Wurzelkennung ist fest 'w' (Z. 176, 264, 289); eine gemeinsame ID-Vergabe, die sie würfelt, bricht Auswahl und Vorlagen-Rundreise (test538 §9).
- Das Layout ist ein automatischer Baum-Aufbau ohne freie Knotenpositionen (aufbauen, Z. 430–527): es gibt keine gespeicherten Knotenorte. Eine gemeinsame Canvas-Schicht mit freiem Verschieben/Snap/Resize hätte hier nichts zu speichern und würde ein neues Feld (Orte) einführen — das ist eine Modelländerung mit Migrationsfrage, kein Refactor.
- … 6 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: kein Treffer für gedankenkarte/mindmap (grep -i leer). ERLEDIGTE-AUFGABEN.md:669–706: Eintrag „19. September 2026 · E628 · Die Gedankenkarte bekommt Griffe, Verbindungen, Formen und Vorlagen" (test538 53/53, test529 56/56, Bilder gkformen/gkvorlagen; „Nicht geprüft: die Gesamtsuite"); Z. 713 (E627: die 44 px der gk-Leiste über ::after). LUECKEN.md offen: L177 Marker, Notizen und Grenzen fehlen (Z. …

---

### D · PDF-Schreibstudio und Ink

→ Karte: `doku/karte/pdf.md`

**1 · Dateien.** `src/bereiche/pdf/marken.ts` (7268), `src/bereiche/pdf/document-mode.ts` (4916), `src/bereiche/pdf/seite.ts` (327), `src/bereiche/pdf/leser.ts` (347), `src/bereiche/pdf/einlesen.ts` (1046), `src/bereiche/pdf/ink-ruler.ts` (238) — und 6 weitere

**2 · Schnittstellen.** `Marken`, `Marken.schicht(block, breite, hoehe, umbruch, rand)`, `DocumentMode`, `ink-studio-ready`, `SheetSpace`, `InkGeometry / InkShapes / InkStroke / InkThumbnail`, `PdfLeser.oeffne(daten, frage)`, `PdfEinlesen.alsSeiten(datei, elternId, vorgabe)` …

**3 · Gemeinsam genutzt.** src/kern/ablage/indexdb.ts — `Store` (147 Aufrufe in pdf/*): updateBlock, getMeta/setMeta, Blockzugriff; src/core/ink/geometry.ts — `InkGeometry` (96 Aufrufe): bounds, union, move, scale, rotate, touchesCircle, splitByCircle, insidePolygon, drehung, textLayout, densify; src/core/sheet/space.ts — `SheetSpace` (39 Aufrufe): zuBlatt, umrechner, A4-Masse, RAUM_VERSION, gedrehtVon, masseVon; src/kern/helfer/zeichenziel.ts — `Zeichenziel` (37 Aufrufe): aktive Zeichenflaeche, Werkzeug/Farbe/Strich uebernehmen; …

**4 · Echte Duplikate.** 6 gemeldet, 2 bestätigt, 0 verworfen, 4 ungeprüft.

- ✓ `distanceToSegment` (Punkt-Strecken-Abstand) zweimal woertlich im selben Kern (`src/core/ink/geometry.ts:27-36` ↔ `src/core/ink/shapes.ts:520-527`)
- ✓ SVG-Element-Fabrik mit Attributschleife (`src/bereiche/pdf/marken.ts:783-787 (`svg`)` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:32-36 (`sv`)`)
- · Zweifinger-Kneifzoom (finger-Map + kneifen-Zustand + Math.hypot) (`src/bereiche/pdf/document-mode.ts:4797-4812` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:548-562`) — ungeprüft, mit Zitat
- · Strg+Z-Horcher ohne stopPropagation neben dem Dokument-Horcher der Schale (doppeltes Zuruecknehmen, L212) (`src/bereiche/pdf/marken.ts:4320-4326` ↔ `src/bereiche/bloecke/arten/planflaeche.ts:1017 und …`) — ungeprüft, mit Zitat
- · Eigener Rueckgaengig-Stapel statt kern/zustand/verlauf.ts (`src/bereiche/pdf/marken.ts:37-38, 1800-1801, 1966-1971 …` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:164-172 …`) — ungeprüft, mit Zitat
- · Bildschirm→Raum: dieses System benutzt die Matrix, die Nachbarn rechnen selbst (`src/core/sheet/space.ts:93-105 (`umrechner`, getScreenCTM)` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:494-498 und …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 23 genannt: `test174`, `test180`, `test201`, `test267`, `test343`, `test345`, `test347`, `test352`, `test364`, `test366`, `test438`, `test447`, `test455`, `test461` …

**6 · Kleinster nächster Schritt (Leser).** Zuerst den Wächter für L212 schreiben (test568: ein Strich, Strg+Z im Blatt → genau ein Schritt zurück, Blockkennung unverändert; vorher rot, gemessen wie in doku/REDION-PLATTFORM-AUDIT.md 2.4), dann in schale.ts:3178 eine Zeile: eine Taste mit `defaultPrevented` nimmt die Schale nicht noch einmal — ohne marken.ts anzufassen. Danach, als eigener kleiner Bogen ohne Datenänderung: `distanceToSegment` in shapes.ts:520-527 durch `InkGeometry.distanceToSegment` ersetzen (dazu die Funktion in geometry.ts:1061 exportieren) und mit test347/test366 grün halten. Erst wenn beides steht, lohnt die grosse Frage — ob `SheetSpace.umrechner` und der Marken-Verlauf die gemeinsame Schicht für Whiteboard und …

**7 · Daten- und Kompatibilitätsrisiken.**

- Das Feld `marken` hat keinen Typ (src/core/types leer) und keine Formatbeschreibung ausser einem Satz in doku/REDION-FORMAT.md:234; eine gemeinsame Schicht, die Marken umformt, muss alle 15 Arten und die optionalen Felder (stil, leiter, neigung, druckArt, dreh, gesperrt, href, zielSeite, dateiId, zeichenId, laeufe) unveraendert durchreichen — sonst stiller …
- Alte `stift`-Marken ohne `pressure` und ohne `raumVersion` muessen lesbar bleiben (marken.ts:5-7); `raumVersion` ist die einzige Deutungsmarke des Raums (space.ts:44) — eine neue Einheit oder ein neuer Ursprung ohne Erhoehung verschiebt jede vorhandene Zeichnung ohne Fehlermeldung (space.ts:19-23).
- Zoom ist bewusst KEINE gespeicherte Zahl (seite.ts:14-17, document-mode.ts:2805-2808); eine gemeinsame Viewport-Schicht, die Zoom/Pan in den Block schreibt, hebt `edited` an und erzeugt Fassungen (document-mode.ts:26-29, 45-48) und bricht test180.
- Der Verlauf lebt nur im Speicher und friert Marken ein (`Object.freeze`, marken.ts:1927-1932); jede gemeinsame Schicht, die eine Marke von innen aendert statt zu ersetzen, wirft im strict mode oder verliert Undo (Regel E378).
- Ein gemeinsamer Strg+Z-Weg muss L212 loesen, nicht verdoppeln: heute nimmt die Schale zusaetzlich `Verlauf.zurueck()` und setzt den Baum mit frischen Kennungen neu ein (LUECKEN.md:8221-8227) — Bilder und Grabsteine haengen an dieser Reihenfolge.
- … 5 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: kein offener Punkt mit Dateinamen dieses Systems; Erwaehnungen sind die erledigten G-Boegen (G1 Z.225, G16 Z.288, G22 Z.332, G35 Z.430, G40 Z.475) und das Redesign-Kapitel Z.842-1189 („Was ueberraschend gut dasteht: Die Markenschicht“ Z.883); offen dort nur L119 (fluessiger Stift braucht echtes Stiftgeraet, Z.736-738). LUECKEN.md offen (Ueberschrift ohne GESCHLOSSEN, per awk ueber alle `## L`-Abschnitte …

---

### E · Präsentationen / Folien

→ Karte: `doku/karte/folien.md`

**1 · Dateien.** `src/core/slides/folien.ts` (198), `src/bereiche/vorlagen/folien.ts` (452), `src/bereiche/dateien/einlesen.ts` (2726), `src/bereiche/dateien/ausgeben.ts` (3015), `src/bereiche/wissen/werkzeuge.ts` (3172), `src/bereiche/pdf/marken.ts` (7268) — und 4 weitere

**2 · Schnittstellen.** `Folien`, `Folienvorlagen`, `Register.menueband.meldeLieferant(bandEintraege)`, `Register.befehle.melde 'Neue Folie' / 'Neue Praesentation'`, `Register bloecke id 'blatt'`, `Einlesen.pptxLesen / datei()`, `Austausch.alsPowerPoint(seite), Austausch.pptxTeile(folien)`, `Werkzeuge.praesentation(p)` …

**3 · Gemeinsam genutzt.** src/core/ink/geometry.ts (InkGeometry): bounds, ecken, drehung, rotate, scale, move, points, textLayout, intersects, insidePolygon — ueber marken.ts fuer jedes Folienobjekt (marken.ts:1023, 2047-2056, 3965-3982); einlesen.ts nutzt InkGeometry.textLayout fuer Absatzhoehen (Kommentar Z.2185-2189); src/core/sheet/space.ts (SheetSpace): zuBlatt/umrechner (marken.ts:1610, 2496, 3894), A4-Masse als Rueckfall (blatt.ts:157-158), drehHuelle (blatt.ts:195); src/core/slides/folien.ts (Folien): von werkzeuge.ts:1076 …

**4 · Echte Duplikate.** 5 gemeldet, 2 bestätigt, 0 verworfen, 3 ungeprüft.

- ✓ Markdown-Auszeichnung entfernen (**fett**, __, `code`, Links) (`src/core/slides/folien.ts:125-133 (`ohneMarkierung`)` ↔ `src/kern/helfer/vorschau.ts:65-76 (`Vorschau.klartext`, …`)
- ✓ Marken eines Blocks als eigenstaendiges SVG aus `Marken.zeichneMarke` + `verlaufDefs` zusammenbauen (`src/bereiche/vorlagen/folien.ts:251-267 (`vorschau`)` ↔ `src/bereiche/wissen/werkzeuge.ts:2186-2200 …`)
- · Die 16:9-Vorgabe 960 x 540 pt (= 12192000 x 6858000 EMU) steht dreimal (`src/bereiche/vorlagen/folien.ts:36-37 `const BREITE = 960; …` ↔ `src/bereiche/dateien/einlesen.ts:1931-1932 `emuZuPunkt(...) …`) — ungeprüft, mit Zitat
- · EMU -> Punkt (/12700) einmal als Helfer, einmal inline in derselben Datei (`src/bereiche/dateien/einlesen.ts:1013-1014 `const …` ↔ `src/bereiche/dateien/einlesen.ts:1399-1402 `/* w steht in …`) — ungeprüft, mit Zitat
- · `esc` je Datei (Projektregel, mit geschriebenem Grund — kein Versehen, aber ein Duplikat) (`src/bereiche/vorlagen/folien.ts:39-44 `Eigen, nicht …` ↔ `68 Definitionen `const esc = ` in src/ (z.B. …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 30 genannt: `test293`, `test183`, `test499`, `test500`, `test501`, `test502`, `test503`, `test504`, `test505`, `test506`, `test507`, `test508`, `test509`, `test511` …

**6 · Kleinster nächster Schritt (Leser).** Doku vor Code, ohne Datenaenderung: (1) E600 als Eintrag in ENTSCHEIDUNGEN.md nachtragen (Verzeichnis + Text, §34) und AUFGABEN.md:1010-1011 sowie LUECKEN.md L151 Z.6751 berichtigen — Uebergaenge werden seit einlesen.ts:1442-1508 gelesen und in werkzeuge.ts:1196-1203 abgespielt (test528). (2) Eine neue Luecke eintragen: der frische .pptx-Export (ausgeben.ts:2994-3001) verliert die Marken einer selbst gebauten Praesentation ('[A4-Blatt]' je Folie, core/slides/folien.ts:166) — mit einem Wächter, der aus `Folienvorlagen.neuePraesentation('titel')` exportiert und im slide1.xml den Titeltext erwartet (muss zuerst rot sein, §50). Erst danach die drei SVG-Zusammenbauer (vorlagen/folien.ts:251-267, …

**7 · Daten- und Kompatibilitätsrisiken.**

- Gespeicherte Marken sind das Datenformat: `point`, `pts`, `breiteBox`, `fontSize`, `dreh`, `schritt`, `verlauf`, `quelle` liegen so in jedem Blattblock in IndexedDB und in jeder .redion/.json-Sicherung (einlesen.ts:2604-2660). Eine gemeinsame Geometrieschicht darf diese Feldnamen nicht umbenennen oder `pts`-Zweipunktform in x/y/w/h umdeuten (CLAUDE.md …
- `dreh` gilt fuer Flaechenmarken um die Kastenmitte, Linienzuege drehen stattdessen ihre Punkte (geometry.ts:601-604, marken.ts:1021-1025). Eine Schicht, die Rotation einheitlich als Transform speichert, aendert die Bedeutung vorhandener Daten.
- Die Rueckspur `quelle:{sp,p}` (einlesen.ts:2236-2240) und `folieMitText` (ausgeben.ts:2825ff.) verbinden eine Marke mit einem `<a:t>` der Originaldatei. Wer Marken beim Umbau neu erzeugt (z.B. beim Gruppieren aufteilt) verliert die Spur still — die Ausgabe sagt dann nur 'geaenderte Folieninhalte stehen noch nicht darin' (ausgeben.ts:2981-2985).
- Der frische .pptx-Weg (ausgeben.ts:2994-3001) schreibt nur `Folien.alsZeilen` — Marken werden dort nie gelesen (grep 'marken' im pptx-Abschnitt trifft nur folieMitText). Eine mit `Folienvorlagen` gebaute Praesentation (lauter `blatt`-Bloecke) kommt als eine Zeile '[A4-Blatt]' je Folie heraus (core/slides/folien.ts:166). In LUECKEN.md/AUFGABEN.md nicht …
- Der Vortrag zeichnet Folienobjekte ueber `outerHTML` (werkzeuge.ts:2190-2194), die Miniatur ueber Knoten (document-mode.ts:1082), die Vorlage ueber outerHTML (vorlagen/folien.ts:256-260). Eine gemeinsame Schicht, die nur einen Weg umstellt, laesst die anderen zwei auseinanderlaufen (§8; der Verlaufs-Fund E545 entstand genau so).
- … 3 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: Tabelle Z.844 (Praesentation: 8 Layouts, Vortragsmodus, .pptx lesen, Rundreise; fehlt 'Uebergaenge, Animationen, Folienmaster'); Reihenfolge Z.860 Punkt 2 'Folienmaster und Uebergaenge — der Rest von 1:1 wie PowerPoint' OFFEN; O3 ERLEDIGT (Z.905, E540); O4 ZUR HAELFTE (Z.922); 'Offen bleibt am Folieneditor' Z.1006-1013: Rollweg 111 px, 'Uebergaenge und Animationen. Redion liest sie beim .pptx-Import …

---

### F · Schaltplan, Fachzeichen, Elektro

→ Karte: `doku/karte/elektro.md`

**1 · Dateien.** `src/bereiche/bloecke/arten/schaltplan.ts` (828), `src/bereiche/bloecke/arten/planflaeche.ts` (1104), `src/register/fachzeichen.ts` (1194), `src/register/elektroformeln.ts` (5089), `src/bereiche/elektro/simulation.ts` (926), `src/bereiche/elektro/formelheft.ts` (934) — und 5 weitere

**2 · Schnittstellen.** `Schaltplan`, `Planflaeche`, `Register.fachzeichen`, `Register.elektroformeln`, `Stromfluss`, `Formelheft`, `Elektroaufgaben`, `Elektroarbeitsplatz` …

**3 · Gemeinsam genutzt.** Register.fachzeichen (src/register/fachzeichen.ts): RASTER, holen, inGruppe, gruppen, alsSvg, anschlussLage, masse — 35 Aufrufe im System; Register.elektroformeln (src/register/elektroformeln.ts): 24 Aufrufe (Formelheft, Aufgaben, Kapitelwahl planflaeche.ts:885-905); Register.menueband.inReiter('elektro') (start.ts, lt. menueband.ts:88-94), Register.befehle (10 Treffer), Register.symbole (1); Ids.short (src/core/helpers/ids.ts:69) für Teil-Kennungen (schaltplan.ts:183-185); Sanitize.farbe / … **Nur genannt, nicht benutzt:** NICHT benutzt, obwohl vorhanden: src/core/ink/geometry.ts (drehePunkte Z. 587, bounds Z. 625, distanceToSegment Z. 27), src/core/sheet/space.ts (zuBlatt/umrechner über getScreenCTM), Kern-Verlauf für Undo, Ereignisbus

**4 · Echte Duplikate.** 5 gemeldet, 2 bestätigt, 0 verworfen, 3 ungeprüft.

- ✓ Tiefstellung `tief` (Unterstrich -> Subscript) dreimal, von test244 zusammengehalten (`src/bereiche/bloecke/arten/schaltplan.ts:78-80` ↔ `src/bereiche/elektro/formelheft.ts:81-82 und …`)
- ✓ `esc` wortgleich in schaltplan.ts und allen fünf Elektro-Dateien statt Sanitize.escapeText (`src/bereiche/bloecke/arten/schaltplan.ts:39-41 (auch …` ↔ `src/core/security/sanitize.ts:183-185 escapeText`)
- · 'Liegt ein Punkt auf einer Strecke' zweimal — exakt fürs Zeichnen, mit Toleranz fürs Rechnen; die Zeichnung kann Knoten anders zeigen, als die Simulation verbindet (`src/bereiche/bloecke/arten/schaltplan.ts:346-350 aufStrecke` ↔ `src/bereiche/elektro/simulation.ts:282-294 …`) — ungeprüft, mit Zitat
- · Drehmatrix um einen Anker: Register schreibt sie selbst, obwohl core/ink sie als 'die eine Drehformel des Hauses' führt (`src/register/fachzeichen.ts:1174-1182 anschlussLage` ↔ `src/core/ink/geometry.ts:587-593 drehePunkte`) — ungeprüft, mit Zitat
- · Bildschirmpunkt -> Flächenkoordinate je Fläche eigen gerechnet, obwohl core/sheet/space.ts genau dafür 'EINE STELLE … und keine zweite' ist (`src/bereiche/bloecke/arten/planflaeche.ts:136-144 ortAus` ↔ `src/bereiche/bloecke/arten/zeichenflaeche.ts:493-497 punkt; …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 21 genannt: `test238`, `test239`, `test240`, `test241`, `test242`, `test243`, `test244`, `test263`, `test339`, `test338`, `test446`, `test471`, `test477`, `test480` …

**6 · Kleinster nächster Schritt (Leser).** Zuerst das wortgleiche `esc` in schaltplan.ts:39-41 und den fünf Elektro-Dateien (start.ts:27, arbeitsplatz.ts:39, formelheft.ts:39, lernbilder.ts:34, skizzen.ts:42) durch `Sanitize.escapeText` (src/core/security/sanitize.ts:183) ersetzen — kein Verhalten ändert sich, test238/240/241/244/446 halten es, und `Planflaeche` bezieht esc ohnehin aus Schaltplan (planflaeche.ts:24). Zweiter, schon geometrischer Schritt: `aufStrecke` aus schaltplan.ts:346-350 und simulation.ts:282-294 zu EINER Funktion mit Toleranzparameter machen (Stromfluss exportiert seine bereits, simulation.ts:922) — davor ein Wächter, der einen Plan mit Knoten auf einer Sammelschiene zeichnet UND rechnet und prüft, dass …

**7 · Daten- und Kompatibilitätsrisiken.**

- `lesen` rundet beim Öffnen JEDES x/y und jeden Leitungspunkt auf das Raster (schaltplan.ts:208-247) und schreibt beim ersten `aendere` zurück: eine gemeinsame Schicht mit anderem Raster oder Fliesskomma-Koordinaten verschiebt alte Pläne still — eine Datenwanderung ohne Migration (§9).
- Leitungen tragen ZWEI Wahrheiten: absolute Punkte UND Bindung vonTeil/vonNr (schaltplan.ts:107-111); Konsistenz entsteht erst zur Laufzeit (leitungenNachziehen planflaeche.ts:548-560), die Simulation fällt auf Ortsnähe NAH=6 zurück (simulation.ts:322-347). Ein gemeinsamer Connector muss beide erhalten, sonst verlieren gesicherte .redion-Pläne ihre …
- Drehung ist auf 0/90/180/270 um den Zeichenmittelpunkt mit Math.round festgelegt (fachzeichen.ts:1166-1182, masse 1185-1190); freie Winkel oder Drehung um eine Ecke nehmen die Anschlüsse vom Raster — Leitungen treffen nicht mehr (Kopf schaltplan.ts:30-35).
- Klemmen-Geometrie (anschluesseVon/anschlussLage) ist Eingabe für Aufgaben-Lösungen (aufgaben.ts:658, 1098-1118), Simulation (simulation.ts:300-313) und Formelbuch-Skizzen (skizzen.ts:87-151): eine Änderung ändert richtige Antworten und Rechnungen (test239/241/243/244) und Word/PDF-Exporte (ausgeben.ts:672-684).
- `block.plan` ist untypisiert (kein Typ in src/core/types/block.ts) und hat schon ein undokumentiertes Feld `werte.U` an der Quelle (schaltplan.ts:742-744); Vorlagen in Store.meta `elektro:planvorlagen` tragen alte Kennungen und Koordinaten (planflaeche.ts:1058-1081) und müssen von jeder Formatänderung mitgelesen werden.
- … 4 weitere in der Karte

**Doku-Stand.** ENTSCHEIDUNGEN.md (nur Inhaltsverzeichnis+Köpfe per grep): E187 Simulation rechnet (Z. 13662), E188 Formelheft (13796), E189 Aufgaben erzeugen (13882), E190 Lernbilder (13988), E191 Fachzeichen auf dem PDF (14058), E192 drei Aufgaben lesen den Plan (14124), E193 in den Plan tippen (14242, Leitungsgriffe Punkt 59), E194 Formelbuch (14371), E238 Elektro als Ort (18246), E248 Prüfungsuhr (18881), E261 Klick landete am …

---

### G · Gemeinsame räumliche Infrastruktur

→ Karte: `doku/karte/gemeinsam.md`

**1 · Dateien.** `src/schale/bedienung/selection-flow.ts` (373), `src/core/ink/geometry.ts` (1071), `src/core/ink/shapes.ts` (279), `src/core/sheet/space.ts` (165), `src/core/ink/stroke.ts` (493), `src/kern/ablage/befehle.ts` (538) — und 4 weitere

**2 · Schnittstellen.** `SelectionFlow.folge / fliege / DAUER / OMEGA / DEHNUNG_MAX`, `InkGeometry.*`, `InkShapes.recognize`, `SheetSpace.zuBlatt / umrechner / A4_* / RAUM_VERSION / gedrehtVon / masseVon / drehHuelle / seiten / rund`, `InkStroke (Feder, glaetter, druckGlaetter, vorhersage)`, `Transaktion.ausfuehren / befehlAusfuehren / abspielen / setze / aendere / dahinter / davor / heraus / loadPageChunk / queryCollection / submitTransaction / anfrage`, `/api/v3/loadPageChunk, /api/v3/queryCollection, /api/v3/submitTransaction`, `Ereignisse.horche / einmal / melde / frage / meldeAsync / frageAsync / darf / darfAsync / schonGemeldet` …

**3 · Gemeinsam genutzt.** src/kern/ablage/indexdb.ts (Store): Transaktion schreibt über Store.updateBlock/updateCollection/updateView (befehle.ts:58-62); marken.ts:1949 schreibt marken+raumVersion über Store.updateBlock; Protokoll über Store.setMeta (protokoll.ts:96-134).; src/kern/zustand/verlauf.ts (Verlauf): befehle.ts:215 Verlauf.merke(true) — ein Schritt je Transaktion.; src/kern/ereignisse/protokoll.ts (Protokoll): befehle.ts:242-246 Protokoll.notieren('transaktion', …).; src/kern/ereignisse/bus.ts + arten.ts: von …

**4 · Echte Duplikate.** 11 gemeldet, 0 bestätigt, 0 verworfen, 11 ungeprüft.

- · Rückgängig-Stapel aus JSON-Abbildern, zwei Listen, feste Tiefe — viermal in Bereichen, einmal im Kern (`/home/user/Redion/src/kern/zustand/verlauf.ts:53-55` ↔ `/home/user/Redion/src/bereiche/bloecke/arten/zeichenflaeche. …`) — ungeprüft, mit Zitat
- · Bildschirm → Raum: drei Formeln neben der einen Matrix (`/home/user/Redion/src/core/sheet/space.ts:56-59, 93-104` ↔ `/home/user/Redion/src/bereiche/bloecke/arten/zeichenflaeche. …`) — ungeprüft, mit Zitat
- · distanceToSegment — zweimal im Kern selbst, Zeichen für Zeichen gleich (`/home/user/Redion/src/core/ink/geometry.ts:27-35` ↔ `/home/user/Redion/src/core/ink/shapes.ts:31-38`) — ungeprüft, mit Zitat
- · Punktprobe an einer Strecke, dritte Fassung (nur achsenparallel) (`/home/user/Redion/src/core/ink/geometry.ts:27 …` ↔ `/home/user/Redion/src/bereiche/elektro/simulation.ts:287-294 …`) — ungeprüft, mit Zitat
- · Kasten um eine Punktliste (min/max über xs/ys) (`/home/user/Redion/src/core/ink/geometry.ts:595-599 …` ↔ `/home/user/Redion/src/bereiche/bloecke/arten/zeichenflaeche. …`) — ungeprüft, mit Zitat
- · Union mehrerer Kästen für alles ins Bild (`/home/user/Redion/src/core/ink/geometry.ts:962-969 union` ↔ `/home/user/Redion/src/bereiche/bloecke/arten/zeichenflaeche. …`) — ungeprüft, mit Zitat
- · Wo ein Verbinder den Rand seines Kastens trifft — zwei Formeln für eine Aufgabe (`/home/user/Redion/src/bereiche/bloecke/arten/zeichenflaeche. …` ↔ `/home/user/Redion/src/bereiche/bloecke/arten/gedankenkarte.t …`) — ungeprüft, mit Zitat
- · Höhen-Griff am Block und Speichern der Höhe (`/home/user/Redion/src/bereiche/bloecke/arten/zeichenflaeche. …` ↔ `/home/user/Redion/src/bereiche/bloecke/arten/gedankenkarte.t …`) — ungeprüft, mit Zitat
- … 3 weitere in der Karte

**5 · Prüfläufe.** 36 genannt: `test541`, `test114`, `test539`, `test366`, `test367`, `test564`, `test561`, `test474`, `test447`, `test345`, `test201`, `test343`, `test352`, `test517` …

**6 · Kleinster nächster Schritt (Leser).** Zeiger→Raum an EINER weiteren Stelle auf SheetSpace.umrechner ziehen, ohne ein Datenfeld anzufassen: die Planfläche (planflaeche.ts:136-144 ortAus) und das Whiteboard (zeichenflaeche.ts:511-514 punkt) zeichnen beide in ein SVG mit viewBox (planflaeche.ts:138-140, zeichenflaeche.ts:245); getScreenCTM().inverse() liefert dort dieselbe Zahl wie heute — plus Rollstand, Zoom und CSS-Verwandlungen, die die Handformel nicht kennt (space.ts:26-27, AUDIT D2). Vorher der Wächter (§30, §50): ein Lauf, der die Fläche per CSS transform: scale(1.5) oder Browser-Zoom verzerrt und einen Punkt setzt — gegen den alten Stand rot (Strich landet daneben), mit dem Umrechner grün. Danach beim Speichern …

**7 · Daten- und Kompatibilitätsrisiken.**

- Vier Räume, verschiedene Felder: Blatt in PDF-Punkten mit raumVersion (space.ts:44, marken.ts:1949), Whiteboard in CSS-Pixeln OHNE raumVersion (zeichenflaeche.ts:202), Schaltplan in Rasterpunkten (schaltplan.ts:83-86), Gedankenkarte mit gerechneter Lage (gedankenkarte.ts:483). Eine gemeinsame Schicht, die Koordinaten vereinheitlicht, ist eine Datenmigration …
- Drei Drehfelder mit drei Bedeutungen: dreh an der Marke (geometry.ts:603, Grad, beliebig), gedreht an der Seite (space.ts:111-116, 0/90/180/270, nicht /Rotate der PDF) und drehung am Schaltplanteil (planflaeche.ts:534, 90°-Schritte). Zusammenlegen hiesse umbenennen = Sicherungen unlesbar (§53.3).
- Die räumlichen Felder sind untypisiert (src/core/types/ kennt weder marken noch shapes/karte/plan; folien.ts:46 type Marke = Record<string, any>) und in doku/REDION-FORMAT.md nicht beschrieben (AUDIT Z. 189-191) — eine gemeinsame Schicht ohne Typ verschiebt den Fehler nur.
- Undo: Verlauf.anwenden gibt beim Zurücknehmen allen Blöcken der Seite neue Kennungen (AUDIT Punkt 4; E682; test568 §3). Wer die vier eigenen Stapel durch Verlauf ersetzt, bricht Kennungen (§9, §14). Umgekehrt merkt befehle.ts:215 schon in Verlauf — eine Transaktion aus einem Zeichenblock würde doppelt gemerkt.
- Der Ausschnitt wird am Block gespeichert (zeichenflaeche.ts:517, gedankenkarte.ts:663) und hebt edited/Fassungen an — PDF hat sich aus genau diesem Grund für meta entschieden (document-mode.ts:41-48). Eine gemeinsame Viewport-Schicht muss das entscheiden, sonst zwei Wahrheiten (§8).
- … 5 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: keine offene Aufgabe für eine gemeinsame räumliche Schicht (grep räumlich/Whiteboard/Gedankenkarte/SelectionFlow/InkGeometry: nur Erledigtes — G41 densify und G42 umrechner 'Steht.' Z. 487-500, Dock-Welle erledigt mit E625 Z. 1195-1205). LUECKEN.md: L204 (Auswahl fängt bei null an) GESCHLOSSEN mit E646/E647, Z. 9880-9896 — SelectionFlow ist genau der Helfer. OFFEN und dieses System betreffend: L191 Z. …

---

### H · Register, Erweiterungspunkte, Automationen

→ Karte: `doku/karte/register.md`

**1 · Dateien.** `src/register/befehle.ts` (117), `src/register/bloecke.ts` (363), `src/register/eigenschaften.ts` (127), `src/register/ansichten.ts` (67), `src/register/einstellungen.ts` (171), `src/register/formeln.ts` (688) — und 24 weitere

**2 · Schnittstellen.** `Register.befehle.melde / meldeLieferant / nimmZurueck`, `Register.bloecke.melde / nimmZurueck`, `Register.eigenschaften.melde / nimmZurueck`, `Register.menueband.melde / meldeLieferant / nimmZurueck / nimmZurueckLieferant`, `Register.kontext.melde / meldeLieferant(bereich, fn) / meldeStapel / fuer(bereich)`, `Register.navigation.melde / Register.module.melde / Register.ansichten.melde / Register.einstellungen.melde / Register.formeln.melde / Register.tasten.melde / Register.vorlagen.melde / Register.verbindungen.melde / Register.fachzeichen.melde / Register.elektroformeln.melde`, `Redion (Schnittstelle einer Erweiterung)`, `Erweiterung.start / dialog / alleLaufen / gemeldet / knoepfeAnhaengen / angemeldet` …

**3 · Gemeinsam genutzt.** src/kern/ablage/indexdb.ts — Store.getMeta/setMeta (erweiterungen.ts:44-45, einstellungen.ts:136/157, werkzeuge.ts:51-54, protokoll.ts:134), Store.on/notify (erweiterungen.ts:448; indexdb.ts:55-56, 3069), Store.addBlock/addRow/childrenOf/getCollection/rowsOf/cache (erweiterungen.ts:91-131), Store.updateCollection (steuerung.ts:7989), Store.auftragPut/auftragAlle (maschine.ts:288, 299); src/kern/ereignisse/arten.ts + bus.ts — ARTEN.einstellungGeaendert (einstellungen.ts:159), ARTEN.auftrag* (maschine.ts:290), …

**4 · Echte Duplikate.** 8 gemeldet, 0 bestätigt, 0 verworfen, 8 ungeprüft.

- · Zwei Kataloge für die Befehlspalette: Erweiterungsbefehle gehen an Register.befehle vorbei (`src/bereiche/einstellungen/erweiterungen.ts:78-81` ↔ `src/bereiche/wissen/werkzeuge.ts:308-310 und …`) — ungeprüft, mit Zitat
- · Erweiterungs-Formeln hängen direkt in der Maschine, nicht im Formelregister — Formeleditor, Hilfe und abgleich() sehen sie nicht (`src/bereiche/einstellungen/erweiterungen.ts:179-182` ↔ `src/register/formeln.ts:633-639 und 677-684`) — ungeprüft, mit Zitat
- · Erweiterungs-Knöpfe: eigene DOM-Liste im Baum statt des vorgesehenen Anhängepunkts platz 'unten' im Navigationsregister (`src/bereiche/einstellungen/erweiterungen.ts:189-210` ↔ `src/register/navigation.ts:38-40, 423-429 und …`) — ungeprüft, mit Zitat
- · Drei Monkeypatches auf Store-Funktionen statt des vorhandenen Store.on-Hooks — Änderungs-Hook viermal verschieden gebaut (`src/bereiche/datenbanken/steuerung.ts:8812-8813 …` ↔ `src/kern/zustand/verlauf.ts:97-103, …`) — ungeprüft, mit Zitat
- · Zwei MCP-Werkzeugkataloge mit verschiedenen Namen und Zahlen (`src/bereiche/ki/werkzeuge.ts:163 (eigenerKatalog aus …` ↔ `server/kern.ts:1712-1750 (MCP_WERKZEUGE: seiten_suchen, …`) — ungeprüft, mit Zitat
- · Zwei Bezeichner ARTEN im selben Ordner kern/ereignisse — der lokale verdeckt den globalen (`src/kern/ereignisse/protokoll.ts:47` ↔ `src/kern/ereignisse/arten.ts:27, 124`) — ungeprüft, mit Zitat
- · Zwei Vorgaben für denselben Rang-Sortierschlüssel (`src/register/context.ts:170` ↔ `src/register/navigation.ts:444`) — ungeprüft, mit Zitat
- · Dieselbe Hilfsfunktion elVon(e) dreimal im System (und esc() ebenso) (`src/bereiche/einstellungen/erweiterungen.ts:35-39` ↔ `src/kern/ereignisse/protokoll.ts:39, …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 27 genannt: `test57`, `test86`, `test142`, `test272`, `test85`, `test422`, `test356`, `test280`, `test315`, `test316`, `test320`, `test334`, `test357`, `test41` …

**6 · Kleinster nächster Schritt (Leser).** Die drei Umgehungen der Erweiterung in die vorhandenen Register zurückführen — ohne neue Schnittstelle, ohne Datenänderung: (1) `Redion.befehl` in erweiterungen.ts:78-81 ruft zusätzlich `Register.befehle.melde({ titel, gruppe: 'Erweiterungen', tun: fn, von: name })` und `zuruecksetzen()` (Z.57-62) ruft `Register.befehle.nimmZurueck(titel)` für alles mit `von`; die Sonderschleife in wissen/werkzeuge.ts:308-310 entfällt dann (ein Katalog, §8). (2) `Redion.formel` (Z.74-77) meldet daneben `Register.formeln.melde({ name, gruppe: 'Sonstiges', was: 'Aus Erweiterung „' + name + '“', notion: false })`, und alleLaufen (Z.179-182) löscht beim Zurücksetzen die zuvor gesetzten Formula.F-Einträge (Liste …

**7 · Daten- und Kompatibilitätsrisiken.**

- Sicherheit (§19/§47, L30): Erweiterungscode läuft im selben Ursprung per new Function (erweiterungen.ts:166); ABGESCHIRMT (Z.154-158) ist eine Parameterliste, kein Ursprungswechsel — `eval` fehlt darin ausdrücklich (Z.159-160). Eine gemeinsame Schicht, die mehr Rechte durchreicht (z. B. Ereignisbus, Register.bloecke.melde), vergrössert diesen Zaun, bevor es …
- Datenherkunft: Redion.schreibe.block/seite/zeile schreiben über Store.addBlock/addRow (Z.115-131) ohne Vermerk, dass eine Erweiterung schrieb — `erstelltVon` bleibt der Nutzer (indexdb.ts addBlock). §21 verlangt für KI „rückgängig, versioniert, löschbar“; für Erweiterungen gilt heute nur das, was der Verlauf-Monkeypatch zufällig mitnimmt …
- Lebenszyklus heute falsch: `beimStart` läuft bei JEDEM alleLaufen (erweiterungen.ts:86; alleLaufen aus Toggle Z.342, Entfernen Z.351, Probelauf Z.417, Einbauen Z.434) — ein Start-Hook, der Seiten anlegt, legt sie mehrfach an. `beiAenderung` feuert nur, wenn start() bis Store.on kam (Z.448); start() steigt bei leerer Liste vor Store.on aus (Z.446) — eine …
- Abschalten ist unvollständig: `zuruecksetzen()` (Z.57-62) leert nur die vier RAM-Listen; Formula.F behält die Funktionen (Z.179-182 schreibt, niemand löscht), Store.on-Horcher bleibt registriert (kein off). Sieben Register haben kein nimmZurueck (ansichten.ts:66, einstellungen.ts:169, formeln.ts:686, tasten.ts:235, vorlagen.ts:90, verbindungen.ts:132, …
- Herkunft im Register: nur bloecke/eigenschaften merken `vonAussen` als Set von Kennungen (bloecke.ts:267, eigenschaften.ts:72), navigation als Flag (Z.427). Kein Register weiss, WELCHE Erweiterung einen Eintrag machte — ein Rücknahme-Manifest kann heute nichts zuordnen. Ein Feld `von` an jedem melde() ist Voraussetzung, keine Nebensache.
- … 7 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: zum Erweiterungssystem NICHTS (grep erweiterung|plugin|manifest|automation|ereignisbus → nur Z.193 „### 4 · Die Auftragsmaschine in einen Web Worker“ als offener Punkt und Z.264 ein Nebensatz). LUECKEN.md: L30 (Z.1116) „Erweiterungen und Marktplatz — BEWUSST NICHT GEBAUT“ (Wortlaut oben im Feld system); L16 (Z.603) „Automationen erweitern — ✅ komplett seit dem 9. August: 19 Aktionsarten · Bedingungen · …

---

### I · MCP, Server-API, CLI-Vorläufer

→ Karte: `doku/karte/mcp.md`

**1 · Dateien.** `src/bereiche/verbinden/schnittstelle.ts` (906), `src/dienst/sw.ts`, `src/kern/ablage/befehle.ts`, `src/bereiche/ki/werkzeuge.ts` (435), `server/kern.ts` (1838), `server/ablage.ts` (387) — und 18 weitere

**2 · Schnittstellen.** `Api`, `/v1/ im Browser`, `api-anfrage (SW ↔ Fenster)`, `Transaktion`, `MCP`, `Register.verbindungen 'mcp'`, `beantworte(anfrage, ablage, umwelt)`, `Server-Wege (HTTP)` …

**3 · Gemeinsam genutzt.** Store (src/kern/ablage/indexdb.ts) — getBlock Z.438, getCollection Z.942, childrenOf Z.762, rowsOf Z.666, addRow Z.1058, addPage Z.771, addBlock Z.391, addDatabase Z.890, updateBlock Z.440, updateCollection Z.977, setProp Z.1086, trashBlock Z.467, restoreBlock Z.486, getMeta Z.1139, setMeta Z.1115, uid Z.374, now Z.379, cache Z.255 — von Api (schnittstelle.ts) und Transaktion (befehle.ts) und MCP (werkzeuge.ts:51-55); Datenbank.wert (src/bereiche/datenbanken/dienst.ts:384) und Datenbank.gruppeTrifftZu …

**4 · Echte Duplikate.** 8 gemeldet, 0 bestätigt, 0 verworfen, 8 ungeprüft.

- · Das D1-Schema steht zweimal: als Datei und als Zeichenkette. Text ohne Kommentare gleich (gemessen), mit Kommentaren verschieden ab Zeile 112 („Die Bremse“-Kommentar). test87:560-602 bewacht die Tabellen und Spalten, nicht den Wortlaut. (`server/ablage.ts:23-24` ↔ `server/schema.sql:1`) — ungeprüft, mit Zitat
- · Pfad in Teile zerlegen — dieselbe Zeile in Browser-Api und Serverkern (`src/bereiche/verbinden/schnittstelle.ts:409` ↔ `server/kern.ts:194`) — ungeprüft, mit Zitat
- · Die Fassungsprüfung mit Notions Fehlertext — wörtlich zweimal (`src/bereiche/verbinden/schnittstelle.ts:427-431` ↔ `server/kern.ts:1605-1608`) — ungeprüft, mit Zitat
- · Zwei MCP-Werkzeugkataloge für dieselbe App (§8: keine doppelten Kataloge): der Server bietet vier `seiten_*`/`bereiche_zeigen`, der Browser bietet `notizen_*` aus Agent.WERKZEUGE — verschiedene Namen, Schemata und Rechteprüfung (`server/kern.ts:1706-1731` ↔ `src/bereiche/ki/werkzeuge.ts:163-171`) — ungeprüft, mit Zitat
- · Die Suche über `saetze` steht im Serverkern zweimal (v1 und MCP) — gleiche Schleife, andere Grenze (500/400) und Ausgabeform (`server/kern.ts:1683-1697` ↔ `server/kern.ts:1777-1793`) — ungeprüft, mit Zitat
- · Zwei CORS-Brücken mit zwei Allowlists, die auseinandergelaufen sind: lokal 11 Einträge, Cloudflare 18 (dazu gmail.googleapis.com, p04/p05-calendars.icloud.com, nominatim.openstreetmap.org, de./en.wikipedia.org, .icloud.com) (`bruecke.mts:28-33` ↔ `functions/api/bruecke.ts:24-42`) — ungeprüft, mit Zitat
- · `esc` je Datei neu — allein in src/bereiche/verbinden sechsmal (besprechung.ts:40, eingang.ts:41, kalender.ts:38, konten.ts:46, mail.ts:34, schnittstelle.ts:798) und in kern/helfer zweimal (tempo.ts:33, vorschau.ts:46); keine gemeinsame in src/core/helpers (grep → 0). Die Fassung der Api escapt KEIN `'` — §19 verlangt fünf Zeichen (`src/bereiche/verbinden/schnittstelle.ts:798-799` ↔ `src/kern/helfer/vorschau.ts:46 (und konten.ts:46 im selben …`) — ungeprüft, mit Zitat
- · `elVon` (Ereignisziel als Element) — 49 wörtliche Kopien im Projekt (grep -c 'const elVon = ' src → 49), auch im Kern (`src/bereiche/verbinden/schnittstelle.ts:37-38` ↔ `src/kern/ablage/befehle.ts:43-44 (und …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 31 genannt: `test68`, `test69`, `test70`, `test71`, `test74`, `test75`, `test76`, `test78`, `test79`, `test87`, `test92`, `test93`, `test94`, `test101` …

**6 · Kleinster nächster Schritt (Leser).** Zuerst ein `doctor`, das NICHTS an Daten anfasst: eine Datei `redion.mts` in der Wurzel (Node, `.mts` wie alle Werkzeuge, §54) mit einem einzigen Unterbefehl `doctor`, der die vorhandenen Prüf-Modi nacheinander ruft und ihre Rückgabe sammelt — `node dienststand.mts --pruefen`, `node chronik.mts --pruefen`, `node karte.mts --pruefen`, `npm run typecheck`, `node pruefungen/alle.mts 87 105 109 537` — und den Stand ausgibt (HEAD, Anzahl Läufe per `ls pruefungen/lauf/test*.mts | wc -l`, ob `.volllauf-stand.json` einen offenen Sweep hat, ob `redion-einzeldatei.html` älter ist als `quell/`). Das ist reine Orchestrierung bestehender Werkzeuge: kein neuer Datenpfad, keine Datenform, kein Risiko aus …

**7 · Daten- und Kompatibilitätsrisiken.**

- DREI DATENFORMEN, EINE WAHRHEIT? Browser-/v1/ liefert Notions Form (seiteRaus, schnittstelle.ts:213-232), Server-/v1/ liefert das rohe Redion-JSON aus `saetze.daten` (kern.ts:1659-1660), MCP am Server liefert `s.daten` als Text (Z.1802). Eine gemeinsame Schicht muss EINE dieser Formen zur Vertragsform machen; wer sie vom Server nimmt, bekommt …
- DER SERVER SCHREIBT OHNE STORE-SEMANTIK. PATCH /v1/pages mischt `properties` in `daten` (kern.ts:1666-1668) — ein Feld, das RedionBlock nicht kennt (src/core/types/block.ts: `props`), und MCP `seite_anlegen` schreibt `{type:'page', text, inhalt, parentId}` ohne `content`, `alive`, `created`, `erstelltVon` (kern.ts:1815-1818). Der Abgleich holt diese Sätze …
- EIN CLI HAT KEINEN DATENPFAD OHNE FENSTER: IndexedDB liegt im Browser; der SW antwortet 503, wenn kein Fenster offen ist (sw.ts:375-380). Ein Node-CLI erreicht die Daten nur über (a) einen laufenden Browser, (b) den Server — nur unverschlüsselte Sätze, nur mit Konto (kern.ts:1656: 409 `verschluesselt`), oder (c) die Sicherungsdatei. Eine „gemeinsame …
- SCHREIBEN ÜBER DIE API ZEICHNET DIE OBERFLÄCHE: jede Schreiboperation ruft `App.zeichneSeite()`/`App.zeichneBaum()` (schnittstelle.ts:502, 527, 565, 573, 585, 605, 626, 641, 655, 734). In einem Kontext ohne `App` (Kopfloser Aufruf, Worker) wirft das nach dem Schreiben — Daten sind dann geändert, die Antwort ist ein 500 (Z.538-539).
- `apiToken` UND DIE SICHERUNG: E279/L76 nehmen `wolkeToken`, `wolkeProbe` und `api:*` aus .json/.redion heraus; der Schlüssel der /v1/-Schnittstelle heisst `apiToken` (schnittstelle.ts:53) und passt nicht auf `api:*`. Ob er in einer offenen Sicherung mitreist, ist NICHT gemessen — zu prüfen, bevor eine Schicht ihn wiederverwendet.
- … 7 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: §1 „Cloudflare wirklich aufsetzen — braucht Redur“ (Z.102-120): geschrieben und geprüft (test113, test118-120), nie gegen echtes D1/R2; §2 „Der Cloud-Arbeitsbereich als eigenes Konzept“ (Z.124-133, setzt §1 voraus). Kein Eintrag zu CLI, MCP oder /v1/ (grep -i 'MCP|/v1|Kommandozeile|CLI' AUFGABEN.md → nur Zeichen-„Marke“-Treffer). LUECKEN.md: L7 Konto-Modus (Z.266-283) — offen bleibt der …

---

### J · Abgleich, Anhänge, Stücke

→ Karte: `doku/karte/sync.md`

**1 · Dateien.** `src/kern/abgleich/maschine.ts` (1181), `src/kern/abgleich/zusammenfuehren.ts` (524), `src/bereiche/dateien/ablage.ts` (483), `src/kern/ablage/indexdb.ts` (3071), `server/kern.ts`, `server/dateien.ts` — und 4 weitere

**2 · Schnittstellen.** `Wolke`, `Zusammen`, `Dateien`, `Store.basis*/vorrat*/stueck*/datei*/…Grabstein*`, `Store.on('import') / Ereignisse.horche(ARTEN.einstellungGeaendert)`, `POST /sync/hoch, /sync/runter`, `POST /datei/melden, /datei/stueck, /datei/runter, /datei/stand, /datei/weg`, `Register.einstellungen.setze('wolkeTakt')` …

**3 · Gemeinsam genutzt.** src/kern/ablage/indexdb.ts — `Store` (cache.blocks/collections/views, getMeta/setMeta, rohSetzen, basis*/vorrat*/stueck*/datei*, Grabstein-Helfer, metaListeAendern); src/core/helpers/bytes.ts — `Bytes.toBase64/fromBase64` (maschine.ts:183, 188, 1006, 1063); src/kern/konstanten (KONSTANTEN.SERVER_DATEI_MAX, STUECK, KLEIN, DATEI_MAX) — maschine.ts:53, ablage.ts:52–56; src/core/import/zipdetails.ts — `ZipDetails.crc32*` für den .redion-Packer (ausgeben.ts:52–71); src/kern/ereignisse (Ereignisse.horche, …

**4 · Echte Duplikate.** 6 gemeldet, 0 bestätigt, 0 verworfen, 6 ungeprüft.

- · Seite eines Blocks bestimmen (Elternkette bis 40 Stufen, Zeile ausgenommen) (`/home/user/Redion/src/kern/abgleich/maschine.ts:423–433` ↔ `/home/user/Redion/src/kern/ablage/indexdb.ts:629–639 …`) — ungeprüft, mit Zitat
- · LCS-Tabelle für den Wortvergleich (tab/setzeTab, Uint32Array vs Int32Array) (`/home/user/Redion/src/kern/abgleich/zusammenfuehren.ts:88–94` ↔ `/home/user/Redion/src/bereiche/seiten/ansicht/fassungen.ts:8 …`) — ungeprüft, mit Zitat
- · AES-GCM verschlüsseln/entschlüsseln mit 12-Byte-IV vorangestellt — einmal für Text (Base64), einmal für Bytes (`/home/user/Redion/src/kern/abgleich/maschine.ts:172–194 …` ↔ `/home/user/Redion/src/kern/abgleich/maschine.ts:901–919 …`) — ungeprüft, mit Zitat
- · esc()-Helfer (4-Zeichen-Fassung ohne Apostroph) je Modul statt gemeinsam (`/home/user/Redion/src/kern/abgleich/zusammenfuehren.ts:51–52 …` ↔ `/home/user/Redion/src/kern/zugang/rechte.ts:39, …`) — ungeprüft, mit Zitat
- · Obergrenze für Server-Anhänge (100 MB) an zwei Orten (`/home/user/Redion/src/kern/abgleich/maschine.ts:53–55 …` ↔ `/home/user/Redion/server/dateien.ts:41 (`export const …`) — ungeprüft, mit Zitat
- · Der Wettlauf-Wächter `wegOffen` (vorgemerkte Löschungen nicht wiederbeleben) zweimal ausgeschrieben (`/home/user/Redion/src/kern/abgleich/maschine.ts:663–665 …` ↔ `/home/user/Redion/src/kern/abgleich/maschine.ts:974–976 …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 20 genannt: `test77`, `test78`, `test113`, `test118`, `test119`, `test76`, `test256`, `test261`, `test273`, `test308`, `test333`, `test96`, `test100`, `test144` …

**6 · Kleinster nächster Schritt (Leser).** L132 schliessen: `abgleichen()` (src/kern/abgleich/maschine.ts:809–811) gibt statt viermal `null` einen kleinen Ergebnistyp zurück (§52.12), z. B. { ok:false, grund:'nicht-angemeldet'|'kein-bereich'|'laeuft'|'nicht-erlaubt'|'frage-offen' }; die drei Aufrufer in src/bereiche/verbinden/ansicht/wolke.ts:127/445/709 und einstellungen/pwa.ts:784 anpassen; test261 §4 als Wächter erweitern (rot sehen mit altem Stand). Kein Datenmodell wird berührt, aber die Grundlage für alles Weitere (On-Demand, Zwei-Tab-plus-Wolke) ist ein Abgleich, der sagen kann, warum er nichts tat. Danach als zweiter, ebenso kleiner Schritt: `abgeleitet` in src/core/types/file.ts:33 und suchindex/auftraege in …

**7 · Daten- und Kompatibilitätsrisiken.**

- Basis ist der Serverstand als JSON-String (indexdb.ts:2885, maschine.ts:730 „Basis ist immer der Serverstand“). Wer eine gemeinsame Schicht mit anderem Basis-Modell einzieht, macht jeden bestehenden basis-Eintrag falsch — ein Drei-Wege-Merge gegen eine falsche Basis „führt Dinge zusammen, die nie zusammengehörten“ (indexdb.ts:2387–2390). Migration nur mit …
- Version ist nur `wolkeVersion` (Zahl, vom Server vergeben, maschine.ts:684) plus `edited`-ISO-String; Gerät steht nur serverseitig (`vonGeraet`, server/kern.ts:859), NICHT am lokalen Satz. Für CRDT/Vektor-Uhren müsste jeder Satz eine Geräte-Kennung und eine Zähler-Uhr tragen — ein neues Feld auf 100 % der Blöcke, also Datenmigration (§53.3) und Änderung der …
- Die Konfliktregel am Server ist Last-Writer-Wins pro Satz (server/kern.ts:825–833: kleinere Version oder gleiche Version mit älterem `geaendert` → 'veraltet'); das Drei-Wege-Merge lebt nur im Client (runterEinmal Z.705–707). Eine CRDT-Schicht müsste beide Seiten ändern; ein halber Umbau lässt Sätze in Runde 1 abweisen, die der Client in Runde 2 als Konflikt …
- Grabsteine sind meta-Listen (`wolkeBloeckeWeg`, `wolkeDateienWeg`), nicht Sätze; ein Grabstein wird nur geschrieben, wenn `basis` den Satz kennt (maschine.ts:616–617) bzw. `wolkeDateienOben` die Datei führt (indexdb.ts:2840). Eine gemeinsame Schicht, die basis oder Oben-Set anders befüllt, macht die Wache blind — dann bleiben Löschungen auf dem Server für …
- Ein Anhang gilt erst mit `zustand:'fertig'` und `stuecke.length === teile` als Datei; `alsBlob` gibt sonst null (ablage.ts:214–222). Einen Zustand „nur in der Wolke“ gibt es NICHT: dateienRunter lädt eifrig jedes Stück (maschine.ts:997–1015) und legt den Dateisatz erst an, wenn alles da ist. On-Demand bräuchte einen vierten UploadState (z. B. 'entfernt') in …
- … 4 weitere in der Karte

**Doku-Stand.** LUECKEN.md: L5 (Z.218) Sync-Konflikte „✅ geprüft“, verweist auf L6. L6 (Z.240) Anhänge in R2 — DREI offene Reste (Z.263–268): „✗ Der Download ist eifrig — ein ‚nur bei Bedarf‘ ist eine eigene Entscheidung“, „✗ .redion-Archiv in R2 als Cloud-Sicherung“, „✗ Dateien über 100 MB bleiben bewusst lokal (E33)“. L75 (Z.2067) Merklisten bei mehreren Tabs — HALB GESCHLOSSEN durch E341: offen bleibt „die Liste ist weiterhin …

---

### K · Import, Export, .redion, Sicherung

→ Karte: `doku/karte/export.md`

**1 · Dateien.** `src/kern/ablage/indexdb.ts` (3071), `src/schale/aufbau/schale.ts` (4582), `src/kern/ablage/umzuege.ts` (371), `src/core/types/backup.ts` (156), `src/core/import/sicherheit.ts` (269), `src/core/import/validierung.ts` (205) — und 12 weitere

**2 · Schnittstellen.** `Store.exportAll(mitAnhaengen=false, mitGeheimnissen=false) → string`, `Store.exportVorbereiten() → {versionen, dateien, …}`, `Store.importAll(json, 'ersetzen'|'zusammenfuehren') → ImportReport`, `Store.dateiAlle/dateiPut/dateiWeg/stueckPut/stueckeVon/stueckWeg`, `Umzuege.{FASSUNGEN, JETZIGE, INHALT, faecher, zwischen, hinweisZuAlt, laufen, gelaufen, zuruecksetzen}`, `ImportSicherheit.{lesen, entgiften, verzeichnis, satz, …}`, `ImportValidierung.{pruefen, brauchtRueckfrage, saetze, FAECHER}`, `ImportVergleich.{rechnen, satz, warnt, kern}` …

**3 · Gemeinsam genutzt.** `Store` (src/kern/ablage/indexdb.ts): exportAll/exportVorbereiten/importAll (schale.ts:2155-2177, 2530; krypto.ts:248, 319, 542), dateiAlle/dateiPut/dateiWeg/stueckPut/stueckeVon/stueckWeg (schale.ts:2174, 2357-2400), getMeta/setMeta (ordnersicherung.ts:73-78, sicherung.ts:46), cache (umzuege.ts:216-262); `Umzuege` (src/kern/ablage/umzuege.ts): JETZIGE als Formatfassung (indexdb.ts:51), laufen (indexdb.ts:356, 2439); `ImportSicherheit`, `ImportValidierung`, `ImportVergleich` (src/core/import/): … **Nur genannt, nicht benutzt:** `Register`: NICHT benutzt in diesem System (grep Register\. in den Systemdateien → 0; schale.ts:1733-1738 Register.bloecke gehört zum Editor-Teil der Schale). `Verlauf`, `Ereignis`-Bus: nicht benutzt; indexdb.ts:2446/2450 nutzen die Store-internen notify/meldeAnAndereFenster

**4 · Echte Duplikate.** 7 gemeldet, 0 bestätigt, 0 verworfen, 7 ungeprüft.

- · Dateinamen-Säuberung nach der Regel aus REDION-FORMAT.md:196-197 (`\ / : * ? " < > |` → `-`) — acht Stellen, kein Helfer in src/core/helpers (grep dateiname|sauber|safeName in core/helpers, kern/helfer → nur ordnersicherung.ts:187 zeitAus) (`src/schale/aufbau/schale.ts:2186 (Archivname im .redion); …` ↔ `src/bereiche/datenbanken/steuerung.ts:4025; …`) — ungeprüft, mit Zitat
- · Eine dritte Fassung derselben Namensregel für Vault-Segmente (Zeichenklasse gleich, Ersatz Leerzeichen statt `-`, dazu Windows-Reservierte) neben der Pfadnormalisierung im Bereich wissen (`src/bereiche/dateien/ausgeben.ts:1765-1771 safeVaultSegment` ↔ `src/bereiche/wissen/verweise.ts:153-156 …`) — ungeprüft, mit Zitat
- · `elVon` (Event-Ziel als Element) wortgleich in 22 Dateien, darunter zwei dieses Systems (`src/bereiche/dateien/format.ts:36-37; …` ↔ `src/bereiche/editor/ansicht/editor.ts:28 (System A) und 19 …`) — ungeprüft, mit Zitat
- · Eigene `esc`-Funktion im Austausch (ohne `'`, also nicht die §19-Fassung) neben fünf Kern-Fassungen (`src/bereiche/dateien/ausgeben.ts:38-40` ↔ `src/kern/abgleich/zusammenfuehren.ts:51; …`) — ungeprüft, mit Zitat
- · Die Sicherheitskopie vor dem Ersetzen existiert zweimal (offener Weg in der Schale, verschlüsselter Weg in Krypto) — die Schale sagt es selbst (`src/schale/aufbau/schale.ts:2496-2519 (`sicherungSpeichern` …` ↔ `src/kern/sicherheit/krypto.ts:935 (laut Kommentar in …`) — ungeprüft, mit Zitat
- · INNERHALB des Systems: die Suche nach dem ZIP-Schlusssatz (EOCD 0x06054b50) steht zweimal — einmal über ArrayBuffer, einmal über ein Blob-Fenster; beide mit eigener Fehlermeldung (`src/bereiche/dateien/einlesen.ts:157-161 (zipLesen)` ↔ `src/bereiche/dateien/einlesen.ts:292-296 (zipLesenAusBlob) …`) — ungeprüft, mit Zitat
- · INNERHALB des Systems: zwei MIME-Tafeln nach Dateiendung (`src/bereiche/dateien/archiveImport.ts:75-80 (`MIME: …` ↔ `src/bereiche/dateien/ausgeben.ts:2189 (Notion-ZIP: `pdf: { …`) — ungeprüft, mit Zitat

**5 · Prüfläufe.** 43 genannt: `test96`, `test100`, `test103`, `test104`, `test148`, `test152`, `test144`, `test185`, `test180`, `test199`, `test200`, `test85`, `test95`, `test227` …

**6 · Kleinster nächster Schritt (Leser).** Zwei reine, datenformat-neutrale Schritte, beide ohne Browser prüfbar: (1) Die Dateinamen-Regel aus REDION-FORMAT.md:196-197 als EINEN Helfer nach `src/core/helpers/` ziehen (Ersatz `-`, Kollision `-2` vor der Endung, wie schale.ts:2186-2196) und die acht Stellen (schale.ts:2186; ausgeben.ts:902, 1011, 1334, 1490, 2929; datenbanken/steuerung.ts:4025; spreadsheet/ansicht.ts:1718) darauf umstellen — mit einem Node-Lauf im Stil von test103, der vorher gegen den alten Stand rot war (§50), und `test100` danach (Archivnamen in `zuordnung` bleiben byteweise gleich). (2) `doku/REDION-FORMAT.md:425-442` „Was noch fehlt“ und Z.63-68 auf den Stand bringen: ZIP64 (E39/L14) und verschlüsseltes `.redion` …

**7 · Daten- und Kompatibilitätsrisiken.**

- Feldnamen sind Daten: `enthaelt`, `fehlt`, `hinweis`, `exportiert`, `zuordnung`, `saetze`, `abgeleitetAusgelassen` stehen wörtlich in jeder geschriebenen Sicherung (backup.ts:14-18); eine gemeinsame Schicht darf Typen englisch benennen, Felder nie (§53.3).
- Die Formatfassung IST die Ablagefassung (indexdb.ts:51 `VERSION = Umzuege.JETZIGE`): wer einen Umzug anlegt, hebt das Manifest an; ältere Geräte warnen dann beim Einspielen (validierung.ts:139-144). Eine getrennte Formatfassung wäre eine Datenmigration der Manifeste.
- Der `.redion`-Packer/Leser liegt in der SCHALE (schale.ts:2148-2545), nicht im Kern; `OrdnerSicherung` (kern/helfer, Z.277/301) und `Krypto` (kern/sicherheit, Z.595/618) hängen daran. Eine gemeinsame Schicht muss drei Aufrufer gleichzeitig umziehen, sonst laufen offene, verschlüsselte und automatische Sicherung auseinander — genau der Fehler aus …
- Blöcke, Sammlungen, Ansichten, Versionen und Dateisätze behalten ihre Kennungen (indexdb.ts:2274-2279; schale.ts:2357-2374). Jede Schicht, die beim Einlesen neue IDs vergibt (wie `Store.baumEinfuegen`, das `delete patch.id` macht), trennt Blöcke von ihren `dateiId`s (§14) und bricht test100 Z.291-295 und E174.
- 'ersetzen' löscht Anhänge NUR bei einem `.redion` mit `dateien.json` (schale.ts:2394-2404); `.json` darf das nie (E5/E40, test100 Z.371). Eine Schicht, die beide Wege vereinheitlicht, muss diese Asymmetrie tragen.
- … 8 weitere in der Karte

**Doku-Stand.** AUFGABEN.md: kein offener Eintrag zu diesem System (grep '\\.redion|exportAll|importAll|obsidian|umzuege|backup|sicherung' → nur Nebentreffer). Verbindlich dort: „Bei Backup, Import oder Export: node pruefungen/alle.mts 96 100“ (Z.771-775) und Regel 5 „Feldnamen gespeicherter Daten sind keine Namensfrage, sondern eine Migrationsfrage“ (Z.807-808). Obsidian steht nur in der Visionskarte (Z.819-861, „Tägliche Notizen …

---

## 5b. Die Referenzen — nur gelesen

### SiYuan — AGPL-3.0 — keine Codeübernahme möglich

→ Karte: `doku/karte/referenz-siyuan.md`

**projekt.** SiYuan (siyuan-note/siyuan, Stand master), gelesen unter /tmp/claude-0/-home-user-Redion/335e0b62-b7b3-584b-833c-06316662b1d1/scratchpad/ref/siyuan/siyuan-master. Wissensnotiz im Obsidian-Format (damit beim nächsten Mal nicht alles neu gelesen werden muss): /tmp/claude-0/-home-user-Redion/335e0b62-b7b3-584b-833c-06316662b1d1/scratchpad/ref/wissen/SiYuan-Referenzstudie.md — liegt ausserhalb des Projekts; keine Redion-Datei wurde geändert.

**lizenz.** AGPL-3.0 (LICENSE Zeile 1–2). Nur Lesequelle: kein Code wird übernommen, nur Ideen.

**befunde.**
- {"thema": "1 · Plugin-API und Lebenszyklus", "wo": "app/src/plugin/index.ts (756 Z.), loader.ts (413), lifecycle.ts (669), uninstall.ts (154), Setting.ts (107), API.ts (454), kernel.ts; kernel/plugin/api_plugin.go, sandbox.go; kernel/model/plugin.go", "wie": "Basisklasse `Plugin` (index.ts:61) …
- {"thema": "2 · EventBus", "wo": "app/src/plugin/EventBusCore.ts (203 Z.), EventBus.ts (33), app/src/types/index.d.ts:10–29", "wie": "`EventBus` ist eine Hülle um einen `EventTarget` (EventBusCore.ts:23–37); `emit` erzeugt `new CustomEvent(type, {detail, cancelable: true})` (:131–136), Rückgabe ist …
- {"thema": "3 · Paket-Metadaten (plugin.json) und Bazaar/Marktplatz", "wo": "kernel/bazaar/package.go, plugin.go, bazaar.go, stage.go, index.go, install.go; kernel/model/plugin.go; kernel/util/cloud.go:83; docs/PLUGIN-PUBLISH.md", "wie": "plugin.json ist die Go-Struktur `Package` …
- {"thema": "4 · Kernel-API (router.go), Gruppen und Auth", "wo": "kernel/api/router.go (747 Z.), kernel/model/session.go:183–470, kernel/server/serve.go, docs/API.md:103–152, kernel/model/transaction.go", "wie": "`ServeAPI(ginServer)` (router.go:29) registriert jede Route einzeln als …
- {"thema": "5 · Headless / CLI / Docker", "wo": "kernel/main.go, kernel/cli/cmd/*.go (root.go, serve.go, sql.go, sync.go, repo.go, export.go, …), kernel/util/working.go:110–160, Dockerfile, kernel/entrypoint.sh, kernel/server/serve.go:140–220, docs/SY-FORMAT.md §0.5", "wie": "`main.go:24–30` ruft …
- {"thema": "6 · SQL über eigene Daten (Schema, eingebettete Abfragen, Wächter)", "wo": "kernel/sql/database.go:152–300 und :2065–2087, kernel/sql/block.go:39–61, upsert.go, queue.go, index_queue.go, stmt_validate.go, query_limit.go, block_query.go:434–475; kernel/model/search.go:322–420; …

---

### AFFiNE / BlockSuite — MIT (blocksuite, framework/std); packages/backend unter eigener Lizenz — nicht übernommen

→ Karte: `doku/karte/referenz-affine.md`

**projekt.** AFFiNE / BlockSuite (Archiv: /tmp/claude-0/-home-user-Redion/335e0b62-b7b3-584b-833c-06316662b1d1/scratchpad/ref/affine/AFFiNE-canary, Pfade unten relativ zu dessen Unterordner blocksuite/). Obsidian-Notiz mit allen Befunden und [[Wikilinks]] angelegt unter /tmp/claude-0/-home-user-Redion/335e0b62-b7b3-584b-833c-06316662b1d1/scratchpad/ref/affine/obsidian/AFFiNE-BlockSuite-GFX.md (189 Zeilen, ausserhalb des Projekts — Redurs Wunsch „obsidian/graph-Datei, damit nicht alles neu gelesen werden muss"; ob sie nach doku/ wandert, entscheidet Redur, §43). Im Projekt /home/user/Redion wurde keine …

**lizenz.** MIT für blocksuite/** und die meisten Pakete (LICENSE-MIT im Archivwurzel; package.json von framework/global:49, framework/store:11, affine/model:11, affine/gfx/pointer:11 sagen "MIT"). Ausnahme laut LICENSE:5-7: packages/backend und packages/common/native stehen unter der AFFiNE-Enterprise-Edition-Lizenz (packages/backend/server/LICENSE:1-12) — nicht gelesen, nicht gebraucht. Eingebettete Drittkopie perfect-freehand mit eigener LICENSE unter framework/global/src/gfx/perfect-freehand/. Nur Lesequelle; kein Code wird übernommen.

**befunde.**
- {"thema": "(1a) Mathematik-Primitive: Bound, Vec, PointLocation, XYWH — und KEINE Matrix-Klasse", "wo": "framework/global/src/gfx/ (3641 Zeilen): xywh.ts:4-29, model/bound.ts:57-373, model/vec.ts:4-601, model/point-location.ts:7-94, model/point.ts:8-268, math.ts:5-569, bound.ts:20-175, …
- {"thema": "(1b) GfxController, Viewport, GridManager (Treffprüfung), LayerManager (Z-Ordnung)", "wo": "framework/std/src/gfx/controller.ts:33-284, viewport.ts:140-925, viewport-element.ts:764-800, grid.ts:18-513, layer.ts:31-1014, utils/layer.ts:30-135, extension.ts:15-53, tool/tool.ts:11-125", …
- {"thema": "(2a) Modellbasis: GfxCompatibleInterface, Block-Element vs. Surface-Element, Dekoratoren field/local/derive/convert/watch/observe", "wo": "framework/std/src/gfx/model/base.ts:17-173, model/model.ts:8-18, model/gfx-block-model.ts:32-315, model/surface/element-model.ts:51-617, …
- {"thema": "(2b) SurfaceBlockModel: das Fach aller Canvas-Elemente, Typ-Register, Yjs-Bindung, Gruppen-Rückwärtsindex", "wo": "framework/std/src/gfx/model/surface/surface-model.ts:27-940; framework/std/src/gfx/surface-middleware.ts", "wie": "Der Surface-Block hat EINE Eigenschaft: `elements: …
- {"thema": "(2c) Die Elementarten: Shape, Text, Brush, Connector, Group, Mindmap, Frame — Felder und Serialisierung", "wo": "affine/model/src/elements/shape/shape.ts:35-260, text/text.ts:22-92, brush/brush.ts:30-216, connector/connector.ts:44-529, group/group.ts:17-141, mindmap/mindmap.ts:31-142 und …
- {"thema": "(3) Ein Dokument, zwei Ansichten: Root-Block, Note-Block als Seite UND als Kasten, Surface-Ref, Edgeless-Text", "wo": "affine/model/src/blocks/root/root-block-model.ts:8-63, blocks/note/note-model.ts:55-167, consts/note.ts:5-42, blocks/edgeless-text/edgeless-text-model.ts:27-77, …

---

---

## 6. Datenrisiken — gesammelt und nach §46 geordnet

| Nr. | Risiko | Woher | Was fehlt |
|---|---|---|---|
| R1 | Seitenverlauf vergibt frische Kennungen und purgt die alten Blöcke. **Nachgemessen (messungen.md, 25. September):** ein Bild überlebt (Dateisatz wird umgehängt); eine **Unterseite** verliert Kennung und Fassungen (1 → 0), ein Favorit zeigt ins Leere | 2.4 (gemessen), `indexdb.ts:2508`, `verlauf.ts:58-67`, `test70.mts:351-352`, zwei Sonden | ein Wächter „Kennungen und Fassungen überleben Strg+Z", `Verlauf.anwenden`, das abgleicht statt purgt — Bogen 2, von Redur freigegeben |
| R2 | Strg+Z doppelt (Block + Seite) in Planfläche und Marken; Whiteboard ohne Taste | 2.4 (gemessen) | test568 + eine Zeile in der Schale (2.7) |
| R3 | Whiteboard-Koordinaten ohne `raumVersion` | `space.ts:26-30`, `zeichenflaeche.ts` | vor jeder Formeländerung eine Version |
| R4 | `esc` 54× ohne Apostroph | D5 | ein Helfer, ein Wächter (test87 prüft heute `esc` an einer Stelle) |

| R5 | **Erweiterungen laufen heute im selben Ursprung per `new Function`** (`erweiterungen.ts:166`); `beimStart` läuft bei jedem `alleLaufen`; was eine Erweiterung schreibt, heisst `erstelltVon` = Nutzer | Leser H, 3.2 | Sandbox oder Abschaltung, bevor Priorität 2 weitergeht — Redurs Entscheidung nach E683 |
| R6 | **Der Server schreibt halbe Blöcke**: `PATCH /v1/pages` mischt `properties` in `daten`, MCP `seite_anlegen` ohne `content`/`alive`/`created` | Leser I, 4.3 | ein Wächter gegen den Prüfserver, dann Store-Semantik am Server (§17) |
| R7 | **Sperren rechnet den Dateianspruch nach dem Purge** — löscht Sperren einer Seite mit Bild die Bytes? | Richter zu E684, L213 | messen, bevor irgendein Bogen `sperren` anfasst |
| R8 | **`baumEinfuegen` übernimmt `edited`/`created`** — Duplikate älter als die Marke kämen nie zum Server | Richter zu E684, L214 | messen mit `Abgleich.zuSchicken()` |
| R9 | **`baum` hängt die Sammlung auch an verknüpfte Ansichten** — Duplizieren kopiert die Datenbank | Richter zu E684, L215 | duplizieren, Sammlungen zählen |
| R10 | **Der frische `.pptx`-Export verliert die Marken** einer selbst gebauten Präsentation (`ausgeben.ts:2994-3001`, `'[A4-Blatt]'` je Folie) | Leser E | Wächter aus `Folienvorlagen.neuePraesentation('titel')`, der im `slide1.xml` den Titel erwartet — muss zuerst rot sein |
| R11 | **E600 fehlt in `ENTSCHEIDUNGEN.md`** (im Verzeichnis „vergeben", im Text nicht da), und AUFGABEN/L151 sagen, Übergänge würden nicht gelesen — sie werden es seit `einlesen.ts:1442` | Leser E | Doku vor Code |
| R12 | **Vier Räume, drei Drehfelder, keine Typen**: Blatt in Punkten mit `raumVersion`, Whiteboard in CSS-Pixeln ohne, Schaltplan im Raster, Gedankenkarte gerechnet; `dreh`/`gedreht`/`drehung` mit drei Bedeutungen; `src/core/types/` kennt weder `marken` noch `shapes`/`karte`/`plan` | Leser G | Typen zuerst (noEmit, ändert nichts), dann Bogen 3 |
| R13 | **Der `.redion`-Packer liegt in der Schale** (`schale.ts:2148-2545`), nicht im Kern; `OrdnerSicherung` und `Krypto` hängen daran | Leser K | drei Aufrufer gleichzeitig umziehen oder gar nicht |
| R14 | **`abgleichen()` kehrt viermal still mit `null` um** (L132) | Leser J | ein Ergebnistyp (§52.12), Wächter in `test261 §4` |
| R15 | **Erweiterungspunkt `Register.verbindungen 'mcp'` prüft `meta('mcpServer')`, MCP speichert unter `mcp:server`** | Leser I, Z. 51 | nicht gemessen, ob die Verbindung je „bereit" meldet |

*Die Kennzeichnung „Leser X" heisst: gelesen mit Datei:Zeile, nicht gemessen — so, wie es in der Karte steht.*

---

## 7. Fragen an Redur — und was er am selben Tag entschieden hat

Redur hat gebeten, gefragt zu werden. Stand am Abend des 25. September:

- **Frage 2 (Reihenfolge) — entschieden:** „ja mach so weiter wie du
  vorschlägst" → E682 (Strg+Z), E684/E685 (Kennungen), dann `raumVersion`,
  dann der gemeinsame Verlauf, dann die gemeinsame Leiste (W6).
- **Frage 3 (`raumVersion`) — entschieden:** „für die 3. ja whiteboard
  eine raumversion".
- **Frage 1 (L30) — Regel entschieden, Plugins offen:** E683/§57
  („Fremder Code darf in Redion, wenn er Redion verbessert … vorher
  fragen … `FREMDCODE.md`"). Für Plugins, die ein Nutzer einspielt, gilt
  die Sandbox-Bedingung weiter; der Vorschlag „eng öffnen — erst Pakete
  aus Daten über die Register, Sandbox-Plugins später" steht, und die
  vorhandene Erweiterung (3.2, R5) gehört zuerst in die Register
  zurückgeführt.
- **Neu dazu:** W6 — „ich will so was haben wie die affine" ·
  „integriere alles zusammen": eine Leiste, ein Verlauf, ein Raum für alle
  Flächen.

Die Fragen, wie sie am Mittag standen:

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

## Anhang D · Was kein Leser gesehen hat (eigene Vollständigkeitsprüfung)

Der Vollständigkeitsprüfer des Workflows lief nicht (Sitzungsgrenze). Also
von Hand, am 25. September: jeder Quellordner gegen die `hauptdateien` der
elf Leser. **29 von 53 Ordnern** haben einen Leser; diese 24 nicht:

```txt
src/bereiche/chronik        4970    src/core/knowledge     960    src/core/text          132
src/bereiche/spreadsheet    2270    src/kern/zugang        902    src/fremd              114
src/schale/ueberlagerung    1703    src/core/jobs          785    (Zeilen .ts, je Ordner)
src/bereiche/hilfe          1553    src/core/ai            652
src/core/spreadsheet        1220    src/core/calendar      601
src/core/learning           1002    src/bereiche/planen    565
                                    src/core/orb           487
src/kern/einstellung         443    src/core/export        381
src/kern/suche               406    src/core/electrical    369
src/bereiche/seiten          343    src/core/planning      328
src/core/security            295    src/bereiche/erwaehnungen 276
src/bereiche/kommentare      264
                                    ungelesen gesamt: 21 021 Zeilen
```

Keiner davon ist ein räumliches System oder ein Erweiterungspunkt — der
Auftrag hat sie deshalb nicht verlangt. Zwei fallen trotzdem auf:
`src/core/security` (295 Zeilen, dort liegt `Sanitize.escapeText`, das
68 Kopien von `esc` ersetzen könnte) und `src/core/orb` (487 Zeilen, eine
zweite `geometry.ts`, die Leser A neben `core/ink/geometry.ts` gefunden
hat). Beides gehört in den nächsten Durchgang.
