# Open-Source-Funktionen in RED ION

Diese Änderung übernimmt Arbeitsweisen aus der Projektliste in die vorhandenen RED ION-Bereiche. Block-IDs, Speicherformate und die bestehende App-Navigation bleiben kompatibel. Die hier ergänzten Funktionen sind unabhängig von externen Diensten.

| Referenzen | RED ION in diesem Stand |
| --- | --- |
| Schematico, VoltWeave, VoltWeaveCircuitStudio, sldeditor, React Flow, X6 | RED ION besitzt eigene Symbole, Raster, Klemmen, Leitungsverfolgung und Simulation. Das Prüfzentrum prüft nun auch explizite Klemmenverweise und kann alle Prüfpunkte, Bauteilgruppen und Netze als versioniertes JSON ausgeben. Projektdatei-Importe und ein neuer Routing-Kern gehören zu späteren Änderungen. |
| Markmap, Mermaid, Obsidian Graph | Eine Gedankenkarte kann Markdown-Überschriften und Listen aus Dateien oder eingefügtem Text lesen und die Gliederung als Markdown speichern. Beim Import in eine bestehende Karte entsteht ein neuer Ast. Der Markdown-Austausch beschreibt den Themenbaum. Farben, Positionen und Querverbindungen stehen im RED ION-Block. Eine Mermaid-Laufzeit und ein neuer Wissensgraph sind offen. |
| Univer, HyperFormula, SheetJS | Der RED ION-Tabellenkern hat bereits Zellformeln, Bezüge zwischen Blättern und Excel-, ODS- sowie CSV-Austausch. Die neue Fehlerliste rechnet die Arbeitsmappe und springt aus der Liste direkt zur betroffenen Zelle. Excel-Vollkompatibilität und weitere Dateiformate bleiben offen. |
| ts-fsrs | RED ION besitzt SM-2 und FSRS 4.5. Beim Aufdecken der Antwort zeigt es die erwarteten Wiederholungsintervalle. Erst das Bewerten speichert einen Termin und den Verlauf. Die Bibliothek ts-fsrs wird hier nicht gebündelt. |
| tldraw, diagrams.net, Excalidraw, Fabric.js | Zeichenfläche, Formen, Verbindungen und Bildimport sind bereits in RED ION vorhanden. Ein Austausch mit den Originalformaten dieser Werkzeuge bleibt offen. |
| Tiptap, Lexical, Editor.js, BlockNote, Monaco Editor | RED ION verwendet seine eigenen Notizblöcke und seinen Markdown-Austausch. Eine zusätzliche Editor-Laufzeit ist offen. |
| pdf-lib, pdfme, perfect-freehand | RED ION besitzt einen lokalen PDF- und Freihandmodus. PDF-Formularvorlagen und zusätzliche Bearbeitungsvorgänge sind offen. |
| EPUB.js, FullCalendar, PptxGenJS | Kalender und Folien sind RED ION-Bereiche. Ein zusätzlicher EPUB-Reader und die Übernahme der externen Kalender- oder Präsentations-Laufzeiten sind offen. |
| Yjs, Automerge, Dexie, RxDB, sql.js, PGlite | RED ION hält seine Daten in eigener lokaler Ablage mit optionalem Abgleich. Weitere Synchronisations- oder Speicher-Engines sind offen. |
| MCP Inspector, Ollama, WebLLM | Die vorhandenen MCP- und lokalen KI-Wege sind der Ausgangspunkt. Eine neue Inspector-Integration ist offen. |

Die technischen Vorbilder für die umgesetzten Änderungen sind [Markmap](https://markmap.js.org/docs/guide/writing), [AntV X6](https://github.com/antvis/X6) und [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). Die Änderung verwendet keinen neuen Fremdcode und fügt keine Laufzeitabhängigkeiten hinzu.

Die Schaltplanmeldungen prüfen die Zeichnungsstruktur. Eine elektrische Sicherheitsabnahme ist ein eigener Arbeitsschritt.
