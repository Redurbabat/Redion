<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, mcp]
stand: 25. September 2026
head: 1b89c01
---

# I · MCP, Server-API, CLI-Vorläufer

I · MCP, Server-API, CLI-Vorläufer — drei Wege nach aussen, die heute nebeneinander stehen: (1) `Api` (`src/bereiche/verbinden/schnittstelle.ts`), die /v1/-Schnittstelle in Notions Form, IM BROWSER beantwortet; der Dienst-Arbeiter (`src/dienst/sw.ts:373-407`) reicht echte `fetch('/v1/…')` und Notions `/api/v3/…` (`Transaktion`, `src/kern/ablage/befehle.ts`) ans offene Fenster durch. (2) Der optionale Server (`server/kern.ts`, Cloudflare Worker über `worker.ts` → `server/cloudflare.ts`, lokal `server/pruefserver.ts`) mit 14 Wegfamilien, darunter ein schmaleres `/v1/` (nur pages GET/PATCH, search, users/me) und `/mcp` (JSON-RPC 2.0, vier Werkzeuge). (3) MCP im Browser (`src/bereiche/ki/werkzeuge.ts`, global `MCP`): Client zu fremden HTTP-MCP-Servern und ein eigener Katalog `notizen_*`, der nur beantwortet, was ihm jemand hereinreicht. Dazu die Node-Werkzeuge in der Wurzel (bauen, chronik, dienststand, bilder, karte, volllauf, alle, bruecke, zehn TS-Umzugshelfer) — jedes mit eigener `process.argv`-Auswertung, ohne gemeinsamen Einstieg. Ein `redion`-CLI gibt es nicht: `grep -i doctor|inspect *.mts pruefungen/*.mts src/kern src/core` → 0 Treffer; `package.json` hat kein `bin`. Geometrie hat dieses System keine (grep getBoundingClientRect|clientX|clientY|transform|zoom|hitTest|snap in schnittstelle.ts und server/*.ts → 0 Treffer). HEAD 855475f, 25. September 2026.

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/bereiche/verbinden/schnittstelle.ts` | `Api` — /v1/ in Notions Form, im Browser: Token (Z.53-66, meta `apiToken`), fehler() mit Notion-Codes (Z.71), TYP_API Spaltentyp→Notion (Z.97-111), wertRaus/wertRein (Z.113-201), elternVon/seiteRaus (Z.206-232), BLOCK_API/API_BLOCK (Z.236-249), blockRaus (Z.252), datenbankRaus (Z.294, scannt Store.cache.blocks Z.295), blaettern start_cursor/has_more (Z.337), OP_API/filterRein/sortRein → eigene Filterform (Z.362-405), anfrage(methode,pfad,koerper,kopf) Dispatcher pages/blocks/databases/search/users/comments (Z.419-540), Handgriffe seiteAnlegen…kommentarSchreiben (Z.545-735), horchen() = SW-Relais `api-anfrage` (Z.744-761), Dialog mit Token und Probe-Fenster (Z.813-895), Export Z.899-902, `window.Api` Z.906 | 906 |
| `src/dienst/sw.ts` | Der Weg von aussen ins Fenster: beimFenster() (Z.373-407) — 503 ohne offenes Fenster (Z.375-380), MessageChannel mit 5-s-Uhr (Z.399-405), fetch-Handler fängt /v1/ und /api/v3/ auch für POST/PATCH/DELETE (Z.447-455); GRUNDSTOCK nennt schnittstelle.js (Z.256) und konten.js (Z.216) |  |
| `src/kern/ablage/befehle.ts` | `Transaktion` — Notions interne /api/v3/loadPageChunk, queryCollection, submitTransaction mit set/update/listAfter/listBefore/listRemove (Kopf Z.9-23); holen/sichern gegen Store (Z.49-60); Export Z.532 (ausfuehren, befehlAusfuehren, abspielen, verlauf, …), `window.Transaktion` Z.538; wird von Api.horchen für /api/v3/ gerufen (schnittstelle.ts:752-754) |  |
| `src/bereiche/ki/werkzeuge.ts` | `MCP` — Client: server()/serverSpeichern meta `mcp:server` (Z.51-52), Freigabeliste `mcp:freigabe` (Z.55-63), ruf() JSON-RPC über Verbindungen.ruf mit Mcp-Session-Id und SSE-Entpacken (Z.66-92), verbinden/werkzeugeHolen/werkzeugRufen (Z.95-125); Server-Seite: eigenerKatalog() = Agent.WERKZEUGE als `notizen_*` (Z.163-171), beantworten() initialize/tools/list/tools/call mit Konten.darf (Z.173-200); Export Z.430-432; Kopfkommentar Z.24-27 verspricht „bruecke.js … echter MCP-Server“ — bruecke.mts kennt weder MCP noch JSON-RPC (grep → 0) | 435 |
| `server/kern.ts` | Der Serverkern, ohne zu wissen wo er läuft (Kopf Z.1-25): antwort/fehler (Z.47-55), teile (Z.194), beantworteRoh Dispatcher (Z.208-306): OPTIONS Z.216, /api/stand Z.225, /s/{schluessel} öffentlich Z.241, /konto Z.244, werFragt Z.247, torPruefen für Marken Z.255, dann sync/datei/freigabe/feldrecht/veroeffentlichen/bereich/protokoll/marken/push/v1/mcp (Z.259-269), 500 mit Kennung statt Innenbau (Z.289-305); beantworte = mitSicherheitsKopf(mitCors(…)) Z.315; kontoWeg Z.322 (ich, abmelden, loeschen, code, code-freigeben, code-holen, oauth, geraete, geraete/{id}/weg); syncWeg Z.734 (/sync/runter, /sync/hoch); bereichWeg Z.878 (POST/GET, {id}/besitz, {id}/suche, PATCH); feldrechtWeg Z.1089; freigabeWeg Z.1145; oeffentlichZeigen Z.1217; veroeffentlichenWeg Z.1283; pushWeg Z.1404 (schluessel, anmelden, wecken, abmelden); markenWeg Z.1530 (POST, GET, DELETE {kennung}); protokollWeg Z.1580; v1Weg Z.1604-1701 (pages GET/PATCH, search, users/me; Unterwege 404 Z.1630-1632); MCP_WERKZEUGE Z.1706-1731; mcpWeg Z.1734-1833; _intern Z.1836 | 1838 |
| `server/ablage.ts` | Sieben-Funktionen-Ablage (Kopf Z.1-17): SCHEMA als Zeichenkette (Z.23-194), TABELLEN 12 Namen (Z.196-198), SCHLUESSEL je Tabelle (Z.201-208), ablageSpeicher Map-basiert (Z.213-277), ablageD1 mit `?`-Parametern, nie Werte im Text (Z.280-355; einrichten führt SCHEMA aus Z.294-299), blobsSpeicher (Z.366), blobsR2 (Z.378) | 387 |
| `server/typen.ts` | Die fünf Formen: Satz/Wo/FindeOpt (Z.36-49), Ablage (Z.58-67), Blobs Schlüssel `bereich/dateiId/nr` (Z.70-79), Kopfzeilen klein (Z.87), Anfrage (Z.95-102), Antwort (Z.105-109), Wer = Konto + Sitzung ODER Marke (Z.117-122), Umwelt (Z.130-152). Erzeugt nichts (Z.27-29) | 152 |
| `server/schema.sql` | 12 Tabellen für D1: konten (Z.1), sitzungen (Z.11), bereiche (Z.20), saetze (Z.29-41: id, bereich, tabelle, daten TEXT, verschluesselt, seite, version, geaendert, geloescht, vonGeraet; PK bereich+id), freigaben (Z.45), oeffentlich (Z.56), protokoll (Z.70), marken (Z.81-91: wert PK, art, kontoId, bereich, name, rechte, angelegt, bis, benutzt), feldrechte (Z.99), bremse (Z.126), dateien nur Metadaten (Z.141), weckrufe ohne Erinnerungstext (Z.168) | 178 |
| `server/cloudflare.ts` | Übersetzung Request↔Kern: alsAnfrage mit Grössenprüfung VOR dem Lesen (Z.27-59), alsAntwort (Z.62), ohneDatenbank 503 mit den vier wrangler-Schritten (Z.65-76), istServerWeg Regex der 13 Familien + /v1/ + /api/stand (Z.78-80), bedienen (Z.84-131, Umwelt aus env inkl. blobs: env.R2 Z.126), geplant = Cron für Weckrufe (Z.138-146) | 146 |
| `server/pruefserver.ts` | Derselbe Kern auf diesem Rechner (Z.1-13): starte(port=8790, {ablage, blobs, holen, umwelt}) Z.27, http.createServer → beantworte (Z.36-72), stopp() das wirklich anhält (Z.74-117), Direktstart `node server/pruefserver.ts [port]` Z.124-131; `npm run server` (package.json) | 132 |
| `server/dateien.ts` | Anhänge in der Wolke: fünf POST-Wege /datei/melden\|stueck\|runter\|stand\|weg (Kopf Z.11-16, Code Z.97-183), DATEI_GRENZE 100 MB (Z.41), STUECK_GRENZE 2 MB (Z.46), dateiWeg Z.66 | 199 |
| `server/sicherheit/marken.ts` | Das Tor für Programme: MARKEN_RECHTE ['lesen','schreiben','alles'] Z.40, NUR_MIT_SITZUNG ['marken','freigabe','feldrecht','push'] Z.54, rechteVon Z.92, darfMarke Z.103, torPruefen(wer, familie, methode) Z.118-141 — Mensch passiert, Marke wird gegen Methode geprüft |  |
| `worker.ts` | Cloudflare-Einstieg: /api/bruecke → functions/api/bruecke.ts (Z.27-29), istServerWeg → bedienen (Z.36-39), /api/status Lebenszeichen (Z.43-49), Rest an env.ASSETS (Z.52-58) |  |
| `functions/api/bruecke.ts` | CORS-Brücke auf Cloudflare: ERLAUBT 18 Gegenstellen (Z.24-42), passt() mit .ics-Ausnahme (Z.44-47), kopfZurueck lässt Mcp-Session-Id durch (Z.49-55), onRequest Z.57 |  |
| `bruecke.mts` | Dieselbe Brücke zu Hause, Port 8081 (Z.11-13, 24): ERLAUBT 11 Gegenstellen (Z.28-33), passt() Z.35, http.createServer Z.38-77; kein MCP, kein JSON-RPC (grep → 0) | 80 |
| `src/kern/abgleich/maschine.ts` | `Wolke` — der Browser-Client zum Server: ruf(weg,{m,kopf,k}) mit Bearer-Token und Redion-Geraet (Z.77-110), Marken anlegen/listen/löschen über /marken (Z.1127-1135), Export Z.1169-1175, `window.Wolke` Z.1181 |  |
| `src/bereiche/verbinden/ansicht/wolke.ts` | Das Wolke-Fenster mit dem Marken-Reiter: „Eine Marke ist ein Schlüssel für ein Programm — für /v1/ oder für MCP“ (Z.833-836), Anlegen mit Rechten lesen\|lesen,schreiben und Tagen (Z.838-844) |  |
| `pruefungen/alle.mts` | Orchestrator aller Prüfläufe: Argumente --schnell, --alt, `server`, --liste, Nummern (Z.46-55), Kindprozess je Lauf mit 3 s Pause (Kopf Z.3-6); `npm run pruefen`. --schnell (E745) = jeder Lauf ohne Browser (Playwright-Import, gelesen aus der Datei) + SCHNELL_MIT_BROWSER (Z.80, test96/test100 aus §31) — das fährt die CI; --liste druckt die Auswahl ohne zu fahren und wartet aufs Schreiben, bevor es endet (Z.149), test610 prüft sie | 283 |
| `pruefungen/volllauf.mts` | Der volle Lauf in Stücken (E657, §30): --neu, --stand, --stueck N, --rot (Z.16-21), Merkdatei pruefungen/.volllauf-stand.json (Z.42), läuft nur bei Direktstart (Z.46) damit test553 die Zerlegung prüfen kann | 230 |
| `bauen.mts` | Baut redion-einzeldatei.html aus index.html, Stil und Skripten (Z.1-8); CSS-@import rekursiv mit Kreisprüfung (Z.19-45); `npm run bauen` | 171 |
| `chronik.mts` | Aus chronik/chronik.json → UR.md, PROBLEME.md, src/bereiche/chronik/daten.ts (Z.10-16); `--pruefen` für die CI (Z.31, 38) | 201 |
| `dienststand.mts` | Stempel über den GRUNDSTOCK, hebt VERSION in src/dienst/sw.ts und stand.ts (Z.1-22); grundstock() Z.34, inhaltsStempel() Z.41; `--pruefen` → Rückgabe 1 wenn veraltet; läuft in `npm run bauen:ts` | 117 |
| `bilder.mts` | Bildschirmfotos über eigenen http-Server (PORT 8891 oder REDION_BILD_PORT, Z.60) und Playwright; Argumente Ansicht und Gerät (Z.5-7); GERAETE Z.69 | 4324 |
| `karte.mts` | Die Karte des Quelltexts aus doku/karte/karte.json → doku/karte/*.md als Obsidian-Vault mit [[Verweisen]] und Mermaid-Graph (Z.1-31); `--pruefen` Z.38. Dieser Befund ist ein Eintrag dieser Quelle | 302 |

## Datenmodell

Dieses System hat KEIN eigenes IndexedDB-Fach und keinen eigenen Blocktyp. Drei Datenpfade: (1) BROWSER-API: `Api` liest und schreibt ausschliesslich über `Store` (Fächer blocks/collections/meta): `Store.getBlock` (schnittstelle.ts:466, indexdb.ts:438), `Store.childrenOf` (Z.485), `Store.rowsOf` (Z.664), `Store.cache.blocks` als Vollscan in datenbankRaus (Z.295) und suchen (Z.685), `Store.cache.collections` (Z.694); schreibend addRow/addPage/addBlock/addDatabase/updateBlock/updateCollection/setProp/trashBlock/restoreBlock (Z.559-651). Eigene Meta-Schlüssel: `apiToken` (Z.53, 63, 66); MCP: `mcp:server` (werkzeuge.ts:51-52), `mcp:freigabe` (Z.55), `mcp:eigenAus` (Z.165). Format auf der Leitung: Notions öffentliche Form — `{object:'page'|'block'|'database'|'list'|'error'|'user'|'comment'|'property_item'}`, Werte als `{number: 80}` statt intern `[["80"]]` (Kommentar Z.79-82), Zusatzfeld `redion_type` für Typen, die Notion nicht kennt (Z.122-124, 288-290); Fehler `{object:'error', status, code, message, request_id}` (Z.71-75); Blätterung `page_size` ≤ 100, `start_cursor` = Kennung (Z.44-46, 337-354). (2) SERVER: zwölf D1-Tabellen (schema.sql; identisch als Zeichenkette in ablage.ts:23-194). Ein Block/Sammlung/Ansicht ist ein `saetze`-Satz: `daten` TEXT = Klartext-JSON oder verschlüsseltes Paket, `verschluesselt` sagt welches (schema.sql:26-41); Server liest nur Klartext (kern.ts:1656, 1782). `/v1/pages/{id}` gibt `{object:'page', id, ...JSON.parse(satz.daten), last_edited_time: satz.geaendert}` zurück (kern.ts:1659-1660) — also die ROHE Redion-Form (text, props, alive …), nicht Notions Form wie im Browser; PATCH mischt `properties` in `daten` und zählt `version` hoch (Z.1666-1670). MCP `seite_anlegen` schreibt einen Satz `{type:'page', text, inhalt, parentId}` mit `tabelle:'blocks'`, `vonGeraet:'MCP'` (Z.1815-1820) — `inhalt` gibt es in RedionBlock nicht (src/core/types/block.ts kennt `content: BlockId[]`), `alive`, `created`, `content` fehlen. Marken: Tabelle `marken` (schema.sql:81-91), Wert Bearer-Token, `rechte` als Text, Rechte-Aufzählung MARKEN_RECHTE (marken.ts:40). Blobs: Schlüssel `bereich/dateiId/nr`, Bytes ausserhalb D1 (typen.ts:70-79, dateien.ts:1-8). (3) NODE-WERKZEUGE: keine Nutzdaten; Merkdatei `pruefungen/.volllauf-stand.json` (volllauf.mts:42), Chronik-Quelle `chronik/chronik.json` (chronik.mts:35), Karten-Quelle `doku/karte/karte.json` (karte.mts:36). Ein CLI hätte damit heute drei mögliche Datenquellen mit drei Formen: Notion-Form aus dem Browser (nur bei offenem Fenster, sw.ts:375-380), Roh-JSON aus `saetze` am Server (nur unverschlüsselt, nur nach Konto), oder die Sicherungsdatei `.redion`/`.json` (doku/REDION-FORMAT.md).

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Api` | global | `src/bereiche/verbinden/schnittstelle.ts:899-902, 906` | anfrage(methode, pfad, koerper?, kopf?) → {status, body}; start (= horchen), dialog, tokenHolen/tokenNeu/tokenWeg, FASSUNG '2022-06-28', TYP_API, BLOCK_API, API_BLOCK, seiteRaus, blockRaus, datenbankRaus, wertRaus, wertRein, filterRein, sortRein, richText. Gerufen von schale.ts:4112 (Api.start) und wissen/werkzeuge.ts:284 (Api.dialog) |
| `/v1/ im Browser` | http | `src/bereiche/verbinden/schnittstelle.ts:419-540` | Kopfzeilen Notion-Version\|Redion-Version Pflicht (Z.427-431), Authorization Bearer = meta apiToken (Z.434-441). Wege: POST /v1/pages · GET\|PATCH /v1/pages/{id} · GET /v1/pages/{id}/properties/{key} · GET\|PATCH\|DELETE /v1/blocks/{id} · GET\|PATCH /v1/blocks/{id}/children · POST /v1/databases · GET\|PATCH /v1/databases/{id} · POST /v1/databases/{id}/query (Filter/Sort → Datenbank.gruppeTrifftZu, Z.660-680) · POST /v1/search · GET /v1/users[/me\|/redion] · GET\|POST /v1/comments. Schreibende Zugriffe → Protokoll.notieren('api', …) (Z.455-457) |
| `api-anfrage (SW ↔ Fenster)` | ereignis | `src/dienst/sw.ts:399-405 → src/bereiche/verbinden/schnittstelle.ts:744-761` | postMessage {art:'api-anfrage', methode, pfad, koerper, kopf} mit MessageChannel; das Fenster antwortet {status, body}; /api/v3/ geht an Transaktion.anfrage (Z.752-754); 503 ohne Fenster, 504 nach 5 s |
| `Transaktion` | global | `src/kern/ablage/befehle.ts:532-538` | anfrage(methode, pfad, koerper, kopf) für /api/v3/loadPageChunk\|queryCollection\|submitTransaction; ausfuehren, befehlAusfuehren, abspielen, verlauf |
| `MCP` | global | `src/bereiche/ki/werkzeuge.ts:430-432` | VERSION '2024-11-05', server, verbinden, werkzeugeHolen, werkzeugRufen, ressourcenHolen, alleWerkzeuge, inAgentEinhaengen, eigenerKatalog, beantworten(jsonrpc) …; MCP.start() in schale.ts:4105; Einstellungen-Blatt 'mcp' (einstellungen/ansicht/seite.ts:950-960); Register.verbindungen Eintrag id 'mcp' (register/verbindungen.ts:98-102) |
| `Register.verbindungen 'mcp'` | register | `src/register/verbindungen.ts:98-102` | { id:'mcp', name:'MCP-Werkzeuge', art:'code', bereit: () => !!meta('mcpServer') } — prüft den Schlüssel `mcpServer`, während MCP unter `mcp:server` speichert (werkzeuge.ts:51); nicht gemessen, ob `mcpServer` je geschrieben wird |
| `beantworte(anfrage, ablage, umwelt)` | funktion | `server/kern.ts:315` | Der einzige Eingang des Serverkerns: Promise<Antwort>; gerufen von cloudflare.ts:131 und pruefserver.ts:57. `_intern` (Z.1836-1838) legt kontoWeg, syncWeg, freigabeWeg, feldrechtWeg, bereichWeg, v1Weg, mcpWeg, oeffentlichZeigen, htmlSeite, MCP_WERKZEUGE, oauthProfil, sitzungGeben für Prüfläufe frei |
| `Server-Wege (HTTP)` | http | `server/kern.ts:225-269, server/cloudflare.ts:78-80` | ohne Token: GET /api/stand, GET /s/{schluessel}, /konto/{ich\|abmelden\|loeschen\|code\|code-freigeben\|code-holen\|oauth/{anbieter}[/zurueck]\|geraete[/{id}/weg]}; mit Token: POST /sync/runter\|hoch, POST /datei/melden\|stueck\|runter\|stand\|weg, /freigabe, /feldrecht, /veroeffentlichen, /bereich[/{id}/besitz\|suche], GET /protokoll, /marken (POST/GET/DELETE {kennung}), /push/{schluessel\|anmelden\|wecken\|abmelden}, /v1/…, POST /mcp; Tor für Marken vor allen Wegen (Z.255) |
| `/v1/ am Server` | http | `server/kern.ts:1604-1701` | Bereich aus Kopf Redion-Bereich, ?bereich=, koerper.bereich oder Marke (Z.1610-1614); GET /v1/pages/{id} (Rolle je Seite, 409 verschluesselt), PATCH /v1/pages/{id}, POST /v1/search (linear über ≤500 saetze, Z.1683-1697), GET /v1/users[/me]; JEDER Unterweg → 404 mit Hinweis (Z.1630-1632); kein /blocks, /databases, /comments |
| `/mcp am Server` | mcp | `server/kern.ts:1706-1833` | JSON-RPC 2.0 nur POST; initialize (protocolVersion '2024-11-05', serverInfo redion 1.0.0), tools/list, tools/call, ping; Werkzeuge seiten_suchen(frage, grenze), seite_lesen(id), seite_anlegen(titel, inhalt, eltern), bereiche_zeigen; Bereich aus arg.bereich, Marke oder dem einzigen eigenen (Z.1767-1773); Fehlercodes -32602/-32000/-32001/-32002/-32601 |
| `Ablage / Blobs` | funktion | `server/typen.ts:58-79, server/ablage.ts:213, 280, 366, 378` | einrichten, hole, setze, weg, finde(wo, {geaendertNach, sortiere, absteigend, grenze}), zaehle, leeren? — zwei Umsetzungen (Speicher, D1) und zwei Blob-Ablagen (Map, R2) |
| `Wolke.ruf / markenAnlegen / markenListe / markeWeg` | funktion | `src/kern/abgleich/maschine.ts:77, 1127-1135` | Der Browser-Client zu jedem Serverweg: Bearer aus meta wolkeToken, Kopf Redion-Geraet; 401 räumt den Token weg (Z.100-106) |
| `Brücke` | http | `functions/api/bruecke.ts:57 (Cloudflare), bruecke.mts:38 (lokal, Port 8081)` | GET\|POST … /api/bruecke?ziel={url} bzw. http://localhost:8081/hol?ziel={url}; nur Gegenstellen aus ERLAUBT; MCP-Client nutzt sie über `ueberBruecke` (werkzeuge.ts:78) |
| `Node-Werkzeuge (Kommandozeile)` | funktion | `package.json scripts; bauen.mts, chronik.mts, dienststand.mts, bilder.mts, karte.mts, bruecke.mts, pruefungen/alle.mts, pruefungen/volllauf.mts` | npm run bauen \| pruefen [-- --schnell [--liste] \| NNN \| server] \| typecheck \| bauen:ts \| stand \| server \| veroeffentlichen; node chronik.mts [--pruefen]; node dienststand.mts [--pruefen]; node bilder.mts [ansicht] [geraet]; node karte.mts [--pruefen]; node pruefungen/volllauf.mts [--neu\|--stand\|--rot\|--stueck N]; node server/pruefserver.ts [port]; node bruecke.mts. Kein gemeinsamer Einstieg, kein `bin` in package.json, keine gemeinsame Argument-Auswertung (16 Dateien mit eigenem process.argv: benannte, bilder, chronik, deklarationen, dienststand, domtypen, fangfehler, fuelle, karte, rueckgabe, typenhilfe, umzug, unbenutzt, alle, messung-grosse-arbeitsbereiche, volllauf) |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | nein | nein | nicht gefunden — grep clientX\|clientY\|Point in src/bereiche/verbinden/schnittstelle.ts, src/bereiche/ki/werkzeuge.ts, server/*.ts → 0 Treffer |
| rect | nein | nein | nicht gefunden — grep getBoundingClientRect\|rect in denselben Dateien → 0 |
| bounds | nein | nein | nicht gefunden |
| transform | nein | nein | nicht gefunden — grep transform\|matrix → 0 |
| viewport | nein | nein | nicht gefunden |
| zoom | nein | nein | nicht gefunden — grep zoom\|scale → 0 |
| pan | nein | nein | nicht gefunden |
| selection | nein | nein | nicht gefunden (die Api arbeitet mit Kennungen, nicht mit Auswahl) |
| hitTest | nein | nein | nicht gefunden — grep hitTest\|trifft → nur Datenbank.gruppeTrifftZu (Filter, keine Geometrie; schnittstelle.ts:664) |
| snap | nein | nein | nicht gefunden |
| resizeHandles | nein | nein | nicht gefunden |
| rotation | nein | nein | nicht gefunden |
| group | nein | nein | nicht gefunden (Notions `column_list` wird nur abgebildet, schnittstelle.ts:244) |
| connector | nein | nein | nicht gefunden |
| frame | nein | nein | nicht gefunden |
| zOrder | nein | nein | nicht gefunden (die Reihenfolge der Kinder ist `content[]`, kein z; kinderAnhaengen setzt idx nach `after`, schnittstelle.ts:591-597) |
| undo | ja | nein | Im Browser geerbt, nicht eigen: Api schreibt über Store.updateBlock/addBlock/trashBlock/addRow (schnittstelle.ts:559-651), die `Verlauf` per Monkeypatch umschliesst (src/kern/zustand/verlauf.ts:100-108); Transaktion führt einen eigenen `verlauf` (befehle.ts:532). Am Server: kein Undo, nur `version`-Zähler und `geaendert` (kern.ts:1669-1670) |
| pointerNormalisierung | nein | nein | nicht gefunden — grep pointer\|Pointer → 0 |

## Gemeinsam genutzt

**Benutzt:** [[kern-Store|Store]] · [[kern-Register|Register]] · [[kern-Dateien|Dateien]] · [[kern-Api|Api]]

**Nur genannt, nicht benutzt:** [[kern-Verlauf|Verlauf]] — der Befund sagt, warum.

- Store (src/kern/ablage/indexdb.ts) — getBlock Z.438, getCollection Z.942, childrenOf Z.762, rowsOf Z.666, addRow Z.1058, addPage Z.771, addBlock Z.391, addDatabase Z.890, updateBlock Z.440, updateCollection Z.977, setProp Z.1086, trashBlock Z.467, restoreBlock Z.486, getMeta Z.1139, setMeta Z.1115, uid Z.374, now Z.379, cache Z.255 — von Api (schnittstelle.ts) und Transaktion (befehle.ts) und MCP (werkzeuge.ts:51-55)
- Datenbank.wert (src/bereiche/datenbanken/dienst.ts:384) und Datenbank.gruppeTrifftZu (dienst.ts:898) — schnittstelle.ts:117, 664, 670-673: ein Bereich (verbinden) ruft einen anderen (datenbanken), §5 Regel 1; Absicht laut Kommentar Z.359-361 („sonst hätten wir zwei Wahrheiten“)
- Protokoll.notieren (src/kern/ereignisse/protokoll.ts:109) — schnittstelle.ts:455-457 für POST/PATCH/DELETE
- Ids.short (src/core/helpers/ids.ts:69) — schnittstelle.ts:636, 651 für neue Spaltenschlüssel
- Ablage.kopiereJetzt (src/kern/helfer/ablage.ts:133) — schnittstelle.ts:875 Token kopieren
- App.zeichneSeite / App.zeichneBaum / App.aktuelleSeite (schale) — schnittstelle.ts:502, 527, 565, 573, 585, 605, 626, 641, 655, 734, 814: jede Schreiboperation ruft die Oberfläche
- UI.toast — schnittstelle.ts:872-873
- Transaktion (src/kern/ablage/befehle.ts) — schnittstelle.ts:752-754 für /api/v3/
- Verbindungen.ruf (src/bereiche/verbinden/konten.ts) — werkzeuge.ts:75 für MCP-Aufrufe, mit `ueberBruecke`
- Agent.WERKZEUGE und Konten.darf — werkzeuge.ts:163, 191 (eigener MCP-Katalog aus dem KI-Bereich)
- Store.getMeta('nutzer'|'email') — schnittstelle.ts:516-518 für /v1/users
- Server: sicherheit/cors.ts (mitCors, erlaubteAdressen), bremse.ts, kopfzeilen.ts (mitSicherheitsKopf), eingaben.ts (text, ausListe, koerperZuGross), marken.ts (torPruefen, darfMarke, rechteVon), push.ts — kern.ts:62-71, cloudflare.ts:16-17, pruefserver.ts:19
- Server: dateien.ts importiert antwort, fehler, jetzt, darf, rolleAuf, irgendeinRecht aus kern.ts (dateien.ts:34) — gegenseitiger Import kern.ts:71 ↔ dateien.ts:34
- Nichts aus src/core/ ausser Ids; nichts aus src/core/types/ (grep RedionBlock|RedionPage in schnittstelle.ts, server/ → 0) — die Api arbeitet mit `any`

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[gemeinsam|G · Gemeinsame räumliche Infrastruktur]]

1. **Das D1-Schema steht zweimal: als Datei und als Zeichenkette. Text ohne Kommentare gleich (gemessen), mit Kommentaren verschieden ab Zeile 112 („Die Bremse“-Kommentar). test87:560-602 bewacht die Tabellen und Spalten, nicht den Wortlaut.**
   - hier: `server/ablage.ts:23-24`
   - dort: `server/schema.sql:1`
   - Beleg: ablage.ts:23 `export const SCHEMA = \``, Z.24 `CREATE TABLE IF NOT EXISTS konten (` ↔ schema.sql:1 `CREATE TABLE IF NOT EXISTS konten (`
2. **Pfad in Teile zerlegen — dieselbe Zeile in Browser-Api und Serverkern**
   - hier: `src/bereiche/verbinden/schnittstelle.ts:409`
   - dort: `server/kern.ts:194`
   - Beleg: `const teile = (pfad: string) => pfad.replace(/^\/+|\/+$/g, '').split('/');` ↔ `const teile = (pfad: string) => String(pfad).replace(/^\/+|\/+$/g, '').split('/');`
3. **Die Fassungsprüfung mit Notions Fehlertext — wörtlich zweimal**
   - hier: `src/bereiche/verbinden/schnittstelle.ts:427-431`
   - dort: `server/kern.ts:1605-1608`
   - Beleg: beide: `fehler(400, 'missing_version', 'Notion-Version header failed validation: Notion-Version header should be defined, ' + 'instead was `undefined`.')`
4. **Zwei MCP-Werkzeugkataloge für dieselbe App (§8: keine doppelten Kataloge): der Server bietet vier `seiten_*`/`bereiche_zeigen`, der Browser bietet `notizen_*` aus Agent.WERKZEUGE — verschiedene Namen, Schemata und Rechteprüfung**
   - hier: `server/kern.ts:1706-1731`
   - dort: `src/bereiche/ki/werkzeuge.ts:163-171`
   - Beleg: kern.ts:1707 `{ name: 'seiten_suchen', description: 'Sucht Seiten im Arbeitsbereich …'` ↔ werkzeuge.ts:167 `name: 'notizen_' + k, description: w.beschreibung, inputSchema: { type: 'object', properties: {}, additionalProperties: true }`
5. **Die Suche über `saetze` steht im Serverkern zweimal (v1 und MCP) — gleiche Schleife, andere Grenze (500/400) und Ausgabeform**
   - hier: `server/kern.ts:1683-1697`
   - dort: `server/kern.ts:1777-1793`
   - Beleg: Z.1684 `const alle = await ablage.finde('saetze', { bereich: bereichId }, { sortiere: 'geaendert', absteigend: true, grenze: 500 });` ↔ Z.1779 `const alle = await ablage.finde('saetze', { bereich: bId }, { sortiere: 'geaendert', absteigend: true, grenze: 400 });` — beide danach `if (s.geloescht || s.verschluesselt) continue; if (frage && !String(s.daten || '').toLowerCase().includes(frage)) continue;`
6. **Zwei CORS-Brücken mit zwei Allowlists, die auseinandergelaufen sind: lokal 11 Einträge, Cloudflare 18 (dazu gmail.googleapis.com, p04/p05-calendars.icloud.com, nominatim.openstreetmap.org, de./en.wikipedia.org, .icloud.com)**
   - hier: `bruecke.mts:28-33`
   - dort: `functions/api/bruecke.ts:24-42`
   - Beleg: bruecke.mts:28 `const ERLAUBT = [ 'calendar.google.com', 'www.google.com', 'www.googleapis.com', 'p01-calendars.icloud.com', …, '.atlassian.net', '.ics', 'api.github.com' ];` ↔ functions/api/bruecke.ts:24 `const ERLAUBT = [ 'calendar.google.com', 'www.google.com', 'www.googleapis.com', 'gmail.googleapis.com', … 'nominatim.openstreetmap.org', 'de.wikipedia.org', 'en.wikipedia.org', '.atlassian.net', '.icloud.com' ];`
7. **`esc` je Datei neu — allein in src/bereiche/verbinden sechsmal (besprechung.ts:40, eingang.ts:41, kalender.ts:38, konten.ts:46, mail.ts:34, schnittstelle.ts:798) und in kern/helfer zweimal (tempo.ts:33, vorschau.ts:46); keine gemeinsame in src/core/helpers (grep → 0). Die Fassung der Api escapt KEIN `'` — §19 verlangt fünf Zeichen**
   - hier: `src/bereiche/verbinden/schnittstelle.ts:798-799`
   - dort: `src/kern/helfer/vorschau.ts:46 (und konten.ts:46 im selben Bereich)`
   - Beleg: schnittstelle.ts:798 `const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } …)` ↔ konten.ts:46 `const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');`
8. **`elVon` (Ereignisziel als Element) — 49 wörtliche Kopien im Projekt (grep -c 'const elVon = ' src → 49), auch im Kern**
   - hier: `src/bereiche/verbinden/schnittstelle.ts:37-38`
   - dort: `src/kern/ablage/befehle.ts:43-44 (und src/bereiche/ki/werkzeuge.ts:40-41)`
   - Beleg: identisch: `const elVon = (e: Event): Element | null => e.target instanceof Element ? e.target : null;`

## Prüfläufe

- `test68` — Die /v1/-Schnittstelle im Browser (Api.anfrage direkt): missing_version, unauthorized, users/me, pages, Datenbankzeile mit allen Werttypen, Blättern — 112 Zusagen
- `test69` — Ein echtes fetch('/v1/…') und /api/v3/ über den Servicearbeiter — ohne Server dahinter (Playwright, 21 Zusagen)
- `test70` — Transaktion: set/update/listAfter/listBefore/listRemove und loadPageChunk/queryCollection/submitTransaction
- `test71` — Das gemeinsame Protokoll — auch die 'api'-Einträge schreibender /v1/-Zugriffe
- `test74` — Die Einzeldatei läuft allein (bauen.mts-Erzeugnis ohne quell/ und app.css)
- `test75` — Der Server am Prüfserver: Rechte als Schloss, Veröffentlichen, /v1/ von aussen (Z.226), MCP initialize/tools/list/tools/call mit Marke (Z.289-354), Besitz, Protokoll, Sicherheit — 105 Zusagen
- `test76` — Die App am Server: anmelden, abgleichen, verschlüsseln mit zwei Geräten
- `test78` — Zwei Geräte ändern gleichzeitig — der Abgleich wirft nichts still weg
- `test79` — Rechte bis auf die einzelne Spalte (Feldrechte) am Server
- `test87` — Quelltextprüfung ohne Browser: u. a. die ZWEI Schemata schema.sql ↔ ablage.ts müssen gleich sein (Z.560-602), Rollen Oberfläche↔Server, Manifest, esc
- `test92` — Der Anmeldeschlüssel geht nur dorthin, wo er hingehört (Prüfserver, /v1/)
- `test93` — Die Bremse: wie oft jemand etwas versuchen darf (server/sicherheit/bremse.ts)
- `test94` — Die CSP der veröffentlichten Seite (/s/…) hält wirklich
- `test101` — Wie gross darf eine Anfrage sein — koerperZuGross am Prüfserver wie bei Cloudflare
- `test102` — „Diese Marke darf nur lesen“ — torPruefen an einer Stelle vor allen Wegen, auch /mcp (Z.111-112); 26 Zusagen
- `test118` — Offline geändert: beim Wiederverbinden kommt alles an (/sync)
- `test119` — Anhänge auf dem Server: /datei/melden|stueck|runter|stand|weg, Bytes rund, Rechte dicht
- `test120` — Konto-Modus: anmelden lädt nichts hoch (E1/E34), Konto löschen räumt alles
- `test121` — Rechte und Freigaben: was raus darf und was drin bleibt (L8)
- `test131` — Weckrufe: Web Push, und was NICHT hinausgeht (/push, weckrufeFaellig)
- `test170` — Spaltenschlüssel nie rein numerisch (E96) — Ids.short, das datenbankAnlegen in der Api benutzt
- `test205` — Der Prüfserver hält wirklich an (stopp(), E132)
- `test256 / test257 / test261` — Datei- und Block-Grabsteine erreichen den Server (E249, E250, E254)
- `test270` — Deine Daten auf allen Geräten (E270): Server erreichbar, .assetsignore, Lebenszeichen mit `dateien`
- `test273` — Einspielen ersetzt Inhalte, nicht die Kontoidentität (L76/E279)
- `test558` — Die angemeldeten Geräte gibt es wirklich (/konto/geraete)
- `servercheck` — Rauchtest gegen den Prüfserver auf 8790 (kein testNNN, läuft mit `node pruefungen/alle.mts server`)
- `test553` — volllauf.mts: der Sweep nennt den Schuldigen, nicht sein ganzes Stück (E662)
- `test353 / test530` — dienststand.mts: der Dienststand folgt dem Inhalt (E361), der Ablagename trägt den Stempel (E610)
- `test481` — chronik.mts: die Chronik in Redion aus chronik.json (E514)
- `test31 / test89 / test530-537` — rufen pruefungen/alle.mts bzw. nennen es — der Orchestrator selbst hat keinen eigenen Wächter
- `test126, test303, test341, test404-420` — nennen bilder.mts als Werkzeug; bilder.mts selbst hat keinen Prüflauf (L184 fragt nach seinen Geräten)
- `nicht gefunden` — Kein Lauf prüft karte.mts, bruecke.mts, functions/api/bruecke.ts oder die MCP-Client-Seite (werkzeuge.ts ruf/verbinden) gegen einen echten MCP-Server; kein Lauf vergleicht die beiden Brücken-Allowlists; kein Lauf prüft MCP.beantworten() (grep 'beantworten' pruefungen/lauf/*.mts nicht gemessen — nur 'mcp'-Treffer in 12 Läufen, alle serverseitig oder torPruefen)

## Doku-Stand

AUFGABEN.md: §1 „Cloudflare wirklich aufsetzen — braucht Redur“ (Z.102-120): geschrieben und geprüft (test113, test118-120), nie gegen echtes D1/R2; §2 „Der Cloud-Arbeitsbereich als eigenes Konzept“ (Z.124-133, setzt §1 voraus). Kein Eintrag zu CLI, MCP oder /v1/ (grep -i 'MCP|/v1|Kommandozeile|CLI' AUFGABEN.md → nur Zeichen-„Marke“-Treffer). LUECKEN.md: L7 Konto-Modus (Z.266-283) — offen bleibt der Cloud-Arbeitsbereich, „bisher nimmt das Gerät den ersten Bereich des Kontos“; L8 Rechte (Z.285-305) — offen: Rechte für Datenbank-ZEILEN und zeitlich begrenzte Freigaben; L82 Punkt 1 (Z.2295-2302): „Der Server ist scharfschaltbar, aber nicht scharfgeschaltet“; L143 „Die D1-Datenbank liegt im falschen Konto — offen“ (Z.6208); L184 zu bilder.mts-Geräten (Z.7468). KEINE Lücke zu MCP, /v1/, CLI oder den Node-Werkzeugen gefunden (grep -i '\\bMCP\\b|/v1|Kommandozeile|Befehlszeile|Terminal|Diagnose' LUECKEN.md → 0 sachliche Treffer; „Marke“ meint dort fast immer die Zeichenmarke). ENTSCHEIDUNGEN.md (nur Überschriften und Verzeichnis gegrept): E2 optionale Cloudflare-Erweiterung (Z.803), E20 „Keine Marke ändert Rechte oder stellt Schlüssel aus“ (Z.1503), E21 Schnittstellen nachgesehen (Z.1557), E23 „Die 62 Integrationen brauchen einen Server“ (Z.1623), E32 Worker-Name (Z.2274), E33 Anhänge D1/R2 (Z.2301), E35 Rechte, die wirklich sperren (Marke mit `lesen` konnte nichts lesen), E54 Weckrufe, E249/E254 Grabsteine, E270 Server erreichbar/.assetsignore, E361 Dienststand, E514 Chronik, E520 Worker heisst red-ion, E610 Ablagename, E657 „Der volle Lauf bekommt ein Werkzeug“ (Z.53905), E662 „Der Sweep nennt den Schuldigen“ (Z.54195), E671 erster voller Lauf (Z.54847), E681 „Vor dem Umbau die Karte: der Plattform-Audit“ (Z.55590; nennt „CLI“ als Priorität 4). Keine E-Nummer trägt „MCP“, „/v1/“ oder „Schnittstelle“ im Titel; der Kopf von schnittstelle.ts:14-33 und kern.ts:1695-1700 begründen die Bauweise im Code, nicht in ENTSCHEIDUNGEN.md — §34 nicht eingelöst. ERLEDIGTE-AUFGABEN.md: volllauf.mts Ernstfall (Z.100-114, 233), dienststand (Z.1057, 4090-4091), server/kern.ts unter den grossen Dateien (Z.2434). doku/REDION-PLATTFORM-AUDIT.md: Kurzbefund 9 (Z.121-126) „Ein CLI hätte heute nichts, woran es andocken kann … eine Block-Schnittstelle von aussen hat er nicht“; §4 „Schnittstellen nach aussen — CLI, MCP, API“ (Z.421-423) ist ein PLATZHALTER („wird aus der Lesung der Systeme K und M ergänzt“). Falsche Versprechen (§32): src/bereiche/hilfe/stand.ts:520-522 meldet „MCP in beide Richtungen … der Server nimmt jetzt auch Anfragen entgegen — vier Werkzeuge“ als fertig ('f'), obwohl der Server nie gegen echtes Cloudflare lief (AUFGABEN §1); werkzeuge.ts:24-27 „Wer die beiliegende bruecke.js laufen lässt, hat damit einen echten MCP-Server“ — bruecke.mts enthält kein MCP (grep -i 'mcp|jsonrpc' bruecke.mts → 0). Hinweis zur Pflege: dieser Befund ist ein Eintrag für doku/karte/karte.json; `node karte.mts` schreibt daraus die Obsidian-Notiz (karte.mts:1-31).

## Risiken

- DREI DATENFORMEN, EINE WAHRHEIT? Browser-/v1/ liefert Notions Form (seiteRaus, schnittstelle.ts:213-232), Server-/v1/ liefert das rohe Redion-JSON aus `saetze.daten` (kern.ts:1659-1660), MCP am Server liefert `s.daten` als Text (Z.1802). Eine gemeinsame Schicht muss EINE dieser Formen zur Vertragsform machen; wer sie vom Server nimmt, bekommt `props`/`alive`/`content`, wer sie aus dem Browser nimmt, bekommt `properties`/`archived`/`has_children`.
- DER SERVER SCHREIBT OHNE STORE-SEMANTIK. PATCH /v1/pages mischt `properties` in `daten` (kern.ts:1666-1668) — ein Feld, das RedionBlock nicht kennt (src/core/types/block.ts: `props`), und MCP `seite_anlegen` schreibt `{type:'page', text, inhalt, parentId}` ohne `content`, `alive`, `created`, `erstelltVon` (kern.ts:1815-1818). Der Abgleich holt diese Sätze auf jedes Gerät (`/sync/runter`), wo `Store.rohSetzen` (indexdb.ts:958) sie ohne Prüfung einsetzt — §9 „kaputte Daten abfangen“ ist hier nicht gemessen.
- EIN CLI HAT KEINEN DATENPFAD OHNE FENSTER: IndexedDB liegt im Browser; der SW antwortet 503, wenn kein Fenster offen ist (sw.ts:375-380). Ein Node-CLI erreicht die Daten nur über (a) einen laufenden Browser, (b) den Server — nur unverschlüsselte Sätze, nur mit Konto (kern.ts:1656: 409 `verschluesselt`), oder (c) die Sicherungsdatei. Eine „gemeinsame Schicht“, die Store-Logik nach Node kopiert (alive, content-Reihenfolge, edited-Stempel, elternGeaendert — indexdb.ts:409-430), wäre eine zweite Wahrheit des Datenmodells.
- SCHREIBEN ÜBER DIE API ZEICHNET DIE OBERFLÄCHE: jede Schreiboperation ruft `App.zeichneSeite()`/`App.zeichneBaum()` (schnittstelle.ts:502, 527, 565, 573, 585, 605, 626, 641, 655, 734). In einem Kontext ohne `App` (Kopfloser Aufruf, Worker) wirft das nach dem Schreiben — Daten sind dann geändert, die Antwort ist ein 500 (Z.538-539).
- `apiToken` UND DIE SICHERUNG: E279/L76 nehmen `wolkeToken`, `wolkeProbe` und `api:*` aus .json/.redion heraus; der Schlüssel der /v1/-Schnittstelle heisst `apiToken` (schnittstelle.ts:53) und passt nicht auf `api:*`. Ob er in einer offenen Sicherung mitreist, ist NICHT gemessen — zu prüfen, bevor eine Schicht ihn wiederverwendet.
- ZWEI SCHEMATA (ablage.ts:23 ↔ schema.sql): test87 hält Tabellen und Spalten gleich, aber jede Spalte, die eine gemeinsame Schicht braucht, muss an ZWEI Stellen dazu — und ein bestehender D1-Bestand bekommt sie nur über `CREATE TABLE IF NOT EXISTS` (keine ALTER-Migration vorhanden; grep 'ALTER' server/ → nicht gemessen, schema.sql enthält kein ALTER).
- ZWEI MCP-KATALOGE (kern.ts:1706 ↔ werkzeuge.ts:163) mit verschiedenen Namen und Rechten (Marke/rolleAuf vs. Konten.darf). Eine gemeinsame Schicht, die den einen um den anderen ergänzt, muss die Rechteprüfung auf einer Seite neu erfinden — §26 „der Server entscheidet final“ gilt dann für Werkzeuge, die es nur im Browser gibt, nicht.
- LINEARE SUCHEN: Browser `suchen` scannt `Store.cache.blocks` vollständig (schnittstelle.ts:685) und `datenbankRaus` ebenfalls (Z.295); Server-Suche liest ≤500 Sätze und ruft je Treffer `rolleAuf` (kern.ts:1684-1691). Bei 50 000 Seiten (pruefungen/messung-grosse-arbeitsbereiche.mts) ist das ungemessen.
- SERVER-/v1/ IST SCHMALER ALS BROWSER-/v1/: keine /blocks, /databases, /comments, keine Unterwege (kern.ts:1630-1632 sagt es). Ein CLI, das auf dem Server aufsetzt, kann heute Seiten lesen und suchen, aber weder Blöcke noch Datenbanken. Die Abbildungsfunktionen (TYP_API, BLOCK_API, seiteRaus, blockRaus) liegen im Browser-Bündel als IIFE-Global — der Server kann sie nicht importieren.
- BEREICHSKOPPLUNG: schnittstelle.ts (verbinden) ruft Datenbank.wert/gruppeTrifftZu (datenbanken) — steht als Schuld in pruefungen/bereiche-bestand.json (§5 Regel 1, test537). Wer die Filterübersetzung in eine gemeinsame Schicht zieht, muss sie mit nach kern/ oder register/ nehmen, sonst wächst die Schuld.
- CLOUDFLARE NIE GELAUFEN (AUFGABEN §1, L82 Punkt 1): alles am Server ist gegen den Prüfserver geprüft. Jede gemeinsame Schicht erbt dieses Risiko; ein `doctor` müsste das ehrlich als „ungeprüft gegen D1/R2“ melden statt „ok“.
- MARKEN-RECHTE SIND GROB: `lesen|schreiben|alles` (marken.ts:40), ein Bereich, ein Ablauf. Ein CLI mit `export`/`import` über eine Marke mit `schreiben` darf `/sync/hoch` (torPruefen Z.130-137 — nur Methode zählt) und damit den ganzen Bestand ersetzen; E20 schliesst nur Rechte- und Schlüsselwege aus.

## Kleinster nächster Schritt (Vorschlag des Lesers)

Zuerst ein `doctor`, das NICHTS an Daten anfasst: eine Datei `redion.mts` in der Wurzel (Node, `.mts` wie alle Werkzeuge, §54) mit einem einzigen Unterbefehl `doctor`, der die vorhandenen Prüf-Modi nacheinander ruft und ihre Rückgabe sammelt — `node dienststand.mts --pruefen`, `node chronik.mts --pruefen`, `node karte.mts --pruefen`, `npm run typecheck`, `node pruefungen/alle.mts 87 105 109 537` — und den Stand ausgibt (HEAD, Anzahl Läufe per `ls pruefungen/lauf/test*.mts | wc -l`, ob `.volllauf-stand.json` einen offenen Sweep hat, ob `redion-einzeldatei.html` älter ist als `quell/`). Das ist reine Orchestrierung bestehender Werkzeuge: kein neuer Datenpfad, keine Datenform, kein Risiko aus der Liste oben. Dazu ein Wächter `testNNN`, der `doctor` mit einer absichtlich veralteten `stand.ts` rot sieht (§50). ERST DANACH der zweite, schon riskantere Schritt für `list`/`search`/`inspect`: die reinen Abbildungsfunktionen der Api — TYP_API, BLOCK_API, richText, seiteRaus, blockRaus, datenbankRaus, wertRaus/wertRein (schnittstelle.ts:97-335, ohne DOM, ohne App) — nach `src/core/api/notion-form.ts` ziehen, so dass Browser-Api UND `server/kern.ts` v1Weg dieselbe Form liefern (das schliesst Duplikat 3 und den Formen-Bruch aus Risiko 1); `test68` hält die Browserseite dabei, `test75 §„Die Schnittstelle von aussen“` die Serverseite. `export`/`import`/`backup` gehören NICHT in den ersten CLI-Schnitt: sie brauchen den `.redion`-Leser aus dem Browser (§11, §13, test96/test100) in Node — das ist eine eigene Entscheidung in ENTSCHEIDUNGEN.md, nicht ein Nebenschritt.
