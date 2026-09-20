"use strict";
/* ============================================================================
 * schale/bedienung/linse.ts — die wandernde Glaslinse, genau einmal definiert
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/linse.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redur hat am 20. September zwei Bildschirmaufnahmen geschickt: die
 * Apple-TV-App unter iOS 26 und GoodNotes. An der ersten hing sein Satz „ich
 * will die untere Übergang haben". Was dort passiert, ist nicht ein Kasten,
 * der springt, sondern eine LINSE, die wandert: sie vergrössert, was unter
 * ihr liegt, zieht es beim Fahren mit, wirft an ihrer Oberkante einen
 * Farbsaum und rastet am Ziel ein.
 *
 * Redion hatte die Hälfte davon schon. `#ho-pille` wandert seit E236 von
 * Reiter zu Reiter, und der Grund steht dort: „ein Hintergrund, der springt,
 * sagt ‚ein anderer Knopf' — einer, der wandert, sagt ‚derselbe Ort, weiter
 * vorn'." Diese Datei fügt hinzu, was fehlte: das GLAS.
 *
 * ZWEI FILTER, NICHT EINER. Im Vorbild ist die Linse im Ruhezustand fast
 * klar und erst während der Fahrt heftig — sie verzerrt, wenn sie sich
 * bewegt, wie Wasser, das man zieht. Ein Filterwert lässt sich nicht
 * animieren, also gibt es zwei und die Pille tauscht sie. Gemessen, nicht
 * geschätzt: Ruhe verschiebt um 15, Fahrt um 24 Blattpunkte.
 *
 * WARUM EINE EIGENE DATEI — und nicht nur CSS: eine Brechung braucht
 * `feDisplacementMap`, und das braucht einen `<filter id="…">`. Dieselbe
 * Antwort wie bei der Textur (E462): GENAU EINMAL global definieren und dann
 * referenzieren. Zwei Halter wären zwei gleiche Filter, und E440 hat am
 * KI-Funken gezeigt, was passiert, wenn mehrere Instanzen sich eine ID
 * teilen.
 *
 * DIE KARTE IST DER GANZE TRICK. `feDisplacementMap` liest ein Bild und
 * verschiebt jeden Bildpunkt um das, was dort im roten (waagerecht) und
 * grünen Kanal (senkrecht) steht. Grau — 128,128,128 — heisst „nicht
 * verschieben". Unsere Karte läuft von Rot am linken Rand nach Schwarz am
 * rechten und von Grün oben nach Schwarz unten; am Rand wird also nach
 * innen gegriffen, in der Mitte gar nicht. Das ist eine Lupe.
 *
 * DER FARBSAUM entsteht danach: derselbe gebrochene Inhalt wird dreimal
 * genommen, rot und blau um einen Hauch gegeneinander versetzt, und die
 * drei Kanäle werden wieder zusammengelegt. Echtes Glas tut genau das,
 * weil es Farben verschieden stark bricht.
 * ==========================================================================*/
const Linse = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const HALTER = 'ru-linse-halter';
    const RUHE = 'ru-linse-ruhe';
    const FAHRT = 'ru-linse-fahrt';
    /* Die Karte als Bild. Sie wird auf die Grösse der Linse gezogen
       (`preserveAspectRatio="none"`), die Zahlen hier sind also nur ein
       Seitenverhältnis, keine Pixel. */
    const KARTE = 'data:image/svg+xml;utf8,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='52'><defs>" +
        "<linearGradient id='x' x1='0' y1='0' x2='1' y2='0'>" +
        "<stop offset='0' stop-color='#f00'/><stop offset='1' stop-color='#000'/></linearGradient>" +
        "<linearGradient id='y' x1='0' y1='0' x2='0' y2='1'>" +
        "<stop offset='0' stop-color='#0f0'/><stop offset='1' stop-color='#000'/></linearGradient>" +
        "</defs><rect width='120' height='52' fill='#808080'/>" +
        "<rect width='120' height='52' fill='url(#x)' style='mix-blend-mode:screen'/>" +
        "<rect width='120' height='52' fill='url(#y)' style='mix-blend-mode:screen'/></svg>");
    const el = (name, werte) => {
        const k = document.createElementNS(NS, name);
        for (const [n, w] of Object.entries(werte))
            k.setAttribute(n, w);
        return k;
    };
    /** Ein Filter: Karte holen, weichzeichnen, damit verschieben, Farbsaum. */
    const glas = (id, weich, verschub, saum) => {
        /* DER FILTERBEREICH IST GENAU DAS ELEMENT. Mit einem grösseren Bereich
           (etwa -30%/160%) läge die Karte verschoben über dem Glas, und heraus
           käme ein dunkler Balken quer durch die Linse statt einer Brechung.
           Am 20. September einmal gebaut und im Bild gesehen. */
        const f = el('filter', {
            id, x: '0%', y: '0%', width: '100%', height: '100%',
            'color-interpolation-filters': 'sRGB'
        });
        f.append(el('feImage', { href: KARTE, x: '0%', y: '0%', width: '100%', height: '100%',
            preserveAspectRatio: 'none', result: 'k' }), el('feGaussianBlur', { in: 'k', stdDeviation: weich, result: 'kw' }), el('feDisplacementMap', { in: 'SourceGraphic', in2: 'kw', scale: verschub,
            xChannelSelector: 'R', yChannelSelector: 'G', result: 'g' }), el('feOffset', { in: 'g', dx: saum, result: 'vr' }), el('feOffset', { in: 'g', dx: '-' + saum, result: 'vb' }), el('feColorMatrix', { in: 'vr', type: 'matrix', result: 'kr',
            values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' }), el('feColorMatrix', { in: 'g', type: 'matrix', result: 'kg',
            values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' }), el('feColorMatrix', { in: 'vb', type: 'matrix', result: 'kb',
            values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' }), el('feBlend', { in: 'kr', in2: 'kg', mode: 'screen', result: 'krg' }), el('feBlend', { in: 'krg', in2: 'kb', mode: 'screen' }));
        return f;
    };
    /** Den Halter anlegen, falls es ihn noch nicht gibt. Mehrfach rufen ist
     *  ausdrücklich erlaubt — der zweite Ruf tut nichts. */
    const sicherstellen = () => {
        if (document.getElementById(HALTER))
            return;
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('id', HALTER);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        const defs = document.createElementNS(NS, 'defs');
        defs.append(glas(RUHE, '9', '15', '0.22'), glas(FAHRT, '9', '24', '0.55'));
        svg.append(defs);
        document.body.append(svg);
    };
    return { HALTER, RUHE, FAHRT, sicherstellen };
})();
window.Linse = Linse;
