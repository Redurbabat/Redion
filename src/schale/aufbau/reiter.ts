/* ============================================================================
 * fenster.js — Reiter, geteilte Ansicht und Linkvorschau
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/reiter.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/reiter.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Drei Dinge, die man an Notion am Windows-PC vermisst:
 *
 *   REITER — Notions Desktop-App hat sie erst seit 2023 und nur dort. Hier
 *     gibt es sie überall, auch im Browser: Strg+Alt+N neuer Reiter,
 *     Strg+Alt+W zu, Strg+Tab weiter, Strg+1…9 direkt hin. (Strg+T und
 *     Strg+W gehören dem Browser — die Begründung steht unten bei `tasten`.)
 *     Sie überleben den Neustart. Und seit E300 bekommt jedes DOKUMENT
 *     seinen eigenen Reiter, so wie in GoodNotes.
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

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ========================================================================
   * REITER
   * ======================================================================*/
  /** Ein offener Reiter: die Seite und ihr Titel zum Zeitpunkt des Öffnens. */
  type Reiter = { id: string; titel?: string };
  /** Die geteilte Ansicht: welche Seite daneben, wie geteilt, wie breit. */
  type Geteilt = { id: string; richtung: string; anteil?: number };

  let reiter: Reiter[] = [];
  let aktiv  = 0;
  let stumm  = false;     /* verhindert Rückkopplung beim eigenen Öffnen */
  let bereit = false;     /* vor start() nichts überschreiben */

  const lesen = (): void => {
    const g = Store.getMeta('reiter', null);
    if (g && Array.isArray(g.liste) && g.liste.length) {
      reiter = g.liste.filter((t: any) => Store.getBlock(t.id));
      aktiv = Math.min(g.aktiv || 0, Math.max(0, reiter.length - 1));
    }
    if (!reiter.length) {
      const s = App.aktuelleSeite();
      reiter = s ? [{ id: s }] : [];
      aktiv = 0;
    }
  };

  const sichern = (): void => Store.setMeta('reiter', { liste: reiter, aktiv });

  const titelVon = (id: string): string => {
    const b = Store.getBlock(id);
    if (!b) return 'Weg';
    return (b.icon ? b.icon + ' ' : '') + (b.text || 'Ohne Titel');
  };

  const zeichnen = (): void => {
    let leiste = document.getElementById('reiterleiste');
    if (!leiste) {
      leiste = document.createElement('div');
      leiste.id = 'reiterleiste';
      leiste.setAttribute('role', 'tablist');
      const main = document.getElementById('main');
      if (!main) return;
      main.insertBefore(leiste, document.getElementById('topbar'));
    }
    /* Ein einzelner Reiter ohne Nutzen wird nicht gezeigt. */
    const dokument = !!Store.getBlock(App.aktuelleSeite())?.dokumentModus;
    if (Store.getMeta('reiterAn', true) === false || (reiter.length < 2 && !dokument)) {
      leiste.style.display = 'none';
      if (reiter.length < 2) leiste.innerHTML = '';
      return;
    }
    leiste.style.display = '';
    leiste.innerHTML = reiter.map((t, i) =>
      `<div class="rt-tab${i === aktiv ? ' an' : ''}" data-i="${i}" role="tab" ` +
      `aria-selected="${i === aktiv}" draggable="true" title="${esc(titelVon(t.id))}">` +
      `<span>${esc(titelVon(t.id))}</span>` +
      `<button type="button" data-zu="${i}" aria-label="${esc(titelVon(t.id))} schliessen" ` +
      `title="Reiter schliessen (Strg + Alt + W)">✕</button></div>`).join('') +
      '<button type="button" class="rt-plus" aria-label="Neuer Reiter" ' +
      'title="Neuer Reiter (Strg + Alt + N)">＋</button>';

    /* DER AKTIVE REITER MUSS ZU SEHEN SEIN (E300). Am Telefon passen zwei
       Reiter nicht nebeneinander — der zweite stand halb ausserhalb des
       Bildschirms, mit abgeschnittenem Namen. Gefunden auf dem Bild, nicht
       im Prüflauf: die Zeile selbst endete brav am Rand, nur ihr Inhalt
       nicht (§55.1, derselbe Fehler wie die abgeschnittene Zahl im
       Tabellenblock).

       Gerechnet wird über die Bildschirmrechtecke und nicht über
       `offsetLeft`: die Zeile ist nicht positioniert, also zählt
       `offsetLeft` an ihr vorbei zum nächsten positionierten Vorfahren. */
    const an = leiste.querySelector<HTMLElement>('.rt-tab.an');
    if (an) {
      const tr = an.getBoundingClientRect();
      const lr = leiste.getBoundingClientRect();
      if (tr.left < lr.left) leiste.scrollLeft += tr.left - lr.left - 8;
      else if (tr.right > lr.right) leiste.scrollLeft += tr.right - lr.right + 8;
    }
  };

  const wechseln = (i: number): void => {
    if (i < 0 || i >= reiter.length) return;
    aktiv = i;
    sichern();
    stumm = true;
    App.oeffne(reiter[i]?.id);
    stumm = false;
    zeichnen();
  };

  const neuerReiter = (id?: string): void => {
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

  const schliessen = (i: number): void => {
    if (reiter.length <= 1) { UI.toast('Der letzte Reiter bleibt offen'); return; }
    reiter.splice(i, 1);
    if (aktiv >= reiter.length) aktiv = reiter.length - 1;
    else if (i < aktiv) aktiv--;
    sichern();
    wechseln(aktiv);
  };

  /** Zeigt diese Seite ein Dokument — eine PDF, ein Heft, eine Mappe? */
  const istDokument = (id: string): boolean => !!(id && Store.getBlock(id)?.dokumentModus);

  /**
   * App.oeffne meldet sich hier: der aktive Reiter zeigt jetzt woandershin.
   *
   * WANN EIN NEUER REITER ENTSTEHT (E300). Bis hierher gab es nur einen Fall:
   * der aktive Reiter wurde überschrieben. Damit konnte gar keine Reiterzeile
   * entstehen — wer eine zweite PDF öffnete, verlor die erste aus der Zeile,
   * und der Weg zwischen zwei Dokumenten führte jedes Mal übers Regal.
   *
   * Die Regel ist ein Satz: *ein Dokument wird nicht verdrängt.* Zeigt der
   * aktive Reiter ein Dokument und kommt etwas anderes, bekommt das Neue
   * einen eigenen Reiter daneben. In allen anderen Fällen bleibt es beim
   * Überschreiben.
   *
   * Was das nicht tut — und das ist der Grund für genau diesen Zuschnitt:
   * gewöhnliche Seiten lösen einander weiterhin ab. Sonst hätte jeder Klick
   * im Baum einen Reiter erzeugt und die Zeile wäre nach zehn Minuten
   * unbrauchbar. Zwei PDFs und eine Notiz ergeben drei Reiter; zwanzig
   * Notizen nacheinander ergeben einen.
   */
  const gemerkt = (id: string): any => {
    /* Beim Hochfahren öffnet die App die zuletzt gesehene Seite, bevor die
       Reiter gelesen sind. Ohne diese Sperre würde das die Liste löschen. */
    if (!bereit || stumm || !id) return;
    if (!reiter.length) { reiter = [{ id }]; aktiv = 0; sichern(); zeichnen(); return; }

    /* Schon offen? Dann dorthin, nicht ein zweites Mal. Vorher stand hier
       nur das Überschreiben: wer von Reiter 1 aus die Seite öffnete, die in
       Reiter 2 lag, hatte danach zweimal dieselbe Seite in der Zeile. */
    const schon = reiter.findIndex(t => t.id === id);
    if (schon >= 0) { aktiv = schon; sichern(); zeichnen(); return; }

    if (istDokument(reiter[aktiv]?.id ?? '')) { reiter.splice(++aktiv, 0, { id }); }
    else reiter[aktiv] = { id };
    sichern();
    zeichnen();
  };

  /* ========================================================================
   * GETEILTE ANSICHT
   * ======================================================================*/
  let geteilt: Geteilt | null = null;

  const teilen = (id?: string, richtung?: string): void => {
    const ziel = id || App.aktuelleSeite();
    if (!ziel) return;
    geteilt = { id: ziel, richtung: richtung || 'quer',
                anteil: (geteilt && geteilt.anteil) || 50 };
    Store.setMeta('geteilt', geteilt);
    zeichneTeil();
  };

  const teilenAus = (): void => {
    geteilt = null;
    Store.setMeta('geteilt', null);
    document.getElementById('teil')?.remove();
    document.getElementById('main')?.classList.remove('geteilt', 'hoch');
  };

  const zweiteSeite = (wrap: HTMLElement, id: string): void => {
    const p = Store.getBlock(id);
    wrap.innerHTML = '';
    if (!p) { wrap.innerHTML = '<div class="db-leer">Diese Seite gibt es nicht mehr.</div>'; return; }

    const pfad = Store.pathOf(id);
    const kopf = document.createElement('div');
    kopf.className = 'teil-kopf';
    kopf.innerHTML =
      `<div class="teil-pfad">${pfad.map((x: any) => esc(x.text || 'Ohne Titel')).join(' / ')}</div>` +
      '<button data-a="tausch" title="Mit der linken Seite tauschen">⇄</button>' +
      '<button data-a="richtung" title="Nebeneinander oder übereinander">⊞</button>' +
      '<button data-a="voll" title="Nur diese Seite zeigen">⤢</button>' +
      '<button data-a="zu" title="Teilung aufheben">✕</button>';
    kopf.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      /* Der Kopf steht in der geteilten Ansicht — aber der Klick kann
         eintreffen, nachdem sie aufgehoben wurde (Esc, ein Tastenkürzel,
         eine andere Seite). Dann gibt es nichts mehr zu tauschen. */
      const g = geteilt;
      if (!b || !g) return;
      if (b.dataset['a'] === 'zu')   { teilenAus(); return; }
      if (b.dataset['a'] === 'voll') { const z = g.id; teilenAus(); App.oeffne(z); return; }
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
    Store.childrenOf(p.id).forEach((b: any) => {
      if (b.type === 'number') { nr++; b.nr = nr; } else nr = 0;
      innen.appendChild(Blocks.render(b));
    });
    wrap.appendChild(innen);
    if (Blocks.bindeEditor) Blocks.bindeEditor(innen);
  };

  const zeichneTeil = (): void => {
    const g = geteilt;
    if (!g) { document.getElementById('teil')?.remove(); return; }
    const main = document.getElementById('main');
    if (!main) return;
    let t = document.getElementById('teil');
    if (!t) {
      const neu = document.createElement('div');
      t = neu;
      neu.id = 'teil';
      neu.innerHTML = '<div class="teil-griff" title="Ziehen ändert die Breite"></div>' +
                      '<div class="teil-seite"></div>';
      main.appendChild(neu);
      /* Trennlinie ziehen */
      neu.querySelector('.teil-griff')?.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        const quer = g.richtung === 'quer';
        const kasten = main.getBoundingClientRect();
        const zug = (e2: PointerEvent): void => {
          const p2 = quer
            ? (kasten.right - e2.clientX) / kasten.width * 100
            : (kasten.bottom - e2.clientY) / kasten.height * 100;
          g.anteil = Math.max(20, Math.min(80, p2));
          neu.style.flexBasis = g.anteil + '%';
        };
        const stop = (): void => {
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
    const seite = t.querySelector<HTMLElement>('.teil-seite');
    if (seite) zweiteSeite(seite, g.id);
  };

  /* ========================================================================
   * LINKVORSCHAU
   * ======================================================================*/
  let schweb: HTMLElement | null = null;
  let uhr: ReturnType<typeof setTimeout> | undefined;

  const vorschauZu = (): void => {
    clearTimeout(uhr);
    schweb?.remove();
    schweb = null;
  };

  const vorschauZeigen = (el: Element, id: string): void => {
    const p = Store.getBlock(id);
    if (!p) return;
    vorschauZu();
    const kinder = Store.childrenOf(id).slice(0, 6);
    const text = kinder.map((k: any) => (k.text || '').trim()).filter(Boolean).slice(0, 4);
    const pfad = Store.pathOf(id).slice(0, -1).map((x: any) => x.text || '…').join(' / ');

    schweb = document.createElement('div');
    schweb.className = 'linkvorschau';
    schweb.innerHTML =
      `<div class="lv-titel">${p.icon ? esc(p.icon) + ' ' : ''}${esc(p.text || 'Ohne Titel')}</div>` +
      (pfad ? `<div class="lv-pfad">${esc(pfad)}</div>` : '') +
      (text.length
        ? '<div class="lv-text">' + text.map((t: any) => `<p>${esc(t.slice(0, 140))}</p>`).join('') + '</div>'
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
  const idVon = (el: Element | null): string | null => {
    const a = el?.closest<HTMLElement>('[data-seite], [data-id]');
    if (!a) return null;
    return a.dataset["seite"] || a.dataset["id"] || null;
  };

  const vorschauBinden = (): void => {
    document.addEventListener('mouseover', e => {
      if (Store.getMeta('linkvorschau', true) === false) return;
      const el = elVon(e)?.closest<HTMLElement>('[data-seite], .pageref, .seiten-link, #tree [data-id]');
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
      const el = elVon(e)?.closest<HTMLElement>('[data-seite], .pageref, .seiten-link, #tree [data-id]');
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
  const tasten = (e: KeyboardEvent): void => {
    const strg = e.ctrlKey || e.metaKey;
    if (!strg) return;
    const feld = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const tippt = feld && (feld.isContentEditable ||
                  ['INPUT','TEXTAREA','SELECT'].includes(feld.tagName));

    if (e.key === 'Tab' && reiter.length > 1) {
      e.preventDefault();
      wechseln(e.shiftKey ? (aktiv - 1 + reiter.length) % reiter.length : (aktiv + 1) % reiter.length);
      return;
    }
    /* --- Warum hier NICHT Strg T und Strg W stehen ----------------------
     * Beide gehören dem Browser, und er gibt sie nicht her: `preventDefault`
     * bleibt bei ihnen wirkungslos. Gebunden waren sie trotzdem, und das
     * Ergebnis war, dass BEIDES geschah — Redion schloss seinen Reiter, und
     * der Browser schloss das Fenster darüber. Der Mensch kam zurück und
     * fand einen seiner Reiter nicht mehr, ohne Anhaltspunkt, warum.
     *
     * Nachweisen lässt sich das im Prüfstand nicht: Playwright schickt
     * Tastendrücke an die Seite, nicht an die Browseroberfläche. Deshalb
     * wird hier nicht bewiesen, sondern ausgewichen — auf zwei Kürzel, bei
     * denen die Frage gar nicht erst entsteht. `test134` hält fest, dass
     * Strg T und Strg W wieder beim Browser liegen.
     *
     * Und selbst wenn der Browser sie hergäbe: wer Strg W drückt, meint
     * meistens den Browserreiter. Eine Seite, die das umdeutet, ist
     * unhöflich zu einer Gewohnheit, die älter ist als sie.
     * ------------------------------------------------------------------ */
    if (e.altKey && e.key.toLowerCase() === 'n' && !e.shiftKey) {
      e.preventDefault(); neuerReiter(); return;
    }
    if (e.altKey && e.key.toLowerCase() === 'w' && !e.shiftKey) {
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
  const start = (): void => {
    lesen();
    bereit = true;
    /* Die App hat beim Hochfahren schon eine Seite geöffnet — der aktive
       Reiter soll darauf zeigen, ohne die anderen zu verlieren. */
    const jetzt = App.aktuelleSeite();
    if (jetzt && reiter[aktiv] && reiter[aktiv]?.id !== jetzt) {
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
      const zu = elVon(e)?.closest<HTMLElement>('[data-zu]');
      if (zu?.dataset["zu"]) { e.stopPropagation(); schliessen(+zu.dataset["zu"]); return; }
      if (elVon(e)?.closest<HTMLElement>('.rt-plus')) { neuerReiter(); return; }
      const t = elVon(e)?.closest<HTMLElement>('[data-i]');
      if (t?.dataset["i"]) wechseln(+t.dataset["i"]);
    });

    /* Reiter mit der Maus umsortieren */
    let zieht: number | null = null;
    document.getElementById('reiterleiste')?.addEventListener('dragstart', e => {
      const t = elVon(e)?.closest<HTMLElement>('[data-i]');
      if (t?.dataset["i"]) zieht = +t.dataset["i"];
    });
    document.getElementById('reiterleiste')?.addEventListener('dragover', e => e.preventDefault());
    document.getElementById('reiterleiste')?.addEventListener('drop', e => {
      const t = elVon(e)?.closest<HTMLElement>('[data-i]');
      if (!t || zieht === null) return;
      const nach = +(t.dataset["i"] ?? 0);
      const [x] = reiter.splice(zieht, 1);
      if (!x) return;
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

(window as any).Fenster = Fenster;
