/* Suite 263 — Der Klick auf die Schaltplan-Fläche (E261)
 * ============================================================================
 * Redur wählte ein Symbol, klickte auf die Fläche — und nichts kam. Der
 * Editor hängt an JEDEN Block-Kasten `data-id = block.type`; die Teil-Suche
 * `closest('[data-id]')` wanderte von der leeren Fläche am SVG vorbei bis
 * zum Kasten und hielt jeden Klick für „Teil ‚schaltplan' angeklickt".
 * Einfügen ging darum im Seiten-Editor ins Leere — VOM ERSTEN TAG AN, denn
 * kein Prüflauf hat je echt geklickt: alle haben über Store gesät. Diese
 * Suite klickt. Ohne force, an den Bildschirmkoordinaten, wie eine Maus.
 *
 * §1 EINFÜGEN: Symbol wählen, leere Fläche klicken → ein Teil steht im Plan.
 * §2 DER DOPPELKLICK aufs Teil öffnet seinen Dialog (die Teil-Suche findet
 *    Teile im SVG weiterhin — die Begrenzung hat nichts kaputt gemacht).
 * §3 DER RADIERGUMMI löscht das Teil beim Klick AUFS Teil — und nichts
 *    beim Klick auf leere Fläche.
 * §4 DIE SIMULATION schaltet den Schalter per echtem Klick, und der Strom
 *    fliesst.
 * §5 KEIN DOPPELRASTER: das Punktraster zeichnet das SVG selbst; die Bühne
 *    trägt kein zweites aus CSS (zwei Teilungen übereinander sind Moiré).
 *
 *   node pruefungen/lauf/test263.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Schaltplan: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9034;

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
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof App !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const st = Store.addPage(null, { text: 'Klickprobe' });
  Store.addBlock(st.id, 'schaltplan', { text: 'Plan' });
  App.zeichneBaum(); App.oeffne(st.id);
});
await seite.waitForTimeout(1000);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));

const teileImPlan = (): Promise<number> => seite.evaluate(() => {
  const b = Object.values<any>(Store.cache.blocks).find(x => x && x.type === 'schaltplan');
  return b?.plan?.teile?.length ?? 0;
});

console.log('\n1 · Einfügen: Symbol wählen, leere Fläche klicken');
await seite.locator('.sp-sym[data-sym="lampe"]').first().click();
const buehne = await seite.locator('.sp-buehne').boundingBox();
p('Die Bühne steht', !!buehne);
if (buehne) {
  await seite.mouse.click(buehne.x + buehne.width / 2,
                          buehne.y + Math.min(buehne.height / 2, 200));
}
await seite.waitForTimeout(500);
p('Ein Klick auf die leere Fläche setzt das gewählte Teil',
  await teileImPlan() === 1 && await seite.locator('.sp-teil').count() === 1,
  `${await teileImPlan()} im Plan, ${await seite.locator('.sp-teil').count()} im Bild`);

console.log('\n2 · Doppelklick aufs Teil öffnet seinen Dialog');
/* Über den Locator, nicht über rohe Koordinaten: der erste Klick wählt aus
   und zeichnet die Fläche neu — der Locator sucht das Teil danach frisch. */
await seite.locator('.sp-teil').first().dblclick();
await seite.waitForTimeout(400);
p('Der Teil-Dialog steht', await seite.locator('.overlay .finder').count() === 1);
await seite.evaluate(() =>
  document.querySelectorAll('.overlay').forEach(x => x.remove()));

console.log('\n3 · Der Radiergummi trifft nur Teile');
await seite.locator('[data-wz="radieren"]').click();
if (buehne) await seite.mouse.click(buehne.x + 30, buehne.y + buehne.height - 30);
await seite.waitForTimeout(300);
p('Ein Klick auf leere Fläche löscht nichts', await teileImPlan() === 1,
  String(await teileImPlan()));
const teilBox2 = await seite.locator('.sp-teil').first().boundingBox();
if (teilBox2) await seite.mouse.click(teilBox2.x + teilBox2.width / 2,
                                      teilBox2.y + teilBox2.height / 2);
await seite.waitForTimeout(300);
p('Ein Klick aufs Teil löscht es', await teileImPlan() === 0,
  String(await teileImPlan()));
await seite.locator('[data-wz="zeigen"]').click();

console.log('\n4 · Kein zweites Raster aus CSS');
/* VOR der Simulation gemessen: `sp-laeuft` legt seinen Amber-Schein als
   eigenen Verlauf auf die Bühne, und der ist erlaubt. */
const raster = await seite.evaluate(() => ({
  buehne: getComputedStyle(document.querySelector('.sp-buehne')!).backgroundImage,
  imSvg: !!document.querySelector('.sp-flaeche defs pattern')
}));
p('Das Raster zeichnet allein das SVG (skaliert mit dem Zoom)',
  raster.buehne === 'none' && raster.imSvg, JSON.stringify(raster));


console.log('\n5 · Die Simulation schaltet per echtem Klick');
/* Der Stromkreis kommt aus dem Speicher (wie in test239 §11 begründet:
   senkrechte Zweige, damit keine Leitung einen Anschluss überbrückt) —
   GESCHALTET wird aber mit der Maus, denn genau der Klick war kaputt. */
await seite.evaluate(() => {
  const b = Object.values<any>(Store.cache.blocks).find(x => x && x.type === 'schaltplan');
  const plan: any = Schaltplan.neuerPlan('stromlauf-aufgeloest');
  plan.teile = []; plan.leitungen = []; plan.texte = [];
  const teil = (zeichen: string, bmk: string, x: number, y: number) => {
    const t: any = { id: 't' + plan.teile.length, zeichen, x, y, drehung: 0,
                     gespiegelt: false, bmk, nummern: {}, gruppe: '', ebene: 'plan' };
    plan.teile.push(t); return t;
  };
  const q = teil('wechselspannung', 'G1', 40, 120);
  const s = teil('ch-schema0', 'S1', 240, 20);
  const h = teil('lampe', 'E1', 230, 120);
  const ort = (t: any, nr: string) => {
    const a = Schaltplan.anschluesseVon(t).find((x: any) => x.nr === nr);
    return { x: a.x, y: a.y };
  };
  const leitung = (punkte: any[], a: any, an: string, b2: any, bn: string) =>
    plan.leitungen.push({ id: 'l' + plan.leitungen.length, ebene: 'plan',
      punkte, vonTeil: a.id, vonNr: an, nachTeil: b2.id, nachNr: bn });
  leitung([ort(q, 'L'), { x: 70, y: 20 }, ort(s, '3')], q, 'L', s, '3');
  leitung([ort(s, '4'), ort(h, 'X1')], s, '4', h, 'X1');
  leitung([ort(h, 'X2'), ort(q, 'N')], h, 'X2', q, 'N');
  Store.updateBlock(b.id, { plan });
  App.zeichneBaum(); App.oeffne(b.parentId);
});
await seite.waitForTimeout(900);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await seite.locator('.sp-start').click();
await seite.waitForTimeout(400);
p('Vor dem Schalten fliesst nichts (Schalter offen)',
  await seite.locator('.sp-fluss').count() === 0);
const schalter = await seite.locator('.sp-schaltbar').first().boundingBox();
p('Der Schalter ist als schaltbar zu erkennen', !!schalter);
if (schalter) await seite.mouse.click(schalter.x + schalter.width / 2,
                                      schalter.y + schalter.height / 2);
await seite.waitForTimeout(400);
p('Ein echter Klick auf den Schalter lässt den Strom fliessen',
  await seite.locator('.sp-fluss').count() === 3 &&
  await seite.locator('.sp-leuchtet').count() === 1,
  `${await seite.locator('.sp-fluss').count()} Leitungen, ` +
  `${await seite.locator('.sp-leuchtet').count()} leuchten`);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
