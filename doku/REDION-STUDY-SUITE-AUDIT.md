# Redion Study Suite – Bestands- und Wiederverwendungs-Audit

Stand: 22. August 2026  
Arbeitszweig: `claude/redion-head2-desktop-move-j47chf`  
Ausgangspunkt: `833f7869517d8630c53e61ce5f131654676e98da`

## 1. Zweck und Leitplanken

Dieser Audit ist Phase 0 des Masterauftrags V3. Er trennt drei Dinge klar:

1. **Redions vorhandenen Produktkern**, der erweitert und nicht ersetzt wird.
2. **Wiederverwendbare Produktmuster** aus `C:\Users\redur\redion-source-kit`, das ausschließlich lesend untersucht wurde.
3. **Neue Arbeit**, die nur dort entsteht, wo Redion noch keine tragfähige Lösung besitzt.

Die unveränderten Leitplanken bleiben: lokaler Betrieb, IndexedDB als Primärspeicher, kein Framework und kein Bundler, lose Bereichskopplung über Ereignisse und zentrale Dienste, TypeScript als Quelle sowie erzeugtes JavaScript als Build-Ergebnis.

## 2. Geprüfter Redion-Bestand

### Architektur und Daten

- Der Anwendungskern liegt in `src/kern`, Produktbereiche in `src/bereiche`, zentrale Kataloge in `src/register` und wiederverwendbare Geometrie in `src/core`.
- Seiten und Blöcke bleiben das gemeinsame Datenmodell. Bereichscode importiert keine fremden Bereiche direkt.
- Anhänge liegen stückweise in IndexedDB; Redion verwendet Objekt-URLs statt großer Data-URLs.
- Sicherung, Wiederherstellung und Abgleich transportieren Blockfelder generisch. Ableitbare PDF-Seitenbilder bleiben gezielt aus Sicherungen und Abgleich heraus, das PDF-Original bleibt erhalten.
- Der persistente Suchindex, `Store.settled()` und das verschlüsselte Sicherungspaket sind bereits über Produktwege geprüft.

### Block- und Navigationsbestand

- Das Register enthält 77 Einträge: 49 im Editor anlegbare Blockeinträge, 11 Aktionen und 17 Einbett-Dienste.
- Zusätzlich existieren die nur zur Laufzeit verwendeten Strukturarten `spalte` und `pdfseite`.
- Navigation, Blockregister und Textstil-Katalog sind bereits zentrale Quellen; neue Parallelregister wären Duplikate.

### PDF und handschriftliche Marken

- `pdf.js` ist lokal eingebunden und gegen einen Prüfsummenbestand abgesichert.
- Ein PDF wird einmal in Seitenbilder und Suchtext überführt. Das unveränderte Original bleibt als Anhang erhalten; passwortgeschützte PDFs werden ohne Passwortspeicherung unterstützt.
- `pdfseite` und `blatt` verwenden dieselbe SVG-Markenschicht und denselben stabilen A4-/Seitenraum aus `src/core/sheet/space.ts`.
- Vorhandene Striche sind Größen- und Zoom-unabhängig, überleben Neuzeichnen, Neuladen, Sicherung, Wiederherstellung, Druck und die Neuberechnung abgeleiteter Seitenbilder.
- Der aktuelle Markenbestand kann nur Freihandstift und Radierer. Gespeichert wird eine Liste aus Kennung, Art, Farbe, Breite und Punkten. Auswahl, Mehrfachauswahl, Formen, Text, Marker sowie echtes Rückgängig/Wiederholen fehlen.
- Die allgemeine Zeichenfläche kennt zwar Linie, Pfeil, Rechteck, Ellipse, Notiz und Text. Sie rechnet aber in rohen Bildschirmpixeln, verschiebt nur ein einzelnes DOM-getroffenes Objekt und besitzt nur ein `pop()`-Rückgängig. Ihre Geometrie ist deshalb keine sichere Grundlage für PDF und Blatt.

### Lernen

- Lernkarten, Fälligkeit, Quellenbezug und vier Bewertungswege sind vorhanden.
- Die bestehende Planung ist eine kleine SM-2-Variante und speichert den Lernzustand am Block.
- Themen-, Quiz-, Arbeitsblatt- und Prüfungswerkzeuge bestehen bereits. Eine weitere Lernoberfläche ohne Einbindung in diese Wege wäre ein Duplikat.
- Ein FSRS-Kern, eine erklärbare Tagesplanung und eine explizite Konfliktstrategie für mehrfach geänderte Lernstände fehlen noch.

### Audio

- Browseraufnahme, Live-Transkript, Zeitmarken, Zusammenfassung, Aufgabenextraktion und das Anlegen einer Besprechungsseite existieren.
- Die Aufnahme wird aktuell nach dem Stoppen vollständig als Data-URL eingelesen. Ab ungefähr neun Millionen Zeichen wird sie verworfen. Damit ist der vorhandene Weg nicht für lange Aufnahmen geeignet.
- Ein stückweises Schreiben in Redions Anhangspeicher, segmentierte Transkription und ein fortsetzbarer Sitzungszustand fehlen.

### Wissensgraph und Kontext

- Redion erzeugt bereits Knoten und Kanten für Seiten, Datenbankzeilen, Entscheidungen, Quellen und Schlagwörter. Rückverweise, Tags, Unterseiten und Relationen fließen in den Graphen ein.
- Filter, Ausschnittbildung, Analyse und das Erzeugen neuer Wissensobjekte sind vorhanden.
- Ein neuer Graphspeicher wäre daher ein Duplikat. Offen sind vor allem belastbare Import-/Exportverträge für Notiz-Vaults und spätere, lokal begrenzte Kontextpakete.

### Abgleich und Sicherung

- Der Abgleich behandelt Blöcke und stückweise Anhänge; abgeleitete Dateien werden ausgelassen.
- `.redion`-Sicherungen, echte ZIP-Inhaltsprüfung, verschlüsselte Pakete, Passwortwechsel und Wiederherstellung nach noch laufender Löschkette sind vorhanden.
- Ink-V2-Daten können im bestehenden generischen Blocktransport bleiben. Eine parallele Ink-Datenbank oder ein eigenes Ink-Sicherungsformat ist nicht nötig.

## 3. Geprüfter Source-Kit-Bestand

Das Source-Kit wurde ausschließlich unter `C:\Users\redur\redion-source-kit` gelesen. Es wurde weder verändert noch in das Repository kopiert.

| Quelle | Geprüftes Muster | Entscheidung für Redion |
|---|---|---|
| `Redurbabat__BABAT-RED/tools/extern-apps/papers` | PDF-Werkzeugleiste, Seitenleiste, Suche, Zoom, geteilte Flächen, Annotationen, IndexedDB-Dateiablage | Nur Produktmuster übernehmen. Der Viewer lädt Worker/CDN und Proxy, Annotationen liegen in Ansichts-Pixeln und `Undo` entfernt nur den letzten Eintrag. Redions bestehende lokale PDF-Pipeline, stabile Blattkoordinaten und Anhangsablage bleiben maßgeblich. |
| `.../learning/recall/services/FsrsService.ts` | `ts-fsrs`, Stabilität/Schwierigkeit, Fälligkeit, „Warum jetzt?“ | Später als fachliche Referenz verwenden; nicht kopieren. Redion bleibt abhängigkeitsarm und benötigt zuerst einen geprüften Migrations- und Datenvertrag. |
| `.../learning/path/services/PathService.ts` | priorisierter Tagesplan aus Prüfung, Recall, Fach und Graph | Als Orchestrierungsmuster für eine spätere Lernzentrale nutzen; vorhandene Redion-Werkzeuge bleiben die Ausführungswege. |
| `.../learning/lexis/services/RecordingService.ts` | MediaRecorder und Blob-Ablage in separater IndexedDB | Nur Aufnahme-Lebenszyklus als Referenz. Redion hat bereits einen stückweisen zentralen Anhangspeicher; eine zweite Audio-Datenbank wäre falsch. |
| `.../tools/sidecars/services/AudioNotizService.ts` | Transkriptionsvertrag über Blob/FormData | Als Schnittstellenmuster für optionale externe Transkription; lokale Aufnahme und lokale Datenhoheit bleiben Vorgabe. |
| `.../ai/voice/VoiceService.ts` | Browser-TTS und SpeechRecognition mit Verfügbarkeitsprüfung | Vorhandene Browserfähigkeiten in Redions Besprechungsweg weiterverwenden, keine zweite Sprachschicht anlegen. |
| `.../brain/wissen/services/{VaultImport,WissenService,GraphPflegeService}.ts` | Markdown-/Frontmatter-Import, Duplikatschutz, Graphpflege | Spätere Importverträge daran spiegeln. Redions Block- und Verweisgraph bleibt der einzige Produktgraph. Der im Auftrag verkürzt genannte Pfad `wissen/VaultImport.ts` liegt tatsächlich unter `wissen/services/VaultImport.ts`. |
| `Redurbabat__Kopf` | Extraktion, Wissensgraph, Volltext-/Hybrid-Retrieval | Spätere Kontext- und Importarchitektur fachlich vergleichen; keine Python-/Serverpflicht in den lokalen Kern ziehen. |
| `Redurbabat__RED-KURD` | Elektroformeln, Berichtsheft, Prüfungs- und Notenbereiche | Fachliche Quellen für spätere Ausbildungsphasen; keine parallelen Produktbereiche in Phase 1. |
| `Redurbabat__lerning-` | SRS, Planer, Feedback und Gamification | Nur fachliche Gegenprobe für spätere Lernphasen. |
| `Redurbabat__Kalender` | lokaler Kalender und ICS | Bei einer späteren Planungsphase mit Redions bestehendem Kalender abgleichen. |
| `Redurbabat__Red-Max` | Simulator-Konzept und Agentenkatalog | Spätere Simulations-/Agentenphase, nicht Ink V2. |
| `Redurbabat__Red-Fit` | Repository- und Datenbankmuster | Keine neue Datenzugriffsschicht; Redions Store bleibt zuständig. |
| `Redurbabat__Redion` | älterer Redion-Stand | Nur als Herkunftsgegenprobe. Der aktuelle Arbeitsbaum ist neuer und alleinige Code-Wahrheit. |

## 4. Entscheidungen gegen Duplikate

1. **Kein zweiter PDF-Viewer.** Der bestehende `pdfseite`-Block, die lokale pdf.js-Kopie, Suchtext, Originalanhang und Neuberechnung bleiben erhalten.
2. **Keine zweite Zeichenfläche für Dokumente.** Ink V2 erweitert die gemeinsame Markenschicht von `blatt` und `pdfseite`.
3. **Kein Import von Whiteboard-Pixelgeometrie.** Wiederverwendbare, DOM-freie Rechnungen werden bei Bedarf als kleiner neutraler Kern unter `src/core/ink` extrahiert.
4. **Keine Ink-Sonderdatenbank.** Neue Markenarten bleiben additive Blockdaten und laufen damit durch vorhandene Sicherung und Synchronisation.
5. **Kein neuer Graph- oder Lernspeicher in Phase 1.** Vorhandene Blöcke und Dienste bleiben die Grundlage späterer Phasen.
6. **Keine Source-Kit-Abhängigkeit.** Muster werden neu und passend zu Redions Architektur umgesetzt; Framework-, CDN-, Proxy- und Serverannahmen werden nicht übernommen.

## 5. Phase 1 – Ink V2

### Geplanter Umfang

- Marker mit transparenter Darstellung.
- Linie, Pfeil, Rechteck und Ellipse.
- Sichere Textanmerkungen.
- Auswahlrechteck, Mehrfachauswahl, gemeinsames Verschieben und Löschen.
- Aktionsbasiertes Rückgängig/Wiederholen für Erzeugen, Löschen, Verschieben und Textänderung.
- `PointerEvent.pressure`, `getCoalescedEvents()` sowie Glättung und Punktreduktion ohne Speicherung jeder Rohbewegung.
- Rückwärtskompatible Darstellung aller bestehenden Stiftmarken.

### Voraussichtlich betroffene Dateien

- `src/core/ink/geometry.ts` – DOM-freie Punkt-, Begrenzungs-, Treffer-, Verschiebe- und Vereinfachungsrechnungen.
- `src/bereiche/pdf/marken.ts` – Werkzeugzustand, Eingabe, Darstellung, Auswahl und Verlauf.
- `index.html` – Ladefolge des neuen neutralen Kerns.
- `src/stile/*.css` beziehungsweise die bestehende passende Stildatei – Werkzeugleiste und Auswahlzustand.
- `pruefungen/lauf/test201.mts` – neuer Produktweg und Gegenproben.
- Generierte Dateien ausschließlich über den Build.

### Prüfvertrag

- Bestehender Stift bleibt bei Breiten- und Zoomwechsel positionsstabil.
- Marker bleibt sichtbar transparent.
- Formen und Text werden in Blattkoordinaten gespeichert.
- Mehrere Marken lassen sich auswählen, gemeinsam verschieben und löschen.
- Jede abgeschlossene Aktion erzeugt genau einen Verlaufsschritt; Pointer-Moves tun das nicht.
- Rückgängig/Wiederholen deckt Erzeugen, Löschen, Verschieben und Textänderung ab.
- Ausdruck und Sicherungs-/Wiederherstellungsweg tragen neue und alte Marken.
- Ansichten bei 390×844, 1366×768 und 1440×900 bleiben bedienbar.

### Risiken

- Eine große Werkzeugleiste kann auf schmalen Bildschirmen überlaufen; sie muss horizontal erreichbar und mit mindestens 44×44 px großen Zielen bedienbar bleiben.
- Druck und ältere Tests erwarten ein einzelnes von `zeichneMarke` geliefertes SVG-Element. Neue Arten dürfen diesen Vertrag nicht brechen.
- Pointer-Abbruch, Neuzeichnen und DOM-Entfernung dürfen keine laufende Marke verlieren und keine Ereignis-Zuhörer vermehren.
- Daten aus älteren Sicherungen enthalten nur zweidimensionale Punkte. Druck und Bildschirmdarstellung müssen fehlenden Druckwert sinnvoll ersetzen.

## 6. Phasenreihenfolge nach Ink V2

Nach Phase 1 wurden die Produktverträge in dieser Reihenfolge umgesetzt:
Dokumentansicht → Lernquelle und Lernrunde → Audioanhänge → Alias/Vault →
Capture/OCR → Ausbildung und Schulbibliothek. FSRS bleibt ausdrücklich
optional; bestehende SM-2-Fälligkeiten werden nicht migriert oder neu gerechnet.

## 7. Ergebnis der Phase 1

**Abgeschlossen am 22. August 2026.** Der geplante neutrale Kern liegt unter
`src/core/ink/geometry.ts`; `Marken` verwendet ihn für Marker, Linie, Pfeil,
Rechteck, Ellipse, sichere Textanmerkung, Mehrfachauswahl, Bewegung, Löschen
und Aktions-Undo/Redo. Druckwerte werden additiv unter `pressure` gespeichert,
alte zweidimensionale `pts` bleiben unverändert lesbar. Pointer-Moves schreiben
weder Store noch Verlauf.

Die Prüfung `test201` deckt den vollständigen Vertrag mit 32 Punkten ab und
ist grün. Auch die bestehenden Produktwege für A4/PDF-Koordinaten, ein
SVG-Knoten je Strich, PDF-Import, Notizblatt, Wiederherstellung, Druck und
Lebenszyklus bleiben grün (`test174`, `177`, `178`, `180`, `182`, `189`).

## 8. Ergebnis der Phasen 2–9

### Dokument und Lernen

- `document-mode.ts` ist eine alternative Ansicht derselben `pdfseite`-/
  `blatt`-Blöcke: eine volle Seite, kleine Vorschaubilder, Inspector und
  responsive Drawer/Bottom-Sheets. Deep Links wählen die betroffene Seite
  vor dem Rendern.
- `learning.ts` speichert einen kleinen Quellenvertrag am normalen Zielblock.
  Notiz, Karte, Aufgabe, Link und kleiner PDF-Crop verwenden vorhandene
  Block- und Dateiwege. Tagesrunde, Cloze, Fehlertraining und Statistik lesen
  normale Flashcards. Review-Ereignisse besitzen eindeutige IDs; SM-2 bleibt
  der unveränderte Scheduler.

### Audio und Wissen

- Neue MediaRecorder-Aufnahmen werden als Blob über `Dateien.ablegen` in
  1-MB-Stücken gespeichert und nur per `dateiId` referenziert. Legacy-`src`
  bleibt abspielbar. `audioRef` verbindet normale Notizblöcke mit Sekunden.
- Titel und Aliasse besitzen einen gemeinsamen eindeutigen Resolver. Ein
  Obsidian-Vault exportiert/importiert `redion-id`, stabilen Pfad und Aliasse;
  Reimport arbeitet über ID/Pfad und erhält Wikilinks.

### Capture, OCR, Ausbildung und Bibliothek

- Mobile Kamera-/Dateiauswahl legt Originale in einer normalen Capture-Seite
  ab. Native PDF-Textebene, OCR-Text und Ink bleiben getrennt. Ein optionaler
  localhost-Adapter bekommt Bild/PDF-/Ink-Ausschnitte nur nach Zustimmung;
  Provenienz und Vertrauen werden zusätzlich gespeichert und durchsucht.
- Die additive Ausbildungsvorlage erzeugt normale Datenbanken für Fächer,
  Prüfungen, Noten, Berichtsheft und Lernmaterial. Der Rechner enthält nur
  normfreie Formeln; Fragen kommen aus einem versionierten JSON-Paket mit
  Quelle/Lizenz/Region und Deduplizierung.
- Die bestehende Bibliothek besitzt eine abgeleitete Schulansicht für Ordner,
  letzte PDFs, Karten, Aufgaben und Termine. Sie führt bestehende Daten nur
  zusammen und speichert kein Dashboard-Modell.

### Noch bewusst optional

FSRS ohne stille Migration · eingebettete OCR-Engine nach gemessenem Lizenz-/
Bundlebudget · mehrseitige Perspektivkorrektur · Image Occlusion · normative
Elektroregeln nur mit exakter Region, Ausgabe und Quelle. Diese Erweiterungen
sind keine Voraussetzung für die local-first Kernpfade.
