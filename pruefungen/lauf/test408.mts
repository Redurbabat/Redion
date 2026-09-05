/* Suite 408 — Der Zeitstrahl zeigt Spannen und liest sich (E413)
 * ============================================================================
 * E410 hat dem KALENDER beigebracht, seine Endspalte zu erkennen. Der
 * Zeitstrahl behielt die alte Zeile — und die Folge war dort schlimmer:
 * ohne Enddatum wird jedes Projekt ein Quadrat von dreissig Pixeln, und in
 * dreissig Pixeln steht vom Titel EIN Buchstabe. Auf dem Bild las man
 * „E", „\", „S", „E" — neun Balken, die alle gleich aussahen.
 *
 * Das ist der zweitteuerste wiederkehrende Fehler dieses Projekts, wörtlich
 * aus §45: eine Sache an einer Stelle reparieren und die Nachbarstelle
 * nicht ansehen.
 *
 *   §1 Mehrtägige Einträge sind mehrtägig breit.
 *   §2 KEIN Titel ist abgeschnitten — er steht drinnen oder daneben.
 *   §3 Ein Balken, in den der Titel passt, behält ihn drinnen.
 *   §4 Die Balken sind in BEIDEN Modi zu sehen.
 *   §5 Und die Erkennung schweigt, wenn die Daten sie nicht tragen.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `kalEnde(coll, view, startKey)` zurück auf die alte Zeile
 *        `view.endeKey && … ? view.endeKey : null`.
 *   §2 → die `requestAnimationFrame`-Messung in `alsZeitstrahl` entfernen.
 *   §4 → die `box-shadow`-Kante aus `.zs-balken` nehmen.
 * Alle drei gelaufen, Ergebnisse im Bericht zu E413.
 *
 *   node pruefungen/lauf/test408.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9531;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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

const AUFBAU = (zeilen: string, stufe: string) => `return (async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const seite = Store.addPage(null, { text: 'Spannen', icon: '▬' });
  const { block, collectionId } = Store.addDatabase(seite.id, 'Spannen', {
    titel:  { name: 'Titel',  type: 'title' },
    anfang: { name: 'Anfang', type: 'date' },
    ende:   { name: 'Ende',   type: 'date' }
  }, 'table');
  for (const [t, a, e] of ${zeilen}) {
    const r = Store.addRow(collectionId, { title: t });
    Store.setProp(r.id, 'anfang', a);
    if (e) Store.setProp(r.id, 'ende', e);
  }
  const view = Store.addView(collectionId, 'timeline');
  Store.updateView(view.id, { zoom: ${JSON.stringify(stufe)} });
  Store.updateBlock(block.id, { aktiveView: view.id });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1000));
})();`;

const oeffne = async (zeilen: string, thema = 'dark', stufe = 'monat') => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.evaluate(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(thema)})`);
  await s.waitForTimeout(400);
  await s.evaluate(new Function(AUFBAU(zeilen, stufe)) as any);
  await s.waitForTimeout(1100);
  return s;
};

const SATZ = `[['Langes Projekt','2026-09-01','2026-09-21'],
               ['Kurzes','2026-09-08','2026-09-10'],
               ['Ein Tag','2026-09-15','']]`;

const BALKEN = `(() => [...document.querySelectorAll('.zs-balken')].map(b => {
  const t = b.querySelector('.zs-txt'); const cs = getComputedStyle(b);
  return { titel: t ? t.textContent.trim() : '', breite: Math.round(b.getBoundingClientRect().width),
           draussen: t ? t.classList.contains('draussen') : null,
           schatten: cs.boxShadow };
}))()`;

/* ==========================================================================
 * §1 · MEHRTÄGIGE EINTRÄGE SIND MEHRTÄGIG BREIT
 * ========================================================================*/
console.log('\n§1 Spannen sind breit');
/* AUF DER TAGESSTUFE, und das ist kein Zufall: `ZS_STUFEN` gibt der
   Monatsstufe fünf Pixel je Tag. Drei Tage sind dort fünfzehn Pixel und
   fallen unter die Mindestbreite von 22 — ein Drei-Tage-Balken ist dann
   genau so breit wie ein Ein-Tage-Balken, und der Abschnitt könnte gar
   nicht anders. Auf der Tagesstufe sind es 42 px, und die Messung misst
   wirklich etwas. (Dass der Zeitstrahl seine Fläche bei kurzen Zeiträumen
   nicht ausnutzt, steht als eigener Punkt in LUECKEN.) */
const s1 = await oeffne(SATZ, 'dark', 'tag');
const b1 = await s1.evaluate(BALKEN) as any[];
p('Es gibt drei Balken', b1.length === 3, String(b1.length));

const finde = (n: string) => b1.find(b => b.titel.startsWith(n));
const lang = finde('Langes'), kurz = finde('Kurzes'), tag = finde('Ein Tag');
p('Alle drei sind da', !!lang && !!kurz && !!tag, b1.map(b => b.titel).join(' | '));
/* 21 Tage müssen deutlich breiter sein als 3, und 3 breiter als 1. */
p('Das 21-Tage-Projekt ist breiter als das 3-Tage-Projekt',
  lang.breite > kurz.breite * 2, `${lang.breite} gegen ${kurz.breite}`);
p('Und das 3-Tage-Projekt breiter als der eine Tag',
  kurz.breite > tag.breite, `${kurz.breite} gegen ${tag.breite}`);
/* Ohne Enddatum wären ALLE gleich breit — genau das war der Fehler. */
p('Die drei sind nicht alle gleich breit',
  new Set([lang.breite, kurz.breite, tag.breite]).size === 3,
  `${lang.breite} ${kurz.breite} ${tag.breite}`);

/* ==========================================================================
 * §2 · KEIN TITEL IST ABGESCHNITTEN
 * --------------------------------------------------------------------------
 * Gemessen wird gegen den Zustand VOR der Entscheidung: die Klasse wird
 * entfernt, dann neu gemessen. Sonst misst man das Ergebnis der eigenen
 * Reparatur — draussen ist der Platz unbegrenzt, und `scrollWidth` gleich
 * `clientWidth` sagt dann nichts mehr.
 * ========================================================================*/
console.log('\n§2 Kein Titel abgeschnitten');
const schnitt = await s1.evaluate(`(() => {
  const raus = [];
  for (const t of document.querySelectorAll('.zs-balken .zs-txt')) {
    const war = t.classList.contains('draussen');
    t.classList.remove('draussen');
    const passt = t.scrollWidth <= t.clientWidth + 2;
    if (war) t.classList.add('draussen');
    /* Abgeschnitten wäre: passt nicht UND steht trotzdem drinnen. */
    if (!passt && !war) raus.push(t.textContent.trim().slice(0, 24));
  }
  return JSON.stringify(raus);
})()`) as string;
p('Kein Titel steht abgeschnitten in seinem Balken',
  JSON.parse(schnitt).length === 0, schnitt);
p('Jeder Titel steht vollständig im Text', b1.every(b => b.titel.length > 3 && !/…$/.test(b.titel)),
  b1.map(b => b.titel).join(' | '));

/* ==========================================================================
 * §3 · WAS PASST, BLEIBT DRINNEN
 * --------------------------------------------------------------------------
 * Ohne diesen Abschnitt wäre §2 durch „schreib jeden Titel nach draussen"
 * erfüllbar — und dann stünde neben jedem Balken Text, auch wo Platz ist.
 * ========================================================================*/
console.log('\n§3 Was passt, bleibt drinnen');
const s3 = await oeffne(`[['Kurz','2026-01-05','2026-11-20'],
                          ['Winzig','2026-06-01','2026-06-02']]`, 'dark', 'monat');
const b3 = await s3.evaluate(BALKEN) as any[];
const breit = b3.find(b => b.titel.startsWith('Kurz'));
const schmal = b3.find(b => b.titel.startsWith('Winzig'));
p('Der sehr breite Balken trägt seinen Titel INNEN',
  breit && breit.draussen === false, breit ? `${breit.breite}px, draussen=${breit.draussen}` : 'fehlt');
p('Der winzige trägt ihn daneben',
  schmal && schmal.draussen === true, schmal ? `${schmal.breite}px, draussen=${schmal.draussen}` : 'fehlt');
await s3.close();

/* ==========================================================================
 * §4 · DIE BALKEN SIND IN BEIDEN MODI ZU SEHEN
 * --------------------------------------------------------------------------
 * Gemessen im Hellmodus: der Grund eines Balkens war rgb(241,241,239) auf
 * weisser Seite — ein Kontrast von etwa 1,05. Auf dem Bild sah man nichts.
 * ========================================================================*/
console.log('\n§4 Sichtbar in beiden Modi');
p('Im Dunkelmodus hat jeder Balken eine Kante',
  b1.every(b => b.schatten && b.schatten !== 'none'),
  b1.map(b => b.schatten).join(' | ').slice(0, 90));

const s4 = await oeffne(SATZ, 'light');
const b4 = await s4.evaluate(BALKEN) as any[];
p('Im Hellmodus auch', b4.every(b => b.schatten && b.schatten !== 'none'),
  b4.map(b => b.schatten).join(' | ').slice(0, 90));
await s4.close();

/* ==========================================================================
 * §5 · DIE ERKENNUNG SCHWEIGT, WENN DIE DATEN SIE NICHT TRAGEN
 * ========================================================================*/
console.log('\n§5 Ein Gegenbeispiel genügt');
await s1.close();
const s5 = await oeffne(`[['Langes Projekt','2026-09-01','2026-09-21'],
                          ['Verdreht','2026-09-20','2026-09-05']]`, 'dark', 'tag');
const b5 = await s5.evaluate(BALKEN) as any[];
p('Ohne verlässliches Ende sind alle Balken gleich breit',
  new Set(b5.map(b => b.breite)).size === 1, b5.map(b => b.breite).join(' '));
await s5.close();

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
