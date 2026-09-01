/* Suite 316 — Nur ein Tab arbeitet (L103 Punkt 4, E323)
 * ============================================================================
 * Die Pacht (E286) verhindert, dass zwei Tabs DENSELBEN Auftrag nehmen —
 * `Store.auftragNehmen` legt Lesen und Schreiben in eine Transaktion, und
 * IndexedDB serialisiert die. Sie verhindert NICHT, dass jeder von ihnen
 * einen anderen nimmt. Auf einem schwachen Gerät ist das doppelt so viel
 * Last wie nötig, und die Oberfläche ruckelt in beiden Tabs.
 *
 *   §1 EIN TAB ALLEIN arbeitet wie bisher — nichts wurde langsamer.
 *   §2 ZWEI TABS: die Arbeit verteilt sich, aber nie gleichzeitig.
 *   §3 DAS SCHLOSS WIRD JE TAKT GENOMMEN, nicht für immer gehalten.
 *   §4 OHNE `navigator.locks` bleibt alles wie bisher.
 *   §5 DIE PACHT GILT WEITER — zwei Tabs, ein Auftrag, einmal Arbeit.
 *
 * DER PRÜFSTEIN IST §3 UND §4. Ein Schloss, das für immer gehalten wird,
 * hat einen Ausfall, aus dem man ohne Neustart nicht herauskommt: wird es
 * nie erteilt, arbeitet nie wieder ein Tab. Und ein Browser ohne die API
 * darf keine Aufträge verlieren — doppelte Last ist unschön, ein
 * stillstehender Auftrag ist Datenverlust auf Raten.
 *
 *   node pruefungen/lauf/test316.mts
 * ==========================================================================*/
declare const Store: any; declare const Auftraege: any;
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9327;

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
/* EIN Kontext für beide Seiten — nur dann teilen sie sich Ursprung,
   IndexedDB und Schlossraum, also genau das, was zwei Tabs ausmacht. */
const ctx = await browser.newContext();
const fehler: string[] = [];
const auf = async (): Promise<Page> => {
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForTimeout(2200);
  return s;
};
const a = await auf();
const b = await auf();

/* ------------------------------------------------------------------------ */
/* WIE HIER GEMESSEN WIRD, und warum nicht anders.
 *
 * Der erste Anlauf rief `Auftraege.takten()` von Hand und zählte, wer
 * gearbeitet hat. Er mass überall null — und das Produkt hatte recht: die
 * App taktet SELBST alle vier Sekunden, dieser Takt nimmt dasselbe Schloss,
 * und der Aufruf von Hand verlor das Rennen. Vor diesem Bogen liefen beide,
 * weil es kein Schloss gab.
 *
 * Gemessen wird deshalb das ERGEBNIS: Aufträge anlegen, warten, und dann
 * fragen, ob jeder genau einmal lief und ob sich zwei Läufe aus
 * VERSCHIEDENEN Tabs zeitlich überschnitten haben. Das ist auch die
 * ehrlichere Frage — genau das passiert bei zwei offenen Tabs.
 * ---------------------------------------------------------------------- */

const ruestenQuelle = `async (a, h) => {
  globalThis.__lauf.push({ id: a.id, von: Date.now() });
  await new Promise(r => setTimeout(r, 160));
  globalThis.__lauf[globalThis.__lauf.length - 1].bis = Date.now();
  return { fertig: true };
}`;
const ruesten = async (s: Page) => s.evaluate((quelle: string) => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  (globalThis as any).__lauf = [];
  /* eslint-disable-next-line no-new-func */
  Auftraege.anmelden('probe', new Function('return ' + quelle)());
}, ruestenQuelle);

/** Warten, bis nichts mehr offen ist — oder aufgeben. */
const bisLeer = async (s: Page, sekunden = 40): Promise<number> => {
  for (let i = 0; i < sekunden * 4; i++) {
    const n = await s.evaluate(async () => (await Auftraege.offen()).length);
    if (n === 0) return 0;
    await new Promise(f => setTimeout(f, 250));
  }
  return await s.evaluate(async () => (await Auftraege.offen()).length);
};

console.log('\n1 · Ein Tab allein arbeitet wie bisher');

/* NICHTS DARF LANGSAMER GEWORDEN SEIN. Ohne Nachbarn ist das Schloss frei,
   und der eigene Takt bekommt es jedes Mal. */
await ruesten(a);
await b.evaluate(() => { (globalThis as any).__lauf = []; Auftraege.stopp(); });
await a.evaluate(async () => {
  await Auftraege.leeren();
  await Auftraege.anlegen('probe', {}, { schritte: 1 });
});
gleich('Der Auftrag ist durchgelaufen', await bisLeer(a), 0);
gleich('Genau ein Lauf', await a.evaluate(() => (globalThis as any).__lauf.length), 1);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Zwei Tabs arbeiten NIE GLEICHZEITIG');

/* HIER LAG DIE LÜCKE, und so wird sie gemessen: jeder Läufer schreibt auf,
   von wann bis wann er lief. Überschneiden sich zwei Zeitfenster aus
   VERSCHIEDENEN Tabs, war die Last doppelt.

   Die Messung KANN rot werden: ohne Schloss nähmen beide Tabs im selben
   Takt je einen der sechs Aufträge, und bei 160 ms Laufzeit überschnitten
   sich die Fenster fast sicher. */
await b.evaluate(() => { void Auftraege.start(); });
await ruesten(a); await ruesten(b);
await a.evaluate(async () => {
  await Auftraege.leeren();
  for (let i = 0; i < 6; i++) await Auftraege.anlegen('probe', {}, { schritte: 1 });
});
gleich('Alle sechs sind durchgelaufen', await bisLeer(a), 0);

const laeufe = await Promise.all([
  a.evaluate(() => (globalThis as any).__lauf),
  b.evaluate(() => (globalThis as any).__lauf)
]);
const alleLaeufe = [
  ...laeufe[0].map((x: any) => ({ ...x, tab: 'a' })),
  ...laeufe[1].map((x: any) => ({ ...x, tab: 'b' }))
].filter((x: any) => x.bis);

gleich('Sechs Aufträge, sechs Läufe', alleLaeufe.length, 6);
gleich('Und jeder genau einmal',
  new Set(alleLaeufe.map((x: any) => x.id)).size, 6);

const ueberlappt = alleLaeufe.filter((x: any) => alleLaeufe.some((y: any) =>
  x !== y && x.tab !== y.tab && x.von < y.bis && y.von < x.bis));
gleich('Kein Lauf aus Tab A überschneidet einen aus Tab B',
  ueberlappt.length, 0);

/* Beide Tabs haben etwas getan — sonst hätte einer nur zugesehen, und das
   Schloss wäre eine Anführerwahl, keine Abwechslung. */
p('Und beide Tabs kamen zum Zug',
  laeufe[0].length > 0 && laeufe[1].length > 0,
  `a=${laeufe[0].length} b=${laeufe[1].length}`);

/* ------------------------------------------------------------------------ */
console.log('\n2b · Und der Ausschluss, ERZWUNGEN statt abgewartet');

/* KANN §2 ÜBERHAUPT ROT WERDEN? GEMESSEN: NEIN.
 *
 * Mit ausgehängtem Schloss blieb §2 grün. Der Grund ist keine Nachsicht,
 * sondern Statistik: jeder Tab taktet für sich alle vier Sekunden, die
 * Phasen sind unabhängig, und zwei Fenster von 160 ms treffen sich fast
 * nie. Eine Prüfung, die nur bei Glück rot wird, ist keine Prüfung (L89).
 *
 * §2 bleibt trotzdem stehen — es misst, dass am Ende jeder Auftrag genau
 * einmal lief, und DAS kann rot werden. Für den Ausschluss selbst wird die
 * Gleichzeitigkeit hier ERZWUNGEN: beide Tabs greifen im selben Augenblick
 * nach demselben Schloss. Ohne Schloss laufen beide Rümpfe ineinander, mit
 * Schloss nie. */
const gleichzeitig = async (): Promise<any[]> => {
  const rumpf = `async () => {
    const von = Date.now();
    await new Promise(r => setTimeout(r, 260));
    globalThis.__gz.push({ von, bis: Date.now() });
    return true;
  }`;
  await Promise.all([a, b].map(s => s.evaluate(() => { (globalThis as any).__gz = []; })));
  for (let runde = 0; runde < 6; runde++) {
    await Promise.all([a, b].map(s => s.evaluate((q: string) =>
      /* eslint-disable-next-line no-new-func */
      Auftraege.nurEiner(new Function('return ' + q)()), rumpf)));
  }
  const roh = await Promise.all([
    a.evaluate(() => (globalThis as any).__gz),
    b.evaluate(() => (globalThis as any).__gz)
  ]);
  return [
    ...roh[0].map((x: any) => ({ ...x, tab: 'a' })),
    ...roh[1].map((x: any) => ({ ...x, tab: 'b' }))
  ];
};
const gz = await gleichzeitig();
p('Beide Tabs haben in den sechs Runden gearbeitet', gz.length >= 6,
  String(gz.length));
const gzUeberlappt = gz.filter((x: any) => gz.some((y: any) =>
  x !== y && x.tab !== y.tab && x.von < y.bis && y.von < x.bis));
gleich('Und trotz Gleichzeitigkeit überschneidet sich kein Rumpf',
  gzUeberlappt.length, 0);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Das Schloss wird je Takt genommen, nicht gehalten');

/* WÄRE ES EINE ANFÜHRERWAHL, hielte ein Tab es für immer — und ein
   fremder Halter käme nie mehr zum Zug. Gemessen wird genau das: ein
   Aussenstehender bekommt das Schloss zwischen zwei Takten. */
const zwischendurch = await a.evaluate(async () => {
  const l: any = (navigator as any).locks;
  if (!l) return 'keine API';
  let bekommen = false;
  await l.request(Auftraege.SCHLOSS, { ifAvailable: true }, (s: unknown) => {
    bekommen = !!s;
  });
  return bekommen ? 'frei' : 'belegt';
});
p('Zwischen zwei Takten ist das Schloss frei', zwischendurch === 'frei',
  String(zwischendurch));

const gehalten = await a.evaluate(async () => {
  const l: any = (navigator as any).locks;
  /* Wer hält gerade was? Leer heisst: niemand. */
  const stand = await l.query();
  return (stand.held || []).filter((h: any) => h.name === Auftraege.SCHLOSS).length;
});
gleich('Und niemand hält es dauerhaft', gehalten, 0);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Ohne `navigator.locks` bleibt alles wie bisher');

/* EIN BROWSER OHNE DIE API DARF KEINE AUFTRÄGE VERLIEREN. Doppelte Last
   ist unschön; ein Auftrag, der nie läuft, ist Datenverlust auf Raten. */
const ohne = await a.evaluate(async () => {
  /* `delete navigator.locks` tut NICHTS: `locks` ist ein Getter auf
     `Navigator.prototype`, kein eigenes Feld. Der erste Anlauf löschte ins
     Leere und mass danach den ganz normalen Weg. Verdeckt wird er
     stattdessen mit einem eigenen Feld auf der Instanz. */
  const wieder = () => { delete (navigator as any).locks; };
  try {
    Object.defineProperty(navigator, 'locks',
      { value: undefined, configurable: true });
    let gerufen = false;
    const erg = await Auftraege.nurEiner(async () => { gerufen = true; return true; });
    return { gerufen, erg, wirklichWeg: (navigator as any).locks === undefined };
  } finally { wieder(); }
});
p('Die API war für den Versuch wirklich weg', ohne.wirklichWeg === true);
p('Ohne die API wird trotzdem gearbeitet', ohne.gerufen === true && ohne.erg === true,
  JSON.stringify(ohne));
p('Die API ist danach wieder da', await a.evaluate(() => !!(navigator as any).locks));

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
