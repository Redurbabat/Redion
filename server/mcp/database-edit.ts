type RecordData = Record<string, unknown>;

const isObject = (value: unknown): value is RecordData =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const validKey = (key: string): boolean =>
  /^[A-Za-z0-9_-]{1,128}$/.test(key) && !Object.hasOwn(Object.prototype, key) && key !== 'prototype';

export const databaseBatchLimit = 10;
export const databaseFieldLimit = 20;

export function parseDatabaseChanges(input: unknown) {
  if (!Array.isArray(input) || !input.length || input.length > databaseBatchLimit)
    throw new Error('Ein Stapel muss 1–10 Zeilen enthalten.');
  const rowIds = new Set<string>();
  return input.map(entry => {
    if (!isObject(entry) || Object.keys(entry).some(key => !['rowId', 'expectedVersion', 'values'].includes(key)) ||
        typeof entry.rowId !== 'string' || !validKey(entry.rowId) || rowIds.has(entry.rowId) ||
        typeof entry.expectedVersion !== 'number' || !Number.isSafeInteger(entry.expectedVersion) || entry.expectedVersion < 1 ||
        !isObject(entry.values)) throw new Error('Ungültige Zeilenänderung oder doppelte Zeilenkennung.');
    const values = Object.entries(entry.values);
    if (!values.length || values.length > databaseFieldLimit || values.some(([key]) => !validKey(key)))
      throw new Error('Je Zeile 1–20 gültige Feldkennungen angeben.');
    rowIds.add(entry.rowId);
    return {rowId:entry.rowId, expectedVersion:entry.expectedVersion, values};
  });
}

export function applyDatabaseValues(row: RecordData, schema: RecordData, values: [string, unknown][], edited: string) {
  if (row.props !== undefined && !isObject(row.props)) throw new Error('Die gespeicherten Feldwerte sind ungültig.');
  const props = {...(row.props as RecordData | undefined)};
  const next: RecordData = {...row, props, edited};
  for (const [field, value] of values) {
    const column = Object.hasOwn(schema, field) ? schema[field] : undefined;
    const type = isObject(column) ? column.type : undefined;
    switch (type) {
      case 'title':
      case 'text':
        if (typeof value !== 'string' || value.length > (type === 'title' ? 160 : 4000))
          throw new Error('Text oder Titel ist ungültig oder zu lang.');
        if (type === 'title') next.text = value;
        else props[field] = value;
        break;
      case 'number':
        if (value !== '' && (typeof value !== 'number' || !Number.isFinite(value)))
          throw new Error('Die Zahlenspalte erwartet eine endliche Zahl oder einen leeren Wert.');
        props[field] = value;
        break;
      case 'checkbox':
        if (typeof value !== 'boolean') throw new Error('Die Checkbox erwartet true oder false.');
        props[field] = value;
        break;
      case 'date':
        if (typeof value !== 'string' || (value !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)))
          throw new Error('Die Datumsspalte erwartet JJJJ-MM-TT oder einen leeren Wert.');
        props[field] = value;
        break;
      default:
        throw new Error('Diese Spalte ist nicht für die Bearbeitung über MCP verfügbar.');
    }
  }
  return next;
}

// Role precedence matches rolleAuf. Resolve all requested rows together
// to keep D1 subrequests bounded as the batch grows.
const writableTargets = `
WITH RECURSIVE
  changes AS MATERIALIZED (
    SELECT json_extract(value,'$.id') AS id, json_extract(value,'$.version') AS version,
           json_extract(value,'$.payload') AS payload FROM json_each(?1)
  ),
  targets AS (
    SELECT id FROM changes UNION SELECT ?4
  ),
  ancestry(target, id, depth) AS (
    SELECT id, id, 0 FROM targets
    UNION ALL
    SELECT a.target, json_extract(s.daten,'$.parentId'), a.depth+1
    FROM ancestry a JOIN saetze s ON s.bereich=?2 AND s.id=a.id
    WHERE a.depth<39 AND CASE WHEN json_valid(s.daten)
      THEN json_type(s.daten,'$.parentId')='text' AND json_extract(s.daten,'$.parentId')<>'' ELSE 0 END
  ),
  writable AS (
    SELECT t.id FROM targets t JOIN bereiche b ON b.id=?2
    WHERE b.besitzer=?3 OR COALESCE((
      SELECT COALESCE(f.rolle,'kein') FROM ancestry a JOIN freigaben f ON f.bereich=?2 AND f.seite=a.id
      WHERE a.target=t.id AND f.kontoId IN (?3,'*')
      ORDER BY a.depth, (f.kontoId=?3) DESC LIMIT 1
    ),(
      SELECT COALESCE(f.rolle,'kein') FROM freigaben f
      WHERE f.bereich=?2 AND f.seite='*' AND f.kontoId IN (?3,'*')
      ORDER BY (f.kontoId=?3) DESC LIMIT 1
    ),'kein') IN ('voll','edit')
  )`;

export const readWritableDatabaseRowsSql = writableTargets + `
SELECT r.id,r.version,r.daten FROM changes c JOIN writable w ON w.id=c.id
JOIN saetze r ON r.bereich=?2 AND r.id=c.id AND r.seite=c.id
WHERE r.tabelle='blocks' AND r.geloescht=0 AND r.verschluesselt=0`;

// Recheck every row, the embedding and the live roles before any record
// changes. Materialization keeps the gate fixed throughout the UPDATE.
export const updateDatabaseRowsSql = writableTargets + `,
  eligible AS MATERIALIZED (
    SELECT NOT EXISTS (
      SELECT 1 FROM changes c WHERE NOT EXISTS (
        SELECT 1 FROM saetze r WHERE r.bereich=?2 AND r.id=c.id AND r.seite=c.id
          AND r.tabelle='blocks' AND r.geloescht=0 AND r.verschluesselt=0 AND r.version=c.version
      )
    ) AND EXISTS (
      SELECT 1 FROM saetze d WHERE d.bereich=?2 AND d.id=?5 AND d.version=?6
        AND d.tabelle='collections' AND d.geloescht=0 AND d.verschluesselt=0
    ) AND NOT EXISTS (
      SELECT 1 FROM json_each(?7) a WHERE NOT EXISTS (
        SELECT 1 FROM saetze p WHERE p.bereich=?2 AND p.seite=?4
          AND p.id=json_extract(a.value,'$.id') AND p.version=json_extract(a.value,'$.version')
          AND p.tabelle='blocks' AND p.geloescht=0 AND p.verschluesselt=0
      )
    ) AND NOT EXISTS (
      SELECT 1 FROM json_each(?8) k WHERE COALESCE((
        SELECT COALESCE(f.rolle,'kein') FROM feldrechte f WHERE f.bereich=?2 AND f.sammlung=?5
          AND f.feld=k.value AND f.kontoId IN (?3,'*')
        ORDER BY (f.kontoId=?3) DESC LIMIT 1
      ),'voll')<>'voll'
    ) AND (SELECT count(*) FROM writable)=(SELECT count(*) FROM targets) AS allowed
  )
UPDATE saetze
SET daten=(SELECT payload FROM changes c WHERE c.id=saetze.id),
    version=version+1, geaendert=?9, vonGeraet='Cloud-MCP'
WHERE bereich=?2 AND id IN (SELECT id FROM changes) AND (SELECT allowed FROM eligible)
RETURNING id,version`;
