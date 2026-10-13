"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/tab-shelf.ts (npm run bauen:ts). */
const TabShelf = (() => {
    const REACH = 24;
    const TICK_MS = 12;
    let bar = null;
    let shelf = null;
    let go = null;
    let mode = false;
    let tab = null;
    let targets = [];
    let items = [];
    let aimed = -1;
    let box = { left: 0, right: 0, top: 0 };
    let columns = [];
    let places = [];
    let marker = null;
    let barTop = 0;
    let barLeft = 0;
    let tabCols = [];
    let fade = null;
    let blende = null;
    const calm = () => typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung();
    const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const tabs = () => bar ? Array.from(bar.querySelectorAll(':scope > button[role="tab"]')) : [];
    const pill = () => bar?.querySelector('#ho-pille') ?? null;
    const label = (t) => (t.querySelector('b')?.textContent || t.getAttribute('title') || '').trim();
    const pillTo = (t) => {
        const p = pill();
        if (!p || typeof SelectionFlow === 'undefined')
            return;
        const ziel = t ?? bar?.querySelector(':scope > button[aria-selected="true"]') ?? null;
        const c = tabCols.find(x => x.tab === ziel);
        if (c && c.width)
            SelectionFlow.folge(p, c.left, true, false);
    };
    const markTab = (t) => {
        tabs().forEach(b => { if (b !== t)
            b.removeAttribute('data-anvisiert'); });
        if (t)
            t.setAttribute('data-anvisiert', '');
    };
    const targetsOf = (t) => {
        if (typeof Register === 'undefined' || !Register.navigation?.ziele)
            return [];
        return Register.navigation.ziele(t.dataset['ziele'] || '').filter(z => z && typeof z.tun === 'function');
    };
    const fill = (t, neu) => {
        if (!shelf)
            return;
        shelf.querySelectorAll(':scope > button').forEach(b => b.remove());
        items = neu.map((z, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.tabIndex = i === 0 ? 0 : -1;
            b.dataset['ziel'] = z.id;
            const zeichen = document.createElement('span');
            zeichen.className = 'ho-z';
            zeichen.dataset['sym'] = z.zeichen;
            zeichen.dataset['symGroesse'] = '19';
            zeichen.setAttribute('aria-hidden', 'true');
            const wort = document.createElement('b');
            wort.textContent = z.kurz ?? z.name;
            b.append(zeichen, wort);
            let hier = false;
            try {
                hier = typeof z.an === 'function' && !!z.an();
            }
            catch { }
            if (hier)
                b.setAttribute('aria-current', 'page');
            return b;
        });
        shelf.append(...items);
        try {
            Register.symbole?.fuelle?.(shelf);
        }
        catch { }
        targets = neu;
        tab = t;
        shelf.setAttribute('aria-label', 'Ziele in ' + label(t));
        tabs().forEach(b => b.setAttribute('aria-expanded', b === t ? 'true' : 'false'));
        aimed = -1;
    };
    const measure = () => {
        if (!shelf)
            return;
        const kante = box.left + shelf.clientLeft;
        places = items.map(b => ({ left: b.offsetLeft, top: b.offsetTop, width: b.offsetWidth, height: b.offsetHeight }));
        columns = places.map(q => ({ left: kante + q.left, right: kante + q.left + q.width }));
    };
    const aim = (i) => {
        if (!shelf)
            return;
        if (i === aimed)
            return;
        const war = aimed;
        aimed = i;
        const q = places[i];
        if (i < 0 || !q)
            shelf.setAttribute('data-marke-weg', '');
        else if (typeof SelectionFlow !== 'undefined') {
            if (war < 0 && marker)
                SelectionFlow.glide(marker, q, true);
            else
                SelectionFlow.highlight(shelf, items[i] ?? null, { still: true });
            shelf.removeAttribute('data-marke-weg');
        }
        items.forEach((b, k) => { if (k === i)
            b.setAttribute('data-anvisiert', '');
        else
            b.removeAttribute('data-anvisiert'); });
        if (i >= 0 && mode === 'finger') {
            try {
                if (typeof navigator.vibrate === 'function')
                    navigator.vibrate(TICK_MS);
            }
            catch { }
        }
    };
    const open = (t, wie, x = NaN, y = NaN) => {
        if (!bar || !shelf || !t.dataset['ziele'])
            return false;
        const rb = bar.getBoundingClientRect();
        if (!(rb.width > 0 && rb.height > 0))
            return false;
        const neu = targetsOf(t);
        if (!neu.length)
            return false;
        barTop = rb.top;
        barLeft = rb.left + bar.clientLeft - bar.scrollLeft;
        tabCols = tabs().map(b => ({ tab: b, left: b.offsetLeft, width: b.offsetWidth }));
        const anker = t.getBoundingClientRect();
        fade?.cancel();
        fade = null;
        shelf.getAnimations().forEach(a => a.cancel());
        shelf.removeAttribute('data-geht');
        fill(t, neu);
        shelf.hidden = false;
        mode = wie;
        if (calm())
            shelf.removeAttribute('data-lupe');
        else
            shelf.setAttribute('data-lupe', '');
        if (wie === 'finger') {
            bar.setAttribute('data-zielleiste', '');
            markTab(t);
        }
        const r = shelf.getBoundingClientRect();
        box = { left: r.left, right: r.right, top: r.top };
        measure();
        if (!calm() && typeof SelectionFlow !== 'undefined')
            SelectionFlow.growFrom(shelf, anker, { left: r.left, top: r.top, width: r.width, height: r.height });
        if (wie === 'finger') {
            pillTo(t);
            if (Number.isFinite(x))
                aim(itemAt(x, y));
        }
        return true;
    };
    const close = () => {
        if (!shelf || !bar)
            return;
        const war = mode;
        mode = false;
        aimed = -1;
        items.forEach(b => b.removeAttribute('data-anvisiert'));
        shelf.setAttribute('data-marke-weg', '');
        tabs().forEach(b => b.setAttribute('aria-expanded', 'false'));
        if (war === 'finger') {
            bar.removeAttribute('data-zielleiste');
            markTab(null);
        }
        window.removeEventListener('pointerdown', outside, true);
        if (shelf.hidden)
            return;
        if (calm()) {
            shelf.hidden = true;
            return;
        }
        if (!blende)
            blende = { dauer: parseFloat(token('--motion-fast')), kurve: token('--ease-standard') || 'ease' };
        if (!(blende.dauer > 2)) {
            shelf.hidden = true;
            return;
        }
        shelf.setAttribute('data-geht', '');
        const a = shelf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: blende.dauer, easing: blende.kurve });
        fade = a;
        a.finished.then(() => {
            if (fade !== a || !shelf)
                return;
            fade = null;
            shelf.hidden = true;
            shelf.removeAttribute('data-geht');
            a.cancel();
        }).catch(() => { });
    };
    const choose = (i) => {
        const z = targets[i];
        const t = tab;
        close();
        if (!z || !t)
            return;
        if (z.ort && go) {
            go(t, z.tun);
            return;
        }
        pillTo(null);
        try {
            z.tun();
        }
        catch (e) {
            console.error('[Zielleiste]', e);
        }
    };
    const tabAt = (x) => {
        let best = null, abstand = Infinity;
        for (const c of tabCols) {
            if (!c.width)
                continue;
            const d = Math.abs(barLeft + c.left + c.width / 2 - x);
            if (d < abstand) {
                abstand = d;
                best = c.tab;
            }
        }
        return best;
    };
    const itemAt = (x, y) => {
        if (y >= barTop || y < box.top - REACH || x < box.left || x > box.right)
            return -1;
        let best = -1, abstand = Infinity;
        columns.forEach((c, i) => {
            const d = x < c.left ? c.left - x : x > c.right ? x - c.right : 0;
            if (d < abstand) {
                abstand = d;
                best = i;
            }
        });
        return best;
    };
    const move = (x, y) => {
        if (mode !== 'finger')
            return;
        if (y >= barTop) {
            const t = tabAt(x);
            aim(-1);
            if (t && t !== tab && t.dataset['ziele']) {
                const neu = targetsOf(t);
                if (neu.length && shelf) {
                    fill(t, neu);
                    measure();
                    if (typeof SelectionFlow !== 'undefined')
                        SelectionFlow.stagger(shelf, items, items.map(b => (t.dataset['ziele'] || '') + ':' + (b.dataset['ziel'] || '')));
                }
            }
            markTab(t);
            pillTo(t);
            return;
        }
        const i = itemAt(x, y);
        aim(i);
        if (i >= 0) {
            markTab(tab);
            pillTo(tab);
        }
        else {
            markTab(null);
            pillTo(null);
        }
    };
    const up = (x, y) => {
        if (mode !== 'finger')
            return;
        if (y >= barTop) {
            const t = tabAt(x);
            close();
            pillTo(null);
            t?.click();
            return;
        }
        const i = itemAt(x, y);
        if (i >= 0) {
            choose(i);
            return;
        }
        close();
        pillTo(null);
    };
    const cancel = () => {
        if (!mode)
            return;
        close();
        pillTo(null);
    };
    const nimm = (k, _wie, x, y) => {
        if (!open(k, 'finger', x, y))
            return null;
        return { move, up, cancel };
    };
    const focusItem = (i) => {
        const n = items.length;
        if (!n)
            return;
        const k = ((i % n) + n) % n;
        items.forEach((b, j) => { b.tabIndex = j === k ? 0 : -1; });
        items[k]?.focus();
        aim(k);
    };
    const outside = (e) => {
        const ziel = e.target instanceof Node ? e.target : null;
        if (mode === 'keys' && shelf && ziel && !shelf.contains(ziel))
            close();
    };
    const onBarKey = (e) => {
        if (e.key !== 'ArrowUp' || mode)
            return;
        const t = e.target instanceof HTMLElement ? e.target.closest('button[role="tab"][data-ziele]') : null;
        if (!t || !bar?.contains(t))
            return;
        if (!open(t, 'keys'))
            return;
        e.preventDefault();
        window.addEventListener('pointerdown', outside, true);
        focusItem(0);
    };
    const onShelfKey = (e) => {
        if (mode !== 'keys')
            return;
        const jetzt = items.findIndex(b => b === document.activeElement);
        const t = tab;
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                focusItem(jetzt + 1);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                focusItem(jetzt - 1);
                break;
            case 'Home':
                focusItem(0);
                break;
            case 'End':
                focusItem(items.length - 1);
                break;
            case 'Enter':
            case ' ':
                if (jetzt >= 0)
                    choose(jetzt);
                break;
            case 'Escape':
                e.stopPropagation();
                close();
                t?.focus();
                break;
            case 'Tab':
                close();
                return;
            default: return;
        }
        e.preventDefault();
    };
    const attach = (o) => {
        if (!o.bar || shelf)
            return;
        bar = o.bar;
        go = o.go;
        const s = document.createElement('div');
        s.id = 'ho-ziele';
        s.className = 'ru-waechst';
        s.setAttribute('role', 'menu');
        s.setAttribute('aria-orientation', 'horizontal');
        s.hidden = true;
        s.addEventListener('keydown', onShelfKey);
        s.addEventListener('click', e => {
            if (mode !== 'keys')
                return;
            const b = e.target instanceof Element ? e.target.closest('#ho-ziele > button') : null;
            const i = b ? items.indexOf(b) : -1;
            if (i >= 0)
                choose(i);
        });
        s.addEventListener('focusout', e => {
            const nach = e.relatedTarget instanceof Node ? e.relatedTarget : null;
            if (mode === 'keys' && (!nach || !s.contains(nach)))
                close();
        });
        bar.after(s);
        shelf = s;
        if (typeof Linse !== 'undefined')
            Linse.sicherstellen();
        if (typeof SelectionFlow !== 'undefined') {
            marker = SelectionFlow.highlight(s, null, { still: true });
            marker.hidden = false;
            s.setAttribute('data-marke-weg', '');
        }
        for (const t of tabs()) {
            if (!t.dataset['ziele'])
                continue;
            t.setAttribute('aria-haspopup', 'menu');
            t.setAttribute('aria-controls', 'ho-ziele');
            t.setAttribute('aria-expanded', 'false');
        }
        bar.addEventListener('keydown', onBarKey);
    };
    return { attach, nimm, offen: () => !!mode };
})();
window.TabShelf = TabShelf;
