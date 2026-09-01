/* Suite 339 — Der Schaltplan kommt in der .docx an (E347)
 * ============================================================================
 * E346 brachte die Bilder ins Word-Dokument. Der Schaltplan blieb draussen —
 * und zwar STILL: eine Seite mit einem Schaltplan ergab im Dokument
 * `|Elektro|Reihenschaltung|`, Seitentitel und Beschriftung. Die Zeichnung
 * war weg, kein Platzhalter sagte es. Für Redur, der Elektrotechnik lernt,
 * ist der Schaltplan das eigentliche Ergebnis; der Lehrer bekam ein leeres
 * Blatt.
 *
 * Redion zeichnet ihn schon, als SVG. Word hält kein SVG ohne PNG daneben.
 * Also wird gerastert — und beim Rastern lauern zwei Fallen, die nur das
 * Messen fand (beide in der ersten Fassung von E347 drin):
 *
 *   · Ein SVG ohne `xmlns` lädt in einem `<img>` gar nicht. Kein Bild,
 *     kein Medienteil, nur der Platzhalter „liess sich nicht zeichnen".
 *   · `stroke="var(--text)"` zeigt in einem eigenen Dokument ins Leere; die
 *     Leitungen werden `none`. Das Bild LÄDT — und ist ein weisses Blatt.
 *     Kein Fehler, kein Platzhalter, nur nichts. Der schlimmere Fall.
 *
 *   §1 DER SCHALTPLAN IST IM ARCHIV — Medienteil, Beziehung, Einbettung.
 *   §2 UND ER IST KEIN WEISSES BLATT. Pixel gezählt, nicht vermutet.
 *   §3 DAS MASS IST DAS LOGISCHE — gezeichnet mit doppelter Auflösung,
 *      eingesetzt in einfacher; ein grosser Plan wird auf die Spalte gestutzt.
 *   §4 OHNE PLAN EIN PLATZHALTER, der den Grund nennt — kein Medienteil.
 *   §5 DERSELBE WEG FÜR EIN SVG-BILD ohne `xmlns` und mit Variablen.
 *   §6 IM DUNKELMODUS BLEIBT ES SCHWARZ AUF WEISS. Die Bildschirmfarbe wäre
 *      auf dem weissen Blatt genauso unsichtbar wie `none`.
 *
 *   node pruefungen/lauf/test339.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9343;

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
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);
await pc.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
});

/**
 * Eine Seite mit Blöcken bauen, als Word ausgeben, das Archiv aufmachen —
 * und jeden Medienteil gleich VERMESSEN: Breite, Höhe, dunkle Pixel, die
 * Farbe der linken oberen Ecke. Ein Bild, das da ist, aber weiss, hätte
 * mit „Medienteil vorhanden" allein nichts bewiesen.
 *
 * `plan: 'leer'` legt einen leeren Plan an, `plan: 'reihe'` eine Quelle,
 * einen Widerstand und eine Leitung dazwischen — mit den Anschlusspunkten,
 * die Redions Zeichner selbst kennt, so wie `elektro/skizzen.ts` es tut.
 */
const wordAus = (bloecke: any[]) => pc.evaluate(async (bl: any[]) => {
  const w = globalThis as any;
  const seite = Store.addPage(null, { text: 'Elektro' });
  const bauePlan = (art: string, breite?: number, hoehe?: number) => {
    const plan = w.Schaltplan.neuerPlan('stromlauf-aufgeloest');
    if (breite) plan.breite = breite;
    if (hoehe) plan.hoehe = hoehe;
    if (art === 'leer') return plan;
    const teil = (id: string, zeichen: string, bmk: string, x: number, y: number) => ({
      id, zeichen, x, y, drehung: 0, gespiegelt: false, bmk, nummern: {}, gruppe: '', ebene: 'plan'
    });
    const g = teil('t1', 'gleichspannung', 'G', 40, 60);
    const r = teil('t2', 'widerstand', 'R1', 210, 60);
    plan.teile.push(g, r);
    const an = (t: any, nr: string) => {
      const a = (w.Schaltplan.anschluesseVon(t) as any[]).find((x: any) => String(x.nr) === nr);
      return a ? { x: a.x, y: a.y } : { x: t.x, y: t.y };
    };
    plan.leitungen.push({
      id: 'l1', ebene: 'plan',
      punkte: [an(g, '1'), { x: an(g, '1').x, y: 150 }, { x: an(r, '1').x, y: 150 }, an(r, '1')],
      vonTeil: 't1', vonNr: '1', nachTeil: 't2', nachNr: '1'
    });
    return plan;
  };
  for (const b of bl) {
    const neu = Store.addBlock(seite.id, b.type, { text: b.text || '' });
    const zusatz: Record<string, unknown> = {};
    if (b.plan) zusatz.plan = bauePlan(b.plan, b.breite, b.hoehe);
    if (b.src) zusatz.src = b.src;
    if (b.caption) zusatz.caption = b.caption;
    if (Object.keys(zusatz).length) Store.updateBlock(neu.id, zusatz);
  }
  const blob = await w.Austausch.alsWord(Store.getBlock(seite.id));
  const zip = await w.Einlesen.zipLesen(await blob.arrayBuffer());
  const medien: Record<string, { breite: number; hoehe: number; dunkel: number; ecke: number[] }> = {};
  for (const n of zip.namen) {
    if (!/^word\/media\//.test(n)) continue;
    const bytes = await zip.holen(n);
    const bm = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const c = document.createElement('canvas');
    c.width = bm.width; c.height = bm.height;
    const g2 = c.getContext('2d')!;
    g2.drawImage(bm, 0, 0);
    const d = g2.getImageData(0, 0, c.width, c.height).data;
    let dunkel = 0;
    for (let i = 0; i < d.length; i += 4)
      if ((d[i] as number) < 128 && (d[i + 1] as number) < 128 && (d[i + 2] as number) < 128) dunkel++;
    medien[n] = { breite: bm.width, hoehe: bm.height, dunkel,
                  ecke: [d[0] as number, d[1] as number, d[2] as number, d[3] as number] };
  }
  return {
    namen: zip.namen.slice().sort(),
    doc: await zip.text('word/document.xml'),
    rels: await zip.text('word/_rels/document.xml.rels'),
    typen: await zip.text('[Content_Types].xml'),
    medien
  };
}, bloecke);

/* ========================================================================
 * 1 · Der Schaltplan ist im Archiv
 * ======================================================================*/
console.log('\n1 · Medienteil, Beziehung, Einbettung');

const r1 = await wordAus([
  { type: 'text', text: 'Vor dem Plan' },
  { type: 'schaltplan', text: 'Reihenschaltung', plan: 'reihe', breite: 400, hoehe: 200 },
  { type: 'text', text: 'Nach dem Plan' }
]);
gleich('Genau ein Medienteil, und es ist ein PNG', Object.keys(r1.medien), ['word/media/bild1.png']);
const relId = (/Id="(rIdBild\d+)"[^>]*Target="media\/bild1\.png"/.exec(r1.rels || '') || [])[1];
p('Es gibt eine Beziehung auf `media/bild1.png`', !!relId, String(r1.rels).slice(0, 300));
p('Und das Dokument bettet genau diese ein',
  !!relId && new RegExp('r:embed="' + relId + '"').test(r1.doc || ''),
  (/<a:blip[^>]*>/.exec(r1.doc || '') || [''])[0]);
p('Kein Platzhalter für den Schaltplan', !/\[Schaltplan/.test(r1.doc || ''),
  (/\[Schaltplan[^\]]*\]/.exec(r1.doc || '') || [''])[0]);
p('Die Beschriftung steht als Zeile darunter', /Reihenschaltung/.test(r1.doc || ''));
p('Der Text davor und danach steht noch da',
  /Vor dem Plan/.test(r1.doc || '') && /Nach dem Plan/.test(r1.doc || ''));
gleich('Content-Types kennt png genau einmal',
  (String(r1.typen).match(/<Default Extension="png"/g) || []).length, 1);

/* ========================================================================
 * 2 · Und er ist kein weisses Blatt
 *
 * DER ABSCHNITT, DER DIE ZWEITE FALLE FÄNGT. Ohne die Auflösung von
 * `var(--text)` lädt das SVG, der Medienteil ist da, die Beziehung stimmt —
 * und §1 wäre rundum grün über einem leeren weissen Rechteck.
 * ======================================================================*/
console.log('\n2 · Pixel gezählt: Leitungen und Bauteile sind zu sehen');

const bild1 = r1.medien['word/media/bild1.png'];
p('Das Bild trägt dunkle Pixel — mehr als ein Strich',
  !!bild1 && bild1.dunkel > 1000, bild1 ? String(bild1.dunkel) : 'kein Bild');
p('Aber nicht flächig — es ist eine Zeichnung, keine schwarze Fläche',
  !!bild1 && bild1.dunkel < bild1.breite * bild1.hoehe * 0.2,
  bild1 ? `${bild1.dunkel} von ${bild1.breite * bild1.hoehe}` : '');
p('Die Ecke ist weiss und deckend — der Grund ist gefüllt, nicht durchsichtig',
  !!bild1 && JSON.stringify(bild1.ecke) === '[255,255,255,255]',
  bild1 ? JSON.stringify(bild1.ecke) : '');

/* ========================================================================
 * 3 · Das Mass ist das logische
 * ======================================================================*/
console.log('\n3 · Gezeichnet doppelt, eingesetzt einfach');

gleich('Gerastert mit doppelter Auflösung: 400 × 200 wird 800 × 400',
  bild1 ? [bild1.breite, bild1.hoehe] : null, [800, 400]);
const m1 = /<wp:extent cx="(\d+)" cy="(\d+)"\/>/.exec(String(r1.doc));
p('Das Bild trägt ein Mass', !!m1);
if (m1) {
  gleich('Eingesetzt wird die LOGISCHE Breite: 400 px = 3810000 EMU', Number(m1[1]), 400 * 9525);
  gleich('Und die logische Höhe: 200 px = 1905000 EMU', Number(m1[2]), 200 * 9525);
}

/* Ein Plan in Vorgabegrösse (800 × 700) ist breiter als die Textspalte. */
const r3 = await wordAus([{ type: 'schaltplan', text: 'Gross', plan: 'reihe' }]);
const m3 = /<wp:extent cx="(\d+)" cy="(\d+)"\/>/.exec(String(r3.doc));
p('Auch der grosse Plan trägt ein Mass', !!m3, String(r3.doc).slice(0, 200));
if (m3) {
  gleich('Er wird auf die Textbreite gestutzt', Number(m3[1]), 5715000);
  gleich('Und die Höhe folgt dem Verhältnis 700:800', Number(m3[2]), Math.round(5715000 * (700 / 800)));
}

/* ========================================================================
 * 4 · Ohne Plan ein Platzhalter, der den Grund nennt
 * ======================================================================*/
console.log('\n4 · Ein Schaltplan ohne Zeichnung sagt es');

const r4 = await wordAus([
  { type: 'schaltplan', text: 'Später' },
  { type: 'text', text: 'Sonst nichts' }
]);
gleich('Kein Medienteil', Object.keys(r4.medien).length, 0);
p('Und im Archiv steht nichts unter `word/media/`',
  !r4.namen.some((n: string) => /^word\/media\//.test(n)), JSON.stringify(r4.namen));
p('Der Platzhalter nennt den Grund',
  /\[Schaltplan: Später — noch nichts gezeichnet\]/.test(String(r4.doc)),
  (/\[Schaltplan[^\]]*\]/.exec(String(r4.doc)) || ['nichts gefunden'])[0]);
gleich('Keine Bild-Beziehung', (String(r4.rels).match(/rIdBild/g) || []).length, 0);

/* EIN LEERER PLAN ist etwas anderes als kein Plan: er hat ein Mass und
   zwei Stromschienen, also ein Bild. Dass er kommt, statt als „nichts
   gezeichnet" zu gelten, ist die ehrlichere Fassung — auf dem Blatt
   steht dann, was auf dem Bildschirm stand. */
const r4b = await wordAus([{ type: 'schaltplan', text: 'Leer', plan: 'leer', breite: 300, hoehe: 150 }]);
gleich('Ein leerer Plan ergibt trotzdem ein Bild', Object.keys(r4b.medien), ['word/media/bild1.png']);

/* ========================================================================
 * 5 · Derselbe Weg für ein SVG-Bild
 *
 * Ein SVG, wie es aus einem Zeichenprogramm oder aus der Zwischenablage
 * kommt: ohne `xmlns`, mit Variablen. Beides muss dieselbe Herrichtung
 * bekommen wie der Schaltplan — es ist EIN Rasterer, nicht zwei.
 * ======================================================================*/
console.log('\n5 · Ein SVG-Bild ohne xmlns und mit Variablen');

const SVG_ROH = '<svg width="120" height="60" viewBox="0 0 120 60">' +
  '<rect x="10" y="10" width="100" height="40" fill="none" stroke="var(--text)" stroke-width="4"/>' +
  '<line x1="10" y1="30" x2="110" y2="30" stroke="var(--linie, #000)" stroke-width="4"/></svg>';
const r5 = await wordAus([
  { type: 'image', src: 'data:image/svg+xml,' + encodeURIComponent(SVG_ROH), caption: 'Rahmen' }
]);
gleich('Aus dem SVG wurde ein PNG', Object.keys(r5.medien), ['word/media/bild1.png']);
const bild5 = r5.medien['word/media/bild1.png'];
p('Und darauf ist etwas zu sehen', !!bild5 && bild5.dunkel > 200, bild5 ? String(bild5.dunkel) : '');
gleich('In doppelter Auflösung', bild5 ? [bild5.breite, bild5.hoehe] : null, [240, 120]);
p('Kein Platzhalter', !/\[Bild: Rahmen/.test(String(r5.doc)),
  (/\[Bild: Rahmen[^\]]*\]/.exec(String(r5.doc)) || [''])[0]);

/* ========================================================================
 * 6 · Im Dunkelmodus bleibt es schwarz auf weiss
 *
 * Hätte man `var(--text)` mit der Farbe des Bildschirms aufgelöst, wäre
 * das im Hellmodus richtig und im Dunkelmodus weiss auf weiss. Redions
 * Vorgabe IST der Dunkelmodus (`Store.getMeta('theme', 'dark')`) — dieser
 * Abschnitt misst beide Seiten, damit die Rechnung nicht vom Zufall
 * abhängt, welchen Modus der Prüflauf gerade vorfindet.
 * ======================================================================*/
console.log('\n6 · Hell und dunkel ergeben dasselbe Blatt');

const modus = async (was: string) => {
  await pc.evaluate((m: string) => { document.documentElement.dataset.theme = m; }, was);
  const r = await wordAus([{ type: 'schaltplan', text: 'Modus', plan: 'reihe', breite: 400, hoehe: 200 }]);
  return r.medien['word/media/bild1.png'];
};
const hell = await modus('light');
const dunkel = await modus('dark');
p('Hell: die Zeichnung ist da', !!hell && hell.dunkel > 1000, hell ? String(hell.dunkel) : '');
p('Dunkel: die Zeichnung ist genauso da', !!dunkel && dunkel.dunkel > 1000, dunkel ? String(dunkel.dunkel) : '');
gleich('Und es sind dieselben Pixel', dunkel && dunkel.dunkel, hell && hell.dunkel);
p('Beide auf weissem Grund',
  !!hell && !!dunkel && JSON.stringify(hell.ecke) === '[255,255,255,255]' &&
  JSON.stringify(dunkel.ecke) === '[255,255,255,255]');

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
