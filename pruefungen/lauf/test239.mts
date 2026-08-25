/* Suite 205 — Der Strom fliesst wirklich (Elektro, Simulation)
 * ============================================================================
 * Eine Schaltplan-Simulation kann auf zwei Arten gebaut werden. Die billige
 * sucht einen Weg von L nach N und lässt darauf Striche laufen; sie sieht in
 * einer Vorführung gut aus und beantwortet keine Frage aus dem Unterricht.
 * Die andere rechnet. Redion rechnet — mit einer Knotenpotentialanalyse über
 * alle Netze, die für jedes Bauteil Spannung, Strom und Leistung liefert.
 *
 * WAS DIESE SUITE PRÜFT, IST DESHALB NICHT „ES BEWEGT SICH", SONDERN „ES
 * STIMMT". Jede Zahl hier ist von Hand nachrechenbar, und wenn sie es nicht
 * wäre, wäre die Prüfung wertlos: zwei gleiche Lampen in Reihe an 230 V
 * ergeben 115 V und ein Viertel der Helligkeit, parallel ergeben sie 230 V
 * und volle Helligkeit. Wer das falsch rechnet, bringt es jemandem falsch bei.
 *
 * §8 IST DER PUNKT, AN DEM SICH ENTSCHEIDET, OB WIRKLICH GERECHNET WIRD.
 * Die Wheatstone-Brücke lässt sich nicht in Reihe und Parallel zerlegen. Eine
 * Simulation, die nur Reihe und Parallel kann, muss dort falsch liegen — und
 * zwar unauffällig falsch. Deshalb steht die Brücke hier, im Gleichgewicht
 * (durch den Zweig fliesst nichts) und verstimmt (jetzt fliesst etwas).
 *
 * §6 IST DER, DEN JEDE LERNENDE BRAUCHT. Die Selbsthaltung ist der erste
 * Steuerstromkreis überhaupt: Start drücken, loslassen, das Schütz hält sich
 * selbst, Halt drücken, es fällt ab. Ohne Gedächtnis zwischen den Schritten
 * fiele es beim Loslassen sofort ab — die Schaltung, die jeder als Erstes
 * zeichnet, ginge nicht.
 *
 *   node pruefungen/lauf/test239.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Schaltplan: any; declare const Stromfluss: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8998;

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
/** Zahlenvergleich mit Toleranz — Gleitkomma trifft nie exakt. */
const nah = (ist: number, soll: number, tol = 0.01): boolean =>
  Math.abs(ist - soll) <= tol * Math.max(1, Math.abs(soll));
const pNah = (n: string, ist: number, soll: number, einheit: string, tol = 0.01): void =>
  p(n, nah(ist, soll, tol), `ist ${ist.toPrecision(5)} ${einheit}, soll ${soll.toPrecision(5)} ${einheit}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1320, height: 1000 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => { Store.setMeta('rundgangGesehen', true);
                             Store.setMeta('neuerungenGesehen', 99);
                             Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10)); });
await seite.reload();
await seite.waitForTimeout(2400);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));

/* --------------------------------------------------------------------------
 * Der Baukasten. Er lebt im Browser, weil die Simulation dort läuft — und
 * weil ein Plan, der nur im Prüfskript existiert, nichts über die App sagt.
 *
 * Die Leitungen werden mit AUSGEDACHTEN Punkten weit ausserhalb der Fläche
 * gezeichnet und nur über `vonTeil`/`nachTeil` gebunden. Das ist Absicht:
 * echte Wegpunkte würden sich bei so vielen Bauteilen überlappen, und
 * überlappende Leitungen sind EINE Leitung — beim ersten Bildschirmfoto der
 * Wechselschaltung lagen drei auf derselben Höhe, und die Lampe leuchtete
 * aus dem falschen Grund. §9 prüft genau diesen Fall ausdrücklich.
 * ----------------------------------------------------------------------- */
await seite.evaluate(() => {
  (window as any).bau = () => {
    let z = 0, l = 0;
    const plan: any = Schaltplan.neuerPlan('stromlauf-aufgeloest');
    plan.teile = []; plan.leitungen = []; plan.texte = [];
    const teil = (zeichen: string, bmk: string, werte?: any) => {
      const t: any = { id: 't' + (++z), zeichen, x: z * 80, y: 40, drehung: 0,
                       gespiegelt: false, bmk, nummern: {}, gruppe: '', ebene: 'plan' };
      if (werte) t.werte = werte;
      plan.teile.push(t); return t;
    };
    const draht = (a: any, an: string, b: any, bn: string) => {
      l++;
      plan.leitungen.push({ id: 'l' + l, ebene: 'plan',
        punkte: [{ x: -900 - l * 40, y: -900 - l * 40 }],
        vonTeil: a.id, vonNr: an, nachTeil: b.id, nachNr: bn });
    };
    return { plan, teil, draht };
  };
});

type Erg = any;
const rechne = (bauen: string, stellung: Record<string, number> = {}): Promise<Erg> =>
  seite.evaluate(([quelle, st]: [string, any]) => {
    const { plan, teil, draht } = (window as any).bau();
    // eslint-disable-next-line no-new-func
    new Function('plan', 'teil', 'draht', quelle)(plan, teil, draht);
    const e = Stromfluss.rechne(plan, st);
    return { ok: e.ok, fehler: e.fehler, werte: e.werte, spulen: e.spulen,
             warnungen: e.warnungen, annahmen: e.annahmen, maxStrom: e.maxStrom,
             durchgaenge: e.durchgaenge, netzStrom: e.netzStrom,
             leitungNetz: e.leitungNetz };
  }, [bauen, stellung] as [string, any]);

/* ==========================================================================
 * §1 · Reihenschaltung — die Zahlen, die im Heft stehen
 * ========================================================================*/
console.log('\n1 · Reihenschaltung');

const reihe = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const h1 = teil('lampe', 'E1');
  const h2 = teil('lampe', 'E2');
  draht(q, 'L', h1, 'X1'); draht(h1, 'X2', h2, 'X1'); draht(h2, 'X2', q, 'N');
`);
p('Die Reihenschaltung rechnet', reihe.ok, reihe.fehler);
pNah('Strom 230 V / 1058 Ω', Math.abs(reihe.werte.t2.I), 230 / 1058, 'A');
pNah('An jeder Lampe die halbe Spannung', Math.abs(reihe.werte.t2.U), 115, 'V');
p('Durch beide fliesst derselbe Strom',
  nah(Math.abs(reihe.werte.t2.I), Math.abs(reihe.werte.t3.I), 1e-6));
pNah('Jede Lampe nur ein Viertel hell', reihe.werte.t2.helligkeit, 0.25, '', 0.03);
pNah('Und deshalb nur 25 W statt 100', reihe.werte.t2.P, 25, 'W', 0.03);

/* ==========================================================================
 * §2 · Parallelschaltung — derselbe Aufbau, anderes Ergebnis
 * ========================================================================*/
console.log('\n2 · Parallelschaltung');

const parallel = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const h1 = teil('lampe', 'E1');
  const h2 = teil('lampe', 'E2');
  draht(q, 'L', h1, 'X1'); draht(q, 'L', h2, 'X1');
  draht(h1, 'X2', q, 'N'); draht(h2, 'X2', q, 'N');
`);
p('Die Parallelschaltung rechnet', parallel.ok, parallel.fehler);
pNah('Volle Spannung an jeder Lampe', Math.abs(parallel.werte.t2.U), 230, 'V');
pNah('Volle Leistung', parallel.werte.t2.P, 100, 'W', 0.03);
pNah('Volle Helligkeit', parallel.werte.t2.helligkeit, 1, '', 0.03);
pNah('Der Quellenstrom ist die Summe beider Zweige',
  Math.abs(parallel.werte.t1.I), 2 * 230 / 529, 'A');
p('Parallel zieht mehr Strom als in Reihe — der Grund für jede Sicherung',
  Math.abs(parallel.werte.t1.I) > 3 * Math.abs(reihe.werte.t1.I));

/* ==========================================================================
 * §3 · Der Schalter schaltet
 * ========================================================================*/
console.log('\n3 · Der Schalter');

const bauSchalter = `
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', s, '3'); draht(s, '4', h, 'X1'); draht(h, 'X2', q, 'N');
`;
const auf = await rechne(bauSchalter, {});
const zu  = await rechne(bauSchalter, { t2: 1 });
p('Offen: die Lampe ist dunkel', auf.ok && !auf.werte.t3.fliesst);
p('Offen: es liegt nichts an ihr an', Math.abs(auf.werte.t3.U) < 1e-6,
  `${auf.werte.t3.U}`);
p('Geschlossen: sie brennt', zu.werte.t3.fliesst);
pNah('Geschlossen: mit voller Helligkeit', zu.werte.t3.helligkeit, 1, '', 0.03);
p('Offen: der grösste Strom im Plan ist eine glatte Null', auf.maxStrom === 0,
  `${auf.maxStrom}`);

/* ==========================================================================
 * §4 · Wechselschaltung Schema 3 — von zwei Orten
 * ------------------------------------------------------------------------
 * Die Wahrheitstafel ist der ganze Sinn der Schaltung, und sie hat vier
 * Zeilen. Zwei davon zu prüfen würde eine Simulation durchlassen, die den
 * Schalter gar nicht auswertet.
 * ========================================================================*/
console.log('\n4 · Wechselschaltung');

const bauWechsel = `
  const q  = teil('wechselspannung', 'G1');
  const s1 = teil('ch-schema3', 'S1');
  const s2 = teil('ch-schema3', 'S2');
  const h  = teil('lampe', 'E1');
  draht(q, 'L', s1, '3');
  draht(s1, '1', s2, '1'); draht(s1, '2', s2, '2');
  draht(s2, '3', h, 'X1'); draht(h, 'X2', q, 'N');
`;
for (const [a, b, soll] of [[0, 0, true], [0, 1, false], [1, 0, false], [1, 1, true]] as
     Array<[number, number, boolean]>) {
  const e = await rechne(bauWechsel, { t2: a, t3: b });
  p(`S1=${a} S2=${b} → ${soll ? 'Licht' : 'dunkel'}`, e.werte.t4.fliesst === soll);
}

/* Und die unbenutzte Korrespondierende führt KEINEN Strom — sonst wäre die
   Animation eine Lüge, auch wenn die Rechnung stimmt. */
const wechselAn = await rechne(bauWechsel, { t2: 0, t3: 0 });
const fuehrend = Object.keys(wechselAn.leitungNetz)
  .filter(id => wechselAn.netzStrom[wechselAn.leitungNetz[id]] > 0).length;
p('Von fünf Leitungen führen vier Strom, nicht fünf', fuehrend === 4, `${fuehrend}`);

/* ==========================================================================
 * §5 · Kreuzschaltung Schema 6 — von drei Orten
 * ========================================================================*/
console.log('\n5 · Kreuzschaltung');

const bauKreuz = `
  const q  = teil('wechselspannung', 'G1');
  const s1 = teil('ch-schema3', 'S1');
  const k  = teil('ch-schema6', 'S2');
  const s3 = teil('ch-schema3', 'S3');
  const h  = teil('lampe', 'E1');
  draht(q, 'L', s1, '3');
  draht(s1, '1', k, '1'); draht(s1, '2', k, '3');
  draht(k, '2', s3, '1'); draht(k, '4', s3, '2');
  draht(s3, '3', h, 'X1'); draht(h, 'X2', q, 'N');
`;
/* Drei Schalter, acht Stellungen. Das Licht brennt bei GERADER Zahl von
   Umlegungen — das ist die Regel, die im Unterricht drankommt. */
let kreuzOk = 0;
for (let m = 0; m < 8; m++) {
  const a = m & 1, b = (m >> 1) & 1, c = (m >> 2) & 1;
  const e = await rechne(bauKreuz, { t2: a, t3: b, t4: c });
  const soll = ((a + b + c) % 2) === 0;
  if (e.werte.t5.fliesst === soll) kreuzOk++;
  else console.log(`      (S1=${a} S2=${b} S3=${c}: ist ${e.werte.t5.fliesst}, soll ${soll})`);
}
p('Alle acht Stellungen stimmen — Licht bei gerader Zahl von Umlegungen',
  kreuzOk === 8, `${kreuzOk} von 8`);

/* ==========================================================================
 * §6 · Selbsthaltung — der Kreis mit Gedächtnis
 * ========================================================================*/
console.log('\n6 · Selbsthaltung');

const selbsthaltung = await seite.evaluate(() => {
  const { plan, teil, draht } = (window as any).bau();
  const q  = teil('wechselspannung', 'G1');
  const s0 = teil('taster-oeffner', 'S0');
  const s1 = teil('taster-schliesser', 'S1');
  const k1 = teil('schuetz-schliesser', 'K1');
  const sp = teil('spule', 'K1');
  draht(q, 'L', s0, '1');
  draht(s0, '2', s1, '3'); draht(s0, '2', k1, '13');
  draht(s1, '4', sp, 'A1'); draht(k1, '14', sp, 'A1');
  draht(sp, 'A2', q, 'N');
  let stand: any = {};
  const schritt = (hand: any) => {
    const e = Stromfluss.rechne(plan, hand, stand);
    stand = e.spulen;
    return { an: e.spulen['K1'] === true, durchgaenge: e.durchgaenge, ok: e.ok };
  };
  return {
    ruhe:      schritt({}),
    start:     schritt({ [s1.id]: 1 }),
    losgelassen: schritt({}),
    nochmal:   schritt({}),
    halt:      schritt({ [s0.id]: 1 }),
    danach:    schritt({})
  };
});
p('In Ruhe ist K1 abgefallen', !selbsthaltung.ruhe.an);
p('Start drücken zieht K1 an', selbsthaltung.start.an);
p('Der Haltekontakt musste dafür nachgeführt werden',
  selbsthaltung.start.durchgaenge >= 2, `${selbsthaltung.start.durchgaenge} Durchgänge`);
p('LOSLASSEN — und K1 hält sich selbst', selbsthaltung.losgelassen.an);
p('Und bleibt gehalten', selbsthaltung.nochmal.an);
p('Halt drücken trennt', !selbsthaltung.halt.an);
p('Nach dem Loslassen bleibt es aus', !selbsthaltung.danach.an);

/* ==========================================================================
 * §7 · Messgeräte zeigen, was wirklich anliegt
 * ========================================================================*/
console.log('\n7 · Messen');

const ampere = await rechne(`
  const q = teil('gleichspannung', 'G1', { U: 24 });
  const r = teil('widerstand', 'R1', { R: 12 });
  const a = teil('amperemeter', 'P1');
  draht(q, '+', r, '1'); draht(r, '2', a, '+'); draht(a, '−', q, '−');
`);
pNah('Amperemeter in Reihe zeigt 24 V / 12 Ω', Math.abs(ampere.werte.t3.I), 2, 'A');
p('Und fällt selbst nichts ab', Math.abs(ampere.werte.t3.U) < 1e-6);

const volt = await rechne(`
  const q  = teil('gleichspannung', 'G1', { U: 30 });
  const r1 = teil('widerstand', 'R1', { R: 100 });
  const r2 = teil('widerstand', 'R2', { R: 200 });
  const v  = teil('voltmeter', 'P1');
  draht(q, '+', r1, '1'); draht(r1, '2', r2, '1'); draht(r2, '2', q, '−');
  draht(v, '+', r2, '1'); draht(v, '−', r2, '2');
`);
pNah('Voltmeter am Spannungsteiler: 30 V · 200/300', Math.abs(volt.werte.t4.U), 20, 'V');
p('Es belastet den Teiler kaum — sonst stimmte die 20 nicht',
  Math.abs(Math.abs(volt.werte.t4.U) - 20) < 0.01);

/* ==========================================================================
 * §8 · Die Brücke — hier scheitert Reihe-und-Parallel
 * ========================================================================*/
console.log('\n8 · Wheatstone-Brücke');

const bruecke = (r3: number) => `
  const q = teil('gleichspannung', 'G1', { U: 10 });
  const a = teil('widerstand', 'R1', { R: 100 });
  const b = teil('widerstand', 'R2', { R: 200 });
  const c = teil('widerstand', 'R3', { R: ${r3} });
  const d = teil('widerstand', 'R4', { R: 200 });
  const m = teil('widerstand', 'R5', { R: 50 });
  draht(q, '+', a, '1'); draht(q, '+', c, '1');
  draht(a, '2', b, '1'); draht(c, '2', d, '1');
  draht(b, '2', q, '−'); draht(d, '2', q, '−');
  draht(m, '1', a, '2'); draht(m, '2', c, '2');
`;
const abgeglichen = await rechne(bruecke(100));
p('Abgeglichen: durch den Brückenzweig fliesst nichts',
  Math.abs(abgeglichen.werte.t6.I) < 1e-9, `${abgeglichen.werte.t6.I}`);
p('Abgeglichen: beide Ecken liegen gleich hoch',
  Math.abs(abgeglichen.werte.t6.U) < 1e-6);
const verstimmt = await rechne(bruecke(150));
p('Verstimmt: jetzt fliesst etwas', Math.abs(verstimmt.werte.t6.I) > 1e-4,
  `${(verstimmt.werte.t6.I * 1000).toFixed(3)} mA`);
p('Und zwar nicht viel — sonst wäre die Rechnung Unfug',
  Math.abs(verstimmt.werte.t6.I) < 0.05);

/* ==========================================================================
 * §9 · Was schiefgeht, wird gesagt
 * ------------------------------------------------------------------------
 * Eine Simulation, die bei einem kaputten Plan schweigt oder NaN zeigt, ist
 * schlimmer als keine: sie lässt die Lernende den Fehler in der Physik
 * suchen, wo er in der Zeichnung liegt.
 * ========================================================================*/
console.log('\n9 · Ehrliche Meldungen');

const ohneQuelle = await rechne(`
  const h = teil('lampe', 'E1');
`);
p('Ohne Quelle: klare Ansage statt NaN',
  !ohneQuelle.ok && /Quelle/.test(ohneQuelle.fehler), ohneQuelle.fehler);

const kurz = await rechne(`
  const q = teil('wechselspannung', 'G1');
  draht(q, 'L', q, 'N');
`);
p('Quelle kurzgeschlossen: wird benannt',
  !kurz.ok && /kurzgeschlossen/.test(kurz.fehler), kurz.fehler);

const offen = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', h, 'X1');
`);
p('Eine Klemme in der Luft wird gemeldet',
  (offen.warnungen || []).some((x: string) => /hängt an keiner Leitung/.test(x)),
  (offen.warnungen || []).join(' | '));

const sauber = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', h, 'X1'); draht(h, 'X2', q, 'N');
`);
p('Ein richtiger Plan bekommt keine Warnung', (sauber.warnungen || []).length === 0,
  (sauber.warnungen || []).join(' | '));

/* Der Fall, der beim ersten Bildschirmfoto passiert ist: zwei Leitungen auf
   derselben Höhe sind EINE Leitung, und der Schalter dazwischen ist damit
   überbrückt. Im Bild ist das nicht zu sehen. */
const ueberbrueckt = await seite.evaluate(() => {
  const { plan, teil } = (window as any).bau();
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  q.x = 40; q.y = 200; s.x = 200; s.y = 130; h.x = 400; h.y = 200;
  const ort = (t: any, nr: string) => {
    const a = Schaltplan.anschluesseVon(t).find((x: any) => x.nr === nr);
    return { x: a.x, y: a.y };
  };
  /* Zwei Leitungen, die beide waagrecht auf der Höhe der Schalterklemmen
     laufen und sich überlappen — der Schalter hängt danach beidseitig am
     selben Netz. */
  const a3 = ort(s, '3'), a4 = ort(s, '4');
  plan.leitungen.push({ id: 'x1', ebene: 'plan',
    punkte: [{ x: a3.x - 120, y: a3.y }, { x: a3.x, y: a3.y }],
    vonTeil: s.id, vonNr: '3' });
  plan.leitungen.push({ id: 'x2', ebene: 'plan',
    punkte: [{ x: a3.x - 120, y: a3.y }, { x: a4.x, y: a3.y }, { x: a4.x, y: a4.y }],
    vonTeil: s.id, vonNr: '4' });
  plan.leitungen.push({ id: 'x3', ebene: 'plan',
    punkte: [{ x: a3.x - 120, y: a3.y }, { x: a3.x - 120, y: 200 }],
    nachTeil: q.id, nachNr: 'L' });
  plan.leitungen.push({ id: 'x4', ebene: 'plan', punkte: [{ x: -800, y: -800 }],
    vonTeil: h.id, vonNr: 'X2', nachTeil: q.id, nachNr: 'N' });
  const e = Stromfluss.rechne(plan, {});
  return { warnungen: e.warnungen };
});
p('Ein überbrücktes Bauteil wird erkannt',
  (ueberbrueckt.warnungen || []).some((x: string) => /überbrückt/.test(x)),
  (ueberbrueckt.warnungen || []).join(' | ') || 'keine Warnung');
p('… und der richtige Plan von oben bekommt sie NICHT',
  !(sauber.warnungen || []).some((x: string) => /überbrückt/.test(x)));

/* ==========================================================================
 * §10 · Zahlen, die man lesen kann
 * ------------------------------------------------------------------------
 * „230" ist eine andere Zahl als „23", und beide sehen richtig aus. Die
 * naheliegende Fassung des Vorsatz-Formats macht genau diesen Fehler; er
 * stand hier schon einmal drin und wurde von der eigenen Sonde gefunden.
 * ========================================================================*/
console.log('\n10 · Vorsätze');

const texte = await seite.evaluate(() => ({
  milli:  Stromfluss.zeige(0.0031, 'A'),
  kilo:   Stromfluss.zeige(4700, 'Ω'),
  glatt:  Stromfluss.zeige(230, 'V'),
  gross:  Stromfluss.zeige(1500, 'W'),
  null_:  Stromfluss.zeige(0, 'A'),
  rausch: Stromfluss.zeige(4.71e-10, 'A'),
  mikro:  Stromfluss.zeige(0.0000047, 'F')
}));
p('3.1 mA', texte.milli === '3.1 mA', texte.milli);
p('4.7 kΩ', texte.kilo === '4.7 kΩ', texte.kilo);
p('230 V bleibt 230 V und wird nicht zu 23 V', texte.glatt === '230 V', texte.glatt);
p('1.5 kW', texte.gross === '1.5 kW', texte.gross);
p('0 bleibt 0', texte.null_ === '0 A', texte.null_);
p('Rechenrauschen wird als Null gezeigt, nicht als 4.71e-10',
  texte.rausch === '0 A', texte.rausch);
p('4.7 µF', texte.mikro === '4.7 µF', texte.mikro);

/* ==========================================================================
 * §11 · Und das alles auch auf dem Bildschirm
 * ========================================================================*/
console.log('\n11 · Die Fläche zeigt es');

const blockId = await seite.evaluate(() => {
  const st = Store.addPage(null, { text: 'Simulation' });
  const b = Store.addBlock(st.id, 'schaltplan', { text: 'Stromkreis' });
  const { plan, teil } = (window as any).bau();
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  /* Ein Stromlaufplan wird SENKRECHT gelesen: oben die Phase, unten der
     Neutralleiter, dazwischen der Zweig. Alle drei Symbole haben ihre
     Anschlüsse oben und unten — also stehen Schalter und Lampe in einer
     Spalte übereinander, und jede Leitung ist eine gerade Strecke.

     Das ist nicht Schönheit, sondern Notwendigkeit: der erste Versuch liess
     `rechtwinklig` routen, und die Leitung von G1 lief senkrecht durch den
     Anschluss 4 des Schalters hindurch. Der Schalter war überbrückt, die
     Lampe brannte bei offenem Schalter, und im Bild war nichts davon zu
     sehen. Die Warnung „überbrückt" hat es gesagt — sonst stünde hier eine
     grüne Prüfung über eine kaputte Schaltung. */
  q.x = 40;  q.y = 120;   /* L bei (70,120), N bei (70,180) */
  s.x = 240; s.y = 20;    /* 3 bei (260,20),  4 bei (260,80) */
  h.x = 230; h.y = 120;   /* X1 bei (260,120), X2 bei (260,180) */
  const ort = (t: any, nr: string) => {
    const a = Schaltplan.anschluesseVon(t).find((x: any) => x.nr === nr);
    return { x: a.x, y: a.y };
  };
  const leitung = (punkte: any[], a: any, an: string, b2: any, bn: string) =>
    plan.leitungen.push({ id: 'l' + plan.leitungen.length, ebene: 'plan',
      punkte, vonTeil: a.id, vonNr: an, nachTeil: b2.id, nachNr: bn });
  leitung([ort(q, 'L'), { x: 70, y: 20 }, ort(s, '3')], q, 'L', s, '3');
  leitung([ort(s, '4'), ort(h, 'X1')], s, '4', h, 'X1');
  leitung([ort(h, 'X2'), ort(q, 'N')], h, 'X2', q, 'N');
  Store.updateBlock(b.id, { plan });
  (window as any).__st = st.id;
  return b.id;
});
await seite.evaluate(() => { App.zeichneBaum(); App.oeffne((window as any).__st); });
await seite.waitForTimeout(900);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));

p('Die Planfläche steht', await seite.locator('.sp-wrap').count() === 1);
const knopf = seite.locator('.sp-start');
p('Es gibt einen Knopf für den Strom', await knopf.count() === 1);
/* Der Knopf trägt Text neben dem Zeichen. Ohne eigene Breite erbt er die
   34 px der Icon-Knöpfe und schneidet „Strom" zu „Stron" ab — gemessen,
   nicht vermutet. */
const knopfMass = await knopf.evaluate((k: HTMLElement) =>
  ({ innen: k.clientWidth, inhalt: k.scrollWidth, text: k.textContent }));
p('Und seine Beschriftung passt hinein', knopfMass.inhalt <= knopfMass.innen + 1,
  `„${knopfMass.text}" braucht ${knopfMass.inhalt}, hat ${knopfMass.innen}`);

const vorher = await seite.locator('.sp-fluss').count();
p('Vor dem Start fliesst nichts', vorher === 0);
await knopf.click();
await seite.waitForTimeout(400);
/* Der Schalter steht in Ruhelage, also OFFEN. Nach dem Start darf deshalb
   noch nichts fliessen — sonst wäre die Stellung nicht ausgewertet worden. */
const nachStart = await seite.locator('.sp-fluss').count();
p('Nach dem Start ist der Schalter noch offen, es fliesst nichts', nachStart === 0,
  `${nachStart} Leitungen fliessen, Fuss: ` +
  (await seite.locator('.sp-fuss').innerText()).replace(/\n/g, ' | ').slice(0, 120));
p('Die Schalter sind als schaltbar zu erkennen',
  await seite.locator('.sp-schaltbar').count() === 1);

await seite.locator('.sp-schaltbar').first().click({ force: true });
await seite.waitForTimeout(400);
const nachher = await seite.locator('.sp-fluss').count();
p('Ein Tipp auf den Schalter lässt den Strom fliessen', nachher === 3, `${nachher} Leitungen`);
p('Und die Lampe leuchtet', await seite.locator('.sp-leuchtet').count() === 1);
const messwerte = await seite.locator('.sp-messwert').count();
p('Die Messwerte stehen am Bauteil', messwerte >= 4, `${messwerte} Werte`);

const fussText = await seite.locator('.sp-fuss').innerText();
p('Der Fuss sagt, wie viele leuchten', /1 leuchtet/.test(fussText), fussText.slice(0, 90));
p('Und nennt den grössten Strom', /grösster Strom/.test(fussText));
p('„0 leuchten" heisst nicht „0 leuchteten"', !/leuchteten/.test(fussText));

/* Während die Simulation läuft, wird nicht gezeichnet — sonst radiert man
   sich beim Ausprobieren den Plan weg. */
await seite.locator('.sp-flaeche').click({ position: { x: 20, y: 20 }, force: true });
await seite.waitForTimeout(300);
const teileNachKlick = await seite.locator('.sp-teil').count();
p('Ein Klick auf die leere Fläche setzt kein Symbol', teileNachKlick === 3,
  `${teileNachKlick} Teile`);

await knopf.click();
await seite.waitForTimeout(400);
p('Nach dem Anhalten ist alles weg', await seite.locator('.sp-fluss').count() === 0);
p('Und der Plan steht unverändert da', await seite.locator('.sp-teil').count() === 3);

/* Der Plan darf die Schalterstellung NICHT gespeichert haben — ein Plan ist
   eine Zeichnung, kein Zustand. */
const imBlock = await seite.evaluate((id: string) =>
  JSON.stringify(Store.getBlock(id).plan), blockId);
p('Im Block steht keine Schalterstellung', !/stellung/i.test(imBlock));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
