/* Suite 573 · Redion und Fläche, Umschalter und alte Ansichtsmerker. */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)} soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;
const browser = await chromium.launch();

const TEXT = 'Derselbe Absatz in beiden Ansichten';
const bauen = async (breite: number, hoehe: number) => {
  const pg = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  const ids = await pg.evaluate(async (text: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    const s = Store.addPage(null, { text: 'Drei Ansichten' });
    const b = Store.addBlock(s.id, 'text', { text });
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
    return { seite: s.id, block: b.id };
  }, TEXT);
  await pg.waitForTimeout(250);
  return { pg, ids };
};

const { pg, ids } = await bauen(1300, 950);
const seite = () => pg.evaluate((id: string) => JSON.parse(JSON.stringify(Store.getBlock(id))), ids.seite);

/* ==========================================================================
 * §1 · Das Feld, und was ein Brett von gestern sieht
 * --------------------------------------------------------------------------
 * Dieselbe Regel wie bei `raumVersion` (E686): ein Block OHNE das Feld ist
 * nicht kaputt, sondern von gestern — und sieht genau das, was er immer
 * gesehen hat.
 * ======================================================================== */
console.log('\n1 · Das Feld `ansicht`');
const roh = await seite();
p('Eine frische Seite trägt noch kein `seitenAnsicht` — oder die Redion-Ansicht',
  roh.seitenAnsicht === undefined || roh.seitenAnsicht === 'redion', String(roh.seitenAnsicht));
/* UND DAS FEHLENDE FELD MUSS AUCH SO AUSSEHEN. Die Zeile darüber prüft nur,
   dass nichts geschrieben WURDE — das ist die halbe Zusage. Die andere
   Hälfte ist, was ein Mensch dann SIEHT: die Redion-Ansicht mit ihrem
   Cover-Knopf. Die Gegenprobe (`?? k.ARTEN[0].id` statt `?? k.VORGABE`)
   liess die erste Zeile grün und wäre hier rot — jede bestehende Seite
   dieser App hätte ihr Cover verloren, ohne dass ein Byte geschrieben wird
   (§9). */
p('Und ohne Feld sieht man die Redion-Ansicht — Cover-Knopf da',
  await pg.evaluate(() => !!document.querySelector('.pg-tools [data-a="cover"]')));
const werte = await pg.evaluate(() => (window as any).Register?.seitenansichten?.ARTEN ?? null);
p('Es gibt einen Katalog der Ansichten (`Register.seitenansichten.ARTEN`)', Array.isArray(werte), JSON.stringify(werte));
gleich('Und er kennt genau Redion und Fläche',
  Array.isArray(werte) ? werte.map((a: any) => a.id).sort() : werte, ['flaeche', 'redion']);

/* ==========================================================================
 * §2 · Der Umschalter steht oben (§38)
 * ======================================================================== */
console.log('\n2 · Der Umschalter');
const schalter = await pg.evaluate(() => {
  const s = document.querySelector('.pg-ansichten');
  if (!s) return { da: false };
  const kn = [...s.querySelectorAll<HTMLElement>('[data-seg-wahl]')];
  const r = s.getBoundingClientRect();
  const page = document.querySelector('#page')?.getBoundingClientRect();
  return {
    da: true,
    knoepfe: kn.map(b => b.dataset.segWahl ?? '?'),
    gedrueckt: kn.filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.segWahl),
    ohneNamen: kn.filter(b => !(b.getAttribute('aria-label') || b.title || (b.textContent ?? '').trim())).length,
    oben: !!page && r.top <= page.top + 2,
    lage: `${Math.round(r.top)} gegen Seite ${Math.round(page?.top ?? -1)}`
  };
});
p('Es gibt einen Umschalter `.pg-ansichten`', schalter.da === true);
gleich('Mit genau Redion und Fläche', schalter.knoepfe ?? [], ['redion', 'flaeche']);
gleich('Genau einer ist gedrückt (§38)', (schalter.gedrueckt ?? []).length, 1);
p('Jeder sagt einem Vorleser, was er ist (§38)', schalter.ohneNamen === 0, `${schalter.ohneNamen} stumm`);
p('Er steht OBEN, nicht mitten auf der Seite', schalter.oben === true, schalter.lage ?? '');

/* ==========================================================================
 * §3 · Umschalten wechselt UND merkt
 * ======================================================================== */
console.log('\n3 · Umschalten und merken');
await pg.click('.pg-ansichten [data-seg-wahl="flaeche"]');
await pg.waitForTimeout(400);
gleich('Nach dem Klick steht „flaeche“ an der Seite', (await seite()).seitenAnsicht, 'flaeche');
p('Und der Knopf ist gedrückt',
  await pg.evaluate(() => document.querySelector('.pg-ansichten [data-seg-wahl="flaeche"]')?.getAttribute('aria-checked') === 'true'));
/* Neu öffnen: die Ansicht muss bleiben, sonst ist sie nur eine Laune. */
await pg.evaluate((id: string) => { App.oeffne(id); }, ids.seite);
await pg.waitForTimeout(500);
p('Wer die Seite wieder öffnet, ist da, wo er war',
  await pg.evaluate(() => document.querySelector('.pg-ansichten [data-seg-wahl="flaeche"]')?.getAttribute('aria-checked') === 'true'));

console.log('\n5 · Kompatibilität');
await pg.evaluate((id: string) => {
  Store.updateBlock(id, { seitenAnsicht: 'seite' });
  App.zeichneSeite();
}, ids.seite);
p('Eine alte schlanke Seite öffnet sich als Redion',
  await pg.evaluate(() =>
    !!document.querySelector('.pg-tools [data-a="cover"]') &&
    document.querySelector('.pg-ansichten [data-seg-wahl="redion"]')?.getAttribute('aria-checked') === 'true'));
gleich('Der alte Merker bleibt beim Öffnen erhalten', (await seite()).seitenAnsicht, 'seite');

/* ==========================================================================
 * §6 · „Fläche" ist die Leinwand (AFFiNEs edgeless)
 * ======================================================================== */
console.log('\n6 · Die Ansicht „Fläche"');
await pg.click('.pg-ansichten [data-seg-wahl="flaeche"]');
await pg.waitForTimeout(500);
const alsFlaeche = await pg.evaluate(() => {
  const f = document.querySelector('.pg-flaeche');
  const stil = f ? getComputedStyle(f) : null;
  return {
    da: !!f,
    raster: !!stil && /radial-gradient/.test(stil.backgroundImage),
    werkzeuge: !!document.querySelector('.pg-flaeche .gfx-tb-sockel, .pg-flaeche .wb-tools'),
    werkzeugzeile: !!document.querySelector('.pg-tools'),
    text: (document.querySelector('#page')?.textContent ?? '')
  };
});
p('Es gibt eine Fläche `.pg-flaeche`', alsFlaeche.da === true);
p('Mit Punktraster (wie AFFiNEs `radial-gradient`)', alsFlaeche.raster === true);
p('Und einer Werkzeugleiste darauf', alsFlaeche.werkzeuge === true);
p('Die Werkzeugzeile der Seite ist weg', alsFlaeche.werkzeugzeile === false);
p('Der Absatz ist auch hier zu finden', alsFlaeche.text.includes(TEXT));

/* ==========================================================================
 * §4 · „Redion" ist unsere eigene — die mit dem Cover
 * ======================================================================== */
console.log('\n4 · Die Ansicht „Redion"');
await pg.click('.pg-ansichten [data-seg-wahl="redion"]');
await pg.waitForTimeout(500);
const alsRedion = await pg.evaluate(() => ({
  cover: !!document.querySelector('.pg-tools [data-a="cover"]'),
  breite: !!document.querySelector('.pg-tools [data-a="wide"]'),
  vorlage: !!document.querySelector('.pg-tools [data-a="vorlage"]'),
  raster: !!document.querySelector('.pg-flaeche'),
  text: (document.querySelector('#page')?.textContent ?? '')
}));
p('Sie hat den Cover-Knopf — den AFFiNE gar nicht kennt', alsRedion.cover === true);
p('Und „Volle Breite" und „Vorlage"', alsRedion.breite === true && alsRedion.vorlage === true);
p('Kein Flächenraster', alsRedion.raster === false);
p('Der Absatz steht da', alsRedion.text.includes(TEXT));

/* ==========================================================================
 * §7 · Keine Ansicht verliert Text (§9)
 * --------------------------------------------------------------------------
 * Am BLOCK gemessen, nicht am Bildschirm: eine Ansicht, die etwas versteckt,
 * darf es nicht löschen.
 * ======================================================================== */
console.log('\n7 · Kein Text geht verloren');
const nachAllem = await pg.evaluate((id: string) =>
  JSON.parse(JSON.stringify(Store.getBlock(id))), ids.block);
gleich('Der Absatz steht nach den Ansichtswechseln unverändert im Speicher', nachAllem.text, TEXT);
p('Und er lebt noch', nachAllem.alive !== false, String(nachAllem.alive));
await pg.close();

/* ==========================================================================
 * §8 · Am Telefon 44 px (§37)
 * ======================================================================== */
console.log('\n8 · Am Telefon');
const { pg: handy } = await bauen(390, 844);
const klein = await handy.evaluate(() => {
  const kn = [...document.querySelectorAll<HTMLElement>('.pg-ansichten [data-seg-wahl]')];
  const masse = kn.map(b => { const r = b.getBoundingClientRect();
    return { id: b.dataset.segWahl ?? '?', w: Math.round(r.width), h: Math.round(r.height) }; });
  return {
    anzahl: masse.length,
    zuKlein: masse.filter(m => m.h < 44 || m.w < 44),
    raus: kn.filter(b => { const r = b.getBoundingClientRect();
      return r.right > innerWidth + 1 || r.left < -1; }).length
  };
});
gleich('Auch am Telefon zwei Knöpfe', klein.anzahl, 2);
p('Jeder misst 44 px (gerenderte Box, §37)', klein.zuKlein.length === 0,
  klein.zuKlein.map(m => `${m.id} ${m.w}×${m.h}`).join(' · '));
p('Und keiner steht ausserhalb des Bildes', klein.raus === 0, `${klein.raus} draussen`);
await handy.close();

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
