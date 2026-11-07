---
name: redion-release
description: Sichere Web-, Windows- und iOS-Releases vorbereiten.
---

# redion-release

## Wann verwenden

Sichere Web-, Windows- und iOS-Releases vorbereiten.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und aktuellen Code unter: codemagic.yaml, .github/workflows/, version.md, version.json, doku/IOS-*.md.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Keine Deployment- oder Merge-Aktion ohne Freigabe; gleiche App-ID und Signatur; Backup vor iPhone-Update; Versionen nur nach Release-Regeln aendern.
4. Nur eigenen Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

Buildartefakte, Signierung, Installation, Daten- und Offline-Roundtrip. Befehle im aktuellen Projekt verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
