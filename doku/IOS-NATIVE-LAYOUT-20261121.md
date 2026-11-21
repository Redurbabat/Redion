# RED ION – iPhone UI: gezielter Layout-Fix (21.11.2026)

## Befund aus sieben iPhone-Screenshots

* Doppelte iOS-Safe-Area: Sowohl main (ueber --hoben) als auch die Kopfzeile reservierten den Notch, wodurch ein leerer Streifen entstand.
* Dokumentenbrowser: Dominanter PDF-Import, ungleich gewichtete Bedienelemente, grosse Abstaende.
* Lernen/Heute: Unverhaeltnismaessig grosse Einfuehrungskarten vor der eigentlichen Lernaktion.
* Termine: Zwei schmale Karten in der ersten Reihe mit stark umgebrochenen Texten.
* Mehr/Einstellungen: Fingerziele und Sheet-Hoehen uneinheitlich.

## Umsetzung

Die CSS-Korrekturen in ios/native-layout.mjs werden nur aus ios/native-sicherung.ts im nativen Capacitor-iPhone-Container installiert. Deshalb bleiben Website, PWA und Windows unberuehrt.

Die vorhandene Fuenf-Wege-Navigation, SelectionFlow-Hochziehgeste, lokale Speicherformate, Editor, Cloud-Sync und App-ID bleiben unveraendert. Kein zweites Dock und keine neuen Laufzeitabhaengigkeiten. Farben folgen dem Theme, kein dauernder Glow, Reduced Motion ist beruecksichtigt.

## Separater laufender PR #214

PR #214 enthaelt bereits die native Liquid-Glass-Dock- und SwiftUI-Arbeit. Dieser Layout-PR fasst diese Quellen absichtlich nicht an. Er ist KEIN vollstaendiger SwiftUI-Umbau.

## Abnahme

* node --test ios/native-layout.test.mjs
* node --test ios/native-feel.test.mjs
* GitHub CI: ios-native-tests
* Codemagic: bestehende iOS-Testfolge

Vor einer Freigabe fehlen noch echte iPhone-Tests mit 390/428 pt, Hell/Dunkel, grossen Systemschriften, VoiceOver, Tastatur, Dokumentenbearbeitung, Cloud-Sync, Offline und Datensicherung. Ohne diese Tests keine Aussage wie 'native App fertig', keine Signierung, kein Deployment.
