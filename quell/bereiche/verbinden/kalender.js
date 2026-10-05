"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/verbinden/kalender.ts (npm run bauen:ts). */
const Kalender = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const p2 = (n) => String(n).padStart(2, '0');
    const zeilenFalten = (text) => String(text || '')
        .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        .replace(/\n[ \t]/g, '');
    const entmaskieren = (s) => String(s || '')
        .replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
    const unbekannteZonen = new Set();
    const icsZeit = (roh, parameter) => {
        const v = String(roh || '').trim();
        const ganzerTag = /^\d{8}$/.test(v) || /VALUE=DATE(?!-TIME)/i.test(parameter || '');
        const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
        if (!m) {
            const d = new Date(v);
            return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
        }
        if (ganzerTag || !m[4])
            return `${m[1]}-${m[2]}-${m[3]}`;
        if (m[7]) {
            const d = new Date(Date.UTC(+(m[1] ?? 0), +(m[2] ?? 1) - 1, +(m[3] ?? 1), +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)));
            return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
                'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
        }
        const tz = /TZID=([^;:]+)/i.exec(String(parameter || ''));
        if (tz && tz[1]) {
            const zone = tz[1].trim().replace(/^"|"$/g, '');
            if (typeof Zeitzone !== 'undefined' && Zeitzone.kennt(zone)) {
                const um = Zeitzone.alsOrtszeit(+(m[1] ?? 0), +(m[2] ?? 1), +(m[3] ?? 1), +(m[4] ?? 0), +(m[5] ?? 0), zone);
                if (um)
                    return um;
            }
            else if (zone) {
                unbekannteZonen.add(zone);
            }
        }
        return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
    };
    const icsLesen = (text) => {
        unbekannteZonen.clear();
        const zeilen = zeilenFalten(text).split('\n');
        const termine = [];
        const aufgaben = [];
        let kalenderName = '';
        let jetzt = null;
        let inAlarm = false;
        let art = '';
        zeilen.forEach(z => {
            const roh = z.trim();
            if (!roh)
                return;
            if (roh === 'BEGIN:VEVENT') {
                jetzt = { alarme: [] };
                art = 'termin';
                return;
            }
            if (roh === 'END:VEVENT') {
                if (jetzt && jetzt.start)
                    termine.push(jetzt);
                jetzt = null;
                art = '';
                return;
            }
            if (roh === 'BEGIN:VTODO') {
                jetzt = { alarme: [], art: 'aufgabe' };
                art = 'aufgabe';
                return;
            }
            if (roh === 'END:VTODO') {
                if (jetzt && (jetzt.titel || jetzt.uid))
                    aufgaben.push(jetzt);
                jetzt = null;
                art = '';
                return;
            }
            if (roh === 'BEGIN:VALARM') {
                inAlarm = true;
                return;
            }
            if (roh === 'END:VALARM') {
                inAlarm = false;
                return;
            }
            const doppel = roh.indexOf(':');
            if (doppel < 0)
                return;
            const links = roh.slice(0, doppel);
            const inhalt = roh.slice(doppel + 1);
            const strich = links.indexOf(';');
            const name = (strich < 0 ? links : links.slice(0, strich)).toUpperCase();
            const parameter = strich < 0 ? '' : links.slice(strich + 1);
            if (!jetzt) {
                if (name === 'X-WR-CALNAME')
                    kalenderName = entmaskieren(inhalt);
                return;
            }
            if (inAlarm) {
                if (name === 'TRIGGER')
                    jetzt.alarme.push(inhalt);
                return;
            }
            switch (name) {
                case 'UID':
                    jetzt.uid = inhalt;
                    break;
                case 'SUMMARY':
                    jetzt.titel = entmaskieren(inhalt);
                    break;
                case 'DESCRIPTION':
                    jetzt.text = entmaskieren(inhalt);
                    break;
                case 'LOCATION':
                    jetzt.ort = entmaskieren(inhalt);
                    break;
                case 'URL':
                    jetzt.url = inhalt;
                    break;
                case 'STATUS':
                    jetzt.status = inhalt;
                    break;
                case 'ORGANIZER':
                    jetzt.wer = inhalt.replace(/^mailto:/i, '');
                    break;
                case 'CATEGORIES':
                    jetzt.kategorien = entmaskieren(inhalt).split(',').map(x => x.trim());
                    break;
                case 'RRULE':
                    jetzt.regel = inhalt;
                    break;
                case 'EXDATE':
                    jetzt.exdate = (jetzt.exdate || [])
                        .concat(inhalt.split(',').map((x) => x.trim())
                        .filter(Boolean));
                    break;
                case 'RDATE':
                    jetzt.rdate = (jetzt.rdate || [])
                        .concat(inhalt.split(',').map((x) => x.trim())
                        .filter(Boolean));
                    break;
                case 'DTSTART':
                    jetzt.start = icsZeit(inhalt, parameter);
                    jetzt.ganzerTag = jetzt.start.length === 10;
                    break;
                case 'DTEND':
                    jetzt.ende = icsZeit(inhalt, parameter);
                    break;
                case 'RECURRENCE-ID':
                    jetzt.ersetzt = icsZeit(inhalt, parameter);
                    break;
                case 'DURATION':
                    jetzt.dauer = inhalt;
                    break;
                case 'DUE':
                    if (art === 'aufgabe')
                        jetzt.faellig = icsZeit(inhalt, parameter);
                    break;
                case 'COMPLETED':
                    if (art === 'aufgabe')
                        jetzt.erledigtAm = icsZeit(inhalt, parameter);
                    break;
                case 'PERCENT-COMPLETE':
                    if (art === 'aufgabe')
                        jetzt.anteil = Math.max(0, Math.min(100, +inhalt || 0));
                    break;
                case 'PRIORITY':
                    if (art === 'aufgabe')
                        jetzt.prioritaet = +inhalt || 0;
                    break;
            }
            if (art === 'aufgabe' && name === 'STATUS')
                jetzt.fertig = /^COMPLETED$/i.test(inhalt.trim());
        });
        termine.forEach(t => {
            if (t.ganzerTag && t.ende && t.ende.length === 10) {
                const d = new Date(t.ende + 'T12:00');
                d.setDate(d.getDate() - 1);
                const zurueck = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
                t.ende = zurueck === t.start ? '' : zurueck;
            }
        });
        return { name: kalenderName, termine, aufgaben,
            zonenUnklar: [...unbekannteZonen] };
    };
    const DAUER_MUSTER = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
    const dauerInMs = (text) => {
        const m = DAUER_MUSTER.exec(String(text ?? '').trim().toUpperCase());
        if (!m)
            return null;
        if (m[1] === '-')
            return null;
        const ms = ((+(m[2] ?? 0) * 7 + +(m[3] ?? 0)) * 86400 +
            +(m[4] ?? 0) * 3600 + +(m[5] ?? 0) * 60 + +(m[6] ?? 0)) * 1000;
        return ms > 0 ? ms : null;
    };
    const terminLaenge = (t) => {
        if (t && t.start && t.ende) {
            const a = new Date(String(t.start)).getTime();
            const b = new Date(String(t.ende)).getTime();
            if (Number.isFinite(a) && Number.isFinite(b) && b > a)
                return b - a;
        }
        return dauerInMs(t && t.dauer);
    };
    const endeAus = (startIso, laenge, ganzerTag) => {
        if (!laenge || !startIso)
            return '';
        const d = new Date(startIso);
        if (!Number.isFinite(d.getTime()))
            return '';
        d.setTime(d.getTime() + laenge);
        if (ganzerTag)
            return d.toISOString().slice(0, 10);
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
            'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    };
    const wiederholungen = (termin, bisTage = 400) => {
        if (!termin.regel)
            return [termin];
        const W = window.Wiederholung;
        if (!W || typeof W.ausrollen !== 'function')
            return [termin];
        const erg = W.ausrollen(termin.start, termin.regel, {
            bisTage,
            exdate: termin.exdate || [],
            rdate: termin.rdate || [],
            ganzerTag: !!termin.ganzerTag
        });
        if (!erg.termine.length)
            return [termin];
        const laenge = terminLaenge(termin);
        return erg.termine.map((iso, i) => Object.assign({}, termin, {
            start: iso, folge: i > 0, folgeNr: i,
            ende: (iso === termin.start && termin.ende) ? termin.ende
                : endeAus(iso, laenge, !!termin.ganzerTag),
            regelUnklar: erg.nichtVerstanden.length ? erg.nichtVerstanden : undefined,
            regelSatz: erg.satz || undefined
        }));
    };
    const ausrollenAlle = (termine, bisTage = 400) => {
        const raus = [];
        const ersaetze = [];
        for (const t of termine || []) {
            if (t && t.ersetzt) {
                ersaetze.push(t);
                continue;
            }
            for (const x of wiederholungen(t, bisTage))
                raus.push(x);
        }
        for (const e of ersaetze) {
            const i = raus.findIndex((x) => String(x.uid || '') === String(e.uid || '') &&
                String(x.start || '') === String(e.ersetzt || ''));
            if (i >= 0) {
                const alt = raus[i];
                raus[i] = Object.assign({}, alt, e, { folgeNr: alt.folgeNr, folge: alt.folge, ersetzt: undefined });
            }
            else {
                raus.push(e);
            }
        }
        return raus;
    };
    const terminSchluessel = (t) => {
        const uid = String(t?.uid || ((t?.titel || '') + '|' + (t?.start || '')));
        const nr = Number(t?.folgeNr);
        if (!Number.isFinite(nr) || nr < 0)
            return uid;
        return uid + '#' + nr;
    };
    const maskieren = (s) => String(s ?? '')
        .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const alsIcsZeit = (v, ganzerTag) => {
        const s = String(v || '');
        if (!s)
            return '';
        if (ganzerTag || s.length <= 10)
            return s.replace(/-/g, '');
        const d = new Date(s);
        if (isNaN(d.getTime()))
            return s.replace(/[-:]/g, '').slice(0, 15);
        return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + 'T' +
            p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + '00Z';
    };
    const falten = (zeile) => {
        if (zeile.length <= 74)
            return zeile;
        const teile = [zeile.slice(0, 74)];
        let rest = zeile.slice(74);
        while (rest.length > 73) {
            teile.push(' ' + rest.slice(0, 73));
            rest = rest.slice(73);
        }
        if (rest)
            teile.push(' ' + rest);
        return teile.join('\r\n');
    };
    const icsSchreiben = (coll, view) => {
        const dk = (view && view.dateKey) ||
            Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
        if (!dk)
            throw new Error('Diese Datenbank hat keine Datums-Spalte.');
        const endeKey = view && view.endeKey && coll.schema[view.endeKey] ? view.endeKey : null;
        const ortKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'place') ||
            Object.keys(coll.schema).find(k => /ort|location/i.test(coll.schema[k].name));
        const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Redion//DE',
            'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
            'X-WR-CALNAME:' + maskieren(coll.name)];
        const alleZeilen = Store.rowsOf(coll.id);
        const regelKey = coll.schema && coll.schema.regel ? 'regel' : '';
        const reihen = new Map();
        if (regelKey) {
            alleZeilen.forEach((r) => {
                const u = String((r.props || {}).uid || '');
                const raute = u.lastIndexOf('#');
                if (raute <= 0 || !/^\d+$/.test(u.slice(raute + 1)))
                    return;
                const id = u.slice(0, raute);
                const nr = Number(u.slice(raute + 1));
                let e = reihen.get(id);
                if (!e) {
                    e = { kopf: null, folgen: new Map() };
                    reihen.set(id, e);
                }
                e.folgen.set(nr, r);
                if (nr === 0)
                    e.kopf = r;
            });
            for (const [id, e] of [...reihen])
                if (!e.kopf || !String(Datenbank.wert(e.kopf, 'regel', coll) || '').trim())
                    reihen.delete(id);
        }
        const inReihe = new Map();
        for (const [id, e] of reihen)
            for (const [nr, r] of e.folgen)
                inReihe.set(r.id, { id, nr });
        const W = window.Wiederholung;
        const schreibeTermin = (r, uid, zusatz = []) => {
            const start = Datenbank.wert(r, dk, coll);
            if (!start)
                return;
            const ganz = String(start).length <= 10;
            const ende = endeKey ? Datenbank.wert(r, endeKey, coll) : '';
            let ort = ortKey ? Datenbank.wert(r, ortKey, coll) : '';
            if (ort && typeof ort === 'object')
                ort = ort.name || '';
            let dtEnde = ende;
            if (ganz && ende) {
                const d = new Date(ende + 'T12:00');
                d.setDate(d.getDate() + 1);
                dtEnde = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
            }
            zeilen.push('BEGIN:VEVENT');
            zeilen.push('UID:' + uid);
            zeilen.push('DTSTAMP:' + alsIcsZeit(new Date().toISOString(), false));
            zeilen.push('DTSTART' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(start, ganz));
            if (dtEnde)
                zeilen.push('DTEND' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(dtEnde, ganz));
            zeilen.push('SUMMARY:' + maskieren(r.text || 'Ohne Titel'));
            if (ort)
                zeilen.push('LOCATION:' + maskieren(ort));
            for (const z of zusatz)
                zeilen.push(z);
            const rest = Object.keys(coll.schema)
                .filter(k => k !== dk && k !== endeKey && k !== regelKey &&
                coll.schema[k].type !== 'title')
                .map(k => coll.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(r, k, coll)))
                .filter(x => !/: *$|: *—$/.test(x));
            if (rest.length)
                zeilen.push('DESCRIPTION:' + maskieren(rest.join('\n')));
            zeilen.push('END:VEVENT');
        };
        for (const [id, e] of reihen) {
            const regel = String(Datenbank.wert(e.kopf, 'regel', coll) || '').trim();
            const kopfStart = String(Datenbank.wert(e.kopf, dk, coll) || '');
            const ganz = kopfStart.length <= 10;
            const soll = (W && typeof W.ausrollen === 'function')
                ? (W.ausrollen(kopfStart, regel, { bisTage: 4000, ganzerTag: ganz })
                    .termine || [])
                : [];
            const fehlend = [];
            const verschoben = [];
            soll.forEach((ur, nr) => {
                const zeile = e.folgen.get(nr);
                if (!zeile) {
                    fehlend.push(ur);
                    return;
                }
                if (nr === 0)
                    return;
                const ist = String(Datenbank.wert(zeile, dk, coll) || '');
                if (ist && ist !== ur)
                    verschoben.push({ r: zeile, ur });
            });
            const zusatz = ['RRULE:' + regel];
            for (const ur of fehlend)
                zusatz.push('EXDATE' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(ur, ganz));
            schreibeTermin(e.kopf, id, zusatz);
            for (const v of verschoben)
                schreibeTermin(v.r, id, ['RECURRENCE-ID' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(v.ur, ganz)]);
        }
        alleZeilen.forEach((r) => {
            if (inReihe.has(r.id))
                return;
            schreibeTermin(r, r.id + '@notizen');
        });
        zeilen.push('END:VCALENDAR');
        return zeilen.map(falten).join('\r\n');
    };
    const SCHEMA = () => ({
        title: { name: 'Termin', type: 'title' },
        start: { name: 'Beginn', type: 'date' },
        ende: { name: 'Ende', type: 'date' },
        ort: { name: 'Ort', type: 'place' },
        quelle: { name: 'Kalender', type: 'select', options: [] },
        text: { name: 'Notiz', type: 'text' },
        uid: { name: 'Kennung', type: 'text' },
        link: { name: 'Link', type: 'url' },
        regel: { name: 'Wiederholung', type: 'text' }
    });
    const zielDatenbank = (seiteId, name = 'Termine') => {
        const da = Object.values(Store.cache.collections)
            .find(c => c.name === name && c.schema.uid && c.schema.start);
        if (da) {
            if (!da.schema.regel) {
                da.schema.regel = { name: 'Wiederholung', type: 'text' };
                Store.updateCollection(da.id, { schema: da.schema });
            }
            return da;
        }
        const { collectionId } = Store.addDatabase(seiteId || App.aktuelleSeite(), name, SCHEMA(), 'calendar');
        const c = Store.getCollection(collectionId);
        const v = Store.getView(c.viewIds[0]);
        Store.updateView(v.id, { dateKey: 'start', endeKey: 'ende' });
        return c;
    };
    const AUFGABEN_SCHEMA = () => ({
        title: { name: 'Aufgabe', type: 'title' },
        aufgFertig: { name: 'Fertig', type: 'checkbox' },
        aufgFrist: { name: 'Frist', type: 'date' },
        aufgWer: { name: 'Zuständig', type: 'person' },
        quelle: { name: 'Kalender', type: 'select', options: [] },
        text: { name: 'Notiz', type: 'text' },
        uid: { name: 'Kennung', type: 'text' }
    });
    const aufgabenDatenbank = (seiteId, name = 'Kalender-Aufgaben') => {
        const anmelden = (c) => {
            const q = Store.getMeta('aufgabenQuellen', null) || [];
            if (!q.includes(c.id))
                Store.setMeta('aufgabenQuellen', [...q, c.id]);
            return c;
        };
        const da = Object.values(Store.cache.collections)
            .find(c => c.name === name && c.schema.uid && c.schema.aufgFertig);
        if (da)
            return anmelden(da);
        const { collectionId } = Store.addDatabase(seiteId || App.aktuelleSeite(), name, AUFGABEN_SCHEMA(), 'check');
        const c = Store.getCollection(collectionId);
        Store.updateCollection(c.id, { istAufgaben: true });
        return anmelden(Store.getCollection(c.id));
    };
    const aufgabenUebernehmen = (coll, aufgaben, quelle) => {
        const vorhanden = new Map();
        Store.rowsOf(coll.id).forEach((r) => {
            const u = (r.props || {}).uid;
            if (u)
                vorhanden.set(String(u), r);
        });
        if (quelle && coll.schema.quelle) {
            const opts = coll.schema.quelle.options || [];
            if (!opts.some((o) => o.name === quelle)) {
                const farben = ['blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow', 'brown'];
                opts.push({ name: quelle, color: farben[opts.length % farben.length] });
                coll.schema.quelle.options = opts;
                Store.updateCollection(coll.id, { schema: coll.schema });
            }
        }
        let neu = 0, frisch = 0;
        aufgaben.forEach((a) => {
            const u = String(a.uid || ((a.titel || '') + '|' + (a.faellig || '')));
            const props = {
                aufgFertig: !!a.fertig,
                aufgFrist: a.faellig || '',
                quelle: quelle || '',
                text: a.text || '',
                uid: u
            };
            const alt = vorhanden.get(u);
            if (alt) {
                Object.entries(props).forEach(([k, w]) => Store.setProp(alt.id, k, w));
                Store.updateBlock(alt.id, { text: a.titel || 'Ohne Titel' });
                frisch++;
            }
            else {
                const r = Store.addRow(coll.id, props);
                Store.updateBlock(r.id, { text: a.titel || 'Ohne Titel' });
                neu++;
            }
        });
        return { neu, frisch };
    };
    const uebernehmen = (coll, termine, quelle, vorherGeliefert) => {
        const vorhanden = new Map();
        const nachBeginn = new Map();
        Store.rowsOf(coll.id).forEach((r) => {
            const u = (r.props || {}).uid;
            if (!u)
                return;
            vorhanden.set(u, r);
            const roh = String(u).replace(/#\d+$/, '');
            const beg = (r.props || {}).start || '';
            if (beg)
                nachBeginn.set(roh + '|' + beg, r);
        });
        if (quelle && coll.schema.quelle) {
            const opts = coll.schema.quelle.options || [];
            if (!opts.some((o) => o.name === quelle)) {
                const farben = ['blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow', 'brown'];
                opts.push({ name: quelle, color: farben[opts.length % farben.length] });
                coll.schema.quelle.options = opts;
                Store.updateCollection(coll.id, { schema: coll.schema });
            }
        }
        const reihenImLauf = new Set();
        termine.forEach((t) => {
            const k = terminSchluessel(t);
            const raute = k.lastIndexOf('#');
            if (raute > 0)
                reihenImLauf.add(k.slice(0, raute));
        });
        let neu = 0, frisch = 0, umgezogen = 0;
        const belegt = new Set();
        const belegtSchluessel = new Set();
        termine.forEach((t) => {
            const schluessel = terminSchluessel(t);
            belegtSchluessel.add(schluessel);
            const props = {
                start: t.start || '', ende: t.ende || '',
                ort: t.ort ? { name: t.ort } : null,
                quelle: quelle || '', text: t.text || '',
                uid: schluessel, link: t.url || ''
            };
            if (coll.schema && coll.schema.regel)
                props.regel = (t.regel && Number(t.folgeNr) === 0) ? String(t.regel) : '';
            let alt = vorhanden.get(schluessel);
            if (alt && belegt.has(alt.id))
                alt = null;
            if (!alt) {
                const roh = String(t.uid || ((t.titel || '') + '|' + (t.start || '')));
                const kandidat = nachBeginn.get(roh + '|' + (t.start || ''));
                if (kandidat && !belegt.has(kandidat.id)) {
                    alt = kandidat;
                    umgezogen++;
                }
            }
            if (alt) {
                belegt.add(alt.id);
                Object.entries(props).forEach(([k, w]) => Store.setProp(alt.id, k, w));
                Store.updateBlock(alt.id, { text: t.titel || 'Ohne Titel' });
                frisch++;
            }
            else {
                const r = Store.addRow(coll.id, props);
                belegt.add(r.id);
                Store.updateBlock(r.id, { text: t.titel || 'Ohne Titel' });
                neu++;
            }
        });
        let entfallen = 0;
        if (reihenImLauf.size) {
            Store.rowsOf(coll.id).forEach((r) => {
                if (belegt.has(r.id))
                    return;
                const u = String((r.props || {}).uid || '');
                const raute = u.lastIndexOf('#');
                if (raute <= 0 || !/^\d+$/.test(u.slice(raute + 1)))
                    return;
                if (!reihenImLauf.has(u.slice(0, raute)))
                    return;
                Store.trashBlock(r.id);
                entfallen++;
            });
        }
        const geliefert = [...belegtSchluessel];
        if (termine.length && vorherGeliefert && vorherGeliefert.length) {
            const jetztDa = new Set(geliefert);
            const frueher = new Set(vorherGeliefert);
            Store.rowsOf(coll.id).forEach((r) => {
                if (belegt.has(r.id))
                    return;
                const u = String((r.props || {}).uid || '');
                if (!u || jetztDa.has(u) || !frueher.has(u))
                    return;
                Store.trashBlock(r.id);
                entfallen++;
            });
        }
        return { neu, frisch, umgezogen, entfallen, geliefert };
    };
    const abos = () => Store.getMeta('ics:abos', []) || [];
    const aboSpeichern = (liste) => Store.setMeta('ics:abos', liste);
    const adresseGerade = (u) => String(u || '').trim()
        .replace(/^webcal:\/\//i, 'https://');
    const aboHolen = async (abo) => {
        const url = adresseGerade(abo.url);
        let text;
        try {
            const r = await Verbindungen.ruf(url, { versuche: 2 });
            text = await r.text();
        }
        catch (e) {
            if (!Store.getMeta('verb:proxy', ''))
                throw e;
            const r = await Verbindungen.ruf(url, { versuche: 2, ueberBruecke: true });
            text = await r.text();
        }
        if (!/BEGIN:VCALENDAR/i.test(text))
            throw new Error('Unter dieser Adresse liegt kein Kalender.');
        const gelesen = icsLesen(text);
        const alle = ausrollenAlle(gelesen.termine);
        return { name: gelesen.name || abo.name || 'Abo', termine: alle,
            aufgaben: gelesen.aufgaben, zonenUnklar: gelesen.zonenUnklar || [] };
    };
    const alleAbosHolen = async (seiteId) => {
        const liste = abos().filter((a) => a.an !== false);
        if (!liste.length) {
            UI.toast('Kein Kalender abonniert');
            return;
        }
        const coll = zielDatenbank(seiteId);
        let neu = 0, frisch = 0, entfallen = 0, schief = [];
        const alleTermine = [];
        let offeneAufgaben = 0;
        const fremdeZonen = new Set();
        let aufgNeu = 0, aufgFrisch = 0;
        for (const a of liste) {
            try {
                const k = await aboHolen(a);
                const e = uebernehmen(coll, k.termine, a.name || k.name, Array.isArray(a.geliefert) ? a.geliefert : undefined);
                if (k.termine.length)
                    a.geliefert = e.geliefert;
                alleTermine.push(...k.termine);
                offeneAufgaben += (k.aufgaben || []).filter((x) => !x.fertig).length;
                for (const z of (k.zonenUnklar || []))
                    fremdeZonen.add(String(z));
                if ((k.aufgaben || []).length) {
                    const ac = aufgabenDatenbank(seiteId);
                    const ae = aufgabenUebernehmen(ac, k.aufgaben, a.name || k.name);
                    aufgNeu += ae.neu;
                    aufgFrisch += ae.frisch;
                }
                neu += e.neu;
                frisch += e.frisch;
                entfallen += e.entfallen || 0;
                a.zuletzt = Store.now();
            }
            catch (err) {
                schief.push((a.name || a.url) + ': ' +
                    (err instanceof Error ? err.message : String(err)));
            }
        }
        aboSpeichern(abos());
        App.zeichneSeite();
        if (schief.length)
            UI.banner('Nicht geklappt — ' + schief.join(' · '), 'warn');
        if (fremdeZonen.size)
            UI.banner('Diese Zeitzonen kennt dein Browser nicht: ' +
                [...fremdeZonen].join(', ') + '. Die Termine daraus stehen mit der ' +
                'Uhrzeit da, die in der Datei steht — ohne Umrechnung.', 'warn');
        const unklar = new Set();
        for (const t of alleTermine)
            for (const x of (t.regelUnklar || []))
                unklar.add(String(x));
        if (unklar.size)
            UI.banner('Ein Teil der Wiederholungsregeln blieb ungelesen: ' +
                [...unklar].join(', ') + '. Die Termine daraus fehlen.', 'warn');
        if (aufgNeu || aufgFrisch)
            UI.banner((aufgNeu ? aufgNeu + (aufgNeu === 1 ? ' Aufgabe neu' : ' Aufgaben neu') : '') +
                (aufgNeu && aufgFrisch ? ', ' : '') +
                (aufgFrisch ? aufgFrisch + ' aufgefrischt' : '') +
                ' — unter <b>Meine Aufgaben</b>, nicht im Kalender. Eine Aufgabe mit ' +
                'Frist ist kein Termin, und sie in die Kalendertabelle zu schreiben ' +
                'hiesse, sie als Verabredung auszugeben.' +
                (offeneAufgaben ? ' Davon ' + offeneAufgaben +
                    (offeneAufgaben === 1 ? ' noch offen.' : ' noch offen.') : ''), 'info');
        if (entfallen)
            UI.banner(entfallen + (entfallen === 1
                ? ' Termin steht nicht mehr im Kalender der Quelle und liegt jetzt '
                : ' Termine stehen nicht mehr im Kalender der Quelle und liegen jetzt ') +
                'im Papierkorb. Von dort holst du sie zurück, falls das ein Irrtum war.', 'info');
        UI.toast(neu + ' neu, ' + frisch + ' aufgefrischt');
    };
    const GC = 'https://www.googleapis.com/calendar/v3';
    const googleKalender = async () => {
        const token = await Verbindungen.googleZugang(['profil', 'kalender']);
        const d = await Verbindungen.jsonRuf(GC + '/users/me/calendarList?maxResults=50', { token });
        return (d.items || []).map((c) => ({
            id: c.id, name: c.summary, farbe: c.backgroundColor,
            standard: !!c.primary, rolle: c.accessRole
        }));
    };
    const googleTermine = async (kalenderId, vonTagen = -30, bisTagen = 180) => {
        const token = await Verbindungen.googleZugang(['profil', 'kalender']);
        const von = new Date();
        von.setDate(von.getDate() + vonTagen);
        const bis = new Date();
        bis.setDate(bis.getDate() + bisTagen);
        const url = GC + '/calendars/' + encodeURIComponent(kalenderId) + '/events' +
            '?singleEvents=true&orderBy=startTime&maxResults=500' +
            '&timeMin=' + encodeURIComponent(von.toISOString()) +
            '&timeMax=' + encodeURIComponent(bis.toISOString());
        const d = await Verbindungen.jsonRuf(url, { token });
        return (d.items || []).map((e) => ({
            uid: e.id, titel: e.summary || 'Ohne Titel',
            text: e.description || '', ort: e.location || '',
            url: e.htmlLink || '',
            start: e.start?.date || (e.start?.dateTime || '').slice(0, 16),
            ende: e.end?.date || (e.end?.dateTime || '').slice(0, 16),
            ganzerTag: !!e.start?.date
        }));
    };
    const nachGoogle = async (row, coll, kalenderId = 'primary') => {
        const token = await Verbindungen.googleZugang(['profil', 'kalender']);
        const dk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
        if (!dk)
            throw new Error('Ohne Datums-Spalte gibt es keinen Termin.');
        const start = String(Datenbank.wert(row, dk, coll) || '');
        if (!start)
            throw new Error('Dieser Eintrag hat kein Datum.');
        const ganz = start.length <= 10;
        const endeKey = Object.keys(coll.schema).find(k => k !== dk && coll.schema[k].type === 'date');
        let ende = endeKey ? String(Datenbank.wert(row, endeKey, coll) || '') : '';
        if (!ende) {
            if (ganz)
                ende = start;
            else {
                const d = new Date(start);
                d.setHours(d.getHours() + 1);
                ende = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
                    'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
            }
        }
        let gEnde = ende;
        if (ganz) {
            const d = new Date(ende + 'T12:00');
            d.setDate(d.getDate() + 1);
            gEnde = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        }
        const koerper = {
            summary: row.text || 'Ohne Titel',
            description: 'Aus Redion übernommen',
            start: ganz ? { date: start } : { dateTime: new Date(start).toISOString() },
            end: ganz ? { date: gEnde } : { dateTime: new Date(gEnde).toISOString() }
        };
        const ortKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'place');
        if (ortKey) {
            const o = Datenbank.wert(row, ortKey, coll);
            if (o)
                koerper.location = typeof o === 'object' ? (o.name || '') : String(o);
        }
        const vorhandene = (row.props || {}).uid;
        const url = GC + '/calendars/' + encodeURIComponent(kalenderId) + '/events' +
            (vorhandene ? '/' + encodeURIComponent(vorhandene) : '');
        const d = await Verbindungen.jsonRuf(url, {
            token, method: vorhandene ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(koerper)
        });
        if (coll.schema.uid)
            Store.setProp(row.id, 'uid', d.id);
        return d;
    };
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(720px,95vw)">' +
            '<div class="fh">📅 Kalender verbinden<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div id="kb" style="padding:4px 18px 16px; max-height:72vh; overflow:auto"></div>' +
            '<div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const z = Verbindungen.zustand();
            const kasten = o.querySelector('#kb');
            if (!kasten)
                return;
            kasten.innerHTML =
                '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>🔵</span><b>Google Kalender</b>' +
                    `<span class="verb-status ${z.google.verbunden ? 'an' : ''}">` +
                    `${z.google.verbunden ? 'verbunden' : 'nicht verbunden'}</span></div>` +
                    '<div class="verb-text">Liest deine Kalender und schreibt Termine zurück. ' +
                    'Braucht die Client-ID aus den Verbindungen.</div>' +
                    '<div class="verb-knoepfe"><button data-a="g-liste">Kalender zeigen</button>' +
                    '<button data-a="g-hol">Termine holen</button>' +
                    '<button data-a="g-setup">Verbindungen öffnen</button></div>' +
                    '<div id="gliste"></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>📡</span><b>Abonnierte Kalender</b>' +
                    `<span class="verb-status ${abos().length ? 'an' : ''}">${abos().length}</span></div>` +
                    '<div class="verb-text">Jede ICS-Adresse — iCloud, Outlook, Feiertage, Sportpläne. ' +
                    'Bei iCloud: Kalender freigeben, „Öffentlicher Kalender" anhaken, Adresse kopieren.</div>' +
                    (abos().length
                        ? '<div class="abo-liste">' + abos().map((a, i) => `<div class="abo-zeile"><span class="frei-kreis bg-${a.farbe || 'blue'}">📅</span>` +
                            `<span class="frei-name"><b>${esc(a.name || 'Ohne Namen')}</b>` +
                            `<span>${esc(a.url).slice(0, 60)}…${a.zuletzt ? ' · zuletzt ' + esc(String(a.zuletzt).slice(0, 10)) : ''}</span></span>` +
                            `<button data-an="${i}" title="Ein oder aus">${a.an === false ? '☐' : '☑'}</button>` +
                            `<button data-weg="${i}" data-loeschknopf="Entfernen" title="Kalender-Abo entfernen">🗑</button></div>`).join('') + '</div>'
                        : '') +
                    '<div class="verb-knoepfe"><button data-a="abo-neu">＋ Adresse eintragen</button>' +
                    '<button data-a="abo-hol">Jetzt abgleichen</button>' +
                    '<button data-a="ics-datei">ICS-Datei einlesen</button></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>⭳</span><b>Eigene Termine ausgeben</b></div>' +
                    '<div class="verb-text">Legt eine .ics-Datei an, die sich in Google, iCloud, ' +
                    'Outlook und Thunderbird einlesen lässt.</div>' +
                    '<div class="verb-knoepfe"><button data-a="ics-raus">Als ICS speichern</button></div>' +
                    '</div>';
        };
        zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const an = elVon(e)?.closest('[data-an]');
            if (an) {
                const l = abos();
                const eintrag = l[Number(an.dataset.an)];
                if (eintrag) {
                    eintrag.an = eintrag.an === false;
                    aboSpeichern(l);
                    zeichne();
                }
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const l = abos();
                l.splice(Number(weg.dataset.weg), 1);
                aboSpeichern(l);
                zeichne();
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            try {
                if (a === 'g-setup') {
                    o.remove();
                    Verbindungen.dialog();
                    return;
                }
                if (a === 'g-liste') {
                    const liste = await googleKalender();
                    const gliste = o.querySelector('#gliste');
                    if (!gliste)
                        return;
                    gliste.innerHTML = '<div class="abo-liste">' + liste.map((k) => `<div class="abo-zeile"><span class="frei-kreis" style="background:${esc(k.farbe || '#888')}">📅</span>` +
                        `<span class="frei-name"><b>${esc(k.name)}${k.standard ? ' · Standard' : ''}</b>` +
                        `<span>${esc(k.rolle)}</span></span>` +
                        `<button data-gk="${esc(k.id)}">Holen</button></div>`).join('') + '</div>';
                    return;
                }
                const gk = elVon(e)?.closest('[data-gk]');
                if (gk || a === 'g-hol') {
                    const id = (gk ? gk.dataset.gk : 'primary') ?? 'primary';
                    const termine = await googleTermine(id);
                    const coll = zielDatenbank();
                    const erg = uebernehmen(coll, termine, 'Google' + (gk ? ' · ' + id.slice(0, 20) : ''));
                    App.zeichneSeite();
                    UI.toast(erg.neu + ' neu, ' + erg.frisch + ' aufgefrischt');
                    return;
                }
                if (a === 'abo-neu') {
                    const url = await UI.frage('Adresse des Kalenders (ICS oder webcal)', '');
                    if (!url)
                        return;
                    const name = await UI.frage('Wie soll er heissen?', 'Kalender');
                    const l = abos();
                    l.push({ url: url.trim(), name: name || 'Kalender', an: true,
                        farbe: ['blue', 'green', 'orange', 'purple'][l.length % 4] });
                    aboSpeichern(l);
                    zeichne();
                    UI.toast('Eingetragen — jetzt abgleichen');
                    return;
                }
                if (a === 'abo-hol') {
                    await alleAbosHolen();
                    zeichne();
                    return;
                }
                if (a === 'ics-datei') {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.accept = '.ics,text/calendar';
                    inp.multiple = true;
                    inp.addEventListener('change', async () => {
                        const coll = zielDatenbank();
                        let neu = 0, frisch = 0, entfallen = 0;
                        for (const f of Array.from(inp.files ?? [])) {
                            const text = await f.text();
                            const k = icsLesen(text);
                            const alle = ausrollenAlle(k.termine);
                            const erg = uebernehmen(coll, alle, k.name || f.name.replace(/\.ics$/i, ''));
                            neu += erg.neu;
                            frisch += erg.frisch;
                            entfallen += erg.entfallen || 0;
                        }
                        App.zeichneSeite();
                        if (entfallen)
                            UI.banner(entfallen + (entfallen === 1 ? ' Termin liegt' : ' Termine liegen') +
                                ' jetzt im Papierkorb — die Datei führt sie nicht mehr.', 'info');
                        UI.toast(neu + ' Termine übernommen, ' + frisch + ' aufgefrischt');
                    });
                    inp.click();
                    return;
                }
                if (a === 'ics-raus') {
                    const dbs = Object.values(Store.cache.collections)
                        .filter(c => Object.values(c.schema).some(d => d.type === 'date'));
                    if (!dbs.length) {
                        UI.toast('Keine Datenbank mit Datum gefunden');
                        return;
                    }
                    const r = b.getBoundingClientRect();
                    const m = UI.menu('<div class="grp">Welche Datenbank?</div>' +
                        dbs.map(c => `<button data-c="${c.id}">${esc(c.name || 'Ohne Namen')}</button>`).join(''), r.left, r.bottom + 4);
                    m.addEventListener('click', ev => {
                        const c = ev.target instanceof Element
                            ? ev.target.closest('button[data-c]') : null;
                        if (!c)
                            return;
                        m.remove();
                        const coll = Store.getCollection(c.dataset.c);
                        const text = icsSchreiben(coll, Store.getView(coll.viewIds[0]));
                        const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
                        const a2 = document.createElement('a');
                        a2.href = URL.createObjectURL(blob);
                        a2.download = (coll.name || 'kalender').replace(/[^\w\-]+/g, '-') + '.ics';
                        a2.click();
                        setTimeout(() => URL.revokeObjectURL(a2.href), 4000);
                        UI.toast('ICS gespeichert');
                    });
                    return;
                }
            }
            catch (err) {
                UI.banner(err instanceof Error ? err.message : String(err), 'warn');
            }
        });
    };
    return { icsLesen, icsSchreiben, icsZeit, wiederholungen, ausrollenAlle,
        terminSchluessel, dauerInMs, terminLaenge, endeAus,
        zielDatenbank, uebernehmen,
        abos, aboHolen, alleAbosHolen, adresseGerade,
        aufgabenDatenbank, aufgabenUebernehmen,
        googleKalender, googleTermine, nachGoogle, dialog };
})();
window.Kalender = Kalender;
