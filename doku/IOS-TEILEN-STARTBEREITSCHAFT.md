# Redion iOS – Share Sheet erst nach dem tatsächlichen App-Start öffnen

## Ursache

Redion lädt sein normales `src/start.ts` und die globalen
`Ereignisse`-/`ARTEN`-Definitionen über **defer-Skripte**:

```html
<script src="quell/start.js" defer></script>
```

Der iOS-only Loader `ios/vorbereiten.mjs` hängt dagegen die
gebündelte native Bridge als reguläres `<script>` am Ende von
`www/index.html` an. Diese Bridge kann deshalb bereits **vor**
den defer-Skripten ausgeführt werden.

Bisher erzeugte `ios/native-sicherung.ts` sofort:
`createIosShareReadiness({ events: typeof Ereignisse !== 'undefined' ? Ereignisse : null })`.
War der globale Ereignisbus noch nicht vorhanden, erhielt der
Ready-Checker dauerhaft `null` und abonnierte niemals
`ARTEN.ablageGeladen` (Wert: `ablage.geladen`).

**Folge:** Die eigentliche Share Extension konnte einen Weblink
bereits in der App Group ablegen, aber der Host antwortete
bei jedem Importversuch weiter mit `false`. Die erhaltene
Share-Datei war zwar nicht verloren, erschien aber nie als Seite.

## Behebung (nur iOS-nativ)

- `ios/native-sicherung.ts` übergibt jetzt **einen Getter** statt
  eines beim Modulstart bestimmten `Ereignisse`-Werts.
- `ios/incoming-share-readiness.mjs` versucht die Anmeldung
  bei `Ereignisse.horche('ablage.geladen', ..., {nachreichen:true})`
  bei jedem erneuten Ready-Aufruf, bis der Bus tatsächlich
  existiert. Danach bleibt es bei **einem** Abonnement.
- `ARTEN` wird während der frühen nativen Modulevaluation
  nicht mehr gelesen. Der feste Ereignisname wurde gegen
  `src/kern/ereignisse/arten.ts` geprüft.
- Erst wenn der lokale `Store.load()` das Laden bestätigt,
  die Dokumentansicht nicht verborgen ist und der bestehende
  Redion-Startvorhang `#ru-vorhang` verschwunden oder
  im Zustand `ru-vorhang-weg` ist, kann der Import beginnen.
- Solange `#sperrschirm` existiert, wird **kein** geteilter
  Text/Link gespeichert oder geöffnet. Damit bleibt die
  Passwortabfrage vor der externen Share-Verarbeitung.
- Scheitert der App-Start oder die Event-Bus-Initialisierung,
  gibt die Bridge weiter `false` zurück: Das App-Group-JSON
  bleibt erhalten, bis Redion erfolgreich startet.

## Tests

`ios/incoming-share-store-contract.test.mjs` prüft zusätzlich:
späte Event-Bus-Verfügbarkeit, Replay nach bereits abgeschlossenem
Store-Laden, Fehler beim Zugriff auf deferred globale Variablen,
Sperrbildschirm, Startvorhang, Hintergrundzustand und die echte
HTML-Ladereihenfolge. Die bestehenden Speicher-/Share-Verträge
werden weiter geprüft. Die **11/11 Tests** dieser Suite wurden
direkt anhand der GitHub-Branchdateien in einem isolierten
JavaScript-Harness erfolgreich durchlaufen.

Für den echten Checkout:

```sh
node --test ios/incoming-share-store-contract.test.mjs ios/incoming-share.test.mjs
node --test ios/share-widget-integration.test.mjs
```

Es gibt weiterhin **keinen bestätigten vollständigen macOS/
Codemagic-`xcodebuild`-, WidgetKit-/Share-Extension-Signing-
oder physischen iPhone-Test**. Die Vorprüfung ersetzt ihn nicht.

## Grenzen / Datenschutz

Nur `ios/native-sicherung.ts`,
`ios/incoming-share-readiness.mjs` und die native Testsuite werden
für diese Änderung angefasst. Keine neue Datenbank, keine Server-
oder Cloud-Verbindung, kein geändertes `.redion`-Backup,
keine Änderungen in `src/`/`quell/`, keine TabShelf-Taste,
keine Änderung der App-ID `ch.redurbabat.redion`.
Der Startbildschirm wird als **Beobachtung**, nicht als neues
Bedienungselement verwendet. Eingänge verbleiben bis zur sicheren
Bestätigung in der bestehenden iOS App Group.

Diese Korrektur ist unabhängig vom weiterhin offenen Xcode-
Build-Absicherungs-PR #159 und soll nicht automatisch mergen.
