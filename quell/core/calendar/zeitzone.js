"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/calendar/zeitzone.ts (npm run bauen:ts). */
const Zeitzone = (() => {
    const bekannt = new Map();
    const kennt = (zone) => {
        const z = String(zone || '').trim();
        if (!z)
            return false;
        const gemerkt = bekannt.get(z);
        if (gemerkt !== undefined)
            return gemerkt;
        let ja = false;
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: z });
            ja = true;
        }
        catch {
            ja = false;
        }
        bekannt.set(z, ja);
        return ja;
    };
    const formate = new Map();
    const format = (zone) => {
        const da = formate.get(zone);
        if (da)
            return da;
        try {
            const f = new Intl.DateTimeFormat('en-US', {
                timeZone: zone, hour12: false,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            formate.set(zone, f);
            return f;
        }
        catch {
            return null;
        }
    };
    const versatz = (zone, augenblick) => {
        const f = format(zone);
        if (!f || !Number.isFinite(augenblick))
            return null;
        const teile = {};
        for (const t of f.formatToParts(new Date(augenblick)))
            if (t.type !== 'literal')
                teile[t.type] = t.value;
        const j = Number(teile.year), mo = Number(teile.month), tg = Number(teile.day);
        const st = Number(teile.hour) % 24;
        const mi = Number(teile.minute), se = Number(teile.second);
        if (![j, mo, tg, st, mi, se].every(Number.isFinite))
            return null;
        const alsWaereUtc = Date.UTC(j, mo - 1, tg, st, mi, se);
        return Math.round((alsWaereUtc - Math.floor(augenblick / 1000) * 1000) / 60000);
    };
    const alsAugenblick = (jahr, monat, tag, stunde, minute, zone) => {
        if (!kennt(zone))
            return null;
        const wand = Date.UTC(jahr, monat - 1, tag, stunde, minute, 0);
        if (!Number.isFinite(wand))
            return null;
        const erste = versatz(zone, wand);
        if (erste === null)
            return null;
        const kandidat = wand - erste * 60000;
        const zweite = versatz(zone, kandidat);
        if (zweite === null || zweite === erste)
            return kandidat;
        return wand - zweite * 60000;
    };
    const alsOrtszeit = (jahr, monat, tag, stunde, minute, zone) => {
        const t = alsAugenblick(jahr, monat, tag, stunde, minute, zone);
        if (t === null)
            return null;
        const d = new Date(t);
        const p2 = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
            'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    };
    return { kennt, versatz, alsAugenblick, alsOrtszeit };
})();
window.Zeitzone = Zeitzone;
