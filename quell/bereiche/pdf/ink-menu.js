"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/ink-menu.ts (npm run bauen:ts). */
const InkMenu = (() => {
    let offen = null;
    const closeAll = (grund = 'weg') => {
        offen?.ende(grund);
        document.querySelectorAll('.blatt-popover').forEach(node => {
            try {
                node.hidePopover?.();
            }
            catch { }
            node.remove();
        });
    };
    const open = (anchor, title, build, onClose) => {
        closeAll('weg');
        const panel = document.createElement('div');
        panel.className = 'blatt-popover';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', title);
        const heading = document.createElement('header');
        const label = document.createElement('strong');
        label.textContent = title;
        const exit = document.createElement('button');
        exit.type = 'button';
        exit.textContent = '×';
        exit.setAttribute('aria-label', title + ' schließen');
        heading.append(label, exit);
        panel.append(heading);
        const body = document.createElement('div');
        body.className = 'blatt-popover-body';
        panel.append(body);
        const nativ = typeof panel.showPopover === 'function' && typeof panel.hidePopover === 'function';
        if (nativ)
            panel.setAttribute('popover', 'auto');
        else
            panel.classList.add('blatt-popover-ersatz');
        let fertig = false;
        let grund = 'aussen';
        const close = () => { grund = 'knopf'; ende('knopf'); };
        exit.onclick = close;
        build(body, close);
        const position = () => {
            const rect = anchor.getBoundingClientRect();
            const width = Math.min(380, window.innerWidth - 24);
            panel.style.width = width + 'px';
            panel.style.left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2)) + 'px';
            const above = rect.top > window.innerHeight / 2;
            panel.style.top = above ? 'auto' : Math.max(12, Math.min(rect.bottom + 12, window.innerHeight - 150)) + 'px';
            panel.style.bottom = above ? Math.max(12, window.innerHeight - rect.top + 12) + 'px' : 'auto';
            panel.style.maxHeight = Math.max(100, (above ? rect.top : window.innerHeight - rect.bottom) - 24) + 'px';
        };
        const wache = new MutationObserver(() => { if (!anchor.isConnected)
            ende('weg'); });
        const draussen = (event) => {
            if (!panel.contains(event.target) && event.target !== anchor)
                ende('aussen');
        };
        const taste = (event) => {
            if (event.key !== 'Escape')
                return;
            event.preventDefault();
            ende('escape');
        };
        const merkeEscape = (event) => { if (event.key === 'Escape')
            grund = 'escape'; };
        function ende(warum) {
            if (fertig)
                return;
            fertig = true;
            grund = warum;
            wache.disconnect();
            window.removeEventListener('resize', position);
            document.removeEventListener('keydown', taste, true);
            document.removeEventListener('pointerdown', draussen, true);
            panel.removeEventListener('keydown', merkeEscape);
            if (nativ) {
                try {
                    panel.hidePopover();
                }
                catch { }
            }
            panel.remove();
            offen = null;
            if (anchor.isConnected) {
                anchor.setAttribute('aria-expanded', 'false');
                if (warum === 'escape' || warum === 'knopf')
                    anchor.focus({ preventScroll: true });
            }
            onClose?.(warum);
        }
        document.body.append(panel);
        position();
        anchor.setAttribute('aria-expanded', 'true');
        offen = { ende };
        if (nativ) {
            panel.addEventListener('keydown', merkeEscape);
            panel.addEventListener('toggle', event => {
                if (event.newState !== 'closed')
                    return;
                ende(grund);
            });
        }
        else {
            document.addEventListener('keydown', taste, true);
            setTimeout(() => { if (!fertig)
                document.addEventListener('pointerdown', draussen, true); }, 0);
        }
        window.addEventListener('resize', position);
        wache.observe(document.body, { childList: true, subtree: true });
        if (nativ)
            panel.showPopover();
        exit.focus({ preventScroll: true });
    };
    return { open, closeAll };
})();
