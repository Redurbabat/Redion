/* Suite 199 — Ein grosser Bestand, und was er kostet (L22, E180)
 * ============================================================================
 * L22 nennt vier Dinge: Messungen mit zehntausend Seiten · virtualisierte
 * Listen · ein Suchindex, der nicht bei jedem Start neu entsteht ·
 * Speichermessung bei Export und Import.
 *
 * Nachgemessen an 8000 Blöcken sieht die Lage besser aus, als die Lücke
 * vermuten lässt — und an einer Stelle schlechter:
 *
 *   Neu laden bis der Bestand steht      unter einer Sekunde
 *   `Store.baum` über den ganzen Baum    Millisekunden
 *   `exportAll` über 4,9 MB              Millisekunden
 *   Eine Datenbankansicht zeigt 50 von 300 Zeilen — UND SAGT ES NICHT
 *
 * Das Letzte ist der Fund. Eine Tabelle, die einen Teil zeigt und aussieht
 * wie das Ganze, ist die gefährlichere Sorte Unvollständigkeit: man merkt
 * sie erst, wenn man etwas sucht, das dasteht und nicht gefunden wird.
 *
 * WAS DIESE SUITE MISST UND WAS NICHT. Keine Millisekunden als Schranke —
 * die hängen an der Maschine, und eine Prüfung, die auf einem langsamen
 * Rechner rot wird, wird abgeschaltet statt gelesen. Gemessen werden ZAHLEN
 * UND FORMEN: wie viele Sätze angefasst werden, wie viele Knoten im Bild
 * stehen, was die Ansicht über sich selbst sagt. Dazu ein paar sehr weite
 * Zeitschranken, die keine gesunde Maschine reisst und ein quadratischer
 * Algorithmus sofort.
 *
 *   node pruefungen/lauf/test233.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8990;

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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.setViewportSize({ width: 1300, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2600);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · Achttausend Blöcke, und die App steht noch
 * ========================================================================*/
console.log('\n1 · Achttausend Blöcke');

const bau = await seite.evaluate(async () => {
  const t0 = performance.now();
  const wurzel = Store.addPage(null, { text: 'Grosser Bestand' });
  for (let i = 0; i < 200; i++) {
    const s = Store.addPage(wurzel.id, { text: 'Seite ' + i });
    for (let j = 0; j < 20; j++)
      Store.addBlock(s.id, 'text', { text: 'Absatz ' + i + '-' + j + ' mit etwas Text darin' });
  }
  const { collectionId } = Store.addDatabase(wurzel.id, 'Grosse Tabelle', null, 'table');
  for (let i = 0; i < 2000; i++) Store.addRow(collectionId, { title: 'Zeile ' + i });
  await Store.flush();
  return { ms: Math.round(performance.now() - t0),
           bloecke: Object.keys(Store.cache.blocks).length,
           coll: collectionId, wurzel: wurzel.id };
});

p('Es sind wirklich über achttausend Blöcke', bau.bloecke > 8000, String(bau.bloecke));
/* SEHR WEIT GESETZT. 8000 Blöcke einzeln anzulegen und einmal zu schreiben
   kostet auf dieser Maschine anderthalb Sekunden. Dreissig sind kein Mass
   für Geschwindigkeit — sie sind die Schranke, an der ein quadratischer
   Algorithmus hängen bleibt und eine langsame Maschine nicht. */
p('Und sie entstehen in weniger als dreissig Sekunden', bau.ms < 30000, bau.ms + ' ms');

const mess = await seite.evaluate(async (b: any) => {
  const zeit = async (fn: () => any) => {
    const t = performance.now(); await fn(); return Math.round(performance.now() - t);
  };
  const aus: Record<string, number> = {};
  aus.suche = await zeit(() => Store.search('Absatz 100-5'));
  aus.baum = await zeit(() => Store.baum(b.wurzel));
  aus.rowsOf = await zeit(() => Store.rowsOf(b.coll));
  let laenge = 0;
  aus.export = await zeit(async () => { laenge = (await Store.exportAll()).length; });
  aus.exportLaenge = laenge;
  const coll = Store.getCollection(b.coll);
  const view = Store.getView(coll.viewIds[0]);
  aus.filtern = await zeit(() => Datenbank.zeilen(coll, view));
  return aus;
}, bau);

p('Eine Suche über achttausend Blöcke bleibt unter fünf Sekunden',
  (mess.suche ?? 1e9) < 5000, mess.suche + ' ms');
p('Der ganze Baum lässt sich in unter fünf Sekunden einsammeln',
  (mess.baum ?? 1e9) < 5000, mess.baum + ' ms');
p('Zweitausend Zeilen zu holen kostet unter einer Sekunde',
  (mess.rowsOf ?? 1e9) < 1000, mess.rowsOf + ' ms');
p('Die Sicherung ist wirklich gross', (mess.exportLaenge || 0) > 1000000,
  Math.round((mess.exportLaenge || 0) / 1024) + ' KB');
p('Und sie entsteht in unter zehn Sekunden', (mess.export ?? 1e9) < 10000, mess.export + ' ms');
p('Filtern und Sortieren bleibt unter einer Sekunde', (mess.filtern ?? 1e9) < 1000, mess.filtern + ' ms');

/* ==========================================================================
 * §2 · Nach dem Neuladen ist der Bestand da — schnell
 * --------------------------------------------------------------------------
 * Die Zahl, die ein Mensch spürt. Alles andere passiert, während er noch
 * nichts erwartet.
 * ========================================================================*/
console.log('\n2 · Nach dem Neuladen');

const t0 = Date.now();
await seite.reload();
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  Object.keys(Store.cache.blocks || {}).length > 8000, null, { timeout: 120000 });
/* UND AUF DIE SCHALE WARTEN, nicht nur auf die Daten. Der Bestand steht
   früher als die Oberfläche; wer danach `App.oeffne` ruft, ruft ins Leere
   und bekommt eine Seite ohne einen einzigen Block. Genau das ist beim
   Schreiben dieser Suite passiert — und sah aus wie ein Fehler in der
   Ansicht. */
await seite.waitForSelector('#scroll', { timeout: 60000 });
const laden = Date.now() - t0;
p('Der Bestand steht in weniger als dreissig Sekunden', laden < 30000, laden + ' ms');

const nachher = await seite.evaluate(() => ({
  bloecke: Object.keys(Store.cache.blocks).length,
  knoten: document.querySelectorAll('*').length
}));
gleich('Und es sind dieselben Blöcke', nachher.bloecke, bau.bloecke);
/* KEIN BAUM MIT ACHTTAUSEND KNOTEN IM BILD. Die Seitenleiste zeigt die
   oberste Ebene; wer alles auf einmal zeichnete, hätte eine App, die beim
   Öffnen steht. */
p('Und das Bild hat nicht achttausend Knoten', nachher.knoten < 4000,
  String(nachher.knoten));

/* ==========================================================================
 * §3 · Und was die Ansicht verschweigt, sagt sie jetzt
 * --------------------------------------------------------------------------
 * DER FUND. `begrenzen` zeigt 50 Zeilen von 2000 und nahm die übrigen
 * wortlos weg.
 * ========================================================================*/
console.log('\n3 · Und was die Ansicht verschweigt, sagt sie jetzt');

/* AUF DAS BILD WARTEN, NICHT AUF DIE UHR. Eine Seite mit 201 Kindern —
   zweihundert Unterseiten und die Datenbank — war nach 1600 ms noch leer.
   Eine feste Wartezeit misst dann die Wartezeit und nicht die App. */
const gezeichnetMs = await seite.evaluate(async (b: any) => {
  const dbBlock = (Object.values(Store.cache.blocks) as any[])
    .find(x => x.type === 'database' && x.collectionId === b.coll);
  const t = performance.now();
  App.oeffne(Store.getBlock(dbBlock.parentId).id);
  for (let i = 0; i < 600; i++) {
    if (document.querySelector(`.blk[data-bid="${dbBlock.id}"]`)) break;
    await new Promise(r => setTimeout(r, 50));
  }
  return Math.round(performance.now() - t);
}, bau);
p('Eine Seite mit 201 Kindern steht in unter dreissig Sekunden',
  gezeichnetMs < 30000, gezeichnetMs + ' ms');

const grenze = await seite.evaluate(async (b: any) => {
  await new Promise(r => setTimeout(r, 300));
  const coll = Store.getCollection(b.coll);
  const view = Store.getView(coll.viewIds[0]);
  const fuss = document.querySelector('.db-grenze') as HTMLElement | null;
  return {
    gesamt: Store.rowsOf(b.coll).length,
    gezeigt: Datenbank.zeilen(coll, view).length,
    fussDa: !!fuss,
    fussText: (fuss?.textContent || '').trim(),
    knoepfe: [...(fuss?.querySelectorAll('button') || [])].map(x => x.textContent)
  };
}, bau);

gleich('Zweitausend Zeilen liegen da', grenze.gesamt, 2000);
gleich('Fünfzig davon werden gezeigt', grenze.gezeigt, 50);
p('Und darunter steht, dass es mehr sind', grenze.fussDa);
p('Mit beiden Zahlen', /50 von 2000 Zeilen/.test(grenze.fussText), grenze.fussText);
gleich('Und zwei Wegen heraus', grenze.knoepfe, ['Mehr laden', 'Alle zeigen']);

console.log('\n3a · Und die Wege führen wirklich hinaus');
/* MIT WÄCHTER. Fehlt der Hinweis — die Gegenprobe tut genau das —, soll
   die Suite ROT werden und nicht abstürzen: ein Absturz mitten im vollen
   Lauf ist schwerer zu lesen als ein roter Punkt. */
const mehr = await seite.evaluate(async () => {
  const knopf = document.querySelector('.db-grenze [data-a="mehr"]') as HTMLElement | null;
  if (!knopf) return { text: '(kein Hinweis)', zeilen: 0 };
  knopf.click();
  await new Promise(r => setTimeout(r, 900));
  const fuss = document.querySelector('.db-grenze');
  return { text: (fuss?.textContent || '').trim(),
           zeilen: document.querySelectorAll('[data-rid]').length };
});
p('„Mehr laden" zeigt hundert statt fünfzig', /100 von 2000/.test(mehr.text), mehr.text);

const alle = await seite.evaluate(async (b: any) => {
  const knopf = document.querySelector('.db-grenze [data-a="alle"]') as HTMLElement | null;
  const coll0 = Store.getCollection(b.coll);
  if (!knopf) return { fussWeg: false, gezeigt: -1, limit: Store.getView(coll0.viewIds[0]).limit };
  knopf.click();
  await new Promise(r => setTimeout(r, 2500));
  const coll = Store.getCollection(b.coll);
  const view = Store.getView(coll.viewIds[0]);
  return { fussWeg: !document.querySelector('.db-grenze'),
           gezeigt: Datenbank.zeilen(coll, view).length, limit: view.limit };
}, bau);
gleich('„Alle zeigen" zeigt wirklich alle', alle.gezeigt, 2000);
p('Und der Hinweis ist dann fort — er hätte nichts mehr zu sagen', alle.fussWeg);
gleich('Die Wahl bleibt an der Ansicht stehen', alle.limit, 0);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
