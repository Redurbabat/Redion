"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/einstellung/app.ts (npm run bauen:ts). */
const AppEinstellung = (() => {
    const FASSUNG = '2026.08.03';
    const NAME = 'Redion';
    const herkunft = () => {
        try {
            const p = location.protocol;
            if (p === 'file:')
                return 'festplatte';
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                return 'eigener-rechner';
            return 'netz';
        }
        catch {
            return 'unbekannt';
        }
    };
    const einzeldatei = () => {
        try {
            return herkunft() === 'festplatte' &&
                document.querySelectorAll('script[src]').length === 0;
        }
        catch {
            return false;
        }
    };
    const alsApp = () => {
        try {
            return window.matchMedia('(display-mode: standalone)').matches ||
                navigator.standalone === true;
        }
        catch {
            return false;
        }
    };
    const amTelefon = () => {
        try {
            const grenze = typeof KONSTANTEN !== 'undefined'
                ? KONSTANTEN.TELEFON_BREITE : 760;
            const grob = window.matchMedia?.('(pointer: coarse)').matches ||
                navigator.maxTouchPoints > 0;
            return window.innerWidth <= grenze || (grob && window.innerHeight <= 500);
        }
        catch {
            return false;
        }
    };
    const wenigBewegung = () => {
        try {
            return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true ||
                document.body?.dataset['bewegung'] === 'ruhig';
        }
        catch {
            return false;
        }
    };
    const viewportAktualisieren = () => {
        try {
            const vv = window.visualViewport;
            const hoehe = vv?.height ?? window.innerHeight;
            const unten = vv
                ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
                : 0;
            const wurzel = document.documentElement;
            wurzel.style.setProperty('--vh', (hoehe * 0.01) + 'px');
            wurzel.style.setProperty('--visual-height', hoehe + 'px');
            wurzel.style.setProperty('--visual-bottom', unten + 'px');
            document.body?.classList.toggle('tastatur-offen', unten > 80);
        }
        catch { }
    };
    const viewportStart = () => {
        viewportAktualisieren();
        window.addEventListener('resize', viewportAktualisieren, { passive: true });
        window.addEventListener('orientationchange', () => setTimeout(viewportAktualisieren, 250), { passive: true });
        window.visualViewport?.addEventListener('resize', viewportAktualisieren, { passive: true });
        window.visualViewport?.addEventListener('scroll', viewportAktualisieren, { passive: true });
    };
    const kann = () => {
        const p = (fn) => { try {
            return !!fn();
        }
        catch {
            return false;
        } };
        return {
            speicher: p(() => self.indexedDB),
            dateien: p(() => window.File && window.FileReader && window.Blob),
            zwischenlage: p(() => (navigator.clipboard && navigator.clipboard.writeText) ||
                (typeof document.execCommand === 'function')),
            arbeiter: p(() => 'serviceWorker' in navigator),
            krypto: p(() => self.crypto && crypto.subtle),
            netz: p(() => navigator.onLine),
            benachrichten: p(() => 'Notification' in window),
            teilen: p(() => navigator.share),
            sprache: p(() => navigator.language) ? navigator.language : 'de'
        };
    };
    const steckbrief = () => {
        const k = kann();
        return [
            NAME + ' ' + FASSUNG,
            'läuft: ' + herkunft() + (einzeldatei() ? ' (Einzeldatei)' : '') + (alsApp() ? ' (als App)' : ''),
            'Ablage: ' + (typeof Umzuege !== 'undefined' ? 'Fassung ' + Umzuege.JETZIGE : '?'),
            'Speicher: ' + (k.speicher ? 'ja' : 'nein') +
                ' · Krypto: ' + (k.krypto ? 'ja' : 'nein') +
                ' · Netz: ' + (k.netz ? 'ja' : 'nein'),
            'Fenster: ' + (() => { try {
                return innerWidth + '×' + innerHeight;
            }
            catch {
                return '?';
            } })()
        ].join('\n');
    };
    const platz = async () => {
        try {
            if (!navigator.storage || !navigator.storage.estimate)
                return null;
            const e = await navigator.storage.estimate();
            const benutzt = e.usage ?? 0;
            const platzGesamt = e.quota ?? 0;
            return { benutzt, frei: platzGesamt - benutzt,
                anteil: platzGesamt ? benutzt / platzGesamt : 0 };
        }
        catch {
            return null;
        }
    };
    const speicherSichern = async () => {
        try {
            if (!navigator.storage || !navigator.storage.persist)
                return false;
            if (await navigator.storage.persisted())
                return true;
            return await navigator.storage.persist();
        }
        catch {
            return false;
        }
    };
    return { NAME, FASSUNG, herkunft, einzeldatei, alsApp, amTelefon, wenigBewegung,
        viewportAktualisieren, viewportStart,
        kann, steckbrief, platz, speicherSichern };
})();
window.AppEinstellung = AppEinstellung;
AppEinstellung.viewportStart();
