/* Suite 101 — Der Tabellenblock unter dem Finger (L10, §37)
 * ============================================================================
 * CLAUDE.md §37 nennt 44 px als Mindestmass für alles, was mit dem Finger
 * getroffen wird. Gemessen am 8. August, 390 px breit:
 *
 *     Zelle            40 px
 *     Formelzeile      32 px
 *     Werkzeugknöpfe   44 px   ✓
 *
 * Bei der Zelle stand im Quelltext sogar der richtige Gedanke — „32 px
 * trifft man mit dem Finger nicht" — nur zu Ende gerechnet hatte ihn
 * niemand: 40 ist auch nicht 44. Bei der Formelzeile machte allein
 * `padding: 7px 10px` die Höhe, und was dabei herauskommt, hat niemand
 * nachgemessen.
 *
 * DIE ZWEITE HÄLFTE DIESES LAUFS ist die wichtigere, und sie prüft etwas,
 * das man im Quelltext nicht sieht.
 *
 * Die Zeilenhöhe steht an ZWEI Stellen: als `ZH_HANDY` in `ansicht.ts` und
 * als `--tbl-zh` in `tabelle.css`. Das fensterweise Zeichnen rechnet mit
 * der ersten aus, welche Zeilen im Bild sind und wie hoch der Platzhalter
 * darüber sein muss; gezeichnet werden sie mit der zweiten. Gehen die zwei
 * Zahlen auseinander, verschiebt sich der Inhalt gegen seine Beschriftung —
 * Zeile 30 steht dann dort, wo Zeile 29 stehen sollte.
 *
 * Ein Kommentar „muss übereinstimmen" stand schon da. Ein Kommentar ist
 * keine Zusicherung. §2 rechnet es nach.
 *
 *   node pruefungen/lauf/test137.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8813;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 390, height: 844 },
                                      hasTouch: true, isMobile: true });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/** Einen echten Tabellenblock auf einer echten Seite. */
const bauen = () => seite.evaluate(async () => {
  const w = window as any;
  const s = Store.addBlock(null, 'page', { text: 'Fingerprobe' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 350));
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Haushalt' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  const b2 = Store.getBlock(blk.id);
  const bl = b2.mappe.blaetter[0];
  [['A1', 'Posten'], ['B1', 'Jan'], ['A2', 'Miete'], ['B2', 1450],
   ['A3', 'Strom'], ['B3', 98.4]].forEach(([a, v]: any) => { bl.zellen[a] = { wert: v }; });
  Store.updateBlock(blk.id, { mappe: b2.mappe });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  void w;
  return blk.id as string;
});

console.log('\n1 · Was man antippt, ist mindestens 44 px hoch');
await bauen();

const masse = await seite.evaluate(() => {
  const h = (el: Element | null) => el ? Math.round(el.getBoundingClientRect().height) : -1;
  const alle = (wahl: string) => [...document.querySelectorAll(wahl)]
    .map(x => Math.round(x.getBoundingClientRect().height)).filter(n => n > 0);
  return {
    zelle:     h(document.querySelector('.tbl-z')),
    zeilenkopf: h(document.querySelector('.tbl-zk')),
    eingabe:   h(document.querySelector('.tbl-eingabe')),
    adresse:   h(document.querySelector('.tbl-adresse')),
    werkzeuge: alle('.tbl-werkzeuge button'),
    reiter:    alle('.tbl-reiter-eins'),
    plus:      h(document.querySelector('.tbl-plus, .tbl-reiter-plus')),
    /* Die Variable selbst — damit die Meldung sagt, woran es liegt. */
    zh: getComputedStyle(document.querySelector('.tbl')!).getPropertyValue('--tbl-zh').trim()
  };
});

gleich('Die Zeilenhöhe steht auf 44 px', (masse as any).zh, '44px');
p('Eine Zelle ist 44 px hoch', (masse as any).zelle >= 44, `${(masse as any).zelle} px`);
p('Der Zeilenkopf ebenfalls', (masse as any).zeilenkopf >= 44 || (masse as any).zeilenkopf === -1,
  `${(masse as any).zeilenkopf} px`);
p('Die Formelzeile ist 44 px hoch', (masse as any).eingabe >= 44,
  `${(masse as any).eingabe} px`);
p('Jeder Werkzeugknopf ist 44 px hoch',
  ((masse as any).werkzeuge ?? []).every((n: number) => n >= 44),
  JSON.stringify((masse as any).werkzeuge));
p('… und es sind welche da', ((masse as any).werkzeuge ?? []).length >= 2,
  String(((masse as any).werkzeuge ?? []).length));

console.log('\n2 · Die Zeilenhöhe steht an zwei Stellen — und sie stimmen überein');
/* GEMESSEN, NICHT GEGLAUBT. `ZH_HANDY` in `ansicht.ts` rechnet aus, welche
   Zeilen im Bild sind; `--tbl-zh` in `tabelle.css` zeichnet sie. Gehen die
   zwei auseinander, steht Zeile 30 dort, wo Zeile 29 hingehört — und zwar
   erst nach dem Rollen, weshalb es beim flüchtigen Ansehen nicht auffällt. */
const lage = await seite.evaluate(async () => {
  const feld = document.querySelector<HTMLElement>('.tbl-feld');
  if (!feld) return null;
  const zh = parseFloat(getComputedStyle(document.querySelector('.tbl')!)
    .getPropertyValue('--tbl-zh')) || 0;

  /* Weit nach unten rollen — dort trennt sich Rechnung von Zeichnung. */
  feld.scrollTop = zh * 25;
  feld.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 250));

  /* Zwei Zellen derselben Spalte, deren Zeilennummer bekannt ist. */
  const zellen = [...feld.querySelectorAll<HTMLElement>('.tbl-z[data-a]')]
    .filter(z => /^A\d+$/.test(z.dataset['a'] ?? ''))
    .map(z => ({ nr: Number((z.dataset['a'] ?? 'A0').slice(1)),
                 oben: z.getBoundingClientRect().top }))
    .sort((a, b) => a.nr - b.nr);
  if (zellen.length < 3) return { zh, zellen: zellen.length };

  const a = zellen[0]!, b = zellen[zellen.length - 1]!;
  /* Wie viel Höhe liegt laut Bildschirm zwischen zwei Zeilen — und wie
     viele Zeilen liegen laut Beschriftung dazwischen? */
  const proZeile = (b.oben - a.oben) / (b.nr - a.nr);
  return { zh, proZeile: Math.round(proZeile * 100) / 100,
           von: a.nr, bis: b.nr, anzahl: zellen.length,
           gerollt: Math.round(feld.scrollTop) };
});

p('Es wurde weit genug gerollt, dass es sich zeigen würde',
  ((lage as any)?.gerollt ?? 0) > 400, String((lage as any)?.gerollt));
p('Zwischen den Zeilen liegt genau eine Zeilenhöhe',
  Math.abs(((lage as any)?.proZeile ?? 0) - ((lage as any)?.zh ?? -1)) < 0.5,
  `gemessen ${(lage as any)?.proZeile} px, --tbl-zh ${(lage as any)?.zh} px, ` +
  `Zeilen ${(lage as any)?.von}–${(lage as any)?.bis}`);

console.log('\n2b · Und dasselbe fürs Datenbankraster');
/* WARUM DIESER ABSCHNITT EXISTIERT. §2 prüfte den Tabellenblock — und nur
   ihn. Das Raster trägt aber `class="tbl tbl-db"`, es bekommt also
   `--tbl-zh` mit. Als E64 die Variable auf 44 setzte, rechnete `raster.ts`
   weiter mit seinem eigenen `ZH_HANDY = 40`, und die Zeilennummern standen
   versetzt zu ihren Zellen.
   Der volle Durchlauf blieb dabei grün. Eine gemeinsame Variable hat mehr
   als einen Nutzer, und eine Prüfung, die einen davon misst, sagt nichts
   über den anderen. */
const imRaster = await seite.evaluate(async () => {
  const w = window as any;
  document.getElementById('pruef-raster')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Rasterprobe' });
  const db = Store.addDatabase(s.id, 'Kunden', {
    title: { name: 'Kunde', type: 'title' }, a: { name: 'Umsatz', type: 'number' }
  }, 'raster');
  const coll = Store.getCollection(db.collectionId);
  for (let i = 0; i < 40; i++) Store.addRow(coll.id, { title: 'Zeile ' + i, a: i });
  const view = Object.values(Store.cache.views)
    .find((v: any) => v.collectionId === coll.id) as any;
  const kasten = document.createElement('div');
  kasten.id = 'pruef-raster';
  kasten.style.cssText = 'width:334px';
  document.body.appendChild(kasten);
  kasten.appendChild(w.DbRaster.zeichne(coll, view, Store.rowsOf(coll.id)));
  await new Promise(r => setTimeout(r, 500));

  const el = document.querySelector<HTMLElement>('#pruef-raster .tbl');
  const feld = document.querySelector<HTMLElement>('#pruef-raster .tbl-feld');
  const zh = el ? parseFloat(getComputedStyle(el).getPropertyValue('--tbl-zh')) : -1;
  if (feld) { feld.scrollTop = 500; feld.dispatchEvent(new Event('scroll')); }
  await new Promise(r => setTimeout(r, 300));

  const zeilen = [...(feld?.querySelectorAll<HTMLElement>('.tbl-z[data-z]') ?? [])]
    .map(z => ({ nr: Number(z.dataset['z']), oben: z.getBoundingClientRect().top }))
    .filter(x => Number.isFinite(x.nr))
    .sort((a, b) => a.nr - b.nr);
  const a = zeilen[0], b = zeilen[zeilen.length - 1];
  return { zh,
    proZeile: (a && b && b.nr !== a.nr)
      ? Math.round((b.oben - a.oben) / (b.nr - a.nr) * 100) / 100 : -1,
    von: a?.nr, bis: b?.nr, gerollt: Math.round(feld?.scrollTop ?? -1) };
});
p('Auch im Raster wurde weit genug gerollt',
  ((imRaster as any).gerollt ?? 0) > 400, String((imRaster as any).gerollt));
p('Das Raster zeichnet mit derselben Zeilenhöhe, die die CSS vorgibt',
  Math.abs(((imRaster as any).proZeile ?? 0) - ((imRaster as any).zh ?? -1)) < 0.5,
  `gezeichnet ${(imRaster as any).proZeile} px, --tbl-zh ${(imRaster as any).zh} px, ` +
  `Zeilen ${(imRaster as any).von}–${(imRaster as any).bis}`);

console.log('\n3 · Am Rechner bleibt es schmal');
/* 44 px überall wäre am Rechner verschenkter Platz: dort trifft eine Maus
   auch 32 px, und eine Tabelle lebt davon, dass viel gleichzeitig zu sehen
   ist. Die Zahl gilt fürs Telefon, nicht als Weltregel. */
const rechner = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2400);
const amPc = await rechner.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'PC' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 350));
  Store.addBlock(s.id, 'spreadsheet', { text: 'Haushalt' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  const t = document.querySelector<HTMLElement>('.tbl');
  const z = document.querySelector<HTMLElement>('.tbl-z');
  return { zh: t ? getComputedStyle(t).getPropertyValue('--tbl-zh').trim() : '',
           zelle: z ? Math.round(z.getBoundingClientRect().height) : -1 };
});
gleich('Dort steht die Zeilenhöhe auf 32 px', (amPc as any).zh, '32px');
gleich('… und die Zelle ist auch so hoch', (amPc as any).zelle, 32);
await rechner.close();

console.log('\n4 · Und der Block frisst nicht den ganzen Bildschirm');
/* 44 statt 40 kostet Zeilen. Bei zwölf sichtbaren Zeilen sind das 48 px —
   der Block darf darüber nicht den ganzen Bildschirm einnehmen, sonst ist
   die Seite darunter nicht mehr erreichbar. `max-height: 60vh` hält das. */
const platz = await seite.evaluate(() => {
  const t = document.querySelector<HTMLElement>('.tbl');
  const f = document.querySelector<HTMLElement>('.tbl-feld');
  return { block: t ? Math.round(t.getBoundingClientRect().height) : -1,
           feld: f ? Math.round(f.getBoundingClientRect().height) : -1,
           bild: innerHeight,
           feldGrenze: f ? getComputedStyle(f).maxHeight : '' };
});
p('Das Rollfeld ist auf 60 vh begrenzt',
  ((platz as any).feld ?? 0) <= Math.round((platz as any).bild * 0.61),
  `${(platz as any).feld} von ${(platz as any).bild} px, Grenze ${(platz as any).feldGrenze}`);
p('Und der ganze Block passt noch auf einen Bildschirm',
  ((platz as any).block ?? 0) < (platz as any).bild,
  `${(platz as any).block} von ${(platz as any).bild} px`);

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 101 — Der Tabellenblock unter dem Finger: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
