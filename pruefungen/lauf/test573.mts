/* Suite 573 — Drei Ansichten einer Seite, umschaltbar oben (E690, A1)
 * ============================================================================
 * Redur, 26. September 2026, mit einem Bild von AFFiNEs Kopfzeile: „bei der
 * affine haben wir das es wechsel die ansichten und ich will dort auch die
 * beide und plus von unsere aktuelle stand also mit cover usw also dort
 * 3 bereiche" — und danach: „ich will die 2 von affine 1:1 haben auch alles
 * komplett wie es aussehn … und noch eine 3 für die aktuelle Redion".
 *
 * NACHGELESEN (doku/karte/thema-ansichten.md): AFFiNE hat genau ZWEI Modi,
 * `page` und `edgeless`, und es sind zwei Ansichten DESSELBEN Dokuments.
 * Redion bekommt dieselben zwei — und als dritte die eigene, die AFFiNE
 * nicht hat: Cover, Symbol, Werkzeugzeile, Dokumentmodus.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   §1  Das Feld. Eine Seite trägt `ansicht` mit drei Werten. Wer das Feld
 *       NICHT hat, sieht genau das, was er immer gesehen hat — die Redion-
 *       Ansicht (§9: rückwärts denken, wie `raumVersion` in E686).
 *   §2  Der Umschalter steht OBEN, hat drei Knöpfe, und genau einer ist
 *       gedrückt (§38).
 *   §3  Ein Klick wechselt die Ansicht UND merkt sie an der Seite — wer die
 *       Seite wieder öffnet, ist da, wo er war.
 *   §4  „Redion" zeigt, was Redion heute zeigt: Cover-Knopf und
 *       Werkzeugzeile. Das ist die Ansicht, die es ohne diesen Bogen gibt.
 *   §5  „Seite" ist AFFiNEs schlanke: Symbol und Titel, aber KEIN Cover und
 *       KEINE Werkzeugzeile. Wer sie mit der Redion-Ansicht verwechselt,
 *       hat zwei Ansichten gebaut, die dasselbe zeigen.
 *   §6  „Fläche" ist die Leinwand: Punktraster, und der Seiteninhalt liegt
 *       darauf statt darunter.
 *   §7  KEINE Ansicht verliert Text. Derselbe Absatz ist in allen dreien
 *       zu finden — gemessen am Block, nicht am Bildschirm.
 *   §8  Am Telefon misst jeder Knopf des Umschalters 44 px (§37), und er
 *       steht nicht ausserhalb des Bildes.
 *
 * GEGEN DEN ALTEN STAND ist alles ab §1 rot: es gibt weder das Feld noch
 * den Umschalter.
 *
 *   node pruefungen/alle.mts 573
 * ==========================================================================*/
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

const TEXT = 'Derselbe Absatz in allen drei Ansichten';
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
p('Eine frische Seite trägt noch kein `ansicht` — oder die Redion-Ansicht',
  roh.ansicht === undefined || roh.ansicht === 'redion', String(roh.ansicht));
const werte = await pg.evaluate(() => (window as any).Ansichten?.ARTEN ?? null);
p('Es gibt einen Katalog der Ansichten (`Ansichten.ARTEN`)', Array.isArray(werte), JSON.stringify(werte));
gleich('Und er kennt genau drei: Seite, Fläche, Redion',
  Array.isArray(werte) ? werte.map((a: any) => a.id).sort() : werte, ['flaeche', 'redion', 'seite']);

/* ==========================================================================
 * §2 · Der Umschalter steht oben (§38)
 * ======================================================================== */
console.log('\n2 · Der Umschalter');
const schalter = await pg.evaluate(() => {
  const s = document.querySelector('.pg-ansichten');
  if (!s) return { da: false };
  const kn = [...s.querySelectorAll<HTMLElement>('[data-ansicht]')];
  const r = s.getBoundingClientRect();
  const page = document.querySelector('#page')?.getBoundingClientRect();
  return {
    da: true,
    knoepfe: kn.map(b => b.dataset.ansicht ?? '?'),
    gedrueckt: kn.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.ansicht),
    ohneNamen: kn.filter(b => !(b.getAttribute('aria-label') || b.title || (b.textContent ?? '').trim())).length,
    oben: !!page && r.top <= page.top + 2,
    lage: `${Math.round(r.top)} gegen Seite ${Math.round(page?.top ?? -1)}`
  };
});
p('Es gibt einen Umschalter `.pg-ansichten`', schalter.da === true);
gleich('Mit drei Knöpfen', (schalter.knoepfe ?? []).slice().sort(), ['flaeche', 'redion', 'seite']);
gleich('Genau einer ist gedrückt (§38)', (schalter.gedrueckt ?? []).length, 1);
p('Jeder sagt einem Vorleser, was er ist (§38)', schalter.ohneNamen === 0, `${schalter.ohneNamen} stumm`);
p('Er steht OBEN, nicht mitten auf der Seite', schalter.oben === true, schalter.lage ?? '');

/* ==========================================================================
 * §3 · Umschalten wechselt UND merkt
 * ======================================================================== */
console.log('\n3 · Umschalten und merken');
await pg.click('.pg-ansichten [data-ansicht="seite"]');
await pg.waitForTimeout(400);
gleich('Nach dem Klick steht „seite" an der Seite', (await seite()).ansicht, 'seite');
p('Und der Knopf ist gedrückt',
  await pg.evaluate(() => document.querySelector('.pg-ansichten [data-ansicht="seite"]')?.getAttribute('aria-pressed') === 'true'));
/* Neu öffnen: die Ansicht muss bleiben, sonst ist sie nur eine Laune. */
await pg.evaluate((id: string) => { App.oeffne(id); }, ids.seite);
await pg.waitForTimeout(500);
p('Wer die Seite wieder öffnet, ist da, wo er war',
  await pg.evaluate(() => document.querySelector('.pg-ansichten [data-ansicht="seite"]')?.getAttribute('aria-pressed') === 'true'));

/* ==========================================================================
 * §5 · „Seite" ist die schlanke (AFFiNEs page)
 * --------------------------------------------------------------------------
 * AFFiNE zeigt dort Symbol und Titel, sonst nichts: kein Cover (das gibt es
 * dort gar nicht) und keine Werkzeugzeile.
 * ======================================================================== */
console.log('\n5 · Die Ansicht „Seite"');
const alsSeite = await pg.evaluate(() => ({
  titel: !!document.querySelector('.pg-title, #page h1, .pg-titel'),
  cover: !!document.querySelector('.pg-tools [data-a="cover"]'),
  werkzeugzeile: !!document.querySelector('.pg-tools'),
  raster: !!document.querySelector('.pg-flaeche'),
  text: (document.querySelector('#page')?.textContent ?? '')
}));
p('Sie zeigt einen Titel', alsSeite.titel === true);
p('Aber KEINE Werkzeugzeile', alsSeite.werkzeugzeile === false);
p('Und keinen Cover-Knopf', alsSeite.cover === false);
p('Und kein Flächenraster', alsSeite.raster === false);
p('Der Absatz steht da', alsSeite.text.includes(TEXT));

/* ==========================================================================
 * §6 · „Fläche" ist die Leinwand (AFFiNEs edgeless)
 * ======================================================================== */
console.log('\n6 · Die Ansicht „Fläche"');
await pg.click('.pg-ansichten [data-ansicht="flaeche"]');
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
await pg.click('.pg-ansichten [data-ansicht="redion"]');
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
gleich('Der Absatz steht nach drei Wechseln unverändert im Speicher', nachAllem.text, TEXT);
p('Und er lebt noch', nachAllem.alive !== false, String(nachAllem.alive));
await pg.close();

/* ==========================================================================
 * §8 · Am Telefon 44 px (§37)
 * ======================================================================== */
console.log('\n8 · Am Telefon');
const { pg: handy } = await bauen(390, 844);
const klein = await handy.evaluate(() => {
  const kn = [...document.querySelectorAll<HTMLElement>('.pg-ansichten [data-ansicht]')];
  const masse = kn.map(b => { const r = b.getBoundingClientRect();
    return { id: b.dataset.ansicht ?? '?', w: Math.round(r.width), h: Math.round(r.height) }; });
  return {
    anzahl: masse.length,
    zuKlein: masse.filter(m => m.h < 44 || m.w < 44),
    raus: kn.filter(b => { const r = b.getBoundingClientRect();
      return r.right > innerWidth + 1 || r.left < -1; }).length
  };
});
gleich('Auch am Telefon drei Knöpfe', klein.anzahl, 3);
p('Jeder misst 44 px (gerenderte Box, §37)', klein.zuKlein.length === 0,
  klein.zuKlein.map(m => `${m.id} ${m.w}×${m.h}`).join(' · '));
p('Und keiner steht ausserhalb des Bildes', klein.raus === 0, `${klein.raus} draussen`);
await handy.close();

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
