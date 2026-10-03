"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/inhaltsflaeche.ts (npm run bauen:ts). */
const Inhaltsflaeche = (() => {
    const esc = (s) => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));
    let gebunden = {};
    const braucht = (name) => (...args) => {
        const fn = gebunden[name];
        if (typeof fn !== 'function') {
            throw new Error('Die Inhaltsfläche wurde ohne „' + name + '" gebunden. ' +
                'Die Inhaltsfläche.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
        }
        return fn(...args);
    };
    const binde = (teile) => {
        gebunden = Object.assign({}, gebunden, teile || {});
    };
    const aktuelleSeite = braucht('aktuelleSeite');
    const streifenZeichnen = () => {
        const seiteId = aktuelleSeite();
        document.getElementById('rand-toc')?.remove();
        const seite = seiteId ? Store.getBlock(seiteId) : null;
        if (!seite)
            return;
        const stufen = (typeof Register !== 'undefined' && Register.bloecke?.ueberschriften)
            ? Register.bloecke.ueberschriften()
            : { h1: 1, h2: 2, h3: 3 };
        const zeigtIn = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.zeigtIn : () => true;
        const kopfzeilen = Store.childrenOf(seite.id)
            .filter((b) => stufen[b.type] && (b.text || '').trim() && zeigtIn(b, 'seite'));
        if (kopfzeilen.length < 3)
            return;
        const main = document.getElementById('main');
        const scroll = document.getElementById('scroll');
        if (!main || !scroll)
            return;
        const d = document.createElement('div');
        d.id = 'rand-toc';
        d.innerHTML = kopfzeilen.map((b) => `<button data-bid="${b.id}" class="rt-${b.type}" title="${esc(b.text)}">` +
            `<i></i><span>${esc(b.text)}</span></button>`).join('');
        main.appendChild(d);
        d.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const b = ziel?.closest('[data-bid]');
            if (!b)
                return;
            const el = document.querySelector(`[data-bid="${b.dataset['bid']}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        const mitlaufen = () => {
            if (!document.body.contains(d)) {
                scroll.removeEventListener('scroll', mitlaufen);
                return;
            }
            let jetzt = null;
            kopfzeilen.forEach((b) => {
                const el = document.querySelector(`.blk[data-bid="${b.id}"]`);
                if (el && el.getBoundingClientRect().top < 140)
                    jetzt = b.id;
            });
            d.querySelectorAll('button').forEach(x => x.classList.toggle('jetzt', x.dataset['bid'] === jetzt));
        };
        scroll.addEventListener('scroll', mitlaufen, { passive: true });
        mitlaufen();
    };
    const leer = (wrap) => {
        wrap.innerHTML =
            '<div style="padding:22vh 0; text-align:center; color:var(--text-faint)">' +
                '<div style="font-size:44px; margin-bottom:14px">📓</div>' +
                '<div style="font-size:17px; margin-bottom:6px">Noch keine Seite geöffnet</div>' +
                '<div style="font-size:14px">Links auf <b>+</b> klicken oder <b>Strg + N</b> drücken</div></div>';
    };
    const zeichne = (wrap, p, wo = 'seite') => {
        if (p.wiki)
            Werkzeuge.wikiIndex(p, wrap);
        const kinder = Store.childrenOf(p.id);
        if (!kinder.length && !p.gesperrt) {
            const b = Store.addBlock(p.id, 'text');
            kinder.push(b);
        }
        const zeigtIn = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.zeigtIn
            : () => true;
        const ortLesbar = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.ortLesbar
            : (o) => !!o;
        const sichtbar = kinder.filter((b) => zeigtIn(b, wo) && !(wo === 'flaeche' && ortLesbar(b.flaecheOrt)));
        let nr = 0;
        sichtbar.forEach((b) => {
            if (b.type === 'number')
                nr++;
            else
                nr = 0;
            wrap.appendChild(Blocks.render(b, 0, nr));
        });
        if (!p.ohneRueck && wo === 'seite')
            Links.fusszeile(p, wrap);
    };
    return { binde, zeichne, leer, streifen: streifenZeichnen };
})();
window.Inhaltsflaeche = Inhaltsflaeche;
