# AFFiNE Agent 2 – Zeichenfläche und Dock (Entwurf)

Basis: `a117f67b935b3fe37c7fc677140a9898481ecc03` (PR #232). Der PR-Kopf war bei Beginn 29 Commits weiter; keine Änderung der Basis. Nur erlaubte Pfade. Keine Migration, kein Zugriff auf Store, keine Änderungen an PDF-Markierungen, Schaltplan-Symbolen oder nativer Navigation.

## Untersuchung und Lizenz
AFFiNE: [gfx](https://github.com/toeverything/AFFiNE/tree/canary/blocksuite/affine/gfx), [Lizenz](https://github.com/toeverything/AFFiNE/blob/canary/LICENSE). Die Paketverzeichnisse und package.json der elf gfx-Pakete brush, connector, group, link, mindmap, note, pointer, shape, template, text, turbo-renderer sowie edgeless-toolbar und edgeless-zoom-toolbar wurden geprüft. Alle 13 Manifeste deklarieren MIT. Abhängigkeiten u.a. BlockSuite std/store/model/surface, Lit, signals, Yjs, lodash-es und RxJS; keine isolierte 1:1-Kopie. Kein AFFiNE-Quellcode oder Fremdasset übernommen; keine Abhängigkeit eingebaut. Tiefe Quellcode-/Transitivlizenzprüfung vor einem späteren Import erforderlich. Eigenentwicklung orientiert sich an der gewünschten Funktionsliste, nicht am AFFiNE-Renderer.

## Schnittstelle
`CanvasAdapter({host, documentId, initial?, settings?, theme?, onCommand?, onChange?, onSettings?, onError?})`: Host mit definierter Höhe. `updateSettings({tool,color,width,opacity,...})`, `setTheme`, `command`, `serialize`, `import`, `exportJSON`, `exportPNG`, `dispose`. onChange erhält eine Kopie nach abgeschlossener Änderung; onSettings ermöglicht Host-Persistenz ohne neuen Store. initial/import verlangen Version 1 und dieselbe Dokument-ID. JSON ist ein neues, getrenntes Format, kein PDF-/Elektro-Migrationsformat. PNG exportiert den aktuellen sichtbaren Ausschnitt. Begrenzte Objekte, Punkte, Bilddaten und Historie; keine fremden URLs oder SVG. Pointer-Listener über AbortController, ResizeObserver und rAF werden beim dispose entfernt. Kein globaler Listener.
`DrawingDock` akzeptiert auch einen `DrawingDockHost` ohne eigenes Zeichenmodell. `mountExistingDock` kapselt capability-basierte Befehle, Bearbeitungsberechtigung und Rückruf in bestehende PDF-/Elektro-Hosts. Die Host-Anbindung muss die vorhandenen Rechte, Einheiten und Speicheroperationen weiter erzwingen. Das ist eine Schnittstelle, keine fertig eingehängte Produktfunktion.

## Funktionsmatrix (implementiert im isolierten Prototyp, nicht als ausgelieferte App)
| Funktion | Stand |
|---|---|
| Zeichenfläche, Hand, Zoom, Raster, Rasterfang | Code vorhanden; Pan/Zoom, begrenzter Koordinatenbereich |
| Stift, Marker, Radierer | Druck beim Stift; Objektradierer, kein Teilradierer |
| Auswahl, Lasso, Verschieben | Code vorhanden; Lasso nach Objektmittelpunkt |
| Linie, Pfeil, Rechteck, Kreis, Ellipse, Freihandform | Code vorhanden |
| Text, Haftnotiz, Bild | Einfache Texte; lokale PNG/JPEG/WebP; keine Rich-Text- oder Anhangintegration |
| Verbinder, Mindmap | Einfache Verbindung an Objektmittelpunkte und manuelle Knoten; kein Routing, keine automatische Baumstruktur |
| Gruppen, Ebenen | Gruppen und Z-Reihenfolge; kein Ebenenpanel/Sichtbarkeit |
| Skalieren, Drehen | Schrittbefehle; keine Transformationsgriffe |
| Undo/Redo, Kopieren/Einfügen | Lokale Historie/Clipboard, kein Systemclipboard |
| Import/Export | API: JSON und sichtbarer PNG-Ausschnitt; keine Dateidialoge, keine AFFiNE-Formate |
| Dock | horizontal/vertikal, verschiebbar, minimierbar, Farben/Breite/Deckkraft, Raster/Zoom, lokale Host-Settings |
| Touch, Stift, Tastatur, Dunkel | Pointer Events, 44px-Knöpfe, keine Animation; kein Pinch-Zoom, keine Palm-Rejection; Hochkontrast nicht gesondert validiert |
| PDF, Elektro | Host-Port vorbereitet, bestehende Produktdateien unangetastet; keine tatsächliche Integration, keine PDF-Annotation-Konvertierung |
| AFFiNE Template, Links, Turbo-Renderer, Multiplayer | Nicht übernommen |

## Tests
`node --test pruefungen/affine/agent-2-canvas/canvas.test.mts` nach npm ci und playwright Chromium-Installation. Test enthält isolierte strenge Typprüfung, Modell-Roundtrip, Undo/Redo, Gruppen, Koordinaten, synthetische Pointer-/Touch-Tests in Desktop- und mobilen Chromium-Viewports sowie Host-Vertragsprüfung mit Testdaten. Diese Tests sind geschrieben, noch NICHT ausgeführt. Host-Test ist keine echte PDF-/Elektro-Regression. Ausführen zusätzlich: `node --test pruefungen/windows-ink-model.mts`, `node pruefungen/workspace-document.mts`, relevante Schaltplan- und PDF-Prüfungen. Kein echter iPhone-Test, keine IPA, kein Deployment.
## Gesperrte Integrationsschritte
- Der bestehende Build (`tsconfig.bauen.json`) nimmt src/integrationen nicht auf und liefert klassische Skripte unter quell/ aus. Die neuen Module benötigen eine abgestimmte Bundling-/Ladestrategie (file:// und Einzeldatei). Kein Änderung an Build, index.html, Service Worker, quell/, Shell, Registrierungen oder gemeinsamen Tests.
- Einhängen in bestehende Whiteboard-Blockansicht sowie PDF-Zeichenbar/Elektro-Schaltplansteuerung erst nach Koordination. PDF: Marken/Zeichenziel und existierende PDF-Punktkoordinaten beibehalten. Elektro: Schaltplan.alsSvg, Anschlüsse, Raster, Schutzleiter und bestehende Ink-Daten beibehalten.
- Testregistrierung, visuelle Abnahme, echter iPhone/Windows-Test, Graphify-Aktualisierung und erzeugte Dateien sind offen; entsprechende Pfade sind gesperrt. Die Graphify-Referenz war bereits veraltet.
- GitHub-API statt lokalem Worktree: kein lokaler Checkout, keine lokale Befehlsausführung im Repository. Branch/Commit aus exakt verifiziertem Git-Objekt.
