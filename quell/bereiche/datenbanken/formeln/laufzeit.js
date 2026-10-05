"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/formeln/laufzeit.ts (npm run bauen:ts). */
const Formula = (() => {
    const tokenize = (src) => {
        const out = [];
        let i = 0;
        const istZiffer = (c) => c >= '0' && c <= '9';
        const istBuchstabe = (c) => /[A-Za-zÄÖÜäöüß_]/.test(c);
        while (i < src.length) {
            const c = src[i];
            if (/\s/.test(c)) {
                i++;
                continue;
            }
            if (c === '"' || c === "'") {
                const ende = c;
                let s = '';
                i++;
                while (i < src.length && src[i] !== ende) {
                    if (src[i] === '\\') {
                        i++;
                        s += src[i] === 'n' ? '\n' : src[i];
                    }
                    else
                        s += src[i];
                    i++;
                }
                i++;
                out.push({ t: 'str', v: s });
                continue;
            }
            if (istZiffer(c) || (c === '.' && istZiffer(src[i + 1]))) {
                let s = '';
                while (i < src.length && (istZiffer(src[i]) || src[i] === '.'))
                    s += src[i++];
                if (src[i] === 'e' || src[i] === 'E') {
                    const vorzeichen = (src[i + 1] === '+' || src[i + 1] === '-') ? 1 : 0;
                    if (istZiffer(src[i + 1 + vorzeichen])) {
                        s += src[i++];
                        if (vorzeichen)
                            s += src[i++];
                        while (i < src.length && istZiffer(src[i]))
                            s += src[i++];
                    }
                }
                out.push({ t: 'num', v: parseFloat(s) });
                continue;
            }
            if (istBuchstabe(c)) {
                let s = '';
                while (i < src.length && (istBuchstabe(src[i]) || istZiffer(src[i])))
                    s += src[i++];
                out.push({ t: 'name', v: s });
                continue;
            }
            const zwei = src.slice(i, i + 2);
            if (['==', '!=', '>=', '<=', '&&', '||'].includes(zwei)) {
                out.push({ t: 'op', v: zwei });
                i += 2;
                continue;
            }
            if (c === ';') {
                out.push({ t: 'op', v: ',' });
                i++;
                continue;
            }
            if ('+-*/%^><(),?:[]!.'.includes(c)) {
                out.push({ t: 'op', v: c });
                i++;
                continue;
            }
            i++;
        }
        out.push({ t: 'end' });
        return out;
    };
    const parse = (tok) => {
        let p = 0;
        const schau = () => tok[p];
        const nimm = () => tok[p++];
        const istOp = (v) => tok[p].t === 'op' && tok[p].v === v;
        const istName = (v) => tok[p].t === 'name' && tok[p].v.toLowerCase() === v;
        const erwarte = (v) => {
            if (!istOp(v))
                throw new Error(`"${v}" erwartet`);
            p++;
        };
        const atom = () => {
            const t = schau();
            if (t.t === 'num') {
                nimm();
                return { k: 'num', v: t.v };
            }
            if (t.t === 'str') {
                nimm();
                return { k: 'str', v: t.v };
            }
            if (istOp('(')) {
                nimm();
                const e = ternaer();
                erwarte(')');
                return e;
            }
            if (istOp('[')) {
                nimm();
                const items = [];
                if (!istOp(']')) {
                    items.push(ternaer());
                    while (istOp(',')) {
                        nimm();
                        items.push(ternaer());
                    }
                }
                erwarte(']');
                return { k: 'list', items };
            }
            if (t.t === 'name') {
                const name = nimm().v;
                const klein = name.toLowerCase();
                if (klein === 'true')
                    return { k: 'bool', v: true };
                if (klein === 'false')
                    return { k: 'bool', v: false };
                if (klein === 'null' || klein === 'empty' && !istOp('('))
                    return { k: 'null' };
                if (istOp('(')) {
                    nimm();
                    const args = [];
                    if (!istOp(')')) {
                        args.push(ternaer());
                        while (istOp(',')) {
                            nimm();
                            args.push(ternaer());
                        }
                    }
                    erwarte(')');
                    return { k: 'call', name: klein, args };
                }
                return { k: 'var', name };
            }
            throw new Error('Unerwartetes Zeichen in der Formel');
        };
        const punkt = () => {
            let links = atom();
            while (schau().t === 'op' && schau().v === '.') {
                nimm();
                const m = nimm().v.toLowerCase();
                const args = [links];
                if (istOp('(')) {
                    nimm();
                    if (!istOp(')')) {
                        args.push(ternaer());
                        while (istOp(',')) {
                            nimm();
                            args.push(ternaer());
                        }
                    }
                    erwarte(')');
                }
                links = { k: 'call', name: m, args };
            }
            return links;
        };
        const unaer = () => {
            if (istOp('-')) {
                nimm();
                return { k: 'neg', a: unaer() };
            }
            if (istOp('!')) {
                nimm();
                return { k: 'not', a: unaer() };
            }
            if (istName('not')) {
                nimm();
                return { k: 'not', a: unaer() };
            }
            return punkt();
        };
        const potenz = () => {
            let l = unaer();
            while (istOp('^')) {
                nimm();
                l = { k: 'bin', op: '^', l, r: unaer() };
            }
            return l;
        };
        const punktrechnung = () => {
            let l = potenz();
            while (istOp('*') || istOp('/') || istOp('%')) {
                const op = nimm().v;
                l = { k: 'bin', op, l, r: potenz() };
            }
            return l;
        };
        const strichrechnung = () => {
            let l = punktrechnung();
            while (istOp('+') || istOp('-')) {
                const op = nimm().v;
                l = { k: 'bin', op, l, r: punktrechnung() };
            }
            return l;
        };
        const vergleich = () => {
            let l = strichrechnung();
            while (istOp('==') || istOp('!=') || istOp('>') || istOp('>=') || istOp('<') || istOp('<=')) {
                const op = nimm().v;
                l = { k: 'bin', op, l, r: strichrechnung() };
            }
            return l;
        };
        const und = () => {
            let l = vergleich();
            while (istOp('&&') || istName('and')) {
                nimm();
                l = { k: 'bin', op: 'and', l, r: vergleich() };
            }
            return l;
        };
        const oder = () => {
            let l = und();
            while (istOp('||') || istName('or')) {
                nimm();
                l = { k: 'bin', op: 'or', l, r: und() };
            }
            return l;
        };
        const ternaer = () => {
            const bedingung = oder();
            if (istOp('?')) {
                nimm();
                const dann = ternaer();
                erwarte(':');
                const sonst = ternaer();
                return { k: 'call', name: 'if', args: [bedingung, dann, sonst] };
            }
            return bedingung;
        };
        const baum = ternaer();
        return baum;
    };
    const istLeer = (v) => v === null || v === undefined || v === '' ||
        (Array.isArray(v) && v.length === 0);
    const zahl = (v) => {
        if (typeof v === 'number')
            return v;
        if (typeof v === 'boolean')
            return v ? 1 : 0;
        if (v instanceof Date)
            return v.getTime();
        if (istLeer(v))
            return 0;
        const n = parseFloat(String(v).replace(',', '.'));
        return isNaN(n) ? 0 : n;
    };
    const text = (v) => {
        if (v === null || v === undefined)
            return '';
        if (v instanceof Date)
            return v.toISOString().slice(0, 10);
        if (typeof v === 'boolean')
            return v ? 'true' : 'false';
        if (Array.isArray(v))
            return v.map(text).join(', ');
        if (typeof v === 'number')
            return String(Math.round(v * 1e10) / 1e10);
        if (typeof v === 'object' && v.__gruppe)
            return v.schluessel + ' (' + v.eintraege.length + ')';
        return String(v);
    };
    const wahr = (v) => {
        if (typeof v === 'boolean')
            return v;
        if (typeof v === 'number')
            return v !== 0;
        return !istLeer(v);
    };
    const alsDatum = (v) => {
        if (v instanceof Date)
            return v;
        if (!v)
            return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    };
    const TAG_MS = 86400000;
    const zonenWand = (d, zone) => {
        if (!zone)
            return d;
        try {
            const s = new Intl.DateTimeFormat('sv-SE', {
                timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).format(d);
            const g = new Date(s.replace(' ', 'T'));
            return isNaN(g.getTime()) ? d : g;
        }
        catch {
            return d;
        }
    };
    const alsInstant = (d, zone) => {
        if (!zone)
            return d;
        let t = d.getTime();
        for (let i = 0; i < 2; i++) {
            const versatz = zonenWand(new Date(t), zone).getTime() - t;
            t = d.getTime() - versatz;
        }
        return new Date(t);
    };
    const istWochenende = (d) => d.getDay() === 0 || d.getDay() === 6;
    const GRUPPE = '__gruppe';
    const F = {
        and: (a) => a.every(wahr),
        or: (a) => a.some(wahr),
        not: (a) => !wahr(a[0]),
        xor: (a) => a.filter(wahr).length % 2 === 1,
        if: (a) => wahr(a[0]) ? a[1] : a[2],
        ifs: (a) => {
            for (let i = 0; i + 1 < a.length; i += 2)
                if (wahr(a[i]))
                    return a[i + 1];
            return a.length % 2 ? a[a.length - 1] : '';
        },
        empty: (a) => a.length ? istLeer(a[0]) : '',
        equal: (a) => a[0] === a[1],
        unequal: (a) => a[0] !== a[1],
        add: (a) => zahl(a[0]) + zahl(a[1]),
        subtract: (a) => zahl(a[0]) - zahl(a[1]),
        multiply: (a) => zahl(a[0]) * zahl(a[1]),
        divide: (a) => zahl(a[1]) === 0 ? 0 : zahl(a[0]) / zahl(a[1]),
        mod: (a) => zahl(a[1]) === 0 ? 0 : zahl(a[0]) % zahl(a[1]),
        pow: (a) => Math.pow(zahl(a[0]), zahl(a[1])),
        abs: (a) => Math.abs(zahl(a[0])),
        round: (a) => a.length > 1
            ? Math.round(zahl(a[0]) * Math.pow(10, zahl(a[1]))) / Math.pow(10, zahl(a[1]))
            : Math.round(zahl(a[0])),
        floor: (a) => Math.floor(zahl(a[0])),
        ceil: (a) => Math.ceil(zahl(a[0])),
        sqrt: (a) => Math.sqrt(Math.max(0, zahl(a[0]))),
        cbrt: (a) => Math.cbrt(zahl(a[0])),
        exp: (a) => Math.exp(zahl(a[0])),
        ln: (a) => zahl(a[0]) > 0 ? Math.log(zahl(a[0])) : 0,
        log10: (a) => zahl(a[0]) > 0 ? Math.log10(zahl(a[0])) : 0,
        log2: (a) => zahl(a[0]) > 0 ? Math.log2(zahl(a[0])) : 0,
        sign: (a) => Math.sign(zahl(a[0])),
        min: (a) => Math.min(...a.flat().map(zahl)),
        max: (a) => Math.max(...a.flat().map(zahl)),
        sum: (a) => a.flat().reduce((s, x) => s + zahl(x), 0),
        mean: (a) => { const f = a.flat(); return f.length ? f.reduce((s, x) => s + zahl(x), 0) / f.length : 0; },
        median: (a) => {
            const f = a.flat().map(zahl).sort((x, y) => x - y);
            if (!f.length)
                return 0;
            const m = Math.floor(f.length / 2);
            return f.length % 2 ? f[m] : (f[m - 1] + f[m]) / 2;
        },
        pi: () => Math.PI,
        e: () => Math.E,
        tonumber: (a) => zahl(a[0]),
        format: (a) => text(a[0]),
        length: (a) => Array.isArray(a[0]) ? a[0].length : text(a[0]).length,
        substring: (a) => text(a[0]).substring(zahl(a[1]), a.length > 2 ? zahl(a[2]) : undefined),
        contains: (a) => Array.isArray(a[0]) ? a[0].includes(a[1]) : text(a[0]).includes(text(a[1])),
        includes: (a) => Array.isArray(a[0]) ? a[0].includes(a[1]) : text(a[0]).includes(text(a[1])),
        test: (a) => { try {
            return new RegExp(text(a[1])).test(text(a[0]));
        }
        catch {
            return false;
        } },
        match: (a) => { try {
            return (text(a[0]).match(new RegExp(text(a[1]), 'g')) || []);
        }
        catch {
            return [];
        } },
        replace: (a) => {
            try {
                return text(a[0]).replace(new RegExp(text(a[1])), text(a[2]));
            }
            catch {
                return text(a[0]).replace(text(a[1]), text(a[2]));
            }
        },
        replaceall: (a) => {
            try {
                return text(a[0]).replace(new RegExp(text(a[1]), 'g'), text(a[2]));
            }
            catch {
                return text(a[0]).split(text(a[1])).join(text(a[2]));
            }
        },
        lower: (a) => text(a[0]).toLowerCase(),
        upper: (a) => text(a[0]).toUpperCase(),
        trim: (a) => text(a[0]).trim(),
        split: (a) => text(a[0]).split(text(a[1])),
        repeat: (a) => text(a[0]).repeat(Math.max(0, Math.min(500, Math.floor(zahl(a[1]))))),
        join: (a) => (Array.isArray(a[0]) ? a[0] : [a[0]]).map(text).join(text(a[1] ?? ', ')),
        at: (a) => (a[0] || [])[zahl(a[1])],
        first: (a) => Array.isArray(a[0]) ? a[0][0] : text(a[0])[0],
        last: (a) => Array.isArray(a[0]) ? a[0][a[0].length - 1] : text(a[0]).slice(-1),
        slice: (a) => (a[0] || []).slice(zahl(a[1]), a.length > 2 ? zahl(a[2]) : undefined),
        concat: (a) => [].concat(...a.map((x) => Array.isArray(x) ? x : [x])),
        reverse: (a) => (a[0] || []).slice().reverse(),
        unique: (a) => [...new Set(a[0] || [])],
        sort: (a) => (a[0] || []).slice().sort(),
        flat: (a) => (a[0] || []).flat(),
        boolean: (a) => wahr(a[0]),
        daterange: (a) => ({ von: alsDatum(a[0]), bis: alsDatum(a[1]) }),
        datestart: (a) => (a[0] && a[0].von !== undefined ? a[0].von : alsDatum(a[0])),
        dateend: (a) => (a[0] && a[0].bis !== undefined ? a[0].bis : alsDatum(a[0])),
        now: () => new Date(),
        today: () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; },
        dateadd: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            const n = zahl(a[1]);
            const e = text(a[2]).toLowerCase();
            const r = new Date(d);
            if (e.startsWith('day'))
                r.setDate(r.getDate() + n);
            if (e.startsWith('week'))
                r.setDate(r.getDate() + n * 7);
            if (e.startsWith('month'))
                r.setMonth(r.getMonth() + n);
            if (e.startsWith('year'))
                r.setFullYear(r.getFullYear() + n);
            if (e.startsWith('hour'))
                r.setHours(r.getHours() + n);
            if (e.startsWith('minute'))
                r.setMinutes(r.getMinutes() + n);
            return r;
        },
        datesubtract: (a) => F.dateadd([a[0], -zahl(a[1]), a[2]]),
        datebetween: (a) => {
            const d1 = alsDatum(a[0]), d2 = alsDatum(a[1]);
            if (!d1 || !d2)
                return 0;
            const e = text(a[2] || 'days').toLowerCase();
            const ms = d1.getTime() - d2.getTime();
            if (e.startsWith('minute'))
                return Math.round(ms / 60000);
            if (e.startsWith('hour'))
                return Math.round(ms / 3600000);
            if (e.startsWith('day'))
                return Math.round(ms / TAG_MS);
            if (e.startsWith('week'))
                return Math.round(ms / (TAG_MS * 7));
            if (e.startsWith('month'))
                return (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
            if (e.startsWith('year'))
                return d1.getFullYear() - d2.getFullYear();
            return Math.round(ms / TAG_MS);
        },
        timestamp: (a) => { const d = alsDatum(a[0]); return d ? d.getTime() : 0; },
        fromtimestamp: (a) => new Date(zahl(a[0])),
        parsedate: (a) => alsDatum(a[0]),
        year: (a) => { const d = alsDatum(a[0]); return d ? d.getFullYear() : 0; },
        month: (a) => { const d = alsDatum(a[0]); return d ? d.getMonth() + 1 : 0; },
        date: (a) => { const d = alsDatum(a[0]); return d ? d.getDate() : 0; },
        day: (a) => { const d = alsDatum(a[0]); return d ? (d.getDay() === 0 ? 7 : d.getDay()) : 0; },
        hour: (a) => { const d = alsDatum(a[0]); return d ? d.getHours() : 0; },
        minute: (a) => { const d = alsDatum(a[0]); return d ? d.getMinutes() : 0; },
        week: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return 0;
            const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const wt = t.getUTCDay() || 7;
            t.setUTCDate(t.getUTCDate() + 4 - wt);
            const jahresanfang = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
            return Math.ceil((((t.getTime() - jahresanfang.getTime()) / TAG_MS) + 1) / 7);
        },
        isweekend: (a) => { const d = alsDatum(a[0]); return d ? istWochenende(d) : false; },
        isworkday: (a) => { const d = alsDatum(a[0]); return d ? !istWochenende(d) : false; },
        businessdaysbetween: (a) => {
            const von = alsDatum(a[0]), bis = alsDatum(a[1]);
            if (!von || !bis)
                return 0;
            const rueckwaerts = bis < von;
            let x = new Date(Math.min(von.getTime(), bis.getTime()));
            x.setHours(0, 0, 0, 0);
            const ende = new Date(Math.max(von.getTime(), bis.getTime()));
            ende.setHours(0, 0, 0, 0);
            let n = 0, sicher = 0;
            while (x < ende && sicher++ < 40000) {
                x = new Date(x.getTime() + TAG_MS);
                if (!istWochenende(x))
                    n++;
            }
            return rueckwaerts ? -n : n;
        },
        addbusinessdays: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            let n = Math.trunc(zahl(a[1]));
            const schritt = n < 0 ? -TAG_MS : TAG_MS;
            let x = new Date(d.getTime()), sicher = 0;
            while (n !== 0 && sicher++ < 40000) {
                x = new Date(x.getTime() + schritt);
                if (!istWochenende(x))
                    n += n > 0 ? -1 : 1;
            }
            return x;
        },
        startofday: (a) => { const d = alsDatum(a[0]); if (!d)
            return null; const x = new Date(d); x.setHours(0, 0, 0, 0); return x; },
        endofday: (a) => { const d = alsDatum(a[0]); if (!d)
            return null; const x = new Date(d); x.setHours(23, 59, 59, 999); return x; },
        startofweek: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
            return x;
        },
        endofweek: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            const x = new Date(d);
            x.setHours(23, 59, 59, 999);
            x.setDate(x.getDate() + (6 - ((x.getDay() + 6) % 7)));
            return x;
        },
        startofmonth: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            return new Date(d.getFullYear(), d.getMonth(), 1);
        },
        endofmonth: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        },
        startofquarter: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
        },
        endofquarter: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999);
        },
        startofyear: (a) => { const d = alsDatum(a[0]); if (!d)
            return null; return new Date(d.getFullYear(), 0, 1); },
        endofyear: (a) => { const d = alsDatum(a[0]); if (!d)
            return null; return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999); },
        quarter: (a) => { const d = alsDatum(a[0]); return d ? Math.floor(d.getMonth() / 3) + 1 : 0; },
        daysinmonth: (a) => { const d = alsDatum(a[0]); return d ? new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() : 0; },
        isleapyear: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return false;
            const j = d.getFullYear();
            return (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0;
        },
        converttimezone: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return null;
            const von = a.length > 1 ? text(a[1]) : '';
            const nach = a.length > 2 ? text(a[2]) : text(a[1] || '');
            return zonenWand(alsInstant(d, von), nach);
        },
        timezoneoffset: (a) => {
            const d = alsDatum(a[0]);
            if (!d)
                return 0;
            const zone = text(a[1] || 'UTC');
            return Math.round((zonenWand(d, zone).getTime() - zonenWand(d, 'UTC').getTime()) / 60000);
        },
        random: () => Math.random(),
        randombetween: (a) => {
            const u = Math.ceil(Math.min(zahl(a[0]), zahl(a[1])));
            const o = Math.floor(Math.max(zahl(a[0]), zahl(a[1])));
            return o < u ? u : u + Math.floor(Math.random() * (o - u + 1));
        },
        randomitem: (a) => {
            const l = Array.isArray(a[0]) ? a[0] : (a[0] == null ? [] : [a[0]]);
            return l.length ? l[Math.floor(Math.random() * l.length)] : null;
        },
        shuffle: (a) => {
            const l = (Array.isArray(a[0]) ? a[0] : []).slice();
            for (let i = l.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [l[i], l[j]] = [l[j], l[i]];
            }
            return l;
        },
        groupkey: (a) => (a[0] && a[0][GRUPPE]) ? a[0].schluessel : null,
        groupitems: (a) => (a[0] && a[0][GRUPPE]) ? a[0].eintraege : [],
        groupcount: (a) => (a[0] && a[0][GRUPPE]) ? a[0].eintraege.length : 0,
        stddev: (a) => {
            const l = (Array.isArray(a[0]) ? a[0] : a).map(zahl).filter(isFinite);
            if (l.length < 2)
                return 0;
            const m = l.reduce((x, y) => x + y, 0) / l.length;
            return Math.sqrt(l.reduce((s, x) => s + (x - m) ** 2, 0) / (l.length - 1));
        },
        variance: (a) => {
            const l = (Array.isArray(a[0]) ? a[0] : a).map(zahl).filter(isFinite);
            if (l.length < 2)
                return 0;
            const m = l.reduce((x, y) => x + y, 0) / l.length;
            return l.reduce((s, x) => s + (x - m) ** 2, 0) / (l.length - 1);
        },
        percentile: (a) => {
            const l = (Array.isArray(a[0]) ? a[0] : []).map(zahl).filter(isFinite).sort((x, y) => x - y);
            if (!l.length)
                return 0;
            const p = Math.min(1, Math.max(0, zahl(a[1])));
            const i = (l.length - 1) * p, u = Math.floor(i), o = Math.ceil(i);
            const lu = l[u] ?? 0, lo = l[o] ?? 0;
            return u === o ? lu : lu + (lo - lu) * (i - u);
        },
        clamp: (a) => Math.min(Math.max(zahl(a[0]), zahl(a[1])), zahl(a[2])),
        roundto: (a) => { const f = Math.pow(10, Math.trunc(zahl(a[1]))); return Math.round(zahl(a[0]) * f) / f; },
        padstart: (a) => text(a[0]).padStart(Math.trunc(zahl(a[1])), text(a[2] || ' ')),
        padend: (a) => text(a[0]).padEnd(Math.trunc(zahl(a[1])), text(a[2] || ' ')),
        startswith: (a) => text(a[0]).startsWith(text(a[1])),
        endswith: (a) => text(a[0]).endsWith(text(a[1])),
        capitalize: (a) => { const s = text(a[0]); return s ? s[0].toUpperCase() + s.slice(1) : ''; },
        titlecase: (a) => text(a[0]).replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
        slug: (a) => text(a[0]).toLowerCase()
            .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        initials: (a) => text(a[0]).split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join(''),
        wordcount: (a) => (text(a[0]).match(/\S+/g) || []).length,
        truncate: (a) => {
            const s = text(a[0]), n = Math.trunc(zahl(a[1]));
            return s.length <= n ? s : s.slice(0, Math.max(0, n - 1)) + '…';
        },
        formatnumber: (a) => {
            const n = zahl(a[0]);
            if (!isFinite(n))
                return '';
            const art = text(a[1] || 'number').toLowerCase();
            const stellen = a.length > 2 ? Math.max(0, Math.min(20, zahl(a[2]))) : undefined;
            const WAEHRUNG = {
                usd: ['USD', 'en-US'], eur: ['EUR', 'de-DE'], chf: ['CHF', 'de-CH'],
                gbp: ['GBP', 'en-GB'], jpy: ['JPY', 'ja-JP'], try: ['TRY', 'tr-TR'],
                cad: ['CAD', 'en-CA'], aud: ['AUD', 'en-AU'], cny: ['CNY', 'zh-CN']
            };
            const opt = {};
            if (stellen !== undefined) {
                opt.minimumFractionDigits = stellen;
                opt.maximumFractionDigits = stellen;
            }
            try {
                const waehrung = WAEHRUNG[art];
                if (waehrung) {
                    const [w, loc] = waehrung;
                    return new Intl.NumberFormat(loc, { style: 'currency', currency: w, ...opt }).format(n);
                }
                if (art === 'percent' || art === 'prozent')
                    return new Intl.NumberFormat('de-CH', { style: 'percent', ...opt }).format(n);
                if (art === 'commas' || art === 'tausender')
                    return new Intl.NumberFormat('de-CH', { useGrouping: true, ...opt }).format(n);
                if (art === 'plain' || art === 'schlicht')
                    return new Intl.NumberFormat('de-CH', { useGrouping: false, ...opt }).format(n);
                if (/^[0-9]+$/.test(art))
                    return n.toFixed(Math.min(20, Number(art)));
                return new Intl.NumberFormat('de-CH', opt).format(n);
            }
            catch {
                return String(n);
            }
        },
        formatdate: (a) => {
            const d0 = alsDatum(a[0]);
            if (!d0)
                return '';
            const d = (a.length > 2 && text(a[2])) ? zonenWand(d0, text(a[2])) : d0;
            if (!d)
                return '';
            const f = text(a[1] || 'YYYY-MM-DD');
            const zwei = (n) => String(n).padStart(2, '0');
            const tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
            const kurz = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
            const woertlich = [];
            let vorlage = f.replace(/\[([^\]]*)\]/g, (_, inhalt) => {
                woertlich.push(inhalt);
                return '\u0001' + (woertlich.length - 1) + '\u0001';
            });
            return vorlage
                .replace(/YYYY/g, String(d.getFullYear()))
                .replace(/YY/g, String(d.getFullYear()).slice(-2))
                .replace(/MMMM/g, monate[d.getMonth()] ?? '')
                .replace(/MMM/g, (monate[d.getMonth()] ?? '').slice(0, 3))
                .replace(/MM/g, zwei(d.getMonth() + 1))
                .replace(/DD/g, zwei(d.getDate()))
                .replace(/dddd/g, tage[d.getDay()] ?? '')
                .replace(/ddd/g, kurz[d.getDay()] ?? '')
                .replace(/HH/g, zwei(d.getHours()))
                .replace(/mm/g, zwei(d.getMinutes()))
                .replace(/WW/g, zwei(F.week([d])))
                .replace(/\u0001(\d+)\u0001/g, (_, n) => woertlich[+n]);
        },
        style: (a) => text(a[0]),
        unstyle: (a) => text(a[0]),
        link: (a) => text(a[0]),
        id: () => '',
        name: (a) => text(a[0]),
        email: (a) => text(a[0])
    };
    Object.assign(F, {
        product: (a) => a.reduce((n, x) => n * zahl(x), 1),
        count: (a) => a.filter((x) => x !== null && x !== '' && !isNaN(Number(x))).length,
        counta: (a) => a.filter((x) => x !== null && x !== undefined && x !== '').length,
        power: (a) => Math.pow(zahl(a[0]), zahl(a[1])),
        rounddown: (a) => Math.trunc(zahl(a[0])),
        roundup: (a) => { const n = zahl(a[0]); return n < 0 ? Math.floor(n) : Math.ceil(n); },
        int: (a) => Math.floor(zahl(a[0])),
        time: (a) => {
            const zwei = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
            return zwei(zahl(a[0])) + ':' + zwei(zahl(a[1] ?? 0)) + ':' + zwei(zahl(a[2] ?? 0));
        },
        weekday: (a) => {
            const d = new Date(text(a[0]));
            return isNaN(d.getTime()) ? 0 : d.getUTCDay() + 1;
        },
        left: (a) => text(a[0]).slice(0, Math.max(0, Math.floor(zahl(a[1] ?? 1)))),
        right: (a) => {
            const n = Math.max(0, Math.floor(zahl(a[1] ?? 1)));
            return n === 0 ? '' : text(a[0]).slice(-n);
        },
        clean: (a) => text(a[0]).replace(/[\u0000-\u001F\u007F]/g, ''),
        search: (a) => text(a[0]) === '' ? 1
            : text(a[1]).toLowerCase().indexOf(text(a[0]).toLowerCase()) + 1,
        findtext: (a) => text(a[0]) === '' ? 1
            : text(a[1]).indexOf(text(a[0])) + 1,
        isnumber: (a) => typeof a[0] === 'number' && !isNaN(a[0]),
        istext: (a) => typeof a[0] === 'string'
    });
    const bedingung = (roh) => {
        if (typeof roh === 'number')
            return (x) => zahl(x) === roh;
        if (typeof roh === 'boolean')
            return (x) => wahr(x) === roh;
        const s = text(roh).trim();
        const m = s.match(/^(<>|>=|<=|=|>|<)\s*(.*)$/);
        const op = m ? m[1] : '=';
        const rest = m ? m[2] : s;
        const alsZahl = rest === '' ? NaN : Number(rest);
        const istZahl = !isNaN(alsZahl);
        if (op === '>' || op === '>=' || op === '<' || op === '<=') {
            if (!istZahl)
                return () => false;
            return (x) => {
                const n = Number(x);
                if (isNaN(n))
                    return false;
                return op === '>' ? n > alsZahl
                    : op === '>=' ? n >= alsZahl
                        : op === '<' ? n < alsZahl
                            : n <= alsZahl;
            };
        }
        const trifft = istZahl
            ? (x) => x !== null && x !== '' && Number(x) === alsZahl
            : (() => {
                if (!/[*?]/.test(rest)) {
                    const klein = rest.toLowerCase();
                    return (x) => text(x).toLowerCase() === klein;
                }
                const muster = '^' + rest.split('').map((c) => c === '*' ? '.*' :
                    c === '?' ? '.' :
                        c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$';
                const re = new RegExp(muster, 'i');
                return (x) => re.test(text(x));
            })();
        return op === '<>' ? (x) => !trifft(x) : trifft;
    };
    const treffer = (paare, laenge) => {
        const stellen = [];
        for (let i = 0; i < laenge; i++) {
            let alle = true;
            for (const [liste, pruefe] of paare) {
                if (i >= liste.length || !pruefe(liste[i])) {
                    alle = false;
                    break;
                }
            }
            if (alle)
                stellen.push(i);
        }
        return stellen;
    };
    const alsListe = (x) => Array.isArray(x) ? x : (x === null || x === undefined ? [] : [x]);
    const paareAus = (a, ab) => {
        const paare = [];
        for (let i = ab; i + 1 < a.length; i += 2)
            paare.push([alsListe(a[i]), bedingung(a[i + 1])]);
        return paare;
    };
    const laengsteListe = (paare) => paare.reduce((n, [l]) => Math.max(n, l.length), 0);
    Object.assign(F, {
        mid: (a) => {
            const s = text(a[0]);
            const von = Math.max(0, Math.floor(zahl(a[1])) - 1);
            return a[2] === undefined ? s.slice(von)
                : s.slice(von, von + Math.max(0, Math.floor(zahl(a[2]))));
        },
        concattext: (a) => a.map((x) => text(x)).join(''),
        textjoin: (a) => {
            const trenner = text(a[0]);
            const teile = [];
            for (let i = 1; i < a.length; i++) {
                for (const x of (Array.isArray(a[i]) ? a[i] : [a[i]])) {
                    const t = text(x);
                    if (t !== '')
                        teile.push(t);
                }
            }
            return teile.join(trenner);
        },
        datefromparts: (a) => {
            const zwei = (n) => String(Math.floor(n)).padStart(2, '0');
            const j = Math.floor(zahl(a[0]));
            const d = new Date(Date.UTC(j, Math.floor(zahl(a[1])) - 1, Math.floor(zahl(a[2]))));
            if (isNaN(d.getTime()))
                return '';
            return d.getUTCFullYear() + '-' + zwei(d.getUTCMonth() + 1) + '-' + zwei(d.getUTCDate());
        },
        replaceat: (a) => {
            const s = text(a[0]);
            const von = Math.max(0, Math.floor(zahl(a[1])) - 1);
            const wieViele = Math.max(0, Math.floor(zahl(a[2])));
            return s.slice(0, von) + text(a[3]) + s.slice(von + wieViele);
        },
        substitute: (a) => {
            const alt = text(a[1]);
            return alt === '' ? text(a[0]) : text(a[0]).split(alt).join(text(a[2]));
        },
        excelmod: (a) => {
            const t = zahl(a[1]);
            if (t === 0)
                return 0;
            return ((zahl(a[0]) % t) + t) % t;
        },
        excelround: (a) => {
            const n = zahl(a[0]);
            const stellen = a[1] === undefined ? 0 : Math.floor(zahl(a[1]));
            const f = Math.pow(10, stellen);
            const x = n * f;
            return (x < 0 ? -Math.round(-x) : Math.round(x)) / f;
        },
        matchpos: (a) => {
            const liste = Array.isArray(a[1]) ? a[1] : [a[1]];
            const gesucht = bedingung(a[0]);
            for (let i = 0; i < liste.length; i++)
                if (gesucht(liste[i]))
                    return i + 1;
            return 0;
        },
        textformat: (a) => {
            const muster = text(a[1]);
            if (!muster)
                return text(a[0]);
            const n = zahl(a[0]);
            if (muster.includes('%')) {
                const nach = (muster.split('.')[1] || '').replace(/[^0#]/g, '').length;
                return (n * 100).toFixed(nach) + '%';
            }
            if (/^[#,0]*\.?0*$/.test(muster)) {
                const nach = (muster.split('.')[1] || '').length;
                let s = n.toFixed(nach);
                if (muster.includes(',')) {
                    const [ganz, rest] = s.split('.');
                    s = (ganz ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '’') + (rest ? '.' + rest : '');
                }
                return s;
            }
            return text(a[0]);
        }
    });
    Object.assign(F, {
        countif: (a) => {
            const liste = alsListe(a[0]);
            return treffer([[liste, bedingung(a[1])]], liste.length).length;
        },
        countifs: (a) => {
            const paare = paareAus(a, 0);
            return treffer(paare, laengsteListe(paare)).length;
        },
        sumif: (a) => {
            const pruef = alsListe(a[0]);
            const summen = a[2] === undefined ? pruef : alsListe(a[2]);
            return treffer([[pruef, bedingung(a[1])]], pruef.length)
                .reduce((n, i) => n + zahl(summen[i]), 0);
        },
        sumifs: (a) => {
            const summen = alsListe(a[0]);
            const paare = paareAus(a, 1);
            return treffer(paare, laengsteListe(paare))
                .reduce((n, i) => n + zahl(summen[i]), 0);
        },
        averageif: (a) => {
            const pruef = alsListe(a[0]);
            const werte = a[2] === undefined ? pruef : alsListe(a[2]);
            const st = treffer([[pruef, bedingung(a[1])]], pruef.length);
            return st.length ? st.reduce((n, i) => n + zahl(werte[i]), 0) / st.length : 0;
        },
        averageifs: (a) => {
            const werte = alsListe(a[0]);
            const paare = paareAus(a, 1);
            const st = treffer(paare, laengsteListe(paare));
            return st.length ? st.reduce((n, i) => n + zahl(werte[i]), 0) / st.length : 0;
        },
        vlookup: (a) => {
            const zeilen = alsListe(a[1]);
            const spalte = Math.floor(zahl(a[2])) - 1;
            const gesucht = bedingung(a[0]);
            for (const zeile of zeilen) {
                const z = alsListe(zeile);
                if (z.length && gesucht(z[0]))
                    return spalte >= 0 && spalte < z.length ? z[spalte] : '';
            }
            return '';
        },
        hlookup: (a) => {
            const zeilen = alsListe(a[1]);
            const zeile = Math.floor(zahl(a[2])) - 1;
            const kopf = alsListe(zeilen[0]);
            const gesucht = bedingung(a[0]);
            for (let s = 0; s < kopf.length; s++) {
                if (gesucht(kopf[s])) {
                    const z = alsListe(zeilen[zeile]);
                    return zeile >= 0 && zeile < zeilen.length && s < z.length ? z[s] : '';
                }
            }
            return '';
        },
        xlookup: (a) => {
            const suchliste = alsListe(a[1]);
            const ergebnis = alsListe(a[2]);
            const gesucht = bedingung(a[0]);
            for (let i = 0; i < suchliste.length; i++)
                if (gesucht(suchliste[i]))
                    return i < ergebnis.length ? ergebnis[i] : '';
            return a[3] === undefined ? '' : a[3];
        },
        index: (a) => {
            const daten = alsListe(a[0]);
            const zeile = Math.floor(zahl(a[1])) - 1;
            if (zeile < 0 || zeile >= daten.length)
                return '';
            const z = daten[zeile];
            if (a[2] === undefined)
                return z;
            const spalte = Math.floor(zahl(a[2])) - 1;
            const zz = alsListe(z);
            return spalte >= 0 && spalte < zz.length ? zz[spalte] : '';
        }
    });
    const ALIAS = {
        'zählenwenn': 'countif',
        'zählenwenns': 'countifs',
        summewenn: 'sumif',
        summewenns: 'sumifs',
        mittelwertwenn: 'averageif',
        mittelwertwenns: 'averageifs',
        sverweis: 'vlookup',
        wverweis: 'hlookup',
        xverweis: 'xlookup',
        summe: 'sum',
        mittelwert: 'mean',
        wurzel: 'sqrt',
        rest: 'excelmod',
        runden: 'excelround',
        abrunden: 'rounddown',
        aufrunden: 'roundup',
        produkt: 'product',
        anzahl: 'count',
        anzahl2: 'counta',
        potenz: 'power',
        ganzzahl: 'int',
        wenn: 'if',
        wenns: 'ifs',
        wennfehler: 'iferror',
        istfehler: 'iserror',
        und: 'and',
        oder: 'or',
        nicht: 'not',
        zeit: 'time',
        wochentag: 'weekday',
        heute: 'today',
        jetzt: 'now',
        datum: 'datefromparts',
        jahr: 'year',
        monat: 'month',
        tag: 'date',
        kalenderwoche: 'week',
        links: 'left',
        rechts: 'right',
        'säubern': 'clean',
        suchen: 'search',
        finden: 'findtext',
        'länge': 'length',
        teil: 'mid',
        'glätten': 'trim',
        gross: 'upper',
        klein: 'lower',
        wechseln: 'substitute',
        ersetzen: 'replaceat',
        text: 'textformat',
        wert: 'tonumber',
        textkette: 'concattext',
        textverketten: 'textjoin',
        istleer: 'empty',
        istzahl: 'isnumber',
        isttext: 'istext',
        vergleich: 'matchpos',
        sortieren: 'sort',
        eindeutig: 'unique'
    };
    let EIGENE = {};
    const setzeBibliothek = (liste) => {
        EIGENE = {};
        const kaputt = [];
        (liste || []).forEach((f) => {
            if (!f || !f.name)
                return;
            try {
                EIGENE[String(f.name).toLowerCase()] = {
                    params: (f.params || []).map((x) => String(x)),
                    baum: parse(tokenize(f.koerper || '')),
                    beschreibung: f.beschreibung || ''
                };
            }
            catch (e) {
                kaputt.push(f.name + ': ' +
                    (e instanceof Error ? e.message : String(e)));
            }
        });
        cache.clear();
        return kaputt;
    };
    const bibliothek = () => Object.entries(EIGENE).map(([n, f]) => ({ name: n, params: f.params, beschreibung: f.beschreibung }));
    const evaluate = (knoten, ctx) => {
        switch (knoten.k) {
            case 'num': return knoten.v;
            case 'str': return knoten.v;
            case 'bool': return knoten.v;
            case 'null': return null;
            case 'list': return knoten.items.map((x) => evaluate(x, ctx));
            case 'var': return knoten.name in ctx.vars ? ctx.vars[knoten.name] : null;
            case 'neg': return -zahl(evaluate(knoten.a, ctx));
            case 'not': return !wahr(evaluate(knoten.a, ctx));
            case 'bin': {
                const { op } = knoten;
                if (op === 'and')
                    return wahr(evaluate(knoten.l, ctx)) && wahr(evaluate(knoten.r, ctx));
                if (op === 'or')
                    return wahr(evaluate(knoten.l, ctx)) || wahr(evaluate(knoten.r, ctx));
                const l = evaluate(knoten.l, ctx);
                const r = evaluate(knoten.r, ctx);
                if (op === '+') {
                    if (typeof l === 'string' || typeof r === 'string')
                        return text(l) + text(r);
                    return zahl(l) + zahl(r);
                }
                if (op === '-')
                    return zahl(l) - zahl(r);
                if (op === '*')
                    return zahl(l) * zahl(r);
                if (op === '/') {
                    if (zahl(r) === 0) {
                        if (ctx.streng)
                            throw new Error('#DIV/0!');
                        return 0;
                    }
                    return zahl(l) / zahl(r);
                }
                if (op === '%') {
                    if (zahl(r) === 0) {
                        if (ctx.streng)
                            throw new Error('#DIV/0!');
                        return 0;
                    }
                    return zahl(l) % zahl(r);
                }
                if (op === '^') {
                    const pot = Math.pow(zahl(l), zahl(r));
                    if (ctx.streng && !isFinite(pot))
                        throw new Error('#ZAHL!');
                    return pot;
                }
                if (op === '==')
                    return typeof l === typeof r ? l === r : text(l) === text(r);
                if (op === '!=')
                    return typeof l === typeof r ? l !== r : text(l) !== text(r);
                const beideZahlen = !isNaN(parseFloat(l)) && !isNaN(parseFloat(r));
                const a = beideZahlen ? zahl(l) : text(l);
                const b = beideZahlen ? zahl(r) : text(r);
                if (op === '>')
                    return a > b;
                if (op === '>=')
                    return a >= b;
                if (op === '<')
                    return a < b;
                if (op === '<=')
                    return a <= b;
                return null;
            }
            case 'call': {
                const n = ALIAS[knoten.name] || knoten.name;
                if (n === 'prop') {
                    if (knoten.args.length >= 2) {
                        const el = evaluate(knoten.args[0], ctx);
                        const feld = text(evaluate(knoten.args[1], ctx));
                        if (!ctx.fremd)
                            throw new Error('Hier lassen sich keine verknüpften Zeilen lesen');
                        return ctx.fremd(el, feld);
                    }
                    const feld = evaluate(knoten.args[0], ctx);
                    return ctx.props(text(feld));
                }
                if (n === 'if') {
                    return wahr(evaluate(knoten.args[0], ctx))
                        ? evaluate(knoten.args[1], ctx)
                        : (knoten.args[2] !== undefined ? evaluate(knoten.args[2], ctx) : '');
                }
                if (n === 'ifs') {
                    const as = knoten.args;
                    for (let i = 0; i + 1 < as.length; i += 2)
                        if (wahr(evaluate(as[i], ctx)))
                            return evaluate(as[i + 1], ctx);
                    return as.length % 2 ? evaluate(as[as.length - 1], ctx) : '';
                }
                if (n === 'iferror' || n === 'iserror') {
                    let wert;
                    try {
                        wert = evaluate(knoten.args[0], { ...ctx, streng: true });
                    }
                    catch (e) {
                        const satz = e instanceof Error ? e.message : String(e);
                        if (!satz.startsWith('#'))
                            throw e;
                        if (n === 'iserror')
                            return true;
                        return knoten.args[1] !== undefined ? evaluate(knoten.args[1], ctx) : '';
                    }
                    return n === 'iserror' ? false : wert;
                }
                if (n === 'let') {
                    const name = knoten.args[0].k === 'var' ? knoten.args[0].name : text(evaluate(knoten.args[0], ctx));
                    const wert = evaluate(knoten.args[1], ctx);
                    const neu = { ...ctx, vars: { ...ctx.vars, [name]: wert } };
                    return evaluate(knoten.args[2], neu);
                }
                if (n === 'lets') {
                    const as = knoten.args;
                    let neu = { ...ctx, vars: { ...ctx.vars } };
                    let i = 0;
                    for (; i + 2 < as.length; i += 2) {
                        const name = as[i].k === 'var' ? as[i].name : text(evaluate(as[i], neu));
                        neu.vars[name] = evaluate(as[i + 1], neu);
                    }
                    return evaluate(as[as.length - 1], neu);
                }
                if (['map', 'filter', 'find', 'some', 'every', 'findindex'].includes(n)) {
                    const liste = evaluate(knoten.args[0], ctx);
                    const arr = Array.isArray(liste) ? liste : (liste == null ? [] : [liste]);
                    const ausdruck = knoten.args[1];
                    const mit = (el, idx) => evaluate(ausdruck, {
                        ...ctx, vars: { ...ctx.vars, current: el, index: idx }
                    });
                    if (n === 'map')
                        return arr.map(mit);
                    if (n === 'filter')
                        return arr.filter((e, i) => wahr(mit(e, i)));
                    if (n === 'find')
                        return arr.find((e, i) => wahr(mit(e, i)));
                    if (n === 'findindex')
                        return arr.findIndex((e, i) => wahr(mit(e, i)));
                    if (n === 'some')
                        return arr.some((e, i) => wahr(mit(e, i)));
                    if (n === 'every')
                        return arr.every((e, i) => wahr(mit(e, i)));
                }
                if (['reduce', 'sortby', 'groupby'].includes(n)) {
                    const liste = evaluate(knoten.args[0], ctx);
                    const arr = Array.isArray(liste) ? liste : (liste == null ? [] : [liste]);
                    if (n === 'reduce') {
                        let acc = evaluate(knoten.args[1], ctx);
                        const ausdruck = knoten.args[2];
                        arr.forEach((el, i) => {
                            acc = evaluate(ausdruck, { ...ctx, vars: { ...ctx.vars, acc, current: el, index: i } });
                        });
                        return acc;
                    }
                    const schluessel = (el, i) => evaluate(knoten.args[1], { ...ctx, vars: { ...ctx.vars, current: el, index: i } });
                    if (n === 'sortby') {
                        const paare = arr.map((el, i) => ({ el, k: schluessel(el, i) }));
                        const absteigend = knoten.args[2] !== undefined && wahr(evaluate(knoten.args[2], ctx));
                        paare.sort((a, b) => {
                            const x = a.k, y = b.k;
                            const zahlen = !isNaN(parseFloat(x)) && !isNaN(parseFloat(y));
                            const v = zahlen ? zahl(x) - zahl(y) : text(x).localeCompare(text(y), 'de');
                            return absteigend ? -v : v;
                        });
                        return paare.map((p) => p.el);
                    }
                    const karte = new Map();
                    arr.forEach((el, i) => {
                        const k = text(schluessel(el, i));
                        if (!karte.has(k))
                            karte.set(k, []);
                        karte.get(k).push(el);
                    });
                    return [...karte.entries()].map(([k, v]) => ({ [GRUPPE]: true, schluessel: k, eintraege: v }));
                }
                if (['findrows', 'rows', 'countwhere', 'sumwhere', 'firstwhere', 'lastwhere', 'maxwhere', 'minwhere'].includes(n)) {
                    if (!ctx.db)
                        throw new Error('Hier lassen sich keine anderen Datenbanken lesen');
                    const name = text(evaluate(knoten.args[0], ctx));
                    const alle = ctx.db(name);
                    if (!alle)
                        throw new Error(`Datenbank nicht gefunden: ${name}`);
                    const bedingung = knoten.args[1];
                    const passt = bedingung === undefined ? alle : alle.filter((el, i) => wahr(evaluate(bedingung, { ...ctx, vars: { ...ctx.vars, current: el, index: i } })));
                    if (n === 'findrows' || n === 'rows')
                        return passt;
                    if (n === 'countwhere')
                        return passt.length;
                    if (n === 'firstwhere')
                        return passt.length ? passt[0] : null;
                    if (n === 'lastwhere')
                        return passt.length ? passt[passt.length - 1] : null;
                    const werte = passt.map((el, i) => knoten.args[2] === undefined ? 1
                        : zahl(evaluate(knoten.args[2], { ...ctx, vars: { ...ctx.vars, current: el, index: i } })));
                    if (n === 'sumwhere')
                        return werte.reduce((a, b) => a + b, 0);
                    if (n === 'maxwhere')
                        return werte.length ? Math.max(...werte) : 0;
                    if (n === 'minwhere')
                        return werte.length ? Math.min(...werte) : 0;
                }
                if (EIGENE[n]) {
                    const f = EIGENE[n];
                    if ((ctx.tiefe || 0) > 20)
                        throw new Error(`Eigene Funktion ${n}() ruft sich endlos selbst auf`);
                    const werte = knoten.args.map((x) => evaluate(x, ctx));
                    const neueVars = { ...ctx.vars };
                    f.params.forEach((pn, i) => { neueVars[pn] = werte[i]; });
                    return evaluate(f.baum, { ...ctx, vars: neueVars, tiefe: (ctx.tiefe || 0) + 1 });
                }
                const args = knoten.args.map((x) => evaluate(x, ctx));
                if (['rownumber', 'runningcount', 'previous', 'next', 'runningsum', 'runningmax', 'runningmin',
                    'rank', 'percentoftotal', 'total', 'average', 'rowcount', 'delta'].includes(n)) {
                    const z = ctx.zeile;
                    if (!z)
                        throw new Error('Das geht nur in einer Datenbankspalte');
                    const i = z.index();
                    if (n === 'rownumber' || n === 'runningcount')
                        return i + 1;
                    if (n === 'rowcount')
                        return z.anzahl();
                    const spalte = z.spalte(text(args[0] ?? ''));
                    if (n === 'previous')
                        return i > 0 ? spalte[i - 1] : null;
                    if (n === 'next')
                        return i + 1 < spalte.length ? spalte[i + 1] : null;
                    if (n === 'delta')
                        return i > 0 ? zahl(spalte[i]) - zahl(spalte[i - 1]) : 0;
                    const bisHier = spalte.slice(0, i + 1).map(zahl).filter((x) => isFinite(x));
                    if (n === 'runningsum')
                        return bisHier.reduce((a, b) => a + b, 0);
                    if (n === 'runningmax')
                        return bisHier.length ? Math.max(...bisHier) : 0;
                    if (n === 'runningmin')
                        return bisHier.length ? Math.min(...bisHier) : 0;
                    const alleZahlen = spalte.map(zahl).filter((x) => isFinite(x));
                    const summe = alleZahlen.reduce((a, b) => a + b, 0);
                    if (n === 'total')
                        return summe;
                    if (n === 'average')
                        return alleZahlen.length ? summe / alleZahlen.length : 0;
                    if (n === 'percentoftotal')
                        return summe === 0 ? 0 : zahl(spalte[i]) / summe;
                    if (n === 'rank') {
                        const meiner = zahl(spalte[i]);
                        const absteigend = args[1] === undefined ? true : wahr(args[1]);
                        return 1 + alleZahlen.filter((x) => absteigend ? x > meiner : x < meiner).length;
                    }
                }
                const fn = F[n];
                if (fn) {
                    if (ctx.streng) {
                        if (n === 'sqrt' && zahl(args[0]) < 0)
                            throw new Error('#ZAHL!');
                        if ((n === 'ln' || n === 'log10' || n === 'log2') && zahl(args[0]) <= 0)
                            throw new Error('#ZAHL!');
                    }
                    const erg = fn(args);
                    if (ctx.streng && typeof erg === 'number' && !isFinite(erg))
                        throw new Error('#ZAHL!');
                    return erg;
                }
                throw new Error(`Unbekannte Funktion: ${n}()`);
            }
        }
        return null;
    };
    const cache = new Map();
    const run = (src, propFn, fremdFn, umgebung) => {
        if (!src || !src.trim())
            return { ok: true, wert: '' };
        try {
            let baum = cache.get(src);
            if (!baum) {
                baum = parse(tokenize(src));
                cache.set(src, baum);
            }
            const wert = evaluate(baum, {
                props: propFn, fremd: fremdFn, vars: {},
                zeile: umgebung && umgebung.zeile,
                db: umgebung && umgebung.db,
                streng: !!(umgebung && umgebung.streng)
            });
            return { ok: true, wert };
        }
        catch (e) {
            return { ok: false, wert: '', fehler: e instanceof Error ? e.message : String(e) };
        }
    };
    const check = (src) => {
        if (!src || !src.trim())
            return { ok: true };
        try {
            parse(tokenize(src));
            return { ok: true };
        }
        catch (e) {
            return { ok: false, fehler: e instanceof Error ? e.message : String(e) };
        }
    };
    const anzeige = (wert) => {
        if (wert instanceof Date)
            return F.formatdate([wert, 'DD.MM.YYYY']);
        if (typeof wert === 'boolean')
            return wert ? '✅' : '☐';
        return text(wert);
    };
    const baumVon = (src) => parse(tokenize(src));
    const namen = () => [...Object.keys(F), ...Object.keys(ALIAS), ...Object.keys(EIGENE),
        'if', 'ifs', 'iferror', 'iserror', 'let', 'lets', 'map', 'filter', 'find', 'findindex', 'some', 'every', 'prop',
        'rownumber', 'runningcount', 'previous', 'next', 'runningsum', 'runningmax', 'runningmin',
        'rank', 'percentoftotal', 'total', 'average', 'rowcount', 'delta',
        'countwhere', 'sumwhere', 'findrows', 'firstwhere', 'lastwhere', 'maxwhere', 'minwhere',
        'random', 'randombetween', 'reduce', 'groupby', 'sortby',
        'businessdaysbetween', 'addbusinessdays', 'isweekend', 'converttimezone',
        'startofmonth', 'endofmonth', 'startofweek', 'endofweek',
        'startofquarter', 'endofquarter', 'startofyear', 'endofyear'];
    return { run, check, anzeige, text, zahl, wahr, F, setzeBibliothek, bibliothek,
        baumVon, tokenize, parse, namen };
})();
window.Formula = Formula;
