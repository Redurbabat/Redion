/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ablage/indexdb.ts (npm run bauen:ts). */
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
  /* DER VORFÜHRMODUS (L31, E177).
     `index.html?demo` öffnet eine EIGENE Ablage. Wer Redion vorführen oder
     ausprobieren will, soll das können, ohne dass danach fremde
     Beispielseiten in seinen eigenen Notizen stehen — und vor allem, ohne
     dass sein Bestand dabei überhaupt angefasst wird.

     EIN ANDERER NAME, KEIN SCHALTER IM CODE. Zwei Namen sind zwei
     Datenbanken, und die Trennung setzt der Browser durch. Ein Schalter,
     der an dreissig Stellen abgefragt wird, ist an der einunddreissigsten
     vergessen — und dann steht die Vorführung in den echten Daten (§46). */
  const DEMO = typeof location !== 'undefined' &&
               /(^|[?&])demo(=|&|$)/.test(location.search || '');
  const NAME = ((typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.ABLAGE_NAME : 'notizen') +
               (DEMO ? '-demo' : '');
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
      /* Version 7: Aufträge für lange Hintergrundarbeit (E286).
         Der Auftrag wird VOR der Arbeit geschrieben; nach einem Neustart
         weiss die App dadurch, was offenstand. Zwei Indizes, weil die
         Maschine genau zwei Fragen stellt: „was ist offen?" (Zustand) und
         „was ist von dieser Art?" (Art). Ohne sie liefe jeder Takt über
         alle Aufträge, auch über die längst fertigen. */
      if (!d.objectStoreNames.contains('auftraege')) {
        const au = d.createObjectStore('auftraege', { keyPath: 'id' });
        au.createIndex('zustand', 'zustand');
        au.createIndex('art', 'art');
      }
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

    /* Und einmal die Dateinamen — aus demselben Grund getrennt gekapselt:
       ohne sie sucht es sich schlechter, aber der Bestand steht. */
    try {
      (await all('dateien')).forEach(dateiNameMerken);
    } catch (err) {
      dateiNamen.clear();
      if (typeof Reporter !== 'undefined')
        Reporter.warn('Suche', 'Die Dateinamen waren nicht lesbar; die Suche findet sie diesmal nicht', err);
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
    /* WANN ETWAS FERTIG WURDE, GEHÖRT NEBEN „IST ES FERTIG" (E663).
       Die Wochenrückschau rechnet mit `erledigtAm` (`planen/dienst.ts:235`),
       und niemand hat es je geschrieben: das Kästchen im Editor setzte nur
       `checked`. Wer eine Woche lang Aufgaben abhakte, sah am Sonntag eine
       leere Rückschau und ein Tagesdiagramm aus Nullen — kein Fehler, keine
       Meldung, immer null.

       DIE REGEL STEHT HIER UND NICHT AM KÄSTCHEN, weil `checked` an SECHS
       Stellen geschrieben wird: Kästchen, Tastenkürzel, Markdown-Kürzel,
       die Befehlspalette, die Schnittstelle und der PWA-Weg. Sechs Kopien
       derselben Zeile wären fünf Gelegenheiten, sie zu vergessen (§8).
       Hier geht jeder dieser Wege durch.

       Und der Haken zurück nimmt das Datum mit: eine wieder geöffnete
       Aufgabe ist nicht erledigt. */
    if (patch && 'checked' in patch && b.type === 'todo')
      patch = Object.assign({}, patch,
        { erledigtAm: patch.checked ? now() : null });
    Object.assign(b, patch, { edited: now(), geaendertVon: getMeta('nutzer', '') || 'Ich' });
    save('blocks', b);
    return b;
  };

  /**
   * Ein Feld ganz entfernen — nicht auf `undefined` setzen.
   *
   * WARUM ES DAS BRAUCHT (E691). `updateBlock(id, { feld: undefined })` geht
   * durch `Object.assign` und lässt den SCHLÜSSEL stehen, nur mit dem Wert
   * `undefined`. Für IndexedDB ist das ein Feld; für `'feld' in block` ist
   * es eines; nur für `JSON.stringify` ist es keines. Und genau darauf ruht
   * §9: „kein Feld heisst wie bisher". Ein Block, der ein `flaecheOrt` mit
   * `undefined` trägt, sagt etwas anderes als einer, der keines hat — und
   * der Unterschied fällt erst auf, wenn eine Sicherung ihn verliert und
   * das Neuladen sich anders verhält als das Fenster davor.
   *
   * @param felder Namen der Felder. Fehlende werden still übergangen.
   */
  const feldWeg = (id: string, ...felder: string[]) => {
    const b = cache.blocks[id];
    if (!b) return null;
    let etwas = false;
    for (const f of felder) if (f in b) { delete b[f]; etwas = true; }
    if (!etwas) return b;
    Object.assign(b, { edited: now(), geaendertVon: getMeta('nutzer', '') || 'Ich' });
    save('blocks', b);
    return b;
  };

  /** Verschiebt einen Block in den Papierkorb — wie in Notion erst 'alive: false'. */
  const trashBlock = (id: string) => {
    const b = cache.blocks[id];
    if (!b) return;
    b.alive = false;
    b.trashedAt = now();
    /* Der Papierkorb ist eine ÄNDERUNG (E250/L73): zuSchicken filtert
       nach `edited`, und ein Block, dessen letzte Bearbeitung vor der
       Hoch-Marke lag, trüge sein alive:false sonst nie zum Server —
       drüben lebte er weiter. Dieselbe Lehre wie der Zeitstempel an
       Sammlung und Ansicht weiter unten. */
    b.edited = now();
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
    /* Die Gegenrichtung braucht den Stempel genauso: ein Wiederherstellen
       ohne `edited` käme drüben nie an — der Block bliebe dort im
       Papierkorb und fiele nach der Frist ins endgültige Löschen. */
    b.edited = now();
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
    const anhaenge: Record<string, string[]> = {};
    purgeTief(id, gesammelt, geloescht, anhaenge);
    if (!gesammelt.length) return;
    datenGeaendert();
    notify('purge');
    abloesen((async () => {
      /* Ein Löschen läuft nicht über `save()` und damit nicht über `flush()` —
         es muss den anderen Fenstern eigens gesagt werden, sonst zeigten sie
         eine Seite weiter an, die es nicht mehr gibt, und schrieben sie beim
         nächsten Anlass zurück.

         Und zwar erst, wenn die Ablage es wirklich getan hat: meldete man
         vorher, läse das Fenster drüben den Satz noch einmal ein und
         behielte ihn. */
      await Promise.all(geloescht);
      meldeAnAndereFenster('geaendert', gesammelt.map(x => 'blocks:' + x));
      /* EINMAL für den ganzen Vorgang, nicht je Block. Bei einer Seite mit
         fünfhundert Blöcken wäre das fünfhundertmal ein Durchgang durch alle
         Blöcke — dieselbe Falle, die weiter oben schon den `Promise.all`
         gekostet hat. */
      const anspruch = dateiAnspruch();
      for (const x of gesammelt)
        await purgeAnhaenge(x, { dateien: anhaenge[x] || [], anspruch });
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
    }));
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
  /**
   * Welche Dateien ein Block zeigt.
   *
   * Drei Felder, historisch gewachsen: `dateiId` bei Bild-, Datei- und
   * Videoblöcken, `datei` als ältere Form desselben, `bildDateiId` bei der
   * gerasterten PDF-Seite (E103).
   */
  const dateienAmBlock = (b: any): string[] =>
    [b && b.dateiId, b && b.datei, b && b.bildDateiId]
      .filter(Boolean).map((x: any) => String(x));

  /**
   * Wer eine Datei noch braucht — Dateikennung auf den Block, der sie zeigt.
   *
   * DAS IST DIE FRAGE, DIE VOR E171 NIEMAND GESTELLT HAT. Ein Duplikat trägt
   * dieselbe `dateiId` wie das Original: `baum` nimmt den ganzen Satz mit,
   * `baumEinfuegen` legt ihn so wieder hin. Wird danach das Original
   * endgültig gelöscht, ging die Datei mit — und das Duplikat zeigte auf
   * nichts. Gemessen, nicht vermutet.
   *
   * `nurLebende` trennt zwei Fragen, die verschieden zu beantworten sind:
   *
   *   false   Darf ich sie ENDGÜLTIG löschen? Dann zählt auch ein Block im
   *           Papierkorb — der ist umkehrbar, das Löschen nicht (§46).
   *   true    Ist sie herrenlos? Dann zählt nur, wer sie heute zeigt. Sonst
   *           räumte die Pflegeseite nie wieder etwas weg.
   */
  const dateiAnspruch = (nurLebende = false): Map<string, string> => {
    const raus = new Map<string, string>();
    for (const b of Object.values<any>(cache.blocks)) {
      if (!b) continue;
      if (nurLebende && b.alive === false) continue;
      for (const datei of dateienAmBlock(b))
        if (!raus.has(datei)) raus.set(datei, b.id);
    }
    return raus;
  };

  /* Zu welcher Seite gehört dieser Block? Dieselbe Wanderung, die die
     Abgleichmaschine für `zuSchicken` macht — hier noch einmal, weil sie
     IM PURGE-MOMENT laufen muss: nach `purgeTief` ist die Elternkette aus
     dem Zwischenspeicher, und die Maschine fände nichts mehr (E254). */
  const seiteVonHier = (b: any): string => {
    let cur = b, tiefe = 0;
    while (cur && tiefe++ < 40) {
      if (cur.type === 'page' && cur.parentTable !== 'collection') return cur.id;
      if (!cur.parentId) return cur.id;
      const eltern = cache.blocks[cur.parentId];
      if (!eltern) return cur.id;
      cur = eltern;
    }
    return b.id;
  };

  const purgeTief = (id: string, gesammelt: any[], geloescht: Promise<void>[] = [],
                     anhaenge: Record<string, string[]> = {}) => {
    const b = cache.blocks[id];
    if (!b) return;
    gesammelt.push(id);
    /* GRABSTEIN VOR DEM LÖSCHEN (E254/L73 Teil 2). `zuSchicken` läuft nur
       über den Zwischenspeicher — ein hier entfernter Satz erreicht den
       Server nie, drüben lebt er weiter. Also merkt sich der Purge das
       versandfertige Stück, solange Satz und Elternkette noch stehen; die
       Abgleichmaschine schickt es beim nächsten Takt als geloescht. */
    blockGrabstein('blocks', b, seiteVonHier(b));
    /* JETZT merken, nicht später. Nach dieser Funktion ist der Block aus dem
       Zwischenspeicher, und `purgeAnhaenge` fand seine Datei nie wieder —
       genau das war L43. */
    const eigene = dateienAmBlock(b);
    if (eigene.length) anhaenge[id] = eigene;
    vergissAusstehendes('blocks', id);
    [...(b.content || [])].forEach(k => purgeTief(k, gesammelt, geloescht, anhaenge));
    /* Eine verknüpfte Ansicht zeigt fremde Daten — die bleiben bestehen. */
    if (b.collectionId && !b.verknuepft) {
      const c = cache.collections[b.collectionId];
      if (c) {
        /* Auch eine Zeile kann Fassungen und Anhänge haben — sie ist eine
           Seite. Sie hier zu vergessen wäre derselbe Fehler eine Ebene
           tiefer, und die Ebene sieht niemand. */
        rowsOf(b.collectionId).forEach(r => {
          gesammelt.push(r.id); vergissAusstehendes('blocks', r.id);
          const ihre = dateienAmBlock(r);
          if (ihre.length) anhaenge[r.id] = ihre;
          /* Eine Zeile ist eine Seite — auch ihr Ende muss drüben ankommen.
             `seiteVonHier` liefert für Zeilen die eigene Kennung, exakt wie
             `zuSchicken` es im Leben täte. */
          blockGrabstein('blocks', r, seiteVonHier(r));
          delete cache.blocks[r.id]; geloescht.push(del('blocks', r.id));
        });
        (c.viewIds || []).forEach((v: any) => {
          vergissAusstehendes('views', v);
          /* Für Sammlungen und Ansichten kann `zuSchicken` ein Löschen gar
             nicht ausdrücken (geloescht ist dort hart false) — ohne
             Grabstein kämen sie über das Holen zurück. Die Seiten-Angabe
             spiegelt zuSchicken: Ansicht → ihre Sammlung, Sammlung → sie
             selbst. */
          if (cache.views[v]) blockGrabstein('views', cache.views[v], b.collectionId);
          delete cache.views[v]; geloescht.push(del('views', v));
        });
        vergissAusstehendes('collections', b.collectionId);
        blockGrabstein('collections', c, b.collectionId);
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
  const purgeAnhaenge = async (id: string, hinweis: {
      datei?: string; dateien?: string[]; anspruch?: Map<string, string>
    } = {}) => {
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
    const kennungen = new Set<string>(dateien.map((d: any) => String(d.id)));
    /* Der Block ist an dieser Stelle schon aus dem Zwischenspeicher —
       `purgeTief` reicht seine Dateien deshalb in `hinweis.dateien` herüber.
       Der Griff in den Cache bleibt trotzdem stehen: `purgeAnhaenge` wird
       auch einzeln gerufen, und dann ist der Block noch da. */
    [hinweis.datei, ...(hinweis.dateien || []), ...dateienAmBlock(cache.blocks[id])]
      .forEach(x => { if (x) kennungen.add(String(x)); });

    const anspruch = hinweis.anspruch || dateiAnspruch();
    for (const dateiId of kennungen) {
      const wer = anspruch.get(dateiId);
      if (wer) {
        /* BEHALTEN — und den Satz dem übergeben, der sie noch zeigt. Ohne
           die Übergabe hielte `Dateien.verwaist()` sie für herrenlos, weil
           ihr `blockId` auf den eben gelöschten Block zeigt, und die
           Pflegeseite böte an, sie wegzuräumen. */
        const satz = await dateiHolen(dateiId);
        if (satz && satz.blockId !== wer)
          await dateiPut(Object.assign({}, satz, { blockId: wer }));
        continue;
      }
      for (const st of await stueckeVon(dateiId)) await del('stuecke', st.id);
      /* Endgültig weg heisst: dem Server sagen (E249) — falls er sie kennt. */
      dateiGrabstein(dateiId);
      await dateiWeg(dateiId);
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
      text: '', aliases: [], icon: '📄', cover: '', wide: false, font: 'default', small: false
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

    /* `edited` GLEICH MIT (E179). Es fehlte hier, und der Umzug
       `zeitstempel-an-sammlungen` trug es beim nächsten Start nach — das
       war für ALTE Sätze gedacht, nicht für neue. Seit E172 laufen die
       Umzüge auch nach einer eingespielten Sicherung, und damit fiel es
       auf: `test96` vergleicht den Bestand vor dem Export mit dem nach dem
       Einspielen, Feld für Feld, und fand zwei geänderte `edited`.

       Der Umzug hatte recht — hier fehlte etwas. Ihn abzuschalten wäre die
       falsche Richtung gewesen: dann käme eine Sicherung von 2025 wieder
       ohne Zeitstempel herein, und der Abgleich hielte jede Schemaänderung
       darin für nie geschehen. */
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
    /* Wer dieselbe Kennung wieder anlegt (Verlauf-Undo, Fassungen,
       Abgleich), nimmt einen liegengebliebenen Grabstein zurück (E254) —
       sonst löschte der nächste Takt den eben zurückgeholten Satz drüben. */
    blockGrabsteinWeg(satz.id);
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
    /* DER NAME KOMMT AUS DEM REGISTER (E422, §8). Hier stand eine eigene
       Karte mit elf von dreizehn Arten; `pivot` und `raster` fehlten, und
       eine solche Ansicht hiess deshalb „Ansicht". Genau der Fall, vor dem
       §8 warnt: ein zweiter Katalog läuft mit dem ersten auseinander, und
       niemand merkt, welcher gilt.
       `register/ansichten.js` wird vor dieser Datei geladen (index.html),
       und `kern/` darf `register/` benutzen (§5 Regel 1). Der Rückfall
       bleibt trotzdem stehen: eine Ansicht ohne Namen ist schlimmer als
       eine mit einem faden. */
    const ausRegister = (art: string): string =>
      (typeof Register !== 'undefined' && (Register as any).ansichten)
        ? (Register as any).ansichten.name(art) : art;
    const v = {
      id: uid(), collectionId, layout,
      name: name || ausRegister(layout) || 'Ansicht',
      filters: { operator: 'and', rules: [] },
      sorts: [], groupBy: '', hidden: [], calc: {},
      created: now(), edited: now()      /* siehe `addDatabase` — E179 */
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
      /* WIE BEI JEDEM ANDEREN BLOCK (Zeile 378). Hier fehlte es, und das kostete:
         `Bibliothek.meineAufgaben` fragt für eine Datenbank ohne Personenspalte
         `row.erstelltVon`, bekam `undefined` und verglich den Ersatzwert „Ich"
         mit dem eingestellten Namen. Wer sich in den Einstellungen „Redur"
         nannte, sah seine Aufgabenliste leer (L56, E153). */
      erstelltVon: getMeta('nutzer', '') || 'Ich',
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

  /**
   * Einen Eintrag an eine Meta-LISTE hängen, ohne den anderen Tab zu
   * überschreiben.
   *
   * ────────────────────────────────────────────────────────────────────────
   * L75 SAGTE „KANN", UND ES WURDE GEMESSEN: es TUT.
   *
   * Die Merklisten (`wolkeBloeckeWeg` seit E254, `wolkeDateienWeg` seit
   * E249, `wolkeNachtrag` seit E314) werden mit Lesen-Ändern-Schreiben
   * gepflegt:
   *
   *     const alt = getMeta(k, []);
   *     setMeta(k, alt.concat([neu]));
   *
   * `getMeta` liest aus dem Zwischenspeicher DIESES Tabs. Zwei Tabs haben
   * zwei davon. Gemessen mit zwei Seiten auf derselben Ablage: beide
   * hängten je einen Eintrag an, danach stand EINER da. Der andere war
   * fort — still, ohne Fehler, ohne Meldung.
   *
   * Was das kostet: ein Grabstein, der nie zum Server geht. Der Block ist
   * lokal gelöscht und lebt auf dem anderen Gerät weiter (E249/E254 gab es
   * genau dagegen).
   *
   * WAS DIESE FUNKTION ANDERS MACHT: sie liest die Liste aus der ABLAGE,
   * hängt an und schreibt zurück — alles in EINER Transaktion. IndexedDB
   * reiht Transaktionen auf dasselbe Fach hintereinander, auch über Tabs
   * hinweg; damit sieht die zweite, was die erste geschrieben hat.
   *
   * WAS SIE NICHT LÖST, und das bleibt als L75 stehen: die Liste ist
   * weiterhin EIN Satz. Zwei Geräte über die Wolke bringt das nicht
   * zusammen — dafür bräuchte jede Merknotiz einen eigenen Satz, und das
   * ist ein eigener Bogen, der erst lohnt, wenn Multi-Tab plus Wolke
   * wirklich zusammen gemessen wird.
   *
   * `aendern` bekommt eine Liste und gibt die neue zurück — oder `null`,
   * wenn nichts zu tun ist. Damit deckt derselbe Griff alle drei Fälle ab:
   * anhängen, ersetzen, austragen. Massgeblich geschrieben wird das, was
   * gegen die ABLAGE gerechnet wurde; warum es trotzdem zweimal läuft,
   * steht gleich darunter.
   *
   * ZWEIMAL GERECHNET, UND DAS IST DER PUNKT.
   *
   * Der erste Wurf rechnete NUR in der Transaktion — und der Prüflauf
   * zeigte sofort, was das kostet: fünf bestehende Zusagen fielen, alle mit
   * derselben Ursache. `purgeTief` schreibt einen Grabstein und liest ihn
   * eine Zeile später wieder; dazwischen war der Zwischenspeicher noch alt.
   * Eine seltene Kollision zwischen zwei Tabs gegen ein sicheres
   * Danebenlesen in jedem Tab einzutauschen ist kein guter Handel.
   *
   * Also beides:
   *
   *   1 · SOFORT gegen den Zwischenspeicher rechnen und ihn setzen. Wer
   *       gleich danach `getMeta` fragt, sieht seinen Eintrag — wie immer.
   *   2 · In der TRANSAKTION noch einmal rechnen, diesmal gegen das, was
   *       wirklich in der Ablage steht, und DAS schreiben.
   *
   * `aendern` muss dafür rein sein: es wird zweimal gerufen und darf nichts
   * anfassen ausser der Liste, die es bekommt.
   */
  const metaListeAendern = (
    k: string, aendern: (liste: any[]) => any[] | null
  ): Promise<any[]> => {
    /* Schritt 1 — sofort, damit ein Lesen unmittelbar danach stimmt. */
    const imSpeicher = Array.isArray(cache.meta[k]) ? cache.meta[k] : [];
    const sofort = aendern(imSpeicher);
    if (sofort) cache.meta[k] = sofort;

    /* Ohne Ablage bleibt es dabei — das alte Verhalten, und immer noch
       besser als gar nichts. */
    if (!db) return Promise.resolve(sofort || imSpeicher);

    /* Schritt 2 — dauerhaft, gegen den echten Stand. */
    return new Promise<any[]>((ok, fail) => {
      try {
        const t = tx(['meta'], 'readwrite');
        const fach = t.objectStore('meta');
        const holen = fach.get(k);
        holen.onsuccess = () => {
          const satz = holen.result;
          const alt = Array.isArray(satz && satz.v) ? satz.v : [];
          const neu = aendern(alt);
          if (!neu) { ok(cache.meta[k] || alt); return; }
          const legen = fach.put({ k, v: neu });
          legen.onsuccess = () => { cache.meta[k] = neu; ok(neu); };
          legen.onerror = () => fail(legen.error);
        };
        holen.onerror = () => fail(holen.error);
      } catch (err) { fail(err); }
    });
  };

  /** Der häufigste Fall von `metaListeAendern`: hinten anhängen. */
  const metaListeAnhaengen = (k: string, eintrag: unknown): Promise<any[]> =>
    metaListeAendern(k, alt => alt.concat([eintrag]));

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

  /* --- Abgelöste Arbeit — und wie man auf sie wartet ----------------------
   * `purgeBlock` kehrt sofort zurück und löscht die Anhänge danach im
   * Hintergrund. Das ist richtig so: bei einer Seite mit fünfhundert Blöcken
   * darf der Bildschirm nicht stehen bleiben.
   *
   * Es war aber nicht abwartbar, und das hat einen Anhang gekostet. Wer eine
   * Seite endgültig löscht und gleich darauf eine Sicherung einspielt, bekam
   * das hier:
   *
   *     Seite gelöscht           `purgeBlock` kehrt zurück, das Löschen der
   *                              Anhänge läuft noch
   *     Sicherung eingespielt    die Blöcke stehen wieder, der Anhang wird
   *                              frisch geschrieben
   *     … Wimpernschlag später   das alte Löschen kommt an und nimmt den
   *                              NEUEN Anhang mit
   *
   * Gemessen, und immer anders: `dateiAlle()` fand den Satz, `dateiHolen()`
   * einen Augenblick später nicht mehr; mal null Stücke, mal eins. Genau
   * dieses Schwanken ist die Unterschrift eines Wettlaufs.
   *
   * Schlimmer noch: `purgeAnhaenge` liest den Block aus dem
   * Zwischenspeicher — und der ist nach dem Einspielen der EINGESPIELTE.
   * Das Löschen findet also die frisch zurückgeholte Kennung und trifft sie
   * genau. Ein Zufall wäre halb so schlimm; das hier ist zielsicher.
   *
   * Deshalb wird jede abgelöste Arbeit hier vermerkt, und `settled()` wartet
   * darauf. `importAll` ruft es vorn und hinten: vor dem Ersetzen muss
   * gelandet sein, was noch unterwegs war, und danach muss gelandet sein,
   * was das Einspielen selbst angestossen hat — erst dann darf jemand
   * Anhänge daneben schreiben.
   * ----------------------------------------------------------------------*/
  const unterwegs = new Set<Promise<unknown>>();

  /** Vermerkt eine Arbeit, die ohne Aufrufer weiterläuft. */
  const abloesen = <T,>(p: Promise<T>): Promise<T> => {
    unterwegs.add(p);
    const raus = () => { unterwegs.delete(p); };
    p.then(raus, raus);
    return p;
  };

  /**
   * Wartet, bis nichts mehr unterwegs ist.
   *
   * In Runden, weil eine abgelöste Arbeit die nächste anstossen kann. Nach
   * zwanzig Runden ist Schluss — ein Fehler, der sich selbst nachlegt, darf
   * die App nicht anhalten; dann ist ein Wettlauf immer noch besser als ein
   * Stillstand. Eine Ablehnung zählt als gelandet: behandelt wird sie dort,
   * wo sie entsteht (siehe `purgeBlock`), nicht hier.
   */
  const settled = async (): Promise<void> => {
    for (let runde = 0; runde < 20 && unterwegs.size; runde++)
      await Promise.all([...unterwegs].map(p => p.catch(() => {})));
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
      const aliases = Array.isArray(b.aliases)
        ? b.aliases.map((value: unknown) => String(value ?? '').trim()).filter(Boolean) : [];
      const alias = aliases.find((value: string) => value.toLowerCase().includes(needle));
      if (wo !== 'inhalt' && (t.includes(needle) || alias)) {
        out.push({ page: b, treffer: t.includes(needle) ? 'Titel' : 'Alias',
                   snippet: t.includes(needle) ? b.text : alias, pfad: pfadText(b.id) });
        return;
      }
      if (wo !== 'titel') {
        const hit = findInside(b.id, needle, 0);
        if (hit) out.push({ page: b, treffer: 'Inhalt', snippet: hit.text,
                            blockId: hit.blockId, pfad: pfadText(b.id) });
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

  /**
   * Der erste Treffer INNERHALB einer Seite.
   *
   * Gibt `{ text, blockId }` zurück statt nur einer Zeichenkette: mit der
   * Kennung kann die Suche seit E105 direkt zum Block springen statt bloss
   * die Seite zu öffnen. Bei einem Skript mit achtzig Seiten ist das der
   * Unterschied zwischen „steht da drin" und „steht hier".
   *
   * GESUCHT WIRD AUCH IN `suchtext`. Eine PDF-Seite hat keinen `text` — sie
   * ist ein Bild. Ihr Text steht seit E107 daneben, sonst wäre ein
   * eingelesenes Skript für die Suche stumm.
   */
  /**
   * Was an einem Block durchsucht wird.
   *
   * Drei Felder standen hier lange: `text`, `suchtext`, `ocrText`. §28 des
   * Auftrags zählt zwölf Dinge auf, die auffindbar sein sollen, und zwei
   * davon lagen ausserhalb:
   *
   * DER DATEINAME. Er steht im Fach `dateien`, nicht am Block. In der Praxis
   * fiel das kaum auf, weil jeder Weg, der eine Datei anlegt, den Namen auch
   * als Blocktext setzt — `recognition.ts`, `pdf/einlesen.ts`. Wer den Text
   * aber überschreibt („Vertrag Wohnung"), verliert den Namen für die Suche.
   * Gemessen am 25. August: Block mit Namen im Text gefunden, derselbe Block
   * ohne Text nicht.
   *
   * DIE QUELLENANGABE. Lernkarten aus Paketen tragen sie unter
   * `quiz.source.title`, die Lizenz unter `learningPackage.license`
   * (`electrical.ts`). Beides ist am Block, nur eine Ebene tiefer — nachgesehen,
   * nicht geraten.
   *
   * Die Reihenfolge ist Absicht: der eigene Text zuerst, damit der Schnipsel
   * in der Trefferliste das zeigt, was der Mensch geschrieben hat.
   */
  const durchsuchbar = (b: any): string[] => {
    const raus = [String(b.text || ''), String(b.suchtext || ''), String(b.ocrText || '')];
    if (b.dateiId) raus.push(dateiNamen.get(String(b.dateiId)) || '');
    const quelle = b.quiz && b.quiz.source;
    if (quelle) raus.push(String(quelle.title || ''), String(quelle.edition || ''));
    if (b.learningPackage) raus.push(String(b.learningPackage.license || ''));
    return raus;
  };

  const findInside = (pageId: any, needle: any, tiefe: number): any => {
    if (tiefe > 5) return null;
    for (const kid of childrenOf(pageId)) {
      /* Unterseiten haben ihren eigenen Treffer — sonst würde die Elternseite
         mit fremdem Inhalt in der Liste stehen. */
      if (kid.type === 'page') continue;

      for (const roh of durchsuchbar(kid)) {
        if (!roh) continue;
        const i = roh.toLowerCase().indexOf(needle);
        if (i < 0) continue;
        const aus = roh.slice(Math.max(0, i - 30), i + 60).replace(/\s+/g, ' ');
        return { text: '…' + aus + '…', blockId: kid.id };
      }

      const tiefer = findInside(kid.id, needle, tiefe + 1);
      if (tiefer) return tiefer;
    }
    return null;
  };

  /* ========================================================================
   * WAS DEM GERÄT GEHÖRT UND NICHT DER SICHERUNG (L76 / E279)
   * ------------------------------------------------------------------------
   * Zwei Listen, und sie sind bewusst nicht dieselbe.
   *
   * `GEHEIM` — was aus einer KLARTEXT-Sicherung fliegt. Eine `.json` und das
   * `daten.json` im `.redion` liegen offen da: im Downloads-Ordner, im
   * Mail-Anhang, im Chat, auf dem USB-Stick. Ein Sitzungs-Token darin ist
   * ein Schlüssel zum Konto, ein `api:`-Eintrag ein Schlüssel zu einem
   * fremden Dienst. Die VERSCHLÜSSELTE Sicherung darf beides mitnehmen —
   * ohne Passwort ist sie nichts wert, und mit Passwort ist sie genau das,
   * was man auf einem neuen Gerät braucht.
   *
   * Ein Präfix statt einer Aufzählung: `api:` deckt auch die Anbindung, die
   * es morgen gibt. Eine Aufzählung wäre bei jeder neuen Verbindung eine
   * Gelegenheit, durch Vergessen zu lecken.
   *
   * `wolkeProbe` ist selbst schon Chiffre — aber sie ist ein Orakel: mit ihr
   * lässt sich ein Passwort in Ruhe durchprobieren, ohne dass es jemand
   * merkt. Sie gehört zum Schlüssel, nicht in die offene Datei.
   *
   * `GERAETEIGEN` — was beim Einspielen dem LEBENDEN Gerät gehört. Das ist
   * die Obermenge: Anmeldung, Konto, Bereich, Salz, Probe, Teilliste und die
   * Anbindungen. Eine Sicherung ersetzt INHALTE, nicht die Identität des
   * Geräts (L76). Wer eine Sicherung vom Rechner der Schwester einspielt,
   * soll danach immer noch sein eigenes Konto haben.
   *
   * `wolkeGeteilt` steht mit auf der Liste, und das ist der Sicherheitsteil
   * daran: `Wolke.istGeteilt()` entscheidet damit, ob ein Satz im KLARTEXT
   * oder mit AES zum Server geht. Eine fremde Liste würde hiesige private
   * Seiten unverschlüsselt hochschicken — kein Datenverlust, aber ein
   * Datenleck, und das ist schlimmer.
   * ======================================================================*/
  const GEHEIM_PRAEFIX = 'api:';
  const GEHEIM = ['wolkeToken', 'wolkeProbe'];
  const istGeheim = (k: string) => GEHEIM.includes(k) || k.startsWith(GEHEIM_PRAEFIX);

  /* Und eine dritte, engste Liste: was eine Sicherung GAR NICHT tragen darf,
     auch keine verschlüsselte. Das sind keine Daten, sondern ERLAUBNISSE.

     E270 hat den Satz schon aufgeschrieben und meinte damals den
     Ordnerzugriff: „eine Sicherung kann keine Erlaubnis mitbringen, also
     sticht immer, was hier erlaubt wurde." Er gilt genauso für
     `wolkeGeteilt`. Diese Liste ist der lokale Spiegel dessen, was DIESES
     Konto auf dem Server wirklich freigegeben hat, und `Wolke.istGeteilt()`
     entscheidet damit, ob ein Satz im KLARTEXT oder mit AES hochgeht. Eine
     Liste aus einer fremden Datei könnte eine hiesige private Seite
     unverschlüsselt hochschicken — kein Datenverlust, sondern ein Leck.

     Sie zu verlieren kostet nichts Bleibendes: die Wahrheit steht auf dem
     Server, `Wolke.freigaben()` holt sie. Sie falsch zu erben schon.

     Deshalb hier der Unterschied zu `GERAETEIGEN`: dort sticht der lebende
     Wert nur, WENN es ihn gibt (sonst käme ein frisches Gerät nie an seine
     Anmeldung). Hier sticht er IMMER, auch wenn er leer ist. */
  /* `wolkeNachtrag` und `wolkeNachtragAlles` (L100, E314) gehören auch
     hierher, und zwar aus demselben Grund wie der Ordnerzugriff: sie sind
     die Merkliste DIESES Geräts für den nächsten Versand. Eine fremde
     Liste wäre nicht gefährlich, aber falsch — sie nennt Kennungen, die
     hier nie dazugelegt wurden, und ihr Fehlen liesse die eigenen
     verschwinden. Der lebende Wert sticht deshalb immer, auch der leere. */
  const NUR_HIER = ['sicherungOrdner', 'wolkeGeteilt',
                    'wolkeNachtrag', 'wolkeNachtragAlles'];
  const istNurHier = (k: string) => NUR_HIER.includes(k);

  const GERAETEIGEN = ['sicherungOrdnerName',
                       'wolkeToken', 'wolkeKonto', 'wolkeBereich',
                       'wolkeSalz', 'wolkeProbe'];
  const istGeraeteEigen = (k: string) =>
    GERAETEIGEN.includes(k) || k.startsWith(GEHEIM_PRAEFIX);

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
  /* ==========================================================================
   * WELCHES FACH WIRD GESICHERT — UND WELCHES MIT ABSICHT NICHT (E332)
   * --------------------------------------------------------------------------
   * L102 Punkt 5: „`exportAll`/`importAll` tragen drei hartkodierte
   * Fachlisten, während `wipe()` seit dem Anhang-Vorfall die Ablage selbst
   * fragt (`[...db.objectStoreNames]`). Ein neues Fach würde also gelöscht,
   * aber nie gesichert. Kein Prüflauf deckt das ab."
   *
   * NACHGEZÄHLT: es gibt elf Fächer, und heute stimmt es noch. Sieben werden
   * gesichert, vier mit Grund nicht. Die Gefahr liegt nicht bei diesen elf,
   * sondern beim ZWÖLFTEN — dem, das jemand nächsten Monat anlegt und beim
   * Sichern vergisst. `wipe()` würde es leeren, `exportAll` nie erwähnen.
   *
   * Deshalb keine dynamische Sicherung — die ginge nicht: `stuecke` hält
   * Blobs, `meta` braucht Filter, jedes Fach hat seine eigene Form. Sondern
   * eine ERKLÄRUNG, gegen die sich die Ablage abgleichen lässt. Was in
   * keiner der drei Listen steht, ist unbekannt, und Unbekanntes wird
   * GENANNT statt verschwiegen (§52.10, E111).
   * ========================================================================*/

  /** Fächer, die immer in die Sicherung gehören. */
  const FAECHER_IMMER = ['blocks', 'collections', 'views', 'meta', 'versions'];

  /** Fächer, die nur mit Anhängen mitreisen. */
  const FAECHER_MIT_ANHANG = ['dateien', 'stuecke'];

  /**
   * Fächer, die mit Absicht draussen bleiben — mit dem Grund dazu.
   *
   * Der Grund steht hier und nicht nur im Kopf dessen, der es entschieden
   * hat: wer das nächste Fach anlegt, soll an dieser Liste vorbeikommen und
   * sich entscheiden müssen.
   */
  const FAECHER_NIE: Record<string, string> = {
    auftraege: 'ein halb erledigter Auftrag ist Arbeit an diesem Gerät (E286)',
    basis:     'der Abgleichsstand ist kein Inhalt, sondern ein Gedächtnis',
    vorrat:    'vorberechnete Werte — ein Beschleuniger, kein Inhalt',
    suchindex: 'entsteht beim Start neu'
  };

  /**
   * Welche Fächer stehen in keiner der drei Listen?
   *
   * Die Frage, die `wipe()` schon stellt, nur andersherum. Ohne Angabe
   * fragt sie die laufende Ablage; MIT Angabe rechnet sie über eine
   * erfundene Liste — genauso wie die Fassungsregel weiter unten, und aus
   * demselben Grund: ein neues Fach entsteht beim BAUEN, nicht zur
   * Laufzeit. Ein Prüflauf könnte es gar nicht anlegen, ohne die Ablage
   * unter der laufenden App wegzuziehen (`onversionchange` schliesst sie
   * dann, und zwar mit Absicht).
   */
  const faecherUnbekannt = (namen?: string[]): string[] => {
    const liste = Array.isArray(namen) ? namen
      : (db && db.objectStoreNames) ? [...db.objectStoreNames] as string[]
      : [];
    return liste.filter(n =>
      !FAECHER_IMMER.includes(n) && !FAECHER_MIT_ANHANG.includes(n) &&
      !(n in FAECHER_NIE)).sort();
  };

  /**
   * Der Satz dazu — leer, wenn nichts unbekannt ist.
   *
   * Eigene Funktion, damit sich beides prüfen lässt: dass er im Ernstfall
   * dasteht UND dass er im Normalfall fehlt. Ein Hinweis, der immer da ist,
   * wird nicht gelesen.
   */
  const satzZuUnbekannten = (liste: string[]): string =>
    !liste || !liste.length ? ''
      : ' ACHTUNG: ' + liste.length + ' Fach/Fächer der Ablage (' +
        liste.join(', ') + ') werden von dieser Sicherung NICHT erfasst. ' +
        'Sie stehen in keiner der Listen in `indexdb.ts` — wer sie angelegt ' +
        'hat, hat nicht entschieden, ob sie mitreisen sollen. Beim ' +
        'Einspielen mit „Ersetzen" wären sie weg.';

  const exportAll = (mitAnhaengen = false, mitGeheimnissen = false) => {
    const dateienDa = zaehlerDateien();
    const abgeleitetDa = zaehlerAbgeleitet();
    const fehlenAnhaenge = dateienDa && !mitAnhaengen;
    /* DER SICHERUNGSORDNER DARF NICHT MITREISEN (E270).
       `sicherungOrdner` hält einen Zugriff auf ein echtes Verzeichnis —
       er lebt im strukturierten Klon dieses Browsers und ist an dieses
       Gerät gebunden. `JSON.stringify` macht daraus `{}`; das wäre nicht
       kaputt, aber wertlos, und beim Einspielen überschriebe dieses `{}`
       einen lebenden Zugriff. Also raus hier — und, weil eine Sicherung
       sagen muss, was sie auslässt (§52.10), MIT Nennung im Manifest.
       Der Name bleibt als Text drin: nach dem Einspielen soll man lesen
       können, welcher Ordner es war. */
    const ordnerDa = 'sicherungOrdner' in cache.meta && !!cache.meta['sicherungOrdner'];
    /* Was gar nicht mitreisen darf, und ob es überhaupt etwas zu nennen
       gibt. Eine leere Teilliste ist kein Verlust — sie stünde sonst in
       jeder Sicherung unter `fehlt`, und ein Manifest, das Nichtigkeiten
       aufzählt, macht die echten Zeilen unsichtbar. */
    const nurHierAusgelassen = NUR_HIER.filter(k => {
      const v = cache.meta[k];
      return Array.isArray(v) ? v.length > 0 : !!v;
    });
    /* UND DIE ZUGANGSDATEN GENAUSO (L76 / E279). Eine Klartext-Sicherung
       trug bisher das Sitzungs-Token der Wolke und jeden `api:`-Schlüssel
       offen mit sich herum. Sie bleiben drin, wenn der Aufrufer sagt, dass
       er verschlüsselt — sonst fliegen sie raus. Und dann steht ihr Name
       im Manifest, denn eine Sicherung muss sagen, was sie auslässt
       (§52.10). Der NAME ist keine Preisgabe: dass es einen `api:github`
       gab, verrät nicht, wie er lautete. */
    const metaGefiltert: Record<string, any> = {};
    const geheimAusgelassen: string[] = [];
    for (const k of Object.keys(cache.meta)) {
      if (istNurHier(k)) continue;
      if (!mitGeheimnissen && istGeheim(k)) {
        /* Nur was wirklich einen Wert hat — ein leerer Eintrag ist kein
           Geheimnis und gehörte sonst als Verlust ins Manifest. */
        if (cache.meta[k]) geheimAusgelassen.push(k);
        continue;
      }
      metaGefiltert[k] = cache.meta[k];
    }
    geheimAusgelassen.sort();
    /* Im Archiv liegen nur die NICHT abgeleiteten — siehe `sicherungSpeichern`
       in der Schale, das genauso filtert. Die Zahl hier muss dieselbe sein,
       sonst zählt das Manifest etwas anderes als das Archiv enthält. */
    const echteImArchiv = dateienDa - abgeleitetDa;
    /* Ein Satz über das, was bewusst fehlt. Er steht auch dann da, wenn sonst
       „vollständig" gilt — vollständig ist eine Sicherung nur, wenn sie sagt,
       was sie auslässt (§52.10, E111). */
    const ueberAbgeleitete = !abgeleitetDa ? ''
      : abgeleitetDa === 1
        ? ' Ein gerastertes Seitenbild ist bewusst NICHT dabei: es entsteht ' +
          'aus dem Original neu — in Redion über den Knopf „Aus dem Original ' +
          'zurückholen" auf der leeren Seite.'
        : ' ' + abgeleitetDa + ' gerasterte Seitenbilder sind bewusst NICHT ' +
          'dabei: sie entstehen aus den Originalen neu — in Redion über den ' +
          'Knopf „Aus dem Original zurückholen" auf der leeren Seite.';
    /* Und derselbe Satz für den Ordnerzugriff. Der NAME steht weiter im
       Manifest — nur der Zugriff selbst nicht. Wer die Sicherung auf einem
       anderen Rechner einspielt, soll lesen können, welcher Ordner es war,
       und ihn dort einmal neu wählen. */
    const ordnerName = String(cache.meta['sicherungOrdnerName'] || '').trim();
    const ueberOrdner = !ordnerDa ? ''
      : ' Der gewählte Sicherungsordner ist NICHT dabei: ein Ordnerzugriff ' +
        'gilt nur auf dem Gerät, auf dem er erteilt wurde, und liesse sich ' +
        'nicht mitschreiben.' +
        (ordnerName ? ' Er hiess „' + ordnerName + '".' : '') +
        ' Nach dem Einspielen einmal neu wählen unter Einstellungen → ' +
        'Sicherung.';
    /* Und für die Teilliste derselbe Satz aus demselben Grund: eine
       Sicherung kann keine Erlaubnis mitbringen. */
    const ueberGeteilt = !nurHierAusgelassen.includes('wolkeGeteilt') ? ''
      : ' Welche Seiten geteilt sind, ist NICHT dabei: das ist eine ' +
        'Erlaubnis auf dem Server, keine Angabe in einer Datei. Nach dem ' +
        'Einspielen steht sie weiter dort — Redion holt sie beim nächsten ' +
        'Blick in die Freigaben.';
    /* Und derselbe Satz für die Zugangsdaten. Er nennt die Zahl und den
       Weg zurück: eine verschlüsselte Sicherung nimmt sie mit. */
    const ueberAuftraege = !exportAuftraegeOffen ? ''
      : ' ' + exportAuftraegeOffen + ' Auftrag/Aufträge standen beim Sichern ' +
        'noch offen (z. B. ein laufendes Einlesen). Sie reisen NICHT mit: ' +
        'ihre Eingaben liegen auf diesem Gerät. Auf diesem Gerät laufen sie ' +
        'weiter.';
    /* Was die Ablage kennt und niemand erklärt hat (E332). Im Normalfall
       leer — dann steht auch kein Wort davon in der Sicherung. */
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
      /* Was drin ist — damit ein Einleser es nachsehen kann, statt zu raten. */
      enthaelt: FAECHER_IMMER
        .concat(mitAnhaengen && echteImArchiv ? FAECHER_MIT_ANHANG : []),
      /* `auftraege` reist NIE mit (E286): ein halb erledigter Auftrag ist
         Arbeit an DIESEM Gerät, und seine Eingaben — eine Datei in
         Stücken, ein bestimmter Block — gibt es woanders vielleicht gar
         nicht. Ihn mitzuschicken hiesse, auf dem anderen Gerät eine
         Arbeit zu beginnen, die nicht laufen kann.

         GENANNT wird er aber nur, wenn wirklich etwas offensteht. Ein
         leeres Auftragsfach lässt nichts aus, und ein `fehlt`, das immer
         etwas enthält, bringt Menschen bei, es zu überlesen. */
      fehlt: (fehlenAnhaenge ? FAECHER_MIT_ANHANG : [])
        .concat(exportAuftraegeOffen ? ['auftraege'] : [])
        .concat(nurHierAusgelassen)
        .concat(geheimAusgelassen)
        /* UND WAS NIEMAND ERKLÄRT HAT (E332). Ein Fach, das die Ablage
           kennt und keine der drei Listen nennt, wird nicht gesichert —
           `wipe()` würde es trotzdem leeren. Es hier zu nennen macht aus
           einem stillen Verlust eine Zeile, die man liest. */
        .concat(unbekannteFaecher),
      /* Wie viele Dateien absichtlich draussen blieben — als Zahl, damit ein
         Einleser es nachrechnen kann, statt einen Satz zu lesen. */
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

  /* Der Verlauf wird beim Sichern eingelesen — er liegt bewusst nicht im
     Zwischenspeicher, damit er den Arbeitsspeicher nicht belastet. */
  let exportVersionen: any[] = [];
  let exportDateien = 0;
  /* Wie viele Aufträge beim Sichern noch offenstanden — siehe
     `exportVorbereiten`. Nur dann nennt das Manifest sie. */
  let exportAuftraegeOffen = 0;
  /* WIE VIELE DAVON ABGELEITET SIND. Seit E103 packt das `.redion` nicht mehr
     jede Datei ein: gerasterte PDF-Seitenbilder bleiben draussen, weil sie
     sich aus dem mitgesicherten Original neu rechnen lassen. Das Manifest
     wusste davon nichts und schrieb weiter „Vollständig: die 4 Datei(en)
     liegen im Ordner dateien" — bei zwei Dateien im Archiv. Genau die Sorte
     Sicherung, vor der §52.10 warnt: eine, die behauptet, vollständig zu
     sein (E111). */
  let exportAbgeleitet = 0;
  const zaehlerDateien = () => exportDateien;
  const zaehlerAbgeleitet = () => exportAbgeleitet;

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
    const alleDateien = await all('dateien');
    exportDateien = alleDateien.length;
    exportAbgeleitet = alleDateien.filter((d: any) => d && d.abgeleitet).length;
    /* OFFENE AUFTRÄGE ZÄHLEN (E286).
       Nicht: `auftraege` immer unter `fehlt` nennen. Der erste Entwurf tat
       genau das, und die Prüfläufe zeigten sofort, was daran falsch ist:
       eine Sicherung eines gewöhnlichen Bestands könnte dann NIE mehr
       „nichts fehlt" sagen. Ein `fehlt`, das immer etwas enthält, bringt
       Menschen bei, es zu überlesen — derselbe Fehler wie die Warnung, die
       bei gewöhnlichem Gebrauch anspringt (E284).

       Genannt wird es also nur, wenn wirklich Arbeit offensteht. Dann ist
       die Angabe auch etwas wert: „drei Aufträge laufen noch und reisen
       nicht mit". */
    try {
      const auftraege = await all('auftraege');
      exportAuftraegeOffen = (auftraege || []).filter((a: any) =>
        a && (a.zustand === 'wartet' || a.zustand === 'laeuft')).length;
    } catch { exportAuftraegeOffen = 0; }
    return { versionen: exportVersionen.length, dateien: exportDateien,
             abgeleitet: exportAbgeleitet, auftraegeOffen: exportAuftraegeOffen };
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
    /* Erst landen lassen, was noch unterwegs ist — sonst löscht ein
       Aufräumen von vorhin in den neuen Bestand hinein (siehe `settled`). */
    await settled();

    /* --- ERST ENTSCHÄRFEN, DANN PRÜFEN, DANN EINSPIELEN (E284) ----------
       Hier stand ein blankes `JSON.parse(json)`, und das Ergebnis ging
       unbesehen weiter — beim Zusammenführen über `Object.assign`, beim
       Ersetzen sogar als Zwischenspeicher SELBST.

       `Object.assign` schreibt über `[[Set]]`, also über den geerbten
       `__proto__`-SETZER. Ein `{"__proto__":{"wolkeAbgleich":true}}` in
       einer fremden Sicherung gab `cache.meta` damit einen fremden
       Prototyp — und danach lieferte `getMeta('wolkeAbgleich')` nicht mehr
       die Vorgabe, sondern das, was der Angreifer hineingelegt hatte.
       Dasselbe für `cache.blocks[id]`: eine Kennung, die es nicht gibt,
       hätte plötzlich einen Block geliefert.

       `ImportSicherheit.lesen` gibt prototyplose Verzeichnisse zurück, aus
       denen die drei Namen entfernt sind. Der Fund wird MITGEREICHT, nicht
       verschluckt (§35): eine Sicherung, die still verändert wurde, ist die
       gefährlichste Sorte.

       Die Reihenfolge ist nicht beliebig. Entschärfen kommt VOR dem Prüfen,
       weil die Prüfung sonst selbst über ein `constructor` stolpern könnte,
       und beides kommt vor dem ersten Schreibzugriff. */
    const gelesen = ImportSicherheit.lesen(json);
    const d: any = gelesen.wert;

    if (art !== 'ersetzen' && art !== 'zusammenfuehren')
      throw new Error('Beim Einspielen muss feststehen, was geschehen soll: ' +
                      '„ersetzen" wirft weg, was nicht in der Sicherung steht, ' +
                      '„zusammenfuehren" legt sie dazu. Ohne Angabe wird nichts getan.');

    const befund = ImportValidierung.pruefen(d, VERSION);
    if (!befund.taugt) {
      throw new Error(befund.punkte[0]?.text ||
                      'Das sieht nicht nach einer Sicherung dieser App aus.');
    }

    /* Die Verzeichnisse bleiben prototyplos — auch die leeren Ersatzwerte.
       Ein `{}` an dieser Stelle hätte die Lücke an genau der Stelle wieder
       aufgemacht, an der ein Fach in der Sicherung fehlt. */
    const leer = (): Record<string, any> => Object.create(null);
    const neu = {
      blocks:      ImportSicherheit.verzeichnis(d.blocks)      || leer(),
      collections: ImportSicherheit.verzeichnis(d.collections) || leer(),
      views:       ImportSicherheit.verzeichnis(d.views)       || leer(),
      meta:        ImportSicherheit.verzeichnis(d.meta)        || leer()
    };

    /* --- DER ORDNERZUGRIFF ÜBERLEBT BEIDE ARTEN (E270) ------------------
       `sicherungOrdner` hält einen echten Verzeichniszugriff, den ein
       Mensch auf DIESEM Gerät einmal erlaubt hat. Er steht nicht in der
       Sicherung — `exportAll` lässt ihn bewusst aus. Genau deshalb hätte
       „ersetzen" ihn mit dem Rest von `meta` weggelöscht, und die
       automatische Sicherung hätte nach dem Einspielen still aufgehört zu
       schreiben. Still: das ist die Sorte Fehler, die man erst merkt, wenn
       man die Sicherung braucht.

       Und umgekehrt kann eine ältere oder von Hand gebaute Sicherung an
       dieser Stelle ein `{}` mitbringen — das, was `JSON.stringify` aus
       einem Zugriff macht. Das ist kein Zugriff, sondern seine Attrappe,
       und sie über einen lebenden zu schreiben wäre derselbe stille
       Ausfall.

       Beides hat dieselbe Antwort: eine Sicherung kann keine Erlaubnis
       mitbringen, also sticht immer, was hier erlaubt wurde. Der NAME
       gehört zum Zugriff und wird mitgerettet — sonst stünde in den
       Einstellungen der Ordner eines fremden Geräts über dem eigenen. */
    /* --- DIE IDENTITÄT DES GERÄTS ÜBERLEBT BEIDE ARTEN (L76 / E279) -----
       Eine Sicherung ersetzt INHALTE, nicht die Kontoidentität dieses
       Geräts. Wer eine Sicherung einspielt — die eigene von gestern oder
       die vom Rechner der Schwester — soll danach immer noch mit seinem
       eigenen Konto angemeldet sein, seine eigenen Anbindungen haben und
       seine eigene Teilliste.

       Vorher war es andersherum: „ersetzen" tauschte `meta` vollständig,
       also auch `wolkeToken`, `wolkeKonto` und jeden `api:`-Schlüssel. Wer
       eine fremde Sicherung einspielte, war danach als jemand anderes
       angemeldet — und der nächste Abgleich schickte seine Notizen in ein
       fremdes Konto. Das ist die schlimmste Sorte Fehler, die diese App
       haben kann: sie sieht aus wie ein geglückter Vorgang.

       Die Regel: gibt es hier einen lebenden Wert, sticht er. Gibt es
       keinen, bleibt der aus der Sicherung stehen — genau das ist der
       Wiederherstellungsfall auf einem frischen Gerät.

       Warum in `neu.meta` und nicht nur im Ersetzen-Zweig: das
       Zusammenführen macht weiter unten `Object.assign(cache.meta,
       neu.meta)`. Was nur im Ersetzen-Zweig stünde, wäre dort wirkungslos,
       und die fremde Anmeldung käme durch die Hintertür.

       Was eine ERLAUBNIS ist und nicht bloss eine Angabe, steht in
       `NUR_HIER` und wird in der zweiten Schleife strenger behandelt. */
    for (const k of Object.keys(cache.meta)) {
      if (!istGeraeteEigen(k)) continue;
      const lebend = cache.meta[k];
      if (lebend !== undefined && lebend !== null && lebend !== '')
        (neu.meta as any)[k] = lebend;
    }
    /* Und die Erlaubnisse: hier sticht der lebende Wert IMMER, auch wenn er
       leer ist. Sonst erbte ein Gerät ohne eigene Teilliste die aus der
       Datei — und schickte, worauf sie zeigt, im Klartext hoch. */
    for (const k of NUR_HIER) {
      const lebend = cache.meta[k];
      if (lebend === undefined || lebend === null) delete (neu.meta as any)[k];
      else (neu.meta as any)[k] = lebend;
    }

    /* --- DIE WOLKE-MERKLISTEN ÜBERLEBEN DAS ERSETZEN (E255/L74) ---------
       „Ersetzen" tauscht auch `meta` vollständig — eine noch nicht
       versandte Löschabsicht (wolkeDateienWeg aus E249, wolkeBloeckeWeg
       aus E254) starb dabei, und die kurz vor dem Import getätigte
       endgültige Löschung erreichte den Server dann doch nie. Das
       Oben-Set (wolkeDateienOben) gehört dazu: ohne ist die
       Datei-Grabstein-Wache blind, und JEDE spätere Löschung einer
       Bestandsdatei bliebe wieder stumm — das wäre L6 durch die
       Hintertür.

       Gerettet wird die VEREINIGUNG aus altem Bestand und Sicherung —
       mit einer Ausnahme: ein Block-Grabstein, dessen Kennung die
       Sicherung selbst wieder mitbringt, fällt weg. Die Wieder-Anlage
       derselben Kennung nimmt den Grabstein zurück (dasselbe Prinzip
       wie in rohSetzen, E254) — sonst löschte der nächste Takt drüben,
       was hier eben wiederhergestellt wurde.

       Der Bestand selbst bekommt beim Ersetzen weiterhin KEINE
       Grabsteine: eine alte Sicherung einzuspielen darf nicht als
       Massenlöschung zum Server durchschlagen (E249/E254). */
    if (art === 'ersetzen') {
      const alteListe = (k: string): any[] => {
        const w = getMeta(k, null);
        return Array.isArray(w) ? w : [];
      };
      const ausSicherung = (k: string): any[] =>
        Array.isArray((neu.meta as any)[k]) ? (neu.meta as any)[k] : [];
      const bloecke = new Map<string, any>();
      for (const e of [...ausSicherung('wolkeBloeckeWeg'), ...alteListe('wolkeBloeckeWeg')]) {
        if (!e || !e.id) continue;
        if ((neu.blocks as any)[e.id] || (neu.collections as any)[e.id] ||
            (neu.views as any)[e.id]) continue;
        bloecke.set(e.id, e);
      }
      if (bloecke.size) (neu.meta as any)['wolkeBloeckeWeg'] = [...bloecke.values()];
      for (const k of ['wolkeDateienWeg', 'wolkeDateienOben']) {
        const beide = [...new Set([...ausSicherung(k).map(String), ...alteListe(k).map(String)])];
        if (beide.length) (neu.meta as any)[k] = beide;
      }

      /* --- UND DIE SYNC-MARKEN GEHEN ZURÜCK AUF NULL (L76 / E279) -------
         Die Marken sagen „bis hierher waren beide Seiten gleich". Nach
         einem Ersetzen stimmt das nicht mehr: der Bestand ist ein ganz
         anderer, die Marke aber stünde noch auf gestern Abend. Der nächste
         Abgleich schickte dann nur, was seit gestern Abend ein neues
         `edited` hat — also fast nichts — und der Server behielte den
         alten Bestand. Ein Abgleich, der still die Hälfte weglässt.

         Auf Null heisst: der nächste Abgleich sieht alles auf beiden
         Seiten und führt es über den bestehenden Weg zusammen. */
      (neu.meta as any)['wolkeMarkeHoch'] = '';
      (neu.meta as any)['wolkeMarkeRunter'] = '';
      (neu.meta as any)['wolkeMarkeDateien'] = '';

      /* --- UND DANN WIRD GEFRAGT, NICHT ENTSCHIEDEN --------------------
         Jetzt stehen zwei Bestände nebeneinander: der eben eingespielte
         hier und der, den die Wolke noch hat. Beide Richtungen sind
         plausibel, und beide können Arbeit kosten — hochladen überschreibt
         drüben, herunterladen überschreibt hier.

         Redion entscheidet das NICHT (L76). Es hält den Abgleich an und
         legt die Frage hin; die Antwort gibt ein Mensch im Wolke-Fenster.

         Warum ein EIGENER Schlüssel und nicht `wolkeAbgleich`: dessen
         Rückfallweg in `Wolke.abgleichErlaubt()` lautet „gibt es Marken?".
         Die Marken eben zu leeren kippt diese Antwort von selbst auf
         „nein" — also auf „nur lokal". Auch die harmlosere Richtung ist
         eine Richtung, und eine, die sich niemand ausgesucht hat.

         Und nur bei lebendem Zugang: ohne Anmeldung wäre die Frage eine
         Aufforderung, die ins Leere zeigt (§47). */
      if (getMeta('wolkeToken', '')) (neu.meta as any)['wolkeNeuAbgleich'] = now();
      else delete (neu.meta as any)['wolkeNeuAbgleich'];
    }

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

      /* --- DAS DAZUGELEGTE WIRD FÜR DEN VERSAND VORGEMERKT (L100, E314) ---
         `Wolke.zuSchicken()` überspringt jeden Satz mit `edited <= marke`.
         Wer eine Sicherung von vor drei Monaten dazulegt, bringt Sätze mit
         einem `edited` von vor drei Monaten mit; die Marke steht auf heute.
         Der nächste Abgleich sieht sie also NIE — auf den anderen Geräten
         fehlen sie, und nirgends wird etwas rot. Genau die stille Sorte.

         Der naheliegende Weg wäre, die Marken zu leeren. Der Preis wäre ein
         Vollabgleich bei JEDEM Dazulegen, auch wenn eine einzige Seite
         dazukommt — auf einem grossen Bestand minutenlang.

         Also enger: nur die Kennungen vormerken, die wirklich dazukamen.
         `zuSchicken` nimmt sie mit, egal wie alt ihr `edited` ist, und
         streicht jede wieder, sobald sie angekommen ist.

         Die Liste ist begrenzt. Wer eine Sicherung mit 200 000 Sätzen
         dazulegt, braucht ohnehin einen Vollabgleich; dann steht das hier
         als Marke, statt eine Liste zu führen, die grösser ist als der
         Nutzen. `zuSchicken` liest beides. */
      const dazu = [...Object.keys(neu.blocks || {}),
                    ...Object.keys(neu.collections || {}),
                    ...Object.keys(neu.views || {})];
      const GRENZE = 20000;
      if (dazu.length > GRENZE) {
        cache.meta['wolkeNachtragAlles'] = true;
      } else {
        const alt = Array.isArray(cache.meta['wolkeNachtrag'])
          ? cache.meta['wolkeNachtrag'] : [];
        const zusammen = [...new Set([...alt, ...dazu])];
        if (zusammen.length > GRENZE) cache.meta['wolkeNachtragAlles'] = true;
        else cache.meta['wolkeNachtrag'] = zusammen;
      }
      await setMeta('wolkeNachtrag', cache.meta['wolkeNachtrag'] || []);
      if (cache.meta['wolkeNachtragAlles'])
        await setMeta('wolkeNachtragAlles', true);
    }


    /* --- DER GEMEINSAME STAND WIRD VERGESSEN — ABER NICHT GANZ ----------
       `basis` merkt sich je Satz, wie er aussah, als beide Seiten ihn
       zuletzt gleich sahen. Nach einem Ersetzen ist das über den ganzen
       Bestand gelogen: die Sätze sind andere, die Erinnerung an sie nicht.
       Ein Dreiwege-Zusammenführen gegen eine falsche Basis führt Dinge
       zusammen, die nie zusammengehörten. Also weg damit — der nächste
       Abgleich baut sie neu auf.

       ERST NACH DER TRANSAKTION. Wäre das Ersetzen abgebrochen und die
       Basis schon leer, stünde der alte Bestand ohne sein Gedächtnis da.

       UND DANN WIRD EIN TEIL NEU GESÄT, und das ist der heikle Punkt:
       `Wolke.bloeckeWeg()` fragt für jeden Grabstein `basisHolen(id)` und
       wirft jeden still weg, der keinen gemeinsamen Stand hat — das ist
       die Wache aus E254 gegen „offline angelegt und gelöscht", damit der
       Server nichts löschen soll, was er nie gesehen hat.

       Eine leere Basis macht diese Wache blind für ALLE Grabsteine. Die
       Löschabsichten, die E255 gerade über das Ersetzen hinübergerettet
       hat, wären danach stumm: die Blöcke blieben auf dem Server, für
       immer, und niemand sähe es. Genau das, wogegen E254/E255 gebaut
       wurden — durch die Hintertür wieder auf.

       Der Grabstein trägt seinen Satz selbst mit (`e.satz`, aus
       `purgeTief`). Daraus lässt sich der gemeinsame Stand neu setzen. Was
       er beantworten muss, ist ohnehin nur die eine Frage: hat der Server
       diesen Satz je gesehen? */
    if (art === 'ersetzen') {
      /* --- DIE AUFTRÄGE GEHEN MIT (E286) ----------------------------
         Sie zeigen auf Blöcke und Dateien, die es nach dem Ersetzen
         nicht mehr gibt. Ein Auftrag, der eine verschwundene Datei
         sucht, scheitert dreimal und landet in der Fehlerablage — für
         nichts. Direkt über das Fach, nicht über `Auftraege`: das Modul
         lädt NACH dieser Datei, und ein `typeof`-Wächter hier wäre eine
         Abhängigkeit, die nur manchmal da ist. */
      try {
        for (const a of (await all('auftraege')) || []) await del('auftraege', a.id);
      } catch { /* das Fach gibt es erst ab Fassung 7 */ }
      await basisLeeren();
      const grabsteine: any[] = getMeta('wolkeBloeckeWeg', []) || [];
      for (const e of grabsteine)
        if (e && e.id && e.satz) await basisPut(e.id, e.satz);
    }

    /* UND DIE UMZÜGE NOCH EINMAL.
       Sie laufen beim Start, und beim Start stand hier ein anderer Bestand.
       Eine eingespielte Sicherung kann jahrealt sein — sie bringt genau die
       Formen mit, gegen die es die Umzüge gibt. Ohne diesen Aufruf wäre ein
       Umzug für alles zuständig ausser für den einen Weg, auf dem alte Daten
       heute wirklich hereinkommen (E172).

       `zuruecksetzen` davor, weil die Merkliste sagt „schon gelaufen" — für
       den vorigen Bestand stimmte das. Jeder Umzug muss ohnehin zweimal
       laufen können, ohne zu schaden; das ist die Regel, unter der sie
       geschrieben sind. */
    if (typeof Umzuege !== 'undefined') {
      try { Umzuege.zuruecksetzen(); Umzuege.laufen(); }
      catch (e: unknown) { if (typeof Reporter !== 'undefined')
        Reporter.error('Ablage', 'Umzug nach dem Einspielen: ' +
          (e instanceof Error ? e.message : String(e)), e); }
    }

    datenGeaendert();
    notify('import');
    /* Nach einer eingespielten Sicherung ist der ganze Bestand ein anderer.
       Einzelne Sätze nachzulesen hülfe den anderen Fenstern nichts — sie
       müssen von vorn anfangen. */
    meldeAnAndereFenster('alles', []);

    /* Und noch einmal: `notify('import')` gerade eben kann selbst ein
       endgültiges Löschen angestossen haben. Wer nach dem Einspielen
       Anhänge danebenschreibt, muss sich darauf verlassen können, dass
       nichts mehr unterwegs ist. */
    await settled();

    return { bloecke: Object.keys(cache.blocks).length,
             versionen: Array.isArray(d.versions) ? d.versions.length : 0,
             fehlt: d.fehlt || [],
             /* Steht danach eine Entscheidung offen? Die Schale sagt es
                dem Menschen — sonst wartet die Frage, ohne dass jemand
                weiss, dass sie wartet. */
             frage: !!getMeta('wolkeNeuAbgleich', ''),
             /* --- WAS BEIM ENTSCHÄRFEN UND PRÜFEN AUFFIEL (E284) --------
                Beides reist MIT dem Ergebnis, statt in der Konsole zu
                enden. Eine Sicherung, die still verändert oder still als
                „aus einer neueren Fassung" erkannt wurde, ist genau die
                Sorte Fehler, die man erst Wochen später sieht. */
             entschaerft: gelesen.fund.entfernt,
             entschaerftSatz: ImportSicherheit.satz(gelesen.fund),
             befund: befund.punkte,
             fassung: befund.fassung };
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
      delete patch.views; delete patch.content;
      patch.content = [];

      /* `rows` HEISST AN ZWEI BLOCKARTEN ETWAS ANDERES (E114).
         An einer Datenbank sind es die Zeilen-Blöcke, die `baum` daneben
         eingesammelt hat — die werden unten einzeln neu angelegt, und der
         alte Stand darf nicht am Block hängen bleiben.
         Am `table`-Block sind es SEINE ZELLEN, und sonst nichts.

         Gelöscht wurde bis E114 unbedingt. Jede einfache Tabelle kam damit
         leer wieder heraus — beim Verdoppeln, beim Einfügen, beim
         Rückgängigmachen, beim Wiederherstellen einer Fassung, aus jeder
         Vorlage und über den Markdown-Platzhalter. Gemessen: Zeilen
         [['Jahr','Wert'],['2026','19']] hinein, `rows: undefined` heraus.

         Also nur dort löschen, wo es die Datenbankbedeutung hat. */
      if (k.collection) delete patch.rows;

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
   * RÜCKGÄNGIG ÄNDERT INHALT, NICHT IDENTITÄT (E684, L212)
   * ------------------------------------------------------------------------
   * `Verlauf.anwenden` stellte eine Seite bis E684 so wieder her:
   * `kinderLeeren` (das ist `purgeBlock` je Kind — Grabsteine für den
   * Abgleich, Fassungen weg, Anhänge geprüft) und danach `baumEinfuegen`
   * („immer mit frischen IDs"). Gemessen am 25. September 2026: ein Strg+Z
   * auf der Elternseite gab einer Unterseite eine neue Kennung, löschte ihre
   * geplante Fassung (1 → 0) und liess einen Favoriten ins Leere zeigen.
   *
   * Diese Funktion bringt eine Seite auf den Stand eines Schnappschusses
   * (`baum()`), indem sie ÜBER DIE KENNUNG abgleicht:
   *
   *   (a) in beiden      Felder aus dem Schnappschuss, fehlende Felder weg,
   *                      `alive: true`; gespeichert und gestempelt NUR bei
   *                      Unterschied — sonst trüge jedes Strg+Z die ganze
   *                      Seite zum Server, und Gerät B bekäme dreissig
   *                      „Änderungen" für eine.
   *   (b) nur auf Seite  `trashBlock` — Papierkorb, kein Purge.
   *   (c) nur im Bild    aus dem Papierkorb `restoreBlock`; sonst neu mit der
   *                      ALTEN Kennung (`addBlock` nimmt sie aus dem Patch,
   *                      E174), Grabstein zurück (E254), `edited` jetzt —
   *                      sonst trüge `zuSchicken` ihn nie hoch (E250).
   *
   * UNTERSEITEN UND ZEILEN SIND BLÄTTER. Eine Unterseite hat ihren eigenen
   * Verlauf (§15); hier wird nur ihr Dasein und ihr Platz abgeglichen, nie
   * ihr Inneres — sonst nähme ein Strg+Z auf der Elternseite eine Sperre
   * ohne Passwort weg (`locked` fehlt im älteren Bild) und überschriebe, was
   * ein zweites Gerät seither in der Unterseite schrieb. Nur eine Unterseite,
   * die es gar nicht mehr gibt, wird samt Bild wieder angelegt.
   *
   * ANSICHTEN WERDEN NIE GELÖSCHT. Der Abgleich kann ein Löschen von
   * Ansichten nicht ausdrücken (`geloescht` ist dort hart false); eine später
   * angelegte Ansicht bleibt hinten in `viewIds`. Der Preis steht in E684.
   *
   * REIHENFOLGE IST TEIL DER ZUSAGE: erst alle Sätze setzen, dann die Kanten
   * (`content` je Behälter), dann weglegen — sonst löst `trashBlock` einen
   * Block aus einer Liste, die gerade neu geschrieben wird.
   *
   * `baumEinfuegen` und `kinderLeeren` bleiben unverändert: ihre Aufrufer
   * WOLLEN frische Kennungen (duplizieren, einfügen, Vorlagen).
   * ======================================================================*/
  /** Was der Abgleich am lebenden Satz nie anfasst. */
  const ABGLEICH_BLEIBT = new Set(['id', 'content', 'edited', 'geaendertVon', 'wolkeVersion', 'trashedAt', 'folge']);
  /** Was am Knoten Struktur ist und kein Feld des Blocks. */
  const knotenFeldAusnahme = (k: any, feld: string): boolean =>
    ABGLEICH_BLEIBT.has(feld) || feld === 'kinder' || feld === 'collection' || feld === 'views'
    /* `rows` HEISST AN ZWEI BLOCKARTEN ETWAS ANDERES (E114): an der Datenbank
       sind es die Zeilen, die `baum` daneben gesammelt hat; am `table`-Block
       seine Zellen — und die sind ein Feld wie jedes andere. */
    || (feld === 'rows' && !!k.collection);

  const baumAbgleichen = (pageId: string, daten: any): { gesetzt: number; zurueck: number; weggelegt: number } | null => {
    const seite = cache.blocks[pageId];
    if (!seite) return null;
    const wurzelKinder: any[] = (Array.isArray(daten) ? daten : (daten && Array.isArray(daten.kinder) ? daten.kinder : []))
      .filter((k: any) => k && typeof k === 'object');
    const zaehler = { gesetzt: 0, zurueck: 0, weggelegt: 0 };
    const soll = new Set<string>();
    const istBlatt = (k: any): boolean => !!k && k.type === 'page';
    const kopie = (x: any): any => JSON.parse(JSON.stringify(x));

    /** Ein Satz, wie `addBlock` ihn schreibt — ohne Struktur, ohne Stempel. */
    const satzAusKnoten = (k: any): any => {
      const patch: any = {};
      for (const [feld, wert] of Object.entries(k)) {
        if (feld === 'id' || feld === 'edited' || feld === 'geaendertVon' || feld === 'wolkeVersion' || feld === 'trashedAt') continue;
        if (feld === 'kinder' || feld === 'collection' || feld === 'views' || feld === 'content') continue;
        if (feld === 'rows' && k.collection) continue;
        patch[feld] = kopie(wert);
      }
      patch.alive = true;
      return patch;
    };

    /** Den lebenden Satz auf den Knoten bringen. Sagt, ob sich etwas geändert hat. */
    const angleichen = (b: any, k: any): boolean => {
      let anders = false;
      for (const [feld, wert] of Object.entries(k)) {
        if (knotenFeldAusnahme(k, feld)) continue;
        if (JSON.stringify(b[feld]) !== JSON.stringify(wert)) { b[feld] = kopie(wert); anders = true; }
      }
      for (const feld of Object.keys(b)) {
        if (knotenFeldAusnahme(k, feld) || feld in k) continue;
        delete b[feld]; anders = true;
      }
      if (b.alive !== true) { b.alive = true; anders = true; }
      if ('trashedAt' in b) { delete b.trashedAt; anders = true; }
      return anders;
    };

    /** Stempeln und schreiben — nur, wer sich wirklich geändert hat. */
    const schreiben = (b: any): void => {
      b.edited = now();
      b.geaendertVon = getMeta('nutzer', '') || 'Ich';
      save('blocks', b);
      zaehler.gesetzt++;
    };

    /** Liegt der Block heute in diesem Baum — oder auf einer anderen Seite? */
    const gehoertHierher = (b: any): boolean => {
      let cur = b, tiefe = 0;
      while (cur && tiefe++ < 40) {
        if (cur.id === pageId) return true;
        if (!cur.parentId || cur.parentTable === 'collection') return false;
        cur = cache.blocks[cur.parentId];
      }
      return false;
    };

    /* --- Datenbank am Block: Sammlung, Ansichten, Zeilen --- */
    const datenbankAngleichen = (k: any): void => {
      if (!k.collection || !k.collection.id || k.verknuepft) return;   /* Spiegel von purgeTief */
      const cid = String(k.collection.id);
      let c = cache.collections[cid];
      if (!c) {
        c = kopie(k.collection); c.viewIds = []; c.edited = now();
        cache.collections[cid] = c; save('collections', c); blockGrabsteinWeg(cid);
      } else {
        let anders = false;
        for (const [feld, wert] of Object.entries(k.collection)) {
          if (feld === 'id' || feld === 'viewIds' || feld === 'edited' || feld === 'wolkeVersion') continue;
          if (JSON.stringify(c[feld]) !== JSON.stringify(wert)) { c[feld] = kopie(wert); anders = true; }
        }
        if (anders) { c.edited = now(); save('collections', c); }
      }
      /* Ansichten: vorhandene angleichen, fehlende mit alter Kennung anlegen, keine löschen. */
      const sollViews: string[] = [];
      for (const v of (k.views || [])) {
        if (!v || !v.id) continue;
        sollViews.push(String(v.id));
        const alt = cache.views[v.id];
        if (!alt) {
          const nv = kopie(v); nv.collectionId = cid; nv.edited = now();
          cache.views[nv.id] = nv; save('views', nv); blockGrabsteinWeg(String(nv.id));
        } else {
          let anders = false;
          for (const [feld, wert] of Object.entries(v)) {
            if (feld === 'id' || feld === 'collectionId' || feld === 'edited' || feld === 'wolkeVersion') continue;
            if (JSON.stringify(alt[feld]) !== JSON.stringify(wert)) { alt[feld] = kopie(wert); anders = true; }
          }
          if (anders) { alt.edited = now(); save('views', alt); }
        }
      }
      const rest = (c.viewIds || []).filter((id: string) => !sollViews.includes(String(id)));
      const neueOrdnung = sollViews.concat(rest);
      if (JSON.stringify(c.viewIds || []) !== JSON.stringify(neueOrdnung)) { c.viewIds = neueOrdnung; c.edited = now(); save('collections', c); }
      /* Zeilen sind Seiten und damit Blätter: Dasein ja, Inneres nein. */
      const sollZeilen = new Set<string>();
      for (const r of (k.rows || [])) {
        if (!r || !r.id) continue;
        sollZeilen.add(String(r.id));
        const alt = cache.blocks[r.id];
        if (!alt) {
          const nr = kopie(r); nr.parentId = cid; nr.parentTable = 'collection'; nr.alive = true;
          delete nr.trashedAt; nr.edited = now(); nr.geaendertVon = getMeta('nutzer', '') || 'Ich';
          cache.blocks[nr.id] = nr; save('blocks', nr); blockGrabsteinWeg(String(nr.id)); zaehler.zurueck++;
        } else if (alt.alive === false) {
          restoreBlock(String(r.id)); zaehler.zurueck++;
        }
      }
      rowsOf(cid).forEach(r => { if (!sollZeilen.has(String(r.id))) { trashBlock(r.id); zaehler.weggelegt++; } });
    };

    /* --- 1. Sätze setzen, von oben nach unten --- */
    const setze = (k: any, elternId: string, idx: number): void => {
      if (!k.id) {
        /* Ein Knoten ohne Kennung kann aus `baum` nicht kommen; aus einer alten
           Fassung vielleicht. Dann wie bisher: frisch anlegen. */
        const neu = addBlock(elternId, k.type || 'text', satzAusKnoten(k), idx);
        zaehler.zurueck++;
        (k.kinder || []).filter(Boolean).forEach((kind: any, i: number) => setze(kind, neu.id, i));
        return;
      }
      const id = String(k.id);
      soll.add(id);
      let b = cache.blocks[id];
      let neuAngelegt = false;
      if (b && !gehoertHierher(b) && b.alive !== false) {
        /* Der Block lebt inzwischen auf einer anderen Seite. Ihn von dort
           wegzunehmen wäre eine stille Löschung für die, die dort arbeiten;
           also wie bisher eine Kopie mit frischer Kennung — als bekannte
           Grenze in E684, nicht als Zusage. */
        baumEinfuegen(k, elternId, idx);
        zaehler.zurueck++;
        return;
      }
      if (b && b.alive === false) { restoreBlock(id); zaehler.zurueck++; }
      if (!b) {
        const patch = satzAusKnoten(k);
        patch.id = id;
        b = addBlock(elternId, k.type || 'text', patch, idx);
        blockGrabsteinWeg(id);
        zaehler.zurueck++;
        neuAngelegt = true;
      } else if (!istBlatt(k)) {
        if (angleichen(b, k)) schreiben(b);
      }
      datenbankAngleichen(k);
      /* Ein Blatt behält sein Inneres — ausser es wurde eben erst neu angelegt,
         dann ist das Bild alles, was es davon gibt. */
      if (!istBlatt(k) || neuAngelegt)
        (k.kinder || []).filter(Boolean).forEach((kind: any, i: number) => setze(kind, id, i));
    };
    wurzelKinder.forEach((k, i) => setze(k, pageId, i));

    /* --- 2. Kanten: `content` je Behälter, dann 3. weglegen, was nur hier stand --- */
    const kanten = (containerId: string, kinder: any[]): void => {
      const c = cache.blocks[containerId];
      if (!c) return;
      const neu: string[] = kinder.filter((k: any) => k && k.id && cache.blocks[k.id] && gehoertHierher(cache.blocks[k.id]))
        .map((k: any) => String(k.id));
      const alt: string[] = Array.isArray(c.content) ? c.content.slice() : [];
      if (JSON.stringify(alt) !== JSON.stringify(neu)) { c.content = neu.slice(); elternGeaendert(c); }
      for (const id of neu) {
        const b = cache.blocks[id];
        if (!b || (b.parentId === containerId && b.parentTable === 'block')) continue;
        const vorher = cache.blocks[b.parentId];
        if (vorher && vorher.id !== containerId && Array.isArray(vorher.content) && vorher.content.includes(id)) {
          vorher.content = vorher.content.filter((x: string) => x !== id); elternGeaendert(vorher);
        }
        b.parentId = containerId; b.parentTable = 'block'; schreiben(b);
      }
      for (const id of alt) {
        if (neu.includes(id) || soll.has(id)) continue;
        const b = cache.blocks[id];
        if (b && b.alive !== false) { trashBlock(id); zaehler.weggelegt++; }
      }
      kinder.filter(Boolean).forEach((k: any) => { if (k.id && !istBlatt(k)) kanten(String(k.id), k.kinder || []); });
    };
    kanten(pageId, wurzelKinder);
    notify('pages');
    return zaehler;
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
  /* --- Dateinamen für die Suche ----------------------------------------
     NUR KENNUNG → NAME, sonst nichts. Die Sätze selbst bleiben in der
     Datenbank; hier steht je Datei eine Zeichenkette.

     Warum überhaupt: `search()` ist synchron — die Befehlspalette tippt mit,
     und ein `await` je Tastendruck wäre spürbar. Das Fach `dateien` liegt
     aber in IndexedDB. Ohne dieses kleine Verzeichnis könnte die Suche
     Dateinamen nur mit einem Umbau auf asynchron erreichen.

     Die Sätze sind leicht: Name, Grösse, Typ, Anzahl Stücke. Die Bytes
     liegen im Fach `stuecke` und werden hier nie angefasst (§36). */
  const dateiNamen = new Map<string, string>();
  const dateiNameMerken = (satz: any): void => {
    if (satz && satz.id) dateiNamen.set(String(satz.id), String(satz.name || ''));
  };

  /**
   * EINE MARKE, DIE SICH ÄNDERT, WENN SICH EINE DATEI ÄNDERT (E294).
   *
   * Die Ordner-Sicherung fragt alle fünf Minuten, ob sich etwas getan hat.
   * Sie liest dafür den Spiegel im Arbeitsspeicher — und der hält `blocks`,
   * `collections`, `views`, `meta`, `suchindex`, aber KEINE Dateien
   * (`indexdb.ts:255`). Wer nur einen Anhang austauschte, änderte deshalb
   * nichts, was der Abdruck sehen konnte, und es wurde nicht gesichert
   * (L82 Punkt 5).
   *
   * Die Dateien dafür alle fünf Minuten aus der Ablage zu lesen wäre teurer
   * als die Sicherung selbst — genau das lehnt `standAbdruck` ab. Also
   * hinterlässt die Dateischicht eine Marke, und der Abdruck liest DIESE
   * EINE. Nicht `meta` als Ganzes: dort schreibt die Sicherung selbst zwei
   * Marken hin, und der Abdruck wäre nach jedem Sichern sofort ein anderer.
   */
  const dateiStandHeben = (): void => {
    const alt = Number(getMeta('dateien:stand', 0)) || 0;
    setMeta('dateien:stand', alt + 1);
  };

  const dateiPut   = (satz: any) => {
    dateiNameMerken(satz); dateiStandHeben(); return put('dateien', satz);
  };
  const dateiHolen = async (id: string) => {
    const satz = await get('dateien', id);
    dateiNameMerken(satz);
    return satz;
  };
  const dateiWeg   = (id: string) => {
    dateiNamen.delete(String(id)); dateiStandHeben(); return del('dateien', id);
  };

  /* --- DATEI-GRABSTEINE (E249/L6) ----------------------------------------
     Lokales Löschen erreichte den Server nie: dateiWeg entfernt hart, und
     nichts merkte sich die Absicht. Diese drei Helfer führen die Merkliste
     `wolkeDateienWeg` in meta — geschrieben an den zwei Stellen, an denen
     eine FERTIGE Datei endgültig verschwindet (Dateien.weg, purgeAnhaenge),
     versandt ausschliesslich von der Abgleichmaschine.

     Die Wache: ein Grabstein entsteht NUR, wenn `wolkeDateienOben` die
     Kennung führt — der Server kennt sie also. Abgebrochene Uploads,
     Abgeleitetes (E103) und Über-100-MB-Dateien (E33) waren nie oben und
     erzeugen nichts. Im selben Zug verlässt die Kennung das Oben-Set:
     eine später mit derselben Kennung wieder eingespielte Datei (§11:
     .redion erhält Kennungen) darf wieder hochgehen.

     Die Maschine selbst schreibt beim ANWENDEN eines Server-Grabsteins
     über die rohen dateiWeg/stueckWeg — bewusst an diesen Helfern vorbei,
     sonst spiegelte jedes Gerät die Löschung als neue zurück (Echo). */
  const dateiGrabsteine = (): string[] => getMeta('wolkeDateienWeg', []) || [];
  const dateiGrabstein = (id: string): void => {
    const kennung = String(id || '');
    if (!kennung) return;
    if (!new Set<string>(getMeta('wolkeDateienOben', []) || []).has(kennung)) return;
    /* BEIDE LISTEN ATOMAR (E341/L75). Vorher las das den Zwischenspeicher
       DIESES Tabs und schrieb ihn zurück — zwei Tabs überschrieben einander
       still. Gemessen: von zwei angehängten Einträgen überlebte einer.
       Kein `await`: der Aufrufer ist synchron und liest die Liste nicht
       gleich wieder. */
    void metaListeAendern('wolkeDateienOben',
      alt => alt.includes(kennung) ? alt.filter((x: string) => x !== kennung) : null);
    void metaListeAendern('wolkeDateienWeg',
      alt => alt.includes(kennung) ? null : alt.concat([kennung]));
  };
  const dateiGrabsteinWeg = (id: string): void => {
    const k = String(id);
    void metaListeAendern('wolkeDateienWeg',
      alt => alt.includes(k) ? alt.filter((x: string) => x !== k) : null);
  };

  /* --- BLOCK-GRABSTEINE (E254/L73 Teil 2) --------------------------------
     Das Sofort-Muster `trashBlock(id); purgeBlock(id)` entfernt den Satz
     aus dem Zwischenspeicher, bevor je ein Abgleich lief — `zuSchicken`
     erzeugt für ihn nichts mehr, drüben lebt er weiter. Diese Merkliste
     `wolkeBloeckeWeg` hält je gelöschtem Satz das VERSANDFERTIGE Stück
     {id, tabelle, seite, satz}: die Seite muss im Purge-Moment bestimmt
     werden (danach ist die Elternkette weg), der Satz ist eine Kopie mit
     alive:false und frischem edited (E250-Lehre — ein Purge ohne
     vorherigen trashBlock trüge sonst einen alten Stempel).

     Geschrieben wird an EINER Stelle (purgeTief), versandt ausschliesslich
     von der Abgleichmaschine (bloeckeWeg, vor dem Holen). Die Wache „kennt
     der Server den Satz überhaupt?" ist hier NICHT prüfbar — `basis` ist
     asynchron, der Purge synchron. Deshalb prüft die Maschine vor dem
     Versand: kein basis-Eintrag → still austragen. Damit die Liste bei
     Nur-Lokal-Nutzern gar nicht erst wächst, schreibt der Helfer nur,
     wenn je ein Abgleich lief (wolkeMarkeHoch gesetzt). */
  const blockGrabsteine = (): any[] => getMeta('wolkeBloeckeWeg', []) || [];
  const blockGrabstein = (tabelle: string, satz: any, seite: string): void => {
    if (!satz || !satz.id) return;
    if (!getMeta('wolkeMarkeHoch', '')) return;
    const kopie = Object.assign({}, satz, { alive: false, edited: now() });
    const eintrag = { id: satz.id, tabelle, seite: String(seite || satz.id), satz: kopie };
    /* ATOMAR (E341/L75) — und die Entdopplung gehört MIT hinein: sie liest
       dieselbe Liste, die sie gleich schreibt. */
    void metaListeAendern('wolkeBloeckeWeg',
      alt => alt.filter((e: any) => !e || e.id !== satz.id).concat([eintrag]));
  };
  const blockGrabsteinWeg = (id: string): void => {
    void metaListeAendern('wolkeBloeckeWeg',
      alt => alt.some((e: any) => e && e.id === id)
        ? alt.filter((e: any) => e && e.id !== id) : null);
  };
  const dateiAlle  = async () => {
    const alle = await all('dateien');
    alle.forEach(dateiNameMerken);
    return alle;
  };

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

  /* --- Aufträge (E286) ---------------------------------------------------
     Vier gewöhnliche Wege plus EINER, der es nicht ist: `auftragNehmen`
     liest und schreibt in DERSELBEN Transaktion. Das ist der Unterschied
     zwischen einer Absichtserklärung und einer Sperre.

     Zwei Tabs, die gleichzeitig denselben Auftrag nehmen wollen, laufen
     durch dieselbe `readwrite`-Transaktion auf demselben Fach — und die
     serialisiert IndexedDB. Der zweite sieht die Pacht des ersten und geht
     weiter. Läge das Lesen in einer eigenen Transaktion, sähen beide
     „frei" und beide schrieben ihre Pacht. */
  const auftragPut   = (satz: any) => put('auftraege', satz);
  const auftragHolen = (id: string) => get('auftraege', id);
  const auftragWeg   = (id: string) => del('auftraege', id);
  const auftragAlle  = ()   => all('auftraege');

  /**
   * Einen Auftrag nehmen — Lesen und Schreiben in EINER Transaktion.
   *
   * @param waehle  bekommt alle Aufträge und gibt den geänderten zurück,
   *                oder `null`. Die Regel steht in `JobModell`; hier steht
   *                nur, dass sie unter einer Transaktion läuft.
   */
  const auftragNehmen = (waehle: (alle: any[]) => any | null): Promise<any | null> =>
    new Promise((ok2, fail2) => {
      if (!db) { ok2(null); return; }
      let genommen: any = null;
      const t = db.transaction('auftraege', 'readwrite');
      const laden = t.objectStore('auftraege').getAll();
      laden.onsuccess = () => {
        try {
          genommen = waehle(laden.result || []);
        } catch (e: any) {
          /* Eine werfende Regel darf die Transaktion nicht offen lassen. */
          genommen = null;
        }
        if (genommen) t.objectStore('auftraege').put(genommen);
      };
      t.oncomplete = () => ok2(genommen);
      t.onerror = () => fail2(t.error);
      t.onabort = () => fail2(t.error || new Error('Auftrag nehmen abgebrochen.'));
    });

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
    /* Für den Wächter aus E332 — was gesichert wird und was nicht. */
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
    beiWarnung: (fn: any) => { warner.add(fn); if (warnung) fn(warnung); },
    datenFassung: () => datenFassung,
    on: (fn: any) => listeners.add(fn)
  };
})();
