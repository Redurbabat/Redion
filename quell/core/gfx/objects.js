"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/objects.ts (npm run bauen:ts). */
const GfxObjects = (() => {
    const expand = (objects, ids) => {
        const groups = new Set(objects.filter(o => ids.has(o.id) && typeof o.groupId === 'string' && o.groupId)
            .map(o => o.groupId));
        const selected = new Set(objects.filter(o => ids.has(o.id) || (!!o.groupId && groups.has(o.groupId))).map(o => o.id));
        for (let pass = 0; pass < objects.length; pass++) {
            const count = selected.size;
            for (const frame of objects.filter(o => selected.has(o.id) && o['art'] === 'frame')) {
                const f = GfxShapes.rahmenVon(frame);
                for (const object of objects) {
                    if (selected.has(object.id) || object['art'] === 'verbindung')
                        continue;
                    const b = GfxShapes.rahmenVon(object);
                    if (b.x >= f.x && b.y >= f.y && b.x + b.w <= f.x + f.w && b.y + b.h <= f.y + f.h &&
                        (object['art'] !== 'frame' || b.w < f.w || b.h < f.h))
                        selected.add(object.id);
                }
            }
            const outer = new Set(objects.filter(o => selected.has(o.id) && o.groupId).map(o => o.groupId));
            objects.filter(o => o.groupId && outer.has(o.groupId)).forEach(o => selected.add(o.id));
            if (selected.size === count)
                break;
        }
        return selected;
    };
    const locked = (objects, ids) => objects.some(o => ids.has(o.id) && o.locked === true);
    const group = (objects, ids, groupId) => objects.map(o => {
        if (!ids.has(o.id))
            return o;
        const copy = { ...o };
        const path = Array.isArray(o.groupPath) ? o.groupPath.slice() : o.groupId ? [o.groupId] : [];
        if (groupId)
            path.push(groupId);
        else
            path.pop();
        if (path.length) {
            copy.groupId = path[path.length - 1];
            copy.groupPath = path;
        }
        else {
            delete copy.groupId;
            delete copy.groupPath;
        }
        return copy;
    });
    const reorder = (objects, ids, order) => {
        if (objects.some(o => o['art'] === 'verbindung')) {
            const ordered = reorder(objects.filter(o => o['art'] !== 'verbindung'), ids, order);
            let index = 0;
            return objects.map(o => o['art'] === 'verbindung' ? o : ordered[index++]);
        }
        if (order === 'front')
            return [...objects.filter(o => !ids.has(o.id)), ...objects.filter(o => ids.has(o.id))];
        if (order === 'back')
            return [...objects.filter(o => ids.has(o.id)), ...objects.filter(o => !ids.has(o.id))];
        const result = objects.slice();
        if (order === 'forward') {
            for (let i = result.length - 2; i >= 0; i--)
                if (ids.has(result[i].id) && !ids.has(result[i + 1].id))
                    [result[i], result[i + 1]] = [result[i + 1], result[i]];
        }
        else {
            for (let i = 1; i < result.length; i++)
                if (ids.has(result[i].id) && !ids.has(result[i - 1].id))
                    [result[i], result[i - 1]] = [result[i - 1], result[i]];
        }
        return result;
    };
    const bounds = (objects) => {
        const boxes = objects.filter(o => o.art !== 'verbindung').map(o => GfxShapes.rahmenVon(o));
        if (!boxes.length)
            return null;
        const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
        return { x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y };
    };
    const move = (o, dx, dy) => o.art === 'verbindung' ? { ...o } :
        o.art === 'stift' ? { ...o, pts: o.pts.map((p) => [p[0] + dx, p[1] + dy, ...p.slice(2)]) } :
            { ...o, x: Number(o.x) + dx, y: Number(o.y) + dy };
    const units = (objects, ids) => {
        const result = new Map();
        for (const o of objects) {
            if (!ids.has(o.id) || o.art === 'verbindung')
                continue;
            const key = o.groupId || o.id;
            if (!result.has(key))
                result.set(key, []);
            result.get(key).push(o);
        }
        return [...result.values()];
    };
    const align = (objects, ids, command) => {
        if (locked(objects, ids))
            return objects.slice();
        const groups = units(objects, ids), all = bounds(groups.flat());
        if (!all || groups.length < 2)
            return objects.slice();
        const shifts = new Map();
        if (command === 'horizontal' || command === 'vertical') {
            if (groups.length < 3)
                return objects.slice();
            const horizontal = command === 'horizontal', axis = horizontal ? 'x' : 'y', size = horizontal ? 'w' : 'h';
            const sorted = groups.map(items => ({ items, box: bounds(items) })).sort((a, b) => a.box[axis] - b.box[axis]);
            const first = sorted[0], last = sorted[sorted.length - 1];
            const gap = (last.box[axis] + last.box[size] - first.box[axis] - sorted.reduce((n, g) => n + g.box[size], 0)) / (sorted.length - 1);
            let cursor = first.box[axis];
            for (const g of sorted) {
                for (const o of g.items)
                    shifts.set(o.id, horizontal ? [cursor - g.box.x, 0] : [0, cursor - g.box.y]);
                cursor += g.box[size] + gap;
            }
        }
        else
            for (const items of groups) {
                const b = bounds(items);
                const dx = command === 'left' ? all.x - b.x : command === 'right' ? all.x + all.w - b.x - b.w :
                    command === 'center' ? all.x + all.w / 2 - b.x - b.w / 2 : 0;
                const dy = command === 'top' ? all.y - b.y : command === 'bottom' ? all.y + all.h - b.y - b.h :
                    command === 'middle' ? all.y + all.h / 2 - b.y - b.h / 2 : 0;
                for (const o of items)
                    shifts.set(o.id, [dx, dy]);
            }
        return objects.map(o => shifts.has(o.id) ? move(o, ...shifts.get(o.id)) : o);
    };
    const rotate = (objects, ids, degrees) => {
        const b = bounds(objects.filter(o => ids.has(o.id)));
        if (!b || locked(objects, ids) || !Number.isFinite(degrees))
            return objects.slice();
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2, angle = degrees * Math.PI / 180;
        const point = (x, y) => [
            cx + (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle),
            cy + (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle)
        ];
        return objects.map(o => {
            if (!ids.has(o.id) || o.art === 'verbindung')
                return o;
            if (o.art === 'stift')
                return { ...o, pts: o.pts.map((p) => [...point(p[0], p[1]), ...p.slice(2)]) };
            if (o.art === 'linie' || o.art === 'pfeil') {
                const a = point(o.x, o.y), z = point(o.x + o.w, o.y + o.h);
                return { ...o, x: a[0], y: a[1], w: z[0] - a[0], h: z[1] - a[1] };
            }
            const local = GfxShapes.localBounds(o), mid = point(local.x + local.w / 2, local.y + local.h / 2);
            return { ...move(o, mid[0] - local.x - local.w / 2, mid[1] - local.y - local.h / 2), rotation: ((Number(o.rotation) || 0) + degrees) % 360 };
        });
    };
    const inPolygon = (x, y, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[i], b = polygon[j];
            if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])
                inside = !inside;
        }
        return inside;
    };
    const lasso = (objects, polygon) => objects.filter(o => {
        if (o.art === 'verbindung' || polygon.length < 3)
            return false;
        const b = GfxShapes.rahmenVon(o);
        return [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]]
            .every(p => inPolygon(p[0], p[1], polygon));
    }).map(o => o.id);
    const snap = (objects, ids, dx, dy, tolerance) => {
        const b = bounds(objects.filter(o => ids.has(o.id)));
        const guides = [];
        if (!b)
            return { dx, dy, guides };
        let bestX = tolerance, bestY = tolerance, ox = 0, oy = 0;
        const bx = [b.x + dx, b.x + b.w / 2 + dx, b.x + b.w + dx], by = [b.y + dy, b.y + b.h / 2 + dy, b.y + b.h + dy];
        for (const o of objects) {
            if (ids.has(o.id) || o.art === 'verbindung' || o.art === 'frame')
                continue;
            const r = GfxShapes.rahmenVon(o);
            for (const at of [r.x, r.x + r.w / 2, r.x + r.w])
                for (const x of bx)
                    if (Math.abs(at - x) < bestX) {
                        bestX = Math.abs(at - x);
                        ox = at - x;
                        guides[0] = { axis: 'x', at };
                    }
            for (const at of [r.y, r.y + r.h / 2, r.y + r.h])
                for (const y of by)
                    if (Math.abs(at - y) < bestY) {
                        bestY = Math.abs(at - y);
                        oy = at - y;
                        guides[1] = { axis: 'y', at };
                    }
        }
        return { dx: dx + ox, dy: dy + oy, guides: guides.filter(Boolean) };
    };
    return { expand, locked, group, reorder, bounds, move, align, rotate, lasso, snap, units };
})();
window.GfxObjects = GfxObjects;
