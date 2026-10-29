# Redion iPhone ↔ Windows – Startprüfung ohne Datenrisiko

## Zweck

Vor der ersten Kopplung von iPhone- und Windows-App müssen wir
ausdrücklich **zwei verschiedene lokale Datenbestände** schützen.
Eine irrtümlich verwendete Cloudflare-Datenbank oder ein zu früh
aktivierter bidirektionaler Abgleich darf keine Notizen löschen.

**Dieser Schritt ist ein read-only Preflight, noch keine Synchronisierung.**
Weder `wrangler.toml` noch Cloudflare-Konto, Worker, D1, R2, SQLite,
IndexedDB, iPhone-App, Windows-Installer oder `.redion`-Backups
werden durch den Check geändert.

## Ein Befehl auf dem Windows-Laptop

PowerShell im vorhandenen lokalen Repository:

```powershell
cd "$env:USERPROFILE\Documents\ChatGPT\Redion\Redion-src"
git pull --ff-only origin main
npm run sync:check
```

**Achtung:** Solange diese Änderung noch als PR vorliegt, ist
`sync:check` erst auf dem PR-Branch verfügbar, nicht auf `main`.
Vor der Freigabe von `main` keine eigenen Quellen überschreiben.

Der Befehl zeigt für jede Voraussetzung `[OK]` oder
`[OFFEN]` und die nächsten lesenden Cloudflare-Befehle.
Er installiert kein Wrangler, braucht keine Anmeldung, öffnet
keine Ports und nimmt keinen Server-Deploy vor.
Für automatisierte Checks: `npm run sync:check -- --json`;
für CI-Fail bei fehlenden Voraussetzungen:
`npm run sync:check -- --strict`.

## Warum Cloudflare aktuell OFFEN meldet

`wrangler.toml` enthält die früheren D1-/R2-Beispiele
**nur als auskommentierte Blöcke**. Das ist beabsichtigt:
Die historisch verwendete D1-ID wurde in einem anderen
Cloudflare-Konto gefunden als dem für `red-ion` vorgesehenen.
Sie blind zu aktivieren wäre falsch.

Die Prüfung akzeptiert nur **genau eine** aktive Bindung:

```toml
[[d1_databases]]
binding = "DB"
database_name = "redion"
database_id = "<UUID DER DATENBANK IM KORREKTEN KONTO>"

[[r2_buckets]]
binding = "R2"
bucket_name = "redion-dateien"
```

Eine formal gültige UUID allein belegt **nicht**, dass
die Datenbank im richtigen Konto existiert. Der Status
bleibt deshalb unter Vorbehalt der Remote-Prüfung.

## Das richtige Cloudflare-Konto ermitteln – nur lesend

```powershell
npx wrangler whoami --json
npx wrangler d1 list --json
npx wrangler r2 bucket list
```

Diese Wrangler-Kommandos lesen Informationen aus dem
aktuell angemeldeten Cloudflare-Konto. Sie erstellen,
bearbeiten oder löschen nichts. Die Ausgabe von
`whoami --json` kann **private Kontodaten** enthalten:
nur Kontonamen/Kennung vergleichen, niemals Tokens oder
vollständige Ausgabe öffentlich teilen.

Falls mehrere Cloudflare-Konten aufgeführt werden,
erst **im Dashboard bestätigen**, in welchem Konto
Worker `red-ion` wirklich läuft; dann D1 und R2
innerhalb **desselben** Kontos prüfen. **Nicht**
die alte Kennung aus dem Kommentar übernehmen.

Erst nach dieser Bestätigung kommen separate,
ausdrücklich freigegebene Installationsschritte
für D1-Schema, R2, Worker-/Secret-Bindings.

## Zwei echte Apps statt einer Webseite

Die aktuelle native Windows-App nutzt die eigene
sichere Herkunft `redion-local://app` und speichert
persistente Daten unter `%APPDATA%\Redion`.
Die iPhone-App nutzt WKWebView und ihren eigenen
App-Datencontainer. **Einfach dieselbe Git-Version
zu installieren synchronisiert ihre Daten nicht.**

`src/kern/abgleich/maschine.ts` hat bereits den
gerätebezogenen Abgleich, AES-GCM-Verschlüsselung,
Anhänge und Konfliktbehandlung. Der Cloudflare Worker
`worker.ts` schützt aber **auch API-Routen** mit
Cloudflare Access. Native Apps können dieses Tor
nicht einfach mit einem fest eingebauten geheimen
Schlüssel umgehen.

Vor der Freigabe brauchen wir eine **separate native
HTTPS-Sync-API**, die:

- nur ausdrücklich freigegebene Konto-/Sync-/Dateirouten
  anbietet; keine Website-Dateien und keinen Admin-Zugriff;
- die bestehende Redion-Authentifizierung prüft,
  Geräte koppelt und widerrufbar hält;
- keine statischen Cloudflare- oder GitHub-Tokens in
  iPhone- oder Windows-Builds enthält;
- echte Chromium-CORS-/Origin-Anfragen der Windows-App
  sauber unterstützt, ohne `Origin: null` pauschal
  freizugeben;
- Zugriff auf D1/R2 nur im richtigen Cloudflare-Konto
  bekommt, niemals durch `TOR=offen` alle
  Website-Routen ungeschützt zugänglich macht.

Die native API wird erst in einem **späteren PR**
implementiert. Dieser Check zeigt daher
`[OFFEN] nativeApi` bis zur Umsetzung.

## Zwei Kopien und ein Test vor erster Kopplung

1. Auf **beiden** Geräten Redion-Sicherung exportieren.
   Mit Anhängen muss es ein vollständiges `.redion`-Archiv
   sein; bei reinem Text kann das Format `.json` sein.
2. Jede Sicherung **ausserhalb** des jeweiligen Redion-
   App-Containers aufbewahren. iPhone: Files → iCloud
   Drive; Windows: anderes Sicherungsverzeichnis/Medium.
3. Ein Backup **auf einem separaten Testbestand**
   öffnen, Anhänge und Notizen prüfen, Originale belassen.
4. Erst dann beide Geräte über einen kurzlebigen
   Gerätecode verbinden und denselben Verschlüsselungssatz
   verwenden. Beim ersten Sync zwei unterschiedliche
   Datenbestände **zusammenführen**, nicht stillschweigend
   `Ersetzen` wählen.
5. Offline auf beiden Geräten verschiedene Inhalte
   ändern, wieder verbinden und kontrollieren, dass
   beides vorhanden ist und Konflikte sichtbar bleiben.
6. Versionierte **verschlüsselte** Backups getrennt
   vom Live-Sync testen; eine synchronisierte Löschung
   darf keine früheren Backupstände löschen.

## iCloud auf iPhone: bewusst zweistufig

Die native Redion-Sicherung `ios/native-sicherung.ts`
kann eine lokale Datei in `Auf meinem iPhone/Redion/Backups`
schreiben und anschliessend das Teilen-Menü öffnen.
Dort kann eine Kopie **manuell** nach iCloud Drive
gespeichert werden. Diese Funktion ist in der
vorhandenen installierten iPhone-App nicht garantiert.

Ein wirklich **automatisches** Schreiben nach iCloud
Drive erfordert eine eigene iOS-native Integration
und signierte Apple-iCloud-Berechtigungen. Aktuell hat
die Redion-App nur die App-Group-Entitlement-Datei,
**keine** fertige iCloud-Drive-Backupbrücke.
Der Check meldet daher `[OFFEN] iphoneIcloud`.
Bei Sideload-Signaturen ohne iCloud-Berechtigung
muss das Feature bewusst deaktiviert bleiben und
die manuelle Sicherung erhalten bleiben.

## Tests

```powershell
npm run test:sync-readiness
```

Deckt auskommentierte/kaputte/mehrfache Bindungen,
Platzhalter-Datenbank-IDs, reine Textausgabe,
Native-App-Voraussetzungen und read-only-Eigenschaft
ab. **Keine** dieser Prüfungen ist ein echter
Cloudflare-Login oder ein iPhone-/Windows-End-to-End-Test.

## Freigabezustand

**Noch nicht live.** Erst mit den echten Bestätigungen:
korrektes Konto → D1/R2 → sichere native API →
Test-Backup → iPhone+Windows-Geräteabgleich →
verschlüsselte rotierende Backups → Wiederherstellungstest
dürfen wir eine Produktiv-Synchronisierung einschalten.

GitHub-Arbeitsauftrag: Issue #164.
