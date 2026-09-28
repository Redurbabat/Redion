# Redion

Redion ist eine Notiz-, Datenbank- und Wissens-App, die direkt im Browser läuft.

Sie war einmal als Alternative zu Notion gedacht und ist darüber hinausgewachsen: das Schreibstudio für PDFs mit echtem Stift, Fachzeichen und Schutzleiter, die Lernwelt, die Prüfungsplanung, lokale KI, das vollständige `.redion`-Paket. Das gibt es dort nicht.

**Redion läuft ohne Server. Das ist der Normalfall, nicht der Notfall.**

Ohne Server ist nichts abgeschnitten: Seiten, Datenbanken, Formeln, PDFs, Zeichnen, Suche, KI und Sicherung arbeiten offline auf deinem Gerät. Ein Server soll dazu ermöglichen, was mehr als ein Gerät braucht — Abgleich, Konto, Rechte, Teilen. Er ist geschrieben und geprüft, aber noch nie betrieben worden; der Abschnitt „Server und Cloudflare" sagt, woran es steht.

**Du entscheidest, wo deine Daten liegen:**

1. Nur auf diesem Gerät (Vorgabe, ohne Konto)
2. Zusätzlich in einem Ordner deiner Wahl, den Redion selbst sichert
3. In deiner Hand — als `.redion`-Datei mit allem darin

Ein vierter Weg ist vorgesehen und steht noch nicht offen: die eigene Wolke, Cloudflare, dein Konto, deine Datenbank. Der Code dafür ist da. Gelaufen ist er nie.

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

Die Chronik

KI

Dateien und Anhänge

Sicherung und Export

Das .redion-Format

Server und Cloudflare

Konten und Sync

Sicherheit

Tests

Entwicklung

TypeScript

Grenzen

Roadmap



Was ist Redion?

Redion ist ein Arbeitsbereich für:

Notizen
Seiten
Datenbanken
PDFs mit Stift, Marker und Fachzeichen
Aufgaben
Wikis
Karteikarten
Lernen und Prüfungsplanung
Graph
Dateien
Kommentare
Erwähnungen
Automationen
KI-Hilfe, lokal
Sicherungen als `.json` und als vollständiges `.redion`-Paket
Abgleich über die eigene Wolke — geschrieben und geprüft, noch nicht in Betrieb

Redion ist local-first, und das heisst nicht „eingeschränkt":

Die App ist ohne Server VOLLSTÄNDIG. Nichts ist abgeschnitten.
Deine Daten liegen zuerst auf deinem Gerät.
Ein Server soll dazu ermöglichen, was mehr als ein Gerät braucht — Abgleich, Konto, Rechte, Teilen. Er läuft noch nicht.
Wo die Daten liegen, entscheidest du: Gerät, eigener Ordner, `.redion`-Datei.
Export und Offline-Sicherung sind Pflicht.

Redion soll nicht nur eine Web-App sein, sondern ein persönlicher Arbeitsbereich, den man mitnehmen, sichern und später auch auf mehreren Geräten verwenden kann.



Ziele

Hauptziele

local-first, und dabei vollständig
offlinefähig
ein Editor aus Blöcken
Datenbanken mit dreizehn Ansichten
das Schreibstudio für PDFs
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



Die Oberfläche: die Kontextkante statt der Seitenleiste

Am Rechner gibt es die Seitenleiste nicht mehr. An ihrer Stelle steht links
die Kontextkante: 54 Pixel statt 240, und darin sechs bis zehn Knöpfe — die
des Ortes, an dem man gerade steht, statt auf jeder Seite dieselben. Was
darin steht, meldet jeder Bereich selbst an (`Register.kontext`); die Kante
kennt keinen Bereich beim Namen. Strg + \ nimmt sie weg und holt sie
zurück, Strg + M öffnet ihre Lade.

Am Telefon gibt es die Kante nicht — 54 von 390 Pixeln wären ein Siebtel
des Bildes. Dort bleibt die Seitenleiste, was sie immer war: die Schublade
mit dem Seitenbaum. Es ist derselbe Baum, er wird beim Öffnen
herübergeschoben und nicht kopiert.

Oben trägt die Kopfzeile Zurück, Vorwärts, den Pfad, Teilen, KI und
Favorit. Sechs davon rücken in der ruhigen Fassung unter ⋯ zusammen:
Teilen, Kommentare, Versionsverlauf, Automationen, „Link kopieren" und
„Seite sperren". Eine Suchbox steht dort nicht mehr; zur Suche führen das ⌕
in der Reiterzeile, Strg + P und am Telefon das ⌕ in der Kopfzeile. Das
Menüband erscheint, sobald eine Seite offen ist.

Wer die volle Leiste dauerhaft will: Einstellungen → Aussehen. Die Wahl
bleibt gespeichert.

Der Anlass war gemessen: 52 anklickbare Dinge auf dem Startbild, 67 mit
offener Seite.


Bewegung

Über der Oberfläche liegt eine eigene Schicht für Bewegung —
`quell/schale/stil/motion.css` und `src/schale/bedienung/motion.ts`. Sie ist
Dekoration und sonst nichts: fünfzehn Vorlagen, die sich an vorhandene
Knöpfe, Kacheln und Zustandsanzeigen hängen. Nichts davon wird gespeichert,
nichts ändert Daten. Im Leerlauf steht sie still, und wer im System
„weniger Bewegung" eingestellt hat, sieht sie gar nicht
(`prefers-reduced-motion`).


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

Nur nötig, wer am Quelltext arbeitet — wer Redion benutzt, nimmt Variante 1
oder 2, dort ist alles fertig gebaut.

npm install
npm run bauen:ts
node bauen.mts

`npm run bauen:ts` baut zuerst die React-Inseln (React und die Bauteile des
Touch Kits zu zwei klassischen Skripten unter `quell/fremd/react/` und
`quell/islands/`, E699), dann `src/**.ts` nach `quell/`, dann den
Dienststand. `node bauen.mts` erzeugt oder aktualisiert danach:

redion-einzeldatei.html

React wird dabei nicht beim Start geladen, sondern erst, wenn eine Insel
gebraucht wird — per Doppelklick, in der Einzeldatei und offline gleich.
Stand 27. September 2026 (Stufe 1a): die Grundlage steht, sichtbar ersetzt
ist noch nichts; als erstes kommen die Dialoge.



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
  einen lokalen Dienst, der **mitgeliefert** wird: `node dienste/ocr.mts`,
  Anleitung in `doku/OCR-DIENST.md`. Er hört nur auf `127.0.0.1`, und Redion
  lässt gar keine andere Adresse zu — der Ausschnitt verlässt den Rechner nie
- ein Rücksprung von jedem abgeleiteten Objekt zu seiner Quelle: von der
  Lernkarte zur PDF-Seite samt Ausschnitt, von der Aufgabe zur Besprechung
- additive Ausbildungsvorlage mit Fächern, Prüfungen, Noten, Berichtsheft,
  Lernmaterial und Eingang
- normfreie Elektrotechnik-Rechnungen und ein versioniertes, validiertes
  Grundlagen-Lernpaket; keine automatische Schutz- oder Leiterdimensionierung
- Schulansicht in der bestehenden Bibliothek mit Ordnern, letzten PDFs,
  fälligen Karten, offenen Aufgaben und Prüfungsterminen

Alle Inhalte bleiben normale Redion-Seiten und -Blöcke und laufen damit durch
Offlinebetrieb, Papierkorb, Sicherung, Wiederherstellung und optionalen Sync.


Zwei Hauptwelten, ein Bestand

Redion hat zwei Oberflächen auf denselben Daten. Nichts wird dabei kopiert.
Einen eigenen Umschalter dafür gibt es nicht mehr: er tat genau das, was
die Zeilen „Heute" und „Workspace" ohnehin tun. Wo man gerade ist, sagt die
Markierung an der Zeile — dort, wo man hinklickt.

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

Die ersten beiden Arten laufen heute. Diese dritte ist geschrieben und
geprüft, aber noch nie gegen einen echten Dienst gelaufen — siehe „Server
und Cloudflare".

App bleibt lokal nutzbar
Server ermöglicht Sync
Rechte
Freigaben
öffentliche Seiten

Gedacht für:

mehrere Geräte
private Cloud
geteilte Arbeitsbereiche



4. Cloudflare-Modus

Ebenfalls geschrieben, ebenfalls noch nicht in Betrieb:

Cloudflare Workers für API
Cloudflare D1 für Konten, Sync-Daten, Rechte
Cloudflare R2 für Dateien und große Anhänge

Gedacht für:

persönliche Cloud
Sync zwischen Geräten
öffentliche Seiten
Download von Offline-Paketen



Am Telefon

Seit August 2026 ist das Telefon die Hauptumgebung, nicht der Nebenschauplatz. Redion sieht dort anders aus als am Rechner — dieselben Daten, ein anderer Weg dorthin.

Unten fünf Wege als Kapsel, dort wo der Daumen ist: Dokumente, Heute, Lernen, Termine und Mehr. Jeder trägt seinen Namen unter dem Zeichen — auf 390 Pixel sind das 78 je Weg, und deshalb sind es fünf und nicht sechs.

Zwischen den Bereichen lässt sich auch wischen: waagerecht über den Inhalt, und die Leiste geht einen Weg weiter. Die Geste sucht sich den nächsten Knopf und drückt ihn — damit gilt fürs Wischen alles, was fürs Tippen gilt, statt einer zweiten Logik daneben. Sie greift nicht, wo etwas waagerecht rollt, wo gezeichnet wird, wo zwei Finger zoomen oder wo der Finger ganz am Rand ansetzt; dort meint man den Browser.

Suchen und KI stehen rechts in der Menüleiste, „Neu" ist der grosse Knopf im Regal und im Mehr-Blatt. Die drei schwebenden Knöpfe von früher — Suchen, KI fragen, Neue Seite — gibt es nicht mehr: zwei Leisten am unteren Rand sind eine zu viel.

Menüs kommen als Blatt von unten, nicht als kleines Fenster in der Ecke. Was man antippen soll, ist mindestens 44 Pixel gross.

Als App installieren: In Safari den Teilen-Knopf, dann „Zum Home-Bildschirm". Danach startet Redion ohne Adresszeile, mit eigenem Symbol und offline. Auf dem iPhone erscheinen Erinnerungen als Systemmeldung nur in dieser installierten Fassung (ab iOS 16.4) — in Safari selbst nur innerhalb von Redion.



Projektstruktur

Zwei Ordner sehen aus wie zwei Quellen und sind es nicht: `src/` ist die
Quelle, `quell/` ist das, was daraus gebaut wird. Wer eine `.js` unter
`quell/` bearbeitet, verliert die Änderung beim nächsten Bauen.

Redion/
├─ index.html                  lädt die App
├─ redion-einzeldatei.html     dieselbe App in einer Datei
├─ sw.js                       das Dienst-Skript, erzeugt aus src/dienst/sw.ts
├─ worker.ts                   der Einstiegspunkt bei Cloudflare
├─ wrangler.toml               was Cloudflare beim Veröffentlichen tun soll
├─ bauen.mts                   erzeugt redion-einzeldatei.html
├─ chronik.mts                 erzeugt UR.md, PROBLEME.md und die Chronik-Ansicht
├─ bilder.mts                  Bildschirmfotos aller Ansichten, Rechner und Telefon
├─ dienststand.mts             hebt die Fassung des Dienst-Skripts
├─ package.json
├─ start.bat · oeffnen.bat · holen.bat · hochladen.bat
│
├─ src/                        DIE QUELLE — TypeScript
│  ├─ start.ts                    der einzige Einstiegspunkt
│  ├─ kern/                       gemeinsame Logik
│  ├─ register/                   die zentralen Kataloge
│  ├─ schale/                     Aufbau, Kontextkante, Dialoge, Stil
│  ├─ bereiche/                   die fachlichen Bereiche
│  ├─ core/                       Typen und geteilte Rechenkerne
│  ├─ dienst/                     sw.ts
│  ├─ entwicklung/
│  └─ fremd/                      pdf.js
│
├─ quell/                      DIE AUSGABE — was der Browser lädt
│  ├─ start.js                    erzeugt mit npm run bauen:ts,
│  ├─ kern/                       mitversioniert, nicht von Hand ändern
│  ├─ register/
│  ├─ schale/
│  ├─ bereiche/
│  ├─ core/
│  ├─ entwicklung/
│  └─ fremd/
│
├─ oeffentlich/
│  ├─ icons/                   marke.png und alles, was daraus gerechnet wird
│  ├─ manifest.webmanifest
│  ├─ favicon.ico
│  ├─ _headers
│  ├─ robots.txt
│  ├─ ai.txt
│  └─ sitemap.xml
│
├─ server/                     Worker, D1-Schema, Abgleich, Rechte, Freigaben
├─ functions/
│  └─ api/
│
├─ chronik/
│  └─ chronik.json             die eine Quelle für UR.md und PROBLEME.md
│
├─ lernpakete/                 versionierte Lernpakete als JSON
├─ skripte/                    die Werkzeuge, die sie erzeugen
├─ dienste/
│  └─ ocr.mts                  lokaler Erkennungsdienst, optional
│
├─ doku/                       Architektur, .redion-Format, Migration
├─ pruefungen/
│  ├─ alle.mts
│  ├─ js-bestand.json
│  └─ lauf/                    522 Läufe
│
├─ AUFGABEN.md · ERLEDIGTE-AUFGABEN.md
├─ LUECKEN.md · ENTSCHEIDUNGEN.md
├─ UR.md · PROBLEME.md         erzeugt aus chronik/chronik.json
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

src/register/module.ts
src/register/navigation.ts

Wenn mehr nötig ist, muss geprüft werden, ob der Bereich falsch geschnitten ist.



3. Neue Funktionen sind Register-Objekte

Neue Dinge werden als Objekte registriert:

Blockart      → src/register/bloecke.ts
Ansicht       → src/register/ansichten.ts
Eigenschaft   → src/register/eigenschaften.ts
Formel        → src/register/formeln.ts
Befehl        → src/register/befehle.ts
Tastenkürzel  → src/register/tasten.ts
Vorlage       → src/register/vorlagen.ts
Verbindung    → src/register/verbindungen.ts



Wichtige Ordner

src/start.ts

Der einzige Einstiegspunkt.

Aufgaben:

DOM abwarten
App starten
Fehler abfangen
Start-Ereignisse senden



src/kern/

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



src/register/

Zentrale Kataloge — siebzehn Dateien.

Enthält:

module.ts
navigation.ts
bloecke.ts
eigenschaften.ts
ansichten.ts
formeln.ts
befehle.ts
tasten.ts
vorlagen.ts
verbindungen.ts
context.ts          was in der Kontextkante steht
einstellungen.ts
elektroformeln.ts
fachzeichen.ts
menueband.ts
symbole.ts
textstile.ts



src/schale/

Globale Oberfläche.

Enthält:

App-Schale
Kontextkante
Seitenleiste als Schublade am Telefon
Kopfbereich
Dialoge
Overlays
Routing
Suche
Bewegung
Stile



src/bereiche/

Fachbereiche — achtzehn:

bloecke
chronik
dateien
datenbanken
editor
einstellungen
elektro
erwaehnungen
hilfe
ki
kommentare
pdf
planen
seiten
spreadsheet
verbinden
vorlagen
wissen



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

Fünfzig Blockarten lassen sich einfügen. Die Liste steht an einer Stelle:
`src/register/bloecke.ts`.

Grundlegend (14)

Text
Überschrift 1
Überschrift 2
Überschrift 3
Aufgabenliste
Aufzählungsliste
Nummerierte Liste
Toggle-Liste
Toggle-Überschrift 1
Toggle-Überschrift 2
Toggle-Überschrift 3
Zitat
Callout
Trennlinie

Datenbank (7)

Tabelle
Board
Liste
Galerie
Kalender
Kalkulationstabelle — die rechnet, im Unterschied zur einfachen Tabelle
Verknüpfte Ansicht

Medien (6)

Bild
Video
Audio
Datei
Lesezeichen
Einbetten

Erweitert (12)

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

Wissen (6)

Karteikarte
A4-Blatt
Whiteboard
Schaltplan
Diagramm
Rückverweise

KI (5)

KI: Text schreiben
KI: Zusammenfassen
KI: Aufgaben ableiten
KI: Übersetzen
KI: Text verbessern

Dazu kommen im Slash-Menü Einträge, die nichts anlegen, sondern etwas tun:
Umwandeln, Farbe, Duplizieren, Verschieben, Löschen, Erwähnung, Datum,
Erinnerung, Emoji, Kommentar.



Markdown-Kürzel

Beim Tippen können Kürzel automatisch umgewandelt werden:

#        Überschrift 1
##       Überschrift 2
###      Überschrift 3
-        Aufzählung
*        Aufzählung
+        Aufzählung
1.       Nummerierung
1)       Nummerierung
a.  a)   Nummerierung mit Buchstaben
i.  i)   Nummerierung mit römischen Zahlen
A.  A)   dieselben in Grossbuchstaben
I.  I)   dieselben in Grossbuchstaben
[]       Aufgabe
[ ]      Aufgabe
[x]      Aufgabe, abgehakt
[X]      Aufgabe, abgehakt
---      Trennlinie
***      Trennlinie
___      Trennlinie
>        Toggle
"        Zitat
```       Codeblock
```sprache Codeblock mit Sprache
$$       Formel

Inline:

**fett**
*kursiv*
__unterstrichen__
~~durchgestrichen~~
~durchgestrichen~
`code`
[Text](Adresse)
[[Seite]]
#schlagwort
((Blockverweis))
@Person
:emoji
$a^2$

Ein Datum kommt über `@`: die Taste öffnet das Menü, eingefügt wird
`@JJJJ-MM-TT`, und die Anzeige macht daraus ein lesbares Datum.



Datenbanken

Redion-Datenbanken sind so aufgebaut, wie man es aus Notion kennt — wer von dort kommt, findet sich sofort zurecht.

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

Dreizehn Ansichten auf dieselben Zeilen. Umgeschaltet wird oben an der
Datenbank; jede Ansicht behält ihre eigenen Filter, Sortierungen und
Gruppierungen.

Tabelle
Raster — dieselben Daten mit der Bedienung eines Tabellenprogramms:
  Pfeiltasten, Bereichsauswahl, dreissig Zeilen aus Excel auf einmal einfügen
Board
Liste
Galerie
Kalender
Zeitstrahl — mit Abhängigkeitspfeilen und fünf Zoomstufen
Diagramm
Feed
Karte
Dashboard — Kennzahlen, auch aus anderen Datenbanken
Pivot — Zeilen × Spalten × Werte
Formular

Die Liste steht an einer Stelle: `src/register/ansichten.ts`. Wer eine
Ansicht hinzufügt, trägt sie dort ein — nicht an dreizehn Stellen verstreut.
(`quell/register/ansichten.js` ist das Erzeugnis daraus.)


Dashboard

Ein Dashboard ist eine Ansicht aus Kacheln. Jede Kachel sagt selbst, woher
ihre Zahl kommt:

Anzahl der Einträge
Summe oder Durchschnitt einer Zahlenspalte
Kennzahl mit Ziel — „408 000 von 500 000", mit Richtung: ein Ziel zum
  Erreichen oder eine Obergrenze, die gehalten werden soll
Verteilung nach einer Auswahl-, Status- oder Personenspalte — gezählt oder
  über eine Zahlenspalte summiert („Umsatz nach Region", nicht nur „Aufträge
  nach Region")

Eine Kachel darf ihre Zahlen aus einer ANDEREN Datenbank holen. Dann steht
der Name der Quelle unter der Karte, und die Zeilen kommen ungefiltert: ein
Filter gehört zu einer Ansicht, und die fremde Datenbank hat ihre eigenen.
Eine Zahl, deren Bedeutung von einer Einstellung anderswo abhängt, wäre eine
Zahl, der man nicht trauen kann.


Aus anderen Werkzeugen übernehmen

Befehlspalette → „Aus Trello, Evernote, Obsidian oder Notion einlesen", oder
Seitenleiste → Importieren.

Trello — das JSON eines Boards; Listen werden Status, Karten Zeilen,
  Etiketten eine Mehrfachauswahl, Beschreibung und Checklisten der
  Zeileninhalt
Evernote — eine .enex-Datei; jede Notiz wird eine Seite
Obsidian — ein ganzer Ordner mit .md-Dateien; Wikilinks bleiben Wikilinks
Notion-Export — das ZIP aus Notions eigenem Export
Asana — der CSV-Export, mit den Spalten, die Asana wirklich schreibt:
  Abschnitte werden Status und gruppieren das Board, Fälligkeit wird ein
  Datum, Etiketten werden eine Mehrfachauswahl, „Completed At" wird der
  Haken, und die Beschreibung wird der Seiteninhalt statt einer Tabellenzelle
Apple Notes — der Ordner mit den HTML-Dateien; Unterordner bleiben
  Unterordner, Checklisten werden echte Aufgaben
Jira, Monday, sonstige CSV — irgendeine Tabelle wird zur Datenbank, mit
  Typerkennung je Spalte
Einzelne Dateien — Markdown, Text, CSV, Word, Excel, OpenDocument, EPUB

Alles wird im Browser gelesen. Keine Datei geht an einen Server.



Eigenschaftstypen

Fünfunddreissig Typen, eingetragen in `src/register/eigenschaften.ts`:

Titel
Text
Zahl
Auswahl
Mehrfachauswahl
Status
Datum
Person
Kontrollkästchen
Bewertung
Fortschritt
URL
E-Mail
Telefon
Formel
Erstellt am
Zuletzt geändert
Erstellt von
Zuletzt bearbeitet von
Ort
Zeitspanne
Prüfung
Dateien
Verknüpfung
Rollup
Laufende Nummer
Knopf
KI-Feld
KI: Zusammenfassung
KI: Übersetzung
KI: Schlagwörter
Google Drive Datei
Figma Datei
GitHub-Pull-Request
Zendesk Ticket

Die letzten vier hängen an einer eingerichteten Verbindung; ohne sie
bleiben sie leer.



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

Text
Zahlen
Datum
Logik
Listen
Zeilen
Fremde Datenbanken
Personen
Sonstiges

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
fällige Karten anzeigen
Lernfortschritt speichern

Geplant wird mit einem von zwei Verfahren, zu wählen im Lernzentrum:
SM-2, wie Anki es rechnet, oder FSRS 4.5. SM-2 ist die Vorgabe. Wer
umstellt, behält seine Karten; die Startwerte für FSRS werden aus dem
vorhandenen SM-2-Stand geschätzt.



Die Chronik

Die Chronik ist Redions Gedächtnis über sich selbst: was gebaut wurde, was
schiefging, was daraus folgte. Sie steht an einer Stelle —
`chronik/chronik.json` — und `node chronik.mts` schreibt daraus drei
Ansichten:

UR.md                          zum Lesen
PROBLEME.md                    zum Suchen
src/bereiche/chronik/daten.ts  die Ansicht in Redion selbst

`node chronik.mts --pruefen` sagt nur, ob die drei aktuell sind, und ändert
nichts.

In der App öffnet sie sich über die Suche und fragt nach einem sechsstelligen
Code. Der Code steht im Quelltext, im Klartext, und muss es: Redion läuft
ohne Server, es gibt niemanden, der prüfen könnte. Er verhindert, dass die
Chronik versehentlich aufgeht — vor jemandem, der den Quelltext liest,
schützt er nicht. Das steht so auch in `LUECKEN.md` unter L140.



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



Fremde Anbieter, wenn du es willst

Wer keinen lokalen Weg nehmen will, kann einen Schlüssel hinterlegen. Der
Katalog ist eingebaut: Groq, OpenRouter, Google Gemini, OpenAI, Anthropic
und „Eigener Server" für jede Adresse, die wie OpenAI antwortet — auch
LM Studio oder llama.cpp. Der Schlüssel bleibt in diesem Browser und geht
nur an den Anbieter, den du gewählt hast. Voreingestellt ist nichts davon;
ohne Schlüssel passiert nichts.

KI-Grundsätze

kein Text verlässt ungefragt den Rechner
ohne Schlüssel keine fremde KI, und lokal geht es ganz ohne
keine Abrechnung durch Redion
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
gemeinsamen Ink-Schicht darüber arbeiten. Sie bietet dreizehn Werkzeuge:
Schreiben, Auswahl, Stift, Marker, Form, Abdecken, Haftnotiz, Text,
Fachzeichen, Elemente, Bild, Radieren und einen Laserpointer. „Form" ist
ein Knopf für sieben — Linie, Pfeil, Rechteck, Ellipse, Dreieck, Rechteck
mit runden Ecken und Kurve.

Der Laserpointer schreibt nichts: kein Eintrag, kein Schritt im Verlauf,
nichts in der Sicherung. Er ist ein Finger, kein Stift.

Fünf Farben und drei Strichbreiten stehen vorn; dazu kommen bis zu vier
eigene Farben und ein Regler von 0,5 bis 12.

Das **+ bei den Farben** öffnet direkt eine Palette: zuerst acht Tinten
(Königsblau, Nachtblau, Karmin, Tannengrün, Petrol, Aubergine, Sepia,
Graphit — auf Papier gut lesbar und auch für ein farbschwaches Auge
auseinanderzuhalten), darunter unter „Weitere Farben“ die fünf Grundfarben;
beim Marker sechs Leuchtfarben, die Spitze **Keil** (gerade Enden, wie ein
echter Textmarker) oder **Rund**, und die Pastelle unter „Weitere Farben“.
Die Probe oben ist ein echter Strich mit dem gewählten Stift, auf dem Papier
dieses Blatts; ist eine Tinte darauf kaum sichtbar, steht es dort in Worten.
Dazu zuletzt verwendete Farben, Hex-Eingabe und Systemfarbwähler. Unter
„Farbsätze & Stifteinstellungen“ bleiben deine gesicherten Einstellungen
erreichbar. Alte Striche behalten ihre Farbe.

Der **Füller** wird mit einem Stift mit Drucksensor im Schnellen bis zu
35 % dünner und hat an Ecken volle Beine; der **Bleistift** hat
Graphitkorn; **Kugelschreiber und Marker** behalten ihre Breite über den
ganzen Strich. Auf dem **Whiteboard** und der Seitenfläche schreibt der
Stift so glatt wie auf dem Blatt.
Einen Farbtupfer auswählen wirkt sofort; eigene Farben aus Hex-Eingabe oder
Systemfarbwähler erst mit „Farbe übernehmen“.

Mit **Text** aufs Blatt tippen und direkt schreiben. Beim Öffnen der
Farbpalette bleibt der Entwurf erhalten; nach Übernehmen oder Escape
geht es an derselben Cursorstelle weiter. Strg/Cmd + Enter oder Escape
beendet die Notiz. Auch unter **···** zeigt das Dokumentstudio nur Zubehör
zum aktiven Werkzeug; „Einrichten“ bleibt zum eigenen Ordnen verfügbar.

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
    Schriftgrösse    Normal, Klein, Gross, Sehr gross, Riesig
    Schriftart       Standard, Serifen, Schreibmaschine, Handschrift, Schmal

Das gilt je Block, nicht für die ganze Seite — eine Überschrift darf eine
andere Schrift haben als der Absatz darunter. Die Schriftart lässt sich
ausserdem für eine ganze Seite wählen, im Seitenmenü: Standard, Serife oder
Mono. Für die ganze App steht in den Einstellungen nur die Schriftgrösse,
dreistufig.

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

Weitergeben lässt sich das trotzdem: **„Drucken / als PDF"** im Menüband
druckt die Seite mit allem darauf — Seitenbild, Striche, Notizblätter — oder
speichert sie über den Druckdialog als PDF. Die Striche gehen dabei als
Vektoren hinaus und bleiben scharf. (Strg + P ist in Redion die Suche, nicht
der Druck.)

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
ohne Textebene sind davon ausgenommen. Text aus einem Bild lesen kann
Redion über „Text erkennen (OCR)" — aber nur, wenn der lokale
Erkennungsdienst eingerichtet ist (`node dienste/ocr.mts`, Anleitung in
`doku/OCR-DIENST.md`). Ohne ihn bleibt ein Scan ein Bild.

Jede Seite hat ausserdem neben ihrer Seitenzahl einen 🔗. Er kopiert einen
Verweis auf genau diese Seite — eine Notiz kann so auf „Seite 14" zeigen und
beim Anklicken dorthin springen.

Ein Dokument mit mehr als 30 Seiten fragt vorher nach. Ist die Datei mit
einem Passwort geschützt, fragt Redion danach — das Passwort wird nur
weitergereicht und nirgends gespeichert, auch nicht in der Sicherung.

Dafür ist pdf.js eingebaut (Apache-2.0, eingepackt in
`quell/fremd/pdfjs/`). Sie läuft einmal je Dokument beim Einlesen — danach
zeigt Redion die Seiten selbst. Sie ist die einzige mitgelieferte fremde
Bibliothek. Eine zweite kommt nur, wenn du sie anforderst: WebLLM lädt beim
ersten Mal von `esm.run` nach und braucht dafür eine Internetverbindung.


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

version
saetze        Datei-IDs, Dateinamen, MIME-Typen, Größen, Zustand
zuordnung     welcher Name im Archiv zu welcher Datei-ID gehört

Die Zuordnung gibt es, weil zwei Bilder „foto.jpg" heissen dürfen, ein Name
im Archiv aber nur einmal. Das zweite wird `foto-2.jpg`, und ohne diese
Karte wüsste beim Einspielen niemand mehr, welcher Block welches Bild
meint.

Die Prüfsummen stehen nicht hier, sondern als CRC-32 in den ZIP-Einträgen —
dort, wo jedes Entpackprogramm sie ohnehin liest.

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



Über 4 GB

Ein ZIP der alten Bauart zählt in 32 Bit und hat dadurch drei Grenzen: eine
einzelne Datei 4 GB, das ganze Archiv 4 GB, die Zahl der Einträge 65 535.

Redion schreibt deshalb ZIP64, sobald eine davon überschritten wird — und
nur dann. Ein Archiv unterhalb der Grenzen bleibt ein gewöhnliches ZIP, das
jedes Programm öffnet, und auch eine ältere Redion-Fassung liest es noch.
Wer 5 GB Fotos hat, kann sichern. Ein stillschweigend kaputtes Archiv
entsteht in keinem der beiden Fälle; `test103` hält das fest.



Server und Cloudflare

Redion funktioniert ohne Server. Der ganze Rest dieses Abschnitts
beschreibt etwas, das es noch nicht gibt.

**Der Stand, in einem Satz: geschrieben und geprüft, nie betrieben.**

Der Worker, das D1-Schema, der Abgleich, die Rechte, die Freigaben und die
Weckrufe sind gebaut und stehen unter `server/` und in `worker.ts`.
Prüfläufe gibt es dafür. Was es nicht gibt, ist ein Deploy, der durchgegangen
wäre. Unter der Worker-Adresse steht bis heute Cloudflares „Hello world" —
die Vorlage, die beim Anlegen eines Projekts entsteht. Es ist also nichts
erreichbar: weder Redion noch sonst etwas.

Woran es hängt: die D1-Datenbank `redion` und der R2-Eimer
`redion-dateien` liegen in einem anderen Cloudflare-Konto als der Worker,
und ein Worker findet beides nur in seinem eigenen. Deshalb sind
`[[d1_databases]]` und `[[r2_buckets]]` in `wrangler.toml` auskommentiert —
mit der falschen Kennung scheitert jeder Deploy, und dann ist gar nichts
im Netz, auch nicht der Teil, der ohne Datenbank liefe. Das steht in
`LUECKEN.md` unter L143 und ist dort offen.

Was das für dich heisst: Redion lokal ist fertig und vollständig. Konto,
Abgleich, Rechte und Teilen sind es nicht, solange niemand das aufsetzt.
Wer es aufsetzen will, findet den Weg in `CLOUDFLARE.md` und
`SERVER-EINRICHTEN.md`.

Ein optionaler Server soll ermöglichen:

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

Die vorgesehene Struktur — geschrieben, nicht in Betrieb:

Cloudflare Workers
→ App ausliefern, API, Auth, Sync, Rechte

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

Ein Konto ist optional und braucht einen Server; der läuft noch nicht
(siehe oben). Was hier steht, ist gebaut und geprüft, aber nicht erprobt.

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

Redion nutzt echte Prüfungen gegen die echte App. Es sind 522 Läufe unter
`pruefungen/lauf/` (gezählt am 27. September 2026 mit
`ls pruefungen/lauf/test*.mts | wc -l`).

Befehle:

npm install
npx playwright install chromium
npm run typecheck
npm run pruefen

Schnell:

npm run pruefen -- --schnell

Einzelne Prüfung:

node pruefungen/lauf/test87.mts

Einzeldatei bauen:

node bauen.mts



Wichtige Prüfungen

test87.mts

prüft drei Dinge, die zwischen zwei Dateien stehen und die kein Browserlauf findet: dass keine Quelldatei rohe Steuerzeichen enthält (in der Einzeldatei reisst das den ganzen Skriptblock mit), dass die Rechteliste der Oberfläche wortgleich mit der des Servers ist, und dass die Zeichner der Schale nicht wieder `App.` sagen. Läuft ohne Browser, in Millisekunden.

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
  "typecheck": "tsc --noEmit && tsc -p tsconfig.islands.json",
  "bauen:inseln": "node bauen-inseln.mts",
  "bauen:ts": "node bauen-inseln.mts && tsc -p tsconfig.bauen.json && node dienststand.mts && …",
  "stand": "node dienststand.mts --pruefen",
  "server": "node server/pruefserver.ts 8790",
  "veroeffentlichen": "npx wrangler deploy"
}

Lokaler Ablauf — in dieser Folge

npm install
npm run typecheck
npm run bauen:ts
npm run stand
npm run pruefen -- --schnell
node bauen.mts

Die Folge zählt: `bauen:ts` baut die Inseln vor dem Dienststand, weil der
die Bytes des Grundstocks rechnet; die Einzeldatei setzt die Bündel ein und
kommt deshalb zuletzt.



Die Marke kommt aus einer Datei

`oeffentlich/icons/marke.png` ist die Marke in 512 × 512. Alles andere wird
daraus gerechnet:

node oeffentlich/icons/erzeugen.mts

Das schreibt die Symbole für Home-Bildschirm und Installation, die
maskable-Fassungen für Android, die Startbilder fürs iPhone und
`favicon.ico`. Wer die Marke wechselt, tauscht diese eine Datei und lässt
den Befehl laufen — statt siebzehn Symbole einzeln nachzuziehen und das
achtzehnte zu vergessen. Ohne fremde Bibliothek; `zlib` liegt in Node.



Code-Stil

Redion ist ein TypeScript-Projekt ohne Framework-Zwang und ohne Bauzwang für die normale Nutzung. Seit E699 (27. September 2026) gibt es React — aber nur als Inseln: Bauteile aus Redurs Touch Kit, die an einer Stelle der bestehenden Schale ein Element ersetzen, gebaut mit Vite zu klassischen Skripten unter `quell/`, geladen erst beim Gebrauch. Keine zweite Oberfläche, kein Router, und `dependencies` bleibt leer. Die Migration ist seit dem 3. September 2026 abgeschlossen: `pruefungen/js-bestand.json` führte jede von Hand geschriebene `.js` und `.mjs`, und die Liste ist leer. Was der Browser lädt, wird aus `src/**.ts` erzeugt — `npm run bauen:ts` schreibt nach `quell/`, hebt dabei die Fassung des Dienst-Skripts und legt `sw.js` in die Wurzel — und wird mitversioniert; deshalb startet die App weiterhin per Doppelklick auf `index.html`. Prüfläufe laufen als `.mts` direkt unter Node, der Server als `.ts`. Der Weg dorthin steht in `doku/TYPESCRIPT-MIGRATION.md`, die Regel in `ENTSCHEIDUNGEN.md` E28.

Aktuelle Regeln:

bestehende Struktur respektieren
keine unnötigen Dependencies
keine großen Dateien weiter aufblasen
sicheren DOM-Code schreiben
Tests bei Speicheränderungen

Sprache: Deutsch für Menschen, Englisch für Code.

Deutsch bleiben Nutzertexte, Fehlermeldungen, Kommentare und die gesamte Dokumentation. Englisch wird neuer TypeScript-Code — Ordner, Dateien, Variablen, Funktionen, Klassen, Interfaces, Typen.

Zwei Grenzen dazu: Feldnamen heißen so, wie sie in IndexedDB gespeichert sind (`created`, `edited`, `alive`) — sie zu übersetzen wäre eine Datenmigration, keine Umbenennung. Und der bestehende deutsch benannte Bestand unter `quell/` wird nicht massenhaft umbenannt, sondern nur dort, wo eine Datei ohnehin migriert wird. Ausführlich in `ENTSCHEIDUNGEN.md` E27.



TypeScript

Redion ist vollständig auf TypeScript umgestellt. Die Umstellung lief in
Phasen — erst die Typen, dann die kleinen Kernhelfer, dann das
`.redion`-Paket, die IndexedDB-Schicht, die Register, Datenbanken und
Formeln, zuletzt der Editor und der Server. Was dabei herauskam:

TypeScript, streng eingestellt
klare Typen
modulare Struktur
ein Bauschritt für die Entwicklung, keiner für die Nutzung
Tests
Cloudflare-kompatibel
local-first
offlinefähig
exportierbar



Die Struktur

src/
├─ start.ts
├─ kern/          Ablage, Abgleich, Zugang, Sicherheit, Suche, Zustand
├─ register/      die siebzehn Kataloge
├─ schale/        Aufbau, Bedienung, Überlagerungen
├─ bereiche/      die achtzehn Fachbereiche
├─ core/          Typen und geteilte Rechenkerne
├─ dienst/        sw.ts
├─ entwicklung/
└─ fremd/         pdf.js

`quell/` steht daneben, und zwar dauerhaft: es ist die Bau-Ausgabe, nicht
ein Rest. Der Browser lädt von dort, und das ist der Grund, warum Redion
ohne Installation startet.



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
WebLLM braucht WebGPU und lädt beim ersten Mal aus dem Netz
Ollama muss lokal laufen
OCR braucht den lokalen Erkennungsdienst
Server und Wolke laufen nicht — geschrieben, geprüft, nie in Betrieb
große Dateien brauchen .redion statt JSON

Über 4 GB geht seit August 2026: die Sicherung schreibt ZIP64, wenn eine Datei, das Archiv oder die Zahl der Einträge die alten Grenzen sprengt. Kleine Sicherungen bleiben dabei gewöhnliche ZIP-Dateien, die jedes Programm öffnet.

Vier offene Punkte, die nicht verschwiegen gehören:

**Die Wolke lief nie** (L143). Kein Deploy ist durchgegangen; unter der Worker-Adresse steht Cloudflares „Hello world". Datenbank und Eimer liegen im falschen Konto, und darum sind ihre Bindungen in `wrangler.toml` auskommentiert. Für die lokale Nutzung ändert das nichts, für Abgleich, Konto, Rechte und Teilen alles.

**Ob `.assetsignore` wirkt, ist unbekannt** (L145). Die Datei soll `src/`, `pruefungen/` und Persönliches vom Hochladen ausnehmen. Geprüft wurde bisher nur ihr Inhalt, nie ihre Wirkung, und die Messung mit `wrangler deploy --dry-run` war nicht eindeutig. Geht der erste Deploy durch, muss als Erstes eine Adresse abgefragt werden: liefert sie die persönliche PDF, wirkt die Liste nicht.

**Der Zugangscode der Chronik ist ein Türschild, kein Schloss** (L140). Die sechs Ziffern stehen im Quelltext, im Klartext. Sie verhindern, dass die Chronik versehentlich aufgeht — nicht, dass jemand sie liest, der den Quelltext hat.

**Ein Prüflauf ist rot** (L146). `test388 §5` deckelt, was der Start an Daten holt, auf 2300 KB gzip. Gemessen wurden zuletzt 2389 bis 2396 KB. Die Decke bleibt stehen, bis nachgesehen ist, wo die Kilobyte herkommen — eine Decke, die nachgibt, sobald sie greift, ist keine.

Zwei Grenzen, die zu kennen wichtiger ist als die technischen:

Erinnerungen melden sich, solange Redion offen ist. Ist die App um acht Uhr geschlossen, wartet die Erinnerung bis zum nächsten Öffnen und sagt dann „Verpasst um 08:00". Ein Telefon zu wecken, ohne dass die Seite läuft, braucht Web Push und damit einen Server. Web Push ist gebaut und geprüft — der Stoss trägt bewusst keinen Text, er sagt nur „wach auf", und das Dienst-Skript liest die Erinnerung dann lokal. Was fehlt, ist der Server, der stösst.

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
Tests grün — bis auf `test388 §5`, die Startnutzlast (L146)

Etappe 2: TypeScript-Grundlage — erledigt

tsconfig
zentrale Typen
Build-System
typecheck
erste Kernmodule in TypeScript

Etappe 3: Dateien und Backup — erledigt

.redion dokumentieren
Import/Export härten
große Dateien testen
R2-Konzept vorbereiten

Etappe 4: Cloudflare — geschrieben, noch nicht in Betrieb

Workers
D1
R2
Konten
Sessions
Sync
Rechte
öffentliche Seiten

Der nächste Schritt ist kein Code, sondern ein Deploy, der durchgeht:
Datenbank und Eimer müssen in dasselbe Konto wie der Worker (L143).

Etappe 5: Vollständige TypeScript-Migration — erledigt

Kern
Register
Editor
Datenbanken
Formeln
Server
Tests

Etappe 6: Vollständigkeit

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
