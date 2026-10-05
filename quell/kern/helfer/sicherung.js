"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/helfer/sicherung.ts (npm run bauen:ts). */
const Sicherung = (() => {
    const TAG = 86400000;
    const ERINNERN = 7;
    const WARNEN = 30;
    const meta = (name, standard) => {
        if (typeof Store === 'undefined' || typeof Store.getMeta !== 'function')
            return standard;
        try {
            return Store.getMeta(name, standard);
        }
        catch {
            return standard;
        }
    };
    const stand = () => {
        const wann = String(meta('sicherung:zuletzt', '') || '');
        const art = String(meta('sicherung:art', '') || '');
        const zeit = wann ? Date.parse(wann) : NaN;
        if (!wann || Number.isNaN(zeit))
            return { stufe: 'warnen', tage: null, art, wann: '' };
        const tage = Math.max(0, Math.floor((Date.now() - zeit) / TAG));
        const stufe = tage >= WARNEN ? 'warnen'
            : tage >= ERINNERN ? 'erinnern' : 'gut';
        return { stufe, tage, art, wann };
    };
    const merken = (art) => {
        if (typeof Store === 'undefined' || typeof Store.setMeta !== 'function')
            return;
        Store.setMeta('sicherung:zuletzt', new Date().toISOString());
        Store.setMeta('sicherung:art', art);
    };
    const papierkorb = () => {
        const tage = Number(meta('papierkorbTage', 30)) || 0;
        let weg = [];
        if (typeof Store !== 'undefined' && typeof Store.trashed === 'function') {
            try {
                weg = Store.trashed();
            }
            catch {
                weg = [];
            }
        }
        let naechste = null;
        if (tage) {
            for (const b of weg) {
                const t = Date.parse(String(b?.trashedAt || ''));
                if (Number.isNaN(t))
                    continue;
                const restTage = Math.max(0, Math.ceil((t + tage * TAG - Date.now()) / TAG));
                if (naechste === null || restTage < naechste)
                    naechste = restTage;
            }
        }
        return { anzahl: weg.length, tage, naechste };
    };
    const groesse = (bytes) => {
        if (!bytes || bytes < 0)
            return '0 B';
        if (bytes < 1024)
            return bytes + ' B';
        const einheiten = ['KB', 'MB', 'GB', 'TB'];
        let wert = bytes / 1024, i = 0;
        while (wert >= 1024 && i < einheiten.length - 1) {
            wert /= 1024;
            i++;
        }
        return (wert >= 10 ? Math.round(wert) : Math.round(wert * 10) / 10)
            .toLocaleString('de-CH') + ' ' + einheiten[i];
    };
    const platz = async () => {
        let anhaenge = 0;
        if (typeof Store !== 'undefined' && typeof Store.dateiAlle === 'function') {
            try {
                for (const d of await Store.dateiAlle())
                    anhaenge += Number(d?.groesse) || 0;
            }
            catch {
                anhaenge = 0;
            }
        }
        try {
            const schaetzung = await navigator.storage?.estimate?.();
            const belegt = Number(schaetzung?.usage) || 0;
            const gesamt = Number(schaetzung?.quota) || 0;
            if (!gesamt)
                return { belegt, frei: 0, gesamt: 0, anhaenge, bekannt: false };
            return { belegt, frei: Math.max(0, gesamt - belegt), gesamt, anhaenge, bekannt: true };
        }
        catch {
            return { belegt: 0, frei: 0, gesamt: 0, anhaenge, bekannt: false };
        }
    };
    return { stand, merken, papierkorb, platz, groesse, TAG, ERINNERN, WARNEN };
})();
window.Sicherung = Sicherung;
