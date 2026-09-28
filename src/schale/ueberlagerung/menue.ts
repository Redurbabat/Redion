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

    let grund: HTMLDivElement | null = null;
    const schliessen = (): void => {
      m.remove();
      grund?.remove();
    };
    const escape = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || !m.isConnected) return;
      e.preventDefault();
      e.stopPropagation();
      schliessen();
    };
    document.addEventListener('keydown', escape, true);

    /* Aufrufer entfernen ein Menü gewöhnlich selbst. Dann dürfen weder der
       Escape-Zuhörer noch der mobile Grund zurückbleiben. */
    const waechter = new MutationObserver(() => {
      if (m.isConnected) return;
      grund?.remove();
      document.removeEventListener('keydown', escape, true);
      waechter.disconnect();
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
          (!(n instanceof HTMLElement) || !n.classList.contains('blatt-titel')))
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
      m.querySelectorAll('[data-a="del"], [data-a="purge"]').forEach(x => x.classList.add('rot'));

      zug.herein();
      return m;
    }

    document.body.appendChild(m);
    waechter.observe(document.body, { childList: true });

    /* Nicht über den Rand hinausragen lassen */
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x, innerWidth  - r.width  - 8)) + 'px';
    m.style.top  = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';

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
      x, y, opt.titel === undefined ? {} : { titel: opt.titel });
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

  return { menu, menuMitSuche, amTelefon };
})();

(window as any).Menue = Menue;
