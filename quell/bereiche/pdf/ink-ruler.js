"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/ink-ruler.ts (npm run bauen:ts). */
const InkRuler = (() => {
    const create = (surface, width, height) => {
        const ns = 'http://www.w3.org/2000/svg';
        const group = document.createElementNS(ns, 'g');
        group.classList.add('blatt-ruler');
        group.dataset.inkUi = 'ruler';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Lineal: ziehen zum Verschieben. Pfeiltasten verschieben, Umschalt und Pfeiltasten drehen.');
        group.setAttribute('tabindex', '0');
        group.setAttribute('pointer-events', 'none');
        let active = false, x = width / 2, y = Math.min(height * .4, width * .65), angle = 0;
        let edge = null;
        const half = width * .45, depth = 64;
        const make = (tag, attrs) => {
            const node = document.createElementNS(ns, tag);
            Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
            group.append(node);
            return node;
        };
        make('rect', { x: -half, y: 0, width: half * 2, height: depth, rx: 3, class: 'blatt-ruler-glass' });
        const mm = 72 / 25.4;
        let ticks = '';
        for (let i = -Math.floor(half / mm); i <= half / mm; i++) {
            const length = i % 10 === 0 ? 15 : i % 5 === 0 ? 10 : 6;
            ticks += `M${i * mm} 0v${length}M${i * mm} ${depth}v${-length}`;
            if (i % 10 === 0) {
                const label = make('text', { x: i * mm, y: 26, 'text-anchor': 'middle', 'font-size': 9 });
                label.textContent = String(Math.abs(i / 10));
            }
        }
        make('path', { d: ticks, class: 'blatt-ruler-ticks' });
        const caption = make('text', { x: 0, y: 44, 'text-anchor': 'middle', 'font-size': 8 });
        const render = () => {
            group.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);
            caption.textContent = `cm · ${angle}° · ziehen / drehen`;
        };
        const rotate = make('g', { role: 'button', tabindex: '0', 'aria-label': 'Lineal um 15 Grad drehen', class: 'blatt-ruler-rotate' });
        rotate.setAttribute('pointer-events', 'auto');
        const griffY = depth + 12;
        const turn = document.createElementNS(ns, 'circle');
        turn.setAttribute('cx', String(Math.min(half - 30, width * .33)));
        turn.setAttribute('cy', String(griffY + 16));
        turn.setAttribute('r', '20');
        rotate.append(turn);
        const arrow = document.createElementNS(ns, 'text');
        arrow.setAttribute('x', turn.getAttribute('cx'));
        arrow.setAttribute('y', String(griffY + 22));
        arrow.setAttribute('text-anchor', 'middle');
        arrow.textContent = '↻';
        rotate.append(arrow);
        rotate.addEventListener('click', event => { event.stopPropagation(); angle = (angle + 15) % 180; render(); });
        rotate.addEventListener('keydown', event => { const key = event.key; if (key === 'Enter' || key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            angle = (angle + 15) % 180;
            render();
        } });
        const grip = make('g', { class: 'blatt-ruler-grip', role: 'button', tabindex: '0',
            'aria-label': 'Lineal verschieben. Pfeiltasten verschieben, Umschalt und Pfeiltasten drehen.' });
        grip.setAttribute('pointer-events', 'auto');
        const gripBody = document.createElementNS(ns, 'rect');
        for (const [key, value] of Object.entries({ x: -56, y: griffY, width: 112, height: 32, rx: 9 }))
            gripBody.setAttribute(key, String(value));
        grip.append(gripBody);
        const gripLines = document.createElementNS(ns, 'path');
        gripLines.setAttribute('class', 'blatt-ruler-grip-lines');
        gripLines.setAttribute('d', `M-16 ${griffY + 9}v14M0 ${griffY + 9}v14M16 ${griffY + 9}v14`);
        grip.append(gripLines);
        const local = (event) => {
            const matrix = surface.getScreenCTM();
            if (!matrix)
                return null;
            const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
            return [point.x, point.y];
        };
        let drag = null;
        grip.addEventListener('pointerdown', event => {
            const e = event;
            if (e.button !== 0)
                return;
            const point = local(e);
            if (!point)
                return;
            event.stopPropagation();
            event.preventDefault();
            grip.focus();
            drag = { id: e.pointerId, x, y, start: point };
            grip.setPointerCapture(e.pointerId);
        });
        grip.addEventListener('pointermove', event => {
            const e = event;
            if (!drag || drag.id !== e.pointerId)
                return;
            event.stopPropagation();
            const point = local(e);
            if (!point)
                return;
            x = Math.max(0, Math.min(width, drag.x + point[0] - drag.start[0]));
            y = Math.max(0, Math.min(height - depth - 46, drag.y + point[1] - drag.start[1]));
            render();
        });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            grip.addEventListener(name, event => { if (drag)
                event.stopPropagation(); drag = null; });
        }
        grip.addEventListener('click', event => event.stopPropagation());
        grip.addEventListener('keydown', event => {
            const e = event;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key))
                return;
            event.preventDefault();
            event.stopPropagation();
            const sign = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
            if (e.shiftKey)
                angle = (angle + sign * 15 + 360) % 360;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
                x = Math.max(0, Math.min(width, x + sign * 5));
            else
                y = Math.max(0, Math.min(height - depth - 46, y + sign * 5));
            render();
        });
        const coordinates = (point) => {
            const a = angle * Math.PI / 180, dx = point[0] - x, dy = point[1] - y;
            return [dx * Math.cos(a) + dy * Math.sin(a), -dx * Math.sin(a) + dy * Math.cos(a)];
        };
        const project = (point) => {
            if (edge === null)
                return [point[0], point[1]];
            const u = coordinates(point)[0], a = angle * Math.PI / 180;
            return [x + u * Math.cos(a) - edge * Math.sin(a), y + u * Math.sin(a) + edge * Math.cos(a)];
        };
        const rollkasten = () => {
            let e = surface.parentElement;
            while (e && e !== document.documentElement) {
                const st = getComputedStyle(e);
                if (/(auto|scroll)/.test(st.overflowY + ' ' + st.overflowX))
                    return e;
                e = e.parentElement;
            }
            return null;
        };
        const sichtbareMitte = () => {
            const sr = surface.getBoundingClientRect();
            if (!sr.width || !sr.height)
                return null;
            const k = rollkasten()?.getBoundingClientRect();
            const links = Math.max(sr.left, k ? k.left : 0);
            const rechts = Math.min(sr.right, k ? k.right : window.innerWidth);
            const oben = Math.max(sr.top, k ? k.top : 0);
            const unten = Math.min(sr.bottom, k ? k.bottom : window.innerHeight);
            if (rechts - links < 80 || unten - oben < 80)
                return null;
            return [((links + rechts) / 2 - sr.left) / sr.width * width,
                ((oben + unten) / 2 - sr.top) / sr.height * height];
        };
        const insBild = () => {
            if (drag)
                return;
            const k = rollkasten()?.getBoundingClientRect();
            const links = k ? k.left : 0;
            const rechts = k ? k.right : window.innerWidth;
            const oben = k ? k.top : 0;
            const unten = k ? k.bottom : window.innerHeight;
            const gr = turn.getBoundingClientRect();
            if (gr.width && gr.left >= links && gr.right <= rechts
                && gr.top >= oben && gr.bottom <= unten)
                return;
            const ziel = sichtbareMitte();
            if (!ziel)
                return;
            x = Math.max(0, Math.min(width, ziel[0]));
            y = Math.max(0, Math.min(height - depth - 46, ziel[1] - depth / 2));
            render();
        };
        try {
            new ResizeObserver(() => { if (active)
                insBild(); }).observe(surface);
        }
        catch { }
        return {
            setActive(value) {
                active = value;
                edge = null;
                if (active) {
                    surface.append(group);
                    render();
                    insBild();
                }
                else
                    group.remove();
            },
            remount() { if (active && group.parentNode !== surface) {
                surface.append(group);
                render();
            } },
            active: () => active,
            begin(point, allowed) {
                edge = null;
                if (active && allowed) {
                    const [u, v] = coordinates(point);
                    if (Math.abs(u) < half + 12) {
                        if (Math.abs(v) < 14)
                            edge = 0;
                        else if (Math.abs(v - depth) < 14)
                            edge = depth;
                    }
                }
                return project(point);
            },
            project,
            end() { edge = null; },
            constrained: () => edge !== null
        };
    };
    return { create };
})();
