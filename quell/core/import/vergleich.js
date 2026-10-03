"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/import/vergleich.ts (npm run bauen:ts). */
const ImportVergleich = (() => {
    const TITEL = 5;
    const OHNE = ['wolkeVersion', 'folge', 'basis'];
    const kern = (s) => {
        if (!s || typeof s !== 'object')
            return String(s);
        const schluessel = Object.keys(s).filter(k => !OHNE.includes(k)).sort();
        return JSON.stringify(schluessel.map(k => [k, s[k]]));
    };
    const titelVon = (s) => {
        const t = String(s?.text ?? s?.name ?? '').trim();
        if (t)
            return t.length > 40 ? t.slice(0, 39) + '…' : t;
        return String(s?.type || s?.id || 'Ohne Titel');
    };
    const gruppe = (saetze) => ({
        anzahl: saetze.length,
        titel: saetze
            .slice()
            .sort((a, b) => String(b?.edited || b?.created || '')
            .localeCompare(String(a?.edited || a?.created || '')))
            .slice(0, TITEL)
            .map(titelVon)
    });
    const rechnen = (hier, sicherung, art) => {
        const ersetzen = art === 'ersetzen';
        const neu = [], ersetzt = [], gleich = [], verschwindet = [];
        const faecher = [...new Set([...Object.keys(hier || {}),
                ...Object.keys(sicherung || {})])];
        for (const fach of faecher) {
            const a = (hier || {})[fach] || {};
            const b = (sicherung || {})[fach] || {};
            for (const id of Object.keys(b)) {
                if (!Object.prototype.hasOwnProperty.call(a, id)) {
                    neu.push(b[id]);
                    continue;
                }
                if (kern(a[id]) === kern(b[id]))
                    gleich.push(b[id]);
                else
                    ersetzt.push(b[id]);
            }
            if (ersetzen) {
                for (const id of Object.keys(a))
                    if (!Object.prototype.hasOwnProperty.call(b, id))
                        verschwindet.push(a[id]);
            }
        }
        const daHier = faecher.reduce((s, f) => s + Object.keys((hier || {})[f] || {}).length, 0);
        return {
            art: ersetzen ? 'ersetzen' : 'zusammenfuehren',
            neu: gruppe(neu), ersetzt: gruppe(ersetzt),
            gleich: gruppe(gleich), verschwindet: gruppe(verschwindet),
            danach: ersetzen ? neu.length + ersetzt.length + gleich.length
                : daHier + neu.length
        };
    };
    const zaehlwort = (n, eins, viele) => n + ' ' + (n === 1 ? eins : viele);
    const satz = (e) => {
        if (!e)
            return '';
        const teile = [];
        if (e.neu.anzahl)
            teile.push(zaehlwort(e.neu.anzahl, 'Satz kommt dazu', 'Sätze kommen dazu'));
        if (e.ersetzt.anzahl)
            teile.push(zaehlwort(e.ersetzt.anzahl, 'Satz wird überschrieben', 'Sätze werden überschrieben'));
        if (!teile.length && !e.verschwindet.anzahl)
            return 'Diese Sicherung ändert nichts — sie ist derselbe Stand.';
        let t = teile.join(', ') + '.';
        if (e.verschwindet.anzahl) {
            t += ' ' + zaehlwort(e.verschwindet.anzahl, 'Satz verschwindet', 'Sätze verschwinden') + ':';
            t += ' ' + e.verschwindet.titel.join(', ') +
                (e.verschwindet.anzahl > e.verschwindet.titel.length ? ' …' : '') + '.';
        }
        return t;
    };
    const warnt = (e) => !!e && e.verschwindet.anzahl > 0;
    return { rechnen, satz, warnt, kern, titelVon, TITEL };
})();
window.ImportVergleich = ImportVergleich;
