# Amdion-Übernahme — der Plan des Premium-Umbaus

Beschlossen am 29. August 2026 (E258). Redur: „schaue mal die amdion repo
und ich genau so haben — kannst du alles im redion nehmen."

Amdion (github.com/Redurbabat/Amdion, Branch codex-premium-foundation)
ist Redurs eigener Prototyp für den grossen Premium-Umbau. Dieser Plan
stammt aus fünf vollständigen Lesungen der Amdion-Quelle mit Abgleich
gegen Redions Bestand. Er wird Phase für Phase abgearbeitet; jede Phase
bekommt ihren eigenen E-Eintrag, ihre Prüfläufe und ihre Bilder.

Der wichtigste Satz: übernommen wird die GESTALT, niemals Bestände oder
Datenlayouts — Amdion ist funktional fast überall eine Teilmenge Redions.

---

# ÜBERNAHMEPLAN: Amdion → Redion

## 1. Die Vorlage in einem Absatz

Amdion (`/home/user/amdion`) ist Redurs eigener Premium-Prototyp: reines TypeScript ohne Framework, local-first auf einer IndexedDB, deren Fächer und Blockfelder bewusst Redion-kompatibel benannt sind (`src/core/store.ts:6`, `src/core/types.ts:4–26`). Funktional ist Amdion fast überall eine Teilmenge Redions — Rechner, Aufgaben, Fachzeichen, Schaltplan, Ink, SM-2, PDF und Backup sind in Redion in jeder Hinsicht weiter, und Amdions eigene Doku verweist dafür ausdrücklich auf den Redion-Kern (`doku/PREMIUM-FOUNDATION.md:41–51`). Der Wert von Amdion liegt in der **Gestalt**: eine kühle, violette Token-Sprache mit Glas, ein ruhiges 3-Ebenen-Layout (App-Leiste mit echt zentrierter Suche, Ikonenschiene, Kontextspalte, Karten-Anatomien wie Stat-Karten, Listenzeilen, Leerzustände mit Aktion), ein globales „＋ Neu"-Popover, klickbare Kennzahlen und eine Handvoll ehrlicher Mikro-Details (Intervall-Untertitel auf Bewertungsknöpfen, Typ-Etiketten in der Palette, Übung-wird-Lernkarte). **„Genau so haben" heisst deshalb: Redion soll so aussehen und sich so anfühlen wie Amdion — nicht: Amdions Code oder Datenlayout verpflanzen.** Die Übernahme ist Designsprache plus wenige additive Abläufe, eingebaut in Redions Architektur (Register als Wahrheit §8, Knopf-Budgets E223/test40/245/248, keine Datenmigration nebenbei §9/§53.3).

---

## 2. Phasen

### Phase 1 — Designsprache und Shell-Look (Token, App-Leisten-Optik, Ikonenschiene, Karten)

**Ziel:** Redion trägt Amdions Gesicht, auf Redions geeichten Token. Alles Weitere steht darauf.

**Betroffene Redion-Dateien:** `quell/schale/stil/marken.css`, `dunkel.css`, `hell.css`, `grund.css`, `aufbau.css`, `bausteine.css`, `werkzeuge.css`, `lernwelt.css`, `arbeitswelt.css`, `datenbanken.css`; Ladereihenfolge `index.html:52–55`.

**Von Amdion übernommen:**

1. *Vorarbeit:* Doppeldefinition der Bewegungs-Token in `marken.css:44–51` (E43) gegen `grund.css:63–67` (E198) bereinigen — grund.css gewinnt heute nur durch Ladereihenfolge. Erst dann Stilarbeit.
2. *Token-Abgleich statt Token-Import:* Amdions Palette (`part1.css:1–21`) wird auf Redions vorhandene Token abgebildet (`--bg/--bg-side/--bg-card/--bg-hover/--bg-press/--bg-schwebend`, `--text/--text-dim/--text-faint`, `--line/--line-stark`, Status-Token — Abgleichstabelle im Design-Bericht, B.1/B.2). Der Akzent bleibt `#6d4aff`/`#9b87ff` — Amdions `#7c5cff` ist von Redion gemessen und verworfen (`dunkel.css:56–63`, E199); der Look entsteht identisch. Amdions sechs Flieder-Hardcodes (`part1.css:52`, `part2.css:45`, `learning.css:1`, `practice.css:1`, `part4.css:1`) werden bei jeder Formübernahme durch `--accent-text` ersetzt.
3. *Neu als Token:* `--paper`, `--paper-ink`, `--grid` für die Schaltplan-/Planfläche (`part1.css:14, 20`) — Papier bleibt themenunabhängig papierfarben.
4. *Die eine grosse Entscheidung — Hellmodus-Inversion:* Amdion = grauer Grund + weisse Karten (`part1.css:16–21`), Redion = weisser Grund + graue Karten (`hell.css:15–17`). Das ist der prägendste Unterschied des Hell-Looks. Da „genau so" der Auftrag ist: übernehmen — aber nur als eigener E-Eintrag in ENTSCHEIDUNGEN.md, mit vollständiger Neu-Messung aller Kontraste (E230, test127) und Bild-Abnahme durch Redur. Fällt die Abnahme durch, bleibt Redions Hell-Fassung; der Rest der Phase hängt nicht daran.
5. *Anatomien global machen* (Formen aus Amdion, Werte aus Redion):
   - Stat-Karte (`part2.css:11–16`) — aus `.lw-metrik` (`lernwelt.css:440–455`, tabular-nums und E230-Farben behalten) als Schalen-Baustein herauslösen; Aufbau small-Etikett / grosse Zahl / Bedeutungszeile mit `margin-top:auto`. Etiketten in `--text-dim`, nicht `--muted`-Äquivalent (E230-Falle, die Amdion begeht).
   - Generische Listenzeile mit 34–38-px-Zeichenkachel + zweizeiligem Text + rechtem Meta (`part2.css:23–35`).
   - EIN Kicker-Baustein statt vier lokaler Fassungen (`part1.css:62` als Form; Redions Werte: ≥10 px, `--accent-text` bzw. `--text-dim` — Amdions 9 px/`--muted` fällt unter die E230-Messlatte).
   - EIN Chip-Baustein (Form `practice.css:1`; zusammenführen mit `datenbanken.css:37–43`, `bausteine.css:1132–1136, 1172–1175`).
   - Segment-Schalter (`part3.css:25–27`), Zähl-Pille im Panelkopf (`part2.css:22`), Leerzustand mit Zeichenkachel (`part2.css:36–40`), Akzent-Verlaufskarten per `color-mix` (`part2.css:86`, `learning.css:10, 24`).
   - Bewegung: Karten-Hub `translateY(-1px)` (`part2.css:44, 49`) und Ansichts-Einblendung `viewIn` (`part1.css:94–95`), beide über Redions `--motion-*`/`--ease` (grund.css:63–67) und unter der Reduced-Motion-Nullung (grund.css:90–103).
   - Druckpunkt: nichts zu tun — `scale(.976)` ist wertgleich vorhanden (`part1.css:41` = `grund.css:213–227`); Amdion-Knopflisten auf `.rb` abbilden, keine neuen Klassen.
   - Haupt-Knopf-Verlauf + Glühen (`part1.css:44`): als Ausprägung von `.rb.haupt` (`grund.css:256–259`) innerhalb des E201-Systems, nicht daneben — kleiner E-Eintrag.
   - Tab-Optik „klinkt in die Fläche ein" (`part1.css:84–88`) auf `#reiterleiste`/`.rt-tab` (`bausteine.css:2720–2735`) — nur Radius/Kennzeichnung, kein Verhalten.
   - Fokusring-Verfeinerung `color-mix(accent, white)` (`part1.css:27`) — optional.
6. *Shell-Look ohne vierte Leiste:* Glas-Optik (`--glas-blur` ist vorhanden, grund.css:81–82), echte Fenster-Zentrierung der Suche per 3-Spalten-Grid (`part1.css:30`) auf Redions bestehende Kopfzeile mit `#btn-suche-mitte` (`index.html:313–327`) übertragen; Seitenleiste bekommt am Schmal-Umbruch die Ikonenschienen-Anmutung (`part3.css:85` als Vorbild). Es entsteht **keine** neue Leiste und **kein** neuer Knopf.

**Konflikte und Auflösung:** Keine Knopf-Budgets betroffen, solange Phase 1 knopffrei bleibt (das ist die Vorgabe). Hell-Inversion = dokumentierte Entscheidung + test127-Neumessung. Nicht übernehmen (dokumentieren warum): Inter + 14 px Grundgrösse (erste Laufzeit-Fremdressource bzw. Lesbarkeitsrückschritt — Redions Systemstapel/16 px bleiben, `marken.css:13`, `grund.css:126`), Einheitsschatten `--shadow` (Redions Schattenleiter E204 bleibt, Amdions Ad-hoc-Schatten auf die Sprossen legen), neue Radien-Zwischenwerte (E198: 9→`--radius-md`, 22→`--radius-2xl`).

**Prüfplan:** `node bilder.mjs` (alle Ansichten, Rechner und Handy) und Bilder im Gespräch zeigen (§55.3); test127/Kontrastmessung in Hell und Dunkel; der volle Lauf `node pruefungen/volllauf.mts` (CLAUDE.md §30 — hier stand bis zum 11. Oktober 2026 `npm run pruefen -- --schnell`, das zuletzt alles ausser test73 fuhr; seit E745 ist das der schnelle Lauf ohne Browser und deckt eine Gestaltungsphase nicht ab); `node bauen.mts` und Grösse der Einzeldatei vorher/nachher notieren (§29); Reduced-Motion-Probe.

---

### Phase 2 — Quick Create „＋ Neu" und Paletten-Feinschliff

**Ziel:** Ein Ort zum Anlegen der wichtigsten Objektarten; die Palette bekommt Amdions Zeilensprache, behält Redions Suchintelligenz.

**Betroffene Redion-Dateien:** `src/register/befehle.ts`, `src/register/bloecke.ts`, `src/schale/aufbau/seitenleiste.ts` (`:888` „Neue Seite"), `src/bereiche/wissen/werkzeuge.ts:310–390`, `aufbau.css:238–259`, `quell/schale/ueberlagerung/fokus.js` (Dialoge).

**Von Amdion übernommen:** Das Quick-Create-Popover mit Seite/Aufgabe/Lernkarte/Schaltplan/PDF an einer Stelle (`index.html:77–83`, `app.ts:338–340`, Tab-Plus `app.ts:63`) — aber registergespeist (§8: kein zweiter Katalog; Einträge kommen aus `register/befehle`/`register/bloecke`), und ohne `prompt()` (Redion-Überlagerungen stattdessen). Palettenzeilen mit Zeichenspalte und Typ-Etikett sowie das Mischen von Befehlen + Treffern aller Blocktypen in einer Fläche (`app.ts:345`); Optik der Command-Box (`part3.css:50–60`: `--line-stark`-Rand, Radius 16, Eintritts-Übergang, 30-px-Zeichenspalte) auf Redions `.finder` (`aufbau.css:249–259`). Redions Fuzzy-Suche und Häufigkeitsgedächtnis (`werkzeuge.ts:300–305, 365–371`) bleiben unangetastet.

**Konflikte und Auflösung:** test40.mts:252–253 nennt die Kopfzeilen-Sechs exakt; test248.mts:169–172/205–207 deckelt Leiste ≤ 10, Kopf ≤ 8, gesamt ≤ 22. Bevorzugte Auflösung: den **bestehenden** `#btn-new` der Seitenleiste zum Quick-Create-Popover ausbauen — kein neuer Knopf, kein Wächter-Konflikt. Nur falls Redur den Knopf in der Kopfzeile will: siebter Kopfzeilen-Knopf als bewusste, dokumentierte Entscheidung (E-Eintrag) mit gleichzeitiger Anpassung von test40/test248 im selben PR — nie stillschweigend.

**Prüfplan:** test40, test245, test248; Palette: Esc/Pfeile/Enter, Gedächtnis bleibt wirksam; `node bilder.mjs`; Einzeldatei neu bauen.

---

### Phase 3 — Heute- und Lernwelt-Mikrodetails

**Ziel:** Amdions ehrliche Kleinigkeiten in Redions bereits reicheres Dashboard.

**Betroffene Redion-Dateien:** `src/bereiche/wissen/lernwelt.ts` (`:1113–1115` Kennzahl, `:1301–1450` Heute, `:2190–2205` Trainer), `quell/bereiche/wissen/dienst.js:102–160`.

**Von Amdion übernommen:** (a) Klickbare Kennzahl-Kacheln — Redions `kennzahl` ist ein totes `<article>`, Amdions Stat-Cards navigieren per `data-action` (`app.ts:151–153`). (b) Leerzustände tragen direkt einen Anlege-Knopf (`app.ts:177–179`). (c) Intervall-Untertitel auf den vier Bewertungsknöpfen der Tagesrunde (`premium-extension.ts:69`) — Redion zeigt dabei die **echten** SM-2-Intervalle aus `WissenDienst.planen` statt Amdions Näherungen; „Gut" bleibt hervorgehoben (ist mit `is-primary` schon so, `lernwelt.ts:2200`).

**Konflikte und Auflösung:** E223 betrifft Leisten-Budgets; Kennzahlen und Empty-State-Knöpfe sind Inhalts-UI — trotzdem test245/test248 laufen lassen und bei Zählertreffern per E-Eintrag entscheiden. Bewertungen bleiben Zahlen 1–4 im Protokoll (`dienst.js:146–149`), niemals Amdions Strings. Der Lernalgorithmus wird **nicht** angefasst („`WissenDienst.planen` bleibt SM-2", `learning.js:1–10`).

**Prüfplan:** Anzeige-Intervalle gegen `dienst.js`-Berechnung testen; Klickziele der Kennzahlen; `node bilder.mjs heute` + Handy; bestehende Lernwelt-Prüfungen.

---### Phase 4 — Kontextspalte, registergetrieben

**Ziel:** Amdions zweite, bereichsabhängige Spalte mit zweizeiligen `context-row`s (Titel + lebender Untertitel wie „3 Karten fällig") — als Modus von Redions Seitenleiste, nicht als neues Layoutsystem.

**Betroffene Redion-Dateien:** `src/schale/aufbau/seitenleiste.ts:20` (Modi), `src/register/navigation.ts` (neuer Kontextlieferant je Modul), `quell/schale/stil/` (context-row-Optik), `marken.css` (falls Desktop-Breiten-Token nötig, vgl. `part1.css:7`).

**Von Amdion übernommen:** Die Idee und die Optik (`part1.css:54, 75, 96–97`; Inhalte `app.ts:80–107`), unabhängiges Einklappen. **Nicht** übernommen wird Amdions Hartkodierung — `app.ts:80–87` kennt jeden Bereich beim Namen, das Gegenteil von Redions Muster („Diese Datei kennt keinen einzigen Knopf beim Namen", `menueband.ts:13–15`). Stattdessen meldet jedes Modul über `register/navigation` einen Kontextlieferanten an (§5/§8).

**Konflikte und Auflösung:** Platzkonkurrenz mit `#ai`-Panel und geteilter Ansicht (`Fenster`) — Regel festlegen: Kontextspalte weicht, wenn beide offen sind. Bestandsnutzer: Vorgabe **eingeklappt**, Zustand persistiert. Mobil (§37) keine vierte Fläche — Inhalt wandert in die bestehende Seitenleisten-Schublade. test248-Zählung prüfen; zählt der Wächter die context-rows mit, wird das Budget per E-Eintrag bewusst angepasst.

**Prüfplan:** `node bilder.mjs` Rechner und Handy; test40/245/248; Zusammenspiel mit Fokus-Modus (Strg+Shift+F, `werkzeuge.ts:193, 833–838`) und geteilter Ansicht; Einklapp-Persistenz über Neuladen.

---

### Phase 5 — Bereichs-Tabs und Aufgaben-Badge

**Ziel:** Tabs können auch Bereiche und Werkzeuge halten, nicht nur Seiten; die Aufgaben-Navigation zeigt einen Fällig-Zähler.

**Betroffene Redion-Dateien:** `src/schale/aufbau/reiter.ts` (`:40` `Reiter = { id }`, `:62` Persistenz, `:11–13` Kürzel, `:105–110` Strg+T), `index.html:154–171` (`#btn-tasks`), test46.

**Von Amdion übernommen:** Das typisierte Zustandsmodell als Vorlage — `ViewId = 'block:${ID}' | 'electro:…' | Bereich` und `TabState` mit `pinned`/`dirty` (`types.ts:59–79`) — als **Erweiterung von Redions `Fenster`**, nicht als Übernahme des `TabManager` (`tabs.ts:3–10`), der gegen Redions Fassung ein Rückschritt ist (keine Persistenz, keine Kürzel, kein Drag). Das Tab-Plus am Leistenende öffnet Quick Create (`app.ts:63`). Aufgaben-Badge (`index.html:38`, `app.ts:76–77`) an `#btn-tasks`.

**Konflikte und Auflösung:** Amdions Dedupe pro View (`tabs.ts:5`) widerspricht Redions Strg+T = Seite duplizieren (`reiter.ts:105–110`). Entscheidung in ENTSCHEIDUNGEN.md: Seiten behalten Redions Verhalten, Bereichs-/Werkzeug-Tabs werden dedupliziert (derselbe Bereich zweimal ergibt keinen Sinn). Das persistierte `reiter`-Meta-Format wird erweitert — alte Stände müssen tolerant gelesen werden, ein Downgrade darf Bereichs-Einträge nur ignorieren, nie den Bestand zerbrechen. Badge in der ruhigen Fassung (E218/E219/E223) gedämpft oder aus, per `data-ruhig`.

**Prüfplan:** test46 erweitern: Bereichs-Tab öffnen/schliessen/persistieren/Neuladen; Strg+T/W/Tab/1…9 unverändert; Badge-Zahl gegen Planen-Dienst; `node bilder.mjs`.

---

### Phase 6 — Kern-Additive: Fälligkeit und Erledigt-Zeitpunkt am Aufgabenblock

**Ziel:** Die zwei einzigen Datenmodell-Gewinne aus Amdion, additiv und ohne Migration.

**Betroffene Redion-Dateien:** `quell/bereiche/planen/dienst.js:186` (setzt heute stur `datum: null`), `quell/bereiche/wissen/lebensbereiche.js:656` (liest schon tolerant `block.faellig || block.due || block.datum`), Todo-Toggle im Editor/Blockbereich, `src/core/types/block.ts`, ENTSCHEIDUNGEN.md.

**Von Amdion übernommen:** (a) Ein kanonisches Fälligkeitsfeld am `todo`-Block (`workspace.ts:28`, `types.ts:21–25`) — fällige Blockaufgaben erscheinen damit echt in der Heute-Ansicht. Feldname wird **einmal vorher** entschieden und in ENTSCHEIDUNGEN.md festgehalten; Empfehlung: `faellig` (passt zu den gespeicherten deutschen Feldern wie `erledigtAm` und steht im toleranten Leser an erster Stelle). (b) Ein Schreiber für `erledigtAm`: Redion **liest** das Feld im Wochenrückblick (`dienst.js:186–187`), aber nichts in `quell/` oder `src/` setzt es je — Amdions `toggleTask` (`workspace.ts:31–34`) schliesst genau diese Lücke, mit dem bereits vorhandenen Feldnamen.

**Konflikte und Auflösung:** §9 erlaubt additive optionale Felder; verifizieren, dass .json- und .redion-Sicherung die Felder mitnehmen (Blöcke werden vollständig serialisiert) und dass Importe alter Sicherungen ohne diese Felder sauber laufen. Kein `props`-/`data`-Sack-Umbau, keine weiteren Amdion-Felder.

**Prüfplan:** §13-Ritual: exportieren, alles löschen, importieren, Byte-Vergleich inklusive neuer Felder (.json und .redion); Heute-Ansicht zeigt fällige Blockaufgaben; Wochenrückblick nutzt `erledigtAm`; Import einer Alt-Sicherung bricht nicht.

---

### Phase 7 — Elektro-Brücke: Übung → Lernkarte, Serie

**Ziel:** Der eine wirklich übernehmenswerte Fach-Ablauf aus Amdion: eine falsch beantwortete Elektro-Aufgabe wandert als Karteikarte in den Karteikasten.

**Betroffene Redion-Dateien:** `src/bereiche/elektro/arbeitsplatz.ts:195–204` (Auflösung in `aufgabeHtml`) und `:410–520` (Prüfungs-Auswertung), `src/bereiche/elektro/aufgaben.ts:98–137` (`weg`, `art`, `saat`), `src/bereiche/wissen/werkzeuge.ts:150–153` (flashcard-Anlage), `src/bereiche/editor/ansicht/editor.ts:3047` (Format `frage :: antwort`).

**Von Amdion übernommen:** Der Knopf „Als Lernkarte speichern" (`practice-extension.ts:24, 33` → `workspace.ts:37`) — mit drei Verbesserungen gegenüber dem Vorbild: nur bei **Fehlern** anbieten (Amdion zeigt ihn entgegen dem eigenen Attributnamen `data-error-card` immer); `art` + `saat` mitführen, damit die Aufgabe reproduzierbar bleibt (Ablageform im E-Eintrag festhalten); Redions `weg` als Antwortteil nutzen (reicher als Amdions einzeiliges `solution`). Zusätzlich in der Prüfungs-Auswertung: „alle falsch beantworteten als Karten übernehmen". Dazu optional Serie/Bestwert (`streak`/`bestStreak`, `practice-extension.ts:6, 12–13`) in den bestehenden `elektro:uebungsstand` (`arbeitsplatz.ts:71`).

**Konflikte und Auflösung:** E223-Knopf-Budget — ein Knopf, nur im beantworteten Fehler-Zustand (Inhalts-UI); test245/248 trotzdem laufen lassen. Karten entstehen im **Redion-Format** (`frage :: antwort`, Lernstand in `block.sr` über die Lernwelt) — niemals Amdions `data`-Layout. Bewertungen bleiben 1–4.

**Prüfplan:** Aufgabe falsch beantworten → flashcard-Block entsteht, taucht fällig in der Lernwelt auf (die Fehlerkarten bevorzugt, `lernwelt.ts:837`); SM-2 unverändert; Serie zählt korrekt über Sitzungen; `node bilder.mjs`.

---

### Phase 8 — PDF-Vollbild-Arbeitsmodus als Zuschnitt

**Ziel:** Redions Dokumentmodus (E126) bekommt Amdions ruhigen Vollbild-Schnitt.

**Betroffene Redion-Dateien:** `src/bereiche/pdf/document-mode.ts:1–29`, `src/bereiche/pdf/seite.ts`, Stil.

**Von Amdion übernommen:** Nur der Zuschnitt (`pdf-extension.ts:83–96`): Vollbild-Overlay mit Glas-Topbar — Titel · Dateigrösse · „lokal" · „Original"-Download · „Fertig" — und das Abfangen des Block-Klicks direkt in diesen Modus (`:151–153`). Die Technik bleibt Redions: `pdfseite`-Blöcke mit seitentreuen SVG-Marken (E103/E107, `seite.ts:7–17`), Ink aus `marken.ts`.

**Konflikte und Auflösung:** keine Wächter betroffen; Esc/Undo-Kürzel dürfen bestehende Belegungen nicht brechen. Keine Farben aus `pdf.css` (fährt an den Token vorbei, `pdf.css:4–9`).

**Prüfplan:** PDF-Prüfungen; Marken bleiben beim Scrollen seitentreu (genau der Amdion-Mangel, `doku/PDF-INK-PASS.md:40–41`, darf nicht einwandern); Handy-Bild; Einzeldatei-Grösse.

---

## 3. Was NICHT übernommen wird — und warum

**Schon besser in Redion (Amdion ist Teilmenge oder Rückschritt):**
- `TabManager` (`tabs.ts:3–10`) — Redions `Fenster` persistiert, hat Kürzel, Drag, geteilte Ansicht (`reiter.ts:24–93`, test46). Nur das Typmodell dient als Vorlage (Phase 5).
- Amdions Palette (5 hartkodierte Befehle, wörtliche Substring-Suche, `app.ts:343–345`) — Redions ist registergespeist mit Fuzzy und Gedächtnis (`werkzeuge.ts:300–390`).
- `scheduleReview` (`learning.ts:40–73`) — vereinfachtes SM-2-Derivat ohne Wiederlernschritt und Protokoll; ein Tausch verschöbe still die Termine aller Karten. Redions `WissenDienst.planen` (`dienst.js:102–160`) bleibt.
- Alle acht Rechner (`calculators.ts`) — enthalten in Redions 183 Formeln (`elektroformeln.ts`, inkl. Spannungsteiler Z. 535, Spannungsfall sogar für Drehstrom Z. 2969).
- Aufgabenmodell (`exercises.ts:73–77`, stummer Absolutvergleich, nur gleiche Parallelwiderstände) — Redion: 16 Arten, Prozent-Toleranz, Zehnerpotenz-Diagnose, Prüfungsmodus (`aufgaben.ts:1757–1813`, `arbeitsplatz.ts:410–520`).
- Fachzeichen (`symbols.ts`: 30 Text-Glyphen) — Redion: 106 SVG-Zeichen mit Anschlusskoordinaten (`fachzeichen.ts`).
- Schaltplan (`types.ts:81–102`: ungeführte Knoten-Linien, keine Ebenen, kein Undo) — Redion: 11 Planarten, geführte Leitungen, Ebenen, MNA-Simulation (`schaltplan.ts`, `planflaeche.ts`, `simulation.ts`).
- Ink V2 (`pdf-extension.ts`) — echte Teilmenge von Redions `marken.ts` (mehr Werkzeuge, Druckverarbeitung E125, HISTORY 100).
- Chunked-Speicher (`store.ts:204–243`) — Redions `ablage.js`/`ablage.ts` ist reifer (1-MB-Stücke, `DATEI_MAX`, Upload-Zustand, Index-Zugriff).
- Mobile Bottombar (`part4.css:1`), Fokus-Knopf, Theme-Toggle, Heute-Grundgerüst, Notbetrieb — alles in Redion vorhanden und ausgereifter (E236, `werkzeuge.ts:836–838`, `lernwelt.ts:1301–1450`, `indexdb.ts:255–296`).

**Wäre eine Datenmigration (§9, §53.3 — Feldnamen sind Daten):**
- Karteikarten-Layout `data.{answer, due, interval, ease, …}` — verwaiste jede bestehende Karte und jede .redion-Sicherung; Redions `frage :: antwort` + `block.sr` bleibt.
- Datei-Feldnamen `size/type/chunks/chunkSize` + Stück-Feld `index` (`types.ts:104–120`) gegen `groesse/typ/teile/…` + `nr` — Migration von `dateien` UND `stuecke`, plus Verlust des Upload-Zustands.
- Blockart `schematic` mit `data`-Dokument gegen `schaltplan` mit `block.plan` — bricht jeden gespeicherten Plan; obendrein funktional ärmer.
- Bewertungs-Strings `'again'…'easy'` — Redions `reviewVerlauf` speichert 1–4 (`dienst.js:146–149`).
- Amdions Export `'amdion-redion-compatible'` (`store.ts:245–290`) — trotz Namens nicht kompatibel: keine `dateien/stuecke/versions`, kein `enthaelt/fehlt/hinweis`-Manifest (§52.10); Import wäre der verbotene halbe Zustand (§13).

**Widerspricht Redions Regeln oder Qualität:**
- ESM-Startpfad `type="module"` (`index.html:88–91`) — bricht den Doppelklick-Start (§6, §54.2; Redion `index.html:408–410`).
- Voll-Rerender per `innerHTML` bei jedem Klick (`renderAll`) — §36; nur die Optik wandert, nie die Render-Strategie.
- `prompt()`-Dialoge (`app.ts:271, 338`), `getAll()`-Dateizugriff (`store.ts:223–236`, §10), iframe-PDF-Viewer (kein Seitenbezug der Marken), Undo/Redo-Attrappen (`index.html:61–62`, ohne Handler).
- Vierte App-Leiste — Konto/Glocke sind per E251 im Menüband entschieden, die zentrierte Suche ist schon in der Kopfzeile; eine neue Leiste sprengt test248.
- `#7c5cff` (E199 gemessen und verworfen), Inter + 14 px, Einheitsschatten statt E204-Leiter, 9-px-Kicker in `--muted` (E230), `pdf.css`-Eigenpaletten, neue Radien-Zwischenwerte (E198).

---

## 4. Risiken

1. **Einzeldatei-Grösse (§29):** Phase 1 fügt spürbar CSS hinzu. Nach jeder Phase `node bauen.mts` laufen lassen und die Grösse von `redion-einzeldatei.html` protokollieren; wächst sie sprunghaft, zuerst tote Stile abbauen statt weiterbauen.
2. **Mobile (§37):** Ikonenschienen-Look und Kontextspalte dürfen kleine Schirme nicht verstopfen — Kontextspalte mobil nur als Schubladen-Inhalt, Touchflächen ≥ 44 px, Amdions Bottombar wird nicht übernommen (Redions E236-Fassung ist reifer). Amdion selbst hatte am Telefon die halbe Werkzeugleiste ausserhalb des Bildes (§55.1) — deshalb nach jeder Phase `node bilder.mjs … handy`.
3. **Barrierefreiheit (§38):** Die Hell-Inversion erzwingt eine komplette Kontrast-Neumessung (E230, test127) — sie ist die teuerste Einzelentscheidung des Plans. Kicker ≥ 10 px in `--text-dim`/`--accent-text`; Ikonenschiene ohne Labels braucht `aria-label`; `viewIn`/Hover-Hub unter Reduced Motion nullen; Fokusring auf allen neuen Bedienflächen.
4. **Bestandsnutzer-Gewohnheit:** Hell-Inversion ändert das Gesicht der App, Kontextspalte und Bereichs-Tabs ändern Griffe. Gegenmittel: Kontextspalte per Vorgabe eingeklappt, ruhige Fassung (`data-ruhig`) respektiert jede neue Fläche, Strg+T-Verhalten für Seiten bleibt, `reiter`-Meta tolerant erweitern, jede sichtbare Änderung als Bild im Gespräch abnehmen lassen (§55.3).
5. **Wächter-Erosion:** test40/test245/test248 sind der Schutz der ruhigen Fassung (E223). Jede Budget-Anpassung nur als eigener E-Eintrag im selben PR wie die Test-Änderung — nie „der Test störte". Ein Wächter, der still mitwächst, ist keiner (§55.2 sinngemäss: eine Prüfung, die nicht rot werden kann, ist keine).
6. **Vermischungsgefahr:** Amdions Fächer- und Feldnamen sehen kompatibel aus (`store.ts:6`) — das verführt zu „dann kann man ja auch Daten übernehmen". Kann man nicht (4-MiB- vs. 1-MB-Stücke, fehlende Zustandsfelder, `data`-Karten). Der Plan übernimmt Gestalt, niemals Bestände; ein Amdion-JSON-Import in Redion bleibt ausdrücklich verboten, bis es einen dokumentierten Migrationspfad gäbe.
