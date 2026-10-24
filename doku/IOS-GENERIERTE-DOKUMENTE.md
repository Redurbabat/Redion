# Redion: selbst erzeugte Dokumente auf iPhone und Website ausgeben

**Stand: 24. Oktober 2026.** Änderungen vorbereitet; Codemagic- und iPhone-Test stehen noch aus.

## Ein gemeinsamer Export – keine zweite App

Redions gemeinsamer TypeScript-Quellcode erzeugt PDF, PNG, Word, Excel,
ODS, PowerPoint und ZIP-Dateien. Die Dateien enthalten dieselben Daten
und erhalten dieselben Namen – egal ob die Oberfläche in Safari, der
installierten PWA oder der nativen iPhone-App läuft.

- **Web und PWA:** Der bisherige Download per `URL.createObjectURL`
  und `<a download>` bleibt unverändert.
- **iPhone-App:** Wenn die vom bestehenden Codemagic-Build eingebundene
  `RedionNativeDateien.speichern(blob, name)`-Schnittstelle verfügbar
  ist, legt Redion die erzeugte Datei in
  **Dateien → Auf meinem iPhone → Redion → Exporte** ab und bietet sie
  im iOS-Teilen-Menü an. Daraus lässt sie sich manuell in iCloud Drive
  oder an einen anderen Ort ausserhalb des App-Containers kopieren.
- **Fehler:** Ein fehlgeschlagener nativer Export meldet einen Fehler.
  Insbesondere das PDF-Studio meldet **erst nach erfolgreichem**
  Speichern „als PDF gesichert“ und gibt den Exportknopf erst danach
  wieder frei.

## Betroffene Ausgaben

| Bestehende Funktion | Format | Was sich auf iOS verbessert |
|---|---|---|
| PDF-Studio → „Als PDF sichern“ | PDF | Native Datei statt WebView-Download |
| PDF-Studio → „Seite als Bild sichern“ | PNG | Native Datei statt WebView-Download |
| Redion → Word exportieren | DOCX | Native Datei |
| Redion → Excel exportieren | XLSX | Native Datei |
| Redion → OpenDocument exportieren | ODS | Native Datei |
| Redion → Präsentation exportieren | PPTX | Native Datei |
| Redion → Obsidian-Vault exportieren | ZIP | Native Datei |

Die Funktionsaufrufe verwenden dieselbe `RedionNativeDateien`-Brücke
wie der bestehende Export von gespeicherten Anhängen (PR #129). Es
wird **kein zusätzliches Fremdpaket installiert**.

## Maschinelle Tests

Vor jedem Codemagic-Build wird nach `npm run bauen:ts` ausgeführt:

```sh
node --test ios/generated-download-routing.test.mjs
```

Dieser Test liest den **tatsächlich erzeugten JavaScript-Code** aus
`quell/bereiche/pdf/document-mode.js` und
`quell/bereiche/dateien/ausgeben.js`. Er prüft:

- Web ohne native Brücke: ursprünglicher Blob-Download, richtiger Name.
- iOS mit nativer Brücke: Bytes gehen an die native Schnittstelle,
  kein zusätzlicher Browser-Download.
- Fehlgeschlagener nativer Export: Fehlermeldung und kein Erfolg.
- PDF/PNG-Erfolgsmeldung erst nach `await herunterladen`.
- Alle sieben Word-/Excel-/ODS-/PowerPoint-/ZIP-Exportwege warten auf
  `await laden`.

Zusätzlich bleibt die Prüfschicht
`ios/vergleiche-webstand.mjs` aktiv. Sie stellt sicher, dass die
Webressourcen im iOS-Paket aus **demselben Git-Commit** stammen, ohne
`index.html` oder die Website zu verändern.

## Abnahme auf echtem iPhone

1. Vor dem Update eine `.redion`-Sicherung ausserhalb der App ablegen.
2. Pull Request zusammenführen und Codemagic-Build starten.
3. Neue IPA mit derselben App-ID und Apple-ID **über** die vorhandene
   Redion-App installieren. Nicht deinstallieren.
4. Im PDF-Studio ein Testdokument als PDF und eine Seite als PNG sichern.
5. Beide Dateien in **Dateien → Auf meinem iPhone → Redion → Exporte**
   finden, öffnen und auf Vollständigkeit prüfen.
6. Word, Excel, OpenDocument und PowerPoint mit Testinhalten ausgeben.
7. Exportierte Dateien nach Bedarf in **iCloud Drive** sichern.
8. Auf der Website dieselben Funktionen testen: die bisherige
   Benutzeroberfläche und Downloads müssen unverändert funktionieren.

**Grenzen:** Die lokalen Exporte unter `Auf meinem iPhone → Redion`
gehören zum App-Container und können beim Löschen der App verschwinden.
Ein erfolgreich angezeigtes iOS-Teilen-Menü beweist keine externe
Sicherung. Eine lokale Gerätetestfreigabe ist noch erforderlich.
