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
  const amTelefon = (): boolean => innerWidth <= 760;

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

    if (amTelefon()) {
      /* Blatt von unten — genau wie in Notions Telefon-App */
      m.classList.add('blatt');
      m.innerHTML = '<div class="blatt-griff"></div>' +
        (opt.titel ? `<div class="blatt-titel">${opt.titel}</div>` : '') + html;
      const grund = document.createElement('div');
      grund.className = 'menu-grund';
      grund.addEventListener('click', () => { m.remove(); grund.remove(); });
      document.body.appendChild(grund);
      document.body.appendChild(m);
      /* Nach unten wischen schliesst es */
      let start = 0;
      /* `touches[0]` ist bei einem `touchstart` immer da — aber der Typ sagt
         es nicht, und eine Wischgeste, die auf `undefined` zugreift, wäre ein
         Fehler mitten in einer Berührung. Fehlt der Finger, passiert nichts. */
      m.addEventListener('touchstart', e => {
        const f = e.touches[0];
        if (f) start = f.clientY;
      }, { passive: true });
      m.addEventListener('touchend', e => {
        const f = e.changedTouches[0];
        if (!f) return;
        const weg = f.clientY - start;
        if (weg > 90 && m.scrollTop <= 0) { m.remove(); grund.remove(); }
      });
      /* Einträge in Karten gruppieren — iOS-Art, wie in Notions App:
         was zwischen zwei Trennlinien steht, kommt in eine Karte. */
      const ziel = m.querySelector('.menu-liste') || m;
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

      requestAnimationFrame(() => m.classList.add('auf'));
      return m;
    }

    document.body.appendChild(m);

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
      if (!b) return;
      b.classList.add('jetzt');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
