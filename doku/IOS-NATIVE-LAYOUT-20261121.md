# RED ION – iPhone UI: gezielter Layout-Fix (21.11.2026)

## Befund aus sieben iPhone-Screenshots

* Doppelte iOS-Safe-Area: Sowohl main (ueber --hoben) als auch die Kopfzeile reservierten den Notch, wodurch ein leerer Streifen entstand.
* Dokumentenbrowser: Dominanter PDF-Import, ungleich gewichtete Bedienelemente, grosse Abstaende.
* Lernen/Heute: Unverhaeltnismaessig grosse Einfuehrungskarten vor der eigentlichen Lernaktion.
* Termine: Zwei schmale Karten in der ersten Reihe mit stark umgebrochenen Texten.
* Mehr/Einstellungen: Fingerziele und Sheet-Hoehen uneinheitlich.

## Umsetzung

Die CSS-Korrekturen in ios/native-layout.mts werden nur aus ios/native-sicherung.ts im nativen Capacitor-iPhone-Container installiert. Deshalb bleiben Website, PWA und Windows unberuehrt.

Die vorhandene Fuenf-Wege-Navigation, SelectionFlow-Hochziehgeste, lokale Speicherformate, Editor, Cloud-Sync und App-ID bleiben unveraendert. Kein zweites Dock und keine neuen Laufzeitabhaengigkeiten. Farben folgen dem Theme, kein dauernder Glow, Reduced Motion ist beruecksichtigt.

## Separater laufender PR #214

PR #214 enthaelt bereits die native Liquid-Glass-Dock- und SwiftUI-Arbeit. Dieser Layout-PR fasst diese Quellen absichtlich nicht an. Er ist KEIN vollstaendiger SwiftUI-Umbau.

## Abnahme

* node --test ios/native-layout.test.mts
* node --test ios/native-feel.test.mjs
* GitHub CI: ios-native-tests
* Codemagic: bestehende iOS-Testfolge

Vor einer Freigabe fehlen noch echte iPhone-Tests mit 390/428 pt, Hell/Dunkel, grossen Systemschriften, VoiceOver, Tastatur, Dokumentenbearbeitung, Cloud-Sync, Offline und Datensicherung. Ohne diese Tests keine Aussage wie 'native App fertig', keine Signierung, kein Deployment.

## Quellenregel E28

Die neue iOS-Layout-Schicht und ihr Regressionstest sind TypeScript-Module (MTS), keine neuen handgeschriebenen JavaScript-Dateien. Das Projektinventar pruefungen/js-bestand.json bleibt unveraendert und wird nicht aufgeweicht. Die unter main bereits roten Schnelltests test109, test550 und test610 sind gesondert zu behandeln.

## Mobiler Browser-Vertrag

CI startet Chromium bei 390 und 428 pt mit Touch-Modus und reduzierter Bewegung sowie bei 820 pt als Negativprobe. Der Test laedt die reale index.html und alle vorhandenen Redion-Stylesheets, ergaenzt nur das iOS-Layoutmodul und prueft Kopfzeile, Mindestgroesse der Touch-Ziele, keine horizontale Ueberbreite und untereinander liegende Terminkarten. Kein Screenshot echter Nutzerinhalte. WebKit/iPhone selbst ist weiterhin NICHT GETESTET.

## Native System-Tab-Bar aus PR #214 (integriert in PR #216)

Das bereits entwickelte native Dock und die SwiftUI-Ansichten wurden als Quellcode in
PR #216 uebernommen, **ohne** den veralteten CSS-Stand aus PR #214 zu kopieren:

- Apples `UITabBar` mit den bestehenden fuenf Bereichen, systemeigener Darstellung auf iOS 26.
- SwiftUI-Ansichten fuer Mehr/Einstellungen, Dokumentenbrowser und einfache Textbearbeitung.
- Die bestehenden Redion-Routen, Kontrollen und IndexedDB-Daten bleiben die einzige Quelle.
- `ios/install-native-glass-dock.mjs` modifiziert nur die generierte Capacitor-AppDelegate beim IPA-Build.
- Tests fuer die Bridge, UIKit-Dock-Installation und Texteditor wurden in den iOS-CI-Lauf aufgenommen.
- Kein zweiter Speicher, keine ungepruefte Cloud-Migration, keine Aenderung an der Web/PWA-Ansicht.

**Offen vor Merge:** Echtes iPhone/Simulator-Abnahmeprotokoll, iOS-26-Optik,
VoiceOver, Hochziehgesten, Wechsel zwischen nativer und klassischer Ansicht,
Tastatur, Bearbeitungskonflikte, Offline und Backups. Ein erfolgreicher
unsignierter Xcode-Build ersetzt keine Installation/Signierung auf dem iPhone.
