/* Suite 253 — Rückverweise und unverlinkte Erwähnungen (Obsidian-Leser)
 * ============================================================================
 * Der Obsidian-Leser der Visionskarte fand: die Fusszeile unter jeder
 * Seite (verweiseAuf/unverlinkt in verweise.ts) hängt seit langem im
 * Editor — aber kein Prüflauf ruft sie auf. Geprüft war nur der Resolver
 * darunter (test202) und der Vault-Rundlauf (test219).
 *
 * §1 RÜCKVERWEISE: wer [[Ohmsches Gesetz]] schreibt, steht unter dem
 *    Ohmschen Gesetz — mit Fundstelle.
 * §2 UNVERLINKTE ERWÄHNUNGEN: wer den Titel nur erwähnt, steht im zweiten
 *    Abschnitt — und wer schon verlinkt, steht NICHT noch einmal dort.
 * §3 DER KLICKWEG: ein Tipp auf den Eintrag öffnet die Quellseite.
 * §4 DER LEERFALL: eine Seite ohne Verweise bekommt keine Fusszeile —
 *    kein leerer Kasten unter jeder Notiz.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 9014;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'
};
const server = createServer((q, a) => {
  let pfad = join(WURZEL, decodeURIComponent((q.url || '/').split('?')[0]!));
  if (existsSync(pfad) && statSync(pfad).isDirectory()) pfad = join(pfad, 'index.html');
  if (!existsSync(pfad) || !pfad.startsWith(WURZEL)) { a.statusCode = 404; a.end('weg'); return; }
  a.setHeader('Content-Type', TYP[extname(pfad)] || 'application/octet-stream');
  a.end(readFileSync(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

let ok = 0, weg = 0;
const pr = (name: string, gut: unknown, ist = ''): void => {
  if (gut) ok++; else weg++;
  console.log((gut ? '  ✓ ' : '  ✗ ') + name + (gut || !ist ? '' : ' — ' + ist));
};

await p.goto(`http://localhost:${PORT}/index.html`);
await p.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await p.evaluate(() => { Store.setMeta('rundgangGesehen', true); });

console.log('\n1 · Rückverweise: der Link steht unter seinem Ziel');
const ids = await p.evaluate(() => {
  const ziel = Store.addPage(null, { text: 'Ohmsches Gesetz', icon: '⚡' });
  const a = Store.addPage(null, { text: 'Laborbericht Woche 3' });
  Store.addBlock(a.id, 'p', { text: 'Nach [[Ohmsches Gesetz]] ist der Strom proportional zur Spannung.' });
  const c = Store.addPage(null, { text: 'Wiederholungsplan' });
  Store.addBlock(c.id, 'p', { text: 'Für die Prüfung: Ohmsches Gesetz und Leistungsformeln wiederholen.' });
  const d = Store.addPage(null, { text: 'Einkaufsliste' });
  Store.addBlock(d.id, 'p', { text: 'Lötzinn und Aderendhülsen besorgen.' });
  App.oeffne(ziel.id);
  return { ziel: ziel.id, a: a.id, c: c.id, d: d.id };
});
await p.waitForFunction(() => !!document.querySelector('.backlinks'), null, { timeout: 10000 });
const fuss = await p.evaluate(() => {
  const wrap = document.querySelector('.backlinks')!;
  const abschnitt = (klasse: string) => {
    const kopf = wrap.querySelector('.bl-head.' + klasse);
    if (!kopf) return null;
    const titel: string[] = [];
    let el = kopf.nextElementSibling;
    while (el && el.classList.contains('bl-item')) {
      titel.push((el.querySelector('.bl-t')?.textContent || '').trim());
      el = el.nextElementSibling;
    }
    return { kopf: (kopf.textContent || '').trim(), titel };
  };
  return {
    rueck: abschnitt('ein'),
    lose: abschnitt('zwei'),
    stelle: (wrap.querySelector('.bl-item .bl-s')?.textContent || '').trim()
  };
});
pr('Der Laborbericht steht unter „Rückverweise 1"',
  !!fuss.rueck && /Rückverweise\s*1/.test(fuss.rueck.kopf) &&
  fuss.rueck.titel.some(t => t.includes('Laborbericht Woche 3')),
  JSON.stringify(fuss.rueck));
pr('… mit der Fundstelle als Textauszug',
  /proportional zur Spannung/.test(fuss.stelle), fuss.stelle);

console.log('\n2 · Unverlinkte Erwähnungen: erwähnt ist nicht verlinkt');
pr('Der Wiederholungsplan steht unter „Unverlinkte Erwähnungen 1"',
  !!fuss.lose && /Unverlinkte Erwähnungen\s*1/.test(fuss.lose.kopf) &&
  fuss.lose.titel.some(t => t.includes('Wiederholungsplan')),
  JSON.stringify(fuss.lose));
pr('Der Laborbericht steht NICHT noch einmal bei den Unverlinkten',
  !!fuss.lose && !fuss.lose.titel.some(t => t.includes('Laborbericht')),
  JSON.stringify(fuss.lose?.titel));
pr('Die Einkaufsliste (erwähnt nichts) steht nirgends',
  !fuss.rueck?.titel.some(t => t.includes('Einkaufsliste')) &&
  !fuss.lose?.titel.some(t => t.includes('Einkaufsliste')));

console.log('\n3 · Der Klickweg: ein Tipp öffnet die Quelle');
await p.click('.backlinks .bl-item');
await p.waitForTimeout(800);
pr('Der Klick auf den Rückverweis landet im Laborbericht',
  await p.evaluate(() => /Laborbericht Woche 3/.test(
    document.getElementById('crumb')?.textContent || '')),
  await p.evaluate(() => (document.getElementById('crumb')?.textContent || '').trim()));

console.log('\n4 · Der Leerfall: keine Fusszeile ohne Verweise');
await p.evaluate((id: string) => App.oeffne(id), ids.d);
await p.waitForTimeout(800);
pr('Die Einkaufsliste trägt keinen Rückverweis-Kasten',
  await p.evaluate(() => !document.querySelector('.backlinks')));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
