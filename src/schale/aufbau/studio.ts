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
  const breiteSetzen = (wert: number): number => {
    const breite = Math.max(148, Math.min(260, Math.round(wert)));
    document.body.style.setProperty('--studio-nav-expanded', breite + 'px');
    document.getElementById('studio-divider')?.setAttribute('aria-valuenow', String(breite));
    return breite;
  };
  const themaMarkieren = (): void => {
    const hell = document.documentElement.dataset.theme === 'light';
    const b = document.getElementById('studio-theme');
    b?.setAttribute('aria-label', hell ? 'Dunkles Farbschema einschalten' : 'Helles Farbschema einschalten');
    if (b) b.title = hell ? 'Dunkles Farbschema' : 'Helles Farbschema';
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
    const gespeichert = Number(Store.getMeta(BREITE, 184));
    breiteSetzen(Number.isFinite(gespeichert) ? gespeichert : 184);
    const an = (id: string, tun: () => void): void => {
      document.getElementById(id)?.addEventListener('click', tun);
    };
    an('studio-home', () => Bibliothek.oeffne());
    an('studio-search', () => App.suche());
    an('studio-create', () => App.erstellenBlatt());
    an('studio-import', () => Bibliothek.pdfImportieren());
    an('studio-account', () => App.arbeitsbereich());
    /* Dieselbe Handlung wie `mb-glocke` im Band (menueband.ts). */
    an('studio-glocke', () => { try { Ansichten.posteingang(); } catch { /* ohne Posteingang bleibt der Kopf */ } });
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
    an('studio-theme', () => {
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
    });
    new MutationObserver(themaMarkieren).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    themaMarkieren();
    const divider = document.getElementById('studio-divider');
    let ziehen: { id: number; x: number; breite: number } | null = null;
    const jetztBreite = (): number => Number(divider?.getAttribute('aria-valuenow')) || 184;
    const merken = (): void => { Store.setMeta(BREITE, jetztBreite()); Kontextkante.zeichne(); };
    divider?.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      ziehen = { id: event.pointerId, x: event.clientX, breite: jetztBreite() };
      divider.setPointerCapture(event.pointerId); event.preventDefault();
      document.body.classList.add('studio-resizing');
    });
    divider?.addEventListener('pointermove', event => {
      if (ziehen?.id === event.pointerId) breiteSetzen(ziehen.breite + event.clientX - ziehen.x);
    });
    const ende = (event: PointerEvent): void => {
      if (ziehen?.id !== event.pointerId) return;
      if (event.type === 'pointercancel') breiteSetzen(ziehen.breite);
      ziehen = null; document.body.classList.remove('studio-resizing'); merken();
    };
    divider?.addEventListener('pointerup', ende);
    divider?.addEventListener('pointercancel', ende);
    divider?.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      breiteSetzen(event.key === 'Home' ? 148 : event.key === 'End' ? 260 : jetztBreite() + (event.key === 'ArrowRight' ? 8 : -8));
      merken();
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
  return { start };
})();
