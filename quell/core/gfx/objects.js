"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/objects.ts (npm run bauen:ts). */
const GfxObjects = (() => {
    const expand = (objects, ids) => {
        const groups = new Set(objects.filter(o => ids.has(o.id) && typeof o.groupId === 'string' && o.groupId)
            .map(o => o.groupId));
        return new Set(objects.filter(o => ids.has(o.id) || (!!o.groupId && groups.has(o.groupId))).map(o => o.id));
    };
    const locked = (objects, ids) => objects.some(o => ids.has(o.id) && o.locked === true);
    const group = (objects, ids, groupId) => objects.map(o => {
        if (!ids.has(o.id))
            return o;
        const copy = { ...o };
        if (groupId)
            copy.groupId = groupId;
        else
            delete copy.groupId;
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
    return { expand, locked, group, reorder };
})();
window.GfxObjects = GfxObjects;
