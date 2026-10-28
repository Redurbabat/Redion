# Redion Windows – automatische, signierte Updates

## Was sich für den Benutzer ändert

Bei einer späteren **signierten Windows-Installation** prüft Redion
selbstständig ca. 30 Sekunden nach dem Start und danach alle sechs
Stunden, ob eine neue Version vorhanden ist. Redion lädt das Update
automatisch; `electron-updater` installiert es beim **normalen
Beenden** der App. So wird die laufende Notizarbeit nicht durch
erzwungene Neustarts unterbrochen. Im Offlinebetrieb bleibt alles
lokal nutzbar und die Prüfung wird beim nächsten Start nachgeholt.

**Keine** Notiz, IndexedDB-Datenbank, Anhänge oder `.redion`-Sicherung
werden vom Update-System angerührt. Auch beim Update bleibt
`%APPDATA%\Redion` als beständiger Chromium-Datenordner erhalten.
`ch.redurbabat.redion.windows`, Name und die bisherige Oberfläche
ändern sich nicht.

## Aktueller Status: Quellcode vorbereitet, Verteilung noch ausstehend

Die bisherige, lokal aus `npm --prefix windows run dist`
gebaute **Redion 2026.8.3** hat noch **keinen Auto-Updater**.
Den kann man technisch nicht nachträglich in eine schon installierte
`.exe` einschalten. **Einmal** muss zuerst eine neue, signierte
Version auf dem Windows-Laptop installiert werden.

Wichtig: Das Redion-GitHub-Repository ist **privat**. Ein
Auto-Updater darf daher keinen GitHub-Personal-Access-Token in
ein Benutzerprogramm packen. Eine private GitHub-Releases-Adresse
allein reicht nicht für Updates anderer Windows-Geräte.

Für einen echten Update-Kanal fehlen gegenwärtig:
1. Eine vom Herausgeber kontrollierte **öffentlich erreichbare,
   nur über HTTPS ausgelieferte** Ablage für Windows-Releases
   (z. B. eine eigene R2-/CDN-Domain). Nur Installationsartefakte
   und Update-Metadaten werden dorthin hochgeladen, **nie**
   Projektcode, Benutzerdaten, Notizen oder Backups.
2. Ein **Windows-Authenticode-Code-Signing-Zertifikat** und
   der korrekte `publisherName`, sodass die heruntergeladene
   `.exe` gegen den unveränderten Herausgeber geprüft wird.
3. Ein vollständiger **Test von der älteren signierten Version
   zur nächsten signierten Version** auf einem echten Windows-PC.
4. Die einmalige Installation der **ersten signierten Version**.
   Danach sind neue Updates automatisiert möglich.

Keiner dieser externen Dienste wurde stillschweigend
eingeschaltet oder mit Zugangsdaten versehen.

## Technische Schalter (fail closed)

Die Quelle verwendet `electron-updater 6.8.10`
zusammen mit `electron-builder 26.18.0`.
Die Funktion läuft ausschließlich, wenn:

- Windows, **verpackte** und **installierte NSIS**-Version
  (Portable-Ausgabe ist ausgeschlossen);
- die signierte Installation `resources/app-update.yml`
  enthält und der Feed `provider: generic` mit einer
  gültigen **HTTPS-URL ohne Benutzername, Token oder Port** ist;
- die Buildkonfiguration `publisherName` enthält und
  die **Authenticode-Verifikation nicht deaktiviert** ist.

`autoDownload = true`, `autoInstallOnAppQuit = true`.
Downgrades und Vorabversionen sind aus. Fehler werden
protokolliert, aber **nicht** mit einem erzwungenen
App-Exit oder verloren gegangenen Inhalten beantwortet.
Die Update-Prüfung wird nach dem Start und alle
sechs Stunden wiederholt.

Bei normalem lokalen Build **ohne signierten Feed**
schaltet sich das Update-System automatisch ab.
Die von Redion bereits lokal gebaute unsignierte
`Redion Setup 2026.8.3.exe` bleibt benutzbar und
ändert seine Installationsweise nicht.

## Entwickler: lokaler Build bleibt wie bisher

```powershell
npm ci
npm run bauen:ts
npm install --prefix windows --no-package-lock --no-audit --no-fund
npm --prefix windows test
npm --prefix windows run dist
```

Das ist weiterhin ein **nicht zur Auto-Veröffentlichung
geeigneter** lokaler Build. Er sendet keine Updates und
benötigt keinen Server, Zertifikat oder Token.

## Herausgeber: Updatefähige signierte Release erstellen

Nur mit echtem freigegebenem HTTPS-Releaseserver und
Windows-Code-Signing-Zertifikat. Zuerst die Version in
`windows/package.json` **erhöhen** (über `2026.8.3`),
damit die neue App als Update erkannt werden kann.
Dann im Windows-Buildterminal, mit sensiblen
Variablen aus einem **geschützten Credential-Store**:

```powershell
$env:REDION_UPDATE_URL = 'https://<eigene-public-update-domain>/windows/'
$env:REDION_WINDOWS_PUBLISHER = '<Ausstellername laut Zertifikat>'
# CSC_LINK und CSC_KEY_PASSWORD nur in geschützten Build-Secrets setzen.
npm --prefix windows run release:signed
```

`release:signed` verweigert nicht-HTTPS-URLs,
fehlende Publisher-Angaben, fehlende
Signatur-Credentials und unveränderte Version
`2026.8.3`. Die Konfiguration nutzt einen
**generischen HTTPS-Publisher** und baut nur den
auto-updatefähigen **NSIS-Installer**. Nach dem
Build werden die Signatur mit Windows PowerShell
`Get-AuthenticodeSignature` und die generierte
`latest.yml` kontrolliert. Weder Secrets noch
Update-Zugangsdaten werden im App-Paket hinterlegt.

Die vom Build **gemeinsam** erzeugten Dateien:

```text
Redion Setup <version>.exe
Redion Setup <version>.exe.blockmap
latest.yml
```

werden **nach Abnahme** in dasselbe HTTPS-Verzeichnis
hochgeladen. `latest.yml` enthält SHA-512-Prüfsummen
und URLs der Updates; die heruntergeladene
NSIS-`.exe` muss zusätzlich die erlaubte
Windows-Signatur tragen. Für eine private GitHub-
Quelle ist **kein tokenbasierter Client-Zugang**
erforderlich.

## Tests und Abnahme

```powershell
npm --prefix windows test
```

`windows/auto-update.test.cjs` prüft:
unzulässige und unverschlüsselte Feeds,
fehlenden Signaturherausgeber, ausgeschaltete
Signaturverifikation, Entwickler-/Portable-
Ausschluss, Start- und Intervallprüfung,
automatischen Download und Update bei
normalem Beenden ohne erzwungene App-Schließung.

Vor dem echten Rollout:

1. Mit einem gültigen Zertifikat Version
   `2026.8.4` oder höher signiert bauen.
2. Erstversion manuell einmal auf Windows
   **über der bestehenden Installation**
   installieren, ohne Redion zu deinstallieren.
3. Testseite anlegen, Redion schließen und
   erneut öffnen, um den bestehenden
   IndexedDB-Speicher zu prüfen.
4. Höhere Version signieren, alle
   zugehörigen Artefakte im HTTPS-Kanal
   bereitstellen und auf dem Test-PC warten,
   bis das Update heruntergeladen wurde.
5. Redion normal schließen, erneut öffnen und
   Version, Inhalte, Anhänge, Sicherungen
   und Datenbank vollständig kontrollieren.
6. Signaturfehler, fehlende Metadaten,
   falsche URLs sowie Offline-Zustand
   gesondert testen.

**Grenze:** Kein echtes Update wird verteilt,
solange der HTTPS-Feed und das Signierzertifikat
nicht eingerichtet sind. Es gibt noch keinen
bestätigten Windows-End-to-End-Updatetest.
