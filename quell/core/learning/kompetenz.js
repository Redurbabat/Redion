"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/learning/kompetenz.ts (npm run bauen:ts). */
const Kompetenz = (() => {
    const TAG_MS = 86400000;
    const MINDEST_BELEGE = 5;
    const STUFEN = [
        { ab: 0.80, wort: 'Sitzt' },
        { ab: 0.60, wort: 'Fortgeschritten' },
        { ab: 0.35, wort: 'Auf dem Weg' },
        { ab: 0.00, wort: 'Am Anfang' }
    ];
    const stufeVon = (unten) => {
        for (const s of STUFEN)
            if (unten >= s.ab)
                return s.wort;
        return 'Am Anfang';
    };
    const wilson = (richtig, gesamt, z = 1.96) => {
        if (!gesamt || gesamt <= 0)
            return { unten: 0, mitte: 0, oben: 0 };
        const r = Math.max(0, Math.min(gesamt, richtig));
        const p = r / gesamt;
        const zz = z * z;
        const nenner = 1 + zz / gesamt;
        const mitte = (p + zz / (2 * gesamt)) / nenner;
        const rand = (z * Math.sqrt(p * (1 - p) / gesamt + zz / (4 * gesamt * gesamt))) / nenner;
        return {
            unten: Math.max(0, mitte - rand),
            mitte,
            oben: Math.min(1, mitte + rand)
        };
    };
    const haltbarkeit = (sr, jetzt) => {
        if (!sr)
            return 0;
        const intervall = Number(sr.intervall) || 0;
        if (intervall <= 0)
            return 0;
        const zuletzt = Date.parse(String(sr.zuletzt || ''));
        if (!Number.isFinite(zuletzt))
            return 0;
        const tage = Math.max(0, (jetzt - zuletzt) / TAG_MS);
        return Math.pow(0.9, tage / intervall);
    };
    const verlaufVon = (k) => {
        const v = k && k.reviewVerlauf;
        if (!v)
            return [];
        const liste = Array.isArray(v) ? v : Object.values(v);
        return liste.filter(e => e && typeof e === 'object')
            .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
    };
    const karteAus = (k, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const fenster = typeof opt.fensterTage === 'number' ? opt.fensterTage : 0;
        const ab = fenster > 0 ? jetzt - fenster * TAG_MS : 0;
        let gesamt = 0, richtig = 0, letzteZeit = 0, ersteZeit = 0;
        for (const e of verlaufVon(k)) {
            const wann = Date.parse(String(e.at || ''));
            if (fenster > 0 && !Number.isFinite(wann))
                continue;
            if (fenster > 0 && wann < ab)
                continue;
            if (fenster > 0 && Number.isFinite(wann) && wann > jetzt)
                continue;
            gesamt++;
            if ((Number(e.rating) || 0) >= 3)
                richtig++;
            if (Number.isFinite(wann)) {
                if (!ersteZeit || wann < ersteZeit)
                    ersteZeit = wann;
                if (wann > letzteZeit)
                    letzteZeit = wann;
            }
        }
        const h = haltbarkeit(k.sr, jetzt);
        const faellig = k.sr && k.sr.faellig
            ? Date.parse(String(k.sr.faellig)) <= jetzt : false;
        return {
            id: k.id, thema: k.thema || '(ohne Thema)', titel: k.titel || '',
            quelle: String(k.quelle || 'karte'),
            gesamt, richtig, haltbarkeit: h, faellig,
            ersteZeit, letzteZeit,
            intervall: Number(k.sr && k.sr.intervall) || 0
        };
    };
    const jeThema = (karten, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const mindest = typeof opt.mindestBelege === 'number'
            ? opt.mindestBelege : MINDEST_BELEGE;
        const gruppen = new Map();
        for (const k of karten || []) {
            if (!k || !k.id)
                continue;
            const e = karteAus(k, { ...opt, jetzt });
            let g = gruppen.get(e.thema);
            if (!g) {
                g = { thema: e.thema, karten: 0, gesamt: 0, richtig: 0,
                    haltbarSumme: 0, haltbarZahl: 0, faellig: 0,
                    ersteZeit: 0, letzteZeit: 0, quellen: {} };
                gruppen.set(e.thema, g);
            }
            if (e.quelle === 'karte')
                g.karten++;
            g.gesamt += e.gesamt;
            g.richtig += e.richtig;
            if (e.gesamt)
                g.quellen[e.quelle] = (g.quellen[e.quelle] || 0) + e.gesamt;
            if (e.intervall > 0) {
                g.haltbarSumme += e.haltbarkeit;
                g.haltbarZahl++;
            }
            if (e.faellig)
                g.faellig++;
            if (e.ersteZeit && (!g.ersteZeit || e.ersteZeit < g.ersteZeit))
                g.ersteZeit = e.ersteZeit;
            if (e.letzteZeit > g.letzteZeit)
                g.letzteZeit = e.letzteZeit;
        }
        return [...gruppen.values()].map(g => {
            const w = wilson(g.richtig, g.gesamt);
            const haltbar = g.haltbarZahl ? g.haltbarSumme / g.haltbarZahl : 0;
            const genug = g.gesamt >= mindest;
            return {
                thema: g.thema,
                karten: g.karten,
                belege: g.gesamt,
                quellen: { ...g.quellen },
                richtig: g.richtig,
                sicherheit: w.unten,
                roh: g.gesamt ? g.richtig / g.gesamt : 0,
                haltbarkeit: haltbar,
                faellig: g.faellig,
                genug,
                stufe: genug ? stufeVon(w.unten) : '',
                seit: g.ersteZeit ? new Date(g.ersteZeit).toISOString() : '',
                zuletzt: g.letzteZeit ? new Date(g.letzteZeit).toISOString() : '',
                satz: satzZu({
                    thema: g.thema, belege: g.gesamt, unten: w.unten, roh: g.gesamt ? g.richtig / g.gesamt : 0,
                    haltbar, genug, mindest, karten: g.karten, faellig: g.faellig, jetzt,
                    letzteZeit: g.letzteZeit, quellen: g.quellen
                })
            };
        }).sort((a, b) => (b.genug ? 1 : 0) - (a.genug ? 1 : 0) ||
            b.sicherheit - a.sicherheit ||
            a.thema.localeCompare(b.thema, 'de'));
    };
    const auffrischen = (themen, opt = {}) => {
        const grenze = typeof opt.hoechstens === 'number' ? opt.hoechstens : 5;
        return (themen || [])
            .filter(t => t && t.genug && t.karten > 0 && t.haltbarkeit < 1)
            .map(t => {
            const zerfall = 1 - t.haltbarkeit;
            const verlust = t.karten * zerfall;
            const sofort = (t.faellig || 0) * zerfall;
            return {
                thema: t.thema,
                karten: t.karten,
                faellig: t.faellig || 0,
                haltbarkeit: t.haltbarkeit,
                verlust,
                dringend: verlust + sofort,
                satz: auffrischSatz(t)
            };
        })
            .filter(e => e.dringend >= 1 - 1e-9)
            .sort((a, b) => b.dringend - a.dringend ||
            a.thema.localeCompare(b.thema, 'de'))
            .slice(0, Math.max(1, grenze));
    };
    const auffrischSatz = (t) => {
        const weg = Math.round(t.karten * (1 - t.haltbarkeit));
        const p = Math.round(t.haltbarkeit * 100);
        if (t.faellig > 0)
            return t.faellig + (t.faellig === 1 ? ' Karte ist' : ' Karten sind') +
                ' fällig — ' + p + ' % sitzt noch.';
        return 'Nichts fällig, aber rechnerisch ' +
            (weg === 1 ? 'eine Karte' : weg + ' Karten') +
            ' verblasst — ' + p + ' % sitzt noch.';
    };
    const RICHTUNG_SCHWELLE = 0.05;
    const FENSTER_TAGE = 90;
    const verlauf = (karten, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const tage = typeof opt.fensterTage === 'number' && opt.fensterTage > 0
            ? opt.fensterTage : FENSTER_TAGE;
        const gemeinsam = { ...opt, fensterTage: tage };
        const jetztFenster = jeThema(karten, { ...gemeinsam, jetzt });
        const davor = jeThema(karten, { ...gemeinsam, jetzt: jetzt - tage * TAG_MS });
        const vorher = new Map(davor.map(t => [t.thema, t]));
        const erg = [];
        for (const t of jetztFenster) {
            const v = vorher.get(t.thema);
            if (!t.genug || !v || !v.genug)
                continue;
            const unterschied = t.sicherheit - v.sicherheit;
            const richtung = unterschied >= RICHTUNG_SCHWELLE ? 'auf'
                : unterschied <= -RICHTUNG_SCHWELLE ? 'ab' : 'gleich';
            erg.push({
                thema: t.thema, tage,
                jetzt: t.sicherheit, vorher: v.sicherheit,
                unterschied, richtung,
                belegeJetzt: t.belege, belegeVorher: v.belege,
                satz: verlaufSatz(t.sicherheit, v.sicherheit, unterschied, richtung, tage)
            });
        }
        return erg.sort((a, b) => Math.abs(b.unterschied) - Math.abs(a.unterschied) ||
            a.thema.localeCompare(b.thema, 'de'));
    };
    const prozent = (x) => Math.round(x * 100) + ' %';
    const verlaufSatz = (jetztWert, vorherWert, unterschied, richtung, tage) => {
        const zeitraum = tage === 90 ? 'in den letzten drei Monaten'
            : tage === 30 ? 'im letzten Monat'
                : 'in den letzten ' + tage + ' Tagen';
        if (richtung === 'gleich') {
            return prozent(jetztWert) + ' — ' + zeitraum +
                ' etwa gleich geblieben (vorher ' + prozent(vorherWert) + ').';
        }
        const punkte = Math.round(Math.abs(unterschied) * 100);
        return prozent(vorherWert) + ' → ' + prozent(jetztWert) +
            ' — ' + (richtung === 'auf' ? 'aufwärts' : 'abwärts') + ', ' +
            punkte + ' Punkte ' + zeitraum + '.';
    };
    const QUELLEN_NAME = {
        karte: 'Karteikarten',
        pruefung: 'Prüfungssimulationen'
    };
    const quellenTeil = (quellen) => {
        const paare = Object.entries(quellen || {})
            .filter(([, n]) => Number(n) > 0)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        if (paare.length < 2)
            return '';
        const teile = paare.map(([q, n]) => n + ' aus ' + (QUELLEN_NAME[q] || q));
        const letzter = teile.pop();
        return ' Die Belege: ' + (teile.length ? teile.join(', ') + ' und ' : '') +
            letzter + '.';
    };
    const satzZu = (x) => {
        if (!x.belege) {
            return x.karten === 1
                ? 'Eine Karte, noch nie beantwortet.'
                : x.karten + ' Karten, noch keine davon beantwortet.';
        }
        if (!x.genug) {
            const fehlt = x.mindest - x.belege;
            return x.belege + (x.belege === 1 ? ' Antwort' : ' Antworten') +
                ' — zu wenig für eine Aussage. Noch ' + fehlt +
                (fehlt === 1 ? ' Antwort' : ' Antworten') + ', dann sagt Redion etwas dazu.' +
                quellenTeil(x.quellen);
        }
        const prozent = Math.round(x.unten * 100);
        const rohProzent = Math.round(x.roh * 100);
        const haltbarProzent = Math.round(x.haltbar * 100);
        const tage = x.letzteZeit
            ? Math.round((x.jetzt - x.letzteZeit) / TAG_MS) : 0;
        const rohTeil = rohProzent - prozent >= 8
            ? ' (roh ' + rohProzent + ' % — für mehr müssten es mehr Antworten sein)'
            : '';
        const zeitTeil = tage <= 1 ? 'zuletzt heute'
            : tage < 30 ? 'zuletzt vor ' + tage + ' Tagen'
                : 'zuletzt vor ' + Math.round(tage / 30) + ' Monaten';
        return stufeVon(x.unten) + ' — ' + prozent + ' % aus ' + x.belege +
            ' Antworten' + rohTeil +
            '. Davon dürfte heute noch ' + haltbarProzent +
            ' % sitzen; ' + zeitTeil + '.' +
            (x.faellig ? ' ' + x.faellig + ' fällig.' : '') +
            quellenTeil(x.quellen);
    };
    const gesamt = (karten, opt = {}) => {
        const alle = (karten || []).map(k => ({ ...k, thema: 'alles' }));
        const eins = jeThema(alle, opt);
        return eins[0] || {
            thema: 'alles', karten: 0, belege: 0, richtig: 0, sicherheit: 0, quellen: {},
            roh: 0, haltbarkeit: 0, faellig: 0, genug: false, stufe: '',
            seit: '', zuletzt: '', satz: 'Noch keine Karten.'
        };
    };
    return {
        jeThema, gesamt, karteAus, wilson, haltbarkeit, stufeVon, verlaufVon,
        auffrischen, auffrischSatz,
        verlauf, verlaufSatz,
        MINDEST_BELEGE, STUFEN, RICHTUNG_SCHWELLE, FENSTER_TAGE
    };
})();
window.Kompetenz = Kompetenz;
