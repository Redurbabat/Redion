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

    req.onsuccess = () => {
      db = req.result;
      /* DIE ANDERE HÄLFTE VON `onblocked`, UND SIE FEHLTE.
         `onblocked` sagt dem NEUEN Fenster, dass ein altes im Weg steht.
         Niemand sagte dem alten Fenster, dass es im Weg steht — es hielt
         seine Verbindung offen, und das neue kam nie durch. Der Mensch sah
         in einem Tab „bitte den anderen schliessen" und im anderen eine
         App, die sich nichts anmerken liess.

         Jetzt tritt das alte Fenster zurück: Verbindung zu, ein Satz, der
         sagt was los ist. Weitergearbeitet wird hier nicht mehr — die
         Ablage ist zu, und Weiterschreiben ginge nur noch in den
         Arbeitsspeicher, also ins Nichts. */
      db.onversionchange = () => {
        try { db.close(); } catch {}
        db = null;
        warne('Ein anderes Fenster hat eine neuere Fassung der App geöffnet. ' +
              'Dieses Fenster hat die Ablage freigegeben — bitte neu laden.');
      };
      ok(db);
    };
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

    /* Erst jetzt den Draht zu den anderen Fenstern anschliessen — vorher
       gäbe es nichts, in das eine fremde Änderung eingetragen werden
       könnte, und die erste Nachricht liefe ins Leere. */
    if (typeof Nachbarn !== 'undefined' && Nachbarn.start())
      Nachbarn.beiNachricht(fremdeNachricht);

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
   *
   * NACHEINANDER, NICHT AUF EINMAL. Der erste Wurf stand hier als
   * `Promise.all(...)`. Bei einer Seite mit fünfhundert Blöcken sind das
   * tausend Transaktionen gleichzeitig — die Ablage arbeitet sie ab, aber
   * alles andere wartet mit. Nachweisbar wurde es an den Prüfläufen: nach
   * dieser Änderung fiel in jedem Durchlauf ein anderer um, immer mit einer
   * abgelaufenen Wartezeit. Ein Aufräumen im Hintergrund darf den
   * Vordergrund nicht anhalten; eine Kette ist hier schneller als ein
   * Schwarm.
   */
  const purgeBlock = (id) => {
    const gesammelt = [];
    const geloescht = [];
    purgeTief(id, gesammelt, geloescht);
    if (!gesammelt.length) return;
    notify('purge');
    (async () => {
      /* Ein Löschen läuft nicht über `save()` und damit nicht über `flush()` —
         es muss den anderen Fenstern eigens gesagt werden, sonst zeigten sie
         eine Seite weiter an, die es nicht mehr gibt, und schrieben sie beim
         nächsten Anlass zurück.

         Und zwar erst, wenn die Ablage es wirklich getan hat: meldete man
         vorher, läse das Fenster drüben den Satz noch einmal ein und
         behielte ihn. */
      await Promise.all(geloescht);
      meldeAnAndereFenster('geaendert', gesammelt.map(x => 'blocks:' + x));
      for (const x of gesammelt) await purgeAnhaenge(x);
    })().catch(err => { if (typeof Melder !== 'undefined')
      Melder.fehler('ablage', 'Beim endgültigen Löschen blieben Fassungen oder Anhänge liegen', err); });
  };

  /**
   * Einen ausstehenden Schreibvorgang zurücknehmen.
   *
   * DAS FEHLTE, UND ES HOLTE GELÖSCHTES ZURÜCK. `save()` schreibt nicht
   * sofort, sondern nach 400 ms Ruhe. An über einem Dutzend Stellen steht
   * `Store.trashBlock(b.id); Store.purgeBlock(b.id);` — sofort und
   * endgültig löschen, ohne Umweg über den Papierkorb. `trashBlock` legt
   * den Block dabei in den Stapel, `purgeBlock` löscht ihn von der Platte,
   * und 400 ms später schreibt der Stapel ihn **wieder hin**.
   *
   * Im Zwischenspeicher war er weg, auf der Platte lag er weiter — und beim
   * nächsten Laden kam er zurück, mit `alive: false`. Seit der Papierkorb
   * auch Blöcke zeigt, würde er dort sogar auftauchen: eine Seite, die
   * jemand endgültig gelöscht hat, steht am nächsten Tag wieder da.
   */
  const vergissAusstehendes = (store, id) => pending.delete(store + ':' + id);

  /** Der eigentliche Abstieg. Sammelt, was danach noch aufzuräumen ist. */
  const purgeTief = (id, gesammelt, geloescht = []) => {
    const b = cache.blocks[id];
    if (!b) return;
    gesammelt.push(id);
    vergissAusstehendes('blocks', id);
    [...(b.content || [])].forEach(k => purgeTief(k, gesammelt, geloescht));
    /* Eine verknüpfte Ansicht zeigt fremde Daten — die bleiben bestehen. */
    if (b.collectionId && !b.verknuepft) {
      const c = cache.collections[b.collectionId];
      if (c) {
        /* Auch eine Zeile kann Fassungen und Anhänge haben — sie ist eine
           Seite. Sie hier zu vergessen wäre derselbe Fehler eine Ebene
           tiefer, und die Ebene sieht niemand. */
        rowsOf(b.collectionId).forEach(r => {
          gesammelt.push(r.id); vergissAusstehendes('blocks', r.id);
          delete cache.blocks[r.id]; geloescht.push(del('blocks', r.id));
        });
        (c.viewIds || []).forEach(v => {
          vergissAusstehendes('views', v);
          delete cache.views[v]; geloescht.push(del('views', v));
        });
        vergissAusstehendes('collections', b.collectionId);
        delete cache.collections[b.collectionId];
        geloescht.push(del('collections', b.collectionId));
        /* Die vorberechneten Werte dieser Datenbank sind ohne sie sinnlos. */
        vorratWeg(b.collectionId).catch(() => {});
      }
    }
    const p = cache.blocks[b.parentId];
    if (p) { p.content = p.content.filter(x => x !== id); elternGeaendert(p); }
    delete cache.blocks[id];
    geloescht.push(del('blocks', id));
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

  /* ========================================================================
   * ZWEI FENSTER, EINE ABLAGE
   * ------------------------------------------------------------------------
   * Zwei Tabs mit Redion teilen sich **eine** IndexedDB, aber jeder hält
   * seinen eigenen Zwischenspeicher — gefüllt einmal beim Laden und danach
   * nie wieder nachgesehen. Daraus folgte:
   *
   *   Tab A ändert eine Seite. Tab B weiss davon nichts. Sobald B irgendetwas
   *   an dieser Seite tut, schreibt es seinen alten Stand darüber. Die
   *   Änderung aus A ist weg — ohne Meldung, ohne Konflikt, ohne Spur.
   *
   * Es braucht kein Missgeschick dafür. Zwei Tabs offen zu haben ist der
   * Normalfall, und der Verlust fällt erst Tage später auf, wenn niemand
   * mehr weiss, woher er kommt.
   *
   * Der Draht liegt in `nachbarn.js` und kennt keine Blöcke. Hier steht, was
   * mit einer Nachricht geschieht: die genannten Sätze werden **von der
   * Platte neu gelesen** — nicht aus der Nachricht übernommen. Die Platte
   * ist die Wahrheit; eine Nachricht könnte veraltet sein, wenn zwei
   * Änderungen sich überholen.
   * ======================================================================*/
  const meldeAnAndereFenster = (art, schluessel) => {
    if (typeof Nachbarn === 'undefined' || !Nachbarn.offen()) return;
    Nachbarn.sende({ art, schluessel });
  };

  /* Sammelt kurz, statt bei jeder Nachricht einzeln zu lesen: zwanzig
     Tastendrücke drüben sind hier ein Nachlesen, nicht zwanzig. */
  let fremdWartend = new Set();
  let fremdTimer = null;

  const fremdesEintragen = async () => {
    fremdTimer = null;
    const dran = [...fremdWartend];
    fremdWartend.clear();
    if (!db || !dran.length) return;

    let geaendert = 0;
    for (const schluessel of dran) {
      const trenn = schluessel.indexOf(':');
      const fach = schluessel.slice(0, trenn);
      const id   = schluessel.slice(trenn + 1);
      if (!['blocks', 'collections', 'views', 'meta'].includes(fach)) continue;
      try {
        const satz = await get(fach, fach === 'meta' ? id : id);
        if (fach === 'meta') {
          if (satz) cache.meta[satz.k] = satz.v; else delete cache.meta[id];
        } else if (satz) {
          cache[fach][id] = satz;
        } else {
          delete cache[fach][id];
        }
        geaendert++;
      } catch { /* ein Satz weniger ist kein Grund, die übrigen fallenzulassen */ }
    }
    /* `fremd` und nicht `save`: die Oberfläche soll unterscheiden können,
       ob sie selbst etwas getan hat oder ob es von drüben kam. Beim eigenen
       Tun zeichnet sie ohnehin; hier ist sie ahnungslos und muss es
       erfahren. */
    if (geaendert) notify('fremd');
  };

  const fremdeNachricht = (n) => {
    if (!n) return;
    if (n.art === 'alles') {
      /* „Alles löschen" oder eine eingespielte Sicherung drüben. Einzelne
         Sätze nachzulesen hilft dann nicht — der ganze Bestand ist ein
         anderer. Die Oberfläche erfährt es und entscheidet selbst. */
      notify('fremd-alles');
      return;
    }
    (n.schluessel || []).forEach(k => fremdWartend.add(k));
    if (!fremdTimer) fremdTimer = setTimeout(fremdesEintragen, 120);
  };

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

  /**
   * Schreibt alles Angesammelte raus — und sagt es danach den anderen
   * Fenstern.
   *
   * EINE TRANSAKTION FÜR ALLES, NICHT EINE JE SATZ. Hier stand
   * `pending.forEach(… put(store, val) …)`, und jedes `put` öffnete seine
   * eigene Transaktion. Beim ersten Start legt die App die Wissensseiten an;
   * dann liegen knapp zweitausend Sätze im Stapel, und daraus wurden
   * zweitausend Transaktionen. Gemessen: nach einer Sekunde waren 1881 von
   * 1973 durch — die übrigen 92 standen noch an.
   *
   * Solange niemand darauf wartete, fiel es nicht auf. Es fiel in dem
   * Moment auf, in dem die Meldung an die anderen Fenster darauf warten
   * musste: sie kam nie. Ein Fehler, den erst die nächste Funktion sichtbar
   * macht — die Sorte, die man ohne den Anlass nie findet.
   *
   * EIN SCHLECHTER SATZ DARF DEN STAPEL NICHT MITREISSEN. IndexedDB bricht
   * eine Transaktion ab, sobald ein Schreibfehler unbehandelt bleibt — mit
   * zweitausend Sätzen in einer Transaktion hiesse das: ein unmöglicher
   * Satz, und die anderen 1999 sind auch weg. Deshalb bekommt jede einzelne
   * Anfrage ihr eigenes `onerror`, das den Abbruch verhindert. Der schlechte
   * Satz geht verloren, die guten kommen an.
   */
  const flush = () => {
    if (!db) { pending.clear(); return; }
    const schluessel = [...pending.keys()];
    const posten = [...pending.values()];
    pending.clear();
    if (!posten.length) return;

    let fertig;
    try {
      const faecher = [...new Set(posten.map(x => x.store))];
      const t = tx(faecher, 'readwrite');
      posten.forEach(({ store, val }) => {
        try {
          const r = t.objectStore(store).put(val);
          r.onerror = (e) => {
            e.preventDefault();          /* nicht den ganzen Stapel abbrechen */
            if (typeof Melder !== 'undefined')
              Melder.warnung('ablage', 'Ein Satz liess sich nicht schreiben', { store, id: val.id });
          };
        } catch (err) {
          if (typeof Melder !== 'undefined')
            Melder.warnung('ablage', 'Ein Satz liess sich nicht schreiben', { store, id: val.id, err });
        }
      });
      fertig = new Promise(ok => { t.oncomplete = ok; t.onerror = ok; t.onabort = ok; });
    } catch (err) {
      /* Geht die Sammeltransaktion gar nicht auf, lieber einzeln als nicht:
         ein langsamer Weg ist besser als ein verlorener Stapel. */
      fertig = Promise.all(posten.map(({ store, val }) => put(store, val).catch(() => {})));
    }

    /* Und die anderen Fenster wissen es jetzt auch. Siehe `nachbarn.js`:
       ohne diese Zeile hält jedes Fenster seinen eigenen Stand für die
       Wahrheit und schreibt ihn beim nächsten Anlass über den fremden.
       ERST WENN ES WIRKLICH AUF DER PLATTE STEHT. Der erste Wurf meldete
       sofort — das Fenster drüben las nach, fand noch nichts und schloss
       daraus, der Satz sei gelöscht. Eine Meldung über eine Änderung, die es
       noch nicht gibt, ist schlimmer als gar keine. */
    fertig.then(() => meldeAnAndereFenster('geaendert', schluessel));
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
  /**
   * @param {boolean} [mitAnhaengen] true, wenn der Aufrufer die Anhänge
   *        daneben legt — also beim `.redion`-Archiv. Dann darf die Sicherung
   *        nicht länger behaupten, sie fehlten.
   *
   * Die Felder `enthaelt`, `fehlt` und `hinweis` sind kein Beiwerk. Eine
   * Sicherung, die nicht sagt, was sie auslässt, ist die gefährlichste Sorte:
   * man merkt es erst, wenn man sie braucht.
   */
  const exportAll = (mitAnhaengen = false) => {
    const dateienDa = zaehlerDateien();
    const fehlenAnhaenge = dateienDa && !mitAnhaengen;
    return JSON.stringify({
      version: VERSION,
      exportiert: now(),
      /* Was drin ist — damit ein Einleser es nachsehen kann, statt zu raten. */
      enthaelt: ['blocks', 'collections', 'views', 'meta', 'versions']
        .concat(mitAnhaengen && dateienDa ? ['dateien', 'stuecke'] : []),
      fehlt: fehlenAnhaenge
        ? ['dateien', 'stuecke']
        : [],
      hinweis: fehlenAnhaenge
        ? 'Diese Sicherung enthält ' + dateienDa + ' Datei(en) NICHT — nur ihre ' +
          'Blöcke. Anhänge liegen als Blob in der Ablage und passen nicht in ' +
          'eine JSON-Datei. Sie bleiben auf diesem Gerät.'
        : dateienDa
          ? 'Vollständig: die ' + dateienDa + ' Datei(en) liegen im Ordner ' +
            '„dateien" desselben Archivs.'
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
    /* Nach einer eingespielten Sicherung ist der ganze Bestand ein anderer.
       Einzelne Sätze nachzulesen hülfe den anderen Fenstern nichts — sie
       müssen von vorn anfangen. */
    meldeAnAndereFenster('alles', []);
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
  /**
   * Welche Fassungen dürfen gehen? Reine Rechnung, ohne Ablage und ohne
   * Oberfläche — damit ein Prüflauf sie mit einer erfundenen Liste füttern
   * kann, statt zwei Stunden lang zu tippen.
   *
   * WAS HIER VORHER STAND, war `slice(30)`: behalte die neuesten dreissig,
   * wirf den Rest weg. Das klingt vernünftig und ist es nicht. Eine Fassung
   * entsteht alle vier Minuten; wer einen Nachmittag an einer Seite arbeitet,
   * erzeugt dreissig davon. Am Abend steht ein Verlauf mit dreissig
   * Einträgen da — und reicht **zwei Stunden** zurück. Die Fassung von
   * letzter Woche, wegen der man einen Verlauf überhaupt hat, war still weg.
   *
   * Die Regel jetzt, von neu nach alt:
   *
   *   1. Die jüngsten `FASSUNGEN_FRISCH` bleiben unangetastet — beim
   *      Rückgängigmachen von heute will niemand Lücken.
   *   2. Für die nächsten `FASSUNGEN_TAGE` Tage bleibt **eine je Tag**.
   *   3. Danach bleibt **eine je Monat**.
   *   4. Was von Hand gesichert wurde, bleibt immer. Dort hat ein Mensch auf
   *      einen Knopf gedrückt; das ist eine Absicht und kein Zwischenstand.
   *   5. Über allem die harte Obergrenze `VERSIONEN_MAX`. Greift sie, gehen
   *      die ältesten automatischen zuerst.
   *
   * Derselbe Platz, ein Verlauf, der zurückreicht.
   *
   * @param {Array<{id,zeit,anlass}>} liste neueste zuerst
   * @returns {string[]} die Kennungen, die weg dürfen
   */
  const fassungenAusduennen = (liste, grenzen = {}) => {
    const K = (typeof KONSTANTEN !== 'undefined') ? KONSTANTEN : {};
    const frisch = grenzen.frisch ?? K.FASSUNGEN_FRISCH ?? 12;
    const tage   = grenzen.tage   ?? K.FASSUNGEN_TAGE   ?? 30;
    const max    = grenzen.max    ?? K.VERSIONEN_MAX    ?? 200;

    const sortiert = [...(liste || [])]
      .filter(v => v && v.id)
      .sort((a, b) => String(b.zeit || '').localeCompare(String(a.zeit || '')));

    const weg = new Set();
    const gesehen = new Set();
    const jetzt = sortiert.length ? new Date(sortiert[0].zeit).getTime() : Date.now();
    const vonHand = (v) => v.anlass && v.anlass !== 'automatisch';

    sortiert.forEach((v, i) => {
      if (i < frisch) return;                       /* 1. */
      if (vonHand(v)) return;                       /* 4. */

      const wann = new Date(v.zeit);
      if (isNaN(wann.getTime())) return;            /* kaputte Zeit: nicht anfassen */
      const alterTage = (jetzt - wann.getTime()) / 86400000;

      /* Der Eimer, in den diese Fassung fällt: ein Tag, oder ein Monat. */
      const eimer = alterTage <= tage
        ? 'T' + v.zeit.slice(0, 10)
        : 'M' + v.zeit.slice(0, 7);

      if (gesehen.has(eimer)) weg.add(v.id);
      else gesehen.add(eimer);                      /* 2. und 3. */
    });

    /* 5. Die harte Grenze. Sie greift erst, wenn das Ausdünnen nicht reicht —
       etwa wenn jemand jahrelang jeden Tag an derselben Seite schreibt.
       Sie greift aber NUR nach automatischen Fassungen. Wer zweihundertmal
       selbst auf „Fassung sichern" gedrückt hat, hat zweihundertmal eine
       Absicht gehabt; die still wegzuräumen, weil eine Zahl im Weg steht,
       wäre genau das, was diese App nicht tun darf. */
    const bleibt = sortiert.filter(v => !weg.has(v.id));
    if (bleibt.length > max) {
      let zuViel = bleibt.length - max;
      for (let i = bleibt.length - 1; i >= 0 && zuViel > 0; i--)
        if (!vonHand(bleibt[i])) { weg.add(bleibt[i].id); zuViel--; }
    }

    return [...weg];
  };

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
    for (const id of fassungenAusduennen(await versionen(pageId))) await del('versions', id);
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
    meldeAnAndereFenster('alles', []);
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
    versionSpeichern, versionen, versionLoeschen, fassungenAusduennen,
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
