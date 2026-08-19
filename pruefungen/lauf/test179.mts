/* Suite 145 — Ein Verweis führt wirklich hin (E105)
 * ============================================================================
 * Strg + Umschalt + C legt seit Langem eine Adresse `…#block=<kennung>` in
 * die Zwischenablage und meldet „Link auf diesen Block kopiert".
 *
 * GELESEN HAT SIE NIE JEMAND. Beim Start nahm die Schale den Hash als
 * Seitenkennung; `Store.getBlock('block=abc')` gibt nichts, also fiel der
 * Start auf die zuletzt geöffnete Seite zurück. Der Link tat also etwas —
 * nur nicht das Versprochene. Und weil „irgendeine Seite geht auf" wie ein
 * Erfolg aussieht, ist es niemandem aufgefallen.
 *
 * DIESE SUITE PRÜFT DEN UNTERSCHIED ZWISCHEN „ES GEHT ETWAS AUF" UND „ICH
 * BIN DA". Das ist der ganze Punkt: §1 öffnet einen Verweis auf einen Block
 * in einer ANDEREN Seite als der zuletzt geöffneten. Ohne den Fix landet man
 * auf der falschen Seite — und ein Prüfpunkt, der nur „eine Seite ist offen"
 * verlangt, hätte auch vorher schon Grün gemeldet.
 *
 * §3 hängt den Anker an die PDF-Seite: bei einem Skript mit achtzig Seiten
 * ist er der Unterschied zwischen „ich weiss, dass es drinsteht" und „ich
 * bin da" (L37).
 *
 *   node pruefungen/lauf/test179.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8924;

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
await seite.setViewportSize({ width: 1400, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* --------------------------------------------------------------------------
 * Zwei Seiten. Das Ziel liegt in der ZWEITEN, weit unten, und danach wird
 * die ERSTE geöffnet — so ist „zuletzt geöffnet" garantiert die falsche
 * Antwort, und ein Rückfall darauf fällt auf.
 * ------------------------------------------------------------------------*/
const gebaut = await seite.evaluate(async () => {
  const eins = Store.addPage(null, { text: 'Erste Seite' });
  Store.addBlock(eins.id, 'text', { text: 'Hier steht nichts Wichtiges.' });

  const zwei = Store.addPage(null, { text: 'Zweite Seite' });
  for (let i = 1; i <= 40; i++)
    Store.addBlock(zwei.id, 'text', { text: 'Füllzeile ' + i });
  const ziel = Store.addBlock(zwei.id, 'h2', { text: 'DAS GESUCHTE' });
  for (let i = 41; i <= 60; i++)
    Store.addBlock(zwei.id, 'text', { text: 'Füllzeile ' + i });

  /* Zuletzt die ERSTE öffnen — das ist der Rückfall, den es zu schlagen gilt. */
  App.oeffne(eins.id);
  return { eins: eins.id, zwei: zwei.id, ziel: ziel.id };
});
await seite.waitForTimeout(400);

/* ==========================================================================
 * §1 · Ein Verweis beim Start führt zur richtigen Seite
 * ========================================================================*/
console.log('\n1 · Ein Verweis beim Start führt zur richtigen Seite');

gleich('Offen ist gerade die erste Seite',
  await seite.evaluate(() => App.aktuelleSeite()), gebaut.eins);
gleich('Und „zuletzt" ist sie auch',
  await seite.evaluate(() => Store.getMeta('letzte')), gebaut.eins);

/* WIRKLICH NEU LADEN. Ein `goto` auf dieselbe Adresse mit anderem Hash ist
   KEINE Navigation — der Browser bleibt im selben Dokument und feuert nur
   `hashchange`. Der erste Entwurf tat genau das und behauptete trotzdem
   „beim Start": der Arm ohne die Start-Behandlung blieb grün, weil in
   Wahrheit zweimal derselbe Weg geprüft wurde. Über `about:blank` gibt es
   ein echtes zweites Hochlaufen. */
await seite.goto('about:blank');
await seite.goto(`http://localhost:${PORT}/index.html#block=${gebaut.ziel}`);
await seite.waitForFunction((z: string) =>
  !!document.querySelector(`[data-bid="${z}"]`), gebaut.ziel, { timeout: 25000 })
  .catch(() => { /* der Arm soll rot werden dürfen, nicht abstürzen */ });
await seite.waitForTimeout(600);

const nachStart = await seite.evaluate((z: string) => {
  const el = document.querySelector(`[data-bid="${z}"]`);
  const scr = document.getElementById('scroll');
  return {
    seite: App.aktuelleSeite(),
    zielDa: !!el,
    /* Steht es im Bild? Nicht „existiert im DOM" — das täte es auch ganz
       unten in einer 60 Zeilen langen Seite. */
    imBild: el ? (() => {
      const r = el.getBoundingClientRect();
      return r.top > -10 && r.bottom < innerHeight + 10;
    })() : false,
    gerollt: scr ? scr.scrollTop : 0,
    text: el?.textContent || ''
  };
}, gebaut.ziel);

gleich('Jetzt ist die ZWEITE Seite offen', nachStart.seite, gebaut.zwei);
p('Der gesuchte Block ist gezeichnet', nachStart.zielDa);
p('Und er steht wirklich im Bild', nachStart.imBild);
p('Dafür musste gerollt werden', nachStart.gerollt > 100,
  nachStart.gerollt + ' px');
p('Es ist auch der richtige Block',
  String(nachStart.text).includes('DAS GESUCHTE'), nachStart.text.slice(0, 40));

/* GEGENPROBE — DER PUNKT, AN DEM DIESE SUITE ETWAS BEWEIST.
   Vorher landete derselbe Verweis auf der ERSTEN Seite: `getBlock('block=…')`
   gibt nichts, also griff der Rückfall auf „zuletzt geöffnet". Ein Prüfpunkt,
   der nur „irgendeine Seite ist offen" verlangt, wäre auch damals grün
   gewesen — deshalb steht hier ausdrücklich, dass es NICHT die ist. */
p('Gegenprobe: es ist nicht die zuletzt geöffnete Seite',
  nachStart.seite !== gebaut.eins);

/* ==========================================================================
 * §2 · Und im Betrieb, ohne Neuladen
 * ========================================================================*/
console.log('\n2 · Und im Betrieb, ohne Neuladen');

await seite.evaluate((e: string) => App.oeffne(e), gebaut.eins);
await seite.waitForTimeout(300);
gleich('Zurück auf der ersten Seite',
  await seite.evaluate(() => App.aktuelleSeite()), gebaut.eins);

/* Wie ein Klick auf den Verweis: nur die Adresse ändern. */
await seite.evaluate((z: string) => { location.hash = 'block=' + z; }, gebaut.ziel);
await seite.waitForFunction((z: string) => {
  const el = document.querySelector(`[data-bid="${z}"]`);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top > -10 && r.bottom < innerHeight + 10;
}, gebaut.ziel, { timeout: 15000 });

gleich('Der Verweis wechselt die Seite',
  await seite.evaluate(() => App.aktuelleSeite()), gebaut.zwei);
p('Und rollt zum Block',
  await seite.evaluate((z: string) => {
    const r = document.querySelector(`[data-bid="${z}"]`)!.getBoundingClientRect();
    return r.top > -10 && r.bottom < innerHeight + 10;
  }, gebaut.ziel));

/* Ein Verweis auf etwas Gelöschtes darf nicht ins Leere führen. */
await seite.evaluate((z: string) => { Store.trashBlock(z); App.oeffne(null); },
  gebaut.ziel);
await seite.waitForTimeout(300);
/* DIE MELDUNGEN MITSCHREIBEN, statt `#toast` auszulesen. Der Kasten ist
   EINER für die ganze App: beim ersten Anlauf stand dort „🎴 1 Karteikarte
   ist fällig", weil die Erinnerung dazwischenkam. Was hier zählt, ist, was
   der Verweis gesagt hat — nicht, was zuletzt im Kasten stand. */
const totLink = await seite.evaluate(async (z: string) => {
  const gesagt: string[] = [];
  const echt = UI.toast;
  (UI as any).toast = (txt: unknown, ms?: number) => {
    gesagt.push(String(txt ?? ''));
    return echt(txt, ms);
  };
  location.hash = 'block=' + z;
  await new Promise(r => setTimeout(r, 500));
  (UI as any).toast = echt;
  return { gesagt, seite: App.aktuelleSeite() };
}, gebaut.ziel);

p('Ein Verweis auf einen gelöschten Block sagt das',
  totLink.gesagt.some(m => /nicht mehr da|kein Weg/i.test(m)),
  totLink.gesagt.join(' | ') || '(nichts gesagt)');
p('Und die offene Seite bleibt, wo sie war',
  totLink.seite === gebaut.eins || totLink.seite === null,
  String(totLink.seite));

/* ==========================================================================
 * §3 · Der Anker an der PDF-Seite (L37)
 * ========================================================================*/
console.log('\n3 · Der Anker an der PDF-Seite');

const pdfSeite = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Skript' });
  const b = Store.addBlock(s.id, 'pdfseite', {
    text: '', nr: 14, vonSeiten: 80, bw: 595, bh: 842 });
  App.oeffne(s.id);
  return { seite: s.id, block: b.id };
});
await seite.waitForSelector('.pdfs .blatt-fest [data-a="anker"]', { timeout: 15000 });

const leiste = await seite.evaluate(() => {
  const fest = document.querySelector('.pdfs .blatt-fest')!;
  const knopf = fest.querySelector('[data-a="anker"]') as HTMLElement;
  return {
    nr: fest.querySelector('.pdfs-nr')?.textContent || '',
    titel: knopf.getAttribute('title') || '',
    /* Der Anker sitzt im FESTEN Kasten — nicht in dem, der wegrollt. */
    imFesten: !!knopf.closest('.blatt-fest'),
    nichtImRollenden: !knopf.closest('.blatt-werk')
  };
});

gleich('Die Seitenzahl steht da', leiste.nr, 'Seite 14 von 80');
p('Und ein Anker daneben', /Verweis/i.test(leiste.titel), leiste.titel);
p('Er sitzt im festen Kasten', leiste.imFesten);
p('Also nicht hinter einem Wisch', leiste.nichtImRollenden);

/* Klicken — und nachsehen, was in der Zwischenablage steht. */
await seite.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await seite.click('.pdfs .blatt-fest [data-a="anker"]');
await seite.waitForTimeout(400);

const kopiert = await seite.evaluate(async () => {
  let inhalt = '';
  try { inhalt = await navigator.clipboard.readText(); } catch { /* egal */ }
  return { inhalt, meldung: document.getElementById('toast')?.textContent || '' };
});

p('Die Meldung nennt die Seitenzahl',
  /Seite 14/.test(kopiert.meldung), kopiert.meldung);
p('Der kopierte Verweis zeigt auf genau diesen Block',
  kopiert.inhalt.endsWith('#block=' + pdfSeite.block), kopiert.inhalt);
p('Und er trägt keine alte Kennung mit sich',
  (kopiert.inhalt.match(/#/g) || []).length === 1, kopiert.inhalt);

/* Und der Weg zurück: der eben kopierte Verweis muss funktionieren. */
await seite.evaluate((e: string) => App.oeffne(e), gebaut.eins);
await seite.waitForTimeout(300);
await seite.evaluate((adr: string) => { location.hash = adr.split('#')[1]!; },
  kopiert.inhalt);
await seite.waitForFunction((b: string) =>
  !!document.querySelector(`[data-bid="${b}"]`), pdfSeite.block, { timeout: 15000 });

gleich('Der eigene Verweis führt zurück auf die Skript-Seite',
  await seite.evaluate(() => App.aktuelleSeite()), pdfSeite.seite);

/* ==========================================================================
 * §4 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n4 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const schale = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf8'));

p('Die Schale liest `block=` aus der Adresse',
  /block=\(\.\+\)/.test(schale) || /match\(\/\^block=/.test(schale));
p('Und hört auf spätere Adressänderungen',
  /addEventListener\('hashchange'/.test(schale));
p('Gerollt wird über Bildfolgen, nicht über die Uhr',
  /requestAnimationFrame/.test(schale) &&
  !/setTimeout\([^)]*rolleZu/.test(schale));

const editor = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/editor/ansicht/editor.ts'), 'utf8'));
p('Strg + Umschalt + C schreibt dieselbe Form, die gelesen wird',
  /'#block=' \+ b\.id/.test(editor));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
