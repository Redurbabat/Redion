"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/reiter.ts (npm run bauen:ts). */
const Fenster = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let reiter = [];
    let aktiv = 0;
    let stumm = false;
    let bereit = false;
    const lesen = () => {
        const g = Store.getMeta('reiter', null);
        if (g && Array.isArray(g.liste) && g.liste.length) {
            reiter = g.liste.filter((t) => Store.getBlock(t.id));
            aktiv = Math.min(g.aktiv || 0, Math.max(0, reiter.length - 1));
        }
        if (!reiter.length) {
            const s = App.aktuelleSeite();
            reiter = s ? [{ id: s }] : [];
            aktiv = 0;
        }
    };
    const sichern = () => Store.setMeta('reiter', { liste: reiter, aktiv });
    const titelVon = (id) => {
        const b = Store.getBlock(id);
        if (!b)
            return 'Weg';
        return (b.icon ? b.icon + ' ' : '') + (b.text || 'Ohne Titel');
    };
    const zeichnen = () => {
        let leiste = document.getElementById('reiterleiste');
        if (!leiste) {
            leiste = document.createElement('div');
            leiste.id = 'reiterleiste';
            leiste.setAttribute('role', 'tablist');
            const main = document.getElementById('main');
            if (!main)
                return;
            main.insertBefore(leiste, document.getElementById('topbar'));
        }
        const dokument = !!Store.getBlock(App.aktuelleSeite())?.dokumentModus;
        if (Store.getMeta('reiterAn', true) === false || (reiter.length < 2 && !dokument)) {
            leiste.style.display = 'none';
            if (reiter.length < 2)
                leiste.innerHTML = '';
            return;
        }
        leiste.style.display = '';
        leiste.innerHTML = reiter.map((t, i) => `<div class="rt-tab${i === aktiv ? ' an' : ''}" data-i="${i}" role="tab" ` +
            `aria-selected="${i === aktiv}" draggable="true" title="${esc(titelVon(t.id))}">` +
            `<span>${esc(titelVon(t.id))}</span>` +
            `<button type="button" data-zu="${i}" aria-label="${esc(titelVon(t.id))} schliessen" ` +
            `title="Reiter schliessen (Strg + Alt + W)">✕</button></div>`).join('') +
            '<button type="button" class="rt-plus" aria-label="Neuer Reiter" ' +
            'title="Neuer Reiter (Strg + Alt + N)">＋</button>';
        const an = leiste.querySelector('.rt-tab.an');
        if (an) {
            const tr = an.getBoundingClientRect();
            const lr = leiste.getBoundingClientRect();
            if (tr.left < lr.left)
                leiste.scrollLeft += tr.left - lr.left - 8;
            else if (tr.right > lr.right)
                leiste.scrollLeft += tr.right - lr.right + 8;
        }
    };
    const wechseln = (i) => {
        if (i < 0 || i >= reiter.length)
            return;
        aktiv = i;
        sichern();
        stumm = true;
        App.oeffne(reiter[i]?.id);
        stumm = false;
        zeichnen();
    };
    const neuerReiter = (id) => {
        const ziel = id || App.aktuelleSeite();
        if (!ziel) {
            UI.toast('Erst eine Seite öffnen');
            return;
        }
        reiter.splice(aktiv + 1, 0, { id: ziel });
        aktiv++;
        sichern();
        stumm = true;
        App.oeffne(ziel);
        stumm = false;
        zeichnen();
        UI.toast('Neuer Reiter — Strg + Tab wechselt');
    };
    const schliessen = (i) => {
        if (reiter.length <= 1) {
            UI.toast('Der letzte Reiter bleibt offen');
            return;
        }
        reiter.splice(i, 1);
        if (aktiv >= reiter.length)
            aktiv = reiter.length - 1;
        else if (i < aktiv)
            aktiv--;
        sichern();
        wechseln(aktiv);
    };
    const istDokument = (id) => !!(id && Store.getBlock(id)?.dokumentModus);
    const gemerkt = (id) => {
        if (!bereit || stumm || !id)
            return;
        if (!reiter.length) {
            reiter = [{ id }];
            aktiv = 0;
            sichern();
            zeichnen();
            return;
        }
        const schon = reiter.findIndex(t => t.id === id);
        if (schon >= 0) {
            aktiv = schon;
            sichern();
            zeichnen();
            return;
        }
        if (istDokument(reiter[aktiv]?.id ?? '')) {
            reiter.splice(++aktiv, 0, { id });
        }
        else
            reiter[aktiv] = { id };
        sichern();
        zeichnen();
    };
    let geteilt = null;
    const teilen = (id, richtung) => {
        const ziel = id || App.aktuelleSeite();
        if (!ziel)
            return;
        geteilt = { id: ziel, richtung: richtung || 'quer',
            anteil: (geteilt && geteilt.anteil) || 50 };
        Store.setMeta('geteilt', geteilt);
        zeichneTeil();
    };
    const teilenAus = () => {
        geteilt = null;
        Store.setMeta('geteilt', null);
        document.getElementById('teil')?.remove();
        document.getElementById('main')?.classList.remove('geteilt', 'hoch');
    };
    const zweiteSeite = (wrap, id) => {
        const p = Store.getBlock(id);
        wrap.innerHTML = '';
        if (!p) {
            wrap.innerHTML = '<div class="db-leer">Diese Seite gibt es nicht mehr.</div>';
            return;
        }
        const pfad = Store.pathOf(id);
        const kopf = document.createElement('div');
        kopf.className = 'teil-kopf';
        kopf.innerHTML =
            `<div class="teil-pfad">${pfad.map((x) => esc(x.text || 'Ohne Titel')).join(' / ')}</div>` +
                '<button data-a="tausch" title="Mit der linken Seite tauschen">⇄</button>' +
                '<button data-a="richtung" title="Nebeneinander oder übereinander">⊞</button>' +
                '<button data-a="voll" title="Nur diese Seite zeigen">⤢</button>' +
                '<button data-a="zu" title="Teilung aufheben">✕</button>';
        kopf.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-a]');
            const g = geteilt;
            if (!b || !g)
                return;
            if (b.dataset['a'] === 'zu') {
                teilenAus();
                return;
            }
            if (b.dataset['a'] === 'voll') {
                const z = g.id;
                teilenAus();
                App.oeffne(z);
                return;
            }
            if (b.dataset['a'] === 'tausch') {
                const links = App.aktuelleSeite();
                teilen(links, g.richtung);
                App.oeffne(id);
                return;
            }
            if (b.dataset['a'] === 'richtung') {
                g.richtung = g.richtung === 'quer' ? 'hoch' : 'quer';
                Store.setMeta('geteilt', g);
                zeichneTeil();
            }
        });
        wrap.appendChild(kopf);
        const innen = document.createElement('div');
        innen.className = 'teil-inhalt';
        const titel = document.createElement('div');
        titel.className = 'seiten-titel';
        titel.textContent = (p.icon ? p.icon + ' ' : '') + (p.text || 'Ohne Titel');
        titel.addEventListener('click', () => App.oeffne(id));
        innen.appendChild(titel);
        let nr = 0;
        Store.childrenOf(p.id).forEach((b) => {
            if (b.type === 'number') {
                nr++;
                b.nr = nr;
            }
            else
                nr = 0;
            innen.appendChild(Blocks.render(b));
        });
        wrap.appendChild(innen);
        if (Blocks.bindeEditor)
            Blocks.bindeEditor(innen);
    };
    const zeichneTeil = () => {
        const g = geteilt;
        if (!g) {
            document.getElementById('teil')?.remove();
            return;
        }
        const main = document.getElementById('main');
        if (!main)
            return;
        let t = document.getElementById('teil');
        if (!t) {
            const neu = document.createElement('div');
            t = neu;
            neu.id = 'teil';
            neu.innerHTML = '<div class="teil-griff" title="Ziehen ändert die Breite"></div>' +
                '<div class="teil-seite"></div>';
            main.appendChild(neu);
            neu.querySelector('.teil-griff')?.addEventListener('pointerdown', ev => {
                ev.preventDefault();
                const quer = g.richtung === 'quer';
                const kasten = main.getBoundingClientRect();
                const zug = (e2) => {
                    const p2 = quer
                        ? (kasten.right - e2.clientX) / kasten.width * 100
                        : (kasten.bottom - e2.clientY) / kasten.height * 100;
                    g.anteil = Math.max(20, Math.min(80, p2));
                    neu.style.flexBasis = g.anteil + '%';
                };
                const stop = () => {
                    removeEventListener('pointermove', zug);
                    removeEventListener('pointerup', stop);
                    Store.setMeta('geteilt', g);
                };
                addEventListener('pointermove', zug);
                addEventListener('pointerup', stop);
            });
        }
        main.classList.add('geteilt');
        main.classList.toggle('hoch', g.richtung === 'hoch');
        t.style.flexBasis = (g.anteil || 50) + '%';
        const seite = t.querySelector('.teil-seite');
        if (seite)
            zweiteSeite(seite, g.id);
    };
    let schweb = null;
    let uhr;
    const vorschauZu = () => {
        clearTimeout(uhr);
        schweb?.remove();
        schweb = null;
    };
    const vorschauZeigen = (el, id) => {
        const p = Store.getBlock(id);
        if (!p)
            return;
        vorschauZu();
        const kinder = Store.childrenOf(id).slice(0, 6);
        const text = kinder.map((k) => (k.text || '').trim()).filter(Boolean).slice(0, 4);
        const pfad = Store.pathOf(id).slice(0, -1).map((x) => x.text || '…').join(' / ');
        schweb = document.createElement('div');
        schweb.className = 'linkvorschau';
        schweb.innerHTML =
            `<div class="lv-titel">${p.icon ? esc(p.icon) + ' ' : ''}${esc(p.text || 'Ohne Titel')}</div>` +
                (pfad ? `<div class="lv-pfad">${esc(pfad)}</div>` : '') +
                (text.length
                    ? '<div class="lv-text">' + text.map((t) => `<p>${esc(t.slice(0, 140))}</p>`).join('') + '</div>'
                    : '<div class="lv-text lv-leer">Diese Seite ist noch leer.</div>') +
                `<div class="lv-fuss">${Store.childrenOf(id).length} Blöcke · ` +
                'Klicken öffnet · Shift + Klick teilt die Ansicht</div>';
        document.body.appendChild(schweb);
        const r = el.getBoundingClientRect();
        const b = schweb.getBoundingClientRect();
        let links = r.left;
        let oben = r.bottom + 6;
        if (links + b.width > innerWidth - 10)
            links = Math.max(10, innerWidth - b.width - 10);
        if (oben + b.height > innerHeight - 10)
            oben = Math.max(10, r.top - b.height - 6);
        schweb.style.left = links + 'px';
        schweb.style.top = oben + 'px';
        schweb.addEventListener('mouseenter', () => clearTimeout(uhr));
        schweb.addEventListener('mouseleave', vorschauZu);
    };
    const idVon = (el) => {
        const a = el?.closest('[data-seite], [data-id]');
        if (!a)
            return null;
        return a.dataset["seite"] || a.dataset["id"] || null;
    };
    const vorschauBinden = () => {
        document.addEventListener('mouseover', e => {
            if (Store.getMeta('linkvorschau', true) === false)
                return;
            const el = elVon(e)?.closest('[data-seite], .pageref, .seiten-link, #tree [data-id]');
            if (!el)
                return;
            const id = idVon(el);
            if (!id || !Store.getBlock(id))
                return;
            clearTimeout(uhr);
            uhr = setTimeout(() => vorschauZeigen(el, id), 420);
            el.addEventListener('mouseleave', () => { clearTimeout(uhr); uhr = setTimeout(vorschauZu, 220); }, { once: true });
        });
        document.addEventListener('click', e => {
            if (!e.shiftKey)
                return;
            const el = elVon(e)?.closest('[data-seite], .pageref, .seiten-link, #tree [data-id]');
            if (!el)
                return;
            const id = idVon(el);
            if (!id || !Store.getBlock(id))
                return;
            e.preventDefault();
            e.stopPropagation();
            vorschauZu();
            teilen(id, 'quer');
            UI.toast('Rechts geöffnet');
        }, true);
    };
    const tasten = (e) => {
        const strg = e.ctrlKey || e.metaKey;
        if (!strg)
            return;
        const feld = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const tippt = feld && (feld.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(feld.tagName));
        if (e.key === 'Tab' && reiter.length > 1) {
            e.preventDefault();
            wechseln(e.shiftKey ? (aktiv - 1 + reiter.length) % reiter.length : (aktiv + 1) % reiter.length);
            return;
        }
        if (e.altKey && e.key.toLowerCase() === 'n' && !e.shiftKey) {
            e.preventDefault();
            neuerReiter();
            return;
        }
        if (e.altKey && e.key.toLowerCase() === 'w' && !e.shiftKey) {
            e.preventDefault();
            schliessen(aktiv);
            return;
        }
        if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            geteilt ? teilenAus() : teilen(App.aktuelleSeite(), 'quer');
            return;
        }
        if (!tippt && !e.shiftKey && !e.altKey && /^[1-9]$/.test(e.key) && reiter.length > 1) {
            e.preventDefault();
            wechseln(Math.min(+e.key - 1, reiter.length - 1));
        }
    };
    const start = () => {
        lesen();
        bereit = true;
        const jetzt = App.aktuelleSeite();
        if (jetzt && reiter[aktiv] && reiter[aktiv]?.id !== jetzt) {
            const schon = reiter.findIndex(t => t.id === jetzt);
            if (schon >= 0)
                aktiv = schon;
            else {
                reiter[aktiv] = { id: jetzt };
            }
            sichern();
        }
        zeichnen();
        const g = Store.getMeta('geteilt', null);
        if (g && Store.getBlock(g.id)) {
            geteilt = g;
            zeichneTeil();
        }
        document.addEventListener('keydown', tasten);
        vorschauBinden();
        document.getElementById('reiterleiste')?.addEventListener('click', e => {
            const zu = elVon(e)?.closest('[data-zu]');
            if (zu?.dataset["zu"]) {
                e.stopPropagation();
                schliessen(+zu.dataset["zu"]);
                return;
            }
            if (elVon(e)?.closest('.rt-plus')) {
                neuerReiter();
                return;
            }
            const t = elVon(e)?.closest('[data-i]');
            if (t?.dataset["i"])
                wechseln(+t.dataset["i"]);
        });
        let zieht = null;
        document.getElementById('reiterleiste')?.addEventListener('dragstart', e => {
            const t = elVon(e)?.closest('[data-i]');
            if (t?.dataset["i"])
                zieht = +t.dataset["i"];
        });
        document.getElementById('reiterleiste')?.addEventListener('dragover', e => e.preventDefault());
        document.getElementById('reiterleiste')?.addEventListener('drop', e => {
            const t = elVon(e)?.closest('[data-i]');
            if (!t || zieht === null)
                return;
            const nach = +(t.dataset["i"] ?? 0);
            const [x] = reiter.splice(zieht, 1);
            if (!x)
                return;
            reiter.splice(nach, 0, x);
            aktiv = nach;
            zieht = null;
            sichern();
            zeichnen();
        });
    };
    return { start, zeichnen, gemerkt, neuerReiter, schliessen, wechseln,
        teilen, teilenAus, zeichneTeil, vorschauZeigen, vorschauZu,
        reiter: () => reiter, aktiv: () => aktiv, geteilt: () => geteilt };
})();
window.Fenster = Fenster;
