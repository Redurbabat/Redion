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
23. [Ein eigener Server — freiwillig, kostenlos](#23-ein-eigener-server--freiwillig-kostenlos)
24. [Zusammenführen statt Überschreiben](#24-zusammenführen-statt-überschreiben)
25. [Rechte bis auf die einzelne Spalte](#25-rechte-bis-auf-die-einzelne-spalte)
26. [Probelauf: erst zeigen, dann tun](#26-probelauf-erst-zeigen-dann-tun)
27. [Prüfsätze: was stimmen soll, festhalten](#27-prüfsätze-was-stimmen-soll-festhalten)
28. [Vorlagen, die ein Update bekommen können](#28-vorlagen-die-ein-update-bekommen-können)
29. [Vorberechnete Werte, mit sichtbarem Stand](#29-vorberechnete-werte-mit-sichtbarem-stand)
30. [Was Redion bewusst nicht tut](#30-was-redion-bewusst-nicht-tut)

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

## 23. Ein eigener Server — freiwillig, kostenlos

Lange war der Satz „es gibt keinen Server" hier das stärkste Argument: keine
Kosten, keine Abhängigkeit, kein Ort, an dem fremde Augen sitzen. Der Satz
gilt weiter — nur ist er jetzt eine **Wahl** und keine Grenze mehr.

Wer den Server einrichtet (zehn Minuten, `SERVER-EINRICHTEN.md`), bekommt
vier Dinge, die ohne ihn nicht gehen: dieselben Notizen auf Rechner und
Telefon, Rechte die wirklich sperren, eine Seite die man jemandem schicken
kann, und eine Schnittstelle von aussen. Wer ihn nicht einrichtet, verliert
nichts von dem, was vorher da war.

Was der Server **nicht** sieht: private Seiten. Die werden auf dem Gerät
verschlüsselt (AES-GCM 256, Schlüssel über PBKDF2 mit 310 000 Runden) und
verlassen es nur so. Was er sieht: was ausdrücklich geteilt oder
veröffentlicht wird — anders kann er keine Rechte prüfen und keinem fremden
Browser eine Seite zeigen. Deshalb steht genau dieser Satz beim Teilen über
dem Schalter und nicht in einer Fussnote.

Und er kostet nichts: Cloudflare Workers erlauben 100 000 Anfragen am Tag,
D1 fünf Gigabyte. Zwei Geräte mit einem Abgleich alle zwei Minuten brauchen
rund 1 500 — ein Sechzigstel. Eine Kreditkarte verlangt Cloudflare beim
kostenlosen Tarif nicht.

---

## 24. Zusammenführen statt Überschreiben

Das ist der Punkt, an dem die meisten Abgleiche unehrlich werden.

Zwei Geräte ändern dieselbe Seite. Der übliche Weg: wer zuletzt gespeichert
hat, gewinnt. Der andere verliert seine Arbeit — **still**, ohne eine Zeile
Hinweis. Man merkt es Tage später, wenn überhaupt, und sucht dann beim
Falschen.

Redion merkt sich zusätzlich den **letzten gemeinsamen Stand**: wie ein Satz
aussah, als beide Geräte ihn gleich sahen. Damit lässt sich sagen, wer was
geändert hat — und nicht nur, wer später dran war:

- **feldweise** — A ändert den Status, B die Priorität: beides bleibt.
- **wortweise** — A schreibt am Anfang des Absatzes, B am Ende: beides
  bleibt. Der Vergleich läuft über die längste gemeinsame Wortfolge, mit
  abgeschnittenen gleichen Anfängen und Enden; 1200 Wörter brauchen dafür
  weniger als eine Sekunde.
- **listenweise** — A hängt einen Block an, B löscht einen anderen: beides
  bleibt, und die Reihenfolge stimmt danach noch. Hat nur einer umsortiert,
  gilt seine Reihenfolge.

Zeitstempel sind nie ein Konflikt — dort gewinnt einfach der spätere. Bei
allem anderen, wo beide **dieselbe Stelle verschieden** gesetzt haben, gibt
es kein automatisches Richtig. Das landet in einer Liste mit beiden
Fassungen nebeneinander und einer Wahl. Bis jemand entscheidet, gilt auf
jedem Gerät die eigene Fassung: die eigene Arbeit zu sehen ist das
Erwartbare. Verworfen wird nichts.

Notion hat davon nichts — dort ist der Server die einzige Wahrheit, und
offline geändert wird ohnehin kaum etwas.

**Zwei Fehler kamen beim Bauen ans Licht**, beide aus derselben Familie:

1. Geholte Sätze lagen nur im Arbeitsspeicher und wurden nie geschrieben.
   Nach dem Neuladen waren sie weg — und weil die Abgleichsmarke schon
   weitergerückt war, kamen sie **nie wieder**.
2. Ein neuer Block änderte die Reihenfolge der Elternseite, ohne sie als
   geändert zu markieren. Das andere Gerät bekam den Block, aber nie die
   Seite, auf der er stehen sollte: er lag im Speicher und war **nirgends zu
   sehen**.

Beides sind Datenverluste, die niemand bemerkt. Deshalb stehen sie hier.

---

## 25. Rechte bis auf die einzelne Spalte

Notions kleinste Einheit ist die Seite: entweder jemand sieht sie oder
nicht. Oft ist das zu grob. Die Personalliste soll das Team sehen — die
Gehaltsspalte nicht.

Hier gibt es je Spalte und Person drei Stufen: **sehen und ändern · nur
sehen · gar nicht.** Ein Eintrag für „alle anderen" gilt als Grundregel, ein
persönlicher sticht ihn.

Wichtig ist, **wo** das geprüft wird: auf dem Server. Beim Herunterladen
wirft er die Werte gesperrter Spalten heraus — sie verlassen ihn nicht.
Beim Hochladen dreht er unerlaubte Änderungen auf den alten Wert zurück und
sagt, welche. Der Rest der Zeile geht trotzdem durch: eine erlaubte Änderung
wegen einer unerlaubten zu verlieren wäre unnötig hart.

Die Oberfläche macht davor nur die Höflichkeit: eine Spalte, die man nicht
ändern darf, lässt sich gar nicht erst ändern, statt dass es beim nächsten
Abgleich stillschweigend zurückgenommen wird.

Zwei ehrliche Grenzen: der **Besitzer** eines Bereichs ist immer aussen vor —
wer sich selbst aus seinen eigenen Daten aussperren kann, hat kein
Rechtesystem, sondern eine Falle. Und es gilt für **geteilte** Seiten;
verschlüsselte kann der Server nicht filtern, weil er nur Zufall sieht.
Dort hat aber ohnehin nur einer den Schlüssel.

---

## 26. Probelauf: erst zeigen, dann tun

Eine Spalte zu löschen dauert eine Sekunde. Dass damit vier Formeln
kaputtgehen, zwei Ansichten ihren Filter verlieren und 312 Werte weg sind,
merkt man erst danach — und der Papierkorb hilft nicht, weil er Seiten kennt
und keine Spalten.

Notion fragt an dieser Stelle „Wirklich löschen?". Das ist die falsche Frage.
Die richtige ist: **was geht dabei kaputt?**

Redion antwortet darauf, bevor es passiert. Der Probelauf zählt echt nach —
nicht geschätzt, sondern gerade eben ausgezählt:

- wie viele Zeilen in dieser Spalte einen Wert haben, mit Beispielen
- welche Formeln sie beim Namen nennen, auch in **anderen** Datenbanken
  (eine Formel darf über `findRows` und `sumWhere` in fremde Tabellen greifen)
- welche Rollups mit ihr rechnen und welche Gegenspalten ins Leere zeigen
- welche Ansichten danach filtern, sortieren, gruppieren oder auswerten
- welche Automationen und Knöpfe sie anfassen

Sechs Vorhaben sind abgedeckt: **Spalte löschen · Typ ändern · umbenennen ·
Seite löschen · Ansicht löschen · Automation trocken laufen lassen.**

Beim Typwechsel wird jeder einzelne Wert probeweise umgewandelt: *„3 von 12
Werten passen nicht in den neuen Typ und werden leer"* — mit Auflistung,
welche. Beim Umbenennen sagt er, ob überhaupt eine Formel den alten Namen
kennt; wenn nicht, heisst es kurz *„Umbenennen ist gefahrlos"*. Beim
trockenen Lauf einer Automation steht, wie viele Zeilen die Bedingungen
erfüllen und was überschrieben würde — und darunter der Satz, dass nichts
davon geschehen ist.

Der Knopf heisst dann nicht „OK", sondern **„Trotzdem tun"**. Und wenn nichts
dranhängt, fragt er gar nicht erst — eine leere, unbenutzte Spalte
verschwindet ohne Zwischenfrage.

---

## 27. Prüfsätze: was stimmen soll, festhalten

Eine Formel zu ändern ist billig. Sie kaputtzumachen auch. Der Unterschied
fällt oft erst Wochen später auf, wenn eine Zahl komisch aussieht — und dann
weiss niemand mehr, welche der zwölf Änderungen seither es war.

Die Notion-KI nennt in ihrer eigenen Liste den Grund, warum es das nirgends
gibt: *„Tests sind ein Softwarekonzept; es müsste so einfach werden, dass
normale Nutzer es verstehen."*

Deshalb heisst hier nichts „Test" oder „Assertion". Ein **Prüfsatz** ist ein
Satz in zwei Hälften:

> **Wenn** Betrag = 100 und Land = „CH"
> **dann** ist MwSt gleich 8.1

Und der wichtigste Weg dorthin geht gar nicht über ein Formular. Man nimmt
eine Zeile, bei der es stimmt, klickt sie mit der rechten Maustaste an und
wählt **„Diesen Fall festhalten"**. Redion liest ab, welche Spalten die
Formel überhaupt nennt, schreibt nur diese ab, rechnet das Ergebnis aus und
macht daraus den Prüfsatz. Wer nie ein Formular ausfüllen will, muss es auch
nicht.

Geprüft wird immer an einer **erfundenen Zeile**, die nur für den Augenblick
der Prüfung existiert. Ein Prüfsatz kann deshalb nichts kaputtmachen —
schlimmstenfalls ist er selbst falsch.

Drei Stellen, an denen das etwas nützt:

- **Sofort**, im Prüfsatz-Fenster: „3 von 12 stimmen nicht mehr", jeweils mit
  dem, was stattdessen herauskam.
- **Im Gesundheitsbericht**, zusammen mit verwaisten Seiten und kaputten
  Verknüpfungen — und dort weit oben, weil es der einzige Befund ist, den ein
  Mensch selbst gesetzt hat.
- **Im Probelauf**, bevor eine Spalte gelöscht oder umgestellt wird: *„2
  Prüfsätze prüfen genau das hier — du hast selbst festgehalten, dass es so
  stimmen soll."*

Auch Automationen lassen sich so festnageln: *„Wenn Betrag = 5000, dann
greift ‚Grosse melden'"* — und daneben der Gegensatz, dass sie bei 10 eben
nicht greift. Beides läuft trocken; keine Zeile wird angefasst.

---

## 28. Vorlagen, die ein Update bekommen können

Das Problem ist in jedem Notion-Workspace zu besichtigen: man setzt ein
Template ein, arbeitet ein Jahr damit, dann kommt eine bessere Fassung
heraus — und man kann sie **nur neu kopieren.** Danach stehen zwei Seiten da:
die neue, die leer ist, und die alte, in der die Arbeit steckt. Meistens
bleibt die alte, und die Verbesserung bekommt niemand.

Hier hat jede Vorlage eine **Fassungsnummer**, und eine eingesetzte Seite
merkt sich, aus welcher Vorlage und welcher Fassung sie stammt. Kommt eine
neue Fassung, sagt Redion es — im Gesundheitsbericht und in einem eigenen
Fenster — und kann den Weg dorthin anwenden.

Zwei Regeln machen das erst benutzbar:

1. **Nur hinzufügen, nie ersetzen.** Ein Migrationsschritt darf eine Spalte
   anlegen, eine Formel setzen, eine Auswahloption oder eine Ansicht
   dazustellen. Er darf nichts löschen und **keine einzige Zeile ändern.**
   Wer sich darauf nicht verlassen kann, drückt nie auf „Anwenden".
2. **Was schon da ist, bleibt.** Hat jemand die Spalte selbst angelegt oder
   die Formel angepasst, wird sie in Ruhe gelassen und im Bericht als „war
   schon da" aufgeführt. Zweimal anwenden ändert deshalb nichts, und der
   eigene Name einer Spalte überlebt jedes Update.

Vor dem Anwenden steht jeder Schritt einzeln da — mit dem **Warum**, nicht
nur dem Was: *„Ein Kreuz reicht nicht — man sieht erst, dass etwas überfällig
ist, wenn man nachrechnet."*

Die Datenbank wird über ihren **Namen** gesucht, nicht über eine gemerkte
Kennung. So bekommt auch eine duplizierte oder verschobene Seite das Update.
Wer eine Datenbank umbenannt hat, bekommt einen ehrlichen Hinweis statt einer
stillen Fehlanwendung: *„Die Datenbank ‚Aufgaben' ist hier nicht mehr zu
finden — dieser Schritt muss von Hand gemacht werden."*

---

## 29. Vorberechnete Werte, mit sichtbarem Stand

Grosse Datenbanken mit Formeln und Rollups werden zäh, und man erfährt
nirgends, warum. Redion hat dagegen zwei Mittel, und der Unterschied
zwischen ihnen ist der Punkt:

- Der **Formelspeicher** rechnet jede Formel einmal je Datenstand und wirft
  alles weg, sobald sich etwas ändert. Nach einem Neuladen ist er leer. Er
  macht ein *Neuzeichnen* billig.
- Der **Vorrat** rechnet auf Wunsch einmal und behält das Ergebnis über
  Änderungen und über das Neuladen hinweg. Er macht das *Öffnen* einer
  grossen Datenbank billig — und nimmt dafür in Kauf, dass ein Wert eine
  Weile veraltet ist.

Das Zweite ist ein Handel, kein Geschenk. Deshalb ist es nirgends von selbst
an, und deshalb steht der Stand **über der Tabelle**, nicht in einer
Einstellung:

> ❄ Gerechnet vor 4 Minuten · 300 Werte in 18 ms · **12 Änderungen seither**
> · Alle 15 Minuten · [Neu rechnen] [Ausschalten]

Ein Zwischenspeicher, den man nicht sieht, ist eine Falle: irgendwann steht
eine Zahl da, die nicht mehr stimmt, und niemand weiss warum.

Wie viele Änderungen es seither gab, wird **nachgezählt** statt mitgezählt —
über die Zeitstempel der Zeilen. Ein Zähler, der an einem Ereignis hängt,
wird irgendwann falsch: er verpasst einen Weg, über den auch geschrieben
wird, und zeigt dann beruhigende Nullen.

Redion sagt auch, wann sich das *nicht* lohnt: *„40 Zeilen sind zu wenig.
Unter 120 kostet das Verwalten mehr, als das Rechnen spart."* Und wenn es
sich lohnt, sagt es warum: *„150 Zeilen mit zwei gerechneten Spalten — das
sind 300 Rechnungen bei jedem Öffnen."*

**Ein Fehler kam dabei ans Licht**, und zwar einer, der viel weiter reichte:
`updateCollection` und `updateView` haben nie einen Zeitstempel gesetzt. Für
den Abgleich hiess das, eine Schemaänderung sei *nie geschehen* — eine neue
Spalte, ein umbenanntes Feld, ein anderer Filter kamen auf dem zweiten Gerät
nie an. Die Zeilen wanderten, ihre Spalten nicht. Das sieht aus wie verlorene
Daten und war nur ein fehlender Zeitstempel.

---

## 30. Was Redion bewusst nicht tut

Damit die Liste ehrlich bleibt:

- **Keine Zusammenarbeit in Echtzeit.** Zwei Menschen können nacheinander an
  derselben Seite arbeiten, und der Abgleich führt beides zusammen — aber
  der Kursor des anderen ist nicht zu sehen, und ein gemeinsames Tippen im
  selben Absatz gibt es nicht.
- **Rechte sperren nur mit Server.** Ohne ihn wirken sie in der Oberfläche,
  aber wer den Browser aufmacht, kommt an alles heran. Ein echtes Schloss
  braucht einen Ort, an den der Besitzer selbst nicht herankommt — und den
  gibt es erst mit dem Server.
- **Keine Anmeldung über SAML, kein Besitzerwechsel.** Beides setzt eine
  Organisation voraus, die es hier nicht gibt.
- **Kein Abo, keine Grenzen.** Und auch keine Dienste, die eines bräuchten —
  Slack-Nachrichten etwa laufen über einen Webhook, den man selbst einträgt.
- **Keine Suche in Bildern und Tonspuren.** Kein OCR, keine Transkripte.

---

*Diese Datei gehört zur Sammlung in `Notion-Doku`. Die anderen Teile
beschreiben Notion, dieser hier beschreibt, was daraus geworden ist.*
