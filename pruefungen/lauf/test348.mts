/* Suite 348 — Die Blattleiste am Telefon zeigt nur die Gruppen des gewählten Werkzeugs (E356)
 * ============================================================================
 * L115 Punkt 8: nach E351 bis E355 hatte die Leiste am Telefon einen Knopf
 * nach dem anderen — Stift, Radiermodus, Formen, Kopieren, Einsetzen,
 * Tupfer — und rollte über sechs Bildschirmbreiten; die Farben standen
 * ganz hinten. GoodNotes klappt Farben und Breiten unter dem gewählten
 * Werkzeug auf. Redion blendet am Telefon ein, was zum Werkzeug gehört.
 *
 *   1 · DIE LEISTE KENNT IHR WERKZEUG (`data-tool`), jeder Knopf seine
 *       Gruppe (`data-gruppe`).
 *   2 · AM TELEFON: beim Schreiben nur Werkzeuge und Verlauf; beim Stift
 *       Stil, Formen, Farben, Breiten; beim Radierer sein Modus; bei der
 *       Auswahl Löschen, Kopieren, Einsetzen, Farben, Breiten — und die
 *       Leiste ist um mehr als die Hälfte kürzer.
 *   3 · EINE ZEILE bleibt eine Zeile; jeder sichtbare Knopf ist ein
 *       Fingerknopf.
 *   4 · DER WEG ÜBER DAS MENÜBAND (Zeichenziel) stellt die Leiste genauso um.
 *   5 · EINE EIGENE FARBE, später angelegt, gehört zur Gruppe Farbe.
 *   6 · AM RECHNER bleibt alles sichtbar — dort ist Platz.
 *   7 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test348.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Zeichenziel: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9352;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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

const browser = await chromium.launch();
const fehler: string[] = [];
type Seite = import('playwright').Page;

const kontext = async (handy: boolean) => {
  const ktx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForTimeout(2800);
  await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Leistenprobe', icon: '🧰' });
    const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
  });
  return { ktx, pg };
};

/** Was die Leiste gerade zeigt: Werkzeug, sichtbare Gruppen, Länge, Höhe. */
const leiste = (pg: Seite) => pg.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk');
  if (!w) return null;
  const sichtbar = (el: HTMLElement) => el.getClientRects().length > 0;
  const gruppen = new Set<string>();
  const knoepfe = [...w.querySelectorAll<HTMLElement>('button')];
  let kleinste = Infinity;
  for (const k of knoepfe) {
    if (!sichtbar(k)) continue;
    if (k.dataset.gruppe) gruppen.add(k.dataset.gruppe);
    const r = k.getBoundingClientRect();
    kleinste = Math.min(kleinste, Math.min(r.width, r.height));
  }
  return {
    tool: w.dataset.tool ?? null,
    gruppen: [...gruppen].sort(),
    sichtbar: knoepfe.filter(sichtbar).length,
    gesamt: knoepfe.length,
    laenge: w.scrollWidth,
    hoehe: Math.round(w.getBoundingClientRect().height),
    kleinste: Math.round(kleinste),
    werkzeugeSichtbar: [...w.querySelectorAll<HTMLElement>('[data-wz]')].every(sichtbar),
    verlaufSichtbar: [...w.querySelectorAll<HTMLElement>('[data-gruppe="verlauf"]')].filter(x => x.tagName === 'BUTTON').every(sichtbar)
  };
});
const werkzeug = (pg: Seite, wz: string) => pg.click(`.blatt-werk [data-wz="${wz}"]`);

/* ======================================================================== */
console.log('\n1 · Die Leiste kennt ihr Werkzeug, jeder Knopf seine Gruppe');
const { ktx: ktxH, pg: pgH } = await kontext(true);
let l = await leiste(pgH);
gleich('Beim Start führt „Schreiben"', l?.tool, 'schreiben');
p('Jeder Knopf ausser den Werkzeugen und dem Papier trägt eine Gruppe', await pgH.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk button')].every(b => !!b.dataset.wz || !!b.dataset.gruppe)));
gleich('Die Gruppen heissen, wie sie heissen', await pgH.evaluate(() =>
  [...new Set([...document.querySelectorAll<HTMLElement>('.blatt-werk [data-gruppe]')].map(b => b.dataset.gruppe!))].sort()),
  ['auswahl', 'breite', 'farbe', 'formen', 'lineal', 'radierer', 'stil', 'verlauf']);

/* ======================================================================== */
console.log('\n2 · Am Telefon zeigt jedes Werkzeug seine Gruppen — und die Leiste ist kürzer');
const schreiben = l!;
gleich('Beim Schreiben: nur Werkzeuge und Verlauf', schreiben.gruppen, ['verlauf']);
p('… Werkzeuge und Verlauf sind alle sichtbar', schreiben.werkzeugeSichtbar && schreiben.verlaufSichtbar);
await werkzeug(pgH, 'stift');
const stift = (await leiste(pgH))!;
gleich('Beim Stift: Breite, Farbe, Formen, Stil, Verlauf', stift.gruppen, ['breite', 'farbe', 'formen', 'stil', 'verlauf']);
gleich('… und die Leiste sagt „stift"', stift.tool, 'stift');
await werkzeug(pgH, 'radierer');
const radierer = (await leiste(pgH))!;
gleich('Beim Radierer: sein Modus und der Verlauf', radierer.gruppen, ['radierer', 'verlauf']);
await werkzeug(pgH, 'select');
const auswahl = (await leiste(pgH))!;
gleich('Bei der Auswahl: Auswahl, Breite, Farbe, Verlauf', auswahl.gruppen, ['auswahl', 'breite', 'farbe', 'verlauf']);
await werkzeug(pgH, 'marker');
gleich('Beim Marker: Breite, Farbe, Lineal, Verlauf', (await leiste(pgH))!.gruppen, ['breite', 'farbe', 'lineal', 'verlauf']);
await werkzeug(pgH, 'line');
gleich('Bei der Linie: Breite, Farbe, Lineal, Verlauf', (await leiste(pgH))!.gruppen, ['breite', 'farbe', 'lineal', 'verlauf']);
await werkzeug(pgH, 'text');
gleich('Beim Text: Farbe und Verlauf', (await leiste(pgH))!.gruppen, ['farbe', 'verlauf']);
/* Die Länge: gemessen gegen die ganze Leiste ohne Regel. */
const alles = await pgH.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const vorher = w.dataset.tool;
  delete w.dataset.tool;                     /* ohne data-tool greift keine Regel */
  const l = w.scrollWidth;
  w.dataset.tool = vorher!;
  return l;
});
console.log(`   Länge ohne Regel ${alles} px, beim Schreiben ${schreiben.laenge} px, beim Stift ${stift.laenge} px, beim Radierer ${radierer.laenge} px`);
p('Beim Schreiben ist die Leiste weniger als halb so lang wie ohne Regel', schreiben.laenge < alles / 2, `${schreiben.laenge} von ${alles}`);
p('Beim Stift ist sie kürzer als ohne Regel', stift.laenge < alles * 0.85, `${stift.laenge} von ${alles}`);
/* Die Werkzeugreihe selbst ist rund 700 px; der Radierer legt genau
   seinen Modus-Knopf dazu. */
p('Beim Radierer ist sie die Schreib-Leiste plus ein Knopf', radierer.laenge <= schreiben.laenge + 60 && radierer.laenge < alles * 0.6, `${radierer.laenge} von ${alles}`);
/* DIE GRUPPEN STEHEN DIREKT HINTER DEM WERKZEUG, und die Leiste rollt hin:
   nach dem Tipp auf den Stift liegen Stift-Knopf, Stil und erster Tupfer
   nebeneinander im Bild — nicht drei Bildschirme weiter rechts. */
await werkzeug(pgH, 'stift');
const lage = await pgH.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const r = (sel: string) => w.querySelector<HTMLElement>(sel)!.getBoundingClientRect();
  const stift = r('[data-wz="stift"]'), stil = r('[data-act="stil"]'), tupfer = r('.blatt-farbe'), marker = r('[data-wz="marker"]');
  return { stiftLinks: Math.round(stift.left), stilNachStift: Math.round(stil.left - stift.right), tupferImBild: tupfer.left >= 0 && tupfer.right <= 390,
    markerNachGruppen: marker.left > tupfer.right, scroll: Math.round(w.scrollLeft) };
});
p('Nach dem Tipp steht der Stift links im Bild (die Leiste ist hingerollt)', lage.stiftLinks >= 0 && lage.stiftLinks < 40, JSON.stringify(lage));
p('Der Stil-Knopf folgt direkt auf den Stift', lage.stilNachStift >= 0 && lage.stilNachStift < 30, JSON.stringify(lage));
p('Der erste Tupfer ist ohne Rollen im Bild', lage.tupferImBild, JSON.stringify(lage));
p('Der Marker kommt erst NACH den Gruppen des Stifts', lage.markerNachGruppen, JSON.stringify(lage));

/* ======================================================================== */
console.log('\n3 · Eine Zeile bleibt eine Zeile; jeder sichtbare Knopf ist ein Fingerknopf');
for (const wz of ['schreiben', 'stift', 'radierer', 'select']) {
  await werkzeug(pgH, wz);
  const z = (await leiste(pgH))!;
  p(`${wz}: eine Zeile (unter 60 px) und kleinste Fläche ≥ 30 px (Tupfer) / Knöpfe ≥ 44`, z.hoehe < 60 && z.kleinste >= 30, JSON.stringify([z.hoehe, z.kleinste]));
}
p('Die grossen Knöpfe sind mindestens 44 px', await pgH.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk button:not(.blatt-farbe):not(.blatt-farbe-neu)')]
    .filter(b => b.getClientRects().length > 0)
    .every(b => { const r = b.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })));

/* ======================================================================== */
console.log('\n4 · Der Weg über das Menüband stellt die Leiste genauso um');
await werkzeug(pgH, 'schreiben');
const ueberKern = await pgH.evaluate(async () => {
  const ok = Zeichenziel.setze('radierer');
  await new Promise(f => setTimeout(f, 150));
  return { ok, tool: document.querySelector<HTMLElement>('.blatt-werk')?.dataset.tool };
});
gleich('Zeichenziel.setze(radierer) — die Leiste sagt „radierer"', ueberKern, { ok: true, tool: 'radierer' });
gleich('… und zeigt den Radiermodus', (await leiste(pgH))!.gruppen, ['radierer', 'verlauf']);
await pgH.click('.blatt-werk [data-act="radiermodus"]');
gleich('Der Modus-Knopf lässt die Leiste beim Radierer', (await leiste(pgH))!.tool, 'radierer');
/* Beim Schreiben ist der Modus-Knopf am Telefon nicht da — er gehoert
   zum Radierer. Dass der Knopf das Werkzeug umschaltet, misst test344 §6
   am Rechner; hier zaehlt, dass er beim Radierer steht und dort bleibt. */

/* ======================================================================== */
console.log('\n5 · Eine eigene Farbe, später angelegt, gehört zur Gruppe Farbe');
await werkzeug(pgH, 'stift');
const eigene = await pgH.evaluate(async () => {
  const knopf = document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="farbe"]')!;
  knopf.click();
  await new Promise(f => setTimeout(f, 50));
  const feld = [...document.querySelectorAll<HTMLInputElement>('input[type=color]')].pop();
  if (!feld) return null;
  feld.value = '#8844cc';
  feld.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(f => setTimeout(f, 100));
  const chip = document.querySelector<HTMLElement>('.blatt-werk .blatt-farbe-eigen[data-c="#8844cc"]');
  return chip ? { gruppe: chip.dataset.gruppe ?? null, sichtbar: chip.getClientRects().length > 0 } : null;
});
gleich('Der neue Tupfer trägt die Gruppe Farbe und ist beim Stift sichtbar', eigene, { gruppe: 'farbe', sichtbar: true });
await werkzeug(pgH, 'radierer');
gleich('… und beim Radierer verschwindet er mit den anderen Farben', await pgH.evaluate(() =>
  document.querySelector<HTMLElement>('.blatt-werk .blatt-farbe-eigen[data-c="#8844cc"]')?.getClientRects().length ?? -1), 0);
await ktxH.close();

/* ======================================================================== */
console.log('\n6 · Am Rechner gilt dieselbe Regel — in zwei Zeilen (E359)');
/* E356 hatte den Rechner ausgenommen („dort ist Platz"). Gemessen stimmte
   das nur bei voller Breite: als Spalte (706 px) stand die Leiste in fünf
   Zeilen. Seit E359 blendet auch der Rechner fremde Gruppen aus; was am
   Rechner anders ist — zwei Zeilen statt Rollen, Wörter nach Breite der
   Leiste — misst test351. Hier zählt nur: Werkzeuge immer, Zubehör nach
   Werkzeug. */
const ERWARTET: Record<string, string[]> = {
  schreiben: ['verlauf'], stift: ['breite', 'farbe', 'formen', 'stil', 'verlauf'], radierer: ['radierer', 'verlauf'] };
const { ktx: ktxR, pg: pgR } = await kontext(false);
for (const wz of ['schreiben', 'stift', 'radierer']) {
  await werkzeug(pgR, wz);
  const z = (await leiste(pgR))!;
  gleich(`${wz}: alle Werkzeuge sichtbar, die Gruppen wie am Telefon`,
    [z.werkzeugeSichtbar, z.gruppen], [true, ERWARTET[wz]]);
}
await ktxR.close();

/* ======================================================================== */
console.log('\n7 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
