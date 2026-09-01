/* Suite 283 — Lern-Evidenz: die Zahl bekommt ihre Grundlage (E289)
 * ============================================================================
 * Redion hat eine Fortschrittszahl, und sie ist NICHT falsch — sie misst nur
 * etwas anderes, als man beim Ansehen denkt.
 *
 * `topicProgress` (`learning.ts:206`, die Regel steht im Kommentar darüber)
 * rechnet `min(2, wdh)` je Karte durch `total * 2`: keine Wiederholung 0 %,
 * eine 50 %, zwei oder mehr 100 %. Das ist eine ABDECKUNG — wie weit man
 * durch den Stoff ist. Als solche stimmt sie.
 *
 * Was sie nicht ist: eine Aussage darüber, wie gut oder wie verlässlich
 * jemand etwas kann. EINE Karte, zweimal beantwortet, steht auf 100 %, und
 * `statistics().successRate` (`learning.ts:321`) teilt richtig durch bewertet
 * über die gesamte Zeit, ohne die Zahl der Antworten daneben.
 *
 * E289 setzt keine zweite Fortschrittszahl daneben — davor warnt der
 * Kommentar in `learning.ts` ausdrücklich —, sondern eine Zahl ANDERER ART:
 * wie sicher die Aussage ist, und woraus sie stammt.
 *
 * §1 hält fest, was die vorhandene Zahl wirklich misst, an der EINGEBAUTEN
 * Rechnung. Ohne diesen Abschnitt wäre nicht belegt, dass die neue Zahl eine
 * andere Frage beantwortet.
 *
 *   §1 DIE VORHANDENE ZAHL misst Abdeckung, nicht Verlässlichkeit.
 *   §2 WILSON: drei von drei sind nicht hundert Prozent.
 *   §3 HALTBARKEIT: was heute noch sitzt, kommt aus dem Abstand.
 *   §4 UNTER FÜNF BELEGEN wird gar nichts behauptet.
 *   §5 JE THEMA, mit Belegzahl und Satz im Klartext.
 *   §6 GEGEN DEN ECHTEN BESTAND.
 *
 *   node pruefungen/lauf/test283.mts
 * ==========================================================================*/
declare const Store: any; declare const Kompetenz: any; declare const Learning: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9063;

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
const nah = (a: number, b: number, eps = 0.005): boolean => Math.abs(a - b) < eps;

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' &&
        typeof (globalThis as any).Kompetenz !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);

const JETZT = Date.parse('2026-08-31T12:00:00.000Z');
const vorTagen = (n: number): string => new Date(JETZT - n * 86400000).toISOString();

/* ------------------------------------------------------------------------ */
console.log('\n1 · Was die vorhandene Zahl wirklich misst');

const alt = await seite.evaluate(() => {
  if (typeof Learning === 'undefined' || !Learning.topicProgress)
    return { da: false, prozent: -1 };
  /* EINE Karte, zweimal richtig. Mehr nicht. */
  const eine = [{ id: 'k1', type: 'flashcard', alive: true, text: 'A :: B',
                  sr: { ease: 2.5, intervall: 6, wdh: 2, faellig: '2099-01-01' } }];
  const jetzt = Date.parse('2026-08-31T12:00:00.000Z');
  const themen = Learning.topicProgress(eine, jetzt);
  const neu = Learning.topicProgress(
    [{ id: 'k0', type: 'flashcard', alive: true, text: 'C :: D' }], jetzt);
  const einmal = Learning.topicProgress(
    [{ id: 'k2', type: 'flashcard', alive: true, text: 'E :: F',
       sr: { ease: 2.5, intervall: 1, wdh: 1, faellig: '2099-01-01' } }], jetzt);
  return { da: true, prozent: themen[0] ? themen[0].progress : -1,
           karten: themen[0] ? themen[0].total : 0,
           neuProzent: neu[0] ? neu[0].progress : -1,
           einmalProzent: einmal[0] ? einmal[0].progress : -1 };
}) as any;

p('Die eingebaute Rechnung ist erreichbar', alt.da === true);
p('EINE zweimal beantwortete Karte steht dort auf 100 % — Abdeckung, nicht Können',
  alt.prozent === 100 && alt.karten === 1,
  alt.prozent + ' % aus ' + alt.karten + ' Karte(n)');
p('GEGENPROBE: als ABDECKUNG gelesen stimmt die Zahl — unwiederholt ist 0 %',
  alt.neuProzent === 0, String(alt.neuProzent));
p('… und einmal wiederholt ist 50 %', alt.einmalProzent === 50,
  String(alt.einmalProzent));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Wilson: drei von drei sind nicht hundert Prozent');

const w = await seite.evaluate(() => {
  const K = Kompetenz;
  return {
    dreiVonDrei: K.wilson(3, 3).unten,
    zwanzigVonZwanzig: K.wilson(20, 20).unten,
    zweihundert: K.wilson(200, 200).unten,
    haelfteKlein: K.wilson(1, 2).unten,
    haelfteGross: K.wilson(100, 200).unten,
    nullBelege: K.wilson(0, 0).unten,
    /* Die Schranke liegt IMMER unter der rohen Quote. */
    immerDrunter: [[3, 3], [7, 10], [1, 4], [90, 100]]
      .every(([r, g]) => K.wilson(r as number, g as number).unten <= (r as number) / (g as number)),
    /* Und sie wächst mit der Zahl der Belege bei gleicher Quote. */
    waechst: K.wilson(8, 10).unten < K.wilson(80, 100).unten &&
             K.wilson(80, 100).unten < K.wilson(800, 1000).unten
  };
}) as any;

p('Drei von drei ergeben rund 0,44 — nicht 1,0', nah(w.dreiVonDrei, 0.44, 0.02),
  String(w.dreiVonDrei));
p('Zwanzig von zwanzig ergeben rund 0,84', nah(w.zwanzigVonZwanzig, 0.84, 0.02),
  String(w.zwanzigVonZwanzig));
p('Zweihundert von zweihundert ergeben rund 0,98', nah(w.zweihundert, 0.98, 0.01),
  String(w.zweihundert));
p('Die Schranke liegt immer unter der rohen Quote', w.immerDrunter === true);
p('… und wächst mit der Zahl der Belege bei gleicher Quote', w.waechst === true,
  [w.haelfteKlein, w.haelfteGross].join(' / '));
p('Ohne Beleg gibt es keine Schranke', w.nullBelege === 0);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Haltbarkeit: was heute noch sitzt, kommt aus dem Abstand');

const h = await seite.evaluate(({ jetzt, heute, faellig, doppelt, nie }: any) => {
  const K = Kompetenz;
  return {
    frisch: K.haltbarkeit({ intervall: 10, zuletzt: heute }, jetzt),
    amTermin: K.haltbarkeit({ intervall: 10, zuletzt: faellig }, jetzt),
    doppeltSpaet: K.haltbarkeit({ intervall: 10, zuletzt: doppelt }, jetzt),
    langeHer: K.haltbarkeit({ intervall: 10, zuletzt: nie }, jetzt),
    ohneAbstand: K.haltbarkeit({ intervall: 0, zuletzt: heute }, jetzt),
    ohneAlles: K.haltbarkeit(undefined, jetzt),
    /* Ein grösserer Abstand hält länger — das ist der ganze Sinn von SM-2. */
    langerBesser: K.haltbarkeit({ intervall: 60, zuletzt: faellig }, jetzt) >
                  K.haltbarkeit({ intervall: 10, zuletzt: faellig }, jetzt)
  };
}, { jetzt: JETZT, heute: vorTagen(0), faellig: vorTagen(10),
     doppelt: vorTagen(20), nie: vorTagen(200) }) as any;

p('Gerade wiederholt: alles sitzt', nah(h.frisch, 1.0, 0.01), String(h.frisch));
p('Am Fälligkeitstag: rund 0,9 — so ist SM-2 gebaut', nah(h.amTermin, 0.9, 0.01),
  String(h.amTermin));
p('Doppelt so spät: rund 0,81', nah(h.doppeltSpaet, 0.81, 0.01), String(h.doppeltSpaet));
p('Nach 200 Tagen bei Abstand 10 ist fast nichts mehr da', h.langeHer < 0.15,
  String(h.langeHer));
p('Ein grösserer Abstand hält länger', h.langerBesser === true);
p('Ohne Abstand (gerade falsch) ist die Haltbarkeit 0, nicht klein',
  h.ohneAbstand === 0);
p('Ohne Zustand gibt es keine Behauptung', h.ohneAlles === 0);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Unter fünf Belegen wird gar nichts behauptet');

const wenig = await seite.evaluate(({ jetzt, frisch }: any) => {
  const K = Kompetenz;
  const karte = (id: string, thema: string, noten: number[]) => ({
    id, thema, sr: { intervall: 6, wdh: noten.length, zuletzt: frisch,
                     faellig: '2099-01-01' },
    reviewVerlauf: Object.fromEntries(noten.map((n, i) =>
      ['r' + i, { id: 'r' + i, at: frisch, rating: n }]))
  });
  const drei = K.jeThema([karte('a', 'Wenig', [4, 4, 4])], { jetzt });
  const zehn = K.jeThema([karte('b', 'Viel', [4, 4, 4, 4, 4, 4, 4, 4, 4, 4])], { jetzt });
  const keine = K.jeThema([{ id: 'c', thema: 'Neu', sr: null }], { jetzt });
  return {
    dreiGenug: drei[0].genug, dreiStufe: drei[0].stufe, dreiSatz: drei[0].satz,
    dreiSicher: drei[0].sicherheit,
    zehnGenug: zehn[0].genug, zehnStufe: zehn[0].stufe, zehnSatz: zehn[0].satz,
    keineSatz: keine[0].satz, keineGenug: keine[0].genug,
    /* Die Grenze lässt sich verschieben — sie ist ein Wert, keine Annahme. */
    mitEins: K.jeThema([karte('a', 'Wenig', [4, 4, 4])],
                       { jetzt, mindestBelege: 1 })[0].genug
  };
}, { jetzt: JETZT, frisch: vorTagen(1) }) as any;

p('Drei Antworten reichen nicht für eine Aussage', wenig.dreiGenug === false);
p('… es steht KEINE Stufe da, nicht „Am Anfang"', wenig.dreiStufe === '',
  '„' + wenig.dreiStufe + '"');
p('… und der Satz sagt, wie viele noch fehlen',
  /Noch 2 Antworten/.test(wenig.dreiSatz), wenig.dreiSatz);
p('GEGENPROBE: bei zehn Antworten sagt Redion sehr wohl etwas',
  wenig.zehnGenug === true && wenig.zehnStufe.length > 0,
  wenig.zehnStufe + ' / ' + wenig.zehnSatz);
p('Eine nie beantwortete Karte behauptet nichts und sagt das',
  wenig.keineGenug === false && /nie beantwortet|keine davon/.test(wenig.keineSatz),
  wenig.keineSatz);
p('Die Grenze ist ein Wert und keine Annahme', wenig.mitEins === true);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Je Thema, mit Belegzahl und Satz im Klartext');

const themen = await seite.evaluate(({ jetzt, frisch, alt }: any) => {
  const K = Kompetenz;
  const noten = (n: number, note: number, wann: string) =>
    Object.fromEntries(Array.from({ length: n }, (_x, i) =>
      ['r' + i, { id: 'r' + i, at: wann, rating: note }]));
  const karten = [
    { id: 'a', thema: 'Ohm', titel: 'U = R·I',
      sr: { intervall: 30, wdh: 12, zuletzt: frisch, faellig: '2099-01-01' },
      reviewVerlauf: noten(20, 4, frisch) },
    { id: 'b', thema: 'Ohm', titel: 'Leistung',
      sr: { intervall: 20, wdh: 8, zuletzt: frisch, faellig: '2099-01-01' },
      reviewVerlauf: noten(10, 4, frisch) },
    /* Dasselbe Thema, aber lange her — die Haltbarkeit muss einbrechen. */
    { id: 'c', thema: 'Kirchhoff', titel: 'Maschen',
      sr: { intervall: 10, wdh: 6, zuletzt: alt, faellig: '2020-01-01' },
      reviewVerlauf: noten(15, 4, alt) }
  ];
  const erg = K.jeThema(karten, { jetzt });
  const ohm = erg.find((e: any) => e.thema === 'Ohm');
  const kirch = erg.find((e: any) => e.thema === 'Kirchhoff');
  return {
    zahl: erg.length,
    ohmKarten: ohm.karten, ohmBelege: ohm.belege, ohmStufe: ohm.stufe,
    ohmHaltbar: ohm.haltbarkeit, ohmSatz: ohm.satz,
    kirchHaltbar: kirch.haltbarkeit, kirchStufe: kirch.stufe,
    kirchFaellig: kirch.faellig, kirchSatz: kirch.satz,
    /* Die Belegzahl steht IM SATZ — das ist die Übernahme aus RED-KURD. */
    nenntBelege: /aus 30 Antworten/.test(ohm.satz),
    /* Und die Reihenfolge: mehr Sicherheit zuerst. */
    reihe: erg.map((e: any) => e.thema)
  };
}, { jetzt: JETZT, frisch: vorTagen(1), alt: vorTagen(150) }) as any;

p('Zwei Themen aus drei Karten', themen.zahl === 2, String(themen.zahl));
p('„Ohm" fasst zwei Karten und dreissig Antworten zusammen',
  themen.ohmKarten === 2 && themen.ohmBelege === 30,
  themen.ohmKarten + ' / ' + themen.ohmBelege);
p('Die BELEGZAHL steht im Satz — das ist die Übernahme aus RED-KURD',
  themen.nenntBelege === true, themen.ohmSatz);
p('Frisch geübt: die Haltbarkeit ist hoch', themen.ohmHaltbar > 0.9,
  String(themen.ohmHaltbar));
p('150 Tage nicht angefasst bei Abstand 10: die Haltbarkeit bricht ein',
  themen.kirchHaltbar < 0.3, String(themen.kirchHaltbar));
p('… und die STUFE bleibt trotzdem gut — Können und Haltbarkeit sind zweierlei',
  themen.kirchStufe === 'Sitzt' || themen.kirchStufe === 'Fortgeschritten',
  themen.kirchStufe);
p('Die fällige Karte wird gezählt', themen.kirchFaellig === 1,
  String(themen.kirchFaellig));
p('… und im Satz genannt', /fällig/.test(themen.kirchSatz), themen.kirchSatz);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Gegen den echten Bestand');

const echt = await seite.evaluate(() => {
  const alle = Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b && b.alive && b.type === 'flashcard')
    .map((b: any) => ({ id: b.id, titel: String(b.text || '').slice(0, 40),
                        thema: 'Karteikarten', sr: b.sr,
                        reviewVerlauf: b.reviewVerlauf }));
  const g = Kompetenz.gesamt(alle);
  return {
    karten: alle.length, belege: g.belege, genug: g.genug,
    satz: g.satz,
    /* Ohne genug Belege darf keine Stufe dastehen — auch hier nicht. */
    stufeLeerWennWenig: g.genug || g.stufe === ''
  };
}) as any;

p('Der echte Bestand hat Karten', echt.karten > 0, String(echt.karten));
p('Und einen Satz dazu', typeof echt.satz === 'string' && echt.satz.length > 10,
  echt.satz);
p('Ohne genug Belege steht keine Stufe da', echt.stufeLeerWennWenig === true);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
