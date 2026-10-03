"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/calendar/wiederholung.ts (npm run bauen:ts). */
const Wiederholung = (() => {
    const TAGE = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const BEKANNT = ['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'BYMONTHDAY',
        'BYMONTH', 'BYSETPOS', 'WKST'];
    const p2 = (n) => String(n).padStart(2, '0');
    const tagText = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    const zeitText = (d) => tagText(d) + 'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    const lesen = (rrule) => {
        const r = {
            freq: '', interval: 1, count: 0, until: '',
            byday: [], bymonthday: [], bymonth: [], bysetpos: [],
            wkst: 1, nichtVerstanden: []
        };
        for (const stueck of String(rrule || '').split(';')) {
            const gleich = stueck.indexOf('=');
            if (gleich < 0)
                continue;
            const name = stueck.slice(0, gleich).trim().toUpperCase();
            const wert = stueck.slice(gleich + 1).trim();
            if (!name || !wert)
                continue;
            if (BEKANNT.indexOf(name) < 0) {
                r.nichtVerstanden.push(name);
                continue;
            }
            switch (name) {
                case 'FREQ':
                    r.freq = wert.toUpperCase();
                    break;
                case 'INTERVAL':
                    r.interval = Math.max(1, Number(wert) || 1);
                    break;
                case 'COUNT':
                    r.count = Math.max(0, Number(wert) || 0);
                    break;
                case 'UNTIL':
                    r.until = wert;
                    break;
                case 'WKST': {
                    const i = TAGE.indexOf(wert.toUpperCase());
                    if (i >= 0)
                        r.wkst = i;
                    else
                        r.nichtVerstanden.push('WKST');
                    break;
                }
                case 'BYMONTH':
                    r.bymonth = wert.split(',').map(x => Number(x))
                        .filter(n => Number.isFinite(n) && n >= 1 && n <= 12);
                    break;
                case 'BYMONTHDAY':
                    r.bymonthday = wert.split(',').map(x => Number(x))
                        .filter(n => Number.isFinite(n) && n !== 0 && Math.abs(n) <= 31);
                    break;
                case 'BYSETPOS':
                    r.bysetpos = wert.split(',').map(x => Number(x))
                        .filter(n => Number.isFinite(n) && n !== 0);
                    break;
                case 'BYDAY': {
                    for (const roh of wert.split(',')) {
                        const treffer = roh.trim().toUpperCase().match(/^([+-]?\d+)?([A-Z]{2})$/);
                        if (!treffer) {
                            r.nichtVerstanden.push('BYDAY:' + roh);
                            continue;
                        }
                        const tag = TAGE.indexOf(treffer[2] || '');
                        if (tag < 0) {
                            r.nichtVerstanden.push('BYDAY:' + roh);
                            continue;
                        }
                        r.byday.push({ ord: Number(treffer[1] || 0) || 0, tag });
                    }
                    break;
                }
            }
        }
        r.nichtVerstanden = [...new Set(r.nichtVerstanden)];
        return r;
    };
    const ausIcs = (s) => {
        const t = String(s || '').trim();
        const m = t.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
        if (!m) {
            const d = new Date(t);
            return isNaN(d.getTime()) ? null : d;
        }
        const [, jahr, monat, tag, std, min, sek, zulu] = m;
        if (!std)
            return new Date(Number(jahr), Number(monat) - 1, Number(tag), 12, 0, 0);
        if (zulu)
            return new Date(Date.UTC(Number(jahr), Number(monat) - 1, Number(tag), Number(std), Number(min), Number(sek || 0)));
        return new Date(Number(jahr), Number(monat) - 1, Number(tag), Number(std), Number(min), Number(sek || 0));
    };
    const monatstagPasst = (d, liste) => {
        if (!liste.length)
            return true;
        const tag = d.getDate();
        const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return liste.some(n => n > 0 ? n === tag : letzter + n + 1 === tag);
    };
    const tageDerRunde = (anfang, freq, r) => {
        const raus = [];
        if (freq === 'WEEKLY') {
            for (let i = 0; i < 7; i++) {
                const d = new Date(anfang);
                d.setDate(d.getDate() + i);
                if (r.byday.some(b => b.tag === d.getDay()))
                    raus.push(d);
            }
            return raus;
        }
        const bis = new Date(anfang);
        if (freq === 'MONTHLY')
            bis.setMonth(bis.getMonth() + 1);
        else
            bis.setFullYear(bis.getFullYear() + 1);
        const alle = [];
        const lauf = new Date(anfang);
        let schutz = 0;
        while (lauf < bis && schutz++ < 400) {
            alle.push(new Date(lauf));
            lauf.setDate(lauf.getDate() + 1);
        }
        for (const b of r.byday) {
            const passend = alle.filter(d => d.getDay() === b.tag);
            if (!b.ord) {
                raus.push(...passend);
                continue;
            }
            const i = b.ord > 0 ? b.ord - 1 : passend.length + b.ord;
            const treffer = passend[i];
            if (treffer)
                raus.push(treffer);
        }
        return raus;
    };
    const ausrollen = (start, rrule, opt = {}) => {
        const r = lesen(rrule);
        const bisTage = typeof opt.bisTage === 'number' ? opt.bisTage : 400;
        const hoechstens = typeof opt.hoechstens === 'number' ? opt.hoechstens : 500;
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const ganzerTag = !!opt.ganzerTag;
        const alsText = (d) => ganzerTag ? tagText(d) : zeitText(d);
        const anfang = ausIcs(String(start).length === 10
            ? String(start).replace(/-/g, '')
            : String(start).replace(/[-:]/g, '').slice(0, 15));
        if (!anfang) {
            return { termine: [], nichtVerstanden: r.nichtVerstanden, abgeschnitten: false,
                satz: 'Der Starttermin liess sich nicht lesen.' };
        }
        if (!r.freq) {
            return { termine: [alsText(anfang)], nichtVerstanden: r.nichtVerstanden,
                abgeschnitten: false, satz: satzZu(r.nichtVerstanden, false) };
        }
        const grenze = new Date(jetzt);
        grenze.setDate(grenze.getDate() + bisTage);
        const bis = r.until ? (ausIcs(r.until) || grenze) : grenze;
        const schluss = bis < grenze ? bis : grenze;
        const gestrichen = new Set();
        for (const x of (opt.exdate || [])) {
            const d = ausIcs(x);
            if (d)
                gestrichen.add(tagText(d));
        }
        const raus = [];
        const gesehen = new Set();
        let abgeschnitten = false;
        let erzeugt = 0;
        const nimm = (d) => {
            if (d > schluss)
                return false;
            if (r.bymonth.length && r.bymonth.indexOf(d.getMonth() + 1) < 0)
                return true;
            if (!monatstagPasst(d, r.bymonthday))
                return true;
            const text = alsText(d);
            if (gesehen.has(text))
                return true;
            gesehen.add(text);
            erzeugt++;
            if (!gestrichen.has(tagText(d)))
                raus.push(text);
            if (r.count && erzeugt >= r.count)
                return false;
            if (erzeugt >= hoechstens) {
                abgeschnitten = true;
                return false;
            }
            return true;
        };
        let weiter = nimm(new Date(anfang));
        const rundenAnfang = new Date(anfang);
        if (r.freq === 'WEEKLY') {
            const versatz = (rundenAnfang.getDay() - r.wkst + 7) % 7;
            rundenAnfang.setDate(rundenAnfang.getDate() - versatz);
        }
        else if (r.freq === 'MONTHLY') {
            rundenAnfang.setDate(1);
        }
        else if (r.freq === 'YEARLY') {
            rundenAnfang.setMonth(0, 1);
        }
        let runde = 0;
        while (weiter && runde < 2000) {
            const anfangDieserRunde = new Date(rundenAnfang);
            if (r.freq === 'DAILY')
                anfangDieserRunde.setDate(anfangDieserRunde.getDate() + runde * r.interval);
            else if (r.freq === 'WEEKLY')
                anfangDieserRunde.setDate(anfangDieserRunde.getDate() + runde * 7 * r.interval);
            else if (r.freq === 'MONTHLY')
                anfangDieserRunde.setMonth(anfangDieserRunde.getMonth() + runde * r.interval);
            else if (r.freq === 'YEARLY')
                anfangDieserRunde.setFullYear(anfangDieserRunde.getFullYear() + runde * r.interval);
            else
                break;
            runde++;
            if (anfangDieserRunde > schluss && runde > 1)
                break;
            let satz;
            if (r.freq === 'DAILY') {
                satz = [anfangDieserRunde];
            }
            else if (r.byday.length) {
                satz = tageDerRunde(anfangDieserRunde, r.freq, r);
            }
            else if (r.freq === 'WEEKLY') {
                const d = new Date(anfangDieserRunde);
                d.setDate(d.getDate() + ((anfang.getDay() - r.wkst + 7) % 7));
                satz = [d];
            }
            else if (r.freq === 'MONTHLY') {
                const d = new Date(anfangDieserRunde);
                const zielTag = r.bymonthday.length ? 1 : anfang.getDate();
                const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                if (!r.bymonthday.length && zielTag > letzter) {
                    satz = [];
                }
                else if (r.bymonthday.length) {
                    satz = [];
                    for (let t = 1; t <= letzter; t++) {
                        const kandidat = new Date(d.getFullYear(), d.getMonth(), t, anfang.getHours(), anfang.getMinutes());
                        if (monatstagPasst(kandidat, r.bymonthday))
                            satz.push(kandidat);
                    }
                }
                else {
                    d.setDate(zielTag);
                    satz = [d];
                }
            }
            else {
                const d = new Date(anfangDieserRunde);
                d.setMonth(anfang.getMonth(), anfang.getDate());
                satz = [d];
            }
            satz = satz.map(d => {
                const mit = new Date(d);
                mit.setHours(anfang.getHours(), anfang.getMinutes(), 0, 0);
                return mit;
            }).filter(d => d >= anfang)
                .sort((a, b) => a.getTime() - b.getTime());
            if (r.bysetpos.length && satz.length) {
                const gewaehlt = [];
                for (const pos of r.bysetpos) {
                    const i = pos > 0 ? pos - 1 : satz.length + pos;
                    const treffer = satz[i];
                    if (treffer)
                        gewaehlt.push(treffer);
                }
                satz = gewaehlt.sort((a, b) => a.getTime() - b.getTime());
            }
            for (const d of satz) {
                if (!nimm(d)) {
                    weiter = false;
                    break;
                }
            }
            if (satz.length && satz[satz.length - 1] > schluss)
                break;
        }
        for (const x of (opt.rdate || [])) {
            const d = ausIcs(x);
            if (!d)
                continue;
            const text = alsText(d);
            if (gesehen.has(text) || gestrichen.has(tagText(d)))
                continue;
            gesehen.add(text);
            raus.push(text);
        }
        raus.sort();
        return {
            termine: raus,
            nichtVerstanden: r.nichtVerstanden,
            abgeschnitten,
            satz: satzZu(r.nichtVerstanden, abgeschnitten)
        };
    };
    const satzZu = (nichtVerstanden, abgeschnitten) => {
        const teile = [];
        if (nichtVerstanden.length)
            teile.push('Diese Teile der Wiederholungsregel kennt Redion nicht: ' +
                nichtVerstanden.join(', ') + '. Die Termine daraus fehlen.');
        if (abgeschnitten)
            teile.push('Es wären mehr Termine geworden, als angezeigt werden.');
        return teile.join(' ');
    };
    return { lesen, ausrollen, ausIcs, tagText, zeitText, TAGE, BEKANNT };
})();
window.Wiederholung = Wiederholung;
