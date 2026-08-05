# Was Notion 10 000-mal besser machen würde

**Stand: 2. August 2026**

Zwei Runden mit der Notion-KI, im echten Notion, im Workspace von Redur.

- **Runde A** — die nüchterne Frage: *Welche Funktionen fehlen gegenüber Excel,
  Airtable und normalen Programmiersprachen? Und was wäre gut, wenn es das
  gäbe?* → **21 konkrete Lücken**, nach Dringlichkeit sortiert.
- **Runde B** — die radikale Frage: *Nicht kleine Verbesserungen. Was würde
  Notion 10 000-mal besser machen?* → **36 Architektur-Ideen**, jede mit
  Problem, Funktionsweise und dem Grund, warum Notion sie heute nicht hat.

Was die KI an harten Zahlen genannt hat, steht in `WAS-NOTION-NICHT-KANN.md`
und ist dort gegen die offizielle Dokumentation geprüft. Was hier steht, sind
**Wünsche und Einschätzungen** — keine Notion-Roadmap. Die KI sagt das selbst
dazu: *„Es ist keine offizielle Notion-Roadmap."*

Am Ende steht der Teil, der uns wirklich betrifft:
[Was unsere App davon schon kann](#teil-4) und
[was wir als Nächstes bauen](#teil-5).

---

## Inhalt

- [Teil 1 — Die zehn grössten Lücken](#teil-1)
- [Teil 2 — Die 21 konkreten Lücken im Detail](#teil-2)
- [Teil 3 — Die 36 radikalen Ideen](#teil-3)
- [Teil 4 — Was unsere App davon schon kann](#teil-4)
- [Teil 5 — Was wir als Nächstes bauen](#teil-5)

---

<a id="teil-1"></a>
## Teil 1 — Die zehn grössten Lücken

Die Reihenfolge stammt von der Notion-KI selbst, gewichtet aus offiziellen
Grenzen, häufigen Community-Fragen und Erwartungen von Umsteigern.

| # | Was fehlt | Kurz |
|--:|---|---|
| 1 | **Vollständiger Offline-Modus** | Heute nur Desktop/Mobile, nur einzelne Seiten, bei Datenbanken **nur die ersten 50 Zeilen der ersten Ansicht**, Unterseiten nicht automatisch |
| 2 | **Pivot- und Kreuztabellen** | Kein Zeilenfeld × Spaltenfeld × Wertefeld, kein Drilldown, keine Zwischensummen, keine Pivot-Charts |
| 3 | **Formeln mit Datenbank-Abfragen** | Kein `SUMIF` über eine fremde Tabelle, kein `SELECT … WHERE` — ohne Relation kommt man nicht heran |
| 4 | **Vorherige Zeile, laufende Summe, Rang** | Formeln sehen nur ihre eigene Zeile. Kein Kontostand, keine Differenz zum Vortag, keine Rangliste, keine Zeilennummer |
| 5 | **Automationen mit echter Logik** | Kein If/Else, keine Schleifen, kein „Find records", keine Fehlerbehandlung, kein Testlauf, keine Logs |
| 6 | **Datenvalidierung und Constraints** | Kein `required`, kein `unique`, keine Regex-Prüfung beim Speichern, keine Statusübergangsregeln |
| 7 | **Bedingte Formatierung** | Keine Regel „Zeile rot, wenn überfällig", keine Datenbalken, keine Farbskalen, keine Heatmap |
| 8 | **Automatische Relationen, Dedupe, Upsert** | Kein automatisches Verknüpfen bei gleicher E-Mail, kein Zusammenführen von Dubletten, kein Upsert beim Import |
| 9 | **KI, die Struktur bauen darf** | Notion sagt selbst: der Agent kann **keine** Automationen, Datenbank-Templates, Seiten-Layouts oder Formeln/Rollups/Buttons anlegen |
| 10 | **Echtes Backup und Restore** | Notion schreibt selbst, dass man einen Workspace **nicht** exakt rekonstruieren kann, indem man den Export wieder hochlädt |

---

<a id="teil-2"></a>
## Teil 2 — Die 21 konkreten Lücken im Detail

### 1 · Vollständiger Offline-Modus

**Was fehlt.** Offline gibt es nur in der Desktop- und Handy-App, nicht im
Browser. Seiten müssen einzeln offline verfügbar gemacht werden. Unterseiten
kommen nicht automatisch mit. Bei Datenbanken werden nur die **ersten 50
Zeilen der ersten Ansicht** heruntergeladen. Einbettungen, KI-Blöcke,
Formulare und Knöpfe sind offline nicht oder nur eingeschränkt da. Teilen und
Rechte ändern geht offline gar nicht.

**Was Leute wollen.** Ganze Workspaces lokal spiegeln · alle Unterseiten
automatisch mitnehmen · vollständige Datenbanken statt 50 Zeilen ·
Offline-Suche · Knöpfe und Formulare, die offline funktionieren ·
Zusammenführen ohne Datenverlust, wie Git oder Dropbox.

**Was gut wäre.** „Ganzen Workspace herunterladen" · „Ganzen Teamspace
herunterladen" · vollständiger Datenbank-Zwischenspeicher · Offline-Suche über
alles Gespeicherte · eine sichtbare Konfliktansicht · eine Warteschlange für
Automationen · eine Anzeige „Diese Seite ist vollständig offline verfügbar".

### 2 · Echte Pivot-Tabellen, Kreuztabellen und BI-Ansichten

**Was fehlt.** Notion kann gruppieren, filtern, sortieren und einfach
zusammenrechnen — aber keine echten Pivot-Tabellen. Es fehlen Zeilenfelder,
Spaltenfelder, Wertefelder, mehrere Aggregationen gleichzeitig, Drilldown,
Pivot-Charts, „Prozent vom Gesamtergebnis", laufende Summen, dynamische
Kreuztabellen.

**Was Leute wollen.** Umsatz nach Monat × Kategorie · Aufgaben nach Person ×
Status · Ausgaben nach Konto × Monat · Stunden nach Projekt × Woche · OKRs
nach Team × Quartal — ohne Rollup-Bastelei.

**Was gut wäre.** Eine eigene Pivot-Ansicht: Zeilen nach Eigenschaft A,
Spalten nach Eigenschaft B, Werte nach Eigenschaft C; Summe, Durchschnitt,
Anzahl, Anzahl verschieden, Min, Max, Median; Prozentwerte; Zwischensummen;
Pivot-Charts; Export nach CSV/Excel.

### 3 · Freier Zugriff auf andere Datenbanken in Formeln

**Was fehlt.** Notion-Formeln können keine fremde Datenbank durchsuchen. Sie
brauchen eine Relation und dann ein Rollup.

In Excel: `=SUMIF(Rechnungen[Kunde]; A2; Rechnungen[Betrag])`
In SQL: `SELECT SUM(amount) FROM invoices WHERE customer_id = …`
In Notion: Relation anlegen, Rollup bauen, Hilfsspalten dazu, manchmal noch
eine Automation als Krücke.

**Was gut wäre.** Eine sichere, begrenzte Abfragefunktion:

```
lookup("Rechnungen").where(prop("Kunde") == current.prop("Kunde")).sum(prop("Betrag"))
```

oder als einfache Funktionen: `findRows(db, bedingung)`,
`sumWhere(db, bedingung, wert)`, `countWhere(db, bedingung)`,
`firstWhere(db, bedingung)`, `lastWhere(db, bedingung, sortierung)`.

### 4 · Verweise auf andere Zeilen

**Was fehlt.** Keine vorherige Zeile, keine nächste Zeile, keine Zeilennummer,
keine Kenntnis der sichtbaren Sortierung, keine Zellkoordinaten, kein Bereich
`A1:A20`.

**Was Leute wollen.** Laufender Kontostand · Differenz zum Vortag · Differenz
zur letzten Messung · kumulierte Stunden · Rangliste · fortlaufende Nummer ·
„nächste Aufgabe" · Gewichtsverlauf · Streaks.

**Was gut wäre.** `previous(prop("Betrag"))`, `next(prop("Datum"))`,
`runningSum(prop("Betrag"))`, `rank(prop("Punkte"))`, `rowNumber()` — und
dazu die Möglichkeit zu bestimmen, worauf sich die Reihenfolge stützt:
`runningSum(prop("Betrag"), orderBy: prop("Datum"))`.

### 5 · Leistungsfähigere Automationen

**Was fehlt.** If/Else-Ketten · Schleifen über Datensätze · Suchen als Aktion ·
Fehlerbehandlung · Wiederholungspfade · Protokolle mit Debug-Ausgabe ·
Testmodus · Versionierung · Variablen über mehrere Schritte · JSON verarbeiten ·
beliebige API-Aufrufe mit Anmeldung · Sammeländerungen · „Skript ausführen".
Dazu: Automationen pausieren bei Fehlern, und man wird nicht immer benachrichtigt.

**Was gut wäre.** Ein Baukasten mit If/Else, Schleifen, „Datensätze finden",
„Datensätze ändern", „viele anlegen", Webhooks mit Anmeldung, JSON-Parser,
Fehlerbehandlung, Laufverlauf, manuellem Testlauf, Versionsverlauf und
wiederverwendbaren Bausteinen.

### 6 · Zufallsfunktionen

**Was fehlt.** Kein `random()`. Notion sagt das ausdrücklich selbst.

**Was Leute wollen.** Zufällige Lernkarte · zufällige Aufgabe · zufälliger
Prompt · zufällige Essensidee · zufälliger Trainingsplan · zufällige
Reihenfolge · A/B-Zuteilung · Stichproben.

### 7 · Eigene Funktionen

**Was fehlt.** Kein `LAMBDA` wie in Excel, kein Scripting wie in Airtable.
Logik wird über mehrere Spalten wiederholt — und läuft dann in die
**15-Ebenen-Grenze**.

**Was gut wäre.** Eine Formel einmal definieren und überall nutzen; eine
Formel-Bibliothek pro Workspace; globale Konstanten; Kommentare; automatische
Formatierung; Tests für Formeln.

### 8 · Echte Schleifen, Rekursion, Listenverarbeitung

**Was fehlt.** Keine Rekursion, keine „solange wiederholen bis"-Konstruktion —
spätestens die 15 Ebenen setzen die Grenze.

**Was gut wäre.** `reduce(liste, start, ausdruck)`, `groupBy(liste, schlüssel)`,
`sortBy(liste, schlüssel)`, `unique(liste)`, `flatten(liste)` — und für
Hierarchien `descendants()`, `ancestors()`, `recursiveRollup(eigenschaft, maxTiefe)`.

### 9 · Bessere Zeitzonen- und Datumslogik

**Was fehlt.** Keine ausdrückliche Zeitzonenumrechnung, keine
sommerzeitsichere Rechnung, keine Zeitzone pro Datensatz, kein
Arbeitskalender, kein Feiertagskalender, keine Werktage.

**Was gut wäre.** `convertTimezone(datum, "UTC", "Europe/Zurich")` ·
`formatDate(datum, "DD.MM.YYYY HH:mm", "Europe/Zurich")` ·
`businessDaysBetween(start, ende, kalender)` · `addBusinessDays(datum, 5)` ·
`isHoliday(datum, "CH-ZH")` · `endOfMonth(datum)` · `startOfQuarter(datum)`.

### 10 · Vollere Tabellenkalkulation

**Was fehlt.** Zellbereiche, Matrixformeln, dynamische Arrays, Solver,
Zielwertsuche, Szenario-Manager, breite Statistik- und Finanzfunktionen.

**Was gut wäre.** Nicht Excel nachbauen, aber: Bereichsformeln innerhalb einer
Ansicht, berechnete Zusammenfassungszellen, Szenario-Tabellen, einfache
Prognosefunktionen, Zielwertsuche für Planungsdaten, saubere Excel-Roundtrips.

### 11 · Freiere Layouts pro Ansicht

**Was fehlt.** Mehrere Tabellenbereiche in einer Ansicht · gruppenspezifische
Summenzeilen · frei platzierbare Zusammenfassungskarten · mehrere Datenquellen
in einer Ansicht · Master-Detail-Layouts.

**Was gut wäre.** Eine echte Oberflächen-Schicht mit bedingten Layouts, freien
Bausteinen, KPIs, Diagrammen, Formularen, mehreren Datenquellen, interaktiven
Filtern, rollenabhängigen Ansichten. Airtable Interfaces ist der Vergleich.

### 12 · Bedingte Formatierung und visuelles Tabellenlayout

**Was fehlt.** Keine verbundenen Zellen, keine vollwertige bedingte
Formatierung, keine Datenbalken, keine Farbskalen, keine Symbolsätze.

**Was gut wäre.** Bedingte Zeilen- und Zellformatierung · Heatmap-Ansicht ·
Farben auf Formelbasis · Formatregeln pro Ansicht · druckfertige Layouts.

### 13 · Automatische Relationen und Deduplizierung

**Was fehlt.** Notion verknüpft Datensätze nicht automatisch anhand gleicher
Feldwerte.

**Was gut wäre.** Eindeutigkeitsregeln · Primärschlüssel · automatische
Relation per Übereinstimmung · Dedupe-Assistent · Datensätze zusammenführen ·
Upsert beim Import und über die API · Prüfregeln. Besonders wichtig für CRM,
Inventar, Bewerbungen, Rechnungen.

### 14 · Datenvalidierung und Constraints

**Was fehlt.** Es gibt Eigenschaftstypen, aber keine Regeln.

**Was Leute wollen.** „E-Mail muss gültig sein" · „Rechnungsnummer darf nicht
doppelt sein" · „Betrag darf nicht negativ sein" · „Bei Status Fertig muss ein
Abschlussdatum stehen" · „Ohne Kunde keine Rechnung" · „Nur bestimmte Personen
dürfen Status X setzen".

**Was gut wäre.** Eine Prüfschicht: `required(prop("Kunde"))`,
`unique(prop("Rechnungsnummer"))`, `matches(prop("Email"), muster)`,
`prop("Betrag") > 0` — mit Warnung, Sperre oder Auslöser für eine Automation.

### 15 · Bessere KI-Aktionen in Datenbanken

**Was fehlt.** Notion nennt ausdrücklich, dass der Agent **keine** neuen
Datenbankautomationen, Datenbank-Templates, Seiten-Layouts und keine
fortgeschrittenen Eigenschaften wie Formeln, Rollups oder Knöpfe anlegen oder
bearbeiten kann.

**Was gut wäre.** Formeln anlegen · Rollups anlegen · Knöpfe einrichten ·
Templates erstellen · Automationen bauen · Ansichten konfigurieren ·
Schema-Probleme erkennen · Leistungsprobleme erklären · Migrationen planen —
**immer mit Vorschau und Bestätigung**: „Das werde ich ändern — bestätigen?"

### 16 · Bessere Formel-Werkstatt

**Was fehlt.** Debugger · Haltepunkte · schrittweise Auswertung · Tests ·
Fehlerstellen mit guter Erklärung · Typanzeige · gute Vervollständigung ·
Kommentare · automatische Formatierung · Versionsverlauf pro Formel ·
wiederverwendbare Bausteine · „Erklär mir diese Formel an Beispieldaten".

### 17 · Leistung und Transparenz

**Was fehlt.** Notion weist selbst darauf hin, dass komplexe Formeln und
Rollups Datenbanken langsamer machen — besonders wenn Formeln auf Formeln
aufbauen. Es fehlt: Leistungsanzeige pro Eigenschaft, Abhängigkeitsgraph,
Neuberechnungsstatus, Zwischenspeicher-Optionen, Warnung vor teuren Ketten.

**Was gut wäre.** Ein Profiler für Formeln und Rollups · Abhängigkeitsgraph ·
„Formel in festen Wert umwandeln" · geplante Neuberechnung · Leistungsnote je
Ansicht.

### 18 · Bessere Diagramme und Dashboards

**Was fehlt.** Notion hat einfache Visualisierungen, aber nicht die Tiefe von
Excel, Airtable, Power BI oder Tableau: mehrere Diagrammtypen, Pivot-Charts,
kombinierte Achsen, Berichte.

### 19 · Bessere Import- und Export-Roundtrips

**Was fehlt.** Notion sagt beim Workspace-Export ausdrücklich, dass man einen
Workspace **nicht** einfach exakt wiederherstellen kann, indem man den Export
wieder hochlädt.

**Was gut wäre.** Echtes Backup und Restore · versionierte Sicherungen ·
Export inklusive Schema, Ansichten, Relationen, Automationen, Rechten · Import
mit Zuordnung · Upsert über eine eindeutige Kennung · Prüfbericht vor dem Import.

### 20 · Feinere Rechte innerhalb von Datenbanken

**Was fehlt.** Rechte auf Seitenebene gibt es; Feld-Level-Rechte,
Genehmigungswege, Sperrregeln, eine Rollenmatrix pro Datenbank und Pflichtfelder
je Status fehlen.

### 21 · Die kompakte Gegenüberstellung

**Gegenüber Excel und Google Sheets fehlen vor allem:** Zellreferenzen wie A1 ·
relative und absolute Bezüge · Bereichsformeln · `SUMIF`, `COUNTIF`, `XLOOKUP`
ohne Relation · Pivot-Funktionen · dynamische Arrays · Matrixformeln · `RAND()`,
`RANDBETWEEN()` · Solver und Zielwertsuche · bedingte Formatierung per Formel ·
breite Statistik- und Finanzfunktionen · Makros, VBA, Office Scripts.

**Gegenüber Airtable fehlen vor allem:** die stärkere Oberflächen-Schicht ·
Scripting · robustere Automationen · stärkere Datenvalidierung · bessere
Lookup-/Rollup-Muster · Erweiterungen · eigenständigere Formulare ·
Datenpflege-Abläufe wie Dedupe und Upsert.

**Gegenüber normalen Programmiersprachen fehlen vor allem:** eigene Funktionen ·
Module und Imports · Schleifen · Rekursion · Variablen mit grösserem
Gültigkeitsbereich · Datenstrukturen wie Objekte und Wörterbücher ·
Fehlerbehandlung · Tests · Debugger.

---

<a id="teil-3"></a>
## Teil 3 — Die 36 radikalen Ideen

Die Antwort auf die Frage *„Was würde Notion 10 000-mal besser machen?"* —
jeweils: **Problem → wie es funktionieren würde → warum Notion es nicht hat.**

### Fundament: wo die Daten liegen

**1 · Local-First Notion**
Notion ist im Kern ein Server-Dienst; Geschwindigkeit, Offline, Datenbesitz und
Ausfallsicherheit bleiben dadurch begrenzt. → Jeder Workspace hätte eine lokale
Datenbank auf dem Gerät (SQLite/DuckDB plus lokaler Dateispeicher). Änderungen
werden zuerst lokal geschrieben, dann synchronisiert. Der Server ist Sync-,
Sicherungs- und Zusammenarbeitsschicht, nicht der einzige Ort, an dem Arbeit
möglich ist. → *Warum nicht:* Notion wurde als Cloud-App gebaut. Local-first
verlangt eine andere Architektur — Konfliktlösung, lokale Indizes,
Schlüsselverwaltung, Offline-Migrationen, Speichergrenzen auf dem Handy, neue
Sync-Protokolle.

**2 · Echte Datenbank-Engine mit SQL**
Notion-Datenbanken sind Seitenbehälter mit Eigenschaften, keine relationalen
Tabellen. → Man könnte Ansichten mit SQL definieren
(`SELECT customer, SUM(amount) FROM invoices WHERE status = 'Paid' GROUP BY customer`)
und auf Tabellen, SQL-Views oder materialisierten Views aufbauen. → *Warum nicht:*
SQL würde Datenmodell, Rechteprüfung, Leistung und Bedienung deutlich komplexer machen.

**3 · Workspace als Git-Repository**
Der Versionsverlauf ist nützlich, aber ohne Zweige, Commits, Pull Requests und
saubere Diffs für Datenbank-Schemata. → Jede strukturelle Änderung — Seite,
Datenbank, Ansicht, Formel, Automation, Recht — wäre ein Commit. Teams könnten
Zweige für grosse Umbauten anlegen, den Diff prüfen und dann zusammenführen. →
*Warum nicht:* Git-artige Modelle sind für nicht-technische Nutzer schwer.

**24 · Alle Inhalte als offene Dateien**
Export ist nicht dasselbe wie ständig offene Daten. → Jede Seite läge intern als
Markdown/JSON vor, jede Datenbank als Parquet/SQLite/CSV plus Schema-Datei. Man
könnte den Workspace wie einen Ordner behandeln.

**23 · Bring Your Own Storage**
Notion-Bedienung, aber Daten im eigenen Speicher: S3, Google Cloud Storage,
Azure Blob, ein lokaler Ordner, ein Git-Repo, ein eigenes Postgres. Notion wäre
Oberfläche, Sync und Zusammenarbeit; die Rohdaten blieben beim Kunden. →
*Warum nicht:* Geschäftsmodell und Architektur setzen auf kontrollierte Cloud.

**22 · Self-Hosting**
Manche Organisationen wollen Notion, aber nicht als fremden Dienst. →
*Warum nicht:* teuer im Support, bremst die Entwicklung, erschwert KI, Sync und
Integrationen.

### Logik: was man mit den Daten machen kann

**4 · Formeln als richtige Programmiersprache**
Eine kleine, abgesicherte Sprache — TypeScript-ähnlich, aber in einer Sandbox —
mit eigenen Funktionen, Imports, Tests, Typprüfung, Vervollständigung, Debugger,
Zugriff auf erlaubte Datenbanken und klaren Laufzeitgrenzen. → *Warum nicht:*
Sicherheit, Leistung, Support — und viele Nutzer wollen Einfachheit, keine IDE.

**5 · Automationen als Code**
Neben dem visuellen Baukasten gäbe es Skripte:
`on("task.status.changed", async e => { … })` mit `pages.update`, `slack.send`
und so weiter. → *Warum nicht:* fremder Code mit Workspace-Zugriff ist heikel.

**34 · Notion Query Language für normale Leute**
Eine lesbare Abfragesprache: *„Zeige Aufgaben, wo Status nicht Done und
Fälligkeit vor heute, gruppiert nach Zuständigem, summiere Aufwand."* — nutzbar
als Ansicht, Diagramm, Automationsauslöser oder Formelquelle.

**14 · Materialisierte Ansichten und Zwischenspeicher**
Grosse Datenbanken mit Formeln und Rollups werden langsam. → Berechnete
Ansichten vorberechnen, teure Rollups zwischenspeichern, Formelwerte einfrieren,
schrittweise aktualisieren, Leistung anzeigen: *„Diese Übersicht wird alle 15
Minuten neu berechnet."*

**16 · Datenvalidierung und Constraints** · **17 · Automatische Relationen,
Dedupe und Upsert** · **21 · Rechte bis auf Feld- und Ansichtsebene** —
siehe Teil 2, Punkte 14, 13 und 20.

**18 · Workspace Schema Layer**
Eine Schema-Ansicht über den ganzen Workspace: alle Datenbanken, Eigenschaften,
Relationen, Abhängigkeiten, Formeln, Rollups, Automationen, Rechte — wie ein
ER-Diagramm. Dort könnte man Datenmodelle planen und Änderungen simulieren.

**20 · Tests für Formeln, Automationen und KI**
*„Wenn Fälligkeit gestern und Status nicht Done, dann muss Status auf Überfällig
gehen."* — als ausführbarer Test. → *Warum nicht:* Tests sind ein
Softwarekonzept; es müsste so einfach werden, dass normale Nutzer es verstehen.

**36 · Workspace-Simulator**
Vor einer grossen Änderung simulieren: Welche Seiten ändern sich? Welche
Automationen laufen? Wer bekommt Zugriff? Welche Formeln brechen? Welche
Ansichten werden langsam? Welche Daten gehen verloren? — wie ein „Plan" bei
Terraform.

**15 · Echte Dashboards und Reporting-Engine** · **19 · Templates als echte Apps**
mit Versionen, Updates, Migrationsskripten, Abhängigkeiten, Konfigurationsassistent
und Tests — damit ein CRM-Template später ein Update bekommen kann, statt neu
kopiert zu werden.

### Zusammenarbeit und Sicherheit

**8 · Konfliktfreie Zusammenarbeit mit CRDTs**
CRDTs nicht nur für Text, sondern auch für Blöcke, Eigenschaften, Ansichten und
Schemata. A ändert offline den Status, B die Priorität — beim Sync werden beide
Änderungen sauber zusammengeführt; bei echten Konflikten gibt es eine sichtbare
Auflösung. → *Warum nicht:* Text-CRDTs sind schon schwer; Datenbank- und
Rechte-CRDTs deutlich schwerer.

**9 · Ende-zu-Ende-Verschlüsselung pro Bereich**
Mit Wiederherstellung über Hardware-Schlüssel oder Vertrauenspersonen. →
*Warum nicht:* E2EE bricht Server-Suche, KI, Automationen, Vorschauen und
Integrationen; für jede Funktion müsste einzeln entschieden werden, was noch geht.

**33 · Sichere Sandbox für externe KI- und Automationsagenten**
Rechte als Fähigkeiten: *darf lesen: CRM, Deals · darf schreiben: Follow-up
Notes · darf nicht: löschen, teilen, exportieren · höchstens 100 Änderungen pro
Tag · Bestätigung nötig ab 10 000 €* — mit Protokoll, Simulation und Notausschalter.

### Erweiterbarkeit und Daten hinein/hinaus

**10 · Plugin-System wie VS Code**
Eigene Blocktypen, Eigenschaftstypen, Ansichten, Formelfunktionen,
Automationsaktionen, Seitenpanels, Importer — mit Rechtemodell, Prüfprozess und
Marktplatz. → *Warum nicht:* Plugins können Sicherheit, Leistung und Bedienung
ruinieren; Notion müsste Sandboxing, Rechte, Abrechnung und Qualitätskontrolle lösen.

**11 · Universeller Importer** aus Excel, Google Docs, Confluence, Airtable,
Trello, Asana, Jira, mit Vorschau und Zuordnung. → *Warum nicht:* jedes
Quellsystem hat andere Modelle, Rechte, Kommentare, Kennungen, Anhänge — ein
perfekter Import ist fast ein eigenes Produkt pro Quelle.

**12 · Verlustfreier Export und Restore** als offenes Archivformat
(`workspace.notionarchive`) mit Seiten, Blöcken, Datenbanken, Ansichten,
Relationen, Automationen, Formeln, Rechten, Kommentaren, Dateien, Versionen,
Kennungen und Agenten-Konfiguration.

### Suchen und Verstehen

**13 · Suche, die wirklich alles findet** — inklusive Anhängen, Bildern, Audio,
Video, Kommentaren, mit Synonymen und Bedeutung, und einer Abfragesprache:
`type:pdf author:Maria after:2025 "pricing model"`.

**28 · Föderierte Suche** über Notion, freigegebene externe Apps, OCR,
Transkripte, Meeting-Notizen, Mail, Kommentare, Anhänge und Versionsverlauf —
mit Antwortmodus: *„Zeig mir alle Entscheidungen zum Pricing seit Januar,
inklusive Slack-Kontext und Meeting-Zitaten."*

**25 · Universelle Objekt-Kennung und Bedeutung**
Jedes reale Objekt — Person, Firma, Projekt, Produkt, Vertrag, Meeting, Aufgabe,
Entscheidung, Datei — bekäme eine eindeutige Identität. Suche und KI wüssten:
„Acme", „Acme GmbH" und „ACME customer account" sind dasselbe. → *Warum nicht:*
falsches Zusammenführen wäre gefährlich; es braucht Bestätigung und gute
Dedupe-Logik.

**26 · Entscheidungs- und Wissensgraph**
Entscheidung, Datum, Beteiligte, Alternativen, Begründung, betroffene Projekte,
spätere Folgen — als Graph: *Entscheidung A beeinflusst Projekt B, widerspricht
Annahme C.*

### KI, die wirklich arbeitet

**6 · KI als Workspace-Architekt** — darf nach Bestätigung Datenbanken
entwerfen, Relationen anlegen, Formeln schreiben, Rollups bauen, Ansichten
erstellen, Automationen konfigurieren, Rechte vorschlagen, Leistungsprobleme
erkennen, kaputte Formeln reparieren, Dubletten zusammenführen — **immer mit
Plan, Diff und Rückgängig**.

**7 · Workspace-Wartungs-KI** — regelmässig ein „Gesundheitsbericht":
verwaiste Seiten, doppelte Datenbanken, kaputte Relationen, langsame Ansichten,
ungenutzte Eigenschaften.

**27 · KI mit dauerhaftem Gedächtnis und Verantwortung** — Agenten mit
ausdrücklichem Zustand: Aufgabenliste, Verantwortungsbereich, erlaubte Aktionen,
Kennzahlen, Wartungsplan, Eskalationsregeln, Änderungsprotokoll. Beispiel:
*„CRM-Agent: prüft jeden Freitag Dubletten, fehlende nächste Schritte und Deals
ohne Zuständigen."*

**35 · Meeting-zu-Aktion-Pipeline** — aus dem Transkript entstehen Aufgaben,
Projekte, Dokumente und Datenbankänderungen, mit Bestätigung und nachvollziehbarer
Quelle.

### Menschen

**29 · Mobile-First Power Mode** — schnelle Erfassung, Offline-Erfassung,
Sprache-zu-Datenbank, Kamera-zu-Datenbank, Scan-zu-PDF mit OCR, mobiler
Datenbank-Baukasten, bessere Formeleditoren, Wischgesten für Aufgaben,
einhändige Bedienung, lokale Warteschlange.

**30 · Barrierefreiheit als Kernarchitektur** — vollständige Tastaturbedienung,
bessere Screenreader-Struktur, semantische Blocknavigation, hoher Kontrast,
reduzierte Animationen, vereinfachte Oberfläche, Fokus-Modus,
legastheniefreundliche Darstellung, robuste Tabellennavigation, KI-Erklärung der
Seitenstruktur.

**31 · Preis nach echtem Verbrauch und Datenbesitz** — Speicher, KI-Guthaben,
Automationsläufe, Mitglieder, Gäste, Versionsverlauf, Datenstandort,
Plugin-Ausführung getrennt abgerechnet; dazu ein „Datenbesitz-Paket" mit
regelmässigen vollständigen Sicherungen, offenem Archivformat, garantiertem
Export, eigenen Schlüsseln und einem Restore-Test.

**32 · Notion als Betriebssystem für Daten** — klare Objektmodelle für Aufgaben,
Personen, Organisationen, Dateien, Termine, Ziele, Entscheidungen, Dokumente,
Verträge, Rechnungen, die andere Apps lesen und schreiben können.

### Der Kern, in den Worten der KI

> Notion wäre nicht 10 000-mal besser durch mehr Vorlagen, schönere Symbole oder
> noch eine Ansicht. Es wäre 10 000-mal besser, wenn es drei Dinge gleichzeitig
> löste:
>
> - **Datenbesitz** — lokal, exportierbar, verschlüsselbar, wiederherstellbar
> - **Datenlogik** — echte Datenbank, SQL, Constraints, Code, Tests, Automationen
> - **KI-Betrieb** — eine KI, die den Workspace nicht nur bedient, sondern sicher
>   baut, wartet, erklärt und repariert

---

<a id="teil-4"></a>
## Teil 4 — Was unsere App davon schon kann

Ehrlich, ohne Schönfärberei. ✅ = fertig · ◐ = teilweise · ✗ = nicht da.

| Idee | Wir | Wie es bei uns steht |
|---|:--:|---|
| **1 · Local-First** | ✅ | Alles liegt in IndexedDB im Browser. Kein Server ist nötig, auch nicht zum Start. Die App läuft sogar direkt von der Festplatte (`file://`). |
| **24 · Inhalte als offene Dateien** | ✅ | Export als Markdown, HTML, CSV, JSON — und ein vollständiger Sicherungsexport des ganzen Bestands. |
| **12 · Verlustfreier Export/Restore** | ✅ | Der JSON-Export enthält Blöcke, Datenbanken, Ansichten, Relationen, Formeln, Versionen. Wieder eingespielt kommt derselbe Stand heraus. |
| **23 · Bring Your Own Storage** | ✅ | Die Daten gehören dem Gerät. Wer will, legt die Sicherung auf seine eigene Festplatte oder in sein eigenes Git. |
| **22 · Self-Hosting** | ✅ | Eine einzelne HTML-Datei. Sie läuft auf jedem Webspace, auf Cloudflare Pages oder gar nicht im Netz. |
| **9 · Verschlüsselung** | ◐ | Die Daten verlassen das Gerät nicht — das ist der stärkste Schutz. Eine eigene Passwortverschlüsselung des Bestands gibt es noch nicht. |
| **6 · Zufallsfunktionen** | ✅ | `random()` und `randomBetween(a, b)` — siehe Teil 5. Notion hat das nicht. |
| **4 · Formeln als echte Sprache** | ◐ | Eigene Sprache mit Zerleger, Parser und Auswerter, ohne `eval`. 99 von 99 Notion-Merkmalen. Eigene Funktionen definieren geht noch nicht. |
| **3 · Keine 15-Ebenen-Grenze** | ✅ | Wir rechnen lokal; es gibt keine Serverkette, die begrenzt werden müsste. |
| **8 · Listenverarbeitung** | ✅ | `map`, `filter`, `find`, `some`, `every`, `unique`, `flat`, `sort` — plus `reduce`, `groupBy`, `sortBy`, siehe Teil 5. |
| **4 · Zeilenverweise, laufende Summen** | ✅ | `rowNumber()`, `previous()`, `next()`, `runningSum()`, `rank()` — siehe Teil 5. Genau das, was Notion nicht hat. |
| **9 · Werktage und Zeitzonen** | ✅ | `businessDaysBetween`, `addBusinessDays`, `isWeekend`, `startOfMonth`, `endOfMonth`, `startOfQuarter` — siehe Teil 5. |
| **13 · Suche, die alles findet** | ◐ | Volltextsuche über alle Seiten, Blöcke und Zeilen, Suche nach Seiten-ID, Befehlspalette. OCR und Transkripte fehlen. |
| **16 · Datenvalidierung** | ✗ | Noch nicht. Steht in Teil 5 auf der Liste. |
| **2 · Pivot / Kreuztabellen** | ✗ | Noch nicht. Steht in Teil 5 auf der Liste. |
| **12 · Bedingte Formatierung** | ◐ | Bedingte Farbe je Ansicht ist da; Datenbalken und Farbskalen fehlen. |
| **15 · Dashboards** | ◐ | Diagrammansichten und eine Analyse-Seite gibt es; ein freier Dashboard-Baukasten fehlt. |
| **5 · Automationen als Code** | ◐ | Knöpfe mit Aktionsketten, wiederkehrende Aufgaben, Agenten. If/Else in Aktionsketten fehlt. |
| **10 · Plugin-System** | ◐ | MCP in beide Richtungen ist da. Ein Blocktyp-Plugin-System nicht. |
| **11 · Universeller Importer** | ◐ | XLSX, DOCX, EPUB, CSV, Markdown, HTML, Web-Clipper. Confluence/Trello/Asana fehlen. |
| **3 · Workspace als Git** | ◐ | Versionsverlauf je Seite mit Wiederherstellen. Zweige und Diffs fehlen. |
| **29 · Mobile-First** | ✅ | Bottom Sheets, Fusszeile, Wischgesten, PWA für das iPhone. |
| **30 · Barrierefreiheit** | ◐ | Vollständige Tastaturbedienung, Fokus-Modus, Schriftgrössen, hoher Kontrast. Screenreader-Feinschliff fehlt. |
| **31 · Preis** | ✅ | Kostenlos. Es gibt keinen Server, der bezahlt werden müsste. |
| **6/7/27 · KI, die den Workspace baut** | ◐ | Die KI kann Seiten, Datenbanken und Zeilen anlegen und Agenten laufen lassen. Formeln und Automationen selbst bauen darf sie noch nicht. |
| **18 · Schema-Ansicht** | ◐ | Der Graph zeigt Seitenverknüpfungen, nicht das Datenmodell. |
| **20 · Tests** | ✗ | Wir testen die App, nicht die Formeln des Nutzers. |
| **21 · Feldrechte** | ✗ | Es gibt nur einen Nutzer — bisher kein Thema. |
| **36 · Simulator** | ✗ | Noch nicht. |

**Die kurze Bilanz.** Beim ersten Punkt der Liste — *Datenbesitz* — ist unsere
App fertig, und zwar nicht als Kompromiss, sondern von Grund auf: die Daten
liegen auf dem Gerät, sie sind exportierbar, die App läuft ohne Netz und ohne
Server. Beim zweiten Punkt — *Datenlogik* — sind wir bei den Formeln inzwischen
über Notion hinaus und bei Constraints und Pivot noch nicht angekommen. Beim
dritten — *KI-Betrieb* — kann unsere KI mehr als Notions Agent (sie darf
Datenbanken anlegen), aber noch nicht alles.

---

<a id="teil-5"></a>
## Teil 5 — Was wir als Nächstes bauen

Aus den 21 Lücken und 36 Ideen die Dinge herausgezogen, die **wir** bauen
können — sortiert danach, was am meisten bringt und am wenigsten kostet.

### Sofort, in dieser Runde gebaut ✅

Alles, was Notion in seiner eigenen Formelsprache **nicht** hat und was bei
uns ohne Serverumbau geht:

| Neu bei uns | Was es tut | Notion |
|---|---|:--:|
| `random()` | Zufallszahl zwischen 0 und 1 | ✗ |
| `randomBetween(a, b)` | Ganze Zufallszahl von a bis b | ✗ |
| `rowNumber()` | Nummer dieser Zeile in der Ansicht | ✗ |
| `previous(name)` | Wert derselben Spalte in der Zeile davor | ✗ |
| `next(name)` | … in der Zeile danach | ✗ |
| `runningSum(name)` | Laufende Summe bis zu dieser Zeile | ✗ |
| `runningCount()` | Laufende Zählung | ✗ |
| `rank(name)` | Rang dieser Zeile, grösster Wert = 1 | ✗ |
| `percentOfTotal(name)` | Anteil am Gesamtwert der Ansicht | ✗ |
| `reduce(liste, start, ausdruck)` | Liste zu einem Wert zusammenfalten | ✗ |
| `groupBy(liste, ausdruck)` | Liste nach Schlüssel gruppieren | ✗ |
| `sortBy(liste, ausdruck)` | Liste nach Schlüssel sortieren | ✗ |
| `businessDaysBetween(a, b)` | Werktage zwischen zwei Daten | ✗ |
| `addBusinessDays(d, n)` | n Werktage dazuzählen | ✗ |
| `isWeekend(d)` | Fällt das Datum aufs Wochenende? | ✗ |
| `startOfMonth` / `endOfMonth` | Monatsanfang, Monatsende | ✗ |
| `startOfWeek` / `endOfWeek` | Wochenanfang, Wochenende | ✗ |
| `startOfQuarter` / `endOfQuarter` | Quartalsanfang, Quartalsende | ✗ |
| `startOfYear` / `endOfYear` | Jahresanfang, Jahresende | ✗ |
| `convertTimezone(d, von, nach)` | Zeitzone umrechnen | ✗ |
| `formatDate(d, muster, zone)` | Datum in einer Zeitzone formatieren | ✗ |
| `countWhere(db, bedingung)` | Zeilen einer **fremden** Datenbank zählen | ✗ |
| `sumWhere(db, bedingung, wert)` | … summieren | ✗ |
| `findRows(db, bedingung)` | … als Liste holen | ✗ |
| `firstWhere` / `lastWhere` | … erste/letzte Zeile holen | ✗ |

Damit lassen sich die Aufgaben lösen, die in Teil 2 als unmöglich stehen:
laufender Kontostand, Differenz zum Vortag, Rangliste, fortlaufende Nummer,
zufällige Karteikarte, Werktage bis zur Frist, Summe aller Rechnungen eines
Kunden ohne Relation.

### Als Nächstes

1. **Pivot-Ansicht** — Zeilen × Spalten × Werte, mit Zwischensummen und
   „Prozent vom Gesamt". Der grösste einzelne Gewinn aus der Liste.
2. **Datenvalidierung** — `required`, `unique`, Regex, Min/Max,
   Statusübergangsregeln; Warnung beim Speichern statt stiller Datenmüll.
3. **Automatische Relation und Dedupe** — Zeilen bei gleicher E-Mail oder
   gleichem Namen verknüpfen, Dubletten finden und zusammenführen, Upsert beim
   CSV-Import.
4. **If/Else in Aktionsketten** — Knöpfe und Automationen mit Bedingungen und
   einer Schleife über gefilterte Zeilen.
5. **Eigene Formelfunktionen** — `def istWerktag(d) = …`, einmal pro Bestand
   definiert, überall nutzbar.
6. **Bedingte Formatierung** — Datenbalken, Farbskalen, Zeilenfarbe per Formel.
7. **Formel-Werkstatt** — Zwischenergebnisse anzeigen, Fehlerstelle markieren,
   Formel automatisch einrücken.
8. **Verschlüsselter Bestand** — Passwort beim Öffnen, AES über die
   IndexedDB-Inhalte.

---

## Quellen

- Notion-KI im laufenden Notion, Runde 4 (21 Lücken) und Runde 5 (36 Ideen)
- Belege zu allen harten Zahlen: `WAS-NOTION-NICHT-KANN.md`
- Vollständige Funktionsliste und Messlauf: `FORMELN-ALLES.md`
