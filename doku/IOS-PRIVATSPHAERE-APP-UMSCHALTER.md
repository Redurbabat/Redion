# Redion iPhone: Datenschutz im App-Umschalter

**Stand: 24. Oktober 2026 – vorbereitet, nicht auf einem iPhone verifiziert.**

## Was diese Änderung macht

Wenn die installierte iOS-App in den Hintergrund geht, wird über die
native Oberfläche ein **undurchsichtiger Redion-Bildschirm** gelegt. In
der iOS-App-Übersicht soll deshalb nur „Redion“ statt einer offenen Notiz,
eines PDFs oder eines vertraulichen Dokuments zu sehen sein.

Beim Rückkehr in die App verschwindet der Bildschirm; Redion arbeitet
mit seinen **unveränderten Daten und dem gleichen aktuellen Dokument**
weiter. Diese Hülle ändert weder IndexedDB noch irgendeinen
Redion-Block.

Technik: UIKit-Overlay auf den zugehörigen `UIWindow`-Instanzen.
Registriert werden die iOS-Lebenszyklusmeldungen für App und Scene
(`willResignActive`, `didBecomeActive`, `willDeactivate`,
`didActivate`). Der Overlay wird vor einem Hintergrund-Snapshot
angelegt und bei Reaktivierung entfernt.

**Grenzen:** Dies ist **kein Face-ID-/Touch-ID-Zugangsschutz**, keine
Verschlüsselung und kein Schutz gegen Screenshots bei geöffneter App.
Das Betriebssystem bestimmt den genauen Zeitpunkt seiner Snapshots;
die Wirksamkeit muss auf dem echten iPhone getestet werden.
Die Funktion greift nicht in Dateien, Backups oder Apple-ID-Signaturen ein.

## Strikte Trennung von Website und iPhone

Die vorhandene Redion-Website, ihre `index.html`, CSS,
Service Worker, Navigation, Daten und PWA bleiben **unverändert**.

Nur nach `npx cap sync ios` fügt der Build die unter
`ios/privacy-shield.swift` gespeicherte Klasse in
`ios/App/App/AppDelegate.swift` ein. `AppDelegate.swift`
wird bereits von Xcode gebaut: wir fassen **weder die
Xcode-`project.pbxproj` noch das Website-`index.html`** an.

`ios/install-privacy-shield.mjs` prüft die erwartete Capacitor-
Startsignatur. Wenn sie fehlt oder der Hook zweimal existiert,
bricht der Build ab, statt fehlerhaften Code zu schreiben.

Es werden **keine neuen Drittanbieter-Abhängigkeiten** installiert.
Der vorhandene SHA-256-Abgleich aus
`ios/vergleiche-webstand.mjs` bleibt aktiv und prüft, dass die
iOS-App dieselben Webdateien wie die Website enthält.

## Prüfungen

```sh
node --test ios/install-privacy-shield.test.mjs
```

Fünf Regressionstests prüfen den sicheren Einbau in eine typische
Capacitor-AppDelegate, die Verhinderung doppelter Installation,
den Abbruch bei unerwarteten Vorlagen, die iOS-Lebenszyklus-Anbindung
sowie die Beschränkung auf native Swift-Dateien.

**Bisher nicht getestet:** Swift-Kompilierung auf macOS, Xcode-IPA
und iOS-Snapshot auf einem realen iPhone.

### Abnahme nach dem Codemagic-Build

1. Vor einer neuen IPA eine `.redion`-Sicherung **ausserhalb der
   App** ablegen und kontrollieren.
2. Den PR mergen, in Codemagic manuell bauen und die neue IPA mit
   iPASide **über** Redion installieren. Die alte App **nicht löschen**.
3. In Redion eine Testnotiz öffnen, dann zum Home-Bildschirm wechseln
   und die iOS-App-Übersicht öffnen.
4. Redions Vorschau sollte den dunklen Schriftzug **„Redion“**
   statt des Notizinhalts anzeigen.
5. Redion erneut öffnen und prüfen, dass die Notiz ohne erneutes
   Laden oder Datenverlust wieder sichtbar ist.
6. App-Umschalter erneut bei einem geöffneten Test-PDF prüfen.
7. Auf der Website die unveränderte Oberfläche kontrollieren.

Falls der Snapshot noch private Inhalte zeigt, die Swift-
Lebenszyklusfolge anhand des iPhone-Tests korrigieren, bevor diese
Funktion als zuverlässig bezeichnet wird.
