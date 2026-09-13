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
const PORT = 8948;

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
             wechsel: e.wechsel, komplex: e.komplex };
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
p('Sie wird NICHT komplex gerechnet — der reelle Weg genügt',
  einphasig.komplex === false);
pNah('Und liefert unverändert 115 V je Lampe', einphasig.werte.t2.Ubetrag, 115, 'V');

/* --------------------------------------------------------------------------
 * Und hier die Unterscheidung, die zwei Bögen lang gefehlt hat.
 *
 * „Muss komplex gerechnet werden" und „ist Wechselstrom" sind NICHT dasselbe.
 * Eine einphasige 230-V-Quelle hat die Phasenlage 0, wird also rein reell
 * gerechnet — Wechselstrom ist sie trotzdem. Wer die beiden gleichsetzt,
 * malt an den Lampenstromkreis einen festen Richtungspfeil, und das ist
 * genau die Behauptung, die E540 verbietet.
 *
 * Gefunden hat diesen Fehler ein BILD, kein Prüflauf: die Zahlen stimmten
 * alle, nur der Pfeil zeigte stur in eine Richtung. Deshalb steht er jetzt
 * hier als Zusage.
 * ------------------------------------------------------------------------ */
p('Sie ist trotzdem Wechselstrom', einphasig.wechsel === true);
p('Und ihre Richtung heisst „wechselnd", auch ohne Drehstrom',
  einphasig.werte.t2.richtung === 'wechselnd',
  `ist "${einphasig.werte.t2.richtung}"`);
p('Der Messwert ist der Effektivwert und trägt deshalb kein Vorzeichen',
  einphasig.werte.t2.U === einphasig.werte.t2.Ubetrag);
p('Der Winkel unterscheidet die beiden Richtungen trotzdem: 0° oder 180°',
  Math.abs(Math.abs(einphasig.werte.t1.Iwinkel - einphasig.werte.t2.Iwinkel) - 180) < 0.5
  || Math.abs(einphasig.werte.t1.Iwinkel - einphasig.werte.t2.Iwinkel) < 0.5,
  `${einphasig.werte.t1.Iwinkel}° gegen ${einphasig.werte.t2.Iwinkel}°`);

/* Gleichstrom dagegen ist beides nicht — und behält sein Vorzeichen. */
const batterie = await rechne(`
  const q = teil('batterie', 'G1');
  const h = teil('lampe', 'E1', { R: 100 });
  draht(q, '+', h, 'X1'); draht(h, 'X2', q, '−');
`);
p('Die Batterie ist weder komplex noch Wechselstrom',
  batterie.komplex === false && batterie.wechsel === false);
p('Und ihr Messwert behält das Vorzeichen als Richtung',
  batterie.werte.t2.U !== batterie.werte.t2.Ubetrag
  || batterie.werte.t2.U > 0);

/* ==========================================================================
 * §6 · Die Stromrichtung — und wann sie eine Lüge wäre
 * --------------------------------------------------------------------------
 * Die Knotenpotentialanalyse liefert vorzeichenbehaftete Ströme, die
 * Richtung ist also fast umsonst zu haben. Genau das ist die Gefahr: bei
 * Wechselstrom ist derselbe Pfeil falsch, weil der Strom hundertmal je
 * Sekunde umkehrt. Diese Prüfung verlangt deshalb ZWEIERLEI — dass die
 * Richtung bei Gleichstrom steht, und dass sie bei Wechselstrom NICHT als
 * feste Richtung ausgegeben wird.
 * ========================================================================*/
console.log('\n6 · Stromrichtung');

/* Gleichstrom: die Batterie treibt, die Richtung ist eine Tatsache. */
const gleich = await rechne(`
  const q = teil('batterie', 'G1');
  const h = teil('lampe', 'E1', { R: 100 });
  draht(q, '+', h, 'X1'); draht(h, 'X2', q, '−');
`);
p('Der Gleichstromkreis rechnet', gleich.ok, gleich.fehler);
p('Bei Gleichstrom steht eine feste Richtung da',
  gleich.werte.t2.richtung === 'vor' || gleich.werte.t2.richtung === 'rueck',
  `ist "${gleich.werte.t2.richtung}"`);
p('Sie nennt die beiden Klemmen, damit ein Pfeil weiss, wohin er zeigt',
  gleich.werte.t2.vonKlemme === 'X1' && gleich.werte.t2.nachKlemme === 'X2');
p('Und sagt es in einem Satz',
  /fliesst von X[12] nach X[12]/.test(gleich.werte.t2.richtungstext),
  gleich.werte.t2.richtungstext);
p('Bei Gleichstrom gibt es keinen „Augenblick" — das Feld bleibt leer',
  gleich.werte.t2.richtungJetzt === undefined);

/* Das Umpolen muss die Richtung umdrehen. Ohne diese Zusage wäre „vor"
   auch dann richtig, wenn es gar nicht gerechnet würde. */
const umgepolt = await rechne(`
  const q = teil('batterie', 'G1');
  const h = teil('lampe', 'E1', { R: 100 });
  draht(q, '−', h, 'X1'); draht(h, 'X2', q, '+');
`);
p('Umgepolt dreht sich die Richtung um',
  umgepolt.werte.t2.richtung !== gleich.werte.t2.richtung,
  `vorher "${gleich.werte.t2.richtung}", nachher "${umgepolt.werte.t2.richtung}"`);

/* Ohne Strom gibt es keine Richtung — auch keine erfundene. */
const dunkel = await rechne(`
  const q = teil('batterie', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1', { R: 100 });
  draht(q, '+', s, '3'); draht(s, '4', h, 'X1'); draht(h, 'X2', q, '−');
`);
p('Fliesst nichts, ist die Richtung „keine"', dunkel.werte.t3.richtung === 'keine',
  `ist "${dunkel.werte.t3.richtung}"`);
p('Und der Satz behauptet keine Richtung',
  !/fliesst von/.test(dunkel.werte.t3.richtungstext), dunkel.werte.t3.richtungstext);

/* Und jetzt der Punkt, auf den es ankommt. */
p('Bei Wechselstrom ist die Richtung NICHT fest, sondern „wechselnd"',
  drei.werte.t3.richtung === 'wechselnd', `ist "${drei.werte.t3.richtung}"`);
/* Die Zahl muss stimmen: 50 Hz sind 50 volle Perioden je Sekunde, und die
   Richtung kehrt dabei HUNDERTMAL um — zweimal je Periode. „50-mal die
   Richtung gewechselt" ist die geläufige Redensart und trotzdem falsch; in
   einem Lehrmittel ist eine geläufige falsche Zahl die schlechteste Sorte. */
p('Der Satz nennt die Umkehr richtig: hundertmal, nicht fünfzigmal',
  /hundertmal/.test(drei.werte.t3.richtungstext)
  && !/50-mal je Sekunde/.test(drei.werte.t3.richtungstext),
  drei.werte.t3.richtungstext);
p('Und nennt den Pfeil beim Namen: Zählrichtung',
  /Zählrichtung/.test(drei.werte.t3.richtungstext));
p('Für den Bezugsaugenblick steht trotzdem eine Richtung da',
  ['vor', 'rueck', 'quer'].includes(drei.werte.t3.richtungJetzt),
  `ist "${drei.werte.t3.richtungJetzt}"`);
p('Und der Satz nennt auch diesen Augenblick',
  /Scheitels von L1/.test(drei.werte.t3.richtungstext));

/* Die drei Stränge eines Drehstrommotors dürfen im selben Augenblick NICHT
   alle dasselbe tun — sonst wäre es kein Drehfeld. Bei 0°, −120° und +120°
   ist der Kosinus 1, −0,5 und −0,5: einer vor, zwei zurück. */
const richtungen = ['U1–U2', 'V1–V2', 'W1–W2'].map(k => stern.teilwerte.t2[k].richtungJetzt);
p('Im Augenblick des Scheitels fliesst es nicht in allen drei Strängen gleich',
  new Set(richtungen).size > 1, richtungen.join(', '));
p('Genau einer der drei Stränge führt vorwärts',
  richtungen.filter((r: string) => r === 'vor').length === 1, richtungen.join(', '));

/* ==========================================================================
 * §7 · Und der Pfeil steht wirklich im Bild
 * --------------------------------------------------------------------------
 * Eine gerechnete Richtung, die niemand sieht, beantwortet keine Frage. Hier
 * wird deshalb der fertige SVG geprüft — dasselbe Bild, das die Planfläche
 * zeigt, nur ohne Browserfenster darum.
 *
 * Die entscheidende Zusage ist die letzte: der Unterschied zwischen
 * Gleich- und Wechselstrom muss in der FORM stecken. Ein Pfeil gegen zwei.
 * Wer die Farben nicht unterscheidet, muss ihn trotzdem sehen — §38 [hart].
 * ========================================================================*/
console.log('\n7 · Der Pfeil im Bild');

const zeichne = (bauen: string, stellung: Record<string, number> = {}): Promise<string> =>
  seite.evaluate(([quelle, st]: [string, any]) => {
    const { plan, teil, draht } = (window as any).bau();
    // eslint-disable-next-line no-new-func
    new Function('plan', 'teil', 'draht', quelle)(plan, teil, draht);
    const e = Stromfluss.rechne(plan, st);
    return Schaltplan.alsSvg(plan, { strom: e.ok ? {
      netzStrom: e.netzStrom, leitungNetz: e.leitungNetz,
      werte: e.werte, maxStrom: e.maxStrom } : undefined });
  }, [bauen, stellung] as [string, any]);

const svgGleich = await zeichne(`
  const q = teil('batterie', 'G1');
  const h = teil('lampe', 'E1');
  draht(q, '+', h, 'X1'); draht(h, 'X2', q, '−');
`);
p('Gleichstrom: ein Richtungspfeil steht im Bild',
  svgGleich.includes('sp-richtung'));
p('Gleichstrom: und zwar der EINFACHE', svgGleich.includes('M-12,0 H7'));
p('Gleichstrom: nicht der doppelte', !svgGleich.includes('M-13,0 H13'));

const svgWechsel = await zeichne(`
  const q = teil('wechselspannung', 'G1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', h, 'X1'); draht(h, 'X2', q, 'N');
`);
p('Wechselstrom: ein Richtungspfeil steht im Bild',
  svgWechsel.includes('sp-richtung'));
p('Wechselstrom: und zwar der DOPPELTE', svgWechsel.includes('M-13,0 H13'));
p('Wechselstrom: nicht der einfache', !svgWechsel.includes('M-12,0 H7'));
p('Wechselstrom: der Pfeil trägt den Satz zur Zählrichtung',
  /Zählrichtung/.test(svgWechsel) && /hundertmal/.test(svgWechsel));

/* Die Form muss den Unterschied tragen, nicht die Farbe.
   -------------------------------------------------------------------------
   Hier stand zuerst ein Vergleich der ganzen BILDER — und der war wertlos:
   die zwei Pläne enthalten ohnehin verschiedene Symbole (Batterie gegen
   Wechselspannungsquelle), also unterscheiden sie sich immer. Die Zusage
   konnte gar nicht rot werden, und §55.2 sagt, was das dann ist: keine
   Zusage. Verglichen wird jetzt der PFEIL, und nur er. */
const pfeilForm = (svg: string): string => {
  const i = svg.indexOf('class="sp-richtung"');
  if (i < 0) return '';
  const m = /d="([^"]+)"/.exec(svg.slice(i));
  return m ? m[1]! : '';
};
p('Der Unterschied steckt in der Form des Pfeils, nicht in der Farbe (§38)',
  !!pfeilForm(svgGleich) && !!pfeilForm(svgWechsel)
  && pfeilForm(svgGleich) !== pfeilForm(svgWechsel),
  `„${pfeilForm(svgGleich)}" gegen „${pfeilForm(svgWechsel)}"`);

const svgAus = await zeichne(`
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', s, '3'); draht(s, '4', h, 'X1'); draht(h, 'X2', q, 'N');
`, {});
p('Fliesst nichts, wird auch kein Pfeil gemalt',
  !svgAus.includes('sp-richtung'));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
