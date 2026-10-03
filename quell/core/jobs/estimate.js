"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/jobs/estimate.ts (npm run bauen:ts). */
const Schaetzer = (() => {
    const SCHWELLE_MS = 20_000;
    const GEDAECHTNIS = 8;
    const STARTWERT = {
        jeDatei: { pdf: 40, bild: 25, text: 3.4, tabelle: 12, office: 60, sonst: 8 },
        jeSeite: 350,
        bytesJeSeite: 200 * 1024,
        laeufe: 0,
    };
    const frisch = () => ({
        jeDatei: { ...STARTWERT.jeDatei },
        jeSeite: STARTWERT.jeSeite,
        bytesJeSeite: STARTWERT.bytesJeSeite,
        laeufe: 0,
    });
    const ausAblage = (roh) => {
        const e = frisch();
        if (!roh || typeof roh !== 'object')
            return e;
        const r = roh;
        const zahl = (w, ersatz) => {
            const n = Number(w);
            return Number.isFinite(n) && n > 0 && n < 3_600_000 ? n : ersatz;
        };
        const jd = (r['jeDatei'] || {});
        Object.keys(e.jeDatei).forEach(a => {
            e.jeDatei[a] = zahl(jd[a], e.jeDatei[a]);
        });
        e.jeSeite = zahl(r['jeSeite'], e.jeSeite);
        e.bytesJeSeite = zahl(r['bytesJeSeite'], e.bytesJeSeite);
        const l = Number(r['laeufe']);
        e.laeufe = Number.isFinite(l) && l > 0 ? Math.min(Math.floor(l), 9999) : 0;
        return e;
    };
    const artVon = (name) => {
        const n = String(name || '').toLowerCase();
        if (/\.pdf$/.test(n))
            return 'pdf';
        if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(n))
            return 'bild';
        if (/\.(md|markdown|txt|html?|htm)$/.test(n))
            return 'text';
        if (/\.(csv|tsv)$/.test(n))
            return 'tabelle';
        if (/\.(xlsx|xlsm|ods|docx|epub|pptx)$/.test(n))
            return 'office';
        return 'sonst';
    };
    const seitenAus = (bytes, e) => Math.max(1, Math.round(bytes / Math.max(1024, e.bytesJeSeite)));
    const schaetze = (posten, erfahrung) => {
        const e = erfahrung || frisch();
        let ms = 0, seiten = 0;
        for (const p of posten) {
            const art = (p && p.art) in e.jeDatei ? p.art : 'sonst';
            ms += e.jeDatei[art];
            if (art === 'pdf') {
                const s = seitenAus(Math.max(0, Number(p.bytes) || 0), e);
                seiten += s;
                ms += s * e.jeSeite;
            }
        }
        return { ms: Math.round(ms), seiten, dateien: posten.length, gemessen: e.laeufe > 0 };
    };
    const dauerSatz = (ms) => {
        if (ms < SCHWELLE_MS)
            return '';
        const s = Math.round(ms / 1000);
        if (s < 90)
            return 'rund eine halbe Minute';
        const min = Math.round(s / 60);
        if (min < 60)
            return 'rund ' + min + ' Minuten';
        const std = ms / 3_600_000;
        if (std < 1.75)
            return 'gut eine Stunde';
        return 'rund ' + Math.round(std) + ' Stunden';
    };
    const satz = (s) => {
        const dauer = dauerSatz(s.ms);
        if (!dauer)
            return '';
        const kern = s.seiten > 0
            ? s.seiten + (s.seiten === 1 ? ' PDF-Seite' : ' PDF-Seiten') + ' — ' + dauer
            : dauer;
        return s.gemessen ? kern : kern + ' (geschätzt, noch ohne Messung)';
    };
    const lerne = (erfahrung, gemessen) => {
        const e = erfahrung ? ausAblage(erfahrung) : frisch();
        const gewicht = 1 / Math.min(e.laeufe + 1, GEDAECHTNIS);
        const misch = (alt, neu) => Number.isFinite(neu) && neu > 0 ? alt + (neu - alt) * gewicht : alt;
        const jeArt = gemessen.jeArt || {};
        Object.keys(e.jeDatei).forEach(a => {
            const m = jeArt[a];
            if (m && m.dateien > 0)
                e.jeDatei[a] = misch(e.jeDatei[a], m.ms / m.dateien);
        });
        const pdf = gemessen.pdf;
        if (pdf && pdf.seiten > 0) {
            e.jeSeite = misch(e.jeSeite, pdf.ms / pdf.seiten);
            if (pdf.bytes > 0)
                e.bytesJeSeite = misch(e.bytesJeSeite, pdf.bytes / pdf.seiten);
        }
        e.laeufe = Math.min(e.laeufe + 1, 9999);
        return e;
    };
    return { schaetze, satz, dauerSatz, lerne, artVon, seitenAus,
        frisch, ausAblage, SCHWELLE_MS, GEDAECHTNIS, STARTWERT };
})();
globalThis.Schaetzer = Schaetzer;
