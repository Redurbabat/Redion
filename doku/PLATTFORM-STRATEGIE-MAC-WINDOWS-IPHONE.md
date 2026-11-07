# Redion – Plattformstrategie macOS, Windows und iPhone

Stand 2026-11-07. Ziel: eine Redion-Arbeitsflaeche mit **eigenstaendigen Desktop-Apps fuer Windows und macOS sowie einer iPhone-App**, ohne die lokale Datenhoheit aufzugeben.

## Bestand, nicht Vermutung

- **Windows:** `windows/` enthaelt einen Electron-Desktop-Shell-Ansatz, Dateizugriffe, Offline- und Updatepruefungen. Keine Aussage ueber installierte oder signierte Version ohne Test.
- **iPhone:** `ios/`, `capacitor.config.json` und `codemagic.yaml` enthalten Capacitor-/Swift-Native-Integration, Share- und Dokumentfunktionen. Eine signierte IPA und echter iPhone-Test sind hier NICHT GETESTET.
- **macOS:** Kein eigenstaendiges `macos/`-Projekt im aktuellen Root-Bestand gefunden. Ein Mac-Release ist **nicht nachgewiesen**. Mac- und Windows-Apps sind verschiedene Plattformen; eine Windows-EXE laeuft nicht nativ auf macOS.
- **Web:** Gemeinsame TypeScript-/CSS-Produktlogik bleibt der Ausgangspunkt; nicht fuer jede Plattform eine zweite Redion-Datenlogik schreiben.

## Zielarchitektur

1. Gemeinsamer Kern: Redion Web/TypeScript, lokale Daten und Exportformat, bestehende Tests.
2. Windows: vorhandene Electron-Shell absichern und wiederverwenden.
3. macOS: zuerst Machbarkeitspruefung, ob vorhandene Electron-Shell plattformneutral erweitert werden kann; danach Mac-Paketierung, Entitlements, Notarisierung und Dateizugriffe. Keine native SwiftUI-Komplettneuentwicklung ohne ausdrueckliche Entscheidung.
4. iPhone: bestehende Capacitor-/Swift-Bridge erhalten, Navigation und Gesten fuer iOS pruefen, kein zweites Datenmodell.
5. Plattform-Adapter: Oeffnen/Sichern/Teilen, Druck, Fenster, Deep Links, Offline und Updates jeweils ueber bestehende Bridges.

## Abnahmekriterien

- Alle drei Apps koennen ohne Konto und ohne Netz starten, Dokumente erstellen und lokal bearbeiten.
- Ein `.redion`-Archiv laesst sich auf allen drei Plattformen exportieren und verlustfrei importieren; mit synthetischen Testdaten pruefen.
- Windows: signiertes Installationspaket, Start, Updates, Offline und Dateidialoge.
- macOS: signierte und notarisiert getestete App, Fenster, Tastatur, Dateidialoge und Updates.
- iPhone: signierte IPA, Installation auf echtem Geraet, Safe Areas, Stift/Touch, Teilen, Import/Export und Wiederaufnahme.
- Jede Plattform mit reproduzierbarem Build-/Testprotokoll und getrenntem Status; **NICHT GETESTET** bis wirklich ausgefuehrt.

## Naechste Schritte

- [ ] Mac-Target und macOS-CI separat planen; Architekturentscheidung Electron-Wiederverwendung vs. andere native Shell dokumentieren.
- [ ] Windows- und iPhone-Builds anhand aktueller Commits verifizieren.
- [ ] Gemeinsame Dateizugriffs- und Backup-Kontrakte testen.
- [ ] Mac-Paketierung in eigenem Folgebranch implementieren; keine Aenderung an main ohne Freigabe.
