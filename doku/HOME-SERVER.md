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
Nur die erste lokale Admin-Freigabe darf ein Konto erzeugen.
Kein Geheimnis in Git speichern. Den Verschlüsselungssatz niemals auf den
Server übertragen. Die vorhandenen Sync- und Schlüsselpfade müssen auf
allen echten Geräten geprüft werden; keine Behauptung vollständiger E2EE.

## Abnahme vor Produktion (noch offen)

- Atomare Gerätefreigabe/Einmalverbrauch über Prozessgrenzen, Rate Limits
  hinter dem tatsächlichen Proxy, Recovery und Authentifizierungsprüfung.
- RED ID / gemeinsames SDK und sichere Gerätesitzungen, private native
  Anmeldeoberfläche, kein offener Registrierungsweg.
- OAuth-Consent ohne Cloudflare Access und MCP-Freigaben; die neue API
  lässt MCP absichtlich noch gesperrt. Kein Bypass durch gefälschte Header.
- Live-Sync, Versionskonflikte, Offline-Roundtrip, iOS/Windows/Android.
- Verschlüsselte Anhänge und Schlüsselverwaltung, Sicherheitsprüfung,
  Migration ohne Verlust; konsistente Sicherung und Restore von DB und Blobs.
- HTTPS-Proxy, Speicher-/Mount-Prüfung, Dashboard, Updates mit Rollback,
  Tests auf dem HP EliteDesk. Kein automatisches Deployment.
