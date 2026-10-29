# Codemagic: WebKit-Callback statt async/await-Überladung

## Befund

Der von Redur am 29. Oktober 2026 übergebene Build-Log endet in
`SceneDelegate.swift:170` mit `extra trailing closure passed in call` und
`cannot infer type of closure parameter 'result'`. Status 65 ist hier ein
Swift-Kompilierfehler, kein belegter Signierungsfehler.

`callAsyncJavaScript(..., in: nil, contentWorld: .page)` wählt die
async/await-Überladung. Die vorhandene Ergebnis-Closure braucht dagegen
`in: nil, in: .page, completionHandler: { ... })`.

## Korrektur

- `ios/native-documents.swift`: passende Callback-Überladung für die
  Dateiübernahme. Bestätigungs- und Wiederholungslogik bleiben unverändert.
- `ios/install-incoming-share-widget.mjs`: derselbe Fehler im optionalen
  Teilen-Eingang korrigiert. Die Erweiterung bleibt optional.
- `ios/webkit-call-contract.test.mts`: prüft beide tatsächlichen Aufrufe.
  Auf macOS prüft zusätzlich `xcrun swiftc -typecheck` die extrahierten
  Aufrufe gegen das installierte iPhone-SDK. Der Test läuft in Codemagic
  vor dem Bau; der statische Teil läuft auch im nativen GitHub-Prüfworkflow.

App-ID, Signierung, Speicherformate, Originaldateien und Weboberfläche
werden nicht geändert. Keine neuen Abhängigkeiten.

## Prüfbelege und offene Bestätigung

Vor der Reparatur: beide neuen Argumentnamen-Tests rot; der SDK-Test auf
Windows ausdrücklich übersprungen. Nach der Reparatur: 28 bestandene Tests,
kein Fehler, ein übersprungener SDK-Test im gemeinsamen Lauf von
`webkit-call-contract`, `native-documents`, `share-widget-integration`,
`share-widget-xcode-build` und `capacitor8-spm-native-integration`.
`npm run typecheck` und `git diff --check` erfolgreich.

Ein vollständiger Regressionstest und ein echter Xcode-Build sind damit
nicht behauptet. Windows hat kein iPhone-SDK. Codemagic muss den neuesten
`main` erneut bauen; erst der erfolgreiche Lauf bestätigt die native
Kompilierung. Bei einem weiteren Fehler ist dessen neuer Log maßgeblich.

API-Vertrag: [Apples WebKit-Callback-Dokumentation](https://developer.apple.com/documentation/webkit/wkwebview/callasyncjavascript(_:arguments:in:in:completionhandler:)).
