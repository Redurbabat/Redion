# Redion iPhone – nativer App-Startbildschirm (Workspace iOS)

**Stand:** 24. Oktober 2026. Nur Capacitor-/UIKit-Build, nicht die Web-App.

## Was auf dem iPhone sichtbar besser wird

Wenn man Redion am iPhone startet, zeigt iOS zunächst einen
**nativen, zentrierten Redion-Startbildschirm** statt einer
generischen weißen oder fremden Capacitor-Fläche:

- Redions **eigenes App-Symbol**, aus bereits vorhandenen
  `oeffentlich/icons/icon-{96,192,384}.png`-Dateien.
  Die drei Bilder werden in echten 1x-/2x-/3x-iOS-Asset-Katalogeinträgen
  verwendet – keine neue Bildquelle, keine fremden Marken.
- Darunter der Name **Redion** in einer nativen UIKit-Systemschrift.
- Hintergrund und Schrift wechseln **automatisch mit der iOS-System-
  Hell-/Dunkel-Einstellung**, noch bevor ein WebView geladen wurde.
  Systemfarben: hell `#F9FAFC`/`#191A1E`, dunkel umgekehrt.
- Der Inhalt bleibt in der Bildschirmmitte, mit Auto Layout und
  iPhone-Safe-Area; dieselbe Ressource funktioniert auch auf
  größeren und kleineren iPhone-Bildschirmen.
- **Keine** eigene Ladeanzeige, keine künstliche Verzögerung,
  keine Apple-Login-Anfrage und kein Zugriff auf private Notizen.

Der LaunchScreen ist nach Apples Vorgaben eine **statische**
`LaunchScreen.storyboard`, nicht eine zweite HTML-Seite und
nicht ein Swift-Controller mit eigenem Appzustand. Sobald die
Capacitor-WebView bereit ist, erscheint das echte Redion wie
bisher. Die Startansicht darf keine Nutzerdaten lesen.

> Hinweis: Beim Kaltstart kennt UIKit die **iOS-Systemdarstellung**,
> nicht die zuletzt in Redions IndexedDB ausgewählte Sonderfarbe.
> Innerhalb der laufenden App passt die schon bestehende
> native Statusleistenintegration aus PR #144 zur Redion-Darstellung.
> Apple kann LaunchScreens bzw. App-Snapshots im System cachen;
> deshalb muss die tatsächliche Anzeige beim nächsten iPhone-Update
> geprüft werden.

## Exakte Trennung von nativer App und Website

**Versionskontrollierte Dateien unter `ios/`:**
- `ios/native-launch.storyboard`: statische, deklarative UIKit-Ansicht.
- `ios/install-launch-screen.mjs`: prüft den erwarteten
  Capacitor-Ordner, das generierte Storyboard und die drei
  Original-Icons, bevor es nur im generierten iOS-Projekt schreibt.
- `ios/install-launch-screen.test.mjs`: Regressionstests.

**Nur während des Codemagic-Builds erzeugte Dateien:**
```text
build/ios-capacitor/App/App/
├── Base.lproj/LaunchScreen.storyboard
└── Assets.xcassets/
    ├── RedionLaunchIcon.imageset/
    │   ├── Contents.json
    │   └── RedionLaunch-1x.png / -2x.png / -3x.png
    ├── RedionLaunchBackground.colorset/Contents.json
    └── RedionLaunchText.colorset/Contents.json
```

Es wird **nichts** in Redions eigenem `ios/`-Quellordner
überschrieben, gelöscht oder ignoriert. `index.html`,
`src/`, `quell/`, CSS, Service Worker, PWA,
`redion-einzeldatei.html`, IndexedDB, PDF-Anmerkungen,
Dateiexporte und `.redion`-Sicherungen bleiben unverändert.

Es gibt keine neuen npm-Pakete und keine neue Berechtigung.
Bundle-ID bleibt `ch.redurbabat.redion`; derselbe Redion-Webcode
aus demselben Git-Commit läuft auf Website und iPhone.

## Build- und Qualitätssicherung

```powershell
node --test ios/install-launch-screen.test.mjs
node --test ios/native-project-layout.test.mjs
node --test ios/native-feel.test.mjs
```

Der Codemagic-Workflow führt den neuen Test vor der iOS-Erzeugung
aus. Nach `npx cap sync ios` und nach dem nativen Datenschutzschirm
installiert der Workflow nur den LaunchScreen in das **bereits
erzeugte Xcode-Projekt**. Er kontrolliert alle drei Asset-Ordner
und lässt den Xcode-Interface-Builder mit

```sh
xcrun ibtool --errors --warnings --notices \
  --compile "$CM_BUILD_DIR/build/redion-launch-check.storyboardc" \
  build/ios-capacitor/App/App/Base.lproj/LaunchScreen.storyboard
```

die tatsächliche Storyboard-Kompatibilität auf macOS prüfen.
Ein ungültiges Storyboard soll **vor** dem vollständigen
`xcodebuild`-Schritt sichtbar scheitern.

Die zusätzlichen Node-Tests prüfen das statische UIKit-Layout,
iPhone-Hell-/Dunkel-Farben, PNG-Originaldaten, idempotente
Fail-Closed-Installation, fehlende Assets und Web-/iOS-Trennung.

**Teststatus:** Die Änderungen sind im GitHub-Zweig
implementiert. Ein vollständiger Mac-Xcode-/Codemagic-/Echtgerätetest
ist **noch nicht bestätigt**. Ein erfolgreiches Test-Skript
ist nicht dasselbe wie eine signierte IPA.

## Abnahme auf dem iPhone

1. Nach erfolgreichem Codemagic-Build die neue
   `Redion-unsigned.ipa` wie bisher mit derselben
   Apple-ID, derselben Team-Signatur und derselben
   Bundle-ID signieren.
2. Vorher eine überprüfte **externe `.redion`-Sicherung**
   außerhalb des App-Containers anlegen.
3. **Redion niemals deinstallieren** – die App mit iPASide
   über die vorhandene Installation aktualisieren.
4. Redion beenden und normal über das App-Symbol neu öffnen.
   Den mittig angeordneten Redion-Startbildschirm beurteilen.
5. Das iPhone-System von Hell nach Dunkel ändern, Redion
   erneut starten und Hintergrund/Schrift prüfen.
6. Prüfen: Beim Öffnen erscheint die normale bestehende
   Redion-Oberfläche, Notizen sind unverändert und Offline/
   Sicherungen/Dateien-App funktionieren weiter.
7. Besonders auf kleinen iPhones und mit dem
   Home-Indikator prüfen, dass keine Bedienelemente verdeckt
   werden. Die native Startansicht selbst hat keine Interaktion.

**Nächste iOS-Phase:** Gezielte Systemintegrationen wie
Home-Screen-Kurzbefehle oder echtes Öffnen geteilter Dateien
sollten als eigene, separat geprüfte PRs erfolgen, um
Importdaten und die vorhandenen Navigationsregeln zu schützen.
