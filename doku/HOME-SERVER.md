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

## Server-Dashboard (erste Version)

Einstellungen → RED Home Server → Serverstatus abrufen. Nur eine gültige
RED ION Gerätesitzung darf `GET /home/dashboard` aufrufen; RED-ID-Tokens
sind ausgeschlossen. CPU/RAM und Netzwerk beschreiben die Sicht des
Serverprozesses (Containergrenzen können abweichen). Speicherwerte sind
Dateisystemkapazitäten, keine Quote. Temperatur und Netzwerk können fehlen.
Gerätesitzungen und MCP-Freigabeeinträge sind keine Online-Verbindungen.
Keine Schlüssel, Dateipfade oder Inhalte in der Antwort. Kein Docker-Socket.

## RED ID v2 und SDK (Kopplungsprotokoll)

Eine authentifizierte RED ION Gerätesitzung erzeugt `POST /red-id/v2/pair`
für eine App mit SHA-256-PKCE-Challenge. Die Ziel-App erstellt die Challenge
und behält den Verifier geheim. Der Kopplungscode ist fünf Minuten gültig,
einmalig und nur mit passendem Verifier und App-ID nutzbar. `exchange` gibt
15-Minuten-Access- und maximal 30-Tage-Refresh-Token aus, beide gehasht in
SQLite. Refresh rotiert beide atomar; keine unbegrenzte Verlängerung.
`revoke` benötigt eine Gerätesitzung und widerruft v1/v2 für genau eine App.
V2-Zugänge bleiben auf `identity:read` beschränkt. Kein OAuth-Browser-SSO,
keine QR-Oberfläche und keine automatische Anmeldung fremder Repositories.
`createRedIdV2Client` verwendet eine vom nativen Client bereitgestellte
sichere Speicherimplementierung. SDK-Integration in den Apps bleibt offen.

## RED Vault – optionale Verschlüsselung der Blob-Dateien

AES-256-GCM mit zufälligem Nonce je Schreibvorgang und Bindung an die
Blob-Kennung. Start verweigert falsche/fehlende Schlüssel und eine
automatische Umstellung bestehender Klartextdateien. Schlüssel ausserhalb
der SSD aufbewahren und separat sicher sichern. Für den opt-in Container
`deploy/home/compose.vault.yaml` ergänzen und `REDION_VAULT_KEY_PATH` auf
eine exakt 32 Byte lange, für den Container lesbare private Schlüsseldatei
setzen. Kein Schlüssel in Git. SQLite selbst ist dadurch nicht verschlüsselt;
für vollständigen Schutz bei Diebstahl der SSD zusätzlich LUKS/Datenträger-
verschlüsselung und sichere Schlüsselablage einsetzen. Migration vorhandener
Daten, per-App-Vault-Berechtigungen und E2EE-Abnahme bleiben offen.

## RED Backup – verschlüsselte Offline-Sicherung

`deploy/home/backup.sh` stoppt den Compose-Dienst, sperrt parallele
Wartungsskripte per flock, erstellt ein AES-256-GCM-verschlüsseltes Backup
von SQLite und Blob-Dateien und startet einen zuvor laufenden Dienst wieder.
Alle anderen Datenbank-/Dateischreiber müssen ebenfalls beendet sein; die
CLI prüft SQLite-Integrität und WAL und erkennt veränderte Dateien.
Ein eigenes 32-Byte-Backup-Schlüsselfile sowie ein separates, existierendes
Backup-Verzeichnis (möglichst zweiter Datenträger) sind erforderlich. Keine
automatische Löschung, kein Überschreiben. Das authentifizierte Manifest
wird zuletzt geschrieben. Wiederherstellung nur in ein neues Verzeichnis:

```
node server/home/backup.ts restore /path/backup /path/new-data /path/key --offline-confirmed
```

Den wiederhergestellten Bestand zuerst offline prüfen und den originalen
Datenträger behalten. Falls RED Vault genutzt wird, ist zusätzlich dessen
Schlüssel nötig. Backup-Key nicht auf demselben Datenträger speichern.
Eine tägliche Ausführung kann später über einen explizit installierten
systemd-Timer erfolgen; kein Timer/Deployment wurde aktiviert.

## RED Update und RED Connect

`deploy/home/update.sh check` vergleicht die lokale Commit-ID mit GitHub main;
`stage FULL_MAIN_SHA --approve` baut genau die überprüfte main-Fassung in
einem separaten Git-Worktree und prüft die private API in einem netzlosen
Testcontainer. Kein Deployment, keine Veränderung des laufenden Servers.
Vor einem späteren Wechsel immer Backup und getesteten Restore in eine
neue Datenablage durchführen, bisheriges Image und bisherige Ablage behalten.
Automatischer Live-Cutover und Rollback sind erst nach Hardware-Abnahme
freizugeben; nach neuen Schreibvorgängen nicht auf einen alten Datenstand
zurückschalten. Die systemd-Beispiele unter deploy/home/systemd müssen
mit einem vorhandenen, berechtigten Wartungsbenutzer und echten Pfaden
konfiguriert werden; sie sind nicht installiert.

Privater Fernzugriff: Tailscale Serve (`tailscale serve --bg 8790`) nur im
Tailnet, mit aktivierter HTTPS-Funktion und restriktiver Tailnet-Zugriffsregel.
Die angezeigte HTTPS-Adresse exakt als REDION_ORIGIN und in den Apps setzen.
Kein Funnel, keine Router-Portfreigabe, kein Abschalten der TLS-Prüfung.
Für den lokalen LAN-Betrieb ist ein Caddyfile-Beispiel enthalten; eigener
LAN-DNS-Name und auf jedem Gerät vertrauenswürdige lokale CA erforderlich.
`node deploy/home/connect-check.mts` prüft die konfigurierte HTTPS-Adresse
und ob das Dashboard ohne Geräte-Token gesperrt ist. Die Tailscale- und
LAN-Optionen sind nicht automatisch aktiviert. Ein rein privater Tailnet-
Endpunkt ist nicht automatisch von einem externen Cloud-MCP-Client erreichbar.

## RED Ecosystem – App-Verwaltung

RED ION → Einstellungen → RED Home Server zeigt autorisierte App-Zugänge
für alle elf Kennungen. Eine RED ION Gerätesitzung kann eine Challenge der
Ziel-App freigeben und einen kurzlebigen Kopplungscode ausgeben; der Verifier
bleibt auf der Ziel-App. Widerruf löscht v1/v2-Zugänge und offene Kopplungen
für genau die ausgewählte App. Die API liefert keine Dokumente an RED-ID-
Tokens. Die anderen Repositories benötigen den SDK-Client, native sichere
Speicheradapter, eine Kopplungsoberfläche und eigene Tests; sie sind nicht
Teil dieses PRs. Die Code-Anzeige ist manuell, nicht als QR-Code umgesetzt.

Das SDK ist als privates ESM-Paket `@red-ecosystem/sdk` v0.2.0 mit
TypeScript-Deklarationen paketierbar. Der Home-Server-CI-Job baut und prüft
das Paket; keine öffentliche Registry und kein automatisches Publishing.

## RED Share und QR-Protokoll

Die Freigabe `POST /red-share/v1/grant` (source, target, channel) kann nur
von einer RED ION Gerätesitzung erteilt werden, gilt sieben Tage und nur
in eine Richtung. Nachrichten verfallen spätestens nach einem Tag. Nur
die Ziel-App darf Nachrichten empfangen und quittieren. Widerruf entfernt
zugehörige Freigaben und Nachrichten. Kein Zugriff auf fremde Dokumente.
Der SDK-Client bietet shareSend, shareInbox und shareAck. AES-256-GCM-
Hilfsfunktionen binden Sender, Empfänger, Kanal und Nachrichten-ID an das
Envelope. Die 32-Byte-Schlüssel müssen ausserhalb des Servers sicher an
beide Apps verteilt werden. Der Server prüft keine Verschlüsselung; erst
die konkrete App-Integration kann Ende-zu-Ende-Schutz sicherstellen.
Das SDK enthält ein striktes QR-Payload-Format für App-ID und öffentliche
Challenge, aber noch keine native QR-Kamera oder QR-Renderer.

## RED Vault – Migration und Schlüsselwechsel

`node server/home/vault-migrate.ts BACKUP NEW_DATA_DIR BACKUP_KEY NEW_VAULT_KEY --new-copy [OLD_VAULT_KEY]`
verifiziert zuerst ein verschlüsseltes Backup und migriert ausschliesslich
in eine neue Datenablage. Vorhandene Ziele werden abgelehnt. Jeder Blob
wird verschlüsselt und erneut entschlüsselt verglichen; bei einem Fehler
wird die neue Kopie verworfen. Die Quelle bleibt unverändert. Bei einer
bereits verschlüsselten Quelle ist der alte Vault-Key erforderlich. Erst
nach erfolgreicher Prüfung die neue Ablage manuell auswählen; nach einem
Prozessabbruch keine unvollständige Ablage starten. SQLite und Metadaten
benötigen weiterhin LUKS oder vergleichbare Datenträgerverschlüsselung.

## Update/Rollback-Probe mit echten Sicherungskopien

Zwei zuvor geprüfte und revisionsmarkierte Images (alt/neu) lokal mit
`deploy/home/rehearse-update.sh OLD_IMAGE NEW_IMAGE --approve-rehearsal`
prüfen. REDION_REHEARSAL_ROOT, REDION_BACKUP_PATH, REDION_BACKUP_KEY_PATH,
REDION_DATA_DIR und bei Vault REDION_VAULT_KEY_PATH setzen. Das Skript
stellt die verschlüsselte Sicherung zweimal in ein separates privates
Testverzeichnis wieder her; Netzwerk deaktiviert. Neues Image gegen die
Upgrade-Kopie, altes gegen die Rückfallkopie: Start, Authentifizierung,
SQLite-Integrität. Es verändert weder laufenden Dienst noch Originalbackup.
Testverzeichnis muss auf einem geschützten Datenträger liegen. Keine
Rückkehr auf einen älteren Datenstand nach neuen produktiven Schreibvorgängen.
Ein tatsächlicher Cutover benötigt weiterhin explizite Freigabe, abgeschaltete
Clients/Schreiber und Abnahme auf dem Mini-PC.

## RED ID – Freigabe ohne Rückgabe eines Einmalcodes

Ziel-App erzeugt lokal einen frischen PKCE-Verifier und zeigt nur die
öffentliche Challenge. RED ION Owner sendet app und challenge an
`POST /red-id/v2/approve-login`. Ziel-App ruft mit eigenem Verifier und
app `POST /red-id/v2/claim-login` (SDK claimLogin) auf. Einmalig, 5 Minuten,
App-gebunden; Widerruf beendet offene Freigaben. Die Challenge darf erst
nach Vergleich mit der tatsächlich gewünschten Ziel-App bestätigt werden.
Keine automatische Anmeldung unbekannter Apps, kein öffentlicher OAuth-SSO.

## RED Share – manuell authentifizierter Schlüsselaustausch

SDK 0.4: `createRedShareKeyExchange` erstellt ein kurzlebiges P-256-Schlüsselpaar.
Die beiden Apps tauschen nur öffentliche Offers aus. Origin, Konto, Sender,
Empfänger und Kanal sind im HKDF-Transkript gebunden. Fingerprint (128 Bit)
auf beiden vertrauenswürdigen Geräten direkt vergleichen und bestätigen;
erst dann wird der AES-256-Schlüssel abgeleitet. Der Server sieht keine
privaten Schlüssel. Ohne diesen Vergleich keine sichere Authentisierung.
Die Apps müssen den Schlüssel in ihrem nativen Credential Store ablegen.
`createScopedRedStore` trennt RED-ID-Zugangsdaten nach Origin und App;
die native Keychain-/Keystore-Bridge muss die jeweilige App bereitstellen.

In RED ION → Einstellungen → RED Home Server lassen sich jetzt JSON-
Kopplungsanfragen übernehmen, direkte Anmeldungen bestätigen sowie
RED-Share-Kanäle einzeln ansehen, freigeben und widerrufen. Die Oberfläche
verarbeitet keine privaten Schlüssel. QR-Kamera/Renderer sind noch offen.

## Private Web-App-Anbindung (standardmässig aus)

`REDION_WEB_ORIGINS` ist eine kommagetrennte Liste exakter HTTPS-Ursprünge
(maximal 16, kein Stern, kein Pfad). Nur die fünf Client-Identitätswege
Claim, Exchange, Refresh, Me und Logout akzeptieren diese Ursprünge.
RED ION Owner-API, Dashboard, Sync, MCP und RED Share bleiben gesperrt.
CORS ersetzt keine Authentifizierung. Keine Freigabe für fremde öffentliche
Websites; nur eigene kontrollierte Deployments. Browser und Netzwerk müssen
den privaten Server erreichen und seinem TLS-Zertifikat vertrauen.
Das Browser-SDK `@red-ecosystem/sdk/browser` hält Tokens nur im RAM und
meldet sich ausschliesslich auf ausdrückliche Bedienung an. Bei Reload oder
Verlassen der Komponente gehen lokale Tokens verloren; die Serversitzung
kann bis zum Ablauf bestehen bleiben und ist in RED ION widerrufbar.
Nicht automatisch für Trainings-/Lern-/Musikdaten aktiviert.
