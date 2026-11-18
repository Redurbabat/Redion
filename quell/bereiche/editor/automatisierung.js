"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/editor/automatisierung.ts (npm run bauen:ts). */
(() => {
    const R = RegisterAutomatisierung;
    const kinds = new Set(['text', 'h1', 'h2', 'h3', 'bullet', 'number', 'todo', 'quote', 'callout', 'divider', 'code']);
    const summary = (b) => ({ id: b.id, title: b.text || '', parentId: b.parentId || null, type: b.type });
    const plain = (text) => new DOMParser().parseFromString(text, 'text/html').body.textContent || '';
    const replacePlain = (html, find, replacement) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const start = (doc.body.textContent || '').indexOf(find), end = start + find.length;
        if (start < 0)
            return html;
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let at = 0, inserted = false;
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const value = node.textContent || '', next = at + value.length;
            if (next > start && at < end) {
                node.textContent = value.slice(0, Math.max(0, start - at)) + (inserted ? '' : replacement) + value.slice(Math.min(value.length, end - at));
                inserted = true;
            }
            at = next;
        }
        return doc.body.innerHTML;
    };
    const pages = () => Object.values(Store.cache.blocks).filter(b => b.alive && b.type === 'page' && b.parentTable !== 'collection' && Konten.darf('lesen', b.id));
    const page = (id, c, write = false) => { const b = c.block(id, write); if (b.type !== 'page')
        c.error('INVALID_DOCUMENT'); return b; };
    const contents = (p, _c, limit = 100) => Store.childrenOf(p.id).filter((b) => b.alive && Konten.darf('lesen', b.id)).slice(0, limit)
        .map((b) => ({ id: b.id, type: b.type, text: b.type === 'code' ? String(b.text || '') : plain(String(b.text || '')), ...(b.type === 'todo' ? { checked: !!b.checked } : {}) }));
    R.melde('redion_list_documents', a => ({ documents: pages().slice(0, a.limit || 50).map(summary) }));
    R.melde('redion_search', a => {
        const query = String(a.query).toLocaleLowerCase();
        return { documents: pages().filter(p => String(p.text || '').toLocaleLowerCase().includes(query) || Store.childrenOf(p.id).some((b) => b.alive && Konten.darf('lesen', b.id) && plain(String(b.text || '')).toLocaleLowerCase().includes(query))).slice(0, a.limit || 20).map(summary) };
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
            Store.addBlock(p.id, b.type, { text: b.type === 'code' ? b.text : c.text(b.text), checked: !!b.checked, herkunft: 'ki' });
        if (a.open !== false)
            App.oeffne(p.id);
        await c.finish(p.id);
        return { document: summary(p), blocks: contents(p, c) };
    });
    R.melde('redion_update_page', async (a, c) => { page(a.documentId, c, true); await c.prepare(a.documentId); Store.updateBlock(a.documentId, { text: a.title, herkunft: 'ki' }); await c.finish(a.documentId); return { document: summary(Store.getBlock(a.documentId)) }; });
    R.melde('redion_insert_block', async (a, c) => {
        const p = page(a.documentId, c, true);
        await c.prepare(p.id);
        const b = Store.addBlock(p.id, a.block.type, { text: a.block.type === 'code' ? a.block.text : c.text(a.block.text), checked: !!a.block.checked, herkunft: 'ki' }, a.index ?? -1);
        await c.finish(p.id);
        return { block: { id: b.id, type: b.type, text: plain(b.text) } };
    });
    R.melde('redion_update_block', async (a, c) => {
        const b = c.block(a.blockId, true);
        if (!kinds.has(b.type))
            c.error('UNSUPPORTED_BLOCK_TYPE');
        if ((b.type === 'code' ? String(b.text || '') : plain(String(b.text || ''))) !== a.expectedText)
            c.error('STALE_DOCUMENT');
        const p = c.pageOf(b.id);
        await c.prepare(p.id);
        if ((b.type === 'code' ? String(b.text || '') : plain(String(b.text || ''))) !== a.expectedText)
            c.error('STALE_DOCUMENT');
        Store.updateBlock(b.id, { text: b.type === 'code' ? a.text : c.text(a.text), herkunft: 'ki', ...(a.checked !== undefined && b.type === 'todo' ? { checked: a.checked } : {}) });
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
        const matches = Store.childrenOf(p.id).filter((b) => b.alive && kinds.has(b.type)).flatMap((b) => {
            const value = b.type === 'code' ? String(b.text || '') : plain(String(b.text || ''));
            return value.split(a.find).slice(1).map(() => ({ b, value }));
        });
        if (matches.length !== 1)
            c.error(matches.length ? 'AMBIGUOUS_TEXT' : 'TEXT_NOT_FOUND');
        const hit = matches[0];
        c.block(hit.b.id, true);
        await c.prepare(p.id);
        if ((hit.b.type === 'code' ? String(hit.b.text || '') : plain(String(hit.b.text || ''))) !== hit.value)
            c.error('STALE_DOCUMENT');
        Store.updateBlock(hit.b.id, { text: hit.b.type === 'code' ? hit.value.replace(a.find, a.replacement) : replacePlain(String(hit.b.text || ''), a.find, a.replacement), herkunft: 'ki' });
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
