"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/dateien/einlesen.ts (npm run bauen:ts). */
const Einlesen = (() => {
    const istZip64 = (d, eocd) => eocd >= 20 && d.getUint32(eocd - 20, true) === 0x07064b50;
    const lies64 = (d, i) => d.getUint32(i, true) + d.getUint32(i + 4, true) * 4294967296;
    const zip64Zusatz = (d, extraStart, extraLaenge, roh, gepackt, versatz) => {
        let e = extraStart;
        const ende = extraStart + extraLaenge;
        while (e + 4 <= ende) {
            const kennung = d.getUint16(e, true);
            const laenge = d.getUint16(e + 2, true);
            if (kennung === 0x0001) {
                let f = e + 4;
                const rest = () => f + 8 <= e + 4 + laenge;
                if (roh === 0xFFFFFFFF && rest()) {
                    roh = lies64(d, f);
                    f += 8;
                }
                if (gepackt === 0xFFFFFFFF && rest()) {
                    gepackt = lies64(d, f);
                    f += 8;
                }
                if (versatz === 0xFFFFFFFF && rest()) {
                    versatz = lies64(d, f);
                    f += 8;
                }
                break;
            }
            e += 4 + laenge;
        }
        return { roh, gepackt, versatz };
    };
    const ZIP64_KAPUTT = 'Dieses Archiv nennt sich ZIP64, aber sein ZIP64-Schlusssatz fehlt oder ' +
        'ist beschädigt. Ohne ihn stünden im alten Schlusssatz nur Platzhalter, ' +
        'und Redion läse aus einem Archiv voller Dateien null Dateien heraus — ' +
        'ohne das zu merken. Lieber diese Meldung.';
    const schlussLesen = (d, eocd, z64Satz) => {
        const anzahl = d.getUint16(eocd + 10, true);
        const groesse = d.getUint32(eocd + 12, true);
        const start = d.getUint32(eocd + 16, true);
        if (!istZip64(d, eocd))
            return { anzahl, groesse, start, zip64: false };
        const s = z64Satz;
        if (!s || s.byteLength < 56 || s.getUint32(0, true) !== 0x06064b50)
            throw new Error(ZIP64_KAPUTT);
        return { anzahl: lies64(s, 32), groesse: lies64(s, 40),
            start: lies64(s, 48), zip64: true };
    };
    const z64Ort = (d, eocd) => lies64(d, eocd - 20 + 8);
    const vollzaehlig = (versprochen, gefunden) => {
        if (versprochen > 0 && gefunden === 0)
            throw new Error('Dieses Archiv kündigt ' + versprochen + ' Einträge an, ' +
                'hat aber keinen einzigen an der angegebenen Stelle. Es ist ' +
                'beschädigt oder unvollständig — Redion spielt lieber nichts ein, ' +
                'als so zu tun, als wäre es leer gewesen.');
    };
    const zipLesen = async (puffer) => {
        const d = new DataView(puffer);
        const bytes = new Uint8Array(puffer);
        let eocd = -1;
        for (let i = d.byteLength - 22; i >= Math.max(0, d.byteLength - 65558); i--) {
            if (d.getUint32(i, true) === 0x06054b50) {
                eocd = i;
                break;
            }
        }
        if (eocd < 0)
            throw new Error('Das ist kein gültiges ZIP-Archiv.');
        const z64 = istZip64(d, eocd) ? (() => {
            const o = z64Ort(d, eocd);
            return (o >= 0 && o + 56 <= d.byteLength)
                ? new DataView(puffer, o, 56) : null;
        })() : null;
        const schluss = schlussLesen(d, eocd, z64);
        const anzahl = schluss.anzahl;
        let zeiger = schluss.start;
        const dateien = new Map();
        for (let n = 0; n < anzahl; n++) {
            if (d.getUint32(zeiger, true) !== 0x02014b50)
                break;
            const methode = d.getUint16(zeiger + 10, true);
            const flags = d.getUint16(zeiger + 8, true);
            const crc = d.getUint32(zeiger + 16, true);
            const nameLaenge = d.getUint16(zeiger + 28, true);
            const extra = d.getUint16(zeiger + 30, true);
            const kommentar = d.getUint16(zeiger + 32, true);
            const name = ZipDetails.nameDecodieren(bytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge), flags);
            const echt = zip64Zusatz(d, zeiger + 46 + nameLaenge, extra, d.getUint32(zeiger + 24, true), d.getUint32(zeiger + 20, true), d.getUint32(zeiger + 42, true));
            const gepackt = echt.gepackt;
            const offset = echt.versatz;
            const lokalName = d.getUint16(offset + 26, true);
            const lokalExtra = d.getUint16(offset + 28, true);
            const start = offset + 30 + lokalName + lokalExtra;
            const roh = bytes.subarray(start, start + gepackt);
            dateien.set(name, { methode, roh, flags, crc, groesse: echt.roh });
            zeiger += 46 + nameLaenge + extra + kommentar;
        }
        vollzaehlig(anzahl, dateien.size);
        const holen = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann keine verschlüsselten ZIP-Einträge lesen.');
            let ergebnis;
            if (e.methode === 0)
                ergebnis = new Uint8Array(e.roh);
            else {
                if (e.methode !== 8)
                    throw new Error('Diese Packmethode kennt der Browser nicht.');
                if (!self.DecompressionStream)
                    throw new Error('Dieser Browser kann kein ZIP entpacken.');
                const strom = new Blob([e.roh]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
                ergebnis = new Uint8Array(await new Response(strom).arrayBuffer());
            }
            if (ZipDetails.crc32(ergebnis) !== (e.crc >>> 0))
                throw new Error('„' + name + '" ist beschädigt — die Prüfsumme stimmt nicht.');
            return ergebnis;
        };
        const eintrag = (name) => {
            const e = dateien.get(name);
            return e ? { methode: e.methode, groesse: e.groesse, crc: e.crc >>> 0, flags: e.flags,
                verschluesselt: ZipDetails.istVerschluesselt(e.flags) } : null;
        };
        const text = async (name) => {
            const b = await holen(name);
            return b ? new TextDecoder().decode(b) : null;
        };
        const rohBytes = (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann ihn nicht weiterreichen.');
            return { methode: e.methode, roh: new Uint8Array(e.roh), crc: e.crc >>> 0,
                groesse: e.groesse, gepackt: e.roh.length };
        };
        return { namen: [...dateien.keys()], holen, text, eintrag, rohBytes };
    };
    const zipLesenAusBlob = async (blob) => {
        const fensterStart = Math.max(0, blob.size - 65558);
        const ende = new DataView(await blob.slice(fensterStart).arrayBuffer());
        let eocd = -1;
        for (let i = ende.byteLength - 22; i >= 0; i--)
            if (ende.getUint32(i, true) === 0x06054b50) {
                eocd = i;
                break;
            }
        if (eocd < 0)
            throw new Error('Das ist kein gültiges ZIP-Archiv.');
        const z64 = istZip64(ende, eocd)
            ? await (async () => {
                const o = z64Ort(ende, eocd);
                if (o < 0 || o + 56 > blob.size)
                    return null;
                return new DataView(await blob.slice(o, o + 56).arrayBuffer());
            })()
            : null;
        const schluss = schlussLesen(ende, eocd, z64);
        const anzahl = schluss.anzahl;
        const vzGroesse = schluss.groesse;
        const vzStart = schluss.start;
        const vz = new DataView(await blob.slice(vzStart, vzStart + vzGroesse).arrayBuffer());
        const vzBytes = new Uint8Array(vz.buffer);
        const dateien = new Map();
        let zeiger = 0;
        for (let n = 0; n < anzahl; n++) {
            if (zeiger + 46 > vz.byteLength || vz.getUint32(zeiger, true) !== 0x02014b50)
                break;
            const methode = vz.getUint16(zeiger + 10, true);
            const flags = vz.getUint16(zeiger + 8, true);
            const crc = vz.getUint32(zeiger + 16, true);
            const nameLaenge = vz.getUint16(zeiger + 28, true);
            const extra = vz.getUint16(zeiger + 30, true);
            const kommentar = vz.getUint16(zeiger + 32, true);
            const name = ZipDetails.nameDecodieren(vzBytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge), flags);
            const echt = zip64Zusatz(vz, zeiger + 46 + nameLaenge, extra, vz.getUint32(zeiger + 24, true), vz.getUint32(zeiger + 20, true), vz.getUint32(zeiger + 42, true));
            dateien.set(name, { methode, gepackt: echt.gepackt, roh: echt.roh, offset: echt.versatz, flags, crc });
            zeiger += 46 + nameLaenge + extra + kommentar;
        }
        vollzaehlig(anzahl, dateien.size);
        const SCHEIBE = 1024 * 1024;
        const pruefsumme = async (name, b, soll) => {
            let z = ZipDetails.crc32Start();
            for (let von = 0; von < b.size; von += SCHEIBE)
                z = ZipDetails.crc32Weiter(z, new Uint8Array(await b.slice(von, Math.min(von + SCHEIBE, b.size)).arrayBuffer()));
            if (ZipDetails.crc32Fertig(z) !== (soll >>> 0))
                throw new Error('„' + name + '" ist beschädigt — die Prüfsumme stimmt nicht.');
        };
        const alsBlob = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann keine verschlüsselten ZIP-Einträge lesen.');
            const k = new DataView(await blob.slice(e.offset, e.offset + 30).arrayBuffer());
            const lokalName = k.getUint16(26, true);
            const lokalExtra = k.getUint16(28, true);
            const start = e.offset + 30 + lokalName + lokalExtra;
            const roh = blob.slice(start, start + e.gepackt);
            let ergebnis;
            if (e.methode === 0)
                ergebnis = roh;
            else {
                if (e.methode !== 8)
                    throw new Error('Diese Packmethode kennt der Browser nicht.');
                if (!self.DecompressionStream)
                    throw new Error('Dieser Browser kann kein ZIP entpacken.');
                const strom = roh.stream().pipeThrough(new DecompressionStream('deflate-raw'));
                ergebnis = await new Response(strom).blob();
            }
            await pruefsumme(name, ergebnis, e.crc);
            return ergebnis;
        };
        const holen = async (name) => {
            const b = await alsBlob(name);
            return b ? new Uint8Array(await b.arrayBuffer()) : null;
        };
        const text = async (name) => {
            const b = await alsBlob(name);
            return b ? await b.text() : null;
        };
        const groesse = (name) => {
            const e = dateien.get(name);
            return e && Number.isFinite(Number(e.roh)) ? Number(e.roh) : -1;
        };
        const eintrag = (name) => {
            const e = dateien.get(name);
            return e ? { methode: e.methode, groesse: Number(e.roh), gepackt: Number(e.gepackt), crc: e.crc >>> 0,
                flags: e.flags, verschluesselt: ZipDetails.istVerschluesselt(e.flags) } : null;
        };
        const rohBytes = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann ihn nicht weiterreichen.');
            const k = new DataView(await blob.slice(e.offset, e.offset + 30).arrayBuffer());
            const start = e.offset + 30 + k.getUint16(26, true) + k.getUint16(28, true);
            return { methode: e.methode, roh: blob.slice(start, start + e.gepackt), crc: e.crc >>> 0,
                groesse: Number(e.roh), gepackt: Number(e.gepackt) };
        };
        return { namen: [...dateien.keys()], alsBlob, holen, text, groesse, eintrag, rohBytes };
    };
    const xml = (t) => new DOMParser().parseFromString(t, 'application/xml');
    const spalteZuNummer = (bezug) => {
        const m = String(bezug).match(/^([A-Z]+)/);
        if (!m)
            return 0;
        let n = 0;
        for (const c of m[1] ?? '')
            n = n * 26 + (c.charCodeAt(0) - 64);
        return n - 1;
    };
    const neuerTabellenBericht = () => ({
        formeln: 0,
        ausgelassen: {
            formelnOhneAusdruck: 0, kommentare: 0, bedingteFormatierungen: 0,
            bilder: 0, diagramme: 0, makros: 0, zellformate: 0,
            verbundeneZellen: 0
        }
    });
    const berichtAn = (blaetter, bericht) => {
        blaetter.bericht = bericht;
        return blaetter;
    };
    const tabellenBerichtText = (bericht) => {
        if (!bericht)
            return '';
        const namen = {
            formelnOhneAusdruck: 'Formeln ohne Redion-kompatiblen Ausdruck',
            kommentare: 'Zellkommentare',
            bedingteFormatierungen: 'bedingte Formatierungen',
            bilder: 'Bilder', diagramme: 'Diagramme', makros: 'Makros',
            zellformate: 'nicht unterstützte Zellformate',
            verbundeneZellen: 'verbundene Zellen'
        };
        const verloren = Object.entries(bericht.ausgelassen || {})
            .filter(([, n]) => Number(n) > 0)
            .map(([k, n]) => `${n} ${namen[k] || k}`);
        const teile = [];
        if (bericht.formeln)
            teile.push(`${bericht.formeln} Formeln werden als Formeln übernommen`);
        if (verloren.length)
            teile.push('Nicht übernommen: ' + verloren.join(' · '));
        return teile.join('\n');
    };
    const paketZiel = (quelle, ziel) => {
        if (ziel.startsWith('/'))
            return ziel.replace(/^\/+/, '');
        const teile = quelle.split('/');
        teile.pop();
        for (const t of ziel.replace(/\\/g, '/').split('/')) {
            if (!t || t === '.')
                continue;
            if (t === '..')
                teile.pop();
            else
                teile.push(t);
        }
        return teile.join('/');
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
    const formelAusOds = (roh) => {
        let f = String(roh ?? '').trim();
        if (!f)
            return null;
        f = f.replace(/^[A-Za-z0-9_-]+:=/, '');
        f = formelAussen(f, teil => teil
            .replace(/\[\.(\$?[A-Z]{1,3}\$?\d+):\.(\$?[A-Z]{1,3}\$?\d+)\]/g, '$1:$2')
            .replace(/\[\.(\$?[A-Z]{1,3}\$?\d+)\]/g, '$1'));
        if (formelAussen(f, teil => /[\[\]]/.test(teil) ? '[' : '').includes('['))
            return null;
        return '=' + f.replace(/^=/, '');
    };
    const ODS_MAX_WIEDERHOLUNG = 1024;
    const odsLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const bericht = neuerTabellenBericht();
        const text = await zip.text('content.xml');
        if (!text)
            throw new Error('Diese .ods-Datei hat keine content.xml — ' +
                'entweder ist sie beschädigt oder es ist keine.');
        const doc = xml(text);
        bericht.ausgelassen.bilder = zip.namen.filter((n) => /^Pictures\/.+/.test(n)).length;
        bericht.ausgelassen.diagramme = doc.getElementsByTagName('draw:object').length;
        bericht.ausgelassen.makros = zip.namen.filter((n) => /^(Basic|Scripts)\//.test(n)).length;
        bericht.ausgelassen.kommentare = doc.getElementsByTagName('office:annotation').length;
        bericht.ausgelassen.bedingteFormatierungen = doc.getElementsByTagName('style:map').length;
        bericht.ausgelassen.verbundeneZellen = [...doc.getElementsByTagName('table:table-cell')]
            .filter(c => +(c.getAttribute('table:number-columns-spanned') || 1) > 1 ||
            +(c.getAttribute('table:number-rows-spanned') || 1) > 1).length;
        const zellStil = new Map();
        const zellStilVerlust = new Set();
        {
            const daten = new Map();
            for (const n of [...doc.getElementsByTagName('number:percentage-style')]) {
                const dp = +(n.getElementsByTagName('number:number')[0]
                    ?.getAttribute('number:decimal-places') || 0);
                daten.set(n.getAttribute('style:name') || '', { art: 'prozent', stellen: dp });
            }
            for (const n of [...doc.getElementsByTagName('number:currency-style')]) {
                const dp = +(n.getElementsByTagName('number:number')[0]
                    ?.getAttribute('number:decimal-places') || 0);
                const sym = (n.getElementsByTagName('number:currency-symbol')[0]
                    ?.textContent || 'CHF').trim();
                daten.set(n.getAttribute('style:name') || '', { art: 'waehrung', stellen: dp, waehrung: sym });
            }
            for (const s of [...doc.getElementsByTagName('style:style')]) {
                if (s.getAttribute('style:family') !== 'table-cell')
                    continue;
                const stilName = s.getAttribute('style:name') || '';
                const st = {};
                const schrift = s.getElementsByTagName('style:text-properties')[0];
                if (schrift?.getAttribute('fo:font-weight') === 'bold')
                    st.fett = true;
                if (schrift?.getAttribute('fo:font-style') === 'italic')
                    st.kursiv = true;
                const absatz = s.getElementsByTagName('style:paragraph-properties')[0];
                const quer = absatz?.getAttribute('fo:text-align') || '';
                if (quer === 'start' || quer === 'left')
                    st.ausrichtung = 'links';
                if (quer === 'center')
                    st.ausrichtung = 'mitte';
                if (quer === 'end' || quer === 'right')
                    st.ausrichtung = 'rechts';
                const dsn = s.getAttribute('style:data-style-name');
                if (dsn && daten.has(dsn))
                    st.format = daten.get(dsn);
                if (Object.keys(st).length)
                    zellStil.set(stilName, st);
                const zellEig = s.getElementsByTagName('style:table-cell-properties')[0];
                if ((schrift && [...schrift.attributes].some(a => !['fo:font-weight', 'fo:font-style'].includes(a.name))) ||
                    (zellEig && zellEig.attributes.length) ||
                    (absatz && [...absatz.attributes].some(a => a.name !== 'fo:text-align')) ||
                    (dsn && !daten.has(dsn)))
                    zellStilVerlust.add(stilName);
            }
        }
        const tabellen = [...doc.getElementsByTagName('table:table')];
        const blaetter = [];
        for (const tab of tabellen) {
            const name = tab.getAttribute('table:name') || 'Blatt';
            const zeilen = [];
            const stile = [];
            const formeln = [];
            for (const row of [...tab.getElementsByTagName('table:table-row')]) {
                const wieOft = Math.min(Number(row.getAttribute('table:number-rows-repeated') || 1) || 1, ODS_MAX_WIEDERHOLUNG);
                const werte = [];
                const stilWerte = [];
                const formelWerte = [];
                for (const c of [...row.getElementsByTagName('table:table-cell')]) {
                    const malSo = Math.min(Number(c.getAttribute('table:number-columns-repeated') || 1) || 1, ODS_MAX_WIEDERHOLUNG);
                    const zahl = c.getAttribute('office:value');
                    const absatzIstKommentar = (p) => {
                        let el = p.parentElement;
                        while (el && el !== c) {
                            if (el.localName === 'annotation' || el.tagName === 'office:annotation')
                                return true;
                            el = el.parentElement;
                        }
                        return false;
                    };
                    const wert = zahl !== null && zahl !== ''
                        ? Number(zahl)
                        : [...c.getElementsByTagName('text:p')]
                            .filter(p => !absatzIstKommentar(p))
                            .map(x => x.textContent ?? '').join('\n');
                    const stName = c.getAttribute('table:style-name');
                    const st = stName ? (zellStil.get(stName) ?? null) : null;
                    const formelAttribut = c.getAttribute('table:formula');
                    const formel = formelAttribut ? formelAusOds(formelAttribut) : null;
                    const vorkommen = malSo * wieOft;
                    if (formelAttribut) {
                        if (formel)
                            bericht.formeln += vorkommen;
                        else
                            bericht.ausgelassen.formelnOhneAusdruck += vorkommen;
                    }
                    if (stName && zellStilVerlust.has(stName))
                        bericht.ausgelassen.zellformate += vorkommen;
                    for (let i = 0; i < malSo; i++) {
                        werte.push(wert);
                        stilWerte.push(st);
                        formelWerte.push(formel);
                    }
                }
                while (werte.length && (werte[werte.length - 1] === '' ||
                    werte[werte.length - 1] === undefined) &&
                    !formelWerte[werte.length - 1] && !stilWerte[werte.length - 1])
                    werte.pop();
                stilWerte.length = werte.length;
                formelWerte.length = werte.length;
                for (let i = 0; i < wieOft; i++) {
                    zeilen.push([...werte]);
                    stile.push([...stilWerte]);
                    formeln.push([...formelWerte]);
                }
            }
            while (zeilen.length && !(zeilen[zeilen.length - 1] ?? []).length)
                zeilen.pop();
            stile.length = zeilen.length;
            formeln.length = zeilen.length;
            blaetter.push({ name, zeilen, stile, formeln });
        }
        return berichtAn(blaetter, bericht);
    };
    const xlsxLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const bericht = neuerTabellenBericht();
        bericht.ausgelassen.bilder = zip.namen.filter((n) => /^xl\/media\/.+/.test(n)).length;
        bericht.ausgelassen.diagramme = zip.namen.filter((n) => /^xl\/charts\/.+\.xml$/i.test(n)).length;
        bericht.ausgelassen.makros = zip.namen.filter((n) => /vbaProject\.bin$/i.test(n)).length;
        for (const name of zip.namen.filter((n) => /^xl\/comments\d*\.xml$/i.test(n))) {
            const kommentarText = await zip.text(name);
            if (kommentarText)
                bericht.ausgelassen.kommentare += xml(kommentarText).querySelectorAll('comment').length;
        }
        const stText = await zip.text('xl/sharedStrings.xml');
        const gemeinsam = [];
        if (stText) {
            xml(stText).querySelectorAll('si').forEach(si => {
                gemeinsam.push([...si.querySelectorAll('t')].map(t => t.textContent ?? '').join(''));
            });
        }
        const stilText = await zip.text('xl/styles.xml');
        let xfListe = [];
        let xfVerlust = [];
        if (stilText) {
            const sdoc = xml(stilText);
            const schriften = [...sdoc.querySelectorAll('fonts > font')].map(f => ({
                fett: !!f.querySelector('b'), kursiv: !!f.querySelector('i')
            }));
            const eigene = new Map();
            sdoc.querySelectorAll('numFmts > numFmt').forEach(n => eigene.set(n.getAttribute('numFmtId') || '', n.getAttribute('formatCode') || ''));
            const formatVon = (id) => {
                if (!id)
                    return undefined;
                if (id === 9)
                    return { art: 'prozent', stellen: 0 };
                if (id === 10)
                    return { art: 'prozent', stellen: 2 };
                const code = eigene.get(String(id)) || '';
                if (!code)
                    return undefined;
                if (code.includes('%')) {
                    const m = /0\.(0+)%/.exec(code);
                    return { art: 'prozent', stellen: m && m[1] ? m[1].length : 0 };
                }
                const w = /"([^"]+)"/.exec(code);
                if (w && w[1]) {
                    const m = /0\.(0+)/.exec(code);
                    return { art: 'waehrung', stellen: m && m[1] ? m[1].length : 0,
                        waehrung: w[1].trim() };
                }
                return undefined;
            };
            xfListe = [...sdoc.querySelectorAll('cellXfs > xf')].map(x => {
                const schrift = schriften[+(x.getAttribute('fontId') || 0)] ||
                    { fett: false, kursiv: false };
                const quer = x.querySelector('alignment')?.getAttribute('horizontal') || '';
                const aus = quer === 'left' ? 'links' : quer === 'center' ? 'mitte'
                    : quer === 'right' ? 'rechts' : undefined;
                const format = formatVon(+(x.getAttribute('numFmtId') || 0));
                const st = {};
                if (schrift.fett)
                    st.fett = true;
                if (schrift.kursiv)
                    st.kursiv = true;
                if (aus)
                    st.ausrichtung = aus;
                if (format)
                    st.format = format;
                return Object.keys(st).length ? st : null;
            });
            xfVerlust = [...sdoc.querySelectorAll('cellXfs > xf')].map(x => {
                const numFmtId = +(x.getAttribute('numFmtId') || 0);
                const originalFont = sdoc.querySelectorAll('fonts > font')[+(x.getAttribute('fontId') || 0)];
                const ausrichtung = x.querySelector('alignment');
                const unbekannteAusrichtung = !!ausrichtung && [...ausrichtung.attributes]
                    .some(a => a.name !== 'horizontal');
                const unbekannteSchrift = !!originalFont && !!originalFont.querySelector('color,u,strike,vertAlign');
                return +(x.getAttribute('fillId') || 0) > 0 ||
                    +(x.getAttribute('borderId') || 0) > 0 ||
                    !!x.querySelector('protection') || unbekannteAusrichtung ||
                    unbekannteSchrift || (!!numFmtId && !formatVon(numFmtId));
            });
        }
        const wbText = await zip.text('xl/workbook.xml');
        const meta = [];
        if (wbText)
            xml(wbText).querySelectorAll('sheet').forEach(s => meta.push({
                name: s.getAttribute('name') || '',
                id: s.getAttribute('r:id') ||
                    s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || ''
            }));
        const beziehungen = new Map();
        const relText = await zip.text('xl/_rels/workbook.xml.rels');
        if (relText)
            xml(relText).querySelectorAll('Relationship').forEach(r => {
                if (r.getAttribute('TargetMode') === 'External')
                    return;
                const id = r.getAttribute('Id') || '';
                const ziel = r.getAttribute('Target') || '';
                if (id && ziel)
                    beziehungen.set(id, paketZiel('xl/workbook.xml', ziel));
            });
        const blaetter = [];
        const rueckfall = zip.namen.filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
            .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
        const blattDateien = meta.length
            ? meta.map((m, i) => ({ name: m.name || ('Blatt ' + (i + 1)),
                datei: beziehungen.get(m.id) || rueckfall[i] || '' }))
                .filter(x => !!x.datei && zip.namen.includes(x.datei))
            : rueckfall.map((datei, i) => ({ name: 'Blatt ' + (i + 1), datei }));
        for (let i = 0; i < blattDateien.length; i++) {
            const quelle = blattDateien[i];
            const t = await zip.text(quelle.datei);
            if (!t)
                continue;
            const doc = xml(t);
            const zeilen = [];
            const stile = [];
            const formeln = [];
            bericht.ausgelassen.bedingteFormatierungen += doc.querySelectorAll('conditionalFormatting').length;
            bericht.ausgelassen.verbundeneZellen += doc.querySelectorAll('mergeCell').length;
            doc.querySelectorAll('row').forEach(row => {
                const werte = [];
                const stilWerte = [];
                const formelWerte = [];
                row.querySelectorAll('c').forEach(c => {
                    const spalte = spalteZuNummer(c.getAttribute('r') || '');
                    const typ = c.getAttribute('t');
                    let wert = '';
                    if (typ === 's') {
                        const idx = +(c.querySelector('v')?.textContent || -1);
                        wert = gemeinsam[idx] ?? '';
                    }
                    else if (typ === 'inlineStr') {
                        wert = [...c.querySelectorAll('t')].map(x => x.textContent).join('');
                    }
                    else {
                        wert = c.querySelector('v')?.textContent || '';
                    }
                    werte[spalte] = wert;
                    const sIx = c.getAttribute('s');
                    stilWerte[spalte] = sIx !== null ? (xfListe[+sIx] ?? null) : null;
                    if (sIx !== null && xfVerlust[+sIx])
                        bericht.ausgelassen.zellformate++;
                    const f = c.querySelector('f');
                    if (f) {
                        const ausdruck = (f.textContent || '').trim();
                        formelWerte[spalte] = ausdruck ? '=' + ausdruck : null;
                        if (ausdruck)
                            bericht.formeln++;
                        else
                            bericht.ausgelassen.formelnOhneAusdruck++;
                    }
                    else
                        formelWerte[spalte] = null;
                });
                for (let k = 0; k < werte.length; k++) {
                    if (werte[k] === undefined)
                        werte[k] = '';
                    if (stilWerte[k] === undefined)
                        stilWerte[k] = null;
                    if (formelWerte[k] === undefined)
                        formelWerte[k] = null;
                }
                stile.push(stilWerte);
                formeln.push(formelWerte);
                zeilen.push(werte);
            });
            blaetter.push({ name: quelle.name, zeilen, stile, formeln });
        }
        return berichtAn(blaetter, bericht);
    };
    const absatzText = (absatz) => {
        const laeufe = [];
        for (const r of absatz.getElementsByTagName('w:r')) {
            const eig = r.getElementsByTagName('w:rPr')[0];
            const an = (name) => {
                const e = eig?.getElementsByTagName('w:' + name)[0];
                if (!e)
                    return false;
                const v = e.getAttribute('w:val');
                return v !== '0' && v !== 'false' && v !== 'none';
            };
            let text = '';
            for (const kind of r.children) {
                if (kind.tagName === 'w:t')
                    text += kind.textContent || '';
                else if (kind.tagName === 'w:tab')
                    text += '\t';
                else if (kind.tagName === 'w:br')
                    text += ' ';
            }
            if (!text)
                continue;
            const schrift = String(eig?.getElementsByTagName('w:rFonts')[0]
                ?.getAttribute('w:ascii') || '');
            const fest = /consol|courier|mono|menlo|liberation mono/i.test(schrift);
            laeufe.push({ text, fett: an('b'), kursiv: an('i'), durch: an('strike'),
                code: fest });
        }
        const glatt = [];
        for (const l of laeufe) {
            const vor = glatt[glatt.length - 1];
            if (vor && vor.fett === l.fett && vor.kursiv === l.kursiv &&
                vor.durch === l.durch && vor.code === l.code)
                vor.text += l.text;
            else
                glatt.push({ ...l });
        }
        return Inline.schreiben(glatt).trim();
    };
    const docxLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const t = await zip.text('word/document.xml');
        if (!t)
            throw new Error('In dieser Datei steckt kein Word-Dokument.');
        const doc = xml(t);
        const bloecke = [];
        const koerper = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
        let nr = -1;
        for (const knoten of koerper.children) {
            const tag = knoten.tagName;
            nr++;
            if (tag === 'w:p') {
                const text = absatzText(knoten);
                const stil = knoten.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
                const nummeriert = knoten.getElementsByTagName('w:numPr').length > 0;
                if (!text)
                    continue;
                const spur = knoten.getElementsByTagName('w:t').length === 1
                    ? { quelle: { p: nr } } : {};
                if (/^Heading1|^berschrift1|^Title/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'h1', text, ...spur });
                else if (/^Heading2|^berschrift2/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'h2', text, ...spur });
                else if (/^Heading[3-6]|^berschrift[3-6]/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'h3', text, ...spur });
                else if (/Quote|Zitat/i.test(stil))
                    bloecke.push({ typ: 'quote', text, ...spur });
                else if (/ListNumber|ListeNummer|NummerierteListe/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'number', text, ...spur });
                else if (nummeriert || /List|Liste|Aufz/i.test(stil))
                    bloecke.push({ typ: 'bullet', text, ...spur });
                else
                    bloecke.push({ typ: 'text', text, ...spur });
            }
            if (tag === 'w:tbl') {
                const zeilen = [];
                for (const tr of knoten.getElementsByTagName('w:tr')) {
                    const zelle = [];
                    for (const tc of tr.getElementsByTagName('w:tc')) {
                        zelle.push([...tc.getElementsByTagName('w:t')].map(x => x.textContent).join('').trim());
                    }
                    if (zelle.length)
                        zeilen.push(zelle);
                }
                if (zeilen.length)
                    bloecke.push({ typ: 'table', rows: zeilen });
            }
        }
        return bloecke;
    };
    const emuZuPunkt = (wert) => Math.round((Number(wert) || 0) / 12700 * 100) / 100;
    const relsLesen = async (zip, teil) => {
        const schraeg = teil.lastIndexOf('/');
        const ordner = schraeg < 0 ? '' : teil.slice(0, schraeg);
        const pfad = (ordner ? ordner + '/' : '') + '_rels/' +
            teil.slice(schraeg + 1) + '.rels';
        const t = await zip.text(pfad);
        const karte = {};
        if (!t)
            return karte;
        for (const r of xml(t).getElementsByTagName('Relationship')) {
            const id = r.getAttribute('Id');
            let ziel = r.getAttribute('Target') || '';
            if (!id || !ziel)
                continue;
            if (!ziel.startsWith('/')) {
                const teile = (ordner ? ordner.split('/') : []);
                for (const stueck of ziel.split('/')) {
                    if (stueck === '..')
                        teile.pop();
                    else if (stueck !== '.')
                        teile.push(stueck);
                }
                ziel = teile.join('/');
            }
            else
                ziel = ziel.slice(1);
            karte[id] = ziel;
        }
        return karte;
    };
    const absaetzeLesen = (txBody, thema = {}, paar = { major: '', minor: '' }) => {
        const raus = [];
        for (const absatz of txBody.getElementsByTagName('a:p')) {
            let text = '';
            const laeufe = [];
            const laufAnhaengen = (stueck, eigen) => {
                if (!stueck)
                    return;
                const g = Number(eigen?.getAttribute('sz'));
                const f = eigen ? [...eigen.children].find(k => k.tagName === 'a:solidFill') : undefined;
                const c = farbeAus(f, thema);
                laeufe.push({ text: stueck,
                    sz: Number.isFinite(g) && g > 0 ? Math.round(g / 100) : 0,
                    fett: eigen?.getAttribute('b') === '1', farbe: c,
                    schrift: schriftFamilie(schriftName(eigen, paar)) });
            };
            for (const kind of absatz.children) {
                if (kind.tagName === 'a:r' || kind.tagName === 'a:fld') {
                    const stueck = kind.getElementsByTagName('a:t')[0]?.textContent || '';
                    text += stueck;
                    laufAnhaengen(stueck, kind.getElementsByTagName('a:rPr')[0]);
                }
                else if (kind.tagName === 'a:br') {
                    text += '\n';
                    laufAnhaengen('\n', kind.getElementsByTagName('a:rPr')[0]);
                }
            }
            const pPr = [...absatz.children].find(k => k.tagName === 'a:pPr');
            const lauf = [...absatz.children].find(k => k.tagName === 'a:r');
            const rPr = lauf?.getElementsByTagName('a:rPr')[0];
            const sz = Number(rPr?.getAttribute('sz'));
            const fuellung = rPr ? [...rPr.children].find(k => k.tagName === 'a:solidFill') : undefined;
            const rgb = farbeAus(fuellung, thema).replace('#', '');
            let zeichen = '';
            if (pPr && !pPr.getElementsByTagName('a:buNone')[0]) {
                const buChar = pPr.getElementsByTagName('a:buChar')[0]?.getAttribute('char');
                if (buChar)
                    zeichen = buChar;
                else if (pPr.getElementsByTagName('a:buAutoNum')[0])
                    zeichen = '·';
            }
            raus.push({ text,
                sz: Number.isFinite(sz) && sz > 0 ? Math.round(sz / 100) : 0,
                fett: rPr?.getAttribute('b') === '1',
                farbe: rgb ? '#' + rgb : '',
                lvl: Math.max(0, Math.min(8, Number(pPr?.getAttribute('lvl')) || 0)),
                zeichen, ausricht: absatzAusricht(pPr), laeufe,
                schrift: schriftFamilie(schriftName(rPr, paar)) });
        }
        while (raus.length && !raus[raus.length - 1]?.text.trim())
            raus.pop();
        return raus;
    };
    const formText = (txBody) => absaetzeLesen(txBody).map(a => a.text).join('\n');
    const absatzAusricht = (pPr) => {
        const algn = pPr?.getAttribute('algn') || '';
        if (algn === 'ctr')
            return 'mitte';
        if (algn === 'r')
            return 'rechts';
        return '';
    };
    const tabelleLesen = (frame, thema, grund) => {
        const tbl = frame.getElementsByTagName('a:tbl')[0];
        if (!tbl)
            return [];
        const xfrm = frame.getElementsByTagName('p:xfrm')[0]
            || frame.getElementsByTagName('a:xfrm')[0];
        const off = xfrm?.getElementsByTagName('a:off')[0];
        if (!off)
            return [];
        const x0 = emuZuPunkt(off.getAttribute('x'));
        const y0 = emuZuPunkt(off.getAttribute('y'));
        const spalten = [...tbl.getElementsByTagName('a:gridCol')]
            .map(c => emuZuPunkt(c.getAttribute('w')));
        if (!spalten.length)
            return [];
        const raus = [];
        const zeilen = [...tbl.getElementsByTagName('a:tr')];
        let y = y0;
        for (let r = 0; r < zeilen.length; r++) {
            const tr = zeilen[r];
            const hoehe = emuZuPunkt(tr.getAttribute('h')) || 20;
            let x = x0;
            let c = 0;
            for (const tc of [...tr.children].filter(k => k.tagName === 'a:tc')) {
                const breite = spalten[c] ?? 0;
                if (tc.getAttribute('hMerge') === '1' || tc.getAttribute('vMerge') === '1') {
                    x += breite;
                    c++;
                    continue;
                }
                const spanne = Math.max(1, Number(tc.getAttribute('gridSpan')) || 1);
                let voll = 0;
                for (let i = 0; i < spanne; i++)
                    voll += spalten[c + i] ?? 0;
                const reihen = Math.max(1, Number(tc.getAttribute('rowSpan')) || 1);
                let hoch = 0;
                for (let i = 0; i < reihen; i++)
                    hoch += emuZuPunkt(zeilen[r + i]?.getAttribute('h')) || hoehe;
                const tcPr = [...tc.children].find(k => k.tagName === 'a:tcPr');
                const fuell = tcPr ? [...tcPr.children].find(k => k.tagName === 'a:solidFill') : undefined;
                const fuellung = farbeAus(fuell, thema);
                raus.push({ art: 'rectangle', x, y, w: voll, h: hoch,
                    farbe: '#9aa3ad', ...(fuellung ? { fuellung } : {}) });
                const txBody = tc.getElementsByTagName('a:txBody')[0];
                const absaetze = txBody ? absaetzeLesen(txBody, thema) : [];
                const text = absaetze.map(a => a.text).join('\n').trim();
                if (text) {
                    const a0 = absaetze.find(a => a.text.trim()) || absaetze[0];
                    raus.push({ art: 'text', text,
                        x: x + 7.2, y: y + 3.6,
                        breiteBox: Math.max(12, voll - 14.4),
                        fontSize: a0.sz || 12, fett: a0.fett,
                        ...((a0.farbe || grund) ? { farbe: a0.farbe || grund } : {}),
                        ...(a0.ausricht ? { ausricht: a0.ausricht } : {}) });
                }
                x += voll;
                c += spanne;
            }
            y += hoehe;
        }
        return raus;
    };
    const schriftpaarLesen = (themaDoc) => {
        const schema = themaDoc?.getElementsByTagName('a:fontScheme')[0];
        const namen = (tag) => schema?.getElementsByTagName(tag)[0]
            ?.getElementsByTagName('a:latin')[0]?.getAttribute('typeface') || '';
        return { major: namen('a:majorFont'), minor: namen('a:minorFont') };
    };
    const SCHRIFT_SERIF = new Set([
        'georgia', 'times new roman', 'times', 'garamond', 'eb garamond',
        'adobe garamond pro', 'cambria', 'constantia', 'book antiqua', 'palatino',
        'palatino linotype', 'bookman old style', 'century', 'century schoolbook',
        'baskerville', 'libre baskerville', 'merriweather', 'playfair display',
        'source serif pro', 'pt serif', 'noto serif', 'droid serif', 'lora',
        'spectral', 'crimson text', 'minion pro', 'sabon', 'utopia', 'cardo',
        'charter', 'charis sil', 'liberation serif', 'dejavu serif', 'freeserif',
        'stix two text', 'literata', 'newsreader', 'domine', 'arvo', 'rockwell',
    ]);
    const SCHRIFT_MONO = new Set([
        'consolas', 'courier new', 'courier', 'menlo', 'monaco', 'lucida console',
        'andale mono', 'dejavu sans mono', 'liberation mono', 'source code pro',
        'fira code', 'jetbrains mono', 'ibm plex mono', 'cascadia code', 'sf mono',
    ]);
    const SCHRIFT_HAND = new Set([
        'comic sans ms', 'segoe print', 'segoe script', 'bradley hand',
        'brush script mt', 'lucida handwriting', 'ink free', 'caveat',
        'dancing script', 'pacifico', 'kalam', 'patrick hand',
    ]);
    const SCHRIFT_SCHMAL = new Set([
        'arial narrow', 'roboto condensed', 'helvetica neue condensed',
        'oswald', 'barlow condensed', 'fira sans condensed', 'pt sans narrow',
        'archivo narrow', 'liberation sans narrow',
    ]);
    const schriftFamilie = (roh) => {
        const name = String(roh || '').trim().toLowerCase();
        if (!name)
            return '';
        if (SCHRIFT_MONO.has(name) || /\bmono\b/.test(name))
            return 'mono';
        if (SCHRIFT_HAND.has(name) || /\b(script|hand)\b/.test(name))
            return 'hand';
        if (SCHRIFT_SCHMAL.has(name) || /\b(condensed|narrow)\b/.test(name))
            return 'schmal';
        if (SCHRIFT_SERIF.has(name) || /\bserif\b/.test(name))
            return 'serif';
        return '';
    };
    const schriftName = (pr, paar) => {
        const roh = pr?.getElementsByTagName('a:latin')[0]?.getAttribute('typeface') || '';
        if (roh === '+mj-lt')
            return paar.major;
        if (roh === '+mn-lt')
            return paar.minor;
        return roh;
    };
    const FORMEN = {
        rect: 'rectangle', roundRect: 'roundrect', round1Rect: 'roundrect',
        round2SameRect: 'roundrect', round2DiagRect: 'roundrect', snip1Rect: 'rectangle',
        ellipse: 'ellipse', triangle: 'triangle', rtTriangle: 'triangle',
        line: 'line', straightConnector1: 'line',
    };
    const formGeometrie = (form) => {
        const spPr = form.getElementsByTagName('p:spPr')[0];
        if (!spPr)
            return '';
        const geom = [...spPr.children].find(k => k.tagName === 'a:prstGeom');
        if (!geom)
            return 'rectangle';
        return FORMEN[geom.getAttribute('prst') || ''] || '';
    };
    const formRand = (form, thema) => {
        const spPr = form.getElementsByTagName('p:spPr')[0];
        const ln = spPr ? [...spPr.children].find(k => k.tagName === 'a:ln') : undefined;
        if (!ln)
            return null;
        if ([...ln.children].some(k => k.tagName === 'a:noFill'))
            return null;
        const voll = [...ln.children].find(k => k.tagName === 'a:solidFill');
        const farbe = farbeAus(voll, thema);
        if (!farbe)
            return null;
        const roh = Number(ln.getAttribute('w'));
        const breite = Number.isFinite(roh) && roh > 0
            ? Math.max(0.5, Math.round((roh / 12700) * 10) / 10) : 1;
        return { farbe, breite };
    };
    const formDrehung = (form) => {
        const xfrm = form.getElementsByTagName('a:xfrm')[0];
        const roh = Number(xfrm?.getAttribute('rot'));
        if (!Number.isFinite(roh) || roh === 0)
            return 0;
        const grad = Math.round((roh / 60000) * 100) / 100;
        return ((grad % 360) + 360) % 360;
    };
    const formLage = (form) => {
        const xfrm = form.getElementsByTagName('a:xfrm')[0];
        if (!xfrm)
            return null;
        const off = xfrm.getElementsByTagName('a:off')[0];
        const ext = xfrm.getElementsByTagName('a:ext')[0];
        if (!off || !ext)
            return null;
        return { x: emuZuPunkt(off.getAttribute('x')), y: emuZuPunkt(off.getAttribute('y')),
            w: emuZuPunkt(ext.getAttribute('cx')), h: emuZuPunkt(ext.getAttribute('cy')) };
    };
    const UEBERGAENGE = {
        cut: 'keine',
        fade: 'blenden', dissolve: 'blenden', fadeThroughBlack: 'blenden',
        push: 'schieben', pull: 'schieben',
        cover: 'decken', uncover: 'decken',
        wipe: 'wischen', strips: 'wischen', blinds: 'wischen', comb: 'wischen',
        zoom: 'zoom', newsflash: 'zoom'
    };
    const GEGENRICHTUNG = { l: 'r', r: 'l', u: 'd', d: 'u' };
    const SPD_MS = { slow: 1000, med: 700, fast: 400 };
    const uebergangLesen = (doc) => {
        const alle = Array.from(doc.getElementsByTagName('p:transition'));
        if (!alle.length)
            return null;
        let erster = null;
        for (const knoten of alle) {
            const effekt = Array.from(knoten.children)
                .find(k => k.localName !== 'sndAc' && k.localName !== 'extLst');
            if (!effekt)
                continue;
            const name = effekt.localName || '';
            const spd = String(knoten.getAttribute('spd') || 'med');
            const roh = Number(knoten.getAttribute('p14:dur')
                || knoten.getAttributeNS('http://schemas.microsoft.com/office/powerpoint/2010/main', 'dur'));
            const dauer = Math.round(Math.max(150, Math.min(3000, Number.isFinite(roh) && roh > 0 ? roh : (SPD_MS[spd] ?? 700))));
            const dir = String(effekt.getAttribute('dir') || '');
            const art = UEBERGAENGE[name];
            const eintrag = { art: art || 'blenden', dauer, original: name };
            if (dir && /^[lrud]$/.test(dir))
                eintrag.richtung = (name === 'pull' || name === 'uncover')
                    ? (GEGENRICHTUNG[dir] ?? dir) : dir;
            if (!erster)
                erster = eintrag;
            if (art)
                return (erster && erster.original !== eintrag.original)
                    ? { ...eintrag, statt: erster.original } : eintrag;
        }
        return erster;
    };
    const klickschritte = (doc) => {
        const karte = new Map();
        const zeit = doc.getElementsByTagName('p:timing')[0];
        if (!zeit)
            return karte;
        let schritt = 0;
        for (const knoten of zeit.getElementsByTagName('p:cTn')) {
            if (knoten.getAttribute('nodeType') !== 'clickEffect')
                continue;
            schritt++;
            for (const ziel of knoten.getElementsByTagName('p:spTgt')) {
                const id = ziel.getAttribute('spid');
                if (id && !karte.has(id))
                    karte.set(id, schritt);
            }
        }
        return karte;
    };
    const formFarbe = (form, thema = {}) => {
        const verlauf = form.getElementsByTagName('a:gradFill')[0];
        if (verlauf) {
            const stopps = [...verlauf.getElementsByTagName('a:gs')];
            const mitte = stopps.find(g => g.getAttribute('pos') === '50000') || null;
            const rgbMitte = farbeAus(mitte, thema);
            if (rgbMitte)
                return rgbMitte;
            for (const g of stopps) {
                const w = farbeAus(g, thema);
                if (w)
                    return w;
            }
        }
        const voll = form.getElementsByTagName('a:solidFill')[0];
        return farbeAus(voll, thema);
    };
    const farbeAus = (eltern, thema) => {
        if (!eltern)
            return '';
        const knoten = [...eltern.children].find(k => k.tagName === 'a:srgbClr' || k.tagName === 'a:sysClr' || k.tagName === 'a:schemeClr');
        if (!knoten)
            return '';
        let roh = '';
        if (knoten.tagName === 'a:srgbClr')
            roh = knoten.getAttribute('val') || '';
        else if (knoten.tagName === 'a:sysClr')
            roh = knoten.getAttribute('lastClr') || '';
        else {
            const name = knoten.getAttribute('val') || '';
            if (name === 'phClr')
                return '';
            roh = (thema[name] || '').replace('#', '');
        }
        if (!/^[0-9a-fA-F]{6}$/.test(roh))
            return '';
        return abwandeln('#' + roh, knoten);
    };
    const abwandeln = (farbe, knoten) => {
        const WANDLER = ['a:lumMod', 'a:lumOff', 'a:tint', 'a:shade'];
        if (![...knoten.children].some(k => WANDLER.includes(k.tagName)))
            return farbe;
        const wert = (tag) => {
            const k = [...knoten.children].find(x => x.tagName === tag);
            if (!k)
                return null;
            const v = Number(k.getAttribute('val'));
            return Number.isFinite(v) ? v / 100000 : null;
        };
        let [r, g, b] = [0, 1, 2].map(n => parseInt(farbe.slice(1 + n * 2, 3 + n * 2), 16) / 255);
        const tint = wert('a:tint');
        if (tint !== null) {
            r = r * tint + (1 - tint);
            g = g * tint + (1 - tint);
            b = b * tint + (1 - tint);
        }
        const shade = wert('a:shade');
        if (shade !== null) {
            r *= shade;
            g *= shade;
            b *= shade;
        }
        const lumMod = wert('a:lumMod');
        const lumOff = wert('a:lumOff');
        if (lumMod !== null || lumOff !== null) {
            const hoch = Math.max(r, g, b), tief = Math.min(r, g, b);
            let l = (hoch + tief) / 2;
            const d = hoch - tief;
            const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
            let h = 0;
            if (d !== 0) {
                if (hoch === r)
                    h = ((g - b) / d) % 6;
                else if (hoch === g)
                    h = (b - r) / d + 2;
                else
                    h = (r - g) / d + 4;
                h *= 60;
                if (h < 0)
                    h += 360;
            }
            l = Math.min(1, Math.max(0, l * (lumMod ?? 1) + (lumOff ?? 0)));
            const c = (1 - Math.abs(2 * l - 1)) * sat;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l - c / 2;
            const feld = [
                [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]
            ];
            const teil = feld[Math.min(5, Math.floor(h / 60))];
            r = teil[0] + m;
            g = teil[1] + m;
            b = teil[2] + m;
        }
        const zwei = (v) => Math.min(255, Math.max(0, Math.round(v * 255))).toString(16).padStart(2, '0');
        return '#' + zwei(r) + zwei(g) + zwei(b);
    };
    const themaLesen = (themaDoc, masterDoc) => {
        const karte = {};
        if (!themaDoc)
            return karte;
        const schema = themaDoc.getElementsByTagName('a:clrScheme')[0];
        if (!schema)
            return karte;
        for (const eintrag of schema.children) {
            const name = eintrag.tagName.replace(/^a:/, '');
            const wert = farbeAus(eintrag, {});
            if (wert)
                karte[name] = wert;
        }
        const zuordnung = masterDoc?.getElementsByTagName('p:clrMap')[0];
        if (zuordnung) {
            for (const attribut of zuordnung.attributes) {
                const ziel = karte[attribut.value];
                if (ziel)
                    karte[attribut.name] = ziel;
            }
        }
        return karte;
    };
    const phSchluessel = (ph) => {
        if (!ph)
            return '';
        const typ = ph.getAttribute('type') || 'body';
        const idx = ph.getAttribute('idx') || '0';
        const gleich = typ === 'ctrTitle' ? 'title' : typ;
        return gleich + '#' + idx;
    };
    const vorgabenLesen = (doc, thema = {}, paar = { major: '', minor: '' }) => {
        const karte = new Map();
        if (!doc)
            return karte;
        const baum = doc.getElementsByTagName('p:spTree')[0];
        for (const form of (baum ? baum.children : [])) {
            if (form.tagName !== 'p:sp')
                continue;
            const ph = form.getElementsByTagName('p:ph')[0];
            if (!ph)
                continue;
            const defRPr = form.getElementsByTagName('a:defRPr')[0];
            const sz = Number(defRPr?.getAttribute('sz'));
            const voll = defRPr ? [...defRPr.children].find(k => k.tagName === 'a:solidFill') : undefined;
            karte.set(phSchluessel(ph), {
                lage: formLage(form),
                sz: Number.isFinite(sz) && sz > 0 ? Math.round(sz / 100) : 0,
                farbe: farbeAus(voll, thema),
                schrift: schriftFamilie(schriftName(defRPr, paar)),
            });
        }
        return karte;
    };
    const hintergrund = (doc, thema = {}) => {
        if (!doc)
            return '';
        const bg = doc.getElementsByTagName('p:bg')[0];
        if (!bg)
            return '';
        const voll = bg.getElementsByTagName('a:solidFill')[0];
        return farbeAus(voll, thema);
    };
    const tinteFuer = (grund) => {
        const treffer = /^#([0-9a-fA-F]{6})$/.exec(grund);
        if (!treffer)
            return '';
        const roh = treffer[1];
        const kanal = (i) => {
            const v = parseInt(roh.slice(i * 2, i * 2 + 2), 16) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        const helligkeit = 0.2126 * kanal(0) + 0.7152 * kanal(1) + 0.0722 * kanal(2);
        const schwarz = 0.005605;
        const gegenSchwarz = (helligkeit + 0.05) / (schwarz + 0.05);
        return gegenSchwarz < 4.5 ? '#ffffff' : '';
    };
    const formVerlauf = (form, thema = {}) => {
        const spPr = form.getElementsByTagName('p:spPr')[0];
        if (!spPr)
            return null;
        const verlauf = [...spPr.children].find(k => k.tagName === 'a:gradFill');
        if (!verlauf)
            return null;
        const stopps = [];
        for (const g of [...verlauf.getElementsByTagName('a:gs')]) {
            const rgb = farbeAus(g, thema);
            if (!rgb)
                continue;
            const roh = String(g.getAttribute('pos') ?? '');
            const anteil = roh.endsWith('%') ? Number(roh.slice(0, -1)) / 100
                : Number(roh) / 100000;
            if (!Number.isFinite(anteil))
                continue;
            stopps.push({ pos: Math.min(1, Math.max(0, anteil)), farbe: rgb });
        }
        if (stopps.length < 2 || stopps.length !== verlauf.getElementsByTagName('a:gs').length)
            return null;
        stopps.sort((a, b) => a.pos - b.pos);
        const lin = [...verlauf.children].find(k => k.tagName === 'a:lin');
        if (!lin)
            return null;
        const winkel = Number(lin.getAttribute('ang')) || 0;
        return { stopps, winkel };
    };
    const pptxLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const praesT = await zip.text('ppt/presentation.xml');
        if (!praesT)
            throw new Error('In dieser Datei steckt keine PowerPoint-Präsentation.');
        const praes = xml(praesT);
        const sz = praes.getElementsByTagName('p:sldSz')[0];
        const breite = emuZuPunkt(sz?.getAttribute('cx')) || 960;
        const hoehe = emuZuPunkt(sz?.getAttribute('cy')) || 540;
        const praesRels = await relsLesen(zip, 'ppt/presentation.xml');
        const pfade = [];
        for (const eintrag of praes.getElementsByTagName('p:sldId')) {
            const rid = eintrag.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
                || eintrag.getAttribute('r:id') || '';
            const ziel = praesRels[rid];
            if (ziel)
                pfade.push(ziel);
        }
        if (!pfade.length)
            throw new Error('Diese Präsentation nennt keine Folien.');
        const folien = [];
        for (const pfad of pfade) {
            const t = await zip.text(pfad);
            if (!t)
                continue;
            const doc = xml(t);
            const rels = await relsLesen(zip, pfad);
            const holeXml = async (ziel) => {
                if (!ziel)
                    return null;
                try {
                    const t = await zip.text(ziel);
                    return t ? xml(t) : null;
                }
                catch {
                    return null;
                }
            };
            const layoutPfad = Object.entries(rels)
                .find(([, z]) => /slideLayouts\//.test(String(z)))?.[1] || '';
            const layoutDoc = await holeXml(String(layoutPfad));
            let masterDoc = null;
            let masterPfad = '';
            if (layoutPfad) {
                const lRels = await relsLesen(zip, String(layoutPfad));
                masterPfad = String(Object.entries(lRels)
                    .find(([, z]) => /slideMasters\//.test(String(z)))?.[1] || '');
                masterDoc = await holeXml(masterPfad);
            }
            let themaDoc = null;
            if (masterPfad) {
                const mRels = await relsLesen(zip, masterPfad);
                const themaPfad = Object.entries(mRels)
                    .find(([, z]) => /theme\//.test(String(z)))?.[1] || '';
                themaDoc = await holeXml(String(themaPfad));
            }
            const thema = themaLesen(themaDoc, masterDoc);
            const paar = schriftpaarLesen(themaDoc);
            const vorgaben = new Map([...vorgabenLesen(masterDoc, thema, paar),
                ...vorgabenLesen(layoutDoc, thema, paar)]);
            const grundfarbe = hintergrund(doc, thema) || hintergrund(layoutDoc, thema)
                || hintergrund(masterDoc, thema);
            const standardTinte = tinteFuer(grundfarbe);
            const baum = doc.getElementsByTagName('p:spTree')[0];
            const schritte = klickschritte(doc);
            const objekte = [];
            let titel = '';
            const abbilden = (l, ab) => {
                if (!l || !ab)
                    return l;
                return { x: ab.dx + l.x * ab.sx, y: ab.dy + l.y * ab.sy,
                    w: l.w * ab.sx, h: l.h * ab.sy };
            };
            const weggelassen = new Map();
            const merkeWeg = (was) => void weggelassen.set(was, (weggelassen.get(was) || 0) + 1);
            const formenLesen = async (formen, ab, tiefe) => {
                for (const form of formen) {
                    if (form.tagName === 'p:grpSp') {
                        if (tiefe >= 8) {
                            merkeWeg('tief verschachtelte Gruppen');
                            continue;
                        }
                        const gp = form.getElementsByTagName('a:grpSpPr')[0];
                        const xf = gp?.getElementsByTagName('a:xfrm')[0];
                        const off = xf?.getElementsByTagName('a:off')[0];
                        const ext = xf?.getElementsByTagName('a:ext')[0];
                        const cOff = xf?.getElementsByTagName('a:chOff')[0];
                        const cExt = xf?.getElementsByTagName('a:chExt')[0];
                        let innen = ab;
                        if (off && ext && cOff && cExt) {
                            const ox = emuZuPunkt(off.getAttribute('x')), oy = emuZuPunkt(off.getAttribute('y'));
                            const cx = emuZuPunkt(ext.getAttribute('cx')), cy = emuZuPunkt(ext.getAttribute('cy'));
                            const kx = emuZuPunkt(cOff.getAttribute('x')), ky = emuZuPunkt(cOff.getAttribute('y'));
                            const kcx = emuZuPunkt(cExt.getAttribute('cx')), kcy = emuZuPunkt(cExt.getAttribute('cy'));
                            const sx = kcx > 0 ? cx / kcx : 1, sy = kcy > 0 ? cy / kcy : 1;
                            const eigen = { dx: ox - kx * sx, dy: oy - ky * sy, sx, sy };
                            innen = ab
                                ? { dx: ab.dx + eigen.dx * ab.sx, dy: ab.dy + eigen.dy * ab.sy,
                                    sx: eigen.sx * ab.sx, sy: eigen.sy * ab.sy }
                                : eigen;
                        }
                        await formenLesen(form.children, innen, tiefe + 1);
                        continue;
                    }
                    if (form.tagName === 'p:graphicFrame') {
                        if (form.getElementsByTagName('a:tbl').length) {
                            const zellen = tabelleLesen(form, thema, standardTinte);
                            if (zellen.length) {
                                for (const z of zellen) {
                                    const l = abbilden({ x: z.x, y: z.y, w: z.w ?? z.breiteBox ?? 0, h: z.h ?? 0 }, ab);
                                    if (!l)
                                        continue;
                                    z.x = l.x;
                                    z.y = l.y;
                                    if (z.w !== undefined) {
                                        z.w = l.w;
                                        z.h = l.h;
                                    }
                                    else
                                        z.breiteBox = Math.max(12, l.w);
                                    objekte.push(z);
                                }
                            }
                            else
                                merkeWeg('Tabellen');
                        }
                        else
                            merkeWeg('Diagramme');
                        continue;
                    }
                    if (form.tagName === 'p:sp') {
                        const txBody = form.getElementsByTagName('p:txBody')[0];
                        const text = txBody ? formText(txBody) : '';
                        const eigenePh = form.getElementsByTagName('p:ph')[0];
                        const geerbt = eigenePh ? vorgaben.get(phSchluessel(eigenePh)) : undefined;
                        const lage = abbilden(formLage(form) || geerbt?.lage || null, ab);
                        const dreh = formDrehung(form);
                        const sid = form.getElementsByTagName('p:cNvPr')[0]?.getAttribute('id') || '';
                        const schritt = sid ? schritte.get(sid) : undefined;
                        if (!text.trim() && schritt && lage && lage.w > 0 && lage.h > 0) {
                            objekte.push({ art: 'abdeck', schritt, farbe: formFarbe(form, thema) || '#ffcc00',
                                verlauf: formVerlauf(form, thema),
                                x: lage.x, y: lage.y, w: lage.w, h: lage.h, ...(dreh ? { dreh } : {}) });
                            continue;
                        }
                        const fuellung = formFarbe(form, thema);
                        const geo = formGeometrie(form);
                        const rand = formRand(form, thema);
                        if (lage && lage.w > 0 && lage.h > 0 && geo && (fuellung || rand)) {
                            objekte.push({ art: geo, x: lage.x, y: lage.y, w: lage.w, h: lage.h,
                                ...(fuellung ? { fuellung } : {}),
                                ...(rand ? { farbe: rand.farbe, breite: rand.breite } : { randlos: true }),
                                ...(dreh ? { dreh } : {}) });
                        }
                        else if (!text.trim() && lage && lage.w > 0 && lage.h > 0) {
                            merkeWeg('Formen');
                        }
                        if (!text.trim())
                            continue;
                        const ph = eigenePh;
                        const istTitel = /^(ctr)?[Tt]itle$/.test(ph?.getAttribute('type') || '');
                        const absaetze = txBody ? absaetzeLesen(txBody, thema, paar) : [];
                        if (istTitel && !titel)
                            titel = absaetze[0]?.text.split('\n')[0] || '';
                        const grund = geerbt?.sz || (istTitel ? 40 : 20);
                        const grundfarbeText = geerbt?.farbe || standardTinte;
                        const grundschrift = geerbt?.schrift || '';
                        const kx = lage ? lage.x : breite * 0.08;
                        const ky = lage ? lage.y : hoehe * 0.1;
                        const kb = lage && lage.w > 0 ? lage.w : breite * 0.84;
                        const laeufeNoetig = (laeufe) => {
                            const echte = laeufe.filter(l => l.text && l.text !== '\n');
                            if (echte.length < 2)
                                return false;
                            const erste = echte[0];
                            return echte.some(l => l.sz !== erste.sz || l.fett !== erste.fett
                                || l.farbe !== erste.farbe);
                        };
                        const mitZeichen = (a) => a.zeichen
                            ? [{ text: a.zeichen + ' ', sz: a.sz, fett: a.fett, farbe: a.farbe,
                                    schrift: a.schrift }, ...a.laeufe]
                            : a.laeufe;
                        const spur = (absatzNr) => {
                            const a = absaetze[absatzNr];
                            if (!sid || !a || a.zeichen)
                                return {};
                            const echte = a.laeufe.filter(l => l.text && l.text !== '\n');
                            if (echte.length !== 1)
                                return {};
                            return { quelle: { sp: sid, p: absatzNr } };
                        };
                        const gleichFormat = absaetze.length > 0 && absaetze.every(a => a.sz === absaetze[0].sz && a.fett === absaetze[0].fett
                            && a.farbe === absaetze[0].farbe && a.lvl === absaetze[0].lvl
                            && !a.zeichen === !absaetze[0].zeichen
                            && a.ausricht === absaetze[0].ausricht
                            && a.schrift === absaetze[0].schrift);
                        if (absaetze.length <= 1 || gleichFormat) {
                            const a = absaetze[0];
                            objekte.push({ art: 'text',
                                text: absaetze.map(z => (z.zeichen ? z.zeichen + ' ' : '') + z.text).join('\n'),
                                x: kx + a.lvl * Math.max(10, (a.sz || grund) * 0.9), y: ky,
                                breiteBox: Math.max(20, kb - a.lvl * Math.max(10, (a.sz || grund) * 0.9)),
                                fontSize: a.sz || grund, fett: a.fett,
                                ...((a.farbe || grundfarbeText) ? { farbe: a.farbe || grundfarbeText } : {}),
                                ...(a.ausricht ? { ausricht: a.ausricht } : {}),
                                ...((a.schrift || grundschrift) ? { schrift: a.schrift || grundschrift } : {}),
                                ...(dreh ? { dreh } : {}),
                                ...(() => {
                                    const kette = [];
                                    absaetze.forEach((z, i) => {
                                        if (i > 0)
                                            kette.push({ text: '\n', sz: z.sz, fett: z.fett,
                                                farbe: z.farbe, schrift: z.schrift });
                                        kette.push(...mitZeichen(z));
                                    });
                                    return laeufeNoetig(kette) ? { laeufe: kette } : {};
                                })(),
                                ...(absaetze.length === 1 ? spur(0) : {}) });
                            continue;
                        }
                        let y = ky;
                        for (const [absatzNr, a] of absaetze.entries()) {
                            if (!a.text.trim()) {
                                y += (a.sz || grund) * 1.25;
                                continue;
                            }
                            const einzug = a.lvl * Math.max(10, (a.sz || grund) * 0.9);
                            const marke = { art: 'text',
                                text: (a.zeichen ? a.zeichen + ' ' : '') + a.text,
                                x: kx + einzug, y,
                                breiteBox: Math.max(20, kb - einzug),
                                fontSize: a.sz || grund, fett: a.fett,
                                ...((a.farbe || grundfarbeText) ? { farbe: a.farbe || grundfarbeText } : {}),
                                ...(a.ausricht ? { ausricht: a.ausricht } : {}),
                                ...((a.schrift || grundschrift) ? { schrift: a.schrift || grundschrift } : {}),
                                ...(laeufeNoetig(mitZeichen(a)) ? { laeufe: mitZeichen(a) } : {}),
                                ...(dreh ? { dreh } : {}),
                                ...spur(absatzNr) };
                            objekte.push(marke);
                            let h = (a.sz || grund) * 1.25;
                            try {
                                const l = InkGeometry.textLayout({ ...marke, point: [marke.x, y] });
                                if (l && l.height > 0)
                                    h = l.height;
                            }
                            catch { }
                            y += h;
                        }
                        continue;
                    }
                    if (form.tagName === 'p:pic') {
                        const blip = form.getElementsByTagName('a:blip')[0];
                        const rid = blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')
                            || blip?.getAttribute('r:embed') || '';
                        const ziel = rels[rid];
                        if (!ziel)
                            continue;
                        const bytes = await zip.holen(ziel);
                        if (!bytes)
                            continue;
                        const lage = abbilden(formLage(form), ab);
                        objekte.push({ art: 'bild', pfad: ziel, name: ziel.slice(ziel.lastIndexOf('/') + 1),
                            bytes,
                            x: lage ? lage.x : breite * 0.2, y: lage ? lage.y : hoehe * 0.2,
                            w: lage && lage.w > 0 ? lage.w : breite * 0.4,
                            h: lage && lage.h > 0 ? lage.h : hoehe * 0.4,
                            ...(formDrehung(form) ? { dreh: formDrehung(form) } : {}) });
                    }
                }
            };
            await formenLesen(baum ? baum.children : [], null, 0);
            const kandidaten = objekte
                .filter(o => o.art === 'text' && String(o.text).trim())
                .sort((a, b) => a.y - b.y)
                .map(o => String(o.text).split('\n')[0].trim())
                .filter(z => z && z.length <= 80);
            let notizen = '';
            try {
                const notizPfad = String(Object.entries(rels)
                    .find(([, z]) => /notesSlides\//.test(String(z)))?.[1] || '');
                const notizDoc = await holeXml(notizPfad);
                const absaetze = [];
                for (const form of Array.from(notizDoc?.getElementsByTagName('p:sp') || [])) {
                    const ph = form.getElementsByTagName('p:ph')[0];
                    if (ph?.getAttribute('type') !== 'body')
                        continue;
                    for (const absatz of Array.from(form.getElementsByTagName('a:p')))
                        absaetze.push(Array.from(absatz.getElementsByTagName('a:t')).map(t => t.textContent || '').join(''));
                }
                notizen = absaetze.join('\n').trim();
            }
            catch {
                notizen = '';
            }
            folien.push({ titel, objekte, kandidaten, grundfarbe, notizen,
                uebergang: uebergangLesen(doc),
                weg: [...weggelassen.entries()] });
        }
        const haeufig = new Map();
        for (const f of folien)
            for (const z of new Set(f.kandidaten))
                haeufig.set(z, (haeufig.get(z) || 0) + 1);
        const decke = Math.max(2, Math.ceil(folien.length / 3));
        for (const f of folien) {
            if (f.titel)
                continue;
            f.titel = f.kandidaten.find(z => (haeufig.get(z) || 0) < decke) || '';
        }
        return { breite, hoehe, folien };
    };
    const epubLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const container = await zip.text('META-INF/container.xml');
        let opfPfad = null;
        if (container)
            opfPfad = xml(container).querySelector('rootfile')?.getAttribute('full-path');
        if (!opfPfad)
            opfPfad = zip.namen.find((n) => n.endsWith('.opf'));
        if (!opfPfad)
            throw new Error('Das sieht nicht nach einem EPUB aus.');
        const opf = xml(await zip.text(opfPfad));
        const ordner = opfPfad.includes('/') ? opfPfad.slice(0, opfPfad.lastIndexOf('/') + 1) : '';
        const titel = opf.querySelector('title')?.textContent || 'Buch';
        const karte = {};
        opf.querySelectorAll('manifest > item').forEach(it => { const id = it.getAttribute('id'); if (id)
            karte[id] = it.getAttribute('href'); });
        const kapitel = [];
        for (const ref of opf.querySelectorAll('spine > itemref')) {
            const href = karte[ref.getAttribute('idref') ?? ''];
            if (!href)
                continue;
            const inhalt = await zip.text(ordner + href.split('#')[0]);
            if (!inhalt)
                continue;
            const doc = new DOMParser().parseFromString(inhalt, 'text/html');
            const kTitel = doc.querySelector('h1,h2,title')?.textContent?.trim() ||
                ('Kapitel ' + (kapitel.length + 1));
            kapitel.push({ titel: kTitel, html: doc.body ? doc.body.innerHTML : inhalt });
        }
        return { titel, kapitel };
    };
    const alsDatenbank = (seiteId, name, zeilen) => {
        const brauchbar = zeilen.filter((z) => z.some((x) => String(x).trim()));
        if (brauchbar.length < 2)
            return null;
        const kopf = (brauchbar[0] ?? []).map((x, i) => String(x).trim() || 'Spalte ' + (i + 1));
        const schema = { title: { name: kopf[0], type: 'title' } };
        const karte = ['title'];
        kopf.slice(1).forEach((n, i) => {
            const spalte = brauchbar.slice(1).map((z) => String(z[i + 1] ?? '').trim()).filter(Boolean);
            const alleZahlen = spalte.length && spalte.every((v) => /^-?[\d.,]+$/.test(v));
            const alleDaten = spalte.length && spalte.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v));
            const k = 's' + i;
            schema[k] = { name: n, type: alleDaten ? 'date' : alleZahlen ? 'number' : 'text' };
            karte.push(k);
        });
        const { collectionId } = Store.addDatabase(seiteId, name, schema, 'table');
        brauchbar.slice(1).forEach((z) => {
            const props = {};
            karte.forEach((k, i) => {
                if (k === 'title')
                    return;
                let v = z[i] ?? '';
                if (schema[k].type === 'number')
                    v = parseFloat(String(v).replace(',', '.')) || 0;
                props[k] = v;
            });
            const r = Store.addRow(collectionId, props);
            Store.updateBlock(r.id, { text: String(z[0] ?? '') || 'Ohne Titel' });
        });
        return collectionId;
    };
    const originalSichern = async (f, elternId) => Dateien.ablegen(f, { blockId: elternId });
    const originalAnhaengen = async (seiteId, f, quelle) => {
        try {
            const a = Store.addBlock(seiteId, 'file', {
                text: f.name, dateiId: quelle.id, typ: f.type,
                groesse: f.size, original: true
            }, 0);
            await Store.dateiPut({ ...quelle, blockId: a.id });
        }
        catch { }
    };
    const datei = async (f, elternId) => {
        const name = f.name.toLowerCase();
        const wandelbar = /\.(xlsx|xlsm|ods|docx|pptx|ppsx|pptm|ppsm|epub)$/.test(name);
        const quelle = wandelbar ? await originalSichern(f, elternId) : null;
        const puffer = await f.arrayBuffer();
        if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
            const blaetter = await xlsxLesen(puffer);
            if (!blaetter.length)
                throw new Error('Keine Tabellenblätter gefunden.');
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
            let n = 0;
            blaetter.forEach(b => {
                Store.addBlock(seite.id, 'h2', { text: b.name });
                if (alsDatenbank(seite.id, b.name, b.zeilen))
                    n++;
                else
                    Store.addBlock(seite.id, 'text', { text: '(Blatt „' + b.name + '" war leer)' });
            });
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt'
                    + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
        }
        if (name.endsWith('.ods')) {
            const blaetter = await odsLesen(puffer);
            if (!blaetter.length)
                throw new Error('Keine Tabellenblätter gefunden.');
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
            let n = 0;
            blaetter.forEach(b => {
                Store.addBlock(seite.id, 'h2', { text: b.name });
                if (alsDatenbank(seite.id, b.name, b.zeilen))
                    n++;
                else
                    Store.addBlock(seite.id, 'text', { text: '(Blatt „' + b.name + '" war leer)' });
            });
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt'
                    + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
        }
        if (name.endsWith('.docx')) {
            const bloecke = await docxLesen(puffer);
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📄' });
            bloecke.forEach((b) => {
                if (b.typ === 'table')
                    Store.addBlock(seite.id, 'table', { rows: b.rows, kopfZeile: true });
                else
                    Store.addBlock(seite.id, b.typ, { text: b.text,
                        ...(b.quelle ? { quelle: b.quelle } : {}) });
            });
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            return { seite, hinweis: bloecke.length + ' Absätze übernommen'
                    + (quelle ? ' · das Original liegt unverändert als Anhang dabei' : '') };
        }
        if (/\.(pptx|ppsx|pptm|ppsm)$/.test(name)) {
            const p = await pptxLesen(puffer);
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📽️' });
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            Store.updateBlock(seite.id, { dokumentModus: true });
            let mitBild = 0, mitDeckel = 0;
            const schonAbgelegt = new Map();
            for (const [nr, folie] of p.folien.entries()) {
                const block = Store.addBlock(seite.id, 'blatt', {
                    text: folie.titel || ('Folie ' + (nr + 1)),
                    blattBreite: p.breite, blattHoehe: p.hoehe, papier: 'blanko',
                    ...(folie.grundfarbe ? { grundfarbe: folie.grundfarbe } : {}),
                    ...(folie.uebergang ? { uebergang: folie.uebergang } : {}),
                    ...(folie.notizen ? { notizen: folie.notizen } : {})
                });
                const marken = [];
                for (const o of folie.objekte) {
                    const id = 'm' + Math.random().toString(36).slice(2, 10);
                    if (o.art === 'text') {
                        const { x: _x, y: _y, w: _w, h: _h, art: _art, ...rest } = o;
                        marken.push({ id, art: 'text', point: [o.x, o.y], ...rest, fett: !!o.fett });
                        continue;
                    }
                    if (o.art === 'abdeck') {
                        marken.push({ id, art: 'abdeck', farbe: o.farbe, schritt: o.schritt,
                            ...(o.verlauf ? { verlauf: o.verlauf } : {}),
                            ...(o.dreh ? { dreh: o.dreh } : {}),
                            pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]] });
                        continue;
                    }
                    if (o.art === 'rectangle' || o.art === 'roundrect' || o.art === 'ellipse'
                        || o.art === 'triangle' || o.art === 'line') {
                        marken.push({ id, art: o.art, farbe: o.farbe || '#9aa3ad',
                            ...(o.fuellung ? { fuellung: o.fuellung } : {}),
                            ...(o.breite ? { breite: o.breite } : {}),
                            ...(o.randlos ? { randlos: true } : {}),
                            ...(o.dreh ? { dreh: o.dreh } : {}),
                            pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]] });
                        continue;
                    }
                    try {
                        let dateiId = schonAbgelegt.get(o.pfad) || '';
                        if (!dateiId) {
                            const satz = await Dateien.ablegen(new Blob([o.bytes]), { blockId: block.id, name: o.name });
                            dateiId = String(satz?.id || '');
                            if (dateiId)
                                schonAbgelegt.set(o.pfad, dateiId);
                        }
                        if (dateiId) {
                            marken.push({ id, art: 'bild', dateiId,
                                ...(o.dreh ? { dreh: o.dreh } : {}),
                                pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]] });
                            mitBild++;
                        }
                    }
                    catch { }
                }
                mitDeckel += marken.filter((m) => m.art === 'abdeck').length;
                if (marken.length)
                    Store.updateBlock(block.id, { marken });
            }
            const fehltGesamt = new Map();
            for (const f of p.folien)
                for (const [was, n] of (f.weg || []))
                    fehltGesamt.set(was, (fehltGesamt.get(was) || 0) + Number(n));
            const fehltText = [...fehltGesamt.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([was, n]) => n + ' ' + was)
                .join(', ');
            return { seite, hinweis: p.folien.length + ' Folien übernommen'
                    + (mitBild ? ', ' + mitBild + ' Bilder aus ' + schonAbgelegt.size + ' Dateien' : '')
                    + (mitDeckel ? ', ' + mitDeckel + ' Antworten zugedeckt' : '')
                    + (fehltText ? ' · NICHT übernommen: ' + fehltText : '')
                    + (quelle ? ' · das Original liegt unverändert als Anhang dabei' : '') };
        }
        if (name.endsWith('.epub')) {
            const buch = await epubLesen(puffer);
            const seite = Store.addPage(elternId, { text: buch.titel, icon: '📚', wiki: true });
            buch.kapitel.forEach((k) => {
                const kap = Store.addPage(seite.id, { text: k.titel, icon: '📖' });
                Werkzeuge.ausHtml(kap.id, k.html);
            });
            Store.updateBlock(seite.id, { aufgeklappt: true });
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            return { seite, hinweis: buch.kapitel.length + ' Kapitel als Unterseiten angelegt'
                    + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
        }
        return null;
    };
    return { zipLesen, zipLesenAusBlob, xlsxLesen, odsLesen, tabellenBerichtText,
        docxLesen, epubLesen,
        alsDatenbank, datei };
})();
window.Einlesen = Einlesen;
