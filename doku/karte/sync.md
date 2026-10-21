<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, sync]
stand: 25. September 2026
head: 1b89c01
---

# J · Abgleich, Anhänge, Stücke

J · Abgleich, Anhänge, Stücke, Zusammenführen — Globals `Wolke` (src/kern/abgleich/maschine.ts), `Zusammen` (src/kern/abgleich/zusammenfuehren.ts), `Dateien` (src/bereiche/dateien/ablage.ts) sowie die Fächer basis/vorrat/stuecke/dateien in `Store` (src/kern/ablage/indexdb.ts). Serverseite: server/kern.ts (/sync/hoch, /sync/runter), server/dateien.ts (/datei/melden|stueck|runter|stand|weg). Hinweis: einlesen.ts und ausgeben.ts (Excel/Word/PPTX/EPUB/Obsidian-Austausch) liegen zwar im selben Ordner, haben mit dem Abgleich aber nichts zu tun — sie liefern nur den ZIP-Leser/-Schreiber, den der .redion-Weg in schale.ts benutzt.

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/kern/abgleich/maschine.ts` | Global `Wolke`: Server-Adresse, Token, PBKDF2/AES-GCM-Schlüssel (Z.124–195), Sätze hoch (`zuSchicken` Z.384, `hoch` Z.450), runter (`runter` Z.563, `runterEinmal` Z.658), Block-Grabsteine (`bloeckeWeg` Z.602), Schalter E1/E34 (`abgleichErlaubt` Z.797), `abgleichen` Z.809, Takt Z.852, Anhänge 6b (`dateienWeg` Z.936, `dateienRunter` Z.970, `dateienHoch` Z.1034, `dateienAbgleichen` Z.1069), Teilen/Marken/Geräte, `start` Z.1140 | 1181 |
| `src/kern/abgleich/zusammenfuehren.ts` | Global `Zusammen`: Drei-Wege-Merge — wortweise (`lcs` Z.78, `textDreiWege` Z.135), listenweise (`listeDreiWege` Z.176), feldweise (`dreiWege` Z.242 mit Sets ZEIT/TEXT/LISTE Z.223–230), Konfliktliste in meta `konflikte` (`merke` Z.336, `loese` Z.380, MAX_KONFLIKTE=200 Z.331), Dialog Z.423 | 524 |
| `src/bereiche/dateien/ablage.ts` | Global `Dateien`: Anhänge in 1-MB-Stücken — `anmelden` Z.70, `stueckSchicken` Z.99, `bestaetigen` Z.117, `ablegen` Z.156, `alsBlob` Z.200 (verweigert unvollständige Dateien), Blob-URL-Cache `adresse` Z.233, `weg` Z.277 (schreibt Datei-Grabstein), `verwaist`/`aufraeumen` Z.294/311, Dialog | 483 |
| `src/kern/ablage/indexdb.ts` | Global `Store`: Schema-Upgrade Fächer dateien/stuecke (V3, Z.112–119), basis (V4, Z.127), vorrat (V5, Z.132); Grabstein-Merklisten `dateiGrabstein`/`blockGrabstein` (Z.2836–2875) mit atomarem `metaListeAendern` (Z.1200); `basisPut/basisHolen/basisLeeren` Z.2885–2904; `vorratPut…` Z.2907–2910; `stueckPut/stueckeVon` Z.3000–3033; `importAll` Z.2063 (leert basis beim Ersetzen, Z.2421); FAECHER_IMMER/MIT_ANHANG/NIE Z.1790–1806 | 3071 |
| `server/kern.ts` | Server: /sync/hoch Versionsregel „veraltet“ (Z.825–833), speichert `version`, `geaendert`, `geloescht`, `vonGeraet` (Z.855–860); Kopfzeile `Redion-Geraet` (Z.741) |  |
| `server/dateien.ts` | Server: Anhänge — Metadaten in D1, Bytes in R2 unter bereich/dateiId/nr; fünf POST-Wege (Kopf Z.10–16); DATEI_GRENZE = 100 MB (Z.41) |  |
| `src/schale/aufbau/schale.ts` | .redion-Sicherung schreiben (Z.2074–2211: daten.json + dateien.json + dateien/) und Anhänge einspielen (`anhaengeEinspielen` Z.2286ff, Stücke neu schneiden Z.2357–2362) |  |
| `src/core/types/file.ts` | Typen `RedionFile` (Z.33) und `FileChunk` (Z.59), `UploadState` = 'wartet'\|'laeuft'\|'fertig' (Z.30) |  |
| `src/bereiche/dateien/einlesen.ts` | NICHT Abgleich: ZIP-Leser (`zipLesen` Z.152, `zipLesenAusBlob` Z.288, ZIP64 Z.31ff), xlsx/ods/docx/pptx/epub → Blöcke; liefert den Leser für .redion und ArchivImport | 2726 |
| `src/bereiche/dateien/ausgeben.ts` | NICHT Abgleich: ZIP-Schreiber (`zipSchreiben` Z.123, `crc32Strom` Z.67 stückweise), docx/xlsx/ods-Ausgabe, Trello/Evernote/Obsidian-Import; liefert den Packer für .redion | 3015 |

## Datenmodell

FÄCHER (IndexedDB, src/kern/ablage/indexdb.ts): `dateien` keyPath id, Index `block`→blockId (Z.112–114); `stuecke` keyPath id = dateiId+':'+nr, Index `datei`→dateiId (Z.116–118, ablage.ts:108); `basis` keyPath id, Satz = { id, satz: JSON.stringify(satz), wann } (Z.127, Z.2885) — der letzte gemeinsame Stand, JSON als Zeichenkette; `vorrat` keyPath id (Z.132) — laut Kommentar „vorberechnete Werte je Datenbank … ein Beschleuniger, kein Inhalt“ und einziger Nutzer src/bereiche/datenbanken/vorrat/dienst.ts:160/170. ACHTUNG: CLAUDE.md §9 nennt `vorrat` „was noch zum Server hoch soll“ — das stimmt nicht mit dem Code überein; die Hochlade-Warteschlange ist KEIN Fach, sondern der Filter `edited > wolkeMarkeHoch` in `zuSchicken` (maschine.ts:384–405) plus die meta-Merklisten.

DATEISATZ (`RedionFile`, src/core/types/file.ts:33–57; angelegt ablage.ts:79–88): id, name, groesse, typ, blockId|null, teile, angekommen, zustand ('wartet'|'laeuft'|'fertig'), angelegt, fertigAm — plus `abgeleitet: boolean` (ablage.ts:86, E103; fehlt im Typ file.ts). STÜCK (`FileChunk`, file.ts:59–66): { id, dateiId, nr, blob: Blob } — Blob, kein Base64. Stückgrösse STUECK = KONSTANTEN.STUECK || 1 MB, KLEIN = 256 KB (kleine Dateien bleiben Data-URL im Block), GRENZE = DATEI_MAX 500 MB (ablage.ts:54–56).

ABGLEICH-META (Fach `meta`, Schlüssel k): wolkeToken, wolkeBereich, wolkeGeraet (maschine.ts:57–66), wolkeMarkeHoch/wolkeMarkeRunter (Zeit-Marken, Z.385, Z.659), wolkeMarkeDateien + wolkeDateienOben (Z.971–972), wolkeDateienWeg (Datei-Grabsteine, indexdb.ts:2836ff), wolkeBloeckeWeg (Block-Grabsteine {id,tabelle,seite,satz}, indexdb.ts:2864–2871), wolkeNachtrag/wolkeNachtragAlles (L100/E314, Z.377–382), wolkeAbgleich (Ja-Schalter E1/E34, Z.797–807), wolkeNeuAbgleich (L76-Frage, Z.766), wolkeGeteilt (Klartext-Seiten, Z.436), konflikte (Zusammen, zusammenfuehren.ts:333), wolkeTakt.

PAKETFORM zum Server (maschine.ts:497–505): { id, tabelle, seite, daten (Klartext oder AES-GCM-Base64), verschluesselt, version: satz.wolkeVersion||1, geaendert: edited||created, geloescht: alive===false }. Der Server speichert dazu `vonGeraet` aus dem Kopf `Redion-Geraet` (server/kern.ts:741, 859). Zeitstempel = ISO-Strings aus `edited`, keine Lamport-/Vektor-Uhr.

.REDION (src/core/types/backup.ts:97–120; schale.ts:2177–2211): daten.json + dateien.json {version, saetze: RedionFile[], zuordnung: Archivname→FileId} + dateien/<echter Name>. Beim Einspielen werden die Stücke aus dem Archiv-Blob neu in 1-MB-Stücke geschnitten (schale.ts:2357–2362), Kennung bleibt.

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Wolke` | global | `src/kern/abgleich/maschine.ts` | (window as any).Wolke (Z.1181); exportiert Z.1169–1179: adresse, token, bereich, angemeldet, geraeteName, zustand, beiAenderung, anmeldenMit, codeHolen/codeWarten/codeFreigeben, tokenUebernehmen, abmelden, abgleichErlaubt, abgleichSetzen, kontoLoeschen, neuAbgleichOffen, neuAbgleichAntwort, schluesselSetzen, hatSchluessel, verschluessele, entschluessele, hoch, runter, abgleichen, dateienAbgleichen, takt, taktSetzen, zuSchicken, seiteVon, geteiltSetzen, istGeteilt, freigeben, freigaben, veroeffentlichen, zurueckziehen, markeAnlegen, markenListe, markeWeg, geraeteListe, geraetWeg, ruf, start |
| `Zusammen` | global | `src/kern/abgleich/zusammenfuehren.ts` | (window as any).Zusammen (Z.524); exportiert Z.518–521: dreiWege, textDreiWege, listeDreiWege, teile, stuecke, lcs, offene, merke, loese, alleLoesen, dialog, melde, hinweisen, start, pfadName, setzeTief |
| `Dateien` | global | `src/bereiche/dateien/ablage.ts` | (window as any).Dateien (Z.483); exportiert Z.478–482: STUECK, KLEIN, GRENZE, anmelden, stueckSchicken, bestaetigen, abbrechen, ablegen, verknuepfen, alsBlob, adresse, adresseBekannt, adresseWeg, herunterladen, weg, verwaist, aufraeumen, zahlen, groesseText, lohntSich, dialog |
| `Store.basis*/vorrat*/stueck*/datei*/…Grabstein*` | funktion | `src/kern/ablage/indexdb.ts` | Z.3056–3064: dateiPut/dateiHolen/dateiWeg/dateiAlle, blockGrabsteine/blockGrabstein/blockGrabsteinWeg, dateiGrabstein/dateiGrabsteine/dateiGrabsteinWeg, basisPut/basisHolen/basisWeg/basisAlle/basisLeeren, vorratPut/vorratHolen/vorratWeg/vorratAlle, stueckPut/stueckHolen/stueckWeg/stueckeVon; rohSetzen (Z.958, setzt Satz aus dem Abgleich ohne edited-Bump und nimmt Grabstein zurück); metaListeAendern (Z.1200, atomar über Tabs) |
| `Store.on('import') / Ereignisse.horche(ARTEN.einstellungGeaendert)` | ereignis | `src/kern/abgleich/maschine.ts` | Z.1148–1149: nach einem Einspielen `melden()`; Z.1166–1168: Takt neu stellen, wenn `wolkeTakt` im Register geändert wird; visibilitychange stösst abgleichen an (Z.1160) |
| `POST /sync/hoch, /sync/runter` | http | `server/kern.ts` | Client maschine.ts:507 und :659; Server nimmt {bereich, saetze[]} und antwortet {angenommen, abgelehnt[{id,grund:'veraltet'\|…}], angepasst[]}; runter liefert {saetze, marke, mehr, rolle} |
| `POST /datei/melden, /datei/stueck, /datei/runter, /datei/stand, /datei/weg` | http | `server/dateien.ts` | Client maschine.ts:937, 976, 1002, 1048, 1054; Base64-Stücke höchstens 2 MB roh; Rechte über die Seite (bearbeiten/lesen) |
| `Register.einstellungen.setze('wolkeTakt')` | register | `src/kern/abgleich/maschine.ts` | Z.874–878: taktSetzen schreibt über das Register, nicht daneben (§8) |
| `Aufrufer in der Oberfläche` | funktion | `src/bereiche/verbinden/ansicht/wolke.ts` | Wolke.abgleichen (Z.127, 445, 709), Wolke.neuAbgleichAntwort (Z.92, 100); Zusammen.start in schale.ts:4114; Wolke.abgleichen in einstellungen/pwa.ts:784 (online-Ereignis) |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | nein | nein | nicht gefunden in maschine.ts, zusammenfuehren.ts, ablage.ts, indexdb.ts (gesucht: point\|Punkt\|x:\|y:) |
| rect | ja | **ja** | nur im PPTX-Leser: src/bereiche/dateien/einlesen.ts:1431 `formLage` → {x,y,w,h} aus a:off/a:ext in Blattpunkten (`emuZuPunkt` Z.1013). Kein Bezug zum Abgleich; src/core/ink/geometry.ts:291 `rectangle` wird dort nicht benutzt |
| bounds | nein | nein | nicht gefunden (core/ink/geometry.ts:595 `umschliessend` gehört dem Ink-System) |
| transform | ja | **ja** | src/bereiche/dateien/einlesen.ts:2033–2039 `abbilden`: x' = dx + x·sx für Gruppen (chOff/chExt); eigene Formel, kein Kern-Helfer |
| viewport | nein | nein | nicht gefunden |
| zoom | nein | nein | nicht gefunden |
| pan | nein | nein | nicht gefunden |
| selection | nein | nein | nicht gefunden (Konfliktwahl in zusammenfuehren.ts:380 ist keine räumliche Auswahl) |
| hitTest | nein | nein | nicht gefunden |
| snap | nein | nein | nicht gefunden |
| resizeHandles | nein | nein | nicht gefunden |
| rotation | ja | **ja** | src/bereiche/dateien/einlesen.ts:1422–1428 `formDrehung`: rot/60000 auf 0…360; eigene Rechnung, core/ink/geometry.ts:603 `drehung` nicht benutzt |
| group | ja | **ja** | src/bereiche/dateien/einlesen.ts:2048–2050 `p:grpSp` rekursiv, Tiefenbremse 8 |
| connector | nein | nein | nicht gefunden (kein p:cxnSp in einlesen.ts) |
| frame | nein | nein | nicht gefunden |
| zOrder | nein | nein | nicht gefunden (Folienreihenfolge über r:id, einlesen.ts:1625, ist keine z-Ordnung) |
| undo | nein | nein | nicht gefunden; Konfliktentscheid `loese` (zusammenfuehren.ts:380) ist nicht rückgängig, setzt nur edited=now |
| pointerNormalisierung | nein | nein | nicht gefunden |

## Gemeinsam genutzt

**Benutzt:** [[kern-Store|Store]] · [[kern-Register|Register]] · [[kern-Ereignis|Ereignis]] · [[kern-Dateien|Dateien]]

- src/kern/ablage/indexdb.ts — `Store` (cache.blocks/collections/views, getMeta/setMeta, rohSetzen, basis*/vorrat*/stueck*/datei*, Grabstein-Helfer, metaListeAendern)
- src/core/helpers/bytes.ts — `Bytes.toBase64/fromBase64` (maschine.ts:183, 188, 1006, 1063)
- src/kern/konstanten (KONSTANTEN.SERVER_DATEI_MAX, STUECK, KLEIN, DATEI_MAX) — maschine.ts:53, ablage.ts:52–56
- src/core/import/zipdetails.ts — `ZipDetails.crc32*` für den .redion-Packer (ausgeben.ts:52–71)
- src/kern/ereignisse (Ereignisse.horche, ARTEN.einstellungGeaendert) — maschine.ts:1166
- Register.einstellungen.setze('wolkeTakt') — maschine.ts:876
- Protokoll.notieren (kern/ereignisse/protokoll.ts) — maschine.ts:288, 299, ablage.ts:135
- UI.toast, App.zeichneSeite/zeichneBaum (schale) — zusammenfuehren.ts:394, 508; maschine.ts:717
- Reporter (core/helpers/reporter.ts) — ablage.ts:222, indexdb.ts:3014
- Feldrechte.auffrischen — maschine.ts:823
- src/core/types/file.ts, backup.ts, storage.ts — Typen (nur Typprüfung, kein Laufzeitimport)

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[gemeinsam|G · Gemeinsame räumliche Infrastruktur]] · [[mcp|I · MCP, Server-API, CLI-Vorläufer]]

1. **Seite eines Blocks bestimmen (Elternkette bis 40 Stufen, Zeile ausgenommen)**
   - hier: `src/kern/abgleich/maschine.ts:423–433`
   - dort: `src/kern/ablage/indexdb.ts:629–639 (`seiteVonHier`)`
   - Beleg: maschine.ts: `if (cur.type === 'page' && cur.parentTable !== 'collection') return cur.id; if (!cur.parentId) return cur.id; const eltern = Store.getBlock(cur.parentId);` — indexdb.ts: wortgleich mit `cache.blocks[cur.parentId]`; der Kommentar dort sagt selbst „hier noch einmal, weil sie IM PURGE-MOMENT laufen muss“
2. **LCS-Tabelle für den Wortvergleich (tab/setzeTab, Uint32Array vs Int32Array)**
   - hier: `src/kern/abgleich/zusammenfuehren.ts:88–94`
   - dort: `src/bereiche/seiten/ansicht/fassungen.ts:86–93`
   - Beleg: beide: `const tab = (i, j) => t[i]?.[j] ?? 0; const setzeTab = …; setzeTab(i, j, a[i] === b[j] ? tab(i + 1, j + 1) + 1 : Math.max(tab(i + 1, j), tab(i, j + 1)));` — zusammenfuehren.ts:83 verweist ausdrücklich: „Dieselben zwei Handgriffe wie in `fassungen.ts`“
3. **AES-GCM verschlüsseln/entschlüsseln mit 12-Byte-IV vorangestellt — einmal für Text (Base64), einmal für Bytes**
   - hier: `src/kern/abgleich/maschine.ts:172–194 (`verschluessele`/`entschluessele`)`
   - dort: `src/kern/abgleich/maschine.ts:901–919 (`verschluesseleBytes`/`entschluesseleBytes`)`
   - Beleg: Z.174–178: `const iv = crypto.getRandomValues(new Uint8Array(12)); … encrypt({ name: 'AES-GCM', iv }, schluessel, daten); const alles = new Uint8Array(iv.length + chiffre.byteLength); alles.set(iv); alles.set(new Uint8Array(chiffre), iv.length);` — Z.902–907 identisch, nur ohne TextEncoder/Base64
4. **esc()-Helfer (4-Zeichen-Fassung ohne Apostroph) je Modul statt gemeinsam**
   - hier: `src/kern/abgleich/zusammenfuehren.ts:51–52 und src/bereiche/dateien/ablage.ts:347–348`
   - dort: `src/kern/zugang/rechte.ts:39, src/kern/ereignisse/protokoll.ts:257, src/bereiche/verbinden/ansicht/wolke.ts:25`
   - Beleg: überall: `const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)`; in src/core/helpers gibt es KEIN esc (grep leer) — §19/§52.14 verlangen zudem auch `'`→`&#39;`, das fehlt in allen diesen Fassungen
5. **Obergrenze für Server-Anhänge (100 MB) an zwei Orten**
   - hier: `src/kern/abgleich/maschine.ts:53–55 (`SERVER_DATEI_MAX = KONSTANTEN.SERVER_DATEI_MAX || 100 * 1024 * 1024`)`
   - dort: `server/dateien.ts:41 (`export const DATEI_GRENZE = 100 * MB`)`
   - Beleg: maschine.ts:47–50: „ohne Verbindung zu `DATEI_GRENZE` in `server/dateien.ts`, das dieselbe Zahl trägt … `test140` rechnet beide Zahlen nach“ — bewusst geduldet und gewacht, aber weiterhin zwei Quellen
6. **Der Wettlauf-Wächter `wegOffen` (vorgemerkte Löschungen nicht wiederbeleben) zweimal ausgeschrieben**
   - hier: `src/kern/abgleich/maschine.ts:663–665 (Blöcke, `wolkeBloeckeWeg`)`
   - dort: `src/kern/abgleich/maschine.ts:974–976 (Dateien, `wolkeDateienWeg`)`
   - Beleg: Z.664: `const wegOffen = new Set<string>((Store.getMeta('wolkeBloeckeWeg', []) || []).map(e => e && e.id).filter(Boolean));` … `if (wegOffen.has(s.id)) continue;` — Z.975: `const wegOffen = new Set<string>(Store.getMeta('wolkeDateienWeg', []) || []);` … `if (wegOffen.has(d.id)) continue;`; Kommentar Z.661: „dasselbe Muster wie `wegOffen` bei den Dateien“

## Prüfläufe

- `test77` — Zusammenführen statt Überschreiben: die drei Stufen (wort/listen/feldweise) einzeln und über zwei Geräte
- `test78` — Zwei Geräte ändern gleichzeitig — der Abgleich wirft nichts still weg
- `test113` — Zwei Geräte, dieselbe Seite: sieben Konfliktfälle, Ende = eine Fassung oder gemeldeter Konflikt; §8 Anhänge
- `test118` — Offline geändert: das Wiederverbinden allein stösst den Abgleich an, Anhänge kommen Byte für Byte verschlüsselt hinüber
- `test119` — Anhänge auf dem Server: Bytes rund, Rechte dicht, Grenzen echt (melden·stueck·runter·stand·weg)
- `test76` — Anmelden, abgleichen, verschlüsseln mit zwei Geräten gegen den Prüfserver
- `test256` — Datei-Grabsteine: lokales Löschen erreicht den Server (E249/L6), 404/403-Regeln, Versand vor dem Holen
- `test261` — Block-Grabsteine: Sofort-Löschen (trashBlock+purgeBlock) erreicht den Server (E254); §4 schaltet den Takt ab (L132)
- `test273` — Einspielen ersetzt Inhalte, nicht die Identität — Marken/Basis leer, L76-Frage steht (E279)
- `test308` — Eine dazugelegte Sicherung erreicht den Server (L100/E314) — winziger Abgleich-Server im Lauf
- `test333` — Zwei Tabs, eine Merkliste (L75/E341): metaListeAendern atomar, Gegenprobe alter Weg verliert einen
- `test96` — Die Sicherung hält, was sie verspricht — .json ohne Anhänge darf Anhänge nicht löschen
- `test100` — Die .redion-Sicherung nimmt die Anhänge mit: sichern, löschen, zurückholen, Byte für Byte vergleichen
- `test144` — Ein Stück-Lesefehler ist kein leerer Bestand (E121, DATEISTUECKE_NICHT_LESBAR)
- `test140` — Jede Grenze hat ein Zuhause — SERVER_DATEI_MAX (Client) und DATEI_GRENZE (Server) stimmen überein
- `test97` — Papierkorb: was zurückkommt und was wirklich geht — purgeAnhaenge, basis bleibt stehen
- `test311/test312` — Ein fehlender bzw. verkürzter Anhang wird beim .redion-Einspielen genannt (E317/E318)
- `test325` — Ein Fach, das niemand erklärt hat — FAECHER_IMMER/MIT_ANHANG/NIE gegen die Ablage (E332)
- `test104` — Die verschlüsselte Sicherung hält, was der Dialog verspricht (zwei Sicherungswege)
- `test120 (laut ERLEDIGTE-AUFGABEN.md Phase 9)` — Der Schalter wolkeAbgleich trennt „nur lokal“ von „lokal + Abgleich“ (E1/E34)

## Doku-Stand

LUECKEN.md: L5 (Z.218) Sync-Konflikte „✅ geprüft“, verweist auf L6. L6 (Z.240) Anhänge in R2 — DREI offene Reste (Z.263–268): „✗ Der Download ist eifrig — ein ‚nur bei Bedarf‘ ist eine eigene Entscheidung“, „✗ .redion-Archiv in R2 als Cloud-Sicherung“, „✗ Dateien über 100 MB bleiben bewusst lokal (E33)“. L75 (Z.2067) Merklisten bei mehreren Tabs — HALB GESCHLOSSEN durch E341: offen bleibt „die Liste ist weiterhin EIN Satz … ein echter Verbund braucht Merklisten als eigene Sätze“ und der Tab-Schluss vor dem Flush; Nachtrag E314: `wolkeNachtrag` hat dieselbe Restlücke. L82 (Z.2295) offen: Punkt 1 Server nicht scharfgeschaltet (braucht Redurs Cloudflare-Konto), 3 kein Hintergrunddienst, 6 kein Fortschritt beim Schreiben, 7 `ADRESSEN` ungeprüft. L100 (Z.3047) GESCHLOSSEN 1.9.2026 mit E314 (`wolkeNachtrag`, test308). L132 (Z.5427) OFFEN: `abgleichen()` gibt viermal `null` zurück, „Nichts zu tun“ ist bei `zustand.laeuft` falsch — „NICHT REPARIERT … ein kleiner Ergebnistyp (§52.12) wäre der richtige Weg, und der berührt jeden Aufrufer“; test261 §4 hegt den Wettlauf nur ein. L73/L74/L76 GESCHLOSSEN (E254/E255/E279).

ENTSCHEIDUNGEN.md (Zeilen): E1 (758) local-first, E3 (843) grosse Dateien nicht in JSON, E5 (945) Import darf Anhänge nicht falsch löschen, E33 (2301) Anhänge D1+R2, Reste Z.51–53 des Eintrags („der Download ist eifrig … .redion in R2 … über 100 MB bleiben lokal“), E34 (2362) anmelden ist nicht zustimmen, E98 (6737) Dateien überleben Neustart, E103 (7076) `abgeleitet`, E121 (8714) Stück-Lesefehler, E171 (12395) Datei-Anspruch, E249 (18926) Datei-Grabsteine, E250 (19006) Papierkorb-Zeitstempel, E254 (19204) Block-Grabsteine, E255 (19297) Merklisten überleben Ersetzen, E270 (19896) Ordner-Sicherung, E279 (21463) L76, E286 (22257) Aufträge, E314 (24518) L100, E332 (25930) Fächer-Erklärung, E341 (26692) atomare Merkliste, E436 (35435) Prüflauf fing Abgleich ein. CRDT: einzige Stelle ENTSCHEIDUNGEN.md:1318 „Echter paralleler Editor bräuchte CRDTs oder Serverlogik“ — es gibt KEINE E-Nummer, die CRDT entscheidet; zusammenfuehren.ts Kopf (Z.10–13) nennt sie als bewusst nicht gegangenen Weg. On-Demand-Dateien: keine E-/L-Nummer ausser dem Rest in L6/E33.

AUFGABEN.md: nur Z.104–118 (Server/Konto/Sync einmal gegen echtes D1/R2 laufen lassen, siehe L82 Punkt 1). ERLEDIGTE-AUFGABEN.md Phase 9 (Z.2751): G2 R2 für Dateien erledigt (E33), G3 Sync-Konflikte erledigt (test113/78/118). doku/ARCHITEKTUR.md:48, 302–303 nennt abgleich/ und die Fächer 3/4.

Abweichungen Code↔Doku: (1) CLAUDE.md §9 beschreibt `vorrat` als Hochlade-Warteschlange; indexdb.ts:132–135 und :1804 sagen „vorberechnete Werte — Beschleuniger“. (2) src/core/types/storage.ts:20–30 `STORES` listet neun Fächer, indexdb.ts hat elf (suchindex, auftraege fehlen im Typ). (3) `RedionFile` in file.ts:33 kennt `abgeleitet` nicht, ablage.ts:86 schreibt es.

## Risiken

- Basis ist der Serverstand als JSON-String (indexdb.ts:2885, maschine.ts:730 „Basis ist immer der Serverstand“). Wer eine gemeinsame Schicht mit anderem Basis-Modell einzieht, macht jeden bestehenden basis-Eintrag falsch — ein Drei-Wege-Merge gegen eine falsche Basis „führt Dinge zusammen, die nie zusammengehörten“ (indexdb.ts:2387–2390). Migration nur mit basisLeeren + Vollabgleich.
- Version ist nur `wolkeVersion` (Zahl, vom Server vergeben, maschine.ts:684) plus `edited`-ISO-String; Gerät steht nur serverseitig (`vonGeraet`, server/kern.ts:859), NICHT am lokalen Satz. Für CRDT/Vektor-Uhren müsste jeder Satz eine Geräte-Kennung und eine Zähler-Uhr tragen — ein neues Feld auf 100 % der Blöcke, also Datenmigration (§53.3) und Änderung der .redion-Form.
- Die Konfliktregel am Server ist Last-Writer-Wins pro Satz (server/kern.ts:825–833: kleinere Version oder gleiche Version mit älterem `geaendert` → 'veraltet'); das Drei-Wege-Merge lebt nur im Client (runterEinmal Z.705–707). Eine CRDT-Schicht müsste beide Seiten ändern; ein halber Umbau lässt Sätze in Runde 1 abweisen, die der Client in Runde 2 als Konflikt sieht.
- Grabsteine sind meta-Listen (`wolkeBloeckeWeg`, `wolkeDateienWeg`), nicht Sätze; ein Grabstein wird nur geschrieben, wenn `basis` den Satz kennt (maschine.ts:616–617) bzw. `wolkeDateienOben` die Datei führt (indexdb.ts:2840). Eine gemeinsame Schicht, die basis oder Oben-Set anders befüllt, macht die Wache blind — dann bleiben Löschungen auf dem Server für immer (genau der Fall aus E254/E255, indexdb.ts:2395–2405).
- Ein Anhang gilt erst mit `zustand:'fertig'` und `stuecke.length === teile` als Datei; `alsBlob` gibt sonst null (ablage.ts:214–222). Einen Zustand „nur in der Wolke“ gibt es NICHT: dateienRunter lädt eifrig jedes Stück (maschine.ts:997–1015) und legt den Dateisatz erst an, wenn alles da ist. On-Demand bräuchte einen vierten UploadState (z. B. 'entfernt') in file.ts:30, einen Weg in `adresse()`/Blockzeichner, der bei fehlenden Stücken nachlädt statt null zu zeigen, UND Änderungen in .redion (schale.ts:2181 `Dateien.alsBlob` würde solche Dateien als „steht nicht im Archiv“ auslassen), in `verwaist()` (ablage.ts:294, sieht nicht-fertige als verwaist → Aufräumen löscht sie) und in `dateiGrabstein` (Oben-Wache).
- Zwei Tabs: metaListeAendern (indexdb.ts:1200) ist über IndexedDB atomar, aber die Marken wolkeMarkeHoch/Runter/Dateien werden mit setMeta ohne Transaktion gesetzt (maschine.ts:520, 736, 1021); zwei Tabs, die gleichzeitig abgleichen (`zustand.laeuft` ist je Tab), können Marken rückwärts setzen. Ungeprüft (kein Zwei-Tab-plus-Wolke-Lauf, L75).
- Dateien > 100 MB und `abgeleitet` gehen nie zum Server (maschine.ts:1041–1046); wer On-Demand baut, muss diese beiden Klassen ausdrücklich behandeln, sonst zeigt das zweite Gerät einen Block mit dateiId, zu der es weder Stücke noch Wolke gibt.
- Verschlüsselung: Schlüssel liegt nur im Speicher (maschine.ts:118), Salz = Konto-Id (Z.153); ein Server-seitiges Zusammenführen ist damit für private Seiten unmöglich (server sieht Chiffre) — jede CRDT-Logik muss clientseitig bleiben oder Klartext verlangen.
- Typ-Drift: STORES (storage.ts) kennt 9 Fächer, die Ablage 11; RedionFile kennt `abgeleitet` nicht. Eine gemeinsame Schicht, die sich auf die Typen verlässt, übersieht Felder, die gespeichert sind.

## Kleinster nächster Schritt (Vorschlag des Lesers)

L132 schliessen: `abgleichen()` (src/kern/abgleich/maschine.ts:809–811) gibt statt viermal `null` einen kleinen Ergebnistyp zurück (§52.12), z. B. { ok:false, grund:'nicht-angemeldet'|'kein-bereich'|'laeuft'|'nicht-erlaubt'|'frage-offen' }; die drei Aufrufer in src/bereiche/verbinden/ansicht/wolke.ts:127/445/709 und einstellungen/pwa.ts:784 anpassen; test261 §4 als Wächter erweitern (rot sehen mit altem Stand). Kein Datenmodell wird berührt, aber die Grundlage für alles Weitere (On-Demand, Zwei-Tab-plus-Wolke) ist ein Abgleich, der sagen kann, warum er nichts tat. Danach als zweiter, ebenso kleiner Schritt: `abgeleitet` in src/core/types/file.ts:33 und suchindex/auftraege in src/core/types/storage.ts:20 nachtragen (test325 prüft die Fächer-Erklärung gegen die Ablage, nicht gegen die Typen).
