/* Suite 302 — Der Zeitbudget-Planer (E308, Redurs Punkt 7)
 * ============================================================================
 * „Ich habe heute 45 Minuten. Was mache ich?"
 *
 * Der Tagesplan rechnete bis heute `Anzahl × 30 Minuten` und warnte bei mehr
 * als acht Stunden. Beides ist die stille Fassung von „ich weiss es nicht".
 *
 * `core/planning/budget.ts` rechnet stattdessen zwei Dinge, und dieser Lauf
 * prüft beide — vor allem aber, dass das zweite im Normalfall SCHWEIGT.
 *
 *   §1 REIN: der Kern kennt weder Uhr noch Ablage noch DOM.
 *   §2 VERTEILEN: die Tagesrate, nicht alles auf heute.
 *   §3 FESTE TERMINE nehmen ihre Zeit zuerst, und Splitter entstehen nicht.
 *   §4 MACHBARKEIT von Hand nachgerechnet.
 *   §5 `noetigProTag` ist wirklich die KLEINSTE Zahl, die reicht.
 *   §6 GEGENPROBE gegen einen zweiten, unabhängigen Rechenweg (Simulation).
 *   §7 GEGENPROBE: im gewöhnlichen Fall sagt der Planer NICHTS.
 *   §8 UND IM ECHTEN FENSTER auch nicht — dort ist es das, was zählt.
 *
 * ─── WARUM §6 UND NICHT NUR EIN PAAR BEISPIELE ──────────────────────────────
 *
 * Die Machbarkeit ist kein geratener Schwellwert, sondern die bekannte
 * Bedingung für „earliest deadline first": ein Satz Arbeiten mit Fristen ist
 * genau dann zu schaffen, wenn für JEDE Frist die bis dahin fällige Arbeit in
 * die bis dahin vorhandene Zeit passt.
 *
 * Eine Behauptung dieser Art prüft man nicht mit drei Beispielen, sondern
 * indem man sie gegen einen ZWEITEN Weg hält. §6 baut deshalb einen kleinen
 * Tagessimulator — er verteilt wirklich Minute für Minute — und vergleicht
 * über zweihundert zufällige Fälle. Weichen die beiden ab, ist einer falsch,
 * und man erfährt es hier statt am Prüfungstag.
 *
 *   node pruefungen/lauf/test302.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9107;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const QUELLE = path.join(WURZEL, 'src/core/planning/budget.ts');
const GEBAUT = path.join(WURZEL, 'quell/core/planning/budget.js');

(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(GEBAUT, 'utf-8'));
const B = (globalThis as any).Budget;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Rein: weder Uhr noch Ablage noch DOM');

const quelle = fs.readFileSync(QUELLE, 'utf-8');
/* Kommentare weg — dort steht das Wort „Datum" mit Absicht. */
const code = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

p('Der Kern ist geladen',
  !!B && typeof B.verteilen === 'function' && typeof B.machbarkeit === 'function');
gleich('Keine Uhr im Kern',
  ['new Date', 'Date.now', 'Date.parse', 'toISOString'].filter(w => code.includes(w)), []);
gleich('Keine Ablage im Kern',
  ['Store.', 'getMeta', 'setMeta', 'localStorage', 'indexedDB'].filter(w => code.includes(w)), []);
gleich('Kein DOM im Kern',
  ['document.', 'innerHTML', 'querySelector', 'addEventListener'].filter(w => code.includes(w)), []);
/* Die eine erlaubte Zeile ist die Anmeldung am Ende — sonst fände die App
   den Kern nicht. Zwei wären schon eine Abhängigkeit. */
p('`window` kommt genau einmal vor, als Anmeldung',
  (code.match(/window/g) || []).length === 1, String((code.match(/window/g) || []).length));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Verteilen: die Tagesrate, nicht alles auf heute');

/* Ein Aufsatz über 200 Minuten, fällig in vier Tagen. Heute sind fünf Tage
   Zeit (heute mitgezählt), also 40 Minuten — und nicht 200. */
const a = B.verteilen([{ id: 'a', titel: 'Aufsatz', minuten: 200, frist: 4 }], 120);
gleich('Der Aufsatz bekommt seine Tagesrate', a.zuteilung[0]?.minuten, 40);
p('Und gilt nicht als erledigt', a.zuteilung[0]?.ganz === false);
gleich('Der Rest des Tages bleibt frei', a.rest, 80);
gleich('Nichts fällt heraus', a.draussen.length, 0);

/* Dasselbe Ding als überfällig: dann ist die Rate das Ganze. */
const b = B.verteilen([{ id: 'a', titel: 'Aufsatz', minuten: 90, frist: -2 }], 120);
gleich('Überfälliges kommt ganz auf heute', b.zuteilung[0]?.minuten, 90);
gleich('Und sagt auch, warum', b.zuteilung[0]?.grund, 'überfällig');

/* Die dringendere zuerst, auch wenn sie später in der Liste steht. */
const c = B.verteilen([
  { id: 'spaet', titel: 'Später', minuten: 60, frist: 9 },
  { id: 'heute', titel: 'Heute',  minuten: 60, frist: 0 }
], 80);
gleich('Die Frist entscheidet die Reihenfolge, nicht die Liste',
  c.zuteilung.map((z: any) => z.posten.id), ['heute', 'spaet']);
gleich('Die dringende bekommt alles, die späte ihre Tagesrate',
  c.zuteilung.map((z: any) => z.minuten), [60, 10]);
/* Und wenn gar nichts mehr da ist, steht keine Null im Plan: eine Zeile
   „Später — 0 Minuten" wäre eine Aufgabe, die man heute nicht macht, mit
   dem Anschein, dass sie geplant ist. */
const c0 = B.verteilen([
  { id: 'spaet', titel: 'Später', minuten: 60, frist: 9 },
  { id: 'heute', titel: 'Heute',  minuten: 60, frist: 0 }
], 60);
gleich('Bei leerem Rest steht keine Null im Plan',
  [c0.zuteilung.map((z: any) => z.posten.id), c0.draussen[0]?.grund],
  [['heute'], 'kein Rest']);

/* Ohne Frist: nach Gewicht, kurze zuerst. */
const d = B.verteilen([
  { id: 'lang',   titel: 'Lang',   minuten: 60, frist: null, gewicht: 1 },
  { id: 'kurz',   titel: 'Kurz',   minuten: 10, frist: null, gewicht: 1 },
  { id: 'wichtig',titel: 'Wichtig',minuten: 30, frist: null, gewicht: 5 }
], 500);
gleich('Ohne Frist zählt Gewicht, dann Kürze',
  d.zuteilung.map((z: any) => z.posten.id), ['wichtig', 'kurz', 'lang']);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Feste Termine zuerst, und keine Splitter');

const e = B.verteilen([
  { id: 'unterricht', titel: 'Unterricht', minuten: 90, frist: 0, fest: true },
  { id: 'gestern',    titel: 'Gestern',    minuten: 90, frist: -1, fest: true },
  { id: 'arbeit',     titel: 'Arbeit',     minuten: 60, frist: 0 }
], 120);
gleich('Der feste Termin von heute steht zuerst', e.zuteilung[0]?.posten.id, 'unterricht');
gleich('Und kostet seine ganze Zeit', e.festMinuten, 90);
p('Ein fester Termin von gestern kostet heute nichts',
  !e.zuteilung.some((z: any) => z.posten.id === 'gestern'));
gleich('Für die Arbeit bleiben 30 Minuten', e.zuteilung[1]?.minuten, 30);

/* Sieben Minuten Rest sind kein Plan: wer sich das als „Aufsatz" notiert,
   macht ihn nicht. */
const f = B.verteilen([
  { id: 'voll',   titel: 'Voll',   minuten: 53, frist: 0 },
  { id: 'aufsatz',titel: 'Aufsatz',minuten: 200, frist: null }
], 60);
gleich('Ein Splitter unter dem Mindestblock entsteht nicht',
  f.zuteilung.some((z: any) => z.posten.id === 'aufsatz'), false);
gleich('Und er sagt, warum',
  f.draussen.find((x: any) => x.posten.id === 'aufsatz')?.grund, 'zu wenig Rest');

/* Etwas Unteilbares passt entweder ganz oder gar nicht. */
const g = B.verteilen([{ id: 'pruefung', titel: 'Prüfung', minuten: 90,
                         frist: 3, teilbar: false }], 60);
gleich('Unteilbares wird nicht zerschnitten', g.zuteilung.length, 0);
gleich('Sondern benannt', g.draussen[0]?.grund, 'am Stück');

/* Mehr feste Termine als Budget: das ist eine eigene Auskunft. */
const h = B.verteilen([{ id: 't', titel: 'Termin', minuten: 300, frist: 0, fest: true }], 120);
gleich('Feste Termine über dem Budget werden beziffert', h.ueberzogen, 180);
gleich('Und der Rest ist null, nicht negativ', h.rest, 0);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Machbarkeit, von Hand nachgerechnet');

/* Zwei Arbeiten: 100 Minuten bis morgen, 100 Minuten bis übermorgen.
   Bei 45 Minuten am Tag stehen bis morgen 90 zur Verfügung — es fehlen 10.
   Bis übermorgen sind es 135 gegen 200 — es fehlen 65. */
const m1 = B.machbarkeit([
  { id: '1', titel: 'Eins', minuten: 100, frist: 1 },
  { id: '2', titel: 'Zwei', minuten: 100, frist: 2 }
], 45);
p('Das geht sich nicht aus', m1.machbar === false);
gleich('Zwei Engpässe, an den beiden Fristen', m1.engpaesse.map((x: any) => x.tag), [1, 2]);
gleich('Bis morgen fehlen 10 Minuten', m1.engpaesse[0]?.fehlt, 10);
gleich('Bis übermorgen fehlen 65', m1.engpaesse[1]?.fehlt, 65);
p('Und der Satz nennt den ersten Engpass',
  B.satz(m1).startsWith('Bis morgen fehlen 10 Min.'), B.satz(m1));

/* Feste Termine sind keine Arbeit, sondern fehlende Kapazität. */
const m2 = B.machbarkeit([
  { id: 'u', titel: 'Unterricht', minuten: 60, frist: 0, fest: true },
  { id: 'x', titel: 'Arbeit',     minuten: 60, frist: 0 }
], 90);
p('Ein Termin heute nimmt Kapazität weg', m2.machbar === false);
gleich('Genau die 30 Minuten, die er zuviel belegt', m2.engpaesse[0]?.fehlt, 30);

/* Überfälliges ist auf HEUTE fällig, nicht auf gestern. */
const m3 = B.machbarkeit([{ id: 'a', titel: 'Alt', minuten: 30, frist: -5 }], 45);
p('Überfälliges rutscht auf heute, nicht in die Vergangenheit', m3.machbar === true);
gleich('Wird aber gezählt', [m3.ueberfaellig, m3.ueberfaelligMinuten], [1, 30]);

/* Was weit weg ist, gehört nicht in die Rechnung für nächste Woche.
   20 000 Minuten bis Tag 300 sind bei 45 Minuten am Tag wirklich zuviel
   (301 × 45 = 13 545) — nur eben nicht die Frage, die heute zählt. */
const WEIT = [{ id: 'w', titel: 'Weit', minuten: 20000, frist: 300 }];
p('Jenseits des Horizonts wird nicht gewarnt',
  B.machbarkeit(WEIT, 45).machbar === true);
p('Innerhalb schon',
  B.machbarkeit(WEIT, 45, { horizont: 400 }).machbar === false);
gleich('Und dann fehlen genau 20000 − 13545 Minuten',
  B.machbarkeit(WEIT, 45, { horizont: 400 }).engpaesse[0]?.fehlt, 20000 - 301 * 45);

/* ------------------------------------------------------------------------ */
console.log('\n5 · `noetigProTag` ist die kleinste Zahl, die reicht');

const FAELLE: any[][] = [
  [{ id: '1', titel: 'A', minuten: 100, frist: 1 }, { id: '2', titel: 'B', minuten: 100, frist: 2 }],
  [{ id: '1', titel: 'A', minuten: 45, frist: 0 }],
  [{ id: 'u', titel: 'U', minuten: 60, frist: 0, fest: true },
   { id: 'x', titel: 'X', minuten: 90, frist: 1 }],
  [{ id: '1', titel: 'A', minuten: 7, frist: 3 }, { id: '2', titel: 'B', minuten: 500, frist: 9 }]
];
let kleinsteStimmt = true, belegLos = '';
for (const fall of FAELLE) {
  const n = B.machbarkeit(fall, 45).noetigProTag;
  const reicht  = B.machbarkeit(fall, n).machbar;
  const reichtNicht = n > 0 ? !B.machbarkeit(fall, n - 1).machbar : true;
  if (!reicht || !reichtNicht) { kleinsteStimmt = false; belegLos = `n=${n}`; }
}
p('Mit `noetigProTag` geht es, mit einer Minute weniger nicht',
  kleinsteStimmt, belegLos);
/* Sie darf auch UNTER dem heutigen Budget liegen — dann ist sie die
   Auskunft „so wenig würde reichen" statt einer Warnung. */
p('Sie ist keine Warnung, sondern eine Zahl',
  B.machbarkeit([{ id: '1', titel: 'A', minuten: 10, frist: 4 }], 120).noetigProTag <= 10);
gleich('Ohne Arbeit ist sie null', B.machbarkeit([], 45).noetigProTag, 0);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Gegenprobe: ein zweiter Rechenweg, zweihundert Fälle');

/**
 * Ein Tagessimulator. Er verteilt wirklich Tag für Tag, immer zuerst auf
 * die Arbeit mit der nächsten Frist — und sieht am Ende nach, ob jede
 * rechtzeitig fertig wurde. Absichtlich stumpf und absichtlich anders
 * gebaut als der Kern: nur so ist der Vergleich etwas wert.
 */
const simuliere = (posten: any[], budget: number, tage: number): boolean => {
  const arbeit = posten.filter(x => !x.fest)
    .map(x => ({ tag: Math.max(0, x.frist), rest: x.minuten }));
  const fest = new Map<number, number>();
  posten.filter(x => x.fest).forEach(x => {
    const t = Math.max(0, x.frist);
    fest.set(t, (fest.get(t) || 0) + x.minuten);
  });
  for (let t = 0; t <= tage; t++) {
    let kap = Math.max(0, budget - (fest.get(t) || 0));
    while (kap > 0) {
      const offen = arbeit.filter(x => x.rest > 0).sort((l, r) => l.tag - r.tag);
      const naechste = offen[0];
      if (!naechste) break;
      const nimm = Math.min(kap, naechste.rest);
      naechste.rest -= nimm;
      kap -= nimm;
    }
    /* Wer heute nicht fertig wurde und heute fällig war, hat die Frist
       gerissen. */
    if (arbeit.some(x => x.tag === t && x.rest > 0)) return false;
  }
  return true;
};

/* Ein eigener Zufall, damit ein roter Lauf sich wiederholen lässt. */
let saat = 20260901;
const wuerfel = (n: number): number => {
  saat = (saat * 1103515245 + 12345) % 2147483648;
  return saat % n;
};

let einig = 0, uneinig: string[] = [];
for (let runde = 0; runde < 200; runde++) {
  const posten: any[] = [];
  const wieviele = 1 + wuerfel(5);
  for (let i = 0; i < wieviele; i++)
    posten.push({ id: 'p' + i, titel: 'P' + i,
                  minuten: 5 + wuerfel(120), frist: wuerfel(8) - 2,
                  fest: wuerfel(6) === 0 });
  const budget = 15 + wuerfel(90);
  const kern = B.machbarkeit(posten, budget).machbar;
  const sim  = simuliere(posten.map(x => B.lesen(x)), budget, 10);
  if (kern === sim) einig++;
  else if (uneinig.length < 3)
    uneinig.push(`Budget ${budget}, Kern ${kern}, Simulation ${sim}: ` +
                 JSON.stringify(posten));
}
gleich('Kern und Simulation sind sich in allen 200 Fällen einig',
  [einig, uneinig], [200, []]);

/* Und die Gegenprobe zur Gegenprobe: der Simulator KANN abweichen. Mit
   einer absichtlich falschen Behauptung („alles ist machbar") wäre er es
   sofort — sonst prüfte §6 gar nichts. */
let falschEinig = 0;
for (let runde = 0; runde < 40; runde++) {
  const posten = [{ id: 'x', titel: 'X', minuten: 100 + wuerfel(200), frist: wuerfel(3) }];
  if (simuliere(posten.map(x => B.lesen(x)), 10 + wuerfel(20), 10) === true) falschEinig++;
}
p('Der Simulator sagt nicht einfach immer „geht"', falschEinig < 40,
  `${falschEinig} von 40`);

/* ------------------------------------------------------------------------ */
console.log('\n7 · GEGENPROBE: im gewöhnlichen Fall sagt er nichts');

/* Ein ganz normaler Schultag: vier Aufgaben, eine Doppelstunde, 90 Minuten
   Lernzeit. Nichts davon ist knapp — also darf hier kein Wort stehen. */
const normal = [
  { id: 'u', titel: 'Unterricht', minuten: 45, frist: 0, fest: true },
  { id: '1', titel: 'Matheblatt', minuten: 25, frist: 1 },
  { id: '2', titel: 'Vokabeln',   minuten: 15, frist: 2 },
  { id: '3', titel: 'Lesen',      minuten: 30, frist: 5 },
  { id: '4', titel: 'Aufräumen',  minuten: 20, frist: null }
];
const mn = B.machbarkeit(normal, 90);
p('Der Normalfall ist machbar', mn.machbar === true);
gleich('Kein Engpass', mn.engpaesse, []);
gleich('Und deshalb KEIN Satz', B.satz(mn), '');
gleich('Nichts ist überfällig', mn.ueberfaellig, 0);

const tn = B.verteilen(normal, 90);
gleich('Und im Tag fällt nichts heraus', tn.draussen.length, 0);
p('Alles hat Zeit bekommen', tn.zuteilung.length === 5, JSON.stringify(
  tn.zuteilung.map((z: any) => [z.posten.id, z.minuten])));

/* Der Beleg, dass §7 überhaupt rot werden KANN: ein Handgriff mehr, und
   der Satz steht da. Ohne diesen Punkt hiesse „schweigt" nur „prüft
   nichts". */
const knapp = [...normal, { id: '5', titel: 'Referat', minuten: 240, frist: 1 }];
const mk = B.machbarkeit(knapp, 90);
p('Eine Arbeit mehr, und er redet', B.satz(mk).length > 0, B.satz(mk));
p('Und nennt beides: Fehlbetrag und nötige Tagesrate',
  /fehlen/.test(B.satz(mk)) && /am Tag/.test(B.satz(mk)), B.satz(mk));

/* AUF DEM BILD GEFUNDEN, nicht hier: „Bis morgen fehlen 1 Std. 55 Min.."
   `dauerWort` endet auf eine Abkürzung und bringt den Punkt schon mit. Der
   Wächter ist billig und wäre vorher rot gewesen. */
let doppelt: string[] = [];
for (const b of [10, 30, 45, 60, 90, 125, 240, 605])
  for (const s of [B.dauerWort(b), B.dauerKurz(b),
                   B.engpassSatz({ tag: 1, bedarf: 0, kapazitaet: 0, fehlt: b, posten: [] })])
    if (/\.\./.test(s)) doppelt.push(s);
for (const m of [mk, m1]) { const t: string = B.satz(m); if (/\.\./.test(t)) doppelt.push(t); }
gleich('Nirgends zwei Punkte hintereinander', doppelt, []);
/* Und die Kurzform bleibt in einer Zeile — sie steht in einer Karte, die
   keine zweite hat. */
p('Die Kurzform ist höchstens acht Zeichen lang',
  [30, 90, 125, 605, 1440].every((m: number) => B.dauerKurz(m).length <= 8),
  JSON.stringify([30, 90, 125, 605, 1440].map((m: number) => B.dauerKurz(m))));

/* ------------------------------------------------------------------------ */
console.log('\n8 · Im echten Fenster: erst still, dann laut');

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
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

const aufbau = await pc.evaluate(async () => {
  const w = window as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  /* Reichlich Zeit: hier darf nichts knapp sein. */
  Store.setMeta('zeitbudget', 600);
  const tag = (n: number): string => {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const { collectionId } = Store.addDatabase(null, 'Schulaufgaben', {
    titel:  { name: 'Aufgabe', type: 'title' },
    wann:   { name: 'Fällig',  type: 'date' },
    dauer:  { name: 'Dauer (Min.)', type: 'number' },
    fertig: { name: 'Erledigt', type: 'checkbox' }
  });
  const klein = Store.addRow(collectionId, { title: 'Matheblatt' });
  Store.setProp(klein.id, 'wann', tag(3));
  Store.setProp(klein.id, 'dauer', 25);
  /* §19: ein Titel, der Auszeichnung wäre, wenn er nicht entschärft würde. */
  const boese = Store.addRow(collectionId, { title: '<img src=x onerror=alert(1)>' });
  Store.setProp(boese.id, 'wann', tag(5));
  Store.setProp(boese.id, 'dauer', 10);
  await Store.flush();
  w.Plan.tagesplan();
  await new Promise(r => setTimeout(r, 500));
  const o = document.querySelector('.overlay');
  return {
    offen: !!o,
    warnung: !!o?.querySelector('.pl-warnung'),
    budgetFeld: (o?.querySelector('#pl-b') as HTMLInputElement | null)?.value ?? '',
    zeilen: [...(o?.querySelectorAll('.pl-z') ?? [])].map(z => z.textContent || ''),
    /* NICHT `innerHTML.includes('onerror=alert')` — ein entschärfter Titel
       enthält den Text weiterhin, nur als Text. Gemessen wird deshalb, ob
       ein ELEMENT daraus wurde und ob die spitze Klammer roh dasteht. */
    roh: /<img[^>]*onerror/i.test(o?.innerHTML ?? '<img onerror>'),
    bild: !!o?.querySelector('img'),
    alsText: [...(o?.querySelectorAll('.pl-z') ?? [])]
      .some(z => (z.textContent || '').includes('<img src=x onerror=alert(1)>')),
    collectionId
  };
});

p('Der Tagesplan geht auf', aufbau.offen);
p('Das Budget steht im Feld', aufbau.budgetFeld === '600', aufbau.budgetFeld);
/* DAS IST DIE GEGENPROBE, DIE ZÄHLT. Der Kern kann noch so still sein — was
   ankommt, ist das, was im Fenster steht. */
p('Bei reichlich Zeit steht KEINE Warnung da', aufbau.warnung === false);
p('Die echte Dauer steht in der Zeile, nicht die Vorgabe 30',
  aufbau.zeilen.some(z => /Matheblatt/.test(z) && /25 Min\./.test(z)),
  JSON.stringify(aufbau.zeilen.slice(0, 4)));
p('§19: aus dem Titel wird kein Element',
  aufbau.roh === false && aufbau.bild === false,
  `roh=${aufbau.roh} bild=${aufbau.bild}`);
p('Sondern er steht Zeichen für Zeichen als Text da', aufbau.alsText === true);

/* Und jetzt eine Arbeit, die sich nicht ausgeht. Ohne diesen Teil hiesse
   „keine Warnung" nur „diese Anzeige gibt es nicht". */
const laut = await pc.evaluate(async (collectionId: string) => {
  const w = window as any;
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 1);
  const gross = Store.addRow(collectionId, { title: 'Referat' });
  Store.setProp(gross.id, 'wann', d.toISOString().slice(0, 10));
  Store.setProp(gross.id, 'dauer', 3000);
  await Store.flush();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  w.Plan.tagesplan();
  await new Promise(r => setTimeout(r, 500));
  const o = document.querySelector('.overlay');
  const t = o?.querySelector('.pl-warnung')?.textContent || '';
  return { text: t, doppelpunkt: /\.\./.test(t) };
}, aufbau.collectionId);

p('Mit einer unmöglichen Frist steht sie da', laut.text.length > 0, laut.text);
p('Und nennt „fehlen" samt Tagesrate',
  /fehlen/.test(laut.text) && /am Tag/.test(laut.text), laut.text);
p('Auch im Fenster keine zwei Punkte hintereinander', laut.doppelpunkt === false, laut.text);

/* Das Budget ist eine Eingabe und keine Anzeige: was hineingeschrieben wird,
   überlebt das Schliessen. */
const gemerkt = await pc.evaluate(async () => {
  const feld = document.querySelector('#pl-b') as HTMLInputElement | null;
  if (!feld) return { wert: -1, neu: '' };
  feld.value = '45';
  feld.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  return { wert: Number(Store.getMeta('zeitbudget', -1)),
           neu: (document.querySelector('#pl-b') as HTMLInputElement | null)?.value || '' };
});
p('Das eingetragene Budget wird gemerkt', gemerkt.wert === 45, String(gemerkt.wert));
p('Und das neu gezeichnete Fenster zeigt es', gemerkt.neu === '45', gemerkt.neu);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
