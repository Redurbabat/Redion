# RED Home Server – privater Betrieb (Entwurf)

Ein gemeinsamer PR für die Heimserver-Entwicklung. Keine Cloudflare-Pflicht,
kein öffentlicher Benutzerbetrieb, kein 30-GB-Limit, keine neue Cloud-Ressource.
Der bestehende Offline- und Cloudflare-Modus bleiben erhalten.

## Erste Implementierung

SQLite mit persistenten Daten und MCP-kompatibler Batch-Schnittstelle;
Dateistücke in einem separaten Verzeichnis (SSD); eigener Node-HTTP-Adapter;
Docker-Container ohne Root, Host-Port nur an Loopback. Die API verwendet
den bestehenden Sync-Kern. Kein statisches Ausliefern des Repositories.
Eine erste Gerätefreigabe erfolgt bewusst über eine lokale Admin-Konsole.
Der aktuelle Entwurf bietet **keine** öffentliche Registrierung.

## Lokaler Test

Node 24, nur synthetische Daten:
```sh
node --test pruefungen/redion-home-server.test.mts
```

Für den Container eine private Datenablage anlegen (Container-UID 1000
benötigt Schreibrechte). `REDION_DATA_DIR` auf dieses Verzeichnis setzen.
Die SQLite-Datei und die Blob-Ablage bleiben beim Container-Neustart erhalten.
Die Kingston-SSD muss vor Start gemountet sein; keine stillen Ersatzpfade.
HTTPS muss durch einen separat konfigurierten, vertrauenswürdigen Reverse
Proxy bereitgestellt werden. Keine öffentliche Portfreigabe mit diesem
Entwurfsstand. Tailscale/privates Testnetz bevorzugen.

Die App muss einen Gerätecode über die vorhandene API anfordern.
Lokale Freigabe im Container:
```sh
docker compose -f deploy/home/compose.yaml exec redion node server/home-server.ts approve-device XXXX-XXXX
```
Nur die erste lokale Admin-Freigabe darf ein Konto erzeugen. Jede weitere
Gerätefreigabe bleibt ebenfalls auf die lokale Konsole beschränkt. Die
Freigabe und der einmalige Verbrauch verwenden SQLite-Transaktionen.
Kein Geheimnis in Git speichern. Den Verschlüsselungssatz niemals auf den
Server übertragen. Die vorhandenen Sync- und Schlüsselpfade müssen auf
allen echten Geräten geprüft werden; keine Behauptung vollständiger E2EE.

## Abnahme vor Produktion (noch offen)

- Atomare Gerätefreigabe/Einmalverbrauch sind implementiert und werden in
  einem Zwei-Verbindungen-Test geprüft. Offen: Rate Limits
  hinter dem tatsächlichen Proxy, Recovery und Authentifizierungsprüfung.
- RED ID / gemeinsames SDK und sichere Gerätesitzungen, private native
  Anmeldeoberfläche, kein offener Registrierungsweg.
- Lokaler OAuth-Consent und MCP-Routing sind optional implementiert; offen
  bleiben Browser-/Connector-Abnahme, Proxy-Grenzen und Widerrufstests.
- Live-Sync: serverseitige Invalidierung implementiert. Client-Anbindung im 15-Sekunden-Modus ergänzt;
  Versionskonflikte, Offline-Roundtrip und echte Geräte bleiben offen.
- Verschlüsselte Anhänge und Schlüsselverwaltung, Sicherheitsprüfung,
  Migration ohne Verlust; konsistente Sicherung und Restore von DB und Blobs.
- HTTPS-Proxy, Speicher-/Mount-Prüfung, Dashboard, Updates mit Rollback,
  Tests auf dem HP EliteDesk. Kein automatisches Deployment.

## Optionaler MCP-Testbetrieb

`REDION_ENABLE_MCP=1` setzen und Container neu starten. Der MCP-Endpunkt
bleibt `/mcp/cloud`, aber ohne Cloudflare-Abhängigkeit. Der bestehende
OAuth-Werkzeugkatalog wird weiterverwendet. Lokale Geräteanmeldung zuerst.
Für eine menschliche OAuth-Zustimmung an der privaten HTTPS-Adresse einen
Einmalcode auf der Serverkonsole erzeugen:

```sh
docker compose -f deploy/home/compose.yaml exec redion node server/home-server.ts mcp-login-code
```

Der Code verfällt nach fünf Minuten und wird beim Einlösen atomar gelöscht.
Browser-Sitzung: eine Stunde, Secure/HttpOnly/SameSite-Cookie, nur ein
lokales Konto. Der Code gehört nicht in eine URL. Schreiben bleibt beim
bestehenden OAuth-Consent standardmässig ausgeschaltet. Nur lesbare,
ausdrücklich freigegebene Klartextinhalte sind per MCP erreichbar; private
verschlüsselte Inhalte bleiben unlesbar. Keine öffentliche Bereitstellung
vor vollständiger Sicherheits- und Geräteabnahme. Logout der Browser-Sitzung
ist nicht gleich Widerruf eines OAuth-Grants.

## Geräteverwaltung und schneller Abgleich

Die bestehenden Kontorouten `GET /konto/geraete` und
`POST /konto/geraete/weg` sind für eigene Gerätesitzungen verfügbar.
Der neue authentifizierte Endpunkt `GET /home/sync/wait` erwartet
`bereich`, optional `cursor` und `wait` (0–10 Sekunden). Er liefert
nur einen opaken Cursor und `changed`, keine Dokumentinhalte. Clients
rufen bei einer Änderung den normalen Sync auf; der bestehende
Verschlüsselungs- und Berechtigungsweg bleibt massgeblich.
SQLite-Trigger erkennen auch Schreibtransaktionen des MCP-Diensts.
Ein Neustart wechselt den Cursor-Epoch und erzwingt einen erneuten Abgleich.
Wartende Requests blockieren nicht die Schreibwarteschlange; maximal 64
gleichzeitige Wartevorgänge. Kein WebSocket, keine Hintergrundgarantie
für iOS. Die App versucht den neuen Endpunkt nur im ausdrücklich gewählten
15-Sekunden-Modus. Der normale Abgleich bleibt parallel als Rückfallweg
aktiv. Bei fehlendem Endpunkt folgt eine Minute Pause vor einem neuen
Versuch; keine automatische Änderung der Anmeldung. Sichtwechsel,
Netzverlust, Taktwechsel und deaktivierter Sync beenden den Wartevorgang.
Die Geräteabnahme bleibt offen.

## RED ID – erste gemeinsame Identität

Die lokale Konsole kann nach der ersten Geräteanmeldung ein separates
Identitäts-Token je RED-App ausstellen, beispielsweise:

```sh
docker compose -f deploy/home/compose.yaml exec redion node server/home-server.ts red-id-issue red-fit
docker compose -f deploy/home/compose.yaml exec redion node server/home-server.ts red-id-revoke red-fit
```

Ausgabe des ersten Befehls vertraulich behandeln. Das Token läuft nach
30 Tagen ab, wird nur als SHA-256-Abdruck gespeichert und hat nur
`identity:read`. `GET /red-id/v1/me` liefert dieselbe Konto-ID für alle
Apps, `POST /red-id/v1/logout` widerruft das einzelne Token.
`red-sdk/client.mts` bietet einen ersten typisierten Client.
Andere RED-Repositories sind noch nicht angepasst. App-eigene
Datenbereiche, native sichere Token-Speicherung, interaktive Anmeldung
und vollständiges SSO sind separate offene Schritte; die neuen Tokens
dürfen keine RED ION Dokumente lesen oder schreiben.
