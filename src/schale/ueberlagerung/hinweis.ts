/* ============================================================================
 * schale/ueberlagerung/hinweis.js — Toast und Banner
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/hinweis.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/hinweis.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Zwei Arten, etwas zu sagen, und sie werden gern verwechselt:
 *
 *   **Toast** — verschwindet von selbst. Für Bestätigungen: „Gespeichert",
 *   „3 Zeilen gelöscht". Wer ihn verpasst, hat nichts verpasst.
 *
 *   **Banner** — bleibt, bis jemand ihn wegklickt. Für Dinge, die man wissen
 *   muss: „Der Speicher ist hier gesperrt", „Der Schlüssel passt nicht".
 *
 * Ein Toast für etwas Wichtiges ist der häufigste Fehler in Oberflächen: die
 * Meldung erscheint, während man woanders hinsieht, und ist weg, bevor man
 * sie liest.
 * ==========================================================================*/

const Hinweis = (() => {

  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  /* DER STAPEL (E711, Szene 08). Drei Meldungen hintereinander liessen nur
     die letzte stehen. `#toast` bleibt die EINE Live-Region mit der neuesten
     (test114, E116); die zwei davor stehen als Karten in `#ru-toast-stapel`
     (aria-hidden: schon angesagt), ohne Zeiger — ein Finger wischt sie über
     die LAGE weg, ein Tipp geht durch sie hindurch. */
  type Aeltere = { id: number; el: HTMLElement; oben?: number; uhr?: ReturnType<typeof setTimeout> };
  let aeltere: Aeltere[] = [];
  let zaehler = 0;
  /** Wem `#toast` gerade gehört (die Nummer des Aufrufs) und bis wann. */
  let eigner = 0;
  let toastBis = 0;
  const HOECHSTENS = 2;       /* neben der neuesten: drei im Ganzen */
  const LUECKE = 8;

  const ruhig = (): boolean => typeof SelectionFlow !== 'undefined' ? SelectionFlow.ruhig()
    : matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Nutzertext nie roh ins HTML (§19). */
  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c] ?? c);

  const stapel = (): HTMLElement => {
    let s = document.getElementById('ru-toast-stapel');
    if (!s) {
      s = document.createElement('div');
      s.id = 'ru-toast-stapel';
      s.setAttribute('aria-hidden', 'true');
      document.body.appendChild(s);
    }
    return s;
  };

  /** Über (oder unter) `#toast`, aus seinem LAYOUT — er fährt vielleicht noch. */
  const ordnen = (): void => {
    const t = document.getElementById('toast');
    if (!t) return;
    const oben = t.offsetTop, hoehe = t.offsetHeight;
    const nachOben = oben + hoehe / 2 > innerHeight / 2;
    let rand = nachOben ? oben - LUECKE : oben + hoehe + LUECKE;
    const feder = typeof RedionSpring !== 'undefined' ? RedionSpring.token('snappy') : null;
    for (const a of aeltere) {
      const h = a.el.offsetHeight;
      const top = nachOben ? rand - h : rand;
      rand = nachOben ? top - LUECKE : top + h + LUECKE;
      a.el.style.top = top + 'px';
      const von = a.oben ?? oben;
      a.oben = top;
      if (Math.abs(von - top) > 0.5 && feder && feder.duration > 2 && !ruhig()) {
        a.el.animate([{ transform: 'translateY(' + (von - top).toFixed(1) + 'px)' }, { transform: 'none' }],
          { duration: feder.duration, easing: feder.easing });
      }
    }
  };

  const gehen = (a: Aeltere): void => {
    if (!aeltere.includes(a)) return;
    aeltere = aeltere.filter(x => x !== a);
    clearTimeout(a.uhr);
    a.el.classList.add('geht');
    const weg = (): void => { a.el.remove(); };
    if (ruhig()) weg();
    else {
      const anim = a.el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }],
        { duration: 180, easing: 'ease-out', fill: 'forwards' });
      anim.finished.then(weg).catch(weg);
    }
    ordnen();
  };

  /** Was in `#toast` steht und einem ANDEREN Aufruf gehört, rückt zur Seite;
   *  ein Fortschritt (E116) stapelt sich nicht selbst. */
  const uebernehmen = (t: HTMLElement, id: number, neu: string): void => {
    const alt = t.textContent || '';
    const altId = eigner;
    eigner = id;
    aeltere.filter(a => a.id === id || a.el.textContent === neu).forEach(gehen);
    if (!t.classList.contains('show') || !alt || altId === id || alt === neu) return;
    aeltere.filter(a => a.el.textContent === alt).forEach(gehen);
    const el = document.createElement('div');
    el.className = 'ru-toast-alt';
    el.textContent = alt;
    stapel().prepend(el);
    const eintrag: Aeltere = { id: altId, el };
    aeltere.unshift(eintrag);
    while (aeltere.length > HOECHSTENS) { const letzte = aeltere[aeltere.length - 1]; if (letzte) gehen(letzte); }
    /* 2,2 s lesbar, höchstens 6 s. */
    const bleibt = Math.min(6000, Math.max(2200, toastBis - Date.now()));
    eintrag.uhr = setTimeout(() => gehen(eintrag), bleibt);
    requestAnimationFrame(ordnen);
    ordnen();
  };

  /** Escape ohne Fenster (E302): alles abräumen. */
  const stapelLeeren = (): boolean => {
    const t = document.getElementById('toast');
    const da = !!t?.classList.contains('show') || aeltere.length > 0;
    [...aeltere].forEach(gehen);
    if (t?.classList.contains('show')) { clearTimeout(toastTimer); t.classList.remove('show'); }
    return da;
  };

  /* WISCHEN: ein waagerechter Zug über 12 px, der auf einer Karte begann,
     gehört ihr (`wischen.ts` hört ihn dann nicht); über 40 % oder schnell: weg. */
  let zug: { id: number; x0: number; y0: number; t0: number; el: HTMLElement; wer: Aeltere | null;
             gefangen: boolean; x: number; y: number; t: number; ab: number | null } | null = null;
  /* WER ERST LANGE HÄLT, HEBT ETWAS AN (sechste Durchsicht E711, test588
     §14). Die Kladde (notebook.ts) wird nach 400 ms gehoben, ein Block
     (pwa.ts) nach 500, eine Marke im PDF (marken.ts) nach 450 — und der
     Stapel nahm ihnen unter einer Meldung den Zug weg (`test360`: die
     Kladde kam nicht im Fach an). Ein Schnippen fängt sofort an; ruhte der
     Finger länger als das hier, bevor er losging, gehört der Zug dem, was
     darunter liegt. */
  const HALTEN_MS = 300;
  const gehalten = (z: NonNullable<typeof zug>): boolean => z.ab !== null && z.ab - z.t0 > HALTEN_MS;
  const trifft = (x: number, y: number): { el: HTMLElement; wer: Aeltere | null } | null => {
    for (const a of aeltere) {
      const r = a.el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { el: a.el, wer: a };
    }
    const t = document.getElementById('toast');
    if (t?.classList.contains('show')) {
      const r = t.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { el: t, wer: null };
    }
    return null;
  };
  /* WAS SEINE FINGER SELBST NIMMT, BEHÄLT SIE (Durchsicht E711): unter den
     Karten (`pointer-events:none`) lag die Tafel, der Stapel fing den Strich
     nach 12 px ab — es kamen 8 von 170 px an. Der Zug gehört der Meldung
     nur, wo die Fläche das Waagerechte dem Browser lässt. */
  const nimmtSelbst = (ziel: EventTarget | null): boolean => {
    for (let el = ziel instanceof Element ? ziel : null; el && el !== document.body; el = el.parentElement) {
      if (el instanceof HTMLElement && el.dataset['keinWisch'] !== undefined) return true;
      if (el instanceof HTMLInputElement && el.type === 'range') return true;
      const s = getComputedStyle(el);
      const ta = s.touchAction;
      if (ta && ta !== 'auto' && ta !== 'manipulation' && !/pan-x|pan-left|pan-right/.test(ta)) return true;
      if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(s.overflowX)) return true;
    }
    return false;
  };
  addEventListener('pointerdown', (e: PointerEvent) => {
    zug = null;
    if (e.pointerType !== 'touch') return;
    const z = trifft(e.clientX, e.clientY);
    if (z && !nimmtSelbst(e.target)) zug = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, ...z,
      gefangen: false, x: e.clientX, y: e.clientY, t: e.timeStamp, ab: null };
  }, { capture: true, passive: true });
  addEventListener('pointermove', (e: PointerEvent) => {
    if (!zug || e.pointerId !== zug.id) return;
    zug.x = e.clientX; zug.y = e.clientY; zug.t = e.timeStamp;
    const dx = e.clientX - zug.x0, dy = e.clientY - zug.y0;
    if (zug.ab === null && Math.abs(dx) + Math.abs(dy) > 4) zug.ab = e.timeStamp;
    if (!zug.gefangen) {
      if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 12) { if (Math.abs(dy) > 12) zug = null; return; }
      if (gehalten(zug)) { zug = null; return; }
      zug.gefangen = true;
    }
    e.stopPropagation();
    zug.el.style.translate = dx.toFixed(1) + 'px 0';
    zug.el.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 260));
  }, { capture: true, passive: true });
  /** Losgelassen bei `x` zur Zeit `t`: schnell oder weit genug → weg. */
  const loslassen = (z: NonNullable<typeof zug>, x: number, t: number): void => {
    const dx = x - z.x0;
    const schnell = Math.abs(dx) / Math.max(1, t - z.t0) > 0.6;
    const weit = Math.abs(dx) > z.el.getBoundingClientRect().width * 0.4;
    z.el.style.removeProperty('translate');
    z.el.style.removeProperty('opacity');
    if (!(schnell || weit)) return;
    if (z.wer) gehen(z.wer);
    else { clearTimeout(toastTimer); document.getElementById('toast')?.classList.remove('show'); }
  };
  addEventListener('pointerup', (e: PointerEvent) => {
    if (!zug || e.pointerId !== zug.id) return;
    const z = zug; zug = null;
    if (!z.gefangen) return;
    e.stopPropagation();
    loslassen(z, e.clientX, e.timeStamp);
  }, { capture: true });
  /* ROLLT DER BROWSER, kommt `pointercancel` nach ein, zwei Bewegungen —
     seine Lage sagt nichts (Durchsicht E711). Gezählt wird die LETZTE
     Bewegung: deutlich zur Seite (≥ 8 px) war ein Schnippen. */
  addEventListener('pointercancel', (e: PointerEvent) => {
    if (!zug || e.pointerId !== zug.id) return;
    const z = zug; zug = null;
    const dx = z.x - z.x0, dy = z.y - z.y0;
    if (z.gefangen || (Math.abs(dx) >= 8 && Math.abs(dx) > Math.abs(dy) && !gehalten(z))) loslassen(z, z.x, z.t);
    else { z.el.style.removeProperty('translate'); z.el.style.removeProperty('opacity'); }
  }, { capture: true });

  /* ------------------------------------------------------------------------
   * EIN FUND DES UMZUGS. Hier stand `document.getElementById('toast')` und
   * danach sofort `t.textContent = text` — ohne nachzusehen, ob es das
   * Element gibt.
   *
   * Meistens gibt es das. Aber `UI.toast` wird aus dreihundert Stellen
   * gerufen, auch aus welchen, die vor dem Aufbau der Schale laufen oder
   * wenn sie gar nicht da ist. Dort wirft die Zeile — und der Aufrufer
   * bricht mitten in seiner Arbeit ab, obwohl er nur etwas SAGEN wollte.
   *
   * Eine Meldung darf niemals das kaputtmachen, worüber sie berichtet.
   * Fehlt das Element, geht die Meldung in die Konsole und der Griff, den
   * `toast` zurückgibt, tut nichts — statt beim ersten Anfassen zu werfen.
   * ----------------------------------------------------------------------*/
  const toast = (text: unknown, dauer?: number) => {
    const t = document.getElementById('toast');
    if (!t) {
      console.info('[Hinweis]', String(text));
      return { textContent: String(text ?? ''), remove() { /* nichts zu tun */ } };
    }
    const id = ++zaehler;
    uebernehmen(t, id, String(text ?? ''));
    t.textContent = String(text ?? '');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastBis = Date.now() + (dauer || 2600);
    toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
    return {
      /* JEDE MELDUNG HÄLT SICH SELBST AM LEBEN (E116).
         Vorher stand hier `if (t.classList.contains('show'))` — geschrieben
         wurde also nur, solange der Balken ohnehin noch stand. Das ist genau
         andersherum gedacht als der Zweck: `dauer` ist bei einem Fortschritt
         120 000 ms, aber JEDE fremde Meldung dazwischen setzt `toastTimer`
         neu und nimmt die 120 Sekunden mit. Danach war der Fortschritt für
         den Rest des Laufs stumm — im langen Lauf, für den er da ist.
         Jetzt setzt jede Fortschreibung Text, Sichtbarkeit UND Uhr neu. Eine
         fremde Meldung dazwischen ist damit kurz zu sehen und wird von der
         nächsten Fortschreibung abgelöst, statt sie zu töten. */
      set textContent(v: string) {
        uebernehmen(t, id, v);
        t.textContent = v;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastBis = Date.now() + (dauer || 2600);
        toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
      },
      get textContent() { return t.textContent || ''; },
      remove() {
        /* Nur die eigene Meldung nehmen, eine fremde bleibt stehen. */
        aeltere.filter(a => a.id === id).forEach(gehen);
        if (eigner !== id && eigner !== 0) return;
        clearTimeout(toastTimer); t.classList.remove('show');
      }
    };
  };

  /** Die Emoji-Auswahl mit Suchfeld liegt in notion.js. */
  const banner = (text: unknown, art = 'warn'): HTMLDivElement => {
    document.getElementById('banner')?.remove();
    const d = document.createElement('div');
    d.id = 'banner';
    d.className = 'banner ' + art;
    d.innerHTML = `<span>${String(text)}</span><button title="Ausblenden">✕</button>`;
    d.querySelector('button')?.addEventListener('click', () => d.remove());
    document.body.appendChild(d);
    return d;
  };


  /* ==========================================================================
   * DER LEERE ZUSTAND
   * --------------------------------------------------------------------------
   * Ein Bereich ohne Inhalt darf nicht einfach leer sein. Leer heisst für den,
   * der davorsitzt: „hier ist nichts" — und er weiss nicht, ob das an ihm
   * liegt, an der App oder daran, dass er noch nichts angelegt hat.
   *
   * Drei Sätze beantworten das:
   *   ÜBERSCHRIFT   was hier steht, wenn etwas hier steht
   *   TEXT          warum gerade nichts da ist
   *   HANDLUNG      was man jetzt tun kann — als Verweis, nicht als Knopf
   *
   * Die Handlung ist absichtlich ein blauer Verweis und kein voller Knopf:
   * ein leerer Bereich ist keine Aufforderung, sondern ein Angebot. Ein
   * grosser bunter Knopf mitten auf einem leeren Bildschirm drängt.
   *
   * Diese Form stand schon im Posteingang, dort abgeschrieben. Jetzt steht
   * sie einmal hier — die Fassungen liefen sonst auseinander, und drei
   * verschiedene leere Zustände sind schlimmer als einer, der überall gleich
   * aussieht.
   * ========================================================================*/
  const leer = (o: { zeichen: string; gross: string; klein: string;
                     handlung?: string; daten?: string }): string =>
    '<div class="pe-leer">' +
      `<div class="pe-ico">${o.zeichen}</div>` +
      `<div class="pe-gross">${o.gross}</div>` +
      `<div class="pe-klein">${o.klein}</div>` +
      (o.handlung
        ? `<button class="pe-link"${o.daten ? ' ' + o.daten : ''}>${o.handlung}</button>`
        : '') +
    '</div>';

  /* DER FÄCHER AN DER GLOCKE (E711, Szene 08). Der Klick bleibt der
     Posteingang (§43); DAZU fächern beim Zeigen, langen Drücken oder ↓ die
     letzten drei Meldungen auf, mit „Alle gelesen" (E276: gelesen, nicht
     leeren) und „Posteingang öffnen". */
  let faecher: HTMLElement | null = null;
  let faecherGlocke: HTMLElement | null = null;
  let faecherUhr: ReturnType<typeof setTimeout> | undefined;
  let faecherZu: ReturnType<typeof setTimeout> | undefined;

  const faecherOffen = (): boolean => !!faecher && !faecher.hidden;

  /** Fokus an die Glocke, oder (nichts mehr ungelesen, sie ist weg) an
   *  ihren Nachbarn im Kopf — nie ins Leere (§38, Durchsicht E711). */
  const fokusImKopf = (g: HTMLElement): void => {
    if (!g.isConnected) return;
    if (!g.hidden && g.offsetParent !== null) { g.focus(); return; }
    const reihe = [...(g.parentElement?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]') ?? [])]
      .filter(e => e === g || (!e.hidden && e.offsetParent !== null && !e.matches(':disabled')));
    const k = reihe.indexOf(g);
    (reihe[k + 1] ?? reihe[k - 1])?.focus();
  };

  const faecherSchliessen = (sofort = false): void => {
    clearTimeout(faecherUhr); clearTimeout(faecherZu);
    const f = faecher;
    if (!f || f.hidden) return;
    /* Wer darin stand, steht wieder im Kopf; die Glocke sagt „zu". */
    const g = faecherGlocke;
    g?.setAttribute('aria-expanded', 'false');
    if (g && f.contains(document.activeElement)) fokusImKopf(g);
    const fertig = (): void => { f.hidden = true; f.classList.remove('geht'); };
    if (sofort || ruhig()) { fertig(); return; }
    f.classList.add('geht');
    const anim = f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-out' });
    anim.finished.then(fertig).catch(fertig);
  };

  const zuDenMeldungen = (): void => {
    faecherSchliessen(true);
    try { Ansichten.posteingang(); } catch { /* ohne Posteingang bleibt es beim Fächer */ }
  };

  /** „Alle gelesen": die Karten fliessen zäh in die Glocke (EIN Goo-Filter, nur jetzt). */
  const allesGelesen = (): void => {
    const f = faecher, g = faecherGlocke;
    const ziel = g && g.offsetParent !== null ? g.getBoundingClientRect() : null;
    let wie = 0;
    try { wie = Werkzeuge.meldungenAlleGelesen() || 0; } catch { /* ohne Werkzeuge bleibt der Stand */ }
    /* Wie der Knopf im Posteingang — vorgelesen; das Fliessen ist nur Bild. */
    if (wie) toast(wie === 1 ? '1 Meldung als gelesen markiert' : wie + ' Meldungen als gelesen markiert');
    if (!f || !ziel || ruhig()) { faecherSchliessen(true); return; }
    const ebene = f.querySelector<HTMLElement>('.ru-faecher-karten');
    const karten = [...f.querySelectorAll<HTMLElement>('.ru-meldung')];
    if (!ebene || !karten.length || !g) { faecherSchliessen(true); return; }
    /* Die Glocke bleibt, bis die Karten in ihr sind (Durchsicht E711):
       `glockeFrisch` nahm sie sofort weg, die Karten flogen auf „Konto". */
    const hielt = g.hidden;
    g.hidden = false;
    f.classList.add('fliesst');
    SelectionFlow.goo(ebene, true);
    const mx = ziel.left + ziel.width / 2, my = ziel.top + ziel.height / 2;
    const bahnen = karten.map((k, n) => {
      const r = k.getBoundingClientRect();
      const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
      const s = Math.max(0.08, Math.min(ziel.width / r.width, 0.5));
      return k.animate([
        { transform: 'none' },
        { transform: 'translate(' + (dx * 0.35).toFixed(1) + 'px,' + (dy * 0.55).toFixed(1) + 'px) scale(.9,.8)', offset: 0.45 },
        { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')', opacity: 0.4 }
      ], { duration: 460 + n * 30, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
    });
    f.querySelector<HTMLElement>('.ru-faecher-fuss')?.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: 160, fill: 'forwards' });
    const ende = (): void => {
      SelectionFlow.goo(ebene, false);
      f.classList.remove('fliesst');
      bahnen.forEach(b => b.cancel());
      faecherSchliessen(true);
      const weg = (): void => {
        let offen = false;
        try { offen = (Werkzeuge.meldungen() as any[]).some(m => !m.gelesen); } catch { /* wie vorher */ }
        if (!hielt || offen || g.hidden) return;
        const hatte = document.activeElement === g;
        g.hidden = true;
        if (hatte) fokusImKopf(g);
      };
      const puls = g.animate([{ transform: 'scale(1.18)' }, { transform: 'none' }],
        { duration: 320, easing: RedionSpring.token('press').easing });
      puls.finished.then(weg).catch(weg);
    };
    Promise.all(bahnen.map(b => b.finished)).then(ende).catch(ende);
  };

  const faecherBauen = (): HTMLElement => {
    if (faecher) return faecher;
    const f = document.createElement('div');
    f.id = 'ru-glocken-faecher';
    f.setAttribute('role', 'group');
    f.setAttribute('aria-label', 'Letzte Meldungen');
    f.hidden = true;
    f.addEventListener('pointerenter', () => clearTimeout(faecherZu));
    f.addEventListener('pointerleave', (e: PointerEvent) => {
      if (e.pointerType === 'mouse') faecherZu = setTimeout(() => faecherSchliessen(), 280);
    });
    f.addEventListener('click', (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const knopf = el?.closest<HTMLElement>('button');
      if (!knopf) return;
      if (knopf.dataset['faecher'] === 'gelesen') { allesGelesen(); return; }
      if (knopf.dataset['faecher'] === 'posteingang') { zuDenMeldungen(); return; }
      const id = knopf.dataset['meld'] || '';
      const m = (Werkzeuge.meldungen() as any[]).find(x => x.id === id);
      try { if (id) Werkzeuge.meldungGelesen(id); } catch { /* bleibt ungelesen */ }
      faecherSchliessen(true);
      if (m?.seite) App.oeffne(m.seite);
      else zuDenMeldungen();
    });
    /* Geht der Fokus woandershin (Strg P …), geht der Fächer mit (Durchsicht E711). */
    f.addEventListener('focusout', (e: FocusEvent) => {
      const nach = e.relatedTarget instanceof Node ? e.relatedTarget : null;
      if (!nach || f.contains(nach) || faecherGlocke?.contains(nach)) return;
      faecherSchliessen();
    });
    f.addEventListener('keydown', (e: KeyboardEvent) => {
      /* Tab hinaus: zu, und weiter neben der Glocke wie bei einem Menüknopf —
         sonst ging der Fokus aus der Seite, der Fächer blieb (Durchsicht E711). */
      if (e.key === 'Tab') {
        const alle = [...f.querySelectorAll<HTMLElement>('button')];
        const k = alle.indexOf(document.activeElement as HTMLElement);
        const g = faecherGlocke;
        if (!g || (e.shiftKey ? k > 0 : k < alle.length - 1)) return;
        e.preventDefault();
        faecherSchliessen(true);
        const reihe = [...(g.parentElement?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]') ?? [])]
          .filter(x => !x.hidden && x.offsetParent !== null && !x.matches(':disabled'));
        const i = reihe.indexOf(g);
        if (i >= 0) (e.shiftKey ? reihe[i] : reihe[i + 1] ?? reihe[i])?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const alle = [...f.querySelectorAll<HTMLElement>('button')];
      const k = alle.indexOf(document.activeElement as HTMLElement);
      const n = alle[(k + (e.key === 'ArrowDown' ? 1 : alle.length - 1)) % alle.length];
      if (n) { e.preventDefault(); n.focus(); }
    });
    document.body.appendChild(f);
    faecher = f;
    return f;
  };

  /* NICHTS ZUDECKEN, WAS DIREKT UNTER DER GLOCKE STEHT (fünfte Durchsicht
     E711, test588 §13). 8 px unter der Glocke lag der Fächer am Rechner über
     „KI" und „Favorit" in der Kopfzeile der Seite: wer auf der Glocke
     verweilte und dann dorthin wollte, fuhr in ihn hinein, und er blieb
     offen — ein Klick traf eine Meldung. Jetzt geht er unter der Reihe auf,
     die direkt unter der Glocke steht: Ziele, die GANZ in ihr stehen
     (Oberkante unter der Glocke, Unterkante höchstens 96 px darunter),
     abgetastet über seine Breite. Die Reihe ist schmal (am Rechner 55 px),
     der Zeiger quert sie auf dem Weg in den Fächer in weniger als den
     280 ms, nach denen er zugeht. Was tiefer reicht (Karten, Text), zählt
     nicht — ein Fächer liegt immer über etwas; er soll nur nicht über dem
     liegen, wohin man von der Glocke aus als Nächstes zeigt. */
  const REIHE = 72;
  const unterDerReihe = (g: DOMRect, links: number, breite: number): number => {
    let unten = g.bottom;
    for (let y = g.bottom + 4; y <= g.bottom + REIHE; y += 12) {
      for (let x = links + 4; x <= links + breite - 4; x += 16) {
        const ziel = document.elementFromPoint(x, y)
          ?.closest<HTMLElement>('button, a[href], input, select, textarea, [role="button"]');
        if (!ziel || ziel.closest('#ru-glocken-faecher')) continue;
        const r = ziel.getBoundingClientRect();
        if (r.top >= g.bottom - 2 && r.bottom <= g.bottom + REIHE + 24) unten = Math.max(unten, r.bottom);
      }
    }
    return unten;
  };

  const faecherOeffnen = (glocke: HTMLElement, fokus = false): void => {
    clearTimeout(faecherUhr); clearTimeout(faecherZu);
    if (typeof Werkzeuge === 'undefined' || glocke.hidden || glocke.offsetParent === null) return;
    const liste = (Werkzeuge.meldungen() as any[]).slice(0, 3);
    if (!liste.length) return;
    const f = faecherBauen();
    if (faecherGlocke && faecherGlocke !== glocke) faecherGlocke.setAttribute('aria-expanded', 'false');
    faecherGlocke = glocke;
    const zeit = (w: string): string => { try { return Werkzeuge.zeitKurz(w); } catch { return ''; } };
    f.innerHTML =
      '<div class="ru-faecher-karten">' +
      liste.map(m =>
        `<button type="button" class="ru-meldung${m.gelesen ? '' : ' neu'}" data-meld="${esc(m.id)}">` +
          (m.quelle ? `<span class="ru-meldung-quelle">${esc(m.quelle)}</span>` : '') +
          `<span class="ru-meldung-text">${esc(m.text || 'Meldung')}</span>` +
          `<span class="ru-meldung-zeit">${esc(zeit(m.wann))}</span></button>`).join('') +
      '</div>' +
      '<div class="ru-faecher-fuss">' +
        '<button type="button" data-faecher="gelesen">Alle gelesen</button>' +
        '<button type="button" data-faecher="posteingang">Posteingang öffnen</button>' +
      '</div>';
    f.classList.remove('geht', 'fliesst');
    const g = glocke.getBoundingClientRect();
    const breite = Math.min(340, innerWidth - 16);
    const links = Math.max(8, Math.min(g.right - breite, innerWidth - breite - 8));
    /* Abgetastet, solange er verborgen ist — sonst träfe er sich selbst. */
    f.hidden = true;
    const oben = unterDerReihe(g, links, breite);
    f.hidden = false;
    f.style.width = breite + 'px';
    f.style.left = links + 'px';
    /* Unter einer Reihe 16 px Luft — sonst sässe er auf ihrer Trennlinie
       (in den Bildern gesehen); direkt an der Glocke wie bisher 8. */
    f.style.top = (oben > g.bottom ? oben + 16 : g.bottom + 8) + 'px';
    if (!ruhig()) {
      const feder = RedionSpring.token('snappy');
      const mx = g.left + g.width / 2, my = g.top + g.height / 2;
      [...f.querySelectorAll<HTMLElement>('.ru-meldung')].forEach((k, n) => {
        const r = k.getBoundingClientRect();
        k.animate([
          { transform: 'translate(' + (mx - r.left - r.width / 2).toFixed(1) + 'px,' +
              (my - r.top - r.height / 2).toFixed(1) + 'px) scale(.12)', opacity: 0 },
          { transform: 'none', opacity: 1 }
        ], { duration: feder.duration, easing: feder.easing, delay: n * 40, fill: 'backwards' });
      });
      f.querySelector<HTMLElement>('.ru-faecher-fuss')?.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 180, delay: 120, fill: 'backwards' });
    }
    glocke.setAttribute('aria-controls', f.id);
    glocke.setAttribute('aria-expanded', 'true');
    if (fokus) f.querySelector<HTMLElement>('button')?.focus();
  };

  /* EIN TIPP ODER KLICK DANEBEN schliesst den Fächer (Durchsicht E711) — am
     Telefon blieb er sonst stehen; der Tipp geht weiter an sein Ziel. */
  addEventListener('pointerdown', (e: PointerEvent) => {
    if (!faecherOffen()) return;
    const ziel = e.target instanceof Node ? e.target : null;
    if (ziel && (faecher?.contains(ziel) || faecherGlocke?.contains(ziel))) return;
    faecherSchliessen();
  }, { capture: true, passive: true });

  /** Eine Glocke bekommt den Fächer — einmal, der Klick bleibt ihrer. */
  const faecherBinden = (glocke: HTMLElement | null): void => {
    if (!glocke || glocke.dataset['faecher'] === 'an') return;
    glocke.dataset['faecher'] = 'an';
    glocke.setAttribute('aria-haspopup', 'true');
    glocke.setAttribute('aria-expanded', 'false');
    let lang: ReturnType<typeof setTimeout> | undefined;
    let schlucken = false;
    let x0 = 0, y0 = 0;
    glocke.addEventListener('pointerenter', (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(faecherZu);
      /* SCHON OFFEN, UND NICHT IM GEHEN: nichts neu (vierte Durchsicht E711).
         Die Karten fliegen aus der Glocke, also im ersten Bild unter dem
         ruhenden Zeiger hervor — er „verliess" die Glocke und kam zurück,
         und der Fächer ging zu und wieder auf, immer wieder. */
      if (faecherOffen() && faecherGlocke === glocke && !faecher?.classList.contains('geht')) return;
      faecherUhr = setTimeout(() => faecherOeffnen(glocke), 220);
    });
    glocke.addEventListener('pointerleave', (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(faecherUhr);
      faecherZu = setTimeout(() => faecherSchliessen(), 280);
    });
    glocke.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      schlucken = false; x0 = e.clientX; y0 = e.clientY;
      clearTimeout(lang);
      lang = setTimeout(() => { schlucken = true; faecherOeffnen(glocke); }, 480);
    });
    glocke.addEventListener('pointermove', (e: PointerEvent) => {
      if (Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 10) clearTimeout(lang);
    });
    const loslassen = (): void => clearTimeout(lang);
    glocke.addEventListener('pointerup', loslassen);
    glocke.addEventListener('pointercancel', loslassen);
    glocke.addEventListener('contextmenu', (e: Event) => { if (schlucken || faecherOffen()) e.preventDefault(); });
    /* Nach langem Drücken ist der Klick keiner (sonst öffnete er auch den Posteingang). */
    glocke.addEventListener('click', (e: MouseEvent) => {
      if (!schlucken) { faecherSchliessen(true); return; }
      schlucken = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
    glocke.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); faecherOeffnen(glocke, true); }
    });
  };

  /** Escape ohne Fenster (E302): erst der Fächer, dann der Stapel. */
  const escape = (): boolean => {
    if (faecherOffen()) {
      const g = faecherGlocke;
      faecherSchliessen();
      if (g && faecher?.contains(document.activeElement)) g.focus();
      return true;
    }
    return stapelLeeren();
  };

  return { toast, banner, leer, faecherBinden, escape };
})();

(window as any).Hinweis = Hinweis;
