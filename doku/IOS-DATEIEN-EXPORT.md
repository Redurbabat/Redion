# Redion iOS – Anhänge direkt in die Dateien-App exportieren

**Stand: 24. Oktober 2026 · Stand dieser Änderung: programmiert und mit Node-Mocks getestet; noch kein Echtgerätetest.**

## Neue Funktion auf dem iPhone

Redions bisheriger Knopf **„Herunterladen“** für gespeicherte Dateianhänge
(PDFs, Bilder, Office-Dateien usw.) führt in der **nativen iPhone-App**
nun über die schon verwendeten Capacitor-Plugins direkt in die
**iOS-Dateien-App**:

1. Die Datei wird aus Redions vorhandener IndexedDB geholt, ohne
   die Originaldatei zu ändern.
2. Der native Adapter schreibt die Bytes in Scheiben von maximal 256 KiB
   in eine `.teil`-Datei, prüft ihre Grösse und benennt sie erst dann um.
3. Die gespeicherte Kopie erscheint unter
   **Dateien → Auf meinem iPhone → Redion → Exporte**.
4. Das iOS-Teilen-Menü öffnet sich mit einer **echten Datei** (Capacitor
   `Share.share({ files: [uri] })`). Wer dauerhaft ausserhalb der App
   sichern will, wählt **In Dateien sichern → iCloud Drive**.

Die vorhandene native Sicherung erhält dieselbe getestete Dateiausgabe
und behält ihren Ordner **Backups**. Das Teilen benutzt ebenfalls das
`files`-Feld statt nur `url`, damit iOS eine Datei samt Erweiterung
empfängt.

Dateinamen aus Redion werden normalisiert: keine Pfadtrenner,
Steuerzeichen oder unzulässigen iOS/Windows-Zeichen in exportierten
Dateipfaden. Datum und eindeutige Kennung verhindern Überschreiben.

## Die Website und PWA bleiben unverändert

Der Code in `src/bereiche/dateien/ablage.ts` bietet **denselben Knopf**
in beiden Laufzeitumgebungen. Nur wenn im iOS-Paket
`RedionNativeDateien.speichern` existiert, verwendet er den nativen
Dateipfad. Andernfalls läuft **derselbe bisherige Browser-Blob-Download**.

Es gibt keine Änderungen an `index.html`, CSS, UI-Anordnung, PWA,
Datenbankstruktur, Web-Berechtigungen oder Server.

Die iOS-Bridge aus `ios/native-sicherung.ts` und die reine Dateiausgabe
`ios/native-file-export.mjs` werden **nur** von Codemagic in
`www/redion-native-sicherung.js` gebündelt. Die Kontrolle aus
`ios/vergleiche-webstand.mjs` prüft weiterhin alle gemeinsam genutzten
Web-Dateien auf identische Bytes.

## Prüfen

Im Repository:

```sh
node --test ios/native-file-export.test.mjs
node --test ios/backup-chunks.test.mjs
```

Die Tests prüfen unter anderem echte PDF-Bytes über mehrere Chunks,
Share-Datei-URL, abgebrochenen Teilen-Dialog, ungültige Namen,
unterbrochenen Schreibvorgang, abweichende Bytezahl und den Ordner
`Backups`. Codemagic führt sie vor der IPA-Erstellung aus.

**Wichtig:** Diese Node-Tests sind keine Xcode-/iPhone-Tests. Erst nach
einem erfolgreichen Codemagic-Build auf dem echten Gerät:
- Eine **Test-PDF** in Redion importieren und über den vorhandenen
  „Herunterladen“-Knopf exportieren.
- **Dateien → Auf meinem iPhone → Redion → Exporte** prüfen.
  PDF dort öffnen, kontrollieren, dass Grösse und Seiten stimmen.
- Im Teilen-Menü **In Dateien sichern → iCloud Drive** auswählen und
  dort die zweite Kopie wirklich überprüfen.
- Ein `.redion`-Backup aus **Backups** genauso prüfen.
- Auf der Website denselben Knopf ausprobieren: dort weiterhin
  gewöhnlicher Download, keine nativen Dialoge.
- Wenn etwas scheitert: **Redion nicht deinstallieren**. Unveränderte
  Originaldaten bleiben in IndexedDB; ein Update nur über die App legen.

## Grenze

**Dateien → Auf meinem iPhone → Redion** gehört zum lokalen
App-Container: Bei einer Deinstallation können diese Exporte und die
IndexedDB verloren gehen. Das Teilen-Menü öffnet lediglich eine Auswahl;
es beweist **nicht**, dass bereits eine externe Kopie gespeichert ist.

Es werden keine Daten an Dritte hochgeladen. Nur wenn die Nutzerin oder
der Nutzer selbst im Share Sheet eine externe App/einen Cloudspeicher
auswählt, werden die ausgewählten Dateien an dieses Ziel übergeben.
