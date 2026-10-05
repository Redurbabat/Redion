/* schale/bedienung/kacheln.ts — Glaskacheln oben in „Mehr" und in den
 * Einstellungen (E712). ERZEUGT: quell/schale/bedienung/kacheln.js.
 * Aus dem Video „LIQUID GLASS" (Redur, 27.09., ca. 22:05). Jede Kachel ist ein
 * zweiter Griff an eine Einstellung, deren alter Ort bleibt (§43): Dunkel =
 * StudioSchale.themaWechseln, Fokus = Werkzeuge.fokus, Ruhig/Kontrast/Schrift/
 * Abstand = Einstellungen.S, Zeitmesser = Zeitmesser.panel. Farbe als Deckkraft
 * einer Schicht, Füllung als scaleY, Druck durch press.ts; gerollt eine
 * Chipleiste. Kein Weichzeichner hinter Kacheln (E703). */

type KachelArt = 'schalter' | 'weg' | 'regler';
type Kachel = {
  id: string;
  name: string;
  kurz: string;
  zeichen: string;
  art: KachelArt;
  breit?: boolean;
  an?: () => boolean;
  tun?: () => void;
  schluessel?: string;
  stufen?: readonly string[];
  namen?: readonly string[];
  stand?: () => string;
  /** Trennstellen des Namens (weicher Strich, Durchsicht E712). */
  teile?: readonly string[];
};

const Schnellkacheln = (() => {

  const V = (k: string, sonst: unknown): any =>
    typeof Einstellungen !== 'undefined' ? Einstellungen.V(k, sonst) : sonst;
  const S = (k: string, wert: unknown): void => {
    if (typeof Einstellungen !== 'undefined') Einstellungen.S(k, wert);
  };

  const KACHELN: readonly Kachel[] = [
    { id: 'dunkel', name: 'Dunkel', kurz: 'Dunkel', zeichen: 'moon', art: 'schalter',
      an: () => document.documentElement.dataset['theme'] !== 'light',
      tun: () => {
        if (typeof StudioSchale !== 'undefined') StudioSchale.themaWechseln();
        else S('theme', document.documentElement.dataset['theme'] === 'light' ? 'dark' : 'light');
      } },
    { id: 'fokus', name: 'Fokus-Modus', kurz: 'Fokus', zeichen: 'eye', art: 'schalter',
      an: () => document.body.classList.contains('fokus'),
      tun: () => { if (typeof Werkzeuge !== 'undefined') Werkzeuge.fokus(); } },
    { id: 'ruhig', name: 'Ruhige Darstellung', kurz: 'Ruhig', zeichen: 'calm', art: 'schalter',
      an: () => V('bewegung', 'normal') === 'ruhig',
      tun: () => S('bewegung', V('bewegung', 'normal') === 'ruhig' ? 'normal' : 'ruhig') },
    { id: 'kontrast', name: 'Hoher Kontrast', kurz: 'Kontrast', zeichen: 'contrast', art: 'schalter',
      an: () => !!V('kontrast', false),
      tun: () => S('kontrast', !V('kontrast', false)) },
    { id: 'zeit', name: 'Zeitmesser', kurz: 'Zeitmesser', zeichen: 'clock', art: 'weg', breit: true,
      tun: () => { if (typeof Zeitmesser !== 'undefined') Zeitmesser.panel(); },
      stand: () => {
        const z = typeof Zeitmesser !== 'undefined' ? Zeitmesser.stand() : null;
        if (!z || !z.laeuft) return 'Stoppuhr und Timer';
        const m = Math.floor(z.sekunden / 60), s = z.sekunden % 60;
        return (z.pausiert ? 'Angehalten · ' : 'Läuft · ') + m + ':' + String(s).padStart(2, '0');
      } },
    { id: 'schrift', name: 'Schriftgrösse', kurz: 'Schrift', zeichen: 'textSize', art: 'regler',
      schluessel: 'schriftgroesse', stufen: ['klein', 'normal', 'gross'], namen: ['Klein', 'Normal', 'Gross'],
      teile: ['Schrift', 'grösse'] },
    { id: 'abstand', name: 'Zeilenabstand', kurz: 'Abstand', zeichen: 'menu', art: 'regler',
      schluessel: 'dichte', stufen: ['eng', 'normal', 'weit'], namen: ['Eng', 'Normal', 'Weit'],
      teile: ['Zeilen', 'abstand'] }
  ];

  const zeichen = (name: string): string => {
    try { return Register.symbole.alsSvg(name, 22); } catch { return ''; }
  };

  const stufe = (k: Kachel): number => {
    const i = (k.stufen || []).indexOf(String(V(k.schluessel || '', 'normal')));
    return i < 0 ? 1 : i;
  };

  const standText = (k: Kachel): string => {
    if (k.art === 'schalter') return k.an?.() ? 'An' : 'Aus';
    if (k.art === 'regler') return (k.namen || [])[stufe(k)] || '';
    return k.stand ? k.stand() : '';
  };

  const baue = (k: Kachel, chip: boolean): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = chip ? 'ru-kachel-chip' : 'ru-kachel' + (k.breit ? ' ru-kachel-breit' : '') +
      (k.art === 'regler' ? ' ru-kachel-regler' : '');
    b.dataset['kachel'] = k.id;
    if (k.art === 'regler' && !chip) {
      b.setAttribute('role', 'slider');
      b.setAttribute('aria-orientation', 'vertical');
      b.setAttribute('aria-valuemin', '0');
      b.setAttribute('aria-valuemax', String((k.stufen || []).length - 1));
      b.setAttribute('aria-label', k.name);
      const f = document.createElement('span');
      f.className = 'ru-kachel-fuellung';
      f.setAttribute('aria-hidden', 'true');
      b.append(f);
    }
    const z = document.createElement('span');
    z.className = 'ru-kachel-zeichen';
    z.setAttribute('aria-hidden', 'true');
    z.innerHTML = zeichen(k.zeichen);            /* nur ein Zeichen aus dem Register */
    const n = document.createElement('span');
    n.className = 'ru-kachel-name';
    n.textContent = chip ? k.kurz : k.teile ? k.teile.join('\u00AD') : k.name;
    b.append(z, n);
    if (!chip) {
      const s = document.createElement('span');
      s.className = 'ru-kachel-stand';
      b.append(s);
    }
    return b;
  };

  /** Jede Kachel und jeder Chip im Dokument zeigt den jetzigen Stand. */
  const markieren = (): void => {
    document.querySelectorAll<HTMLElement>('.ru-kachel[data-kachel], .ru-kachel-chip[data-kachel]').forEach(b => {
      const k = KACHELN.find(x => x.id === b.dataset['kachel']);
      if (!k) return;
      const chip = b.classList.contains('ru-kachel-chip');
      const text = standText(k);
      if (k.art === 'schalter') b.setAttribute('aria-pressed', k.an?.() ? 'true' : 'false');
      if (k.art === 'regler') {
        const i = stufe(k);
        if (chip) b.setAttribute('aria-label', k.name + ': ' + text);
        else {
          b.setAttribute('aria-valuenow', String(i));
          b.setAttribute('aria-valuetext', text);
          b.style.setProperty('--ru-kachel-fuellung', String((i + 1) / (k.stufen || []).length));
        }
      }
      if (k.art === 'weg' && chip) b.setAttribute('aria-label', k.name + ': ' + text);
      const s = b.querySelector('.ru-kachel-stand');
      if (s && s.textContent !== text) s.textContent = text;
      b.title = k.name + ' — ' + text;
    });
    /* Die Felder in „Allgemein" zeigen denselben Stand (§43). */
    for (const [feld, wert] of [['schriftgroesse', V('schriftgroesse', 'normal')], ['dichte', V('dichte', 'normal')],
                                ['bewegung', V('bewegung', 'normal')]] as const) {
      document.querySelectorAll<HTMLSelectElement>(`select[data-set="${feld}"]`).forEach(s => {
        if (s.value !== wert) s.value = String(wert);
      });
    }
    const hoch = !!V('kontrast', false);
    document.querySelectorAll<HTMLElement>('.schalter[data-toggle="kontrast"]').forEach(s => {
      s.classList.toggle('an', hoch);
      s.setAttribute('aria-checked', hoch ? 'true' : 'false');
    });
  };

  const regeln = (k: Kachel, schritt: number | 'anfang' | 'ende'): void => {
    const zahl = (k.stufen || []).length;
    const jetzt = stufe(k);
    const neu = schritt === 'anfang' ? 0 : schritt === 'ende' ? zahl - 1
      : Math.max(0, Math.min(zahl - 1, jetzt + schritt));
    if (neu === jetzt) return;
    S(k.schluessel || '', (k.stufen || [])[neu]);
    markieren();
  };

  const bedienen = (wurzel: HTMLElement): void => {
    wurzel.addEventListener('click', e => {
      const b = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-kachel]') : null;
      const k = b ? KACHELN.find(x => x.id === b.dataset['kachel']) : undefined;
      if (!b || !k) return;
      if (b.dataset['gezogen']) { delete b.dataset['gezogen']; return; }
      /* Ein Tipp auf einen Regler: eine Stufe weiter, oben wieder unten. */
      if (k.art === 'regler') {
        const i = stufe(k), zahl = (k.stufen || []).length;
        S(k.schluessel || '', (k.stufen || [])[(i + 1) % zahl]);
      } else {
        /* Ein Weg führt hinaus: aus einem Fenster (Einstellungen) erst
           schliessen, dann gehen — wie die Wege der Einstellungen selbst.
           Sonst ging die Uhr HINTER dem Fenster auf (dritte Durchsicht E712). */
        if (k.art === 'weg') b.closest('.overlay')?.remove();
        k.tun?.();
      }
      markieren();
    });
    wurzel.addEventListener('keydown', e => {
      const b = e.target instanceof Element ? e.target.closest<HTMLElement>('.ru-kachel-regler[data-kachel]') : null;
      const k = b ? KACHELN.find(x => x.id === b.dataset['kachel']) : undefined;
      if (!b || !k) return;
      const taste: Record<string, number | 'anfang' | 'ende'> = {
        ArrowUp: 1, ArrowRight: 1, PageUp: 1, ArrowDown: -1, ArrowLeft: -1, PageDown: -1,
        Home: 'anfang', End: 'ende'
      };
      const s = taste[e.key];
      if (s === undefined) return;
      e.preventDefault();
      regeln(k, s);
    });
    /* Ziehen: eine Stufe je 28 px, mit Maus und Stift; der Finger rollt die
       Seite und tippt (Durchsicht E712). */
    let zug: { id: number; y: number; k: Kachel; b: HTMLElement; start: number } | null = null;
    wurzel.addEventListener('pointerdown', e => {
      const b = e.target instanceof Element ? e.target.closest<HTMLElement>('.ru-kachel-regler[data-kachel]') : null;
      const k = b ? KACHELN.find(x => x.id === b.dataset['kachel']) : undefined;
      if (!b || !k) return;
      /* ein Zug ohne Klick schluckt nicht den nächsten Tipp */
      delete b.dataset['gezogen'];
      if (e.pointerType === 'touch') return;
      /* Der Regler hält den Zeiger fest: auch draussen losgelassen endet der
         Zug (Nachtrag E712 — sonst stellte danach schon das Darüberfahren). */
      try { b.setPointerCapture(e.pointerId); } catch { /* dann endet er beim Loslassen darauf */ }
      zug = { id: e.pointerId, y: e.clientY, k, b, start: stufe(k) };
    });
    wurzel.addEventListener('pointermove', e => {
      if (!zug || e.pointerId !== zug.id) return;
      if (!(e.buttons & 1)) { los(e); return; }
      const schritte = Math.round((zug.y - e.clientY) / 28);
      if (!schritte) return;
      zug.b.dataset['gezogen'] = '1';
      zug.b.setAttribute('data-haelt', '');
      const zahl = (zug.k.stufen || []).length;
      const ziel = Math.max(0, Math.min(zahl - 1, zug.start + schritte));
      if (ziel !== stufe(zug.k)) { S(zug.k.schluessel || '', (zug.k.stufen || [])[ziel]); markieren(); }
    });
    const los = (e: PointerEvent): void => {
      if (!zug || e.pointerId !== zug.id) return;
      zug.b.removeAttribute('data-haelt');
      zug = null;
    };
    wurzel.addEventListener('pointerup', los);
    wurzel.addEventListener('pointercancel', los);
    wurzel.addEventListener('lostpointercapture', los);
  };

  /* Ändert es jemand woanders (Feld, Strg ⇧ L/F, Aussehen), ziehen sie nach. */
  const beobachter = new WeakMap<HTMLElement, IntersectionObserver>();
  let horcht = false;
  const horchen = (): void => {
    if (horcht) return;
    horcht = true;
    const nach = (): void => { if (document.querySelector('.ru-kachel')) markieren(); };
    new MutationObserver(nach).observe(document.body,
      { attributes: true, attributeFilter: ['class', 'data-schrift', 'data-dichte', 'data-bewegung', 'data-kontrast'] });
    new MutationObserver(nach).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    /* Die Uhr meldet jeden Schritt (zeitmesser.ts, Nachtrag E712). */
    document.addEventListener('redion:zeitmesser', () => {
      if (document.querySelector('[data-kachel="zeit"]')) markieren();
    });
  };

  /** Nach `nach` (sonst oben in `ziel`); rollt `rolle`, wird es eine Leiste. */
  const einsetzen = (ziel: HTMLElement | null, opt: { nach?: Element | null; rolle?: HTMLElement | null } = {}): void => {
    if (!ziel) return;
    ziel.querySelectorAll(':scope > .ru-kacheln, :scope > .ru-kacheln-leiste').forEach(x => x.remove());
    const teil = document.createElement('section');
    teil.className = 'ru-kacheln';
    teil.setAttribute('aria-label', 'Schnelleinstellungen');
    const gitter = document.createElement('div');
    gitter.className = 'ru-kacheln-gitter';
    KACHELN.forEach(k => gitter.append(baue(k, false)));
    teil.append(gitter);

    /* Die Leiste hat Höhe 0 und klebt oben — beim Erscheinen springt nichts. */
    const leiste = document.createElement('div');
    leiste.className = 'ru-kacheln-leiste';
    leiste.hidden = true;
    const reihe = document.createElement('div');
    reihe.className = 'ru-kacheln-reihe';
    reihe.setAttribute('role', 'group');
    reihe.setAttribute('aria-label', 'Schnelleinstellungen');
    KACHELN.forEach(k => reihe.append(baue(k, true)));
    leiste.append(reihe);

    if (opt.nach && opt.nach.parentElement === ziel) opt.nach.after(teil, leiste);
    else ziel.prepend(teil, leiste);
    bedienen(teil);
    bedienen(leiste);
    horchen();
    markieren();

    const rolle = opt.rolle || null;
    if (!rolle || typeof IntersectionObserver === 'undefined') return;
    const zeigen = (an: boolean): void => {
      if (leiste.hidden === !an) return;
      const still = typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung();
      if (an) {
        leiste.hidden = false;
        if (!still) {
          const f = typeof RedionSpring !== 'undefined' ? RedionSpring.token('snappy') : { easing: 'ease-out', duration: 300 };
          reihe.animate([{ opacity: 0, transform: 'translateY(-10px) scale(.96)' }, { opacity: 1, transform: 'none' }],
            { duration: f.duration, easing: f.easing });
        }
      } else if (still) leiste.hidden = true;
      else {
        const a = reihe.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'linear' });
        a.finished.then(() => { leiste.hidden = true; }).catch(() => { leiste.hidden = true; });
      }
    };
    const io = new IntersectionObserver(eintraege => {
      for (const e of eintraege) {
        const oben = e.boundingClientRect.bottom < (e.rootBounds?.top ?? 0) + 8;
        zeigen(!e.isIntersecting && oben);
      }
    }, { root: rolle, threshold: 0 });
    /* Wer „Mehr" neu zeichnet, nimmt den alten Beobachter mit (Nachtrag E712). */
    beobachter.get(rolle)?.disconnect();
    beobachter.set(rolle, io);
    io.observe(gitter);
  };

  return { KACHELN, einsetzen, markieren };
})();

(window as any).Schnellkacheln = Schnellkacheln;
