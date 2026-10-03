"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/dateien/ausgeben.ts (npm run bauen:ts). */
const Austausch = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const crc32 = (daten) => ZipDetails.crc32(daten instanceof Uint8Array ? daten : new Uint8Array(daten));
    const SCHEIBE = 1024 * 1024;
    const crc32Strom = async (blob, beiFortschritt) => {
        let c = ZipDetails.crc32Start();
        for (let von = 0; von < blob.size; von += SCHEIBE) {
            const bis = Math.min(von + SCHEIBE, blob.size);
            c = ZipDetails.crc32Weiter(c, new Uint8Array(await blob.slice(von, bis).arrayBuffer()));
            if (beiFortschritt)
                beiFortschritt(bis / blob.size);
        }
        return ZipDetails.crc32Fertig(c);
    };
    const ZIP_GRENZE = 0xFFFFFFFF;
    const ZIP_EINTRAEGE = 65535;
    const grenzen = { bytes: ZIP_GRENZE, eintraege: ZIP_EINTRAEGE };
    const zipSchreiben = async (dateien, beiFortschritt) => {
        const enc = new TextEncoder();
        const teile = [];
        const verzeichnis = [];
        let versatz = 0;
        let braucht64 = dateien.length > grenzen.eintraege;
        const schreibe32 = (a, i, w) => { a[i] = w & 255; a[i + 1] = (w >>> 8) & 255; a[i + 2] = (w >>> 16) & 255; a[i + 3] = (w >>> 24) & 255; };
        const schreibe16 = (a, i, w) => { a[i] = w & 255; a[i + 1] = (w >>> 8) & 255; };
        const schreibe64 = (a, i, w) => {
            const unten = w >>> 0;
            const oben = Math.floor(w / 4294967296);
            schreibe32(a, i, unten);
            schreibe32(a, i + 4, oben);
        };
        for (const d of dateien) {
            const name = enc.encode(d.name);
            const durchgereicht = !!d.roh;
            const istBlob = typeof Blob !== 'undefined' &&
                (durchgereicht ? d.roh : d.inhalt) instanceof Blob;
            const inhalt = durchgereicht ? d.roh
                : istBlob ? d.inhalt
                    : typeof d.inhalt === 'string' ? enc.encode(d.inhalt)
                        : d.inhalt;
            const gepackt = istBlob ? inhalt.size : inhalt.length;
            const laenge = durchgereicht ? Number(d.groesse) : gepackt;
            const methode = durchgereicht ? (d.methode | 0) : 0;
            const summe = durchgereicht ? (d.crc >>> 0)
                : istBlob
                    ? await crc32Strom(inhalt, (a) => beiFortschritt && beiFortschritt(d.name, a))
                    : crc32(inhalt);
            const grosseDatei = laenge > grenzen.bytes || gepackt > grenzen.bytes;
            const weitHinten = versatz > grenzen.bytes;
            if (grosseDatei || weitHinten)
                braucht64 = true;
            const lokalExtra = grosseDatei ? 20 : 0;
            const kopf = new Uint8Array(30 + name.length + lokalExtra);
            schreibe32(kopf, 0, 0x04034b50);
            schreibe16(kopf, 4, grosseDatei ? 45 : 20);
            schreibe16(kopf, 6, ZipDetails.UTF8_BIT);
            schreibe16(kopf, 8, methode);
            schreibe16(kopf, 10, 0);
            schreibe16(kopf, 12, 0x21);
            schreibe32(kopf, 14, summe);
            schreibe32(kopf, 18, grosseDatei ? ZIP_GRENZE : gepackt);
            schreibe32(kopf, 22, grosseDatei ? ZIP_GRENZE : laenge);
            schreibe16(kopf, 26, name.length);
            schreibe16(kopf, 28, lokalExtra);
            kopf.set(name, 30);
            if (grosseDatei) {
                const e = 30 + name.length;
                schreibe16(kopf, e, 0x0001);
                schreibe16(kopf, e + 2, 16);
                schreibe64(kopf, e + 4, laenge);
                schreibe64(kopf, e + 12, gepackt);
            }
            teile.push(kopf, inhalt);
            const zusatz = [];
            if (grosseDatei) {
                zusatz.push(laenge, gepackt);
            }
            if (weitHinten) {
                zusatz.push(versatz);
            }
            const vzExtra = zusatz.length ? 4 + 8 * zusatz.length : 0;
            const eintrag = new Uint8Array(46 + name.length + vzExtra);
            schreibe32(eintrag, 0, 0x02014b50);
            schreibe16(eintrag, 4, 20);
            schreibe16(eintrag, 6, (grosseDatei || weitHinten) ? 45 : 20);
            schreibe16(eintrag, 8, ZipDetails.UTF8_BIT);
            schreibe16(eintrag, 10, methode);
            schreibe16(eintrag, 12, 0);
            schreibe16(eintrag, 14, 0x21);
            schreibe32(eintrag, 16, summe);
            schreibe32(eintrag, 20, grosseDatei ? ZIP_GRENZE : gepackt);
            schreibe32(eintrag, 24, grosseDatei ? ZIP_GRENZE : laenge);
            schreibe16(eintrag, 28, name.length);
            schreibe16(eintrag, 30, vzExtra);
            schreibe32(eintrag, 42, weitHinten ? ZIP_GRENZE : versatz);
            eintrag.set(name, 46);
            if (vzExtra) {
                const e = 46 + name.length;
                schreibe16(eintrag, e, 0x0001);
                schreibe16(eintrag, e + 2, 8 * zusatz.length);
                zusatz.forEach((w, k) => schreibe64(eintrag, e + 4 + 8 * k, w));
            }
            verzeichnis.push(eintrag);
            versatz += kopf.length + gepackt;
        }
        const vzGroesse = verzeichnis.reduce((n, e) => n + e.length, 0);
        if (versatz > grenzen.bytes || vzGroesse > grenzen.bytes)
            braucht64 = true;
        const schluss = [];
        if (braucht64) {
            const z64 = new Uint8Array(56);
            schreibe32(z64, 0, 0x06064b50);
            schreibe64(z64, 4, 44);
            schreibe16(z64, 12, 45);
            schreibe16(z64, 14, 45);
            schreibe32(z64, 16, 0);
            schreibe32(z64, 20, 0);
            schreibe64(z64, 24, dateien.length);
            schreibe64(z64, 32, dateien.length);
            schreibe64(z64, 40, vzGroesse);
            schreibe64(z64, 48, versatz);
            schluss.push(z64);
            const weg = new Uint8Array(20);
            schreibe32(weg, 0, 0x07064b50);
            schreibe32(weg, 4, 0);
            schreibe64(weg, 8, versatz + vzGroesse);
            schreibe32(weg, 16, 1);
            schluss.push(weg);
        }
        const ende = new Uint8Array(22);
        schreibe32(ende, 0, 0x06054b50);
        schreibe16(ende, 8, Math.min(dateien.length, 0xFFFF));
        schreibe16(ende, 10, Math.min(dateien.length, 0xFFFF));
        schreibe32(ende, 12, Math.min(vzGroesse, ZIP_GRENZE));
        schreibe32(ende, 16, Math.min(versatz, ZIP_GRENZE));
        return new Blob([...teile, ...verzeichnis, ...schluss, ende], { type: 'application/zip' });
    };
    const laden = (blob, name) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    };
    const W_STIL = {
        h1: 'Heading1', h2: 'Heading2', h3: 'Heading3',
        'toggle-h1': 'Heading1', 'toggle-h2': 'Heading2', 'toggle-h3': 'Heading3',
        quote: 'Quote', code: 'Code'
    };
    const wLauf = (l) => {
        const eig = (l.fett ? '<w:b/>' : '') +
            (l.kursiv ? '<w:i/>' : '') +
            (l.durch ? '<w:strike/>' : '') +
            (l.code ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>' : '');
        return '<w:r>' + (eig ? `<w:rPr>${eig}</w:rPr>` : '') +
            `<w:t xml:space="preserve">${esc(l.text)}</w:t></w:r>`;
    };
    const wAbsatz = (text, stil, aufzaehlung) => '<w:p>' +
        '<w:pPr>' +
        (stil ? `<w:pStyle w:val="${stil}"/>` : '') +
        (aufzaehlung ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') +
        '</w:pPr>' +
        (text ? Inline.lesen(text).map(wLauf).join('') : '') +
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
    const WORT_BILDTYPEN = {
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
        'image/bmp': 'bmp', 'image/tiff': 'tiff'
    };
    const WORT_BREITE_EMU = 5715000;
    const EMU_JE_PIXEL = 9525;
    const bildMasse = async (blob) => {
        const f = globalThis.createImageBitmap;
        if (typeof f !== 'function')
            return null;
        try {
            const bm = await f(blob);
            const b = Number(bm.width), h = Number(bm.height);
            if (bm.close)
                bm.close();
            if (!(b > 0 && h > 0))
                return null;
            return { b, h };
        }
        catch {
            return null;
        }
    };
    const ausDatenUrl = (roh) => {
        const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(String(roh || ''));
        if (!m)
            return null;
        const typ = String(m[1] || '').toLowerCase();
        try {
            const roh2 = m[2] ? atob(String(m[3] || '')) : decodeURIComponent(String(m[3] || ''));
            const bytes = new Uint8Array(roh2.length);
            for (let i = 0; i < roh2.length; i++)
                bytes[i] = roh2.charCodeAt(i);
            return { bytes, typ };
        }
        catch {
            return null;
        }
    };
    const wortBilder = async (seite) => {
        const raus = new Map();
        const bloecke = [];
        const lauf = (id) => {
            Store.childrenOf(id).forEach((b) => {
                if (b.type === 'image' || b.type === 'schaltplan')
                    bloecke.push(b);
                if (Store.childrenOf(b.id).length)
                    lauf(b.id);
            });
        };
        lauf(seite.id);
        for (const b of bloecke) {
            const eigenSvg = blockAlsSvg(b);
            if (eigenSvg) {
                const gerastert = await svgAlsPng(eigenSvg);
                if (gerastert)
                    raus.set(b.id, gerastert);
                continue;
            }
            if (b.type === 'schaltplan')
                continue;
            let blob = null;
            let typ = '';
            if (b.dateiId && typeof Dateien !== 'undefined' && Dateien.alsBlob) {
                try {
                    blob = await Dateien.alsBlob(b.dateiId);
                }
                catch {
                    blob = null;
                }
                if (blob)
                    typ = String(blob.type || '').toLowerCase();
            }
            if (!blob) {
                const ausUrl = ausDatenUrl(b.src);
                if (ausUrl) {
                    typ = ausUrl.typ;
                    blob = new Blob([ausUrl.bytes], { type: typ });
                }
            }
            if (!blob)
                continue;
            if (typ === 'image/svg+xml') {
                const text = await blob.text();
                const gerastert = await svgAlsPng(text);
                if (gerastert)
                    raus.set(b.id, gerastert);
                continue;
            }
            const endung = WORT_BILDTYPEN[typ];
            if (!endung)
                continue;
            const masse = await bildMasse(blob);
            if (!masse)
                continue;
            const bytes = new Uint8Array(await blob.arrayBuffer());
            raus.set(b.id, { bytes, endung, typ, breite: masse.b, hoehe: masse.h });
        }
        return raus;
    };
    const RASTER_FAKTOR = 2;
    const svgMasse = (svg) => {
        const zahl = (roh) => {
            const n = parseFloat(String(roh || ''));
            return Number.isFinite(n) && n > 0 ? n : 0;
        };
        const b1 = zahl((/\swidth="([^"]+)"/.exec(svg) || [])[1]);
        const h1 = zahl((/\sheight="([^"]+)"/.exec(svg) || [])[1]);
        if (b1 && h1)
            return { b: b1, h: h1 };
        const vb = (/viewBox="([^"]+)"/.exec(svg) || [])[1];
        if (vb) {
            const t = vb.trim().split(/[\s,]+/).map(Number);
            if (t.length === 4 && (t[2] ?? 0) > 0 && (t[3] ?? 0) > 0)
                return { b: t[2], h: t[3] };
        }
        return null;
    };
    const svgAlleinstehend = (svg) => {
        let s = svg;
        if (!/<svg[^>]*\sxmlns=/.test(s))
            s = s.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
        s = s.replace(/var\(\s*--[\w-]+\s*,\s*([^()]+?)\s*\)/g, '$1');
        s = s.replace(/var\(\s*--[\w-]+\s*\)/g, '#000000');
        return s;
    };
    const svgAlsPng = async (roh) => {
        const masse = svgMasse(roh);
        if (!masse)
            return null;
        const svg = svgAlleinstehend(roh);
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        try {
            const bild = await new Promise((ok, nein) => {
                const i = new Image();
                i.onload = () => ok(i);
                i.onerror = () => nein(new Error('SVG liess sich nicht laden'));
                i.src = url;
            });
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(masse.b * RASTER_FAKTOR));
            c.height = Math.max(1, Math.round(masse.h * RASTER_FAKTOR));
            const g = c.getContext('2d');
            if (!g)
                return null;
            g.fillStyle = '#ffffff';
            g.fillRect(0, 0, c.width, c.height);
            g.drawImage(bild, 0, 0, c.width, c.height);
            const blob = await new Promise(ok => c.toBlob(b => ok(b), 'image/png'));
            if (!blob)
                return null;
            const bytes = new Uint8Array(await blob.arrayBuffer());
            return { bytes, endung: 'png', typ: 'image/png',
                breite: masse.b, hoehe: masse.h };
        }
        catch {
            return null;
        }
        finally {
            URL.revokeObjectURL(url);
        }
    };
    const blockAlsSvg = (b) => {
        if (!b)
            return '';
        if (b.type === 'schaltplan' && b.plan && typeof Schaltplan !== 'undefined' &&
            Schaltplan.alsSvg) {
            try {
                return String(Schaltplan.alsSvg(b.plan, { raster: false, anschluesse: false, bmk: true }) || '');
            }
            catch {
                return '';
            }
        }
        return '';
    };
    const wortBildGrund = (b) => {
        if (b && b.type === 'schaltplan')
            return b.plan ? 'liess sich nicht zeichnen' : 'noch nichts gezeichnet';
        if (!b || (!b.dateiId && !b.src))
            return 'kein Bild hinterlegt';
        return 'liess sich nicht lesen';
    };
    const wBild = (relId, nr, breite, hoehe, beschriftung) => {
        const cx = Math.min(WORT_BREITE_EMU, Math.round(breite * EMU_JE_PIXEL));
        const cy = Math.max(1, Math.round(cx * (hoehe / breite)));
        const name = esc(beschriftung || ('Bild ' + nr));
        return '<w:p><w:r><w:drawing>' +
            '<wp:inline distT="0" distB="0" distL="0" distR="0" ' +
            'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">' +
            '<wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
            '<wp:docPr id="' + nr + '" name="' + name + '" descr="' + name + '"/>' +
            '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
            '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
            '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
            '<pic:nvPicPr><pic:cNvPr id="' + nr + '" name="' + name + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
            '<pic:blipFill>' +
            '<a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
            'r:embed="' + relId + '"/>' +
            '<a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
            '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
            '</pic:pic></a:graphicData></a:graphic></wp:inline>' +
            '</w:drawing></w:r></w:p>';
    };
    const wortInhalt = (seite, bilder) => {
        const raus = [];
        let bildNr = 0;
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
                if (b.type === 'schaltplan') {
                    const gezeichnet = bilder && bilder.get(b.id);
                    if (gezeichnet) {
                        bildNr++;
                        raus.push(wBild('rIdBild' + bildNr, bildNr + 100, gezeichnet.breite, gezeichnet.hoehe, t || 'Schaltplan'));
                        if (t)
                            raus.push(wAbsatz(t, 'Quote'));
                        return;
                    }
                    raus.push(wAbsatz('[Schaltplan' + (t ? ': ' + t : '') +
                        ' — ' + wortBildGrund(b) + ']', null));
                    return;
                }
                if (b.type === 'image') {
                    const bild = bilder && bilder.get(b.id);
                    if (bild) {
                        bildNr++;
                        raus.push(wBild('rIdBild' + bildNr, bildNr + 100, bild.breite, bild.hoehe, b.caption || ''));
                        if (b.caption)
                            raus.push(wAbsatz(b.caption, 'Quote'));
                        return;
                    }
                    raus.push(wAbsatz('[Bild' + (b.caption ? ': ' + b.caption : '') +
                        ' — ' + wortBildGrund(b) + ']', null));
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
    const dokumentMitText = (xml, bloecke) => {
        const spuren = (bloecke || []).filter((b) => b && b.quelle && Number.isFinite(Number(b.quelle.p)) && typeof b.text === 'string');
        if (!spuren.length)
            return { xml, geschrieben: 0 };
        let doc;
        try {
            doc = new DOMParser().parseFromString(xml, 'application/xml');
            if (doc.getElementsByTagName('parsererror').length)
                return { xml, geschrieben: 0 };
        }
        catch {
            return { xml, geschrieben: 0 };
        }
        const koerper = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
        if (!koerper)
            return { xml, geschrieben: 0 };
        const kinder = Array.from(koerper.children);
        let geschrieben = 0;
        for (const b of spuren) {
            const absatz = kinder[Number(b.quelle.p)];
            if (!absatz || absatz.tagName !== 'w:p')
                continue;
            const stellen = absatz.getElementsByTagName('w:t');
            if (stellen.length !== 1)
                continue;
            const stelle = stellen[0];
            const roh = String(b.text).replace(/\*\*(.+?)\*\*/g, '$1')
                .replace(/\*(.+?)\*/g, '$1')
                .replace(/`(.+?)`/g, '$1');
            if (stelle.textContent === roh)
                continue;
            stelle.textContent = roh;
            if (/^\s|\s$/.test(roh))
                stelle.setAttribute('xml:space', 'preserve');
            geschrieben++;
        }
        if (!geschrieben)
            return { xml, geschrieben: 0 };
        return { xml: new XMLSerializer().serializeToString(doc), geschrieben };
    };
    const originalDokument = async (seite) => {
        if (typeof Dateien === 'undefined' || !Dateien.alsBlob)
            return null;
        let kinder = [];
        try {
            kinder = Store.childrenOf(seite.id) || [];
        }
        catch {
            return null;
        }
        const anhang = kinder.find((k) => k && k.type === 'file' && k.original
            && /\.docx$/i.test(String(k.text || '')));
        if (!anhang || !anhang.dateiId)
            return null;
        try {
            const blob = await Dateien.alsBlob(anhang.dateiId);
            if (!blob)
                return null;
            const leser = await Einlesen.zipLesen(await blob.arrayBuffer());
            if (!leser || !leser.namen?.includes('word/document.xml'))
                return null;
            return { leser, kinder };
        }
        catch {
            return null;
        }
    };
    const alsWord = async (seite) => {
        const originalPaket = await originalDokument(seite);
        if (originalPaket) {
            const bloecke = originalPaket.kinder.filter((k) => k && k.quelle);
            let neuesDokument = '';
            let geschrieben = 0;
            try {
                const alt = await originalPaket.leser.text('word/document.xml');
                const neu = dokumentMitText(String(alt || ''), bloecke);
                if (neu.geschrieben) {
                    neuesDokument = neu.xml;
                    geschrieben = neu.geschrieben;
                }
            }
            catch { }
            const teile = [];
            for (const name of originalPaket.leser.namen) {
                if (name === 'word/document.xml' && neuesDokument) {
                    teile.push({ name, inhalt: neuesDokument });
                    continue;
                }
                const teil = await originalPaket.leser.rohBytes(name);
                if (!teil)
                    continue;
                teile.push({ name, ...teil });
            }
            const blob = await zipSchreiben(teile);
            laden(blob, (seite.text || 'Seite').replace(/[\\/:*?"<>|]/g, '-') + '.docx');
            const hinweis = geschrieben
                ? 'Die Originaldatei ist vollständig erhalten; '
                    + geschrieben + (geschrieben === 1 ? ' Absatz wurde' : ' Absätze wurden')
                    + ' übernommen. Absätze ohne eindeutige Zuordnung stehen unverändert darin.'
                : 'Die Originaldatei ist vollständig erhalten. In Redion geänderte '
                    + 'Absätze stehen noch nicht darin.';
            try {
                if (typeof UI !== 'undefined' && UI.toast)
                    UI.toast(hinweis, 7000);
            }
            catch { }
            return blob;
        }
        const bilder = await wortBilder(seite);
        const bildListe = [];
        const inBaum = (id) => {
            Store.childrenOf(id).forEach((b) => {
                if (b.type === 'image' || b.type === 'schaltplan') {
                    const t = bilder.get(b.id);
                    if (t)
                        bildListe.push(t);
                }
                if (Store.childrenOf(b.id).length)
                    inBaum(b.id);
            });
        };
        inBaum(seite.id);
        const inhalt = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:body>' +
            wAbsatz(seite.text || 'Ohne Titel', 'Title') +
            wortInhalt(seite, bilder) +
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
                    [...new Set(bildListe.map(b => b.endung))].map(e => '<Default Extension="' + e + '" ContentType="' +
                        (bildListe.find(b => b.endung === e) || { typ: 'image/png' }).typ +
                        '"/>').join('') +
                    '</Types>' },
            { name: '_rels/.rels', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
                    '</Relationships>' },
            { name: 'word/_rels/document.xml.rels', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
                    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
                    bildListe.map((b, i) => '<Relationship Id="rIdBild' + (i + 1) + '" ' +
                        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" ' +
                        'Target="media/bild' + (i + 1) + '.' + b.endung + '"/>').join('') +
                    '</Relationships>' },
            { name: 'word/document.xml', inhalt },
            { name: 'word/styles.xml', inhalt: stile },
            { name: 'word/numbering.xml', inhalt: nummern },
            ...bildListe.map((b, i) => ({
                name: 'word/media/bild' + (i + 1) + '.' + b.endung, inhalt: b.bytes
            }))
        ];
        const blob = await zipSchreiben(dateien);
        laden(blob, (seite.text || 'Seite').replace(/[\\/:*?"<>|]/g, '-') + '.docx');
        return blob;
    };
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
    const EXCEL_FUNKTION = {
        summe: 'SUM', mittelwert: 'AVERAGE', wurzel: 'SQRT', rest: 'MOD',
        runden: 'ROUND', abrunden: 'ROUNDDOWN', aufrunden: 'ROUNDUP',
        produkt: 'PRODUCT', anzahl: 'COUNT', anzahl2: 'COUNTA', potenz: 'POWER',
        ganzzahl: 'INT', wenn: 'IF', wenns: 'IFS', wennfehler: 'IFERROR',
        istfehler: 'ISERROR', und: 'AND', oder: 'OR', nicht: 'NOT',
        'zählenwenn': 'COUNTIF', 'zählenwenns': 'COUNTIFS',
        summewenn: 'SUMIF', summewenns: 'SUMIFS',
        mittelwertwenn: 'AVERAGEIF', mittelwertwenns: 'AVERAGEIFS',
        sverweis: 'VLOOKUP', wverweis: 'HLOOKUP', xverweis: 'XLOOKUP'
    };
    const ausserhalb = (text, von, zu) => {
        let raus = '', zitat = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i] ?? '';
            if (c === '"') {
                raus += c;
                if (text[i + 1] === '"') {
                    raus += '"';
                    i++;
                }
                else
                    zitat = !zitat;
            }
            else
                raus += (!zitat && c === von) ? zu : c;
        }
        return raus;
    };
    const formelAussen = (text, aendere) => {
        let raus = '', frei = '', i = 0;
        const freiLeeren = () => { raus += aendere(frei); frei = ''; };
        while (i < text.length) {
            const c = text[i] ?? '';
            if (c !== '"') {
                frei += c;
                i++;
                continue;
            }
            freiLeeren();
            raus += c;
            i++;
            while (i < text.length) {
                const innen = text[i] ?? '';
                raus += innen;
                i++;
                if (innen !== '"')
                    continue;
                if (text[i] === '"') {
                    raus += '"';
                    i++;
                    continue;
                }
                break;
            }
        }
        freiLeeren();
        return raus;
    };
    const formelFuerExcel = (roh) => {
        let f = String(roh ?? '').trim().replace(/^=/, '');
        f = formelAussen(f, teil => teil.replace(/([A-Za-zÄÖÜäöüß][A-Za-z0-9_ÄÖÜäöüß.]*)\s*(?=\()/g, n => EXCEL_FUNKTION[n.toLowerCase()] || n));
        return ausserhalb(f, ';', ',');
    };
    const formelFuerOds = (roh) => {
        const marken = [];
        let f = ausserhalb(formelFuerExcel(roh), ',', ';');
        f = formelAussen(f, teil => {
            let frei = teil.replace(/(\$?[A-Z]{1,3}\$?\d+):(\$?[A-Z]{1,3}\$?\d+)/g, (_, a, b) => {
                marken.push(`[.${a}:.${b}]`);
                return `@@r${marken.length - 1}@@`;
            });
            frei = frei.replace(/\$?[A-Z]{1,3}\$?\d+/g, a => {
                marken.push(`[.${a}]`);
                return `@@r${marken.length - 1}@@`;
            });
            return frei;
        });
        return f.replace(/@@r(\d+)@@/g, (_, i) => marken[+i] || '');
    };
    const blattXml = (zeilen, stilIx, formeln) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetData>' +
        zeilen.map((z, r) => `<row r="${r + 1}">` + z.map((c, s) => {
            const bezug = spaltenName(s) + (r + 1);
            const ix = (stilIx && stilIx[r] && stilIx[r][s]) || 0;
            const kopf = !stilIx && r === 0;
            const formel = formeln && formeln[r] && formeln[r][s];
            const zahl = typeof c === 'number'
                ? isFinite(c)
                : c !== '' && c !== null && c !== undefined && !isNaN(Number(String(c).replace(',', '.')));
            if (formel) {
                const f = esc(formelFuerExcel(formel));
                if (typeof c === 'number' && isFinite(c))
                    return `<c r="${bezug}"${ix ? ` s="${ix}"` : ''}><f>${f}</f><v>${c}</v></c>`;
                if (typeof c === 'boolean')
                    return `<c r="${bezug}" t="b"${ix ? ` s="${ix}"` : ''}><f>${f}</f><v>${c ? 1 : 0}</v></c>`;
                return `<c r="${bezug}" t="str"${ix ? ` s="${ix}"` : ''}><f>${f}</f><v>${esc(c)}</v></c>`;
            }
            if (!kopf && zahl) {
                const n = typeof c === 'number' ? c : Number(String(c).replace(',', '.'));
                return `<c r="${bezug}"${ix ? ` s="${ix}"` : ''}><v>${n}</v></c>`;
            }
            return `<c r="${bezug}" t="inlineStr"${kopf ? ' s="1"' : (ix ? ` s="${ix}"` : '')}>` +
                `<is><t xml:space="preserve">${esc(c)}</t></is></c>`;
        }).join('') + '</row>').join('') +
        '</sheetData></worksheet>';
    const odsStilSammlung = (blaetter) => {
        const datenStile = [];
        const datenIx = new Map();
        const zellStile = [];
        const zellIx = new Map();
        const datenStil = (art, stellen, waehrung) => {
            const key = art + '|' + (stellen ?? '') + '|' + (art === 'waehrung' ? waehrung : '');
            const da = datenIx.get(key);
            if (da)
                return da;
            const name = (art === 'prozent' ? 'np' : 'nw') + (datenStile.length + 1);
            if (art === 'prozent')
                datenStile.push(`<number:percentage-style style:name="${name}">` +
                    `<number:number number:decimal-places="${stellen ?? 0}" number:min-integer-digits="1"/>` +
                    '<number:text> %</number:text></number:percentage-style>');
            else
                datenStile.push(`<number:currency-style style:name="${name}">` +
                    `<number:number number:decimal-places="${stellen ?? 2}" number:min-integer-digits="1" number:grouping="true"/>` +
                    `<number:text> </number:text><number:currency-symbol>${esc(waehrung)}</number:currency-symbol>` +
                    '</number:currency-style>');
            datenIx.set(key, name);
            return name;
        };
        const kombi = (stil) => {
            if (!stil)
                return '';
            const fett = !!stil.fett, kursiv = !!stil.kursiv;
            const aus = stil.ausrichtung === 'links' ? 'start'
                : stil.ausrichtung === 'mitte' ? 'center'
                    : stil.ausrichtung === 'rechts' ? 'end' : '';
            const art = (stil.format && stil.format.art) || '';
            const stellen = stil.format && typeof stil.format.stellen === 'number'
                ? stil.format.stellen : undefined;
            const waehrung = (stil.format && stil.format.waehrung) || 'CHF';
            const key = (fett ? 'f' : '') + (kursiv ? 'k' : '') + '|' + aus + '|' +
                art + '|' + (stellen ?? '') + '|' + (art === 'waehrung' ? waehrung : '');
            if (key === '||||')
                return '';
            const bekannt = zellIx.get(key);
            if (bekannt)
                return bekannt;
            const daten = (art === 'prozent' || art === 'waehrung')
                ? datenStil(art, stellen, waehrung) : '';
            const name = 'ce' + (zellStile.length + 1);
            zellStile.push(`<style:style style:name="${name}" style:family="table-cell"` +
                (daten ? ` style:data-style-name="${daten}"` : '') + '>' +
                (fett || kursiv
                    ? '<style:text-properties' + (fett ? ' fo:font-weight="bold"' : '') +
                        (kursiv ? ' fo:font-style="italic"' : '') + '/>'
                    : '') +
                (aus ? `<style:paragraph-properties fo:text-align="${aus}"/>` : '') +
                '</style:style>');
            zellIx.set(key, name);
            return name;
        };
        const je = (blaetter || []).map((b) => (b.stile || []).length
            ? b.stile.map((zeile) => zeile.map((st) => kombi(st)))
            : null);
        const xml = (datenStile.length || zellStile.length)
            ? '<office:automatic-styles>' + datenStile.join('') + zellStile.join('') +
                '</office:automatic-styles>'
            : '';
        return { xml, je };
    };
    const odsZelle = (w, anzeige, stilName, formel) => {
        const stilA = stilName ? ` table:style-name="${stilName}"` : '';
        const formelA = formel ? ` table:formula="of:=${esc(formelFuerOds(formel))}"` : '';
        const leer = w === null || w === undefined || w === '';
        if (leer && !formel)
            return `<table:table-cell${stilA}/>`;
        const zahl = typeof w === 'number' ? (isFinite(w) ? w : null)
            : (typeof w === 'string' && w.trim() !== '' && Number.isFinite(Number(w))
                ? Number(w) : null);
        if (zahl !== null)
            return `<table:table-cell${stilA}${formelA} office:value-type="float" office:value="${zahl}">` +
                `<text:p>${esc(String(anzeige ?? w))}</text:p></table:table-cell>`;
        return `<table:table-cell${stilA}${formelA} office:value-type="string">` +
            String(w ?? '').split('\n').map(z => `<text:p>${esc(z)}</text:p>`).join('') +
            '</table:table-cell>';
    };
    const odsBlatt = (b, stilJe) => {
        const zeilen = b.zeilen || [];
        const anzeigen = b.anzeigen || [];
        const formeln = b.formeln || [];
        const breite = zeilen.reduce((m, z) => Math.max(m, (z || []).length), 0);
        return `<table:table table:name="${esc(String(b.name || 'Blatt'))}">` +
            `<table:table-column table:number-columns-repeated="${Math.max(1, breite)}"/>` +
            zeilen.map((z, r) => '<table:table-row>' +
                Array.from({ length: breite }, (_, i) => odsZelle((z || [])[i], anzeigen[r] ? anzeigen[r][i] : undefined, (stilJe && stilJe[r] && stilJe[r][i]) || undefined, (formeln[r] && formeln[r][i]) || undefined)).join('') +
                '</table:table-row>').join('') +
            '</table:table>';
    };
    const alsOds = async (blaetter, dateiname) => {
        const NS = ' xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"' +
            ' xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"' +
            ' xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"' +
            ' xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"' +
            ' xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"' +
            ' xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"';
        const stile = odsStilSammlung(blaetter);
        const dateien = [
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
                    stile.xml +
                    '<office:body><office:spreadsheet>' +
                    (blaetter || []).map((b, i) => odsBlatt(b, stile.je[i] || undefined)).join('') +
                    '</office:spreadsheet></office:body></office:document-content>' }
        ];
        const blob = await zipSchreiben(dateien);
        laden(blob, (dateiname || 'Redion') + '.ods');
        return blob;
    };
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
    const stilSammlung = (blaetter) => {
        const fonts = ['<font><sz val="11"/><name val="Calibri"/></font>',
            '<font><b/><sz val="11"/><name val="Calibri"/></font>'];
        const fontIx = new Map([['', 0], ['f', 1]]);
        const numFmts = [];
        const fmtIx = new Map();
        const xfs = ['<xf xfId="0"/>', '<xf fontId="1" applyFont="1" xfId="0"/>'];
        const xfIx = new Map();
        let naechsteFmtId = 164;
        const kombi = (stil) => {
            if (!stil)
                return 0;
            const fett = !!stil.fett, kursiv = !!stil.kursiv;
            const aus = stil.ausrichtung === 'links' ? 'left'
                : stil.ausrichtung === 'mitte' ? 'center'
                    : stil.ausrichtung === 'rechts' ? 'right' : '';
            const art = (stil.format && stil.format.art) || '';
            const stellen = stil.format && typeof stil.format.stellen === 'number'
                ? stil.format.stellen : undefined;
            const waehrung = (stil.format && stil.format.waehrung) || 'CHF';
            const key = (fett ? 'f' : '') + (kursiv ? 'k' : '') + '|' + aus + '|' +
                art + '|' + (stellen ?? '') + '|' + (art === 'waehrung' ? waehrung : '');
            if (key === '||||')
                return 0;
            const bekannt = xfIx.get(key);
            if (bekannt !== undefined)
                return bekannt;
            const fKey = (fett ? 'f' : '') + (kursiv ? 'k' : '');
            let fId = fontIx.get(fKey);
            if (fId === undefined) {
                fId = fonts.length;
                fonts.push('<font>' + (fett ? '<b/>' : '') + (kursiv ? '<i/>' : '') +
                    '<sz val="11"/><name val="Calibri"/></font>');
                fontIx.set(fKey, fId);
            }
            let fmtId = 0;
            if (art === 'prozent' || art === 'waehrung') {
                const code = art === 'prozent'
                    ? (stellen ? '0.' + '0'.repeat(stellen) + '%' : '0%')
                    : '#,##0' + (stellen === 0 ? '' : '.' + '0'.repeat(stellen ?? 2)) +
                        '\\ "' + waehrung + '"';
                let id = fmtIx.get(code);
                if (id === undefined) {
                    id = naechsteFmtId++;
                    numFmts.push(`<numFmt numFmtId="${id}" formatCode="${esc(code)}"/>`);
                    fmtIx.set(code, id);
                }
                fmtId = id;
            }
            const ix = xfs.length;
            const attrs = 'xfId="0"' +
                (fId ? ` fontId="${fId}" applyFont="1"` : '') +
                (fmtId ? ` numFmtId="${fmtId}" applyNumberFormat="1"` : '');
            xfs.push(aus
                ? `<xf ${attrs} applyAlignment="1"><alignment horizontal="${aus}"/></xf>`
                : `<xf ${attrs}/>`);
            xfIx.set(key, ix);
            return ix;
        };
        const je = blaetter.map((b) => (b.stile || []).length
            ? b.stile.map((zeile) => zeile.map((st) => kombi(st)))
            : null);
        const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
            (numFmts.length ? `<numFmts count="${numFmts.length}">` + numFmts.join('') + '</numFmts>' : '') +
            `<fonts count="${fonts.length}">` + fonts.join('') + '</fonts>' +
            '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
            '<borders count="1"><border/></borders>' +
            '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
            `<cellXfs count="${xfs.length}">` + xfs.join('') + '</cellXfs>' +
            '</styleSheet>';
        return { xml, je };
    };
    const alsExcel = async (blaetter, dateiname) => {
        const sicher = (n, i) => String(n || ('Blatt' + (i + 1)))
            .replace(/[\\/:*?[\]]/g, ' ').slice(0, 31) || ('Blatt' + (i + 1));
        const stile = stilSammlung(blaetter);
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
            { name: 'xl/styles.xml', inhalt: stile.xml }
        ].concat(blaetter.map((b, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`,
            inhalt: blattXml(b.zeilen, stile.je[i] || undefined, b.formeln || undefined) })));
        const blob = await zipSchreiben(dateien);
        laden(blob, (dateiname || 'Redion') + '.xlsx');
        return blob;
    };
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
    const HAKEN_AN = /^\s*(?:\u2611|\u2612|\u2714|\u2713|\[x\]|\[X\])\s*/;
    const HAKEN_AUS = /^\s*(?:\u2610|\[\s?\])\s*/;
    const htmlZuMarkdown = (html) => {
        const roh = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
        if (!roh.body)
            return '';
        return [...roh.body.querySelectorAll('div, p, li, h1, h2, h3')]
            .map(el => {
            let t = (el.textContent || '').trim();
            if (!t)
                return '';
            if (el.tagName === 'H1')
                return '# ' + t;
            if (el.tagName === 'H2')
                return '## ' + t;
            if (el.tagName === 'H3')
                return '### ' + t;
            if (el.tagName === 'LI') {
                const attr = el.getAttribute('data-apple-checklist-item')
                    || el.getAttribute('data-checked') || '';
                if (HAKEN_AN.test(t))
                    return '- [x] ' + t.replace(HAKEN_AN, '');
                if (HAKEN_AUS.test(t))
                    return '- [ ] ' + t.replace(HAKEN_AUS, '');
                if (attr)
                    return (attr === 'true' || attr === 'checked' ? '- [x] ' : '- [ ] ') + t;
                return '- ' + t;
            }
            return t;
        }).filter(Boolean).join('\n\n');
    };
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
            const md = htmlZuMarkdown(inhalt);
            if (md)
                Werkzeuge.ausMarkdown(seite, md);
            const tags = [...n.querySelectorAll('tag')].map(t => t.textContent);
            if (tags.length)
                Store.updateBlock(seite.id, { tags });
        });
        Store.updateBlock(wurzel.id, { aufgeklappt: true });
        return { seite: wurzel, hinweis: notizen.length + ' Notizen übernommen' };
    };
    const normalizeVaultKey = (value) => String(value ?? '')
        .normalize('NFKC').replace(/\\/g, '/').replace(/^\.\//, '')
        .replace(/^\/+|\/+$/g, '')
        .split('/').map(segment => segment.trim().replace(/\s+/g, ' ')).filter(Boolean)
        .join('/').toLocaleLowerCase('de');
    const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
    const safeVaultPath = (value, allowText = false) => {
        const raw = String(value ?? '').normalize('NFKC').replace(/\\/g, '/').trim();
        if (!raw || raw.length > 1024 || raw.startsWith('/') || /^[A-Za-z]:/.test(raw) ||
            /[<>:"|?*\u0000-\u001F]/.test(raw))
            return null;
        const parts = raw.split('/');
        if (parts.some(part => !part || part === '.' || part === '..' || part.length > 240 ||
            WINDOWS_RESERVED.test(part)))
            return null;
        if (!allowText && !/\.(?:md|markdown)$/i.test(parts[parts.length - 1] || ''))
            return null;
        if (allowText && !/\.(?:md|markdown|txt)$/i.test(parts[parts.length - 1] || ''))
            return null;
        return parts.join('/');
    };
    const safeDeclaredVaultPath = (value) => {
        const raw = String(value ?? '').normalize('NFKC').replace(/\\/g, '/').trim();
        if (!raw)
            return '';
        const safe = safeVaultPath(raw + '.md');
        return safe ? safe.slice(0, -3) : '';
    };
    const yamlValue = (raw) => {
        const value = raw.trim();
        if (!value)
            return '';
        if (value.startsWith('"') && value.endsWith('"')) {
            try {
                const parsed = JSON.parse(value);
                return typeof parsed === 'string' ? parsed : '';
            }
            catch {
                return value.slice(1, -1);
            }
        }
        if (value.startsWith("'") && value.endsWith("'"))
            return value.slice(1, -1).replace(/''/g, "'");
        return value.replace(/\s+#.*$/, '').trim();
    };
    const yamlAliases = (raw) => {
        const value = raw.trim();
        if (!value)
            return [];
        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed))
                    return parsed.map(item => String(item ?? ''));
            }
            catch { }
            return value.slice(1, -1).split(',').map(yamlValue);
        }
        return [yamlValue(value)];
    };
    const cleanAliases = (values, title = '') => {
        const seen = new Set(), out = [];
        const titleKey = String(title).trim().toLocaleLowerCase('de');
        for (const raw of values || []) {
            const alias = String(raw ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').slice(0, 120);
            const key = alias.toLocaleLowerCase('de');
            if (!key || key === titleKey || seen.has(key))
                continue;
            seen.add(key);
            out.push(alias);
        }
        return out;
    };
    const parseVaultFrontmatter = (text) => {
        const empty = { redionId: '', redionPath: '', redionTitle: '', aliases: [] };
        const normalized = String(text ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
        if (!normalized.startsWith('---\n'))
            return { meta: empty, body: normalized };
        let end = normalized.indexOf('\n---\n', 4);
        let bodyStart = end + 5;
        if (end < 0 && normalized.endsWith('\n---')) {
            end = normalized.length - 4;
            bodyStart = normalized.length;
        }
        if (end < 0)
            return { meta: empty, body: normalized };
        const lines = normalized.slice(4, end).split('\n');
        const meta = { ...empty };
        let listKey = '';
        for (const line of lines) {
            const list = line.match(/^\s+-\s+(.*)$/);
            if (list && listKey === 'aliases') {
                meta.aliases.push(yamlValue(list[1] || ''));
                continue;
            }
            const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (!field) {
                listKey = '';
                continue;
            }
            const key = String(field[1] || '').toLocaleLowerCase('de');
            const value = field[2] || '';
            listKey = key;
            if (key === 'redion-id')
                meta.redionId = yamlValue(value);
            if (key === 'redion-path')
                meta.redionPath = yamlValue(value);
            if (key === 'redion-title')
                meta.redionTitle = yamlValue(value);
            if (key === 'aliases')
                meta.aliases.push(...yamlAliases(value));
        }
        meta.aliases = cleanAliases(meta.aliases);
        return { meta, body: normalized.slice(bodyStart) };
    };
    const yamlQuoted = (value) => JSON.stringify(String(value ?? ''));
    const vaultFrontmatter = (page, path) => {
        const aliases = cleanAliases(Array.isArray(page.aliases) ? page.aliases : [], page.text);
        return [
            '---',
            'redion-id: ' + yamlQuoted(page.id),
            'redion-path: ' + yamlQuoted(path),
            'redion-title: ' + yamlQuoted(String(page.text || 'Ohne Titel').replace(/[\r\n]+/g, ' ')),
            ...(aliases.length ? ['aliases:', ...aliases.map(alias => '  - ' + yamlQuoted(alias))] : ['aliases: []']),
            '---'
        ].join('\n');
    };
    const safeVaultSegment = (value) => {
        let segment = String(value || 'Ohne Titel').normalize('NFKC')
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim()
            .replace(/[. ]+$/g, '').slice(0, 80);
        if (!segment)
            segment = 'Ohne Titel';
        if (WINDOWS_RESERVED.test(segment))
            segment = '_' + segment;
        return segment;
    };
    const vaultDarf = (recht, seiteId) => {
        if (typeof Konten === 'undefined' || typeof Konten.darf !== 'function')
            return true;
        if (seiteId)
            return Konten.darf(recht, seiteId);
        const konto = typeof Konten.aktiv === 'function' ? Konten.aktiv() : null;
        const rolle = typeof Konten.rolle === 'function' ? Konten.rolle(konto?.rolle || 'voll') : null;
        return !rolle || (rolle.darf || []).includes(recht);
    };
    const planVaultPaths = (erlaubt = () => true) => {
        const paths = new Map(), visited = new Set();
        const walk = (pages, parentPath, namespace) => {
            const used = namespace || new Set();
            pages.forEach(page => {
                if (!page?.id || visited.has(page.id))
                    return;
                visited.add(page.id);
                const children = Store.childrenOf(page.id)
                    .filter((child) => child.type === 'page' && child.parentTable !== 'collection');
                if (!erlaubt(page)) {
                    walk(children, parentPath, used);
                    return;
                }
                const base = safeVaultSegment(page.text);
                let segment = base, key = segment.toLocaleLowerCase('de');
                if (used.has(key)) {
                    segment = `${base} · ${String(page.id).slice(0, 8)}`;
                    key = segment.toLocaleLowerCase('de');
                    let suffix = 2;
                    while (used.has(key)) {
                        segment = `${base} · ${String(page.id).slice(0, 8)} · ${suffix++}`;
                        key = segment.toLocaleLowerCase('de');
                    }
                }
                used.add(key);
                const path = parentPath ? parentPath + '/' + segment : segment;
                paths.set(page.id, path);
                walk(children, path);
            });
        };
        walk(Store.rootPages(), '');
        return paths;
    };
    const vaultMarkdown = (page, path, paths) => {
        let body = Werkzeuge.alsMarkdown(page);
        body = body.split('\n').filter((line) => {
            const marker = line.trim().match(/^<!--(?:db|wb|chart|tab|blk):([A-Za-z0-9_-]+)-->/);
            if (!marker?.[1])
                return true;
            const target = Store.getBlock(marker[1]);
            return !(target?.type === 'page' && !paths.has(target.id));
        }).join('\n');
        body = body.replace(/\[([^\]\n]+)\]\(#([0-9a-f-]{6,64})\)/gi, (whole, label, id) => {
            const target = Store.getBlock(id);
            if (!target || target.type !== 'page' || !target.alive)
                return whole;
            const targetPath = paths.get(target.id);
            if (!targetPath)
                return whole;
            return `[[${targetPath}${label === target.text ? '' : '|' + label}]]`;
        });
        body = body.replace(/\[\[([^\[\]\n|]{1,240})(?:\|([^\]\n]{1,240}))?\]\]/g, (whole, rawTarget, rawLabel) => {
            const suffixAt = String(rawTarget).search(/[#^]/);
            const suffix = suffixAt >= 0 ? String(rawTarget).slice(suffixAt) : '';
            const targetName = suffixAt >= 0 ? String(rawTarget).slice(0, suffixAt) : String(rawTarget);
            let target = typeof Links !== 'undefined' ? Links.loeseSeitenverweis(targetName).page : null;
            if (!target) {
                const children = Store.childrenOf(page.id).filter((child) => child.type === 'page' &&
                    String(child.text || '').trim().toLocaleLowerCase('de') ===
                        targetName.trim().toLocaleLowerCase('de'));
                if (children.length === 1)
                    target = children[0];
            }
            const targetPath = target && paths.get(target.id);
            if (!targetPath)
                return whole;
            const label = String(rawLabel || (targetPath !== targetName ? target.text || targetName : '')).trim();
            return `[[${targetPath}${suffix}${label ? '|' + label : ''}]]`;
        });
        return vaultFrontmatter(page, path) + '\n# ' + (page.text || 'Ohne Titel') +
            (body ? '\n\n' + body : '') + '\n';
    };
    const alsObsidianVault = async (dateiname = 'Redion-Obsidian') => {
        const paths = planVaultPaths(page => vaultDarf('teilen', page.id));
        const files = [...paths.entries()].map(([id, path]) => ({
            name: path + '.md', inhalt: vaultMarkdown(Store.getBlock(id), path, paths)
        }));
        const blob = await zipSchreiben(files);
        laden(blob, safeVaultSegment(dateiname) + '.zip');
        return blob;
    };
    const validRedionId = (value) => {
        const id = String(value ?? '').trim();
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
            ? id : '';
    };
    const movePage = (page, parentId) => {
        if (!page || page.parentId === parentId)
            return true;
        let current = Store.getBlock(parentId), guard = 0;
        while (current && guard++ < 80) {
            if (current.id === page.id)
                return false;
            current = current.parentId ? Store.getBlock(current.parentId) : null;
        }
        const oldParent = Store.getBlock(page.parentId);
        const newParent = Store.getBlock(parentId);
        if (!vaultDarf('bearbeiten', page.id) ||
            !(oldParent ? vaultDarf('bearbeiten', oldParent.id) : vaultDarf('bearbeiten')) ||
            !(newParent ? vaultDarf('bearbeiten', newParent.id) : vaultDarf('bearbeiten')))
            return false;
        if (oldParent)
            Store.updateBlock(oldParent.id, {
                content: (oldParent.content || []).filter((id) => id !== page.id)
            });
        Store.updateBlock(page.id, { parentId, parentTable: 'block' });
        const parent = newParent;
        if (parent && !(parent.content || []).includes(page.id))
            Store.updateBlock(parent.id, { content: [...(parent.content || []), page.id], aufgeklappt: true });
        return true;
    };
    const ausMarkdownOrdner = async (dateien, zielSeite) => {
        const allFiles = Array.from(dateien || []);
        const firstRelative = String(allFiles.find(file => file.webkitRelativePath)?.webkitRelativePath || '')
            .replace(/\\/g, '/');
        const vaultName = safeVaultSegment(firstRelative.split('/')[0] || 'Obsidian');
        let conflicts = 0, unsafe = 0, reused = 0, created = 0, links = 0, aliasConflicts = 0;
        const existingPlannedPaths = planVaultPaths();
        const entries = (await Promise.all(allFiles.map(async (file) => {
            const rawRelative = String(file.webkitRelativePath || file.name || '').replace(/\\/g, '/');
            const withoutRoot = file.webkitRelativePath ? rawRelative.split('/').slice(1).join('/') : rawRelative;
            const path = safeVaultPath(withoutRoot, true);
            if (!path) {
                unsafe++;
                return null;
            }
            const parsed = parseVaultFrontmatter(await file.text());
            if (parsed.meta.redionId && !validRedionId(parsed.meta.redionId)) {
                parsed.meta.redionId = '';
                unsafe++;
            }
            const declaredPath = safeDeclaredVaultPath(parsed.meta.redionPath);
            if (parsed.meta.redionPath && !declaredPath)
                unsafe++;
            parsed.meta.redionPath = declaredPath;
            const stem = path.replace(/\.(?:md|markdown|txt)$/i, '');
            const parts = stem.split('/');
            const fileTitle = parts.pop() || 'Ohne Titel';
            const declaredFileTitle = parsed.meta.redionPath.split('/').pop() || '';
            const renamedInVault = !!declaredFileTitle &&
                normalizeVaultKey(fileTitle) !== normalizeVaultKey(declaredFileTitle);
            const title = String(renamedInVault ? fileTitle : (parsed.meta.redionTitle || fileTitle))
                .normalize('NFKC').replace(/[\r\n]+/g, ' ').trim().slice(0, 500) || fileTitle;
            return {
                file, path, stem, folder: parts.join('/'), title,
                body: parsed.body, meta: parsed.meta, page: null, conflict: '', authoritative: false
            };
        }))).filter(Boolean);
        if (!entries.length)
            return { seite: null, hinweis: 'Keine sichere Markdown-Datei zum Importieren gefunden.' };
        const eigeneMetadaten = entries.filter(entry => !!entry.meta.redionPath).length;
        if (eigeneMetadaten > 0 && eigeneMetadaten < entries.length) {
            return { seite: null,
                hinweis: 'Import abgebrochen: Redion-Vault und fremde Markdown-Dateien sind gemischt. Bitte getrennt auswählen.' };
        }
        const isRedionVault = eigeneMetadaten === entries.length;
        const pathClaims = new Map();
        const idClaims = new Map();
        entries.forEach(entry => {
            const pathKey = normalizeVaultKey(entry.stem);
            pathClaims.set(pathKey, [...(pathClaims.get(pathKey) || []), entry]);
            const id = validRedionId(entry.meta.redionId);
            if (id)
                idClaims.set(id.toLowerCase(), [...(idClaims.get(id.toLowerCase()) || []), entry]);
        });
        [...pathClaims.values(), ...idClaims.values()].filter(list => list.length > 1).forEach(list => {
            list.forEach(entry => { if (!entry.conflict) {
                entry.conflict = 'doppelte Identität';
                conflicts++;
            } });
        });
        const targetPage = zielSeite ? Store.getBlock(zielSeite) : null;
        if ((targetPage && !vaultDarf('bearbeiten', targetPage.id)) ||
            (!targetPage && !vaultDarf('bearbeiten'))) {
            return { seite: null, hinweis: 'Für dieses Importziel fehlt die Bearbeitungsberechtigung.' };
        }
        const topParentId = targetPage?.type === 'page' && targetPage.alive ? targetPage.id : null;
        let root = null;
        if (!isRedionVault) {
            root = Store.addBlock(topParentId, 'page', {
                text: 'Aus Obsidian · ' + vaultName, icon: '🔮',
                obsidianVaultRoot: true, obsidianVaultName: vaultName
            });
        }
        const folderIds = new Map();
        if (root)
            folderIds.set('', root.id);
        const folderFor = (path) => {
            const known = folderIds.get(path);
            if (known)
                return known;
            const parts = path.split('/');
            const name = parts.pop() || 'Ordner';
            const parentId = folderFor(parts.join('/'));
            const candidates = Object.values(Store.cache.blocks).filter(page => page?.alive &&
                page.type === 'page' && page.parentTable !== 'collection' &&
                page.obsidianVaultName === vaultName && page.obsidianVaultRootId === root?.id &&
                normalizeVaultKey(page.obsidianFolderPath) === normalizeVaultKey(path));
            let folder;
            if (candidates.length === 1) {
                folder = candidates[0];
                movePage(folder, parentId);
            }
            else {
                if (candidates.length > 1)
                    conflicts++;
                folder = Store.addBlock(parentId, 'page', { text: name, icon: '📁',
                    obsidianFolderPath: path, obsidianVaultName: vaultName,
                    obsidianVaultRootId: root?.id || '' });
            }
            Store.updateBlock(folder.id, { text: name, icon: '📁',
                obsidianFolderPath: path, obsidianVaultName: vaultName,
                obsidianVaultRootId: root?.id || '' });
            folderIds.set(path, folder.id);
            return folder.id;
        };
        const existingPages = () => Object.values(Store.cache.blocks).filter(page => page?.alive &&
            page.type === 'page' && page.parentTable !== 'collection' && !page.obsidianVaultRoot &&
            vaultDarf('bearbeiten', page.id));
        const pathCandidates = (storedKeys, exportedKeys) => {
            const wantedStored = new Set(storedKeys.map(normalizeVaultKey).filter(Boolean));
            const wantedExported = new Set(exportedKeys.map(normalizeVaultKey).filter(Boolean));
            const found = new Map();
            existingPages().forEach(page => {
                if ((page.obsidianVaultName === vaultName &&
                    page.obsidianVaultRootId === (root?.id || '') &&
                    (wantedStored.has(normalizeVaultKey(page.obsidianPath)) ||
                        wantedStored.has(normalizeVaultKey(page.obsidianDeclaredPath)))) ||
                    wantedExported.has(normalizeVaultKey(existingPlannedPaths.get(page.id))))
                    found.set(page.id, page);
            });
            return [...found.values()];
        };
        const uniqueEntryByPath = new Map();
        pathClaims.forEach((list, key) => { if (list.length === 1 && list[0])
            uniqueEntryByPath.set(key, list[0]); });
        const orderedEntries = [...entries].sort((a, b) => a.stem.split('/').length - b.stem.split('/').length || a.stem.localeCompare(b.stem, 'de'));
        for (const entry of orderedEntries) {
            const parentEntry = entry.folder ? uniqueEntryByPath.get(normalizeVaultKey(entry.folder)) : null;
            let parentId = isRedionVault
                ? (parentEntry?.authoritative ? parentEntry.page?.id : topParentId)
                : folderFor(entry.folder);
            const missingParent = isRedionVault && !!entry.folder && !parentEntry?.authoritative;
            const claimedTwice = !!entry.conflict;
            const wantedId = claimedTwice ? '' : validRedionId(entry.meta.redionId);
            const byId = wantedId ? Store.getBlock(wantedId) : null;
            const paths = claimedTwice ? [] : pathCandidates([entry.meta.redionPath], [entry.meta.redionPath]);
            let page = null;
            if (byId && (byId.type !== 'page' || !byId.alive || byId.parentTable === 'collection')) {
                entry.conflict = 'redion-id gehört zu einem anderen Datensatz';
                conflicts++;
            }
            else if (byId && !vaultDarf('bearbeiten', byId.id)) {
                entry.conflict = 'redion-id gehört zu einer nicht bearbeitbaren Seite';
                conflicts++;
            }
            else if (byId && paths.length === 1 && paths[0]?.id === byId.id) {
                page = byId;
                entry.authoritative = true;
                reused++;
            }
            else if (byId) {
                entry.conflict = paths.length
                    ? 'redion-id und redion-path zeigen nicht eindeutig auf dieselbe Seite'
                    : 'redion-id hat keinen bestätigenden redion-path';
                conflicts++;
            }
            else if (wantedId && paths.length) {
                entry.conflict = 'redion-id ist neu, redion-path aber schon belegt';
                conflicts++;
            }
            else if (!wantedId && paths.length) {
                entry.conflict = paths.length > 1
                    ? 'redion-path ist mehrdeutig'
                    : 'redion-path ohne bestätigende redion-id';
                conflicts++;
            }
            if (missingParent && page)
                parentId = page.parentId || null;
            if (!page) {
                const patch = { text: entry.title };
                if (!entry.conflict && wantedId && !Store.getBlock(wantedId))
                    patch.id = wantedId;
                page = Store.addBlock(parentId, 'page', patch);
                entry.authoritative = !entry.conflict;
                created++;
            }
            else if (!movePage(page, parentId)) {
                entry.conflict = 'Seite konnte wegen Hierarchie oder Rechten nicht verschoben werden';
                conflicts++;
                page = Store.addBlock(parentId, 'page', { text: entry.title });
                created++;
                entry.authoritative = false;
            }
            if (missingParent && !entry.conflict) {
                entry.conflict = 'Elterndatei fehlt; vorhandene Hierarchie wurde beibehalten';
                conflicts++;
            }
            const aliases = cleanAliases(entry.meta.aliases, entry.title);
            Store.updateBlock(page.id, {
                text: entry.title, aliases, obsidianPath: entry.stem,
                obsidianDeclaredPath: entry.meta.redionPath || '', obsidianVaultName: vaultName,
                obsidianVaultRootId: root?.id || ''
            });
            entry.page = page;
        }
        for (const entry of orderedEntries) {
            if (!entry.page)
                continue;
            if (!vaultDarf('bearbeiten', entry.page.id)) {
                conflicts++;
                continue;
            }
            let body = entry.body;
            const firstHeading = body.match(/^#\s+([^\n]+)\n+/);
            if (firstHeading && String(firstHeading[1] || '').trim().toLocaleLowerCase('de') ===
                entry.title.trim().toLocaleLowerCase('de'))
                body = body.slice(firstHeading[0].length);
            Werkzeuge.ausMarkdown(entry.page, body, isRedionVault ? { preserveOpaqueIds: true } : undefined);
            for (const match of body.matchAll(/\[\[([^\[\]\n|]{1,240})(?:\|[^\]\n]*)?\]\]/g)) {
                if (typeof Links !== 'undefined' && Links.loeseSeitenverweis(match[1] || '').status === 'eindeutig')
                    links++;
            }
        }
        if (typeof Links !== 'undefined') {
            const collided = new Set();
            entries.forEach(entry => (entry.page?.aliases || []).forEach((alias) => {
                if (Links.loeseSeitenverweis(alias).status === 'mehrdeutig')
                    collided.add(alias.toLocaleLowerCase('de'));
            }));
            aliasConflicts = collided.size;
        }
        if (root)
            Store.updateBlock(root.id, { aufgeklappt: true });
        const firstPage = root || orderedEntries.find(entry => !entry.folder)?.page || orderedEntries[0]?.page || null;
        const folderCount = isRedionVault
            ? new Set(entries.map(entry => entry.folder).filter(Boolean)).size
            : Math.max(0, folderIds.size - 1);
        return { seite: firstPage,
            hinweis: `${entries.length} Notizen (${created} neu, ${reused} wiedererkannt), ` +
                `${folderCount} Ordner, ${links} eindeutige Wikilinks` +
                (conflicts ? ` · ${conflicts} Konflikte getrennt behalten` : '') +
                (aliasConflicts ? ` · ${aliasConflicts} mehrdeutige Aliase markiert` : '') +
                (unsafe ? ` · ${unsafe} unsichere/ungeeignete Pfade übersprungen` : '') };
    };
    const ausNotionZip = async (puffer, zielSeite) => {
        const zip = await Einlesen.zipLesen(puffer);
        const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Notion' });
        const ordner = new Map([['', wurzel.id]]);
        const saeubern = (n) => String(n).replace(/\s+[0-9a-f]{32}(?=$|\.)/i, '').trim();
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
        const MEDIEN = {
            png: { typ: 'image/png', block: 'image' },
            jpg: { typ: 'image/jpeg', block: 'image' },
            jpeg: { typ: 'image/jpeg', block: 'image' },
            gif: { typ: 'image/gif', block: 'image' },
            webp: { typ: 'image/webp', block: 'image' },
            svg: { typ: 'image/svg+xml', block: 'image' },
            pdf: { typ: 'application/pdf', block: 'file' },
            mp4: { typ: 'video/mp4', block: 'video' },
            webm: { typ: 'video/webm', block: 'video' },
            mp3: { typ: 'audio/mpeg', block: 'file' },
            wav: { typ: 'audio/wav', block: 'file' }
        };
        let seiten = 0, tabellen = 0, jsonWerte = 0, formeln = 0, anhaenge = 0;
        const ausgelassen = [];
        for (const name of zip.namen) {
            if (name.endsWith('/'))
                continue;
            const teile = name.split('/');
            const datei = teile.pop();
            const eltern = ordnerFuer(teile.join('/'));
            if (/\.md$/i.test(datei)) {
                const text = await zip.text(name);
                const s = Store.addBlock(eltern, 'page', { text: saeubern(datei.replace(/\.md$/i, '')) });
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
                try {
                    const roh = JSON.parse(await zip.text(name));
                    const erg = ausNotionJson(roh, eltern, saeubern(datei.replace(/\.json$/i, '')));
                    jsonWerte += erg.werte;
                    formeln += erg.formeln;
                    tabellen += erg.tabellen;
                }
                catch { }
            }
            else {
                const endung = (datei.split('.').pop() || '').toLowerCase();
                const art = MEDIEN[endung];
                if (!art) {
                    ausgelassen.push('.' + (endung || '?'));
                    continue;
                }
                try {
                    const bytes = await zip.holen(name);
                    if (!bytes) {
                        ausgelassen.push('.' + endung);
                        continue;
                    }
                    const b = Store.addBlock(eltern, art.block, { text: saeubern(datei) });
                    const satz = await Dateien.ablegen(new File([bytes], saeubern(datei), { type: art.typ }), { blockId: b.id });
                    await Dateien.adresse(satz.id);
                    Store.updateBlock(b.id, { dateiId: satz.id, typ: art.typ });
                    anhaenge++;
                }
                catch {
                    ausgelassen.push('.' + endung);
                }
            }
        }
        Store.updateBlock(wurzel.id, { aufgeklappt: true });
        return { seite: wurzel,
            hinweis: seiten + ' Seiten und ' + tabellen + ' Tabellen übernommen' +
                (anhaenge ? ', ' + anhaenge + ' Anhänge dabei' : '') +
                (jsonWerte ? ', ' + jsonWerte + ' verschachtelte Werte flachgelegt' : '') +
                (formeln ? ', ' + formeln + ' Formeln übersetzt' : '') +
                (ausgelassen.length ? ' — ' + ausgelassen.length + ' Datei(en) nicht übernommen (' +
                    [...new Set(ausgelassen)].join(', ') + ')' : '') };
    };
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
    const ASANA_FELDER = [
        [/^name$|^task name$/i, 'title', 'Aufgabe', 'title'],
        [/^section\/column$|^section$/i, 'abschnitt', 'Abschnitt', 'status'],
        [/^assignee$/i, 'wer', 'Zuständig', 'text'],
        [/^due date$/i, 'faellig', 'Fällig', 'date'],
        [/^start date$/i, 'beginn', 'Beginn', 'date'],
        [/^tags$/i, 'tags', 'Etiketten', 'multi'],
        [/^projects$/i, 'projekt', 'Projekt', 'text'],
        [/^parent task$/i, 'ueber', 'Gehört zu', 'text'],
        [/^priority$/i, 'prio', 'Priorität', 'select'],
    ];
    const ASANA_STUMM = /^notes$|^completed at$|^task id$|^assignee email$|^created at$|^last modified$/i;
    const asanaListe = (v) => String(v ?? '').split(/\s*,\s*/).map(x => x.trim()).filter(Boolean);
    const ausAsana = (text, zielSeite, name) => {
        const zeilen = (typeof Csv !== 'undefined')
            ? Csv.zerlege(text).filter((z) => z.some(x => String(x).trim()))
            : csvZerlegenNot(text);
        if (zeilen.length < 2)
            throw new Error('Die Datei enthält keine Zeilen');
        const kopf = (zeilen[0] ?? []).map((x) => String(x ?? '').replace(/^﻿/, '').trim());
        const saetze = zeilen.slice(1);
        const titelSpalte = kopf.findIndex(k => /^name$|^task name$/i.test(k));
        if (titelSpalte < 0)
            throw new Error('Das sieht nicht nach einem Asana-Export aus — die Spalte „Name" fehlt');
        const zuordnung = [];
        const schema = {};
        let eigene = 0;
        kopf.forEach((spaltenName, i) => {
            if (!spaltenName)
                return;
            if (ASANA_STUMM.test(spaltenName))
                return;
            const treffer = ASANA_FELDER.find(([muster]) => muster.test(spaltenName));
            if (treffer) {
                const [, key, anzeige, typ] = treffer;
                if (schema[key])
                    return;
                schema[key] = { name: anzeige, type: typ };
                zuordnung.push({ i, key, typ });
            }
            else {
                const key = 'a' + eigene++;
                schema[key] = { name: spaltenName, type: 'text' };
                zuordnung.push({ i, key, typ: 'text' });
            }
        });
        const fertigSpalte = kopf.findIndex(k => /^completed at$/i.test(k));
        if (fertigSpalte >= 0)
            schema['fertig'] = { name: 'Erledigt', type: 'checkbox' };
        const notizSpalte = kopf.findIndex(k => /^notes$/i.test(k));
        const werteVon = (i) => saetze.map((z) => String(z[i] ?? '').trim());
        const FARBEN = ['gray', 'blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow'];
        zuordnung.forEach(z => {
            if (z.typ !== 'status' && z.typ !== 'select' && z.typ !== 'multi')
                return;
            const roh = werteVon(z.i);
            const alle = z.typ === 'multi'
                ? [...new Set(roh.flatMap(asanaListe))]
                : [...new Set(roh.filter(Boolean))];
            schema[z.key].options = alle.map((n, k) => ({ name: n, color: FARBEN[k % FARBEN.length] }));
        });
        const titel = name || 'Aus Asana';
        const seite = Store.addBlock(zielSeite || null, 'page', { text: titel, icon: '✓' });
        const hatAbschnitt = !!schema['abschnitt'];
        const db = Store.addDatabase(seite.id, titel, schema, hatAbschnitt ? 'board' : 'table');
        if (hatAbschnitt)
            Store.updateView(db.viewId, { groupBy: 'abschnitt' });
        let n = 0, mitText = 0;
        saetze.forEach((z) => {
            const props = {};
            zuordnung.forEach(zu => {
                const roh = String(z[zu.i] ?? '').trim();
                if (zu.key === 'title') {
                    props['title'] = roh || 'Ohne Titel';
                    return;
                }
                if (!roh)
                    return;
                props[zu.key] = zu.typ === 'multi' ? asanaListe(roh)
                    : zu.typ === 'date' ? roh.slice(0, 10)
                        : roh;
            });
            if (fertigSpalte >= 0)
                props['fertig'] = !!String(z[fertigSpalte] ?? '').trim();
            if (props['title'] === undefined)
                props['title'] = 'Ohne Titel';
            const zeile = Store.addRow(db.collectionId, props);
            n++;
            const notiz = notizSpalte >= 0 ? String(z[notizSpalte] ?? '').trim() : '';
            if (notiz) {
                Werkzeuge.ausMarkdown(zeile, notiz);
                mitText++;
            }
        });
        return { seite, hinweis: n + ' Aufgaben übernommen, ' + mitText + ' mit Beschreibung' };
    };
    const csvZerlegenNot = (text) => {
        const raus = [];
        let feld = '', zeile = [], inAnf = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inAnf) {
                if (c === '"' && text[i + 1] === '"') {
                    feld += '"';
                    i++;
                }
                else if (c === '"')
                    inAnf = false;
                else
                    feld += c;
            }
            else if (c === '"')
                inAnf = true;
            else if (c === ',') {
                zeile.push(feld);
                feld = '';
            }
            else if (c === '\n') {
                zeile.push(feld);
                raus.push(zeile);
                zeile = [];
                feld = '';
            }
            else if (c !== '\r')
                feld += c;
        }
        if (feld || zeile.length) {
            zeile.push(feld);
            raus.push(zeile);
        }
        return raus.filter(z => z.some(x => String(x).trim()));
    };
    const ausAppleNotes = async (dateien, zielSeite) => {
        const htmls = dateien.filter(d => /\.html?$/i.test(d.name || ''));
        if (!htmls.length)
            throw new Error('Keine .html-Dateien in diesem Ordner');
        const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Apple Notes', icon: '📒' });
        const ordner = new Map();
        const ordnerSeite = (pfad) => {
            if (!pfad)
                return wurzel;
            const da = ordner.get(pfad);
            if (da)
                return da;
            const teile = pfad.split('/');
            const letzter = teile[teile.length - 1] || pfad;
            const eltern = ordnerSeite(teile.slice(0, -1).join('/'));
            const s = Store.addBlock(eltern.id, 'page', { text: letzter, icon: '📁' });
            ordner.set(pfad, s);
            return s;
        };
        let n = 0;
        for (const d of htmls) {
            const roh = await d.text();
            const doc = new DOMParser().parseFromString(roh, 'text/html');
            const ausDatei = String(d.name || '').replace(/\.html?$/i, '');
            const titel = (doc.querySelector('title')?.textContent || '').trim()
                || (doc.querySelector('h1, h2')?.textContent || '').trim()
                || ausDatei;
            const voll = String(d.webkitRelativePath || d.name || '');
            const teile = voll.split('/').slice(1, -1);
            const seite = Store.addBlock(ordnerSeite(teile.join('/')).id, 'page', { text: titel });
            const erste = doc.querySelector('h1, h2');
            if (erste && (erste.textContent || '').trim() === titel)
                erste.remove();
            const md = htmlZuMarkdown(doc.body ? doc.body.innerHTML : roh);
            if (md)
                Werkzeuge.ausMarkdown(seite, md);
            n++;
        }
        Store.updateBlock(wurzel.id, { aufgeklappt: true });
        return { seite: wurzel, hinweis: n + ' Notizen aus ' + (ordner.size || 1) + ' Ordnern übernommen' };
    };
    const QUELLEN = [
        ['trello', '📋', 'Trello', 'Das JSON eines Boards — Listen werden Status, Karten Zeilen', '.json'],
        ['evernote', '🐘', 'Evernote', 'Eine .enex-Datei — jede Notiz wird eine Seite', '.enex,.xml'],
        ['obsidian', '🔮', 'Obsidian', 'Ein ganzer Ordner mit .md-Dateien, Wikilinks werden aufgelöst', 'ordner'],
        ['notion', '📓', 'Notion-Export', 'Das ZIP aus Notions eigenem Export', '.zip'],
        ['asana', '🗒', 'Asana', 'Der CSV-Export — Abschnitte werden Status, Notizen werden Seiten', '.csv'],
        ['apple', '📒', 'Apple Notes', 'Der Ordner mit den HTML-Dateien — Unterordner bleiben Unterordner', 'ordner'],
        ['csv', '📊', 'Jira, Monday, sonstige CSV', 'Irgendeine Tabelle — wird zur Datenbank', '.csv'],
        ['markdown', '📄', 'Einzelne Dateien',
            'Markdown, Text, CSV, Word, PowerPoint, Excel, OpenDocument, EPUB',
            '.md,.txt,.csv,.docx,.pptx,.ppsx,.xlsx,.ods,.epub']
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
        if (typeof Rollrand !== 'undefined')
            Rollrand.binde(o.querySelector('.ax-liste'), { achse: 'hoch' });
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
                    else if (art === 'apple')
                        erg = await ausAppleNotes(dateien, null);
                    else if (art === 'asana')
                        erg = ausAsana(await erste.text(), null, erste.name.replace(/\.csv$/i, ''));
                    else if (art === 'csv') {
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
    const FOLIE_BREITE = 12192000, FOLIE_HOEHE = 6858000;
    const pptxThema = () => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Redion">' +
        '<a:themeElements>' +
        '<a:clrScheme name="Redion">' +
        '<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>' +
        '<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' +
        '<a:dk2><a:srgbClr val="1F2430"/></a:dk2><a:lt2><a:srgbClr val="F5F5F3"/></a:lt2>' +
        '<a:accent1><a:srgbClr val="2E6BE6"/></a:accent1><a:accent2><a:srgbClr val="E6A82E"/></a:accent2>' +
        '<a:accent3><a:srgbClr val="4CAF50"/></a:accent3><a:accent4><a:srgbClr val="E64C4C"/></a:accent4>' +
        '<a:accent5><a:srgbClr val="8E6BE6"/></a:accent5><a:accent6><a:srgbClr val="2EB8B8"/></a:accent6>' +
        '<a:hlink><a:srgbClr val="2E6BE6"/></a:hlink><a:folHlink><a:srgbClr val="8E6BE6"/></a:folHlink>' +
        '</a:clrScheme>' +
        '<a:fontScheme name="Redion">' +
        '<a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>' +
        '<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>' +
        '</a:fontScheme>' +
        '<a:fmtScheme name="Redion">' +
        '<a:fillStyleLst>' + '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3) +
        '</a:fillStyleLst>' +
        '<a:lnStyleLst>' +
        [6350, 12700, 19050].map(w => '<a:ln w="' + w + '" cap="flat" cmpd="sng" algn="ctr">' +
            '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>' +
            '<a:prstDash val="solid"/></a:ln>').join('') +
        '</a:lnStyleLst>' +
        '<a:effectStyleLst>' + '<a:effectStyle><a:effectLst/></a:effectStyle>'.repeat(3) +
        '</a:effectStyleLst>' +
        '<a:bgFillStyleLst>' + '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3) +
        '</a:bgFillStyleLst>' +
        '</a:fmtScheme></a:themeElements></a:theme>';
    const pptxBaum = (formen) => '<p:spTree>' +
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
        '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
        formen + '</p:spTree>';
    const PPTX_NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
    const pptxMaster = () => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<p:sldMaster ' + PPTX_NS + '>' +
        '<p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="lt1"/></a:solidFill>' +
        '<a:effectLst/></p:bgPr></p:bg>' + pptxBaum('') + '</p:cSld>' +
        '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" ' +
        'accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" ' +
        'hlink="hlink" folHlink="folHlink"/>' +
        '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>' +
        '<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>' +
        '</p:sldMaster>';
    const pptxLayout = () => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<p:sldLayout ' + PPTX_NS + ' type="blank" preserve="1">' +
        '<p:cSld name="Leer">' + pptxBaum('') + '</p:cSld>' +
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
    const pptxFolie = (titel, zeilen) => {
        const rahmen = (x, y, cx, cy) => '<a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/>';
        const form = (id, name, x, y, cx, cy, inhalt) => '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + esc(name) + '"/>' +
            '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>' +
            '<p:spPr><a:xfrm>' + rahmen(x, y, cx, cy) + '</a:xfrm>' +
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>' +
            '<p:txBody><a:bodyPr wrap="square"><a:normAutofit/></a:bodyPr><a:lstStyle/>' +
            inhalt + '</p:txBody></p:sp>';
        const rand = 838200;
        let id = 2, formen = '';
        if (titel) {
            formen += form(id++, 'Titel', rand, 457200, FOLIE_BREITE - 2 * rand, 1200000, '<a:p><a:pPr algn="l"/><a:r><a:rPr lang="de-DE" sz="4000" b="1" dirty="0"/>' +
                '<a:t>' + esc(titel) + '</a:t></a:r></a:p>');
        }
        const oben = titel ? 1828800 : 685800;
        const absaetze = zeilen.length
            ? zeilen.map((z) => '<a:p><a:pPr lvl="' + Math.max(0, Math.min(8, Number(z.tiefe) || 0)) + '"/>' +
                '<a:r><a:rPr lang="de-DE" sz="' + (z.art === 'kopf' ? 2800 : 2000) + '"' +
                (z.art === 'kopf' ? ' b="1"' : '') + ' dirty="0"/>' +
                '<a:t>' + esc(z.text) + '</a:t></a:r></a:p>').join('')
            : '<a:p><a:endParaRPr lang="de-DE"/></a:p>';
        formen += form(id++, 'Inhalt', rand, oben, FOLIE_BREITE - 2 * rand, FOLIE_HOEHE - oben - 457200, absaetze);
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<p:sld ' + PPTX_NS + '>' +
            '<p:cSld>' + pptxBaum(formen) + '</p:cSld>' +
            '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
    };
    const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
    const rels = (eintraege) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        eintraege + '</Relationships>';
    const rel = (id, art, ziel) => '<Relationship Id="' + id + '" Type="' + REL + art + '" Target="' + ziel + '"/>';
    const pptxTeile = (folien) => {
        const n = Math.max(1, folien.length);
        const nr = [];
        for (let i = 1; i <= n; i++)
            nr.push(i);
        const PML = 'application/vnd.openxmlformats-officedocument.presentationml.';
        const dateien = [
            { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                    '<Default Extension="xml" ContentType="application/xml"/>' +
                    '<Override PartName="/ppt/presentation.xml" ContentType="' + PML + 'presentation.main+xml"/>' +
                    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="' + PML + 'slideMaster+xml"/>' +
                    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="' + PML + 'slideLayout+xml"/>' +
                    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
                    nr.map(i => '<Override PartName="/ppt/slides/slide' + i + '.xml" ContentType="' +
                        PML + 'slide+xml"/>').join('') +
                    '</Types>' },
            { name: '_rels/.rels', inhalt: rels(rel('rId1', 'officeDocument', 'ppt/presentation.xml')) },
            { name: 'ppt/presentation.xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<p:presentation ' + PPTX_NS + '>' +
                    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
                    '<p:sldIdLst>' + nr.map(i => '<p:sldId id="' + (255 + i) + '" r:id="rId' + (i + 1) + '"/>').join('') +
                    '</p:sldIdLst>' +
                    '<p:sldSz cx="' + FOLIE_BREITE + '" cy="' + FOLIE_HOEHE + '"/>' +
                    '<p:notesSz cx="' + FOLIE_HOEHE + '" cy="' + FOLIE_BREITE + '"/>' +
                    '</p:presentation>' },
            { name: 'ppt/_rels/presentation.xml.rels', inhalt: rels(rel('rId1', 'slideMaster', 'slideMasters/slideMaster1.xml') +
                    nr.map(i => rel('rId' + (i + 1), 'slide', 'slides/slide' + i + '.xml')).join('') +
                    rel('rId' + (n + 2), 'theme', 'theme/theme1.xml')) },
            { name: 'ppt/slideMasters/slideMaster1.xml', inhalt: pptxMaster() },
            { name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', inhalt: rels(rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml') +
                    rel('rId2', 'theme', '../theme/theme1.xml')) },
            { name: 'ppt/slideLayouts/slideLayout1.xml', inhalt: pptxLayout() },
            { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', inhalt: rels(rel('rId1', 'slideMaster', '../slideMasters/slideMaster1.xml')) },
            { name: 'ppt/theme/theme1.xml', inhalt: pptxThema() }
        ];
        nr.forEach(i => {
            const f = folien[i - 1] || { titel: '', zeilen: [] };
            dateien.push({ name: 'ppt/slides/slide' + i + '.xml',
                inhalt: pptxFolie(String(f.titel || ''), f.zeilen || []) });
            dateien.push({ name: 'ppt/slides/_rels/slide' + i + '.xml.rels',
                inhalt: rels(rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml')) });
        });
        return dateien;
    };
    const folieMitText = (xml, marken) => {
        const spuren = (marken || []).filter((m) => m && m.art === 'text' && m.quelle && m.quelle.sp && typeof m.text === 'string');
        if (!spuren.length)
            return { xml, geschrieben: 0 };
        let doc;
        try {
            doc = new DOMParser().parseFromString(xml, 'application/xml');
            if (doc.getElementsByTagName('parsererror').length)
                return { xml, geschrieben: 0 };
        }
        catch {
            return { xml, geschrieben: 0 };
        }
        const formen = new Map();
        for (const sp of Array.from(doc.getElementsByTagName('p:sp'))) {
            const id = sp.getElementsByTagName('p:cNvPr')[0]?.getAttribute('id');
            if (id && !formen.has(id))
                formen.set(id, sp);
        }
        let geschrieben = 0;
        for (const m of spuren) {
            const sp = formen.get(String(m.quelle.sp));
            if (!sp)
                continue;
            const koerper = sp.getElementsByTagName('p:txBody')[0];
            if (!koerper)
                continue;
            const absatz = koerper.getElementsByTagName('a:p')[Number(m.quelle.p) || 0];
            if (!absatz)
                continue;
            const stellen = absatz.getElementsByTagName('a:t');
            if (stellen.length !== 1)
                continue;
            const stelle = stellen[0];
            if (stelle.textContent === m.text)
                continue;
            stelle.textContent = String(m.text);
            geschrieben++;
        }
        if (!geschrieben)
            return { xml, geschrieben: 0 };
        return { xml: new XMLSerializer().serializeToString(doc), geschrieben };
    };
    const originalPaket = async (seite) => {
        if (typeof Dateien === 'undefined' || !Dateien.alsBlob)
            return null;
        let kinder = [];
        try {
            kinder = Store.childrenOf(seite.id) || [];
        }
        catch {
            return null;
        }
        const anhang = kinder.find((k) => k && k.type === 'file' && k.original
            && /\.(pptx|ppsx|pptm|ppsm)$/i.test(String(k.text || '')));
        if (!anhang || !anhang.dateiId)
            return null;
        try {
            const blob = await Dateien.alsBlob(anhang.dateiId);
            if (!blob)
                return null;
            const puffer = await blob.arrayBuffer();
            const leser = await Einlesen.zipLesen(puffer);
            if (!leser || !leser.namen?.includes('ppt/presentation.xml'))
                return null;
            return { leser, name: String(anhang.text || '') };
        }
        catch {
            return null;
        }
    };
    const alsPowerPoint = async (seite) => {
        if (!seite || !seite.id)
            throw new Error('Ohne Seite gibt es nichts zu zeigen.');
        if (typeof Folien === 'undefined')
            throw new Error('Der Folien-Kern ist nicht geladen.');
        const dateiName = (seite.text || 'Vortrag').replace(/[\\/:*?"<>|]/g, '-') + '.pptx';
        const paket = await originalPaket(seite);
        if (paket) {
            const blaetter = (Store.childrenOf(seite.id) || [])
                .filter((k) => k && k.type === 'blatt');
            const folienNamen = paket.leser.namen
                .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
                .sort((a, b) => (Number(a.match(/(\d+)/)?.[1]) || 0) - (Number(b.match(/(\d+)/)?.[1]) || 0));
            const neueFolien = new Map();
            let geschrieben = 0;
            for (const [i, name] of folienNamen.entries()) {
                const blatt = blaetter[i];
                if (!blatt || !Array.isArray(blatt.marken) || !blatt.marken.length)
                    continue;
                try {
                    const alt = await paket.leser.text(name);
                    const neu = folieMitText(String(alt || ''), blatt.marken);
                    if (neu.geschrieben) {
                        neueFolien.set(name, neu.xml);
                        geschrieben += neu.geschrieben;
                    }
                }
                catch { }
            }
            const teile = [];
            for (const name of paket.leser.namen) {
                const ersetzt = neueFolien.get(name);
                if (ersetzt !== undefined) {
                    teile.push({ name, inhalt: ersetzt });
                    continue;
                }
                const teil = await paket.leser.rohBytes(name);
                if (!teil)
                    continue;
                teile.push({ name, ...teil });
            }
            const blob = await zipSchreiben(teile);
            laden(blob, dateiName);
            const folien = paket.leser.namen
                .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).length;
            const hinweis = geschrieben
                ? 'Die Originaldatei ist vollständig erhalten; '
                    + geschrieben + (geschrieben === 1 ? ' Textstelle wurde' : ' Textstellen wurden')
                    + ' übernommen. Formen ohne eindeutige Zuordnung stehen unverändert darin.'
                : 'Die Originaldatei ist vollständig erhalten. In Redion '
                    + 'geänderte Folieninhalte stehen noch nicht darin.';
            try {
                if (typeof UI !== 'undefined' && UI.toast)
                    UI.toast(hinweis, 7000);
            }
            catch { }
            return { blob, folien, durchgereicht: true, geschrieben, hinweis };
        }
        const roh = Folien.teilen(seite, (id) => Store.childrenOf(id));
        const folien = roh.map((f) => ({
            titel: f.titel, zeilen: Folien.alsZeilen(f, (id) => Store.childrenOf(id))
        }));
        const blob = await zipSchreiben(pptxTeile(folien));
        laden(blob, dateiName);
        return { blob, folien: folien.length, durchgereicht: false };
    };
    return { zipSchreiben, crc32, laden, alsWord, alsPowerPoint, pptxTeile, alsExcel,
        datenbankAlsExcel,
        allesAlsExcel, alsOds, datenbankAlsOds, odsBlatt, blattXml, spaltenName, wortInhalt,
        ausTrello, ausEvernote, ausAsana, ausAppleNotes, htmlZuMarkdown,
        ausMarkdownOrdner, alsObsidianVault, ausNotionZip, ausNotionJson,
        dialog, QUELLEN,
        grenzen };
})();
window.Austausch = Austausch;
