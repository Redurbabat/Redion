/* Suite 306 — Die Datenbank bekommt ihre Kontextkante (L95, E312)
 * ============================================================================
 * Die Datenbank war seit E272 Phase F der einzige Schauplatz ohne eigene
 * Kante: eine Seite, die nur eine Datenbank zeigt, bekam die Griffe des
 * Editors. E273 hat nachgemessen, WARUM, und drei Gründe gefunden:
 *
 *   1 · Es gab den Schauplatz nicht. Für `bereichJetzt()` war das der
 *       Editor.
 *   2 · Es gab keinen Griff. `sammlungAufSeite()` gab nur eine Kennung —
 *       ohne `{coll, view, block}` lässt sich kein Menü aufrufen.
 *   3 · Die Menüs waren von aussen `undefined`; sie standen nicht im
 *       Rückgabeobjekt.
 *
 * Dazu ein vierter, der erst beim Bauen auffiel: `sortMenue` und
 * `gruppierenMenue` lesen sofort `anker.getBoundingClientRect()`. Ein Knopf,
 * der wirft, ist ein Knopf, der nichts tut (§47) — die Kante gibt deshalb
 * ihren eigenen Knopf an `tun` weiter.
 *
 *   §1 DER SCHAUPLATZ heisst „datenbank", wenn die Seite nur sie zeigt.
 *   §2 GEGENPROBE: Text davor und danach, und es bleibt der Editor.
 *   §3 DIE FÜNF GRIFFE stehen an der Kante.
 *   §4 UND JEDER TUT WIRKLICH ETWAS — angeklickt, nicht behauptet.
 *   §5 DIE ANSICHTEN in der Lade, mit Strichzeichen statt Emoji.
 *
 *   node pruefungen/lauf/test306.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9317;

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

const gebaut = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();

  const schema = {
    titel:  { name: 'Projekt', type: 'title' },
    status: { name: 'Status', type: 'status',
              options: [{ name: 'Offen' }, { name: 'Fertig' }] }
  };
  /* Eine Seite, die NUR die Datenbank zeigt. */
  const rein = Store.addPage(null, { text: 'Projekte' });
  const db = Store.addDatabase(rein.id, 'Projekte', schema);
  Store.addRow(db.collectionId, { title: 'Schaltplan' });
  /* Und eine mit Text davor und danach. */
  const misch = Store.addPage(null, { text: 'Mischung' });
  Store.addBlock(misch.id, 'text', { text: 'Davor.' });
  Store.addDatabase(misch.id, 'Klein', schema);
  Store.addBlock(misch.id, 'text', { text: 'Danach.' });
  /* Und eine ganz ohne. */
  const text = Store.addPage(null, { text: 'Nur Text' });
  Store.addBlock(text.id, 'text', { text: 'Kein Datenbankblock.' });
  /* Und eine mit einem A4-Blatt — das ist für die Kante eine PDF. */
  const blatt = Store.addPage(null, { text: 'Blatt' });
  Store.addBlock(blatt.id, 'blatt', { text: '' });
  await Store.flush();
  return { rein: rein.id, misch: misch.id, text: text.id, blatt: blatt.id,
           coll: db.collectionId, view: db.viewId };
});

/** Eine Seite öffnen und die Kante lesen. */
const kante = async (seite: string) => pc.evaluate(async (id: string) => {
  const w = globalThis as any;
  App.oeffne(id);
  await new Promise(r => setTimeout(r, 800));
  const knoepfe = [...document.querySelectorAll('.k-knopf')]
    .map(b => String((b as HTMLElement).dataset['k'] || ''));
  return { bereich: w.Kontextkante.bereichJetzt(), knoepfe };
}, seite);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Schauplatz heisst „datenbank"');

const dbSeite = await kante(gebaut.rein);
gleich('Eine reine Datenbankseite ist die Datenbank', dbSeite.bereich, 'datenbank');

/* ------------------------------------------------------------------------ */
console.log('\n2 · GEGENPROBE: mit Text drumherum bleibt es der Editor');

const mischSeite = await kante(gebaut.misch);
gleich('Text davor und danach — der Editor bleibt', mischSeite.bereich, 'editor');
const textSeite = await kante(gebaut.text);
gleich('Und eine reine Textseite sowieso', textSeite.bereich, 'editor');
gleich('Dort stehen die fünf Datenbankgriffe NICHT',
  mischSeite.knoepfe.filter(k => k.startsWith('db-')), []);

/* DASS DIE KANTE SICH ÜBERHAUPT NEU ZEICHNET, fiel erst beim Bauen auf und
   war schon vorher kaputt: `schauplatzMelden()` meldete nur, wenn sich
   `App.schauplatz()` änderte — von einer Seite auf eine andere bleibt der
   aber „seite". Es kam also gar kein Signal, und die Kante blieb stehen,
   wie sie war.
   Der Vergleich hier ist der Wächter dagegen: die Knopfliste der
   Datenbankseite und die der Textseite dürfen nicht dieselbe sein. */
p('Die Kante hat sich beim Seitenwechsel wirklich neu gezeichnet',
  JSON.stringify(dbSeite.knoepfe) !== JSON.stringify(textSeite.knoepfe),
  JSON.stringify([dbSeite.knoepfe, textSeite.knoepfe]));

/* Ein A4-Blatt ist KEINE PDF. Das stand als Absicht schon im Kopf von
   `bereichJetzt()`; nur standen darunter zwei Selektoren, die nie etwas
   trafen (`.pdfseite`, `.blattraum` — der Editor zeichnet `.b-pdfseite`).
   Sie sind mit E312 weg, und dieser Punkt hält fest, dass die Absicht
   bleibt: nur der Dokumentmodus ist die PDF. */
const blattSeite = await kante(gebaut.blatt);
gleich('Ein Blatt allein macht noch keine PDF', blattSeite.bereich, 'editor');

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die fünf Griffe stehen an der Kante');

const zurueck = await kante(gebaut.rein);
gleich('Ansicht, Filter, Sortieren, Gruppieren, Spalten',
  ['db-ansicht', 'db-filter', 'db-sort', 'db-gruppe', 'db-spalten']
    .filter(k => !zurueck.knoepfe.includes(k)), []);
/* Zeichen statt leerer Quadrate — und die zwei neuen gibt es wirklich. */
const zeichen = await pc.evaluate(() => {
  const R = (globalThis as any).Register;
  return { filter: !!R.symbole.hat('filter'), sort: !!R.symbole.hat('sort'),
           leer: [...document.querySelectorAll('.k-knopf svg')]
             .filter(s => !s.innerHTML.trim()).length };
});
p('Die zwei neuen Zeichen gibt es', zeichen.filter && zeichen.sort, JSON.stringify(zeichen));
gleich('Und kein Knopf zeigt ein leeres Quadrat', zeichen.leer, 0);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Und jeder tut wirklich etwas');

/**
 * Einen Kantenknopf anklicken und nachsehen, ob danach etwas offen ist.
 *
 * DAS IST DER PUNKT DIESES LAUFS. Ein Knopf, der da ist und nichts tut, ist
 * schlimmer als keiner — man sucht den Fehler bei sich. `sortMenue` hätte
 * ohne Anker sofort geworfen, und die Kante wäre stehen geblieben, als sei
 * nichts gewesen.
 */
const klick = async (id: string) => pc.evaluate(async (k: string) => {
  document.querySelectorAll('.menu, .overlay').forEach(m => m.remove());
  const b = document.querySelector<HTMLElement>('.k-knopf[data-k="' + k + '"]');
  if (!b) return { da: false, menu: 0, overlay: 0, text: '' };
  b.click();
  await new Promise(r => setTimeout(r, 350));
  const m = document.querySelector('.menu');
  const o = document.querySelector('.overlay');
  return { da: true, menu: document.querySelectorAll('.menu').length,
           overlay: document.querySelectorAll('.overlay').length,
           text: ((m || o)?.textContent || '').slice(0, 60) };
}, id);

for (const [id, wort] of [['db-filter', 'Filter'], ['db-sort', 'Sortier'],
                          ['db-gruppe', 'ruppier'], ['db-spalten', 'Eigenschaft']] as const) {
  const r = await klick(id);
  p(`„${id}" öffnet etwas`, r.da && (r.menu + r.overlay) > 0,
    JSON.stringify(r));
  p(`… und es ist ${wort}`, r.text.includes(wort), r.text);
}

/* ------------------------------------------------------------------------ */
console.log('\n5 · Die Ansichten in der Lade');

const lade = await pc.evaluate(async () => {
  document.querySelectorAll('.menu, .overlay').forEach(m => m.remove());
  const b = document.querySelector<HTMLElement>('.k-knopf[data-k="db-ansicht"]');
  if (!b) return { zeilen: [] as any[], symbole: [] as string[] };
  b.click();
  await new Promise(r => setTimeout(r, 400));
  const zeilen = [...document.querySelectorAll('.kl-zeile')].map(z => ({
    text: (z.textContent || '').trim().slice(0, 40),
    an: z.classList.contains('ist-an'),
    sym: (z.querySelector('[data-sym]') as HTMLElement | null)?.dataset['sym'] || ''
  }));
  return { zeilen, symbole: zeilen.map(z => z.sym) };
});
p('Die Lade zeigt mindestens eine Ansicht', lade.zeilen.length >= 1,
  JSON.stringify(lade.zeilen));
p('Genau eine ist als aktiv gekennzeichnet',
  lade.zeilen.filter((z: any) => z.an).length === 1, JSON.stringify(lade.zeilen));
/* KEIN EMOJI. Im Ansichtenregister stehen `▦`, `📅`, `🧮` — an der Kante
   sind das leere Quadrate oder bunte Fremdkörper (E202). */
gleich('Und jede trägt einen Zeichennamen, kein Emoji',
  lade.symbole.filter((s: string) => !/^[a-zA-Z]+$/.test(s)), []);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
