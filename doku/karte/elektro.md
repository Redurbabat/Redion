<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, elektro]
stand: 25. September 2026
head: 1b89c01
---

# F · Schaltplan, Fachzeichen, Elektro

F · Schaltplan, Fachzeichen, Elektro

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/bereiche/bloecke/arten/schaltplan.ts` | Modell + Bild des Plans, ohne Ereignisse: Typen Teil/Punkt/Leitung/Text/Ebene/Plan (Z. 94-117), 11 Planarten ARTEN (Z. 127-161), lesen/heilen (Z. 208-247), rasten (Z. 86), anschlussOrt/anschluesseVon (Z. 279-296), fangeAnschluss FANG=14 (Z. 305-316), rechtwinklig (Z. 326-331), aufStrecke/verbindungspunkte/kreuzungen (Z. 346-421), leitungPfad (Z. 423), alsSvg (Z. 458-703), schienenBauen/netzBauen/BEISPIELE/beispielBauen (Z. 696-818). Global `Schaltplan` (Z. 820-828). | 828 |
| `src/bereiche/bloecke/arten/planflaeche.ts` | Bedienung des schaltplan-Blocks: Zustand (Z. 29-64), Palette (Z. 95-133), ortAus Bildschirm->Plan (Z. 136-144), aendere/Undo-Stapel (Z. 174-203), pointerdown/move/up (Z. 642-808), inRahmen/verschiebe/drehen/spiegeln/leitungenNachziehen/doppeln/gruppieren/loeschen (Z. 488-591), teilDialog (Z. 811), Tastatur (Z. 991-1019), Vorlagen in Store.meta (Z. 1058-1081), SVG-Export (Z. 1083). Global `Planflaeche` (Z. 1101-1104); eingehängt in editor.ts:909-911. | 1104 |
| `src/register/fachzeichen.ts` | Symbolregister: RASTER=10 (Z. 41), Typ Zeichen mit w/h/pfad/anschluesse/kennbuchstabe (Z. 47-63), 15 Gruppen (Z. 65-90), alsSvg mit rotate/scale (Z. 1113-1156, Sanitize.farbe Z. 1123), anschlussLage = eigene Drehmatrix (Z. 1166-1182), masse nach Drehung (Z. 1185-1190). Export Z. 1192-1193. | 1194 |
| `src/register/elektroformeln.ts` | Formelregister als Daten: Typen Groesse/Zeile/Abschnitt/Formel (Z. 34-120), `loese` als gewöhnliche Funktionen (kein eval, Z. 100-108). Schnittstelle Z. 4952-5088 (alle, holen, imKapitel, kapitel, suche, loesbarNach, rechne, abschnitte, aufSeite, seiteVon). Keine Geometrie. | 5089 |
| `src/bereiche/elektro/simulation.ts` | `Stromfluss`: MNA-Rechnung über den Plan; Klemmen über Schaltplan.anschluesseVon (Z. 300-313), Netzbildung mit eigener Näherungsgeometrie NAH=6, nahBei, aufStrecke (Z. 282-294, 322-347). Export Z. 920-926. | 926 |
| `src/bereiche/elektro/formelheft.ts` | `Formelheft`: schwebendes, verschiebbares Fenster über Register.elektroformeln plus eigenes PDF als Anhang; eigenes esc (Z. 39) und tief (Z. 81). Export Z. 929-934. | 934 |
| `src/bereiche/elektro/aufgaben.ts` | `Elektroaufgaben`: erzeugt Aufgaben aus Register.fachzeichen, Register.elektroformeln und Stromfluss mit gesätem Zufall (mulberry32 Z. 50-60); liest Klemmen über Schaltplan.anschluesseVon (Z. 658, 1098, 1118). Export Z. 1815-1819. | 1819 |
| `src/bereiche/elektro/arbeitsplatz.ts` | `Elektroarbeitsplatz`: Üben/Prüfung/drei Spalten; zeichnet Aufgabenpläne über Schaltplan.alsSvg mit tippbar/auswahl (Z. 128-132). Meta-Schlüssel Z. 46-48. Export Z. 687-691. | 691 |
| `src/bereiche/elektro/skizzen.ts` | `Elektroskizzen`: Formelbuch-Skizzen als echte Pläne über Schaltplan.neuerPlan/anschluesseVon/alsSvg (Z. 87-151), Diagramme als eigenes SVG; eigenes esc (Z. 42) und tief (Z. 217). Return Z. 1185 (keine window-Zuweisung per grep gefunden). | 1189 |
| `src/bereiche/elektro/lernbilder.ts` | `Elektrolernbilder`: Formeldreieck und Sinuskurve als reines SVG aus Register.elektroformeln. Export Z. 403-407. | 407 |
| `src/bereiche/elektro/start.ts` | `Elektrostart`: Elektro-Seite als Ort (L65/E238), Kacheln aus Register.menueband.inReiter('elektro'), erkennt Elektro-Seiten an Blocktyp 'schaltplan' (Z. 35). Export Z. 195-198. | 246 |

## Datenmodell

Blocktyp `schaltplan` (src/register/bloecke.ts:100, Gruppe Wissen). Der Plan liegt in `block.plan` eines gewöhnlichen Blocks im IndexedDB-Fach `blocks` (schaltplan.ts:8-15; geschrieben über Store.updateBlock(block.id, { plan }) in planflaeche.ts:179-181, updateBlock in src/kern/ablage/indexdb.ts:440). Format (schaltplan.ts:94-117): Plan { art, breite, hoehe, teile[], leitungen[], texte[], ebenen[] }; Teil { id, zeichen (Register-Kennung), x, y, drehung (0/90/180/270), gespiegelt, bmk, nummern{}, gruppe, ebene }; Leitung { id, punkte: Punkt[] (Rasterpunkte), ebene, vonTeil?, vonNr?, nachTeil?, nachNr? }; Text { id, x, y, t, ebene }; Ebene { id, name, farbe, sichtbar } mit Vorgabe plan/aufgabe/loesung (Z. 175-179). Kennungen 'sp' + Ids.short() (Z. 183-185). Beim Lesen wird geheilt UND auf das Raster gerundet (lesen, Z. 208-247: x/y/punkte durch rasten). Undokumentiertes Feld: netzBauen setzt `quelle.werte = { U: volt }` am Teil (Z. 742-744), im Typ Teil nicht vorhanden. Symbole selbst stehen nur im Register (fachzeichen.ts:47-63, RASTER Z. 41). Nicht im Block: Simulationszustand (planflaeche.ts:50-64, bewusst), Undo-Stapel (Z. 46-47). In Store.meta: `elektro:favoriten` (planflaeche.ts:81), `elektro:planvorlagen` (Z. 1058, Vorlagen tragen Kennungen mit, Z. 1062-1078), `elektro:uebungsstand`/`elektro:uebungsarten`/`elektro:letztePruefung` (arbeitsplatz.ts:46-48). Typ in src/core/types/block.ts: nicht gefunden (grep "plan|schaltplan" leer) — `block.plan` ist `any`.

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Schaltplan` | global | `src/bereiche/bloecke/arten/schaltplan.ts:957-962` | ARTEN, artVon, EBENEN_VORGABE, neuerPlan, lesen, alsSvg, rasten, naechstesBmk, anschlussOrt, anschluesseVon, klemmeFuer(teil,nr,punkt) (E738), fangeAnschluss, rechtwinklig, verbindungspunkte, kreuzungen, leitungPfad, schienenBauen, netzBauen, BEISPIELE, beispielBauen, uid, esc. Aufrufer: planflaeche.ts, elektro/aufgaben.ts, simulation.ts, skizzen.ts, arbeitsplatz.ts, dateien/ausgeben.ts:674-681 |
| `Planflaeche` | global | `src/bereiche/bloecke/arten/planflaeche.ts:1124` | zeichne(block) -> HTMLElement, paletteHtml, favoriten, favoritUmschalten, ortAus. Aufrufer: editor.ts:909-911; bereiche/pdf (bereiche-bestand.json:462) |
| `Register.fachzeichen` | register | `src/register/fachzeichen.ts:1372-1373` | RASTER, NAH, alle, holen, inGruppe, gruppen, gruppenName, alsSvg(id,{farbe,strich,drehung,gespiegelt,zeigeText,zeigeAnschluesse}), anschlussLage(id,nr,drehung,gespiegelt), klemmeFuer(id,nr,punkt,drehung,gespiegelt) -> {nr,frueher}\|null (alte Klemmennamen, E738), masse(id,drehung), melde, vergiss |
| `Register.elektroformeln` | register | `src/register/elektroformeln.ts:5085-5088` | KAPITEL, alle, holen, imKapitel, kapitel, kapitelName, suche, loesbarNach, rechne(id,gesucht,werte) -> {ok,wert,einheit,weg}\|{ok:false,fehler}, melde, BUCHKAPITEL, ABSCHNITTE, abschnitte, abschnitt, buchkapitel, buchkapitelName, letzteSeite, aufSeite, seitenMitInhalt, seiteVon, seitenVon |
| `Stromfluss` | global | `src/bereiche/elektro/simulation.ts:1953-1957` | VERHALTEN, verhalten, stellungenVon, netze, rechne(plan, stellungen, spulenStand), zeige, loese, loeseKomplex, leiterrollen (E730, E732), klemmen, aufStrecke (für Prüfungen sichtbar) |
| `Formelheft` | global | `src/bereiche/elektro/formelheft.ts:929-934` | oeffne, schliessen, umschalten(kapitel), offen, horche, vergiss — vom Planeditor (planflaeche.ts:870-882) und von bereiche/pdf (bestand.json:444-446) gerufen |
| `Elektroaufgaben` | global | `src/bereiche/elektro/aufgaben.ts:1815-1819` | ARTEN, artVon, gruppen, erzeuge, reihe, pruefe |
| `Elektroarbeitsplatz` | global | `src/bereiche/elektro/arbeitsplatz.ts:687-691` | uebung, pruefungFlaeche(n, saat, …), arbeitsplatz, aufgabeHtml, zeigeAls |
| `Elektrolernbilder / Elektroskizzen / Elektrostart` | global | `src/bereiche/elektro/lernbilder.ts:403-407, skizzen.ts:1185, start.ts:195-198` | Dreiecke/Sinus als SVG; Skizzen hat/zu/alle; Elektro-Seite oeffne/zeichnen/zuletzt/wege |
| `Blocktyp schaltplan` | register | `src/register/bloecke.ts:100` | { id:'schaltplan', name:'Schaltplan', gruppe:'Wissen', cmd:[schaltplan, elektro, stromlauf, fachzeichen, schema] }; Einfügen über menueband.ts:504/925 und schale.ts:3120 |
| `Modul elektro / Navigation btn-elektro / Menüband reiter:'elektro'` | register | `src/register/module.ts:130-136; src/register/navigation.ts:118-120; src/register/menueband.ts:894ff` | Modul und Seitenleisten-Knopf rufen Elektrostart.oeffne(); die acht Elektro-Einträge bleiben reiter:'elektro', weil start.ts sie liest (menueband.ts:88-94) |
| `editor.ts case 'schaltplan'` | funktion | `src/bereiche/editor/ansicht/editor.ts:909-911` | box.appendChild(Planflaeche.zeichne(block)) |
| `blockAlsSvg (Export docx/pdf)` | funktion | `src/bereiche/dateien/ausgeben.ts:672-684` | Schaltplan.alsSvg(b.plan, {raster:false, anschluesse:false, bmk:true}) für Word/PDF-Export (E347) |
| `Ereignisbus` | ereignis | `src/bereiche/elektro/*.ts` | praktisch nicht benutzt: grep über elektro/, schaltplan.ts, planflaeche.ts ergab 1 Treffer 'Ereignis.' — Kopplung läuft über globale Namen |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | ja | **ja** | schaltplan.ts:106 `type Punkt = { x; y }`; core/ink/geometry.ts:14 InkPoint (Tupel) wird nicht benutzt |
| rect | ja | **ja** | planflaeche.ts:488-505 inRahmen (min/max selbst gerechnet, Teil ganz drin über Register.fachzeichen.masse); schaltplan.ts:639-641 unsichtbares Treffer-rect x=-4 |
| bounds | ja | **ja** | fachzeichen.ts:1185-1190 masse(id, drehung) tauscht w/h bei 90/270; Planmasse breite/hoehe schaltplan.ts:114-117, 188-195 |
| transform | ja | **ja** | schaltplan.ts:632-635 translate(t.x t.y) je Teil; fachzeichen.ts:1127-1132 rotate(dreh mitte) + translate/scale(-1 1) fürs Spiegeln; Leitungspunkte absolut |
| viewport | ja | **ja** | schaltplan.ts:702-703 SVG viewBox 0 0 breite hoehe; Ausschnitt nur über CSS overflow:auto (quell/schale/stil/bausteine.css:7098) — kein Sichtmodell |
| zoom | nein | nein | nicht gefunden: kein Massstab in schaltplan.ts/planflaeche.ts; nur .sp-flaeche max-width:100% (bausteine.css:7100) und ortAus rechnet breite/r.width (planflaeche.ts:138-141) |
| pan | nein | nein | nicht gefunden; Rollen des Containers .sp-buehne (bausteine.css:7098), kein gespeicherter Ausschnitt (anders als zeichenflaeche.ts:493 sicht.x/sicht.z) |
| selection | ja | **ja** | planflaeche.ts:32 auswahl Set<string>; Klick/Shift Z. 700-705; Rahmen Z. 488-505 + 748-755; Strg+A Z. 1010-1015; Zeichnung sp-gewaehlt schaltplan.ts:541-543, 626 |
| hitTest | ja | **ja** | DOM-basiert: teilAm = closest('svg [data-id]') planflaeche.ts:635-636 (E261); Fangfläche rect schaltplan.ts:639-641; Leitungsgriffe opt.tippbar Z. 564-613 (Abstandsmaximierung über 11 Stellen); Anschlussfang fangeAnschluss Z. 305-316 (Abstandsquadrat <= 14²) |
| snap | ja | **ja** | schaltplan.ts:82-86 R()/rasten auf Register.fachzeichen.RASTER=10 (fachzeichen.ts:41); ortAus rastet planflaeche.ts:143; Anschlussfang Z. 305-316; Pfeiltasten in Rasterschritten planflaeche.ts:994 |
| resizeHandles | nein | nein | nicht gefunden: Symbole haben feste w/h aus dem Register, Planmasse nur aus Planart (schaltplan.ts:188-195); .sp-griff (Z. 604-606) ist ein Tipp-Griff für Leitungen, kein Grössengriff |
| rotation | ja | **ja** | planflaeche.ts:531-537 drehen +90 % 360 (Taste R Z. 1006); fachzeichen.ts:1166-1182 anschlussLage mit eigener sin/cos-Matrix um den Zeichenmittelpunkt + Math.round; core/ink/geometry.ts:587-593 drehePunkte ('die eine Drehformel des Hauses') wird NICHT benutzt |
| group | ja | **ja** | Feld Teil.gruppe schaltplan.ts:103; gruppieren/auflösen planflaeche.ts:576-584; mitGruppe Z. 593-597 (Anfassen fasst die Gruppe) |
| connector | ja | **ja** | Leitung mit Bindung vonTeil/vonNr/nachTeil/nachNr schaltplan.ts:107-111; rechtwinklig Z. 326-331; Enden mitziehen verschiebe planflaeche.ts:507-529 und leitungenNachziehen Z. 548-560; Knoten/Kreuzungen schaltplan.ts:346-421; Simulation bindet zusätzlich über Ortsnähe NAH=6 (simulation.ts:322-347) |
| frame | nein | nein | nicht gefunden; Ebenen (schaltplan.ts:113, 175-179) sind Sichtbarkeitsschichten, kein Rahmen/Container |
| zOrder | ja | **ja** | feste Zeichenreihenfolge in alsSvg: Leitungen (schaltplan.ts:537) -> Fluss -> Knoten (Z. 566) -> Griffe (Z. 564) -> Symbole (Z. 616) -> Texte (Z. 696); innerhalb Array-Reihenfolge; kein Nach-vorn/-hinten für den Nutzer |
| undo | ja | **ja** | planflaeche.ts:46-47, 174-203: JSON-Abzüge des Plans, Stapel max 60; Strg+Z Z. 1017 mit preventDefault ohne stopPropagation -> L212 (Schale ruft zusätzlich Verlauf.zurueck); Kern-Verlauf wird nicht benutzt |
| pointerNormalisierung | ja | **ja** | planflaeche.ts:136-144 ortAus: getBoundingClientRect + plan.breite/r.width, Rasterung; Pointer Events mit setPointerCapture Z. 642-808; core/sheet/space.ts zuBlatt/umrechner (getScreenCTM) wird NICHT benutzt |

## Gemeinsam genutzt

**Benutzt:** [[kern-Store|Store]] · [[kern-Register|Register]] · [[kern-Dateien|Dateien]] · [[kern-GfxHistory|GfxHistory]]

**Nur genannt, nicht benutzt:** [[kern-Verlauf|Verlauf]] · [[kern-Ereignis|Ereignis]] — der Befund sagt, warum.

- Register.fachzeichen (src/register/fachzeichen.ts): RASTER, holen, inGruppe, gruppen, alsSvg, anschlussLage, masse — 35 Aufrufe im System
- Register.elektroformeln (src/register/elektroformeln.ts): 24 Aufrufe (Formelheft, Aufgaben, Kapitelwahl planflaeche.ts:885-905)
- Register.menueband.inReiter('elektro') (start.ts, lt. menueband.ts:88-94), Register.befehle (10 Treffer), Register.symbole (1)
- Ids.short (src/core/helpers/ids.ts:69) für Teil-Kennungen (schaltplan.ts:183-185)
- Sanitize.farbe / Sanitize.escapeAttribute (src/core/security/sanitize.ts:281 / 188) in fachzeichen.ts:1123, 1141
- Store.updateBlock/getMeta/setMeta/childrenOf (src/kern/ablage/indexdb.ts:440) — Plan im Fach blocks, Favoriten/Vorlagen/Übungsstand in meta
- UI.toast/menu/frage/banner (src/schale/ueberlagerung/ui.ts:41) und App.zeigeSonder/oeffne/kuerzlich (start.ts)
- Fremde Bereiche laut pruefungen/bereiche-bestand.json: bloecke -> elektro (Formelheft 2, Stromfluss 9; Z. 22-46), elektro -> bloecke (Schaltplan 8; Z. 358-362), elektro -> dateien (Dateien 2), elektro -> wissen (Werkzeuge 1), dateien -> Schaltplan 2 (Z. 90-93), pdf -> Formelheft 6 / Planflaeche 2 (Z. 444-465)
- Stil: quell/schale/stil/bausteine.css:7044-7136 (.sp-wrap, .sp-buehne, .sp-flaeche touch-action:none)
- NICHT benutzt, obwohl vorhanden: src/core/ink/geometry.ts (drehePunkte Z. 587, bounds Z. 625, distanceToSegment Z. 27), src/core/sheet/space.ts (zuBlatt/umrechner über getScreenCTM), Kern-Verlauf für Undo, Ereignisbus
- NACHGETRAGEN (E687, 25. September abends): src/core/gfx/history.ts — die Planfläche hält `z.verlauf = GfxHistory.erstelle(60)` statt `zurueck[]/vorwaerts[]`; `aendere` ruft `merken(vorher)`, `zurueck/vorwaerts` rufen `verlauf.zurueck(abzug())`/`vor(abzug())`. Wächter test571.

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[gemeinsam|G · Gemeinsame räumliche Infrastruktur]] · [[zeichenflaeche|B · Whiteboard / Zeichenfläche]]

1. **Tiefstellung `tief` (Unterstrich -> Subscript) dreimal, von test244 zusammengehalten** — **gegengeprüft: bestätigt**
   - hier: `src/bereiche/bloecke/arten/schaltplan.ts:78-80`
   - dort: `src/bereiche/elektro/formelheft.ts:81-82 und src/bereiche/elektro/skizzen.ts:217-219`
   - Beleg: schaltplan.ts: `const tief = (wert: unknown): string => esc(wert).replace(/_([…L…N%]+)/gu, '<tspan baseline-shift="sub" font-size="0.72em">$1</tspan>')` — formelheft.ts: `const tief = (wert: unknown): string => esc(wert).replace(/_([…L…N%]+)/gu, '<sub>$1</sub>')` — skizzen.ts wortgleich mit schaltplan.ts; der Kommentar schaltplan.ts:74-76 sagt selbst: 'Dieselbe Zeile steht in schaltplan.ts, skizzen.ts und formelheft.ts'
   - Urteil: Behauptung bestätigt und durch Lesen aller drei Stellen mit Umgebung belegt: gleicher Regex `/_([\p{L}\p{N}%]+)/gu`, gleiche Reihenfolge esc→replace, gleicher 19-zeiliger Kommentar, und der Kommentar sowie ENTSCHEIDUNGEN.md:14698-14700 („Dieselbe Zeile stand an DREI Orten — Schaltplan, Skizzen, Buch") nennen die Dreifachkopie ausdrücklich als Ursache des früheren Fehlers. Ein Widerlegungsversuch scheitert: die Stellen unterscheiden sich nur im Ziel-Markup (SVG vs. HTML), nicht in Aufgabe, Einheiten oder Sonderfällen, und keine ruft die andere auf. Eine gemeinsame Funktion in src/kern (z. B. `tiefstellen(wert, 'svg'|'html')`) wäre ohne Verhaltensänderung möglich, weil beide Varianten als Parameter abgebildet werden können; „mit Vorsicht" wegen Ladereihenfolge über globale Namen (kein import in src/bereiche/), §5 (kern kennt keinen Bereich — der Helfer wäre bereichsneutral, also erlaubt) und weil test244 auf die drei Dateipfade festgenagelt ist.
2. **`esc` wortgleich in schaltplan.ts und allen fünf Elektro-Dateien statt Sanitize.escapeText** — **gegengeprüft: bestätigt**
   - hier: `src/bereiche/bloecke/arten/schaltplan.ts:39-41 (auch elektro/start.ts:27, arbeitsplatz.ts:39, formelheft.ts:39, lernbilder.ts:34, skizzen.ts:42)`
   - dort: `src/core/security/sanitize.ts:183-185 escapeText`
   - Beleg: beide: `String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')`
   - Urteil: Widerlegungsversuch gescheitert: die sechs Kopien und `escapeText` sind Zeichen für Zeichen identisch und lösen dieselbe Aufgabe (HTML/SVG-Escapen von Nutzertext). Die Doppelung ist allerdings kein Versehen dieser sechs Dateien, sondern Bauweise des ganzen Projekts: pruefungen/lauf/test87.mts:513-514 sagt ausdrücklich „Fünfzig Module haben ihr eigenes `esc` — das ist die Folge davon, dass es keine Bauschritte gibt und jede Datei für sich stehen soll", und der Wächter dort prüft jede lokale Kopie auf den `&quot;`-Schutz (test87.mts:538-556). ENTSCHEIDUNGEN.md:7966-7972 fordert nur „eine Escape-Funktion, ganz oben" JE DATEI, keine projektweite. Technisch wäre der Ersatz durch `Sanitize.escapeText` möglich: quell/core/security/sanitize.js wird in index.html:494 geladen, alle sechs Dateien erst ab index.html:600-623 (alle `defer`, also Reihenfolge gesichert), und `src/core/` gilt für Bereiche als erlaubte Abhängigkeit (§5 Regel 1: kern/register/eigene Dateien; andere Stellen wie src/bereiche/pdf/marken.ts:2222 greifen bereits auf `Sanitize` zu — dort mit `typeof Sanitize !== 'undefined'`-Schutz). Zu beachten: test87.mts:553-554 verlangt mindestens 40 lokale `esc`-Definitionen („Der Sucher findet die Definitionen überhaupt" >= 40); sechs zu entfernen lässt 42 übrig, eine vollständige Zusammenlegung aller 48 würde diesen Wächter rot machen und müsste ihn mit anpassen. Zudem müsste in der Einzeldatei (bauen.mts) sanitize.js weiterhin vor den Bereichen stehen (in bauen.mts kein `sanitize`-Sonderfall gefunden, grep leer — vermutlich übernimmt es die Reihenfolge aus index.html, nicht verifiziert). Hinweis zur Anfrage im Nutzerwortlaut („obsidian/graph-Datei anlegen"): diese Prüfung war laut Auftrag nur lesend, es wurde keine Datei angelegt.
3. **'Liegt ein Punkt auf einer Strecke' zweimal — exakt fürs Zeichnen, mit Toleranz fürs Rechnen; die Zeichnung kann Knoten anders zeigen, als die Simulation verbindet**
   - hier: `src/bereiche/bloecke/arten/schaltplan.ts:346-350 aufStrecke`
   - dort: `src/bereiche/elektro/simulation.ts:282-294 NAH/nahBei/aufStrecke`
   - Beleg: schaltplan.ts: `if (a.x === b.x) return p.x === a.x && p.y > Math.min(a.y, b.y) && p.y < Math.max(a.y, b.y);` — simulation.ts: `if (Math.abs(ax - bx) <= 1 && Math.abs(px - ax) <= NAH) return py >= Math.min(ay, by) - NAH && py <= Math.max(ay, by) + NAH;`
4. **Drehmatrix um einen Anker: Register schreibt sie selbst, obwohl core/ink sie als 'die eine Drehformel des Hauses' führt**
   - hier: `src/register/fachzeichen.ts:1174-1182 anschlussLage`
   - dort: `src/core/ink/geometry.ts:587-593 drehePunkte`
   - Beleg: fachzeichen.ts: `x: Math.round(cx + dx * Math.cos(bogen) - dy * Math.sin(bogen)), y: Math.round(cy + dx * Math.sin(bogen) + dy * Math.cos(bogen))` — geometry.ts: `anker[0] + (x - anker[0]) * cos - (y - anker[1]) * sin, anker[1] + (x - anker[0]) * sin + (y - anker[1]) * cos`
5. **Bildschirmpunkt -> Flächenkoordinate je Fläche eigen gerechnet, obwohl core/sheet/space.ts genau dafür 'EINE STELLE … und keine zweite' ist**
   - hier: `src/bereiche/bloecke/arten/planflaeche.ts:136-144 ortAus`
   - dort: `src/bereiche/bloecke/arten/zeichenflaeche.ts:493-497 punkt; src/core/sheet/space.ts:1-40 + zuBlatt/umrechner`
   - Beleg: planflaeche.ts: `const r = svg.getBoundingClientRect(); const sx = plan.breite / (r.width || 1); … const x = (e.clientX - r.left) * sx;` — zeichenflaeche.ts: `const r = flaeche.getBoundingClientRect(); return [Math.round(sicht.x + (e.clientX - r.left) / sicht.z), …]` — space.ts:10: 'EINE STELLE, DIE BILDSCHIRM IN BLATT ÜBERSETZT — und keine zweite.'

## Prüfläufe

- `test238` — Elektro-Modus: Symbolbibliothek (Register.fachzeichen) und Planeditor — Setzen, Raster, Anschlüsse, Leitungen, BMK (39 Treffer)
- `test239` — Die Simulation rechnet (MNA): Reihe/Parallel/Selbsthaltung; Lehre Z. 464: keine Leitung darf einen Anschluss überbrücken
- `test240` — Das Formelheft schwebt beim Zeichnen und öffnet beim passenden Kapitel (E188)
- `test241` — Aufgaben werden aus Register/Stromfluss erzeugt, gesäter Zufall (E189)
- `test242` — Fachzeichen auf dem PDF und Ausschnitt als Lernkarte; Symbol aus register/fachzeichen (E191)
- `test243` — Drei Aufgabenarten lesen den Schaltplan (E192); drei sichtbare Fehler festgehalten
- `test244` — Eigenes Formelbuch: Seiten, Skizzen über Schaltplan.alsSvg, Tiefstellung `tief` in drei Dateien gleich (E194)
- `test263` — Klick trifft das Teil im SVG, eigene Doppeltipp-Erkennung (E261)
- `test339` — Der Schaltplan kommt als SVG in die .docx (E347)
- `test338` — DOCX-Export mit Bild statt Platzhalter (L72), Seite mit Schaltplan
- `test446` — Eine Farbe kann Code sein: Register.fachzeichen.alsSvg gegen '#000" onload=' (E473)
- `test471` — Eigenes Formelheft über dem Dokument, Knopf neben dem Fachzeichen (E503)
- `test477` — Leiterstift mit zehn Adern eines Schaltplans (E509) — PDF-Stift, nicht der Planeditor
- `test480` — Werkzeugleiste im Studio, Fachzeichen ⚡ als eines von 14 Werkzeugen
- `test368` — Merkzettel: die Drehung eines Fachzeichens (PDF-Marke) wird ersetzt, nicht geändert
- `test255` — Prüfungssimulation mit Uhr, Elektroarbeitsplatz.pruefungFlaeche (E248)
- `test247` — Menüband: Elektro-Einträge bleiben reiter:'elektro', weil start.ts sie liest
- `test210` — Der Arbeitsplatz als Bild (E126)
- `test215` — Lernpfad/Bibliothek mit Elektro-Inhalten (Stichwörter, Elektro-Grundlagen)
- `test568` — L212 (25.9.2026): Strg+Z im Schaltplan bleibt beim Plan — misst ein gesetztes Teil vor/nach Strg+Z
- `test33, test86, test114, test272, test306, test393, test416, test418, test438, test461, test462, test464, test492, test494, test504, test559` — Randtreffer (1-5): Blockartenlisten mit 'schaltplan', Registernamen 'fachzeichen'/'elektroformeln' (test86:34), Telefon-/Studio-Messungen — halten nichts an der Plan-Geometrie

## Doku-Stand

ENTSCHEIDUNGEN.md (nur Inhaltsverzeichnis+Köpfe per grep): E187 Simulation rechnet (Z. 13662), E188 Formelheft (13796), E189 Aufgaben erzeugen (13882), E190 Lernbilder (13988), E191 Fachzeichen auf dem PDF (14058), E192 drei Aufgaben lesen den Plan (14124), E193 in den Plan tippen (14242, Leitungsgriffe Punkt 59), E194 Formelbuch (14371), E238 Elektro als Ort (18246), E248 Prüfungsuhr (18881), E261 Klick landete am Block-Kasten (19512), E262 „⚡ Schaltung" Netz/Beispiele (19552), E347 Schaltplan in der .docx (27130), E473 Farbe kann Code sein (Sanitize.farbe in fachzeichen.ts), E503 eigenes Formelheft über dem Dokument (40320), E509 Leiterstift (40933); E128 (keine normativen Entscheidungen) und E138 (Whiteboard = Fläche, Vorbild für block.plan) werden im Kopf zitiert. Keine offene E zur Geometrie gefunden. LUECKEN.md: L59 Schalter offen/geschlossen — GESCHLOSSEN mit E193 (Z. 1437-1460); L65 Elektro-Dialog — GESCHLOSSEN E238 (Z. 1612); L72 DOCX — Rest mit E347 geschlossen (Z. 1917, 1973-1978); OFFEN: L133 (Z. 5605, Absatz 5620-5626: „Verbinder … ein Wunsch für den Schaltplan-Teil: eine Marke, die an ZWEI anderen hängt und mitgeht"), L134 Leiterstift (Z. 5969-5990: kein Sammelschienen-/Klemmensymbol, Ader nur im Strich), L192 nennt `elektro:planvorlagen` als Vorbild (Z. 7638), L212 vom 25.9.2026 (Z. 8206-8215): Strg+Z nimmt im Schaltplan zweimal zurück — im Quelltext bestätigt: planflaeche.ts:1017 preventDefault ohne stopPropagation; Wächter test568. L131 (Z. 5396) und L124 (Z. 5015, 48 KB elektroformeln.js im Start) nennen Elektro-Dateien am Rand. AUFGABEN.md: G34 (Z. 420) und G40 (Z. 475) stehen als „Steht."; Z. 665 Motion-Liste „E — PDF/Sync/Wissen/Elektro" offen; kein offener Punkt zu planflaeche/L212 (grep leer). ERLEDIGTE-AUFGABEN.md: Z. 1583 (E261), Z. 3128 („Fachzeichnen + Elektro-Simulator — trägt nachweislich. 106 Symbole"), Z. 4215 (E347), Z. 5606/5785 (E503/E509).

## Risiken

- `lesen` rundet beim Öffnen JEDES x/y und jeden Leitungspunkt auf das Raster (schaltplan.ts:208-247) und schreibt beim ersten `aendere` zurück: eine gemeinsame Schicht mit anderem Raster oder Fliesskomma-Koordinaten verschiebt alte Pläne still — eine Datenwanderung ohne Migration (§9).
- Leitungen tragen ZWEI Wahrheiten: absolute Punkte UND Bindung vonTeil/vonNr (schaltplan.ts:107-111); Konsistenz entsteht erst zur Laufzeit (leitungenNachziehen planflaeche.ts:548-560), die Simulation fällt auf Ortsnähe NAH=6 zurück (simulation.ts:322-347). Ein gemeinsamer Connector muss beide erhalten, sonst verlieren gesicherte .redion-Pläne ihre Verbindungen oder die Simulation rechnet anders.
- Drehung ist auf 0/90/180/270 um den Zeichenmittelpunkt mit Math.round festgelegt (fachzeichen.ts:1166-1182, masse 1185-1190); freie Winkel oder Drehung um eine Ecke nehmen die Anschlüsse vom Raster — Leitungen treffen nicht mehr (Kopf schaltplan.ts:30-35).
- Klemmen-Geometrie (anschluesseVon/anschlussLage) ist Eingabe für Aufgaben-Lösungen (aufgaben.ts:658, 1098-1118), Simulation (simulation.ts:300-313) und Formelbuch-Skizzen (skizzen.ts:87-151): eine Änderung ändert richtige Antworten und Rechnungen (test239/241/243/244) und Word/PDF-Exporte (ausgeben.ts:672-684).
- `block.plan` ist untypisiert (kein Typ in src/core/types/block.ts) und hat schon ein undokumentiertes Feld `werte.U` an der Quelle (schaltplan.ts:742-744); Vorlagen in Store.meta `elektro:planvorlagen` tragen alte Kennungen und Koordinaten (planflaeche.ts:1058-1081) und müssen von jeder Formatänderung mitgelesen werden.
- Undo ist ein lokaler JSON-Stapel (planflaeche.ts:174-203) neben dem Verlauf der Schale — heute doppelt (L212). Eine gemeinsame Undo-Schicht muss zuerst diese Kollision auflösen, sonst gibt es drei Rückgängig.
- Kopplung: bereiche/bloecke und bereiche/elektro rufen einander gegenseitig (bereiche-bestand.json:22-46, 358-362); Verschieben nach core/ ändert index.html-Reihenfolge (Z. 553-623: simulation.js vor schaltplan.js vor planflaeche.js) und den GRUNDSTOCK in sw.ts (§28); test537-Bestand darf nur schrumpfen, test105/109 halten die Bauausgabe.
- Treffer-/Tipp-Geometrie ist am Telefon gemessen (Leitungsgriffe schaltplan.ts:544-613, vector-effect, 7 px Bahnabstand; touch-action:none bausteine.css:7100): ein gemeinsamer Zoom/Viewport ändert ortAus (planflaeche.ts:136-144) und die Griffgrössen — §37 muss neu gemessen werden.
- `tief` hat zwei Zielformate (<tspan> im SVG, <sub> im HTML); Zusammenlegen ohne Parameter bricht entweder das Formelheft oder den Plan; test244 hält nur die Gleichheit der Regex.

## Kleinster nächster Schritt (Vorschlag des Lesers)

Zuerst das wortgleiche `esc` in schaltplan.ts:39-41 und den fünf Elektro-Dateien (start.ts:27, arbeitsplatz.ts:39, formelheft.ts:39, lernbilder.ts:34, skizzen.ts:42) durch `Sanitize.escapeText` (src/core/security/sanitize.ts:183) ersetzen — kein Verhalten ändert sich, test238/240/241/244/446 halten es, und `Planflaeche` bezieht esc ohnehin aus Schaltplan (planflaeche.ts:24). Zweiter, schon geometrischer Schritt: `aufStrecke` aus schaltplan.ts:346-350 und simulation.ts:282-294 zu EINER Funktion mit Toleranzparameter machen (Stromfluss exportiert seine bereits, simulation.ts:922) — davor ein Wächter, der einen Plan mit Knoten auf einer Sammelschiene zeichnet UND rechnet und prüft, dass Knotenbild und Netzliste dieselben Verbindungen nennen (heute können sie auseinanderlaufen). Unabhängig davon und vorher: L212 (planflaeche.ts:1017 stopPropagation) ist rot mit test568 und gehört nach §46 zuerst.
