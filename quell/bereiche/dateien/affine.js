"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/dateien/affine.ts (npm run bauen:ts). */
const AffineImport = (() => {
    const sourceRecord = (source) => ({ ...source, children: (source.children || []).map((child) => typeof child === 'string' ? child : child.id) });
    const richText = (value, plain = false) => {
        const delta = Array.isArray(value?.delta) ? value.delta : Array.isArray(value) ? value : null;
        if (!delta)
            return GfxExchange.text(value);
        return delta.map((part) => {
            if (typeof part.insert !== 'string')
                return '';
            let text = part.insert;
            if (plain)
                return text;
            const a = part.attributes || {};
            if (a.code)
                text = '`' + text + '`';
            if (a.bold)
                text = '**' + text + '**';
            if (a.italic)
                text = '*' + text + '*';
            if (a.underline)
                text = '__' + text + '__';
            if (a.strike)
                text = '~~' + text + '~~';
            if (typeof a.link === 'string') {
                try {
                    const url = new URL(a.link);
                    if (['https:', 'http:'].includes(url.protocol))
                        text = '[' + text + '](' + url.href + ')';
                }
                catch { }
            }
            return text;
        }).join('');
    };
    const plan = (data, fallback = 'AFFiNE-Dokument') => {
        const roots = [];
        const find = (value, wrapper, depth = 0) => {
            if (!value || typeof value !== 'object' || depth > 50)
                return;
            if (value.flavour === 'affine:page') {
                roots.push({ root: value, wrapper });
                return;
            }
            if (Array.isArray(value))
                value.forEach(v => find(v, wrapper, depth + 1));
            else
                for (const [key, child] of Object.entries(value))
                    if (!['props', 'elements'].includes(key))
                        find(child, value.meta ? value : wrapper, depth + 1);
        };
        find(data, data);
        if (!roots.length)
            throw new Error('Kein AFFiNE-Dokumentsnapshot gefunden. Binäre Arbeitsbereiche benötigen einen Export aus AFFiNE.');
        return roots.map(({ root, wrapper }, index) => {
            const warnings = [], seen = new Set(), byId = new Map();
            const collect = (value, depth = 0) => {
                if (!value || typeof value !== 'object' || depth > 50)
                    return;
                if (value.flavour && value.id)
                    byId.set(String(value.id), value);
                if (Array.isArray(value))
                    value.forEach(v => collect(v, depth + 1));
                else
                    for (const [key, v] of Object.entries(value))
                        if (!['props', 'elements'].includes(key))
                            collect(v, depth + 1);
            };
            collect(wrapper);
            collect(root);
            const title = GfxExchange.text(root.props?.title) || wrapper.meta?.title || fallback + (roots.length > 1 ? ' ' + (index + 1) : '');
            const block = (raw, depth = 0) => {
                const source = typeof raw === 'string' ? byId.get(raw) : raw;
                if (!source?.flavour || depth > 50)
                    throw new Error('Unvollständige oder zu tief verschachtelte AFFiNE-Blöcke.');
                const id = String(source.id || '');
                if (id && seen.has(id))
                    throw new Error('Zyklische oder doppelte AFFiNE-Blockkennung.');
                if (id)
                    seen.add(id);
                const p = source.props || {}, flavour = String(source.flavour), children = (source.children || []).flatMap((child) => block(child, depth + 1));
                let type = 'text';
                const fields = { text: richText(p.text), affineSource: sourceRecord(source) };
                if (['affine:surface', 'affine:frame'].includes(flavour))
                    return children;
                if (flavour === 'affine:note') {
                    type = 'callout';
                    fields.text = GfxExchange.text(p.title) || 'Notiz';
                    fields.icon = '📝';
                    if (p.xywh) {
                        const b = typeof p.xywh === 'string' ? JSON.parse(p.xywh) : p.xywh;
                        if (Array.isArray(b) && b.length === 4 && b.every(Number.isFinite))
                            fields.flaecheOrt = { x: b[0], y: b[1], w: Math.max(100, b[2]), raumVersion: 1 };
                    }
                }
                else if (flavour === 'affine:paragraph')
                    type = /^h[1-6]$/.test(p.type) ? 'h' + Math.min(3, Number(p.type.slice(1))) : p.type === 'quote' ? 'quote' : 'text';
                else if (flavour === 'affine:list') {
                    type = { todo: 'todo', bulleted: 'bullet', numbered: 'number', toggle: 'toggle' }[p.type] || 'bullet';
                    fields.checked = p.checked === true;
                    fields.collapsed = p.collapsed === true;
                }
                else if (flavour === 'affine:code') {
                    type = 'code';
                    fields.text = richText(p.text, true);
                    fields.lang = String(p.language || 'Plain Text');
                }
                else if (flavour === 'affine:latex') {
                    type = 'equation';
                    fields.text = String(p.latex || '');
                }
                else if (flavour === 'affine:divider')
                    type = 'divider';
                else if (flavour === 'affine:callout')
                    type = 'callout';
                else if (flavour === 'affine:bookmark') {
                    type = 'bookmark';
                    fields.src = String(p.url || '');
                    fields.text = String(p.title || p.url || 'Link');
                    fields.caption = String(p.description || '');
                }
                else if (flavour === 'affine:image' || flavour === 'affine:attachment') {
                    if (!p.sourceId)
                        throw new Error('Ein AFFiNE-Anhang hat keine Quellenkennung.');
                    type = flavour === 'affine:image' ? 'image' : 'file';
                    fields.affineAsset = String(p.sourceId);
                    fields.text = String(p.name || p.caption || 'Anhang');
                    fields.caption = String(p.caption || '');
                }
                else if (['affine:embed-linked-doc', 'affine:embed-synced-doc'].includes(flavour)) {
                    type = flavour === 'affine:embed-synced-doc' ? 'synced' : 'pageref';
                    fields.affineTarget = String(p.pageId || p.docId || '');
                }
                else if (flavour === 'affine:table' && Array.isArray(p.rows)) {
                    type = 'table';
                    fields.rows = p.rows;
                }
                else {
                    type = 'code';
                    fields.lang = 'JSON';
                    fields.text = JSON.stringify(sourceRecord(source), null, 2);
                    fields.caption = 'AFFiNE-Block: ' + flavour;
                    warnings.push(flavour + ': Originaldaten als JSON erhalten');
                    fields.affineUnsupported = true;
                }
                return [{ source, type, fields, children }];
            };
            const blocks = (root.children || []).flatMap((child) => block(child));
            let shapes = [];
            try {
                shapes = GfxExchange.parse({ blocks: [...byId.values()].filter(b => b.flavour === 'affine:surface' || b.flavour === 'affine:frame') }, () => Store.uid());
            }
            catch (error) {
                if ([...byId.values()].some(b => b.flavour === 'affine:surface' && Object.keys(b.props?.elements || {}).length))
                    throw error;
            }
            return { sourceId: String(wrapper.meta?.id || root.id || index), title: String(title), blocks, shapes, source: root, warnings };
        });
    };
    const file = async (file, active = () => true) => {
        if (file.size > 64 * 1024 * 1024)
            throw new Error('Dieser Snapshot ist zu gross (64 MB).');
        const archive = /\.(zip|affine)$/i.test(file.name) ? await Einlesen.zipLesenAusBlob(file) : null;
        const pages = [], fallback = file.name.replace(/\.[^.]+$/, '');
        if (archive) {
            for (const name of archive.namen.filter((n) => /\.json$/i.test(n))) {
                const text = await archive.text(name);
                if (!text)
                    continue;
                let data;
                try {
                    data = JSON.parse(text);
                }
                catch {
                    continue;
                }
                if (!JSON.stringify(data).includes('affine:page'))
                    continue;
                pages.push(...plan(data, name.replace(/\.json$/i, '')));
            }
        }
        else
            pages.push(...plan(JSON.parse(await file.text()), fallback));
        if (!pages.length)
            throw new Error('Im Archiv fehlt ein Dokumentsnapshot.');
        const assets = new Map();
        const walk = (blocks, visit) => blocks.forEach(b => { visit(b); walk(b.children, visit); });
        const requested = new Set();
        pages.forEach(p => { walk(p.blocks, b => { if (b.fields.affineAsset)
            requested.add(b.fields.affineAsset); }); p.shapes.forEach(o => { if (o.affineAsset)
            requested.add(o.affineAsset); }); });
        for (const id of requested) {
            const name = archive?.namen.find((name) => name === id || name === 'assets/' + id || name.endsWith('/assets/' + id));
            const blob = name && archive ? await archive.alsBlob(name) : null;
            if (!blob)
                throw new Error('Ein AFFiNE-Anhang fehlt: ' + id);
            assets.set(id, { blob, name: id });
        }
        const rootId = Store.uid(), pageIds = pages.map(() => Store.uid()), files = new Map();
        let root = null;
        try {
            if (!active())
                throw new Error('Import abgebrochen.');
            for (const [id, asset] of assets) {
                if (!active())
                    throw new Error('Import abgebrochen.');
                files.set(id, (await Dateien.ablegen(new File([asset.blob], asset.name, { type: asset.blob.type }), { blockId: rootId })).id);
            }
            const original = await Dateien.ablegen(file, { blockId: rootId });
            files.set('__original__', original.id);
            if (!active())
                throw new Error('Import abgebrochen.');
            root = Store.addPage(null, { id: rootId, text: fallback || 'AFFiNE-Import', icon: '📥' });
            Store.addBlock(root.id, 'file', { text: 'Original: ' + file.name, dateiId: original.id });
            pages.forEach((page, index) => {
                const shapes = GfxExchange.remap(page.shapes.map(o => { const { affineAsset, ...shape } = o; return affineAsset ? { ...shape, dateiId: files.get(affineAsset) } : shape; }), () => Store.uid());
                const target = Store.addPage(root.id, { id: pageIds[index], text: page.title, affineSource: sourceRecord(page.source), ...(shapes.length ? { shapes, raumVersion: 1 } : {}) });
                const insert = (blocks, parent) => blocks.forEach(b => {
                    const { affineAsset, affineTarget, ...fields } = b.fields;
                    if (affineAsset)
                        fields.dateiId = files.get(affineAsset);
                    if (affineTarget) {
                        const index = pages.findIndex(p => p.sourceId === affineTarget);
                        if (index >= 0)
                            fields[b.type === 'synced' ? 'quelle' : 'ziel'] = pageIds[index];
                        else {
                            fields.text = 'AFFiNE-Verweis: ' + affineTarget;
                            fields.affineUnsupported = true;
                            page.warnings.push('Nicht mitexportiertes Zieldokument: ' + affineTarget);
                        }
                    }
                    const created = Store.addBlock(parent, b.type, fields);
                    insert(b.children, created.id);
                });
                insert(page.blocks, target.id);
            });
            await Store.flush();
            return { rootId, pages: pages.length, warnings: pages.flatMap(p => p.warnings) };
        }
        catch (error) {
            if (root)
                Store.purgeBlock(rootId);
            for (const id of files.values())
                await Dateien.weg(id);
            throw error;
        }
    };
    return { plan, richText, file };
})();
window.AffineImport = AffineImport;
