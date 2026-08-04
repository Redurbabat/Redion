# LUECKEN.md

Diese Datei listet auf, was Redion noch fehlt.

```txt
Eine Lücke ist nicht automatisch eine Aufgabe.
Eine Lücke beschreibt den Produktzustand.
AUFGABEN.md entscheidet, wann und wie daran gearbeitet wird.
ENTSCHEIDUNGEN.md erklärt, warum bestimmte Wege gewählt wurden.
```

Zeichen: ✅ vorhanden · ◐ teilweise · ✗ fehlt · ⚠ Risiko

---

## Stand

**4. August 2026 · 78 Prüfläufe grün**

Stark in: local-first · Offline · blockbasierter Editor · Datenbanken ·
Formeln · lokale KI · Versionen · Papierkorb · `.json`- und
`.redion`-Sicherung mit Anhängen · Tests.

**Die drei Lücken, die alles andere aufhalten**

```txt
1. quell/ ist noch JavaScript — die TypeScript-Grundlage steht, der Umzug nicht
2. Der Spreadsheet-Block fehlt — die Rechenkraft ist da, die Tabelle nicht
3. Sync-Konflikte sind ungeprüft — und das blockiert die ganze Cloud
```

---

# Sehr hohe Priorität

## L1 · Die TypeScript-Migration selbst

**Stand** — ◐ die Grundlage steht, der Bestand ist noch JavaScript.

```txt
✅ tsconfig.json · npm run typecheck · CI-Typecheck
✅ tsconfig.bauen.json · npm run bauen:ts · test105
✅ src/core/types/ — sieben Dateien, englisch, aus dem Code gemessen
✅ src/core/helpers/ids.ts — die erste migrierte Laufzeitdatei
✗  die übrigen 96 Dateien unter quell/
```

**Was fehlt zuerst** — Datum · Objekte · Bremse · Melder · Säubern · Bytes.
Alle klein und DOM-frei.

**Warum wichtig** — ohne Typen bleiben Datenmodell, Backup, Import/Export,
Dateien, Sync, Rechte und Cloudflare Bereiche, in denen ein Tippfehler erst
im Betrieb auffällt.

**Status** — ⏳ läuft. Siehe `AUFGABEN.md` Phase 6.

## L2 · Die Code-Sprache ist entschieden, aber nicht durchgezogen

**Stand** — ◐ neu seit `ENTSCHEIDUNGEN.md` E27.

Neuer TypeScript-Code ist englisch, Nutzertexte und Dokumentation bleiben
deutsch. Umgesetzt ist das für `src/`; die 96 Dateien unter `quell/` sind
weiter deutsch benannt.

**Das ist kein Versehen, sondern die Regel** — massenhaft umbenannt wird
nicht. Eine Datei wechselt die Sprache nur, wenn sie ohnehin migriert wird,
und dann gemessen: `ids.ts` hatte fünfzehn Aufrufe in drei Dateien.

**Was fehlt** — bei jeder künftigen Migration die Aufrufer **zählen**, bevor
die Schnittstelle umbenannt wird. `Saeubern` hat deutlich mehr als
`Kennungen` hatte.

**Status** — ⏳ Regel gilt, Umsetzung wandert mit der Migration.

## L3 · Der Spreadsheet-Block

**Stand** — ✗ es gibt keinen.

Die Rechenkraft ist da: 158 Formelfunktionen, davon 61 unter deutschem
Excel-Namen. Was fehlt, ist das **Zellraster**.

```txt
✗ Spreadsheet-Block · Zellen · A1-Bezüge · Bereiche A1:C10
✗ automatische Neuberechnung · Abhängigkeiten · Zirkelbezüge
✗ Spreadsheet-Ansicht für Datenbanken · Copy/Paste · Masseneingabe
```

**Vorher zu entscheiden** — Fehlerwerte, siehe L4.

**Status** — ⏳ hoch. `AUFGABEN.md` Phase 7.

## L4 · Fehlerwerte — die offene Architekturfrage

**Stand** — ⚠ blockiert `WENNFEHLER`, `ISTFEHLER` und die Fehleranzeige im
Spreadsheet.

Redions Laufzeit ist **abwehrend** gebaut und erzeugt keine Fehlerwerte:

```txt
1 / 0        →  0
WURZEL(-1)   →  0
WERT("abc")  →  0
```

Excels `WENNFEHLER` fängt `#DIV/0!` und `#WERT!` — hier gäbe es nichts zu
fangen.

**Warum es keine Formelaufgabe ist** — echte Fehlerwerte wären eine Änderung
am Rechnen selbst und änderten das Ergebnis **bestehender Formelspalten in
bestehenden Datenbanken**: wo heute `0` steht, stünde ein Fehler. Das ist
Priorität 1 und braucht Migrationsgedanken.

`test106` Abschnitt 4d hält den heutigen Zustand fest, damit er eine
Entscheidung bleibt und nicht zu einer Lücke wird, die jemand aus Versehen
füllt.

**Status** — ⏳ Entscheidung offen. `ENTSCHEIDUNGEN.md` E24, Regel 3.

## L5 · Sync-Konflikte zwischen Geräten

**Stand** — ◐ der Abgleich existiert, die Konfliktfälle sind ungeprüft.

**Was fehlt** — Prüfläufe für: Gerät A ändert offline · Gerät B ändert
dieselbe Seite · A kommt online · Konflikt wird **sichtbar** · keine Daten
verloren · Anhänge bleiben mit ihren Blöcken verbunden.

**Status** — ⏳ **vor** echtem Cloud-Sync. Ohne diese Läufe ist Sync ein
Datenverlustrisiko.

---

# Hohe Priorität

## L6 · Cloudflare R2 für Dateien

**Stand** — ◐ der Server ist vorbereitet, R2 als Produktfunktion nicht.

Fehlt: Bucket-Struktur · Upload · Download · Rechteprüfung ·
Datei-Metadaten · `.redion` und Anhänge in R2 · Speichergrenzen.

**Regel** — grosse Dateien gehören nicht in D1 (`ENTSCHEIDUNGEN.md` E2).

## L7 · Konto-Modus

**Stand** — ◐ Server- und Kontologik existieren, der Nutzerfluss nicht.

Fehlt: Registrierung · Login · Sitzungen · Logout · lokal bleiben ·
lokal + Sync wählen · Cloud-Arbeitsbereich · Offline-Paket herunterladen ·
Konto löschen · alles exportieren.

**Regel** — ein Konto darf nie Pflicht sein, und lokale Daten werden nie
ungefragt hochgeladen (E1).

## L8 · Rechte und Freigaben produktionsreif machen

**Stand** — ◐ Rechte existieren, Spaltenrechte greifen in Oberfläche und
Server.

Fehlt: serverseitige Prüfung vollständig · öffentliche Seiten sicher
trennen · private Anhänge nicht mitliefern · Feldrechte · Kommentarrechte ·
Widerruf testen.

## L9 · 129 Formelfunktionen ohne Beschreibung

**Stand** — ◐ 158 Funktionen, **129 ohne Beschreibung**.

Eine Funktion, die niemand findet, ist fast wie nicht vorhanden. Die
Gegenprobe existiert: `Register.formeln.abgleich()` nennt sie beim Namen.

Fehlt je Funktion: Signatur · Beschreibung · Beispiel · Fehlerfall ·
Kategorie.

## L10 · Mobile und iPhone

**Stand** — ◐ die App läuft mobil, ist aber nicht dafür gebaut.

Fehlt: Test auf iPhone 13 Pro Max · Touch-Editor · mobile
Datenbankansicht · mobile Tabellenansicht · Dateiimport und -export mobil ·
Tastaturverhalten · Side Peek auf kleinen Bildschirmen.

## L11 · Agenten-Sicherheit

**Stand** — ✗ es gibt keine Grenzen.

Fehlt: Notausschalter · Tageslimit · Rechte je Agent · Protokoll ·
Bestätigung vor jeder ändernden Handlung.

## L12 · Barrierefreiheit

**Stand** — ◐ Grundlagen da, nicht geprüft.

Fehlt: Screenreader-Durchlauf · Fokusreihenfolge · Kontrast in hell und
dunkel · keine Information nur über Farbe · Escape schliesst Overlays.

## L13 · Prüfläufe für migrierten TypeScript-Code

**Stand** — ◐ Typecheck da, Ausführung nicht.

Solange `noEmit` galt, beschrieb TypeScript nur Daten. Seit `ids.ts` läuft
migrierter Code wirklich — und muss wie jeder andere unter den bestehenden
Läufen stehen.

Fehlt: ein Muster, wie migrierte Helfer geprüft werden, ohne dass jeder
seinen eigenen Lauf bekommt.

---

# Mittlere Priorität

## L14 · ZIP64 / Dateien über 4 GB

**Stand** — ◐ die Grenzen melden sich ehrlich, ZIP64 fehlt.

```txt
eine Datei          4 GB      geprüft, klare Meldung
das ganze Archiv    4 GB      geprüft, klare Meldung
Anzahl Einträge     65 535    geprüft, klare Meldung
fremdes ZIP64                 wird erkannt und abgelehnt
```

Die heutige Regel ist **eine ehrliche Fehlermeldung statt eines kaputten
Archivs**. Solange sie gilt, verliert niemand unbemerkt Daten.

Fehlt: die Entscheidung, ob ZIP64 kommt.

## L15 · Bedingte Formatierung

Fehlt: Zellfarbe und Zeilenfarbe nach Regel · Datenbalken · Farbskalen ·
Symbolregeln · Duplikate und überfällige Werte markieren.

## L16 · Automationen erweitern

**Stand** — ◐ 11 Aktionsarten, ohne Verzweigung und Schleife.

Fehlt: If/Else · sonst-Zweig · für jede Zeile · Vorschau vor der
Ausführung · Protokoll · Fehleranzeige.

## L17 · Dashboards und Pivot ausbauen

Fehlt: mehrere Datenquellen je Dashboard · KPI-Karten · Layout ·
Diagrammquellen · Pivot mit Prozent von Gesamt.

## L18 · XLSX und ODS

**Stand** — ◐ einfaches Lesen und Schreiben gibt es.

Fehlt: mehrere Blätter · Formeln · Zellformatierung · Kommentare · Bilder ·
Diagramme · bedingte Formatierung · ODS ganz.

## L19 · Fehlende oder ungeprüfte Blocktypen

**Stand** — ◐ 58 von 97 gemessen; welche wirklich fehlen, ist ungeprüft.

Kandidaten: Breadcrumb · Synced database view · Relation preview · AI
summary block · File gallery · Button automation block.

## L20 · Markdown- und Tastenkürzel

**Stand** — ◐ Markdown 23 von 48 · Tastenkürzel 127 von 160.

Fehlt: Zeile-für-Zeile-Vergleich · Konflikte prüfen · deutsche Tastatur ·
Mac/Windows · Übersicht in der App.

## L21 · Vollständige Verschlüsselung

**Stand** — ◐ einzelne Seiten und die Sicherung lassen sich verschlüsseln.

Fehlt: verschlüsseltes `.redion` (heute deckt die verschlüsselte Sicherung
nur den Textbestand ab) · verschlüsselte Anhänge · Schlüsselwechsel.

## L22 · Leistung bei sehr grossen Arbeitsbereichen

Fehlt: Messungen mit zehntausend Seiten · virtualisierte Listen ·
Suchindex, der nicht bei jedem Start neu entsteht · Speichermessung bei
Export und Import.

---

# Später

## L23 · Abfragesprache für normale Nutzer

Suche über Titel, Inhalt, Zeilen und Kennungen mit einfacher Syntax.

## L24 · Entscheidungs- und Wissensgraph

Backlinks gibt es; der Graph, die Entscheidungsblöcke und die Quellenpflege
fehlen.

## L25 · Universelle Begriffe und Aliase

Ein Begriff, viele Schreibweisen — damit Suche und Verknüpfung ihn trotzdem
finden.

## L26 · Import aus anderen Werkzeugen

Trello, Evernote, Obsidian, Notion-Export und CSV gibt es. Asana, Jira und
Apple Notes fehlen.

## L27 · Import-Assistent (Power-Query-ähnlich)

Spalten bereinigen · Typen erkennen · Werte ersetzen · Duplikate entfernen ·
Dateien kombinieren · Vorschau vor dem Übernehmen.

## L28 · Was-wäre-wenn: Zielwertsuche, Szenarien, Solver

Zielwert eingeben und rückwärts rechnen · Best/Normal/Worst Case ·
einfache Optimierung.

## L29 · Suche in Bildern, PDFs und Audio

OCR für Bilder und PDFs · Audio-Transkription · Suchindex erweitern.

## L30 · Erweiterungen und Marktplatz

Erweiterung installieren · Rechte anzeigen · Sandbox · deaktivieren ·
löschen · Signaturen.

## L31 · Öffentliche Seiten, SEO und Demo

Demo-Modus · `robots.txt` · `sitemap.xml` · `ai.txt` · Export als statische
Seite · keine privaten Daten für Crawler.

## L32 · Die 62 Integrationen

**Stand** — ◐ 8 von 62. Die meisten brauchen OAuth-Geheimnisse und damit
einen Server; ohne ihn geht nur, was einen persönlichen Schlüssel
akzeptiert. Siehe `ENTSCHEIDUNGEN.md` E23.

---

# Anhang A · Was gemessen wurde

Diese Zahlen sind die Grundlage für mehrere Lücken. Sie stehen hier, damit
sie nicht neu gemessen werden müssen.

| Liste | Notion | Redion | Stand |
|---|--:|--:|:--:|
| Blocktypen | 97 | 58 | ◐ |
| Eigenschaftstypen | 29 | 35 | ✅ |
| Ansichten | 11 | 12 | ✅ |
| Tastenkürzel | 160 | 127 | ◐ |
| Markdown-Kürzel | 48 | 23 | ◐ |
| Einstellungs-Optionen | 111 | 143 | ✅ |
| Formelfunktionen | 125 | 158 | ✅, aber 129 ohne Beschreibung |
| Excel-Startpaket | 63 | 61 | ✅, 2 fehlen mit Absicht |
| Integrationen | 62 | 8 | ◐ — siehe E23 |

**Nicht gezählt:** Bedienelemente (Notion: 175) · Trigger, Bedingungen und
Aktionen (15/24/19) · Aggregationen (21).

**Wie gezählt wurde.** Nicht per `grep` über `id:` — das zählt Kommentare und
Beispiele mit. Die Register wurden **geladen und befragt**, mit der
Formel-Laufzeit daneben. Die erste Messung ohne das lag um den Faktor zehn
daneben: 12 Kürzel statt 127, 20 Formeln statt 158. Siehe `ENTSCHEIDUNGEN.md`
E21.

---

# Anhang B · Was erledigt ist

Eine Zeile je Punkt, mit dem Prüflauf, der ihn hält.

**Etappe 1 — die lokale App stabil machen**

| | was es war | hält es |
|---|---|---|
| E1 | Der Umzug einer alten Ablage war nie durchgespielt worden | `test95` |
| E2 | Die Sicherung enthielt den Versionsverlauf nicht | `test96` |
| E3 | Der Papierkorb zeigte keine Blöcke; „endgültig gelöscht" liess Fassungen und Anhänge liegen | `test97` |
| E4 | Dreissig Fassungen reichten zwei Stunden zurück — jetzt wird ausgedünnt | `test98` |
| E5 | Zwei Tabs wussten nichts voneinander und überschrieben einander | `test99` |
| E6 | Anhänge fehlten in der Sicherung — jetzt `.redion`, auch mit 500 MB | `test100` |

**Sicherheit und Rechte**

| | was es war | hält es |
|---|---|---|
| D1 | Keine Obergrenze für den Anfragekörper | `test101` |
| D2 | Kein Bremsen bei Fehlversuchen an Login und öffentlichen Seiten | `test93` |
| D3 | Sicherheits-Kopfzeilen fehlten für die Antworten des Workers | `test93`, `test94` |
| D4 | Der 500er gab die Meldung einer Ausnahme ungeprüft nach draussen | `test93` |
| D5 | Eine Marke mit „nur lesen" konnte sich selbst eine mit „alles" ausstellen | `test102` |
| D6 | „Rechts einfügen" setzte die Spalte manchmal ganz nach links | `test33` |

**Sicherung und Format**

| | was es war | hält es |
|---|---|---|
| C1 | Ein ZIP mit 70 000 Einträgen nannte 4 464 und sah gesund aus | `test103` |
| C2 | Ein fremdes ZIP64-Archiv importierte als „0 Anhänge", ohne Fehler | `test103` |
| C3 | Die verschlüsselte Wiederherstellung meldete Erfolg und warf die Daten 900 ms später weg | `test104` |
| C4 | Verschlüsseln scheiterte ab ~128 KB — dieselbe Zeile an drei Stellen | `test104`, `test87` |
| C5 | Die verschlüsselte Sicherung enthielt weder Verlauf noch `fehlt`-Angabe | `test104` |

**Formeln und Excel**

| | was es war | hält es |
|---|---|---|
| X1 | 37 Excel-Funktionen liefen, keine unter deutschem Namen | `test106` |
| X2 | `WENN` rechnete den nicht genommenen Zweig mit, `if` nicht | `test106` |
| X3 | `ABRUNDEN(-2,5)` gab −3 statt −2 — floor statt „zur Null hin" | `test106` |
| X4 | Elf deutsche Namen zeigten auf Funktionen mit anderer Bedeutung | `test106` |
| X5 | Suche/Verweis fehlte ganz — `SVERWEIS`, `SUMMEWENN`, `INDEX`, `FILTER` | `test107` |
| X6 | `namen()` verschwieg neun Funktionen, die die Maschine kann | `test107` |

**TypeScript**

| | was es war | hält es |
|---|---|---|
| B1 | Keine Typen, kein Typecheck | `npm run typecheck` |
| B2 | Kein Weg von `.ts` nach `.js` ohne Pflicht-Bauschritt | `test105` |
| B3 | Erzeugtes JavaScript konnte still von seiner Quelle abdriften | `test105` |

**Umbauten am Aufbau** — Seitenleiste, Kopfleiste und Inhaltsfläche aus
`schale.js` herausgelöst · Stilblatt in sechs Dateien geteilt · `datenbanken`
und `wissen` in `dienst` und `ansicht` getrennt · PWA und Icons repariert.

Die zwölf Muss-Regeln Sicherheit aus dem Auftrag sind alle erfüllt: Tokens und
Passwörter nur als Abdruck · zeitkonstanter Vergleich · HTML gesäubert · keine
ungeprüften Weiterleitungen nach OAuth · CORS eingeschränkt · serverseitige
Rechte · keine geheimen Schlüssel im Frontend · Eingaben begrenzt · Bremse ·
Kopfzeilen · keine sensiblen Daten in Logs.
