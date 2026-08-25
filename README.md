# Redion

Redion ist eine local-first Notiz-, Datenbank- und Wissens-App im Stil von Notion.  

Die App läuft direkt im Browser, speichert deine Daten zuerst auf deinem eigenen Gerät und kann optional mit einem Server/Cloudflare erweitert werden.

Redion soll drei Dinge gleichzeitig können:

1. Lokal arbeiten
2. Offline sichern
3. Optional mit Cloud/Server synchronisieren

Das wichtigste Prinzip:

Deine Daten gehören dir. Redion muss auch ohne Konto, ohne Server und ohne Abo funktionieren.



Inhalt

Was ist Redion?

Ziele

Schnellstart

Nutzungsarten

Projektstruktur

Architekturregeln

Editor

Blöcke

Datenbanken

Formeln

Wissen und Notizen

KI

Dateien und Anhänge

Sicherung und Export

Das .redion-Format

Server und Cloudflare

Konten und Sync

Sicherheit

Tests

Entwicklung

TypeScript-Ziel

Grenzen

Roadmap



Was ist Redion?

Redion ist eine Notion-ähnliche App für:

Notizen
Seiten
Datenbanken
Aufgaben
Wikis
Karteikarten
Graph
Dateien
Kommentare
Erwähnungen
Automationen
KI-Hilfe
lokale Sicherungen
optionale Cloud-Synchronisation

Redion ist local-first. Das bedeutet:

Die App funktioniert zuerst lokal.
Deine Daten liegen zuerst auf deinem Gerät.
Ein Server ist optional.
Ein Konto ist optional.
Cloud-Sync ist optional.
Export und Offline-Sicherung sind Pflicht.

Redion soll nicht nur eine Web-App sein, sondern ein persönlicher Arbeitsbereich, den man mitnehmen, sichern und später auch auf mehreren Geräten verwenden kann.



Ziele

Hauptziele

local-first
offlinefähig
Notion-ähnlicher Editor
Notion-ähnliche Datenbanken
vollständige Sicherung
Anhänge sicher exportieren
optional Cloudflare Sync
optional Konto
optional öffentliche Seiten
modulare Architektur
später vollständige TypeScript-Migration

Nicht-Ziele

Redion soll nicht abhängig sein von:

Pflichtkonto
Pflichtserver
Pflichtabo
Cloud-Zwang
fremder API
fremder KI
dauerhafter Internetverbindung



Schnellstart

Variante 1: Direkt öffnen

index.html doppelklicken

Das ist die einfachste Nutzung.

Keine Installation.  

Kein Konto.  

Kein Server.



Variante 2: Einzeldatei öffnen

redion-einzeldatei.html

Diese Datei enthält die App gebündelt in einer einzigen HTML-Datei.

Gut für:

USB-Stick
Offline-Nutzung
Archiv
Weitergabe
einfaches Testen



Variante 3: Mit lokalem Prüfserver

npm install
npm run server

Dann im Browser öffnen:

http://localhost:8790



Variante 4: App bauen

node bauen.mts

Erzeugt oder aktualisiert:

redion-einzeldatei.html



Study Suite

Redion enthält eine local-first Arbeitsumgebung für Schule und Ausbildung:

- Dokumentmodus mit Seitenminiaturen, bestehendem PDF-/Ink-Werkzeug und
  verknüpften Notizen, Karten und Aufgaben
- Karten aus PDF-/Blattquelle, Cloze, Tagesrunde, Fehlertraining, Statistik
  und exaktem Quellsprung; bestehende SM-2-Termine bleiben unverändert
- lange Audioaufnahmen als stückweise Anhänge mit stabiler Datei-ID und
  anklickbaren Zeitmarken; alte DataURL-Aufnahmen bleiben lesbar
- Seitenaliase und kollisionssicherer Obsidian-Vault-Roundtrip mit stabilen IDs
- Kamera-/Datei-Eingang sowie optionale OCR für Bild, PDF und Handschrift über
  einen ausdrücklich eingerichteten lokalen Dienst
- additive Ausbildungsvorlage mit Fächern, Prüfungen, Noten, Berichtsheft,
  Lernmaterial und Eingang
- normfreie Elektrotechnik-Rechnungen und ein versioniertes, validiertes
  Grundlagen-Lernpaket; keine automatische Schutz- oder Leiterdimensionierung
- Schulansicht in der bestehenden Bibliothek mit Ordnern, letzten PDFs,
  fälligen Karten, offenen Aufgaben und Prüfungsterminen

Alle Inhalte bleiben normale Redion-Seiten und -Blöcke und laufen damit durch
Offlinebetrieb, Papierkorb, Sicherung, Wiederherstellung und optionalen Sync.


Zwei Hauptwelten, ein Bestand

Redion hat zwei Oberflächen auf denselben Daten. Umgeschaltet wird oben
links; nichts wird dabei kopiert.

**Lernen & Alltag** — Heute mit Tagesrunde und Prüfungs-Countdown,
Lernzentrum, Lernpfad, Fehlertraining, Prüfungszentrale mit Simulation, und
je eine Sicht für Schule/Ausbildung, Uni, Arbeit und Fortschritt. Die
Schulansicht zeigt auch dann etwas, wenn die Ausbildungsvorlage nie
eingerichtet wurde — sie liest, was ohnehin da ist.

**Workspace** — Übersicht, Bibliothek, Aufgaben, Kalender, Datenbanken,
Whiteboards, Wiki und Vorlagen, dazu Reiter und geteilte Ansicht.


Whiteboards

Eine freie Fläche als Block auf einer gewöhnlichen Seite — keine zweite
Datenhaltung:

- schieben und zoomen (Hand, Rad, zwei Finger, 10 % bis 400 %,
  „alles ins Bild")
- Stift, Linie, Pfeil, Rechteck, Ellipse, Haftnotiz, Text
- Bilder aus der Dateiablage, nicht als Data-URL in den Block
- Verbindungen, die an den Formen hängen: sie gehen beim Verschieben mit
  und beim Löschen weg
- vierzig Schritte zurück und vorwärts; der Verlauf lebt nur im
  Arbeitsspeicher und wird nicht mitgesichert
- Text direkt auf der Fläche, zweimal tippen ändert ihn
- Grösse ändern am Griff
- als PNG speichern

Im Workspace gibt es dafür einen eigenen Bereich mit Miniaturen.



Variante 5: Prüfungen ausführen

npm install
npx playwright install chromium
npm run pruefen

Schneller Lauf:

npm run pruefen -- --schnell

Einzelne Prüfung:

node pruefungen/lauf/test87.mts



Nutzungsarten

Redion unterstützt mehrere Nutzungsarten.

1. Nur lokal

Daten liegen im Browser
kein Konto
kein Server
kein Cloud-Sync
Export über JSON oder .redion

Geeignet für:

private Notizen
lokale Datenbanken
Offline-Arbeit
Einzelgerät



2. Lokal mit Sicherung

Daten liegen lokal
regelmäßige Sicherung als JSON oder .redion
Anhänge können mitgesichert werden

Geeignet für:

Backup
Umzug auf anderes Gerät
Langzeitarchiv



3. Lokal + optionaler Server

App bleibt lokal nutzbar
Server ermöglicht Sync
Rechte
Freigaben
öffentliche Seiten

Geeignet für:

mehrere Geräte
private Cloud
geteilte Arbeitsbereiche



4. Cloudflare-Modus

Geplant/optional:

Cloudflare Pages für App
Cloudflare Workers für API
Cloudflare D1 für Konten, Sync-Daten, Rechte
Cloudflare R2 für Dateien und große Anhänge

Geeignet für:

persönliche Cloud
Sync zwischen Geräten
öffentliche Seiten
Download von Offline-Paketen



Am Telefon

Seit August 2026 ist das Telefon die Hauptumgebung, nicht der Nebenschauplatz. Redion sieht dort anders aus als am Rechner — dieselben Daten, ein anderer Weg dorthin.

Oben fünf Wege: der Arbeitsbereich, Start, Seiten, Termine und Mehr. Nur der gewählte trägt seinen Namen; so passen alle fünf auch auf 360 Pixel.

Unten drei Knöpfe, die immer da sind: Suchen, KI fragen, Neue Seite. Der Stift fragt zuerst, was entstehen soll — Seite, Datenbank, Tabelle, Aufgabe, Karteikarte, Datei oder Vorlage.

Menüs kommen als Blatt von unten, nicht als kleines Fenster in der Ecke. Was man antippen soll, ist mindestens 44 Pixel gross.

Als App installieren: In Safari den Teilen-Knopf, dann „Zum Home-Bildschirm". Danach startet Redion ohne Adresszeile, mit eigenem Symbol und offline. Auf dem iPhone erscheinen Erinnerungen als Systemmeldung nur in dieser installierten Fassung (ab iOS 16.4) — in Safari selbst nur innerhalb von Redion.



Projektstruktur

Aktuelle Struktur:

Redion/
├─ index.html
├─ redion-einzeldatei.html
├─ bauen.mts
├─ package.json
├─ package-lock.json
├─ start.bat
├─ oeffnen.bat
├─ sw.js
│
├─ quell/
│  ├─ start.js
│  ├─ kern/
│  ├─ register/
│  ├─ schale/
│  └─ bereiche/
│
├─ oeffentlich/
│  ├─ icons/
│  ├─ manifest/
│  └─ favicon/
│
├─ server/
│  ├─ Cloudflare-Worker
│  ├─ D1/Datenbank
│  ├─ Sync
│  ├─ Rechte
│  └─ Freigaben
│
├─ functions/
│  └─ api/
│
├─ doku/
│  └─ Architektur und Entscheidungen
│
├─ pruefungen/
│  ├─ alle.mts
│  └─ lauf/
│
├─ AUFGABEN.md
├─ LUECKEN.md
├─ ENTSCHEIDUNGEN.md
├─ CLOUDFLARE.md
├─ SERVER-EINRICHTEN.md
├─ START-MIT-CLAUDE-CODE.md
└─ CLAUDE.md



Architekturregeln

Redion folgt drei Grundregeln.

1. Bereiche kennen einander nicht direkt

Ein Bereich darf nur verwenden:

kern/
register/
eigene Dateien

Ein Bereich darf nicht direkt aus einem anderen Bereich importieren.

Nicht so:

import ... from "../datenbanken/..."
import ... from "../editor/..."

Besser:

gemeinsame Logik nach kern/
Kommunikation über Ereignisbus
Funktionen über register/



2. Neuer Bereich = zwei Einträge

Ein neuer Bereich braucht grundsätzlich:

quell/register/module.js
quell/register/navigation.js

Wenn mehr nötig ist, muss geprüft werden, ob der Bereich falsch geschnitten ist.



3. Neue Funktionen sind Register-Objekte

Neue Dinge werden als Objekte registriert:

Blockart      → register/bloecke.js
Ansicht       → register/ansichten.js
Eigenschaft   → register/eigenschaften.js
Formel        → register/formeln.js
Befehl        → register/befehle.js
Tastenkürzel  → register/tasten.js
Vorlage       → register/vorlagen.js
Verbindung    → register/verbindungen.js



Wichtige Ordner

quell/start.js

Der einzige Einstiegspunkt.

Aufgaben:

DOM abwarten
App starten
Fehler abfangen
Start-Ereignisse senden



quell/kern/

Gemeinsamer Kern.

Enthält:

Ablage
IndexedDB
Datenmodell
Zustand
Verlauf
Ereignisse
Abgleich
Zugang
Rechte
Sicherheit
Krypto
Helfer
Einstellungen

Der Kern kennt keine einzelnen Bereiche.



quell/register/

Zentrale Kataloge.

Enthält:

module.js
navigation.js
bloecke.js
eigenschaften.js
ansichten.js
formeln.js
befehle.js
tasten.js
vorlagen.js
verbindungen.js



quell/schale/

Globale Oberfläche.

Enthält:

App-Schale
Seitenleiste
Kopfbereich
Dialoge
Overlays
Routing
Suche
Stile



quell/bereiche/

Fachbereiche.

Beispiele:

editor
datenbanken
wissen
ki
verbinden
dateien
vorlagen
kommentare
erwaehnungen
seiten
planen
einstellungen
hilfe



Editor

Der Editor ist blockbasiert.

Alles ist ein Block:

Absatz
Überschrift
Aufgabe
Liste
Toggle
Zitat
Callout
Code
Formel
Datei
Bild
Video
Audio
Datenbank
Whiteboard
Diagramm
Unterseite
Synchronisierter Block
KI-Block

Der Editor unterstützt:

Slash-Menü
Markdown-Kürzel
Inline-Formatierung
Block-Auswahl
Verschieben
Duplizieren
Einrücken
Kommentare
Erwähnungen
Links
Rückverweise
Tastenkürzel



Blöcke

Redion enthält aktuell über 40 Blocktypen.

Grundlegend

Text
Überschrift 1
Überschrift 2
Überschrift 3
Aufgabe
Aufzählung
Nummerierung
Toggle
Zitat
Callout
Trennlinie

Datenbank

Tabelle
Board
Liste
Galerie
Kalender

Medien

Bild
Video
Audio
Datei
Lesezeichen
Einbetten

Erweitert

Code
Formel
Einfache Tabelle
Inhaltsverzeichnis
Pfad
Zwei Spalten
Drei Spalten
Unterseite
Link zu Seite
Synchronisierter Block
Knopf
HTML

Wissen

Karteikarte
Whiteboard
Diagramm
Rückverweise

KI

Text schreiben
Zusammenfassen
Aufgaben ableiten
Übersetzen
Verbessern



Markdown-Kürzel

Beim Tippen können Kürzel automatisch umgewandelt werden:

#        Überschrift 1
##       Überschrift 2
###      Überschrift 3
-        Aufzählung
*        Aufzählung
+        Aufzählung
1.       Nummerierung
[]       Aufgabe
[ ]      Aufgabe
---      Trennlinie
>        Toggle oder Zitat
```       Codeblock
$$       Formel

Inline:

**fett**
*kursiv*
__unterstrichen__
~~durchgestrichen~~
`code`
[[Seite]]
#schlagwort
((Blockverweis))
@heute
@Person
:emoji
$a^2$



Datenbanken

Redion-Datenbanken sind ähnlich aufgebaut wie in Notion.

Grundprinzip:

Datenbank-Block
→ Schema
→ Ansichten
→ Zeilen als Seiten

Eine Datenbank enthält:

Schema
Eigenschaften
Ansichten
Filter
Sortierung
Gruppierung
Berechnungen
Zeilen
Seiten



Ansichten

Geplante/unterstützte Ansichten:

Tabelle
Board
Liste
Galerie
Kalender
Zeitstrahl
Diagramm
Formular



Eigenschaftstypen

Redion unterstützt viele Eigenschaftstypen:

Titel
Text
Zahl
Auswahl
Mehrfachauswahl
Status
Datum
Person
Kontrollkästchen
URL
E-Mail
Telefon
Formel
Erstellt am
Zuletzt geändert
Dateien
Verknüpfung
Rollup
Laufende Nummer
Knopf
KI-Feld



Datenbankfunktionen

Filter mit UND/ODER
typgerechte Operatoren
Sortierung
Gruppierung
Untergruppierung
Berechnungen unter Spalten
Rollups über Verknüpfungen
Seitenvorschau
Rechtsklickmenü
CSV-Export
Zeilenhöhe
Kartengröße
Textumbruch
leere Gruppen
Anzeigegrenzen



Formeln

Redion enthält eine eigene Formelsprache nach dem Vorbild von Notion Formulas 2.0.

Wichtig:

kein eval()
kein Function()
eigener Tokenizer
eigener Parser
eigene Laufzeit

Dadurch kann eine Formel keinen fremden JavaScript-Code ausführen.



Beispiele

"Woche " + format(week(now()))

Richtig:

"Hallo " + name

Nicht für Text:

concat("Hallo ", name)

concat() ist für Listen gedacht.



Funktionsgruppen

Logik
Zahlen
Text
Listen
Datum
Formatierung
Vergleich

Beispiele:

if
ifs
let
lets
empty
round
floor
ceil
abs
min
max
sum
mean
median
pow
sqrt
format
length
substring
contains
replace
replaceAll
lower
upper
trim
split
repeat
join
map
filter
find
some
every
at
first
last
unique
sort
now
today
dateAdd
dateBetween
formatDate
year
month
week
day
hour
minute



Wissen und Notizen

Redion soll auch als persönliches Wissenssystem dienen.

Funktionen:

[[Wikilinks]]
Rückverweise
Graph
Schlagwörter
Schnellnotizen
Tagesjournal
Karteikarten
Wiederholungsplan
Vorlagen
Versionen
Fokus-Modus
Präsentation
Markdown-Quelltext
Schreibstatistik



Karteikarten

Karteikarten können aus Blöcken entstehen.

Ziel:

Wissen langfristig wiederholen
SM-2-artige Wiederholung
fällige Karten anzeigen
Lernfortschritt speichern



KI

Redion unterstützt lokale KI.

Ollama

läuft als Programm auf dem eigenen Rechner
schneller
größere Modelle möglich
keine Cloud nötig

WebLLM

läuft direkt im Browser
kein separates Programm nötig
braucht WebGPU
Modell wird beim ersten Mal geladen
danach Browser-Cache



KI-Grundsätze

kein Text verlässt ungefragt den Rechner
kein API-Schlüssel nötig
keine Abrechnung
keine Cloud-KI als Pflicht
KI muss optional bleiben

KI kann helfen bei:

Text schreiben
Zusammenfassen
Aufgaben ableiten
Übersetzen
Verbessern
KI-Felder in Datenbanken



Dateien und Anhänge

Redion unterstützt Anhänge wie:

Bilder
Videos
Audios
PDFs
Dokumente
sonstige Dateien

Dateien können lokal gespeichert und in Seiten oder Datenbanken verwendet werden.


Ein A4-Blatt zum Schreiben und Malen

`/blatt` legt ein leeres Blatt im A4-Format an. Darauf lässt sich beides:
gewöhnlich tippen — es sind normale Blöcke im Satzspiegel — und mit einer
gemeinsamen Ink-Schicht darüber arbeiten. Sie bietet Stift, transparenten
Marker, Linie, Pfeil, Rechteck, Ellipse und sichere Textanmerkungen in fünf
Farben und drei Strichbreiten.

Die Werkzeugleiste oben schaltet zwischen „Schreiben" und den Ink-Werkzeugen um. Beim
Schreiben geht der Zeiger an der Zeichenschicht vorbei, beim Malen liegt sie
darüber — man markiert also nicht versehentlich Text, während man zeichnet.
Mit „Auswahl" lassen sich eine oder mehrere Marken gemeinsam verschieben
oder löschen. Zurück und Wiederholen arbeiten je abgeschlossener Aktion,
nicht je einzelner Zeigerbewegung.

`＋ Seite` hängt eine weitere A4-Länge an, sodass ein Blatt so lang werden
kann, wie es soll.

Striche, Formen und Texte liegen in Blattkoordinaten, nicht in
Bildschirmpunkten. Ein
Blatt sieht deshalb am Telefon und am grossen Bildschirm gleich aus, und
was man am einen malt, steht am anderen an derselben Stelle.


Schriftgrösse, Schriftart und Farbe je Block

Über das Blockmenü (⋮⋮) lassen sich für jeden einzelnen Block einstellen:

    Farbe            Text- und Hintergrundfarbe, wie bisher
    Schriftgrösse    von sehr klein bis sehr gross
    Schriftart       Serifenlos, Serif, Schreibmaschine, Handschrift

Das gilt je Block, nicht für die ganze Seite — eine Überschrift darf eine
andere Schrift haben als der Absatz darunter. Für die ganze App gibt es das
ebenfalls, in den Einstellungen.

Eine Grenze, die man kennen sollte: Markdown kann davon nichts tragen. Wer
eine Seite über „Quelltext ansehen" bearbeitet und übernimmt, verliert
Farbe, Grösse und Schriftart. Der Dialog sagt es vorher, und eine Fassung
wird gesichert.


PDFs zum Draufschreiben

Ein PDF, das man auf eine Seite zieht, wird zu einzelnen Seiten, durch die
man scrollt und auf die man direkt schreiben und malen kann. PDF-Seiten
verwenden dieselbe Ink-Schicht wie das A4-Blatt: Stift, Marker, Formen,
Text, Mehrfachauswahl sowie Zurück/Wiederholen.

Beim Hochladen wird gefragt, wie es liegen soll:

    Seite und Notizblatt nebeneinander    links die Seite, rechts ein
                                          leeres Blatt in denselben Massen
    Nur die Seiten                        Seite für Seite untereinander

Am Telefon liegt das Notizblatt unter seiner Seite — nebeneinander gibt es
dort nicht. Gefragt wird jedes Mal; die zuletzt gewählte Anordnung steht
nur vorn, sodass Ablegen und Enter genügt.

Das Original bleibt unverändert als Anhang liegen. Redion schreibt nie in
das PDF zurück — die Anmerkungen liegen daneben in Redion.

Weitergeben lässt sich das trotzdem: **Strg + P** druckt die Seite mit allem
darauf — Seitenbild, Striche, Notizblätter — oder speichert sie über den
Druckdialog als PDF. Die Striche gehen dabei als Vektoren hinaus und bleiben
scharf.

Bei sehr langen Dokumenten hat das eine Grenze: die Seitenbilder müssen zum
Drucken alle zugleich in den Speicher, und ab rund 40 MB hört Redion damit
auf. Die betroffenen Seiten bleiben im Ausdruck leer und sagen an ihrem
Platz, warum — die Striche darauf sind trotzdem da. Wer ein ganzes Skript
ausdrucken will, druckt es in Abschnitten.

Die Seitenbilder kommen NICHT in die Sicherung — bei einem Skript mit 500
Seiten wären das sonst hundert Megabyte in jeder `.redion`. Das Original ist
natürlich darin, Byte für Byte, und auf jeder leeren Seite steht danach ein
Knopf „Aus dem Original zurückholen", der das ganze Dokument in einem Zug
neu rechnet. Deine Notizen und Striche darauf sind davon nie betroffen: sie
hängen am Block, nicht am Bild.

Der Text im PDF ist durchsuchbar: Redion nimmt ihn beim Hochladen einmal
mit, und die Suche springt danach direkt zur Fundstelle — nicht bloss auf
die Seite, sondern auf die Seite 63, wo das Wort steht. Eingescannte Blätter
ohne Textebene sind davon ausgenommen; Text aus Bildern lesen kann Redion
nicht.

Jede Seite hat ausserdem neben ihrer Seitenzahl einen 🔗. Er kopiert einen
Verweis auf genau diese Seite — eine Notiz kann so auf „Seite 14" zeigen und
beim Anklicken dorthin springen.

Ein Dokument mit mehr als 30 Seiten fragt vorher nach. Ist die Datei mit
einem Passwort geschützt, fragt Redion danach — das Passwort wird nur
weitergereicht und nirgends gespeichert, auch nicht in der Sicherung.

Dafür ist als einzige fremde Bibliothek pdf.js eingebaut (Apache-2.0,
eingepackt in `quell/fremd/pdfjs/`). Sie läuft einmal je Dokument beim
Einlesen — danach zeigt Redion die Seiten selbst.


Wichtige Regeln:

Datei-IDs müssen stabil bleiben
Blöcke müssen Anhänge nach Import wiederfinden
große Dateien dürfen nicht vollständig im RAM landen
Anhänge müssen sicher exportierbar sein



Sicherung und Export

Redion hat mehrere Exportwege:

JSON-Sicherung
.redion-Sicherung
Markdown
HTML
PDF
CSV für Datenbanken
Ordner voller Markdown-Dateien
eine HTML-Datei



JSON-Sicherung

Gut für:

Notizen
Datenbanken
Einstellungen
kleine Arbeitsbereiche ohne Anhänge

Eigenschaften:

lesbar
einfach
gut für Textdaten

Wichtig:

JSON enthält keine großen Anhänge.
Wenn eine JSON-Sicherung importiert wird, dürfen vorhandene Anhänge nicht gelöscht werden.



.redion-Sicherung

Für vollständige Sicherungen mit Anhängen.

Gut für:

kompletter Arbeitsbereich
Bilder
Videos
Dateien
Offline-Paket
Umzug auf anderes Gerät
Langzeitarchiv



Das .redion-Format

.redion ist ein ZIP-artiges Paket.

Aufbau:

mein-arbeitsbereich.redion
├─ daten.json
├─ dateien.json
└─ dateien/
   ├─ bild.jpg
   ├─ dokument.pdf
   └─ video.mp4

daten.json

Enthält:

Seiten
Blöcke
Datenbanken
Ansichten
Eigenschaften
Einstellungen
Versionen

dateien.json

Enthält:

Datei-IDs
Dateinamen
MIME-Typen
Größen
Zuordnungen
Prüfsummen

dateien/

Enthält die echten Anhänge.



Warum .redion?

Normale JSON-Sicherung ist für große Dateien ungeeignet.

Problem:

Blob + JSON.stringify = leer oder falsch
Base64 macht Dateien deutlich größer
große Videos können Browser/Handy zum Absturz bringen

.redion löst das:

Anhänge bleiben echte Dateien
echte Dateinamen bleiben erhalten
große Dateien werden stückweise verarbeitet
Import erhält Datei-IDs
Backup kann langfristig auch ohne Redion verstanden werden



Große Dateien

Redion soll große Dateien speicherschonend behandeln.

Regel:

Nicht alles vollständig in den Arbeitsspeicher laden.

Stattdessen:

stückweise lesen
stückweise schreiben
Prüfsummen stückweise berechnen

Ziel:

Auch große Anhänge, zum Beispiel Videos, sollen sicher gesichert werden.



Grenze über 4 GB

Normales ZIP ohne ZIP64 hat Grenzen.

Wenn eine Datei oder ein Paket zu groß ist, soll Redion:

nicht still ein kaputtes Archiv erzeugen

sondern klar sagen:

Diese Datei ist größer als das aktuelle .redion-Format unterstützt.



Server und Cloudflare

Redion funktioniert ohne Server.

Ein optionaler Server kann aber zusätzliche Funktionen ermöglichen:

Konten
Login
Sitzungen
Sync
Rechte
Freigaben
öffentliche Seiten
Feldrechte
Protokoll
API
MCP



Cloudflare-Ziel

Geplante/optionale Cloudflare-Struktur:

Cloudflare Pages
→ App ausliefern

Cloudflare Workers
→ API, Auth, Sync, Rechte

Cloudflare D1
→ Konten, Sitzungen, Metadaten, Sync-Sätze, Rechte

Cloudflare R2
→ Dateien, Anhänge, .redion-Pakete, große Medien



D1

Gut für:

Konten
Sitzungen
Arbeitsbereiche
Sync-Datensätze
Rechte
öffentliche Seiten
Protokoll
kleine Metadaten

Nicht gut für:

große Dateien
Videos
Bilder
Anhänge



R2

Gut für:

Dateien
Anhänge
Bilder
Videos
PDFs
Backups
.redion-Pakete



Konten und Sync

Ein Konto soll optional sein.

Redion soll diese Modi unterstützen:

nur lokal
lokal mit Sicherung
lokal + Sync
Cloud-Arbeitsbereich
öffentliche Seite
Offline-Paket herunterladen

Wichtig:

Kein Konto darf Pflicht sein.
Cloud-Sync darf nicht automatisch private Daten hochladen.
Nutzer entscheidet, wo Daten liegen.



Rechte und Freigaben

Mit Server soll Redion echte Rechte unterstützen.

Rollen:

voll
edit
komm
lesen
kein

Funktionen:

Arbeitsbereiche teilen
Seiten freigeben
öffentliche Seiten
Feldrechte
Kommentarrechte
Protokoll
Widerruf

Regel:

Serverrechte müssen wirklich sperren.
UI-Rechte allein reichen nicht.



Sicherheit

Redion behandelt persönliche Daten als privat.

Lokale Sicherheit

Daten liegen im Browser
verschlüsselte Seiten möglich
Passwort wird nicht gespeichert
AES-GCM für verschlüsselte Inhalte
Export bewusst vom Nutzer ausgelöst

Browser-Sicherheit

Regeln:

Nutzertext escapen
kein eval()
keine unsicheren Formeln
kein ungeprüftes innerHTML
Einbettungen prüfen
Links prüfen

Server-Sicherheit

Regeln:

Tokens hashen
CORS einschränken
Rate-Limits
Rechte serverseitig prüfen
Dateinamen säubern
Uploads begrenzen
keine Secrets im Repo



Tests

Redion nutzt echte Prüfungen gegen die echte App.

Befehle:

npm install
npx playwright install chromium
npm run pruefen

Schnell:

npm run pruefen -- --schnell

Einzelne Prüfung:

node pruefungen/lauf/test87.mts

Einzeldatei bauen:

node bauen.mts



Wichtige Prüfungen

test87.mts

prüft Architektur- und Sicherheitsgrenzen: dass kein Bereich einen anderen direkt einbindet, dass Nutzertext escaped wird, dass keine Formel fremden Code ausführt.

test100.mts

prüft die .redion-Sicherung mit echten Bytes und Anhängen: exportieren, alles löschen, importieren, Byte für Byte vergleichen.

test103.mts

prüft die Grenzen des ZIP-Formats — über 4 GB, über 65535 Einträge, ZIP64.

test114.mts

misst am Telefon: was man antippen soll, muss man treffen können. 428, 393, 390, 375 und 360 Pixel.

test128.mts

prüft, was ein Vorleseprogramm hört: Rollen, Namen, Zustände, den Weg der Tastatur.

test129.mts

prüft die Grenzen für KI-Agenten: Notaus, Tageslimit, Rückfrage vor Änderungen, und dass ein unbeaufsichtigter Lauf nur liest.



Testprinzip

Tests sollen echte Fehler finden:

keine Attrappen
keine falschen Mocks
echte App
echter Browser
echter Speicher
echte Dateien



Entwicklung

Scripts

{
  "bauen": "node bauen.mts",
  "pruefen": "node pruefungen/alle.mts",
  "server": "node server/pruefserver.ts 8790",
  "veroeffentlichen": "npx wrangler deploy"
}

Lokaler Ablauf

npm install
npm run pruefen -- --schnell
node bauen.mts



Code-Stil

Redion ist ein TypeScript-Projekt ohne Framework und ohne Bauzwang für die normale Nutzung. Die Migration ist seit August 2026 abgeschlossen: es gibt keine von Hand geschriebene JavaScript-Datei mehr. Was der Browser lädt, wird aus `src/**.ts` erzeugt (`npm run bauen:ts` schreibt nach `quell/`) und mitversioniert — deshalb startet die App weiterhin per Doppelklick auf `index.html`. Prüfläufe und Server laufen als `.mts` direkt unter Node. Der Weg dorthin steht in `doku/TYPESCRIPT-MIGRATION.md`, die Regel in `ENTSCHEIDUNGEN.md` E28.

Aktuelle Regeln:

bestehende Struktur respektieren
keine unnötigen Dependencies
keine großen Dateien weiter aufblasen
sicheren DOM-Code schreiben
Tests bei Speicheränderungen

Sprache: Deutsch für Menschen, Englisch für Code.

Deutsch bleiben Nutzertexte, Fehlermeldungen, Kommentare und die gesamte Dokumentation. Englisch wird neuer TypeScript-Code — Ordner, Dateien, Variablen, Funktionen, Klassen, Interfaces, Typen.

Zwei Grenzen dazu: Feldnamen heißen so, wie sie in IndexedDB gespeichert sind (`created`, `edited`, `alive`) — sie zu übersetzen wäre eine Datenmigration, keine Umbenennung. Und der bestehende deutsch benannte Bestand unter `quell/` wird nicht massenhaft umbenannt, sondern nur dort, wo eine Datei ohnehin migriert wird. Ausführlich in `ENTSCHEIDUNGEN.md` E27.



TypeScript-Ziel

Redion soll langfristig vollständig auf TypeScript umgestellt werden.

Ziel:

TypeScript
klare Typen
modulare Struktur
Build-System
Tests
Cloudflare-kompatibel
local-first
offlinefähig
exportierbar



TypeScript-Migration

Nicht alles auf einmal.

Phasen:

1. TypeScript-Plan
2. tsconfig
3. zentrale Typen
4. kleine Kernhelfer
5. .redion/Backup-Code
6. IndexedDB-Schicht
7. Register
8. Datenbanken/Formeln
9. Editor
10. Server/Cloudflare



Neue TypeScript-Struktur

Langfristig:

src/
├─ main.ts
├─ app/
├─ core/
│  ├─ storage/
│  ├─ blocks/
│  ├─ databases/
│  ├─ events/
│  ├─ sync/
│  ├─ security/
│  ├─ settings/
│  └─ utils/
├─ registry/
├─ areas/
├─ styles/
└─ tests/

Während der Migration darf quell/ weiter existieren.



Wichtige TypeScript-Typen

Die Typen stehen in `src/core/types/`. Dort ist die Wahrheit; das hier zeigt nur die Form.

export type ID = string
export type ISODateTime = string

export type BlockId = ID
export type PageId = ID
export type CollectionId = ID
export type ViewId = ID
export type FileId = ID

export interface RedionBlock {
  id: BlockId
  type: string
  text: string
  content: BlockId[]
  parentId: BlockId | CollectionId | null
  parentTable: 'block' | 'collection'
  color: string
  created: ISODateTime
  edited: ISODateTime
  erstelltVon: string
  alive: boolean
}

export interface RedionFile {
  id: FileId
  name: string
  groesse: number
  typ: string
  teile: number
  angekommen: number
  zustand: 'wartet' | 'laeuft' | 'fertig'
  angelegt: ISODateTime
}

Die Typnamen sind englisch, die Feldnamen nicht. Ein Feld heißt so, wie es in IndexedDB gespeichert ist. Es umzubenennen wäre keine Übersetzung, sondern eine Datenmigration — und würde jede vorhandene Sicherung unlesbar machen.



Grenzen

Aktuelle oder wichtige Grenzen:

Daten liegen lokal im Browserprofil
anderer Browser = anderer Speicher
gelöschte Websitedaten = Daten weg, wenn keine Sicherung existiert
WebLLM braucht WebGPU
Ollama muss lokal laufen
Server/Cloud ist optional und nicht Pflicht
große Dateien brauchen .redion/R2 statt JSON

Über 4 GB geht seit August 2026: die Sicherung schreibt ZIP64, wenn eine Datei, das Archiv oder die Zahl der Einträge die alten Grenzen sprengt. Kleine Sicherungen bleiben dabei gewöhnliche ZIP-Dateien, die jedes Programm öffnet.

Zwei Grenzen, die zu kennen wichtiger ist als die technischen:

Erinnerungen melden sich, solange Redion offen ist. Ist die App um acht Uhr geschlossen, wartet die Erinnerung bis zum nächsten Öffnen und sagt dann „Verpasst um 08:00". Ein Telefon zu wecken, ohne dass die Seite läuft, braucht Web Push und damit einen Server — das ist geplant und noch nicht gebaut.

Vorleseprogramme: Rollen, Namen, Zustände und der Weg der Tastatur sind gemessen und in Ordnung. Ein Durchlauf mit einem echten Vorleseprogramm (VoiceOver, NVDA) fehlt noch. Was gemessen ist, ist nicht dasselbe wie gehört.

Und eine, die Absicht ist:

Ein KI-Agent, der von selbst zu einer Uhrzeit loslegt, darf nur lesen und berichten. Ändern darf er dabei nur, wenn man es ihm ausdrücklich erlaubt hat — eine Rückfrage um acht Uhr früh beantwortet niemand. Dazu gibt es einen Notausschalter und ein Tageslimit.



Roadmap

Etappe 1: Lokale Stabilität

Editor stabil
Datenbanken stabil
Versionen stabil
Multi-Tab sicherer
Backup mit Anhängen
.redion-Format
Tests grün

Etappe 2: TypeScript-Grundlage

tsconfig
zentrale Typen
Build-System
typecheck
erste Kernmodule in TypeScript

Etappe 3: Dateien und Backup

.redion dokumentieren
Import/Export härten
große Dateien testen
R2-Konzept vorbereiten

Etappe 4: Cloudflare

Workers
D1
R2
Konten
Sessions
Sync
Rechte
öffentliche Seiten

Etappe 5: Vollständige TypeScript-Migration

Kern
Register
Editor
Datenbanken
Formeln
Server
Tests

Etappe 6: Notion-ähnliche Vollständigkeit

bessere Datenbankansichten
Formulare
Relationen
Rollups
Automationen
KI-Felder
Team-/Bereichsmodell
öffentliche Seiten
Offline-Pakete



Projektphilosophie

Redion soll nicht die schnellste Demo sein.  

Redion soll eine App sein, der man seine Notizen, Dateien und Datenbanken anvertrauen kann.

Darum gilt:

Datenintegrität vor neuen Features.
Sicherung vor Design.
Offline vor Cloud.
Klarheit vor Magie.
Tests vor Vertrauen.



Wichtigster Satz

Redion darf lieber langsamer neue Funktionen bekommen, als jemals Nutzerdaten zu verlieren.
