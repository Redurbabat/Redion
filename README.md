# Redion

Eine Notiz- und Datenbank-App im Stil von Notion — **die Daten gehören dem
Gerät**. Kein Konto nötig, kein Server nötig, keine Abo-Gebühr.

Öffnen: `index.html` doppelklicken. Das war die Installation.
Lieber eine einzige Datei? `redion-einzeldatei.html` enthält alles.

Ein Server ist möglich und kostet nichts — dann gibt es Abgleich zwischen
zwei Geräten, Rechte, die wirklich sperren, und Seiten, die man weitergeben
kann. Siehe `SERVER-EINRICHTEN.md`.

---

## Der Aufbau

```
index.html            was der Browser lädt
quell/
  start.js            der einzige Einstiegspunkt
  kern/               kennt keinen Bereich
    ablage/           IndexedDB, Formen, Umzüge, Befehle
    zustand/          Verlauf (Rückgängig/Wiederholen)
    ereignisse/       Bus, Arten, Protokoll
    abgleich/         Maschine, Zusammenführen
    zugang/           Sitzung, Rechte, Rollen
    sicherheit/       Krypto, Säubern, Prüfen
    helfer/           Kennungen, Datum, Objekte, Bremse, Melder, Tempo
    einstellung/      Konstanten, Schalter, App
  register/           die elf Kataloge — hier ändert man EINE Datei
  schale/             Aufbau, Überlagerungen, Stil
  bereiche/           editor, datenbanken, wissen, ki, verbinden, dateien,
                      vorlagen, kommentare, erwähnungen, seiten, planen,
                      einstellungen, hilfe
oeffentlich/          Icons, Manifest, Favicon
server/               der freiwillige Server (Cloudflare Workers + D1)
doku/                 wie es innen aussieht
```

**Die drei Regeln, die das tragen:**

1. Ein Bereich benutzt nur `kern/` und `register/` — nie einen anderen
   Bereich. Braucht er etwas von drüben, geht es über den Ereignisbus oder
   das Gemeinsame wandert nach `kern/`.
2. Ein neuer Bereich = **zwei Einträge**: `register/module.js` und
   `register/navigation.js`. Sonst nichts.
3. Neue Blockart, neue Ansicht, neuer Spaltentyp, neuer Befehl, neues
   Tastenkürzel = **ein Objekt** in der passenden `register/`-Datei. Die
   Oberfläche zeichnet sich daraus.

Es gibt keinen Bauschritt. Die Dateien werden als gewöhnliche Skripte
geladen — genau deshalb läuft die App auch direkt von der Festplatte, ohne
Server und ohne Werkzeugkette. `node bauen.js` fasst alles zu
`redion-einzeldatei.html` zusammen; das ist eine Bequemlichkeit, keine
Voraussetzung.

---

## Der Editor

Alles ist ein Block — Absatz, Überschrift, Unterseite, Datenbank, Whiteboard.
`/` öffnet das Blockmenü mit **43 Bausteinen** in sechs Gruppen.

| Gruppe | Bausteine |
|---|---|
| Grundlegend | Text · Überschrift 1–3 · Aufgabe · Aufzählung · Nummerierung · Toggle · Zitat · Callout · Trennlinie |
| Datenbank | Tabelle · Board · Liste · Galerie · Kalender |
| Medien | Bild · Video · Audio · Datei · Lesezeichen · Einbetten |
| Erweitert | Code · Formel · Einfache Tabelle · Inhaltsverzeichnis · Pfad · Zwei/Drei Spalten · Unterseite · Link zu Seite · Synchronisierter Block · Knopf · HTML |
| Wissen | Karteikarte · Whiteboard · Diagramm · Rückverweise |
| KI | Text schreiben · Zusammenfassen · Aufgaben ableiten · Übersetzen · Verbessern |

Beim Tippen wandeln die Markdown-Kürzel sofort um:

```
#  ##  ###     Überschriften        ```      Codeblock
-  *  +        Aufzählung           $$       Formel
1.             Nummerierung         "        Zitat
[]  [ ]        Aufgabe              ---      Trennlinie
>              Toggle
```

Und mitten im Text:

```
**fett**   *kursiv*   __unterstrichen__   ~~durchgestrichen~~   `code`
[[Seite]]  #schlagwort  ((Blockverweis))  @heute  @Person  :emoji  $a^2$
```

**Text markieren** öffnet die schwebende Werkzeugleiste: KI, Umwandeln,
Fett, Kursiv, Unterstrichen, Durchgestrichen, Code, Formel, Link,
Kommentar und die zehn Notion-Farben.

---

## Datenbanken

Aufgebaut wie bei Notion: ein Container-Block zeigt auf ein **Schema**,
das Schema auf beliebig viele **Ansichten**. Eine Zeile ist eine eigene Seite.

**Acht Ansichten** — Tabelle · Board (Drag & Drop) · Liste · Galerie ·
Kalender · Zeitstrahl · Diagramm · Formular

**21 Eigenschaftstypen** — Titel, Text, Zahl, Auswahl, Mehrfachauswahl,
Status, Datum, Person, Kontrollkästchen, URL, E-Mail, Telefon, Formel,
Erstellt am, Zuletzt geändert, Dateien, **Verknüpfung**, **Rollup**,
**Laufende Nummer**, **Knopf**, **KI-Feld**

Dazu:

- **Filter** mit UND/ODER und typgerechten Operatoren
- **Sortierung**, **Gruppierung** und **Untergruppierung**
- **Berechnungen** unter jeder Spalte: Summe, Durchschnitt, Median, Min, Max,
  Spanne, Anzahl, Prozent gefüllt und mehr
- **Rollups** über Verknüpfungen — 15 Berechnungsarten
- **Seitenvorschau** (Side Peek) je Zeile, Rechtsklickmenü mit 10 Aktionen
- Zeilenhöhe, Kartengrösse, Textumbruch, leere Gruppen, Anzeigegrenze
- **CSV-Export**

---

## Die Formelsprache

Eine eigene Umsetzung von Notions Formelsprache 2.0 — mit eigenem Tokenizer,
Parser und Auswerter. Kein `eval()`, eine Formel kann also niemals fremden
Code ausführen.

Über 90 Funktionen: `if` `ifs` `let` `lets` `empty` · `round` `floor` `ceil`
`abs` `min` `max` `sum` `mean` `median` `pow` `sqrt` · `format` `length`
`substring` `contains` `replace` `replaceAll` `lower` `upper` `trim` `split`
`repeat` `join` · `map` `filter` `find` `some` `every` `at` `first` `last`
`unique` `sort` · `now` `today` `dateAdd` `dateBetween` `formatDate` `year`
`month` `week` `day` `hour` `minute`

Der Formeleditor prüft live und zeigt das Ergebnis an der ersten Zeile.

> **Die Falle, an der fast jeder scheitert:** Text wird mit `+` verkettet,
> **nicht** mit `concat()`. `concat()` ist ausschliesslich für Listen.
>
> ```
> "Woche " + format(week(now()))     ✓
> concat("Woche ", format(...))      ✗
> ```

---

## Die Werkzeuge — und woher sie kommen

Diese App ist aus dem Vergleich von zwanzig quelloffenen Notiz-Programmen
entstanden. Jedes kann eine Sache besonders gut. Diese Sachen sind hier
nachgebaut — jede an einem Ort, der zu ihr passt:

| Woher die Idee stammt | Was sie kann | Wo sie in dieser App liegt |
|---|---|---|
| **Logseq**, **Foam**, **SiYuan** | Tagesjournal | Seitenleiste → Journal · `Strg Shift J` |
| **Memos**, **Blinko** | Schnellnotizen mit Aktivitäts-Heatmap | Seitenleiste → Schnellnotizen · `Strg Shift M` |
| **Foam**, **Logseq**, **Anytype** | `[[Links]]`, Rückverweise, Graph | Fusszeile jeder Seite · Seitenleiste → Graph |
| **Joplin**, **Notesnook**, **TiddlyWiki** | Schlagwörter | `#wort` schreiben · Seitenleiste → Schlagwörter |
| **SiYuan**, Anki-Verfahren | Karteikarten mit Wiederholungsplan (SM-2) | Block `/karteikarte` · Seitenleiste → Karteikarten |
| **Outline**, **Trilium**, **Anytype** | Vorlagen | Seitenmenü → Als Vorlage speichern |
| **Standard Notes**, **Trilium**, **Joplin** | Versionsverlauf | Kopfzeile → 🕘 · Seitenmenü → Versionsverlauf |
| **Notesnook**, **Standard Notes** | Verschlüsselte Notizen (AES-GCM) | Seitenmenü → Verschlüsseln |
| **MarkText**, **Zettlr** | Fokus-Modus | Seitenmenü → Fokus · `Strg Shift F` |
| **HedgeDoc**, Marp | Präsentation aus der Seite | Seitenmenü → Präsentation |
| **MarkText**, **TUI Editor** | Markdown-Quelltext hin und zurück | Seitenmenü → Markdown-Quelltext |
| **Zettlr** | Schreibstatistik, Lesezeit, häufige Wörter | Seitenmenü → Statistik |
| **SilverBullet** | Befehlspalette für alles | `Strg Shift P` |
| **AFFiNE** | Whiteboard mit Stift, Formen, Haftnotizen | Block `/whiteboard` |
| **TUI Editor**, Notion Chart | Diagramme | Block `/diagramm` · Datenbank-Ansicht |
| **AppFlowy** | Kanban-Board | Datenbank-Ansicht Board |
| **TiddlyWiki** | Alles in einer einzigen HTML-Datei | Einstellungen → Als eine HTML-Datei |
| **Joplin**, **Zettlr**, **SilverBullet** | Notizen als Markdown-Dateien im Ordner | Einstellungen → In Ordner schreiben / einlesen |
| **Notesnook** | Erinnerungen | Seitenmenü → Erinnerung |
| **editor.js** | Blockeditor mit sauberem Datenmodell | das ganze Fundament |
| **Trilium** | Seite an zweiter Stelle einhängen | Block `/link zu seite` |

Kein einziger fremder Programmcode liegt in diesem Verzeichnis — nur die
Ideen, neu und einheitlich umgesetzt.

---

## Einstellungen

Zwölf Bereiche, wie in Notion aufgebaut — links die Bereiche, rechts die Optionen.
Über **70 Einstellungen**, und jede tut wirklich etwas:

| Bereich | Was drinsteht |
|---|---|
| Mein Konto | Name, Symbol, Seiten verschlüsseln, alle Daten löschen |
| Einstellungen | Hell/Dunkel/System, Schriftgrösse, Zeilenabstand, Startansicht, Wochenbeginn, Datums- und Zeitformat, Rechtschreibprüfung |
| Benachrichtigungen | Systemmeldungen erlauben, Erinnerungen, fällige Karteikarten |
| Verbindungen | Ollama, WebLLM, Ordner auf der Festplatte |
| Arbeitsbereich | Name, Symbol, Startseite, Zahlen, alles ausgeben |
| Bereiche | Was bei Notion „Teamspaces" heisst — Gruppen in der Seitenleiste |
| Sicherheit | Verschlüsselung, Schreibschutz, automatische Versionen |
| Import und Export | JSON, Markdown-Ordner, eine HTML-Datei, PDF |
| KI | Modell wählen, Kontext, Antwortlänge |
| Speicher | Belegung, Papierkorb, alte Versionen aufräumen, dauerhafter Speicher |
| Abrechnung | Kostenlos, für immer — ohne Stufen und ohne Grenzen |
| Über | Zahlen zur App, alle Tastenkürzel |

## Automationen

Was Notion erst ab dem Business-Plan anbietet, läuft hier im Browser:
in jeder Datenbank auf **⚡**, dann *wenn … dann …*

- **Wenn**: ein Eintrag entsteht · eine Eigenschaft ändert sich · eine
  Eigenschaft bekommt einen bestimmten Wert
- **Dann**: Eigenschaft setzen · KI-Feld ausfüllen lassen · Erinnerung
  anlegen · Unterseite anlegen · Meldung zeigen

Beispiel: *Wenn Status auf „Erledigt" springt, dann setze das Datum von heute.*

## Wiki und Teilen

**In Wiki umwandeln** macht aus einer Seite das Verzeichnis ihrer Unterseiten —
mit Besitzer, Änderungsdatum und dem Vermerk „geprüft".

**Teilen** gibt es ohne Server nicht als Freigabe ins Netz, aber in jeder
Form, die Seite aus der Hand zu geben: Link, Text, Markdown, HTML, PDF,
alles als eine Datei oder als Ordner voller Markdown-Dateien.

---

## Die KI — lokal und kostenlos

Zwei Wege, umschaltbar wie in Notion. Oben rechts im KI-Panel wählst du das Modell.

| | Ollama | WebLLM |
|---|---|---|
| Wo | als Programm auf dem Rechner | direkt im Browser |
| Installation | einmalig nötig | keine |
| Geschwindigkeit | **deutlich schneller** | langsamer |
| Qualität | **besser**, grössere Modelle | ordentlich |
| Voraussetzung | — | WebGPU (Chrome/Edge ab 113) |

Die App sucht beim Start nach Ollama und listet deine installierten Modelle.
Läuft Ollama nicht, kannst du eines der sechs WebLLM-Modelle laden — es bleibt
danach im Browser-Cache.

**Kein Text verlässt deinen Rechner.** Kein API-Schlüssel, keine Abrechnung.

### Ollama einrichten

```bash
# 1. installieren:  https://ollama.com
# 2. ein Modell holen
ollama pull llama3.2

# 3. dem Browser den Zugriff erlauben
#    Windows
setx OLLAMA_ORIGINS "*"
#    macOS
launchctl setenv OLLAMA_ORIGINS "*"
#    Linux
OLLAMA_ORIGINS=* ollama serve
```

Danach Ollama neu starten und im KI-Panel auf **Erneut nach Ollama suchen** klicken.

---

## Wo die Daten liegen

In **IndexedDB** in deinem Browser. Nach Notions Vorbild in fünf Speichern:

```
blocks       jeder Inhalt — Absätze, Seiten, Datenbankzeilen
collections  das Schema einer Datenbank
views        Layout, Filter, Sortierung, sichtbare Spalten
meta         Einstellungen
versions     ältere Fassungen jeder Seite
```

Weil alles lokal liegt, gehört ein Export dazu:
**Einstellungen → Sicherung speichern** legt eine JSON-Datei ab,
**Sicherung laden** holt sie zurück. Einzelne Seiten lassen sich als
Markdown, HTML oder PDF ausgeben, Datenbanken als CSV, der ganze
Arbeitsbereich als Ordner voller Markdown-Dateien oder als eine HTML-Datei.

---

## Tastenkürzel

| Kürzel | Wirkung | | Kürzel | Wirkung |
|---|---|---|---|---|
| `Strg N` | Neue Seite | | `/` | Blockmenü |
| `Strg P` | Suchen | | `Strg Alt 0-9` | Blocktyp wechseln |
| `Strg Shift P` | Befehlspalette | | `Tab` / `Shift Tab` | Ein-/Ausrücken |
| `Strg F` | Auf der Seite suchen | | `Strg Shift ↑ ↓` | Block verschieben |
| `Strg [` / `Strg ]` | Zurück / Vorwärts | | `Strg D` | Duplizieren |
| `Strg Z` / `Strg Y` | Rückgängig / Wiederholen | | `Strg B I U E` | Fett, Kursiv, Unterstrichen, Code |
| `Strg J` | KI-Panel | | `Strg Shift S` | Durchgestrichen |
| `Strg \` | Seitenleiste | | `Strg Shift H` | Letzte Farbe |
| `Strg Shift L` | Hell / Dunkel | | `Strg Alt T` | Alle Toggles auf/zu |
| `Strg Shift J` | Journal | | `Esc` | Block auswählen |
| `Strg Shift M` | Schnellnotiz | | `Strg ,` | Einstellungen |
| `Strg Shift G` | Graph | | `Strg /` | Alle Kürzel anzeigen |
| `Strg Shift T` | Schlagwörter | | `Strg Shift F` | Fokus-Modus |

---

## Aufbau

```
index.html        die Oberfläche
app.css           das Design — die zehn Notion-Farben, hell und dunkel
bauen.js          baut die Einzeldatei (node bauen.js)

js/store.js       IndexedDB, Datenmodell, Suche, Versionen, Export
js/formula.js     Tokenizer, Parser und Auswerter der Formelsprache
js/links.js       [[Links]], Rückverweise, Schlagwörter, Graph
js/canvas.js      Whiteboard, Diagramme, einfache Tabelle, Mathematik
js/blocks.js      Blockkatalog, Rendern, Tastatur, Slash-Menü
js/database.js    Ansichten, Filter, Sortierung, Rollups, Seitenvorschau
js/tools.js       Befehlspalette, Journal, Vorlagen, Karteikarten, Export
js/notion.js      Rückgängig, Auswahlleiste, Erwähnungen, Kommentare
js/ai.js          Ollama und WebLLM mit Modell-Umschalter
js/einstellungen.js  der Einstellungsbereich mit zwölf Abschnitten
js/app.js         Seitenleiste, Seitenanzeige, Suche, Navigation
```

Bewusst **ohne Build-Schritt und ohne Abhängigkeiten**: reines HTML, CSS und
JavaScript. Die Skripte laden ohne `type="module"`, damit die Seite auch per
Doppelklick direkt von der Festplatte läuft — nicht nur über einen Server.

---

## Grenzen

Ehrlich gesagt:

- Die Daten liegen an **einem Browserprofil**. Anderer Browser, anderes Gerät,
  gelöschte Websitedaten — dann sind sie weg. Deshalb: regelmässig sichern.
- Hochgeladene Bilder und Dateien werden als Data-URL gespeichert. Über
  12 MB blockt die App ab, sonst platzt der lokale Speicher.
- Keine Zusammenarbeit in Echtzeit, kein Teilen über das Netz — das ginge
  nicht ohne Server. Kommentare und Erwähnungen sind für dich selbst gedacht.
- Wer das Passwort einer verschlüsselten Seite vergisst, kommt nicht mehr
  an den Inhalt. Das ist der Sinn der Sache.
- WebLLM braucht WebGPU. Ohne das bleibt Ollama.
- Beim allerersten Laden eines WebLLM-Modells wird das Modell aus dem Netz
  geholt. Danach läuft alles offline.

---

*Gebaut auf Grundlage einer vollständigen Analyse von Notion — Datenmodell,
Blocktypen, Eigenschaftstypen, Filter-Operatoren, Formelsprache, Tastenkürzel
und Farbpalette — und dem Vergleich von zwanzig quelloffenen Notiz-Programmen.*
