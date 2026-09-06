# Redion UI-Komponenten — Bestandsaufnahme und Plan

**Stand: 6. September 2026, vierter Durchgang (Phase B gebaut, E441; Nr. 28 gebaut, E458).** Seit dem ersten Durchgang liegt
der Uiverse-Code vor (Handoff-Paket, 50 Einträge, 20 mit Original) und die
Studio-Schale ist auf dem Zweig (E440). Die Tabelle unten ist die verbindliche;
die Karte darunter ist vom ersten Durchgang und bleibt als Begründung stehen.

## Die Tabelle (Auftrag §20)

Quelle-Status sagt, ob der Originalcode vorliegt und wie sicher; Redion-Status
sagt, was daraus wird; „Gebaut" sagt, ob die produktive Fassung schon steht.

| Nr | Komponente | Autor | Quelle-Status | Redion-Status | Produktiver Ort | Gebaut | Bemerkung |
|---|---|---|---|---|---|---|---|
| 01 | Sparkle Generate Site | JkHuger | `chat-original` | RESERVE | — | noch nicht | Sparkle "Generate Site" ist als eigener Knopf ausgeschieden (Auftrag §5). |
| 02 | Apply Now Button | satyamchaudharydev | `uiverse-galaxy-verifiziert` | PRODUKTIV (angepasst) | Redion-Knopfsystem, Weiter/Öffnen/Anwenden | E441 `.btn.weiter` | Pfeil gleitet bei hover/focus-visible, Schimmer nur unter der Maus, still bei reduced motion; kein eigener Knopftyp. Eingesetzt: Rundgang „Weiter", Elektro-Prüfung „Weiter", vier „Öffnen" in den Verbindungen (§4.5). test427 §4. |
| 03 | Download → Open State Button | nazar-gavrylyk | `nicht-verifiziert` | PRODUKTIV (angepasst) | PDF-Export, Sicherung, Lernpaket | E441 Zustandsknopf `art=laden` | Herunterladen → Wird erstellt … → Heruntergeladen; die HTML-Einzeldatei weiter bis „Öffnen" (echtes Fenster). `.redion`/`.json` enden bei Heruntergeladen — der Browser kann sie nicht zeigen. Zustand aus der Promise, nie aus einem Timer (§4.16). test427 §2, §5. Offen: der Sicherungsknopf des Start-Bildschirms (E57). |
| 04 | Sun/Moon Theme Switch | RiccardoRapelli | `nicht-verifiziert` | RESERVE | — | noch nicht | Als Haupt-Themensteuerung ausgeschieden; Redion hat acht Schemata und den Studio-Schnellschalter (§5, §12). |
| 05 | AI Prompt Composer | Cobp | `nur-identifiziert` | ERSETZT | src/bereiche/ki — bestehender Composer in index.html | vorhanden | Redion hat den Composer bereits (Anhang, Eingabe, Senden, Quick-Actions). Nichts zweitbauen (§4.8, §12). |
| 06 | Liquid Loader | ShaikhWahid99 | `nicht-verifiziert` | PRODUKTIV (angepasst) | längere unbestimmte Verarbeitung | noch nicht | Das Handoff nannte den Eintrag "uiverse-seite-verifiziert", lieferte aber keinen Code — nur die Notiz. Ohne Datei ist der Status nicht haltbar (Auftrag §0.10); test426 fand den Widerspruch. Nur für Vorgänge über einer Sekunde (§4.20). |
| 07 | File Explorer Folder Button | simontheonlyone | `uiverse-galaxy-verifiziert` | PRODUKTIV (Effekt adaptiert) | Bestehende Ordnerdeckel der Bibliothek | Motion-Pass 06.09. | Papier hebt sich beim Überfahren; kurzer Druckzustand und Tastaturfokus. Keine zusätzliche Explorer-Funktion, kein Bounce, keine Bewegung bei reduced motion. |
| 08 | Logout Button | vinodjangid07 | `uiverse-galaxy-verifiziert` | PRODUKTIV (angepasst) | Einstellungen → Konto → Abmelden | noch nicht | Nur dort (§4.30). |
| 09 | Animated Gesture Hand | Pradeepsaranbishnoi | `nicht-verifiziert` | PRODUKTIV (angepasst) | Onboarding/Rundgang (Lasso, Ziehen, Zeichnen) | noch nicht | Wenige Wiederholungen, dann Stopp (§4.28). |
| 10 | Glow / Shimmer Button | mrhyddenn | `nur-identifiziert` | RESERVE | — | noch nicht | Glow/Shimmer als eigener Knopf ausgeschieden (§5). |
| 11 | Server / Data SVG | Juanes200122 | `chat-original` | PRODUKTIV (angepasst) | Verbinden / Wolke / Abgleich | noch nicht | Zustände offline·bereit·synchronisiert·läuft·fehler; nur bei echtem Abgleich animieren; SVG-IDs prüfen (§4.18). |
| 12 | Runner / Character Loader | anand_4957 | `nicht-verifiziert` | RESERVE | — | noch nicht | Runner Loader ausgeschieden (§5). |
| 13 | Holographic Toggle | reglobby | `nicht-verifiziert` | BEDINGT | nur ein echter Sondermodus (Simulation, Prüfmodus) | noch nicht | Keinen Modus erfinden, damit der Schalter etwas zu schalten hat (§4.14). |
| 14 | Minimal Text Input | Praashoo7 | `uiverse-galaxy-verifiziert` | PRODUKTIV (angepasst) | Umbenennen, Konto, einfache Felder | noch nicht | Formular-Basis, nicht 1:1; an Redions Eingabefelder anpassen (§4.31). |
| 15 | Aurora / Gradient Start Button | dexter-st | `nicht-verifiziert` | PRODUKTIV (angepasst) | Lernen/Prüfung/Simulation starten | noch nicht | Nur grosse Startaktionen (§4.25). |
| 16 | Folder-Card Mini File Browser | byllzz | `nicht-verifiziert` | PRODUKTIV (angepasst) | Bibliothek / Dokumente (grosser Datei-Browser) | noch nicht | Kein Demo-Dateisystem; echte Ablage (§4.2). |
| 17 | Glass Radio / Segmented Control | chase2k25 | `nicht-verifiziert` | ERSETZT | src/schale/bedienung/segment.ts (E439) | E439 `segment.ts` | Der Umschalter ist in Redion-Bauart gebaut, mit Radiogruppen-Semantik und Tastatur; das Original war nicht verifiziert (§4.4). |
| 18 | Geometric Triangle / Mask Loader | andrew-manzyk | `nicht-verifiziert` | RESERVE | — | noch nicht | Geometric Triangle Loader ausgeschieden (§5). |
| 19 | 10-Segment Spinner | PriyanshuGupta28 | `uiverse-galaxy-verifiziert` | PRODUKTIV (angepasst) | Zustand.pille und Zustandsknopf, nur während echter Arbeit | Motion-Pass 06.09. | Auf erneuten Nutzerwunsch nach Paket-Animationen: ersetzt dort den bisherigen rotierenden Halbkreis, nicht Skeletons oder sofort verfügbare Inhalte. Zehn Segmente, currentColor, ohne SVG-IDs. test429 und test427 grün. Andere ältere Ladeanzeigen sind noch nicht vereinheitlicht. |
| 20 | Compact Menu Home/Files/Plans/Settings | mymiato / mymiamo | `nicht-verifiziert` | RESERVE | — | noch nicht | Home/Files/Plans/Settings-Menü ausgeschieden; Studio hat die groben Wege (§5). |
| 21 | 3D Rotating / Fanned Card Carousel | ilkhoeri | `nicht-verifiziert` | PRODUKTIV (angepasst) | Vorlagen, Lernsets, Heft-Deckel | noch nicht | Kein Autoplay; Maus/Touch/Tastatur; reduced-motion (§4.27). |
| 22 | 4-Circle Loader | AbanoubMagdy1 | `uiverse-galaxy-verifiziert` | RESERVE | — | noch nicht | 4-Circle Loader ausgeschieden (§5). |
| 23 | Jimu Primary Loading | Donewenfu | `uiverse-galaxy-verifiziert` | RESERVE | — | noch nicht | Jimu Loader ausgeschieden (§5). |
| 24 | Glass Fanned Action Cards | codebykay101 | `uiverse-galaxy-verifiziert-struktur` | PRODUKTIV (angepasst) | Lernwelt (Lernen·Üben·Prüfen), Elektro, KI | noch nicht | Echte Knöpfe, deutsche Texte; drei lange Icon-Pfade im Handoff gekürzt (§4.26). |
| 25 | Sparkle KI Toggle | MuhammadHasann | `nicht-verifiziert` | BEDINGT | nur wenn ein echter Zustand "KI-Unterstützung an/aus" existiert | noch nicht | Sonst Reserve; Partikel reduzieren (§4.12). |
| 26 | Generate → Generating Sparkle Button | dexter-st | `nicht-verifiziert` | PRODUKTIV (angepasst) | KI-Aktionen: Karteikarten, Fragen, Zusammenfassung | noch nicht | bereit → arbeitet → fertig → fehler; Mehrfachauslösung sperren (§4.9). |
| 27 | Radial / Horizontal Plus Quick Menu | risabbir | `nicht-verifiziert` | PRODUKTIV (angepasst) | kontextuelle Schnellaktionen (Einfügen, KI, Block) | noch nicht | NICHT als zweiter Studio-Plusknopf; Klick öffnet, Escape/Aussenklick schliesst (§4.6). |
| 28 | Printer Process Card | spotift_5948 | `chat-original-snippet` (nur CSS) | PRODUKTIV (angepasst) | `wissen/werkzeuge.ts` `drucken()` — die Drucker-Karte | E458 `Drucker` | Sechs Zustände, jeder aus dem Druckweg statt aus einem Zeitgeber; Bewegung nur beim Sammeln und Setzen; kein erfundener Balken. Das CSS kam am 6. September, der Autor stimmt; das HTML liegt nicht vor und wird nicht erfunden. test431. |
| 29 | Compact Folder Card | Nykolas94 | `nicht-verifiziert` | PRODUKTIV (angepasst) | Bibliothek, Notizhefte, zuletzt verwendet | noch nicht | Übersichts-Kachel, ersetzt weder Baum noch Browser (§4.3). |
| 30 | Gooey Liquid / Blob Filter | prikshit_1236 | `nicht-verifiziert` | RESERVE | — | noch nicht | Gooey Blob vorerst Reserve (§5). |
| 31 | Orb Option Row | vinh_8995 | `nicht-verifiziert` | PRODUKTIV (angepasst) | KI-Quellen, Elektro-Optionen (Titel + Untertitel + Schalter) | noch nicht | Nur für wichtige Optionen (§4.13). |
| 32 | Billiard-Table Switch | chase2k25 | `nicht-verifiziert` | RESERVE | — | noch nicht | Billiard Toggle ausgeschieden (§5). |
| 33 | Juggler Loader | john_2426 | `nicht-verifiziert` | RESERVE | — | noch nicht | Juggler zunächst Reserve; nur bei beschlossener spielerischer Lernwartezeit (§5). |
| 34 | Device / Gamepad Power Control | byllzz | `nicht-verifiziert` | PRODUKTIV (angepasst) | Elektro — Simulation/Messung (AUS·BEREIT·LÄUFT·PAUSIERT·FEHLER) | noch nicht | Nur echte Simulations-/Messlogik (§4.29). |
| 35 | Radial Share Orbit Menu | maxwell_2390 | `nicht-verifiziert` | PRODUKTIV (angepasst) | Teilen/Export (PDF, Bild, Text, Drucken, Link, E-Mail, System) | noch nicht | Nur echte verfügbare Aktionen (§4.7). |
| 36 | 7-Circle Gradient Loader | anand_4957 | `nicht-verifiziert` | RESERVE | — | noch nicht | 7-Circle Gradient als globaler Loader ausgeschieden (§5). |
| 37 | Candlestick / Analysis Animation | bilal_9731 | `nicht-verifiziert` | PRODUKTIV (angepasst) | Elektro-Messwerte, Statistik — "Analyseindikator" | noch nicht | Dekorative Animation nie als echte Messdaten beschriften (§4.24). |
| 38 | Tree / File Explorer | ashif_6672 | `chat-original` | PRODUKTIV (angepasst) | Seitenleiste-Hierarchie, Notizhefte, Wissen — höchste Priorität | noch nicht | role=tree, Pfeiltasten, Zustand erhalten, keine eigene Datenhaltung (§4.1). |
| 39 | Google Meet Glass SVG | Chrisllan02 | `nicht-verifiziert` | BEDINGT | nur echte Google-Meet-/Kalenderintegration | noch nicht | Sonst Reserve; Providerfarben nicht ändern (§4.34). |
| 40 | Gemini Glass SVG | Chrisllan02 | `nicht-verifiziert` | BEDINGT | nur wenn Gemini als Anbieter wählbar ist | noch nicht | Nie als Redion-KI-Logo (§4.33). |
| 41 | Upload Status Card | egehan_1415 | `chat-original-snippet` | PRODUKTIV (angepasst) | Bibliothek, KI-Anhang, Import — Standard für Übertragungen | noch nicht | Zustände wartet·hochladen·fertig·fehler·abgebrochen; echtes <progress> (§4.15). Die Daten gibt es schon: dateien/ablage.ts. |
| 42 | Minimal Liquid Loader | egehan_1415 | `chat-original-snippet` | PRODUKTIV (angepasst) | längere unbestimmte Verarbeitung (mit Nr. 6 zusammenführen) | noch nicht | Zwei Liquid-Originale — eines wird die Basis, das andere Reserve (§4.20). |
| 43 | Circuit / Ask AI → Thinking Button | dexter-st | `nicht-verifiziert` | PRODUKTIV (angepasst) | grosse KI-Analyse, Elektro-Schaltungsanalyse | noch nicht | Spezialkomponente; Leiterbahnen nur bei echter Verarbeitung (§4.11). |
| 44 | 6-Circle + Loading Text | santhosh_4929 | `chat-original-snippet` | RESERVE | — | noch nicht | 6-Circle Loader ausgeschieden (§5). |
| 45 | 3-Spark Geometric KI Loader | andrew-manzyk | `chat-original` | PRODUKTIV (Idee adaptiert) | KI-Chat/Schreibaktionen und Zustandsknopf art=erzeugen | Motion-Pass 06.09. | Drei eigene, ID-freie SVG-Funken statt Übernahme großer Masken/Filter. An bestehende Promise gebunden, finally entfernt den Status auch bei Fehler. Denkkugel bleibt erhalten. test429 prüft KI-Schreibcontroller mit kontrollierter Testantwort, Fehler und reduced motion. |
| 46 | Gear / Process Loader | faelpatrick | `chat-original` | PRODUKTIV (angepasst) | Elektro, Konvertierung — Zahnrad | noch nicht | #067c40 → currentColor; feste 1280pt-Masse entfernen; "Waiting More Faster" nicht übernehmen (§4.21). |
| 47 | 3D 8-Side Loader | 20essentials | `chat-original-snippet` | RESERVE | — | noch nicht | 3D 8-Side Loader ausgeschieden (§5). |
| 48 | Black-Hole / Orbit Loader | necatimertmetin | `chat-original-snippet` | PRODUKTIV (angepasst) | Wissen, RAG, semantische Suche — Orbit | noch nicht | Nur dort; nie allgemeines Laden (§4.23). |
| 49 | 15-Segment Aro Loader | 20essentials | `chat-original-snippet` | RESERVE | — | noch nicht | 15-Segment Aro Loader ausgeschieden (§5). |
| 50 | Pixel / Raster Loader | 20essentials | `chat-original-snippet` | PRODUKTIV (angepasst) | Datenbank-Indexierung, Blockverarbeitung — Pixel | noch nicht | --wh-number bleibt, wenn das Original es so nutzt (§4.22). |


**Wo die Originale liegen:** `quell/entwicklung/ui-reserve/komponenten/NN-name/original.html`
— unverändert, nur für Einträge mit verifiziertem Quelle-Status. Die Galerie:
`quell/entwicklung/ui-reserve/index.html` (braucht `npm run server`).

**Ein Widerspruch im Handoff, den `test426` fand:** Nr. 06 „Liquid Loader" war
als `uiverse-seite-verifiziert` eingetragen, ohne dass Code dabeilag. Er steht
jetzt als `nicht-verifiziert` — nichts erfunden.

---

## Die Karte vom ersten Durchgang

Diese Datei war Schritt 0 des UI-Auftrags:

was gibt es schon, was fehlt wirklich, und wo widerspricht der Auftrag
einer Entscheidung, die Redion bereits getroffen hat.

Sie ist bewusst zuerst eine KARTE und noch kein Bericht über Gebautes.
Der Grund steht in §45: der teuerste wiederkehrende Fehler dieses Projekts
war, eine Schnittstelle aus dem Gedächtnis zu schreiben statt sie
nachzuschlagen. Dreissig Komponenten „einbauen", ohne vorher zu wissen,
welche davon es längst gibt, wäre derselbe Fehler in gross.

---

## Was der Auftrag selbst als Vorrang setzt

> Bei Konflikt zwischen diesem Prompt und der aktuellen `doku/ARCHITEKTUR.md`
> bzw. aktuellem `main`: **AKTUELLE REDION-ARCHITEKTUR GEWINNT.**

Und:

> Wenn Redion bereits eine Komponente besitzt, die denselben Zweck erfüllt:
> bestehende Implementierung verstehen, vergleichen, erweitern —
> **keine zweite Parallelimplementierung erzeugen.**

Beide Sätze entscheiden die meisten Punkte unten.

---

## Die Karte

**Status-Werte:** `DA` = existiert produktiv · `TEIL` = existiert, aber
unvollständig · `FEHLT` = gibt es nicht · `KONFLIKT` = widerspricht einer
getroffenen Entscheidung · `OFFEN` = noch nicht geprüft

| # | Komponente | Status | Wo es in Redion steht | Bemerkung |
|---|---|---|---|---|
| A | Baumansicht | **TEIL** | `src/schale/aufbau/seitenleiste.ts` | Der Baum existiert samt Auf-/Zuklappen, je Abschnitt gemerkt. Was fehlt, ist die Herauslösung als wiederverwendbare Komponente und die Tastatursteuerung nach ARIA-Muster. |
| B | Grosser Datei-Browser | **FEHLT** | — | `src/bereiche/dateien/` hat Ablage, Import, Ausgabe, Erkennung — aber keine Browser-Ansicht. Echte Lücke. |
| C | Kompakte Ordnerkarte | **FEHLT** | — | — |
| D | Segmented Control | **FEHLT** | — | Nirgends `role="radiogroup"` oder ein Äquivalent. **Bester erster Baustein**: nützlich, kollidiert mit nichts. |
| E | Quick-Action-Plus | **TEIL** | `App.erstellenBlatt`, `Menue.menu` | Ein „Neu"-Weg existiert; ein Menüsystem auch. Zu prüfen, ob eine eigene Komponente mehr ist als eine zweite Liste (§8). |
| F | Share-/Export-Radialmenü | **TEIL** | 92 Fundstellen zu „teilen" | Teilen und Export gibt es an vielen Stellen. Ein Radialmenü wäre eine neue Darstellung, keine neue Funktion. |
| G | AI Prompt Composer | **DA** | `index.html:388–412` | **Existiert vollständig** — `＋` Anhang, Eingabefeld, `↑` Senden, dazu zwölf Quick-Actions und eine Werkzeugzeile (Quellen, Fähigkeiten, Modus, Diktat). Genau der Aufbau, den der Auftrag beschreibt. §19 sagt: nicht zweitbauen. |
| H | Generate → Generating | **FEHLT** | — | Die Aktionen existieren (Karteikarten, Datenbank bauen, Seite aufbauen); ein einheitlicher Zustandsknopf dafür nicht. Echte Lücke. |
| I | KI-Aktivitätsanzeige | **DA** | `src/schale/ueberlagerung/orb.ts` (E403) | Die Denkkugel erfüllt bereits, was der Auftrag verlangt: hört auf, wenn niemand hinsieht; steht still bei `prefers-reduced-motion`; trägt ihren Zustand **als Text**, nicht nur als Bewegung. |
| J | Circuit AI | **FEHLT** | — | Spezialkomponente für Elektro-Analyse. |
| K | KI-Toggle | **TEIL** | KI-Quellen in den Einstellungen | Schalter existieren; die Darstellung nicht. |
| L | Orb Option Row | **TEIL** | `einstellungen/ansicht/seite.ts` (`schalter(…)`) | Titel + Untertitel + Schalter gibt es als Zeilenform. |
| M | Upload-Status | **TEIL** | `dateien/ablage.ts`: `teile`, `angekommen`, `zustand` | Die **Daten** sind da (`'wartet' \| 'laeuft' \| 'fertig'`, Stückzähler) — die Anzeige mit Pille und Balken fehlt. Gute Lücke: echter State ohne Fake-Prozente. |
| N | Download → Open | **FEHLT** | — | — |
| O | Printer Process | **DA** | `wissen/werkzeuge.ts` `drucken()` + `schale/bedienung/drucker.ts` (E458) | Drucken existierte, die Zustandsanzeige nicht — jetzt schon. Nebenbei gefunden: `drucken()` war das einzige `async` ohne `catch`; ein Fehler sah nur die Konsole. |
| P | Server/Data Sync | **TEIL** | `wolkeStand`, `abgleich/maschine.ts` | Der Zustand existiert. Siehe **L132** — der Abgleich meldet vier verschiedene Gründe als einen. |
| Q | Standardspinner | **KONFLIKT** | siehe unten | **E46 hat gegen Kreisel entschieden.** |
| R | Liquid/Progress | **FEHLT** | — | — |
| S | Gear-Loader | **FEHLT** | — | — |
| T | Pixel-Loader | **FEHLT** | — | — |
| U | Orbit/Black-Hole | **FEHLT** | — | — |
| V | Candlestick-Analyseindikator | **FEHLT** | — | Die Umbenennung zu „Analyseindikator" im Auftrag ist richtig und passt zu §38. |
| W | Aurora/Hero-Start | **FEHLT** | — | — |
| X | Glass Workflow Cards | **FEHLT** | — | — |
| Y | Template-Karussell | **FEHLT** | — | Vorlagen gibt es (`Galerie`, `Register.vorlagen`), ein Karussell nicht. |
| Z | Gesture Hand | **FEHLT** | — | Nur Onboarding — und der Rundgang (E55) ist der Ort dafür. |
| AA | Device Controller | **FEHLT** | — | Elektro. |
| AB | Logout-Button | **TEIL** | Einstellungen → Konto | Der Weg existiert. |
| AC | Gemini-Icon | **OFFEN** | `src/register/symbole.ts` | Anbieter-Logos gehören getrennt behandelt — die Regel des Auftrags ist richtig. |
| AD | Google-Meet-Icon | **OFFEN** | — | Nur bei echter Integration. |

---

## Drei Konflikte, die Redur entscheiden muss

### 1. Der Standardspinner widerspricht E46

Der Auftrag sagt: *„STANDARD: Neutraler 10-Segment-Spinner"* und *„Es darf
nur EIN neutraler Standardspinner produktiv bleiben."*

**E46 hat das Gegenteil entschieden** — aus Redurs eigener Vorgabe §23:

> „Use skeletons, not random spinners everywhere."
>
> Der Grund ist nicht Mode. Ein Kreisel sagt „warte". Ein Skelett sagt
> „hier kommen sechs Zeilen mit einem Symbol links und einem Datum rechts" —
> man weiss, was gleich dasteht, das Auge hat schon einen Platz dafür, und
> wenn der Inhalt kommt, springt nichts.

Die Skelette sind gebaut (`werkzeuge.css`, `.sk-*`), begründet bis in die
Strichbreiten, und von `test126 §5` mit Gegenprobe gehalten. Ein Kreisel
existiert in Redion **gar nicht** — gemessen, nicht vermutet.

**Vorschlag:** E46 bleibt. Skelett dort, wo die Form vorhersagbar ist;
ein Kreisel nur für den Fall, den ein Skelett nicht abdeckt — ein Knopf,
der arbeitet. Das ist keine Ablehnung des Auftrags, sondern seine eigene
Regel („aktuelle Architektur gewinnt") angewandt.

### 2. „System | Hell | Dunkel" widerspricht den acht Schemata

Der Auftrag will das Segmented Control als Themensteuerung mit drei
Werten. Redion hat **acht Farbschemata** plus frei wählbare Akzentfarbe
(`einstellungen/ansicht/aussehen.ts:50`), jedes mit eigenem Hell- und
Dunkel-Akzent — E-Eintrag dort begründet, warum ein Wert für beide nicht
reicht.

Drei Werte wären ein Rückbau von acht auf drei.

**Vorschlag:** Das Segmented Control wird gebaut (es fehlt wirklich), aber
für Fälle mit 2–4 exklusiven Optionen — Liste/Raster, Ansichtsmodi,
Elektro-Modi. Die Schema-Wahl bleibt, wie sie ist.

Der „Sun/Moon-Toggle", der laut Auftrag in die Reserve soll, **existiert
nicht** — es gibt nichts zu verschieben.

### 3. Der Uiverse-Code liegt mir nicht vor — ERLEDIGT am 6. September

Redur hat das Handoff-Paket geschickt: 20 Originale, 30 als Notiz ohne Code.
Alles Weitere in diesem Abschnitt beschreibt den Stand davor.

#### Der ursprüngliche Absatz

Abschnitt 3 und 4 verlangen, zwölf ausgeschiedene Komponenten
*vollständig mit Code* in die Reserve zu legen: 4-Circle, 6-Circle,
aro-15, Jimu, Gradient-7, Geometric, 8-Side-3D, Gooey, Runner, Billiard,
Sun/Moon, Sparkle-Generate.

**Diesen Code habe ich nicht.** Er steht nicht im Repository, und er war
nicht Teil des Auftrags. Ich kann ihn auch nicht rekonstruieren — eine
nachgebaute Fassung wäre nicht der Code, den Redur bewertet hat, sondern
eine Behauptung darüber, und genau davor warnt §55.2.

**Was ich ohne ihn bauen kann:** das Reserve-Verzeichnis, sein README,
das Datenmodell und die Galerie — als leeres, funktionierendes Regal.
Sobald Redur die HTML/CSS-Schnipsel liefert (Datei, Zip oder eingefügt),
wandern sie hinein.

---

## Was zuerst gebaut wird

Nach dem Auftrag (Phase 1) und dieser Karte:

1. **Segmented Control** — fehlt wirklich, kollidiert mit nichts, wird
   von mehreren späteren Punkten gebraucht.
2. **Upload-Status** — die Daten existieren bereits (`zustand`, `teile`,
   `angekommen`); es fehlt nur die Anzeige. Kein Fake-Fortschritt nötig.
3. **Generate → Generating** — die KI-Aktionen existieren, der
   Zustandsknopf fehlt.
4. **Baumansicht** herauslösen — der grösste Punkt, und der mit dem
   grössten Risiko: die Seitenleiste ist die meistbenutzte Fläche der App.

Nicht gebaut wird, was schon da ist (G, I) oder was einer getroffenen
Entscheidung widerspricht (Q).

---

## Namensraum

Der Auftrag schlägt `.redion-ui-*` vor. Redion arbeitet durchgängig mit
Präfixen von zwei bis vier Buchstaben (163 Stück, `doku/CSS-NAMENSRAEUME.md`).
Ein siebenstelliges `redion-` wäre in dieser Umgebung ein Fremdkörper —
und der Zweck der Regel ist Kapselung, nicht Länge.

**Vorschlag:** Neue gemeinsame UI-Bauteile bekommen `ru-` („Redion UI"),
eingetragen im Verzeichnis wie jeder andere Namensraum. Das erfüllt die
Regel des Auftrags („keine ungekapselten globalen Klassennamen") und
bleibt bei Redions Bauart.

`.redion-reserve-*` bleibt für die Reserve — sie ist eine eigene Seite
ausserhalb der App, dort stört die Länge nicht.

---

## Vorgaben vom 6. September 2026

Redur hat an diesem Tag vierzehn CSS-Bauteile geschickt, mit einem Satz
dazu: „finde heraus, wo das passen könnte". Sie liegen unverändert unter
`quell/entwicklung/ui-reserve/vorgaben/` (`loader-sammlung.css`,
`folder-card.css`) — nicht bei den 50 Katalog-Einträgen nebenan, weil bei
den meisten der Autor nicht dabeisteht und ein `quelleStatus` ohne Namen
keine Behauptung tragen kann. Die einzige Ausnahme ist Nr. 28, wo er
dabeistand (E458).

Die Zuordnung folgt einer einzigen Frage: **gibt es in Redion etwas, das
dieses Bauteil anzeigen kann?** Ein Zähler ohne Daten, ein Fortschritt ohne
Anteil oder ein Schalter ohne Modus wäre eine Behauptung, und die kostet
mehr, als das Bauteil hübsch ist.

| Vorgabe | Redion-Ort | Was daran echt ist | Stand |
|---|---|---|---|
| `.folder-card` + Projektstruktur-Liste | Bibliothek, ⌄-Menü eines Ordners → „Blick hinein" | `Store.childrenOf`, die echte Anzahl, Suche durch den ganzen Unterbaum | **E459**, test432 |
| `.ui-bookmark` · `.love-heart` | Kopfleiste (`#btn-fav`) und Heftregal (`.nh-stern`) | das Feld `favorite` am Block | **E460**, test433 |
| `.loader` (flüssiger Ring) | WebLLM lädt sein Modell | `initProgressCallback` — der einzige echte 0..1-Anteil im ganzen Bestand | offen |
| `.preloader` / `.crack` (Sterne) | Auftragsfenster, Aufträge ohne bekannte Schrittzahl | `schritte === 0` heisst „unbekannt" — dort gibt es bewusst keinen Balken | offen |
| `.loader-letter` (Buchstaben) | „Jetzt abgleichen" in der Wolke | `zustand.laeuft` des Abgleichs — läuft oder läuft nicht, kein Anteil | offen |
| `.press` (Druckpresse) | Auftragsfenster, Auftragsart `pdf-bilder` | `schritt` von `schritte`, echte Seitenzahlen | offen |
| `.🤚` (tippende Hand) | Rundgang, an den Zielen, die man antippt | die neun Schritte und ihre echten Ziele | offen |
| `.btn` mit Buchstaben (dunkel) | Zustandsknopf, Sicht `erzeugen` — „Datenbank bauen", „Seite aufbauen" | die Zusage der KI-Aktion, wie bei `laden` (E441) | offen |
| `.gradient-btn` als Umschalter | die Schalter der Einstellungen | `Store.setMeta`, derselbe Wert wie heute | offen |
| `.theme-switch` (Staffelei) | Aussehen → Farbe, der Wechsel hell/dunkel | die acht Schemata und ihr `grund: 'light' \| 'dark'` | offen |
| `.island` (Textur) | der Kopf des Begrüssungsbildschirms | nichts — bewusst Schmuck an der einen Stelle, die keine Auskunft trägt | offen |
| `.iso-pro` (isometrische Symbole) | die Symbolreihe der Studio-Kopfleiste | die Knöpfe, die es dort schon gibt; die Beschriftung kommt aus dem `aria-label` | offen |

Was **nicht** übernommen wird, und warum, steht jeweils in der Entscheidung
zum Bauteil. Der wiederkehrende Grund ist derselbe wie bei Nr. 28: das
Original spricht seine Zustände aus einem Zeitgeber, Redion spricht sie aus
dem Ablauf.
