"use strict";
/* schale/bedienung/delete.ts — der Löschen-Knopf, der wie eine Flüssigkeit
 * in zwei Pillen zerfliesst (E709). ERZEUGT: quell/schale/bedienung/delete.js.
 * Redur, 27.09., ca. 22:02: „Ich will das du löschen button so ist überla wo
 * etwas zum löschen eine buton gibt". Vorbild: DeleteButton seines Touch
 * Kits — nachgebaut, nicht geladen (E699: keine Insel beim Start).
 * Eine Stelle macht mit, indem ihr Knopf `data-loeschknopf` trägt (Wert: das
 * Wort der roten Pille). Ein Zuhörer (Einfangphase) fängt den ersten Druck ab
 * und öffnet das Paar; erst die rote Pille lässt ihn zum Knopf durch — der
 * Griff der Stelle läuft unverändert, am selben Ort (§43).
 * EIN Klebefilter je Dokument, an nur während des Fliessens (das Kit hält je
 * Knopf einen, auch in Ruhe). Fokus auf „Abbrechen", Escape schliesst nur das
 * Paar, ein Doppelklick löscht nicht, weniger Bewegung blendet nur auf. */
const RedionDelete = (() => {
    /** Wer mitmacht. */
    const MARK = '[data-loeschknopf]';
    /** Worin das Paar liegt: im obersten Träger des Knopfs, sonst im body —
     *  so bleibt es in der Falle von `Fokus` und wird nicht `inert`. */
    const CARRIER = '.overlay, .menu, .iblatt, #r-blatt';
    const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const PILL_INSET = 20;
    const GAP = 8;
    /** So lange ignoriert die rote Pille einen Zeiger nach dem Öffnen (Doppelklick). */
    const SETTLE_IN = 400;
    /** Bis hierhin fliesst es beim Öffnen (Filter an); die Feder hat dann < 0,5 % Rest. */
    const FLOW_IN = 700;
    /** Und beim Schliessen. */
    const FLOW_OUT = 480;
    const GOO_ID = 'ru-loesch-goo';
    const SVG = 'http://www.w3.org/2000/svg';
    let current = null;
    /** Der eine Druck, der durch darf: der von der roten Pille ausgelöste. */
    let passing = null;
    let started = false;
    let serial = 0;
    const calm = () => {
        if (typeof AppEinstellung !== 'undefined')
            return AppEinstellung.wenigBewegung();
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        catch {
            return false;
        }
    };
    const make = (tag, cls) => {
        const el = document.createElement(tag);
        el.className = cls;
        return el;
    };
    /** Der Klebefilter, einmal je Dokument. */
    const ensureFilter = () => {
        if (document.getElementById(GOO_ID))
            return;
        const svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('class', 'ru-loesch-defs');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const filter = document.createElementNS(SVG, 'filter');
        for (const [k, v] of [['id', GOO_ID], ['x', '-10%'], ['y', '-25%'], ['width', '120%'],
            ['height', '150%'], ['color-interpolation-filters', 'sRGB']])
            filter.setAttribute(k, v);
        const part = (tag, attrs) => {
            const n = document.createElementNS(SVG, tag);
            for (const [k, v] of attrs)
                n.setAttribute(k, v);
            filter.appendChild(n);
        };
        /* Unschärfe, dann Alpha-Schwelle × 18 − 7: näher als ~6 px verschmilzt. */
        part('feGaussianBlur', [['in', 'SourceGraphic'], ['stdDeviation', '4'], ['result', 'blur']]);
        part('feColorMatrix', [['in', 'blur'], ['type', 'matrix'],
            ['values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7'], ['result', 'goo']]);
        part('feDropShadow', [['class', 'ru-loesch-kante'], ['in', 'goo'], ['dx', '0'], ['dy', '0'],
            ['stdDeviation', '0.5'], ['result', 'kante']]);
        part('feDropShadow', [['class', 'ru-loesch-schatten'], ['in', 'kante'], ['dx', '0'], ['dy', '2'],
            ['stdDeviation', '3']]);
        svg.appendChild(filter);
        document.body.appendChild(svg);
    };
    /** Was der Knopf löscht, für Vorleser: sein aria-label, sonst sein title. */
    const nameOf = (t) => (t.getAttribute('aria-label') || t.getAttribute('title') || '').trim();
    const choice = (cls, word) => {
        const button = make('button', 'ru-loesch-wahl ' + cls);
        button.type = 'button';
        const face = make('span', 'ru-loesch-gesicht');
        const text = make('span', 'ru-loesch-wort');
        text.textContent = word;
        const smear = make('span', 'ru-loesch-wort ru-loesch-schmier');
        smear.textContent = word;
        smear.setAttribute('aria-hidden', 'true');
        face.append(text, smear);
        button.appendChild(face);
        return { button, text };
    };
    /** Die Kante, die das Paar abschneiden würde (Überlauf, sonst Fenster). */
    const clipOf = (el) => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const ox = getComputedStyle(a).overflowX;
            if (ox !== 'visible') {
                const r = a.getBoundingClientRect();
                return { left: Math.max(0, r.left), right: Math.min(window.innerWidth, r.right) };
            }
        }
        return { left: 0, right: window.innerWidth };
    };
    const build = (trigger) => {
        const word = (trigger.dataset['loeschknopf'] || '').trim() || 'Löschen';
        const context = nameOf(trigger);
        const layer = make('span', 'ru-loesch');
        const goo = make('span', 'ru-loesch-goo');
        goo.setAttribute('aria-hidden', 'true');
        for (const k of ['a', 'b']) {
            const blob = make('span', 'ru-loesch-blob ru-loesch-blob-' + k);
            blob.append(make('span', 'ru-loesch-stueck'), make('span', 'ru-loesch-stueck ru-loesch-mitte'), make('span', 'ru-loesch-stueck ru-loesch-ende'));
            goo.appendChild(blob);
        }
        const icon = make('span', 'ru-loesch-zeichen');
        icon.setAttribute('aria-hidden', 'true');
        icon.append(make('span', 'ru-loesch-glyphe'), make('span', 'ru-loesch-glyphe ru-loesch-glyphe-schmier'));
        const pair = make('span', 'ru-loesch-paar');
        pair.id = 'ru-loesch-paar-' + (++serial);
        pair.setAttribute('role', 'group');
        pair.setAttribute('aria-label', context ? word + ': ' + context : word);
        const ja = choice('ru-loesch-ja', word);
        const nein = choice('ru-loesch-nein', 'Abbrechen');
        if (context && context !== word)
            ja.button.setAttribute('aria-label', word + ': ' + context);
        layer.append(goo, icon, pair);
        return { layer, pair, confirm: ja.button, cancel: nein.button };
    };
    /** Breiten, Richtung und Ort — gemessen, nicht angenommen. */
    const place = (o, confirm, cancel) => {
        /* Erst hinein, dann messen: ein losgelöster Knopf misst 0 px — so lief
           „Endgültig löschen" über seine Pille hinaus (im Bild gesehen). */
        if (!confirm.isConnected)
            o.pair.append(confirm, cancel);
        const r = o.trigger.getBoundingClientRect();
        /* Pillen nie unter 44 px (§37), auch aus einem kleineren Kreis. */
        const size = Math.max(touchMin(), Math.round(r.height));
        const pill = (btn) => {
            const w = btn.querySelector('.ru-loesch-wort')?.offsetWidth ?? 0;
            return Math.max(2 * size, Math.ceil(w + 2 * PILL_INSET));
        };
        const a = pill(confirm);
        const b = pill(cancel);
        const total = a + GAP + b;
        const clip = clipOf(o.trigger);
        const roomEnd = clip.right - (r.left + r.width / 2 - size / 2);
        const roomStart = (r.left + r.width / 2 + size / 2) - clip.left;
        const toStart = roomEnd < total && roomStart > roomEnd;
        o.layer.dataset['richtung'] = toStart ? 'start' : 'ende';
        /* Die Tab-Reihenfolge folgt dem Bild: die rote Pille liegt, wo der Kreis war. */
        if (toStart)
            o.pair.append(cancel, confirm);
        else
            o.pair.append(confirm, cancel);
        const s = o.layer.style;
        s.setProperty('--loesch-s', size + 'px');
        s.setProperty('--loesch-a', a + 'px');
        s.setProperty('--loesch-b', b + 'px');
        s.setProperty('--loesch-gap', GAP + 'px');
        s.left = '0px';
        s.top = '0px';
        const zero = o.layer.getBoundingClientRect();
        /* Der Kreis der Flüssigkeit sitzt mittig auf dem Knopf. */
        const cx = r.left + r.width / 2;
        s.left = Math.round((toStart ? cx + size / 2 - total : cx - size / 2) - zero.left) + 'px';
        s.top = Math.round(r.top + (r.height - size) / 2 - zero.top) + 'px';
    };
    /** `--touch-min` in px, gelesen, nicht angenommen (Rückfall 44). */
    const touchMin = () => {
        try {
            const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--touch-min'));
            return Number.isFinite(v) && v > 0 ? v : 44;
        }
        catch {
            return 44;
        }
    };
    /** Was ganz unter dem Paar liegt, tritt zurück (sonst schaut es durch die Lücke). */
    const hideUnder = (o) => {
        const p = o.layer.getBoundingClientRect();
        for (const el of Array.from(o.trigger.parentElement?.children ?? [])) {
            if (el === o.trigger || el === o.layer || !(el instanceof HTMLElement))
                continue;
            const r = el.getBoundingClientRect();
            const x = Math.min(r.right, p.right) - Math.max(r.left, p.left);
            const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
            if (r.width > 0 && x >= 0.9 * r.width && y > 0) {
                el.setAttribute('data-loesch-unter', '');
                o.under.push(el);
            }
        }
    };
    const showUnder = (o) => {
        for (const el of o.under)
            el.removeAttribute('data-loesch-unter');
        o.under = [];
    };
    const alive = (o) => !!o && o.layer.isConnected;
    const finish = (o) => {
        window.clearTimeout(o.timer);
        window.clearInterval(o.watch);
        o.layer.remove();
        showUnder(o);
        o.trigger.removeAttribute('data-loesch-offen');
        o.trigger.setAttribute('aria-expanded', 'false');
        if (current === o)
            current = null;
    };
    /** Fokus zurück an den Knopf, sonst an seine Zeile (Papierkorb: `<span>`). */
    const focusBack = (trigger) => {
        const target = trigger.matches(FOCUSABLE) ? trigger : trigger.closest(FOCUSABLE);
        target?.focus({ preventScroll: true });
    };
    /** Zu. `returnFocus`: der Fokus geht an den runden Knopf zurück. */
    const close = (returnFocus) => {
        const o = current;
        if (!o)
            return;
        current = null;
        window.clearTimeout(o.timer);
        window.clearInterval(o.watch);
        o.trigger.setAttribute('aria-expanded', 'false');
        if (!alive(o)) {
            finish(o);
            return;
        }
        showUnder(o);
        o.pair.setAttribute('inert', '');
        if (returnFocus && o.trigger.isConnected)
            focusBack(o.trigger);
        if (calm() || !o.trigger.isConnected) {
            /* Ohne Bewegung, oder der Knopf ist mit seiner Zeile schon weg. */
            o.layer.dataset['geht'] = '';
            o.timer = window.setTimeout(() => finish(o), o.trigger.isConnected ? 160 : 140);
            delete o.layer.dataset['auf'];
            return;
        }
        o.layer.dataset['fliesst'] = '';
        o.layer.dataset['zurueck'] = '';
        /* Ein Bild mit Filter an, DANN zurück — sonst springt der Übergang. */
        void o.layer.offsetWidth;
        delete o.layer.dataset['auf'];
        o.timer = window.setTimeout(() => finish(o), FLOW_OUT);
    };
    /** Nach dem Löschen bleibt der Fokus in der Liste (nächste Zeile, sonst die davor). */
    const keepFocus = (trigger) => {
        const chain = [];
        let list = null;
        let index = -1;
        for (let a = trigger.parentElement; a && a !== document.body; a = a.parentElement) {
            chain.push(a);
            if (list)
                continue;
            const marks = Array.from(a.querySelectorAll(MARK));
            if (marks.length > 1) {
                list = a;
                index = marks.indexOf(trigger);
            }
        }
        if (!list || index < 0)
            return;
        const fix = () => {
            const active = document.activeElement;
            if (active && active !== document.body && active.isConnected)
                return;
            const root = chain.find(a => a.isConnected);
            if (!root)
                return;
            const marks = Array.from(root.querySelectorAll(MARK));
            if (!marks.length)
                return;
            marks[Math.min(index, marks.length - 1)]?.focus({ preventScroll: true });
        };
        for (const ms of [0, 60, 200, 500, 1000])
            window.setTimeout(fix, ms);
    };
    const open = (trigger, byPointer) => {
        close(false);
        const { layer, pair, confirm, cancel } = build(trigger);
        const carrier = trigger.closest(CARRIER) ?? document.body;
        const o = { trigger, layer, pair, armedUntil: 0, timer: 0, watch: 0, under: [] };
        const reduced = calm();
        if (reduced)
            layer.dataset['ruhig'] = '';
        else {
            ensureFilter();
            layer.dataset['fliesst'] = '';
        }
        carrier.appendChild(layer);
        place(o, confirm, cancel);
        hideUnder(o);
        trigger.setAttribute('data-loesch-offen', '');
        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('aria-controls', pair.id);
        o.armedUntil = byPointer ? performance.now() + SETTLE_IN : 0;
        if (byPointer)
            layer.dataset['setzt'] = '';
        current = o;
        void layer.offsetWidth;
        layer.dataset['auf'] = '';
        cancel.focus({ preventScroll: true });
        o.timer = window.setTimeout(() => {
            delete layer.dataset['fliesst'];
            delete layer.dataset['setzt'];
        }, reduced ? 0 : FLOW_IN);
        /* Verschwindet der Knopf (die Liste zeichnet sich neu), geht das Paar mit. */
        o.watch = window.setInterval(() => {
            if (!trigger.isConnected || !layer.isConnected)
                close(false);
        }, 250);
    };
    const confirmNow = (o) => {
        if (performance.now() < o.armedUntil)
            return;
        const trigger = o.trigger;
        keepFocus(trigger);
        close(true);
        passing = trigger;
        try {
            trigger.click();
        }
        finally {
            passing = null;
        }
    };
    const onClick = (e) => {
        const target = e.target instanceof Element ? e.target : null;
        if (!target)
            return;
        const o = current;
        if (o && alive(o) && o.layer.contains(target)) {
            /* Die Pillen gehören niemandem sonst: kein Griff der Stelle sieht sie. */
            e.stopPropagation();
            e.preventDefault();
            const btn = target.closest('.ru-loesch-wahl');
            if (!btn)
                return;
            if (btn.classList.contains('ru-loesch-ja'))
                confirmNow(o);
            else
                close(true);
            return;
        }
        const trigger = target.closest(MARK);
        if (!trigger || trigger === passing)
            return;
        if (trigger.disabled || trigger.getAttribute('aria-disabled') === 'true')
            return;
        e.stopPropagation();
        e.preventDefault();
        if (o && o.trigger === trigger && alive(o)) {
            close(false);
            return;
        }
        open(trigger, e.detail > 0);
    };
    const onKey = (e) => {
        const o = current;
        if (!o)
            return;
        if (!alive(o)) {
            finish(o);
            return;
        }
        if (e.key !== 'Escape')
            return;
        /* Behandelt: der gemeinsame Escape-Griff (schale.ts, E302) schliesst
           sonst das Fenster darunter gleich mit — eine Taste, ein Schritt. */
        e.preventDefault();
        e.stopPropagation();
        close(true);
    };
    const onPointerDown = (e) => {
        const o = current;
        if (!o)
            return;
        const t = e.target instanceof Node ? e.target : null;
        if (t && (o.layer.contains(t) || o.trigger.contains(t)))
            return;
        close(false);
    };
    const onFocusOut = (e) => {
        const o = current;
        if (!o || !(e.target instanceof Node) || !o.pair.contains(e.target))
            return;
        const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
        if (to && !o.pair.contains(to))
            close(false);
    };
    const onScroll = (e) => {
        const o = current;
        if (!o)
            return;
        const t = e.target;
        if (t === document || (t instanceof Node && t.contains(o.trigger)))
            close(false);
    };
    /** Das Zeichen des Kreises kommt aus `Register.symbole` — kein zweites Bild. */
    const glyph = () => {
        if (typeof Register === 'undefined' || !Register.symbole?.alsSvg)
            return;
        const svg = Register.symbole.alsSvg('trash', 24)
            .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
            .replace(/currentColor/g, '#000');
        document.documentElement.style.setProperty('--loesch-zeichen', 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
    };
    const start = () => {
        if (started)
            return;
        started = true;
        glyph();
        window.addEventListener('click', onClick, true);
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('pointerdown', onPointerDown, true);
        window.addEventListener('focusout', onFocusOut, true);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', () => close(false));
    };
    /** Für Prüfungen: ist gerade ein Paar offen? */
    const isOpen = () => alive(current);
    return { start, close, isOpen, MARK };
})();
