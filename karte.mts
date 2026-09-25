/* ============================================================================
 * karte.mts — die Karte des Quelltexts, aus EINER Quelle
 * ----------------------------------------------------------------------------
 * Redur, 25. September 2026:
 *
 *   „erstelle dabei eine obsidein/graphy datei damit du nicht jedes mal
 *    alles daten nue lesen musstest"
 *
 * WAS DAS IST. Beim Plattform-Audit (doku/REDION-PLATTFORM-AUDIT.md) hat je
 * ein Leser ein System kartiert: Dateien, Datenmodell, Schnittstellen, was es
 * gemeinsam nutzt, was doppelt ist, welche Prüfläufe es halten, was fehlt.
 * Diese Befunde stehen in `doku/karte/karte.json`. Dieses Skript schreibt
 * daraus einen Ordner Notizen, den Obsidian als Vault öffnen kann und den
 * ein Mensch — oder ich beim nächsten Mal — liest, statt 156'000 Zeilen:
 *
 *     doku/karte/Redion.md        Übersicht mit Graph (Mermaid) und Verzeichnis
 *     doku/karte/<system>.md      eine Notiz je System, mit [[Verweisen]]
 *     doku/karte/kern-<Name>.md   eine Notiz je gemeinsamem Kern (SheetSpace,
 *                                 InkGeometry, Store, …) mit Rückverweisen
 *
 * DIE VERWEISE SIND GERECHNET, NICHT GESCHRIEBEN. Ein System zeigt auf einen
 * Kern, wenn sein Befund den Namen nennt; ein System zeigt auf ein anderes,
 * wenn ein Duplikat dorthin führt (Pfad in `dort`). So entsteht der Graph aus
 * dem, was die Leser belegt haben — nicht aus dem, was jemand glaubt.
 *
 * DIESELBE REGEL WIE BEI DER CHRONIK (§56, chronik.mts): Quelle ist das JSON.
 * Wer in eine erzeugte Notiz schreibt, verliert es beim nächsten Lauf.
 *
 *     node karte.mts            schreibt den Ordner
 *     node karte.mts --pruefen  sagt nur, ob er aktuell ist
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
const SOURCE = path.join(ROOT, 'doku/karte/karte.json');
const OUT_DIR = path.join(ROOT, 'doku/karte');
const checkOnly = process.argv.includes('--pruefen');

type FileEntry = { pfad: string; rolle: string; zeilen?: number };
type Interface = { name: string; datei: string; art: string; beschreibung: string };
type Geo = Record<string, { vorhanden: boolean; eigen: boolean; wo: string }>;
type TestEntry = { lauf: string; was: string };
type Duplicate = { was: string; hier: string; dort: string; beleg: string; urteil?: { bestaetigt: boolean; begruendung: string } };
type System = {
  key: string; name: string; system: string;
  hauptdateien: FileEntry[]; datenmodell: string; schnittstellen: Interface[];
  geometrie: Geo; tests: TestEntry[]; gemeinsamGenutzt: string[];
  duplikate: Duplicate[]; dokuStand: string; risiken: string[]; kleinsterSchritt: string;
};
type Reference = { key: string; name: string; lizenz: string; befund: Record<string, unknown> };
type Core = { name: string; datei: string; was: string };
type Map = { stand: string; head: string; hinweis: string; systeme: System[]; referenzen: Reference[]; kerne: Core[] };

const map: Map = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

/* Welcher Pfad gehört zu welchem System — für die Duplikat-Kanten. Die
   Reihenfolge zählt: die genaueren Muster stehen oben. */
const PATH_OWNERS: Array<[RegExp, string]> = [
  [/bloecke\/arten\/zeichenflaeche/, 'zeichenflaeche'],
  [/bloecke\/arten\/gedankenkarte/, 'gedankenkarte'],
  [/bloecke\/arten\/(schaltplan|planflaeche)|bereiche\/elektro|register\/(fachzeichen|elektroformeln)/, 'elektro'],
  [/bloecke\/arten\/blatt|bereiche\/pdf/, 'pdf'],
  [/core\/slides|vorlagen\/folien/, 'folien'],
  [/bereiche\/editor|register\/bloecke|core\/types/, 'editor'],
  [/core\/ink|core\/sheet|selection-flow|kern\/zustand\/verlauf|kern\/ablage\/befehle|kern\/ereignisse/, 'gemeinsam'],
  [/kern\/abgleich|bereiche\/dateien/, 'sync'],
  [/kern\/ablage\/(format|archiveImport|ausgeben|einlesen|umzuege)|core\/import|core\/export/, 'export'],
  [/bereiche\/verbinden|^server\/|\/server\//, 'mcp'],
  [/src\/register\//, 'register'],
];
const ownerOf = (text: string): string | null => {
  for (const [re, key] of PATH_OWNERS) if (re.test(text)) return key;
  return null;
};

const esc = (s: unknown): string => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const slug = (s: string): string => s.replace(/[^A-Za-z0-9_-]/g, '');
const header = (source: string): string =>
  `<!-- ERZEUGT — NICHT VON HAND ÄNDERN.\n` +
  `     Die Quelle ist ${source}. \`node karte.mts\` schreibt diese Datei neu;\n` +
  `     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->\n\n`;

/* --- Kanten rechnen ------------------------------------------------------- */
const coreNames = map.kerne.map(k => k.name);
const nameRe = (name: string): RegExp => new RegExp('(^|[^A-Za-z])' + name + '([^A-Za-z]|$)');
/* Ein Satz wie „InkGeometry — NICHT genutzt" nennt den Kern, benutzt ihn aber
   nicht. Der Graph soll zeigen, was BENUTZT wird; das Genannte-aber-Ungenutzte
   ist die zweite, ebenso wichtige Liste — sie steht in der Notiz. */
const NEGATED = /\bNICHT\b|nicht (genutzt|benutzt|gerufen|verwendet)|ungenutzt|kein (Treffer|Aufruf)|grep leer/;
const usesCore = (sys: System, name: string): boolean => {
  const re = nameRe(name);
  const positive = (t: string): boolean => re.test(t) && !NEGATED.test(t);
  return sys.gemeinsamGenutzt.some(positive)
    || sys.schnittstellen.some(i => positive(i.name + ' ' + i.beschreibung));
};
const namesCore = (sys: System, name: string): boolean =>
  nameRe(name).test(JSON.stringify([sys.gemeinsamGenutzt, sys.schnittstellen, sys.duplikate, sys.geometrie, sys.risiken]));
const coreEdges = new Map<string, string[]>();          // system → Kerne, die es BENUTZT
const seenOnly = new Map<string, string[]>();           // system → Kerne, die es nur NENNT
const backEdges = new Map<string, string[]>();          // Kern → Systeme, die ihn benutzen
for (const s of map.systeme) {
  const used = coreNames.filter(n => usesCore(s, n));
  const named = coreNames.filter(n => !used.includes(n) && namesCore(s, n));
  coreEdges.set(s.key, used);
  seenOnly.set(s.key, named);
  for (const n of used) backEdges.set(n, [...(backEdges.get(n) ?? []), s.key]);
}
const dupEdges = new Map<string, Set<string>>();         // system → Systeme (über Duplikate)
for (const s of map.systeme) {
  const targets = new Set<string>();
  for (const d of s.duplikate) {
    const owner = ownerOf(d.dort);
    if (owner && owner !== s.key) targets.add(owner);
  }
  dupEdges.set(s.key, targets);
}
const byKey = new Map(map.systeme.map(s => [s.key, s]));
const linkSys = (key: string): string => byKey.has(key) ? `[[${key}|${byKey.get(key)!.name}]]` : key;

/* --- Übersicht ------------------------------------------------------------ */
const overview = (): string => {
  const lines: string[] = [];
  lines.push(header('doku/karte/karte.json'));
  lines.push(`# Redion — die Karte des Quelltexts\n`);
  lines.push(`Stand ${map.stand} · HEAD \`${map.head}\` · ${map.systeme.length} Systeme · ${map.kerne.length} gemeinsame Kerne · ${map.referenzen.length} Referenzen\n`);
  lines.push(`${map.hinweis}\n`);
  lines.push(`## Der Graph\n`);
  lines.push('Ein Pfeil zu einem Kern heisst: der Befund belegt, dass das System ihn BENUTZT. Ein gestrichelter Pfeil zu einem System heisst: dort liegt ein belegtes Duplikat. Was ein System nur nennt, ohne es zu benutzen, steht in seiner Notiz unter „Gemeinsam genutzt".\n');
  lines.push('```mermaid');
  lines.push('graph LR');
  for (const k of map.kerne) lines.push(`  ${slug(k.name)}[("${k.name}")]`);
  for (const s of map.systeme) lines.push(`  ${s.key}["${s.name}"]`);
  for (const s of map.systeme) {
    for (const n of coreEdges.get(s.key) ?? []) lines.push(`  ${s.key} --> ${slug(n)}`);
    for (const t of dupEdges.get(s.key) ?? []) lines.push(`  ${s.key} -.-> ${t}`);
  }
  lines.push('```\n');
  lines.push(`## Die Systeme\n`);
  lines.push('| Notiz | Hauptdateien | Prüfläufe | Duplikate | nutzt |');
  lines.push('|---|---|---|---|---|');
  for (const s of map.systeme) {
    const files = s.hauptdateien.slice(0, 3).map(f => '`' + path.basename(f.pfad) + '`').join(', ') + (s.hauptdateien.length > 3 ? ` +${s.hauptdateien.length - 3}` : '');
    const cores = (coreEdges.get(s.key) ?? []).map(n => `[[kern-${slug(n)}|${n}]]`).join(', ') || '—';
    lines.push(`| [[${s.key}|${esc(s.name)}]] | ${files} | ${s.tests.length} | ${s.duplikate.length} | ${cores} |`);
  }
  lines.push('');
  lines.push(`## Die gemeinsamen Kerne\n`);
  lines.push('| Kern | Datei | benutzt von |');
  lines.push('|---|---|---|');
  for (const k of map.kerne) {
    const users = (backEdges.get(k.name) ?? []).map(linkSys).join(', ') || '— (kein Befund belegt einen Aufruf)';
    lines.push(`| [[kern-${slug(k.name)}|${k.name}]] | \`${k.datei}\` | ${users} |`);
  }
  lines.push('');
  if (map.referenzen.length) {
    lines.push(`## Die Referenzen (nur gelesen, nichts übernommen)\n`);
    for (const r of map.referenzen) lines.push(`- [[referenz-${r.key}|${r.name}]] — ${r.lizenz}`);
    lines.push('');
  }
  lines.push(`## Wie die Karte gepflegt wird\n`);
  lines.push('Quelle ist `doku/karte/karte.json`; `node karte.mts` schreibt alle Notizen neu, `node karte.mts --pruefen` sagt nur, ob sie stimmen. Ein neuer Befund kommt ins JSON, nicht in eine Notiz. Wer ein System umbaut, trägt es dort nach — sonst lügt die Karte beim nächsten Mal.');
  return lines.join('\n') + '\n';
};

/* --- Eine Notiz je System ------------------------------------------------- */
const systemNote = (s: System): string => {
  const L: string[] = [];
  L.push(header('doku/karte/karte.json'));
  L.push('---');
  L.push(`tags: [redion, system, ${s.key}]`);
  L.push(`stand: ${map.stand}`);
  L.push(`head: ${map.head}`);
  L.push('---\n');
  L.push(`# ${s.name}\n`);
  L.push(`${s.system}\n`);
  L.push(`Zurück zur [[Redion|Übersicht]].\n`);

  L.push(`## Dateien\n`);
  L.push('| Datei | Rolle | Zeilen |');
  L.push('|---|---|---|');
  for (const f of s.hauptdateien) L.push(`| \`${f.pfad.replace(ROOT + '/', '')}\` | ${esc(f.rolle)} | ${f.zeilen ?? ''} |`);
  L.push('');

  L.push(`## Datenmodell\n`);
  L.push(s.datenmodell + '\n');

  L.push(`## Schnittstellen\n`);
  L.push('| Name | Art | Datei | Was |');
  L.push('|---|---|---|---|');
  for (const i of s.schnittstellen) L.push(`| \`${esc(i.name)}\` | ${esc(i.art)} | \`${esc(i.datei)}\` | ${esc(i.beschreibung)} |`);
  L.push('');

  L.push(`## Geometrie — was dieses System selbst rechnet\n`);
  L.push('| Primitive | vorhanden | eigen | wo |');
  L.push('|---|---|---|---|');
  for (const [name, g] of Object.entries(s.geometrie ?? {})) L.push(`| ${name} | ${g.vorhanden ? 'ja' : 'nein'} | ${g.eigen ? '**ja**' : 'nein'} | ${esc(g.wo)} |`);
  L.push('');

  L.push(`## Gemeinsam genutzt\n`);
  const cores = coreEdges.get(s.key) ?? [];
  const named = seenOnly.get(s.key) ?? [];
  if (cores.length) L.push(`**Benutzt:** ${cores.map(n => `[[kern-${slug(n)}|${n}]]`).join(' · ')}\n`);
  if (named.length) L.push(`**Nur genannt, nicht benutzt:** ${named.map(n => `[[kern-${slug(n)}|${n}]]`).join(' · ')} — der Befund sagt, warum.\n`);
  for (const g of s.gemeinsamGenutzt) L.push(`- ${g}`);
  L.push('');

  L.push(`## Duplikate — je mit zwei Stellen und Zitat\n`);
  const targets = dupEdges.get(s.key) ?? new Set<string>();
  if (targets.size) L.push(`Führen zu: ${[...targets].map(linkSys).join(' · ')}\n`);
  s.duplikate.forEach((d, i) => {
    const verdict = d.urteil ? (d.urteil.bestaetigt ? ' — **gegengeprüft: bestätigt**' : ' — **gegengeprüft: verworfen**') : '';
    L.push(`${i + 1}. **${d.was}**${verdict}`);
    L.push(`   - hier: \`${d.hier}\``);
    L.push(`   - dort: \`${d.dort}\``);
    L.push(`   - Beleg: ${d.beleg}`);
    if (d.urteil) L.push(`   - Urteil: ${d.urteil.begruendung}`);
  });
  if (!s.duplikate.length) L.push('_keine belegt_');
  L.push('');

  L.push(`## Prüfläufe\n`);
  for (const t of s.tests) L.push(`- \`${t.lauf}\` — ${t.was}`);
  L.push('');

  L.push(`## Doku-Stand\n`);
  L.push(s.dokuStand + '\n');

  L.push(`## Risiken\n`);
  for (const r of s.risiken) L.push(`- ${r}`);
  L.push('');

  L.push(`## Kleinster nächster Schritt (Vorschlag des Lesers)\n`);
  L.push(s.kleinsterSchritt + '\n');
  return L.join('\n');
};

/* --- Eine Notiz je Kern --------------------------------------------------- */
const coreNote = (k: Core): string => {
  const users = backEdges.get(k.name) ?? [];
  const L: string[] = [];
  L.push(header('doku/karte/karte.json'));
  L.push('---');
  L.push(`tags: [redion, kern]`);
  L.push(`stand: ${map.stand}`);
  L.push('---\n');
  L.push(`# ${k.name}\n`);
  L.push(`\`${k.datei}\` — ${k.was}\n`);
  L.push(`## Benutzt von\n`);
  if (users.length) for (const u of users) L.push(`- ${linkSys(u)}`);
  else L.push('_kein Befund belegt einen Aufruf — der Kern wird von den kartierten Systemen nicht benutzt oder nicht gesehen_');
  const onlyNamed = map.systeme.filter(s => (seenOnly.get(s.key) ?? []).includes(k.name));
  if (onlyNamed.length) { L.push(''); L.push(`## Genannt, aber nicht benutzt von\n`); for (const s of onlyNamed) L.push(`- ${linkSys(s.key)}`); }
  L.push('');
  L.push(`Zurück zur [[Redion|Übersicht]].\n`);
  return L.join('\n');
};

/* --- Eine Notiz je Referenz ----------------------------------------------- */
const referenceNote = (r: Reference): string => {
  const L: string[] = [];
  L.push(header('doku/karte/karte.json'));
  L.push('---');
  L.push(`tags: [referenz]`);
  L.push(`stand: ${map.stand}`);
  L.push('---\n');
  L.push(`# ${r.name} — Referenz, nur gelesen\n`);
  L.push(`Lizenz: ${r.lizenz}. Nichts übernommen: kein Code, kein Asset, keine Oberfläche.\n`);
  for (const [k, v] of Object.entries(r.befund)) {
    L.push(`## ${k}\n`);
    if (Array.isArray(v)) for (const x of v) L.push(`- ${typeof x === 'string' ? x : '`' + JSON.stringify(x) + '`'}`);
    else if (typeof v === 'object' && v) L.push('```json\n' + JSON.stringify(v, null, 1) + '\n```');
    else L.push(String(v));
    L.push('');
  }
  L.push(`Zurück zur [[Redion|Übersicht]].\n`);
  return L.join('\n');
};

/* --- Schreiben oder prüfen ------------------------------------------------ */
const files = new Map<string, string>();
files.set('Redion.md', overview());
for (const s of map.systeme) files.set(`${s.key}.md`, systemNote(s));
for (const k of map.kerne) files.set(`kern-${slug(k.name)}.md`, coreNote(k));
for (const r of map.referenzen) files.set(`referenz-${r.key}.md`, referenceNote(r));

fs.mkdirSync(OUT_DIR, { recursive: true });
let stale = 0;
for (const [name, content] of files) {
  const p = path.join(OUT_DIR, name);
  const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (old === content) continue;
  stale++;
  if (checkOnly) console.log('  veraltet: doku/karte/' + name);
  else { fs.writeFileSync(p, content); console.log('  geschrieben: doku/karte/' + name); }
}
if (checkOnly) {
  console.log(stale ? `${stale} Notizen sind nicht aktuell — node karte.mts` : 'Die Karte ist aktuell.');
  process.exit(stale ? 1 : 0);
} else {
  console.log(`${files.size} Notizen, ${stale} davon neu geschrieben → doku/karte/`);
}
