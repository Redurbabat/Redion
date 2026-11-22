# Open-Source-Funktionen in RED ION

Diese Änderung übernimmt Arbeitsweisen aus der Projektliste in die vorhandenen RED ION-Bereiche. Block-IDs, Speicherformate und die bestehende App-Navigation bleiben kompatibel. Die hier ergänzten Funktionen sind unabhängig von externen Diensten.

| Referenzen | RED ION in diesem Stand |
| --- | --- |
| Schematico, VoltWeave, VoltWeaveCircuitStudio, sldeditor, React Flow, X6 | RED ION besitzt eigene Symbole, Raster, Klemmen, Leitungsverfolgung und Simulation. Das Prüfzentrum prüft nun auch explizite Klemmenverweise und kann alle Prüfpunkte, Bauteilgruppen und Netze als versioniertes JSON ausgeben. Schematico-Projekt-JSON und JSON-Seitenmakros können für fünf IEC-Symboltypen eingelesen werden. Redion führt die Leitungen neu und vergleicht das entstandene Netz mit den ursprünglichen Verbindungen. |
| Markmap, Mermaid, Obsidian Graph | Eine Gedankenkarte kann Markdown-Überschriften und Listen aus Dateien oder eingefügtem Text lesen und die Gliederung als Markdown speichern. Beim Import in eine bestehende Karte entsteht ein neuer Ast. Der Markdown-Austausch beschreibt den Themenbaum. Farben, Positionen und Querverbindungen stehen im RED ION-Block. Mermaid-Flowchart-Dateien enthalten Baum und Querverbindungen. Eine eingebettete Mermaid-Laufzeit und ein neuer Wissensgraph sind offen. |
| Univer, HyperFormula, SheetJS | Der RED ION-Tabellenkern hat bereits Zellformeln, Bezüge zwischen Blättern und Excel-, ODS- sowie CSV-Austausch. Die neue Fehlerliste rechnet die Arbeitsmappe und springt aus der Liste direkt zur betroffenen Zelle. Excel-Vollkompatibilität und weitere Dateiformate bleiben offen. |
| ts-fsrs | RED ION besitzt SM-2 und FSRS 4.5. Beim Aufdecken der Antwort zeigt es die erwarteten Wiederholungsintervalle. Erst das Bewerten speichert einen Termin und den Verlauf. Die Bibliothek ts-fsrs wird hier nicht gebündelt. |
| tldraw, diagrams.net, Excalidraw, Fabric.js | Zeichenfläche, Formen, Verbindungen und Bildimport sind bereits in RED ION vorhanden. Der Excalidraw-Import übernimmt Texte und gebundene Pfeile als Themen und Querverbindungen. Freie Zeichenflächen, Bilder und Positionen bleiben Eigenschaften der Originaldatei. |
| Tiptap, Lexical, Editor.js, BlockNote, Monaco Editor | RED ION verwendet seine eigenen Notizblöcke und seinen Markdown-Austausch. Eine zusätzliche Editor-Laufzeit ist offen. |
| pdf-lib, pdfme, perfect-freehand | RED ION besitzt einen lokalen PDF- und Freihandmodus. pdf-lib erstellt aus Originaldateien neue PDFs mit ausgewählten oder gedrehten Seiten und verbindet mehrere Originaldateien. perfect-freehand ergänzt Schaltplan-Freihand. PDF-Formularvorlagen bleiben offen. |
| EPUB.js, FullCalendar, PptxGenJS | Kalender und Folien sind RED ION-Bereiche. Ein zusätzlicher EPUB-Reader und die Übernahme der externen Kalender- oder Präsentations-Laufzeiten sind offen. |
| Yjs, Automerge, Dexie, RxDB, sql.js, PGlite | RED ION hält seine Daten in eigener lokaler Ablage mit optionalem Abgleich. Weitere Synchronisations- oder Speicher-Engines sind offen. |
| MCP Inspector, Ollama, WebLLM | Die vorhandenen MCP- und lokalen KI-Wege sind der Ausgangspunkt. Eine neue Inspector-Integration ist offen. |

Die technischen Vorbilder für die umgesetzten Änderungen sind [Markmap](https://markmap.js.org/docs/guide/writing), [AntV X6](https://github.com/antvis/X6) und [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). Die ausgelieferten Bündel pdf-lib 1.17.1 und perfect-freehand 1.2.3 liegen mit Lizenz und Prüfsumme im Fremdverzeichnis. PDF-Lib wird beim ersten Einsatz nachgeladen. Die Offline-Einzeldatei enthält beide Bündel. Redion speichert neue weiche Striche im bestehenden Planmodell mit einem optionalen Konturfeld.

Die Schaltplanmeldungen prüfen die Zeichnungsstruktur. Eine elektrische Sicherheitsabnahme ist ein eigener Arbeitsschritt.

## Geprüfte Repository-Liste

GitHub-Metadaten vom 22. November 2026. Die Fassung bezeichnet den geprüften Upstream-Stand. Die lizenzierten npm-Bündel haben eigene feste Versionen und Prüfsummen.

| Repository | Lizenzkennung und Revision | Stand in diesem PR |
| --- | --- | --- |
| [vitals5/schematico](https://github.com/vitals5/schematico) | MIT · 22e3b9d9 | JSON-Stromlaufblatt und JSON-Seitenmakro mit fünf geprüften Symboltypen in Redion einlesen. |
| [wieslawsoltes/VoltWeave](https://github.com/wieslawsoltes/VoltWeave) | MIT · 0384b235 | Referenz für Klemmen- und Verbindungsliste im Redion-Prüfzentrum. |
| [wieslawsoltes/VoltWeaveCircuitStudio](https://github.com/wieslawsoltes/VoltWeaveCircuitStudio) | MIT · 1b4bd473 | Redion-eigene Simulation vorhanden. Analoger Upstream-Simulator offen. |
| [NovaShang/sldeditor](https://github.com/NovaShang/sldeditor) | Kennung offen · 40b44340 | Referenz für die Prüfung von Anschlusskennungen und Topologie. |
| [canworkstudios/construct](https://github.com/canworkstudios/construct) | MIT · af487f5f | Referenz für Touch, Raster und Leitungen. |
| [antvis/X6](https://github.com/antvis/X6) | MIT · 10ac7467 | Referenz für Redions native Anschlussführung. |
| [jgraph/drawio](https://github.com/jgraph/drawio) | Apache-2.0 · f411a11f | Diagrammdatei-Austausch offen. |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | MIT · 29ab9e00 | Referenz für Anschlüsse und Knotenbeziehungen. |
| [konvajs/konva](https://github.com/konvajs/konva) | Kennung offen · bf1927c1 | Redion-Zeichenfläche vorhanden. Upstream-Canvas als Alternative. |
| [theacodes/kicanvas](https://github.com/theacodes/kicanvas) | Kennung offen · b031159e | KiCad-Viewer offen. |
| [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap) | MIT · 643792f6 | Alternativer Texteditor für Redions Notizblöcke. |
| [meta/lexical](https://github.com/meta/lexical) | MIT · 34635d54 | Alternativer Texteditor für Redions Notizblöcke. |
| [codex-team/editor.js](https://github.com/codex-team/editor.js) | Apache-2.0 · 60db62e9 | Alternativer Blockeditor für Redions Notizblöcke. |
| [Hopding/pdf-lib](https://github.com/Hopding/pdf-lib) | MIT · 93dd36e8 | Offline eingebunden. Originalseiten auswählen, anordnen, drehen und PDFs zusammenführen. |
| [pdfme/pdfme](https://github.com/pdfme/pdfme) | MIT · edb3663d | PDF-Formularvorlagen offen. |
| [steveruizok/perfect-freehand](https://github.com/steveruizok/perfect-freehand) | MIT · 176e00f2 | Offline eingebunden. Weiche Druckkontur für neue Schaltplanstriche und SVG. |
| [naptha/tesseract.js](https://github.com/naptha/tesseract.js) | Apache-2.0 · a1ca80d9 | Lokaler OCR-Dienst vorhanden. Browser-WASM-Engine und Sprachpakete offen. |
| [VolodymyrBaydalka/docxjs](https://github.com/VolodymyrBaydalka/docxjs) | Apache-2.0 · c533f383 | Word-Darstellung offen. |
| [microsoft/markitdown](https://github.com/microsoft/markitdown) | MIT · ed178952 | MarkItDown-Konverter und Python-Dienst offen. |
| [dream-num/univer](https://github.com/dream-num/univer) | Apache-2.0 · 926e1784 | Alternative zur bestehenden Tabellen-Engine. Isolierte Vorschau offen. |
| [jspreadsheet/ce](https://github.com/jspreadsheet/ce) | MIT · d9c04e8a | Alternative zur bestehenden Tabellen-Engine. |
| [exceljs/exceljs](https://github.com/exceljs/exceljs) | MIT · 5bed18b4 | Excel-Import und -Export in Redion vorhanden. ExcelJS-Adapter offen. |
| [dream-num/Luckysheet](https://github.com/dream-num/Luckysheet) | MIT · 5b3fe58f | Ältere Tabellenreferenz. |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | MIT · 3243489f | Redions FSRS und Vorschau vorhanden. Vergleich mit ts-fsrs und neue Scheduler-Integration offen. |
| [markmap/markmap](https://github.com/markmap/markmap) | MIT · 1f141799 | Markdown-Austausch in Redions Gedankenkarte vorhanden. |
| [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) | MIT · 7a027f75 | Mermaid-Flowchart aus Redions Gedankenkarte exportieren. |
| [cytoscape/cytoscape.js](https://github.com/cytoscape/cytoscape.js) | MIT · b7687341 | Vollständiger interaktiver Wissensgraph offen. |
| [johnfactotum/foliate-js](https://github.com/johnfactotum/foliate-js) | MIT · 78914aef | EPUB-Lesemodus offen. |
| [yjs/yjs](https://github.com/yjs/yjs) | Kennung offen · ee37f0a0 | CRDT-Pilot für ausgewählte Dokumente offen. |
| [automerge/automerge](https://github.com/automerge/automerge) | MIT · 09b19d50 | CRDT-Alternative für denselben Dokumenttyp. |
| [dexie/Dexie.js](https://github.com/dexie/Dexie.js) | Apache-2.0 · 95666bf5 | Alternative für Transaktionen und Migrationen der vorhandenen IndexedDB. |
| [tinyplex/tinybase](https://github.com/tinyplex/tinybase) | MIT · 540cd407 | Alternative für reaktive lokale Speicherung. |
| [sql-js/sql.js](https://github.com/sql-js/sql.js) | Kennung offen · 848ebd0a | Alternative für eine lokale SQLite-Datenbank. |
| [electric-sql/pglite](https://github.com/electric-sql/pglite) | Apache-2.0 · c9a361d3 | Alternative für eine lokale PostgreSQL-Datenbank. |
| [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | Kennung offen · 5ee54ee3 | Bestehende MCP-SDK-Integration. |
| [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector) | Kennung offen · eb54b447 | Externe MCP-Prüfung. Inspector 2.16.0 verlangt laut npm-Metadaten Node 22.23.4, 24.22.1 oder 26.12.1 innerhalb der unterstützten Versionsbereiche. |
| [ollama/ollama](https://github.com/ollama/ollama) | MIT · 318ee284 | Lokales KI-Angebot. Erweiterter Modelladapter offen. |
| [huggingface/transformers.js](https://github.com/huggingface/transformers.js) | Apache-2.0 · 205e9c25 | Lokale Modelle und Embeddings offen. |
| [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) | Apache-2.0 · df83db6c | WebGPU-Modelllaufzeit offen. |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | MIT · 9c2e462e | Beschriftete Elemente und gebundene Verbindungen als Redion-Gedankenkarte einlesen. |
| [fullcalendar/fullcalendar](https://github.com/fullcalendar/fullcalendar) | MIT · 4c1aa077 | Kalender mit iCalendar-Austausch vorhanden. Externe Oberfläche als Alternative. |
| [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) | MIT · 3c9ec1b6 | Folien und PowerPoint-Export vorhanden. Upstream-Exporter als Alternative. |
| [microsoft/monaco-editor](https://github.com/microsoft/monaco-editor) | MIT · ba7a57d4 | Zusätzlicher Codeeditor offen. |
| [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) | MIT · ccaf3d58 | Referenz für Tastatur- und Zeiger-Drag-and-drop. |
| [fabricjs/fabric.js](https://github.com/fabricjs/fabric.js) | MIT · ab604137 | Alternative für objektbasierte Canvas-Bearbeitung. |
| [tldraw/tldraw](https://github.com/tldraw/tldraw) | Kennung offen · ebe14336 | Whiteboard-Referenz. SDK-Lizenz separat prüfen. |
| [qelectrotech/qelectrotech-source-mirror](https://github.com/qelectrotech/qelectrotech-source-mirror) | GPL-2.0 · 3b1efb19 | Schaltplanreferenz. Quellen und Symbole benötigen eine separate Lizenzprüfung. |
| [readest/readest](https://github.com/readest/readest) | AGPL-3.0 · 026443f8 | Referenz für Lesebibliothek unter AGPL. |

## Prüfung dieser Erweiterung

- Typprüfung, TypeScript-Build, Offline-Einzeldatei, Dienststand und Windows-Webpaket bestanden.
- Acht Modelltests und fünf Browserprüfungen bestanden. Chromium öffnete das Schematico-Seitenmakro und die Excalidraw-Datei über die jeweiligen Dateidialoge. Die Mermaid-Datei wurde heruntergeladen und gelesen.
- PDF-Reihenfolge, Drehung und Text wurden an heruntergeladenen Beispieldateien geprüft. WebKit bei 390 Pixeln verwendete die Offline-Einzeldatei und eine synthetische Originaldatei aus der Test-Fixture. Der Chromium-Lauf nutzte den echten Redion-PDF-Import in die Ablage.
- Die Bereichsprüfung test537 ist grün. test109 meldet dieselben 63 älteren JavaScript-Dateien wie vor der Änderung. Beide neuen Fremdbündel samt Lizenztexten sind über Prüfsummen abgedeckt.
- Native iPhone-Geräteprüfung und signierte Windows-Installation stehen aus.
