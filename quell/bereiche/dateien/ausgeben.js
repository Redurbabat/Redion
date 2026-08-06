"use strict";
/* ============================================================================
 * austausch.js — Word, Excel und fremde Werkzeuge
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/dateien/ausgeben.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/dateien/ausgeben.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion gibt Seiten als PDF, HTML, Markdown und CSV aus — Word und Excel
 * fehlen, und beim Einlesen kennt es nur eine Handvoll Quellen.
 *
 * Hier steht beides:
 *
 *   AUSGEBEN  · .docx — eine echte Word-Datei, ohne fremde Pakete
 *             · .xlsx — eine echte Excel-Mappe, eine Tabelle je Ansicht
 *
 *   EINLESEN  · Trello (JSON)      — Listen werden Status, Karten Zeilen
 *             · Evernote (.enex)   — jede Notiz eine Seite
 *             · Obsidian (Ordner)  — [[Wikilinks]] werden echte Verweise
 *             · Notion-Export (ZIP)— Markdown und CSV daraus
 *             · Asana / Jira (CSV) — über die vorhandene CSV-Einleseroutine
 *
 * Word- und Excel-Dateien sind ZIP-Archive mit XML darin. Zum Schreiben
 * braucht es nur einen einfachen ZIP-Packer — der steht ganz oben.
 * ==========================================================================*/
const Austausch = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    /* ========================================================================
     * 1. ZIP SCHREIBEN
     * ------------------------------------------------------------------------
     * Ohne Komprimierung (Methode 0). Word und Excel lesen das anstandslos,
     * und der Code bleibt kurz genug, um ihn zu überblicken.
     * ======================================================================*/
    let crcTafel = null;
    const crc32 = (daten) => {
        if (!crcTafel) {
            crcTafel = new Uint32Array(256);
            for (let n = 0; n < 256; n++) {
                let c = n;
                for (let k = 0; k < 8; k++)
                    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                crcTafel[n] = c >>> 0;
            }
        }
        let c = 0xFFFFFFFF;
        for (let i = 0; i < daten.length; i++)
            c = crcTafel[(c ^ daten[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    };
    /**
     * Dieselbe Prüfsumme, aber häppchenweise — für einen Blob, der nicht in den
     * Arbeitsspeicher passt.
     *
     * WARUM ES DAS BRAUCHT. `crc32` will alle Bytes auf einmal. Bei einem Video
     * von 500 MB heisst das 500 MB im Arbeitsspeicher, nur um eine Zahl
     * auszurechnen — auf einem Telefon der sichere Absturz. Ein Blob liegt beim
     * Browser auf der Platte; wer ihn scheibchenweise liest, braucht nie mehr
     * als eine Scheibe.
     *
     * Die Prüfsumme ist ihrer Natur nach fortlaufend, das kommt uns entgegen:
     * Byte für Byte, ohne zu wissen, wie viele noch kommen.
     */
    const SCHEIBE = 1024 * 1024;
    const crc32Strom = async (blob, beiFortschritt) => {
        if (!crcTafel)
            crc32(new Uint8Array(0)); /* Tafel einmal bauen */
        let c = 0xFFFFFFFF;
        for (let von = 0; von < blob.size; von += SCHEIBE) {
            const bis = Math.min(von + SCHEIBE, blob.size);
            const teil = new Uint8Array(await blob.slice(von, bis).arrayBuffer());
            for (let i = 0; i < teil.length; i++)
                c = (crcTafel[(c ^ (teil[i] ?? 0)) & 0xFF] ?? 0) ^ (c >>> 8);
            if (beiFortschritt)
                beiFortschritt(bis / blob.size);
        }
        return (c ^ 0xFFFFFFFF) >>> 0;
    };
    /* Ein ZIP der alten Bauart zählt Grössen und Versätze in 32 Bit. Darüber
       braucht es ZIP64 — das ist ein anderes Format, kein grösseres Feld.
       Hier wird deshalb ehrlich abgebrochen statt still etwas Kaputtes
       geschrieben, das erst beim Auspacken auffällt. */
    const ZIP_GRENZE = 0xFFFFFFFF;
    /* Die dritte Grenze, und die unauffälligste. Die Anzahl der Einträge steht
       im Schlusssatz des Archivs in **16 Bit** — nicht in 32. Sie lief lange
       ungeprüft mit, weil sie kleiner aussieht als die zwei Byte-Grenzen
       darüber und deshalb nicht wie eine Grenze wirkt.
  
       Ohne Prüfung scheitert sie still: `schreibe16(ende, 8, 70000)` schreibt
       kein 70000, es schreibt 4464 — und 65536 schreibt sogar 0. Das Archiv
       lässt sich danach öffnen und sieht gesund aus; es zeigt nur einen
       Bruchteil seines Inhalts. Wer 70 000 Anhänge sichert, bekommt eine
       Datei, die wie eine vollständige Sicherung aussieht, und merkt es an
       dem Tag, an dem er sie braucht.
  
       Die zwei Grenzen darüber haben ihre Prüfung seit jeher. Diese hatte
       keine — wieder derselbe Befund: nicht etwas vergessen, sondern etwas an
       einer Stelle getan und an der Nachbarstelle nicht. */
    const ZIP_EINTRAEGE = 65535;
    /**
     * @param dateien [{ name, inhalt }] — inhalt als Zeichenkette, Uint8Array
     *                oder **Blob**. Ein Blob wird nie ganz eingelesen: seine
     *                Prüfsumme entsteht scheibchenweise, und in das Archiv
     *                wandert er als Blob, den der Browser selbst verwaltet.
     * @param {(name:string, anteil:number)=>void} [beiFortschritt]
     * @returns {Promise<Blob>}
     */
    const zipSchreiben = async (dateien, beiFortschritt) => {
        /* Vor dem ersten Byte, nicht danach. Wer 70 000 Anhänge sichert, soll
           die Meldung sofort bekommen und nicht nach zwanzig Minuten Packen. */
        if (dateien.length > ZIP_EINTRAEGE)
            throw new Error('Diese Sicherung hat ' + dateien.length + ' Einträge. Ein ZIP ' +
                'dieser Bauart kann höchstens 65 535 verzeichnen — darüber ' +
                'stünde im Archiv eine falsche Zahl, und es zeigte nur einen ' +
                'Teil seines Inhalts, ohne das zu sagen. Sichere die Anhänge ' +
                'in zwei Schritten, statt ein Archiv zu bekommen, dem man ' +
                'nicht ansieht, dass es unvollständig ist.');
        const enc = new TextEncoder();
        const teile = [];
        const verzeichnis = [];
        let versatz = 0;
        const schreibe32 = (a, i, w) => { a[i] = w & 255; a[i + 1] = (w >>> 8) & 255; a[i + 2] = (w >>> 16) & 255; a[i + 3] = (w >>> 24) & 255; };
        const schreibe16 = (a, i, w) => { a[i] = w & 255; a[i + 1] = (w >>> 8) & 255; };
        for (const d of dateien) {
            const name = enc.encode(d.name);
            const istBlob = typeof Blob !== 'undefined' && d.inhalt instanceof Blob;
            const inhalt = istBlob ? d.inhalt
                : typeof d.inhalt === 'string' ? enc.encode(d.inhalt)
                    : d.inhalt;
            const laenge = istBlob ? inhalt.size : inhalt.length;
            if (laenge > ZIP_GRENZE)
                throw new Error('„' + d.name + '" ist grösser als 4 GB. Ein ZIP dieser ' +
                    'Bauart kann das nicht — die Datei bleibt lieber aussen ' +
                    'vor, als in einem Archiv zu stehen, das sich nicht ' +
                    'öffnen lässt.');
            const summe = istBlob
                ? await crc32Strom(inhalt, (a) => beiFortschritt && beiFortschritt(d.name, a))
                : crc32(inhalt);
            const kopf = new Uint8Array(30 + name.length);
            schreibe32(kopf, 0, 0x04034b50);
            schreibe16(kopf, 4, 20); /* benötigte Fassung */
            schreibe16(kopf, 6, 0); /* Flags             */
            schreibe16(kopf, 8, 0); /* Methode: gespeichert */
            schreibe16(kopf, 10, 0); /* Uhrzeit           */
            schreibe16(kopf, 12, 0x21); /* Datum: 1. Jan 1980 */
            schreibe32(kopf, 14, summe);
            schreibe32(kopf, 18, laenge);
            schreibe32(kopf, 22, laenge);
            schreibe16(kopf, 26, name.length);
            schreibe16(kopf, 28, 0);
            kopf.set(name, 30);
            teile.push(kopf, inhalt);
            const eintrag = new Uint8Array(46 + name.length);
            schreibe32(eintrag, 0, 0x02014b50);
            schreibe16(eintrag, 4, 20);
            schreibe16(eintrag, 6, 20);
            schreibe16(eintrag, 8, 0);
            schreibe16(eintrag, 10, 0);
            schreibe16(eintrag, 12, 0);
            schreibe16(eintrag, 14, 0x21);
            schreibe32(eintrag, 16, summe);
            schreibe32(eintrag, 20, laenge);
            schreibe32(eintrag, 24, laenge);
            schreibe16(eintrag, 28, name.length);
            schreibe32(eintrag, 42, versatz);
            eintrag.set(name, 46);
            verzeichnis.push(eintrag);
            versatz += kopf.length + laenge;
            if (versatz > ZIP_GRENZE)
                throw new Error('Diese Sicherung wird grösser als 4 GB. Ein ZIP dieser ' +
                    'Bauart kann das nicht. Sichere die Anhänge in zwei ' +
                    'Schritten, statt ein Archiv zu bekommen, das sich ' +
                    'nicht öffnen lässt.');
        }
        const vzGroesse = verzeichnis.reduce((n, e) => n + e.length, 0);
        const ende = new Uint8Array(22);
        schreibe32(ende, 0, 0x06054b50);
        schreibe16(ende, 8, dateien.length);
        schreibe16(ende, 10, dateien.length);
        schreibe32(ende, 12, vzGroesse);
        schreibe32(ende, 16, versatz);
        return new Blob([...teile, ...verzeichnis, ende], { type: 'application/zip' });
    };
    const laden = (blob, name) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    };
    /* ========================================================================
     * 2. WORD SCHREIBEN
     * ======================================================================*/
    const W_STIL = {
        h1: 'Heading1', h2: 'Heading2', h3: 'Heading3',
        'toggle-h1': 'Heading1', 'toggle-h2': 'Heading2', 'toggle-h3': 'Heading3',
        quote: 'Quote', code: 'Code'
    };
    /** Ein Absatz in Word-XML. */
    const wAbsatz = (text, stil, aufzaehlung) => '<w:p>' +
        '<w:pPr>' +
        (stil ? `<w:pStyle w:val="${stil}"/>` : '') +
        (aufzaehlung ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') +
        '</w:pPr>' +
        (text ? `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r>` : '') +
        '</w:p>';
    const wTabelle = (zeilen) => '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>' +
        '<w:tblW w:w="5000" w:type="pct"/><w:tblBorders>' +
        ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:color="CCCCCC"/>`).join('') +
        '</w:tblBorders></w:tblPr>' +
        zeilen.map((z, i) => '<w:tr>' + z.map((c) => '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>' +
            `<w:p><w:pPr>${i === 0 ? '<w:rPr><w:b/></w:rPr>' : ''}</w:pPr>` +
            `<w:r>${i === 0 ? '<w:rPr><w:b/></w:rPr>' : ''}` +
            `<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join('') +
            '</w:tr>').join('') +
        '</w:tbl>';
    /** Alle Blöcke einer Seite als Word-Inhalt. */
    const wortInhalt = (seite) => {
        const raus = [];
        const lauf = (id, tiefe) => {
            Store.childrenOf(id).forEach((b) => {
                const t = b.text || '';
                if (b.type === 'database' && b.collectionId) {
                    const c = Store.getCollection(b.collectionId);
                    if (c) {
                        const keys = Object.keys(c.schema);
                        const kopf = keys.map(k => c.schema[k].name);
                        const zeilen = Store.rowsOf(c.id).filter((r) => !r.archiviert).map((r) => keys.map(k => {
                            const v = Datenbank.wert(r, k, c);
                            return Array.isArray(v) ? v.map(x => (x && x.name) || x).join(', ')
                                : Formula.anzeige(v);
                        }));
                        raus.push(wAbsatz(c.name || 'Datenbank', 'Heading2'));
                        raus.push(wTabelle([kopf, ...zeilen]));
                    }
                    return;
                }
                if (b.type === 'table' && b.rows) {
                    raus.push(wTabelle(b.rows));
                    return;
                }
                if (b.type === 'divider') {
                    raus.push(wAbsatz('', null));
                    return;
                }
                if (b.type === 'image') {
                    raus.push(wAbsatz('[Bild' + (b.caption ? ': ' + b.caption : '') + ']', null));
                    return;
                }
                const stil = W_STIL[b.type] || null;
                const punkt = ['bullet', 'todo', 'number'].includes(b.type);
                const vorne = b.type === 'todo' ? (b.checked ? '☑ ' : '☐ ')
                    : b.type === 'number' ? '' : '';
                raus.push(wAbsatz('  '.repeat(tiefe) + vorne + t, stil, punkt));
                if (Store.childrenOf(b.id).length)
                    lauf(b.id, tiefe + 1);
            });
        };
        lauf(seite.id, 0);
        return raus.join('');
    };
    const alsWord = async (seite) => {
        const inhalt = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:body>' +
            wAbsatz(seite.text || 'Ohne Titel', 'Title') +
            wortInhalt(seite) +
            '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
            '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>' +
            '</w:body></w:document>';
        const stile = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:docDefaults><w:rPrDefault><w:rPr>' +
            '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/>' +
            '</w:rPr></w:rPrDefault></w:docDefaults>' +
            [['Title', 'Titel', 56, true], ['Heading1', 'Überschrift 1', 36, true],
                ['Heading2', 'Überschrift 2', 30, true], ['Heading3', 'Überschrift 3', 26, true],
                ['Quote', 'Zitat', 22, false], ['Code', 'Code', 20, false]].map(([id, name, gr, fett]) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/>` +
                '<w:pPr><w:spacing w:before="180" w:after="90"/>' +
                (id === 'Quote' ? '<w:ind w:left="454"/>' : '') + '</w:pPr>' +
                `<w:rPr>${fett ? '<w:b/>' : ''}<w:sz w:val="${gr}"/>` +
                (id === 'Code' ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>' : '') +
                (id === 'Quote' ? '<w:i/><w:color w:val="666666"/>' : '') +
                '</w:rPr></w:style>').join('') +
            '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>' +
            '</w:styles>';
        const nummern = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0">' +
            '<w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>' +
            '<w:pPr><w:ind w:left="454" w:hanging="284"/></w:pPr>' +
            '</w:lvl></w:abstractNum>' +
            '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';
        const dateien = [
            { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                    '<Default Extension="xml" ContentType="application/xml"/>' +
                    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
                    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
                    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
                    '</Types>' },
            { name: '_rels/.rels', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
                    '</Relationships>' },
            { name: 'word/_rels/document.xml.rels', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
                    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
                    '</Relationships>' },
            { name: 'word/document.xml', inhalt },
            { name: 'word/styles.xml', inhalt: stile },
            { name: 'word/numbering.xml', inhalt: nummern }
        ];
        const blob = await zipSchreiben(dateien);
        laden(blob, (seite.text || 'Seite').replace(/[\\/:*?"<>|]/g, '-') + '.docx');
        return blob;
    };
    /* ========================================================================
     * 3. EXCEL SCHREIBEN
     * ======================================================================*/
    const spaltenName = (n) => {
        let s = '';
        n++;
        while (n > 0) {
            const r = (n - 1) % 26;
            s = String.fromCharCode(65 + r) + s;
            n = Math.floor((n - 1) / 26);
        }
        return s;
    };
    /** Eine Tabelle als Blatt-XML. Zahlen bleiben Zahlen. */
    const blattXml = (zeilen) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetData>' +
        zeilen.map((z, r) => `<row r="${r + 1}">` + z.map((c, s) => {
            const bezug = spaltenName(s) + (r + 1);
            const zahl = c !== '' && c !== null && c !== undefined && !isNaN(Number(String(c).replace(',', '.')));
            if (r > 0 && zahl)
                return `<c r="${bezug}"><v>${Number(String(c).replace(',', '.'))}</v></c>`;
            return `<c r="${bezug}" t="inlineStr"${r === 0 ? ' s="1"' : ''}>` +
                `<is><t xml:space="preserve">${esc(c)}</t></is></c>`;
        }).join('') + '</row>').join('') +
        '</sheetData></worksheet>';
    /**
     * @param blaetter [{ name, zeilen }]
     */
    /* ==========================================================================
     * ODS SCHREIBEN
     * --------------------------------------------------------------------------
     * Die Gegenrichtung zu `odsLesen`. Vier Dateien reichen für ein ODS, das
     * LibreOffice, OpenOffice, Excel und Google Sheets öffnen:
     *
     *   mimetype              muss ZUERST im Archiv stehen und UNKOMPRIMIERT
     *   META-INF/manifest.xml das Verzeichnis
     *   content.xml           die Tabellen
     *   styles.xml            leer, aber verlangt
     *
     * DIE ERSTE ZEILE IST EINE FALLE. Die Norm verlangt, dass `mimetype` der
     * erste Eintrag ist und ohne Kompression gespeichert wird — daran erkennen
     * manche Programme das Format, noch bevor sie das Verzeichnis lesen. Der
     * ZIP-Schreiber hier legt ohnehin alles „gespeichert" ab, damit ist die
     * zweite Hälfte erfüllt; die erste erledigt die Reihenfolge unten.
     *
     * ZAHLEN BLEIBEN ZAHLEN. Eine Zelle bekommt `office:value-type="float"`
     * samt `office:value`, wenn der Wert eine Zahl ist. Ohne das steht in
     * LibreOffice überall Text, die Summe ist 0 und Sortieren sortiert
     * alphabetisch — `100` vor `20`. Das war beim CSV-Import derselbe Fehler.
     * ========================================================================*/
    const odsZelle = (w) => {
        const leer = w === null || w === undefined || w === '';
        if (leer)
            return '<table:table-cell/>';
        const zahl = typeof w === 'number' ? w
            : (typeof w === 'string' && w.trim() !== '' && Number.isFinite(Number(w))
                ? Number(w) : null);
        if (zahl !== null)
            return `<table:table-cell office:value-type="float" office:value="${zahl}">` +
                `<text:p>${esc(String(w))}</text:p></table:table-cell>`;
        return '<table:table-cell office:value-type="string">' +
            String(w).split('\n').map(z => `<text:p>${esc(z)}</text:p>`).join('') +
            '</table:table-cell>';
    };
    const odsBlatt = (b) => {
        const zeilen = b.zeilen || [];
        const breite = zeilen.reduce((m, z) => Math.max(m, (z || []).length), 0);
        return `<table:table table:name="${esc(String(b.name || 'Blatt'))}">` +
            `<table:table-column table:number-columns-repeated="${Math.max(1, breite)}"/>` +
            zeilen.map(z => '<table:table-row>' +
                Array.from({ length: breite }, (_, i) => odsZelle((z || [])[i])).join('') +
                '</table:table-row>').join('') +
            '</table:table>';
    };
    const alsOds = async (blaetter, dateiname) => {
        const NS = ' xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"' +
            ' xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"' +
            ' xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"';
        const dateien = [
            /* ZUERST und unkomprimiert — siehe oben. */
            { name: 'mimetype', inhalt: 'application/vnd.oasis.opendocument.spreadsheet' },
            { name: 'META-INF/manifest.xml', inhalt: '<?xml version="1.0" encoding="UTF-8"?>' +
                    '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" ' +
                    'manifest:version="1.2">' +
                    '<manifest:file-entry manifest:full-path="/" ' +
                    'manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>' +
                    '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
                    '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>' +
                    '</manifest:manifest>' },
            { name: 'styles.xml', inhalt: '<?xml version="1.0" encoding="UTF-8"?>' +
                    `<office:document-styles${NS} office:version="1.2"/>` },
            { name: 'content.xml', inhalt: '<?xml version="1.0" encoding="UTF-8"?>' +
                    `<office:document-content${NS} office:version="1.2">` +
                    '<office:body><office:spreadsheet>' +
                    (blaetter || []).map((b) => odsBlatt(b)).join('') +
                    '</office:spreadsheet></office:body></office:document-content>' }
        ];
        const blob = await zipSchreiben(dateien);
        laden(blob, (dateiname || 'Redion') + '.ods');
        return blob;
    };
    /**
     * Eine Datenbank als ODS — ein Blatt je Ansicht, wie bei Excel.
     *
     * DIE ZELLEN WERDEN GENAUSO GELESEN WIE DORT. Der erste Versuch hatte
     * hier `Werkzeuge.zelleAlsText` stehen — eine Funktion, die es nicht
     * gibt. Der Übersetzer hat es gemeldet, bevor irgendetwas lief; ohne ihn
     * wäre jede Zelle „undefined" gewesen und die Datei sähe trotzdem
     * vollständig aus.
     */
    const datenbankAlsOds = (coll) => {
        const ansichten = Object.values(Store.cache.views).filter(v => v.collectionId === coll.id);
        const keys = Object.keys(coll.schema);
        const kopf = keys.map(k => coll.schema[k].name);
        const zeilenVon = (view) => {
            const rows = view ? Datenbank.zeilen(coll, view) : Store.rowsOf(coll.id);
            return rows.map((r) => keys.map(k => {
                const v = Datenbank.wert(r, k, coll);
                if (Array.isArray(v))
                    return v.map(x => (x && x.name) || x).join(', ');
                if (v instanceof Date)
                    return v.toISOString().slice(0, 10);
                return v === null || v === undefined ? '' : String(Formula.anzeige(v));
            }));
        };
        const blaetter = ansichten.length
            ? ansichten.map(v => ({ name: v.name || 'Ansicht', zeilen: [kopf, ...zeilenVon(v)] }))
            : [{ name: coll.name, zeilen: [kopf, ...zeilenVon(null)] }];
        return alsOds(blaetter, (coll.name || 'Datenbank').replace(/[\\/:*?"<>|]/g, '-'));
    };
    const alsExcel = async (blaetter, dateiname) => {
        const sicher = (n, i) => String(n || ('Blatt' + (i + 1)))
            .replace(/[\\/:*?[\]]/g, ' ').slice(0, 31) || ('Blatt' + (i + 1));
        const dateien = [
            { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                    '<Default Extension="xml" ContentType="application/xml"/>' +
                    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
                    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
                    blaetter.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
                        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
                    '</Types>' },
            { name: '_rels/.rels', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
                    '</Relationships>' },
            { name: 'xl/workbook.xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
                    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
                    blaetter.map((b, i) => `<sheet name="${esc(sicher(b.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
                    '</sheets></workbook>' },
            { name: 'xl/_rels/workbook.xml.rels', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    blaetter.map((_, i) => `<Relationship Id="rId${i + 1}" ` +
                        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
                        `Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
                    `<Relationship Id="rId${blaetter.length + 1}" ` +
                    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" ' +
                    'Target="styles.xml"/>' +
                    '</Relationships>' },
            { name: 'xl/styles.xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
                    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
                    '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
                    '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
                    '<borders count="1"><border/></borders>' +
                    '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
                    '<cellXfs count="2"><xf xfId="0"/><xf fontId="1" applyFont="1" xfId="0"/></cellXfs>' +
                    '</styleSheet>' }
        ].concat(blaetter.map((b, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, inhalt: blattXml(b.zeilen) })));
        const blob = await zipSchreiben(dateien);
        laden(blob, (dateiname || 'Redion') + '.xlsx');
        return blob;
    };
    /** Eine Datenbank als Excel-Mappe: ein Blatt je Ansicht. */
    const datenbankAlsExcel = (coll) => {
        const ansichten = Object.values(Store.cache.views).filter(v => v.collectionId === coll.id);
        const keys = Object.keys(coll.schema);
        const kopf = keys.map(k => coll.schema[k].name);
        const zeilenVon = (view) => {
            const rows = view ? Datenbank.zeilen(coll, view) : Store.rowsOf(coll.id);
            return rows.map((r) => keys.map(k => {
                const v = Datenbank.wert(r, k, coll);
                if (Array.isArray(v))
                    return v.map(x => (x && x.name) || x).join(', ');
                if (v instanceof Date)
                    return v.toISOString().slice(0, 10);
                return v === null || v === undefined ? '' : String(Formula.anzeige(v));
            }));
        };
        const blaetter = ansichten.length
            ? ansichten.map(v => ({ name: v.name || 'Ansicht', zeilen: [kopf, ...zeilenVon(v)] }))
            : [{ name: coll.name, zeilen: [kopf, ...zeilenVon(null)] }];
        return alsExcel(blaetter, (coll.name || 'Datenbank').replace(/[\\/:*?"<>|]/g, '-'));
    };
    /** Alle Datenbanken auf einmal — ein Blatt je Datenbank. */
    const allesAlsExcel = () => {
        const dbs = Object.values(Store.cache.collections);
        if (!dbs.length) {
            UI.toast('Es gibt noch keine Datenbank');
            return null;
        }
        const blaetter = dbs.map(c => {
            const keys = Object.keys(c.schema);
            return { name: c.name || 'Datenbank',
                zeilen: [keys.map(k => c.schema[k].name),
                    ...Store.rowsOf(c.id).map((r) => keys.map(k => {
                        const v = Datenbank.wert(r, k, c);
                        return Array.isArray(v) ? v.map(x => (x && x.name) || x).join(', ')
                            : String(Formula.anzeige(v) ?? '');
                    }))] };
        });
        return alsExcel(blaetter, 'Redion-Datenbanken');
    };
    /* ========================================================================
     * 4. EINLESEN
     * ======================================================================*/
    /* --- Trello ------------------------------------------------------------
     * Der JSON-Export eines Boards: lists sind die Spalten, cards die Karten,
     * labels werden zu einer Mehrfachauswahl.
     * --------------------------------------------------------------------- */
    const ausTrello = (text, zielSeite) => {
        const d = JSON.parse(text);
        if (!d || !Array.isArray(d.cards))
            throw new Error('Das sieht nicht nach einem Trello-Export aus');
        const listen = new Map((d.lists || []).map((l) => [l.id, l.name]));
        const farben = { green: 'green', yellow: 'yellow', orange: 'orange', red: 'red',
            purple: 'purple', blue: 'blue', sky: 'blue', lime: 'green',
            pink: 'pink', black: 'gray' };
        const labels = [...new Map((d.labels || []).map((l) => [l.name || l.color, { name: l.name || l.color, color: farben[l.color] || 'gray' }])).values()];
        const seite = Store.addBlock(zielSeite || null, 'page', { text: d.name || 'Trello-Board' });
        const db = Store.addDatabase(seite.id, d.name || 'Karten', {
            title: { name: 'Karte', type: 'title' },
            liste: { name: 'Liste', type: 'status',
                options: [...listen.values()].map((n, i) => ({ name: n, color: ['gray', 'blue', 'green', 'orange', 'purple'][i % 5] })) },
            labels: { name: 'Etiketten', type: 'multi', options: labels },
            faellig: { name: 'Fällig', type: 'date' },
            fertig: { name: 'Erledigt', type: 'checkbox' },
            link: { name: 'Trello', type: 'url' }
        }, 'board');
        const coll = Store.getCollection(db.collectionId);
        Store.updateView(db.viewId, { groupBy: 'liste' });
        let n = 0;
        (d.cards || []).forEach((c) => {
            if (c.closed)
                return;
            const zeile = Store.addRow(coll.id, {
                title: c.name || 'Ohne Titel',
                liste: listen.get(c.idList) || '',
                labels: (c.labels || []).map((l) => l.name || l.color),
                faellig: c.due ? String(c.due).slice(0, 10) : '',
                fertig: !!c.dueComplete,
                link: c.shortUrl || ''
            });
            n++;
            /* Beschreibung und Checklisten kommen in die Zeilenseite */
            if (c.desc)
                Werkzeuge.ausMarkdown(zeile, c.desc);
            const punkte = (d.checklists || []).filter((cl) => cl.idCard === c.id);
            punkte.forEach((cl) => {
                Store.addBlock(zeile.id, 'h3', { text: cl.name || 'Checkliste' });
                (cl.checkItems || []).sort((a, b) => (a.pos || 0) - (b.pos || 0)).forEach((it) => Store.addBlock(zeile.id, 'todo', { text: it.name, checked: it.state === 'complete' }));
            });
        });
        return { seite, hinweis: n + ' Karten aus ' + listen.size + ' Listen übernommen' };
    };
    /* --- Evernote (.enex) --------------------------------------------------
     * Eine XML-Datei mit <note>-Einträgen. Der Inhalt steckt in ENML, das
     * nah genug an HTML ist, um es über den HTML-Weg einzulesen.
     * --------------------------------------------------------------------- */
    const ausEvernote = (text, zielSeite) => {
        const doc = new DOMParser().parseFromString(text, 'application/xml');
        const notizen = [...doc.querySelectorAll('note')];
        if (!notizen.length)
            throw new Error('Keine Notizen in dieser Datei gefunden');
        const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Evernote' });
        notizen.forEach(n => {
            const titel = (n.querySelector('title') || {}).textContent || 'Ohne Titel';
            const inhalt = (n.querySelector('content') || {}).textContent || '';
            const seite = Store.addBlock(wurzel.id, 'page', { text: titel });
            /* ENML in einfachen Text mit Absätzen verwandeln */
            const roh = new DOMParser().parseFromString(inhalt, 'text/html');
            const md = [...roh.body.querySelectorAll('div, p, li, h1, h2, h3')]
                .map(el => {
                const t = el.textContent.trim();
                if (!t)
                    return '';
                if (el.tagName === 'H1')
                    return '# ' + t;
                if (el.tagName === 'H2')
                    return '## ' + t;
                if (el.tagName === 'H3')
                    return '### ' + t;
                if (el.tagName === 'LI')
                    return '- ' + t;
                return t;
            }).filter(Boolean).join('\n\n');
            if (md)
                Werkzeuge.ausMarkdown(seite, md);
            const tags = [...n.querySelectorAll('tag')].map(t => t.textContent);
            if (tags.length)
                Store.updateBlock(seite.id, { tags });
        });
        Store.updateBlock(wurzel.id, { aufgeklappt: true });
        return { seite: wurzel, hinweis: notizen.length + ' Notizen übernommen' };
    };
    /* --- Obsidian / Markdown-Ordner ---------------------------------------
     * Mehrere .md-Dateien auf einmal. Ordner werden zu Unterseiten, und
     * [[Wikilinks]] werden danach zu echten Verweisen aufgelöst.
     * --------------------------------------------------------------------- */
    const ausMarkdownOrdner = async (dateien, zielSeite) => {
        const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Obsidian' });
        const ordner = new Map([['', wurzel.id]]);
        const nachName = new Map();
        /* Der Pfad ist ein Text wie „Notizen/2026/Mai", nicht eine Liste. Er
           legt jede Ebene an, die noch fehlt, und merkt sie sich. */
        const ordnerFuer = (pfad) => {
            const da = ordner.get(pfad);
            if (da !== undefined)
                return da;
            const teile = pfad.split('/');
            const name = teile.pop() ?? 'Ordner';
            const eltern = ordnerFuer(teile.join('/'));
            const s = Store.addBlock(eltern, 'page', { text: name, icon: '📁' });
            ordner.set(pfad, s.id);
            return s.id;
        };
        for (const f of dateien) {
            const pfad = (f.webkitRelativePath || f.name).replace(/^[^/]*\//, '');
            if (!/\.(md|markdown|txt)$/i.test(pfad))
                continue;
            const teile = pfad.split('/');
            const datei = teile.pop();
            const eltern = ordnerFuer(teile.join('/'));
            const titel = datei.replace(/\.(md|markdown|txt)$/i, '');
            const seite = Store.addBlock(eltern, 'page', { text: titel });
            const text = await f.text();
            Werkzeuge.ausMarkdown(seite, text);
            nachName.set(titel.toLowerCase(), seite.id);
        }
        /* [[Wikilinks]] auflösen — erst jetzt, wenn alle Seiten da sind. */
        let verweise = 0;
        const aufloesen = (id) => {
            Store.childrenOf(id).forEach((b) => {
                if (b.text && /\[\[[^\]]+\]\]/.test(b.text)) {
                    const neu = b.text.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (ganz, ziel, text2) => {
                        const zid = nachName.get(String(ziel).trim().toLowerCase());
                        if (!zid)
                            return ganz;
                        verweise++;
                        return `[${(text2 || '').slice(1) || ziel}](#${zid})`;
                    });
                    if (neu !== b.text)
                        Store.updateBlock(b.id, { text: neu });
                }
                aufloesen(b.id);
            });
        };
        aufloesen(wurzel.id);
        Store.updateBlock(wurzel.id, { aufgeklappt: true });
        return { seite: wurzel,
            hinweis: nachName.size + ' Notizen, ' + (ordner.size - 1) + ' Ordner, ' +
                verweise + ' Wikilinks aufgelöst' };
    };
    /* --- Notion-Export (ZIP) -----------------------------------------------
     * Notions eigener Export: Markdown-Dateien und CSV-Dateien, die Ordner
     * bilden die Seitenhierarchie. Die langen IDs im Dateinamen fliegen raus.
     * --------------------------------------------------------------------- */
    const ausNotionZip = async (puffer, zielSeite) => {
        const zip = await Einlesen.zipLesen(puffer);
        const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Notion' });
        const ordner = new Map([['', wurzel.id]]);
        const saeubern = (n) => String(n).replace(/\s+[0-9a-f]{32}(?=$|\.)/i, '').trim();
        /* Wie oben: der Pfad ist ein Text, keine Liste. */
        const ordnerFuer = (pfad) => {
            const da = ordner.get(pfad);
            if (da !== undefined)
                return da;
            const teile = pfad.split('/');
            const name = saeubern(teile.pop() ?? 'Ordner');
            const eltern = ordnerFuer(teile.join('/'));
            const s = Store.addBlock(eltern, 'page', { text: name });
            ordner.set(pfad, s.id);
            return s.id;
        };
        let seiten = 0, tabellen = 0, jsonWerte = 0, formeln = 0;
        for (const name of zip.namen) {
            if (name.endsWith('/'))
                continue;
            const teile = name.split('/');
            const datei = teile.pop();
            const eltern = ordnerFuer(teile.join('/'));
            if (/\.md$/i.test(datei)) {
                const text = await zip.text(name);
                const s = Store.addBlock(eltern, 'page', { text: saeubern(datei.replace(/\.md$/i, '')) });
                /* Notion setzt den Titel als erste Zeile mit # — die fliegt raus. */
                Werkzeuge.ausMarkdown(s, text.replace(/^#\s+.*\n+/, ''));
                seiten++;
            }
            else if (/\.csv$/i.test(datei)) {
                const text = await zip.text(name);
                const s = Store.addBlock(eltern, 'page', { text: saeubern(datei.replace(/\.csv$/i, '')) });
                Einlesen.alsDatenbank(s.id, saeubern(datei.replace(/\.csv$/i, '')), Datenbank.csvZerlegen(text));
                tabellen++;
            }
            else if (/\.json$/i.test(datei)) {
                /* --- Notions Rohform ------------------------------------------
                 * Wer den Export über die API zieht, bekommt JSON statt CSV: dort
                 * stehen die Werte verschachtelt ([["80"]]) und die Formeln als
                 * Baum. Genau das liest NotionFormat.
                 * ------------------------------------------------------------- */
                try {
                    const roh = JSON.parse(await zip.text(name));
                    const erg = ausNotionJson(roh, eltern, saeubern(datei.replace(/\.json$/i, '')));
                    jsonWerte += erg.werte;
                    formeln += erg.formeln;
                    tabellen += erg.tabellen;
                }
                catch { /* keine Notion-Struktur — dann eben nicht */ }
            }
        }
        Store.updateBlock(wurzel.id, { aufgeklappt: true });
        return { seite: wurzel,
            hinweis: seiten + ' Seiten und ' + tabellen + ' Tabellen übernommen' +
                (jsonWerte ? ', ' + jsonWerte + ' verschachtelte Werte flachgelegt' : '') +
                (formeln ? ', ' + formeln + ' Formeln übersetzt' : '') };
    };
    /**
     * Eine Notion-Sammlung aus der Rohform.
     * Erwartet { name, schema:{ key:{name,type,formula?} }, rows:[{ props }] }
     * — genau so, wie Notions interne Antwort sie liefert.
     */
    const ausNotionJson = (roh, elternId, ersatzName) => {
        if (!roh || typeof roh !== 'object')
            return { werte: 0, formeln: 0, tabellen: 0 };
        const sammlungen = Array.isArray(roh) ? roh
            : (roh.collections ? Object.values(roh.collections) : [roh]);
        let werte = 0, formeln = 0, tabellen = 0;
        sammlungen.forEach(c => {
            if (!c || !c.schema)
                return;
            const schema = {};
            Object.entries(c.schema).forEach(([k, d]) => {
                const s = { name: (Array.isArray(d.name) ? NotionFormat.wertLesen(d.name) : d.name) || k,
                    type: d.type || 'text' };
                /* Formel als Baum → unser Text */
                if (d.formula) {
                    const t = NotionFormat.formelAusNotion(d.formula);
                    if (t) {
                        s.formula = t;
                        s.type = 'formula';
                        formeln++;
                    }
                }
                if (Array.isArray(d.options))
                    s.options = d.options.map((o) => (o && o.value) || String(o));
                schema[k] = s;
            });
            if (!Object.values(schema).some(s => s.type === 'title')) {
                const ersteKey = Object.keys(schema)[0] || 'title';
                schema[ersteKey] = { ...(schema[ersteKey] || { name: 'Name' }), type: 'title' };
            }
            const name = (Array.isArray(c.name) ? NotionFormat.wertLesen(c.name) : c.name) ||
                ersatzName || 'Aus Notion';
            const seite = Store.addBlock(elternId, 'page', { text: name });
            const db = Store.addDatabase(seite.id, name, schema);
            tabellen++;
            (c.rows || c.entries || []).forEach((r) => {
                const props = NotionFormat.zeileLesen(r.properties || r.props || r, schema);
                werte += Object.keys(props).length;
                const titelKey = Object.keys(schema).find(k => schema[k].type === 'title');
                const zeile = Store.addRow(db.collectionId, props);
                if (titelKey && props[titelKey] !== undefined)
                    Store.updateBlock(zeile.id, { text: String(props[titelKey]) });
            });
        });
        return { werte, formeln, tabellen };
    };
    /* ========================================================================
     * 5. DAS FENSTER
     * ======================================================================*/
    const QUELLEN = [
        ['trello', '📋', 'Trello', 'Das JSON eines Boards — Listen werden Status, Karten Zeilen', '.json'],
        ['evernote', '🐘', 'Evernote', 'Eine .enex-Datei — jede Notiz wird eine Seite', '.enex,.xml'],
        ['obsidian', '🔮', 'Obsidian', 'Ein ganzer Ordner mit .md-Dateien, Wikilinks werden aufgelöst', 'ordner'],
        ['notion', '📓', 'Notion-Export', 'Das ZIP aus Notions eigenem Export', '.zip'],
        ['asana', '🗒', 'Asana / Jira / Monday', 'Der CSV-Export — wird zur Datenbank', '.csv'],
        ['markdown', '📄', 'Einzelne Dateien',
            'Markdown, Text, CSV, Word, Excel, OpenDocument, EPUB',
            '.md,.txt,.csv,.docx,.xlsx,.ods,.epub']
    ];
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(660px,95vw)">' +
                '<div class="fh">⭱ Aus einem anderen Werkzeug übernehmen' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="ax-liste">' + QUELLEN.map(([id, ic, n, t]) => `<button data-q="${id}"><span class="ax-ico">${ic}</span>` +
                `<span class="ax-text"><b>${n}</b><span>${t}</span></span></button>`).join('') + '</div>' +
                '<div class="ax-hinweis">Alles bleibt auf diesem Gerät — die Dateien werden hier ' +
                'gelesen und nirgendwohin geschickt.</div>' +
                '<div class="fbtns"><button data-a="zu">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const q = elVon(e)?.closest('[data-q]');
            if (!q)
                return;
            const art = q.dataset.q;
            const quelle = QUELLEN.find(x => x[0] === art);
            o.remove();
            /* Ohne passende Quelle gibt es nichts zu öffnen. Vorher las die Zeile
               darunter `quelle[4]` ungeprüft. */
            if (!quelle)
                return;
            const inp = document.createElement('input');
            inp.type = 'file';
            if (quelle[4] === 'ordner') {
                inp.webkitdirectory = true;
                inp.multiple = true;
            }
            else {
                inp.accept = quelle[4] ?? '';
                inp.multiple = art === 'markdown';
            }
            inp.addEventListener('change', async () => {
                const dateien = Array.from(inp.files ?? []);
                if (!dateien.length)
                    return;
                UI.toast('Wird eingelesen …');
                try {
                    let erg = null;
                    const erste = dateien[0];
                    if (!erste)
                        return;
                    if (art === 'obsidian')
                        erg = await ausMarkdownOrdner(dateien, null);
                    else if (art === 'trello')
                        erg = ausTrello(await erste.text(), null);
                    else if (art === 'evernote')
                        erg = ausEvernote(await erste.text(), null);
                    else if (art === 'notion')
                        erg = await ausNotionZip(await erste.arrayBuffer(), null);
                    else if (art === 'asana') {
                        const text = await erste.text();
                        const s = Store.addBlock(null, 'page', { text: erste.name.replace(/\.csv$/i, '') });
                        Einlesen.alsDatenbank(s.id, erste.name.replace(/\.csv$/i, ''), Datenbank.csvZerlegen(text));
                        erg = { seite: s, hinweis: 'CSV als Datenbank übernommen' };
                    }
                    else {
                        for (const f of dateien)
                            erg = await Einlesen.datei(f) || erg;
                    }
                    App.zeichneBaum();
                    if (erg && erg.seite)
                        App.oeffne(erg.seite.id);
                    UI.toast('✅ ' + ((erg && erg.hinweis) || 'Eingelesen'));
                }
                catch (err) {
                    UI.toast('⛔ ' + (err instanceof Error ? err.message : String(err)));
                    if (typeof Pflege !== 'undefined')
                        Pflege.fehlerMerken(err, 'Einlesen ' + art);
                }
            });
            inp.click();
        });
    };
    return { zipSchreiben, crc32, laden, alsWord, alsExcel, datenbankAlsExcel,
        allesAlsExcel, alsOds, datenbankAlsOds, odsBlatt, blattXml, spaltenName, wortInhalt,
        ausTrello, ausEvernote, ausMarkdownOrdner, ausNotionZip, ausNotionJson,
        dialog, QUELLEN };
})();
window.Austausch = Austausch;
