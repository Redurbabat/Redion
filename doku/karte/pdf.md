<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, pdf]
stand: 25. September 2026
head: 1b89c01
---

# D · PDF-Schreibstudio und Ink

D · PDF-Schreibstudio und Ink — Blockarten `blatt` und `pdfseite`; globale Namen `Marken` (Zeichenschicht), `DocumentMode` (Schreibstudio), `PdfSeite`, `PdfLeser` (einzige pdf.js-Stelle), `PdfEinlesen`, `InkRuler`, `InkMenu`; Kerne `SheetSpace` (src/core/sheet/space.ts) und `InkGeometry`/`InkShapes`/`InkStroke`/`InkThumbnail` (src/core/ink/). CSS-Namensraum `blatt-`/`document-`.

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/bereiche/pdf/marken.ts` | Ink-Schicht `Marken`: ein SVG je Blatt/Seite (`schicht` Z.1608-4556, viewBox in PDF-Punkten Z.1805-1807); Kataloge FORMEN Z.79-102, STIFTE Z.141, WERKZEUGE Z.301, RADIERER Z.54-69; `zeichneMarkeRoh` Z.1080-1513 (15 Markenarten: stift, marker, line, arrow, rectangle, roundrect, ellipse, triangle, curve, text, textfix, zettel, zeichen, bild, abdeck); Auswahl mit Eck-/Kurven-/Drehgriff und Lasso (`renderSelection` Z.2060-2133); Radierer Z.2289-2362; Zeiger-Normalisierung Z.2364-2537; Formerkennung beim Absetzen (`finish` Z.2871, Z.3024); Undo/Redo Z.1800-2030; Leiste Z.5175-7149; Tasten Z.7150-7248; Speichern Z.1949; PDF-Annotation `alsAnnotation` Z.850; Rueckgabe Z.7250-7268 | 7268 |
| `src/bereiche/pdf/document-mode.ts` | Schreibstudio `DocumentMode`, nur eine Ansicht auf dieselben Bloecke (Kopf Z.1-7). `DocumentState` Z.10-20; Seite/Zoom als Meta `dokSeite:` Z.31, `dokZoom:` Z.49 (Klammer 60-180 Z.54); Zoom = Breite der Buehne (`passen` Z.2818-2829); Regler Z.1889-1892, `zoomSetzen` Z.4527-4536, Strg+Rad Z.4792-4796, Kneifen Z.4797-4812; Lupe Z.4544-4766; Ausschnitt `SourceRegion` Z.22/1717/1792; Ereignis `ink-studio-ready` Z.2712 | 4916 |
| `src/bereiche/pdf/seite.ts` | `PdfSeite.zeichne`: Seitenbild + `Marken.schicht(block, bw, bh, 0, rand)` (Z.48) + Leiste; Zoom ist allein die Kastenbreite (Z.14-17); `bw`/`bh` mit A4-Rueckfall Z.33-34; CSS `aspect-ratio` Z.115 | 327 |
| `src/bereiche/pdf/leser.ts` | `PdfLeser`: pdf.js nur als Umwandler, einmal je Dokument (Kopf Z.7-18); rastert auf 1654 px = 200 dpi (Z.33); Passwort wird nie abgelegt (Z.53-57) | 347 |
| `src/bereiche/pdf/einlesen.ts` | `PdfEinlesen.alsSeiten`: Original als Anhang, eine Seite zur Zeit, Seitenbilder `abgeleitet: true` (Kopf Z.7-19); legt `pdfseite`-Bloecke mit nr, bw, bh, dreh, quelleId, raumVersion an (Z.272-274), `bildDateiId` nachgetragen (Z.293) | 1046 |
| `src/bereiche/pdf/ink-ruler.ts` | `InkRuler.create`: Lineal als SVG-Gruppe im Dokumentraum, 72 pt = 1 Zoll (Z.1-3); `pointer-events=none` Z.31; Lage als `translate/rotate` Z.57; `project`/`begin`/`constrained` Z.135/212 | 238 |
| `src/bereiche/pdf/ink-menu.ts` | `InkMenu`: Bedienfelder als natives `popover` am `document.body`, `closeAll` Z.30, `open` Z.40; kein Dokumentinhalt | 137 |
| `src/core/ink/geometry.ts` | `InkGeometry`: neutrale Geometrie ohne DOM/Store (Kopf Z.8-12): simplify (RDP) Z.38, outline Z.214, path Z.278, rectangle Z.291, bounds Z.625, boundsLokal Z.635, move Z.658, rotate Z.679, scale Z.1018, intersects Z.733, distanceToPolyline Z.738, touchesCircle Z.814, splitByCircle Z.883, insidePolygon Z.936, union Z.962, drehung/ecken/drehePunkte Z.587-617, Textlayout Z.418-579; Rueckgabe Z.1061-1068 | 1071 |
| `src/core/ink/shapes.ts` | `InkShapes.recognize`: Linie/Ellipse/Rechteck/Dreieck aus Freihand (Z.1-19), Rueckgabe Z.276 | 279 |
| `src/core/ink/stroke.ts` | `InkStroke`: nasser Strich — `Feder` (wachsender Umriss) Z.92, `glaetter` Z.300, `druckGlaetter` Z.396, `vorhersage` Z.466 (nie gespeichert, Kopf Z.40-45) | 493 |
| `src/core/ink/thumbnail.ts` | `InkThumbnail.deckel`: Vorschaupfade aus `marken`, Rueckgabe Z.147 | 151 |
| `src/core/sheet/space.ts` | `SheetSpace`: A4 in Punkten (Z.38-39), RAND Z.42, RAUM_VERSION=1 Z.44, `zuBlatt` Z.56, `umrechner` (getScreenCTM einmal je Ereignis) Z.93-105, Rueckgabe Z.162 | 165 |

## Datenmodell

Marken liegen NICHT in einem eigenen Fach, sondern als Feld `marken: any[]` am Block im Fach `blocks` (indexdb.ts:93-94 `createObjectStore('blocks', { keyPath: 'id' })`). Geschrieben wird ausschliesslich ueber `Store.updateBlock(block.id, { marken: marks, raumVersion: R.RAUM_VERSION })` (marken.ts:1949; updateBlock indexdb.ts:440-462 setzt `edited`/`geaendertVon` und `save('blocks', b)`). Gelesen: `Array.isArray(block.marken) ? clone(block.marken) : []` (marken.ts:1611). `grep -rn marken src/kern/ablage/` → kein Treffer: die Ablage kennt das Feld nicht, nur der Bereich. Einheit: PDF-Punkte, viewBox `0 0 595.28 841.89` (space.ts:38-39, marken.ts:1805-1807), `raumVersion` als Deutungsmarke (space.ts:44). Blocktypen: `blatt` (Register bloecke.ts:95; Blockfelder blattHoehe/blattBreite/raumVersion blatt.ts:260-263) und `pdfseite` (bloecke.ts:207, nurName; Felder nr, vonSeiten, bw, bh, dreh, quelleId, raumVersion, bildDateiId einlesen.ts:272-274, 293). Eine Marke: `{ id, art, farbe, breite, pts: [[x,y],...], pressure: number[], zeigerArt }` (marken.ts:4009-4010), optional `stil`, `leiter` (Z.4011-4021), `neigung[]` (Z.2531), `druckArt` 'stift'|'tempo' (Z.2966), `dreh` (Z.3030), `gesperrt`, `href`/`zielSeite` (Z.2192-2246), Text: `{art:'text', point, text, farbe, ...}` (Z.3450/3557), Bild: `{art:'bild', dateiId, ...}` (Z.2673), `textfix` Z.3658, `zeichen` mit `zeichenId` Z.3704. Reihenfolge in `marken[]` ist die Stapelung (Z.2161-2164). Kein Typ in src/core/types (grep marken/raumVersion → leer); doku/REDION-FORMAT.md:234 nennt das Feld nur in einem Satz. Zusatzspeicher als Meta: `zeichnen:*`-Schluessel (Radierer Z.130, Leiter Z.266, Ordnung Z.463, Lage Z.583, Werkzeugwerte Z.1629), Farbsaetze/Elemente-Bibliothek Z.4609-4835. Zwischenablage nur im Speicher (Z.42). Seitenbilder in `dateien`/`stuecke` mit `abgeleitet: true` (einlesen.ts:292).

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Marken` | global | `src/bereiche/pdf/marken.ts` | `window.Marken` (Z.7268): schicht, leiste, zeichneMarke, verlaufDefs, annotierbar, alsAnnotation, Kataloge FARBEN/BREITEN/STIFTE/LEITER/LASER/FORMEN/WERKZEUGE/RADIERER/TASTEN, Farbsaetze, Elemente-Bibliothek, zwischenablage (Z.7250-7265). Aufrufer laut bereiche-bestand.json: bloecke (2), dateien (3), vorlagen (3), wissen (3) |
| `Marken.schicht(block, breite, hoehe, umbruch, rand)` | funktion | `src/bereiche/pdf/marken.ts` | baut die Zeichenschicht und gibt `steuerung` zurueck (Z.4509: flaeche, setzeWerkzeug, setzeFarbe, setzeStrich, setzeStil, setzeRadierModus, copySelection, paste, marken, ...); Aufrufer seite.ts:48 und blatt.ts:164 |
| `DocumentMode` | global | `src/bereiche/pdf/document-mode.ts` | Schreibstudio; von vorlagen (2 Verweise) aufgerufen; feuert `ink-studio-ready` (Z.2712) und `ink-panel` (Z.4188) |
| `ink-studio-ready` | ereignis | `src/bereiche/pdf/document-mode.ts` | DOM-Event auf dem Leistenknoten; Hoerer marken.ts:7029. Kein Bus-Ereignis: `grep Bus\.` in pdf/ → 0 |
| `SheetSpace` | global | `src/core/sheet/space.ts` | `window.SheetSpace` (Z.165): A4_BREITE, A4_HOEHE, RAND, RAUM_VERSION, rund, zuBlatt, umrechner, seiten, gedrehtVon, masseVon, drehHuelle |
| `InkGeometry / InkShapes / InkStroke / InkThumbnail` | global | `src/core/ink/geometry.ts` | globale Kerne (geometry.ts:1071, shapes.ts:279, stroke.ts:493, thumbnail.ts:151), ohne DOM und Store |
| `PdfLeser.oeffne(daten, frage)` | funktion | `src/bereiche/pdf/leser.ts` | einzige pdf.js-Stelle (Z.2); liefert Seitenzahl, Geometrie, Seitenbilder (Z.58-61) |
| `PdfEinlesen.alsSeiten(datei, elternId, vorgabe)` | funktion | `src/bereiche/pdf/einlesen.ts` | PDF → pdfseite-Bloecke (Z.56); Aufrufer dateien (2), wissen (1) |
| `Register.bloecke blatt / pdfseite` | register | `src/register/bloecke.ts` | Z.95 `{ id:'blatt', ... }`, Z.207 `{ id:'pdfseite', nurName:true }` |
| `Register.fachzeichen / symbole / textstile` | register | `src/bereiche/pdf/marken.ts` | gelesen an marken.ts:1098, 3752-3771 (fachzeichen), 5919-6899 (symbole), 660 (textstile), document-mode.ts:2622 |
| `Zeichenziel` | funktion | `src/kern/helfer/zeichenziel.ts` | kern-Helfer: welche Zeichenflaeche gerade gemeint ist; 37 Aufrufe aus pdf/*, API Z.402-405 (melde, setze, uebernehmeFarbe, ...) |
| `MCP/HTTP` | mcp | `server/` | nicht gefunden: `grep -rln marken server/` trifft nur server/sicherheit/marken.ts, und das sind Zugangs-Marken (Tokens), keine Ink-Marken |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | ja | nein | `InkPoint = [number, number]` geometry.ts:14; `InkGeometry.points` Z.23; Marken speichern `pts: [[x,y],...]` marken.ts:4010 |
| rect | ja | nein | `InkBounds` geometry.ts:15; `InkGeometry.rectangle(start,end)` Z.291 |
| bounds | ja | nein | `InkGeometry.bounds` Z.625, `boundsLokal` (ohne Drehung) Z.635, `union` Z.962; Aufruf marken.ts:2047-2058 |
| transform | ja | nein | Bildschirm→Blatt: `SheetSpace.umrechner` ueber `getScreenCTM().inverse()` + DOMPoint space.ts:93-105; Aufruf marken.ts:3894, 4095; Marken-Transformationen `InkGeometry.move/scale/rotate` Z.658/1018/679 |
| viewport | ja | **ja** | SVG viewBox `0 0 (breite+rand) hoehe`, preserveAspectRatio none marken.ts:1805-1807; Rollen in `.document-center` document-mode.ts:4060 (Fingerpan marken.ts:3865) |
| zoom | ja | **ja** | nur Kastenbreite, keine Zahl in den Daten (seite.ts:14-17); document-mode.ts `passen` Z.2829 `breit = min(raum-36, 980) * zoom/100`, `zoomSetzen` Z.4527-4536 (60-180, Lupe bis 300), Strg+Rad Z.4792, Kneifen Z.4797-4812, gemerkt als Meta Z.49-58 |
| pan | ja | **ja** | gesperrter Finger rollt `.document-center` (`fingerPan` marken.ts:3865, Z.4058-4062); kein eigener Pan-Zustand in den Daten |
| selection | ja | **ja** | `selection = new Set<string>()` marken.ts:1798; Tipp/Umschalt Z.3983-3989; Lasso Z.3997 (`InkGeometry.insidePolygon` via `imLasso` Z.2135); Rahmen Z.2060-2133 |
| hitTest | ja | nein | DOM: `closest('[data-sid]')` marken.ts:3900-3901 und `[data-griff]` Z.3946; Radierer: `InkGeometry.touchesCircle` Z.2337, `splitByCircle` Z.2317; Lasso `insidePolygon` |
| snap | ja | **ja** | 15°-Rastung `rasten` marken.ts:1887-1895 (Math.PI/12) fuer Linie/Pfeil bei Umschalt/Lineal Z.4213; Kantenfuehrung am Lineal ink-ruler.ts:135 (`project`); kein Raster fuer Positionen |
| resizeHandles | ja | **ja** | vier Eckgriffe r=22 Trefffeld / r=5 sichtbar marken.ts:2097-2104; Zug `mode:'scale'` Z.3965-3982 → `InkGeometry.scale(original, anker, sx, sy, achse)` Z.4162 |
| rotation | ja | nein | Feld `dreh` an der Marke; Drehgriff marken.ts:2122-2128, `mode:'rotate'` Z.3951, `InkGeometry.rotate` Z.4196; Kasten in Markenachsen `auswahlAchse` Z.2040-2046 (`InkGeometry.drehung` geometry.ts:603) |
| group | nein | nein | nicht gefunden: keine Markenart 'gruppe'/'group' in marken.ts (grep); Mehrfachauswahl wirkt nur als gemeinsamer Kasten Z.2047-2058; Elemente-Bibliothek speichert Markenlisten (Z.4720), keine Gruppe im Dokument |
| connector | nein | nein | nicht gefunden: `arrow` ist eine freie Zweipunktform (marken.ts:80, 1261), kein an Marken gebundener Verbinder; L133/test456 nennt den Verbinder als nicht gebaut |
| frame | nein | nein | nicht gefunden: keine Rahmen-/Frame-Marke; die Seite selbst ist der Rahmen (viewBox), `abdeck` ist ein Abdeckband (marken.ts:60-62) |
| zOrder | ja | **ja** | Reihenfolge in `marks` = Stapel; `nachVorn`/`nachHinten` marken.ts:2165-2181, Gesperrtes behaelt Platz |
| undo | ja | **ja** | eigener Verlauf: `historyUndo/historyRedo` marken.ts:1800-1801, HISTORY_LIMIT 100 Z.38, `snapshot` friert flache Abbilder Z.1923-1934, `commit` Z.1966-1971, `undo/redo` Z.2022-2031; Strg+Z Z.4320-4326 mit preventDefault ohne stopPropagation; kern/zustand/verlauf.ts (MAX 60, Z.33) wird NICHT benutzt |
| pointerNormalisierung | ja | **ja** | marken.ts: `pressureOf` Z.2377 (0.05-1, sonst 0.5), `druckAus` Z.2387-2413 (Tempo-Ersatz fuer Maus/Finger, Sensor-Gedaechtnis E675), `neigungAus` Z.2364-2375 (tiltX/Y → 0..1, -1 = nicht gemeldet), `getCoalescedEvents` mit einem Umrechner Z.4095-4097, Stiftradieren ueber button 5/2/buttons&32 Z.3891-3892, Handballen-Sperre `fingerGesperrt` Z.2426; Glaettung `InkStroke.glaetter/druckGlaetter` Z.4034-4037 |

## Gemeinsam genutzt

**Benutzt:** [[kern-SheetSpace|SheetSpace]] · [[kern-InkGeometry|InkGeometry]] · [[kern-InkShapes|InkShapes]] · [[kern-InkStroke|InkStroke]] · [[kern-Store|Store]] · [[kern-Register|Register]] · [[kern-Ereignis|Ereignis]] · [[kern-Dateien|Dateien]]

**Nur genannt, nicht benutzt:** [[kern-Verlauf|Verlauf]] — der Befund sagt, warum.

- src/kern/ablage/indexdb.ts — `Store` (147 Aufrufe in pdf/*): updateBlock, getMeta/setMeta, Blockzugriff
- src/core/ink/geometry.ts — `InkGeometry` (96 Aufrufe): bounds, union, move, scale, rotate, touchesCircle, splitByCircle, insidePolygon, drehung, textLayout, densify
- src/core/sheet/space.ts — `SheetSpace` (39 Aufrufe): zuBlatt, umrechner, A4-Masse, RAUM_VERSION, gedrehtVon, masseVon
- src/kern/helfer/zeichenziel.ts — `Zeichenziel` (37 Aufrufe): aktive Zeichenflaeche, Werkzeug/Farbe/Strich uebernehmen
- src/register/bloecke.ts (blatt Z.95, pdfseite Z.207), Register.fachzeichen/symbole/textstile (marken.ts:660, 1098, 3752-3771, 5919-6899)
- src/core/ink/stroke.ts — `InkStroke` (7): Feder, glaetter, druckGlaetter, vorhersage (marken.ts:2613, 4034-4039)
- src/core/ink/shapes.ts — `InkShapes.recognize` (marken.ts:3024)
- src/core/helpers/ids.ts — `Ids.short(8)` (marken.ts:2291)
- src/kern/auftraege/maschine.ts — `Auftraege` (9, einlesen/document-mode)
- src/schale/ueberlagerung/dialog.ts — `Dialog` (19), src/schale/aufbau/schale.ts — `App` (25)
- Fremde Bereiche (Querverweise laut pruefungen/bereiche-bestand.json): Dateien 29, Formelheft 6, Links 6, Recognition 3, Planflaeche 2, Werkzeuge 2, Folienvorlagen 2, Learning 1, Blatt 1

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[gemeinsam|G · Gemeinsame räumliche Infrastruktur]] · [[zeichenflaeche|B · Whiteboard / Zeichenfläche]] · [[elektro|F · Schaltplan, Fachzeichen, Elektro]]

1. **`distanceToSegment` (Punkt-Strecken-Abstand) zweimal woertlich im selben Kern** — **gegengeprüft: bestätigt**
   - hier: `src/core/ink/geometry.ts:27-36`
   - dort: `src/core/ink/shapes.ts:520-527`
   - Beleg: beide: `const dx = end[0] - start[0]; const dy = end[1] - start[1]; if (!dx && !dy) return Math.hypot(...); const amount = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));` — shapes.ts ruft InkGeometry nicht
   - Urteil: Die Behauptung stimmt inhaltlich, die Zeilenangabe für shapes.ts ist falsch (31-38 statt 520-527). Widerlegungsversuche: (1) Andere Einheiten/Koordinaten? Nein — beide Dateien erklären sich als store-, DOM- und einheitenfrei (geometry.ts:8-11, shapes.ts:12-13 „kennt weder Store noch DOM noch Zeit (E125, wie geometry.ts)"). (2) Ruft eine die andere auf? Nein — shapes.ts enthält kein `InkGeometry`, und geometry.ts exportiert `distanceToSegment` gar nicht (Z. 1061-1064), nur `distanceToPolyline`. Die Doppelung ist also eine bewusste oder beiläufige Folge davon, dass shapes.ts absichtlich alleinstehend gebaut wurde (E355/E125). Ladereihenfolge in index.html: geometry.js Z. 499 vor shapes.js Z. 501, ebenso sw.ts:82/84 — ein Aufruf zur Laufzeit wäre also möglich. Aber test366.mts:69 lädt nur `quell/core/ink/geometry.js` per eval ohne Browser; ein umgekehrter Standalone-Lauf für shapes ist nicht gefunden (test347 lädt die ganze App), das Muster zeigt jedoch, dass die Ink-Kerndateien einzeln geladen werden.
2. **SVG-Element-Fabrik mit Attributschleife** — **gegengeprüft: bestätigt**
   - hier: `src/bereiche/pdf/marken.ts:783-787 (`svg`)`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:32-36 (`sv`)`
   - Beleg: marken: `const element = document.createElementNS(NS, name); Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));` — zeichenflaeche: `const e = document.createElementNS(NS, name); Object.entries<any>(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));`
   - Urteil: Beide Stellen selbst gelesen (marken.ts:760-819, zeichenflaeche.ts:1-80). Der Widerlegungsversuch scheitert: Es gibt keinen fachlichen Unterschied — kein Skalieren, kein Koordinatenrahmen, kein PDF-spezifisches Verhalten. Die eine Kopie wird 57-mal (`svg(` in marken.ts), die andere 41-mal (`sv(` in zeichenflaeche.ts) benutzt; beide sind lokale Helfer in einer IIFE, nie exportiert, nie gegenseitig aufgerufen. Die dritte wortgleiche Kopie in gedankenkarte.ts:113-118 bestätigt, dass es sich um einen kopierten Helfer handelt, nicht um zwei zufällig ähnliche Lösungen verschiedener Aufgaben. Hinweis zum Nutzerauftrag (Obsidian/Graph-Datei als Gedächtnis): laut Auftrag durfte ich keine Datei ändern; diese Ergebnisse (Fundstellen der fünf SVG-Fabriken) sind hier vollständig aufgeführt, damit die Elternsitzung sie in eine solche Notiz übernehmen kann.
3. **Zweifinger-Kneifzoom (finger-Map + kneifen-Zustand + Math.hypot)**
   - hier: `src/bereiche/pdf/document-mode.ts:4797-4812`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:548-562`
   - Beleg: document-mode: `let kneifen: { abstand: number; zoom: number } | null = null; ... kneifen = { abstand: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, zoom: state.zoom }` — zeichenflaeche: `let kneifen: { abstand: number; z: number } | null = null; ... kneifen = { abstand: Math.hypot(dx, dy) || 1, z: sicht.z }`
4. **Strg+Z-Horcher ohne stopPropagation neben dem Dokument-Horcher der Schale (doppeltes Zuruecknehmen, L212)**
   - hier: `src/bereiche/pdf/marken.ts:4320-4326`
   - dort: `src/bereiche/bloecke/arten/planflaeche.ts:1017 und src/schale/aufbau/schale.ts:3178`
   - Beleg: marken: `} else if (strg && taste === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }` — planflaeche: `if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); return e.shiftKey ? vorwaerts() : zurueck(); }` — schale: `document.addEventListener('keydown', e => { const strg = e.ctrlKey || e.metaKey; ...`; die Gedankenkarte (gedankenkarte.ts:1482) ruft zusaetzlich `e.stopPropagation()`
5. **Eigener Rueckgaengig-Stapel statt kern/zustand/verlauf.ts**
   - hier: `src/bereiche/pdf/marken.ts:37-38, 1800-1801, 1966-1971 (HISTORY_LIMIT 100, flache Abbilder)`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:164-172 (SCHRITTE 40, JSON-Abbilder) und src/kern/zustand/verlauf.ts:33,54 (MAX 60)`
   - Beleg: marken: `historyUndo.push(before); if (historyUndo.length > HISTORY_LIMIT) historyUndo.shift(); historyRedo.length = 0;` — zeichenflaeche: `zurueckStapel.push(abbild()); if (zurueckStapel.length > SCHRITTE) zurueckStapel.shift(); vorStapel.length = 0;` — verlauf.ts: `if (zurueckStapel.length > MAX) zurueckStapel.shift();`. Gleiche Aufgabe, drei Bauarten; Marken ist die beste (Vergleich vor dem Merken, E378)
6. **Bildschirm→Raum: dieses System benutzt die Matrix, die Nachbarn rechnen selbst**
   - hier: `src/core/sheet/space.ts:93-105 (`umrechner`, getScreenCTM)`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:494-498 und src/bereiche/bloecke/arten/planflaeche.ts:138-143`
   - Beleg: space.ts: `const invers = matrix.inverse(); ... new DOMPoint(e.clientX, e.clientY).matrixTransform(invers)` — zeichenflaeche: `const r = flaeche.getBoundingClientRect(); return [Math.round(sicht.x + (e.clientX - r.left) / sicht.z), ...]` — planflaeche: `const sx = plan.breite / (r.width || 1); const x = (e.clientX - r.left) * sx;`. space.ts:10 behauptet „EINE STELLE ... und keine zweite“

## Prüfläufe

- `test174` — Der Block `blatt`: A4-Papier, auf das man schreibt und zeichnet; Radierer trifft die Marke unter dem Zeiger (marken.ts:2340 nennt §5)
- `test180` — Gerasterte Seitenbilder bleiben aus der Sicherung, `marken` ueberleben Export/Import (Z.142-258)
- `test201` — Marker, Formen, Text, Mehrfachauswahl und Aktionsverlauf in derselben Schicht
- `test267` — GoodNotes-Dossier: Lineal und 15°-Rastung (§6 „frei/gerastet“, ink-ruler.ts:25)
- `test343/test344` — Schrift, Linie, Radierer teilt Striche (`splitByCircle`, §2 fand die Luecke 2,7 statt 7,2, marken.ts:2313)
- `test345` — Auswahl bewegen/skalieren/kopieren (E353), Farbe je Werkzeug (§4)
- `test347` — Formerkennung `InkShapes.recognize`: Kreis, Rechteck, Linie und Gekritzel-Gegenprobe
- `test352` — Text-Marke mehrzeilig (`InkGeometry.textLayout`)
- `test364` — `InkThumbnail.deckel` aus den Marken eines Blatts
- `test366/test367` — `Feder` ergibt zeichengleich `InkGeometry.outline`; Messung des fluessigen Strichs vor/nach E376
- `test438-test445` — E465-Boegen: Dreieck, rundes Rechteck, Seitenmenue, PDF an einer Stelle einfuegen
- `test447/test449/test451` — gedrehte Marken (`dreh`), wirkliche Ecken, gedrehte Dreiecke
- `test455-test457` — L133-Reste: Kamera, Radierer-Arten, Kurve; Naeherungen der Geometrie
- `test461` — Der Stift (E490): Ruhepunkt, Schutzleiter
- `test470/test472-test474` — Stift-Dossier: Koordinaten (SheetSpace-Matrix), Druck, Ink-Annotation im PDF-Export
- `test480` — Stift-, Werkzeug- und Formzeichen rastern gegen Referenz (§7/§7b/§7c, L164)
- `test512/test516/test517` — pptx-Folien als Blatt; `InkGeometry.textWidth` gemessen statt geschaetzt
- `test524` — Zeichenstudio-Bedienfelder (`InkMenu`, Popover-Ersatzzweig ink-menu.ts:56), Radierergroessen
- `test527` — Direkt auf dem Blatt schreiben (E597)
- `test532` — Die Decke ueber der Folie im Schreibstudio bleibt ruhig (E612)
- `test535` — Strichprobe zeigt den Strich, Radierer hat eine Groesse (E623/E624)
- `test559` — Text einer PDF aendern, Original bleibt Byte fuer Byte (`textfix`, E670)
- `test561-test564` — Fueller laeuft spitz aus (E673), Farbe/Staerke je Werkzeug (E674), Sensor-Aussetzer (E675), Glaetter haelt die Ecke (E676)
- `Zaehlung` — grep -l in pruefungen/lauf: Marken 103, DocumentMode 26, InkGeometry 20, PdfEinlesen 14, PdfLeser 11, InkShapes 4, InkStroke 4, SheetSpace 3, InkThumbnail 1, InkRuler 1, InkMenu 0 (test524 prueft es ueber `.blatt-popover`)

## Doku-Stand

AUFGABEN.md: kein offener Punkt mit Dateinamen dieses Systems; Erwaehnungen sind die erledigten G-Boegen (G1 Z.225, G16 Z.288, G22 Z.332, G35 Z.430, G40 Z.475) und das Redesign-Kapitel Z.842-1189 („Was ueberraschend gut dasteht: Die Markenschicht“ Z.883); offen dort nur L119 (fluessiger Stift braucht echtes Stiftgeraet, Z.736-738). LUECKEN.md offen (Ueberschrift ohne GESCHLOSSEN, per awk ueber alle `## L`-Abschnitte mit Treffern): L164 (drei Rasterer in test480 §7/§7b/§7c, Z.7057), L173 (`InkGeometry.textLines` schaetzt, das Feld misst, Z.7174), L174 (Auswahl-Werkzeugleiste breiter als das Fenster, Z.7201), L181 (Lineal steht zweimal im Studio, Z.7340 — Frage offen), L198 (`istKritzel` misst am geglaetteten Weg, Z.7800), L202 (Werkzeugleiste am Telefon rollt statt aufzuklappen, Z.7938), L209 (Stift gegen GoodNotes: Tempo/Druckkennlinie/Kehren/nasser Strich im selben SVG/RDP-Formsprung/Marker ohne Keil, Z.8241; Punkt 4 erledigt E676), L212 (Strg+Z nimmt zweimal zurueck, Seitenverlauf vergibt neue Kennungen; gefordert test568 — existiert nicht, Z.8206). Dazu allgemein L191 (Griff ins fremde Markup ungeprueft) und L207 (Bereichs-Verzeichnis). Geschlossen u.a. L44, L61, L115, L133, L189. ENTSCHEIDUNGEN.md (557 `## E`, letzte E680): Kette dieses Systems E98-E110 (PDF-Seiten, Leser, Einlesen), E125/E126 (Ink-Kern, Dokumentmodus), E349 (Seite merken), E352-E360 (Radierer, Auswahl, Formen, Verlauf), E374-E379 (Deckel, nasser Strich, flache Abbilder), E465-E494 (GoodNotes-Boegen: Drehen, Sperren, Kurve, Radierer-Arten, Farbsaetze, Elemente), E504-E512 (Stift-Dossier, Umrechner E511, Laser), E572-E577/E591/E597/E606/E612-E624 (Zeichenstudio, Lineal, direkt schreiben), E670 (textfix), E673-E676 (Spitze, Werkzeuggedaechtnis, Sensor-Aussetzer, Glaetter-Ecke); Verzeichniseintraege fuer E353/E355/E376/E378/E466/E474/E511/E616/E674 per grep bestaetigt. ERLEDIGTE-AUFGABEN.md: 21 Treffer, alle abgeschlossen (z.B. Z.4153-4174 Auswahl/Radierer, Z.4419 thumbnail, Z.4437 stroke). doku/REDION-PLATTFORM-AUDIT.md (25. September) fuehrt dieses System in 2.1 und die Duplikate D1-D4/D9 in 2.3; doku/karte/karte.json ist die Quelle der Obsidian-Karte (`node karte.mts`), in die dieser Befund gehoert.

## Risiken

- Das Feld `marken` hat keinen Typ (src/core/types leer) und keine Formatbeschreibung ausser einem Satz in doku/REDION-FORMAT.md:234; eine gemeinsame Schicht, die Marken umformt, muss alle 15 Arten und die optionalen Felder (stil, leiter, neigung, druckArt, dreh, gesperrt, href, zielSeite, dateiId, zeichenId, laeufe) unveraendert durchreichen — sonst stiller Verlust in gespeicherten Blaettern (§9, §53.3).
- Alte `stift`-Marken ohne `pressure` und ohne `raumVersion` muessen lesbar bleiben (marken.ts:5-7); `raumVersion` ist die einzige Deutungsmarke des Raums (space.ts:44) — eine neue Einheit oder ein neuer Ursprung ohne Erhoehung verschiebt jede vorhandene Zeichnung ohne Fehlermeldung (space.ts:19-23).
- Zoom ist bewusst KEINE gespeicherte Zahl (seite.ts:14-17, document-mode.ts:2805-2808); eine gemeinsame Viewport-Schicht, die Zoom/Pan in den Block schreibt, hebt `edited` an und erzeugt Fassungen (document-mode.ts:26-29, 45-48) und bricht test180.
- Der Verlauf lebt nur im Speicher und friert Marken ein (`Object.freeze`, marken.ts:1927-1932); jede gemeinsame Schicht, die eine Marke von innen aendert statt zu ersetzen, wirft im strict mode oder verliert Undo (Regel E378).
- Ein gemeinsamer Strg+Z-Weg muss L212 loesen, nicht verdoppeln: heute nimmt die Schale zusaetzlich `Verlauf.zurueck()` und setzt den Baum mit frischen Kennungen neu ein (LUECKEN.md:8221-8227) — Bilder und Grabsteine haengen an dieser Reihenfolge.
- Der nasse Strich (`vorhersage`) darf nie in die Daten (stroke.ts:40-45); eine gemeinsame Zeichenschleife muss `punkt()` und `nass()` getrennt halten.
- `SheetSpace.umrechner` gilt nur innerhalb EINES Zeigerereignisses (space.ts:84-91); wer die Matrix in einer gemeinsamen Schicht zwischenspeichert, zeichnet nach Rollen/Zoomen daneben.
- Die Reihenfolge in `marken[]` ist die Stapelung (marken.ts:2161-2164); eine Schicht mit eigenem z-Feld waere ein zweiter Katalog (§8).
- Seitenbilder sind `abgeleitet: true` und fehlen in Sicherungen (einlesen.ts:17-19, test180); eine Schicht darf Marken nicht an das Bild, sondern nur an bw/bh/nr des Blocks binden (seite.ts:22-29).
- 145 Prueflaeufe nennen `Marken`/`DocumentMode`/`pdfseite`; jede Umstellung braucht den vollen Lauf, und `test537`/bereiche-bestand.json darf durch neue Querverweise nicht wachsen.

## Kleinster nächster Schritt (Vorschlag des Lesers)

Zuerst den Wächter für L212 schreiben (test568: ein Strich, Strg+Z im Blatt → genau ein Schritt zurück, Blockkennung unverändert; vorher rot, gemessen wie in doku/REDION-PLATTFORM-AUDIT.md 2.4), dann in schale.ts:3178 eine Zeile: eine Taste mit `defaultPrevented` nimmt die Schale nicht noch einmal — ohne marken.ts anzufassen. Danach, als eigener kleiner Bogen ohne Datenänderung: `distanceToSegment` in shapes.ts:520-527 durch `InkGeometry.distanceToSegment` ersetzen (dazu die Funktion in geometry.ts:1061 exportieren) und mit test347/test366 grün halten. Erst wenn beides steht, lohnt die grosse Frage — ob `SheetSpace.umrechner` und der Marken-Verlauf die gemeinsame Schicht für Whiteboard und Planfläche werden (Audit 2.7, Redurs Frage 3) — und die gehört Redur, weil sie `raumVersion` an drei weiteren Blockarten einführt.
