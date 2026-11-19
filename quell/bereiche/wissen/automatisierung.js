"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/automatisierung.ts (npm run bauen:ts). */
(() => {
    const R = RegisterAutomatisierung;
    R.melde('redion_list_workspaces', () => ({ workspaces: [{ id: 'lernen', name: 'Lernen' }, { id: 'workspace', name: 'Arbeitsbereich' }], activeId: Produktwelten.aktiv() }));
    R.melde('redion_open_workspace', a => { Produktwelten.wechseln(a.workspaceId); Produktwelten.zurAktivenWelt(); return { workspaceId: Produktwelten.aktiv() }; });
    R.melde('redion_open_home', () => { Produktwelten.zurAktivenWelt(); return { workspaceId: Produktwelten.aktiv() }; });
    R.melde('redion_move_page', async (a, c) => {
        const p = c.block(a.documentId, true), target = c.block(a.parentId, true);
        if (p.type !== 'page' || target.type !== 'page')
            c.error('INVALID_DOCUMENT');
        await c.prepare(p.id);
        if (!Werkzeuge.verschiebe(p, target.id, true))
            c.error('MOVE_REJECTED');
        await c.finish(p.id);
        return { documentId: p.id, parentId: Store.getBlock(p.id).parentId };
    });
    R.melde('redion_duplicate_page', async (a, c) => {
        const p = c.block(a.documentId);
        if (p.type !== 'page')
            c.error('INVALID_DOCUMENT');
        if (p.parentId)
            c.block(p.parentId, true);
        else if (!Konten.darf('bearbeiten'))
            c.error('PERMISSION_DENIED');
        const tree = Store.baum(p.id);
        const count = (node) => node ? 1 + (node.kinder || []).reduce((n, k) => n + count(k), 0) + (node.rows || []).length : 0;
        if (count(tree) > 25)
            c.error('ACTION_TOO_LARGE');
        c.check();
        const created = App.dupliziereSeite(p.id, p.parentId);
        if (!created)
            return c.error('ACTION_FAILED');
        App.oeffne(created.id);
        await c.finish(created.id);
        return { documentId: created.id, title: created.text };
    });
    R.melde('redion_create_flashcards', async (a, c) => {
        const p = c.block(a.documentId, true);
        if (p.type !== 'page')
            c.error('INVALID_DOCUMENT');
        if (a.cards.some((k) => k.question.includes('::') || k.answer.includes('::')))
            c.error('INVALID_CARD_SEPARATOR');
        await c.prepare(p.id);
        const ids = a.cards.map((k) => Store.addBlock(p.id, 'flashcard', { text: k.question + ' :: ' + k.answer, herkunft: 'ki' }).id);
        await c.finish(p.id);
        return { documentId: p.id, cardIds: ids, count: ids.length };
    });
    R.melde('redion_create_task', async (a, c) => {
        const p = c.block(a.documentId, true);
        if (p.type !== 'page')
            c.error('INVALID_DOCUMENT');
        await c.prepare(p.id);
        const b = Store.addBlock(p.id, 'todo', { text: a.text, checked: false, herkunft: 'ki' });
        await c.finish(p.id);
        return { blockId: b.id, documentId: p.id };
    });
    R.melde('redion_update_task', async (a, c) => {
        const b = c.block(a.blockId, true);
        if (b.type !== 'todo')
            c.error('UNSUPPORTED_BLOCK_TYPE');
        const p = c.pageOf(b.id);
        await c.prepare(p.id);
        Store.updateBlock(b.id, { checked: a.checked });
        await c.finish(p.id);
        return { blockId: b.id, checked: !!Store.getBlock(b.id).checked };
    });
})();
