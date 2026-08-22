/* ============================================================================
 * store.js — Die lokale Datenbank
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ablage/indexdb.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ablage/indexdb.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
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

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */

  /* Name und Fassung stehen in kern/einstellung/konstanten.js beziehungsweise
     kern/ablage/umzuege.js — dort steht auch, warum es jedes Fach gibt.
     Hier nur der Rückfall, falls diese Datei einmal allein geladen wird. */
  const NAME = (typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.ABLAGE_NAME : 'notizen';
  const VERSION = (typeof Umzuege !== 'undefined') ? Umzuege.JETZIGE : 6;
  let db: any = null;

  /* Alle Änderungen laufen durch save(), das merkt sich Beobachter. */
  const listeners = new Set<(was: any) => void>();
  const notify = (was: any) => listeners.forEach(fn => fn(was));

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
  const warner = new Set<(text: string) => void>();
  const warne = (text: string) => {
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

    req.onupgradeneeded = (e: any) => {
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
      /* Version 6: vorbereitete Suchwörter. Anders als `blocks` ist dieses
         Fach niemals Nutzerdaten-Wahrheit. Es darf vollständig geleert und
         aus Blöcken und Sammlungen neu gebaut werden. */
      if (!d.objectStoreNames.contains('suchindex'))
        d.createObjectStore('suchindex', { keyPath: 'id' });
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
  const tx = (stores: any, mode: any) => db.transaction(stores, mode);

  const put = (store: any, val: any) => new Promise((ok, fail) => {
    if (!db) return ok(val);
    try {
      const r = tx([store], 'readwrite').objectStore(store).put(val);
      r.onsuccess = () => ok(val);
      r.onerror   = () => fail(r.error);
    } catch (err) { fail(err); }
  });

  const get = (store: any, key: any) => new Promise<any>((ok, fail) => {
    if (!db) return ok(null);
    const r = tx([store], 'readonly').objectStore(store).get(key);
    r.onsuccess = () => ok(r.result || null);
    r.onerror   = () => fail(r.error);
  });

  /* ==========================================================================
   * LESEN UND LÖSCHEN — und warum sie jetzt ABLEHNEN
   * --------------------------------------------------------------------------
   * Hier stand in beiden Fällen `ok([])` bzw. `ok()` im Fehlerzweig: ein
   * Lesefehler wurde zu einer leeren Liste, ein misslungenes Löschen zu
   * einem Erfolg. Das ist bequem und in einer Ablage die gefährlichste
   * Bequemlichkeit, die es gibt — denn beides sind gültige Antworten.
   *
   * WAS DARAN HING, gemessen am 8. August:
   *
   *   `importAll(json, 'ersetzen')` liest erst, was da ist, und löscht dann,
   *   was in der Sicherung fehlt. Scheitert das Lesen (zweiter Tab mit
   *   neuerer Fassung, Quota, abgebrochene Transaktion), kommt `[]` zurück,
   *   die Löschschleife läuft NULL Mal, die neuen Sätze werden darübergelegt
   *   — und der Nutzer liest „Sicherung geladen". Nach dem Neuladen stehen
   *   die alten Seiten wieder dazwischen. Genau die Geisterseite, die der
   *   Kommentar weiter unten für behoben erklärt.
   *
   *   `exportVorbereiten` zählt die Anhänge mit `all('dateien')`. Scheitert
   *   das, sind es null, und die .json-Sicherung schreibt sich selbst
   *   „Vollständig: dieser Bestand hat keine Dateianhänge" ins Manifest —
   *   während die Anhänge da sind.
   *
   * Die vier `.catch(() => [])` an den Aufrufstellen waren übrigens toter
   * Code: `all` konnte nie ablehnen. Jemand hat den Fall bedacht und ist
   * dem Versprechen der Funktion aufgesessen.
   *
   * FEHLT DIE ABLAGE GANZ (`!db`, also nurSpeicher), bleibt es bei der
   * leeren Antwort. Das ist kein Fehler, sondern der bekannte Zustand: die
   * App läuft ohne Speicher weiter, und `load()` hat davor gewarnt.
   * ========================================================================*/
  const all = (store: any) => new Promise<any[]>((ok, fail) => {
    if (!db) return ok([]);
    try {
      const r = tx([store], 'readonly').objectStore(store).getAll();
      r.onsuccess = () => ok(r.result || []);
      r.onerror   = () => fail(r.error || new Error('Fach „' + store + '" nicht lesbar'));
    } catch (err) { fail(err); }
  });

  const del = (store: any, key: any) => new Promise<void>((ok, fail) => {
    if (!db) return ok();
    try {
      const r = tx([store], 'readwrite').objectStore(store).delete(key);
      r.onsuccess = () => ok();
      r.onerror   = () => fail(r.error || new Error('Aus „' + store + '" nicht löschbar'));
    } catch (err) { fail(err); }
  });

  /* --------------------------------------------------------------------------
   * DER CACHE
   * --------------------------------------------------------------------------
   * IndexedDB ist asynchron, das Rendern soll aber sofort passieren. Deshalb
   * liegt alles zusätzlich im Speicher und wird im Hintergrund geschrieben.
   * ------------------------------------------------------------------------*/
  /* Der Arbeitsspeicher-Abzug der Datenbank. Vier Verzeichnisse nach
     Kennung — für TypeScript muss das ausdrücklich dastehen, sonst hält es
     `{}` für ein Objekt ohne jedes Feld und kein `cache.blocks[id]` geht. */
  type Verzeichnis = Record<string, any>;
  const cache: { blocks: Verzeichnis; collections: Verzeichnis;
                 views: Verzeichnis; meta: Verzeichnis; suchindex: Verzeichnis } =
    { blocks:{}, collections:{}, views:{}, meta:{}, suchindex:{} };

  /* Der Suchindex fragt diese Zahl ab, statt nach zwanzig Sekunden blind den
     ganzen Bestand neu zu zerlegen. Sie ist nur ein Sitzungszähler: nach
     einem Neustart prüft der Index seine gespeicherten Quellenstände. */
  let datenFassung = 0;
  const datenGeaendert = () => { datenFassung++; };

  const load = async () => {
    try {
      await open();
    } catch (err) {
      /* Kein Speicher — trotzdem weitermachen, nur eben ohne Sichern. */
      db = null;
      nurSpeicher = true;
      warne('Der lokale Speicher ist hier gesperrt: ' +
            (err instanceof Error ? err.message : String(err)) +
            ' — die App läuft, sichert aber nichts. Öffne die Datei direkt vom Desktop, ' +
            'dann bleibt alles erhalten.');
      return;
    }
    /* EIN LESEFEHLER IST KEIN LEERER BESTAND. Vorher gab `all` bei jedem
       Fehler `[]` zurück; die App startete dann mit einem leeren Zwischen-
       speicher, und das Erste, was der Nutzer tat, wurde daraufgeschrieben.
       Jetzt bricht der Start ab und sagt, was los ist — die Daten auf der
       Platte bleiben unangetastet. */
    try {
      /* Die vier Wahrheitsfächer hängen nicht voneinander ab. Parallel lesen
         spart bei grossen Beständen messbar Startzeit, ohne die Reihenfolge
         der Sätze oder ihre Bedeutung zu verändern. */
      const [bloecke, sammlungen, ansichten, metadaten] = await Promise.all([
        all('blocks'), all('collections'), all('views'), all('meta')
      ]);
      bloecke.forEach((b: any)      => cache.blocks[b.id] = b);
      sammlungen.forEach((c: any)   => cache.collections[c.id] = c);
      ansichten.forEach((v: any)    => cache.views[v.id] = v);
      metadaten.forEach((m: any)    => cache.meta[m.k] = m.v);
    } catch (err) {
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

    /* Ein kaputter Beschleuniger darf den Bestand niemals in den Notbetrieb
       schicken. Deshalb wird das Cache-Fach getrennt von den Nutzerdaten
       gelesen. Jeder Fehler bedeutet hier ausschliesslich: leer anfangen. */
    try {
      (await all('suchindex')).forEach((e: any) => {
        if (e && typeof e.id === 'string') cache.suchindex[e.id] = e;
      });
    } catch (err) {
      cache.suchindex = {};
      if (typeof Reporter !== 'undefined')
        Reporter.warn('Suche', 'Der Suchindex war nicht lesbar und wird repariert', err);
    }

    /* --- Selbstheilung ---------------------------------------------------
       Ein Satz, dem ein Feld fehlt, bringt die Oberfläche zu Fall — und zwar
       an einer Stelle, die mit der Ursache nichts zu tun hat. Ein Import,
       eine alte Sicherung oder ein abgebrochener Abgleich reichen dafür.
       Deshalb wird hier einmal durchgesehen und ergänzt, was fehlt.

       „Nichts wird ersetzt und nichts weggeworfen" stand hier — und war an
       zwei Stellen von `formen.ts` schlicht nicht wahr (E72). Jetzt ist es
       wahr: was Redion nicht lesen kann, bekommt die Vorgabe vorgesetzt und
       liegt daneben unter `unlesbar`. Weggeworfen wird nur, was leer war. */
    if (typeof Formen !== 'undefined') {
      try {
        const b = Formen.zustand(true);
        if (b && b.geheilt && typeof Reporter !== 'undefined')
          Reporter.info('Ablage', b.geheilt + ' von ' + b.geprueft +
                      ' Sätzen ergänzt', b.stellen);
      } catch (e) {
        if (typeof Reporter !== 'undefined')
          Reporter.error('Ablage', 'Selbstheilung: ' + (e instanceof Error ? e.message : String(e)), e);
      }
    }

    /* --- Umzüge im Inhalt ------------------------------------------------
       Neue Fächer legt der Browser an. Ein Feld, das früher fehlte, muss
       jemand nachtragen — einmal, hier, und nie wieder. */
    if (typeof Umzuege !== 'undefined') {
      try { Umzuege.laufen(); }
      catch (e: unknown) { if (typeof Reporter !== 'undefined')
        Reporter.error('Ablage', 'Umzug: ' + (e instanceof Error ? e.message : String(e)), e); }
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
  /* Kennungen kommen aus core/helpers/ids.js — dieselbe Form an jeder
     Stelle. Der Rückfall greift nur, wenn diese Datei allein geladen wird. */
  const uid = () => (typeof Ids !== 'undefined')
    ? Ids.long()
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
  const addBlock = (parentId: any, type = 'text', patch: Record<string, any> = {}, index = -1) => {
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
  const elternGeaendert = (p: any) => {
    if (!p) return;
    p.edited = now();
    save('blocks', p);
  };

  /* Die drei Nachschlager nehmen auch `undefined` an. Das ist kein
     Nachlassen: der Aufrufer holt die Kennung fast immer aus `dataset`,
     und die kann fehlen. Vorher stand an neun Stellen `getBlock(x.dataset.b)`
     — ohne Kennung kam `cache.blocks[undefined]` heraus, also `undefined`
     statt eines ehrlichen `null`. */
  const getBlock = (id?: string | null) => (id ? cache.blocks[id] : null) || null;

  const updateBlock = (id: string, patch: any) => {
    const b = cache.blocks[id];
    if (!b) return null;
    Object.assign(b, patch, { edited: now(), geaendertVon: getMeta('nutzer', '') || 'Ich' });
    save('blocks', b);
    return b;
  };

  /** Verschiebt einen Block in den Papierkorb — wie in Notion erst 'alive: false'. */
  const trashBlock = (id: string) => {
    const b = cache.blocks[id];
    if (!b) return;
    b.alive = false;
    b.trashedAt = now();
    const p = cache.blocks[b.parentId];
    if (p) {
      p.content = p.content.filter((x: any) => x !== id);
      elternGeaendert(p);
    }
    save('blocks', b);
  };

  const restoreBlock = (id: string) => {
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
   * das über den Reporter — still schlucken wäre das, was den Fehler überhaupt
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
  const purgeBlock = (id: string) => {
    const gesammelt: any[] = [];
    const geloescht: Promise<void>[] = [];
    purgeTief(id, gesammelt, geloescht);
    if (!gesammelt.length) return;
    datenGeaendert();
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
    })().catch(err => {
      /* Seit `del` ablehnt, kann hier auch der BLOCK selbst liegenbleiben,
         nicht nur seine Anhänge — und dann steht er nach dem Neuladen wieder
         da. `meldeAnAndereFenster` läuft in dem Fall nicht, weil das `await`
         darüber wirft; die anderen Fenster behalten also ihren Stand, was
         richtig ist. Was fehlt, ist eine Meldung an den Menschen, und die
         steht jetzt hier. */
      if (typeof Reporter !== 'undefined')
        Reporter.error('ablage', 'Das endgültige Löschen ist nicht durchgelaufen — ' +
          'nach dem Neuladen kann Gelöschtes wieder auftauchen', err);
      if (typeof UI !== 'undefined' && UI.toast)
        UI.toast('Der Speicher hat das Löschen nicht angenommen — bitte neu laden.');
    });
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
  const vergissAusstehendes = (store: any, id: string) => pending.delete(store + ':' + id);

  /** Der eigentliche Abstieg. Sammelt, was danach noch aufzuräumen ist. */
  const purgeTief = (id: string, gesammelt: any[], geloescht: Promise<void>[] = []) => {
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
        (c.viewIds || []).forEach((v: any) => {
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
    if (p) { p.content = p.content.filter((x: any) => x !== id); elternGeaendert(p); }
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
  const purgeAnhaenge = async (id: string, hinweis: { datei?: string } = {}) => {
    for (const v of await versionen(id)) await del('versions', v.id);

    /* Auch hier: „kein Anhang" und „nicht nachsehen können" sind zweierlei.
       Das Zweite muss durchschlagen — sonst meldet das endgültige Löschen
       Erfolg, während die Anhänge liegen bleiben. `purgeBlock` fängt es. */
    const dateien = await new Promise<any[]>((ok2, fail2) => {
      if (!db || !db.objectStoreNames.contains('dateien')) return ok2([]);
      try {
        const r = tx(['dateien'], 'readonly').objectStore('dateien').index('block').getAll(id);
        r.onsuccess = () => ok2(r.result || []);
        r.onerror   = () => fail2(r.error || new Error('Das Fach „dateien" ist nicht lesbar'));
      } catch (err) { fail2(err); }
    });
    /* Manche Blockarten merken sich die Datei am Block statt umgekehrt.
       Beide Wege werden gegangen, doppelt gelöscht wird nichts. */
    const kennungen = new Set<string>(dateien.map((d: any) => d.id));
    const b = cache.blocks[id];
    [hinweis.datei, b && b.dateiId, b && b.datei].forEach(x => { if (x) kennungen.add(x); });

    for (const dateiId of kennungen) {
      for (const st of await stueckeVon(dateiId)) await del('stuecke', st.id);
      await del('dateien', dateiId);
    }
  };

  /** Die lebenden Kindblöcke in der richtigen Reihenfolge. */
  const childrenOf = (id: string) => {
    const b = cache.blocks[id];
    if (!b) return [];
    return (b.content || []).map((x: any) => cache.blocks[x]).filter((x: any) => x && x.alive);
  };

  /* ========================================================================
   * SEITEN
   * ======================================================================*/
  const addPage = (parentId: string | null = null, patch: Record<string, any> = {}) => {
    const p = addBlock(parentId, 'page', Object.assign({
      text: '', icon: '📄', cover: '', wide: false, font: 'default', small: false
    }, patch));
    notify('pages');
    return p;
  };

  /** Alle Seiten auf oberster Ebene (ohne Elternteil). */
  const rootPages = () => Object.values<any>(cache.blocks)
    .filter(b => b.type === 'page' && b.alive && !b.parentId && b.parentTable !== 'collection')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.created.localeCompare(b.created));

  const trashed = () => Object.values<any>(cache.blocks)
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
  const papierkorbBloecke = () => Object.values<any>(cache.blocks)
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

    const wann = (b: any) => new Date(b.trashedAt).getTime();
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

  const favorites = () => Object.values<any>(cache.blocks)
    .filter(b => b.type === 'page' && b.alive && b.favorite);

  /** Der Pfad von der obersten Seite bis hierher — für die Breadcrumbs. */
  const pathOf = (id: string) => {
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

  const addDatabase = (parentId: any, name = 'Neue Datenbank', schema: Record<string, any> | null = null, layout = 'table') => {
    const colId  = uid();
    const viewId = uid();

    /* Schema-Schlüssel über Ids.short, nie roh aus uid(): ein rein
       numerischer Schnipsel („2345") ist ein Integer-Schlüssel und stünde
       in Object.keys VOR dem Titel — bei vier Hex-Zeichen trifft das 15 %
       aller Schlüssel (E96). Der Rückfall greift nur, wenn diese Datei
       allein geladen wird, und stellt dann einen Buchstaben voran. */
    const kurz = (n: number): string => (typeof Ids !== 'undefined')
      ? Ids.short(n) : 'k' + uid().slice(0, n - 1);
    const s = schema || {
      title: { name: 'Name',   type: 'title'  },
      [kurz(4)]: { name: 'Status', type: 'select', options: [
        { name: 'Offen',    color: 'gray'   },
        { name: 'In Arbeit',color: 'blue'   },
        { name: 'Erledigt', color: 'green'  }
      ]},
      [kurz(4)]: { name: 'Datum',  type: 'date' }
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

  const getCollection = (id?: string | null) => (id ? cache.collections[id] : null) || null;
  const getView       = (id: string) => cache.views[id] || null;

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
  const rohSetzen = (tabelle: string, satz: any) => {
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
  const updateCollection = (id: string, patch: any) => {
    const c = cache.collections[id];
    if (!c) return null;
    Object.assign(c, patch);
    if (!('edited' in patch)) c.edited = now();
    save('collections', c);
    return c;
  };

  const updateView = (id: string, patch: any) => {
    const v = cache.views[id];
    if (!v) return null;
    Object.assign(v, patch);
    if (!('edited' in patch)) v.edited = now();
    save('views', v);
    return v;
  };

  const addView = (collectionId: any, layout = 'table', name = '') => {
    const c = cache.collections[collectionId];
    if (!c) return null;
    const namen = { table:'Tabelle', board:'Board', list:'Liste', gallery:'Galerie',
                    calendar:'Kalender', timeline:'Zeitstrahl', chart:'Diagramm', form:'Formular',
                    feed:'Feed', map:'Karte', dashboard:'Dashboard' } as Record<string, string>;
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

  const removeView = (viewId: any) => {
    const v = cache.views[viewId];
    if (!v) return;
    const c = cache.collections[v.collectionId];
    if (c && c.viewIds.length > 1) {
      c.viewIds = c.viewIds.filter((x: any) => x !== viewId);
      save('collections', c);
      delete cache.views[viewId];
      del('views', viewId);
    }
  };

  /** Eine Zeile ist ein Block vom Typ 'page' mit parentTable 'collection'. */
  /* ------------------------------------------------------------------------
   * WARUM ZEILEN EINE FOLGE BRAUCHEN
   * ------------------------------------------------------------------------
   * `created` hat Millisekunden. Vier Zeilen, die in derselben Millisekunde
   * entstehen, haben denselben Zeitstempel — und damit KEINE Reihenfolge.
   * `Object.values<any>(cache.blocks)` gibt sie beim nächsten Start in der
   * Reihenfolge zurück, in der IndexedDB sie liefert, und die ist eine
   * andere. Ergebnis: nach dem Neuladen stehen die Zeilen vertauscht da.
   *
   * Von Hand passiert das nie — kein Mensch legt vier Zeilen in einer
   * Millisekunde an. Beim Einfügen aus Excel, beim CSV-Import und bei
   * Vorlagen passiert es jedes Mal. Gefunden hat es `test112`, und zwar nur
   * im vollen Lauf: einzeln lief die Prüfung durch, weil der Zwischenspeicher
   * dann zufällig dieselbe Reihenfolge hatte.
   *
   * `folge` zählt hoch und wird mitgespeichert. Sie ist der Stichentscheid
   * bei gleichem Zeitstempel — nicht der Hauptschlüssel: die Zeit bleibt,
   * was sie ist, und wird nicht verfälscht, um sie eindeutig zu machen.
   * ----------------------------------------------------------------------*/
  let folgeZaehler = 0;

  const addRow = (collectionId: any, props: Record<string, any> = {}) => {
    const r = {
      id: uid(), type: 'page', text: props.title || '', icon: '',
      props, content: [], parentId: collectionId, parentTable: 'collection',
      created: now(), edited: now(), folge: ++folgeZaehler, alive: true
    };
    cache.blocks[r.id] = r;
    save('blocks', r);
    notify('rows');
    return r;
  };

  const rowsOf = (collectionId: any) => Object.values<any>(cache.blocks)
    .filter(b => b.parentTable === 'collection' && b.parentId === collectionId && b.alive)
    .sort((a, b) =>
      a.created.localeCompare(b.created) ||
      ((a.folge || 0) - (b.folge || 0)) ||
      /* Und wenn beides gleich ist — alte Zeilen ohne `folge` —, dann
         wenigstens IMMER dasselbe. Eine willkürliche, aber feste Reihenfolge
         ist besser als eine, die bei jedem Start anders aussieht. */
      String(a.id).localeCompare(String(b.id)));

  const setProp = (rowId: any, key: any, value: any) => {
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
  /* Nur einmal je Sitzung meckern — wer bei jedem der ~170 setMeta-Aufrufe
     einen Toast bekäme, schaltete die Meldung ab, statt das Problem zu
     lösen. Der erste Fehlschlag ist die Nachricht; die weiteren sind
     derselbe Fehlschlag. */
  let metaFehlerGemeldet = false;

  const setMeta = (k: any, v: any): void => {
    cache.meta[k] = v;
    /* Der leere `.catch(() => {})`, der hier stand, machte aus „liess sich
       nicht speichern" ein „gespeichert". Am härtesten traf das
       `wolkeSalz`: einmal gewürfelt, nie geschrieben — und nach dem
       Neuladen würfelt der Abgleich neu und kann nichts mehr entziffern,
       was mit dem alten Salz hochging.

       WICHTIG: `Reporter.warn`, nicht `Reporter.error` — error ruft die
       Pflege, die Pflege schreibt ihre Fehlerliste per setMeta, und bei
       einem anhaltenden Speicherfehler wäre das eine endlose Schleife. */
    put('meta', { k, v }).catch((err: unknown) => {
      if (typeof Reporter !== 'undefined')
        Reporter.warn('ablage', 'Die Einstellung „' + k + '" liess sich nicht speichern', err);
      if (!metaFehlerGemeldet) {
        metaFehlerGemeldet = true;
        if (typeof UI !== 'undefined' && UI.toast)
          UI.toast('Eine Einstellung liess sich nicht speichern — sie geht beim Neuladen verloren.');
      }
    });
  };
  /* `fallback` ist alles Mögliche — eine leere Liste, 'Ich', `true`. Ohne
     Anmerkung liest TypeScript aus `= null` „immer null" und meldet jeden
     der rund neunzig Aufrufe im Rest der App. */
  const getMeta = (k: any, fallback: any = null): any => (k in cache.meta ? cache.meta[k] : fallback);

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
  const meldeAnAndereFenster = (art: string, schluessel: string | string[]) => {
    if (typeof Nachbarn === 'undefined' || !Nachbarn.offen()) return;
    Nachbarn.sende({ art, schluessel });
  };

  /* Sammelt kurz, statt bei jeder Nachricht einzeln zu lesen: zwanzig
     Tastendrücke drüben sind hier ein Nachlesen, nicht zwanzig. */
  let fremdWartend = new Set<string>();
  let fremdTimer: any = null;

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
          (cache as Record<string, Record<string, any>>)[fach]![id] = satz;
        } else {
          delete (cache as Record<string, Record<string, any>>)[fach]![id];
        }
        if (fach === 'blocks' || fach === 'collections') datenGeaendert();
        geaendert++;
      } catch { /* ein Satz weniger ist kein Grund, die übrigen fallenzulassen */ }
    }
    /* `fremd` und nicht `save`: die Oberfläche soll unterscheiden können,
       ob sie selbst etwas getan hat oder ob es von drüben kam. Beim eigenen
       Tun zeichnet sie ohnehin; hier ist sie ahnungslos und muss es
       erfahren. */
    if (geaendert) notify('fremd');
  };

  const fremdeNachricht = (n: Nachbarnachricht) => {
    if (!n) return;
    if (n.art === 'alles') {
      /* „Alles löschen" oder eine eingespielte Sicherung drüben. Einzelne
         Sätze nachzulesen hilft dann nicht — der ganze Bestand ist ein
         anderer. Die Oberfläche erfährt es und entscheidet selbst. */
      datenGeaendert();
      notify('fremd-alles');
      return;
    }
    ((n.schluessel as string[]) || []).forEach((k: string) => fremdWartend.add(k));
    if (!fremdTimer) fremdTimer = setTimeout(fremdesEintragen, 120);
  };

  /* --- Schreiben mit Verzögerung ----------------------------------------- */
  /* Beim Tippen soll nicht jeder Tastendruck eine Transaktion auslösen.     */
  const pending = new Map();
  let timer: any = null;

  const save = (store: any, val: any) => {
    if (store === 'blocks' || store === 'collections') datenGeaendert();
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
  const flush = (): Promise<unknown> => {
    if (!db) { pending.clear(); return Promise.resolve(); }
    const schluessel = [...pending.keys()];
    const posten = [...pending.values()];
    pending.clear();
    if (!posten.length) return Promise.resolve();

    /* Ein Satz, der nicht ankam, kommt zurück in den Stapel — der nächste
       flush versucht es wieder. Aber nur, wenn dort nicht längst ein
       NEUERER Stand desselben Satzes wartet; der ältere darf ihn nie
       überschreiben. Der Schlüssel ist derselbe wie in `save`. */
    const zurueckInDenStapel = (welche: { store: any; val: any }[]): void => {
      welche.forEach(x => {
        const k = x.store + ':' + x.val.id;
        if (!pending.has(k)) pending.set(k, x);
      });
    };

    let fertig: Promise<unknown>;
    try {
      const faecher = [...new Set(posten.map(x => x.store))];
      const t = tx(faecher, 'readwrite');
      const gescheitert: { store: any; val: any }[] = [];
      posten.forEach((eintrag) => {
        const { store, val } = eintrag;
        try {
          const r = t.objectStore(store).put(val);
          r.onerror = (e: any) => {
            e.preventDefault();          /* nicht den ganzen Stapel abbrechen */
            gescheitert.push(eintrag);
            if (typeof Reporter !== 'undefined')
              Reporter.warn('ablage', 'Ein Satz liess sich nicht schreiben', { store, id: val.id });
          };
        } catch (err) {
          gescheitert.push(eintrag);
          if (typeof Reporter !== 'undefined')
            Reporter.warn('ablage', 'Ein Satz liess sich nicht schreiben', { store, id: val.id, err });
        }
      });
      /* `oncomplete` heisst: auf der Platte. `onerror` und `onabort`
         zeigten hier jahrelang auf DASSELBE `ok` — ein flush nach vollem
         Speicher „gelang", und die Meldung unten ging trotzdem hinaus.
         Jetzt: ein Abbruch rollt alles zurück (so arbeitet eine
         Transaktion), also wandert alles zurück in den Stapel, und der
         Aufrufer bekommt ein Nein. Einzelne gescheiterte Sätze in einer
         sonst gelungenen Transaktion sind auch ein Nein — eines, das die
         Zahl nennt. */
      fertig = new Promise((ok, nein) => {
        t.oncomplete = () => {
          if (!gescheitert.length) return ok(undefined);
          zurueckInDenStapel(gescheitert);
          nein(new Error(gescheitert.length + ' von ' + posten.length +
                         ' Sätzen liessen sich nicht schreiben'));
        };
        t.onerror = t.onabort = () => {
          zurueckInDenStapel(posten);
          nein((t as any).error ||
               new Error('Das Schreiben wurde abgebrochen — nichts davon ist auf der Platte'));
        };
      });
    } catch (err) {
      /* Geht die Sammeltransaktion gar nicht auf, lieber einzeln als nicht:
         ein langsamer Weg ist besser als ein verlorener Stapel. */
      fertig = Promise.all(posten.map((eintrag) =>
        put(eintrag.store, eintrag.val).then(() => undefined,
          () => { zurueckInDenStapel([eintrag]); return 'kaputt'; })
      )).then(ergebnisse => {
        const kaputt = ergebnisse.filter(x => x === 'kaputt').length;
        if (kaputt) throw new Error(kaputt + ' von ' + posten.length +
                                    ' Sätzen liessen sich nicht schreiben');
        return undefined;
      });
    }

    /* Und die anderen Fenster wissen es jetzt auch. Siehe `nachbarn.js`:
       ohne diese Zeile hält jedes Fenster seinen eigenen Stand für die
       Wahrheit und schreibt ihn beim nächsten Anlass über den fremden.
       ERST WENN ES WIRKLICH AUF DER PLATTE STEHT. Der erste Wurf meldete
       sofort — das Fenster drüben las nach, fand noch nichts und schloss
       daraus, der Satz sei gelöscht. Eine Meldung über eine Änderung, die es
       noch nicht gibt, ist schlimmer als gar keine. Seit E77 gilt der Satz
       auch im Fehlerfall: nach einem Abbruch geht KEINE Meldung hinaus —
       drüben gäbe es nichts zu lesen. (Der leere zweite Ast hält nur die
       abgeleitete Kette still; die Ablehnung selbst bekommt der Aufrufer.) */
    fertig.then(() => meldeAnAndereFenster('geaendert', schluessel), () => {});
    return fertig;
  };

  /* Vor dem Schließen des Tabs alles rausschreiben. Die Ablehnung ist hier
     nicht mehr zu gebrauchen — das Fenster schliesst; gemeldet hat flush
     selbst schon über den Reporter. */
  window.addEventListener('beforeunload', () => { flush().catch(() => {}); });
  window.addEventListener('visibilitychange', () => { if (document.hidden) flush().catch(() => {}); });

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
  const search = (q: any, filter: Record<string, any> = {}) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out: any[] = [];

    /* Suche nach Seiten-ID — Notions Verwaltungssuche. Es zählt sowohl die
       lange Form 8-4-4-4-12 als auch die Kurzform ohne Bindestriche, und
       auch eine ganze Seitenadresse, aus der die ID herausgeschnitten wird. */
    const stueck = needle.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{6,12}/) ||
                   (/^[0-9a-f-]+$/.test(needle) ? [needle] : null);
    const ohne = stueck ? stueck[0].replace(/-/g, '') : '';
    if (ohne.length >= 12) {
      const treffer = Object.values<any>(cache.blocks).filter(b =>
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
    const grenze = ({ tag: 1, woche: 7, monat: 30 } as Record<string, number>)[filter.seit];
    const seitDatum = grenze ? Date.now() - grenze * 86400000 : 0;

    /* Wenn der Such-Cache eine sichere Wort-Schnittmenge kennt, werden nur
       diese Seiten am echten Bestand geprüft. Die Prüfung selbst bleibt
       unverändert — der Cache liefert Kandidaten, niemals die Wahrheit. Bei
       kurzen Wörtern oder uneindeutigen Teilstrings gibt er `null` zurück,
       und dieser Weg scannt wie früher vollständig. */
    let zuPruefen = Object.values<any>(cache.blocks);
    try {
      if (typeof Kontext !== 'undefined' && Kontext.kandidaten) {
        const ids = Kontext.kandidaten(needle);
        if (Array.isArray(ids)) zuPruefen = ids.map((id: string) => cache.blocks[id]).filter(Boolean);
      }
    } catch { /* Ein kaputter Beschleuniger darf die echte Suche nie verhindern. */ }

    zuPruefen.forEach(b => {
      if (!b.alive) return;
      if (b.type !== 'page' || b.parentTable === 'collection') return;

      if (seitDatum && new Date(b.edited || b.created).getTime() < seitDatum) return;
      if (filter.ort && !pathOf(b.id).some(x => x.id === filter.ort)) return;

      const hatDb = (b.content || []).some((id: any) => cache.blocks[id]?.type === 'database');
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
  const seiteVon = (b: any) => {
    let cur = b, n = 0;
    while (cur && n++ < 40) {
      if (cur.type === 'page') return cur;
      cur = cur.parentId ? cache.blocks[cur.parentId] : null;
    }
    return b;
  };

  /** Der Pfad als Text, ohne die Seite selbst — für die Trefferliste. */
  const pfadText = (id: string) => pathOf(id).slice(0, -1)
    .map(p => p.text || 'Ohne Titel').join(' / ');

  const findInside = (pageId: any, needle: any, tiefe: number): any => {
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
  let exportVersionen: any[] = [];
  let exportDateien = 0;
  const zaehlerDateien = () => exportDateien;

  /** Vor dem Sichern aufrufen: holt, was nicht im Zwischenspeicher liegt. */
  const exportVorbereiten = async () => {
    /* KEIN `.catch(() => [])` MEHR. Es stand hier, war aber toter Code —
       `all` konnte nicht ablehnen. Jetzt kann es, und dann darf die
       Sicherung NICHT weiterlaufen: eine Zahl von null Anhängen schreibt
       sich als „Vollständig: dieser Bestand hat keine Dateianhänge" ins
       Manifest, und das wäre die gefährlichste Sorte Sicherung — eine, die
       behauptet, vollständig zu sein.
       Wer sichert, bekommt lieber einen Fehler als eine stille Lücke. */
    exportVersionen = await all('versions');
    exportDateien = (await all('dateien')).length;
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
  const importAll = async (json: any, art: string) => {
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

    /* --- ALLES IN EINER TRANSAKTION -----------------------------------
       Löschen und Schreiben liefen hier als hunderte einzelne
       Transaktionen. E71 hat den Abbruch VOR dem ersten Anfassen sauber
       gemacht — aber wer zwischen Löschen und Schreiben den Rechner
       verlor (Tab zu, Strom weg, Quota voll), behielt einen halben
       Bestand: die eine Hälfte gelöscht, die andere noch nicht da.

       Eine IndexedDB-Transaktion ist ganz oder gar nicht. Also passiert
       das ganze Einspielen — Löschen, Schreiben, der Verlauf — in EINER
       Transaktion über die fünf Fächer. Bricht irgendetwas ab, rollt der
       Browser ALLES zurück, und der Zwischenspeicher wird erst nach dem
       `oncomplete` umgestellt: der Speicher lügt dem Bildschirm nie
       einen Stand vor, der nicht auf der Platte steht. */
    if (db) {
      await new Promise<void>((ok, nein) => {
        let t: IDBTransaction;
        try { t = tx(['blocks', 'collections', 'views', 'meta', 'versions', 'suchindex'], 'readwrite'); }
        catch (err) { return nein(err); }
        t.oncomplete = () => ok();
        t.onerror = t.onabort = () =>
          nein((t as any).error || new Error('Das Einspielen wurde abgebrochen'));

        const schreiben = (): void => {
          try {
            for (const b of Object.values<any>(neu.blocks))      t.objectStore('blocks').put(b);
            for (const c of Object.values<any>(neu.collections)) t.objectStore('collections').put(c);
            for (const v of Object.values<any>(neu.views))       t.objectStore('views').put(v);
            for (const [k, v] of Object.entries<any>(neu.meta))  t.objectStore('meta').put({ k, v });
            if (Array.isArray(d.versions))
              for (const v of d.versions) t.objectStore('versions').put(v);
          } catch (err) { try { t.abort(); } catch { /* schon abgebrochen */ } nein(err); }
        };

        if (art === 'ersetzen') {
          /* Ein Index aus dem alten Bestand ist nach dem Ersetzen wertlos.
             Er gehört nicht zur Sicherung und wird in derselben Alles-oder-
             nichts-Transaktion verworfen. */
          t.objectStore('suchindex').clear();
          /* Was in der Ablage steht und nicht in der Sicherung, muss weg —
             sonst ist es kein Ersetzen, sondern ein Zusammenführen, das
             sich als Ersetzen ausgibt. Die Schlüssel werden IN derselben
             Transaktion gelesen: was sie sieht, ist auch das, was sie
             löscht. */
          const faecher: [string, Record<string, any>][] =
            [['blocks', neu.blocks], ['collections', neu.collections], ['views', neu.views]];
          let offen = faecher.length + 1;
          const dann = () => { if (--offen === 0) schreiben(); };
          /* Jede Leseanfrage bekommt ihr EIGENES onerror, das die
             Transaktion abbricht. Ein echter Fehler würde auch ohne das
             zur Transaktion hochsteigen — aber „würde" ist keine
             Zusicherung, und ein Fach, das nie antwortet, liesse die
             Transaktion sonst LEER durchgehen: nichts geschrieben,
             nichts gelöscht, und oncomplete meldete Erfolg. */
          const lesen = (fach: string, weiter: (keys: IDBValidKey[]) => void): void => {
            const r = t.objectStore(fach).getAllKeys();
            r.onsuccess = () => weiter(r.result);
            r.onerror = () => {
              try { t.abort(); } catch { /* schon abgebrochen */ }
              nein(r.error || new Error('Fach „' + fach + '" nicht lesbar'));
            };
          };
          for (const [fach, behalten] of faecher)
            lesen(fach, (keys) => {
              for (const k of keys) if (!behalten[String(k)]) t.objectStore(fach).delete(k);
              dann();
            });
          lesen('meta', (keys) => {
            for (const k of keys) if (!(String(k) in neu.meta)) t.objectStore('meta').delete(k);
            dann();
          });
        } else {
          schreiben();
        }
      }).catch((err: unknown) => {
        if (typeof Reporter !== 'undefined')
          Reporter.error('Ablage', 'Einspielen abgebrochen — alles zurückgerollt', err);
        throw new Error('Die Sicherung wurde NICHT eingespielt: ' +
          (err instanceof Error ? err.message : String(err)) + '. ' +
          'Es ist nichts verändert worden — die Transaktion hat alles ' +
          'zurückgerollt. Schliesse andere Fenster dieser App und versuche ' +
          'es noch einmal.');
      });
    }

    /* Erst JETZT, nach dem oncomplete, den Zwischenspeicher umstellen. */
    if (art === 'ersetzen') {
      cache.blocks = neu.blocks; cache.collections = neu.collections;
      cache.views = neu.views;   cache.meta = neu.meta;
      cache.suchindex = {};
    } else {
      /* Zusammenführen: nichts wegwerfen, die Sicherung sticht bei gleicher
         Kennung. */
      Object.assign(cache.blocks, neu.blocks);
      Object.assign(cache.collections, neu.collections);
      Object.assign(cache.views, neu.views);
      Object.assign(cache.meta, neu.meta);
    }

    datenGeaendert();
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
  const baum = (id: string) => {
    const raus = (bid: any, tiefe: number) => {
      const x = cache.blocks[bid];
      if (!x || tiefe > 40) return null;
      const k = JSON.parse(JSON.stringify(x));
      delete k.content;
      k.kinder = (x.content || []).map((c: any) => raus(c, tiefe + 1)).filter(Boolean);
      if (x.collectionId && cache.collections[x.collectionId]) {
        const c = cache.collections[x.collectionId];
        k.collection = JSON.parse(JSON.stringify(c));
        k.views = (c.viewIds || []).map((v: any) => cache.views[v]).filter(Boolean)
          .map((v: any) => JSON.parse(JSON.stringify(v)));
        k.rows = rowsOf(c.id).map(r => JSON.parse(JSON.stringify(r)));
      }
      return k;
    };
    return raus(id, 0);
  };

  /** Setzt so ein Datenpaket wieder ein — immer mit frischen IDs. */
  const baumEinfuegen = (knoten: any, parentId: any, index = -1) => {
    if (!knoten) return null;

    const rein = (k: any, eltern: any, idx: any) => {
      const patch = Object.assign({}, k);
      delete patch.id; delete patch.kinder; delete patch.collection;
      delete patch.views; delete patch.rows; delete patch.content;
      patch.content = [];

      /* Datenbank: Sammlung, Ansichten und Zeilen mitkopieren */
      if (k.collection) {
        const neueColl = uid();
        const idKarte: Record<string, string> = {};
        const views = (k.views || []).map((v: any) => {
          const nv = JSON.parse(JSON.stringify(v));
          idKarte[v.id] = nv.id = uid();
          nv.collectionId = neueColl;
          cache.views[nv.id] = nv;
          save('views', nv);
          return nv;
        });
        const nc = JSON.parse(JSON.stringify(k.collection));
        nc.id = neueColl;
        nc.viewIds = views.map((v: any) => v.id);
        cache.collections[neueColl] = nc;
        save('collections', nc);
        patch.collectionId = neueColl;

        (k.rows || []).forEach((r: any) => {
          const nr = JSON.parse(JSON.stringify(r));
          nr.id = uid();
          nr.parentId = neueColl;
          nr.parentTable = 'collection';
          cache.blocks[nr.id] = nr;
          save('blocks', nr);
        });
      }

      const neu = addBlock(eltern, k.type || 'text', patch, idx);
      (k.kinder || []).forEach((kind: any) => rein(kind, neu.id, -1));
      return neu;
    };

    const wurzel = rein(knoten, parentId, index);
    notify('pages');
    return wurzel;
  };

  /** Entfernt alle Kindblöcke einer Seite (für Wiederherstellen und Sperren). */
  const kinderLeeren = (pageId: any) => {
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
  const fassungenAusduennen = (liste: any,
                               grenzen: { frisch?: number; tage?: number; max?: number } = {}) => {
    const K = ((typeof KONSTANTEN !== 'undefined') ? KONSTANTEN : {}) as Record<string, number>;
    const frisch = grenzen.frisch ?? K.FASSUNGEN_FRISCH ?? 12;
    const tage   = grenzen.tage   ?? K.FASSUNGEN_TAGE   ?? 30;
    const max    = grenzen.max    ?? K.VERSIONEN_MAX    ?? 200;

    const sortiert = [...(liste || [])]
      .filter(v => v && v.id)
      .sort((a, b) => String(b.zeit || '').localeCompare(String(a.zeit || '')));

    const weg = new Set();
    const gesehen = new Set();
    const jetzt = sortiert.length ? new Date(sortiert[0].zeit).getTime() : Date.now();
    const vonHand = (v: any) => v.anlass && v.anlass !== 'automatisch';

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

  const versionSpeichern = async (pageId: any, anlass = 'automatisch') => {
    const p = cache.blocks[pageId];
    if (!p) return null;
    const v = {
      id: uid(), pageId, zeit: now(), anlass,
      titel: p.text || 'Ohne Titel',
      icon: p.icon || '📄',
      daten: baum(pageId)
    };
    await put('versions', v);
    /* Das Ausdünnen darf den Aufruf nicht scheitern lassen. Die Fassung IST
       gespeichert; misslingt nur das Wegräumen der alten, hat der Nutzer
       mehr Verlauf als geplant — das ist kein Schaden. Ihn dafür einen
       Fehler sehen zu lassen (oder, schlimmer, eine unbehandelte Ablehnung
       zu erzeugen: `werkzeuge.ts:854` ruft ohne `await`), wäre einer. */
    try {
      for (const id of fassungenAusduennen(await versionen(pageId))) await del('versions', id);
    } catch (err) {
      if (typeof Reporter !== 'undefined')
        Reporter.warn('ablage', 'Alte Fassungen liessen sich nicht ausdünnen — ' +
          'der Verlauf wächst weiter', err);
    }
    return v;
  };

  /**
   * Die Fassungen einer Seite, jüngste zuerst.
   *
   * Die leere Liste hat hier ZWEI Bedeutungen, und nur eine davon ist
   * harmlos. „Es gibt keine Fassungen" ist eine Auskunft; „ich konnte nicht
   * nachsehen" ist ein Fehler. Bis eben sahen beide gleich aus — der
   * Verlauf zeigte „0", der Mensch schloss daraus, dass es nichts
   * wiederherzustellen gibt, und überschrieb die Seite guten Gewissens.
   *
   * Deshalb: fehlt das Fach, ist die leere Liste richtig (eine junge Ablage
   * hat es noch nicht). Ist es da und antwortet nicht, wird abgelehnt.
   */
  const versionen = (pageId: any) => new Promise<any[]>((ok, fail) => {
    if (!db || !db.objectStoreNames.contains('versions')) return ok([]);
    try {
      const r = tx(['versions'], 'readonly').objectStore('versions').index('page').getAll(pageId);
      r.onsuccess = () => ok((r.result || []).sort((a: any, b: any) => b.zeit.localeCompare(a.zeit)));
      r.onerror = () => fail(r.error || new Error('Der Versionsverlauf ist nicht lesbar'));
    } catch (err) { fail(err); }
  });

  const versionLoeschen = (id: string) => del('versions', id);

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
    /* Ein misslungenes Leeren durfte hier bis eben schweigen. Das ist die
       gefährlichste Stelle dafür, die es gibt: wer „alles löschen" drückt,
       gibt danach womöglich den Rechner weiter. Bleibt ein Fach stehen und
       niemand sagt es, glaubt er, seine Daten seien fort — und sie sind es
       nicht. Deshalb wird gezählt, was nicht ging, und es wird genannt. */
    const geblieben: string[] = [];
    if (db) await Promise.all([...db.objectStoreNames].map((s: string) => new Promise<void>(ok => {
      try {
        const r = tx([s], 'readwrite').objectStore(s).clear();
        r.onsuccess = () => ok();
        r.onerror   = () => { geblieben.push(s); ok(); };
      } catch { geblieben.push(s); ok(); }
    })));
    cache.blocks = {}; cache.collections = {}; cache.views = {}; cache.meta = {};
    cache.suchindex = {};
    datenGeaendert();
    meldeAnAndereFenster('alles', []);
    if (geblieben.length) {
      const text = 'Nicht alles liess sich löschen. Diese Fächer sind noch da: ' +
                   geblieben.join(', ') + '. Der Speicher des Browsers muss von Hand geleert werden.';
      if (typeof Reporter !== 'undefined') Reporter.error('ablage', text);
      throw new Error(text);
    }
  };

  /* ========================================================================
   * DATEIEN IN STÜCKEN
   * ------------------------------------------------------------------------
   * Der rohe Zugang zur Ablage. Was daraus gemacht wird — hochladen in
   * Schritten, wieder zusammensetzen, aufräumen — steht in dateien.js.
   * Hier steht nur, wie ein Stück hinein- und wieder herauskommt.
   * ======================================================================*/
  const dateiPut   = (satz: any) => put('dateien', satz);
  const dateiHolen = (id: string)   => get('dateien', id);
  const dateiWeg   = (id: string)   => del('dateien', id);
  const dateiAlle  = ()     => all('dateien');

  /* --- Der letzte gemeinsame Stand (für den Abgleich) -------------------- */

  /** Merken, wie ein Satz aussah, als beide Seiten ihn zuletzt gleich sahen. */
  const basisPut = (id: string, satz: any) => put('basis', { id, satz: JSON.stringify(satz), wann: now() });

  /** Den gemerkten Stand holen — oder null, wenn es keinen gibt. */
  const basisHolen = async (id: string) => {
    const e = await get('basis', id);
    if (!e) return null;
    try { return JSON.parse(e.satz); } catch { return null; }
  };

  const basisWeg  = (id: string) => del('basis', id);
  const basisAlle = ()   => all('basis');

  /** Alles vergessen — nach einem Abmelden oder Bereichswechsel. */
  const basisLeeren = () => new Promise<void>((ok2) => {
    if (!db || !db.objectStoreNames.contains('basis')) return ok2();
    try {
      const r = tx(['basis'], 'readwrite').objectStore('basis').clear();
      r.onsuccess = () => ok2(); r.onerror = () => ok2();
    } catch { ok2(); }
  });

  /* --- Vorberechnete Werte ---------------------------------------------- */
  const vorratPut    = (id: string, satz: any) => put('vorrat', Object.assign({ id }, satz));
  const vorratHolen  = (id: string) => get('vorrat', id);
  const vorratWeg    = (id: string) => del('vorrat', id);
  const vorratAlle   = ()   => all('vorrat');

  /* --- Persistenter Suchindex ------------------------------------------- */
  /**
   * Schreibt nur den Such-Cache. Diese Wege berühren absichtlich weder
   * `blocks` noch `collections`: selbst ein Abbruch kann darum niemals
   * Nutzerdaten beschädigen. Der Speicherabzug wird erst nach `oncomplete`
   * umgestellt; beim Neuladen sieht man entweder den alten oder den neuen
   * Cache, nie einen behaupteten Zwischenstand.
   */
  const suchindexAendern = (setzen: any[] = [], loeschen: string[] = []) =>
    new Promise<void>((ok2, fail2) => {
      const anwenden = () => {
        loeschen.forEach(id => { delete cache.suchindex[id]; });
        setzen.forEach(e => { if (e && typeof e.id === 'string') cache.suchindex[e.id] = e; });
      };
      if (!db || !db.objectStoreNames.contains('suchindex')) { anwenden(); ok2(); return; }
      try {
        const t = tx(['suchindex'], 'readwrite');
        const s = t.objectStore('suchindex');
        loeschen.forEach(id => s.delete(id));
        setzen.forEach(e => s.put(e));
        t.oncomplete = () => { anwenden(); ok2(); };
        t.onerror = t.onabort = () =>
          fail2((t as any).error || new Error('Der Suchindex liess sich nicht speichern'));
      } catch (err) { fail2(err); }
    });

  const suchindexErsetzen = (eintraege: any[]) =>
    new Promise<void>((ok2, fail2) => {
      const neu: Verzeichnis = {};
      eintraege.forEach(e => { if (e && typeof e.id === 'string') neu[e.id] = e; });
      if (!db || !db.objectStoreNames.contains('suchindex')) {
        cache.suchindex = neu; ok2(); return;
      }
      try {
        const t = tx(['suchindex'], 'readwrite');
        const s = t.objectStore('suchindex');
        s.clear();
        Object.values(neu).forEach(e => s.put(e));
        t.oncomplete = () => { cache.suchindex = neu; ok2(); };
        t.onerror = t.onabort = () =>
          fail2((t as any).error || new Error('Der Suchindex liess sich nicht ersetzen'));
      } catch (err) { fail2(err); }
    });

  const suchindexLeeren = () => suchindexErsetzen([]);

  const stueckPut   = (satz: any) => put('stuecke', satz);
  const stueckHolen = (id: string)   => get('stuecke', id);
  const stueckWeg   = (id: string)   => del('stuecke', id);

  /**
   * Ein Fehler beim Lesen der Stücke braucht zwei Gesichter: einen kurzen
   * Satz für den Menschen und die technische Ursache für den Fehlerbericht.
   * Dateiname und Inhalt gehören ausdrücklich nicht in den Bericht.
   */
  const chunkReadError = (dateiId: unknown, cause: unknown): Error => {
    const error = new Error(
      'Die Dateistücke konnten nicht aus dem Speicher gelesen werden. ' +
      'Der Vorgang wurde abgebrochen.'
    ) as Error & { code: string; cause: unknown };
    error.code = 'DATEISTUECKE_NICHT_LESBAR';
    error.cause = cause;
    if (typeof Reporter !== 'undefined') {
      Reporter.error('ablage', 'Dateistücke konnten nicht gelesen werden', {
        fileId: String(dateiId ?? ''), cause
      });
    }
    return error;
  };
  /** Alle Stücke einer Datei, in der richtigen Reihenfolge. */
  const stueckeVon = (dateiId: any) => new Promise<any[]>((ok2, fail2) => {
    if (!db || !db.objectStoreNames.contains('stuecke')) return ok2([]);
    try {
      const r = tx(['stuecke'], 'readonly').objectStore('stuecke')
        .index('datei').getAll(dateiId);
      r.onsuccess = () => ok2((r.result || []).sort((a: any, b: any) => a.nr - b.nr));
      r.onerror   = () => fail2(chunkReadError(dateiId,
        r.error || new Error('Die IndexedDB-Anfrage ist fehlgeschlagen')));
    } catch (err) { fail2(chunkReadError(dateiId, err)); }
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
    suchindexAendern, suchindexErsetzen, suchindexLeeren,
    stueckPut, stueckHolen, stueckWeg, stueckeVon,
    speichertNicht: () => nurSpeicher,
    warnungText: () => warnung,
    beiWarnung: (fn: any) => { warner.add(fn); if (warnung) fn(warnung); },
    datenFassung: () => datenFassung,
    on: (fn: any) => listeners.add(fn)
  };
})();
