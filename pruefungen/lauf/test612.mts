/* Suite 612 — Eine Brücke ist eine Verbindung (E747, L253 Punkt 2)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Das Klemmenbrett eines Drehstrommotors hat sechs
 * Wicklungsklemmen und einen Erdungsbolzen. Wie die Wicklungen verschaltet
 * sind, machen die BRÜCKEN der eingestellten Stellung aus
 * (`simulation.ts`, VERHALTEN 'motor-klemmenbrett'):
 *
 *     Stern     U2–V2, V2–W2           der Sternpunkt, an keiner Leitung
 *     Dreieck   U1–W2, V1–U2, W1–V2    jede Ecke an einem Aussenleiter
 *
 * Die Rechnung kannte die Brücken seit E730. Die Meldung „Anschluss … hängt
 * an keiner Leitung" kannte nur Leitungen: in BEIDEN Stellungen meldete die
 * Fusszeile der Planfläche „M1: Anschluss W2 hängt an keiner Leitung", dazu
 * U2 und V2 — also gerade die drei Klemmen, auf denen im Stern die Brücken
 * liegen (Bild in L253, gemessen auf 97d156b03). Eine falsche Warnung lehrt
 * etwas Falsches: dass am Sternpunkt eine Leitung fehle.
 *
 * DIE ZUSAGEN:
 *
 *   §1  Stern mit allen Zuleitungen: keine Klemme von M1 wird gemeldet, und
 *       die Rechnung ist dieselbe (230 V am Strang).
 *   §2  Dreieck mit allen Zuleitungen: ebenso (400 V am Strang).
 *   §3  Ohne Brücken: W2, U2 und V2 hängen wirklich an nichts — sie werden
 *       weiter gemeldet, alle drei.
 *   §4  Eine wirklich offene Klemme bleibt gemeldet: im Stern die fehlende
 *       Zuleitung an W1 (genau W1, nicht mehr), im Dreieck der Erdungsbolzen
 *       ohne Schutzleiter (genau PE). Und eine Ecke des Dreiecks, die nur
 *       ihre eigene Brücke hält: fehlt die Zuleitung an U1, hängen U1 und W2
 *       zusammen an nichts — gemeldet wird genau U1, einmal, obwohl der
 *       Motor auf zwei Aussenleitern weiterläuft (9,96 A). Ebenso V1, und
 *       ohne jede Leitung U1, V1, W1 und PE.
 *   §5  Umschalten ändert die Meldung: derselbe Plan in der Folge ohne →
 *       Stern → Dreieck → ohne.
 *   §6  Die Grenze: ein geschlossener SCHALTKONTAKT ist keine Brücke. Ein
 *       Ausschalter, dessen Ausgang an nichts hängt, wird gemeldet, auch wenn
 *       er geschlossen ist — sein Kontakt ersetzt keine Leitung.
 *   §7  Die echte Planfläche: Simulation an, auf M1 tippen. Im Stern und im
 *       Dreieck zeigt die Fusszeile keine Warnung, ohne Brücken die drei
 *       wirklich offenen Klemmen — und jedes Mal genau die Warnungen, die
 *       `Stromfluss.rechne` für dieselbe Stellung liefert. Ein zweiter Plan
 *       ohne Zuleitung an U1: im Dreieck nennt die Fusszeile U1.
 *   §8  Der Sternpunkt steht in der STELLUNG, nicht im Code (§5 Regel 3,
 *       §8): „Stern" trägt `sternpunkt` U2, V2, W2, die anderen Stellungen
 *       keinen. Darum bleibt der Sternpunkt ohne jede Zuleitung still
 *       (gemeldet U1, V1, W1, PE), und ein Stern, der in „ohne Brücken" mit
 *       zwei LEITUNGEN gezeichnet ist, wird nicht als offen gemeldet — die
 *       Regel gilt nur für Knoten, die eine Brücke der Stellung hält.
 *   §9  Keine Seitenfehler.
 *
 * Kein Port: geladen wird über file:// — test400 bleibt unberührt.
 *
 * KANN DIESER LAUF ROT WERDEN? (§55.2) Ja: gegen 97d156b03 ist er rot in §1,
 * §2, §4, §5 und §7 — die Zahlen stehen in E747. Gegenproben dort: die
 * Brücken in der Meldung wieder übergangen → dieselben Abschnitte rot; die
 * Kontakte ALLER schaltbaren Bauteile als Brücken → §6 rot; die Brücken
 * JEDER Stellung statt der eingestellten → §3, §4, §5 und §7 rot. Gegen
 * 7560b2f22 (E747 ohne den Sternpunkt in der Stellung) rot in §4, §7 und
 * §8: die Ecke U1–W2 ohne Zuleitung schwieg. Gegenproben zum Sternpunkt:
 * die Marke `sternpunkt` aus „Stern" heraus → §1, §4, §5, §7 und §8 rot;
 * die Regel auch für Knoten ohne Brücke → §8 rot; jede Klemme der Ecke
 * statt einer je Knoten → §4 und §7 rot.
 *
 *   node pruefungen/alle.mts 612
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Stromfluss: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const nah = (ist: number, soll: number): boolean => Math.abs(ist - soll) <= 0.01 * Math.abs(soll);

console.log('\n' + '─'.repeat(60));
console.log('Suite 612 — Eine Brücke ist eine Verbindung (E747, L253 Punkt 2)');
console.log('─'.repeat(60));

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const seite = await ktx.newPage();
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(INDEX);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined'
  && typeof Stromfluss !== 'undefined' && !!document.querySelector('#page')?.firstElementChild,
  null, { timeout: 30000 });
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta('neuerungenGesehen', 99);
  Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
    .forEach(el => el.remove());

  /**
   * Der Motorplan: Drehstromquelle G1, Klemmenbrett M1 und eine Lampe E1
   * zwischen L1 und N — die Lampe nur, damit der Neutralleiter der Quelle
   * belegt ist und in der Fusszeile nichts anderes vor M1 steht. Die Lage
   * von G1, M1 und w1–w4 ist die des Bildes aus L253; jede Leitung trägt
   * ihre Bindung UND Punkte, die auf ihren Klemmen enden (eine Leitung mit
   * weniger als zwei Punkten verwirft `Schaltplan.lesen`). `ohne` nimmt
   * Leitungen heraus, `extra` legt welche dazu.
   */
  (window as any).motorPlan = (ohne: string[] = [], extra: any[] = []): any => {
    const T = (id: string, zeichen: string, x: number, y: number): any =>
      ({ id, zeichen, x, y, drehung: 0, gespiegelt: false, bmk: id, nummern: {}, gruppe: '', ebene: 'plan' });
    const L = (id: string, punkte: number[][], a: string, an: string, b: string, bn: string): any =>
      ({ id, ebene: 'plan', punkte: punkte.map(([x, y]) => ({ x, y })),
         vonTeil: a, vonNr: an, nachTeil: b, nachNr: bn });
    const leitungen = [
      L('w1', [[50, 120], [50, 240]], 'G1', 'L1', 'M1', 'U1'),
      L('w2', [[80, 120], [80, 190], [90, 190], [90, 240]], 'G1', 'L2', 'M1', 'V1'),
      L('w3', [[110, 120], [110, 200], [130, 200], [130, 240]], 'G1', 'L3', 'M1', 'W1'),
      L('w4', [[170, 120], [170, 160], [220, 160], [220, 370], [50, 370], [50, 330]], 'G1', 'PE', 'M1', 'PE'),
      L('e1', [[50, 120], [50, 130], [330, 130], [330, 140]], 'G1', 'L1', 'E1', 'X1'),
      L('e2', [[330, 200], [330, 215], [250, 215], [250, 145], [140, 145], [140, 120]], 'E1', 'X2', 'G1', 'N')
    ].filter(l => !ohne.includes(l.id)).concat(extra);
    return { art: 'stromlauf-aufgeloest', breite: 600, hoehe: 400, texte: [],
             ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }],
             teile: [T('G1', 'drehstromquelle', 40, 40), T('M1', 'motor-klemmenbrett', 40, 240),
                     T('E1', 'lampe', 300, 140)],
             leitungen };
  };
  /** Welche Klemmen eines Teils als „hängt an keiner Leitung" gemeldet werden. */
  /** Der Stern als zwei gezeichnete LEITUNGEN statt Brücken: W2–U2, U2–V2. */
  (window as any).sternGezeichnet = (): any[] => [
    { id: 'b1', ebene: 'plan', punkte: [[90, 330], [90, 350], [130, 350], [130, 330]].map(([x, y]) => ({ x, y })),
      vonTeil: 'M1', vonNr: 'W2', nachTeil: 'M1', nachNr: 'U2' },
    { id: 'b2', ebene: 'plan', punkte: [[130, 330], [130, 345], [170, 345], [170, 330]].map(([x, y]) => ({ x, y })),
      vonTeil: 'M1', vonNr: 'U2', nachTeil: 'M1', nachNr: 'V2' }
  ];
  (window as any).offen = (e: any, teil: string): string[] =>
    ((e && e.warnungen) || [])
      .map((w: string) => new RegExp('^' + teil + ': Anschluss (\\S+) hängt an keiner Leitung\\.$').exec(w))
      .filter(Boolean).map((m: RegExpExecArray) => m[1]).sort();
});

type Stand = { ok: boolean; fehler: string; offen: string[]; alleOffen: number;
               warnungen: string[]; strang: number; maxStrom: number };
const motor = (stellung: number, ohne: string[] = [], sternGezeichnet = false): Promise<Stand> =>
  seite.evaluate(([st, oh, sg]: [number, string[], boolean]) => {
    const w = window as any;
    const e = Stromfluss.rechne(w.motorPlan(oh, sg ? w.sternGezeichnet() : []), { M1: st });
    const tw = e.teilwerte && e.teilwerte.M1 && e.teilwerte.M1['U1–U2'];
    return { ok: e.ok, fehler: e.fehler, offen: w.offen(e, 'M1'),
             alleOffen: (e.warnungen || []).filter((x: string) => /hängt an keiner Leitung/.test(x)).length,
             warnungen: e.warnungen || [], strang: tw ? tw.Ubetrag : NaN,
             maxStrom: typeof e.maxStrom === 'number' ? e.maxStrom : NaN };
  }, [stellung, ohne, sternGezeichnet] as [number, string[], boolean]);

/* ══ §1 Stern ═══════════════════════════════════════════════════════════════ */
console.log('\n§1 Stern mit allen Zuleitungen');
const stern = await motor(1);
p('Der Plan rechnet', stern.ok, stern.fehler);
gleich('Keine Klemme von M1 hängt „an keiner Leitung" (die Brücken liegen auf W2, U2, V2)',
  stern.offen, []);
p('Und gar keine Klemme im Plan wird als offen gemeldet', stern.alleOffen === 0,
  stern.warnungen.join(' | '));
p('Die Rechnung ist dieselbe: 230 V am Strang', nah(stern.strang, 230), `ist ${stern.strang}`);

/* ══ §2 Dreieck ═════════════════════════════════════════════════════════════ */
console.log('\n§2 Dreieck mit allen Zuleitungen');
const dreieck = await motor(2);
p('Der Plan rechnet', dreieck.ok, dreieck.fehler);
gleich('Keine Klemme von M1 hängt „an keiner Leitung" (W2, U2, V2 hängen über die Brücken an U1, V1, W1)',
  dreieck.offen, []);
p('Und gar keine Klemme im Plan wird als offen gemeldet', dreieck.alleOffen === 0,
  dreieck.warnungen.join(' | '));
p('Die Rechnung ist dieselbe: 400 V am Strang', nah(dreieck.strang, 230 * Math.sqrt(3)),
  `ist ${dreieck.strang}`);

/* ══ §3 Ohne Brücken ════════════════════════════════════════════════════════ */
console.log('\n§3 Ohne Brücken hängen W2, U2, V2 wirklich an nichts');
const ohne = await motor(0);
gleich('Gemeldet werden genau U2, V2 und W2', ohne.offen, ['U2', 'V2', 'W2']);

/* ══ §4 Wirklich offen ══════════════════════════════════════════════════════ */
console.log('\n§4 Eine wirklich offene Klemme bleibt gemeldet');
const sternOhneW1 = await motor(1, ['w3']);
gleich('Stern ohne Zuleitung an W1: gemeldet wird genau W1', sternOhneW1.offen, ['W1']);
const dreieckOhnePe = await motor(2, ['w4']);
gleich('Dreieck ohne Schutzleiter: gemeldet wird genau der Erdungsbolzen PE', dreieckOhnePe.offen, ['PE']);
/* Die Ecke U1–W2 hält nur die eigene Brücke. Sie zählt nicht als Leitung:
   an U1 fehlt die Zuleitung, und genau das ist zu melden — einmal, mit der
   Klemme, an die die Zuleitung gehört. Die Lampe E1 hängt weiter an L1, also
   meldet auch G1 nichts; ohne die Meldung an M1 sagte die Fusszeile gar
   nichts. */
const dreieckOhneU1 = await motor(2, ['w1']);
gleich('Dreieck ohne Zuleitung an U1: gemeldet wird genau U1 (die Ecke U1–W2 hält nur ihre Brücke)',
  dreieckOhneU1.offen, ['U1']);
p('Und der Motor läuft dabei auf zwei Aussenleitern: grösster Strom 9,96 A',
  nah(dreieckOhneU1.maxStrom, 1.5 * 230 * Math.sqrt(3) / 60), `ist ${dreieckOhneU1.maxStrom}`);
const dreieckOhneV1 = await motor(2, ['w2']);
gleich('Dreieck ohne Zuleitung an V1: gemeldet wird genau V1', dreieckOhneV1.offen, ['V1']);
const dreieckOhneAlles = await motor(2, ['w1', 'w2', 'w3', 'w4']);
gleich('Dreieck ohne jede Leitung an M1: gemeldet werden genau U1, V1, W1 und PE',
  dreieckOhneAlles.offen, ['PE', 'U1', 'V1', 'W1']);

/* ══ §5 Umschalten ══════════════════════════════════════════════════════════ */
console.log('\n§5 Umschalten ändert die Meldung');
const folge: string[][] = [];
for (const st of [0, 1, 2, 0]) folge.push((await motor(st)).offen);
gleich('ohne → Stern → Dreieck → ohne', folge, [['U2', 'V2', 'W2'], [], [], ['U2', 'V2', 'W2']]);

/* ══ §6 Die Grenze ══════════════════════════════════════════════════════════ */
console.log('\n§6 Ein geschlossener Schaltkontakt ist keine Brücke');
const schalter = await seite.evaluate(() => {
  const T = (id: string, zeichen: string): any =>
    ({ id, zeichen, x: 0, y: 0, drehung: 0, gespiegelt: false, bmk: id, nummern: {}, gruppe: '', ebene: 'plan' });
  const L = (id: string, a: string, an: string, b: string, bn: string): any =>
    ({ id, ebene: 'plan', punkte: [{ x: -2000, y: -2000 - id.length * 40 }],
       vonTeil: a, vonNr: an, nachTeil: b, nachNr: bn });
  /* Die vergessene Leitung zwischen Schalter und Lampe: S1 ist geschlossen,
     sein Ausgang 2 hängt an nichts. */
  const plan = { art: 'stromlauf-aufgeloest', breite: 400, hoehe: 300, texte: [],
    ebenen: [{ id: 'plan', name: 'Plan', sichtbar: true }],
    teile: [T('G1', 'wechselspannung'), T('S1', 'ausschalter'), T('E1', 'lampe')],
    leitungen: [L('a', 'G1', 'L', 'S1', '1'), L('bb', 'E1', 'X2', 'G1', 'N')] };
  const e = Stromfluss.rechne(plan, { S1: 1 });
  const st = Stromfluss.stellungenVon('ausschalter');
  return { offen: (window as any).offen(e, 'S1'), stellung: st[1] && st[1].name };
});
p('Der Ausschalter steht in der Stellung „geschlossen"', schalter.stellung === 'geschlossen',
  String(schalter.stellung));
gleich('Sein offener Ausgang 2 wird trotzdem gemeldet', schalter.offen, ['2']);

/* ══ §7 Die echte Planfläche ════════════════════════════════════════════════ */
console.log('\n§7 Die Fusszeile der echten Planfläche');
await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Klemmenbrett', icon: '⚡' });
  Store.addBlock(s.id, 'schaltplan', { text: 'Drehstrommotor', plan: (window as any).motorPlan() });
  await Store.flush();
  App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
    .forEach(el => el.remove());
});
await seite.waitForSelector('.sp-wrap .sp-teil[data-id="M1"]');
const start = seite.locator('.sp-wrap button[data-a="simulation"]').first();
await start.scrollIntoViewIfNeeded();
await start.click();
await seite.waitForTimeout(250);

type Fuss = { stellung: string; meldungen: string[]; gerechnet: string[] };
const tippeM1 = async (st: number, ohne: string[] = []): Promise<Fuss> => {
  const m1 = seite.locator('.sp-wrap svg .sp-teil[data-id="M1"]').first();
  await m1.scrollIntoViewIfNeeded();
  await m1.click();
  await seite.waitForTimeout(250);
  return seite.evaluate(([n, oh]: [number, string[]]) => {
    const g = document.querySelector('.sp-wrap svg .sp-teil[data-id="M1"]');
    const titel = g ? [...g.children].filter(c => c.tagName.toLowerCase() === 'title').pop() : null;
    const meldungen = [...document.querySelectorAll('.sp-wrap .sp-fuss .sp-meldung.warnung')]
      .map(x => (x.textContent || '').trim());
    const e = Stromfluss.rechne((window as any).motorPlan(oh), { M1: n });
    const w: string[] = e.warnungen || [];
    const gerechnet = w.slice(0, 3).map(x => '⚠ ' + x);
    if (w.length > 3) gerechnet.push(`… und ${w.length - 3} weitere`);
    return { stellung: titel ? (titel.textContent || '') : '', meldungen, gerechnet };
  }, [st, ohne] as [number, string[]]);
};
const falsch = (m: string[]): string[] =>
  m.filter(x => /M1: Anschluss (U2|V2|W2) hängt an keiner Leitung/.test(x));

const fSt = await tippeM1(1);
p('Ein Tippen auf M1 stellt „Stern" ein', /\bStern\b/.test(fSt.stellung), fSt.stellung);
gleich('Stern: die Fusszeile nennt keine Brückenklemme als offen', falsch(fSt.meldungen), []);
gleich('Stern: die Fusszeile zeigt keine Warnung', fSt.meldungen, []);
gleich('Stern: die Fusszeile sagt, was die Rechnung sagt', fSt.meldungen, fSt.gerechnet);

const fDr = await tippeM1(2);
p('Noch ein Tippen stellt „Dreieck" ein', /\bDreieck\b/.test(fDr.stellung), fDr.stellung);
gleich('Dreieck: die Fusszeile nennt keine Brückenklemme als offen', falsch(fDr.meldungen), []);
gleich('Dreieck: die Fusszeile zeigt keine Warnung', fDr.meldungen, []);
gleich('Dreieck: die Fusszeile sagt, was die Rechnung sagt', fDr.meldungen, fDr.gerechnet);

const fOh = await tippeM1(0);
p('Noch ein Tippen stellt „ohne Brücken" ein', /ohne Brücken/.test(fOh.stellung), fOh.stellung);
gleich('Ohne Brücken: die Fusszeile nennt W2, U2 und V2',
  fOh.meldungen, ['⚠ M1: Anschluss W2 hängt an keiner Leitung.',
                  '⚠ M1: Anschluss U2 hängt an keiner Leitung.',
                  '⚠ M1: Anschluss V2 hängt an keiner Leitung.']);
gleich('Ohne Brücken: die Fusszeile sagt, was die Rechnung sagt', fOh.meldungen, fOh.gerechnet);

/* Ein zweiter Plan, derselbe ohne die Zuleitung an U1. */
await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Klemmenbrett ohne U1', icon: '⚡' });
  Store.addBlock(s.id, 'schaltplan', { text: 'Drehstrommotor ohne U1', plan: (window as any).motorPlan(['w1']) });
  await Store.flush();
  App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
    .forEach(el => el.remove());
});
/* Offen ist der zweite Plan, wenn w2 gezeichnet ist und w1 nicht. */
await seite.waitForFunction(() => !!document.querySelector('.sp-wrap .sp-teil[data-id="M1"]')
  && !!document.querySelector('.sp-wrap .sp-leitung[data-id="w2"]')
  && !document.querySelector('.sp-wrap .sp-leitung[data-id="w1"]'), null, { timeout: 10000 });
const start2 = seite.locator('.sp-wrap button[data-a="simulation"]').first();
await start2.scrollIntoViewIfNeeded();
await start2.click();
await seite.waitForTimeout(250);
const u1St = await tippeM1(1, ['w1']);
p('Ohne U1: ein Tippen auf M1 stellt „Stern" ein', /\bStern\b/.test(u1St.stellung), u1St.stellung);
gleich('Ohne U1, Stern: die Fusszeile nennt U1', u1St.meldungen, ['⚠ M1: Anschluss U1 hängt an keiner Leitung.']);
const u1Dr = await tippeM1(2, ['w1']);
p('Ohne U1: noch ein Tippen stellt „Dreieck" ein', /\bDreieck\b/.test(u1Dr.stellung), u1Dr.stellung);
gleich('Ohne U1, Dreieck: die Fusszeile nennt U1 — und nur U1',
  u1Dr.meldungen, ['⚠ M1: Anschluss U1 hängt an keiner Leitung.']);
gleich('Ohne U1, Dreieck: die Fusszeile sagt, was die Rechnung sagt', u1Dr.meldungen, u1Dr.gerechnet);

/* ══ §8 Der Sternpunkt steht in der Stellung ════════════════════════════════ */
console.log('\n§8 Der Sternpunkt steht in der Stellung, nicht im Code');
const marken = await seite.evaluate(() =>
  (Stromfluss.stellungenVon('motor-klemmenbrett') as any[]).map(st =>
    ({ name: st.name, sternpunkt: Array.isArray(st.sternpunkt) ? [...st.sternpunkt].sort() : null })));
gleich('„Stern" trägt den Sternpunkt U2, V2, W2; „ohne Brücken" und „Dreieck" tragen keinen', marken,
  [{ name: 'ohne Brücken', sternpunkt: null }, { name: 'Stern', sternpunkt: ['U2', 'V2', 'W2'] },
   { name: 'Dreieck', sternpunkt: null }]);
const sternOhneAlles = await motor(1, ['w1', 'w2', 'w3', 'w4']);
gleich('Stern ohne jede Leitung an M1: gemeldet werden U1, V1, W1 und PE — der Sternpunkt nicht',
  sternOhneAlles.offen, ['PE', 'U1', 'V1', 'W1']);
const gezeichnet = await motor(0, [], true);
gleich('Ohne Brücken, der Stern als zwei Leitungen gezeichnet: keine Klemme von M1 „hängt an keiner Leitung"',
  gezeichnet.offen, []);

/* ══ §9 ═════════════════════════════════════════════════════════════════════ */
console.log('\n§9 Ruhe');
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
process.exit(weg ? 1 : 0);
