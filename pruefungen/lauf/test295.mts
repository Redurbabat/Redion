/* Suite 295 — Der Randstreifen: neben der Seite zeichnen (E301, L107)
 * ============================================================================
 * Redur hat es beim Auftrag zur Rolle mitgesagt: „ich sollte so neben das pdf
 * direk zeichnen können wie one note." Die Rolle kam mit E299, das Zeichnen
 * daneben nicht — L107 hielt fest, warum:
 *
 *     „Die Schicht zu verbreitern heisst, diesen Raum zu ändern — und damit
 *      läge jede schon gezeichnete Marke an einer anderen Stelle."
 *
 * DAS WAR EIN DENKFEHLER, und dieser Prüflauf ist sein Gegenbeweis. Der Satz
 * stimmt nur, wenn die Seite auf dem Bildschirm ihre Breite BEHÄLT und die
 * Box wächst — dann wird jede Einheit kleiner. Wächst die Box dagegen nur
 * nach RECHTS, während die Seite ihren Anteil an der Fläche behält, ändert
 * sich keine einzige gespeicherte Zahl.
 *
 *   §1 EINE ALTE MARKE LIEGT NACH DEM EINSCHALTEN AN DERSELBEN STELLE.
 *   §2 EIN STRICH DARF ÜBER DIE KANTE LAUFEN — und wird wiedergefunden.
 *   §3 GEGENPROBE: ohne Rand ist die Fläche genau so breit wie das Papier.
 *   §4 AM TELEFON steht der Rand UNTER der Seite, nicht daneben.
 *   §5 DER AUSDRUCK nimmt den Rand mit.
 *
 *   node pruefungen/lauf/test295.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9095;

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

const browser = await chromium.launch();
const fehler: string[] = [];

/* Eine Seite mit zwei PDF-Seiten, und auf der ersten steht schon ein Strich
   — genau die Lage, um die es geht: es gibt bereits Gezeichnetes, und das
   darf sich nicht bewegen. */
const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const s = Store.addPage(null, { text: 'Skript mit Rand', icon: '📕' });
  const ids = [];
  for (let nr = 1; nr <= 2; nr++) {
    const b = Store.addBlock(s.id, 'pdfseite', { text: '', nr, vonSeiten: 2,
      bw: 595, bh: 842, quelleId: 'q1' });
    ids.push(b.id);
  }
  /* Ein waagerechter Strich mitten auf der ersten Seite, bei x=100..300,
     y=400. In BLATTKOORDINATEN, so wie ihn die Zeichenschicht ablegt. */
  Store.updateBlock(ids[0], { marken: [
    { id: 'alt1', art: 'stroke', farbe: '#111', breite: 3,
      pts: [[100, 400], [300, 400]] }
  ]});
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1500));
  return { seite: s.id, erste: ids[0] };
})()`;

const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
const ids = await pc.evaluate(AUFBAU) as { seite: string; erste: string };
await pc.waitForSelector('.document-workspace', { timeout: 20000 });
await pc.waitForTimeout(600);

/** Wo liegt die alte Marke auf dem BILDSCHIRM, und wie breit ist was? */
const messe = () => pc.evaluate(() => {
  const flaeche = document.querySelector<SVGSVGElement>('.blatt-marken');
  const papier = document.querySelector<HTMLElement>('.blatt-papier');
  const flur = document.querySelector<HTMLElement>('.blatt-flur');
  const strich = flaeche?.querySelector<SVGElement>('[data-sid="alt1"], path, polyline');
  const sr = strich?.getBoundingClientRect();
  const fr = flaeche?.getBoundingClientRect();
  const pr = papier?.getBoundingClientRect();
  return {
    box: flaeche?.getAttribute('viewBox') || '',
    flurDa: !!flur,
    flaeche: fr ? [Math.round(fr.left), Math.round(fr.right), Math.round(fr.width)] : null,
    papier: pr ? [Math.round(pr.left), Math.round(pr.right), Math.round(pr.width)] : null,
    strich: sr ? [Math.round(sr.left), Math.round(sr.right), Math.round(sr.top)] : null,
    /* WO DER STRICH AUF DER SEITE LIEGT, als Anteil der Seitenbreite. Das
       ist die Zahl, die gleich bleiben MUSS — nicht die Bildschirmzahl. */
    anteil: (sr && pr && pr.width > 0)
      ? [Number(((sr.left - pr.left) / pr.width).toFixed(4)),
         Number(((sr.right - pr.left) / pr.width).toFixed(4))] : null,
    randfeld: !!document.querySelector('.blatt-randfeld'),
    kante: !!flaeche?.querySelector('.blatt-randkante')
  };
});

/* ==========================================================================
 * §1 · Die alte Marke bleibt, wo sie ist
 * ========================================================================*/
console.log('\n1 · Die alte Marke bleibt, wo sie ist');

const ohne = await messe();
p('Ohne Rand gibt es keinen Flur', !ohne.flurDa && !ohne.randfeld);
p('Und die Box ist so breit wie die Seite', ohne.box === '0 0 595 842', ohne.box);
p('Der alte Strich ist zu sehen', !!ohne.strich, JSON.stringify(ohne.strich));
p('Die Fläche liegt genau über dem Papier',
  !!ohne.flaeche && !!ohne.papier &&
  Math.abs(ohne.flaeche[2]! - ohne.papier[2]!) <= 1,
  `${JSON.stringify(ohne.flaeche)} vs ${JSON.stringify(ohne.papier)}`);

/* Und jetzt der Schalter. */
await pc.evaluate(() => {
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});
await pc.click('.document-topbar [data-document-action="rand"]');
await pc.waitForTimeout(1200);

const mit = await messe();
p('Mit Rand gibt es den Flur und das Randfeld', mit.flurDa && mit.randfeld);
p('Die Box ist breiter geworden', /^0 0 (86[0-9]|8[0-9][0-9]) 842$/.test(mit.box), mit.box);
p('Eine gestrichelte Kante steht zwischen Seite und Rand', mit.kante);
p('Das Papier ist SCHMALER als die Fläche',
  !!mit.flaeche && !!mit.papier && mit.papier[2]! < mit.flaeche[2]! - 100,
  `${JSON.stringify(mit.papier)} vs ${JSON.stringify(mit.flaeche)}`);

/* DAS IST DER PUNKT DIESES LAUFS — und der erste Entwurf hat ihn falsch
   gestellt. Er mass die BILDSCHIRMPOSITION und war rot: ohne Rand lag der
   Strich bei 308..753, mit Rand bei 238..545.

   Nachgemessen, warum: das Fenster wird nicht breiter, wenn ein Rand
   dazukommt. Also rückt nicht der Rand nach draussen, sondern die Seite wird
   kleiner — genau wie in GoodNotes und OneNote, und genau wie beim
   Herauszoomen. Die Alternative wäre gewesen, die Seite gross zu lassen und
   den Rand aus dem Fenster ragen zu lassen; dann müsste man zum Schreiben
   erst waagerecht rollen, und das will niemand.

   Was dabei NICHT passieren darf — und das ist die Frage aus L107 —, ist,
   dass eine Marke ihre Stelle AUF DER SEITE wechselt. Gemessen wird deshalb
   der Anteil an der Seitenbreite, und der muss auf drei Stellen gleich
   bleiben. Rot werden kann er trotzdem: würde die Box wachsen, ohne dass die
   Seite ihren Anteil bekommt, verschöbe sich genau diese Zahl. */
p('UND DER ALTE STRICH LIEGT AN DERSELBEN STELLE AUF DER SEITE',
  !!ohne.anteil && !!mit.anteil &&
  Math.abs(ohne.anteil[0]! - mit.anteil[0]!) < 0.005 &&
  Math.abs(ohne.anteil[1]! - mit.anteil[1]!) < 0.005,
  `ohne ${JSON.stringify(ohne.anteil)}, mit ${JSON.stringify(mit.anteil)}`);
p('Und die Seite wird dafür kleiner statt aus dem Fenster zu wachsen',
  !!ohne.papier && !!mit.papier && mit.papier[2]! < ohne.papier[2]! &&
  mit.flaeche![1]! <= 1441,
  `Seite ${ohne.papier?.[2]} → ${mit.papier?.[2]}, Fläche endet bei ${mit.flaeche?.[1]}`);

/* ==========================================================================
 * §2 · Ein Strich darf über die Kante laufen
 * ========================================================================*/
console.log('\n2 · Ein Strich darf über die Kante laufen');

const drueber = await pc.evaluate(async (id: string) => {
  const b = Store.getBlock(id);
  const marken = (b.marken || []).concat([
    { id: 'quer1', art: 'stroke', farbe: '#c00', breite: 3,
      pts: [[500, 200], [700, 200]] }
  ]);
  Store.updateBlock(id, { marken });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 900));
  const nach = Store.getBlock(id);
  const q = (nach.marken || []).find((m: any) => m.id === 'quer1');
  return { gespeichert: !!q, punkte: q?.pts,
           gezeichnet: !!document.querySelector('.blatt-marken')?.children.length };
}, ids.erste);
p('Der Strich über die Kante wird gespeichert', drueber.gespeichert);
p('Und seine Punkte bleiben, wie sie sind',
  JSON.stringify(drueber.punkte) === JSON.stringify([[500, 200], [700, 200]]),
  JSON.stringify(drueber.punkte));
p('Die Fläche zeichnet ihn', drueber.gezeichnet);

/* ==========================================================================
 * §3 · GEGENPROBE: ausschalten stellt alles zurück
 * ========================================================================*/
console.log('\n3 · Gegenprobe — ausschalten stellt alles zurück');

await pc.click('.document-topbar [data-document-action="rand"]');
await pc.waitForTimeout(1200);
const wieder = await messe();
p('Kein Flur mehr', !wieder.flurDa && !wieder.randfeld);
p('Die Box ist wieder so breit wie die Seite', wieder.box === '0 0 595 842', wieder.box);
p('Und der alte Strich liegt wieder genau dort, wo er angefangen hat',
  !!wieder.strich && !!ohne.strich &&
  Math.abs(wieder.strich[0]! - ohne.strich[0]!) <= 4 &&
  Math.abs(wieder.strich[1]! - ohne.strich[1]!) <= 4,
  `${JSON.stringify(wieder.strich)} vs ${JSON.stringify(ohne.strich)}`);

/* ==========================================================================
 * §4 · Am Telefon steht der Rand unter der Seite
 * ========================================================================*/
console.log('\n4 · Am Telefon wird gerollt, nicht gestaucht');

const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(3200);
await handy.evaluate(AUFBAU);
await handy.waitForSelector('.document-workspace', { timeout: 20000 });
await handy.evaluate(() => {
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
});

const messeHandy = () => handy.evaluate(() => {
  const flaeche = document.querySelector<SVGSVGElement>('.blatt-marken');
  const papier = document.querySelector<HTMLElement>('.blatt-papier');
  const mitte = document.querySelector<HTMLElement>('.document-center');
  const strich = flaeche?.querySelector<SVGElement>('path, polyline');
  const sr = strich?.getBoundingClientRect();
  const pr = papier?.getBoundingClientRect();
  const fr = flaeche?.getBoundingClientRect();
  return {
    papierBreit: Math.round(pr?.width || 0),
    flaecheBreit: Math.round(fr?.width || 0),
    rollbar: mitte ? mitte.scrollWidth > mitte.clientWidth + 4 : false,
    xRoll: mitte ? getComputedStyle(mitte).overflowX : '',
    anteil: (sr && pr && pr.width > 0)
      ? [Number(((sr.left - pr.left) / pr.width).toFixed(4)),
         Number(((sr.right - pr.left) / pr.width).toFixed(4))] : null,
    randfeld: !!document.querySelector('.blatt-randfeld')
  };
});

const hOhne = await messeHandy();
await handy.click('.document-topbar [data-document-action="rand"]');
await handy.waitForTimeout(1400);
const hMit = await messeHandy();

p('Das Randfeld ist auch am Telefon da', hMit.randfeld);
/* DER FUND VOM BILD (§55.1). Der erste Entwurf stellte den Rand am Telefon
   UNTER die Seite. Die Kästen sassen dann richtig — der damalige Punkt „es
   steht unter der Seite" war GRÜN —, aber die Fläche darüber behielt ihre
   Box von 863x842 und wurde mit `preserveAspectRatio:none` über einen Kasten
   von Seitenbreite gezogen: alles Gezeichnete waagrecht gestaucht, die
   gestrichelte Kante mitten durch die Seite, ein Strich bei x=300 bei x=207.

   Kein Kasten-Mass hätte das gemeldet. Der Anteil an der Seitenbreite tut
   es: er war 0.34 statt 0.51. */
p('DIE SEITE BEHÄLT IHRE BREITE, statt für den Rand zu schrumpfen',
  hMit.papierBreit >= hOhne.papierBreit - 2,
  `${hOhne.papierBreit} → ${hMit.papierBreit}`);
p('UND EINE MARKE LIEGT AUF DER SEITE NOCH AN DERSELBEN STELLE',
  !!hOhne.anteil && !!hMit.anteil &&
  Math.abs(hOhne.anteil[0]! - hMit.anteil[0]!) < 0.005 &&
  Math.abs(hOhne.anteil[1]! - hMit.anteil[1]!) < 0.005,
  `ohne ${JSON.stringify(hOhne.anteil)}, mit ${JSON.stringify(hMit.anteil)}`);
p('Die Fläche ist breiter als die Seite', hMit.flaecheBreit > hMit.papierBreit + 100,
  `${hMit.papierBreit} vs ${hMit.flaecheBreit}`);
p('Und man kommt waagrecht dorthin',
  hMit.rollbar && /auto|scroll/.test(hMit.xRoll),
  `rollbar ${hMit.rollbar}, overflow-x ${hMit.xRoll}`);

/* ==========================================================================
 * §5 · Der Ausdruck nimmt den Rand mit
 * ========================================================================*/
console.log('\n5 · Der Ausdruck nimmt den Rand mit');

const druck = await pc.evaluate(async (id: string) => {
  /* Rand wieder an, dann den Druckrahmen bauen lassen — ohne wirklich zu
     drucken: `drucken` schreibt in ein eigenes Fenster, das im Prüfstand
     nicht aufgeht. Gemessen wird der erzeugte Text. */
  const seite = Store.getBlock(id);
  Store.updateBlock(id, { randBreite: 0.45 });
  const roh = (window as any).Werkzeuge?.druckHtml
    ? await (window as any).Werkzeuge.druckHtml(Store.getBlock(id))
    : null;
  Store.updateBlock(id, { randBreite: seite.randBreite || 0 });
  return roh;
}, ids.seite);
if (typeof druck === 'string') {
  p('Der Druckrahmen weitet die Box',
    /viewBox="0 0 8[0-9][0-9] 842"/.test(druck), druck.slice(0, 200));
  p('Und macht das Bild schmaler', /mit-rand/.test(druck));
} else {
  /* Kein Zugriff auf den Rahmen zur Laufzeit — dann wird die Quelle
     gelesen. Schwächer, aber ehrlicher als ein übersprungener Punkt (§35). */
  const quelle = fs.readFileSync(
    path.join(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf8');
  p('Der Druckweg reicht die Randbreite durch',
    /markenAlsSvg\(b, bw, bh, randDruck\)/.test(quelle));
  p('Und macht das Bild schmaler', /mit-rand img\{width:var\(--seiten-anteil/.test(quelle));
}

/* ========================================================================== */
console.log('\n6 · Keine Fehler auf dem Weg');
p('Keine unbehandelten Ausnahmen', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} — Suite 295 (E301: Randstreifen)`);
process.exit(weg ? 1 : 0);
