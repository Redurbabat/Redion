/* Suite 387 — Die Orte stehen in der linken Leiste (E388, Audit F02)
 * ============================================================================
 * WAS VORHER WAR. Wohin man geht, stand seit E272 Phase E im Reiter „Gehen"
 * des Menübandes. Seit dem ruhigen Band (E383) ist dieser Reiter hinter
 * einem zugeklappten Band — gemessen am 3. September 2026 am Rechner:
 *
 *     Kante, 1360×900   10 Knöpfe, KEINER davon ein Ort
 *     Seitenleiste      display:none (E272 Phase F)
 *     Band zugeklappt   „Werkzeuge · Suchen · KI · Konto" — kein Ort
 *     Weg zu „Heute"    zwei Klicks, der erste ins Band
 *
 * Der Prüfbericht nennt es F02, Auftrag 01 nennt es Schritt 2 von 5, und
 * beide sagen dasselbe: ein Ort ist kein Werkzeug.
 *
 *   §1 Die fünf Hauptwege stehen oben in der Kante, ohne einen Klick.
 *   §2 Sie kommen aus dem Register und nicht aus einer zweiten Liste.
 *   §3 „Mehr Orte" öffnet die Lade mit allem Übrigen.
 *   §4 Ein Klick auf einen Ort führt wirklich dorthin — und der Ort, an
 *      dem man steht, ist markiert. Und NUR er.
 *   §5 Nichts wird abgeschnitten: was nicht passt, steht hinter „···".
 *      Und wenn alles passt, gibt es kein „···".
 *   §6 Am Telefon gibt es die Kante weiterhin nicht.
 *
 *   node pruefungen/lauf/test387.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9407;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const fehler: string[] = [];
const browser = await chromium.launch();

/* Der Willkommensdialog liegt über allem und fängt jeden Klick ab. */
const AUFRAEUMEN = `(() => { document.getElementById('rg-willkommen')?.remove(); })()`;

/* KEIN BACKTICK in den Kommentaren dieser Zeichenketten: sie stehen in
   Vorlagenzeichenketten und würden sie beenden. */
const ORTE = `(() => {
  const k = document.getElementById('kante');
  if (!k) return { fehlt: true };
  const kr = k.getBoundingClientRect();
  const lies = (sel) => Array.from(k.querySelectorAll(sel + ' button')).map(b => {
    const r = b.getBoundingClientRect();
    return { id: b.dataset.k || '', name: b.getAttribute('aria-label') || '',
             hier: b.classList.contains('ist-hier'),
             aria: b.getAttribute('aria-current') || '',
             h: Math.round(r.height),
             drin: r.top >= kr.top - 1 && r.bottom <= kr.bottom + 1 };
  });
  const werk = k.querySelector('.k-oben');
  return {
    orte: lies('.k-orte'), werkzeuge: lies('.k-oben'), fuss: lies('.k-unten'),
    ueberlauf: werk ? werk.scrollHeight - werk.clientHeight : -1,
    kanteHoehe: Math.round(kr.height)
  };
})()`;

const pc = await browser.newPage({ viewport: { width: 1360, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(3500);
await pc.evaluate(AUFRAEUMEN);
await pc.waitForTimeout(500);

/* ==========================================================================
 * §1 · Die fünf Hauptwege stehen da, ohne einen Klick
 * ======================================================================== */
console.log('\n1 · Die fünf Hauptwege stehen oben in der Kante');
const a: any = await pc.evaluate(ORTE);
p('Die Kante hat einen Abschnitt für Orte', !a.fehlt && a.orte.length > 0,
  JSON.stringify(a).slice(0, 90));

const SOLL = ['Heute', 'Lernzentrum', 'Elektrotechnik', 'Bibliothek', 'Aufgaben'];
const namen: string[] = (a.orte || []).map((x: any) => x.name);
for (const n of SOLL) p(`„${n}" steht ohne einen Klick da`, namen.includes(n), namen.join(' | '));
p('Und „Mehr Orte" als sechster', namen.includes('Mehr Orte'), namen.join(' | '));
gleich('Genau sechs Knöpfe — fünf Orte und „Mehr"', a.orte.length, 6);
p('Alle sechs sind im Bild', (a.orte || []).every((x: any) => x.drin),
  JSON.stringify((a.orte || []).filter((x: any) => !x.drin)));

/* ==========================================================================
 * §2 · Aus dem Register, nicht aus einer zweiten Liste
 * --------------------------------------------------------------------------
 * WARUM DAS EIN EIGENER ABSCHNITT IST. Die Fünf gab es vor E388 dreimal:
 * als `data-ruhig="bleibt"` im Markup, als Liste in der unteren
 * Telefonleiste und als SOLL in test248 — und zwei davon waren VERSCHIEDEN.
 * Diese Zeile prüft, dass die Leiste wirklich das Register liest: wer
 * `haupt: true` dort wegnimmt, muss den Knopf verlieren.
 * ======================================================================== */
console.log('\n2 · Die Fünf kommen aus dem Register');
const ausRegister: any = await pc.evaluate(`(() => {
  try {
    const r = (Register.navigation.anPlatz('oben') || [])
      .filter(e => e && e.haupt === true);
    return { zahl: r.length, namen: r.map(e => e.name) };
  } catch (e) { return { fehler: String(e) }; }
})()`);
gleich('Das Register führt fünf Hauptwege', ausRegister.zahl, 5);
gleich('… und es sind dieselben wie in der Leiste',
  ausRegister.namen, namen.filter((n: string) => n !== 'Mehr Orte'));

/* ==========================================================================
 * §3 · „Mehr Orte" öffnet die Lade
 * ======================================================================== */
console.log('\n3 · „Mehr Orte" öffnet die Lade mit allem Übrigen');
await pc.click('.k-knopf[data-k="mehr-orte"]');
await pc.waitForTimeout(700);
const lade: any = await pc.evaluate(`(() => {
  const l = document.getElementById('kanten-lade');
  if (!l || l.hidden) return { offen: false };
  const zeilen = Array.from(l.querySelectorAll('.kl-zeile'));
  return { offen: true, zahl: zeilen.length,
           namen: zeilen.map(z => ((z.querySelector('b') || {}).textContent || '').trim()),
           mitGruppe: zeilen.filter(z => z.querySelector('i')).length,
           titel: ((l.querySelector('.kl-kopf, h2, b') || {}).textContent || '').trim() };
})()`);
p('Die Lade ist offen', lade.offen === true);
p('Sie hat mehr als zehn Ziele', lade.zahl > 10, 'sind ' + lade.zahl);
p('Keiner der fünf Hauptwege steht doppelt darin',
  SOLL.every(n => !(lade.namen || []).includes(n)),
  (lade.namen || []).filter((n: string) => SOLL.includes(n)).join(' | '));
p('Jede Zeile sagt, zu welcher Gruppe sie gehört',
  lade.mitGruppe === lade.zahl, `${lade.mitGruppe} von ${lade.zahl}`);
await pc.evaluate(`(() => { document.querySelector('#kanten-lade .kl-zu, #kanten-lade button')?.click(); })()`);
await pc.waitForTimeout(400);

/* ==========================================================================
 * §4 · Der Klick führt wirklich dorthin, und nur einer ist markiert
 * ======================================================================== */
console.log('\n4 · Ein Klick führt hin, und der Ort ist markiert');
const vorher: any = await pc.evaluate(`(() => ({
  schauplatz: App.schauplatz(),
  laenge: ((document.querySelector('#main') || document.body).textContent || '').length
}))()`);

await pc.click('.k-knopf[data-k="heute"]');
await pc.waitForTimeout(1200);
const nachher: any = await pc.evaluate(`(() => ({
  schauplatz: App.schauplatz(),
  laenge: ((document.querySelector('#main') || document.body).textContent || '').length
}))()`);
gleich('Nach dem Klick steht man auf „heute"', nachher.schauplatz, 'heute');
p('Und der Inhalt hat sich wirklich geändert', nachher.laenge !== vorher.laenge,
  `vorher ${vorher.laenge}, nachher ${nachher.laenge}`);

const b: any = await pc.evaluate(ORTE);
const markiert = (b.orte || []).filter((x: any) => x.hier);
gleich('Genau ein Ort ist markiert', markiert.length, 1);
gleich('… und zwar „Heute"', markiert[0]?.name, 'Heute');
gleich('Er trägt aria-current (§38)', markiert[0]?.aria, 'page');

/* Die GEGENPROBE, ohne die die Markierung nichts sagt: an einem Ort, der
   keiner der fünf ist, darf KEINER markiert sein. Eine Markierung, die
   immer irgendwo steht, sagt nichts (§55.1). */
await pc.evaluate(`(() => { Register.navigation.eines('posteingang')?.tun?.(); })()`);
await pc.waitForTimeout(1100);
const c: any = await pc.evaluate(ORTE);
gleich('GEGENPROBE: im Posteingang ist keiner der fünf markiert',
  (c.orte || []).filter((x: any) => x.hier).length, 0);

/* ==========================================================================
 * §5 · Nichts wird abgeschnitten
 * --------------------------------------------------------------------------
 * ZWEI RICHTUNGEN, und die zweite ist die wichtigere. Bei 900 px Höhe passt
 * alles — dann darf es KEINEN „···"-Knopf geben. Ein Überlaufknopf, der
 * immer da ist, sagt nichts (§55.1). Bei 720 px passt es nicht — dann muss
 * er da sein, und trotzdem darf nichts unter der Kante stehen.
 * ======================================================================== */
console.log('\n5 · Was nicht passt, steht hinter „···" — und sonst nicht');
gleich('Bei 900 px Höhe rollt nichts', b.ueberlauf, 0);
p('… und es gibt keinen Überlaufknopf',
  !(b.werkzeuge || []).some((x: any) => x.id === 'mehr-werkzeuge'),
  (b.werkzeuge || []).map((x: any) => x.name).join(' | '));
p('Alle Werkzeuge sind im Bild', (b.werkzeuge || []).every((x: any) => x.drin),
  JSON.stringify((b.werkzeuge || []).filter((x: any) => !x.drin)));

/* NEU LADEN STATT KLICKEN. Der erste Versuch klickte auf „Bibliothek" und
   mass dann drei Werkzeuge — `Produktwelten.bibliothek()` führt an einen
   ANDEREN Schauplatz als der Startbildschirm, und drei Werkzeuge laufen
   nirgends über. Der Startbildschirm bringt sieben mit; das ist der
   Zustand, in dem der Überlauf entsteht, und er wird hergestellt statt
   vorausgesetzt. */
await pc.setViewportSize({ width: 1280, height: 720 });
await pc.reload();
await pc.waitForTimeout(3500);
await pc.evaluate(AUFRAEUMEN);
await pc.waitForTimeout(700);
const d: any = await pc.evaluate(ORTE);
p('Der Startbildschirm bringt genug Werkzeuge mit, dass etwas überlaufen KANN',
  (d.werkzeuge || []).length >= 5,
  (d.werkzeuge || []).map((x: any) => x.name).join(' | '));
p('Bei 720 px Höhe steht der Überlaufknopf da',
  (d.werkzeuge || []).some((x: any) => x.id === 'mehr-werkzeuge'),
  (d.werkzeuge || []).map((x: any) => x.name).join(' | '));
p('Er sagt, wie viele dahinter liegen',
  /^\d+ weitere[s]? Werkzeug/.test(
    (d.werkzeuge || []).find((x: any) => x.id === 'mehr-werkzeuge')?.name || ''),
  (d.werkzeuge || []).find((x: any) => x.id === 'mehr-werkzeuge')?.name || '(keiner)');
gleich('Und es rollt trotzdem nichts', d.ueberlauf, 0);
p('Alle sechs Orte stehen weiterhin im Bild',
  (d.orte || []).length === 6 && (d.orte || []).every((x: any) => x.drin),
  JSON.stringify((d.orte || []).filter((x: any) => !x.drin)));
p('Der Fuss steht weiterhin im Bild',
  (d.fuss || []).length === 3 && (d.fuss || []).every((x: any) => x.drin),
  JSON.stringify((d.fuss || []).filter((x: any) => !x.drin)));

const ueberlaufLade: any = await pc.evaluate(`(() => {
  document.querySelector('.k-knopf[data-k="mehr-werkzeuge"]')?.click();
  return null;
})()`);
void ueberlaufLade;
await pc.waitForTimeout(600);
const rest: any = await pc.evaluate(`(() => {
  const l = document.getElementById('kanten-lade');
  if (!l || l.hidden) return { offen: false };
  return { offen: true, zahl: l.querySelectorAll('.kl-zeile').length };
})()`);
p('Der Überlaufknopf öffnet eine Lade mit dem Rest',
  rest.offen === true && rest.zahl > 0, JSON.stringify(rest));

/* ==========================================================================
 * §6 · Am Telefon gibt es die Kante nicht
 * ======================================================================== */
console.log('\n6 · Am Telefon bleibt die Kante weg');
const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
                                      isMobile: true, hasTouch: true });
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(3200);
await handy.evaluate(AUFRAEUMEN);
await handy.waitForTimeout(400);
const amHandy: any = await handy.evaluate(`(() => {
  const k = document.getElementById('kante');
  const u = document.getElementById('handy-oben');
  return { kanteWeg: !k || k.hidden || k.getBoundingClientRect().width === 0,
           unten: u ? Array.from(u.querySelectorAll('button')).map(b =>
             (b.textContent || '').trim()) : [] };
})()`);
p('Die Kante ist am Telefon weg', amHandy.kanteWeg === true);
gleich('Und die untere Leiste trägt weiterhin fünf Wege', amHandy.unten.length, 5);

console.log('');
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' ‖ '));

console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
