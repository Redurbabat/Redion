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

Das SDK ist als privates ESM-Paket `@red-ecosystem/sdk` mit
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

### Schutz vor Wiederverwendung rotierter Refresh-Tokens

Der Server speichert ausschliesslich SHA-256-Digests bereits rotierter
Refresh-Tokens bis zum ursprünglichen Sitzungsablauf. Bei Wiederverwendung
mit derselben App-ID wird nur die betroffene Sitzungsfamilie widerrufen;
andere Geräte und Apps bleiben aktiv. Eine andere App-ID darf die Familie
nicht widerrufen. Beim Löschen einer Sitzung räumt ein SQLite-Trigger die
Historie auf. Maximal 4096 Rotationen pro Sitzung; danach neu koppeln.
Bei einem verlorenen Refresh-Response kann ein Retry ebenfalls zur erneuten
Kopplung führen. Keine automatische, parallele Refresh-Wiederholung.

### RED Share – Zustellbestätigung und verschlüsselte JSON-Daten

SDK 0.6: `prepareRedShareJson` erzeugt eine zufällige Nachrichten-ID und
AES-GCM-Envelope. Bei Retry immer denselben Envelope/ID verwenden.
`openRedShareJson` entschlüsselt und erzwingt eine app-spezifische
Validierungsfunktion. Empfänger müssen Daten und Nachrichten-ID atomar
speichern, bevor sie ACK senden. Der Server hält einen gehashten Receipt
für 7 Tage nach ACK (maximal 1024 pro Konto), um erneute Zustellung
identischer IDs zu verhindern; veränderte Inhalte mit derselben ID liefern
409. Das ist keine genau-einmal-Zustellung über unbegrenzte Zeit. Bei voller
Receipt-Quote ACK nicht als erfolgreich behandeln; keine Daten erneut importieren.
Server prüft die kanonische Envelope-Form, kann aber Verschlüsselung nicht
beweisen. Browser-Allowlist bleibt auf Identität beschränkt. Bestehende
App-Clients müssen separat auf SDK 0.6 aktualisiert werden.

### Echte Docker-Updateprobe in CI

`pruefungen/red-update-rehearsal.sh` baut die geprüfte Ausgangsversion
`0e9b8506` und den aktuellen CI-Commit als getrennte Images, erstellt
synthetische Vault-Daten und eine verschlüsselte Sicherung, führt die reale
Upgrade-/Pre-Cutover-Rollback-Probe aus und vergleicht die Hashes der
unveränderten Live-Fixture. Keine echten Daten, Ports oder Deployments.
Der Rehearsal-Code verwendet nach Prüfung der Revision unveränderliche
Docker-Image-IDs statt beweglicher Tags. Kein Nachweis eines Rollbacks
nach neuen Live-Schreibvorgängen.

### SSD-Preflight ohne Änderungen am Datenträger

Auf dem Linux-Host: `bash deploy/home/storage-check.sh /pfad/zum/bestehenden/datenordner`.
Erfordert Node 24, findmnt, lsblk und realpath. Das Skript prüft den
aktuellen ext4-/XFS-Mount und sämtliche inverse Blockgerätepfade auf
dm-crypt; unbekannte Topologien und verschachtelte Mounts werden abgelehnt.
Es formatiert, mountet und entschlüsselt nichts. Ein positives Ergebnis
belegt keine korrekte Recovery-Strategie, keine Schlüsseltrennung und
keine vollständige Verschlüsselung von Swap oder anderen Kopien.
Vor dem produktiven Betrieb LUKS-Datenträger separat einrichten, Recovery-Key
separat sichern und Wiederherstellung testen; nicht auf einer bestehenden
unverschlüsselten SSD automatisch LUKS formatieren. Kein realer Datenträger
wurde in CI geprüft; synthetische Topologien testen die Entscheidungslogik.

Die erste echte Containerprobe hat einen bisherigen Paketierungsfehler
aufgedeckt: Der Home-Server importiert den generierten Schaltplan aus
`quell/`, das Dockerfile kopierte aber ausschliesslich `server/`. Der
Container enthielt daher zwar Code, konnte jedoch nicht starten. Das
Dockerfile kopiert jetzt auch die benötigten generierten Quellen und die
Paket-Typdefinition. Für die CI-Rollbackprobe wird der alte Servercode
unverändert aus seinem Commit archiviert, aber mit dem korrigierten
Dockerfile gebaut. Damit wird kein zuvor defektes historisches Image als
lauffähig ausgegeben; es handelt sich um zwei neu gebaute Codeversionen.

### RED Sync / RED Files – verschlüsselte Objekte (Pilot)

`/red-store/v1/grant` und `/revoke` erfordern eine RED-ION-Gerätesitzung.
Der Besitzer gibt eine App und den Typ `sync` oder `file` für sieben Tage
frei. `/grants` liefert nur Bestands- und Freigabemetadaten. Die App nutzt
RED-ID-v2-Token für `/list`, `/get`, `/put`, `/delete` (POST JSON). Der Server
leitet Konto/App ausschliesslich aus der Sitzung ab. Cross-App und externe
Web-Origins bleiben gesperrt. Inhalte sind opake AES-GCM-Envelopes; Formprüfung
beweist keine Verschlüsselung. `expectedRevision` verhindert verlorene Updates,
`operationId` erlaubt die Wiederholung der letzten unveränderten Operation.
Gelöschte IDs sind dauerhaft Tombstones und nicht wiederverwendbar.
App-Widerruf entfernt die Freigaben, nicht die gespeicherten Daten. Neue Freigabe
ermöglicht wieder Zugriff. Bis zu 1024 Objekte und 16 MiB kodierte Inhalte pro
Konto als technische Pilotgrenze, kein 30-GB-Tarif. Kleine Dateiobjekte bis
60000 Base64url-Zeichen; kein grosser Datei-Upload, keine Chunk-Manifeste.
Schlüsselverteilung, lokaler Konfliktdialog, native UI und explizite Datenlöschung
jenseits der Tombstones bleiben offen. Backups enthalten weiterhin verschlüsselte
Objekte und Metadaten in SQLite; vollständige Datenträgerverschlüsselung nötig.

### Zentrale MCP-Funktionsübersicht

Das private Home-MCP ergänzt `redion_get_home_ecosystem_capabilities`
nach normaler OAuth-Anmeldung mit `redion:read`. Es liefert ausschliesslich
nicht vertrauliche Funktionsmetadaten, keine App-Daten, Sitzungsschlüssel,
Dateinamen, Grant-Inventare oder Zugriff auf verschlüsselte Inhalte.
Die öffentliche Cloud-MCP-Werkzeugliste bleibt unverändert. Externe App-Aktionen
benötigen künftig gesonderte Freigaben und Adapter; dieses Tool ist noch kein
universeller App-Controller.

### RED Devices, Monitor und Recovery

`GET /red-id/v2/sessions` listet aktive RED-ID-v2-Sitzungen des
angemeldeten Besitzers (maximal 256, keine Token/Digests). `POST
/red-id/v2/revoke-session` mit `id` widerruft nur diese Sitzung, nicht
alle Geräte derselben App. Erstellung aus der festen 30-Tage-Laufzeit
abgeleitet; keine Aussage über Gerätename oder Online-Status. Neue
Sitzungen sind auf 256 pro Konto begrenzt. Die Dashboard-Metrik `monitor`
aggregiert pro Prozess bis zu 60 Minuten Statusklassen und Antwortzeiten,
ohne Pfade, IPs, Token oder Inhalte. Keine dauerhafte Telemetrie.

Notfall-Reset: zuerst Server und sämtliche Schreiber stoppen, verifiziertes
Backup erstellen, dann lokal (niemals über MCP oder HTTP) `node
server/home-server.ts recovery-reset-access --offline-confirmed-reset-all-access`
mit identischer Daten-/Vault-Konfiguration ausführen. Dies widerruft ALLE
Gerätesitzungen, App-Zugänge, ausstehenden Kopplungen, Marken, MCP-Zustände
und App-Freigaben; wartende Share-Nachrichten werden gelöscht. Dokumente,
Konten, Dateien und RED-Store-Objekte bleiben erhalten. Alle Geräte müssen
neu gekoppelt werden. Der Reset stellt keine verlorenen Schlüssel wieder her
und löscht keine bereits auf anderen Geräten gespeicherten Daten. Der Befehl
setzt die ausdrücklich bestätigte Offline-Wartung voraus und stoppt den
Server nicht selbst. Kein Reset der realen Installation wurde durchgeführt.

### Sicherungen zerstörungsfrei prüfen

`node server/home/backup.ts verify BACKUP_DIRECTORY KEY_FILE --verify-only`
prüft das authentifizierte Manifest und jeden AES-GCM-Eintrag streaming,
ohne Klartextdateien anzulegen. Falsche Schlüssel und veränderte Einträge
werden abgelehnt. Dies ersetzt keine Wiederherstellung mit SQLite-Integritäts-
und Anwendungstest. Aufbewahrung und Schlüsseltrennung separat prüfen.

Für Docker-Betrieb steht `bash deploy/home/recovery-reset.sh
--offline-confirmed-reset-all-access` bereit: prüft bestehende Datenbank,
verwendet die Wartungssperre und verweigert den Reset bei laufendem bekannten
Compose-Dienst. Andere Schreiber müssen separat gestoppt werden; der Befehl
startet den Dienst nicht. Vorher eine verifizierte Sicherung erstellen.

### RED Sync 0.8 – inkrementeller Änderungsfeed

`POST /red-store/v1/changes` mit `{kind,cursor}` verwendet dieselben
App- und Speicherfreigaben wie `get` und `list`. Der Cursor ist ein zufälliger
und pro Konto/App/Typ isolierter Marker; SQLite-Trigger schreiben ihn atomar
mit jeder neuen Objektversion. Maximal 512 Marker pro Bereich bleiben
verfügbar, nur die neuesten Metadaten pro Objekt (maximal 1024) werden
zurückgegeben. Bei null, unbekanntem oder abgelaufenem Cursor enthält
`reset:true` die vollständige Metadatenliste. Kein alter Ciphertext im Feed,
keine zusätzliche Freigabe für Browser oder MCP. Bei Backup-Restore kann ein
nicht mehr vorhandener Marker erkannt werden; kein kryptografischer Schutz
gegen einen böswilligen Server, der eine konsistente alte DB vorspielt.
Client muss die Metadaten abgleichen, aktuelle Objekte laden und prüfen,
lokale Konflikte behandeln und Cursor erst nach atomarem lokalem Commit
speichern. Die Feed-Migration erfasst vorhandene Objekte ohne deren Inhalte
zu ändern. Native App-Integration, Hintergrundsync und Schlüsselverwaltung
bleiben separat offen.

### SDK 0.9 – lokale Sync-Transaktionen und RED Config

Der Sync-Client lädt einen Metadatenfeed, prüft neue Ciphertext-Datensätze
und übergibt Importe, Konflikte und Cursor an einen atomaren lokalen Adapter.
Kein Cursor-Commit bei Entschlüsselungsfehlern oder geänderten Serverrevisionen.
Lokale Änderungen und Rollbacks werden als Konflikte gespeichert, nicht
automatisch überschrieben. Tombstones sind serverseitige Metadaten ohne
kryptografisch authentifizierten Löschinhalt: daher ebenfalls Konflikt,
keine automatische lokale Löschung. Adapter müssen Generation und Konflikte
atomar speichern. Dies ist noch keine Integration in konkrete Apps und kein
ständig laufender Hintergrundprozess.
RED Config synchronisiert zunächst Theme, Sprache und reduzierte Bewegung
je App über den bestehenden Sync-Grant. ID und Schlüssel sind unabhängig
über HKDF abgeleitet; unbekannte Felder werden abgelehnt. Keine Passwörter,
Token, globalen App-Einstellungen oder automatischen App-Freigaben.

Der SDK-Sync-Koordinator bündelt gleichzeitige Trigger und begrenzt
Wiederholungsversuche mit exponentiellem Backoff. Die App muss den
Koordinator bei Start, Vordergrund oder erlaubtem Hintergrundereignis
selbst aufrufen. RED Config wird per exakter Objekt-ID einem eigenen
kryptografisch prüfenden Decoder zugeordnet, damit der allgemeine Sync-Key
nicht mit dem separaten Config-Key verwechselt wird.

### SDK 0.10 – manueller Geräteschlüsseltransfer

Zwei bereits vertrauenswürdige Geräte können einen vorhandenen 32-Byte-
Speicherschlüssel einmalig verschlüsselt übertragen. Öffentliche P-256-Angebote,
HKDF und AES-GCM sind an die exakte App-/Konto-/Origin-/Typ-Kombination gebunden.
Der vollständige 128-Bit-Fingerabdruck muss auf beiden vertrauenswürdigen
Geräten unabhängig verglichen werden. Ohne diese Prüfung kein sicherer
Geräteidentitätsnachweis. Keine serverseitige Schlüsselablage und keine
unbeaufsichtigte Freigabe. Native QR- und Keychain-/Keystore-Integration offen.

### RED Files 2.0 – Multipart-Pilot (SDK 0.11)

Verschlüsselte Dateien bis 8 MiB aus maximal 40.000 Byte grossen Segmenten.
Dateiname, Segmentreihenfolge, IDs, Längen und SHA-256-Prüfsummen liegen
im authentifizierten verschlüsselten Manifest. Die App veröffentlicht das
Manifest zuletzt; bei Verbindungsabbruch denselben verschlüsselten Uploadplan
wiederverwenden. Der Server sieht einzelne opake Objekte und deren Grössen.
Dateien sind unveränderlich, Zugriff erfolgt per Manifest-ID. Kein automatisches
Löschen unvollständiger Uploads, keine grosse SSD-Quote, kein Streaming.
Die Grenze 16 MiB kodierte Daten und 1024 Objekte pro Konto bleibt bestehen.
Download und Vorbereitung sind speicherbegrenzt, aber im Arbeitsspeicher.
Native Dateiauswahl, lokales Uploadjournal und Export fehlen noch.

### RED App Center

`GET /home/apps` und die RED-ION-Home-Server-Einstellungen zeigen alle
elf bekannten App-Kennungen mit aktiven RED-ID-Zugängen, Sync-/Datei-Freigaben,
Share-Richtungen und Objektverbrauch. Nur echte Owner-Gerätesitzungen sind
berechtigt. Keine Token, Objektnamen, Inhalte oder ID-Digests werden geliefert.
Pilotkategorien beschreiben vorhandenen Integrationscode; sie sind kein
Installations-, Online- oder Release-Nachweis. Keine App-Installation,
automatische Updates oder Ausführung anderer Apps.

### RED Search (SDK 0.12)

Lokaler, flüchtiger Index für maximal 4096 vom App-Adapter ausdrücklich
bereitgestellte Metadaten-Einträge. Suche über Titel, Tags und Kurztext;
Akzentnormalisierung und Mehrwortsuche, keine Serveranfrage. Keine
automatische Indizierung privater Dokumente und keine App-übergreifende
Suche ohne eigene spätere Freigaben. Pro Konto/App separat instanziieren,
bei Sperre/Logout verwerfen. UI und echte App-Integration offen.

### RED Notify / Automation / Calendar – Wartungspilot

Owner-only `/home/reminders/list` (GET) und `create`, `poll`, `ack`,
`cancel` (POST). Bis zu 64 explizit angelegte Regeln pro Konto; feste
Typen Backup-, Freigabe-, Speicher- und Update-Prüfung, einmalig oder
alle 24/168 Stunden. Zeitpunkte als Unix-Millisekunden; feste UTC-Intervalle,
keine automatische Sommerzeitkorrektur. Create-ID und Bestätigung einer
konkreten fälligen Instanz sind wiederholbar. Poll erzeugt fällige Hinweise,
fasst versäumte Wiederholungen zusammen und erhält offene Hinweise bis zur
Bestätigung. GET ändert nichts. Regeln bleiben nach Neustart erhalten.
Optionaler Hintergrundtimer (siehe unten), kein Push, Zugriff anderer Apps oder MCP-Schreibrecht;
keine automatische Ausführung von Backups, Updates, Befehlen oder Netzaufrufen.
Cancel entfernt die Regel mit ihrem Hinweis; eine erneut gesendete alte
Create-Anfrage kann die Regel neu anlegen. Die UI soll deshalb nach
Cancel den zugehörigen Create-Retry verwerfen. Metadaten und Zeiten liegen
in SQLite; keine freien Titel oder privaten Kalenderinhalte. Eine lokale
Sitzungswiederherstellung widerruft Zugänge, nicht die gespeicherten Regeln.

### RED SSO – gemeinsame Kopplungsfreigabe (SDK 0.13)

`POST /red-id/v2/approve-batch` ist nur mit echter Owner-Gerätesitzung
verfügbar. Eine Liste mit maximal elf unterschiedlichen App-IDs und
öffentlichen PKCE-Challenges wird innerhalb einer Transaktion vollständig
freigegeben oder abgelehnt. Keine Freigabe über Browser-Pilot-CORS oder
App-Token. Jede App muss separat ihren privaten Verifier vorweisen und
bekommt eigene, widerrufbare Zugangsdaten. Gemeinsame Identität bedeutet
nicht gemeinsame Zugangsdaten. SDK-Validierung vorbereitet; die explizite
Mehrfachfreigabe-Oberfläche bleibt offen. Kein vollständiges Browser-SSO.

### RED Automation – Hintergrundhinweise und Kapazitätsprüfung (#259)

`REDION_ENABLE_REMINDER_SCHEDULER=1` aktiviert beim Serverstart und im Docker-Compose-Dienst einen 30-Sekunden-Timer (Standard aus). CLI-Wartungsbefehle starten ihn nicht. Start und Tick materialisieren höchstens 256 fällige Regeln atomar; manuelles Polling bleibt konto-isoliert. Offene Hinweise bleiben erhalten; Shutdown stoppt den Timer. Kein Push und keine automatische Ausführung von Backup, Update oder Shell-Befehlen.

Das Owner-Dashboard liefert zusätzlich `storageReview` mit Status `ok`, `warning`, `critical` oder `unknown`. Bis 5 % frei ist kritisch, bis 15 % Warnung. Fehler/ungültige Messwerte bleiben unbekannt. Die Messung betrifft nur das sichtbare Dateisystem; SSD-Identität, Mount und Verschlüsselung separat hostseitig prüfen. Keine neue App- oder MCP-Zugriffsfreigabe. Automatische Prüfjobs, Historie und UI sind noch offen.

### RED Security – read-only grant review

Das Owner-Dashboard liefert `grantReview` mit konto-isolierten Zählern für aktive und innerhalb von 24 Stunden auslaufende Sync-/Datei- und Share-Freigaben sowie RED-ID-Zugänge. Abgelaufene Grants werden nicht als aktiv gezählt. Die Bewertung verändert oder verlängert keine Freigabe; `ok` bedeutet nur, dass im betrachteten Zeitfenster keine aktiven Freigaben auslaufen, nicht dass der Server allgemein sicher ist. Keine Tokens, Grant-IDs oder Daten anderer Konten. Automatisierte Prüfjobs und UI folgen separat.

### RED Automation – automatische Read-only-Prüfungen

Bei aktiviertem `REDION_ENABLE_REMINDER_SCHEDULER=1` werden neue fällige Speicher- und Freigabehinweise zusammen mit einem read-only Prüfresultat atomar gespeichert. Auch manuelles Polling verwendet in diesem Modus dieselbe Logik. Pro Regel wird das letzte Ergebnis (`review` in list/poll) mit Fälligkeits- und Messzeit gespeichert; ACK erhält es, Cancel löscht es. Bereits offene Hinweise werden nicht nachträglich ausgeführt. Keine wiederholte Messung solange dieselbe offene Instanz erhalten bleibt. Speicher misst das serverseitige Dateisystem, keine LUKS-/Mount-Identität. Freigaben sind konto-isoliert. Backup/Update bleiben manuelle Hinweise. Kein Push, keine Schreiboperationen an Nutzerdaten, keine Netzaufrufe oder Befehle; nur die Ergebnisdaten werden lokal gespeichert. Vollständige Historie und Darstellung der Ergebnisse in nativen Apps bleiben offen.

### RED Automation – Wartungshistorie

Owner-only `GET /home/reminders/history` liefert bis zu 64 neueste tatsächlich ausgeführte Speicher-/Freigabeprüfungen (`entries`, `truncated`, `retentionLimit`). Je Konto bleiben maximal 256 Ereignisse erhalten, sortiert nach Messzeit, Fälligkeit und Regel-ID. Eine Instanz wird anhand Konto/Regel/Fälligkeit dedupliziert. Ergebnisse und Hinweis werden in derselben Transaktion gespeichert; ACK behält sie, Cancel löscht die zugehörige Historie. Kein nachträgliches Erfinden früherer Messungen: vor der Migration gespeicherte letzte Ergebnisse bleiben im bisherigen `review` sichtbar. Kein öffentliches API, keine App-Token-Freigabe. Anzeige in den App-Einstellungen folgt separat.

Die RED-ION-Einstellungen enthalten eine Anzeige des letzten Prüfergebnisses, einen separaten Historienabruf und zusätzliche Kapazitäts-/Freigabewerte im Dashboard. Bei älteren Servern wird fehlende Historie als nicht verfügbar angezeigt. Offline-Artefakte müssen aus der Quelle neu erzeugt werden; Hardwareabnahme separat.

### RED Backup – jüngste Sicherung ohne Serverunterbrechung prüfen

Auf dem Host mit Node 24 und vorhandenen `REDION_BACKUP_DIR`/`REDION_BACKUP_KEY_PATH`: `bash deploy/home/verify-backup.sh`. Alternativ `node server/home/backup.ts verify-latest BACKUP_DIRECTORY KEY_FILE --verify-only`. Es wird ausschliesslich der lexikographisch neueste vom Backup-Skript benannte Ordner (`YYYYMMDDTHHMMSSZ-xxxxxxxx`) ausgewählt. Ein unvollständiger, manipulierter oder verlinkter neuester Ordner führt zum Fehler, kein stiller Rückgriff auf ältere Backups. Der JSON-Bericht enthält Erstellungs-/Verifikationszeit, Alter, Dateianzahl und authentifizierte Bytes. Die Prüfung entschlüsselt streamend ohne Klartextdatei und stoppt den laufenden Dienst nicht. Während einer laufenden Sicherung kann sie fehlschlagen; nach Abschluss erneut prüfen. Bei gleichen Zeitstempeln entscheidet der zufällige Namenssuffix, nicht eine nachgewiesene zeitliche Reihenfolge. `sqliteIntegrityVerified:false` bleibt ausdrücklich erhalten; Restore-Test separat. Keine automatische Job-Ausführung oder Schlüsselbereitstellung im Webserver. Host-Scheduling und Dashboard-Berichtsanbindung bleiben offen.

### RED Clipboard – SDK-Pilot 0.14

Expliziter Texttransfer zwischen zwei verschiedenen RED-Apps über die vorhandene richtungsgebundene RED-Share-Freigabe und separat bestätigten `clipboard`-Kanalschlüssel. Maximal 8192 UTF-8-Bytes, authentifizierte 5-Minuten-Gültigkeit, Empfänger-/Sender-/Kanalbindung. Keine Änderung am Servertransport; Ciphertext kann bis ACK bzw. zum bestehenden Relay-Ablauf (max. 24 Stunden) verbleiben. Keine native Zwischenablage, Geräteadressierung, automatische Übertragung oder Hintergrundlesung. Client muss Replay-ID persistent speichern und Paste explizit auslösen. Vollständige geräteübergreifende Zwischenablage bleibt offen.

### RED SSO – explizite Mehrfachfreigabe in den Einstellungen

Die Owner-Oberfläche kann bis zu elf öffentliche JSON-Kopplungsanfragen (eine je Zeile) prüfen und gemeinsam atomar freigeben. Doppelte Apps/Challenges, unerwartete Felder und ungültige Eingaben werden abgelehnt. Vollständige Challenges erscheinen vor der ausdrücklichen Bestätigung; Änderungen an Eingabe, Server oder Sitzung erzwingen erneute Prüfung. Die UI speichert keine Verifier und erstellt keine gemeinsame Sitzung. Jede Ziel-App muss innerhalb der Freigabefrist separat claim-login abschliessen. Bei unklarer Antwort App-Zugänge prüfen statt blind erneut freizugeben. Native Browser-SSO-Redirects und Geräteabnahme bleiben offen.

### RED AI Gateway – lokaler Owner-Pilot

Nur für einen bewusst konfigurierten nativen Home-Server: `REDION_LOCAL_AI_MODELS=qwen2.5-coder:7b` erlaubt genau dieses Modell. Leere Konfiguration deaktiviert die API. Owner-only `GET /home/ai/models` nennt konfigurierte (nicht auf Installation geprüfte) Modelle; `POST /home/ai/generate` erwartet exakt `model`, `prompt` und `confirmLocalProcessing:true`. Fester Provider `http://127.0.0.1:11434/api/generate`, keine URL-Eingabe, Redirects, Tools, Dateizugriffe oder externen Provider-Adapter. Maximal 16 KiB UTF-8 Prompt, 512 generierte Tokens, Kontextlimit 4096, 60 Sekunden Zeitlimit, eine parallele Generierung pro Serverprozess. Keine Prompt-/Antwortpersistenz durch REDION; Ollama kann eigene Logs führen. Der Administrator muss ausschliesslich tatsächlich lokal laufende Offline-Modelle konfigurieren und Ollama-Egress separat kontrollieren; der feste Loopback-Transport beweist nicht, dass Ollama intern keine Cloud nutzt. Die normale Docker-Bridge erreicht Host-Ollama nicht automatisch, daher keine Docker-Netzwerkänderung. Kein Zugriff mit App-Token, keine UI, kein Streaming und keine MCP-Generierungsbefugnis. Tests mit simuliertem Provider; Hardwareprüfung separat.

### RED MCP Hub – Owner-Verbindungsverwaltung

`GET /home/mcp-hub/connections` liefert maximal 128 aktive eigene OAuth-Freigaben mit Anzeigename, Scopes, Anzahl freigegebener Arbeitsbereiche, Remember-Flag und opaque Grant-ID. `POST /home/mcp-hub/revoke` akzeptiert genau `{id,confirm:true}` und nutzt die existierende OAuth-Widerrufslogik (Epoch-Wechsel); bereits ausgegebene Zugriffstokens verlieren ihre Berechtigung. Beide Routen benötigen eine echte Owner-Gerätesitzung; App-/MCP-Tokens und fremde Web-Origins bleiben gesperrt. Verwaltung bestehender Freigaben bleibt auch bei deaktiviertem MCP möglich. Keine Tokens, Client-Secrets, Workspace-IDs, externen MCP-Server oder Tool-Ausführung. Das Dashboard zählt nun nur aktive Grants des angemeldeten Kontos. Integrationstest mit echtem lokalem OAuth-Flow und Widerruf. Native UI, externe Serververwaltung und weitere App-Aktionen bleiben offen.

SDK 0.15 ergänzt für RED Clipboard einen authentifizierten Inbox-Empfangsvertrag: verschlüsselten Payload und Empfangs-ID zuerst gemeinsam atomar im App-Adapter speichern, danach ACK. Bei ACK-Fehler ist die erneute Zustellung innerhalb der logischen Gültigkeit idempotent, sofern der Adapter den Vertrag erfüllt. Native Datenbank-/Keychain-Integration und Ablaufbereinigung bleiben offen.
