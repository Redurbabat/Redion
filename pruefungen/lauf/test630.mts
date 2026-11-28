/* Suite 630 — Zeitrelais mit echter Zeit, und Taster federn zurück (E768)
 * ============================================================================
 * Aus Redurs ZIP vom 1. November. Bis hierher schalteten die Kontakte einer
 * Zeitspule sofort, und unter dem Plan stand „die Simulation kennt keine
 * Zeit"; ein Taster rastete wie ein Schalter. Ein Treppenhauslicht (Taster,
 * abfallverzögertes Relais, Lampe) liess sich so gar nicht ausprobieren.
 *
 *   1 · DER KERN: `Stromfluss.rechne(…, zeitAusgaenge)` lässt die Kontakte
 *       einer Zeitspule ihrem Zeitausgang folgen; ohne den Parameter wie
 *       vorher, MIT dem Hinweis „kennt keine Zeit" — und nur dann.
 *   2 · ANZUGSVERZÖGERT in der echten Fläche: Schalter an, die Lampe bleibt
 *       zuerst dunkel und geht nach T an; aus geht sie sofort.
 *   3 · DER TAKT läuft NUR während der Simulation und nur mit Zeitspule
 *       (E528: keine Schleife im Leerlauf).
 *   4 · TREPPENHAUS: der Taster federt zurück, das Licht bleibt T Sekunden
 *       und geht dann aus.
 *   5 · DER TEILDIALOG einer Zeitspule hat „Verzögerung T", geprüft 0–3600.
 *   6 · Keine Seitenfehler.
 *
 *   node pruefungen/alle.mts 630
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
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 } });
/* Jeden 100-ms-Takt mitzählen, der gerade läuft — der Takt der Zeitrelais. */
await ktx.addInitScript(() => {
  const offen = new Set<number>();
  const setI = window.setInterval.bind(window), clrI = window.clearInterval.bind(window);
  (window as any).__takte = offen;
  (window as any).setInterval = (f: any, ms?: number, ...r: any[]) => {
    const id = setI(f, ms, ...r) as unknown as number;
    if (ms === 100) offen.add(id);
    return id;
  };
  (window as any).clearInterval = (id: number) => { offen.delete(id); clrI(id); };
});
const seite = await ktx.newPage();
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
seite.on('dialog', d => d.dismiss().catch(() => {}));
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
   * G1 (230 V, L/N — die Spulen ziehen erst ab halber Nennspannung an), S1 (Schalter oder Taster), K1 (Zeitspule A1/A2), K1-Schliesser
   * 13/14, Lampe E1. Die Leitungen halten über ihre BINDUNG; ihre Punkte
   * liegen weit draussen, damit kein Ort etwas anzapft.
   */
  (window as any).zeitPlan = (spule: string, schalter: string, T: number): any => {
    const Tl = (id: string, zeichen: string, x: number, y: number, bmk = id, mehr: any = {}): any =>
      ({ id, zeichen, x, y, drehung: 0, gespiegelt: false, bmk, nummern: {}, gruppe: '', ebene: 'plan', ...mehr });
    let n = 0;
    const L = (id: string, a: string, an: string, b: string, bn: string): any => {
      n++;
      return { id, ebene: 'plan', punkte: [{ x: 1600 + n * 40, y: 1600 }, { x: 1600 + n * 40, y: 1620 }],
        vonTeil: a, vonNr: an, nachTeil: b, nachNr: bn };
    };
    const ein = schalter === 'ausschalter' ? ['1', '2'] : ['3', '4'];
    return { art: 'stromlauf-aufgeloest', breite: 700, hoehe: 400, texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }],
      teile: [Tl('G1', 'wechselspannung', 40, 60), Tl('S1', schalter, 180, 60),
        Tl('K1s', spule, 320, 60, 'K1', { werte: { T } }), Tl('K1k', 'schuetz-schliesser', 460, 60, 'K1'),
        Tl('E1', 'lampe', 600, 60)],
      leitungen: [L('a', 'G1', 'L', 'S1', ein[0]!), L('b', 'S1', ein[1]!, 'K1s', 'A1'),
        L('c', 'K1s', 'A2', 'G1', 'N'), L('d', 'G1', 'L', 'K1k', '13'),
        L('lampe', 'K1k', '14', 'E1', 'X1'), L('f', 'E1', 'X2', 'G1', 'N')] };
  };
});

/* ══ §1 Der Kern ══════════════════════════════════════════════════════════ */
console.log('\n§1 Der Kern: Kontakte folgen dem Zeitausgang');
const kern = await seite.evaluate(() => {
  const plan = (window as any).zeitPlan('spule-anzugsverzoegert', 'ausschalter', 2);
  const lampe = (e: any) => !!e.ok && Math.abs(Number(e.werte?.E1?.I ?? 0)) > 1e-4;
  const keineZeit = (e: any) => (e.annahmen || []).some((a: string) => a.includes('kennt keine Zeit'));
  const ohne = Stromfluss.rechne(plan, { S1: 1 });
  const aus = Stromfluss.rechne(plan, { S1: 1 }, undefined, { K1: false });
  const an = Stromfluss.rechne(plan, { S1: 1 }, undefined, { K1: true });
  return { ohneLampe: lampe(ohne), ohneHinweis: keineZeit(ohne), ausLampe: lampe(aus), ausSpule: !!aus.spulen?.K1,
    ausHinweis: keineZeit(aus), anLampe: lampe(an), anHinweis: keineZeit(an) };
});
gleich('Ohne Zeitausgänge: die Lampe folgt sofort, und der Hinweis steht da',
  [kern.ohneLampe, kern.ohneHinweis], [true, true]);
gleich('Zeitausgang aus: die Spule hat Spannung, die Lampe bleibt dunkel',
  [kern.ausSpule, kern.ausLampe], [true, false]);
gleich('Zeitausgang an: die Lampe leuchtet', kern.anLampe, true);
gleich('Mit Zeitausgängen fehlt der Hinweis „kennt keine Zeit" (er stimmt dann nicht)',
  [kern.ausHinweis, kern.anHinweis], [false, false]);

/* ══ §2 Anzugsverzögert in der echten Fläche ══════════════════════════════ */
console.log('\n§2 Anzugsverzögert: erst nach T an, aus sofort');
const oeffne = async (spule: string, schalter: string, T: number, titel: string): Promise<string> => {
  const id = await seite.evaluate(async ([sp, sc, t, ti]: [string, string, number, string]) => {
    const s = Store.addPage(null, { text: ti, icon: '⏱' });
    const b = Store.addBlock(s.id, 'schaltplan', { text: ti, plan: (window as any).zeitPlan(sp, sc, t) });
    await Store.flush();
    App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return b.id as string;
  }, [spule, schalter, T, titel] as [string, string, number, string]);
  await seite.waitForSelector('.sp-wrap .sp-teil[data-id="S1"]');
  return id;
};
/* E773 (Redur, 2. November 2026: „Für ein-aus sollte wie früher sein"):
   der Strom-Knopf ist wieder der <button> „▶ Strom" — E772 hatte ihn kurz
   durch den RED-MGT-Glasschalter (eine Checkbox) ersetzt. */
const strom = async (): Promise<void> => {
  const k = seite.locator('.sp-wrap button[data-a="simulation"]').first();
  await k.scrollIntoViewIfNeeded(); await k.click(); await seite.waitForTimeout(200);
};
const leuchtet = () => seite.evaluate(() => !!document.querySelector('.sp-wrap .sp-fluss[data-id="lampe"]'));
const takte = () => seite.evaluate(() => (window as any).__takte.size as number);
const s1 = () => seite.locator('.sp-wrap svg .sp-teil[data-id="S1"]').first();

const blk = await oeffne('spule-anzugsverzoegert', 'ausschalter', 0.6, 'Anzug');
gleich('Vor der Simulation läuft kein Takt', await takte(), 0);
await strom();
gleich('In der Simulation mit Zeitspule läuft genau ein Takt', await takte(), 1);
await s1().click({ position: { x: 12, y: 18 } });
await seite.waitForTimeout(150);
gleich('Schalter an: die Lampe ist zuerst dunkel', await leuchtet(), false);
await seite.waitForTimeout(800);
gleich('… und nach T = 0,6 s an', await leuchtet(), true);
p('Unter dem Plan steht nicht mehr „kennt keine Zeit"', await seite.evaluate(() =>
  !(document.querySelector('.sp-wrap .sp-fuss')?.textContent ?? '').includes('kennt keine Zeit')));
await s1().click({ position: { x: 12, y: 18 } });
await seite.waitForTimeout(150);
gleich('Schalter aus: die Lampe geht sofort aus', await leuchtet(), false);
await strom();
gleich('Simulation aus: der Takt ist weg', await takte(), 0);
gleich('Nichts davon steht im Plan (keine Zeit im Block)', await seite.evaluate((id: string) =>
  JSON.stringify(Store.getBlock(id).plan).includes('ausgaenge'), blk), false);

/* ══ §3 Ohne Zeitspule kein Takt ══════════════════════════════════════════ */
console.log('\n§3 Ohne Zeitspule kein Takt');
await oeffne('spule', 'ausschalter', 1, 'Ohne Zeit');
await strom();
gleich('Simulation mit gewöhnlicher Spule: kein Takt', await takte(), 0);
await strom();

/* ══ §4 Treppenhaus: Taster federt, Licht bleibt T ════════════════════════ */
console.log('\n§4 Treppenhaus: der Taster federt zurück, das Licht bleibt T');
await oeffne('spule-abfallverzoegert', 'taster-schliesser', 0.8, 'Treppenhaus');
await strom();
const box = await s1().boundingBox();
if (box) {
  await seite.mouse.move(box.x + 12, box.y + 18);
  await seite.mouse.down();
  await seite.waitForTimeout(250);
}
gleich('Taster gedrückt: das Licht ist an', await leuchtet(), true);
await seite.mouse.up();
await seite.waitForTimeout(250);
gleich('Losgelassen: das Licht bleibt noch an (Abfallverzögerung)', await leuchtet(), true);
await seite.waitForTimeout(900);
gleich('… und ist nach T = 0,8 s aus — der Taster ist zurückgefedert', await leuchtet(), false);
/* A held pushbutton must release on window blur even if pointerup is
   delivered later. Use the real timer/relay and original pointer path. */
await seite.evaluate(()=>document.documentElement.setAttribute('data-windows-titelleiste',''));
await seite.locator('.sp-desktop-messwerte summary').click();
p('Messwertinspektor zeigt E1 und berechnete Grössen',
  await seite.locator('.sp-desktop-messwerte [data-messwert-id="E1"] [data-messwert="U"]').count()===1);
const held = await s1().boundingBox();
if(held){
  await seite.mouse.move(held.x+12,held.y+18);
  await seite.mouse.down(); await seite.waitForTimeout(200);
  gleich('Taster vor Fensterwechsel aktiv',await leuchtet(),true);
  await seite.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await seite.waitForTimeout(1050);
  gleich('Fensterwechsel: Taster löst, Zeitrelais fällt ab',await leuchtet(),false);
  await seite.mouse.up();
} else p('Taster für Fensterwechsel vorhanden',false);
await strom();
p('Messwertinspektor beim Abschalten geleert',await seite.locator('.sp-desktop-messwerte[hidden] [data-messwert-id]').count()===0);
await seite.evaluate(()=>document.documentElement.removeAttribute('data-windows-titelleiste'));

/* ══ §5 Der Teildialog ════════════════════════════════════════════════════ */
console.log('\n§5 Der Teildialog einer Zeitspule');
const blk5 = await oeffne('spule-anzugsverzoegert', 'ausschalter', 3, 'Dialog');
const k1 = seite.locator('.sp-wrap svg .sp-teil[data-id="K1s"]').first();
await k1.dblclick({ position: { x: 12, y: 18 } });
await seite.waitForTimeout(300);
const zeit = seite.locator('.overlay #sp-zeit');
gleich('Das Feld „Verzögerung T" zeigt 3', await zeit.count() ? await zeit.inputValue() : null, '3');
if (await zeit.count()) {
  await zeit.fill('5000');
  await seite.click('.overlay button[data-a="ok"]');
  await seite.waitForTimeout(200);
  p('5000 s wird abgewiesen, der Dialog bleibt offen', await zeit.count() === 1);
  await zeit.fill('1.5');
  await seite.click('.overlay button[data-a="ok"]');
  await seite.waitForTimeout(250);
} else p('5000 s wird abgewiesen, der Dialog bleibt offen', false);
gleich('1,5 s wird gespeichert', await seite.evaluate((id: string) =>
  Store.getBlock(id).plan.teile.find((t: any) => t.id === 'K1s')?.werte?.T ?? null, blk5), 1.5);
const lampeOhneZeit = await seite.locator('.sp-wrap svg .sp-teil[data-id="E1"]').first();
await lampeOhneZeit.dblclick({ position: { x: 12, y: 18 } });
await seite.waitForTimeout(300);
gleich('Eine Lampe hat kein solches Feld', await seite.locator('.overlay #sp-zeit').count(), 0);
await seite.keyboard.press('Escape');

/* ══ §6 ═══════════════════════════════════════════════════════════════════ */
console.log('\n§6 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);
await browser.close();
console.log('\n' + ok + '/' + (ok + weg) + ' bestanden');
process.exit(weg ? 1 : 0);
