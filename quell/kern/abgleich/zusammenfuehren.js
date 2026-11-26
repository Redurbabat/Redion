"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/abgleich/zusammenfuehren.ts (npm run bauen:ts). */
const Zusammen = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const gleich = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    const MAX_WORTE = 4000;
    const teile = (s) => String(s ?? '').split(/(\s+)/).filter(x => x !== '');
    const lcs = (A, B) => {
        const n = A.length, m = B.length;
        let vorn = 0;
        while (vorn < n && vorn < m && A[vorn] === B[vorn])
            vorn++;
        let hinten = 0;
        while (hinten < n - vorn && hinten < m - vorn &&
            A[n - 1 - hinten] === B[m - 1 - hinten])
            hinten++;
        const a = A.slice(vorn, n - hinten), b = B.slice(vorn, m - hinten);
        const paare = [];
        for (let i = 0; i < vorn; i++)
            paare.push({ a: i, b: i });
        const ni = a.length, mi = b.length;
        if (ni && mi) {
            const t = Array.from({ length: ni + 1 }, () => new Uint32Array(mi + 1));
            const tab = (i, j) => t[i]?.[j] ?? 0;
            const setzeTab = (i, j, w) => { const z = t[i]; if (z)
                z[j] = w; };
            for (let i = ni - 1; i >= 0; i--)
                for (let j = mi - 1; j >= 0; j--)
                    setzeTab(i, j, a[i] === b[j] ? tab(i + 1, j + 1) + 1
                        : Math.max(tab(i + 1, j), tab(i, j + 1)));
            let i = 0, j = 0;
            while (i < ni && j < mi) {
                if (a[i] === b[j]) {
                    paare.push({ a: vorn + i, b: vorn + j });
                    i++;
                    j++;
                }
                else if (tab(i + 1, j) >= tab(i, j + 1))
                    i++;
                else
                    j++;
            }
        }
        for (let k = 0; k < hinten; k++)
            paare.push({ a: n - hinten + k, b: m - hinten + k });
        return paare;
    };
    const stuecke = (B, N) => {
        const paare = lcs(B, N);
        const out = [];
        let i = 0, j = 0;
        for (const p of [...paare, { a: B.length, b: N.length }]) {
            if (p.a > i || p.b > j)
                out.push({ von: i, bis: p.a, ersatz: N.slice(j, p.b) });
            i = p.a + 1;
            j = p.b + 1;
        }
        return out;
    };
    const textDreiWege = (basis, hier, dort) => {
        const b = String(basis ?? ''), h = String(hier ?? ''), d = String(dort ?? '');
        if (h === d)
            return { text: h, konflikt: false };
        if (b === h)
            return { text: d, konflikt: false };
        if (b === d)
            return { text: h, konflikt: false };
        const B = teile(b), H = teile(h), D = teile(d);
        if (B.length > MAX_WORTE || H.length > MAX_WORTE || D.length > MAX_WORTE)
            return { text: h, konflikt: true };
        const sh = stuecke(B, H), sd = stuecke(B, D);
        for (const x of sh)
            for (const y of sd)
                if (x.von < y.bis && y.von < x.bis)
                    return { text: h, konflikt: true };
        const alle = [...sh, ...sd].sort((p, q) => p.von - q.von || p.bis - q.bis);
        const raus = [];
        let pos = 0;
        for (const x of alle) {
            if (x.von >= pos)
                raus.push(...B.slice(pos, x.von));
            raus.push(...x.ersatz);
            pos = Math.max(pos, x.bis);
        }
        raus.push(...B.slice(pos));
        return { text: raus.join(''), konflikt: false };
    };
    const listeDreiWege = (basis, hier, dort) => {
        const B = Array.isArray(basis) ? basis : [];
        const H = Array.isArray(hier) ? hier : [];
        const D = Array.isArray(dort) ? dort : [];
        if (gleich(H, D))
            return { liste: H, konflikt: false };
        if (gleich(B, H))
            return { liste: D, konflikt: false };
        if (gleich(B, D))
            return { liste: H, konflikt: false };
        const inH = new Set(H), inD = new Set(D), inB = new Set(B);
        const weg = new Set(B.filter(x => !inH.has(x) || !inD.has(x)));
        const nurAlte = (L) => L.filter((x) => inB.has(x) && !weg.has(x));
        const oB = B.filter(x => !weg.has(x)), oH = nurAlte(H), oD = nurAlte(D);
        let grund, konflikt = false;
        if (gleich(oH, oD))
            grund = oH.slice();
        else if (gleich(oH, oB))
            grund = oD.slice();
        else if (gleich(oD, oB))
            grund = oH.slice();
        else {
            grund = oH.slice();
            konflikt = true;
        }
        const einbauen = (L) => {
            L.forEach((x, i) => {
                if (inB.has(x) || grund.includes(x))
                    return;
                let anker = -1;
                for (let k = i - 1; k >= 0; k--) {
                    const p = grund.indexOf(L[k]);
                    if (p >= 0) {
                        anker = p;
                        break;
                    }
                }
                while (anker + 1 < grund.length && !inB.has(grund[anker + 1]))
                    anker++;
                grund.splice(anker + 1, 0, x);
            });
        };
        einbauen(H);
        einbauen(D);
        return { liste: grund, konflikt };
    };
    const ZEIT = new Set(['edited', 'updated', 'created', 'wolkeVersion', 'version',
        'lastEdited', 'zuletzt']);
    const TEXT = new Set(['text', 'name', 'title', 'beschreibung', 'notiz', 'caption']);
    const LISTE = new Set(['content', 'children', 'viewIds', 'spalten', 'reihenfolge']);
    const OBJECT_LIST = new Set(['shapes', 'marken', 'objectComments', 'replies', 'mentions', 'kommentare', 'antworten']);
    const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
    const dreiWege = (basis, hier, dort) => {
        const konflikte = [];
        if (!basis) {
            if (gleich(hier, dort))
                return { satz: hier, konflikte: [], zusammengefuehrt: false };
            const neuerDort = String(dort?.edited || '') > String(hier?.edited || '');
            konflikte.push({
                pfad: [], feld: 'die ganze Seite', hier, dort,
                grund: 'Kein gemeinsamer Stand bekannt — beide Fassungen sind vollständig.'
            });
            return { satz: neuerDort ? dort : hier, konflikte, zusammengefuehrt: false };
        }
        let gemischt = false;
        const geheDurch = (b, h, d, pfad) => {
            const raus = {};
            const namen = new Set([...Object.keys(b || {}), ...Object.keys(h || {}), ...Object.keys(d || {})]);
            for (const k of namen) {
                const B = (b || {})[k], H = (h || {})[k], D = (d || {})[k];
                const p = [...pfad, k];
                if (gleich(H, D)) {
                    if (H !== undefined)
                        raus[k] = H;
                    continue;
                }
                if (gleich(B, H)) {
                    if (D !== undefined)
                        raus[k] = D;
                    gemischt = true;
                    continue;
                }
                if (gleich(B, D)) {
                    if (H !== undefined)
                        raus[k] = H;
                    continue;
                }
                if (ZEIT.has(k)) {
                    const x = String(H ?? ''), y = String(D ?? '');
                    raus[k] = (typeof H === 'number' || typeof D === 'number')
                        ? Math.max(Number(H) || 0, Number(D) || 0)
                        : (x > y ? H : D);
                    continue;
                }
                if (TEXT.has(k) && typeof H === 'string' && typeof D === 'string') {
                    const r = textDreiWege(B, H, D);
                    raus[k] = r.text;
                    if (r.konflikt)
                        konflikte.push({ pfad: p, feld: pfadName(p), hier: H, dort: D,
                            grund: 'Beide haben dieselbe Stelle im Text geändert.' });
                    else
                        gemischt = true;
                    continue;
                }
                if (LISTE.has(k) && Array.isArray(H) && Array.isArray(D)) {
                    const r = listeDreiWege(B, H, D);
                    raus[k] = r.liste;
                    if (r.konflikt)
                        konflikte.push({ pfad: p, feld: pfadName(p), hier: H, dort: D,
                            grund: 'Beide haben die Reihenfolge verschieden geändert.' });
                    else
                        gemischt = true;
                    continue;
                }
                if (OBJECT_LIST.has(k) && Array.isArray(H) && Array.isArray(D) &&
                    [...(Array.isArray(B) ? B : []), ...H, ...D].every(item => item && typeof item.id === 'string') &&
                    [B, H, D].every(list => !Array.isArray(list) || new Set(list.map(item => item.id)).size === list.length)) {
                    const base = Array.isArray(B) ? B : [], byId = (list) => new Map(list.map(item => [item.id, item]));
                    const baseMap = byId(base), local = byId(H), remote = byId(D), merged = new Map();
                    for (const id of new Set([...baseMap.keys(), ...local.keys(), ...remote.keys()])) {
                        const b = baseMap.get(id), h = local.get(id), d = remote.get(id);
                        if (gleich(h, d)) {
                            if (h !== undefined)
                                merged.set(id, h);
                            continue;
                        }
                        if (gleich(b, h)) {
                            if (d !== undefined)
                                merged.set(id, d);
                            continue;
                        }
                        if (gleich(b, d)) {
                            if (h !== undefined)
                                merged.set(id, h);
                            continue;
                        }
                        if (h === undefined || d === undefined) {
                            merged.set(id, h ?? d);
                            konflikte.push({ pfad: [...p, id], feld: pfadName(p), hier: h, dort: d,
                                grund: 'Ein Objekt wurde gelöscht und auf dem anderen Gerät geändert.' });
                        }
                        else
                            merged.set(id, geheDurch(b || {}, h, d, [...p, id]));
                    }
                    const order = listeDreiWege(base.map(item => item.id), H.map(item => item.id), D.map(item => item.id));
                    const ids = [...order.liste, ...merged.keys()].filter((id, i, all) => merged.has(id) && all.indexOf(id) === i);
                    raus[k] = ids.map(id => merged.get(id));
                    gemischt = true;
                    if (order.konflikt)
                        konflikte.push({ pfad: p, feld: pfadName(p), hier: H, dort: D, grund: 'Beide haben die Objektreihenfolge verschieden geändert.' });
                    continue;
                }
                if (istObjekt(H) && istObjekt(D)) {
                    raus[k] = geheDurch(istObjekt(B) ? B : {}, H, D, p);
                    continue;
                }
                raus[k] = H !== undefined ? H : D;
                konflikte.push({ pfad: p, feld: pfadName(p), hier: H, dort: D,
                    grund: 'Beide haben diesen Wert verschieden gesetzt.' });
            }
            return raus;
        };
        const satz = geheDurch(basis, hier || {}, dort || {}, []);
        return { satz, konflikte, zusammengefuehrt: gemischt && !konflikte.length ? true : gemischt };
    };
    const pfadName = (p) => {
        if (!p.length)
            return 'die ganze Seite';
        const uebersetzt = { text: 'Text', props: 'Eigenschaft', schema: 'Spalte',
            content: 'Reihenfolge', name: 'Name', format: 'Darstellung',
            filter: 'Filter', sorts: 'Sortierung', type: 'Typ' };
        return p.map((x) => uebersetzt[x] || x).join(' › ');
    };
    const MAX_KONFLIKTE = 200;
    const offene = () => Store.getMeta('konflikte', []) || [];
    const merke = (id, tabelle, liste) => {
        if (!liste || !liste.length)
            return 0;
        const alt = offene();
        const jetzt = Store.now();
        liste.forEach((k) => {
            const schluessel = id + '|' + (k.pfad || []).join('.');
            const i = alt.findIndex((x) => x.schluessel === schluessel);
            const satz = { schluessel, id, tabelle, pfad: k.pfad || [], feld: k.feld,
                hier: k.hier, dort: k.dort, grund: k.grund, wann: jetzt };
            if (i >= 0)
                alt[i] = satz;
            else
                alt.push(satz);
        });
        Store.setMeta('konflikte', alt.slice(-MAX_KONFLIKTE));
        return liste.length;
    };
    const setzeTief = (obj, pfad, wert) => {
        if (!pfad.length)
            return wert;
        const set = (node, depth) => {
            const key = pfad[depth];
            if (key === undefined)
                return;
            const last = depth === pfad.length - 1;
            if (Array.isArray(node)) {
                const index = node.findIndex(item => item?.id === key);
                if (last) {
                    if (index >= 0) {
                        if (wert === undefined)
                            node.splice(index, 1);
                        else
                            node[index] = wert;
                    }
                    else if (wert !== undefined)
                        node.push(wert);
                }
                else if (index >= 0)
                    set(node[index], depth + 1);
                return;
            }
            if (last) {
                if (wert === undefined)
                    delete node[key];
                else
                    node[key] = wert;
                return;
            }
            if (!istObjekt(node[key]) && !Array.isArray(node[key]))
                node[key] = {};
            set(node[key], depth + 1);
        };
        set(obj, 0);
        return obj;
    };
    const satzHolen = (tabelle, id) => tabelle === 'collections' ? Store.cache.collections[id]
        : tabelle === 'views' ? Store.cache.views[id]
            : Store.cache.blocks[id];
    const loese = (schluessel, wahl) => {
        const liste = offene();
        const k = liste.find((x) => x.schluessel === schluessel);
        if (!k)
            return false;
        if (wahl === 'dort') {
            const satz = satzHolen(k.tabelle, k.id);
            if (satz) {
                if (!k.pfad.length)
                    Object.assign(satz, k.dort);
                else
                    setzeTief(satz, k.pfad, k.dort);
                satz.edited = Store.now();
                satz.id = k.id;
                Store.rohSetzen(k.tabelle, satz);
                try {
                    App.zeichneSeite();
                    App.zeichneBaum();
                }
                catch { }
            }
        }
        Store.setMeta('konflikte', liste.filter((x) => x.schluessel !== schluessel));
        return true;
    };
    const alleLoesen = (wahl) => {
        const liste = offene();
        liste.slice().forEach((k) => loese(k.schluessel, wahl));
        return liste.length;
    };
    const kurz = (v) => {
        if (v === undefined)
            return '<i>gelöscht</i>';
        if (v === null || v === '')
            return '<i>leer</i>';
        const s = typeof v === 'string' ? v : JSON.stringify(v);
        return esc(s.length > 400 ? s.slice(0, 400) + ' …' : s);
    };
    const titelVon = (k) => {
        const s = satzHolen(k.tabelle, k.id);
        if (!s)
            return 'Gelöschter Eintrag';
        return s.text || s.name || (k.tabelle === 'views' ? 'Ansicht' : 'Ohne Titel');
    };
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(760px,96vw)">' +
            '<div class="fh">⚖ Zwei Fassungen<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="zu-inhalt" style="padding:18px;max-height:70vh;overflow:auto"></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const liste = offene();
            const ziel = o.querySelector('#zu-inhalt');
            if (!ziel)
                return;
            if (!liste.length) {
                ziel.innerHTML = '<p style="opacity:.75">Nichts offen. Der letzte Abgleich ging ' +
                    'ohne Reibung durch — was auf beiden Geräten verschieden war, betraf ' +
                    'verschiedene Felder und wurde zusammengeführt.</p>';
                return;
            }
            ziel.innerHTML =
                '<p style="opacity:.8;margin-top:0">' + liste.length + ' Stelle' +
                    (liste.length === 1 ? '' : 'n') + ', an der beide Geräte dasselbe verschieden ' +
                    'geändert haben. Bis hier eine Wahl steht, gilt die eigene Fassung — ' +
                    'verworfen wird nichts.</p>' +
                    '<div style="display:flex;gap:8px;margin:12px 0 18px">' +
                    '<button class="btn" data-alle="hier">Überall meine behalten</button>' +
                    '<button class="btn" data-alle="dort">Überall die anderen nehmen</button>' +
                    '</div>' +
                    liste.map((k) => '<div style="border:1px solid var(--line,#ddd);border-radius:8px;padding:12px;margin-bottom:12px">' +
                        '<div style="font-weight:600">' + esc(titelVon(k)) + '</div>' +
                        '<div style="opacity:.7;font-size:.9em;margin-bottom:8px">' +
                        esc(k.feld) + ' · ' + esc(k.grund || '') + '</div>' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
                        '<div><div style="font-size:.85em;opacity:.7;margin-bottom:4px">Hier</div>' +
                        '<div style="background:var(--bg-card);padding:8px;border-radius:6px;' +
                        'white-space:pre-wrap;word-break:break-word">' + kurz(k.hier) + '</div>' +
                        '<button class="btn" style="margin-top:6px;width:100%" ' +
                        'data-w="hier" data-k="' + esc(k.schluessel) + '">Diese behalten</button></div>' +
                        '<div><div style="font-size:.85em;opacity:.7;margin-bottom:4px">Anderes Gerät</div>' +
                        '<div style="background:var(--bg-card);padding:8px;border-radius:6px;' +
                        'white-space:pre-wrap;word-break:break-word">' + kurz(k.dort) + '</div>' +
                        '<button class="btn" style="margin-top:6px;width:100%" ' +
                        'data-w="dort" data-k="' + esc(k.schluessel) + '">Diese nehmen</button></div>' +
                        '</div>' +
                        '</div>').join('');
        };
        o.addEventListener('click', (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const alle = elVon(e)?.closest('[data-alle]');
            if (alle) {
                alleLoesen(alle.dataset.alle ?? '');
                zeichne();
                melde();
                return;
            }
            const w = elVon(e)?.closest('[data-w]');
            if (w) {
                loese(w.dataset.k ?? '', w.dataset.w ?? '');
                zeichne();
                melde();
            }
        });
        zeichne();
        return o;
    };
    const melde = () => {
        const n = offene().length;
        document.querySelectorAll('[data-konflikt-zahl]').forEach(el => {
            el.textContent = n ? String(n) : '';
            el.style.display = n ? '' : 'none';
        });
        return n;
    };
    const hinweisen = () => {
        const n = offene().length;
        if (!n)
            return;
        const t = UI.toast(n + ' Stelle' + (n === 1 ? '' : 'n') + ' braucht eine Entscheidung', 9000);
        const el = document.getElementById('toast');
        if (el) {
            el.style.cursor = 'pointer';
            const auf = () => { el.removeEventListener('click', auf); if (t)
                t.remove(); dialog(); };
            el.addEventListener('click', auf);
            setTimeout(() => el.removeEventListener('click', auf), 9000);
        }
    };
    const start = () => { melde(); };
    return {
        dreiWege, textDreiWege, listeDreiWege, teile, stuecke, lcs,
        offene, merke, loese, alleLoesen, dialog, melde, hinweisen, start,
        pfadName, setzeTief
    };
})();
window.Zusammen = Zusammen;
