/* Redurs 15 Vorlagen: lokale Dekoration, keine gespeicherten Werte. */
type MotionEffectId = 'folder' | 'sliders' | 'light' | 'gradient' | 'letters' |
  'liquid' | 'toggle' | 'carousel' | 'glass' | 'metric' | 'status' | 'ticket' |
  'orb' | 'filament' | 'transport';

const RedionMotion = (() => {
  const metricSelector = '.stat-karte.lw-metrik > strong, .rmo-health-metric > strong';
  const effects: ReadonlyArray<{ id: MotionEffectId; place: string; selector: string }> = [
    { id: 'folder', place: 'Bibliotheksordner', selector: '.bib-deckel[data-art="ordner"]' },
    { id: 'sliders', place: 'Einstellungen, KI-Quellen, Datenbankfilter', selector: '#btn-settings, [data-k="einstellungen"], #ai-quellen, button[data-a="filter"]' },
    { id: 'light', place: 'Elektro, Lernen, Bestandsübersicht', selector: '.els-kachel, .stat-karte.lw-metrik, .pf-karte' },
    { id: 'gradient', place: 'PDF öffnen, Neue Seite, KI senden', selector: '[data-studio-import], #btn-neu-handy, #ai-senden, [data-rmo-new]' },
    { id: 'letters', place: 'KI-Werkzeuge und Befehle', selector: '.ru-funkel, .ai-action-group button' },
    { id: 'liquid', place: 'KI-, Agenten-, Import- und Exportaufträge', selector: '.ki-aktivitaet, .ru-zustand, .ru-zk, .ru-lader, .ru-drucker, [data-studio-import], .ag-motion-status' },
    { id: 'toggle', place: 'Einstellungen und Automationen', selector: '.schalter, .mschalter' },
    { id: 'carousel', place: 'Zuletzt geöffnete Dokumente, leeres Regal', selector: '.rmo-recent, .bib-leer' },
    { id: 'glass', place: 'Primäre Dialogaktionen', selector: '.fbtns button.prim' },
    { id: 'metric', place: 'Lernfortschritt und Bestandsgesundheit: Zahl, Ring und Herz', selector: metricSelector + ', .stat-karte.lw-metrik, .rmo-health-metric' },
    { id: 'status', place: 'Synchronisierung, Sicherung, KI, Automationen', selector: '.ru-zustand, .ru-lader, .ki-aktivitaet, .ag-motion-status, .rmo-product-status' },
    { id: 'ticket', place: 'PDF-Druck und Export', selector: '.ru-drucker' },
    { id: 'orb', place: 'KI-Schaltfläche und Kopfzeile', selector: '#btn-ai, #ai .ai-head' },
    { id: 'filament', place: 'Strom im Elektro-Schaltplan', selector: '.sp-start' },
    { id: 'transport', place: 'Zeitmesser Start/Pause/Beenden', selector: '.rmo-transport' }
  ];
  const selector = effects.map(effect => effect.selector).join(',');
  const watched = new WeakSet<Element>();
  let observer: MutationObserver | null = null;
  let visibility: IntersectionObserver | null = null;
  const set = (element: Element, name: string, value: string): void => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  };
  const ornament = (name: string): HTMLSpanElement => {
    const element = document.createElement('span');
    element.className = name;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };
  const ensure = (element: Element, name: string, build?: (node: HTMLSpanElement) => void): void => {
    if (element.querySelector(':scope > .' + name)) return;
    const node = ornament(name);
    build?.(node);
    element.prepend(node);
  };
  const prepareMetric = (element: Element): void => {
    const value = element.textContent || '';
    if (element.querySelector('.rmo-number-source')?.textContent === value) return;
    if (!/\d/.test(value) || !/^[\d.,’'%+\-−:/\s]+$/.test(value) || value.length > 18) {
      if (element.classList.contains('rmo-number')) element.classList.remove('rmo-number');
      return;
    }
    const source = document.createElement('span');
    source.className = 'rmo-number-source'; source.textContent = value;
    const reels = ornament('rmo-reels');
    for (const [index, character] of Array.from(value).entries()) {
      const digit = document.createElement('span');
      digit.className = /\d/.test(character) ? 'rmo-digit' : 'rmo-separator';
      digit.dataset['rmoCharacter'] = character;
      digit.style.setProperty('--rmo-digit', /\d/.test(character) ? character : '0');
      digit.style.setProperty('--rmo-delay', Math.min(index * 30, 180) + 'ms');
      reels.append(digit);
    }
    element.classList.add('rmo-number'); element.replaceChildren(source, reels);
  };
  const state = (element: Element): string => {
    const source = element.getAttribute('data-zustand');
    if (source) return source;
    if (element.matches('.ki-aktivitaet, [aria-busy="true"]')) return 'laeuft';
    if (element.matches('.schalter, .mschalter, .sp-start')) return element.classList.contains('an') ? 'an' : 'aus';
    return element.hasAttribute('disabled') ? 'inaktiv' : 'bereit';
  };
  const decorateElement = (element: Element): void => {
    const ids = effects.filter(effect => element.matches(effect.selector)).map(effect => effect.id);
    set(element, 'data-rmo', ids.join(' '));
    set(element, 'data-rmo-state', state(element));
    if (!watched.has(element)) {
      watched.add(element);
      set(element, 'data-rmo-visible', 'false');
      visibility?.observe(element);
    }
    if (ids.includes('metric') && element.matches(metricSelector)) prepareMetric(element);
    if (ids.includes('folder')) {
      const surface = element.querySelector('.bib-deckel-blatt');
      if (surface) ensure(surface, 'rmo-folder-stack', stack => {
        for (let index = 0; index < 5; index++) {
          const sheet = ornament('rmo-folder-sheet');
          sheet.style.setProperty('--rmo-index', String(index)); stack.append(sheet);
        }
      });
    }
    if (ids.includes('sliders')) ensure(element, 'rmo-sliders', sliders => {
      for (let index = 0; index < 3; index++) sliders.append(document.createElement('i'));
    });
    if (ids.includes('liquid')) ensure(element, 'rmo-liquid');
    if (ids.includes('orb')) ensure(element, 'rmo-orb');
    if (ids.includes('ticket')) {
      if (!element.classList.contains('rmo-ticket')) element.classList.add('rmo-ticket');
      ensure(element, 'rmo-ticket-heading', heading => { heading.textContent = 'PDF-Ausgabe'; });
      /* Nur die Bildbühne wenden. Der echte Status bleibt außerhalb und
         wird während der Drehung unverändert vorgelesen. */
      const stage = element.querySelector('.ru-drucker-buehne');
      if (stage && !element.querySelector('.rmo-ticket-turn')) {
        const turn = ornament('rmo-ticket-turn');
        const back = ornament('rmo-ticket-back');
        const mark = ornament('rmo-ticket-mark');
        const result = ornament('rmo-ticket-result');
        back.append(mark, result);
        stage.replaceWith(turn);
        turn.append(stage, back);
      }
      const result = element.querySelector('.rmo-ticket-result');
      const label = element.querySelector('.ru-drucker-text')?.textContent || '';
      if (result && result.textContent !== label) result.textContent = label;
    }
    /* ==================================================================
     * DER GLÜHFADEN UND DER KARTENRING — beide standen bisher nur in der
     * Tabelle (E529).
     *
     * `filament` und `carousel` waren als Wirkung angemeldet, aber NIEMAND
     * hat je ihr Markup gebaut: der Glühfaden war ein 13 × 6 px grosses
     * `::before`, und die Ring-CSS in `motion.css` hatte gar kein Element,
     * auf das sie zeigen konnte — toter Stil. Nachgesehen mit einer Suche
     * nach `ensure(` in dieser Datei: sechs Aufrufe, keiner für die beiden.
     * ================================================================== */
    if (ids.includes('filament')) ensure(element, 'rmo-filament', glas => {
      /* Zwei Drähte und eine Wendel dazwischen. Drei Elemente statt eines
         Bildes, damit der Faden die Schriftfarbe erben kann und in Hell
         wie Dunkel sitzt. */
      glas.append(ornament('rmo-filament-bein'), ornament('rmo-filament-wendel'),
                  ornament('rmo-filament-bein'));
    });
    if (ids.includes('carousel')) ensure(element, 'rmo-carousel', ring => {
      /* Fünf Karten auf einem Kreis. Die Zahl steht hier und nicht im Stil:
         der Winkel je Karte rechnet sich aus ihr, und eine sechste Karte
         wäre sonst eine stille Überlappung. */
      const anzahl = 5;
      ring.style.setProperty('--rmo-anzahl', String(anzahl));
      for (let index = 0; index < anzahl; index++) {
        const karte = ornament('rmo-ring-karte');
        karte.style.setProperty('--rmo-index', String(index));
        ring.append(karte);
      }
    });
    /* Der gezeichnete Ring aus der Statistik-Vorlage (2030–2710). Er rahmt
       die ECHTE Zahl und misst nichts — siehe den Grund in motion.css. */
    if (ids.includes('metric') && !element.matches(metricSelector)) {
      ensure(element, 'rmo-ring');
      ensure(element, 'rmo-heart');
    }
    /* ==================================================================
       Der Glaskörper aus Vorlagenblock 8. Er hat nicht gefehlt, er war
       ÜBERSTIMMT: `[data-rmo~="glass"]` (ein Attribut) verliert gegen
       `.fbtns button.prim:not(.ru-funkel)` (drei Klassen) — geschrieben,
       nie gesehen. Der Körper bekommt deshalb ein eigenes Element statt
       weiterer Pseudo-Ebenen am Knopf: `::after` gehört dort schon dem
       kreisenden Rand des Verlaufseffekts, und ein Knopf kann beide
       Effekte tragen.
       ================================================================== */
    if (ids.includes('glass')) ensure(element, 'rmo-glass', glas => {
      /* Kuppel (Licht von oben), Platte (der harte Glanz darüber),
         Saum (das Licht, das unten wieder austritt). */
      glas.append(ornament('rmo-glass-kuppel'), ornament('rmo-glass-platte'),
                  ornament('rmo-glass-saum'));
    });
    if (ids.includes('letters')) {
      /* Text teilen, aber Symbole, Beschriftung und Listener behalten. */
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        const fragment = document.createElement('span');
        fragment.className = 'rmo-word';
        Array.from(node.textContent).forEach((character, index) => {
          const letter = document.createElement('span');
          letter.className = 'rmo-letter'; letter.textContent = character;
          letter.style.setProperty('--rmo-delay', Math.min(index * 25, 250) + 'ms');
          fragment.append(letter);
        });
        node.replaceWith(fragment);
      }
    }
  };
  const decorate = (root: ParentNode = document): void => {
    if (root instanceof Element && root.matches(selector)) decorateElement(root);
    root.querySelectorAll(selector).forEach(decorateElement);
  };
  /** Rückmeldung ohne Timer oder Änderung des Arbeitszustands. */
  const play = (element: Element, effect: MotionEffectId): void => {
    if (document.hidden || document.body.dataset.bewegung === 'ruhig' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (effects.some(entry => entry.id === effect)) set(element, 'data-rmo-play', effect);
  };
  const start = (): void => {
    if (observer) return;
    visibility = new IntersectionObserver(entries => entries.forEach(entry =>
      set(entry.target, 'data-rmo-visible', String(entry.isIntersecting))));
    const pause = (): void => set(document.documentElement, 'data-rmo-paused', String(document.hidden));
    document.addEventListener('visibilitychange', pause); pause();
    document.addEventListener('animationend', event => {
      if (event.target instanceof Element) event.target.closest('[data-rmo-play]')?.removeAttribute('data-rmo-play');
    });
    decorate();
    observer = new MutationObserver(records => {
      const roots = new Set<Element>();
      for (const record of records) {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        const metric = target?.closest(metricSelector);
        if (metric) prepareMetric(metric);
        if (target?.matches(selector)) roots.add(target);
        const ticket = target?.closest('.ru-drucker');
        if (ticket) roots.add(ticket);
        for (const node of record.addedNodes) if (node instanceof Element) roots.add(node);
        for (const node of record.removedNodes) if (node instanceof Element && !node.isConnected) {
          for (const removed of [node, ...node.querySelectorAll('[data-rmo]')]) {
            visibility?.unobserve(removed); watched.delete(removed);
          }
        }
      }
      roots.forEach(root => { if (root.isConnected) decorate(root); });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true,
      attributes: true, attributeFilter: ['class', 'data-zustand', 'disabled', 'aria-busy'] });
  };
  return { start, decorate, play, catalog: () => effects.map(effect => ({ ...effect })) };
})();
