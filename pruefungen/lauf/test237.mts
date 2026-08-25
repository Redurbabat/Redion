/* Suite 203 — Das Dashboard sieht über den eigenen Rand (L17, E185)
 * ============================================================================
 * L17 nannte vier Dinge, und alle vier hingen an derselben Stelle — daran,
 * was in einer Kachel stehen darf:
 *
 *     mehrere Datenquellen   `quelle` — die Kachel holt sich eine FREMDE
 *                            Datenbank statt der eigenen
 *     KPI-Karten             `ziel` und `richtung` — eine Zahl gegen ein Ziel
 *     Layout                 jede Kachel einzeln wegnehmen und verschieben,
 *                            statt nur „Alle Kacheln entfernen"
 *     Diagrammquellen        `wertKey` — die Verteilung SUMMIERT eine Spalte,
 *                            statt immer nur Zeilen zu zählen
 *
 * Der letzte Punkt ist der, den man am ehesten übersieht und am meisten
 * braucht: „12 Aufträge in Zürich" ist selten die Frage, „180 000 Umsatz in
 * Zürich" fast immer.
 *
 *   node pruefungen/lauf/test237.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Datenbank: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8996;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Zwei Datenbanken bauen: „Aufträge" (die eigene) und „Rechnungen" (die
   fremde). Die Zahlen sind mit Absicht klein und ungleich, damit eine
   verwechselte Quelle sofort auffällt. */
const gebaut = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta('neuerungenGesehen', 99);

  const s1 = Store.addPage(null, { text: 'Vertrieb' });
  const a = Store.addDatabase(s1.id, 'Aufträge', {
    title:  { name: 'Auftrag', type: 'title' },
    ort:    { name: 'Ort', type: 'select',
              options: [{ name: 'Zürich', color: 'blue' }, { name: 'Bern', color: 'green' }] },
    betrag: { name: 'Betrag', type: 'number' }
  }, 'dashboard');
  [['A1', 'Zürich', 100], ['A2', 'Zürich', 80], ['A3', 'Bern', 20]]
    .forEach(([t, o, b]) => Store.addRow(a.collectionId, { title: t, ort: o, betrag: b }));

  const s2 = Store.addPage(null, { text: 'Buchhaltung' });
  const r = Store.addDatabase(s2.id, 'Rechnungen', {
    title:  { name: 'Rechnung', type: 'title' },
    summe:  { name: 'Summe', type: 'number' }
  }, 'table');
  [['R1', 1000], ['R2', 2000], ['R3', 4000], ['R4', 8000]]
    .forEach(([t, b]) => Store.addRow(r.collectionId, { title: t, summe: b }));

  return { seite: s1.id, auftraege: a.collectionId, view: a.viewId, rechnungen: r.collectionId };
});

/* Der Willkommensbildschirm liegt über allem und fängt jeden Klick ab. Er
   wird beim ersten Zeichnen gebaut, also NACH dem Setzen des Merkers oben —
   deshalb hier weg damit, statt sich auf die Einstellung zu verlassen. */
const wegDamit = () => seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await wegDamit();

const zeichne = async (kacheln: any[]) => {
  await seite.evaluate(({ view, kacheln, sid }: any) => {
    Store.updateView(view, { kacheln });
    App.oeffne(sid);
  }, { view: gebaut.view, kacheln, sid: gebaut.seite });
  await seite.waitForTimeout(700);
  await wegDamit();
};

/* Was auf den Karten steht — Wert, Beschriftung, Klassen. */
const karten = () => seite.evaluate(() =>
  [...document.querySelectorAll('.dash-karte')].map(k => ({
    wert: (k.querySelector('.dz-wert') as HTMLElement)?.textContent || '',
    name: (k.querySelector('.dz-name') as HTMLElement)?.textContent || '',
    ziel: (k.querySelector('.dz-ziel') as HTMLElement)?.textContent || '',
    klasse: k.className,
    breite: (k.querySelector('.dz-balken i') as HTMLElement)?.style.width || '',
    griffe: k.querySelectorAll('.dk-griffe button').length
  })));

/* NUR die Kachel-Blöcke. `.dash-block` tragen auch „Zuletzt geändert" und
   „Als Nächstes" — die sind feste Teile des Dashboards und keine Kacheln.
   Die erste Fassung dieser Prüfung zählte sie mit und behauptete deshalb,
   ein Block habe keine Griffe. */
const bloecke = () => seite.evaluate(() =>
  [...document.querySelectorAll('.dash-block.dash-kachel')].map(b => ({
    titel: (b.querySelector('h4') as HTMLElement)?.textContent || '',
    balken: [...b.querySelectorAll('.dash-balken')].map(z => ({
      name: (z.querySelector('.db-name') as HTMLElement)?.textContent || '',
      zahl: (z.querySelector('.db-zahl') as HTMLElement)?.textContent || ''
    })),
    griffe: b.querySelectorAll('.dk-griffe button').length
  })));

/* ==========================================================================
 * §1 · Die eigene Datenbank zählt wie bisher
 * ========================================================================*/
console.log('\n1 · Die eigene Datenbank zählt wie bisher');

await zeichne([{ art: 'anzahl' }, { art: 'summe', key: 'betrag' }]);
const eigen = await karten();
gleich('Zwei Kacheln', eigen.length, 2);
gleich('Anzahl der eigenen Zeilen', eigen[0]?.wert, '3');
gleich('Summe der eigenen Beträge', eigen[1]?.wert, '200');
p('Ohne fremde Quelle steht kein Datenbankname dabei',
  !/Rechnungen/.test(eigen[1]?.name ?? ''), eigen[1]?.name);

/* ==========================================================================
 * §2 · Eine Kachel aus einer FREMDEN Datenbank — der Kern von L17
 * ========================================================================*/
console.log('\n2 · Eine Kachel aus einer fremden Datenbank');

await zeichne([
  { art: 'anzahl' },
  { art: 'anzahl', quelle: gebaut.rechnungen },
  { art: 'summe', key: 'summe', quelle: gebaut.rechnungen }
]);
const fremd = await karten();
gleich('Die eigene Anzahl bleibt 3', fremd[0]?.wert, '3');
gleich('Die fremde Anzahl ist 4 — nicht 3', fremd[1]?.wert, '4');
gleich('Die fremde Summe ist 15000 — nicht 200', fremd[2]?.wert, '15000');
p('Die fremde Kachel nennt ihre Herkunft',
  /Rechnungen/.test(fremd[2]?.name ?? ''), fremd[2]?.name);
/* Die Spalte heisst „Summe" und die Rechenart auch. „Summe · Summe ·
   Offene Rechnungen" stotterte im Bild — heissen sie gleich, steht es
   einmal da. */
gleich('Und stottert nicht, wenn Spalte und Rechenart gleich heissen',
  fremd[2]?.name, 'Summe · Rechnungen');
p('Die eigene nicht', !/Rechnungen/.test(fremd[0]?.name ?? ''), fremd[0]?.name);

/* Eine Quelle, die es nicht mehr gibt, darf nicht werfen — eine gelöschte
   Datenbank ist ein normaler Fall, kein Absturzgrund. */
await zeichne([{ art: 'summe', key: 'summe', quelle: 'gibtesnicht' }]);
const kaputt = await karten();
gleich('Eine verschwundene Quelle gibt 0 statt eines Absturzes', kaputt[0]?.wert, '0');
p('Und die Seite lebt weiter', fehler.length === 0, fehler.join(' · '));

/* ==========================================================================
 * §3 · Die KPI-Karte: eine Zahl gegen ein Ziel
 * ========================================================================*/
console.log('\n3 · Die KPI-Karte');

await zeichne([
  { art: 'kpi', key: 'betrag', ziel: 400, richtung: 'hoch' },    /* 200 von 400 → offen */
  { art: 'kpi', key: 'betrag', ziel: 150, richtung: 'hoch' },    /* 200 von 150 → gut   */
  { art: 'kpi', key: 'betrag', ziel: 400, richtung: 'runter' },  /* 200 unter 400 → gut */
  { art: 'kpi', key: 'betrag', ziel: 150, richtung: 'runter' },  /* 200 über 150 → offen */
  { art: 'kpi', key: 'betrag' }                                  /* ohne Ziel           */
]);
const kpi = await karten();
gleich('Fünf Kennzahlkarten', kpi.length, 5);
gleich('Der Wert ist die Summe', kpi[0]?.wert, '200');

p('200 von 400 ist noch nicht erreicht', /kpi-offen/.test(kpi[0]?.klasse ?? ''), kpi[0]?.klasse);
p('… und sagt 50 %', /50 % von 400/.test(kpi[0]?.ziel ?? ''), kpi[0]?.ziel);
gleich('… und der Balken steht auf 50 %', kpi[0]?.breite, '50%');

p('200 von 150 ist erreicht', /kpi-gut/.test(kpi[1]?.klasse ?? ''), kpi[1]?.klasse);
p('… und trägt den Haken, nicht nur die Farbe (§38)', /✓/.test(kpi[1]?.ziel ?? ''), kpi[1]?.ziel);
gleich('… und der Balken wird bei 100 % gekappt', kpi[1]?.breite, '100%');
p('… die ZAHL sagt trotzdem die Wahrheit', /133 %/.test(kpi[1]?.ziel ?? ''), kpi[1]?.ziel);

p('Eine Obergrenze von 400 wird bei 200 gehalten', /kpi-gut/.test(kpi[2]?.klasse ?? ''), kpi[2]?.klasse);
p('Eine Obergrenze von 150 wird bei 200 gerissen', /kpi-offen/.test(kpi[3]?.klasse ?? ''), kpi[3]?.klasse);
p('… und zeigt nach unten', /▾/.test(kpi[3]?.ziel ?? ''), kpi[3]?.ziel);

p('Ohne Ziel sagt sie das, statt 0 % zu behaupten',
  /Ohne Ziel/.test(kpi[4]?.ziel ?? ''), kpi[4]?.ziel);
gleich('Und zeigt keinen Balken', kpi[4]?.breite, '');
p('Und trägt keine Farbe', !/kpi-(gut|offen)/.test(kpi[4]?.klasse ?? ''), kpi[4]?.klasse);

/* ==========================================================================
 * §4 · Diagrammquelle: summieren statt zählen
 * ========================================================================*/
console.log('\n4 · Diagrammquelle — summieren statt zählen');

await zeichne([{ art: 'verteilung', key: 'ort' }]);
const gezaehlt = await bloecke();
gleich('Ein Block', gezaehlt.length, 1);
gleich('Er heisst „Verteilung nach Ort"', gezaehlt[0]?.titel, 'Verteilung nach Ort');
gleich('Zürich hat 2 Zeilen', gezaehlt[0]?.balken?.[0], { name: 'Zürich', zahl: '2' });
gleich('Bern hat 1', gezaehlt[0]?.balken?.[1], { name: 'Bern', zahl: '1' });

await zeichne([{ art: 'verteilung', key: 'ort', wertKey: 'betrag' }]);
const summiert = await bloecke();
gleich('Jetzt heisst er „Betrag nach Ort"', summiert[0]?.titel, 'Betrag nach Ort');
gleich('Zürich hat 180 Betrag — nicht 2 Zeilen', summiert[0]?.balken?.[0], { name: 'Zürich', zahl: '180' });
gleich('Bern hat 20', summiert[0]?.balken?.[1], { name: 'Bern', zahl: '20' });

/* Die Zahl darf nicht abgeschnitten werden — der Fund aus §55.2, hier
   vorweggenommen: eine Summe hat mehr Stellen als eine Anzahl. */
const passt = await seite.evaluate(() => {
  const z = document.querySelector('.db-zahl') as HTMLElement;
  const cs = getComputedStyle(z);
  return { text: z.textContent || '', wachsen: cs.flexGrow + '/' + cs.flexShrink,
           breite: Math.round(z.getBoundingClientRect().width) };
});
p('Die Zahl darf nicht gestaucht werden', passt.wachsen === '0/0', JSON.stringify(passt));

/* ==========================================================================
 * §5 · Layout: eine Kachel einzeln wegnehmen und verschieben
 * ========================================================================*/
console.log('\n5 · Eine Kachel einzeln wegnehmen und verschieben');

await zeichne([
  { art: 'anzahl' },
  { art: 'summe', key: 'betrag' },
  { art: 'verteilung', key: 'ort' }
]);
const mitGriffen = await karten();
gleich('Jede Kachel hat drei Griffe', mitGriffen.map(k => k.griffe), [3, 3]);
gleich('Auch der Kachel-Block', (await bloecke()).map(b => b.griffe), [3]);
gleich('„Zuletzt geändert" ist keine Kachel und hat keine Griffe',
  await seite.evaluate(() =>
    [...document.querySelectorAll('.dash-block:not(.dash-kachel)')]
      .map(b => ((b.querySelector('h4') as HTMLElement)?.textContent || '') +
                ':' + b.querySelectorAll('.dk-griffe button').length)),
  ['Zuletzt geändert:0']);

/* Nach hinten schieben: aus [anzahl, summe] wird [summe, anzahl]. */
await seite.click('.dash-karte:nth-child(1) [data-g="runter"]');
await seite.waitForTimeout(600);
const geschoben = await karten();
gleich('Die erste Kachel steht jetzt hinten', geschoben.map(k => k.wert), ['200', '3']);
const gespeichert = await seite.evaluate((v: string) =>
  (Store.cache.views[v].kacheln || []).map((k: any) => k.art), gebaut.view);
gleich('Und die Reihenfolge steht in der Ansicht, nicht nur im Bild',
  gespeichert, ['summe', 'anzahl', 'verteilung']);

/* Die vorderste noch weiter nach vorn — geht nicht, und darf nichts kaputt machen. */
await seite.click('.dash-karte:nth-child(1) [data-g="hoch"]');
await seite.waitForTimeout(600);
gleich('Am Anfang tut „nach vorn" nichts',
  await seite.evaluate((v: string) =>
    (Store.cache.views[v].kacheln || []).map((k: any) => k.art), gebaut.view),
  ['summe', 'anzahl', 'verteilung']);

/* Eine einzelne wegnehmen — das ging vor E185 gar nicht. */
await seite.click('.dash-karte:nth-child(1) [data-g="weg"]');
await seite.waitForTimeout(600);
gleich('Eine einzelne Kachel ist weg, die anderen bleiben',
  await seite.evaluate((v: string) =>
    (Store.cache.views[v].kacheln || []).map((k: any) => k.art), gebaut.view),
  ['anzahl', 'verteilung']);

/* ==========================================================================
 * §6 · Der Fuss sagt, wenn Kacheln von woanders kommen
 * ========================================================================*/
console.log('\n6 · Der Fuss sagt, woher die Zahlen kommen');

await zeichne([{ art: 'anzahl' }]);
const fussEigen = await seite.evaluate(() =>
  (document.querySelector('.dash .cal-fuss span') as HTMLElement)?.textContent || '');
p('Nur eigene: kein Wort von anderen Datenbanken',
  /über diese Datenbank/.test(fussEigen), fussEigen);

await zeichne([{ art: 'anzahl' }, { art: 'anzahl', quelle: gebaut.rechnungen }]);
const fussFremd = await seite.evaluate(() =>
  (document.querySelector('.dash .cal-fuss span') as HTMLElement)?.textContent || '');
p('Mit einer fremden: sie wird gezählt und benannt',
  /1 Kachel aus anderen Datenbanken/.test(fussFremd), fussFremd);

await zeichne([
  { art: 'anzahl', quelle: gebaut.rechnungen },
  { art: 'summe', key: 'summe', quelle: gebaut.rechnungen }
]);
const fussZwei = await seite.evaluate(() =>
  (document.querySelector('.dash .cal-fuss span') as HTMLElement)?.textContent || '');
p('Bei zweien steht die Mehrzahl da', /2 Kacheln aus anderen/.test(fussZwei), fussZwei);

/* ==========================================================================
 * §7 · Die Griffe liegen nicht auf der Zahl
 * ------------------------------------------------------------------------
 * Der erste Wurf legte sie absolut oben rechts über den Inhalt. Im Bild
 * stand dann `408000` mit einem Knopf über der letzten Null — lesbar als
 * `40800`. Beide sind gültige Zahlen, nur eine ist die richtige, und keine
 * Prüfung konnte das ahnen. Es ist derselbe Fund wie in CLAUDE.md §55.2,
 * und deshalb steht er jetzt hier.
 *
 * GEMESSEN WIRD DER TEXT, NICHT DIE ELEMENT-BOX. Eine Überschrift ist ein
 * Block und reicht immer bis zum Rand, auch wenn ihr Text bei der Hälfte
 * endet — die erste Fassung dieser Messung behauptete deshalb eine
 * Überlappung, die es nicht gab.
 * ========================================================================*/
console.log('\n7 · Die Griffe liegen nicht auf dem Inhalt');

/* EINE ZAHL, DIE WIRKLICH ANSTÖSST. Die erste Fassung dieses Abschnitts
   nahm die vorhandenen Zeilen — Summe 200. Drei Zeichen stossen an nichts
   an, und die Gegenprobe (Griffe zurück auf den Inhalt) blieb GRÜN: der
   Abschnitt mass nichts. Jetzt steht eine zehnstellige Zahl da, und die
   Gegenprobe wird rot. */
await seite.evaluate((c: string) => {
  Store.addRow(c, { title: 'Grossauftrag', ort: 'Zürich', betrag: 1234567890 });
  /* Und eine Spalte mit langem Namen — sonst bleibt die ÜBERSCHRIFT der
     Verteilung mit „Betrag nach Ort" bei 92 px und stösst an nichts an.
     Die Gegenprobe machte deshalb nur die zwei Karten rot, nie den Block:
     `padding-right` am `h4` wäre ungeprüft geblieben. */
  const slg = Store.getCollection(c);
  Store.updateCollection(c, { schema: { ...slg.schema,
    ort: { ...slg.schema.ort, name: 'Verantwortliche Vertriebsregion' } } });
}, gebaut.auftraege);
await zeichne([
  { art: 'summe', key: 'betrag' },
  { art: 'kpi', key: 'betrag', ziel: 500, richtung: 'hoch' },
  { art: 'verteilung', key: 'ort', wertKey: 'betrag' }
]);
await seite.evaluate(() => {
  document.querySelectorAll('.dk-griffe').forEach(g => (g as HTMLElement).style.opacity = '1');
});
const lagen = await seite.evaluate(() => {
  const raus: any[] = [];
  document.querySelectorAll('.dash-kachel').forEach(k => {
    const g = k.querySelector('.dk-griffe') as HTMLElement;
    const inhalt = (k.querySelector('.dz-wert') || k.querySelector('h4')) as HTMLElement;
    if (!g || !inhalt) return;
    const gr = g.getBoundingClientRect();
    const r2 = document.createRange(); r2.selectNodeContents(inhalt);
    const ir = r2.getBoundingClientRect();
    raus.push({
      text: (inhalt.textContent || '').slice(0, 24),
      ueber: !(ir.right <= gr.left || ir.left >= gr.right ||
               ir.bottom <= gr.top || ir.top >= gr.bottom),
      breit: Math.round(ir.width), griffe: Math.round(gr.width)
    });
  });
  return raus;
});
gleich('Drei Kacheln gemessen', lagen.length, 3);
p('Die Griffe sind wirklich da und breit genug zum Treffen',
  lagen.every((x: any) => x.griffe >= 66), JSON.stringify(lagen.map((x: any) => x.griffe)));
/* JEDE der drei muss breit genug sein. `some` reichte nicht: die
   Überschrift war breit, die zwei Zahlen waren es nicht, und der
   Abschnitt war grün, ohne die Karten zu prüfen. */
/* JEDE der drei muss breit genug sein, nicht irgendeine. `some` reichte
   nicht: die Überschrift war breit, die zwei Zahlen waren es nicht, und
   der Abschnitt war grün, ohne die Karten zu prüfen. 60 px ist die Grenze
   — die alte Fassung mit „200" lag bei 45 und wäre damit aufgefallen. */
p('JEDER Inhalt ist breit genug, um anzustossen — sonst misst das nichts',
  lagen.every((x: any) => x.breit > 60), JSON.stringify(lagen.map((x: any) => x.breit)));
lagen.forEach((x: any) => p('„' + x.text + '" liegt frei', !x.ueber, JSON.stringify(x)));

/* DIE ÜBERSCHRIFT STÖSST ERST AM TELEFON AN. Am Rechner ist der Block 530 px
   breit; eine Überschrift von 280 px erreicht die Griffe gar nicht, und die
   Gegenprobe machte deshalb nur die zwei Karten rot. Bei 390 px Breite ist
   der Block schmal genug — dort wird `padding-right` am `h4` wirklich
   gebraucht, und dort wird es gemessen. */
/* DIESELBE SEITE schmaler machen, statt eine neue zu öffnen. `newPage()`
   am Browser legt einen NEUEN Kontext mit eigener IndexedDB an — die erste
   Fassung stand deshalb vor einem leeren Arbeitsbereich und fand den Block
   gar nicht. Derselbe Fund wie in test231. */
await seite.setViewportSize({ width: 390, height: 844 });
await seite.evaluate((sid: string) => App.oeffne(sid), gebaut.seite);
await seite.waitForTimeout(900);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await seite.evaluate(() =>
  document.querySelectorAll('.dk-griffe').forEach(g => (g as HTMLElement).style.opacity = '1'));
const handy = await seite.evaluate(() => {
  const b = document.querySelector('.dash-block.dash-kachel') as HTMLElement;
  if (!b) return null;
  const g = b.querySelector('.dk-griffe') as HTMLElement;
  const h = b.querySelector('h4') as HTMLElement;
  const gr = g.getBoundingClientRect();
  const r2 = document.createRange(); r2.selectNodeContents(h);
  const ir = r2.getBoundingClientRect();
  return { text: (h.textContent || '').slice(0, 24), breit: Math.round(ir.width),
           blockBreit: Math.round(b.getBoundingClientRect().width),
           griffeSichtbar: getComputedStyle(g).opacity,
           ueber: !(ir.right <= gr.left || ir.left >= gr.right ||
                    ir.bottom <= gr.top || ir.top >= gr.bottom) };
});
await seite.setViewportSize({ width: 1280, height: 900 });
p('Am Telefon gibt es den Block auch', !!handy, JSON.stringify(handy));
p('… und der Block ist schmal genug, dass die Überschrift anstösst',
  (handy?.blockBreit ?? 999) < 400, JSON.stringify(handy));
p('… die Überschrift bricht um und liegt frei', handy?.ueber === false, JSON.stringify(handy));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
