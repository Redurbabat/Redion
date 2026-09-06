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
    /* DIE ZULETZT ANGESEHENE SEITE BLEIBT (E349). GoodNotes öffnet ein
       Dokument dort, wo man es verlassen hat; hier begann jedes Öffnen bei
       Seite 1, weil der Zustand nur im Arbeitsspeicher lag. Gemerkt wird je
       Dokument als Meta, nicht am Seitenblock — Blättern soll weder `edited`
       anheben noch eine Fassung erzeugen. */
    const SEITEN_MERKER = 'dokSeite:';
    const gemerkteSeite = (pageId) => {
        const n = Number(Store.getMeta(SEITEN_MERKER + pageId));
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    };
    const seiteMerken = (pageId, index) => {
        if (Store.getMeta(SEITEN_MERKER + pageId) === index)
            return;
        Store.setMeta(SEITEN_MERKER + pageId, index);
    };
    /* DER ZOOM BLEIBT AUCH (Audit F07). E349 merkte die SEITE, den Zoom
       nicht: nach jedem Neuladen stand er wieder auf 100 %, und wer sein
       Skript auf 140 % liest, musste das jedes Mal von Hand herstellen.
  
       Genau wie die Seite als Meta, nicht am Seitenblock — eine Ansicht ist
       kein Inhalt: Zoomen soll weder `edited` anheben noch eine Fassung
       erzeugen. Und je Dokument, nicht global: ein Skript in Kleindruck
       braucht einen anderen Zoom als ein Foto-Scan. */
    const ZOOM_MERKER = 'dokZoom:';
    const gemerkterZoom = (pageId) => {
        const n = Number(Store.getMeta(ZOOM_MERKER + pageId));
        /* Die Grenzen des Reglers, nicht mehr: ein kaputter Wert aus einer
           aelteren Fassung darf keine 4000-Pixel-Seite bauen. */
        return Number.isFinite(n) && n >= 60 && n <= 180 ? Math.round(n) : 100;
    };
    const zoomMerken = (pageId, zoom) => {
        if (Store.getMeta(ZOOM_MERKER + pageId) === zoom)
            return;
        Store.setMeta(ZOOM_MERKER + pageId, zoom);
    };
    /* ══ EINZELSEITE ODER FORTLAUFEND (E398, Audit F03 Rest) ══════════════════
       Der Pruefbericht schlaegt eine Wahl zwischen „Einzelseite" und
       „Fortlaufend" vor, mit Einzelseite als Vorgabe am Telefon. Redur hat am
       4. September das ERSTE bestellt und das ZWEITE nicht:
  
         Die Wahl kommt. Die VORGABE bleibt Fortlaufend, auch am Telefon.
  
       Und das ist keine Vorsicht, sondern seine eigene Ansage aus E299: „die
       pdf seiten sollte wie goodnotes sich ganz oeffnen komplet wie one note".
       Eine Vorgabe, die das zuruecknimmt, waere eine Entscheidung GEGEN ihn.
       Einzelseite ist deshalb ein Angebot, kein neuer Normalfall.
  
       WARUM ES DIE WAHL UEBERHAUPT BRAUCHT — gemessen an vier A4-Blaettern:
  
                                     Telefon 390x844   Rechner 1360x900
         Blaetter gleichzeitig im Bild        2                1
         ein Blatt als Anteil des Bildes    72 %            213 %
  
       Am Rechner passt ein Blatt ohnehin nicht ins Bild; dort steht immer
       genau eines, und die Wahl aendert praktisch nichts. Am TELEFON teilen
       sich zwei Blaetter den Bildschirm — und genau das meinte der Befund mit
       „Nutzer wissen nicht sicher, welche Seite aktiv ist". Wer das nicht
       will, schaltet es hier ab.
  
       ALS META, NICHT AM BLOCK — genau wie Seite und Zoom. Eine Ansicht ist
       kein Inhalt: umschalten soll weder `edited` anheben noch eine Fassung
       erzeugen. Und je Dokument, aus demselben Grund wie beim Zoom: ein
       gescanntes Buch liest sich anders als ein handbeschriebenes Heft. */
    const LAUF_MERKER = 'dokLauf:';
    const gemerkterLauf = (pageId) => Store.getMeta(LAUF_MERKER + pageId) === 'einzel';
    const laufMerken = (pageId, einzeln) => {
        const wert = einzeln ? 'einzel' : 'rolle';
        if (Store.getMeta(LAUF_MERKER + pageId) === wert)
            return;
        Store.setMeta(LAUF_MERKER + pageId, wert);
    };
    const stateFor = (pageId) => {
        const known = states.get(pageId);
        if (known)
            return known;
        /* BEIDE SEITENSPALTEN SIND ZU, AUCH AM RECHNER (E296). Der Inspector
           stand dort bisher offen, weil Platz da war — 280 px, dauerhaft, fuer
           eine Liste, die bei einem frisch eingelesenen PDF leer ist. Wer sie
           braucht, holt sie mit `ⓘ`; wer liest, liest. */
        const created = { index: gemerkteSeite(pageId), zoom: gemerkterZoom(pageId),
            thumbnailsOpen: false, inspectorOpen: false,
            einzeln: gemerkterLauf(pageId),
            toolsOpen: Store.getMeta('dokWerkzeuge:' + pageId) !== false };
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
        seiteMerken(page.id, index);
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
        button.setAttribute('aria-current', selected ? 'page' : 'false');
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
    /* DIE ORIGINALDATEI IST EINE ANGABE, KEIN BAND UEBER DEM PAPIER (E384).
       Sie stand als volle Zeile zwischen Werkzeugleiste und erstem Blatt und
       kostete dort 45 Pixel — am Telefon von 844. Gebraucht wird sie selten
       (einmal, wenn man das Original sucht), gesehen wurde sie immer. Sie
       zieht deshalb in den Inspector, zu den uebrigen Angaben ueber das
       Dokument; der Weg zur Datei bleibt derselbe (`Dateien`), nur der Platz
       ist ein anderer.
  
       Wie in OneNote: die Datei selbst als erste Zeile, der Ausdruck darunter.
       Gesucht wird der `file`-Block, den `PdfEinlesen` an Stelle 0 anlegt —
       und ersatzweise die `quelleId` der ersten Seite, damit auch aeltere
       Dokumente ihre Datei zeigen. */
    const originalKnopf = (page, documentBlock) => {
        const originalBlock = Store.childrenOf(page.id)
            .find((b) => b && b.alive !== false && b.type === 'file' && b.dateiId &&
            (b.original || /\.pdf$/i.test(String(b.text || ''))));
        const quelleId = originalBlock?.dateiId || documentBlock?.quelleId || '';
        if (!quelleId)
            return null;
        const zeile = document.createElement('button');
        zeile.type = 'button';
        zeile.className = 'document-original';
        zeile.dataset.documentOriginal = String(quelleId);
        const zeichen = document.createElement('span');
        zeichen.className = 'do-zeichen';
        zeichen.textContent = '📕';
        const name = document.createElement('span');
        name.className = 'do-name';
        name.textContent = String(originalBlock?.text || 'Original-PDF');
        const wort = document.createElement('span');
        wort.className = 'do-wort';
        wort.textContent = 'Original öffnen';
        zeile.append(zeichen, name, wort);
        zeile.title = 'Die unveränderte PDF-Datei — darunter steht ihr Ausdruck.';
        return zeile;
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
        title.textContent = 'Dokumentdetails';
        const close = document.createElement('button');
        close.type = 'button';
        close.dataset.documentAction = 'inspector-close';
        close.setAttribute('aria-label', 'Inspector schließen');
        close.textContent = '✕';
        heading.append(title, close);
        const source = document.createElement('div');
        source.className = 'document-inspector-source';
        source.textContent = sourceLabel(documentBlock) + ' · ' + (page.text || 'Ohne Titel');
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
        const importButton = makeAction('import', '＋ PDF hinzufügen');
        importButton.className = 'document-import';
        const mayEdit = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page));
        importButton.disabled = !mayEdit;
        importButton.title = mayEdit
            ? 'Eine weitere PDF in dieses Dokument einlesen'
            : 'Zum Hinzufügen brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.';
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
            empty.textContent = 'Deine Gedanken neben dem Papier. Wähle „Aus Inhalt“, um eine Notiz, Aufgabe oder Lernkarte mit dieser Seite zu verbinden.';
            list.appendChild(empty);
        }
        /* DER RANDSTREIFEN (E301, L107; hierher E384). Ein Schalter fuer das
           ganze Dokument: wer neben seinem Skript schreibt, will das fuer das
           ganze Skript. Aus ist die Vorgabe — ein Rand, den niemand bestellt
           hat, nimmt der Seite Platz weg. Mit Wort statt nur Zeichen (§38). */
        const randAn = Number(page.randBreite) > 0;
        const randKnopf = document.createElement('button');
        randKnopf.type = 'button';
        randKnopf.dataset.documentAction = 'rand';
        randKnopf.className = 'document-rand-knopf' + (randAn ? ' an' : '');
        randKnopf.textContent = '⇥ Randstreifen ' + (randAn ? 'aus' : 'an');
        randKnopf.setAttribute('aria-pressed', randAn ? 'true' : 'false');
        randKnopf.title = 'Ein Streifen zum Schreiben neben der Seite — für das ganze Dokument.';
        /* EINZELSEITE ODER FORTLAUFEND (E398). Neben dem Randstreifen und aus
           demselben Grund hier statt in der Leiste: E384 hat den Randstreifen
           aus der Leiste geholt, weil sie am Telefon 411 px breit war in einem
           390 px breiten Fenster. Ein zweiter Schalter dort haette denselben
           Fehler ein zweites Mal gemacht.
    
           NUR AB ZWEI SEITEN. Bei einem einzigen Blatt sind Einzelseite und
           Fortlaufend dasselbe Bild — ein Schalter, der nichts tut, ist
           schlimmer als keiner: er laesst einen suchen, was sich geaendert hat.
           `test395 §5` haelt fest, dass er dann fehlt. */
        const laufKnopf = documentsIn(page).length > 1 ? (() => {
            const einzeln = gemerkterLauf(page.id);
            const knopf = document.createElement('button');
            knopf.type = 'button';
            knopf.dataset.documentAction = 'lauf';
            knopf.className = 'document-lauf-knopf' + (einzeln ? ' an' : '');
            /* Das Wort sagt, was ein Druck BEWIRKT — wie beim Randstreifen. Wo man
               gerade steht, sagt die Sprechblase, und `aria-pressed` sagt es dem
               Screenreader (§38). */
            knopf.textContent = einzeln ? '▤ Fortlaufend zeigen' : '▢ Einzelseite zeigen';
            knopf.setAttribute('aria-pressed', einzeln ? 'true' : 'false');
            knopf.title = einzeln
                ? 'Gerade steht eine Seite allein im Bild. Drücken zeigt wieder alle untereinander.'
                : 'Gerade stehen alle Seiten untereinander. Drücken zeigt nur die, auf der du bist.';
            return knopf;
        })() : null;
        const original = originalKnopf(page, documentBlock);
        container.append(heading, source);
        if (original)
            container.appendChild(original);
        const linkedTitle = document.createElement('h3');
        linkedTitle.className = 'document-section-title';
        linkedTitle.textContent = 'Mit dieser Seite verbunden';
        const viewTitle = document.createElement('h3');
        viewTitle.className = 'document-section-title';
        viewTitle.textContent = 'Papier & Ansicht';
        container.append(importButton, viewTitle, randKnopf);
        if (laufKnopf)
            container.appendChild(laufKnopf);
        container.append(linkedTitle, actions, summary, list);
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
        /* Die vorhandene Ink-Leiste bleibt Eigentümerin ihrer Aktionen. Der
           Dokumentmodus ergänzt lediglich Namen und Tastatur-Navigation. */
        const toolbar = container.querySelector('.blatt-werk');
        if (toolbar) {
            toolbar.setAttribute('role', 'toolbar');
            toolbar.setAttribute('aria-label', 'Schreiben, markieren und bearbeiten');
            toolbar.querySelectorAll('button').forEach(button => {
                button.type = 'button';
                if (!button.getAttribute('aria-label')) {
                    const label = button.querySelector('.wort')?.textContent?.trim() || button.title;
                    if (label)
                        button.setAttribute('aria-label', label);
                }
            });
            toolbar.addEventListener('keydown', event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
                    return;
                const target = event.target instanceof Element ? event.target.closest('button') : null;
                if (!target)
                    return;
                const buttons = Array.from(toolbar.querySelectorAll('button'))
                    .filter(button => !button.disabled && button.getClientRects().length > 0);
                const index = buttons.indexOf(target);
                if (index < 0 || !buttons.length)
                    return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
                buttons[next]?.focus();
                buttons[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        }
    };
    const selectRegion = (paper, documentBlock, done) => {
        const leseflaeche = paper.closest('.blatt-flur') || paper;
        const warInert = leseflaeche.inert;
        leseflaeche.inert = false;
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
            leseflaeche.inert = warInert;
            window.removeEventListener('keydown', escapeRegion, true);
        };
        const escapeRegion = (event) => {
            if (event.key !== 'Escape')
                return;
            event.preventDefault();
            event.stopPropagation();
            cleanup();
        };
        window.addEventListener('keydown', escapeRegion, true);
        overlay.addEventListener('pointercancel', cleanup, { once: true });
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
        workspace.className = 'document-workspace document-studio';
        workspace.dataset.pageId = page.id;
        workspace.dataset.documentTools = state.toolsOpen ? 'open' : 'closed';
        workspace.setAttribute('aria-label', 'Dokument: ' + (page.text || 'Ohne Titel'));
        const top = document.createElement('div');
        top.className = 'document-topbar';
        const topButton = (action, text, label) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.setAttribute('aria-label', label);
            button.textContent = text;
            button.title = label;
            return button;
        };
        /* DER WEG ZURUECK STEHT IM DOKUMENT (E384). Solange Menueband und
           Kopfzeile darueber standen, gab es dort einen Zurueck-Pfeil und eine
           Brotkrume. Beide sind mit der Schale weg — also braucht das Dokument
           seinen eigenen, sonst kommt man aus einem geoeffneten Skript nur noch
           ueber „Normale Seite" heraus, und das ist etwas anderes: es SCHALTET
           die Ansicht um, statt zurueckzugehen. Genau wie bei GoodNotes: `‹` und
           das Wort, wohin es fuehrt.
    
           Ueber `Register.navigation` und nicht ueber `Bibliothek.oeffne()` —
           der PDF-Bereich darf den Wissensbereich nicht kennen (§5 Regel 1). */
        const zurueck = topButton('regal', '‹', 'Zurück zu den Dokumenten');
        zurueck.classList.add('document-zurueck');
        const zurueckWort = document.createElement('span');
        zurueckWort.className = 'dz-wort';
        zurueckWort.textContent = 'Dokumente';
        zurueck.append(zurueckWort);
        const thumbnailButton = topButton('thumbnails', '▤ Seiten', 'Seitenübersicht öffnen');
        thumbnailButton.setAttribute('aria-expanded', String(state.thumbnailsOpen));
        const inspectorButton = topButton('inspector', 'Details', 'Notizen und Verknüpfungen öffnen');
        inspectorButton.setAttribute('aria-expanded', String(state.inspectorOpen));
        const navigation = document.createElement('div');
        navigation.className = 'document-navigation';
        navigation.append(zurueck, thumbnailButton);
        top.append(navigation);
        /* DER RANDSTREIFEN STEHT SEIT E384 IM INSPECTOR (vorher hier, E301/L107).
           Er ist ein Schalter fuer das GANZE Dokument — das sagte schon E301 —
           und damit gehoert er zu den uebrigen Angaben ueber das Dokument, nicht
           in die Leiste, die man bei jedem Blick sieht. Gemessen war die Leiste
           am Telefon 411 px breit in einem 390 px breiten Fenster; jedes Zeichen
           darin kostete den Ausgang. `randKnopf` steht jetzt in
           `renderInspector` und heisst dort beim Namen statt nur `⇥`. */
        const position = document.createElement('span');
        position.className = 'document-position';
        position.textContent = 'Seite ' + (state.index + 1) + '/' + documents.length;
        position.setAttribute('aria-live', 'polite');
        position.setAttribute('aria-atomic', 'true');
        const previousButton = topButton('previous', '‹', 'Vorherige Seite');
        const nextButton = topButton('next', '›', 'Nächste Seite');
        const pagination = document.createElement('div');
        pagination.className = 'document-pagination';
        pagination.setAttribute('role', 'group');
        pagination.setAttribute('aria-label', 'Im Dokument blättern');
        pagination.append(previousButton, position, nextButton);
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
        const zoomGroup = document.createElement('div');
        zoomGroup.className = 'document-zoom-group';
        zoomGroup.append(zoom, zoomLabel, topButton('fit', 'Anpassen', 'Seite an die verfügbare Breite anpassen'));
        /* DER TITEL STEHT JETZT HIER (E296). Der grosse Seitenkopf faellt im
           Dokumentmodus weg; ohne diese Zeile hiesse das offene Dokument
           nirgends mehr beim Namen. `textContent`, nicht `innerHTML` — der Titel
           ist Nutzertext (§19). */
        const titel = document.createElement('div');
        titel.className = 'document-title';
        titel.textContent = page.text || 'Ohne Titel';
        titel.title = page.text || 'Ohne Titel';
        top.append(titel);
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
        const topActions = document.createElement('div');
        topActions.className = 'document-top-actions';
        const viewButton = topButton('view', '☷', 'Ansicht, Lesemodus und Zoom');
        viewButton.className = 'document-view-button';
        viewButton.setAttribute('aria-expanded', 'false');
        topActions.append(viewButton, inspectorButton, topButton('exit', 'Seiteneditor', 'Dokumentmodus verlassen'));
        top.append(topActions);
        const commandbar = document.createElement('div');
        commandbar.className = 'document-commandbar';
        commandbar.setAttribute('aria-label', 'Dokumentansicht');
        commandbar.id = 'document-view-' + page.id;
        viewButton.setAttribute('aria-controls', commandbar.id);
        const modes = document.createElement('div');
        modes.className = 'document-mode-switch';
        modes.setAttribute('role', 'group');
        modes.setAttribute('aria-label', 'Lesen oder annotieren');
        const readButton = topButton('read', 'Lesen', 'Lesen — Zeichenwerkzeuge einklappen');
        const annotateButton = topButton('annotate', '✎ Annotieren', 'Annotieren — mit dem Stift auf der Seite schreiben');
        readButton.setAttribute('aria-pressed', String(!state.toolsOpen));
        annotateButton.setAttribute('aria-pressed', String(state.toolsOpen));
        const canAnnotate = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page));
        annotateButton.disabled = !canAnnotate;
        if (!canAnnotate)
            annotateButton.title = 'Zum Annotieren brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.';
        modes.append(readButton, annotateButton);
        commandbar.append(modes, pagination, zoomGroup);
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
        thumbnails.id = 'document-thumbnails-' + page.id;
        thumbnails.setAttribute('aria-label', 'Seitenübersicht');
        thumbnailButton.setAttribute('aria-controls', thumbnails.id);
        const thumbHeader = document.createElement('div');
        thumbHeader.className = 'document-panel-header';
        const thumbTitle = document.createElement('strong');
        thumbTitle.textContent = 'Seiten';
        const thumbClose = topButton('thumbnails-close', '✕', 'Seitenübersicht schließen');
        thumbHeader.append(thumbTitle, thumbClose);
        thumbnails.appendChild(thumbHeader);
        documents.forEach((block, index) => thumbnails.appendChild(thumbnail(block, index, index === state.index)));
        const center = document.createElement('main');
        center.className = 'document-center' + (state.einzeln ? ' ist-einzeln' : '');
        center.setAttribute('aria-label', 'Papierfläche');
        center.tabIndex = 0;
        /* ══ DIE ROLLE (E299) ══════════════════════════════════════════════════
           ALLE SEITEN UNTEREINANDER, NICHT EINE ZUM BLAETTERN.
    
           Bis E296 zeigte der Dokumentmodus genau eine Seite, und `‹ ›` wechselte
           sie. Redur wollte es anders und hat es genau gesagt: „ich sollte wie
           one note unendlich schrolen haben … pdf sollte ich weder nach unten
           noch nach rechts die seite wechseln koennen". Ein Skript liest man
           durch, man blaettert es nicht.
    
           DIE SEITEN, DIE MAN NICHT SIEHT, WERDEN NICHT GEZEICHNET. Ein
           Vorlesungsskript hat achtzig Seiten; achtzig Zeichenschichten und
           achtzig Bilder auf einmal sind kein Dokument mehr, sondern ein
           stehender Browser. Jede Seite bekommt deshalb zuerst nur ihren Platz
           — die Hoehe folgt aus `bw`/`bh`, also stimmt der Rollbalken von
           Anfang an — und wird gezeichnet, sobald sie in die Naehe kommt.
    
           `‹ ›` und die Miniaturen wechseln nichts mehr, sie SPRINGEN. */
        /* HIER STAND DIE ORIGINAL-KARTE — bis E384.
           Sie liegt jetzt im Inspector (`originalKnopf`). Der Grund steht dort:
           eine Zeile, die man selten braucht, darf nicht bei jedem Blick auf
           das Papier 45 Pixel wegnehmen. */
        /* WELCHE SEITE GERADE GILT, IST BEWEGLICH GEWORDEN (E299). Vorher stand
           sie beim Zeichnen fest — es gab ja nur eine. In der Rolle wandert sie
           mit dem Blick, und „Ausschnitt", „Erkennen" und der Inspector müssen
           die meinen, die man ansieht. */
        const jetzt = () => documents[Math.max(0, Math.min(state.index, documents.length - 1))] || current;
        const staende = [];
        const gezeichnet = new Set();
        const zeichneStand = (i) => {
            if (gezeichnet.has(i))
                return;
            const stand = staende[i];
            const block = documents[i];
            if (!stand || !block)
                return;
            gezeichnet.add(i);
            stand.style.removeProperty('height');
            renderDocument(stand, block);
            stand.querySelectorAll('.blatt-papier').forEach(paper => {
                (paper.closest('.blatt-flur') || paper).inert = !state.toolsOpen;
            });
        };
        documents.forEach((block, i) => {
            const stand = document.createElement('div');
            stand.className = 'document-stage';
            stand.dataset.standNr = String(i);
            /* Der Platzhalter in der richtigen Hoehe. Ohne ihn springt der
               Rollbalken bei jeder nachgezeichneten Seite. */
            const bw = Number(block.bw) || Number(block.blattBreite) || SheetSpace.A4_BREITE;
            const bh = Number(block.bh) || Number(block.blattHoehe) || SheetSpace.A4_HOEHE;
            /* EIN GROBER PLATZHALTER, damit nichts auf null zusammenfaellt. Das
               RICHTIGE Mass setzt `passen()` gleich darauf — hier kann es noch gar
               nicht stimmen, siehe `platzhalterSetzen`. */
            if (bw > 0 && bh > 0)
                stand.style.height = Math.round(Math.max(200, center.clientWidth - 36) * (bh / bw)) + 'px';
            staende.push(stand);
            center.appendChild(stand);
        });
        /* Die erste Seite sofort, damit nie ein leeres Fenster dasteht. */
        zeichneStand(Math.max(0, Math.min(state.index, documents.length - 1)));
        const inspector = document.createElement('aside');
        inspector.className = 'document-inspector' + (state.inspectorOpen ? ' is-open' : '');
        inspector.id = 'document-inspector-' + page.id;
        inspector.setAttribute('aria-label', 'Dokumentdetails und verknüpfte Inhalte');
        inspectorButton.setAttribute('aria-controls', inspector.id);
        renderInspector(inspector, page, current);
        body.append(thumbnails, center, inspector);
        workspace.append(top, commandbar, body);
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
            const raum = center.clientWidth;
            if (raum < 120)
                return;
            /* ══ IN DER ROLLE GIBT DIE BREITE DAS MASS (E299) ═════════════════════
               Bis hierher wurde aus der HOEHE gerechnet, damit eine ganze Seite
               ins Bild passt. Das war fuer das Blaettern richtig und ist fuers
               Rollen falsch: man rollt ja ohnehin, und Redur will die Seiten
               „ganz oeffnen komplett wie one note" — also gross und lesbar, nicht
               auf Fensterhoehe geschrumpft.
      
               Gemessen auf 1440 px war die Seite mit der Hoehenrechnung 432 px
               breit; die Mitte hatte 1360. Ein Skript liest sich so nicht. */
            const breit = Math.round((raum - 36) * (state.zoom / 100));
            /* DAS MASS GEHT ANS PAPIER, NICHT AN DIE BUEHNE. Die Zeichenleiste
               gehoert zum Blatt und steht in derselben Huelle; haette die Buehne
               das Passmass, waere die Leiste so schmal wie die Seite — gemessen:
               21 Werkzeuge in 447 px ergaben eine 332 px HOHE Leiste, die mehr
               Platz nahm als das Papier darunter. Die Buehne bleibt also breit,
               die Leiste passt in eine Zeile, und nur das Papier wird gestellt.
               Die Zeichenschicht haengt IM Papier (E100) und geht in Blattmassen
               statt in Pixeln — sie folgt von selbst mit. */
            /* AN DIE MITTE, NICHT AN EINE BUEHNE (E299). Seit die Rolle alle
               Seiten traegt, gibt es nicht mehr die eine. Das Mass steht deshalb
               am gemeinsamen Elternteil und vererbt sich an jede.
      
               OHNE DECKEL NACH OBEN. Der erste Entwurf begrenzte auf die Breite
               der Mitte — und damit tat der Zoom ueber 100 % gar nichts mehr
               (gemessen: 1250 px bei 100 % und bei 130 %). Wer hineinzoomt, will
               Einzelheiten gross sehen und nimmt das seitliche Rollen dafuer in
               Kauf; das ist etwas anderes als ein Seitenwechsel nach rechts, den
               es hier nicht gibt. */
            center.style.setProperty('--doc-blatt', Math.max(120, breit) + 'px');
            platzhalterSetzen(Math.max(120, breit));
        };
        /* ══ E399 · DER PLATZHALTER WAR 283 PX HOCH STATT 1922 ═══════════════════
           E299 schrieb an die Stelle oben: „Der Platzhalter in der Hoehe, die die
           Seite wirklich bekommen wird — sonst springt der Rollbalken, sobald sie
           gezeichnet ist." Genau das tat er nicht.
    
           GEMESSEN an sechs A4-Seiten auf 1360x900:
    
             beim Oeffnen   Rolle 3513   Hoehen [1922, 283, 283, 283, 283, 283]
             nach 1000 px   Rolle 5067   Hoehen [1922, 1837, 283, 283, 283, 283]
             nach 3000 px   Rolle 6620   Hoehen [1837, 1922, 1837, 283, 283, 283]
    
           Der Rollbalken WAECHST mit jeder erreichten Seite. Bei sechs Seiten ist
           das laestig; bei achtzig ist er von Anfang an eine Luege — er zeigt ein
           Viertel des Wegs an, den man wirklich vor sich hat.
    
           DER GRUND: `center.clientWidth` ist NULL, wenn die Buehnen gebaut
           werden. `body.append(thumbnails, center, inspector)` kommt erst danach,
           also haengt der Kasten noch nirgends und hat keine Breite. Aus
           `Math.max(200, 0 - 36)` werden 200, und 200 mal 842/595 sind die 283.
    
           Die Rechnung war nie falsch, sie lief nur zu frueh. Deshalb steht sie
           jetzt in `passen()` — dort ist der Kasten im DOM, dort ist die Breite
           bekannt, und dort wird ohnehin bei jedem Fensterwechsel und bei jedem
           Zoom neu gerechnet. Der Platzhalter folgt beidem mit.
    
           NUR DIE UNGEZEICHNETEN. Eine gezeichnete Seite hat ihre Hoehe von
           ihrem Inhalt (`zeichneStand` nimmt `height` ausdruecklich wieder weg);
           ihr eine feste Zahl zu geben, waere die Rueckkehr desselben Fehlers
           von der anderen Seite. */
        const platzhalterSetzen = (breit) => {
            staende.forEach((stand, i) => {
                if (gezeichnet.has(i))
                    return;
                const block = documents[i];
                if (!block)
                    return;
                const bw = Number(block.bw) || Number(block.blattBreite) || SheetSpace.A4_BREITE;
                const bh = Number(block.bh) || Number(block.blattHoehe) || SheetSpace.A4_HOEHE;
                if (bw > 0 && bh > 0)
                    stand.style.height = Math.round(breit * (bh / bw)) + 'px';
            });
        };
        const beiGroesse = () => {
            if (!workspace.isConnected) {
                window.removeEventListener('resize', beiGroesse);
                return;
            }
            hoeheSetzen();
            passen();
            aktivMarkieren();
            nachziehen();
        };
        window.addEventListener('resize', beiGroesse, { passive: true });
        /* WAS IN DIE NAEHE KOMMT, WIRD GEZEICHNET (E299).
           Ein Fenster von einer Bildhoehe nach oben und unten: so ist die
           naechste Seite schon da, wenn man sie erreicht, und die achtzigste
           bleibt ein Platzhalter, solange niemand hinrollt. */
        /* NACH EINEM SPRUNG SCHWEIGT DAS NACHZIEHEN KURZ.
           Beide wollen die Seitenzahl setzen: `springe` sagt „Seite 2", und das
           weiche Rollen laeuft danach noch — bei einer kurzen Rolle ist Seite 1
           dabei weiter in der Fenstermitte, also setzte `nachziehen` sofort auf
           1 zurueck. Auf dem Bildschirm sprang die Zahl hin und her; test202
           fiel darueber („ist Seite 1/2, soll Seite 2/2").
    
           Eine Sperre, keine feste Wartezeit: sie faellt, sobald das Rollen an
           der gewuenschten Stelle steht. */
        let springtZu = -1;
        /* NUR DIE AKTIVE SEITE ZEIGT WERKZEUGE (Audit F03).
           Gemessen am 3. September: bei DREI PDF-Seiten standen DREI
           Werkzeugleisten im Dokument, jede mit eigenem Zustand — `test386` §2
           fand es daran, dass sich drei Knöpfe gleichzeitig als gedrückt
           meldeten. Bei achtzig Seiten sind es achtzig Leisten.
    
           Der DOM-Teil des Befundes war schon zu: E299 zeichnet nur, was in die
           Nähe kommt. Was blieb, sind die GEZEICHNETEN — und davon stehen immer
           mehrere gleichzeitig im Bild, weil eine Seite eben höher ist als das
           Fenster. Wer dann eine Leiste antippt, weiss nicht, welcher Seite sie
           gehört.
    
           Die Marke steht an der Bühne, nicht an der Leiste: die Leiste gehört
           zum Blatt und wird von `PdfSeite`/`Blatt` gebaut, die vom Dokument
           nichts wissen und nichts wissen sollen (§5 Regel 1). Das CSS liest
           `[data-aktiv]` und blendet die übrigen aus. */
        const aktivMarkieren = () => {
            previousButton.disabled = state.index === 0;
            nextButton.disabled = state.index === documents.length - 1;
            thumbnails.querySelectorAll('[data-document-index]').forEach(button => {
                if (Number(button.dataset.documentIndex) === state.index)
                    button.setAttribute('aria-current', 'page');
                else
                    button.removeAttribute('aria-current');
            });
            staende.forEach((stand, i) => {
                if (i === state.index)
                    stand.setAttribute('data-aktiv', '');
                else
                    stand.removeAttribute('data-aktiv');
            });
        };
        const nachziehen = () => {
            if (!center.isConnected)
                return;
            /* IN DER EINZELSEITE GIBT ES NICHTS NACHZUZIEHEN (E398). Die Seite
               wechselt dort nur ueber `‹ ›` und die Miniaturen, und beide gehen
               durch `springe`, das Zahl, Miniatur und Marke selbst setzt.
      
               UND ES MUSS KURZSCHLIESSEN, statt nur nichts zu finden. Eine
               ausgeblendete Buehne hat `offsetTop` 0 und `offsetHeight` 0 — damit
               faellt sie in JEDES Naehe-Fenster, und die Schleife unten wuerde
               beim ersten Rollen alle achtzig Seiten zeichnen. Genau das, was
               E299 verhindern wollte. `test395 §3` misst es. */
            if (state.einzeln) {
                springtZu = -1;
                zeichneStand(state.index);
                return;
            }
            const oben = center.scrollTop - center.clientHeight;
            const unten = center.scrollTop + 2 * center.clientHeight;
            let sichtbar = state.index;
            staende.forEach((stand, i) => {
                const y = stand.offsetTop, h = stand.offsetHeight;
                if (y + h >= oben && y <= unten)
                    zeichneStand(i);
                /* Und die Seitenzahl folgt dem Blick: was die Mitte des Fensters
                   kreuzt, ist die Seite, auf der man gerade ist. */
                if (y <= center.scrollTop + center.clientHeight / 2 &&
                    y + h > center.scrollTop + center.clientHeight / 2)
                    sichtbar = i;
            });
            if (springtZu >= 0) {
                const ziel = staende[springtZu]?.offsetTop ?? 0;
                if (Math.abs(center.scrollTop - ziel) > 4)
                    return;
                springtZu = -1;
            }
            if (sichtbar !== state.index) {
                state.index = sichtbar;
                seiteMerken(page.id, sichtbar);
                aktivMarkieren(); /* F03 */
                position.textContent = 'Seite ' + (sichtbar + 1) + '/' + documents.length;
                thumbnails.querySelectorAll('.document-thumbnail.is-selected')
                    .forEach(el => el.classList.remove('is-selected'));
                thumbnails.querySelector('[data-document-index="' + sichtbar + '"]')
                    ?.classList.add('is-selected');
                /* Der Inspector zeigt, was mit DIESER Stelle verbunden ist — also
                   muss er mitwandern. Nur wenn er offen ist: sonst wäre es Arbeit
                   für einen Kasten, den niemand sieht. */
                if (state.inspectorOpen)
                    renderInspector(inspector, page, jetzt());
            }
        };
        let rollWartet = false;
        center.addEventListener('scroll', () => {
            if (rollWartet)
                return;
            rollWartet = true;
            requestAnimationFrame(() => { rollWartet = false; nachziehen(); });
        }, { passive: true });
        requestAnimationFrame(() => {
            hoeheSetzen();
            passen();
            /* Zur zuletzt gelesenen Seite, ohne Rollbewegung — beim Oeffnen soll
               nichts fahren. */
            if (state.index > 0 && staende[state.index])
                center.scrollTop = staende[state.index].offsetTop;
            /* UND DIE AKTIVE SEITE MARKIEREN (F03), BEVOR `nachziehen` laeuft.
               `nachziehen` markiert nur, wenn sich der Stand AENDERT — beim
               Oeffnen aendert er sich nicht, und dann traegt keine einzige Buehne
               die Marke. Gemessen: der Prueflauf wartete zwanzig Sekunden auf
               eine sichtbare Leiste, die es nicht gab. */
            aktivMarkieren();
            nachziehen();
            thumbnails.querySelector('.document-thumbnail.is-selected')
                ?.scrollIntoView({ block: 'nearest' });
            activateVisibleThumbnails(thumbnails);
        });
        /* Zu einer Seite springen — zeichnen, hinrollen, Stand merken. Kein
           Neuaufbau: ein Sprung, der die ganze Seite neu zeichnet, verlöre
           jeden angefangenen Strich und jede offene Textstelle. */
        const springe = (i, weich = true) => {
            const nr = Math.max(0, Math.min(documents.length - 1, i));
            state.index = nr;
            seiteMerken(page.id, nr);
            zeichneStand(nr);
            aktivMarkieren(); /* F03 */
            /* NUR DIE MITTE ROLLEN, NICHT DAS FENSTER. `scrollIntoView` schiebt
               JEDEN rollbaren Vorfahren — auch das Dokument selbst, und dann
               wandert der ganze Arbeitsraum nach oben aus dem Bild. Gemessen:
               der Raum endete danach 60 px über dem Fensterrand statt 12.
      
               `offsetTop` ist der Abstand zum naechsten positionierten Vorfahren,
               und das ist `.document-center` (`position:relative` in der CSS,
               genau dafuer gesetzt). */
            const stand = staende[nr];
            if (stand) {
                springtZu = nr;
                if (weich && !matchMedia('(prefers-reduced-motion: reduce)').matches && typeof center.scrollTo === 'function')
                    center.scrollTo({ top: stand.offsetTop, behavior: 'smooth' });
                else
                    center.scrollTop = stand.offsetTop;
            }
            position.textContent = 'Seite ' + (nr + 1) + '/' + documents.length;
            thumbnails.querySelectorAll('.document-thumbnail.is-selected')
                .forEach(el => el.classList.remove('is-selected'));
            thumbnails.querySelector('[data-document-index="' + nr + '"]')
                ?.classList.add('is-selected');
            passen();
        };
        const rerender = () => App.zeichneSeite();
        const toolsSetzen = (an) => {
            state.toolsOpen = an;
            Store.setMeta('dokWerkzeuge:' + page.id, an);
            workspace.dataset.documentTools = an ? 'open' : 'closed';
            readButton.setAttribute('aria-pressed', String(!an));
            annotateButton.setAttribute('aria-pressed', String(an));
            center.querySelectorAll('.blatt-papier').forEach(paper => {
                (paper.closest('.blatt-flur') || paper).inert = !an;
            });
            passen();
        };
        const panelsSetzen = () => {
            body.classList.toggle('with-thumbnails', state.thumbnailsOpen);
            body.classList.toggle('with-inspector', state.inspectorOpen);
            thumbnails.classList.toggle('is-open', state.thumbnailsOpen);
            inspector.classList.toggle('is-open', state.inspectorOpen);
            thumbnailButton.setAttribute('aria-expanded', String(state.thumbnailsOpen));
            inspectorButton.setAttribute('aria-expanded', String(state.inspectorOpen));
            if (state.inspectorOpen)
                renderInspector(inspector, page, jetzt());
            if (state.thumbnailsOpen)
                activateVisibleThumbnails(thumbnails);
            passen();
        };
        workspace.addEventListener('keydown', event => {
            if (event.key === 'Escape' && workspace.dataset.documentView === 'open') {
                workspace.dataset.documentView = 'closed';
                viewButton.setAttribute('aria-expanded', 'false');
                viewButton.focus();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && (state.thumbnailsOpen || state.inspectorOpen)) {
                const returnTo = state.inspectorOpen ? inspectorButton : thumbnailButton;
                state.thumbnailsOpen = false;
                state.inspectorOpen = false;
                panelsSetzen();
                returnTo.focus();
                event.stopPropagation();
            }
            if (event.target === center && (event.key === 'PageDown' || event.key === 'PageUp')) {
                event.preventDefault();
                springe(state.index + (event.key === 'PageDown' ? 1 : -1));
            }
        });
        workspace.addEventListener('click', event => {
            const element = event.target instanceof Element ? event.target : null;
            if (!element?.closest('.document-commandbar,[data-document-action="view"]')) {
                workspace.dataset.documentView = 'closed';
                viewButton.setAttribute('aria-expanded', 'false');
            }
            const thumb = element?.closest('[data-document-index]');
            if (thumb?.dataset.documentIndex) {
                springe(Number(thumb.dataset.documentIndex) || 0);
                return;
            }
            const original = element?.closest('[data-document-original]');
            if (original?.dataset.documentOriginal) {
                const id = original.dataset.documentOriginal;
                Dateien.adresse(id).then((url) => {
                    if (!url) {
                        UI.toast('Die Originaldatei ist nicht mehr in der Ablage.');
                        return;
                    }
                    window.open(url, '_blank', 'noopener');
                }).catch(() => UI.toast('Die Originaldatei liess sich nicht öffnen.'));
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
            if (action === 'view') {
                const offen = workspace.dataset.documentView !== 'open';
                workspace.dataset.documentView = offen ? 'open' : 'closed';
                viewButton.setAttribute('aria-expanded', String(offen));
            }
            if (action === 'previous')
                springe(state.index - 1);
            if (action === 'next')
                springe(state.index + 1);
            if (action === 'thumbnails') {
                state.thumbnailsOpen = !state.thumbnailsOpen;
                panelsSetzen();
            }
            if (action === 'thumbnails-close') {
                state.thumbnailsOpen = false;
                panelsSetzen();
                thumbnailButton.focus();
            }
            if (action === 'inspector') {
                state.inspectorOpen = !state.inspectorOpen;
                panelsSetzen();
            }
            if (action === 'inspector-close') {
                state.inspectorOpen = false;
                panelsSetzen();
                inspectorButton.focus();
            }
            if (action === 'read')
                toolsSetzen(false);
            if (action === 'annotate' && !page.gesperrt &&
                (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page)))
                toolsSetzen(true);
            if (action === 'fit') {
                zoomSetzen(100);
                center.scrollLeft = 0;
            }
            if (action === 'import' && !page.gesperrt &&
                (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page))) {
                void PdfEinlesen.waehlen(page.id).then(result => { if (result)
                    rerender(); });
            }
            if (action === 'lauf') {
                /* UMSCHALTEN HEISST NEU AUFBAUEN. Wie beim Randstreifen und beim
                   Inspector: der Kasten bekommt eine andere Marke, der Schalter ein
                   anderes Wort, und in der Einzelseite soll nur EINE Buehne
                   gezeichnet dastehen — das geht am ehrlichsten von vorn. */
                state.einzeln = !state.einzeln;
                laufMerken(page.id, state.einzeln);
                UI.toast(state.einzeln
                    ? 'Einzelseite — nur die Seite, auf der du bist'
                    : 'Fortlaufend — alle Seiten untereinander');
                rerender();
                return;
            }
            if (action === 'rand') {
                /* 45 % der Seitenbreite — gemessen an einer A4-Seite sind das rund
                   acht Zentimeter, und damit passt eine Zeile Handschrift daneben.
                   Der Wert steht an der SEITE, also am Dokument, und überlebt damit
                   den Neustart wie jede andere Einstellung. */
                const an = Number(page.randBreite) > 0;
                Store.updateBlock(page.id, { randBreite: an ? 0 : 0.45 });
                page.randBreite = an ? 0 : 0.45;
                UI.toast(an ? 'Randstreifen aus' : 'Randstreifen an — schreib daneben');
                App.zeichneSeite();
                return;
            }
            if (action === 'regal') {
                /* Zurueck ins Regal, ohne den Dokumentmodus abzuschalten: wer das
                   Skript wieder aufmacht, will es wieder als Dokument sehen. */
                /* `bibliothekOben`, nicht `app-bib`: das eine ist das Regal (die
                   Ablage mit Ordnern), das andere seit dem 6. September die flache
                   Liste „Alle Seiten". Zurück aus einem Dokument will man ins Regal. */
                const eintrag = typeof Register !== 'undefined' && Register.navigation
                    ? Register.navigation.eines('bibliothekOben') : null;
                if (eintrag && typeof eintrag.tun === 'function')
                    eintrag.tun();
                else
                    UI.toast('Das Regal ist gerade nicht erreichbar.');
                return;
            }
            if (action === 'exit')
                toggle(page, false);
            if (action === 'source-actions')
                openSourceActions(page, jetzt());
            if (action === 'select-region' || action === 'recognize') {
                /* AM STAND DER SEITE, DIE MAN ANSIEHT (E299). Vorher gab es genau
                   eine Bühne; in der Rolle ist es die, auf der der Blick steht. */
                const stand = staende[state.index];
                const paper = stand?.querySelector('.blatt-papier');
                if (!paper) {
                    UI.toast('Diese Seite ist gerade nicht gezeichnet.');
                    return;
                }
                /* Region selection is available in reading mode too. Only the temporary
                   overlay is interactive; the document beneath stays inert. */
                selectRegion(paper, jetzt(), region => {
                    if (action === 'recognize') {
                        const recognition = window.Recognition;
                        if (recognition?.fromSource)
                            recognition.fromSource(page, jetzt(), region);
                        else
                            UI.toast('Die Erkennung ist noch nicht geladen.');
                    }
                    else
                        openSourceActions(page, jetzt(), region);
                });
            }
        });
        zoom.addEventListener('input', () => {
            state.zoom = Number(zoom.value) || 100;
            zoomMerken(page.id, state.zoom); /* F07 */
            passen();
            zoomLabel.textContent = state.zoom + ' %';
        });
        /* ZOOM MIT STRG+RAD UND MIT ZWEI FINGERN (E354), wie in GoodNotes. Der
           Regler bleibt die Wahrheit: beide Wege schreiben in ihn hinein, damit
           Regler, Zahl und Ansicht nie auseinanderlaufen. Ohne Strg rollt das
           Rad wie immer; das Kneifen zaehlt nur Finger, nie Stift oder Maus. */
        const zoomSetzen = (wert) => {
            const neu = Math.max(60, Math.min(180, Math.round(wert)));
            if (neu === state.zoom)
                return;
            state.zoom = neu;
            zoomMerken(page.id, neu); /* F07 — auch Strg+Rad und Kneifen */
            zoom.value = String(neu);
            zoomLabel.textContent = neu + ' %';
            passen();
        };
        center.addEventListener('wheel', (event) => {
            if (!event.ctrlKey && !event.metaKey)
                return;
            event.preventDefault();
            zoomSetzen(state.zoom + (event.deltaY < 0 ? 10 : -10));
        }, { passive: false });
        const finger = new Map();
        let kneifen = null;
        center.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch')
                return;
            finger.set(event.pointerId, [event.clientX, event.clientY]);
            if (finger.size === 2) {
                const [a, b] = [...finger.values()];
                kneifen = { abstand: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, zoom: state.zoom };
            }
        }, true);
        center.addEventListener('pointermove', (event) => {
            if (!kneifen || !finger.has(event.pointerId))
                return;
            finger.set(event.pointerId, [event.clientX, event.clientY]);
            const [a, b] = [...finger.values()];
            const abstand = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
            zoomSetzen(kneifen.zoom * abstand / kneifen.abstand);
        }, true);
        const fingerWeg = (event) => {
            finger.delete(event.pointerId);
            if (finger.size < 2)
                kneifen = null;
        };
        center.addEventListener('pointerup', fingerWeg, true);
        center.addEventListener('pointercancel', fingerWeg, true);
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
