<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, gemeinsam]
stand: 25. September 2026
head: 1b89c01
---

# G · Gemeinsame räumliche Infrastruktur

G · Was es an gemeinsamer räumlicher Infrastruktur SCHON gibt — SelectionFlow (schale/bedienung), InkGeometry/InkShapes/InkStroke (core/ink), SheetSpace (core/sheet), Transaktion (kern/ablage/befehle), Ereignisse/ARTEN/Protokoll (kern/ereignisse), dazu Verlauf (kern/zustand). Befund: der Kern ist da und wird von GENAU EINEM räumlichen System benutzt (Blatt/PDF-Seite, bereiche/pdf/marken.ts); Whiteboard (zeichenflaeche.ts), Gedankenkarte (gedankenkarte.ts) und Schaltplan/Planfläche (schaltplan.ts/planflaeche.ts) rechnen Zeiger, Kasten, Auswahl, Zoom und Rückgängig jeweils selbst (grep der Globalnamen über src/bereiche, 25. September 2026; deckt sich mit doku/REDION-PLATTFORM-AUDIT.md:85-93, §2.1–2.3).

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/schale/bedienung/selection-flow.ts` | Kritisch gedämpfte Feder (OMEGA 0,026, Z. 105) als Keyframes auf transform allein: folge(flaeche, ziel, nachbar, sofort) (Z. 178) für eine Fläche in einer Zeile; fliege(flaeche, von, nach) (Z. 339) als FLIP-Flug eines position:fixed-Elements (Z. 335). Kopf Z. 58-65: gebaut, weil L204 EINEN Helfer für Pille und Werkzeugleiste verlangte. Rückgabe { folge, fliege, DAUER, OMEGA, DEHNUNG_MAX } (Z. 370), Global SelectionFlow (Z. 373). E749: ziehbar(…) hat die freiwillige Übergabe hinauf {nimm(k, 'hoch'\|'aus-zug', x, y)} — steigt der Finger über die Oberkante der Reihe UND mindestens 16 px über den Punkt des Aufsetzens (über dem Tipp-Spielraum des Browsers, Durchsicht E749; gerade hinauf oder aus einem laufenden Pillenzug), nimmt ein anderer den Zug (move/up/cancel); Zeigerfang, Klick- und touchend-Schlucken (nur der Klick der Geste: es endet mit jedem neuen pointerdown, daneben zählt die pointerId) und Escape bleiben in ziehbar; hinauf vor der Übergabe losgelassen ist GENAU EIN Klick, solange der Finger in der Spalte des gedrückten Knopfs bleibt. growFrom(fenster, anker, rahmen?) nimmt ein schon gemessenes Mass. Einziger Nutzer: die untere Leiste (seitenleiste.ts) an TabShelf. | 1254 |
| `src/core/ink/geometry.ts` | DOM-freier Geometriekern für Marken (Kopf Z. 8-11: kennt weder PDF noch Whiteboard noch Store, damit Blatt, PDF-Seite und ein späteres Whiteboard dieselben Regeln verwenden, E125). Exporte Z. 1061-1069: points, simplify, densify, outline/outlinePunkte, path, rectangle, bounds, boundsLokal, ecken, drehung, drehePunkte, move, rotate, scale, intersects, overlapConvex, kastenEcken, distanceToPolyline, touchesCircle, splitByCircle, insidePolygon, polygonArea, union, textWidth/textLines/textLayout, SCHRIFTEN. Global InkGeometry (Z. 1071). | 1071 |
| `src/core/ink/shapes.ts` | Formerkennung aus einem Strich: recognize(pts) gibt line, ellipse, rectangle oder triangle (mit dreh) und zwei Kastenpunkte zurück (Z. 63-274); kennt weder Store noch DOM noch Zeit (Kopf Z. 13). Rückgabe { recognize } (Z. 276), Global InkShapes (Z. 279). | 279 |
| `src/core/sheet/space.ts` | Der Blattraum: A4 in PDF-Punkten (Z. 38-39), RAUM_VERSION 1 (Z. 44), zuBlatt(svg, e) (Z. 56) und umrechner(svg) (Z. 93) über getScreenCTM().inverse() — Kopf Z. 10: EINE STELLE, DIE BILDSCHIRM IN BLATT ÜBERSETZT, und keine zweite; Z. 14-15 zitiert wörtlich die Zeichenflächen-Formel clientX - r.left als Gegenbeispiel. Seitendrehung gedrehtVon/masseVon/drehHuelle (Z. 124-160). Rückgabe Z. 162, Global SheetSpace (Z. 165). | 165 |
| `src/core/ink/stroke.ts` | Der nasse Strich (E376): Feder, glaetter, druckGlaetter, vorhersage — ohne Uhr, Ablage, DOM (Kopf Z. 26-38); Rückgabe Z. 488. Nur von marken.ts genutzt. | 493 |
| `src/kern/ablage/befehle.ts` | Transaktion: Notions fünf Befehle set/update/listAfter/listBefore/listRemove auf Store-Datensätze (Z. 102-188), ausfuehren() alles-oder-nichts mit Rückrollen (Z. 200-251), Verlauf.merke(true) als EIN Undo-Schritt je Transaktion (Z. 215), verlauf im Speicher MAX 50 (Z. 197-198), Endpunkte loadPageChunk/queryCollection/submitTransaction. Rückgabe Z. 533-536, Global Transaktion (Z. 538). Nicht räumlich; kein Zeichenblock ruft es. | 538 |
| `src/kern/ereignisse/bus.ts` | Der Bus: horche/einmal/melde/frage, meldeAsync/frageAsync, darf/darfAsync, schonGemeldet (Z. 91-236); Kopfregel Z. 9-10: ein Modul ruft kein anderes Modul. Global Ereignisse (Z. 57 ff.). | 240 |
| `src/kern/ereignisse/arten.ts` | Namensliste ARTEN (Z. 27-109), darunter auswahlGeaendert: 'auswahl.geaendert' (Z. 51) — den meldet und hört niemand (grep über src ausser arten.ts: 0 Treffer). artKennt Typwächter (Z. 121). Globals Z. 124-125. | 125 |
| `src/kern/ereignisse/protokoll.ts` | Ein Protokoll in meta 'protokoll', MAX 2000 (Z. 42-43), klinkt sich in Store.addBlock/trashBlock/… ein (Z. 172-250). Rückgabe Z. 400. | 404 |
| `src/kern/zustand/verlauf.ts` | Rückgängig/Wiederholen der Schale: ganze Seite je Schritt (Store.baum, Z. 42), Zaun 700 ms, MAX 60 (Z. 33, 46-56). Global Verlauf (Z. 113). Von befehle.ts:215 und editor/mehrfach.ts:87,94 gerufen; register/menueband.ts:785-791 hängt Zurück/Vor daran. | 113 |

## Datenmodell

G speichert selbst fast nichts; es rechnet. (1) SelectionFlow: Lauf {ziel, x0, v0, start, dehnen, anim} in einer WeakMap<HTMLElement, Lauf> im Speicher (selection-flow.ts:121-135), Flugzähler dataset.fluege am Element (Z. 272). (2) SheetSpace: Blattpunkte, 1 pt = 1/72 Zoll, A4 595.28 × 841.89 (space.ts:38-39); Felder am Block im Fach blocks: raumVersion (space.ts:44; geschrieben in marken.ts:1949, blatt.ts:262, pdf/einlesen.ts:237/274/969, document-mode.ts:3481/3752), bw/bh bzw. blattBreite/blattHoehe und gedreht 0/90/180/270 (space.ts:124-136). (3) InkGeometry rechnet über die Marke, wie marken.ts sie schreibt: Feld marken[] am Block (marken.ts:1949 Store.updateBlock(block.id, { marken: marks, raumVersion })), eine Marke = { art, pts: [x,y][], pressure?: number[], breite, dreh?, point, text, fontSize, breiteBox, groesse, gesperrt } (abgelesen aus geometry.ts:635-655 boundsRoh und 1040-1057 scale; dreh im Uhrzeigersinn wie SVG rotate, shapes.ts:22-24). Ein Typ dafür existiert nicht: src/core/types/ kennt weder marken noch shapes/karte/plan (grep; nur folien.ts:46 type Marke = Record<string, any> und pdfWriter.ts:88 PdfMarke). (4) Transaktion: Operation { id, table, path, command, args } (befehle.ts:19-21, Bausteine Z. 265-276), Tabellen block/collection/collection_view/notion_user (Z. 45), schreibt über Store.updateBlock/updateCollection/updateView (Z. 58-62); Verlauf der Transaktionen nur im Speicher (Z. 197). (5) Ereignisse: Map<string, Set<Zuhoerer>> und letzte Meldung je Name im Speicher (bus.ts:60, 67); Protokoll in meta unter Schlüssel protokoll (protokoll.ts:42). (6) Verlauf: Seitenabbilder { pageId, daten: Store.baum(id) } im Speicher, MAX 60 (verlauf.ts:27-33, 42). Die NICHT-Nutzer, jeder mit eigenem Raum und Feld: Whiteboard shapes[] + sicht {x,y,z} + hoehe in CSS-Pixeln bei Massstab 1 ohne raumVersion (zeichenflaeche.ts:202, 517-519, 829); Gedankenkarte karte {knoten, verbindungen, aufbau, sicht} (gedankenkarte.ts:275, 663); Schaltplan plan {teile, leitungen, texte, ebenen, breite, hoehe} in Rasterpunkten mit drehung 0/90/180/270 (planflaeche.ts:180, schaltplan.ts:96-116); PDF-Zoom als meta dokZoom:<pageId>, absichtlich nicht am Block (document-mode.ts:41-58).

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `SelectionFlow.folge / fliege / DAUER / OMEGA / DEHNUNG_MAX` | global | `src/schale/bedienung/selection-flow.ts` | Z. 370-373. Aufrufer: schale/aufbau/seitenleiste.ts:352 (Pille der unteren Leiste, folge; seit E749 ziehbar mit hinauf) und bereiche/pdf/marken.ts:6994-7009 (Werkzeugleiste, fliege, DAUER); seit E749 auch schale/aufbau/tab-shelf.ts (TabShelf: growFrom, highlight, glide, stagger, folge). Sonst niemand; schale/aufbau/studio.ts:18 animiert Einblendungen mit eigenem element.animate, linse.ts nennt SelectionFlow nicht (grep). |
| `InkGeometry.*` | global | `src/core/ink/geometry.ts` | Z. 1061-1071. Aufrufer in src/bereiche: pdf/marken.ts (bounds 1023, union 2056-2057, insidePolygon 2139, touchesCircle 2336, move 4131, scale 4162, rotate 4196, intersects/overlapConvex/ecken 2903-2909), pdf/document-mode.ts:241-244, pdf/seite.ts, dateien/recognition.ts:308, dateien/einlesen.ts, core/export/pdfWriter.ts. NICHT: bloecke/arten/zeichenflaeche.ts, gedankenkarte.ts, planflaeche.ts, schaltplan.ts, elektro/*. |
| `InkShapes.recognize` | global | `src/core/ink/shapes.ts` | Z. 276-279. Einziger Aufrufer: bereiche/pdf/marken.ts. Das Whiteboard hat Stiftstriche (zeichenflaeche.ts:220 s.art === 'stift') und keine Formerkennung. |
| `SheetSpace.zuBlatt / umrechner / A4_* / RAUM_VERSION / gedrehtVon / masseVon / drehHuelle / seiten / rund` | global | `src/core/sheet/space.ts` | Z. 162-165. Aufrufer: pdf/marken.ts (const R = SheetSpace Z. 1610; zuBlatt 2496, 3826, 3894, 4071, 4102, 4225; umrechner 4095), pdf/document-mode.ts:173-175, 313-315, 1054-1055, pdf/seite.ts, pdf/einlesen.ts:237, bloecke/arten/blatt.ts:262, dateien/recognition.ts:247-248, 409, wissen/notebook.ts:267 (nur A4_HOEHE). NICHT: zeichenflaeche.ts:511-514 (eigene Formel), planflaeche.ts:136-144 (eigene Formel), gedankenkarte.ts (misst mit getBoundingClientRect, Z. 1214-1215, 1234, 1254). |
| `InkStroke (Feder, glaetter, druckGlaetter, vorhersage)` | global | `src/core/ink/stroke.ts` | Z. 488. Nur bereiche/pdf/marken.ts. |
| `Transaktion.ausfuehren / befehlAusfuehren / abspielen / setze / aendere / dahinter / davor / heraus / loadPageChunk / queryCollection / submitTransaction / anfrage` | global | `src/kern/ablage/befehle.ts` | Z. 533-538. Aufrufer: hilfe/rundgang.ts, hilfe/stand.ts, hilfe/wissensseiten.ts, verbinden/schnittstelle.ts, wissen/werkzeuge.ts, core/jobs/modell.ts, kern/ablage/indexdb.ts, kern/auftraege/maschine.ts, schale/aufbau/schale.ts. Kein räumlicher Block (grep in bloecke/ und pdf/: 0). |
| `/api/v3/loadPageChunk, /api/v3/queryCollection, /api/v3/submitTransaction` | http | `src/kern/ablage/befehle.ts` | Kopf Z. 12-14, 32-34: der Dienstarbeiter beantwortet sie lokal in Notions Form (test69, test70). |
| `Ereignisse.horche / einmal / melde / frage / meldeAsync / frageAsync / darf / darfAsync / schonGemeldet` | ereignis | `src/kern/ereignisse/bus.ts` | Z. 236. Räumliche Nutzer: pdf/document-mode.ts, pdf/einlesen.ts, pdf/seite.ts. NICHT: zeichenflaeche.ts, gedankenkarte.ts, planflaeche.ts; schaltplan.ts hat ein EIGENES lokales ARTEN-Array (Planarten, schaltplan.ts:166) ohne Busbezug — Namensgleichheit mit kern/ereignisse/arten.ts. |
| `ARTEN.auswahlGeaendert ('auswahl.geaendert')` | ereignis | `src/kern/ereignisse/arten.ts` | Z. 51. Der einzige räumliche Name im Bus — ohne Melder und Hörer (grep über src ausser arten.ts: nichts). |
| `Verlauf.merke / zurueck / vor` | global | `src/kern/zustand/verlauf.ts` | Z. 107-113. Gerufen von kern/ablage/befehle.ts:215, bereiche/editor/mehrfach.ts:87,94, register/menueband.ts:785-791. Kein Zeichenblock ruft merke; alle vier führen eigene Stapel (siehe duplikate). |
| `Register.fachzeichen.masse / anschlussLage / RASTER` | register | `src/bereiche/bloecke/arten/planflaeche.ts` | Z. 493, schaltplan.ts:83-86, 281: der Schaltplan holt Kastenmasse und Raster aus dem Register statt aus InkGeometry — der einzige Nicht-Nutzer, dessen Geometrie über register/ läuft. |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | ja | nein | core: InkPoint [x,y] geometry.ts:14, points() Z. 23; ShapePoint shapes.ts:20 (zweite Definition im Kern). Nicht-Nutzer je eigen: Whiteboard s.pts (zeichenflaeche.ts:220), Schaltplan Punkt {x,y} (schaltplan.ts:108), Gedankenkarte orte {x,y} (gedankenkarte.ts:483). |
| rect | ja | nein | core: InkBounds {x,y,width,height} geometry.ts:15, rectangle(start,end) Z. 291-294, kastenEcken Z. 730. Eigen: zeichenflaeche.ts:219-229 rahmenVon {x,y,w,h}; planflaeche.ts:488-491 inRahmen (min/max von Hand). |
| bounds | ja | nein | core: bounds Z. 625 (gedreht), boundsRoh Z. 635, umschliessend Z. 595, union Z. 962; genutzt marken.ts:1023, 2056-2057, 4770, recognition.ts:308. Eigen: zeichenflaeche.ts:220-224 (Stift-Kasten) und 540-544 (Union für alles ins Bild); gedankenkarte.ts:483 (Masse aus DOM); Schaltplan über Register.fachzeichen.masse (planflaeche.ts:493). |
| transform | ja | nein | core: SheetSpace.umrechner = inverse Bildschirmmatrix (space.ts:93-104); InkGeometry.move Z. 658, scale Z. 1018 (mit achse), drehePunkte Z. 587. Eigen: zeichenflaeche.ts:511-514 punkt() = sicht.x + (clientX - r.left)/sicht.z; planflaeche.ts:136-144 ortAus() = (clientX - r.left) * plan.breite/r.width; gedankenkarte.ts:857-858 CSS translate/scale auf welt. |
| viewport | nein | **ja** | Kein gemeinsamer Ausschnitt. Blatt: viewBox fest A4 (space.ts:23-27). Whiteboard: viewBox aus ausschnitt() + Feld sicht am Block (zeichenflaeche.ts:245, 517-519). Gedankenkarte: sicht {x,y,z} am Block (gedankenkarte.ts:275, 663). PDF: state.zoom + meta dokZoom (document-mode.ts:12, 49-58). Planfläche: viewBox = plan.breite × plan.hoehe (planflaeche.ts:138-140). |
| zoom | nein | **ja** | Nicht im Kern. zeichenflaeche.ts:546-548 (sicht.z, KLEINSTER/GROESSTER); gedankenkarte.ts:1228-1237 zoomen(), 1351-1352 Knöpfe; document-mode.ts:4519-4531 state.zoom, Lupe 4606 (E469). Planfläche: nicht gefunden. |
| pan | nein | **ja** | Nicht im Kern. zeichenflaeche.ts:699 (schiebt); gedankenkarte.ts:1222-1223, 1444-1448; marken.ts:3874 fingerPan. Planfläche: nicht gefunden. |
| selection | nein | **ja** | Kein gemeinsames Auswahlmodell; ARTEN.auswahlGeaendert (arten.ts:51) unbenutzt. marken.ts: selection Set (Z. 2018), Griffe/Lasso/Kreis-Lasso (E353/E466); zeichenflaeche.ts:562 gewaehlt (genau eine Form); planflaeche.ts:710-712 z.auswahl Set + mitGruppe; gedankenkarte.ts:537 gewaehlt (Knoten ODER Verbindung). |
| hitTest | ja | nein | core: intersects Z. 733, overlapConvex Z. 714, distanceToPolyline Z. 738, touchesCircle Z. 814, insidePolygon Z. 936; genutzt marken.ts:2336, 2831-2851, 2903-2909, recognition.ts:308. Eigen: zeichenflaeche.ts:400-411 (breiter unsichtbarer Fangstrich, der Browser trifft); schaltplan.ts:300-312 fangeAnschluss FANG 14 (Quadratabstand); elektro/simulation.ts:287-294 aufStrecke (nur achsenparallel); gedankenkarte.ts:1186-1195 naehe (gewichtete Manhattan-Distanz). |
| snap | nein | **ja** | Nicht im Kern. schaltplan.ts:85 rasten() = Math.round(v / R()) * R() (Kommentar: die eine Stelle), genutzt planflaeche.ts:143; Whiteboard: Raster nur gezeichnet, kein Einrasten (zeichenflaeche.ts:246-249); Blatt: Lineal in pdf/ink-ruler.ts, kein Raster. |
| resizeHandles | ja | nein | Rechnung im Kern: InkGeometry.scale mit Anker und achse (geometry.ts:1018-1058), Griffe gebaut in marken.ts:4162 (vier Griffe, E353/E474). Eigen: zeichenflaeche.ts:266-272 ein Eckgriff wb-griffpunkt + 639-646 groesst; gedankenkarte.ts:768-778 gk-griffel (vier Griffe, die Knoten anlegen statt zu skalieren, Z. 747-751). Beide zusätzlich ein Höhen-Griff am Block (zeichenflaeche.ts:146-149, gedankenkarte.ts:640-643). |
| rotation | ja | nein | core: drehePunkte Z. 587 (die eine Drehformel, E474), rotate Z. 679, drehung Z. 603 (Feld dreh, im Uhrzeigersinn wie SVG rotate, E466); Seitendrehung SheetSpace.gedrehtVon 0/90/180/270 (space.ts:124-127, Feld gedreht, NICHT dreh, Z. 111-116). Eigen: planflaeche.ts:531-534 drehen() in 90°-Schritten auf Feld drehung, Masse über Register.fachzeichen.masse(zeichen, drehung) (Z. 493). Whiteboard, Gedankenkarte: nicht gefunden (grep dreh/rotate leer). |
| group | nein | **ja** | Nicht im Kern. planflaeche.ts:579-596 gruppieren/mitGruppe über Feld gruppe (schaltplan.ts:101-102). marken.ts: Mehrfachauswahl, aber keine gespeicherte Gruppe (grep gruppieren: nicht gefunden; Treffer gruppe sind Werkzeuggruppen der Leiste, Z. 464-568). Whiteboard, Gedankenkarte: nicht gefunden. |
| connector | nein | **ja** | Nicht im Kern (geometry.ts:579 LINIEN kennt line/arrow nur als freie Marken; Verbinder des Shape-Tools offen in L133, test456). Eigen dreimal: zeichenflaeche.ts:233-241 randPunkt + 374-411 verbindungZeichnen (Strahl aus der Kastenmitte); gedankenkarte.ts:79-87 GkVerbindung, 822-840 (Seitenmitten, Bezier), 1406-1407 verbinden (E628); schaltplan.ts:108, 352 leitungen/verbindungspunkte (orthogonal auf Raster). |
| frame | ja | nein | Kastenzug (Rahmenauswahl) im Kern über rectangle/union/intersects/overlapConvex, genutzt marken.ts:2894-2909. Eigen: planflaeche.ts:488-500 inRahmen + 688 zieht.art 'rahmen'. Whiteboard, Gedankenkarte: nicht gefunden (nur Einzelauswahl). |
| zOrder | nein | **ja** | Nicht im Kern. marken.ts:2165-2181 nachVorn/nachHinten = Listenreihenfolge (E466, gesperrt bleibt, E473); zeichenflaeche.ts:258-261 nur feste Regel Verbindungen unter Formen; planflaeche.ts:303-304, 950-951 Ebenen statt Reihenfolge; gedankenkarte: nicht gefunden. |
| undo | ja | **ja** | kern: Verlauf (verlauf.ts:29, Seitenabbild MAX 60, merke Z. 46-56) und Transaktion → Verlauf.merke (befehle.ts:215). Trotzdem vier eigene Stapel aus JSON-Abbildern: marken.ts:2022-2031 historyUndo/historyRedo; zeichenflaeche.ts:164-166 (SCHRITTE 40); gedankenkarte.ts:646-660 (SCHRITTE 40); planflaeche.ts:176-196 (60). Strg+Z: planflaeche.ts:1017, Whiteboard seit E682 (zeichenflaeche.ts:178-185, test568 §3); der Seitenverlauf gibt beim Zurücknehmen allen Blöcken neue Kennungen (AUDIT Punkt 4, E682). NACHGETRAGEN (E687, 25. September abends): von den vier eigenen Stapeln sind drei EINER geworden — src/core/gfx/history.ts `GfxHistory.erstelle(tiefe)`, gerufen von zeichenflaeche.ts (40), gedankenkarte.ts (40), planflaeche.ts (60); nur marken.ts (E378, flache Abbilder) bleibt eigen, mit Grund. Wächter test571. |
| pointerNormalisierung | ja | **ja** | Teilweise im Kern: SheetSpace.umrechner holt die Matrix EINMAL je Ereignis (space.ts:62-104, E511), marken.ts:4095-4098 speist getCoalescedEvents hindurch; Druck/Aussetzer glättet InkStroke.druckGlaetter (stroke.ts:488, E675); pointerType pen/touch/Handballen nur in marken.ts:3851-3891, 4010, 4050. Kein gemeinsamer Zeigerhelfer: document-mode.ts:3983-3984, notebook.ts:1173-1182, bibliothek.ts:668-762, wischen.ts:259 prüfen pointerType je selbst; zeichenflaeche.ts, planflaeche.ts, gedankenkarte.ts kennen weder pointerType noch getCoalescedEvents (grep leer). |

## Gemeinsam genutzt

**Benutzt:** [[kern-InkGeometry|InkGeometry]] · [[kern-InkShapes|InkShapes]] · [[kern-InkStroke|InkStroke]] · [[kern-Store|Store]] · [[kern-Verlauf|Verlauf]] · [[kern-Register|Register]] · [[kern-SelectionFlow|SelectionFlow]]

**Nur genannt, nicht benutzt:** [[kern-SheetSpace|SheetSpace]] · [[kern-Ereignis|Ereignis]] · [[kern-Dateien|Dateien]] · [[kern-GfxHistory|GfxHistory]] — der Befund sagt, warum.

- src/kern/ablage/indexdb.ts (Store): Transaktion schreibt über Store.updateBlock/updateCollection/updateView (befehle.ts:58-62); marken.ts:1949 schreibt marken+raumVersion über Store.updateBlock; Protokoll über Store.setMeta (protokoll.ts:96-134).
- src/kern/zustand/verlauf.ts (Verlauf): befehle.ts:215 Verlauf.merke(true) — ein Schritt je Transaktion.
- src/kern/ereignisse/protokoll.ts (Protokoll): befehle.ts:242-246 Protokoll.notieren('transaktion', …).
- src/kern/ereignisse/bus.ts + arten.ts: von pdf/document-mode.ts, pdf/einlesen.ts, pdf/seite.ts benutzt (grep Ereignisse./ARTEN.).
- src/register/… (Register.fachzeichen): der Schaltplan holt Kastenmasse/Anschlusslage/RASTER aus dem Register (planflaeche.ts:493, schaltplan.ts:83-86, 281) — Geometrie über register/, nicht über core/.
- src/schale/aufbau/seitenleiste.ts:349-352 nutzt SelectionFlow.folge; bereiche/pdf/marken.ts:6994-7009 nutzt SelectionFlow.fliege — beide mit typeof-Wächter.
- Pflege.fehlerMerken aus bus.ts:78 (Fehler eines Zuhörers werden gemerkt).
- src/core/ink/geometry.ts liefert SCHRIFTEN/schriftStapel an marken.ts:666-681 (E562: ein Katalog statt zwei).

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[zeichenflaeche|B · Whiteboard / Zeichenfläche]] · [[elektro|F · Schaltplan, Fachzeichen, Elektro]] · [[gedankenkarte|C · Gedankenkarte (Mindmap)]]

1. **Rückgängig-Stapel aus JSON-Abbildern, zwei Listen, feste Tiefe — viermal in Bereichen, einmal im Kern**
   - hier: `src/kern/zustand/verlauf.ts:53-55`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:164-166 und gedankenkarte.ts:646-648 (Zeile für Zeile gleich), planflaeche.ts:183-185, pdf/marken.ts:2022-2031`
   - Beleg: verlauf.ts: zurueckStapel.push(m); if (zurueckStapel.length > MAX) zurueckStapel.shift(); vorStapel.length = 0; — zeichenflaeche.ts UND gedankenkarte.ts: const SCHRITTE = 40; const zurueckStapel: string[] = []; const vorStapel: string[] = []; — planflaeche.ts: z.zurueck.push(vorher); if (z.zurueck.length > 60) z.zurueck.shift(); z.vorwaerts.length = 0;
2. **Bildschirm → Raum: drei Formeln neben der einen Matrix**
   - hier: `src/core/sheet/space.ts:56-59, 93-104`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:511-514 und planflaeche.ts:136-144`
   - Beleg: space.ts:10: EINE STELLE, DIE BILDSCHIRM IN BLATT ÜBERSETZT — und keine zweite; Z. 14-15 zitiert das Gegenbeispiel wörtlich: return [Math.round(e.clientX - r.left), …]. zeichenflaeche.ts:513: return [Math.round(sicht.x + (e.clientX - r.left) / sicht.z), …]. planflaeche.ts:141: const x = (e.clientX - r.left) * sx; (sx = plan.breite / r.width, kennt weder Letterbox noch CSS-Verwandlung).
3. **distanceToSegment — zweimal im Kern selbst, Zeichen für Zeichen gleich**
   - hier: `src/core/ink/geometry.ts:27-35`
   - dort: `src/core/ink/shapes.ts:31-38`
   - Beleg: beide: const amount = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(point[0] - (start[0] + amount * dx), point[1] - (start[1] + amount * dy));
4. **Punktprobe an einer Strecke, dritte Fassung (nur achsenparallel)**
   - hier: `src/core/ink/geometry.ts:27 distanceToSegment, 738 distanceToPolyline`
   - dort: `src/bereiche/elektro/simulation.ts:287-294 aufStrecke`
   - Beleg: simulation.ts: if (Math.abs(ay - by) <= 1 && Math.abs(py - ay) <= NAH) return px >= Math.min(ax, bx) - NAH && px <= Math.max(ax, bx) + NAH; — dieselbe Frage (liegt p nahe an der Strecke a–b), auf waagrecht/senkrecht beschränkt.
5. **Kasten um eine Punktliste (min/max über xs/ys)**
   - hier: `src/core/ink/geometry.ts:595-599 umschliessend, 635-655 boundsRoh`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:220-224 rahmenVon für 'stift'`
   - Beleg: geometry.ts: const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x0 = Math.min(...xs), y0 = Math.min(...ys); return { x: x0, y: y0, width: Math.max(...xs) - x0, … } — zeichenflaeche.ts: const xs = s.pts.map((q: any) => q[0]), ys = s.pts.map((q: any) => q[1]); const x = Math.min(...xs), y = Math.min(...ys); return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
6. **Union mehrerer Kästen für alles ins Bild**
   - hier: `src/core/ink/geometry.ts:962-969 union`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:540-544 insBild`
   - Beleg: geometry.ts: const x0 = Math.min(...boxes.map(b => b.x)); … const x1 = Math.max(...boxes.map(b => b.x + b.width)); — zeichenflaeche.ts: const x1 = Math.min(...rahmen.map(r => r.x)) - 30; … const x2 = Math.max(...rahmen.map(r => r.x + r.w)) + 30;
7. **Wo ein Verbinder den Rand seines Kastens trifft — zwei Formeln für eine Aufgabe**
   - hier: `src/bereiche/bloecke/arten/zeichenflaeche.ts:233-241 randPunkt`
   - dort: `src/bereiche/bloecke/arten/gedankenkarte.ts:822-829`
   - Beleg: zeichenflaeche.ts: const anteil = Math.min(halbW / Math.abs(dx || .0001), halbH / Math.abs(dy || .0001)); return [mx + dx * anteil, my + dy * anteil]; (Strahl aus der Mitte) — gedankenkarte.ts: const p1 = waagerecht ? { x: bmx >= amx ? a.x + aM.w : a.x, y: amy } : { x: amx, y: bmy >= amy ? a.y + aM.h : a.y }; (Seitenmitte). Kein Kern kennt Verbinder (geometry.ts:579 LINIEN nur line/arrow).
8. **Höhen-Griff am Block und Speichern der Höhe**
   - hier: `src/bereiche/bloecke/arten/zeichenflaeche.ts:146-149, 829`
   - dort: `src/bereiche/bloecke/arten/gedankenkarte.ts:640-643, 1570`
   - Beleg: beide: const griff = document.createElement('div'); griff.className = 'wb-griff' bzw. 'gk-griff'; griff.title = 'Höhe ziehen'; w.appendChild(griff); — und beide: Store.updateBlock(block.id, { hoehe: Math.round(….getBoundingClientRect().height) });
9. **Ausschnitt sicht {x,y,z} als Blockfeld, zweimal geschrieben, ohne Typ und ohne raumVersion**
   - hier: `src/bereiche/bloecke/arten/zeichenflaeche.ts:517-519`
   - dort: `src/bereiche/bloecke/arten/gedankenkarte.ts:275, 663`
   - Beleg: zeichenflaeche.ts: Store.updateBlock(block.id, { sicht: { x: Math.round(sicht.x), y: Math.round(sicht.y), z: Math.round(sicht.z * 100) / 100 } }) — gedankenkarte.ts: sicht: { x: 0, y: 0, z: 1 } … Store.updateBlock(block.id, { karte: … }); PDF legt den Zoom dagegen bewusst in meta (document-mode.ts:41-58: Zoomen soll weder edited anheben noch eine Fassung erzeugen).
10. **Rahmenauswahl (Kastenzug)**
   - hier: `src/bereiche/pdf/marken.ts:2894-2909 (über InkGeometry.union/intersects/overlapConvex)`
   - dort: `src/bereiche/bloecke/arten/planflaeche.ts:488-500 inRahmen`
   - Beleg: marken.ts: if (!InkGeometry.intersects(box, InkGeometry.bounds(mark))) return; — planflaeche.ts: const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x); … if (t.x >= x1 && t.y >= y1 && t.x + m.w <= x2 && t.y + m.h <= y2) raus.push(t.id); (dasselbe wie InkGeometry.rectangle Z. 291 + Enthaltensein, von Hand).
11. **sv(name, attrs) — SVG-Element mit Attributschleife**
   - hier: `src/bereiche/bloecke/arten/zeichenflaeche.ts:31-36`
   - dort: `src/bereiche/bloecke/arten/gedankenkarte.ts:113-118`
   - Beleg: beide: const NS = 'http://www.w3.org/2000/svg'; const sv = (name: string, attrs: Record<string, unknown> = {}) => { const e = document.createElementNS(NS, name); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v))); return e; }; (AUDIT D4 nennt 7 Dateien mit createElementNS(NS)).

## Prüfläufe

- `test541` — Die untere Leiste hat EINE Fläche und sie wandert (E646): sechs Zusagen an SelectionFlow.folge — transform statt width, Zwischenorte, A→B→C lenkt um, kein Hit-Target bewegt sich.
- `test114` — Mobile-UX-Regeln; §17 hält seit E236 keine Bewegung ohne Anlass — dafür der Zähler dataset.fluege (selection-flow.ts:184, 266-272).
- `test539` — Die Linse liegt über den Knöpfen und steht niemandem im Weg (E639); nennt SelectionFlow.
- `test366` — Stiftweg vor E376 gemessen; §1 hält Feder und InkGeometry.outline zeichengleich — ohne Browser.
- `test367` — Befund nach E376: der nasse Strich (stroke.ts) gegen geometry.ts.
- `test564` — Der Glätter hält die Ecke (E676): InkGeometry.stueck/ECKE_COS, §1–§3 ohne Browser, §4 bis aufs Papier.
- `test561` — Der Füller läuft spitz aus (E673): spitzeFaktor/verjuengen, PDF-Kontur gegen Bildschirm-Bogen.
- `test474` — Das Gedrehte ist wirklich gedreht (E474): drehePunkte, ecken, boundsLokal, overlapConvex, scale mit achse.
- `test447` — dreh an der Marke seit E466 — Drehen, Kasten, Griffe.
- `test345` — Die Auswahl bewegt und skaliert (E353): InkGeometry.scale um die Gegenecke, Lasso, insidePolygon.
- `test201` — Marker, Formen, Text, Mehrfachauswahl und Aktionsverlauf müssen auf Blatt und PDF-Seite gleich gehen.
- `test343` — Schrift, Linie und Formen fertig (Redurs Satz) — Marken über InkGeometry; test344 der zweite Teil.
- `test352` — Textkasten mit Umbruch (E360): InkGeometry.textLayout/textLines deterministisch.
- `test517` — Buchstabenbreiten: InkGeometry.textWidth gemessen statt geschätzt (E562), Rückfall in Node; test512/516 messen pptx-Öffnen damit.
- `test347` — Formerkennung (E355): Linie, Kreis/Ellipse, Rechteck erkannt, Gekritzel nicht — InkShapes.recognize.
- `test445` — Aufrechtes Dreieck (E471) und vier Reste aus E465.
- `test451` — Gedrehtes Dreieck mit dreh (E478); Gegenprobe der abgeschalteten Passprobe.
- `test461` — Stift verbessern (Redur, 7. September): InkShapes im Zusammenspiel mit Halten.
- `test456` — L133 Kurve und Verbinder des Shape-Tools; test457/464/468/470 weitere L133-Reste und GoodNotes-Dossier.
- `test439` — Formen-Bogen aus E465; InkGeometry.densify im Kritzel-Radierer (G41).
- `test440` — Seitenmenü E465/E467: SheetSpace.gedrehtVon/drehHuelle.
- `test449` — Die letzten zwei ungeprüften Funde nach E473.
- `test478` — Die Tinte holt die Spitze ein (E511): SheetSpace.umrechner, eine Matrix je Ereignis.
- `test473` — Stift-Dossier S. 6: Koordinaten — SheetSpace/getScreenCTM statt getBoundingClientRect.
- `test174` — Der Block blatt ist A4 in Punkten (space.ts) und beschreibbar.
- `test180` — Gerasterte Seitenbilder bleiben aus der Sicherung (E103); Blattmasse über SheetSpace.
- `test70` — Transaktion: fünf Befehle und drei Endpunkte gegen die echte App.
- `test69` — Echtes fetch('/v1/…') über den Dienstarbeiter ohne Server; Transaktion.anfrage.
- `test71` — Das gemeinsame Protokoll: was wann von wem geschah.
- `test85` — Suite 50, der Kern: Helfer, Sicherheit, Formen, Umzüge, Ereignisse (Bus).
- `test422` — Jeder Ereignisname kommt aus ARTEN statt roher Zeichenketten (E429).
- `test280` — Auftragsmaschine meldet über Ereignisse (E286); test315/320 die Schritte und das Fenster.
- `test568` — Plattform-Audit vom 25. September: §1 Schaltplan, §3 Whiteboard (Strg+Z gehört der Fläche, E682), §4 Gedankenkarte — die Nicht-Nutzer des Kerns.
- `test537` — Bereiche bleiben getrennt (E626): bereiche-bestand.json darf nur schrumpfen — jede gemeinsame Schicht muss nach core/kern, nicht in einen Bereich.
- `test529` — Gedankenkarte (XMind-Wunsch, 16. September) — eigener Raum, eigener Stapel; test538 Griffe, Verbindungen, Formen, Vorlagen (E628).
- `test238` — Elektro-Modus: Schaltpläne über Register.fachzeichen, eigenes Raster.

## Doku-Stand

AUFGABEN.md: keine offene Aufgabe für eine gemeinsame räumliche Schicht (grep räumlich/Whiteboard/Gedankenkarte/SelectionFlow/InkGeometry: nur Erledigtes — G41 densify und G42 umrechner 'Steht.' Z. 487-500, Dock-Welle erledigt mit E625 Z. 1195-1205). LUECKEN.md: L204 (Auswahl fängt bei null an) GESCHLOSSEN mit E646/E647, Z. 9880-9896 — SelectionFlow ist genau der Helfer. OFFEN und dieses System betreffend: L191 Z. 7581 (dritter Kopplungsweg Präfix→Bereich fehlt test537); L209 Z. 8241-8335 (Stift gegen GoodNotes, Punkte 1–15: Tempo/Breite, Druckkennlinie, Gelenk im Umriss, nasser Strich im selben SVG, Formsprung RDP, Pinsel/Marker, Auswahl-Menü an der Auswahl, Lineal-Zustand, Zwischenablage …); L155 Z. 6927-6964 (charWidth-Tabelle nachweislich zu niedrig, geometry.ts:335-351 sagt es selbst); L133 (Rest GoodNotes, u. a. Kurve/Verbinder des Shape-Tools, test456/457/464/468; AUFGABEN.md:254-353); L174 Z. 7201 (Auswahl-Werkzeugleiste breiter als das Fenster); L177 Z. 7260, L192 Z. 7614, L199 Z. 7840 (Gedankenkarte: Marker/Notizen, Verbindung beschriften, Alles einpassen schneidet links ab). LUECKEN.md:28 führt Ink V2 (E125) als geschlossen. ENTSCHEIDUNGEN.md (Verzeichnis): E125 Z. 175 (Ink V2 erweitert den Dokumentraum, nicht die Zahl der Zeichenmaschinen — Gründungssatz von geometry.ts), E138 Z. 188 (Whiteboard ist eine Fläche), E353 Z. 414, E360 Z. 421, E362 Z. 423 (Bus async), E429 Z. 490 (ARTEN statt Zeichenketten), E466 Z. 512, E467 Z. 513, E469 Z. 515, E474 Z. 520, E506 Z. 552, E511 Z. 557 (umrechner), E562 Z. 608, E628 Z. 673 (Gedankenkarte eigene Griffe/Verbindungen), E640/E641 Z. 685-686, E646/E647 Z. 691-692 (SelectionFlow, L204 zu), E673 Z. 718, E676 Z. 721, E681 Z. 726 (Plattform-Audit + doku/karte), E682 Z. 727 (Strg+Z gehört der Fläche). ERLEDIGTE-AUFGABEN.md:566-588 (E646/E647), 2095 (geometry.ts als neutraler Kern), 4139-4174 (InkShapes, scale, splitByCircle, outline). doku/REDION-PLATTFORM-AUDIT.md:30-31 nennt als Punkt 1 einen gemeinsamen GFX-/Canvas-Kern für Whiteboard, Gedankenkarte, PDF-Ink, Präsentation, Schaltplan; §2.2 Z. 174-186 misst dasselbe wie hier; §2.3 D1–D7. Widerspruch in der erzeugten Karte: doku/karte/kern-InkGeometry.md sagt 'kein Befund belegt einen Aufruf' — falsch, marken.ts ruft InkGeometry an über 40 Stellen (siehe schnittstellen). Keine L-Nummer benennt die Zeigerumrechnung des Whiteboards/Schaltplans als Lücke (grep zuBlatt/umrechner/getScreenCTM in LUECKEN.md: nur Blatt-Kontext).

## Risiken

- Vier Räume, verschiedene Felder: Blatt in PDF-Punkten mit raumVersion (space.ts:44, marken.ts:1949), Whiteboard in CSS-Pixeln OHNE raumVersion (zeichenflaeche.ts:202), Schaltplan in Rasterpunkten (schaltplan.ts:83-86), Gedankenkarte mit gerechneter Lage (gedankenkarte.ts:483). Eine gemeinsame Schicht, die Koordinaten vereinheitlicht, ist eine Datenmigration (§9, §53.3) — jede alte Sicherung läse verrutscht, ohne Fehlermeldung (space.ts:17-21).
- Drei Drehfelder mit drei Bedeutungen: dreh an der Marke (geometry.ts:603, Grad, beliebig), gedreht an der Seite (space.ts:111-116, 0/90/180/270, nicht /Rotate der PDF) und drehung am Schaltplanteil (planflaeche.ts:534, 90°-Schritte). Zusammenlegen hiesse umbenennen = Sicherungen unlesbar (§53.3).
- Die räumlichen Felder sind untypisiert (src/core/types/ kennt weder marken noch shapes/karte/plan; folien.ts:46 type Marke = Record<string, any>) und in doku/REDION-FORMAT.md nicht beschrieben (AUDIT Z. 189-191) — eine gemeinsame Schicht ohne Typ verschiebt den Fehler nur.
- Undo: Verlauf.anwenden gibt beim Zurücknehmen allen Blöcken der Seite neue Kennungen (AUDIT Punkt 4; E682; test568 §3). Wer die vier eigenen Stapel durch Verlauf ersetzt, bricht Kennungen (§9, §14). Umgekehrt merkt befehle.ts:215 schon in Verlauf — eine Transaktion aus einem Zeichenblock würde doppelt gemerkt.
- Der Ausschnitt wird am Block gespeichert (zeichenflaeche.ts:517, gedankenkarte.ts:663) und hebt edited/Fassungen an — PDF hat sich aus genau diesem Grund für meta entschieden (document-mode.ts:41-48). Eine gemeinsame Viewport-Schicht muss das entscheiden, sonst zwei Wahrheiten (§8).
- SheetSpace.umrechner darf ein Ereignis nicht überleben (space.ts:85-91); getScreenCTM kostete 45 % des Zeichenwegs (Z. 70-79). Wer ihn ins Whiteboard hebt, misst neu (§36) — die Gedankenkarte läuft als HTML mit CSS-transform (gedankenkarte.ts:857), nicht als SVG mit viewBox.
- SelectionFlow.fliege setzt position:fixed und transform-origin 0 0 voraus (selection-flow.ts:335, 346) und folge liest den Ort aus translateX(…) im Stil (Z. 225); in einem gescrollten oder skalierten Behälter stimmt die Rechnung nicht. Der Radius skaliert mit (Z. 310-313).
- test537: bereiche-bestand.json darf nur schrumpfen (§5). Eine Schicht, die in einem Bereich liegt und von anderen gerufen wird, macht den Lauf rot; sie gehört nach src/core oder src/kern — dann ohne Bereichswissen (§4).
- Der Bus kennt auswahl.geaendert (arten.ts:51) und niemand meldet es: ein gemeinsames Auswahlmodell über den Bus hätte heute null Hörer und bliebe ohne Wächter grün (§55.2).
- InkGeometry.charWidth ist nachweislich zu niedrig (L155, geometry.ts:335-351) und steuert den Umbruch JEDER Textmarke; wer den Kern teilt, teilt den Fehler mit.

## Kleinster nächster Schritt (Vorschlag des Lesers)

Zeiger→Raum an EINER weiteren Stelle auf SheetSpace.umrechner ziehen, ohne ein Datenfeld anzufassen: die Planfläche (planflaeche.ts:136-144 ortAus) und das Whiteboard (zeichenflaeche.ts:511-514 punkt) zeichnen beide in ein SVG mit viewBox (planflaeche.ts:138-140, zeichenflaeche.ts:245); getScreenCTM().inverse() liefert dort dieselbe Zahl wie heute — plus Rollstand, Zoom und CSS-Verwandlungen, die die Handformel nicht kennt (space.ts:26-27, AUDIT D2). Vorher der Wächter (§30, §50): ein Lauf, der die Fläche per CSS transform: scale(1.5) oder Browser-Zoom verzerrt und einen Punkt setzt — gegen den alten Stand rot (Strich landet daneben), mit dem Umrechner grün. Danach beim Speichern raumVersion mitschreiben (wie marken.ts:1949), damit spätere Deutungen erkennbar bleiben (space.ts:29-32). Parallel, ohne Daten: die zweite distanceToSegment in shapes.ts:31-38 streichen und die aus geometry.ts:27 nehmen — beide liegen im Kern, test347/test445 halten die Formerkennung. Und die erzeugte Karte reparieren: doku/karte/kern-InkGeometry.md behauptet null Aufrufer.
