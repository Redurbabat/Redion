# AFFiNE in Redion: Funktionsabgleich vom 26. November 2026

Redur möchte die Bordeaux-Farbe entfernen und möglichst alle AFFiNE-Funktionen
in Redion haben. Die Oberfläche ist jetzt neutral in Hell und Dunkel, mit blauem
Akzent. Die native iOS-Tab-Bar verwendet Systemblau. Vorhandene vom Nutzer selbst
gesetzte Farbanpassungen und hoher Kontrast behalten ihre bisherigen Vorrangregeln.

Der Abgleich liest den in PR #232 verwendeten AFFiNE-Stand
[`81da59d`](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade).
Das ist eine feste Referenz, keine Behauptung über jeden späteren Canary-Stand.
Gelesen wurden der Blockkatalog, die Edgeless-Werkzeugleiste, die Frontend-Module,
die App-Ziele sowie die Lizenzgrenzen. Redions vorhandener Code und der bisherige
[Funktionsabgleich](AFFINE-FUNKTIONSPARITAET.md) sind die Gegenseite.

## Was mit „alles“ gemeint sein kann

Der Katalog erfasst nicht nur die Dock-Bilder. Er umfasst Editor und freie Fläche,
Dokumentverwaltung, Datenbanken, Suche, Import/Export, KI, Zusammenarbeit,
Freigaben, Integrationen und native Clients. Eine gleiche Bezeichnung in beiden
Programmen ist noch kein Nachweis gleicher Funktionen oder gleicher Dateiformate.

**Nachweisstufen:** „Code vorhanden“ heisst gelesen, nicht neu im Browser getestet.
Die neuen Farb- und Flächenänderungen haben eigene Prüfungen. Der gesamte Katalog
ist keine pauschale Abnahme aller älteren Funktionen und kein bestandener iPhone-Test.

| AFFiNE-Funktion | Gegenstück in Redion | Noch zu ergänzen oder abzugleichen |
| --- | --- | --- |
| Textseite und Edgeless desselben Dokuments | Seitenansichten, Seitenfläche, frei platzierte Blöcke; Code vorhanden | Sichtbarkeits- und Notizcontainer-Verhalten im Detail vergleichen |
| Überschriften, Listen, Aufgaben, Zitat, Callout, Trenner | Blockkatalog und bestehender Editor | Tastatur, Einrücken und Umwandeln je Block gegenüberstellen |
| Code, einfache Tabellen, LaTeX | Code-, Tabellen- und Formelblöcke | AFFiNE-spezifische Vorschauen, Code-Ausführung und Typst getrennt prüfen |
| Bilder, Anhänge und Lesezeichen | Medienblöcke und lokale Dateiablage | Zuschneiden, Bildbeschriftung, Linkvorschauen und Anhänge beim AFFiNE-Import |
| Eingebettete Seiten und Oberflächenreferenzen | Seitenverweise und synchronisierte Blöcke | AFFiNE-Embed-Doc und Surface-Ref haben andere Semantik; kein bestätigter 1:1-Ersatz |
| Freie Navigation, Zoom und Auswahl | Seitenfläche, Whiteboard, Planfläche; passende Docks | In allen Kontexten denselben Funktionsumfang herstellen |
| Stift, Marker, Radierer, Formen und Haftnotizen | Vorhandene Zeichenwerkzeuge, Paletten und Vorlagen | Stile, Formen, Verbinderarten und Tastenkürzel einzeln angleichen |
| Mehrfachauswahl und Skalieren | Auf der Seitenfläche vorhanden | Freihandlasso, Drehung und gleichwertige Bedienung aller Zeichenkontexte |
| Persistente Gruppen | Jetzt für Formen der Seitenfläche ergänzt | Verschachtelung, Gruppieren mit Dokumentblöcken und Übernahme in Whiteboard/PDF |
| Objektanordnung | Jetzt nach vorne/hinten, ganz und schrittweise | Ebenenliste, Gruppeneinträge und blockübergreifende Anordnung |
| Objekt sperren | Jetzt auf der Seitenfläche ergänzt, einschliesslich interner Verbinder | Dasselbe Verhalten in den weiteren Zeichenkontexten |
| Ausrichten und verteilen | Noch kein vollständiger gemeinsamer Flächenbefehl | An Kanten/Mitten ausrichten, Abstände verteilen, Einrasten und Hilfslinien |
| Rahmen und Präsentationen | Rechtecke und vorhandene Präsentationswerkzeuge | Ein Präsentationsrahmen ist mehr als ein Rechteck: Reihenfolge, Zuordnung und Vortragsnavigation fehlen auf der Seitenfläche |
| Gedankenkarten und Diagramme | Bearbeitbare Karten und Vorlagen auf der Fläche vorhanden | AFFiNE-Knotenstile, Anordnung und Umwandeln im Detail vergleichen |
| Dokumenteigenschaften, Symbol, Titel und Cover | Seitenkopf und Metadaten | Arbeitsbereichseigenschaften und AFFiNE-Standardfelder |
| Sammlungen, Tags und Favoriten | Bibliothek und entsprechende Redion-Funktionen | Dynamische Sammlungsregeln und gespeicherte Filter auf gleiches Verhalten prüfen |
| Journal | Heute/Lernwelt und Kalender | Ein persönlicher Tagesbereich ist kein bestätigter Ersatz für AFFiNE-Journal-Dokumente |
| Vorlagen und Importvorlagen | Register und Vorlagengalerie | AFFiNE-Vorlagen samt Blockformaten und Anhängen importieren |
| Volltextsuche und Suche im Dokument | Bestehende Suche und PDF-Fundstellen | Ranking, Filter, Sammlungsregeln und Quellen in denselben Tests vergleichen |
| Vorschau, Tabs und geteilte Ansicht | Bestehende Redion-Navigation | Peek-Verhalten und Drag-and-drop-Abfolgen im Detail |
| Kommentare und Benachrichtigungen | Bestehende Kommentar- und Nachrichtenbereiche | Fäden an Textbereichen und Formen, Erwähnungen und serverseitige Zustellung Ende zu Ende |
| Datenbank und Datenansichten | Tabellen, Board, Kalender, Galerie, Relationen und Formeln | Gleichheit der Property-Typen, Sortierung, Gruppierung, Filter und Formelsprache nicht bestätigt |
| Historie, Papierkorb und Wiederherstellen | Bestehende Versionen, Papierkorb und Sicherungen | AFFiNE-Historie und Import alter AFFiNE-Snapshots |
| Offline und lokale Daten | Redion funktioniert ohne Konto und Server | AFFiNE-CRDT-Snapshots sind kein Redion-Sicherungsformat |
| Echtzeit-Zusammenarbeit und Präsenz | Optionaler Redion-Geräteabgleich, eigener Servercode | Gleichzeitiges Bearbeiten, Präsenz, Konfliktauflösung und mehrere Berechtigungsstufen real prüfen |
| Teilen und öffentliche Dokumente | Eigener Redion-Servercode | Kein in dieser Sitzung geprüfter Live-Server; Freigaben und Widerruf benötigen reale Abnahme |
| KI-Chat, Zusammenfassen, Generieren | Eigene lokale/optionale Redion-KI und MCP | AFFiNE-KI-Abläufe, Provider, Hintergrundaufträge und multimodale Funktionen sind nicht automatisch übernommen |
| Clipper und Integrationen | Eigene Import- und Verbindungsfunktionen | AFFiNE-Clipper und einzelne OAuth-/Provider-Anbindungen benötigen eigene Integration |
| PDF, Markdown, HTML und weitere Exporte | Bestehende PDF-/Office-/Markdown-Ausgaben und `.redion` | AFFiNE-spezifischer Export samt vollständigem Dokument- und Flächeninhalt |
| Web, Windows, macOS und iOS | Vorhandene Plattformziele | Jeweils aktuelle Builds und echte Geräteabnahme; Android ist kein hier gebauter Redion-Client |
| Sprache, Schrift und Thema | Vorhandene Einstellungen; neutrale Palette ergänzt | Lokalisierungen und weitere AFFiNE-Einstellungen einzeln vergleichen |
| Cloud-Konto, Kontingente und Telemetrie | Redion hat eigene optionale Konten; Offline bleibt ohne Konto möglich | Kein ungeprüftes Übernehmen von AFFiNE-Diensten, Abos oder Telemetrie |

## Primäre Quellen des Abgleichs

- [AFFiNE-Blöcke](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade/blocksuite/affine/blocks): unter anderem Attachment, Bookmark, Code, Database, Embed-Doc, Frame, Image, LaTeX, List, Note, Paragraph, Surface-Ref und Table.
- [Edgeless-Werkzeugleiste](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade/blocksuite/affine/widgets/edgeless-toolbar/src): Buttons, Konfiguration, Ziehen, Menüs und Paletten.
- [Frontend-Module](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade/packages/frontend/core/src/modules): Dokumente, Sammlungen, Journal, Suche, Import, Kommentare, Freigaben, Arbeitsbereiche, KI-bezogene UI, Integrationen und weitere Infrastruktur.
- [App-Ziele](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade/packages/frontend/apps): Android, Electron, iOS, Mobile und Web.

## Übernahme von Quellcode und Diensten

Die [AFFiNE-Hauptlizenz](https://github.com/toeverything/AFFiNE/blob/81da59d63d535d72ba677a097d9a0cc9a5871ade/LICENSE)
trennt die allgemein unter MIT bereitgestellten Teile von `packages/backend` und
`packages/common/native` sowie von eingebundenen Drittkomponenten.
Die [Serverlizenz](https://github.com/toeverything/AFFiNE/blob/81da59d63d535d72ba677a097d9a0cc9a5871ade/packages/backend/server/LICENSE)
enthält eigene Regeln für Community- und Enterprise-Teile.
Eine vollständige Kopie des Repositories ist daher keine pauschal freigegebene
Produktintegration.

Für diesen Ausbau wurde kein weiterer fremder Code eingebaut. Die Gruppen,
Objektreihenfolge und Sperren verwenden Redions Formenformat und Verlauf.
Die bereits dokumentierten Dock-Vorschauen bleiben eingebunden. Eine spätere
konkrete Codeübernahme braucht den jeweiligen Herkunfts- und Lizenzeintrag;
ein AFFiNE-Backend oder dessen Anmeldung wird durch die neue Oberfläche nicht
stillschweigend mit installiert.

## Prüfvertrag dieses Ausbaus

- Neutrale Farben in Bibliothek, Editor und Zeichenansichten, hell und dunkel.
- Neue Gruppen bleiben nach Neuladen erhalten; Kopien bekommen eigene Kennungen.
- Gemeinsames Verschieben, Auflösen und Anordnen arbeiten mit dem vorhandenen Verlauf.
- Sperren verhindert die vorhandenen Änderungswege und lässt sich wieder aufheben.
- JSON und `.redion` bewahren IDs, Gruppierung, Sperren, Reihenfolge und unbekannte Felder.
- Bilder bleiben unter `bilder/` und ausserhalb von Git.

Aktuelle Ergebnisse dieses Durchgangs:

- `affine-objects.browser.test.mts`: 72/72 Zusagen in Chromium bei 1366 und
  390 Pixeln, einschliesslich echter JSON- und `.redion`-Sicherungsrundreisen.
  Die Gegenprobe gegen `c346f556` scheitert erwartungsgemäss an der alten
  Bordeaux-Farbe. Die Testdaten werden erst nach sichtbarem App-Start angelegt.
- Bestehender Seitenflächenlauf `test575`: 111/111 bestanden.
- Bestehender Dock-Lauf: 60/60 bestanden, bei 1366, 390 und 320 Pixeln.
- Angepasste bestehende Desktop-Oberflächenprüfung: bestanden.
- Native Installer, Dock-Verträge und Build-Parität: 15/15 bestanden.
- `test96`, `test100` und `test537`: bestanden. Der erste `test105`-Lauf
  fand die fehlende Erzeugt-Kennzeichnung am neuen GFX-Kern. Sie wurde in der
  TypeScript-Quelle ergänzt; der erneute `test105`-Lauf bestand mit
  364/364 Zusagen.
- TypeScript und Web-Build erfolgreich, Einzeldatei erneuert; Dienststand 1688.
- 37 Browserbilder liegen in der separaten Galerie und nicht in Git.
- Der vollständige schnelle Gesamtlauf wurde für diesen Bogen nicht erneut
  gefahren. Seine vier am Basisstand nachgewiesenen Fehler stehen im Bericht
  [Kontext-Docks](KONTEXT-DOCKS-PR232.md).
- WebKit und echtes iPhone: **NICHT GETESTET**. Auf diesem Linux-Rechner
  fehlen die erforderlichen WebKit-Systembibliotheken und Xcode.
- IPA und Deployment: **NICHT AUSGEFÜHRT**.
- Der Graphify-Graph wurde hier nicht aktualisiert; das Werkzeug ist in dieser
  Umgebung nicht installiert.
