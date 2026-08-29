/* Suite 256 — Datei-Grabsteine: lokales Löschen erreicht den Server (E249/L6)
 * ============================================================================
 * L6 stand seit Wochen in LUECKEN.md: „Lokales Löschen wandert nicht zum
 * Server — es gibt keinen lokalen Grabstein." Der Server KONNTE es längst
 * (/datei/weg legt den Grabstein an, /datei/stand verteilt ihn, der Client
 * wendet ihn an) — nur rief ihn niemand. Jetzt ruft ihn die Maschine, und
 * dieser Lauf beweist es mit einem ECHTEN Server und ZWEI echten Geräten
 * (dasselbe Gerüst wie test118).
 *
 * §1 GEMEINSAMER BESTAND: A lädt eine Datei hoch, B bekommt sie.
 * §2 A LÖSCHT über den echten Nutzerweg (Dateien.weg): der Grabstein liegt
 *    in der Merkliste, die Kennung verlässt das Oben-Set.
 * §3 DER GRABSTEIN ÜBERLEBT DAS NEULADEN — sonst stürbe die Löschabsicht
 *    mit dem Tab (§25: Sync darf nicht still Daten verlieren).
 * §4 DER ABGLEICH MELDET: der Server trägt geloescht=1, die Bytes sind aus
 *    dem Blob-Speicher verschwunden (dieselbe Schnittstelle wie R2), die
 *    Merkliste ist leer.
 * §5 GERÄT B VERLIERT die Datei beim nächsten Abgleich — die Löschung ist
 *    auf allen Geräten angekommen.
 * §6 DIE OBEN-WACHE: eine NIE hochgeladene Datei erzeugt beim Löschen
 *    keinen Grabstein — Upload-Abbrüche und Abgeleitetes bleiben stumm.
 * §7 DIE 404-REGEL: ein Grabstein für eine Kennung, die der Server nicht
 *    kennt, wird ausgetragen statt ewig wiederholt.
 *
 * Ports: 9020 (Prüfserver) und 9021 (App + Durchreiche).
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

const kern = await starte(9020);
const PORT = 9021;

const alles = http.createServer(async (req, res) => {
  const weg2 = req.url ?? '/';
  const u = new URL(weg2, 'http://x');
  const serverWeg = /^\/(konto|sync|datei|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname ?? '') || /^\/v1\//.test(u.pathname ?? '') || u.pathname === '/api/stand';
  if (serverWeg) {
    const stuecke: Buffer[] = [];
    for await (const st of req) stuecke.push(Buffer.from(st));
    const antwort = await fetch('http://localhost:9020' + weg2, {
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
  body: JSON.stringify({ name: 'Grabsteinprobe' }) });
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

console.log('\n1 · Gemeinsamer Bestand: A lädt hoch, B bekommt die Datei');
const BYTES = 3000;
const dateiId = await A.seite.evaluate(async (n: number) => {
  const roh = new Uint8Array(n);
  for (let i = 0; i < n; i++) roh[i] = (i * 13 + 5) % 256;
  const blob = new Blob([roh], { type: 'image/png' });
  const dId = 'g-' + Math.random().toString(36).slice(2, 10);
  const s = Store.addBlock(null, 'page', { text: 'Baustelle' });
  const bl = Store.addBlock(s.id, 'file', { text: 'plan.png', dateiId: dId });
  await Store.stueckPut({ id: dId + ':0', dateiId: dId, nr: 0, blob });
  await Store.dateiPut({ id: dId, name: 'plan.png', groesse: n, typ: 'image/png',
    blockId: bl.id, teile: 1, angekommen: 1, zustand: 'fertig',
    angelegt: new Date().toISOString(), fertigAm: new Date().toISOString() });
  await Store.flush();
  await Wolke.abgleichen();
  return dId;
}, BYTES) as string;

const beiB = await B2.seite.evaluate(async (id: string) => {
  await Wolke.abgleichen();
  return { satz: !!(await Store.dateiHolen(id)),
           stuecke: (await Store.stueckeVon(id)).length };
}, dateiId) as { satz: boolean; stuecke: number };
p('Gerät B hat Satz und Bytes', beiB.satz && beiB.stuecke === 1, JSON.stringify(beiB));
p('Der Server kennt die Datei ohne Grabstein', await (async () => {
  const meta = await kern.ablage.hole('dateien', { bereich: BEREICH, id: dateiId });
  return !!meta && !meta.geloescht;
})());

console.log('\n2 · A löscht über den echten Nutzerweg');
const nachWeg = await A.seite.evaluate(async (id: string) => {
  await Dateien.weg(id);
  await Store.flush();
  return { merkliste: Store.getMeta('wolkeDateienWeg', []),
           oben: Store.getMeta('wolkeDateienOben', []),
           satz: !!(await Store.dateiHolen(id)) };
}, dateiId) as { merkliste: string[]; oben: string[]; satz: boolean };
p('Der Grabstein liegt in der Merkliste', nachWeg.merkliste.includes(dateiId),
  JSON.stringify(nachWeg.merkliste));
p('Die Kennung hat das Oben-Set verlassen', !nachWeg.oben.includes(dateiId));
p('Lokal ist die Datei weg', !nachWeg.satz);

console.log('\n3 · Der Grabstein überlebt das Neuladen');
await A.seite.reload();
await A.seite.waitForFunction(() => typeof Store !== 'undefined' && typeof Wolke !== 'undefined' &&
  Object.keys(Store.cache?.meta || {}).length > 0, null, { timeout: 30000 });
await A.seite.waitForTimeout(800);
const nachReload = await A.seite.evaluate(async () => {
  await Wolke.tokenUebernehmen(String(Store.getMeta('wolkeToken', '')));
  await Wolke.schluesselSetzen('mein langer geheimer satz');
  Wolke.abgleichSetzen(true);
  return Store.getMeta('wolkeDateienWeg', []);
}) as string[];
p('Nach dem Neuladen steht der Grabstein noch', nachReload.includes(dateiId),
  JSON.stringify(nachReload));

console.log('\n4 · Der Abgleich meldet die Löschung');
const gemeldet = await A.seite.evaluate(async () => {
  const r = await Wolke.abgleichen();
  return { ergebnis: r, merkliste: Store.getMeta('wolkeDateienWeg', []),
           fehler: Wolke.zustand?.fehlerDateien || '' };
}) as any;
p('Die Maschine meldet eine weggemeldete Datei',
  gemeldet.ergebnis && gemeldet.ergebnis.dateienWeggemeldet === 1,
  JSON.stringify(gemeldet.ergebnis));
p('Die Merkliste ist danach leer', gemeldet.merkliste.length === 0);
const serverMeta = await kern.ablage.hole('dateien', { bereich: BEREICH, id: dateiId });
p('Der Server trägt den Grabstein: geloescht = 1',
  !!serverMeta && Number(serverMeta.geloescht) === 1, JSON.stringify(serverMeta || {}));
p('Die Bytes sind aus dem Blob-Speicher verschwunden — R2 hängt an derselben Schnittstelle',
  (await kern.blobs.hole(BEREICH + '/' + dateiId + '/0')) === null);

console.log('\n5 · Gerät B verliert die Datei beim nächsten Abgleich');
const bDanach = await B2.seite.evaluate(async (id: string) => {
  await Wolke.abgleichen();
  return { satz: !!(await Store.dateiHolen(id)),
           stuecke: (await Store.stueckeVon(id)).length,
           oben: (Store.getMeta('wolkeDateienOben', []) as string[]).includes(id) };
}, dateiId) as { satz: boolean; stuecke: number; oben: boolean };
p('Satz und Bytes sind auf B verschwunden', !bDanach.satz && bDanach.stuecke === 0,
  JSON.stringify(bDanach));
p('Auch Bs Oben-Set führt die Kennung nicht mehr', !bDanach.oben);

console.log('\n6 · Die Oben-Wache: nie Hochgeladenes bleibt stumm');
const wache = await A.seite.evaluate(async () => {
  const dId = 'nie-' + Math.random().toString(36).slice(2, 8);
  await Store.stueckPut({ id: dId + ':0', dateiId: dId, nr: 0,
    blob: new Blob([new Uint8Array(64)], { type: 'image/png' }) });
  await Store.dateiPut({ id: dId, name: 'entwurf.png', groesse: 64, typ: 'image/png',
    blockId: null, teile: 1, angekommen: 1, zustand: 'fertig',
    angelegt: new Date().toISOString(), fertigAm: new Date().toISOString() });
  await Dateien.weg(dId);
  return { merkliste: Store.getMeta('wolkeDateienWeg', []) as string[], dId };
}) as { merkliste: string[]; dId: string };
p('Eine nie hochgeladene Datei erzeugt keinen Grabstein',
  !wache.merkliste.includes(wache.dId), JSON.stringify(wache.merkliste));

console.log('\n7 · Die 404-Regel: Unbekanntes wird ausgetragen, nicht wiederholt');
const vierNullVier = await A.seite.evaluate(async () => {
  Store.setMeta('wolkeDateienWeg', ['gibtsnicht-404']);
  await Wolke.abgleichen();
  return { merkliste: Store.getMeta('wolkeDateienWeg', []) as string[],
           fehler: Wolke.zustand?.fehlerDateien || '' };
}) as { merkliste: string[]; fehler: string };
p('Der unbekannte Grabstein ist ausgetragen', vierNullVier.merkliste.length === 0,
  JSON.stringify(vierNullVier.merkliste));
p('… ohne Dateifehler im Zustand', vierNullVier.fehler === '', vierNullVier.fehler);

p('Keine Seitenfehler auf beiden Geräten', fehler.length === 0, fehler.join(' | '));

await browser.close();
alles.close();
await kern.stopp();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
