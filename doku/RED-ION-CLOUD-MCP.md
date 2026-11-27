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


## Sichere Schaltplanerstellung über Cloud-MCP (Erweiterung 23.11.2026)

'redion_add_schematic' erstellt ausschliesslich einen **leeren** nativen
Schaltplanblock. Aufrufen mit 'workspaceId', 'documentId', 'expectedVersion'
und 'art'; optional 'titel' (maximal 120 Zeichen) und 'requestId' (8–100
Buchstaben/Zahlen, '_' oder '-'). Die zugelassenen Planarten stammen aus
'src/bereiche/bloecke/arten/schaltplan.ts'. Die Funktion verwendet dieselbe
atomare D1-Transaktion wie 'redion_add_block': erst wenn Block und
Elternreferenz gemeinsam gespeichert werden können, ist die Erstellung
erfolgreich. Ein identischer Wiederholungsaufruf ist idempotent.

Die 'plan'-Daten enthalten die passende Blattgrösse und die drei nativen
Ebenen 'plan', 'aufgabe', 'loesung'. Bauteile, Leitungen und Texte sind
initial leer; die Funktion behauptet **keine** geprüfte Verdrahtung.
Ein anschliessender Aufruf von 'redion_read_schematic' kann den
Schaltplan auslesen. Schreiben ist nur mit aktivem OAuth-Scope
'redion:write' und Seitenbearbeitungsrecht möglich. Eine neue Planart
kann nicht über 'redion_add_block' an dessen Typensperre vorbei erzeugt
werden.

Wichtig: 'redion_update_schematic' (Bauteile und Leitungen bearbeiten)
wird dadurch **nicht** implementiert. Vor produktiver Nutzung sind
Deployment, Connector-Aktualisierung und ein Live-Test notwendig.


## Schalterkombinationen mit MCP prüfen

`redion_read_schematic` gibt wie bisher den Schaltplan und seine `version` zurück.
Für eine Prüfung sendet der Client zusätzlich `expectedVersion` und einen
`switchTest` mit `switchIds`, `targetId` und der booleschen Sollfolge `expected`.
Mit drei Schaltern sind zum Beispiel acht Sollwerte nötig, wenn jeder Schalter
zwei Stellungen hat. Der letzte Schalter in `switchIds` wechselt am schnellsten.

Die Antwort enthält einen Bericht pro Kombination. Sie nennt die Schalterstellung,
den Sollwert, den gemessenen Zustand, Fehler und Annahmen. Die Prüfung rechnet
aus der Ruhelage und speichert den Schaltplan nicht. Ein nicht modelliertes
Bauteil oder ein instabiler Zustand wird ausdrücklich gemeldet. Die Cloud prüft
höchstens 32 Kombinationen mit bis zu 60 Bauteilen, 100 Leitungen und begrenzter
Punktzahl. Grosse Pläne benötigen kleinere Teilpläne.

Die Rechnung verwendet dieselbe erzeugte Simulationsdatei samt Fachzeichen und
Klemmenmodell wie die App. Der vorhandene Lesezugriff auf die eingebettete Seite
ist erforderlich. Die Prüfung ersetzt keine elektrische Norm- oder Sicherheitsabnahme.

Für einen einzelnen Betriebspunkt sendet der Client statt `switchTest` ein
`operatingPoint` mit `switches` (Liste von `{componentId, position}`) und
`componentIds` (ein bis acht Messobjekte). Nicht genannte Schalter bleiben
in Ruhelage. Bei Wechselstrom gibt die Antwort unter anderem Effektivwerte
`Ubetrag` in Volt und `Ibetrag` in Ampere sowie `P` in Watt zurück.
Bei mehrpoligen Bauteilen stehen Werte pro Glied bereit. Fehlende Messwerte
sind ausdrücklich gekennzeichnet. Der Aufruf misst einen statischen Zustand.

## Schaltpläne mit MCP erweitern (23.11.2026)

Beim Verbinden sucht der gemeinsame Redion-Router einen orthogonalen Weg.
MCP prüft die beiden Winkel und bis zu 40 Wege mit einem Versatz. Der Weg
muss im Blatt bleiben, die fremden Klemmen und Bauteile umgehen und Abstand
zu vorhandenen Leitungen halten. Die Prüfung umfasst alle Ebenen, weil das
elektrische Modell sie gemeinsam wertet. Findet die begrenzte Suche keinen
passenden Umweg, bleibt die Planversion unverändert. Gemeinsame Leitungsenden
und Verzweigungen müssen weiterhin im Editor angelegt werden.

'redion_update_schematic' erweitert einen bereits gespeicherten
Schaltplan-Block, ohne beliebige Fremd-JSON-Daten zu akzeptieren.
Erforderlich sind 'workspaceId', 'blockId', 'expectedVersion' (die
Version aus 'redion_read_schematic') und 'operation'.

Die drei unterstützten Operationen:

- 'add_component': 'componentId', 'symbolId', 'x', 'y' sowie optional
  'rotation' (0/90/180/270), 'mirrored', 'layer' und 'bmk'.
  'symbolId' muss aus dem eingebauten Fachzeichenkatalog stammen;
  Koordinaten liegen im 10-Pixel-Raster.
- 'connect_terminals': 'wireId', 'fromComponentId', 'fromTerminal',
  'toComponentId', 'toTerminal' sowie optional 'layer'. Die Anschlussnamen
  werden gegen die wirklichen Klemmen des gespeicherten Symboltyps geprüft.
  Die Endpunkte berücksichtigen Drehung und Spiegelung. Zwischenpunkte
  werden rechtwinklig gelegt. Neue Leitungen, die eine fremde Klemme oder
  bestehende Leitung im selben Zeichen-Layer berühren, werden abgelehnt.
  Das ist ein konservativer Schutz vor unbeabsichtigten Verbindungen,
  **keine** vollständige Netz-, Kollisions- oder elektrische Sicherheitsprüfung.
- 'add_label': 'labelId', 'labelText', 'x', 'y', optional 'layer'.
- 'move_component': 'componentId', 'x', 'y'. Verschiebt **nur ein
  unverbundenes** Bauteil; wenn eine Leitung eine Klemme bereits berührt,
  wird die Aktion zurückgewiesen. Angeschlossene Bauteile ausschliesslich
  im nativen Editor mit dessen Netzschutz verschieben.
- 'move_label': 'labelId', 'x', 'y'. Verschiebt nur den Textanker, nicht
  andere Zeichnungselemente.

Jeder Aufruf schreibt genau einen vorhandenen Schaltplanblock und benötigt
'redion:write' sowie Seitenbearbeitungsrecht. Die SQLite-Änderung ist an
die alte Blockversion gebunden, damit gleichzeitige Schreibvorgänge
nicht die Änderungen des jeweils anderen überschreiben. Zu alte Versionen
ergeben 'conflict'; der Client muss neu lesen. Mehrfache Aufrufe mit
denselben Daten und alter Version sind nicht automatisch idempotent.
Bei Erfolg werden 'elementId', 'elementType' und die neue Blockversion
zurückgegeben. Für das nächste Schreiben ist diese neue Version zu nutzen.

Die Funktionen sind für Zeichnungen und Lernpläne gedacht.
Die Antwort enthält deshalb explizit 'electricalValidation:false' und
'routingVerified:false'. Vor praktischer Verdrahtung ist eine unabhängige
fachliche Prüfung notwendig. Schaltplanänderungen sind erst nach Worker-
Deployment, Connector-Aktualisierung und Live-Test produktiv nutzbar.


## Durchsuchbare Blockinhalte (23.11.2026)

Die Funktion 'redion_search' durchsucht neben Seitentitel und Markdown
jetzt auch **direkte und verschachtelte Klartextblöcke**. Ein Block
ist nur durchsuchbar, wenn seine ID in der 'content'-Liste seines
unmittelbaren Elternblocks steht, dessen 'parentId' genau diesen
Elternblock nennt und alle Vorfahren zur selben unverschlüsselten,
lesbaren Seite gehören. Gelöschte und verschlüsselte Blöcke sowie
Datenbankzeilen werden auf **jeder** Hierarchiestufe ausgelassen.
Zyklische und verwaiste Referenzen sind keine Suchtreffer.

Die rekursive SQL-Suche ist auf **vier Blockebenen** und höchstens
**1'200 besuchte Knoten je Seite** begrenzt. Treffer jenseits dieser
Grenzen werden nicht vollständig erfasst. Diese feste Grenze verhindert
übermässige D1-Rechenlast, ist aber **keine vollständige Indexierung**
sehr grosser verschachtelter Notizen.

Das Ergebnis enthält weiterhin ausschliesslich Seiten-IDs und Titel,
keine untergeordneten Block-IDs oder Treffer aus verbotenen Bereichen.
Paginierung zählt nur lesbare Seiten. Nicht-ASCII-Begriffe werden
nach Prüfung der Seitenrechte mit Unicode-Casefold verglichen.
Verschlüsselte Inhalte werden niemals in der Cloud durchsucht.


## Text- und Aufgabenblöcke sicher bearbeiten (23.11.2026)

'redion_update_block' ändert **nur** bereits eingebettete, unverschlüsselte
Text- und Aufgabenblöcke. Voraussetzungen: 'workspaceId', 'blockId',
'expectedVersion' aus 'redion_read_block' und die gewünschte 'operation'.

- 'set_text' mit 'text' bis 8'000 Zeichen. Unterstützt Text, H1/H2/H3,
  Aufzählung, Nummerierung, Zitat, Code und Todo. Ein Todo-Titel darf
  nicht leer sein.
- 'set_checked' mit 'checked:true/false' ist ausschliesslich für Todo.
- 'set_note' mit 'note' bis 2'000 Zeichen ist ausschliesslich für Todo.
- 'set_due_date' mit 'dueDate' (gültiges JJJJ-MM-TT-Datum), leerer Wert
  entfernt das Datum aus der Aufgabenansicht.

Alle anderen Felder der jeweiligen Operation werden verweigert; ein
rohes JSON-Update ist **nicht** möglich. Geprüft werden der OAuth-Scope
'redion:write', die Seitenberechtigung zum Bearbeiten sowie die tatsächlich
gespeicherte Elternkette. Jeder Vorfahr muss den Kindblock in seiner
'content'-Liste referenzieren, im selben Arbeitsbereich/auf derselben
Seite liegen, nicht verschlüsselt oder gelöscht sein und schliesslich
in der echten Seite enden. Verwaiste bzw. ausgegliederte Blöcke und
Datenbankzeilen werden nicht direkt bearbeitet.

Ein SQLite-Update erhöht die Blockversion nur, wenn sie mit
'expectedVersion' übereinstimmt; bei gleichzeitiger Änderung muss
der Client den Block erneut lesen. Eine unveränderte Operation gibt
das Feld 'unchanged:true' mit
unveränderter Version. Die Elternseite wird nicht überschrieben.
Die Funktion ist **keine** Bearbeitung von Schaltplänen, Tabellenzellen
oder privaten verschlüsselten Blöcken. Produktionsbereitstellung und
Connector-Aktualisierung bleiben separate Schritte.

## Grosse Zeichenobjekte lesen

`redion_read_visual` liefert bei kleinen Objekten wie bisher die vollständigen
Daten. Für eine Mindmap sendet der Client `collection: "nodes"` oder
`collection: "connections"`. Für ein Whiteboard sendet er
`collection: "shapes"`. Die Antwort gibt `items`, `version` und
`nextOffset` zurück. Sie enthält bis zu 40 Elemente und höchstens
28.000 UTF-8-Bytes an Elementdaten.

Für die Folgeseite wird `nextOffset` als `offset` übergeben. Der Client
sendet dieselbe `collection` sowie die gelesene Version als
`expectedVersion`. Bei einem Versionskonflikt beginnt er erneut bei
Offset null. Ein einzelnes Element über der Bytegrenze wird als zu gross
gemeldet. A4-Blätter behalten ihre Metadatenantwort.

## Whiteboard-Auswahlen bearbeiten

`redion_update_visual` akzeptiert bei einem Whiteboard zusätzliche
Operationen. `selection` enthält bis zu 40 vorhandene Formkennungen.
Ein ausgewähltes Gruppenmitglied nimmt seine ganze Gruppe mit.

- `group_selection` bündelt die Auswahl unter einer neuen, freien `groupId`.
- `ungroup_selection` löst die äusserste Gruppe auf und erhält innere Gruppen.
- `align_selection` richtet einzelne Formen oder ganze Gruppen mit
  `alignment` aus. Die Werte `left`, `center`, `right`, `top`, `middle`
  und `bottom` richten aus. `horizontal` und `vertical` verteilen ab drei
  unabhängigen Formen oder Gruppen.
- `move_selection` verschiebt die Auswahl um `dx` und `dy`.
- `order_selection` ordnet die Auswahl mit `order` neu. `front` und `back`
  bewegen sie ganz nach vorne oder hinten. `forward` und `backward` ändern
  die Reihenfolge um einen Schritt.

Die Operationen verwenden die Geometrie des Whiteboard-Editors und
dessen Felder `groupId` und `groupPath`. Gesperrte Mitglieder verhindern
die Änderung der Auswahl. Verbinder bleiben über ihre Endpunkte
verknüpft. Die Prüfung von Schreibrecht, Elternkette und
`expectedVersion` gilt auch hier.

## Mindmap-Knoten und Querverbindungen einzeln bearbeiten

`redion_update_visual` akzeptiert für eine Mindmap vier weitere Operationen:

- `append_node` fügt mit `node` einen Knoten unter einer vorhandenen
  `parentId` hinzu. `node` verwendet dieselben Felder wie beim Erstellen
  einer Mindmap.
- `move_node` hängt `elementId` und seinen gesamten Ast unter
  `parentId` um. Die Wurzel und die innere Struktur des Asts bleiben
  erhalten. Ein eigener Nachfahre ist kein gültiges Ziel.
- `add_connection` ergänzt mit `connection: {id, from, to}` eine
  Querverbindung zwischen zwei vorhandenen Knoten.
- `remove_connection` entfernt die Querverbindung mit der Kennung
  `elementId`. Ihre Knoten bleiben erhalten.

Alle vier Operationen verwenden den vorhandenen Seiten- und Versionsschutz.
Die Mindmap behält ihren Aufbau und Ausschnitt. MCP akzeptiert bis zu 200
Knoten und 200 Querverbindungen, begrenzt durch Datensatzgrösse und
Baumtiefe. Für grosse Karten stehen versionierte Leseseiten bereit.
