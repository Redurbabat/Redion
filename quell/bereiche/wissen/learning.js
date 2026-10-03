"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/learning.ts (npm run bauen:ts). */
const Learning = (() => {
    const elementFrom = (event) => event.target instanceof Element ? event.target : null;
    const rightsActive = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const permitted = (action, pageId) => !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));
    const ownerPageId = (block) => {
        if (!block?.id || typeof Links === 'undefined' || !Links.seiteVon)
            return '';
        return String(Links.seiteVon(block.id)?.id || '');
    };
    const collectionPageId = (collectionId) => {
        const views = Object.values(Store.cache.blocks)
            .filter(block => block?.alive !== false && block.type === 'database' &&
            block.collectionId === collectionId);
        const view = views.find(block => !block.verknuepft) || views[0];
        return view ? ownerPageId(view) : '';
    };
    const canReadCollection = (collectionId) => {
        if (!rightsActive())
            return true;
        const pageId = collectionPageId(collectionId);
        return !!pageId && permitted('lesen', pageId);
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
    const ratingOf = (entry) => {
        const rating = Number(entry?.rating);
        return Number.isInteger(rating) && rating >= 1 && rating <= 4 ? rating : null;
    };
    const isMistake = (card) => {
        const review = lastReview(card);
        const rating = ratingOf(review);
        return review?.correct === false || (rating !== null && rating < 3);
    };
    const localDay = (value) => {
        const date = value ? new Date(value) : new Date();
        if (!Number.isFinite(date.getTime()))
            return '';
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')].join('-');
    };
    const calendarDayNumber = (date) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
    const dateFrom = (value) => {
        if (value instanceof Date) {
            const copy = new Date(value.getTime());
            return Number.isFinite(copy.getTime()) ? copy : null;
        }
        if (typeof value === 'number') {
            const date = new Date(value);
            return Number.isFinite(date.getTime()) ? date : null;
        }
        const nested = value && typeof value === 'object'
            ? value.start ?? value.date ?? value.from
            : value;
        const text = String(nested || '').trim();
        const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
        if (plain) {
            const year = Number(plain[1]), month = Number(plain[2]) - 1, day = Number(plain[3]);
            const date = new Date(year, month, day);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day)
                return date;
            return null;
        }
        const date = new Date(text);
        return Number.isFinite(date.getTime()) ? date : null;
    };
    const topicLabel = (card) => {
        const explicit = card?.quiz?.topic ?? card?.lernThema ?? card?.topic;
        if (String(explicit || '').trim())
            return String(explicit).trim().slice(0, 120);
        const ref = card?.sourceRef || card?.lernquelle;
        const sourcePage = ref?.pageId ? Store.getBlock(String(ref.pageId)) : null;
        const sourceTitle = String(sourcePage?.text || ref?.label || '').trim();
        if (sourceTitle)
            return sourceTitle.slice(0, 120);
        const owner = Store.getBlock(ownerPageId(card));
        return String(owner?.text || 'Ohne Thema').trim().slice(0, 120) || 'Ohne Thema';
    };
    const andereBelege = () => {
        const B = window.Belege;
        const LW = window.Lernwelt;
        if (!B || typeof B.ausSimulationen !== 'function')
            return [];
        let sims = [];
        try {
            if (LW && LW.modelle && typeof LW.modelle.simulationen === 'function')
                sims = LW.modelle.simulationen();
        }
        catch {
            sims = [];
        }
        return B.ausSimulationen(sims);
    };
    const kompetenzJeThema = (allCards, now) => {
        const K = window.Kompetenz;
        if (!K || typeof K.jeThema !== 'function')
            return new Map();
        const liste = allCards.map((card) => ({
            id: String(card?.id || ''),
            thema: topicLabel(card),
            titel: String(card?.text || '').slice(0, 60),
            sr: card?.sr,
            reviewVerlauf: card?.reviewVerlauf
        })).filter(c => c.id).concat(andereBelege());
        const out = new Map();
        for (const e of K.jeThema(liste, { jetzt: now }))
            out.set(String(e.thema).toLocaleLowerCase('de-CH'), e);
        return out;
    };
    const topicProgress = (allCards = cards(), now = Date.now()) => {
        const kompetenz = kompetenzJeThema(allCards, now);
        const groups = new Map();
        allCards.forEach(card => {
            const label = topicLabel(card);
            const id = label.toLocaleLowerCase('de-CH');
            const group = groups.get(id) || {
                id, label, total: 0, learned: 0, stable: 0, due: 0, errors: 0, progress: 0,
                belege: 0, sicherheit: 0, stufe: '', kompetenzSatz: '', points: 0
            };
            const repetitions = Math.max(0, Math.floor(Number(card?.sr?.wdh) || 0));
            group.total++;
            if (card?.sr || reviewLog(card).length)
                group.learned++;
            if (repetitions >= 2)
                group.stable++;
            if (card?.sr && (!card.sr.faellig || validDate(card.sr.faellig) <= now))
                group.due++;
            if (isMistake(card))
                group.errors++;
            group.points += Math.min(2, repetitions);
            groups.set(id, group);
        });
        return [...groups.values()].map(group => {
            const k = kompetenz.get(group.id);
            return {
                id: group.id,
                label: group.label,
                total: group.total,
                learned: group.learned,
                stable: group.stable,
                due: group.due,
                errors: group.errors,
                progress: group.total ? Math.round(group.points / (group.total * 2) * 100) : 0,
                belege: k ? k.belege : 0,
                sicherheit: k && k.genug ? Math.round(k.sicherheit * 100) : 0,
                stufe: k ? k.stufe : '',
                kompetenzSatz: k ? k.satz : ''
            };
        }).sort((left, right) => right.errors - left.errors || right.due - left.due ||
            left.label.localeCompare(right.label, 'de-CH'));
    };
    const nextExam = (nowValue = new Date()) => {
        const now = dateFrom(nowValue) || new Date();
        const today = calendarDayNumber(now);
        const upcoming = [];
        Object.values(Store.cache.collections)
            .filter(collection => collection?.schoolKind === 'exams' && canReadCollection(collection.id))
            .forEach(collection => {
            const schema = collection.schema || {};
            const keys = Object.keys(schema);
            const dateKey = keys.find(key => schema[key]?.type === 'date');
            const titleKey = keys.find(key => schema[key]?.type === 'title');
            const statusKey = keys.find(key => schema[key]?.type === 'status');
            if (!dateKey)
                return;
            Store.rowsOf(collection.id).forEach((row) => {
                if (!row || row.alive === false)
                    return;
                const status = String(statusKey ? row.props?.[statusKey] || '' : '').trim();
                if (/^(geschrieben|abgeschlossen|abgesagt|erledigt)$/i.test(status))
                    return;
                const date = dateFrom(row.props?.[dateKey]);
                if (!date)
                    return;
                const days = calendarDayNumber(date) - today;
                if (days < 0)
                    return;
                upcoming.push({
                    collectionId: String(collection.id),
                    rowId: String(row.id),
                    title: String(row.text || (titleKey ? row.props?.[titleKey] : '') || 'Prüfung').trim(),
                    date: localDay(date),
                    days
                });
            });
        });
        upcoming.sort((left, right) => left.days - right.days ||
            left.title.localeCompare(right.title, 'de-CH') || left.rowId.localeCompare(right.rowId));
        return upcoming[0] || null;
    };
    const dailyQueue = (newLimit = 20, nowValue = new Date()) => {
        const nowDate = dateFrom(nowValue) || new Date();
        const now = nowDate.getTime();
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
            nextAt: future[0]?.sr?.faellig || '',
            exam: nextExam(nowDate)
        };
    };
    const due = () => dailyQueue(Number.MAX_SAFE_INTEGER).all;
    const statistics = (queue = dailyQueue()) => {
        const allCards = cards();
        const K = window.Kompetenz;
        const gesamtKompetenz = K && typeof K.gesamt === 'function'
            ? K.gesamt(allCards.map((card) => ({
                id: String(card?.id || ''), thema: 'alles',
                sr: card?.sr, reviewVerlauf: card?.reviewVerlauf
            })).filter((c) => c.id).concat(andereBelege()))
            : null;
        const logs = allCards.flatMap(reviewLog);
        const today = localDay(null);
        const todayLogs = logs.filter(entry => localDay(entry.at) === today);
        const rated = logs.filter(entry => ratingOf(entry) !== null);
        const todayRated = todayLogs.filter(entry => ratingOf(entry) !== null);
        const successful = rated.filter(entry => Number(entry.rating) >= 3).length;
        const againReviews = rated.filter(entry => ratingOf(entry) === 1).length;
        const todayAgain = todayRated.filter(entry => ratingOf(entry) === 1).length;
        return {
            total: allCards.length,
            learned: allCards.filter(card => !!card.sr).length,
            due: queue.errors.length + queue.due.length,
            newCards: allCards.filter(card => !card.sr).length,
            mistakes: allCards.filter(isMistake).length,
            reviewedToday: todayLogs.length,
            reviews: logs.length,
            againReviews,
            againRate: rated.length ? Math.round(againReviews / rated.length * 100) : 0,
            againRateToday: todayRated.length ? Math.round(todayAgain / todayRated.length * 100) : 0,
            successRate: rated.length ? Math.round(successful / rated.length * 100) : 0,
            belege: gesamtKompetenz ? gesamtKompetenz.belege : rated.length,
            sicherheit: gesamtKompetenz && gesamtKompetenz.genug
                ? Math.round(gesamtKompetenz.sicherheit * 100) : 0,
            kompetenzSatz: gesamtKompetenz ? gesamtKompetenz.satz : '',
            nextAt: queue.nextAt,
            topics: topicProgress(allCards)
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
    const examWhen = (exam) => {
        if (!exam)
            return '–';
        if (exam.days === 0)
            return 'heute';
        if (exam.days === 1)
            return 'morgen';
        return 'in ' + exam.days + ' Tagen';
    };
    const auffrischSection = (allCards = cards(), now = Date.now()) => {
        const K = window.Kompetenz;
        if (!K || typeof K.auffrischen !== 'function')
            return null;
        const themen = [...kompetenzJeThema(allCards, now).values()];
        const liste = K.auffrischen(themen, { hoechstens: 4 });
        if (!liste.length)
            return null;
        const section = document.createElement('section');
        section.style.marginTop = '20px';
        const title = document.createElement('h3');
        title.textContent = 'Zuerst auffrischen';
        title.style.marginBottom = '4px';
        const unter = document.createElement('p');
        unter.style.cssText = 'margin:0 0 10px; font-size:12.5px; color:var(--text-faint)';
        unter.textContent = 'Nach dem, was rechnerisch am meisten verblasst ist. ' +
            'Fälliges zählt doppelt, weil es sich sofort zurückholen lässt — und ' +
            'nur Themen, bei denen mindestens eine ganze Karte verblasst ist.';
        section.append(title, unter);
        const list = document.createElement('div');
        list.style.cssText = 'display:grid; gap:8px';
        liste.forEach((e) => {
            const row = document.createElement('div');
            row.style.cssText = 'padding:9px 11px; border:1px solid var(--line); ' +
                'border-radius:9px; display:flex; justify-content:space-between; ' +
                'gap:12px; align-items:baseline';
            const links = document.createElement('div');
            const name = document.createElement('strong');
            name.textContent = e.thema;
            const satz = document.createElement('small');
            satz.style.cssText = 'display:block; margin-top:2px; color:var(--text-dim)';
            satz.textContent = e.satz;
            links.append(name, satz);
            const rechts = document.createElement('span');
            rechts.style.cssText = 'white-space:nowrap; font-variant-numeric:tabular-nums; ' +
                'color:var(--text-faint); font-size:13px';
            rechts.textContent = Math.round(e.haltbarkeit * 100) + ' %';
            rechts.title = 'Anteil des Themas, der heute rechnerisch noch sitzt';
            row.append(links, rechts);
            list.appendChild(row);
        });
        section.appendChild(list);
        return section;
    };
    const verlaufSection = (allCards = cards(), now = Date.now()) => {
        const K = window.Kompetenz;
        if (!K || typeof K.verlauf !== 'function')
            return null;
        const liste = allCards.map((card) => ({
            id: String(card?.id || ''), thema: topicLabel(card),
            titel: String(card?.text || '').slice(0, 60),
            sr: card?.sr, reviewVerlauf: card?.reviewVerlauf
        })).filter((c) => c.id);
        const reihen = K.verlauf(liste, { jetzt: now });
        if (!reihen.length)
            return null;
        const section = document.createElement('section');
        section.style.marginTop = '20px';
        const title = document.createElement('h3');
        title.textContent = 'Geht es aufwärts?';
        title.style.marginBottom = '4px';
        const unter = document.createElement('p');
        unter.style.cssText = 'margin:0 0 10px; font-size:12.5px; color:var(--text-faint)';
        unter.textContent = 'Die letzten ' + (reihen[0].tage) + ' Tage gegen die ' +
            reihen[0].tage + ' davor. Nur Themen, die in BEIDEN Zeiträumen genug ' +
            'Antworten haben — sonst wäre es ein Vergleich mit nichts.';
        section.append(title, unter);
        const list = document.createElement('div');
        list.style.cssText = 'display:grid; gap:8px';
        reihen.forEach((e) => {
            const row = document.createElement('div');
            row.style.cssText = 'padding:9px 11px; border:1px solid var(--line); ' +
                'border-radius:9px; display:flex; justify-content:space-between; ' +
                'gap:12px; align-items:baseline';
            const links = document.createElement('div');
            const name = document.createElement('strong');
            name.textContent = e.thema;
            const satz = document.createElement('small');
            satz.style.cssText = 'display:block; margin-top:2px; color:var(--text-dim)';
            satz.textContent = e.satz;
            links.append(name, satz);
            const rechts = document.createElement('span');
            const punkte = Math.round(e.unterschied * 100);
            const zeichen = e.richtung === 'auf' ? '▲' : e.richtung === 'ab' ? '▼' : '=';
            const farbe = e.richtung === 'auf' ? 'var(--c-green)'
                : e.richtung === 'ab' ? 'var(--c-red)' : 'var(--text-faint)';
            rechts.style.cssText = 'white-space:nowrap; font-variant-numeric:tabular-nums; ' +
                'font-size:13px; color:' + farbe;
            rechts.textContent = e.richtung === 'gleich'
                ? '= gleich'
                : zeichen + ' ' + (punkte > 0 ? '+' : '') + punkte + ' Punkte';
            rechts.title = 'Unterschied der Sicherheit in Prozentpunkten';
            row.append(links, rechts);
            list.appendChild(row);
        });
        section.appendChild(list);
        return section;
    };
    const topicSection = (topics) => {
        const section = document.createElement('section');
        section.style.marginTop = '20px';
        const title = document.createElement('h3');
        title.textContent = 'Themenfortschritt';
        title.style.marginBottom = '10px';
        section.appendChild(title);
        if (!topics.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Noch keine Themen mit Lernkarten.';
            empty.style.color = 'var(--text-dim)';
            section.appendChild(empty);
            return section;
        }
        const list = document.createElement('div');
        list.style.display = 'grid';
        list.style.gap = '10px';
        topics.forEach(topic => {
            const row = document.createElement('div');
            row.style.padding = '11px 12px';
            row.style.border = '1px solid var(--line)';
            row.style.borderRadius = '9px';
            const heading = document.createElement('div');
            heading.style.display = 'flex';
            heading.style.justifyContent = 'space-between';
            heading.style.gap = '12px';
            const label = document.createElement('strong');
            label.textContent = topic.label;
            const percent = document.createElement('span');
            percent.textContent = topic.progress + ' %';
            percent.style.whiteSpace = 'nowrap';
            percent.title = 'Abdeckung: wie viele Karten mindestens zweimal sassen. ' +
                'Keine Aussage darüber, wie sicher der Stoff sitzt.';
            heading.append(label, percent);
            const progress = document.createElement('progress');
            progress.max = 100;
            progress.value = topic.progress;
            progress.setAttribute('aria-label', 'Fortschritt für ' + topic.label);
            progress.style.display = 'block';
            progress.style.width = '100%';
            progress.style.margin = '8px 0 5px';
            const detail = document.createElement('small');
            detail.style.color = 'var(--text-dim)';
            const parts = ['Abdeckung: ' + topic.learned + ' von ' + topic.total + ' begonnen',
                topic.stable + ' stabil'];
            if (topic.due)
                parts.push(topic.due + ' fällig');
            if (topic.errors)
                parts.push(topic.errors + ' Fehler');
            detail.textContent = parts.join(' · ');
            row.append(heading, progress, detail);
            if (topic.kompetenzSatz) {
                const koennen = document.createElement('small');
                koennen.style.display = 'block';
                koennen.style.marginTop = '3px';
                koennen.style.color = topic.stufe ? 'var(--text)' : 'var(--text-faint)';
                koennen.textContent = topic.kompetenzSatz;
                row.appendChild(koennen);
            }
            list.appendChild(row);
        });
        section.appendChild(list);
        return section;
    };
    const open = () => {
        const view = overlay('🎴 Lernen');
        let session = [];
        let index = 0;
        let answerOpen = false;
        let learned = 0;
        const renderDashboard = () => {
            const queue = dailyQueue();
            const stats = statistics(queue);
            view.body.replaceChildren();
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
            grid.style.gap = '10px';
            grid.append(statCard(String(queue.errors.length + queue.due.length), 'Karten fällig'), statCard(String(queue.newCards.length), 'neue Karten'), statCard(String(queue.errors.length), 'Fehler'), statCard(examWhen(queue.exam), queue.exam ? 'Prüfung · ' + queue.exam.title : 'Prüfung'));
            const exam = document.createElement('p');
            exam.style.color = 'var(--text-dim)';
            exam.style.fontSize = '13px';
            exam.textContent = queue.exam
                ? 'Prüfung ' + examWhen(queue.exam) + ': ' + queue.exam.title + ' · ' +
                    new Date(queue.exam.date + 'T12:00:00').toLocaleDateString('de-CH')
                : 'Keine anstehende Prüfung in den Ausbildungsdaten gefunden.';
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
            details.append(statCard(String(stats.learned) + ' / ' + String(stats.total), 'Karten mit Lernstand'), statCard(String(stats.reviewedToday), 'heute gelernt'), statCard(String(stats.againRate) + ' %', 'Nochmal-Rate'), statCard(String(stats.reviews), 'Wiederholungen'));
            const next = document.createElement('p');
            next.style.color = 'var(--text-dim)';
            next.style.fontSize = '13px';
            next.textContent = stats.nextAt
                ? 'Nächster geplanter Termin: ' + new Date(String(stats.nextAt)).toLocaleString('de-DE')
                : 'Noch kein weiterer Termin geplant.';
            const algorithm = document.createElement('div');
            algorithm.className = 'lern-verfahren';
            const jetzt = String(Store.getMeta('lernVerfahren', 'sm2'));
            const titel = document.createElement('p');
            titel.style.fontSize = '13px';
            titel.style.margin = '0 0 6px';
            titel.textContent = 'Lernplan';
            const reihe = document.createElement('div');
            reihe.style.display = 'flex';
            reihe.style.gap = '6px';
            reihe.style.flexWrap = 'wrap';
            const satz = document.createElement('p');
            satz.style.color = 'var(--text-dim)';
            satz.style.fontSize = '12px';
            satz.style.margin = '8px 0 0';
            const satzSetzen = (art) => {
                satz.textContent = art === 'fsrs'
                    ? 'FSRS rechnet, wie wahrscheinlich du eine Karte noch kannst, und ' +
                        'setzt den Termin dorthin, wo sie unter deine Zielrate fällt. ' +
                        'Schon geplante Termine bleiben, wie sie sind — umgestellt wird ' +
                        'jede Karte erst bei ihrer nächsten Antwort, und im Verlauf steht ' +
                        'dann, dass ihr Startwert aus SM-2 geschätzt wurde.'
                    : 'SM-2 ist das Verfahren von Anki: leichter beantwortet = längerer ' +
                        'Abstand. Es bleibt die Vorgabe, und es findet keine automatische ' +
                        'Umstellung statt.';
            };
            const WAHL = [['sm2', 'SM-2 (Anki)'], ['fsrs', 'FSRS 4.5']];
            for (const [wert, name] of WAHL) {
                const k = document.createElement('button');
                k.type = 'button';
                k.className = 'lern-verfahren-knopf' + (jetzt === wert ? ' on' : '');
                k.textContent = name;
                k.setAttribute('aria-pressed', jetzt === wert ? 'true' : 'false');
                k.dataset.verfahren = wert;
                k.addEventListener('click', () => {
                    Store.setMeta('lernVerfahren', wert);
                    reihe.querySelectorAll('[data-verfahren]').forEach(x => {
                        const an = x.dataset.verfahren === wert;
                        x.classList.toggle('on', an);
                        x.setAttribute('aria-pressed', an ? 'true' : 'false');
                    });
                    satzSetzen(wert);
                    UI.toast(wert === 'fsrs' ? 'Ab jetzt plant FSRS' : 'Ab jetzt plant SM-2');
                });
                reihe.appendChild(k);
            }
            satzSetzen(jetzt);
            algorithm.append(titel, reihe, satz);
            const auffrisch = auffrischSection();
            const richtung = verlaufSection();
            view.body.append(grid, exam, explanation, actions, details, ...(auffrisch ? [auffrisch] : []), topicSection(stats.topics), ...(richtung ? [richtung] : []), next, algorithm);
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
        cards, due, dailyQueue, statistics, reviewLog, topicProgress, nextExam, splitCard,
        canReadCard, canEditCard,
        sourceOf, sourceLabel, makeSourceRef, jumpToSource,
        sourceMenu, createCrop, clozeFromSelection, open
    };
})();
window.Learning = Learning;
