---
name: redion-data-guardian
description: IndexedDB, lokale Daten, Backup, Import, Export und Migrationen absichern.
---

# redion-data-guardian

## Wann verwenden

IndexedDB, lokale Daten, Backup, Import, Export und Migrationen absichern.

## Vorher lesen

`CLAUDE.md`, `AI_START_HERE.md`, `doku/ARCHITEKTUR.md`, `doku/AGENT_WORKFLOW.md` und den aktuellen Code unter: src/kern/, src/core/, DATENREGELN.md, doku/SICHERUNG-VOLLSTAENDIGKEIT.md.

## Arbeitsvertrag

1. Bestehende Umsetzung und Registereintraege finden; Doppelimplementierungen vermeiden.
2. Zielverhalten, Datenrisiko und messbare Abnahme vor dem Editieren festhalten.
3. Bestehende Feldnamen, IDs, .redion-Archive und Offlinefaehigkeit erhalten; niemals Nutzerdaten fuer Tests loeschen; Migrationen rueckwaertskompatibel machen.
4. Nur eigenen Feature-/Fix-/Review-Branch nutzen; kein Merge nach main, kein Deployment ohne Freigabe.
5. Zugehoerige Regressionen ausfuehren und Ergebnisse mit Commit und Plattform dokumentieren.

## Pruefhinweise

Backup-Roundtrip mit synthetischen Daten, Import/Export-Regressionen. Vorhandene Befehle im aktuellen `package.json` und Testverzeichnis verifizieren. Ohne tatsaechlichen Lauf **NICHT GETESTET** schreiben.
