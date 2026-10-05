"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/knowledge/gaps.ts (npm run bauen:ts). */
const KnowledgeGaps = (() => {
    const VORGABE = {
        schwelle: 40, verstaubtTage: 90, verstaubtRang: 45, jeArt: 30
    };
    const TAG_MS = 86400000;
    const tageSeit = (iso, jetzt) => {
        if (!iso)
            return 9999;
        const d = Date.parse(String(iso));
        if (!Number.isFinite(d))
            return 9999;
        return Math.max(0, Math.round((jetzt - d) / TAG_MS));
    };
    const ohneMarkierung = (t) => String(t || '')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/[*~]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    const fragenAus = (text) => {
        const gefunden = new Map();
        const merken = (roh, ganzeZeile) => {
            const t = ohneMarkierung(roh);
            if (t.length < 8)
                return;
            const alt = gefunden.get(t);
            if (!alt || (ganzeZeile && !alt.ganzeZeile))
                gefunden.set(t, { text: t, ganzeZeile });
        };
        let inCode = false;
        for (const roh of String(text || '').split(/\r?\n/)) {
            const zeile = roh.replace(/^[\s>*+\-]+/, '').trim();
            if (/^```/.test(zeile)) {
                inCode = !inCode;
                continue;
            }
            if (inCode || !zeile || zeile.startsWith('#'))
                continue;
            if (zeile.length >= 8 && zeile.length <= 200 && zeile.endsWith('?')) {
                merken(zeile, true);
                continue;
            }
            for (const treffer of zeile.matchAll(/([A-ZÄÖÜ][^.?!\n]{6,180}\?)/g))
                merken(treffer[1] || '', false);
        }
        return [...gefunden.values()];
    };
    const staerkeGeist = (referenzen) => Math.min(100, 40 + 20 * Math.max(0, referenzen - 1));
    const staerkeMehrdeutig = (kandidaten) => Math.min(100, 80 + 5 * Math.max(0, kandidaten - 2));
    const THEMA_TAGE = 90;
    const staerkeThema = (tage) => {
        if (!(tage >= THEMA_TAGE))
            return 25;
        return Math.min(55, 40 + 5 * Math.floor((tage - THEMA_TAGE) / 30));
    };
    const staerkeFrage = (laenge, ganzeZeile = true) => {
        const roh = Math.max(20, Math.min(70, 25 + Math.round(laenge / 2)));
        return ganzeZeile ? roh : Math.min(30, Math.round(roh / 2));
    };
    const staerkeVerstaubt = (rang, tage, grenzeTage) => {
        const ueber = Math.max(0, tage - grenzeTage);
        const zeit = Math.min(1, ueber / (grenzeTage * 2));
        return Math.round(Math.min(100, rang * (0.6 + 0.4 * zeit)));
    };
    const staerkeInsel = (tage) => tage < 7 ? 10 : Math.min(55, 20 + Math.round(tage / 10));
    const finden = (seiten, verweise, themen, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const schwelle = typeof opt.schwelle === 'number' ? opt.schwelle : VORGABE.schwelle;
        const verstaubtTage = typeof opt.verstaubtTage === 'number'
            ? opt.verstaubtTage : VORGABE.verstaubtTage;
        const verstaubtRang = typeof opt.verstaubtRang === 'number'
            ? opt.verstaubtRang : VORGABE.verstaubtRang;
        const jeArtMax = typeof opt.jeArt === 'number' ? opt.jeArt : VORGABE.jeArt;
        const funde = [];
        const alleSeiten = (seiten || []).filter(s => s && s.id);
        let abgeschnitten = 0;
        const geister = new Map();
        for (const v of verweise || []) {
            if (!v || v.status !== 'fehlt')
                continue;
            const schluessel = String(v.ziel || '').trim().toLocaleLowerCase('de');
            if (!schluessel)
                continue;
            if (!geister.has(schluessel))
                geister.set(schluessel, { ziel: String(v.ziel).trim(), von: new Map() });
            geister.get(schluessel).von.set(v.vonId, v.vonTitel || 'Ohne Titel');
        }
        abgeschnitten += Math.max(0, geister.size - jeArtMax);
        [...geister.values()]
            .sort((a, b) => b.von.size - a.von.size || a.ziel.localeCompare(b.ziel, 'de'))
            .slice(0, jeArtMax)
            .forEach(g => {
            const quellen = [...g.von.entries()].map(([id, titel]) => ({ id, titel }));
            funde.push({
                art: 'geist', titel: g.ziel, staerke: staerkeGeist(quellen.length),
                quellen,
                satz: quellen.length === 1
                    ? '„' + g.ziel + '" wird erwähnt, aber es gibt keine Seite dazu.'
                    : quellen.length + ' Seiten verweisen auf „' + g.ziel +
                        '" — die Seite gibt es nicht.'
            });
        });
        const mehrdeutig = new Map();
        for (const v of verweise || []) {
            if (!v || v.status !== 'mehrdeutig')
                continue;
            const schluessel = String(v.ziel || '').trim().toLocaleLowerCase('de');
            if (!schluessel)
                continue;
            if (!mehrdeutig.has(schluessel))
                mehrdeutig.set(schluessel, {
                    ziel: String(v.ziel).trim(),
                    kandidaten: Math.max(2, v.kandidaten || 2), von: new Map()
                });
            mehrdeutig.get(schluessel).von.set(v.vonId, v.vonTitel || 'Ohne Titel');
        }
        abgeschnitten += Math.max(0, mehrdeutig.size - jeArtMax);
        [...mehrdeutig.values()]
            .sort((a, b) => b.von.size - a.von.size || a.ziel.localeCompare(b.ziel, 'de'))
            .slice(0, jeArtMax)
            .forEach(m => funde.push({
            art: 'mehrdeutig', titel: m.ziel,
            staerke: staerkeMehrdeutig(m.kandidaten),
            quellen: [...m.von.entries()].map(([id, titel]) => ({ id, titel })),
            satz: '„' + m.ziel + '" passt auf ' + m.kandidaten +
                ' Seiten. Der Verweis führt irgendwohin — welche gemeint ist, ' +
                'steht nirgends.'
        }));
        const seitenNachId = new Map(alleSeiten.map(s => [s.id, s]));
        const duenn = (themen || [])
            .filter(t => t && Array.isArray(t.seiten) && t.seiten.length === 1)
            .map(t => {
            const seite = seitenNachId.get(String(t.seiten[0] || ''));
            return { t, tage: seite ? tageSeit(seite.edited, jetzt) : 0 };
        })
            .sort((a, b) => b.tage - a.tage);
        abgeschnitten += Math.max(0, duenn.length - jeArtMax);
        duenn
            .slice(0, jeArtMax)
            .forEach(({ t, tage }) => funde.push({
            art: 'thema', titel: '#' + t.tag, staerke: staerkeThema(tage),
            seiteId: String(t.seiten[0] || ''),
            satz: tage >= THEMA_TAGE
                ? 'Das Schlagwort #' + t.tag + ' steht seit ' + tage + ' Tagen an ' +
                    'genau einer Seite. Angefangen und liegengeblieben.'
                : 'Das Schlagwort #' + t.tag + ' steht an genau einer Seite. ' +
                    'Angefangen und nicht weitergeführt.'
        }));
        const jeFrage = new Map();
        for (const s of alleSeiten) {
            for (const frage of fragenAus(s.text || '')) {
                const schluessel = frage.text.toLocaleLowerCase('de');
                const da = jeFrage.get(schluessel);
                if (da) {
                    da.von.set(s.id, s.titel);
                    if (frage.ganzeZeile)
                        da.ganzeZeile = true;
                }
                else {
                    jeFrage.set(schluessel, {
                        text: frage.text, ganzeZeile: frage.ganzeZeile,
                        von: new Map([[s.id, s.titel]])
                    });
                }
            }
        }
        const fragenFunde = [...jeFrage.values()].map(f => {
            const quellen = [...f.von.entries()].map(([id, titel]) => ({ id, titel }));
            const ersteId = quellen[0] ? quellen[0].id : '';
            const ersterTitel = quellen[0] ? quellen[0].titel : '';
            return {
                art: 'frage', titel: f.text,
                staerke: staerkeFrage(f.text.length, f.ganzeZeile),
                seiteId: ersteId, quellen,
                satz: quellen.length === 1
                    ? 'Offene Frage auf „' + ersterTitel + '".'
                    : 'Dieselbe offene Frage steht auf ' + quellen.length + ' Seiten.'
            };
        });
        fragenFunde.sort((a, b) => b.staerke - a.staerke ||
            a.titel.localeCompare(b.titel, 'de'));
        abgeschnitten += Math.max(0, fragenFunde.length - jeArtMax);
        for (const f of fragenFunde.slice(0, jeArtMax))
            funde.push(f);
        const staubig = alleSeiten
            .map(s => ({ s, tage: tageSeit(s.edited, jetzt), rang: s.rang || 0 }))
            .filter(e => !e.s.gesperrt && e.rang >= verstaubtRang && e.tage >= verstaubtTage)
            .sort((a, b) => b.rang - a.rang || b.tage - a.tage);
        abgeschnitten += Math.max(0, staubig.length - jeArtMax);
        staubig
            .slice(0, jeArtMax)
            .forEach(e => funde.push({
            art: 'verstaubt', titel: e.s.titel,
            staerke: staerkeVerstaubt(e.rang, e.tage, verstaubtTage),
            seiteId: e.s.id,
            satz: '„' + e.s.titel + '" trägt viel im Netz (Rang ' + Math.round(e.rang) +
                '), wurde aber seit ' + e.tage + ' Tagen nicht angefasst.'
        }));
        const inseln = alleSeiten
            .filter(s => (s.grad || 0) === 0)
            .map(s => ({ s, tage: tageSeit(s.edited, jetzt) }))
            .sort((a, b) => b.tage - a.tage);
        abgeschnitten += Math.max(0, inseln.length - jeArtMax);
        inseln
            .slice(0, jeArtMax)
            .forEach(e => funde.push({
            art: 'insel', titel: e.s.titel, staerke: staerkeInsel(e.tage),
            seiteId: e.s.id,
            satz: '„' + e.s.titel + '" hängt an nichts: kein Verweis hin, keiner weg.'
        }));
        funde.sort((a, b) => b.staerke - a.staerke ||
            a.titel.localeCompare(b.titel, 'de'));
        for (const f of funde)
            f.id = kennung(f);
        const erledigt = new Set((opt.erledigt || []).map(String));
        const versteckt = erledigt.size
            ? funde.filter(f => erledigt.has(f.id)).length : 0;
        const sichtbar = versteckt ? funde.filter(f => !erledigt.has(f.id)) : funde;
        const stark = sichtbar.filter(f => f.staerke >= schwelle);
        const jeArt = {};
        for (const f of stark)
            jeArt[f.art] = (jeArt[f.art] || 0) + 1;
        return {
            funde: sichtbar, gezaehlt: stark.length, gesamt: sichtbar.length,
            jeArt, abgeschnitten, versteckt,
            satz: satzZu(stark.length, sichtbar.length, abgeschnitten, versteckt)
        };
    };
    const kennung = (f) => String(f.art) + '|' + String(f.seiteId || '') + '|' +
        String(f.titel || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
    const satzZu = (gezaehlt, gesamt, abgeschnitten = 0, versteckt = 0) => {
        const rest = gesamt - gezaehlt;
        const ab = versteckt
            ? ' ' + versteckt + (versteckt === 1 ? ' Fund ist' : ' Funde sind') +
                ' abgehakt und nicht dabei.' : '';
        const mehr = abgeschnitten
            ? ' Weitere ' + abgeschnitten + ' sind nicht aufgeführt — je Art werden ' +
                'höchstens die stärksten gezeigt.' : '';
        if (!gesamt)
            return 'Keine Lücken gefunden. Der Bestand hängt zusammen.' + mehr + ab;
        if (!gezaehlt)
            return 'Nichts Auffälliges. ' + gesamt +
                ' schwache Beobachtungen stehen unten — sie sind zu unsicher zum Zählen.' + mehr + ab;
        const wort = gezaehlt === 1 ? 'eine Lücke' : gezaehlt + ' Lücken';
        return 'Deutlich: ' + wort +
            (rest ? ', dazu ' + rest + ' schwächere Beobachtung' + (rest === 1 ? '' : 'en') : '') +
            '.' + mehr + ab;
    };
    return {
        finden, kennung, fragenAus, ohneMarkierung, tageSeit, satzZu,
        staerkeGeist, staerkeMehrdeutig, staerkeThema, staerkeFrage,
        staerkeVerstaubt, staerkeInsel, VORGABE, THEMA_TAGE
    };
})();
window.KnowledgeGaps = KnowledgeGaps;
