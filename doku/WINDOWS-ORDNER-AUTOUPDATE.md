# Redion Windows – GitHub-Ordner automatisch übernehmen

## Einmal einrichten

**Voraussetzung:** Die Windows-App muss einmal mit einer neuen Version
installiert werden, die diese Funktion enthält. Eine bereits vorhandene
Redion-2026.8.3-EXE kann nicht selbst durch ein GitHub-Commit verändert
werden. Es wird **kein GitHub-PAT** in die App eingebaut.

1. Mit **GitHub Desktop** das private Repository `Redurbabat/Redion`
   auf den Windows-PC klonen bzw. im bestehenden Projekt auf **Fetch origin**
   und **Pull origin** klicken. Der Quellordner enthält `package.json`,
   `index.html`, `quell/start.js`, `version.json` und `version.md`.
2. Die neue Windows-App öffnen und im Menü **Entwicklung →
   Lokalen Redion-Ordner verbinden …** wählen.
3. **Diesen lokalen Projektordner** auswählen und den ausdrücklichen
   Sicherheitshinweis bestätigen. Die App startet einmal neu.
4. Fortan GitHub Desktop zum Herunterladen der GitHub-Änderungen verwenden.
   Änderungen an fertigen Webdateien (`quell/`, `index.html`, CSS,
   JavaScript, Bilder) werden erkannt und automatisch übernommen. Es
   ist **keine manuelle Bauaktion**, **kein Strg+R** und **kein erneuter
   Installer** für reine Weboberflächen-Änderungen nötig.
5. Unter **Hilfe → Version und Änderungen …** sieht man die
   **installierte EXE-Version** und die **Version der gerade geöffneten
   Webdateien**. Die vollständige Änderungshistorie steht in
   `version.md`.

Die Synchronisierung vom GitHub-Server in den lokalen Ordner erledigt
weiterhin **GitHub Desktop**. Der Windows-App wird dabei **kein**
privater GitHub-Zugang oder GitHub-Token gegeben. Sie beobachtet
ausschliesslich die **bereits lokal gespeicherten** Dateien.

## Was wirklich aktualisiert werden kann

**Ohne neue EXE:** Änderungen an `index.html`, `quell/**/*.js`,
Stilblättern, Bildern, Lernpaketen und anderen installierten
Webressourcen. Das schliesst z. B. neue Funktionen im
Batterie-Schaltplan ein, **wenn die kompilierten Dateien in
`quell/` ebenfalls im GitHub-Checkout liegen**.

**Mit neuer EXE:** Änderungen am nativen Windows-Programm
(`windows/main.cjs`, Electron-Bridge, Berechtigungen,
Dateidialogen, `windows/package.json`, Laufzeit oder Installer).
Unkompilierte `src/**/*.ts`-Änderungen allein reichen nicht;
sie müssen vorher als nutzbare JS-Ausgabe in `quell/` übersetzt
sein. Ein Checkout ist **kein Quellcode-Compiler der installierten App**.

## Sicherheit, Speicher und Fehlerfälle

- Nur nach **bewusstem Opt-in** wird JavaScript aus dem lokalen
  GitHub-Ordner ausgeführt. Deshalb nur den selbst kontrollierten
  Redion-Checkout wählen und Änderungen aus fremden Pull Requests
  vor dem Herunterladen prüfen.
- Redion kopiert ausschliesslich freigegebene Webdateien in
  einen **separaten, versionierten Zwischenstand**. Es führt
  **keine Node-Skripte aus dem Checkout** aus. Symlinks, unbekannte
  Rootdateien und übergrosse Einzeldateien werden abgelehnt.
  `src/`, `.git/`, `.env` und Windows-Native-Quellen
  werden **nicht** in die Webansicht übernommen.
- Die lokale Codevorschau verwendet **`%APPDATA%\Redion-Entwicklung`**
  (separater IndexedDB-Speicher). Die normale Windows-App
  verwendet weiterhin **`%APPDATA%\Redion`**.
  Lokal ausprobierter JavaScript-Code greift nicht stillschweigend
  auf die produktiven Notizen zu. Zum Testen von Notizen ausdrücklich
  eine `.redion`-Sicherung exportieren/importieren.
- Beim Dateipull wartet Redion auf einen vollständigen Dateistand.
  Bei fehlenden/kaputten Dateien bleibt der vorherige Stand aktiv.
  Der Renderer wird erst nach `Store.flush()` neu geladen und
  **nicht während einer aktiven Eingabe oder eines offenen Dialogs**.
- Das lokale Quellverzeichnis wird **niemals** von Redion beschrieben.
  Änderungen im GitHub-Ordner nimmt nur Git/GitHub Desktop vor.
- Unter **Entwicklung → Lokalen Ordner trennen** kann der Modus
  wieder beendet werden. Nach einmaligem Neustart öffnet Redion
  wieder die **installierte Version** mit dem ursprünglichen
  Datenprofil. Entwicklungsdaten werden nicht gelöscht.

## Versionsregeln

Unter `version.md` wird **jede neue Release-Nummer** mit Datum,
Status, Änderungen und etwaigen Einschränkungen dokumentiert.
`version.json` dient der Anzeige in Redion. Die Versionsnummern
in `package.json`, `package-lock.json`, `windows/package.json`
und `version.json` müssen übereinstimmen und werden durch
`npm run version:pruefen` geprüft.

Die Versionsnummer wird **pro freigegebenem Änderungsstand**
aktualisiert, **nicht bei jedem Dateispeichern**. Ein GitHub-Commit
ist keine veröffentlichte oder installierte Windows-Version.
`2026.8.4` ist im aktuellen Stand eine **Entwicklungsversion**.

## Technisch überprüfen

```powershell
npm ci
npm run version:pruefen
npm run bauen:ts
node node_modules/typescript/bin/tsc -p windows/tsconfig.json
npm --prefix windows test
npm --prefix windows run dist
```

Auf einem echten Windows-PC zusätzlich prüfen:
- `Redion.exe` zunächst **ohne** verbundenen Ordner starten;
  vorhandene Notizen müssen unverändert sein.
- Ordner einmal verbinden und dann GitHub Desktop → Pull.
- Webstand/Versionsanzeige aktualisieren; Text während des
  Downloads bearbeiten und Datenerhalt kontrollieren.
- Fehlendes `index.html` oder fehlerhafte Symlinks dürfen
  keine halb aktualisierte Ansicht aktivieren.
- Ordner wieder trennen; ursprüngliche Redion-Notizen
  müssen unverändert sichtbar sein.
- In der Offline-Variante bleiben die zuletzt installierten
  Webdateien ohne GitHub weiterhin verfügbar.

**Abnahme:** Die echte Windows-Laufzeit, der Installer und eine
signierte Aktualisierung müssen vor einer Produktfreigabe auf
Windows geprüft werden. Die lokale Ordnerübernahme ersetzt
den signierten Auto-Updater nicht.
