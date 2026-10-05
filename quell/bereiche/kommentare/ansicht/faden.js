"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/kommentare/ansicht/faden.ts (npm run bauen:ts). */
const Kommentare = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const alle = (pageId) => {
        const out = [];
        const lauf = (id, tiefe) => {
            Store.childrenOf(id).forEach((b) => {
                (b.kommentare || []).forEach((k) => out.push({ block: b, k }));
                if (tiefe < 12)
                    lauf(b.id, tiefe + 1);
            });
        };
        lauf(pageId, 0);
        return out;
    };
    const offeneAnzahl = (pageId) => alle(pageId).filter(x => !x.k.erledigt).length;
    const neu = async (block, zitat = '') => {
        const text = await UI.frage('Kommentar' + (zitat ? ' zu „' + zitat.slice(0, 40) + '"' : ''), '');
        if (!text)
            return;
        const liste = block.kommentare ? block.kommentare.slice() : [];
        liste.push({
            id: Store.uid(), text, zitat: zitat.slice(0, 120),
            autor: Store.getMeta('nutzer', 'Ich'), zeit: Store.now(), erledigt: false,
            antworten: [], reaktionen: {}
        });
        Store.updateBlock(block.id, { kommentare: liste });
        App.zeichneSeite();
        UI.toast('Kommentar hinzugefügt');
    };
    const REAKTIONEN = ['👍', '🎉', '👀', '❤️', '🤔', '✅'];
    const finde = (blockId, kommId) => {
        const b = Store.getBlock(blockId);
        if (!b)
            return null;
        const liste = (b.kommentare || []).slice();
        const i = liste.findIndex((x) => x.id === kommId);
        return i < 0 ? null : { block: b, liste, i, komm: liste[i] };
    };
    const antworten = async (blockId, kommId) => {
        const f = finde(blockId, kommId);
        if (!f)
            return false;
        const text = await UI.frage('Antwort auf „' + String(f.komm.text).slice(0, 40) + '"', '');
        if (!text)
            return false;
        f.komm.antworten = (f.komm.antworten || []).concat([{
                id: Store.uid(), text, autor: Store.getMeta('nutzer', 'Ich'), zeit: Store.now()
            }]);
        Store.updateBlock(blockId, { kommentare: f.liste });
        return true;
    };
    const antwortWeg = (blockId, kommId, antwortId) => {
        const f = finde(blockId, kommId);
        if (!f)
            return false;
        f.komm.antworten = (f.komm.antworten || []).filter((a) => a.id !== antwortId);
        Store.updateBlock(blockId, { kommentare: f.liste });
        return true;
    };
    const reagieren = (blockId, kommId, emoji) => {
        const f = finde(blockId, kommId);
        if (!f)
            return null;
        const wer = Store.getMeta('nutzer', 'Ich');
        const r = Object.assign({}, f.komm.reaktionen || {});
        const leute = (r[emoji] || []).slice();
        const i = leute.indexOf(wer);
        if (i >= 0)
            leute.splice(i, 1);
        else
            leute.push(wer);
        if (leute.length)
            r[emoji] = leute;
        else
            delete r[emoji];
        f.komm.reaktionen = r;
        Store.updateBlock(blockId, { kommentare: f.liste });
        return r;
    };
    const erwaehnt = (text) => {
        const raus = [];
        String(text || '').replace(/@([A-Za-zÄÖÜäöüß0-9_.\-]{2,})/g, (ganz, n) => { raus.push(n); return ganz; });
        return [...new Set(raus)];
    };
    const mitErwaehnungen = (text) => esc(text).replace(/@([A-Za-zÄÖÜäöüß0-9_.\-]{2,})/g, (_ganz, n) => {
        const seite = Object.values(Store.cache.blocks).find(b => b.alive !== false && b.type === 'page' &&
            String(b.text || '').toLowerCase() === n.toLowerCase());
        return seite
            ? `<a class="komm-erw" data-seite="${seite.id}">@${esc(n)}</a>`
            : `<span class="komm-erw tot">@${esc(n)}</span>`;
    });
    const anMich = () => {
        const wer = String(Store.getMeta('nutzer', 'Ich')).toLowerCase();
        const raus = [];
        Object.values(Store.cache.blocks).forEach(b => {
            if (b.alive === false)
                return;
            (b.kommentare || []).forEach((k) => {
                if (k.erledigt)
                    return;
                if (erwaehnt(k.text).some((n) => n.toLowerCase() === wer))
                    raus.push({ block: b, k });
            });
        });
        return raus;
    };
    const panel = (pageId) => {
        const liste = alle(pageId);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(620px,94vw)">' +
                `<div class="fh">💬 Kommentare <em>${liste.length}</em>` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res">' +
                (liste.length ? liste.map(({ block, k }) => `<div class="komm ${k.erledigt ? 'fertig' : ''}" data-b="${block.id}" data-k="${k.id}">` +
                    (k.zitat ? `<div class="komm-zitat">„${esc(k.zitat)}"</div>` : '') +
                    `<div class="komm-txt">${mitErwaehnungen(k.text)}</div>` +
                    '<div class="komm-reak">' + REAKTIONEN.map(r => {
                    const n = ((k.reaktionen || {})[r] || []).length;
                    return `<button data-r="${r}" class="${n ? 'an' : ''}" ` +
                        `title="${n ? ((k.reaktionen || {})[r] || []).join(', ') : 'Reagieren'}">` +
                        `${r}${n ? ' ' + n : ''}</button>`;
                }).join('') + '</div>' +
                    `<div class="komm-fuss">${esc(k.autor)} · ${esc(Werkzeuge.zeitKurz(k.zeit))}` +
                    `<button data-a="antwort">Antworten</button>` +
                    `<button data-a="springen">Zur Stelle</button>` +
                    `<button data-a="fertig">${k.erledigt ? 'Wieder öffnen' : 'Erledigt'}</button>` +
                    `<button data-a="del">Löschen</button></div>` +
                    ((k.antworten || []).length
                        ? '<div class="komm-faden">' + k.antworten.map((a) => `<div class="komm-antwort" data-antwort="${a.id}">` +
                            `<div class="komm-txt">${mitErwaehnungen(a.text)}</div>` +
                            `<div class="komm-fuss">${esc(a.autor)} · ${esc(Werkzeuge.zeitKurz(a.zeit))}` +
                            '<button data-a="antwort-weg">Löschen</button></div></div>').join('') +
                            '</div>'
                        : '') +
                    '</div>').join('')
                    : '<div style="padding:18px; color:var(--text-faint); font-size:14px">Noch keine Kommentare. ' +
                        'Text markieren und auf 💬 klicken. Mit <b>@Name</b> verweist du auf eine Seite.</div>') +
                '</div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const erw = elVon(e)?.closest('.komm-erw[data-seite]');
            if (erw) {
                o.remove();
                App.oeffne(erw.dataset.seite);
                return;
            }
            const box = elVon(e)?.closest('.komm');
            if (!box)
                return;
            const block = Store.getBlock(box.dataset['b']);
            if (!block)
                return;
            const kommId = box.dataset['k'];
            if (!kommId)
                return;
            const r = elVon(e)?.closest('[data-r]');
            if (r?.dataset['r']) {
                reagieren(block.id, kommId, r.dataset['r']);
                o.remove();
                panel(pageId);
                return;
            }
            if (elVon(e)?.closest('[data-a="antwort"]')) {
                antworten(block.id, kommId).then(gut => {
                    if (!gut)
                        return;
                    o.remove();
                    panel(pageId);
                    App.zeichneSeite();
                });
                return;
            }
            const aw = elVon(e)?.closest('[data-a="antwort-weg"]');
            if (aw) {
                const zeile = elVon(e)?.closest('[data-antwort]');
                const antwortId = zeile?.dataset['antwort'];
                if (!antwortId)
                    return;
                antwortWeg(block.id, kommId, antwortId);
                o.remove();
                panel(pageId);
                return;
            }
            const liste2 = (block.kommentare || []).slice();
            const idx = liste2.findIndex((x) => x.id === box.dataset.k);
            if (elVon(e)?.closest('[data-a="fertig"]')) {
                liste2[idx].erledigt = !liste2[idx].erledigt;
                Store.updateBlock(block.id, { kommentare: liste2 });
                o.remove();
                panel(pageId);
                App.zeichneSeite();
            }
            if (elVon(e)?.closest('[data-a="del"]')) {
                liste2.splice(idx, 1);
                Store.updateBlock(block.id, { kommentare: liste2 });
                o.remove();
                panel(pageId);
                App.zeichneSeite();
            }
            if (elVon(e)?.closest('[data-a="springen"]')) {
                o.remove();
                const el = document.querySelector(`[data-bid="${block.id}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('blitz');
                    setTimeout(() => el.classList.remove('blitz'), 1400);
                }
            }
        });
    };
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return { alle, offeneAnzahl, neu, panel, antworten, antwortWeg, reagieren,
        erwaehnt, mitErwaehnungen, anMich, finde, REAKTIONEN };
})();
window.Kommentare = Kommentare;
if (typeof Register !== 'undefined' && Register.kontext) {
    Register.kontext.melde({
        bereich: 'editor', id: 'kommentare', name: 'Kommentare',
        zeichen: 'comment', rang: 50,
        zeigen: () => { try {
            return !!App.aktuelleSeite();
        }
        catch {
            return false;
        } },
        tun: () => {
            try {
                Kommentare.panel(App.aktuelleSeite());
            }
            catch { }
        }
    });
}
