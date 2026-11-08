# Redion iPhone – Codemagic: `ios platform already exists`

**24. Oktober 2026 – Reparatur des nativen Buildpfads nach dem esbuild-Fix aus PR #142.**

## Was der neue Codemagic-Log tatsächlich beweist

Der neue Build schafft die vorherige npm-Fehlermeldung `ERESOLVE`.
`esbuild@0.28.2` bundelt die iOS-Brücke erfolgreich zu
`www/redion-native-sicherung.js` (52,2 kB im gemeldeten Lauf).

Anschließend bestehen alle **5 Tests** der iOS-Webparität.
Das Ergebnis bestätigt **482 Webdateien** mit identischen Bytes
zwischen Website und iOS-Paket, mit genau der erlaubten Ausnahme
für das zusätzliche native Brückenskript.

Erst bei

```sh
npx cap add ios --packagemanager SPM
```

endet der Schritt mit:

```text
[error] ios platform already exists.
To re-add this platform, first remove ./ios
WARNING: Your native project will be completely removed.
```

**Nicht löschen!** Das Verzeichnis `ios/` ist im Redion-Repository
seit den früheren iPhone-Phasen mit eigenen Dateien belegt:
`ios/native-sicherung.ts`, `ios/native-file-export.mjs`,
`ios/privacy-shield.swift`, verschiedene Regressionstests und
weitere Hilfsdateien. Es ist **kein** neu erzeugtes
`ios/App/App.xcodeproj`. Der Standardpfad des Capacitor-CLI ist
aber `ios/`, deshalb interpretiert es diesen vorhandenen Ordner
als bereits angelegte Plattform.

## Fachgerechte Lösung (keine Löschbefehle)

Capacitor unterstützt seit Version 3 über
`capacitor.config.json` einen eigenen Pfad der nativen iOS-Plattform.
Die Konfiguration lautet jetzt:

```json
{
  "appId": "ch.redurbabat.redion",
  "appName": "Redion",
  "webDir": "www",
  "ios": {
    "path": "build/ios-capacitor"
  }
}
```

Damit liegt das **nur beim Build generierte** Xcode-Projekt hier:

```text
Redion/
├── ios/                         ← BEHALTEN: Redions TypeScript-, Swift- und Testquellen
│   ├── native-sicherung.ts
│   ├── privacy-shield.swift
│   └── …
├── build/
│   └── ios-capacitor/           ← NEU: von Capacitor generiertes iOS-Xcode-Projekt
│       └── App/
│           ├── App.xcodeproj
│           └── App/
│               ├── AppDelegate.swift
│               ├── Info.plist
│               └── Assets.xcassets/
└── www/                         ← Gleiche Web-App plus native Brücke
```

Der Pfad `/build/ios-capacitor/` steht nun in `.gitignore`,
damit generierte Xcode-Dateien bei einem lokalen Build nicht
versehentlich auf GitHub gepusht werden. **`ios/` bleibt
absichtlich NICHT ignoriert** – diese Dateien gehören zur App.

## Alle abhängigen Schritte mitgezogen

`codemagic.yaml` verwendet den neuen Xcode-Pfad bei:

- `npx cap add ios --packagemanager SPM` und `npx cap sync ios`
  (über die native Capacitor-Konfiguration);
- dem vorhandenen Swift-Datenschutzschirm
  `ios/install-privacy-shield.mjs`, der jetzt ausschließlich die
  **generierte** `build/ios-capacitor/App/App/AppDelegate.swift`
  beschreiben darf;
- der Dateifreigabe über `Info.plist`;
- dem bestehenden Redion-App-Symbol;
- `xcodebuild -project build/ios-capacitor/App/App.xcodeproj`;
- der bisher unveränderten unsignierten IPA-Ausgabe nach
  `build/ipa/Redion-unsigned.ipa`.

Vor `cap add` kontrolliert der Workflow, dass der neue Zielordner
**noch nicht existiert**. Falls er doch existiert, bricht er
mit verständlicher Meldung ab. Er löscht niemals Dateien, um den
alten Fehler zu umgehen. Danach kontrolliert er, dass Swift und
das Xcode-Projekt **tatsächlich erzeugt** wurden.

## Regressionstests

```sh
node --test ios/native-project-layout.test.mjs
node --test ios/install-privacy-shield.test.mjs
node --test ios/codemagic-dependency-versions.test.mjs
node --test ios/vergleiche-webstand.test.mjs
```

Neue Tests prüfen den Custom-`ios.path`, die Trennung der
Quell-Dateien vom Xcode-Ziel, die Codemagic-Dateipfade, die
Swift-Injektion und die `.gitignore`-Absicherung.

**Stand:** Der neue Codemagic-Code und seine Prüfungen sind auf
GitHub; dieser zusätzliche Build-Fix wurde **noch nicht in
Codemagic/Xcode ausgeführt**. Dass der gemeldete Lauf die
Webparität bereits erfüllt hat, beweist noch **keine fertige IPA**.

## Weiteres Vorgehen

1. Den PR auf GitHub prüfen und in `main` übernehmen.
2. In Codemagic einen **neuen manuellen Build mit dem
   neuesten `main`-Commit** starten.
3. Der bisherige npm-Schritt sollte unverändert erfolgreich sein.
   Bei `cap add ios` prüfen, dass das native Projekt diesmal
   in `build/ios-capacitor/` erzeugt wird.
4. Der Swift-Privacy-Hook, die beiden `Info.plist`-Schalter,
   das Redion-Symbol und `xcodebuild` müssen erfolgreich folgen.
5. Erst wenn **alle** Schritte grün sind und das Artefakt existiert,
   ist eine `Redion-unsigned.ipa` fertig. Sie ist weiterhin
   **nicht signiert**. Mit der bisherigen Bundle-ID
   `ch.redurbabat.redion` signieren und als Update installieren.

**Datenschutz:** Vor dem Update eine `.redion`-Sicherung
ausserhalb der iPhone-App anlegen und öffnen. **Redion auf
dem iPhone nicht deinstallieren**. Dieser GitHub-Buildfix
berührt keine auf dem Gerät gespeicherten Daten, sondern
nur die Erstellung einer künftigen IPA.

## Unverändert

Die Website-`index.html`, der Inhalt von `src/` und
`quell/`, Redions gemeinsame UI/Offline-PWA, Notizen,
IndexedDB und nativen Dateiexporte werden nicht verändert.
Die Web/iOS-SHA-256-Paritätsprüfung bleibt unverändert.
