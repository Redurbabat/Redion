/* Suite 156 — Ein Ausdruck, der nicht in den Speicher passt (E117)
 * ============================================================================
 * `bilderSammeln` machte vor dem Drucken aus JEDEM Seitenbild eine
 * Daten-Adresse und behielt sie alle zugleich — ohne Obergrenze, ohne
 * Stückelung. Die Zeichenketten liegen dabei doppelt im Speicher: einmal in
 * der Karte, einmal im zusammengebauten HTML des Druckrahmens, und Base64
 * legt ein Drittel obendrauf.
 *
 * Bei 200 KB je Seite und achtzig Seiten sind das rund 43 MB, doppelt
 * gehalten. Bei fünfhundert Seiten ist es das Ende jedes Telefons. §36 sagt
 * dazu: „Große Dateien nicht vollständig in RAM laden."
 *
 * Eine Grenze allein wäre aber die falsche Hälfte der Antwort. Ein Ausdruck,
 * in dem stillschweigend die Hälfte der Seiten leer ist, sieht aus wie ein
 * vollständiger — und §35 sagt, eine bekannte Grenze ist besser als ein
 * stiller Fehler. Diese Suite prüft deshalb BEIDES: dass die Grenze greift,
 * und dass sie sich meldet.
 *
 *   node pruefungen/lauf/test190.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8944;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1300, height: 850 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · Drei Seiten, eine davon zu gross
 * --------------------------------------------------------------------------
 * Vierzig Megabyte wirklich anzulegen dauert im Prüflauf zu lange und misst
 * nichts Zusätzliches. Gemessen wird die ENTSCHEIDUNG, und die trifft der
 * Sammler anhand von `satz.groesse` — dem Feld, das beim Anmelden gesetzt
 * wird. Also wird ein Satz angemeldet, der 41 MB behauptet.
 *
 * Das ist keine Verkürzung der Probe: der Sammler liest genau dieses Feld
 * und rührt die Bytes gar nicht erst an, wenn es nicht passt. Genau das ist
 * ja der Sinn.
 * ========================================================================*/
console.log('\n1 · Drei Seiten, eine davon zu gross');

/* Ein winziges, gültiges PNG (1×1, durchsichtig). */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk' +
  'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const gebaut = await seite.evaluate(async (b64: string) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const s = Store.addPage(null, { text: 'Langes Skript' });

  const kleinesBild = async () => (await Dateien.ablegen(
    new File([bytes], 'seite.png', { type: 'image/png' }), { abgeleitet: true })).id;

  /* Seite 1: klein und echt. */
  const a = await kleinesBild();
  /* Seite 2: ein Satz, der 41 MB behauptet — mehr, als der Druck trägt. */
  const gross = await Dateien.anmelden({
    name: 'riesig.webp', groesse: 41 * 1024 * 1024, typ: 'image/webp' });
  /* Seite 3: wieder klein und echt — sie muss trotzdem mitkommen. */
  const c = await kleinesBild();

  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 1, bw: 595, bh: 842,
    quelleId: 'q', bildDateiId: a,
    marken: [{ id: 'm1', art: 'stift', farbe: '#d64545', breite: 2,
               pts: [[10, 10], [90, 90]] }] });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 2, bw: 595, bh: 842,
    quelleId: 'q', bildDateiId: gross.id,
    marken: [{ id: 'm2', art: 'stift', farbe: '#2f7ed8', breite: 3,
               pts: [[20, 20], [80, 80]] }] });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 3, bw: 595, bh: 842,
    quelleId: 'q', bildDateiId: c });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));

  /* Mitschreiben, was gemeldet wird. */
  const meldungen: string[] = [];
  const echt = UI.toast;
  (UI as any).toast = (t: unknown, d?: number) => { meldungen.push(String(t)); return echt(t, d); };
  await Werkzeuge.drucken(Store.getBlock(s.id));
  (UI as any).toast = echt;

  const rahmen = [...document.querySelectorAll('iframe')]
    .filter(f => (f as HTMLIFrameElement).style.position === 'fixed')
    .pop() as HTMLIFrameElement | undefined;
  const d = rahmen?.contentDocument;
  const antwort = {
    seiten: d?.querySelectorAll('.blatt-druck').length ?? -1,
    bilder: d?.querySelectorAll('.blatt-druck img').length ?? -1,
    fehlt: [...(d?.querySelectorAll('.blatt-druck .fehlt') || [])]
      .map(x => x.textContent || ''),
    striche: d?.querySelectorAll('.blatt-druck .marken [data-sid]').length ?? -1,
    meldungen,
    /* Und die Grösse des erzeugten HTML — sie ist der eigentliche Grund. */
    zeichen: d?.documentElement.outerHTML.length ?? -1,
  };
  rahmen?.remove();
  return antwort;
}, PNG.toString('base64'));

gleich('Alle drei Seiten stehen im Ausdruck', gebaut.seiten, 3);
gleich('Aber nur zwei tragen ein Bild', gebaut.bilder, 2);
gleich('Und eine sagt, warum sie keines hat', gebaut.fehlt.length, 1);
p('Sie nennt ihre Seitenzahl', /^Seite 2 —/.test(gebaut.fehlt[0] || ''),
  gebaut.fehlt[0]);
p('Und den Grund im Klartext',
  /zu gross/.test(gebaut.fehlt[0] || '') && /Abschnitten/.test(gebaut.fehlt[0] || ''),
  gebaut.fehlt[0]);
p('Nicht den falschen Grund',
  !/fehlt in diesem Bestand/.test(gebaut.fehlt[0] || ''), gebaut.fehlt[0]);

/* ==========================================================================
 * §2 · Was trotzdem mitkommt
 * --------------------------------------------------------------------------
 * Das Bild fehlt, die HANDSCHRIFT nicht. Sie steht in `daten.json` am Block
 * und kostet nichts — sie wegzulassen wäre die eigentliche Enttäuschung.
 * ========================================================================*/
console.log('\n2 · Was trotzdem mitkommt');

gleich('Beide Striche sind im Ausdruck', gebaut.striche, 2);
p('Auch der auf der Seite ohne Bild',
  gebaut.striche === 2, String(gebaut.striche));

/* ==========================================================================
 * §3 · Und der Mensch erfährt davon
 * ========================================================================*/
console.log('\n3 · Und der Mensch erfährt davon');

const hinweis = (gebaut.meldungen || []).find((t: string) => /Seitenbild/.test(t)) || '';
p('Eine Meldung nennt die Zahl', /^1 Seitenbild /.test(hinweis), hinweis);
p('Und sagt, was zu tun ist', /Abschnitten/.test(hinweis), hinweis);
p('Es ist nicht still geblieben', hinweis.length > 0,
  JSON.stringify(gebaut.meldungen));

/* ==========================================================================
 * §4 · Ohne Grenzfall bleibt alles beim Alten
 * --------------------------------------------------------------------------
 * Die Grenze darf einen gewöhnlichen Ausdruck nicht anfassen — sonst wäre
 * sie eine Verschlechterung mit Ansage.
 * ========================================================================*/
console.log('\n4 · Ohne Grenzfall bleibt alles beim Alten');

const normal = await seite.evaluate(async (b64: string) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const s = Store.addPage(null, { text: 'Kurzes Blatt' });
  for (let n = 1; n <= 3; n++) {
    const satz = await Dateien.ablegen(
      new File([bytes], 'k' + n + '.png', { type: 'image/png' }), { abgeleitet: true });
    Store.addBlock(s.id, 'pdfseite', { text: '', nr: n, bw: 595, bh: 842,
      quelleId: 'q2', bildDateiId: satz.id });
  }
  const meldungen: string[] = [];
  const echt = UI.toast;
  (UI as any).toast = (t: unknown, d?: number) => { meldungen.push(String(t)); return echt(t, d); };
  await Werkzeuge.drucken(Store.getBlock(s.id));
  (UI as any).toast = echt;

  const rahmen = [...document.querySelectorAll('iframe')]
    .filter(f => (f as HTMLIFrameElement).style.position === 'fixed')
    .pop() as HTMLIFrameElement | undefined;
  const d = rahmen?.contentDocument;
  const antwort = {
    bilder: d?.querySelectorAll('.blatt-druck img').length ?? -1,
    fehlt: d?.querySelectorAll('.blatt-druck .fehlt').length ?? -1,
    meldungen,
  };
  rahmen?.remove();
  return antwort;
}, PNG.toString('base64'));

gleich('Drei kleine Seiten, drei Bilder', normal.bilder, 3);
gleich('Keine leere Stelle', normal.fehlt, 0);
gleich('Und keine Warnung', 
  (normal.meldungen || []).filter((t: string) => /Seitenbild/.test(t)).length, 0);

/* ==========================================================================
 * §5 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n5 · Was der Quelltext verspricht');

const code = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/werkzeuge.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

p('Es gibt eine benannte Obergrenze', /const DRUCK_BILDER_MAX = /.test(code));
p('Der Sammler fragt nach der Grösse, bevor er holt',
  /Store\.dateiHolen\(b\.bildDateiId\)/.test(code) &&
  code.indexOf('Store.dateiHolen(b.bildDateiId)') <
  code.indexOf('await alsDatenAdresse(b.bildDateiId)'));
p('Und die Präsentation kennt keine Grenze — sie braucht keine',
  /bilderSammeln\(p, false\)/.test(code));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
