<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, folien]
stand: 25. September 2026
head: 1b89c01
---

# E · Präsentationen / Folien

E · Präsentationen / Folien — Vortragsmodus, Folienlayouts, .pptx lesen und schreiben. Es gibt KEINEN eigenen Folien-Blocktyp: eine Folie ist ein `blatt`-Block mit Folienmass (src/bereiche/dateien/einlesen.ts:993-998), ihre Objekte sind `marken` der Zeichenschicht `Marken` (src/bereiche/pdf/marken.ts). Der Kern `Folien` (src/core/slides/folien.ts) teilt eine Seite in Folien; `Folienvorlagen` (src/bereiche/vorlagen/folien.ts) baut Layouts als Markenlisten; Import/Export liegen in src/bereiche/dateien; der Vortrag in src/bereiche/wissen/werkzeuge.ts.

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/core/slides/folien.ts` | Der Kern: `Folien.teilen` (Z.59) zerlegt eine Seite in Folien (TRENNT=['divider','h1','h2'] Z.26, EIGENE_KINDER Z.29, EIGENE_FOLIE=['blatt','pdfseite'] Z.48, MIT_KINDERN Z.51), `alsZeilen` (Z.143) macht flache Textzeilen fuer PPTX/Handout, `ohneMarkierung` (Z.125). Rein: kein DOM, kein Store (Z.8). Global `window.Folien` (Z.198). | 198 |
| `src/bereiche/vorlagen/folien.ts` | `Folienvorlagen`: 8 Layouts (LISTE Z.116-200) als Markenlisten auf BREITE=960/HOEHE=540 pt (Z.36-37); `neueFolie` legt `blatt`-Block mit blattBreite/blattHoehe/papier an und schreibt `marken` (Z.218-227); `neuePraesentation` setzt `dokumentModus` (Z.236-241); `istFoliensatz` = Blatt breiter als hoch (Z.357-363); Waehler-Dialog (Z.276-316), Menueband-Reiter `praesentation` (Z.386-429), Befehle 'Neue Folie'/'Neue Praesentation' (Z.435-445). Global Z.452. | 452 |
| `src/bereiche/dateien/einlesen.ts` | .pptx-Leser (Abschnitt ab Z.991): `emuZuPunkt` (Z.1013), FORMEN prst-Karte (Z.1363-1368), `formGeometrie` (Z.1370), `formDrehung` (Z.1421), `formLage` (Z.1430), UEBERGAENGE-Karte + `uebergangLesen` (Z.1450-1508), `klickschritte` aus p:timing (Z.1533), `pptxLesen` (Z.1922; Reihenfolge aus sldIdLst Z.1938-1946), Gruppen-Abbildung `abbilden` (Z.2033-2038), Rueckspur `quelle:{sp,p}` (Z.2236-2240), Blockanlage je Folie (Z.2563-2650). | 2726 |
| `src/bereiche/dateien/ausgeben.ts` | .pptx-Schreiber (ab Z.2605): FOLIE_BREITE/HOEHE in EMU (Z.2633), `pptxFolie` mit festen Textrahmen (Z.2701-2739), `pptxTeile` (Z.2751), `originalPaket` (Z.2877), `alsPowerPoint` mit zwei Wegen: Original durchreichen + `folieMitText` (Z.2924-2992) oder frisch aus `Folien.teilen`/`alsZeilen` (Z.2994-3001). | 3015 |
| `src/bereiche/wissen/werkzeuge.ts` | Vortragsmodus `praesentation` (Z.1060): nutzt `Folien.teilen` (Z.1076), Schrittzaehler fuer Abdeckungen (Z.1096-1144), `uebergangDerFolie` (Z.1121), setzt data-uebergang/--ueb-dauer (Z.1196-1203), zeichnet `blatt` als <figure> mit `markenAlsSvg` (Z.1268-1276, Z.2186-2194). | 3172 |
| `src/bereiche/pdf/marken.ts` | Die Zeichenschicht, auf der die Folienobjekte leben: `zeichneMarke` (Z.1019, Drehung Z.1021-1025), Live-Schicht `schicht` (Z.1608; selection Z.1798, history Z.1800-1801, Griffe Z.2094-2130, nachVorn/nachHinten Z.2165-2181, Lasso/Kritzel Z.2823-2870, Pointer Z.3894-3990). Nicht folienspezifisch, aber jedes Folienobjekt geht hier durch. | 7268 |
| `src/bereiche/pdf/document-mode.ts` | Foliensatz-Ansicht: `documentsIn` sammelt `pdfseite`/`blatt` in Inhaltsreihenfolge (Z.452-470), `istFoliensatz` fragt Folienvorlagen (Z.673-676), Wort 'Folie'/'Seite' (Z.696-697), Folienmenue + Folienband (Z.706, Z.846), Miniatur `markenVorschau` (Z.1073), Seiten verschieben ueber `content` der Eltern (Z.3443-3457). | 4916 |
| `src/bereiche/bloecke/arten/blatt.ts` | Zeichnet den `blatt`-Block: Mass aus blattBreite/blattHoehe, sonst A4 (Z.157-158), `grundfarbe` als --paper (Z.188-190), Drehhuelle via SheetSpace (Z.195). Register-Eintrag `blatt` in src/register/bloecke.ts:95. | 320 |
| `src/core/sheet/space.ts` | Gemeinsamer Blattraum: A4-Masse (Z.38-39), `zuBlatt`/`umrechner` ueber getScreenCTM (Z.56-105), `gedrehtVon`/`masseVon`/`drehHuelle` (Z.124-147). | 165 |
| `src/core/ink/geometry.ts` | Gemeinsame Geometrie: bounds/boundsRoh/ecken/drehung (Z.603-640), rotate (Z.679), kastenEcken (Z.730), scale (Z.1018), textLayout, move, intersects usw. (Export Z.1061-1068). | 1071 |

## Datenmodell

Fach `blocks` in IndexedDB. Eine Praesentation = Seitenblock (`Store.addPage`, icon '📽️') mit `dokumentModus: true` (einlesen.ts:2555, 2571; vorlagen/folien.ts:237-239). Eine Folie = Kindblock `type: 'blatt'` mit `text` (Folientitel), `blattBreite`, `blattHoehe` (Punkte, 72/Zoll; Vorgabe 960x540 = 16:9, einlesen.ts:1928-1932, vorlagen/folien.ts:36-37), `papier: 'blanko'`, optional `grundfarbe` (#rrggbb, einlesen.ts:2586-2587; blatt.ts:188-190) und optional `uebergang: { art: 'keine'|'blenden'|'schieben'|'decken'|'wischen'|'zoom', dauer: 150..3000 ms, richtung?: 'l'|'r'|'u'|'d', original: string, statt?: string }` (einlesen.ts:1476-1503, 2590). Die Objekte einer Folie stehen im Feld `marken: any[]` am Blattblock (einlesen.ts:2650; vorlagen/folien.ts:225). Markenarten: `text` mit `point:[x,y]`, `breiteBox`, `fontSize`, `fett`, `farbe`, `schrift`, `ausricht`, optional `laeufe`, optional `rahmen`, optional `quelle:{sp,p}` (vorlagen/folien.ts:68-76, einlesen.ts:2604-2606, 2236-2240); `abdeck` mit `pts:[[x,y],[x2,y2]]`, `farbe`, `schritt`, optional `verlauf` (einlesen.ts:2621-2625); Formen `rectangle|roundrect|ellipse|triangle|line` mit `pts`, `farbe`, `fuellung`, `breite`, `randlos` (einlesen.ts:2638-2643); `bild` mit `dateiId` + `pts` (einlesen.ts:2657-2660, Bilddaten im Fach `dateien`/`stuecke` ueber `Dateien.ablegen` Z.2653). Alle Arten optional `dreh` in Grad 0..360 (einlesen.ts:1421-1428). Koordinaten sind Blattpunkte, nicht Pixel (vorlagen/folien.ts:26-30; einlesen.ts:1000-1003; space.ts:24-27). Reihenfolge der Folien = Reihenfolge im `content` des Seitenblocks (document-mode.ts:452-470, 3443-3457); Reihenfolge der Objekte = Reihenfolge in `marken` = Stapelung (marken.ts:2161-2164). Klickschritte: `schritt` an Abdeckmarken, Laufzeitstand nie gespeichert (werkzeuge.ts:1093-1096). Groesse ist bei text nur die Breite (`breiteBox`); die Hoehe rechnet `InkGeometry.textLayout` (geometry.ts:635-640).

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Folien` | global | `src/core/slides/folien.ts:195-198` | teilen(wurzel, kinderVon), alsZeilen(folie, kinderVon), ohneMarkierung, TRENNT, EIGENE_KINDER, EIGENE_FOLIE, MIT_KINDERN |
| `Folienvorlagen` | global | `src/bereiche/vorlagen/folien.ts:447-452` | alle, eines, marken(id,b,h), vorschau, waehle, neueFolie, neuePraesentation, anlegenMitWahl, folieMitWahl, istFoliensatz, offenerSatz, bandEintraege, BREITE, HOEHE |
| `Register.menueband.meldeLieferant(bandEintraege)` | register | `src/bereiche/vorlagen/folien.ts:428-429` | Reiter `praesentation` mit Folien/Vortrag/Ausgeben-Gruppen; jeder Eintrag hat zeigen() |
| `Register.befehle.melde 'Neue Folie' / 'Neue Praesentation'` | register | `src/bereiche/vorlagen/folien.ts:435-445` | Befehlspalette, Gruppe Anlegen |
| `Register bloecke id 'blatt'` | register | `src/register/bloecke.ts:95` | Der Blocktyp, den eine Folie benutzt (A4-Blatt, Gruppe Wissen) |
| `Einlesen.pptxLesen / datei()` | funktion | `src/bereiche/dateien/einlesen.ts:1922, 2553-2703` | .pptx/.ppsx/.pptm/.ppsm -> Seite mit blatt-Bloecken; Rueckgabe {seite, hinweis} mit 'NICHT uebernommen'-Liste |
| `Austausch.alsPowerPoint(seite), Austausch.pptxTeile(folien)` | funktion | `src/bereiche/dateien/ausgeben.ts:2924, 2751, 3003` | Original durchreichen (mit folieMitText-Rueckspur) oder frische .pptx aus Folien.teilen/alsZeilen |
| `Werkzeuge.praesentation(p)` | funktion | `src/bereiche/wissen/werkzeuge.ts:1060, 3070` | Vollbild-Vortrag mit Schrittzaehler und Uebergaengen; Ausloeser Z.206, 2747, 3120-3121 |
| `DocumentMode.alsPdf / documentsIn / istFoliensatz` | funktion | `src/bereiche/pdf/document-mode.ts:332, 452, 673` | Foliensatz-Ansicht, PDF-Ausgabe, Miniaturliste |
| `Marken.zeichneMarke / Marken.verlaufDefs / Marken.schicht` | funktion | `src/bereiche/pdf/marken.ts:1019, 988, 1608` | Zeichnet und bearbeitet die Folienobjekte; Rueckgabe-API der schicht Z.4509-4518 |
| `Backstage 'exp:pptx'` | funktion | `src/schale/aufbau/backstage.ts:331-332, 433` | Menuezeile 'Als PowerPoint speichern' |
| `CSS .praesi .folie[data-uebergang]` | ereignis | `quell/schale/stil/werkzeuge.css:444-464` | Die Uebergangsanimationen (ueb-blenden, ueb-zoom, ueb-schieben, ueb-wischen) haengen an data-Attributen, die werkzeuge.ts:1196-1203 setzt |
| `Skriptladung` | global | `index.html:525, 655; src/dienst/sw.ts:108, 228` | quell/core/slides/folien.js und quell/bereiche/vorlagen/folien.js sind in index.html und im GRUNDSTOCK eingetragen |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | ja | nein | Marken `point:[x,y]` (vorlagen/folien.ts:70) bzw. `pts` (einlesen.ts:2625); Normierung `InkGeometry.points` (src/core/ink/geometry.ts:24) |
| rect | ja | **ja** | Import: `formLage` -> {x,y,w,h} in Punkten (einlesen.ts:1430-1438), dann in `pts:[[x,y],[x+w,y+h]]` (Z.2625, 2643, 2660); Layouts: Anteile mal Foliengroesse (vorlagen/folien.ts:65-76). Rechteck-Geometrie selbst: InkGeometry.rectangle (geometry.ts:1063) |
| bounds | ja | nein | InkGeometry.bounds/boundsRoh/ecken (geometry.ts:603-640); von marken.ts 40-mal benutzt (z.B. Z.1023, 2047-2056) |
| transform | ja | **ja** | Gruppen-Abbildung `abbilden` {dx,dy,sx,sy} beim pptx-Import — eigene Rechnung (einlesen.ts:2032-2038, 2059-2068); EMU->Punkt `emuZuPunkt` (Z.1013). Bildschirm->Blatt: SheetSpace.zuBlatt ueber getScreenCTM (space.ts:56-105) |
| viewport | ja | nein | SVG viewBox `0 0 ${breite+rand} ${hoehe}` in marken.ts:1806-1808; Vorschau-SVG viewBox 0 0 960 540 in vorlagen/folien.ts:264; Miniatur document-mode.ts:1081; Vortrag werkzeuge.ts:1271-1272 (aspect-ratio) |
| zoom | nein | nein | Kein Folienzoom gefunden. Gesucht: 'zoom' in vorlagen/folien.ts, core/slides/folien.ts, werkzeuge.ts praesentation (nur Uebergangsart 'zoom' einlesen.ts:1460), marken.ts:3309-3351 (nur iOS-Tipp-Zoom-Ausgleich des Textfelds) |
| pan | ja | **ja** | Nur Finger-Rollen der Zeichenflaeche `fingerPan` in marken.ts:1751, 3865, 4058-4060 (scrollLeft/scrollTop); kein Folien-Pan |
| selection | ja | **ja** | marken.ts `selection: Set<string>` Z.1798, Lasso Z.2889-2910, Shift-Mehrfachwahl Z.3984-3985, `auswahlKasten` Z.2047 (ueber InkGeometry.bounds/union) |
| hitTest | ja | nein | DOM-Treffer ueber `closest('[data-sid]')` (marken.ts:3901-3902); Lasso `imLasso` (Z.2133) und Kritzel `kritzelTrifft` (Z.2824-2857) mit InkGeometry.distanceToPolyline/insidePolygon/ecken |
| snap | ja | **ja** | Nur Winkelrasten 15 Grad bei Linie/Pfeil/Drehung (`rasten`, marken.ts:1887-1896; Lineal Z.1878-1882). Kein Raster-/Kantenfangen fuer Folienobjekte gefunden (gesucht: einrast\|magnet\|Fang in marken.ts, vorlagen/folien.ts) |
| resizeHandles | ja | nein | Vier Eckgriffe nw/ne/sw/se (marken.ts:2103-2109), Skalieren um gegenueberliegende Ecke mit InkGeometry.scale (Z.3965-3982); keine Kantengriffe |
| rotation | ja | nein | Feld `dreh` (Grad, einlesen.ts:1421-1428); Drehgriff (marken.ts:2121-2128, 3945-3956); Anwendung `rotate(...)` um Kastenmitte (marken.ts:1021-1025); Rechnung InkGeometry.drehung/rotate/drehePunkte (geometry.ts:603, 679) |
| group | nein | nein | Import loest `p:grpSp` AUF (Kindkoordinaten werden abgebildet, einlesen.ts:2049-2074) — es gibt keine Gruppenmarke; in marken.ts kein Gruppieren gefunden (gesucht: gruppier\|'gruppe') |
| connector | nein | nein | `straightConnector1` wird zu 'line' (einlesen.ts:1367); keine verbundenen Linien; `arrow`/`curve` sind freie Formen (marken.ts:80-99) |
| frame | ja | **ja** | Die Folie selbst ist der Rahmen: blattBreite/blattHoehe am Block (vorlagen/folien.ts:222-223), `--seitenmass` im Vortrag (werkzeuge.ts:1272); Textrahmen `rahmen: true` an Textmarke (vorlagen/folien.ts:187) |
| zOrder | ja | **ja** | Reihenfolge in `marken` = Stapel; `nachVorn`/`nachHinten` (marken.ts:2161-2181); Import legt Form VOR Text ein (einlesen.ts:2137-2143) |
| undo | ja | **ja** | historyUndo/historyRedo, HISTORY_LIMIT=100, snapshot/commit/undo/redo (marken.ts:37, 1800-1801, 1923, 1969, 2022-2030) — nur innerhalb der Zeichenschicht; Folienreihenfolge/Loeschen laufen ueber Store (document-mode.ts:3443-3448) |
| pointerNormalisierung | ja | nein | SheetSpace.zuBlatt/umrechner ueber getScreenCTM+DOMPoint (space.ts:56-105), aufgerufen marken.ts:2496, 2606, 3826, 3894; Druck/Stift `pressureOf` (marken.ts:2377-2402) |

## Gemeinsam genutzt

**Benutzt:** [[kern-SheetSpace|SheetSpace]] · [[kern-InkGeometry|InkGeometry]] · [[kern-Folien|Folien]] · [[kern-Store|Store]] · [[kern-Register|Register]] · [[kern-Dateien|Dateien]]

- src/core/ink/geometry.ts (InkGeometry): bounds, ecken, drehung, rotate, scale, move, points, textLayout, intersects, insidePolygon — ueber marken.ts fuer jedes Folienobjekt (marken.ts:1023, 2047-2056, 3965-3982); einlesen.ts nutzt InkGeometry.textLayout fuer Absatzhoehen (Kommentar Z.2185-2189)
- src/core/sheet/space.ts (SheetSpace): zuBlatt/umrechner (marken.ts:1610, 2496, 3894), A4-Masse als Rueckfall (blatt.ts:157-158), drehHuelle (blatt.ts:195)
- src/core/slides/folien.ts (Folien): von werkzeuge.ts:1076 (Vortrag) und ausgeben.ts:2994-2996 (Export) benutzt
- src/kern/ablage (Store): addPage/addBlock/updateBlock/getBlock/childrenOf (vorlagen/folien.ts:222-240, einlesen.ts:2554-2650)
- src/register/bloecke.ts:95 (Blocktyp blatt), Register.menueband (vorlagen/folien.ts:428), Register.befehle (Z.435)
- src/bereiche/dateien: Dateien.ablegen/alsBlob fuer Bildmarken und Original (einlesen.ts:2653, ausgeben.ts:2877-2895) — Querverweis, steht in pruefungen/bereiche-bestand.json (bereiche/vorlagen -> Austausch 2, DocumentMode 2, Marken 3, Werkzeuge 4; bereiche/pdf -> Folienvorlagen 2)
- Einlesen.zipLesen / Austausch.zipSchreiben (ausgeben.ts:2888, 2998)
- quell/schale/stil/werkzeuge.css:444-464 (Uebergangsanimationen)

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[sync|J · Abgleich, Anhänge, Stücke]] · [[pdf|D · PDF-Schreibstudio und Ink]]

1. **Markdown-Auszeichnung entfernen (**fett**, __, `code`, Links)** — **gegengeprüft: bestätigt**
   - hier: `src/core/slides/folien.ts:125-133 (`ohneMarkierung`)`
   - dort: `src/kern/helfer/vorschau.ts:65-76 (`Vorschau.klartext`, exportiert Z.380/384); dritte Stelle src/bereiche/dateien/ausgeben.ts:837-839`
   - Beleg: folien.ts:127 `.replace(/\*\*(.+?)\*\*/g, '$1')` — vorschau.ts:72 `.replace(/\*\*(.+?)\*\*/g, '$1')` — ausgeben.ts:837 `String(b.text).replace(/\*\*(.+?)\*\*/g, '$1')`
   - Urteil: Alle drei (plus eine vierte) Stellen lösen dieselbe Aufgabe: Redions Inline-Markdown aus `block.text` entfernen, damit reiner Text übrig bleibt. Keine ruft die andere auf — `grep -rn "Vorschau.klartext" src` liefert nichts; in folien.ts und ausgeben.ts kommt `Vorschau`/`klartext` nicht vor (grep über beide Dateien). Belege: src/core/slides/folien.ts:124-133 `ohneMarkierung` („Auszeichnung weg — PowerPoint bekommt Text, keine Sterne"), exportiert Z.195 und benutzt Z.146 in `alsZeilen`; src/kern/helfer/vorschau.ts:65-80 `klartext` („Auszeichnungen weg, Text bleibt"), exportiert Z.380, an `window.Vorschau` Z.384; src/bereiche/dateien/ausgeben.ts:837-839 in `dokumentMitText` (Kommentar Z.833-836: Sterne gehören nicht in `<w:t>`). Vierte, vom Leser nicht genannte Kopie: src/core/knowledge/gaps.ts:173-178 `ohneMarkierung` (identisch zur folien-Fassung minus `**`/Link-Zeilen), geprüft durch pruefungen/lauf/test282.mts:249. Die Absicht ist überall dieselbe; vorschau.ts:74-76 sagt selbst „Wer dort eine Auszeichnung ergänzt, muss sie hier ergänzen" — genau die Drift, vor der §8 warnt. Die Umsetzungen weichen jedoch messbar voneinander ab (siehe unterschied), deshalb ist es eine Doppelung MIT Verhaltensunterschieden, keine 1:1-Kopie. Hinweis zur Anfrage „Obsidian/Graph-Datei anlegen": der Auftrag war ausdrücklich nur lesen; ich habe keine Datei geschrieben.
2. **Marken eines Blocks als eigenstaendiges SVG aus `Marken.zeichneMarke` + `verlaufDefs` zusammenbauen** — **gegengeprüft: bestätigt**
   - hier: `src/bereiche/vorlagen/folien.ts:251-267 (`vorschau`)`
   - dort: `src/bereiche/wissen/werkzeuge.ts:2186-2200 (`markenAlsSvg`); dritte Stelle src/bereiche/pdf/document-mode.ts:1073-1085 (`markenVorschau`)`
   - Beleg: folien.ts:256-260 `Marken.verlaufDefs(liste) ... innen += Marken.zeichneMarke(m).outerHTML` — werkzeuge.ts:2190-2194 `marken.map(m => Marken.zeichneMarke(m)).filter(Boolean).map(k => k.outerHTML).join('')` + Kommentar Z.2196 'DIE VERLAUF-VORLAGEN GEHOEREN MIT INS SVG' — document-mode.ts:1082-1083 `Marken.verlaufDefs(marken) ... raum.appendChild(defs)`
   - Urteil: Beide (bzw. alle drei) Stellen lösen nachweislich dieselbe Aufgabe: eine Markenliste über `Marken.zeichneMarke` einzeln zeichnen, das `<defs>` aus `Marken.verlaufDefs` (E545) DAVOR ins SVG legen und daraus ein eigenständiges `<svg viewBox="0 0 B H" preserveAspectRatio="none">` bauen. Keine ruft die andere auf (grep über src: `markenAlsSvg` nur in werkzeuge.ts:1267/1276/2274/2282, `markenVorschau` nur in document-mode.ts:1142, `vorschau` in folien.ts:287). Es gibt sogar zwei WEITERE Stellen mit derselben Kette, die der Leser nicht nennt: src/bereiche/pdf/document-mode.ts:251-262 (Seitenbild für Canvas, mit eigener Bildmarken-Überschreibung `alsBildMarke`, xmlns + width/height) und src/bereiche/dateien/recognition.ts:293-309 (OCR-Ausschnitt, viewBox = region, Hintergrund-rect, Schnittfilter `InkGeometry.intersects`). Der Zeichner selbst ist zentral (src/bereiche/pdf/marken.ts:988 `verlaufDefs`, :1019 `zeichneMarke`, exportiert :7250); dupliziert ist nur der ZUSAMMENBAU. Widerlegungsversuch: Einheiten und Koordinaten sind überall gleich (Markenkoordinaten im Blattraum, viewBox in derselben Einheit, kein Umrechnen), die Reihenfolge defs→Marken ist überall gleich. Die Unterschiede sind Hüllenparameter, kein anderer Algorithmus: (a) Quelle der Liste — folien: synthetische Layout-Marken 960×540; werkzeuge/document-mode: `block.marken`; (b) Ausgabe — String (folien, werkzeuge, document-mode:262) gegen DOM-Element (document-mode:1073, recognition); (c) Klasse `fv-bild` / `marken` / `document-thumbnail-marken`, `aria-hidden` nur bei zwei; (d) werkzeuge hat `rand` (E301) in der viewBox-Breite; (e) document-mode:1073 filtert Bildmarken ohne bekannte Adresse (`Dateien.adresseBekannt`) und fängt JE Marke ab, folien fängt den GANZEN Block ab und gibt '' zurück, werkzeuge fängt gar nicht ab; (f) Leer-Rückgabe: folien '' wenn innen leer (auch mit defs allein wäre innen nicht leer), werkzeuge '' wenn keine Marke gezeichnet (defs allein zählt nicht), document-mode null wenn `gezeichnet===0`.
3. **Die 16:9-Vorgabe 960 x 540 pt (= 12192000 x 6858000 EMU) steht dreimal**
   - hier: `src/bereiche/vorlagen/folien.ts:36-37 `const BREITE = 960; const HOEHE = 540;``
   - dort: `src/bereiche/dateien/einlesen.ts:1931-1932 `emuZuPunkt(...) || 960` / `|| 540`; src/bereiche/dateien/ausgeben.ts:2633 `const FOLIE_BREITE = 12192000, FOLIE_HOEHE = 6858000;``
   - Beleg: vorlagen/folien.ts:35 'PowerPoints Standardmass fuer 16:9, in Punkten (9144000 x 5143500 EMU)' — einlesen.ts:1929 '12192000 x 6858000 EMU, also 960 x 540 pt' (die EMU-Angabe im Kommentar der Vorlagen-Datei widerspricht der im Leser)
4. **EMU -> Punkt (/12700) einmal als Helfer, einmal inline in derselben Datei**
   - hier: `src/bereiche/dateien/einlesen.ts:1013-1014 `const emuZuPunkt = (wert) => Math.round((Number(wert) || 0) / 12700 * 100) / 100;``
   - dort: `src/bereiche/dateien/einlesen.ts:1399-1402 `/* w steht in EMU; 12700 EMU sind ein Punkt. */ ... Math.round((roh / 12700) * 10) / 10``
   - Beleg: beide teilen durch 12700, mit unterschiedlicher Rundung (2 bzw. 1 Nachkommastelle)
5. **`esc` je Datei (Projektregel, mit geschriebenem Grund — kein Versehen, aber ein Duplikat)**
   - hier: `src/bereiche/vorlagen/folien.ts:39-44 `Eigen, nicht geliehen: jede Datei hat ihr esc (CLAUDE.md §19)``
   - dort: `68 Definitionen `const esc = ` in src/ (z.B. src/kern/helfer/vorschau.ts:46, src/bereiche/vorlagen/daten.ts:28)`
   - Beleg: identischer Rumpf `.replace(/&/g,'&amp;').replace(/</g,'&lt;')...` in vorlagen/folien.ts:42-44 und vorschau.ts:46ff.

## Prüfläufe

- `test293` — Folien haben eine Regel, und die steht einmal (E297, L69): Folien.teilen und der pptx-Weg
- `test183` — Die Praesentation zeigt, was auf der Seite steht (E109, L38): Vortragsmodus inkl. Spalten
- `test499` — O3: eine fremde PowerPoint-Datei oeffnen (E540)
- `test500` — Ein Blatt fuellt eine Folie, und der Klick schaltet sie weiter (E544, EIGENE_FOLIE, Schrittzaehler)
- `test501` — Der Deckel bekommt seinen Verlauf, und ein neues Markenfeld uebersteht eine Sicherung (E545)
- `test502` — Eine Folie zu ZEIGEN darf sie nicht aendern (E546)
- `test503` — Die Folienliste zeigt Folien (E547, Miniatur mit Marken)
- `test504` — 'Praesentation' ist ein Weg, und sie hat fertige Folienvorlagen (E548)
- `test505` — Das Menueband bekommt einen Reiter 'Praesentation' (E549)
- `test506` — Das Folienband: Reiter UEBER der Folie (E550)
- `test507` — Eine Folie STEHT, ein Skript ROLLT (E551)
- `test508` — Zeichnen ist ein Reiter, ein Blatt heisst 'Folie' (E552)
- `test509` — Der gelbe Deckel deckt auf, statt weiterzuschalten (E553)
- `test511` — Eine Gruppe ist kein Loch: p:grpSp kommt an (E555)
- `test512` — Ein Absatz hat sein eigenes Format (E557)
- `test513` — Layout und Master: woran eine Folie ihr Aussehen erbt (E558)
- `test514` — Das Farbthema: schemeClr ueber theme1.xml (E559)
- `test515` — Ausrichtung a:pPr@algn und der Knopf dafuer (E560)
- `test516` — Gemischte Laeufe innerhalb eines Absatzes (E561)
- `test517` — Textbreite exakt messen statt schaetzen (L155, E562)
- `test518` — Drehung a:xfrm@rot kommt an (E563)
- `test519` — Tabellen a:tbl als Gitter auf der Folie (E565)
- `test520` — Gefuellte Formen und geerbte Textfarbe (E566)
- `test521` — Die Schriftart a:latin und das Schriftpaar (E567)
- `test525` — Die Rundreise einer .pptx: was hineingeht, kommt wieder heraus (E592/E593)
- `test528` — Folienuebergaenge: was in der .pptx steht, laeuft im Vortrag (E600) — §1 lesen, §2 Marke im Vortrag, §3 kein Uebergang bei Schritt, §4 Original behaelt seine
- `test497` — Das Original bleibt, und der Vortrag ist mit dem Finger bedienbar (E538)
- `test498` — Eine ZIP oeffnen, EINEN Eintrag ersetzen, den Rest unberuehrt lassen (E539)
- `test532` — Die Decke ueber der Folie: das Studio wird ruhig (E612)
- `test510, test527, test539, test541, test114, test126, test191, test272, test338, test63` — Nennen pptx/Folien nur am Rand (Farben des Studios, OneNote-Schreiben, Linse, untere Leiste, Fingergroessen, Bewegung, drei Wege, Griffe, docx-Bilder, Vorlagen) — keine Folien-Wächter

## Doku-Stand

AUFGABEN.md: Tabelle Z.844 (Praesentation: 8 Layouts, Vortragsmodus, .pptx lesen, Rundreise; fehlt 'Uebergaenge, Animationen, Folienmaster'); Reihenfolge Z.860 Punkt 2 'Folienmaster und Uebergaenge — der Rest von 1:1 wie PowerPoint' OFFEN; O3 ERLEDIGT (Z.905, E540); O4 ZUR HAELFTE (Z.922); 'Offen bleibt am Folieneditor' Z.1006-1013: Rollweg 111 px, 'Uebergaenge und Animationen. Redion liest sie beim .pptx-Import nicht' (Z.1010 — VERALTET: einlesen.ts:1442-1508 liest sie seit E600, test528 haelt es), Folienmaster fehlt (Z.1012); O5 ZUR HAELFTE (Z.1022, E592); O5b ERLEDIGT (Z.1029, E593), Rest in L168. LUECKEN.md: L69 (Z.1812) — .pptx steht seit E297, 'OFFEN BLEIBT das Folien-PDF'; L151 (Z.6661) 'Was beim PowerPoint-Lesen NICHT ankommt — offen': offen darin Fusszeilen/Foliennummern aus p:hf, Zellraender, Diagramme, unbekannte Formen (>100 prst), zwei Schriften je Zeile, Spiegelung flipH/flipV, Notizen, Uebergaenge (Z.6751 — teilweise veraltet, s.o.), Animationen; L153 (Z.6834) GESCHLOSSEN bis auf die Navigationspfeile der Folie; L154 (Z.6877) offen ('Neu erstellen' ist eine Liste); L168 (Z.9592) GESCHLOSSEN; L169 (Z.7093) offen: zurueckgeschriebene Folie geht ungepackt (Methode 0) hinein; L172 (Z.9642) GESCHLOSSEN; L160 GESCHLOSSEN. ENTSCHEIDUNGEN.md (Inhaltsverzeichnis): E297, E538, E540-E542, E544, E546-E553, E555-E567, E592-E594, E612 (Z.352-657). E600 ist laut Z.24 'den Folienuebergaengen vergeben und folgt, sobald der Bogen landet' — es gibt KEINEN Eintragskoerper (grep '^#.*E600' leer), obwohl einlesen.ts:1442, werkzeuge.ts:1116, werkzeuge.css:434 und test528 E600 zitieren. ERLEDIGTE-AUFGABEN.md: Z.3550 (E297, core/slides/folien.ts), Z.3093-3096 (PowerPoint-Stand, L69).

## Risiken

- Gespeicherte Marken sind das Datenformat: `point`, `pts`, `breiteBox`, `fontSize`, `dreh`, `schritt`, `verlauf`, `quelle` liegen so in jedem Blattblock in IndexedDB und in jeder .redion/.json-Sicherung (einlesen.ts:2604-2660). Eine gemeinsame Geometrieschicht darf diese Feldnamen nicht umbenennen oder `pts`-Zweipunktform in x/y/w/h umdeuten (CLAUDE.md §53.3, E560-Kommentar einlesen.ts:2596-2616).
- `dreh` gilt fuer Flaechenmarken um die Kastenmitte, Linienzuege drehen stattdessen ihre Punkte (geometry.ts:601-604, marken.ts:1021-1025). Eine Schicht, die Rotation einheitlich als Transform speichert, aendert die Bedeutung vorhandener Daten.
- Die Rueckspur `quelle:{sp,p}` (einlesen.ts:2236-2240) und `folieMitText` (ausgeben.ts:2825ff.) verbinden eine Marke mit einem `<a:t>` der Originaldatei. Wer Marken beim Umbau neu erzeugt (z.B. beim Gruppieren aufteilt) verliert die Spur still — die Ausgabe sagt dann nur 'geaenderte Folieninhalte stehen noch nicht darin' (ausgeben.ts:2981-2985).
- Der frische .pptx-Weg (ausgeben.ts:2994-3001) schreibt nur `Folien.alsZeilen` — Marken werden dort nie gelesen (grep 'marken' im pptx-Abschnitt trifft nur folieMitText). Eine mit `Folienvorlagen` gebaute Praesentation (lauter `blatt`-Bloecke) kommt als eine Zeile '[A4-Blatt]' je Folie heraus (core/slides/folien.ts:166). In LUECKEN.md/AUFGABEN.md nicht gefunden (grep '[A4-Blatt]', 'frische Weg' leer) — vor jeder gemeinsamen Schicht sollte das als Luecke stehen.
- Der Vortrag zeichnet Folienobjekte ueber `outerHTML` (werkzeuge.ts:2190-2194), die Miniatur ueber Knoten (document-mode.ts:1082), die Vorlage ueber outerHTML (vorlagen/folien.ts:256-260). Eine gemeinsame Schicht, die nur einen Weg umstellt, laesst die anderen zwei auseinanderlaufen (§8; der Verlaufs-Fund E545 entstand genau so).
- Undo lebt nur in der Zeichenschicht (marken.ts:1800-2030, 100 Schritte, Laufzeit); Folienreihenfolge, Loeschen und neue Folien laufen ueber Store (document-mode.ts:3443-3457, vorlagen/folien.ts:222). Ein gemeinsames Undo muesste beide Welten kennen oder klar trennen.
- `istFoliensatz` entscheidet ueber das Seitenverhaeltnis (vorlagen/folien.ts:357-363): hochkant gebaute Praesentationen gelten als Notizheft. Eine Geometrieschicht, die Masse veraendert (z.B. Rand `rand` in marken.ts:1806), kann diese Erkennung kippen.
- Uebergaenge sind Daten am Block (`uebergang`), aber Animationen/Master fehlen (L151, AUFGABEN.md:1010-1013); E600 hat keinen Eintragskoerper. Wer die Schicht dokumentiert, findet die Entscheidung nicht.

## Kleinster nächster Schritt (Vorschlag des Lesers)

Doku vor Code, ohne Datenaenderung: (1) E600 als Eintrag in ENTSCHEIDUNGEN.md nachtragen (Verzeichnis + Text, §34) und AUFGABEN.md:1010-1011 sowie LUECKEN.md L151 Z.6751 berichtigen — Uebergaenge werden seit einlesen.ts:1442-1508 gelesen und in werkzeuge.ts:1196-1203 abgespielt (test528). (2) Eine neue Luecke eintragen: der frische .pptx-Export (ausgeben.ts:2994-3001) verliert die Marken einer selbst gebauten Praesentation ('[A4-Blatt]' je Folie, core/slides/folien.ts:166) — mit einem Wächter, der aus `Folienvorlagen.neuePraesentation('titel')` exportiert und im slide1.xml den Titeltext erwartet (muss zuerst rot sein, §50). Erst danach die drei SVG-Zusammenbauer (vorlagen/folien.ts:251-267, werkzeuge.ts:2186-2200, document-mode.ts:1073-1085) auf einen `Marken.alsSvg(marken, breite, hoehe)` zusammenziehen — reine Darstellung, keine Aenderung an gespeicherten Feldern.
