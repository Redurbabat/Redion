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
 *   §1 Drei Orte plus „Mehr Orte" stehen oben in der Kante, ohne einen
 *      Klick (ruhiger Modus, seit 6. September); Heute, Elektrotechnik und
 *      Aufgaben sind Hauptwege mit `ruhig: false` und liegen dahinter.
 *   §2 Sie kommen aus dem Register und nicht aus einer zweiten Liste.
 *   §3 „Mehr Orte" öffnet die Lade mit allem Übrigen — die drei
 *      Verborgenen eingeschlossen.
 *   §4 Ein Klick auf einen Ort führt wirklich dorthin — und der Ort, an
 *      dem man steht, ist markiert. Und NUR er.
 *   §5 Nichts wird abgeschnitten: was nicht passt, steht hinter „···".
 *      Und wenn alles passt, gibt es kein „···" — gemessen an der alten
 *      Leiste ohne ruhigen Modus, wo das Falten weiterhin gilt.
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
 * §1 · Wenige Orte stehen da, ohne einen Klick — und der Rest ist erreichbar
 * --------------------------------------------------------------------------
 * SEIT DEM 6. SEPTEMBER SIND ES DREI PLUS „MEHR ORTE", NICHT FÜNF PLUS EINS.
 * Redur: „Nicht 20 Bereiche gleichzeitig." Die Leiste zeigt im ruhigen
 * Modus die Wege, die man täglich geht — Bibliothek, Notizhefte,
 * Lernzentrum —, und Heute, Elektrotechnik und Aufgaben tragen im Register
 * `ruhig: false`: sie bleiben Hauptwege, stehen aber hinter „Mehr Orte".
 *
 * WAS DIESER ABSCHNITT DESHALB ZWEIMAL PRÜFT: dass die Leiste wenig zeigt
 * UND dass nichts verschwunden ist. Eine Zählung allein hielte das
 * Zweite nicht — drei Knöpfe sind auch dann drei, wenn die drei anderen
 * nirgends mehr stehen.
 * ======================================================================== */
console.log('\n1 · Drei Orte plus „Mehr Orte" stehen oben in der Kante');
const a: any = await pc.evaluate(ORTE);
p('Die Kante hat einen Abschnitt für Orte', !a.fehlt && a.orte.length > 0,
  JSON.stringify(a).slice(0, 90));
p('Der ruhige Modus ist von Haus aus an', await pc.evaluate('Ruhig.an()'));

const SOLL = ['Bibliothek', 'Notizhefte', 'Lernzentrum'];
const HINTER_MEHR = ['Heute', 'Elektrotechnik', 'Aufgaben'];
const namen: string[] = (a.orte || []).map((x: any) => x.name);
for (const n of SOLL) p(`„${n}" steht ohne einen Klick da`, namen.includes(n), namen.join(' | '));
for (const n of HINTER_MEHR) p(`„${n}" steht NICHT in der Leiste — er liegt hinter „Mehr Orte"`,
  !namen.includes(n), namen.join(' | '));
p('Und „Mehr Orte" als vierter', namen.includes('Mehr Orte'), namen.join(' | '));
gleich('Genau vier Knöpfe — drei Orte und „Mehr"', a.orte.length, 4);
gleich('… in der Folge des Registers (hauptRang)', namen, [...SOLL, 'Mehr Orte']);
p('Alle vier sind im Bild', (a.orte || []).every((x: any) => x.drin),
  JSON.stringify((a.orte || []).filter((x: any) => !x.drin)));

/* ==========================================================================
 * §2 · Aus dem Register, nicht aus einer zweiten Liste
 * --------------------------------------------------------------------------
 * WARUM DAS EIN EIGENER ABSCHNITT IST. Die Fünf gab es vor E388 dreimal:
 * als `data-ruhig="bleibt"` im Markup, als Liste in der unteren
 * Telefonleiste und als SOLL in test248 — und zwei davon waren VERSCHIEDEN.
 * Diese Zeile prüft, dass die Leiste wirklich das Register liest: wer
 * `haupt: true` dort wegnimmt, muss den Knopf verlieren; wer `ruhig: false`
 * wegnimmt, muss ihn bekommen.
 * ======================================================================== */
console.log('\n2 · Die Orte kommen aus dem Register');
const ausRegister: any = await pc.evaluate(`(() => {
  try {
    const r = (Register.navigation.alle() || [])
      .filter(e => e && e.haupt === true)
      .sort((x, y) => (x.hauptRang ?? x.rang) - (y.hauptRang ?? y.rang));
    return { zahl: r.length, namen: r.map(e => e.name),
             ruhig: r.filter(e => e.ruhig !== false).map(e => e.name),
             hinterMehr: r.filter(e => e.ruhig === false).map(e => e.name) };
  } catch (e) { return { fehler: String(e) }; }
})()`);
gleich('Das Register führt sechs Hauptwege', ausRegister.zahl, 6);
gleich('… drei davon für die ruhige Leiste, und es sind dieselben wie in der Leiste',
  ausRegister.ruhig, namen.filter((n: string) => n !== 'Mehr Orte'));
gleich('… und drei mit `ruhig: false`', (ausRegister.hinterMehr || []).slice().sort(),
  HINTER_MEHR.slice().sort());

/* ==========================================================================
 * §3 · „Mehr Orte" öffnet die Lade — mit den drei Verborgenen darin
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
p('Keiner der drei Leistenorte steht doppelt darin',
  SOLL.every(n => !(lade.namen || []).includes(n)),
  (lade.namen || []).filter((n: string) => SOLL.includes(n)).join(' | '));
/* DER PUNKT, DER „NICHTS LÖSCHEN" HÄLT: die drei mit `ruhig: false`
   stehen genau hier — sonst wären sie nirgends. */
gleich('Heute, Elektrotechnik und Aufgaben stehen in der Lade',
  HINTER_MEHR.filter(n => !(lade.namen || []).includes(n)), []);
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

await pc.click('.k-knopf[data-k="lernzentrum"]');
await pc.waitForTimeout(1200);
const nachher: any = await pc.evaluate(`(() => ({
  schauplatz: App.schauplatz(),
  laenge: ((document.querySelector('#main') || document.body).textContent || '').length
}))()`);
/* `App.schauplatz()` sagt für Heute UND Lernzentrum „heute" — beide
   Ansichten heissen so (E393). Was sie unterscheidet, ist die ADRESSE;
   genau deshalb steht sie im Register. */
gleich('Nach dem Klick steht man im Lernzentrum', await pc.evaluate('location.hash'), '#welt-lernen-lernen');
p('Und der Inhalt hat sich wirklich geändert', nachher.laenge !== vorher.laenge,
  `vorher ${vorher.laenge}, nachher ${nachher.laenge}`);

const b: any = await pc.evaluate(ORTE);
const markiert = (b.orte || []).filter((x: any) => x.hier);
gleich('Genau ein Ort ist markiert', markiert.length, 1);
gleich('… und zwar „Lernzentrum"', markiert[0]?.name, 'Lernzentrum');
gleich('Er trägt aria-current (§38)', markiert[0]?.aria, 'page');

/* WER HINTER „MEHR ORTE" STEHT, LEUCHTET DORT. Der Weg nach „Heute" geht
   wie beim Menschen über die Lade — und danach ist „Mehr Orte" der eine
   markierte Knopf: er ist der, der dorthin führt. */
await pc.click('.k-knopf[data-k="mehr-orte"]');
await pc.waitForTimeout(500);
await pc.evaluate(`(() => {
  const z = Array.from(document.querySelectorAll('#kanten-lade .kl-zeile'))
    .find(x => ((x.querySelector('b') || {}).textContent || '').trim() === 'Heute');
  if (!z) throw new Error('„Heute" steht nicht in der Lade.');
  z.click();
})()`);
await pc.waitForTimeout(1200);
gleich('Über die Lade steht man auf „heute"', await pc.evaluate('App.schauplatz()'), 'heute');
const c0: any = await pc.evaluate(ORTE);
gleich('… und genau „Mehr Orte" leuchtet — der Knopf, der dorthin führt',
  (c0.orte || []).filter((x: any) => x.hier).map((x: any) => x.id), ['mehr-orte']);

/* Die GEGENPROBE, ohne die die Markierung nichts sagt: an einem Ort, der
   keiner der Hauptwege ist, darf KEINER markiert sein — auch nicht „Mehr
   Orte". Eine Markierung, die immer irgendwo steht, sagt nichts (§55.1). */
await pc.evaluate(`(() => { Register.navigation.eines('posteingang')?.tun?.(); })()`);
await pc.waitForTimeout(1100);
const c: any = await pc.evaluate(ORTE);
gleich('GEGENPROBE: im Posteingang ist keiner markiert, auch „Mehr Orte" nicht',
  (c.orte || []).filter((x: any) => x.hier).length, 0);

/* ==========================================================================
 * §5 · Nichts wird abgeschnitten
 * --------------------------------------------------------------------------
 * ZWEI FASSUNGEN, ZWEI MESSUNGEN. Im ruhigen Modus stehen im mittleren
 * Abschnitt absichtlich nur „Seiten" und „Werkzeuge" — die Lade dahinter
 * trägt alle Griffe des Ortes (test430). Das Falten selbst — bei 900 px
 * passt alles, bei 720 px nicht — wird an der ALTEN Leiste gemessen, die
 * es ohne ruhigen Modus weiterhin gibt. Eine Regel, die nur noch im
 * Zustand mit zwei Knöpfen gemessen wird, wäre nie mehr rot (§55.2).
 * ======================================================================== */
console.log('\n5 · Was nicht passt, steht hinter „···" — und sonst nicht');
gleich('Ruhig: der mittlere Abschnitt trägt genau „Seiten" und „Werkzeuge"',
  (b.werkzeuge || []).map((x: any) => x.id), ['seiten', 'mehr-werkzeuge']);
await pc.evaluate(`(() => { Register.navigation.eines('heute')?.tun?.(); })()`);
await pc.waitForTimeout(900);
const ruhigWerkzeuge: any = await pc.evaluate(`(() => {
  const w = document.querySelector('.k-knopf[data-k="mehr-werkzeuge"]');
  if (!w) return { fehlt: true };
  w.click();
  const l = document.getElementById('kanten-lade');
  const inLade = Array.from(l ? l.querySelectorAll('.kl-koerper .kl-zeile') : []).length;
  const soll = (Register.kontext.fuer(Kontextkante.bereichJetzt()) || []).length + 1; /* + KI */
  document.querySelector('#kanten-lade .kl-zu')?.click();
  return { inLade, soll };
})()`);
gleich('Ruhig: die Werkzeuglade trägt alle Griffe des Ortes plus die KI',
  ruhigWerkzeuge.inLade, ruhigWerkzeuge.soll);

/* Ohne ruhigen Modus: die alte Leiste, sechs Orte, und das Falten. */
await pc.evaluate(`Store.setMeta('ruhig', false)`);
await pc.setViewportSize({ width: 1360, height: 900 });
await pc.reload();
await pc.waitForTimeout(3500);
await pc.evaluate(AUFRAEUMEN);
await pc.waitForTimeout(700);
const alt: any = await pc.evaluate(ORTE);
p('Ohne Ruhe: der ruhige Modus ist aus', !(await pc.evaluate('Ruhig.an()')));
gleich('Ohne Ruhe: sechs Orte plus „Mehr Orte"', alt.orte.length, 7);
gleich('… und es sind alle sechs Hauptwege',
  (alt.orte || []).map((x: any) => x.name).filter((n: string) => n !== 'Mehr Orte').slice().sort(),
  [...SOLL, ...HINTER_MEHR].slice().sort());
gleich('Bei 900 px Höhe rollt nichts', alt.ueberlauf, 0);
p('… und es gibt keinen Überlaufknopf',
  !(alt.werkzeuge || []).some((x: any) => x.id === 'mehr-werkzeuge'),
  (alt.werkzeuge || []).map((x: any) => x.name).join(' | '));
p('Alle Werkzeuge sind im Bild', (alt.werkzeuge || []).every((x: any) => x.drin),
  JSON.stringify((alt.werkzeuge || []).filter((x: any) => !x.drin)));

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
/* Gezählt wird im REGISTER, nicht in der Leiste: mit sieben Orten darüber
   sind bei 720 px schon drei Knöpfe gefaltet, und die gefaltete Leiste
   zeigt die Zahl, die sie zeigen soll — nicht die, die gemessen werden
   soll. */
const imRegister: number = await pc.evaluate(
  `(Register.kontext.fuer(Kontextkante.bereichJetzt()) || []).length`);
p('Der Startbildschirm bringt genug Werkzeuge mit, dass etwas überlaufen KANN',
  imRegister >= 5, imRegister + ' im Register — ' +
  (d.werkzeuge || []).map((x: any) => x.name).join(' | '));
p('Bei 720 px Höhe steht der Überlaufknopf da',
  (d.werkzeuge || []).some((x: any) => x.id === 'mehr-werkzeuge'),
  (d.werkzeuge || []).map((x: any) => x.name).join(' | '));
p('Er sagt, wie viele dahinter liegen',
  /^\d+ weitere[s]? Werkzeug/.test(
    (d.werkzeuge || []).find((x: any) => x.id === 'mehr-werkzeuge')?.name || ''),
  (d.werkzeuge || []).find((x: any) => x.id === 'mehr-werkzeuge')?.name || '(keiner)');
gleich('Und es rollt trotzdem nichts', d.ueberlauf, 0);
p('Alle sieben Orte stehen weiterhin im Bild',
  (d.orte || []).length === 7 && (d.orte || []).every((x: any) => x.drin),
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
/* Zurück in den ruhigen Modus, damit §7 und §6 den Normalfall messen. */
await pc.evaluate(`Store.setMeta('ruhig', true)`);

/* ==========================================================================
/* ==========================================================================
 * §7 · „Gehen" hat das Band verlassen — und nichts ist dabei verlorengegangen
 * --------------------------------------------------------------------------
 * DER REST VON F02. Die Orte standen seit E272 Phase E im Reiter „Gehen"
 * UND seit E388 in der linken Leiste — zwei Wege zum selben Ziel, und genau
 * das nennt der Prüfbericht „vier Navigationslogiken nebeneinander".
 *
 * DIE GEFAHR BEIM WEGNEHMEN war nicht der Reiter, sondern die SECHS
 * EINTRÄGE des schon früher aufgelösten Reiters „Werkzeuge" — Journal,
 * Schnellnotizen, Vorlagen, Zeitmesser, Agenten, Besprechungen. Sie wohnen
 * unter `reiter: 'gehen'` und wären mit dem Reiter unerreichbar geworden.
 * Deshalb prüft dieser Abschnitt beides: dass der Reiter weg ist UND dass
 * die Einträge stehen.
 * ======================================================================== */
console.log('\n7 · „Gehen" ist aus dem Band raus, die Orte sind vollzählig');
await pc.setViewportSize({ width: 1360, height: 900 });
await pc.reload();
await pc.waitForTimeout(3500);
await pc.evaluate(AUFRAEUMEN);
await pc.waitForTimeout(500);

const band: any = await pc.evaluate(`(() => {
  const reiter = (Register.menueband.reiter() || []).map(r => r.id);
  const orte = Register.menueband.orte() || [];
  const alle = [];
  for (const g of orte) for (const e of (g.eintraege || [])) alle.push(String(e.id));
  return { reiter, gruppen: orte.length, zahl: alle.length, alle };
})()`);
p('„Gehen" ist kein Reiter des Bandes mehr', !band.reiter.includes('gehen'),
  band.reiter.join(', '));
p('Und im DOM steht auch keiner',
  await pc.evaluate(`!document.querySelector('[data-mb-reiter="gehen"]')`));
p('Das Band trägt nur noch dokumentbezogene Reiter',
  band.reiter.every((r: string) =>
    ['start', 'einfuegen', 'zeichnen', 'verlauf', 'ueberpruefen',
     'ansicht', 'hilfe'].includes(r)),
  band.reiter.join(', '));

/* DIE GEGENRICHTUNG, und sie ist die wichtigere: die Liste selbst lebt. */
p('`orte()` liefert weiterhin über vierzig Ziele', band.zahl > 40, String(band.zahl));
const SECHS = ['w-journal', 'w-memos', 'w-vorlagen', 'w-zeit', 'w-agenten', 'w-bespr'];
gleich('Die sechs aus dem aufgelösten Reiter „Werkzeuge" sind alle da',
  SECHS.filter(id => !band.alle.includes(id)), []);

/* Und wirklich in der Lade, nicht nur im Register. */
await pc.click('.k-knopf[data-k="mehr-orte"]');
await pc.waitForTimeout(700);
const inLade: string[] = await pc.evaluate(
  `Array.from(document.querySelectorAll('#kanten-lade .kl-zeile b')).map(b => b.textContent.trim())`);
gleich('… und stehen auch wirklich in der Lade',
  ['Journal', 'Schnellnotizen', 'Vorlagen', 'Zeitmesser', 'Agenten', 'Besprechungen']
    .filter(n => !inLade.includes(n)), []);
await pc.evaluate(`document.querySelector('#kanten-lade .kl-zu, #kanten-lade button')?.click()`);
await pc.waitForTimeout(300);

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
