# Blocktypen — die Inventur

Diese Liste ist aus dem laufenden Register erzeugt (`Register.bloecke`),
nicht abgetippt. `pruefungen/lauf/test164.mts` vergleicht sie bei jedem
Lauf mit dem Register — wächst das eine, muss das andere nachziehen.

Stand: 78 Einträge. Darunter sind drei Sorten:

- **Blöcke** legen etwas auf die Seite (Text, Bild, Tabelle, …).
- **Aktionen** (Gruppe „Aktionen") stehen im Slash-Menü, wirken auf den
  Block, statt einen anzulegen.
- **Einbett-Dienste** (Gruppe „Einbetten") sind Ausprägungen des
  Einbetten-Blocks je Dienst.


## Grundlegend (14)

| Kennung | Name |
|---|---|
| `text` | Text |
| `h1` | Überschrift 1 |
| `h2` | Überschrift 2 |
| `h3` | Überschrift 3 |
| `todo` | Aufgabenliste |
| `bullet` | Aufzählungsliste |
| `number` | Nummerierte Liste |
| `toggle` | Toggle-Liste |
| `toggle-h1` | Toggle-Überschrift 1 |
| `toggle-h2` | Toggle-Überschrift 2 |
| `toggle-h3` | Toggle-Überschrift 3 |
| `quote` | Zitat |
| `callout` | Callout |
| `divider` | Trennlinie |

## Datenbank (7)

| Kennung | Name |
|---|---|
| `db-table` | Tabelle |
| `db-board` | Board |
| `db-list` | Liste |
| `db-gallery` | Galerie |
| `db-calendar` | Kalender |
| `spreadsheet` | Kalkulationstabelle |
| `linkeddb` | Verknüpfte Ansicht |

## Medien (6)

| Kennung | Name |
|---|---|
| `image` | Bild |
| `video` | Video |
| `audio` | Audio |
| `file` | Datei |
| `bookmark` | Lesezeichen |
| `embed` | Einbetten |

## Erweitert (12)

| Kennung | Name |
|---|---|
| `code` | Code |
| `equation` | Formel |
| `table` | Einfache Tabelle |
| `toc` | Inhaltsverzeichnis |
| `breadcrumb` | Pfad |
| `columns` | Zwei Spalten |
| `columns3` | Drei Spalten |
| `page` | Unterseite |
| `pageref` | Link zu Seite |
| `synced` | Synchronisierter Block |
| `button` | Knopf |
| `html` | HTML |

## Wissen (6)

| Kennung | Name |
|---|---|
| `blatt` | A4-Blatt |
| `flashcard` | Karteikarte |
| `whiteboard` | Whiteboard |
| `schaltplan` | Schaltplan |
| `chart` | Diagramm |
| `backlinks` | Rückverweise |

## KI (5)

| Kennung | Name |
|---|---|
| `ai-write` | KI: Text schreiben |
| `ai-summary` | KI: Zusammenfassen |
| `ai-todo` | KI: Aufgaben ableiten |
| `ai-translate` | KI: Übersetzen |
| `ai-improve` | KI: Text verbessern |

## Aktionen (11)

| Kennung | Name |
|---|---|
| `a-turn` | Umwandeln in … |
| `a-color` | Farbe ändern |
| `a-default` | Farbe entfernen |
| `a-dup` | Block duplizieren |
| `a-moveto` | Verschieben nach … |
| `a-del` | Block löschen |
| `a-mention` | Person oder Seite erwähnen |
| `a-date` | Datum einfügen |
| `a-remind` | Erinnerung |
| `a-emoji` | Emoji |
| `a-komm` | Kommentar |

## Einbetten (17)

| Kennung | Name |
|---|---|
| `embed-youtube` | YouTube |
| `embed-vimeo` | Vimeo |
| `embed-maps` | Google Maps |
| `embed-drive` | Google Drive |
| `embed-gdocs` | Google Docs |
| `embed-figma` | Figma |
| `embed-miro` | Miro |
| `embed-excalidraw` | Excalidraw |
| `embed-loom` | Loom |
| `embed-spotify` | Spotify |
| `embed-soundcloud` | SoundCloud |
| `embed-twitter` | X (Twitter) |
| `embed-gist` | GitHub Gist |
| `embed-codepen` | CodePen |
| `embed-typeform` | Typeform |
| `embed-canva` | Canva |
| `embed-pdf` | PDF |

## Bausteine ohne Menüeintrag

Nicht jeder Blocktyp lässt sich einfügen. Diese hier entstehen, weil etwas
anderes sie anlegt — sie stehen in keinem Register und deshalb auch in
keiner Tabelle oben. Wer den Bestand liest, findet sie trotzdem, und dann
soll hier stehen, was sie sind.

| Kennung | Woher | Wozu |
|---|---|---|
| `spalte` | von `columns`/`columns3` beim Anlegen | Hülle um EINE Spalte. Ohne sie war jedes Kind eine eigene Spalte, und Enter im Text machte aus zwei Spalten drei (E102). |
| `pdfseite` | vom PDF-Einlesen, eine je Seite | Seitenbild plus Zeichenschicht. Kennt `nr`, `bw`, `bh`, das Bild und das unveränderte Original (E103). |

## Die sechs „Kandidaten" aus L19, nachgesehen

L19 nannte sechs Blocktypen als vermutlich fehlend. Vier davon gibt es
längst, zwei sind anders gelöst:

| Kandidat | Befund |
|---|---|
| Breadcrumb | ✅ `breadcrumb` („Pfad") |
| Synced database view | ✅ `linkeddb` („Verknüpfte Ansicht"), dazu `synced` für Blöcke |
| AI summary block | ✅ `ai-summary` („KI: Zusammenfassen") |
| Button automation block | ✅ `button` („Knopf") |
| File gallery | anders gelöst: die Galerie-Ansicht der Datenbank (`db-gallery`) und der Dateien-Bereich; einen eigenen Block gibt es nicht |
| Relation preview | kein Blocktyp: die Vorschau einer Verknüpfung ist Eigenschafts-Verhalten (Zeilen-Peek), kein Baustein der Seite |

## Die alte Zählung „58 von 97"

Der Anhang von LUECKEN.md führte lange „Blocktypen: Notion 97, Redion
58". Die Redion-Seite ist mit dieser Datei ersetzt — sie war schlicht
veraltet (seit E29 kamen unter anderem Kalkulationstabelle, Whiteboard,
Diagramm und Karteikarte dazu). Die Notion-Seite der Zählung ist eine
Alt-Messung, deren Einzelliste nicht archiviert wurde; ohne neuen Blick
in Notion ist sie nicht belegbar, und geraten wird hier nicht (E21).
Was Notion sicher hat und Redion bewusst nicht, steht bei den
Integrationen (E23) und in L17/L18.
