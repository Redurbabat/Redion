/* ==========================================================================
 * API — die Schnittstelle unter /v1/, in Notions Form
 * --------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/verbinden/schnittstelle.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/verbinden/schnittstelle.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion hat eine öffentliche REST-Schnittstelle: man schickt ein Token mit,
 * sagt in einem Kopfzeilenfeld, welche Fassung man erwartet, und bekommt
 * Seiten, Blöcke und Datenbanken als JSON zurück.
 *
 * Das stand hier lange auf „teilweise" mit der Begründung: dafür bräuchte es
 * einen Server. Das stimmt nur halb. Ein Server wird gebraucht, damit jemand
 * VON AUSSEN anfragen kann. Die Schnittstelle selbst — die Adressen, die
 * Formen, die Fehlercodes, die Blätterung — braucht keinen. Sie kann im
 * Browser laufen und die Daten beantworten, die dort ohnehin liegen.
 *
 * Genau das tut dieses Modul. Es beantwortet Anfragen an /v1/…, und der
 * Servicearbeiter reicht echte fetch()-Aufrufe derselben Adresse hierher
 * durch. Ein Skript auf der Seite, eine Erweiterung oder die eigene Konsole
 * können also wirklich
 *
 *     fetch('/v1/pages/…', { headers: { 'Notion-Version': '2022-06-28',
 *                                       Authorization: 'Bearer …' } })
 *
 * aufrufen und bekommen dieselbe Antwort wie von Notion.
 *
 * Was es nicht kann, und das steht auch so in der Statusliste: Anfragen aus
 * dem Internet. Die Daten liegen im Browser des Menschen, und dort kommt
 * niemand von aussen hin. Das ist keine Lücke, sondern der Grund, warum die
 * App so gebaut ist.
 * ========================================================================*/
const Api = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const FASSUNG = '2022-06-28';          /* dieselbe Fassung wie Notions */
  const SEITE_STANDARD = 100;            /* page_size, wie bei Notion */
  const SEITE_MAX = 100;

  /* ========================================================================
   * 1 · TOKEN
   * ------------------------------------------------------------------------
   * Ohne Token keine Antwort — auch hier, wo alles im selben Browser liegt.
   * Sonst könnte jedes eingebettete Fremdskript die ganze Ablage auslesen.
   * ======================================================================*/
  const tokenHolen = () => Store.getMeta('apiToken', '') || '';

  const tokenNeu = () => {
    const zufall = () => Math.random().toString(36).slice(2) +
                         Date.now().toString(36);
    const t = 'redion_' + (crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : zufall() + zufall());
    Store.setMeta('apiToken', t);
    return t;
  };

  const tokenWeg = () => Store.setMeta('apiToken', '');

  /* ========================================================================
   * 2 · FEHLER — dieselben Codes wie bei Notion
   * ======================================================================*/
  const fehler = (status: any, code: any, nachricht: any) => ({
    status,
    body: { object: 'error', status, code, message: nachricht,
            request_id: Store.uid() }
  });

  /* ========================================================================
   * 3 · WERTE — die öffentliche Form der API
   * ------------------------------------------------------------------------
   * Achtung, nicht zu verwechseln mit der internen Form [["80"]]: die
   * öffentliche API schreibt {"number": 80}. NotionFormat kümmert sich um
   * die interne, hier steht die öffentliche.
   * ======================================================================*/
  const richText = (s: string) => {
    const t = String(s ?? '');
    if (!t) return [];
    return [{ type: 'text', text: { content: t, link: null },
              annotations: { bold: false, italic: false, strikethrough: false,
                             underline: false, code: false, color: 'default' },
              plain_text: t, href: null }];
  };

  /* Unser Spaltentyp → Notions Typname in der API */
  const TYP_API: Record<string, string> = {
    title: 'title', text: 'rich_text', number: 'number', select: 'select',
    multi: 'multi_select', status: 'status', date: 'date', person: 'people',
    checkbox: 'checkbox', url: 'url', email: 'email', phone: 'phone_number',
    formula: 'formula', created: 'created_time', edited: 'last_edited_time',
    files: 'files', relation: 'relation', rollup: 'rollup', uid: 'unique_id',
    createdBy: 'created_by', editedBy: 'last_edited_by', button: 'button',
    /* Was Notion nicht kennt, kommt als das nächstliegende heraus — mit
       einem Zusatzfeld, damit klar ist, was es hier wirklich ist. */
    sterne: 'number', prozent: 'number', duration: 'number',
    place: 'rich_text', verify: 'checkbox',
    ki: 'rich_text', 'ki-fassung': 'rich_text', 'ki-sprache': 'rich_text',
    'ki-worte': 'multi_select'
  };

  const wertRaus = (zeile: any, key: any, coll: any) => {
    const def = coll.schema[key] || { type: 'text' };
    const typ = TYP_API[def.type] || 'rich_text';
    const roh = def.type === 'title' ? (zeile.text || '')
              : Datenbank.wert(zeile, key, coll);

    const huelle: Record<string, any> = { id: key, type: typ };
    /* Ein eigener Typ, den Notion nicht hat, wird ehrlich benannt */
    if (!['title','rich_text','number','select','multi_select','status','date',
          'people','checkbox','url','email','phone_number','formula',
          'created_time','last_edited_time','files','relation','rollup',
          'unique_id','created_by','last_edited_by','button'].includes(def.type)
        && TYP_API[def.type] && TYP_API[def.type] !== def.type)
      huelle.redion_type = def.type;

    switch (typ) {
      case 'title':     return { ...huelle, title: richText(roh) };
      case 'rich_text': return { ...huelle, rich_text: richText(roh) };
      case 'number':    return { ...huelle,
                          number: roh === '' || roh === null || roh === undefined
                            ? null : Number(roh) };
      case 'select':    return { ...huelle, select: roh ? { name: String(roh) } : null };
      case 'status':    return { ...huelle, status: roh ? { name: String(roh) } : null };
      case 'multi_select': return { ...huelle, multi_select:
                          (Array.isArray(roh) ? roh : String(roh || '').split(',').filter(Boolean))
                            .map(n => ({ name: String(n).trim() })) };
      case 'date': {
        if (!roh) return { ...huelle, date: null };
        const s = String(roh);
        const [a, e] = s.split(' → ');
        return { ...huelle, date: { start: a, end: e || null, time_zone: null } };
      }
      case 'people':    return { ...huelle, people:
                          (Array.isArray(roh) ? roh : [roh]).filter(Boolean)
                            .map(id => ({ object: 'user', id: String(id) })) };
      case 'checkbox':  return { ...huelle, checkbox: roh === true || roh === 'true' };
      case 'url':       return { ...huelle, url: roh ? String(roh) : null };
      case 'email':     return { ...huelle, email: roh ? String(roh) : null };
      case 'phone_number': return { ...huelle, phone_number: roh ? String(roh) : null };
      case 'files':     return { ...huelle, files:
                          (Array.isArray(roh) ? roh : []).map(f => ({
                            name: (f && f.name) || 'Datei', type: 'external',
                            external: { url: (f && f.url) || '' } })) };
      case 'relation':  return { ...huelle, relation:
                          (Array.isArray(roh) ? roh : []).map(id => ({ id: String(id) })),
                          has_more: false };
      case 'created_time':      return { ...huelle, created_time: zeile.created || null };
      case 'last_edited_time':  return { ...huelle, last_edited_time: zeile.edited || null };
      case 'created_by':        return { ...huelle, created_by:
                          { object: 'user', id: 'redion', name: zeile.erstelltVon || 'Ich' } };
      case 'last_edited_by':    return { ...huelle, last_edited_by:
                          { object: 'user', id: 'redion', name: zeile.geaendertVon || 'Ich' } };
      case 'unique_id':         return { ...huelle, unique_id:
                          { prefix: def.praefix || null, number: Number(roh) || 0 } };
      case 'button':            return { ...huelle, button: {} };
      case 'formula': {
        const t = typeof roh === 'number' ? 'number'
                : typeof roh === 'boolean' ? 'boolean'
                : (roh instanceof Date) ? 'date' : 'string';
        const wert = t === 'date' ? { start: roh.toISOString().slice(0, 10), end: null }
                                  : roh;
        return { ...huelle, formula: { type: t, [t]: wert === '' ? null : wert } };
      }
      case 'rollup': {
        const zahl = Number(roh);
        return { ...huelle, rollup: isNaN(zahl)
          ? { type: 'array', array: [], function: def.rollup || 'show_original' }
          : { type: 'number', number: zahl, function: def.rollup || 'sum' } };
      }
      default: return { ...huelle, rich_text: richText(roh) };
    }
  };

  /** Aus einem API-Wert wieder etwas, das Store versteht. */
  const wertRein = (v: any) => {
    if (v === null || v === undefined) return '';
    if (typeof v !== 'object') return v;
    if (Array.isArray(v.title))     return v.title.map((x: any) => x.plain_text ?? x.text?.content ?? '').join('');
    if (Array.isArray(v.rich_text)) return v.rich_text.map((x: any) => x.plain_text ?? x.text?.content ?? '').join('');
    if ('number' in v)   return v.number;
    if ('checkbox' in v) return !!v.checkbox;
    if ('url' in v)      return v.url ?? '';
    if ('email' in v)    return v.email ?? '';
    if ('phone_number' in v) return v.phone_number ?? '';
    if ('select' in v)   return v.select ? v.select.name : '';
    if ('status' in v)   return v.status ? v.status.name : '';
    if (Array.isArray(v.multi_select)) return v.multi_select.map((x: any) => x.name);
    if (Array.isArray(v.people))   return v.people.map((x: any) => x.id);
    if (Array.isArray(v.relation)) return v.relation.map((x: any) => x.id);
    if (Array.isArray(v.files))    return v.files.map((f: any) =>
      ({ name: f.name || 'Datei', url: (f.external && f.external.url) || (f.file && f.file.url) || '' }));
    if ('date' in v) {
      if (!v.date) return '';
      return v.date.end ? v.date.start + ' → ' + v.date.end : v.date.start;
    }
    return '';
  };

  /* ========================================================================
   * 4 · OBJEKTE
   * ======================================================================*/
  const elternVon = (b: any) => {
    if (!b) return { type: 'workspace', workspace: true };
    if (b.parentTable === 'collection')
      return { type: 'database_id', database_id: b.parentId };
    if (!b.parentId) return { type: 'workspace', workspace: true };
    return { type: 'page_id', page_id: b.parentId };
  };

  const seiteRaus = (b: any) => {
    const coll = b.parentTable === 'collection' ? Store.getCollection(b.parentId) : null;
    const props: Record<string, any> = {};
    if (coll) {
      Object.keys(coll.schema).forEach(k => { props[k] = wertRaus(b, k, coll); });
    } else {
      props.title = { id: 'title', type: 'title', title: richText(b.text || '') };
    }
    return {
      object: 'page', id: b.id,
      created_time: b.created || null, last_edited_time: b.edited || null,
      created_by: { object: 'user', id: 'redion' },
      last_edited_by: { object: 'user', id: 'redion' },
      cover: b.cover ? { type: 'external', external: { url: b.cover } } : null,
      icon: b.icon ? { type: 'emoji', emoji: b.icon } : null,
      parent: elternVon(b),
      archived: b.archiviert === true || b.alive === false,
      in_trash: b.alive === false,
      properties: props,
      url: location.origin + location.pathname + '#' + b.id
    };
  };

  /* Unser Blocktyp → Notions Blocktyp in der API */
  const BLOCK_API: Record<string, string> = {
    text: 'paragraph', h1: 'heading_1', h2: 'heading_2', h3: 'heading_3',
    bullet: 'bulleted_list_item', number: 'numbered_list_item', todo: 'to_do',
    toggle: 'toggle', quote: 'quote', callout: 'callout', divider: 'divider',
    code: 'code', equation: 'equation', image: 'image', video: 'video',
    audio: 'audio', file: 'file', bookmark: 'bookmark', embed: 'embed',
    table: 'table', toc: 'table_of_contents', breadcrumb: 'breadcrumb',
    columns: 'column_list', columns3: 'column_list', page: 'child_page',
    database: 'child_database', pageref: 'link_to_page', synced: 'synced_block',
    button: 'template', html: 'embed', chart: 'embed', whiteboard: 'embed',
    flashcard: 'toggle', backlinks: 'table_of_contents', linkeddb: 'child_database'
  };
  const API_BLOCK: Record<string, string> = {};
  Object.entries<any>(BLOCK_API).forEach(([a, b]) => { if (!(b in API_BLOCK)) API_BLOCK[b] = a; });

  const blockRaus = (b: any) => {
    const typ = BLOCK_API[b.type] || 'paragraph';
    const inhalt = { rich_text: richText(b.text || ''), color: b.color || 'default' };
    const kern: Record<string, any> = {};
    if (typ === 'to_do')        kern.to_do = { ...inhalt, checked: !!b.checked };
    else if (typ === 'code')    kern.code = { rich_text: richText(b.text || ''),
                                              language: b.lang || 'plain text', caption: [] };
    else if (typ === 'equation') kern.equation = { expression: b.text || '' };
    else if (typ === 'divider')  kern.divider = {};
    else if (typ === 'image' || typ === 'video' || typ === 'audio' || typ === 'file')
      kern[typ] = { type: 'external', external: { url: b.src || '' },
                    caption: richText(b.caption || '') };
    else if (typ === 'bookmark' || typ === 'embed')
      kern[typ] = { url: b.src || b.text || '', caption: richText(b.caption || '') };
    else if (typ === 'child_page')     kern.child_page = { title: b.text || '' };
    else if (typ === 'child_database') kern.child_database = { title: b.text || '' };
    else if (typ === 'link_to_page')   kern.link_to_page = { type: 'page_id', page_id: b.ziel || null };
    else if (typ === 'synced_block')   kern.synced_block =
      { synced_from: b.quelle ? { type: 'block_id', block_id: b.quelle } : null };
    else if (typ === 'table_of_contents') kern.table_of_contents = { color: 'default' };
    else if (typ === 'breadcrumb')     kern.breadcrumb = {};
    else if (typ === 'column_list')    kern.column_list = {};
    else if (typ === 'template')       kern.template = { rich_text: richText(b.text || '') };
    else if (typ === 'table')          kern.table = { table_width: (b.spalten || []).length || 3,
                                                     has_column_header: !!b.kopfzeile,
                                                     has_row_header: false };
    else kern[typ] = inhalt;

    const raus: Record<string, any> = {
      object: 'block', id: b.id, parent: elternVon(b),
      created_time: b.created || null, last_edited_time: b.edited || null,
      has_children: (b.content || []).length > 0,
      archived: b.alive === false, in_trash: b.alive === false,
      type: typ, ...kern
    };
    /* Bausteine, die es bei Notion nicht gibt, sagen das offen, statt sich
       als etwas anderes auszugeben. */
    if (!BLOCK_API[b.type] || ['html','chart','whiteboard','flashcard','backlinks']
        .includes(b.type)) raus.redion_type = b.type;
    return raus;
  };

  const datenbankRaus = (coll: any) => {
    const block = Object.values<any>(Store.cache.blocks)
      .find(b => b.type === 'database' && b.collectionId === coll.id);
    const props: Record<string, any> = {};
    Object.entries<any>(coll.schema).forEach(([k, d]) => {
      const typ = TYP_API[d.type] || 'rich_text';
      const p: Record<string, any> = { id: k, name: d.name || k, type: typ };
      if (typ === 'select' || typ === 'status' || typ === 'multi_select')
        p[typ] = { options: (d.options || []).map((o: any) => ({ name: String(o), color: 'default' })) };
      else if (typ === 'formula') p.formula = { expression: d.formula || '' };
      else if (typ === 'relation') p.relation = { database_id: d.ziel || null,
                                                  type: 'single_property', single_property: {} };
      else if (typ === 'rollup') p.rollup = { relation_property_name: d.relation || '',
                                              rollup_property_name: d.zielKey || '',
                                              function: d.rollup || 'count' };
      else p[typ] = {};
      if (TYP_API[d.type] !== d.type && !['title','text'].includes(d.type)) p.redion_type = d.type;
      props[k] = p;
    });
    return {
      object: 'database', id: coll.id,
      created_time: coll.created || null,
      last_edited_time: coll.edited || coll.created || null,
      title: richText(coll.name || ''),
      description: richText(coll.beschreibung || ''),
      icon: null, cover: null,
      parent: block ? elternVon(block) : { type: 'workspace', workspace: true },
      archived: false, is_inline: true,
      properties: props,
      url: location.origin + location.pathname + '#' + (block ? block.id : coll.id)
    };
  };

  /* ========================================================================
   * 5 · BLÄTTERN — start_cursor und has_more wie bei Notion
   * ======================================================================*/
  const blaettern = (liste: any, koerper: any, wandeln: any) => {
    const groesse = Math.min(Number(koerper.page_size) || SEITE_STANDARD, SEITE_MAX);
    let ab = 0;
    if (koerper.start_cursor) {
      const i = liste.findIndex((x: any) => (x.id || x) === koerper.start_cursor);
      ab = i < 0 ? 0 : i;
    }
    const stueck = liste.slice(ab, ab + groesse);
    const rest = liste.length > ab + groesse;
    return {
      object: 'list',
      results: stueck.map(wandeln),
      next_cursor: rest ? (liste[ab + groesse].id || null) : null,
      has_more: rest,
      type: 'page_or_database', page_or_database: {}
    };
  };

  /* ========================================================================
   * 6 · FILTER UND SORTIERUNG für /databases/{id}/query
   * ------------------------------------------------------------------------
   * Notions Filter sind verschachtelt: { and: [ … ] } oder
   * { property: "Name", number: { greater_than: 5 } }. Übersetzt wird in
   * unsere eigene Filterform, damit dieselbe Maschine rechnet wie in der
   * Oberfläche — sonst hätten wir zwei Wahrheiten.
   * ======================================================================*/
  const OP_API: Record<string, string> = {
    equals: 'ist', does_not_equal: 'ist nicht',
    contains: 'enthält', does_not_contain: 'enthält nicht',
    starts_with: 'beginnt mit', ends_with: 'endet mit',
    is_empty: 'ist leer', is_not_empty: 'ist nicht leer',
    greater_than: 'größer als', less_than: 'kleiner als',
    greater_than_or_equal_to: 'größer oder gleich',
    less_than_or_equal_to: 'kleiner oder gleich',
    before: 'ist vor', after: 'ist nach',
    on_or_before: 'ist am oder vor', on_or_after: 'ist am oder nach',
    past_week: 'ist letzte Woche', next_week: 'ist nächste Woche',
    this_week: 'ist diese Woche'
  };

  const filterRein = (f: any, coll: any) => {
    if (!f || typeof f !== 'object') return { operator: 'and', rules: [] };
    if (Array.isArray(f.and))
      return { operator: 'and', rules: f.and.map((x: any) => filterRein(x, coll)).flatMap(alsRegeln) };
    if (Array.isArray(f.or))
      return { operator: 'or',  rules: f.or.map((x: any) => filterRein(x, coll)).flatMap(alsRegeln) };

    const key = Object.keys(coll.schema).find(k =>
      k === f.property || coll.schema[k].name === f.property);
    if (!key) return { operator: 'and', rules: [] };

    /* Der Block hinter dem Typnamen enthält genau einen Vergleich */
    const block = Object.keys(f).find(k => k !== 'property' && f[k] && typeof f[k] === 'object');
    if (!block) return { operator: 'and', rules: [] };
    const [apiOp, wert] = Object.entries<any>(f[block])[0] || [];
    const op = apiOp === undefined ? undefined : OP_API[apiOp];
    if (!op) return { operator: 'and', rules: [] };
    /* Bei „ist leer" trägt Notion true als Wert — der gehört nicht in die Regel */
    const w = (apiOp === 'is_empty' || apiOp === 'is_not_empty') ? '' : wert;
    return { operator: 'and', rules: [{ key, op, wert: w }] };
  };
  const alsRegeln = (g: any) => (g.rules && g.rules.length === 1 && !g.rules[0].rules)
    ? g.rules : [g];

  const sortRein = (sorts: any, coll: any) => (sorts || []).map((s: any) => {
    if (s.timestamp) return { key: s.timestamp === 'created_time' ? '__created' : '__edited',
                              richtung: s.direction === 'descending' ? -1 : 1 };
    const key = Object.keys(coll.schema).find(k =>
      k === s.property || coll.schema[k].name === s.property);
    return key ? { key, richtung: s.direction === 'descending' ? -1 : 1 } : null;
  }).filter(Boolean);

  /* ========================================================================
   * 7 · DER EIGENTLICHE BEANTWORTER
   * ======================================================================*/
  const teile = (pfad: string) => pfad.replace(/^\/+|\/+$/g, '').split('/');

  /**
   * Beantwortet eine Anfrage.
   * @param {string} methode  GET, POST, PATCH, DELETE
   * @param {string} pfad     z. B. /v1/pages/abc
   * @param {object} koerper  schon geparstes JSON (oder {})
   * @param {object} kopf     Kopfzeilen, klein geschrieben
   * @returns {{status:number, body:object}}
   */
  const anfrage = (methode: any, pfad: string, koerper?: any, kopf?: any) => {
    koerper = koerper || {};
    kopf = kopf || {};
    const m = String(methode || 'GET').toUpperCase();

    /* --- Fassung: fehlt sie, ist es ein Fehler — genau wie bei Notion --- */
    const fassung = kopf['notion-version'] || kopf['redion-version'];
    if (!fassung)
      return fehler(400, 'missing_version',
        'Notion-Version header failed validation: Notion-Version header should be defined, ' +
        'instead was `undefined`.');

    /* --- Token --------------------------------------------------------- */
    const erwartet = tokenHolen();
    const gegeben = String(kopf.authorization || '').replace(/^Bearer\s+/i, '');
    if (!erwartet)
      return fehler(401, 'unauthorized',
        'Es ist noch kein Token angelegt. In den Einstellungen unter „Schnittstelle" ' +
        'lässt sich eines erzeugen.');
    if (gegeben !== erwartet)
      return fehler(401, 'unauthorized', 'API token is invalid.');

    const t = teile(String(pfad));
    if (t[0] !== 'v1') return fehler(404, 'object_not_found', 'Unbekannter Pfad: ' + pfad);
    const bereich = t[1], id = t[2], unter = t[3], unterId = t[4];

    /* Schreibende Zugriffe über die Schnittstelle gehören ins Protokoll —
       lesende nicht, sonst ersäuft es in Abfragen. */
    if (typeof Protokoll !== 'undefined' && ['POST', 'PATCH', 'DELETE'].includes(m) &&
        !(bereich === 'databases' && unter === 'query') && bereich !== 'search')
      Protokoll.notieren('api', m + ' ' + pfad, { id: id || null });

    try {
      /* ---------------- Seiten ----------------------------------------- */
      if (bereich === 'pages') {
        if (m === 'POST' && !id) return seiteAnlegen(koerper);
        if (!id) return fehler(400, 'validation_error', 'Es fehlt die ID.');
        const b = Store.getBlock(id);
        if (!b) return fehler(404, 'object_not_found',
          'Could not find page with ID: ' + id + '.');

        if (unter === 'properties') {
          if (!unterId) return fehler(400, 'validation_error', 'Es fehlt der Eigenschaftsname.');
          const coll = b.parentTable === 'collection' ? Store.getCollection(b.parentId) : null;
          if (!coll || !coll.schema[unterId])
            return fehler(404, 'object_not_found', 'Diese Eigenschaft gibt es nicht.');
          const w = wertRaus(b, unterId, coll);
          return { status: 200, body: { object: 'property_item', ...w } };
        }
        if (m === 'GET')   return { status: 200, body: seiteRaus(b) };
        if (m === 'PATCH') return seiteAendern(b, koerper);
        return fehler(405, 'invalid_request', m + ' geht hier nicht.');
      }

      /* ---------------- Blöcke ----------------------------------------- */
      if (bereich === 'blocks') {
        if (!id) return fehler(400, 'validation_error', 'Es fehlt die ID.');
        const b = Store.getBlock(id);
        if (!b) return fehler(404, 'object_not_found',
          'Could not find block with ID: ' + id + '.');

        if (unter === 'children') {
          if (m === 'GET') {
            const kinder = Store.childrenOf(id);
            return { status: 200,
                     body: { ...blaettern(kinder, koerper, blockRaus),
                             type: 'block', block: {} } };
          }
          if (m === 'PATCH') return kinderAnhaengen(b, koerper);
          return fehler(405, 'invalid_request', m + ' geht hier nicht.');
        }
        if (m === 'GET')    return { status: 200, body: blockRaus(b) };
        if (m === 'PATCH')  return blockAendern(b, koerper);
        if (m === 'DELETE') { Store.trashBlock(id); App.zeichneSeite();
                              return { status: 200, body: blockRaus(Store.getBlock(id)) }; }
        return fehler(405, 'invalid_request', m + ' geht hier nicht.');
      }

      /* ---------------- Datenbanken ------------------------------------ */
      if (bereich === 'databases') {
        if (m === 'POST' && !id) return datenbankAnlegen(koerper);
        if (!id) return fehler(400, 'validation_error', 'Es fehlt die ID.');
        const coll = Store.getCollection(id);
        if (!coll) return fehler(404, 'object_not_found',
          'Could not find database with ID: ' + id + '.');

        if (unter === 'query' && m === 'POST') return abfragen(coll, koerper);
        if (m === 'GET')   return { status: 200, body: datenbankRaus(coll) };
        if (m === 'PATCH') return datenbankAendern(coll, koerper);
        return fehler(405, 'invalid_request', m + ' geht hier nicht.');
      }

      /* ---------------- Suche ------------------------------------------ */
      if (bereich === 'search' && m === 'POST') return suchen(koerper);

      /* ---------------- Nutzer ----------------------------------------- */
      if (bereich === 'users') {
        const ich = { object: 'user', id: 'redion', name: Store.getMeta('nutzer', 'Ich'),
                      avatar_url: null, type: 'person',
                      person: { email: Store.getMeta('email', '') || null } };
        if (id === 'me' || !id)
          return id === 'me'
            ? { status: 200, body: ich }
            : { status: 200, body: { object: 'list', results: [ich],
                                     next_cursor: null, has_more: false,
                                     type: 'user', user: {} } };
        return id === 'redion' ? { status: 200, body: ich }
          : fehler(404, 'object_not_found', 'Diesen Nutzer gibt es nicht.');
      }

      /* ---------------- Kommentare ------------------------------------- */
      if (bereich === 'comments') {
        if (m === 'GET')  return kommentareLesen(koerper, kopf);
        if (m === 'POST') return kommentarSchreiben(koerper);
      }

      return fehler(404, 'object_not_found', 'Unbekannter Pfad: ' + pfad);
    } catch (e: unknown) {
      return fehler(500, 'internal_server_error', e instanceof Error ? e.message : String(e));
    }
  };

  /* ========================================================================
   * 8 · DIE EINZELNEN HANDGRIFFE
   * ======================================================================*/
  const seiteAnlegen = (k: any) => {
    const eltern = k.parent || {};
    const props = k.properties || {};

    if (eltern.database_id) {
      const coll = Store.getCollection(eltern.database_id);
      if (!coll) return fehler(404, 'object_not_found', 'Diese Datenbank gibt es nicht.');
      const werte: Record<string, any> = {};
      Object.entries<any>(props).forEach(([name, v]) => {
        const key = Object.keys(coll.schema).find(x => x === name || coll.schema[x].name === name);
        if (key) werte[key] = wertRein(v);
      });
      const zeile = Store.addRow(coll.id, werte);
      const titelKey = Object.keys(coll.schema).find(x => coll.schema[x].type === 'title');
      if (titelKey && werte[titelKey] !== undefined)
        Store.updateBlock(zeile.id, { text: String(werte[titelKey]) });
      if (k.icon && k.icon.emoji) Store.updateBlock(zeile.id, { icon: k.icon.emoji });
      if (Array.isArray(k.children)) kinderAnhaengen(Store.getBlock(zeile.id), { children: k.children });
      App.zeichneSeite();
      return { status: 200, body: seiteRaus(Store.getBlock(zeile.id)) };
    }

    const elternId = eltern.page_id || null;
    if (elternId && !Store.getBlock(elternId))
      return fehler(404, 'object_not_found', 'Diese Elternseite gibt es nicht.');
    const titel = wertRein(props.title || props.Name) || 'Ohne Titel';
    const seite = Store.addPage(elternId, { text: String(titel) });
    if (k.icon && k.icon.emoji) Store.updateBlock(seite.id, { icon: k.icon.emoji });
    if (Array.isArray(k.children)) kinderAnhaengen(seite, { children: k.children });
    App.zeichneBaum();
    return { status: 200, body: seiteRaus(Store.getBlock(seite.id)) };
  };

  const seiteAendern = (b: any, k: any) => {
    const coll = b.parentTable === 'collection' ? Store.getCollection(b.parentId) : null;
    Object.entries<any>(k.properties || {}).forEach(([name, v]) => {
      if (!coll) {
        if (v && (v.title || v.rich_text)) Store.updateBlock(b.id, { text: String(wertRein(v)) });
        return;
      }
      const key = Object.keys(coll.schema).find(x => x === name || coll.schema[x].name === name);
      if (!key) return;
      if (coll.schema[key].type === 'title') Store.updateBlock(b.id, { text: String(wertRein(v)) });
      else Store.setProp(b.id, key, wertRein(v));
    });
    if (k.icon && k.icon.emoji) Store.updateBlock(b.id, { icon: k.icon.emoji });
    if (k.archived === true || k.in_trash === true) Store.trashBlock(b.id);
    if (k.archived === false && b.alive === false) Store.restoreBlock(b.id);
    App.zeichneSeite();
    return { status: 200, body: seiteRaus(Store.getBlock(b.id)) };
  };

  const kinderAnhaengen = (b: any, k: any) => {
    const liste = Array.isArray(k.children) ? k.children : [];
    if (!liste.length) return fehler(400, 'validation_error', 'children fehlt oder ist leer.');
    const nachher = k.after || null;
    let idx = -1;
    if (nachher) {
      const e = Store.getBlock(b.id);
      idx = (e.content || []).indexOf(nachher) + 1;
    }
    const neu: any[] = [];
    liste.forEach((c: any) => {
      const typ = API_BLOCK[c.type] || 'text';
      const inhalt = c[c.type] || {};
      const text = Array.isArray(inhalt.rich_text)
        ? inhalt.rich_text.map((x: any) => x.plain_text ?? x.text?.content ?? '').join('')
        : (inhalt.title || inhalt.expression || inhalt.url || '');
      const patch: Record<string, any> = { text: String(text) };
      if (c.type === 'to_do')     patch.checked = !!inhalt.checked;
      if (c.type === 'code')      patch.lang = inhalt.language || 'plain text';
      if (['image','video','audio','file','bookmark','embed'].includes(c.type))
        patch.src = (inhalt.external && inhalt.external.url) || inhalt.url || '';
      const angelegt = Store.addBlock(b.id, typ, patch, idx);
      if (idx >= 0) idx++;
      neu.push(angelegt);
    });
    App.zeichneSeite();
    return { status: 200,
             body: { object: 'list', results: neu.map(blockRaus),
                     next_cursor: null, has_more: false, type: 'block', block: {} } };
  };

  const blockAendern = (b: any, k: any) => {
    const inhalt = k[k.type] || k.paragraph || k.to_do || {};
    if (Array.isArray(inhalt.rich_text))
      Store.updateBlock(b.id, { text: inhalt.rich_text
        .map((x: any) => x.plain_text ?? x.text?.content ?? '').join('') });
    if ('checked' in inhalt) Store.updateBlock(b.id, { checked: !!inhalt.checked });
    if (k.archived === true) Store.trashBlock(b.id);
    App.zeichneSeite();
    return { status: 200, body: blockRaus(Store.getBlock(b.id)) };
  };

  const datenbankAnlegen = (k: any) => {
    const eltern = (k.parent || {}).page_id || null;
    const name = Array.isArray(k.title)
      ? k.title.map((x: any) => x.plain_text ?? x.text?.content ?? '').join('') : 'Neue Datenbank';
    const schema: Record<string, any> = {};
    Object.entries<any>(k.properties || {}).forEach(([nm, d]) => {
      const typ = Object.keys(d || {})[0] || 'rich_text';
      const unser = Object.keys(TYP_API).find(x => TYP_API[x] === typ) || 'text';
      const key = unser === 'title' ? 'title' : Ids.short(6);
      schema[key] = { name: nm, type: unser };
      if (d[typ] && Array.isArray(d[typ].options))
        schema[key].options = d[typ].options.map((o: any) => o.name);
      if (d.formula) schema[key].formula = d.formula.expression || '';
    });
    if (!Object.values<any>(schema).some(s => s.type === 'title'))
      schema.title = { name: 'Name', type: 'title' };
    const db = Store.addDatabase(eltern, name, schema);
    App.zeichneSeite();
    return { status: 200, body: datenbankRaus(Store.getCollection(db.collectionId)) };
  };

  const datenbankAendern = (coll: any, k: any) => {
    const patch: Record<string, any> = {};
    if (Array.isArray(k.title))
      patch.name = k.title.map((x: any) => x.plain_text ?? x.text?.content ?? '').join('');
    if (k.properties) {
      const schema = { ...coll.schema };
      Object.entries<any>(k.properties).forEach(([nm, d]) => {
        const key = Object.keys(schema).find(x => x === nm || schema[x].name === nm);
        if (d === null) { if (key) delete schema[key]; return; }
        const typ = Object.keys(d || {}).find(x => x !== 'name');
        const unser = Object.keys(TYP_API).find(x => TYP_API[x] === typ);
        const ziel = key || Ids.short(6);
        schema[ziel] = { ...(schema[ziel] || {}), name: d.name || nm };
        if (unser) schema[ziel].type = unser;
        if (!schema[ziel].type) schema[ziel].type = 'text';
        if (typ && d[typ] && Array.isArray(d[typ].options))
          schema[ziel].options = d[typ].options.map((o: any) => o.name);
      });
      patch.schema = schema;
    }
    Store.updateCollection(coll.id, patch);
    App.zeichneSeite();
    return { status: 200, body: datenbankRaus(Store.getCollection(coll.id)) };
  };

  const abfragen = (coll: any, k: any) => {
    let zeilen = Store.rowsOf(coll.id);
    if (k.filter) {
      const f = filterRein(k.filter, coll);
      zeilen = zeilen.filter((z: any) => Datenbank.gruppeTrifftZu(z, f, coll));
    }
    const sorts = sortRein(k.sorts, coll);
    if (sorts.length) {
      zeilen = zeilen.slice().sort((a: any, b2: any) => {
        for (const s of sorts) {
          const wa = s.key === '__created' ? a.created
                   : s.key === '__edited'  ? a.edited
                   : Datenbank.wert(a, s.key, coll);
          const wb = s.key === '__created' ? b2.created
                   : s.key === '__edited'  ? b2.edited
                   : Datenbank.wert(b2, s.key, coll);
          const A = wa === null || wa === undefined ? '' : wa;
          const B = wb === null || wb === undefined ? '' : wb;
          if (A < B) return -1 * s.richtung;
          if (A > B) return  1 * s.richtung;
        }
        return 0;
      });
    }
    return { status: 200, body: blaettern(zeilen, k, seiteRaus) };
  };

  const suchen = (k: any) => {
    const frage = String(k.query || '').toLowerCase();
    const nurTyp = (k.filter || {}).value;      /* 'page' oder 'database' */
    let treffer = [];

    if (nurTyp !== 'database') {
      treffer = Object.values<any>(Store.cache.blocks)
        .filter(b => b.alive !== false && (b.type === 'page' || b.parentTable === 'collection'))
        .filter(b => !frage || String(b.text || '').toLowerCase().includes(frage))
        .map(b => ({ __art: 'page', ...b }));
    }
    if (nurTyp !== 'page') {
      const dbs = Object.values<any>(Store.cache.collections)
        .filter(c => !frage || String(c.name || '').toLowerCase().includes(frage))
        .map(c => ({ __art: 'db', id: c.id, edited: c.edited || c.created }));
      treffer = treffer.concat(dbs);
    }
    /* Notion sortiert standardmässig nach letzter Änderung, absteigend */
    const richtung = ((k.sort || {}).direction === 'ascending') ? 1 : -1;
    treffer.sort((a, b) => (String(a.edited || '') < String(b.edited || '') ? -1 : 1) * richtung);

    return { status: 200, body: blaettern(treffer, k, (x: any) =>
      x.__art === 'db' ? datenbankRaus(Store.getCollection(x.id))
                       : seiteRaus(Store.getBlock(x.id))) };
  };

  const kommentareLesen = (k: any, kopf: any) => {
    const id = k.block_id || (kopf['x-block-id'] || '');
    const b = Store.getBlock(id);
    if (!b) return fehler(404, 'object_not_found', 'Diesen Block gibt es nicht.');
    const liste = (b.kommentare || []).map((c: any) => ({
      object: 'comment', id: c.id, parent: { type: 'block_id', block_id: b.id },
      discussion_id: c.id, created_time: c.zeit || null, last_edited_time: c.zeit || null,
      created_by: { object: 'user', id: 'redion', name: c.autor || 'Ich' },
      rich_text: richText(c.text || '')
    }));
    return { status: 200, body: { object: 'list', results: liste,
                                  next_cursor: null, has_more: false,
                                  type: 'comment', comment: {} } };
  };

  const kommentarSchreiben = (k: any) => {
    const id = (k.parent || {}).page_id || (k.parent || {}).block_id;
    const b = Store.getBlock(id);
    if (!b) return fehler(404, 'object_not_found', 'Diesen Block gibt es nicht.');
    const text = Array.isArray(k.rich_text)
      ? k.rich_text.map((x: any) => x.plain_text ?? x.text?.content ?? '').join('') : '';
    if (!text) return fehler(400, 'validation_error', 'rich_text fehlt.');
    const c = { id: Store.uid(), text, autor: Store.getMeta('nutzer', 'Ich'),
                zeit: Store.now(), erledigt: false, antworten: [], reaktionen: {} };
    Store.updateBlock(b.id, { kommentare: [...(b.kommentare || []), c] });
    App.zeichneSeite();
    return { status: 200, body: { object: 'comment', id: c.id,
             parent: { type: 'block_id', block_id: b.id }, discussion_id: c.id,
             created_time: c.zeit, last_edited_time: c.zeit,
             created_by: { object: 'user', id: 'redion', name: c.autor },
             rich_text: richText(text) } };
  };

  /* ========================================================================
   * 9 · DER WEG VON AUSSEN: echte fetch()-Aufrufe
   * ------------------------------------------------------------------------
   * Der Servicearbeiter fängt /v1/… ab und fragt hier nach. So funktioniert
   * ein ganz gewöhnliches fetch('/v1/pages/…') aus jedem Skript auf der
   * Seite — ohne dass irgendwo ein Server läuft.
   * ======================================================================*/
  const horchen = () => {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.art !== 'api-anfrage' || !e.ports || !e.ports[0]) return;
      let erg;
      try {
        /* Notions interne Adressen beantwortet das Transaktionsmodul */
        erg = /\/api\/v3\//.test(d.pfad) && typeof Transaktion !== 'undefined'
          ? Transaktion.anfrage(d.methode, d.pfad, d.koerper, d.kopf)
          : anfrage(d.methode, d.pfad, d.koerper, d.kopf);
      }
      catch (err: unknown) { erg = fehler(500, 'internal_server_error',
        err instanceof Error ? err.message : String(err)); }
      e.ports[0].postMessage(erg);
    });
  };

  /* ========================================================================
   * 10 · DAS FENSTER — Token verwalten und Anfragen ausprobieren
   * ======================================================================*/
  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  const BEISPIELE = [
    ['GET',  '/v1/users/me', ''],
    ['POST', '/v1/search', '{"query": ""}'],
    ['GET',  '/v1/blocks/{seite}/children', ''],
    ['POST', '/v1/pages',
      '{\n  "parent": { "page_id": "{seite}" },\n' +
      '  "properties": { "title": { "title": [ { "text": { "content": "Über die API" } } ] } }\n}']
  ];

  const dialog = () => {
    const seite = App.aktuelleSeite && App.aktuelleSeite();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        '<div class="fh">🔌 Schnittstelle /v1/ <button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" style="padding:16px; display:flex; flex-direction:column; gap:13px">' +
          '<div style="font-size:12.5px; color:var(--text-dim); line-height:1.6">' +
            'Dieselben Adressen, Formen und Fehlercodes wie Notions API — beantwortet ' +
            'im Browser aus den Daten, die hier liegen. Ein <code>fetch(\'/v1/…\')</code> ' +
            'aus einem Skript auf dieser Seite funktioniert wirklich.<br>' +
            '<b>Was nicht geht:</b> Anfragen aus dem Internet. Dafür bräuchte es einen ' +
            'Server — und dann lägen die Daten dort, nicht hier.' +
          '</div>' +
          '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">' +
            '<input id="api-token" readonly style="flex:1; min-width:200px; font-family:monospace; ' +
              `font-size:12px" value="${esc(tokenHolen() || '— noch keines —')}">` +
            '<button data-a="neu">Neues Token</button>' +
            '<button data-a="kopie">Kopieren</button>' +
            '<button data-a="weg" class="rot">Zurückziehen</button>' +
          '</div>' +
          '<div style="display:flex; gap:7px; flex-wrap:wrap">' +
            '<select id="api-m" style="width:96px">' +
              ['GET', 'POST', 'PATCH', 'DELETE'].map(x => `<option>${x}</option>`).join('') +
            '</select>' +
            '<input id="api-p" style="flex:1; min-width:200px; font-family:monospace; font-size:12.5px" ' +
              'value="/v1/users/me">' +
            '<button data-a="los" class="prim">Absenden</button>' +
          '</div>' +
          '<div style="display:flex; gap:6px; flex-wrap:wrap">' +
            BEISPIELE.map(([m, pf], i) =>
              `<button data-bsp="${i}" style="font-size:12px; padding:4px 9px">${m} ${esc(pf)}</button>`).join('') +
          '</div>' +
          '<textarea id="api-k" rows="4" spellcheck="false" placeholder="JSON-Körper — bei GET leer lassen" ' +
            'style="font-family:monospace; font-size:12.5px"></textarea>' +
          '<pre id="api-aus" style="font-size:12px; background:var(--bg-code,rgba(0,0,0,.05)); ' +
            'padding:11px; border-radius:7px; max-height:260px; overflow:auto; ' +
            'white-space:pre-wrap; margin:0">Noch nichts abgeschickt.</pre>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);

    /* Die fünf Felder des Fensters einmal holen — und ehrlich sein, wenn
       eines fehlt, statt an jeder Stelle ungeprüft `.value` zu schreiben. */
    const feld = (id: string) => o.querySelector<HTMLInputElement>(id);
    const ausgabe = () => o.querySelector<HTMLElement>('#api-aus');

    const setzeToken = (): void => {
      const t = feld('#api-token');
      if (t) t.value = tokenHolen() || '— noch keines —';
    };

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const bsp = elVon(e)?.closest<HTMLElement>('[data-bsp]');
      if (bsp) {
        const bspZeile = BEISPIELE[Number(bsp.dataset.bsp)];
        if (!bspZeile) return;
        const [m, pf, k] = bspZeile;
        const fm = feld('#api-m'), fp = feld('#api-p'), fk = feld('#api-k');
        if (fm) fm.value = m ?? '';
        if (fp) fp.value = (pf ?? '').replace('{seite}', seite || '');
        if (fk) fk.value = (k ?? '').replace('{seite}', seite || '');
        return;
      }
      const a = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'neu')   { tokenNeu(); setzeToken(); UI.toast('Neues Token angelegt'); }
      if (a.dataset.a === 'weg')   { tokenWeg(); setzeToken(); UI.toast('Token zurückgezogen'); }
      if (a.dataset.a === 'kopie') {
        Ablage.kopiereJetzt(tokenHolen() || '', 'Token kopiert');
      }
      if (a.dataset.a === 'los') {
        const fm = feld('#api-m'), fp = feld('#api-p'), fk = feld('#api-k');
        const aus = ausgabe();
        if (!fm || !fp || !fk || !aus) return;
        const roh = fk.value.trim();
        let k = {};
        if (roh) {
          try { k = JSON.parse(roh); }
          catch { aus.textContent = 'Der Körper ist kein gültiges JSON.'; return; }
        }
        const erg = anfrage(fm.value, fp.value, k, { 'notion-version': FASSUNG,
                                        authorization: 'Bearer ' + tokenHolen() });
        aus.textContent =
          'HTTP ' + erg.status + '\n\n' + JSON.stringify(erg.body, null, 2);
      }
    });
  };

  const start = () => { horchen(); };

  return { anfrage, start, dialog, tokenHolen, tokenNeu, tokenWeg,
           FASSUNG, TYP_API, BLOCK_API, API_BLOCK,
           seiteRaus, blockRaus, datenbankRaus, wertRaus, wertRein,
           filterRein, sortRein, richText };
})();

(window as any).Api = Api;
