"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/auftraege.ts (npm run bauen:ts). */
const AuftragsAnzeige = (() => {
    const NAMEN = {
        'ocr': 'Text aus Bildern lesen',
        'pdf-einlesen': 'PDF einlesen',
        'sicherung': 'Sicherung schreiben',
        'embeddings': 'Gedächtnis bauen',
        'import': 'Import'
    };
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const artWort = (art) => {
        const vonDerArt = (typeof Auftraege !== 'undefined' && Auftraege.artName)
            ? Auftraege.artName(art) : '';
        return vonDerArt || NAMEN[art] || String(art || 'Auftrag');
    };
    const anteil = (a) => {
        if (a?.zustand === 'wartet')
            return null;
        const ganz = Number(a?.schritte);
        const fertig = Number(a?.schritt);
        if (!Number.isFinite(ganz) || ganz <= 0)
            return null;
        if (!Number.isFinite(fertig) || fertig < 0)
            return 0;
        return Math.max(0, Math.min(1, fertig / ganz));
    };
    const standSatz = (a) => {
        if (a?.zustand === 'wartet') {
            const grund = (typeof Auftraege !== 'undefined' && Auftraege.wartetAuf)
                ? Auftraege.wartetAuf(a) : '';
            return grund || 'wartet';
        }
        if (a?.zustand === 'fehler')
            return 'Fehler — wird erneut versucht';
        const ganz = Number(a?.schritte);
        const fertig = Number(a?.schritt) || 0;
        if (Number.isFinite(ganz) && ganz > 0)
            return fertig + ' von ' + ganz;
        return fertig === 1 ? '1 Schritt fertig' : fertig + ' Schritte fertig';
    };
    let fenster = null;
    const bildArt = (a) => {
        if (a?.zustand !== 'laeuft')
            return '';
        if (String(a?.art) === 'pdf-bilder')
            return 'presse';
        return anteil(a) === null ? 'sterne' : '';
    };
    const zeileHtml = (a) => {
        const q = anteil(a);
        const bild = bildArt(a);
        return '<div class="arb-z" data-id="' + esc(a.id) + '">' +
            '<div class="arb-kopf">' +
            '<b>' + esc(artWort(a.art)) + '</b>' +
            '<button type="button" class="arb-stopp" data-stopp="' + esc(a.id) + '" ' +
            'aria-label="' + esc(artWort(a.art)) + ' abbrechen">Abbrechen</button>' +
            '</div>' +
            (bild ? '<span class="arb-bild" data-lader="' + bild + '"></span>' : '') +
            (a.text ? '<div class="arb-text">' + esc(a.text) + '</div>' : '') +
            (q === null ? '' :
                '<div class="arb-balken" role="progressbar" aria-valuemin="0" aria-valuemax="100" ' +
                    'aria-valuenow="' + Math.round(q * 100) + '">' +
                    '<i style="width:' + Math.round(q * 100) + '%"></i></div>') +
            '<div class="arb-stand">' + esc(standSatz(a)) +
            (a.versuche > 1 ? ' · ' + a.versuche + '. Versuch' : '') + '</div>' +
            '</div>';
    };
    const auffrischen = async () => {
        if (!fenster)
            return;
        let liste = [];
        try {
            liste = await Auftraege.offen();
        }
        catch {
            liste = [];
        }
        const koerper = fenster.querySelector('.arb-liste');
        if (!koerper)
            return;
        koerper.innerHTML = liste.length
            ? liste.map(zeileHtml).join('')
            : '<div class="arb-leer">Nichts läuft mehr. Alles erledigt.</div>';
        koerper.querySelectorAll('[data-lader]').forEach(platz => {
            if (typeof Lader === 'undefined')
                return;
            const art = platz.dataset['lader'];
            if (art !== 'presse' && art !== 'sterne')
                return;
            const zeile = platz.closest('.arb-z');
            const satz = zeile?.querySelector('.arb-stand')?.textContent || 'Läuft …';
            platz.append(Lader.bauen({ art, text: satz }).element);
            platz.querySelector('.ru-lader-text')?.remove();
        });
        koerper.querySelectorAll('[data-stopp]').forEach(b => b.addEventListener('click', async () => {
            b.setAttribute('disabled', 'disabled');
            b.textContent = 'wird abgebrochen …';
            try {
                await Auftraege.abbrechen(b.dataset['stopp'] || '');
            }
            catch { }
            await auffrischen();
        }));
    };
    const knopfFrisch = async () => {
        let n = 0;
        try {
            n = (await Auftraege.offen()).length;
        }
        catch {
            n = 0;
        }
        const wort = n === 1 ? '1 Auftrag läuft' : n + ' Aufträge laufen';
        for (const id of ['mb-auftraege', 'studio-auftraege']) {
            const b = document.getElementById(id);
            if (!b)
                continue;
            b.hidden = n === 0;
            const zahl = b.querySelector('b');
            if (zahl) {
                zahl.textContent = String(n);
                zahl.hidden = n < 2;
            }
            b.setAttribute('aria-label', wort);
            b.title = wort;
        }
    };
    const oeffnen = () => {
        zu();
        const o = document.createElement('div');
        o.className = 'overlay arb-fenster';
        o.innerHTML =
            '<div class="arb-kasten" role="dialog" aria-label="Was gerade läuft">' +
                '<div class="arb-titel">Was gerade läuft' +
                '<button type="button" class="arb-zu" aria-label="Schliessen">×</button>' +
                '</div>' +
                '<div class="arb-liste"></div>' +
                '</div>';
        document.body.appendChild(o);
        fenster = o;
        o.querySelector('.arb-zu')?.addEventListener('click', zu);
        o.addEventListener('click', e => { if (e.target === o)
            zu(); });
        void auffrischen();
    };
    const zu = () => {
        document.querySelectorAll('.arb-fenster').forEach(x => x.remove());
        fenster = null;
    };
    const offenSichtbar = () => !!fenster;
    let horcht = false;
    const anmelden = () => {
        if (horcht)
            return;
        horcht = true;
        const auf = () => { void knopfFrisch(); void auffrischen(); };
        for (const e of ['auftrag.angelegt', 'auftrag.beginnt', 'auftrag.schritt',
            'auftrag.beendet', 'auftrag.fehler', 'auftrag.wiederaufgenommen']) {
            try {
                Ereignisse.horche(e, auf);
            }
            catch { }
        }
    };
    return { oeffnen, zu, offenSichtbar, knopfFrisch, auffrischen, anmelden,
        artWort, anteil, standSatz, NAMEN };
})();
window.AuftragsAnzeige = AuftragsAnzeige;
