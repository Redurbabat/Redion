"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/motion.ts (npm run bauen:ts). */
const RedionMotion = (() => {
    const metricSelector = '.stat-karte.lw-metrik > strong, .rmo-health-metric > strong';
    const effects = [
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
    const watched = new WeakSet();
    let observer = null;
    let visibility = null;
    const set = (element, name, value) => {
        if (element.getAttribute(name) !== value)
            element.setAttribute(name, value);
    };
    const ornament = (name) => {
        const element = document.createElement('span');
        element.className = name;
        element.setAttribute('aria-hidden', 'true');
        return element;
    };
    const ensure = (element, name, build) => {
        if (element.querySelector(':scope > .' + name))
            return;
        const node = ornament(name);
        build?.(node);
        element.prepend(node);
    };
    const prepareMetric = (element) => {
        const value = element.textContent || '';
        if (element.querySelector('.rmo-number-source')?.textContent === value)
            return;
        if (!/\d/.test(value) || !/^[\d.,’'%+\-−:/\s]+$/.test(value) || value.length > 18) {
            if (element.classList.contains('rmo-number'))
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
    const state = (element) => {
        const source = element.getAttribute('data-zustand');
        if (source)
            return source;
        if (element.matches('.ki-aktivitaet, [aria-busy="true"]'))
            return 'laeuft';
        if (element.matches('.schalter, .mschalter, .sp-start'))
            return element.classList.contains('an') ? 'an' : 'aus';
        return element.hasAttribute('disabled') ? 'inaktiv' : 'bereit';
    };
    const decorateElement = (element) => {
        const ids = effects.filter(effect => element.matches(effect.selector)).map(effect => effect.id);
        set(element, 'data-rmo', ids.join(' '));
        set(element, 'data-rmo-state', state(element));
        if (!watched.has(element)) {
            watched.add(element);
            set(element, 'data-rmo-visible', 'false');
            visibility?.observe(element);
        }
        if (ids.includes('metric') && element.matches(metricSelector))
            prepareMetric(element);
        if (ids.includes('folder')) {
            const surface = element.querySelector('.bib-deckel-blatt');
            if (surface)
                ensure(surface, 'rmo-folder-stack', stack => {
                    for (let index = 0; index < 5; index++) {
                        const sheet = ornament('rmo-folder-sheet');
                        sheet.style.setProperty('--rmo-index', String(index));
                        stack.append(sheet);
                    }
                });
        }
        if (ids.includes('sliders'))
            ensure(element, 'rmo-sliders', sliders => {
                for (let index = 0; index < 3; index++)
                    sliders.append(document.createElement('i'));
            });
        if (ids.includes('liquid'))
            ensure(element, 'rmo-liquid');
        if (ids.includes('orb'))
            ensure(element, 'rmo-orb');
        if (ids.includes('ticket')) {
            if (!element.classList.contains('rmo-ticket'))
                element.classList.add('rmo-ticket');
            ensure(element, 'rmo-ticket-heading', heading => { heading.textContent = 'PDF-Ausgabe'; });
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
            if (result && result.textContent !== label)
                result.textContent = label;
        }
        if (ids.includes('filament'))
            ensure(element, 'rmo-filament', glas => {
                glas.append(ornament('rmo-filament-bein'), ornament('rmo-filament-wendel'), ornament('rmo-filament-bein'));
            });
        if (ids.includes('carousel'))
            ensure(element, 'rmo-carousel', ring => {
                const anzahl = 5;
                ring.style.setProperty('--rmo-anzahl', String(anzahl));
                for (let index = 0; index < anzahl; index++) {
                    const karte = ornament('rmo-ring-karte');
                    karte.style.setProperty('--rmo-index', String(index));
                    ring.append(karte);
                }
            });
        if (ids.includes('metric') && !element.matches(metricSelector)) {
            ensure(element, 'rmo-ring');
            if (!element.querySelector(':scope > .lw-kennzahl-merk'))
                ensure(element, 'rmo-heart');
        }
        if (ids.includes('glass'))
            ensure(element, 'rmo-glass', glas => {
                glas.append(ornament('rmo-glass-kuppel'), ornament('rmo-glass-platte'), ornament('rmo-glass-saum'));
            });
        if (ids.includes('toggle') && element.matches('.mschalter')) {
            ensure(element, 'rmo-verlauf', schicht => {
                schicht.append(ornament('rmo-verlauf-a'), ornament('rmo-verlauf-b'), ornament('rmo-verlauf-licht'));
            });
            for (const name of ['rmo-verlauf-text', 'rmo-verlauf-kugel']) {
                if (!element.querySelector(':scope > .' + name))
                    element.append(ornament(name));
            }
        }
        if (ids.includes('carousel')) {
            const stage = element.querySelector(':scope > .rmo-carousel');
            if (stage && !stage.querySelector(':scope > .rmo-ring-trommel')) {
                const drum = ornament('rmo-ring-trommel');
                for (const card of Array.from(stage.querySelectorAll(':scope > .rmo-ring-karte')))
                    drum.append(card);
                stage.append(drum);
            }
        }
        if (ids.includes('metric') && !element.matches(metricSelector) && element instanceof HTMLElement) {
            const card = element;
            ensure(card, 'rmo-kranz', halo => { halo.append(ornament('rmo-kranz-schein')); });
            ensure(card, 'rmo-glanz');
            ensure(card, 'rmo-pfad', field => {
                const svgNs = 'http://www.w3.org/2000/svg';
                const chart = document.createElementNS(svgNs, 'svg');
                chart.setAttribute('viewBox', '0 0 100 30');
                chart.setAttribute('preserveAspectRatio', 'none');
                chart.setAttribute('aria-hidden', 'true');
                chart.setAttribute('focusable', 'false');
                [8, 13, 6, 17, 11].forEach((height, index) => {
                    const bar = document.createElementNS(svgNs, 'line');
                    const x = String(10 + index * 20);
                    bar.setAttribute('x1', x);
                    bar.setAttribute('y1', '28');
                    bar.setAttribute('x2', x);
                    bar.setAttribute('y2', String(28 - height));
                    bar.setAttribute('vector-effect', 'non-scaling-stroke');
                    bar.style.setProperty('--rmo-i', String(index));
                    chart.append(bar);
                });
                ['M2 24 C 14 22, 20 9, 32 11 S 54 22, 66 15 S 86 4, 98 8',
                    'M2 29 C 14 27, 20 14, 32 16 S 54 27, 66 20 S 86 9, 98 13'
                ].forEach((d, index) => {
                    const curve = document.createElementNS(svgNs, 'path');
                    curve.setAttribute('d', d);
                    curve.setAttribute('vector-effect', 'non-scaling-stroke');
                    curve.style.setProperty('--rmo-i', String(index));
                    chart.append(curve);
                });
                field.append(chart);
            });
            if (!card.hasAttribute('data-rmo-kippung') && matchMedia('(hover: hover)').matches) {
                set(card, 'data-rmo-kippung', 'true');
                card.addEventListener('pointermove', event => {
                    const box = card.getBoundingClientRect();
                    if (!box.width || !box.height)
                        return;
                    card.style.setProperty('--rmo-x', String(Math.round((event.clientX - box.left) / box.width * 100)));
                    card.style.setProperty('--rmo-y', String(Math.round((event.clientY - box.top) / box.height * 100)));
                });
                card.addEventListener('pointerleave', () => {
                    card.style.removeProperty('--rmo-x');
                    card.style.removeProperty('--rmo-y');
                });
            }
        }
        if (ids.includes('ticket')) {
            ensure(element, 'rmo-ticket-korn');
            ensure(element, 'rmo-ticket-holo');
            const buehne = element.querySelector('.ru-drucker-buehne');
            if (buehne) {
                ensure(buehne, 'rmo-ticket-wuerfel', wuerfel => {
                    for (let index = 0; index < 6; index++)
                        wuerfel.append(ornament('rmo-ticket-flaeche'));
                });
                ensure(buehne, 'rmo-ticket-qr', code => {
                    for (let index = 0; index < 3; index++)
                        code.append(ornament('rmo-ticket-ecke'));
                });
            }
            const kopf = element.querySelector(':scope > .rmo-ticket-heading');
            if (kopf)
                for (const node of Array.from(kopf.childNodes)) {
                    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim())
                        continue;
                    const wort = ornament('rmo-ticket-wort');
                    Array.from(node.textContent).forEach((character, index) => {
                        const letter = document.createElement('span');
                        letter.className = 'rmo-ticket-letter';
                        letter.textContent = character;
                        letter.style.setProperty('--rmo-i', String(index));
                        wort.append(letter);
                    });
                    node.replaceWith(wort);
                }
        }
        if (ids.includes('orb')) {
            const orb = element.querySelector(':scope > .rmo-orb');
            if (orb && !orb.querySelector(':scope > .rmo-orb-zwei')) {
                const svgNs = 'http://www.w3.org/2000/svg';
                const arcs = document.createElementNS(svgNs, 'svg');
                arcs.setAttribute('class', 'rmo-orb-pfade');
                arcs.setAttribute('viewBox', '0 0 24 24');
                arcs.setAttribute('aria-hidden', 'true');
                for (const d of ['M4 14a8 8 0 0 1 16 0', 'M20 10a8 8 0 0 1-16 0']) {
                    const path = document.createElementNS(svgNs, 'path');
                    path.setAttribute('d', d);
                    arcs.append(path);
                }
                const waves = [0, 1, 2].map(index => {
                    const wave = ornament('rmo-orb-welle');
                    wave.style.setProperty('--rmo-i', String(index));
                    return wave;
                });
                orb.append(...waves, ornament('rmo-orb-punkte'), ornament('rmo-orb-kranz'), arcs, ornament('rmo-orb-zwei'), ornament('rmo-orb-funke'));
                if (element.matches('#ai .ai-head'))
                    orb.append(ornament('rmo-orb-fuss'));
            }
            if (element.matches('#ai .ai-head'))
                ensure(element, 'rmo-orb-karte');
            if (element instanceof HTMLElement && !element.hasAttribute('data-rmo-orb-kippung') &&
                matchMedia('(hover: hover)').matches) {
                const carrier = element;
                set(carrier, 'data-rmo-orb-kippung', 'true');
                carrier.addEventListener('pointermove', event => {
                    const rect = carrier.getBoundingClientRect();
                    if (!rect.width || !rect.height)
                        return;
                    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
                    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
                    carrier.style.setProperty('--rmo-ox', x.toFixed(2));
                    carrier.style.setProperty('--rmo-oy', y.toFixed(2));
                });
                carrier.addEventListener('pointerleave', () => {
                    carrier.style.removeProperty('--rmo-ox');
                    carrier.style.removeProperty('--rmo-oy');
                });
            }
        }
        if (ids.includes('filament')) {
            ensure(element, 'rmo-hebel', gehaeuse => {
                gehaeuse.append(ornament('rmo-hebel-arm'), ornament('rmo-hebel-zeichen'), ornament('rmo-hebel-schraube'));
            });
            ensure(element, 'rmo-hebel-kegel');
            const glas = element.querySelector(':scope > .rmo-filament');
            if (glas && !glas.querySelector(':scope > .rmo-filament-wischer')) {
                glas.append(ornament('rmo-filament-wischer'), ornament('rmo-filament-rand'), ornament('rmo-filament-koernung'));
            }
        }
        if (ids.includes('transport')) {
            const svgNs = 'http://www.w3.org/2000/svg';
            ensure(element, 'rmo-tr-wanne', wanne => {
                wanne.append(ornament('rmo-tr-rauschen'), ornament('rmo-tr-glanz'));
            });
            element.querySelectorAll(':scope > button').forEach(taste => {
                const rolle = taste.getAttribute('data-rmo-taste') || taste.getAttribute('data-zm') || '';
                const figuren = rolle === 'stopp' ? [['', ['M9 9h6v6H9z']]]
                    : rolle === 'pause' ? [['pause', ['M10 8v8', 'M14 8v8']], ['weiter', ['M9.5 7.5 17 12l-7.5 4.5z']]]
                        : [['', ['M9.5 7.5 17 12l-7.5 4.5z']]];
                ensure(taste, 'rmo-tr-kappe', kappe => {
                    const zeichen = document.createElementNS(svgNs, 'svg');
                    zeichen.setAttribute('class', 'rmo-tr-sym');
                    zeichen.setAttribute('viewBox', '0 0 24 24');
                    zeichen.setAttribute('aria-hidden', 'true');
                    for (const [name, figur] of figuren) {
                        const gruppe = name ? document.createElementNS(svgNs, 'g') : zeichen;
                        if (name) {
                            gruppe.setAttribute('data-figur', name);
                            zeichen.append(gruppe);
                        }
                        for (const d of figur) {
                            const linie = document.createElementNS(svgNs, 'path');
                            linie.setAttribute('d', d);
                            gruppe.append(linie);
                        }
                    }
                    kappe.append(ornament('rmo-tr-reflex'), ornament('rmo-tr-wisch'), ornament('rmo-tr-fleck'), zeichen, ornament('rmo-led'));
                });
            });
            if (!element.hasAttribute('data-rmo-tr-druck')) {
                set(element, 'data-rmo-tr-druck', '1');
                element.addEventListener('pointerdown', ereignis => {
                    if (!(ereignis instanceof PointerEvent) || !(ereignis.target instanceof Element))
                        return;
                    const taste = ereignis.target.closest('button');
                    if (!taste)
                        return;
                    const feld = taste.getBoundingClientRect();
                    if (!feld.width || !feld.height)
                        return;
                    taste.style.setProperty('--rmo-px', Math.round((ereignis.clientX - feld.left) / feld.width * 100) + '%');
                    taste.style.setProperty('--rmo-py', Math.round((ereignis.clientY - feld.top) / feld.height * 100) + '%');
                });
            }
        }
        if (ids.includes('folder')) {
            for (const sheet of Array.from(element.querySelectorAll('.rmo-folder-sheet'))) {
                if (!sheet.querySelector(':scope > .rmo-folder-icon'))
                    sheet.append(ornament('rmo-folder-icon'));
            }
        }
        if (ids.includes('light') && element.matches('.els-kachel')) {
            ensure(element, 'rmo-lampe', lampe => {
                const kegel = ornament('rmo-lampe-kegel');
                kegel.append(ornament('rmo-lampe-min'), ornament('rmo-lampe-mid'), ornament('rmo-lampe-hi'));
                const dunkel = ornament('rmo-lampe-dunkel');
                dunkel.append(ornament('rmo-lampe-sl'), ornament('rmo-lampe-ll'), ornament('rmo-lampe-slt'), ornament('rmo-lampe-srt'));
                lampe.append(ornament('rmo-lampe-schlitz'), kegel, dunkel);
            });
        }
        if (ids.includes('liquid')) {
            const lader = element.querySelector(':scope > .rmo-liquid');
            if (lader && !lader.firstElementChild) {
                const masse = ornament('rmo-liquid-masse');
                for (let index = 0; index < 7; index++) {
                    const klumpen = ornament('rmo-liquid-klumpen');
                    klumpen.style.setProperty('--rmo-i', String(index));
                    masse.append(klumpen);
                }
                lader.append(masse);
            }
        }
        if (ids.includes('letters')) {
            for (const node of Array.from(element.childNodes)) {
                if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim())
                    continue;
                const fragment = document.createElement('span');
                fragment.className = 'rmo-word';
                Array.from(node.textContent).forEach((character, index) => {
                    const letter = document.createElement('span');
                    letter.className = 'rmo-letter';
                    letter.textContent = character;
                    letter.style.setProperty('--rmo-delay', Math.min(index * 25, 250) + 'ms');
                    fragment.append(letter);
                });
                node.replaceWith(fragment);
            }
        }
    };
    const decorate = (root = document) => {
        if (root instanceof Element && root.matches(selector))
            decorateElement(root);
        root.querySelectorAll(selector).forEach(decorateElement);
    };
    const play = (element, effect) => {
        if (document.hidden || AppEinstellung.wenigBewegung())
            return;
        if (effects.some(entry => entry.id === effect))
            set(element, 'data-rmo-play', effect);
    };
    const start = () => {
        if (observer)
            return;
        visibility = new IntersectionObserver(entries => entries.forEach(entry => set(entry.target, 'data-rmo-visible', String(entry.isIntersecting))));
        const pause = () => set(document.documentElement, 'data-rmo-paused', String(document.hidden));
        document.addEventListener('visibilitychange', pause);
        pause();
        document.addEventListener('animationend', event => {
            if (event.target instanceof Element)
                event.target.closest('[data-rmo-play]')?.removeAttribute('data-rmo-play');
        });
        decorate();
        observer = new MutationObserver(records => {
            const roots = new Set();
            for (const record of records) {
                const target = record.target instanceof Element ? record.target : record.target.parentElement;
                const metric = target?.closest(metricSelector);
                if (metric)
                    prepareMetric(metric);
                if (target?.matches(selector))
                    roots.add(target);
                const ticket = target?.closest('.ru-drucker');
                if (ticket)
                    roots.add(ticket);
                for (const node of record.addedNodes)
                    if (node instanceof Element)
                        roots.add(node);
                for (const node of record.removedNodes)
                    if (node instanceof Element && !node.isConnected) {
                        for (const removed of [node, ...node.querySelectorAll('[data-rmo]')]) {
                            visibility?.unobserve(removed);
                            watched.delete(removed);
                        }
                    }
            }
            roots.forEach(root => { if (root.isConnected)
                decorate(root); });
        });
        observer.observe(document.body, { childList: true, characterData: true, subtree: true,
            attributes: true, attributeFilter: ['class', 'data-zustand', 'disabled', 'aria-busy'] });
    };
    return { start, decorate, play, catalog: () => effects.map(effect => ({ ...effect })) };
})();
