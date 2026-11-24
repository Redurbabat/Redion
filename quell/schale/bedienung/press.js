"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/press.ts (npm run bauen:ts). */
const RedionPress = (() => {
    const PRESSABLE = [
        'button', '[role="button"]', '[role="tab"]', '[role="menuitem"]', '[role="menuitemradio"]',
        '[role="menuitemcheckbox"]', '[role="option"]', '[role="switch"]', 'summary', 'a.btn',
        '.rb', '.side-item', '.sr', '.ws-btn', '.side-chat', '.hk', '.bib-heft', '.wk-weg',
        '.lw-continue-card',
        '.au-eigen'
    ].join(',');
    const NEVER = '[data-kein-druck], .ui-touch-root, .ui-touch-portal, input, textarea, select';
    const OWN_PRESS = [
        '.fbtns button.prim', '[data-rmo~="glass"]', '.rmo-transport button', '#ai .ai-leiste button',
        '#ai-senden', '.rmo-recent-card', '.bib-deckel', '.ru-staff', '.hs-tun', '.ru-funkel',
        '#handy-oben > button[role="tab"]', '#ho-ziele > button', '[data-eigener-druck]'
    ].join(',');
    const STATE_ONLY = '.schalter, [role="switch"]';
    const MIN_HOLD = 80;
    const WIDE = 160;
    let current = null;
    let started = false;
    const running = new WeakMap();
    const turns = new WeakMap();
    const canScale = () => {
        try {
            return typeof CSS !== 'undefined' && CSS.supports('scale', '1');
        }
        catch {
            return false;
        }
    };
    const calm = () => typeof AppEinstellung !== 'undefined' ? AppEinstellung.wenigBewegung() : false;
    const target = (from) => {
        const el = from instanceof Element ? from.closest(PRESSABLE) : null;
        if (!el || el.closest(NEVER))
            return null;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true')
            return null;
        return el;
    };
    const scaleOf = (el) => {
        const s = getComputedStyle(el).scale;
        if (!s || s === 'none')
            return 1;
        if (/\s/.test(s.trim()))
            return null;
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : null;
    };
    const token = (name, fallback) => {
        try {
            return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
        }
        catch {
            return fallback;
        }
    };
    const ms = (name, fallback) => {
        const raw = token(name, '');
        const n = parseFloat(raw);
        return Number.isFinite(n) ? (/ms$/.test(raw) ? n : n * 1000) : fallback;
    };
    const press = (el, pointer) => {
        if (current)
            release();
        const turn = (turns.get(el) ?? 0) + 1;
        turns.set(el, turn);
        el.setAttribute('data-gedrueckt', '');
        const p = { el, since: performance.now(), pointer, anim: null, turn };
        current = p;
        if (calm() || !canScale() || el.matches(STATE_ONLY) || el.matches(OWN_PRESS))
            return;
        const from = scaleOf(el);
        running.get(el)?.cancel();
        const base = scaleOf(el);
        if (from === null || base === null)
            return;
        const depth = el.getBoundingClientRect().width > WIDE
            ? parseFloat(token('--card-press-scale', '0.985')) || 0.985
            : parseFloat(token('--press-scale', '0.96')) || 0.96;
        p.anim = el.animate([{ scale: String(from) }, { scale: String(base * depth) }], { duration: ms('--motion-instant', MIN_HOLD), easing: token('--ease', 'ease-out'), fill: 'forwards' });
        running.set(el, p.anim);
    };
    const release = () => {
        const p = current;
        if (!p)
            return;
        current = null;
        const go = () => {
            if (turns.get(p.el) !== p.turn)
                return;
            p.el.removeAttribute('data-gedrueckt');
            if (!p.anim)
                return;
            const from = scaleOf(p.el);
            p.anim.cancel();
            const base = scaleOf(p.el);
            if (from === null || base === null)
                return;
            const spring = typeof RedionSpring !== 'undefined'
                ? RedionSpring.token('press') : { easing: token('--feder-druck', 'ease-out'), duration: 575 };
            const back = p.el.animate([{ scale: String(from) }, { scale: String(base) }], { duration: spring.duration, easing: spring.easing });
            running.set(p.el, back);
            back.onfinish = () => { if (running.get(p.el) === back)
                running.delete(p.el); };
        };
        const wait = MIN_HOLD - (performance.now() - p.since);
        if (wait > 0)
            setTimeout(go, wait);
        else
            go();
    };
    const start = () => {
        if (started)
            return;
        started = true;
        window.addEventListener('pointerdown', (e) => {
            if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0))
                return;
            const el = target(e.target);
            if (el)
                press(el, e.pointerId);
        }, { capture: true, passive: true });
        const end = (e) => { if (current && current.pointer === e.pointerId)
            release(); };
        window.addEventListener('pointerup', end, { capture: true, passive: true });
        window.addEventListener('pointercancel', end, { capture: true, passive: true });
        window.addEventListener('keydown', (e) => {
            if (e.repeat || (e.key !== ' ' && e.key !== 'Enter'))
                return;
            const el = target(document.activeElement);
            if (el && el === document.activeElement)
                press(el, -1);
        }, { capture: true });
        window.addEventListener('keyup', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && current?.pointer === -1)
                release();
        }, { capture: true });
        window.addEventListener('dragstart', () => release(), { capture: true, passive: true });
        window.addEventListener('blur', () => release());
    };
    return { start, PRESSABLE, OWN_PRESS, STATE_ONLY };
})();
window.RedionPress = RedionPress;
