# Redion als echte Windows-Desktop-App

## Was das ist

**Redion für Windows** wird als installierbare `.exe`-Anwendung
gebaut. Sie bekommt ein eigenes Fenster, einen Eintrag im Startmenü
und auf Wunsch ein Desktop-Symbol. Sie braucht **weder Safari,
Edge noch eine geöffnete Website**: Electron liefert die bereits
existierende Redion-Oberfläche und die Chromium-Laufzeit zusammen
mit der App aus.

Das ist ein vollwertiges **Desktop-Programm mit eingebetteter
Webtechnik**, keine neu programmierte WinUI-3-Oberfläche. Genau
dadurch bleiben die vielen bestehenden Redion-Funktionen und
Bedienelemente erhalten. Keine zweite Redion-Datenbanklogik.

## Lokaler Speicher und Identität

Die Windows-App verwendet eine konstante, sichere lokale Herkunft:

```text
redion-local://app/index.html
```

Sie ist in Electron als `standard` und `secure` registriert,
damit relative Ressourcen und insbesondere **IndexedDB** unter
einer beständigen Herkunft funktionieren. Alle Dateien werden
ausschließlich aus dem mitgelieferten Paket
`resources/redion-web` gelesen. Es läuft **kein localhost-Server**,
es gibt keinen Remote-Website-Start und keinen Cloud-Zwang.

Der Chromium-Profilspeicher liegt dauerhaft unter:

```text
%APPDATA%\Redion
```

Dort speichert die bereits vorhandene Redion-Anwendung ihre
Seiten, Datenbanken, Anhänge und Einstellungen in IndexedDB.
Es darf bei Updates **nicht gelöscht, umbenannt oder in ein
Versionsverzeichnis verschoben** werden. Auch das Windows-
Installationsprogramm darf dort keine Daten bereinigen.

Die Windows-App verwendet ihre eigene App-ID
`ch.redurbabat.redion.windows`; die iOS-ID
`ch.redurbabat.redion` bleibt unverändert.

## Vom iPhone / Safari auf den Laptop wechseln

**Wichtig:** Safari, die native iPhone-App und Windows
haben zuerst **getrennte lokale Speicher**. Nur durch die
Installation einer Windows-App erscheinen die iPhone-Notizen
nicht automatisch dort.

Für die erste sichere Übernahme:

1. Auf **dem Gerät und in der Redion-Variante mit den
   gewünschten Inhalten** eine **vollständige `.redion`-Sicherung**
   mit Seiten, Datenbanken und Anhängen exportieren.
2. Die Sicherungsdatei über die Dateien-App, einen USB-Stick
   oder eine bewusst ausgewählte Übertragungsmethode auf
   Windows bringen.
3. Die Windows-App öffnen und dort Redions bereits vorhandene
   **Sicherungs-Importfunktion** verwenden.
4. Dokumente, Datenbanken, Anhänge und Verlauf auf Windows
   kontrollieren. Die Originaldatei als Sicherheitskopie
   separat aufbewahren.

**Keine automatische Synchronisierung** ist Bestandteil
dieses ersten Windows-Desktop-Builds. Der Redion-Cloud-
Server ist noch nicht produktiv freigegeben. iPhone und
Windows können zunächst unabhängig offline arbeiten.

## Windows 10/11 – lokal bauen

Benötigt werden Node.js (mindestens 22.18, empfohlen 24)
und npm auf einem Windows-x64-Rechner. Im
Redion-Projektverzeichnis PowerShell öffnen:

```powershell
npm ci
npm run bauen:ts
node --test windows/windows-desktop.test.cjs
npm install --prefix windows --no-package-lock --no-audit --no-fund
npm --prefix windows run dist
```

Der Builder soll die folgenden Dateien erzeugen:

```text
build/windows-dist/Redion*Setup*.exe     # Windows-Installer
build/windows-dist/Redion*.exe           # portable Windows-Ausführung
```

Die genaue Namensgebung hängt von electron-builder ab. Die
`windows/package.json`-Konfiguration enthält ein
NSIS-Installationsprogramm und eine portable x64-EXE.

Für die Entwicklungsansicht:

```powershell
npm ci
npm run bauen:ts
npm install --prefix windows --no-package-lock --no-audit --no-fund
npm --prefix windows start
```

**Nachtrag 29. Oktober 2026:** Setup und portable EXE wurden lokal auf
Windows gebaut. Der echte Electron-Prozess startet offline und erhält eine
Testnotiz über einen Neustart; ausschließlich ein temporäres Testprofil
wurde benutzt. Die ausführbare Paketkopie enthält dieselben nativen Quellen
und denselben Webcode. Das ist noch keine Prüfung eines installierten,
signierten Updates mit echten Nutzerdaten. Details und offene Freigaben:
[iPhone-/Windows-Integration](IPHONE-WINDOWS-INTEGRATION.md).

## Sicherheit

- `nodeIntegration: false`, `contextIsolation: true`,
  `sandbox: true` und `webSecurity: true`.
- Keine Node-APIs im Redion-Editor und keine Datei-/
  System-IPC-Methoden für importierte Inhalte.
- `windows/paths.cjs` lässt ausschließlich echte Dateien
  innerhalb des mitgelieferten Offline-Verzeichnisses zu,
  keine Pfadüberquerung oder fremden Schemas.
- Fremde HTTP(S)-Links öffnen sich außerhalb Redions im
  Standardbrowser; sie ersetzen nicht die Desktop-App.
- Windows-Profil und Backups werden niemals in den
  Paketinhalt kopiert oder ins Git-Repository aufgenommen.
- `windows/prepare.mjs` kopiert die generierten Webdateien
  nur nach `build/windows-app`, nie nach `ios/`,
  `src/` oder `quell/`.
- Updates müssen in-place erfolgen, mit unveränderter
  `productName`, `appId` und `userData`-Adresse.

## Offene Freigabepunkte

1. Den vollständigen Node-Testlauf und Windows-Electron-
   Installer-Build auf einem echten Windows-x64-Rechner
   oder einem funktionierenden Windows-Buildrunner ausführen.
2. Die neue Redion-Installation einmal ohne Internet öffnen.
   Seiten, Datenbanken, Tabellen, Editor, Suchfunktion,
   PDF-Dateien, Zeichnungen und Lernwelt prüfen.
3. `.redion`-Import/export mit Anhängen und
   anschließendem App-Neustart testen. Speicherort
   `%APPDATA%\Redion` zwischen Updates verifizieren.
4. Setup- und portable Variante getrennt installieren/
   starten; Windows-Startmenü und Original-Icon kontrollieren.
5. Ein signiertes Installationspaket für die reguläre
   Verteilung einrichten. **Unsig­nierte EXEs können
   Windows-SmartScreen-Warnungen auslösen.**
6. Native Dateiauswahl, Speichern-Dialog und „Öffnen mit Redion“ sind im
   Integrationsbranch ergänzt. Deren Installer-/Gerätefreigabe bleibt offen;
   bestehendes Drag&Drop wird wiederverwendet. Integrations-Suche und eine
   produktiv eingerichtete, verschlüsselte iPhone↔Windows-Synchronisierung
   bleiben spätere Schritte. Es wird kein Server oder Abgleich automatisch aktiviert.

**Die bestehenden iPhone- und Web-App-Pfade bleiben unberührt;
der Windows-Build liegt vollständig unter `windows/`
und `build/windows-*`.**
