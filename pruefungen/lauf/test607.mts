/* Suite 607 — Die Drehstromkarten werden nachgerechnet, nicht geglaubt
 * ============================================================================
 * Ein Lernpaket ist eine Sammlung von Behauptungen. Normalerweise prueft
 * niemand sie nach: die Karte sagt 400 V, und wer soll widersprechen?
 *
 * HIER GEHT DAS ANDERS, und das ist der ganze Grund fuer diese Suite. Die
 * Drehstromkarten stellen Fragen ueber eine Schaltung, die in DIESER APP
 * gerechnet werden kann. Also wird sie gerechnet. Paragraph 2 baut zu jeder
 * Zahlenkarte den Stromkreis auf, laesst Stromfluss ihn loesen und vergleicht
 * das Ergebnis mit der Antwort, die auf der Karte steht.
 *
 * Eine Karte, die sich mit der Simulation widerspricht, macht diesen Lauf
 * rot. Damit kann das Lernpaket nicht mehr still von der App abdriften — und
 * das ist die haeufigste Art, wie Lernmaterial falsch wird: nicht durch einen
 * groben Fehler, sondern dadurch, dass sich nebenan etwas aendert und niemand
 * die Karten nachzieht.
 *
 * Paragraph 4 prueft, was das Paket ueber SICH SELBST sagt. Eine Lizenz auf
 * cleared und eine Herkunft auf verified sind Zusagen an den Nutzer.
 *
 *   node pruefungen/lauf/test607.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Schaltplan: any; declare const Stromfluss: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8960;

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

declare const Electrical: any;

const paket = await seite.evaluate(() => Electrical.THREE_PHASE_PACKAGE);
const karte = (id: string): any => paket.questions.find((q: any) => q.id === id);
/** Die Antwort, die auf der Karte als richtig markiert ist. */
const antwort = (id: string): string => {
  const k = karte(id);
  return k ? String(k.options[k.correct]) : '(Karte fehlt)';
};
/** Eine Zahl aus dem Antworttext ziehen — „400 V" wird zu 400. */
const zahl = (text: string): number =>
  parseFloat(text.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, ''));

const rechne = (bauen: string, stellung: Record<string, number> = {}): Promise<any> =>
  seite.evaluate(([quelle, st]: [string, any]) => {
    const { plan, teil, draht } = (window as any).bau();
    // eslint-disable-next-line no-new-func
    new Function('plan', 'teil', 'draht', quelle)(plan, teil, draht);
    const e = Stromfluss.rechne(plan, st);
    return { ok: e.ok, fehler: e.fehler, werte: e.werte, teilwerte: e.teilwerte };
  }, [bauen, stellung] as [string, any]);

/* ==========================================================================
 * 1 · Das Paket ist überhaupt da und vollständig
 * ========================================================================*/
console.log('\n1 · Das Paket');

p('Es gibt das Drehstrompaket', !!paket && Array.isArray(paket.questions));
p('Es trägt das Redion-Lernpaket-Schema', paket.schema === 'redion.learning-package/v1');
p('Es hat eine eigene Kennung', paket.manifest.id === 'redion.electrical.threephase');
p('Und ist nicht ins Grundlagenpaket gemischt worden',
  paket.manifest.id !== 'redion.electrical.fundamentals');
p('Es hat mindestens 20 Karten', paket.questions.length >= 20,
  `${paket.questions.length} Karten`);

const themen = [...new Set(paket.questions.map((q: any) => q.topic))];
p('Und sie sind in Themen gegliedert', themen.length >= 5, themen.join(' | '));
p('Jede Karte hat vier Antworten',
  paket.questions.every((q: any) => Array.isArray(q.options) && q.options.length === 4));
p('Jede Karte hat genau eine richtige davon',
  paket.questions.every((q: any) => Number.isInteger(q.correct)
    && q.correct >= 0 && q.correct < q.options.length));
p('Jede Karte erklärt ihre Antwort',
  paket.questions.every((q: any) => String(q.explanation || '').length > 25));
const doppelt = paket.questions.map((q: any) => q.id)
  .filter((x: string, i: number, a: string[]) => a.indexOf(x) !== i);
p('Keine Kennung kommt zweimal vor', !doppelt.length, doppelt.join(', '));

/* ==========================================================================
 * 2 · JEDE ZAHL WIRD NACHGERECHNET
 * --------------------------------------------------------------------------
 * Das ist der Kern. Die Karte behauptet eine Zahl; hier wird die Schaltung
 * aufgebaut, gerechnet und verglichen. Stimmt die Karte nicht mit der App
 * überein, gewinnt keiner von beiden — der Lauf wird rot, und ein Mensch
 * schaut nach, wer recht hat.
 * ========================================================================*/
console.log('\n2 · Die Zahlen werden nachgerechnet');

const netz = await rechne(`
  const q  = teil('drehstromquelle', 'G1');
  const v1 = teil('voltmeter', 'P1');
  const v2 = teil('voltmeter', 'P2');
  draht(q, 'L1', v1, '+'); draht(q, 'N',  v1, '−');
  draht(q, 'L1', v2, '+'); draht(q, 'L2', v2, '−');
`);
p('Die Strangspannung der Karte stimmt mit der Rechnung',
  nah(netz.werte.t2.Ubetrag, zahl(antwort('netz-strang'))),
  `Karte sagt „${antwort('netz-strang')}", gerechnet ${netz.werte.t2.Ubetrag.toFixed(1)} V`);
p('Die Aussenleiterspannung der Karte stimmt mit der Rechnung',
  nah(netz.werte.t3.Ubetrag, zahl(antwort('netz-aussen'))),
  `Karte sagt „${antwort('netz-aussen')}", gerechnet ${netz.werte.t3.Ubetrag.toFixed(1)} V`);
/* Und die Karte über die Verwechslung: 460 V darf NICHT herauskommen. */
p('Und es sind ausdrücklich nicht 460 V',
  !nah(netz.werte.t3.Ubetrag, 460),
  `gerechnet ${netz.werte.t3.Ubetrag.toFixed(1)} V`);

const bauMotor = `
  const q = teil('drehstromquelle', 'G1');
  const m = teil('motor-klemmenbrett', 'M1');
  draht(q, 'L1', m, 'U1'); draht(q, 'L2', m, 'V1'); draht(q, 'L3', m, 'W1');
  draht(q, 'PE', m, 'PE');
`;
const stern = await rechne(bauMotor, { t2: 1 });
const dreieck = await rechne(bauMotor, { t2: 2 });
p('Die Strangspannung im Stern stimmt mit der Karte',
  nah(stern.teilwerte.t2['U1–U2'].Ubetrag, zahl(antwort('stern-strang'))),
  `Karte sagt „${antwort('stern-strang')}", gerechnet ${stern.teilwerte.t2['U1–U2'].Ubetrag.toFixed(1)} V`);
p('Die Strangspannung im Dreieck stimmt mit der Karte',
  nah(dreieck.teilwerte.t2['U1–U2'].Ubetrag, zahl(antwort('dreieck-strang'))),
  `Karte sagt „${antwort('dreieck-strang')}", gerechnet ${dreieck.teilwerte.t2['U1–U2'].Ubetrag.toFixed(1)} V`);

const pS = ['U1–U2','V1–V2','W1–W2'].reduce((a, k) => a + stern.teilwerte.t2[k].P, 0);
const pD = ['U1–U2','V1–V2','W1–W2'].reduce((a, k) => a + dreieck.teilwerte.t2[k].P, 0);
p('Das Leistungsverhältnis der Karte („dreimal") stimmt mit der Rechnung',
  nah(pD / pS, 3, 0.005) && /dreimal/i.test(antwort('stern-dreieck-leistung')),
  `Karte sagt „${antwort('stern-dreieck-leistung')}", gerechnet ${(pD / pS).toFixed(3)}`);

/* Der Neutralleiter — die zwei Karten, die am leichtesten falsch werden. */
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
const drei = await rechne(nLeiter(3));
const zwei = await rechne(nLeiter(2));
const einStrang = 230 / 529;
p('Die Karte „gar keiner" stimmt: bei drei gleichen Lasten fliesst nichts im N',
  drei.werte.t2.Ibetrag < 1e-3 && /gar keiner/i.test(antwort('n-symmetrisch')),
  `Karte sagt „${antwort('n-symmetrisch')}", gerechnet ${drei.werte.t2.Ibetrag.toExponential(2)} A`);
p('Die Karte „genauso gross wie ein Strangstrom" stimmt bei zwei Lasten',
  nah(zwei.werte.t2.Ibetrag, einStrang)
  && /genauso gross/i.test(antwort('n-zwei-phasen')),
  `Karte sagt „${antwort('n-zwei-phasen')}", gerechnet ${zwei.werte.t2.Ibetrag.toFixed(4)} A gegen ${einStrang.toFixed(4)} A`);
p('Und es ist ausdrücklich NICHT das Doppelte',
  !nah(zwei.werte.t2.Ibetrag, 2 * einStrang, 0.05));

/* ==========================================================================
 * 3 · Die Fehlerkarten stimmen mit der Fehlerprüfung überein
 * ========================================================================*/
console.log('\n3 · Die Fehlerkarten');

const fehlerLauf = (bauen: string, stellung: Record<string, number> = {}): Promise<any> =>
  seite.evaluate(([quelle, st]: [string, any]) => {
    const { plan, teil, draht } = (window as any).bau();
    // eslint-disable-next-line no-new-func
    new Function('plan', 'teil', 'draht', quelle)(plan, teil, draht);
    const e = Stromfluss.rechne(plan, st);
    return (e.anschlussfehler || []).map((f: any) => f.art);
  }, [bauen, stellung] as [string, any]);

const artenNPE = await fehlerLauf(`
  const q  = teil('drehstromquelle', 'G1');
  const pe = teil('leiter-pe', 'W1');
  const h  = teil('lampe', 'E1');
  draht(q, 'L1', h, 'X1'); draht(h, 'X2', q, 'N');
  draht(q, 'N', pe, 'PE');
`);
p('Die Karte „Nichts — es funktioniert" deckt sich mit der Fehlerprüfung',
  artenNPE.includes('n-pe') && /^Nichts/.test(antwort('fehler-n-pe')),
  `Karte sagt „${antwort('fehler-n-pe')}", gemeldet: ${artenNPE.join(', ')}`);

const artenSchalter = await fehlerLauf(`
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', h, 'X1'); draht(h, 'X2', s, '3'); draht(s, '4', q, 'N');
`, { t2: 1 });
p('Die Karte zum Schalter im Neutralleiter deckt sich mit der Fehlerprüfung',
  artenSchalter.includes('schalter-in-n'), artenSchalter.join(', '));
/* Die Paragrafennummer gehört zur Sache und steht deshalb im Erklärtext —
   dieselbe, die auch die Fehlerprüfung nennt. */
p('Und sie nennt dieselbe Stelle wie die Fehlerprüfung',
  /NIN 4\.6\.1\.2\.3\.2/.test(karte('fehler-schalter-lage').explanation),
  karte('fehler-schalter-lage').explanation);

/* Der richtig verdrahtete Fall darf auch hier nichts melden. */
const artenGut = await fehlerLauf(`
  const q = teil('wechselspannung', 'G1');
  const s = teil('ch-schema0', 'S1');
  const h = teil('lampe', 'E1');
  draht(q, 'L', s, '3'); draht(s, '4', h, 'X1'); draht(h, 'X2', q, 'N');
`, { t2: 1 });
p('Und die richtig verdrahtete Schaltung meldet nichts', !artenGut.length,
  artenGut.join(', '));

/* ==========================================================================
 * 4 · Was das Paket über sich selbst sagt, muss stimmen
 * ========================================================================*/
console.log('\n4 · Lizenz und Herkunft');

p('Die Lizenz ist geklärt', paket.manifest.licenseStatus === 'cleared');
p('Die Herkunft ist geprüft', paket.manifest.provenanceStatus === 'verified');
p('Die Lizenz ist wirklich genannt und nicht „UNRESOLVED"',
  paket.manifest.license === 'CC0-1.0', paket.manifest.license);
p('Die Quellangabe sagt, dass die Zahlen nachgerechnet sind',
  /nachgerechnet/.test(paket.manifest.source), paket.manifest.source.slice(0, 80));
p('Das Paket führt keine Quarantäne — es hat nichts übernommen',
  Array.isArray(paket.quarantine) && !paket.quarantine.length);
p('Die Region ist die Schweiz', paket.manifest.region === 'CH');
/* KEINE Karte darf ein `norm`-Feld tragen, ohne die AUSGABE zu belegen.
   ---------------------------------------------------------------------------
   Das ist die Regel des Paketprüfers, und sie ist streng zu Recht: eine
   Paragrafennummer ohne Ausgabe kann niemand nachschlagen. Welche NIN-Ausgabe
   gilt, ist hier nicht belegt — also bleibt das Feld leer, und die Nummer
   steht im Erklärtext. Eine erfundene Ausgabe wäre schlimmer als keine. */
const normOhneAusgabe = paket.questions
  .filter((q: any) => q.norm && !q.source?.edition)
  .map((q: any) => q.id);
p('Keine Karte beruft sich auf eine Norm ohne belegte Ausgabe',
  !normOhneAusgabe.length, normOhneAusgabe.join(', '));

/* ==========================================================================
 * 5 · Und sie lassen sich wirklich installieren
 * ========================================================================*/
console.log('\n5 · Installieren');

const eingebaut = await seite.evaluate(() => {
  const r = Electrical.installPackage(Electrical.THREE_PHASE_PACKAGE, {
    paketId: Electrical.THREE_PHASE_PACKAGE.manifest.id,
    titel: 'Drehstrom und die fünf Leiter', symbol: '⚡' });
  const seiten = Object.values<any>(Store.cache.blocks).filter((b: any) =>
    b && b.alive !== false && b.type === 'page'
    && b.learningPackagePage === 'redion.electrical.threephase');
  const karten = seiten.length ? Store.childrenOf(seiten[0].id) : [];
  return { added: r.added, skipped: r.skipped, seitenTitel: seiten[0]?.text,
           karten: karten.length,
           /* NICHT abschneiden: der erste Anlauf schnitt auf 60 Zeichen und
              suchte dann das „::" darin — das steht aber hinter der Frage,
              und die ist länger. Die Prüfung mass ihre eigene Kürzung. */
           erste: String(karten[0]?.text || ''),
           hatQuiz: !!karten[0]?.quiz?.options };
});
p('Die Karten werden angelegt', eingebaut.added >= 20, `${eingebaut.added} angelegt`);
p('Auf einer eigenen Seite, nicht auf der Grundlagenseite',
  eingebaut.seitenTitel === 'Drehstrom und die fünf Leiter', String(eingebaut.seitenTitel));
p('Die Seite trägt so viele Karten wie das Paket',
  eingebaut.karten === paket.questions.length,
  `${eingebaut.karten} auf der Seite, ${paket.questions.length} im Paket`);
p('Eine Karte ist Frage :: Antwort', /::/.test(String(eingebaut.erste)),
  String(eingebaut.erste).slice(0, 80));
p('Und trägt ihre Antwortmöglichkeiten mit', eingebaut.hatQuiz);

const nochmal = await seite.evaluate(() =>
  Electrical.installPackage(Electrical.THREE_PHASE_PACKAGE, {
    paketId: Electrical.THREE_PHASE_PACKAGE.manifest.id,
    titel: 'Drehstrom und die fünf Leiter', symbol: '⚡' }));
p('Zweimal installieren legt nichts doppelt an',
  nochmal.added === 0 && nochmal.skipped === paket.questions.length,
  `${nochmal.added} neu, ${nochmal.skipped} übersprungen`);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
