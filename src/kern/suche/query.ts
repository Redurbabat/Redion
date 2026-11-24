/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/suche/query.ts (npm run bauen:ts). */
/* ============================================================================
 * query.ts — eine gemeinsame Abfragesprache für Redions Suche
 * ----------------------------------------------------------------------------
 * Die Oberfläche und die Textsyntax erzeugen beide `SearchQuery`. Dadurch
 * kann `typ:seite` nicht mehr etwas anderes bedeuten als die Auswahl
 * „ohne Datenbank", und ein Syntaxfehler sieht nicht wie null Treffer aus.
 *
 * Diese Datei kennt weder DOM noch IndexedDB. Sie wertet normalisierte
 * Suchdokumente aus; die Schale übersetzt den echten Bestand genau einmal in
 * diese kleine Form. So bleibt die Sprache auch für spätere Filter nutzbar.
 * ==========================================================================*/

type SearchScope = 'all' | 'title' | 'content';
type SearchDocumentType = 'all' | 'page' | 'database' | 'row';
type ChangedPeriod = 'all' | 'today' | 'week' | 'month';
type SearchClauseField = 'text' | 'title' | 'content' | 'tag' | 'status';

type SearchClause = {
  field: SearchClauseField;
  value: string;
  exact: boolean;
  position: number;
};

type SearchQuery = {
  source: string;
  clauses: SearchClause[];
  scope: SearchScope;
  documentType: SearchDocumentType;
  changed: ChangedPeriod;
  location: string;
  after: string;
  before: string;
};

type SearchQueryIssue = {
  position: number;
  message: string;
};

type SearchQueryParseResult =
  | { ok: true; query: SearchQuery; issues: [] }
  | { ok: false; query: SearchQuery; issues: SearchQueryIssue[] };

type SearchUiFilters = {
  scope?: SearchScope;
  documentType?: SearchDocumentType;
  changed?: ChangedPeriod;
  location?: string;
};

type SearchDocument = {
  id: string;
  title: string;
  content: string;
  path: string;
  documentType: Exclude<SearchDocumentType, 'all'>;
  changed: string;
  tags: string[];
  statuses: string[];
  locations: string[];
};

type SearchMatch = {
  document: SearchDocument;
  score: number;
  reason: 'Titel' | 'Inhalt' | 'Status' | 'Schlagwort' | 'Filter';
  snippet: string;
};

type QueryToken = {
  raw: string;
  value: string;
  position: number;
  quotedOnly: boolean;
};

const QueryLanguage = (() => {
  const empty = (source = ''): SearchQuery => ({
    source,
    clauses: [],
    scope: 'all',
    documentType: 'all',
    changed: 'all',
    location: '',
    after: '',
    before: ''
  });

  const fold = (value: unknown): string => String(value ?? '')
    .trim()
    .toLocaleLowerCase('de-DE');

  const keyFold = (value: string): string => fold(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  /** Zerlegt Leerraum nur außerhalb von Anführungszeichen. */
  const tokenize = (source: string): { tokens: QueryToken[]; issues: SearchQueryIssue[] } => {
    const tokens: QueryToken[] = [];
    const issues: SearchQueryIssue[] = [];
    let index = 0;

    while (index < source.length) {
      while (/\s/.test(source[index] || '')) index++;
      if (index >= source.length) break;
      const position = index;
      let raw = '';
      let quoted = false;
      let escaped = false;

      while (index < source.length) {
        const char = source[index] || '';
        if (!quoted && /\s/.test(char)) break;
        raw += char;
        index++;
        if (escaped) { escaped = false; continue; }
        if (quoted && char === '\\') { escaped = true; continue; }
        if (char === '"') quoted = !quoted;
      }

      if (quoted) {
        issues.push({ position, message: 'Das schließende Anführungszeichen fehlt.' });
      }

      let value = '';
      quoted = false;
      escaped = false;
      for (const char of raw) {
        if (escaped) { value += char; escaped = false; continue; }
        if (quoted && char === '\\') { escaped = true; continue; }
        if (char === '"') { quoted = !quoted; continue; }
        value += char;
      }
      if (escaped) value += '\\';
      tokens.push({
        raw,
        value,
        position,
        quotedOnly: /^"(?:\\.|[^"\\])*"$/.test(raw)
      });
    }
    return { tokens, issues };
  };

  const dateValid = (value: string): boolean => {
    const match = value.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2] || 1);
    const day = Number(match[3] || 1);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  };

  const parseType = (value: string): SearchDocumentType | null => {
    const normalized = keyFold(value);
    if (normalized === 'seite' || normalized === 'page') return 'page';
    if (normalized === 'datenbank' || normalized === 'database' || normalized === 'db') return 'database';
    if (normalized === 'zeile' || normalized === 'row') return 'row';
    if (normalized === 'alles' || normalized === 'all') return 'all';
    return null;
  };

  const parseChanged = (value: string): ChangedPeriod | null => {
    const normalized = keyFold(value);
    if (normalized === 'heute' || normalized === 'today') return 'today';
    if (normalized === 'woche' || normalized === 'week') return 'week';
    if (normalized === 'monat' || normalized === 'month') return 'month';
    if (normalized === 'alles' || normalized === 'all') return 'all';
    return null;
  };

  const aliases: Record<string, string> = {
    titel: 'title', title: 'title',
    inhalt: 'content', content: 'content',
    tag: 'tag', schlagwort: 'tag',
    typ: 'type', type: 'type',
    geandert: 'changed', changed: 'changed',
    status: 'status', zustand: 'status',
    in: 'location', ort: 'location',
    nach: 'after', after: 'after',
    vor: 'before', before: 'before'
  };

  const parse = (input: unknown): SearchQueryParseResult => {
    const source = String(input ?? '');
    const query = empty(source);
    const tokenized = tokenize(source);
    const issues = [...tokenized.issues];
    let typePosition = -1;
    let changedPosition = -1;

    for (const token of tokenized.tokens) {
      if (token.quotedOnly) {
        const value = token.value.trim();
        if (value) query.clauses.push({ field: 'text', value, exact: true, position: token.position });
        continue;
      }

      const colon = token.value.indexOf(':');
      if (colon < 1 || token.raw.includes('://')) {
        const value = token.value.trim();
        if (value) query.clauses.push({ field: 'text', value, exact: false, position: token.position });
        continue;
      }

      const rawKey = token.value.slice(0, colon);
      const value = token.value.slice(colon + 1).trim();
      const operator = aliases[keyFold(rawKey)];
      if (!operator) {
        issues.push({
          position: token.position,
          message: `„${rawKey}:“ ist kein Suchbefehl. Erlaubt sind titel, tag, typ, geändert und status.`
        });
        continue;
      }
      if (!value) {
        issues.push({ position: token.position, message: `Nach „${rawKey}:“ fehlt ein Wert.` });
        continue;
      }

      if (operator === 'title' || operator === 'content' || operator === 'tag' || operator === 'status') {
        query.clauses.push({ field: operator, value, exact: token.raw.includes('"'), position: token.position });
        continue;
      }
      if (operator === 'type') {
        const next = parseType(value);
        if (!next) {
          issues.push({ position: token.position,
            message: `„${value}“ ist kein Typ. Möglich sind seite, datenbank und zeile.` });
        } else if (typePosition >= 0 && query.documentType !== next) {
          issues.push({ position: token.position, message: 'Die Abfrage enthält zwei widersprüchliche Typen.' });
        } else {
          query.documentType = next;
          typePosition = token.position;
        }
        continue;
      }
      if (operator === 'changed') {
        const next = parseChanged(value);
        if (!next) {
          issues.push({ position: token.position,
            message: `„${value}“ ist kein Zeitraum. Möglich sind heute, woche und monat.` });
        } else if (changedPosition >= 0 && query.changed !== next) {
          issues.push({ position: token.position, message: 'Die Abfrage enthält zwei widersprüchliche Zeiträume.' });
        } else {
          query.changed = next;
          changedPosition = token.position;
        }
        continue;
      }
      if (operator === 'location') { query.location = value; continue; }
      if (operator === 'after' || operator === 'before') {
        if (!dateValid(value)) {
          issues.push({ position: token.position,
            message: `„${value}“ ist kein gültiges Datum. Nutze JJJJ, JJJJ-MM oder JJJJ-MM-TT.` });
        } else if (operator === 'after') query.after = value;
        else query.before = value;
      }
    }

    return issues.length ? { ok: false, query, issues } : { ok: true, query, issues: [] };
  };

  /** Auswahllisten überschreiben nur Werte, die dort ausdrücklich gesetzt sind. */
  const applyUiFilters = (source: SearchQuery, filters: SearchUiFilters): SearchQuery => ({
    ...source,
    clauses: source.clauses.map(clause => ({ ...clause })),
    scope: filters.scope && filters.scope !== 'all' ? filters.scope : source.scope,
    documentType: filters.documentType && filters.documentType !== 'all'
      ? filters.documentType : source.documentType,
    changed: filters.changed && filters.changed !== 'all' ? filters.changed : source.changed,
    location: filters.location || source.location
  });

  const startOfToday = (now: Date): number =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const dateStart = (value: string): number => {
    const parts = value.split('-').map(Number);
    return new Date(parts[0] || 0, (parts[1] || 1) - 1, parts[2] || 1).getTime();
  };

  const dateEnd = (value: string): number => {
    const parts = value.split('-').map(Number);
    if (parts.length === 1) return new Date((parts[0] || 0) + 1, 0, 1).getTime() - 1;
    if (parts.length === 2) return new Date(parts[0] || 0, parts[1] || 1, 1).getTime() - 1;
    return new Date(parts[0] || 0, (parts[1] || 1) - 1, (parts[2] || 1) + 1).getTime() - 1;
  };

  const includes = (haystack: string, needle: string): boolean =>
    fold(haystack).includes(fold(needle));

  const changedMatches = (document: SearchDocument, query: SearchQuery, now: Date): boolean => {
    const timestamp = new Date(document.changed || 0).getTime();
    if (!Number.isFinite(timestamp)) return query.changed === 'all' && !query.after && !query.before;
    if (query.changed !== 'all') {
      const days = query.changed === 'today' ? 0 : query.changed === 'week' ? 7 : 30;
      const limit = days === 0 ? startOfToday(now) : now.getTime() - days * 86400000;
      if (timestamp < limit) return false;
    }
    if (query.after && timestamp < dateStart(query.after)) return false;
    if (query.before && timestamp > dateEnd(query.before)) return false;
    return true;
  };

  const clauseMatches = (document: SearchDocument, clause: SearchClause,
                         scope: SearchScope): boolean => {
    if (clause.field === 'title') return includes(document.title, clause.value);
    if (clause.field === 'content') return includes(document.content, clause.value);
    if (clause.field === 'tag') {
      const wanted = fold(clause.value).replace(/^#/, '');
      return document.tags.some(tag => fold(tag).replace(/^#/, '') === wanted);
    }
    if (clause.field === 'status') {
      const wanted = fold(clause.value);
      return document.statuses.some(status => fold(status) === wanted);
    }
    if (scope === 'title') return includes(document.title, clause.value);
    if (scope === 'content') return includes(document.content, clause.value);
    return includes(document.title, clause.value) || includes(document.content, clause.value);
  };

  const locationMatches = (document: SearchDocument, value: string): boolean => {
    if (!value) return true;
    const wanted = fold(value);
    return document.locations.some(location => {
      const candidate = fold(location);
      return candidate === wanted || candidate.startsWith(wanted);
    });
  };

  const matches = (document: SearchDocument, query: SearchQuery,
                   now = new Date()): boolean => {
    if (query.documentType !== 'all' && document.documentType !== query.documentType) return false;
    if (!changedMatches(document, query, now)) return false;
    if (!locationMatches(document, query.location)) return false;
    return query.clauses.every(clause => clauseMatches(document, clause, query.scope));
  };

  const snippetFor = (document: SearchDocument, query: SearchQuery): string => {
    const contentClause = query.clauses.find(clause =>
      clause.field === 'content' || clause.field === 'text');
    const content = document.content.trim();
    if (!content) return '';
    if (!contentClause) return content.slice(0, 120);
    const index = fold(content).indexOf(fold(contentClause.value));
    if (index < 0) return content.slice(0, 120);
    return (index > 0 ? '…' : '') + content.slice(Math.max(0, index - 35), index + 90) +
      (index + 90 < content.length ? '…' : '');
  };

  const scoreFor = (document: SearchDocument, query: SearchQuery): number => {
    let score = 0;
    for (const clause of query.clauses) {
      if (clause.field === 'title' ||
          (clause.field === 'text' && includes(document.title, clause.value))) score += 6;
      else if (clause.field === 'status' || clause.field === 'tag') score += 3;
      else score += 1;
      if (clause.exact) score += 1;
    }
    return score;
  };

  /* ══ WIE GUT EIN TREFFER PASST (B31, E807) ═════════════════════════════
     `scoreFor` sagt nur, WO getroffen wurde (Titel, Status, Inhalt). Bei
     gleichem Wert entschied bisher allein das Datum: wer „Kabel" suchte,
     bekam eine Seite, die das Wort einmal am Rand nennt, vor der Seite
     „Kabel", nur weil sie jünger war.

     Der Wert hier ordnet NUR innerhalb gleicher `score` — die grobe Stufe
     bleibt, wie sie war. Er folgt dem öffentlichen BM25-Gedanken, klein und
     ohne Index: ein Wort, das in wenigen Dokumenten steht, zählt mehr (idf);
     ein Wort, das oft vorkommt, zählt mehr, aber gesättigt (k1); ein langer
     Text bekommt für dieselbe Zahl weniger (b). Dazu der Titel: gleich dem
     Suchwort vor „beginnt damit" vor „enthält es".

     Gezählt wird über die Dokumente, die schon passen — `run` filtert
     zuerst. Das hält die Rechnung bei einem Tastendruck in den Treffern,
     nicht im ganzen Bestand. */
  const K1 = 1.2, B = 0.75;
  const terms = (query: SearchQuery): string[] => query.clauses
    .filter(clause => clause.field === 'text' || clause.field === 'content' || clause.field === 'title')
    .map(clause => fold(clause.value))
    .filter(Boolean);
  const countIn = (text: string, term: string): number => {
    let n = 0, from = 0;
    for (;;) { const at = text.indexOf(term, from); if (at < 0) return n; n++; from = at + term.length; }
  };
  const relevanceFor = (documents: SearchDocument[], query: SearchQuery): Map<SearchDocument, number> => {
    const wanted = terms(query);
    const result = new Map<SearchDocument, number>();
    if (!wanted.length) return result;
    const folded = documents.map(document => ({ document, title: fold(document.title), content: fold(document.content) }));
    const averageLength = folded.reduce((sum, item) => sum + item.content.length, 0) / Math.max(1, folded.length) || 1;
    const idf = new Map(wanted.map(term => {
      const holding = folded.filter(item => item.content.includes(term) || item.title.includes(term)).length;
      return [term, Math.log(1 + (folded.length - holding + 0.5) / (holding + 0.5))] as const;
    }));
    for (const item of folded) {
      let value = 0;
      for (const term of wanted) {
        if (item.title === term) value += 3;
        else if (item.title.startsWith(term)) value += 2;
        else if (item.title.includes(term)) value += 1;
        const tf = countIn(item.content, term);
        if (tf) value += (idf.get(term) ?? 0) * (tf * (K1 + 1)) /
          (tf + K1 * (1 - B + B * item.content.length / averageLength));
      }
      result.set(item.document, value);
    }
    return result;
  };

  const reasonFor = (document: SearchDocument, query: SearchQuery): SearchMatch['reason'] => {
    if (query.clauses.some(clause => clause.field === 'status')) return 'Status';
    if (query.clauses.some(clause => clause.field === 'tag')) return 'Schlagwort';
    if (query.clauses.some(clause => clause.field === 'title' ||
        (clause.field === 'text' && includes(document.title, clause.value)))) return 'Titel';
    if (query.clauses.length) return 'Inhalt';
    return 'Filter';
  };

  const run = (documents: SearchDocument[], query: SearchQuery,
               options: { now?: Date; limit?: number } = {}): SearchMatch[] => {
    const now = options.now || new Date();
    const limit = Math.max(1, Math.min(500, options.limit || 60));
    const passing = documents.filter(document => matches(document, query, now));
    const relevance = relevanceFor(passing, query);
    return passing
      .map(document => ({
        document,
        score: scoreFor(document, query),
        reason: reasonFor(document, query),
        snippet: snippetFor(document, query)
      }))
      .sort((left, right) => right.score - left.score ||
        (relevance.get(right.document) ?? 0) - (relevance.get(left.document) ?? 0) ||
        String(right.document.changed).localeCompare(String(left.document.changed)) ||
        left.document.title.localeCompare(right.document.title, 'de'))
      .slice(0, limit);
  };

  const HELP_EXAMPLES = [
    'titel:"Projekt"',
    'tag:arbeit',
    'typ:seite',
    'geändert:heute',
    'status:offen'
  ] as const;

  return { empty, parse, applyUiFilters, matches, run, HELP_EXAMPLES };
})();

(window as any).QueryLanguage = QueryLanguage;
