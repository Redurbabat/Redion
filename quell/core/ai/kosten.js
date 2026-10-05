"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/ai/kosten.ts (npm run bauen:ts). */
const KiKosten = (() => {
    const STAND = '2026-08-31';
    const ALT_NACH_TAGEN = 182;
    const listeAlt = (jetztMs) => {
        const standMs = Date.parse(STAND + 'T00:00:00Z');
        if (!Number.isFinite(standMs) || !Number.isFinite(jetztMs))
            return false;
        return (jetztMs - standMs) > ALT_NACH_TAGEN * 86400000;
    };
    const standSatz = (jetztMs) => listeAlt(jetztMs)
        ? 'Die Preisliste ist vom ' + STAND + ' und damit über ein halbes Jahr ' +
            'alt. Die Beträge sind Schätzungen nach alten Preisen.'
        : '';
    const WAEHRUNG = 'USD';
    const PREISE = {
        'llama-3.3-70b-versatile': { ein: 0, aus: 0 },
        'llama-3.1-8b-instant': { ein: 0, aus: 0 },
        'gemma2-9b-it': { ein: 0, aus: 0 },
        'meta-llama/llama-3.3-70b-instruct:free': { ein: 0, aus: 0 },
        'google/gemma-2-9b-it:free': { ein: 0, aus: 0 },
        'mistralai/mistral-7b-instruct:free': { ein: 0, aus: 0 },
        'gemini-2.0-flash': { ein: 0, aus: 0 },
        'gemini-2.0-flash-lite': { ein: 0, aus: 0 },
        'gpt-4o-mini': { ein: 0.15, aus: 0.60 },
        'gpt-4o': { ein: 2.50, aus: 10.00 },
        'claude-3-5-haiku-latest': { ein: 0.80, aus: 4.00 },
        'claude-sonnet-4-5': { ein: 3.00, aus: 15.00 },
        'text-embedding-3-small': { ein: 0.02, aus: 0 },
        'text-embedding-004': { ein: 0, aus: 0 }
    };
    const ZEICHEN_JE_TOKEN = 3.6;
    const tokenSchaetzen = (text) => {
        const s = String(text ?? '');
        if (!s)
            return 0;
        return Math.ceil(s.length / ZEICHEN_JE_TOKEN);
    };
    const tokenAusNachrichten = (nachrichten) => {
        if (!Array.isArray(nachrichten))
            return tokenSchaetzen(nachrichten);
        let n = 0;
        for (const m of nachrichten) {
            if (!m)
                continue;
            n += tokenSchaetzen(m.content);
            n += 4;
        }
        return n;
    };
    const unsicherheit = () => 1.35;
    const schaetzen = (modell, tokenEin, tokenAus, preise = PREISE) => {
        const p = preise[modell];
        if (!p) {
            return {
                bekannt: false, modell, tokenEin, tokenAus,
                betrag: 0, hoechstens: 0, waehrung: WAEHRUNG, frei: false,
                satz: 'Für „' + modell + '" ist hier kein Preis hinterlegt. Was der ' +
                    'Aufruf kostet, lässt sich nicht sagen — die Preisliste ist vom ' +
                    STAND + '.'
            };
        }
        const frei = p.ein === 0 && p.aus === 0;
        const betrag = (tokenEin / 1e6) * p.ein + (tokenAus / 1e6) * p.aus;
        const hoechstens = betrag * unsicherheit();
        return {
            bekannt: true, modell, tokenEin, tokenAus,
            betrag, hoechstens, waehrung: WAEHRUNG, frei,
            satz: frei
                ? 'Dieses Modell kostet nichts. (Ein Kontingent kann es trotzdem haben.)'
                : 'Schätzung: rund ' + geld(betrag) + ', höchstens etwa ' + geld(hoechstens) +
                    '. Die Tokenzahl ist aus der Textlänge geschätzt, nicht gezählt.'
        };
    };
    const geld = (betrag, waehrung = WAEHRUNG) => {
        if (!Number.isFinite(betrag))
            return '–';
        const komma = (n, stellen) => n.toFixed(stellen).replace('.', ',');
        if (betrag === 0)
            return '0,00 ' + waehrung;
        if (betrag < 0.01)
            return '< 0,01 ' + waehrung;
        return komma(betrag, betrag < 1 ? 3 : 2) + ' ' + waehrung;
    };
    const VORGABE_GRENZEN = {
        jeAufruf: 0.50, jeLauf: 2.00, jeTag: 5.00, jeMonat: 20.00
    };
    const GRENZ_NAME = {
        jeAufruf: 'für einen einzelnen Aufruf',
        jeLauf: 'für einen Agentenlauf',
        jeTag: 'für heute',
        jeMonat: 'für diesen Monat'
    };
    const pruefen = (schaetzung, grenzen, stand) => {
        if (!schaetzung.bekannt || schaetzung.frei) {
            return { erlaubt: true, grenze: '', satz: schaetzung.satz, schaetzung };
        }
        const k = schaetzung.hoechstens;
        const pruefungen = [
            ['jeAufruf', grenzen.jeAufruf, k],
            ['jeLauf', grenzen.jeLauf, stand.lauf + k],
            ['jeTag', grenzen.jeTag, stand.heute + k],
            ['jeMonat', grenzen.jeMonat, stand.monat + k]
        ];
        for (const [name, grenze, waere] of pruefungen) {
            if (!grenze || grenze <= 0)
                continue;
            if (waere <= grenze)
                continue;
            return {
                erlaubt: false, grenze: name, schaetzung,
                satz: 'Dieser Aufruf würde die Grenze ' + GRENZ_NAME[name] + ' ' +
                    'überschreiten: er käme auf ' + geld(waere) + ' gegen ' +
                    geld(grenze) + '. Die Grenzen stehen unter Einstellungen → KI.'
            };
        }
        return { erlaubt: true, grenze: '', satz: schaetzung.satz, schaetzung };
    };
    const kontingentBuchen = (k, wieviel, jetzt, fensterMs) => {
        if (!k || jetzt >= k.bis) {
            return { verbraucht: wieviel, grenze: k ? k.grenze : 0, bis: jetzt + fensterMs };
        }
        return { ...k, verbraucht: k.verbraucht + wieviel };
    };
    const kontingentFrei = (k, wieviel, jetzt) => {
        if (!k || !k.grenze || k.grenze <= 0)
            return true;
        if (jetzt >= k.bis)
            return true;
        return k.verbraucht + wieviel <= k.grenze;
    };
    const kontingentWartet = (k, jetzt) => {
        if (!k || jetzt >= k.bis)
            return 0;
        return Math.ceil((k.bis - jetzt) / 1000);
    };
    const standAus = (buchungen, tag, monat, lauf = 0) => {
        let heute = 0, imMonat = 0;
        for (const b of buchungen || []) {
            if (!b || !Number.isFinite(b.betrag))
                continue;
            if (b.tag === tag)
                heute += b.betrag;
            if (String(b.tag || '').slice(0, 7) === monat)
                imMonat += b.betrag;
        }
        return { heute, monat: imMonat, lauf };
    };
    const belegLage = (buchungen, monat) => {
        let gezaehlt = 0, geschaetzt = 0, anzahl = 0, gezaehlteAnzahl = 0;
        for (const b of buchungen || []) {
            if (!b || !Number.isFinite(b.betrag))
                continue;
            if (monat && String(b.tag || '').slice(0, 7) !== monat)
                continue;
            anzahl++;
            if (b.gezaehlt) {
                gezaehlt += b.betrag;
                gezaehlteAnzahl++;
            }
            else
                geschaetzt += b.betrag;
        }
        const summe = gezaehlt + geschaetzt;
        return { gezaehlt, geschaetzt, summe, anzahl, gezaehlteAnzahl,
            anteil: summe > 0 ? gezaehlt / summe : 0 };
    };
    const belegSatz = (lage) => {
        if (!lage || !lage.anzahl)
            return '';
        if (lage.gezaehlteAnzahl === lage.anzahl)
            return 'Alle ' + lage.anzahl + ' Aufrufe mit gezählten Token vom Anbieter.';
        if (lage.gezaehlteAnzahl === 0)
            return 'Geschätzt — kein Anbieter hat eine Tokenzahl zurückgemeldet. ' +
                'Die Schätzung greift bewusst zu hoch.';
        return lage.gezaehlteAnzahl + ' von ' + lage.anzahl + ' Aufrufen gezählt, ' +
            'der Rest geschätzt (bewusst zu hoch).';
    };
    const jeAnbieter = (buchungen, monat) => {
        const aus = Object.create(null);
        for (const b of buchungen || []) {
            if (!b || !Number.isFinite(b.betrag))
                continue;
            if (monat && String(b.tag || '').slice(0, 7) !== monat)
                continue;
            const a = b.anbieter || 'unbekannt';
            aus[a] = (aus[a] || 0) + b.betrag;
        }
        return aus;
    };
    const kuerzen = (buchungen, abTag) => (buchungen || []).filter(b => b && String(b.tag || '') >= abTag);
    return {
        STAND, ALT_NACH_TAGEN, listeAlt, standSatz,
        WAEHRUNG, PREISE, VORGABE_GRENZEN, ZEICHEN_JE_TOKEN,
        tokenSchaetzen, tokenAusNachrichten, unsicherheit,
        schaetzen, pruefen, geld,
        kontingentBuchen, kontingentFrei, kontingentWartet,
        standAus, jeAnbieter, belegLage, belegSatz, kuerzen
    };
})();
window.KiKosten = KiKosten;
