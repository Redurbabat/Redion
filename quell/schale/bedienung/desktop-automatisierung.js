"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/desktop-automatisierung.ts (npm run bauen:ts). */
const RedionAutomation = (() => {
    const pending = new Set();
    let started = false;
    const error = (code) => { throw Object.assign(new Error('Redion-Aktion abgewiesen.'), { code }); };
    const pageOf = (id) => {
        let b = Store.getBlock(id);
        const seen = new Set();
        while (b && b.type !== 'page') {
            if (seen.has(b.id) || seen.size > 100)
                error('INVALID_DOCUMENT');
            seen.add(b.id);
            b = b.parentTable === 'collection' ? Object.values(Store.cache.blocks).find(x => x.alive && x.type === 'database' && x.collectionId === b.parentId) : Store.getBlock(b.parentId);
        }
        if (!b || b.alive === false)
            error('INVALID_DOCUMENT');
        return b;
    };
    const block = (id, write = false) => {
        const b = Store.getBlock(id);
        if (!b || b.alive === false)
            error('INVALID_DOCUMENT');
        const p = pageOf(id);
        if (!Konten.darf(write ? 'bearbeiten' : 'lesen', id) || !Konten.darf(write ? 'bearbeiten' : 'lesen', p.id))
            error('PERMISSION_DENIED');
        if (write && (b.locked || p.locked))
            error('DOCUMENT_LOCKED');
        return b;
    };
    const editing = () => {
        const el = document.activeElement;
        return el instanceof HTMLElement && el.isContentEditable && !!document.getElementById('page')?.contains(el);
    };
    const start = () => {
        const desktop = window.RedionDesktop;
        if (started || !desktop?.onAutomationRequest || desktop.automationSupported === false)
            return;
        started = true;
        desktop.onAutomationCancel((id) => { document.getElementById('redion-mcp-mask')?.remove(); if (id)
            pending.delete(id);
        else
            pending.clear(); });
        desktop.onAutomationRequest(async (request) => {
            pending.add(request.id);
            const check = () => { if (!pending.has(request.id))
                error('ACTION_CANCELLED'); };
            const context = { check, block, pageOf, error,
                prepare: async (documentId) => {
                    if (editing())
                        error('EDITOR_BUSY');
                    const p = block(documentId, true);
                    if (p.type !== 'page')
                        error('INVALID_DOCUMENT');
                    if (App.aktuelleSeite() !== p.id)
                        App.oeffne(p.id);
                    await Store.versionSpeichern(p.id, 'vor ChatGPT-Änderung');
                    check();
                    block(documentId, true);
                    if (editing())
                        error('EDITOR_BUSY');
                    Verlauf.merke(true);
                },
                finish: async (documentId) => {
                    await Store.flush();
                    check();
                    if (Store.speichertNicht())
                        error('PERSISTENCE_UNAVAILABLE');
                    App.zeichneBaum();
                    if (documentId && App.aktuelleSeite() === documentId && !editing())
                        App.zeichneSeite();
                    if (documentId)
                        UI.toast('ChatGPT: Änderung gespeichert');
                } };
            try {
                const data = await RegisterAutomatisierung.ausfuehren(request.tool, request.arguments, context);
                check();
                await desktop.automationReply({ id: request.id, ok: true, data });
            }
            catch (e) {
                await desktop.automationReply({ id: request.id, ok: false, error: { code: e.code || 'ACTION_FAILED' } });
            }
            finally {
                pending.delete(request.id);
            }
        });
        void desktop.automationReady().catch(() => { });
    };
    return { start };
})();
RegisterAutomatisierung.melde('redion_get_current_view', (_a, c) => {
    const id = App.aktuelleSeite(), p = id ? c.block(id) : null;
    return { documentId: p?.id || null, view: location.hash.slice(0, 160), workspaceId: Store.getMeta('produkt:welt', 'lernen'),
        editor: p ? (document.querySelector('.sp-wrap') ? 'schematic' : document.querySelector('.pdf-document-mode') ? 'pdf' : 'page') : null };
});
RegisterAutomatisierung.melde('redion_get_active_document', (_a, c) => {
    const id = App.aktuelleSeite();
    const p = id ? c.block(id) : null;
    return { document: p ? { id: p.id, title: p.text || '', type: p.type } : null };
});
RegisterAutomatisierung.melde('redion_capture_view', async (a, c) => {
    if (a.phase === 'release') {
        document.getElementById('redion-mcp-mask')?.remove();
        return { released: true };
    }
    const active = App.aktuelleSeite(), p = active ? c.block(active) : null;
    if (a.documentId && a.documentId !== p?.id)
        c.error('STALE_DOCUMENT');
    if (a.blockId) {
        const b = c.block(a.blockId);
        if (a.target !== 'schematic' || b.type !== 'schaltplan' || c.pageOf(b.id).id !== p?.id)
            c.error('INVALID_SCHEMATIC');
    }
    const element = a.target === 'window' ? document.documentElement : a.target === 'schematic' ?
        document.querySelector(a.blockId ? `.blk[data-bid="${CSS.escape(a.blockId)}"] .sp-buehne` : '.sp-wrap .sp-buehne') : document.querySelector('#page');
    if (!element || a.target !== 'window' && !p)
        c.error('INVALID_DOCUMENT');
    const r = element.getBoundingClientRect(), width = window.innerWidth, height = window.innerHeight;
    const visible = (box) => ({ x: Math.max(0, Math.floor(box.x)), y: Math.max(0, Math.floor(box.y)),
        width: Math.max(0, Math.min(width, Math.ceil(box.right)) - Math.max(0, Math.floor(box.x))),
        height: Math.max(0, Math.min(height, Math.ceil(box.bottom)) - Math.max(0, Math.floor(box.y))) });
    const region = a.target === 'window' ? { x: 0, y: 0, width, height } : visible(r);
    if (region.width < 1 || region.height < 1)
        c.error('INVALID_REGION');
    const masks = [...document.querySelectorAll('input,textarea,iframe,webview,[data-sensitive],[data-private],[data-mcp-private]')]
        .map(el => visible(el.getBoundingClientRect())).filter(box => box.width > 0 && box.height > 0);
    if (masks.length > 500)
        c.error('ACTION_TOO_LARGE');
    let style = document.getElementById('redion-mcp-mask');
    if (!style) {
        style = document.createElement('style');
        style.id = 'redion-mcp-mask';
        document.head.append(style);
    }
    style.textContent = 'input,textarea,iframe,webview,[data-sensitive],[data-private],[data-mcp-private]{visibility:hidden!important}';
    await new Promise(resolve => {
        const timer = setTimeout(resolve, 150);
        requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(timer); resolve(); }));
    });
    c.check();
    return { rect: region, viewport: { x: 0, y: 0, width, height }, masks, ...(p ? { documentId: p.id } : {}), ...(a.blockId ? { blockId: a.blockId } : {}) };
});
