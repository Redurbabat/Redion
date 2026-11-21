/* Seiten im Format der App (Redur, 21. November 2026: „wenn chat gpt etwas
 * erstelle das ich über windows app und ios app direkt alles sofort sehen
 * kann").
 *
 * Vorher schrieb der Cloud-MCP eine Seite als {type:'page', text, inhalt}.
 * Die App kennt `inhalt` nicht, und ohne `alive: true` gilt eine Seite dort
 * als gelöscht (indexdb.ts `trashed()`): sie stand im Papierkorb, leer.
 *
 * Hier entsteht dasselbe, was `Store.addPage` und `Store.addBlock` anlegen —
 * eine Seite, deren `content` die Kennungen ihrer Kindblöcke hält, und je
 * Absatz einen eigenen Satz. Felder heissen, wie sie gespeichert sind (§53.3).
 */

export type BlockData = Record<string, unknown> & { id: string; type: string; text: string };

/** Was ein Markdown-Zeilenanfang in der App ist (register/bloecke.ts). */
const LINE_TYPES: Array<[RegExp, string, Record<string, unknown>?]> = [
  [/^###\s+/, 'h3'],
  [/^##\s+/, 'h2'],
  [/^#\s+/, 'h1'],
  [/^[-*+]\s+\[[xX]\]\s+/, 'todo', { checked: true }],
  [/^[-*+]\s+\[\s?\]\s+/, 'todo', { checked: false }],
  [/^[-*+]\s+/, 'bullet'],
  [/^\d+[.)]\s+/, 'number'],
  [/^>\s?/, 'quote'],
];

export const MAX_BLOCKS = 200;

/** Zerlegt Text in Blöcke: eine Zeile je Block, Leerzeilen trennen nur. */
export const textToBlocks = (content: string): Array<{ type: string; text: string; checked?: boolean }> => {
  const out: Array<{ type: string; text: string; checked?: boolean }> = [];
  for (const raw of content.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { out.push({ type: 'divider', text: '' }); continue; }
    let block: { type: string; text: string; checked?: boolean } = { type: 'text', text: line };
    for (const [re, type, extra] of LINE_TYPES) {
      if (re.test(line)) { block = { type, text: line.replace(re, ''), ...(extra || {}) }; break; }
    }
    out.push(block);
    if (out.length >= MAX_BLOCKS) break;
  }
  return out;
};

/** Ein Block, wie `Store.addBlock` ihn schreibt. */
export const appBlock = (id: string, type: string, text: string, parentId: string | null,
  now: string, extra: Record<string, unknown> = {}): BlockData => ({
  id, type, text, content: [], parentId, parentTable: 'block', color: '',
  created: now, edited: now, erstelltVon: 'ChatGPT', alive: true, herkunft: 'ki', ...extra,
});

/** Eine Seite, wie `Store.addPage` sie schreibt. */
export const appPage = (id: string, title: string, parentId: string | null, childIds: string[], now: string): BlockData =>
  appBlock(id, 'page', title, parentId, now, {
    content: childIds, aliases: [], icon: '📄', cover: '', wide: false, font: 'default', small: false,
  });

/** Ein Block zurück als Markdown-Zeile (Gegenstück zu `textToBlocks`). */
export const blockToLine = (b: Record<string, unknown>): string => {
  const t = String(b.text ?? '');
  switch (b.type) {
    case 'h1': return '# ' + t;
    case 'h2': return '## ' + t;
    case 'h3': return '### ' + t;
    case 'todo': return '- [' + (b.checked ? 'x' : ' ') + '] ' + t;
    case 'bullet': return '- ' + t;
    case 'number': return '1. ' + t;
    case 'quote': return '> ' + t;
    case 'divider': return '---';
    case 'page': return '📄 ' + t;
    case 'schaltplan': return '⚡ Schaltplan' + (t ? ' „' + t + '“' : '') + ' (blockId ' + String(b.id ?? '') + ')';
    default: return t;
  }
};

/** Ein Zeitstempel, der nach allem liegt, was der Bereich schon hat.
 *  Die App holt mit `geaendertNach: marke` (strikt grösser). Liefe die Uhr
 *  eines Geräts vor, läge `now` unter seiner Marke — und die neue Seite käme
 *  dort nie an. */
export const stampAfter = (latest: string | null | undefined): string => {
  const now = Date.now();
  const last = latest ? Date.parse(latest) : NaN;
  return new Date(Number.isFinite(last) && last >= now ? last + 1 : now).toISOString();
};
