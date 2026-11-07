---
name: redion-workspace-architect
description: Arbeitsbereiche, Bibliothek, Desktop- und Mobilnavigation konsistent gestalten.
---

# redion-workspace-architect

## Wann verwenden

Arbeitsbereiche, Bibliothek, Desktop- und Mobilnavigation konsistent gestalten.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: src/schale/aufbau/, src/register/, doku/WORKSPACE-2-*.md.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Navigation aus Registern ableiten; keine zweite Router- oder Dock-Implementierung; bestehende Fuenf-Wege-Leiste und Hochziehgeste erhalten.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

workspace-library.mts, workspace-mobile-nav.mts, test614. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
