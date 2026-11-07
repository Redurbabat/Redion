---
name: redion-component-smith
description: Wiederverwendbare TypeScript/CSS-Komponenten und React-Inseln entwerfen.
---

# redion-component-smith

## Wann verwenden

Wiederverwendbare TypeScript/CSS-Komponenten und React-Inseln entwerfen.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: src/schale/, src/islands/, quell/schale/stil/, doku/UI-KOMPONENTEN.md.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Vorhandene Komponenten und Design-Tokens wiederverwenden; keine zweite Designsystem-Schicht; Touch-Ziele, Fokus, Dark Mode und Kontrast pruefen.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

npm run typecheck, npm run bauen:ts, workspace-editor.mts. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
