"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/helfer/vorschau.ts (npm run bauen:ts). */
const Vorschau = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const klartext = (roh) => String(roh ?? '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\(\(([^)]+)\)\)/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`([^`]+?)`/g, '$1')
        .replace(/^\s{0,3}[-*+]\s+/gm, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
    const kinder = (seiteId) => {
        if (!seiteId || typeof Store === 'undefined' ||
            typeof Store.childrenOf !== 'function')
            return [];
        try {
            return Store.childrenOf(seiteId);
        }
        catch {
            return [];
        }
    };
    const anriss = (seiteId, titel = '', laenge = 90) => {
        let text = '';
        for (const kind of kinder(seiteId)) {
            const stueck = klartext(String(kind?.text || ''));
            if (!stueck)
                continue;
            if (!text && titel && stueck.toLowerCase().startsWith(titel.toLowerCase())) {
                const rest = stueck.slice(titel.length).replace(/^[\s—–:·.,;-]+/, '');
                if (!rest)
                    continue;
                if (/^[A-ZÄÖÜ0-9„"«]/.test(rest)) {
                    text = rest;
                    continue;
                }
            }
            text += (text ? (/[.!?:…]$/.test(text) ? ' ' : ' · ') : '') + stueck;
            if (text.length >= laenge)
                break;
        }
        return text.length > laenge ? text.slice(0, laenge - 1).trimEnd() + '…' : text;
    };
    const zeichen = (id) => {
        const reg = globalThis.Register;
        return reg?.symbole?.alsSvg ? reg.symbole.alsSvg(id, 12) : '';
    };
    const OHNE_TEXT = (art) => {
        const reg = globalThis.Register;
        let name = '', icon = '';
        try {
            const t = reg?.bloecke?.eines ? reg.bloecke.eines(art) : null;
            if (t) {
                name = String(t.name || '');
                icon = String(t.icon || '');
            }
        }
        catch { }
        if (!name)
            return '<span class="mini-obj mini-obj-leer"></span>';
        return '<span class="mini-obj">' + esc(icon) + ' ' + esc(name) + '</span>';
    };
    const TRAEGT_KEINEN_TEXT = new Set([
        'blatt', 'schaltplan', 'pdfseite', 'zeichenflaeche', 'whiteboard', 'mindmap',
        'image', 'video', 'audio', 'file', 'pdf', 'table', 'spreadsheet',
        'database', 'chart', 'dashboard', 'embed', 'simulation'
    ]);
    const miniatur = (seiteId, zeilen = 5) => {
        const raus = [];
        for (const block of kinder(seiteId)) {
            if (raus.length >= zeilen)
                break;
            const art = String(block?.type || 'text');
            if (art === 'divider') {
                raus.push('<span class="mini-hr"></span>');
                continue;
            }
            const text = klartext(String(block?.text || ''));
            if (!text && TRAEGT_KEINEN_TEXT.has(art)) {
                raus.push(OHNE_TEXT(art));
                continue;
            }
            if (!text)
                continue;
            const kurz = esc(text.length > 120 ? text.slice(0, 119) + '…' : text);
            if (art === 'h1' || art === 'h2' || art === 'h3' || art.startsWith('toggle-h')) {
                raus.push('<b>' + kurz + '</b>');
                continue;
            }
            if (art === 'todo') {
                raus.push('<span class="mini-todo">' +
                    zeichen(block?.checked ? 'boxChecked' : 'box') + kurz + '</span>');
                continue;
            }
            if (art === 'bullet' || art === 'number' || art === 'toggle') {
                raus.push('<span class="mini-li">' + kurz + '</span>');
                continue;
            }
            if (art === 'code' || art === 'equation') {
                raus.push('<code>' + kurz + '</code>');
                continue;
            }
            if (art === 'quote' || art === 'callout') {
                raus.push('<span class="mini-q">' + kurz + '</span>');
                continue;
            }
            raus.push('<span>' + kurz + '</span>');
        }
        return raus.join('');
    };
    const umfang = (seiteId) => kinder(seiteId).length;
    const BILDFELD = {
        pdfseite: 'bildDateiId',
        image: 'dateiId',
        bild: 'dateiId'
    };
    const bildDatei = (seiteId, tiefe = 3) => {
        const gesehen = new Set();
        const suche = (id, rest) => {
            if (!id || rest < 0 || gesehen.has(id))
                return null;
            gesehen.add(id);
            const b = Store.getBlock(id);
            if (!b)
                return null;
            const feld = BILDFELD[String(b.type || '')];
            if (feld && b[feld])
                return String(b[feld]);
            for (const k of b.content || []) {
                const kind = Store.getBlock(k);
                if (!kind || kind.alive === false)
                    continue;
                const treffer = suche(k, rest - 1);
                if (treffer)
                    return treffer;
            }
            return null;
        };
        return suche(seiteId, tiefe);
    };
    const TINTE_BLOCK = new Set(['blatt', 'pdfseite', 'zeichenflaeche']);
    const tinteBlock = (seiteId, tiefe = 3) => {
        const gesehen = new Set();
        const suche = (id, rest) => {
            if (!id || rest < 0 || gesehen.has(id))
                return null;
            gesehen.add(id);
            const b = Store.getBlock(id);
            if (!b)
                return null;
            if (TINTE_BLOCK.has(String(b.type || '')) &&
                Array.isArray(b.marken) && b.marken.length)
                return b;
            for (const k of b.content || []) {
                const kind = Store.getBlock(k);
                if (!kind || kind.alive === false)
                    continue;
                const treffer = suche(k, rest - 1);
                if (treffer)
                    return treffer;
            }
            return null;
        };
        return suche(seiteId, tiefe);
    };
    const tinteSvg = (seiteId, breite = 160, hoehe = 226) => {
        if (typeof InkThumbnail === 'undefined')
            return '';
        const b = tinteBlock(seiteId);
        if (!b)
            return '';
        const quelle = { breite: Number(b.blattBreite) || 794,
            hoehe: Number(b.blattHoehe) || 1123 };
        const d = InkThumbnail.deckel(b.marken, quelle, { breite, hoehe });
        if (!InkThumbnail.hatInhalt(d))
            return '';
        const pfade = d.zuege.map((z) => '<path d="' + esc(z.d) + '" stroke="' + esc(z.farbe) +
            '" stroke-width="' + esc(String(Math.round(z.breite * 10) / 10)) +
            '" opacity="' + esc(String(z.deckkraft)) +
            '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>').join('');
        return '<svg class="vs-tinte" viewBox="0 0 ' + breite + ' ' + hoehe + '" ' +
            'width="100%" height="100%" aria-hidden="true" focusable="false">' +
            pfade + '</svg>';
    };
    const bilderNachtragen = (wurzel) => {
        if (!wurzel || typeof Dateien === 'undefined')
            return;
        wurzel.querySelectorAll('img[data-vorschau]').forEach(el => {
            const id = el.dataset['vorschau'] || '';
            if (!id)
                return;
            const da = Dateien.adresseBekannt ? Dateien.adresseBekannt(id) : null;
            if (da) {
                el.src = da;
                return;
            }
            Dateien.adresse(id).then((u) => {
                if (!el.isConnected)
                    return;
                if (u)
                    el.src = u;
                else
                    el.remove();
            }, () => { el.remove(); });
        });
    };
    return { klartext, anriss, miniatur, umfang, bildDatei, bilderNachtragen,
        tinteSvg, tinteBlock };
})();
window.Vorschau = Vorschau;
