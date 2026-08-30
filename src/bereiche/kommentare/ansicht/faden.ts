/* ============================================================================
 * apps/schreiben/kommentare/ansicht.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/kommentare/ansicht/faden.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/kommentare/ansicht/faden.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Kommentare = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const alle = (pageId: string): { block: any; k: any }[] => {
    const out: { block: any; k: any }[] = [];
    const lauf = (id: string, tiefe: number): void => {
      Store.childrenOf(id).forEach((b: any) => {
        (b.kommentare || []).forEach((k: any) => out.push({ block: b, k }));
        if (tiefe < 12) lauf(b.id, tiefe + 1);
      });
    };
    lauf(pageId, 0);
    return out;
  };

  const offeneAnzahl = (pageId: any) => alle(pageId).filter(x => !x.k.erledigt).length;

  const neu = async (block: any, zitat = ''): Promise<void> => {
    const text = await UI.frage('Kommentar' + (zitat ? ' zu „' + zitat.slice(0, 40) + '"' : ''), '');
    if (!text) return;
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

  /* ------------------------------------------------------------------------
   * ANTWORTEN, REAKTIONEN, ERWÄHNUNGEN
   * ------------------------------------------------------------------------
   * Notion hat Threads mit Antworten und Emoji-Reaktionen. Bisher war hier
   * jeder Kommentar für sich allein — das holt es nach.
   * ---------------------------------------------------------------------- */
  const REAKTIONEN = ['👍', '🎉', '👀', '❤️', '🤔', '✅'];

  /** Einen Kommentar in seiner Liste finden. */
  const finde = (blockId: string, kommId: string) => {
    const b = Store.getBlock(blockId);
    if (!b) return null;
    const liste = (b.kommentare || []).slice();
    const i = liste.findIndex((x: any) => x.id === kommId);
    return i < 0 ? null : { block: b, liste, i, komm: liste[i] };
  };

  const antworten = async (blockId: string, kommId: string): Promise<boolean> => {
    const f = finde(blockId, kommId);
    if (!f) return false;
    const text = await UI.frage('Antwort auf „' + String(f.komm.text).slice(0, 40) + '"', '');
    if (!text) return false;
    f.komm.antworten = (f.komm.antworten || []).concat([{
      id: Store.uid(), text, autor: Store.getMeta('nutzer', 'Ich'), zeit: Store.now()
    }]);
    Store.updateBlock(blockId, { kommentare: f.liste });
    return true;
  };

  const antwortWeg = (blockId: string, kommId: string, antwortId: string): boolean => {
    const f = finde(blockId, kommId);
    if (!f) return false;
    f.komm.antworten = (f.komm.antworten || []).filter((a: any) => a.id !== antwortId);
    Store.updateBlock(blockId, { kommentare: f.liste });
    return true;
  };

  /** Eine Reaktion an- oder abwählen. */
  const reagieren = (blockId: string, kommId: string, emoji: string): Record<string, string[]> | null => {
    const f = finde(blockId, kommId);
    if (!f) return null;
    const wer = Store.getMeta('nutzer', 'Ich');
    const r = Object.assign({}, f.komm.reaktionen || {});
    const leute = (r[emoji] || []).slice();
    const i = leute.indexOf(wer);
    if (i >= 0) leute.splice(i, 1); else leute.push(wer);
    if (leute.length) r[emoji] = leute; else delete r[emoji];
    f.komm.reaktionen = r;
    Store.updateBlock(blockId, { kommentare: f.liste });
    return r;
  };

  /** Wer wird in einem Kommentar erwähnt? @Name oder @@Seitentitel. */
  const erwaehnt = (text: unknown): string[] => {
    const raus: any[] = [];
    String(text || '').replace(/@([A-Za-zÄÖÜäöüß0-9_.\-]{2,})/g, (ganz: string, n: string) => { raus.push(n); return ganz; });
    return [...new Set(raus)];
  };

  /** Erwähnungen als Link auf die gleichnamige Seite anzeigen. */
  const mitErwaehnungen = (text: unknown): string =>
    esc(text).replace(/@([A-Za-zÄÖÜäöüß0-9_.\-]{2,})/g, (_ganz: string, n: string) => {
      const seite = Object.values<any>(Store.cache.blocks).find(b =>
        b.alive !== false && b.type === 'page' &&
        String(b.text || '').toLowerCase() === n.toLowerCase());
      return seite
        ? `<a class="komm-erw" data-seite="${seite.id}">@${esc(n)}</a>`
        : `<span class="komm-erw tot">@${esc(n)}</span>`;
    });

  /** Alle Kommentare, in denen jemand vorkommt — für den Posteingang. */
  const anMich = (): { block: any; k: any }[] => {
    const wer = String(Store.getMeta('nutzer', 'Ich')).toLowerCase();
    const raus: any[] = [];
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (b.alive === false) return;
      (b.kommentare || []).forEach((k: any) => {
        if (k.erledigt) return;
        if (erwaehnt(k.text).some((n: string) => n.toLowerCase() === wer))
          raus.push({ block: b, k });
      });
    });
    return raus;
  };

  const panel = (pageId: string): void => {
    const liste = alle(pageId);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(620px,94vw)">' +
        `<div class="fh">💬 Kommentare <em>${liste.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res">' +
          (liste.length ? liste.map(({ block, k }) =>
            `<div class="komm ${k.erledigt ? 'fertig' : ''}" data-b="${block.id}" data-k="${k.id}">` +
              (k.zitat ? `<div class="komm-zitat">„${esc(k.zitat)}"</div>` : '') +
              `<div class="komm-txt">${mitErwaehnungen(k.text)}</div>` +
              /* Reaktionen — angeklickte sind hervorgehoben */
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
              /* Der Faden darunter */
              ((k.antworten || []).length
                ? '<div class="komm-faden">' + k.antworten.map((a: any) =>
                    `<div class="komm-antwort" data-antwort="${a.id}">` +
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
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      /* Erwähnung öffnet die Seite */
      const erw = elVon(e)?.closest<HTMLElement>('.komm-erw[data-seite]');
      if (erw) { o.remove(); App.oeffne(erw.dataset.seite); return; }

      const box = elVon(e)?.closest<HTMLElement>('.komm');
      if (!box) return;
      const block = Store.getBlock(box.dataset['b']);
      if (!block) return;

      /* Die Kennung des angeklickten Kommentars. Sie steht in jedem Zweig
         unten und war überall ungeprüft: ein `.komm` ohne `data-k` — den
         gibt es beim Zeichnen für einen Augenblick — hätte `reagieren`,
         `antworten` und `antwortWeg` mit `undefined` gerufen, und die
         suchen dann einen Kommentar, den es nicht gibt. */
      const kommId = box.dataset['k'];
      if (!kommId) return;

      /* Reaktion */
      const r = elVon(e)?.closest<HTMLElement>('[data-r]');
      if (r?.dataset['r']) {
        reagieren(block.id, kommId, r.dataset['r']);
        o.remove(); panel(pageId);
        return;
      }
      /* Antworten */
      if (elVon(e)?.closest<HTMLElement>('[data-a="antwort"]')) {
        antworten(block.id, kommId).then(gut => {
          if (!gut) return;
          o.remove(); panel(pageId); App.zeichneSeite();
        });
        return;
      }
      const aw = elVon(e)?.closest<HTMLElement>('[data-a="antwort-weg"]');
      if (aw) {
        const zeile = elVon(e)?.closest<HTMLElement>('[data-antwort]');
        const antwortId = zeile?.dataset['antwort'];
        if (!antwortId) return;
        antwortWeg(block.id, kommId, antwortId);
        o.remove(); panel(pageId);
        return;
      }

      const liste2 = (block.kommentare || []).slice();
      const idx = liste2.findIndex((x: any) => x.id === box.dataset.k);
      if (elVon(e)?.closest<HTMLElement>('[data-a="fertig"]')) {
        liste2[idx].erledigt = !liste2[idx].erledigt;
        Store.updateBlock(block.id, { kommentare: liste2 });
        o.remove(); panel(pageId); App.zeichneSeite();
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="del"]')) {
        liste2.splice(idx, 1);
        Store.updateBlock(block.id, { kommentare: liste2 });
        o.remove(); panel(pageId); App.zeichneSeite();
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="springen"]')) {
        o.remove();
        const el = document.querySelector(`[data-bid="${block.id}"]`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('blitz');
                  setTimeout(() => el.classList.remove('blitz'), 1400); }
      }
    });
  };

  const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return { alle, offeneAnzahl, neu, panel, antworten, antwortWeg, reagieren,
           erwaehnt, mitErwaehnungen, anMich, finde, REAKTIONEN };
})();
(window as any).Kommentare = Kommentare;


/* ==========================================================================
 * 5. MEHRFACHAUSWAHL VON BLÖCKEN
 * ========================================================================*/

/* Die Kommentare melden sich für die Kontextkante an (E272 Phase F).
   `panel()` ist derselbe Griff wie im Menüband und in der Kopfzeile. */
if (typeof Register !== 'undefined' && (Register as any).kontext) {
  (Register as any).kontext.melde({
    bereich: 'editor', id: 'kommentare', name: 'Kommentare',
    zeichen: 'comment', rang: 50,
    zeigen: () => { try { return !!App.aktuelleSeite(); } catch { return false; } },
    tun: () => {
      try { Kommentare.panel(App.aktuelleSeite()); }
      catch { /* ohne offene Seite gibt es nichts zu kommentieren */ }
    }
  });
}
