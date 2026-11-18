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

## Bereitgestellt am 18. November 2026 (E794)

- MCP-Link: **`https://red-ion-mcp.redurbabat7.workers.dev/mcp`**
  (öffentlich, OAuth; Discovery unter `/.well-known/oauth-protected-resource/mcp`).
- Anmeldung: `https://red-ion.redurbabat7.workers.dev/mcp/authorize` hinter Access;
  Freigaben verwalten/widerrufen: `…/mcp/settings`.
- D1 `redion` (`18b0f926-e522-4b77-8063-ca3399c478ae`), Tarif vorher und nachher
  als Free · $0 gelesen. Öffentlich gemessen: 401 ohne Token, 403 bei fremdem
  Origin, 302 zu Access auf der Anmeldeseite.
- `cloud-runtime.mts` läuft im echten workerd (Miniflare 4 und 5) und verlangt
  null Anfragen nach aussen; `REDION_WRANGLER_ENTRY` zeigt auf eine vorhandene
  wrangler-Installation, wenn keine im Projekt liegt.

## Weiter offen · nicht als verbunden ausgeben

1. Vorhandenes Access-/Redion-Konto sicher an den Router anschliessen;
   kein `TOR=offen`, kein Abschalten des Schutzes der bestehenden Website.
2. Cloud-MCP-Transport und vorhandene App-Aktionen an die bestehende
   Datenablage mit Versions-/Rollenprüfung anschliessen.
3. Optionalen Windows-Abgleich mit gesicherter Anmeldung und automatischer
   Wiederverbindung fertigstellen; Offline-/Konflikt-/Neustart-Roundtrip.
4. ERLEDIGT (E794): im erneut bestätigten Gratis-Tarif bereitgestellt, Adresse oben.
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
