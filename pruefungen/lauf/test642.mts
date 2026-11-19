/* Suite 642 — die Bauplan-Zeichen so, wie sie im Lehrmittel stehen (E789)
 * ============================================================================
 * Redur, 15. November 2026: „schau mal im github für schaltplan zeichnen
 * und im internet für schweiz wie muss es sein und baue es direkt im
 * redion" — und danach der Hinweis auf sein Lehrmittel (Fachzeichnen
 * Teil 1, Seite 14.1 „Schaltzeichen für Installationspläne", Grundlage:
 * Electrosuisse „Symbole für die Elektrotechnik").
 *
 * Bis hierher war ein Schalter im Bauplan ein VOLLER Punkt mit einem
 * senkrechten Strich, Schema 3 ein Pfeil, Schema 6 ein Kreuz; die
 * Deckenleuchte war ein Kreis mit Kreuz (das ist die EINBAU-Leuchte), die
 * Einbauleuchte zwei Kreise, die Abzweigdose ein voller Punkt, die
 * Steckdose ein geschlossener Halbkreis. Nichts davon steht so im Buch.
 *
 *   §1 Jedes Zeichen der Seite 14.1, das Redion zeichnen kann, gibt es im
 *      Register (Gruppe „ch-bauplan"), mit Namen und Erklärung.
 *   §2 Die Form folgt dem Buch: Schalter = OFFENER Kreis mit Armen
 *      (Sch 0: einer, Sch 1 und Sch 3: zwei, Sch 6: vier), Deckenleuchte =
 *      Kreuz ohne Kreis, Einbauleuchte = EIN Kreis mit Kreuz, Abzweigdose =
 *      Quadrat mit Punkt, Steckdose = offen (kein geschlossener Halbkreis),
 *      AP-Schalter halb gefüllt, Unterverteilung mit gefülltem Dreieck.
 *   §3 Alte Pläne bleiben, wie sie sind: jedes Bauplan-Zeichen, das es
 *      vorher gab, hat dieselbe Kennung, dieselbe Grösse und dieselben
 *      Anschlüsse an denselben Orten — nur das Bild ist neu.
 *   §4 Die Auswahl in der Planfläche zeigt die neuen Zeichen (Suche „Kombi").
 *
 * Gegen den Stand vor E789 rot: §1 (die meisten Kennungen fehlen), §2 (voller
 * Punkt, Kreis um die Deckenleuchte, zwei Kreise, Halbkreis mit Z).
 *
 *   node pruefungen/lauf/test642.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Register: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 } });
const s = await ktx.newPage();
s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
await s.goto(INDEX);
await s.waitForFunction(() => typeof Register !== 'undefined' && !!Register.fachzeichen, null, { timeout: 30000 });

/* ==========================================================================
 * §1 · Was auf Seite 14.1 steht
 * ========================================================================*/
console.log('\n1 · Die Zeichen der Seite 14.1');
const SOLL: Array<[string, string]> = [
  ['bp-schalter-up', 'UP-Schalter'], ['bp-schalter-ap', 'AP-Schalter'],
  ['bp-schalter0', 'Schalter Sch 0'], ['bp-schalter1', 'Schalter Sch 1'],
  ['bp-schalter3', 'Schalter Sch 3'], ['bp-schalter6', 'Schalter Sch 6'],
  ['bp-zugschalter', 'Zugschalter'], ['bp-nachlauf', 'Schalter mit Nachlauf'],
  ['bp-lichtregler', 'Lichtregler'], ['bp-taster', 'Taster'],
  ['bp-storenschalter', 'Storenschalter'],
  ['bp-kombi-0', 'Kombi Gr.1 Sch 0 / Steckdose'], ['bp-kombi-3', 'Kombi Gr.1 Sch 3 / Steckdose'],
  ['bp-kombi-taster', 'Kombi Gr.1 Taster / Steckdose'], ['bp-kombi-3-gr11', 'Kombi Gr.1+1 Sch 3 / Steckdose'],
  ['bp-t13', 'Steckdose Typ 13'], ['bp-t13-3fach', 'Steckdose Typ 13 3-fach'],
  ['bp-t13-3fach-s', 'Steckdose Typ 13 3-fach, 1 geschaltet'], ['bp-t25', 'Steckdose Typ 25'],
  ['bp-abzweigdose', 'Abzweigdose'], ['bp-bodendose', 'Bodendose'],
  ['bp-lampenduebel', 'Lampendübel'], ['bp-leuchtstelle', 'Deckenleuchte'],
  ['bp-einbauleuchte', 'Decken-Einbauleuchte'], ['bp-wandleuchte', 'Wandleuchte'],
  ['bp-pir', 'PIR-Melder'], ['bp-store', 'Lamellenstore'], ['bp-ventilator', 'Abluftventilator'],
  ['bp-direktanschluss', 'Direktanschluss'], ['bp-verteiler', 'Unterverteilung'],
  ['bp-sonneriedruck', 'Sonnerietaster'], ['bp-sonnerie', 'Sonnerieglocke']
];
const reg = await s.evaluate((ids: string[]) => {
  const F = Register.fachzeichen;
  return ids.map(id => {
    const z = F.holen(id);
    return z ? { id, gruppe: z.gruppe, name: z.name, erkl: String(z.erklaerung || '') } : { id };
  });
}, SOLL.map(x => x[0]));
const fehlt = reg.filter((r: any) => !r.gruppe).map((r: any) => r.id);
p(`Alle ${SOLL.length} Zeichen sind im Register`, fehlt.length === 0, fehlt.join(', '));
p('Alle stehen in der Gruppe „Bauplan CH"',
  reg.every((r: any) => !r.gruppe || r.gruppe === 'ch-bauplan'),
  reg.filter((r: any) => r.gruppe && r.gruppe !== 'ch-bauplan').map((r: any) => r.id).join(', '));
const ohneName = reg.filter((r: any, i: number) => r.gruppe &&
  !String(r.name).toLowerCase().includes(SOLL[i]![1].toLowerCase().split(' ')[0]!)).map((r: any) => `${r.id}: ${r.name}`);
p('Jedes trägt den Namen aus dem Buch', ohneName.length === 0, ohneName.join(' | '));
p('Jedes hat eine Erklärung', reg.every((r: any) => !r.gruppe || r.erkl.length > 10));

/* ==========================================================================
 * §2 · Die Form
 * ========================================================================*/
console.log('\n2 · Die Form folgt dem Buch');
const form = await s.evaluate((ids: string[]) => {
  const F = Register.fachzeichen;
  const r: Record<string, any> = {};
  ids.forEach(id => {
    if (!F.holen(id)) return;
    const d = document.createElement('div');
    d.innerHTML = F.alsSvg(id, { zeigeText: true });
    const svg = d.querySelector('svg')!;
    const kreise = [...svg.querySelectorAll('circle')];
    const pfade = [...svg.querySelectorAll('path')];
    r[id] = {
      kreisOffen: kreise.filter(c => !c.getAttribute('fill')).length,
      kreisVoll: kreise.filter(c => !!c.getAttribute('fill')).length,
      pfade: pfade.filter(x => !x.getAttribute('fill')).length,
      flaechen: pfade.filter(x => !!x.getAttribute('fill') && x.getAttribute('fill') !== 'none').length,
      zu: pfade.some(x => /z/i.test(x.getAttribute('d') || '') && !x.getAttribute('fill')),
      text: [...svg.querySelectorAll('text')].map(t => t.textContent).join(' ')
    };
  });
  return r;
}, SOLL.map(x => x[0]));
const f = (id: string) => form[id] || {};
/* Schalter: ein OFFENER Kreis, kein voller, ein Strich zum Anschluss und
   so viele Arme, wie das Schema Wege hat. */
for (const [id, arme] of [['bp-schalter0', 1], ['bp-schalter1', 2], ['bp-schalter3', 2], ['bp-schalter6', 4]] as Array<[string, number]>) {
  p(`${id}: offener Kreis, kein voller Punkt`, f(id).kreisOffen === 1 && f(id).kreisVoll === 0,
    JSON.stringify(f(id)));
  p(`${id}: ${arme} Arm(e) und der Anschlussstrich`, f(id).pfade === arme + 1, `${f(id).pfade} Striche`);
}
p('UP-Schalter: nur ein offener Kreis', f('bp-schalter-up').kreisOffen === 1 && f('bp-schalter-up').pfade <= 1);
p('AP-Schalter: halb gefüllt', f('bp-schalter-ap').kreisOffen === 1 && f('bp-schalter-ap').flaechen === 1);
p('Deckenleuchte: ein Kreuz, KEIN Kreis', f('bp-leuchtstelle').kreisOffen === 0 && f('bp-leuchtstelle').kreisVoll === 0,
  JSON.stringify(f('bp-leuchtstelle')));
p('Einbauleuchte: EIN Kreis mit Kreuz', f('bp-einbauleuchte').kreisOffen === 1, JSON.stringify(f('bp-einbauleuchte')));
p('Abzweigdose: Quadrat mit Punkt', f('bp-abzweigdose').kreisVoll === 1 && f('bp-abzweigdose').zu,
  JSON.stringify(f('bp-abzweigdose')));
for (const id of ['bp-t13', 'bp-t13-3fach', 'bp-t13-3fach-s', 'bp-t25']) {
  p(`${id}: offen, kein geschlossener Halbkreis`, f(id).pfade >= 2 && !f(id).zu, JSON.stringify(f(id)));
}
p('3-fach trägt die „3"', /\b3\b/.test(f('bp-t13-3fach').text));
p('3-fach, 1 geschaltet trägt „S" und „3"', /S/.test(f('bp-t13-3fach-s').text) && /3/.test(f('bp-t13-3fach-s').text));
p('Typ 25 trägt „T25"', /T25/.test(f('bp-t25').text));
p('Unterverteilung: ein gefülltes Dreieck', f('bp-verteiler').flaechen === 1, JSON.stringify(f('bp-verteiler')));
p('Sonnerietaster: zwei Kreise ineinander', f('bp-sonneriedruck').kreisOffen === 2, JSON.stringify(f('bp-sonneriedruck')));
for (const id of ['bp-kombi-0', 'bp-kombi-3', 'bp-kombi-taster', 'bp-kombi-3-gr11']) {
  p(`${id}: ein Schalterkreis und eine Steckdose daran`, f(id).kreisOffen === 1 && f(id).pfade >= 3, JSON.stringify(f(id)));
}

/* ==========================================================================
 * §3 · Alte Pläne
 * ========================================================================*/
console.log('\n3 · Kennung, Grösse und Anschlüsse von vorher');
const VORHER: Record<string, [number, number, Array<[string, number, number]>]> = {
  'bp-schalter0': [40, 40, [['3', 20, 40]]], 'bp-schalter1': [40, 40, [['3', 20, 40]]],
  'bp-schalter3': [40, 40, [['3', 20, 40]]], 'bp-schalter6': [40, 40, [['1', 20, 40]]],
  'bp-leuchtstelle': [40, 40, [['X1', 20, 0]]], 'bp-leuchte': [60, 40, [['X1', 0, 20], ['X2', 60, 20]]],
  'bp-einbauleuchte': [40, 40, [['X1', 20, 0]]], 'bp-t13': [40, 40, [['L', 20, 0]]],
  'bp-t23': [40, 40, [['L', 20, 0]]], 'bp-t23-3fach': [60, 40, [['L', 30, 0]]],
  'bp-abzweigdose': [40, 40, [['1', 20, 0], ['2', 20, 40], ['3', 0, 20], ['4', 40, 20]]],
  'bp-verteiler': [60, 40, [['L', 0, 20]]], 'bp-sonneriedruck': [40, 40, [['3', 20, 40]]],
  'bp-sonnerie': [60, 60, [['X1', 30, 0], ['X2', 30, 60]]],
  'bp-minuterie': [60, 60, [['1', 30, 0], ['2', 30, 60]]], 'bp-daemmerung': [60, 60, [['L', 30, 0], ['L′', 30, 60]]]
};
const jetzt = await s.evaluate((ids: string[]) => ids.map(id => {
  const z = Register.fachzeichen.holen(id);
  return z ? [id, z.w, z.h, z.anschluesse.map((a: any) => [a.nr, a.x, a.y])] : [id, 0, 0, []];
}), Object.keys(VORHER));
const anders = (jetzt as any[]).filter(([id, w, h, a]) =>
  JSON.stringify([w, h, a]) !== JSON.stringify(VORHER[id])).map(([id]) => id);
p(`Alle ${Object.keys(VORHER).length} Bauplan-Zeichen von vorher: gleiche Grösse und Anschlüsse`,
  anders.length === 0, anders.join(', '));

/* ==========================================================================
 * §4 · In der Auswahl
 * ========================================================================*/
console.log('\n4 · In der Auswahl der Planfläche');
await s.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
  Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
  const plan = { art: 'installationsplan', breite: 800, hoehe: 500, teile: [], leitungen: [], texte: [],
    ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] };
  const sp = Store.addPage(null, { text: 'Plan 642', icon: '⚡' });
  Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan });
  await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
});
const inAuswahl = await s.evaluate(() =>
  ['bp-kombi-3', 'bp-t13-3fach-s', 'bp-taster'].map(id =>
    document.querySelectorAll(`[data-zeichen="${id}"],[data-sym="${id}"],[data-id="${id}"]`).length));
p('Die Palette der Planfläche führt die neuen Zeichen', inAuswahl.every((n: number) => n > 0), inAuswahl.join(','));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
