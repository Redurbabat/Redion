# Redion iPhone – Export-Bestätigung und mobiles PDF-Menü

**Stand:** 25. Oktober 2026 · Neuer PR nach #148; keine App-/Website-Veröffentlichung beauftragt.

## Implementiert

### 1. Spürbare Bestätigung erst nach echtem Dateien-Export

Der vorhandene iOS-Exporter und sein Ziel `Directory.Documents` bleiben
unverändert. Neu kapselt `ios/native-export-feedback.mjs` ausschließlich
die bereits bestehende Speicherfunktion:

- Ein leichter nativer Taptic-Impuls erfolgt **nur nach erfülltem**
  `saveFile(...)`-Promise. Im Fehlerfall gibt es keine Erfolgshaptik.
- Weder Haptik-Fehler noch eine nicht verfügbare Taptic Engine verändern
  die Export-Rückgabe oder löschen die gespeicherte Datei.
- Bei versteckter App, `prefers-reduced-motion: reduce` oder Redions
  `data-bewegung="ruhig"` bleibt die Rückmeldung aus.
- Die Website/PWA lädt diesen Adapter nicht. Das Web bleibt beim
  vorhandenen Browser-Download.
- Ein bereits gespeicherter Export befindet sich weiterhin unter
  **Dateien → Auf meinem iPhone → Redion → Exporte** beziehungsweise
  `Backups`. Ein Share Sheet bestätigt **keine** externe Cloud-Sicherung.

Betroffen sind alle vorhandenen Aufrufer von
`RedionNativeDateien.speichern` und `RedionNativeSicherung.speichern`.
Der tatsächliche Dateiinhalt, Dateiname, Speicherort, Backupformat und
Datenbestand bleiben unverändert.

### 2. PDF-Werkzeugleiste auf schmalen iPhones

Das vorhandene PDF-Menü `.document-commandbar` verwendet bei
`max-width: 760px` jetzt die von Redion **bereits zentral gepflegte**
Variable `--visual-height`: Bei geöffneter Bildschirmtastatur erhält
das geöffnete Menü eine begrenzte Höhe und kann **intern vertikal
gescrollt** werden. Die Berechnung berücksichtigt die obere Safe-Area.

- Alle bestehenden PDF-Befehle bleiben in derselben Werkzeugleiste,
  inklusive Zoom, Seitenwahl und Modi.
- Die vorhandenen mindestens 44-px-Touchflächen bleiben erhalten.
- Redions ruhige Darstellung deaktiviert die Menüanimation ausdrücklich;
  `prefers-reduced-motion` wurde bereits unterstützt.
- Kein neues UI, kein zusätzlicher Router, keine geänderte
  Navigationsgeste. Die Zielleiste erscheint weiterhin nur per Hochziehen.

## Tests und technische Abnahme

```sh
node --test ios/native-export-feedback.test.mjs
node --test ios/native-mobile-document.test.mjs
node --test ios/native-feel.test.mjs
node --test ios/native-file-export.test.mjs
npm run bauen:ts
npm run typecheck
```

Die sechs neuen, isolierten `native-export-feedback`-Unit-Tests
wurden lokal mit Node bestanden. Der neue CSS-/Viewport-Regressionscheck
wurde zusätzlich auf seinem Inhalt geprüft. Beide Tests sind dem
Codemagic-Workflow und dem iOS-GitHub-Actions-Testjob hinzugefügt.

**Nicht ausgeführt beziehungsweise nicht bestanden bestätigt:**
vollständiger Redion-TypeScript-Build, kompletter Codemagic-/Xcode-/SPM-
Durchlauf, WebKit-Visualtests, Browser-Screenshots und physische
iPhone-Tests. Die schon vorher auftretenden GitHub-Actions-Fehler
haben keine abrufbaren Job-Schritte/Logs; daher keine Aussage über
deren eigentliche Ursache oder einen vollständigen grünen CI-Status.

## Manuelle iPhone-Abnahme

1. Vor jeder Installationsänderung ein `.redion`-Backup **außerhalb**
   des App-Containers kontrollieren. Installierte Redion-App **nicht
   deinstallieren**.
2. Bei 390×844 und 430×932 das bestehende PDF-Studio öffnen, mobile
   Werkzeugleiste ausklappen, Tastatur ein-/ausblenden und alle
   verfügbaren Befehle durch vertikales Scrollen erreichen.
3. Ruhemodus und Systemeinstellung „Bewegung reduzieren“ einschalten:
   keine Menüanimation und keine neue Exporthaptik.
4. Test-PDF sowie DOCX/XLSX exportieren: Dateiinhalte unter
   **Auf meinem iPhone → Redion → Exporte** prüfen; nur nach erfolgreicher
   Speicherung leichte Haptik erwarten.
5. Einen Export bewusst abbrechen bzw. Dateisystemfehler simulieren:
   keine fälschliche Erfolgshaptik und keine Veränderung am Original.
6. Datenschutzschirm beim App-Wechsel, iOS-Statusleiste, Offlinebetrieb,
   Backups und TabShelf-Hochzieh-Geste gegenprüfen.
7. Codemagic-Build und Signierung mit derselben App-ID
   `ch.redurbabat.redion` sowie derselben Signierungsidentität
   erst nach PR-Abnahme durchführen.

## Absichtlich nicht verändert

`capacitor.config.json`, `ios/privacy-shield.swift`,
`build/ios-capacitor/`, sämtliche IndexedDB-Inhalte,
`src/`-Navigationsmodule, PDF-Datenmodell, `index.html` und die
Codemagic-Auslieferungs-/Signing-Logik. Es erfolgt kein Merge.
