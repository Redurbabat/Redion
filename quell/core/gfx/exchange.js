"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/exchange.ts (npm run bauen:ts). */
const GfxExchange = (() => {
    let fileIO = null;
    const bindIO = (next) => { fileIO = next; };
    const fileBlob = (id) => fileIO?.read(id) || Promise.resolve(null);
    const packArchive = (files) => {
        if (!fileIO)
            return Promise.reject(new Error('Der Dateiaustausch ist noch nicht bereit.'));
        return fileIO.pack(files);
    };
    const text = (value) => typeof value === 'string' ? value :
        Array.isArray(value?.delta) ? value.delta.map((p) => typeof p.insert === 'string' ? p.insert : '').join('') :
            Array.isArray(value) ? value.map(p => typeof p.insert === 'string' ? p.insert : '').join('') : '';
    const remap = (objects, uid) => {
        const ids = new Map(objects.map(o => [o.id, uid()])), groups = new Map();
        const group = (id) => { if (!groups.has(id))
            groups.set(id, uid()); return groups.get(id); };
        return objects.map(o => ({ ...o, id: ids.get(o.id),
            ...(o.von ? { von: ids.get(o.von) || o.von } : {}), ...(o.nach ? { nach: ids.get(o.nach) || o.nach } : {}),
            ...(o.groupId ? { groupId: group(o.groupId) } : {}),
            ...(o.groupPath ? { groupPath: o.groupPath.map(group) } : {}) }));
    };
    const parse = (data, uid) => {
        if (data?.format === 'redion-canvas') {
            if (data.version !== 1 || !Array.isArray(data.shapes))
                throw new Error('Unbekannte Flächenversion.');
            for (const o of data.shapes) {
                if (!o || typeof o.id !== 'string' || !['stift', 'linie', 'pfeil', 'rechteck', 'ellipse', 'dreieck', 'raute', 'notiz', 'text', 'bild', 'attachment', 'verbindung', 'frame'].includes(o.art))
                    throw new Error('Ungültiges Zeichenobjekt.');
                if (o.art === 'stift' && (!Array.isArray(o.pts) || o.pts.some((p) => !Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))))
                    throw new Error('Ungültige Strichpunkte.');
                if (!['stift', 'verbindung'].includes(o.art) && (!Number.isFinite(o.x) || !Number.isFinite(o.y)))
                    throw new Error('Ungültige Objektkoordinaten.');
                if (!['stift', 'verbindung', 'text'].includes(o.art) && (!Number.isFinite(o.w) || !Number.isFinite(o.h)))
                    throw new Error('Ungültige Objektgrösse.');
                if (o.groupPath !== undefined && (!Array.isArray(o.groupPath) || o.groupPath.length > 64 || o.groupPath.some((id) => typeof id !== 'string')))
                    throw new Error('Ungültiger Gruppenpfad.');
                if (o.rotation !== undefined && !Number.isFinite(o.rotation))
                    throw new Error('Ungültiger Drehwinkel.');
            }
            if (new Set(data.shapes.map((o) => o.id)).size !== data.shapes.length)
                throw new Error('Doppelte Objektkennungen.');
            return data.shapes.map((o) => data.assets?.[o.dateiId] ? { ...o, transferAsset: data.assets[o.dateiId] } : o);
        }
        const elements = [], blocks = [];
        const visit = (value, depth = 0) => {
            if (!value || typeof value !== 'object' || depth > 50)
                return;
            if (value.flavour) {
                blocks.push(value);
                const entries = value.props?.elements || value.elements;
                if (entries && typeof entries === 'object')
                    for (const [id, e] of Object.entries(entries))
                        elements.push({ ...e, id: e.id || id });
            }
            if (Array.isArray(value))
                value.forEach(v => visit(v, depth + 1));
            else
                for (const [key, v] of Object.entries(value))
                    if (key !== 'elements' && key !== 'props')
                        visit(v, depth + 1);
        };
        visit(data);
        if (!blocks.length && data?.elements)
            for (const [id, e] of Object.entries(data.elements))
                elements.push({ ...e, id: e.id || id });
        const result = [], groups = elements.filter(e => e.type === 'group');
        const box = (raw) => {
            const b = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (!Array.isArray(b) || b.length !== 4 || !b.every(Number.isFinite))
                throw new Error('Ungültige AFFiNE-Koordinaten.');
            return { x: b[0], y: b[1], w: b[2], h: b[3] };
        };
        for (const e of elements) {
            if (e.type === 'group')
                continue;
            const common = { id: String(e.id || uid()), farbe: /^#[\da-f]{3,8}$/i.test(e.strokeColor || e.color || e.stroke) ? (e.strokeColor || e.color || e.stroke) : '#529cca',
                rotation: Number(e.rotate) || 0, affineSource: e };
            if (e.type === 'shape') {
                const art = { rect: 'rechteck', ellipse: 'ellipse', triangle: 'dreieck', diamond: 'raute' }[e.shapeType];
                if (!art)
                    throw new Error('Diese AFFiNE-Form wird noch nicht unterstützt: ' + e.shapeType);
                result.push({ ...common, ...box(e.xywh), art, gefuellt: e.filled === true, text: text(e.text) });
            }
            else if (e.type === 'brush' || e.type === 'highlighter') {
                const b = box(e.xywh);
                if (!Array.isArray(e.points) || e.points.some((p) => !Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])))
                    throw new Error('Ungültiger AFFiNE-Strich.');
                result.push({ ...common, art: 'stift', pts: e.points.map((p) => [b.x + p[0], b.y + p[1]]), strichBreite: Number(e.lineWidth) || 3, marker: e.type === 'highlighter' });
            }
            else if (e.type === 'text')
                result.push({ ...common, ...box(e.xywh), art: 'text', text: text(e.text) });
            else if (e.type === 'connector' && e.source?.id && e.target?.id)
                result.push({ ...common, art: 'verbindung', von: e.source.id, nach: e.target.id,
                    route: e.mode === 1 || e.mode === 'orthogonal' ? 'orthogonal' : e.mode === 2 || e.mode === 'curve' ? 'curve' : 'straight' });
            else
                throw new Error('Dieses AFFiNE-Element wird noch nicht unterstützt: ' + String(e.type));
        }
        for (const block of blocks) {
            const props = block.props || block, flavour = String(block.flavour);
            if (flavour === 'affine:frame')
                result.push({ id: String(block.id || uid()), art: 'frame', ...box(props.xywh), text: text(props.title), farbe: '#529cca', affineSource: block });
            if (flavour === 'affine:image' && !props.sourceId)
                throw new Error('Ein AFFiNE-Bild hat keinen Anhang.');
            if (flavour === 'affine:image')
                result.push({ id: String(block.id || uid()), art: 'bild', ...box(props.xywh), affineAsset: String(props.sourceId), affineSource: block });
            if (flavour === 'affine:attachment' && !props.sourceId)
                throw new Error('Eine AFFiNE-Datei hat keinen Anhang.');
            if (flavour === 'affine:attachment')
                result.push({ id: String(block.id || uid()), art: 'attachment',
                    ...(props.xywh ? box(props.xywh) : { x: 0, y: 0, w: 260, h: 72 }), affineAsset: String(props.sourceId || ''),
                    text: String(props.name || 'Anhang'), fileName: String(props.name || 'Anhang'), mime: String(props.type || ''), affineSource: block });
            if (flavour === 'affine:note' && props.xywh) {
                const content = (block.children || []).map((child) => typeof child === 'object' ? text(child.props?.text) : text(blocks.find(b => b.id === child)?.props?.text)).filter(Boolean).join('\n');
                result.push({ id: String(block.id || uid()), art: 'notiz', ...box(props.xywh), text: content, farbe: '#ffdc49', affineSource: block });
            }
        }
        for (const o of result) {
            const path = [];
            let current = o.id;
            for (let i = 0; i < groups.length; i++) {
                const group = groups.find(g => g.children?.[current]);
                if (!group)
                    break;
                if (path.includes(group.id))
                    throw new Error('Zyklische AFFiNE-Gruppe.');
                path.push(group.id);
                current = group.id;
            }
            if (path.length) {
                o.groupPath = path;
                o.groupId = path[path.length - 1];
            }
            if (o.art === 'verbindung' && (!result.some(x => x.id === o.von) || !result.some(x => x.id === o.nach)))
                throw new Error('Ein AFFiNE-Verbinder hat kein Ziel.');
        }
        if (!result.length)
            throw new Error('Keine Zeichenfläche gefunden. Unterstützt werden BlockSuite-JSON-Snapshots; binäre Yjs-Sicherungen benötigen AFFiNE zum Exportieren.');
        return result;
    };
    const readFile = async (file, uid, io) => {
        if (file.size > 64 * 1024 * 1024)
            throw new Error('Diese Datei ist zu gross für den Flächenimport (64 MB).');
        const zip = /\.(zip|affine)$/i.test(file.name) ? await io.zip(file) : null;
        let objects = [];
        if (zip) {
            for (const name of zip.namen.filter((n) => /\.json$/i.test(n))) {
                const raw = await zip.text(name);
                if (!raw)
                    continue;
                let data;
                try {
                    data = JSON.parse(raw);
                }
                catch {
                    continue;
                }
                if (!data?.blocks && !data?.elements && data?.format !== 'redion-canvas' && !data?.flavour)
                    continue;
                objects.push(...parse(data, uid));
            }
            if (!objects.length)
                throw new Error('Im Archiv fehlt ein unterstützter JSON-Snapshot.');
        }
        else
            objects = parse(JSON.parse(await file.text()), uid);
        const assets = new Map();
        for (const o of objects)
            if (o.affineAsset || o.transferAsset) {
                const name = o.transferAsset?.path || zip?.namen.find((n) => n === o.affineAsset || n === 'assets/' + o.affineAsset || n.endsWith('/assets/' + o.affineAsset));
                const blob = name && zip ? await zip.alsBlob(name) : null;
                if (!blob)
                    throw new Error('Ein Bildanhang fehlt: ' + o.affineAsset);
                const key = o.affineAsset || o.dateiId;
                assets.set(key, new Blob([blob], { type: o.transferAsset?.mime || o.mime || blob.type }));
            }
        if (!zip && objects.some(o => o.dateiId || o.affineAsset))
            throw new Error('Für Anhänge wird das vollständige Flächenarchiv benötigt.');
        const written = new Map();
        try {
            for (const [asset, blob] of assets) {
                if (io.active && !io.active())
                    throw new Error('Import abgebrochen.');
                written.set(asset, await io.save(blob, asset));
            }
            if (io.active && !io.active())
                throw new Error('Import abgebrochen.');
            return objects.map(o => {
                const { transferAsset, affineAsset, ...copy } = o;
                if (transferAsset || affineAsset)
                    copy.dateiId = written.get(affineAsset || o.dateiId);
                return copy;
            });
        }
        catch (error) {
            for (const id of written.values())
                await io.remove(id);
            throw error;
        }
    };
    const importFile = (file, uid, owner, active) => {
        const io = fileIO;
        if (!io)
            return Promise.reject(new Error('Der Dateiaustausch ist noch nicht bereit.'));
        return readFile(file, uid, { zip: io.zip, save: (blob, name) => io.save(blob, name, owner), remove: io.remove, active });
    };
    return { parse, remap, readFile, bindIO, fileBlob, packArchive, importFile };
})();
window.GfxExchange = GfxExchange;
