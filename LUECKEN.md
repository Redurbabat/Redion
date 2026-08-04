# LUECKEN.md

Diese Datei listet auf, was Redion noch fehlt.

Wichtig:

```txt
Eine Lücke ist nicht automatisch eine Aufgabe.
Eine Lücke beschreibt den Produktzustand.
AUFGABEN.md entscheidet, wann und wie daran gearbeitet wird.
ENTSCHEIDUNGEN.md erklärt, warum bestimmte Wege gewählt wurden.
```

Zeichen:

```txt
✅ vorhanden
◐ teilweise vorhanden
✗ fehlt
⏳ geplant
⚠ Risiko / muss geprüft werden
```

---

## Stand

**Stand: 4. August 2026 · 75 Prüfläufe grün**

Redion ist bereits stark in: local-first · Offline-Nutzung · blockbasierter
Editor · Datenbanken · Formeln · lokale KI · Versionen · Papierkorb ·
JSON-Sicherung · `.redion`-Sicherung mit Anhängen · Tests

Die grössten aktuellen Lücken:

```txt
1. TypeScript-Migration: Grundlage steht, der Bestand ist noch JavaScript
2. Doku muss die neue Richtung zeigen
3. Cloudflare/R2/Sync sind noch nicht produktionsreif
4. Nicht alle Notion-Funktionen sind erreicht
5. Mobile/iPhone braucht gezielte Prüfung
6. Tabellenkalkulation fehlt ganz (L31/L32)
```

---

## L1 · TypeScript

**Stand** — ⏳ die Grundlage steht, der Bestand ist noch JavaScript.

GitHubs Sprachleiste zeigte für das Repository lange nur HTML, CSS,
JavaScript und Batchfile — schlicht deshalb, weil keine `.ts`-Datei darin
lag. Seit Phase 2 liegen sieben.

**Was steht**

```txt
tsconfig.json                  strict + noUncheckedIndexedAccess
typescript als devDependency   5.9.3
npm run typecheck              tsc --noEmit, gegengeprüft
src/core/types/                sieben Dateien, aus dem Code gemessen
doku/TYPESCRIPT-MIGRATION.md   TS-0 bis TS-10
TypeScript in GitHub Actions   im schnellen Job, vor allem anderen
```

**Dazu seit TS-3**

```txt
tsconfig.bauen.json     src/kern/*.ts  →  quell/*.js
npm run bauen:ts
src/global.d.ts         Typen ohne import (module: none)
src/kern/helfer/kennungen.ts    die erste migrierte Datei
test105.mjs             erzeugtes .js gegen seine .ts-Quelle
```

Der Weg von `.ts` nach `.js` ist entschieden: das erzeugte JavaScript wird
mitversioniert und landet unter dem Pfad, den `index.html` und `sw.js`
ohnehin laden. Ein Bauschritt für den Entwickler, keiner für den Nutzer —
die App startet weiterhin per Doppelklick.

**Was fehlt**

```txt
die übrigen kleinen Helfer (datum, objekte, bremse, melder, saeubern, bytes)
und alles danach bis TS-10
```

**Warum wichtig**

Redion wird gross. Ohne Typen werden diese Bereiche riskant: Datenmodell ·
Blocktypen · Datenbank-Schema · Backup · Import/Export · Dateien · Sync ·
Rechte · Cloudflare

**Ziel** — vollständig TypeScript, aber schrittweise. Siehe
`ENTSCHEIDUNGEN.md` E6 und E7.

**Status** — ⏳ Grundlage erledigt, Migration offen. Sehr hohe Priorität.

---

## L2 · Alte JavaScript-Aussage in der Doku

**Stand** — ⚠ eine Stelle sagt noch das Gegenteil der neuen Richtung.

**Nicht mehr die README** — die wurde neu geschrieben und sagt es nicht mehr.
Es steht in **`CLAUDE.md:1564`**:

> Redion ist aktuell klassisches HTML/CSS/JavaScript ohne Build-Pflicht.

**Ziel**

```txt
Redion bleibt einfach startbar.
Redion wird schrittweise auf TypeScript migriert.
Die Einzeldatei und die Offline-Nutzung bleiben erhalten.
```

**Status** — ⏳ geplant.

---

## L3 · `.redion`-Formatdokumentation

**Stand** — ✅ vorhanden: `doku/REDION-FORMAT.md`.

Enthält: warum zwei Formate · Aufbau des Archivs · `daten.json` ·
`dateien.json` · Dateinamen- und Kennungsregeln · die zwei Einspielarten und
warum es keine Vorgabe gibt · die drei ZIP-Grenzen · ZIP64 beim Lesen · die
verschlüsselte Sicherung · wie man ein `.redion` ohne Redion öffnet.

**Was noch fehlt** — ein eigenes Formatkennzeichen in `daten.json` (heute
wird am Vorhandensein der Datei im Archiv erkannt) und eine Prüfsumme über
den Inhalt als Ganzes; das ZIP prüft nur jeden Eintrag einzeln per CRC32.

**Status** — ✅ erledigt, zwei kleine Punkte offen.

---

## L4 · ZIP64 / Dateien über 4 GB

**Stand** — ◐ grosse Dateien werden stückweise behandelt, ZIP64 fehlt.

**Aktuelle Regel**

```txt
Über 4 GB: klare Fehlermeldung, kein kaputtes Archiv.
```

**Was fehlt** — die Entscheidung, ob ZIP64 eingebaut wird · Tests mit
simulierten Grössen · Dokumentation

**Status** — ⏳ später.

---

## L5 · Cloudflare R2 für Dateien

**Stand** — ◐ der Server ist vorbereitet, R2 als Produktfunktion noch nicht.

**Was fehlt**

```txt
R2-Bucket-Struktur · Upload-API · Download-API
Rechteprüfung · Datei-Metadaten
Backup in R2 · .redion aus R2 herunterladen
Speicherlimits · Fehlermeldungen
```

**Warum wichtig**

D1 ist für grosse Dateien ungeeignet. Anhänge, Videos und `.redion`-Pakete
gehören nach R2.

**Status** — ⏳ geplant.

---

## L6 · Konto-Modus

**Stand** — ◐ Server- und Kontologik existieren, der Nutzerfluss nicht
vollständig.

**Was fehlt**

```txt
Registrierung/Login · Sitzungen · Logout
lokal bleiben · lokal + Sync wählen · Cloud-Arbeitsbereich wählen
Offline-Paket herunterladen · Konto löschen · Daten exportieren
```

**Wichtig** — ein Konto darf nie Pflicht sein (`ENTSCHEIDUNGEN.md` E1).

**Status** — ⏳ geplant.

---

## L7 · Sync-Konflikte zwischen Geräten

**Stand** — ◐ der Abgleich existiert, die Konfliktfälle sind nicht
durchgeprüft.

**Was fehlt** — Prüfläufe für:

```txt
Gerät A ändert eine Seite offline
Gerät B ändert dieselbe Seite
A kommt online
Konflikt entsteht und wird sichtbar
keine Daten gehen verloren
Anhänge werden nicht von ihren Blöcken getrennt
```

**Status** — ⏳ wichtig **vor** echtem Cloud-Sync.

---

## L8 · Rechte und Freigaben produktionsreif machen

**Stand** — ◐ Rechte existieren, Spaltenrechte greifen in Oberfläche und
Server.

**Was fehlt**

```txt
serverseitige Rechteprüfung vollständig
öffentliche Seiten sicher trennen
private Anhänge nicht mitliefern
Feldrechte · Kommentarrechte · Widerruf testen
öffentliche Links begrenzen
```

**Status** — ⏳ geplant.

---

## L9 · Formelfunktionen ohne Beschreibung

**Stand** — ◐ 158 Funktionen vorhanden, **129 ohne Beschreibung**.

**Was fehlt** — je Funktion: Name · Signatur · Beschreibung · Beispiel ·
Fehlerfall · Kategorie

**Warum wichtig**

Eine Funktion, die niemand findet, ist fast wie nicht vorhanden. Die
Gegenprobe existiert bereits: `Register.formeln.abgleich()` meldet
`ohneFunktion: 0` und `ohneBeschreibung: 129`.

**Status** — ⏳ mittlere Priorität.

---

## L10 · Fehlende oder ungeprüfte Blocktypen

**Stand** — ◐ 58 von 97 gemessen; welche wirklich fehlen, ist ungeprüft.

**Was fehlt** — Zeile-für-Zeile-Vergleich · fehlende Blöcke benennen · keine
doppelten Blockarten erfinden · nach Nutzen priorisieren

Mögliche Kandidaten: Breadcrumb · Synced database view · Relation preview ·
Advanced table · AI summary block · File gallery · Mention database row ·
Button automation block

**Status** — ⏳ prüfen.

---

## L11 · Markdown-Kürzel

**Stand** — ◐ 23 von 48.

**Was fehlt** — mehr Blockkürzel · mehr Inline-Kürzel · bessere Umwandlung ·
mobile Unterstützung · Tests

**Status** — ⏳ später.

---

## L12 · Tastenkürzel

**Stand** — ◐ 127 von 160.

**Was fehlt** — Zeile-für-Zeile-Vergleich · Konflikte prüfen · deutsche
Tastatur prüfen · Mac/Windows-Unterschiede · Übersicht in der App

**Status** — ⏳ später.

---

## L13 · Automationen

**Stand** — ◐ 11 Aktionsarten, aber ohne Verzweigung und Schleife.

**Was fehlt**

```txt
If/Else · sonst-Zweig · fuerJede über gefilterte Zeilen
Trigger und Bedingungen vollständig zählen
Vorschau · Testmodus · Fehlerprotokoll
```

**Status** — ⏳ mittlere Priorität.

---

## L14 · Datenbank-Dashboards

**Stand** — ◐ Ansichten `chart` und `dashboard` existieren.

**Was fehlt** — freier Baukasten · mehrere Datenquellen pro Dashboard ·
Karten · Kennzahlen · Diagrammblöcke · Filter über mehrere Quellen · Layout
speichern

**Status** — ⏳ später.

---

## L15 · Bedingte Formatierung

**Stand** — ◐ Farbe je Ansicht vorhanden.

**Was fehlt** — Datenbalken · Farbskalen · Zeilenfarbe per Formel ·
Symbolregeln · Warnfarben

**Status** — ⏳ später.

---

## L16 · Abfragesprache für normale Nutzer

**Stand** — ✗ fehlt.

**Ziel**

```txt
zeige Aufgaben wo Status nicht Fertig und Fällig vor heute gruppiert nach Person
```

**Warum** — viele Nutzer verstehen natürliche Abfragen schneller als komplexe
Filterdialoge. Ohne SQL-Engine, siehe `ENTSCHEIDUNGEN.md` E10.

**Status** — ⏳ geplant.

---

## L17 · Entscheidungs- und Wissensgraph

**Stand** — ◐ ein Graph für Seitenverknüpfungen existiert.

**Was fehlt** — Entscheidungsblock · Alternativen · Begründung · betroffene
Projekte · Graph-Filter · Zeitleiste von Entscheidungen

**Status** — ⏳ später.

---

## L18 · Universelle Begriffe und Aliase

**Stand** — ✗ fehlt.

**Problem** — `Acme`, `ACME GmbH` und `Acme customer account` können dieselbe
Sache sein.

**Was fehlt** — Alias-Erkennung · Bestätigung durch den Nutzer · Begriffs-ID ·
Suche über alle Aliase · Zusammenführen ohne Datenverlust

**Status** — ⏳ später.

---

## L19 · Import aus anderen Werkzeugen

**Stand** — ◐ viele Formate vorhanden.

**Was fehlt** — Confluence · Trello · Asana · Jira · Notion-Export vollständig
prüfen · Google Docs · Apple Notes

**Status** — ⏳ später.

---

## L20 · Suche in Bildern, PDFs und Audio

**Stand** — ◐ Textsuche vorhanden, Anhänge nicht durchsuchbar.

**Was fehlt** — OCR für Bilder · OCR für PDFs · Audio-Transkription · Text am
Anhang speichern · Suchtreffer im Anhang anzeigen

**Status** — ⏳ später.

---

## L21 · Screenreader und Barrierefreiheit

**Stand** — ◐ Tastatur und Fokus sind teilweise gut.

**Was fehlt** — ARIA-Rollen · `aria-live` für Meldungen · Beschriftungen ·
Baumstruktur · Fokusfallen in Dialogen · echter Screenreader-Test

**Status** — ⏳ später.

---

## L22 · Erweiterungen und Marktplatz

**Stand** — ◐ Erweiterbarkeit über Register und MCP vorhanden.

**Was fehlt** — installieren · Rechte anzeigen · deaktivieren · löschen ·
geprüfte Liste · Signatur/Vertrauen · Sandbox

**Status** — ⏳ später.

---

## L23 · Agenten-Sicherheit

**Stand** — ◐ Agenten existieren.

**Was fehlt** — Notausschalter · Tageslimit · Rechte je Agent · Protokoll ·
Bestätigung bei riskanten Aktionen

**Status** — ⏳ wichtig **vor** starken Agenten.

---

## L24 · Vollständige Verschlüsselung

**Stand** — ◐ einzelne Seiten lassen sich verschlüsseln.

**Was fehlt** — ganzer Arbeitsbereich · verschlüsselte Anhänge ·
verschlüsselte Sync-Daten · Schlüsselverwaltung · Passwortwechsel ·
Wiederherstellungsstrategie

**Status** — ⏳ später.

---

## L25 · Mobile und iPhone

**Stand** — ◐ PWA und mobile Oberfläche vorhanden.

**Was fehlt**

```txt
iPhone 13 Pro Max · Safari · Touch-Editor
Tastatur öffnet und schliesst sauber
Datenbanken horizontal nutzbar
Dialoge passen ins Display
Dateiimport/-export verständlich
Offline-Hinweise
```

**Status** — ⏳ geplant.

---

## L26 · Leistung bei sehr grossen Arbeitsbereichen

**Stand** — ◐ Tempo-Helfer und vorberechnete Werte vorhanden.

**Was fehlt** — Tests mit 10.000 Blöcken · 100.000 Blöcken · grossen
Datenbanken · vielen Anhängen · grossen `.redion`-Backups ·
iPhone-Speichergrenzen

**Status** — ⏳ später.

---

## L27 · Dokumentationsstruktur

**Stand** — ◐ viele Doku-Dateien vorhanden, die neue Struktur fehlt.

**Da seit Phase 2** — `doku/TYPESCRIPT-MIGRATION.md`

**Was fehlt**

```txt
doku/REDION-FORMAT.md
doku/SICHERHEIT.md
doku/SYNC.md
doku/CLOUDFLARE-R2.md
doku/MOBILE.md
```

**Status** — ⏳ geplant. `REDION-FORMAT.md` zuerst: das `.redion` ist das
Format, in dem Sicherungen liegen, und ein Format ohne Beschreibung ist
genau so lange lesbar, wie die App existiert, die es geschrieben hat.

---

## L28 · Tests für die TypeScript-Zukunft

**Stand** — ◐ Typecheck da, Prüfläufe für migrierten Code fehlen noch.

**Da seit Phase 2** — `npm run typecheck` · Typecheck in GitHub Actions ·
Typen für Kernmodell, Backup, Dateien und Datenbanken

Gegengeprüft: ein absichtlich falscher Typ macht den Lauf rot. Ein
Typecheck, der grün ist, weil er keine Datei findet, sagt nichts.

**Was fehlt** — Prüfläufe, die migrierten `.ts`-Code auch **ausführen**.
Solange `noEmit` gilt, beschreibt TypeScript nur Daten. Ab TS-3 zieht
ausführbarer Code um, und ab dann muss er wie jeder andere unter den
bestehenden Läufen stehen.

**Status** — ⏳ hohe Priorität, fällig mit TS-3.

---

## L29 · Einzeldatei trotz TypeScript

**Stand** — ◐ `redion-einzeldatei.html` existiert, die Migration muss sie
schützen.

**Was fehlt** — Build-Pfad für TypeScript · `bauen.js` anpassen · Einzeldatei
weiter erzeugen · keine externen Laufzeitabhängigkeiten · CI prüft die
Einzeldatei

**Status** — ⏳ wichtig **während** der TypeScript-Migration.

---

## L30 · Öffentliche Seiten, SEO, Demo

**Stand** — ◐ Teilen existiert als Export; echte öffentliche Seiten brauchen
einen Server.

**Was fehlt** — öffentliche Seiten sicher erzeugen · private Daten trennen ·
`robots.txt` · `sitemap.xml` · Demo-Daten statt privater Daten · öffentliche
Anhänge kontrollieren · Widerruf

**Status** — ⏳ später.

---

## L31 · Tabellenkalkulation (Spreadsheet)

**Stand** — ✗ fehlt.

Redion hat Datenbanken mit Formeln, aber **keine Tabelle mit Zellen**. Das
sind zwei verschiedene Dinge: eine Datenbank hat ein Schema, eine Tabelle hat
`A1`.

**Was fehlt**

```txt
Spreadsheet-Block · Spreadsheet-Ansicht für Datenbanken
Zellen · Zeilen · Spalten
Zellbezüge A1/B2 · Bereiche A1:C10
Formeln in Zellen · automatische Neuberechnung
Abhängigkeiten zwischen Zellen · Zirkelbezüge erkennen
Fehlerwerte statt stiller NaN
Kopieren/Einfügen über mehrere Zellen · Masseneingabe · Ausfüllen
```

**Warum wichtig**

Die Fälle, für die Menschen Excel öffnen: Budget · Rechnungen ·
Materiallisten · Projektkosten · Finanzplanung · Lernfortschritt · Inventar.

**Abgrenzung** — Redion löst Excel-Probleme, klont Excel nicht. Siehe
`ENTSCHEIDUNGEN.md` E24.

**Status** — ⏳ geplant, hohe Priorität. `AUFGABEN.md` Phase 6c.

---

## L32 · Excel-Funktionen

**Stand** — ✅ **61 der 63 Funktionen des Startpakets laufen unter deutschem
Namen. Die zwei fehlenden fehlen mit Absicht.**

Seit dem 4. August 2026 rechnet `SUMME(1; 2; 3)` — als Zeiger auf dieselbe
Funktion wie `sum`, nicht als zweite Fassung. Beschrieben im Register, damit
die Suche im Formeleditor sie findet. Gehalten von `test106.mjs` (78
Prüfungen), der auf **gleiches Ergebnis** prüft, nicht nur darauf, dass ein
Name antwortet.

Der Befund davor:

Gemessen am 4. August 2026 (Register geladen, Laufzeit geladen, Namen
abgeglichen — `doku/EXCEL-IN-REDION-RECHERCHE.md`):

| | |
|---|--:|
| Funktionen im Register | 158 |
| davon ohne Implementierung | 0 |
| Startpaket abgedeckt | **37 / 63** |
| davon unter deutschem Namen erreichbar | **0** |

Wer aus Excel kommt und `=SUMME(A1:A10)` tippt, bekommt einen Fehler. `sum`
hätte funktioniert. Es fehlen also nicht 63 Funktionen, sondern **26
Funktionen und 37 Namen**.

**Was schon da ist**

```txt
Mathematik  10/15   sum average min max abs sqrt mod round floor ceil
Logik        5/6    if ifs and or not
Datum        7/9    today now date year month day week
Text        11/16   length slice trim upper lower replaceall replace
                    format tonumber concat join
Info         1/4    empty
Suche        3/13   match sort unique
```

**Seit dem 4. August dazugekommen**

```txt
PRODUKT · ANZAHL · ANZAHL2 · POTENZ · GANZZAHL · ZEIT · WOCHENTAG
LINKS · RECHTS · SÄUBERN · SUCHEN · FINDEN · ISTZAHL · ISTTEXT
```

Dabei kam ein Fehler heraus: `ABRUNDEN` und `AUFRUNDEN` zeigten auf
`floor`/`ceil`. Excel rundet zur Null hin und von der Null weg — bei
negativen Zahlen ein Unterschied von eins. Behoben; `GANZZAHL` ist jetzt der
Name für „immer nach unten".

**Auch die Suche/Verweis-Gruppe ist da** — `ZÄHLENWENN(S)`, `SUMMEWENN(S)`,
`MITTELWERTWENN(S)`, `SVERWEIS`, `WVERWEIS`, `XVERWEIS`, `INDEX`, `FILTER`,
samt Excels Bedingungssprache (`">100"`, `"Z*"`, `"<>x"`). Gehalten von
`test107.mjs` (44 Prüfungen).

**Elf Zuordnungen waren falsch und sind berichtigt.** Sie waren nach
Namensähnlichkeit gemacht statt nach Bedeutung — `WECHSELN("a.b.c";".";"-")`
ergab `-----`, weil `replaceall` einen regulären Ausdruck nimmt und der Punkt
jedes Zeichen trifft. Siehe `ENTSCHEIDUNGEN.md` E24, Nachtrag 4.

**Mit Absicht nicht gebaut** — `WENNFEHLER` und `ISTFEHLER`. Redions Laufzeit
ist abwehrend gebaut und erzeugt keine Fehlerwerte (`1/0` ist `0`). Excels
WENNFEHLER fängt `#DIV/0!` und `#WERT!` — hier gäbe es nichts zu fangen. Es
sähe aus wie Excels und wäre etwas anderes. Siehe `ENTSCHEIDUNGEN.md` E24,
Nachtrag 3.

**Suche/Verweis ist mit 3 von 13 die schwächste Gruppe** — und genau sie
trägt in Excel die eigentliche Arbeit.

**Zwei Dinge stehen nicht im Weg** — beide nachgesehen: der Zerteiler kennt
Umlaute schon (`/[A-Za-zÄÖÜäöüß_]/`), und Namen werden vor dem Nachschlagen
kleingeschrieben. Ein Alias ist eine Zeile.

**Die offene Architekturfrage** — echte Fehlerwerte. Sie wären keine neue
Funktion, sondern eine Änderung am Rechnen selbst, und sie änderten das
Ergebnis **bestehender Formelspalten in bestehenden Datenbanken**: wo heute
`0` steht, stünde ein Fehler. Das ist Priorität 1 und braucht eine eigene
Entscheidung mit Migrationsgedanken.

**Wichtig** — dieselbe sichere Formelsprache, kein zweiter Auswerter, kein
`eval()`. Siehe `ENTSCHEIDUNGEN.md` E11 und E24.

**Status** — ✅ 61 von 63. Offen bleibt allein die Fehlerwert-Frage.

---

## L33 · XLSX und ODS

**Stand** — ✗ XLSX-Import und -Export fehlen; CSV gibt es.

**Was schon da ist** — der ZIP-Teil: `Ausgeben.zipSchreiben` schreibt,
`Einlesen.zipLesenAusBlob` liest ohne alles in den Speicher zu ziehen. Ein
XLSX ist ein ZIP mit XML darin, und `Einlesen.xlsxLesen` liest bereits
einfache Mappen.

**Was fehlt** — XLSX schreiben mit mehreren Blättern · Zellformatierung ·
Formeln · bedingte Formatierung · ODS rein und raus

**Vorbehalt** — für den XML-Teil gilt `ENTSCHEIDUNGEN.md` E26: erst prüfen,
ob es ohne grosse Abhängigkeit geht. Was hereinkommt, landet in der
Einzeldatei und auf dem Telefon.

**Status** — ⏳ später.

---

## L34 · Was-wäre-wenn: Zielwertsuche, Szenarien, Solver

**Stand** — ✗ fehlt vollständig.

**Was fehlt**

```txt
Zielwertsuche   Zielwert eingeben, veränderbare Zelle wählen
Szenarien       Best Case · Normal Case · Worst Case vergleichen
Solver einfach  Ziel maximieren oder minimieren, mit Nebenbedingungen
```

**Warum** — Finanzplanung, Preisberechnung, Sparziele, Budgetoptimierung.

**Status** — ⏳ später. Setzt L31 voraus.

---

## L35 · Import-Assistent (Power-Query-ähnlich)

**Stand** — ✗ fehlt.

**Was fehlt** — CSV bereinigen · Spalten umbenennen · Typen erkennen · Werte
ersetzen · Duplikate entfernen · leere Zeilen entfernen · Spalten teilen ·
Spalten zusammenführen · mehrere Dateien kombinieren · Vorschau vor dem
Übernehmen

**Warum** — fremde Daten kommen selten sauber. Ohne Assistent landet der
Schmutz in der Datenbank und muss dort von Hand aufgeräumt werden.

**Status** — ⏳ später.

---

## L36 · Die verschlüsselte Sicherung — behoben

**Stand** — ✅ behoben. Sie schreibt jetzt dasselbe wie der Hauptweg.

Vier Befunde auf einem Weg, gefunden beim Schreiben von
`doku/REDION-FORMAT.md`:

```txt
1  kein versions, keine Anhänge — und kein fehlt/hinweis, das es sagt
2  der Dialog sagte "ersetzt", der Code führte zusammen
3  das Eingespielte ging nur in den Zwischenspeicher; Store.alles gibt es
   nicht, der Aufruf war ein stiller Leerlauf, und 900 ms später lud die
   Seite neu und las den alten Bestand — gemeldet wurde ein Erfolg
4  verschlüsseln scheiterte ab etwa 128 KB (Spread in fromCharCode),
   an drei Stellen dieselbe Zeile
```

Behoben: `bestandSammeln` benutzt `Store.exportAll()`, das Einspielen läuft
über `Store.importAll` mit ausdrücklicher Angabe, und Base64 gibt es nur
noch einmal — in `quell/kern/helfer/bytes.js`.

**Gehalten von** `test104.mjs` (20) und `test87` Punkt 9.

**Was daran offen bleibt** — eine verschlüsselte Sicherung trägt weiterhin
keine Anhänge; sie ist eine `.json`, und Blobs passen dort nicht hinein.
Neu ist, dass sie das selbst sagt. Ein verschlüsseltes `.redion` wäre der
nächste Schritt und ist noch nicht entschieden.

---

## Zusammenfassung nach Priorität

**Sehr hoch**

```txt
L1  TypeScript
L2  Doku auf die neue Richtung bringen
L5  R2-Dateispeicher planen
L7  Sync-Konflikte vor Cloud-Sync
L28 Typecheck
L29 Einzeldatei trotz TypeScript
```

**Hoch**

```txt
L6  Konto-Modus
L8  Rechte und Freigaben
L9  Formelfunktionen beschreiben
L13 Automationen
L23 Agenten-Sicherheit
L25 Mobile und iPhone
L27 Dokumentationsstruktur
L31 Tabellenkalkulation
L32 Excel-Funktionen
```

**Mittel**

```txt
L10 Blocktypen
L11 Markdown-Kürzel
L12 Tastenkürzel
L14 Dashboards
L15 bedingte Formatierung
L16 Abfragesprache
L24 vollständige Verschlüsselung
L26 Leistung
```

**Später**

```txt
L17 Entscheidungsgraph
L18 Begriffe und Aliase
L19 Import aus anderen Werkzeugen
L20 OCR und Audio-Suche
L21 Screenreader
L22 Erweiterungen und Marktplatz
L30 öffentliche Seiten, SEO, Demo
L33 XLSX und ODS
L34 Zielwertsuche, Szenarien, Solver
L35 Import-Assistent
```

---

# Anhang A · Was gemessen wurde

Diese Zahlen sind die Grundlage für L9 bis L12. Sie stehen hier, damit sie
nicht neu gemessen werden müssen.

| Liste | Notion | Redion | Stand |
|---|--:|--:|:--:|
| Blocktypen | 97 | 58 | ◐ |
| Eigenschaftstypen | 29 | 35 | ✅ |
| Ansichten | 11 | 12 | ✅ |
| Tastenkürzel | 160 | 127 | ◐ |
| Markdown-Kürzel | 48 | 23 | ◐ |
| Einstellungs-Optionen | 111 | 143 | ✅ |
| Formelfunktionen | 125 | 158 | ✅, aber 129 ohne Beschreibung |
| Integrationen | 62 | 8 | ◐ — siehe `ENTSCHEIDUNGEN.md` E23 |

**Nicht gezählt:** Bedienelemente (Notion: 175) · Trigger, Bedingungen und
Aktionen (15/24/19) · Aggregationen (21).

**Wie gezählt wurde.** Nicht per `grep` über `id:` — das zählt Kommentare und
Beispiele mit. Die Register wurden **geladen und befragt**, mit der
Formel-Laufzeit daneben. Die erste Messung ohne das lag um den Faktor zehn
daneben: 12 Kürzel statt 127, 20 Formeln statt 158. Siehe `ENTSCHEIDUNGEN.md`
E21.

---

# Anhang B · Was erledigt ist

Eine Zeile je Punkt, mit dem Prüflauf, der ihn hält. Die ausführlichen Befunde
stehen in den Commit-Texten und in `ENTSCHEIDUNGEN.md`.

**Etappe 1 — die lokale App stabil machen**

| | was es war | hält es |
|---|---|---|
| E1 | Der Umzug einer alten Ablage war nie durchgespielt worden — er war richtig gebaut, aber ungeprüft | `test95` |
| E2 | Die Sicherung enthielt den Versionsverlauf nicht; der Import räumte nur den Zwischenspeicher | `test96` |
| E3 | Der Papierkorb zeigte keine Blöcke; „endgültig gelöscht" liess Fassungen und Anhänge liegen; die Aufräumung gab es zweimal, eine davon tot | `test97` |
| E4 | Dreissig Fassungen reichten zwei Stunden zurück — jetzt wird ausgedünnt statt abgeschnitten | `test98` |
| E5 | Zwei Tabs wussten nichts voneinander und überschrieben einander | `test99` |
| E6 | Anhänge fehlten in der Sicherung — jetzt `.redion`, auch mit einem Video von 500 MB | `test100` |

**Sicherheit und Rechte**

| | was es war | hält es |
|---|---|---|
| D2 | Kein Bremsen bei Fehlversuchen an Login und öffentlichen Seiten | `test93` |
| D3 | Sicherheits-Kopfzeilen fehlten für die Antworten des Workers | `test93`, `test94` |
| D4 | Der 500er gab die Meldung einer Ausnahme ungeprüft nach draussen | `test93` |
| D1 | Keine Obergrenze für den Anfragekörper; `inhalt` der veröffentlichten Seite unbegrenzt | `test101` |
| D5 | Eine Marke mit „nur lesen" konnte schreiben und sich selbst eine mit „alles" ausstellen | `test102` |
| D6 | „Rechts einfügen" setzte die Spalte manchmal ganz nach links | `test33` |

**Umbauten am Aufbau** — Seitenleiste, Kopfleiste und Inhaltsfläche aus
`schale.js` herausgelöst · Stilblatt in sechs Dateien geteilt · `datenbanken`
und `wissen` in `dienst` und `ansicht` getrennt · PWA und Icons repariert.

Die zwölf Muss-Regeln Sicherheit aus dem Auftrag sind alle erfüllt: Tokens und
Passwörter nur als Abdruck · zeitkonstanter Vergleich · HTML gesäubert · keine
ungeprüften Weiterleitungen nach OAuth · CORS eingeschränkt · serverseitige
Rechte · keine geheimen Schlüssel im Frontend · Eingaben begrenzt · Bremse ·
Kopfzeilen · keine sensiblen Daten in Logs.
