"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/blatt.ts (npm run bauen:ts). */
const Blatt = (() => {
    const MM = 2.8346457;
    const PAPIERE = [
        { id: 'blanko', name: 'Blanko' },
        { id: 'liniert', name: 'Liniert' },
        { id: 'kariert', name: 'Kariert' },
        { id: 'punkte', name: 'Punktraster' },
        { id: 'mm', name: 'Millimeterpapier' },
        { id: 'cornell', name: 'Cornell-Notizen' },
        { id: 'noten', name: 'Notenlinien' },
    ];
    const papierVon = (block) => {
        const wert = String(block?.papier ?? 'blanko');
        return PAPIERE.some(x => x.id === wert) ? wert : 'blanko';
    };
    const masse = (breite, hoehe, seitenHoehe = hoehe) => {
        const quer = (mm) => (mm * MM / breite * 100) + '%';
        const hoch = (mm) => (mm * MM / hoehe * 100) + '%';
        const seite = (mm) => (mm * MM / hoehe * 100) + '%';
        const inKachel = (mm, kachelMm) => (mm / kachelMm * 100) + '%';
        const inSeitenkachel = (mm) => (mm * MM / seitenHoehe * 100) + '%';
        return {
            '--blatt-seite-hoch': (seitenHoehe / hoehe * 100) + '%',
            '--blatt-cornell-spalte': quer(50),
            '--blatt-cornell-kopf': inSeitenkachel(30),
            '--blatt-cornell-fuss': inSeitenkachel(50),
            '--blatt-noten-linie': inKachel(3, 27),
            '--blatt-noten-satz': inKachel(12, 27),
            '--blatt-noten-takt': seite(27),
            '--blatt-zeile': hoch(8.75),
            '--blatt-karo-quer': quer(5),
            '--blatt-karo-hoch': hoch(5),
            '--blatt-mm-quer': quer(1),
            '--blatt-mm-hoch': hoch(1),
            '--blatt-mm-zehn-quer': quer(10),
            '--blatt-mm-zehn-hoch': hoch(10),
        };
    };
    const waehler = (jetzt) => {
        const name = PAPIERE.find(x => x.id === jetzt)?.name || jetzt;
        return '<span class="blatt-trenn"></span>' +
            '<span class="blatt-papiermenue">' +
            `<button class="blatt-papierknopf" data-a="papier" aria-haspopup="true" aria-expanded="false" ` +
            `title="Papier: ${name} — antippen zum Wechseln" aria-label="Papier: ${name}">` +
            `<i data-vorschau="${jetzt}"></i><span class="wort">Papier</span></button>` +
            '<span class="blatt-papierliste" hidden>' +
            PAPIERE.map(art => `<button class="blatt-papierwahl${art.id === jetzt ? ' on' : ''}" ` +
                `data-papier="${art.id}" title="Papier: ${art.name}" aria-label="Papier: ${art.name}" ` +
                `aria-pressed="${art.id === jetzt ? 'true' : 'false'}">` +
                `<i data-vorschau="${art.id}"></i></button>`).join('') +
            '</span></span>';
    };
    const zeichne = (block) => {
        const R = SheetSpace;
        const seitenHoehe = R.seitenHoehe(block);
        const hoehe = Number(block.blattHoehe) || seitenHoehe;
        const breite = Number(block.blattBreite) || (block.blattAusrichtung === 'quer' ? R.A4_HOEHE : R.A4_BREITE);
        const w = document.createElement('div');
        w.className = 'blatt-huelle';
        const schicht = Marken.schicht(block, breite, hoehe, seitenHoehe);
        const jetzt = papierVon(block);
        const werk = Marken.leiste(schicht, '<span class="blatt-trenn"></span>' +
            '<button data-a="seite" title="Eine Seite anhängen">' +
            '<span class="zeichen">＋</span><span class="wort">Seite</span></button>' +
            waehler(jetzt));
        w.appendChild(werk);
        const papier = document.createElement('div');
        papier.className = 'blatt-papier';
        papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
        papier.dataset.papier = jetzt;
        const grundfarbe = String(block.grundfarbe || '');
        if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(grundfarbe))
            papier.style.setProperty('--paper', grundfarbe);
        for (const [name, wert] of Object.entries(masse(breite, hoehe, seitenHoehe)))
            papier.style.setProperty(name, wert);
        w.appendChild(R.drehHuelle(block, papier));
        const papierListe = werk.querySelector('.blatt-papierliste');
        const papierKnopf = werk.querySelector('.blatt-papierknopf');
        const nebenTipp = (e) => {
            if (!e.target?.closest?.('.blatt-papiermenue'))
                papierMenue(false);
        };
        const escTaste = (e) => {
            if (e.key !== 'Escape')
                return;
            e.stopPropagation();
            papierMenue(false);
            papierKnopf?.focus();
        };
        const papierMenue = (an) => {
            if (!papierListe || !papierKnopf)
                return;
            papierListe.hidden = !an;
            papierKnopf.setAttribute('aria-expanded', an ? 'true' : 'false');
            if (an) {
                document.addEventListener('click', nebenTipp, true);
                document.addEventListener('keydown', escTaste, true);
            }
            else {
                document.removeEventListener('click', nebenTipp, true);
                document.removeEventListener('keydown', escTaste, true);
            }
        };
        werk.addEventListener('click', e => {
            const b = e.target?.closest?.('button');
            if (!b)
                return;
            if (b.dataset.a === 'papier') {
                papierMenue(papierListe ? papierListe.hidden : false);
                return;
            }
            if (b.dataset.papier) {
                const art = b.dataset.papier;
                Store.updateBlock(block.id, { papier: art });
                Store.setMeta('heft:papier', art);
                papier.dataset.papier = art;
                werk.querySelectorAll('[data-papier]').forEach(k => {
                    const an = k.dataset.papier === art;
                    k.classList.toggle('on', an);
                    k.setAttribute('aria-pressed', an ? 'true' : 'false');
                });
                const name = PAPIERE.find(x => x.id === art)?.name || art;
                papierKnopf?.querySelector('i')?.setAttribute('data-vorschau', art);
                papierKnopf?.setAttribute('title', `Papier: ${name} — antippen zum Wechseln`);
                papierKnopf?.setAttribute('aria-label', `Papier: ${name}`);
                papierMenue(false);
                return;
            }
            if (b.dataset.a !== 'seite')
                return;
            Store.updateBlock(block.id, {
                blattHoehe: R.rund(hoehe + seitenHoehe), blattBreite: breite,
                raumVersion: R.RAUM_VERSION
            });
            App.zeichneSeite();
        });
        const inhalt = document.createElement('div');
        inhalt.className = 'blatt-inhalt';
        inhalt.style.padding = (R.RAND / breite * 100) + '%';
        const kinder = Store.childrenOf(block.id);
        const hatMarken = Array.isArray(block.marken) && block.marken.length > 0;
        if (!kinder.length && !hatMarken) {
            const leer = Store.addBlock(block.id, 'text', { text: '' });
            inhalt.appendChild(Blocks.render(leer, 0));
        }
        else {
            kinder.forEach((k) => { inhalt.appendChild(Blocks.render(k, 0)); });
        }
        papier.appendChild(inhalt);
        papier.appendChild(schicht.flaeche);
        const urspruenglich = schicht.setzeWerkzeug;
        schicht.setzeWerkzeug = (wz) => {
            urspruenglich(wz);
            papier.classList.toggle('malt', wz !== 'schreiben');
        };
        return w;
    };
    return { zeichne, PAPIERE, papierVon, masse };
})();
window.Blatt = Blatt;
