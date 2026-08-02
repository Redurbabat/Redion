/* ============================================================================
 * store.js — Die lokale Datenbank
 * ----------------------------------------------------------------------------
 * Alles liegt in IndexedDB im Browser. Kein Server, kein Konto, keine Cloud.
 * Wer die Seite offline öffnet, hat alle Daten.
 *
 * DATENMODELL
 * Bewusst nach Notions Vorbild aufgebaut — vier Speicher, mehr braucht es nicht:
 *
 *   blocks       jeder Inhalt: Absätze, Überschriften, Seiten, Datenbankzeilen
 *   collections  das Schema einer Datenbank (welche Spalten gibt es)
 *   views        eine Ansicht: Layout, Filter, Sortierung, sichtbare Spalten
 *   meta         Einstellungen, zuletzt geöffnete Seite, Theme
 *   versions     ältere Fassungen einer Seite (Versionsverlauf)
 *
 * Eine Seite ist ein Block vom Typ 'page'.
 * Eine Datenbank ist ein Block vom Typ 'database' + eine collection + n views.
 * Eine Datenbankzeile ist wieder ein Block vom Typ 'page' — nur mit
 * parentTable 'collection' statt 'block'. Genau wie bei Notion.
 * ==========================================================================*/

const Store = (() => {

  const NAME = 'notizen';
  const VERSION = 2;
  let db = null;

  /* Alle Änderungen laufen durch save(), das merkt sich Beobachter. */
  const listeners = new Set();
  const notify = (was) => listeners.forEach(fn => fn(was));

  /* --------------------------------------------------------------------------
   * NOTBETRIEB
   * --------------------------------------------------------------------------
   * IndexedDB ist nicht überall erlaubt: in einer abgeschotteten Vorschau,
   * im privaten Fenster mancher Browser oder bei gesperrten Websitedaten.
   * Dann läuft die App trotzdem — nur ohne zu speichern. Besser als eine
   * Seite, die auf nichts mehr reagiert.
   * ------------------------------------------------------------------------*/
  let nurSpeicher = false;
  let warnung = '';
  const warner = new Set();
  const warne = (text) => {
    warnung = text;
    warner.forEach(fn => { try { fn(text); } catch {} });
  };

  /* --- Öffnen ------------------------------------------------------------ */
  const open = () => new Promise((ok, fail) => {
    if (!self.indexedDB) { fail(new Error('Dieser Browser stellt keinen lokalen Speicher bereit.')); return; }

    let req;
    try { req = indexedDB.open(NAME, VERSION); }
    catch (err) { fail(err); return; }

    /* Ein anderes Fenster hält die alte Fassung offen und blockiert die
       Umstellung. Ohne diese Meldung würde die App einfach hängen. */
    req.onblocked = () => fail(new Error(
      'Eine ältere Fassung der App ist noch in einem anderen Tab offen. ' +
      'Bitte diesen Tab schliessen und neu laden.'));

    /* Falls der Browser gar nicht antwortet: nach sechs Sekunden aufgeben. */
    setTimeout(() => { if (!db) fail(new Error('Der lokale Speicher antwortet nicht.')); }, 6000);

    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('blocks')) {
        const s = d.createObjectStore('blocks', { keyPath: 'id' });
        s.createIndex('parent', 'parentId');
        s.createIndex('type', 'type');
      }
      if (!d.objectStoreNames.contains('collections')) d.createObjectStore('collections', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('views'))       d.createObjectStore('views',       { keyPath: 'id' });
      if (!d.objectStoreNames.contains('meta'))        d.createObjectStore('meta',        { keyPath: 'k' });
      /* Version 2: der Versionsverlauf. Liegt bewusst nicht im Cache —
         alte Fassungen holt sich der Verlauf erst, wenn er geöffnet wird. */
      if (!d.objectStoreNames.contains('versions')) {
        const v = d.createObjectStore('versions', { keyPath: 'id' });
        v.createIndex('page', 'pageId');
      }
    };

    req.onsuccess = () => { db = req.result; ok(db); };
    req.onerror   = () => fail(req.error);
  });

  /* --- Kleine Helfer ----------------------------------------------------- */
  /* Ohne Datenbank tun alle Schreib- und Lesewege so, als wäre nichts da.
     Der Cache im Arbeitsspeicher trägt die App dann allein. */
  const tx = (stores, mode) => db.transaction(stores, mode);

  const put = (store, val) => new Promise((ok, fail) => {
    if (!db) return ok(val);
    try {
      const r = tx([store], 'readwrite').objectStore(store).put(val);
      r.onsuccess = () => ok(val);
      r.onerror   = () => fail(r.error);
    } catch (err) { fail(err); }
  });

  const get = (store, key) => new Promise((ok, fail) => {
    if (!db) return ok(null);
    const r = tx([store], 'readonly').objectStore(store).get(key);
    r.onsuccess = () => ok(r.result || null);
    r.onerror   = () => fail(r.error);
  });

  const all = (store) => new Promise((ok) => {
    if (!db) return ok([]);
    try {
      const r = tx([store], 'readonly').objectStore(store).getAll();
      r.onsuccess = () => ok(r.result || []);
      r.onerror   = () => ok([]);
    } catch (err) { ok([]); }
  });

  const del = (store, key) => new Promise((ok) => {
    if (!db) return ok();
    try {
      const r = tx([store], 'readwrite').objectStore(store).delete(key);
      r.onsuccess = () => ok();
      r.onerror   = () => ok();
    } catch (err) { ok(); }
  });

  /* --------------------------------------------------------------------------
   * DER CACHE
   * --------------------------------------------------------------------------
   * IndexedDB ist asynchron, das Rendern soll aber sofort passieren. Deshalb
   * liegt alles zusätzlich im Speicher und wird im Hintergrund geschrieben.
   * ------------------------------------------------------------------------*/
  const cache = { blocks:{}, collections:{}, views:{}, meta:{} };

  const load = async () => {
    try {
      await open();
    } catch (err) {
      /* Kein Speicher — trotzdem weitermachen, nur eben ohne Sichern. */
      db = null;
      nurSpeicher = true;
      warne('Der lokale Speicher ist hier gesperrt: ' + (err.message || err) +
            ' — die App läuft, sichert aber nichts. Öffne die Datei direkt vom Desktop, ' +
            'dann bleibt alles erhalten.');
      return;
    }
    (await all('blocks')).forEach(b      => cache.blocks[b.id] = b);
    (await all('collections')).forEach(c => cache.collections[c.id] = c);
    (await all('views')).forEach(v       => cache.views[v.id] = v);
    (await all('meta')).forEach(m        => cache.meta[m.k] = m.v);
  };

  /* --- IDs --------------------------------------------------------------- */
  const uid = () => (crypto.randomUUID
    ? crypto.randomUUID()
    : 'x'.replace(/x/g, () => Math.random().toString(36).slice(2) + Date.now().toString(36)));

  const now = () => new Date().toISOString();

  /* ========================================================================
   * BLÖCKE
   * ======================================================================*/

  /**
   * Legt einen Block an und hängt ihn beim Elternteil ein.
   * Wie bei Notion sind das zwei Schritte: Block anlegen UND in die
   * content-Liste des Elternteils eintragen. Wer den zweiten vergisst,
   * erzeugt einen unsichtbaren Waisenblock.
   */
  const addBlock = (parentId, type = 'text', patch = {}, index = -1) => {
    const b = Object.assign({
      id: uid(),
      type,
      text: '',
      content: [],          // IDs der Kindblöcke
      parentId,
      parentTable: 'block',
      color: '',
      created: now(),
      edited: now(),
      alive: true
    }, patch);

    cache.blocks[b.id] = b;

    const p = cache.blocks[parentId];
    if (p) {
      if (index < 0 || index >= p.content.length) p.content.push(b.id);
      else p.content.splice(index, 0, b.id);
      save('blocks', p);
    }
    save('blocks', b);
    return b;
  };

  const getBlock = (id) => cache.blocks[id] || null;

  const updateBlock = (id, patch) => {
    const b = cache.blocks[id];
    if (!b) return null;
    Object.assign(b, patch, { edited: now() });
    save('blocks', b);
    return b;
  };

  /** Verschiebt einen Block in den Papierkorb — wie in Notion erst 'alive: false'. */
  const trashBlock = (id) => {
    const b = cache.blocks[id];
    if (!b) return;
    b.alive = false;
    b.trashedAt = now();
    const p = cache.blocks[b.parentId];
    if (p) {
      p.content = p.content.filter(x => x !== id);
      save('blocks', p);
    }
    save('blocks', b);
  };

  const restoreBlock = (id) => {
    const b = cache.blocks[id];
    if (!b) return;
    b.alive = true;
    delete b.trashedAt;
    const p = cache.blocks[b.parentId];
    if (p && !p.content.includes(id)) { p.content.push(id); save('blocks', p); }
    save('blocks', b);
  };

  /** Löscht endgültig — samt aller Kinder. Danach ist nichts mehr zu retten. */
  const purgeBlock = (id) => {
    const b = cache.blocks[id];
    if (!b) return;
    (b.content || []).forEach(purgeBlock);
    if (b.collectionId) {
      const c = cache.collections[b.collectionId];
      if (c) {
        rowsOf(b.collectionId).forEach(r => { delete cache.blocks[r.id]; del('blocks', r.id); });
        (c.viewIds || []).forEach(v => { delete cache.views[v]; del('views', v); });
        delete cache.collections[b.collectionId];
        del('collections', b.collectionId);
      }
    }
    const p = cache.blocks[b.parentId];
    if (p) { p.content = p.content.filter(x => x !== id); save('blocks', p); }
    delete cache.blocks[id];
    del('blocks', id);
    notify('purge');
  };

  /** Die lebenden Kindblöcke in der richtigen Reihenfolge. */
  const childrenOf = (id) => {
    const b = cache.blocks[id];
    if (!b) return [];
    return (b.content || []).map(x => cache.blocks[x]).filter(x => x && x.alive);
  };

  /* ========================================================================
   * SEITEN
   * ======================================================================*/
  const addPage = (parentId = null, patch = {}) => {
    const p = addBlock(parentId, 'page', Object.assign({
      text: '', icon: '📄', cover: '', wide: false, font: 'default', small: false
    }, patch));
    notify('pages');
    return p;
  };

  /** Alle Seiten auf oberster Ebene (ohne Elternteil). */
  const rootPages = () => Object.values(cache.blocks)
    .filter(b => b.type === 'page' && b.alive && !b.parentId && b.parentTable !== 'collection')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.created.localeCompare(b.created));

  const trashed = () => Object.values(cache.blocks)
    .filter(b => !b.alive && b.type === 'page')
    .sort((a, b) => (b.trashedAt || '').localeCompare(a.trashedAt || ''));

  const favorites = () => Object.values(cache.blocks)
    .filter(b => b.type === 'page' && b.alive && b.favorite);

  /** Der Pfad von der obersten Seite bis hierher — für die Breadcrumbs. */
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

  /* ========================================================================
   * DATENBANKEN
   * ------------------------------------------------------------------------
   * Aufbau exakt wie bei Notion:
   *   block (type 'database') --collectionId--> collection --viewIds--> views
   * ======================================================================*/

  const addDatabase = (parentId, name = 'Neue Datenbank', schema = null, layout = 'table') => {
    const colId  = uid();
    const viewId = uid();

    const s = schema || {
      title: { name: 'Name',   type: 'title'  },
      [uid().slice(0,4)]: { name: 'Status', type: 'select', options: [
        { name: 'Offen',    color: 'gray'   },
        { name: 'In Arbeit',color: 'blue'   },
        { name: 'Erledigt', color: 'green'  }
      ]},
      [uid().slice(0,4)]: { name: 'Datum',  type: 'date' }
    };

    cache.collections[colId] = {
      id: colId, name, icon: '🗂️', schema: s, viewIds: [viewId], created: now()
    };

    cache.views[viewId] = {
      id: viewId, collectionId: colId, name: 'Tabelle', layout,
      filters: { operator: 'and', rules: [] },
      sorts: [], groupBy: '', hidden: [], calc: {}, created: now()
    };

    const blk = addBlock(parentId, 'database', { collectionId: colId, text: name });

    save('collections', cache.collections[colId]);
    save('views', cache.views[viewId]);
    notify('db');
    return { block: blk, collectionId: colId, viewId };
  };

  const getCollection = (id) => cache.collections[id] || null;
  const getView       = (id) => cache.views[id] || null;

  const updateCollection = (id, patch) => {
    const c = cache.collections[id];
    if (!c) return null;
    Object.assign(c, patch);
    save('collections', c);
    return c;
  };

  const updateView = (id, patch) => {
    const v = cache.views[id];
    if (!v) return null;
    Object.assign(v, patch);
    save('views', v);
    return v;
  };

  const addView = (collectionId, layout = 'table', name = '') => {
    const c = cache.collections[collectionId];
    if (!c) return null;
    const namen = { table:'Tabelle', board:'Board', list:'Liste', gallery:'Galerie',
                    calendar:'Kalender', timeline:'Zeitstrahl', chart:'Diagramm', form:'Formular' };
    const v = {
      id: uid(), collectionId, layout,
      name: name || namen[layout] || 'Ansicht',
      filters: { operator: 'and', rules: [] },
      sorts: [], groupBy: '', hidden: [], calc: {}, created: now()
    };
    cache.views[v.id] = v;
    c.viewIds.push(v.id);
    save('views', v);
    save('collections', c);
    return v;
  };

  const removeView = (viewId) => {
    const v = cache.views[viewId];
    if (!v) return;
    const c = cache.collections[v.collectionId];
    if (c && c.viewIds.length > 1) {
      c.viewIds = c.viewIds.filter(x => x !== viewId);
      save('collections', c);
      delete cache.views[viewId];
      del('views', viewId);
    }
  };

  /** Eine Zeile ist ein Block vom Typ 'page' mit parentTable 'collection'. */
  const addRow = (collectionId, props = {}) => {
    const r = {
      id: uid(), type: 'page', text: props.title || '', icon: '',
      props, content: [], parentId: collectionId, parentTable: 'collection',
      created: now(), edited: now(), alive: true
    };
    cache.blocks[r.id] = r;
    save('blocks', r);
    notify('rows');
    return r;
  };

  const rowsOf = (collectionId) => Object.values(cache.blocks)
    .filter(b => b.parentTable === 'collection' && b.parentId === collectionId && b.alive)
    .sort((a, b) => a.created.localeCompare(b.created));

  const setProp = (rowId, key, value) => {
    const r = cache.blocks[rowId];
    if (!r) return;
    r.props = r.props || {};
    r.props[key] = value;
    r.edited = now();
    save('blocks', r);
  };

  /* ========================================================================
   * EINSTELLUNGEN
   * ======================================================================*/
  const setMeta = (k, v) => { cache.meta[k] = v; put('meta', { k, v }).catch(() => {}); };
  const getMeta = (k, fallback = null) => (k in cache.meta ? cache.meta[k] : fallback);

  /* --- Schreiben mit Verzögerung ----------------------------------------- */
  /* Beim Tippen soll nicht jeder Tastendruck eine Transaktion auslösen.     */
  const pending = new Map();
  let timer = null;

  const save = (store, val) => {
    pending.set(store + ':' + val.id, { store, val });
    clearTimeout(timer);
    timer = setTimeout(flush, 400);
  };

  const flush = () => {
    if (!db) { pending.clear(); return; }
    pending.forEach(({ store, val }) => put(store, val).catch(() => {}));
    pending.clear();
  };

  /* Vor dem Schließen des Tabs alles rausschreiben. */
  window.addEventListener('beforeunload', flush);
  window.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

  /* ========================================================================
   * SUCHE
   * ------------------------------------------------------------------------
   * Durchsucht Seitentitel UND Inhalt — wie Notions Quick Find.
   * ======================================================================*/
  /**
   * Durchsucht Titel und Inhalt. Mit filter lässt sich einschränken:
   *   { wo: 'titel' | 'inhalt' | 'alles', typ: 'seite' | 'datenbank' | 'alles',
   *     seit: 'tag' | 'woche' | 'monat' | 'alles', ort: <seitenId> }
   */
  const search = (q, filter = {}) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out = [];
    const wo = filter.wo || 'alles';
    const grenze = { tag: 1, woche: 7, monat: 30 }[filter.seit];
    const seitDatum = grenze ? Date.now() - grenze * 86400000 : 0;

    Object.values(cache.blocks).forEach(b => {
      if (!b.alive) return;
      if (b.type !== 'page' || b.parentTable === 'collection') return;

      if (seitDatum && new Date(b.edited || b.created).getTime() < seitDatum) return;
      if (filter.ort && !pathOf(b.id).some(x => x.id === filter.ort)) return;

      const hatDb = (b.content || []).some(id => cache.blocks[id]?.type === 'database');
      if (filter.typ === 'datenbank' && !hatDb) return;
      if (filter.typ === 'seite' && hatDb) return;

      const t = (b.text || '').toLowerCase();
      if (wo !== 'inhalt' && t.includes(needle)) {
        out.push({ page: b, treffer: 'Titel', snippet: b.text, pfad: pfadText(b.id) });
        return;
      }
      if (wo !== 'titel') {
        const hit = findInside(b.id, needle, 0);
        if (hit) out.push({ page: b, treffer: 'Inhalt', snippet: hit, pfad: pfadText(b.id) });
      }
    });

    return out.slice(0, 60);
  };

  /** Der Pfad als Text, ohne die Seite selbst — für die Trefferliste. */
  const pfadText = (id) => pathOf(id).slice(0, -1)
    .map(p => p.text || 'Ohne Titel').join(' / ');

  const findInside = (pageId, needle, tiefe) => {
    if (tiefe > 4) return null;
    for (const kid of childrenOf(pageId)) {
      /* Unterseiten haben ihren eigenen Treffer — sonst würde die Elternseite
         mit fremdem Inhalt in der Liste stehen. */
      if (kid.type === 'page') continue;
      const t = (kid.text || '').toLowerCase();
      if (t.includes(needle)) {
        const i = t.indexOf(needle);
        return '…' + kid.text.slice(Math.max(0, i - 30), i + 60) + '…';
      }
      const tiefer = findInside(kid.id, needle, tiefe + 1);
      if (tiefer) return tiefer;
    }
    return null;
  };

  /* ========================================================================
   * SICHERN UND ZURÜCKHOLEN
   * ------------------------------------------------------------------------
   * Weil alles lokal liegt, gehört ein Export dazu. Sonst hängen die Daten
   * an genau einem Browserprofil.
   * ======================================================================*/
  const exportAll = () => JSON.stringify({
    version: VERSION,
    exportiert: now(),
    blocks: cache.blocks,
    collections: cache.collections,
    views: cache.views,
    meta: cache.meta
  }, null, 2);

  const importAll = async (json) => {
    const d = JSON.parse(json);
    if (!d.blocks) throw new Error('Das sieht nicht nach einer Sicherung dieser App aus.');
    cache.blocks      = d.blocks      || {};
    cache.collections = d.collections || {};
    cache.views       = d.views       || {};
    cache.meta        = d.meta        || {};
    /* Alles neu schreiben */
    await Promise.all([
      ...Object.values(cache.blocks).map(b      => put('blocks', b)),
      ...Object.values(cache.collections).map(c => put('collections', c)),
      ...Object.values(cache.views).map(v       => put('views', v)),
      ...Object.entries(cache.meta).map(([k,v]) => put('meta', { k, v }))
    ]);
    notify('import');
  };

  /* ========================================================================
   * SEITENBAUM ALS DATENPAKET
   * ------------------------------------------------------------------------
   * Eine Seite mit allem, was daran hängt — Kindblöcke, Datenbanken,
   * Ansichten und Zeilen. Grundlage für Vorlagen, Versionen, das Sperren
   * und jeden Export.
   * ======================================================================*/
  const baum = (id) => {
    const raus = (bid, tiefe) => {
      const x = cache.blocks[bid];
      if (!x || tiefe > 40) return null;
      const k = JSON.parse(JSON.stringify(x));
      delete k.content;
      k.kinder = (x.content || []).map(c => raus(c, tiefe + 1)).filter(Boolean);
      if (x.collectionId && cache.collections[x.collectionId]) {
        const c = cache.collections[x.collectionId];
        k.collection = JSON.parse(JSON.stringify(c));
        k.views = (c.viewIds || []).map(v => cache.views[v]).filter(Boolean)
          .map(v => JSON.parse(JSON.stringify(v)));
        k.rows = rowsOf(c.id).map(r => JSON.parse(JSON.stringify(r)));
      }
      return k;
    };
    return raus(id, 0);
  };

  /** Setzt so ein Datenpaket wieder ein — immer mit frischen IDs. */
  const baumEinfuegen = (knoten, parentId, index = -1) => {
    if (!knoten) return null;

    const rein = (k, eltern, idx) => {
      const patch = Object.assign({}, k);
      delete patch.id; delete patch.kinder; delete patch.collection;
      delete patch.views; delete patch.rows; delete patch.content;
      patch.content = [];

      /* Datenbank: Sammlung, Ansichten und Zeilen mitkopieren */
      if (k.collection) {
        const neueColl = uid();
        const idKarte = {};
        const views = (k.views || []).map(v => {
          const nv = JSON.parse(JSON.stringify(v));
          idKarte[v.id] = nv.id = uid();
          nv.collectionId = neueColl;
          cache.views[nv.id] = nv;
          save('views', nv);
          return nv;
        });
        const nc = JSON.parse(JSON.stringify(k.collection));
        nc.id = neueColl;
        nc.viewIds = views.map(v => v.id);
        cache.collections[neueColl] = nc;
        save('collections', nc);
        patch.collectionId = neueColl;

        (k.rows || []).forEach(r => {
          const nr = JSON.parse(JSON.stringify(r));
          nr.id = uid();
          nr.parentId = neueColl;
          nr.parentTable = 'collection';
          cache.blocks[nr.id] = nr;
          save('blocks', nr);
        });
      }

      const neu = addBlock(eltern, k.type || 'text', patch, idx);
      (k.kinder || []).forEach(kind => rein(kind, neu.id, -1));
      return neu;
    };

    const wurzel = rein(knoten, parentId, index);
    notify('pages');
    return wurzel;
  };

  /** Entfernt alle Kindblöcke einer Seite (für Wiederherstellen und Sperren). */
  const kinderLeeren = (pageId) => {
    const p = cache.blocks[pageId];
    if (!p) return;
    [...(p.content || [])].forEach(id => purgeBlock(id));
    p.content = [];
    save('blocks', p);
  };

  /* ========================================================================
   * VERSIONSVERLAUF
   * ------------------------------------------------------------------------
   * Liegt bewusst nicht im Cache: alte Fassungen holt sich der Verlauf
   * erst, wenn ihn jemand öffnet.
   * ======================================================================*/
  const versionSpeichern = async (pageId, anlass = 'automatisch') => {
    const p = cache.blocks[pageId];
    if (!p) return null;
    const v = {
      id: uid(), pageId, zeit: now(), anlass,
      titel: p.text || 'Ohne Titel',
      icon: p.icon || '📄',
      daten: baum(pageId)
    };
    await put('versions', v);
    /* Nur die letzten 30 Fassungen je Seite behalten */
    const alle = await versionen(pageId);
    for (const alt of alle.slice(30)) await del('versions', alt.id);
    return v;
  };

  const versionen = (pageId) => new Promise((ok) => {
    if (!db || !db.objectStoreNames.contains('versions')) return ok([]);
    const r = tx(['versions'], 'readonly').objectStore('versions').index('page').getAll(pageId);
    r.onsuccess = () => ok((r.result || []).sort((a, b) => b.zeit.localeCompare(a.zeit)));
    r.onerror = () => ok([]);
  });

  const versionLoeschen = (id) => del('versions', id);

  /** Nur für den Notfall: alles weg. */
  const wipe = async () => {
    if (db) await Promise.all(['blocks','collections','views','meta','versions'].map(s => new Promise(ok => {
      try {
        const r = tx([s], 'readwrite').objectStore(s).clear();
        r.onsuccess = ok; r.onerror = ok;
      } catch (err) { ok(); }
    })));
    cache.blocks = {}; cache.collections = {}; cache.views = {}; cache.meta = {};
  };

  /* Wie viel Platz belegt die App? */
  const usage = async () => {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    const e = await navigator.storage.estimate();
    return { benutzt: e.usage, verfuegbar: e.quota };
  };

  return {
    load, uid, now, cache,
    addBlock, getBlock, updateBlock, trashBlock, restoreBlock, purgeBlock, childrenOf,
    addPage, rootPages, trashed, favorites, pathOf,
    addDatabase, getCollection, getView, updateCollection, updateView, addView, removeView,
    addRow, rowsOf, setProp,
    setMeta, getMeta, flush,
    baum, baumEinfuegen, kinderLeeren,
    versionSpeichern, versionen, versionLoeschen,
    search, pfadText, exportAll, importAll, wipe, usage,
    speichertNicht: () => nurSpeicher,
    warnungText: () => warnung,
    beiWarnung: (fn) => { warner.add(fn); if (warnung) fn(warnung); },
    on: (fn) => listeners.add(fn)
  };
})();
