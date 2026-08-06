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

  /* --------------------------------------------------------------------------
   * SICHERUNGSSTAND auf dem Start-Bildschirm
   * ---------------------------------------------------------------------------
   * Der Zeitstempel lag bisher im Verschlüsselungs-Dialog, drei Klicks tief in
   * den Einstellungen. Dort sieht ihn, wer ohnehin ans Sichern denkt. Wer
   * nicht daran denkt — und das ist der Fall, für den die Anzeige da ist —
   * kommt nie dorthin. Also steht er jetzt da, wo man jeden Morgen hinschaut.
   *
   * Abgestuft, und das ist der eigentliche Punkt. Eine Warnung, die immer
   * gleich laut ist, wird zur Tapete. Frisch gesichert heisst deshalb: eine
   * ruhige Zeile. Länger her heisst: ein Hinweis mit Knopf. Nie gesichert
   * heisst: ein Hinweis, den man nicht überliest. Die Stelle auf der Seite
   * bleibt in allen drei Fällen dieselbe, damit nichts springt.
   * ------------------------------------------------------------------------ */

  const TAG = 86400000;
  /** Ab hier erinnern (eine Woche) bzw. warnen (ein Monat). */
  const SICHERUNG_ERINNERN = 7;
  const SICHERUNG_WARNEN = 30;

  type Sicherungsstand = {
    stufe: 'gut' | 'erinnern' | 'warnen';
    tage: number | null;
    art: string;
    wann: string;
  };

  const sicherungsstand = (): Sicherungsstand => {
    const wann = String(Store.getMeta('sicherung:zuletzt', '') || '');
    const art = String(Store.getMeta('sicherung:art', '') || '');
    const zeit = wann ? Date.parse(wann) : NaN;
    /* Ein unlesbarer Zeitstempel ist wie keiner — nicht wie ein frischer. */
    if (!wann || Number.isNaN(zeit)) return { stufe: 'warnen', tage: null, art, wann: '' };
    const tage = Math.max(0, Math.floor((Date.now() - zeit) / TAG));
    const stufe = tage >= SICHERUNG_WARNEN ? 'warnen'
                : tage >= SICHERUNG_ERINNERN ? 'erinnern' : 'gut';
    return { stufe, tage, art, wann };
  };

  const sicherungBand = (): string => {
    const s = sicherungsstand();
    const wieLang = s.tage === null ? ''
      : s.tage === 0 ? 'heute'
      : s.tage === 1 ? 'gestern'
      : 'vor ' + s.tage + ' Tagen';

    if (s.stufe === 'gut') {
      /* Alles in Ordnung: eine Zeile, kein Kasten, kein Ausrufezeichen. */
      const ohneAnhaenge = s.art === 'json'
        ? ' · JSON-Sicherung, ohne Anhänge' : '';
      return '<div class="home-sich home-sich-gut">' +
        `<span class="hs-zeichen">✓</span>` +
        `<span class="hs-text">Gesichert ${esc(wieLang)}` +
        `<em>${esc(Werkzeuge.zeitKurz(s.wann))}${esc(ohneAnhaenge)}</em></span>` +
        '<button class="hs-still" data-a="sichern">Sichern</button>' +
        '</div>';
    }

    const nie = s.tage === null;
    return `<div class="home-sich home-sich-${s.stufe}">` +
      `<span class="hs-zeichen">${nie ? '!' : '⏳'}</span>` +
      '<span class="hs-text">' +
        `<b>${nie ? 'Noch nie gesichert' : 'Zuletzt gesichert ' + esc(wieLang)}</b>` +
        `<em>${nie
          ? 'Deine Seiten liegen nur in diesem Browser. Eine Sicherung ist eine Datei auf deinem Gerät.'
          : 'Was seitdem entstanden ist, liegt nur in diesem Browser.'}</em>` +
      '</span>' +
      '<button class="hs-tun prim" data-a="sichern">Jetzt sichern</button>' +
      '</div>';
  };

  /* --------------------------------------------------------------------------
   * PRIVAT — die eigenen Seiten auf oberster Ebene
   * ---------------------------------------------------------------------------
   * „Zuletzt bearbeitet" beantwortet: woran war ich dran? Diese Liste
   * beantwortet: was habe ich überhaupt? Das ist auf dem Handy die
   * wichtigere Frage, weil es dort keine Seitenleiste mit dem Baum gibt.
   * ------------------------------------------------------------------------ */
  const PRIVAT_MAX = 8;

  const privatListe = (): string => {
    const alle = Store.rootPages().filter((p: any) => !p.system);
    const wurzeln = alle.slice(0, PRIVAT_MAX);
    if (!wurzeln.length) return '';
    const mehr = alle.length - wurzeln.length;
    return '<h2>Privat</h2><div class="home-liste">' +
      wurzeln.map((p: any) => {
        const kinder = Store.childrenOf(p.id)
          .filter((k: any) => k.type === 'page' && k.alive).length;
        return `<button data-open="${esc(p.id)}"><span>${esc(p.icon || '📄')}</span>` +
          `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
          `<span class="pth">${kinder ? kinder + (kinder === 1 ? ' Unterseite' : ' Unterseiten') : ''}</span>` +
          '</button>';
      }).join('') +
      (mehr > 0 ? `<div class="leer">und ${mehr} weitere in der Seitenleiste</div>` : '') +
      '</div>';
  };

  /* --------------------------------------------------------------------------
   * SCHNELLZUGRIFF — was der Nutzer selbst nach oben gestellt hat
   * ---------------------------------------------------------------------------
   * Der Wunsch war: „Ausbildung" und „Mediathek" als eigene Kacheln auf dem
   * Start-Bildschirm. Zwei feste Kacheln einzubauen wäre die kurze Antwort —
   * und die falsche: der Nächste braucht „Rezepte" und „Trainingsplan", und
   * dann stehen vier Kacheln da, die niemand bestellt hat.
   *
   * Redion kennt bereits einen Begriff dafür, dass etwas wichtig ist: den
   * Stern. Wer eine Seite mit ★ markiert, stellt sie damit nach oben — in der
   * Seitenleiste und ab jetzt auch hier. Kein zweites Anheften, kein
   * Einstellungsdialog, keine Liste, die man doppelt pflegt.
   *
   * Vier Stück, mehr nicht. Der Schnellzugriff soll der erste Blick sein,
   * nicht das Inhaltsverzeichnis; alles Weitere steht in der Seitenleiste.
   * ------------------------------------------------------------------------ */
  const SCHNELL_MAX = 4;

  const schnellKarten = (): string => {
    const sterne = Links.seiten()
      .filter((p: any) => p.favorite && !p.system)
      .sort((a: any, b: any) => (b.edited || '').localeCompare(a.edited || ''))
      .slice(0, SCHNELL_MAX);
    if (!sterne.length) return '';
    return '<h2>Schnellzugriff</h2><div class="home-karten">' +
      sterne.map((p: any) => {
        const kinder = Store.childrenOf(p.id)
          .filter((k: any) => k.type === 'page' && k.alive).length;
        const unten = kinder
          ? kinder + (kinder === 1 ? ' Unterseite' : ' Unterseiten')
          : Werkzeuge.zeitKurz(p.edited);
        return `<button class="hk" data-open="${esc(p.id)}">` +
          `<b>${esc(p.icon || '📄')} ${esc(p.text || 'Ohne Titel')}</b>` +
          `<span>${esc(unten)}</span></button>`;
      }).join('') +
      '</div>';
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
            /* „1 Karten fällig" stand hier, seit es die Karte gibt. */
            `<span>${karten ? karten + (karten === 1 ? ' Karte fällig' : ' Karten fällig')
                            : 'Keine Karten fällig'}</span></button>` +
          `<button class="hk" data-a="graph"><b>🕸 Graph</b><span>Wie alles zusammenhängt</span></button>` +
        '</div>' +

        sicherungBand() +
        schnellKarten() +

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

        privatListe() +

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
      /* Der Knopf im Sicherungsband — derselbe Weg wie in den Einstellungen.
         Danach den Start-Bildschirm neu zeichnen, damit die Anzeige stimmt;
         wer sichert, will sehen, dass es gezählt hat. */
      if (a.dataset['a'] === 'sichern') {
        void Promise.resolve(App.sicherungSpeichern()).then(() => {
          if (document.getElementById('page')?.querySelector('.home-sich')) start();
        });
      }
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
          ? Hinweis.leer({
              zeichen: '☑',
              gross: 'Du bist auf dem neuesten Stand!',
              klein: 'Bei @-Erwähnungen, Kommentaren und Erinnerungen ' +
                     'wirst du hier benachrichtigt',
              handlung: 'Filter ändern',
              daten: 'data-filter="1"'
            })
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
