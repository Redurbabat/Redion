/* Suite 42 — Zwei Geräte ändern gleichzeitig
 * Der Beweis, dass der Abgleich nichts mehr still wegwirft. */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const REPO = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
const { chromium } = require('playwright');
import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

let ok = 0, bad = 0;
const pruef = (n: any, ist: any, soll: any) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.png': 'image/png', '.svg': 'image/svg+xml',
              '.webmanifest': 'application/manifest+json' };

const kern = await starte(8796);
const PORT = 8797;

const alles = http.createServer(async (req, res) => {
  /* `req.url` steht in den Typen als „vielleicht nicht da"; einmal geprüft,
     dann überall derselbe Weg — auch beim Durchreichen weiter unten. */
  const weg = req.url ?? '/';
  const u = new URL(weg, 'http://x');
  const serverWeg = /^\/(konto|sync|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname) || /^\/v1\//.test(u.pathname) || u.pathname === '/api/stand';
  if (serverWeg) {
    let roh = '';
    for await (const st of req) roh += st;
    /* Dieselben Kopfzeilen weiterreichen, ohne sie umzubauen: `fetch` will
       eine flache Tabelle, `req.headers` kennt auch Mehrfachwerte. */
    const durch: Record<string, any> = req.headers;
    const a = await fetch('http://localhost:8796' + weg, {
      method: req.method ?? 'GET', headers: durch, redirect: 'manual',
      ...(roh ? { body: roh } : {}) });
    const text = await a.text();
    const kopf: Record<string, any> = {};
    a.headers.forEach((v, k) => { if (k !== 'content-encoding') kopf[k] = v; });
    res.writeHead(a.status, kopf); res.end(text); return;
  }
  const pf = path.join(REPO, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!fs.existsSync(pf) || fs.statSync(pf).isDirectory()) { res.writeHead(404); res.end(''); return; }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(pf)] || 'application/octet-stream' });
  res.end(fs.readFileSync(pf));
});
await new Promise<void>(r => alles.listen(PORT, () => r()));
const WURZEL = 'http://localhost:' + PORT;

await kern.ablage.setze('konten', { id: 'k1', mail: 'red@x.ch', name: 'Redur',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
const machToken = async () => {
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: 'k1',
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const b = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await machToken() },
  body: JSON.stringify({ name: 'Geteilt' }) });
const BEREICH = (await b.json()).id;

const browser = await chromium.launch();
const fehler: any[] = [];
const geraet = async (name: string) => {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e: any) => fehler.push(name + ': ' + e.message));
  await p.goto(WURZEL + '/index.html');
  await p.waitForTimeout(1800);
  const t = await machToken();
  await p.evaluate(async ([tok, ber, nm]: [string, string, string]) => {
    Store.setMeta('wolkeToken', tok);
    Store.setMeta('wolkeBereich', ber);
    Store.setMeta('wolkeGeraet', nm);
    await Wolke.tokenUebernehmen(tok);
    await Wolke.schluesselSetzen('mein langer geheimer satz');
  }, [t, BEREICH, name]);
  return { p, ctx };
};

const A = await geraet('Rechner');
const B2 = await geraet('Telefon');

/* ======================================================================== *
 * 1 · EIN GEMEINSAMER STAND
 * ======================================================================== */
console.log('\n--- Ein gemeinsamer Stand ---');

const start = await A.p.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Gemeinsame Seite' });
  const t1 = Store.addBlock(s.id, 'text', { text: 'Der Hund läuft über die Wiese' });
  const db = Store.addDatabase(s.id, 'Aufgaben', {
    title: { name: 'Titel', type: 'title' },
    st: { name: 'Status', type: 'select' },
    pr: { name: 'Priorität', type: 'select' } });
  const c = Store.getCollection(db.collectionId);
  const z = Store.addRow(c.id, { title: 'Erste Aufgabe', st: 'Offen', pr: 'Klein' });
  await new Promise(r => setTimeout(r, 300));
  /* `abgleichen` gibt null zurück, wenn niemand angemeldet ist oder schon
     ein Abgleich läuft. Dann bleiben die Zahlen leer und die Prüfung
     darunter meldet das — statt hier zu werfen. */
  const e = await Wolke.abgleichen();
  return { seite: s.id, text: t1.id, coll: c.id, zeile: z.id, angenommen: e?.angenommen };
});
pruef('Der Rechner legt an und schickt', start.angenommen > 3, true);

const abgeholt = await B2.p.evaluate(async () => {
  const e = await Wolke.abgleichen();
  return { uebernommen: e?.uebernommen, strittig: e?.strittig };
});
pruef('Das Telefon holt ab',           abgeholt.uebernommen > 3, true);
pruef('Ohne Streit beim ersten Mal',   abgeholt.strittig, 0);

const basisDa = await B2.p.evaluate(async (id: string) => {
  const s = await Store.basisHolen(id);
  return !!s && s.id === id;
}, start.seite);
pruef('Der gemeinsame Stand ist gemerkt', basisDa, true);

/* ======================================================================== *
 * 2 · VERSCHIEDENE FELDER — beides muss bleiben
 * ======================================================================== */
console.log('\n--- Verschiedene Felder ---');

await A.p.evaluate(async (x: any) => {
  Store.setProp(x.zeile, 'st', 'Erledigt');
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
}, start);

const beides = await B2.p.evaluate(async (x: any) => {
  /* Das Telefon hat zwischenzeitlich die Priorität geändert — ohne den
     Status des Rechners gesehen zu haben. Genau der Fall, bei dem vorher
     eine der beiden Änderungen still verschwand. */
  Store.setProp(x.zeile, 'pr', 'Gross');
  await new Promise(r => setTimeout(r, 250));
  const e = await Wolke.abgleichen();
  const z = Store.getBlock(x.zeile);
  return { st: z.props.st, pr: z.props.pr, strittig: e?.strittig, gemischt: e?.gemischt };
}, start);
pruef('Der Status vom Rechner kommt an',     beides.st, 'Erledigt');
pruef('Die Priorität vom Telefon bleibt',    beides.pr, 'Gross');
pruef('Das war kein Konflikt',               beides.strittig, 0);
pruef('Und es wurde wirklich gemischt',      beides.gemischt > 0, true);

const zurueck = await A.p.evaluate(async (x: any) => {
  await Wolke.abgleichen();
  const z = Store.getBlock(x.zeile);
  return { st: z.props.st, pr: z.props.pr };
}, start);
pruef('Der Rechner sieht danach beides',     zurueck, { st: 'Erledigt', pr: 'Gross' });

/* ======================================================================== *
 * 3 · VERSCHIEDENE STELLEN IM SELBEN TEXT
 * ======================================================================== */
console.log('\n--- Verschiedene Stellen im Text ---');

await A.p.evaluate(async (x: any) => {
  Store.updateBlock(x.text, { text: 'Der grosse Hund läuft über die Wiese' });
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
}, start);

const text = await B2.p.evaluate(async (x: any) => {
  Store.updateBlock(x.text, { text: 'Der Hund läuft über die Wiese und bellt' });
  await new Promise(r => setTimeout(r, 250));
  const e = await Wolke.abgleichen();
  return { text: Store.getBlock(x.text).text, strittig: e?.strittig };
}, start);
pruef('Beide Ergänzungen stehen im Satz',
  text.text, 'Der grosse Hund läuft über die Wiese und bellt');
pruef('Auch das war kein Konflikt', text.strittig, 0);

/* ======================================================================== *
 * 4 · DIESELBE STELLE — jetzt darf es krachen, aber sichtbar
 * ======================================================================== */
console.log('\n--- Dieselbe Stelle ---');

await B2.p.evaluate(async () => { await Wolke.abgleichen(); });
await A.p.evaluate(async () => { await Wolke.abgleichen(); });

await A.p.evaluate(async (x: any) => {
  Store.setProp(x.zeile, 'st', 'Rechner sagt A');
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
}, start);

const streit = await B2.p.evaluate(async (x: any) => {
  Store.setProp(x.zeile, 'st', 'Telefon sagt B');
  await new Promise(r => setTimeout(r, 250));
  const e = await Wolke.abgleichen();
  const offen = Zusammen.offene();
  return { strittig: e?.strittig, n: offen.length,
           hier: offen[0] && offen[0].hier, dort: offen[0] && offen[0].dort,
           imSatz: Store.getBlock(x.zeile).props.st };
}, start);
pruef('Der Konflikt wird gemeldet',        streit.n, 1);
pruef('Mit der eigenen Fassung',           streit.hier, 'Telefon sagt B');
pruef('Und der fremden daneben',           streit.dort, 'Rechner sagt A');
pruef('Bis zur Entscheidung gilt die eigene', streit.imSatz, 'Telefon sagt B');

const entschieden = await B2.p.evaluate(async (x: any) => {
  const k = Zusammen.offene()[0];
  Zusammen.loese(k.schluessel, 'dort');
  await new Promise(r => setTimeout(r, 250));
  return { n: Zusammen.offene().length, wert: Store.getBlock(x.zeile).props.st };
}, start);
pruef('Nach der Wahl ist die Liste leer',  entschieden.n, 0);
pruef('Und der fremde Wert steht drin',    entschieden.wert, 'Rechner sagt A');

/* ======================================================================== *
 * 5 · BEIDE HÄNGEN EINEN BLOCK AN
 * ======================================================================== */
console.log('\n--- Beide hängen etwas an ---');

await B2.p.evaluate(async () => { await Wolke.abgleichen(); });
await A.p.evaluate(async () => { await Wolke.abgleichen(); });

await A.p.evaluate(async (x: any) => {
  Store.addBlock(x.seite, 'text', { text: 'Absatz vom Rechner' });
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
}, start);

const beideBloecke = await B2.p.evaluate(async (x: any) => {
  Store.addBlock(x.seite, 'text', { text: 'Absatz vom Telefon' });
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
  await Wolke.abgleichen();          /* der eigene Block muss auch hoch */
  const kinder = Store.childrenOf(x.seite).map((k: any) => k.text);
  return { kinder, strittig: Zusammen.offene().length };
}, start);
pruef('Beide Absätze stehen auf der Seite',
  beideBloecke.kinder.filter((t: any) => t && t.startsWith('Absatz vom')).length, 2);
pruef('Ohne Streit',  beideBloecke.strittig, 0);

const beimRechner = await A.p.evaluate(async (x: any) => {
  await Wolke.abgleichen();
  await Wolke.abgleichen();
  return Store.childrenOf(x.seite).map((k: any) => k.text)
    .filter((t: any) => t && t.startsWith('Absatz vom')).length;
}, start);
pruef('Der Rechner sieht auch beide', beimRechner, 2);

/* ======================================================================== *
 * 5b · EINE NEUE SPALTE — der Aufbau muss auch wandern
 * ======================================================================== */
console.log('\n--- Eine neue Spalte ---');

await B2.p.evaluate(async () => { await Wolke.abgleichen(); });
await A.p.evaluate(async () => { await Wolke.abgleichen(); });

await A.p.evaluate(async (x: any) => {
  const c = Store.getCollection(x.coll);
  c.schema.neu = { name: 'Nachtrag', type: 'text' };
  Store.updateCollection(c.id, { schema: c.schema });
  Store.setProp(x.zeile, 'neu', 'steht drin');
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
}, start);

const spalte = await B2.p.evaluate(async (x: any) => {
  await Wolke.abgleichen();
  const c = Store.getCollection(x.coll);
  return { spalte: !!(c.schema.neu), name: c.schema.neu && c.schema.neu.name,
           wert: Store.getBlock(x.zeile).props.neu };
}, start);
pruef('Die neue Spalte kommt beim Telefon an', spalte.spalte, true);
pruef('Mit ihrem Namen',                       spalte.name, 'Nachtrag');
pruef('Und ihrem Wert',                        spalte.wert, 'steht drin');

/* ======================================================================== *
 * 6 · NEU LADEN — überlebt der geholte Stand?
 * ======================================================================== */
console.log('\n--- Nach dem Neuladen ---');

await B2.p.evaluate(() => Store.flush());
await B2.p.reload();
await B2.p.waitForTimeout(1800);
const nachNeustart = await B2.p.evaluate((x: any) => {
  const s = Store.getBlock(x.seite);
  const z = Store.getBlock(x.zeile);
  return { seite: !!s, titel: s && s.text, zeile: !!z,
           kinder: Store.childrenOf(x.seite).length };
}, start);
pruef('Die geholte Seite ist noch da',   nachNeustart.seite, true);
pruef('Mit ihrem Titel',                 nachNeustart.titel, 'Gemeinsame Seite');
pruef('Die geholte Zeile auch',          nachNeustart.zeile, true);
pruef('Und ihre Kinder',                 nachNeustart.kinder > 2, true);

/* ======================================================================== *
 * 7 · ABMELDEN RÄUMT AUF
 * ======================================================================== */
console.log('\n--- Abmelden ---');
const nachAbmelden = await B2.p.evaluate(async () => {
  await Wolke.abmelden();
  const alle = await Store.basisAlle();
  return { n: alle.length, marke: Store.getMeta('wolkeMarkeRunter', 'x') };
});
pruef('Der gemerkte Stand ist weg',  nachAbmelden.n, 0);
pruef('Und die Marken auch',         nachAbmelden.marke, '');

await browser.close();
alles.close();
await kern.stopp();

console.log('');
if (fehler.length) { console.log('JS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
else console.log('Keine JS-Fehler.');
console.log(`\n${ok}/${ok + bad} bestanden`);
process.exit(bad || fehler.length ? 1 : 0);
