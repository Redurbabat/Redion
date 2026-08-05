/* ============================================================================
 * apps/tabellen/ansichten/dienst.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/ansichten/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/ansichten/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Ansichten = (() => {

  const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /**
   * Zwei Handgriffe, die in dieser Datei elfmal gebraucht werden.
   *
   * `flaeche()` holt die Bühne (`#page`) und die Brotkrume (`#crumb`) — oder
   * nichts, wenn die Schale noch nicht steht. Vorher stand hier
   * `document.getElementById('crumb').innerHTML = …` ohne Nachsehen; das ist
   * derselbe Fund wie in `hinweis.ts`, nur an einer Stelle, die beim Start
   * läuft.
   */
  const flaeche = (): { wrap: HTMLElement; crumb: HTMLElement } | null => {
    const wrap = document.getElementById('page');
    const crumb = document.getElementById('crumb');
    return wrap && crumb ? { wrap, crumb } : null;
  };

  /** Das angeklickte Element — oder nichts, wenn es kein Element war. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const gruss = (): string => {
    const h = new Date().getHours();
    const name = Store.getMeta('nutzer', '');
    const teil = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
    return teil + (name && name !== 'Ich' ? ', ' + name : '');
  };

  const start = (): void => {
    const f = flaeche();
    if (!f) return;
    const { wrap, crumb } = f;
    App.setzeSeite(null);
    crumb.innerHTML = '<a>🏠 Start</a>';

    const zuletzt = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' && !b.system)
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);

    const offen = Werkzeuge.erinnerungen().filter((e: any) => !e.erledigt);
    const karten = Werkzeuge.faellig().length;
    const journalHeute = Store.getMeta('sys:journal') &&
      Store.childrenOf(Store.getMeta('sys:journal')).some((k: any) => (k.text || '').startsWith(new Date().toISOString().slice(0, 10)));

    wrap.className = '';
    wrap.innerHTML =
      `<div class="home">` +
        `<h1>${esc(gruss())}</h1>` +
        '<div class="home-karten">' +
          `<button class="hk" data-a="journal"><b>📅 Tagesjournal</b>` +
            `<span>${journalHeute ? 'Heutiger Eintrag ist angelegt' : 'Heutigen Eintrag anlegen'}</span></button>` +
          `<button class="hk" data-a="memo"><b>⚡ Schnellnotiz</b><span>Gedanken sofort festhalten</span></button>` +
          `<button class="hk" data-a="lernen"><b>🎴 Karteikarten</b>` +
            `<span>${karten ? karten + ' Karten fällig' : 'Keine Karten fällig'}</span></button>` +
          `<button class="hk" data-a="graph"><b>🕸 Graph</b><span>Wie alles zusammenhängt</span></button>` +
        '</div>' +

        '<h2>Zuletzt bearbeitet</h2>' +
        '<div class="home-liste">' +
          (zuletzt.length ? zuletzt.map((p: any) =>
            `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
            `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('')
          : '<div class="leer">Noch keine Seiten</div>') +
        '</div>' +

        (offen.length
          ? '<h2>Anstehende Erinnerungen</h2><div class="home-liste">' +
            offen.sort((a: any, b: any) => a.zeit.localeCompare(b.zeit)).slice(0, 5).map((e: any) =>
              `<button data-open="${e.pageId}"><span>⏰</span><span style="flex:1">${esc(e.text)}</span>` +
              `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('') +
            '</div>'
          : '') +

        `<h2>Dein Arbeitsbereich</h2>` +
        `<div class="home-zahlen">` +
          zahl(Links.seiten().length, 'Seiten') +
          zahl(Object.keys(Store.cache.collections).length, 'Datenbanken') +
          zahl(Links.alleTags().length, 'Schlagwörter') +
          zahl(Werkzeuge.karten().length, 'Karteikarten') +
        `</div>` +
      '</div>';

    wrap.addEventListener('click', e => {
      const ziel = elVon(e);
      const o = ziel?.closest<HTMLElement>('[data-open]');
      if (o) { App.oeffne(o.dataset['open']); return; }
      const a = ziel?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      if (a.dataset['a'] === 'journal') Werkzeuge.journal();
      if (a.dataset['a'] === 'memo') Werkzeuge.schnellnotizen();
      if (a.dataset['a'] === 'lernen') Werkzeuge.lernen();
      if (a.dataset['a'] === 'graph') Links.graph();
    });
  };

  const zahl = (n: number, name: string): string =>
    `<div class="hz"><b>${n}</b><span>${name}</span></div>`;

  const posteingang = (): void => {
    const erinner = Werkzeuge.erinnerungen();
    const meld = Werkzeuge.meldungen();
    const kommentare: any[] = [];
    Links.seiten().forEach((p: any) =>
      Kommentare.alle(p.id).forEach((k: any) => kommentare.push({ seite: p, ...k })));
    /* Was direkt an mich gerichtet ist — @Name in einem offenen Kommentar */
    const anMich = Kommentare.anMich();
    const geaendert = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 8);

    const f = flaeche();
    if (!f) return;
    const { wrap, crumb } = f;
    App.setzeSeite(null);
    crumb.innerHTML = '<a>📥 Posteingang</a>';
    wrap.className = '';
    const nichts = !erinner.length && !kommentare.length && !meld.length && !anMich.length;

    wrap.innerHTML =
      '<div class="home">' +
        '<h1>📥 Posteingang</h1>' +
        (nichts
          ? '<div class="pe-leer">' +
              '<div class="pe-ico">☑</div>' +
              '<div class="pe-gross">Du bist auf dem neuesten Stand!</div>' +
              '<div class="pe-klein">Bei @-Erwähnungen, Kommentaren und Erinnerungen ' +
              'wirst du hier benachrichtigt</div>' +
              '<button class="pe-link" data-filter="1">Filter ändern</button>' +
            '</div>'
          : '') +
        /* Direkt an mich gerichtet — steht ganz oben, wie in Notion */
        (anMich.length
          ? '<h2>An dich gerichtet</h2><div class="home-liste">' +
            anMich.map((m: any) =>
              `<button data-open="${m.block.parentId}" data-komm="${m.k.id}">` +
              '<span>@</span>' +
              `<span style="flex:1">${esc(m.k.text)}` +
              `<em style="opacity:.6"> — ${esc(m.k.autor || 'jemand')}</em></span>` +
              `<span style="opacity:.5">${Werkzeuge.zeitKurz(m.k.zeit)}</span></button>`).join('') +
            '</div>'
          : '') +
        /* Was Automationen gemeldet haben — Notions „Send notification to" */
        (meld.length
          ? '<h2>Benachrichtigungen</h2><div class="home-liste">' +
            meld.slice(0, 30).map((m: any) =>
              `<button data-meld="${m.id}"${m.seite ? ` data-open="${m.seite}"` : ''}>` +
              `<span>${m.gelesen ? '🔕' : '🔔'}</span>` +
              `<span style="flex:1">${esc(m.text)}` +
              (m.quelle ? `<em style="opacity:.6"> — ${esc(m.quelle)}</em>` : '') + '</span>' +
              `<span style="opacity:.5">${Werkzeuge.zeitKurz(m.wann)}</span></button>`).join('') +
            '</div>'
          : '') +
        '<h2>Erinnerungen</h2><div class="home-liste">' +
          (erinner.length ? erinner.slice().sort((a: any, b: any) => b.zeit.localeCompare(a.zeit)).map((e: any) =>
            `<button data-open="${e.pageId}"><span>${e.erledigt ? '✅' : '⏰'}</span>` +
            `<span style="flex:1">${esc(e.text)}</span>` +
            `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('')
          : '<div class="leer">Keine Erinnerungen</div>') +
        '</div>' +
        '<h2>Kommentare</h2><div class="home-liste">' +
          (kommentare.length ? kommentare.slice(0, 12).map((k: any) =>
            `<button data-open="${k.seite.id}"><span>${k.k.erledigt ? '✅' : '💬'}</span>` +
            `<span style="flex:1">${esc(k.k.text)}<span class="snip">${esc(k.seite.text || 'Ohne Titel')}</span></span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(k.k.zeit))}</span></button>`).join('')
          : '<div class="leer">Keine Kommentare</div>') +
        '</div>' +
        '<h2>Zuletzt geändert</h2><div class="home-liste">' +
          geaendert.map((p: any) =>
            `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
            `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('') +
        '</div>' +
      '</div>';

    wrap.addEventListener('click', e => {
      const ziel = elVon(e);
      /* Eine Benachrichtigung gilt als gelesen, sobald man sie antippt */
      const m = ziel?.closest<HTMLElement>('[data-meld]');
      if (m && m.dataset['meld']) Werkzeuge.meldungGelesen(m.dataset['meld']);
      const o = ziel?.closest<HTMLElement>('[data-open]');
      if (o) { App.oeffne(o.dataset['open']); return; }
      if (m) { posteingang(); return; }
      if (ziel?.closest('[data-filter]')) posteingangFilter(ziel);
    });
  };

  /** Was soll im Posteingang auftauchen? */
  const posteingangFilter = (anker: Element): void => {
    const jetzt: Record<string, boolean> = Store.getMeta('posteingangFilter',
      { erinnerungen: true, kommentare: true, geaendert: true });
    const r = anker.getBoundingClientRect();
    const m = UI.menu('<div class="grp">Im Posteingang zeigen</div>' +
      ([['erinnerungen', '⏰ Erinnerungen'], ['kommentare', '💬 Kommentare'],
        ['geaendert', '📄 Zuletzt geändert']] as [string, string][])
        .map(([id, n]) => `<button data-x="${id}">${n}` +
          `<span class="ms">${jetzt[id] === false ? 'aus' : 'an'}</span></button>`).join(''),
      r.left, r.bottom + 6, { titel: 'Filter' });
    m.addEventListener('click', (e: MouseEvent) => {
      const b = elVon(e)?.closest<HTMLElement>('[data-x]');
      const x = b?.dataset['x'];
      if (!x) return;
      jetzt[x] = jetzt[x] === false;
      Store.setMeta('posteingangFilter', jetzt);
      m.remove();
      posteingang();
    });
  };

  return { start, posteingang, posteingangFilter, gruss };
})();
(window as any).Ansichten = Ansichten;
