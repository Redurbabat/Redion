/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ablage/befehle.ts (npm run bauen:ts). */
/* ==========================================================================
 * TRANSAKTION — Notions interne Befehle, und die drei Endpunkte dahinter
 * --------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ablage/befehle.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ablage/befehle.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notions eigene App spricht nicht über die öffentliche API mit sich selbst.
 * Sie benutzt drei interne Adressen:
 *
 *   /api/v3/loadPageChunk        eine Seite samt allem, was daran hängt
 *   /api/v3/queryCollection      die Zeilen einer Datenbank durch eine Ansicht
 *   /api/v3/submitTransaction    jede Änderung, als Liste kleiner Befehle
 *
 * Der dritte ist der interessante. Notion schickt nie „speichere diese
 * Seite", sondern immer eine Liste von Operationen:
 *
 *   { id, table, path, command, args }
 *
 * mit fünf Befehlen: set, update, listAfter, listBefore, listRemove. Alles,
 * was in Notion geschieht — Tippen, Verschieben, Löschen — ist eine solche
 * Liste.
 *
 * Diese beiden Punkte standen hier als einzige auf „offen", mit der
 * Begründung „ohne Server sinnlos". Das war zu bequem gedacht. Der Nutzen
 * liegt nicht im Server, sondern im Modell: eine Liste von Befehlen ist
 * genau eine Änderung. Sie geht ganz durch oder gar nicht, sie ist ein
 * einziger Schritt beim Rückgängigmachen, und sie lässt sich aufheben und
 * später noch einmal abspielen.
 *
 * Genau das gibt es hier jetzt. Und weil der Servicearbeiter schon /v1/
 * durchreicht, beantwortet er auch /api/v3/ — echte Aufrufe, echte Antworten
 * in Notions Form.
 * ========================================================================*/
const Transaktion = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const TABELLEN = ['block', 'collection', 'collection_view', 'notion_user'];

  /* ========================================================================
   * 1 · DEN DATENSATZ FINDEN
   * ======================================================================*/
  const holen = (table: string, id: string) => {
    if (table === 'block')           return Store.getBlock(id);
    if (table === 'collection')      return Store.getCollection(id);
    if (table === 'collection_view') return Store.getView(id);
    if (table === 'notion_user')     return { id, name: Store.getMeta('nutzer', 'Ich') };
    return null;
  };

  const sichern = (table: string, satz: any, patch: any) => {
    if (table === 'block')           return Store.updateBlock(satz.id, patch);
    if (table === 'collection')      return Store.updateCollection(satz.id, patch);
    if (table === 'collection_view') return Store.updateView(satz.id, patch);
    return satz;
  };

  /* ========================================================================
   * 2 · DER PFAD
   * ------------------------------------------------------------------------
   * Notion adressiert in den Datensatz hinein: ["properties","title"] meint
   * satz.properties.title. Bei uns heisst properties „props" — das wird
   * übersetzt, damit fremde Werkzeuge dieselben Pfade schreiben können wie
   * gegen Notion.
   * ======================================================================*/
  const UEBERSETZT: Record<string, string> = { properties: 'props', content: 'content', format: 'format',
                       schema: 'schema', last_edited_time: 'edited',
                       created_time: 'created', alive: 'alive' };

  const pfadTeile = (pfad: string[]) => (Array.isArray(pfad) ? pfad : (pfad ? [pfad] : []))
    .map((p: string, i: number) => (i === 0 && UEBERSETZT[p]) ? UEBERSETZT[p] : p);

  /** Geht den Pfad entlang und legt fehlende Zwischenstufen an. */
  const hin = (wurzel: any, teile: any) => {
    let k = wurzel;
    for (const t of teile) {
      if (k[t] === null || typeof k[t] !== 'object') k[t] = {};
      k = k[t];
    }
    return k;
  };

  const lesen = (wurzel: any, teile: any) => {
    let k = wurzel;
    for (const t of teile) {
      if (k === null || k === undefined) return undefined;
      k = k[t];
    }
    return k;
  };

  /* ========================================================================
   * 3 · DIE FÜNF BEFEHLE
   * ======================================================================*/
  const befehlAusfuehren = (op: any) => {
    const { id, table, command } = op;
    const args = op.args;
    const teile = pfadTeile(op.path);

    if (!TABELLEN.includes(table))
      return { ok: false, fehler: 'Unbekannte Tabelle: ' + table };
    const satz = holen(table, id);
    if (!satz) return { ok: false, fehler: 'Kein Datensatz mit der ID ' + id };

    /* --- set: setzt genau diesen Platz auf diesen Wert ----------------- */
    if (command === 'set') {
      if (!teile.length) return { ok: false, fehler: 'set ohne Pfad' };
      const letzter = teile[teile.length - 1];
      const eltern = teile.slice(0, -1);
      if (letzter === undefined) return { ok: false, fehler: 'set ohne Pfad' };
      /* Auf oberster Ebene direkt am Satz — sonst tief hinein */
      if (!eltern.length) {
        sichern(table, satz, { [letzter]: args });
      } else {
        const oben = eltern[0];
        if (oben === undefined) return { ok: false, fehler: 'set ohne Pfad' };
        const kopie = JSON.parse(JSON.stringify(satz[oben] ?? {}));
        hin({ [oben]: kopie }, eltern)[letzter] = args;
        sichern(table, satz, { [oben]: kopie });
      }
      return { ok: true };
    }

    /* --- update: legt die Felder von args obendrauf, ohne den Rest zu
           verlieren. Notions Unterschied zu set. --------------------- */
    if (command === 'update') {
      if (!args || typeof args !== 'object')
        return { ok: false, fehler: 'update braucht ein Objekt' };
      if (!teile.length) {
        sichern(table, satz, { ...args });
      } else {
        const wurzel = teile[0];
        if (wurzel === undefined) return { ok: false, fehler: 'update ohne Pfad' };
        const kopie = JSON.parse(JSON.stringify(satz[wurzel] ?? {}));
        Object.assign(hin({ [wurzel]: kopie }, teile), args);
        sichern(table, satz, { [wurzel]: kopie });
      }
      return { ok: true };
    }

    /* --- Die drei Listenbefehle ---------------------------------------- */
    if (command === 'listAfter' || command === 'listBefore' || command === 'listRemove') {
      const wurzel = teile[0] ?? 'content';
      const restPfad = teile.slice(1);
      const alt = lesen(satz, teile.length ? teile : ['content']);
      const liste = Array.isArray(alt) ? alt.slice() : [];
      const wert = args && args.id !== undefined ? args.id : args;

      if (command === 'listRemove') {
        const i = liste.indexOf(wert);
        if (i < 0) return { ok: false, fehler: 'Steht nicht in der Liste: ' + wert };
        liste.splice(i, 1);
      } else {
        /* Doppelte gibt es nicht — erst raus, dann an die neue Stelle */
        const schon = liste.indexOf(wert);
        if (schon >= 0) liste.splice(schon, 1);
        const anker = args && (args.after ?? args.before);
        let ziel = anker === undefined || anker === null ? -1 : liste.indexOf(anker);
        if (command === 'listAfter') {
          if (ziel < 0) liste.push(wert);            /* ohne Anker: ans Ende */
          else liste.splice(ziel + 1, 0, wert);
        } else {
          if (ziel < 0) liste.unshift(wert);         /* ohne Anker: an den Anfang */
          else liste.splice(ziel, 0, wert);
        }
      }

      if (!restPfad.length) {
        sichern(table, satz, { [wurzel]: liste });
      } else {
        const kopie = JSON.parse(JSON.stringify(satz[wurzel] ?? {}));
        const letzter = restPfad[restPfad.length - 1];
        if (letzter === undefined) return { ok: false, fehler: command + ' ohne Pfad' };
        hin({ [wurzel]: kopie }, restPfad.slice(0, -1))[letzter] = liste;
        sichern(table, satz, { [wurzel]: kopie });
      }
      return { ok: true };
    }

    return { ok: false, fehler: 'Unbekannter Befehl: ' + command };
  };

  /* ========================================================================
   * 4 · EINE TRANSAKTION
   * ------------------------------------------------------------------------
   * Alles oder nichts: geht ein Befehl schief, wird der Stand von vorher
   * wiederhergestellt. Dafür wird vorher gemerkt, wie die betroffenen
   * Datensätze aussahen — nicht die ganze Ablage, nur das Nötige.
   * ======================================================================*/
  const verlauf: any[] = [];        /* die letzten Transaktionen, zum Abspielen */
  const MAX_VERLAUF = 50;

  const ausfuehren = (operationen: any, opt: any = {}) => {
    opt = opt || {};
    const ops = Array.isArray(operationen) ? operationen : [];
    if (!ops.length) return { ok: true, ausgefuehrt: 0, fehler: [] };

    /* Der Stand vorher — je Datensatz einmal, auch wenn er mehrfach vorkommt */
    const vorher = new Map();
    ops.forEach(op => {
      const schluessel = op.table + ':' + op.id;
      if (vorher.has(schluessel)) return;
      const satz = holen(op.table, op.id);
      if (satz) vorher.set(schluessel, JSON.parse(JSON.stringify(satz)));
    });

    /* Ein Schritt zum Rückgängigmachen für die ganze Liste, nicht je Befehl */
    if (!opt.stumm && typeof Verlauf !== 'undefined') Verlauf.merke(true);

    const fehler = [];
    let getan = 0;
    for (const op of ops) {
      let e;
      try { e = befehlAusfuehren(op); }
      catch (err: unknown) { e = { ok: false, fehler: err instanceof Error ? err.message : String(err) }; }
      if (e.ok) getan++;
      else fehler.push({ op, fehler: e.fehler });
      if (!e.ok && !opt.weiterMachen) break;
    }

    /* Ging etwas schief, kommt der alte Stand zurück */
    if (fehler.length && !opt.weiterMachen) {
      vorher.forEach((satz, schluessel) => {
        const [table, id] = [schluessel.slice(0, schluessel.indexOf(':')),
                             schluessel.slice(schluessel.indexOf(':') + 1)];
        const jetzt = holen(table, id);
        if (jetzt) sichern(table, jetzt, satz);
      });
      return { ok: false, ausgefuehrt: 0, fehler,
               hinweis: 'Zurückgedreht — eine Transaktion geht ganz durch oder gar nicht.' };
    }

    verlauf.unshift({ wann: Store.now(), anzahl: ops.length, ops });
    if (verlauf.length > MAX_VERLAUF) verlauf.length = MAX_VERLAUF;

    if (typeof Protokoll !== 'undefined' && !opt.stumm)
      Protokoll.notieren('transaktion',
        getan + (getan === 1 ? ' Befehl ausgeführt' : ' Befehle ausgeführt'),
        { id: ops[0] && ops[0].id,
          wie: [...new Set(ops.map(x => x.command))].join(', ') });

    if (!opt.stumm) { try { App.zeichneSeite(); App.zeichneBaum(); } catch {} }
    return { ok: !fehler.length, ausgefuehrt: getan, fehler };
  };

  /** Eine gemerkte Transaktion noch einmal abspielen. */
  const abspielen = (i: number) => {
    const t = verlauf[i];
    if (!t) return { ok: false, fehler: [{ fehler: 'Diese Transaktion gibt es nicht' }] };
    return ausfuehren(t.ops);
  };

  /* ========================================================================
   * 5 · HANDLICHE BAUSTEINE
   * ------------------------------------------------------------------------
   * Damit man die Befehle nicht von Hand zusammensetzen muss.
   * ======================================================================*/
  const setze  = (id: string, pfad: string[], wert: any, table?: string) =>
    ({ id, table: table || 'block', path: pfad, command: 'set', args: wert });
  const aendere = (id: string, pfad: string[], felder: any, table?: string) =>
    ({ id, table: table || 'block', path: pfad, command: 'update', args: felder });
  const dahinter = (id: string, pfad: string[], was: any, anker?: any, table?: string) =>
    ({ id, table: table || 'block', path: pfad, command: 'listAfter',
       args: anker ? { id: was, after: anker } : { id: was } });
  const davor = (id: string, pfad: string[], was: any, anker?: any, table?: string) =>
    ({ id, table: table || 'block', path: pfad, command: 'listBefore',
       args: anker ? { id: was, before: anker } : { id: was } });
  const heraus = (id: string, pfad: string[], was: any, table?: string) =>
    ({ id, table: table || 'block', path: pfad, command: 'listRemove', args: { id: was } });

  /* ========================================================================
   * 6 · DIE DREI INTERNEN ENDPUNKTE
   * ======================================================================*/

  /** Ein Datensatz in Notions Umschlag: { role, value }. */
  const umschlag = (wert: any) => ({ role: 'editor', value: wert });

  const alsBlock = (b: any) => ({
    id: b.id, version: 1, type: b.type,
    properties: { title: [[b.text || '']] },
    content: (b.content || []).slice(),
    parent_id: b.parentId || '', parent_table: b.parentTable || 'block',
    alive: b.alive !== false,
    created_time: b.created ? Date.parse(b.created) : 0,
    last_edited_time: b.edited ? Date.parse(b.edited) : 0,
    collection_id: b.collectionId || undefined,
    view_ids: b.collectionId
      ? (Store.getCollection(b.collectionId) || {}).viewIds : undefined
  });

  /**
   * loadPageChunk — eine Seite und alles, was daran hängt.
   * Notions Antwort ist eine „recordMap": nach Tabelle sortierte Datensätze,
   * jeder in einem Umschlag mit Rolle.
   */
  const loadPageChunk = (k: any) => {
    const id = k.pageId || k.page_id;
    const wurzel = Store.getBlock(id);
    if (!wurzel) return { status: 404, body: { errorId: Store.uid(),
      name: 'ObjectNotFound', message: 'Diese Seite gibt es nicht: ' + id } };

    const grenze = Math.min(Number(k.limit) || 100, 1000);
    const bloecke: Record<string, any> = {}, sammlungen: Record<string, any> = {}, ansichten: Record<string, any> = {};
    let gezaehlt = 0;

    const gehe = (bid: any) => {
      if (gezaehlt >= grenze) return;
      const b = Store.getBlock(bid);
      if (!b || bloecke[bid]) return;
      bloecke[bid] = umschlag(alsBlock(b));
      gezaehlt++;
      if (b.collectionId) {
        const c = Store.getCollection(b.collectionId);
        if (c) {
          sammlungen[c.id] = umschlag({ id: c.id, version: 1,
            name: [[c.name || '']], schema: c.schema, parent_id: b.id,
            parent_table: 'block', alive: true });
          (c.viewIds || []).forEach((vid: any) => {
            const v = Store.getView(vid);
            if (v) ansichten[vid] = umschlag({ id: v.id, version: 1, type: v.layout,
              name: v.name, query2: { filter: v.filters, sort: v.sorts },
              parent_id: b.id, parent_table: 'block', alive: true });
          });
          /* Notion holt die Zeilen erst über queryCollection nach. Hier
             kommen sie gleich mit: wer eine Seite lädt, will die Tabelle
             darauf sehen, nicht erst einen zweiten Aufruf machen. Die
             Grenze gilt weiterhin — eine Datenbank mit tausend Zeilen
             sprengt die Antwort sonst. */
          Store.rowsOf(c.id).forEach((z: any) => {
            if (gezaehlt >= grenze || bloecke[z.id]) return;
            bloecke[z.id] = umschlag(alsBlock(z));
            gezaehlt++;
          });
        }
      }
      (b.content || []).forEach(gehe);
    };
    gehe(id);

    return { status: 200, body: {
      recordMap: { block: bloecke, collection: sammlungen, collection_view: ansichten },
      cursor: { stack: [] },
      isTaggedForLoad: gezaehlt >= grenze
    } };
  };

  /**
   * queryCollection — die Zeilen einer Datenbank, durch den Filter einer
   * Ansicht gesehen. Notion gibt IDs und Gesamtzahl zurück, die Daten selbst
   * stehen wieder in der recordMap.
   */
  const queryCollection = (k: any) => {
    const cid = k.collectionId || k.collection_id;
    const coll = Store.getCollection(cid);
    if (!coll) return { status: 404, body: { errorId: Store.uid(),
      name: 'ObjectNotFound', message: 'Diese Sammlung gibt es nicht: ' + cid } };

    let zeilen = Store.rowsOf(cid);
    const vid = k.collectionViewId || k.collection_view_id;
    const v = vid ? Store.getView(vid) : null;
    if (v && v.filters) zeilen = zeilen.filter((z: any) => Datenbank.gruppeTrifftZu(z, v.filters, coll));

    const q = k.loader || k.query || {};
    if (q.searchQuery)
      zeilen = zeilen.filter((z: any) => String(z.text || '').toLowerCase()
        .includes(String(q.searchQuery).toLowerCase()));

    const gesamt = zeilen.length;
    const grenze = Math.min(Number(q.limit) || 50, 1000);
    const stueck = zeilen.slice(0, grenze);

    const bloecke: Record<string, any> = {};
    stueck.forEach((z: any) => { bloecke[z.id] = umschlag(alsBlock(z)); });

    return { status: 200, body: {
      result: { type: 'table', blockIds: stueck.map((z: any) => z.id),
                aggregationResults: [], total: gesamt },
      recordMap: { block: bloecke,
        collection: { [coll.id]: umschlag({ id: coll.id, version: 1,
          name: [[coll.name || '']], schema: coll.schema, alive: true }) } }
    } };
  };

  /**
   * submitTransaction — Notions saveTransactionsFanout.
   * Erwartet { requestId, transactions: [{ id, operations: [...] }] }
   * oder kurz { operations: [...] }.
   */
  const submitTransaction = (k: any) => {
    const ops = Array.isArray(k.operations) ? k.operations
      : (k.transactions || []).flatMap((t: any) => t.operations || []);
    if (!ops.length) return { status: 400, body: { errorId: Store.uid(),
      name: 'ValidationError', message: 'Es sind keine Operationen dabei.' } };

    const erg = ausfuehren(ops, { weiterMachen: false });
    if (!erg.ok) return { status: 400, body: { errorId: Store.uid(),
      name: 'ValidationError',
      message: erg.fehler.map(f => f.fehler).join('; '),
      hinweis: erg.hinweis } };
    return { status: 200, body: {} };
  };

  /**
   * Der Weg von aussen — derselbe Kanal wie bei /v1/.
   * Notions interne Adressen kennen kein Token; hier wird trotzdem eines
   * verlangt, denn ein Skript, das mitliest, hätte sonst freien Zugriff.
   */
  const anfrage = (methode: any, pfad: string, koerper: any, kopf: any) => {
    kopf = kopf || {};
    const erwartet = Api.tokenHolen();
    const gegeben = String(kopf.authorization || '').replace(/^Bearer\s+/i, '');
    if (!erwartet || gegeben !== erwartet)
      return { status: 401, body: { errorId: Store.uid(), name: 'UnauthorizedError',
        message: 'Auch die internen Adressen wollen ein Token — sonst könnte jedes ' +
                 'fremde Skript auf der Seite alles lesen und ändern.' } };

    const name = String(pfad).replace(/^.*\/api\/v3\//, '').replace(/\/+$/, '');
    if (String(methode).toUpperCase() !== 'POST')
      return { status: 405, body: { errorId: Store.uid(), name: 'MethodNotAllowed',
        message: 'Die internen Adressen sprechen nur POST.' } };

    try {
      if (name === 'loadPageChunk')     return loadPageChunk(koerper || {});
      if (name === 'queryCollection')   return queryCollection(koerper || {});
      if (name === 'submitTransaction' ||
          name === 'saveTransactionsFanout') return submitTransaction(koerper || {});
    } catch (e: unknown) {
      return { status: 500, body: { errorId: Store.uid(), name: 'InternalError',
                                    message: e instanceof Error ? e.message : String(e) } };
    }
    return { status: 404, body: { errorId: Store.uid(), name: 'ObjectNotFound',
      message: 'Diese interne Adresse gibt es nicht: ' + name } };
  };

  /* ========================================================================
   * 7 · EIN FENSTER
   * ======================================================================*/
  const dialog = () => {
    const seite = App.aktuelleSeite && App.aktuelleSeite();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        '<div class="fh">⚙ Interne Befehle <button class="icon-btn" data-a="zu">✕</button></div>' +
        // Klassen statt Inline-Stil (E348, L111): siehe `.fn-blatt` in werkzeuge.css.
        '<div class="res fn-blatt">' +
          '<p>' +
            'Notions App schickt nie „speichere die Seite", sondern immer eine Liste ' +
            'kleiner Befehle: <code>set</code>, <code>update</code>, <code>listAfter</code>, ' +
            '<code>listBefore</code>, <code>listRemove</code>. Eine solche Liste ist genau ' +
            'eine Änderung — sie geht ganz durch oder gar nicht, und sie ist ein einziger ' +
            'Schritt beim Rückgängigmachen.' +
          '</p>' +
          '<label>Operationen (JSON)<br>' +
            '<textarea id="tx-ops" rows="7" spellcheck="false" class="fn-feld mono"></textarea></label>' +
          '<div class="fn-reihe" style="gap:7px">' +
            '<button data-a="los" class="btn prim">Ausführen</button>' +
            '<button data-bsp="titel" class="btn">Beispiel: Titel setzen</button>' +
            '<button data-bsp="reihe" class="btn">Beispiel: Blöcke umsortieren</button>' +
            '<button data-bsp="kaputt" class="btn">Beispiel: geht schief</button>' +
            '<button data-a="chunk" class="btn">loadPageChunk</button>' +
          '</div>' +
          '<pre id="tx-aus" class="fn-aus" style="max-height:250px">Noch nichts ausgeführt.</pre>' +
          `<p>Gemerkte Transaktionen: ` +
            `<b id="tx-zahl">${verlauf.length}</b> — die letzte lässt sich noch einmal abspielen.</p>` +
          '<button data-a="nochmal" class="btn" style="align-self:flex-start">Letzte noch einmal</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);

    const kinder = Store.childrenOf(seite || '').map((c: any) => c.id);
    const BSP: Record<string, string> = {
      titel: JSON.stringify([setze(seite, ['properties', 'title'], [['Neu benannt']])], null, 2),
      reihe: kinder.length >= 2
        ? JSON.stringify([dahinter(seite, ['content'], kinder[0], kinder[kinder.length - 1])], null, 2)
        : '[]',
      kaputt: JSON.stringify([
        setze(seite, ['properties', 'title'], [['Kommt nicht an']]),
        setze('gibtesnicht', ['properties', 'title'], [['Hier bricht es ab']])
      ], null, 2)
    };

    /* Die drei Felder einmal holen statt bei jedem Klick neu — und dabei
       gleich prüfen, dass es sie gibt. Vorher stand überall
       `o.querySelector('#tx-ops').value` ohne Prüfung. */
    const feldOps = o.querySelector<HTMLTextAreaElement>('#tx-ops');
    const feldAus = o.querySelector<HTMLElement>('#tx-aus');
    const feldZahl = o.querySelector<HTMLElement>('#tx-zahl');

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const bsp = elVon(e)?.closest<HTMLElement>('[data-bsp]');
      if (bsp) {
        const welches = bsp.dataset.bsp;
        if (feldOps && welches) feldOps.value = BSP[welches] || '[]';
        return;
      }
      const a = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      const zeig = (t: string) => {
        if (feldAus) feldAus.textContent = t;
        if (feldZahl) feldZahl.textContent = String(verlauf.length);
      };

      if (a.dataset.a === 'los') {
        let ops;
        try { ops = JSON.parse(feldOps?.value || '[]'); }
        catch { zeig('Das ist kein gültiges JSON.'); return; }
        const erg = ausfuehren(ops);
        zeig((erg.ok ? '✅ ' + erg.ausgefuehrt + ' Befehl(e) ausgeführt'
                     : '⛔ ' + (erg.hinweis || 'Fehlgeschlagen')) +
             '\n\n' + JSON.stringify(erg, null, 2));
      }
      if (a.dataset.a === 'chunk') {
        const erg = loadPageChunk({ pageId: seite, limit: 20 });
        zeig('HTTP ' + erg.status + '\n\n' + JSON.stringify(erg.body, null, 2).slice(0, 4000));
      }
      if (a.dataset.a === 'nochmal') {
        const erg = abspielen(0);
        zeig(erg.ok ? '✅ Noch einmal abgespielt' : '⛔ ' + JSON.stringify(erg.fehler, null, 2));
      }
    });
  };

  return { ausfuehren, befehlAusfuehren, abspielen, verlauf,
           setze, aendere, dahinter, davor, heraus,
           loadPageChunk, queryCollection, submitTransaction, anfrage,
           alsBlock, TABELLEN, dialog };
})();

(window as any).Transaktion = Transaktion;
