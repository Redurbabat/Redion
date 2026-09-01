"use strict";
/* ============================================================================
 * bereiche/pdf/document-mode.ts — ein Arbeitsraum fuer vorhandene Dokumente
 * ----------------------------------------------------------------------------
 * Der Dokumentmodus ist nur eine Ansicht. Er legt weder PDF-Seiten noch
 * Blaetter ein zweites Mal ab: dieselben `pdfseite`-/`blatt`-Bloecke werden
 * mit Seitenleiste, Arbeitsflaeche und Inspector zusammengesetzt (E126).
 * ==========================================================================*/
const DocumentMode = (() => {
    const states = new Map();
    const stateFor = (pageId) => {
        const known = states.get(pageId);
        if (known)
            return known;
        /* BEIDE SEITENSPALTEN SIND ZU, AUCH AM RECHNER (E296). Der Inspector
           stand dort bisher offen, weil Platz da war — 280 px, dauerhaft, fuer
           eine Liste, die bei einem frisch eingelesenen PDF leer ist. Wer sie
           braucht, holt sie mit `ⓘ`; wer liest, liest. */
        const created = { index: 0, zoom: 100, thumbnailsOpen: false, inspectorOpen: false };
        states.set(pageId, created);
        return created;
    };
    /** Dokumentbausteine auch innerhalb vorhandener Spalten finden. */
    const documentsIn = (page) => {
        if (!page?.id)
            return [];
        const found = [];
        const seen = new Set();
        const visit = (id, depth) => {
            if (depth > 8 || seen.has(id))
                return;
            seen.add(id);
            Store.childrenOf(id).forEach((block) => {
                if (!block || block.alive === false)
                    return;
                if (block.type === 'pdfseite' || block.type === 'blatt')
                    found.push(block);
                else if (block.type === 'columns' || block.type === 'columns3' || block.type === 'spalte')
                    visit(block.id, depth + 1);
            });
        };
        visit(page.id, 0);
        return found.sort((left, right) => {
            if (left.quelleId && left.quelleId === right.quelleId)
                return (Number(left.nr) || 0) - (Number(right.nr) || 0);
            return 0;
        });
    };
    const available = (page) => documentsIn(page).length > 0;
    const active = (page) => !!page?.dokumentModus && available(page);
    /** Vor einem Deep-Link den einen Dokumentblock waehlen, der gleich
        gerendert werden soll. Der Zustand ist nur Ansicht und wird nicht als
        zweite Dokumentstruktur gespeichert. */
    const select = (page, blockId) => {
        const index = documentsIn(page).findIndex(block => block.id === blockId);
        if (index < 0)
            return false;
        stateFor(page.id).index = index;
        return true;
    };
    const toggle = (page, next) => {
        if (!page?.id || (!available(page) && next !== false))
            return;
        Store.updateBlock(page.id, { dokumentModus: next ?? !page.dokumentModus });
        App.zeichneSeite();
    };
    const sourceLabel = (documentBlock) => documentBlock.type === 'pdfseite'
        ? 'PDF · Seite ' + (Number(documentBlock.nr) || 1)
        : 'A4-Blatt';
    const linkedObjects = (page, documentBlock) => Object.values(Store.cache.blocks).filter(block => {
        if (!block?.alive || !block.sourceRef)
            return false;
        const source = block.sourceRef;
        return source.blockId === documentBlock.id ||
            (!source.blockId && source.pageId === page.id);
    });
    const thumbnail = (documentBlock, index, selected) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'document-thumbnail' + (selected ? ' is-selected' : '');
        button.dataset.documentIndex = String(index);
        button.setAttribute('aria-label', sourceLabel(documentBlock) + ' öffnen');
        const preview = document.createElement('span');
        preview.className = 'document-thumbnail-preview';
        if (documentBlock.type === 'pdfseite' && documentBlock.bildDateiId && typeof Dateien !== 'undefined') {
            const image = document.createElement('img');
            image.alt = '';
            image.loading = 'lazy';
            /* Die Adresse selbst ist bereits Arbeit: sie liest alle Chunks und legt
               eine Blob-URL an. Darum hier nur die Kennung vormerken; geladen wird
               unten erst fuer wirklich sichtbare Vorschaubilder. */
            image.dataset.documentThumbnailFile = documentBlock.bildDateiId;
            preview.appendChild(image);
        }
        else {
            const blank = document.createElement('span');
            blank.className = 'document-thumbnail-blank';
            blank.textContent = documentBlock.type === 'blatt' ? '✎' : 'PDF';
            preview.appendChild(blank);
        }
        const label = document.createElement('span');
        label.className = 'document-thumbnail-label';
        label.textContent = sourceLabel(documentBlock);
        button.append(preview, label);
        return button;
    };
    /** Nur die sichtbare Handvoll Vorschaubilder aus IndexedDB holen. Ein
        geschlossenes mobiles Panel hat keinen sichtbaren Schnitt und loest
        deshalb auch bei Dokumenten mit hunderten Seiten keine Lesewelle aus. */
    const activateVisibleThumbnails = (panel) => {
        let scheduled = false;
        const loadVisible = () => {
            scheduled = false;
            if (!panel.isConnected)
                return;
            const panelRect = panel.getBoundingClientRect();
            if (panelRect.width < 2 || panelRect.height < 2 ||
                panelRect.bottom <= 0 || panelRect.top >= window.innerHeight ||
                panelRect.right <= 0 || panelRect.left >= window.innerWidth)
                return;
            const top = Math.max(0, panelRect.top) - 220;
            const bottom = Math.min(window.innerHeight, panelRect.bottom) + 220;
            panel.querySelectorAll('img[data-document-thumbnail-file]').forEach(image => {
                if (image.src || image.dataset.loading === 'true')
                    return;
                const rect = image.getBoundingClientRect();
                if (rect.bottom < top || rect.top > bottom)
                    return;
                const fileId = image.dataset.documentThumbnailFile;
                if (!fileId)
                    return;
                const known = Dateien.adresseBekannt?.(fileId);
                if (known) {
                    image.src = known;
                    return;
                }
                image.dataset.loading = 'true';
                Dateien.adresse(fileId).then((url) => {
                    if (url && image.isConnected)
                        image.src = url;
                    delete image.dataset.loading;
                }).catch(() => { delete image.dataset.loading; });
            });
        };
        const schedule = () => {
            if (scheduled)
                return;
            scheduled = true;
            requestAnimationFrame(loadVisible);
        };
        panel.addEventListener('scroll', schedule, { passive: true });
        schedule();
    };
    const renderInspector = (container, page, documentBlock) => {
        const links = linkedObjects(page, documentBlock);
        const cards = links.filter(block => block.type === 'flashcard');
        const tasks = links.filter(block => block.type === 'todo');
        const notes = links.filter(block => block.type !== 'flashcard' && block.type !== 'todo');
        container.replaceChildren();
        const heading = document.createElement('div');
        heading.className = 'document-inspector-heading';
        const title = document.createElement('strong');
        title.textContent = page.text || 'Ohne Titel';
        const close = document.createElement('button');
        close.type = 'button';
        close.dataset.documentAction = 'inspector-close';
        close.setAttribute('aria-label', 'Inspector schließen');
        close.textContent = '✕';
        heading.append(title, close);
        const source = document.createElement('div');
        source.className = 'document-inspector-source';
        source.textContent = sourceLabel(documentBlock);
        const actions = document.createElement('div');
        actions.className = 'document-inspector-actions';
        const makeAction = (action, label) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.textContent = label;
            return button;
        };
        actions.append(makeAction('source-actions', '＋ Aus Inhalt'), makeAction('select-region', '⌗ Ausschnitt'), makeAction('recognize', '⌁ Erkennen'));
        const summary = document.createElement('div');
        summary.className = 'document-inspector-summary';
        [['🎴', 'Lernkarten', cards.length], ['☑', 'Aufgaben', tasks.length], ['¶', 'Notizen', notes.length]]
            .forEach(([icon, label, count]) => {
            const row = document.createElement('div');
            const left = document.createElement('span');
            left.textContent = String(icon) + ' ' + String(label);
            const number = document.createElement('b');
            number.textContent = String(count);
            row.append(left, number);
            summary.appendChild(row);
        });
        const list = document.createElement('div');
        list.className = 'document-inspector-list';
        links.slice(0, 24).forEach(block => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentOpen = block.id;
            const icon = block.type === 'flashcard' ? '🎴' : block.type === 'todo' ? '☑' : '¶';
            button.textContent = icon + ' ' + String(block.text || 'Ohne Text').replace(/::.*$/, '').slice(0, 90);
            list.appendChild(button);
        });
        if (!links.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Noch keine Notiz, Aufgabe oder Karte ist mit dieser Stelle verbunden.';
            list.appendChild(empty);
        }
        container.append(heading, source, actions, summary, list);
    };
    const renderDocument = (container, block) => {
        container.replaceChildren();
        /* Auch diese alternative Ansicht muss denselben Block eindeutig im DOM
           tragen wie der normale Editor. Deep-Links, Rollen und Hervorheben
           suchen absichtlich nach `data-bid`; ohne die Kennung war zwar die
           richtige Dokumentseite sichtbar, der Sprung galt aber nie als
           angekommen. Der Stage-Container ist bereits die Hülle dieses einen
           Blocks, deshalb braucht es dafür keinen zweiten Blockknoten. */
        container.dataset.bid = block.id;
        container.appendChild(block.type === 'pdfseite' ? PdfSeite.zeichne(block) : Blatt.zeichne(block));
    };
    const selectRegion = (paper, documentBlock, done) => {
        paper.classList.add('document-selecting');
        const overlay = document.createElement('div');
        overlay.className = 'document-region-overlay';
        const box = document.createElement('div');
        box.className = 'document-region-box';
        overlay.appendChild(box);
        paper.appendChild(overlay);
        let start = null;
        let end = null;
        const point = (event) => {
            const rect = overlay.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
                y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
            };
        };
        const draw = () => {
            if (!start || !end)
                return;
            const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x), height = Math.abs(end.y - start.y);
            box.style.left = x + 'px';
            box.style.top = y + 'px';
            box.style.width = width + 'px';
            box.style.height = height + 'px';
        };
        const finish = (event) => {
            event.preventDefault();
            event.stopPropagation();
            end = point(event);
            draw();
            const rect = overlay.getBoundingClientRect();
            const width = Number(documentBlock.bw) || Number(documentBlock.blattBreite) || SheetSpace.A4_BREITE;
            const height = Number(documentBlock.bh) || Number(documentBlock.blattHoehe) || SheetSpace.A4_HOEHE;
            const x1 = Math.min(start?.x || 0, end.x), y1 = Math.min(start?.y || 0, end.y);
            const x2 = Math.max(start?.x || 0, end.x), y2 = Math.max(start?.y || 0, end.y);
            cleanup();
            if (x2 - x1 < 8 || y2 - y1 < 8 || !rect.width || !rect.height)
                return;
            done({
                x: x1 / rect.width * width,
                y: y1 / rect.height * height,
                width: (x2 - x1) / rect.width * width,
                height: (y2 - y1) / rect.height * height
            });
        };
        const move = (event) => {
            if (!start)
                return;
            event.preventDefault();
            event.stopPropagation();
            end = point(event);
            draw();
        };
        const down = (event) => {
            if (event.button !== 0)
                return;
            event.preventDefault();
            event.stopPropagation();
            start = point(event);
            end = start;
            draw();
            try {
                overlay.setPointerCapture(event.pointerId);
            }
            catch { /* optional */ }
        };
        const cleanup = () => {
            overlay.removeEventListener('pointerdown', down, true);
            overlay.removeEventListener('pointermove', move, true);
            overlay.removeEventListener('pointerup', finish, true);
            overlay.remove();
            paper.classList.remove('document-selecting');
        };
        overlay.addEventListener('pointerdown', down, true);
        overlay.addEventListener('pointermove', move, true);
        overlay.addEventListener('pointerup', finish, true);
    };
    const openSourceActions = (page, documentBlock, region) => {
        const learning = window.Learning;
        if (!learning?.sourceMenu) {
            UI.toast('Die Lernwerkzeuge sind noch nicht geladen.');
            return;
        }
        learning.sourceMenu(page, documentBlock, region || null);
    };
    const render = (wrap, page) => {
        const documents = documentsIn(page);
        if (!documents.length)
            return false;
        const state = stateFor(page.id);
        state.index = Math.max(0, Math.min(state.index, documents.length - 1));
        const current = documents[state.index];
        if (!current)
            return false;
        const workspace = document.createElement('section');
        workspace.className = 'document-workspace';
        workspace.dataset.pageId = page.id;
        const top = document.createElement('div');
        top.className = 'document-topbar';
        const topButton = (action, text, label) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.setAttribute('aria-label', label);
            button.textContent = text;
            return button;
        };
        top.append(topButton('thumbnails', '☰', 'Seitenübersicht öffnen'), topButton('previous', '‹', 'Vorherige Seite'), topButton('next', '›', 'Nächste Seite'));
        const position = document.createElement('span');
        position.className = 'document-position';
        position.textContent = 'Seite ' + (state.index + 1) + '/' + documents.length;
        const zoom = document.createElement('input');
        zoom.type = 'range';
        zoom.min = '60';
        zoom.max = '180';
        zoom.step = '10';
        zoom.value = String(state.zoom);
        zoom.dataset.documentZoom = '';
        zoom.setAttribute('aria-label', 'Dokumentzoom');
        const zoomLabel = document.createElement('span');
        zoomLabel.className = 'document-zoom-label';
        zoomLabel.textContent = state.zoom + ' %';
        /* DER TITEL STEHT JETZT HIER (E296). Der grosse Seitenkopf faellt im
           Dokumentmodus weg; ohne diese Zeile hiesse das offene Dokument
           nirgends mehr beim Namen. `textContent`, nicht `innerHTML` — der Titel
           ist Nutzertext (§19). */
        const titel = document.createElement('div');
        titel.className = 'document-title';
        titel.textContent = page.text || 'Ohne Titel';
        titel.title = page.text || 'Ohne Titel';
        top.append(position, titel);
        /* UND DER EINE HINWEIS AUS DEM KOPF, DER HIER WEITER GILT. Eine gegen
           Bearbeiten gesperrte Seite sagte das oben in einer eigenen Zeile. Die
           ist mit dem Kopf weg — das Schloss bleibt, mit Wort statt nur Zeichen
           (§38) und mit dem Weg zurueck in der Sprechblase. */
        if (page.gesperrt) {
            const schloss = document.createElement('span');
            schloss.className = 'document-locked';
            schloss.textContent = '🔏 Gesperrt';
            schloss.title = 'Diese Seite ist gegen Bearbeiten gesperrt. ' +
                'Über „Normale Seite" lässt sie sich wieder freigeben.';
            top.append(schloss);
        }
        top.append(zoom, zoomLabel, topButton('inspector', 'ⓘ', 'Notizen und Verknüpfungen öffnen'), topButton('exit', 'Normale Seite', 'Dokumentmodus verlassen'));
        /* WELCHE SPALTEN ES GIBT, STEHT AM KASTEN (E296). Vorher war das Raster
           fest — 190 px links, 280 px rechts, bei jeder Fensterbreite ueber
           1100 px. Auf 1440 px blieben der Seite damit rund 900, obwohl beide
           Spalten meistens nichts zu sagen hatten. Grundstellung ist jetzt eine
           einzige Spalte; jede Seitenspalte kommt, wenn sie geoeffnet wird. */
        const body = document.createElement('div');
        body.className = 'document-body' +
            (state.thumbnailsOpen ? ' with-thumbnails' : '') +
            (state.inspectorOpen ? ' with-inspector' : '');
        const thumbnails = document.createElement('aside');
        thumbnails.className = 'document-thumbnails' + (state.thumbnailsOpen ? ' is-open' : '');
        const thumbHeader = document.createElement('div');
        thumbHeader.className = 'document-panel-header';
        const thumbTitle = document.createElement('strong');
        thumbTitle.textContent = 'Seiten';
        const thumbClose = topButton('thumbnails-close', '✕', 'Seitenübersicht schließen');
        thumbHeader.append(thumbTitle, thumbClose);
        thumbnails.appendChild(thumbHeader);
        documents.forEach((block, index) => thumbnails.appendChild(thumbnail(block, index, index === state.index)));
        const center = document.createElement('main');
        center.className = 'document-center';
        const stage = document.createElement('div');
        stage.className = 'document-stage';
        renderDocument(stage, current);
        center.appendChild(stage);
        const inspector = document.createElement('aside');
        inspector.className = 'document-inspector' + (state.inspectorOpen ? ' is-open' : '');
        renderInspector(inspector, page, current);
        body.append(thumbnails, center, inspector);
        workspace.append(top, body);
        wrap.appendChild(workspace);
        /* DIE HOEHE MISST SICH SELBST (E296). In der CSS stand `calc(100vh -
           150px)`; die 150 waren der Seitenkopf plus die Leisten darueber. Der
           Kopf ist weg, also waere jede feste Zahl ab jetzt eine andere Luecke —
           und sie waere auch vorher schon falsch gewesen, sobald das Menueband
           einmal umbricht. Der Arbeitsraum fragt stattdessen, wo er anfaengt,
           und hoert zwoelf Pixel ueber dem unteren Fensterrand auf.
    
           In Pixeln statt in `vh`: `100vh` meint am Telefon das Fenster MIT der
           Adresszeile, `window.innerHeight` das ohne — und genau das ist die
           Zahl, die zaehlt. Ein `resize` bringt beides wieder zusammen. */
        const hoeheSetzen = () => {
            if (!workspace.isConnected)
                return;
            const oben = Math.round(workspace.getBoundingClientRect().top);
            if (oben < 0 || oben >= window.innerHeight)
                return;
            workspace.style.height = Math.max(240, window.innerHeight - oben - 12) + 'px';
        };
        /* DIE GANZE SEITE PASST INS BILD (E296) — das ist bei GoodNotes die
           Grundstellung, und es ist die Frage, die eine Dokumentansicht
           beantworten muss: sehe ich ein Blatt oder ein Drittel davon.
    
           Vorher stand hier `stage.style.width = zoom + '%'`. Prozent WOVON —
           von der Breite der Mitte. Seit die Mitte nicht mehr 900, sondern 1360
           Pixel breit ist, waere eine A4-Seite bei 100 % gut 1900 Pixel hoch
           geworden: in einem 750 Pixel hohen Kasten sieht man davon ein Drittel.
    
           Also wird ab der HOEHE gerechnet und das Seitenverhaeltnis gibt die
           Breite. Der Zoom bleibt genau das, was er war — ein Faktor auf die
           Ansicht; `bw`/`bh` des Blocks werden nicht angefasst. Die Leiste zaehlt
           mit, weil sie im Fluss ueber dem Papier steht (auch als klebende). */
        const passen = () => {
            if (!workspace.isConnected)
                return;
            const bw = Number(current.bw) || Number(current.blattBreite) || SheetSpace.A4_BREITE;
            const bh = Number(current.bh) || Number(current.blattHoehe) || SheetSpace.A4_HOEHE;
            if (!(bw > 0) || !(bh > 0))
                return;
            const raum = center.clientHeight;
            const leiste = stage.querySelector('.blatt-reihe')?.offsetHeight || 0;
            if (raum < 80)
                return;
            const hoch = Math.max(200, raum - leiste - 56);
            const breit = Math.round(hoch * (bw / bh) * (state.zoom / 100));
            /* DAS MASS GEHT ANS PAPIER, NICHT AN DIE BUEHNE. Die Zeichenleiste
               gehoert zum Blatt und steht in derselben Huelle; haette die Buehne
               das Passmass, waere die Leiste so schmal wie die Seite — gemessen:
               21 Werkzeuge in 447 px ergaben eine 332 px HOHE Leiste, die mehr
               Platz nahm als das Papier darunter. Die Buehne bleibt also breit,
               die Leiste passt in eine Zeile, und nur das Papier wird gestellt.
               Die Zeichenschicht haengt IM Papier (E100) und geht in Blattmassen
               statt in Pixeln — sie folgt von selbst mit. */
            stage.style.width = '100%';
            stage.style.setProperty('--doc-blatt', Math.max(120, Math.min(breit, center.clientWidth - 36)) + 'px');
        };
        const beiGroesse = () => {
            if (!workspace.isConnected) {
                window.removeEventListener('resize', beiGroesse);
                return;
            }
            hoeheSetzen();
            passen();
        };
        window.addEventListener('resize', beiGroesse, { passive: true });
        requestAnimationFrame(() => {
            hoeheSetzen();
            passen();
            thumbnails.querySelector('.document-thumbnail.is-selected')
                ?.scrollIntoView({ block: 'nearest' });
            activateVisibleThumbnails(thumbnails);
        });
        const rerender = () => App.zeichneSeite();
        workspace.addEventListener('click', event => {
            const element = event.target instanceof Element ? event.target : null;
            const thumb = element?.closest('[data-document-index]');
            if (thumb?.dataset.documentIndex) {
                state.index = Number(thumb.dataset.documentIndex) || 0;
                state.thumbnailsOpen = false;
                rerender();
                return;
            }
            const open = element?.closest('[data-document-open]');
            if (open?.dataset.documentOpen) {
                const target = Store.getBlock(open.dataset.documentOpen);
                const sourcePage = target ? Links.seiteVon(target.id) : null;
                if (sourcePage) {
                    toggle(page, false);
                    App.oeffne(sourcePage.id);
                }
                return;
            }
            const action = element?.closest('[data-document-action]')?.dataset.documentAction;
            if (!action)
                return;
            if (action === 'previous') {
                state.index = Math.max(0, state.index - 1);
                rerender();
            }
            if (action === 'next') {
                state.index = Math.min(documents.length - 1, state.index + 1);
                rerender();
            }
            if (action === 'thumbnails') {
                state.thumbnailsOpen = !state.thumbnailsOpen;
                rerender();
            }
            if (action === 'thumbnails-close') {
                state.thumbnailsOpen = false;
                rerender();
            }
            if (action === 'inspector') {
                state.inspectorOpen = !state.inspectorOpen;
                rerender();
            }
            if (action === 'inspector-close') {
                state.inspectorOpen = false;
                rerender();
            }
            if (action === 'exit')
                toggle(page, false);
            if (action === 'source-actions')
                openSourceActions(page, current);
            if (action === 'select-region' || action === 'recognize') {
                const paper = stage.querySelector('.blatt-papier');
                if (!paper)
                    return;
                selectRegion(paper, current, region => {
                    if (action === 'recognize') {
                        const recognition = window.Recognition;
                        if (recognition?.fromSource)
                            recognition.fromSource(page, current, region);
                        else
                            UI.toast('Die Erkennung ist noch nicht geladen.');
                    }
                    else
                        openSourceActions(page, current, region);
                });
            }
        });
        zoom.addEventListener('input', () => {
            state.zoom = Number(zoom.value) || 100;
            passen();
            zoomLabel.textContent = state.zoom + ' %';
        });
        return true;
    };
    return { available, active, select, toggle, documentsIn, render, sourceLabel };
})();
window.DocumentMode = DocumentMode;
/* ============================================================================
 * DIE KONTEXTKANTE IM DOKUMENTMODUS (E272 Phase F)
 * ----------------------------------------------------------------------------
 * DIESELBEN WERKZEUGE WIE DER REITER „ZEICHNEN", aus derselben Quelle:
 * `Register.menueband.inReiter('zeichnen')`. Eine zweite Stiftliste hier
 * wäre die dritte Stelle, an der „Marker" definiert wird — nach dem
 * Menüband und der Werkzeugspalte im Dokument selbst.
 *
 * `zeigen()` wird mitgenommen und nicht ausgewertet: die Kante fragt es
 * jedes Mal neu, und ein Werkzeug, das nur mit offener Fläche Sinn hat,
 * verschwindet dann von selbst wieder.
 * ==========================================================================*/
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    /* AUCH HIER EIN LIEFERANT (derselbe Grund wie in `elektro/start.ts`):
       `inReiter('zeichnen')` filtert schon mit `zeigen()`, und die Werkzeuge
       brauchen eine offene Fläche. Beim Laden gibt es keine — einmal gefragt
       hiesse für immer leer. */
    K.meldeLieferant('pdf', () => {
        const raus = [];
        let rang = 20;
        for (const g of (Register.menueband.inReiter('zeichnen') || [])) {
            raus.push({
                bereich: 'pdf', id: 'zeichnen-' + String(g.gruppe).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: String(g.gruppe), zeichen: 'pencil', rang: rang,
                liefern: () => (g.eintraege || [])
                    .filter((e) => {
                    try {
                        return typeof e.zeigen !== 'function' || e.zeigen();
                    }
                    catch {
                        return false;
                    }
                })
                    .map((e) => ({
                    id: String(e.id), name: String(e.name || e.id), unter: e.hinweis,
                    zeichen: e.zeichen,
                    an: (() => {
                        try {
                            return typeof e.an === 'function' ? !!e.an() : false;
                        }
                        catch {
                            return false;
                        }
                    })(),
                    tun: () => { try {
                        e.tun();
                    }
                    catch { /* toter Griff bleibt still */ } }
                }))
            });
            rang += 10;
        }
        return raus;
    });
    /* OCR und Formelheft stehen nicht im Zeichnen-Reiter — sie gehören dem
       Dokument und nicht dem Stift. */
    K.melde({ bereich: 'pdf', id: 'ocr', name: 'Text erkennen (OCR)',
        zeichen: 'camera', rang: 200,
        zeigen: () => typeof Recognition !== 'undefined' && !!Recognition.capturePage,
        tun: () => { try {
            Recognition.capturePage();
        }
        catch { /* … */ } } });
    K.melde({ bereich: 'pdf', id: 'formelheft', name: 'Formelheft',
        zeichen: 'book', rang: 210,
        zeigen: () => typeof Formelheft !== 'undefined' && !!Formelheft.umschalten,
        tun: () => { try {
            Formelheft.umschalten();
        }
        catch { /* … */ } } });
}
