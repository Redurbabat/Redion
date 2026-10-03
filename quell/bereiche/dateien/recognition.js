"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/dateien/recognition.ts (npm run bauen:ts). */
const Recognition = (() => {
    const MAX_CAPTURE = 80 * 1024 * 1024;
    const MAX_OCR_SOURCE = 50 * 1024 * 1024;
    const MAX_OCR_TEXT = 120000;
    const MAX_OCR_REGIONS = 128;
    const MAX_OCR_TOTAL_TEXT_BYTES = 512 * 1024;
    const MAX_INK_MARKS = 5000;
    const MAX_INK_POINTS_PER_MARK = 12000;
    const MAX_INK_POINTS = 160000;
    const pageIdOf = (subject) => {
        let current = typeof subject === 'string' ? Store.getBlock(subject) : subject;
        for (let depth = 0; current && depth < 60; depth++) {
            if (current.type === 'page' && current.id)
                return String(current.id);
            current = current.parentId ? Store.getBlock(current.parentId) : null;
        }
        return null;
    };
    const may = (action, subject) => {
        if (typeof Konten === 'undefined' || typeof Konten.darf !== 'function')
            return true;
        const pageId = pageIdOf(subject);
        if (!pageId) {
            if (subject)
                return false;
            const aktuelleSeitenId = typeof App !== 'undefined' && App.aktuelleSeite
                ? App.aktuelleSeite() : null;
            return aktuelleSeitenId ? Konten.darf(action, aktuelleSeitenId) : true;
        }
        return Konten.darf(action, pageId);
    };
    const requireAccess = (action, subject, message) => {
        if (!may(action, subject))
            throw new Error(message);
    };
    const textBytes = (value) => new TextEncoder().encode(String(value ?? '')).byteLength;
    const localEndpoint = (raw) => {
        try {
            const url = new URL(raw);
            const host = url.hostname.toLowerCase();
            if (!['localhost', '127.0.0.1', '::1'].includes(host))
                return null;
            if (url.protocol !== 'http:' && url.protocol !== 'https:')
                return null;
            return url;
        }
        catch {
            return null;
        }
    };
    const configuredEndpoint = () => String(Store.getMeta('ocr:localEndpoint', '') || '');
    const configure = async () => {
        const currentPage = typeof App !== 'undefined' && App.aktuelleSeite
            ? Store.getBlock(App.aktuelleSeite()) : null;
        if (currentPage && !may('bearbeiten', currentPage)) {
            UI.toast('Auf dieser Seite darfst du keine Erkennungseinstellungen ändern.');
            return null;
        }
        const current = configuredEndpoint() || 'http://127.0.0.1:8765/ocr';
        if (typeof Dialog !== 'undefined' && Dialog.wahl && !configuredEndpoint()) {
            const weiter = await Dialog.wahl({
                titel: 'Lokale Erkennung einrichten',
                text: 'Text aus Bildern liest ein kleiner Dienst auf DIESEM Rechner — ' +
                    'nichts geht ins Netz. Redion liefert ihn mit. Einmal starten mit ' +
                    '„node dienste/ocr.mts", dann hier seine Adresse eintragen. ' +
                    'Die ganze Anleitung mit Installation steht in doku/OCR-DIENST.md.',
                knoepfe: [
                    { id: 'weiter', text: 'Adresse eintragen', hinweis: 'Vorgabe: ' + current },
                    { id: '', text: 'Abbrechen', hinweis: 'Es wird nichts gespeichert' }
                ]
            });
            if (weiter !== 'weiter')
                return null;
        }
        const answer = typeof Dialog !== 'undefined'
            ? await Dialog.frage('Lokalen OCR-Dienst einrichten', current)
            : window.prompt('Adresse des lokalen OCR-Diensts', current);
        if (answer === null || String(answer).trim() === '')
            return null;
        const url = localEndpoint(String(answer).trim());
        if (!url) {
            UI.toast('OCR darf hier nur einen Dienst auf localhost verwenden.');
            return null;
        }
        if (currentPage)
            requireAccess('bearbeiten', currentPage, 'Auf dieser Seite darfst du keine Erkennungseinstellungen ändern.');
        Store.setMeta('ocr:localEndpoint', url.toString());
        UI.toast('Lokaler OCR-Dienst gespeichert: ' + url.host);
        return url.toString();
    };
    const capturePage = () => {
        const blocks = Object.values(Store.cache.blocks);
        const known = blocks.find(block => block?.alive !== false && block.type === 'page' &&
            (block.captureInbox === true || block.systemRole === 'capture-inbox') &&
            may('lesen', block));
        if (known) {
            requireAccess('bearbeiten', known, 'Den vorhandenen Eingang darfst du nicht bearbeiten.');
            return known;
        }
        const school = blocks.find(block => block?.alive !== false && block.type === 'page' &&
            (block.schoolRoot === true || block.systemRole === 'school-root') &&
            may('lesen', block));
        requireAccess('bearbeiten', school || null, school ? 'Die Schulbibliothek darfst du nicht bearbeiten.' :
            'Auf der aktuellen Seite darfst du keinen Eingang anlegen.');
        const page = Store.addPage(school?.id || null, {
            text: 'Eingang & Ablage', icon: '📥', captureInbox: true,
            systemRole: 'capture-inbox'
        });
        requireAccess('bearbeiten', page, 'Den neu angelegten Eingang darfst du nicht bearbeiten.');
        Store.addBlock(page.id, 'callout', {
            icon: '📥', text: 'Fotos, Scans und Dateien landen hier unverändert. Du kannst sie später in deine Seiten verschieben.'
        });
        if (school) {
            requireAccess('bearbeiten', school, 'Die Schulbibliothek darfst du nicht bearbeiten.');
            Store.updateBlock(school.id, { aufgeklappt: true });
        }
        return page;
    };
    const attach = async (page, file) => {
        requireAccess('bearbeiten', page, 'Die Zielseite darfst du nicht bearbeiten.');
        const isImage = /^image\//i.test(file.type);
        const block = Store.addBlock(page.id, isImage ? 'image' : 'file', {
            text: file.name || (isImage ? 'Scan' : 'Datei'), typ: file.type,
            capture: { fassung: 1, created: Store.now(), originalName: file.name || '' }
        });
        try {
            const record = await Dateien.ablegen(file, { blockId: block.id, name: file.name });
            requireAccess('bearbeiten', page, 'Die Zielseite darf nicht mehr bearbeitet werden; der Anhang wurde nicht eingetragen.');
            Store.updateBlock(block.id, { dateiId: record.id });
            return block;
        }
        catch (error) {
            if (may('bearbeiten', page)) {
                Store.trashBlock(block.id);
                Store.purgeBlock(block.id);
            }
            throw error;
        }
    };
    const scan = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.multiple = true;
        input.setAttribute('capture', 'environment');
        input.addEventListener('change', async () => {
            const files = Array.from(input.files || []);
            if (!files.length)
                return;
            let page;
            try {
                page = capturePage();
            }
            catch (error) {
                UI.banner('Aufnahme nicht möglich: ' +
                    (error instanceof Error ? error.message : String(error)), 'fehler');
                return;
            }
            let count = 0;
            const progress = UI.toast('Aufnahme wird unverändert abgelegt …', 120000);
            for (const file of files) {
                try {
                    requireAccess('bearbeiten', page, 'Die Zielseite darfst du nicht bearbeiten.');
                    if (file.size > MAX_CAPTURE)
                        throw new Error('Die Datei ist grösser als ' + Math.round(MAX_CAPTURE / 1048576) + ' MB.');
                    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))
                        await PdfEinlesen.alsSeiten(file, page.id);
                    else
                        await attach(page, file);
                    count++;
                }
                catch (error) {
                    UI.banner(file.name + ': ' + (error instanceof Error ? error.message : String(error)), 'fehler');
                }
            }
            progress.remove();
            App.zeichneBaum();
            App.oeffne(page.id);
            UI.toast(count + (count === 1 ? ' Aufnahme liegt im Eingang' : ' Aufnahmen liegen im Eingang'));
        });
        input.click();
    };
    const consent = async (endpoint) => {
        const text = 'Der markierte Ausschnitt wird jetzt einmalig an deinen lokalen Dienst ' +
            endpoint.origin + ' gesendet. Das Original bleibt in Redion.';
        if (typeof Dialog !== 'undefined') {
            return await Dialog.wahl({
                titel: 'Lokale Erkennung starten', text,
                knoepfe: [
                    { id: 'send', text: 'An localhost senden', hinweis: 'Nur dieser Ausschnitt' },
                    { id: '', text: 'Abbrechen', hinweis: 'Es wird nichts gesendet' }
                ]
            }) === 'send';
        }
        return window.confirm(text);
    };
    const imageFromBlob = async (blob) => {
        if (typeof createImageBitmap === 'function') {
            const bitmap = await createImageBitmap(blob);
            return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
        }
        const url = URL.createObjectURL(blob);
        const image = new Image();
        await new Promise((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'));
            image.src = url;
        });
        return { image, width: image.naturalWidth, height: image.naturalHeight,
            close: () => URL.revokeObjectURL(url) };
    };
    const pdfCrop = async (block, region) => {
        const original = await Dateien.alsBlob(block.bildDateiId);
        if (!original)
            throw new Error('Das Seitenbild fehlt. Stelle es zuerst aus dem PDF wieder her.');
        if (original.size > MAX_OCR_SOURCE)
            throw new Error('Das Seitenbild ist für eine sichere Erkennung zu gross.');
        const source = await imageFromBlob(original);
        try {
            if (source.width * source.height > 50000000)
                throw new Error('Das Bild hat zu viele Pixel.');
            const width = Number(block.bw) || SheetSpace.A4_BREITE;
            const height = Number(block.bh) || SheetSpace.A4_HOEHE;
            const sx = Math.max(0, region.x / width * source.width);
            const sy = Math.max(0, region.y / height * source.height);
            const sw = Math.max(1, Math.min(source.width - sx, region.width / width * source.width));
            const sh = Math.max(1, Math.min(source.height - sy, region.height / height * source.height));
            const scale = Math.min(1, 2048 / sw, 2048 / sh);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(sw * scale));
            canvas.height = Math.max(1, Math.round(sh * scale));
            const context = canvas.getContext('2d');
            if (!context)
                throw new Error('Bildfläche ist nicht verfügbar.');
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(source.image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            return await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Ausschnitt konnte nicht erzeugt werden.')), 'image/webp', 0.9));
        }
        finally {
            source.close();
        }
    };
    const inkCrop = async (block, region) => {
        const marks = Array.isArray(block.marken) ? block.marken : [];
        if (marks.length > MAX_INK_MARKS)
            throw new Error('Diese Handschrift enthält mehr als ' + MAX_INK_MARKS +
                ' Marken. Teile den Ausschnitt auf; das Original bleibt unverändert.');
        let totalPoints = 0;
        for (const mark of marks) {
            const points = Array.isArray(mark?.pts) ? mark.pts.length : 0;
            const pressure = Array.isArray(mark?.pressure) ? mark.pressure.length : 0;
            const markPoints = Math.max(points, pressure) + (Array.isArray(mark?.point) ? 1 : 0);
            if (markPoints > MAX_INK_POINTS_PER_MARK)
                throw new Error('Eine Handschrift-Marke enthält mehr als ' + MAX_INK_POINTS_PER_MARK +
                    ' Punkte. Der Ausschnitt wird nicht aufgebaut; das Original bleibt unverändert.');
            totalPoints += markPoints;
            if (totalPoints > MAX_INK_POINTS)
                throw new Error('Diese Handschrift enthält insgesamt mehr als ' + MAX_INK_POINTS +
                    ' Punkte. Teile den Ausschnitt auf; das Original bleibt unverändert.');
        }
        const namespace = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(namespace, 'svg');
        svg.setAttribute('xmlns', namespace);
        svg.setAttribute('viewBox', `${region.x} ${region.y} ${region.width} ${region.height}`);
        svg.setAttribute('width', String(Math.min(2048, Math.max(320, Math.round(region.width * 2)))));
        svg.setAttribute('height', String(Math.min(2048, Math.max(180, Math.round(region.height * 2)))));
        const background = document.createElementNS(namespace, 'rect');
        background.setAttribute('x', String(region.x));
        background.setAttribute('y', String(region.y));
        background.setAttribute('width', String(region.width));
        background.setAttribute('height', String(region.height));
        background.setAttribute('fill', '#fff');
        svg.appendChild(background);
        const defs = typeof Marken.verlaufDefs === 'function' ? Marken.verlaufDefs(marks) : null;
        if (defs)
            svg.appendChild(defs);
        const bounds = { x: region.x, y: region.y, width: region.width, height: region.height };
        marks.forEach((mark) => {
            if (!InkGeometry.intersects(InkGeometry.bounds(mark), bounds))
                return;
            const element = Marken.zeichneMarke(mark);
            if (element)
                svg.appendChild(element);
        });
        if (svg.childElementCount <= 1)
            throw new Error('In diesem Ausschnitt ist keine Handschrift.');
        return new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    };
    const wholeImage = async (blob) => {
        if (!blob || blob.size > MAX_OCR_SOURCE)
            throw new Error('Das Bild ist für eine sichere Erkennung zu gross.');
        const source = await imageFromBlob(blob);
        try {
            if (source.width * source.height > 50000000)
                throw new Error('Das Bild hat zu viele Pixel.');
            const scale = Math.min(1, 2048 / source.width, 2048 / source.height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(source.width * scale));
            canvas.height = Math.max(1, Math.round(source.height * scale));
            const context = canvas.getContext('2d');
            if (!context)
                throw new Error('Bildfläche ist nicht verfügbar.');
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(source.image, 0, 0, source.width, source.height, 0, 0, canvas.width, canvas.height);
            return await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Bild konnte nicht vorbereitet werden.')), 'image/webp', 0.9));
        }
        finally {
            source.close();
        }
    };
    const ocrRegionState = (source, newText = '') => {
        const raw = source.ocrRegions;
        if (raw !== undefined && raw !== null &&
            (typeof raw !== 'object' || Array.isArray(raw)))
            throw new Error('Die vorhandenen OCR-Regionen sind ungültig. Die Quelle wurde nicht verändert.');
        const entries = [];
        for (const key in (raw || {})) {
            if (!Object.prototype.hasOwnProperty.call(raw, key))
                continue;
            if (entries.length >= MAX_OCR_REGIONS)
                throw new Error('Diese Quelle überschreitet das Limit von ' + MAX_OCR_REGIONS +
                    ' OCR-Regionen. Die Quelle wurde nicht verändert.');
            entries.push([key, raw[key]]);
        }
        if (entries.length >= MAX_OCR_REGIONS)
            throw new Error('Diese Quelle hat bereits das Limit von ' + MAX_OCR_REGIONS +
                ' OCR-Regionen. Lösche oder bündele zuerst alte Ergebnisse; das Original bleibt unverändert.');
        let existingTextBytes = 0;
        let existingTextChars = 0;
        for (const [, entry] of entries) {
            const existingText = String(entry?.text || '');
            existingTextChars += existingText.length;
            if (existingTextChars > MAX_OCR_TEXT)
                throw new Error('Die vorhandenen OCR-Texte überschreiten das Limit von ' +
                    MAX_OCR_TEXT + ' Zeichen. Die Quelle wurde nicht verändert.');
            existingTextBytes += textBytes(existingText);
            if (existingTextBytes > MAX_OCR_TOTAL_TEXT_BYTES)
                throw new Error('Die vorhandenen OCR-Texte überschreiten das Limit von ' +
                    Math.round(MAX_OCR_TOTAL_TEXT_BYTES / 1024) +
                    ' KB. Die Quelle wurde nicht verändert.');
        }
        if (newText) {
            const separators = entries.length;
            if (existingTextChars + newText.length + separators > MAX_OCR_TEXT)
                throw new Error('Mit diesem Ergebnis würden die OCR-Texte das Gesamtlimit von ' +
                    MAX_OCR_TEXT + ' Zeichen überschreiten. Nichts wurde gespeichert.');
            if (existingTextBytes + textBytes(newText) + separators > MAX_OCR_TOTAL_TEXT_BYTES)
                throw new Error('Mit diesem Ergebnis würden die OCR-Texte das Gesamtlimit von ' +
                    Math.round(MAX_OCR_TOTAL_TEXT_BYTES / 1024) +
                    ' KB überschreiten. Nichts wurde gespeichert.');
        }
        return { raw: (raw || {}), entries };
    };
    const addRecognizedBlock = async (page, source, region, text, sourceSaved) => {
        requireAccess('bearbeiten', page, 'Die Zielseite darfst du nicht bearbeiten.');
        const choice = typeof Dialog !== 'undefined' ? await Dialog.wahl({
            titel: 'Erkannten Inhalt übernehmen',
            text: text.slice(0, 1600),
            knoepfe: [
                { id: 'text', text: 'Als Textblock', hinweis: 'Original bleibt verknüpft' },
                { id: 'equation', text: 'Als Formelblock', hinweis: 'Bitte Formel danach fachlich prüfen' },
                sourceSaved
                    ? { id: '', text: 'Nur bei der Quelle speichern', hinweis: 'Kein neuer Block' }
                    : { id: '', text: 'Abbrechen', hinweis: 'Die schreibgeschützte Quelle bleibt unverändert' }
            ]
        }) : 'text';
        if (!choice)
            return;
        requireAccess('bearbeiten', page, 'Die Zielseite darfst du nicht mehr bearbeiten.');
        Store.addBlock(page.id, choice === 'equation' ? 'equation' : 'text', {
            text,
            sourceRef: { version: 1, pageId: page.id, blockId: source.id,
                kind: source.type === 'pdfseite' ? 'pdfseite' : source.type === 'blatt' ? 'blatt' : 'block',
                pageNumber: source.type === 'pdfseite' ? source.nr || null : null,
                region: { ...region, raumVersion: Number(source.raumVersion) || SheetSpace.RAUM_VERSION },
                label: 'Erkannter Ausschnitt' },
            recognitionSuggestion: true
        });
        App.zeichneSeite();
    };
    const recognize = async (page, source, region, fileName, kind, prepare) => {
        try {
            requireAccess('lesen', source, 'Diese Quelle darfst du nicht lesen.');
            requireAccess('bearbeiten', page, 'Die Zielseite darfst du nicht bearbeiten.');
        }
        catch (error) {
            UI.banner('Erkennung nicht erlaubt: ' +
                (error instanceof Error ? error.message : String(error)), 'fehler');
            return;
        }
        if (may('bearbeiten', source)) {
            try {
                ocrRegionState(source);
            }
            catch (error) {
                UI.banner('Erkennung nicht möglich: ' +
                    (error instanceof Error ? error.message : String(error)), 'fehler');
                return;
            }
        }
        let endpointText = configuredEndpoint();
        if (!localEndpoint(endpointText))
            endpointText = await configure() || '';
        const endpoint = localEndpoint(endpointText);
        if (!endpoint)
            return;
        if (!await consent(endpoint))
            return;
        const progress = UI.toast('Ausschnitt wird lokal erkannt …', 120000);
        try {
            requireAccess('lesen', source, 'Diese Quelle darfst du nicht mehr lesen.');
            requireAccess('bearbeiten', page, 'Die Zielseite darfst du nicht mehr bearbeiten.');
            const image = await prepare();
            if (!(image instanceof Blob) || image.size <= 0)
                throw new Error('Der vorbereitete OCR-Ausschnitt ist leer oder ungültig. Das Original bleibt unverändert.');
            if (image.size > MAX_OCR_SOURCE)
                throw new Error('Der vorbereitete OCR-Ausschnitt ist grösser als ' +
                    Math.round(MAX_OCR_SOURCE / 1048576) +
                    ' MB. Er wird nicht gesendet; das Original bleibt unverändert.');
            const form = new FormData();
            form.append('file', image, fileName);
            form.append('language', String(Store.getMeta('ocr:language', 'deu+eng')));
            form.append('kind', kind);
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 90000);
            let response;
            try {
                response = await fetch(endpoint.toString(), { method: 'POST', body: form, signal: controller.signal });
            }
            finally {
                clearTimeout(timeout);
            }
            if (!response.ok)
                throw new Error('OCR-Dienst meldet HTTP ' + response.status + '.');
            const declaredBytes = Number(response.headers.get('content-length') || 0);
            if (Number.isFinite(declaredBytes) && declaredBytes > MAX_OCR_TOTAL_TEXT_BYTES)
                throw new Error('Die OCR-Antwort überschreitet das Textlimit von ' +
                    Math.round(MAX_OCR_TOTAL_TEXT_BYTES / 1024) + ' KB. Nichts wurde gespeichert.');
            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json') ? await response.json() : { text: await response.text() };
            const text = String(payload.text || '').trim();
            if (!text)
                throw new Error('Der Dienst hat keinen Text erkannt.');
            if (text.length > MAX_OCR_TEXT)
                throw new Error('Der erkannte Text überschreitet das Einzellimit von ' + MAX_OCR_TEXT +
                    ' Zeichen. Nichts wurde abgeschnitten oder gespeichert.');
            const newTextBytes = textBytes(text);
            if (newTextBytes > MAX_OCR_TOTAL_TEXT_BYTES)
                throw new Error('Der erkannte Text überschreitet das Textlimit von ' +
                    Math.round(MAX_OCR_TOTAL_TEXT_BYTES / 1024) + ' KB. Nichts wurde gespeichert.');
            let sourceSaved = false;
            if (may('bearbeiten', source)) {
                const state = ocrRegionState(source, text);
                const id = Store.uid();
                const regions = { ...state.raw };
                regions[id] = {
                    id, fassung: 1, text, region: { ...region },
                    coordinateSpace: source.type === 'image' ? 'normalized' : 'sheet', status: 'complete',
                    language: String(payload.language || Store.getMeta('ocr:language', 'deu+eng')),
                    engine: String(payload.engine || 'local-sidecar').slice(0, 80),
                    version: String(payload.version || '').slice(0, 40),
                    confidence: Number.isFinite(Number(payload.confidence))
                        ? Math.max(0, Math.min(1, Number(payload.confidence))) : null,
                    endpoint: endpoint.origin, created: Store.now()
                };
                const ocrText = Object.values(regions)
                    .map(entry => String(entry.text || '')).join('\n');
                if (ocrText.length > MAX_OCR_TEXT)
                    throw new Error('Mit Trennzeilen würden die OCR-Texte das Zeichenlimit überschreiten. Nichts wurde gespeichert.');
                if (textBytes(ocrText) > MAX_OCR_TOTAL_TEXT_BYTES)
                    throw new Error('Mit Trennzeilen würden die OCR-Texte das Gesamtlimit überschreiten. Nichts wurde gespeichert.');
                requireAccess('bearbeiten', source, 'Die Quelle darf nicht mehr bearbeitet werden; das Ergebnis wurde dort nicht gespeichert.');
                Store.updateBlock(source.id, { ocrRegions: regions, ocrText });
                sourceSaved = true;
            }
            progress.remove();
            UI.toast(sourceSaved
                ? 'Erkennung gespeichert – Original unverändert.'
                : 'Quelle ist schreibgeschützt – Original unverändert; Zielblock kann angelegt werden.');
            await addRecognizedBlock(page, source, region, text, sourceSaved);
        }
        catch (error) {
            progress.remove();
            UI.banner('Lokale Erkennung fehlgeschlagen: ' +
                (error instanceof Error && error.name === 'AbortError' ? 'Zeitlimit erreicht.' :
                    error instanceof Error ? error.message : String(error)), 'fehler');
        }
    };
    const fromSource = async (page, source, region) => recognize(page, source, region, source.type === 'pdfseite' ? 'ausschnitt.webp' : 'handschrift.svg', source.type === 'blatt' ? 'handwriting' : 'document', () => source.type === 'pdfseite' ? pdfCrop(source, region) : inkCrop(source, region));
    const fromImageBlock = async (page, source) => {
        if (!page?.id || !source?.id || !source.dateiId) {
            UI.toast('Dieses Bild ist nicht in der lokalen Dateiablage gespeichert.');
            return;
        }
        const region = { x: 0, y: 0, width: 1, height: 1 };
        await recognize(page, source, region, 'bild.webp', 'document', async () => {
            const blob = await Dateien.alsBlob(source.dateiId);
            if (!blob)
                throw new Error('Die Bilddatei fehlt.');
            return wholeImage(blob);
        });
    };
    return { scan, fromSource, fromImageBlock, configure, capturePage };
})();
window.Recognition = Recognition;
