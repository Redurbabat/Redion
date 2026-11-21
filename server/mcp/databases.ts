/* Datenbanken für den Cloud-MCP (Redur, 21. November 2026: „ich will das die
 * über mcp auf alles zugreif haben komplet alles").
 *
 * Aufbau wie in der App (src/kern/ablage/indexdb.ts, addDatabase/addRow):
 *   Block (type 'database', collectionId) → Sammlung (schema, viewIds) → Ansicht
 *   Zeile = Block mit type 'page', parentTable 'collection', parentId = Sammlung,
 *           Werte unter `props`, nach Spaltenschlüssel.
 * Werte werden typgerecht gespeichert (§17): Auswahl als Name, Mehrfachauswahl
 * als Liste, Datum als JJJJ-MM-TT (Spanne „a → b"), Kästchen als Wahrheitswert.
 */

export class DatabaseError extends Error {}
const fail = (m: string): never => { throw new DatabaseError(m); };

/** Spaltentypen, die eine KI SETZEN darf. Formeln, Rollups, Verknüpfungen,
 *  Zeitstempel und Dateien rechnet oder verwaltet die App selbst. */
export const WRITABLE_TYPES = ['title', 'text', 'number', 'select', 'multi', 'status', 'date', 'checkbox',
  'sterne', 'prozent', 'url', 'email', 'phone', 'place'] as const;
export const LAYOUTS = ['table', 'board', 'list', 'gallery', 'calendar', 'timeline'] as const;
const FARBEN = ['gray', 'blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'brown'];
export const LIMITS = { spalten: 40, zeilen: 200, optionen: 50 };

export type Column = { name: string; type: string; options?: Array<{ name: string; color: string }> };
export type Schema = Record<string, Column>;

/** Ein Spaltenschlüssel wie Ids.short: nie rein numerisch (E96). */
export const columnKey = (seed: string, i: number): string =>
  'k' + (seed + i.toString(36)).replace(/[^a-z0-9]/gi, '').slice(-5);

export const buildSchema = (spalten: unknown, seed: string): Schema => {
  if (!Array.isArray(spalten) || !spalten.length) fail('spalten muss eine nicht leere Liste sein.');
  const liste = spalten as any[];
  if (liste.length > LIMITS.spalten) fail('Höchstens ' + LIMITS.spalten + ' Spalten.');
  const schema: Schema = {};
  const namen = new Set<string>();
  let titel = false;
  liste.forEach((s, i) => {
    const name = typeof s?.name === 'string' ? s.name.trim().slice(0, 80) : '';
    if (!name) fail('Spalte ' + (i + 1) + ' hat keinen Namen.');
    if (namen.has(name.toLocaleLowerCase())) fail('Die Spalte „' + name + '“ gibt es zweimal.');
    namen.add(name.toLocaleLowerCase());
    const type = String(s?.typ ?? s?.type ?? 'text');
    if (!(WRITABLE_TYPES as readonly string[]).includes(type))
      fail('Spaltentyp „' + type + '“ geht hier nicht. Erlaubt: ' + WRITABLE_TYPES.join(', '));
    const col: Column = { name, type };
    if (type === 'select' || type === 'multi' || type === 'status') {
      const roh = Array.isArray(s?.optionen) ? s.optionen : [];
      if (roh.length > LIMITS.optionen) fail('Höchstens ' + LIMITS.optionen + ' Optionen je Spalte.');
      col.options = [...new Set(roh.map((o: unknown) => String(o).trim().slice(0, 80)).filter(Boolean))]
        .map((o, k) => ({ name: o as string, color: FARBEN[k % FARBEN.length]! }));
      if (type === 'status' && !col.options.length)
        col.options = [{ name: 'Offen', color: 'gray' }, { name: 'In Arbeit', color: 'blue' }, { name: 'Erledigt', color: 'green' }];
    }
    if (type === 'title') {
      if (titel) fail('Nur eine Spalte darf vom Typ title sein.');
      titel = true; schema.title = col;
    } else schema[columnKey(seed, i)] = col;
  });
  /* Jede Datenbank der App hat eine Titelspalte unter dem Schlüssel `title`. */
  if (!titel) return { title: { name: 'Name', type: 'title' }, ...schema };
  return { title: schema.title!, ...Object.fromEntries(Object.entries(schema).filter(([k]) => k !== 'title')) };
};

const datum = (v: unknown): string => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const teile = s.split(/\s*(?:→|->)\s*/);
  const eins = (t: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(t);
    if (!m) fail('Datum „' + t + '“: bitte als JJJJ-MM-TT.');
    return m![1] + '-' + m![2] + '-' + m![3];
  };
  return teile.length === 2 ? eins(teile[0]!) + ' → ' + eins(teile[1]!) : eins(s);
};

/** Ein Wert für eine Spalte, typgerecht. Neue Auswahl-Optionen werden ergänzt. */
export const coerceValue = (col: Column, v: unknown): unknown => {
  if (v === null || v === undefined) return col.type === 'checkbox' ? false : col.type === 'multi' ? [] : '';
  switch (col.type) {
    case 'number': case 'sterne': case 'prozent': {
      const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
      if (!Number.isFinite(n)) fail('„' + col.name + '“ braucht eine Zahl.');
      return n;
    }
    case 'checkbox':
      return v === true || /^(wahr|ja|x|1|true|✓)$/i.test(String(v));
    case 'date':
      return datum(v);
    case 'select': case 'status': {
      const name = String(v).trim().slice(0, 80);
      if (name) addOption(col, name);
      return name;
    }
    case 'multi': {
      const liste = (Array.isArray(v) ? v : String(v).split(/[;,]/)).map(x => String(x).trim().slice(0, 80)).filter(Boolean);
      liste.forEach(n => addOption(col, n));
      return [...new Set(liste)];
    }
    default:
      return String(v).slice(0, 4000);
  }
};
const addOption = (col: Column, name: string) => {
  col.options = col.options ?? [];
  if (col.options.some(o => o.name === name)) return;
  if (col.options.length >= LIMITS.optionen) fail('„' + col.name + '“ hat schon ' + LIMITS.optionen + ' Optionen.');
  col.options.push({ name, color: FARBEN[col.options.length % FARBEN.length]! });
};

/** Werte nach Spaltenname → props nach Spaltenschlüssel. */
export const rowProps = (schema: Schema, werte: unknown): { props: Record<string, unknown>; title: string } => {
  if (!werte || typeof werte !== 'object' || Array.isArray(werte)) fail('Eine Zeile ist ein Objekt aus Spaltenname → Wert.');
  const nachName = new Map(Object.entries(schema).map(([k, c]) => [c.name.toLocaleLowerCase(), k]));
  const props: Record<string, unknown> = {};
  for (const [name, wert] of Object.entries(werte as Record<string, unknown>)) {
    const key = nachName.get(name.trim().toLocaleLowerCase()) ?? (schema[name] ? name : undefined);
    if (!key) fail('Keine Spalte „' + name + '“. Spalten: ' + Object.values(schema).map(c => c.name).join(', '));
    const col = schema[key!]!;
    if (!(WRITABLE_TYPES as readonly string[]).includes(col.type)) fail('„' + col.name + '“ (' + col.type + ') rechnet die App selbst.');
    props[key!] = coerceValue(col, wert);
  }
  return { props, title: String(props.title ?? '') };
};

/** Zeile lesbar: Spaltenname → Wert. */
export const describeRow = (schema: Schema, row: any) => {
  const out: Record<string, unknown> = {};
  for (const [k, c] of Object.entries(schema)) {
    const v = k === 'title' ? (row?.props?.title ?? row?.text ?? '') : row?.props?.[k];
    if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) out[c.name] = v;
  }
  return out;
};

/** Sammlung, Ansicht und Block einer neuen Datenbank — die Sätze, wie
 *  `Store.addDatabase` sie anlegt. Gemeinsam für den MCP und test643. */
export const databaseRecords = (o: { name: string; schema: Schema; layout: string; pageId: string; seed: string; at: string }) => {
  const colId = ('c' + o.seed).slice(0, 64), viewId = ('v' + o.seed).slice(0, 64), blockId = ('d' + o.seed).slice(0, 64);
  const gruppe = Object.entries(o.schema).find(([, c]) => c.type === 'status' || c.type === 'select')?.[0] ?? '';
  const namen: Record<string, string> = { table: 'Tabelle', board: 'Board', list: 'Liste', gallery: 'Galerie', calendar: 'Kalender', timeline: 'Zeitleiste' };
  return {
    colId, viewId, blockId,
    collection: { id: colId, name: o.name, icon: '🗂️', schema: o.schema, viewIds: [viewId], created: o.at, edited: o.at },
    view: { id: viewId, collectionId: colId, name: namen[o.layout] ?? 'Tabelle', layout: o.layout,
      filters: { operator: 'and', rules: [] }, sorts: [], groupBy: o.layout === 'board' ? gruppe : '', hidden: [], calc: {},
      created: o.at, edited: o.at },
    block: { id: blockId, type: 'database', text: o.name, content: [], parentId: o.pageId, parentTable: 'block', color: '',
      created: o.at, edited: o.at, erstelltVon: 'ChatGPT', alive: true, herkunft: 'ki', collectionId: colId },
  };
};
/** Eine Zeile, wie `Store.addRow` sie anlegt. */
export const rowRecord = (id: string, colId: string, props: Record<string, unknown>, title: string, at: string, folge: number) =>
  ({ id, type: 'page', text: title, icon: '', props, content: [], parentId: colId, parentTable: 'collection',
     erstelltVon: 'ChatGPT', created: at, edited: at, folge, alive: true, herkunft: 'ki' });

export const describeSchema =(schema: Schema) => Object.values(schema).map(c => ({
  name: c.name, typ: c.type, ...(c.options ? { optionen: c.options.map(o => o.name) } : {}),
  schreibbar: (WRITABLE_TYPES as readonly string[]).includes(c.type) }));
