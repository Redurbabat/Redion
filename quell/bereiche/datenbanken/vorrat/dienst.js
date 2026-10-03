"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/vorrat/dienst.ts (npm run bauen:ts). */
const Vorrat = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const LOHNT_AB = 120;
    const TAKTE = [
        ['manuell', 'Nur auf Knopfdruck'],
        ['5', 'Alle 5 Minuten'],
        ['15', 'Alle 15 Minuten'],
        ['60', 'Stündlich']
    ];
    const speicher = new Map();
    const geladen = new Set();
    const einpacken = (v) => {
        if (v instanceof Date)
            return { __d: v.toISOString() };
        if (Array.isArray(v))
            return v.map(einpacken);
        return v;
    };
    const auspacken = (v) => {
        if (v && typeof v === 'object' && !Array.isArray(v) && v.__d)
            return new Date(v.__d);
        if (Array.isArray(v))
            return v.map(auspacken);
        return v;
    };
    const einstellung = (coll) => (coll && coll.vorrat) || null;
    const aktiv = (collId) => {
        const c = Store.getCollection(collId);
        const e = einstellung(c);
        return !!(e && e.an);
    };
    const anschalten = async (collId, takt = 'manuell') => {
        const c = Store.getCollection(collId);
        if (!c)
            return null;
        Store.updateCollection(collId, { vorrat: { an: true, takt: String(takt) } });
        return await berechnen(collId);
    };
    const ausschalten = (collId) => {
        Store.updateCollection(collId, { vorrat: { an: false, takt: 'manuell' } });
        speicher.delete(collId);
        try {
            Store.vorratWeg(collId);
        }
        catch { }
        try {
            App.zeichneSeite();
        }
        catch { }
    };
    const lohntSich = (collId) => {
        const c = Store.getCollection(collId);
        if (!c)
            return { ja: false, warum: 'Diese Datenbank gibt es nicht.' };
        const zeilen = Store.rowsOf(collId).length;
        const teuer = Object.values(c.schema)
            .filter(d => d.type === 'formula' || d.type === 'rollup').length;
        if (!teuer)
            return { ja: false, zeilen, teuer,
                warum: 'Hier gibt es nichts zu rechnen — keine Formel und kein Rollup.' };
        if (zeilen < LOHNT_AB)
            return { ja: false, zeilen, teuer,
                warum: zeilen + ' Zeilen sind zu wenig. Unter ' + LOHNT_AB + ' kostet das Verwalten ' +
                    'mehr, als das Rechnen spart.' };
        return { ja: true, zeilen, teuer,
            warum: zeilen + ' Zeilen mit ' + teuer + ' gerechneten Spalten — das sind ' +
                (zeilen * teuer) + ' Rechnungen bei jedem Öffnen.' };
    };
    const berechnen = async (collId) => {
        const c = Store.getCollection(collId);
        if (!c)
            return null;
        speicher.delete(collId);
        const keys = Object.entries(c.schema)
            .filter(([, d]) => d.type === 'formula' || d.type === 'rollup')
            .map(([k]) => k);
        const zeilen = Store.rowsOf(collId);
        const t0 = performance.now();
        const werte = {};
        zeilen.forEach((z) => keys.forEach(k => {
            try {
                werte[z.id + '|' + k] = einpacken(Datenbank.wert(z, k, c));
            }
            catch {
                werte[z.id + '|' + k] = null;
            }
        }));
        const dauer = Math.round(performance.now() - t0);
        const satz = { wann: Store.now(), dauer, anzahl: zeilen.length * keys.length, werte };
        speicher.set(collId, satz);
        geladen.add(collId);
        try {
            await Store.vorratPut(collId, satz);
        }
        catch { }
        try {
            App.zeichneSeite();
        }
        catch { }
        return satz;
    };
    const laden = async (collId) => {
        if (geladen.has(collId))
            return speicher.get(collId) || null;
        geladen.add(collId);
        try {
            const e = await Store.vorratHolen(collId);
            if (e && e.werte) {
                speicher.set(collId, e);
                try {
                    App.zeichneSeite();
                }
                catch { }
                return e;
            }
        }
        catch { }
        return null;
    };
    const hole = (collId, rowId, key) => {
        const e = speicher.get(collId);
        if (!e) {
            if (!geladen.has(collId))
                laden(collId);
            return undefined;
        }
        const v = e.werte[rowId + '|' + key];
        return v === undefined ? undefined : auspacken(v);
    };
    const seitherZahl = (collId) => {
        const e = speicher.get(collId);
        if (!e)
            return 0;
        const c = Store.getCollection(collId);
        let n = Store.rowsOf(collId)
            .filter((z) => String(z.edited || z.created || '') > String(e.wann)).length;
        if (c && String(c.edited || '') > String(e.wann))
            n++;
        return n;
    };
    const stand = (collId) => {
        const e = speicher.get(collId);
        if (!e)
            return null;
        return { wann: e.wann, dauer: e.dauer, anzahl: e.anzahl,
            seither: seitherZahl(collId) };
    };
    const vorText = (iso) => {
        const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
        if (min < 1)
            return 'gerade eben';
        if (min === 1)
            return 'vor einer Minute';
        if (min < 60)
            return 'vor ' + min + ' Minuten';
        const h = Math.round(min / 60);
        return h === 1 ? 'vor einer Stunde' : 'vor ' + h + ' Stunden';
    };
    const taktName = (t) => (TAKTE.find(x => x[0] === String(t)) || ['', String(t)])[1];
    const leiste = (coll) => {
        if (!aktiv(coll.id))
            return null;
        const s = stand(coll.id);
        const e = einstellung(coll);
        const d = document.createElement('div');
        d.className = 'vorrat-leiste';
        if (!s) {
            d.innerHTML = '<span>❄ Vorberechnung ist an, aber es liegt noch nichts vor.</span>' +
                '<button class="btn" data-a="jetzt">Jetzt rechnen</button>';
        }
        else {
            d.innerHTML =
                '<span>❄ Gerechnet ' + esc(vorText(s.wann)) + ' · ' + s.anzahl + ' Werte in ' +
                    s.dauer + ' ms</span>' +
                    (s.seither
                        ? '<b style="color:var(--warnung)">' + s.seither + ' Änderung' +
                            (s.seither === 1 ? '' : 'en') + ' seither</b>'
                        : '<span style="opacity:.7">nichts geändert seither</span>') +
                    '<span style="flex:1"></span>' +
                    '<span style="opacity:.7">' + esc(taktName(e.takt)) + '</span>' +
                    '<button class="btn" data-a="jetzt">Neu rechnen</button>' +
                    '<button class="btn" data-a="aus">Ausschalten</button>';
        }
        d.addEventListener('click', async (ev) => {
            const b = elVon(ev)?.closest('[data-a]');
            if (!b)
                return;
            if (b.dataset["a"] === 'jetzt' && b instanceof HTMLButtonElement) {
                b.disabled = true;
                b.textContent = 'Rechnet …';
                const r = await berechnen(coll.id);
                UI.toast(r ? r.anzahl + ' Werte in ' + r.dauer + ' ms gerechnet' : 'Ging nicht');
            }
            if (b.dataset["a"] === 'aus') {
                ausschalten(coll.id);
                UI.toast('Vorberechnung aus');
            }
        });
        return d;
    };
    const fenster = (collId) => {
        const coll = Store.getCollection(collId);
        if (!coll)
            return null;
        const l = lohntSich(collId);
        const s = stand(collId);
        const e = einstellung(coll);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(620px,95vw)">' +
            '<div class="fh">❄ Werte vorberechnen<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" style="padding:18px;max-height:70vh;overflow:auto">' +
            '<p style="opacity:.85;margin-top:0">Formeln und Rollups einmal rechnen und das ' +
            'Ergebnis behalten — über Änderungen und über das Neuladen hinweg. Das macht das ' +
            '<b>Öffnen</b> einer grossen Datenbank billig und nimmt dafür in Kauf, dass ein Wert ' +
            'eine Weile veraltet ist.</p>' +
            '<p style="padding:10px 12px;background:var(--bg-card);border-radius:8px">' +
            (l.ja ? '✔ ' : 'ℹ️ ') + esc(l.warum) + '</p>' +
            (s
                ? '<p>Zuletzt gerechnet ' + esc(vorText(s.wann)) + ': ' + s.anzahl +
                    ' Werte in ' + s.dauer + ' ms.' +
                    (s.seither ? ' Seither ' + s.seither + ' Änderungen.' : '') + '</p>'
                : '') +
            '<div style="margin-top:14px">Wie oft neu rechnen?<br>' +
            '<select id="vt" style="margin-top:6px;padding:6px 8px">' +
            TAKTE.map(t => '<option value="' + t[0] + '"' +
                (e && String(e.takt) === t[0] ? ' selected' : '') + '>' + t[1] + '</option>').join('') +
            '</select></div>' +
            '<p style="opacity:.7;margin-top:14px">Über der Tabelle steht dann, wann gerechnet ' +
            'wurde und wie viele Änderungen es seither gab. Ein Zwischenspeicher, den man nicht ' +
            'sieht, ist eine Falle.</p>' +
            '</div>' +
            '<div class="fbtns">' +
            (aktiv(collId)
                ? '<button data-a="aus">Ausschalten</button><button data-a="an" class="prim">Übernehmen und rechnen</button>'
                : '<button data-a="zu">Abbrechen</button><button data-a="an" class="prim">Einschalten und rechnen</button>') +
            '</div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (ev) => {
            if (ev.target === o || elVon(ev)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(ev)?.closest('[data-a="aus"]')) {
                ausschalten(collId);
                o.remove();
                return;
            }
            if (elVon(ev)?.closest('[data-a="an"]')) {
                const t = o.querySelector('#vt')?.value ?? 'manuell';
                const b = elVon(ev)?.closest('[data-a="an"]');
                if (!b)
                    return;
                b.disabled = true;
                b.textContent = 'Rechnet …';
                const r = await anschalten(collId, t);
                o.remove();
                UI.toast(r ? r.anzahl + ' Werte in ' + r.dauer + ' ms gerechnet' : 'Ging nicht');
            }
        });
        return o;
    };
    let uhr;
    const takten = async () => {
        for (const c of Object.values(Store.cache.collections)) {
            const e = einstellung(c);
            if (!e || !e.an || e.takt === 'manuell')
                continue;
            const s = stand(c.id);
            const minuten = Number(e.takt) || 15;
            if (!s || (Date.now() - new Date(s.wann).getTime()) / 60000 >= minuten) {
                if (!s || s.seither > 0)
                    await berechnen(c.id);
            }
        }
    };
    let eingeklinkt = false;
    const start = () => {
        if (eingeklinkt)
            return;
        eingeklinkt = true;
        clearInterval(uhr);
        uhr = setInterval(() => { takten().catch(() => { }); }, 60000);
    };
    return { LOHNT_AB, TAKTE, aktiv, einstellung, anschalten, ausschalten, lohntSich,
        berechnen, laden, hole, stand, leiste, fenster, takten, start,
        vorText, taktName, einpacken, auspacken, seitherZahl,
        _speicher: speicher };
})();
window.Vorrat = Vorrat;
