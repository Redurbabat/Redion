# Was noch offen ist

**Stand: 3. August 2026** · 5 Prüfläufe im Repository grün (248 Prüfungen) ·
516 fertig, 8 teilweise, 0 offen in der Anforderungsliste

> **Zu den Prüfläufen.** Es hiess hier „53 Prüfläufe grün". Die lagen unter
> `/tmp` auf genau einem Rechner und sind in keinem Auscheckvorgang enthalten;
> im Repository standen drei, und keiner davon war lauffähig. Seit `A1` gibt
> es `pruefungen/` mit `npm run pruefen`. Wer die 53 noch hat: sie gehören
> hierher, dann steht die Zahl wieder.

Diese Datei ist die Arbeitsliste. Sie ist nach **Reihenfolge** sortiert, nicht
nach Wichtigkeit: was oben steht, macht das darunter leichter.

Jede Aufgabe hat: **warum**, **wo**, **fertig wenn**. Ohne das dritte ist eine
Aufgabe nur ein Wunsch.

---

## A · Der Umbau zu Ende bringen

Der Aufbau steht (`doku/ARCHITEKTUR.md`), aber drei Dinge fehlen noch. Sie
gehören zuerst gemacht, weil jede spätere Arbeit in den grossen Dateien
sonst wieder in denselben Klumpen läuft.

### ~~A1 — Die Seitenleiste herauslösen~~ · erledigt

Liegt in `quell/schale/aufbau/seitenleiste.js`, 704 Zeilen. `schale.js` ist
von 2600 auf 1993 Zeilen geschrumpft. Der Prüflauf `pruefungen/seitenleiste.mjs`
lief vor und nach dem Umzug mit demselben Ergebnis — das war der Punkt der
Übung, nicht die neue Datei.

**Was an der Aufgabenstellung nicht stimmte**, für den nächsten, der so etwas
schneidet:

- Die Schnittkante ist **76–682**, nicht 84–700. `woerterZaehlen` gehört
  schon zum Seitenmenü, nicht zur Seitenleiste.
- `reiter`, `anpassModus` und `zeichneReiter` sind **im Block selbst**
  definiert und wandern mit; sie waren nie Einspeisungen. Eingespeist werden
  müssen dafür `kuerzlich`, `kommendeTermine`, `seitenMenue`, `suche` und
  `papierkorb`, die hier nicht genannt waren.
- Der eigentliche Kopplungspunkt stand gar nicht in der Aufgabe:
  **`App.zeichneBaum` wird an 51 Stellen ausserhalb gerufen** und an 26
  weiteren in `schale.js` selbst. Der Name musste bleiben — jetzt reicht er
  nur noch weiter, wie `UI` es für `Menue`/`Hinweis`/`Dialog` tut.
- `ordne`, der `setTimeout(…, 0)` am Ende von `zeichne` und `abschnitt()`
  hängen an derselben DOM-Form und mussten gemeinsam umziehen. Einzeln
  verschoben, wäre die Sortierung still kaputtgegangen.

### A2 — Kopfleiste und Inhaltsfläche trennen

**Warum.** Dasselbe Problem eine Ebene tiefer: Pfadleiste, Seitentitel,
Cover und Symbolwahl liegen im selben Block wie das Zeichnen der Blöcke.

**Wo.** `schale.js` → `quell/schale/aufbau/kopfleiste.js` und
`inhaltsflaeche.js`.

**Fertig wenn.** `schale.js` enthält nur noch Routing, Start und das
Zusammensetzen; alles Zeichnen liegt in den drei Dateien daneben.

### A3 — Das Stilblatt aufteilen

**Warum.** `quell/schale/stil/bausteine.css` hat 177 KB in einer Datei. Wer
eine Farbe ändern will, sucht.

**Wo.** Ziel:
`marken.css` (Farben, Abstände, Schrift als Variablen) ·
`grund.css` (Grundelemente) · `hell.css` · `dunkel.css` ·
`aufbau.css` (Layout) · `bausteine.css` (Komponenten).

**Wie.** Erst die `:root`-Variablen und die Thema-Blöcke herausziehen — die
lassen sich sauber trennen. Der Rest wandert nach Zuständigkeit.

**Fertig wenn.** Sechs Dateien, `index.html` lädt sie in dieser Reihenfolge,
`bauen.js` fügt alle ein, die App sieht unverändert aus (Prüflauf mit
Bildvergleich oder mindestens `getComputedStyle`-Stichproben).

### A4 — Die Bereiche in `dienst` und `ansicht` trennen

**Warum.** Das ist die eigentliche Regel des Aufbaus: reine Logik ohne DOM
lässt sich prüfen, ohne einen Browser zu starten. Heute geht fast jeder
Prüflauf über Chromium — das dauert und macht die Läufe flockig.

**Wo.** Der Reihe nach, grösste zuerst:

| Datei | Grösse | Ziel |
|---|--:|---|
| `bereiche/datenbanken/steuerung.js` | 400 KB | `dienst.js` (filtern, sortieren, rechnen, Rollups) + `ansicht/` (Tabelle, Board, Kalender, …) |
| `bereiche/wissen/werkzeuge.js` | 100 KB | `graph/`, `karteikarten/`, `journal/`, `schlagwoerter/`, `befehle` ins Register |
| `bereiche/hilfe/wissensseiten.js` | 170 KB | ist fast nur Text — nach `doku/` verschieben und beim Bauen einlesen |
| `bereiche/editor/ansicht/editor.js` | 115 KB | `dienst.js` (Blockoperationen) + `ansicht/` (Zeichnen) |

**Fertig wenn.** Für mindestens `datenbanken` gilt: `dienst.js` lässt sich in
Node laden und prüfen, ohne dass ein `document` existiert.

---

## B · Was inhaltlich noch aussteht

Aus `doku/NOTION-10000X-BESSER.md`, die acht Punkte, die als „teilweise"
markiert sind. Für jeden steht dort, was genau fehlt.

### B1 — Begriffe: dieselbe Sache, verschieden geschrieben (Idee 25)

**Warum.** „Acme", „Acme GmbH" und „ACME customer account" sind dasselbe.
Solange die App das nicht weiss, findet die Suche zwei Drittel nicht und
jede Auswertung zählt dreimal.

**Wie.** Normalisieren (Rechtsformen, Füllwörter, Zeichensetzung weg),
Ähnlichkeit über Token-Überschneidung plus Levenshtein, Vorschläge zur
**Bestätigung** — nie automatisch zusammenführen. Bestätigte Begriffe
bekommen eine Kennung und eine Alias-Liste; die Suche sucht über alle
Schreibweisen.

**Fertig wenn.** Ein Fenster zeigt Vorschläge aus dem echten Bestand, eine
Bestätigung legt einen Begriff an, und die Suche nach „Acme" findet alle
drei Schreibweisen.

### B2 — Entscheidungs- und Wissensgraph (Idee 26)

**Warum.** Der Graph zeigt heute Seitenverknüpfungen. Was fehlt, ist die
Frage „warum haben wir das damals so entschieden?".

**Wie.** Ein Blocktyp „Entscheidung" mit Datum, Beteiligten, Alternativen,
Begründung und betroffenen Projekten. Der Graph zeigt sie als eigene Art
und zieht Linien zu dem, was sie beeinflusst.

**Fertig wenn.** Eine Entscheidung lässt sich anlegen, im Graph sehen und
über Filter finden („alle Entscheidungen zum Preis seit Januar").

### B3 — Eine echte Abfragesprache (Idee 2 und 34)

**Warum.** Filter und Formeln decken viel ab, aber „Umsatz nach Kunde, nur
bezahlt, gruppiert" schreibt man in einem Satz schneller als in acht
Klicks.

**Wie.** Keine SQL-Nachbildung — eine lesbare Sprache, die auf die
vorhandene Filter- und Formel-Maschine abgebildet wird. Der Parser aus
`formeln/laufzeit.js` ist die Vorlage.

**Fertig wenn.** Eine Zeile wie
`zeige Aufgaben wo Status nicht Fertig und Fällig vor heute, gruppiert nach Person`
ergibt eine Ansicht — und ein Fehler nennt die Stelle im Satz.

### B4 — Zweige und Diffs für den Bestand (Idee 3)

**Warum.** Der Versionsverlauf zeigt eine Seite. Was fehlt: eine grosse
Umstellung vorbereiten, ansehen, dann übernehmen — oder verwerfen.

**Wie.** Auf dem, was schon da ist, aufbauen: `kern/ablage/basis` kennt den
letzten gemeinsamen Stand, `abgleich/zusammenfuehren.js` kann drei Fassungen
zusammenlegen. Ein Zweig ist ein benannter Satz Änderungen gegen eine Basis.

**Fertig wenn.** Ein Zweig lässt sich anlegen, darin arbeiten, der
Unterschied ansehen und übernehmen oder wegwerfen.

### B5 — Import aus Confluence, Trello, Asana, Jira (Idee 11)

**Warum.** XLSX, DOCX, EPUB, CSV, Markdown, HTML und der Web-Clipper gehen.
Die vier fehlen — und sie sind der häufigste Grund, warum jemand nicht
umsteigt.

**Wie.** Je Quelle ein eigener Einleser unter `bereiche/dateien/`, der aus
dem Export eine Zwischenform macht (Seiten, Blöcke, Datenbanken,
Beziehungen) und diese dann einspielt. Mit Vorschau vor dem Einspielen.

**Fertig wenn.** Für mindestens eine Quelle: Export einlesen, Vorschau
zeigen, einspielen, Prüflauf mit einer echten Beispieldatei.

### B6 — Suche in Bildern und Tonspuren (Idee 13/28)

**Warum.** Ein PDF-Anhang ist heute unsichtbar für die Suche.

**Wie.** OCR im Browser (Tesseract als WASM) für Bilder und PDFs; für Ton
die Spracherkennung des Browsers, wo vorhanden. Ergebnisse als Text am Block
speichern, damit die Suche sie findet.

**Achtung.** Das ist der einzige Punkt, der eine fremde Bibliothek
rechtfertigen könnte. Vorher prüfen, ob es ohne geht — und wenn nicht, sie
mitliefern statt nachzuladen.

**Fertig wenn.** Ein Bild mit Text wird gefunden, und der Treffer zeigt die
Stelle.

### B7 — Screenreader-Feinschliff (Idee 30)

**Warum.** Tastaturbedienung, Fokus-Modus, hoher Kontrast und Schriftgrössen
sind da. Was fehlt, ist die semantische Struktur: Rollen, Beschriftungen,
Live-Bereiche für Meldungen.

**Wie.** Durchgang mit einem Screenreader, `aria-*` nachziehen, Meldungen in
`aria-live`. Beim Baum: `role="tree"`, `aria-expanded`, `aria-level`.

**Fertig wenn.** Ein Prüflauf zeigt für die zwanzig häufigsten Bedienwege
eine vollständige Beschriftung, und die Meldungen kommen im Screenreader an.

### B8 — Ein Marktplatz für Erweiterungen (Idee 10)

**Warum.** Erweiterungen können Befehle, Blöcke und Seitenpanels anmelden —
aber es gibt keinen Weg, eine zu finden und zu installieren.

**Wie.** Erst wenn A4 durch ist. Eine Erweiterung ist dann eine Datei, die
sich bei den Registern anmeldet; der Marktplatz ist eine Liste geprüfter
Dateien mit Rechteanzeige („diese Erweiterung darf: lesen, Befehle
anmelden").

**Fertig wenn.** Eine Erweiterung lässt sich aus einer Liste installieren,
sieht man ihre Rechte vorher, und sie lässt sich vollständig wieder
entfernen.

---

## C · Dauerhaft

- **Nach jeder Änderung Prüfläufe.** Vor jedem Commit ein Querschnitt.
- **Gefundene Fehler in den Commit-Text**, auch wenn sie nicht zum Thema
  gehören. Sie sind das Wertvollste an der Arbeit.
- **`doku/ARCHITEKTUR.md` mitziehen**, wenn sich der Aufbau ändert. Eine
  Architekturbeschreibung, die nicht stimmt, ist schlimmer als keine.
- **`AUFGABEN.md` mitziehen.** Erledigtes streichen, Neues eintragen, und zu
  jedem Neuen ein „fertig wenn".

---

## Wo alles steht

| Frage | Antwort |
|---|---|
| Wie macht Notion das? | `Desktop\Notion-Doku\Redion-Recherche` — geprüft, mit Quellen |
| Was ist schon gebaut? | `doku/WAS-REDION-MEHR-KANN.md`, 30 Abschnitte |
| Wogegen wird gebaut? | `doku/NOTION-10000X-BESSER.md` — 21 Lücken, 36 Ideen |
| Wie ist es aufgebaut? | `doku/ARCHITEKTUR.md` |
| Was gilt beim Arbeiten? | `CLAUDE.md` |
| Wie steht es um die Anforderungen? | in der App: Befehlspalette → „Umsetzungsstand" |
