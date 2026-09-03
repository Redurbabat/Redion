/* Suite 354 — Der Ereignisbus kann async: meldeAsync, frageAsync, Nachreichen, Veto (E362, L102 Punkt 4)
 * ============================================================================
 * L102 Punkt 4: `melde` verwarf Rückgaben, `frage` sammelte Promises als
 * ROHE Werte ein — wer die Liste las, rechnete mit einem Wert, der keiner
 * war. Kein Veto, kein Nachreichen für spät Angemeldete. Und der einzige
 * Zuhörer auf `ablageGeladen` horchte auf den falschen Namen.
 *
 * Ohne Browser: `bus.js` wird wie in test88 mit `new Function` geladen,
 * `window`, `console` und `Pflege` sind Attrappen, die mitschreiben.
 *
 *   1 · LÄDT ohne Browser; die neuen Griffe sind da.
 *   2 · `frage` zählt keine Promise — und meldet sie.
 *   3 · `frageAsync` wartet jede Antwort ab, in der Reihenfolge der Anmeldung;
 *       was scheitert, fehlt und ist gemeldet.
 *   4 · `meldeAsync` wartet, zählt die Fertigen, meldet die Gescheiterten.
 *   5 · `melde` mit asynchronem Zuhörer: sein Scheitern versandet nicht.
 *   6 · NACHREICHEN: die letzte Meldung für den spät Angemeldeten — nur mit
 *       der Option, und `leeren` vergisst sie.
 *   7 · VETO: ein `false` heisst Nein.
 *   8 · DAS MENÜBAND horcht auf den richtigen Namen, mit Nachreichen.
 *
 *   node pruefungen/lauf/test354.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (rel: string): string => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const warte = (ms: number) => new Promise(f => setTimeout(f, ms));

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Lädt ohne Browser; die neuen Griffe sind da');
const konsole: string[] = [];
const gemerkt: Array<{ fehler: string; wo: string }> = [];
const umgebung: Record<string, unknown> = {
  window: {},
  console: { error: (...a: unknown[]) => konsole.push(a.map(String).join(' ')), log: () => {}, warn: () => {} },
  Pflege: { fehlerMerken: (e: unknown, wo: unknown) => gemerkt.push({ fehler: e instanceof Error ? e.message : String(e), wo: String(wo) }) }
};
const quelle = lies('quell/kern/ereignisse/bus.js');
const namen = Object.keys(umgebung);
let Bus: any = null, ladefehler = '';
try { Bus = new Function(...namen, quelle + '\nreturn Ereignisse;')(...namen.map(n => umgebung[n])); }
catch (e: unknown) { ladefehler = e instanceof Error ? e.message : String(e); }
p('bus.js lädt in Node', !!Bus, ladefehler);
if (!Bus) { console.log(`\n${ok}/${ok + weg} bestanden`); process.exit(1); }
gleich('Die Griffe: melde, frage, meldeAsync, frageAsync, darf, darfAsync, schonGemeldet',
  ['melde', 'frage', 'meldeAsync', 'frageAsync', 'darf', 'darfAsync', 'schonGemeldet', 'horche', 'einmal', 'leeren'].map(k => typeof Bus[k]),
  Array(10).fill('function'));
const leer = (): void => { Bus.leeren(); konsole.length = 0; gemerkt.length = 0; };

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · `frage` zählt keine Promise — und meldet sie');
leer();
Bus.horche('probe.frage', () => 1);
Bus.horche('probe.frage', async () => 2);
Bus.horche('probe.frage', () => 3);
const sync = Bus.frage('probe.frage');
gleich('Die Antworten sind 1 und 3 — die Promise fehlt', sync, [1, 3]);
p('… und ist gemeldet, mit dem Hinweis auf frageAsync',
  gemerkt.length === 1 && /frageAsync/.test(gemerkt[0]!.fehler) && gemerkt[0]!.wo === 'Frage probe.frage', JSON.stringify(gemerkt));
p('… auch in der Konsole', konsole.some(z => z.includes('probe.frage')));
await warte(10);

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · `frageAsync` wartet jede Antwort ab, in der Reihenfolge der Anmeldung');
leer();
Bus.horche('probe.async', async () => { await warte(40); return 'langsam'; });
Bus.horche('probe.async', () => 'sofort');
Bus.horche('probe.async', async () => { await warte(5); return 'schnell'; });
Bus.horche('probe.async', async () => { throw new Error('kaputt'); });
Bus.horche('probe.async', () => { throw new Error('gleich kaputt'); });
Bus.horche('probe.async', () => null);
const asyncAntworten = await Bus.frageAsync('probe.async', { x: 1 });
gleich('Drei Antworten, in der Reihenfolge der Anmeldung, nicht des Eintreffens', asyncAntworten, ['langsam', 'sofort', 'schnell']);
gleich('Die zwei Gescheiterten sind gemeldet', gemerkt.map(g => g.fehler), ['kaputt', 'gleich kaputt']);
gleich('… als Frage', gemerkt.map(g => g.wo), ['Frage probe.async', 'Frage probe.async']);
gleich('Ohne Zuhörer: eine leere Liste', await Bus.frageAsync('probe.niemand'), []);

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · `meldeAsync` wartet, zählt die Fertigen, meldet die Gescheiterten');
leer();
let fertig = 0;
Bus.horche('probe.melde', async () => { await warte(30); fertig++; });
Bus.horche('probe.melde', () => { fertig++; });
Bus.horche('probe.melde', async () => { throw new Error('nein'); });
const n = await Bus.meldeAsync('probe.melde', 7);
gleich('Zwei fertig, einer gescheitert', [n, fertig], [2, 2]);
gleich('Der Gescheiterte ist gemeldet', gemerkt.map(g => g.fehler + '@' + g.wo), ['nein@Ereignis probe.melde']);
gleich('Ohne Zuhörer: null', await Bus.meldeAsync('probe.niemand'), 0);

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · `melde` mit asynchronem Zuhörer: sein Scheitern versandet nicht');
leer();
let unbehandelt = 0;
const fang = () => { unbehandelt++; };
process.on('unhandledRejection', fang);
Bus.horche('probe.spaet', async () => { await warte(5); throw new Error('spät kaputt'); });
Bus.horche('probe.spaet', () => 'egal');
gleich('melde zählt beide Zuhörer', Bus.melde('probe.spaet'), 2);
await warte(40);
process.off('unhandledRejection', fang);
gleich('Keine unbehandelte Ablehnung', unbehandelt, 0);
gleich('… sondern eine Meldung', gemerkt.map(g => g.fehler), ['spät kaputt']);

/* ── 6 ────────────────────────────────────────────────────────────────── */
console.log('\n6 · Nachreichen: die letzte Meldung für den spät Angemeldeten');
leer();
Bus.melde('ablage.geladen', { blocks: 12 });
Bus.melde('ablage.geladen', { blocks: 13 });
const spaet: unknown[] = [];
Bus.horche('ablage.geladen', (d: unknown) => spaet.push(d), { nachreichen: true });
gleich('Mit der Option kommt die LETZTE Meldung sofort', spaet, [{ blocks: 13 }]);
const ohne: unknown[] = [];
Bus.horche('ablage.geladen', (d: unknown) => ohne.push(d));
gleich('Ohne die Option kommt nichts', ohne, []);
gleich('schonGemeldet sagt es', Bus.schonGemeldet('ablage.geladen'), { da: true, daten: { blocks: 13 } });
gleich('… und für Ungemeldetes nein', Bus.schonGemeldet('nie.gemeldet').da, false);
Bus.horche('ablage.geladen', () => { throw new Error('beim Nachreichen'); }, { nachreichen: true });
gleich('Ein Wurf beim Nachreichen ist gemeldet', gemerkt.map(g => g.fehler), ['beim Nachreichen']);
const nachAsync: unknown[] = [];
Bus.horche('ablage.geladen', async (d: unknown) => { await warte(5); nachAsync.push(d); throw new Error('async nachgereicht'); }, { nachreichen: true });
await warte(30);
gleich('Ein asynchroner Nachgereichter läuft und sein Scheitern ist gemeldet', [nachAsync, gemerkt.length], [[{ blocks: 13 }], 2]);
Bus.leeren();
gleich('leeren vergisst die Meldung', Bus.schonGemeldet('ablage.geladen').da, false);
const nachLeeren: unknown[] = [];
Bus.horche('ablage.geladen', (d: unknown) => nachLeeren.push(d), { nachreichen: true });
gleich('… und danach wird nichts mehr nachgereicht', nachLeeren, []);
const viaAsync = await Bus.meldeAsync('probe.nach', 'A');
const nachA: unknown[] = [];
Bus.horche('probe.nach', (d: unknown) => nachA.push(d), { nachreichen: true });
gleich('Auch meldeAsync hinterlässt die Meldung', [viaAsync, nachA], [0, ['A']]);

/* ── 7 ────────────────────────────────────────────────────────────────── */
console.log('\n7 · Veto: ein `false` heisst Nein');
leer();
Bus.horche('probe.darf', () => true);
gleich('Ohne Nein: ja', Bus.darf('probe.darf'), true);
gleich('Ohne Zuhörer: ja', Bus.darf('probe.niemand'), true);
Bus.horche('probe.darf', () => false);
gleich('Ein einziges false: nein', Bus.darf('probe.darf'), false);
Bus.horche('probe.darfAsync', async () => { await warte(5); return false; });
gleich('darfAsync wartet das Nein ab', await Bus.darfAsync('probe.darfAsync'), false);
gleich('… und sagt sonst ja', await Bus.darfAsync('probe.niemand'), true);

/* ── 8 ────────────────────────────────────────────────────────────────── */
console.log('\n8 · Das Menüband horcht auf den richtigen Namen, mit Nachreichen');
const band = lies('src/schale/aufbau/menueband.ts').replace(/\/\*[\s\S]*?\*\//g, '');
const arten = lies('src/kern/ereignisse/arten.ts');
p('arten.ts nennt ablageGeladen als ablage.geladen', /ablageGeladen:\s*'ablage\.geladen'/.test(arten));
p('Das Menüband horcht über ARTEN.ablageGeladen — nicht auf die Zeichenkette von früher',
  /ARTEN\.ablageGeladen/.test(band) && !/horche\('ablageGeladen'/.test(band));
p('… mit nachreichen: die Ablage ist beim Anmelden längst geladen', /nachreichen:\s*true/.test(band));
const ablage = lies('src/kern/ablage/indexdb.ts');
p('Und die Ablage meldet denselben Namen', /Ereignisse\.melde\(ARTEN\.ablageGeladen/.test(ablage));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
