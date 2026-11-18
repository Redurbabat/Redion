/* test643 — Der Abgleich schickt keine Riesenpakete und verspricht keine
 * Verschlüsselung, die es nicht gibt (E796).
 *
 * Am 18. November 2026 lief der erste echte Abgleich der Windows-App (1,1 GB,
 * 11 000 Blöcke). Zwei Dinge gingen schief, und beide hält dieser Lauf fest:
 *
 *  §1  Ein zu kurzer Schlüsselsatz wurde abgewiesen — die Frage danach sagte
 *      trotzdem „verschlüsselt“, und 961 Sätze gingen im Klartext hinaus.
 *      Jetzt: ohne Schlüssel sagt die Frage „KEIN Schlüssel … IM KLARTEXT“,
 *      und „Abbrechen“ lässt nichts hinaus.
 *  §2  Nach dem ersten Paket riss der Abgleich mit „Server nicht erreichbar“
 *      ab. Jetzt hat ein Paket eine Bytegrenze (4 MB); dreissig grosse Blöcke
 *      in DERSELBEN Millisekunde gehen in mehreren Aufrufen und kommen alle
 *      an — der Rest einer zerschnittenen Millisekunde reist über die
 *      Nachtrag-Liste (E314), nicht über die Marke.
 *  §3  Ein einzelner Satz über 12 MB geht gar nicht hinaus, bleibt auf dem
 *      Gerät, wird gezählt — und hält den Rest nicht auf.
 *
 * Echte App, echter Kern (server/pruefserver.ts), Ports über listen(0).
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let ok = 0, bad = 0;
const pruef = (n: string, gut: boolean, info = '') => {
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : '  ' + info));
  gut ? ok++ : bad++;
};

const kern = await starte(0);
const kernPort = (kern.server.address() as AddressInfo).port;
const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json' };
/* Jede /sync/hoch-Anfrage wird mit ihrer Grösse festgehalten. */
const hochGroessen: number[] = [];
const alles = http.createServer(async (req, res) => {
  const weg = req.url ?? '/';
  const u = new URL(weg, 'http://x');
  if (/^\/(konto|sync|datei|bereich)(\/|$)/.test(u.pathname) || u.pathname === '/api/stand') {
    const teile: Buffer[] = [];
    for await (const st of req) teile.push(Buffer.from(st));
    const rumpf = Buffer.concat(teile);
    if (u.pathname === '/sync/hoch') hochGroessen.push(rumpf.length);
    const durch: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers))
      if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(k) && typeof v === 'string') durch[k] = v;
    const a = await fetch('http://localhost:' + kernPort + weg, { method: req.method ?? 'GET', headers: durch,
      ...(rumpf.length ? { body: rumpf } : {}) });
    const text = await a.text();
    const kopf: Record<string, string> = {};
    a.headers.forEach((v, k) => { if (k !== 'content-encoding' && k !== 'content-length') kopf[k] = v; });
    res.writeHead(a.status, kopf); res.end(text); return;
  }
  const pf = path.join(REPO, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!fs.existsSync(pf) || fs.statSync(pf).isDirectory()) { res.writeHead(404); res.end(''); return; }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(pf)] || 'application/octet-stream' });
  res.end(fs.readFileSync(pf));
});
await new Promise<void>(r => alles.listen(0, () => r()));
const WURZEL = 'http://localhost:' + (alles.address() as AddressInfo).port;

await kern.ablage.setze('konten', { id: 'k1', mail: 'p@x.ch', name: 'Prüfung', bild: '', herkunft: 'test',
  angelegt: new Date().toISOString(), gesperrt: 0 });
const token = async () => {
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: 'k1', geraet: 'Prüfung',
    angelegt: new Date().toISOString(), bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const b = await fetch(WURZEL + '/bereich', { method: 'POST', headers: { 'Content-Type': 'application/json',
  Authorization: 'Bearer ' + await token() }, body: JSON.stringify({ name: 'Prüfbereich' }) });
const BEREICH = (await b.json()).id as string;

const browser = await chromium.launch();
const fehler: string[] = [];
const geraet = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e: Error) => fehler.push(e.message));
  await p.goto(WURZEL + '/index.html');
  await p.waitForTimeout(1800);
  return p;
};
const serverSaetze = async () => (await kern.ablage.finde('saetze', { bereich: BEREICH }));

try {
  /* ====================================================================
   * §1 · Ohne Schlüssel verspricht die Frage keine Verschlüsselung
   * ==================================================================*/
  console.log('\n§1 Die Frage zum Abgleich sagt die Wahrheit über den Schlüssel');
  const p1 = await geraet();
  const tok1 = await token();
  await p1.evaluate(async ([t, ber]: [string, string]) => {
    Store.setMeta('wolkeBereich', ber);
    await Wolke.tokenUebernehmen(t);
  }, [tok1, BEREICH]);
  const dialoge: string[] = [];
  p1.on('dialog', async (d: any) => { dialoge.push(d.message()); await d.dismiss(); });
  await p1.evaluate(() => (window as any).WolkeFenster.dialog());
  await p1.waitForTimeout(400);
  await p1.click('#wo-inhalt [data-a="abgleich-an"]');
  /* Zuerst die Schlüsselfrage (UI.frage) — abbrechen. */
  await p1.waitForTimeout(500);
  const abbrechen = p1.locator('button', { hasText: 'Abbrechen' }).last();
  if (await abbrechen.count()) await abbrechen.click();
  await p1.waitForTimeout(800);
  const vorher = (await serverSaetze()).length;
  pruef('Ohne Schlüssel nennt die Frage den Klartext',
    dialoge.some(m => /KEIN Schlüssel/.test(m) && /KLARTEXT/.test(m)), JSON.stringify(dialoge));
  pruef('… und verspricht nicht „verschlüsselt“',
    !dialoge.some(m => /verschlüsselt — zum Server/.test(m)), JSON.stringify(dialoge));
  pruef('„Abbrechen“ lässt den Abgleich aus', !(await p1.evaluate(() => Wolke.abgleichErlaubt())));
  pruef('… und nichts geht hinaus', vorher === 0, 'Sätze am Server: ' + vorher);

  /* ====================================================================
   * §2 · Grosse Blöcke in einer Millisekunde: viele Pakete, alle kommen an
   * §3 · Ein übergrosser Satz bleibt auf dem Gerät
   * ==================================================================*/
  console.log('\n§2/§3 Bytegrenze und Übergrösse');
  const p2 = await geraet();
  const tok2 = await token();
  const angelegt = await p2.evaluate(async ([t, ber]: [string, string]) => {
    Store.setMeta('wolkeBereich', ber);
    await Wolke.tokenUebernehmen(t);
    await Wolke.schluesselSetzen('ein langer geheimer satz zum pruefen');
    const zeit = '2026-11-18T12:00:00.000Z';
    const seite = { id: 'p643', type: 'page', text: 'Gross', content: [] as string[], parentId: null,
      parentTable: 'block', color: '', created: zeit, edited: zeit, alive: true, erstelltVon: '' };
    Store.rohSetzen('blocks', seite);
    for (let i = 0; i < 30; i++) {
      const id = 'b643_' + i;
      seite.content.push(id);
      Store.rohSetzen('blocks', { id, type: 'text', text: String(i).padStart(3, '0') + 'x'.repeat(300000),
        content: [], parentId: 'p643', parentTable: 'block', color: '', created: zeit, edited: zeit, alive: true, erstelltVon: '' });
    }
    Store.rohSetzen('blocks', { id: 'b643_riese', type: 'text', text: 'y'.repeat(13 * 1024 * 1024),
      content: [], parentId: 'p643', parentTable: 'block', color: '', created: zeit, edited: zeit, alive: true, erstelltVon: '' });
    Wolke.abgleichSetzen(true);
    return Object.keys(Store.cache.blocks).filter(k => k.startsWith('b643_') || k === 'p643').length;
  }, [tok2, BEREICH]);
  pruef('32 Prüfsätze lokal angelegt', angelegt === 32, String(angelegt));

  hochGroessen.length = 0;
  const lauf = await p2.evaluate(async () => {
    try { for (let i = 0; i < 6; i++) await Wolke.abgleichen(); return { ok: true, fehler: Wolke.zustand.fehler || '' }; }
    catch (e) { return { ok: false, fehler: String((e as Error).message || e) }; }
  });
  pruef('Der Abgleich läuft ohne Fehler durch', lauf.ok && !lauf.fehler, JSON.stringify(lauf));

  const MB = 1024 * 1024;
  const groesste = Math.max(0, ...hochGroessen);
  pruef('Kein Paket über 4,5 MB', groesste <= 4.5 * MB, (groesste / MB).toFixed(2) + ' MB, ' + hochGroessen.length + ' Pakete');
  pruef('Die Millisekunde wurde auf mehrere Pakete verteilt', hochGroessen.length >= 3, hochGroessen.length + ' Pakete');

  const oben = await serverSaetze();
  const ids = new Set(oben.map(s => String(s.id)));
  const fehlend = Array.from({ length: 30 }, (_, i) => 'b643_' + i).filter(id => !ids.has(id));
  pruef('Alle 30 grossen Blöcke sind angekommen', fehlend.length === 0, 'fehlt: ' + fehlend.join(','));
  pruef('Die Seite ist angekommen', ids.has('p643'));
  pruef('Alles verschlüsselt', oben.filter(s => String(s.id).includes('643')).every(s => Number(s.verschluesselt) === 1));
  pruef('§3 Der Riese ging nicht hinaus', !ids.has('b643_riese'));
  const lokal = await p2.evaluate(() => ({
    riese: !!Store.cache.blocks['b643_riese'], gezaehlt: Number(Wolke.zustand.zuGrossLokal) || 0,
    nachtrag: (Store.getMeta('wolkeNachtrag', []) || []).filter((x: string) => String(x).includes('643')).length }));
  pruef('§3 … er bleibt auf dem Gerät', lokal.riese);
  pruef('§3 … und wird gezählt', lokal.gezaehlt >= 1, String(lokal.gezaehlt));
  pruef('Die Nachtrag-Liste ist danach leer', lokal.nachtrag === 0, String(lokal.nachtrag));
  pruef('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
} finally {
  await browser.close();
  await kern.stopp();
  alles.close();
}
console.log(`\n${ok} grün, ${bad} rot`);
process.exit(bad ? 1 : 0);
