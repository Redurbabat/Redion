/* Suite 364 — Der Deckel eines handbeschriebenen Blattes (E374, L61 Rest)
 * ============================================================================
 * L61 endete mit einem einzigen offenen Fall: „ein leeres A4-Blatt, auf das
 * nur von Hand gezeichnet wurde, hat keine Datei. Sein Deckel bleibt weiss."
 * In einem Regal voller handgeschriebener Hefte sind das ALLE Deckel.
 *
 * Der Weg ist derselbe wie bei E313 und das ist der Punkt: nicht
 * mitschreiben, sondern zeigen, was schon da ist. Die Striche liegen im
 * Block; daraus einen Umriss zu rechnen kostet keine Datei, keine Migration
 * — und kann nicht veralten.
 *
 * §1 REIN: der Kern kennt weder Uhr noch Ablage noch DOM.
 * §2 RECHNEN: Massstab, Mitte, Ausdünnen — von Hand nachgerechnet.
 * §3 SICHERHEIT: eine Farbe aus fremden Daten kommt nicht ins Attribut (§19).
 * §4 WAS NICHT GEZEICHNET WIRD, und warum.
 * §5 LEER IST EIN ERGEBNIS: ohne Handschrift kommt nichts.
 * §6 AM ECHTEN REGAL: der Deckel zeigt die Schrift.
 * §7 UND DAS BILD GEHT WEITERHIN VOR (E313 bleibt unverändert).
 * §8 BAU-HYGIENE.
 *
 *   node pruefungen/lauf/test364.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Vorschau: any;
declare const Notebook: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9389;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const QUELLE = path.join(WURZEL, 'src/core/ink/thumbnail.ts');
const GEBAUT = path.join(WURZEL, 'quell/core/ink/thumbnail.js');
(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(GEBAUT, 'utf-8'));
const T = (globalThis as any).InkThumbnail;

console.log('\n1 · Rein: weder Uhr noch Ablage noch DOM');
const quelle = fs.readFileSync(QUELLE, 'utf-8');
const code = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
p('Der Kern ist geladen', !!T && typeof T.deckel === 'function');
gleich('Keine Uhr', ['new Date', 'Date.now', 'performance.'].filter(w => code.includes(w)), []);
gleich('Keine Ablage', ['Store.', 'getMeta', 'localStorage'].filter(w => code.includes(w)), []);
gleich('Kein DOM', ['document.', 'innerHTML', 'querySelector'].filter(w => code.includes(w)), []);

console.log('\n2 · Rechnen, von Hand nachgerechnet');

/* Ein Blatt 800 × 1000, ein Deckel 160 × 200: der Faktor ist 0,2 in beiden
   Richtungen, also keine Verschiebung. Ein Strich von (0,0) nach (800,1000)
   wird zu (0,0)–(160,200). */
const gerade = T.deckel([{ art: 'stift', pts: [[0, 0], [800, 1000]], farbe: '#111', breite: 5 }],
  { breite: 800, hoehe: 1000 }, { breite: 160, hoehe: 200 });
gleich('Ein Zug', gerade.zuege.length, 1);
gleich('Massstab und Pfad', gerade.zuege[0].d, 'M0 0 L160 200');
gleich('Die Breite wird mitskaliert', gerade.zuege[0].breite, 1);
gleich('Ein Stift ist deckend', gerade.zuege[0].deckkraft, 1);

/* Passt das Verhältnis nicht, wird MITTIG gesetzt statt gestaucht: ein
   Blatt 800 × 1000 in einem Deckel 400 × 200 nimmt Faktor 0,2 (die Höhe
   begrenzt) und bekommt links und rechts je 120 px Rand. */
const mittig = T.deckel([{ art: 'stift', pts: [[0, 0], [800, 1000]] }],
  { breite: 800, hoehe: 1000 }, { breite: 400, hoehe: 200 });
gleich('Mittig statt gestaucht', mittig.zuege[0].d, 'M120 0 L280 200');

const marker = T.deckel([{ art: 'marker', pts: [[0, 0], [10, 10]] }],
  { breite: 100, hoehe: 100 }, { breite: 100, hoehe: 100 });
p('Ein Marker scheint durch', marker.zuege[0].deckkraft < 1);

/* Ein Strich mit 900 Punkten wird auf 160 px zu einer Linie mit 900
   identischen Koordinaten — das kostet nur Speicher im DOM. */
const viele = Array.from({ length: 900 }, (_, i) => [i, i]);
gleich('Ausgedünnt auf höchstens 40 Punkte', T.ausduennen(viele, 40).length, 40);
gleich('Der letzte Punkt bleibt der letzte', T.ausduennen(viele, 40)[39], [899, 899]);
gleich('Kurze Züge bleiben ganz', T.ausduennen([[0, 0], [1, 1]], 40).length, 2);
p('Ein Strich unter der Sichtbarkeit wird angehoben',
  T.deckel([{ art: 'stift', pts: [[0, 0], [9, 9]], breite: 0.1 }],
    { breite: 1000, hoehe: 1000 }, { breite: 10, hoehe: 10 }).zuege[0].breite >= T.MIN_BREITE);

console.log('\n3 · Sicherheit: eine Farbe aus fremden Daten (§19)');

gleich('Ein Farbwert bleibt', T.farbeSicher('#a1b2c3'), '#a1b2c3');
gleich('Kurzform auch', T.farbeSicher('#abc'), '#abc');
gleich('rgb auch', T.farbeSicher('rgb(1, 2, 3)'), 'rgb(1, 2, 3)');
gleich('Ein Name auch', T.farbeSicher('cornflowerblue'), 'cornflowerblue');
const boese = ['url(#x)', 'javascript:alert(1)', '"/><script>x</script>',
               'red;fill:url(#y)', '#12', 'expression(1)', '', null, 42];
gleich('Und alles andere fällt auf die Vorgabe',
  boese.map(w => T.farbeSicher(w)), boese.map(() => '#1a1a1a'));
p('Auch mitten in einer Marke',
  T.deckel([{ art: 'stift', pts: [[0, 0], [1, 1]], farbe: '"/><script>' }],
    { breite: 10, hoehe: 10 }, { breite: 10, hoehe: 10 }).zuege[0].farbe === '#1a1a1a');

console.log('\n4 · Was nicht gezeichnet wird, und warum');

const gemischt = T.deckel([
  { art: 'stift', pts: [[0, 0], [5, 5]] },
  { art: 'bild', pts: [[0, 0], [5, 5]], dateiId: 'x' },   /* hat seine Datei (E313) */
  { art: 'text', pts: [[0, 0], [5, 5]], text: 'Hallo' },  /* wäre ein graues Klötzchen */
  { art: 'zettel', pts: [[0, 0], [5, 5]] },
  { art: 'stift', pts: [[1, 1]] },                        /* ein Punkt ist kein Zug */
  { art: 'stift' },                                       /* gar keine Punkte */
], { breite: 10, hoehe: 10 }, { breite: 10, hoehe: 10 });
gleich('Nur der eine echte Zug', gemischt.zuege.length, 1);
gleich('Alle sechs gezählt', gemischt.marken, 6);
gleich('Fünf ausgelassen', gemischt.ausgelassen, 5);
p('Über der Marken-Decke wird abgeschnitten, aber gezählt',
  (() => {
    const d = T.deckel(Array.from({ length: T.MAX_MARKEN + 30 },
      () => ({ art: 'stift', pts: [[0, 0], [1, 1]] })), { breite: 10, hoehe: 10 }, { breite: 10, hoehe: 10 });
    return d.zuege.length === T.MAX_MARKEN && d.ausgelassen === 30;
  })());

console.log('\n5 · Leer ist ein Ergebnis');

p('Ohne Marken kein Inhalt', !T.hatInhalt(T.deckel([], { breite: 1, hoehe: 1 }, { breite: 1, hoehe: 1 })));
p('Mit lauter Bildern auch nicht',
  !T.hatInhalt(T.deckel([{ art: 'bild', pts: [[0, 0], [1, 1]] }],
    { breite: 1, hoehe: 1 }, { breite: 1, hoehe: 1 })));
p('Und Unsinn statt einer Liste stürzt nicht ab',
  T.deckel(null, { breite: 1, hoehe: 1 }, { breite: 1, hoehe: 1 }).zuege.length === 0 &&
  T.deckel('nein' as any, null as any, null as any).zuege.length === 0);

/* ========================================================================= */
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
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof (window as any).Vorschau !== 'undefined' &&
  typeof (window as any).Notebook !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1100);

console.log('\n6 · Am echten Regal: der Deckel zeigt die Schrift');

const ids = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  /* Ein Heft mit einem beschriebenen Blatt — genau Redurs Fall. */
  const heft = Store.addPage(null, { text: 'Physik-Mitschrift' });
  const blatt = Store.addBlock(heft.id, 'blatt', { text: '', papier: 'kariert',
    blattBreite: 794, blattHoehe: 1123 });
  const zug = (x: number, y: number) => ({ id: 'm' + x + y, art: 'stift', farbe: '#1a5fb4',
    breite: 3, pts: Array.from({ length: 12 }, (_, i) => [x + i * 12, y + Math.sin(i) * 18]) });
  Store.updateBlock(blatt.id, { marken: [zug(80, 200), zug(80, 300), zug(80, 400)] });
  /* Und eines ohne alles — sein Deckel darf nichts bekommen. */
  const leer = Store.addPage(null, { text: 'Noch nichts drauf' });
  Store.addBlock(leer.id, 'blatt', { text: '', papier: 'blanko' });
  return { heft: heft.id, leer: leer.id, blatt: blatt.id };
});

const svgs = await seite.evaluate((x: any) => ({
  mit: Vorschau.tinteSvg(x.heft),
  ohne: Vorschau.tinteSvg(x.leer),
  block: Vorschau.tinteBlock(x.heft) ? Vorschau.tinteBlock(x.heft).id : null,
}), ids);
gleich('Der Block mit Handschrift wird gefunden', svgs.block, ids.blatt);
p('Es kommt ein SVG heraus', svgs.mit.startsWith('<svg') && svgs.mit.includes('<path'));
gleich('Drei Züge, drei Pfade', (svgs.mit.match(/<path /g) || []).length, 3);
p('Die Farbe steht drin', svgs.mit.includes('#1a5fb4'));
gleich('Und ohne Handschrift kommt nichts', svgs.ohne, '');

await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(700);
const imRegal = await seite.evaluate((x: any) => {
  const karte = document.querySelector('.bib-deckel[data-id="' + x.heft + '"]');
  const leer = document.querySelector('.bib-deckel[data-id="' + x.leer + '"]');
  return {
    hatTinte: !!karte?.querySelector('.vs-tinte'),
    pfade: karte ? karte.querySelectorAll('.vs-tinte path').length : -1,
    leerHatTinte: !!leer?.querySelector('.vs-tinte'),
    /* Ein SVG, das da ist, aber 0 px misst, ist kein Deckel. */
    breite: karte?.querySelector('.vs-tinte')
      ? Math.round((karte.querySelector('.vs-tinte') as Element).getBoundingClientRect().width) : 0,
  };
}, ids);
p('Der Deckel im Regal trägt die Handschrift', imRegal.hatTinte);
gleich('Mit allen drei Zügen', imRegal.pfade, 3);
p('Und sie ist wirklich zu sehen, nicht 0 px breit', imRegal.breite > 40,
  imRegal.breite + ' px');
p('Das leere Blatt bekommt nichts', !imRegal.leerHatTinte);

/* MIT AUGEN GEFUNDEN, DANN GEMESSEN (§55). Das erste Bild zeigte eine
   Handschrift in #1a1a1a auf einem Deckel in `--bg-card` — im Dunkelmodus
   schwarz auf schwarz. Sichtbar waren nur die blaue Kurve und das rote
   Rechteck, also genau das, was ein Mensch NICHT als Handschrift schreibt.
   Und der erste Versuch, das zu beheben, tat gar nichts: die Regel stand
   mit zwei Stufen gegen die drei von `.bib-deckel[data-art="blatt"] …`.
   Deshalb wird hier die gerechnete Farbe gemessen, nicht das Vorhandensein
   einer Klasse. */
const grund = await seite.evaluate((x: any) => {
  const blatt = document.querySelector('.bib-deckel[data-id="' + x.heft + '"] .bib-deckel-blatt');
  if (!blatt) return null;
  const f = getComputedStyle(blatt).backgroundColor;
  const zahlen = (f.match(/\d+/g) || []).slice(0, 3).map(Number);
  /* Helligkeit nach der üblichen Gewichtung. Papier ist hell, egal in
     welchem Modus. */
  const hell = zahlen.length === 3
    ? (0.2126 * zahlen[0]! + 0.7152 * zahlen[1]! + 0.0722 * zahlen[2]!) / 255 : -1;
  return { farbe: f, hell: Math.round(hell * 100) / 100,
           klasse: blatt.classList.contains('hat-tinte') };
}, ids);
p('Der Deckel mit Handschrift ist als solcher markiert', grund?.klasse === true);
p('Und sein Grund ist hell wie Papier, auch im Dunkelmodus',
  (grund?.hell ?? 0) > 0.8, JSON.stringify(grund));

/* AUCH DAS BILD HAT ES GEZEIGT: der Verlauf am unteren Rand lief gegen
   `--bg-card` und sah auf weissem Papier nicht nach Auslauf aus, sondern
   nach Schmutz. Er ist für Bilder längst abgeschaltet (E313) — für eine
   Handschrift gilt derselbe Grund. */
gleich('Kein Verlauf über der Handschrift',
  await seite.evaluate((x: any) => {
    const b = document.querySelector('.bib-deckel[data-id="' + x.heft + '"] .bib-deckel-blatt');
    return b ? getComputedStyle(b, '::after').display : 'kein Deckel';
  }, ids), 'none');
/* EIN GESPERRTES HEFT ZEIGT SEINE SCHRIFT NICHT (§26). Wer es sperrt,
   will nicht, dass man von aussen liest, was darin steht — ein Deckel mit
   lesbarer Handschrift wäre genau das. */
const gesperrt = await seite.evaluate(() => {
  /*  gehört dazu: ein gesperrtes Heft zählt nur mit dieser
     Marke als Heft — genau der Fall, den E364 repariert hat. */
  const q = Store.addPage(null, { text: 'Tagebuch', heftArt: 'heft',
    locked: { salz: 'x', iv: 'y', daten: 'z', zeit: Store.now() } });
  const bl = Store.addBlock(q.id, 'blatt', { text: '', papier: 'liniert',
    blattBreite: 794, blattHoehe: 1123 });
  Store.updateBlock(bl.id, { marken: [{ art: 'stift', farbe: '#111', breite: 3,
    pts: Array.from({ length: 20 }, (_, i) => [100 + i * 20, 300]) }] });
  (window as any).Notebook.oeffnen();
  return q.id;
});
await seite.waitForTimeout(700);
const heimlich = await seite.evaluate((id: string) => {
  const k = document.querySelector('.bib-deckel[data-id="' + id + '"]');
  return { da: !!k, tinte: !!k?.querySelector('.vs-tinte'),
           schloss: !!k?.querySelector('.nh-schloss') };
}, gesperrt);
p('Das gesperrte Heft steht im Regal', heimlich.da);
p('Aber ohne seine Handschrift (§26)', !heimlich.tinte);
p('Es zeigt sein Schloss', heimlich.schloss);

gleich('Über einem leeren Deckel bleibt er',
  await seite.evaluate((x: any) => {
    const b = document.querySelector('.bib-deckel[data-id="' + x.leer + '"] .bib-deckel-blatt');
    return b ? getComputedStyle(b, '::after').display : 'kein Deckel';
  }, ids), 'block');

console.log('\n7 · Das Bild geht weiterhin vor (E313 unverändert)');

const mitBild = await seite.evaluate(async () => {
  const heft = Store.addPage(null, { text: 'Skript mit Seite' });
  const s = Store.addBlock(heft.id, 'pdfseite', { text: '', bildDateiId: 'irgendeine',
    blattBreite: 794, blattHoehe: 1123 });
  Store.updateBlock(s.id, { marken: [{ art: 'stift', pts: [[10, 10], [90, 90]] }] });
  return { id: heft.id, datei: Vorschau.bildDatei(heft.id) };
});
gleich('Die Datei wird gefunden', mitBild.datei, 'irgendeine');
/* IN DIE BIBLIOTHEK, NICHT INS REGAL. Eine Seite mit PDF-Seiten zählt als
   PDF und lebt dort (L77 Punkt 3) — im Notizhefte-Regal steht sie gar
   nicht. Das ist keine Schwäche dieses Bogens, sondern die offene Hälfte
   von L114 Punkt 3. */
await seite.evaluate(() => (window as any).Bibliothek?.oeffne?.());
await seite.waitForTimeout(700);
const vorrang = await seite.evaluate((id: string) => {
  const k = document.querySelector('.bib-deckel[data-id="' + id + '"]');
  if (!k) return { da: false, bild: false, tinte: false };
  const blatt = k.querySelector('.bib-deckel-blatt');
  /* `bilderNachtragen` NIMMT DAS `img` WIEDER WEG, wenn die Datei nicht da
     ist (E313) — und die Kennung hier ist erfunden. Gefragt ist also
     nicht, ob das Bild ÜBERLEBT, sondern ob der Deckel den BILDWEG
     genommen hat: dann fehlt `is-leer`, denn die Textvorschau wurde nicht
     gebaut. */
  return { da: true, bildweg: !!blatt && !blatt.classList.contains('is-leer'),
           tinte: !!k.querySelector('.vs-tinte') };
}, mitBild.id);
p('Die Karte steht in der Bibliothek', vorrang.da);
p('Der Deckel nimmt den Bildweg, nicht die Handschrift', vorrang.bildweg);
p('Und NICHT die Handschrift daneben', !vorrang.tinte);

console.log('\n8 · Bau-Hygiene');

const js = fs.readFileSync(GEBAUT, 'utf-8');
const vs = fs.readFileSync(path.join(WURZEL, 'quell/kern/helfer/vorschau.js'), 'utf-8');
p('Das erzeugte thumbnail.js gibt es', js.includes('ERZEUGT') && js.includes('InkThumbnail'));
p('Die Schale escapt jeden Wert, obwohl der Kern schon prüft',
  /esc\(z\.farbe\)/.test(vs) && /esc\(z\.d\)/.test(vs));
p('Der Kern lässt nur echte Farben durch',
  /farbeSicher/.test(js) && /\[0-9a-fA-F\]\{6\}/.test(js));
p('Die Datei steht im Dienststock und in index.html',
  fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8').includes('core/ink/thumbnail.js') &&
  fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8').includes('core/ink/thumbnail.js'));
p('Der Stil kennt die Tinte auf dem Deckel',
  fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/notizhefte.css'), 'utf8')
    .includes('.vs-tinte'));
p('Die Einzeldatei kennt sie auch',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8').includes('InkThumbnail'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
