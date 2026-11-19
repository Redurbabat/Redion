# RED ION · OAuth-/MCP-Reparatur für ChatGPT

Stand: 19. November 2026. Ziel ist der bestehende Worker mit
`https://red-ion.redurbabat7.workers.dev/mcp/cloud`.
Diese Anleitung ergänzt die historischen Nachweise in RED-ION-CLOUD-MCP.md.
Produktive Aktivierung benötigt die ausdrückliche Freigabe aus dem Auftrag.

## Nachgewiesene Fehler und Änderungen

- Die öffentliche OAuth-Discovery und der MCP-Endpunkt werden am Cloudflare
  Edge zur Access-Anmeldung umgeleitet (302, HTML). Das erklärt die fehlende
  Discovery für einen nicht angemeldeten MCP-Client. Der Worker kann eine
  vor ihm liegende Access-Regel nicht korrigieren.
- Ein bestehender Verbindungsversuch verwendet noch den separaten alten
  MCP-Host, dessen Discovery auf die Zustimmung im Hauptworker verweist.
  Der neue Hauptworker erwartet dagegen seine eigene Ressource `/mcp/cloud`.
  Diese Konfigurationen müssen beim Neuverbinden vereinheitlicht werden.
- `client_name` war Pflicht; eine gültige öffentliche DCR-Anfrage ohne Namen
  erhielt 400. Der Name ist nach [RFC 7591 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2)
  optional. Jetzt liefert auch diese Registrierung 201 und eine dauerhafte
  Client-ID; die Zustimmung zeigt einen als unbenannt gekennzeichneten Client.
- Leere/widersprüchliche Grant- und Response-Listen wurden akzeptiert und
  durch eine feste Antwort ersetzt. Registrierte Grant-Typen werden jetzt
  gespeichert und durchgesetzt. Ohne Grant-Angabe gilt `authorization_code`;
  `refresh_token` muss angefordert werden. Ungültige Rückgabeadressen liefern
  `invalid_redirect_uri`, andere ungültige Metadaten `invalid_client_metadata`.
- Bei gemeinsamer D1 akzeptierte ein anderer MCP-Ressourcenpfad denselben
  Zugangstoken. Client und Token-Fingerabdrücke sind jetzt an die vollständige
  Ressource gebunden, auch auf demselben Host. Alte ungebundene Anmeldungen
  werden abgewiesen und verlangen erneute Registrierung und Zustimmung.
- Der Transport prüft Origin, JSON-Inhaltstyp, Accept und Protokollversion.
  Er handelt 2025-11-25, 2025-06-18 oder 2025-03-26 aus, bestätigt Notifications
  körperlos mit 202 und bleibt zustandslos. Es gibt keine serverseitige
  Session-ID, die beim nächsten Worker-Aufruf verschwinden könnte.
- Gesperrte oder gelöschte Konten können bestehende Tokens nicht mehr für
  Cloud-MCP verwenden oder aktualisieren. Die Challenge nennt zuerst
  `redion:read`; Schreiben bleibt eine eigene, ausgeschaltete Zustimmung.

Die Gegenproben für DCR, Ressourcenbindung, Origin und Kontosperre waren vor
der Reparatur rot. Die Verbindung mit einem echten ChatGPT-Konto ist damit
noch nicht nachgewiesen. Für den historischen Fehler „Session terminated“
liegt kein reproduzierbarer ChatGPT-Protokollmitschnitt vor; lokal bestehen
jetzt Handshake, SDK-Aufrufe, Token-Erneuerung und Wiederverbindung.

## Betroffene Dateien

`server/mcp/oauth.ts`, `server/mcp/cloud-router.ts`, die OAuth-/HTTP-/Router-
und Browserprüfungen unter `pruefungen/redion-mcp-cloud-*.mts`, eine zusätzliche
workerd-Prüfung, deren npm-Befehl in `package.json` und diese Anleitung.
Keine Änderungen an persönlichen Dokumenten, lokalem App-Profil, Desktop-
Werkzeugen oder dem elektrischen Modell. Keine neue Produktabhängigkeit.

## Aktuelle Datenbank und Rückwärtskompatibilität

Die bereits gebundene D1 enthält `mcp_state` mit `key`, `kind`, `data`,
`expires` und `revision` sowie die bestehenden Konto-, Rechte- und Sync-Tabellen.
Eine Tabellen-/Spaltenabfrage wurde ohne Schreibzugriffe ausgeführt.
Der frühere Dokumentationsstand „DB fehlt“ ist für diese Einrichtung überholt.
`mcp_commit_guard` bleibt erhalten; dieser Transport benötigt es nicht.

Diese Reparatur braucht **keine SQL-Migration**. Zusätzliche OAuth-Felder
liegen im vorhandenen JSON-Zustand. Alte Dokumentformate und verschlüsselte
Sätze bleiben erhalten. Alte OAuth-Clients/Tokens bleiben gespeichert,
werden im reparierten Dienst aber nicht mehr als gebundene Anmeldung akzeptiert.
Die KI muss einmal neu verbunden werden. Anschliessend bleibt die neue
gemerkte Zustimmung bis Widerruf erhalten; zusätzliche Rechte fragen erneut.

## Prüfung

```powershell
npm run typecheck
npm run typecheck:mcp
npm run test:mcp-cloud
npm run test:mcp-cloud-browser
node pruefungen/alle.mts server
node pruefungen/lauf/test620.mts
node pruefungen/lauf/test102.mts
```

Die Cloud-Suite prüft Discovery, DCR, S256, einmalige Codes, exakte Redirects,
Code-/Tokenablauf, Client-/Ressourcenbindung, Refresh-Rotation und Replay,
Widerruf, CSRF, Ratenbegrenzung, Rechteverringerung und explizite Schreibfreigabe.
Der echte MCP-SDK-Client registriert sich ohne Namen, initialisiert, liest
eine künstliche Seite, erhält keine Schreibwerkzeuge und verbindet sich neu.

Der Browserlauf verwendet lokale HTTPS-Testseiten und künstliche Daten;
er prüft Lesen, gemerkte Zustimmung, ausgeschaltete Schreibfreigabe und
Widerruf in Desktop-Hell/Dunkel sowie einer mobilen Chromium-Ansicht.
Screenshots und Laufzeitdiagnosen bleiben unter ignoriertem `bilder/`.

Zusätzlicher lokaler Cloudflare-Lauf ohne Netz oder produktive Bindungen:

```powershell
# Auf den Einstiegspunkt des bereits vorhandenen Wrangler-Pakets setzen.
$env:REDION_WRANGLER_ENTRY='<Pfad zum vorhandenen wrangler/bin/wrangler.js>'
npm run test:mcp-cloud-runtime
```

Er bündelt den echten `worker.ts` und verwendet workerd mit isolierter D1.
Geprüft werden echte DCR-/Token-HTTP-Wege, ein SDK-Leseaufruf, gesperrtes
Schreiben, Widerruf, wiederholtes MCP-Schema bei vorhandenen Daten sowie
der erhaltene Schutz von Zustimmung, Einstellungen, Webseite und Sync.
Jeder ausgehende Worker-Netzaufruf wird gesperrt und gezählt.
Die menschliche Identität ist in den lokalen Zustimmungsprüfungen synthetisch;
die Anmeldung beim echten Cloudflare-Access-Konto bleibt eine eigene Abnahme.

`npm run stand` meldet im übernommenen, unveränderten Web-Grundstock einen
veralteten Dienststempel. Keine Datei dieses Grundstocks wurde für die
OAuth-Reparatur geändert. Das ist ein gesonderter bestehender Build-Befund;
der gesamte Repository-Lauf ist deshalb nicht als grün belegt.
Echtes iPhone und persönliche Windows-App: **NICHT GETESTET**.

## Produktionsänderung zur Freigabe

1. Aktuellen Commit und Worker-Version festhalten. Vorhandene Access-Anwendung
   samt Zielen, Policy-Zuordnung und Einstellungen privat sichern. Den aktiven
   Gratis-Tarif prüfen; bei unklaren Kosten oder nötigem Tarifwechsel stoppen.
2. Aktuellen D1-Time-Travel-Bookmark privat notieren. Falls zusätzlich ein
   SQL-Export gewünscht ist: ausschliesslich im privaten Redion-Backup-Ordner
   ausserhalb des Repositories speichern. Keine Tokens, Backups oder
   Account-Diagnosen in Git. Verfügbarkeit des Wiederherstellungspunkts vor
   einer späteren Migration prüfen. Diese Reparatur führt keine Migration aus.
3. Ausschliesslich den geprüften Reparaturstand auf den bestehenden Worker
   `red-ion` veröffentlichen. Die bestehende D1-Bindung und Access-Secrets
   erhalten; keine Datenbank, R2-Ressource, Domain oder kostenpflichtigen
   Ersatzdienst erstellen. Es gibt keine konfigurierte isolierte Cloud-
   Testumgebung; der lokale workerd-Test ersetzt keinen Produktionsnachweis.
4. In der vorhandenen Worker-Access-Anwendung **nur** diese sieben exakten
   Protokollpfade von der vorgeschalteten interaktiven Anmeldung ausnehmen:

   ```text
   /.well-known/oauth-authorization-server
   /.well-known/oauth-protected-resource
   /.well-known/oauth-protected-resource/mcp/cloud
   /register
   /token
   /revoke
   /mcp/cloud
   ```

   Für die vorhandene Worker-Destination unterstützt Cloudflare
   `overrides` mit `behavior: "public"` und jeweils einem exakten
   `path_pattern`. Vor dem Speichern die aktuelle Destination lesen und
   alle übrigen Eigenschaften und bestehenden Overrides erhalten.
   Keine pauschale Ausnahme für `/mcp/*`, `/.well-known/*` oder den Host.
   Die Webseite, `/mcp/authorize`, `/mcp/settings`, Sync und API bleiben
   durch Access geschützt. `/mcp/cloud` prüft weiter jeden OAuth-Token;
   Registrierung und Tokenausgabe behalten Validierung und Ratenbegrenzung.
5. Ohne Access-Cookie prüfen: Discovery 200/JSON; gültige DCR 201; MCP ohne
   oder mit ungültigem Token 401 mit Bearer-Challenge; Webseite und Zustimmung
   weiter geschützt. Danach echte Anmeldung, nur Lesezustimmung und ein
   Leseaufruf über ChatGPT. Den alten separaten Host nicht weiter als
   austauschbaren Alias verwenden.

Cloudflare dokumentiert die [Worker-/Pfad-Hierarchie](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
und die [exakten Destination-Overrides](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/update/).
Die Ausnahmen sind eine bewusste Änderung der Zugriffsgrenze und benötigen
ebenso wie das Deployment ausdrückliche Zustimmung.
Zum Backup siehe [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

**Rückfall:** Zuerst die sieben neuen Ausnahmen zurücknehmen, sodass Access
den MCP-Weg wieder schliesst. Danach eine zuvor geprüfte Worker-Version
wiederherstellen. Datenbank und persönliche Dokumente nicht zurücksetzen;
für diese Codeänderung ist keine Datenwiederherstellung erforderlich.
Eine alte ungebundene OAuth-Version nicht bei weiter geöffneten Protokollwegen
als Sicherheits-Rollback verwenden. Eine Bookmark-Wiederherstellung würde
auch neuere Daten zurücksetzen und benötigt eine eigene Freigabe.

## Geprüfter Stand am 19. November 2026, abends

Gelesen, nicht verändert: Worker `red-ion`, letzte Bereitstellung 17:56 UTC;
D1 `DB` = `redion` (`18b0f926-e522-4b77-8063-ca3399c478ae`). Access-Anwendung
„red-ion - Cloudflare Workers“ (`77ddd13f-…`), ein Ziel vom Typ Worker
(`red-ion`, Produktions- und Vorschauadressen), eine Richtlinie „Cloudflare
account members“ (Allow), keine Overrides.

Ohne Access-Cookie liefern **alle** sieben Protokollwege 302 zur Access-Anmeldung,
ebenso Webseite, `/mcp/authorize`, `/mcp/settings`, `/sync/runter` und
`/api/stand`. Die Pfadausnahmen sind also **noch nicht** gesetzt.

**Warum noch nicht:** `overrides` lassen sich nur über die API setzen
(`PUT …/access/apps/{id}`, Berechtigung **„Access: Apps and Policies Write“**).
Die Dashboard-Oberfläche bietet sie für Worker-Ziele nicht an, und die
wrangler-Anmeldung hat keinen Access-Scope (`wrangler login --scopes-list`
nennt keinen). Ohne ein von Redur erteiltes Recht wird nichts geändert.

| Prüfung | Ergebnis |
|---|---|
| `npm run typecheck` | bestanden |
| `npm run typecheck:mcp` | bestanden |
| `npm run test:mcp-cloud` | bestanden, 29/29 |
| `npm run test:mcp-cloud-browser` | nicht ausführbar: `pwsh.exe` (PowerShell 7) fehlt auf diesem Rechner |
| `npm run test:mcp-cloud-runtime` | bestanden, 1/1 (wrangler 4.164 aus dem npx-Cache) |
| `node pruefungen/alle.mts server` | bestanden, 9/9 |
| `node pruefungen/lauf/test620.mts` | bestanden, 15/15 |
| `node pruefungen/lauf/test102.mts` | bestanden |

**CI.** „Quelltext und Logik“ und „Schneller Lauf“ brachen ab, weil
`493cba74c`/`126737404` die ERZEUGTE `quell/…/einstellungen/ansicht/seite.js`
von Hand änderten (die Quelle `seite.ts` hatte die Änderung schon). Dienststand
und Einzeldatei waren dadurch veraltet. Neu gebaut (`85e712742`), v1615, ohne
Funktionsänderung. „Workers Builds: red-ion“ scheitert an `wrangler preview`
(Beta): es verlangt `[[previews.d1_databases]]`. Der vorgeschlagene Block
hinge jede Vorschau an die Produktions-D1 — **nicht** übernommen; eine eigene
Vorschau-D1 wäre eine neue Datenbank. Entscheidung offen.

**Access-Ausnahmen gesetzt (19.11., 19:18 UTC).** Mit Redurs eigenem, eng
begrenztem API-Token („Access: Apps and Policies Edit“, nur lokal ausserhalb
des Repositories) zuerst die Anwendung gelesen und privat gesichert, dann am
einzigen Worker-Ziel genau sieben `overrides` (`behavior: "public"`, exakte
`path_pattern` ohne `*`) ergänzt. Richtlinie, Identitätsanbieter und alle
übrigen Felder unverändert. Produktiv ohne Cookie gemessen:

| Weg | Ergebnis |
|---|---|
| drei Discovery-Wege | 200, `application/json` |
| `/register` gültig ohne Namen / fremde Redirect-URI | 201 / 400 |
| `/mcp/cloud` ohne Token / ungültiger Token | 401 mit `Bearer resource_metadata=…, scope="redion:read"` / 401 |
| `/token` ohne gültigen Code, `/revoke` ohne Client | 400 / 401 |
| `/`, `/index.html`, `/mcp/authorize`, `/mcp/settings`, `/sync/runter`, `/api/stand`, `/konto/ich`, `/mcp` | 302 zu Access |
| Unterpfade `/register/x`, `/mcp/cloud/x`, `/tokenx` | 302 zu Access |

**ChatGPT bestätigt (19.11., abends).** Redur verband die private App
„Redion v05“ neu mit `/mcp/cloud`. Im Worker-Protokoll (`wrangler tail`):
Discovery 200, `/mcp/authorize` (Access, Zustimmung nur `redion:read`, gemerkt),
`/token` 200, danach 12 × `POST /mcp/cloud` 200 und eine Notification 202.
Eine Anfrage erhielt 400: ChatGPT (`openai-mcp/1.0.0`) versucht zuerst
`mcp-protocol-version: 2026-07-28` mit `server/discover` und fällt danach auf
`initialize` mit einer unterstützten Fassung zurück — harmlos. ChatGPT las
Arbeitsbereiche (1, „Mein Redion“), Dokumentliste und Suche (je 0 Treffer, weil
die Cloud-D1 seit E797 leer ist) und erhielt für fremde Arbeitsbereiche und
unbekannte Seiten die erwarteten Abweisungen. Schreibwerkzeuge: keine, wie
vorgesehen. Lesen eines echten Dokuments: noch nicht möglich (keine Daten).

**Rückfall:** die sieben `overrides` wieder entfernen (Sicherung der Anwendung
liegt privat bei Redur), dann schliesst Access den MCP-Weg wieder.

**Weitere Befunde.** `test550` ist auf diesem Zweig rot (E792/E793 im
Verzeichnis ohne Text), `test109` wie bekannt. Der alte separate Host
`red-ion-mcp.redurbabat7.workers.dev` antwortet noch mit 200 und teilt dieselbe
D1; er sollte nach der Umstellung stillgelegt werden (eigene Freigabe).

## ChatGPT nach der Freigabe verbinden

In der Verwaltung des vorhandenen privaten Plugins die MCP-Verbindung
neu konfigurieren bzw. neu verbinden. Nur eine Verbindung auf den Zielhost
einrichten; alte Clientdaten des separaten MCP-Hosts nicht übernehmen.

| Feld | Wert |
|---|---|
| Name | RED Ion |
| MCP-URL / Ressource | `https://red-ion.redurbabat7.workers.dev/mcp/cloud` |
| Authentifizierung | OAuth, dynamische Clientregistrierung (DCR) |
| PKCE | S256 |
| Basis-Scope | `redion:read` |
| OIDC | Aus |
| Token-Authentifizierung | `none` für den öffentlichen Client |
| Client-ID / Geheimnis | Von DCR erzeugen lassen, nicht manuell erfinden |

Discovery liegt am selben Host unter `/.well-known/oauth-authorization-server`.
Autorisierung: `/mcp/authorize`; Registrierung: `/register`; Tokens: `/token`;
Widerruf: `/revoke`. Für dauerhafte Token-Erneuerung muss der Client zusätzlich
den Grant-Typ `refresh_token` registrieren; er benötigt dafür keinen weiteren
Daten-Scope. Nur `redion:read` ist für die erste Datenfreigabe erforderlich.

Die Anmeldung und Bereichsauswahl selbst bestätigen. Die Verwaltung zeigt
den jeweils genauen OAuth-Rückweg; DCR speichert diesen exakt. Keine pauschalen
Redirect-Wildcards und keine geratenen Callback-Adressen eintragen.
Danach zuerst die Werkzeugliste und einen ausdrücklich freigegebenen
Leseaufruf prüfen. Die Cloud bietet drei Lesewerkzeuge; mit getrennt
erteiltem `redion:write` kommen drei Schreibwerkzeuge hinzu.
Die alte Plugin-Werkzeugliste muss auf diesen Dienst aktualisiert werden.
Das ist keine Erweiterung der lokal vorhandenen Desktop-Werkzeuge.

Die aktuellen [OpenAI-Authentifizierungsregeln](https://developers.openai.com/plugins/build/auth)
beschreiben DCR, S256, Ressourcenbindung und die in der Plugin-Verwaltung
angezeigte Rückgabeadresse. Eine erfolgreiche lokale SDK-Prüfung ist kein
Beleg für eine erfolgreiche ChatGPT-Registrierung.

Ohne laufenden Laptop stehen ausschliesslich ausdrücklich freigegebene,
bereits synchronisierte und nicht privat verschlüsselte Cloud-Inhalte zur
Verfügung. Neue Bildschirmaufnahmen, lokale Fenstersteuerung und nicht
abgeglichene Daten verlangen die laufende Windows-App. Ein iPhone-Layout
im Browser belegt keinen Test auf einem echten iPhone.
