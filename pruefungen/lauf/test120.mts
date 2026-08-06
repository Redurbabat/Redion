/* Suite 84 — Der Konto-Modus: anmelden lädt nichts hoch, löschen löscht alles
 * ============================================================================
 * G1 aus AUFGABEN.md, und in seiner Mitte die Regel E1: lokale Daten werden
 * NIE ohne ausdrückliche Zustimmung hochgeladen. Bis heute stimmte das
 * nicht — wer sich anmeldete und neu lud, dessen gesamter Bestand ging beim
 * ersten Takt zum Server, ohne dass je jemand Ja gesagt hätte.
 *
 * DREI ABSCHNITTE:
 *
 *   1. E1 im Browser: angemeldet, aber ohne das Ja (`wolkeAbgleich`) —
 *      `abgleichen()` tut NICHTS, der Server bleibt leer. Erst der Schalter
 *      lässt die Sätze los. Bestandsgeräte (Marken vorhanden) bleiben
 *      freigeschaltet — kein stiller Sync-Stopp.
 *   2. Konto löschen am Server: die volle Kaskade — Bereiche, Sätze,
 *      Dateien samt Stücken im Blob-Speicher, Freigaben, Marken,
 *      Sitzungen, Konto. Eine Marke darf das nicht; ein fremdes Konto
 *      bleibt unberührt.
 *   3. Konto löschen im Browser: danach abgemeldet — und die Notizen auf
 *      dem Gerät sind NOCH DA. Priorität 1 gilt auch beim Aufhören.
 *
 * Ports: 8826 (Prüfserver) und 8827 (App + Durchreiche) — Karte in test93.
 *
 *   node pruefungen/lauf/test120.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';

declare const Store: any; declare const Wolke: any;

const REPO = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json' };

const kern = await starte(8826);
const PORT = 8827;
const alles = http.createServer(async (req, res) => {
  const weg2 = req.url ?? '/';
  const u = new URL(weg2, 'http://x');
  const serverWeg = /^\/(konto|sync|datei|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname ?? '') || /^\/v1\//.test(u.pathname ?? '') || u.pathname === '/api/stand';
  if (serverWeg) {
    let roh = '';
    for await (const st of req) roh += st;
    const durch: Record<string, any> = req.headers;
    const a = await fetch('http://localhost:8826' + weg2, {
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
await new Promise<void>(r => { alles.listen(PORT, () => r()); });
const WURZEL = 'http://localhost:' + PORT;

const kontoAnlegen = async (id: string, mail: string) => {
  await kern.ablage.setze('konten', { id, mail, name: id, bild: '',
    herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
};
const machToken = async (konto: string): Promise<string> => {
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: konto,
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
await kontoAnlegen('k1', 'red@x.ch');
const T1 = await machToken('k1');
const b = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T1 },
  body: JSON.stringify({ name: 'Kontoprobe' }) });
const BEREICH = (await b.json()).id;

/* ==========================================================================
 * 1 · E1 im Browser: ohne das Ja verlässt nichts das Gerät
 * ========================================================================*/
console.log('\n1 · Ohne das Ja verlässt nichts das Gerät');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 850 } });
const seite = await ctx.newPage();
const fehler: string[] = [];
seite.on('pageerror', (e: Error) => fehler.push(e.message));
await seite.goto(WURZEL + '/index.html');
await seite.waitForTimeout(1800);

await seite.evaluate(async ([tok, ber]: [string, string]) => {
  Store.addBlock(null, 'page', { text: 'Privates Tagebuch' });
  await Store.flush();
  Store.setMeta('wolkeToken', tok);
  Store.setMeta('wolkeBereich', ber);
  await Wolke.tokenUebernehmen(tok);
}, [T1, BEREICH] as [string, string]);

p('Angemeldet, aber der Schalter steht auf Aus',
  await seite.evaluate(() => Wolke.angemeldet() && !Wolke.abgleichErlaubt()));

const versuch = await seite.evaluate(async () => await Wolke.abgleichen());
p('abgleichen() tut ohne das Ja nichts', versuch === null, JSON.stringify(versuch));
p('Der Server hat keinen einzigen Satz bekommen',
  (await kern.ablage.zaehle('saetze', { bereich: BEREICH })) === 0,
  'E1 verletzt: Daten gingen ohne Zustimmung hoch');

/* Das Ja — und erst jetzt gehen die Sätze. */
await seite.evaluate(async () => { Wolke.abgleichSetzen(true); await Wolke.abgleichen(); });
p('Nach dem Ja sind die Sätze da',
  (await kern.ablage.zaehle('saetze', { bereich: BEREICH })) > 0);

/* Bestandsgeräte: Marken vorhanden, Schalter nie gesetzt → weiter erlaubt. */
const bestand = await seite.evaluate(() => {
  Store.setMeta('wolkeAbgleich', null);
  Store.setMeta('wolkeMarkeHoch', '2026-01-01T00:00:00.000Z');
  return Wolke.abgleichErlaubt();
});
p('Ein Bestandsgerät mit Marken bleibt freigeschaltet', bestand === true,
  'stiller Sync-Stopp für Geräte, die längst abgleichen');
await seite.evaluate(() => { Wolke.abgleichSetzen(true); });

/* ==========================================================================
 * 2 · Konto löschen am Server: die volle Kaskade
 * ========================================================================*/
console.log('\n2 · Konto löschen am Server: die volle Kaskade');

/* Anna hat ein eigenes Konto samt Bereich — sie muss unberührt bleiben. */
await kontoAnlegen('k2', 'anna@x.ch');
const T2 = await machToken('k2');
const b2 = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T2 },
  body: JSON.stringify({ name: 'Annas Bereich' }) });
const ANNAS = (await b2.json()).id;
await fetch(WURZEL + '/sync/hoch', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T2 },
  body: JSON.stringify({ bereich: ANNAS, saetze: [{ id: 'a1', tabelle: 'blocks',
    daten: '{}', version: 1, geaendert: new Date().toISOString(), seite: 'a1' }] }) });

/* k1 bekommt eine Datei mit Stück, eine Freigabe an Anna und eine Marke. */
await fetch(WURZEL + '/datei/melden', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T1 },
  body: JSON.stringify({ bereich: BEREICH, datei: { id: 'f1', name: 'bild.png',
    groesse: 3, typ: 'image/png', seite: 'p1', teile: 1 } }) });
await fetch(WURZEL + '/datei/stueck', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T1 },
  body: JSON.stringify({ bereich: BEREICH, dateiId: 'f1', nr: 0, base64: 'AQID' }) });
await fetch(WURZEL + '/freigabe', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T1 },
  body: JSON.stringify({ bereich: BEREICH, seite: 'p1', konto: 'anna@x.ch', rolle: 'lesen' }) });
const mk = await fetch(WURZEL + '/marken', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T1 },
  body: JSON.stringify({ name: 'Probe', bereich: BEREICH, rechte: 'lesen', tage: 1 }) });
const MARKE = (await mk.json()).token || '';
p('Der Haushalt steht: Sätze, Datei, Stück, Freigabe, Marke',
  (await kern.ablage.zaehle('saetze', { bereich: BEREICH })) > 0 &&
  (await kern.ablage.zaehle('dateien', { bereich: BEREICH })) === 1 &&
  !!(await kern.blobs.hole(`${BEREICH}/f1/0`)) &&
  (await kern.ablage.zaehle('freigaben', { bereich: BEREICH })) === 1 &&
  (await kern.ablage.zaehle('marken', {})) >= 1);

/* Eine Marke darf das Konto nicht löschen — auch keine mit allen Rechten. */
const mitMarke = await fetch(WURZEL + '/konto/loeschen', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + MARKE } });
p('Eine Marke darf das Konto nicht löschen', mitMarke.status === 403,
  'Status ' + mitMarke.status);

const geloescht = await fetch(WURZEL + '/konto/loeschen', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T1 } });
p('Mit Sitzung geht es', geloescht.status === 200, 'Status ' + geloescht.status);

p('Die Sätze des Bereichs sind weg',
  (await kern.ablage.zaehle('saetze', { bereich: BEREICH })) === 0);
p('Die Datei-Metadaten sind weg',
  (await kern.ablage.zaehle('dateien', { bereich: BEREICH })) === 0);
p('Das Stück im Blob-Speicher ist weg',
  (await kern.blobs.hole(`${BEREICH}/f1/0`)) === null);
p('Die Freigaben sind weg',
  (await kern.ablage.zaehle('freigaben', { bereich: BEREICH })) === 0);
p('Der Bereich selbst ist weg',
  (await kern.ablage.hole('bereiche', { id: BEREICH })) === null);
p('Das Konto ist weg', (await kern.ablage.hole('konten', { id: 'k1' })) === null);
p('Der alte Token ist tot',
  (await fetch(WURZEL + '/konto/ich',
    { headers: { Authorization: 'Bearer ' + T1 } })).status === 401);
p('Annas Konto ist unberührt',
  !!(await kern.ablage.hole('konten', { id: 'k2' })) &&
  !!(await kern.ablage.hole('bereiche', { id: ANNAS })) &&
  (await kern.ablage.zaehle('saetze', { bereich: ANNAS })) === 1);

/* ==========================================================================
 * 3 · Konto löschen im Browser: die Notizen auf dem Gerät bleiben
 * ========================================================================*/
console.log('\n3 · Nach dem Löschen: abgemeldet, aber die Notizen sind noch da');

await kontoAnlegen('k3', 'dritte@x.ch');
const T3 = await machToken('k3');
const b3 = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T3 },
  body: JSON.stringify({ name: 'Drittprobe' }) });
const DRITTER = (await b3.json()).id;

const danach = await seite.evaluate(async ([tok, ber]: [string, string]) => {
  Store.setMeta('wolkeToken', tok);
  Store.setMeta('wolkeBereich', ber);
  await Wolke.tokenUebernehmen(tok);
  Wolke.abgleichSetzen(true);
  await Wolke.abgleichen();
  const vorher = Object.values(Store.cache.blocks).filter((x: any) => x.alive).length;
  await Wolke.kontoLoeschen();
  return {
    vorher,
    nachher: Object.values(Store.cache.blocks).filter((x: any) => x.alive).length,
    abgemeldet: !Wolke.angemeldet(),
    schalter: Store.getMeta('wolkeAbgleich', null)
  };
}, [T3, DRITTER] as [string, string]) as
  { vorher: number; nachher: number; abgemeldet: boolean; schalter: unknown };
p('Danach ist das Gerät abgemeldet', danach.abgemeldet);
p('Die Notizen auf dem Gerät sind NOCH DA', danach.nachher === danach.vorher,
  `${danach.nachher} von ${danach.vorher} Blöcken`);
p('Der Schalter ist zurückgesetzt — das nächste Konto wird neu gefragt',
  danach.schalter === null);
p('Das dritte Konto ist auf dem Server weg',
  (await kern.ablage.hole('konten', { id: 'k3' })) === null);

p('Keine JS-Fehler im Gerät', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await ctx.close();
await browser.close();
kern.stopp();
alles.close();
console.log(`\n  Suite 84 — Konto-Modus: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
