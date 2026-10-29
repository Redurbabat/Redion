# Redion auf iPhone und Windows – Integrationsstand

29. Oktober 2026 · Branch `codex/iphone-windows-integration`, aus main
`326533b06`. Der pausierte Glass-Wheel-Branch wird nicht eingebaut.

## Was dieser Bogen umsetzt

- Einstellungen → **iPhone und Windows**: echte Plattform, Verfügbarkeit der
  lokalen Ablage, letzte vollständige Sicherung, bestehender Abgleich-/Konfliktstand,
  gemeinsamer Web-Code-Stempel und sichere Anleitung für die Geräteübertragung.
- Windows: native Dateiauswahl (`Strg+O` / Datei → Öffnen), Empfang von `.pdf`
  und `.redion` über „Öffnen mit“, Weiterreichen an die bereits laufende App.
  Der Installer registriert die Zuordnungen; der Standard-PDF-Reader wird nicht
  durch Anwendungscode verändert.
- Windows-Export: vorhandene PDF-/Office-/Anhangs- und Sicherungswege benutzen
  einen Speichern-Dialog. Megabyte-Stücke, Größenkontrolle, Flush und Umbenennen
  einer temporären Datei. Abbrechen/Fehler ist kein erfolgreicher Sicherungszeitpunkt.
- iPhone: PDF-/Text-/Bild-/Redion-Dokumenttypen, kalter und warmer UIScene-Eingang,
  Security-Scope mit koordiniertem Kopieren und persistente native Arbeitskopie.
  Der Adapter liest in Stücken und führt zum gleichen Import-/Sicherungsdialog.
  Eine fehlgeschlagene Übernahme wird nicht als erledigt bestätigt.
- Keine neue Datenbank, kein Sicherungsformatwechsel und kein Ersatz von Editor,
  PDF-Ink, Dock oder Reitern. Bestehende Start-/Reiterwiederherstellung bleibt.
- Windows-App-ID, `redion-local://app`, `%APPDATA%\Redion` und iOS-Bundle-ID
  `ch.redurbabat.redion` bleiben unverändert.
- GitHub-IPA-Bau verwendet jetzt dieselben Schritte wie Codemagic, statt die
  Capacitor-Konfiguration zu überschreiben und eine andere, adapterlose IPA zu bauen.
- Manueller Windows-CI-Bau mit Installer/Portable-Artefakten. Kein Auto-Release.
- Windows-Webpaket wird byteweise mit der Quelle verglichen. Fehlende/geänderte/
  veraltete Assets brechen den Bau ab. Native Quellen und Bauordner sind zusätzlich
  von Cloudflare-Assets ausgeschlossen.

## Native Vertrauensgrenze

`windows/files.cts` und `preload.cts` werden separat durch TypeScript nach
`windows/generated/` gebaut. Diese ignorierten Ausgaben werden nur in die EXE,
nicht als Webassets eingebaut. Keine neue Bibliothek wird hinzugefügt.

Der Renderer erhält ausschließlich kurzlebige Datei-Kennungen aus nativen
Dateiwählern/OS-Übergaben. Keine freien Systempfade, kein allgemeines IPC,
kein Node-/Dateisystemobjekt. Jeder IPC-Aufruf prüft Sender, Hauptframe und
die genaue lokale Einstiegsdatei; Redions Fragmentnavigation ist erlaubt,
andere Pfade, Querystrings, fremde Fenster und Frames sind es nicht.

Originale werden nie geändert oder gelöscht. Verworfene Exportstücke und
bestätigte iOS-Arbeitskopien sind die einzigen selbst angelegten temporären
Dateien, die die Adapter bereinigen. Bei Abbruch wird nichts importiert.
Nach Absturz zwischen Speichern und nativer Bestätigung kann die erneute
Dateiübernahme wieder fragen; sie importiert nicht still im Hintergrund.

## Prüfen und bauen

```powershell
npm run bauen:ts
npm run typecheck
node node_modules/typescript/bin/tsc -p windows/tsconfig.json
node --test pruefungen/native-windows-files.mts pruefungen/native-build-parity.mts
node --test windows/windows-desktop.test.cjs ios/*.test.mjs ios/native-documents.test.mts
node pruefungen/device-integration.mts
npm --prefix windows run prepare:app
node pruefungen/windows-app-smoke.mts
npm --prefix windows run dist
node windows/compare-web.mts
npm run bauen
```

Der Electron-Smoke-Test setzt ausschließlich in SEINEM Testprozess `appData`
auf einen neu erzeugten temporären Ordner. Das bestehende Windows-Profil
wird weder geöffnet noch ersetzt. Geprüft sind echter Offline-App-Start,
isolierte Brücke, IPC nach Fragmentnavigation und dieselbe Testnotiz nach Neustart.

Gezielte Regression: `node pruefungen/alle.mts 76 77 78 87 96 100 105 113 118 290 298 537`.
Die neue Export-Gegenprobe mit `REDION_NATIVE_TEST_MUTANT=1` entfernt nur im
Test die Vollständigkeitskontrolle: Der Exporttest wird nachweislich rot.
Diese Variable gehört nie in die Produktkonfiguration.

Echte Browserbilder liegen lokal unter `bilder/geraete-integration/`: vier
Größen (390×844, 430×932, 1366×768, 1440×900), hell/dunkel, normale Übersicht
und aufgeklappte Anleitung; zusätzlich ein Bild der echten Electron-App.
Keine Screenshots oder privaten Daten werden auf GitHub abgelegt.

## Einspielen auf deine bestehenden Geräte

### Bisheriger Abschlussbefund

- Typecheck, Web-/Einzeldatei- und Windows-Bau erfolgreich.
- 173 native/Build-Unitprüfungen erfolgreich, keine übersprungen.
- Alle zwölf gezielten Regressionen grün; test87 nach Korrektur der
  Komponenten-CSS-Reihenfolge erneut mit 185/185. Sicherung/Anhänge 18/18 und
  35/35, erzeugte Quellen 344/344, Zwei-Geräte-Abgleich und Konflikte grün.
- iOS und Windows: jeweils 484 gemeinsame Webdateien bytegleich zur Quelle;
  zusätzliche iPhone-Brücke tatsächlich lokal gebündelt. Die vier nativen
  Dateien im Windows-ASAR wurden ebenfalls mit ihren Bauquellen verglichen.
- Acht Browserfälle mit Tastatur-/44-px-/Überlaufkontrolle, ruhiger Bewegung,
  echtem Import und Sicherungsfehlerprüfung erfolgreich. Native Electron-
  Neustartprüfung erfolgreich. Screenshots tatsächlich angesehen.
- Die 46 von test109 beanstandeten nativen/Prüf-JavaScriptdateien sind
  sämtlich bereits im main-Baum enthalten. Keine neue handgeschriebene
  JavaScriptdatei ergänzt, keine pauschale Erweiterung der Bestandsausnahme.

Die nativen Mac-/iPhone-Prüfungen und produktiver Live-Sync sind damit
ausdrücklich noch NICHT freigegeben.

**Vorher jeweils extern sichern, bestehende Apps nicht deinstallieren.**

Windows: lokalen Setup-Build aus `build/windows-dist/` verwenden, zunächst
auf einem Testprofil prüfen. Normale Installation mit derselben App-ID/
demselben Produktnamen aktualisieren. Danach den Web-Code-Stempel unter
Einstellungen → iPhone und Windows kontrollieren. Kein automatischer Installerstart.

iPhone: den geprüften Branch/Commit in Codemagic auswählen. Der bestehende
Workflow bleibt unsigniert; die IPA mit DEINEM bisherigen Signierverfahren und
derselben effektiven Bundle-ID als Update installieren. Auf dem Gerät prüfen:
Dateien → PDF/`.redion` → mit Redion öffnen → Import bestätigen; Abbrechen,
Neustart, Offline-Start und externer Sicherungsexport. Share-/Widget-Targets
bleiben separat opt-in, weil App-Group-Provisioning noch erforderlich ist.

Gleicher Quellcommit ist eine gemeinsame Quelle. Die Byteprüfungen sind der
Beweis des eingebauten Webcodes, kein Beweis für einen bereits installierten
oder veröffentlichten Stand. Noch kein neuer nativer Mac-/iPhone-Build wurde
in diesem Windows-Arbeitsgang ausgeführt.

## Nicht fertig / externe Voraussetzungen

1. **Live-Sync:** Redur hat keinen Sync-Server. D1/R2, richtiges Konto, HTTPS-Host,
   erste Anmeldung und der sichere native Access-/CORS-Weg sind offen.
   [Einrichtung und Sicherheitsgrenzen](SYNC-ERSTEINRICHTUNG.md).
   Kein produktiver Upload und kein Abschalten der bestehenden Schutzschicht.
2. **Signierung/Updates:** Windows-Builds sind ohne Zertifikat unsigniert.
   Signiertes Auto-Update braucht einen festgelegten vertrauenswürdigen
   Veröffentlichungskanal und Signierung; es wird hier nicht vorgetäuscht.
   TestFlight ist ebenfalls nicht eingerichtet; Redurs bisheriger Codemagic-/IPA-Weg bleibt.
3. **Geräteabnahme:** Echter Xcode-/Swift-Bau, iPhone-Dateiprovider, bestehende
   Daten beim In-place-Update, VoiceOver und Hardware-Tastatur müssen noch auf
   echter Hardware geprüft werden. Ein Browser in iPhone-Größe ersetzt das nicht.
4. **Gesamtregression:** Kein vollständiger grüner Gesamtlauf behauptet.
   Die JavaScript-Bestandsprüfung test109 meldet bereits auf main vorhandene
   handgeschriebene native `.mjs/.cjs`-Quellen. Deren pauschale Ausnahme wird
   nicht erweitert. Nur explizite native Bauausgaben werden nicht mehr als
   vermeintliche neue Quellen gezählt.

Der Befund zu fehlendem Server und Access stammt aus der lokalen Konfiguration,
nicht aus einem Zugriff auf ein Cloudflare-Konto. Konto, Abrechnung und
öffentliche Ressourcen wurden nicht verändert. Keine Veröffentlichung oder main-Änderung.
