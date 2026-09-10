/* Dekorative Ergänzungen aus Redurs Animationssammlung.
 * Quelle: src/schale/bedienung/motion.ts. Daraus wird motion.js erzeugt;
 * das JavaScript nicht von Hand bearbeiten, sondern npm run bauen:ts.
 * Keine Anfragen, Timer, Datenänderungen oder neuen Klickhandlungen.
 * Der einzige Start erfolgt in src/start.ts. Nur neu eingefügte Teilbäume
 * werden betrachtet; ein WeakSet verhindert doppelte Dekoration.
 */
const RedionMotion = (() => {
  const decorated = new WeakSet<Element>();
  const metricSelector = '.stat-karte.lw-metrik > strong';
  const selector = '.bib-deckel[data-art="ordner"], .bib-leer, .ki-aktivitaet, #ai-quellen, #ai .ai-head, .ru-drucker, ' + metricSelector;
  let observer: MutationObserver | null = null;

  const ornament = (name: string): HTMLSpanElement => {
    const element = document.createElement('span');
    element.className = name;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };
  /** Der Text bleibt die echte Zahl. Die Rollen tragen nur CSS-Inhalt und
   * sind aria-hidden: Zwischenstände werden weder vorgelesen noch kopiert.
   * Keine animierte Rechnung und keine Änderung am gespeicherten Wert. */
  const prepareMetric = (element: Element): void => {
    const value = element.textContent || '';
    if (element.querySelector('.rmo-number-source')?.textContent === value) return;
    if (!/\d/.test(value) || !/^[\d.,’'%+\-−:/\s]+$/.test(value) || value.length > 18) {
      element.classList.remove('rmo-number');
      return;
    }
    const source = document.createElement('span');
    source.className = 'rmo-number-source';
    source.textContent = value;
    const reels = ornament('rmo-reels');
    for (const [index, character] of Array.from(value).entries()) {
      const digit = document.createElement('span');
      digit.className = /\d/.test(character) ? 'rmo-digit' : 'rmo-separator';
      digit.dataset['rmoCharacter'] = character;
      digit.style.setProperty('--rmo-digit', /\d/.test(character) ? character : '0');
      digit.style.setProperty('--rmo-delay', Math.min(index * 30, 180) + 'ms');
      reels.append(digit);
    }
    element.classList.add('rmo-number');
    element.replaceChildren(source, reels);
  };
  const decorate = (element: Element): void => {
    /* Kennzahlen können sich im selben Knoten ändern. Der Rest wird nur
       einmal dekoriert. Eigene DOM-Änderungen werden am Quelltext erkannt. */
    if (element.matches(metricSelector)) { prepareMetric(element); return; }
    if (decorated.has(element)) return;
    decorated.add(element);
    if (element.matches('.bib-deckel')) {
      const surface = element.querySelector('.bib-deckel-blatt');
      if (!surface) return;
      const stack = ornament('rmo-folder-stack');
      for (let index = 0; index < 5; index++) {
        const sheet = ornament('rmo-folder-sheet');
        sheet.style.setProperty('--rmo-index', String(index));
        stack.append(sheet);
      }
      surface.prepend(stack);
    } else if (element.matches('.bib-leer')) {
      const carousel = ornament('rmo-carousel');
      for (let index = 0; index < 3; index++) {
        const card = document.createElement('i');
        card.style.setProperty('--rmo-index', String(index));
        carousel.append(card);
      }
      element.prepend(carousel);
    } else if (element.matches('.ki-aktivitaet')) {
      element.prepend(ornament('rmo-liquid'));
    } else if (element.id === 'ai-quellen') {
      const sliders = ornament('rmo-sliders');
      for (let index = 0; index < 3; index++) sliders.append(document.createElement('i'));
      const icon = element.querySelector('svg');
      if (icon) icon.replaceWith(sliders); else element.prepend(sliders);
    } else if (element.matches('.ru-drucker')) {
      element.classList.add('rmo-ticket');
      const heading = ornament('rmo-ticket-heading');
      heading.textContent = 'PDF-Ausgabe';
      element.prepend(heading);
    } else {
      element.prepend(ornament('rmo-orb'));
    }
  };
  const scan = (root: ParentNode): void => {
    if (root instanceof Element && root.matches(selector)) decorate(root);
    root.querySelectorAll(selector).forEach(decorate);
  };
  const start = (): void => {
    if (observer) return;
    scan(document);
    observer = new MutationObserver(records => {
      for (const record of records) {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        const metric = target?.closest(metricSelector);
        if (metric) prepareMetric(metric);
        for (const node of record.addedNodes) {
          if (node instanceof Element) scan(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  };
  return { start };
})();
