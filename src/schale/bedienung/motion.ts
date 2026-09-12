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
    { id: 'carousel', place: 'Zuletzt geöffnete Dokumente', selector: '.rmo-recent' },
    { id: 'glass', place: 'Primäre Dialogaktionen', selector: '.fbtns button.prim' },
    { id: 'metric', place: 'Lernfortschritt und Bestandsgesundheit', selector: metricSelector },
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
    if (ids.includes('metric')) prepareMetric(element);
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
    }
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
