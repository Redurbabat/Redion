"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/throttle.ts (npm run bauen:ts). */
const Throttle = (() => {
    const debounce = (fn, ms = 300) => {
        let timer = null;
        let last = null;
        const g = (...a) => {
            last = a;
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(() => { timer = null; const x = last; last = null; fn(...x); }, ms);
        };
        g.flush = () => {
            if (!timer)
                return;
            clearTimeout(timer);
            timer = null;
            const x = last;
            last = null;
            if (x)
                fn(...x);
        };
        g.cancel = () => { if (timer)
            clearTimeout(timer); timer = null; last = null; };
        g.pending = () => timer !== null;
        return g;
    };
    const throttle = (fn, ms = 100) => {
        let lastRun = 0;
        let timer = null;
        let last = null;
        const g = (...a) => {
            const now = Date.now();
            last = a;
            if (now - lastRun >= ms) {
                lastRun = now;
                fn(...a);
                last = null;
                return;
            }
            if (timer)
                return;
            timer = setTimeout(() => {
                timer = null;
                lastRun = Date.now();
                if (last) {
                    fn(...last);
                    last = null;
                }
            }, ms - (now - lastRun));
        };
        g.cancel = () => { if (timer)
            clearTimeout(timer); timer = null; last = null; };
        return g;
    };
    const nextFrame = (fn) => {
        let queued = false;
        let last = [];
        const g = (...a) => {
            last = a;
            if (queued)
                return;
            queued = true;
            requestAnimationFrame(() => { queued = false; fn(...last); });
        };
        return g;
    };
    const once = (fn) => {
        let ran = false;
        let value;
        return (...a) => { if (!ran) {
            ran = true;
            value = fn(...a);
        } return value; };
    };
    const memoize = (fn, limit = 500) => {
        const map = new Map();
        const g = (...a) => {
            const k = JSON.stringify(a);
            if (map.has(k))
                return map.get(k);
            const w = fn(...a);
            if (map.size >= limit)
                map.delete(map.keys().next().value);
            map.set(k, w);
            return w;
        };
        g.clear = () => map.clear();
        g.size = () => map.size;
        return g;
    };
    const later = (fn, ms) => {
        const timer = setTimeout(fn, ms);
        return () => clearTimeout(timer);
    };
    return { debounce, throttle, nextFrame, once, memoize, later };
})();
window.Throttle = Throttle;
