# Was noch offen ist

**Stand: 3. August 2026** · 59 Prüfläufe im Repository grün (2440 Prüfungen) ·
516 fertig, 8 teilweise, 0 offen in der Anforderungsliste

> **Zu den Prüfläufen.** Sie lagen unter `/tmp` auf genau einem Rechner und
> waren in keinem Auscheckvorgang enthalten; im Repository standen drei, und
> keiner davon war lauffähig. Jetzt liegen sie alle in `pruefungen/lauf/`,
> laufen über `npm run pruefen` und bei jedem Push von selbst. Die Übersicht,
> welcher Lauf welchen Bereich abdeckt, steht in `pruefungen/LIESMICH.md`.

Diese Datei ist die Arbeitsliste. Sie ist nach **Reihenfolge** sortiert, nicht
nach Wichtigkeit: was oben steht, macht das darunter leichter.

Jede Aufgabe hat: **warum**, **wo**, **fertig wenn**. Ohne das dritte ist eine
Aufgabe nur ein Wunsch.

---

## A · Der Umbau zu Ende bringen

Der Aufbau steht (`doku/ARCHITEKTUR.md`). A1 bis A3 sind durch, A4 für den
grössten Bereich — die Datenbanken — auch. Was bleibt, sind die übrigen
Bereiche. Sie
gehören zuerst gemacht, weil jede spätere Arbeit in den grossen Dateien
sonst wieder in denselben Klumpen läuft.

### ~~A1 — Die Seitenleiste herauslösen~~ · erledigt

Liegt in `quell/schale/aufbau/seitenleiste.js`, 704 Zeilen. `schale.js` ist
von 2600 auf 1993 Zeilen geschrumpft.

Belegt hat es am Ende nicht der Lauf, der dafür geschrieben wurde, sondern
die 57 aus `pruefungen/lauf/`: **elf davon prüfen die Seitenleiste**, und sie
liefen nach dem Umzug unverändert durch. Das ist die bessere Aussage — ein
Lauf, den man für einen Umzug schreibt, kann dieselbe blinde Stelle haben wie
der Umzug.

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

### ~~A2 — Kopfleiste und Inhaltsfläche trennen~~ · erledigt

`kopfleiste.js` (309 Zeilen: Cover, Symbol, Titel, Sperrhinweis,
Werkzeugzeile, Pfadleiste) und `inhaltsflaeche.js` (124 Zeilen: Wiki-Index,
Blöcke, Rückverweise, Streifen). `schale.js` ist von 2022 auf 1745 Zeilen
gefallen; `zeichneSeite` entscheidet dort nur noch, **was** gezeichnet wird.

**Der Punkt, an dem es kippt**, für den nächsten: `Kopfleiste.zeichne` gibt
einen Wahrheitswert zurück, und der ist kein Beiwerk. **`false` heisst
Schluss** — eine verschlüsselte Seite (`locked`) bekommt den Sperrbildschirm
und danach nichts mehr. Wer den Rückgabewert ignoriert, zeigt verschlüsselten
Inhalt an. `locked` und `gesperrt` lesen sich ähnlich und meinen
Gegenteiliges: `gesperrt` ist nur der Schreibschutz.

Nebenbei gefunden: der JSDoc-Block von `zeichneSeite` stand über
`streifenZeichnen`, fünfzig Zeilen von seiner Funktion entfernt. Steht wieder
an seinem Platz.

Auch hier haben es am Ende die gelieferten Läufe belegt: **vierzehn davon
prüfen die Seitenanzeige**, und alle vierzehn liefen nach dem Schnitt durch.

### ~~A3 — Das Stilblatt aufteilen~~ · erledigt

Elf Dateien in `quell/schale/stil/`, aus einer mit 3155 Zeilen:

| Datei | Zeilen | Was |
|---|--:|---|
| `marken.css` | 17 | die drei Schriften |
| `dunkel.css` | 54 | die Farben — **der Normalfall**, nicht der Sonderfall |
| `hell.css` | 35 | nur, was im Hellmodus anders ist |
| `grund.css` | 48 | Grundelemente und die zwanzig Farbklassen |
| `aufbau.css` | 239 | das Gerüst: Seitenleiste und Hauptbereich |
| `datenbanken.css` | 109 | der Rahmen einer Datenbank |
| `ki.css` | 96 | das KI-Panel |
| `werkzeuge.css` | 399 | Menüs, Dialoge, Graph, Karteikarten |
| `ansichten.css` | 182 | Zeitstrahl, Diagramm, Formular, Seitenvorschau |
| `einstellungen.css` | 444 | Einstellungen, Verbindungen, Konten |
| `bausteine.css` | 1682 | der Rest |

**Warum nicht weiter?** Weil es gemessen wurde: 33 Selektoren stehen in mehr
als einem Themenblock — `#sidebar`, `.db`, `#ai`, `#page`, `.karte`,
`#handy-leiste`. Thematisch zusammenziehen hiesse umsortieren, und
Umsortieren dreht bei genau diesen um, wer gegen wen gewinnt. Deshalb ist
jede der sechs neuen Dateien ein **zusammenhängender** Ausschnitt, kein
zusammengesuchter. Wer weiter aufteilen will, fängt mit dieser Messung an
und nicht mit dem Editor.

**Belegt** mit einem Vergleich der berechneten Werte vor und nach dem
Schnitt: 74 CSS-Variablen (beide Themen) und 56 Element/Thema-Kombinationen
— **0 Unterschiede**. Dazu die 58 Läufe, davon neun mit
`getComputedStyle`-Stichproben.

**Der Fund, ohne den A3 die Einzeldatei zerlegt hätte:** `bauen.js` ersetzte
den `<link rel="stylesheet">` **ohne `g`-Flag**, also nur den ersten. Solange
es ein Stilblatt gab, fiel das nicht auf. Ab dem zweiten hätte
`redion-einzeldatei.html` fünf tote `<link>` behalten — und ein `<link>` auf
`quell/schale/stil/…` geht ins Leere, sobald die Datei allein irgendwo liegt.
Sie wäre gestartet und unfertig gewesen: die halbe Gestaltung fehlt, und
nichts meldet einen Fehler. Dieselbe Sorte Fehler wie die fehlende
HTML-Säuberung. `test87` prüft das jetzt.

**Was beim nächsten Mal zu beachten ist:** Dunkel steht in `:root` und gilt
immer; `hell.css` überschreibt nur. Wer in `dunkel.css` eine Variable
ergänzt, muss sie auch in `hell.css` ergänzen — sonst zeigt der Hellmodus an
dieser einen Stelle den dunklen Wert, und das merkt nur, wer hell arbeitet.

**Und der Fehler, den ich beim zweiten Durchgang selbst gebaut habe**, weil
er sich wiederholen wird: ein Schnitt landete mitten in einem Kommentar-Banner.
Die neue Datei fing mit `KI-PANEL` und einem herrenlosen `*/` an. CSS bricht
dabei nicht ab — es räumt auf: der Parser überliest alles bis zum nächsten
abgeschlossenen Block und **verschluckt dabei die erste echte Regel**. `#ai`
verlor sein `display:none`, das KI-Panel stand offen im Fenster. Keine Datei
war kaputt, keine Klammer unausgeglichen, keine Meldung erschien. Gefunden
hat es nur der Vergleich der berechneten Werte — 58 Unterschiede.
`test87` prüft jetzt auf herrenlose Kommentarenden; die Klammernprüfung
allein hätte es **nicht** gefunden (nachgestellt und belegt).

### A4 — Die Bereiche in `dienst` und `ansicht` trennen · **Datenbanken erledigt**

**Warum.** Das ist die eigentliche Regel des Aufbaus: reine Logik ohne DOM
lässt sich prüfen, ohne einen Browser zu starten.

**Erledigt: `datenbanken`.** `dienst.js` (1022 Zeilen) trägt die
Eigenschaftstypen, das Lesen eines Wertes, Filtern, Sortieren, Gruppieren und
die Berechnungen. `steuerung.js` fiel von 8658 auf 7784 Zeilen und zeigt nur
noch.

Das „fertig wenn" ist wörtlich erfüllt und belegt: `pruefungen/lauf/test88.mjs`
lädt `dienst.js` in Node — ohne `document`, ohne `window` — und rechnet 38
Prüfungen durch. **In 47 Millisekunden.** Zum Vergleich: ein Browserlauf
braucht zwölf Sekunden.

**Dass der Schnitt sauber ging, war nicht Glück, sondern gemessen:** über alle
Namen gezählt braucht der Logikteil **nichts** aus dem Rest, während der Rest
16 Namen von dort holt. Die Abhängigkeit läuft nur in eine Richtung. Wäre es
andersherum auch nur an einer Stelle gewesen, hätten sich die beiden nicht
trennen lassen, ohne Verhalten zu ändern. Wer den nächsten Bereich schneidet,
fängt mit dieser Messung an.

Drei Kleinigkeiten waren nötig: `esc` kam aus `Blocks` — einem Modul, das
zeichnet; die zwei Zeilen stehen jetzt in `dienst.js`. `window.Tempo` wurde zu
`typeof Tempo !== 'undefined'`, wie CLAUDE.md es ohnehin vorschreibt. Und die
Datei hängt sich nur dann an ein Fenster, wenn es eines gibt.

**Offen — der Reihe nach, grösste zuerst:**

| Datei | Grösse | Ziel |
|---|--:|---|
| `bereiche/wissen/werkzeuge.js` | 100 KB | `graph/`, `karteikarten/`, `journal/`, `schlagwoerter/`, `befehle` ins Register |
| `bereiche/hilfe/wissensseiten.js` | 170 KB | ist fast nur Text — nach `doku/` verschieben und beim Bauen einlesen |
| `bereiche/editor/ansicht/editor.js` | 115 KB | `dienst.js` (Blockoperationen) + `ansicht/` (Zeichnen) |
| `bereiche/datenbanken/steuerung.js` | 7784 Zeilen | die Ansichten einzeln: Tabelle, Board, Kalender, Zeitstrahl |

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
