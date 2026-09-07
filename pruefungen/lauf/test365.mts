/* Suite 365 — Ein Formen-Werkzeug statt vier (E375, L115 Punkt 9, Rest)
 * ============================================================================
 * L115 Punkt 9 endete mit einem Satz, der nach E359 offen blieb: „vierzehn
 * Werkzeuge sind viele (Linie, Pfeil, Rechteck, Ellipse als ein
 * Formen-Werkzeug wäre GoodNotes näher)."
 *
 * Vier Werkzeuge, die dasselbe tun — zwei Punkte aufziehen — und sich nur
 * im Ergebnis unterscheiden. Sie stehen jetzt als EIN Knopf in der Leiste
 * und als vier im Zubehör, dort wo auch Farbe und Strichstärke stehen.
 *
 * §1 ELF STATT VIERZEHN, und die vier alten Knöpfe sind weg.
 * §2 DER KNOPF FÜHRT die zuletzt gewählte Form.
 * §3 IM ZUBEHÖR wechselt man sie — und zeichnet sofort damit.
 * §4 GEZEICHNET WIRD, was gewählt ist — die Marke trägt die alte Art.
 * §5 DIE WAHL ÜBERLEBT den Neustart.
 * §6 DAS ZUBEHÖR erscheint nur bei einer Form (die Regel aus E356).
 * §7 AM TELEFON dasselbe, mit 44 px.
 * §8 BAU-HYGIENE.
 *
 *   node pruefungen/lauf/test365.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9395;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];

const blatt = async (breite: number, hoehe: number, handy = false) => {
  const s = await browser.newPage({
    viewport: { width: breite, height: hoehe }, hasTouch: handy, isMobile: handy });
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
    null, { timeout: 30000 });
  await s.waitForTimeout(1000);
  const id = await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    const seite = Store.addPage(null, { text: 'Zeichnen' });
    const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'kariert' });
    App.oeffne(seite.id);
    return b.id as string;
  });
  await s.waitForTimeout(900);
  return { s, id };
};

/* ========================================================================= */
console.log('\n1 · Zwölf statt vierzehn');

const { s: pg, id: blattId } = await blatt(1360, 900);
const werkzeuge = await pg.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-wz]')].map(k => k.dataset.wz));
/* ELF WAREN ES NACH E375; SEIT E494 SIND ES ZWÖLF (die Elemente-
   Bibliothek). Die Zusage dieses Punktes bleibt dieselbe: die vier alten
   Form-Knöpfe sind weg, sie stehen unter einem. */
gleich('Zwölf Werkzeuge', werkzeuge.length, 12);
gleich('Die vier alten Form-Knöpfe sind weg',
  ['line', 'arrow', 'rectangle', 'ellipse'].filter(w => werkzeuge.includes(w)), []);
p('Und einer heisst „formen"', werkzeuge.includes('formen'), werkzeuge.join(' '));

console.log('\n2 · Der Knopf führt die zuletzt gewählte Form');

await pg.click('.blatt-werk [data-wz="formen"]');
await pg.waitForTimeout(200);
const nachTipp = await pg.evaluate(() => ({
  tool: document.querySelector<HTMLElement>('.blatt-werk')?.dataset.tool,
  an: document.querySelector<HTMLElement>('.blatt-werk [data-wz="formen"]')?.classList.contains('on'),
  form: document.querySelector<HTMLElement>('.blatt-werk [data-wz="formen"]')?.dataset.form,
  flaeche: document.querySelector<HTMLElement>('.blatt-marken')?.getAttribute('data-tool'),
}));
gleich('Ohne eigene Wahl führt die Linie', nachTipp.form, 'line');
gleich('Und die Fläche zeichnet Linie', nachTipp.flaeche, 'line');
gleich('Die Leiste sagt es auch', nachTipp.tool, 'line');
p('Der Formen-Knopf leuchtet — nicht keiner', nachTipp.an === true);

console.log('\n3 · Im Zubehör wechselt man sie, und zeichnet sofort damit');

const zubehoer = await pg.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-act="formart"]')].map(k => k.dataset.form));
gleich('Sieben Formen im Zubehör (E465: Dreieck und Rund; E483: die Kurve)', zubehoer, ['line', 'arrow', 'rectangle', 'ellipse', 'triangle', 'roundrect', 'curve']);

await pg.click('.blatt-werk [data-act="formart"][data-form="rectangle"]');
await pg.waitForTimeout(220);
const nachWahl = await pg.evaluate(() => ({
  flaeche: document.querySelector<HTMLElement>('.blatt-marken')?.getAttribute('data-tool'),
  kopfForm: document.querySelector<HTMLElement>('.blatt-werk [data-wz="formen"]')?.dataset.form,
  kopfAn: document.querySelector<HTMLElement>('.blatt-werk [data-wz="formen"]')?.classList.contains('on'),
  gewaehlt: [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-act="formart"]')]
    .filter(k => k.classList.contains('on')).map(k => k.dataset.form),
  gedrueckt: [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-act="formart"]')]
    .filter(k => k.getAttribute('aria-pressed') === 'true').map(k => k.dataset.form),
}));
gleich('Die Fläche zeichnet jetzt Rechtecke', nachWahl.flaeche, 'rectangle');
gleich('Der Knopf oben trägt die Form', nachWahl.kopfForm, 'rectangle');
p('Und leuchtet weiter', nachWahl.kopfAn === true);
gleich('Genau eine Form ist markiert', nachWahl.gewaehlt, ['rectangle']);
gleich('Und das steht auch für Screenreader da (§38)', nachWahl.gedrueckt, ['rectangle']);

console.log('\n4 · Gezeichnet wird, was gewählt ist');

const kasten = await pg.locator('.blatt-marken').boundingBox();
await pg.mouse.move(kasten!.x + 80, kasten!.y + 80);
await pg.mouse.down();
await pg.mouse.move(kasten!.x + 220, kasten!.y + 180, { steps: 6 });
await pg.mouse.up();
await pg.waitForTimeout(400);
const marke = await pg.evaluate((id: string) => {
  const m = (Store.getBlock(id)?.marken || []) as any[];
  return { anzahl: m.length, art: m[m.length - 1]?.art ?? null };
}, blattId);
gleich('Eine Marke ist entstanden', marke.anzahl, 1);
/* DIE ART IST DIE ALTE. Daran hängt der Zeichner, das Menüband und jede
   gespeicherte Marke — E375 fasst die Knöpfe zusammen, nicht das Format. */
gleich('… und sie ist ein Rechteck, nicht „formen"', marke.art, 'rectangle');

console.log('\n5 · Die Wahl überlebt den Neustart');

gleich('Sie steht in der Ablage',
  await pg.evaluate(() => Store.getMeta('zeichnen:form', '')), 'rectangle');
await pg.reload();
await pg.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
  null, { timeout: 30000 });
await pg.waitForTimeout(1500);
gleich('Nach dem Neuladen trägt der Knopf sie noch',
  await pg.evaluate(() =>
    document.querySelector<HTMLElement>('.blatt-werk [data-wz="formen"]')?.dataset.form ?? 'keine Leiste'),
  'rectangle');

console.log('\n6 · Das Zubehör erscheint nur bei einer Form');

const sichtbar = () => pg.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-gruppe="form"]')]
    .filter(k => k.getClientRects().length > 0).length);
await pg.click('.blatt-werk [data-wz="stift"]');
await pg.waitForTimeout(220);
gleich('Beim Stift steht keine Formenwahl da', await sichtbar(), 0);
await pg.click('.blatt-werk [data-wz="formen"]');
await pg.waitForTimeout(220);
p('Bei einer Form schon', await sichtbar() >= 4, String(await sichtbar()));
await pg.click('.blatt-werk [data-wz="radierer"]');
await pg.waitForTimeout(220);
gleich('Beim Radierer wieder nicht', await sichtbar(), 0);

console.log('\n7 · Am Telefon dasselbe, mit 44 px');

const { s: tel } = await blatt(390, 844, true);
await tel.click('.blatt-werk [data-wz="formen"]');
await tel.waitForTimeout(300);
const handy = await tel.evaluate(() => {
  const knoepfe = [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-act="formart"]')]
    .filter(k => k.getClientRects().length > 0);
  return {
    wieviele: knoepfe.length,
    kleinsteHoehe: knoepfe.length ? Math.min(...knoepfe.map(k => Math.round(k.getBoundingClientRect().height))) : 0,
    kleinsteBreite: knoepfe.length ? Math.min(...knoepfe.map(k => Math.round(k.getBoundingClientRect().width))) : 0,
    zeilen: new Set([...document.querySelectorAll<HTMLElement>('.blatt-werk [data-wz]')]
      .map(k => Math.round(k.getBoundingClientRect().top))).size,
  };
});
/* SECHS SEIT E465: Dreieck und rundes Rechteck kamen dazu (Goodnotes' Shape-Tool). */
gleich('Sieben Formen auch am Telefon', handy.wieviele, 7);
p('Jede misst 44 px (§37)', handy.kleinsteHoehe >= 44 && handy.kleinsteBreite >= 44,
  handy.kleinsteBreite + '×' + handy.kleinsteHoehe);
gleich('Und die Werkzeuge bleiben in EINER rollenden Zeile', handy.zeilen, 1);

console.log('\n8 · Bau-Hygiene');

const js = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/pdf/marken.js'), 'utf-8');
const css = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf-8');
const ohneWorte = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
p('Der Katalog der Formen steht im Quelltext',
  /FORMEN\s*=\s*\[/.test(ohneWorte(js)) && js.includes("'rectangle'"));
p('Die alten Kennungen sind unangetastet',
  ["'line'", "'arrow'", "'rectangle'", "'ellipse'"].every(k => js.includes(k)));
p('Der Stil zeigt die Formenwahl bei allen vieren',
  ['line', 'arrow', 'rectangle', 'ellipse'].every(f =>
    css.includes(`.blatt-werk[data-tool="${f}"] > [data-gruppe="form"]`)));
p('Die Einzeldatei kennt den Formen-Knopf',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8').includes('data-act="formart"'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
