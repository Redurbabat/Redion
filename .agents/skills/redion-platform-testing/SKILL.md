---
name: redion-platform-testing
description: Regressionen, Browserpruefungen und echte Geraeteabnahmen koordinieren.
---

# redion-platform-testing

## Wann verwenden

Regressionen, Browserpruefungen und echte Geraeteabnahmen koordinieren.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und aktuellen Code unter: pruefungen/, .github/workflows/, codemagic.yaml, ios/, windows/.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Syntax, Typpruefung, Browser, WebKit, Simulator, echtes iPhone, signierte IPA und Windows-Build getrennt ausweisen.
4. Nur eigenen Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

npm run typecheck, npm run bauen:ts, npm run stand, node bauen.mts, betroffene Pruefungen. Befehle im aktuellen Projekt verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
