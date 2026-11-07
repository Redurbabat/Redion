# Creative Interaction Lab

## Zweck

Das UI-Kit besteht aus drei nebeneinander existierenden Bereichen:

1. **Components**: typbasierter Katalog unter der Startseite.
2. **Touch Kit**: portables React-Kit unter `#/touch`; enthält weiterhin dieselben 21 Live-Previews und den daneben kopierbaren Originalcode.
3. **Experiments**: Astra (`#/astra`) und das Creative Interaction Lab (`#/creative`).

Die Experimente sind **keine** freigegebenen Produktkomponenten. Jedes Experiment ist ausdrücklich eine Studie und wird vor Übernahme im Zielkontext geprüft.

## 11 neue Studien

| Experiment | Zustand und Bedienung |
| --- | --- |
| Gravity Card | Karte ziehen, Pfeiltasten zum Auslenken, Reset |
| Liquid Metal | Zeigerlicht und Formumschaltung |
| Morph Command | Tastaturbedienbares Menü mit Fokus-Rückgabe und Escape |
| Crystal Prism | Brechung per Range-Eingabe |
| Origami Navigation | Dreiteilige Navigation mit aktivem Zustand |
| Orbit Dashboard | Start/Pause und einstellbare Umlaufgeschwindigkeit |
| Kinetic Typography | Text und Tiefe ändern, Perspektive mit Zeiger |
| Reaction Matrix | Sechs umschaltbare Reaktionsfelder mit Status |
| Energy Core | Energie laden/entladen |
| Holo Chart | Drei unabhängig einstellbare Datenbalken |
| Signal Circuit | Drei Schaltkreise mit gemeinsamem Status |

## Source of truth und Copy-Code

`app/src/custom/creativeSeedDesigns.ts` enthält HTML, CSS und JavaScript der elf Studien. Dieselben Strings werden von `CustomPreview` im sandboxed iframe ausgeführt und im `CustomDesignDetail` als Code angezeigt. Dadurch unterscheiden sich Vorschau und Copy-Code nicht.

Die Studien verwenden keine externen Ressourcen, keine Accounts und kein Backend. Die HTML/JS-Previews laufen in einem iframe ohne `allow-same-origin`. Lokale Nutzerentwürfe liegen weiterhin im Browser und gehen beim Löschen des Browserspeichers verloren.

## Qualität

- Native Buttons/Inputs und sichtbare Statusmeldungen wo nötig; nur das physische Drag-Experiment ergänzt Pointer-Capture und Pfeiltasten.
- Komponenten sind von einer `.ui-creative-`-Klasse begrenzt.
- Animationen sind zustandsbezogen und unterstützen `prefers-reduced-motion`.
- `npm run build` und `npm run test:unit` bleiben der technische Ausgangspunkt.
- `npm run test:smoke` öffnet Katalog, Touch Kit und das Creative Lab via Playwright.

### Vor Production weiterhin erforderlich

- Reale Touch-Tests auf iOS und Android, Screenreader-Tests, Kontrastmessung bei jeder Materialvariante.
- Performance-Messung auf Low-End-Geräten, auch bei gleichzeitig sichtbaren Previews.
- Dokumentierte Review- und Freigabeentscheidung vor der Einstufung als `stable`.
- Import/Export für *lokal* gespeicherte Nutzerentwürfe (ein Link zu einem lokalen Design ist nicht über andere Browser teilbar).
- Die alten Core-Komponenten haben historisch getrennte Snippet-Strings. Die Touch- und Creative-Previews haben dagegen eine gemeinsame Quelle. Vor der Stable-Freigabe die Core-Snippets ebenso angleichen.

## Branch-Strategie

Diese Änderungen bauen auf dem offenen Astra-PR #8 auf. Den Ausgangs-PR erst nach Build-/Test-/Browserprüfung mergen; anschließend diesen Branch neu basieren oder per gestapeltem PR integrieren.
