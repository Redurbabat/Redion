---
name: redion-editor
description: Notizseiten, Bloecke, Tastatur, Verlauf und Seitenwerkzeuge stabil verbessern.
---

# redion-editor

## Wann verwenden

Notizseiten, Bloecke, Tastatur, Verlauf und Seitenwerkzeuge stabil verbessern.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: src/bereiche/editor/, src/bereiche/bloecke/, src/schale/aufbau/kopfleiste.ts.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Block-IDs und gespeicherte Datenfelder nicht unbeabsichtigt aendern; kein zweiter Undo-Stack; Werkzeuge sichtbar und per Tastatur erreichbar halten.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

workspace-editor.mts, relevante pruefungen/lauf/test*.mts. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
