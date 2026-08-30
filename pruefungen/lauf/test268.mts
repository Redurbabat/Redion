/* Suite 268 — Der Zeitmesser: Lernzeit messen statt schätzen (E268)
 * ============================================================================
 * »Time Keeper« aus Redurs GoodNotes-Dossier, und zugleich der Anfang von
 * AUFGABEN.md »Pomodoro/Lernzeit echt messen statt schätzen«.
 *
 * §1 DAS FELD öffnet über das Register, mit Wörtern auf den Knöpfen (§38).
 * §2 DIE STOPPUHR misst ECHTE Sekunden (gewartet, nicht behauptet).
 * §3 PAUSE hält an, Weiter läuft weiter.
 * §4 DOKUMENTBEZUG: die beendete Sitzung kennt Dauer UND Seite; der
 *    Verlauf ist auf 50 begrenzt (§15 gilt auch für Kleinkram).
 * §5 DER TIMER endet von selbst, meldet sich und trägt sich ein.
 * §6 SCHLIESSEN stoppt die Uhr NICHT — aus dem Blick ist nicht aus.
 * §7 BAU-HYGIENE: index, sw, Einzeldatei, Register.
 *
 *   node pruefungen/lauf/test268.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Register: any;
declare const Zeitmesser: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9047;

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
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof App !== 'undefined' && typeof (window as any).Zeitmesser !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1100);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const s = Store.addPage(null, { text: 'Ohmsches Gesetz üben' });
  Store.addBlock(s.id, 'text', { text: 'U = R · I' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(700);

console.log('\n1 · Das Feld öffnet über das Register, mit Wörtern (§38)');
await seite.evaluate(() => Register.module.oeffne('zeitmesser'));
await seite.waitForTimeout(300);
p('Register.module „zeitmesser" öffnet das Feld; Stoppuhr/5 Min/25 Min stehen als Wörter',
  await seite.evaluate(() => {
    const feld = document.querySelector('.zm-feld');
    const woerter = [...(feld?.querySelectorAll('[data-zm]') || [])]
      .map(b => (b.textContent || '').trim());
    return !!feld && ['Stoppuhr', '5 Min', '25 Min']
      .every(wort => woerter.some(t => t === wort));
  }));

console.log('\n2 · Die Stoppuhr misst echte Sekunden');
await seite.locator('.zm-feld [data-zm="stoppuhr"]').first().click();
await seite.waitForTimeout(2300);
const nach2 = await seite.evaluate(() => Zeitmesser.stand());
p('Nach gut zwei gewarteten Sekunden stehen mindestens zwei auf der Uhr',
  (nach2 as any).laeuft && (nach2 as any).art === 'stoppuhr' &&
  (nach2 as any).sekunden >= 2 && (nach2 as any).sekunden <= 4,
  JSON.stringify(nach2));
p('Die Uhr im Feld zeigt es an und nennt die Seite',
  await seite.evaluate(() => {
    const feld = document.querySelector('.zm-feld');
    return /00:0[2-4]/.test(feld?.querySelector('.zm-uhr')?.textContent || '') &&
      (feld?.querySelector('.zm-wo')?.textContent || '').includes('Ohmsches Gesetz');
  }));

console.log('\n3 · Pause hält an');
await seite.locator('.zm-feld [data-zm="pause"]').click();
const beiPause = await seite.evaluate(() => Zeitmesser.stand().sekunden);
/* LANG GENUG, DASS DIE PROBE ROT WERDEN KANN (§55.2): bei 1,4 s Wartezeit
   frass die Rundung plus ±1-Toleranz einen kaputten Pausenpfad — die
   Gegenprobe blieb grün. 2,6 s Wachstum lassen sich nicht wegrunden. */
await seite.waitForTimeout(2600);
p('Während der Pause wächst nichts',
  await seite.evaluate((s: number) => {
    const jetzt = Zeitmesser.stand();
    return jetzt.pausiert && Math.abs(jetzt.sekunden - s) <= 1;
  }, beiPause));
await seite.locator('.zm-feld [data-zm="pause"]').click();
await seite.waitForTimeout(1600);
p('Nach „Weiter" läuft sie weiter',
  await seite.evaluate((s: number) =>
    !Zeitmesser.stand().pausiert && Zeitmesser.stand().sekunden >= s + 1, beiPause));

console.log('\n4 · Dokumentbezug und begrenzter Verlauf');
/* Bis über die Fünf-Sekunden-Schwelle laufen lassen, dann den Verlauf
   VORHER auf 60 Einträge aufblasen — Beenden muss auf 50 kappen. */
await seite.waitForTimeout(2000);
await seite.evaluate(() => {
  const alt = Array.from({ length: 60 }, (_x, i) => ({
    art: 'stoppuhr', beginn: 1, dauerSek: 60 + i, sollSek: 0,
    seiteId: '', seitenName: 'Alt ' + i }));
  Store.setMeta('zeit:sitzungen', alt);
});
await seite.locator('.zm-feld [data-zm="stopp"]').click();
await seite.waitForTimeout(300);
const verlauf = await seite.evaluate(() => Store.getMeta('zeit:sitzungen', []));
p('Die Sitzung steht vorn im Verlauf — mit Dauer und SEITE',
  (verlauf as any[])[0]?.seitenName === 'Ohmsches Gesetz üben' &&
  (verlauf as any[])[0]?.dauerSek >= 5,
  JSON.stringify((verlauf as any[])[0]));
p('Der Verlauf bleibt bei höchstens 50 Einträgen (§15)',
  (verlauf as any[]).length === 50);
p('Das Feld zeigt „Zuletzt" mit dem Seitennamen',
  await seite.evaluate(() =>
    (document.querySelector('.zm-sitzungen')?.textContent || '')
      .includes('Ohmsches Gesetz')));

console.log('\n5 · Der Timer endet von selbst und meldet sich');
await seite.evaluate(() => Zeitmesser.start('timer', 6));
await seite.waitForTimeout(1000);
p('Er läuft rückwärts (Rest kleiner als das Soll)',
  await seite.evaluate(() => {
    const s = Zeitmesser.stand();
    return s.laeuft && s.art === 'timer' && s.sekunden <= 5 && s.sekunden >= 3;
  }));
await seite.waitForTimeout(5800);
p('Nach Ablauf: Uhr aus, Meldung mit „Zeit um", Sitzung als Timer im Verlauf',
  await seite.evaluate(() => {
    const s = Zeitmesser.stand();
    const toast = document.getElementById('toast')?.textContent || '';
    const kopf = (Store.getMeta('zeit:sitzungen', []) || [])[0];
    return !s.laeuft && toast.includes('Zeit um') &&
      kopf?.art === 'timer' && kopf?.dauerSek >= 5;
  }));

console.log('\n6 · Schliessen stoppt die Uhr nicht');
await seite.evaluate(() => Zeitmesser.start('stoppuhr'));
await seite.locator('.zm-feld [data-zm="zu"]').click();
await seite.waitForTimeout(1500);
p('Feld zu, Uhr läuft — und das wieder geöffnete Feld zeigt den Stand',
  await seite.evaluate(() => {
    if (document.querySelector('.zm-feld')) return false;
    const lief = Zeitmesser.stand().laeuft && Zeitmesser.stand().sekunden >= 1;
    Zeitmesser.panel();
    const uhr = document.querySelector('.zm-feld .zm-uhr')?.textContent || '';
    Zeitmesser.stopp();
    return lief && !/00:00/.test(uhr);
  }));

console.log('\n7 · Bau-Hygiene');
const zmJs = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/zeitmesser.js'), 'utf8');
const swJs = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
const fassung = /VERSION = '([^']+)'/.exec(
  fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8'))?.[1] || '';
p('zeitmesser.js ist erzeugt (ERZEUGT-Kopf), index.html und sw.js laden es',
  zmJs.includes('ERZEUGT') &&
  fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8')
    .includes('quell/bereiche/wissen/zeitmesser.js') &&
  swJs.includes('quell/bereiche/wissen/zeitmesser.js') &&
  !!fassung && swJs.includes(`'${fassung}'`));
p('Register und Menüband kennen den Zeitmesser',
  fs.readFileSync(path.join(WURZEL, 'quell/register/module.js'), 'utf8')
    .includes("'zeitmesser'") &&
  fs.readFileSync(path.join(WURZEL, 'quell/register/menueband.js'), 'utf8')
    .includes('w-zeit'));
p('Die Einzeldatei kennt ihn',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8')
    .includes('zm-feld'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
