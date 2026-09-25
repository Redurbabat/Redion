<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, editor]
stand: 25. September 2026
head: a196b65
---

# A · Editor und Blockmodell

A · Editor und Blockmodell — Block-Editor (`Blocks`), Auswahlleiste (`Auswahl`), Mehrfachauswahl (`Mehrfach`), Blockregister (`Register.bloecke`), Blockmodell in `Store` (`src/kern/ablage/indexdb.ts`), Seiten-Undo (`Verlauf`). Ohne die räumlichen Arten unter `src/bereiche/bloecke/arten/`. Hinweis: `src/bereiche/bloecke/` enthält NUR den Ordner `arten/` (zeichenflaeche, gedankenkarte, blatt, schaltplan, planflaeche) — einen nicht-räumlichen Teil gibt es dort nicht (`ls src/bereiche/bloecke/` → nur `arten`).

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/bereiche/editor/ansicht/editor.ts` | Der Block-Editor `Blocks`: Katalog aus dem Register (Z.41 `Register.bloecke.alle()`), Einbettdienste DIENSTE (Z.51), Markdown-Leser/Schreiber mdLesen/mdEinsetzen (Z.177/275), render(block) mit switch(block.type) (Z.430-985, default Z.985 = unbekannter Typ wird als Textfeld gezeichnet, nicht gelöscht), bindeEditor (Tastatur, Drag&Drop, Slash) (Z.1568), umwandeln (Z.2077), Block-Operationen einruecken/ausruecken/verschiebe/lege/dupliziere (Z.2151-2232), Slash-Menü (Z.2667), Block-Handle-Menü (Z.2962), Mehrfachauswahl auswahl* (Z.3178-3479); Export Z.3550-3564 | 3565 |
| `src/bereiche/editor/ansicht/auswahlleiste.ts` | `Auswahl`: schwebende Textauszeichnungsleiste über markiertem Text; stelleImText (Z.113) trifft die markierte Stelle statt des ersten Vorkommens (E650); umschliesse/linkSetzen sind seit E668 der EINE Weg auch für Strg+B (editor.ts:2068-2071 delegiert) | 357 |
| `src/bereiche/editor/mehrfach.ts` | `Mehrfach`: zweite, ältere Mehrfachauswahl (Set gewaehlt, Z.15), aus notion.js herausgelöst; einziger Aufrufer schale.ts:4093 (`Mehrfach.start()`) | 160 |
| `src/register/bloecke.ts` | `Register.bloecke`: EINGEBAUT (Z.35-222, Blockarten + Aktionen a-*), NUR_NAME für pdfseite/zeichenflaeche/spalte/database/tabelle (Z.250-265), melde/nimmZurueck/alle/benannt/eines/zuMarkdown/zifferZuTyp/ueberschriften/suche (Z.313-362). `melde()` hat in src/ keinen Aufrufer (grep 'bloecke.melde' src → leer); nur test86/test272 rufen es | 363 |
| `src/kern/ablage/indexdb.ts` | `Store`: addBlock (Z.391), updateBlock (Z.440), trashBlock (Z.470), restoreBlock (Z.489), purgeBlock (Z.539), childrenOf (Z.762, filtert alive), rohSetzen (Z.958, für Abgleich, ohne edited-Stempel), baum/baumEinfuegen/kinderLeeren (Z.2483/2503/2567), Versionsverlauf versionSpeichern/versionen (Z.2658/2695); Export Z.3042-3070 | 3071 |
| `src/kern/zustand/verlauf.ts` | `Verlauf`: Rückgängig/Wiederholen als zwei Stapel ganzer Seiten-Bäume (MAX 60, Zaun 700 ms), hängt sich per Monkeypatch an Store.updateBlock/addBlock/trashBlock/purgeBlock/setProp/addDatabase/addRow (Z.100-108) | 112 |
| `src/core/types/block.ts` | Typen RedionBlock/RedionRow/RedionPage/RedionVersion — Feldnamen wie gespeichert (created, edited, erstelltVon, alive, parentTable) | 115 |
| `src/core/types/id.ts` | ID/BlockId/PageId/CollectionId als string-Aliasse (bewusst nicht branded, Z.12-16), Result<T> | 62 |
| `src/core/helpers/ids.ts` | `Ids.long()` = UUID (crypto.randomUUID) für alles Gespeicherte, `Ids.short()` für Spaltenschlüssel (nie rein numerisch, E96) | 80 |

## Datenmodell

Ein Block liegt im IndexedDB-Fach `blocks` (keyPath id) als flaches Objekt; die Kinder sind NUR Kennungen in `content`, keine Objekte. Genau die Felder, die `addBlock` schreibt (indexdb.ts:391-405): `id` (uid() → Ids.long(), Z.374-375), `type` ('text' Vorgabe), `text: ''`, `content: []`, `parentId`, `parentTable: 'block'`, `color: ''`, `created`/`edited` (ISO, `now()` Z.379), `erstelltVon` (getMeta('nutzer') || 'Ich'), `alive: true` — dann `Object.assign(…, patch)`: ein Patch legt sich ÜBER die Vorgaben, also darf ein Aufrufer eine Kennung mitgeben (E174 nutzt das). Danach wird der Block in `parent.content` eingehängt (Z.409-414) und der Elternblock bekommt `edited` (elternGeaendert Z.426-430) — sonst sähe der Abgleich die neue Reihenfolge nie. `updateBlock` (Z.440-465) setzt `edited` und `geaendertVon`, und schreibt bei `todo` `erledigtAm` (E663). Papierkorb = `alive:false` + `trashedAt` + aus `content` des Elternteils entfernt (trashBlock Z.470-486); `purgeBlock` löscht endgültig samt Kindern, Versionen und Anhängen asynchron (Z.539-570). Zeilen einer Datenbank sind derselbe Satz mit `parentTable:'collection'` und Spaltenwerten unter `props` (core/types/block.ts:75-80). Optionale Felder laut Typ (block.ts:59-70): icon, collectionId, aktiveView, dateiId, papierkorbSichtbarSeit; im Editor zusätzlich gelesen: `herkunft` (editor.ts:450-456), `stil` (Z.489), `open`, `checked`, `audioRef` (Z.988), `gesperrt` an der Seite (Z.470-471), `locked` (verlauf.ts:39). Der Baum-Schnappschuss `Store.baum(id)` (indexdb.ts:2483-2500) kopiert rekursiv (Tiefe ≤ 40), ersetzt `content` durch `kinder` und hängt bei Datenbankblöcken `collection`, `views`, `rows` an; `baumEinfuegen` (Z.2502-2565) setzt ihn „immer mit frischen IDs“ wieder ein (`delete patch.id`, Z.2508). Versionen: Fach `versions` (Z.103-104), `RedionVersion` mit vollem Teilbaum `daten` (block.ts:107-115), ausgedünnt nach Frisch/Tag/Monat-Regel (Z.2600-2615). Die Blockart selbst ist im Register beschrieben (register/bloecke.ts:18-27: id, name, icon, zeichen, gruppe, cmd, kurz, md, ph, stufe, nurName) — das Register beschreibt, es zeichnet nicht (Z.28-30).

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Blocks` | global | `src/bereiche/editor/ansicht/editor.ts:3550-3564` | TYPEN, typ, render, bindeEditor, umwandeln, umwandelnMenue, inline, esc, cursorAnsEnde, slashMenue, slashAktion, aktionAmEnde, alleToggles, einfuegenAmEnde, dupliziere, verschiebe, lege, blockVerschiebenNach, seitenPicker, blockMenue, datenbankWaehlen, knopfAusfuehren, eineAktion, AKTIONS_NAMEN, DIENSTE, einbettungsAdresse, auswahl* (17 Funktionen), mdLesen, mdEinsetzen, mdIstStruktur, sprachName, auswahl(). Fremde Bereiche greifen darauf zu: bloecke (3), datenbanken (3), einstellungen (5), wissen (3) laut pruefungen/bereiche-bestand.json |
| `Auswahl` | global | `src/bereiche/editor/ansicht/auswahlleiste.ts` | umschliesse(marke), linkSetzen, Leiste zeigen/verstecken; editor.ts:2068-2071 ruft `Auswahl.umschliesse` für Strg+B/I/U/E/Shift+S (Z.1936-1940) |
| `Mehrfach` | global | `src/bereiche/editor/mehrfach.ts:154-155` | start, waehle, leeren, hat, ids, bereich, schmal — nur `Mehrfach.start()` wird von aussen gerufen (schale.ts:4093) |
| `Register.bloecke` | register | `src/register/bloecke.ts:360-362` | alle, benannt, eines, gruppen, inGruppe, zuMarkdown, ueberschriften, zifferZuTyp, suche, melde, nimmZurueck, vonAussen, anzahl. `alle()` gibt IMMER dieselbe Liste (Z.267-271), der Editor hält sie ab Z.41 fest |
| `Store (Blockteil)` | global | `src/kern/ablage/indexdb.ts:3042-3070` | addBlock, getBlock, updateBlock, trashBlock, restoreBlock, purgeBlock, childrenOf, baum, baumEinfuegen, kinderLeeren, rohSetzen, versionSpeichern, versionen, versionLoeschen, on(fn) |
| `Verlauf` | global | `src/kern/zustand/verlauf.ts:108-112` | start, merke(erzwingen), zurueck, vor, leeren. Gerufen von schale.ts:697 (Menü), schale.ts:3252/3256 (Strg+Z / Strg+Umschalt+Z bzw. Strg+Y), register/menueband.ts:785/790 (v-undo/v-redo) |
| `Ereignisse.melde` | ereignis | `src/bereiche/editor/ansicht/editor.ts (1 Aufruf), indexdb.ts:367-368 (ablageGeladen)` | Ereignisbus aus kern/ereignisse; der Editor meldet genau einmal, sonst redet er über Globale und `App.zeichneSeite()` (71 Aufrufe) |
| `Store.on / notify` | ereignis | `src/kern/ablage/indexdb.ts:535, 3069` | Ablage meldet 'purge', 'pages' u.a. an Horcher (notify); Verlauf hängt sich stattdessen per Monkeypatch an die Store-Funktionen (verlauf.ts:100-108) |
| `Zeichenziel.ruf('undo'\|'redo'\|'deleteSelection')` | funktion | `src/kern/helfer/zeichenziel.ts:377-382` | Der ZWEITE Undo-Pfad: reicht an die Steuerung der zuletzt berührten Zeichenfläche (Marken) weiter; menueband.ts:486-492 ruft ihn, menueband.ts:771-776 erklärt die zwei Zurück-Knöpfe |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | ja | **ja** | editor.ts:1235-1239 (clientX für Spaltengriff), 2016-2017 (clientY beim Drop), 1965-1967 (Fake-Anker aus clientX/Y); auswahlleiste.ts:201-222 (Leiste positionieren) — rohe Zahlen, kein Point-Typ; core/ink/geometry.ts und core/orb/geometry.ts werden nicht benutzt (kein Treffer in editor/) |
| rect | ja | **ja** | getBoundingClientRect direkt: editor.ts:1236-1237, 1550, 2016, 2668, 2963, 3343; auswahlleiste.ts:201, 222, 287, 293 |
| bounds | nein | nein | nicht gefunden (grep getBoundingClientRect/bounds in src/bereiche/editor) — Blöcke fliessen im DOM, es gibt keine Hülle |
| transform | nein | nein | nicht gefunden in src/bereiche/editor (grep transform/matrix) |
| viewport | ja | **ja** | editor.ts:1550 (`top < 140` für aktive Überschrift im Inhaltsverzeichnis); mehrfach.ts:48-51 und editor.ts:3193 matchMedia(max-width) — keine Viewport-Abstraktion |
| zoom | nein | nein | nicht gefunden (grep zoom/scale in src/bereiche/editor) |
| pan | nein | nein | nicht gefunden; Scrollen ist Browser-Scroll (App.zeigeBlock) |
| selection | ja | **ja** | ZWEIMAL: editor.ts `ausgewaehlt`/`ankerId` + auswahlSetzen/auswahlBis/auswahlZeigen (Z.3181-3233) UND mehrfach.ts Set `gewaehlt` + waehle/bereich (Z.15, 52-60); Textauswahl via getSelection in auswahlleiste.ts:27-40 |
| hitTest | ja | **ja** | DOM-basiert: `elVon(e)?.closest('.blk')` (editor.ts:28-29, 1992-2026); Ober-/Unterhälfte beim Drop: `(e.clientY - r.top) > r.height/2` (editor.ts:2016-2017); Auswahlleiste findet den Block über Range.startContainer.closest('.blk') (auswahlleiste.ts:31-40) |
| snap | nein | nein | nicht gefunden (grep snap/einrast in src/bereiche/editor) |
| resizeHandles | ja | **ja** | editor.ts:1233-1247 — ein Griff am Bild, pointerdown/pointermove, Breite in Prozent (10-100) geklemmt |
| rotation | nein | nein | nicht gefunden in src/bereiche/editor |
| group | ja | **ja** | Baumstruktur statt Gruppe: content/parentId (indexdb.ts:391-414), columns/columns3 mit Kind-Spalten (register/bloecke.ts:88-89, test176), einruecken/ausruecken (editor.ts:2151-2180) |
| connector | nein | nein | nicht gefunden; Verweise sind Blocktypen pageref/synced/linkeddb (register/bloecke.ts:91-93), keine Geometrie |
| frame | nein | nein | nicht gefunden; das nächste ist `blatt` (bloecke/arten, ausserhalb dieses Systems) |
| zOrder | ja | **ja** | nur als Reihenfolge in `content` (indexdb.ts:411-412, verschiebe editor.ts:2181, lege 2192); keine z-Achse |
| undo | ja | nein | gemeinsam: kern/zustand/verlauf.ts (Seiten-Schnappschuss, 60 Schritte); editor.ts ruft `Verlauf.merke` 2× (grep). Zweiter Pfad für Zeichenflächen über kern/helfer/zeichenziel.ts:377 → Marken (100 Schritte, AUFGABEN.md:886) |
| pointerNormalisierung | nein | nein | nicht vorhanden: gemischt pointerdown (editor.ts:1233), mousedown (1991, 3544; auswahlleiste.ts:252, 342), HTML5 dragstart/dragover/drop (1999-2021); touch nur über CSS-Breite (mehrfach.ts:48, editor.ts:3193). Am Telefon gibt es kein Ziehen (E84) |

## Gemeinsam genutzt

**Benutzt:** [[kern-Store|Store]] · [[kern-Verlauf|Verlauf]] · [[kern-Register|Register]]

**Nur genannt, nicht benutzt:** [[kern-Dateien|Dateien]] — der Befund sagt, warum.

- src/kern/ablage/indexdb.ts — `Store`: updateBlock (65×), getBlock (58×), trashBlock (16×), addBlock (13×), childrenOf (11×), purgeBlock (8×), baum/baumEinfuegen (je 6×), getMeta, getCollection, addPage, addRow, addView, addDatabase, rowsOf, pathOf, now (gezählt per grep über editor.ts, mehrfach.ts, auswahlleiste.ts)
- src/register/bloecke.ts — `Register.bloecke.alle()` (editor.ts:41), `zifferZuTyp` (Z.113-115), `eines` (5 Treffer)
- src/kern/zustand/verlauf.ts — `Verlauf.merke` (2×)
- src/kern/einstellung/konstanten.ts — `KONSTANTEN.TELEFON_BREITE` (mehrfach.ts:50; editor.ts 1×)
- src/register/textstile.ts — `Textstile.klassen/SCHRIFTEN/GROESSEN` (editor.ts:489)
- src/kern/ereignisse — `Ereignisse.melde` (1×)
- src/schale — `App.zeichneSeite` (71×, schale.ts:941), `App.aktuelleSeite` (19×), `App.oeffne` (11×), `UI.toast` (39×), `UI.menu`, `UI.banner`, `UI.emojiWaehlen`, `Menue.menu`, `Farben.name/alle`, `Ablage.kopiere/kopiereJetzt`
- src/core/helpers/ids.ts — indirekt über Store.uid → Ids.long() (indexdb.ts:374-375)
- NICHT benutzt: src/core/ink/geometry.ts, src/core/orb/geometry.ts, kern/helfer/rollrand.ts, kern/helfer/zeichenziel.ts (kein Treffer in src/bereiche/editor)

## Duplikate — je mit zwei Stellen und Zitat

1. **Zwei Mehrfachauswahl-Zustände für dieselben `.blk`-Elemente**
   - hier: `src/bereiche/editor/ansicht/editor.ts:3218-3223 (auswahlSetzen/auswahlLeeren, Feld `ausgewaehlt`, Klasse `gewaehlt`)`
   - dort: `src/bereiche/editor/mehrfach.ts:15, 38-40, 52-58 (Set `gewaehlt`, leeren/waehle, Klasse `sel`)`
   - Beleg: editor.ts: `const auswahlLeeren = () => { ausgewaehlt = []; ankerId = null; auswahlZeigen(); };` — mehrfach.ts: `const leeren = (): void => { gewaehlt.clear(); zeichne(); };` und `el.classList.toggle('sel', …gewaehlt.has(…))`. Beide werden gestartet: `Blocks.auswahlEinklinken` (editor.ts:3479) und `Mehrfach.start()` (schale.ts:4093).
2. **Escape-Funktion `esc`**
   - hier: `src/bereiche/editor/ansicht/editor.ts:328-329`
   - dort: `src/kern/helfer/vorschau.ts:46-48 (und ~65 weitere Dateien, grep 'const esc = ' src)`
   - Beleg: editor.ts: `const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');` — vorschau.ts: `const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');` (die Editor-Fassung escapet `'` NICHT)
3. **Ziffer→Blockart-Zuordnung als Literal-Rückfall**
   - hier: `src/bereiche/editor/ansicht/editor.ts:116-117`
   - dort: `src/register/bloecke.ts:333-340 (zifferZuTyp, aus `kurz` gelesen)`
   - Beleg: editor.ts: `: { '0':'text','1':'h1','2':'h2','3':'h3','4':'todo','5':'bullet','6':'number','7':'toggle','8':'code','9':'page' }` — bloecke.ts: `const m = /^Ctrl\+Shift\+([0-9])$/.exec(String(x.kurz ?? '')); if (m && m[1]) raus[m[1]] = x.id;`. Der Kommentar Z.109-112 sagt selbst, es waren vier Kopien; eine ist als Rückfall geblieben.
4. **Telefon-Erkennung über max-width**
   - hier: `src/bereiche/editor/ansicht/editor.ts:3193 und src/bereiche/editor/mehrfach.ts:48-51`
   - dort: `src/kern/einstellung/app.ts:70-74 (istTelefon mit KONSTANTEN.TELEFON_BREITE + pointer:coarse)`
   - Beleg: editor.ts: `window.matchMedia('(max-width: 760px)').matches ? 1 : 2` (Zahl hart) — app.ts: `const grenze = … KONSTANTEN.TELEFON_BREITE : 760; … return window.innerWidth <= grenze || (grob && window.innerHeight <= 500);`
5. **Zwei Listen umwandelbarer Blocktypen in einer Datei**
   - hier: `src/bereiche/editor/ansicht/editor.ts:120-121 (UMWANDELBAR)`
   - dort: `src/bereiche/editor/ansicht/editor.ts:3325-3326 (EINFACHE_TYPEN)`
   - Beleg: `const UMWANDELBAR = ['text','h1','h2','h3','todo','bullet','number','toggle','quote','callout','code','equation','flashcard','page'];` gegen `const EINFACHE_TYPEN = ['text','h1','h2','h3','todo','bullet','number','toggle','quote','callout','code'];` — Einzelblock darf nach equation/flashcard/page, Mehrfachauswahl nicht.

## Prüfläufe

- `test39` — Slash-Befehle und Tastenkürzel: jedes Kürzel wird getippt und das Ergebnis abgelesen (test39.mts:186)
- `test65` — Mehrfachauswahl im Editor: Blöcke wählen, Leiste erscheint ab zwei, Aktionen (test65.mts: 'Sechs Blöcke stehen auf der Seite', 'Bei einem noch keine Leiste')
- `test66` — Tabellenblock/Markdown-Lesen: Zahl aus [["80"]], zwei Stücke werden eins, Fett verliert die Marke
- `test70` — Transaktionen; §13 (Z.344-366): EIN Rückgängig holt beide Befehle zurück — und dokumentiert, dass die Blöcke danach NEUE IDs haben (Z.351-352)
- `test86 / test272` — Register.bloecke.melde/nimmZurueck: Anmelden einer Blockart von aussen (einzige Aufrufer von melde)
- `test97` — Papierkorb-Versprechen: Undo holt einen gelöschten Block zurück, solange das Fenster offen ist (test97.mts:17)
- `test111` — Blosses Öffnen einer Seite darf nichts speichern und keinen Undo-Schritt erzeugen (LUECKEN.md:8375, T3)
- `test132` — Zeile für Zeile jedes Markdown-Kürzel tippen (L20)
- `test139` — src/core/types gegen echte Sicherung und Register prüfen — RedionBlock-Felder stimmen mit addBlock überein
- `test142` — Register sind die zentrale Wahrheit: jede Blockart im Editor kommt aus Register.bloecke
- `test158` — Mehrfachauswahl-Einstieg: Esc, Umschalt-/Strg-Klick, Alt+Umschalt+Klick (§7)
- `test162` — Markdown-Tabelle beim Einfügen wird Tabellenblock (E88)
- `test164` — doku/BLOCKTYPEN.md hält Schritt mit Register.bloecke (L195: die Doku ist NICHT erzeugt)
- `test176` — Enter in einer Spalte legt kein neues Spaltenkind an (columns-Block)
- `test179` — Strg+Umschalt+C legt Blockadresse #block=<kennung> ab — Kennungen als Adresse
- `test188` — E114: `rows` einer einfachen Tabelle überlebt Store.baum/baumEinfuegen — auch über Verlauf.zurueck (Z.109-124)
- `test191 / test192` — Jede Blockart ist über den Menschenweg (Schrägstrich, Name, Enter) benutzbar (E119/E170)
- `test194` — Produktmodule am Telefon: Fokus, Tastatur-Rand, Blatt hinter simulierter Tastatur
- `test542` — Auswahlleiste trifft die markierte Stelle, nicht das erste Vorkommen (E650)
- `test557` — Fett ist ein Schalter, Strg+B geht denselben Weg wie der Knopf; Auszeichnungen gehen nicht verloren (E668)
- `test537` — bereiche-bestand.json: der Editor fasst KI(4), Kommentare(4), Formula(2), Datenbank(1), Learning(1), Links(1), Werkzeuge(1) an und darf nicht mehr werden

## Doku-Stand

AUFGABEN.md: kein eigener Abschnitt zum Editor/Blockmodell (Überschriften Z.43-1241: Cloudflare, Telefon, Auftragsmaschine, PDF/GoodNotes, UI-System, Office O1-O7, Werkzeugtafel W1-W5); Z.886 erwähnt „100 Schritte rückgängig“ der Markenschicht (Zeichnen, nicht Editor). LUECKEN.md offen (Überschrift ohne GESCHLOSSEN): L3 „Der Spreadsheet-Block“ (Z.171), L20 „Markdown- und Tastenkürzel“ (Z.739, Rest sind Browser-unmögliche Funktionen), L174 „Die Auswahl-Werkzeugleiste ist breiter als das Fenster“ (Z.7201 — betrifft die Zeichen-Auswahl, nicht auswahlleiste.ts), L195 „Die Blocktypen-Inventur behauptet, erzeugt zu sein — sie ist es nicht“ (Z.7726, doku/BLOCKTYPEN.md wird von Hand gepflegt, test164 hält sie), L41 „Der Weg zu einem Baustein ist nicht der Baustein“ (Z.1218, Reste via E170), L191 dritter Kopplungsweg ohne Zuordnung (Z.7581), L150 Bereiche-Querverweise (Z.7545, E626: editor→7 fremde Namen). Geschlossen: L19 Blocktypen (Z.720), L40 Markdown-Rundlauf/Kennungen (Z.8687, E174), L160, L204 (E646). ENTSCHEIDUNGEN.md (grep Überschriften): E29 Tabellenblock (Z.2083), E59 Markdown beide Richtungen (Z.3879), E84 Mehrfachauswahl am Telefon (Z.6061), E88 Markdown-Tabellen (Z.6284), E114 `rows` zweierlei (Z.8128), E119 Frage an jede Blockart (Z.8528), E170 Weg zu einer Blockart (Z.12289), E174 Kennungen überleben Quelltext-Rundlauf (Z.12711), E175 Kennung ist keine Abfrage (Z.12787), E540 „eine Folie ist ein Blatt, kein neuer Blocktyp“ (Z.586 Verzeichnis, Z.43333), E607 Gedankenkarte (Z.49113), E626 Bereiche getrennt (Z.51021), E650 String.replace trifft das erste Vorkommen (Z.53393), E668 Fett ist ein Schalter (Z.54599); Z.8163 verortet Strg+Z in verlauf.ts. ERLEDIGTE-AUFGABEN.md: E650 (Z.479), E663/E664 (Z.68), E646/E647 (Z.566). Keine offene L-/E-Nummer, die einen Undo je Block/Zeichen oder die Kennungsänderung beim Rückgängig benennt — nur test70.mts:351-352 hält es als Tatsache fest.

## Risiken

- Rückgängig ändert Kennungen: `Verlauf.anwenden` (verlauf.ts:57-62) ruft `Store.kinderLeeren` (purgeBlock aller Kinder, indexdb.ts:2567-2572) und `Store.baumEinfuegen` („immer mit frischen IDs“, Z.2502, `delete patch.id` Z.2508). Nach einem Strg+Z zeigen `#block=`-Verweise (E105/test179), Kommentare und Abgleichs-Grabsteine auf tote Kennungen; test70.mts:351-352 vergleicht deshalb bewusst nur Text. Eine gemeinsame Undo-Schicht darf dieses Verhalten nicht übernehmen — sie müsste Kennungen erhalten (addBlock nimmt `id` im patch, E174).
- Der Undo geht über `purgeBlock` — endgültig, mit asynchronem Aufräumen der Anhänge (indexdb.ts:539-560). Ein Undo auf einer Seite mit Datei-Blöcken kann `purgeAnhaenge` anstossen, obwohl der Block gleich neu angelegt wird (nicht gemessen; Hypothese aus dem Code).
- Zwei Undo-Systeme mit zwei Knöpfen (menueband.ts:771-790): `Verlauf` (ganze Seite, 60 Schritte, 700-ms-Zaun) und Marken-Undo je Zeichenfläche über `Zeichenziel.ruf` (zeichenziel.ts:377). Strg+Z in schale.ts:3252 ruft immer `Verlauf.zurueck()` — welche Fläche gemeint ist, entscheidet nur der Fokus. Eine gemeinsame Schicht muss beide zusammenführen oder die Weiche explizit machen.
- `Verlauf.start` patcht Store-Funktionen zur Laufzeit (verlauf.ts:100-108). Wer `Store.addBlock` an eine gemeinsame Schicht weiterreicht oder die Ladereihenfolge ändert (index.html:579 indexdb vor 633 verlauf), verliert den Hook still.
- Das Register wird EINMAL beim Laden geholt (`const TYPEN = Register.bloecke.alle()`, editor.ts:41; bloecke.ts:267-271 gibt bewusst dieselbe Liste) und danach mutiert (`TYPEN.push` der Einbettdienste, editor.ts:93-96). Ein Register-Ersatz, der Kopien liefert, macht später gemeldete Arten unsichtbar.
- Feldnamen sind Daten: `created/edited/erstelltVon/alive/parentTable/content` (block.ts:9-24). Eine gemeinsame Block-Schicht mit englischen Feldern wäre eine Datenmigration, nicht ein Umbau.
- Zwei Tabs: `updateBlock` schreibt `edited` und `save` an jeder Stelle; `rohSetzen` (indexdb.ts:958-967) ist der Weg des Abgleichs ohne Stempel. Eine gemeinsame Schicht, die alles über `updateBlock` schickt, füttert den Abgleich mit sich selbst (Kommentar Z.949-952).
- Unbekannte Blocktypen werden als Textfeld gezeichnet (render default, editor.ts:985) und bleiben erhalten (§18). Eine typisierte Union der Blockarten in einer gemeinsamen Schicht würde das brechen — Column-Typ bleibt deshalb `string` (§52.9).
- 523 Querverweise (E626): der Editor fasst 7 fremde Namen an, vier Bereiche fassen `Blocks` an (bereiche-bestand.json). Jede neue gemeinsame Schicht, die aus einem Bereich heraus gerufen wird statt aus kern/, macht test537 rot.

## Kleinster nächster Schritt (Vorschlag des Lesers)

Einen Prüflauf schreiben, der misst, ob Blockkennungen ein `Verlauf.zurueck()` überleben (heute: nein, test70.mts:351-352), und ihn rot sehen. Dann `baumEinfuegen` um einen Schalter „Kennungen behalten“ erweitern (indexdb.ts:2508: `delete patch.id` nur, wenn die Kennung noch lebt) und `Verlauf.anwenden` (verlauf.ts:57-62) damit rufen — genau der Weg, den E174 für den Markdown-Rundlauf schon gegangen ist. Keine neue Schicht, keine Feldumbenennung, eine Datei plus ein Wächter; Nachbarstellen prüfen: dupliziere (editor.ts:2223) und Alt-Drop (Z.2033) wollen weiterhin FRISCHE Kennungen.
