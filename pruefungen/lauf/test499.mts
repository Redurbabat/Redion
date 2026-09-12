/* Suite 233 — Falsch angeschlossen, und was in Wirklichkeit passieren würde
 * ============================================================================
 * Diese Suite prüft nicht, ob die Simulation rechnet, sondern ob sie
 * WARNT — und ob sie dabei etwas Brauchbares sagt.
 *
 * Der Unterschied ist der ganze Punkt. „Geht nicht" ist keine Auskunft. Ein
 * roter Rahmen ist keine Auskunft. Was ein Lernender braucht, ist der Satz
 * danach: dass der Schutzleiter jetzt Betriebsstrom führt, dass das Gehäuse
 * der Bohrmaschine unter Spannung steht, dass der Schalter aus ist und die
 * Fassung trotzdem nicht. Deshalb verlangt fast jede Zusage hier nicht nur
 * eine Fehlerkennung, sondern auch, dass die FOLGE benannt wird.
 *
 * §2 IST DER FEHLER, DEN DIE RECHNUNG NICHT FINDEN KANN. Sind N und PE
 * vertauscht, rechnet sich alles richtig: die Lampe brennt, kein Strom ist
 * auffällig, kein Messwert stimmt nicht. Am Sternpunkt sind die beiden ja
 * verbunden. Genau das macht ihn gefährlich — und genau deshalb muss er an
 * der ROLLE der Klemme gefunden werden und nicht am Strom. §2 verlangt
 * ausdrücklich, dass die Rechnung dabei GELINGT und trotzdem gewarnt wird.
 *
 * §4 IST DER UMGEKEHRTE FALL: beim Kurzschluss scheitert die Rechnung, und
 * zwar bevor irgendetwas gelöst wird. Wer die Fehlerprüfung erst hinterher
 * laufen liesse, hätte ausgerechnet dort keine Erklärung, wo wirklich etwas
 * passiert ist.
 *
 * §8 IST DIE WICHTIGSTE PRÜFUNG DER GANZEN SUITE. Ein Melder, der immer
 * meldet, ist wertlos — schlimmer als keiner, weil man ihn nach drei Tagen
 * wegklickt. Deshalb stehen dort vier richtig angeschlossene Anlagen, und
 * bei keiner darf auch nur ein Fund kommen.
 *
 *   node pruefungen/lauf/test499.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Schaltplan: any; declare const Stromfluss: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8976;

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
    return { ok: e.ok, fehler: e.fehler, werte: e.werte,
             anschlussfehler: e.anschlussfehler, warnungen: e.warnungen };
  }, [bauen, stellung] as [string, any]);

/** Findet einen Fund der gesuchten Art. */
const fund = (e: Erg, art: string): any =>
  (e.anschlussfehler || []).find((f: any) => f.art === art);
/** Die Arten, die gemeldet wurden — für lesbare Fehlermeldungen. */
const arten = (e: Erg): string =>
  ((e.anschlussfehler || []).map((f: any) => f.art).join(', ') || '(nichts)');

/** Ein Fund muss beides können: benennen UND die Folge erklären. */
const pFund = (name: string, e: Erg, art: string, schwere: string,
               folge: RegExp): void => {
  const f = fund(e, art);
  p(`${name}: wird als „${art}" gemeldet`, !!f, `gemeldet wurde: ${arten(e)}`);
  if (!f) { weg += 2; console.log(`  ✗ ${name}: Schwere`); console.log(`  ✗ ${name}: Folge`); return; }
  p(`${name}: Schwere „${schwere}" — als Wort, nicht als Farbe (§38)`,
    f.schwere === schwere, `ist "${f.schwere}"`);
  p(`${name}: sagt, was in Wirklichkeit passieren würde`,
    folge.test(f.warum), f.warum.slice(0, 110) + '…');
};

/* ==========================================================================
 * §1 · Ein Aussenleiter auf dem Schutzleiter
 * ========================================================================*/
console.log('\n1 · Aussenleiter am Schutzleiter');

const lAnPe = await rechne(`
  const q  = teil('drehstromquelle', 'G1');
  const pe = teil('leiter-pe', 'W1');
  draht(q, 'L1', pe, 'PE');
`);
pFund('L an PE', lAnPe, 'l-pe', 'gefahr', /Gehäuse|anfasst|230 V/);
p('L an PE: der Fund nennt die Regel dahinter', !!fund(lAnPe, 'l-pe')?.norm);

/* ==========================================================================
 * §2 · N und PE vertauscht — der Fehler, den die Rechnung nicht sieht
 * ========================================================================*/
console.log('\n2 · Neutralleiter und Schutzleiter vertauscht');

const nPe = await rechne(`
  const q  = teil('drehstromquelle', 'G1');
  const pe = teil('leiter-pe', 'W1');
  const h  = teil('lampe', 'E1');
  draht(q, 'L1', h, 'X1'); draht(h, 'X2', q, 'N');
  draht(q, 'N', pe, 'PE');
`);
pFund('N/PE', nPe, 'n-pe', 'gefahr', /funktioniert|Betriebsstrom|Gehäuse/i);
/* Das ist die eigentliche Zusage dieses Abschnitts. */
p('N/PE: die Rechnung GELINGT trotzdem — deshalb ist der Fehler gefährlich',
  nPe.ok === true, nPe.fehler);
p('N/PE: und die Lampe brennt ganz normal', nPe.werte.t3.fliesst === true);
p('N/PE: der Fund sagt ausdrücklich, dass es funktioniert',
  /FUNKTIONIERT/.test(fund(nPe, 'n-pe')?.warum || ''));

/* ==========================================================================
 * §3 · Zwei Aussenleiter auf derselben Klemme
 * ========================================================================*/
console.log('\n3 · Zwei Aussenleiter auf einer Klemme');

const lL = await rechne(`
  const q = teil('drehstromquelle', 'G1');
  draht(q, 'L1', q, 'L2');
`);
pFund('L1 an L2', lL, 'l-l', 'gefahr', /400 V/);

/* ==========================================================================
 * §4 · Kurzschluss L gegen N — die Rechnung scheitert, der Fund kommt trotzdem
 * ========================================================================*/
console.log('\n4 · Kurzschluss Aussenleiter gegen Neutralleiter');

const kurz = await rechne(`
  const q = teil('drehstromquelle', 'G1');
  draht(q, 'L1', q, 'N');
`);
p('Kurzschluss: die Rechnung scheitert, wie sie soll', kurz.ok === false);
pFund('Kurzschluss', kurz, 'l-n', 'gefahr', /Ampere|Leitungsschutzschalter/);
p('Kurzschluss: der Fund kommt auch dann, wenn nichts gerechnet werden konnte',
  (kurz.anschlussfehler || []).length > 0);

/* ==========================================================================
 * §5 · Schutzklasse I ohne Schutzleiter
 * ========================================================================*/
console.log('\n5 · Schutzklasse I ohne Schutzleiter');

const bauMotor = (mitPe: boolean) => `
  const q  = teil('drehstromquelle', 'G1');
  const m  = teil('motor-klemmenbrett', 'M1');
  draht(q, 'L1', m, 'U1'); draht(q, 'L2', m, 'V1'); draht(q, 'L3', m, 'W1');
  ${mitPe ? "draht(q, 'PE', m, 'PE');" : ''}
`;
const ohnePe = await rechne(bauMotor(false), { t2: 1 });
pFund('Motor ohne PE', ohnePe, 'pe-fehlt', 'gefahr', /Gehäuse|Fehlerstrom|anfasst/);
p('Motor ohne PE: er läuft trotzdem — auch das gehört zur Lehre',
  ohnePe.ok === true && ohnePe.werte.t2.fliesst === true);

const mitPe = await rechne(bauMotor(true), { t2: 1 });
p('Motor MIT PE: kein Fund mehr', !fund(mitPe, 'pe-fehlt'), arten(mitPe));

/* ==========================================================================
 * §6 · Der Schalter sitzt im Neutralleiter (NIN 4.6.1.2.3.2)
 * ========================================================================*/
console.log('\n6 · Schalter im Neutralleiter');

const schalterInN = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', h, 'X1'); draht(h, 'X2', s, '3'); draht(s, '4', q, 'N');
`, { t2: 1 });
pFund('Schalter in N', schalterInN, 'schalter-in-n', 'fehler', /Birne|Fassung|Schlag/);
p('Schalter in N: der Fund nennt die NIN-Stelle',
  /NIN 4\.6\.1\.2\.3\.2/.test(fund(schalterInN, 'schalter-in-n')?.norm || ''),
  fund(schalterInN, 'schalter-in-n')?.norm || '(keine Norm genannt)');

const schalterInL = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', s, '3'); draht(s, '4', h, 'X1'); draht(h, 'X2', q, 'N');
`, { t2: 1 });
p('Schalter im Aussenleiter: kein Fund — so gehört es sich',
  !fund(schalterInL, 'schalter-in-n'), arten(schalterInL));

/* ==========================================================================
 * §7 · Der Neutralleiter ist unterbrochen
 * ========================================================================*/
console.log('\n7 · Offener Neutralleiter');

const nOffen = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', h, 'X1');
`);
pFund('Offener N', nOffen, 'n-offen', 'gefahr', /spannungsfrei|Reihe|230 V/);
p('Offener N: es fliesst wirklich nichts', nOffen.werte.t2?.fliesst !== true);

/* Und derselbe Fall hinter einem offenen Schalter im Neutralleiter. */
const nOffenDurchSchalter = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', h, 'X1'); draht(h, 'X2', s, '3'); draht(s, '4', q, 'N');
`, { t2: 0 });
p('Offener Schalter im N unterbricht den Rückweg auch',
  !!fund(nOffenDurchSchalter, 'n-offen'), arten(nOffenDurchSchalter));

/* ==========================================================================
 * §8 · Und jetzt das Wichtigste: richtig angeschlossen meldet NICHTS
 * --------------------------------------------------------------------------
 * Ein Melder, der immer meldet, ist schlimmer als keiner — er wird nach drei
 * Tagen weggeklickt, und dann sieht niemand mehr den echten Fund. Diese vier
 * Anlagen sind richtig verdrahtet, und keine darf etwas ergeben.
 * ========================================================================*/
console.log('\n8 · Richtig angeschlossen — kein Fund');

const richtig1 = await rechne(`
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', s, '3'); draht(s, '4', h, 'X1'); draht(h, 'X2', q, 'N');
`, { t2: 1 });
p('Lampe mit Schalter im Aussenleiter: kein Fund',
  (richtig1.anschlussfehler || []).length === 0, arten(richtig1));

const richtig2 = await rechne(`
  const q = teil('drehstromquelle', 'G1');
  const m = teil('motor-klemmenbrett', 'M1');
  draht(q, 'L1', m, 'U1'); draht(q, 'L2', m, 'V1'); draht(q, 'L3', m, 'W1');
  draht(q, 'PE', m, 'PE');
`, { t2: 1 });
p('Drehstrommotor in Stern mit PE: kein Fund',
  (richtig2.anschlussfehler || []).length === 0, arten(richtig2));

const richtig3 = await rechne(`
  const q = teil('drehstromquelle', 'G1');
  const m = teil('motor-klemmenbrett', 'M1');
  draht(q, 'L1', m, 'U1'); draht(q, 'L2', m, 'V1'); draht(q, 'L3', m, 'W1');
  draht(q, 'PE', m, 'PE');
`, { t2: 2 });
p('Derselbe Motor in Dreieck: kein Fund',
  (richtig3.anschlussfehler || []).length === 0, arten(richtig3));

/* Drei einphasige Lampen auf drei Aussenleiter — die übliche
   Wohnungsverteilung. Keine davon hängt am Nachbar-Aussenleiter, und keine
   darf als „offener Neutralleiter" durchgehen. */
const richtig4 = await rechne(`
  const q  = teil('drehstromquelle', 'G1');
  const h1 = teil('lampe', 'E1');
  const h2 = teil('lampe', 'E2');
  const h3 = teil('lampe', 'E3');
  draht(q, 'L1', h1, 'X1'); draht(h1, 'X2', q, 'N');
  draht(q, 'L2', h2, 'X1'); draht(h2, 'X2', q, 'N');
  draht(q, 'L3', h3, 'X1'); draht(h3, 'X2', q, 'N');
`);
p('Drei Lampen auf drei Aussenleitern: kein Fund',
  (richtig4.anschlussfehler || []).length === 0, arten(richtig4));
p('Und sie brennen alle drei', richtig4.werte.t2.fliesst
  && richtig4.werte.t3.fliesst && richtig4.werte.t4.fliesst);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
