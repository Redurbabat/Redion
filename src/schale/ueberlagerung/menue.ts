/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/menue.ts (npm run bauen:ts). */
/* ============================================================================
 * schale/ueberlagerung/menue.js — Menüs und Kontextmenüs
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/menue.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/menue.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Zwei Sorten: das schlichte Menü und das mit Suchfeld. Der Unterschied ist
 * keine Geschmacksfrage — ab etwa fünfzehn Einträgen liest niemand mehr,
 * sondern sucht.
 *
 * Beide sorgen selbst dafür, dass sie ins Bild passen: ein Menü, das unten
 * aus dem Fenster ragt, klappt nach oben. Das klingt nach einer Kleinigkeit
 * und ist der Unterschied zwischen „geht" und „geht am Laptop nicht".
 *
 * Stammt aus der Schale; dort lag es zwischen 2800 Zeilen Anwendungslogik.
 * ==========================================================================*/

/**
 * Was ein Menü ausser seinem Inhalt noch haben kann.
 *
 * Alles freiwillig, und das ist keine Nachlässigkeit: die meisten Menüs
 * brauchen nichts davon. `titel` gilt nur am Telefon, `platzhalter`, `fuss`,
 * `kopf` und `breite` nur bei `menuMitSuche`.
 */
type MenueOptionen = {
  titel?: string;
  platzhalter?: string;
  fuss?: string;
  kopf?: string;
  breite?: number | string;
  /** Der Knopf, aus dem das Menü wächst (E712) — am Rechner steht es dann
   *  an ihm statt bei `x`/`y`, und zu fliesst es in ihn zurück. */
  anker?: HTMLElement | null;
  /** Drei runde Knöpfe oben im Menü (E712), die sich wie ein Tropfen aus
   *  dem Anker teilen. Jeder ist eine Abkürzung zu einem Eintrag, der
   *  darunter WEITER steht (§43) — `ziel` ist dessen Selektor. */
  tropfen?: TropfenKnopf[];
  /** 'menu' (E721): ein Menü mit Rolle, Namen, Pfeiltasten und Fokus — das
   *  Muster des Kits (ContextMenu/Menu), hier als Redion-Code. Freiwillig,
   *  damit die rund hundert alten Aufrufer sich nicht ändern. */
  rolle?: 'menu';
  /** Der Name des Menüs für den Vorleser („Aktionen für „Notizen""). */
  beschriftung?: string;
  /** Wohin der Fokus beim Öffnen geht: der erste Eintrag oder der gewählte. */
  fokus?: 'erster' | 'aktiv';
  /** Wohin der Fokus beim Schliessen zurückkehrt (Escape, Tab). */
  rueckfokus?: HTMLElement | null;
};

/** Ein runder Knopf oben im Menü (E712). */
type TropfenKnopf = {
  id: string;
  name: string;
  /** Ein Name aus `Register.symbole`. */
  zeichen: string;
  /** Der Eintrag darunter, den der Knopf auslöst — derselbe Weg, kein zweiter. */
  ziel?: string;
  /** Steht der Eintrag nicht in diesem Menü: was stattdessen geschieht. */
  tun?: () => void;
  /** Ein Umschalter, der im Menü stehen bleibt (das Merkzeichen): gibt den
   *  neuen Zustand zurück. */
  kippen?: () => boolean;
  /** Anfangszustand eines Umschalters. */
  an?: boolean;
};

const Menue = (() => {

  /** Auf dem Telefon werden aus Menüs Blätter, die von unten hochfahren. */
  const amTelefon = (): boolean =>
    typeof AppEinstellung !== 'undefined'
      ? AppEinstellung.amTelefon()
      : innerWidth <= 760 ||
        ((window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) &&
         innerHeight <= 500);

  /* DAS BLATT BEWEGT SICH WIE IM KIT (E702; Redur, 27.09., ca. 21:45: „Wie
   * im UI-Kit (Empfohlen)"). Wie das Aktionsblatt des Kits: herein vom Rand
   * auf der sanften Feder, der Grund blendet auf, es folgt dem Finger (nach
   * oben als Gummiband) und geht mit kurzem Abgang. Vorher (messungen §74):
   * 16 px aus dem Nichts, der Grund in EINEM Bild schwarz, jedes Schliessen
   * im selben Bild. SOFORT BLEIBEN Escape (E302), die Wahl eines Eintrags und
   * jedes `menu.remove()` — darauf bauen rund siebzig Prüfläufe. Den Abgang
   * bekommen nur Wegwischen und Danebentippen, und unter „Ruhig" auch sie nicht. */
  const blattBewegung = (m: HTMLElement, grund: HTMLElement, liste: HTMLElement | null,
                         schliessen: () => void): { herein: () => void; geht: () => void } => {
    const ruhig = (): boolean =>
      typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung();
    const feder = (name: 'smooth' | 'snappy'): { easing: string; duration: number } =>
      typeof RedionSpring !== 'undefined' ? RedionSpring.token(name) : { easing: 'ease-out', duration: 320 };
    const dauer = (marke: string, sonst: number): number => {
      const roh = getComputedStyle(document.documentElement).getPropertyValue(marke).trim();
      const n = parseFloat(roh);
      return Number.isFinite(n) ? (/ms$/.test(roh) ? n : n * 1000) : sonst;
    };
    const kurve = (marke: string, sonst: string): string =>
      getComputedStyle(document.documentElement).getPropertyValue(marke).trim() || sonst;
    /** Wo das Blatt gerade WIRKLICH steht (px unter der Ruhelage). */
    const jetzt = (): number => {
      const t = getComputedStyle(m).transform;
      return t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0;
    };
    const deckung = (): number => {
      const o = parseFloat(getComputedStyle(grund).opacity);
      return Number.isFinite(o) ? o : 1;
    };
    let lauf: Animation[] = [];
    const halt = (): void => { lauf.forEach(a => a.cancel()); lauf = []; };
    let weg = false;

    const herein = (): void => {
      if (ruhig()) return;
      const f = feder('smooth');
      lauf = [
        m.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
          { duration: f.duration, easing: f.easing }),
        grund.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: dauer('--motion-slow', 320), easing: kurve('--ease', 'ease-out') })
      ];
    };

    /** Hinaus: kurzer Abgang, dann erst aus dem Baum. */
    const geht = (): void => {
      if (weg || !m.isConnected) return;
      if (ruhig()) { schliessen(); return; }
      weg = true;
      m.dataset['abgang'] = '1';
      const von = jetzt(), grundVon = deckung();
      halt();
      m.style.transform = '';
      grund.style.opacity = '';
      const d = dauer('--motion-normal', 200), e = kurve('--ease-exit', 'ease-in');
      lauf = [
        m.animate([{ transform: `translateY(${von}px)` }, { transform: 'translateY(100%)' }],
          { duration: d, easing: e, fill: 'forwards' }),
        grund.animate([{ opacity: grundVon }, { opacity: 0 }], { duration: d, easing: e, fill: 'forwards' })
      ];
      let fertig = false;
      const ende = (): void => { if (fertig) return; fertig = true; schliessen(); };
      lauf[0]?.addEventListener('finish', ende);
      /* spätestens dann weg, auch ohne `finish` (wie usePresence im Kit) */
      setTimeout(ende, d + 120);
    };

    const zurueck = (von: number): void => {
      const grundVon = deckung();
      m.style.transform = '';
      grund.style.opacity = '';
      if (ruhig()) return;
      const f = feder('snappy');
      lauf = [
        m.animate([{ transform: `translateY(${von}px)` }, { transform: 'translateY(0)' }],
          { duration: f.duration, easing: f.easing }),
        grund.animate([{ opacity: grundVon }, { opacity: 1 }],
          { duration: dauer('--motion-normal', 200), easing: kurve('--ease', 'ease-out') })
      ];
    };

    /* Dem Finger nach — gegriffen am Griff oder am Titel. */
    let start: number | null = null, basis = 0, hoehe = 1, dy = 0, bild = 0;
    const tempo = typeof RedionSpring !== 'undefined' ? RedionSpring.velocityTracker() : null;
    const malen = (): void => {
      bild = 0;
      m.style.transform = `translateY(${dy.toFixed(1)}px)`;
      grund.style.opacity = String(Math.max(0, Math.min(1, 1 - Math.max(0, dy) / hoehe)));
    };
    /* `touches[0]` ist bei einem `touchstart` immer da — aber der Typ sagt
       es nicht, und eine Wischgeste, die auf `undefined` zugreift, wäre ein
       Fehler mitten in einer Berührung. Fehlt der Finger, passiert nichts. */
    m.addEventListener('touchstart', ev => {
      const f = ev.touches[0];
      const ziel = ev.target instanceof Element ? ev.target : null;
      if (!f || weg || !ziel?.closest('.blatt-griff, .blatt-titel')) { start = null; return; }
      basis = ruhig() ? 0 : jetzt();
      halt();
      hoehe = Math.max(1, m.offsetHeight);
      start = f.clientY;
      dy = basis;
      tempo?.reset();
      tempo?.add(f.clientY, ev.timeStamp);
      if (basis) malen();
    }, { passive: true });
    m.addEventListener('touchmove', ev => {
      const f = ev.touches[0];
      if (!f || start === null) return;
      ev.preventDefault();                   /* die Seite darunter rollt nicht mit */
      tempo?.add(f.clientY, ev.timeStamp);
      const roh = basis + f.clientY - start;
      /* Nach oben nur widerwillig — ein Gummiband, kein Losreissen. */
      dy = roh >= 0 ? roh
        : -(typeof RedionSpring !== 'undefined' ? RedionSpring.rubberband(-roh, Math.min(hoehe, 240)) : -roh * 0.3);
      if (ruhig()) return;
      if (!bild) bild = requestAnimationFrame(malen);
    }, { passive: false });
    const los = (ev: TouchEvent): void => {
      if (start === null) return;
      start = null;
      if (bild) { cancelAnimationFrame(bild); bild = 0; }
      const v = tempo ? tempo.velocity(ev.timeStamp) : 0;   /* px je Sekunde, nach unten positiv */
      /* 90 px (wie bisher) oder nach unten geschnippt, und die Liste steht oben */
      if ((dy > 90 || (v > 500 && dy > 8)) && (liste?.scrollTop || 0) <= 0) geht();
      else zurueck(dy);
    };
    m.addEventListener('touchend', los);
    m.addEventListener('touchcancel', los);

    return { herein, geht };
  };

  /* DER TROPFEN (E712; Redur, 27.09., ca. 22:05: „Schau mal das auch an ich
     will das auch haben"): drei runde Knöpfe oben, jeder eine ABKÜRZUNG zu
     einem Eintrag, der darunter bleibt (§43, §8). Fliessen: tropfen.ts. */
  const zeichenSvg = (k: TropfenKnopf, an: boolean): string => {
    if (k.kippen && typeof Merkzeichen !== 'undefined') {
      /* Das Band aus merkzeichen.ts: gefüllt oder offen (§38). */
      return '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true" focusable="false">' +
        `<path d="${Merkzeichen.BAND}" fill="${an ? 'currentColor' : 'none'}" stroke="currentColor" ` +
        'stroke-width="1.7" stroke-linejoin="round"></path></svg>';
    }
    try { return Register.symbole.alsSvg(k.zeichen, 20); } catch { return ''; }
  };
  const tropfenKopf = (knoepfe: TropfenKnopf[]): HTMLDivElement => {
    const kopf = document.createElement('div');
    kopf.className = 'ru-tropfen-kopf';
    for (const k of knoepfe) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ru-tropfen-knopf';
      b.dataset['tropfen'] = k.id;
      b.setAttribute('aria-label', k.name);
      b.title = k.name;
      if (k.kippen) b.setAttribute('aria-pressed', k.an ? 'true' : 'false');
      const rund = document.createElement('span');
      rund.className = 'ru-tropfen-rund';
      rund.setAttribute('aria-hidden', 'true');
      rund.innerHTML = zeichenSvg(k, !!k.an);     /* nur Zeichen aus dem Register, kein Nutzertext */
      const name = document.createElement('span');
      name.className = 'ru-tropfen-name';
      name.setAttribute('aria-hidden', 'true');
      name.textContent = k.name;
      b.append(rund, name);
      kopf.append(b);
    }
    return kopf;
  };
  const tropfenBinden = (m: HTMLElement, kopf: HTMLElement, knoepfe: TropfenKnopf[]): void => {
    kopf.addEventListener('click', ev => {
      const b = ev.target instanceof Element ? ev.target.closest<HTMLElement>('.ru-tropfen-knopf') : null;
      const k = b ? knoepfe.find(x => x.id === b.dataset['tropfen']) : undefined;
      if (!b || !k) return;
      ev.stopPropagation();
      if (k.kippen) {
        const an = k.kippen();
        b.setAttribute('aria-pressed', an ? 'true' : 'false');
        const rund = b.querySelector<HTMLElement>('.ru-tropfen-rund');
        if (rund) {
          rund.innerHTML = zeichenSvg(k, an);
          const svg = rund.querySelector('svg');
          if (an && svg && !(typeof Tropfen !== 'undefined' && Tropfen.still())) {
            const f = typeof RedionSpring !== 'undefined' ? RedionSpring.token('bouncy') : { easing: 'ease-out', duration: 400 };
            svg.animate([{ scale: '0.7' }, { scale: '1.25', offset: 0.35 }, { scale: '1' }],
              { duration: f.duration, easing: 'ease-out' });
          }
        }
        return;
      }
      const eintrag = k.ziel ? m.querySelector<HTMLElement>(`.menu-liste ${k.ziel}, :scope > ${k.ziel}`) : null;
      if (eintrag) { eintrag.click(); return; }
      if (k.tun) { m.remove(); k.tun(); }
    });
  };
  /** Am Knopf: darunter (rechtsbündig in der rechten Hälfte), sonst darüber. */
  const amAnker = (m: HTMLElement, anker: HTMLElement): void => {
    const a = anker.getBoundingClientRect();
    const r = m.getBoundingClientRect();
    const LUFT = 6;
    let left = (a.left + a.width / 2 > innerWidth / 2) ? a.right - r.width : a.left;
    let top = a.bottom + LUFT;
    if (top + r.height > innerHeight - 8 && a.top - LUFT - r.height >= 8) top = a.top - LUFT - r.height;
    left = Math.max(8, Math.min(left, innerWidth - r.width - 8));
    top = Math.max(8, Math.min(top, innerHeight - r.height - 8));
    m.style.left = left + 'px';
    m.style.top = top + 'px';
  };
  const rechteck = (el: Element): TropfenRechteck => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };
  /** Wie weit ein Element gerade senkrecht verschoben ist (sein `transform`). */
  const versatzY = (el: HTMLElement): number => {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none' || typeof DOMMatrixReadOnly === 'undefined') return 0;
    try { return new DOMMatrixReadOnly(t).m42; } catch { return 0; }
  };
  const tropfenAuf = (m: HTMLElement, kopf: HTMLElement, anker: HTMLElement, blatt: boolean): void => {
    if (typeof Tropfen === 'undefined' || Tropfen.still() || !anker.isConnected) return;
    const knoepfe = [...kopf.querySelectorAll<HTMLElement>('.ru-tropfen-rund')];
    /* Das Blatt steht hier noch unten (`herein`): zielen, wo die Knöpfe
       ankommen (Durchsicht E712). */
    const unten = blatt ? versatzY(m) : 0;
    const ziele = knoepfe.map(rechteck).map(r => ({ ...r, top: r.top - unten }));
    const a = rechteck(anker);
    if (!blatt) Tropfen.wachsen(m, a);
    const ankunft = Tropfen.teilen(a, ziele, blatt ? 300 : 40);
    if (!ankunft) return;
    const kurve = typeof RedionSpring !== 'undefined' ? RedionSpring.token('press') : { easing: 'ease-out', duration: 320 };
    [...kopf.querySelectorAll<HTMLElement>('.ru-tropfen-knopf')].forEach((b, i) => {
      b.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 140, delay: ankunft, easing: 'linear', fill: 'backwards' });
      const svg = b.querySelector('.ru-tropfen-rund > svg');
      svg?.animate([{ scale: '0.2' }, { scale: '1' }],
        { duration: kurve.duration, delay: ankunft + i * 40, easing: kurve.easing, fill: 'backwards' });
    });
  };

  /**
   * Ein Menü öffnen. `opt.titel` ist die Überschrift des Blattes auf dem
   * Telefon — am Rechner gibt es keine, weil das Menü dort beim Zeiger steht
   * und nicht erklärt werden muss.
   */
  const menu = (html: string, x: number, y: number, opt: MenueOptionen = {}): HTMLDivElement => {
    document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove());
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = html;
    const kopf = opt.tropfen?.length ? tropfenKopf(opt.tropfen) : null;
    if (kopf && opt.tropfen) {
      m.classList.add('ru-tropfen-menue');
      m.prepend(kopf);
      tropfenBinden(m, kopf, opt.tropfen);
    }
    const anker = opt.anker && opt.anker.isConnected ? opt.anker : null;
    /* Was zu in den Knopf zurückfliesst — gemessen in Ruhe. */
    let zuletzt: { flaeche: TropfenRechteck; kreise: TropfenRechteck[] } | null = null;
    const messen = (): void => {
      /* nicht mitten im Wachsen: dort ist die Scheibe noch gestaucht */
      if (!kopf || !m.isConnected || m.getAnimations().some(a => a.playState === 'running')) return;
      zuletzt = { flaeche: rechteck(m),
                  kreise: [...kopf.querySelectorAll('.ru-tropfen-rund')].map(rechteck) };
    };

    /* misst nach, wenn die Suche filtert; endet mit dem Menü */
    let nachmessen: ResizeObserver | null = null;

    let grund: HTMLDivElement | null = null;
    /* WOHIN DER FOKUS ZURÜCKGEHT (E721). Ein Menü mit Rolle gibt den Fokus
       beim Schliessen an den zurück, der es geöffnet hat — sonst steht man
       nach Escape am Anfang des Dokuments. */
    const vorher = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement : null;
    const rueckZiel: HTMLElement | null = opt.rolle === 'menu'
      ? (opt.rueckfokus || anker || vorher) : null;
    const rueck = (): void => {
      if (rueckZiel && rueckZiel.isConnected) rueckZiel.focus({ preventScroll: true });
    };
    const schliessen = (): void => {
      m.remove();
      grund?.remove();
    };
    const escape = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || !m.isConnected) return;
      e.preventDefault();
      e.stopPropagation();
      schliessen();
      rueck();
    };
    document.addEventListener('keydown', escape, true);

    /* Aufrufer entfernen ein Menü gewöhnlich selbst. Dann dürfen weder der
       Escape-Zuhörer noch der mobile Grund zurückbleiben. */
    const waechter = new MutationObserver(() => {
      if (m.isConnected) return;
      grund?.remove();
      document.removeEventListener('keydown', escape, true);
      waechter.disconnect();
      nachmessen?.disconnect();
      /* Zu fliesst es in den Knopf zurück (E712) — nur ein Bild, aria-hidden;
         das Menü selbst ist schon weg (Escape, Wahl, remove() bleiben sofort).
         Nach dem eigenen Abgang des Blattes (Wegwischen) fliesst nichts nach. */
      if (zuletzt && anker && anker.isConnected && typeof Tropfen !== 'undefined' && !m.dataset['abgang']) {
        const z: { flaeche: TropfenRechteck; kreise: TropfenRechteck[] } = zuletzt;
        Tropfen.vereinen(z.kreise, rechteck(anker), m.classList.contains('blatt') ? null : z.flaeche);
      }
    });

    if (amTelefon()) {
      /* Blatt von unten — genau wie in Notions Telefon-App */
      m.classList.add('blatt');
      m.setAttribute('aria-label', (opt.titel || 'Menü').slice(0, 80));

      const griff = document.createElement('div');
      griff.className = 'blatt-griff';
      griff.setAttribute('aria-hidden', 'true');
      m.prepend(griff);
      if (opt.titel) {
        const titel = document.createElement('div');
        titel.className = 'blatt-titel';
        titel.textContent = opt.titel;             /* kein Nutzertext als HTML */
        griff.after(titel);
      }

      /* Auch ein schlichtes, langes Menü braucht einen eigenen Rollbereich.
         Vorher rollte nur die Suchvariante; Primäraktionen konnten unter der
         Blattkante verschwinden. */
      let liste = m.querySelector<HTMLElement>(':scope > .menu-liste');
      if (!liste) {
        liste = document.createElement('div');
        liste.className = 'menu-liste menu-liste-ohne-suche';
        [...m.childNodes].filter(n => n !== griff &&
          (!(n instanceof HTMLElement) ||
           (!n.classList.contains('blatt-titel') && !n.classList.contains('ru-tropfen-kopf'))))
          .forEach(n => liste!.appendChild(n));
        m.appendChild(liste);
      }

      grund = document.createElement('div');
      grund.className = 'menu-grund';
      grund.setAttribute('aria-hidden', 'true');
      document.body.appendChild(grund);
      /* SOFORT IN RUHELAGE (E702). Bis hier kam `.auf` ein Bild später, und
         die Übergangsregel von `.menu.blatt` sollte das Blatt hochfahren —
         am Telefon lief sie nie, weil `blatt-hoch` (16 px) darüberlag. Jetzt
         steht das Blatt vom ersten Bild an in seiner Ruhelage, und die
         Bewegung dorthin fährt `bewegung()` unten: vom Rand herein. */
      m.classList.add('auf');
      document.body.appendChild(m);
      const zug = blattBewegung(m, grund, liste, schliessen);
      grund.addEventListener('click', zug.geht);

      /* Fast alle Aufrufer schliessen ihr Menü nach einer Aktion mit
         `menu.remove()` — vom Grund wissen sie nichts, den gibt es nur am
         Telefon. Er blieb dann als unsichtbare dunkle Wand stehen und
         frass genau einen Tipp. Der Wächter nimmt ihn mit, sobald das
         Menü aus dem Baum verschwindet — egal, wer es entfernt hat. */
      waechter.observe(document.body, { childList: true });
      /* Nach unten wischen schliesst es — und seit E702 folgt das Blatt
         dabei dem Finger (`blattBewegung`). */
      /* Einträge in Karten gruppieren — iOS-Art, wie in Notions App:
         was zwischen zwei Trennlinien steht, kommt in eine Karte. */
      const ziel = liste;
      const kinder = [...ziel.children];
      let karte: HTMLDivElement | null = null;
      kinder.forEach(el => {
        if (el.tagName === 'HR') { karte = null; el.remove(); return; }
        if (el.classList.contains('grp') || el.classList.contains('menu-fuss') ||
            el.classList.contains('menu-suche') || el.classList.contains('av-karte') ||
            el.classList.contains('av-besch') || el.classList.contains('sp-kopf')) {
          karte = null; return;
        }
        if (!karte) {
          karte = document.createElement('div');
          karte.className = 'blatt-karte';
          ziel.insertBefore(karte, el);
        }
        karte.appendChild(el);
      });
      /* Löschen ist rot — genau wie bei Notion */
      /* … und seit E721 jede Aktion, die sich als Gefahr meldet. */
      m.querySelectorAll('[data-a="del"], [data-a="purge"], [data-gefahr]').forEach(x => x.classList.add('rot'));

      zug.herein();
      if (kopf && anker) {
        tropfenAuf(m, kopf, anker, true);
        const f = typeof RedionSpring !== 'undefined' ? RedionSpring.token('smooth').duration : 320;
        setTimeout(messen, f + 40);
      }
      return m;
    }

    document.body.appendChild(m);
    waechter.observe(document.body, { childList: true });

    /* Die runden Knöpfe kommen oben DAZU, die Liste behält ihren Platz
       (Nachtrag E712; studio.css 8a). */
    if (kopf) m.style.setProperty('--ru-tropfen-kopf', kopf.offsetHeight + 'px');
    /* Nicht über den Rand — und mit Anker AN ihm (E712; „Neu erstellen"
       stand bei (0, 0), oben links, weit weg vom „+"). */
    if (anker) amAnker(m, anker);
    else {
      const r = m.getBoundingClientRect();
      m.style.left = Math.max(8, Math.min(x, innerWidth  - r.width  - 8)) + 'px';
      m.style.top  = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
    }
    if (kopf && anker) {
      messen();
      tropfenAuf(m, kopf, anker, false);
      if (typeof ResizeObserver !== 'undefined') { nachmessen = new ResizeObserver(messen); nachmessen.observe(m); }
    }
    if (opt.rolle === 'menu') menueRolle(m, opt, rueck);

    setTimeout(() => {
      const zu = (e: MouseEvent) => {
        const ziel = e.target instanceof Node ? e.target : null;
        if (!ziel || !m.contains(ziel)) { m.remove(); document.removeEventListener('mousedown', zu); }
      };
      document.addEventListener('mousedown', zu);
    }, 0);
    return m;
  };

  /**
   * Ein Menü mit Suchfeld und Fusszeile — das Muster, das in Notion in
   * fast jedem grösseren Menü steckt („Aktionen filtern…", „Suchaktionen…").
   * Getippt wird sofort gefiltert; Pfeiltasten und Enter wählen aus.
   *
   * `opt`: `platzhalter`, `fuss`, `kopf`, `breite` — und `titel` wird an
   * `menu` durchgereicht, für das Blatt am Telefon.
   */
  const menuMitSuche = (html: string, x: number, y: number,
                        opt: MenueOptionen = {}): HTMLDivElement => {
    const m = menu(
      (opt.kopf || '') +
      `<div class="menu-suche"><input placeholder="${opt.platzhalter || 'Filtern …'}" ` +
      'autocomplete="off" spellcheck="false"></div>' +
      '<div class="menu-liste">' + html + '</div>' +
      (opt.fuss ? '<div class="menu-fuss">' + opt.fuss + '</div>' : ''),
      x, y, {
        ...(opt.titel === undefined ? {} : { titel: opt.titel }),
        ...(opt.anker ? { anker: opt.anker } : {}),
        ...(opt.tropfen ? { tropfen: opt.tropfen } : {})
      });
    if (opt.breite && !m.classList.contains('blatt')) m.style.width = String(opt.breite);

    const feld = m.querySelector<HTMLInputElement>('.menu-suche input');
    const liste = m.querySelector<HTMLElement>('.menu-liste');
    /* Beides steht in der Zeichenkette oben — aber `querySelector` weiss das
       nicht, und ein Menü ohne Suchfeld wäre ein Menü ohne Suche und nicht
       ein Absturz. */
    if (!feld || !liste) return m;

    const sichtbare = (): HTMLButtonElement[] => [...liste.querySelectorAll('button')]
      .filter(b => b.offsetParent !== null || b.style.display !== 'none')
      .filter(b => b.style.display !== 'none' &&
                   (!(b.parentElement instanceof HTMLElement) ||
                    !b.parentElement.style.display ||
                    b.parentElement.style.display !== 'none'));

    const markiere = (b: HTMLElement | null | undefined): void => {
      liste.querySelectorAll('button.jetzt').forEach(x2 => x2.classList.remove('jetzt'));
      /* Die leise Marke gleitet mit (E711) — dasselbe Material wie in der
         Suche und der Palette, hier als Fläche statt Akzent. */
      if (!b) { SelectionFlow.highlight(liste, null, { still: true }); return; }
      b.classList.add('jetzt');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      SelectionFlow.highlight(liste, b, { still: true });
    };

    /* Der Filter kennt die Form des Menüs nicht: Knöpfe können direkt
       darinliegen oder in einem Gitter stecken. Deshalb wird nach Knöpfen
       gesucht, nicht nach einer bestimmten Verschachtelung. */
    const filtern = (): void => {
      const q = feld.value.trim().toLowerCase();
      let gruppe: HTMLElement | null = null, inGruppe = 0;

      const abschliessen = (): void => {
        if (gruppe && !inGruppe) gruppe.style.display = 'none';
      };

      [...liste.children].forEach(kind => {
        if (!(kind instanceof HTMLElement)) return;
        const el = kind;
        if (el.classList.contains('grp')) {
          abschliessen();
          gruppe = el; inGruppe = 0;
          el.style.display = '';
          return;
        }
        if (el.tagName === 'HR') { el.style.display = q ? 'none' : ''; return; }

        const knoepfe: HTMLElement[] = el.tagName === 'BUTTON'
          ? [el] : [...el.querySelectorAll<HTMLElement>('button')];
        if (!knoepfe.length) return;
        let sichtbar = 0;
        knoepfe.forEach(b => {
          const treffer = !q || (b.textContent || '').toLowerCase().includes(q);
          b.style.display = treffer ? '' : 'none';
          if (treffer) sichtbar++;
        });
        if (el.tagName !== 'BUTTON') el.style.display = sichtbar ? '' : 'none';
        inGruppe += sichtbar;
      });
      abschliessen();

      markiere(sichtbare()[0]);
    };

    feld.addEventListener('input', filtern);
    feld.addEventListener('keydown', e => {
      const alle = sichtbare();
      const i = alle.findIndex(b => b.classList.contains('jetzt'));
      if (e.key === 'ArrowDown') { e.preventDefault(); markiere(alle[Math.min(i + 1, alle.length - 1)]); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); markiere(alle[Math.max(i - 1, 0)]); }
      if (e.key === 'Enter')     { e.preventDefault(); (alle[i] || alle[0])?.click(); }
      if (e.key === 'Escape')    { e.preventDefault(); m.remove(); }
    });
    liste.addEventListener('mousemove', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      const b = ziel?.closest<HTMLElement>('button');
      if (b && !b.classList.contains('jetzt')) markiere(b);
    });

    markiere(sichtbare()[0]);
    setTimeout(() => feld.focus(), 30);
    return m;
  };

  /* ------------------------------------------------------------------------
   * EIN ÜBERBLEIBSEL, das `noUnusedLocals` gefunden hat.
   *
   * Hier standen `let toastTimer = null;` und darunter der Kommentarblock zu
   * `toast(text, dauer)` — ohne die Funktion. Die ist beim Aufteilen nach
   * `hinweis.js` gewandert; der Zähler und die Beschreibung blieben zurück.
   *
   * Das ist die unangenehmere Sorte toter Code: nicht ein ungenutztes Stück
   * Logik, sondern eine BESCHREIBUNG von etwas, das hier nicht mehr ist. Wer
   * die Datei liest, sucht danach.
   * ----------------------------------------------------------------------*/

  /* ========================================================================
   * EIN MENÜ JE DING (E721)
   * ------------------------------------------------------------------------
   * Redur, Masterprompt vom 29. September 2026, S. 19: „Hier füge ... und
   * oder beim rechts klicke sollte es mir zeigen löschen". Was folgt, ist
   * das Muster des Touch Kits — ContextMenu und Menu (Popover.tsx): Rolle,
   * Pfeiltasten, Fokus, Rechtsklick, Kontextmenü-Taste, langes Drücken —
   * als Redion-Code nachgebaut, nicht als Insel geladen (kein fremder Code,
   * derselbe Weg wie E709 beim runden Löschknopf).
   * ======================================================================*/

  /** §19: Nutzertext wird escaped, alle fünf Zeichen. */
  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const zeichenVon = (name: string): string => {
    if (!name || typeof Register === 'undefined' || !Register.symbole) return '';
    try { return Register.symbole.hat?.(name) === false ? '' : Register.symbole.alsSvg(name, 16); }
    catch { return ''; }
  };

  /** Die Einträge, durch die die Pfeiltasten gehen: Knöpfe der Liste,
   *  nicht abgeschaltet, sichtbar. Die runden Tropfen-Knöpfe oben (E712)
   *  sind Abkürzungen zu Einträgen DARUNTER — sie zählen nicht mit. */
  const eintraege = (m: HTMLElement): HTMLElement[] =>
    [...m.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')]
      .filter(b => !(b as HTMLButtonElement).disabled && b.getClientRects().length > 0);

  /** Rolle, Namen, Fokus und Pfeiltasten für ein Menü am Rechner. Das Kit
   *  nennt es `moveMenuFocus`: hinunter, hinauf, an den Anfang, ans Ende;
   *  abgeschaltete Einträge werden übersprungen, am Ende geht es von vorn
   *  weiter. Tab schliesst — ein Menü ist kein Formular. */
  const menueRolle = (m: HTMLDivElement, opt: MenueOptionen, rueck: () => void): void => {
    m.setAttribute('role', 'menu');
    if (opt.beschriftung) m.setAttribute('aria-label', opt.beschriftung.slice(0, 120));
    m.querySelectorAll<HTMLElement>('button').forEach(b => {
      if (b.closest('.ru-tropfen-kopf')) { b.tabIndex = -1; return; }
      if (!b.getAttribute('role')) b.setAttribute('role', 'menuitem');
      b.tabIndex = -1;
    });
    m.querySelectorAll('hr, .sep').forEach(x => x.setAttribute('role', 'separator'));
    m.querySelectorAll('.grp').forEach(x => x.setAttribute('role', 'presentation'));
    m.addEventListener('keydown', e => {
      const liste = eintraege(m);
      if (!liste.length) return;
      const i = liste.indexOf(document.activeElement as HTMLElement);
      let ziel: HTMLElement | undefined;
      if (e.key === 'ArrowDown') ziel = liste[(i + 1) % liste.length];
      else if (e.key === 'ArrowUp') ziel = liste[(i - 1 + liste.length) % liste.length];
      else if (e.key === 'Home') ziel = liste[0];
      else if (e.key === 'End') ziel = liste[liste.length - 1];
      if (ziel) { e.preventDefault(); e.stopPropagation(); ziel.focus({ preventScroll: false }); return; }
      if (e.key === 'Tab') { e.preventDefault(); m.remove(); rueck(); }
    });
    if (opt.fokus) {
      const liste = eintraege(m);
      const aktiv = opt.fokus === 'aktiv'
        ? liste.find(b => b.getAttribute('aria-current') === 'true') : undefined;
      (aktiv || liste[0])?.focus({ preventScroll: true });
    }
  };

  /* ---- AUFGEKLAPPT (E721, Durchsicht vom 10. Oktober) --------------------
     Ein Knopf mit aria-haspopup verspricht dem Vorleser ein Menü;
     aria-expanded sagt, ob es GERADE offen ist. Es stand nie da — das „…"
     der Karte und das ⋯ der Seitenleiste sagten nur „hat ein Menü". Hier
     setzt es, wer ein Menü an seinem Anker öffnet, und es fällt zurück,
     sobald das Menü aus dem Baum geht, egal wer es entfernt hat. Eine Zeile
     eines Baums (treeitem) bleibt aussen vor: dort heisst aria-expanded
     „aufgeklappt", nicht „Menü offen". Öffnet derselbe Anker gleich ein
     neues Menü, setzt der Wächter des alten nichts zurück (`offenAm`). */
  const offenAm = new WeakMap<HTMLElement, HTMLElement>();
  const aufgeklappt = (anker: HTMLElement | null | undefined, m: HTMLElement): void => {
    if (!anker || !anker.hasAttribute('aria-haspopup')) return;
    if (/^(treeitem|row|gridcell|option)$/.test(anker.getAttribute('role') || '')) return;
    anker.setAttribute('aria-expanded', 'true');
    offenAm.set(anker, m);
    const wache = new MutationObserver(() => {
      if (m.isConnected) return;
      wache.disconnect();
      if (offenAm.get(anker) !== m) return;
      offenAm.delete(anker);
      anker.setAttribute('aria-expanded', 'false');
    });
    wache.observe(document.body, { childList: true });
  };

  /** Die Aktionen eines Dings als Menü — aus `Register.aktionen`, nirgends
   *  sonst. `wo.x`/`wo.y`: am Zeiger (Rechtsklick); sonst am Anker
   *  (das „…", die Karte bei Umschalt+F10). Gibt `null` zurück, wenn es für
   *  dieses Ding hier nichts zu tun gibt. */
  const aktionen = (ding: any, ort: AktionOrt,
                    wo: { x?: number; y?: number; rueckfokus?: HTMLElement | null } = {}): HTMLDivElement | null => {
    const R = typeof Register !== 'undefined' ? Register.aktionen : null;
    if (!R || !ding) return null;
    const zeilen: AktionZeile[] = R.fuer(ding, ort);
    if (!zeilen.length) return null;
    let html = '', gruppe = '';
    for (const z of zeilen) {
      if (gruppe && z.gruppe !== gruppe) html += '<hr>';
      gruppe = z.gruppe;
      html += `<button type="button" data-a="${esc(z.id)}"${z.gefahr ? ' data-gefahr' : ''}>` +
        `<span class="mi">${zeichenVon(z.zeichen)}</span>${esc(z.name)}` +
        (z.taste ? `<span class="ms">${esc(z.taste)}</span>` : '') + '</button>';
    }
    const name = String(ding.text || '').trim() || 'Ohne Titel';
    const anker = ort.anker && ort.anker.isConnected ? ort.anker : null;
    const amZeiger = typeof wo.x === 'number' && typeof wo.y === 'number';
    let x = wo.x ?? 0, y = wo.y ?? 0;
    if (!amZeiger && anker) { const r = anker.getBoundingClientRect(); x = r.left; y = r.bottom + 4; }
    const m = menu(html, x, y, {
      titel: name, rolle: 'menu', beschriftung: 'Aktionen für „' + name + '“', fokus: 'erster',
      rueckfokus: wo.rueckfokus ?? anker,
      /* Am Zeiger wächst nichts aus einem Knopf — dort steht es, wo geklickt wurde. */
      ...(amZeiger || !anker ? {} : { anker })
    });
    aufgeklappt(anker, m);
    m.addEventListener('click', e => {
      const b = e.target instanceof Element ? e.target.closest<HTMLElement>('button[data-a]') : null;
      if (!b || !m.contains(b)) return;
      const id = b.dataset['a'] || '';
      m.remove();
      const frisch = (typeof Store !== 'undefined' && Store.getBlock(ding.id)) || ding;
      /* Über das Register-Objekt, nicht über eine gemerkte Funktion: so geht
         jeder Weg durch genau diese eine Tür (test597 §7). */
      Register.aktionen.tun(id, frisch, ort);
    });
    return m;
  };

  /* ---- NACHZÜGLER EINER BERÜHRUNG (E83, hierher geholt in E721) ----------
     Beim Loslassen nach langem Drücken schickt der Browser noch mousedown,
     mouseup und click hinterher. Die träfen den frisch geöffneten Menügrund
     und schlössen das Menü im selben Atemzug. Sie werden einmal geschluckt.
     Nach einem Wisch kommen keine — deshalb räumt jede neue Berührung die
     alten Fänger weg (`nachzueglerWeg`), und die Uhr ist nur die letzte
     Besenkammer. Das stand bis E721 nur im Langdruck der Blöcke
     (einstellungen/pwa.ts); jetzt benutzen ihn Blöcke, Karten, Bäume und
     Hefte gemeinsam — ein Langdruck, nicht zwei. */
  let schluckerWeg: (() => void) | null = null;
  const nachzuegler = (): void => {
    const schlucken = (ev: Event): void => { ev.stopPropagation(); ev.preventDefault(); };
    const arten = ['mousedown', 'mouseup', 'click'];
    arten.forEach(t => document.addEventListener(t, schlucken, { capture: true, once: true }));
    const weg = (): void => {
      arten.forEach(t => document.removeEventListener(t, schlucken, { capture: true }));
      /* Nur das EIGENE Merkzeichen löschen — die Uhr eines alten Fängers
         darf nicht das eines neueren nullen. */
      if (schluckerWeg === weg) schluckerWeg = null;
    };
    schluckerWeg = weg;
    setTimeout(weg, 800);
  };
  const nachzueglerWeg = (): void => { if (schluckerWeg) schluckerWeg(); };

  /** Wie lange ein Finger liegen muss, bis etwas gehoben ist (E83). */
  const HALTEN_MS = 500;
  /** Wie weit er sich dabei bewegen darf, bevor es Rollen ist. */
  const WEG_PX = 10;

  type BinderAuftrag = {
    /** Welche Elemente unter der Wurzel Dinge sind. */
    auswahl: string;
    /** Öffnet das Menü des Dings. `false` heisst: hier gibt es keines
     *  (dann bleibt der Rechtsklick dem Browser). */
    oeffnen: (el: HTMLElement, wo: { x?: number; y?: number; tastatur: boolean }) => boolean | void;
    /** Entf auf einem fokussierten Ding. `false`: nichts getan. */
    entf?: (el: HTMLElement) => boolean | void;
    /** Langes Drücken (Vorgabe: ja). Ein Selektor heisst: nur diese Dinge —
     *  die Notizhefte heben ihre Hefte selbst (E368) und lassen dem Binder
     *  nur die Fächer. */
    halten?: boolean | string;
  };

  const gebunden = new WeakMap<HTMLElement, BinderAuftrag>();

  /**
   * EIN Binder je Behälter — nicht je Karte (E721). Rechtsklick öffnet am
   * Zeiger; die Kontextmenü-Taste und Umschalt+F10 auf dem fokussierten Ding
   * öffnen an ihm; Entf auf dem fokussierten Ding ruft dessen Gefahr-Aktion
   * mit der Taste „Entf"; langes Drücken (500 ms, wie E83) hebt das Ding an
   * und öffnet beim Loslassen ohne Bewegung das Menü. Bewegt sich der Finger
   * mehr als 10 px, war es Rollen. Wird derselbe Behälter neu gezeichnet und
   * wieder gebunden, gilt nur der neue Auftrag — Zuhörer stapeln sich nicht.
   */
  const aktionenBinden = (wurzel: HTMLElement, auftrag: BinderAuftrag): void => {
    if (gebunden.has(wurzel)) { gebunden.set(wurzel, auftrag); return; }
    gebunden.set(wurzel, auftrag);
    const a = (): BinderAuftrag => gebunden.get(wurzel) || auftrag;
    const dingVon = (t: EventTarget | null): HTMLElement | null => {
      const el = t instanceof Element ? t.closest<HTMLElement>(a().auswahl) : null;
      return el && wurzel.contains(el) ? el : null;
    };
    let finger = false;
    let zuletztHalt = 0, zuletztTaste = 0;
    let halt: { el: HTMLElement; x: number; y: number; uhr: number; gehoben: boolean } | null = null;
    const abbrechen = (): void => {
      if (!halt) return;
      clearTimeout(halt.uhr);
      delete halt.el.dataset['gehoben'];
      halt = null;
    };

    wurzel.addEventListener('contextmenu', e => {
      const el = dingVon(e.target);
      if (!el) return;
      /* Während ein Finger liegt, gehört die Geste dem langen Drücken —
         Android schickt dabei selbst ein contextmenu. Und eine Taste, die
         eben schon geöffnet hat, öffnet nicht ein zweites Mal. */
      /* (Die Taste eben: nur ein contextmenu, das NICHT von der rechten
         Maustaste kommt — ein echter Rechtsklick gleich danach gilt.) */
      if (finger || Date.now() - zuletztHalt < 900 || (Date.now() - zuletztTaste < 400 && e.button !== 2)) {
        e.preventDefault();
        return;
      }
      /* Umschalt + rechte Maustaste lässt das Menü des Browsers durch —
         dieselbe Hintertür wie im Editor. */
      if (e.shiftKey && e.button === 2) return;
      if (a().oeffnen(el, { x: e.clientX, y: e.clientY, tastatur: false }) !== false) e.preventDefault();
    });

    wurzel.addEventListener('keydown', e => {
      const el = dingVon(e.target);
      if (!el || e.target !== el) return;
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault();
        e.stopPropagation();
        zuletztTaste = Date.now();
        a().oeffnen(el, { tastatur: true });
        return;
      }
      const entf = a().entf;
      if (e.key === 'Delete' && entf && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (entf(el) !== false) { e.preventDefault(); e.stopPropagation(); }
      }
    });

    wurzel.addEventListener('touchstart', e => {
      finger = true;
      nachzueglerWeg();
      abbrechen();
      const h = a().halten;
      if (h === false || e.touches.length !== 1) return;
      const el = dingVon(e.target);
      const t = e.touches[0];
      if (!el || !t || (typeof h === 'string' && !el.matches(h))) return;
      const neu = { el, x: t.clientX, y: t.clientY, gehoben: false, uhr: 0 };
      neu.uhr = window.setTimeout(() => {
        if (halt !== neu || !el.isConnected) return;
        neu.gehoben = true;
        el.dataset['gehoben'] = '';
        if (navigator.vibrate) navigator.vibrate(12);
      }, HALTEN_MS);
      halt = neu;
    }, { passive: true });
    wurzel.addEventListener('touchmove', e => {
      const t = e.touches[0];
      if (!halt || !t) return;
      if (Math.abs(t.clientX - halt.x) > WEG_PX || Math.abs(t.clientY - halt.y) > WEG_PX) abbrechen();
    }, { passive: true });
    wurzel.addEventListener('touchend', e => {
      if (e.touches.length) return;
      finger = false;
      if (!halt) return;
      const { el, gehoben } = halt;
      abbrechen();
      if (!gehoben || !el.isConnected) return;
      zuletztHalt = Date.now();
      nachzuegler();
      a().oeffnen(el, { tastatur: true });
    });
    wurzel.addEventListener('touchcancel', () => { finger = false; abbrechen(); });
  };

  /* ---- DIE EINE AUSWAHLLISTE (E721) -------------------------------------
     „Ort", „Art", „Form" der Bibliothek, „Heute ⌃" und „Übersicht ⌃" im
     Lernzentrum: lauter Listen, in denen GENAU EINES gewählt ist. Bis hier
     baute jede ihre eigene. Das hier ist die eine — mit ✓ und
     aria-current am Gewählten, aria-expanded am Anker, Pfeiltasten, und
     der Fokus kehrt an den Anker zurück. */
  type WahlOption = { id: string; name: string; zeichen?: string; aktiv?: boolean };
  type WahlAuftrag = {
    anker: HTMLElement;
    titel: string;
    gruppen: Array<{ name?: string; optionen: WahlOption[] }>;
    beiWahl: (id: string) => void;
  };

  /* Jede Gruppe ist eine BENANNTE Gruppe (role=group, aria-labelledby auf
     ihre Überschrift). Die Überschrift allein trug role=presentation und
     wurde im Menü nie vorgelesen (Durchsicht vom 10. Oktober, test597 §14).
     Die Überschrift bleibt ausserhalb der Gruppe stehen, damit das Blatt
     am Telefon sie wie bisher über die Karte setzt. */
  let wahlNr = 0;
  const wahl = (w: WahlAuftrag): HTMLDivElement => {
    const html = w.gruppen.map(g => {
      const gid = 'wahl-gruppe-' + (++wahlNr);
      return (g.name ? `<div class="grp" id="${gid}">${esc(g.name)}</div>` : '') +
        `<div role="group"${g.name ? ` aria-labelledby="${gid}"` : ''}>` +
        g.optionen.map(o =>
          `<button type="button" role="menuitemradio" data-wahl="${esc(o.id)}" ` +
          `aria-checked="${o.aktiv ? 'true' : 'false'}"${o.aktiv ? ' aria-current="true"' : ''}>` +
          `<span class="mi">${o.zeichen ? zeichenVon(o.zeichen) : ''}</span>${esc(o.name)}` +
          `<span class="ms wahl-haken" aria-hidden="true">${o.aktiv ? '✓' : ''}</span></button>`).join('') +
        '</div>';
    }).join('<hr>');
    const r = w.anker.getBoundingClientRect();
    w.anker.setAttribute('aria-haspopup', 'menu');
    const m = menu(html, r.left, r.bottom + 4, {
      titel: w.titel, rolle: 'menu', beschriftung: w.titel, fokus: 'aktiv',
      rueckfokus: w.anker, anker: w.anker
    });
    aufgeklappt(w.anker, m);
    const zu = (): void => { w.anker.setAttribute('aria-expanded', 'false'); };
    m.addEventListener('click', e => {
      const b = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-wahl]') : null;
      if (!b || !m.contains(b)) return;
      m.remove();
      zu();
      if (w.anker.isConnected) w.anker.focus({ preventScroll: true });
      w.beiWahl(b.dataset['wahl'] || '');
    });
    return m;
  };

  return { menu, menuMitSuche, amTelefon, aktionen, aktionenBinden, wahl, aufgeklappt,
           nachzuegler, nachzueglerWeg, HALTEN_MS };
})();

(window as any).Menue = Menue;
