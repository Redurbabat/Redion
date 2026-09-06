"use strict";
/* Redion Studio: shortcuts into existing controllers; no content storage. */
const StudioSchale = (() => {
    let gestartet = false;
    const META = 'studio:navigation-kompakt';
    const BREITE = 'studio:navigation-breite';
    const breiteSetzen = (wert) => {
        const breite = Math.max(148, Math.min(260, Math.round(wert)));
        document.body.style.setProperty('--studio-nav-expanded', breite + 'px');
        document.getElementById('studio-divider')?.setAttribute('aria-valuenow', String(breite));
        return breite;
    };
    const themaMarkieren = () => {
        const hell = document.documentElement.dataset.theme === 'light';
        const b = document.getElementById('studio-theme');
        b?.setAttribute('aria-label', hell ? 'Dunkles Farbschema einschalten' : 'Helles Farbschema einschalten');
        if (b)
            b.title = hell ? 'Dunkles Farbschema' : 'Helles Farbschema';
    };
    const einstellen = (kompakt) => {
        document.body.dataset.studioNav = kompakt ? 'kompakt' : 'offen';
        const knopf = document.getElementById('studio-nav');
        knopf?.setAttribute('aria-pressed', String(kompakt));
        const name = kompakt ? 'Navigation mit Beschriftungen anzeigen' : 'Navigation kompakt anzeigen';
        knopf?.setAttribute('aria-label', name);
        if (knopf)
            knopf.title = name;
    };
    const markieren = () => {
        const wo = App.schauplatz();
        for (const [id, aktiv] of [['studio-documents', wo === 'bibliothek'],
            ['studio-notebooks', wo === 'notizhefte']]) {
            const b = document.getElementById(id);
            if (aktiv)
                b?.setAttribute('aria-current', 'page');
            else
                b?.removeAttribute('aria-current');
        }
    };
    const start = () => {
        if (gestartet)
            return;
        gestartet = true;
        einstellen(Store.getMeta(META, false) === true);
        const gespeichert = Number(Store.getMeta(BREITE, 184));
        breiteSetzen(Number.isFinite(gespeichert) ? gespeichert : 184);
        const an = (id, tun) => {
            document.getElementById(id)?.addEventListener('click', tun);
        };
        an('studio-home', () => Bibliothek.oeffne());
        an('studio-documents', () => Bibliothek.oeffne());
        an('studio-notebooks', () => Notebook.oeffnen());
        an('studio-search', () => App.suche());
        an('studio-create', () => App.erstellenBlatt());
        an('studio-import', () => Bibliothek.pdfImportieren());
        an('studio-theme', () => {
            Einstellungen.S('theme', document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
            themaMarkieren();
        });
        new MutationObserver(themaMarkieren).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        themaMarkieren();
        const divider = document.getElementById('studio-divider');
        let ziehen = null;
        const jetztBreite = () => Number(divider?.getAttribute('aria-valuenow')) || 184;
        const merken = () => { Store.setMeta(BREITE, jetztBreite()); Kontextkante.zeichne(); };
        divider?.addEventListener('pointerdown', event => {
            if (event.button !== 0)
                return;
            ziehen = { id: event.pointerId, x: event.clientX, breite: jetztBreite() };
            divider.setPointerCapture(event.pointerId);
            event.preventDefault();
            document.body.classList.add('studio-resizing');
        });
        divider?.addEventListener('pointermove', event => {
            if (ziehen?.id === event.pointerId)
                breiteSetzen(ziehen.breite + event.clientX - ziehen.x);
        });
        const ende = (event) => {
            if (ziehen?.id !== event.pointerId)
                return;
            if (event.type === 'pointercancel')
                breiteSetzen(ziehen.breite);
            ziehen = null;
            document.body.classList.remove('studio-resizing');
            merken();
        };
        divider?.addEventListener('pointerup', ende);
        divider?.addEventListener('pointercancel', ende);
        divider?.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
                return;
            event.preventDefault();
            breiteSetzen(event.key === 'Home' ? 148 : event.key === 'End' ? 260 : jetztBreite() + (event.key === 'ArrowRight' ? 8 : -8));
            merken();
        });
        an('studio-nav', () => {
            const kompakt = document.body.dataset.studioNav !== 'kompakt';
            einstellen(kompakt);
            Store.setMeta(META, kompakt);
            Kontextkante.zeichne();
        });
        const bar = document.getElementById('studio-bar');
        if (bar)
            Register.symbole.fuelle(bar);
        window.addEventListener('redion:schauplatz', markieren);
        window.addEventListener('hashchange', markieren);
        markieren();
    };
    return { start };
})();
