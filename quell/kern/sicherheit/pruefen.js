"use strict";
/* ============================================================================
 * kern/sicherheit/pruefen.js — Werte prüfen, bevor sie Schaden anrichten
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/sicherheit/pruefen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/sicherheit/pruefen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Zwei Sorten Prüfung, und sie werden gern verwechselt:
 *
 *   **Form** — passt der Wert überhaupt in dieses Feld? Eine Zahl in ein
 *   Zahlenfeld, ein Datum in ein Datumsfeld. Das prüft `Formen`.
 *
 *   **Sinn** — ist der Wert brauchbar? Eine E-Mail mit @, eine Adresse, die
 *   irgendwohin führt, ein Betrag, der nicht negativ ist. Das prüft diese
 *   Datei.
 *
 * Jede Prüfung gibt hier **keinen Wahrheitswert zurück, sondern einen Satz.**
 * `false` sagt niemandem, was zu tun ist. „Da fehlt das @" schon.
 *
 * Und jede Prüfung ist **nachsichtig beim Lesen, streng beim Schreiben**:
 * ein vorhandener Wert, der nicht passt, wird gemeldet — aber nie still
 * gelöscht. Daten wegzuwerfen, weil sie einer Regel nicht genügen, ist der
 * sichere Weg, Arbeit zu vernichten.
 * ==========================================================================*/
const Pruefen = (() => {
    const leer = (v) => v === undefined || v === null || v === '' ||
        (Array.isArray(v) && !v.length);
    const gut = () => ({ ok: true, satz: '' });
    const schlecht = (satz) => ({ ok: false, satz });
    /* ========================================================================
     * 1 · EINZELNE WERTE
     * ======================================================================*/
    const mail = (v) => {
        if (leer(v))
            return gut();
        const s = String(v).trim();
        if (!s.includes('@'))
            return schlecht('Da fehlt das @.');
        const [vorn, hinten] = s.split('@').length === 2 ? s.split('@') : ['', ''];
        if (!vorn)
            return schlecht('Vor dem @ steht nichts.');
        if (!hinten || !hinten.includes('.'))
            return schlecht('Nach dem @ fehlt der Punkt.');
        if (/\s/.test(s))
            return schlecht('Eine E-Mail hat keine Leerzeichen.');
        return gut();
    };
    const adresse = (v) => {
        if (leer(v))
            return gut();
        const s = String(v).trim();
        if (/^(javascript|vbscript|file|about):/i.test(s))
            return schlecht('Diese Art Adresse ist nicht erlaubt.');
        if (/^data:/i.test(s) && !/^data:image\//i.test(s))
            return schlecht('Nur Bilder dürfen als data: kommen.');
        if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && !s.startsWith('/') && !s.startsWith('#'))
            return schlecht('Da fehlt https:// am Anfang.');
        return gut();
    };
    const telefon = (v) => {
        if (leer(v))
            return gut();
        const s = String(v).replace(/[\s()\/.-]/g, '');
        if (!/^\+?[0-9]{5,15}$/.test(s))
            return schlecht('Das sieht nicht nach einer Telefonnummer aus.');
        return gut();
    };
    const zahl = (v, opt = {}) => {
        if (leer(v))
            return gut();
        const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
        if (!isFinite(n))
            return schlecht('Das ist keine Zahl.');
        if (opt.min !== undefined && n < opt.min)
            return schlecht('Mindestens ' + opt.min + '.');
        if (opt.max !== undefined && n > opt.max)
            return schlecht('Höchstens ' + opt.max + '.');
        if (opt.ganz && !Number.isInteger(n))
            return schlecht('Nur ganze Zahlen.');
        return gut();
    };
    const datum = (v) => {
        if (leer(v))
            return gut();
        /* `isNaN(d)` mit einem Date darin ging, weil JavaScript vorher in eine
           Zahl umrechnet — und ging genau deshalb still schief, wenn `Dates.parse`
           etwas anderes als ein Date zurückgab. `getTime()` sagt, was gemeint
           ist, und meldet es, wenn es kein Datum ist. */
        const d = (typeof Dates !== 'undefined')
            ? Dates.parse(v) : new Date(String(v));
        if (!(d instanceof Date) || isNaN(d.getTime()))
            return schlecht('Das ist kein Datum.');
        return gut();
    };
    const text = (v, opt = {}) => {
        const s = String(v ?? '');
        if (opt.min !== undefined && s.length < opt.min)
            return schlecht('Mindestens ' + opt.min + ' Zeichen.');
        if (opt.max !== undefined && s.length > opt.max)
            return schlecht('Höchstens ' + opt.max + ' Zeichen — das sind ' + s.length + '.');
        if (opt.muster) {
            try {
                if (!new RegExp(opt.muster).test(s))
                    return schlecht(opt.satz || 'Das passt nicht zum Muster.');
            }
            catch {
                return schlecht('Das Muster selbst ist kaputt.');
            }
        }
        return gut();
    };
    const kennung = (v) => {
        if (leer(v))
            return schlecht('Ohne Kennung geht nichts.');
        if (typeof Ids !== 'undefined' && !Ids.isValid(v))
            return schlecht('Das sieht nicht nach einer Kennung aus.');
        return gut();
    };
    /* Ein Passwortsatz — bewusst nach Länge, nicht nach Sonderzeichen.
       Vier zufällige Wörter sind sicherer als „P@ssw0rt!" und leichter zu
       merken; die Regel mit den Sonderzeichen erzeugt nur Zettel am Monitor. */
    const satzFuerSchluessel = (v) => {
        const s = String(v ?? '');
        if (s.length < 12)
            return schlecht('Zu kurz. Nimm einen Satz, nicht ein Wort — ' +
                'mindestens zwölf Zeichen, besser vier Wörter.');
        if (/^(.)\1+$/.test(s))
            return schlecht('Das ist ein Zeichen, wiederholt.');
        if (s.trim().split(/\s+/).length < 2 && s.length < 20)
            return schlecht('Ein einzelnes Wort ist schnell geraten. Nimm einen Satz.');
        return gut();
    };
    /* ========================================================================
     * 2 · GANZE SÄTZE
     * ======================================================================*/
    /**
     * Alle Regeln einer Spalte auf einen Wert anwenden.
     * Nutzt dieselben Regeln wie die Prüfregeln der Datenbank — hier steht
     * nur die Sinnprüfung dazu.
     */
    const feld = (def, wert) => {
        if (!def)
            return gut();
        if (def.pflicht && leer(wert))
            return schlecht('Dieses Feld darf nicht leer sein.');
        if (leer(wert))
            return gut();
        switch (def.type) {
            case 'email': return mail(wert);
            case 'url': return adresse(wert);
            case 'phone': return telefon(wert);
            case 'number': return zahl(wert, { min: def.min, max: def.max, ganz: def.ganz });
            case 'date': return datum(wert);
            default: return text(wert, { min: def.min, max: def.max,
                muster: def.muster, satz: def.musterSatz });
        }
    };
    /** Eine ganze Zeile prüfen. Eine leere Liste heisst: nichts zu melden. */
    const zeile = (schema, props) => {
        const raus = [];
        for (const [k, def] of Object.entries(schema || {})) {
            const r = feld(def, (props || {})[k]);
            if (!r.ok)
                raus.push({ feld: k, name: def?.name || k, satz: r.satz });
        }
        return raus;
    };
    /* ========================================================================
     * 3 · GRENZEN
     * ======================================================================*/
    /** Passt das noch in die Ablage? */
    const groesse = (bytes, grenze) => {
        const g = grenze || (typeof KONSTANTEN !== 'undefined' ? KONSTANTEN.DATEI_MAX : 500 * 1024 * 1024);
        if (bytes > g)
            return schlecht('Zu gross: ' + (bytes / 1048576).toFixed(1) +
                ' MB, erlaubt sind ' + Math.round(g / 1048576) + ' MB.');
        return gut();
    };
    return { mail, adresse, telefon, zahl, datum, text, kennung, satzFuerSchluessel,
        feld, zeile, groesse, leer, gut, schlecht };
})();
window.Pruefen = Pruefen;
