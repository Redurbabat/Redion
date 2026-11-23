# RED Ion Cloud-MCP · Gratis-Betrieb und aktueller Nachweis

Stand: 18. November 2026. Laufender Ausbau zu E792/E793, **kein fertiger Dienst**.

## Verbindliche Kostengrenze

Redur: „also wird es etwas kosten wenn ja stope es“. Kostenpflichtige
Cloud-Einrichtung ist gestoppt. Kein Tarifwechsel, kein neuer R2-Bucket,
keine kostenpflichtigen KI-Dienste oder kostenpflichtige Domain.

Im bestehenden Cloudflare-Konto wurde unter **Workers plans** der aktive
Tarif **Free · $0 · Current plan** tatsächlich gelesen. Der Gratis-Tarif
begrenzt Workers auf 100.000 Anfragen täglich und 10 ms CPU pro Anfrage.
D1 Free hat 5 GB Gesamtspeicher sowie tägliche Lese-/Schreibkontingente.
Bei ausgeschöpftem Gratis-Kontingent muss die Funktion aussetzen;
Redion darf weder einen Tarifwechsel noch einen kostenpflichtigen Ersatz
auslösen. Vor einer späteren Bereitstellung den Tarif erneut prüfen.

Die kurz zuvor angelegte D1-Datenbank war leer: keine Tabellen und keine
Nutzdaten. Nach dem Kostenstopp wurde sie entfernt und die leere Datenbankliste
verifiziert. Kein neuer Cloud-MCP-Worker und kein neuer R2-Bucket wurden
bereitgestellt. Bestehende andere Ressourcen bleiben unverändert. Keine
gelöschte oder historische D1-Kennung in Konfigurationen übernehmen.

Quellen, am 18. November 2026 geprüft:
[Workers-Preise](https://developers.cloudflare.com/workers/platform/pricing/),
[D1-Preise und harte Free-Grenzen](https://developers.cloudflare.com/d1/platform/pricing/).
Diese Prüfung belegt den Tarif zu diesem Zeitpunkt, keine unbegrenzte
Gratis-Verfügbarkeit oder Preisgarantie des Anbieters.

## Was ohne Laptop möglich sein soll

Ein serverloser HTTPS-MCP-Endpunkt bedient freigegebene synchronisierte Daten.
Neue Fensteraufnahmen und nicht synchronisierte Inhalte eines ausgeschalteten
Geräts sind nicht verfügbar. Herkunft und Aktualität müssen erkennbar sein.
Die App übernimmt Cloud-Änderungen beim nächsten vorhandenen Abgleich.

Der Dienst baut auf dem vorhandenen Datenmodell auf. `mcp_state` enthält
ausschliesslich Anmelde-/Freigabemetadaten, keine Dokumente. Private
verschlüsselte Sätze bleiben für den Cloud-Dienst unlesbar. Ohne ausdrückliche
Freigabe werden keine lokalen Dokumente entschlüsselt oder hochgeladen.
Anhänge bleiben bis zu einem gesondert geprüften kostenlosen Dateipfad lokal.
Grosse Bild-/PDF-Bytes werden nicht ersatzweise in D1-JSON gespeichert.

## Bereits implementiert und lokal geprüft

- OAuth-Discovery für geschützte MCP-Ressource und Autorisierungsserver.
- Registrierung öffentlicher und vertraulicher Clients; S256-PKCE,
  exakte Rückgabeadresse und Bindung an die MCP-Ressource.
- Zustimmung für ausdrücklich ausgewählte zugängliche Arbeitsbereiche.
  Leserechte, Schreibrechte und Bildrechte getrennt.
- Gemerkte Freigabe bis Widerruf; zusätzliche Rechte fragen erneut.
  Ohne „merken“ wird beim nächsten Anmeldevorgang wieder gefragt.
- Zugangstoken 15 Minuten, rotierende Refresh-Tokens mit 30 Tagen Inaktivitäts-
  grenze. Nutzung verlängert die Sitzung; Wiederverwendung eines alten
  Refresh-Tokens sperrt die betroffene Sitzung. Widerruf einer Freigabe
  sperrt alle daran gebundenen Tokens bei der nächsten Prüfung.
- Codes werden per SQL-Vergleich atomar genau einmal verbraucht. Alte
  Schreibstände ändern keine inzwischen widerrufene oder erneuerte Freigabe.
- Tokens, Client-Geheimnisse und CSRF-Werte liegen nur als SHA-256-Abdruck
  in D1. Kleine begrenzte Formulare, getrennte Konten, Schutz gegen fremde
  Formularanfragen, begrenzte Registrierung und begrenztes Aufräumen.
- Eigenständige Zustimmungs- und Widerrufsseiten ohne Fremdskripte oder
  externe Bilder. Identität muss vom bestehenden Kontotor geprüft werden;
  ein Client-Header oder ein Formular-Benutzername genügt niemals.

**15 Modell-/HTTP-/SQLite-Fälle bestanden**, darunter ein echter
OAuth-Client aus dem bereits freigegebenen MCP-SDK 1.32.2 mit Discovery,
Registrierung, Zustimmung, Tokenaustausch und automatischem Refresh.
Sein Fetch-Weg läuft gegen den tatsächlichen lokalen Request/Response-Router;
er ist noch kein Nachweis für den öffentlichen Endpunkt.

**Ein Browser-Ablauf bestanden:** tatsächlicher lokaler HTTPS-Prüfserver,
Chromium, echte Formulare und Redirects, künstliches Konto, Arbeitsbereichswahl,
gemerkte erneute Verbindung und Widerruf. Hell/Dunkel am Desktop sowie 390 px
mobile Darstellung angesehen. Das flüchtige Testzertifikat verändert keinen
Windows-Zertifikatsspeicher. Screenshots nur unter ignoriertem `bilder/`.

Die Browserprüfung fand P150: `no-referrer` machte den eigenen Formular-Origin
zu `null`; `form-action 'self'` blockierte danach den registrierten OAuth-
Rückweg. Auth-Seiten verwenden jetzt `same-origin` und erlauben zusätzlich
nur den Ursprung des validierten registrierten Rückwegs. Fremde Origins
und unbekannte Rückgabeadressen bleiben gesperrt. Der echte Browser wurde
anschliessend gegen HTTPS und einen lokalen Callback erfolgreich geprüft.

## ChatGPT-Schreibrechte ausdrücklich freigeben

In RED ION (Web/Windows/iOS) zeigt **Einstellungen → MCP → ChatGPT & KI-Freigaben**
den Link **Freigaben verwalten**, sobald ein angemeldeter HTTPS-Wolkenserver
konfiguriert ist. Der Link führt zu `/mcp/settings` des eingetragenen Servers.
Diese Seite ist nur erreichbar, wenn der OAuth-Dienst dort tatsächlich
bereitgestellt und die Anmeldung angebunden wurde; der Link allein schaltet
**keine** Rechte frei.

Der KI-Client muss beim erneuten Verbinden `redion:read redion:write`
anfordern. Erst dann erscheint im OAuth-Zustimmungsformular die Checkbox
**Schreiben erlauben**; sie ist **standardmässig ausgeschaltet**.
Ohne Haken wird ausschliesslich das angeforderte Leserecht (und ggf.
separat angeforderte Bildrechte) erteilt, niemals `redion:write`.
Schreiben setzt ausserdem voraus, dass das angemeldete Konto in **jedem**
ausgewählten Arbeitsbereich Bearbeitungsrechte hat. Die Cloud prüft das auf
dem Server, nicht im Browser.

Der ausgestellte OAuth-Code und die Token enthalten nur die tatsächlich
freigegebenen Scopes; spätere Token-Aktualisierungen dürfen sie nicht
erweitern. Die Verwaltung listet echte Freigaben und erlaubt Widerruf.
Ein bestehender Lese-Client bekommt durch die Oberfläche **nicht**
automatisch Schreibrechte. Er muss den OAuth-Ablauf erneut mit
`redion:write` starten; das ChatGPT-Plugin muss diesen Scope ebenfalls
anfordern und dessen Werkzeuge serverseitig korrekt durchsetzen.

**Grenze:** Diese Änderung implementiert die Zustimmung im vorhandenen
Cloud-MCP-Entwurf. Sie aktiviert nicht das bereits extern angeschlossene,
nur lesende ChatGPT-Plugin und stellt keinen Cloud-Worker bereit. Die
wirkliche Verbindung, Speicherung, Konto-Identität, Gerätesynchronisation
und die Schreibwerkzeuge müssen separat geprüft werden.

## Cloud-Transport auf dem Worker (PR #211, 19.11.2026)

Der Worker enthält jetzt einen getrennten HTTPS-MCP-Endpunkt
**/mcp/cloud** mit OAuth-Schutz und begrenztem JSON-RPC. Er bietet
Arbeitsbereichsliste, Suche, Seiten lesen, Seiten erstellen, Titel
ändern und Text ersetzen. Alle Werkzeuge verwenden die vorhandene
Tabelle **saetze** und prüfen Berechtigungen für die ausgewählten
Arbeitsbereiche. Verschlüsselte private Daten bleiben unlesbar.
Erstellung benötigt eine requestId gegen Doppelanlage; Änderungen
benötigen expectedVersion und einen atomaren Versionsvergleich.

### Zwei Zugriffswege – nicht vermischen

**OAuth-Protokollwege (separater Schutz, explizit begrenzt):**
/mcp/cloud, /register, /token, /revoke und die beiden
OAuth-Discovery-Adressen im .well-known-Pfad.
Der MCP-Werkzeugserver verlangt für jede Anfrage einen gültigen
widerrufbaren OAuth-Bearer-Token.

**Menschliche Zustimmung (Cloudflare Access zwingend):**
/mcp/authorize und /mcp/settings. Hier wird ein vorher
verifiziertes Cloudflare-Access-JWT mit der E-Mail-Adresse
eines bestehenden Redion-Kontos verknüpft. Ohne übereinstimmendes,
nicht gesperrtes Konto gibt es keinen Zugriff. Der Modus
TOR=offen darf keine Schreibfreigaben erzeugen.

Cloudflare Access kann Anfragen schon vor dem Worker sperren.
Damit ChatGPT überhaupt Discovery, Registrierung und /mcp/cloud
erreichen kann, muss der Betreiber **nur für die aufgeführten
Protokollwege** passende Access-Pfadausnahmen konfigurieren.
Die gesamte Webseite und die Zustimmungsseiten bleiben geschützt.
Der Worker allein kann die Edge-Policy nicht ändern.

### Aktuelle Einrichtungsgrenze

Im bestehenden wrangler.toml ist derzeit **keine aktive
D1-Bindung DB** eingetragen. Deshalb antwortet der neue Endpunkt
bis zur Einrichtung bewusst mit HTTP 503. Es wird **keine**
Datenbank, kein R2-Bucket und kein kostenpflichtiger Dienst
automatisch angelegt.

Vor der Aktivierung im richtigen Cloudflare-Konto:

1. Bereits existierende D1-Datenbank und deren UUID sowie
   Eigentümerkonto prüfen; eine Datenbank aus einem fremden
   Konto darf nicht verwendet werden.
2. Nur eine vorhandene und geprüfte Datenbank als **DB** binden.
   Das bestehende server/schema.sql muss bereits vorhanden
   sein; danach server/mcp/schema.sql mit den MCP-Metadaten
   (mcp_state) in derselben D1 ausführen.
3. Cloudflare-Free-Kontingente erneut prüfen, keine Tarife ändern.
4. Cloudflare-Access-Pfade wie oben einstellen und mit einem
   nicht eingeloggten MCP-Client sowie einer menschlichen
   Access-Anmeldung testen.
5. Die genaue öffentliche URL des Worker-Projekts prüfen
   (nicht aus einem Repositorynamen raten), und in ChatGPT
   einen **neuen** MCP-Connector auf dessen /mcp/cloud-Pfad
   mit den Scopes redion:read redion:write verbinden.
6. Auf der OAuth-Zustimmungsseite den Arbeitsbereich und
   den anfangs ausgeschalteten Schalter „Schreiben erlauben“
   ausdrücklich bestätigen. Mit einer **Testseite** lesen,
   bearbeiten, widerrufen, Sync und Laptop-Aus prüfen.

Die bereits eingerichtete, separate ChatGPT-App meldet noch
**redion:read**. Ein GitHub-Merge oder Cloudflare-Build schaltet
ihre Rechte nicht automatisch um.

## Weiter offen · nicht als verbunden ausgeben

1. Vorhandenes Access-/Redion-Konto sicher an den Router anschliessen;
   kein `TOR=offen`, kein Abschalten des Schutzes der bestehenden Website.
2. Cloud-MCP-Transport und vorhandene App-Aktionen an die bestehende
   Datenablage mit Versions-/Rollenprüfung anschliessen.
3. Optionalen Windows-Abgleich mit gesicherter Anmeldung und automatischer
   Wiederverbindung fertigstellen; Offline-/Konflikt-/Neustart-Roundtrip.
4. Ausschliesslich im erneut bestätigten Gratis-Tarif bereitstellen;
   tatsächliche HTTPS-Adresse erst nach Bereitstellung und Prüfung nennen.
5. Echtes ChatGPT-Plugin und einen weiteren kompatiblen MCP-Client verbinden;
   Zugriff mit beendetem Windows-Prozess sowie spätere Zusammenführung prüfen.

**NICHT GETESTET:** D1 im Cloudflare-Runtime, Cloud-Deployment, öffentliches
MCP, echte Cloud-Anmeldung, persönliche Dokumentfreigabe, Datenabgleich nach
Laptop-Aus, ChatGPT-Verbindung, iPhone/macOS-Hardware. Die bestehende Windows-
Installation enthält diesen noch nicht angebundenen Cloud-Ausbau nicht.

Lokale Befehle:

```powershell
npm run test:mcp-cloud
npm run test:mcp-cloud-browser
npm run typecheck
npm run typecheck:mcp
```

Für den Browserlauf müssen die bereits vorhandenen Playwright-Browser
auffindbar sein. Er braucht Zugriff auf seine kurzlebigen Loopback-Server
und PowerShell 7 für ein nur im Test erzeugtes Zertifikat. Kein Cloud-Konto
und keine persönlichen Daten erforderlich. Kein Dienst wird dabei bereitgestellt.


## Blockbasierte Seiten über MCP lesen (Erweiterung 23.11.2026)

'redion_read_page' liest nur den Markdown-Text in 'inhalt'. Seiten, deren
Inhalt als referenzierte Blöcke unter 'content' gespeichert ist, benötigen
zusätzlich 'redion_list_page_blocks'. Die Antwort meldet im Feld
'blockStorage' entweder 'referenced' (eine Blockliste ist gespeichert) oder
'none' (keine Blockliste); aus Datenschutzgründen wird keine Anzahl
unlesbarer Blöcke angegeben. Ein leeres Markdown bedeutet bei
solchen Seiten **nicht**, dass keine Inhalte vorhanden sind.

Das neue reine Lese-Werkzeug nimmt 'workspaceId', 'documentId' sowie
optional 'parentBlockId', 'limit' (1–20), 'offset' und 'expectedVersion'.
Die Antwort enthält 'blocks' in Dokumentreihenfolge, 'parentVersion'
und 'nextOffset'. Nur tatsächlich lesbare direkte Kindblöcke zählen
bei der Paginierung; verschlüsselte, gelöschte, fremde und falsch
zugeordnete Datensätze werden ausgelassen. Für den nächsten Seitenaufruf
'expectedVersion' auf die zuvor gelieferte 'parentVersion' setzen.
Ein Versionskonflikt muss mit einem frischen Abruf ab Offset 0
behandelt werden. Verschachtelte Blöcke werden durch 'parentBlockId'
gesondert abgefragt.

Die Rückgabe enthält pro Block einen Textausschnitt von höchstens 2000
Zeichen und 'textTruncated'. Bei Bedarf kann ein zulässiger einzelner
Block über 'redion_read_block' vollständig gelesen werden. Komplexe
Blöcke wie Schaltpläne werden nicht ungeprüft als Rohdaten ausgeliefert;
dafür ist 'redion_read_schematic' vorgesehen. Der bisherige
'redion_read_block'-Abruf eines Elternblocks mit mehr als 40 direkten
Kindreferenzen kann noch 'too_large' melden; dafür das paginierte
Werkzeug verwenden.

**Freigabe:** Neue Worker-Tools stehen im ChatGPT-Connector nicht automatisch
nach GitHub-Merge oder Cloudflare-Build bereit. Erst nach Deployment,
aktualisierter Toolliste und Live-Prüfung sind sie produktiv nutzbar.


## Fachzeichen über Cloud-MCP (Erweiterung 23.11.2026)

'redion_list_symbols' liefert die 131 eingebauten elektrotechnischen
Fachzeichen mit ID, Name, Gruppe, Kennbuchstabe, Grösse und Anschlussnummern
sowie deren Rasterkoordinaten. Die Filter 'gruppe' und 'suche' sind optional;
ohne Filter wird der gesamte eingebaute Katalog ausgegeben. Die Gruppen
'ch-schema' und 'ch-bauplan' umfassen die Schweizer Schemas und Bauplanzeichen
einschliesslich Steckdosen Typ 13/23.

Die Cloud-Liste ist ein read-only Snapshot des Registers
'src/register/fachzeichen.ts'. Automatische Tests gleichen alle eingebauten
Symbole samt Anschlusskoordinaten mit dem kanonischen Register ab.
Gerätebezogene Symbolerweiterungen sind nicht enthalten. Die Zeichen sind
für die Ausbildung gedacht und ersetzen weder geprüfte Normbibliotheken noch
die fachliche Prüfung eines Elektroinstallationsplans.

Nach dem Cloudflare-Release muss die ChatGPT-Werkzeugliste aktualisiert werden;
dieser Commit schaltet die Funktion nicht automatisch in bestehenden
Connector-Bindungen frei.
