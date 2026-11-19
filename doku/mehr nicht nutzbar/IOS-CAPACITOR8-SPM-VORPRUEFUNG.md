# Redion iPhone: Capacitor-8-SPM-Vorprüfung vor nativer Installation

**Datum:** 25. Oktober 2026. Fortsetzung nach dem von dir gemergten PR #155.

## Ausgangslage

Der gemeldete Codemagic-Fehler in Schritt 6 war eine falsche
Storyboard-Validierung: Capacitor 8 liefert
`<imageView key="view" image="Splash">`, während Redion nur
`<view key="view">` akzeptierte. PR #155 behebt dies bereits auf
`main`. Ein vollständiger `ibtool`-/`xcodebuild`-Erfolg ist
damit **nicht** nachgewiesen.

## Neue Prüfungen

`ios/preflight-native-templates.mjs` wird direkt nach
`npx cap add ios --packagemanager SPM` und `npx cap sync ios`
ausgeführt. Es prüft **lesend**, noch vor Datenschutzschirm,
Startbildschirm und Home-Screen-Schnellaktionen:

- Die App-ID bleibt `ch.redurbabat.redion`, das native Ziel bleibt
  `build/ios-capacitor`.
- Ein tatsächlich vorhandenes `LaunchScreen.storyboard` mit
  zulässiger Capacitor-8-Ursprungsstruktur.
- Die vorhandene und zum Swift-Injektor passende
  `AppDelegate.swift` sowie `SceneDelegate.swift`.
- `Info.plist` und `Assets.xcassets` als erwartete Xcode-Bestandteile.
- Die Einfügefunktionen für Datenschutzschirm und Kurzbefehle
  werden **nur im Speicher** auf die Rohvorlagen angewandt:
  Dateien werden nicht verändert.

Für den neuen Node-Test
`ios/capacitor8-spm-native-integration.test.mjs` liegen
versionskontrollierte Vorlagen von Capacitors SPM-Generator vor:
`ios/fixtures/capacitor8-spm-appdelegate.swift` und
`ios/fixtures/capacitor8-spm-scenedelegate.swift` stammen beide
aus der aktuellen offiziellen SPM-UIScene-Vorlage von Capacitor.
Die bereits bestehende echte Capacitor-8-SPM-Storyboard-Fixture
von Version 8.0.0 wird wiederverwendet (der gültige
`imageView`-Wurzeltyp ist in aktuellen Vorlagen unverändert).
Eine zusätzliche Prüfung stellt sicher, dass
`AppDelegate` die tatsächlich verwendete `SceneDelegate`-Klasse
verdrahtet, damit Appsymbol-Schnellaktionen nicht in einer
ungenutzten Swift-Datei landen.

**Wichtig:** Frühere 8.x-Vorlagen können keine `SceneDelegate.swift`
enthalten. Ist die für Redions Schnellaktionen benötigte
UIScene-Struktur nicht vorhanden, wird dies nun mit genauer Datei-
bezeichnung am Ende der Capacitor-Erzeugung gemeldet – **bevor**
ein Swift- oder Storyboard-Patch ausgeführt wird.

## Diagnose nach dem Startbildschirm-Schritt

`xcrun ibtool` läuft weiterhin mit
`set -euo pipefail`: echte Fehler bleiben Buildfehler.
Stdout/Stderr werden gleichzeitig nach
`$CM_BUILD_DIR/build/ios-ibtool.log` geschrieben. Codemagic
nimmt diese Protokolldatei nun als `build/ios-ibtool.log`
in die Artefakte auf, sodass ein weiterer Storyboard-Compilerfehler
nachvollziehbar ist. **Kein** Compilerfehler wird verschluckt,
`xcodebuild` wird nicht übersprungen.

## Abnahme

```sh
node --test ios/capacitor8-spm-native-integration.test.mjs
node --test ios/install-launch-screen.test.mjs
node --test ios/home-shortcuts.test.mjs
node --test ios/install-privacy-shield.test.mjs
```

Im generierten Xcode-Projekt (nach `cap sync ios`) zusätzlich:

```sh
node ios/preflight-native-templates.mjs
```

Die Xcode-/Codemagic-Prüfung selbst muss auf dem macOS-Runner
stattfinden; nicht aus Node-Mocks auf Erfolg schließen.

Die Web-App, PWA, IndexedDB, Notizen, Anhänge und Backups
sowie App-ID, Swift-Quellen und Hochzieh-TabShelf werden durch diese
Vorprüfung nicht verändert. Bestehende iPhone-App nicht
deinstallieren. Ein erfolgreicher unsignierter Build allein ersetzt
keine Geräteabnahme.
