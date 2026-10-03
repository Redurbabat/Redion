"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ereignisse/protokoll.ts (npm run bauen:ts). */
const Protokoll = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const SCHLUESSEL = 'protokoll';
    const MAX = 2000;
    const ARTEN = [
        ['seite-neu', '📄', 'Seite angelegt'],
        ['seite-weg', '🗑', 'In den Papierkorb'],
        ['seite-zurueck', '↩', 'Aus dem Papierkorb zurück'],
        ['seite-endgueltig', '💀', 'Endgültig gelöscht'],
        ['db-neu', '▦', 'Datenbank angelegt'],
        ['zeile-neu', '＋', 'Eintrag angelegt'],
        ['spalte', '⊞', 'Spalte geändert'],
        ['automation', '⚡', 'Automation gelaufen'],
        ['ki', '✨', 'KI gefragt'],
        ['export', '⭳', 'Ausgegeben'],
        ['import', '⭱', 'Eingelesen'],
        ['rechte', '🔑', 'Rechte geändert'],
        ['konto', '👤', 'Konto'],
        ['schluessel', '🔒', 'Verschlüsselung'],
        ['api', '🔌', 'Über die Schnittstelle'],
        ['transaktion', '⚙', 'Transaktion'],
        ['einstellung', '⚙', 'Einstellung geändert'],
        ['sonstiges', '·', 'Sonstiges']
    ];
    const SONSTIGES = ['sonstiges', '·', 'Sonstiges'];
    const artVon = (id) => ARTEN.find(a => a[0] === id)
        ?? ARTEN[ARTEN.length - 1]
        ?? SONSTIGES;
    let puffer = null;
    let schreibUhr;
    const laden = () => {
        if (!puffer)
            puffer = Store.getMeta(SCHLUESSEL, []) || [];
        if (!puffer)
            puffer = [];
        return puffer;
    };
    const sichern = () => {
        clearTimeout(schreibUhr);
        schreibUhr = setTimeout(() => {
            try {
                Store.setMeta(SCHLUESSEL, puffer || []);
            }
            catch { }
        }, 800);
    };
    const notieren = (art, text, zusatz) => {
        if (Store.getMeta('protokollAus', false))
            return null;
        const liste = laden();
        const z = zusatz || {};
        const eintrag = {
            id: Store.uid().slice(0, 8),
            wann: Store.now(),
            art: artVon(art)[0],
            text: String(text || ''),
            wer: z['wer'] || (typeof Konten !== 'undefined' ? (Konten.aktiv() || {}).name : '') || 'Ich',
            seite: z['seite'] || null,
            objekt: z['id'] || null,
            wie: z['wie'] || ''
        };
        liste.unshift(eintrag);
        if (liste.length > MAX)
            liste.length = MAX;
        sichern();
        return eintrag;
    };
    const alle = () => laden().slice();
    const leeren = () => { puffer = []; Store.setMeta(SCHLUESSEL, []); };
    const gefiltert = ({ art, wer, seite, von, bis, suche } = {}) => laden().filter((e) => {
        if (art && e.art !== art)
            return false;
        if (wer && e.wer !== wer)
            return false;
        if (seite && e.seite !== seite)
            return false;
        if (von && e.wann < von)
            return false;
        if (bis && e.wann > bis + 'T23:59:59')
            return false;
        if (suche && !((e.text + ' ' + e.wer).toLowerCase().includes(suche.toLowerCase())))
            return false;
        return true;
    });
    const zahlen = () => {
        const liste = laden();
        const nachArt = {}, nachWer = {}, nachTag = {};
        liste.forEach((e) => {
            nachArt[e.art] = (nachArt[e.art] || 0) + 1;
            nachWer[e.wer] = (nachWer[e.wer] || 0) + 1;
            const t = String(e.wann).slice(0, 10);
            nachTag[t] = (nachTag[t] || 0) + 1;
        });
        return { gesamt: liste.length, nachArt, nachWer, nachTag };
    };
    let eingeklinkt = false;
    const einklinken = () => {
        if (eingeklinkt)
            return;
        eingeklinkt = true;
        const nameVon = (b) => (b && b.text) || 'Ohne Titel';
        const altAdd = Store.addBlock;
        Store.addBlock = function (parentId, type, patch, index) {
            const b = altAdd.call(Store, parentId, type, patch, index);
            if (b && b.type === 'page')
                notieren('seite-neu', 'Seite „' + nameVon(b) + '" angelegt', { seite: b.id, id: b.id });
            if (b && b.type === 'database')
                notieren('db-neu', 'Datenbank „' + nameVon(b) + '" angelegt', { seite: b.id, id: b.id });
            return b;
        };
        const altDb = Store.addDatabase;
        Store.addDatabase = function (parentId, name, schema, layout) {
            const erg = altDb.call(Store, parentId, name, schema, layout);
            if (erg && erg.block)
                notieren('db-neu', 'Datenbank „' + (name || 'Neue Datenbank') + '" angelegt', { seite: erg.block.id, id: erg.block.id });
            return erg;
        };
        const altTrash = Store.trashBlock;
        Store.trashBlock = function (id) {
            const b = Store.getBlock(id);
            const erg = altTrash.call(Store, id);
            if (b && (b.type === 'page' || b.type === 'database' || b.parentTable === 'collection'))
                notieren('seite-weg', '„' + nameVon(b) + '" in den Papierkorb', { id });
            return erg;
        };
        const altRestore = Store.restoreBlock;
        Store.restoreBlock = function (id) {
            const erg = altRestore.call(Store, id);
            const b = Store.getBlock(id);
            if (b && (b.type === 'page' || b.type === 'database' || b.parentTable === 'collection'))
                notieren('seite-zurueck', '„' + nameVon(b) + '" wiederhergestellt', { seite: id, id });
            return erg;
        };
        const altPurge = Store.purgeBlock;
        Store.purgeBlock = function (id) {
            const b = Store.getBlock(id);
            if (b && (b.type === 'page' || b.type === 'database'))
                notieren('seite-endgueltig', '„' + nameVon(b) + '" endgültig gelöscht', { id });
            return altPurge.call(Store, id);
        };
        const altAddRow = Store.addRow;
        Store.addRow = function (cid, props) {
            const z = altAddRow.call(Store, cid, props);
            const c = Store.getCollection(cid);
            notieren('zeile-neu', 'Eintrag in „' + ((c && c.name) || 'Datenbank') + '"', { seite: z && z.id, id: z && z.id });
            return z;
        };
        const altColl = Store.updateCollection;
        Store.updateCollection = function (id, patch) {
            if (patch && patch.schema) {
                const alt = Store.getCollection(id);
                const vorher = Object.keys((alt && alt.schema) || {});
                const nachher = Object.keys(patch.schema);
                const dazu = nachher.filter(k => !vorher.includes(k));
                const weg = vorher.filter(k => !nachher.includes(k));
                if (dazu.length || weg.length)
                    notieren('spalte', (dazu.length ? dazu.length + ' Spalte(n) dazu' : '') +
                        (dazu.length && weg.length ? ', ' : '') +
                        (weg.length ? weg.length + ' entfernt' : '') +
                        ' in „' + ((alt && alt.name) || 'Datenbank') + '"', { id });
            }
            return altColl.call(Store, id, patch);
        };
    };
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const wannText = (iso) => {
        const d = new Date(iso);
        if (isNaN(d.getTime()))
            return String(iso || '');
        const heute = new Date();
        heute.setHours(0, 0, 0, 0);
        const tag = new Date(d);
        tag.setHours(0, 0, 0, 0);
        const p = (n) => String(n).padStart(2, '0');
        const uhr = p(d.getHours()) + ':' + p(d.getMinutes());
        const diff = Math.round((heute.getTime() - tag.getTime()) / 86400000);
        if (diff === 0)
            return 'Heute ' + uhr;
        if (diff === 1)
            return 'Gestern ' + uhr;
        return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '. ' + uhr;
    };
    const alsCsv = (liste) => {
        const kopf = ['Wann', 'Art', 'Was', 'Wer', 'Objekt'];
        const zeilen = liste.map((e) => [e.wann, artVon(e.art)[2], e.text, e.wer, e.objekt || '']);
        const feld = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
        return [kopf, ...zeilen].map(z => z.map(feld).join(';')).join('\n');
    };
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        let filter = {};
        o.innerHTML =
            '<div class="finder" style="width:min(760px,95vw)">' +
                '<div class="fh">📜 Protokoll <em id="pr-zahl"></em>' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="fn-reihe" style="padding:12px 16px 0; gap:7px">' +
                '<select id="pr-art" class="fn-feld" style="flex:0 0 auto"><option value="">Alle Arten</option>' +
                ARTEN.map(([id, ic, n]) => `<option value="${id}">${ic} ${esc(n)}</option>`).join('') +
                '</select>' +
                '<select id="pr-wer" class="fn-feld" style="flex:0 0 auto"><option value="">Alle</option></select>' +
                '<input id="pr-suche" class="fn-feld" placeholder="Suchen …" style="min-width:130px">' +
                '<input id="pr-von" class="fn-feld" type="date" title="ab diesem Tag" style="flex:0 0 auto">' +
                '</div>' +
                '<div class="res" id="pr-liste" style="padding:10px 8px"></div>' +
                '<div class="fbtns">' +
                '<span id="pr-hinweis" class="fn-hinweis"></span>' +
                '<button data-a="csv">Als CSV</button>' +
                '<button data-a="leeren" class="rot">Leeren</button>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        const feld = (id) => o.querySelector(id);
        const werListe = () => {
            const namen = [...new Set(laden().map((e) => e.wer))].sort();
            const wer = feld('#pr-wer');
            if (wer)
                wer.innerHTML = '<option value="">Alle</option>' +
                    namen.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
        };
        const zeichne = () => {
            const liste = gefiltert(filter);
            const zahl = feld('#pr-zahl'), hinweis = feld('#pr-hinweis'), listenFeld = feld('#pr-liste');
            if (!zahl || !hinweis || !listenFeld)
                return;
            zahl.textContent = String(liste.length);
            hinweis.innerHTML =
                'Das Protokoll steht im Browser, nicht auf einem Server — wer hier sitzt, ' +
                    'kann es auch löschen. Angesehene Seiten werden nicht mitgezählt.';
            listenFeld.innerHTML = liste.length
                ? liste.slice(0, 400).map((e) => {
                    const a = artVon(e.art);
                    return '<div class="pr-zeile"' + (e.seite ? ` data-seite="${e.seite}"` : '') + '>' +
                        `<span class="pr-ic">${a[1]}</span>` +
                        `<div class="pr-mitte"><b>${esc(e.text)}</b>` +
                        `<span>${esc(a[2])} · ${esc(e.wer)}${e.wie ? ' · ' + esc(e.wie) : ''}</span></div>` +
                        `<span class="pr-wann">${esc(wannText(e.wann))}</span></div>`;
                }).join('') +
                    (liste.length > 400
                        ? '<div style="padding:10px 14px; font-size:12px; color:var(--text-faint)">' +
                            '… und ' + (liste.length - 400) + ' weitere. Die CSV enthält alle.</div>' : '')
                : '<div style="padding:22px; color:var(--text-faint); font-size:14px">' +
                    'Noch nichts aufgezeichnet.</div>';
        };
        werListe();
        zeichne();
        const neuFiltern = () => {
            const wert = (id) => feld(id)?.value ?? '';
            filter = {
                art: wert('#pr-art'),
                wer: wert('#pr-wer'),
                suche: wert('#pr-suche'),
                von: wert('#pr-von')
            };
            zeichne();
        };
        ['#pr-art', '#pr-wer', '#pr-von'].forEach(s => feld(s)?.addEventListener('change', neuFiltern));
        feld('#pr-suche')?.addEventListener('input', neuFiltern);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const zeile = elVon(e)?.closest('[data-seite]');
            if (zeile) {
                const b = Store.getBlock(zeile.dataset.seite);
                if (b && b.alive !== false) {
                    o.remove();
                    App.oeffne(b.id);
                }
                else
                    UI.toast('Diese Seite gibt es nicht mehr');
                return;
            }
            const a = elVon(e)?.closest('[data-a]');
            if (!a)
                return;
            if (a.dataset.a === 'csv') {
                const csv = alsCsv(gefiltert(filter));
                const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'protokoll.csv';
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                notieren('export', 'Protokoll als CSV ausgegeben');
            }
            if (a.dataset.a === 'leeren') {
                if (!confirm('Das ganze Protokoll löschen? Das lässt sich nicht rückgängig machen.'))
                    return;
                leeren();
                werListe();
                zeichne();
                UI.toast('Protokoll geleert');
            }
        });
    };
    const start = () => {
        einklinken();
        notieren('konto', 'Redion geöffnet', { wie: navigator.platform || '' });
    };
    return { notieren, alle, gefiltert, zahlen, leeren, dialog, start,
        ARTEN, artVon, wannText, alsCsv, einklinken };
})();
window.Protokoll = Protokoll;
