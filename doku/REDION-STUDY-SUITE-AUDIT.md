# Redion Study Suite – Bestands- und Wiederverwendungs-Audit

Stand: 24. August 2026
Arbeitszweig: `codex-study-suite`
HEAD der Bestandsaufnahme: `8b92f5affa55277636ba83794fb26b6087705b24`
Ausgangspunkt vor der Study Suite: `833f7869517d8630c53e61ce5f131654676e98da`

## 1. Zweck und Leitplanken

Dieser Audit ist Phase 0 des Masterauftrags V3. Er trennt drei Dinge klar:

1. **Redions vorhandenen Produktkern**, der erweitert und nicht ersetzt wird.
2. **Wiederverwendbare Produktmuster** aus `C:\Users\redur\redion-source-kit`, das ausschließlich lesend untersucht wurde.
3. **Neue Arbeit**, die nur dort entsteht, wo Redion noch keine tragfähige Lösung besitzt.

Die unveränderten Leitplanken bleiben: lokaler Betrieb, IndexedDB als Primärspeicher, kein Framework und kein Bundler, lose Bereichskopplung über Ereignisse und zentrale Dienste, TypeScript als Quelle sowie erzeugtes JavaScript als Build-Ergebnis.

## 2. Geprüfter Redion-Ausgangsbestand

Dieser Abschnitt beschreibt den Bestand am Ausgangs-Commit `833f786`, also
vor den Implementierungen der Phasen 1–9. Der aktuelle Ergebnisstand folgt in
den Phasenberichten ab Abschnitt 5; dadurch werden damalige Lücken nicht mit
heute noch offenen Punkten verwechselt.

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

## 5. Phasenberichte nach Masterauftrag §45

Die folgenden Berichte trennen den implementierten Stand von optionalen oder
noch nicht abschließend auf echter Hardware geprüften Ausbaustufen. TypeScript
unter `src/` ist die Quelle; gleichnamiges JavaScript unter `quell/`, `sw.js`
und `redion-einzeldatei.html` sind Build-Ergebnisse. Der abschließende Lauf nach
§46 wird nicht vorweggenommen: Seine Ergebnisfelder sind bewusst als
**ROOT-PLATZHALTER** markiert.

### Phase 0 — Bestandsaudit und Baseline

- **Umgesetzt:** Arbeitszweig `codex-study-suite`, HEAD
  `8b92f5affa55277636ba83794fb26b6087705b24`; 77 Einträge im laufenden
  Blockregister; 170 ausführbare Prüfläufe, davon 169 nummerierte
  `test*.mts` und `servercheck.mts`. PDF, Ink, Lernen, Audio, Graph,
  Obsidian, Sync, Stückanhänge und Sicherung wurden im vorhandenen Code sowie
  das Source-Kit ausschließlich lesend inventarisiert. `git status --short`
  zeigte während dieses Nachtrags geänderte Doku, `test202`,
  `src/bereiche/wissen/electrical.ts`, erzeugtes Learning-JavaScript und die
  Einzeldatei sowie neue `lernpakete/`, `skripte/` und `test203.mts`. Dieser
  laufende Abschlussstand ist daher ausdrücklich kein sauberer Git-Status.
- **Nicht umgesetzt:** Phase 0 verändert absichtlich kein Produkt und kopiert
  keine Source-Kit-Datei. Separate Phasen-Commits wurden im vorhandenen Stand
  nicht nachträglich konstruiert; die Study Suite liegt in Commit `8b92f5a`.
- **Source / generiert:** dieser Audit sowie `AUFGABEN.md`, `LUECKEN.md`,
  `ENTSCHEIDUNGEN.md` und `README.md`; keine Produktquelle und kein
  Build-Ergebnis gehören zur Auditphase selbst.
- **Datenmodell:** keine Änderung; Seiten, Blöcke, Sammlungen und stückweise
  Anhänge bleiben die einzigen Primärdaten.
- **Rückwärtskompatibilität:** keine Laufzeitänderung in Phase 0.
- **Desktop:** vorhandene Windows-/Chromium-Wege wurden inventarisiert.
- **Mobile:** vorhandene Mobilwege wurden inventarisiert; Phase 0 hat keine
  eigene Laufzeitoberfläche.
- **Offline:** Offline-Cache und local-first Ablage wurden als Vorgabe
  bestätigt.
- **Sync:** vorhandener Drei-Wege-Abgleich, generische Blockfelder und
  Stückanhänge wurden als Wiederverwendungsvorgabe festgehalten.
- **Backup/Restore:** `.redion`-/JSON-Wege bleiben maßgeblich; keine zweite
  Ablage wurde geplant.
- **Tests:** Befehle nach §46: `git status`, `npm run typecheck`,
  `npm run bauen:ts`, `node bauen.mts`, `npm run pruefen -- --schnell` und
  `npm run pruefen`. (Seit E745, 11. Oktober 2026, fährt `--schnell` nur die
  Läufe ohne Browser und dazu test96 und test100 — bis dahin war es alles
  ausser test73. Die Aussage nach §46 trägt deshalb allein der volle Lauf,
  `npm run pruefen` oder `node pruefungen/volllauf.mts`.) **ROOT-PLATZHALTER: Datum, Befehl, Zahl ok/offen und
  Logpfad des finalen Baseline-/Volllaufs eintragen.**
- **Gegenprobe:** Für einen reinen Leseaudit ist eine absichtliche
  Produktbeschädigung nicht sinnvoll. Gegenbeleg sind Pfadprüfung und
  Quellvergleich: Framework-/CDN-/Nebenspeicher-Muster des Source-Kits wurden
  gerade nicht als Redion-Bestand gewertet.
- **Risiken / nächster Schritt:** Der dokumentierte Git-Status ist eine
  Momentaufnahme während des Endabgleichs. Nächster Schritt ist der finale
  §46-Lauf samt neuem `git status` durch Root.

### Phase 1 — Ink Engine V2

- **Umgesetzt:** transparenter Marker, Linie, Pfeil, Rechteck, Ellipse,
  sicherer/editierbarer Text, Mehrfachauswahl, gemeinsames Verschieben und
  Löschen, aktionsbasiertes Undo/Redo, Druckwert-Fallback, Coalesced Events,
  Glättung und Punktreduktion auf derselben Blatt-/PDF-Schicht.
- **Nicht umgesetzt:** Skalieren, Kopieren und Gruppieren einer Auswahl
  bleiben ausdrücklich spätere Lasso-Ausbaustufen.
- **Source / generiert:** `src/core/ink/geometry.ts`,
  `src/bereiche/pdf/marken.ts` sowie die Einbindungen in Editor, Schale,
  Druck und `quell/schale/stil/bausteine.css`; erzeugt sind insbesondere
  `quell/core/ink/geometry.js`, `quell/bereiche/pdf/marken.js` und die
  gleichnamigen Integrations-JavaScriptdateien, außerdem Einzeldatei/Cache.
- **Datenmodell:** additive Markenfelder `art`, `pressure`, `point`, `text`
  und `fontSize`; Formen bleiben in stabilen Blattkoordinaten. Es gibt keine
  Ink-Datenbank.
- **Rückwärtskompatibilität:** alte `art: "stift"`-Marken und `[x,y]`-Punkte
  bleiben lesbar; fehlender Druckwert erhält konstante Breite. Ein Strich
  bleibt ein SVG-Knoten und eine abgeschlossene Verlaufsaktion.
- **Desktop:** Werkzeugleiste und Zeichner sind für 1366×768 und 1440×900
  ausgelegt.
- **Mobile:** die 390×844-Werkzeugleiste bleibt einzeilig und horizontal
  erreichbar.
- **Offline:** sämtliche Geometrie und Werkzeuge laufen lokal ohne Netz.
- **Sync:** additive Markendaten laufen über generische Blockfelder und den
  vorhandenen Drei-Wege-Abgleich.
- **Backup/Restore:** Druck und Sicherung lesen dasselbe Markenformat; kein
  Sonderformat.
- **Tests:** `node pruefungen/lauf/test201.mts`, `test203` Abschnitt 1/7,
  flankiert von `test174`, `test177`, `test178`, `test180`, `test182` und
  `test189`.
  **ROOT-PLATZHALTER: finales Ergebnis/Log und §46-Gesamtergebnis eintragen.**
- **Gegenprobe:** `test201` verwendet alten Zweipunkt-Stift, HTML-artigen
  Text, unterschiedliche Druckwerte und einseitige Sync-Änderung als
  Gegenfälle; Text darf kein HTML-Kind erzeugen und alte Pfade müssen
  zeichenidentisch bleiben.
- **Risiken / nächster Schritt:** sehr große Markensätze und echtes
  Stiftgefühl auf iPhone/Windows-Pen bleiben Hardwarethemen; nach dem
  Abschlusslauf echte Gerätecheckliste abarbeiten.

### Phase 2 — Dokumentmodus für Windows und Mobile

- **Umgesetzt:** alternative Ansicht derselben verschachtelten `pdfseite`-,
  `blatt`-, `columns`- und `spalte`-Blöcke mit einer vollen Dokumentseite,
  lazy geladenen Miniaturen, Zoom, Deep-Link-Auswahl, einklappbarem Inspector
  und mobilen Drawern/Bottom-Sheets.
- **Nicht umgesetzt:** kein zweiter Viewer, keine zweite Dokumentablage und
  keine React-Portierung; das sind bewusst ausgeschlossene Varianten.
- **Source / generiert:** `src/bereiche/pdf/document-mode.ts`,
  `src/schale/aufbau/schale.ts`, `src/schale/aufbau/kopfleiste.ts`,
  `index.html` und `quell/schale/stil/bausteine.css`; erzeugt sind die
  gleichnamigen Dateien unter `quell/`, Cache und Einzeldatei.
- **Datenmodell:** nur `dokumentModus` an der normalen Seite; Index, Zoom und
  offene Seitenleisten sind flüchtiger Ansichtsstatus. Dokumentblöcke werden
  weder kopiert noch umgezogen.
- **Rückwärtskompatibilität:** normale Seitenansicht bleibt Standard und kann
  jederzeit wieder geöffnet werden; bestehende PDF-/Blattdaten bleiben
  unverändert.
- **Desktop:** Dreispaltenansicht; auf kleinem Laptop bleiben Miniaturen plus
  Dokument, der Inspector wird zum Drawer. Miniaturen laden nur sichtbar.
- **Mobile:** Drawer sind auf 390 px zunächst geschlossen; Dokument und
  Navigation bleiben im Seitenrahmen.
- **Offline:** Module und Seitenbilder liegen im Offline-Cache.
- **Sync:** nur das Seitenflag wird als normales Blockfeld übertragen.
- **Backup/Restore:** Dokumente und Anhänge benutzen weiter ihre bisherigen
  Sicherungswege.
- **Tests:** `node pruefungen/lauf/test202.mts`, Abschnitt 1/9, `test203`
  Abschnitt 2/7 und die bestehenden PDF-/Blatt-Rundläufe.
  **ROOT-PLATZHALTER: finales Ergebnis, Viewport-Sichtprüfung und Log
  eintragen.**
- **Gegenprobe:** `test202` verschachtelt eine PDF-Seite in Spalten, wechselt
  per echtem Knopf und Deep Link und fordert bei drei Viewports genau eine
  Vollseite ohne horizontalen Überlauf.
- **Risiken / nächster Schritt:** echte 500-Seiten-Dokumente und
  Touch-/Pen-Wechsel sind nur teilweise synthetisch abgedeckt; visuellen
  Chromium- und Echtgerätelauf protokollieren.

### Phase 3 — PDF/Notiz zu Lernen

- **Umgesetzt:** Quellaktion „Als Notiz“, „Als Lernkarte“, „Als Aufgabe“,
  „Als Bild“ und „Verlinken“; normale Zielblöcke, exakter Rücksprung zu
  Seite/Block/Region und bewusst kleiner WebP-Ausschnitt über die bestehende
  Dateiablage.
- **Nicht umgesetzt:** Image Occlusion ist als spätere Unterstufe nicht Teil
  dieses Stands.
- **Source / generiert:** `src/bereiche/wissen/learning.ts`,
  `src/bereiche/pdf/document-mode.ts`, `src/bereiche/wissen/dienst.ts`,
  `src/bereiche/wissen/werkzeuge.ts` und `src/bereiche/dateien/ablage.ts`;
  erzeugt sind die gleichnamigen Dateien unter `quell/`, Cache und
  Einzeldatei.
- **Datenmodell:** versionierter kleiner `sourceRef`-Vertrag mit `pageId`,
  `blockId`, Art, PDF-Seitennummer und optionaler Region; `lernquelle` bleibt
  vorerst als kompatibler Alias desselben Werts. Karten sind normale
  `flashcard`-Blöcke, Aufgaben normale `todo`-Blöcke.
- **Rückwärtskompatibilität:** Karten ohne Quelle sowie bestehende
  `lernquelle` bleiben lesbar; das PDF-Original wird für einen Crop nicht
  dupliziert.
- **Desktop:** Quellmenü und Rücksprung verwenden die bestehende
  Überlagerung und den Dokument-Inspector.
- **Mobile:** dieselbe responsive Überlagerung bleibt im schmalen Viewport.
- **Offline:** Crop und Blockanlage erfolgen lokal.
- **Sync:** Referenzfelder reisen als normale Blockfelder.
- **Backup/Restore:** ein erzeugter Crop ist ein normaler stückweiser Anhang
  mit stabiler Datei-ID.
- **Tests:** `test202`, Abschnitt 2/9, und `test203`, Abschnitt 3/7.
  **ROOT-PLATZHALTER: finales Ergebnis sowie echter PDF-Ausschnitt-/
  Sicherungsrundlauf eintragen.**
- **Gegenprobe:** wiederholter markierter Text darf nur an der tatsächlich
  gewählten Position zur Lücke werden; Zoom darf Quellkoordinaten nicht
  verändern.
- **Risiken / nächster Schritt:** gelöschte oder nicht mehr freigegebene
  Quellen müssen im UI weiter ehrlich als nicht erreichbar erscheinen;
  Rechte-/Löschfall im Gesamtlauf nachhalten.

### Phase 4 — Lernen V2

- **Umgesetzt:** tägliche Queue mit Fehlern, Fälligen, begrenzten neuen und
  zukünftigen Karten; Cloze-Syntax `{{Antwort::Hinweis}}`, Quellenanzeige,
  Fehlertraining, Nochmal-Rate, Wiederholungs- und Themenstatistik sowie
  Prüfungscountdown. Review-Ereignisse besitzen stabile IDs.
- **Nicht umgesetzt:** FSRS bleibt optional; es gab keine stille Migration
  und keine Neuberechnung bestehender Fälligkeiten.
- **Source / generiert:** `src/bereiche/wissen/learning.ts`,
  `src/bereiche/wissen/dienst.ts`, `src/bereiche/wissen/werkzeuge.ts` und die
  Einbindung in `src/bereiche/wissen/bibliothek.ts`; erzeugt sind die
  gleichnamigen JavaScriptdateien unter `quell/`, Cache und Einzeldatei.
- **Datenmodell:** bestehendes `sr` bleibt SM-2-Wahrheit; additiv kommen
  `reviewVerlauf` als ID-adressiertes Ereignisobjekt, `lernAlgorithmus:
  "sm2"`, `sourceRef` und optionale Themenmetadaten hinzu.
- **Rückwärtskompatibilität:** Karten ohne Verlauf, alte Array-Verläufe und
  bestehende SM-2-Felder werden gelesen; der Scheduler bleibt SM-2.
- **Desktop:** die Lernübersicht läuft als vorhandene Überlagerung.
- **Mobile:** dieselbe Übersicht ordnet Karten und Statistiken responsiv an.
- **Offline:** Queue, SM-2 und Statistik arbeiten vollständig aus dem lokalen
  Store.
- **Sync:** merge-freundliche Review-IDs und normale Blockfelder vermeiden
  einen zweiten Lernbestand.
- **Backup/Restore:** `sr`, Verlauf und Quellen reisen über die vorhandene
  generische Sicherung.
- **Tests:** `test202`, Abschnitt 2/3/6/9, `test203`, Abschnitt 4/7, plus
  vorhandene SM-2-Tests. **ROOT-PLATZHALTER: finales Ergebnis,
  Kartenrundlauf und Log eintragen.**
- **Gegenprobe:** zukünftige Karte darf nicht in „Heute“ erscheinen,
  Bewertung 2 darf die Nochmal-Rate für Bewertung 1 nicht erhöhen, und das
  bloße Öffnen der Statistik darf keinen Block anlegen.
- **Risiken / nächster Schritt:** parallele Reviews desselben Ereignisses und
  große Bestände bleiben Last-/Sync-Risiken; erst nach belastbaren Daten über
  eine explizite FSRS-Option entscheiden.

### Phase 5 — Audio V2 und Zeitmarken

- **Umgesetzt:** MediaRecorder-Blobs werden über `Dateien.ablegen` stückweise
  gespeichert und per `dateiId` referenziert; Aufnahmezeitmarken und
  Transkriptzeilen erzeugen normale Notizblöcke mit `audioRef`. Browser-
  Spracherkennung, manuelles/Datei-Transkript und ein bewusst aufgerufener
  Sidecar bleiben verfügbar.
- **Nicht umgesetzt:** keine separate Audio-Cloud; fortlaufende
  Segmenttranskription sehr langer Aufnahmen bleibt optional/offen.
- **Source / generiert:** `src/bereiche/verbinden/besprechung.ts`,
  `src/bereiche/dateien/ablage.ts`, `src/bereiche/dateien/ausgeben.ts` und
  Audio-Darstellung im bestehenden Editor; erzeugt sind die gleichnamigen
  Dateien unter `quell/`, Cache und Einzeldatei.
- **Datenmodell:** normaler Audio-Block mit `dateiId`, Typ und Beschriftung;
  `audioRef { blockId, dateiId, sek }` an normalen Textblöcken. Stückdaten
  bleiben im zentralen Anhangspeicher.
- **Rückwärtskompatibilität:** alte Audio-Blöcke mit `src: data:...` bleiben
  abspielbar; es gibt keine automatische Löschung oder Zwangsmigration.
- **Desktop:** Aufnahme nutzt die MediaRecorder-Fähigkeit des Browsers.
- **Mobile:** derselbe Weg gilt, soweit Browser und Betriebssystem das
  Mikrofonformat anbieten.
- **Offline:** Speichern und Abspielen sind local-first; ohne
  SpeechRecognition bleibt Aufnahme plus manuelles Transkript nutzbar.
- **Sync:** Datei-ID und Stücke verwenden denselben Attachment-Sync wie
  andere Dateien.
- **Backup/Restore:** Audio reist über den bestehenden `.redion`-Weg; keine
  Sonderablage.
- **Tests:** `test202`, Abschnitt 4/9, `test203`, Abschnitt 5/7, ergänzt um
  bestehende Datei-, Sicherungs- und Sync-Rundläufe.
  **ROOT-PLATZHALTER: finales Ergebnis, Audio-Rundlauf über Reload/Restore
  und Log eintragen.**
- **Gegenprobe:** Byterundlauf liest den gespeicherten Blob zurück; Sidecar
  darf ohne sichtbare Zustimmung nicht aufgerufen werden, und der Quelltext
  darf keinen `readAsDataURL`-Weg für neue Aufnahmen enthalten.
- **Risiken / nächster Schritt:** echte Mikrofonformate, iOS-Hintergrund und
  mehrstündige Dateien sind geräteabhängig; 30-Sekunden- und Mehr-MB-
  Echtaufnahme im Abschlussprotokoll festhalten.

### Phase 6 — Wissenssystem, Aliase und Obsidian

- **Umgesetzt:** zentraler Resolver für Titel, Alias, Hierarchie-/Vault-Pfad
  und `redion:<id>`; Suche, Wikilinks, Picker, Backlinks, Graph und
  unverlinkte Erwähnungen verwenden ihn. Vault-Export/-Import trägt stabile
  `redion-id`, `redion-path`, Titel und Aliasse und behandelt Kollisionen
  sowie fremde Vaults defensiv.
- **Nicht umgesetzt:** kein zweiter Graph und keine Strich-Knoten; externe
  Kontext-/Vektordatenbank bleibt außerhalb dieses Kerns.
- **Source / generiert:** `src/bereiche/wissen/verweise.ts`,
  `src/bereiche/wissen/werkzeuge.ts`, `src/bereiche/wissen/dienst.ts`,
  `src/bereiche/dateien/ausgeben.ts` und `src/bereiche/ki/kontext.ts`;
  erzeugt sind die gleichnamigen JavaScriptdateien unter `quell/`, Cache und
  Einzeldatei.
- **Datenmodell:** additive `aliases` an normalen Seiten; Vault-Provenienz
  (`obsidianPath`, deklarierter Pfad, Vaultname/-wurzel) nur an importierten
  normalen Seiten. Eigene Roundtrips können opaque Block-/Datei-IDs erhalten.
- **Rückwärtskompatibilität:** Seiten ohne Alias funktionieren wie zuvor;
  bestehende Wikilinks und Markdown-Importe bleiben lesbar. Mehrdeutigkeit
  liefert Kandidaten statt willkürlich die erste Seite.
- **Desktop:** Aliasdialog und Vault-Dateiauswahl nutzen vorhandene Dialoge.
- **Mobile:** dieselben Dialoge sind responsiv; ein Vault-Rundlauf ist wegen
  Dateiauswahl und ZIP-Größe primär ein Desktop-Arbeitsweg.
- **Offline:** Resolver, ZIP und Markdown arbeiten lokal.
- **Sync:** Aliasse und Provenienz sind generische Blockfelder.
- **Backup/Restore:** Vollsicherung bleibt unabhängig vom freiwilligen
  Vault-Export.
- **Tests:** `test202`, Abschnitt 5 und 9, plus Markdown-/ZIP-/Graph-
  Regressionen. **ROOT-PLATZHALTER: finales Ergebnis, eigener Vault-
  Reimport samt Datei-Bytes und Log eintragen.**
- **Gegenprobe:** gleicher Titel muss mehrdeutig bleiben; falscher Pfad bei
  gleicher ID und gemischter eigener/fremder Vault dürfen keinen Datensatz
  überschreiben, sondern Konflikt/Abbruch erzeugen.
- **Risiken / nächster Schritt:** sehr große Vaults und exotisches YAML sind
  begrenzt; final Rechte, Teil-Vault, Pfadtraversal und kollidierende Namen
  anhand des Testlogs bestätigen.

### Phase 7 — OCR, Scanner und Handschrifterkennung

- **Umgesetzt:** mobile Kamera-/Dateiauswahl legt Originale unverändert auf
  einer idempotenten normalen Eingangsseite ab. Ein optionaler localhost-
  Adapter verarbeitet nach Zustimmung Bild-, PDF- oder Ink-Regionen;
  Erkennung bleibt getrennt und kann als normaler Text- oder Formelblock
  übernommen werden.
- **Nicht umgesetzt:** keine eingebettete OCR-Engine, automatische
  mehrseitige Kanten-/Perspektivkorrektur oder Pflichtcloud. Diese
  Ausbaustufen bleiben nach Größen-, Lizenz- und Gerätemessung optional.
- **Source / generiert:** `src/bereiche/dateien/recognition.ts`,
  `src/bereiche/dateien/ablage.ts`, `src/bereiche/ki/kontext.ts` und die
  Quellaktionen des Dokumentmodus; erzeugt sind die gleichnamigen Dateien
  unter `quell/`, Cache und Einzeldatei.
- **Datenmodell:** `capture`-Provenienz am normalen Datei-/Bildblock;
  `ocrRegions` als ID-adressierte Regionssätze, abgeleitetes `ocrText` und
  ein `sourceRef` am bestätigten Vorschlagsblock. Original-Ink und nativer
  PDF-`suchtext` bleiben getrennt.
- **Rückwärtskompatibilität:** vorhandene PDFs/Bilder/Ink funktionieren ohne
  OCR-Endpunkt unverändert; kein erkannter Text überschreibt das Original.
- **Desktop:** normale Dateiauswahl und Dokument-Quellaktionen.
- **Mobile:** Kameraauswahl über `capture="environment"` und derselbe normale
  Eingang.
- **Offline:** Erfassung ist offline; Erkennung braucht nur bei Nutzung den
  konfigurierten lokalen Dienst. Redion bleibt ohne ihn bedienbar.
- **Sync:** Provenienz und Erkennung reisen als normale Blockfelder.
- **Backup/Restore:** das Original reist als normaler Anhang; der lokale
  Endpunkt ist keine Voraussetzung für das Wiederherstellen.
- **Tests:** `test202`, Abschnitt 7/9, `test204`, Abschnitt 6/7, plus
  Datei-/Suchtests.
  **ROOT-PLATZHALTER: finales Ergebnis, Kamera-/Datei-Gegenprobe und Log
  eintragen.**
- **Gegenprobe:** Cloud-URL wird abgelehnt; Ink und `suchtext` müssen vor/nach
  Erkennung bytegleich sein; Größen-, Regions-, Text- und Punktgrenzen
  verhindern unbeschränkte Eingaben.
- **Risiken / nächster Schritt:** Erkennungsqualität hängt vom optionalen
  Sidecar ab; echtes Kameragerät und eine reale gescannte PDF prüfen, bevor
  ein bestimmtes OCR-Modell empfohlen wird.

### Phase 8 — Elektro-Ausbildung

- **Umgesetzt:** additive Vorlage „Ausbildung“ mit normalen Seiten und
  Datenbanken für Fächer, Prüfungen, Noten, Berichtsheft und Lernmaterial;
  normfreier Elektrotechnik-Rechner; normaler Formelblock mit
  Rechenprovenienz; validierbarer, versionierter Lernpaketvertrag mit
  Deduplizierung, Lizenz, Quelle, Region und Normfeld. Das Artefakt
  `babat-red-elektrofragen-1.0.0.json` enthält 12 redaktionell neue,
  nachgerechnete normfreie Fragen und 378 aus sieben Source-Kit-Dateien per
  TypeScript-AST inventarisierte Originalfragen ausschließlich in Quarantäne.
- **Nicht umgesetzt:** Keine der 378 BABAT-RED-Originalfragen wird ohne
  geklärte Lizenz, Provenienz, Region und fachliche Primärquelle aktiv. Der
  Manifeststatus bleibt ehrlich `not-cleared`; auch die Notenskala ist
  ausdrücklich unkonfiguriert.
- **Source / generiert:** `src/core/electrical/calculations.ts`,
  `src/bereiche/wissen/electrical.ts`, `src/bereiche/vorlagen/daten.ts`,
  `src/core/import/spaltentyp.ts`, Prüfungscountdown in
  `src/bereiche/wissen/learning.ts`,
  `lernpakete/babat-red-elektrofragen-1.0.0.json` und das reproduzierende
  `skripte/erzeuge-babat-red-lernpaket.mts`; erzeugt sind die gleichnamigen
  JavaScriptdateien unter `quell/`, Cache und Einzeldatei.
- **Datenmodell:** eine normale `schoolRoot`-Seite mit stabilen `schoolRole`-
  Kindern und Sammlungen mit `schoolKind`; `gradeScale.configured: false`;
  Formelblöcke tragen `electricalCalculation`, Karten `learningPackage` und
  vorhandene `quiz`-Felder.
- **Rückwärtskompatibilität:** Vorlage ist idempotent/additiv und erhält
  eigenen Titel/Inhalt; alle erzeugten Objekte bleiben normale Redion-
  Seiten, Sammlungen, Formeln und Karten.
- **Desktop:** Rechnerdialog und Vorlage nutzen die vorhandene Oberfläche.
- **Mobile:** derselbe Rechnerdialog ordnet Felder responsiv an.
- **Offline:** Formeln und Grundpaket benötigen kein Netz.
- **Sync:** alle Inhalte laufen über normale Block- und Sammlungswege.
- **Backup/Restore:** dieselben Objekte liegen in der vorhandenen Sicherung;
  kein Ausbildungs-Nebenspeicher.
- **Tests:** `test202`, Abschnitt 6/9; Paket/Quarantäne in `test203` und die
  Lebenszyklen zusätzlich in `test204`. **ROOT-PLATZHALTER: finales Ergebnis, Paketvalidierung,
  Vorlagen-/Lernkartenrundlauf und Log eintragen.**
- **Gegenprobe:** Nullteiler, mehr als 200 Werte und normative Frage ohne
  belegte Ausgabe werden abgelehnt; zweiter Paket-/Vorlagenaufruf darf nichts
  duplizieren oder eigenen Inhalt überschreiben.
- **Risiken / nächster Schritt:** das Paketartefakt ist vorhanden, seine
  gebündelte Offline-Einbindung und die Quarantänegrenzen müssen im finalen
  Test belegt werden. Schweizer Norm-/Notenpakete benötigen weiterhin
  eindeutig versionierte Primärquellen und Nutzungsrechte.

### Phase 9 — Schulbibliothek und OneNote-Komfort

- **Umgesetzt:** abgeleitete Schulansicht in der bestehenden Bibliothek mit
  normalen Ordnern/Bereichen, letzten PDFs, Tageskarten, offenen Aufgaben,
  Prüfungen sowie Quick Capture, Lernen und Rechner. Der Eingang ist eine
  normale Seite unter der Ausbildungswurzel.
- **Nicht umgesetzt:** keine zweite Bibliothek, kein Dashboard-Store und kein
  fest codierter Personenname.
- **Source / generiert:** `src/bereiche/wissen/bibliothek.ts`,
  `src/bereiche/vorlagen/daten.ts`, `src/bereiche/dateien/recognition.ts`,
  `src/bereiche/wissen/learning.ts` und
  `quell/schale/stil/bausteine.css`; erzeugt sind die gleichnamigen
  JavaScriptdateien unter `quell/`, Cache und Einzeldatei.
- **Datenmodell:** kein neues Dashboard-Modell; gelesen werden normale
  Seitenhierarchie, `schoolRole`/`schoolKind`, PDFs, Karten, Aufgaben und
  Datumsfelder. Nur die Eingang-/Ausbildungsstruktur wird bei Bedarf normal
  angelegt.
- **Rückwärtskompatibilität:** die bisherige Bibliothek und ihre Reiter
  bleiben bestehen; ohne Ausbildungswurzel erscheint ein optionaler
  Einrichtungsweg statt einer Migration.
- **Desktop:** Kartenraster mit Ordnern, Dokumenten, Lernen, Aufgaben und
  Prüfungen.
- **Mobile:** einspaltige Ansicht auf 390 px.
- **Offline:** Aggregation liest ausschließlich lokalen Bestand und Cache.
- **Sync:** die Ansicht selbst speichert nichts; ihre Quellen verwenden den
  vorhandenen Abgleich.
- **Backup/Restore:** das Dashboard besitzt keine eigene Sicherung; normale
  Quellobjekte liegen im vorhandenen Backup.
- **Tests:** `test202`, Abschnitt 8 und 9. **ROOT-PLATZHALTER: finales
  Ergebnis, Sichtprüfung bei 390×844 und 1440×900 sowie Log eintragen.**
- **Gegenprobe:** Block-/Sammlungszahl wird vor und nach dem Öffnen
  verglichen; die reine Dashboard-Aggregation darf keinen zweiten Bestand
  erzeugen.
- **Risiken / nächster Schritt:** große Schulbestände brauchen später
  Lastmessung/Virtualisierung; zunächst abschließende Chromium- und
  Echtgeräte-Sichtprüfung dokumentieren.

## 6. Abschlussprüfung nach §46

Erst wenn alle folgenden Platzhalter mit echten Ergebnissen ersetzt sind,
darf dieser Audit als Abschlussbeleg dienen:

| Prüfung | Finales Ergebnis |
|---|---|
| `git status` und `git diff --check` | **ROOT-PLATZHALTER** |
| `npm run typecheck` | **ROOT-PLATZHALTER** |
| `npm run bauen:ts` | **ROOT-PLATZHALTER** |
| `node bauen.mts` / PWA / `index.html` / Einzeldatei | **ROOT-PLATZHALTER** |
| `npm run pruefen -- --schnell` (seit E745 nur ohne Browser, dazu test96 und test100 — kein Ersatz für die Zeile darunter) | **ROOT-PLATZHALTER** |
| `npm run pruefen` | **ROOT-PLATZHALTER** |
| Windows/Chromium und Viewports 390×844, 1366×768, 1440×900 | **ROOT-PLATZHALTER** |
| echter PDF-, Audio-, Lernkarten- und `.redion`-Rundlauf | **ROOT-PLATZHALTER** |

Bewusst optionale nächste Ausbaustufen bleiben: FSRS nur mit expliziter
Migration; eingebettete OCR erst nach Bundle-/Lizenzmessung; mehrseitige
Perspektivkorrektur; Image Occlusion; normative Elektroinhalte nur mit
exakter Region, Ausgabe, Quelle und Lizenz. Sie sind keine heimlich als
fertig behaupteten Bestandteile dieses Stands.


================================================================================
# NACHTRAG · 24. August 2026 — was der Stand wirklich tat
================================================================================

Dieser Nachtrag ist nicht die Fortsetzung des Umbaus, sondern sein Befund.
Er steht hier, weil der Audit oben den Ausgangsbestand beschreibt und der
ausgelieferte Stand etwas anderes war.

## 1. Der Stand lief nicht

Die beiden Codex-Commits — Study Suite und grosser Produktumbau — brachten
rund 40 000 Zeilen mit. Davon lief nichts.

```txt
src/bereiche/wissen/arbeitswelt.ts:337   let roh: unknown = null
                                          … darüber: for (const wert of roh)
```

`npm run typecheck` brach daran ab. Weil `bauen:ts` erst danach läuft, wurde
keine der fünf neuen Dateien je nach `quell/` geschrieben:

```txt
quell/bereiche/wissen/lebensbereiche.js       fehlte
quell/bereiche/wissen/lernwelt.js             fehlte
quell/bereiche/wissen/arbeitswelt.js          fehlte
quell/bereiche/wissen/produkt_onboarding.js   fehlte
quell/bereiche/wissen/produktwelten.js        fehlte
```

`index.html` lud sie trotzdem. Ein `<script src>` auf eine fehlende Datei ist
im Browser kein Fehler — die Seite lädt weiter, das Modul ist nicht da.

```txt
                       vorher            nachher
404er beim Start       5                 keine
Lebensbereiche         undefined         object
Lernwelt               undefined         object
Startseite heisst      „Start"           „Heute"
Einzeldatei            4688 KB           5596 KB
```

Ganze Ursache: ein Zeichen Typ. Siehe ENTSCHEIDUNGEN.md E132.

## 2. Was danach zu sehen war

Viel, und es ist echt. Mit Augen geprüft, am Rechner (1300×900, 1440×900),
am Tablet (760×900) und an zwei Telefongrössen (390×844, 428×926), jeweils
ohne waagerechten Überlauf und ohne Skriptfehler:

```txt
Heute-Dashboard      Begrüssung, Datum, Lernziel, vier Kennzahlen,
                     Tagesrunde, nächste Prüfung, Aufgaben, Termine
Lernzentrale         Tagesrunde, Fehlertraining, neue Karten
Lernpfad             geordnete Themenliste mit Fortschritt
Meine Fehler         Fehlerzentrum
Prüfungszentrale     kommende Prüfungen mit Countdown und Simulation
Schule / Uni / Arbeit
Workspace-Übersicht  Zählerkarten, zuletzt geöffnet, Favoriten,
                     als Nächstes, nächste Termine, Reiter
Bibliothek           Seiten, Blöcke, Dateien, PDFs, Whiteboards, Tabellen
Einrichtung          dreistufiger Assistent für Hauptwelt und Bereiche
```

## 3. Was dabei an Fehlern gefunden wurde

```txt
E132  Die Bauschranke (oben) · der Prüfserver hielt nicht an, `stopp()`
      wartete unendlich auf jede offene Verbindung · das Onboarding
      blockierte test202 · drei Stilblätter standen hinter bausteine.css
      und die Kaskade sprang zurück
E135  Die Lernwelt rechnete falsch. Zwei Ursachen:
        · ein leerer Lernstand (`sr: {}`) galt als Lernstand → keine Karte
          war je „neu", jede galt als „fällig" (gemessen: 0 neu, 5 fällig
          bei fünf fabrikneuen Karten)
        · `datum()` gab für jedes echte `Date` null zurück → Lernziel,
          Streak, Verlaufsbalken und Prüfungs-Countdown standen still;
          auf dem Bildschirm stand wörtlich „null Tage"
```

## 4. Was neu gebaut wurde

```txt
E134  Papiervorlagen am A4-Blatt: blanko, liniert, kariert, Punktraster,
      Millimeterpapier. Ein Feld am Block, ein Hintergrundbild im
      Stilblatt — kein zweites Dokumentformat (Auftrag §21). Die Abstände
      stehen in Blattmassen: ein Karo ist 5 mm, auch am Telefon und auch
      auf einem dreiseitigen Blatt.
E133  test206 — die erste Prüfung, die die Produktwelten wirklich öffnet,
      samt der Regel „ein Objekt, viele Ansichten" an Zählwerten gemessen.
```

## 5. Prüfstand

| Prüfung | Ergebnis am 24. August |
|---|---|
| `npm run typecheck` | grün |
| `npm run bauen:ts` | grün |
| `node bauen.mts` | grün, 5596 KB |
| `test87` Architektur und Sicherheit | 125 ok, 0 offen |
| `test101` Eingabegrenzen | 30 ok, 0 offen, Exit 0 ohne `process.exit()` |
| `test105` gebaut ↔ Quelle | grün |
| `test109` kein neues handgeschriebenes JS | 20 ok, 0 offen |
| `test202` Study Suite | 84 ok, 0 offen |
| `test205` Prüfserver hält an — NEU | 11 ok, Gegenprobe 1 rot |
| `test206` Produktwelten — NEU | 33 ok, Gegenprobe 4 rot |
| `test207` Papiervorlagen — NEU | 37 ok, Gegenprobe 4 rot |
| `test208` Lernwelt — NEU | 18 ok, Gegenprobe 5 bzw. 3 rot |
| Viewports 390×844 · 428×926 · 760×900 · 1300×900 · 1440×900 | kein waagerechter Überlauf |

Jede neue Prüfung wurde gegen die zurückgenommene Behebung laufen gelassen
und ist dabei rot geworden (§55.2). Eine Prüfung, die nicht rot werden kann,
ist keine.

## 6. Was dieser Nachtrag NICHT behauptet

Der grosse Auftrag ist nicht abgearbeitet. Umgesetzt sind seine Abschnitte 3
(die zwei Prüfläufe), 21 (Papiervorlagen) und 56 (Prüfungen für die
Produktwege) — und die Voraussetzung für alles andere, dass die Module
überhaupt laufen.

Offen und in LUECKEN.md unter L49–L53 festgehalten: Fassaden in der Lernwelt
(Tastatur im Training, Prüfungsfokus-Kachel, Simulationsgedächtnis) · zwei
Rechenwege für dieselben Aggregate · die Hauptwelten stehen in keinem
Register · zwei Willkommensdialoge an zwei aufeinanderfolgenden Starts ·
„⌁ Erkennen" braucht einen OCR-Dienst, den Redion nicht mitliefert.
