"use strict";
/* ============================================================================
 * bereiche/pdf/marken.ts — eine Ink-Schicht fuer A4-Blatt und PDF-Seite
 * ----------------------------------------------------------------------------
 * Ein Dokumentraum, ein SVG-Knoten je Marke, keine Ablageschreibvorgaenge
 * waehrend pointermove. Alte `stift`-Marken mit `pts: [[x,y], ...]` bleiben
 * lesbar; neue Druckwerte liegen getrennt unter `pressure` (E125).
 * ==========================================================================*/
const Marken = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const FARBEN = ['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419'];
    const BREITEN = [1.2, 2.4, 5];
    const MARKER_FARBE = '#e0a419';
    const HISTORY_LIMIT = 100;
    const svg = (name, attributes = {}) => {
        const element = document.createElementNS(NS, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
        return element;
    };
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const idOf = (mark) => String(mark?.id || '');
    const strokeWidth = (mark) => {
        const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
        const values = Array.isArray(mark?.pressure)
            ? mark.pressure.map(Number).filter((value) => Number.isFinite(value)) : [];
        const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0.5;
        const pressureFactor = Math.max(0.55, Math.min(1.55, 0.65 + average * 0.7));
        return base * pressureFactor * (mark?.art === 'marker' ? 4 : 1);
    };
    const arrowPath = (start, end) => {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const angle = Math.atan2(dy, dx);
        const head = Math.max(10, Math.min(24, Math.hypot(dx, dy) * 0.22));
        const left = [end[0] - head * Math.cos(angle - Math.PI / 6),
            end[1] - head * Math.sin(angle - Math.PI / 6)];
        const right = [end[0] - head * Math.cos(angle + Math.PI / 6),
            end[1] - head * Math.sin(angle + Math.PI / 6)];
        return `M${start[0]} ${start[1]} L${end[0]} ${end[1]} ` +
            `M${left[0]} ${left[1]} L${end[0]} ${end[1]} L${right[0]} ${right[1]}`;
    };
    /** Bildschirm, Druck und Praesentation rufen denselben Zeichner auf. */
    const zeichneMarke = (mark) => {
        if (!mark || typeof mark !== 'object')
            return null;
        const art = String(mark.art || 'stift');
        const color = String(mark.farbe || FARBEN[0]);
        const width = strokeWidth(mark);
        const points = InkGeometry.points(mark.pts);
        let element = null;
        if (art === 'text') {
            const point = InkGeometry.points([mark.point])[0];
            if (!point)
                return null;
            element = svg('text', {
                x: point[0], y: point[1], fill: color,
                'font-size': Math.max(8, Number(mark.fontSize) || 18),
                'font-family': 'system-ui, sans-serif', 'dominant-baseline': 'alphabetic'
            });
            element.textContent = String(mark.text || '').replace(/[\r\n]+/g, ' ');
        }
        else if (art === 'line' && points.length >= 2) {
            element = svg('line', { x1: points[0][0], y1: points[0][1],
                x2: points[1][0], y2: points[1][1] });
        }
        else if (art === 'arrow' && points.length >= 2) {
            element = svg('path', { d: arrowPath(points[0], points[1]) });
        }
        else if (art === 'rectangle' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height });
        }
        else if (art === 'ellipse' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            element = svg('ellipse', { cx: box.x + box.width / 2, cy: box.y + box.height / 2,
                rx: box.width / 2, ry: box.height / 2 });
        }
        else if (points.length >= 2) {
            element = svg('path', { d: InkGeometry.path(points) });
        }
        if (!element)
            return null;
        if (art !== 'text') {
            element.setAttribute('fill', 'none');
            element.setAttribute('stroke', color);
            element.setAttribute('stroke-width', String(width));
            element.setAttribute('stroke-linecap', 'round');
            element.setAttribute('stroke-linejoin', 'round');
            if (art === 'marker') {
                element.setAttribute('opacity', '0.32');
                element.setAttribute('style', 'mix-blend-mode:multiply');
            }
            /* Geschlossene Formen lassen sich auch in ihrer Flaeche greifen. Die
               Flaeche bleibt optisch leer; `pointer-events` aendert nur den Treffer. */
            if (art === 'rectangle' || art === 'ellipse')
                element.setAttribute('pointer-events', 'all');
        }
        element.setAttribute('data-sid', idOf(mark));
        element.setAttribute('data-ink-art', art);
        return element;
    };
    const updateNode = (node, mark) => {
        const fresh = zeichneMarke(mark);
        if (!fresh)
            return null;
        if (!node || node.tagName !== fresh.tagName) {
            if (node?.parentNode)
                node.replaceWith(fresh);
            return fresh;
        }
        [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
        [...fresh.attributes].forEach(attribute => node.setAttribute(attribute.name, attribute.value));
        node.textContent = fresh.textContent;
        return node;
    };
    const lebende = new Set();
    let observer = null;
    let inspectionQueued = false;
    const inspectLayers = () => {
        inspectionQueued = false;
        let saved = false;
        for (const layer of [...lebende]) {
            if (layer.flaeche.isConnected)
                continue;
            if (layer.abschliessen())
                saved = true;
            lebende.delete(layer);
        }
        if (!lebende.size && observer) {
            observer.disconnect();
            observer = null;
        }
        if (saved && typeof App !== 'undefined' && App.zeichneSeite)
            App.zeichneSeite();
    };
    const registerLayer = (layer) => {
        lebende.add(layer);
        if (typeof MutationObserver === 'undefined')
            return;
        if (!observer)
            observer = new MutationObserver(() => {
                if (inspectionQueued)
                    return;
                inspectionQueued = true;
                queueMicrotask(inspectLayers);
            });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };
    if (typeof addEventListener === 'function') {
        addEventListener('pagehide', () => { for (const layer of lebende)
            layer.abschliessen(); });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden')
                for (const layer of lebende)
                    layer.abschliessen();
        });
    }
    const schicht = (block, breite, hoehe, umbruch = 0) => {
        const R = SheetSpace;
        const marks = Array.isArray(block.marken) ? clone(block.marken) : [];
        let tool = 'schreiben';
        let color = FARBEN[0];
        let width = BREITEN[1];
        let running = null;
        let runningNode = null;
        let beforeRunning = null;
        let selection = new Set();
        let selectDrag = null;
        const historyUndo = [];
        const historyRedo = [];
        const stateListeners = new Set();
        const flaeche = svg('svg', { class: 'blatt-marken', viewBox: `0 0 ${breite} ${hoehe}`,
            preserveAspectRatio: 'none', 'data-tool': tool });
        for (let page = 1; umbruch > 0 && page * umbruch < hoehe; page++) {
            flaeche.appendChild(svg('line', { x1: 0, x2: breite, y1: page * umbruch, y2: page * umbruch,
                stroke: 'currentColor', 'stroke-width': 0.5, 'stroke-dasharray': '6 6',
                opacity: 0.35, class: 'blatt-umbruch' }));
        }
        marks.forEach(mark => { const node = zeichneMarke(mark); if (node)
            flaeche.appendChild(node); });
        const snapshot = () => clone(marks);
        const state = () => ({ undo: historyUndo.length > 0, redo: historyRedo.length > 0,
            selected: selection.size });
        const notifyState = () => stateListeners.forEach(listener => listener(state()));
        const save = () => Store.updateBlock(block.id, { marken: marks, raumVersion: R.RAUM_VERSION });
        const commit = (before) => {
            if (JSON.stringify(before) === JSON.stringify(marks))
                return;
            historyUndo.push(before);
            if (historyUndo.length > HISTORY_LIMIT)
                historyUndo.shift();
            historyRedo.length = 0;
            save();
            notifyState();
        };
        const nodeFor = (id) => [...flaeche.querySelectorAll('[data-sid]')]
            .find(node => node.getAttribute('data-sid') === id) || null;
        const redraw = () => {
            flaeche.querySelectorAll('[data-sid],[data-ink-ui]').forEach(node => node.remove());
            marks.forEach(mark => { const node = zeichneMarke(mark); if (node)
                flaeche.appendChild(node); });
            renderSelection();
        };
        const restore = (next) => {
            marks.splice(0, marks.length, ...clone(next));
            selection = new Set([...selection].filter(id => marks.some(mark => idOf(mark) === id)));
            save();
            redraw();
            notifyState();
        };
        const undo = () => {
            const previous = historyUndo.pop();
            if (!previous)
                return;
            historyRedo.push(snapshot());
            restore(previous);
        };
        const redo = () => {
            const next = historyRedo.pop();
            if (!next)
                return;
            historyUndo.push(snapshot());
            restore(next);
        };
        function renderSelection() {
            flaeche.querySelectorAll('[data-ink-ui="selection"]').forEach(node => node.remove());
            for (const id of selection) {
                const mark = marks.find(item => idOf(item) === id);
                if (!mark)
                    continue;
                const box = InkGeometry.bounds(mark);
                flaeche.appendChild(svg('rect', { x: box.x - 3, y: box.y - 3,
                    width: box.width + 6, height: box.height + 6,
                    class: 'blatt-auswahlrahmen', 'data-ink-ui': 'selection' }));
            }
            notifyState();
        }
        const deleteSelection = () => {
            if (!selection.size)
                return;
            const before = snapshot();
            for (let index = marks.length - 1; index >= 0; index--)
                if (selection.has(idOf(marks[index])))
                    marks.splice(index, 1);
            selection.clear();
            redraw();
            commit(before);
        };
        const pressureOf = (event) => {
            const pressure = Number(event.pressure);
            return pressure > 0 ? Math.max(0.05, Math.min(1, pressure)) : 0.5;
        };
        const addSample = (event) => {
            if (!running)
                return;
            const point = R.zuBlatt(flaeche, event);
            if (!point)
                return;
            const last = running.pts[running.pts.length - 1];
            if (last && Math.abs(last[0] - point[0]) < 0.6 && Math.abs(last[1] - point[1]) < 0.6)
                return;
            running.pts.push(point);
            running.pressure.push(pressureOf(event));
        };
        const finish = () => {
            if (selectDrag) {
                const drag = selectDrag;
                selectDrag = null;
                flaeche.querySelectorAll('[data-ink-ui="box"]').forEach(node => node.remove());
                if (drag.mode === 'move' && drag.moved) {
                    commit(drag.before);
                    return true;
                }
                if (drag.mode === 'box') {
                    const box = InkGeometry.rectangle(drag.start, drag.end || drag.start);
                    if (!drag.add)
                        selection.clear();
                    marks.forEach(mark => { if (InkGeometry.intersects(box, InkGeometry.bounds(mark)))
                        selection.add(idOf(mark)); });
                    renderSelection();
                }
                return false;
            }
            if (!running)
                return false;
            const mark = running;
            const node = runningNode;
            const before = beforeRunning || snapshot();
            running = null;
            runningNode = null;
            beforeRunning = null;
            if (mark.art === 'stift' || mark.art === 'marker') {
                if (mark.pts.length < 2) {
                    node?.remove();
                    return false;
                }
                const original = mark.pts;
                const simplified = InkGeometry.simplify(original, Math.max(0.55, Number(mark.breite) * 0.28));
                /* Ein langer, beim Neuzeichnen geschlossener Strich darf nicht wie
                   eine bloss konstruierte Zweipunktlinie aussehen (E115). Acht
                   Stuetzpunkte halten Verlauf und Druck, auch wenn er fast gerade war. */
                mark.pts = original.length >= 8 && simplified.length < 8
                    ? Array.from({ length: 8 }, (_value, index) => original[Math.round(index * (original.length - 1) / 7)])
                    : simplified;
                if (Array.isArray(mark.pressure) && mark.pressure.length !== mark.pts.length) {
                    const average = mark.pressure.reduce((sum, value) => sum + value, 0) / mark.pressure.length;
                    mark.pressure = mark.pts.map(() => Math.round(average * 100) / 100);
                }
            }
            else if (mark.pts.length < 2 ||
                Math.hypot(mark.pts[1][0] - mark.pts[0][0], mark.pts[1][1] - mark.pts[0][1]) < 1) {
                node?.remove();
                return false;
            }
            marks.push(mark);
            runningNode = updateNode(node, mark);
            commit(before);
            runningNode = null;
            return true;
        };
        const editText = async (point, targetId = '') => {
            const current = targetId ? marks.find(mark => idOf(mark) === targetId && mark.art === 'text') : null;
            const answer = await Dialog.frage(current ? 'Textanmerkung bearbeiten' : 'Textanmerkung', current ? String(current.text || '') : '');
            if (answer === null || (!current && !answer.trim()))
                return;
            const before = snapshot();
            if (current)
                current.text = answer;
            else
                marks.push({ id: typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1),
                    art: 'text', point, text: answer, farbe: color, fontSize: Math.max(14, width * 7) });
            redraw();
            commit(before);
        };
        flaeche.addEventListener('pointerdown', (event) => {
            const e = event;
            if (tool === 'schreiben' || !e.isPrimary || e.button !== 0)
                return;
            const point = R.zuBlatt(flaeche, e);
            if (!point)
                return;
            event.preventDefault();
            flaeche.focus({ preventScroll: true });
            const target = event.target?.closest?.('[data-sid]');
            const targetId = target?.getAttribute('data-sid') || '';
            if (tool === 'radierer') {
                const index = marks.findIndex(mark => idOf(mark) === targetId);
                if (index < 0)
                    return;
                const before = snapshot();
                marks.splice(index, 1);
                target?.remove();
                selection.delete(targetId);
                commit(before);
                return;
            }
            if (tool === 'text') {
                void editText(point, targetId);
                return;
            }
            if (tool === 'select') {
                if (targetId) {
                    if (event.shiftKey)
                        selection.has(targetId) ? selection.delete(targetId) : selection.add(targetId);
                    else if (!selection.has(targetId))
                        selection = new Set([targetId]);
                    renderSelection();
                    if (!selection.has(targetId))
                        return;
                    selectDrag = { mode: 'move', start: point, before: snapshot(), moved: false,
                        originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
                }
                else {
                    if (!event.shiftKey) {
                        selection.clear();
                        renderSelection();
                    }
                    selectDrag = { mode: 'box', start: point, end: point, add: event.shiftKey };
                    const box = svg('rect', { x: point[0], y: point[1], width: 0, height: 0,
                        class: 'blatt-auswahlfeld', 'data-ink-ui': 'box' });
                    flaeche.appendChild(box);
                }
                try {
                    flaeche.setPointerCapture(event.pointerId);
                }
                catch { /* optional */ }
                return;
            }
            beforeRunning = snapshot();
            const id = typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1);
            if (tool === 'stift' || tool === 'marker') {
                running = { id, art: tool, farbe: tool === 'marker' && color === FARBEN[0] ? MARKER_FARBE : color,
                    breite: width, pts: [point], pressure: [pressureOf(event)] };
                runningNode = zeichneMarke({ ...running, pts: [point, point], pressure: [pressureOf(event), pressureOf(event)] });
            }
            else {
                running = { id, art: tool, farbe: color, breite: width, pts: [point, point] };
                runningNode = zeichneMarke(running);
            }
            if (runningNode)
                flaeche.appendChild(runningNode);
            try {
                flaeche.setPointerCapture(event.pointerId);
            }
            catch { /* optional */ }
        });
        flaeche.addEventListener('pointermove', (event) => {
            if (!event.isPrimary)
                return;
            const point = R.zuBlatt(flaeche, event);
            if (!point)
                return;
            if (selectDrag) {
                selectDrag.end = point;
                if (selectDrag.mode === 'move') {
                    const dx = point[0] - selectDrag.start[0];
                    const dy = point[1] - selectDrag.start[1];
                    selectDrag.moved = selectDrag.moved || Math.hypot(dx, dy) > 0.5;
                    for (const id of selection) {
                        const index = marks.findIndex(mark => idOf(mark) === id);
                        const original = selectDrag.originals.get(id);
                        if (index < 0 || !original)
                            continue;
                        marks[index] = InkGeometry.move(clone(original), dx, dy);
                        updateNode(nodeFor(id), marks[index]);
                    }
                    renderSelection();
                }
                else {
                    const box = InkGeometry.rectangle(selectDrag.start, point);
                    const node = flaeche.querySelector('[data-ink-ui="box"]');
                    if (node)
                        Object.entries(box).forEach(([key, value]) => node.setAttribute(key, String(value)));
                }
                return;
            }
            if (!running)
                return;
            if (running.art === 'stift' || running.art === 'marker') {
                const coalesced = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
                (coalesced.length ? coalesced : [event]).forEach(addSample);
            }
            else
                running.pts[1] = point;
            runningNode = updateNode(runningNode, running.art === 'stift' || running.art === 'marker'
                ? { ...running, pts: running.pts.length > 1 ? running.pts : [running.pts[0], running.pts[0]] }
                : running);
        });
        flaeche.addEventListener('pointerup', finish);
        flaeche.addEventListener('pointercancel', finish);
        flaeche.addEventListener('pointerleave', finish);
        flaeche.addEventListener('keydown', (event) => {
            if ((event.key === 'Delete' || event.key === 'Backspace') && selection.size) {
                event.preventDefault();
                deleteSelection();
            }
            else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                event.shiftKey ? redo() : undo();
            }
        });
        registerLayer({ flaeche, abschliessen: finish });
        flaeche.style.pointerEvents = 'none';
        flaeche.setAttribute('tabindex', '-1');
        const setzeWerkzeug = (next) => {
            finish();
            tool = next;
            if (tool !== 'select') {
                selection.clear();
                renderSelection();
            }
            flaeche.style.pointerEvents = tool === 'schreiben' ? 'none' : 'auto';
            flaeche.setAttribute('data-tool', tool);
            flaeche.setAttribute('tabindex', tool === 'schreiben' ? '-1' : '0');
        };
        const setzeFarbe = (next) => { color = next; };
        const setzeStrich = (next) => { width = next; };
        const beiAenderung = (listener) => {
            stateListeners.add(listener);
            listener(state());
            return () => stateListeners.delete(listener);
        };
        return { flaeche, setzeWerkzeug, setzeFarbe, setzeStrich, marken: marks,
            undo, redo, deleteSelection, beiAenderung, state };
    };
    const leiste = (controls, extra = '') => {
        const row = document.createElement('div');
        row.className = 'blatt-reihe';
        const tools = document.createElement('div');
        tools.className = 'blatt-werk';
        const button = (tool, icon, word, title) => `<button data-wz="${tool}"${tool === 'schreiben' ? ' class="on"' : ''} title="${title}">` +
            `<span class="zeichen">${icon}</span><span class="wort">${word}</span></button>`;
        tools.innerHTML =
            button('schreiben', '✎', 'Schreiben', 'Schreiben — die Zeichenschicht ist durchlässig') +
                button('select', '⌖', 'Auswahl', 'Marken auswählen, gemeinsam bewegen oder löschen') +
                button('stift', '🖍', 'Stift', 'Freihand mit geglätteter Linie') +
                button('marker', '▰', 'Marker', 'Transparenter Marker') +
                button('line', '╱', 'Linie', 'Gerade Linie') +
                button('arrow', '→', 'Pfeil', 'Pfeil') +
                button('rectangle', '□', 'Rechteck', 'Rechteck') +
                button('ellipse', '○', 'Ellipse', 'Ellipse') +
                button('text', 'T', 'Text', 'Textanmerkung') +
                button('radierer', '⌫', 'Radieren', 'Eine Marke entfernen') +
                '<span class="blatt-trenn"></span>' +
                '<button data-act="undo" title="Rückgängig" disabled><span class="zeichen">↶</span><span class="wort">Zurück</span></button>' +
                '<button data-act="redo" title="Wiederholen" disabled><span class="zeichen">↷</span><span class="wort">Vor</span></button>' +
                '<button data-act="delete" title="Auswahl löschen" disabled><span class="zeichen">🗑</span><span class="wort">Löschen</span></button>' +
                '<span class="blatt-trenn"></span>' +
                FARBEN.map((value, index) => `<button class="blatt-farbe${index === 0 ? ' on' : ''}" ` +
                    `data-c="${value}" style="background:${value}" title="Farbe"></button>`).join('') +
                '<span class="blatt-trenn"></span>' +
                BREITEN.map((value, index) => `<button class="blatt-strich${index === 1 ? ' on' : ''}" ` +
                    `data-b="${value}" title="Strichbreite"><i style="height:${Math.max(2, value)}px"></i></button>`).join('');
        /* SICHTBAR MACHEN, DASS DIE LEISTE ROLLT (E140, §55.1).
           Bei 390 px ist die Leiste 310 px breit und ihr Inhalt 1059 — von 21
           Knöpfen stehen 15 draussen, alle rechts. Gerollt werden kann sie
           längst; nur zeigt das nichts an, und eine abgeschnittene Leiste sieht
           aus wie eine vollständige. Genau dieser Befund steht in §55.1 über die
           Tabellenleiste, und er gilt hier noch einmal.
    
           `.blatt-fest` hat seinen Schatten für die Seite LINKS. Nach rechts gab
           es nichts — dabei ist beim Öffnen alles Verdeckte rechts.
    
           Kein Dauerverlauf: der würde am Ende der Leiste eine Andeutung zeigen,
           wo nichts mehr kommt. Die zwei Kennzeichen stehen nur, solange es
           wirklich etwas zu holen gibt. */
        const rollstand = () => {
            const links = tools.scrollLeft > 2;
            const rechts = tools.scrollLeft + tools.clientWidth < tools.scrollWidth - 2;
            row.dataset['mehr'] = links && rechts ? 'beides' : rechts ? 'rechts' : links ? 'links' : 'nein';
        };
        tools.addEventListener('scroll', rollstand, { passive: true });
        if (typeof ResizeObserver === 'function')
            new ResizeObserver(rollstand).observe(tools);
        setTimeout(rollstand, 0);
        const updateState = (next) => {
            const undo = tools.querySelector('[data-act="undo"]');
            const redo = tools.querySelector('[data-act="redo"]');
            const remove = tools.querySelector('[data-act="delete"]');
            if (undo)
                undo.disabled = !next.undo;
            if (redo)
                redo.disabled = !next.redo;
            if (remove)
                remove.disabled = !next.selected;
        };
        controls.beiAenderung?.(updateState);
        tools.addEventListener('click', event => {
            const target = event.target?.closest?.('button');
            if (!target || target.disabled)
                return;
            if (target.dataset.wz) {
                controls.setzeWerkzeug(target.dataset.wz);
                tools.querySelectorAll('[data-wz]').forEach(node => node.classList.remove('on'));
                target.classList.add('on');
                return;
            }
            if (target.dataset.act) {
                if (target.dataset.act === 'undo')
                    controls.undo();
                if (target.dataset.act === 'redo')
                    controls.redo();
                if (target.dataset.act === 'delete')
                    controls.deleteSelection();
                return;
            }
            if (target.dataset.c) {
                controls.setzeFarbe(target.dataset.c);
                tools.querySelectorAll('.blatt-farbe').forEach(node => node.classList.remove('on'));
                target.classList.add('on');
                return;
            }
            if (target.dataset.b) {
                controls.setzeStrich(Number(target.dataset.b));
                tools.querySelectorAll('.blatt-strich').forEach(node => node.classList.remove('on'));
                target.classList.add('on');
            }
        });
        row.appendChild(tools);
        if (extra) {
            const fixed = document.createElement('div');
            fixed.className = 'blatt-fest';
            fixed.innerHTML = extra;
            row.appendChild(fixed);
        }
        return row;
    };
    return { schicht, leiste, zeichneMarke, FARBEN, BREITEN };
})();
window.Marken = Marken;
