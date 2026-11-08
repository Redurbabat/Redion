# Redion iPhone 2.0 – sichtbaren Ausschnitt bei App-Rückkehr aktualisieren

**Grundlage:** `main` nach dem kombinierten, gemergten PR #153
(Integration von #151 und #152). Dies ist eine unabhängige nächste
Verbesserung. Keine weitere Veröffentlichung oder Merge beauftragt.

## Problem

Redions gemeinsame UI berechnet seit Langem über
`AppEinstellung.viewportAktualisieren()` den tatsächlich sichtbaren
WKWebView-Ausschnitt aus `window.visualViewport`. Daraus entstehen
`--visual-height`, `--visual-bottom`, `--vh` und die Klasse
`tastatur-offen`. PDF-Ansichtsmenü, Dokument-Werkzeugleisten und
mobile Overlays verwenden diese Werte.

Beim Rückwechsel aus dem iPhone-App-Umschalter sendet WKWebView
gelegentlich `pageshow`, `focus` oder `visibilitychange`, ohne
zusätzlich ein `visualViewport.resize` zu senden. Dann konnten die
CSS-Variablen aus der Zeit vor dem Hintergrundwechsel stammen.
Die Statusleiste wird seit PR #153 beim Resume korrekt synchronisiert,
nicht aber zwingend der sichtbare Ausschnitt.

## Änderung

Der bereits existierende, nur auf iOS geladene native Adapter
`ios/native-feel.mjs` ruft bei der nächsten sichtbaren
App-Wiederaufnahme die **vorhandene gemeinsame** Methode
`window.AppEinstellung.viewportAktualisieren()` auf.

- Aufeinanderfolgende Rückkehr-Ereignisse werden zu **einem**
  asynchronen Refresh zusammengefasst.
- Das Refresh wird bei `document.hidden` oder nach Cleanup verworfen.
- Fehlende oder fehlerhafte Viewport-APIs blockieren weder
  Statusleistenkorrektur noch den Editor.
- Kein synthetisches `window.resize`, kein zweiter Listener in
  `src/`, keine separaten iOS-CSS-Werte, keine neue Navigation.
- Der App-Container bleibt lokal: **keine Änderung** an IndexedDB,
  Dateiinhalten, Backups, Exporten, Sharing, Offlinebetrieb oder
  iOS-Datenschutzschirm. Die Zusatznavigation bleibt ausschließlich
  über Hochziehen erreichbar.

## Tests

```sh
node --test ios/native-viewport-resume.test.mjs
node --test ios/native-statusbar-queue.test.mjs
node --test ios/native-lifecycle-export.test.mjs
npm run bauen:ts
npm run typecheck
```

Die neue Node-Suite enthält sechs Fälle (sichtbare Rückkehr,
Ereignisbündelung, Hintergrund, fehlender/fehlerhafter Viewport,
Cleanup und Web-/App-ID-Parität). Sie ist im bestehenden iOS-PR-
Workflow sowie in Codemagic eingetragen.

**Tatsächlich ausgeführt:** Fünf dem neuen Test entsprechende
kontrollierte JavaScript-Simulationen gegen die aus GitHub geladene
Adapterdatei dieses Branches, alle bestanden. Die sechste
statische Paritätsprüfung erfolgt in der versionierten Node-Suite.

**Noch nicht bestanden bestätigt:** vollständiger Node-/TypeScript-
Durchlauf, GitHub Actions, Xcode/Codemagic und physische iPhone-
Prüfung. Die Repo-CI-Jobs der Vorgänger-PRs wurden teils vor
Runner-Zuweisung ohne Steps abgebrochen; deren genaue Ursache
ist weiterhin unbekannt.

## Manuelle Abnahme auf iPhone

1. Zuerst externes `.redion`-Backup anlegen und verifizieren.
   Vorhandene App **nicht deinstallieren**.
2. PDF oder Editor öffnen, Tastatur einblenden, in den
   App-Umschalter wechseln und zurückkehren.
3. Prüfen, dass das schwebende Stift-Dock und das Ansichtsmenü
   über der Bildschirmtastatur stehen, statt dahinter.
4. Hoch-/Querformat, ein-/ausgeblendete Tastatur und verschiedene
   Notch-/Dynamic-Island-Geräte kontrollieren.
5. Normale Touch-Bedienung, Ruhemodus, Datenschutzschirm,
   Web/PWA, Backups, Offlinezugriff und Statusleiste gegenprüfen.

Der Folge-PR bleibt zur Abnahme offen. Kein Merge und kein
manuelles iPhone-/Web-Deployment in diesem Schritt.
