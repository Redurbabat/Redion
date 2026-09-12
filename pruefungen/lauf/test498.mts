/* Suite 232 — Drehstrom: die fünf Leiter und der Neutralleiterstrom
 * ============================================================================
 * Die Schweiz hängt an einem Netz von 3 × 400/230 V. Diese zwei Zahlen sind
 * der ganze Grund, warum diese Suite existiert — denn sie verführen zu einer
 * Abkürzung, die fast immer richtig aussieht und trotzdem falsch ist:
 *
 *     400 V = 230 V mal Wurzel 3
 *
 * Als ZAHL stimmt das. Als RECHENWEG ist es wertlos, weil es die Phasenlage
 * wegwirft — und mit ihr alles, was ein Lernender an Drehstrom verstehen
 * soll. Zwei Prüfungen hier gehen auf genau diesen Unterschied los:
 *
 *   §1 verlangt, dass die Spannung zwischen L2 und L3 um 90° gegen die von
 *      L1 versetzt ist. Aus einer Wurzel drei folgt kein einziger Winkel.
 *
 *   §4 ist der Fall, an dem die Abkürzung sichtbar zerbricht. Hängen zwei
 *      gleiche Lampen an L1 und L2, fliesst im Neutralleiter GENAU SO VIEL
 *      wie in einem Aussenleiter — nicht das Doppelte. Wer Beträge addiert,
 *      bekommt 0,87 A statt 0,43 A und merkt nichts, weil beide Zahlen
 *      plausibel sind. Und bei drei gleichen Lampen fliesst gar nichts,
 *      obwohl jeder Aussenleiter Strom führt. Das ist der Satz, der im
 *      Unterricht erklärt werden muss, und das ist die Prüfung dafür.
 *
 * §2 und §3 prüfen das Klemmenbrett: dieselben drei Wicklungen, nur andere
 * Brücken, und die Leistung verdreifacht sich. Auch diese Zahl wird
 * ausgerechnet und nicht eingetragen.
 *
 *   node pruefungen/lauf/test498.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Schaltplan: any; declare const Stromfluss: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8977;

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
const nah = (ist: number, soll: number, tol = 0.01): boolean =>
  Math.abs(ist - soll) <= tol * Math.max(1, Math.abs(soll));
const pNah = (n: string, ist: number, soll: number, einheit: string, tol = 0.01): void =>
  p(n, nah(ist, soll, tol), `ist ${ist.toPrecision(5)} ${einheit}, soll ${soll.toPrecision(5)} ${einheit}`);
/** Winkelvergleich: −180° und +180° sind derselbe Winkel. */
const pWinkel = (n: string, ist: number, soll: number, tol = 0.5): void => {
  let d = Math.abs(ist - soll) % 360;
  if (d > 180) d = 360 - d;
  p(n, d <= tol, `ist ${ist.toFixed(2)}°, soll ${soll.toFixed(2)}°`);
};

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
    return { ok: e.ok, fehler: e.fehler, werte: e.werte, teilwerte: e.teilwerte,
             warnungen: e.warnungen, annahmen: e.annahmen, maxStrom: e.maxStrom,
             spannung: e.spannung, spannungWinkel: e.spannungWinkel,
             wechsel: e.wechsel };
  }, [bauen, stellung] as [string, any]);

const WURZEL3 = Math.sqrt(3);

/* ==========================================================================
 * §1 · Die Quelle: 230 V am Strang, 400 V zwischen den Aussenleitern
 * --------------------------------------------------------------------------
 * Gemessen wird mit Voltmetern, weil das die Frage aus dem Unterricht ist:
 * „Was zeigt das Messgerät zwischen L1 und L2?" — und weil ein Voltmeter im
 * Gegensatz zu einer Netznummer auch falsch angeschlossen werden kann.
 * ========================================================================*/
console.log('\n1 · Die Drehstromquelle');

const quelle = await rechne(`
  const q  = teil('drehstromquelle', 'G1');
  const v1 = teil('voltmeter', 'P1');
  const v2 = teil('voltmeter', 'P2');
  const v3 = teil('voltmeter', 'P3');
  draht(q, 'L1', v1, '+'); draht(q, 'N',  v1, '−');
  draht(q, 'L1', v2, '+'); draht(q, 'L2', v2, '−');
  draht(q, 'L2', v3, '+'); draht(q, 'L3', v3, '−');
`);
p('Die Drehstromquelle rechnet', quelle.ok, quelle.fehler);
p('Und zwar als Wechselstrom mit Zeigern', quelle.wechsel === true);
pNah('L1 gegen N sind 230 V', quelle.werte.t2.Ubetrag, 230, 'V');
pNah('L1 gegen L2 sind 400 V', quelle.werte.t3.Ubetrag, 230 * WURZEL3, 'V');
pNah('L2 gegen L3 sind ebenfalls 400 V', quelle.werte.t4.Ubetrag, 230 * WURZEL3, 'V');
/* Der Winkel ist der Punkt. Eine Wurzel drei hat keinen. */
pWinkel('L1 gegen L2 eilt um 30° vor', quelle.werte.t3.Uwinkel, 30);
pWinkel('L2 gegen L3 steht um 90° gedreht dazu', quelle.werte.t4.Uwinkel, -90);
p('Die beiden Aussenleiterspannungen sind gleich gross …',
  nah(quelle.werte.t3.Ubetrag, quelle.werte.t4.Ubetrag, 1e-6));
p('… und trotzdem nicht dieselbe Spannung',
  Math.abs(quelle.werte.t3.Uwinkel - quelle.werte.t4.Uwinkel) > 60);

/* ==========================================================================
 * §2 · Das Klemmenbrett in Stern
 * ========================================================================*/
console.log('\n2 · Motor in Sternschaltung');

const bauMotor = `
  const q = teil('drehstromquelle', 'G1');
  const m = teil('motor-klemmenbrett', 'M1');
  draht(q, 'L1', m, 'U1'); draht(q, 'L2', m, 'V1'); draht(q, 'L3', m, 'W1');
`;
const stern = await rechne(bauMotor, { t2: 1 });
p('Der Motor in Stern rechnet', stern.ok, stern.fehler);
const sU = stern.teilwerte.t2;
pNah('Am Strang U1–U2 liegen 230 V', sU['U1–U2'].Ubetrag, 230, 'V');
pNah('Am Strang V1–V2 ebenso', sU['V1–V2'].Ubetrag, 230, 'V');
pNah('Am Strang W1–W2 ebenso', sU['W1–W2'].Ubetrag, 230, 'V');
pNah('Der Strangstrom ist 230 V / 60 Ω', sU['U1–U2'].Ibetrag, 230 / 60, 'A');
const pStern = sU['U1–U2'].P + sU['V1–V2'].P + sU['W1–W2'].P;
pNah('Die Leistung ist 3 × 230² / 60', pStern, 3 * 230 * 230 / 60, 'W');
/* Die drei Strangströme stehen um 120° auseinander — sonst wäre es kein
   Drehfeld, sondern drei getrennte Wechselstromkreise. */
pWinkel('Strang U liegt auf 0°', sU['U1–U2'].Iwinkel, 0);
pWinkel('Strang V um 120° versetzt', sU['V1–V2'].Iwinkel, -120);
pWinkel('Strang W um weitere 120°', sU['W1–W2'].Iwinkel, 120);

/* ==========================================================================
 * §3 · Dasselbe Klemmenbrett in Dreieck
 * ========================================================================*/
console.log('\n3 · Motor in Dreieckschaltung');

const dreieck = await rechne(bauMotor, { t2: 2 });
p('Der Motor in Dreieck rechnet', dreieck.ok, dreieck.fehler);
const dU = dreieck.teilwerte.t2;
pNah('Am Strang liegen jetzt 400 V', dU['U1–U2'].Ubetrag, 230 * WURZEL3, 'V');
const pDreieck = dU['U1–U2'].P + dU['V1–V2'].P + dU['W1–W2'].P;
pNah('Die Leistung ist 3 × 400² / 60', pDreieck, 3 * (230 * WURZEL3) ** 2 / 60, 'W');
pNah('Dreieck zieht genau die dreifache Leistung von Stern',
  pDreieck / pStern, 3, '', 0.001);
/* Und ohne Brücken ist der Motor nicht falsch geschaltet, sondern offen. */
const ohne = await rechne(bauMotor, { t2: 0 });
p('Ohne Brücken fliesst nichts', ohne.ok && ohne.maxStrom < 1e-6,
  `maxStrom ${ohne.maxStrom}`);

/* ==========================================================================
 * §4 · Der Neutralleiterstrom — die Prüfung, auf die es ankommt
 * --------------------------------------------------------------------------
 * Gemessen mit einem Amperemeter im Neutralleiter. Sein Strom ist eine
 * Unbekannte des Gleichungssystems, also ein Messwert und keine Schätzung.
 * ========================================================================*/
console.log('\n4 · Der Strom im Neutralleiter');

const nLeiter = (lampen: number) => `
  const q = teil('drehstromquelle', 'G1');
  const a = teil('amperemeter', 'P1');
  const h1 = teil('lampe', 'E1');
  ${lampen >= 2 ? "const h2 = teil('lampe', 'E2');" : ''}
  ${lampen >= 3 ? "const h3 = teil('lampe', 'E3');" : ''}
  draht(q, 'L1', h1, 'X1'); draht(h1, 'X2', a, '+');
  ${lampen >= 2 ? "draht(q, 'L2', h2, 'X1'); draht(h2, 'X2', a, '+');" : ''}
  ${lampen >= 3 ? "draht(q, 'L3', h3, 'X1'); draht(h3, 'X2', a, '+');" : ''}
  draht(a, '−', q, 'N');
`;

const einStrang = 230 / 529;

const eine = await rechne(nLeiter(1));
p('Eine Lampe an L1 rechnet', eine.ok, eine.fehler);
pNah('Der Aussenleiter führt 230 V / 529 Ω', eine.werte.t3.Ibetrag, einStrang, 'A');
pNah('Der Neutralleiter führt genau denselben Strom zurück',
  eine.werte.t2.Ibetrag, einStrang, 'A');

const zwei = await rechne(nLeiter(2));
p('Zwei Lampen an L1 und L2 rechnen', zwei.ok, zwei.fehler);
pNah('Jeder Aussenleiter führt weiterhin seinen Strangstrom',
  zwei.werte.t3.Ibetrag, einStrang, 'A');
/* HIER zerbricht die Abkürzung. Zwei Zeiger um 120° versetzt ergeben addiert
   wieder genau einen — nicht zwei. Wer Beträge addiert, bekommt das Doppelte
   und merkt es nie, weil 0,87 A für zwei Lampen plausibel aussieht. */
pNah('Im Neutralleiter fliesst trotzdem nur EIN Strangstrom, nicht zwei',
  zwei.werte.t2.Ibetrag, einStrang, 'A');
p('Und ganz sicher nicht die Summe der Beträge',
  !nah(zwei.werte.t2.Ibetrag, 2 * einStrang, 0.05),
  `ist ${zwei.werte.t2.Ibetrag.toPrecision(5)} A`);

const drei = await rechne(nLeiter(3));
p('Drei gleiche Lampen rechnen', drei.ok, drei.fehler);
pNah('Jeder Aussenleiter führt seinen Strangstrom',
  drei.werte.t3.Ibetrag, einStrang, 'A');
/* Der Satz, den jeder Lernende hören muss: bei gleichmässiger Last ist der
   Neutralleiter stromlos, obwohl alle drei Aussenleiter Strom führen. */
p('Bei symmetrischer Last ist der Neutralleiter stromlos',
  drei.werte.t2.Ibetrag < 1e-3,
  `ist ${drei.werte.t2.Ibetrag.toPrecision(4)} A`);
p('Obwohl in den Aussenleitern sehr wohl Strom fliesst',
  drei.werte.t3.Ibetrag > 0.4);

/* ==========================================================================
 * §5 · Einphasig bleibt einphasig
 * --------------------------------------------------------------------------
 * Die Zeigerrechnung darf die bestehenden Schaltungen nicht verändern. Eine
 * Quelle ohne Phasenversatz muss dieselben Zahlen liefern wie vorher, und
 * zwar auf dem reellen Weg — sonst wäre jede Prüfung in test239 ein Zufall.
 * ========================================================================*/
console.log('\n5 · Einphasig rechnet weiter reell');

const einphasig = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const h1 = teil('lampe', 'E1');
  const h2 = teil('lampe', 'E2');
  draht(q, 'L', h1, 'X1'); draht(h1, 'X2', h2, 'X1'); draht(h2, 'X2', q, 'N');
`);
p('Die Reihenschaltung rechnet', einphasig.ok, einphasig.fehler);
p('Sie wird NICHT als Zeiger gerechnet', einphasig.wechsel === false);
pNah('Und liefert unverändert 115 V je Lampe', Math.abs(einphasig.werte.t2.U), 115, 'V');
p('Das Vorzeichen bleibt erhalten, weil es bei Gleichstrom eine Richtung ist',
  einphasig.werte.t2.U !== einphasig.werte.t2.Ubetrag
  || einphasig.werte.t2.U > 0);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
