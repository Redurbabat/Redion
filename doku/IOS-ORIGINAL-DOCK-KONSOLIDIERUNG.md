# RED ION – originale iOS-Tab-Bar: Konsolidierung (2026-11-22)

## Warum eine statt mehrerer Implementierungen
- PR #214 wurde bereits nach main zusammengeführt und lieferte den ersten nativen UIKit-Dock-Ansatz, enthielt aber zusätzliche SwiftUI-Seiten.
- PR #216 korrigierte die iPhone-Layouts und reduzierte die native Oberfläche auf die originale UIKit-Tab-Bar. Nach Merge von #214 war dieser PR konfliktbehaftet.
- PR #217 entwickelte einen separaten, nicht eingebundenen SwiftUI-TabView-Prototyp. Dieser ist **keine** geeignete zweite Navigationsschicht und wird nicht in die produktive App übernommen.

## Konsolidierte Lösung
- Nur eine `UITabBar` wird durch `ios/native-glass-dock.swift` bereitgestellt.
- Dokumente, Heute, Lernen, Termine und Mehr bleiben in der bestehenden Capacitor-WebView.
- Die fünf echten Web-Buttons bleiben Navigationsanker und werden bei aktivem nativen Dock unsichtbar; keine zweite sichtbare Tab-Bar.
- Der native Installer `ios/install-native-glass-dock.mjs` schreibt ausschliesslich in die *generierte* Capacitor-AppDelegate.
- Die iOS-only Layout-Korrektur kommt aus `ios/native-layout.mts` und `ios/native-sicherung.ts`; Website/PWA/Windows bleiben unverändert.
- Zusätzliche SwiftUI-Dateien und obsolete Editor-Bridge-Tests aus PR #214 wurden entfernt, damit keine zweite native Inhaltsoberfläche entstehen kann.
- Systemgestützte Darstellungen und Bedienung gehen vor eigenem CSS-/SwiftUI-Nachbau.
- Die App-ID bleibt `ch.redurbabat.redion`. Nutzerdaten, Sync und MCP werden nicht migriert.

## Integrationsgates
1. `node --test ios/install-native-glass-dock.test.mjs ios/native-layout.test.mts`
2. `node --test pruefungen/ios-glass-dock-contract.test.mjs`
3. `node --test ios/native-layout.browser.test.mts` mit bereitgestellten Browser-Dependencies
4. CI-Checks / Codemagic: der komplette iOS-Build muss ohne SwiftUI-Editor-Zusatzansichten kompilieren.
5. Ein echter iPhone-Test mit Ein-/Ausblenden der Tastatur, VoiceOver, Hell-/Dunkelmodus, grossen Schriftgrössen, Hochzieh-Zielen, Offline und Backup vor Freigabe der IPA.

## Status
Die GitHub-Quelländerungen sind konsolidiert. Ein erfolgreicher älterer PR-#216-IPA-Build
ist **kein Nachweis**, dass dieser Integrationscommit bereits kompiliert und auf einem
echten iPhone getestet wurde. Vor Installation: externes Backup erstellen,
App nicht deinstallieren, gleiche Bundle-ID/Signatur beibehalten.
