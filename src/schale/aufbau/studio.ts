/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/studio.ts (npm run bauen:ts). */
/* Redion Studio: shortcuts into existing controllers; no content storage. */
const StudioSchale = (() => {
  let gestartet = false;
  const META = 'studio:navigation-kompakt';
  const BREITE = 'studio:navigation-breite';
  const bewegt = new Set<Animation>();
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)');
  ruhig.addEventListener('change', () => {
    if (ruhig.matches) { bewegt.forEach(a => a.cancel()); bewegt.clear(); }
  });
  /** Nur echte Navigation animieren, nicht jeden Such-/Editor-Rerender.
      Keine Papier-/Canvas-Transformation: Ink-Koordinaten bleiben unverändert. */
  const ankommen = (element: Element | null, x = 0, y = 6, delay = 0): void => {
    /* „Ruhige Darstellung" zählt wie das System (E702) — gefragt beim Aufruf. */
    const still = ruhig.matches || (typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung());
    if (!element || still || document.hidden || typeof element.animate !== 'function') return;
    /* eine Bewegung zugleich: gleitet die Bühne herein, nicht auch die Karten (E702) */
    if (element.closest('#scroll.wisch-links, #scroll.wisch-rechts')) return;
    const tokens = getComputedStyle(document.documentElement);
    const zeit = tokens.getPropertyValue('--motion-normal').trim();
    const duration = parseFloat(zeit) * (zeit.endsWith('ms') ? 1 : 1000) || 200;
    const animation = element.animate([
      { opacity: .35, transform: `translate(${x}px,${y}px)` },
      { opacity: 1, transform: 'none' }
    ], { duration, delay, fill: 'backwards', easing: tokens.getPropertyValue('--ease-enter').trim() || 'ease-out' });
    bewegt.add(animation);
    animation.onfinish = animation.oncancel = () => { bewegt.delete(animation); };
  };
  /** Die Breite der Navigation, hart begrenzt auf 148–260 (E440). Sie steht
   *  als `--studio-nav-expanded` am body; `studio.css` leitet die Spalte seit
   *  E716 ebenfalls am body davon ab — vorher auf `:root`, wo der Wert nie
   *  ankam, und die Spalte blieb stehen. */
  const breiteSetzen = (wert: number): number => {
    const breite = Math.max(148, Math.min(260, Math.round(wert)));
    document.body.style.setProperty('--studio-nav-expanded', breite + 'px');
    return breite;
  };
  /** Die GEZEICHNETE Breite von #kante — gemessen, nicht das Attribut. Eine
   *  Prüfung, die das Attribut liest, das der Griff selbst schreibt, misst
   *  den Griff und nicht seine Wirkung (E716). */
  const gezeichnet = (): number =>
    Math.round(document.getElementById('kante')?.getBoundingClientRect().width || 0);
  /** Das Attribut sagt, was zu sehen ist: auch im Band 761–1100 px (156)
   *  und nach dem Zurücksetzen. Kompakt (62) und unsichtbar bleibt der
   *  letzte Wert der offenen Navigation stehen — 62 läge unter
   *  `aria-valuemin`. */
  const ariaNachziehen = (): void => {
    const divider = document.getElementById('studio-divider');
    const breite = gezeichnet();
    if (!divider || breite < 148 || breite > 260 || document.body.dataset.studioNav === 'kompakt' ||
        !matchMedia('(min-width: 761px)').matches) return;
    divider.setAttribute('aria-valuenow', String(breite));
    divider.setAttribute('aria-valuetext', breite + ' Pixel breit');
  };
  /** Zurück zur Vorgabe der CSS — 184 px, im Band 761–1100 px 156 — und die
   *  gemerkte Breite vergessen. EIN Weg für den Doppelklick auf den Trenner
   *  und den Palettenbefehl (E716); dieselben Worte wie beim Griff der
   *  Seitenleiste (schale.ts, `seitenleisteBreite`). */
  const breiteZuruecksetzen = (): void => {
    document.body.style.removeProperty('--studio-nav-expanded');
    Store.setMeta(BREITE, null);
    ariaNachziehen();
    Kontextkante.zeichne();
    UI.toast('Breite zurückgesetzt');
  };
  const themaMarkieren = (): void => {
    const hell = document.documentElement.dataset.theme === 'light';
    const b = document.getElementById('studio-theme');
    b?.setAttribute('aria-label', hell ? 'Dunkles Farbschema einschalten' : 'Helles Farbschema einschalten');
    if (b) b.title = hell ? 'Dunkles Farbschema' : 'Helles Farbschema';
  };
  /** Hell ↔ Dunkel, mit dem gemerkten Schema je Grund. EIN Weg für den
   *  Kreis im Studio-Kopf und die Kachel „Dunkel" (E712, §8). */
  const themaWechseln = (): void => {
    const hell = document.documentElement.dataset.theme === 'light';
    if (typeof Aussehen !== 'undefined') {
      const aktuell = Aussehen.einstellung();
      Store.setMeta('studio:schema-' + (hell ? 'light' : 'dark'), aktuell.schema);
      const ziel = hell ? 'dark' : 'light';
      const gemerkt = Store.getMeta('studio:schema-' + ziel, hell ? 'standard' : 'hell');
      const schema = Aussehen.SCHEMATA.find(s => s.id === gemerkt && s.grund === ziel);
      Aussehen.setzen({ schema: schema?.id || (hell ? 'standard' : 'hell') });
    } else Einstellungen.S('theme', hell ? 'dark' : 'light');
    themaMarkieren();
  };
  const einstellen = (kompakt: boolean): void => {
    document.body.dataset.studioNav = kompakt ? 'kompakt' : 'offen';
    const knopf = document.getElementById('studio-nav');
    knopf?.setAttribute('aria-pressed', String(kompakt));
    const name = kompakt ? 'Navigation mit Beschriftungen anzeigen' : 'Navigation kompakt anzeigen';
    knopf?.setAttribute('aria-label', name);
    if (knopf) knopf.title = name;
  };
  const start = (): void => {
    if (gestartet) return;
    gestartet = true;
    einstellen(Store.getMeta(META, false) === true);
    /* Nur eine wirklich gemerkte Breite wird geschrieben; sonst gilt die
       Vorgabe der CSS (E716). Bis dahin schrieb der Start immer 184 und
       hätte damit die 156 im Band 761–1100 px überdeckt. `null` heisst seit
       E716 „Vorgabe" — so schreibt es das Zurücksetzen. */
    const gespeichert: unknown = Store.getMeta(BREITE, null);
    const zahl = typeof gespeichert === 'number' ? gespeichert
      : typeof gespeichert === 'string' && gespeichert.trim() ? Number(gespeichert) : NaN;
    if (Number.isFinite(zahl)) breiteSetzen(zahl);
    const an = (id: string, tun: () => void): void => {
      document.getElementById(id)?.addEventListener('click', tun);
    };
    an('studio-home', () => Bibliothek.oeffne());
    an('studio-search', () => App.suche());
    an('studio-create', () => App.erstellenBlatt(document.getElementById('studio-create')));
    an('studio-import', () => Bibliothek.pdfImportieren());
    an('studio-account', () => App.arbeitsbereich());
    /* Dieselbe Handlung wie `mb-glocke` im Band (menueband.ts). */
    an('studio-glocke', () => { try { Ansichten.posteingang(); } catch { /* ohne Posteingang bleibt der Kopf */ } });
    /* Der Klick bleibt der Posteingang; beim Zeigen fächern die letzten
       drei Meldungen auf (E711, hinweis.ts). */
    Hinweis.faecherBinden(document.getElementById('studio-glocke'));
    /* Die Sterne (E463): sie stehen nur, solange ein Auftrag läuft, und
       öffnen dasselbe Fenster wie der Knopf im Menüband. */
    an('studio-auftraege', () => {
      if (typeof AuftragsAnzeige !== 'undefined') AuftragsAnzeige.oeffnen();
    });
    an('studio-tools', () => {
      if (document.body.dataset.studioTools === 'offen') Menueband.schliessen();
      else Menueband.aufklappen();
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || document.body.dataset.studioTools !== 'offen') return;
      if (document.querySelector('.overlay,.menu,[role="dialog"]')) return;
      Menueband.schliessen();
      document.getElementById('studio-tools')?.focus();
    });
    an('studio-theme', themaWechseln);
    new MutationObserver(themaMarkieren).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    themaMarkieren();
    const divider = document.getElementById('studio-divider');
    /* Das Attribut folgt der gezeichneten Kante: EIN Beobachter deckt das
       Ziehen, das Band 761–1100, kompakt und das Zurücksetzen. Er läuft nach
       dem Layout, liest also keine Breite mitten im Ziehen nach (E716). */
    const kante = document.getElementById('kante');
    if (kante && typeof ResizeObserver !== 'undefined') new ResizeObserver(ariaNachziehen).observe(kante);
    ariaNachziehen();
    /* Ein Zug: Zeiger, Anfangspunkt und -breite, was vorher am body stand
       (für Escape und einen verlorenen Fang), wo der Zeiger zuletzt war und
       ob er sich bewegt hat. */
    type Zug = { id: number; x: number; breite: number; vorher: string; letzteX: number; bewegt: boolean };
    let zug: Zug | null = null;
    let bild = 0;
    const merken = (): void => { Store.setMeta(BREITE, gezeichnet()); Kontextkante.zeichne(); };
    const zugEnde = (): void => {
      cancelAnimationFrame(bild); bild = 0;
      zug = null; document.body.classList.remove('studio-resizing');
    };
    /* Abbruch (pointercancel, verlorener Fang, Escape): die Breite von vorher
       zurück, nichts merken. */
    const zugZurueck = (): void => {
      if (!zug) return;
      if (zug.vorher) document.body.style.setProperty('--studio-nav-expanded', zug.vorher);
      else document.body.style.removeProperty('--studio-nav-expanded');
      zugEnde();
    };
    divider?.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      zug = { id: event.pointerId, x: event.clientX, breite: gezeichnet(), letzteX: event.clientX,
              vorher: document.body.style.getPropertyValue('--studio-nav-expanded'), bewegt: false };
      divider.setPointerCapture(event.pointerId); event.preventDefault();
      document.body.classList.add('studio-resizing');
    });
    /* Ein Bild, eine Breite: die Bewegungen werden über `requestAnimationFrame`
       gesammelt, das Layout rechnet je Bild einmal. */
    divider?.addEventListener('pointermove', event => {
      if (zug?.id !== event.pointerId) return;
      zug.letzteX = event.clientX;
      if (zug.letzteX !== zug.x) zug.bewegt = true;
      if (!bild) bild = requestAnimationFrame(() => {
        bild = 0;
        if (zug?.bewegt) breiteSetzen(zug.breite + zug.letzteX - zug.x);
      });
    });
    divider?.addEventListener('pointerup', event => {
      if (zug?.id !== event.pointerId) return;
      const z = zug;
      if (event.clientX !== z.x) { z.letzteX = event.clientX; z.bewegt = true; }
      if (z.bewegt) breiteSetzen(z.breite + z.letzteX - z.x);
      zugEnde();
      /* Ein Klick ohne Bewegung schreibt nichts (E716). */
      if (z.bewegt && gezeichnet() !== z.breite) merken();
    });
    divider?.addEventListener('pointercancel', event => { if (zug?.id === event.pointerId) zugZurueck(); });
    divider?.addEventListener('lostpointercapture', event => { if (zug?.id === event.pointerId) zugZurueck(); });
    /* Escape mitten im Ziehen stellt die Anfangsbreite her. Im Fangen VOR
       allen anderen: beim Ziehen ist kein Fenster offen, und das Menüband
       soll nicht zugleich zugehen. */
    window.addEventListener('keydown', event => {
      if (!zug || event.key !== 'Escape') return;
      event.preventDefault(); event.stopImmediatePropagation();
      const id = zug.id;
      zugZurueck();
      if (divider?.hasPointerCapture(id)) divider.releasePointerCapture(id);
    }, true);
    /* Tasten wie beim Fenstertrenner (WAI-ARIA): ←/→ 8 px, mit Umschalt
       32 px, Bild↑/Bild↓ 32 px, Pos1 das Minimum, Ende das Maximum. */
    const SCHRITT: Record<string, number> = { ArrowLeft: -8, ArrowRight: 8, PageDown: -32, PageUp: 32 };
    divider?.addEventListener('keydown', event => {
      const jetzt = gezeichnet();
      const schritt = SCHRITT[event.key];
      let ziel: number;
      if (event.key === 'Home') ziel = 148;
      else if (event.key === 'End') ziel = 260;
      else if (schritt !== undefined) ziel = jetzt + schritt * (event.shiftKey && event.key.startsWith('Arrow') ? 4 : 1);
      else return;
      event.preventDefault();
      breiteSetzen(ziel);
      ariaNachziehen();
      if (gezeichnet() !== jetzt) merken();
    });
    divider?.addEventListener('dblclick', () => breiteZuruecksetzen());
    /* Derselbe Weg ohne Geste — für Finger und Tastatur (E716). */
    if (typeof Register !== 'undefined' && Register.befehle) Register.befehle.melde({
      gruppe: 'Ansicht', titel: 'Navigationsbreite zurücksetzen', tun: breiteZuruecksetzen,
      zeigen: () => matchMedia('(min-width: 761px)').matches && document.body.dataset.schale === 'premium' &&
        document.body.dataset.studioNav !== 'kompakt' && document.body.dataset.dokument !== 'an' &&
        /* Im Fokus-Modus ist der Trenner ausgeblendet (studio.css): dort
           stellt man die Breite nicht ein, wie kompakt und im Dokument —
           also auch kein Befehl dafür (test592 §5). */
        !document.body.classList.contains('fokus')
    });
    an('studio-nav', () => {
      const kompakt = document.body.dataset.studioNav !== 'kompakt';
      einstellen(kompakt);
      Store.setMeta(META, kompakt);
      Kontextkante.zeichne();
    });
    const bar = document.getElementById('studio-bar');
    if (bar) Register.symbole.fuelle(bar);
    let letzterOrt = location.hash;
    let frame = 0;
    const ortBelebt = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (letzterOrt === location.hash) return;
        letzterOrt = location.hash;
        bewegt.forEach(a => a.cancel()); bewegt.clear();
        ankommen(document.querySelector('#page .bib-dkopf,#page .bib-titel,#page .aw-kopf'));
        document.querySelectorAll('#page .bib-gitter>.bib-deckel:nth-child(-n+6)')
          .forEach((karte, i) => ankommen(karte, 0, 8, i * 24));
      });
    };
    window.addEventListener('redion:schauplatz', ortBelebt);
    window.addEventListener('hashchange', ortBelebt);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { bewegt.forEach(a => a.cancel()); bewegt.clear(); }
    });
  };
  return { start, themaWechseln, breiteZuruecksetzen };
})();
