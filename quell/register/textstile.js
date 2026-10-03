"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/textstile.ts (npm run bauen:ts). */
const Textstile = (() => {
    const GROESSEN = [
        ['normal', 'Normal'],
        ['klein', 'Klein'],
        ['gross', 'Gross'],
        ['sehrgross', 'Sehr gross'],
        ['riesig', 'Riesig']
    ];
    const SCHRIFTEN = [
        ['standard', 'Standard'],
        ['serif', 'Serifen'],
        ['mono', 'Schreibmaschine'],
        ['hand', 'Handschrift'],
        ['schmal', 'Schmal']
    ];
    const kennungen = (liste) => liste.map(x => x[0]);
    const gueltigeGroesse = (wert) => kennungen(GROESSEN).includes(String(wert));
    const gueltigeSchrift = (wert) => kennungen(SCHRIFTEN).includes(String(wert));
    const klassen = (stil) => {
        const s = (stil || {});
        const raus = [];
        if (gueltigeGroesse(s.groesse) && s.groesse !== 'normal')
            raus.push('tg-' + s.groesse);
        if (gueltigeSchrift(s.schrift) && s.schrift !== 'standard')
            raus.push('ts-' + s.schrift);
        return raus;
    };
    return { GROESSEN, SCHRIFTEN, gueltigeGroesse, gueltigeSchrift, klassen };
})();
window.Textstile = Textstile;
