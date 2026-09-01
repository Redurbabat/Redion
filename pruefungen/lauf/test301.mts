/* Suite 301 — Woher eine Zeile kommt (E307, Redurs Punkt 9)
 * ============================================================================
 * Redurs Punkt 9: „Trust-Layer — Herkunft und Verlässlichkeit einer Aussage."
 *
 * Nachgemessen, was Redion hatte: `erstelltVon` steht seit jeher an jedem
 * Block. Es hält aber den NAMEN eines Menschen (`Store.getMeta('nutzer')`)
 * und nicht die Art der Herkunft — was die KI schreibt, steht dort ebenfalls
 * als „Ich", weil sie unter dem angemeldeten Namen anlegt.
 *
 * Genau diese Unterscheidung fehlte, und sie ist beim Lernen die wichtigste:
 * eine Aussage, die ein Modell erzeugt hat, sah aus wie eine aus dem Skript.
 *
 *   §1 DAS FELD steht dort, wo Redion es weiss — und sonst nirgends.
 *   §2 DIE MARKE ist am Block, in Worten und nicht nur als Farbe (§38).
 *   §3 GEGENPROBE: selbst Geschriebenes bleibt unberührt.
 *   §4 SIE ÜBERLEBT die Sicherung, weil sie ein gewöhnliches Feld ist.
 *
 *   node pruefungen/lauf/test301.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9102;

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

const ids = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Herkunft', icon: '🧭' });
  const selbst = Store.addBlock(s.id, 'text', { text: 'Das habe ich selbst geschrieben.' });
  const vonKi  = Store.addBlock(s.id, 'text', {
    text: 'Das hat die KI geschrieben.', herkunft: 'ki' });
  const ausPdf = Store.addBlock(s.id, 'text', {
    text: 'Das steht im Skript.', herkunft: 'quelle' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
  return { seite: s.id, selbst: selbst.id, vonKi: vonKi.id, ausPdf: ausPdf.id };
});

/* ==========================================================================
 * §1 · Das Feld steht dort, wo Redion es weiss
 * --------------------------------------------------------------------------
 * Gemessen am Quelltext, weil es um die STELLEN geht, an denen es gesetzt
 * wird — nicht darum, ob ein Feld sich setzen lässt.
 * ========================================================================*/
console.log('\n1 · Das Feld steht dort, wo Redion es weiss');

const kiDienst = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/ki/dienst.js'), 'utf-8');
const kiAgenten = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/ki/agenten.js'), 'utf-8');
const pdfEin = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/pdf/einlesen.js'), 'utf-8');

const kiStellen = (kiDienst.match(/herkunft: 'ki'/g) || []).length +
                  (kiAgenten.match(/herkunft: 'ki'/g) || []).length;
p('Die KI schreibt ihre Herkunft an JEDEN Block, den sie anlegt',
  kiStellen >= 6, String(kiStellen) + ' Stellen');
p('Und die eingelesene PDF-Seite ihre auch',
  /herkunft: 'quelle'/.test(pdfEin));
/* GEGENPROBE: Redion setzt sie NICHT überall. Der Editor legt beim Tippen
   Blöcke an — dort darf nichts stehen, sonst wäre die Marke sinnlos. */
const editor = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/editor/ansicht/editor.js'), 'utf-8');
p('GEGENPROBE: der Editor setzt beim Tippen KEINE Herkunft',
  !/addBlock\([^)]*herkunft:/.test(editor));

/* ==========================================================================
 * §2 · Die Marke ist am Block, in Worten
 * ========================================================================*/
console.log('\n2 · Die Marke ist am Block, in Worten');

const marken = await pc.evaluate((x: any) => {
  const von = (id: string) => {
    const el = document.querySelector<HTMLElement>(`.blk[data-bid="${id}"]`);
    if (!el) return null;
    const vor = getComputedStyle(el, '::before');
    return { herkunft: el.dataset.herkunft ?? null, titel: el.title || '',
             streifenBreit: vor.width, streifenFarbe: vor.backgroundColor };
  };
  return { selbst: von(x.selbst), ki: von(x.vonKi), pdf: von(x.ausPdf) };
}, ids);

p('Der KI-Block trägt seine Herkunft', marken.ki?.herkunft === 'ki',
  String(marken.ki?.herkunft));
p('Und sagt sie in Worten, nicht nur als Farbe (§38)',
  /Von der KI geschrieben/.test(marken.ki?.titel || ''), marken.ki?.titel);
p('Der Block aus dem Skript ebenso',
  marken.pdf?.herkunft === 'quelle' &&
  /eingelesenen Dokument/.test(marken.pdf?.titel || ''),
  `${marken.pdf?.herkunft} / ${marken.pdf?.titel}`);
p('Beide bekommen einen Streifen',
  marken.ki?.streifenBreit === '3px' && marken.pdf?.streifenBreit === '3px',
  `${marken.ki?.streifenBreit} / ${marken.pdf?.streifenBreit}`);
p('Und zwar in verschiedenen Farben',
  !!marken.ki?.streifenFarbe && marken.ki?.streifenFarbe !== marken.pdf?.streifenFarbe,
  `${marken.ki?.streifenFarbe} vs ${marken.pdf?.streifenFarbe}`);

/* ==========================================================================
 * §3 · GEGENPROBE: selbst Geschriebenes bleibt unberührt
 * --------------------------------------------------------------------------
 * DAS IST DER WICHTIGSTE ARM. Eine Marke an jeder Zeile wäre nach zwei
 * Minuten unsichtbar — dann hätte man den Platz ausgegeben und nichts dafür
 * bekommen. Sichtbar ist nur, was NICHT von einem selbst stammt.
 * ========================================================================*/
console.log('\n3 · Gegenprobe: selbst Geschriebenes bleibt unberührt');

p('Der selbst geschriebene Block hat kein Herkunftsfeld',
  marken.selbst?.herkunft === null, String(marken.selbst?.herkunft));
p('Und keinen Titel', (marken.selbst?.titel || '') === '', marken.selbst?.titel);
p('Und keinen Streifen',
  marken.selbst?.streifenBreit !== '3px', marken.selbst?.streifenBreit);

/* Und im Blockmenü steht die Zeile nur dort, wo es etwas zu sagen gibt. */
const menue = await pc.evaluate(async (x: any) => {
  const auf = async (id: string) => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const g = document.querySelector<HTMLElement>(
      `.blk[data-bid="${id}"] .handles button[data-act="menu"]`);
    g?.click();
    await new Promise(r => setTimeout(r, 300));
    const z = document.querySelector('.menu .menu-herkunft');
    const t = (z?.textContent || '');
    document.querySelectorAll('.menu').forEach(m => m.remove());
    return t;
  };
  return { ki: await auf(x.vonKi), selbst: await auf(x.selbst) };
}, ids);
p('Das Blockmenü nennt die Herkunft beim KI-Block',
  /Von der KI geschrieben/.test(menue.ki), menue.ki);
p('Und schweigt beim eigenen', menue.selbst === '', JSON.stringify(menue.selbst));

/* ==========================================================================
 * §4 · Sie überlebt die Sicherung
 * --------------------------------------------------------------------------
 * `herkunft` ist ein gewöhnliches Blockfeld und reist deshalb mit — das ist
 * der Grund, warum es eines geworden ist und keine zweite Tabelle. Geprüft
 * wird es trotzdem: „reist automatisch mit" ist eine Behauptung.
 * ========================================================================*/
console.log('\n4 · Sie überlebt die Sicherung');

const rundlauf = await pc.evaluate(async (x: any) => {
  const text = await Store.exportAll();
  const daten = JSON.parse(text);
  /* `blocks` in der Sicherung ist ein OBJEKT nach Kennung, keine Liste —
     nachgesehen in `indexdb.ts` (`blocks: cache.blocks`). Der erste Entwurf
     dieses Abschnitts rief `.filter` darauf und flog auf die Nase. */
  const alle = Object.values<any>(daten.blocks || {});
  const drin = alle.filter((b: any) => b.herkunft).length;
  /* Und wieder herein — dieselbe Ablage, aber der Weg durch JSON ist der,
     der Felder verliert. */
  const roh = JSON.stringify(daten);
  const zurueck = Object.values<any>(JSON.parse(roh).blocks)
    .find((b: any) => b.id === x.vonKi);
  return { drin, herkunftZurueck: zurueck?.herkunft ?? null,
           gesamt: alle.length };
}, ids);
p('Die Sicherung enthält die Herkunft', rundlauf.drin >= 2, String(rundlauf.drin));
p('Und nach dem Rundlauf steht sie noch da',
  rundlauf.herkunftZurueck === 'ki', String(rundlauf.herkunftZurueck));
p('Nicht an allen Blöcken — nur an denen, die eine haben',
  rundlauf.drin < rundlauf.gesamt, `${rundlauf.drin} von ${rundlauf.gesamt}`);

/* ========================================================================== */
console.log('\n5 · Keine Fehler auf dem Weg');
p('Keine unbehandelten Ausnahmen', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} — Suite 301 (E307: Woher eine Zeile kommt)`);
process.exit(weg ? 1 : 0);
