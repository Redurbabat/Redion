"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/entwicklung/ui-reserve/reserve.ts (npm run bauen:ts). */
const ZEIGBAR = new Set([
    'chat-original', 'chat-original-snippet', 'uiverse-galaxy-verifiziert',
    'uiverse-galaxy-verifiziert-struktur', 'uiverse-seite-verifiziert'
]);
const STATUS_WORT = {
    'produktiv': 'produktiv', 'produktiv-adaptiert': 'produktiv, angepasst',
    'bedingt-produktiv': 'bedingt produktiv', 'reserve': 'Reserve', 'ersetzt': 'ersetzt'
};
const raster = document.getElementById('res-raster');
const statusZeile = document.getElementById('res-status');
const filterKnoepfe = Array.from(document.querySelectorAll('[data-filter]'));
let eintraege = [];
let filter = 'alle';
const passt = (e) => {
    if (filter === 'alle')
        return true;
    if (filter === 'produktiv')
        return e.status === 'produktiv' || e.status === 'produktiv-adaptiert';
    if (filter === 'reserve')
        return e.status === 'reserve' || e.status === 'ersetzt';
    return e.kategorie === filter;
};
const zeile = (klasse, text) => {
    const p = document.createElement('p');
    p.className = klasse;
    p.textContent = text;
    return p;
};
const karte = (e) => {
    const k = document.createElement('article');
    k.className = 'res-karte';
    k.dataset['status'] = e.status;
    const meta = document.createElement('div');
    meta.className = 'res-meta';
    const h = document.createElement('h2');
    h.textContent = `${String(e.nr).padStart(2, '0')} · ${e.name}`;
    meta.append(h, zeile('res-autor', `Autor: ${e.autor || 'unbekannt'}`), zeile('res-stand', `Redion: ${STATUS_WORT[e.status]}`), zeile('res-ort', e.redionOrt === '—' ? 'Kein produktiver Ort' : `Ort: ${e.redionOrt}`), zeile('res-quelle', `Quelle: ${e.quelleStatus}`), zeile('res-notiz', e.notiz));
    const vorschau = document.createElement('div');
    vorschau.className = 'res-vorschau';
    if (e.original && ZEIGBAR.has(e.quelleStatus)) {
        const rahmen = document.createElement('iframe');
        rahmen.loading = 'lazy';
        rahmen.title = `Originalvorschau: ${e.name}`;
        rahmen.setAttribute('sandbox', '');
        rahmen.src = e.original;
        vorschau.append(rahmen);
    }
    else {
        const fehlt = document.createElement('p');
        fehlt.className = 'res-fehlt';
        fehlt.setAttribute('role', 'note');
        fehlt.textContent = 'Originalcode noch nicht verifiziert';
        vorschau.append(fehlt);
    }
    k.append(meta, vorschau);
    return k;
};
const zeichnen = () => {
    if (!raster || !statusZeile)
        return;
    const sichtbar = eintraege.filter(passt);
    raster.replaceChildren(...sichtbar.map(karte));
    statusZeile.textContent = `${sichtbar.length} von ${eintraege.length} Komponenten`;
};
filterKnoepfe.forEach(b => b.addEventListener('click', () => {
    filter = b.dataset['filter'] ?? 'alle';
    filterKnoepfe.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    zeichnen();
}));
fetch('./katalog.json')
    .then(r => { if (!r.ok)
    throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((d) => { eintraege = Array.isArray(d) ? d : []; zeichnen(); })
    .catch((fehler) => {
    if (statusZeile)
        statusZeile.textContent =
            'Der Katalog liess sich nicht laden: ' + (fehler instanceof Error ? fehler.message : String(fehler))
                + ' — diese Seite braucht einen kleinen Server (z. B. npm run server), von file:// blockiert der Browser fetch.';
});
