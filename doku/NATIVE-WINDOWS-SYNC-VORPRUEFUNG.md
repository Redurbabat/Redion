# Redion – sicherer Sync-Server in der nativen Windows-App

## Was sich verändert

Bisher war `redion-local://app` für Redion ein unbekanntes Schema.
`Wolke.adresse()` lieferte eine leere Adresse und das Wolke-Fenster
behauptete fälschlich, Redion laufe als Datei. Gleichzeitig wurde der Wert
`wolkeAdresse` ungeprüft übernommen – obwohl `ruf()` Bearer-Tokens
an diese Adresse sendet.

Jetzt gilt:
- Ohne explizite Konfiguration bleibt **die native Windows-App offline**.
  Bestehende Notizen, Datenbanken, Dateien und IndexedDB werden nicht verändert.
- Der Benutzer kann im Wolke-Fenster eine **HTTPS-Serveradresse** eintragen.
  Die Adresse wird als Ursprung normalisiert. Benutzername, Passwort, Pfad,
  Query und Fragment sind unzulässig.
- Nur bei einem Browser auf `http:` darf zur lokalen Entwicklung ein
  `http://localhost`- bzw. `http://127.0.0.1`-Testserver gewählt werden.
  Die installierte Windows-App lehnt solche unverschlüsselten Adressen ab.
- Solange ein Gerät bei einem Server angemeldet ist, darf es die
  Serveradresse **nicht wechseln**, damit der aktive `wolkeToken` niemals
  an einen anderen Host gesendet wird. Erst abmelden, dann wechseln.
- Das Wolke-Fenster zeigt bei fehlendem Server „Offline, kein Sync-Server
  verbunden“ mit einer klaren Handlungsanweisung statt „als Datei“.

## Was diese Änderung ausdrücklich NICHT fertigstellt

- Kein Cloudflare-Deployment. `wrangler.toml` hat noch keine aktiven
  D1-/R2-Bindings im richtigen Cloudflare-Konto.
- Kein produktiver iPhone↔Windows-Sync; CORS und Authentifizierung für
  `redion-local://` gegen einen echten HTTPS-Server brauchen noch eine
  separate, abgesicherte native API-Anbindung (siehe Issue #164).
- Kein automatisches iCloud-Backup. Das bleibt eine eigene Aufgabe.
- Kein Eingriff in `%APPDATA%\\Redion` und keine Neuinstallation bestehender Apps.
- Dieser Pull Request ist **nicht veröffentlicht oder auf echten Geräten
  geprüft**; erst nach Test und Freigabe könnte er Teil einer neuen EXE sein.

## Tests

```powershell
node --test pruefungen/lauf/native-sync-adresse.test.mts
npm run bauen:ts
```

Die Tests laden die tatsächlich ausgelieferte
`quell/kern/abgleich/maschine.js` in einem isolierten VM-Kontext und
prüfen HTTPS/HTTP/localhost, Credentials, Query/Fragment, native
Offline-Vorgabe, bestehende Website-Origin und den UI-Wächter beim
Serverwechsel.

**Freigabebedingung:** Nach dem Zusammenführen erneut `npm run bauen:ts`
laufen lassen und verifizieren, dass die generierten `quell/`-Dateien
dem TypeScript-Quellcode entsprechen. Anschliessend mit einer echten
installierten Windows-App und dem tatsächlichen Redion-Server testen.
