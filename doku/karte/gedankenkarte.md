<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, gedankenkarte]
stand: 25. September 2026
head: a196b65
---

# C · Gedankenkarte (Mindmap)

C · Gedankenkarte (Mindmap) — Blockart `mindmap`, globaler Name `Gedankenkarte`, CSS-Namensraum `gk-`

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/bereiche/bloecke/arten/gedankenkarte.ts` | Die ganze Gedankenkarte: Modell (GkKnoten/GkVerbindung/GkKarte, Z. 48–103), Palette/Formen/Vorlagen (Z. 123–260), leseKarte (Z. 291), baum (Z. 376), aufbauen = Layout ohne DOM (Z. 430), zeichne = Leiste, Bühne, Griffe, Verbindungen, Rückgängig, Zoom/Pan, Tastatur (Z. 533–1590). Export: { zeichne, leseKarte, neueKarte, aufbauen, baum, PALETTE, farbeVon } (Z. 1593), global (window as any).Gedankenkarte (Z. 1596) | 1596 |
| `quell/schale/stil/werkzeuge.css` | Stil der Karte, Namensraum gk- (Z. 1340–1556): Schichten .gk-buehne/.gk-welt/.gk-linien (Kopf Z. 1340–1352), Griffe .gk-griffel (Z. 1461–1473, Telefon Z. 1551–1554), Verbindungen .gk-verb-fang/.gk-verb-linie/.gk-spitze (Z. 1490–1497), Formen über [data-form] (Z. 1511–1538). Kein src-Gegenstück: CSS liegt nur unter quell/ (git ls-files zeigt nur quell/schale/stil/werkzeuge.css) | 0 |
| `src/register/bloecke.ts` | Registereintrag { id:'mindmap', name:'Gedankenkarte', icon:'🧠', gruppe:'Wissen', cmd:[…'xmind'…], ph:'Zentrales Thema' } (Z. 97–99) |  |
| `src/bereiche/editor/ansicht/editor.ts` | Einziger Aufrufer: case 'mindmap': box.appendChild(Gedankenkarte.zeichne(block)) (Z. 904–905) |  |
| `src/kern/helfer/vorschau.ts` | 'mindmap' in TRAEGT_KEINEN_TEXT — Miniatur zeichnet für die Karte keinen Textstreifen (Z. 195–196) |  |
| `index.html` | <script src="quell/bereiche/bloecke/arten/gedankenkarte.js" defer> (Z. 585); dazu GRUNDSTOCK-Eintrag in src/dienst/sw.ts Z. 171 |  |
| `bilder.mts` | Bildansichten gedankenkarte (Z. 1770), gkformen (Z. 4181), gkvorlagen (Z. 4229) |  |

## Datenmodell

Kein eigenes IndexedDB-Fach, kein eigener Bereich: die Karte ist ein gewöhnlicher Block vom Typ `mindmap` im Fach `blocks` und hängt komplett am Feld `block.karte` (E607, ENTSCHEIDUNGEN.md:49121–49124: „Kein eigener Bereich, kein eigenes Fach in IndexedDB, kein eigenes Dateiformat — die Karte liegt als Feld `karte` am Block"). Geschrieben wird ausschliesslich über `Store.updateBlock(block.id, { karte: JSON.parse(JSON.stringify(karte)) })` (gedankenkarte.ts:662–664), aufgerufen aus `aendere` (Z. 667–673), `einsetzen` (Z. 675), `zoomen` (Z. 1239), `einpassen` (Z. 1282) und dem Schiebe-Ende (Z. 1455). Die Höhe des Kastens steht daneben als `block.hoehe` (Z. 543, Z. 1570). Format von `karte` (Typ GkKarte, Z. 85–90): `knoten: GkKnoten[]` mit { id, text, eltern: string|null, seite?: 'links'|'rechts', farbe?: '#hex', zu?: true, form?: string } (Z. 48–56) — Baum über `eltern`, Wurzel fest 'w' (Z. 176, 264); `verbindungen: GkVerbindung[]` mit { id, von, zu } als zweite flache Liste neben dem Baum (Z. 79–83, Begründung Z. 58–78); `aufbau: string` (immer 'karte'); `sicht: { x, y, z }` (Viewport; z in [0.2, 4], Z. 366–370). Regeln: `rund` als Form wird NIE gespeichert (formSetzen löscht das Feld, Z. 1158; Kommentar Z. 141–144); unbekannte Formen bleiben beim Lesen erhalten, nur die Gestalt des Wertes wird geprüft `/^[a-z][a-z0-9-]{0,23}$/` (Z. 314–321, §18); Verbindungen ohne beide Enden oder doppelte Paare fallen beim Lesen still weg (Z. 331–353); kaputte Eltern-Zeiger/Ringe hängen sich an die Wurzel (baum, Z. 376–413). Kennungen: 'gk' + Ids.short() (Z. 159–161). Kein Eintrag `karte`/`hoehe` in src/core/types/block.ts (Z. 61–70 kennen nur icon, collectionId, aktiveView, dateiId, papierkorbSichtbarSeit) — das Feld ist im zentralen Typ nicht deklariert; `leseKarte(block: any)`.

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Gedankenkarte` | global | `src/bereiche/bloecke/arten/gedankenkarte.ts:1593-1596` | (window as any).Gedankenkarte = { zeichne(block): HTMLElement, leseKarte(block): GkKarte, neueKarte(titel?), aufbauen(karte, masse): GkAufbau, baum(karte), PALETTE, farbeVon(i) } |
| `Register.bloecke Eintrag 'mindmap'` | register | `src/register/bloecke.ts:97-99` | Blockart in Gruppe Wissen, Slash-Befehle gedankenkarte/mindmap/xmind/karte/brainstorm…, Platzhalter 'Zentrales Thema' |
| `editor.ts case 'mindmap'` | funktion | `src/bereiche/editor/ansicht/editor.ts:904-905` | Der Editor ruft Gedankenkarte.zeichne(block) — Querverweis Bereich editor → bloecke über globalen Namen (der Weg, den test537 in bereiche-bestand.json führt) |
| `Store.updateBlock` | funktion | `src/kern/ablage/indexdb.ts:440` | Einziger Schreibweg: { karte } bzw. { hoehe } als Patch am Block |
| `UI.toast / UI.menu` | global | `src/schale/ueberlagerung/ui.ts:30-41` | Hinweise (Z. 1050, 1126, 1141, 1151…) und das Vorlagenmenü (vorlagenMenue, Z. 1317–1332) |
| `Dialog.wahl` | global | `src/schale/ueberlagerung/dialog.ts:121` | Rückfrage vor dem Ersetzen durch eine Vorlage (gedankenkarte.ts:1295–1306) |
| `Ids.short` | global | `src/core/helpers/ids.ts:69,118` | Kennungen der Knoten/Verbindungen, mit Rückfall auf performance.now (gedankenkarte.ts:159–161) |
| `Zeiger-/Tastenereignisse an .gk-buehne` | ereignis | `src/bereiche/bloecke/arten/gedankenkarte.ts:1373-1556` | pointerdown (Griff-Tipp/Zug, Verbindung wählen, Knoten wählen, Fläche schieben), dblclick, wheel+Strg, keydown (Tab/Enter/F2/Leer/Entf/Pfeile/Strg+Z), keypress, paste, focusout |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | ja | **ja** | type GkOrt = { x, y } (gedankenkarte.ts:93); core/ink/geometry.ts hat InkPoint = [number, number] (Z. 15) — nicht benutzt |
| rect | ja | **ja** | GkOrt + GkMass { w, h } getrennt (Z. 92–93); Knoten-Kasten aus offsetWidth/offsetHeight gemessen (Z. 902) |
| bounds | ja | **ja** | aufbauen: minX/minY/maxX/maxY über alle Orte, breite/hoehe = max−min + RAND*2 (Z. 512–527) |
| transform | ja | **ja** | sichtAnwenden: welt.style.transform = translate(−sicht.x, −sicht.y) scale(sicht.z) (Z. 856–861); keine Matrix, keine Umrechnung Bildschirm→Welt (Zeigerorte werden nur relativ verschoben) |
| viewport | ja | **ja** | karte.sicht { x, y, z } im Block (Z. 89); einpassen (Z. 1251–1284) mit LESBAR-Untergrenze 0.72 (Z. 424); insBild (Z. 1213–1226) |
| zoom | ja | **ja** | zoomen(faktor) um die Bühnenmitte, Grenzen 0.2–4 (Z. 1228–1240); Knöpfe ×1.25 (Z. 1349–1350), Strg+Rad ×1.1 (Z. 1466–1470) |
| pan | ja | **ja** | pointerdown auf leerer Fläche: sicht.x = vonX − (clientX − startX) (Z. 1441–1458); Ausgleich der Wurzelwanderung beim Wachsen (Z. 915–922) |
| selection | ja | **ja** | gewaehlt (Knoten) XOR gewaehlteVerb (Verbindung) (Z. 535–540); waehle (Z. 1198–1211); Einzelauswahl, keine Mehrfach-/Rahmenauswahl |
| hitTest | ja | **ja** | Kein eigenes Rechnen: DOM-Treffer über e.target.closest('.gk-kn'/'.gk-verb'/'.gk-griffel') (Z. 1379, 1414, 1430) und document.elementFromPoint beim Zug (Z. 1387–1392); breite unsichtbare Fangfläche .gk-verb-fang stroke-width:14 (werkzeuge.css:1490) |
| snap | nein | nein | nicht gefunden (grep snap/raster in gedankenkarte.ts); der Aufbau setzt Orte, es gibt kein freies Verschieben, also nichts zu fangen |
| resizeHandles | ja | **ja** | Nur ein Griff für die Höhe des Blocks: .gk-griff, pointerdown → block.hoehe (Z. 640–644, 1558–1573). Knoten selbst haben keine Grössengriffe (Grösse kommt aus dem Text) |
| rotation | nein | nein | nicht gefunden (grep rotat in gedankenkarte.ts) |
| group | nein | nein | nicht vorhanden; Gruppen/Grenzen sind offene Lücke L177 (LUECKEN.md:7260–7285). Der Baum (eltern) ist keine Gruppe im Sinne einer Geometrie-Primitive |
| connector | ja | **ja** | Zwei Sorten, beide eigen: Ast-Bogen `bogen` (kubische Bézier Kante→Kante, Z. 787–800) und freie Verbindung `verbBogen` (nächste Kanten, Normale weg von der Kartenmitte, Ausbuchtung 60–110 px, Pfeilspitze über <marker id=gk-spitze>, Z. 819–854, 945–970); Modell GkVerbindung { id, von, zu } (Z. 79–83); anlegen/löschen verbinden/verbindungWeg (Z. 1125–1153) |
| frame | nein | nein | nicht vorhanden (L177 „Grenze“) |
| zOrder | ja | **ja** | Fest durch Zeichenreihenfolge: SVG .gk-linien unten, Knoten-DIVs darüber (werkzeuge.css:1349–1351); freie Verbindungen werden zuletzt ins SVG gehängt, also über den Ästen (Z. 941–944); Griffe z-index:2 (werkzeuge.css:1461). Keine nutzerseitige Reihenfolge |
| undo | ja | **ja** | Eigener Stapel aus JSON-Abbildern: SCHRITTE=40, zurueckStapel/vorStapel, abbild = JSON.stringify(karte) (Z. 646–680); Knöpfe ↶/↷ (Z. 1355–1368) und Strg+Z/Strg+Shift+Z (Z. 1481–1488). Nicht persistiert, kein gemeinsamer Undo aus kern/ |
| pointerNormalisierung | nein | **ja** | Nur clientX/clientY roh und Differenzen (Z. 1385, 1441–1447); keine Umrechnung in Weltkoordinaten (nicht nötig, Knoten werden nicht frei bewegt); keine Druck-/Pointertyp-Behandlung; Tipp-vs-Zug-Schwelle 6 px selbst gerechnet (Z. 1394) |

## Gemeinsam genutzt

**Benutzt:** [[kern-Store|Store]] · [[kern-Register|Register]]

**Nur genannt, nicht benutzt:** [[kern-Verlauf|Verlauf]] — der Befund sagt, warum.

- Store.updateBlock aus src/kern/ablage/indexdb.ts:440 — einziger Schreibweg für karte und hoehe (gedankenkarte.ts:663, 1570)
- Ids.short aus src/core/helpers/ids.ts:69 (global Z. 118) — Kennungen der Knoten und Verbindungen (gedankenkarte.ts:159–161)
- UI.toast und UI.menu aus src/schale/ueberlagerung/ui.ts:30–33 — Hinweise und Vorlagenmenü
- Dialog.wahl aus src/schale/ueberlagerung/dialog.ts:121 — Rückfrage vor dem Ersetzen durch eine Vorlage (gedankenkarte.ts:1295)
- Register.bloecke (src/register/bloecke.ts:97) — Anmeldung der Blockart; keine weitere Register-Nutzung (Formen und Vorlagen sind NICHT im Register, sondern lokale Listen, Z. 147, 199)
- NICHT benutzt: src/core/ink/geometry.ts (InkPoint/InkBounds, simplify, distanceToSegment) — die Karte rechnet Bounds, Bézier und Ausweich-Normale selbst; src/core/helpers/colors.ts — die Palette ist lokal (Z. 123–127)

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[zeichenflaeche|B · Whiteboard / Zeichenfläche]] · elektro

1. **SVG-Elementhelfer `sv(name, attrs)` mit createElementNS + setAttribute-Schleife**
   - hier: `src/bereiche/bloecke/arten/gedankenkarte.ts:113-118`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:31-36`
   - Beleg: hier: `const NS = 'http://www.w3.org/2000/svg'; const sv = (name: string, attrs: Record<string, unknown> = {}): SVGElement => { const e = document.createElementNS(NS, name); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));` — dort: `const NS = 'http://www.w3.org/2000/svg'; const sv = (name: string, attrs: Record<string, unknown> = {}) => { const e = document.createElementNS(NS, name); Object.entries<any>(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));`
2. **`farbeVon(i)` — Palettenzugriff mit doppeltem Modulo auf ein [Farbe, Name]-Paar (E414)**
   - hier: `src/bereiche/bloecke/arten/gedankenkarte.ts:156-157`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:67-68`
   - Beleg: hier: `PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]?.[0] ?? '#2f8ab5'` — dort: `PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]?.[0] ?? '#529cca'` (nur der Rückfallwert unterscheidet sich)
3. **`uid()` — 'präfix' + Ids.short() mit performance.now-Rückfall**
   - hier: `src/bereiche/bloecke/arten/gedankenkarte.ts:159-161`
   - dort: `src/bereiche/bloecke/arten/schaltplan.ts:184-186`
   - Beleg: hier: `(typeof Ids !== 'undefined' && Ids.short) ? 'gk' + Ids.short() : 'gk' + Math.floor(performance.now() * 1000).toString(36)` — dort: `(typeof Ids !== 'undefined' && Ids.short) ? 'sp' + Ids.short() : 'sp' + Math.floor(performance.now() * 1000).toString(36)`
4. **`zahl(wert, ersatz)` — endliche Zahl oder Ersatz**
   - hier: `src/bereiche/bloecke/arten/gedankenkarte.ts:167-168`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:88-89`
   - Beleg: beide wörtlich: `const zahl = (wert: unknown, ersatz: number): number => typeof wert === 'number' && Number.isFinite(wert) ? wert : ersatz;`
5. **Rückgängig-Stapel aus JSON-Abbildern (SCHRITTE=40, zurueckStapel/vorStapel, abbild, merken mit shift)**
   - hier: `src/bereiche/bloecke/arten/gedankenkarte.ts:646-660`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:164-172`
   - Beleg: hier: `const SCHRITTE = 40; const zurueckStapel: string[] = []; const vorStapel: string[] = []; const abbild = (): string => JSON.stringify(karte); … zurueckStapel.push(abbild()); if (zurueckStapel.length > SCHRITTE) zurueckStapel.shift(); vorStapel.length = 0;` — dort: `const SCHRITTE = 40; const zurueckStapel: string[] = []; const vorStapel: string[] = []; const abbild = (): string => JSON.stringify(daten); … zurueckStapel.push(abbild()); if (zurueckStapel.length > SCHRITTE) zurueckStapel.shift(); vorStapel.length = 0;` (planflaeche.ts:174–186 hat eine dritte Fassung mit Grenze 60)
6. **Höhen-Griff des Blocks: pointerdown → Höhe ziehen → Store.updateBlock({ hoehe })**
   - hier: `src/bereiche/bloecke/arten/gedankenkarte.ts:1559-1573`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:792-805`
   - Beleg: hier: `griff.title = 'Höhe ziehen'` (Z. 642) … `Store.updateBlock(block.id, { hoehe: Math.round(buehne.getBoundingClientRect().height) })` — dort: `griff.title = 'Höhe ziehen'` (Z. 148) … `Store.updateBlock(block.id, { hoehe: Math.round(flaeche.getBoundingClientRect().height) })`
7. **`esc()` — lokale Escape-Funktion statt eines gemeinsamen Helfers**
   - hier: `src/bereiche/bloecke/arten/gedankenkarte.ts:106-111`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts und ~20 weitere (grep 'const esc = (s' in src/: editor.ts:328, raster.ts:76, elektro/start.ts:27 …)`
   - Beleg: hier: `const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')…` — z. B. src/bereiche/elektro/start.ts:27: `const esc = (s: unknown): string => String(s ?? '')` mit derselben Kette; kein Export in src/core/helpers (grep 'export.*esc' dort leer)

## Prüfläufe

- `pruefungen/lauf/test529.mts` — Suite 529 (E607), 56 Zusicherungen: Blockart im Register und Slash-Menü, Aufbau misst statt schätzt (Linie beginnt an der gemessenen Kante), Tab/Enter/Entf/Zurück/Zuklappen, kaputte Daten (Ring, Eltern ins Leere) landen an der Wurzel, Farben erben, Karte springt nicht beim Wachsen nach links, 44-px-Leiste, §19-Escapen, echte .redion-Runde (Z. 1–40)
- `pruefungen/lauf/test538.mts` — Suite 538 (E628), 53 Zusicherungen: vier Griffe nur am gewählten Knoten, Tipp legt Thema an, Zug macht Verbindung, Verbindung wählen/löschen/zurückholen, Unsinn (selbst, doppelt, Ast-Kante) abgelehnt, Verbindung ins Nichts fällt beim Lesen weg, sechs Formen mit rund=kein Feld und unbekannte Form bleibt, sichtbare Linie unterscheidet gewählt nicht nur über Farbe, sechs Vorlagen rundreisefest durch leseKarte, Rückfrage nur bei nicht-leerer Karte (Z. 1–36)
- `pruefungen/lauf/test537.mts` — Bereichs-Wächter (§5 Regel 1): nennt die Gedankenkarte nur als Fund — die eigene FORMEN-Liste mit Typangabe galt fälschlich als Griff in bereiche/pdf (Z. 58–70, 155–162); prüft die Karte nicht selbst
- `pruefungen/lauf/test86.mts` — Nur Namenskollision: meldet testweise eine Datenbank-ANSICHT 'mindmap' an Register.ansichten (Z. 151–157) — nichts mit der Blockart zu tun

## Doku-Stand

AUFGABEN.md: kein Treffer für gedankenkarte/mindmap (grep -i leer). ERLEDIGTE-AUFGABEN.md:669–706: Eintrag „19. September 2026 · E628 · Die Gedankenkarte bekommt Griffe, Verbindungen, Formen und Vorlagen" (test538 53/53, test529 56/56, Bilder gkformen/gkvorlagen; „Nicht geprüft: die Gesamtsuite"); Z. 713 (E627: die 44 px der gk-Leiste über ::after). LUECKEN.md offen: L177 Marker, Notizen und Grenzen fehlen (Z. 7260); L178 keine fremden Formate (XMind/FreeMind/OPML…) lesen oder schreiben (Z. 7287); L179 nicht als Bild speicherbar — Preis der HTML-Knoten (Z. 7316); L192 Eine Verbindung kann nichts sagen — kein `verbindungen[i].text`, und eigene Karten lassen sich nicht als Vorlage sichern (Z. 7614–7643); L193 FORMEN gehört mehreren Bereichen (bloecke + dateien + pdf) — Wächter-Frage (Z. 7645, Tabelle Z. 16); L199 „Alles einpassen" lässt den linken Rand draussen, Massstab 72 %, S von „Schutzklassen" fehlt, verweist auf einpassen (gedankenkarte.ts:1251) (Z. 7840–7868). GESCHLOSSEN: L176 Querverbindungen (Z. 9614, durch E628, Rest lebt als L192). ENTSCHEIDUNGEN.md: E607 (Z. 49113, Bau: Block statt Bereich, HTML-Knoten/SVG-Linien), E628 (Z. 51184, Griffe/Verbindungen/Formen/Vorlagen, §37-Grund 16/28 px), E627 (Z. 51147, test402-Grund), E629 (Z. 51331, „Ein Name mit Typangabe ist derselbe Name" — der FORMEN-Fehlalarm von test537), E632 (Z. 51509, BLOCKTYPEN.md fehlte mindmap), E637 (Z. 51924, Marken-Decken in werkzeuge.css, .gk-massstab teilt Regel mit .wb-massstab, werkzeuge.css:1175). messungen.md: §43/§44 (Z. 1678, 1709) und §61 (Z. 2622). doku/CSS-NAMENSRAEUME.md:173: `gk 40 werkzeuge.css`; doku/BLOCKTYPEN.md:82: `mindmap | Gedankenkarte`.

## Risiken

- Das Feld `karte` ist der gesamte Zustand und nicht im zentralen Blocktyp deklariert (src/core/types/block.ts:61–70 kennt es nicht; leseKarte nimmt `block: any`). Eine gemeinsame Schicht, die den Blocktyp strenger fasst, darf `karte`, `hoehe` und darin `knoten/verbindungen/aufbau/sicht` nicht umbenennen (§53.3 Grenze 1) — jede gespeicherte Karte und jede .redion würde unlesbar.
- `rund` ist die Form OHNE Feld (gedankenkarte.ts:141–144, 1158). Eine gemeinsame Formen-/Shape-Schicht, die jedem Knoten immer eine Form schreibt, ändert stillschweigend alle Bestandsblöcke und macht `test538 §7` rot.
- Unbekannte Formen müssen erhalten bleiben (Z. 314–321, §18). Ein gemeinsamer Formenkatalog mit Whitelist (wie er in test538 als Gegenprobe rot gesehen wurde) löscht Daten neuerer Fassungen.
- Die Wurzelkennung ist fest 'w' (Z. 176, 264, 289); eine gemeinsame ID-Vergabe, die sie würfelt, bricht Auswahl und Vorlagen-Rundreise (test538 §9).
- Das Layout ist ein automatischer Baum-Aufbau ohne freie Knotenpositionen (aufbauen, Z. 430–527): es gibt keine gespeicherten Knotenorte. Eine gemeinsame Canvas-Schicht mit freiem Verschieben/Snap/Resize hätte hier nichts zu speichern und würde ein neues Feld (Orte) einführen — das ist eine Modelländerung mit Migrationsfrage, kein Refactor.
- Die Knoten sind HTML, nicht SVG (E607, Kopf Z. 18–31; L179 als Preis). Eine gemeinsame SVG-Zeichenschicht (wie zeichenflaeche/schaltplan) würde die gemessene Textbreite wieder durch eine Schätzung ersetzen — genau das, was test529 §3 rot sieht (12 px daneben).
- Der Viewport `sicht` wird beim ersten Öffnen NICHT gespeichert (mussEinpassen, Z. 549–553); eine gemeinsame Viewport-Schicht, die beim Anwenden sichert, ändert Blöcke beim blossen Ansehen (Kommentar Z. 550–553) und macht den Abgleich unruhig.
- Undo hält JSON-Abbilder nur im Arbeitsspeicher (Z. 646–660). Eine gemeinsame Undo-Schicht darf den Verlauf nicht in den Block schreiben (derselbe Grund in zeichenflaeche.ts:160–163).
- Verbindungen ohne beide Enden fallen beim LESEN weg (Z. 331–340) und werden beim nächsten Sichern nicht mehr geschrieben — ein gemeinsamer Connector-Speicher mit strengerer Validierung darf nicht härter sein, sonst verschwinden Verbindungen zu zugeklappten Ästen (die bleiben absichtlich in den Daten, Z. 962–966).
- Bereichsgrenze: editor.ts:905 ruft `Gedankenkarte` über den globalen Namen; test537 führt das in pruefungen/bereiche-bestand.json, das nur schrumpfen darf. Jede neue gemeinsame Schicht muss nach kern/ oder core/, nicht in einen Nachbarbereich, sonst wird test537 rot.
- L199 ist offen: einpassen (Z. 1251) schneidet links an. Wer die Viewport-Rechnung in eine gemeinsame Schicht zieht, nimmt den Fehler mit oder muss ihn zuerst messen (L199 verlangt Messung vor Reparatur).

## Kleinster nächster Schritt (Vorschlag des Lesers)

Die vier wörtlich gleichen Kleinhelfer aus gedankenkarte.ts und zeichenflaeche.ts/schaltplan.ts — `sv` (Z. 113–118 ↔ zeichenflaeche.ts:31–36), `zahl` (Z. 167–168 ↔ zeichenflaeche.ts:88–89), `farbeVon`-Modulo (Z. 156–157 ↔ zeichenflaeche.ts:67–68) und `uid` mit Präfix (Z. 159–161 ↔ schaltplan.ts:184–186) — in einen Helfer unter src/kern/helfer/ (oder src/core/helpers/) ziehen, ohne ein Datenfeld anzufassen; dann test529, test538, test537 (bereiche-bestand darf nicht wachsen) und test105/test109 fahren. Alles andere (Formen, Verbindungen, Viewport, Undo) hängt an gespeicherten Feldern und braucht zuerst eine Entscheidung zu L192/L199.
