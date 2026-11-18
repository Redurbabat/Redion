"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/editor/automatisierung.ts (npm run bauen:ts). */
(() => {
    const R = RegisterAutomatisierung;
    const kinds = new Set(['text', 'h1', 'h2', 'h3', 'bullet', 'number', 'todo', 'quote', 'callout', 'divider', 'code']);
    const summary = (b) => ({ id: b.id, title: b.text || '', parentId: b.parentId || null, type: b.type });
    const raw = (text) => String(text ?? '');
    const pages = () => Object.values(Store.cache.blocks).filter(b => b.alive && b.type === 'page' && b.parentTable !== 'collection' && Konten.darf('lesen', b.id));
    const page = (id, c, write = false) => { const b = c.block(id, write); if (b.type !== 'page')
        c.error('INVALID_DOCUMENT'); return b; };
    const contents = (p, _c, limit = 100) => Store.childrenOf(p.id).filter((b) => b.alive && Konten.darf('lesen', b.id)).slice(0, limit)
        .map((b) => ({ id: b.id, type: b.type, text: raw(b.text), ...(b.type === 'todo' ? { checked: !!b.checked } : {}) }));
    R.melde('redion_list_documents', a => ({ documents: pages().slice(0, a.limit || 50).map(summary) }));
    R.melde('redion_search', a => {
        const query = String(a.query).toLocaleLowerCase();
        return { documents: pages().filter(p => String(p.text || '').toLocaleLowerCase().includes(query) || Store.childrenOf(p.id).some((b) => b.alive && Konten.darf('lesen', b.id) && raw(b.text).toLocaleLowerCase().includes(query))).slice(0, a.limit || 20).map(summary) };
    });
    R.melde('redion_open_document', (a, c) => { const p = page(a.documentId, c); App.oeffne(p.id); return { document: summary(p) }; });
    R.melde('redion_read_page', (a, c) => { const p = page(a.documentId, c); return { document: summary(p), blocks: contents(p, c, a.limit || 100) }; });
    R.melde('redion_create_page', async (a, c) => {
        if (a.parentId)
            page(a.parentId, c, true);
        else if (!Konten.darf('bearbeiten'))
            c.error('PERMISSION_DENIED');
        c.check();
        const p = Store.addPage(a.parentId || null, { text: a.title, herkunft: 'ki' });
        for (const b of a.blocks || [])
            Store.addBlock(p.id, b.type, { text: b.text, checked: !!b.checked, herkunft: 'ki' });
        if (a.open !== false)
            App.oeffne(p.id);
        await c.finish(p.id);
        return { document: summary(p), blocks: contents(p, c) };
    });
    R.melde('redion_update_page', async (a, c) => { page(a.documentId, c, true); await c.prepare(a.documentId); Store.updateBlock(a.documentId, { text: a.title, herkunft: 'ki' }); await c.finish(a.documentId); return { document: summary(Store.getBlock(a.documentId)) }; });
    R.melde('redion_insert_block', async (a, c) => {
        const p = page(a.documentId, c, true);
        await c.prepare(p.id);
        const b = Store.addBlock(p.id, a.block.type, { text: a.block.text, checked: !!a.block.checked, herkunft: 'ki' }, a.index ?? -1);
        await c.finish(p.id);
        return { block: { id: b.id, type: b.type, text: raw(b.text) } };
    });
    R.melde('redion_update_block', async (a, c) => {
        const b = c.block(a.blockId, true);
        if (!kinds.has(b.type))
            c.error('UNSUPPORTED_BLOCK_TYPE');
        if (raw(b.text) !== a.expectedText)
            c.error('STALE_DOCUMENT');
        const p = c.pageOf(b.id);
        await c.prepare(p.id);
        if (raw(b.text) !== a.expectedText)
            c.error('STALE_DOCUMENT');
        Store.updateBlock(b.id, { text: a.text, herkunft: 'ki', ...(a.checked !== undefined && b.type === 'todo' ? { checked: a.checked } : {}) });
        await c.finish(p.id);
        return { blockId: b.id, documentId: p.id };
    });
    R.melde('redion_delete_block', async (a, c) => {
        const b = c.block(a.blockId, true);
        if (!kinds.has(b.type) || Store.childrenOf(b.id).length)
            c.error('UNSUPPORTED_BLOCK_TYPE');
        const p = c.pageOf(b.id);
        await c.prepare(p.id);
        Store.trashBlock(b.id);
        await c.finish(p.id);
        return { blockId: b.id, trashed: true };
    });
    R.melde('redion_replace_text', async (a, c) => {
        const p = page(a.documentId, c, true);
        const unique = () => {
            let found;
            for (const b of Store.childrenOf(p.id)) {
                if (!b.alive || !kinds.has(b.type) || !Konten.darf('lesen', b.id))
                    continue;
                const value = raw(b.text), at = value.indexOf(a.find);
                if (at < 0)
                    continue;
                if (found || value.indexOf(a.find, at + a.find.length) >= 0)
                    c.error('AMBIGUOUS_TEXT');
                found = { b, value };
            }
            return found || c.error('TEXT_NOT_FOUND');
        };
        const hit = unique();
        c.block(hit.b.id, true);
        await c.prepare(p.id);
        const current = unique();
        if (current.b.id !== hit.b.id || current.value !== hit.value)
            c.error('STALE_DOCUMENT');
        Store.updateBlock(hit.b.id, { text: hit.value.replace(a.find, () => a.replacement), herkunft: 'ki' });
        await c.finish(p.id);
        return { blockId: hit.b.id, replacements: 1 };
    });
    R.melde('redion_export_page', (a, c) => { const p = page(a.documentId, c); const blocks = contents(p, c); return { documentId: p.id, format: 'text/plain', text: p.text + '\n\n' + blocks.map((b) => b.text).join('\n\n'), limitedToDirectBlocks: 100 }; });
    const history = async (forward, c) => {
        const key = forward ? 'redoPageId' : 'undoPageId';
        const id = Verlauf.status()[key];
        if (!id)
            return c.error('NO_HISTORY');
        page(id, c, true);
        await Store.versionSpeichern(id, 'vor ChatGPT-Verlaufsschritt');
        c.check();
        page(id, c, true);
        if (Verlauf.status()[key] !== id)
            return c.error('STALE_HISTORY');
        if (forward)
            Verlauf.vor();
        else
            Verlauf.zurueck();
        await c.finish(id);
        return { documentId: id };
    };
    R.melde('redion_undo', (_a, c) => history(false, c));
    R.melde('redion_redo', (_a, c) => history(true, c));
})();
