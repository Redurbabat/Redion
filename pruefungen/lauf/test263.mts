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

console.log('\n6 · Der Netz-Knopf: L1 und N, bereit zum Simulieren (E262)');
/* Redur: „füge dort alle Leitungen wie L1 und N ein, damit ich direkt
   testen kann." Ein Klick, und der Plan hat die Schienen samt Quelle. */
await seite.evaluate(() => {
  const st = Store.addPage(null, { text: 'Netzprobe' });
  Store.addBlock(st.id, 'schaltplan', { text: 'Plan' });
  App.zeichneBaum(); App.oeffne(st.id);
  (window as any).__netzSeite = st.id;
});
await seite.waitForTimeout(800);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
/* Hinter dem Knopf steht seit dem Türklingel-Wunsch ein MENÜ. */
await seite.locator('.sp-netz').click();
await seite.waitForTimeout(300);
await seite.locator('[data-s="netz"]').click();
await seite.waitForTimeout(400);
const netzBlock = (): Promise<any> => seite.evaluate(() => {
  const s = Store.getBlock((window as any).__netzSeite);
  const kid = (s.content || []).map((i: string) => Store.getBlock(i))
    .find((x: any) => x && x.type === 'schaltplan');
  return { id: kid.id, teile: kid.plan?.teile?.length ?? 0,
           leitungen: kid.plan?.leitungen?.length ?? 0,
           texte: (kid.plan?.texte || []).map((t: any) => t.t) };
});
const netz1 = await netzBlock();
p('Ein Klick setzt Quelle, beide Schienen und die Namen L1 und N',
  netz1.teile === 1 && netz1.leitungen === 2 &&
  netz1.texte.includes('L1') && netz1.texte.includes('N'), JSON.stringify(netz1));
await seite.locator('.sp-netz').click();
await seite.waitForTimeout(300);
await seite.locator('[data-s="netz"]').click();
await seite.waitForTimeout(300);
const netz2 = await netzBlock();
p('Der zweite Klick legt nichts doppelt',
  netz2.teile === 1 && netz2.leitungen === 2, JSON.stringify(netz2));

/* Und jetzt „direkt testen": ein Zweig, dessen Leitungen nur auf den
   Schienen ENDEN — kein vonTeil zur Quelle. Fliesst Strom, sind die
   Schienen echte Sammelschienen und nicht bloss Striche. */
await seite.evaluate((blockId: string) => {
  const b = Store.getBlock(blockId);
  const plan = b.plan;
  const oben = 40, unten = plan.hoehe - 40;
  plan.teile.push(
    { id: 'zs', zeichen: 'ch-schema0', x: 380, y: 140, drehung: 0,
      gespiegelt: false, bmk: 'S1', nummern: {}, gruppe: '', ebene: 'plan' },
    { id: 'zh', zeichen: 'lampe', x: 370, y: 300, drehung: 0,
      gespiegelt: false, bmk: 'E1', nummern: {}, gruppe: '', ebene: 'plan' });
  plan.leitungen.push(
    { id: 'zl1', ebene: 'plan', punkte: [{ x: 400, y: oben }, { x: 400, y: 140 }],
      nachTeil: 'zs', nachNr: '3' },
    { id: 'zl2', ebene: 'plan', punkte: [{ x: 400, y: 200 }, { x: 400, y: 300 }],
      vonTeil: 'zs', vonNr: '4', nachTeil: 'zh', nachNr: 'X1' },
    { id: 'zl3', ebene: 'plan', punkte: [{ x: 400, y: 360 }, { x: 400, y: unten }],
      vonTeil: 'zh', vonNr: 'X2' });
  Store.updateBlock(b.id, { plan });
  App.zeichneBaum(); App.oeffne((window as any).__netzSeite);
}, netz1.id);
await seite.waitForTimeout(800);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await seite.locator('.sp-start').click();
await seite.waitForTimeout(400);
const netzSchalter = await seite.locator('.sp-schaltbar').first().boundingBox();
if (netzSchalter) await seite.mouse.click(netzSchalter.x + netzSchalter.width / 2,
                                          netzSchalter.y + netzSchalter.height / 2);
await seite.waitForTimeout(400);
p('Ein Zweig, der auf den Schienen endet, führt Strom — die Lampe leuchtet',
  await seite.locator('.sp-fluss').count() >= 4 &&
  await seite.locator('.sp-leuchtet').count() === 1,
  `${await seite.locator('.sp-fluss').count()} fliessen, ` +
  `${await seite.locator('.sp-leuchtet').count()} leuchten`);

console.log('\n7 · Die Türklingel aus dem Menü klingelt (E262)');
/* „… oder für eine Türklingel — es sollte direkt dort sein, also im
   Code." Ein Menüpunkt, fertig verdrahtet, 12 V wie am Klingeltrafo. */
await seite.evaluate(() => {
  const st = Store.addPage(null, { text: 'Klingelprobe' });
  Store.addBlock(st.id, 'schaltplan', { text: 'Plan' });
  App.zeichneBaum(); App.oeffne(st.id);
});
await seite.waitForTimeout(800);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await seite.locator('.sp-netz').click();
await seite.waitForTimeout(300);
p('Das Menü nennt die Türklingel',
  await seite.locator('[data-s="tuerklingel"]').count() === 1);
await seite.locator('[data-s="tuerklingel"]').click();
await seite.waitForTimeout(500);
await seite.locator('.sp-start').click();
await seite.waitForTimeout(400);
const klingelSchalter = await seite.locator('.sp-schaltbar').first().boundingBox();
if (klingelSchalter) await seite.mouse.click(
  klingelSchalter.x + klingelSchalter.width / 2,
  klingelSchalter.y + klingelSchalter.height / 2);
await seite.waitForTimeout(400);
const klingel = await seite.evaluate(() => ({
  fliesst: document.querySelectorAll('.sp-fluss').length,
  fuss: (document.querySelector('.sp-fuss') as HTMLElement | null)?.textContent || ''
}));
p('Der Taster schliesst, der Strom fliesst', klingel.fliesst >= 4,
  klingel.fliesst + ' Leitungen');
/* 12 V an 1000 Ω sind 12 mA — steht der Wert am Bauteil, rechnet die
   Simulation wirklich mit dem Klingeltrafo und nicht mit 230 V. */
p('… mit 12 V vom Klingeltrafo (12 mA an der Klingel)',
  await seite.evaluate(() =>
    [...document.querySelectorAll('.sp-messwert')].some(m => /12\s*mA/.test(m.textContent || ''))),
  klingel.fuss.slice(0, 100));

/* Und die Wechselschaltung — das Treppenhaus-Verhalten ist der Beweis,
   dass die Korrespondierenden richtig verdrahtet sind: JEDER Schalter
   ändert den Zustand der Lampe. */
await seite.evaluate(() => {
  const st = Store.addPage(null, { text: 'Treppenhaus' });
  Store.addBlock(st.id, 'schaltplan', { text: 'Plan' });
  App.zeichneBaum(); App.oeffne(st.id);
});
await seite.waitForTimeout(800);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await seite.locator('.sp-netz').click();
await seite.waitForTimeout(300);
await seite.locator('[data-s="wechselschaltung"]').click();
await seite.waitForTimeout(500);
await seite.locator('.sp-start').click();
await seite.waitForTimeout(400);
const leuchtet = (): Promise<number> =>
  seite.evaluate(() => document.querySelectorAll('.sp-leuchtet').length);
const vorher = await leuchtet();
const s1Box = await seite.locator('.sp-schaltbar').nth(0).boundingBox();
if (s1Box) await seite.mouse.click(s1Box.x + s1Box.width / 2, s1Box.y + s1Box.height / 2);
await seite.waitForTimeout(400);
const nachS1 = await leuchtet();
const s2Box = await seite.locator('.sp-schaltbar').nth(1).boundingBox();
if (s2Box) await seite.mouse.click(s2Box.x + s2Box.width / 2, s2Box.y + s2Box.height / 2);
await seite.waitForTimeout(400);
const nachS2 = await leuchtet();
p('Wechselschaltung: S1 ändert den Lampenzustand, S2 ändert ihn zurück',
  nachS1 !== vorher && nachS2 !== nachS1,
  `vorher ${vorher}, nach S1 ${nachS1}, nach S2 ${nachS2}`);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
