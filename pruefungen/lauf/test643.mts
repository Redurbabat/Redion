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
import { appBlock, appPage, stampAfter } from '../../server/mcp/page-blocks.ts';
import { buildSchema, databaseRecords, rowProps, rowRecord } from '../../server/mcp/databases.ts';

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
  /* ====================================================================
   * §4 · Nach einem Neuladen fehlt der Schlüssel — dann geht NICHTS hinaus
   *      (E797, 19. November 2026: 4 646 Sätze im Klartext)
   * ==================================================================*/
  console.log('\n§4 Neuladen ohne Schlüssel');
  const p4 = await geraet();
  const tok4 = await token();
  await p4.evaluate(async ([t, ber]: [string, string]) => {
    Store.setMeta('wolkeBereich', ber);
    await Wolke.tokenUebernehmen(t);
    await Wolke.schluesselSetzen('ein langer geheimer satz zum pruefen');
    Wolke.abgleichSetzen(true);
    await Wolke.abgleichen();
  }, [tok4, BEREICH]);
  await p4.reload();
  await p4.waitForTimeout(1800);
  const nachLaden = await p4.evaluate(async () => {
    const zeit = new Date().toISOString();
    Store.rohSetzen('blocks', { id: 'b643_neu', type: 'text', text: 'GEHEIM nach Neustart', content: [], parentId: 'p643',
      parentTable: 'block', color: '', created: zeit, edited: zeit, alive: true, erstelltVon: '' });
    const erlaubt = Wolke.abgleichErlaubt(), schluessel = Wolke.hatSchluessel(), fehlt = Wolke.schluesselFehlt();
    const ab = await Wolke.abgleichen().then(() => 'ok', (e: Error) => 'fehler: ' + e.message);
    const direkt = await Wolke.hoch().then(() => 'ok', (e: Error) => 'fehler: ' + e.message);
    return { erlaubt, schluessel, fehlt, ab, direkt, fehlerText: Wolke.zustand.fehler || '' };
  });
  pruef('§4 Nach dem Neuladen ist der Abgleich noch erlaubt (der gefährliche Fall)', nachLaden.erlaubt);
  pruef('§4 … und der Schlüssel ist weg', !nachLaden.schluessel && nachLaden.fehlt);
  const neu = (await serverSaetze()).find(s => String(s.id) === 'b643_neu');
  pruef('§4 Der neue Block ging NICHT hinaus', !neu, neu ? 'verschluesselt=' + neu.verschluesselt : '');
  pruef('§4 Kein einziger Klartext-Satz am Server', (await serverSaetze()).every(s => Number(s.verschluesselt) === 1 || String(s.id).startsWith('pruef')),
    String((await serverSaetze()).filter(s => Number(s.verschluesselt) !== 1).length));
  pruef('§4 Auch ein direkter hoch() bricht ab', /Schlüssel fehlt/.test(nachLaden.direkt), nachLaden.direkt);
  pruef('§4 Das Fenster sagt, was zu tun ist', /Schlüssel setzen/.test(nachLaden.fehlerText), nachLaden.fehlerText);
  await p4.evaluate(async () => {
    await Wolke.schluesselSetzen('ein langer geheimer satz zum pruefen');
    await Wolke.abgleichen();
  });
  const danach = (await serverSaetze()).find(s => String(s.id) === 'b643_neu');
  pruef('§4 Mit dem Schlüssel geht er hinaus — verschlüsselt', !!danach && Number(danach.verschluesselt) === 1,
    danach ? 'verschluesselt=' + danach.verschluesselt : 'fehlt');

  /* ====================================================================
   * §6 · Was ChatGPT anlegt, erscheint von selbst — und bleibt lesbar
   * Redur, 21. November 2026: „wenn chat gpt etwas erstelle das ich über
   * windows app und ios app direk alles sofort sehen kann ohne selber
   * etwas mache". Die Seite wird so geschrieben, wie der Cloud-MCP sie
   * schreibt (server/mcp/page-blocks.ts) — die App wird NICHT angestossen.
   * ==================================================================*/
  console.log('\n§6 Live holen');
  const latest = (await serverSaetze()).map(s => String(s.geaendert || '')).sort().pop();
  const at = stampAfter(latest);
  const kind = appBlock('gpt643b0', 'h1', 'Von ChatGPT', 'gpt643', at);
  const gptSeite = appPage('gpt643', 'ChatGPT-Seite', null, ['gpt643b0'], at);
  for (const [satz, seite] of [[kind, 'gpt643'], [gptSeite, 'gpt643']] as const)
    await kern.ablage.setze('saetze', { id: satz.id, bereich: BEREICH, tabelle: 'blocks', daten: JSON.stringify(satz),
      verschluesselt: 0, seite, version: 1, geaendert: at, geloescht: 0, vonGeraet: 'Cloud-MCP' });
  const t0 = Date.now();
  let da = false;
  while (!da && Date.now() - t0 < 12000) {
    await p4.waitForTimeout(500);
    da = await p4.evaluate(() => !!Store.getBlock('gpt643') && !!Store.getBlock('gpt643b0'));
  }
  const dauer = Date.now() - t0;
  pruef('§6 Die Seite kommt ohne Zutun an — in weniger als 8 s', da && dauer < 8000, da ? dauer + ' ms' : 'nach 12 s nicht da');
  const imBaum = await p4.evaluate(() => ({
    wurzel: Store.rootPages().some((p: any) => p.id === 'gpt643'),
    kinder: Store.childrenOf('gpt643').map((b: any) => b.type + ':' + b.text),
    geteilt: (Store.getMeta('wolkeGeteilt', []) || []).includes('gpt643')
  }));
  pruef('§6 Sie steht in der Seitenliste, nicht im Papierkorb', imBaum.wurzel);
  pruef('§6 … mit ihrem Inhalt', JSON.stringify(imBaum.kinder) === '["h1:Von ChatGPT"]', JSON.stringify(imBaum.kinder));
  pruef('§6 Sie bleibt für die KI lesbar (wolkeGeteilt)', imBaum.geteilt);
  await p4.evaluate(async () => {
    Store.updateBlock('gpt643b0', { text: 'Von ChatGPT, ergänzt hier' });
    await Wolke.abgleichen();
  });
  const zurueck = (await serverSaetze()).find(s => String(s.id) === 'gpt643b0');
  pruef('§6 Eine Änderung hier geht im Klartext zurück — ChatGPT kann sie lesen',
    !!zurueck && Number(zurueck.verschluesselt) === 0 && /ergänzt hier/.test(String(zurueck.daten)),
    zurueck ? 'verschluesselt=' + zurueck.verschluesselt : 'fehlt');
  pruef('§6 Alles andere bleibt verschlüsselt', (await serverSaetze()).every(s =>
    Number(s.verschluesselt) === 1 || String(s.id).startsWith('gpt643') || String(s.id).startsWith('pruef')),
    (await serverSaetze()).filter(s => Number(s.verschluesselt) !== 1).map(s => s.id).join(','));
  /* §6b · Eine Datenbank von ChatGPT — Sammlung, Ansicht, Block, Zeilen, so
     wie server/mcp/databases.ts sie für redion_create_database baut. */
  const at6 = stampAfter((await serverSaetze()).map(s => String(s.geaendert || '')).sort().pop());
  const schema6 = buildSchema([{ name: 'Thema', typ: 'title' }, { name: 'Status', typ: 'status' }, { name: 'Bis', typ: 'date' }], 'gpt6');
  const rec6 = databaseRecords({ name: 'Lernplan', schema: schema6, layout: 'table', pageId: 'gpt643', seed: 'gpt6', at: at6 });
  const z6 = rowProps(schema6, { Thema: 'Schütze', Status: 'Offen', Bis: '2026-12-01' });
  const zeile6 = rowRecord('gpt6r0', rec6.colId, z6.props, z6.title, at6, 1);
  const neuSeite6 = { ...gptSeite, content: ['gpt643b0', rec6.blockId], edited: at6 };
  for (const [tabelle, satz, seite] of [['collections', rec6.collection, rec6.colId], ['views', rec6.view, rec6.colId],
      ['blocks', rec6.block, 'gpt643'], ['blocks', zeile6, 'gpt6r0'], ['blocks', neuSeite6, 'gpt643']] as const)
    await kern.ablage.setze('saetze', { id: satz.id, bereich: BEREICH, tabelle, daten: JSON.stringify(satz),
      verschluesselt: 0, seite, version: satz === neuSeite6 ? 2 : 1, geaendert: at6, geloescht: 0, vonGeraet: 'Cloud-MCP' });
  let db6: any = null;
  const t6 = Date.now();
  while (Date.now() - t6 < 12000) {
    await p4.waitForTimeout(500);
    db6 = await p4.evaluate((col: string) => {
      const c = Store.getCollection(col);
      if (!c) return null;
      const rows = Store.rowsOf(col);
      return { name: c.name, rows: rows.map((r: any) => [r.text, r.props[Object.keys(c.schema).find(k => c.schema[k].name === 'Status')!]]),
        imSeitenbaum: (Store.getBlock('gpt643')?.content || []).includes('dgpt6'),
        geteilt: ['cgpt6', 'gpt6r0'].map(id => (Store.getMeta('wolkeGeteilt', []) || []).includes(id)) };
    }, rec6.colId);
    if (db6 && db6.rows.length) break;
  }
  pruef('§6b Die Datenbank von ChatGPT kommt ohne Zutun an', !!db6 && db6.name === 'Lernplan' &&
    JSON.stringify(db6.rows) === '[["Schütze","Offen"]]', JSON.stringify(db6));
  pruef('§6b … steht auf der Seite', !!db6?.imSeitenbaum, JSON.stringify(db6));
  pruef('§6b … und bleibt für die KI lesbar (Sammlung und Zeile)', JSON.stringify(db6?.geteilt) === '[true,true]', JSON.stringify(db6?.geteilt));
  await p4.evaluate(async () => {
    const c = Store.getCollection('cgpt6');
    const key = Object.keys(c.schema).find((k: string) => c.schema[k].name === 'Status')!;
    Store.setProp('gpt6r0', key, 'Erledigt');
    await Wolke.abgleichen();
  });
  const zurueck6 = (await serverSaetze()).find(s => String(s.id) === 'gpt6r0');
  pruef('§6b Eine Änderung an der Zeile geht im Klartext zurück',
    !!zurueck6 && Number(zurueck6.verschluesselt) === 0 && /Erledigt/.test(String(zurueck6.daten)),
    zurueck6 ? 'verschluesselt=' + zurueck6.verschluesselt : 'fehlt');
  const klar6 = (await serverSaetze()).filter(s => Number(s.verschluesselt) !== 1).map(s => String(s.id))
    .filter(id => !/^(gpt643|gpt6r|[cvd]gpt6|pruef)/.test(id));
  pruef('§6b Ausser den Sätzen von ChatGPT bleibt alles verschlüsselt', klar6.length === 0, klar6.join(','));

  /* „Nur von Hand" heisst auch: kein Live-Holen. */
  const handAus = await p4.evaluate(() => { Store.setMeta('wolkeTakt', '0'); Wolke.takt(); return Wolke.liveStellen(); });
  pruef('§6 Mit „nur von Hand" läuft kein Live-Holen', handAus === 0, String(handAus));

  /* ====================================================================
   * §7 · Die Windows-App merkt sich den Schlüssel (E799)
   * Redur, 21. November 2026: „Ja, merken". Die Brücke `RedionDesktop`
   * wird hier nachgebildet; ihr Speicher lebt in Node, damit er ein
   * Neuladen überlebt — wie die DPAPI-Datei der Windows-App.
   * ==================================================================*/
  console.log('\n§7 Gemerkter Schlüssel');
  const tresor: { satz: string | null; holen: number; vergessen: number } = { satz: null, holen: 0, vergessen: 0 };
  const ctx7 = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx7.exposeFunction('__tresor', (was: string, satz?: string) => {
    if (was === 'holen') { tresor.holen++; return tresor.satz; }
    if (was === 'merken') { tresor.satz = String(satz); return true; }
    tresor.vergessen++; tresor.satz = null; return true;
  });
  await ctx7.addInitScript(() => {
    const t = (window as any).__tresor;
    (window as any).RedionDesktop = Object.freeze({ platform: 'windows',
      schluesselHolen: () => t('holen'), schluesselMerken: (s: string) => t('merken', s),
      schluesselVergessen: () => t('vergessen') });
  });
  const p7 = await ctx7.newPage();
  p7.on('pageerror', (e: Error) => fehler.push(e.message));
  await p7.goto(WURZEL + '/index.html');
  await p7.waitForTimeout(1800);
  const tok7 = await token();
  await p7.evaluate(async ([t, ber]: [string, string]) => {
    Store.setMeta('wolkeBereich', ber);
    await Wolke.tokenUebernehmen(t);
    await Wolke.schluesselSetzen('ein langer geheimer satz zum pruefen');
    Wolke.abgleichSetzen(true);
    await Wolke.abgleichen();
  }, [tok7, BEREICH]);
  pruef('§7 Ein bestandener Satz wird gemerkt', tresor.satz === 'ein langer geheimer satz zum pruefen');
  await p7.reload();
  await p7.waitForFunction(() => !!(window as any).Wolke?.zustand?.letzter, null, { timeout: 20000 }).catch(() => {});
  const nach7 = await p7.evaluate(() => ({ hat: Wolke.hatSchluessel(), fehlt: Wolke.schluesselFehlt(),
    fehler: Wolke.zustand.fehler || '', letzter: Wolke.zustand.letzter || '' }));
  pruef('§7 Nach dem Neustart ist der Schlüssel ohne Eingabe wieder da', nach7.hat && !nach7.fehlt, JSON.stringify(nach7));
  pruef('§7 … und der Abgleich ist gelaufen', !!nach7.letzter && !/Schlüssel fehlt/.test(nach7.fehler), JSON.stringify(nach7));
  tresor.satz = 'ein ganz anderer falscher satz';
  await p7.reload();
  await p7.waitForTimeout(5500);
  const falsch7 = await p7.evaluate(() => ({ hat: Wolke.hatSchluessel(), fehlt: Wolke.schluesselFehlt() }));
  pruef('§7 Ein falscher gemerkter Satz öffnet nichts', !falsch7.hat && falsch7.fehlt, JSON.stringify(falsch7));
  pruef('§7 … und wird vergessen', tresor.satz === null && tresor.vergessen >= 1, JSON.stringify(tresor));
  await p7.evaluate(async () => { await Wolke.schluesselSetzen('ein langer geheimer satz zum pruefen'); });
  await p7.evaluate(async () => { await Wolke.abmelden(); });
  pruef('§7 Abmelden vergisst den gemerkten Satz', tresor.satz === null, JSON.stringify(tresor));
  const imSpeicher = await p7.evaluate(() => JSON.stringify(localStorage).includes('geheimer'));
  pruef('§7 Der Satz steht nicht im Browser-Speicher', !imSpeicher);
  await ctx7.close();

  pruef('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
} finally {
  await browser.close();
  await kern.stopp();
  alles.close();
}
console.log(`\n${ok} grün, ${bad} rot`);
process.exit(bad ? 1 : 0);
