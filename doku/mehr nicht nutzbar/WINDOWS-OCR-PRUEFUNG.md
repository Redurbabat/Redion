# Redions OCR-Prüflauf auf Windows 11

**Datum:** 24. Oktober 2026. Nur Testwerkzeuge werden angepasst.

## Warum

Der vorhandene Integrationslauf `test216` ersetzt Tesseract durch ein
Testprogramm, damit kein Nutzer für die Prüfung erst eine OCR-Engine
installieren muss. Bisher war dieses Programm ein Unix-`#!/bin/sh`-
Skript. Das funktioniert nicht als direkt ausführbares
`tesseract`-Programm auf Windows. Zudem wurde `PATH` fest mit
einem Doppelpunkt statt `path.delimiter` zusammengesetzt.

Das ist relevant, weil Redion auf Windows 11 gebaut wird und Redion
bei OCR-Bildern keine Inhalte an fremde Dienste senden darf.

## So läuft die Prüfung neu

- **macOS/Linux:** wie bisher ein kleines, ausführbares
  `tesseract`-Shell-Skript im Testordner.
- **Windows:** Die in Windows 11 integrierte **Windows PowerShell**
  verwendet `Add-Type`, um für den Test aus einer kleinen, eigenen
  C#-Datei `tesseract.exe` im **temporären Testordner** zu erstellen.
  Es wird weder Tesseract installiert noch ein neues Paket geladen.
- Beide Programme lesen wirklich die Bild-Datei, berichten deren
  Länge, Sprache und die simulierte Version 5.9.0.
- `PATH` wird mit `path.delimiter` zusammengefügt.
  Auf Windows wird darauf geachtet, nie `Path` und `PATH`
  gleichzeitig an einen Kindprozess zu geben.
- Der echte OCR-Dienst `dienste/ocr.mts` startet das Testprogramm
  weiter mit `spawn('tesseract', ..., { shell: false })`:
  **keine** Shell und keine Übernahme fremder Befehle aus Dateinamen.

## Wie testen

```sh
node --test pruefungen/ocr-test-stub.test.mjs
node pruefungen/lauf/test216.mts
```

Vier neue Tests prüfen den PATH, die echten Bild-Bytes unter Unix,
den sicheren PowerShell-Kompilieraufruf und den Abbruch bei einer
fehlenden Windows-EXE. Die portablen Tests sind in Codemagic
eingebunden.

**Noch zu testen:** Die tatsächliche EXE-Kompilierung unter Windows 11
und `test216` Ende-zu-Ende auf Windows. Die unter Linux ausgeführten
Mock-Tests können die Windows-PowerShell-Kompilierung nicht bestätigen.
Wenn Windows PowerShell oder die zugehörige .NET-
Kompilierungsfunktion durch eine Unternehmensrichtlinie gesperrt
ist, schlägt der Test mit einer echten Fehlermeldung fehl. Die App
selbst braucht diesen Compiler nicht.

## Unverändert

`index.html`, Design, PWA, iOS-Code, `src/`, `quell/`,
Nutzerdaten, OCR-Verhalten, Cloud-Konfiguration und sämtliche
öffentlichen Website-Funktionen werden **nicht verändert**.

Bei diesem Prüflauf werden nur temporäre Testbilder an den
lokalen Prozess auf `127.0.0.1` gesendet. Es gibt keine
Fremdserver- oder Benutzerkontenpflicht.
