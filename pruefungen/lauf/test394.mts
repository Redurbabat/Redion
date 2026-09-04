/* Suite 394 — „Blatt" legt nicht nur an, es schlägt auf (E397, Audit F10)
 * ============================================================================
 * GEMESSEN AM 4. SEPTEMBER, an beiden Grössen: der Weg „Blatt" im Neu-Blatt
 * legte eine Seite mit den Blöcken ["text", "blatt"] an und liess
 * `dokumentModus` auf `false`. Man landete im TEXTEDITOR — ein leerer Absatz
 * oben, das Blatt als Kasten darunter — und musste „Dokumentmodus" erst
 * selbst finden, um darauf schreiben zu können.
 *
 * Ein Weg, der das Ding anlegt, aber nicht öffnet. Die Notizhefte machen es
 * längst richtig: `notebook.ts:348` und `:370` setzen die Flagge beim
 * Anlegen.
 *
 *   §1 „Blatt" landet im Dokumentmodus, mit Blattleiste.
 *   §2 „Neue Seite" tut das nicht — die Gegenprobe.
 *   §3 Die Unterzeile sagt, wofür das Blatt da ist.
 *   §4 Am Telefon dasselbe.
 *
 *   node pruefungen/lauf/test394.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9421;
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser: Browser = await chromium.launch();
const auf = async (w: number, h: number, handy: boolean): Promise<Page> => {
  const s = await browser.newPage(handy
    ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: w, height: h } });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await s.waitForFunction(`typeof App === 'object' && typeof DocumentMode === 'object'`,
                          null, { timeout: 20000 });
  await s.waitForTimeout(800);
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  return s;
};

/** Den Weg gehen, den der Neu-Knopf geht — über das Blatt, nicht am Menü vorbei. */
const wegGehen = async (s: Page, id: string): Promise<void> => {
  await s.evaluate(`App.erstellenBlatt()`);
  await s.waitForTimeout(500);
  await s.evaluate(`document.querySelector('[data-neu=${JSON.stringify(id)}]')?.click()`);
  await s.waitForTimeout(1500);
};

const LAGE = `(() => {
  const seite = Store.getBlock(App.aktuelleSeite());
  return { seite: !!seite,
           kinder: seite ? Store.childrenOf(seite.id).map(b => b.type) : [],
           flagge: seite ? !!seite.dokumentModus : null,
           aktiv: seite ? DocumentMode.active(seite) : null,
           imBild: document.body.dataset.dokument === 'an',
           leiste: !!document.querySelector('.blatt-werk') };
})()`;
type Lage = { seite: boolean; kinder: string[]; flagge: boolean | null;
              aktiv: boolean | null; imBild: boolean; leiste: boolean };

/* ==========================================================================
 * §1 · „Blatt" landet im Dokumentmodus
 * ========================================================================*/
console.log('\n1 · Der Weg „Blatt" schlägt das Blatt auch auf');
{
  const s = await auf(1360, 900, false);
  await wegGehen(s, 'blatt');
  const l = await s.evaluate(LAGE) as Lage;
  p('Es gibt eine Seite', l.seite);
  p('… mit einem Blatt darin', l.kinder.includes('blatt'), l.kinder.join(', '));
  p('Der Dokumentmodus ist gesetzt', l.flagge === true);
  p('… und wirklich aktiv', l.aktiv === true);
  p('Die Schale ist weg — man sieht das Blatt', l.imBild);
  p('Und die Blattleiste steht da', l.leiste);
  await s.close();
}

/* ==========================================================================
 * §2 · „Neue Seite" tut das nicht — die Gegenprobe
 * --------------------------------------------------------------------------
 * OHNE DIESEN ABSCHNITT wäre §1 auch dann grün, wenn jede neue Seite im
 * Dokumentmodus landete. Eine leere Seite ist ein Textdokument; sie im
 * Dokumentmodus zu öffnen hiesse, den Cursor wegzunehmen.
 * ========================================================================*/
console.log('\n2 · Eine gewöhnliche neue Seite bleibt Text');
{
  const s = await auf(1360, 900, false);
  await wegGehen(s, 'seite');
  const l = await s.evaluate(LAGE) as Lage;
  p('Es gibt eine Seite', l.seite);
  gleich('Kein Blatt darin', l.kinder.filter(t => t === 'blatt'), []);
  p('Und kein Dokumentmodus', l.flagge === false || l.flagge === null,
    String(l.flagge));
  p('Die Schale steht noch', !l.imBild);
  await s.close();
}

/* ==========================================================================
 * §3 · Die Unterzeile sagt, wofür das Blatt da ist
 * --------------------------------------------------------------------------
 * Sie hiess „A4 — liniert, kariert, Punktraster, Millimeter" und beschrieb
 * damit den Bogen, nicht den Zweck. Der NAME bleibt „Blatt": so heisst die
 * Blockart, so heisst die Werkzeugleiste, so heissen E100 und E359. Zwei
 * Namen für dieselbe Sache laufen auseinander (§8).
 * ========================================================================*/
console.log('\n3 · Der Weg sagt, wozu er gut ist');
{
  const s = await auf(1360, 900, false);
  await s.evaluate(`App.erstellenBlatt()`);
  await s.waitForTimeout(600);
  const m = await s.evaluate(`(() => {
    const b = document.querySelector('[data-neu="blatt"]');
    if (!b) return null;
    return { name: (b.querySelector('b') || {}).textContent || '',
             sub: (b.querySelector('i') || {}).textContent || '' };
  })()`) as { name: string; sub: string } | null;
  gleich('Der Weg heisst weiterhin „Blatt"', m && m.name, 'Blatt');
  p('Die Unterzeile nennt die Hand', !!m && /[Hh]and/.test(m.sub), m ? m.sub : 'fehlt');
  p('… und weiterhin das Papier', !!m && /kariert/.test(m.sub), m ? m.sub : 'fehlt');
  await s.close();
}

/* ==========================================================================
 * §4 · Am Telefon dasselbe — dort ist der Weg der wichtigere
 * ========================================================================*/
console.log('\n4 · Und am Telefon genauso');
{
  const s = await auf(390, 844, true);
  await wegGehen(s, 'blatt');
  const l = await s.evaluate(LAGE) as Lage;
  p('Dokumentmodus aktiv', l.aktiv === true);
  p('Die Schale ist weg', l.imBild);
  p('Die Blattleiste steht da', l.leiste);
  await s.close();
}

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
