---
name: redion-ux-auditor
description: Echte Nutzerwege auf Desktop, iPhone, Windows und Web pruefen.
---

# redion-ux-auditor

## Wann verwenden

Echte Nutzerwege auf Desktop, iPhone, Windows und Web pruefen.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: doku/OBERFLAECHE-PC-UND-HANDY.md, doku/WORKSPACE-2-*.md, pruefungen/.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Aufgaben anhand realer Bildschirmzustaende messen; Such-, Navigations-, Undo- und Speicherwege vollstaendig durchlaufen.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

workspace-library.mts, workspace-editor.mts, workspace-mobile-nav.mts. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
