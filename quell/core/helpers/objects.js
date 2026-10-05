"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/objects.ts (npm run bauen:ts). */
const Objects = (() => {
    const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
    const clone = (x) => {
        if (x === null || typeof x !== 'object')
            return x;
        if (x instanceof Date)
            return new Date(x.getTime());
        if (Array.isArray(x))
            return x.map(clone);
        const out = {};
        for (const k of Object.keys(x))
            out[k] = clone(x[k]);
        return out;
    };
    const equal = (a, b) => {
        if (a === b)
            return true;
        if (a instanceof Date || b instanceof Date)
            return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
        if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object')
            return a === b;
        if (Array.isArray(a) !== Array.isArray(b))
            return false;
        if (Array.isArray(a)) {
            if (a.length !== b.length)
                return false;
            return a.every((x, i) => equal(x, b[i]));
        }
        const ka = Object.keys(a), kb = Object.keys(b);
        if (ka.length !== kb.length)
            return false;
        return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && equal(a[k], b[k]));
    };
    const parts = (path) => Array.isArray(path)
        ? path
        : String(path || '').split('.').filter(x => x !== '');
    const get = (o, path, fallback = undefined) => {
        let z = o;
        for (const k of parts(path)) {
            if (z === null || z === undefined)
                return fallback;
            z = z[k];
        }
        return z === undefined ? fallback : z;
    };
    const set = (o, path, value) => {
        const p = parts(path);
        if (!p.length)
            return value;
        let z = o;
        for (let i = 0; i < p.length - 1; i++) {
            const k = p[i] ?? '';
            if (!isObject(z[k]) && !Array.isArray(z[k]))
                z[k] = {};
            z = z[k];
        }
        const last = p[p.length - 1] ?? '';
        if (value === undefined)
            delete z[last];
        else
            z[last] = value;
        return o;
    };
    const merge = (a, b) => {
        if (!isObject(a) || !isObject(b))
            return clone(b === undefined ? a : b);
        const out = clone(a);
        for (const k of Object.keys(b)) {
            out[k] = (isObject(out[k]) && isObject(b[k])) ? merge(out[k], b[k]) : clone(b[k]);
        }
        return out;
    };
    const differences = (a, b, path = []) => {
        const out = [];
        if (equal(a, b))
            return out;
        if (!isObject(a) || !isObject(b)) {
            out.push(path.join('.') || '(alles)');
            return out;
        }
        const names = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const k of names)
            out.push(...differences(a[k], b[k], [...path, k]));
        return out;
    };
    const withoutEmpty = (o) => {
        if (!isObject(o))
            return o;
        const out = {};
        for (const k of Object.keys(o)) {
            const v = o[k];
            if (v === undefined || v === null || v === '')
                continue;
            if (Array.isArray(v) && !v.length)
                continue;
            out[k] = isObject(v) ? withoutEmpty(v) : v;
        }
        return out;
    };
    const pick = (o, fields) => {
        const out = {};
        (fields || []).forEach(k => { if (k in (o || {}))
            out[k] = o[k]; });
        return out;
    };
    const omit = (o, fields) => {
        const drop = new Set(fields || []);
        const out = {};
        Object.keys(o || {}).forEach(k => { if (!drop.has(k))
            out[k] = o[k]; });
        return out;
    };
    const groupBy = (list, key) => {
        const out = {};
        (list || []).forEach((x) => {
            const k = typeof key === 'function' ? key(x) : get(x, key);
            (out[k] = out[k] || []).push(x);
        });
        return out;
    };
    return { isObject, clone, equal, get, set, merge, differences,
        withoutEmpty, pick, omit, groupBy };
})();
window.Objects = Objects;
