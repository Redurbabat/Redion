/* Suite 257 — Der Papierkorb bekommt einen Zeitstempel (E250, L73 Teil 1)
 * ============================================================================
 * Der L6-Leser fand es als Beifund: `trashBlock` setzte alive:false und
 * trashedAt — aber nicht `edited`. `zuSchicken` filtert nach `edited`,
 * also trug ein Block, dessen letzte Bearbeitung vor der Hoch-Marke lag,
 * sein Papierkorb-Flag NIE zum Server: hier gelöscht, drüben lebte er
 * weiter. Dieselbe Falle, für die Sammlung und Ansicht längst ihren
 * Zeitstempel bekommen hatten.
 *
 * §1 EIN ALTER BLOCK wandert in den Papierkorb — und drüben auch: erst
 *    gemeinsamer Stand (die Marke rückt am Block vorbei), DANN Papierkorb.
 * §2 DIE GEGENRICHTUNG: Wiederherstellen kommt drüben an — sonst bliebe
 *    der Block dort im Papierkorb und fiele nach der Frist ins Endgültige.
 * §3 DER STEMPEL SELBST: beide Wege heben `edited` messbar an.
 *
 * Ports: 9022 (Prüfserver) und 9023 (App + Durchreiche).
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';

const REPO = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json' };

const kern = await starte(9022);
const PORT = 9023;

const alles = http.createServer(async (req, res) => {
  const weg2 = req.url ?? '/';
  const u = new URL(weg2, 'http://x');
  const serverWeg = /^\/(konto|sync|datei|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname ?? '') || /^\/v1\//.test(u.pathname ?? '') || u.pathname === '/api/stand';
  if (serverWeg) {
    const stuecke: Buffer[] = [];
    for await (const st of req) stuecke.push(Buffer.from(st));
    const antwort = await fetch('http://localhost:9022' + weg2, {
      method: req.method || 'GET',
      headers: { 'Content-Type': String(req.headers['content-type'] || 'application/json'),
        ...(req.headers.authorization ? { Authorization: String(req.headers.authorization) } : {}),
        ...(req.headers['redion-geraet'] ? { 'Redion-Geraet': String(req.headers['redion-geraet']) } : {}) },
      ...(stuecke.length ? { body: Buffer.concat(stuecke) as any } : {})
    });
    res.statusCode = antwort.status;
    res.setHeader('Content-Type', antwort.headers.get('Content-Type') || 'application/json');
    res.end(Buffer.from(await antwort.arrayBuffer()));
    return;
  }
  let pfad = path.join(REPO, decodeURIComponent((weg2 || '/').split('?')[0]!));
  if (fs.existsSync(pfad) && fs.statSync(pfad).isDirectory()) pfad = path.join(pfad, 'index.html');
  if (!fs.existsSync(pfad) || !pfad.startsWith(REPO)) { res.statusCode = 404; res.end('weg'); return; }
  res.setHeader('Content-Type', TYP[path.extname(pfad)] || 'application/octet-stream');
  res.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => alles.listen(PORT, () => f()));
const WURZEL = 'http://localhost:' + PORT;

let ok = 0, weg = 0;
const p = (name: string, gut: unknown, ist = ''): void => {
  if (gut) ok++; else weg++;
  console.log((gut ? '  ✓ ' : '  ✗ ') + name + (gut || !ist ? '' : ' — ' + ist));
};

await kern.ablage.setze('konten', { id: 'k1', mail: 'red@x.ch', name: 'Redur',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
const machToken = async (konto = 'k1'): Promise<string> => {
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: konto,
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const chefToken = await machToken();
const b = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + chefToken },
  body: JSON.stringify({ name: 'Papierkorbprobe' }) });
const BEREICH = (await b.json()).id;

const browser = await chromium.launch();
const fehler: string[] = [];
const geraet = async (name: string) => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 850 } });
  const seite = await ctx.newPage();
  seite.on('pageerror', (e: Error) => fehler.push(name + ': ' + e.message));
  await seite.goto(WURZEL + '/index.html');
  await seite.waitForTimeout(1800);
  const t = await machToken();
  await seite.evaluate(async ([tok, ber, nm]: [string, string, string]) => {
    Store.setMeta('wolkeToken', tok);
    Store.setMeta('wolkeBereich', ber);
    Store.setMeta('wolkeGeraet', nm);
    await Wolke.tokenUebernehmen(tok);
    await Wolke.schluesselSetzen('mein langer geheimer satz');
    Wolke.abgleichSetzen(true);
  }, [t, BEREICH, name] as [string, string, string]);
  return { seite, ctx };
};

const A = await geraet('Rechner');
const B2 = await geraet('Telefon');

console.log('\n1 · Ein alter Block wandert in den Papierkorb — auch drüben');
/* Erst der gemeinsame Stand: der Block geht hoch, BEIDE Marken rücken an
   seinem `edited` vorbei. Genau die Lage, in der das Flag vorher verloren
   ging. */
const blockId = await A.seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Altbestand' });
  const bl = Store.addBlock(s.id, 'text', { text: 'Ich bin von gestern.' });
  await Store.flush();
  await Wolke.abgleichen();
  await Wolke.abgleichen();
  return bl.id;
}) as string;
p('Gerät B sieht den Block lebendig', await B2.seite.evaluate(async (id: string) => {
  await Wolke.abgleichen();
  return Store.getBlock(id)?.alive !== false;
}, blockId));

const stempel = await A.seite.evaluate(async (id: string) => {
  const vorher = String(Store.getBlock(id)?.edited || '');
  await new Promise(r => setTimeout(r, 5));
  Store.trashBlock(id);
  const nachher = String(Store.getBlock(id)?.edited || '');
  await Store.flush();
  await Wolke.abgleichen();
  return { vorher, nachher, alive: Store.getBlock(id)?.alive };
}, blockId) as { vorher: string; nachher: string; alive: boolean };
p('trashBlock hebt edited an', stempel.nachher > stempel.vorher,
  stempel.vorher + ' → ' + stempel.nachher);

let beiB: any = null;
for (let i = 0; i < 16; i++) {
  await B2.seite.waitForTimeout(400);
  beiB = await B2.seite.evaluate(async (id: string) => {
    await Wolke.abgleichen();
    const bl = Store.getBlock(id);
    return bl ? { alive: bl.alive } : null;
  }, blockId);
  if (beiB && beiB.alive === false) break;
}
p('Drüben liegt er jetzt auch im Papierkorb — das Flag ist gewandert',
  !!beiB && beiB.alive === false, JSON.stringify(beiB));

console.log('\n2 · Wiederherstellen kommt drüben an');
const zurueck = await A.seite.evaluate(async (id: string) => {
  const vorher = String(Store.getBlock(id)?.edited || '');
  await new Promise(r => setTimeout(r, 5));
  Store.restoreBlock(id);
  const nachher = String(Store.getBlock(id)?.edited || '');
  await Store.flush();
  await Wolke.abgleichen();
  return { vorher, nachher };
}, blockId) as { vorher: string; nachher: string };
p('restoreBlock hebt edited ebenfalls an', zurueck.nachher > zurueck.vorher,
  zurueck.vorher + ' → ' + zurueck.nachher);

let wieder: any = null;
for (let i = 0; i < 16; i++) {
  await B2.seite.waitForTimeout(400);
  wieder = await B2.seite.evaluate(async (id: string) => {
    await Wolke.abgleichen();
    const bl = Store.getBlock(id);
    return bl ? { alive: bl.alive !== false, text: bl.text } : null;
  }, blockId);
  if (wieder && wieder.alive) break;
}
p('Drüben lebt er wieder — mit unverändertem Text',
  !!wieder && wieder.alive && wieder.text === 'Ich bin von gestern.',
  JSON.stringify(wieder));

p('Keine Seitenfehler auf beiden Geräten', fehler.length === 0, fehler.join(' | '));

await browser.close();
alles.close();
await kern.stopp();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
