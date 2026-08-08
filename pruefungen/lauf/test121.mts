/* Suite 85 — Rechte und Freigaben: was raus darf, und was drin bleibt
 * ============================================================================
 * L8. Drei Fragen, und jede hat einen Fehler zutage gefördert:
 *
 *   1. WAS GEHT MIT, WENN MAN EINE SEITE VERÖFFENTLICHT? Bis heute: alles.
 *      `seiteAlsHtml` stellte eine Unterseite mit ihrem Titel dar — „📄
 *      Gehälter" — und hängte danach ihren GANZEN Inhalt an, rekursiv über
 *      alle Ebenen. Wer „Projekt X" veröffentlichte, veröffentlichte jede
 *      Unterseite darunter, ohne dass irgendwo etwas davon stand. Der
 *      Mensch sah den Titel und glaubte, das sei der Verweis.
 *
 *   2. DARF KOMMENTIEREN, WER KOMMENTIEREN DARF? Bis heute: nein. Die
 *      Rolle `komm` verspricht es, `ROLLEN` führt das Recht — geprüft hat
 *      es nie jemand. Ein Kommentar ist das Feld `kommentare` am Block,
 *      geht also als Blockänderung durch `/sync/hoch`, und dort stand nur
 *      die Frage nach `bearbeiten`. Der Kommentar blieb auf dem Gerät des
 *      Kommentators stehen. Ohne Meldung.
 *
 *   3. WIRKT DER WIDERRUF? Das ist die Frage, die man nicht stellt, weil
 *      man die Antwort zu kennen glaubt. Sie steht hier, damit sie
 *      beantwortet bleibt: zurückgezogene Seite → 404, entzogene Freigabe
 *      → nichts mehr im Abgleich, gelöschte Marke → 401.
 *
 * Anhänge gehören auch hierher: eine veröffentlichte Seite macht KEINEN
 * Anhang öffentlich. `/datei/runter` bleibt hinter dem Token.
 *
 * Ports: 8832 (Prüfserver) und 8833 (App + Durchreiche) — Karte in test93.
 *
 *   node pruefungen/lauf/test121.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';

declare const Store: any; declare const Wolke: any; declare const Werkzeuge: any;

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

const kern = await starte(8832);
const PORT = 8833;
const alles = http.createServer(async (req, res) => {
  const weg2 = req.url ?? '/';
  const u = new URL(weg2, 'http://x');
  const serverWeg = /^\/(konto|sync|datei|freigabe|feldrecht|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
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
    const a = await fetch('http://localhost:8832' + weg2, {
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

const machKonto = async (id: string, mail: string) => {
  await kern.ablage.setze('konten', { id, mail, name: id, bild: '',
    herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: id,
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const ruf = async (token: string, pfad: string, koerper: unknown, m = 'POST') => {
  const a = await fetch(WURZEL + pfad, { method: m,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    ...(koerper ? { body: JSON.stringify(koerper) } : {}) });
  const text = await a.text();
  let j: any = null; try { j = JSON.parse(text); } catch { /* Text bleibt */ }
  return { status: a.status, j, text };
};

const CHEF = await machKonto('k1', 'chef@x.ch');
const ANNA = await machKonto('k2', 'anna@x.ch');
const BEREICH = (await ruf(CHEF, '/bereich', { name: 'Rechteprobe' })).j.id;

/* ==========================================================================
 * 1 · Veröffentlichen nimmt keine Unterseite mit
 * ========================================================================*/
console.log('\n1 · Veröffentlichen nimmt keine Unterseite mit');

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1200, height: 850 } });
const jsFehler: string[] = [];
seite.on('pageerror', (e: Error) => jsFehler.push(e.message));
await seite.goto(WURZEL + '/index.html');
await seite.waitForTimeout(1800);

const html = await seite.evaluate(async () => {
  const oben = Store.addBlock(null, 'page', { text: 'Projekt X' });
  Store.addBlock(oben.id, 'text', { text: 'Das steht auf der öffentlichen Seite.' });
  const unter = Store.addBlock(oben.id, 'page', { text: 'Gehälter' });
  Store.addBlock(unter.id, 'text', { text: 'GEHEIMZAHL-8815 steht in der Unterseite.' });
  const tiefer = Store.addBlock(unter.id, 'page', { text: 'Noch tiefer' });
  Store.addBlock(tiefer.id, 'text', { text: 'NOCHTIEFER-4711' });
  /* Ein Aufklapper daneben — seine Kinder gehören zur Seite und MÜSSEN mit. */
  const klapp = Store.addBlock(oben.id, 'toggle', { text: 'Mehr dazu' });
  Store.addBlock(klapp.id, 'text', { text: 'Im Aufklapper, gehört dazu.' });
  await Store.flush();
  return Werkzeuge.seiteAlsHtml(Store.getBlock(oben.id));
}) as string;

p('Der eigene Inhalt der Seite ist drin', html.includes('Das steht auf der öffentlichen Seite.'));
p('Der Titel der Unterseite steht als Verweis da', html.includes('Gehälter'));
p('Der INHALT der Unterseite ist NICHT drin', !html.includes('GEHEIMZAHL-8815'),
  'wer eine Seite veröffentlicht, veröffentlicht damit jede Unterseite darunter');
p('Auch nicht der Inhalt der Unterunterseite', !html.includes('NOCHTIEFER-4711'));
p('Der Aufklapper geht weiterhin mit — er gehört zur Seite',
  html.includes('Im Aufklapper, gehört dazu.'),
  'die Gegenprobe: der Fix darf nicht zu viel abschneiden');

/* ==========================================================================
 * 2 · Wer kommentieren darf, darf das auch wirklich
 * ========================================================================*/
console.log('\n2 · Wer kommentieren darf, darf das auch wirklich');

await ruf(CHEF, '/freigabe', { bereich: BEREICH, seite: 'p-team',
  konto: 'anna@x.ch', rolle: 'komm' });
const grundsatz = { id: 'b1', text: 'Der Vorschlag', kommentare: [] as any[],
                    parentId: 'p-team', type: 'text', edited: '2026-08-06T10:00:00.000Z' };
await ruf(CHEF, '/sync/hoch', { bereich: BEREICH, saetze: [{ id: 'b1', tabelle: 'blocks',
  seite: 'p-team', version: 1, geaendert: '2026-08-06T10:00:00.000Z',
  daten: JSON.stringify(grundsatz) }] });

const mitKommentar = { ...grundsatz, kommentare: [{ von: 'Anna', text: 'Guter Punkt.' }],
                       edited: '2026-08-06T11:00:00.000Z' };
const annaSchreibt = await ruf(ANNA, '/sync/hoch', { bereich: BEREICH, saetze: [
  { id: 'b1', tabelle: 'blocks', seite: 'p-team', version: 2,
    geaendert: '2026-08-06T11:00:00.000Z', daten: JSON.stringify(mitKommentar) }] });
p('Annas Kommentar wird angenommen', annaSchreibt.j?.angenommen === 1,
  JSON.stringify(annaSchreibt.j?.abgelehnt));

const gespeichert = await kern.ablage.hole('saetze', { bereich: BEREICH, id: 'b1' });
const satzJetzt = JSON.parse(String(gespeichert?.daten || '{}'));
p('Der Kommentar steht wirklich am Block',
  satzJetzt.kommentare?.[0]?.text === 'Guter Punkt.', JSON.stringify(satzJetzt.kommentare));

/* Gegenprobe A: nur den Text ändern, ohne Kommentar — das ist kein
   Kommentieren, und der Server sagt es auch so. */
const nurText = await ruf(ANNA, '/sync/hoch', { bereich: BEREICH, saetze: [
  { id: 'b1', tabelle: 'blocks', seite: 'p-team', version: 3,
    geaendert: '2026-08-06T12:00:00.000Z',
    daten: JSON.stringify({ ...mitKommentar, text: 'Der Vorschlag ist Unsinn',
      edited: '2026-08-06T12:00:00.000Z' }) }] });
p('Eine reine Textänderung wird abgelehnt', nurText.j?.angenommen === 0 &&
  /Kommentar/.test(JSON.stringify(nurText.j?.abgelehnt)),
  JSON.stringify(nurText.j?.abgelehnt));

/* Gegenprobe B, die wichtigere: Kommentar UND Textänderung in einem Satz.
   Der Kommentar geht durch, der fremde Text kommt zurück — dasselbe
   Muster wie bei den Spaltenrechten, statt alles abzulehnen. */
const beides = await ruf(ANNA, '/sync/hoch', { bereich: BEREICH, saetze: [
  { id: 'b1', tabelle: 'blocks', seite: 'p-team', version: 3,
    geaendert: '2026-08-06T12:30:00.000Z',
    daten: JSON.stringify({ ...mitKommentar, text: 'Der Vorschlag ist Unsinn',
      kommentare: [{ von: 'Anna', text: 'Guter Punkt.' }, { von: 'Anna', text: 'Und noch etwas.' }],
      edited: '2026-08-06T12:30:00.000Z' }) }] });
const nachher = JSON.parse(String((await kern.ablage.hole('saetze',
  { bereich: BEREICH, id: 'b1' }))?.daten || '{}'));
p('Kommentar und Textänderung zusammen: der Kommentar kommt an',
  nachher.kommentare?.length === 2, JSON.stringify(nachher.kommentare));
p('… aber der Text der anderen bleibt stehen', nachher.text === 'Der Vorschlag',
  `steht jetzt: „${nachher.text}" — die Kommentarrolle darf zu viel`);
p('… und der Server sagt, dass er beschnitten hat',
  (beides.j?.angepasst || []).length === 1, JSON.stringify(beides.j?.angepasst));

/* Ohne jedes Recht bleibt es beim Nein. */
const FREMD = await machKonto('k3', 'fremd@x.ch');
await kern.ablage.setze('freigaben', { bereich: BEREICH, seite: '*', kontoId: 'k3',
  rolle: 'lesen', von: 'k1', wann: new Date().toISOString() });
const fremdSchreibt = await ruf(FREMD, '/sync/hoch', { bereich: BEREICH, saetze: [
  { id: 'b1', tabelle: 'blocks', seite: 'p-team', version: 4,
    geaendert: '2026-08-06T13:00:00.000Z', daten: JSON.stringify(mitKommentar) }] });
p('Wer nur lesen darf, kommentiert auch nicht',
  fremdSchreibt.j?.angenommen === 0 &&
  /Schreibrecht/.test(JSON.stringify(fremdSchreibt.j?.abgelehnt)),
  JSON.stringify(fremdSchreibt.j));

/* ==========================================================================
 * 3 · Der Widerruf wirkt — Seite, Freigabe, Marke
 * ========================================================================*/
console.log('\n3 · Der Widerruf wirkt');

const veroeff = await ruf(CHEF, '/veroeffentlichen', { bereich: BEREICH, seite: 'p-team',
  titel: 'Öffentlich', inhalt: '<p>Für alle</p>' });
const SCHLUESSEL = veroeff.j?.schluessel || String(veroeff.j?.adresse || '').split('/s/')[1] || '';
p('Die Seite ist veröffentlicht und ohne Token abrufbar',
  (await fetch(WURZEL + '/s/' + SCHLUESSEL)).status === 200, 'Schlüssel: ' + SCHLUESSEL);

await ruf(CHEF, '/veroeffentlichen', { bereich: BEREICH, seite: 'p-team' }, 'DELETE');
const nachRueckzug = await fetch(WURZEL + '/s/' + SCHLUESSEL);
p('Nach dem Zurückziehen ist sie weg', nachRueckzug.status === 404,
  'Status ' + nachRueckzug.status);
p('… und der Inhalt steht auch nicht mehr im Text',
  !(await nachRueckzug.text()).includes('Für alle'));

const vorEntzug = await ruf(ANNA, '/sync/runter', { bereich: BEREICH, seit: '' });
p('Anna sieht den geteilten Block, solange die Freigabe steht',
  (vorEntzug.j?.saetze || []).some((s: any) => s.id === 'b1'));

await ruf(CHEF, '/freigabe', { bereich: BEREICH, seite: 'p-team',
  konto: 'anna@x.ch', entfernen: true }, 'POST');
const nachEntzug = await ruf(ANNA, '/sync/runter', { bereich: BEREICH, seit: '' });
p('Nach dem Entzug bekommt sie den Block nicht mehr',
  !(nachEntzug.j?.saetze || []).some((s: any) => s.id === 'b1'),
  'Widerruf wirkt nicht: ' + JSON.stringify(nachEntzug.j?.saetze?.map((s: any) => s.id)));

const marke = await ruf(CHEF, '/marken', { name: 'Probe', bereich: BEREICH,
  rechte: 'lesen', tage: 1 });
const MARKE = marke.j?.token || '';

/* EINE MARKE MIT „LESEN" MUSS LESEN KÖNNEN. Sie konnte es nicht: beide
   Abgleichswege sind POST — der Filter gehört in den Körper —, und das
   Marken-Tor las aus der Methode „schreibt". Die Antwort auf /sync/runter
   lautete „Diese Marke darf nicht schreiben". Wer lesen wollte, musste
   `schreiben` vergeben, also genau das Recht, den ganzen Bestand zu
   ersetzen — gegen das dieses Tor gebaut wurde. Jetzt fragt die Route
   selbst, mit derselben `darfMarke`. */
const markeLiest = await ruf(MARKE, '/sync/runter', { bereich: BEREICH, seit: '' });
p('Eine Marke mit „lesen" darf lesen', markeLiest.status === 200,
  `Status ${markeLiest.status}: ${markeLiest.text.slice(0, 90)}`);
p('… und trotzdem nicht schreiben',
  (await ruf(MARKE, '/sync/hoch', { bereich: BEREICH, saetze: [] })).status === 403);
p('Dasselbe bei den Anhängen: lesen ja, hochladen nein',
  (await ruf(MARKE, '/datei/stand', { bereich: BEREICH, seit: '' })).status === 200 &&
  (await ruf(MARKE, '/datei/melden', { bereich: BEREICH,
    datei: { id: 'x', groesse: 1, seite: 'p-team', teile: 1 } })).status === 403);
const kennungKurz = (marke.j?.kennung) ||
  (await ruf(CHEF, '/marken', null, 'GET')).j?.marken?.[0]?.kennung || '';
await ruf(CHEF, '/marken/' + kennungKurz, null, 'DELETE');
p('Nach dem Löschen ist sie tot',
  (await ruf(MARKE, '/sync/runter', { bereich: BEREICH, seit: '' })).status === 401);

/* ==========================================================================
 * 4 · Eine veröffentlichte Seite macht keinen Anhang öffentlich
 * ========================================================================*/
console.log('\n4 · Eine veröffentlichte Seite macht keinen Anhang öffentlich');

await ruf(CHEF, '/datei/melden', { bereich: BEREICH, datei: { id: 'geheim1',
  name: 'vertrag.pdf', groesse: 3, typ: 'application/pdf', seite: 'p-team', teile: 1 } });
await ruf(CHEF, '/datei/stueck', { bereich: BEREICH, dateiId: 'geheim1', nr: 0,
  base64: 'AQID' });
await ruf(CHEF, '/veroeffentlichen', { bereich: BEREICH, seite: 'p-team',
  titel: 'Wieder offen', inhalt: '<p>Text</p>' });

const ohneToken = await fetch(WURZEL + '/datei/runter', { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bereich: BEREICH, dateiId: 'geheim1', nr: 0 }) });
p('Ohne Token gibt es den Anhang nicht — auch nicht bei offener Seite',
  ohneToken.status === 401, 'Status ' + ohneToken.status);
p('Und Anna, deren Freigabe entzogen wurde, bekommt ihn auch nicht',
  (await ruf(ANNA, '/datei/runter', { bereich: BEREICH, dateiId: 'geheim1', nr: 0 })).status === 403);

p('Keine JS-Fehler im Gerät', jsFehler.length === 0, jsFehler.slice(0, 2).join(' · '));

await browser.close();
kern.stopp();
alles.close();
console.log(`\n  Suite 85 — Rechte und Freigaben: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
