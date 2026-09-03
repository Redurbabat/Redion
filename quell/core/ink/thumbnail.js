"use strict";
/* ============================================================================
 * core/ink/thumbnail.js — der Deckel eines handbeschriebenen Blattes
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ink/thumbnail.ts`. `npm run bauen:ts` schreibt
 * daraus diese Datei.
 * ==========================================================================*/
const InkThumbnail = (() => {
    /* Unter dieser Breite sieht man einen Strich im Deckel nicht mehr. Ein
       Haar von 0,2 px ist auf einem Deckel dasselbe wie kein Strich. */
    const MIN_BREITE = 0.6;
    /* Mehr Punkte als das braucht ein Deckel nicht. Ein Strich mit 900
       Stützpunkten wird auf 160 px zu einer Linie mit 900 identischen
       Koordinaten — das kostet nur Speicher im DOM. */
    const MAX_PUNKTE = 40;
    /* Und mehr Marken als das ergeben kein Bild mehr, sondern eine Fläche. */
    const MAX_MARKEN = 400;
    /**
     * Eine Farbe, die wirklich eine Farbe ist.
     *
     * NUTZERDATEN GEHEN HIER IN EIN ATTRIBUT (§19). Eine Marke kommt aus dem
     * Block und damit aus einer Sicherung, die jemand anderes geschrieben
     * haben kann. `fill:url(#x)` oder ein angehängtes `"/><script`  hätten in
     * einem SVG-Attribut nichts zu suchen; erlaubt sind deshalb nur die drei
     * Formen, die der Zeichner selbst schreibt.
     */
    const farbeSicher = (roh, ersatz = '#1a1a1a') => {
        const s = String(roh ?? '').trim();
        if (/^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s))
            return s;
        if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(s))
            return s;
        if (/^[a-z]{3,20}$/.test(s))
            return s; /* black, red, cornflowerblue */
        return ersatz;
    };
    /** Jeden n-ten Punkt, aber Anfang und Ende immer. */
    const ausduennen = (pts, hoechstens) => {
        if (pts.length <= hoechstens)
            return pts;
        const schritt = pts.length / hoechstens;
        const raus = [];
        for (let i = 0; i < hoechstens - 1; i++) {
            const p = pts[Math.floor(i * schritt)];
            if (p)
                raus.push(p);
        }
        const letzter = pts[pts.length - 1];
        if (letzter)
            raus.push(letzter);
        return raus;
    };
    /**
     * Aus den Marken eines Blattes die Züge für einen Deckel rechnen.
     *
     * `quelle` ist die Grösse, in der gezeichnet wurde; `ziel` die des
     * Deckels. Skaliert wird MIT SEITENVERHÄLTNIS — ein gestauchtes Blatt
     * sähe aus wie eine andere Handschrift.
     */
    const deckel = (marken, quelle, ziel) => {
        const liste = Array.isArray(marken) ? marken : [];
        const qb = Math.max(1, Number(quelle?.breite) || 1);
        const qh = Math.max(1, Number(quelle?.hoehe) || 1);
        const zb = Math.max(1, Number(ziel?.breite) || 1);
        const zh = Math.max(1, Number(ziel?.hoehe) || 1);
        const faktor = Math.min(zb / qb, zh / qh);
        /* Mittig setzen, wenn das Verhältnis nicht genau passt. */
        const dx = (zb - qb * faktor) / 2;
        const dy = (zh - qh * faktor) / 2;
        const zuege = [];
        let ausgelassen = 0;
        for (const roh of liste.slice(0, MAX_MARKEN)) {
            const m = (roh || {});
            const art = String(m['art'] || '');
            /* Ein Bild hat seine eigene Datei und wird woanders gezeigt (E313);
               Text und Zettel bringen im Deckel nur graue Klötzchen. Gezeichnet
               wird, was mit der Hand geschrieben wurde. */
            if (art !== 'stift' && art !== 'marker' && art !== 'linie' &&
                art !== 'rechteck' && art !== 'ellipse' && art !== 'pfeil') {
                ausgelassen++;
                continue;
            }
            const pts = Array.isArray(m['pts']) ? m['pts'] : [];
            if (pts.length < 2) {
                ausgelassen++;
                continue;
            }
            const nutz = ausduennen(pts.filter(p => Array.isArray(p) && p.length >= 2), MAX_PUNKTE);
            if (nutz.length < 2) {
                ausgelassen++;
                continue;
            }
            const runde = (w) => Math.round(w * 10) / 10;
            const teile = nutz.map((p, i) => (i === 0 ? 'M' : 'L') + runde((Number(p[0]) || 0) * faktor + dx) +
                ' ' + runde((Number(p[1]) || 0) * faktor + dy));
            zuege.push({
                d: teile.join(' '),
                farbe: farbeSicher(m['farbe']),
                breite: Math.max(MIN_BREITE, (Number(m['breite']) || 2) * faktor),
                deckkraft: art === 'marker' ? 0.4 : 1,
            });
        }
        return { zuege, marken: liste.length, ausgelassen: ausgelassen + Math.max(0, liste.length - MAX_MARKEN) };
    };
    /** Ob es überhaupt etwas zu zeigen gibt. Leer heisst: den Deckel lassen,
        wie er war — ein leeres SVG ist schlechter als kein SVG. */
    const hatInhalt = (d) => !!d && d.zuege.length > 0;
    return { deckel, farbeSicher, ausduennen, hatInhalt,
        MIN_BREITE, MAX_PUNKTE, MAX_MARKEN };
})();
globalThis.InkThumbnail = InkThumbnail;
