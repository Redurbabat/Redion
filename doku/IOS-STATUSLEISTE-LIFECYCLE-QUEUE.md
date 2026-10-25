# Redion iPhone App 2.0 – UIKit-Statusleiste beim App-Wechsel

**Stand:** 25. Oktober 2026 · eigenständiger PR nach dem Merge von
#150; #151 (PDF-Querformat) ist zu diesem Zeitpunkt noch offen.

## Zweck

Die vorhandene iOS-only-Brücke setzt Hell-/Dunkel-Symbole in der
Capacitor-8-Statusleiste über `SystemBars.setStyle()`. Ein Rückwechsel
aus dem App-Umschalter kann mehrere `focus`, `pageshow` und
`visibilitychange`-Ereignisse sowie gleichzeitig Theme-Mutationen
hervorrufen.

Bisher stellte `ios/native-feel.mjs` **jede** vorübergehend gewünschte
Stiländerung in eine Promise-Warteschlange. Die Queue war zwar
geordnet, konnte aber bereits überholte Themes nacheinander an UIKit
senden – auch wenn WebKit zwischenzeitlich in den Hintergrund ging,
weil der `hidden`-Check nur vor dem Einreihen lag.

## Änderung

- Jede neue Statusleisten-Anforderung erhält eine aufsteigende
  **Generation**. Noch wartende Aufträge mit älterer Generation
  werden übersprungen. Bereits gestartete native Aufträge bleiben
  geordnet; die jüngste Farbwahl erreicht UIKit zuletzt.
- Der vor dem Bridge-Aufruf ausgeführte Check verhindert
  `SystemBars.setStyle()`, solange `document.hidden` gilt. Bei
  Rückkehr erzwingen die vorhandenen Lifecycle-Events eine
  erneute Synchronisierung mit dem **aktuellen** Thema.
- Ein fehlgeschlagener **alter** Bridge-Aufruf darf die
  Theme-Zwischenspeicherung eines neueren Auftrags nicht löschen.
- Listener, vorhandene Haptik, Navigationsziele, TabShelf-Geste,
  PDF-Daten, Backups, Offline-Speicher und Swift-Datenschutzschirm
  bleiben unverändert.

Eine bereits an UIKit übergebene, noch laufende Operation kann aus
JavaScript nicht abgebrochen werden. Sie wird serialisiert und
anschließend durch die aktuelle Stilanforderung korrigiert.

## Regression

```sh
node --test ios/native-statusbar-queue.test.mjs
node --test ios/native-feel.test.mjs
node --test ios/native-lifecycle-export.test.mjs
npm run bauen:ts
npm run typecheck
```

Der neue Test prüft sechs kontrollierte Zustände: rascher
Hell-Dunkel-Wechsel, verzögerter Bridge-Start, Hintergrund vor
Verarbeitung, mehrere Wiederaufnahme-Ereignisse, Cleanup während
einer aktiven Operation und Fehler eines veralteten Auftrags. Die
beiden älteren Tests wurden auf die gewollte Zusammenfassung
von unmittelbar aufeinanderfolgenden Aufträgen angepasst.

Die Tests sind den vorhandenen GitHub- und Codemagic-
Workflows hinzugefügt. Die GitHub-Läufe der vorangegangenen
PRs haben **keinen Runner-Namen und keine Job-Schritte** und
enden innerhalb weniger Sekunden. Das ist ein Hinweis auf
ein Problem bei Runner-Zuweisung oder Workflow-Initialisierung;
die Ursache (z. B. Actions-/Abrechnungszustand) ist
ohne GitHub-Jobdiagnose **nicht bestätigt**.

## Manuelle iPhone-Abnahme vor Merge

1. Vor Geräteinstallationen eine `.redion`-Sicherung außerhalb
   des iPhone-App-Containers verifizieren. App nicht deinstallieren.
2. Im Hell- und Dunkelmodus jeweils App-Umschalter öffnen und
   Redion zurückholen; Statusleiste (Uhr, Funk, Batterie) muss
   zur Oberfläche passen, ohne sichtbares Flackern.
3. Mehrfach rasch Theme wechseln, dann sofort Hintergrund/
   Vordergrund. iOS-Symbole sollen zuletzt das gewählte Thema
   widerspiegeln.
4. Normale Touch-Navigation, haptische Rückmeldungen, die
   ausschließlich per Hochziehen geöffnete Zielleiste und
   Privacy Shield prüfen.
5. Web/PWA, Offline-Editor, Export von PDF/Office und
   Native-Backups unverändert gegenprüfen.

Keine Veränderung an `capacitor.config.json`, App-ID
`ch.redurbabat.redion`, `build/ios-capacitor/` oder dem
gemeinsamen Web-/PWA-Bundle. Weder Merge noch Deploy.
