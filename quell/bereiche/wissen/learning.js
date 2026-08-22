"use strict";
/* ============================================================================
 * bereiche/wissen/learning.ts — Lernen aus normalen Redion-Inhalten
 * ----------------------------------------------------------------------------
 * Lernkarten, Notizen und Aufgaben bleiben gewöhnliche Blöcke. Dieses Modul
 * ergänzt nur einen kleinen, versionsfesten Quellverweis und baut daraus die
 * Tageswarteschlange, Fehlertraining und Statistik. Es gibt weder einen
 * zweiten Speicher noch eine heimliche Umstellung des Lernverfahrens:
 * `WissenDienst.planen` bleibt SM-2.
 * ==========================================================================*/
const Learning = (() => {
    const elementFrom = (event) => event.target instanceof Element ? event.target : null;
    /* Ohne Kontenmodul gehört der lokale Bestand weiterhin dem Gerät. Sobald
       Konten geladen ist, entscheidet ausschliesslich dessen bestehende
       `darf`-Semantik — hier entsteht keine zweite Rollenlogik. */
    const rightsActive = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const permitted = (action, pageId) => !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));
    const ownerPageId = (block) => {
        if (!block?.id || typeof Links === 'undefined' || !Links.seiteVon)
            return '';
        return String(Links.seiteVon(block.id)?.id || '');
    };
    const sourcePageId = (card) => {
        const ref = card?.sourceRef || card?.lernquelle;
        return String(ref?.pageId || ownerPageId(card));
    };
    const canReadCard = (card) => {
        if (!rightsActive())
            return true;
        const pageId = sourcePageId(card);
        const ownerId = ownerPageId(card);
        return !!pageId && !!ownerId && !!Store.getBlock(pageId) && !!Store.getBlock(ownerId) &&
            permitted('lesen', pageId) && permitted('lesen', ownerId);
    };
    /** Bewertet wird der Kartenblock, deshalb zählt die Seite, die ihn trägt. */
    const canEditCard = (card) => {
        if (!rightsActive())
            return true;
        const pageId = ownerPageId(card);
        return !!pageId && permitted('bearbeiten', pageId);
    };
    const cards = () => Object.values(Store.cache.blocks)
        .filter(block => block?.alive !== false && block?.type === 'flashcard' && canReadCard(block));
    const validDate = (value) => {
        const time = Date.parse(String(value || ''));
        return Number.isFinite(time) ? time : 0;
    };
    const reviewLog = (card) => {
        const raw = card?.reviewVerlauf;
        const entries = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
        return entries.filter((entry) => entry && typeof entry === 'object')
            .sort((left, right) => String(left.at || '').localeCompare(String(right.at || '')) ||
            String(left.id || '').localeCompare(String(right.id || '')));
    };
    const lastReview = (card) => {
        const log = reviewLog(card);
        return log.length ? log[log.length - 1] : null;
    };
    const isMistake = (card) => Number(lastReview(card)?.rating) < 3;
    /**
     * Die Tageswarteschlange ist nur eine Sicht auf vorhandene Karten.
     * Neue Karten werden pro Öffnen auf zwanzig begrenzt, fällige nie.
     */
    const dailyQueue = (newLimit = 20) => {
        const now = Date.now();
        const allCards = cards();
        const fresh = allCards.filter(card => !card.sr).slice(0, Math.max(0, newLimit));
        const scheduledDue = allCards.filter(card => card.sr &&
            (!card.sr.faellig || validDate(card.sr.faellig) <= now));
        const errors = scheduledDue.filter(isMistake);
        const errorIds = new Set(errors.map(card => card.id));
        const due = scheduledDue.filter(card => !errorIds.has(card.id));
        const future = allCards.filter(card => card.sr?.faellig && validDate(card.sr.faellig) > now)
            .sort((left, right) => validDate(left.sr.faellig) - validDate(right.sr.faellig));
        return {
            errors,
            due,
            newCards: fresh,
            all: [...errors, ...due, ...fresh],
            future,
            nextAt: future[0]?.sr?.faellig || ''
        };
    };
    const due = () => dailyQueue(Number.MAX_SAFE_INTEGER).all;
    const statistics = () => {
        const allCards = cards();
        const logs = allCards.flatMap(reviewLog);
        const localDay = (value) => {
            const date = value ? new Date(String(value)) : new Date();
            if (!Number.isFinite(date.getTime()))
                return '';
            return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0')].join('-');
        };
        const today = localDay(null);
        const todayLogs = logs.filter(entry => localDay(entry.at) === today);
        const successful = logs.filter(entry => Number(entry.rating) >= 3).length;
        const queue = dailyQueue();
        return {
            total: allCards.length,
            learned: allCards.filter(card => !!card.sr).length,
            due: queue.errors.length + queue.due.length,
            newCards: allCards.filter(card => !card.sr).length,
            mistakes: allCards.filter(isMistake).length,
            reviewedToday: todayLogs.length,
            reviews: logs.length,
            successRate: logs.length ? Math.round(successful / logs.length * 100) : 0,
            nextAt: queue.nextAt
        };
    };
    const clozeParts = (text) => {
        const answers = [];
        const front = text.replace(/\{\{([^{}\n]+)\}\}/g, (_whole, raw) => {
            const pieces = String(raw).split('::');
            const answer = (pieces.shift() || '').trim();
            const hint = pieces.join('::').trim();
            if (answer)
                answers.push(answer);
            return hint ? '[' + hint + ']' : '[…]';
        });
        if (!answers.length)
            return null;
        return [front, answers.join(' · ')];
    };
    /** Standardkarten benutzen `Frage :: Antwort`, Lückenkarten `{{Antwort}}`. */
    const splitCard = (card) => {
        const text = String(card?.text || '');
        const cloze = clozeParts(text);
        if (cloze)
            return cloze;
        const separator = text.indexOf('::');
        return separator >= 0
            ? [text.slice(0, separator).trim(), text.slice(separator + 2).trim()]
            : [text, '(noch keine Antwort — mit :: trennen oder {{Lücke}} setzen)'];
    };
    const sourceOf = (value) => {
        const raw = value?.sourceRef || value?.lernquelle || value;
        if (!raw || Number(raw.version) !== 1 || !raw.pageId || !raw.blockId)
            return null;
        return raw;
    };
    const sourceLabel = (source) => {
        if (!source)
            return '';
        const page = Store.getBlock(source.pageId);
        if ((rightsActive() && !page) || !permitted('lesen', source.pageId))
            return 'Nicht freigegebene Quelle';
        const pageTitle = String(page?.text || source.label || 'Ohne Titel');
        return source.pageNumber
            ? pageTitle + ' · Seite ' + Number(source.pageNumber)
            : pageTitle;
    };
    const makeSourceRef = (page, sourceBlock, region) => {
        const kind = sourceBlock?.type === 'pdfseite'
            ? 'pdfseite' : sourceBlock?.type === 'blatt' ? 'blatt' : 'block';
        const label = String(page?.text || 'Ohne Titel');
        const ref = {
            version: 1,
            kind,
            pageId: String(page?.id || ''),
            blockId: String(sourceBlock?.id || ''),
            label,
            createdAt: Store.now()
        };
        if (kind === 'pdfseite' && Number(sourceBlock?.nr))
            ref.pageNumber = Number(sourceBlock.nr);
        if (region && [region.x, region.y, region.width, region.height].every(Number.isFinite)) {
            ref.region = {
                x: Number(region.x), y: Number(region.y),
                width: Math.max(0, Number(region.width)), height: Math.max(0, Number(region.height))
            };
        }
        return ref;
    };
    /** Öffnet immer den echten Quellblock; ein Seitentitel reicht dafür nicht. */
    const jumpToSource = (value) => {
        const source = sourceOf(value);
        if (!source) {
            UI.toast('Für diesen Inhalt ist keine Quelle gespeichert.');
            return false;
        }
        if (!permitted('lesen', source.pageId)) {
            UI.toast('Du darfst diese Quellseite nicht lesen.');
            return false;
        }
        if (Store.getBlock(source.blockId) && App.zeigeBlock?.(source.blockId))
            return true;
        if (Store.getBlock(source.pageId)) {
            App.oeffne(source.pageId);
            UI.toast('Die Quellseite ist offen; der ursprüngliche Block fehlt.');
            return true;
        }
        UI.toast('Die gespeicherte Quelle ist nicht mehr vorhanden.');
        return false;
    };
    const button = (text, action, primary = false) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.dataset.learningAction = action;
        item.textContent = text;
        item.style.minHeight = '44px';
        if (primary)
            item.classList.add('prim');
        return item;
    };
    const overlay = (titleText) => {
        const root = document.createElement('div');
        root.className = 'overlay';
        const panel = document.createElement('div');
        panel.className = 'finder lern';
        panel.style.width = 'min(680px, 94vw)';
        panel.style.maxHeight = 'min(780px, 92vh)';
        panel.style.overflow = 'auto';
        const header = document.createElement('div');
        header.className = 'fh';
        const title = document.createElement('strong');
        title.textContent = titleText;
        const closeButton = button('✕', 'close');
        closeButton.classList.add('icon-btn');
        closeButton.setAttribute('aria-label', 'Schliessen');
        header.append(title, closeButton);
        const body = document.createElement('div');
        body.style.padding = '18px';
        panel.append(header, body);
        root.appendChild(panel);
        document.body.appendChild(root);
        const close = () => {
            root.dispatchEvent(new Event('learning-close'));
            root.remove();
        };
        root.addEventListener('click', event => {
            if (event.target === root || elementFrom(event)?.closest('[data-learning-action="close"]'))
                close();
        });
        return { root, panel, body, close };
    };
    const field = (labelText, multiline = false, placeholder = '') => {
        const wrap = document.createElement('label');
        wrap.style.display = 'grid';
        wrap.style.gap = '6px';
        wrap.style.marginBottom = '14px';
        const label = document.createElement('span');
        label.textContent = labelText;
        label.style.fontWeight = '650';
        const input = multiline ? document.createElement('textarea') : document.createElement('input');
        input.placeholder = placeholder;
        input.style.minHeight = multiline ? '110px' : '44px';
        if (multiline)
            input.rows = 4;
        wrap.append(label, input);
        return { wrap, input };
    };
    const addWithSource = (page, sourceBlock, region, type, fields) => {
        if (!permitted('bearbeiten', page?.id)) {
            UI.toast('Du darfst auf dieser Seite nichts anlegen.');
            return null;
        }
        const sourceRef = makeSourceRef(page, sourceBlock, region);
        /* `sourceRef` ist der kanonische Name. `lernquelle` hält denselben kleinen
           Vertrag für ältere/äussere Leser sichtbar; beides liegt am normalen
           Block und reist automatisch durch Sicherung und Synchronisation. */
        return Store.addBlock(page.id, type, { ...fields, sourceRef, lernquelle: sourceRef });
    };
    const loadImage = (url) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Das Seitenbild liess sich nicht öffnen.'));
        image.src = url;
    });
    const canvasBlob = (canvas) => new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Der Ausschnitt blieb leer.')), 'image/webp', 0.9);
    });
    /** Legt nur den gewählten Ausschnitt ab, niemals eine zweite volle PDF. */
    const createCrop = async (page, sourceBlock, region) => {
        if (!permitted('bearbeiten', page?.id)) {
            UI.toast('Du darfst auf dieser Seite keinen Ausschnitt anlegen.');
            return null;
        }
        if (sourceBlock?.type !== 'pdfseite' || !sourceBlock.bildDateiId || !region) {
            UI.toast('Für ein Bild zuerst auf einer PDF-Seite einen Ausschnitt markieren.');
            return null;
        }
        if (typeof Dateien === 'undefined') {
            UI.toast('Die Dateiablage ist noch nicht bereit.');
            return null;
        }
        let created = null;
        let stored = null;
        try {
            const url = await Dateien.adresse(sourceBlock.bildDateiId);
            if (!url)
                throw new Error('Das Seitenbild fehlt.');
            const image = await loadImage(url);
            const pageWidth = Number(sourceBlock.bw) || 595.28;
            const pageHeight = Number(sourceBlock.bh) || 841.89;
            const sx = Math.max(0, region.x / pageWidth * image.naturalWidth);
            const sy = Math.max(0, region.y / pageHeight * image.naturalHeight);
            const sw = Math.min(image.naturalWidth - sx, region.width / pageWidth * image.naturalWidth);
            const sh = Math.min(image.naturalHeight - sy, region.height / pageHeight * image.naturalHeight);
            if (sw < 2 || sh < 2)
                throw new Error('Der gewählte Ausschnitt ist zu klein.');
            const scale = Math.min(1, 1600 / Math.max(sw, sh));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(sw * scale));
            canvas.height = Math.max(1, Math.round(sh * scale));
            const context = canvas.getContext('2d');
            if (!context)
                throw new Error('Der Browser kann den Ausschnitt nicht zeichnen.');
            context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            const blob = await canvasBlob(canvas);
            const caption = 'Ausschnitt · Seite ' + (Number(sourceBlock.nr) || 1);
            created = addWithSource(page, sourceBlock, region, 'image', { caption, typ: 'image/webp' });
            if (!created)
                return null;
            const file = new File([blob], 'ausschnitt-seite-' + (Number(sourceBlock.nr) || 1) + '.webp', { type: 'image/webp' });
            /* Der kleine Ausschnitt ist Lerninhalt und nicht bloss ein jederzeit
               rekonstruierbarer Cache: er reist deshalb durch Backup und Sync. */
            stored = await Dateien.ablegen(file, { blockId: created.id });
            Store.updateBlock(created.id, { dateiId: stored.id });
            App.zeichneSeite();
            UI.toast('Bild-Ausschnitt angelegt.');
            return Store.getBlock(created.id) || created;
        }
        catch (error) {
            if (stored?.id && Dateien.weg)
                void Dateien.weg(stored.id);
            if (created?.id)
                Store.trashBlock(created.id);
            UI.toast(error instanceof Error ? error.message : String(error));
            return null;
        }
    };
    const formForAction = (body, kind, page, sourceBlock, region, close) => {
        body.replaceChildren();
        const source = document.createElement('p');
        source.textContent = 'Quelle: ' + sourceLabel(makeSourceRef(page, sourceBlock, region));
        source.style.color = 'var(--text-dim)';
        const fields = [];
        if (kind === 'card') {
            fields.push(field('Frage', true, 'Was soll abgefragt werden?'));
            fields.push(field('Antwort', true, 'Die kurze, eindeutige Antwort'));
        }
        else {
            fields.push(field(kind === 'task' ? 'Aufgabe' : 'Notiz', true, kind === 'task' ? 'Was ist zu erledigen?' : 'Gedanke zu dieser Stelle'));
        }
        const actions = document.createElement('div');
        actions.className = 'fbtns';
        actions.append(button('Abbrechen', 'close'), button('Anlegen', 'save', true));
        body.append(source, ...fields.map(item => item.wrap), actions);
        fields[0]?.input.focus();
        actions.addEventListener('click', event => {
            if (!elementFrom(event)?.closest('[data-learning-action="save"]'))
                return;
            const values = fields.map(item => item.input.value.trim());
            if (!values[0]) {
                UI.toast('Bitte zuerst einen Text eingeben.');
                return;
            }
            let created;
            if (kind === 'card') {
                created = addWithSource(page, sourceBlock, region, 'flashcard', { text: values[0] + ' :: ' + (values[1] || '') });
            }
            else if (kind === 'task') {
                created = addWithSource(page, sourceBlock, region, 'todo', { text: values[0], checked: false });
            }
            else {
                created = addWithSource(page, sourceBlock, region, 'text', { text: values[0] });
            }
            if (!created)
                return;
            close();
            App.zeichneSeite(created?.id, 'ende');
            UI.toast(kind === 'card' ? 'Karteikarte angelegt.' :
                kind === 'task' ? 'Aufgabe angelegt.' : 'Notiz angelegt.');
        });
    };
    /** Kontextaktionen des Dokumentmodus: alles entsteht als gewöhnlicher Block. */
    const sourceMenu = (page, sourceBlock, region) => {
        if (!page?.id || !sourceBlock?.id) {
            UI.toast('Die Quelle ist nicht vollständig.');
            return;
        }
        if (!permitted('lesen', page.id)) {
            UI.toast('Du darfst diese Quellseite nicht lesen.');
            return;
        }
        if (!permitted('bearbeiten', page.id)) {
            UI.toast('Du darfst auf dieser Seite keine Lerninhalte anlegen.');
            return;
        }
        const view = overlay('Aus Quelle anlegen');
        const source = document.createElement('p');
        source.textContent = sourceLabel(makeSourceRef(page, sourceBlock, region));
        source.style.color = 'var(--text-dim)';
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
        grid.style.gap = '10px';
        grid.append(button('¶ Als Notiz', 'note'), button('🎴 Als Karte', 'card'), button('☑ Als Aufgabe', 'task'), button('▧ Als Bild', 'image'), button('🔗 Als Link', 'link'));
        const imageButton = grid.querySelector('[data-learning-action="image"]');
        if (imageButton && (sourceBlock.type !== 'pdfseite' || !region)) {
            imageButton.disabled = true;
            imageButton.title = 'Dafür zuerst einen PDF-Ausschnitt markieren';
        }
        const hint = document.createElement('p');
        hint.textContent = region
            ? 'Der genaue Ausschnitt bleibt am neuen Block als Quelle gespeichert.'
            : 'Die genaue Dokumentseite bleibt am neuen Block als Quelle gespeichert.';
        hint.style.color = 'var(--text-dim)';
        hint.style.fontSize = '13px';
        view.body.append(source, grid, hint);
        grid.addEventListener('click', event => {
            const action = elementFrom(event)?.closest('[data-learning-action]')
                ?.dataset.learningAction;
            if (action === 'note' || action === 'card' || action === 'task') {
                formForAction(view.body, action, page, sourceBlock, region, view.close);
                return;
            }
            if (action === 'link') {
                const created = addWithSource(page, sourceBlock, region, 'text', { text: '((' + sourceBlock.id + '))' });
                if (!created)
                    return;
                view.close();
                App.zeichneSeite(created?.id, 'ende');
                UI.toast('Verweis auf die Quelle angelegt.');
                return;
            }
            if (action === 'image') {
                view.close();
                void createCrop(page, sourceBlock, region);
            }
        });
    };
    /** Aus markiertem Text entsteht eine Lückenkarte mit exaktem Blockverweis. */
    const clozeFromSelection = (block, selectedText, selectedOffset = -1) => {
        const selected = String(selectedText || '').trim();
        const original = String(block?.text || '');
        if (!block?.id || !selected || !original.includes(selected)) {
            UI.toast('Die markierte Stelle liess sich nicht als Lücke übernehmen.');
            return null;
        }
        const replaceSelection = () => selectedOffset >= 0 && original.slice(selectedOffset, selectedOffset + selected.length) === selected
            ? original.slice(0, selectedOffset) + '{{' + selected + '}}' + original.slice(selectedOffset + selected.length)
            : original.replace(selected, '{{' + selected + '}}');
        if (block.type === 'flashcard') {
            if (!canEditCard(block)) {
                UI.toast('Diese Karte ist nur lesbar und kann nicht geändert werden.');
                return null;
            }
            Store.updateBlock(block.id, { text: replaceSelection() });
            App.zeichneSeite(block.id, 'ende');
            UI.toast('Lücke in der Karte angelegt.');
            return Store.getBlock(block.id);
        }
        const page = Links.seiteVon(block.id);
        if (!page) {
            UI.toast('Zu diesem Text fehlt die Seite.');
            return null;
        }
        if (!permitted('bearbeiten', page.id)) {
            UI.toast('Du darfst auf dieser Seite keine Lückenkarte anlegen.');
            return null;
        }
        const text = replaceSelection();
        const created = addWithSource(page, block, null, 'flashcard', { text });
        if (!created)
            return null;
        App.zeichneSeite();
        UI.toast('Lückenkarte angelegt.');
        return created;
    };
    const statCard = (number, labelText) => {
        const card = document.createElement('div');
        card.style.padding = '14px';
        card.style.border = '1px solid var(--line)';
        card.style.borderRadius = '10px';
        const value = document.createElement('b');
        value.textContent = number;
        value.style.display = 'block';
        value.style.fontSize = '24px';
        const label = document.createElement('span');
        label.textContent = labelText;
        label.style.color = 'var(--text-dim)';
        label.style.fontSize = '13px';
        card.append(value, label);
        return card;
    };
    const open = () => {
        const view = overlay('🎴 Lernen');
        let session = [];
        let index = 0;
        let answerOpen = false;
        let learned = 0;
        const renderDashboard = () => {
            const queue = dailyQueue();
            const stats = statistics();
            view.body.replaceChildren();
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
            grid.style.gap = '10px';
            const nextShort = queue.nextAt
                ? new Date(queue.nextAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                : '–';
            grid.append(statCard(String(queue.errors.length), 'fällige Fehler'), statCard(String(queue.due.length), 'weitere fällige'), statCard(String(queue.newCards.length), 'neu in der Runde'), statCard(nextShort, 'nächster Termin'));
            const explanation = document.createElement('p');
            explanation.textContent = queue.all.length
                ? 'Deine Tagesrunde: zuerst fällige Fehler, dann fällige Karten und bis zu 20 neue.'
                : stats.total ? 'Für heute ist alles erledigt.' :
                    'Noch keine Karten. Lege eine Karte an oder markiere Text und wähle „Lücke“.';
            explanation.style.lineHeight = '1.55';
            const actions = document.createElement('div');
            actions.style.display = 'grid';
            actions.style.gap = '9px';
            const start = button('Tagesrunde starten · ' + queue.all.length, 'start-today', true);
            start.disabled = !queue.all.length;
            const allMistakes = cards().filter(isMistake);
            const mistakes = button('Fehler trainieren · ' + allMistakes.length, 'start-errors');
            mistakes.disabled = !allMistakes.length;
            actions.append(start, mistakes);
            const details = document.createElement('div');
            details.style.display = 'grid';
            details.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
            details.style.gap = '10px';
            details.style.marginTop = '16px';
            details.append(statCard(String(stats.learned) + ' / ' + String(stats.total), 'Karten mit Lernstand'), statCard(String(stats.reviewedToday), 'heute gelernt'), statCard(String(stats.successRate) + ' %', 'Antworten gut/leicht'), statCard(String(stats.reviews), 'Wiederholungen'));
            const next = document.createElement('p');
            next.style.color = 'var(--text-dim)';
            next.style.fontSize = '13px';
            next.textContent = stats.nextAt
                ? 'Nächster geplanter Termin: ' + new Date(String(stats.nextAt)).toLocaleString('de-DE')
                : 'Noch kein weiterer Termin geplant.';
            const algorithm = document.createElement('p');
            algorithm.style.color = 'var(--text-dim)';
            algorithm.style.fontSize = '12px';
            algorithm.textContent = 'Lernplan: SM-2 bleibt der Standard. Es findet keine automatische FSRS-Migration statt.';
            view.body.append(grid, explanation, actions, details, next, algorithm);
        };
        const renderSession = () => {
            view.body.replaceChildren();
            if (index >= session.length) {
                const done = document.createElement('div');
                done.style.padding = '26px 8px';
                done.style.textAlign = 'center';
                const title = document.createElement('h2');
                title.textContent = 'Fertig für heute';
                const text = document.createElement('p');
                text.textContent = learned + (learned === 1 ? ' Karte wiederholt.' : ' Karten wiederholt.');
                const back = button('Zur Übersicht', 'dashboard', true);
                done.append(title, text, back);
                view.body.appendChild(done);
                return;
            }
            const current = session[index];
            const [front, back] = splitCard(current);
            const editable = canEditCard(current);
            const progress = document.createElement('div');
            progress.style.color = 'var(--text-dim)';
            progress.style.fontSize = '13px';
            progress.textContent = (index + 1) + ' / ' + session.length;
            const card = document.createElement('section');
            card.className = 'karte';
            card.style.margin = '14px 0';
            card.style.minHeight = '210px';
            card.style.display = 'grid';
            card.style.alignContent = 'center';
            card.style.gap = '18px';
            const question = document.createElement('div');
            question.className = 'k-vorn';
            question.textContent = front;
            card.appendChild(question);
            if (answerOpen) {
                const separator = document.createElement('hr');
                const answer = document.createElement('div');
                answer.className = 'k-hinten';
                answer.textContent = back;
                card.append(separator, answer);
            }
            const source = sourceOf(current);
            if (source) {
                const sourceButton = button('Quelle: ' + sourceLabel(source), 'source');
                sourceButton.classList.add('k-quelle');
                card.appendChild(sourceButton);
            }
            const actions = document.createElement('div');
            actions.className = 'fbtns lern-btns';
            if (!answerOpen)
                actions.append(button('Antwort zeigen', 'reveal', true));
            else if (editable) {
                [['1', 'Nochmal'], ['2', 'Schwer'], ['3', 'Gut'], ['4', 'Leicht']]
                    .forEach(([rating, label]) => {
                    const item = button(label, 'rate-' + rating, rating === '3');
                    item.dataset.rating = rating;
                    actions.appendChild(item);
                });
            }
            else {
                const notice = document.createElement('span');
                notice.textContent = 'Nur Leserechte — diese Karte wird nicht bewertet.';
                notice.style.color = 'var(--text-dim)';
                actions.append(notice, button('Überspringen', 'skip'));
            }
            view.body.append(progress, card, actions);
        };
        const startSession = (selected) => {
            session = selected.slice();
            index = 0;
            learned = 0;
            answerOpen = false;
            renderSession();
        };
        view.body.addEventListener('click', event => {
            const target = elementFrom(event)?.closest('[data-learning-action]');
            const action = target?.dataset.learningAction || '';
            if (action === 'start-today') {
                startSession(dailyQueue().all);
                return;
            }
            if (action === 'start-errors') {
                startSession(cards().filter(isMistake));
                return;
            }
            if (action === 'reveal') {
                answerOpen = true;
                renderSession();
                return;
            }
            if (action === 'dashboard') {
                renderDashboard();
                return;
            }
            if (action === 'skip') {
                index++;
                answerOpen = false;
                renderSession();
                return;
            }
            if (action === 'source' && session[index]) {
                const current = session[index];
                view.close();
                jumpToSource(current);
                return;
            }
            if (target?.dataset.rating && session[index]) {
                if (!canEditCard(session[index])) {
                    UI.toast('Diese Karte ist nur lesbar und wird nicht bewertet.');
                    return;
                }
                WissenDienst.planen(session[index], Number(target.dataset.rating));
                learned++;
                index++;
                answerOpen = false;
                renderSession();
            }
        });
        const keyHandler = (event) => {
            if (!view.root.isConnected) {
                document.removeEventListener('keydown', keyHandler);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                view.close();
                return;
            }
            if (!session.length || index >= session.length)
                return;
            if (!answerOpen && (event.key === ' ' || event.key === 'Enter')) {
                event.preventDefault();
                answerOpen = true;
                renderSession();
                return;
            }
            if (answerOpen && /^[1-4]$/.test(event.key)) {
                event.preventDefault();
                if (!canEditCard(session[index])) {
                    UI.toast('Diese Karte ist nur lesbar und wird nicht bewertet.');
                    return;
                }
                WissenDienst.planen(session[index], Number(event.key));
                learned++;
                index++;
                answerOpen = false;
                renderSession();
            }
        };
        document.addEventListener('keydown', keyHandler);
        view.root.addEventListener('learning-close', () => document.removeEventListener('keydown', keyHandler), { once: true });
        renderDashboard();
    };
    return {
        cards, due, dailyQueue, statistics, reviewLog, splitCard,
        canReadCard, canEditCard,
        sourceOf, sourceLabel, makeSourceRef, jumpToSource,
        sourceMenu, createCrop, clozeFromSelection, open
    };
})();
window.Learning = Learning;
