# Redion – Plattformstrategie macOS, Windows und iPhone

Stand 2026-11-07. Ziel: eine Redion-Arbeitsflaeche mit **eigenstaendigen Desktop-Apps fuer Windows und macOS sowie einer iPhone-App**, ohne die lokale Datenhoheit aufzugeben.

## Bestand, nicht Vermutung

- **Windows:** `windows/` enthaelt einen Electron-Desktop-Shell-Ansatz, Dateizugriffe, Offline- und Updatepruefungen. Keine Aussage ueber installierte oder signierte Version ohne Test.
- **iPhone:** `ios/`, `capacitor.config.json` und `codemagic.yaml` enthalten Capacitor-/Swift-Native-Integration, Share- und Dokumentfunktionen. Eine signierte IPA und echter iPhone-Test sind hier NICHT GETESTET.
- **macOS:** Die vorhandene Electron-Shell hat auf diesem Review-Branch jetzt `windows/package.json` mit getrenntem Mac-Bundle-ID, DMG/ZIP-Targets und macOS-Fensterverhalten. Das ist **noch kein nachgewiesener funktionierender oder signierter Mac-Release**; ein `macos/`-Swift-Projekt ist nicht erforderlich. Mac- und Windows-Apps sind verschiedene Plattformen; eine Windows-EXE laeuft nicht nativ auf macOS.
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

- [x] Eigenes macOS-Target (Apple Silicon DMG/ZIP), eigene Bundle-ID und manuellen CI-Vorschauworkflow auf Review-Branch anlegen.
- [x] Bestehende Desktop-Dateibruecke um macOS-Finder-`open-file` und native Menues ergaenzen, ohne Windows-Funktion oder Datenverzeichnis zu aendern.
- [ ] `npm --prefix windows run test:mac` ausfuehren und auf Mac-Runner einen echten DMG-/ZIP-Build erstellen (aktuell NICHT GETESTET).
- [ ] Mac-App unter macOS ausfuehren, Finder-Import, Offlinebetrieb und Daten-Roundtrip nachweisen.
- [ ] Signierung/Notarisierung ueber einen gesonderten und genehmigten Releaseprozess planen; der neue Workflow signiert nicht und publiziert nicht.
- [ ] Windows- und iPhone-Builds anhand aktueller Commits verifizieren.
- [ ] Gemeinsame Dateizugriffs- und Backup-Kontrakte testen.
- [ ] Mac-Paketierung in eigenem Folgebranch implementieren; keine Aenderung an main ohne Freigabe.

## Umsetzungsstand auf Review-Branch (7. November 2026)

- Branch: `chatgpt/redion-workspace-skills-audit-20261107`.
- `windows/main.cjs`: macOS-Anwendungsmenue, Fenster-offenlassen ohne Hauptfenster, Finder-Dateien bis `did-finish-load` zwischenspeichern. Windows-spezifische NSIS-Updatepruefung bleibt unveraendert und nur unter `win32` aktiv.
- `windows/package.json`: Mac-Bundle-ID `ch.redurbabat.redion.macos`, DMG+ZIP fuer `arm64`, separater Ausgabeordner, `--publish never`, Dateizuordnungen fuer `.redion` und PDF (als alternative PDF-App).
- `.github/workflows/macos-app.yml`: **ausschliesslich manuell** startbare unsignierte Vorschau, kein Deployment.
- `windows/macos-desktop.test.cjs`: Quelltext-/Konfigurationsvertraege fuer Build, Dateiimport, Menues und Updates.
- **Nachweis:** GitHub-Inhalte gespeichert und geprueft; JavaScript-Syntaxpruefung der geaenderten CJS-Dateien bestanden. Kein Testlauf mit Node, keine Electron-Ausfuehrung, kein macOS-Build, kein iPhone-/Windows-Geraetetest.

**Nicht verwechseln:** Ein vorbereiteter DMG-Befehl erzeugt noch keine gebaute Mac-App. Ein unsignierter Download ist keine veroeffentlichte Mac-App.
