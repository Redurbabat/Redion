<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, thema, werkzeugleisten]
stand: 25. September 2026
---

# Die vier Werkzeugleisten — das „Vorher" für W6

Stand 25. September 2026 · Quelle: ein Leser für Bogen 5 (E681-Karte, Zeilen am HEAD 0b19a34 nachgesehen). Jeder Punkt trägt Datei:Zeile vom Tag des Standes; wer später liest, prüft die Zeile, nicht den Satz.

## Bilanz in vier Sätzen

- Vier Leisten, vier Klassenpräfixe (`.wb-`, `.gk-`, `.sp-`, `.blatt-`/`.document-`), vier Klick-Handler — geteilt wird fast nichts.
- Geteilt heute: `GfxHistory` (drei von vier, das Studio hält `historyUndo` mit 100 selbst), `Zeichenziel` (nur Studio und Menüband), der 44-px-Trick `button::after` (`.wb-` und `.gk-`).
- Es gibt KEIN Werkzeugregister — weder in `src/core/` noch in `src/register/`. Der einzige Katalog ist `Marken.WERKZEUGE` (`pdf/marken.ts:301–360`), und `register/menueband.ts:422–436` führt einen zweiten, kürzeren (13 ids; ohne triangle, roundrect, curve, textfix, elemente, bild, laser) — gegen §8.
- `Register.tasten` ist eine Übersichtsliste, die nichts ausführt; nur die Gruppe „Blatt und PDF" (52–58) ist gefüllt, nichts in `src/` ruft `tasten.melde`.

## Whiteboard — src/bereiche/bloecke/arten/zeichenflaeche.ts

- `Zusatz.whiteboard(block)` Z.73–875 (Export 1557; gerufen aus `editor/ansicht/editor.ts:898–899`). Leiste als HTML-String 114–150: Wurzel `.wb`, Leiste `.wb-tools`, Knöpfe `[data-wz]`, Farben `.wb-farbe[data-c]`, `.wb-sep`, `.wb-zoom` mit `.wb-massstab`, Aktionen `[data-a]`; Fläche `.wb-flaeche` (SVG), `.wb-griff`, `.wb-eingabe`, `.wb-griffpunkt`. Klick 804–837.
- CSS `quell/schale/stil/werkzeuge.css` 762–787 und 1170–1195; `.wb-massstab, .gk-massstab` (1177) teilt sich die Gedankenkarte.
- Werkzeuge flach, keine Untermenüs: zeiger ⭠, hand ✋, stift ✎ (Vorgabe, `on`), linie ╱, pfeil →, rechteck ▭, ellipse ◯, notiz 🗒, text T, bild 🖼, verbindung ⇢, radierer ⌫; 8 Farben aus `PALETTE` (41–45); Zoom kleiner/%/groesser/passend; Aktionen zurueck, vor, leeren (natives `confirm`), png.
- Zustand: `let werkzeug = 'stift'`, `let farbe` (85–86) nur im Closure, NICHT persistiert; keine Strichstärke. Am Block: `shapes`, `sicht{x,y,z}`, `hoehe`, `raumVersion` (212, 537–540, 850). Verlauf `GfxHistory.erstelle(40)` Z.178.
- Tastatur: `w keydown` 595–604 nur Strg+Z / Strg+Shift+Z / Strg+Y (E682), `preventDefault`, Schale weicht (`schale.ts:3258`). Textfeld eigenes keydown 367.
- Telefon: nur `flex-wrap` (drei Zeilen, Kommentar 134–138), 44 px via `button::after{height:var(--touch-min)}` (werkzeuge.css 778/782), keine Media Query, kein Überlauf-Handling; Pinch 610–619, 710–717. `pruefungen/masse-bestand.json` führt `.wb-tools button` mit 26 px.
- Gemeinsames: `GfxHistory`, `SheetSpace.umrechner` (528–535). Kein `Register.*`, kein `UI.menu`, kein `Zeichenziel`, kein `SelectionFlow`. Register: Blockart `bloecke.ts:96`, Menübandknopf `menueband.ts:498`.
- Wächter: test209 (Zoom/Pan/Fit über `.wb-tools [data-wz]`, `[data-a="groesser|passend"]`, `.wb-massstab` 100 %/125 %), test568 (klickt `[data-wz="rechteck"]`), test570 (rechteck + groesser), test571, test402 + masse-bestand (26 px).

## Gedankenkarte — src/bereiche/bloecke/arten/gedankenkarte.ts

- `Gedankenkarte.zeichne(block)` Z.533–1585 (aus `editor.ts:903–905`); `LEISTE` 565–576, HTML 577–623: `.gk-leiste`, Knöpfe `[data-a]`, `.gk-trenn`, `.gk-farben`/`.gk-farbe[data-c]`/`.gk-farbe-weg`, `.gk-formen`/`.gk-form[data-f]`, `.gk-zoom`/`.gk-massstab`; Bühne `.gk-buehne`/`.gk-welt`, `.gk-griff`. Klick 1335–1366. CSS werkzeuge.css 1355–1412 (Knoten bis ~1543, Telefon 1544–1556 nur Knoten).
- Eine AKTIONSleiste, kein Werkzeugwähler: kind ＋ (Tab), neben ⏎ (Enter), text T (F2), klapp ⊟ (Space), weg 🗑 (Del); 8 Farben + ✕; 6 Formen (`FORMEN` 147–154); vorlage ▤ öffnet `UI.menu` (1314–1330), Ersetzen fragt `Dialog.wahl` (1293); Zoom; zurueck/vor. Kein aktives Werkzeug, kein `on`/`aria-pressed`; Farbe und Form wirken sofort auf `gewaehlt`/`gewaehlteVerb` (`faerben` 1164, `formSetzen` 1152).
- Am Block: `karte` (mit `sicht`), `hoehe` (660, 1564). `GfxHistory.erstelle(40)` Z.649.
- Tastatur Bühne 1467–1508: beim Tippen Enter/Tab/Esc, sonst Strg+Z, Strg+Shift+Z, Tab, Enter, F2, Space, Del/Backspace, Pfeile; `keypress` 1513–1531 überschreibt Knotentext; Strg+Rad zoomt (1461).
- Telefon: nur Umbruch; Farben/Formen/Zoom als `inline-flex`-Gruppen, damit kein Umbruch eine Gruppe teilt (582–586, 611–613); 44 px via `::after` mit Grund darüber (1359–1378).
- Wächter: test529 (§12: jedes `.gk-leiste button::after` 44 px, ≥ 12 Knöpfe), test538 (`.gk-form`, `[data-a="vorlage"]`), test568, test571, test537.

## Planfläche / Schaltplan — src/bereiche/bloecke/arten/planflaeche.ts

- `schaltplan.ts` hat KEINE Leiste (Modell `ARTEN` 127–166, `alsSvg` 458). `Planflaeche.zeichne(block)` Z.151–1092 (aus `editor.ts:908–910`); Aufbau 199–214: `.sp-wrap` > `.sp-kopf`, `.sp-koerper` (`.sp-palette` + `.sp-buehne`), `.sp-fuss`.
- `kopfMalen` 217–252: `<select class="sp-art">`, `.sp-arterkl`, `.sp-werkzeuge` mit `.sp-wz[data-wz]`, `.sp-rechts` mit `.sp-netz` „⚡ Schaltung" (Menü), `.sp-start` „▶ Strom", `.sp-heft` 📐, zurueck, vorwaerts, mehr … (Menü). `fussMalen` 277–312: `.sp-ebene[data-ebene]`; bei Auswahl `.sp-auswahl` (drehen ↻, spiegeln ⇄, doppeln ⧉, gruppieren ⬚, loeschen ✕); `.sp-meldung`. Palette `paletteHtml` 94–128: `.sp-sym[data-sym]` aus `Register.fachzeichen`, Suche, Favoriten. Handler 926–936 / 938–960 / 962–980.
- Werkzeuge: zeigen ↖, leitung ⌐, text T, radieren ⌫ (`type Werkzeug` Z.26); Untermenüs `schaltungMenue` 447–468 und `mehrMenue` 1014–1048 (Raster, Anschlusspunkte, Nummern, Sammelschienen, neu nummerieren, Vorlage, SVG, Leeren); zu setzendes Symbol `z.gewaehltesZeichen`.
- Zustand `z` (29–66, 155–170), nicht persistiert; meta `elektro:favoriten` (80–92), `elektro:planvorlagen` (1051–1071); Plan über `aendere` (175–183); `GfxHistory.erstelle(60)`.
- Tastatur `wurzel keydown` 983–1011: Pfeile (Shift = 5 Raster), Del/Backspace, R (drehen), H (spiegeln), Esc, Strg+D/G/A, Strg+Z, Strg+Shift+Z — kein Strg+Y; Alt+Klick = Favorit.
- CSS `bausteine.css` 7036–7210, Telefon 7201–7211 (Palette unter die Fläche, `column-reverse`, max 230; `.sp-wz`, `.sp-rechts button` 44×44; Auswahl 40×40). ACHTUNG: `.sp-kopf` benutzt auch das Spaltenmenü der Datenbank (bausteine.css 1333–1345, 1699–1701; `datenbanken/steuerung.ts:6164`) — die spätere Schaltplan-Regel überschreibt. `.sp-start`-Motion in `motion.css` 476–508, 1856–2179 (`.rmo-*`, `motion.ts:22`). masse-bestand: `.sp-wz, .sp-rechts button` 34 px.
- Gemeinsames: `GfxHistory`, `Register.fachzeichen`, `UI.menu/frage/banner`, `Formelheft`. KEIN `SheetSpace` (eigenes `ortAus` 135–143), kein `Zeichenziel`. Register: `bloecke.ts:100`, `menueband.ts:502` und `:923`.
- Wächter: test238 (`.sp-wz` zählen, Kontrast des aktiven), test239/test263 (`.sp-start`, `.sp-fuss`), test494/test495 (`.rmo-filament`), test568, test571; test36 trifft das ANDERE `.sp-kopf`.

## Blatt und PDF-Studio — src/bereiche/pdf/marken.ts, document-mode.ts

- Kataloge am Kopf: `FARBEN`/`BREITEN` (11–12), `RADIERER` (54–68), `FORMEN` (79–101), `STIFTE` (141–178), `LEITER` (251–262), `WERKZEUGE` (301–360; `{id, zeichen, sym, name, titel}`: schreiben, select, stift, marker, formen, abdeck, zettel, text, textfix, zeichen, elemente, bild, radierer, laser), `LASER` (364–367), `LAGEN` oben/links/rechts/unten/frei (382–388), `GRUPPEN` (422–439: stil, form, laser, radierer, schrift, auswahl, elemente, farbe, breite, formen, lineal, verlauf); Nutzerordnung `zeichnen:ordnung` mit `ordnungAnwenden`/`ordnungZahlen`/`platzSetzen` 463–581.
- `Marken.leiste(controls, extra)` Z.5175–7140, gerufen von `bloecke/arten/blatt.ts:167` und `pdf/seite.ts:55` (`extra` = fester rechter Teil `.blatt-fest`). DOM: `.blatt-reihe[data-lage, --leiste-x/y]` > `.blatt-werk[role=toolbar, data-tool, data-ordnen]` > `[data-wz]`-Knöpfe, `.blatt-zeilenbruch`, `.blatt-tafel` (Zubehör; `[data-act]`/`[data-gruppe]`). `button()` 5263–5272: `.zeichen[data-sym]` + `.wort`, `aria-pressed`. HTML-Liste von Hand 5303–5354 (Grund 5329–5339), Werkzeuge aus der Tafel gezogen 5622–5625. Ordnen 5682–5815, Tastaturnavigation ein Tabstopp 5826–5873, Platz wechseln/ziehen 5901–6009, `Rollrand.binde` 6027, Klick 6593–6895, fliegende Hervorhebung 6926–7016 (`SelectionFlow.fliege` 6994).
- Quick = alle 14 `[data-wz]` in der oberen Reihe (`formen` steht für 7 Formen). Zubehör in `.blatt-tafel`, nur die Gruppen des aktiven `data-tool` (CSS 5788–5887): Radierer-Modus/3 Grössen/auto; Rückgängig/Wiederholen/`lage`/Einrichten; Auswahl (löschen, kopieren, einfügen, ausschneiden, vor/zurück, sperren, verweisen, als Element); Elemente; Lineal; Formerkennung; Kritzeln; Schrift (Familie, A−, A+, fett, Rahmen, Ausrichtung); 6 Stifte; 7 Formen; 2 Laser; 5 Farben + eigene + „+"; 3 Breiten + Schieber `.blatt-staerke.auf`. Studio-Popover über `InkMenu.open` (`pdf/ink-menu.ts`, `.blatt-popover`).
- Zustand in `schicht` (1608+): `tool`, `color`, `width`; JE WERKZEUG Farbe+Breite in meta `zeichnen:werkzeugwerte` (1629–1665; `setzeWerkzeug` 4357–4389, E674); weitere meta `zeichnen:stift/form/radierer/radierergroesse/radiererauto/formen/kritzel/schrift/farben/farbsaetze/elemente/leiter/laser/leistenlage/leistenfrei/ordnung`; Studio merkt je Seite `dokStift:`/`dokTinte:`/`dokStrich:` (document-mode.ts 2149–2151, 4173–4184). `steuerung` 4509–4539. Verlauf: eigener `historyUndo` (100, Z.37/~1969), NICHT `GfxHistory`.
- Tastatur: Fläche 4320–4337 (Del, Strg+Z/Shift+Z, X, C, V, Esc); Leiste Pfeile/Home/End 5857–5873; Esc schliesst Breitenschieber 6559. GLOBALE Einzelbuchstaben `TASTEN` 7150–7153, `document keydown` 7248: P stift (P nochmal wechselt den Stift), 2 bleistift, H marker, E radierer, S formen, V select, T text, A abdeck, N zettel, M zeichen, R lineal, I bild — gewacht von `tippt()` und `Zeichenziel.da()`, prüft NICHT `defaultPrevented` (Vermutung, nicht gemessen: R/H in der Planfläche oder Buchstaben in einem Kartenknoten könnten das Blatt umschalten).
- document-mode.ts: obere Leiste `.document-drawingbar` (`role=toolbar`, 2028–2050) aus `Marken.WERKZEUGE` als `[data-document-tool]` + `ink-ruler`, `ink-options ···`, `formelheft` (2593–2616); `.document-ink-history` 2061–2064; `inkSync` 2709–2775 über `Zeichenziel.horche`; Klicks 4170–4290; `toolsSetzen` 4071–4093 (`data-document-tools`); keydown 4123–4169 (Esc-Lagen, Strg+F); `Register.kontext`-Lieferant aus `Register.menueband.inReiter('zeichnen')` 4875–4916.
- CSS `bausteine.css` ~4264–6228 (Basis 4264–4287; Tafel als Kasten ab 1300 px 4288–4375; Dock-Welle 4411–4490; drei Zustände 4491–4581, Flug `.bw-flug` 4550–4569; Lagen `data-lage` 4738–4900; Farben/Adern 4923–5036; Ordnen 5051–5187; Studio-Felder/Popover 5246–5420; Gruppen je Werkzeug 5788–5887; Container-Queries 5975–6060; TELEFON 6063–6228; Breitenschieber ~9448–9485). `pdf-studio.css`: obere Leiste 136–160/673–705/744–750, Verlaufskapsel 196–221, Studio-Dock 225–335, Telefon 336–390.
- Telefon (`max-width:760px`): EINE waagrecht rollende Zeile ohne Umbruch, Wörter versteckt (für Vorleser da), Knöpfe ≥ `--touch-min`, Rückgängig/Wiederholen `position:sticky`, Reihenfolge über `--platz`/`--g-ordnung`, `zumWerkzeugRollen` (5228–5232), kein Ziehen (5943). Grössere Fenster: Container-Queries 1150/820/1300. Studio: Dock `position:fixed` unten; obere Leiste wandert ab `innerWidth ≥ BAND_AB` (900) ins Folienband (document-mode.ts 831, 2535–2569). Nichts heisst „dicht/dense/kompakt" (einzige Stelle Prosa pdf-studio.css:309); keine „Werkzeugtafel" in `src/` — das Nächste ist `.blatt-tafel` (E614/E618).
- Gemeinsames: `Zeichenziel` (`melde` 5194, `horche` 6580, `beruehrt` 6589), `SelectionFlow.fliege`, `SheetSpace` (`const R = SheetSpace`, 1610), `Register.symbole.fuelle`, `Register.fachzeichen`, `Rollrand`, `InkMenu`, `Dialog`. `Linse` nur in der Schale (`seitenleiste.ts:291`).
- Wächter (66 Dateien nutzen `.blatt-werk`): test348 (Telefon: nur Gruppen des Werkzeugs), 351 (Rechner zwei Zeilen), 365 (ein Formen-Werkzeug), 393 (Verlauf sticky beim Rollen), 438 (`TASTEN` = `register/tasten.ts`), 448 (44 px), 461, 480 (Stiftreihe, Laser, vier Lagen), 522 (nur ein lauter Knopf), 523 (Ordnung), 524, 533 (Tafel als Kasten, Wort unterm Zeichen), 534 (Platz wechseln/ziehen), 536 (Dock-Welle ohne Studio), 562 (Werkzeugwerte); Studio-Leiste 210/386/463/506/508/510/532; „···" 177/228/437/515; ferner 247, 343–347, 349–352, 439, 458, 464, 477, 478, 535, 561–564.

## Register — wo ein Werkzeug heute anschliessen könnte

- `register/befehle.ts`: Befehl `{titel, tun, gruppe?, zeigen?}` (40–46), `melde`/`meldeLieferant` (z. B. `elektro/arbeitsplatz.ts:644`). Keine der vier Flächen meldet Befehle.
- `register/tasten.ts`: Gruppe = `[name, [[taste, was]…]]` (165–171), `melde(gruppe, taste, was)` 174–181. Nur Übersicht, führt nichts aus. Nur „Blatt und PDF" (52–58) gefüllt; keine Einträge für Whiteboard, Gedankenkarte, Planfläche.
- `register/menueband.ts`: `BandEintrag {reiter, gruppe, id, name, zeichen, kurz?, hinweis?, gross?, an?(), probe?, tun(), zeigen?()}` (47–79); `melde`/`meldeLieferant` 990–1001; `inReiter` 1121, `eines` 1159. Reiter „Zeichnen" 461–524 spricht `Zeichenziel`. EIGENE `WERKZEUGE`-Liste 422–436 (13 ids) — zweiter Katalog neben `Marken.WERKZEUGE`.
- `register/bloecke.ts`: die vier Flächen 95–100 (`blatt`, `whiteboard`, `mindmap`, `schaltplan`); `melde`/`nimmZurueck` ~270–292. `register/fachzeichen.ts` API `{RASTER, alle, holen, inGruppe, gruppen, alsSvg, masse, anschlussLage…}` (1192). `register/context.ts` `melde`/`meldeLieferant(bereich, fn)` (97, 122). `register/symbole.ts`: Strichzeichen 24×24, `{hat, alsSvg, fuelle, alle}`, kein `melde`.

## Gemeinsamer Werkzeugbegriff im Kern: keiner

- Nichts in `src/core/` definiert einen Werkzeugtyp oder ein Werkzeugregister.
- `src/kern/helfer/zeichenziel.ts` merkt nur die gemeinte Fläche und einen Werkzeug-NAMEN: `type Steuerung = { flaeche?, setzeWerkzeug?(name), setzeFarbe?, setzeStrich?, undo?, redo?, deleteSelection? }` (92–100), `type Eintrag = { steuerung, name, gesehen, werkzeug, farbe, dicke }` (115–116); API `melde, beruehrt, aktive, da, jetzt, setze, uebernehme, setzeFarbe/setzeStrich, uebernehmeFarbe/uebernehmeStrich, ruf, horche/vergiss` (402–406). Nur die Marken-Steuerung meldet sich; Whiteboard, Gedankenkarte, Planfläche nie.
- `Planflaeche` hat einen lokalen `type Werkzeug = 'zeigen'|'leitung'|'text'|'radieren'` (26).

## Die untere Leiste der Schale (was eine schwebende Leiste meiden muss)

- `nav#handy-oben` (`index.html:259–274`; heisst „oben", steht unten): fünf Reiter. Linse `#ho-pille` über `seitenleiste.ts:283–371` (`pilleSchieben`, `SelectionFlow.folge`, `Linse.sicherstellen`), `handyLeiste` (429); Klicks `dockWechsel` `schale.ts:4226–4262`.
- CSS `bausteine.css` 1729–1893 (Linse 1916–2081), nur `max-width:760px`; `position:fixed; left:10px; right:10px; bottom:calc(9px + env(safe-area-inset-bottom)); z-index:401`; Höhe `--mobile-nav-height: 60px` (`marken.css:76`); `--hunten = calc(9px + var(--mobile-nav-height) + env(safe-area-inset-bottom))` (bausteine.css:1809).
- Heute weichen aus: `#scroll{padding-bottom:calc(var(--hunten) + 24px)}` (2257); Schublade, Streifen, schwebende Knöpfe über `--hunten` (274, 4033–4046, 7973; ansichten.css 262); versteckt bei `body.schreibt` (2697) und im Dokumentmodus (6485, pdf-studio.css:115).
- Whiteboard-, Karten- und Schaltplanleiste sitzen INLINE oben im Block und rollen mit der Seite — sie brauchen nur das `#scroll`-Polster. Studio-Dock `.blatt-reihe`: `position:fixed; bottom:calc(var(--visual-bottom,0px) + max(14px, env(safe-area-inset-bottom))); z-index:80` (pdf-studio.css:240; `--visual-bottom` schreibt `kern/einstellung/app.ts` gegen die Bildschirmtastatur); Papier `padding-bottom` 110/100 (225, 388); Verlaufskapsel am Telefon `bottom:calc(var(--visual-bottom) + 84px)` (382–386).
- UNGEPRÜFTES RISIKO: Leiste „unten" auf der gewöhnlichen Seite ist `position:sticky; bottom:10px; z-index:6` (bausteine.css 4829–4838) und rutscht am Telefon womöglich unter `#handy-oben` (401). Kein Wächter; test534 §7 prüft nur das Ziehen.

Zurück zur [[Redion|Übersicht]].
