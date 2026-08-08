/* Suite 82 — Offline geändert: beim Wiederverbinden kommt alles an
 * ============================================================================
 * DIE LÜCKE, GEGEN DIE DIESER LAUF STEHT. `AUFGABEN.md` G3 sagt seit Wochen:
 * „‚Änderung offline' braucht einen Lauf gegen einen echten Server." test113
 * prüft die Zusammenführung gründlich — aber ohne Browser und ohne Server.
 * Hier läuft beides wirklich: der Prüfserver aus `server/kern.ts` und zwei
 * Chromium-Geräte, von denen eines die Verbindung verliert.
 *
 * WAS DABEI GEFUNDEN WURDE, bevor es diesen Lauf gab:
 *
 *   · Der `online`-Handler zeigte nur einen Toast. Wer offline schrieb und
 *     die Verbindung wiederfand, wartete bis zu zwei Minuten auf den Takt —
 *     oder für immer, wenn er den Tab vorher schloss. Jetzt stösst das
 *     Wiederverbinden sofort einen Abgleich an (pwa.ts).
 *
 *   · `/sync/runter` rechnete Marke und `mehr` aus dem DURCHGELASSENEN
 *     statt aus dem Gelesenen. Wer viele fremde Seiten vor sich hatte,
 *     bekam `marke = seit` und `mehr = false` — und die eigenen Sätze
 *     dahinter nie (server/kern.ts).
 *
 * Und der zweite G3-Punkt steht hier auch: Anhänge. Seit G2 (E33) gehen
 * die Bytes MIT — stückweise, verschlüsselt wie die Sätze. Abschnitt 3
 * verlangt beides: dieselbe dateiId auf beiden Geräten UND denselben
 * Inhalt, Byte für Byte, nach einer Reise durch AES-GCM und Base64.
 *
 * Ports: 8820 (Prüfserver) und 8821 (App + Durchreiche) — die Karte der
 * belegten Ports steht in test93.
 *
 *   node pruefungen/lauf/test118.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';

declare const Store: any; declare const Wolke: any; declare const Dateien: any;

const REPO = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* --------------------------------------------------------------------------
 * Prüfserver und App-Server — dasselbe Muster wie test78
 * ------------------------------------------------------------------------*/
const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json' };

const kern = await starte(8820);
const PORT = 8821;

const alles = http.createServer(async (req, res) => {
  const weg2 = req.url ?? '/';
  const u = new URL(weg2, 'http://x');
  const serverWeg = /^\/(konto|sync|datei|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname ?? '') || /^\/v1\//.test(u.pathname ?? '') || u.pathname === '/api/stand';
  if (serverWeg) {
    /* Rumpf als PUFFER und ohne die Kopfzeilen, die nur für diese eine
       Verbindung gelten. Als Zeichenkette gingen `content-length` (Bytes)
       und das wirklich Gesendete auseinander, sobald ein Umlaut im Spiel
       war — dieser Lauf starb daran etwa jedes dritte Mal. Siehe test120. */
    const stuecke: Buffer[] = [];
    for await (const st of req) stuecke.push(Buffer.from(st));
    const rumpf = Buffer.concat(stuecke);
    const HIER_BLEIBEN = new Set(['host', 'connection', 'keep-alive',
      'content-length', 'transfer-encoding', 'upgrade', 'proxy-connection']);
    const durch: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers))
      if (!HIER_BLEIBEN.has(k.toLowerCase()) && typeof v === 'string') durch[k] = v;
    const a = await fetch('http://localhost:8820' + weg2, {
      method: req.method ?? 'GET', headers: durch, redirect: 'manual',
      ...(rumpf.length ? { body: rumpf } : {}) });
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
await new Promise<void>(r => { alles.listen(PORT, () => r()); });
const WURZEL = 'http://localhost:' + PORT;

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
  body: JSON.stringify({ name: 'Offlineprobe' }) });
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
    /* Das ausdrückliche Ja zum Abgleich — seit E34 Pflicht (E1). */
    Wolke.abgleichSetzen(true);
  }, [t, BEREICH, name] as [string, string, string]);
  return { seite, ctx };
};

const A = await geraet('Rechner');
const B2 = await geraet('Telefon');

/* ==========================================================================
 * 1 · Ein gemeinsamer Ausgangsstand
 * ========================================================================*/
console.log('\n1 · Ein gemeinsamer Ausgangsstand');

const blockId = await A.seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Reise' });
  const bl = Store.addBlock(s.id, 'text', { text: 'Packliste beginnt hier.' });
  await Store.flush();
  await Wolke.abgleichen();
  return bl.id;
}) as string;

const beiB = await B2.seite.evaluate(async (id: string) => {
  await Wolke.abgleichen();
  const bl = Store.getBlock(id);
  return bl ? bl.text : null;
}, blockId) as string | null;
p('Gerät B sieht den Block von Gerät A', beiB === 'Packliste beginnt hier.', String(beiB));

/* ==========================================================================
 * 2 · Offline geändert — das Wiederverbinden allein muss reichen
 * ==========================================================================
 * Hier wird NIRGENDS von Hand abgeglichen, nachdem A wieder online ist.
 * Nur das `online`-Ereignis darf den Abgleich anstossen. Vor dem Fix in
 * pwa.ts blieb dieser Abschnitt rot: der Takt käme erst nach zwei Minuten,
 * und dieser Lauf wartet keine zwei Minuten. */
console.log('\n2 · Offline geändert — das Wiederverbinden allein muss reichen');

await A.ctx.setOffline(true);
await A.seite.waitForTimeout(300);
await A.seite.evaluate(async (id: string) => {
  Store.updateBlock(id, { text: 'Packliste, offline um Socken ergänzt.' });
  await Store.flush();
}, blockId);
p('Die Änderung ist offline im Gerät A gelandet',
  await A.seite.evaluate((id: string) => Store.getBlock(id)?.text, blockId)
    === 'Packliste, offline um Socken ergänzt.');

await A.ctx.setOffline(false);

/* B holt in kurzen Schlucken. Ankommen kann die Änderung nur, wenn A sie
   nach dem Wiederverbinden von selbst hochgeschoben hat. */
let angekommen: string | null = null;
for (let i = 0; i < 16 && angekommen !== 'Packliste, offline um Socken ergänzt.'; i++) {
  await B2.seite.waitForTimeout(500);
  angekommen = await B2.seite.evaluate(async (id: string) => {
    await Wolke.abgleichen();
    return Store.getBlock(id)?.text ?? null;
  }, blockId) as string | null;
}
p('Nach dem Wiederverbinden kommt die Offline-Änderung von selbst an',
  angekommen === 'Packliste, offline um Socken ergänzt.',
  `Gerät B sieht nach 8 s: „${angekommen}"`);

/* ==========================================================================
 * 3 · Anhänge: die Bytes kommen mit — verschlüsselt, stückweise, vollständig
 * ==========================================================================
 * Bis zum 6. August stand hier: „die Datei selbst geht nicht mit". G2 ist
 * gebaut (E33) — jetzt muss der Abgleich die Bytes wirklich hinübertragen:
 * gleiche dateiId auf beiden Geräten, Byte für Byte identischer Inhalt,
 * und das Ursprungsgerät bleibt unversehrt. */
console.log('\n3 · Anhänge: die Bytes kommen mit');

const BYTES = 5000;
const anhang = await A.seite.evaluate(async (n: number) => {
  const roh = new Uint8Array(n);
  for (let i = 0; i < n; i++) roh[i] = (i * 31 + 7) % 256;
  const blob = new Blob([roh], { type: 'image/png' });
  const dId = 'd-' + Math.random().toString(36).slice(2, 10);
  const seite = Object.values(Store.cache.blocks).find((x: any) => x.type === 'page' && x.alive) as any;
  const bl = Store.addBlock(seite.id, 'file', { text: 'huette.png', dateiId: dId });
  await Store.stueckPut({ id: dId + ':0', dateiId: dId, nr: 0, blob });
  await Store.dateiPut({ id: dId, name: 'huette.png', groesse: n, typ: 'image/png',
    blockId: bl.id, teile: 1, angekommen: 1, zustand: 'fertig',
    angelegt: new Date().toISOString(), fertigAm: new Date().toISOString() });
  await Store.flush();
  await Wolke.abgleichen();
  return { dateiId: dId, blockId: bl.id };
}, BYTES) as { dateiId: string; blockId: string };

const drueben = await B2.seite.evaluate(async (bid: string) => {
  await Wolke.abgleichen();
  const bl = Store.getBlock(bid);
  const datei = bl && bl.dateiId ? await Store.dateiHolen(bl.dateiId) : null;
  let laenge = -1, stimmt = false;
  if (datei) {
    const blob = await Dateien.alsBlob(datei.id);
    if (blob) {
      const roh = new Uint8Array(await blob.arrayBuffer());
      laenge = roh.length;
      stimmt = true;
      for (let i = 0; i < roh.length; i++)
        if (roh[i] !== (i * 31 + 7) % 256) { stimmt = false; break; }
    }
  }
  return { da: !!bl, dateiId: bl ? bl.dateiId : null, bytesDa: !!datei,
           blockVerknuepft: datei ? datei.blockId === bid : false, laenge, stimmt };
}, anhang.blockId) as { da: boolean; dateiId: string | null; bytesDa: boolean;
                        blockVerknuepft: boolean; laenge: number; stimmt: boolean };
p('Der Dateiblock kommt auf Gerät B an', drueben.da);
p('Er trägt dieselbe dateiId — die Verbindung hat den Abgleich überlebt',
  drueben.dateiId === anhang.dateiId, `drüben: ${drueben.dateiId}`);
p('Die Bytes kommen auf Gerät B an — G2 trägt sie hinüber', drueben.bytesDa,
  'kein Dateisatz auf Gerät B angekommen');
p('… vollständig', drueben.laenge === BYTES, `${drueben.laenge} von ${BYTES} Bytes`);
p('… und Byte für Byte identisch, trotz Verschlüsselung unterwegs', drueben.stimmt);
p('Die Datei kennt drüben ihren Block wieder', drueben.blockVerknuepft);

const daheim = await A.seite.evaluate(async (dId: string) => {
  await Wolke.abgleichen();
  const blob = await Dateien.alsBlob(dId);
  if (!blob) return { laenge: -1, stimmt: false };
  const roh = new Uint8Array(await blob.arrayBuffer());
  let stimmt = true;
  for (let i = 0; i < roh.length; i++)
    if (roh[i] !== (i * 31 + 7) % 256) { stimmt = false; break; }
  return { laenge: roh.length, stimmt };
}, anhang.dateiId) as { laenge: number; stimmt: boolean };
p('Auf Gerät A ist die Datei nach weiteren Runden vollständig da',
  daheim.laenge === BYTES, `${daheim.laenge} von ${BYTES} Bytes`);
p('… und Byte für Byte unverändert', daheim.stimmt);

/* ==========================================================================
 * 4 · Die Marke rückt am Unlesbaren vorbei
 * ==========================================================================
 * Anna darf eine einzige Seite lesen. Davor liegen sechs Sätze auf einer
 * fremden Seite. Vor dem Fix in server/kern.ts sagte die erste Antwort
 * `marke = seit` und `mehr = false` — Anna hätte ihren Satz nie bekommen. */
console.log('\n4 · Die Marke rückt am Unlesbaren vorbei');

const b2 = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + chefToken },
  body: JSON.stringify({ name: 'Mauerprobe' }) });
const MAUER = (await b2.json()).id;

await kern.ablage.setze('konten', { id: 'k2', mail: 'anna@x.ch', name: 'Anna',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
const annaToken = await machToken('k2');

const frei = await fetch(WURZEL + '/freigabe', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + chefToken },
  body: JSON.stringify({ bereich: MAUER, seite: 'p-offen', konto: 'anna@x.ch', rolle: 'lesen' }) });
p('Die Freigabe auf die eine Seite steht', frei.status === 200, 'Status ' + frei.status);

const saetze = [];
for (let i = 1; i <= 6; i++)
  saetze.push({ id: 'g' + i, tabelle: 'blocks', seite: 'p-geheim', version: 1,
    geaendert: `2026-08-06T10:00:0${i}.000Z`,
    daten: JSON.stringify({ id: 'g' + i, text: 'geheim ' + i }) });
saetze.push({ id: 'offen1', tabelle: 'blocks', seite: 'p-offen', version: 1,
  geaendert: '2026-08-06T10:00:09.000Z',
  daten: JSON.stringify({ id: 'offen1', text: 'Annas Satz' }) });
const hochAntwort = await fetch(WURZEL + '/sync/hoch', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + chefToken },
  body: JSON.stringify({ bereich: MAUER, saetze }) });
p('Der Besitzer hat die sieben Sätze abgelegt',
  (await hochAntwort.json()).angenommen === 7);

const runter = async (seit: string) => {
  const a = await fetch(WURZEL + '/sync/runter', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + annaToken },
    body: JSON.stringify({ bereich: MAUER, seit, grenze: 5 }) });
  return await a.json();
};

const erste = await runter('');
p('Die erste Antwort lässt nichts Unlesbares durch',
  Array.isArray(erste.saetze) && erste.saetze.every((s: any) => !String(s.id).startsWith('g')),
  JSON.stringify(erste.saetze?.map((s: any) => s.id)));
p('Aber die Marke rückt trotzdem vor', String(erste.marke || '') > '',
  `marke = „${erste.marke}" — bei leerer Marke bliebe Anna für immer stehen`);
p('Und `mehr` sagt ehrlich: da kommt noch etwas', erste.mehr === true);

let gefunden = false, runden = 0, marke = String(erste.marke || '');
let letzte = erste;
while (runden < 5 && (letzte.mehr || !gefunden)) {
  runden++;
  letzte = await runter(marke);
  marke = String(letzte.marke || marke);
  if ((letzte.saetze || []).some((s: any) => s.id === 'offen1')) { gefunden = true; break; }
  if (!letzte.mehr) break;
}
p('Annas Satz hinter der Mauer kommt an', gefunden,
  `nach ${runden + 1} Runden nicht gefunden — die Marke kommt am Unlesbaren nicht vorbei`);

/* ==========================================================================
 * Schluss
 * ========================================================================*/
p('Keine JS-Fehler auf den Geräten', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await A.ctx.close();
await B2.ctx.close();
await browser.close();
kern.stopp();
alles.close();

console.log(`\n  Suite 82 — Offline und Wiederverbinden: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
