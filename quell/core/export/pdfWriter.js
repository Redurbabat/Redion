"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/export/pdfWriter.ts (npm run bauen:ts). */
const PdfWriter = (() => {
    const roh = new TextEncoder();
    const laenge = (teil) => teil instanceof Blob ? teil.size : teil.byteLength;
    const neu = () => {
        const teile = [];
        const stellen = [0, 0, 0];
        let bisher = 0;
        let fertig = false;
        const seitenObjekte = [];
        const dazu = (teil) => { teile.push(teil); bisher += laenge(teil); };
        const text = (s) => dazu(roh.encode(s));
        const objekt = () => {
            const nr = stellen.length;
            stellen.push(bisher);
            text(nr + ' 0 obj\n');
            return nr;
        };
        const objektEnde = () => { text('endobj\n'); };
        text('%PDF-1.4\n');
        dazu(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
        const seite = (auftrag) => {
            if (fertig)
                return false;
            const { bild, pixelBreite, pixelHoehe } = auftrag;
            const breite = Math.round(auftrag.breite), hoehe = Math.round(auftrag.hoehe);
            if (!(bild instanceof Blob) || bild.size < 1)
                return false;
            if (!(pixelBreite > 0) || !(pixelHoehe > 0) || !(breite > 0) || !(hoehe > 0))
                return false;
            const bildNr = objekt();
            text('<< /Type /XObject /Subtype /Image /Width ' + Math.round(pixelBreite) +
                ' /Height ' + Math.round(pixelHoehe) +
                ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
                bild.size + ' >>\nstream\n');
            dazu(bild);
            text('\nendstream\n');
            objektEnde();
            const strom = 'q\n' + breite + ' 0 0 ' + hoehe + ' 0 0 cm\n/Im0 Do\nQ\n';
            const stromBytes = roh.encode(strom);
            const inhaltNr = objekt();
            text('<< /Length ' + stromBytes.byteLength + ' >>\nstream\n');
            dazu(stromBytes);
            text('endstream\n');
            objektEnde();
            const annots = [];
            for (const marke of (auftrag.marken || [])) {
                const nr = annotation(marke, hoehe);
                if (nr)
                    annots.push(nr);
            }
            const seitenNr = objekt();
            text('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + breite + ' ' + hoehe + '] ' +
                '/Resources << /XObject << /Im0 ' + bildNr + ' 0 R >> /ProcSet [/PDF /ImageC] >> ' +
                '/Contents ' + inhaltNr + ' 0 R' +
                (annots.length ? ' /Annots [' + annots.map(n => n + ' 0 R').join(' ') + ']' : '') +
                ' >>\n');
            objektEnde();
            seitenObjekte.push(seitenNr);
            return true;
        };
        const z = (v) => {
            const n = Math.round((Number(v) || 0) * 100) / 100;
            return Object.is(n, -0) ? '0' : String(n);
        };
        const hoch = (q, hoehe) => [q[0], hoehe - q[1]];
        const vielecke = (k) => {
            if (!Array.isArray(k) || !k.length)
                return [];
            const liste = (Array.isArray(k[0]?.[0]) ? k : [k]);
            return liste.filter(v => Array.isArray(v) && v.length >= 3);
        };
        const annotation = (marke, hoehe) => {
            const striche = (marke.striche || []).filter(s => Array.isArray(s) && s.length >= 2);
            if (!striche.length)
                return 0;
            const breite = Math.max(0.1, Number(marke.breite) || 1);
            const deck = Math.max(0, Math.min(1, marke.deckkraft === undefined ? 1 : marke.deckkraft));
            const [r, g, b] = marke.farbe;
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            const merken = (q) => {
                if (q[0] < x0)
                    x0 = q[0];
                if (q[0] > x1)
                    x1 = q[0];
                if (q[1] < y0)
                    y0 = q[1];
                if (q[1] > y1)
                    y1 = q[1];
            };
            striche.forEach(s => s.forEach(q => merken(hoch(q, hoehe))));
            (marke.kontur || []).forEach(k => vielecke(k).forEach(v => v.forEach(q => merken(hoch(q, hoehe)))));
            if (!Number.isFinite(x0))
                return 0;
            const rand = breite / 2 + 1;
            x0 -= rand;
            y0 -= rand;
            x1 += rand;
            y1 += rand;
            let strom = 'q\n';
            if (deck < 1)
                strom += '/GS0 gs\n';
            strom += z(r) + ' ' + z(g) + ' ' + z(b) + ' rg\n'
                + z(r) + ' ' + z(g) + ' ' + z(b) + ' RG\n'
                + z(breite) + ' w 1 J 1 j\n';
            let gefuellt = false, gestrichen = false;
            striche.forEach((strich, i) => {
                const teile = vielecke((marke.kontur || [])[i]);
                const gefuelltJetzt = teile.length > 0;
                const zuege = gefuelltJetzt ? teile : [strich];
                for (const zug of zuege) {
                    const punkte = zug.map(q => hoch(q, hoehe));
                    strom += z(punkte[0][0]) + ' ' + z(punkte[0][1]) + ' m\n';
                    for (let k = 1; k < punkte.length; k++)
                        strom += z(punkte[k][0]) + ' ' + z(punkte[k][1]) + ' l\n';
                    if (gefuelltJetzt && zuege.length > 1)
                        strom += 'h\n';
                }
                if (gefuelltJetzt) {
                    strom += zuege.length > 1 ? 'f\n' : 'h f\n';
                    gefuellt = true;
                }
                else {
                    strom += 'S\n';
                    gestrichen = true;
                }
            });
            strom += 'Q\n';
            void gefuellt;
            void gestrichen;
            const stromBytes = roh.encode(strom);
            const formNr = objekt();
            text('<< /Type /XObject /Subtype /Form /FormType 1 /BBox ['
                + z(x0) + ' ' + z(y0) + ' ' + z(x1) + ' ' + z(y1) + '] '
                + '/Resources << /ProcSet [/PDF]'
                + (deck < 1
                    ? ' /ExtGState << /GS0 << /Type /ExtGState /ca ' + z(deck)
                        + ' /CA ' + z(deck) + ' /BM /Multiply >> >>'
                    : '')
                + ' >> /Length ' + stromBytes.byteLength + ' >>\nstream\n');
            dazu(stromBytes);
            text('endstream\n');
            objektEnde();
            const listen = striche.map(s => '[' + s.map(q => {
                const h = hoch(q, hoehe);
                return z(h[0]) + ' ' + z(h[1]);
            }).join(' ') + ']').join(' ');
            const annotNr = objekt();
            text('<< /Type /Annot /Subtype /Ink /F 4 '
                + '/Rect [' + z(x0) + ' ' + z(y0) + ' ' + z(x1) + ' ' + z(y1) + '] '
                + '/InkList [' + listen + '] '
                + '/C [' + z(r) + ' ' + z(g) + ' ' + z(b) + '] '
                + (deck < 1 ? '/CA ' + z(deck) + ' ' : '')
                + '/BS << /Type /Border /W ' + z(breite) + ' /S /S >> '
                + '/T (Redion) '
                + '/Contents (' + klammerFrei(marke.name || 'Handschrift') + ') '
                + '/AP << /N ' + formNr + ' 0 R >> >>\n');
            objektEnde();
            return annotNr;
        };
        const klammerFrei = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        const schliessen = () => {
            if (fertig)
                return new Blob(teile, { type: 'application/pdf' });
            fertig = true;
            stellen[1] = bisher;
            text('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
            stellen[2] = bisher;
            text('2 0 obj\n<< /Type /Pages /Kids [' +
                seitenObjekte.map(n => n + ' 0 R').join(' ') +
                '] /Count ' + seitenObjekte.length + ' >>\nendobj\n');
            const xrefStelle = bisher;
            const anzahl = stellen.length;
            let tabelle = 'xref\n0 ' + anzahl + '\n0000000000 65535 f \n';
            for (let n = 1; n < anzahl; n++)
                tabelle += String(stellen[n] ?? 0).padStart(10, '0') + ' 00000 n \n';
            text(tabelle);
            text('trailer\n<< /Size ' + anzahl + ' /Root 1 0 R >>\nstartxref\n' + xrefStelle + '\n%%EOF\n');
            return new Blob(teile, { type: 'application/pdf' });
        };
        return { seite, schliessen, seiten: () => seitenObjekte.length };
    };
    return { neu };
})();
window.PdfWriter = PdfWriter;
