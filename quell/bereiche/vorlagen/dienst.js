"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/vorlagen/dienst.ts (npm run bauen:ts). */
const Fassung = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const FASSUNGEN = {
        habit: 2,
        projekte: 2
    };
    const jetzige = (id) => FASSUNGEN[id] || 1;
    const MIGRATIONEN = {
        habit: [
            { nach: 2, was: 'Wochentag und eine Monatsauswertung',
                schritte: [
                    { tun: 'spalteDazu', db: 'Tagesdaten', key: 'wtag',
                        def: { name: 'Wochentag', type: 'formula',
                            formula: 'formatDate(prop("DATUM"), "dddd")' },
                        warum: 'Damit sich sehen lässt, an welchen Wochentagen es hakt — ' +
                            'die meisten Serien reissen am selben Tag.' },
                    { tun: 'ansichtDazu', db: 'Tagesdaten', layout: 'pivot',
                        name: 'Monat × Wochentag',
                        felder: { pivotZeile: 'wtag', pivotArt: 'schnitt' },
                        warum: 'Eine Kreuztabelle über den Durchschnitt statt einer langen Liste.' }
                ] }
        ],
        projekte: [
            { nach: 2, was: 'Überfällige sichtbar machen',
                schritte: [
                    { tun: 'spalteDazu', db: 'Aufgaben', key: 'ueber',
                        def: { name: 'Überfällig', type: 'formula',
                            formula: 'if(empty(prop("Fällig")), false, ' +
                                'and(dateBetween(prop("Fällig"), now(), "days") < 0, ' +
                                'prop("Status") != "Fertig"))' },
                        warum: 'Ein Kreuz reicht nicht — man sieht erst, dass etwas überfällig ist, ' +
                            'wenn man nachrechnet.' },
                    { tun: 'ansichtDazu', db: 'Aufgaben', layout: 'table', name: 'Überfällig',
                        filter: { operator: 'and',
                            rules: [{ key: 'ueber', art: 'wert-ist', op: 'ist', wert: 'true' }] },
                        warum: 'Eine Ansicht, die nur zeigt, was brennt.' }
                ] }
        ]
    };
    const markiere = (seite, vorlageId) => {
        if (!seite || !seite.id)
            return seite;
        Store.updateBlock(seite.id, {
            vorlage: vorlageId,
            vorlageFassung: jetzige(vorlageId),
            vorlageWann: Store.now()
        });
        return seite;
    };
    const ausVorlagen = () => Object.values(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive !== false && b.vorlage);
    const veraltet = () => ausVorlagen()
        .filter(b => (Number(b.vorlageFassung) || 1) < jetzige(b.vorlage))
        .map(b => ({ seite: b, von: Number(b.vorlageFassung) || 1, nach: jetzige(b.vorlage) }));
    const sammlungIn = (seiteId, name) => {
        let treffer = null;
        const gehe = (id, tiefe = 0) => {
            if (treffer || tiefe > 30)
                return;
            const b = Store.getBlock(id);
            if (!b || b.alive === false)
                return;
            if (b.collectionId) {
                const c = Store.getCollection(b.collectionId);
                if (c && (c.name || '') === name) {
                    treffer = c;
                    return;
                }
            }
            (b.content || []).forEach((k) => gehe(k, tiefe + 1));
        };
        gehe(seiteId);
        return treffer;
    };
    const schrittLaufen = (schritt, seiteId, echt) => {
        const coll = schritt.db ? sammlungIn(seiteId, schritt.db) : null;
        if (schritt.tun === 'hinweis')
            return { stand: 'hinweis', text: schritt.text || '' };
        if (schritt.db && !coll)
            return { stand: 'fehlt',
                text: 'Die Datenbank „' + esc(schritt.db) + '" ist hier nicht (mehr) zu finden. ' +
                    'Wurde sie umbenannt, muss dieser Schritt von Hand gemacht werden.' };
        if (schritt.tun === 'spalteDazu') {
            const dasselbe = Object.entries(coll.schema)
                .find(([k, d]) => k === schritt.key ||
                (d.name || '').toLowerCase() === (schritt.def.name || '').toLowerCase());
            if (dasselbe)
                return { stand: 'schon',
                    text: 'Die Spalte „' + esc(schritt.def.name) + '" gibt es schon — bleibt, wie sie ist.' };
            if (echt) {
                coll.schema[schritt.key] = JSON.parse(JSON.stringify(schritt.def));
                Store.updateCollection(coll.id, { schema: coll.schema });
            }
            return { stand: echt ? 'getan' : 'neu',
                text: 'Spalte „' + esc(schritt.def.name) + '" in „' + esc(schritt.db) + '"' +
                    (schritt.def.type === 'formula' ? ' (Formel)' : '') };
        }
        if (schritt.tun === 'formel') {
            const def = coll.schema[schritt.key];
            if (!def)
                return { stand: 'fehlt',
                    text: 'Die Spalte gibt es hier nicht — der Schritt wird übersprungen.' };
            if (String(def.formula || '') === String(schritt.formula))
                return { stand: 'schon', text: 'Die Formel steht schon so da.' };
            if (def.eigenHand)
                return { stand: 'schon',
                    text: 'Diese Formel wurde von Hand geändert — sie bleibt unangetastet.' };
            if (echt) {
                def.formula = schritt.formula;
                Store.updateCollection(coll.id, { schema: coll.schema });
            }
            return { stand: echt ? 'getan' : 'neu',
                text: 'Formel von „' + esc(def.name) + '" wird erneuert' };
        }
        if (schritt.tun === 'optionDazu') {
            const def = coll.schema[schritt.key];
            if (!def)
                return { stand: 'fehlt', text: 'Die Spalte gibt es hier nicht.' };
            def.options = def.options || [];
            if (def.options.some((o) => o.name === schritt.option.name))
                return { stand: 'schon', text: 'Die Option „' + esc(schritt.option.name) + '" gibt es schon.' };
            if (echt) {
                def.options.push(JSON.parse(JSON.stringify(schritt.option)));
                Store.updateCollection(coll.id, { schema: coll.schema });
            }
            return { stand: echt ? 'getan' : 'neu',
                text: 'Option „' + esc(schritt.option.name) + '" bei „' + esc(def.name) + '"' };
        }
        if (schritt.tun === 'ansichtDazu') {
            const da = (coll.viewIds || []).map((id) => Store.getView(id))
                .some((v) => v && (v.name || '') === schritt.name);
            if (da)
                return { stand: 'schon',
                    text: 'Die Ansicht „' + esc(schritt.name) + '" gibt es schon.' };
            if (echt) {
                const v = Store.addView(coll.id, schritt.layout || 'table', schritt.name);
                if (v) {
                    const patch = Object.assign({}, schritt.felder || {});
                    if (schritt.filter)
                        patch.filters = JSON.parse(JSON.stringify(schritt.filter));
                    if (Object.keys(patch).length)
                        Store.updateView(v.id, patch);
                }
            }
            return { stand: echt ? 'getan' : 'neu',
                text: 'Ansicht „' + esc(schritt.name) + '" (' + esc(schritt.layout || 'Tabelle') + ')' };
        }
        return { stand: 'fehlt', text: 'Unbekannter Schritt: ' + esc(schritt.tun) };
    };
    const plan = (seiteId) => {
        const s = Store.getBlock(seiteId);
        if (!s || !s.vorlage)
            return null;
        const von = Number(s.vorlageFassung) || 1;
        const nach = jetzige(s.vorlage);
        const wege = (MIGRATIONEN[s.vorlage] || []).filter((m) => m.nach > von && m.nach <= nach);
        const schritte = [];
        wege.forEach((m) => (m.schritte || []).forEach((sch) => schritte.push({ fassung: m.nach, was: m.was, schritt: sch,
            ...schrittLaufen(sch, seiteId, false) })));
        return { seite: s, vorlage: s.vorlage, von, nach, wege, schritte,
            neu: schritte.filter(x => x.stand === 'neu').length,
            schon: schritte.filter(x => x.stand === 'schon').length,
            fehlt: schritte.filter(x => x.stand === 'fehlt').length };
    };
    const anwenden = (seiteId) => {
        const p = plan(seiteId);
        if (!p)
            return null;
        const bericht = p.schritte.map((x) => ({ ...x, ...schrittLaufen(x.schritt, seiteId, true) }));
        Store.updateBlock(seiteId, {
            vorlageFassung: p.nach,
            vorlageStand: Store.now()
        });
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('vorlage', 'Vorlage „' + p.vorlage + '" von Fassung ' +
                p.von + ' auf ' + p.nach + ' gebracht', { seite: seiteId, id: seiteId });
        try {
            App.zeichneSeite();
        }
        catch { }
        return { ...p, bericht };
    };
    const ZEICHEN = { neu: '＋', schon: '·', fehlt: '⚠️', getan: '✓', hinweis: 'ℹ️' };
    const fenster = (seiteId) => {
        const p = plan(seiteId);
        const o = document.createElement('div');
        o.className = 'overlay';
        const inhalt = () => {
            if (!p)
                return '<p>Diese Seite stammt aus keiner Vorlage.</p>';
            if (p.von >= p.nach)
                return '<p style="opacity:.8">Diese Seite ist auf dem neuesten Stand ' +
                    '(Fassung ' + p.nach + ').</p>';
            return '<p style="opacity:.85;margin-top:0">Diese Seite stammt aus der Vorlage ' +
                '<b>' + esc(p.vorlage) + '</b>, Fassung ' + p.von + '. Es gibt Fassung ' + p.nach + '.</p>' +
                p.wege.map((m) => '<div style="margin:14px 0 6px;font-weight:600">Fassung ' + m.nach + ' — ' + esc(m.was) + '</div>' +
                    p.schritte.filter((x) => x.fassung === m.nach).map((x) => '<div style="display:flex;gap:10px;margin-bottom:8px">' +
                        '<div>' + ZEICHEN[x.stand] + '</div>' +
                        '<div style="flex:1">' + x.text +
                        (x.schritt.warum
                            ? '<div style="opacity:.7;font-size:.92em;margin-top:2px">' +
                                esc(x.schritt.warum) + '</div>' : '') +
                        '</div></div>').join('')).join('') +
                '<p style="opacity:.7;margin-top:16px">Es wird nur hinzugefügt. Keine Zeile wird ' +
                'geändert, nichts gelöscht — und was du selbst schon angelegt hast, bleibt, wie es ist.</p>';
        };
        o.innerHTML = '<div class="finder" style="width:min(660px,95vw)">' +
            '<div class="fh">⬆ Vorlage aktualisieren<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" style="padding:18px;max-height:70vh;overflow:auto">' + inhalt() + '</div>' +
            '<div class="fbtns">' +
            (p && p.von < p.nach
                ? '<button data-a="zu">Später</button>' +
                    '<button data-a="los" class="prim">Auf Fassung ' + p.nach + ' bringen</button>'
                : '<button data-a="zu" class="prim">Schliessen</button>') +
            '</div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="los"]')) {
                const r = anwenden(seiteId);
                o.remove();
                UI.toast(r ? (r.bericht.filter((x) => x.stand === 'getan').length +
                    ' Änderungen angewandt') : 'Nichts zu tun');
            }
        });
        return o;
    };
    const uebersicht = () => {
        const liste = veraltet();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(620px,95vw)">' +
            '<div class="fh">⬆ Vorlagen<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" style="padding:18px;max-height:70vh;overflow:auto">' +
            (liste.length
                ? '<p style="opacity:.85;margin-top:0">' + liste.length + ' Seite' +
                    (liste.length === 1 ? '' : 'n') + ' stammen aus einer Vorlage, für die es eine ' +
                    'neuere Fassung gibt.</p>' +
                    liste.map(x => '<div style="display:flex;gap:10px;align-items:center;padding:10px 0;' +
                        'border-bottom:1px solid var(--line,#eee)">' +
                        '<div style="flex:1"><b>' + esc(x.seite.text || 'Ohne Titel') + '</b>' +
                        '<div style="opacity:.7">Fassung ' + x.von + ' → ' + x.nach + '</div></div>' +
                        '<button class="btn" data-s="' + esc(x.seite.id) + '">Ansehen</button>' +
                        '</div>').join('')
                : '<p style="opacity:.8">Alle Seiten aus Vorlagen sind auf dem neuesten Stand. ' +
                    'Seiten aus Vorlagen insgesamt: ' + ausVorlagen().length + '.</p>') +
            '</div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('[data-s]');
            if (b?.dataset["s"]) {
                o.remove();
                fenster(b.dataset["s"]);
            }
        });
        return o;
    };
    let eingeklinkt = false;
    const start = () => {
        if (eingeklinkt || typeof Galerie === 'undefined')
            return;
        eingeklinkt = true;
        (Galerie.VORLAGEN || []).forEach((v) => {
            const echt = v.bauen;
            v.bauen = () => markiere(echt(), v.id);
        });
        const echtBauen = Galerie.bauen;
        Galerie.bauen = (id) => {
            const s = echtBauen(id);
            return (s && !s.vorlage) ? markiere(s, id) : s;
        };
    };
    return { FASSUNGEN, MIGRATIONEN, jetzige, markiere, ausVorlagen, veraltet,
        sammlungIn, schrittLaufen, plan, anwenden, fenster, uebersicht, start };
})();
window.Fassung = Fassung;
