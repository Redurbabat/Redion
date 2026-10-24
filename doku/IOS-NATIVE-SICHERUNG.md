# Redion auf dem iPhone – Phase 1: Daten und Sicherungen

**Stand:** 24. Oktober 2026. Diese Änderung ist vorbereitet, aber **noch nicht auf einem iPhone verifiziert**.
Die bisher installierte App bleibt bis zu einer expliziten Neuinstallation unverändert.

## Was Phase 1 tatsächlich macht

- Die Capacitor-App-ID `ch.redurbabat.redion` steht jetzt dauerhaft in
  `capacitor.config.json`; der Cloud-Build prüft sie vor dem Verpacken.
- Die iOS-Version ersetzt den unzuverlässigen WebView-`<a download>`-Weg für
  **„Sicherung speichern“** durch `@capacitor/filesystem`.
- JSON- oder .redion-Sicherungen werden byteweise in kleinen Scheiben in
  **Dateien → Auf meinem iPhone → Redion → Backups** geschrieben, die
  tatsächlich geschriebene Grösse wird überprüft, erst dann wird die
  `.teil`-Datei umbenannt.
- Danach öffnet sich das iOS-Teilen-Menü, damit eine **zweite Kopie** in
  iCloud Drive oder auf einem anderen Speicher abgelegt werden kann.
- Webversion und PWA benutzen unverändert den bisherigen Download-Weg.
- Die bestehende IndexedDB bleibt unangetastet. Es gibt **keinen**
  automatischen Umzug, keine neue Datenbank und kein unbeaufsichtigtes
  Einspielen einer Sicherung.
- Der iOS-Build erstellt weiterhin das Xcode-Projekt auf Codemagic.
  Ein dauerhaft eingechecktes Xcode-Projekt und automatische Backups sind
  **nicht** Teil dieses ersten, bewusst kleinen Schritts.

## Test auf dem echten iPhone (vor produktiver Nutzung)

1. Auf der **bisherigen Redion-Version** wichtige Notizen und PDFs sichern.
   Sie nicht löschen. Sichere eine Kopie ausserhalb der App, falls vorhanden.
2. Diesen Pull Request mergen und in Codemagic einen neuen **manuellen**
   `Redion iPhone IPA (unsigniert)`-Build starten.
3. Die neue IPA **über die installierte App** signieren und installieren.
   Dieselbe Apple-ID und dieselbe App-Identität in iPASide verwenden.
   **Nicht deinstallieren:** Das löscht das lokale Datenverzeichnis.
4. Ohne Netzwerk starten. Vorhandene Notizen, PDFs und Anhänge öffnen.
   Die App schliessen und neu starten; dieselben Inhalte nochmals prüfen.
5. **Redion → Einstellungen → Import und Export → Sicherung speichern**
   öffnen. Für Anhänge muss eine `.redion` entstehen, ohne Anhänge eine
   `.json`. Der native Teilen-Dialog soll erscheinen.
6. In der iOS-Dateien-App unter **Auf meinem iPhone → Redion → Backups**
   prüfen, dass die Sicherung wirklich existiert und eine plausible Grösse
   hat. Anschliessend bewusst **In Dateien sichern → iCloud Drive** oder
   einen anderen Ort ausserhalb des Redion-App-Containers auswählen.
7. Eine **Test-Sicherung** auf einem getrennten Testbestand einlesen.
   Nicht den einzigen produktiven Datenbestand probeweise überschreiben.
8. Bei einem fehlgeschlagenen Test die alte Redion-App **nicht löschen**.
   Den Fehler anhand des Codemagic-Logs oder des iPhone-Screenshots beheben.

## Sicherheitsgrenzen

- Eine Sicherung in **Auf meinem iPhone → Redion** befindet sich noch im
  **App-Container**. Sie wird beim Löschen der App ebenfalls entfernt.
  Deshalb eine externe Kopie erstellen.
- Das iOS-Teilen-Menü zeigt nicht zuverlässig an, ob eine externe
  Kopie tatsächlich gespeichert wurde. Nachsehen in der Dateien-App.
- Signaturen kostenloser Apple-IDs laufen normalerweise nach sieben Tagen
  ab; eine Erneuerung mit derselben Apple-ID und App-Identität sollte lokale
  Daten nicht löschen. **Löschen und neu installieren tut dies sehr wohl.**
- Capacitor nutzt WKWebView und Redion nutzt weiterhin IndexedDB für die
  laufenden Daten. Speicherkorruption, iOS-Speicherbereinigung und
  App-Identitätswechsel können wir nicht allein mit dem neuen Export
  ausschliessen: ein Backup ausserhalb des App-Containers bleibt nötig.
- Fehler während der Sicherung führen nicht zu einer „gesichert“-Meldung.
  Unvollständige `.teil`-Dateien werden entfernt, ältere Sicherungen nicht.
- Die iOS-native Brücke wird **nur** im Codemagic-iOS-Webpaket eingebunden.
  Die lokale HTML-Einzeldatei und der PWA-Start sind nicht verändert.

## Automatisierbare Prüfung

`node --test ios/backup-chunks.test.mjs`

Der Test prüft Base64-Stücke anhand von Binärdaten verschiedener Grösse
inklusive Übergängen, leerer Datei und ungültiger Eingaben.
Codemagic führt ihn vor dem iOS-Build aus.
Der native Filesystem-/Share-Ablauf ist damit noch **nicht** auf echter
Hardware getestet.
