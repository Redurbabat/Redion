"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/abgleich/maschine.ts (npm run bauen:ts). */
const Wolke = (() => {
    const serverAdressePruefen = (wert) => {
        const roh = String(wert ?? '').trim();
        if (!roh)
            return '';
        try {
            const u = new URL(roh);
            const lokal = u.protocol === 'http:' && location.protocol === 'http:' &&
                /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(u.hostname);
            if (u.protocol !== 'https:' && !lokal)
                return '';
            if (u.username || u.password || u.search || u.hash || u.pathname !== '/')
                return '';
            return u.origin;
        }
        catch {
            return '';
        }
    };
    const adresse = () => {
        const eigen = Store.getMeta('wolkeAdresse', '');
        if (eigen)
            return serverAdressePruefen(eigen);
        if (location.protocol === 'http:' || location.protocol === 'https:')
            return location.origin;
        return '';
    };
    const SERVER_DATEI_MAX = (typeof KONSTANTEN !== 'undefined' && Number(KONSTANTEN.SERVER_DATEI_MAX)) ||
        100 * 1024 * 1024;
    const token = () => Store.getMeta('wolkeToken', '');
    const bereich = () => Store.getMeta('wolkeBereich', '');
    const angemeldet = () => !!token();
    const geraeteName = () => {
        let n = Store.getMeta('wolkeGeraet', '');
        if (n)
            return n;
        const p = navigator.platform || '';
        const mobil = /iPhone|iPad|Android/i.test(navigator.userAgent);
        n = (mobil ? 'Telefon' : 'Rechner') + (p ? ' (' + p + ')' : '');
        Store.setMeta('wolkeGeraet', n);
        return n;
    };
    const ruf = async (weg, opt = {}) => {
        const wurzel = adresse();
        if (!wurzel)
            throw new Error('Kein sicherer Redion-Server eingerichtet. In „Wolke“ eine gültige HTTPS-Serveradresse eintragen.');
        const kopf = { 'Content-Type': 'application/json',
            'Redion-Geraet': geraeteName(), ...(opt.kopf || {}) };
        if (token() && !kopf.Authorization)
            kopf.Authorization = 'Bearer ' + token();
        let a;
        try {
            a = await fetch(wurzel + weg, opt.k
                ? { method: opt.m || 'GET', headers: kopf, body: JSON.stringify(opt.k) }
                : { method: opt.m || 'GET', headers: kopf });
        }
        catch {
            throw new Error('Der Server ist nicht erreichbar. ' +
                'Deine Notizen sind trotzdem da — sie liegen auf diesem Gerät.');
        }
        const text = await a.text();
        let b;
        try {
            b = text ? JSON.parse(text) : {};
        }
        catch {
            b = { text };
        }
        if (a.status === 401 && token()) {
            Store.setMeta('wolkeToken', '');
            zustand.angemeldet = false;
            melden();
            throw new Error('Die Anmeldung ist abgelaufen. Bitte noch einmal anmelden.');
        }
        if (a.status >= 400)
            throw new Error(b.message || b.error || ('Fehler ' + a.status));
        return b;
    };
    const geraeteZugangErreichbar = async () => {
        const server = adresse();
        if (!server)
            return false;
        const antwort = await fetch(server + '/konto/ich', {
            credentials: 'omit', redirect: 'error', cache: 'no-store'
        });
        if (antwort.status !== 401)
            return false;
        return (await antwort.json())?.code === 'unauthorized';
    };
    let schluessel = null;
    const schluesselAus = async (satz, salz) => {
        const roh = await crypto.subtle.importKey('raw', new TextEncoder().encode(satz), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode(salz),
            iterations: 310000, hash: 'SHA-256' }, roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    };
    const salzHolen = () => {
        const konto = Store.getMeta('wolkeKonto', null);
        if (konto && konto.id)
            return 'redion:' + konto.id;
        const gemerkt = Store.getMeta('wolkeSalz', '');
        if (gemerkt)
            return gemerkt;
        const s = [...crypto.getRandomValues(new Uint8Array(16))]
            .map(x => x.toString(16).padStart(2, '0')).join('');
        Store.setMeta('wolkeSalz', s);
        return s;
    };
    const schluesselSetzen = async (satz) => {
        if (!satz) {
            schluessel = null;
            return false;
        }
        schluessel = await schluesselAus(satz, salzHolen());
        const probe = Store.getMeta('wolkeProbe', '');
        if (probe) {
            const auf = await entschluessele(probe);
            if (auf !== 'redion') {
                schluessel = null;
                return false;
            }
        }
        else {
            Store.setMeta('wolkeProbe', await verschluessele('redion'));
        }
        return true;
    };
    const hatSchluessel = () => !!schluessel;
    const schluesselFehlt = () => !!Store.getMeta('wolkeProbe', '') && !schluessel;
    const SCHLUESSEL_FEHLT = 'Der Schlüssel fehlt — nach einem Neustart im Wolke-Fenster ' +
        '„Schlüssel setzen“. Bis dahin verlässt nichts dieses Gerät.';
    const wacheSchluessel = () => { if (schluesselFehlt())
        throw new Error(SCHLUESSEL_FEHLT); };
    const verschluessele = async (text) => {
        if (!schluessel)
            throw new Error('Es ist kein Schlüssel gesetzt.');
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const daten = new TextEncoder().encode(String(text));
        const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, schluessel, daten);
        const alles = new Uint8Array(iv.length + chiffre.byteLength);
        alles.set(iv);
        alles.set(new Uint8Array(chiffre), iv.length);
        return Bytes.toBase64(alles);
    };
    const entschluessele = async (paket) => {
        if (!schluessel)
            return null;
        try {
            const roh = Bytes.fromBase64(paket);
            const iv = roh.slice(0, 12);
            const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, schluessel, roh.slice(12));
            return new TextDecoder().decode(klar);
        }
        catch {
            return null;
        }
    };
    const zustand = { angemeldet: false, laeuft: false, letzter: '', fehler: '',
        hoch: 0, runter: 0, konto: null, rolle: '' };
    const horcher = new Set();
    const melden = () => {
        zustand.frage = neuAbgleichOffen();
        horcher.forEach((fn) => { try {
            fn(zustand);
        }
        catch { } });
    };
    const beiAenderung = (fn) => { horcher.add(fn); fn(zustand); return () => horcher.delete(fn); };
    const anmeldenMit = (anbieter) => new Promise((fertig, schief) => {
        const wurzel = adresse();
        if (!wurzel) {
            schief(new Error('Kein Server erreichbar.'));
            return;
        }
        const fenster = window.open(wurzel + '/konto/oauth/' + anbieter + '?zurueck=' + encodeURIComponent(wurzel), 'redion-anmeldung', 'width=520,height=680');
        if (!fenster) {
            schief(new Error('Das Anmeldefenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.'));
            return;
        }
        let serverUrsprung;
        try {
            serverUrsprung = new URL(wurzel).origin;
        }
        catch {
            serverUrsprung = '';
        }
        const uhr = setTimeout(() => { aufraeumen(); schief(new Error('Zeit abgelaufen.')); }, 180000);
        const beiPost = async (e) => {
            if (!serverUrsprung || e.origin !== serverUrsprung)
                return;
            const d = e.data || {};
            if (d.art !== 'redion-anmeldung' || !d.token)
                return;
            aufraeumen();
            await tokenUebernehmen(d.token);
            fertig(zustand.konto);
        };
        const aufraeumen = () => {
            clearTimeout(uhr);
            window.removeEventListener('message', beiPost);
            try {
                fenster.close();
            }
            catch { }
        };
        window.addEventListener('message', beiPost);
    });
    const accessMoeglich = () => location.protocol === 'https:' && adresse() === location.origin;
    const anmeldenMitAccess = async () => {
        if (!accessMoeglich())
            throw new Error('Die Access-Anmeldung geht nur auf der Redion-Website selbst.');
        let a;
        try {
            a = await fetch(location.origin + '/konto/access', {
                method: 'POST', credentials: 'same-origin', redirect: 'manual',
                headers: { 'Content-Type': 'application/json' }, body: '{}'
            });
        }
        catch {
            throw new Error('Die Cloudflare-Anmeldung konnte nicht geladen werden. ' +
                'Öffne Redion direkt im Browser und versuche es erneut.');
        }
        if (a.type === 'opaqueredirect')
            throw new Error('Die Cloudflare-Sitzung muss erneuert werden. ' +
                'Lade die Redion-Seite im Browser neu und melde dich bei Cloudflare an.');
        let b = null;
        try {
            b = await a.json();
        }
        catch { }
        if (!a.ok || !b || typeof b.token !== 'string')
            throw new Error((b && b.message) || 'Die Anmeldung über Cloudflare Access hat nicht geklappt.');
        return tokenUebernehmen(b.token);
    };
    const codeHolen = async () => ruf('/konto/code', { m: 'POST', k: { geraet: geraeteName() } });
    const codeWarten = async (code, beiSchritt) => {
        const bis = Date.now() + 10 * 60000;
        while (Date.now() < bis) {
            await new Promise(r => setTimeout(r, 2500));
            try {
                const a = await fetch(adresse() + '/konto/code-holen', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                if (a.status === 200) {
                    const b = await a.json();
                    await tokenUebernehmen(b.token);
                    return zustand.konto;
                }
                if (a.status !== 202)
                    throw new Error((await a.json()).message || 'Fehler');
            }
            catch (e) {
                if (!/202/.test(String(e))) {
                    if (beiSchritt)
                        beiSchritt(e instanceof Error ? e.message : String(e));
                }
            }
            if (beiSchritt)
                beiSchritt('');
        }
        throw new Error('Der Code ist abgelaufen. Bitte einen neuen holen.');
    };
    const codeFreigeben = (code) => ruf('/konto/code-freigeben', { m: 'POST', k: { code } });
    const tokenUebernehmen = async (t) => {
        Store.setMeta('wolkeToken', t);
        const ich = await ruf('/konto/ich');
        zustand.angemeldet = true;
        zustand.konto = ich.konto;
        if (!bereich() && ich.bereiche.length)
            Store.setMeta('wolkeBereich', ich.bereiche[0].id);
        Store.setMeta('wolkeKonto', ich.konto);
        takt();
        melden();
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('konto', 'Bei der Wolke angemeldet als ' + ich.konto.name);
        return ich;
    };
    const kontoLoeschen = async () => {
        const a = await ruf('/konto/loeschen', { m: 'POST' });
        await abmelden();
        return a;
    };
    const abmelden = async () => {
        try {
            await ruf('/konto/abmelden', { m: 'POST' });
        }
        catch { }
        Store.setMeta('wolkeToken', '');
        zustand.angemeldet = false;
        zustand.konto = null;
        schluessel = null;
        try {
            await Store.basisLeeren();
        }
        catch { }
        Store.setMeta('wolkeMarkeHoch', '');
        Store.setMeta('wolkeMarkeRunter', '');
        Store.setMeta('wolkeMarkeDateien', '');
        Store.setMeta('wolkeDateienOben', []);
        Store.setMeta('wolkeDateienWeg', []);
        Store.setMeta('wolkeBloeckeWeg', []);
        Store.setMeta('wolkeAbgleich', null);
        Store.setMeta('wolkeNeuAbgleich', '');
        takt();
        melden();
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('konto', 'Von der Wolke abgemeldet');
    };
    const nachtrag = () => {
        if (Store.getMeta('wolkeNachtragAlles', false) === true)
            return { alles: true, ids: new Set() };
        const w = Store.getMeta('wolkeNachtrag', []);
        return { alles: false, ids: new Set(Array.isArray(w) ? w.map(String) : []) };
    };
    const zuSchicken = () => {
        const marke = Store.getMeta('wolkeMarkeHoch', '');
        const nach = nachtrag();
        const dran = (id, zeit) => zeit > marke || nach.alles || nach.ids.has(String(id));
        const raus = [];
        Object.values(Store.cache.blocks).forEach(b => {
            if (!dran(b.id, String(b.edited || b.created || '')))
                return;
            raus.push({ id: b.id, tabelle: 'blocks', satz: b,
                seite: seiteVon(b), geloescht: b.alive === false });
        });
        Object.values(Store.cache.collections).forEach(c => {
            if (!dran(c.id, String(c.edited || c.created || '')))
                return;
            raus.push({ id: c.id, tabelle: 'collections', satz: c, seite: c.id, geloescht: false });
        });
        Object.values(Store.cache.views).forEach(v => {
            if (!dran(v.id, String(v.edited || v.created || '')))
                return;
            raus.push({ id: v.id, tabelle: 'views', satz: v, seite: v.collectionId, geloescht: false });
        });
        return raus;
    };
    const nachtragStreichen = (ids) => {
        const w = Store.getMeta('wolkeNachtrag', []);
        if (!Array.isArray(w) || !w.length)
            return;
        const weg = new Set(ids.map(String));
        const rest = w.filter((x) => !weg.has(String(x)));
        if (rest.length !== w.length)
            Store.setMeta('wolkeNachtrag', rest);
    };
    const seiteVon = (b) => {
        let cur = b, tiefe = 0;
        while (cur && tiefe++ < 40) {
            if (cur.type === 'page' && cur.parentTable !== 'collection')
                return cur.id;
            if (!cur.parentId)
                return cur.id;
            const eltern = Store.getBlock(cur.parentId);
            if (!eltern)
                return cur.id;
            cur = eltern;
        }
        return b.id;
    };
    const istGeteilt = (seiteId) => (Store.getMeta('wolkeGeteilt', []) || []).includes(seiteId);
    const RUNDE = 300;
    const PAKET_BYTES = 4 * 1024 * 1024;
    const EINZEL_MAX = 12 * 1024 * 1024;
    const zuGrossIds = new Set();
    const hoch = async () => {
        wacheSchluessel();
        let angenommen = 0;
        const abgelehnt = [], angepasst = [];
        for (let runde = 0; runde < 40; runde++) {
            const liste = zuSchicken();
            if (!liste.length)
                break;
            const zeitVon = (e) => String(e.satz.edited || e.satz.created || '');
            liste.sort((a, b) => zeitVon(a).localeCompare(zeitVon(b)));
            let bis = Math.min(RUNDE, liste.length);
            if (bis < liste.length) {
                const grenze = zeitVon(liste[bis - 1]);
                while (bis < liste.length && zeitVon(liste[bis]) === grenze)
                    bis++;
            }
            const dran = liste.slice(0, bis);
            const paket = [];
            for (const e of dran) {
                const klar = JSON.stringify(e.satz);
                const offen = istGeteilt(e.seite);
                paket.push({
                    id: e.id, tabelle: e.tabelle, seite: e.seite,
                    daten: (offen || !hatSchluessel()) ? klar : await verschluessele(klar),
                    verschluesselt: !offen && hatSchluessel(),
                    version: Number(e.satz.wolkeVersion || 1),
                    geaendert: e.satz.edited || e.satz.created || Store.now(),
                    geloescht: e.geloescht
                });
            }
            const gesendet = [], gesendetDran = [], zuGross = [];
            let bytes = 0, schnitt = paket.length;
            for (let i = 0; i < paket.length; i++) {
                const p = paket[i], e = dran[i];
                if (!p || !e)
                    continue;
                const g = String(p.daten).length + 400;
                if (g > EINZEL_MAX) {
                    zuGross.push(String(p.id));
                    continue;
                }
                if (gesendet.length && bytes + g > PAKET_BYTES) {
                    schnitt = i;
                    break;
                }
                bytes += g;
                gesendet.push(p);
                gesendetDran.push(e);
            }
            if (zuGross.length) {
                for (const id of zuGross)
                    zuGrossIds.add(id);
                zustand.zuGrossLokal = zuGrossIds.size;
                nachtragStreichen(zuGross);
                if (typeof Protokoll !== 'undefined')
                    Protokoll.notieren('wolke', zuGross.length + ' Satz/Sätze zu gross für die Wolke — bleiben auf diesem Gerät');
            }
            const letzteZeit = String((gesendet[gesendet.length - 1] ?? paket[paket.length - 1])?.geaendert ?? '');
            const nachtragen = dran.slice(schnitt)
                .filter(e => zeitVon(e) <= letzteZeit && !zuGross.includes(String(e.id)))
                .map(e => String(e.id));
            if (nachtragen.length)
                Store.metaListeAendern('wolkeNachtrag', (alt) => [...new Set([...(Array.isArray(alt) ? alt.map(String) : []), ...nachtragen])]);
            if (!gesendet.length) {
                if (letzteZeit)
                    Store.setMeta('wolkeMarkeHoch', letzteZeit);
                if (liste.length <= dran.length)
                    break;
                continue;
            }
            const a = await ruf('/sync/hoch', { m: 'POST', k: { bereich: bereich(), saetze: gesendet } });
            angenommen += a.angenommen;
            if (Array.isArray(a.abgelehnt))
                abgelehnt.push(...a.abgelehnt);
            const nein = new Set([...(a.abgelehnt || []), ...(a.angepasst || [])]
                .map(x => (x && x.id) || x));
            for (const e of gesendetDran)
                if (!nein.has(e.id))
                    await Store.basisPut(e.id, e.satz);
            if (Array.isArray(a.angepasst) && a.angepasst.length)
                angepasst.push(...a.angepasst);
            const letzte = gesendet[gesendet.length - 1];
            Store.setMeta('wolkeMarkeHoch', letzte ? letzte.geaendert : Store.now());
            nachtragStreichen(gesendetDran.filter(e => !nein.has(e.id)).map(e => String(e.id)));
            if (schnitt === paket.length && liste.length <= dran.length)
                break;
        }
        if (Store.getMeta('wolkeNachtragAlles', false) === true)
            Store.setMeta('wolkeNachtragAlles', false);
        const rest = Store.getMeta('wolkeNachtrag', []);
        if (Array.isArray(rest) && rest.length) {
            const lebt = rest.filter((id) => {
                const k = String(id);
                return !!(Store.cache.blocks[k] || Store.cache.collections[k] ||
                    Store.cache.views[k]);
            });
            if (lebt.length !== rest.length)
                Store.setMeta('wolkeNachtrag', lebt);
        }
        zustand.hoch += angenommen;
        if (angepasst.length) {
            const felder = [...new Set(angepasst.flatMap(x => x.felder || []))];
            zustand.fehler = angepasst.length + ' Zeilen: Spalten ohne Schreibrecht ' +
                'wurden zurückgesetzt' + (felder.length ? ' (' + felder.join(', ') + ')' : '') + '.';
            melden();
        }
        return { angenommen, abgelehnt, angepasst };
    };
    const runter = async () => {
        let uebernommenGesamt = 0, unlesbarGesamt = 0, gemischtGesamt = 0, mehr = true, runde = 0;
        while (mehr && runde++ < 40) {
            const teil = await runterEinmal();
            uebernommenGesamt += teil.uebernommen;
            unlesbarGesamt += teil.unlesbar;
            gemischtGesamt += teil.gemischt || 0;
            mehr = teil.mehr;
        }
        if (unlesbarGesamt && !uebernommenGesamt) {
            zustand.fehler = unlesbarGesamt + ' Seiten liegen da, aber der Schlüssel passt nicht. ' +
                'Wahrscheinlich ein anderer Satz als auf dem ersten Gerät.';
            melden();
        }
        zustand.unlesbar = unlesbarGesamt;
        return { uebernommen: uebernommenGesamt, unlesbar: unlesbarGesamt,
            gemischt: gemischtGesamt,
            strittig: (typeof Zusammen !== 'undefined') ? Zusammen.offene().length : 0,
            mehr: false };
    };
    const bloeckeWeg = async () => {
        wacheSchluessel();
        const offen = Store.getMeta('wolkeBloeckeWeg', []) || [];
        if (!offen.length)
            return { bloeckeWeggemeldet: 0 };
        let gemeldet = 0;
        const dran = [];
        for (const e of offen) {
            if (!e || !e.id || !e.satz) {
                if (e && e.id)
                    Store.blockGrabsteinWeg(e.id);
                continue;
            }
            const basis = await Store.basisHolen(e.id);
            if (!basis) {
                Store.blockGrabsteinWeg(e.id);
                continue;
            }
            dran.push(e);
        }
        for (let von = 0; von < dran.length; von += RUNDE) {
            const teil = dran.slice(von, von + RUNDE);
            const paket = [];
            for (const e of teil) {
                const klar = JSON.stringify(e.satz);
                const geteilt = istGeteilt(e.seite);
                paket.push({
                    id: e.id, tabelle: e.tabelle || 'blocks', seite: e.seite,
                    daten: (geteilt || !hatSchluessel()) ? klar : await verschluessele(klar),
                    verschluesselt: !geteilt && hatSchluessel(),
                    version: Number(e.satz.wolkeVersion || 1),
                    geaendert: e.satz.edited || e.satz.created || Store.now(),
                    geloescht: true
                });
            }
            const a = await ruf('/sync/hoch', { m: 'POST', k: { bereich: bereich(), saetze: paket } });
            const gruende = new Map();
            for (const x of [...(a.abgelehnt || []), ...(a.angepasst || [])]) {
                if (x && x.id)
                    gruende.set(x.id, String(x.grund || 'angepasst'));
                else if (typeof x === 'string')
                    gruende.set(x, '');
            }
            for (const e of teil) {
                if (gruende.has(e.id)) {
                    Store.blockGrabsteinWeg(e.id);
                    if (/Schreibrecht/.test(gruende.get(e.id) || '') && typeof Protokoll !== 'undefined')
                        Protokoll.notieren('konto', 'Ein gelöschter Block bleibt auf dem Server: ' +
                            'kein Schreibrecht auf seiner Seite (' + e.id + ').');
                    continue;
                }
                Store.blockGrabsteinWeg(e.id);
                await Store.basisWeg(e.id);
                gemeldet++;
            }
        }
        zustand.hoch += gemeldet;
        return { bloeckeWeggemeldet: gemeldet };
    };
    const runterEinmal = async () => {
        const a = await ruf('/sync/runter', { m: 'POST',
            k: { bereich: bereich(), seit: Store.getMeta('wolkeMarkeRunter', '') } });
        zustand.rolle = a.rolle || '';
        const wegOffen = new Set((Store.getMeta('wolkeBloeckeWeg', []) || []).map((e) => e && e.id).filter(Boolean));
        let uebernommen = 0, unlesbar = 0, gemischt = 0, strittig = 0;
        for (const s of a.saetze) {
            if (wegOffen.has(s.id))
                continue;
            let klar = s.daten;
            if (s.verschluesselt) {
                klar = await entschluessele(s.daten);
                if (klar === null) {
                    unlesbar++;
                    continue;
                }
            }
            let satz;
            try {
                satz = JSON.parse(klar);
            }
            catch {
                unlesbar++;
                continue;
            }
            if (!satz || typeof satz !== 'object' || Array.isArray(satz) ||
                (satz.id !== undefined && satz.id !== s.id)) {
                unlesbar++;
                continue;
            }
            satz.id = s.id;
            satz.wolkeVersion = s.version;
            const hier = s.tabelle === 'blocks' ? Store.cache.blocks[s.id]
                : s.tabelle === 'collections' ? Store.cache.collections[s.id]
                    : Store.cache.views[s.id];
            if (!hier) {
                if (s.geloescht) {
                    await Store.basisWeg(s.id);
                    continue;
                }
                Store.rohSetzen(s.tabelle, satz);
                await Store.basisPut(s.id, satz);
                uebernommen++;
                continue;
            }
            const basis = await Store.basisHolen(s.id);
            const r = (typeof Zusammen !== 'undefined')
                ? Zusammen.dreiWege(basis, hier, satz)
                : { satz: (String(hier.edited || '') > String(s.geaendert || '')) ? hier : satz,
                    konflikte: [] };
            const neu = r.satz;
            neu.id = s.id;
            neu.wolkeVersion = s.version;
            Store.rohSetzen(s.tabelle, neu);
            await Store.basisPut(s.id, satz);
            if (r.konflikte.length) {
                strittig += r.konflikte.length;
                try {
                    Zusammen.merke(s.id, s.tabelle, r.konflikte);
                }
                catch { }
            }
            else if (r.zusammengefuehrt)
                gemischt++;
            uebernommen++;
        }
        if (a.marke)
            Store.setMeta('wolkeMarkeRunter', a.marke);
        zustand.runter += uebernommen;
        zustand.unlesbar = unlesbar;
        zustand.gemischt = (zustand.gemischt || 0) + gemischt;
        zustand.strittig = (typeof Zusammen !== 'undefined') ? Zusammen.offene().length : strittig;
        if (uebernommen) {
            try {
                App.zeichneSeite();
                App.zeichneBaum();
            }
            catch { }
        }
        if (typeof Zusammen !== 'undefined') {
            try {
                Zusammen.melde();
            }
            catch { }
        }
        return { uebernommen, unlesbar, gemischt, strittig, mehr: a.mehr };
    };
    const neuAbgleichOffen = () => !!Store.getMeta('wolkeNeuAbgleich', '');
    const neuAbgleichAntwort = async (wahl) => {
        if (wahl !== 'lokal' && wahl !== 'wolke')
            throw new Error('Nach dem Einspielen muss feststehen, was geschehen ' +
                'soll: „lokal" behält den Bestand auf diesem Gerät, ' +
                '„wolke" gleicht beide Seiten vollständig ab. Ohne ' +
                'Angabe wird nichts getan.');
        Store.setMeta('wolkeNeuAbgleich', '');
        Store.setMeta('wolkeAbgleich', wahl === 'wolke');
        melden();
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('konto', wahl === 'wolke'
                ? 'Nach dem Einspielen: vollständig mit der Wolke abgleichen'
                : 'Nach dem Einspielen: nur lokal weiterarbeiten');
        if (wahl === 'lokal')
            return null;
        return abgleichen();
    };
    const abgleichErlaubt = () => {
        if (neuAbgleichOffen())
            return false;
        const v = Store.getMeta('wolkeAbgleich', null);
        if (v !== null)
            return !!v;
        return !!(Store.getMeta('wolkeMarkeHoch', '') || Store.getMeta('wolkeMarkeRunter', ''));
    };
    const abgleichSetzen = (an) => { Store.setMeta('wolkeAbgleich', !!an); melden(); };
    const abgleichen = async () => {
        if (!angemeldet() || !bereich() || zustand.laeuft || !abgleichErlaubt())
            return null;
        if (schluesselFehlt()) {
            zustand.fehler = SCHLUESSEL_FEHLT;
            melden();
            return null;
        }
        zustand.laeuft = true;
        zustand.fehler = '';
        melden();
        try {
            let w = null;
            try {
                w = await bloeckeWeg();
            }
            catch { }
            const r = await runter();
            const h = await hoch();
            const d = await dateienAbgleichen();
            zustand.letzter = Store.now();
            if (typeof Feldrechte !== 'undefined') {
                try {
                    await Feldrechte.auffrischen();
                }
                catch { }
            }
            if (r.strittig && typeof Zusammen !== 'undefined') {
                try {
                    Zusammen.hinweisen();
                }
                catch { }
            }
            return { ...r, ...h, ...(d || {}), ...(w || {}) };
        }
        catch (e) {
            zustand.fehler = e instanceof Error ? e.message : String(e);
            throw e;
        }
        finally {
            zustand.laeuft = false;
            melden();
        }
    };
    let uhr = null;
    const autoAbgleichen = () => {
        if (document.hidden || (typeof navigator !== 'undefined' && navigator.onLine === false))
            return;
        abgleichen().catch(() => { });
    };
    const takt = () => {
        clearInterval(uhr);
        uhr = null;
        if (!angemeldet())
            return 0;
        const sek = Number(Store.getMeta('wolkeTakt', '120'));
        if (!Number.isFinite(sek) || sek <= 0)
            return 0;
        const ms = sek * 1000;
        uhr = setInterval(autoAbgleichen, ms);
        return ms;
    };
    const taktSetzen = (wert) => {
        const text = String(wert);
        const reg = globalThis.Register;
        if (reg?.einstellungen?.setze)
            reg.einstellungen.setze('wolkeTakt', text);
        else
            Store.setMeta('wolkeTakt', text);
        if (String(Store.getMeta('wolkeTakt', '120')) !== text)
            return -1;
        return takt();
    };
    const verschluesseleBytes = async (bytes) => {
        if (!schluessel)
            throw new Error('Es ist kein Schlüssel gesetzt.');
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, schluessel, bytes);
        const alles = new Uint8Array(iv.length + chiffre.byteLength);
        alles.set(iv);
        alles.set(new Uint8Array(chiffre), iv.length);
        return alles;
    };
    const entschluesseleBytes = async (bytes) => {
        if (!schluessel)
            return null;
        try {
            const iv = bytes.slice(0, 12);
            const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, schluessel, bytes.slice(12));
            return new Uint8Array(klar);
        }
        catch {
            return null;
        }
    };
    let dateienGehenNicht = false;
    const seiteFuerDatei = (d) => {
        const b = d.blockId ? Store.getBlock(d.blockId) : null;
        return b ? seiteVon(b) : String(d.blockId || d.id);
    };
    const dateienWeg = async () => {
        const offen = Store.getMeta('wolkeDateienWeg', []) || [];
        let gemeldet = 0;
        for (const id of offen) {
            try {
                await ruf('/datei/weg', { m: 'POST', k: { bereich: bereich(), dateiId: id } });
                Store.dateiGrabsteinWeg(id);
                gemeldet++;
            }
            catch (e) {
                const satz = e instanceof Error ? e.message : String(e);
                if (/Dateispeicher/.test(satz))
                    throw e;
                if (/gibt es hier nicht/.test(satz)) {
                    Store.dateiGrabsteinWeg(id);
                    continue;
                }
                if (/Schreibrecht/.test(satz)) {
                    Store.dateiGrabsteinWeg(id);
                    if (typeof Protokoll !== 'undefined')
                        Protokoll.notieren('konto', 'Eine gelöschte Datei bleibt auf dem Server: ' +
                            'kein Schreibrecht auf ihrer Seite (' + id + ').');
                    continue;
                }
            }
        }
        return { dateienWeggemeldet: gemeldet };
    };
    const dateienRunter = async () => {
        let marke = Store.getMeta('wolkeMarkeDateien', '');
        const oben = new Set(Store.getMeta('wolkeDateienOben', []) || []);
        const wegOffen = new Set(Store.getMeta('wolkeDateienWeg', []) || []);
        let geholt = 0, entfernt = 0, unlesbar = 0;
        const wartend = new Map((Store.getMeta('wolkeDateienWartend', []) || [])
            .filter((d) => d && typeof d.id === 'string' && d.id)
            .map((d) => [d.id, d]));
        for (let runde = 0; runde < 20; runde++) {
            const a = await ruf('/datei/stand', { m: 'POST',
                k: { bereich: bereich(), seit: marke, grenze: 200 } });
            const daten = [...(a.dateien || []), ...(runde === 0 ? [...wartend.values()] : [])];
            const gesehen = new Set();
            for (const d of daten) {
                if (!d || typeof d.id !== 'string' || gesehen.has(d.id))
                    continue;
                gesehen.add(d.id);
                if (wegOffen.has(d.id)) {
                    wartend.delete(d.id);
                    continue;
                }
                const lokal = await Store.dateiHolen(d.id);
                if (d.geloescht) {
                    wartend.delete(d.id);
                    if (lokal) {
                        for (const st of await Store.stueckeVon(d.id))
                            await Store.stueckWeg(st.id);
                        await Store.dateiWeg(d.id);
                        entfernt++;
                    }
                    oben.delete(d.id);
                    continue;
                }
                if (lokal && lokal.zustand === 'fertig') {
                    wartend.delete(d.id);
                    oben.add(d.id);
                    continue;
                }
                const ausstehend = wartend.get(d.id);
                if (ausstehend && Number(ausstehend.erstWieder || 0) > Date.now())
                    continue;
                const teile = Math.max(1, Number(d.teile) || 1);
                let ganz = true;
                try {
                    for (let nr = 0; nr < teile; nr++) {
                        const r = await ruf('/datei/runter', { m: 'POST',
                            k: { bereich: bereich(), dateiId: d.id, nr } });
                        const roh = Bytes.fromBase64(String(r.base64 || ''));
                        const bytes = d.verschluesselt ? await entschluesseleBytes(roh) : roh;
                        if (!bytes) {
                            ganz = false;
                            unlesbar++;
                            break;
                        }
                        await Store.stueckPut({ id: d.id + ':' + nr, dateiId: d.id, nr,
                            blob: new Blob([bytes], { type: String(d.typ || '') }) });
                    }
                }
                catch {
                    ganz = false;
                    unlesbar++;
                }
                if (!ganz) {
                    try {
                        for (const st of await Store.stueckeVon(d.id))
                            await Store.stueckWeg(st.id);
                    }
                    catch { }
                    const versuche = Math.min(20, (Number(ausstehend?.versuche) || 0) + 1);
                    wartend.set(d.id, { ...d, versuche,
                        erstWieder: Date.now() + Math.min(30 * 60000, 15000 * 2 ** Math.min(6, versuche)) });
                    continue;
                }
                wartend.delete(d.id);
                const block = Object.values(Store.cache.blocks)
                    .find(b => b && b.dateiId === d.id);
                await Store.dateiPut({ id: d.id, name: String(d.name || ''),
                    groesse: Number(d.groesse) || 0, typ: String(d.typ || ''),
                    blockId: block ? block.id : null, teile, angekommen: teile,
                    zustand: 'fertig', angelegt: Store.now(), fertigAm: Store.now() });
                oben.add(d.id);
                geholt++;
            }
            Store.setMeta('wolkeDateienWartend', [...wartend.values()].slice(-80));
            if (a.marke && String(a.marke) !== marke) {
                marke = String(a.marke);
                Store.setMeta('wolkeMarkeDateien', marke);
            }
            if (!a.mehr)
                break;
        }
        Store.setMeta('wolkeDateienOben', [...oben]);
        return { dateienGeholt: geholt, dateienEntfernt: entfernt, dateienUnlesbar: unlesbar };
    };
    const dateienHoch = async () => {
        wacheSchluessel();
        const oben = new Set(Store.getMeta('wolkeDateienOben', []) || []);
        const alle = await Store.dateiAlle();
        let rauf = 0;
        for (const d of alle) {
            if (!d || d.zustand !== 'fertig' || oben.has(d.id))
                continue;
            if (d.abgeleitet)
                continue;
            if ((Number(d.groesse) || 0) > SERVER_DATEI_MAX)
                continue;
            const stuecke = (await Store.stueckeVon(d.id))
                .sort((x, y) => (Number(x.nr) || 0) - (Number(y.nr) || 0));
            if (!stuecke.length)
                continue;
            await ruf('/datei/melden', { m: 'POST', k: { bereich: bereich(), datei: {
                        id: d.id, name: d.name, groesse: d.groesse, typ: d.typ,
                        seite: seiteFuerDatei(d), teile: stuecke.length,
                        verschluesselt: hatSchluessel() ? 1 : 0
                    } } });
            for (const st of stuecke) {
                const bytes = new Uint8Array(await st.blob.arrayBuffer());
                const raus = hatSchluessel() ? await verschluesseleBytes(bytes) : bytes;
                await ruf('/datei/stueck', { m: 'POST', k: { bereich: bereich(),
                        dateiId: d.id, nr: Number(st.nr) || 0, base64: Bytes.toBase64(raus) } });
            }
            oben.add(d.id);
            Store.setMeta('wolkeDateienOben', [...oben]);
            rauf++;
        }
        return { dateienRauf: rauf };
    };
    const dateienAbgleichen = async () => {
        if (dateienGehenNicht)
            return null;
        const ergebnis = {};
        const fehler = [];
        const schritt = async (fn) => {
            try {
                Object.assign(ergebnis, await fn());
            }
            catch (e) {
                const satz = e instanceof Error ? e.message : String(e);
                if (/Dateispeicher/.test(satz))
                    dateienGehenNicht = true;
                else
                    fehler.push(satz);
            }
        };
        await schritt(dateienWeg);
        if (!dateienGehenNicht)
            await schritt(dateienRunter);
        if (!dateienGehenNicht)
            await schritt(dateienHoch);
        zustand.fehlerDateien = fehler.join(' · ');
        if (fehler.length)
            melden();
        return Object.keys(ergebnis).length ? ergebnis : null;
    };
    const geteiltSetzen = (seiteId, an) => {
        const liste = Store.getMeta('wolkeGeteilt', []) || [];
        const neu = an ? [...new Set([...liste, seiteId])] : liste.filter((x) => x !== seiteId);
        Store.setMeta('wolkeGeteilt', neu);
        Store.setMeta('wolkeMarkeHoch', '');
    };
    const freigeben = (seiteId, kontoMail, rolle) => ruf('/freigabe', { m: 'POST',
        k: { bereich: bereich(), seite: seiteId, konto: kontoMail, rolle } });
    const freigaben = () => ruf('/freigabe?bereich=' + encodeURIComponent(bereich()));
    const veroeffentlichen = async (seiteId, opt = {}) => {
        const seite = Store.getBlock(seiteId);
        if (!seite)
            throw new Error('Diese Seite gibt es nicht.');
        const html = typeof Werkzeuge !== 'undefined' && Werkzeuge.seiteAlsHtml
            ? Werkzeuge.seiteAlsHtml(seite)
            : '<p>' + String(seite.text || '') + '</p>';
        const a = await ruf('/veroeffentlichen', { m: 'POST',
            k: { bereich: bereich(), seite: seiteId, titel: seite.text || 'Ohne Titel',
                inhalt: html, passwort: opt.passwort || '', tage: opt.tage || 0 } });
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('freigabe', 'Seite veröffentlicht: ' + (seite.text || ''), { seite: seiteId, wie: a.adresse });
        return a;
    };
    const zurueckziehen = (seiteId) => ruf('/veroeffentlichen', { m: 'DELETE', k: { bereich: bereich(), seite: seiteId } });
    const markeAnlegen = (name, rechte, tage) => ruf('/marken', { m: 'POST', k: { name, bereich: bereich(), rechte, tage } });
    const markenListe = () => ruf('/marken');
    const geraeteListe = () => ruf('/konto/geraete');
    const geraetWeg = (kennung) => ruf('/konto/geraete/weg', { m: 'POST', k: { kennung } });
    const markeWeg = (kennung) => ruf('/marken/' + kennung, { m: 'DELETE' });
    const start = async () => {
        if (typeof Store.on === 'function')
            Store.on((was) => { if (was === 'import')
                melden(); });
        if (token()) {
            zustand.konto = Store.getMeta('wolkeKonto', null);
            zustand.angemeldet = true;
            melden();
            setTimeout(() => { autoAbgleichen(); takt(); }, 3000);
        }
        document.addEventListener('visibilitychange', autoAbgleichen);
        window.addEventListener('online', autoAbgleichen);
        const ev = globalThis.Ereignisse;
        if (ev?.horche)
            ev.horche(ARTEN.einstellungGeaendert, (d) => {
                if (d && d.id === 'wolkeTakt')
                    takt();
            });
    };
    return { adresse, serverAdressePruefen, token, bereich, angemeldet, geraeteName, zustand, beiAenderung,
        anmeldenMit, accessMoeglich, anmeldenMitAccess, codeHolen, codeWarten, codeFreigeben, tokenUebernehmen, abmelden,
        abgleichErlaubt, abgleichSetzen, kontoLoeschen,
        neuAbgleichOffen, neuAbgleichAntwort,
        schluesselSetzen, hatSchluessel, schluesselFehlt, verschluessele, entschluessele,
        hoch, runter, abgleichen, dateienAbgleichen, takt, taktSetzen, zuSchicken, seiteVon,
        geteiltSetzen, istGeteilt, freigeben, freigaben,
        veroeffentlichen, zurueckziehen,
        markeAnlegen, markenListe, markeWeg, geraeteListe, geraetWeg,
        ruf, geraeteZugangErreichbar, start };
})();
window.Wolke = Wolke;
