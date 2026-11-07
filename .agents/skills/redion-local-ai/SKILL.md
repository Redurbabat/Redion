---
name: redion-local-ai
description: KI-Funktionen datenschutzbewusst in die bestehende Redion-Oberflaeche integrieren.
---

# redion-local-ai

## Wann verwenden

KI-Funktionen datenschutzbewusst in die bestehende Redion-Oberflaeche integrieren.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: src/bereiche/ki/, src/bereiche/verbinden/, doku/ARCHITEKTUR.md.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Keine ungefragte Uebertragung von Nutzerdokumenten; ausdrueckliche Einwilligung und klarer Providerstatus; keine erfundenen Ergebnisse.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

KI-UI-Tests, Berechtigungs- und Offlinefaelle. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
