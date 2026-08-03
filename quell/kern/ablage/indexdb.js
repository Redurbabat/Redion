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

  /* Name und Fassung stehen in kern/einstellung/konstanten.js beziehungsweise
     kern/ablage/umzuege.js — dort steht auch, warum es jedes Fach gibt.
     Hier nur der Rückfall, falls diese Datei einmal allein geladen wird. */
  const NAME = (typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.ABLAGE_NAME : 'notizen';
  const VERSION = (typeof Umzuege !== 'undefined') ? Umzuege.JETZIGE : 5;
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
      /* Version 3: Dateien in Stücken.
         Eine Data-URL liegt vollständig im Arbeitsspeicher und wird beim
         Base64-Kodieren um ein Drittel größer. Ein Video von 300 MB ist so
         nicht zu machen. Blobs in Stücken schon: jedes Stück liegt einzeln
         in der Ablage, geladen wird nur, was gerade gebraucht wird. */
      if (!d.objectStoreNames.contains('dateien')) {
        const f = d.createObjectStore('dateien', { keyPath: 'id' });
        f.createIndex('block', 'blockId');
      }
      if (!d.objectStoreNames.contains('stuecke')) {
        const st = d.createObjectStore('stuecke', { keyPath: 'id' });
        st.createIndex('datei', 'dateiId');
      }
      /* Version 4: der letzte gemeinsame Stand je Satz.
         Ohne ihn kann ein Abgleich nur vergleichen „meins oder deins" und
         muss eine Seite wegwerfen. Mit ihm weiss er, WER WAS geändert hat:
         was nur einer angefasst hat, kommt durch; erst wenn beide dasselbe
         Feld verschieden gesetzt haben, ist es wirklich ein Konflikt.
         Liegt bewusst neben dem Cache und nicht darin — es wird nur beim
         Abgleich gebraucht und soll den Arbeitsspeicher nicht belasten. */
      if (!d.objectStoreNames.contains('basis')) d.createObjectStore('basis', { keyPath: 'id' });
      /* Version 5: vorberechnete Werte je Datenbank.
         Liegt bewusst nicht im Cache und wird nicht beim Start geladen — es
         ist ein Beschleuniger, kein Inhalt. Wer ihn wegwirft, verliert
         nichts ausser Zeit. */
      if (!d.objectStoreNames.contains('vorrat')) d.createObjectStore('vorrat', { keyPath: 'id' });
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

    /* --- Selbstheilung ---------------------------------------------------
       Ein Satz, dem ein Feld fehlt, bringt die Oberfläche zu Fall — und zwar
       an einer Stelle, die mit der Ursache nichts zu tun hat. Ein Import,
       eine alte Sicherung oder ein abgebrochener Abgleich reichen dafür.
       Deshalb wird hier einmal durchgesehen und ergänzt, was fehlt. Nichts
       wird ersetzt und nichts weggeworfen. */
    if (typeof Formen !== 'undefined') {
      try {
        const b = Formen.zustand(true);
        if (b && b.geheilt && typeof Melder !== 'undefined')
          Melder.info('Ablage', b.geheilt + ' von ' + b.geprueft +
                      ' Sätzen ergänzt', b.stellen);
      } catch (e) {
        if (typeof Melder !== 'undefined') Melder.fehler('Ablage', 'Selbstheilung: ' + e.message, e);
      }
    }

    /* --- Umzüge im Inhalt ------------------------------------------------
       Neue Fächer legt der Browser an. Ein Feld, das früher fehlte, muss
       jemand nachtragen — einmal, hier, und nie wieder. */
    if (typeof Umzuege !== 'undefined') {
      try { Umzuege.laufen(); }
      catch (e) { if (typeof Melder !== 'undefined') Melder.fehler('Ablage', 'Umzug: ' + e.message, e); }
    }

    if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined')
      Ereignisse.melde(ARTEN.ablageGeladen, { blocks: Object.keys(cache.blocks).length });
  };

  /* --- IDs --------------------------------------------------------------- */
  /* Kennungen kommen aus kern/helfer/kennungen.js — dieselbe Form an jeder
     Stelle. Der Rückfall greift nur, wenn diese Datei allein geladen wird. */
  const uid = () => (typeof Kennungen !== 'undefined')
    ? Kennungen.lang()
    : (crypto.randomUUID ? crypto.randomUUID()
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
      erstelltVon: getMeta('nutzer', '') || 'Ich',
      alive: true
    }, patch);

    cache.blocks[b.id] = b;

    const p = cache.blocks[parentId];
    if (p) {
      if (index < 0 || index >= p.content.length) p.content.push(b.id);
      else p.content.splice(index, 0, b.id);
      elternGeaendert(p);
    }
    save('blocks', b);
    return b;
  };

  /**
   * Ein Block hat ein Kind bekommen, verloren oder umsortiert — dann hat sich
   * der Block selbst geändert, auch wenn sein Text gleich blieb.
   *
   * Ohne diese Zeile stand die neue Reihenfolge zwar auf der Platte, galt dem
   * Abgleich aber als unverändert. Das andere Gerät bekam den neuen Block
   * einzeln, aber nie die Seite, auf der er stehen sollte: der Block lag
   * dann im Speicher und war nirgends zu sehen.
   */
  const elternGeaendert = (p) => {
    if (!p) return;
    p.edited = now();
    save('blocks', p);
  };

  const getBlock = (id) => cache.blocks[id] || null;

  const updateBlock = (id, patch) => {
    const b = cache.blocks[id];
    if (!b) return null;
    Object.assign(b, patch, { edited: now(), geaendertVon: getMeta('nutzer', '') || 'Ich' });
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
      elternGeaendert(p);
    }
    save('blocks', b);
  };

  const restoreBlock = (id) => {
    const b = cache.blocks[id];
    if (!b) return;
    b.alive = true;
    delete b.trashedAt;
    const p = cache.blocks[b.parentId];
    if (p && !p.content.includes(id)) { p.content.push(id); elternGeaendert(p); }
    save('blocks', b);
  };

  /**
   * Löscht endgültig — samt aller Kinder. Danach ist nichts mehr zu retten.
   *
   * DAS WAR LANGE NICHT WAHR. Der Block ging, die Zeilen gingen, die
   * Ansichten gingen — der **Versionsverlauf** und die **Anhänge** blieben
   * liegen. Wer eine Seite endgültig löschte, weil niemand sie mehr sehen
   * sollte, liess bis zu dreissig Fassungen davon auf der Platte zurück, mit
   * vollem Text; ein angehängtes Video blieb vollständig da, ohne einen Weg,
   * es je wieder zu sehen oder loszuwerden.
   *
   * Beides hängt nicht am Cache, sondern in eigenen Fächern der Ablage, und
   * beides wird nur über einen Index gefunden. Deshalb ist das Aufräumen
   * unvermeidlich asynchron — `purgeBlock` selbst muss synchron bleiben, es
   * hat über hundert Aufrufstellen und wird mitten im Zeichnen gerufen.
   * Der Weg dazwischen: der Aufruf sammelt beim Absteigen alle Kennungen ein
   * und stösst danach `purgeAnhaenge` an. Geht dabei etwas schief, sagt es
   * das über den Melder — still schlucken wäre das, was den Fehler überhaupt
   * erst so lange verborgen hat.
   */
  const purgeBlock = (id) => {
    const gesammelt = [];
    purgeTief(id, gesammelt);
    if (!gesammelt.length) return;
    notify('purge');
    Promise.all(gesammelt.map(x => purgeAnhaenge(x)))
      .catch(err => { if (typeof Melder !== 'undefined')
        Melder.fehler('ablage', 'Beim endgültigen Löschen blieben Fassungen oder Anhänge liegen', err); });
  };

  /** Der eigentliche Abstieg. Sammelt, was danach noch aufzuräumen ist. */
  const purgeTief = (id, gesammelt) => {
    const b = cache.blocks[id];
    if (!b) return;
    gesammelt.push(id);
    [...(b.content || [])].forEach(k => purgeTief(k, gesammelt));
    /* Eine verknüpfte Ansicht zeigt fremde Daten — die bleiben bestehen. */
    if (b.collectionId && !b.verknuepft) {
      const c = cache.collections[b.collectionId];
      if (c) {
        /* Auch eine Zeile kann Fassungen und Anhänge haben — sie ist eine
           Seite. Sie hier zu vergessen wäre derselbe Fehler eine Ebene
           tiefer, und die Ebene sieht niemand. */
        rowsOf(b.collectionId).forEach(r => {
          gesammelt.push(r.id); delete cache.blocks[r.id]; del('blocks', r.id);
        });
        (c.viewIds || []).forEach(v => { delete cache.views[v]; del('views', v); });
        delete cache.collections[b.collectionId];
        del('collections', b.collectionId);
        /* Die vorberechneten Werte dieser Datenbank sind ohne sie sinnlos. */
        vorratWeg(b.collectionId).catch(() => {});
      }
    }
    const p = cache.blocks[b.parentId];
    if (p) { p.content = p.content.filter(x => x !== id); elternGeaendert(p); }
    delete cache.blocks[id];
    del('blocks', id);
  };

  /**
   * Was ausser dem Block selbst zu ihm gehört: seine Fassungen, seine
   * Dateien und deren Stücke.
   *
   * Zweimal gerufen tut es beim zweiten Mal nichts — das ist Absicht. Der
   * Papierkorb ruft es nach dem Löschen noch einmal nach, und ein Aufräumen,
   * das beim zweiten Anlauf etwas kaputtmacht, wäre schlimmer als eines, das
   * einmal zu wenig läuft.
   *
   * Der Abgleichsstand (`basis`) bleibt bewusst stehen. Er ist kein Inhalt,
   * sondern das Gedächtnis darüber, dass beide Geräte diesen Satz einmal
   * gleich sahen — erst dadurch kann ein Abgleich „hier gelöscht" von „hier
   * nie gehabt" unterscheiden. Wer ihn mitnimmt, holt sich die Seite beim
   * nächsten Abgleich vom anderen Gerät zurück.
   */
  const purgeAnhaenge = async (id, hinweis = {}) => {
    for (const v of await versionen(id)) await del('versions', v.id);

    const dateien = await new Promise((ok2) => {
      if (!db || !db.objectStoreNames.contains('dateien')) return ok2([]);
      try {
        const r = tx(['dateien'], 'readonly').objectStore('dateien').index('block').getAll(id);
        r.onsuccess = () => ok2(r.result || []);
        r.onerror   = () => ok2([]);
      } catch { ok2([]); }
    });
    /* Manche Blockarten merken sich die Datei am Block statt umgekehrt.
       Beide Wege werden gegangen, doppelt gelöscht wird nichts. */
    const kennungen = new Set(dateien.map(d => d.id));
    const b = cache.blocks[id];
    [hinweis.datei, b && b.dateiId, b && b.datei].forEach(x => { if (x) kennungen.add(x); });

    for (const dateiId of kennungen) {
      for (const st of await stueckeVon(dateiId)) await del('stuecke', st.id);
      await del('dateien', dateiId);
    }
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

  /**
   * Was ausser Seiten noch im Papierkorb liegt — Absätze, Bilder, Aufgaben.
   *
   * WARUM ES DAS BRAUCHT. `Strg`+`Umschalt`+`Rücktaste` legt einen Block weg
   * und meldet „Block in den Papierkorb". Der Papierkorb zeigte nur Seiten;
   * der Block stand auf `alive: false`, war aus der Elternliste heraus und
   * damit an keiner Oberfläche mehr erreichbar. Rückgängig holte ihn zurück,
   * solange das Fenster offen blieb — nach einem Neuladen nicht mehr.
   *
   * Verloren war er nie: er lag die ganze Zeit auf der Platte. Das ist
   * schlimmer als weg, nicht besser — es sah aus wie Absicht.
   *
   * Eine Datenbankzeile ist eine Seite (`addRow` setzt `type: 'page'`) und
   * steht deshalb schon bei `trashed()`. Hier darf sie nicht noch einmal
   * auftauchen, sonst stünde sie zweimal im Papierkorb.
   */
  const papierkorbBloecke = () => Object.values(cache.blocks)
    .filter(b => !b.alive && b.type !== 'page')
    .sort((a, b) => (b.trashedAt || '').localeCompare(a.trashedAt || ''));

  /**
   * Räumt den Papierkorb nach der eingestellten Frist auf — wie Notions
   * dreissig Tage.
   *
   * ES GAB DAS ZWEIMAL. Einmal in `bereiche/wissen/werkzeuge.js`, einmal in
   * `bereiche/einstellungen/pflege.js`. Die zweite las `geloeschtAm` und
   * `papierkorbFrist` — **zwei Namen, die im ganzen Quelltext niemand
   * schreibt**. Sie lief beim Start und danach täglich und fand jedes Mal
   * nichts; ihr Knopf „Papierkorb jetzt leeren" antwortete seit jeher
   * „Nichts ist alt genug". Zwei Fassungen derselben Sache sind nicht
   * doppelt sicher, sondern eine richtige und eine, die niemand prüft.
   *
   * Jetzt steht sie im Kern, weil sie in den Kern gehört: sie handelt von
   * der Ablage, nicht von einem Bereich. Beide Bereiche reichen nur durch —
   * und keiner ruft mehr in den anderen hinein.
   *
   * ─── DIE SCHONFRIST ───────────────────────────────────────────────────────
   *
   * Weggelegte Blöcke waren bis heute unsichtbar. Sie jetzt sichtbar zu
   * machen heisst auch: ihnen laufen jetzt Fristen ab. Ein Bestand, in dem
   * seit zwei Jahren still Blöcke liegen, wäre beim ersten Start nach dieser
   * Änderung um sie ärmer — gelöscht, bevor irgendjemand sie je zu sehen
   * bekam. Genau das darf nicht passieren.
   *
   * Deshalb merkt sich die App den Tag, an dem der Papierkorb anfing, alles
   * zu zeigen. Für Blöcke zählt die Frist ab diesem Tag, nicht ab dem Tag
   * des Weglegens. Für Seiten bleibt es beim Weglegen — die waren immer
   * sichtbar, und ihre Frist jetzt zu verlängern wäre eine zweite Änderung.
   */
  const papierkorbAufraeumen = async () => {
    const tage = Number(getMeta('papierkorbTage', 30));
    if (!tage) return 0;                       /* 0 heisst: nie automatisch */
    const grenze = Date.now() - tage * 86400000;

    let sichtbarSeit = getMeta('papierkorbSichtbarSeit', '');
    if (!sichtbarSeit) { sichtbarSeit = now(); setMeta('papierkorbSichtbarSeit', sichtbarSeit); }
    const abDann = new Date(sichtbarSeit).getTime() || 0;

    const wann = (b) => new Date(b.trashedAt).getTime();
    const faellig = [
      ...trashed().filter(s => s.trashedAt && wann(s) < grenze),
      ...papierkorbBloecke().filter(b => b.trashedAt && Math.max(wann(b), abDann) < grenze)
    ];
    faellig.forEach(x => purgeBlock(x.id));
    return faellig.length;
  };

  /** Was in den nächsten drei Tagen verschwindet — für den Hinweis im Papierkorb. */
  const papierkorbBaldWeg = () => {
    const tage = Number(getMeta('papierkorbTage', 30));
    if (!tage) return [];
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

  /**
   * Einen vollständigen Satz übernehmen, so wie er ist.
   *
   * Für den Abgleich gedacht. `updateBlock` geht dort nicht: es setzt
   * `edited` auf jetzt, und damit wäre der eben geholte Satz sofort wieder
   * „hier geändert" und würde beim nächsten Durchgang zurückgeschickt — ein
   * Abgleich, der sich selbst füttert.
   *
   * Und es muss wirklich geschrieben werden, nicht nur in den Cache gelegt:
   * ein Satz, der nur im Arbeitsspeicher liegt, ist beim nächsten Laden weg,
   * während die Abgleichsmarke schon weitergerückt ist — dann kommt er nie
   * wieder. Das ist Datenverlust, den niemand bemerkt.
   */
  const rohSetzen = (tabelle, satz) => {
    if (!satz || !satz.id) return null;
    const wo = tabelle === 'collections' ? 'collections'
             : tabelle === 'views' ? 'views' : 'blocks';
    cache[wo][satz.id] = satz;
    save(wo, satz);
    return satz;
  };

  /* Auch eine Sammlung und eine Ansicht bekommen einen Zeitstempel.
     Ohne ihn galten Schema- und Ansichtsänderungen dem Abgleich als „nie
     geschehen": eine neue Spalte, ein umbenanntes Feld, ein anderer Filter
     kamen auf dem zweiten Gerät nie an, weil zuSchicken() nach `edited`
     fragt. Zeilen wanderten, ihre Spalten nicht — das sieht aus wie
     verlorene Daten und ist nur ein fehlender Zeitstempel. */
  const updateCollection = (id, patch) => {
    const c = cache.collections[id];
    if (!c) return null;
    Object.assign(c, patch);
    if (!('edited' in patch)) c.edited = now();
    save('collections', c);
    return c;
  };

  const updateView = (id, patch) => {
    const v = cache.views[id];
    if (!v) return null;
    Object.assign(v, patch);
    if (!('edited' in patch)) v.edited = now();
    save('views', v);
    return v;
  };

  const addView = (collectionId, layout = 'table', name = '') => {
    const c = cache.collections[collectionId];
    if (!c) return null;
    const namen = { table:'Tabelle', board:'Board', list:'Liste', gallery:'Galerie',
                    calendar:'Kalender', timeline:'Zeitstrahl', chart:'Diagramm', form:'Formular',
                    feed:'Feed', map:'Karte', dashboard:'Dashboard' };
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

    /* Spaltenrechte. Die eigentliche Sperre sitzt auf dem Server — aber hier
       schreiben zu lassen und es beim nächsten Abgleich stillschweigend
       zurückzudrehen wäre unehrlich: der Wert stünde eine Weile da, und
       niemand wüsste, warum er später wieder weg ist. */
    if (typeof Feldrechte !== 'undefined' && r.parentTable === 'collection' &&
        Feldrechte.inKraft() && !Feldrechte.darfSchreiben(r.parentId, key)) {
      if (typeof UI !== 'undefined' && UI.toast) UI.toast('Diese Spalte darfst du nicht ändern.');
      return;
    }

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
    timer = setTimeout(flush,
      (typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.SCHREIB_PAUSE_MS : 400);
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

    /* Suche nach Seiten-ID — Notions Verwaltungssuche. Es zählt sowohl die
       lange Form 8-4-4-4-12 als auch die Kurzform ohne Bindestriche, und
       auch eine ganze Seitenadresse, aus der die ID herausgeschnitten wird. */
    const stueck = needle.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{6,12}/) ||
                   (/^[0-9a-f-]+$/.test(needle) ? [needle] : null);
    const ohne = stueck ? stueck[0].replace(/-/g, '') : '';
    if (ohne.length >= 12) {
      const treffer = Object.values(cache.blocks).filter(b =>
        b.id && b.id.replace(/-/g, '').startsWith(ohne));
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

  /** Zu welcher Seite gehört ein Block? Klettert nach oben, bis eine da ist. */
  const seiteVon = (b) => {
    let cur = b, n = 0;
    while (cur && n++ < 40) {
      if (cur.type === 'page') return cur;
      cur = cur.parentId ? cache.blocks[cur.parentId] : null;
    }
    return b;
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
  /**
   * Der ganze Bestand als eine Datei.
   *
   * WAS HIER FEHLTE, und was es kostete: die Sicherung nahm vier der neun
   * Fächer mit — `blocks`, `collections`, `views`, `meta`. Nicht dabei waren
   * `versions`, `dateien` und `stuecke`. Wer seine Sicherung auf einem neuen
   * Rechner einspielte, bekam seine Seiten zurück **und keinen einzigen
   * Versionsverlauf**. Nachgestellt und bestätigt: eine Fassung vor dem
   * Export, null danach.
   *
   * Dass es niemandem auffiel, liegt in der Natur der Sache — man merkt das
   * Fehlen eines Verlaufs erst, wenn man ihn braucht, und dann ist die alte
   * Ablage längst weg.
   *
   * `versions` ist jetzt dabei. Es ist reines JSON und kostet nichts.
   *
   * `dateien` und `stuecke` sind es NICHT, und das ist eine Entscheidung
   * statt eines Versehens: dort liegen Blobs. `JSON.stringify` macht aus
   * einem Blob `{}` — sie wären also scheinbar dabei und in Wahrheit leer,
   * und das ist schlimmer als zu fehlen. Sie brauchen einen eigenen Weg
   * (Base64 oder ein ZIP), und der braucht eine Antwort auf die Frage, was
   * bei einem 500-MB-Video geschieht. Bis dahin **sagt die Sicherung, was
   * sie nicht enthält** — im Feld `fehlt`, und die Oberfläche zeigt es an.
   * Ein bekannter Mangel, der benannt ist, ist kein stiller Verlust.
   */
  const exportAll = () => {
    const dateienDa = zaehlerDateien();
    return JSON.stringify({
      version: VERSION,
      exportiert: now(),
      /* Was drin ist — damit ein Einleser es nachsehen kann, statt zu raten. */
      enthaelt: ['blocks', 'collections', 'views', 'meta', 'versions'],
      fehlt: dateienDa
        ? ['dateien', 'stuecke']
        : [],
      hinweis: dateienDa
        ? 'Diese Sicherung enthält ' + dateienDa + ' Datei(en) NICHT — nur ihre ' +
          'Blöcke. Anhänge liegen als Blob in der Ablage und passen nicht in ' +
          'eine JSON-Datei. Sie bleiben auf diesem Gerät.'
        : 'Vollständig: dieser Bestand hat keine Dateianhänge.',
      blocks: cache.blocks,
      collections: cache.collections,
      views: cache.views,
      meta: cache.meta,
      versions: exportVersionen
    }, null, 2);
  };

  /* Der Verlauf wird beim Sichern eingelesen — er liegt bewusst nicht im
     Zwischenspeicher, damit er den Arbeitsspeicher nicht belastet. */
  let exportVersionen = [];
  let exportDateien = 0;
  const zaehlerDateien = () => exportDateien;

  /** Vor dem Sichern aufrufen: holt, was nicht im Zwischenspeicher liegt. */
  const exportVorbereiten = async () => {
    exportVersionen = await all('versions').catch(() => []);
    exportDateien = (await all('dateien').catch(() => [])).length;
    return { versionen: exportVersionen.length, dateien: exportDateien };
  };

  /**
   * Eine Sicherung einspielen.
   *
   * @param {string} json
   * @param {'ersetzen'|'zusammenfuehren'} art
   *
   * HIER LAG DER ZWEITE FEHLER, und er war der unangenehmere. Die alte
   * Fassung schrieb die Sicherung über den Zwischenspeicher und liess die
   * Ablage stehen. Wer eine Sicherung in einen nicht leeren Bestand
   * einspielte, sah danach genau das Richtige — **bis zum Neuladen.** Dann
   * kamen alle alten Seiten zurück und lagen zwischen den eingespielten.
   * Nachgestellt und bestätigt: die „GEISTERSEITE" war nach dem Neuladen
   * wieder da.
   *
   * Das ist die schlimmste Sorte Fehler, die diese App haben kann: sie sieht
   * aus wie ein geglückter Vorgang.
   *
   * Jetzt muss der Mensch sagen, was er will — und beides tut wirklich, was
   * es verspricht:
   *
   *   ersetzen         die Ablage sieht danach aus wie die Sicherung.
   *                    Was nicht darin steht, wird gelöscht — auch auf der
   *                    Platte.
   *   zusammenfuehren  die Sicherung kommt dazu. Nichts wird gelöscht;
   *                    bei gleicher Kennung gewinnt die Sicherung.
   *
   * Es gibt bewusst KEINE Vorgabe. `CLAUDE.md`: nichts löschen ohne
   * Rückfrage. Wer `importAll(json)` ohne Angabe ruft, bekommt einen Fehler
   * mit der Frage — und nicht die stille Entscheidung von jemand anderem.
   */
  const importAll = async (json, art) => {
    const d = JSON.parse(json);
    if (!d.blocks) throw new Error('Das sieht nicht nach einer Sicherung dieser App aus.');
    if (art !== 'ersetzen' && art !== 'zusammenfuehren')
      throw new Error('Beim Einspielen muss feststehen, was geschehen soll: ' +
                      '„ersetzen" wirft weg, was nicht in der Sicherung steht, ' +
                      '„zusammenfuehren" legt sie dazu. Ohne Angabe wird nichts getan.');

    const neu = {
      blocks:      d.blocks      || {},
      collections: d.collections || {},
      views:       d.views       || {},
      meta:        d.meta        || {}
    };

    if (art === 'ersetzen') {
      /* Was in der Ablage steht und nicht in der Sicherung, muss weg — sonst
         ist es kein Ersetzen, sondern ein Zusammenführen, das sich als
         Ersetzen ausgibt. Und zwar von der PLATTE, nicht nur aus dem
         Zwischenspeicher: genau daran hing der Fehler. */
      for (const [fach, schluessel] of
           [['blocks', 'id'], ['collections', 'id'], ['views', 'id']]) {
        const vorhanden = await all(fach).catch(() => []);
        for (const satz of vorhanden)
          if (!neu[fach][satz[schluessel]]) await del(fach, satz[schluessel]);
      }
      const metaVorhanden = await all('meta').catch(() => []);
      for (const m of metaVorhanden)
        if (!(m.k in neu.meta)) await del('meta', m.k);

      cache.blocks = neu.blocks; cache.collections = neu.collections;
      cache.views = neu.views;   cache.meta = neu.meta;
    } else {
      /* Zusammenführen: nichts wegwerfen, die Sicherung sticht bei gleicher
         Kennung. */
      Object.assign(cache.blocks, neu.blocks);
      Object.assign(cache.collections, neu.collections);
      Object.assign(cache.views, neu.views);
      Object.assign(cache.meta, neu.meta);
    }

    await Promise.all([
      ...Object.values(cache.blocks).map(b      => put('blocks', b)),
      ...Object.values(cache.collections).map(c => put('collections', c)),
      ...Object.values(cache.views).map(v       => put('views', v)),
      ...Object.entries(cache.meta).map(([k,v]) => put('meta', { k, v }))
    ]);

    /* Der Verlauf, falls die Sicherung ihn mitbringt. Ältere Sicherungen
       haben ihn nicht — die sind deshalb nicht kaputt, nur älter. */
    if (Array.isArray(d.versions))
      await Promise.all(d.versions.map(v => put('versions', v)));

    notify('import');
    return { bloecke: Object.keys(cache.blocks).length,
             versionen: Array.isArray(d.versions) ? d.versions.length : 0,
             fehlt: d.fehlt || [] };
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
    elternGeaendert(p);
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

  /**
   * Nur für den Notfall: alles weg.
   *
   * DAS WAR NICHT ALLES. Hier stand eine Liste von fünf Fächern —
   * `blocks`, `collections`, `views`, `meta`, `versions`. Es gibt neun. Nicht
   * geleert wurden `dateien`, `stuecke`, `basis` und `vorrat`, also
   * ausgerechnet das, was am meisten Platz belegt: **die Anhänge**. Wer
   * zweimal bestätigte, ALLE Seiten und Datenbanken zu löschen, bekam eine
   * leere App und behielt jedes hochgeladene Bild und jedes Video auf der
   * Platte — unsichtbar, unerreichbar, und nicht mehr loszuwerden.
   *
   * Dieselbe Sorte Fehler wie beim endgültigen Löschen eine Zeile weiter
   * oben, und aus demselben Grund: eine feste Liste, die beim Anbau eines
   * Fachs niemand nachgezogen hat. Deshalb steht hier jetzt keine Liste
   * mehr, sondern die Frage an die Ablage selbst — ein neues Fach ist damit
   * von sich aus dabei.
   */
  const wipe = async () => {
    if (db) await Promise.all([...db.objectStoreNames].map(s => new Promise(ok => {
      try {
        const r = tx([s], 'readwrite').objectStore(s).clear();
        r.onsuccess = ok; r.onerror = ok;
      } catch (err) { ok(); }
    })));
    cache.blocks = {}; cache.collections = {}; cache.views = {}; cache.meta = {};
  };

  /* ========================================================================
   * DATEIEN IN STÜCKEN
   * ------------------------------------------------------------------------
   * Der rohe Zugang zur Ablage. Was daraus gemacht wird — hochladen in
   * Schritten, wieder zusammensetzen, aufräumen — steht in dateien.js.
   * Hier steht nur, wie ein Stück hinein- und wieder herauskommt.
   * ======================================================================*/
  const dateiPut   = (satz) => put('dateien', satz);
  const dateiHolen = (id)   => get('dateien', id);
  const dateiWeg   = (id)   => del('dateien', id);
  const dateiAlle  = ()     => all('dateien');

  /* --- Der letzte gemeinsame Stand (für den Abgleich) -------------------- */

  /** Merken, wie ein Satz aussah, als beide Seiten ihn zuletzt gleich sahen. */
  const basisPut = (id, satz) => put('basis', { id, satz: JSON.stringify(satz), wann: now() });

  /** Den gemerkten Stand holen — oder null, wenn es keinen gibt. */
  const basisHolen = async (id) => {
    const e = await get('basis', id);
    if (!e) return null;
    try { return JSON.parse(e.satz); } catch { return null; }
  };

  const basisWeg  = (id) => del('basis', id);
  const basisAlle = ()   => all('basis');

  /** Alles vergessen — nach einem Abmelden oder Bereichswechsel. */
  const basisLeeren = () => new Promise((ok2) => {
    if (!db || !db.objectStoreNames.contains('basis')) return ok2();
    try {
      const r = tx(['basis'], 'readwrite').objectStore('basis').clear();
      r.onsuccess = () => ok2(); r.onerror = () => ok2();
    } catch { ok2(); }
  });

  /* --- Vorberechnete Werte ---------------------------------------------- */
  const vorratPut    = (id, satz) => put('vorrat', Object.assign({ id }, satz));
  const vorratHolen  = (id) => get('vorrat', id);
  const vorratWeg    = (id) => del('vorrat', id);
  const vorratAlle   = ()   => all('vorrat');

  const stueckPut   = (satz) => put('stuecke', satz);
  const stueckHolen = (id)   => get('stuecke', id);
  const stueckWeg   = (id)   => del('stuecke', id);

  /** Alle Stücke einer Datei, in der richtigen Reihenfolge. */
  const stueckeVon = (dateiId) => new Promise((ok2) => {
    if (!db || !db.objectStoreNames.contains('stuecke')) return ok2([]);
    try {
      const r = tx(['stuecke'], 'readonly').objectStore('stuecke')
        .index('datei').getAll(dateiId);
      r.onsuccess = () => ok2((r.result || []).sort((a, b) => a.nr - b.nr));
      r.onerror   = () => ok2([]);
    } catch { ok2([]); }
  });

  /* Wie viel Platz belegt die App? */
  const usage = async () => {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    const e = await navigator.storage.estimate();
    return { benutzt: e.usage, verfuegbar: e.quota };
  };

  return {
    load, uid, now, cache,
    addBlock, getBlock, updateBlock, trashBlock, restoreBlock, purgeBlock, childrenOf,
    purgeAnhaenge, papierkorbBloecke, papierkorbAufraeumen, papierkorbBaldWeg,
    addPage, rootPages, trashed, favorites, pathOf,
    addDatabase, getCollection, getView, updateCollection, updateView, addView, removeView,
    rohSetzen,
    addRow, rowsOf, setProp,
    setMeta, getMeta, flush,
    baum, baumEinfuegen, kinderLeeren,
    versionSpeichern, versionen, versionLoeschen,
    search, pfadText, exportAll, exportVorbereiten, importAll, wipe, usage,
    dateiPut, dateiHolen, dateiWeg, dateiAlle,
    basisPut, basisHolen, basisWeg, basisAlle, basisLeeren,
    vorratPut, vorratHolen, vorratWeg, vorratAlle,
    stueckPut, stueckHolen, stueckWeg, stueckeVon,
    speichertNicht: () => nurSpeicher,
    warnungText: () => warnung,
    beiWarnung: (fn) => { warner.add(fn); if (warnung) fn(warnung); },
    on: (fn) => listeners.add(fn)
  };
})();
