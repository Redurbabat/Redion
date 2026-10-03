"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/ai/abrechnung.ts (npm run bauen:ts). */
const KiAbrechnung = (() => {
    const WILL_ABRECHNUNG = ['groq', 'openrouter', 'gemini', 'openai'];
    const willAbrechnung = (anbieterId) => WILL_ABRECHNUNG.indexOf(String(anbieterId || '')) >= 0;
    const zahl = (w) => (typeof w === 'number' && Number.isFinite(w) && w >= 0) ? w : undefined;
    const ausEreignis = (d, istAnthropic) => {
        if (!d || typeof d !== 'object')
            return null;
        if (istAnthropic) {
            const start = d.message && d.message.usage;
            const ein = zahl(start && start.input_tokens);
            const aus = zahl((d.usage && d.usage.output_tokens) ??
                (start && start.output_tokens));
            if (ein === undefined && aus === undefined)
                return null;
            const erg = {};
            if (ein !== undefined)
                erg.ein = ein;
            if (aus !== undefined)
                erg.aus = aus;
            return erg;
        }
        const u = d.usage;
        if (!u || typeof u !== 'object')
            return null;
        const ein = zahl(u.prompt_tokens);
        const aus = zahl(u.completion_tokens);
        if (ein === undefined && aus === undefined)
            return null;
        const erg = {};
        if (ein !== undefined)
            erg.ein = ein;
        if (aus !== undefined)
            erg.aus = aus;
        return erg;
    };
    const zusammen = (bisher, neu) => {
        if (!bisher)
            return neu;
        if (!neu)
            return bisher;
        const erg = {};
        const ein = Math.max(bisher.ein ?? 0, neu.ein ?? 0);
        const aus = Math.max(bisher.aus ?? 0, neu.aus ?? 0);
        if (bisher.ein !== undefined || neu.ein !== undefined)
            erg.ein = ein;
        if (bisher.aus !== undefined || neu.aus !== undefined)
            erg.aus = aus;
        return erg;
    };
    const vollstaendig = (a) => !!a && a.ein !== undefined && a.aus !== undefined;
    const abweichung = (geschaetzt, gezaehlt) => {
        if (!Number.isFinite(geschaetzt) || !Number.isFinite(gezaehlt) || gezaehlt <= 0)
            return 0;
        return Math.round(((geschaetzt - gezaehlt) / gezaehlt) * 100);
    };
    const satz = (geschaetzt, gezaehlt) => {
        const p = abweichung(geschaetzt, gezaehlt);
        if (Math.abs(p) < 10)
            return '';
        return p > 0
            ? 'Die Schätzung lag ' + p + ' % zu hoch.'
            : 'Die Schätzung lag ' + (-p) + ' % zu niedrig.';
    };
    return { WILL_ABRECHNUNG, willAbrechnung, ausEreignis, zusammen,
        vollstaendig, abweichung, satz };
})();
window.KiAbrechnung = KiAbrechnung;
