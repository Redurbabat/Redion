---
name: redion-sync-security
description: Optionale Synchronisierung, Cloudflare, Berechtigungen und Sicherheitsgrenzen pruefen.
---

# redion-sync-security

## Wann verwenden

Optionale Synchronisierung, Cloudflare, Berechtigungen und Sicherheitsgrenzen pruefen.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: server/, functions/, worker.ts, CLOUDFLARE.md, doku/SYNC-*.md.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Local-first bleibt Standard; keine geheimen Schluessel in Git; Authentifizierung und Rechte serverseitig pruefen; offline ohne Cloud nutzbar halten.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

Server- und Rechtepruefungen, Offline-/Konfliktfaelle. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
