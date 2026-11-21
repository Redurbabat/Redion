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

export const MAX_BLOCKS = 200;

/** Ein gelesener Block; `kinder` sind die eingerückten Zeilen darunter. */
export type MdNode = { type: string; text: string; checked?: boolean; lang?: string; kinder: MdNode[] };

/**
 * Markdown in Blöcke — nach den Regeln von `mdLesen` in der App
 * (src/bereiche/editor/ansicht/editor.ts), damit ChatGPT und Einfügen
 * dasselbe ergeben: eine Zeile ein Block, Leerzeilen trennen nur, ```lang
 * wird ein Codeblock, „> 💡" ein Callout, „> " ein Zitat, vier Leerzeichen
 * oder ein Tab eine Stufe tiefer (der Block wird Kind des vorigen). Eine
 * Markdown-Tabelle bleibt hier Text: in der App ist sie ein ganzer
 * Tabellenblock mit Formelkern, und den baut der Server nicht nach.
 */
export const textToBlocks = (content: string): MdNode[] => {
  const zeilen = content.replace(/\r\n?/g, '\n').split('\n');
  const wurzel: MdNode[] = [];
  const stapel: MdNode[] = [];   // stapel[t] = letzter Block der Tiefe t
  let anzahl = 0;
  const tiefeVon = (z: string) => {
    let n = 0;
    for (const c of /^[\t ]*/.exec(z)?.[0] ?? '') n += c === '\t' ? 4 : 1;
    return Math.min(3, Math.floor(n / 4));
  };
  const setze = (node: MdNode, tiefe: number) => {
    const t = Math.min(tiefe, stapel.length);
    const eltern = t > 0 ? stapel[t - 1] : undefined;
    (eltern ? eltern.kinder : wurzel).push(node);
    stapel.length = t;
    stapel.push(node);
    anzahl++;
  };
  for (let i = 0; i < zeilen.length && anzahl < MAX_BLOCKS; i++) {
    const zeile = zeilen[i] ?? '';
    const tiefe = tiefeVon(zeile);
    const t = zeile.trim();
    const auf = /^```([a-zA-Z0-9+#.-]{0,20})\s*$/.exec(t);
    if (auf) {
      const inhalt: string[] = [];
      while (++i < zeilen.length && !/^\s*```\s*$/.test(zeilen[i] ?? '')) inhalt.push(zeilen[i] ?? '');
      setze({ type: 'code', text: inhalt.join('\n'), lang: (auf[1] ?? '').toLowerCase(), kinder: [] }, tiefe);
      continue;
    }
    if (!t) continue;
    let m: RegExpExecArray | null;
    if (t.startsWith('>')) {
      const rest = t.replace(/^(>\s?)+/, '');
      setze(/^💡\s*/.test(rest) ? { type: 'callout', text: rest.replace(/^💡\s*/, ''), kinder: [] }
                               : { type: 'quote', text: rest, kinder: [] }, tiefe);
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) setze({ type: 'divider', text: '', kinder: [] }, tiefe);
    else if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) setze({ type: 'h' + m[1]!.length, text: m[2] ?? '', kinder: [] }, tiefe);
    else if ((m = /^[-*+]\s+\[([ xX])\]\s*(.*)$/.exec(t)) || (m = /^\[([ xX])\]\s+(.*)$/.exec(t)))
      setze({ type: 'todo', text: m[2] ?? '', checked: m[1] !== ' ', kinder: [] }, tiefe);
    else if ((m = /^[-*+]\s+(.*)$/.exec(t))) setze({ type: 'bullet', text: m[1] ?? '', kinder: [] }, tiefe);
    else if ((m = /^(?:\d{1,9}|[a-zA-Z]|[ivxIVX]{1,6})[.)]\s+(.*)$/.exec(t))) setze({ type: 'number', text: m[1] ?? '', kinder: [] }, tiefe);
    else setze({ type: 'text', text: t, kinder: [] }, tiefe);
  }
  return wurzel;
};

/** Wie viele Blöcke ein Baum hat. */
export const countBlocks = (nodes: MdNode[]): number => nodes.reduce((n, b) => n + 1 + countBlocks(b.kinder), 0);

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
    case 'callout': return '> 💡 ' + t;
    case 'toggle': return '> ' + t;
    case 'code': return '```' + String(b.lang ?? '') + '\n' + t + '\n```';
    case 'divider': return '---';
    case 'database': return '🗂️ Datenbank „' + t + '“ (databaseId ' + String(b.collectionId ?? '') + ')';
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
