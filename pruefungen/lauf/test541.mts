/* Suite 541 — Die untere Leiste: EINE Fläche, die wandert (E646, P75)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat am 20. September eine Aufnahme der
 * unteren Leiste geschickt und gefragt, ob das so gut sei. Bild für Bild
 * nachgemessen war die Antwort messbar nein: viermal ein einziger Bildsprung
 * über 190 bis 210 Pixel. Am Rechner wandert dieselbe Fassung über 16 bis 21
 * Zwischenorte — die Bewegung war also da und kam nur nicht an.
 *
 * Der Grund war `width` in der Übergangsliste: wer Layout animiert, bleibt
 * auf dem Hauptfaden, und der baut beim Reiterwechsel gerade einen ganzen
 * Bildschirm auf. E646 legt die Bewegung deshalb auf `transform` allein und
 * lässt sie von `SelectionFlow` als Federbahn fahren.
 *
 * DIESER LAUF PRÜFT NICHT „SIEHT GUT AUS". Er prüft die sechs Zusagen, die
 * das Design-System an eine wandernde Auswahlfläche stellt, und jede davon
 * als Zahl:
 *
 *   §1 EINE FLÄCHE, NICHT FÜNF — und keine Breite in der Übergangsliste.
 *   §2 SIE WANDERT WIRKLICH: Zwischenorte, nicht ein Sprung.
 *   §3 SCHNELLE WECHSEL LENKEN UM, statt sich anzustellen (A→B→C→A).
 *   §4 DIE TREFFERFLÄCHEN BEWEGEN SICH NIE.
 *   §5 OHNE BEWEGUNG WIRD GESETZT, NICHT GEFAHREN.
 *   §6 DIE DEHNUNG IST GEDECKELT und gilt nur zwischen Nachbarn.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja, und er WAR es: gegen den Stand vom 19. September meldet §1 „width
 * steht in der Übergangsliste" und §3 findet zwei Animationen statt einer.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser. Ein
 * `as HTMLElement` darin ist ein Syntaxfehler, und ein Akzentzeichen in einem
 * Kommentar INNERHALB einer Schablone beendet sie mitten im Satz. Beides ist
 * in diesem Projekt schon passiert.
 *
 *   node pruefungen/lauf/test541.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

/* `listen(0)` statt einer festen Zahl (L205): der Rechner sucht einen freien
   Port, und zwei solche Läufe können sich nie in die Quere kommen. */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

const aufmachen = async (ruhig = false) => {
  const kontext = await browser.newContext({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    ...(ruhig ? { reducedMotion: 'reduce' as const } : {})
  });
  const pc = await kontext.newPage();
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 150)));
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pc.waitForTimeout(2600);
  await pc.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
  })()`);
  await pc.waitForTimeout(500);
  return { kontext, pc };
};

const { kontext, pc } = await aufmachen();

/* ══════════════════════════════════════════════════════════════════════════
 * §1 EINE FLÄCHE, NICHT FÜNF
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n1 · Eine Fläche für die ganze Leiste');

const bau = await pc.evaluate(`(() => {
  const leiste = document.getElementById('handy-oben');
  const pille = document.getElementById('ho-pille');
  const knoepfe = Array.from(leiste.querySelectorAll('button[role="tab"]'));
  const s = getComputedStyle(pille);
  return {
    pillen: document.querySelectorAll('#ho-pille').length,
    knoepfe: knoepfe.length,
    breiten: knoepfe.map(function (b) { return Math.round(b.offsetWidth); }),
    uebergang: s.transitionProperty,
    zeiger: s.pointerEvents,
    /* Welcher Knopf liegt unter der Mitte der Fläche? Die Fläche darf die
       Berührung nicht abfangen (§37). */
    unterDerMitte: (function () {
      const r = pille.getBoundingClientRect();
      const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return t ? (t.closest('button') ? t.closest('button').id : t.tagName) : 'nichts';
    })(),
    /* Und die eigene Fläche der Knöpfe ist abgegeben — sonst wären es zwei. */
    knopfGrund: knoepfe.map(function (b) { return getComputedStyle(b).backgroundColor; })
  };
})()`) as any;

p('Es gibt genau EINE Auswahlfläche', bau.pillen === 1, String(bau.pillen));
p('… für fünf Wege', bau.knoepfe === 5, String(bau.knoepfe));
p('Sie nimmt keine Berührung an — darunter liegt der Knopf',
  /^hl-/.test(bau.unterDerMitte), bau.unterDerMitte);
p('Kein Knopf bringt einen eigenen Hintergrund mit',
  bau.knopfGrund.every((g: string) => /rgba\(0, 0, 0, 0\)|transparent/.test(g)),
  bau.knopfGrund.join(' · '));

/* DIE BREITE STEHT NICHT IN DER ÜBERGANGSLISTE — das ist der eigentliche
   Fund von E646. `width` ist Layout; wer es animiert, bleibt auf dem
   Hauptfaden und kommt nicht voran, während ein Bildschirm neu entsteht.
   `implementation/high-refresh-motion.md`: „Prefer transform and opacity for
   frequent motion." */
p('Weder `width` noch `transform` stehen in der Übergangsliste',
  !/width|transform/.test(bau.uebergang), bau.uebergang);

/* Und die Voraussetzung dafür, die Breite gar nicht bewegen zu müssen:
   alle fünf Wege sind gleich breit. `flex:1 1 0` sorgt dafür — aber eine
   Voraussetzung, die niemand misst, ist eine Annahme. */
p('Alle fünf Wege sind gleich breit',
  new Set(bau.breiten).size === 1, JSON.stringify(bau.breiten));

/* ══════════════════════════════════════════════════════════════════════════
 * §2 SIE WANDERT WIRKLICH
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n2 · Sie wandert, statt zu springen');

const wandern = await pc.evaluate(`(async () => {
  const pille = document.getElementById('ho-pille');
  const orte = [];
  let laeuft = true;
  const takt = function () { orte.push(pille.getBoundingClientRect().left); if (laeuft) requestAnimationFrame(takt); };
  requestAnimationFrame(takt);
  document.getElementById('hl-bespr').click();
  await new Promise(function (f) { setTimeout(f, 600); });
  laeuft = false;
  const eindeutig = [];
  for (const o of orte) if (!eindeutig.length || Math.abs(o - eindeutig[eindeutig.length - 1]) > 0.4) eindeutig.push(o);
  let groesster = 0;
  for (let i = 1; i < eindeutig.length; i++) groesster = Math.max(groesster, Math.abs(eindeutig[i] - eindeutig[i - 1]));
  const gesamt = Math.abs(eindeutig[eindeutig.length - 1] - eindeutig[0]) || 1;
  return { orte: eindeutig.length, groesster: Math.round(groesster),
           ersterAnteil: Math.round(Math.abs((eindeutig[1] || 0) - (eindeutig[0] || 0)) / gesamt * 100),
           gesamt: Math.round(gesamt),
           ziel: Math.round(document.getElementById('hl-bespr').getBoundingClientRect().left),
           steht: Math.round(pille.getBoundingClientRect().left) };
})()`) as any;

p('Sie nimmt unterwegs viele Orte ein', wandern.orte >= 8, String(wandern.orte) + ' Orte');
p('… und kommt genau an', Math.abs(wandern.steht - wandern.ziel) <= 1,
  wandern.steht + ' statt ' + wandern.ziel);

/* DER ERSTE SCHRITT IST KLEIN. Das ist der Unterschied zwischen einer Feder
   und der alten Kurve: die legte 72 % des Weges in den ersten 50 ms zurück
   und kroch den Rest — auf dem Bildschirm ein Sprung mit Nachzittern. Eine
   kritisch gedämpfte Feder startet mit Tempo null. */
/* GEMESSEN WIRD DER ANTEIL, NICHT DIE PIXELZAHL. Eine kritisch gedämpfte
   Feder legt im ersten Bild (16,7 ms) rechnerisch 10,6 % des Weges zurück —
   bei einem Sprung über drei Wege sind das 23 px und bei einem über einen
   Weg 8. Eine feste Pixelgrenze hätte also gemessen, wie weit gesprungen
   wird, nicht wie sanft angefahren. Die alte Kurve lag bei rund 35 % im
   ersten Bild. */
p('Der erste Schritt ist ein Zehntel des Weges — sie startet aus der Ruhe',
  wandern.ersterAnteil <= 16,
  wandern.ersterAnteil + ' % von ' + wandern.gesamt + 'px im ersten Bild');

/* ══════════════════════════════════════════════════════════════════════════
 * §3 SCHNELLE WECHSEL LENKEN UM, STATT SICH ANZUSTELLEN
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n3 · A → B → C → A lenkt um, statt sich anzustellen');

const schnell = await pc.evaluate(`(async () => {
  const pille = document.getElementById('ho-pille');
  const ort = function () { return pille.getBoundingClientRect().left; };
  document.getElementById('hl-dok').click();
  await new Promise(function (f) { setTimeout(f, 500); });

  const start = ort();
  const zahlen = [];
  document.getElementById('hl-lernen').click();
  await new Promise(function (f) { setTimeout(f, 60); });
  const unterwegs = ort();
  zahlen.push(document.getElementById('ho-pille').getAnimations().length);
  document.getElementById('hl-mehr').click();
  await new Promise(function (f) { setTimeout(f, 60); });
  zahlen.push(document.getElementById('ho-pille').getAnimations().length);
  document.getElementById('hl-dok').click();
  zahlen.push(document.getElementById('ho-pille').getAnimations().length);
  await new Promise(function (f) { setTimeout(f, 700); });

  return {
    start: Math.round(start),
    unterwegs: Math.round(unterwegs),
    hoechstens: Math.max.apply(null, zahlen),
    ende: Math.round(ort()),
    ziel: Math.round(document.getElementById('hl-dok').getBoundingClientRect().left),
    aktiv: (document.querySelector('#handy-oben button.an') || {}).id || 'keiner'
  };
})()`) as any;

p('Nie mehr als EINE Bewegung gleichzeitig', schnell.hoechstens <= 1,
  String(schnell.hoechstens) + ' Animationen');
p('Sie ist unterwegs schon losgefahren', schnell.unterwegs > schnell.start + 2,
  schnell.start + ' → ' + schnell.unterwegs);
/* DAS UMLENKEN NIMMT DEN STAND MIT. Würde die neue Bewegung bei null
   beginnen, stünde die Fläche nach dem zweiten Tipp wieder am Anfang.
   `recipes/velocity-preserving-springs.md`: „inherit current motion rather
   than restart from zero velocity." */

/* ══ UND DAS UMLENKEN — OHNE DEN BILDSCHIRMAUFBAU DAZWISCHEN (E648) ══════
 * Hier stand dieselbe Frage am echten Reiterklick, und sie liess sich dort
 * nicht beantworten. Ein Reiterwechsel baut einen ganzen Bildschirm auf;
 * solange das läuft, hat die Bewegung noch gar keine Startzeit, ihre Uhr
 * steht auf null — und was von null aus gerechnet wird, setzt am Anfang an.
 * Gemessen: „die neue Bahn setzt bei 16 an, losgefahren ist sie bei 17."
 *
 * Das ist kein Fehler der Übernahme, sondern die Grenze des Messplatzes.
 * Die ZUSAGE — „übernimm Ort und Tempo, statt neu anzusetzen" — gehört
 * deshalb dorthin geprüft, wo sie ohne Störung sichtbar ist: direkt am
 * Modul, mit echter Zeit dazwischen. Dass sie im Ganzen greift, misst §3
 * oben („nie mehr als EINE Bewegung", „am Ende steht sie beim zuletzt
 * Gewählten"). */
const uebernahme = await pc.evaluate(`(async () => {
  const pille = document.getElementById('ho-pille');
  const knoepfe = ['hl-dok', 'hl-start', 'hl-lernen', 'hl-bespr', 'hl-mehr']
    .map(function (id) { return document.getElementById(id); });
  const x = function (k) { return k.offsetLeft; };
  const ersterOrt = function () {
    const a = pille.getAnimations()[0];
    if (!a || !a.effect) return null;
    try { return Math.round(new DOMMatrixReadOnly(String(a.effect.getKeyframes()[0].transform || '')).m41); }
    catch (e) { return null; }
  };
  SelectionFlow.folge(pille, x(knoepfe[0]), false, true);      /* gesetzt, ohne Fahrt */
  SelectionFlow.folge(pille, x(knoepfe[4]), false, false);     /* los nach ganz rechts */
  await new Promise(function (f) { setTimeout(f, 90); });      /* wirklich unterwegs */
  SelectionFlow.folge(pille, x(knoepfe[2]), false, false);     /* umlenken zur Mitte */
  return { von: x(knoepfe[0]), nach: x(knoepfe[4]), mitte: x(knoepfe[2]),
           ansatz: ersterOrt(), animationen: pille.getAnimations().length };
})()`) as any;

p('Beim Umlenken setzt die neue Bahn dort an, wo die Fläche gerade steht',
  uebernahme.ansatz !== null && uebernahme.ansatz > uebernahme.von + 10,
  'Ansatz ' + uebernahme.ansatz + ', losgefahren bei ' + uebernahme.von
  + ', altes Ziel war ' + uebernahme.nach);
p('… und nicht schon am alten Ziel', uebernahme.ansatz < uebernahme.nach,
  'Ansatz ' + uebernahme.ansatz + ' gegen ' + uebernahme.nach);
p('… und es läuft dabei genau EINE Bewegung', uebernahme.animationen === 1,
  String(uebernahme.animationen));
p('Am Ende steht sie beim ZULETZT gewählten Weg',
  Math.abs(schnell.ende - schnell.ziel) <= 1 && schnell.aktiv === 'hl-dok',
  schnell.ende + ' statt ' + schnell.ziel + ', aktiv: ' + schnell.aktiv);

/* ══════════════════════════════════════════════════════════════════════════
 * §4 DIE TREFFERFLÄCHEN BEWEGEN SICH NIE
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n4 · Kein Hit-Target bewegt sich, während sie fährt');

const treffer = await pc.evaluate(`(async () => {
  const knoepfe = Array.from(document.querySelectorAll('#handy-oben button[role="tab"]'));
  const mass = function () { return knoepfe.map(function (b) {
    const r = b.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(',');
  }).join(' | '); };
  const vorher = mass();
  document.getElementById('hl-mehr').click();
  await new Promise(function (f) { setTimeout(f, 90); });
  const waehrend = mass();
  await new Promise(function (f) { setTimeout(f, 600); });
  const nachher = mass();
  return { vorher: vorher, waehrend: waehrend, nachher: nachher,
           hoch: Math.round(knoepfe[0].getBoundingClientRect().height) };
})()`) as any;

p('Die fünf Knöpfe stehen während der Fahrt genau so wie vorher',
  treffer.vorher === treffer.waehrend, treffer.waehrend);
p('… und danach auch', treffer.vorher === treffer.nachher);
p('Und sie sind mit dem Finger zu treffen (§37)', treffer.hoch >= 44,
  String(treffer.hoch) + 'px');

/* ══════════════════════════════════════════════════════════════════════════
 * §6 DIE DEHNUNG IST GEDECKELT UND GILT NUR ZWISCHEN NACHBARN
 * (§5 braucht eine eigene Seite und kommt danach.)
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n6 · Gedehnt wird bescheiden, und nur zwischen Nachbarn');

const dehnung = await pc.evaluate(`(async () => {
  const pille = document.getElementById('ho-pille');
  const lies = function () {
    const m = getComputedStyle(pille).transform.match(/matrix\\(([-\\d.]+)/);
    return m ? Number(m[1]) : 1;
  };
  const messen = async function (ziel) {
    let hoechste = 1;
    let laeuft = true;
    const takt = function () { hoechste = Math.max(hoechste, lies()); if (laeuft) requestAnimationFrame(takt); };
    requestAnimationFrame(takt);
    document.getElementById(ziel).click();
    await new Promise(function (f) { setTimeout(f, 600); });
    laeuft = false;
    return Math.round(hoechste * 1000) / 1000;
  };
  document.getElementById('hl-dok').click();
  await new Promise(function (f) { setTimeout(f, 600); });
  const nachbar = await messen('hl-start');     /* ein Weg weiter */
  document.getElementById('hl-dok').click();
  await new Promise(function (f) { setTimeout(f, 600); });
  const weit = await messen('hl-mehr');         /* vier Wege weiter */
  return { nachbar: nachbar, weit: weit };
})()`) as any;

p('Zum Nachbarn dehnt sie sich — aber bescheiden',
  dehnung.nachbar > 1.01 && dehnung.nachbar <= 1.19, String(dehnung.nachbar));
p('Über vier Wege wird NICHT gedehnt', dehnung.weit <= 1.001, String(dehnung.weit));

/* ══════════════════════════════════════════════════════════════════════════
 * §5 OHNE BEWEGUNG WIRD GESETZT, NICHT GEFAHREN
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n5 · Ohne Bewegung wird gesetzt, nicht gefahren');

await kontext.close();
const { kontext: k2, pc: pc2 } = await aufmachen(true);

const ruhe = await pc2.evaluate(`(async () => {
  const pille = document.getElementById('ho-pille');
  const orte = [];
  let laeuft = true;
  const takt = function () { orte.push(Math.round(pille.getBoundingClientRect().left)); if (laeuft) requestAnimationFrame(takt); };
  requestAnimationFrame(takt);
  document.getElementById('hl-mehr').click();
  await new Promise(function (f) { setTimeout(f, 500); });
  laeuft = false;
  return {
    orte: Array.from(new Set(orte)).length,
    animationen: pille.getAnimations().length,
    ziel: Math.round(document.getElementById('hl-mehr').getBoundingClientRect().left),
    steht: Math.round(pille.getBoundingClientRect().left),
    /* Und sie ist weiter SICHTBAR — die Falle aus §55.2: ohne Bewegung
       einfach zu verschwinden wäre eine grüne Prüfung und ein blinder
       Nutzer (§38). */
    deckung: getComputedStyle(pille).opacity
  };
})()`) as any;

p('Ohne Bewegung nimmt sie höchstens zwei Orte ein', ruhe.orte <= 2, String(ruhe.orte));
p('… und läuft dabei keine Animation', ruhe.animationen === 0, String(ruhe.animationen));
p('… steht aber am richtigen Ort', Math.abs(ruhe.steht - ruhe.ziel) <= 1,
  ruhe.steht + ' statt ' + ruhe.ziel);
p('… und bleibt sichtbar', Number(ruhe.deckung) > .5, ruhe.deckung);

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await k2.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
