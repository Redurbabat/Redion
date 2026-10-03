"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/leser.ts (npm run bauen:ts). */
const PdfLeser = (() => {
    const BREITE_PX = 1654;
    const TEXT_MAX = 8000;
    const rund = (n) => Math.round(n * 100) / 100;
    const oeffne = async (daten, frage) => {
        const pdfjs = await window.PdfFremd.laden();
        const auftrag = pdfjs.getDocument({
            data: daten, isEvalSupported: false, disableAutoFetch: true
        });
        if (frage) {
            auftrag.onPassword = (weiter, grund) => {
                frage(grund === 2).then(pw => {
                    if (pw === null) {
                        try {
                            auftrag.destroy();
                        }
                        catch { }
                        return;
                    }
                    weiter(pw);
                });
            };
        }
        const doc = await auftrag.promise;
        const geometrie = async (nr) => {
            const seite = await doc.getPage(nr);
            const sicht = seite.getViewport({ scale: 1 });
            return { bw: rund(sicht.width), bh: rund(sicht.height), dreh: seite.rotate || 0 };
        };
        const alsBild = async (nr, breitePx = BREITE_PX) => {
            const seite = await doc.getPage(nr);
            const eins = seite.getViewport({ scale: 1 });
            const sicht = seite.getViewport({ scale: breitePx / eins.width });
            const leinwand = document.createElement('canvas');
            leinwand.width = Math.round(sicht.width);
            leinwand.height = Math.round(sicht.height);
            const stift = leinwand.getContext('2d');
            if (!stift)
                throw new Error('Der Browser gibt keine Zeichenfläche her.');
            await seite.render({ canvasContext: stift, viewport: sicht }).promise;
            const blob = await new Promise(fertig => leinwand.toBlob(b => fertig(b), 'image/webp', 0.82));
            leinwand.width = 0;
            leinwand.height = 0;
            if (!blob)
                throw new Error('Die Seite liess sich nicht in ein Bild verwandeln.');
            return blob;
        };
        const text = async (nr) => {
            try {
                const seite = await doc.getPage(nr);
                const inhalt = await seite.getTextContent();
                const stuecke = (inhalt.items || [])
                    .map((i) => (typeof i.str === 'string' ? i.str : ''))
                    .filter(Boolean);
                let roh = '';
                (inhalt.items || []).forEach((i) => {
                    if (typeof i.str === 'string')
                        roh += i.str;
                    if (i.hasEOL)
                        roh += '\n';
                });
                if (!roh.trim())
                    roh = stuecke.join(' ');
                return roh.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
                    .trim().slice(0, TEXT_MAX);
            }
            catch {
                return '';
            }
        };
        const textMitLage = async (nr) => {
            try {
                const seite = await doc.getPage(nr);
                const sicht = seite.getViewport({ scale: 1 });
                const inhalt = await seite.getTextContent();
                const aus = [];
                for (const i of (inhalt.items || [])) {
                    if (typeof i.str !== 'string')
                        continue;
                    const t = Array.isArray(i.transform) ? i.transform : [1, 0, 0, 1, 0, 0];
                    const h = Math.abs(Number(i.height) || Math.hypot(t[2] ?? 0, t[3] ?? 1)) || 0;
                    const w = Math.abs(Number(i.width) || 0);
                    const [x, y] = sicht.convertToViewportPoint(t[4] ?? 0, t[5] ?? 0);
                    aus.push({ s: i.str, x: rund(x), y: rund(y - h), w: rund(w), h: rund(h), eol: !!i.hasEOL });
                }
                return aus;
            }
            catch {
                return [];
            }
        };
        const verweise = async (nr) => {
            try {
                const seite = await doc.getPage(nr);
                const sicht = seite.getViewport({ scale: 1 });
                const liste = await seite.getAnnotations();
                const aus = [];
                for (const a of (liste || [])) {
                    if (!a || a.subtype !== 'Link' || !Array.isArray(a.rect) || a.rect.length < 4)
                        continue;
                    const [x1, y1] = sicht.convertToViewportPoint(a.rect[0], a.rect[1]);
                    const [x2, y2] = sicht.convertToViewportPoint(a.rect[2], a.rect[3]);
                    const eintrag = { x: rund(Math.min(x1, x2)), y: rund(Math.min(y1, y2)),
                        w: rund(Math.abs(x2 - x1)), h: rund(Math.abs(y2 - y1)) };
                    if (typeof a.url === 'string' && a.url)
                        eintrag.url = a.url;
                    else if (a.dest) {
                        const ziel = typeof a.dest === 'string' ? await doc.getDestination(a.dest) : a.dest;
                        const ref = Array.isArray(ziel) ? ziel[0] : null;
                        if (ref) {
                            try {
                                eintrag.seite = (await doc.getPageIndex(ref)) + 1;
                                const art = ziel[1] && typeof ziel[1] === 'object' ? String(ziel[1].name || '') : '';
                                const oben = art === 'XYZ' ? ziel[3]
                                    : art === 'FitH' || art === 'FitBH' ? ziel[2]
                                        : art === 'FitR' ? ziel[5] : null;
                                if (typeof oben === 'number' && Number.isFinite(oben)) {
                                    const zielSeite = await doc.getPage(eintrag.seite);
                                    const zielSicht = zielSeite.getViewport({ scale: 1 });
                                    const [, zy] = zielSicht.convertToViewportPoint(0, oben);
                                    eintrag.zielY = rund(Math.max(0, zy));
                                }
                            }
                            catch { }
                        }
                    }
                    if (eintrag.url || eintrag.seite)
                        aus.push(eintrag);
                }
                return aus;
            }
            catch {
                return [];
            }
        };
        const schliessen = () => { try {
            doc.destroy();
        }
        catch { } };
        return { seiten: doc.numPages, geometrie, alsBild, text, textMitLage, verweise, schliessen };
    };
    const griffe = new Map();
    const lagen = new Map();
    const griffVon = (quelleId) => {
        let g = griffe.get(quelleId);
        if (!g) {
            g = (async () => {
                if (typeof Dateien === 'undefined')
                    return null;
                const roh = await Dateien.alsBlob(quelleId);
                if (!roh)
                    return null;
                return oeffne(new Uint8Array(await roh.arrayBuffer()));
            })().catch(() => null);
            griffe.set(quelleId, g);
        }
        return g;
    };
    const lageVonBlock = (block) => {
        const id = String(block?.id || '');
        if (!id)
            return Promise.resolve([]);
        let l = lagen.get(id);
        if (!l) {
            l = (async () => {
                if (!block || block.type !== 'pdfseite' || !block.quelleId)
                    return [];
                const griff = await griffVon(String(block.quelleId));
                return griff ? griff.textMitLage(Number(block.nr) || 1) : [];
            })().catch(() => []);
            lagen.set(id, l);
        }
        return l;
    };
    const stueckBei = async (block, x, y, nah = 2) => {
        const stuecke = await lageVonBlock(block);
        let beste = null;
        for (const st of stuecke) {
            if (!st || typeof st.s !== 'string' || !st.s.trim())
                continue;
            if (x < st.x - nah || x > st.x + st.w + nah)
                continue;
            if (y < st.y - nah || y > st.y + st.h + nah)
                continue;
            if (!beste || st.w * st.h < beste.w * beste.h)
                beste = st;
        }
        return beste;
    };
    const quellenSchliessen = () => {
        griffe.forEach(g => { void g.then(x => { try {
            x?.schliessen?.();
        }
        catch { } }); });
        griffe.clear();
        lagen.clear();
    };
    return { oeffne, BREITE_PX, TEXT_MAX, lageVonBlock, stueckBei, quellenSchliessen };
})();
window.PdfLeser = PdfLeser;
