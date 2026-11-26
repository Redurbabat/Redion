# Kontextgerechte Docks auf dem Stand von PR #232

Auftrag vom 26. November 2026: AFFiNE-Werkzeugdock beim Zeichnen in PDF,
Whiteboard und Planfläche; in der übrigen nativen iOS-App die fünf bisherigen
Ziele mit einer separaten Suchkapsel. Das vom Nutzer gezeigte Bild ist die
Referenz für die Trennung von Navigations- und Suchkapsel. Viele Bilder der
sichtbaren Änderungen sind ausdrücklich gewünscht.

## Umsetzung

- PDF und Seitenfläche besassen in PR #232 bereits die gemeinsame
  `GfxToolbar`-Galerie. Jetzt verwenden Whiteboard und Schaltplan dieselbe
  Galerie, mit ihren vorhandenen Werkzeugen und Rückrufen.
- Im Whiteboard öffnet der Zeiger Auswahl, Hand und Verbinden. Die Galerie
  enthält Haftnotiz, Stift, Radierer, Formen, Linien, Text und Bild.
- Im Plan öffnet der Zeiger Auswahl und Leitung; Stift, Radierer, Text und
  Schiene stehen in der Galerie. Bauteilpalette und Einpassen bleiben echte
  Planaktionen. Die Kopfaktionen und Tastenkürzel bleiben erhalten.
- Die Galerie zeichnet ein Registersymbol, wenn für ein Werkzeug kein
  Vorschaubild existiert. Schmale eingebettete Flächen ordnen Zusatzaktionen
  über dem Dock an. Kein Knopf wird durch die Breite null oder verdeckt.
- Das native iOS-Hauptdock behält Dokumente, Heute, Lernen, Termine und Mehr.
  Daneben steht ein eigener 52 × 52 pt grosser Suchknopf. Ab iOS 26 verwendet
  er `UIButton.Configuration.glass()`, darunter die Systemkonfiguration
  `.gray()`. Die Tab-Bar bleibt eine UIKit-Tab-Bar.
- Suche verwendet den bestehenden Redion-Suchknopf, inklusive dessen Kontext.
  Im PDF-Studio, auf der freien Seitenfläche und im Plan-Vollbild wird das
  native Hauptdock samt Suche verborgen. Das Zeichendock bleibt zuständig.
  Tastatur, Einstellungen und Sperrschirm verbergen weiterhin beide nativen
  Steuerelemente. Die Webnavigation wird erst nach nativer Bestätigung verdeckt.

Die gemeinsame Website enthält keinen Nachbau der nativen Suchkapsel.
Screenshots der Website sind deshalb **kein Bild des nativen iOS-Docks**.

## Daten und Herkunft

Keine Änderung an IndexedDB-Schema, Strichkoordinaten, Planmodell, PDF-Dateien,
Sicherungsformat, Bundle-ID oder Synchronisierung. Keine neue Abhängigkeit,
kein weiterer fremder Quellcode. Die bereits im PR dokumentierten AFFiNE-
Vorschauen und Redions Register werden weiterverwendet.

Quellen: [AFFiNE-Funktionsabgleich](AFFINE-FUNKTIONSPARITAET.md),
[AFFiNE-Werkzeugleiste](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade/blocksuite/affine/widgets/edgeless-toolbar),
[Apples UIButton-Konfiguration](https://developer.apple.com/documentation/uikit/uibutton/configuration-swift.struct).

Dies ist der Ausbau der kontextgerechten Docks. Die offenen AFFiNE-Funktionen
wie persistente Gruppen, Präsentationsrahmen, Freihandlasso und Drehung stehen
weiter im Funktionsabgleich und werden hier nicht als fertig bezeichnet.

## Prüfungen und Bilder

`node pruefungen/context-docks.browser.test.mts --capture` prüft die echte
Website mit synthetischem Whiteboard, PDF-Seitenbild und Schaltplan bei
1366, 390 und 320 Pixeln. Geprüft werden Werkzeugwechsel, erreichbare
Zusatzaktionen, mindestens 44 px grosse mobile Hauptknöpfe, die native
JavaScript-Brücke, die Suchaktion und das Ausblenden des Hauptdocks.
Die Swift-Komponente selbst wird dabei nicht ausgeführt.

Die Gegenprobe gegen den unveränderten Kopf von PR #232 (`27b05787`)
scheiterte wie erwartet an „Whiteboard: gemeinsame Galerie“.
`REDION_DOCK_ROOT=<Vergleichsstand>` wählt dafür einen anderen Arbeitsbaum.
`--baseline --capture` erstellt nur Vergleichsbilder, ohne die neuen Zusagen.

Bilder liegen ausschliesslich unter `bilder/context-docks/` und werden nicht
committet. `--webkit` startet denselben Prüflauf mit WebKit.

Aktueller Nachweis dieser Sitzung:

- Chromium: 60/60 Zusagen in der neuen Dock-Prüfung, einschliesslich des
  barrierefreien Rückfalls vor der nativen Bestätigung.
- Whiteboard-Regression `test209`: 56/56 bestanden.
- Schaltplan-Regression `test625`: 110/110 bestanden. Die Klickwege wurden
  an die Galerie angepasst; der Zoomtest wählt einen tatsächlich unverdeckten
  Punkt der Bühne, statt hinter dem breiteren Dock zu messen.
- Seitenflächen-Regression `test575`: 111/111 bestanden.
- PDF-Dokumentkompass: 68/68 bestanden.
- Native Installer, Dock-Verträge und Build-Parität: 15/15 bestanden.
- TypeScript, Web-Build, Einzeldatei und Dienststand 1683 erfolgreich geprüft.
- Schneller Gesamtlauf: 46 von 50 Läufen bestanden. Die vier Fehler
  (`test87`, `test290`, `test401`, `test402`) wurden jeweils separat gegen
  den unveränderten PR-Kopf `27b05787` reproduziert. `test87` beanstandet Steuerzeichen in
  `quell/fremd/pdf-lib/library.js`. Derselbe Fehler wurde separat gegen den
  unveränderten PR-Kopf `27b05787` reproduziert. Die Bibliothek ist unverändert
  (Git-Blob `edb12c72cdaa11b608eb5967cf1531892b7f3b31`). Die anderen drei
  betreffen das bereits veraltete CSS-Namensraumverzeichnis, die Erfassung
  fremder CSS-Tokens und bestehende Einträge unter 44 px. Diese Änderung
  erklärt den schnellen Gesamtlauf daher nicht für grün.
- WebKit: **NICHT GETESTET**, erforderliche Systembibliotheken fehlen;
  `playwright install-deps webkit` scheiterte an fehlenden Root-Rechten.
- Echtes iPhone, VoiceOver, Swift-/Xcode-Kompilierung, IPA und Deployment:
  **NICHT GETESTET / NICHT AUSGEFÜHRT**.
- Graphify-Aktualisierung: Werkzeug in dieser Umgebung nicht installiert.
