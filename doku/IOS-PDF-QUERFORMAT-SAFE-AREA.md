# Redion iPhone 2.0 – PDF-Studio im Querformat

**Stand:** 25. Oktober 2026. Separater Folge-Branch auf `main`; PR #150 mit Änderungen an den Wischgesten ist noch offen. Dieser Fix ist davon unabhängig.

## Ausgangslage

Redions gemeinsamer JS-Gerätetest `AppEinstellung.amTelefon()` behandelt
bereits ein breites Gerät als Telefon, wenn es einen groben Zeiger
(`(pointer: coarse)`) und eine niedrige Bildschirmhöhe
(`window.innerHeight <= 500`) hat. Das trifft etwa das iPhone im
Querformat bei ca. 844×390 oder 932×430 CSS-Pixel.

Im PDF-Studio galt das kompakte Bedienlayout dagegen bislang nur bei
`@media(max-width:760px)`. Das iPhone im Querformat benutzte dadurch
für denselben PDF-Arbeitsraum Desktop-Titel, Desktop-Knöpfe und
abweichende Menüs, obwohl die Touch-Geräteerkennung längst
`amTelefon() === true` lieferte.

## Änderungen

- Vier PDF-Studio-Media-Gruppen unterstützen nun **entweder**
  `max-width:760px` **oder** `(pointer:coarse) and (max-height:500px)`.
  Das gilt für die Hauptleiste, den Fullscreen-Arbeitsraum,
  Präsentationsbefehle und die Dokumentkompass-Titel.
- Der geöffnete PDF-Ansichts-Popup bleibt über die bereits vorhandene
  `--visual-height`-Variable beim Ein- und Ausblenden der iPhone-Tastatur
  scrollbar. Die seitlichen Grenzen berücksichtigen
  `env(safe-area-inset-left/right)`.
- PDF-Kopfzeile und Studio-Reiterleiste halten ebenfalls die linken
  und rechten Safe Areas ein, damit neben der Notch/Dynamic Island
  keine 44-px-Touchflächen abgeschnitten werden.
- Der vorhandene `ios/native-mobile-document.test.mjs` überprüft
  die neuen Breakpoints, seitliche Safe Areas, Zoom-/Ansichtsmenü
  und weiter vorhandene Desktop-Stile. Der iOS-PR-Testworkflow wird
  künftig auch bei Änderungen am gemeinsamen PDF-CSS und
  `AppEinstellung` ausgelöst.

## Parität und Nicht-Ziele

**Keine getrennte Oberfläche:** Eine einzige
`quell/schale/stil/pdf-studio.css` bedient Browser, PWA, offline
`file://` und die aus derselben UI erzeugte iOS-App. Keine
JavaScript-Routingänderung, keine neuen PDF-Funktionen und kein
Datenmodell-/Export-/Backup-Eingriff.

Die Hochzieh-Navigation bleibt unberührt. App-ID
`ch.redurbabat.redion`, `ios/`-Quellen und generiertes Xcode-Ziel
`build/ios-capacitor/` bleiben unverändert.

## Prüfung

**Ausgeführt:** Elf statische Assertions auf dem aktuellen Branch-
Quellcode über die GitHub-Verbindung. Alle elf erfüllt (Breakpoints,
Touchgröße, Notch-Safe-Areas, bestehendes Popup, geräteabhängiges JS,
Desktop-Regeln, Viewport-Merkmale).

**Noch ausstehend:** tatsächlicher Node-Testlauf im vollständigen
Checkout, TypeScript-Check, Browser-Layoutmessungen mit WebKit und
Chrome, echtes iPhone im Hoch-/Querformat, Codemagic-Xcode-
Kompilierung. Die GitHub-CI ist bereits auf den Vorgänger-PRs
fehlgeschlagen; die Logdateien waren nicht abrufbar. Kein grüner
CI-Status wird vorweggenommen.

```sh
node --test ios/native-mobile-document.test.mjs
npm run bauen:ts
npm run typecheck
```

### Manuelle iPhone-Abnahme

1. Externes `.redion`-Backup überprüfen. Die bereits installierte
   App **nicht deinstallieren**.
2. Ein PDF öffnen, auf 844×390 bzw. 932×430 ins Querformat drehen.
   Die PDF-Kopfzeile muss wie auf einem Telefon 44-px-Knöpfe und
   verständlichen Titel anzeigen, ohne dass Notch oder Rundungen
   die Bedienelemente überdecken.
3. Ansicht und Zoom öffnen, alle Befehle einschließlich
   Präsentieren erreichen und das Menü wieder schließen.
4. Tastatur einblenden und drehen; das Menü muss innerhalb des
   sichtbaren Ausschnitts vertikal bedienbar bleiben.
5. Hochformat 390×844 und 430×932 sowie Desktop 1280×800 gegenprüfen:
   keine Verdrängung der Werkzeugleiste, kein Verlust der Blattseiten.
6. Handschrift mit Apple Pencil, horizontalen Zoom, die
   Hochzieh-Zielleiste, Offlinebetrieb, Datenschutzschirm und
   PDF-/Office-/Backup-Export erneut prüfen.

Kein Merge, IPA-Build, Signing oder Deploy im Rahmen dieses PRs.
