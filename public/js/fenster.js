/* ============================================================================
 * fenster.js — Reiter, geteilte Ansicht und Linkvorschau
 * ----------------------------------------------------------------------------
 * Drei Dinge, die man an Notion am Windows-PC vermisst:
 *
 *   REITER — Notions Desktop-App hat sie erst seit 2023 und nur dort. Hier
 *     gibt es sie überall, auch im Browser: Strg+T neuer Reiter, Strg+W zu,
 *     Strg+Tab weiter, Strg+1…9 direkt hin. Sie überleben den Neustart.
 *
 *   GETEILTE ANSICHT — zwei Seiten nebeneinander, die Trennlinie lässt sich
 *     ziehen. In Notion geht das nur in der Desktop-App und nur zu zweit;
 *     hier auch untereinander.
 *
 *   LINKVORSCHAU — über einem Seitenlink erscheint nach kurzem Verweilen
 *     eine Karte mit Titel, Pfad und den ersten Zeilen. Notion zeigt beim
 *     Überfahren gar nichts.
 * ==========================================================================*/

const Fenster = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ========================================================================
   * REITER
   * ======================================================================*/
  let reiter = [];        /* [{ id, titel }] */
  let aktiv  = 0;
  let stumm  = false;     /* verhindert Rückkopplung beim eigenen Öffnen */
  let bereit = false;     /* vor start() nichts überschreiben */

  const lesen = () => {
    const g = Store.getMeta('reiter', null);
    if (g && Array.isArray(g.liste) && g.liste.length) {
      reiter = g.liste.filter(t => Store.getBlock(t.id));
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
    if (!b) return 'Weg';
    return (b.icon ? b.icon + ' ' : '') + (b.text || 'Ohne Titel');
  };

  const zeichnen = () => {
    let leiste = document.getElementById('reiterleiste');
    if (!leiste) {
      leiste = document.createElement('div');
      leiste.id = 'reiterleiste';
      leiste.setAttribute('role', 'tablist');
      const main = document.getElementById('main');
      main.insertBefore(leiste, document.getElementById('topbar'));
    }
    /* Ein einzelner Reiter ohne Nutzen wird nicht gezeigt. */
    if (Store.getMeta('reiterAn', true) === false || reiter.length < 2) {
      leiste.style.display = 'none';
      if (reiter.length < 2) leiste.innerHTML = '';
      return;
    }
    leiste.style.display = '';
    leiste.innerHTML = reiter.map((t, i) =>
      `<div class="rt-tab${i === aktiv ? ' an' : ''}" data-i="${i}" role="tab" ` +
      `draggable="true" title="${esc(titelVon(t.id))}">` +
      `<span>${esc(titelVon(t.id))}</span>` +
      `<button data-zu="${i}" title="Reiter schliessen (Strg + W)">✕</button></div>`).join('') +
      '<button class="rt-plus" title="Neuer Reiter (Strg + T)">＋</button>';
  };

  const wechseln = (i) => {
    if (i < 0 || i >= reiter.length) return;
    aktiv = i;
    sichern();
    stumm = true;
    App.oeffne(reiter[i].id);
    stumm = false;
    zeichnen();
  };

  const neuerReiter = (id) => {
    const ziel = id || App.aktuelleSeite();
    if (!ziel) { UI.toast('Erst eine Seite öffnen'); return; }
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
    if (reiter.length <= 1) { UI.toast('Der letzte Reiter bleibt offen'); return; }
    reiter.splice(i, 1);
    if (aktiv >= reiter.length) aktiv = reiter.length - 1;
    else if (i < aktiv) aktiv--;
    sichern();
    wechseln(aktiv);
  };

  /** App.oeffne meldet sich hier: der aktive Reiter zeigt jetzt woandershin. */
  const gemerkt = (id) => {
    /* Beim Hochfahren öffnet die App die zuletzt gesehene Seite, bevor die
       Reiter gelesen sind. Ohne diese Sperre würde das die Liste löschen. */
    if (!bereit || stumm || !id) return;
    if (!reiter.length) { reiter = [{ id }]; aktiv = 0; }
    else reiter[aktiv] = { id };
    sichern();
    zeichnen();
  };

  /* ========================================================================
   * GETEILTE ANSICHT
   * ======================================================================*/
  let geteilt = null;     /* { id, richtung: 'quer'|'hoch', anteil }        */

  const teilen = (id, richtung) => {
    const ziel = id || App.aktuelleSeite();
    if (!ziel) return;
    geteilt = { id: ziel, richtung: richtung || 'quer',
                anteil: (geteilt && geteilt.anteil) || 50 };
    Store.setMeta('geteilt', geteilt);
    zeichneTeil();
  };

  const teilenAus = () => {
    geteilt = null;
    Store.setMeta('geteilt', null);
    document.getElementById('teil')?.remove();
    document.getElementById('main').classList.remove('geteilt', 'hoch');
  };

  const zweiteSeite = (wrap, id) => {
    const p = Store.getBlock(id);
    wrap.innerHTML = '';
    if (!p) { wrap.innerHTML = '<div class="db-leer">Diese Seite gibt es nicht mehr.</div>'; return; }

    const pfad = Store.pathOf(id);
    const kopf = document.createElement('div');
    kopf.className = 'teil-kopf';
    kopf.innerHTML =
      `<div class="teil-pfad">${pfad.map(x => esc(x.text || 'Ohne Titel')).join(' / ')}</div>` +
      '<button data-a="tausch" title="Mit der linken Seite tauschen">⇄</button>' +
      '<button data-a="richtung" title="Nebeneinander oder übereinander">⊞</button>' +
      '<button data-a="voll" title="Nur diese Seite zeigen">⤢</button>' +
      '<button data-a="zu" title="Teilung aufheben">✕</button>';
    kopf.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'zu')   { teilenAus(); return; }
      if (b.dataset.a === 'voll') { const z = geteilt.id; teilenAus(); App.oeffne(z); return; }
      if (b.dataset.a === 'tausch') {
        const links = App.aktuelleSeite();
        teilen(links, geteilt.richtung);
        App.oeffne(id);
        return;
      }
      if (b.dataset.a === 'richtung') {
        geteilt.richtung = geteilt.richtung === 'quer' ? 'hoch' : 'quer';
        Store.setMeta('geteilt', geteilt);
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
    Store.childrenOf(p.id).forEach(b => {
      if (b.type === 'number') { nr++; b.nr = nr; } else nr = 0;
      innen.appendChild(Blocks.render(b));
    });
    wrap.appendChild(innen);
    if (Blocks.bindeEditor) Blocks.bindeEditor(innen);
  };

  const zeichneTeil = () => {
    if (!geteilt) { document.getElementById('teil')?.remove(); return; }
    const main = document.getElementById('main');
    let t = document.getElementById('teil');
    if (!t) {
      t = document.createElement('div');
      t.id = 'teil';
      t.innerHTML = '<div class="teil-griff" title="Ziehen ändert die Breite"></div>' +
                    '<div class="teil-seite"></div>';
      main.appendChild(t);
      /* Trennlinie ziehen */
      t.querySelector('.teil-griff').addEventListener('pointerdown', ev => {
        ev.preventDefault();
        const quer = geteilt.richtung === 'quer';
        const kasten = main.getBoundingClientRect();
        const zug = (e2) => {
          const p2 = quer
            ? (kasten.right - e2.clientX) / kasten.width * 100
            : (kasten.bottom - e2.clientY) / kasten.height * 100;
          geteilt.anteil = Math.max(20, Math.min(80, p2));
          t.style.flexBasis = geteilt.anteil + '%';
        };
        const stop = () => {
          removeEventListener('pointermove', zug);
          removeEventListener('pointerup', stop);
          Store.setMeta('geteilt', geteilt);
        };
        addEventListener('pointermove', zug);
        addEventListener('pointerup', stop);
      });
    }
    main.classList.add('geteilt');
    main.classList.toggle('hoch', geteilt.richtung === 'hoch');
    t.style.flexBasis = (geteilt.anteil || 50) + '%';
    zweiteSeite(t.querySelector('.teil-seite'), geteilt.id);
  };

  /* ========================================================================
   * LINKVORSCHAU
   * ======================================================================*/
  let schweb = null, uhr = null;

  const vorschauZu = () => {
    clearTimeout(uhr);
    schweb?.remove();
    schweb = null;
  };

  const vorschauZeigen = (el, id) => {
    const p = Store.getBlock(id);
    if (!p) return;
    vorschauZu();
    const kinder = Store.childrenOf(id).slice(0, 6);
    const text = kinder.map(k => (k.text || '').trim()).filter(Boolean).slice(0, 4);
    const pfad = Store.pathOf(id).slice(0, -1).map(x => x.text || '…').join(' / ');

    schweb = document.createElement('div');
    schweb.className = 'linkvorschau';
    schweb.innerHTML =
      `<div class="lv-titel">${p.icon ? esc(p.icon) + ' ' : ''}${esc(p.text || 'Ohne Titel')}</div>` +
      (pfad ? `<div class="lv-pfad">${esc(pfad)}</div>` : '') +
      (text.length
        ? '<div class="lv-text">' + text.map(t => `<p>${esc(t.slice(0, 140))}</p>`).join('') + '</div>'
        : '<div class="lv-text lv-leer">Diese Seite ist noch leer.</div>') +
      `<div class="lv-fuss">${Store.childrenOf(id).length} Blöcke · ` +
      'Klicken öffnet · Shift + Klick teilt die Ansicht</div>';
    document.body.appendChild(schweb);

    const r = el.getBoundingClientRect();
    const b = schweb.getBoundingClientRect();
    let links = r.left;
    let oben  = r.bottom + 6;
    if (links + b.width > innerWidth - 10) links = Math.max(10, innerWidth - b.width - 10);
    if (oben + b.height > innerHeight - 10) oben = Math.max(10, r.top - b.height - 6);
    schweb.style.left = links + 'px';
    schweb.style.top  = oben + 'px';

    schweb.addEventListener('mouseenter', () => clearTimeout(uhr));
    schweb.addEventListener('mouseleave', vorschauZu);
  };

  /** Welche ID steckt hinter dem Element unter dem Zeiger? */
  const idVon = (el) => {
    const a = el.closest('[data-seite], [data-id]');
    if (!a) return null;
    return a.dataset.seite || a.dataset.id || null;
  };

  const vorschauBinden = () => {
    document.addEventListener('mouseover', e => {
      if (Store.getMeta('linkvorschau', true) === false) return;
      const el = e.target.closest('[data-seite], .pageref, .seiten-link, #tree [data-id]');
      if (!el) return;
      const id = idVon(el);
      if (!id || !Store.getBlock(id)) return;
      clearTimeout(uhr);
      uhr = setTimeout(() => vorschauZeigen(el, id), 420);
      el.addEventListener('mouseleave', () => { clearTimeout(uhr); uhr = setTimeout(vorschauZu, 220); },
                          { once: true });
    });
    /* Shift + Klick auf einen Seitenlink teilt die Ansicht. */
    document.addEventListener('click', e => {
      if (!e.shiftKey) return;
      const el = e.target.closest('[data-seite], .pageref, .seiten-link, #tree [data-id]');
      if (!el) return;
      const id = idVon(el);
      if (!id || !Store.getBlock(id)) return;
      e.preventDefault(); e.stopPropagation();
      vorschauZu();
      teilen(id, 'quer');
      UI.toast('Rechts geöffnet');
    }, true);
  };

  /* ========================================================================
   * TASTEN
   * ======================================================================*/
  const tasten = (e) => {
    const strg = e.ctrlKey || e.metaKey;
    if (!strg) return;
    const feld = document.activeElement;
    const tippt = feld && (feld.isContentEditable ||
                  ['INPUT','TEXTAREA','SELECT'].includes(feld.tagName));

    if (e.key === 'Tab' && reiter.length > 1) {
      e.preventDefault();
      wechseln(e.shiftKey ? (aktiv - 1 + reiter.length) % reiter.length : (aktiv + 1) % reiter.length);
      return;
    }
    if (!e.altKey && e.key.toLowerCase() === 't' && !e.shiftKey) {
      e.preventDefault(); neuerReiter(); return;
    }
    if (!e.altKey && e.key.toLowerCase() === 'w' && !e.shiftKey) {
      e.preventDefault(); schliessen(aktiv); return;
    }
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      geteilt ? teilenAus() : teilen(App.aktuelleSeite(), 'quer');
      return;
    }
    /* Strg + 1…9 springt zum Reiter — nur ausserhalb von Textfeldern */
    if (!tippt && !e.shiftKey && !e.altKey && /^[1-9]$/.test(e.key) && reiter.length > 1) {
      e.preventDefault();
      wechseln(Math.min(+e.key - 1, reiter.length - 1));
    }
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  const start = () => {
    lesen();
    bereit = true;
    /* Die App hat beim Hochfahren schon eine Seite geöffnet — der aktive
       Reiter soll darauf zeigen, ohne die anderen zu verlieren. */
    const jetzt = App.aktuelleSeite();
    if (jetzt && reiter.length && reiter[aktiv] && reiter[aktiv].id !== jetzt) {
      const schon = reiter.findIndex(t => t.id === jetzt);
      if (schon >= 0) aktiv = schon;
      else { reiter[aktiv] = { id: jetzt }; }
      sichern();
    }
    zeichnen();
    const g = Store.getMeta('geteilt', null);
    if (g && Store.getBlock(g.id)) { geteilt = g; zeichneTeil(); }

    document.addEventListener('keydown', tasten);
    vorschauBinden();

    document.getElementById('reiterleiste')?.addEventListener('click', e => {
      const zu = e.target.closest('[data-zu]');
      if (zu) { e.stopPropagation(); schliessen(+zu.dataset.zu); return; }
      if (e.target.closest('.rt-plus')) { neuerReiter(); return; }
      const t = e.target.closest('[data-i]');
      if (t) wechseln(+t.dataset.i);
    });

    /* Reiter mit der Maus umsortieren */
    let zieht = null;
    document.getElementById('reiterleiste')?.addEventListener('dragstart', e => {
      const t = e.target.closest('[data-i]');
      if (t) zieht = +t.dataset.i;
    });
    document.getElementById('reiterleiste')?.addEventListener('dragover', e => e.preventDefault());
    document.getElementById('reiterleiste')?.addEventListener('drop', e => {
      const t = e.target.closest('[data-i]');
      if (!t || zieht === null) return;
      const nach = +t.dataset.i;
      const [x] = reiter.splice(zieht, 1);
      reiter.splice(nach, 0, x);
      aktiv = nach;
      zieht = null;
      sichern(); zeichnen();
    });
  };

  return { start, zeichnen, gemerkt, neuerReiter, schliessen, wechseln,
           teilen, teilenAus, zeichneTeil, vorschauZeigen, vorschauZu,
           reiter: () => reiter, aktiv: () => aktiv, geteilt: () => geteilt };
})();

window.Fenster = Fenster;
