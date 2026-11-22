"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/dienst.ts (npm run bauen:ts). */
const WissenDienst = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const heute = () => new Date().toISOString().slice(0, 10);
    const WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const MONAT = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const datumLang = (iso) => {
        const d = new Date(iso + 'T12:00:00');
        return `${WOCHENTAG[d.getDay()]}, ${d.getDate()}. ${MONAT[d.getMonth()]} ${d.getFullYear()}`;
    };
    const unscharf = (text, suche) => {
        const t = String(text ?? '').toLowerCase(), q = String(suche ?? '').toLowerCase();
        if (!q)
            return 0;
        if (t === q)
            return 1000;
        if (t.startsWith(q))
            return 800 - t.length;
        const wort = t.indexOf(' ' + q);
        if (wort >= 0)
            return 600 - t.length;
        if (t.includes(q))
            return 400 - t.length;
        let i = 0, punkte = 0, letzte = -2;
        for (const c of q) {
            const stelle = t.indexOf(c, i);
            if (stelle < 0)
                return -1;
            punkte += (stelle === letzte + 1) ? 8 : 2;
            letzte = stelle;
            i = stelle + 1;
        }
        return punkte;
    };
    const zeitKurz = (iso) => {
        if (!iso)
            return '';
        const d = new Date(iso), j = new Date();
        const gleich = d.toDateString() === j.toDateString();
        const uhr = d.toTimeString().slice(0, 5);
        if (gleich)
            return 'Heute ' + uhr;
        const gestern = new Date(j);
        gestern.setDate(j.getDate() - 1);
        if (d.toDateString() === gestern.toDateString())
            return 'Gestern ' + uhr;
        return d.toLocaleDateString('de-DE') + ' ' + uhr;
    };
    const verfahren = () => (typeof Fsrs !== 'undefined' && Store.getMeta('lernVerfahren', 'sm2') === 'fsrs')
        ? 'fsrs' : 'sm2';
    const berechnePlan = (k, note, jetzt, art) => {
        const sr = Object.assign({ ease: 2.5, intervall: 0, wdh: 0 }, k.sr || {});
        let uebergang = false;
        if (art === 'fsrs') {
            const zuletzt = sr.zuletzt ? new Date(String(sr.zuletzt)).getTime() : 0;
            const tage = zuletzt ? Math.max(0, (jetzt.getTime() - zuletzt) / 86400000) : 0;
            let stand = (sr.fsrs && typeof sr.fsrs === 'object' &&
                Number(sr.fsrs.stabilitaet) > 0)
                ? { stabilitaet: Number(sr.fsrs.stabilitaet),
                    schwierigkeit: Number(sr.fsrs.schwierigkeit) || 5 }
                : null;
            if (!stand && (Number(sr.intervall) > 0 || Number(sr.wdh) > 0)) {
                stand = Fsrs.ausSm2(Number(sr.intervall) || 1, Number(sr.ease) || 2.5);
                uebergang = true;
            }
            const ziel = Math.min(0.97, Math.max(0.8, Number(Store.getMeta('lernZielrate', 0.9)) || 0.9));
            const erg = Fsrs.antworten(stand, Math.max(1, Math.min(4, Number(note))), tage, ziel);
            sr.fsrs = { stabilitaet: erg.stand.stabilitaet,
                schwierigkeit: erg.stand.schwierigkeit };
            sr.intervall = erg.abstandTage < 1 ? 0 : Math.round(erg.abstandTage);
        }
        else if (note < 3) {
            sr.wdh = 0;
            sr.intervall = note === 1 ? 0 : 1;
        }
        else {
            sr.wdh++;
            sr.intervall = sr.wdh === 1 ? 1 : sr.wdh === 2 ? 6 : Math.round(sr.intervall * sr.ease);
            sr.ease = Math.max(1.3, sr.ease + (0.1 - (4 - note) * (0.08 + (4 - note) * 0.02)));
        }
        const d = new Date(jetzt);
        if (sr.intervall === 0)
            d.setMinutes(d.getMinutes() + 10);
        else
            d.setDate(d.getDate() + sr.intervall);
        sr.faellig = d.toISOString();
        return { sr, uebergang };
    };
    const planVorschau = (k, jetzt = new Date()) => {
        const art = verfahren();
        return [1, 2, 3, 4].map(note => berechnePlan(k, note, jetzt, art).sr.intervall);
    };
    const planen = (k, note) => {
        const art = verfahren();
        const { sr, uebergang } = berechnePlan(k, note, new Date(), art);
        const altSr = k.sr || {};
        const vorher = {
            due: String(altSr.faellig || ''),
            interval: Number(altSr.intervall) || 0,
            ease: Number(altSr.ease) || 2.5,
            repetitions: Number(altSr.wdh) || 0
        };
        sr.zuletzt = Store.now();
        const alt = Array.isArray(k.reviewVerlauf)
            ? Object.fromEntries(k.reviewVerlauf
                .filter((entry) => entry && typeof entry === 'object')
                .map((entry, index) => [String(entry.id || 'legacy-' + index + '-' + (entry.at || '')), entry]))
            : (k.reviewVerlauf && typeof k.reviewVerlauf === 'object' ? { ...k.reviewVerlauf } : {});
        const reviewId = typeof Store.uid === 'function'
            ? Store.uid()
            : 'review-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
        alt[reviewId] = {
            id: reviewId,
            version: 1,
            at: sr.zuletzt,
            rating: Number(note),
            algorithm: art,
            ...(uebergang ? { uebergang: true } : {}),
            ...(art === 'fsrs' ? { fsrs: { ...sr.fsrs } } : {}),
            lapse: note < 3,
            before: vorher,
            after: {
                due: sr.faellig,
                interval: sr.intervall,
                ease: sr.ease,
                repetitions: sr.wdh
            }
        };
        const behalten = Object.values(alt)
            .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) || String(a.id || '').localeCompare(String(b.id || '')))
            .slice(-500);
        const reviewVerlauf = Object.fromEntries(behalten.map(entry => [String(entry.id), entry]));
        Store.updateBlock(k.id, { sr, reviewVerlauf, lernAlgorithmus: art });
        return sr;
    };
    const MD_TRAEGT = new Set([
        'text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number',
        'quote', 'callout', 'divider', 'code', 'equation', 'image', 'flashcard'
    ]);
    const mdTraegt = (b) => {
        if (!MD_TRAEGT.has(b.type))
            return false;
        if (b.type === 'image' && b.dateiId)
            return false;
        if (b.type === 'flashcard' && b.sr)
            return false;
        if (b.type === 'callout' && b.icon && b.icon !== '💡')
            return false;
        return true;
    };
    const MD_MARKE = {
        database: 'db', whiteboard: 'wb', chart: 'chart', table: 'tab'
    };
    const mdName = (b) => {
        const OHNE_REGISTER = {
            pdfseite: 'PDF-Seite', spalte: 'Spalte'
        };
        const art = OHNE_REGISTER[b.type] ||
            ((typeof Register !== 'undefined' && Register.bloecke?.eines)
                ? (Register.bloecke.eines(b.type)?.name || b.type)
                : b.type);
        const zusatz = b.type === 'pdfseite' && b.nr ? ' ' + Number(b.nr) : '';
        const titel = String(b.text || '').trim().slice(0, 40);
        return art + zusatz + (titel ? ': ' + titel : '');
    };
    const alsMarkdown = (p) => {
        const zeilen = [];
        const raus = (id, tiefe) => {
            Store.childrenOf(id).forEach((b) => {
                const ein = '  '.repeat(tiefe);
                if (!mdTraegt(b)) {
                    const marke = MD_MARKE[b.type] || 'blk';
                    zeilen.push(`<!--${marke}:${b.id}--> ${mdName(b)}`);
                    return;
                }
                if (b.type === 'divider') {
                    zeilen.push('---');
                    return;
                }
                if (b.type === 'code') {
                    zeilen.push('```' + (b.lang || ''));
                    zeilen.push(b.text || '');
                    zeilen.push('```');
                    return;
                }
                if (b.type === 'equation') {
                    zeilen.push('$$' + (b.text || '') + '$$');
                    return;
                }
                if (b.type === 'image') {
                    zeilen.push(`![${b.caption || ''}](${b.src || ''})`);
                    return;
                }
                if (b.type === 'page') {
                    zeilen.push(`${ein}[[${b.text || 'Ohne Titel'}]]`);
                    return;
                }
                const marke = {
                    h1: '# ', h2: '## ', h3: '### ', bullet: '- ', number: '1. ',
                    todo: b.checked ? '- [x] ' : '- [ ] ', quote: '> ', toggle: '> ',
                    callout: '> 💡 ', flashcard: '?? '
                }[b.type] || '';
                zeilen.push(ein + marke + (b.text || ''));
                raus(b.id, tiefe + 1);
            });
        };
        raus(p.id, 0);
        return zeilen.join('\n');
    };
    const ausMarkdown = (p, text, optionen = {}) => {
        const alteDbs = {};
        const erhaltene = new Map();
        if (optionen.preserveOpaqueIds) {
            const detach = (parentId) => {
                [...Store.childrenOf(parentId)].forEach((b) => {
                    if (mdTraegt(b)) {
                        detach(b.id);
                        return;
                    }
                    erhaltene.set(b.id, b);
                    const parent = Store.getBlock(parentId);
                    if (parent)
                        Store.updateBlock(parent.id, {
                            content: (parent.content || []).filter((id) => id !== b.id)
                        });
                    Store.updateBlock(b.id, { parentId: p.id, parentTable: 'block' });
                });
            };
            detach(p.id);
        }
        else {
            Store.childrenOf(p.id).forEach((b) => {
                if (!mdTraegt(b))
                    alteDbs[b.id] = Store.baum(b.id);
            });
        }
        const attachErhaltenen = (id, parentId) => {
            const block = erhaltene.get(id);
            const parent = Store.getBlock(parentId);
            if (!block || !parent || block.alive === false)
                return null;
            const vorher = Store.getBlock(block.parentId);
            if (vorher && vorher.id !== parent.id && (vorher.content || []).includes(block.id))
                Store.updateBlock(vorher.id, {
                    content: vorher.content.filter((kind) => kind !== block.id)
                });
            if (!(parent.content || []).includes(block.id))
                Store.updateBlock(parent.id, { content: [...(parent.content || []), block.id] });
            Store.updateBlock(block.id, { parentId: parent.id, parentTable: 'block' });
            erhaltene.delete(id);
            return block;
        };
        const retteUebrige = () => {
            [...erhaltene.keys()].forEach(id => attachErhaltenen(id, p.id));
        };
        const gemerkt = [];
        const merke = (id) => {
            Store.childrenOf(id).forEach((b) => {
                if (!mdTraegt(b))
                    return;
                const stil = b.stil && typeof b.stil === 'object' && Object.keys(b.stil).length
                    ? { ...b.stil } : null;
                gemerkt.push({ id: String(b.id), type: String(b.type || ''),
                    text: String(b.text || ''),
                    ...(b.color ? { color: String(b.color) } : {}),
                    ...(stil ? { stil } : {}) });
                merke(b.id);
            });
        };
        merke(p.id);
        const holeGemerktes = (typ, text) => {
            const i = gemerkt.findIndex(x => x.type === typ && x.text === String(text ?? ''));
            if (i < 0)
                return null;
            const [treffer] = gemerkt.splice(i, 1);
            return treffer ?? null;
        };
        try {
            Store.kinderLeeren(p.id);
            let imCode = false, codeText = [], codeLang = '';
            const zeilen = text.split('\n');
            const stapel = [p.id];
            const tiefeVon = (roh) => {
                const vorn = (roh.match(/^[ \t]*/)?.[0] || '').replace(/\t/g, '  ');
                return Math.floor(vorn.length / 2);
            };
            const elternFuer = (roh) => {
                const t = Math.min(tiefeVon(roh), stapel.length - 1);
                stapel.length = t + 1;
                return stapel[t];
            };
            const lege = (roh, typ, felder) => {
                const alt = holeGemerktes(typ, felder ? felder['text'] : '');
                const mit = { ...(felder || {}) };
                if (alt) {
                    mit['id'] = alt.id;
                    if (alt.color)
                        mit['color'] = alt.color;
                    if (alt.stil)
                        mit['stil'] = alt.stil;
                }
                const b = Store.addBlock(elternFuer(roh), typ, mit);
                stapel.push(b.id);
                return b;
            };
            const istTabellenzeile = (z) => /^\s*\|.*\|\s*$/.test(z);
            const istTrenner = (z) => /^\s*\|[\s:|-]+\|\s*$/.test(z) && /-/.test(z);
            const zellen = (z) => z.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
            let tabelle = null;
            let tabelleZeile = '';
            let codeZeile = '';
            let codeEinzug = '';
            const tabelleAbschliessen = () => {
                if (!tabelle)
                    return;
                if (tabelle.length) {
                    const breite = Math.max(...tabelle.map((r) => r.length));
                    const rows = tabelle.map((r) => {
                        const k = r.slice();
                        while (k.length < breite)
                            k.push('');
                        return k;
                    });
                    lege(tabelleZeile, 'table', { rows, kopfZeile: true });
                }
                tabelle = null;
                tabelleZeile = '';
            };
            zeilen.forEach((roh) => {
                if (!imCode && istTabellenzeile(roh)) {
                    if (istTrenner(roh)) {
                        if (!tabelle) {
                            tabelle = [];
                            tabelleZeile = roh;
                        }
                        return;
                    }
                    if (!tabelle) {
                        tabelle = [];
                        tabelleZeile = roh;
                    }
                    tabelle.push(zellen(roh));
                    return;
                }
                if (tabelle)
                    tabelleAbschliessen();
                const platz = roh.trim().match(/^<!--(?:db|wb|chart|tab|blk):([A-Za-z0-9_-]+)-->\s*(?:.*)$/);
                if (platz?.[1] && (erhaltene.has(platz[1]) || alteDbs[platz[1]])) {
                    const neu = erhaltene.has(platz[1])
                        ? attachErhaltenen(platz[1], elternFuer(roh))
                        : Store.baumEinfuegen(alteDbs[platz[1]], elternFuer(roh));
                    if (neu)
                        stapel.push(neu.id);
                    return;
                }
                if (roh.trim().startsWith('```')) {
                    if (imCode) {
                        lege(codeZeile, 'code', { text: codeText.join('\n'), lang: codeLang });
                        imCode = false;
                        codeText = [];
                        codeLang = '';
                    }
                    else {
                        imCode = true;
                        codeLang = roh.trim().slice(3).trim();
                        codeZeile = roh;
                        codeEinzug = roh.match(/^[ \t]*/)?.[0] || '';
                    }
                    return;
                }
                if (imCode) {
                    codeText.push(codeEinzug && roh.startsWith(codeEinzug)
                        ? roh.slice(codeEinzug.length) : roh);
                    return;
                }
                const z = roh.trim();
                if (!z)
                    return;
                if (/^(---|\*\*\*|___)$/.test(z)) {
                    lege(roh, 'divider');
                    return;
                }
                if (/^\$\$(.*)\$\$$/.test(z)) {
                    lege(roh, 'equation', { text: z.slice(2, -2) });
                    return;
                }
                const bild = z.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
                if (bild) {
                    lege(roh, 'image', { src: bild[2], caption: bild[1] });
                    return;
                }
                const m = z.match(/^(#{1,3})\s+(.*)$/);
                if (m) {
                    lege(roh, ['h1', 'h2', 'h3'][m[1].length - 1], { text: m[2] });
                    return;
                }
                const todo = z.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
                if (todo) {
                    lege(roh, 'todo', { text: todo[2], checked: todo[1].toLowerCase() === 'x' });
                    return;
                }
                if (/^[-*+]\s+/.test(z)) {
                    lege(roh, 'bullet', { text: z.replace(/^[-*+]\s+/, '') });
                    return;
                }
                if (/^\d+\.\s+/.test(z)) {
                    lege(roh, 'number', { text: z.replace(/^\d+\.\s+/, '') });
                    return;
                }
                if (/^>\s*💡\s*/.test(z)) {
                    lege(roh, 'callout', { text: z.replace(/^>\s*💡\s*/, ''), icon: '💡' });
                    return;
                }
                if (/^>\s+/.test(z)) {
                    lege(roh, 'quote', { text: z.replace(/^>\s+/, '') });
                    return;
                }
                if (/^\?\?\s+/.test(z)) {
                    lege(roh, 'flashcard', { text: z.replace(/^\?\?\s+/, '') });
                    return;
                }
                lege(roh, 'text', { text: z });
            });
            if (imCode && codeText.length)
                lege(codeZeile, 'code', { text: codeText.join('\n'), lang: codeLang });
            tabelleAbschliessen();
        }
        finally {
            retteUebrige();
        }
    };
    const statistikZahlen = (p) => {
        const sammle = (id, tiefe = 0) => {
            let t = '';
            Store.childrenOf(id).forEach((b) => { t += ' ' + (b.text || ''); t += sammle(b.id, tiefe + 1); });
            return t;
        };
        const text = ((p.text || '') + ' ' + sammle(p.id)).trim();
        const woerter = text.split(/\s+/).filter(Boolean);
        const saetze = text.split(/[.!?]+\s/).filter(x => x.trim().length > 1);
        const zeichen = text.length;
        const lesezeit = Math.max(1, Math.round(woerter.length / 200));
        const sprechzeit = Math.max(1, Math.round(woerter.length / 130));
        const blockAnzahl = (function zaehl(id) {
            let n = 0;
            Store.childrenOf(id).forEach((b) => { n += 1 + zaehl(b.id); });
            return n;
        })(p.id);
        const stop = new Set(('der die das und oder aber ich du er sie es wir ihr in im an auf für mit von zu ist sind ' +
            'war waren ein eine einen einem eines dem den des nicht auch als wie wenn dann noch nur schon so bei um am').split(' '));
        const haeufig = {};
        woerter.forEach((w) => {
            const k = w.toLowerCase().replace(/[^\wäöüß-]/g, '');
            if (k.length < 4 || stop.has(k))
                return;
            haeufig[k] = (haeufig[k] || 0) + 1;
        });
        const top = Object.entries(haeufig).sort((a, b) => b[1] - a[1]).slice(0, 12);
        const alleW = Object.values(Store.cache.blocks)
            .filter(b => b.alive)
            .reduce((n, b) => n + (b.text || '').split(/\s+/).filter(Boolean).length, 0);
        return { woerter: woerter.length, zeichen, saetze: saetze.length,
            blockAnzahl, lesezeit, sprechzeit, top, alleW };
    };
    const sauber = (s) => String(s).replace(/[\/\\:*?"<>|]/g, '-').slice(0, 80).trim() || 'Seite';
    const istUnter = (id, moeglicherElter) => {
        let cur = Store.getBlock(id), n = 0;
        while (cur && n++ < 50) {
            if (cur.parentId === moeglicherElter)
                return true;
            cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
        }
        return false;
    };
    return { esc, heute, WOCHENTAG, MONAT, datumLang, unscharf, zeitKurz, planen, planVorschau,
        alsMarkdown, ausMarkdown, statistikZahlen, sauber, istUnter };
})();
if (typeof window !== 'undefined')
    window.WissenDienst = WissenDienst;
