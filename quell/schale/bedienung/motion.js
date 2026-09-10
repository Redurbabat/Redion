"use strict";
/* Dekorative Ergänzungen aus Redurs Animationssammlung.
 * Quelle: src/schale/bedienung/motion.ts. Daraus wird motion.js erzeugt;
 * das JavaScript nicht von Hand bearbeiten, sondern npm run bauen:ts.
 * Keine Anfragen, Timer, Datenänderungen oder neuen Klickhandlungen.
 * Der einzige Start erfolgt in src/start.ts. Nur neu eingefügte Teilbäume
 * werden betrachtet; ein WeakSet verhindert doppelte Dekoration.
 */
const RedionMotion = (() => {
    const decorated = new WeakSet();
    const selector = '.bib-deckel[data-art="ordner"], .bib-leer, .ki-aktivitaet, #ai-quellen, #ai .ai-head';
    let observer = null;
    const ornament = (name) => {
        const element = document.createElement('span');
        element.className = name;
        element.setAttribute('aria-hidden', 'true');
        return element;
    };
    const decorate = (element) => {
        if (decorated.has(element))
            return;
        decorated.add(element);
        if (element.matches('.bib-deckel')) {
            const surface = element.querySelector('.bib-deckel-blatt');
            if (!surface)
                return;
            const stack = ornament('rmo-folder-stack');
            for (let index = 0; index < 5; index++) {
                const sheet = ornament('rmo-folder-sheet');
                sheet.style.setProperty('--rmo-index', String(index));
                stack.append(sheet);
            }
            surface.prepend(stack);
        }
        else if (element.matches('.bib-leer')) {
            const carousel = ornament('rmo-carousel');
            for (let index = 0; index < 3; index++) {
                const card = document.createElement('i');
                card.style.setProperty('--rmo-index', String(index));
                carousel.append(card);
            }
            element.prepend(carousel);
        }
        else if (element.matches('.ki-aktivitaet')) {
            element.prepend(ornament('rmo-liquid'));
        }
        else if (element.id === 'ai-quellen') {
            const sliders = ornament('rmo-sliders');
            for (let index = 0; index < 3; index++)
                sliders.append(document.createElement('i'));
            element.prepend(sliders);
        }
        else {
            element.prepend(ornament('rmo-orb'));
        }
    };
    const scan = (root) => {
        if (root instanceof Element && root.matches(selector))
            decorate(root);
        root.querySelectorAll(selector).forEach(decorate);
    };
    const start = () => {
        if (observer)
            return;
        scan(document);
        observer = new MutationObserver(records => {
            for (const record of records)
                for (const node of record.addedNodes) {
                    if (node instanceof Element)
                        scan(node);
                }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };
    return { start };
})();
