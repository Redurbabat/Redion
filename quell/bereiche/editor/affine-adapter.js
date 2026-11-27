"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/editor/affine-adapter.ts (npm run bauen:ts). */
const RedionAffineEditor = (() => {
    function validate(snapshot) {
        const copy = structuredClone(snapshot);
        const map = new Map();
        for (const block of copy.blocks) {
            if (!block.id || !block.type || map.has(block.id))
                throw new Error('Ungültige Blockkennung');
            map.set(block.id, block);
        }
        if (!map.has(copy.rootId))
            throw new Error('Dokument fehlt');
        const visited = new Set();
        const stack = [copy.rootId];
        while (stack.length) {
            const id = stack.pop();
            if (visited.has(id))
                throw new Error('Mehrfachreferenz oder Blockkreis');
            visited.add(id);
            const block = map.get(id);
            if (!block)
                throw new Error('RedionAffineBlock fehlt');
            for (const child of block.content ?? []) {
                const record = map.get(child);
                if (!record || record.parentId !== id)
                    throw new Error('Ungültige Elternkennung');
                stack.push(child);
            }
        }
        if (visited.size !== map.size)
            throw new Error('Nicht erreichbare Blöcke');
        return copy;
    }
    function outline(snapshot) {
        const data = validate(snapshot);
        const map = new Map(data.blocks.map(block => [block.id, block]));
        const result = [];
        const stack = [...(map.get(data.rootId)?.content ?? [])].reverse();
        while (stack.length) {
            const block = map.get(stack.pop());
            const match = /^h([1-3])$/.exec(block.type);
            if (match)
                result.push({ id: block.id, text: block.text ?? '', level: Number(match[1]) });
            if (block.type !== 'page')
                stack.push(...(block.content ?? []).slice().reverse());
        }
        return result;
    }
    function create(host) {
        let rootId = null;
        let container = null;
        let stopRender = null;
        let stopSubscription = null;
        let locked = true;
        const listeners = new Set();
        const serializeDocument = () => {
            if (rootId === null)
                throw new Error('Kein Dokument geöffnet');
            const snapshot = validate(host.read(rootId));
            if (snapshot.rootId !== rootId)
                throw new Error('Falsches Dokument');
            return snapshot;
        };
        const refresh = () => {
            stopRender?.();
            stopRender = null;
            if (container && rootId !== null)
                stopRender = host.render(container, rootId, locked);
        };
        const assertWritable = () => {
            if (locked || rootId === null)
                throw new Error('Dokument ist schreibgeschützt oder geschlossen');
        };
        return {
            mount(target) {
                if (container)
                    throw new Error('Editor ist bereits eingebunden');
                container = target;
                refresh();
                stopSubscription = host.subscribe(() => {
                    if (rootId !== null)
                        for (const listener of listeners)
                            listener(serializeDocument());
                });
            },
            unmount() {
                stopSubscription?.();
                stopRender?.();
                stopSubscription = stopRender = null;
                container = null;
                rootId = null;
                locked = true;
                listeners.clear();
            },
            loadDocument(id) {
                if (validate(host.read(id)).rootId !== id)
                    throw new Error('Falsches Dokument');
                host.open(id);
                rootId = id;
                refresh();
            },
            serializeDocument,
            onChange(listener) {
                listeners.add(listener);
                return () => { listeners.delete(listener); };
            },
            readonly(value) { locked = value; refresh(); },
            updateText(id, text) {
                assertWritable();
                if (!serializeDocument().blocks.some(block => block.id === id))
                    throw new Error('Fremder Block');
                host.updateText(id, text);
            },
            move(id, targetId, after = false) {
                assertWritable();
                const snapshot = serializeDocument();
                const map = new Map(snapshot.blocks.map(block => [block.id, block]));
                if (id === snapshot.rootId || targetId === snapshot.rootId || !map.has(id) || !map.has(targetId))
                    throw new Error('Ungültiges Verschiebeziel');
                for (let current = map.get(targetId); current; current = current.parentId ? map.get(current.parentId) : undefined) {
                    if (current.id === id)
                        throw new Error('Blockkreis');
                    if (current.id === snapshot.rootId)
                        break;
                }
                host.move(id, targetId, after);
            },
            undo() { assertWritable(); host.undo(); },
            redo() { assertWritable(); host.redo(); },
            outline() { return outline(serializeDocument()); },
            exportJSON() { return JSON.stringify(serializeDocument()); },
            parseJSON(text) { return validate(JSON.parse(text)); }
        };
    }
    return { validate, outline, create };
})();
