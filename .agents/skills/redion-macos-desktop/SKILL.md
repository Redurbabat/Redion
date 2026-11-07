---
name: redion-macos-desktop
description: Plant und prueft eine eigenstaendige macOS-Desktop-App fuer Redion unter Wiederverwendung des bestehenden Web-Kerns.
---

# redion-macos-desktop

Vor jeder Arbeit `CLAUDE.md`, `AI_START_HERE.md`, `doku/PLATTFORM-STRATEGIE-MAC-WINDOWS-IPHONE.md`, `windows/` und `doku/ARCHITEKTUR.md` lesen.

1. Bestehenden Electron-/Web-Desktop-Code und macOS-Kompatibilitaet untersuchen; keinen vorhandenen Mac-Build behaupten.
2. Ziel: echte macOS-App mit Dock, Fenstern, Tastatur, nativen Dateidialogen, lokalem Backup und Offline-Betrieb.
3. Signierung, Notarisierung, Entitlements, Apple-Silicon/Intel-Ziele und Updates separat planen und pruefen.
4. Datenmodell und `.redion`-Format mit Windows und iPhone kompatibel halten. Keine unnoetige SwiftUI-Neuschreibung.
5. Ein eigener Branch je Implementierungsbogen, keine Commits oder Merges nach main ohne Freigabe.
6. Ohne macOS-Build und reale Installation Status **NICHT GETESTET**.
