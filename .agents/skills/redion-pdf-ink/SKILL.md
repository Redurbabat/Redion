---
name: redion-pdf-ink
description: PDF-Dokumentmodus, Zeichnen, Stift, Export und Seitenwechsel pruefen.
---

# redion-pdf-ink

## Wann verwenden

PDF-Dokumentmodus, Zeichnen, Stift, Export und Seitenwechsel pruefen.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: src/bereiche/pdf/, doku/WORKSPACE-2-DOKUMENTKOMPASS.md, doku/IOS-*.md.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Keine Aenderung an Strichkoordinaten oder Export ohne Roundtrip-Test; iOS-Bridge und Webdateien muessen denselben Commit abbilden.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

workspace-document.mts, native-build-parity.mts, relevante PDF-Regressionen. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
