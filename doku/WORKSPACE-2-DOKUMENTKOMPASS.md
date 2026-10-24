# Redion Workspace 2.0 – Dokumentkompass & PDF-Studio

**Stand: 24. Oktober 2026 · Umsetzung im eigenen PR, noch nicht für `main` freigegeben.**

Dieser Bogen setzt **Issue #134** nach der gemergten Bibliothek 2.0 fort.
Es ist eine **sichtbare Verbesserung der bestehenden** Dokument- und
PDF-Oberfläche, keine zweite App und keine Änderung am PDF-Inhalt.

## Was neu zu sehen und bedienen ist

### Im Dokumentkopf
- Der Dokumentname wird klar hervorgehoben, lange Namen bleiben auf
  schmalen Geräten mit Auslassung lesbar; der vollständige Name ist
  weiterhin im Tooltip.
- Eine zweite, ruhige Zeile zeigt den **tatsächlichen Typ und Umfang**
  (z. B. `PDF · 6 Seiten`, `Notizheft · 1 Seite`,
  `Präsentation · 12 Folien`).
- Ein kleiner, farblich ins aktuelle Redion-Design eingebundener
  **Lesefortschritt** folgt der gewählten Seite, auch wenn beim
  fortlaufenden PDF nur gescrollt wird.
- Der Fortschritt ist ein semantisches `<progress>`-Element,
  dessen Wert aus dem ohnehin vorhandenen `state.index` kommt;
  er speichert **keinen neuen Status** und braucht keine Animation.
- Bei nur einem Blatt erscheint kein sinnloser Fortschrittsbalken.
- Die eigentliche Positionsangabe `Seite 3/12` bleibt nur an der
  **bestehenden** Stelle in der Ansichtsklappe sichtbar. Sie wird nicht
  als zweite Zahl im Kopf dupliziert (bestehender Test210).

### Direkt zu Seite oder Folie springen
- In **Ansicht → Seite 3/12** ist die bisherige Positionsangabe jetzt
  ein echter, mindestens 44 px hoher Knopf.
- Sie öffnet **Redions vorhandenen** Eingabedialog. Der Nutzer gibt
  eine Seitenzahl ein, und der vorhandene `springe()`-Weg wählt
  dieselbe Seite wie die Miniatur- und Pfeilnavigation.
- Gültig sind nur ganze Zahlen von 1 bis zur vorhandenen Seitenzahl.
  Abbrechen, leere Eingaben, negative Zahlen und zu hohe Zahlen
  verändern weder die aktuelle Seite noch die gespeicherten PDFs.
- Der Knopf ist bei einem einseitigen Dokument deaktiviert; mehrfaches
  Antippen öffnet niemals parallele Dialoge.

### Dokumentdetails
- Der vorhandene rechte Inspector zeigt Metadaten in einer ruhigeren
  Fläche und die **bereits vorhandenen echten** Zahlen für Aufgaben,
  Lernkarten und Notizen als drei nebeneinander liegende Karten.
- Verknüpfte Einträge bekommen besser erkennbare Zeilen und mindestens
  44 px hohe Bedienflächen.
- Keine neue Datenabfrage, kein zweites Register, kein Verlust der
  bisherigen Import-, Export- oder Seitenaktionen.

## Web UND iPhone

Das Upgrade besteht aus genau dem **gemeinsamen Redion-Code**:
`src/bereiche/pdf/document-mode.ts`, seiner generierten
`quell/bereiche/pdf/document-mode.js` und
`quell/schale/stil/pdf-studio.css`.

Die native iOS-App kopiert im Codemagic-Build dieselben Web-Dateien
aus demselben Git-Commit. **Keine** Änderung an der iOS-Brücke,
Swift-Dateien, App-ID, Website-`index.html`, iOS-Installation,
IndexedDB, PDF-Annotationen oder `.redion`-Archiven.

Ohne neuen Codemagic-Build wird die bereits installierte iPhone-App
nicht automatisch aktualisiert. Das Live-Deployment der Website
muss ebenfalls denselben Commit verwenden, damit beide live gleich
sind. **Kein Merge und kein Deployment durch diesen PR.**

## Reale Browserprüfungen und Bilder

```sh
npm run bauen:ts
npm run typecheck
node pruefungen/workspace-document.mts
node pruefungen/workspace-document.mts --webkit
```

Für synthetische Testdaten und **echte Browserbilder**:

```sh
node pruefungen/workspace-document.mts --capture
node pruefungen/workspace-document.mts --webkit --capture
```

Der Pull-Request-Workflow `Workspace-Dokumentenkompass` prüft mit
Chromium und WebKit bei **390 × 844**, **430 × 932** und
**1440 × 900**. Er erstellt auch Bilder des unveränderten
Basis-Commits mit denselben synthetischen Testdaten:
`--baseline --capture` und der Umgebungsvariablen
`REDION_WORKSPACE_ROOT`.

Die PNGs liegen nur in GitHub-Actions-Artefakten für **14 Tage**
(`workspace-dokument-kompass`), nicht im Repository, und
enthalten **keine persönlichen Nutzerdaten**.

Prüfverträge:
1. Titel, echte Dokumentart und Seitenzahl sind sichtbar.
2. Fortschrittswert `1/6` ist synchron mit der Seite.
3. Keine horizontale Überbreite am iPhone.
4. Sprungknopf ist erreichbar und mindestens 44 px hoch.
5. Eingabe `4` springt genau zu Seite 4 und aktualisiert das
   semantische `<progress>`.
6. `999` wird abgewiesen, **Abbrechen** hat keine Nebenwirkung.
7. Original-IDs und Seitenreihenfolge bleiben unverändert.
8. Ein einzelnes Blatt zeigt keinen Balken und hat keinen
   aktiven Sprungknopf.
9. Browserfehler müssen ausbleiben.

**Status der automatisierten Prüfungen:** Die Prüfungen und der
Actions-Workflow sind erstellt. Ein tatsächliches Chromium/WebKit-
Ergebnis oder neue Screenshots liegen **erst nach erfolgreichem
CI-Lauf** vor; in dieser Sitzung wurde noch kein vollständiger
Playwright- oder Codemagic-Build ausgeführt. Bestehende passende
Tests sind zusätzlich `test202`, `test210`, `test285`,
`test395`, `test453`, `test508`, `test597`,
`test105` sowie die Codemagic-Webparität.

## Rest von Workspace 2.0

**Noch nicht durch diesen Bogen erledigt:**
- Große Editor- und PDF-Ink-Werkzeugleistenpolitur über diesen
  Dokumentkopf hinaus; keine Änderung an Stiftkoordinaten,
  Markenschema oder Exportgenerator vorgenommen.
- Das Mobile-Navigations-/TabShelf-Upgrade. Die vom Nutzer
  verlangte Regel **„zweite Zielleiste nur beim Hochziehen,
  niemals beim normalen Tippen“** bleibt unverändert.
- Manuelle Safari-/iPhone-Abnahme, neue IPA und kontrolliertes
  Website-Deployment.

## iPhone-Abnahme nach grünem PR und Freigabe

1. Eine `.redion`-Sicherung ausserhalb des iPhone-App-Containers
   speichern und durch Öffnen kontrollieren.
2. Die neue IPA mit derselben Apple-ID und App-ID **über** der
   bestehenden App installieren; Redion nicht löschen.
3. Ein PDF mit mindestens sechs Seiten öffnen und den Titel,
   die Typenzeile und den Fortschrittsbalken prüfen.
4. **Ansicht → Seite 1/6** antippen, `4` eingeben, prüfen,
   dass dieselbe PDF-Seite angezeigt wird. `999` und
   **Abbrechen** müssen die Seite unverändert lassen.
5. In der fortlaufenden Ansicht durch Seiten scrollen.
   Die Fortschrittsanzeige soll mitwandern.
6. Dokumentdetails öffnen und Aufgaben/Lernkarten/Notizen
   mit den eigenen **bereits vorhandenen** Verknüpfungen prüfen.
7. Helles und dunkles Thema, hohe Kontraste, reduzierte
   Bewegung, Keyboard/Fokus, VoiceOver und Safe-Areas prüfen.
8. Die Website aus demselben Commit kontrollieren:
   dieselbe Oberfläche, weiterhin normale Web-Downloads
   und voll nutzbare PWA.

**Datenregel:** Kein manueller Test rechtfertigt ein Deinstallieren
der bestehenden iPhone-App. Der PR allein verändert die App auf
dem Gerät nicht.
