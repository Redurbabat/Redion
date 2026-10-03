"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/luecken.ts (npm run bauen:ts). */
const Wissensluecken = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const FRAGE_IST_INHALT = ['flashcard', 'quiz', 'pruefungsfrage', 'umfrage', 'code'];
    const ARTEN = {
        geist: { zeichen: '👻', name: 'Geisterverweise',
            was: 'Erwähnt, aber nie geschrieben.' },
        mehrdeutig: { zeichen: '🔀', name: 'Mehrdeutige Verweise',
            was: 'Der Verweis passt auf mehrere Seiten.' },
        verstaubt: { zeichen: '🕸', name: 'Wichtig, aber verstaubt',
            was: 'Trägt viel im Netz und wurde lange nicht angefasst.' },
        frage: { zeichen: '❓', name: 'Offene Fragen',
            was: 'Selbst aufgeschrieben und nie beantwortet.' },
        insel: { zeichen: '🏝', name: 'Inseln',
            was: 'Hängt an nichts.' },
        thema: { zeichen: '🌱', name: 'Dünne Themen',
            was: 'Ein Schlagwort an genau einer Seite.' }
    };
    const seitentext = (seiteId) => {
        const teile = [];
        const gesehen = new Set();
        const gehe = (id, tiefe) => {
            if (tiefe > 40 || gesehen.has(id))
                return;
            gesehen.add(id);
            const b = Store.getBlock(id);
            if (!b || b.alive === false)
                return;
            if (id !== seiteId && FRAGE_IST_INHALT.includes(String(b.type)))
                return;
            if (b.text)
                teile.push(String(b.text));
            for (const kind of (b.content || []))
                gehe(kind, tiefe + 1);
        };
        gehe(seiteId, 0);
        return teile.join('\n');
    };
    const sammeln = () => {
        const vorbereitet = Links.graphVorbereiten();
        const index = vorbereitet.index;
        const knoten = [...index.nodes.values()].filter((n) => n.kind !== 'tag')
            .map((n) => ({ id: n.id, kind: n.kind, edited: n.edited }));
        const kanten = index.edges.filter((e) => e.kind !== 'tag')
            .map((e) => ({ source: e.source, target: e.target, kind: e.kind }));
        const ergebnis = KnowledgeRank.rank(knoten, kanten);
        const punkte = KnowledgeRank.punkte(ergebnis, knoten);
        const rangNach = Object.create(null);
        for (const p of punkte)
            rangNach[p.id] = p.punkte;
        const grad = Object.create(null);
        for (const e of kanten) {
            grad[e.source] = (grad[e.source] || 0) + 1;
            grad[e.target] = (grad[e.target] || 0) + 1;
        }
        const seiten = knoten.map((n) => {
            const b = Store.getBlock(n.id);
            return {
                id: n.id,
                titel: (b && b.text) || (index.nodes.get(n.id) || {}).name || 'Ohne Titel',
                text: seitentext(n.id),
                edited: (b && (b.edited || b.created)) || n.edited || '',
                grad: grad[n.id] || 0,
                rang: rangNach[n.id] || 0,
                gesperrt: !!(b && b.gesperrt)
            };
        });
        const verweise = Links.alleSeitenverweise().map((v) => ({
            vonId: v.vonId, vonTitel: v.vonTitel, ziel: v.ziel,
            status: v.status, kandidaten: v.kandidaten
        }));
        const themen = Links.alleTags().map((t) => ({
            tag: t.tag, seiten: t.seiten.map((p) => p.id)
        }));
        return { seiten, verweise, themen };
    };
    const BASIS = Date.UTC(2020, 0, 1);
    const abdruck = () => {
        const bl = (typeof Store !== 'undefined' && Store.cache && Store.cache.blocks) || {};
        let n = 0, neuste = '', summe = 0;
        for (const id in bl) {
            n++;
            const b = bl[id];
            const t = (b && (b.edited || b.created)) || '';
            if (t > neuste)
                neuste = t;
            const ms = Date.parse(t);
            if (Number.isFinite(ms))
                summe += ms - BASIS;
        }
        return n + '|' + neuste + '|' + summe;
    };
    let merker = null;
    const vergessen = () => { merker = null; };
    const gesammelt = () => {
        const jetzt = abdruck();
        if (merker && merker.abdruck === jetzt)
            return merker.wert;
        const wert = sammeln();
        merker = { abdruck: jetzt, wert };
        return wert;
    };
    const SCHL_ERLEDIGT = 'wissen:luecken:erledigt';
    const erledigte = () => {
        const l = Store.getMeta(SCHL_ERLEDIGT, []);
        return Array.isArray(l) ? l.filter((x) => typeof x === 'string') : [];
    };
    const abhaken = (id) => {
        if (!id)
            return;
        const l = erledigte();
        if (l.indexOf(id) >= 0)
            return;
        Store.setMeta(SCHL_ERLEDIGT, l.concat([id]));
    };
    const wiederZeigen = () => {
        const n = erledigte().length;
        Store.setMeta(SCHL_ERLEDIGT, []);
        return n;
    };
    const befund = (opt = {}) => {
        const { seiten, verweise, themen } = gesammelt();
        return KnowledgeGaps.finden(seiten, verweise, themen, { erledigt: erledigte(), ...opt });
    };
    const fundHtml = (f, nr) => {
        const art = ARTEN[f.art] || { zeichen: '•', name: f.art, was: '' };
        const stufe = f.staerke >= 70 ? 'hoch' : f.staerke >= 40 ? 'mittel' : 'schwach';
        const wort = stufe === 'hoch' ? 'deutlich'
            : stufe === 'mittel' ? 'wahrscheinlich' : 'schwach';
        const quellen = (f.quellen || []).slice(0, 4);
        return '<li class="wl-fund" data-nr="' + nr + '">' +
            '<span class="wl-zeichen" aria-hidden="true">' + art.zeichen + '</span>' +
            '<div class="wl-mitte">' +
            '<div class="wl-titel">' + esc(f.titel) + '</div>' +
            '<div class="wl-satz">' + esc(f.satz) + '</div>' +
            (quellen.length
                ? '<div class="wl-quellen">' + quellen.map((q) => '<button type="button" class="wl-quelle" data-open="' + esc(q.id) + '">' +
                    esc(q.titel) + '</button>').join('') +
                    ((f.quellen || []).length > quellen.length
                        ? '<span class="wl-mehr">+' + ((f.quellen || []).length - quellen.length) + '</span>'
                        : '') +
                    '</div>'
                : '') +
            '</div>' +
            '<div class="wl-rechts">' +
            '<span class="wl-staerke wl-' + stufe + '" title="Sicherheit: ' + wort + '">' +
            f.staerke + '</span>' +
            (f.art === 'geist'
                ? '<button type="button" class="rb wl-tun" data-anlegen="' + esc(f.titel) + '">' +
                    'Seite anlegen</button>'
                : f.seiteId
                    ? '<button type="button" class="rb wl-tun" data-open="' + esc(f.seiteId) + '">' +
                        'Öffnen</button>'
                    : '') +
            '<button type="button" class="wl-hak" data-hak="' + esc(f.id || '') + '" ' +
            'title="Abhaken — kommt nicht wieder, bis du sie wieder zeigst" ' +
            'aria-label="„' + esc(f.titel) + '" abhaken">✓</button>' +
            '</div>' +
            '</li>';
    };
    const fuellen = (o) => {
        const b = befund();
        const kopf = o.querySelector('.wl-kopf');
        const titelZahl = o.querySelector('#wl-titel em');
        if (titelZahl)
            titelZahl.textContent = String(b.gezaehlt);
        if (kopf) {
            const zaehlung = Object.entries(b.jeArt)
                .sort((x, y) => y[1] - x[1])
                .map(([art, n]) => '<span class="wl-zaehler">' +
                (ARTEN[art] ? ARTEN[art].zeichen + ' ' + ARTEN[art].name : esc(art)) +
                ' <em>' + n + '</em></span>').join('');
            kopf.innerHTML = esc(b.satz) +
                (zaehlung ? '<div class="wl-zaehlung">' + zaehlung + '</div>' : '') +
                (b.versteckt
                    ? '<div class="wl-zurueck">' + b.versteckt +
                        (b.versteckt === 1 ? ' Fund ist abgehakt' : ' Funde sind abgehakt') +
                        ' <button type="button" class="wl-wieder">wieder zeigen</button></div>'
                    : '');
        }
        const res = o.querySelector('#wl-res');
        if (!res)
            return;
        if (!b.funde.length) {
            res.innerHTML = '<div class="wl-leer">' +
                (b.versteckt
                    ? 'Alles abgehakt. Nichts steht mehr offen.'
                    : 'Nichts gefunden. Der Bestand hängt zusammen — oder es ist noch ' +
                        'zu wenig darin.') + '</div>';
            return;
        }
        const stark = b.funde.filter((f) => f.staerke >= KnowledgeGaps.VORGABE.schwelle);
        const schwach = b.funde.filter((f) => f.staerke < KnowledgeGaps.VORGABE.schwelle);
        res.innerHTML =
            (stark.length ? '<ul class="wl-ul">' +
                stark.map((f, i) => fundHtml(f, i)).join('') + '</ul>' : '') +
                (schwach.length
                    ? '<details class="wl-schwach"><summary>' + schwach.length +
                        ' schwächere Beobachtung' + (schwach.length === 1 ? '' : 'en') +
                        ' — zu unsicher zum Zählen</summary><ul class="wl-ul">' +
                        schwach.map((f, i) => fundHtml(f, stark.length + i)).join('') +
                        '</ul></details>'
                    : '');
    };
    const zeigen = () => {
        const b = befund();
        const o = document.createElement('div');
        o.className = 'overlay';
        const zaehlung = Object.entries(b.jeArt)
            .sort((x, y) => y[1] - x[1])
            .map(([art, n]) => '<span class="wl-zaehler">' +
            (ARTEN[art] ? ARTEN[art].zeichen + ' ' + ARTEN[art].name : esc(art)) +
            ' <em>' + n + '</em></span>').join('');
        o.innerHTML =
            '<div class="finder wl-box" role="dialog" aria-modal="true" ' +
                'aria-labelledby="wl-titel" style="width:min(760px,94vw)">' +
                '<div class="fh" id="wl-titel">Wissenslücken <em>' + b.gezaehlt + '</em></div>' +
                '<div class="wl-kopf">' + esc(b.satz) +
                (zaehlung ? '<div class="wl-zaehlung">' + zaehlung + '</div>' : '') +
                '</div>' +
                '<div class="res wl-liste" id="wl-res"></div>' +
                '<div class="hint">Alles hier kommt aus deinem eigenen Bestand — ' +
                'keine KI, kein Netz. Die Zahl rechts sagt, wie sicher der Fund ist.</div>' +
                '</div>';
        document.body.appendChild(o);
        fuellen(o);
        const aufEscape = (e) => {
            if (e.key !== 'Escape')
                return;
            e.preventDefault();
            o.remove();
        };
        document.addEventListener('keydown', aufEscape);
        const wegRaeumen = new MutationObserver(() => {
            if (!document.body.contains(o)) {
                document.removeEventListener('keydown', aufEscape);
                wegRaeumen.disconnect();
            }
        });
        wegRaeumen.observe(document.body, { childList: true });
        o.addEventListener('click', e => {
            const ziel = e.target;
            const anlegen = ziel?.closest('[data-anlegen]');
            if (anlegen) {
                const name = anlegen.dataset.anlegen || '';
                o.remove();
                Links.oeffneOderAnlegen(name);
                return;
            }
            const hak = ziel?.closest('[data-hak]');
            if (hak) {
                abhaken(hak.dataset.hak || '');
                fuellen(o);
                return;
            }
            if (ziel?.closest('.wl-wieder')) {
                const n = wiederZeigen();
                fuellen(o);
                try {
                    UI.toast(n === 1 ? 'Ein Fund ist wieder da.'
                        : n + ' Funde sind wieder da.');
                }
                catch { }
                return;
            }
            const auf = ziel?.closest('[data-open]');
            if (auf) {
                o.remove();
                App.oeffne(auf.dataset.open);
                return;
            }
            if (e.target === o)
                o.remove();
        });
    };
    return { zeigen, befund, sammeln, gesammelt, abdruck, vergessen,
        seitentext, ARTEN, FRAGE_IST_INHALT,
        erledigte, abhaken, wiederZeigen, SCHL_ERLEDIGT };
})();
window.Wissensluecken = Wissensluecken;
