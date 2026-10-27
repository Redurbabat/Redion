# Redion iPhone – WidgetKit/Teilen Xcode-Build verlässlich prüfen

**Folge auf die bereits gemergten PRs #157 und #158.** Diese Etappe
beinhaltet **keine neue Benutzeroberfläche und keinen weiteren
Share-Datenspeicher**, sondern prüft, ob Redions echte native
Erweiterungen zuverlässig zum generierten Xcode-Projekt gehören.

## Beobachtete Risiken

1. `ios/widgets/Info.plist` enthielt eine falsch geschriebene
   DTD-Adresse. Die Datei ist XML, aber die Systemkennung verwies auf
   `PropertyList-1.0//EN` statt
   `PropertyList-1.0.dtd`. Vor dem Erstellen der Erweiterung wird
   die plist jetzt korrekt angegeben und auch tatsächlich geparst.
2. Die bisherige `ios/install-share-widget-targets.rb`-Variante
   erzeugte `CFBundleURLTypes` mit `PlistBuddy` nur über
   `Add :CFBundleURLTypes array`. Dadurch würde der Installer
   fehlschlagen, sobald Capacitor oder ein Plugin dort bereits
   ein anderes URL-Schema registriert hat. Die neue Variante
   **liest die gesamte bestehende Property List**, behält alle
   bestehenden Einträge bei und ergänzt ausschließlich
   `redion://`. Ein bereits belegtes Redion-Schema führt
   ausdrücklich zum Fehler statt zum Duplikat.
3. Die bloße Existenz der generierten `.swift`-Dateien und ein
   fertiges `App.app` beweisen nicht, dass die iOS-Share-Extension
   oder WidgetKit-Extension tatsächlich eingebettet wurden.

## Swift-Share-Brücke beim iPhone-Appwechsel

Die bereits in `SceneDelegate.swift` eingebaute lokale Share-Zustellung
hatte bisher einen gemeinsamen Zähler für maximal 45 fehlgeschlagene
WebKit-Aufrufe. Dieser Zähler blieb auch nach einer erfolgreich
übernommenen Notiz gesetzt. Nach einem schlechten Kaltstart konnte
eine später aus Safari geteilte Notiz dadurch sofort aufhören,
automatisch erneut zugestellt zu werden.

Der Swift-Installer `ios/install-incoming-share-widget.mjs` erzeugt
nun folgende Schutzvorkehrungen:

- `import WebKit` wird explizit und **nur einmal** eingefügt, damit
  `WKWebView.callAsyncJavaScript` auf dem Xcode-Compiler verfügbar ist.
- `sceneDidBecomeActive` ruft `foreground(window:)` auf;
  jede Vordergrund-Rückkehr bekommt einen neuen Retry-Zähler.
- Nach bestätigter lokaler Speicherung (`true` aus der
  bestehenden `RedionNativeShare.receive(...)`-Methode) wird
  der Retry-Zähler ebenfalls zurückgesetzt.
- Bei fehlendem WebKit-/Store-Ready-Signal oder fehlgeschlagenem
  IndexedDB-`flush()` bleibt die JSON-Eingangsdatei weiterhin
  bestehen. Ein Fehlschlag wird **niemals** als Import-Erfolg
  ausgegeben.
- Die normale `SceneDelegateProxy`-Verarbeitung, das
  Widget-Kaltstart-Routing und die Appsymbol-Schnellaktionen
  werden nicht umgangen.

Der bestehende Test
`ios/share-widget-integration.test.mjs` enthält dazu
zwei zusätzliche Fälle: aktueller Capacitor-8-SPM-Start
mit Reset/Import und bereits importiertes WebKit-Modul.
Acht Tests dieser Suite wurden gegen die aktuellen
Branchdateien im isolierten JavaScript-Harness erfolgreich
ausgeführt; echte Swift-Typprüfung und Gerätetest
stehen weiterhin aus.

## Neue native Integrationsprüfungen

Die Buildkette bleibt bei **`REDION_IOS_EXTENSIONS=1` opt-in**.

Vor dem Verändern des generierten Projekts:
- App Info.plist und beide Extension-Info.plists mit
  `Xcodeproj::Plist.read_from_path` parsen.
- Erwartete Extension-Point-IDs vergleichen:
  `com.apple.share-services` und
  `com.apple.widgetkit-extension`.
- App und Share Extension auf dieselbe
  `group.ch.redurbabat.redion.share`-Berechtigung prüfen.
- `redion://` nur neu registrieren, wenn es noch nicht vorhanden
  ist, ohne andere `CFBundleURLTypes` zu verwerfen.

Nach dem Erzeugen des nativen Xcode-Projekts:
- Projekt nochmals öffnen und kontrollieren, dass
  `RedionShare.appex` und `RedionWidgets.appex` Teil
  von **Embed App Extensions** der ursprünglichen App sind.
- Den tatsächlich gepatchten `SceneDelegate.swift` über
  `xcrun swiftc -frontend -parse` syntaktisch kontrollieren.
- Auch das Ruby-Installationsskript per `ruby -c` prüfen.

Nach dem Xcode-Release-Build:
- Mit `set -euo pipefail` und ohne geschluckte Fehler **beide**
  Verzeichnisse `App.app/PlugIns/RedionShare.appex` und
  `App.app/PlugIns/RedionWidgets.appex` verlangen.
- Die real kompilierte `Info.plist` jeder Erweiterung auf
  erwartete Extension-Point-ID, Bundle-ID und
  `CFBundleExecutable` prüfen.
- Erst danach die bestehende **unsignierte** IPA verpacken.

## Verifikation / Abnahme

```sh
node --test ios/share-widget-xcode-build.test.mjs
node --test ios/share-widget-integration.test.mjs
node --test ios/widget-orbit.test.mjs
node --test ios/incoming-share.test.mjs
```

Der neue Test enthält sieben unabhängige Prüfungen der
versionierten Dateien. Diese wurden mittels kontrolliertem
JavaScript-Harness direkt auf den GitHub-Branchdateien ausgeführt:
**7/7 erfolgreich**.

Für den entscheidenden nächsten Schritt in Codemagic:
1. Mac/Xcode-Runner bereitstellen und den manuellen Build
   **mit `REDION_IOS_EXTENSIONS=1`** auslösen.
2. Beim ersten Fehler den jeweiligen Logabschnitt und
   `ios-xcodebuild.log` auswerten; ein ausgeführter
   Swift-Parser ist noch keine typgeprüfte WidgetKit-Extension.
3. Die beiden `.appex`-Pakete und das
   `redion://widget/`-Routing im Build nachweisen.
4. Erst **danach** drei Provisioning-Profile/Bundles und
   die gemeinsame App Group beim Apple Developer Account
   einrichten und auf einem echten iPhone installieren.
5. Vor jeder Installation eine überprüfte externe
   `.redion`-Sicherung; bestehende
   `ch.redurbabat.redion`-App **nicht deinstallieren**.

### Grenzen

**Kein** realer Codemagic-Build, `xcodebuild`-Erfolg,
WidgetKit-Bildschirmfoto, Apple-Signing oder Geräte-Share-Test
ist durch diese Quellcodeänderung bestätigt.
Die GitHub-Actions-Testjobs im Repository endeten zuletzt teils
vor Runner-Zuweisung und ohne Schritte; ein grüner CI-Status
wird daher nicht behauptet.

Web und iPhone teilen weiterhin dieselbe Redion-Oberfläche.
IndexedDB, PDF-/Office-Export, Datenschutzschirm,
TabShelf-Hochzieh-Navigation, vorhandene App-ID und
Benutzerdateien werden hier nicht verändert.
