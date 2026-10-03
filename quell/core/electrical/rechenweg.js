"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/electrical/rechenweg.ts (npm run bauen:ts). */
const Rechenweg = (() => {
    const zahl = (n) => {
        if (!Number.isFinite(n))
            return '—';
        const abs = Math.abs(n);
        const stellen = abs === 0 ? 0 : abs < 0.01 ? 5 : abs < 1 ? 4 : abs < 100 ? 3 : 1;
        return Number(n.toFixed(stellen))
            .toLocaleString('de-CH', { maximumFractionDigits: stellen });
    };
    const wieGezeigt = (n) => {
        const t = zahl(n).replace(/[’']/g, '').replace(',', '.');
        const z = Number(t);
        return Number.isFinite(z) ? z : n;
    };
    const rechteSeite = (formel) => formel.includes('=') ? formel.slice(formel.indexOf('=') + 1).trim() : formel;
    const einsetzen = (formel, werte) => {
        let raus = rechteSeite(formel);
        for (const name of Object.keys(werte).sort((a, b) => b.length - a.length))
            raus = raus.split(name).join(zahl(werte[name]));
        return raus;
    };
    const fehlende = (formel, werte) => {
        let rest = rechteSeite(formel);
        for (const name of Object.keys(werte).sort((a, b) => b.length - a.length))
            rest = rest.split(name).join(' ');
        return rest.replace(/[\d\s.,()·+\-*/÷×√²³^%]/g, '').split('').filter(Boolean);
    };
    const schritt = (titel, formel, werte, rechnen, einheit, zusatz = {}) => {
        const offen = fehlende(formel, werte);
        if (offen.length)
            throw new Error('In „' + formel + '" steht ' + offen.join('') + ', wofür kein Wert übergeben wurde.');
        const wert = rechnen(werte);
        const gerundet = {};
        for (const [k, v] of Object.entries(werte))
            gerundet[k] = wieGezeigt(v);
        const nachgerechnet = rechnen(gerundet);
        const abweichung = wert === 0
            ? Math.abs(nachgerechnet)
            : Math.abs((nachgerechnet - wert) / wert);
        if (Number.isFinite(abweichung) && abweichung > 0.005)
            throw new Error('„' + formel + '": nachgerechnet ergibt die gezeigte Zeile ' +
                zahl(nachgerechnet) + ' ' + einheit + ', danebensteht ' + zahl(wert) + ' ' +
                einheit + ' — die Zahlen sind zu kurz gerundet.');
        return {
            titel,
            ...(zusatz.hinweis ? { hinweis: zusatz.hinweis } : {}),
            formel,
            eingesetzt: einsetzen(formel, werte),
            wert,
            einheit,
            ...(zusatz.quelle ? { quelle: zusatz.quelle } : {})
        };
    };
    const RHO = { kupfer: 0.0178, aluminium: 0.0278 };
    const spannungsfall = (e) => {
        const cos = e.cosPhi === undefined ? 1 : e.cosPhi;
        const werkstoff = e.werkstoff || 'kupfer';
        const rho = RHO[werkstoff];
        const grenze = e.grenzeProzent === undefined ? 3 : e.grenzeProzent;
        const s1 = schritt('Strom aus der Leistung', 'I = P / (U · cosφ)', { P: e.leistungW, U: e.spannungV, 'cosφ': cos }, v => v['P'] / (v['U'] * v['cosφ']), 'A');
        const s2 = schritt('Widerstand der Leitung', 'R = ϱ · 2 · l / A', { 'ϱ': rho, l: e.laengeM, A: e.querschnittMm2 }, v => v['ϱ'] * 2 * v['l'] / v['A'], 'Ω', { hinweis: 'Hin- und Rückweg' });
        const s3 = schritt('Spannungsfall', 'ΔU = I · R · cosφ', { I: s1.wert, R: s2.wert, 'cosφ': cos }, v => v['I'] * v['R'] * v['cosφ'], 'V');
        const s4 = schritt('In Prozent', 'ΔU% = ΔU / U · 100', { 'ΔU': s3.wert, U: e.spannungV }, v => v['ΔU'] / v['U'] * 100, '%');
        const probe = schritt('Gegenprobe über die Verlustleistung', 'PV = I² · R', { I: s1.wert, R: s2.wert }, v => v['I'] ** 2 * v['R'], 'W');
        return {
            titel: 'Spannungsfall der Leitung',
            schritte: [s1, s2, s3, s4],
            ergebnis: { wert: s4.wert, einheit: '%', name: 'Spannungsfall' },
            gegenprobe: probe,
            annahmen: [
                'Werkstoff ' + (werkstoff === 'kupfer' ? 'Kupfer' : 'Aluminium') +
                    ', ϱ = ' + zahl(rho) + ' Ω·mm²/m bei 20 °C',
                cos === 1 ? 'Rein ohmsche Last, cos φ = 1' : 'cos φ = ' + zahl(cos),
                'Zulässig sind ' + zahl(grenze) + ' %',
                'Näherungsformel ohne den induktiven Anteil der Leitung'
            ]
        };
    };
    const urteil = (weg, grenzeProzent = 3) => {
        const haelt = weg.ergebnis.wert <= grenzeProzent;
        return {
            haelt,
            satz: haelt
                ? zahl(weg.ergebnis.wert) + ' % von zulässigen ' + zahl(grenzeProzent) + ' % — hält'
                : zahl(weg.ergebnis.wert) + ' % über zulässigen ' + zahl(grenzeProzent) +
                    ' % — zu viel, grösserer Querschnitt nötig'
        };
    };
    const alsText = (weg) => {
        const zeilen = [weg.titel, ''];
        weg.schritte.forEach((s, i) => {
            zeilen.push((i + 1) + '. ' + s.titel + (s.hinweis ? ' (' + s.hinweis + ')' : ''));
            zeilen.push('   ' + s.formel);
            zeilen.push('   = ' + s.eingesetzt + ' = ' + zahl(s.wert) + ' ' + s.einheit);
            zeilen.push('');
        });
        if (weg.gegenprobe) {
            const g = weg.gegenprobe;
            zeilen.push(g.titel);
            zeilen.push('   ' + g.formel + ' = ' + g.eingesetzt + ' = ' + zahl(g.wert) + ' ' + g.einheit);
            zeilen.push('');
        }
        if (weg.annahmen.length) {
            zeilen.push('Angenommen:');
            weg.annahmen.forEach(a => zeilen.push('   · ' + a));
        }
        return zeilen.join('\n').trim();
    };
    return { schritt, zahl, einsetzen, spannungsfall, urteil, alsText, RHO };
})();
window.Rechenweg = Rechenweg;
