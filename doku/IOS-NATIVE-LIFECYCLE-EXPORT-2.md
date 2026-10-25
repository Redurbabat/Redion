# Redion iPhone – Rückkehr aus dem Hintergrund und sichere Dateinamen

**Stand: 25. Oktober 2026 · Entwicklungsbranch; keine App-Veröffentlichung.**

## Ausgangspunkt

Die Änderung baut **auf aktuellem `main`** auf. Der frühere Branch
`feature/ios-native-feel-haptics-statusbar` ist bereits 26 Commits hinter
`main` und enthält keine noch fehlenden Commits. Daher werden seine
Dateien nicht rückwirkend übernommen.

Redion hat bereits: eine gemeinsame Weboberfläche, native Haptik und
Statusleiste, sichtbare Dateien-Exporte, den Privacy Shield in Swift,
visuelle Viewport-/Safe-Area-Behandlung im gemeinsamen Code sowie die
iOS-Webparitätsprüfung. Die Hochzieh-Geste der zusätzlichen Navigation
bleibt unverändert.

## Implementiert in diesem Branch

1. **iOS-Statusleiste beim Zurückkehren:** Der vorhandene native Adapter
   reagiert zusätzlich auf `visibilitychange`, `pageshow` und `focus`.
   Nach Wiederaufnahme setzt er den zur aktuellen Theme-Einstellung
   passenden UIKit-Stil erneut, auch wenn `data-theme` unverändert ist.
   Im Hintergrund wird keine neue Stiländerung angefordert. Die
   vorhandene sequentielle Bridge, Fehlerisolation und Haptikdrosselung
   bleiben erhalten. Die Listener werden bei Cleanup abgemeldet.
2. **Unicode-Dateiexporte:** iOS-/APFS-Dateinamen sind nach **UTF-8-Bytes**
   begrenzt, nicht nach JavaScript-Zeichen. Maximal 180 Byte für den
   normalisierten Originalnamen lassen genug Platz für Datum und UUID
   (unter 255 Byte pro Dateinamen-Komponente). Bekannte Dateiendungen
   bleiben erhalten. Betroffen sind auch PDF, DOCX, XLSX und Backups.
3. **Schreiben bei Dateisystemfehlern:** Falls ein nativer Schreibaufruf
   eine temporäre Datei anlegt und danach fehlschlägt, wird versucht,
   nur diese **eigene** `.teil`-Datei zu entfernen. Vorhandene Dokumente
   und Originalanhänge werden nicht verändert.
4. **Tests:** `ios/native-lifecycle-export.test.mjs` prüft den
   Hintergrund-/Vordergrundwechsel, verzögerten Theme-Wechsel,
   Listener-Cleanup, Unicode-Namen, echte Bytes und fehlgeschlagene
   temporäre Dateierstellung. Die Suite wird bei jedem **manuellen**
   Codemagic-Build zusammen mit den vorhandenen iOS-Tests ausgeführt.

## Unveränderte Schutzregeln

- App-ID `ch.redurbabat.redion` und `build/ios-capacitor/`.
- Vorhandener `ios/`-Ordner und sämtliche persönlichen Daten.
- Browser-Downloads, gemeinsame Website, `src/`, `quell/` und TabShelf.
- Backups, Swift-Privacy-Shield, Offlinebetrieb und manuelle Codemagic-Auslösung.
- Keine neue Plugin-Abhängigkeit, keine Telemetrie und keine automatische Migration.

## Lokal/automatisiert nachprüfen

```sh
node --test ios/native-feel.test.mjs
node --test ios/native-file-export.test.mjs
node --test ios/native-lifecycle-export.test.mjs
node --test ios/native-project-layout.test.mjs
node --test ios/install-privacy-shield.test.mjs
npm run bauen:ts
npm run typecheck
```

Der **reale** macOS-/Xcode-/Codemagic-Build, die iPhone-Gerätetests,
WebKit-Tests und Bildschirmfotos sind in dieser Arbeitsumgebung
nicht durchgeführt. Sie dürfen nicht als bestanden markiert werden.
Codemagic bleibt manuell; erst seine erfolgreichen Logs bestätigen
Capacitor 8, SPM, Xcode und die vollständige Webparität.

## Manuelle iPhone-Abnahme vor Freigabe

1. Aktuelle Daten als `.redion` an einen **externen** Ort sichern und die
   Datei kontrollieren. Bestehende Installation **nicht deinstallieren**.
2. Einen signierten Test-Build mit **identischer Bundle-ID und
   Signing-Identität** als Update installieren.
3. Hell/Dunkel wechseln, App in den Umschalter bringen (Privatschirm
   prüfen), wieder öffnen und Statusleistentext/-symbole kontrollieren.
   Dasselbe nach einem längeren Hintergrundaufenthalt wiederholen.
4. PDF-, DOCX- und XLSX-Dateien mit langen Umlauten/Emoji-Dateinamen
   exportieren. Im Ordner **Dateien → Auf meinem iPhone → Redion → Exporte**
   öffnen, Inhalt und Dateiendungen prüfen. Sharing/Abbruch prüfen.
5. Mehrseitige PDF im Dokumentstudio bearbeiten, Tastatur ein-/ausblenden,
   Dock/Toolbars bei 390×844 und 430×932 testen.
6. Zusätzliche Ziele **nur durch Hochziehen** prüfen. Normales Antippen
   darf die Zusatzleiste nicht öffnen. Reduzierte Bewegung und Redions
   Ruhemodus prüfen.
7. Offline arbeiten, App wechseln, neu öffnen: Notizen/Anhänge dürfen
   nicht fehlen; Website und PWA bleiben funktional.

Dieser PR ist ein **abgegrenzter nativer Stabilitätsfortschritt**, keine
vollständige visuelle Workspace-Neugestaltung aus Issue #134.
