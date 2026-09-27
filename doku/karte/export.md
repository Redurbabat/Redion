<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, system, export]
stand: 25. September 2026
head: 1b89c01
---

# K · Import, Export, .redion, Sicherung

K · Import, Export, .redion, Sicherung — die Sicherung in zwei Formen (`.json` ohne Anhänge, `.redion` = ZIP mit `daten.json` + `dateien.json` + `dateien/`), ihr Manifest (`enthaelt`/`fehlt`/`hinweis`), das Einspielen (`ersetzen`/`zusammenfuehren`, eine Transaktion), die Umzüge der Ablage (`Umzuege`), die verschlüsselte Sicherung (`Krypto`), die Ordner-Sicherung (`OrdnerSicherung`), und der Austausch mit fremden Formaten (Word/Excel/ODS/PowerPoint/EPUB, Notion-ZIP, Obsidian-Vault, Trello, Evernote, Asana, Apple Notes, ZIP ins Regal). WICHTIG ZUR ORTSANGABE IM AUFTRAG: `format.ts`, `archiveImport.ts`, `ausgeben.ts`, `einlesen.ts` liegen NICHT in `src/kern/ablage/` (dort: befehle.ts, formen.ts, indexdb.ts, nachbarn.ts, umzuege.ts), sondern in `src/bereiche/dateien/`. Der eigentliche `.redion`-Packer und -Leser steht in `src/schale/aufbau/schale.ts:2148-2545`, der Manifest-Bau in `src/kern/ablage/indexdb.ts:1843-1983` (`Store.exportAll`), das Einspielen in `indexdb.ts:2063-2470` (`Store.importAll`). Ein Kern-Ordner `src/core/import/` liefert die reinen Teile (Entschärfen, Prüfen, Vergleichen, ZIP-Details). Die Karte `doku/karte/karte.json` (Quelle für `node karte.mts`, Obsidian-Vault unter `doku/karte/`) kennt dieses System noch nicht — sie führt nur A/B/C.

Zurück zur [[Redion|Übersicht]].

## Dateien

| Datei | Rolle | Zeilen |
|---|---|---|
| `src/kern/ablage/indexdb.ts` | `Store`: VERSION = Umzuege.JETZIGE (Z.51); GEHEIM ['wolkeToken','wolkeProbe'] + Präfix 'api:' (Z.1690-1692), GERAETEIGEN (Z.1723); die drei Fachlisten FAECHER_IMMER ['blocks','collections','views','meta','versions'] (Z.1790), FAECHER_MIT_ANHANG ['dateien','stuecke'] (Z.1793), FAECHER_NIE {auftraege, basis, vorrat, suchindex} mit Grund (Z.1802-1807); faecherUnbekannt (Z.1817), satzZuUnbekannten (Z.1834); exportAll(mitAnhaengen, mitGeheimnissen) baut das Manifest (Z.1843-1983: version, exportiert, enthaelt Z.1940, fehlt Z.1951-1959, abgeleitetAusgelassen Z.1962, hinweis Z.1963-1974, blocks/collections/views/meta/versions Z.1975-1980); exportVorbereiten liest den Verlauf (exportVersionen = await all('versions') Z.2009); importAll(json, art) (Z.2063-2470): settled (Z.2066), ImportSicherheit.lesen (Z.2088), nur 'ersetzen'\|'zusammenfuehren' sonst Fehler (Z.2092-2095), ImportValidierung.pruefen (Z.2098), Ordnerzugriff bleibt (E270), Wolke-Merklisten überleben (Z.2193-2222), Sync-Marken auf null + wolkeNeuAbgleich (Z.2236-2245), EINE Transaktion über blocks/collections/views/meta/versions/suchindex (Z.2264-2318), Ersetzen löscht Schlüssel, die nicht in der Sicherung sind (Z.2286-2313), Cache erst nach oncomplete (Z.2333-2340), Umzuege.zuruecksetzen()+laufen() nach dem Einspielen (Z.2439), Rückgabe {bloecke, versionen, fehlt, frage, entschaerft, befund, fassung} (Z.2456-2470); Umzuege.laufen beim Öffnen (Z.356) | 3071 |
| `src/schale/aufbau/schale.ts` | Der `.redion`-Packer und -Leser (nicht im Kern): sicherungPaketBauen (Z.2148) — ohne Anhänge `.json`, sonst `daten.json` = Store.exportAll(true) (Z.2177), abgeleitete Dateien gefiltert (Z.2174-2175), Namensregel `/[\\/:*?"<>\|]/g → '-'` und `-2`, `-3` vor der Endung (Z.2186-2196), `dateien.json` = {version:1, saetze, zuordnung} (Z.2204-2205), Austausch.zipSchreiben (Z.2212); sicherungSpeichern lädt `redion-sicherung-JJJJ-MM-TT.<endung>` (Z.2218-2226); anhaengeEinspielen(zip, art) (Z.2291-2409): dateien.json über ImportSicherheit.lesen (Z.2302), Stücke unter satz.id (Z.2357-2364), Satz mit TATSÄCHLICHER Länge (Z.2374), Ersetzen entfernt fremde Anhänge nur bei .redion (Z.2394-2404); sicherungLaden (Z.2411): erkennt ZIP an `PK` (Z.2421-2422), Dialog mit ImportVergleich (Z.2476-2495), Sicherheitskopie vor dem Ersetzen (Z.2510-2519), Store.importAll (Z.2530), Anhänge NACH den Blöcken (Z.2537) | 4582 |
| `src/kern/ablage/umzuege.ts` | `Umzuege`: FASSUNGEN 1-7 der Ablage mit Fächern und Grund (Z.46-98: 1 Grundfächer, 2 versions, 3 dateien+stuecke, 4 basis, 5 vorrat, 6 suchindex, 7 auftraege), JETZIGE (Z.102), faecher/zwischen (Z.105-109), hinweisZuAlt (Z.117); Inhaltsumzüge INHALT (Z.281-319): 'zeitstempel-an-sammlungen', 'spaltenschluessel-ohne-ziffer' (spaltenschluesselHeilen Z.214-279, L36/E172), 'alive-ergaenzen'; gemerkt unter meta 'umzuegeGelaufen' (Z.321), laufen() einmalig + wiederholbar (Z.331-359), zuruecksetzen (Z.364); Export Z.366-367 | 371 |
| `src/core/types/backup.ts` | Die Typen der Sicherung: StoreName (Z.26-33), MetaEntry (Z.36), RedionPackageManifest {version, exportiert, enthaelt, fehlt, hinweis} (Z.43-53), RedionPackageData mit VERZEICHNISSEN statt Listen (Z.66-83, Begründung Z.67-75), RedionFileMap {version, saetze, zuordnung} (Z.95-101), RedionPackage (Z.115-118), ImportMode 'ersetzen'\|'zusammenfuehren' ohne Vorgabe (Z.130), ImportReport (Z.151-155). Nur Typen, kein Laufzeitcode (noEmit) | 156 |
| `src/core/import/sicherheit.ts` | `ImportSicherheit` (E284): lesen/entgiften/verzeichnis liefern prototyplose Verzeichnisse; GEFAEHRLICH ['__proto__','constructor','prototype'] (Z.76), MAX_TIEFE 100 (Z.105); Fund wird mitgereicht (satz); Export Z.263-266 | 269 |
| `src/core/import/validierung.ts` | `ImportValidierung`: FAECHER (Z.54), pruefen(d, jetzige) → Befund {taugt, fassung, exportiert, fehlt, zahlen, punkte} (Z.90); Mindestens `blocks` als Verzeichnis (Z.104-112); Fassungsvergleich: keine → hinweis, neuer → warnen, älter → hinweis (Z.134-150); nachsichtig gegen fremde Felder (Z.40-41); brauchtRueckfrage (Z.195) | 205 |
| `src/core/import/vergleich.ts` | `ImportVergleich`: rein, rechnet vor dem Einspielen neu/ersetzt/gleich/verschwindet je Fach (Z.23-28), satz() für den Dialog; Export Z.170 | 173 |
| `src/core/import/zipdetails.ts` | `ZipDetails` (E363): CRC-32 fortlaufend (crc32Start/Weiter/Fertig), UTF8_BIT, VERSCHLUESSELT_BIT, nameDecodieren (CP437-Rückfall) — die EINE Prüfsummentafel für Schreiber und Leser; Export Z.87 | 91 |
| `src/bereiche/dateien/ausgeben.ts` | `Austausch`: eigener ZIP-Packer zipSchreiben (Z.123-330) mit ZIP64 nur bei Bedarf (Z.94-120, Zusatzfeld 0x0001 Z.226, Schlusssätze Z.282-318), crc32Strom scheibchenweise (Z.65-73 über ZipDetails); alsWord (Z.869), alsExcel (Z.1422), alsOds (Z.1269), alsPowerPoint (Z.2924); Obsidian: VaultFrontmatter {redionId, redionPath, redionTitle, aliases} (Z.1633-1638), vaultFrontmatter schreibt `redion-id`/`redion-path`/`redion-title`/`aliases` (Z.1753-1763), safeVaultSegment (Z.1765), alsObsidianVault (Z.1866-1874), ausMarkdownOrdner in zwei Durchgängen (Z.1910ff; Kennung nur mit BEIDEN Ankern id+path, Konfliktregeln Z.2051-2081, Wikilinks über `Links.loeseSeitenverweis` Z.1849); ausNotionZip (Z.2158), ausAppleNotes (Z.2470), dialog (Z.2517ff), grenzen nur für Prüfläufe (Z.3008-3012); Export Z.3003-3013 | 3015 |
| `src/bereiche/dateien/einlesen.ts` | `Einlesen`: zwei ZIP-Leser — zipLesen(ArrayBuffer) (Z.152) und zipLesenAusBlob(Blob) (Z.288, liest nur das 65-KB-Fenster am Ende, dann je Eintrag per slice); ZIP64 am Wegweiser 0x07064b50 erkannt (istZip64 Z.62-63, lies64 Z.68, zip64Zusatz Z.80ff, E39); Prüfsumme/Name/verschlüsselt über ZipDetails (Z.186-408); xlsx/ods/docx/epub/pptx-Leser; pptx-Formen werden Marken mit pts (Z.2625-2672); Export Z.2721-2723 | 2726 |
| `src/bereiche/dateien/archiveImport.ts` | `ArchivImport` (E350): eine fremde ZIP so ins Regal wie sie ist — Ordner werden Fächer, jede Datei ein Dokument, stückweise über Einlesen.zipLesenAusBlob + Dateien.ablegen (Kopf Z.1-38); Optionen/Zwischenstand für den Auftragsläufer (Z.43-54, E365); MIME-Tafel (Z.75-80); `..`/absolute Pfade/ZIP-in-ZIP werden nicht angelegt (Z.29-33); Export Z.731-733 | 736 |
| `src/bereiche/dateien/format.ts` | `NotionFormat`: Notions `[["80"]]`-Werte und Formelbaum ↔ Redions flache Werte/Formeltext (Kopf Z.1-30); wertLesen (Z.55), wertSchreiben, zeileLesen/zeileSchreiben, formelAlsNotion/formelAusNotion, idMitStrichen/idOhneStriche; speichert nichts (Z.26-27); Export Z.438-442 | 445 |
| `src/kern/sicherheit/krypto.ts` | `Krypto`: die verschlüsselte Sicherung — PAKET_ART 'redion-verschluesselt' (Z.59), bestandSammeln ruft Store.exportAll(false, mitGeheimnissen) und stellt art:'redion-sicherung', fassung:1 voran (Z.244-251), sicherungSchreiben (Z.254), sicherungLesen → Store.importAll (Z.282, Z.319), paketBauen = verschlüsseltes .redion MIT Anhängen über Austausch.zipSchreiben (Z.512, Z.542 exportAll(true,true), Z.595) und Einlesen.zipLesenAusBlob (Z.618) | 1034 |
| `src/kern/helfer/ordnersicherung.ts` | `OrdnerSicherung` (E270): schreibt die Sicherung selbst in einen gewählten Ordner (File System Access); MUSTER `redion-sicherung-JJJJ-MM-TT-HHMM.(redion\|json)` ist das einzige Löschmuster (Z.63), BEHALTEN_TAGE 7 (Z.66), TAKT 5 min (Z.51); jetztSichern ruft `App.sicherungPaketBauen` aus der SCHALE (Z.277, Z.301) und Sicherung.merken (Z.313); Export Z.475-477 | 480 |
| `src/kern/helfer/sicherung.ts` | `Sicherung`: stand() (Alter der letzten Sicherung, Stufen gut/erinnern/warnen ab 7/30 Tagen Z.39-40), merken(art), papierkorb(), platz(); Export Z.160 | 163 |
| `doku/REDION-FORMAT.md` | Die Formatbeschreibung: zwei Formate (Z.12-25), Aufbau (Z.29-42), daten.json und Manifest (Z.46-93), Geheimnisse (Z.95-133), Ersetzen ≠ Identität (Z.135-145), dateien.json (Z.170-198), abgeleitete Dateien (Z.202-269), Einspielen (Z.273-292), ZIP64-Grenzen (Z.296-372), verschlüsselte Sicherung (Z.386-421), „Was noch fehlt" (Z.425-442, teilweise veraltet — siehe dokuStand) | 442 |
| `pruefungen/lauf/test96.mts` | Suite 61 — Die Sicherung hält, was sie verspricht: Verlauf war nie dabei, Import räumte nur den Cache, Anhänge fehlen und die Sicherung sagt es (Kopf Z.1-45) | 269 |
| `pruefungen/lauf/test100.mts` | Suite 65 — Die Sicherung nimmt die Anhänge mit: `.redion` Rundlauf mit echten Bytes, Ersetzen räumt fremde Anhänge, `.json` lässt sie in Ruhe (Kopf Z.1-47; Messpunkte Z.136-418) | 430 |

## Datenmodell

ZWEI FORMEN, EIN INHALT. `.json` = der String aus `Store.exportAll()` (indexdb.ts:1843-1983); `.redion` = unkomprimiertes ZIP (Methode 0) mit `daten.json` (derselbe String, aber mit mitAnhaengen=true), `dateien.json` und `dateien/<echter Name>` (schale.ts:2176-2212; Typ RedionPackage backup.ts:115-118). Redion wählt selbst: keine Anhänge → `.json` (schale.ts:2158ff); erkannt wird beim Einlesen an den Bytes `PK`, nicht an der Endung (schale.ts:2421-2422).

DAS MANIFEST (`daten.json`, Typ RedionPackageManifest backup.ts:43-53): `version` = Umzuege.JETZIGE, also die Ablagefassung 7 (indexdb.ts:51, umzuege.ts:102); `exportiert` ISO; `enthaelt` = FAECHER_IMMER ['blocks','collections','views','meta','versions'] + bei Archiv mit echten Dateien ['dateien','stuecke'] (indexdb.ts:1940-1941); `fehlt` = ['dateien','stuecke'] wenn Dateien da sind aber keine Anhänge mitreisen, + 'auftraege' nur wenn Aufträge offen sind (E286), + nurHierAusgelassen (sicherungOrdner, wolkeGeteilt — E270/E279), + geheimAusgelassen (wolkeToken, wolkeProbe, api:* — indexdb.ts:1690-1692), + unbekannte Fächer, die in keiner der drei Listen stehen (E332, indexdb.ts:1951-1959); `abgeleitetAusgelassen` als Zahl (Z.1962); `hinweis` ist ein zusammengesetzter Klartextsatz: „Diese Sicherung enthält N Datei(en) NICHT …“ / „Vollständig: die N Datei(en) liegen im Ordner „dateien“ …“ / „Vollständig: dieser Bestand hat keine Dateianhänge.“ plus Sätze über Ordner, Freigaben, Geheimnisse, Aufträge, unbekannte Fächer (Z.1963-1974). Dann `blocks`, `collections`, `views` als VERZEICHNISSE id→Satz (cache.*), `meta` als gefiltertes Verzeichnis k→v, `versions` als LISTE (Z.1975-1980; backup.ts:66-83 begründet, warum Record und nicht Array). `doku/REDION-FORMAT.md:63-68` zeigt `blocks` als `[ … ]` — das widerspricht backup.ts:76-79 und dem Code; die Doku ist an dieser Stelle falsch.

`dateien.json` (Typ RedionFileMap backup.ts:95-101): {version:1, saetze: RedionFile[] (nur nicht-abgeleitete, schale.ts:2174-2175), zuordnung: Archivname → Datei-Kennung (schale.ts:2202-2205)}. Namensregel im Archiv: `\\ / : * ? \" < > |` → `-`, Kollision → `stamm-2.endung` (schale.ts:2186-2196).

KENNUNGEN BEIM IMPORT: Blöcke, Sammlungen, Ansichten und Versionen werden mit ihrer eigenen `id` per `put` geschrieben — nichts wird neu vergeben (indexdb.ts:2274-2279); bei 'zusammenfuehren' gewinnt bei gleicher Kennung die Sicherung (Z.2341-2343 Object.assign). Anhänge: Stücke werden unter `satz.id + ':' + nr` mit `dateiId: satz.id` abgelegt, der Dateisatz mit derselben Kennung (schale.ts:2357-2374) — deshalb finden Blöcke ihre `dateiId` wieder (§14; test100 Z.291-295). Obsidian-Rundreise: eine Seite wird nur dann destruktiv aktualisiert, wenn `redion-id` UND `redion-path` zusammenpassen; ID allein, Pfad allein oder gleicher Titel ergeben eine getrennte Fassung und zählen als Konflikt (ausgeben.ts:2051-2081, E154). Quelltext-Rundlauf (Markdown) hält Kennungen seit E174 (L40 geschlossen). ZIP ins Regal (ArchivImport): zweimal dieselbe ZIP legt keine Doppel-Fächer an (`unveraendert`, archiveImport.ts:17-19, 60).

UNBEKANNTE BLOCKTYPEN: weder `importAll` noch `ImportValidierung` filtern nach `type` — importAll schreibt jedes Objekt aus `neu.blocks` unverändert (indexdb.ts:2274), die Validierung ist „nachsichtig gegenüber fremden Feldern (ein unbekanntes Feld bleibt stehen)“ (validierung.ts:40-41) und zählt nur Fächer; eine Sicherung aus einer NEUEREN Fassung erzeugt eine Warnung, keine Ablehnung (validierung.ts:139-144). Gezeichnet wird ein unbekannter Typ im Editor über `default: box.appendChild(machText())` (editor.ts:985-986), also als Textfeld, nicht gelöscht (§18). grep 'unbekannt' in indexdb.ts trifft nur Fächer (Z.1784, 1928), nie Blocktypen.

MIGRATIONEN (`Umzuege`): Fassungen 1-7 der Ablage sind additiv (`onupgradeneeded` in indexdb.ts legt fehlende Fächer an; die Erklärung steht in umzuege.ts:46-98); Inhaltsumzüge laufen beim Öffnen (indexdb.ts:356) und noch einmal nach jedem Einspielen mit zurückgesetzter Merkliste (indexdb.ts:2439), gemerkt in meta 'umzuegeGelaufen' (umzuege.ts:321); jeder Umzug ist wiederholbar und wirft nichts weg (Kopf Z.24-28): 'zeitstempel-an-sammlungen' (edited ergänzen), 'spaltenschluessel-ohne-ziffer' (schema/props/views/rollups/automationen umschreiben, Z.214-279), 'alive-ergaenzen' (fehlendes alive = true, sonst verschwänden alte Seiten beim Einspielen, Z.307-318). Ältere App vs neuere Ablage: hinweisZuAlt (Z.117). Der Fassungsvergleich beim Einspielen liest genau diese Zahl (validierung.ts:88, 134-150).

VERSCHLÜSSELT: `Krypto.bestandSammeln` nimmt Store.exportAll und stellt art:'redion-sicherung', fassung:1 voran (krypto.ts:244-251); das äussere Paket trägt art:'redion-verschluesselt', fassung, runden, salz, iv, inhalt (krypto.ts:127, REDION-FORMAT.md:399-408); `paketBauen` (krypto.ts:512-600) ist das verschlüsselte .redion mit Anhängen (`daten.enc`, Z.542) — entgegen REDION-FORMAT.md:437-439, das es als offen führt.

GEHEIMNISSE reisen nur verschlüsselt: `istGeheim` (indexdb.ts:1692) filtert meta beim offenen Export; `nurHier` (Z.1723-1726) hält sicherungOrdner/wolkeGeteilt/wolkeKonto/wolkeBereich immer zurück; beim Einspielen mit 'ersetzen' bleiben Kontoidentität, Ordnerzugriff und Wolke-Merklisten erhalten, die drei Sync-Marken gehen auf null und `wolkeNeuAbgleich` stellt die Frage (indexdb.ts:2193-2245, E255/E270/E279).

## Schnittstellen

| Name | Art | Datei | Was |
|---|---|---|---|
| `Store.exportAll(mitAnhaengen=false, mitGeheimnissen=false) → string` | global | `src/kern/ablage/indexdb.ts:1843` | Der EINE Erzeuger jeder Sicherung (json, daten.json, verschlüsselt). Aufrufer: schale.ts:2158/2177, krypto.ts:248/542 |
| `Store.exportVorbereiten() → {versionen, dateien, …}` | global | `src/kern/ablage/indexdb.ts:2009` | Liest den Verlauf und zählt Dateien/Abgeleitetes VOR exportAll (exportAll ist synchron). Aufrufer schale.ts:2155 |
| `Store.importAll(json, 'ersetzen'\|'zusammenfuehren') → ImportReport` | global | `src/kern/ablage/indexdb.ts:2063` | Entschärfen → prüfen → eine Transaktion → Cache → Umzüge; wirft ohne Art. Aufrufer schale.ts:2530, krypto.ts:319 |
| `Store.dateiAlle/dateiPut/dateiWeg/stueckPut/stueckeVon/stueckWeg` | global | `src/kern/ablage/indexdb.ts` | Der Anhang-Weg des Packers/Lesers (schale.ts:2174, 2357-2400) |
| `Umzuege.{FASSUNGEN, JETZIGE, INHALT, faecher, zwischen, hinweisZuAlt, laufen, gelaufen, zuruecksetzen}` | global | `src/kern/ablage/umzuege.ts:366` | Fassung der Ablage = Formatfassung der Sicherung; Aufrufer indexdb.ts:51/356/2439, einstellung/app.ts:144 |
| `ImportSicherheit.{lesen, entgiften, verzeichnis, satz, …}` | global | `src/core/import/sicherheit.ts:263` | Prototyplos lesen; Aufrufer indexdb.ts:2088, schale.ts:2302 |
| `ImportValidierung.{pruefen, brauchtRueckfrage, saetze, FAECHER}` | global | `src/core/import/validierung.ts:202` | Befund statt Fehler; Aufrufer indexdb.ts:2098 |
| `ImportVergleich.{rechnen, satz, warnt, kern}` | global | `src/core/import/vergleich.ts:170` | Was Ersetzen/Dazulegen wirklich tun; Aufrufer schale.ts:2476-2492 |
| `ZipDetails.{crc32Start, crc32Weiter, crc32Fertig, crc32, UTF8_BIT, VERSCHLUESSELT_BIT, nameDecodieren, …}` | global | `src/core/import/zipdetails.ts:87` | Die eine Prüfsummentafel; ausgeben.ts:51-74, einlesen.ts:186-408 |
| `Austausch.{zipSchreiben, crc32, laden, alsWord, alsPowerPoint, alsExcel, alsOds, ausTrello, ausEvernote, ausAsana, ausAppleNotes, ausMarkdownOrdner, alsObsidianVault, ausNotionZip, ausNotionJson, dialog, QUELLEN, grenzen}` | global | `src/bereiche/dateien/ausgeben.ts:3003` | Packer + Fremdformate; von schale (2212), krypto (595/796), wissen, datenbanken, spreadsheet, vorlagen gerufen (bereiche-bestand.json) |
| `Einlesen.{zipLesen, zipLesenAusBlob, xlsxLesen, odsLesen, docxLesen, epubLesen, alsDatenbank, datei, tabellenBerichtText}` | global | `src/bereiche/dateien/einlesen.ts:2721` | ZIP-Leser (Blob-Weg für .redion: schale.ts:2425, krypto.ts:618) und Office-Leser |
| `ArchivImport.{importZip, alsAuftrag, zipLaeufer, umfang, planen, AUFTRAG_ART, dateiAlsDokument, waehlen, …}` | global | `src/bereiche/dateien/archiveImport.ts:731` | ZIP ins Regal, als Auftrag der Auftragsmaschine (E350/E365); von wissen gerufen (8 Stellen) |
| `NotionFormat.{wertLesen, wertSchreiben, zeileLesen, zeileSchreiben, alsMarkdown, ausMarkdown, formelAlsNotion, formelAusNotion, rundlauf, …}` | global | `src/bereiche/dateien/format.ts:438` | Notion-Schreibweisen in beide Richtungen |
| `Krypto.{sicherungSchreiben, sicherungLesen, paketBauen, …}` | global | `src/kern/sicherheit/krypto.ts:254/282/512` | Verschlüsselte Sicherung; nimmt exportAll/importAll, Austausch.zipSchreiben, Einlesen.zipLesenAusBlob |
| `Sicherung.{stand, merken, papierkorb, platz, groesse}` | global | `src/kern/helfer/sicherung.ts:160` | Alter der letzten Sicherung; von Schale und Ordner-Sicherung gemerkt |
| `OrdnerSicherung.{moeglich, an, name, waehlen, loesen, standAbdruck, jetztSichern, zuLoeschen, start, fehler, MUSTER, BEHALTEN_TAGE, TAKT}` | global | `src/kern/helfer/ordnersicherung.ts:475` | Automatische Sicherung in einen Ordner (E270) |
| `App.sicherungPaketBauen(...)` | funktion | `src/kern/helfer/ordnersicherung.ts:277,301 → src/schale/aufbau/schale.ts:2148` | Der Kern (`kern/helfer`) ruft die SCHALE über `App`, mit typeof-Wache — der Packer liegt nicht im Kern |
| `notify('import') und meldeAnAndereFenster('alles', [])` | ereignis | `src/kern/ablage/indexdb.ts:2446,2450` | Nach dem Einspielen: alle Fenster fangen von vorn an (§16) |
| `Links.loeseSeitenverweis(name)` | global | `src/bereiche/dateien/ausgeben.ts:1849,2128,2135 → src/bereiche/wissen/verweise.ts:20` | Wikilinks im Vault werden über den Resolver des Bereichs WISSEN aufgelöst — ein §5-Querverweis, im Bestand geführt (bereiche-bestand.json: dateien→wissen `Links` 3) |
| `<script>-Einträge` | global | `index.html:528-535, 640-641, 666, 671-672, 678` | core/import/* (528-532), kern/ablage/umzuege (535), dateien/einlesen+archiveImport (640-641), dateien/ausgeben (666), kern/helfer/sicherung+ordnersicherung (671-672), dateien/format (678) |

## Geometrie — was dieses System selbst rechnet

| Primitive | vorhanden | eigen | wo |
|---|---|---|---|
| point | ja | **ja** | src/bereiche/dateien/einlesen.ts:2637,2657,2672 — pptx-Formen werden Marken mit `pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]]`; reine Datenübernahme aus x/y/w/h, ohne core/ink/geometry |
| rect | ja | **ja** | einlesen.ts:2637-2672 — achsenparalleles Rechteck aus x/y/w/h als zwei Punkte; ausgeben.ts:722/2709 schreibt nur `prstGeom prst="rect"` ins OOXML (kein Rechnen) |
| bounds | nein | nein | nicht gefunden (grep bounds\|getBoundingClientRect in format/archiveImport/ausgeben/einlesen/umzuege/sicherung/ordnersicherung → 0 Treffer) |
| transform | ja | **ja** | Einheitenumrechnung, keine Matrix: einlesen.ts:1000-1012 EMU→Blattpunkte (914400 je Zoll, 12700 je Punkt); ausgeben.ts:436-437 EMU_JE_PIXEL 9525, Z.705 |
| viewport | nein | nein | nicht gefunden |
| zoom | nein | nein | einlesen.ts:1456 `zoom: 'zoom'` ist ein pptx-Übergangsname, keine Geometrie; sonst nicht gefunden |
| pan | nein | nein | nicht gefunden |
| selection | nein | nein | nicht gefunden (die Auswahl von Dateien im Dialog ist keine Geometrie) |
| hitTest | nein | nein | nicht gefunden |
| snap | nein | nein | nicht gefunden |
| resizeHandles | nein | nein | nicht gefunden |
| rotation | ja | nein | einlesen.ts:2636,2656,2671 — `dreh` wird aus der pptx-Form DURCHGEREICHT (`...(o.dreh ? { dreh: o.dreh } : {})`), nicht gerechnet |
| group | nein | nein | nicht gefunden |
| connector | nein | nein | nicht gefunden |
| frame | nein | nein | nicht gefunden |
| zOrder | nein | nein | nicht gefunden (die Reihenfolge der pptx-Formen wird als Marken-Reihenfolge übernommen, ohne eigene z-Rechnung) |
| undo | nein | nein | kein Undo; stattdessen Alles-oder-nichts-Transaktion (indexdb.ts:2264-2318, E79) und Sicherheitskopie vor dem Ersetzen (schale.ts:2510-2519, E292). `Verlauf` wird hier nicht benutzt (grep Verlauf\. → 0) |
| pointerNormalisierung | nein | nein | nicht gefunden (grep pointer → 0 in den Systemdateien) |

## Gemeinsam genutzt

**Benutzt:** [[kern-Store|Store]] · [[kern-Verlauf|Verlauf]] · [[kern-Dateien|Dateien]]

**Nur genannt, nicht benutzt:** [[kern-Register|Register]] · [[kern-Ereignis|Ereignis]] — der Befund sagt, warum.

- `Store` (src/kern/ablage/indexdb.ts): exportAll/exportVorbereiten/importAll (schale.ts:2155-2177, 2530; krypto.ts:248, 319, 542), dateiAlle/dateiPut/dateiWeg/stueckPut/stueckeVon/stueckWeg (schale.ts:2174, 2357-2400), getMeta/setMeta (ordnersicherung.ts:73-78, sicherung.ts:46), cache (umzuege.ts:216-262)
- `Umzuege` (src/kern/ablage/umzuege.ts): JETZIGE als Formatfassung (indexdb.ts:51), laufen (indexdb.ts:356, 2439)
- `ImportSicherheit`, `ImportValidierung`, `ImportVergleich` (src/core/import/): indexdb.ts:2088/2098, schale.ts:2302/2476-2492
- `ZipDetails` (src/core/import/zipdetails.ts): ausgeben.ts:51-74 (crc32, crc32Strom), 210/247 (UTF8-Bit); einlesen.ts:186 (nameDecodieren), 215-408 (istVerschluesselt, crc)
- `Bytes` (src/core/helpers/bytes.ts): einlesen.ts:328; Base64 nur dort (REDION-FORMAT.md:419-421, test87)
- `Dateien` (src/bereiche/dateien/ablage.ts — ein Bereich, als Kern gegriffen): alsBlob (schale.ts:2089, 2181; ausgeben.ts:507, 854, 861), ablegen (schale.ts:2251; einlesen.ts:2472, 2665), adresseWeg (schale.ts:2403), groesseText (schale.ts:2372)
- `Austausch.zipSchreiben` und `Einlesen.zipLesenAusBlob` (src/bereiche/dateien/) als der ZIP-Weg für ALLE Pakete: schale.ts:2212/2425, krypto.ts:595/618/796, archiveImport.ts (Kopf Z.22-24)
- `Sicherung` (src/kern/helfer/sicherung.ts): merken in ordnersicherung.ts:313, stand in ordnersicherung.ts:440
- `App.sicherungPaketBauen` (Schale) aus ordnersicherung.ts:277/301 — Kern ruft Schale
- `Reporter` (src/core/helpers/reporter.ts): umzuege.ts:342-353, indexdb.ts:2320/2441
- `Register`: NICHT benutzt in diesem System (grep Register\. in den Systemdateien → 0; schale.ts:1733-1738 Register.bloecke gehört zum Editor-Teil der Schale). `Verlauf`, `Ereignis`-Bus: nicht benutzt; indexdb.ts:2446/2450 nutzen die Store-internen notify/meldeAnAndereFenster
- `Links` (src/bereiche/wissen/verweise.ts:20): ausgeben.ts:1849/2128/2135 — fremder Bereich, im Bestand geführt (bereiche-bestand.json dateien→wissen)

## Duplikate — je mit zwei Stellen und Zitat

Führen zu: [[pdf|D · PDF-Schreibstudio und Ink]] · [[editor|A · Editor und Blockmodell]] · [[gemeinsam|G · Gemeinsame räumliche Infrastruktur]] · [[sync|J · Abgleich, Anhänge, Stücke]]

1. **Dateinamen-Säuberung nach der Regel aus REDION-FORMAT.md:196-197 (`\ / : * ? " < > |` → `-`) — acht Stellen, kein Helfer in src/core/helpers (grep dateiname|sauber|safeName in core/helpers, kern/helfer → nur ordnersicherung.ts:187 zeitAus)**
   - hier: `src/schale/aufbau/schale.ts:2186 (Archivname im .redion); src/bereiche/dateien/ausgeben.ts:902, 1011, 1334, 1490, 2929`
   - dort: `src/bereiche/datenbanken/steuerung.ts:4025; src/bereiche/spreadsheet/ansicht.ts:1718; Variante mit `+/g, ' '` in src/bereiche/pdf/document-mode.ts:4302, 4390`
   - Beleg: schale.ts:2186 `const roh = String(satz.name || 'Datei').replace(/[\\/:*?"<>|]/g, '-');` — steuerung.ts:4025 `a.download = (coll.name || 'Auswahl') + ' — ' + String(titel).replace(/[\\/:*?"<>|]/g, '-') + '.csv';` — ausgeben.ts:902 `laden(blob, (seite.text || 'Seite').replace(/[\\/:*?"<>|]/g, '-') + '.docx');`
2. **Eine dritte Fassung derselben Namensregel für Vault-Segmente (Zeichenklasse gleich, Ersatz Leerzeichen statt `-`, dazu Windows-Reservierte) neben der Pfadnormalisierung im Bereich wissen**
   - hier: `src/bereiche/dateien/ausgeben.ts:1765-1771 safeVaultSegment`
   - dort: `src/bereiche/wissen/verweise.ts:153-156 normalisiereVaultPfad`
   - Beleg: ausgeben.ts:1766 `.replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim()` — verweise.ts:153-156 `.normalize('NFKC').replace(/\\/g, '/') … .split('/').map(segment => segment.trim().replace(/\s+/g, ' ')).filter(Boolean)`
3. **`elVon` (Event-Ziel als Element) wortgleich in 22 Dateien, darunter zwei dieses Systems**
   - hier: `src/bereiche/dateien/format.ts:36-37; src/bereiche/dateien/ausgeben.ts:32-33`
   - dort: `src/bereiche/editor/ansicht/editor.ts:28 (System A) und 19 weitere (einstellungen, datenbanken, wissen, verbinden, kommentare, erwaehnungen)`
   - Beleg: format.ts:36 `const elVon = (e: Event): Element | null =>` / Z.37 `e.target instanceof Element ? e.target : null;` — editor.ts:28 identisch (grep 'const elVon = (e: Event): Element | null' → 22 Treffer)
4. **Eigene `esc`-Funktion im Austausch (ohne `'`, also nicht die §19-Fassung) neben fünf Kern-Fassungen**
   - hier: `src/bereiche/dateien/ausgeben.ts:38-40`
   - dort: `src/kern/abgleich/zusammenfuehren.ts:51; src/kern/zugang/sitzung.ts:34; src/kern/zugang/rechte.ts:39; src/kern/ereignisse/protokoll.ts:257; src/kern/helfer/vorschau.ts:46`
   - Beleg: ausgeben.ts:38 `const esc = (s: string) => String(s ?? '')` Z.39-40 `.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');` — zusammenfuehren.ts:51 `const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,`
5. **Die Sicherheitskopie vor dem Ersetzen existiert zweimal (offener Weg in der Schale, verschlüsselter Weg in Krypto) — die Schale sagt es selbst**
   - hier: `src/schale/aufbau/schale.ts:2496-2519 (`sicherungSpeichern` vor `Store.importAll`)`
   - dort: `src/kern/sicherheit/krypto.ts:935 (laut Kommentar in schale.ts:2498; Stelle nicht selbst gelesen)`
   - Beleg: schale.ts:2497-2498 `Der VERSCHLÜSSELTE Weg schreibt seit jeher eine Sicherheitskopie, bevor er ersetzt (\`krypto.ts:935\`, dort steht derselbe Satz).` — schale.ts:2511 `kopie = await sicherungSpeichern();`
6. **INNERHALB des Systems: die Suche nach dem ZIP-Schlusssatz (EOCD 0x06054b50) steht zweimal — einmal über ArrayBuffer, einmal über ein Blob-Fenster; beide mit eigener Fehlermeldung**
   - hier: `src/bereiche/dateien/einlesen.ts:157-161 (zipLesen)`
   - dort: `src/bereiche/dateien/einlesen.ts:292-296 (zipLesenAusBlob) — gleiche Datei, kein anderes System; genannt, weil eine gemeinsame Schicht beide Pfade zusammenführen müsste`
   - Beleg: Z.158-159 `for (let i = d.byteLength - 22; i >= Math.max(0, d.byteLength - 65558); i--) { if (d.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }` — Z.293-294 `for (let i = ende.byteLength - 22; i >= 0; i--) if (ende.getUint32(i, true) === 0x06054b50) { eocd = i; break; }`
7. **INNERHALB des Systems: zwei MIME-Tafeln nach Dateiendung**
   - hier: `src/bereiche/dateien/archiveImport.ts:75-80 (`MIME: Record<string,string>`)`
   - dort: `src/bereiche/dateien/ausgeben.ts:2189 (Notion-ZIP: `pdf: { typ: 'application/pdf', block: 'file' }`) — gleiches System`
   - Beleg: archiveImport.ts:76 `pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',` — ausgeben.ts:2189 `pdf:  { typ: 'application/pdf', block: 'file' },`

## Prüfläufe

- `test96` — Suite 61 — Die Sicherung hält, was sie verspricht: Verlauf in der Sicherung, Import räumt die Ablage (nicht nur den Cache), `fehlt` nennt die Anhänge
- `test100` — Suite 65 — `.redion` mit echten Bytes: sichern, löschen, zurückholen, Byte für Byte; Ersetzen räumt fremde Anhänge, `.json` lässt sie in Ruhe, alter Leser liest neues Archiv (Z.136-418)
- `test103` — Suite 68 — Grenzen des ZIP-Packers in Node: ZIP64 gegen `unzip`/`zipinfo`, 70 000 Einträge wirklich geschrieben (E39)
- `test104` — Suite 69 — Die verschlüsselte Sicherung hält, was der Dialog verspricht (vier Funde, REDION-FORMAT.md:410-421)
- `test148` — Suite 112 — Was der Browser bei einer grossen Sicherung wirklich hergibt (L14, 144 MB)
- `test152` — Suite 116 — Ein kaputter Import überschreibt nichts halb: mitten im Einspielen ein Fach kaputt, danach alles wie vorher (E79)
- `test144` — Suite 108 — Ein Lesefehler ist kein leerer Bestand
- `test185` — Suite 151 — Was WIRKLICH im Archiv steht: das Manifest zählte abgeleitete Dateien mit (E111)
- `test180` — Suite 146 — Die Seitenbilder kommen aus dem Original zurück (abgeleitet nicht in der Sicherung, E106)
- `test199` — Suite 165 — Das verschlüsselte Paket mit Anhang, Zurückholen und Passwortwechsel (E122, L21)
- `test200` — Suite 166 — Der Wettlauf beim Zurückholen (E123)
- `test85` — Suite 50 — Der Kern: Helfer, Sicherheit, Formen, UMZÜGE (Katalog der Fassungen, `zwischen`)
- `test95` — Suite 60 — Ein alter Bestand überlebt den Umzug: echte Fassung-1..5-Datenbanken mit heutigem Code geöffnet
- `test227` — Suite 193 — Ein Spaltenschlüssel aus lauter Ziffern: der Inhaltsumzug (L36, E172)
- `test270` — Suite 270 — Deine Daten auf allen Geräten: Ordner-Sicherung (E270)
- `test288` — Suite 288 — Der Abdruck der Ordner-Sicherung bemerkt Anhänge (E294, L82 Punkt 5)
- `test117` — Suite 81 — Der Sicherungsstand steht auf dem Start-Bildschirm, und er stimmt
- `test273` — Suite 273 — Einspielen ersetzt Inhalte, nicht die Identität (L76 / E279)
- `test278` — Suite 278 — Eine FEINDLICHE Sicherung einspielen: __proto__/constructor (E284)
- `test287` — Suite 287 — Vor dem Ersetzen ein Netz: Sicherheitskopie im offenen Weg (E292)
- `test308` — Suite 308 — Eine dazugelegte Sicherung erreicht den Server (L100, E314)
- `test311` — Suite 311 — Ein fehlender Anhang wird genannt (E317)
- `test312` — Suite 312 — Ein verkürzter Anhang wird genannt (E318)
- `test325` — Suite 325 — Ein Fach, das niemand erklärt hat: unbekannte Fächer im Manifest (L102 Punkt 5, E332)
- `test261` — Suite 261 — Block-Grabsteine: Sofort-Löschen erreicht den Server (Merklisten überleben das Ersetzen, E254/E255)
- `test280` — Suite 280 — Die Auftragsmaschine überlebt den Neustart (auftraege reisen nicht mit, E286)
- `test342` — Suite 342 — Eine ZIP kommt so ins Regal, wie sie ist (ArchivImport, E350)
- `test355` — Suite 355 — Der ZIP-Leser sagt die Wahrheit: Prüfsumme, CP437, verschlüsselt — und die ZIP erkennt sich wieder (E363)
- `test357` — Suite 357 — Der ZIP-Import ist ein Auftrag: er überlebt den geschlossenen Tab (E365)
- `test363` — Suite 363 — Was ein langer Import kostet, steht vorher da (E373)
- `test49` — Word- und Excel-Ausgabe, Trello, Evernote, Obsidian, Notion-ZIP einlesen
- `test66` — Notions eigene Schreibweisen: verschachtelte Werte und der Formelbaum (NotionFormat)
- `test106` — Suite 71 — Die deutschen Excel-Namen, in Node
- `test139` — Suite 103 — Ein Typ, der lügt, ist schlimmer als keiner (Spaltentyp beim Einlesen)
- `test219` — Suite 185 — Der Obsidian-Rundlauf: Vault exportieren, einlesen, NOCH EINMAL einlesen — nichts verdoppelt; gleicher Titel ohne redion-id verschmilzt NICHT (E154)
- `test253` — Suite 253 — Rückverweise und unverlinkte Erwähnungen (Obsidian-Leser, `Links`)
- `test220` — Suite 186 — Der Weg zurück zur Quelle (§44)
- `test182` — Suite 148 — Eine beschriebene Seite lässt sich weitergeben (E108)
- `test186` — Suite 152 — Ein Dateiname ist kein HTML (E112)
- `test192` — Suite 158 — Jede Blockart muss etwas hergeben (Export je Blockart, E119)
- `test74` — Die Einzeldatei muss allein laufen (Sicherung in der Einzeldatei)
- `test233` — Suite 199 — Ein grosser Bestand, und was er kostet (L22)
- `test33, test114, test130, test137, test146, test181, test184, test196, test201, test202, test204, test228, test242, test272, test301, test320, test335, test340, test353, test369, test397, test407, test411, test427, test446, test458, test464, test480, test495, test501, test517, test529, test538` — Treffen das grep nur beiläufig (ein Aufruf von exportAll/Austausch/Einlesen im Aufbau oder das Wort „Sicherung“); halten nicht dieses System — nicht als Wächter zählen

## Doku-Stand

AUFGABEN.md: kein offener Eintrag zu diesem System (grep '\\.redion|exportAll|importAll|obsidian|umzuege|backup|sicherung' → nur Nebentreffer). Verbindlich dort: „Bei Backup, Import oder Export: node pruefungen/alle.mts 96 100“ (Z.771-775) und Regel 5 „Feldnamen gespeicherter Daten sind keine Namensfrage, sondern eine Migrationsfrage“ (Z.807-808). Obsidian steht nur in der Visionskarte (Z.819-861, „Tägliche Notizen — der Rest von ‚wie Obsidian‘“ Z.861).

LUECKEN.md (Achtung: ab etwa L60 sind die Überschriften Klartext ohne `##`, z. B. „L101 — …“ Z.3093; grep '^## L' findet sie nicht): GESCHLOSSEN mit Bezug: L14 ZIP64 (E39, Z.522), L21 verschlüsseltes .redion/Paketfassung 2 (E122, Z.796-806), L26/L27 Import aus anderen Werkzeugen (Z.1004, 1043), L36 numerische Spaltenschlüssel (E172, Z.909), L40 Markdown-Rundlauf/Kennungen (E174, Z.8762), L42 verschlüsselt holt nicht zurück (Z.8823), L43 Anhang ohne blockId (Z.9032), L74 Wolke-Merklisten (Z.2041), L76 Wolke nach Ersetzen (E279, Z.2120), L100 (E314), L101 Import-Härtung — alle vier Punkte (E316/E317/E292/E318, Z.3093-3160), L102 Punkt 5 Fachlisten (E332, Z.3293-3294). OFFEN mit Bezug: L72 „DOCX trägt in beide Richtungen nur Klartext, und der Import ist ungeprüft“ (Z.1917; E245 nur Teil 1), L82 „Was der Geräte-Abgleich und die Ordner-Sicherung (E270) noch nicht können“ (Z.2295), L114 Punkte 2 („Jedes Bild wird ein Deckel“) und 3 (halb, E366) des ZIP-Imports (Z.4274-4290; Punkte 1, 4-7 erledigt). Nur beiläufig: L1 (TS-Migration), L10, L11.

ENTSCHEIDUNGEN.md (ab E255 ebenfalls Klartext-Überschriften „E284 — …“, Verzeichnis vorn Z.48-720): E4 `.redion` ZIP-Paket (Z.894), E5 Import löscht Anhänge nicht falsch (Z.945), E39 ZIP64 (Z.2618), E79 Einspielen ganz oder gar nicht (Z.5718), E96/E172 Spaltenschlüssel, E103/E106 abgeleitete Seitenbilder, E111 Manifest log (Z.7817), E122 verschlüsseltes Paket (Z.8761), E129 Resolver für Vault-Pfade (Z.9038), E154 Obsidian-Rundlauf (Z.10809), E174 Kennungen überleben den Quelltext-Rundlauf (Z.12713), E182 Export-Knopf, E245 DOCX-Import-Prüflauf, E270 Ordner-Sicherung, E279 Ersetzen ≠ Identität (Z.21463), E284 Import-Härtung (Z.22026), E286 auftraege reisen nicht mit, E292 Netz vor dem Ersetzen, E294 Abdruck bemerkt Anhänge, E314, E317, E318, E332 unbekannte Fächer (Z.25930), E350 ZIP ins Regal, E363 ZIP-Leser sagt die Wahrheit (Z.28938), E365 ZIP-Import als Auftrag, E373 Kostenschätzung, E469 Import/Export wie GoodNotes, E539 ZIP-Durchreichen für Office-Rundreisen, E594 Messlatten (Obsidian).

ERLEDIGTE-AUFGABEN.md: „Phase 3 · Backup und `.redion` dokumentieren · erledigt“ (Z.2331-2351), E154 (Z.2007), settled()/importAll-Wettlauf (Z.2127-2169), `.gitignore` deckt `*.redion` (Z.1480-1481).

DOKU-BEFUNDE (Drift): 1) `doku/REDION-FORMAT.md:425-442` „Was noch fehlt“ nennt ZIP64 und ein verschlüsseltes `.redion` als offen — beides ist gebaut (L14/E39; L21/E122, krypto.ts:512 paketBauen, test199). 2) REDION-FORMAT.md:63-68 zeigt `blocks/collections/views/meta` als Listen `[ … ]`; geschrieben werden Verzeichnisse (indexdb.ts:1975-1979, backup.ts:66-83). 3) „Formatkennzeichen in daten.json“ und „Prüfsumme über daten.json“ (REDION-FORMAT.md:427-433): in LUECKEN.md NICHT gefunden (grep formatkennzeichen|prüfsumme über → 0) — offen nur in der Formatdoku; daten.json trägt tatsächlich kein `art`-Feld (indexdb.ts:1937-1980), nur die verschlüsselte Sicherung schreibt `art: 'redion-sicherung'` (krypto.ts:251). 4) `doku/karte/karte.json` führt dieses System nicht (nur editor/zeichenflaeche/gedankenkarte).

## Risiken

- Feldnamen sind Daten: `enthaelt`, `fehlt`, `hinweis`, `exportiert`, `zuordnung`, `saetze`, `abgeleitetAusgelassen` stehen wörtlich in jeder geschriebenen Sicherung (backup.ts:14-18); eine gemeinsame Schicht darf Typen englisch benennen, Felder nie (§53.3).
- Die Formatfassung IST die Ablagefassung (indexdb.ts:51 `VERSION = Umzuege.JETZIGE`): wer einen Umzug anlegt, hebt das Manifest an; ältere Geräte warnen dann beim Einspielen (validierung.ts:139-144). Eine getrennte Formatfassung wäre eine Datenmigration der Manifeste.
- Der `.redion`-Packer/Leser liegt in der SCHALE (schale.ts:2148-2545), nicht im Kern; `OrdnerSicherung` (kern/helfer, Z.277/301) und `Krypto` (kern/sicherheit, Z.595/618) hängen daran. Eine gemeinsame Schicht muss drei Aufrufer gleichzeitig umziehen, sonst laufen offene, verschlüsselte und automatische Sicherung auseinander — genau der Fehler aus REDION-FORMAT.md:410-421 (eigenes, ärmeres Format).
- Blöcke, Sammlungen, Ansichten, Versionen und Dateisätze behalten ihre Kennungen (indexdb.ts:2274-2279; schale.ts:2357-2374). Jede Schicht, die beim Einlesen neue IDs vergibt (wie `Store.baumEinfuegen`, das `delete patch.id` macht), trennt Blöcke von ihren `dateiId`s (§14) und bricht test100 Z.291-295 und E174.
- 'ersetzen' löscht Anhänge NUR bei einem `.redion` mit `dateien.json` (schale.ts:2394-2404); `.json` darf das nie (E5/E40, test100 Z.371). Eine Schicht, die beide Wege vereinheitlicht, muss diese Asymmetrie tragen.
- Abgeleitete Dateien werden beim HOLEN gefiltert, und `dateien.json` entsteht aus derselben gefilterten Liste (schale.ts:2166-2175, E111). Wer die Liste an zweiter Stelle baut, verspricht Sätze ohne Bytes.
- Unbekannte Blocktypen überleben heute, weil nichts filtert (indexdb.ts:2274; validierung.ts:40-41; editor.ts:985). Eine gemeinsame Schicht mit Typ-Whitelist oder Schema-Prüfung je Block würde §18 brechen.
- Geheimnisse: nur `exportAll` filtert GEHEIM/GERAETEIGEN (indexdb.ts:1690-1726). Jede zweite Exportstelle, die `cache.meta` direkt liest, gibt `wolkeToken` und `api:*` preis (L76/E279). Krypto geht korrekt über exportAll (krypto.ts:248) — das muss so bleiben.
- Einspielen ist eine Transaktion über sechs Fächer (indexdb.ts:2264-2268), die Anhänge kommen DANACH und einzeln (schale.ts:2537, L101 Punkt 2 → E317: gemeldet, nicht transaktional). Eine Schicht, die Anhänge vor den Blöcken schreibt, verliert sie beim Ersetzen wieder (schale.ts:2533-2535).
- Zwei ZIP-Leser-Pfade (einlesen.ts:152 ArrayBuffer, Z.288 Blob) und ein Packer mit bedingtem ZIP64 (ausgeben.ts:94-330): Rundreisen prüfen beide (test100 Z.156, test103 gegen unzip/zipinfo). Ein Zusammenlegen ohne diese beiden Läufe ist blind.
- Multi-Tab: nach dem Einspielen `meldeAnAndereFenster('alles')` (indexdb.ts:2450) und `settled()` davor/danach (Z.2066, 2453). Eine Schicht, die importAll umgeht, lässt andere Tabs mit altem Cache stehen (§16, ERLEDIGTE Z.2127-2169).
- §5: der Bereich `dateien` greift heute in `wissen` (Links 3, Werkzeuge 10, Bibliothek 3), `datenbanken` (Datenbank 9, Formula 7), `pdf` (Marken 3, PdfEinlesen 2), `bloecke`, `einstellungen` (bereiche-bestand.json). Nach core/kern ziehen lässt sich davon nur Reines (Namensregel, Frontmatter-Lesen); `Links` ist der Kern des Wissensbereichs.
- Die Namensregel `/[\\/:*?"<>|]/` steht achtmal; wer sie zentralisiert und dabei das Ersatzzeichen ändert (Leerzeichen statt `-`), bricht die Wiedererkennung bereits geschriebener `.redion`-Archive über `zuordnung` NICHT (die Karte trägt den Namen), wohl aber die Gleichheit von Dateinamen zwischen zwei Sicherungen desselben Bestands.

## Kleinster nächster Schritt (Vorschlag des Lesers)

Zwei reine, datenformat-neutrale Schritte, beide ohne Browser prüfbar: (1) Die Dateinamen-Regel aus REDION-FORMAT.md:196-197 als EINEN Helfer nach `src/core/helpers/` ziehen (Ersatz `-`, Kollision `-2` vor der Endung, wie schale.ts:2186-2196) und die acht Stellen (schale.ts:2186; ausgeben.ts:902, 1011, 1334, 1490, 2929; datenbanken/steuerung.ts:4025; spreadsheet/ansicht.ts:1718) darauf umstellen — mit einem Node-Lauf im Stil von test103, der vorher gegen den alten Stand rot war (§50), und `test100` danach (Archivnamen in `zuordnung` bleiben byteweise gleich). (2) `doku/REDION-FORMAT.md:425-442` „Was noch fehlt“ und Z.63-68 auf den Stand bringen: ZIP64 (E39/L14) und verschlüsseltes `.redion` (E122/L21, krypto.ts:512) sind gebaut, `blocks/collections/views/meta` sind Verzeichnisse (backup.ts:66-83); Formatkennzeichen und Prüfsumme über `daten.json` als Lücke in LUECKEN.md eintragen, statt sie nur in der Formatdoku zu führen (§35). Dazu: dieses System als vierten Eintrag in `doku/karte/karte.json` aufnehmen und `node karte.mts` laufen lassen — dann liest der nächste Leser die Notiz statt 18'000 Zeilen.
