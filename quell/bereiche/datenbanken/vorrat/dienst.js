"use strict";
/* ============================================================================
 * vorrat.js — Vorberechnete Werte, mit sichtbarem Stand
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/vorrat/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/vorrat/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Idee 14 der 10000×-Liste: „Materialisierte Ansichten und Zwischenspeicher".
 * Grosse Datenbanken mit Formeln und Rollups werden zäh — und man erfährt
 * nirgends, warum. Die Idee schlägt vor: teure Werte vorberechnen, einfrieren,
 * und **anzeigen**, wie alt der Stand ist: *„Diese Übersicht wird alle 15
 * Minuten neu berechnet."*
 *
 * Der Unterschied zum Formelspeicher in `tempo.js` ist wichtig, sonst baut man
 * zweimal dasselbe:
 *
 *   tempo.js   rechnet **jede** Formel einmal je Datenstand und wirft alles
 *              weg, sobald sich irgendetwas ändert. Nach einem Neuladen ist
 *              er leer. Er macht ein Neuzeichnen billig.
 *
 *   vorrat.js  rechnet auf Wunsch **einmal** und behält das Ergebnis über
 *              Änderungen und über das Neuladen hinweg. Er macht das
 *              *Öffnen* einer grossen Datenbank billig — und nimmt dafür in
 *              Kauf, dass ein Wert eine Weile veraltet ist.
 *
 * Genau deshalb ist das kein stiller Beschleuniger, sondern eine Abmachung,
 * die sichtbar sein muss. Über der Tabelle steht dann, wann gerechnet wurde
 * und wie viele Änderungen es seither gab. Ein Zwischenspeicher, den man
 * nicht sieht, ist eine Falle: irgendwann steht eine Zahl da, die nicht mehr
 * stimmt, und niemand weiss warum.
 *
 * Eingeschaltet ist er nirgends von selbst. Er lohnt sich erst ab vielen
 * Zeilen, und Redion sagt auch, ab wann.
 * ==========================================================================*/
const Vorrat = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    /* Ab so vielen Zeilen lohnt sich das überhaupt. Darunter kostet das
       Verwalten mehr, als das Rechnen spart. */
    const LOHNT_AB = 120;
    const TAKTE = [
        ['manuell', 'Nur auf Knopfdruck'],
        ['5', 'Alle 5 Minuten'],
        ['15', 'Alle 15 Minuten'],
        ['60', 'Stündlich']
    ];
    /* sammlungId -> { wann, dauer, anzahl, werte: {rowId|key: rohWert} } */
    const speicher = new Map();
    const geladen = new Set();
    /* ========================================================================
     * 1 · WERTE HALTBAR MACHEN
     * ------------------------------------------------------------------------
     * Ein Datum ist kein JSON. Wer es einfach hineinschreibt, bekommt beim
     * Zurücklesen eine Zeichenkette und wundert sich, warum die Sortierung
     * anders ist als vorher.
     * ======================================================================*/
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
    /* ========================================================================
     * 2 · AN UND AUS
     * ======================================================================*/
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
    /** Lohnt sich das hier überhaupt? Mit einer ehrlichen Begründung. */
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
    /* ========================================================================
     * 3 · RECHNEN
     * ======================================================================*/
    /**
     * Alle gerechneten Spalten einmal durch, Zeit dabei messen.
     * Läuft bewusst über Datenbank.wert und nicht an ihm vorbei: sonst
     * käme hier etwas anderes heraus als in der Tabelle.
     */
    const berechnen = async (collId) => {
        const c = Store.getCollection(collId);
        if (!c)
            return null;
        /* Während des Rechnens darf der Vorrat nicht mitreden — sonst schreibt
           er alte Werte ab und behauptet, sie seien neu. */
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
    /** Beim ersten Blick auf eine Datenbank den gespeicherten Stand holen. */
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
    /* ========================================================================
     * 4 · DER GRIFF IN DEN VORRAT
     * ------------------------------------------------------------------------
     * Wird aus Datenbank.wert gerufen, bevor gerechnet wird. Gibt undefined
     * zurück, wenn nichts da ist — dann rechnet die Tabelle wie immer.
     * ======================================================================*/
    const hole = (collId, rowId, key) => {
        const e = speicher.get(collId);
        if (!e) {
            /* Noch nicht geladen? Dann jetzt, im Hintergrund. Dieser eine
               Durchgang rechnet noch selbst — das ist richtig so, denn ein
               Ladebalken für einen Zwischenspeicher wäre absurd. */
            if (!geladen.has(collId))
                laden(collId);
            return undefined;
        }
        const v = e.werte[rowId + '|' + key];
        return v === undefined ? undefined : auspacken(v);
    };
    /**
     * Wie viel hat sich seit der Berechnung geändert?
     *
     * Bewusst nachgezählt statt mitgezählt: ein Zähler, der an einem Ereignis
     * hängt, wird irgendwann falsch — er verpasst einen Weg, über den auch
     * geschrieben wird, und zeigt dann beruhigende Nullen. Die Zeitstempel
     * lügen nicht.
     */
    const seitherZahl = (collId) => {
        const e = speicher.get(collId);
        if (!e)
            return 0;
        const c = Store.getCollection(collId);
        let n = Store.rowsOf(collId)
            .filter((z) => String(z.edited || z.created || '') > String(e.wann)).length;
        if (c && String(c.edited || '') > String(e.wann))
            n++; /* Schemaänderung */
        return n;
    };
    const stand = (collId) => {
        const e = speicher.get(collId);
        if (!e)
            return null;
        return { wann: e.wann, dauer: e.dauer, anzahl: e.anzahl,
            seither: seitherZahl(collId) };
    };
    /* ========================================================================
     * 5 · DIE ANZEIGE
     * ======================================================================*/
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
    /**
     * Die Leiste über der Tabelle. Sie ist der eigentliche Punkt dieser Datei:
     * ein Zwischenspeicher, den man nicht sieht, ist eine Falle.
     */
    const leiste = (coll) => {
        if (!aktiv(coll.id))
            return null;
        const s = stand(coll.id);
        const e = einstellung(coll);
        const d = document.createElement('div');
        d.className = 'vorrat-leiste';
        d.style.cssText = 'display:flex;gap:10px;align-items:center;padding:6px 10px;' +
            'margin-bottom:8px;border-radius:8px;font-size:.9em;' +
            'background:var(--soft,#f6f6f6);opacity:.9';
        if (!s) {
            d.innerHTML = '<span>❄ Vorberechnung ist an, aber es liegt noch nichts vor.</span>' +
                '<button class="btn" data-a="jetzt">Jetzt rechnen</button>';
        }
        else {
            d.innerHTML =
                '<span>❄ Gerechnet ' + esc(vorText(s.wann)) + ' · ' + s.anzahl + ' Werte in ' +
                    s.dauer + ' ms</span>' +
                    (s.seither
                        ? '<b style="color:var(--gelb,#a80)">' + s.seither + ' Änderung' +
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
    /* ========================================================================
     * 6 · DAS FENSTER
     * ======================================================================*/
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
            '<p style="padding:10px 12px;background:var(--soft,#f6f6f6);border-radius:8px">' +
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
    /* ========================================================================
     * 7 · DER TAKT
     * ======================================================================*/
    let uhr;
    const takten = async () => {
        for (const c of Object.values(Store.cache.collections)) {
            const e = einstellung(c);
            if (!e || !e.an || e.takt === 'manuell')
                continue;
            const s = stand(c.id);
            const minuten = Number(e.takt) || 15;
            if (!s || (Date.now() - new Date(s.wann).getTime()) / 60000 >= minuten) {
                /* Nur, wenn sich überhaupt etwas geändert hat — sonst rechnet die
                   App stündlich dasselbe aus und verbraucht Strom für nichts. */
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
