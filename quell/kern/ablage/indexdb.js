"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ablage/indexdb.ts (npm run bauen:ts). */
const Store = (() => {
    const DEMO = typeof location !== 'undefined' &&
        /(^|[?&])demo(=|&|$)/.test(location.search || '');
    const NAME = ((typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.ABLAGE_NAME : 'notizen') +
        (DEMO ? '-demo' : '');
    const VERSION = (typeof Umzuege !== 'undefined') ? Umzuege.JETZIGE : 6;
    let db = null;
    const listeners = new Set();
    const notify = (was) => listeners.forEach(fn => fn(was));
    let nurSpeicher = false;
    let warnung = '';
    const warner = new Set();
    const warne = (text) => {
        warnung = text;
        warner.forEach(fn => { try {
            fn(text);
        }
        catch { } });
    };
    const open = () => new Promise((ok, fail) => {
        if (!self.indexedDB) {
            fail(new Error('Dieser Browser stellt keinen lokalen Speicher bereit.'));
            return;
        }
        let req;
        try {
            req = indexedDB.open(NAME, VERSION);
        }
        catch (err) {
            fail(err);
            return;
        }
        req.onblocked = () => fail(new Error('Eine ältere Fassung der App ist noch in einem anderen Tab offen. ' +
            'Bitte diesen Tab schliessen und neu laden.'));
        setTimeout(() => { if (!db)
            fail(new Error('Der lokale Speicher antwortet nicht.')); }, 6000);
        req.onupgradeneeded = (e) => {
            const d = e.target.result;
            if (!d.objectStoreNames.contains('blocks')) {
                const s = d.createObjectStore('blocks', { keyPath: 'id' });
                s.createIndex('parent', 'parentId');
                s.createIndex('type', 'type');
            }
            if (!d.objectStoreNames.contains('collections'))
                d.createObjectStore('collections', { keyPath: 'id' });
            if (!d.objectStoreNames.contains('views'))
                d.createObjectStore('views', { keyPath: 'id' });
            if (!d.objectStoreNames.contains('meta'))
                d.createObjectStore('meta', { keyPath: 'k' });
            if (!d.objectStoreNames.contains('versions')) {
                const v = d.createObjectStore('versions', { keyPath: 'id' });
                v.createIndex('page', 'pageId');
            }
            if (!d.objectStoreNames.contains('dateien')) {
                const f = d.createObjectStore('dateien', { keyPath: 'id' });
                f.createIndex('block', 'blockId');
            }
            if (!d.objectStoreNames.contains('stuecke')) {
                const st = d.createObjectStore('stuecke', { keyPath: 'id' });
                st.createIndex('datei', 'dateiId');
            }
            if (!d.objectStoreNames.contains('basis'))
                d.createObjectStore('basis', { keyPath: 'id' });
            if (!d.objectStoreNames.contains('vorrat'))
                d.createObjectStore('vorrat', { keyPath: 'id' });
            if (!d.objectStoreNames.contains('suchindex'))
                d.createObjectStore('suchindex', { keyPath: 'id' });
            if (!d.objectStoreNames.contains('auftraege')) {
                const au = d.createObjectStore('auftraege', { keyPath: 'id' });
                au.createIndex('zustand', 'zustand');
                au.createIndex('art', 'art');
            }
        };
        req.onsuccess = () => {
            db = req.result;
            db.onversionchange = () => {
                try {
                    db.close();
                }
                catch { }
                db = null;
                warne('Ein anderes Fenster hat eine neuere Fassung der App geöffnet. ' +
                    'Dieses Fenster hat die Ablage freigegeben — bitte neu laden.');
            };
            ok(db);
        };
        req.onerror = () => fail(req.error);
    });
    const tx = (stores, mode) => db.transaction(stores, mode);
    const put = (store, val) => new Promise((ok, fail) => {
        if (!db)
            return ok(val);
        try {
            const r = tx([store], 'readwrite').objectStore(store).put(val);
            r.onsuccess = () => ok(val);
            r.onerror = () => fail(r.error);
        }
        catch (err) {
            fail(err);
        }
    });
    const get = (store, key) => new Promise((ok, fail) => {
        if (!db)
            return ok(null);
        const r = tx([store], 'readonly').objectStore(store).get(key);
        r.onsuccess = () => ok(r.result || null);
        r.onerror = () => fail(r.error);
    });
    const all = (store) => new Promise((ok, fail) => {
        if (!db)
            return ok([]);
        try {
            const r = tx([store], 'readonly').objectStore(store).getAll();
            r.onsuccess = () => ok(r.result || []);
            r.onerror = () => fail(r.error || new Error('Fach „' + store + '" nicht lesbar'));
        }
        catch (err) {
            fail(err);
        }
    });
    const del = (store, key) => new Promise((ok, fail) => {
        if (!db)
            return ok();
        try {
            const r = tx([store], 'readwrite').objectStore(store).delete(key);
            r.onsuccess = () => ok();
            r.onerror = () => fail(r.error || new Error('Aus „' + store + '" nicht löschbar'));
        }
        catch (err) {
            fail(err);
        }
    });
    const cache = { blocks: {}, collections: {}, views: {}, meta: {}, suchindex: {} };
    let datenFassung = 0;
    const datenGeaendert = () => { datenFassung++; };
    const load = async () => {
        try {
            await open();
        }
        catch (err) {
            db = null;
            nurSpeicher = true;
            warne('Der lokale Speicher ist hier gesperrt: ' +
                (err instanceof Error ? err.message : String(err)) +
                ' — die App läuft, sichert aber nichts. Öffne die Datei direkt vom Desktop, ' +
                'dann bleibt alles erhalten.');
            return;
        }
        try {
            const [bloecke, sammlungen, ansichten, metadaten] = await Promise.all([
                all('blocks'), all('collections'), all('views'), all('meta')
            ]);
            bloecke.forEach((b) => { revAbnehmen('blocks', b); cache.blocks[b.id] = b; });
            sammlungen.forEach((c) => { revAbnehmen('collections', c); cache.collections[c.id] = c; });
            ansichten.forEach((v) => { revAbnehmen('views', v); cache.views[v.id] = v; });
            metadaten.forEach((m) => cache.meta[m.k] = m.v);
        }
        catch (err) {
            db = null;
            nurSpeicher = true;
            if (typeof Reporter !== 'undefined')
                Reporter.error('Ablage', 'Der Bestand liess sich nicht lesen', err);
            warne('Der gespeicherte Bestand liess sich nicht lesen: ' +
                (err instanceof Error ? err.message : String(err)) +
                ' — Redion arbeitet jetzt NUR im Arbeitsspeicher und schreibt nichts, ' +
                'damit nichts überschrieben wird. Schliesse andere Fenster dieser App ' +
                'und lade neu.');
            return;
        }
        try {
            (await all('suchindex')).forEach((e) => {
                if (e && typeof e.id === 'string')
                    cache.suchindex[e.id] = e;
            });
        }
        catch (err) {
            cache.suchindex = {};
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Suche', 'Der Suchindex war nicht lesbar und wird repariert', err);
        }
        try {
            (await all('dateien')).forEach(dateiNameMerken);
        }
        catch (err) {
            dateiNamen.clear();
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Suche', 'Die Dateinamen waren nicht lesbar; die Suche findet sie diesmal nicht', err);
        }
        if (typeof Formen !== 'undefined') {
            try {
                const b = Formen.zustand(true);
                if (b && b.geheilt && typeof Reporter !== 'undefined')
                    Reporter.info('Ablage', b.geheilt + ' von ' + b.geprueft +
                        ' Sätzen ergänzt', b.stellen);
            }
            catch (e) {
                if (typeof Reporter !== 'undefined')
                    Reporter.error('Ablage', 'Selbstheilung: ' + (e instanceof Error ? e.message : String(e)), e);
            }
        }
        if (typeof Umzuege !== 'undefined') {
            try {
                Umzuege.laufen();
            }
            catch (e) {
                if (typeof Reporter !== 'undefined')
                    Reporter.error('Ablage', 'Umzug: ' + (e instanceof Error ? e.message : String(e)), e);
            }
        }
        if (typeof Nachbarn !== 'undefined' && Nachbarn.start())
            Nachbarn.beiNachricht(fremdeNachricht);
        if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined')
            Ereignisse.melde(ARTEN.ablageGeladen, { blocks: Object.keys(cache.blocks).length });
    };
    const uid = () => (typeof Ids !== 'undefined')
        ? Ids.long()
        : (crypto.randomUUID ? crypto.randomUUID()
            : 'x'.replace(/x/g, () => Math.random().toString(36).slice(2) + Date.now().toString(36)));
    const now = () => new Date().toISOString();
    const addBlock = (parentId, type = 'text', patch = {}, index = -1) => {
        const b = Object.assign({
            id: uid(),
            type,
            text: '',
            content: [],
            parentId,
            parentTable: 'block',
            color: '',
            created: now(),
            edited: now(),
            erstelltVon: getMeta('nutzer', '') || 'Ich',
            alive: true
        }, patch);
        cache.blocks[b.id] = b;
        const p = cache.blocks[parentId];
        if (p) {
            if (index < 0 || index >= p.content.length)
                p.content.push(b.id);
            else
                p.content.splice(index, 0, b.id);
            elternGeaendert(p);
        }
        save('blocks', b);
        return b;
    };
    const elternGeaendert = (p) => {
        if (!p)
            return;
        p.edited = now();
        save('blocks', p);
    };
    const getBlock = (id) => (id ? cache.blocks[id] : null) || null;
    const updateBlock = (id, patch) => {
        const b = cache.blocks[id];
        if (!b)
            return null;
        if (patch && 'checked' in patch && b.type === 'todo')
            patch = Object.assign({}, patch, { erledigtAm: patch.checked ? now() : null });
        merkeBasis('blocks', b);
        Object.assign(b, patch, { edited: now(), geaendertVon: getMeta('nutzer', '') || 'Ich' });
        save('blocks', b);
        return b;
    };
    const feldWeg = (id, ...felder) => {
        const b = cache.blocks[id];
        if (!b)
            return null;
        let etwas = false;
        for (const f of felder)
            if (f in b) {
                delete b[f];
                etwas = true;
            }
        if (!etwas)
            return b;
        Object.assign(b, { edited: now(), geaendertVon: getMeta('nutzer', '') || 'Ich' });
        save('blocks', b);
        return b;
    };
    const trashBlock = (id) => {
        const b = cache.blocks[id];
        if (!b)
            return;
        b.alive = false;
        b.trashedAt = now();
        b.edited = now();
        const p = cache.blocks[b.parentId];
        if (p) {
            p.content = p.content.filter((x) => x !== id);
            elternGeaendert(p);
        }
        save('blocks', b);
    };
    const restoreBlock = (id) => {
        const b = cache.blocks[id];
        if (!b)
            return;
        b.alive = true;
        delete b.trashedAt;
        b.edited = now();
        const p = cache.blocks[b.parentId];
        if (p && !p.content.includes(id)) {
            p.content.push(id);
            elternGeaendert(p);
        }
        save('blocks', b);
    };
    const purgeBlock = (id) => {
        const gesammelt = [];
        const geloescht = [];
        const anhaenge = {};
        purgeTief(id, gesammelt, geloescht, anhaenge);
        if (!gesammelt.length)
            return;
        datenGeaendert();
        notify('purge');
        abloesen((async () => {
            await Promise.all(geloescht);
            meldeAnAndereFenster('geaendert', gesammelt.map(x => 'blocks:' + x));
            const anspruch = dateiAnspruch();
            for (const x of gesammelt)
                await purgeAnhaenge(x, { dateien: anhaenge[x] || [], anspruch });
        })().catch(err => {
            if (typeof Reporter !== 'undefined')
                Reporter.error('ablage', 'Das endgültige Löschen ist nicht durchgelaufen — ' +
                    'nach dem Neuladen kann Gelöschtes wieder auftauchen', err);
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast('Der Speicher hat das Löschen nicht angenommen — bitte neu laden.');
        }));
    };
    const vergissAusstehendes = (store, id) => pending.delete(store + ':' + id);
    const dateienAmBlock = (b) => [b && b.dateiId, b && b.datei, b && b.bildDateiId]
        .filter(Boolean).map((x) => String(x));
    const dateiAnspruch = (nurLebende = false) => {
        const raus = new Map();
        for (const b of Object.values(cache.blocks)) {
            if (!b)
                continue;
            if (nurLebende && b.alive === false)
                continue;
            for (const datei of dateienAmBlock(b))
                if (!raus.has(datei))
                    raus.set(datei, b.id);
        }
        return raus;
    };
    const seiteVonHier = (b) => {
        let cur = b, tiefe = 0;
        while (cur && tiefe++ < 40) {
            if (cur.type === 'page' && cur.parentTable !== 'collection')
                return cur.id;
            if (!cur.parentId)
                return cur.id;
            const eltern = cache.blocks[cur.parentId];
            if (!eltern)
                return cur.id;
            cur = eltern;
        }
        return b.id;
    };
    const purgeTief = (id, gesammelt, geloescht = [], anhaenge = {}) => {
        const b = cache.blocks[id];
        if (!b)
            return;
        gesammelt.push(id);
        blockGrabstein('blocks', b, seiteVonHier(b));
        const eigene = dateienAmBlock(b);
        if (eigene.length)
            anhaenge[id] = eigene;
        vergissAusstehendes('blocks', id);
        [...(b.content || [])].forEach(k => purgeTief(k, gesammelt, geloescht, anhaenge));
        if (b.collectionId && !b.verknuepft) {
            const c = cache.collections[b.collectionId];
            if (c) {
                rowsOf(b.collectionId).forEach(r => {
                    gesammelt.push(r.id);
                    vergissAusstehendes('blocks', r.id);
                    const ihre = dateienAmBlock(r);
                    if (ihre.length)
                        anhaenge[r.id] = ihre;
                    blockGrabstein('blocks', r, seiteVonHier(r));
                    delete cache.blocks[r.id];
                    geloescht.push(del('blocks', r.id));
                });
                (c.viewIds || []).forEach((v) => {
                    vergissAusstehendes('views', v);
                    if (cache.views[v])
                        blockGrabstein('views', cache.views[v], b.collectionId);
                    delete cache.views[v];
                    geloescht.push(del('views', v));
                });
                vergissAusstehendes('collections', b.collectionId);
                blockGrabstein('collections', c, b.collectionId);
                delete cache.collections[b.collectionId];
                geloescht.push(del('collections', b.collectionId));
                vorratWeg(b.collectionId).catch(() => { });
            }
        }
        const p = cache.blocks[b.parentId];
        if (p) {
            p.content = p.content.filter((x) => x !== id);
            elternGeaendert(p);
        }
        delete cache.blocks[id];
        geloescht.push(del('blocks', id));
    };
    const purgeAnhaenge = async (id, hinweis = {}) => {
        for (const v of await versionen(id))
            await del('versions', v.id);
        const dateien = await new Promise((ok2, fail2) => {
            if (!db || !db.objectStoreNames.contains('dateien'))
                return ok2([]);
            try {
                const r = tx(['dateien'], 'readonly').objectStore('dateien').index('block').getAll(id);
                r.onsuccess = () => ok2(r.result || []);
                r.onerror = () => fail2(r.error || new Error('Das Fach „dateien" ist nicht lesbar'));
            }
            catch (err) {
                fail2(err);
            }
        });
        const kennungen = new Set(dateien.map((d) => String(d.id)));
        [hinweis.datei, ...(hinweis.dateien || []), ...dateienAmBlock(cache.blocks[id])]
            .forEach(x => { if (x)
            kennungen.add(String(x)); });
        const anspruch = hinweis.anspruch || dateiAnspruch();
        for (const dateiId of kennungen) {
            const wer = anspruch.get(dateiId);
            if (wer) {
                const satz = await dateiHolen(dateiId);
                if (satz && satz.blockId !== wer)
                    await dateiPut(Object.assign({}, satz, { blockId: wer }));
                continue;
            }
            for (const st of await stueckeVon(dateiId))
                await del('stuecke', st.id);
            dateiGrabstein(dateiId);
            await dateiWeg(dateiId);
        }
    };
    const childrenOf = (id) => {
        const b = cache.blocks[id];
        if (!b)
            return [];
        return (b.content || []).map((x) => cache.blocks[x]).filter((x) => x && x.alive);
    };
    const addPage = (parentId = null, patch = {}) => {
        const p = addBlock(parentId, 'page', Object.assign({
            text: '', aliases: [], icon: '📄', cover: '', wide: false, font: 'default', small: false
        }, patch));
        notify('pages');
        return p;
    };
    const rootPages = () => Object.values(cache.blocks)
        .filter(b => b.type === 'page' && b.alive && !b.parentId && b.parentTable !== 'collection')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.created.localeCompare(b.created));
    const trashed = () => Object.values(cache.blocks)
        .filter(b => !b.alive && b.type === 'page')
        .sort((a, b) => (b.trashedAt || '').localeCompare(a.trashedAt || ''));
    const papierkorbBloecke = () => Object.values(cache.blocks)
        .filter(b => !b.alive && b.type !== 'page')
        .sort((a, b) => (b.trashedAt || '').localeCompare(a.trashedAt || ''));
    const papierkorbAufraeumen = async () => {
        const tage = Number(getMeta('papierkorbTage', 30));
        if (!tage)
            return 0;
        const grenze = Date.now() - tage * 86400000;
        let sichtbarSeit = getMeta('papierkorbSichtbarSeit', '');
        if (!sichtbarSeit) {
            sichtbarSeit = now();
            setMeta('papierkorbSichtbarSeit', sichtbarSeit);
        }
        const abDann = new Date(sichtbarSeit).getTime() || 0;
        const wann = (b) => new Date(b.trashedAt).getTime();
        const faellig = [
            ...trashed().filter(s => s.trashedAt && wann(s) < grenze),
            ...papierkorbBloecke().filter(b => b.trashedAt && Math.max(wann(b), abDann) < grenze)
        ];
        faellig.forEach(x => purgeBlock(x.id));
        return faellig.length;
    };
    const papierkorbBaldWeg = () => {
        const tage = Number(getMeta('papierkorbTage', 30));
        if (!tage)
            return [];
        const grenze = Date.now() - (tage - 3) * 86400000;
        const abDann = new Date(getMeta('papierkorbSichtbarSeit', '') || 0).getTime() || 0;
        return [
            ...trashed().filter(s => s.trashedAt && new Date(s.trashedAt).getTime() < grenze),
            ...papierkorbBloecke().filter(b => b.trashedAt &&
                Math.max(new Date(b.trashedAt).getTime(), abDann) < grenze)
        ];
    };
    const favorites = () => Object.values(cache.blocks)
        .filter(b => b.type === 'page' && b.alive && b.favorite);
    const pathOf = (id) => {
        const out = [];
        let cur = cache.blocks[id];
        let guard = 0;
        while (cur && guard++ < 50) {
            out.unshift(cur);
            cur = cur.parentId ? cache.blocks[cur.parentId] : null;
        }
        return out;
    };
    const addDatabase = (parentId, name = 'Neue Datenbank', schema = null, layout = 'table') => {
        const colId = uid();
        const viewId = uid();
        const kurz = (n) => (typeof Ids !== 'undefined')
            ? Ids.short(n) : 'k' + uid().slice(0, n - 1);
        const s = schema || {
            title: { name: 'Name', type: 'title' },
            [kurz(4)]: { name: 'Status', type: 'select', options: [
                    { name: 'Offen', color: 'gray' },
                    { name: 'In Arbeit', color: 'blue' },
                    { name: 'Erledigt', color: 'green' }
                ] },
            [kurz(4)]: { name: 'Datum', type: 'date' }
        };
        cache.collections[colId] = {
            id: colId, name, icon: '🗂️', schema: s, viewIds: [viewId],
            created: now(), edited: now()
        };
        cache.views[viewId] = {
            id: viewId, collectionId: colId, name: 'Tabelle', layout,
            filters: { operator: 'and', rules: [] },
            sorts: [], groupBy: '', hidden: [], calc: {},
            created: now(), edited: now()
        };
        const blk = addBlock(parentId, 'database', { collectionId: colId, text: name });
        save('collections', cache.collections[colId]);
        save('views', cache.views[viewId]);
        notify('db');
        return { block: blk, collectionId: colId, viewId };
    };
    const getCollection = (id) => (id ? cache.collections[id] : null) || null;
    const getView = (id) => cache.views[id] || null;
    const rohSetzen = (tabelle, satz) => {
        if (!satz || !satz.id)
            return null;
        const wo = tabelle === 'collections' ? 'collections'
            : tabelle === 'views' ? 'views' : 'blocks';
        cache[wo][satz.id] = satz;
        save(wo, satz);
        blockGrabsteinWeg(satz.id);
        return satz;
    };
    const updateCollection = (id, patch) => {
        const c = cache.collections[id];
        if (!c)
            return null;
        merkeBasis('collections', c);
        Object.assign(c, patch);
        if (!('edited' in patch))
            c.edited = now();
        save('collections', c);
        return c;
    };
    const updateView = (id, patch) => {
        const v = cache.views[id];
        if (!v)
            return null;
        merkeBasis('views', v);
        Object.assign(v, patch);
        if (!('edited' in patch))
            v.edited = now();
        save('views', v);
        return v;
    };
    const addView = (collectionId, layout = 'table', name = '') => {
        const c = cache.collections[collectionId];
        if (!c)
            return null;
        const ausRegister = (art) => (typeof Register !== 'undefined' && Register.ansichten)
            ? Register.ansichten.name(art) : art;
        const v = {
            id: uid(), collectionId, layout,
            name: name || ausRegister(layout) || 'Ansicht',
            filters: { operator: 'and', rules: [] },
            sorts: [], groupBy: '', hidden: [], calc: {},
            created: now(), edited: now()
        };
        cache.views[v.id] = v;
        c.viewIds.push(v.id);
        save('views', v);
        save('collections', c);
        return v;
    };
    const removeView = (viewId) => {
        const v = cache.views[viewId];
        if (!v)
            return;
        const c = cache.collections[v.collectionId];
        if (c && c.viewIds.length > 1) {
            c.viewIds = c.viewIds.filter((x) => x !== viewId);
            save('collections', c);
            delete cache.views[viewId];
            del('views', viewId);
        }
    };
    let folgeZaehler = 0;
    const addRow = (collectionId, props = {}) => {
        const r = {
            id: uid(), type: 'page', text: props.title || '', icon: '',
            props, content: [], parentId: collectionId, parentTable: 'collection',
            erstelltVon: getMeta('nutzer', '') || 'Ich',
            created: now(), edited: now(), folge: ++folgeZaehler, alive: true
        };
        cache.blocks[r.id] = r;
        save('blocks', r);
        notify('rows');
        return r;
    };
    const rowsOf = (collectionId) => Object.values(cache.blocks)
        .filter(b => b.parentTable === 'collection' && b.parentId === collectionId && b.alive)
        .sort((a, b) => a.created.localeCompare(b.created) ||
        ((a.folge || 0) - (b.folge || 0)) ||
        String(a.id).localeCompare(String(b.id)));
    const setProp = (rowId, key, value) => {
        const r = cache.blocks[rowId];
        if (!r)
            return;
        if (typeof Feldrechte !== 'undefined' && r.parentTable === 'collection' &&
            Feldrechte.inKraft() && !Feldrechte.darfSchreiben(r.parentId, key)) {
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast('Diese Spalte darfst du nicht ändern.');
            return;
        }
        r.props = r.props || {};
        r.props[key] = value;
        r.edited = now();
        save('blocks', r);
    };
    let metaFehlerGemeldet = false;
    const setMeta = (k, v) => {
        cache.meta[k] = v;
        put('meta', { k, v }).catch((err) => {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('ablage', 'Die Einstellung „' + k + '" liess sich nicht speichern', err);
            if (!metaFehlerGemeldet) {
                metaFehlerGemeldet = true;
                if (typeof UI !== 'undefined' && UI.toast)
                    UI.toast('Eine Einstellung liess sich nicht speichern — sie geht beim Neuladen verloren.');
            }
        });
    };
    const getMeta = (k, fallback = null) => (k in cache.meta ? cache.meta[k] : fallback);
    const metaListeAendern = (k, aendern) => {
        const imSpeicher = Array.isArray(cache.meta[k]) ? cache.meta[k] : [];
        const sofort = aendern(imSpeicher);
        if (sofort)
            cache.meta[k] = sofort;
        if (!db)
            return Promise.resolve(sofort || imSpeicher);
        return new Promise((ok, fail) => {
            try {
                const t = tx(['meta'], 'readwrite');
                const fach = t.objectStore('meta');
                const holen = fach.get(k);
                holen.onsuccess = () => {
                    const satz = holen.result;
                    const alt = Array.isArray(satz && satz.v) ? satz.v : [];
                    const neu = aendern(alt);
                    if (!neu) {
                        ok(cache.meta[k] || alt);
                        return;
                    }
                    const legen = fach.put({ k, v: neu });
                    legen.onsuccess = () => { cache.meta[k] = neu; ok(neu); };
                    legen.onerror = () => fail(legen.error);
                };
                holen.onerror = () => fail(holen.error);
            }
            catch (err) {
                fail(err);
            }
        });
    };
    const metaListeAnhaengen = (k, eintrag) => metaListeAendern(k, alt => alt.concat([eintrag]));
    const meldeAnAndereFenster = (art, schluessel) => {
        if (typeof Nachbarn === 'undefined' || !Nachbarn.offen())
            return;
        Nachbarn.sende({ art, schluessel });
    };
    let fremdWartend = new Set();
    let fremdTimer = null;
    const fremdesEintragen = async () => {
        fremdTimer = null;
        const dran = [...fremdWartend];
        fremdWartend.clear();
        if (!db || !dran.length)
            return;
        let geaendert = 0;
        for (const schluessel of dran) {
            const trenn = schluessel.indexOf(':');
            const fach = schluessel.slice(0, trenn);
            const id = schluessel.slice(trenn + 1);
            if (!['blocks', 'collections', 'views', 'meta'].includes(fach))
                continue;
            if (fach !== 'meta' && pending.has(schluessel))
                continue;
            try {
                const satz = await get(fach, fach === 'meta' ? id : id);
                if (fach !== 'meta')
                    revAbnehmen(fach, satz);
                if (fach === 'meta') {
                    if (satz)
                        cache.meta[satz.k] = satz.v;
                    else
                        delete cache.meta[id];
                }
                else if (satz) {
                    cache[fach][id] = satz;
                }
                else {
                    delete cache[fach][id];
                }
                if (fach === 'blocks' || fach === 'collections')
                    datenGeaendert();
                geaendert++;
            }
            catch { }
        }
        if (geaendert)
            notify('fremd');
    };
    const fremdeNachricht = (n) => {
        if (!n)
            return;
        if (n.art === 'alles') {
            datenGeaendert();
            notify('fremd-alles');
            return;
        }
        (n.schluessel || []).forEach((k) => fremdWartend.add(k));
        if (!fremdTimer)
            fremdTimer = setTimeout(fremdesEintragen, 120);
    };
    const unterwegs = new Set();
    const abloesen = (p) => {
        unterwegs.add(p);
        const raus = () => { unterwegs.delete(p); };
        p.then(raus, raus);
        return p;
    };
    const settled = async () => {
        for (let runde = 0; runde < 20 && unterwegs.size; runde++)
            await Promise.all([...unterwegs].map(p => p.catch(() => { })));
    };
    const pending = new Map();
    const VERSIONIERT = new Set(['blocks', 'collections', 'views']);
    const plattenRev = new Map();
    const basisStand = new Map();
    const revAbnehmen = (fach, satz) => {
        if (!satz || !VERSIONIERT.has(fach))
            return;
        if (typeof satz.rev === 'number')
            plattenRev.set(fach + ':' + satz.id, satz.rev);
        if ('rev' in satz)
            delete satz.rev;
    };
    const merkeBasis = (fach, satz) => {
        if (!satz)
            return;
        const k = fach + ':' + satz.id;
        if (pending.has(k) || basisStand.has(k))
            return;
        try {
            basisStand.set(k, JSON.parse(JSON.stringify(satz)));
        }
        catch { }
    };
    const gleichWert = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    const zusammenMitFenster = (basis, hier, dort) => {
        if (basis && typeof Zusammen !== 'undefined' && Zusammen.dreiWege) {
            const r = Zusammen.dreiWege(basis, hier, dort);
            return { satz: r.satz, konflikte: r.konflikte || [] };
        }
        const satz = { ...hier };
        const konflikte = [];
        const namen = new Set([...Object.keys(hier || {}), ...Object.keys(dort || {})]);
        for (const k of namen) {
            const H = hier?.[k], D = dort?.[k];
            if (gleichWert(H, D))
                continue;
            if (H === undefined) {
                satz[k] = D;
                continue;
            }
            if (D === undefined)
                continue;
            if (k === 'edited' || k === 'created') {
                satz[k] = String(H) > String(D) ? H : D;
                continue;
            }
            if (Array.isArray(H) && Array.isArray(D) && (k === 'content' || k === 'viewIds')) {
                satz[k] = [...H, ...D.filter((x) => !H.includes(x))];
                continue;
            }
            konflikte.push({ pfad: [k], feld: k, hier: H, dort: D,
                grund: 'Zwei Fenster haben dasselbe Feld zugleich geändert — dieses Fenster hat seine Fassung behalten.' });
        }
        return { satz, konflikte };
    };
    let timer = null;
    let eilig = false;
    let speicherVoll = false;
    let wiederholung = null;
    const WIEDERHOLEN_MS = 15000;
    const istVoll = (err) => {
        const e = err;
        return !!e && (e.speicherVoll === true || e.name === 'QuotaExceededError' ||
            /quota/i.test(String(e.message ?? '')));
    };
    const meldeVoll = () => {
        speicherVoll = true;
        const n = pending.size;
        warne('Der Speicher dieses Geräts ist voll: ' + n + ' Änderung' + (n === 1 ? ' ist' : 'en sind') +
            ' noch nicht gesichert. Redion versucht es alle 15 Sekunden wieder. ' +
            'Gib Platz frei oder lege eine Sicherung an — und schliesse dieses Fenster nicht, ' +
            'solange diese Meldung steht.');
        if (!wiederholung)
            wiederholung = setTimeout(() => {
                wiederholung = null;
                flush().catch(() => { });
            }, WIEDERHOLEN_MS);
    };
    const vollVorbei = () => {
        if (!speicherVoll || pending.size)
            return;
        speicherVoll = false;
        if (wiederholung) {
            clearTimeout(wiederholung);
            wiederholung = null;
        }
        warne('Der Speicher hat wieder Platz — alle Änderungen sind gesichert.');
    };
    let naechsterSchritt = 1;
    let offenerSchritt = 0;
    const schrittEltern = new Map();
    const schrittWurzel = (s) => {
        let w = s;
        while (schrittEltern.has(w) && schrittEltern.get(w) !== w)
            w = schrittEltern.get(w);
        let x = s;
        while (x !== w) {
            const n = schrittEltern.get(x);
            schrittEltern.set(x, w);
            x = n;
        }
        return w;
    };
    const schritteVereinen = (a, b) => {
        const wa = schrittWurzel(a), wb = schrittWurzel(b);
        if (wa !== wb) {
            schrittEltern.set(wb, wa);
            schrittGroesse.set(wa, (schrittGroesse.get(wa) || 0) + (schrittGroesse.get(wb) || 0));
            schrittGroesse.delete(wb);
        }
        return wa;
    };
    const schrittGroesse = new Map();
    const aktuellerSchritt = () => {
        if (!offenerSchritt) {
            offenerSchritt = naechsterSchritt++;
            const zu = () => { offenerSchritt = 0; };
            if (typeof queueMicrotask === 'function')
                queueMicrotask(zu);
            else
                Promise.resolve().then(zu);
        }
        return offenerSchritt;
    };
    const save = (store, val) => {
        if (store === 'blocks' || store === 'collections')
            datenGeaendert();
        const k = store + ':' + val.id;
        let s = aktuellerSchritt();
        const vorher = pending.get(k);
        if (vorher && schrittWurzel(vorher.schritt) !== schrittWurzel(s))
            s = schritteVereinen(vorher.schritt, s);
        const w = schrittWurzel(s);
        if (!vorher || schrittWurzel(vorher.schritt) !== w)
            schrittGroesse.set(w, (schrittGroesse.get(w) || 0) + 1);
        pending.set(k, { store, val, schritt: w });
        if ((schrittGroesse.get(w) || 0) > 1)
            eilig = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
            flush().catch((err) => { if (!istVoll(err))
                throw err; });
        }, eilig ? 0 :
            ((typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.SCHREIB_PAUSE_MS : 400));
    };
    let dauerhaftGefragt = false;
    const DAUERHAFT_SCHLUESSEL = 'redion:speicher-dauerhaft:gefragt';
    const DAUERHAFT_ABSTAND_MS = 30 * 24 * 3600 * 1000;
    function dauerhaftBitten() {
        if (dauerhaftGefragt || DEMO || typeof AppEinstellung === 'undefined')
            return;
        dauerhaftGefragt = true;
        try {
            const zuletzt = Number(localStorage.getItem(DAUERHAFT_SCHLUESSEL) || 0);
            if (zuletzt && Date.now() - zuletzt < DAUERHAFT_ABSTAND_MS)
                return;
            localStorage.setItem(DAUERHAFT_SCHLUESSEL, String(Date.now()));
        }
        catch { }
        AppEinstellung.speicherSichern().catch(() => false);
    }
    const flush = () => {
        clearTimeout(timer);
        eilig = false;
        if (!db) {
            pending.clear();
            schrittEltern.clear();
            schrittGroesse.clear();
            return Promise.resolve();
        }
        const schluessel = [...pending.keys()];
        const posten = [...pending.values()].map(x => ({ ...x, schritt: schrittWurzel(x.schritt) }));
        pending.clear();
        posten.forEach(x => schrittGroesse.delete(x.schritt));
        if (!posten.length)
            return Promise.resolve();
        const zurueckInDenStapel = (welche) => {
            welche.forEach(x => {
                const k = x.store + ':' + x.val.id;
                const da = pending.get(k);
                if (!da) {
                    pending.set(k, x);
                    const w = schrittWurzel(x.schritt);
                    schrittGroesse.set(w, (schrittGroesse.get(w) || 0) + 1);
                }
                else {
                    da.schritt = schritteVereinen(da.schritt, x.schritt);
                }
            });
        };
        const melde = (eintrag, err) => {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('ablage', 'Ein Satz liess sich nicht schreiben', { store: eintrag.store, id: eintrag.val.id, ...(err ? { err } : {}) });
        };
        const ganzOderGarNicht = (menge) => new Promise((ok, nein) => {
            let t;
            try {
                t = tx([...new Set(menge.map(x => x.store))], 'readwrite');
            }
            catch (err) {
                nein(err);
                return;
            }
            let ersterFehler = null;
            const raus = [];
            t.oncomplete = () => ok(raus);
            t.onerror = t.onabort = () => nein(ersterFehler || t.error ||
                new Error('Das Schreiben wurde abgebrochen — nichts davon ist auf der Platte'));
            const abbrechen = (eintrag, err) => {
                if (!ersterFehler)
                    ersterFehler = err;
                melde(eintrag, err);
                try {
                    t.abort();
                }
                catch { }
            };
            const schreibe = (eintrag, wert) => {
                const r = t.objectStore(eintrag.store).put(wert);
                r.onerror = () => { if (!ersterFehler)
                    ersterFehler = r.error; melde(eintrag, r.error); };
            };
            for (const eintrag of menge) {
                const id = String(eintrag.val.id);
                const k = eintrag.store + ':' + id;
                if (!VERSIONIERT.has(eintrag.store)) {
                    try {
                        schreibe(eintrag, eintrag.val);
                    }
                    catch (err) {
                        abbrechen(eintrag, err);
                        return;
                    }
                    raus.push({ k, store: eintrag.store, id, rev: null, zusammengefuehrt: false, konflikte: [] });
                    continue;
                }
                let lesen;
                try {
                    lesen = t.objectStore(eintrag.store).get(eintrag.val.id);
                }
                catch (err) {
                    abbrechen(eintrag, err);
                    return;
                }
                lesen.onsuccess = () => {
                    try {
                        const platte = lesen.result;
                        const plattenNr = platte && typeof platte.rev === 'number' ? platte.rev : undefined;
                        const erwartet = plattenRev.get(k);
                        let zusammengefuehrt = false;
                        let konflikte = [];
                        if (platte && (plattenNr !== undefined || erwartet !== undefined) && plattenNr !== erwartet) {
                            const dort = { ...platte };
                            delete dort.rev;
                            const r = zusammenMitFenster(basisStand.get(k) ?? null, eintrag.val, dort);
                            Object.assign(eintrag.val, r.satz);
                            if ('rev' in eintrag.val)
                                delete eintrag.val.rev;
                            zusammengefuehrt = true;
                            konflikte = r.konflikte;
                        }
                        const neu = (plattenNr ?? 0) + 1;
                        schreibe(eintrag, { ...eintrag.val, rev: neu });
                        raus.push({ k, store: eintrag.store, id, rev: neu, zusammengefuehrt, konflikte });
                    }
                    catch (err) {
                        abbrechen(eintrag, err);
                    }
                };
            }
        });
        const nachSchreiben = (liste) => {
            let zeichnen = false;
            for (const g of liste) {
                if (g.rev !== null)
                    plattenRev.set(g.k, g.rev);
                basisStand.delete(g.k);
                if (g.zusammengefuehrt)
                    zeichnen = true;
                if (g.konflikte.length && typeof Zusammen !== 'undefined') {
                    try {
                        Zusammen.merke(g.id, g.store, g.konflikte);
                    }
                    catch { }
                }
            }
            if (liste.some(g => g.konflikte.length) && typeof Zusammen !== 'undefined') {
                try {
                    Zusammen.melde();
                    Zusammen.hinweisen();
                }
                catch { }
            }
            if (zeichnen)
                notify('fremd');
            if (liste.some(g => g.store === 'blocks'))
                dauerhaftBitten();
        };
        const fertig = ganzOderGarNicht(posten).then((liste) => { nachSchreiben(liste); vollVorbei(); return undefined; }, async (ersterFehler) => {
            let voll = istVoll(ersterFehler);
            const schritte = new Map();
            posten.forEach(x => {
                const liste = schritte.get(x.schritt);
                if (liste)
                    liste.push(x);
                else
                    schritte.set(x.schritt, [x]);
            });
            const gescheitert = [];
            const gelandet = [];
            for (const menge of schritte.values()) {
                try {
                    nachSchreiben(await ganzOderGarNicht(menge));
                    menge.forEach(x => gelandet.push(x.store + ':' + x.val.id));
                }
                catch (err) {
                    gescheitert.push(...menge);
                    if (istVoll(err))
                        voll = true;
                }
            }
            if (gelandet.length)
                meldeAnAndereFenster('geaendert', gelandet);
            if (!gescheitert.length) {
                vollVorbei();
                return 'gemeldet';
            }
            zurueckInDenStapel(gescheitert);
            if (voll)
                meldeVoll();
            throw Object.assign(new Error(gescheitert.length + ' von ' + posten.length +
                ' Sätzen liessen sich nicht schreiben — ihre Arbeitsschritte bleiben ganz im Stapel'), { speicherVoll: voll });
        });
        fertig.then((x) => { if (x !== 'gemeldet')
            meldeAnAndereFenster('geaendert', schluessel); }, () => { });
        const aufraeumen = () => { if (!pending.size) {
            schrittEltern.clear();
            schrittGroesse.clear();
        } };
        fertig.then(aufraeumen, aufraeumen);
        return fertig;
    };
    window.addEventListener('beforeunload', (e) => {
        const ungesichert = speicherVoll && pending.size > 0;
        flush().catch(() => { });
        if (ungesichert) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    window.addEventListener('visibilitychange', () => { if (document.hidden)
        flush().catch(() => { }); });
    const search = (q, filter = {}) => {
        const needle = q.trim().toLowerCase();
        if (!needle)
            return [];
        const out = [];
        const stueck = needle.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{6,12}/) ||
            (/^[0-9a-f-]+$/.test(needle) ? [needle] : null);
        const ohne = stueck ? stueck[0].replace(/-/g, '') : '';
        if (ohne.length >= 12) {
            const treffer = Object.values(cache.blocks).filter(b => b.id && b.id.replace(/-/g, '').startsWith(ohne));
            if (treffer.length) {
                return treffer.slice(0, 20).map(b => {
                    const seite = seiteVon(b);
                    return { page: seite, treffer: 'Seiten-ID',
                        snippet: b.id + (b.type !== 'page' ? ' · Block vom Typ ' + b.type : '') +
                            (b.alive ? '' : ' · im Papierkorb'),
                        pfad: pfadText(seite.id) };
                });
            }
        }
        const wo = filter.wo || 'alles';
        const grenze = { tag: 1, woche: 7, monat: 30 }[filter.seit];
        const seitDatum = grenze ? Date.now() - grenze * 86400000 : 0;
        let zuPruefen = Object.values(cache.blocks);
        try {
            if (typeof Kontext !== 'undefined' && Kontext.kandidaten) {
                const ids = Kontext.kandidaten(needle);
                if (Array.isArray(ids))
                    zuPruefen = ids.map((id) => cache.blocks[id]).filter(Boolean);
            }
        }
        catch { }
        zuPruefen.forEach(b => {
            if (!b.alive)
                return;
            if (b.type !== 'page' || b.parentTable === 'collection')
                return;
            if (seitDatum && new Date(b.edited || b.created).getTime() < seitDatum)
                return;
            if (filter.ort && !pathOf(b.id).some(x => x.id === filter.ort))
                return;
            const hatDb = (b.content || []).some((id) => cache.blocks[id]?.type === 'database');
            if (filter.typ === 'datenbank' && !hatDb)
                return;
            if (filter.typ === 'seite' && hatDb)
                return;
            const t = (b.text || '').toLowerCase();
            const aliases = Array.isArray(b.aliases)
                ? b.aliases.map((value) => String(value ?? '').trim()).filter(Boolean) : [];
            const alias = aliases.find((value) => value.toLowerCase().includes(needle));
            if (wo !== 'inhalt' && (t.includes(needle) || alias)) {
                out.push({ page: b, treffer: t.includes(needle) ? 'Titel' : 'Alias',
                    snippet: t.includes(needle) ? b.text : alias, pfad: pfadText(b.id) });
                return;
            }
            if (wo !== 'titel') {
                const hit = findInside(b.id, needle, 0);
                if (hit)
                    out.push({ page: b, treffer: 'Inhalt', snippet: hit.text,
                        blockId: hit.blockId, pfad: pfadText(b.id) });
            }
        });
        return out.slice(0, 60);
    };
    const seiteVon = (b) => {
        let cur = b, n = 0;
        while (cur && n++ < 40) {
            if (cur.type === 'page')
                return cur;
            cur = cur.parentId ? cache.blocks[cur.parentId] : null;
        }
        return b;
    };
    const pfadText = (id) => pathOf(id).slice(0, -1)
        .map(p => p.text || 'Ohne Titel').join(' / ');
    const durchsuchbar = (b) => {
        const raus = [String(b.text || ''), String(b.suchtext || ''), String(b.ocrText || '')];
        if (b.dateiId)
            raus.push(dateiNamen.get(String(b.dateiId)) || '');
        const quelle = b.quiz && b.quiz.source;
        if (quelle)
            raus.push(String(quelle.title || ''), String(quelle.edition || ''));
        if (b.learningPackage)
            raus.push(String(b.learningPackage.license || ''));
        return raus;
    };
    const findInside = (pageId, needle, tiefe) => {
        if (tiefe > 5)
            return null;
        for (const kid of childrenOf(pageId)) {
            if (kid.type === 'page')
                continue;
            for (const roh of durchsuchbar(kid)) {
                if (!roh)
                    continue;
                const i = roh.toLowerCase().indexOf(needle);
                if (i < 0)
                    continue;
                const aus = roh.slice(Math.max(0, i - 30), i + 60).replace(/\s+/g, ' ');
                return { text: '…' + aus + '…', blockId: kid.id };
            }
            const tiefer = findInside(kid.id, needle, tiefe + 1);
            if (tiefer)
                return tiefer;
        }
        return null;
    };
    const GEHEIM_PRAEFIX = 'api:';
    const GEHEIM = ['wolkeToken', 'wolkeProbe'];
    const istGeheim = (k) => GEHEIM.includes(k) || k.startsWith(GEHEIM_PRAEFIX);
    const NUR_HIER = ['sicherungOrdner', 'wolkeGeteilt',
        'wolkeNachtrag', 'wolkeNachtragAlles'];
    const istNurHier = (k) => NUR_HIER.includes(k);
    const GERAETEIGEN = ['sicherungOrdnerName',
        'wolkeToken', 'wolkeKonto', 'wolkeBereich',
        'wolkeSalz', 'wolkeProbe'];
    const istGeraeteEigen = (k) => GERAETEIGEN.includes(k) || k.startsWith(GEHEIM_PRAEFIX);
    const FAECHER_IMMER = ['blocks', 'collections', 'views', 'meta', 'versions'];
    const FAECHER_MIT_ANHANG = ['dateien', 'stuecke'];
    const FAECHER_NIE = {
        auftraege: 'ein halb erledigter Auftrag ist Arbeit an diesem Gerät (E286)',
        basis: 'der Abgleichsstand ist kein Inhalt, sondern ein Gedächtnis',
        vorrat: 'vorberechnete Werte — ein Beschleuniger, kein Inhalt',
        suchindex: 'entsteht beim Start neu'
    };
    const faecherUnbekannt = (namen) => {
        const liste = Array.isArray(namen) ? namen
            : (db && db.objectStoreNames) ? [...db.objectStoreNames]
                : [];
        return liste.filter(n => !FAECHER_IMMER.includes(n) && !FAECHER_MIT_ANHANG.includes(n) &&
            !(n in FAECHER_NIE)).sort();
    };
    const satzZuUnbekannten = (liste) => !liste || !liste.length ? ''
        : ' ACHTUNG: ' + liste.length + ' Fach/Fächer der Ablage (' +
            liste.join(', ') + ') werden von dieser Sicherung NICHT erfasst. ' +
            'Sie stehen in keiner der Listen in `indexdb.ts` — wer sie angelegt ' +
            'hat, hat nicht entschieden, ob sie mitreisen sollen. Beim ' +
            'Einspielen mit „Ersetzen" wären sie weg.';
    const exportAll = (mitAnhaengen = false, mitGeheimnissen = false) => {
        const dateienDa = zaehlerDateien();
        const abgeleitetDa = zaehlerAbgeleitet();
        const fehlenAnhaenge = dateienDa && !mitAnhaengen;
        const ordnerDa = 'sicherungOrdner' in cache.meta && !!cache.meta['sicherungOrdner'];
        const nurHierAusgelassen = NUR_HIER.filter(k => {
            const v = cache.meta[k];
            return Array.isArray(v) ? v.length > 0 : !!v;
        });
        const metaGefiltert = {};
        const geheimAusgelassen = [];
        for (const k of Object.keys(cache.meta)) {
            if (istNurHier(k))
                continue;
            if (!mitGeheimnissen && istGeheim(k)) {
                if (cache.meta[k])
                    geheimAusgelassen.push(k);
                continue;
            }
            metaGefiltert[k] = cache.meta[k];
        }
        geheimAusgelassen.sort();
        const echteImArchiv = dateienDa - abgeleitetDa;
        const ueberAbgeleitete = !abgeleitetDa ? ''
            : abgeleitetDa === 1
                ? ' Ein gerastertes Seitenbild ist bewusst NICHT dabei: es entsteht ' +
                    'aus dem Original neu — in Redion über den Knopf „Aus dem Original ' +
                    'zurückholen" auf der leeren Seite.'
                : ' ' + abgeleitetDa + ' gerasterte Seitenbilder sind bewusst NICHT ' +
                    'dabei: sie entstehen aus den Originalen neu — in Redion über den ' +
                    'Knopf „Aus dem Original zurückholen" auf der leeren Seite.';
        const ordnerName = String(cache.meta['sicherungOrdnerName'] || '').trim();
        const ueberOrdner = !ordnerDa ? ''
            : ' Der gewählte Sicherungsordner ist NICHT dabei: ein Ordnerzugriff ' +
                'gilt nur auf dem Gerät, auf dem er erteilt wurde, und liesse sich ' +
                'nicht mitschreiben.' +
                (ordnerName ? ' Er hiess „' + ordnerName + '".' : '') +
                ' Nach dem Einspielen einmal neu wählen unter Einstellungen → ' +
                'Sicherung.';
        const ueberGeteilt = !nurHierAusgelassen.includes('wolkeGeteilt') ? ''
            : ' Welche Seiten geteilt sind, ist NICHT dabei: das ist eine ' +
                'Erlaubnis auf dem Server, keine Angabe in einer Datei. Nach dem ' +
                'Einspielen steht sie weiter dort — Redion holt sie beim nächsten ' +
                'Blick in die Freigaben.';
        const ueberAuftraege = !exportAuftraegeOffen ? ''
            : ' ' + exportAuftraegeOffen + ' Auftrag/Aufträge standen beim Sichern ' +
                'noch offen (z. B. ein laufendes Einlesen). Sie reisen NICHT mit: ' +
                'ihre Eingaben liegen auf diesem Gerät. Auf diesem Gerät laufen sie ' +
                'weiter.';
        const unbekannteFaecher = faecherUnbekannt();
        const ueberUnbekannte = satzZuUnbekannten(unbekannteFaecher);
        const ueberGeheimnisse = !geheimAusgelassen.length ? ''
            : ' ' + geheimAusgelassen.length + ' Zugangsdaten (' +
                geheimAusgelassen.join(', ') + ') sind bewusst NICHT dabei: eine ' +
                'unverschlüsselte Sicherung liegt offen da und würde sie ' +
                'weitergeben. Eine mit Passwort verschlüsselte Sicherung nimmt ' +
                'sie mit.';
        return JSON.stringify({
            version: VERSION,
            exportiert: now(),
            enthaelt: FAECHER_IMMER
                .concat(mitAnhaengen && echteImArchiv ? FAECHER_MIT_ANHANG : []),
            fehlt: (fehlenAnhaenge ? FAECHER_MIT_ANHANG : [])
                .concat(exportAuftraegeOffen ? ['auftraege'] : [])
                .concat(nurHierAusgelassen)
                .concat(geheimAusgelassen)
                .concat(unbekannteFaecher),
            abgeleitetAusgelassen: mitAnhaengen ? abgeleitetDa : 0,
            hinweis: (fehlenAnhaenge
                ? 'Diese Sicherung enthält ' + dateienDa + ' Datei(en) NICHT — nur ihre ' +
                    'Blöcke. Anhänge liegen als Blob in der Ablage und passen nicht in ' +
                    'eine JSON-Datei. Sie bleiben auf diesem Gerät.'
                : echteImArchiv
                    ? 'Vollständig: die ' + echteImArchiv + ' Datei(en) liegen im Ordner ' +
                        '„dateien" desselben Archivs.' + ueberAbgeleitete
                    : abgeleitetDa
                        ? 'Dieser Bestand hat nur abgeleitete Dateien.' + ueberAbgeleitete
                        : 'Vollständig: dieser Bestand hat keine Dateianhänge.') + ueberOrdner + ueberGeteilt + ueberGeheimnisse + ueberAuftraege +
                ueberUnbekannte,
            blocks: cache.blocks,
            collections: cache.collections,
            views: cache.views,
            meta: metaGefiltert,
            versions: exportVersionen
        }, null, 2);
    };
    let exportVersionen = [];
    let exportDateien = 0;
    let exportAuftraegeOffen = 0;
    let exportAbgeleitet = 0;
    const zaehlerDateien = () => exportDateien;
    const zaehlerAbgeleitet = () => exportAbgeleitet;
    const exportVorbereiten = async () => {
        exportVersionen = await all('versions');
        const alleDateien = await all('dateien');
        exportDateien = alleDateien.length;
        exportAbgeleitet = alleDateien.filter((d) => d && d.abgeleitet).length;
        try {
            const auftraege = await all('auftraege');
            exportAuftraegeOffen = (auftraege || []).filter((a) => a && (a.zustand === 'wartet' || a.zustand === 'laeuft')).length;
        }
        catch {
            exportAuftraegeOffen = 0;
        }
        return { versionen: exportVersionen.length, dateien: exportDateien,
            abgeleitet: exportAbgeleitet, auftraegeOffen: exportAuftraegeOffen };
    };
    const importAll = async (json, art) => {
        await settled();
        const gelesen = ImportSicherheit.lesen(json);
        const d = gelesen.wert;
        if (art !== 'ersetzen' && art !== 'zusammenfuehren')
            throw new Error('Beim Einspielen muss feststehen, was geschehen soll: ' +
                '„ersetzen" wirft weg, was nicht in der Sicherung steht, ' +
                '„zusammenfuehren" legt sie dazu. Ohne Angabe wird nichts getan.');
        const befund = ImportValidierung.pruefen(d, VERSION);
        if (!befund.taugt) {
            throw new Error(befund.punkte[0]?.text ||
                'Das sieht nicht nach einer Sicherung dieser App aus.');
        }
        const leer = () => Object.create(null);
        const neu = {
            blocks: ImportSicherheit.verzeichnis(d.blocks) || leer(),
            collections: ImportSicherheit.verzeichnis(d.collections) || leer(),
            views: ImportSicherheit.verzeichnis(d.views) || leer(),
            meta: ImportSicherheit.verzeichnis(d.meta) || leer()
        };
        for (const k of Object.keys(cache.meta)) {
            if (!istGeraeteEigen(k))
                continue;
            const lebend = cache.meta[k];
            if (lebend !== undefined && lebend !== null && lebend !== '')
                neu.meta[k] = lebend;
        }
        for (const k of NUR_HIER) {
            const lebend = cache.meta[k];
            if (lebend === undefined || lebend === null)
                delete neu.meta[k];
            else
                neu.meta[k] = lebend;
        }
        if (art === 'ersetzen') {
            const alteListe = (k) => {
                const w = getMeta(k, null);
                return Array.isArray(w) ? w : [];
            };
            const ausSicherung = (k) => Array.isArray(neu.meta[k]) ? neu.meta[k] : [];
            const bloecke = new Map();
            for (const e of [...ausSicherung('wolkeBloeckeWeg'), ...alteListe('wolkeBloeckeWeg')]) {
                if (!e || !e.id)
                    continue;
                if (neu.blocks[e.id] || neu.collections[e.id] ||
                    neu.views[e.id])
                    continue;
                bloecke.set(e.id, e);
            }
            if (bloecke.size)
                neu.meta['wolkeBloeckeWeg'] = [...bloecke.values()];
            for (const k of ['wolkeDateienWeg', 'wolkeDateienOben']) {
                const beide = [...new Set([...ausSicherung(k).map(String), ...alteListe(k).map(String)])];
                if (beide.length)
                    neu.meta[k] = beide;
            }
            neu.meta['wolkeMarkeHoch'] = '';
            neu.meta['wolkeMarkeRunter'] = '';
            neu.meta['wolkeMarkeDateien'] = '';
            if (getMeta('wolkeToken', ''))
                neu.meta['wolkeNeuAbgleich'] = now();
            else
                delete neu.meta['wolkeNeuAbgleich'];
        }
        if (db) {
            await new Promise((ok, nein) => {
                let t;
                try {
                    t = tx(['blocks', 'collections', 'views', 'meta', 'versions', 'suchindex'], 'readwrite');
                }
                catch (err) {
                    return nein(err);
                }
                t.oncomplete = () => ok();
                t.onerror = t.onabort = () => nein(t.error || new Error('Das Einspielen wurde abgebrochen'));
                const schreiben = () => {
                    try {
                        for (const b of Object.values(neu.blocks))
                            t.objectStore('blocks').put(b);
                        for (const c of Object.values(neu.collections))
                            t.objectStore('collections').put(c);
                        for (const v of Object.values(neu.views))
                            t.objectStore('views').put(v);
                        for (const [k, v] of Object.entries(neu.meta))
                            t.objectStore('meta').put({ k, v });
                        if (Array.isArray(d.versions))
                            for (const v of d.versions)
                                t.objectStore('versions').put(v);
                    }
                    catch (err) {
                        try {
                            t.abort();
                        }
                        catch { }
                        nein(err);
                    }
                };
                if (art === 'ersetzen') {
                    t.objectStore('suchindex').clear();
                    const faecher = [['blocks', neu.blocks], ['collections', neu.collections], ['views', neu.views]];
                    let offen = faecher.length + 1;
                    const dann = () => { if (--offen === 0)
                        schreiben(); };
                    const lesen = (fach, weiter) => {
                        const r = t.objectStore(fach).getAllKeys();
                        r.onsuccess = () => weiter(r.result);
                        r.onerror = () => {
                            try {
                                t.abort();
                            }
                            catch { }
                            nein(r.error || new Error('Fach „' + fach + '" nicht lesbar'));
                        };
                    };
                    for (const [fach, behalten] of faecher)
                        lesen(fach, (keys) => {
                            for (const k of keys)
                                if (!behalten[String(k)])
                                    t.objectStore(fach).delete(k);
                            dann();
                        });
                    lesen('meta', (keys) => {
                        for (const k of keys)
                            if (!(String(k) in neu.meta))
                                t.objectStore('meta').delete(k);
                        dann();
                    });
                }
                else {
                    schreiben();
                }
            }).catch((err) => {
                if (typeof Reporter !== 'undefined')
                    Reporter.error('Ablage', 'Einspielen abgebrochen — alles zurückgerollt', err);
                throw new Error('Die Sicherung wurde NICHT eingespielt: ' +
                    (err instanceof Error ? err.message : String(err)) + '. ' +
                    'Es ist nichts verändert worden — die Transaktion hat alles ' +
                    'zurückgerollt. Schliesse andere Fenster dieser App und versuche ' +
                    'es noch einmal.');
            });
        }
        plattenRev.clear();
        basisStand.clear();
        if (art === 'ersetzen') {
            cache.blocks = neu.blocks;
            cache.collections = neu.collections;
            cache.views = neu.views;
            cache.meta = neu.meta;
            cache.suchindex = {};
        }
        else {
            Object.assign(cache.blocks, neu.blocks);
            Object.assign(cache.collections, neu.collections);
            Object.assign(cache.views, neu.views);
            Object.assign(cache.meta, neu.meta);
            const dazu = [...Object.keys(neu.blocks || {}),
                ...Object.keys(neu.collections || {}),
                ...Object.keys(neu.views || {})];
            const GRENZE = 20000;
            if (dazu.length > GRENZE) {
                cache.meta['wolkeNachtragAlles'] = true;
            }
            else {
                const alt = Array.isArray(cache.meta['wolkeNachtrag'])
                    ? cache.meta['wolkeNachtrag'] : [];
                const zusammen = [...new Set([...alt, ...dazu])];
                if (zusammen.length > GRENZE)
                    cache.meta['wolkeNachtragAlles'] = true;
                else
                    cache.meta['wolkeNachtrag'] = zusammen;
            }
            await setMeta('wolkeNachtrag', cache.meta['wolkeNachtrag'] || []);
            if (cache.meta['wolkeNachtragAlles'])
                await setMeta('wolkeNachtragAlles', true);
        }
        if (art === 'ersetzen') {
            try {
                for (const a of (await all('auftraege')) || [])
                    await del('auftraege', a.id);
            }
            catch { }
            await basisLeeren();
            const grabsteine = getMeta('wolkeBloeckeWeg', []) || [];
            for (const e of grabsteine)
                if (e && e.id && e.satz)
                    await basisPut(e.id, e.satz);
        }
        if (typeof Umzuege !== 'undefined') {
            try {
                Umzuege.zuruecksetzen();
                Umzuege.laufen();
            }
            catch (e) {
                if (typeof Reporter !== 'undefined')
                    Reporter.error('Ablage', 'Umzug nach dem Einspielen: ' +
                        (e instanceof Error ? e.message : String(e)), e);
            }
        }
        datenGeaendert();
        notify('import');
        meldeAnAndereFenster('alles', []);
        await settled();
        return { bloecke: Object.keys(cache.blocks).length,
            versionen: Array.isArray(d.versions) ? d.versions.length : 0,
            fehlt: d.fehlt || [],
            frage: !!getMeta('wolkeNeuAbgleich', ''),
            entschaerft: gelesen.fund.entfernt,
            entschaerftSatz: ImportSicherheit.satz(gelesen.fund),
            befund: befund.punkte,
            fassung: befund.fassung };
    };
    const baum = (id) => {
        const raus = (bid, tiefe) => {
            const x = cache.blocks[bid];
            if (!x || tiefe > 40)
                return null;
            const k = JSON.parse(JSON.stringify(x));
            delete k.content;
            k.kinder = (x.content || []).map((c) => raus(c, tiefe + 1)).filter(Boolean);
            if (x.collectionId && cache.collections[x.collectionId]) {
                const c = cache.collections[x.collectionId];
                k.collection = JSON.parse(JSON.stringify(c));
                k.views = (c.viewIds || []).map((v) => cache.views[v]).filter(Boolean)
                    .map((v) => JSON.parse(JSON.stringify(v)));
                k.rows = rowsOf(c.id).map(r => JSON.parse(JSON.stringify(r)));
            }
            return k;
        };
        return raus(id, 0);
    };
    const baumEinfuegen = (knoten, parentId, index = -1) => {
        if (!knoten)
            return null;
        const rein = (k, eltern, idx) => {
            const patch = Object.assign({}, k);
            delete patch.id;
            delete patch.kinder;
            delete patch.collection;
            delete patch.views;
            delete patch.content;
            patch.content = [];
            if (k.collection)
                delete patch.rows;
            if (k.collection) {
                const neueColl = uid();
                const idKarte = {};
                const views = (k.views || []).map((v) => {
                    const nv = JSON.parse(JSON.stringify(v));
                    idKarte[v.id] = nv.id = uid();
                    nv.collectionId = neueColl;
                    cache.views[nv.id] = nv;
                    save('views', nv);
                    return nv;
                });
                const nc = JSON.parse(JSON.stringify(k.collection));
                nc.id = neueColl;
                nc.viewIds = views.map((v) => v.id);
                cache.collections[neueColl] = nc;
                save('collections', nc);
                patch.collectionId = neueColl;
                (k.rows || []).forEach((r) => {
                    const nr = JSON.parse(JSON.stringify(r));
                    nr.id = uid();
                    nr.parentId = neueColl;
                    nr.parentTable = 'collection';
                    cache.blocks[nr.id] = nr;
                    save('blocks', nr);
                });
            }
            const neu = addBlock(eltern, k.type || 'text', patch, idx);
            (k.kinder || []).forEach((kind) => rein(kind, neu.id, -1));
            return neu;
        };
        const wurzel = rein(knoten, parentId, index);
        notify('pages');
        return wurzel;
    };
    const kinderLeeren = (pageId) => {
        const p = cache.blocks[pageId];
        if (!p)
            return;
        [...(p.content || [])].forEach(id => purgeBlock(id));
        p.content = [];
        elternGeaendert(p);
    };
    const ABGLEICH_BLEIBT = new Set(['id', 'content', 'edited', 'geaendertVon', 'wolkeVersion', 'trashedAt', 'folge']);
    const knotenFeldAusnahme = (k, feld) => ABGLEICH_BLEIBT.has(feld) || feld === 'kinder' || feld === 'collection' || feld === 'views'
        || (feld === 'rows' && !!k.collection);
    const baumAbgleichen = (pageId, daten) => {
        const seite = cache.blocks[pageId];
        if (!seite)
            return null;
        const wurzelKinder = (Array.isArray(daten) ? daten : (daten && Array.isArray(daten.kinder) ? daten.kinder : []))
            .filter((k) => k && typeof k === 'object');
        const zaehler = { gesetzt: 0, zurueck: 0, weggelegt: 0 };
        const soll = new Set();
        const istBlatt = (k) => !!k && k.type === 'page';
        const kopie = (x) => JSON.parse(JSON.stringify(x));
        const satzAusKnoten = (k) => {
            const patch = {};
            for (const [feld, wert] of Object.entries(k)) {
                if (feld === 'id' || feld === 'edited' || feld === 'geaendertVon' || feld === 'wolkeVersion' || feld === 'trashedAt')
                    continue;
                if (feld === 'kinder' || feld === 'collection' || feld === 'views' || feld === 'content')
                    continue;
                if (feld === 'rows' && k.collection)
                    continue;
                patch[feld] = kopie(wert);
            }
            patch.alive = true;
            return patch;
        };
        const angleichen = (b, k) => {
            let anders = false;
            for (const [feld, wert] of Object.entries(k)) {
                if (knotenFeldAusnahme(k, feld))
                    continue;
                if (JSON.stringify(b[feld]) !== JSON.stringify(wert)) {
                    b[feld] = kopie(wert);
                    anders = true;
                }
            }
            for (const feld of Object.keys(b)) {
                if (knotenFeldAusnahme(k, feld) || feld in k)
                    continue;
                delete b[feld];
                anders = true;
            }
            if (b.alive !== true) {
                b.alive = true;
                anders = true;
            }
            if ('trashedAt' in b) {
                delete b.trashedAt;
                anders = true;
            }
            return anders;
        };
        const schreiben = (b) => {
            b.edited = now();
            b.geaendertVon = getMeta('nutzer', '') || 'Ich';
            save('blocks', b);
            zaehler.gesetzt++;
        };
        const gehoertHierher = (b) => {
            let cur = b, tiefe = 0;
            while (cur && tiefe++ < 40) {
                if (cur.id === pageId)
                    return true;
                if (!cur.parentId || cur.parentTable === 'collection')
                    return false;
                cur = cache.blocks[cur.parentId];
            }
            return false;
        };
        const datenbankAngleichen = (k) => {
            if (!k.collection || !k.collection.id || k.verknuepft)
                return;
            const cid = String(k.collection.id);
            let c = cache.collections[cid];
            if (!c) {
                c = kopie(k.collection);
                c.viewIds = [];
                c.edited = now();
                cache.collections[cid] = c;
                save('collections', c);
                blockGrabsteinWeg(cid);
            }
            else {
                let anders = false;
                for (const [feld, wert] of Object.entries(k.collection)) {
                    if (feld === 'id' || feld === 'viewIds' || feld === 'edited' || feld === 'wolkeVersion')
                        continue;
                    if (JSON.stringify(c[feld]) !== JSON.stringify(wert)) {
                        c[feld] = kopie(wert);
                        anders = true;
                    }
                }
                if (anders) {
                    c.edited = now();
                    save('collections', c);
                }
            }
            const sollViews = [];
            for (const v of (k.views || [])) {
                if (!v || !v.id)
                    continue;
                sollViews.push(String(v.id));
                const alt = cache.views[v.id];
                if (!alt) {
                    const nv = kopie(v);
                    nv.collectionId = cid;
                    nv.edited = now();
                    cache.views[nv.id] = nv;
                    save('views', nv);
                    blockGrabsteinWeg(String(nv.id));
                }
                else {
                    let anders = false;
                    for (const [feld, wert] of Object.entries(v)) {
                        if (feld === 'id' || feld === 'collectionId' || feld === 'edited' || feld === 'wolkeVersion')
                            continue;
                        if (JSON.stringify(alt[feld]) !== JSON.stringify(wert)) {
                            alt[feld] = kopie(wert);
                            anders = true;
                        }
                    }
                    if (anders) {
                        alt.edited = now();
                        save('views', alt);
                    }
                }
            }
            const rest = (c.viewIds || []).filter((id) => !sollViews.includes(String(id)));
            const neueOrdnung = sollViews.concat(rest);
            if (JSON.stringify(c.viewIds || []) !== JSON.stringify(neueOrdnung)) {
                c.viewIds = neueOrdnung;
                c.edited = now();
                save('collections', c);
            }
            const sollZeilen = new Set();
            for (const r of (k.rows || [])) {
                if (!r || !r.id)
                    continue;
                sollZeilen.add(String(r.id));
                const alt = cache.blocks[r.id];
                if (!alt) {
                    const nr = kopie(r);
                    nr.parentId = cid;
                    nr.parentTable = 'collection';
                    nr.alive = true;
                    delete nr.trashedAt;
                    nr.edited = now();
                    nr.geaendertVon = getMeta('nutzer', '') || 'Ich';
                    cache.blocks[nr.id] = nr;
                    save('blocks', nr);
                    blockGrabsteinWeg(String(nr.id));
                    zaehler.zurueck++;
                }
                else if (alt.alive === false) {
                    restoreBlock(String(r.id));
                    zaehler.zurueck++;
                }
            }
            rowsOf(cid).forEach(r => { if (!sollZeilen.has(String(r.id))) {
                trashBlock(r.id);
                zaehler.weggelegt++;
            } });
        };
        const setze = (k, elternId, idx) => {
            if (!k.id) {
                const neu = addBlock(elternId, k.type || 'text', satzAusKnoten(k), idx);
                zaehler.zurueck++;
                (k.kinder || []).filter(Boolean).forEach((kind, i) => setze(kind, neu.id, i));
                return;
            }
            const id = String(k.id);
            soll.add(id);
            let b = cache.blocks[id];
            let neuAngelegt = false;
            if (b && !gehoertHierher(b) && b.alive !== false) {
                baumEinfuegen(k, elternId, idx);
                zaehler.zurueck++;
                return;
            }
            if (b && b.alive === false) {
                restoreBlock(id);
                zaehler.zurueck++;
            }
            if (!b) {
                const patch = satzAusKnoten(k);
                patch.id = id;
                b = addBlock(elternId, k.type || 'text', patch, idx);
                blockGrabsteinWeg(id);
                zaehler.zurueck++;
                neuAngelegt = true;
            }
            else if (!istBlatt(k)) {
                if (angleichen(b, k))
                    schreiben(b);
            }
            datenbankAngleichen(k);
            if (!istBlatt(k) || neuAngelegt)
                (k.kinder || []).filter(Boolean).forEach((kind, i) => setze(kind, id, i));
        };
        wurzelKinder.forEach((k, i) => setze(k, pageId, i));
        const kanten = (containerId, kinder) => {
            const c = cache.blocks[containerId];
            if (!c)
                return;
            const neu = kinder.filter((k) => k && k.id && cache.blocks[k.id] && gehoertHierher(cache.blocks[k.id]))
                .map((k) => String(k.id));
            const alt = Array.isArray(c.content) ? c.content.slice() : [];
            if (JSON.stringify(alt) !== JSON.stringify(neu)) {
                c.content = neu.slice();
                elternGeaendert(c);
            }
            for (const id of neu) {
                const b = cache.blocks[id];
                if (!b || (b.parentId === containerId && b.parentTable === 'block'))
                    continue;
                const vorher = cache.blocks[b.parentId];
                if (vorher && vorher.id !== containerId && Array.isArray(vorher.content) && vorher.content.includes(id)) {
                    vorher.content = vorher.content.filter((x) => x !== id);
                    elternGeaendert(vorher);
                }
                b.parentId = containerId;
                b.parentTable = 'block';
                schreiben(b);
            }
            for (const id of alt) {
                if (neu.includes(id) || soll.has(id))
                    continue;
                const b = cache.blocks[id];
                if (b && b.alive !== false) {
                    trashBlock(id);
                    zaehler.weggelegt++;
                }
            }
            kinder.filter(Boolean).forEach((k) => { if (k.id && !istBlatt(k))
                kanten(String(k.id), k.kinder || []); });
        };
        kanten(pageId, wurzelKinder);
        notify('pages');
        return zaehler;
    };
    const fassungenAusduennen = (liste, grenzen = {}) => {
        const K = ((typeof KONSTANTEN !== 'undefined') ? KONSTANTEN : {});
        const frisch = grenzen.frisch ?? K.FASSUNGEN_FRISCH ?? 12;
        const tage = grenzen.tage ?? K.FASSUNGEN_TAGE ?? 30;
        const max = grenzen.max ?? K.VERSIONEN_MAX ?? 200;
        const sortiert = [...(liste || [])]
            .filter(v => v && v.id)
            .sort((a, b) => String(b.zeit || '').localeCompare(String(a.zeit || '')));
        const weg = new Set();
        const gesehen = new Set();
        const jetzt = sortiert.length ? new Date(sortiert[0].zeit).getTime() : Date.now();
        const vonHand = (v) => v.anlass && v.anlass !== 'automatisch';
        sortiert.forEach((v, i) => {
            if (i < frisch)
                return;
            if (vonHand(v))
                return;
            const wann = new Date(v.zeit);
            if (isNaN(wann.getTime()))
                return;
            const alterTage = (jetzt - wann.getTime()) / 86400000;
            const eimer = alterTage <= tage
                ? 'T' + v.zeit.slice(0, 10)
                : 'M' + v.zeit.slice(0, 7);
            if (gesehen.has(eimer))
                weg.add(v.id);
            else
                gesehen.add(eimer);
        });
        const bleibt = sortiert.filter(v => !weg.has(v.id));
        if (bleibt.length > max) {
            let zuViel = bleibt.length - max;
            for (let i = bleibt.length - 1; i >= 0 && zuViel > 0; i--)
                if (!vonHand(bleibt[i])) {
                    weg.add(bleibt[i].id);
                    zuViel--;
                }
        }
        return [...weg];
    };
    const versionSpeichern = async (pageId, anlass = 'automatisch') => {
        const p = cache.blocks[pageId];
        if (!p)
            return null;
        const v = {
            id: uid(), pageId, zeit: now(), anlass,
            titel: p.text || 'Ohne Titel',
            icon: p.icon || '📄',
            daten: baum(pageId)
        };
        await put('versions', v);
        try {
            for (const id of fassungenAusduennen(await versionen(pageId)))
                await del('versions', id);
        }
        catch (err) {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('ablage', 'Alte Fassungen liessen sich nicht ausdünnen — ' +
                    'der Verlauf wächst weiter', err);
        }
        return v;
    };
    const versionen = (pageId) => new Promise((ok, fail) => {
        if (!db || !db.objectStoreNames.contains('versions'))
            return ok([]);
        try {
            const r = tx(['versions'], 'readonly').objectStore('versions').index('page').getAll(pageId);
            r.onsuccess = () => ok((r.result || []).sort((a, b) => b.zeit.localeCompare(a.zeit)));
            r.onerror = () => fail(r.error || new Error('Der Versionsverlauf ist nicht lesbar'));
        }
        catch (err) {
            fail(err);
        }
    });
    const versionLoeschen = (id) => del('versions', id);
    const wipe = async () => {
        const geblieben = [];
        if (db)
            await Promise.all([...db.objectStoreNames].map((s) => new Promise(ok => {
                try {
                    const r = tx([s], 'readwrite').objectStore(s).clear();
                    r.onsuccess = () => ok();
                    r.onerror = () => { geblieben.push(s); ok(); };
                }
                catch {
                    geblieben.push(s);
                    ok();
                }
            })));
        cache.blocks = {};
        cache.collections = {};
        cache.views = {};
        cache.meta = {};
        cache.suchindex = {};
        plattenRev.clear();
        basisStand.clear();
        datenGeaendert();
        meldeAnAndereFenster('alles', []);
        if (geblieben.length) {
            const text = 'Nicht alles liess sich löschen. Diese Fächer sind noch da: ' +
                geblieben.join(', ') + '. Der Speicher des Browsers muss von Hand geleert werden.';
            if (typeof Reporter !== 'undefined')
                Reporter.error('ablage', text);
            throw new Error(text);
        }
    };
    const dateiNamen = new Map();
    const dateiNameMerken = (satz) => {
        if (satz && satz.id)
            dateiNamen.set(String(satz.id), String(satz.name || ''));
    };
    const dateiStandHeben = () => {
        const alt = Number(getMeta('dateien:stand', 0)) || 0;
        setMeta('dateien:stand', alt + 1);
    };
    const dateiPut = (satz) => {
        dateiNameMerken(satz);
        dateiStandHeben();
        return put('dateien', satz);
    };
    const dateiHolen = async (id) => {
        const satz = await get('dateien', id);
        dateiNameMerken(satz);
        return satz;
    };
    const dateiWeg = (id) => {
        dateiNamen.delete(String(id));
        dateiStandHeben();
        return del('dateien', id);
    };
    const dateiGrabsteine = () => getMeta('wolkeDateienWeg', []) || [];
    const dateiGrabstein = (id) => {
        const kennung = String(id || '');
        if (!kennung)
            return;
        if (!new Set(getMeta('wolkeDateienOben', []) || []).has(kennung))
            return;
        void metaListeAendern('wolkeDateienOben', alt => alt.includes(kennung) ? alt.filter((x) => x !== kennung) : null);
        void metaListeAendern('wolkeDateienWeg', alt => alt.includes(kennung) ? null : alt.concat([kennung]));
    };
    const dateiGrabsteinWeg = (id) => {
        const k = String(id);
        void metaListeAendern('wolkeDateienWeg', alt => alt.includes(k) ? alt.filter((x) => x !== k) : null);
    };
    const blockGrabsteine = () => getMeta('wolkeBloeckeWeg', []) || [];
    const blockGrabstein = (tabelle, satz, seite) => {
        if (!satz || !satz.id)
            return;
        if (!getMeta('wolkeMarkeHoch', ''))
            return;
        const kopie = Object.assign({}, satz, { alive: false, edited: now() });
        const eintrag = { id: satz.id, tabelle, seite: String(seite || satz.id), satz: kopie };
        void metaListeAendern('wolkeBloeckeWeg', alt => alt.filter((e) => !e || e.id !== satz.id).concat([eintrag]));
    };
    const blockGrabsteinWeg = (id) => {
        void metaListeAendern('wolkeBloeckeWeg', alt => alt.some((e) => e && e.id === id)
            ? alt.filter((e) => e && e.id !== id) : null);
    };
    const dateiAlle = async () => {
        const alle = await all('dateien');
        alle.forEach(dateiNameMerken);
        return alle;
    };
    const basisPut = (id, satz) => put('basis', { id, satz: JSON.stringify(satz), wann: now() });
    const basisHolen = async (id) => {
        const e = await get('basis', id);
        if (!e)
            return null;
        try {
            return JSON.parse(e.satz);
        }
        catch {
            return null;
        }
    };
    const basisWeg = (id) => del('basis', id);
    const basisAlle = () => all('basis');
    const basisLeeren = () => new Promise((ok2) => {
        if (!db || !db.objectStoreNames.contains('basis'))
            return ok2();
        try {
            const r = tx(['basis'], 'readwrite').objectStore('basis').clear();
            r.onsuccess = () => ok2();
            r.onerror = () => ok2();
        }
        catch {
            ok2();
        }
    });
    const vorratPut = (id, satz) => put('vorrat', Object.assign({ id }, satz));
    const vorratHolen = (id) => get('vorrat', id);
    const vorratWeg = (id) => del('vorrat', id);
    const vorratAlle = () => all('vorrat');
    const auftragPut = (satz) => put('auftraege', satz);
    const auftragHolen = (id) => get('auftraege', id);
    const auftragWeg = (id) => del('auftraege', id);
    const auftragAlle = () => all('auftraege');
    const auftragNehmen = (waehle) => new Promise((ok2, fail2) => {
        if (!db) {
            ok2(null);
            return;
        }
        let genommen = null;
        const t = db.transaction('auftraege', 'readwrite');
        const laden = t.objectStore('auftraege').getAll();
        laden.onsuccess = () => {
            try {
                genommen = waehle(laden.result || []);
            }
            catch (e) {
                genommen = null;
            }
            if (genommen)
                t.objectStore('auftraege').put(genommen);
        };
        t.oncomplete = () => ok2(genommen);
        t.onerror = () => fail2(t.error);
        t.onabort = () => fail2(t.error || new Error('Auftrag nehmen abgebrochen.'));
    });
    const suchindexAendern = (setzen = [], loeschen = []) => new Promise((ok2, fail2) => {
        const anwenden = () => {
            loeschen.forEach(id => { delete cache.suchindex[id]; });
            setzen.forEach(e => { if (e && typeof e.id === 'string')
                cache.suchindex[e.id] = e; });
        };
        if (!db || !db.objectStoreNames.contains('suchindex')) {
            anwenden();
            ok2();
            return;
        }
        try {
            const t = tx(['suchindex'], 'readwrite');
            const s = t.objectStore('suchindex');
            loeschen.forEach(id => s.delete(id));
            setzen.forEach(e => s.put(e));
            t.oncomplete = () => { anwenden(); ok2(); };
            t.onerror = t.onabort = () => fail2(t.error || new Error('Der Suchindex liess sich nicht speichern'));
        }
        catch (err) {
            fail2(err);
        }
    });
    const suchindexErsetzen = (eintraege) => new Promise((ok2, fail2) => {
        const neu = {};
        eintraege.forEach(e => { if (e && typeof e.id === 'string')
            neu[e.id] = e; });
        if (!db || !db.objectStoreNames.contains('suchindex')) {
            cache.suchindex = neu;
            ok2();
            return;
        }
        try {
            const t = tx(['suchindex'], 'readwrite');
            const s = t.objectStore('suchindex');
            s.clear();
            Object.values(neu).forEach(e => s.put(e));
            t.oncomplete = () => { cache.suchindex = neu; ok2(); };
            t.onerror = t.onabort = () => fail2(t.error || new Error('Der Suchindex liess sich nicht ersetzen'));
        }
        catch (err) {
            fail2(err);
        }
    });
    const suchindexLeeren = () => suchindexErsetzen([]);
    const stueckPut = (satz) => put('stuecke', satz);
    const stueckHolen = (id) => get('stuecke', id);
    const stueckWeg = (id) => del('stuecke', id);
    const chunkReadError = (dateiId, cause) => {
        const error = new Error('Die Dateistücke konnten nicht aus dem Speicher gelesen werden. ' +
            'Der Vorgang wurde abgebrochen.');
        error.code = 'DATEISTUECKE_NICHT_LESBAR';
        error.cause = cause;
        if (typeof Reporter !== 'undefined') {
            Reporter.error('ablage', 'Dateistücke konnten nicht gelesen werden', {
                fileId: String(dateiId ?? ''), cause
            });
        }
        return error;
    };
    const stueckeVon = (dateiId) => new Promise((ok2, fail2) => {
        if (!db || !db.objectStoreNames.contains('stuecke'))
            return ok2([]);
        try {
            const r = tx(['stuecke'], 'readonly').objectStore('stuecke')
                .index('datei').getAll(dateiId);
            r.onsuccess = () => ok2((r.result || []).sort((a, b) => a.nr - b.nr));
            r.onerror = () => fail2(chunkReadError(dateiId, r.error || new Error('Die IndexedDB-Anfrage ist fehlgeschlagen')));
        }
        catch (err) {
            fail2(chunkReadError(dateiId, err));
        }
    });
    const usage = async () => {
        if (!navigator.storage || !navigator.storage.estimate)
            return null;
        const e = await navigator.storage.estimate();
        return { benutzt: e.usage, verfuegbar: e.quota };
    };
    return {
        load, uid, now, cache, istDemo: () => DEMO,
        addBlock, getBlock, updateBlock, feldWeg, trashBlock, restoreBlock, purgeBlock, childrenOf,
        purgeAnhaenge, dateiAnspruch, papierkorbBloecke, papierkorbAufraeumen, papierkorbBaldWeg,
        addPage, rootPages, trashed, favorites, pathOf,
        addDatabase, getCollection, getView, updateCollection, updateView, addView, removeView,
        rohSetzen,
        addRow, rowsOf, setProp,
        setMeta, getMeta, metaListeAendern, metaListeAnhaengen, flush, settled,
        baum, baumEinfuegen, kinderLeeren, baumAbgleichen,
        versionSpeichern, versionen, versionLoeschen, fassungenAusduennen,
        search, durchsuchbar, pfadText, exportAll, exportVorbereiten, importAll, wipe, usage,
        faecherUnbekannt, satzZuUnbekannten,
        FAECHER_IMMER, FAECHER_MIT_ANHANG, FAECHER_NIE,
        dateiPut, dateiHolen, dateiWeg, dateiAlle,
        blockGrabsteine, blockGrabstein, blockGrabsteinWeg,
        dateiGrabstein, dateiGrabsteine, dateiGrabsteinWeg,
        basisPut, basisHolen, basisWeg, basisAlle, basisLeeren,
        vorratPut, vorratHolen, vorratWeg, vorratAlle,
        auftragPut, auftragHolen, auftragWeg, auftragAlle, auftragNehmen,
        suchindexAendern, suchindexErsetzen, suchindexLeeren,
        stueckPut, stueckHolen, stueckWeg, stueckeVon,
        speichertNicht: () => nurSpeicher,
        warnungText: () => warnung,
        beiWarnung: (fn) => { warner.add(fn); if (warnung)
            fn(warnung); },
        datenFassung: () => datenFassung,
        on: (fn) => listeners.add(fn)
    };
})();
