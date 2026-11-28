# RED Studio Desktop

Refs #260. Separate branch from main at 72e4e885. Home Server #258 stays independent.

## Phase 1
- The shared GfxToolbar still dispatches the existing tool IDs and callbacks. Desktop (>=1024px, fine pointer/hover) reveals a newly activated hidden gallery card without executing a duplicate command. Existing manual gallery navigation, selection, undo and document storage remain intact.
- Desktop-only captions use the existing accessible command name. No touch target reduction; phone layout stays unchanged.
- Desktop electrical workspace receives clearer panel boundaries, a wider parts library/properties panel, numeric status bar and simulation lab separation. Electrical drawing tooltips include existing numeric shortcuts. No change to simulation algorithms.
- PDF desk, thumbnails and inspector separation; selected page has a distinct outline, wider desktop tool gallery. No original PDF content is changed.

## Still open
Actual Windows/Electron and mobile visual regression, full-width layout and resizable simultaneous library/properties, simulator reliability and measurements, PDF editing/OCR, Whiteboard layers, split view, multi-monitor and MCP action coverage. Keep all work on the feature branch; no release or merge before review.

## macOS-inspiriertes Windows-Design

Windows-only über das vorhandene `data-windows-titelleiste`, ab 1024 px mit Maus/Trackpad, kein Eingriff in native Fensterknöpfe oder Overlay-Geometrie. Ruhige Materialien aus Theme-Tokens, kompakte Rahmen, grössere gemeinsame Galerie, transparente Zusatzkapseln wenn das System es erlaubt; deckende Alternative und bestehender Hochkontrast bleiben erhalten. Elektro zeigt Arbeitsmodus und direkt zugänglichen Inspektor, Schalten/Skizzieren erhalten wahrheitsgemässe gedrückt-Zustände. Kein simulierter OS-Chrome und keine neue Berechnungslogik. Desktop-/Mobile-Abnahme und EXE noch offen.

## Desktop panel sizing

Windows-only wide plan container (>=850px), fine pointer and >=1024px window. Existing palette/inspector become in-flow columns; drag the divider or use arrows, Shift+arrows, Home/End; double-click resets. Width is view-only, bounded 180–380 px and additionally limited by container width. Narrow/phone and focus modes retain existing layout. No electrical model mutation. Browser and native tests pending.

## Gleichzeitige Desktop-Bauteilbibliothek und Inspektor

Windows, feiner Zeiger, breite Planfläche ab 1180 px: Bibliothek links und Inspektor rechts können gleichzeitig geöffnet werden. Gemeinsame Panel-Logik für Kopf, Kontextmenü und Tastatur. Bei kleinerem Fenster/Fokusmodus schliesst die Bibliothek, der Inspektor bleibt. Bei zwei Spalten jeweils maximal 28 % der Breite; bestehende Zieh-/Tastatur-Griffe bleiben. Ansichtsstatus verändert keine gespeicherten Pläne. Test625 erweitert für beide Panels, Überdeckung, Resize-Tastatur, schmalen Rückfall und Modell-Unverändertheit. Abnahme noch offen.

## PDF-Seitennavigator

Windows-Desktop: Seitenübersicht filtern nach Dokumentposition (auch #3), vorhandener Seitenbeschriftung oder Lesezeichen. Enter springt zum ersten Treffer, Escape/Alle setzt zurück. Keine OCR-Suche; bestehende Volltextsuche bleibt unverändert. Drag-Reihenfolge während Filter gesperrt, Seitennummern und gespeicherte Inhalte bleiben unverändert. Miniatur-Lader verwendet pro Panel nur einen Scroll-Handler und überspringt versteckte Bilder. Test285 ergänzt; CI offen.

## Elektro-Messwertinspektor und Taster

Windows-Desktop: ausklappbare, auf 64 Bauteile begrenzte Tabelle der tatsächlich berechneten U/I/P-Modellwerte; fehlende/nicht endliche Werte als Strich, Fehlertext ohne erfundene Messwerte. Aktualisiert auch bei Zeitrelais, unveränderte Anzeige wird nicht neu gebaut. Beim Ausschalten leeren. Taster lösen bei passendem Pointerup/-cancel, Fensterblur, verstecktem Dokument und Stop/Reset; keine neuen gespeicherten Zustände. Test630 erweitert mit realer Zeitrelais-/Tasterfolge und Messwertanzeige. CI/Windows-Abnahme offen.

## Whiteboard Desktop

Direkte Kommandoleiste mit vorhandenen Ebenen-/Rahmen-/Import-Export-Inspektoren, Objekt- und Auswahlanzahl, Zoom auf Auswahl. Windows-Tasten V/H/P/E/R/O/T, 0 (alles), 1 (Auswahl); nur bei Fokus der Zeichenfläche, ohne laufende Geste, nicht in Textfeldern. Kein neues Objektmodell; Auswahlzoom speichert nur Ansicht. Test572 erweitert. Zusätzlich Messwert-Tupel typisiert (TS2322 aus CI 46138138969). Native Abnahme ausstehend.
