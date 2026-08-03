# Was Redion mehr kann als Notion

**Stand: 3. August 2026** · Diese Datei ist der achte Teil der Sammlung.
Sie wächst mit — jeder Punkt wird beim Eintragen geprüft, nicht behauptet.

Die anderen sieben beschreiben Notion: was es kann, was nicht, wo jeder Knopf
sitzt. Diese hier ist die Antwort darauf — was in Redion gebaut wurde, das es
in Notion nicht gibt. Jeder Punkt ist gebaut, geprüft und läuft; keiner ist
eine Absicht.

Die Reihenfolge folgt der Arbeit, nicht der Wichtigkeit.

---

## Inhalt

1. [Datenbanken und Ansichten](#1-datenbanken-und-ansichten)
2. [Formeln](#2-formeln)
3. [Filter, Sortieren, Gruppieren](#3-filter-sortieren-gruppieren)
4. [Automationen](#4-automationen)
5. [Blöcke und Seiten](#5-blöcke-und-seiten)
6. [Die KI, die nichts kaputt macht](#6-die-ki-die-nichts-kaputt-macht)
7. [Fenster, Reiter, geteilte Ansicht](#7-fenster-reiter-geteilte-ansicht)
8. [Aussehen und Tastatur](#8-aussehen-und-tastatur)
9. [Versionen](#9-versionen)
10. [Hinein und heraus](#10-hinein-und-heraus)
11. [Tempo](#11-tempo)
12. [Planen](#12-planen)
13. [Ordnung halten](#13-ordnung-halten)
14. [Sicherheit](#14-sicherheit)
15. [Zusammenarbeit an einem Gerät](#15-zusammenarbeit-an-einem-gerät)
16. [Was hereinkommt](#16-was-hereinkommt)
17. [Erweiterungen](#17-erweiterungen)
18. [Mehrere Blöcke auf einmal](#18-mehrere-blöcke-auf-einmal)
19. [Die Schnittstelle /v1/ ohne Server](#19-die-schnittstelle-v1-ohne-server)
20. [Notions eigene Schreibweisen](#20-notions-eigene-schreibweisen)
21. [Ein Protokoll statt drei](#21-ein-protokoll-statt-drei)
22. [Dateien in Stücken](#22-dateien-in-stücken)
23. [Was Redion bewusst nicht tut](#23-was-redion-bewusst-nicht-tut)

---

## 1. Datenbanken und Ansichten

### Zeitstrahl

| | Notion | Redion |
|---|---|---|
| Zoomstufen | 3 (Woche, Monat, Quartal) | **5** — Tag, Woche, Monat, Quartal, Jahr |
| Abhängigkeiten | nur als Spalte, unsichtbar | **Pfeile zwischen den Balken**, aus einer Verknüpfung der Datenbank auf sich selbst |
| Balken verschieben | ja | ja — **und am rechten Rand länger ziehen**, beides schreibt die Daten zurück |
| Namensspalte | keine | **fest links**, wie in einem Projektplan |
| Wochenende | nicht markiert | grau hinterlegt |

Die Pfeile entstehen von selbst, sobald es eine Verknüpfung gibt, deren Ziel
dieselbe Datenbank ist. Im Fussmenü lässt sich einstellen, welche das ist.

### Board

Notion gruppiert ein Board nach genau einer Eigenschaft. Redion kann eine
**zweite Achse**: die Bahnen. Status läuft dann waagrecht, Team senkrecht.
Zieht man eine Karte in eine andere Bahn, ändern sich **beide** Werte.

Dazu: **Kartenbilder**. Redion sucht selbst nach einem Bild — in einer
Datei-Spalte, in einer URL-Spalte oder im ersten Bildblock der Zeilenseite.
Wahlweise füllend oder ganz sichtbar.

### Gruppierte Tabellen

Notion gruppiert Tabellen, zeigt aber keine Zahlen je Gruppe. In Redion hat
**jede Gruppe ihre eigene Berechnungszeile** — dieselbe Rechnung, die unter
der Tabelle steht, noch einmal für jede Gruppe. Die Gruppenüberschrift zeigt
die erste eingestellte Berechnung mit.

Und man kann nach Dingen gruppieren, nach denen Notion nicht gruppiert:

- **Datum in Zeitabschnitten** — Tag, Woche (mit Kalenderwoche), Monat,
  Quartal, Jahr. Notion macht aus jedem einzelnen Tag eine eigene Gruppe.
- **Zahlen in Stufen** — je 5, 10, 25, 100 oder 1000.
- Text, Formeln, „Erstellt am", „Zuletzt bearbeitet".

### Kalender

- **Mehrtägige Termine als durchgehender Balken** über die Woche, in Spuren
  gestapelt, damit sich nichts überdeckt. Notion setzt in jeden Tag einen
  eigenen Schnipsel.
- **Wochenansicht als echtes Stundenraster** mit Ganztags-Zeile oben und
  einer Linie, die zeigt, wie spät es gerade ist.
- Doppelklick auf eine Stunde legt einen Termin zu genau dieser Zeit an.

### Kreuztabelle (Pivot)

Notion hat keine. Redion: Zeilenfeld × Spaltenfeld × Wertefeld, sieben
Rechenarten, Zwischensummen, Prozent je Zeile, Spalte oder gesamt — und ein
**Klick in jede Zelle zeigt die Zeilen, aus denen die Zahl kommt**.

### Diagramme

Sechs Typen wie in Notion, dazu:

- Der Wert steht **über dem Balken**, nicht erst beim Überfahren.
- **Ein Klick auf Balken, Ringsegment oder Legende** öffnet die Zeilen
  dahinter — mit der Möglichkeit, genau diese Auswahl als CSV zu speichern.

### Weitere Ansichten, die Notion nicht hat

- **Karte** mit OpenStreetMap, ohne Schlüssel und ohne Konto
- **Dashboard** aus mehreren Ansichten
- **Feed**
- **Datenmodell** — alle Datenbanken, ihre Felder mit Füllgrad und die
  Verknüpfungen dazwischen als Diagramm. Notion zeigt nirgends, wie das
  eigene Datenmodell aussieht.
- **Kennzahlen-Tafel** — Zahlen aus mehreren Datenbanken nebeneinander, je
  mit Ziel, Balken und Farbe.

### Formular

- **Danke-Seite** mit eigener Überschrift und eigenem Text statt nur einer
  Meldung; „Noch eine Antwort" abschaltbar
- **Antwortzähler** je Formular, zurücksetzbar
- Bedingte Fragen, Pflichtfelder, freier Knopftext

### Ansichtsvorlagen

Eine fertig eingerichtete Ansicht bekommt einen Namen und lässt sich auf jede
andere Datenbank anwenden. Einstellungen, deren Spalten es dort nicht gibt,
fallen still weg statt Fehler zu erzeugen. Notion kennt nur Seitenvorlagen.

---

## 2. Formeln

Alle **99 Funktionen von Notion 2.0** sind da — nachgemessen, nicht behauptet.
Dazu kommen rund sechzig, die es in Notion nicht gibt:

**Die Zeile im Verhältnis zu den anderen** (Notion kann das gar nicht):
`rowNumber()`, `previous("Betrag")`, `next(…)`, `delta(…)`, `runningSum(…)`,
`runningCount()`, `runningMax/Min`, `rank("Punkte")`, `percentOfTotal(…)`,
`total(…)`, `average(…)`, `rowCount()`.

**Eine andere Datenbank fragen — ohne Verknüpfung**:
`countWhere("Rechnungen", …)`, `sumWhere(…)`, `findRows(…)`, `firstWhere`,
`lastWhere`, `maxWhere`, `minWhere`, `rows(…)`.

**Werktage und Zeiträume**: `businessDaysBetween`, `addBusinessDays`,
`isWeekend`, `isWorkday`, `startOfDay/Week/Month/Quarter/Year`, dazu jeweils
`endOf…`, `quarter`, `daysInMonth`, `isLeapYear`.

**Zeitzonen**: `convertTimezone`, `timezoneOffset`, dritter Parameter in
`formatDate`.

**Zufall**: `random`, `randomBetween`, `randomItem`, `shuffle`.

**Statistik**: `stdDev`, `variance`, `percentile`, `clamp`, `roundTo`.

**Text**: `padStart`, `padEnd`, `startsWith`, `endsWith`, `capitalize`,
`titleCase`, `slug`, `initials`, `wordCount`, `truncate`.

**Gruppieren in der Formel**: `groupKey`, `groupItems`, `groupCount`,
`reduce`, `sortBy`, `groupBy`.

### Eigene Funktionen

Notion hat kein LAMBDA. Redion hat eine **Funktionsbibliothek**: eigene
Funktionen mit Namen und Parametern, in den Einstellungen gepflegt, in jeder
Formel benutzbar. Ein Selbstaufruf wird nach zwanzig Ebenen abgebrochen statt
den Browser anzuhalten.

### Formel-Werkstatt

- **Einrücken** — eine lange Formel lesbar machen
- **Zwischenergebnisse** — Schritt für Schritt sehen, was jeder Teilausdruck
  ergibt
- **Rückgabetyp** — der Editor sagt, ob Zahl, Text, Datum, Ja/Nein oder Liste
  herauskommt, mit Länge oder Anzahl. Notion sagt das nie.

---

## 3. Filter, Sortieren, Gruppieren

### Zwei Spalten vergleichen

Notion vergleicht immer gegen einen festen Wert. Redion kann **Spalte gegen
Spalte derselben Zeile**: „Ende ist vor Start", „Ist-Kosten sind grösser als
Budget". Ein Knopf in jeder Filterzeile schaltet um.

### Filtervorlagen

Ein einmal gebauter Filter bekommt einen Namen und lässt sich überall wieder
anwenden.

### Mehrstufige Sortierung

Beliebig viele Ebenen mit eigener Richtung, per Pfeil verschiebbar. Und:
**nach einer Formel sortieren, ohne dafür eine Spalte anzulegen** — Notion
verlangt dort immer eine echte Formel-Eigenschaft.

---

## 4. Automationen

Alle Auslöser und Aktionen von Notion sind da. Dazu:

| | Notion | Redion |
|---|---|---|
| Wiederkehrend | „every {frequency}", nicht näher benannt | **acht Takte**, mit Uhrzeit, Anfang, Ende und Wirkungsbereich |
| Bedingung | gilt für alle Aktionen zusammen | **je Aktion eine eigene Bedingung**, umkehrbar — das ist das „sonst", das Notion fehlt |
| Verlauf | keiner | **Laufverlauf** je Automation |
| Ausprobieren | nur scharf | **Testlauf** an einer Zeile |
| Variablen | ja | ja, `{{name}}` in allen späteren Aktionen |
| Mehrere Auslöser | einer | **any / alle** mit 3-Sekunden-Fenster |
| Aktionen | 19 | **19** — dazu archivieren, löschen, leeren, duplizieren, kommentieren, zurückstellen |

Automationen lösen keine Automationen aus — dieselbe Regel wie in Notion,
damit sich nichts im Kreis dreht.

---

## 5. Blöcke und Seiten

### Inhaltsverzeichnis

Notions Verzeichnis sieht nur die oberste Ebene. Redion sucht die
Überschriften **auf der ganzen Seite** — auch in Toggles, Spalten und
Callouts —, nimmt Toggle-Überschriften mit, kann durchnummerieren und
**hebt hervor, wo man gerade steht**.

### Synchronisierte Blöcke

- Der Kopf zeigt, **an wie vielen Stellen** derselbe Inhalt steht
- Sprung zur Quelle, Quelle wechseln
- **Verbindung lösen** — der Inhalt bleibt als eigenständige Kopie stehen
- Ein Spiegel, der sich selbst enthält, wird **erkannt und gemeldet**, statt
  den Browser in einer Endlosschleife anzuhalten

### Code

Zeilennummern (abschaltbar), Kopierknopf, Umbruch für lange Zeilen,
47 Sprachen mit eigener Einfärbung.

### Bilder

Grösse in vier Stufen **und** mit der Maus, Ausrichtung links / mittig /
rechts, Vollbild mit Beschriftung. Notion kann nur ziehen.

### Dateien

Ein PDF lässt sich **direkt im Anhang ansehen**, in zwei Höhen. Notion bietet
nur das Herunterladen.

---

## 6. Die KI, die nichts kaputt macht

Notions KI schreibt und ändert direkt. Redions KI schlägt vor — und jeder
Vorschlag wird **vorher geprüft**:

- **Formel schreiben.** Die KI bekommt die Spaltennamen und die Liste der
  Funktionen, die es hier wirklich gibt. Ihre Antwort wird **an einer echten
  Zeile durchgerechnet**. Erst dann sieht man den Vergleich alt/neu und das
  Ergebnis. Rechnet es nicht, bleibt „Übernehmen" gesperrt.
- **Automation bauen.** Die Antwort muss zu den Auslösern und Aktionen
  passen, die es gibt. Erfundene werden benannt und abgelehnt. Angelegt wird
  sie **ausgeschaltet**.
- **Filter bauen.** Ein Probelauf sagt vorher, auf wie viele Einträge der
  Filter zutrifft.
- **Formel erklären.** In sechs Sätzen, mit einem Fall, in dem sie
  überrascht.

Der Vergleich ist ein echter Zeilenvergleich: was wegfällt in Rot, was
dazukommt in Grün.

Dazu unverändert: KI-Modelle von Ollama, WebLLM und sechs Anbietern mit
eigenem Schlüssel — **der Schlüssel bleibt im Browser** und geht nur an den
jeweiligen Anbieter.

---

## 7. Fenster, Reiter, geteilte Ansicht

Notion hat Reiter nur in der Desktop-App. Redion hat sie überall, auch im
Browser:

- `Strg + T` neu, `Strg + W` zu, `Strg + Tab` weiter, `Strg + 1…9` direkt
- mit der Maus umsortierbar
- **überleben den Neustart**

**Geteilte Ansicht** neben- oder übereinander, Trennlinie ziehbar, Seiten
tauschbar. `Shift + Klick` auf einen Seitenlink öffnet ihn rechts. In der
rechten Hälfte lässt sich normal schreiben.

**Linkvorschau**: Über einem Seitenlink erscheint nach kurzem Verweilen eine
Karte mit Titel, Pfad und den ersten Zeilen. Notion zeigt beim Überfahren
nichts.

---

## 8. Aussehen und Tastatur

Notion lässt hell, dunkel und drei Schriften je Seite zu. Redion:

- **acht Farbschemata** — Standard, Hell, Mitternacht, Wald, Sand, Papier,
  Starker Kontrast, Rosé
- **frei wählbare Akzentfarbe**
- **fünf Schriften für die ganze App**, Schriftgrösse, Zeilenabstand,
  Seitenbreite
- **Tastenkürzel umbelegen** — 22 Befehle, mit Schutz vor Doppelbelegung.
  Ein umbelegtes Kürzel wird an seiner alten Stelle still gelegt. Notions
  Kürzel sind fest verdrahtet.
- **Seitenleiste in der Breite ziehbar**, Doppelklick setzt zurück
- **Abschnitte der Seitenleiste umsortieren** — Notion lässt sie nur
  ein- und ausblenden

Dazu Barrierefreiheit: sichtbarer Fokus, ruhige Darstellung bei
`prefers-reduced-motion`, leichteres Lesen, hoher Kontrast, „Zum Inhalt
springen".

---

## 9. Versionen

Notions Versionsverlauf zeigt eine alte Fassung und bietet einen Knopf: alles
zurück. Redion:

- **Vergleich zweier Fassungen, Block für Block**, mit den geänderten Wörtern
  in Farbe
- Zusammenfassung: so viele Blöcke neu, geändert, gelöscht
- **einzelne Blöcke zurückholen** statt der ganzen Seite. Ein gelöschter
  Block kommt mit seiner alten Kennung zurück, wenn er noch im Papierkorb
  liegt.
- **zwei beliebige Fassungen** gegeneinander, nicht nur gegen jetzt

---

## 10. Hinein und heraus

### Herausgeben

| Format | Notion | Redion |
|---|---|---|
| Markdown, HTML, CSV, PDF | ja | ja |
| **Word (.docx)** | nein | **ja** — Überschriften, Aufzählungen, Aufgaben, echte Tabellen aus Datenbanken |
| **Excel (.xlsx)** | nein | **ja** — ein Blatt je Ansicht, Zahlen bleiben Zahlen |
| Alles als eine HTML-Datei | nein | ja |
| Alles als Markdown-Ordner | ja | ja |

Word und Excel entstehen ohne fremdes Paket: ein eigener ZIP-Packer und das
Office-XML. Die Prüfung liest die erzeugte Excel-Datei mit dem eigenen
Einleser wieder ein.

### Hereinholen

- **Trello** (JSON) — Listen werden Status, Etiketten eine Mehrfachauswahl,
  Checklisten werden Aufgaben, das Board ist sofort fertig eingerichtet
- **Evernote** (.enex) — jede Notiz eine Seite, Schlagwörter bleiben
- **Obsidian** (ganzer Ordner) — Ordner werden Unterseiten, `[[Wikilinks]]`
  werden **echte Verweise**
- **Notion-Export** (ZIP) — Markdown und CSV, die langen IDs im Dateinamen
  fallen weg
- **Asana / Jira / Monday** (CSV)
- Einzelne Dateien: Markdown, Text, CSV, HTML, Word, Excel, EPUB, Bilder

---

## 11. Tempo

Notion wird bei grossen Datenbanken zäh, und man erfährt nie, woran es liegt.

- **Formelspeicher** — jede Formel wird je Zeile einmal gerechnet und
  gemerkt, bis sich an den Daten etwas ändert. Gemessen: 400 Rechnungen beim
  ersten Zeichnen, danach null.
- **Fensterweises Zeichnen** — von einer langen Tabelle stehen nur die Zeilen
  im Dokument, die man sehen kann.
- **Suchregister** über alle Blöcke, in Millisekunden gebaut.
- **Messanzeige** — Zeichendauer, Zahl der gerechneten Formeln, Trefferquote
  des Speichers und **die teuersten Formeln mit Namen**. Notion zeigt so
  etwas nirgends.

Alles drei lässt sich einzeln abschalten.

---

## 12. Planen

- **Zurückstellen** — eine Seite oder Zeile für eine Weile aus dem Weg legen:
  später heute, morgen früh, übermorgen, nächste Woche, in zwei Wochen,
  nächsten Monat, in drei Monaten oder an einem gewählten Tag. Zur richtigen
  Zeit kommt sie von selbst wieder hoch und meldet sich im Posteingang.
  Notion kennt nur Erinnerungen an einem Datum.
- **Tagesplan** — was heute ansteht, was überfällig ist, was ohne Datum
  wartet. Mit einer **ehrlichen Rechnung**: passt das in acht Stunden? Wenn
  nicht, sagt Redion es.
- **Wochenrückblick** — erledigt, fällig, überfällig, neue Seiten; ein
  Balken je Tag; was liegengeblieben ist; woran gearbeitet wurde. Auf Wunsch
  als Seite, die man weiterschreiben kann.

---

## 13. Ordnung halten

- **Gesundheitsbericht** — verwaiste Seiten, kaputte Verknüpfungen, nie
  gefüllte Eigenschaften, leere Datenbanken, **gemessen teure Formeln**,
  blinde Ansichten, Regelverstösse, Papierkorb
- **Dubletten finden** und zusammenführen
- **Prüfregeln je Spalte** — Pflichtfeld, eindeutig, Muster, Zahlbereich,
  freie Formelregel. Ein falscher Wert wird gar nicht erst geschrieben.
- **Statusübergänge** — von welchem Wert darf man zu welchem springen?
  „Von *Entwurf* nur auf *Eingereicht*." Notion lässt jeden Sprung zu.
- **Papierkorb mit Zielwahl** — an einer anderen Stelle wiederherstellen.
  Und wenn der alte Ort selbst im Papierkorb liegt, sagt Redion das, statt
  die Seite ins Nichts zurückzulegen.
- **Fehlerliste** statt stiller Fehler, dazu eine Erste-Hilfe-Seite
- **Papierkorb räumt nach Frist selbst auf**

---

## 14. Sicherheit

- **Verschlüsselte Sicherung** — AES-GCM 256 mit PBKDF2 über 310 000 Runden.
  Die Datei enthält Salz und IV; ohne Passwort ist nichts zu holen.
- **Sperre beim Öffnen** mit Passwort
- Alles bleibt auf dem Gerät. Kein Konto, kein Server, keine Übertragung —
  ausser zur KI, wenn man selbst eine einrichtet, und zu OpenStreetMap, wenn
  man eine Karte benutzt.

---

## 15. Zusammenarbeit an einem Gerät

Ohne Server gibt es kein gleichzeitiges Schreiben. Was es gibt, ist trotzdem
mehr als eine Notizfunktion:

- **Kommentarfäden** — jeder Kommentar hat Antworten, einzeln löschbar.
  Bisher stand hier jeder Kommentar für sich allein.
- **Sechs Emoji-Reaktionen** je Kommentar; der Tooltip nennt, wer reagiert hat.
- **@Erwähnungen** werden Links auf die gleichnamige Seite. Unbekannte bleiben
  grau, statt ins Leere zu führen.
- **„An dich gerichtet"** steht ganz oben im Posteingang: offene Kommentare,
  in denen dein Name vorkommt.
- **Vorschlagsmodus** hält alte und neue Fassung fest, mit Annehmen und
  Verwerfen.

---

## 16. Was hereinkommt

Notion hat seit 2024 einen eingehenden Webhook — dafür braucht es einen
Server. Redion geht den umgekehrten Weg, und nichts läuft über fremde Hände:

- **Abholen statt zugeschickt bekommen.** Eine Adresse, ein Takt (5 Minuten,
  15 Minuten, stündlich, beim Öffnen oder nur von Hand), eine Anmeldung und
  ein Pfad ins JSON. Was dort steht, wird zu Zeilen.
- **Von Hand einwerfen** — JSON hineinkippen, einzeln oder als Liste.
  Fremde Feldnamen lassen sich zuordnen; aus `"9"` wird die Zahl 9.
- **Doppelte fernhalten** über ein Schlüsselfeld. Beim zweiten Abholen kommt
  nichts doppelt herein — Notions Webhook kann das nicht.
- **Aus der Adresse.** Ein Link wie
  `…#neu=Auftraege&titel=Von+aussen&Menge=9` legt beim Öffnen eine Zeile an.
  Damit kann jede Desktop-Verknüpfung und jeder iPhone-Kurzbefehl etwas nach
  Redion schicken.
- Was hereinkommt, **löst die Automationen aus** wie eine Formularantwort.

Und andersherum: der ausgehende Webhook **meldet sich an** — Bearer, Basic,
eigene Kopfzeile oder ein Geheimnis im Datenpaket. Notion schickt gar keine
Anmeldung mit; viele Dienste weisen deshalb jede Anfrage ab.

---

## 17. Erweiterungen

Notion hat keine. Was es nicht kann, kann man dort nicht nachrüsten — man
wartet. In Redion fügt ein kleines Stück JavaScript selbst etwas hinzu:

| | |
|---|---|
| `Redion.formel(name, fn)` | eine eigene Formelfunktion, sofort in jeder Spalte |
| `Redion.befehl(titel, text, fn)` | ein Eintrag in der Befehlspalette |
| `Redion.knopf(titel, icon, fn)` | ein Knopf in der Seitenleiste |
| `Redion.beimStart(fn)` | läuft einmal beim Öffnen |
| `Redion.beiAenderung(fn)` | läuft bei jeder Datenänderung |
| `Redion.daten.…` | Seiten, Blöcke, Datenbanken und Zeilen lesen |
| `Redion.schreibe.…` | Seite, Block oder Datenbankzeile anlegen |

**Abgeschirmt — und ehrlich beschrieben.** `Store`, `window`, `fetch`,
`document`, `localStorage`, `globalThis`, `Worker` und zwei Dutzend weitere
Namen sind im Code einer Erweiterung **leer**. Im Fenster steht wörtlich:
*„Das ist ein Zaun, kein Tresor — baue nur ein, was du verstehst."* Auch
`eval` fehlt in der Liste, weil der strikte Modus keinen Parameter so nennen
lässt; das steht als Kommentar im Code, statt verschwiegen zu werden.

Dazu ein **Probelauf**, bevor etwas eingebaut wird, und vier fertige
Beispiele: Wörter zählen, römische Zahlen, Tagesnotiz, leere Seiten melden.

---

## 18. Mehrere Blöcke auf einmal

In Notion drückt man **Esc** und hat den Block ausgewählt; mit Umschalt und
den Pfeilen wächst die Auswahl, und dann gilt jede Taste für alle. Genau das
fehlte hier lange — jede Taste galt immer nur für den Block unter dem
Cursor. Wer zehn Absätze in Listenpunkte verwandeln wollte, musste zehnmal
dasselbe tun.

| Taste | Was geschieht |
|---|---|
| `Esc` | Block auswählen — und beim zweiten Mal wieder freigeben |
| `Shift ↑ ↓` | Auswahl vergrössern |
| `↑ ↓` | Auswahl verschieben |
| `Strg A` | alle Blöcke der Seite |
| `Shift`-Klick · `Strg`-Klick | von hier bis dorthin · einzelnen dazu oder weg |
| `Strg C` · `Strg X` · `Strg V` | als Markdown kopieren, ausschneiden, einfügen |
| `Strg D` · `Entf` | alle duplizieren · alle in den Papierkorb |
| `Tab` · `Shift Tab` | alle einrücken, alle ausrücken |
| `Strg Shift ↑ ↓` | alle gemeinsam verschieben |
| `Strg Shift 0-9` | alle umwandeln |
| `Leertaste` | öffnen, auf- und zuklappen, abhaken |

Dazu eine kleine Leiste, die sagt, wie viele Blöcke gewählt sind und was mit
ihnen geht. Kopiert wird in beide Richtungen: als Markdown in die
Zwischenablage **und** als echte Blöcke, damit `Strg V` die Struktur behält.

Die Kürzelübersicht steht bei **127 Kürzeln in zwölf Gruppen**. Notions
Hilfeseite zählt 160 — dort werden Mac- und Windows-Belegung getrennt
gezählt; hier steht jede Taste einmal.

---

## 19. Die Schnittstelle /v1/ ohne Server

Notion hat eine öffentliche REST-Schnittstelle. Das schien lange
unerreichbar: *dafür bräuchte es einen Server*. Das stimmt nur halb. Ein
Server wird gebraucht, damit jemand **von aussen** anfragen kann. Die
Schnittstelle selbst — die Adressen, die Formen, die Fehlercodes, die
Blätterung — braucht keinen.

```js
await fetch('/v1/databases/' + id + '/query', {
  method: 'POST',
  headers: { 'Notion-Version': '2022-06-28',
             Authorization: 'Bearer redion_…' },
  body: JSON.stringify({
    filter: { and: [ { property: 'Status', select: { equals: 'Offen' } },
                     { property: 'Zahl',   number: { greater_than: 15 } } ] },
    sorts: [{ property: 'Zahl', direction: 'descending' }],
    page_size: 25
  })
})
```

Das funktioniert wirklich. Der Servicearbeiter fängt `/v1/…` ab und lässt
das offene Fenster antworten — auch `POST`, `PATCH` und `DELETE`.

| Was | Wo |
|---|---|
| Seiten lesen, anlegen, ändern | `GET`/`POST`/`PATCH /v1/pages` |
| einzelnen Eigenschaftswert | `GET /v1/pages/{id}/properties/{key}` |
| Blöcke lesen, anhängen, ändern, löschen | `/v1/blocks/…` |
| Datenbanken samt Abfrage | `/v1/databases/…`, `POST …/query` |
| Suche, Nutzer, Kommentare | `/v1/search`, `/v1/users`, `/v1/comments` |

Werte kommen in Notions öffentlicher Form heraus — `{"number": 80}`, nicht
die interne. Fehlt der `Notion-Version`-Header, kommt **400
`missing_version`**; fehlt das Token, **401 `unauthorized`**. Ein Token legt
man in der Befehlspalette unter *Schnittstelle /v1/ und Token* an; dort
steht auch eine kleine Konsole zum Ausprobieren.

**Und die internen Adressen.** Notions App spricht nicht über die
öffentliche API mit sich selbst, sondern über `loadPageChunk`,
`queryCollection` und `submitTransaction`. Alle drei gibt es unter
`/api/v3/`, in Notions Form mit `recordMap` und Umschlägen.

Der interessante Teil ist der dritte. Notion schickt nie „speichere diese
Seite", sondern immer eine **Liste kleiner Befehle**:

```json
{ "id": "…", "table": "block", "path": ["properties","title"],
  "command": "set", "args": [["Neu benannt"]] }
```

Fünf Befehle: `set`, `update`, `listAfter`, `listBefore`, `listRemove`. Das
Modell hat drei echte Vorteile, die nichts mit einem Server zu tun haben:

- **Alles oder nichts.** Geht ein Befehl schief, wird die ganze Liste
  zurückgedreht.
- **Ein Schritt zurück.** Zwei Blöcke in einer Transaktion geändert — ein
  einziges `Strg Z` holt beide zurück.
- **Noch einmal abspielen.** Die letzten fünfzig Transaktionen bleiben
  aufgehoben.

Was **nicht** geht: Anfragen aus dem Internet. Ohne offenes Fenster kommt
503 mit Begründung, und der Cloudflare-Worker antwortet von aussen ebenso.
Das ist keine Lücke, sondern der Grund, warum die App so gebaut ist.

---

## 20. Notions eigene Schreibweisen

Notion speichert einen Wert nicht als `80`, sondern als `[["80"]]` — eine
Liste von Textstücken, jedes selbst eine Liste aus Text und Auszeichnungen.
Aus „Hallo" fett wird `[["Hallo",[["b"]]]]`, aus einem Datum
`[["‣",[["d",{…}]]]]`, aus einer Verknüpfung eine Kette aus ‣ und Kommas.
Formeln speichert Notion als Baum, in dem Rechenzeichen Funktionen heissen:
aus `a + b` wird `add(a, b)`.

Redion speichert beides bewusst anders — Werte flach, Formeln als Text. Das
ist einfacher zu lesen, zu sichern und zu durchsuchen. Aber „wir machen das
anders" ist keine Antwort, solange die Daten des Menschen im anderen Format
liegen. Deshalb wird jetzt **in beide Richtungen** übersetzt:

- Werte lesen und schreiben, mit Datum, Uhrzeit, Zeitspanne, Person,
  Verknüpfung, Mehrfachauswahl und Datei
- Auszeichnungen zwischen Notions Marken und Markdown
- Formeln zwischen unserem Baum und Notions, mit Klammern nur da, wo sie
  nötig sind

Geprüft wird nicht, ob der Text danach gleich aussieht, sondern **ob beide
Fassungen dasselbe rechnen**.

Praktischer Nutzen: der Notion-Import liest jetzt auch die JSON-Dateien
eines Exports. Daraus entsteht eine echte Datenbank samt Formeln und
Auswahlwerten — statt einer flachen CSV, in der die Formelspalte nur noch
tote Zahlen enthält.

---

## 21. Ein Protokoll statt drei

Es gab drei Stellen, an denen etwas mitgeschrieben wurde: der
Versionsverlauf einer Seite, das KI-Protokoll und der Laufverlauf der
Automationen. Drei Orte, drei Formen — und keiner beantwortet die Frage, die
man wirklich hat: **„Was ist gestern hier eigentlich passiert?"**

Jetzt gibt es eines für alles: Seiten anlegen, wegwerfen, zurückholen,
endgültig löschen; Datenbanken, Zeilen, Spaltenänderungen;
Automationsläufe mit Name und betroffener Zeile; KI-Aufrufe mit Modell;
Rechteänderungen mit Vorher und Nachher; schreibende Zugriffe über die
Schnittstelle; Transaktionen. Filterbar nach Art, Person, Tag und Text, als
CSV ausgebbar, ein Klick springt zur Seite.

Zwei Grenzen stehen im Fenster, statt verschwiegen zu werden:

- Es liegt **im Browser**, nicht auf einem Server. Wer hier sitzt, kann es
  auch löschen. Ein Protokoll, das gegen den eigenen Besitzer schützen soll,
  braucht einen fremden Ort.
- Es zählt **nicht** mit, was jemand nur ansieht. Das wäre Überwachung ohne
  Nutzen. Beim KI-Aufruf steht das Modell, nicht die Frage.

Ganz abschalten geht auch.

---

## 22. Dateien in Stücken

Notion lädt grosse Dateien in drei Schritten hoch: anmelden, Teile schicken,
bestätigen. Das ist keine Umständlichkeit, sondern Wirklichkeit — 300 MB
gehen nicht in einem Stück.

Hier lag die Datei bisher als Data-URL direkt im Block. Für ein kleines Bild
ist das richtig, aber es hat drei Nachteile:

1. Base64 ist **um ein Drittel grösser** als die Datei selbst.
2. Sie liegt **vollständig im Arbeitsspeicher**, auch wenn niemand hinsieht.
3. Der ganze Block wandert bei **jeder** Änderung mit durch die Ablage — ein
   Video von 50 MB also auch beim Umbenennen der Bildunterschrift.

Deshalb war bei 12 MB Schluss. Jetzt derselbe Ablauf wie bei Notion, nur
ohne Server: Stücke zu je 1 MB, jedes einzeln als Blob in IndexedDB.
Angezeigt wird über eine Blob-Adresse, die der Browser selbst hält. **Bis
500 MB statt 12.**

Dazu ein Fortschrittsbalken, ein Abbruch, der die Stücke wieder wegräumt,
und ein Aufräumer für verwaiste Dateien — Block gelöscht oder Upload nie zu
Ende gebracht, beides sammelt sich sonst still an. Kleine Dateien unter
256 KB gehen weiter den kurzen Weg; für ein Bild von 40 KB wäre der Apparat
Unfug.

---

## 23. Was Redion bewusst nicht tut

Damit die Liste ehrlich bleibt:

- **Keine Zusammenarbeit in Echtzeit.** Ohne Server gibt es niemanden, mit
  dem man gleichzeitig schreiben könnte. Kommentare, Erwähnungen und
  Vorschläge gibt es — aber für einen Menschen an einem Gerät.
- **Keine Freigabe ins Netz.** Weitergeben heisst hier: eine Datei erzeugen.
- **Rechte sind eine Absprache, kein Schloss.** Es gibt Konten, fünf Rollen
  und eine Matrix, und sie wirken in der Oberfläche. Aber wer den Browser
  aufmacht, kommt an alles heran. Ein echtes Schloss braucht einen Ort, an
  den der Besitzer selbst nicht herankommt — und den gibt es hier nicht.
- **Keine Anmeldung über SAML, kein Besitzerwechsel.** Beides setzt fremde
  Konten und einen Server voraus.
- **MCP nur in eine Richtung.** Als Client läuft es; Anfragen entgegennehmen
  kann die App nicht, dafür bräuchte es eine offene Verbindung von aussen.
- **Kein Abo, keine Grenzen.** Auch keine Serverdienste, die eines
  bräuchten — Slack-Nachrichten etwa laufen nur über einen Webhook, den man
  selbst einträgt.

---

*Diese Datei gehört zur Sammlung in `Notion-Doku`. Die anderen sieben Teile
beschreiben Notion, dieser hier beschreibt, was daraus geworden ist.*
