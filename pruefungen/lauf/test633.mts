/* Suite 633 — Das Prüfzentrum: nachgeladen, mit E747 in einem Satz,
 *             CSV gegen Formel-Einschleusung, „Leitungen aufräumen" (E771)
 * ============================================================================
 * Aus Redurs ZIP vom 1. November 2026 („Alle Funktionen 1:1, sauber
 * gebaut"). Dort war der Kern handgeschriebenes JavaScript unter
 * `bereiche/elektro/` mit einem Bericht „BABAT …"; hier ist er getypt und
 * liegt neben der Planfläche (`bloecke/arten/schaltplan-pruefung.ts`).
 *
 *   §1 Der Start holt den Kern nicht; er steht im GRUNDSTOCK und in der
 *      Einzeldatei.
 *   §2 Alt+Umschalt+P öffnet das Prüfzentrum, und erst jetzt kommt der Kern.
 *   §3 Es meldet schräge Stücke, entfernbare Zwischenpunkte, offene Enden —
 *      und offene Klemmen mit GENAU den Sätzen der Rechnung (E747), nicht
 *      mit einer zweiten Geometrie.
 *   §4 Die Stückliste als CSV: BOM, Semikolon, und ein BMK „=HYPERLINK(…)"
 *      kommt mit Hochkomma an. Der Bericht trägt keinen fremden Namen.
 *   §5 „Leitungen aufräumen" entfernt den Zwischenpunkt, Enden bleiben, und
 *      EIN Rückgängig bringt ihn zurück (es läuft durch `aendere`).
 *
 * Gegen den Stand vor E771 (a6472d3f7) rot: dort gibt es kein Prüfzentrum.
 *
 *   node pruefungen/lauf/test633.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll), 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

/* ══ §1 ════════════════════════════════════════════════════════════════════ */
console.log('\n§1 Nicht beim Start, aber offline und in der Einzeldatei');
const sw = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
const index = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const einzel = fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8');
p('Der Kern steht im GRUNDSTOCK (§28)', sw.includes("'./quell/bereiche/bloecke/arten/schaltplan-pruefung.js'"));
p('… und NICHT als <script> in index.html', !/<script[^>]+schaltplan-pruefung/.test(index));
p('Die Einzeldatei trägt ihn', einzel.includes('/* ===== quell/bereiche/bloecke/arten/schaltplan-pruefung.js ===== */'));

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 }, acceptDownloads: true });
const s = await ktx.newPage();
s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
s.on('dialog', d => { fehler.push('DIALOG ' + d.message().slice(0, 60)); d.dismiss().catch(() => {}); });
await s.goto(INDEX);
await s.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
gleich('Nach dem Start: kein Prüfkern geladen', await s.evaluate(() => ({
  skript: [...document.scripts].some(x => /schaltplan-pruefung/.test(x.src)), name: 'Planpruefung' in window })),
  { skript: false, name: false });

const blockId = await s.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
  Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
  const sp = Store.addPage(null, { text: 'Plan 633', icon: '⚡' });
  const b = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
    teile: [{ id: 'e1', zeichen: 'signalleuchte', x: 740, y: 520, drehung: 0, bmk: '=HYPERLINK("x")', nummern: {} }],
    leitungen: [
      { id: 'w1', punkte: [{ x: 40, y: 100 }, { x: 120, y: 100 }, { x: 240, y: 100 }] },
      { id: 'w2', punkte: [{ x: 300, y: 420 }, { x: 360, y: 480 }] }
    ],
    texte: [], ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] } });
  await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  return b.id as string;
});
/* Eine rechnende Schaltung dazu („⚡ Schaltung → Ausschaltung"): offene Klemmen
   meldet die Rechnung nur, wenn sie rechnet (E747) — E1 daneben hängt frei. */
await s.locator('.sp-wrap [data-a="netz"]').click();
await s.locator('.menu button, [role=menu] button').filter({ hasText: /^Ausschaltung/ }).first().click();
await s.waitForTimeout(400);
const plan = () => s.evaluate((id: string) => JSON.parse(JSON.stringify(Store.getBlock(id).plan)), blockId);

/* ══ §2 ════════════════════════════════════════════════════════════════════ */
console.log('\n§2 Alt+Umschalt+P öffnet das Prüfzentrum');
await s.locator('.sp-wrap').first().evaluate((w: HTMLElement) => w.focus({ preventScroll: true }));
await s.keyboard.press('Alt+Shift+P');
await s.waitForSelector('.sp-wrap .sp-pruef-fach .sp-pruef-zeile', { timeout: 8000 }).catch(() => {});
gleich('Das Fach ist offen, der Kern ist jetzt da', await s.evaluate(() => [
  !(document.querySelector('.sp-wrap .sp-pruef-fach') as HTMLElement).hidden, 'Planpruefung' in window]), [true, true]);

/* ══ §3 ════════════════════════════════════════════════════════════════════ */
console.log('\n§3 Was es meldet');
const r = await s.evaluate(async (id: string) => {
  const plan = Store.getBlock(id).plan;
  const P = (window as any).Planpruefung;
  const erg = P.analysieren(plan, {
    anschluesseVon: (t: any) => (window as any).Schaltplan.anschluesseVon(t),
    holeSymbol: (z: string) => (window as any).Register.fachzeichen.holen(z),
    netze: (pl: any) => Stromfluss.netze(pl),
    offeneKlemmen: (pl: any) => (Stromfluss.rechne(pl, {}, {}).warnungen || []).filter((w: string) => / hängt an keiner Leitung\.$/.test(w))
  });
  const rechnung = (Stromfluss.rechne(plan, {}, {}).warnungen || []).filter((w: string) => / hängt an keiner Leitung\.$/.test(w));
  const zeilen = [...document.querySelectorAll('.sp-wrap .sp-pruef-zeile')].map(z => z.textContent || '');
  return { arten: [...new Set(erg.punkte.map((x: any) => x.art))].sort(), klemmen: erg.punkte.filter((x: any) => x.art === 'offene-klemme').map((x: any) => x.text), rechnung, zeilen };
}, blockId);
p('Schräges Stück, Zwischenpunkt und offenes Ende werden gemeldet',
  ['diagonal', 'redundant', 'offenes-ende'].every(a => r.arten.includes(a)), r.arten.join(', '));
p('Die offenen Klemmen kommen aus der Rechnung (E747)', r.rechnung.length >= 1, JSON.stringify(r.rechnung));
gleich('… mit GENAU denselben Sätzen', r.klemmen, r.rechnung);
p('Die Liste im Fach zeigt diese Sätze', r.rechnung.every((satz: string) => r.zeilen.some((z: string) => z.includes(satz))),
  r.zeilen.slice(0, 6).join(' | '));

/* ══ §4 ════════════════════════════════════════════════════════════════════ */
console.log('\n§4 Ausgeben');
const lade = async (): Promise<string> => {
  const [dl] = await Promise.all([s.waitForEvent('download', { timeout: 8000 }), s.locator('.sp-wrap [data-p-a="export"]').click()]);
  const pfad = await dl.path();
  return pfad ? fs.readFileSync(pfad, 'utf8') : '';
};
const bericht = await lade();
p('Der Bericht beginnt mit „Redion · Schaltplan-Prüfbericht"', bericht.startsWith('Redion · Schaltplan-Prüfbericht'), bericht.slice(0, 60));
p('… und trägt keinen fremden Projektnamen (§1)', !/babat/i.test(bericht));
await s.locator('.sp-wrap [data-p-tab="bauteile"]').click();
const csv = await lade();
p('Die Stückliste ist CSV mit BOM und Semikolon', csv.startsWith('﻿"Fachzeichen";"Name"'), JSON.stringify(csv.slice(0, 40)));
p('Ein BMK „=HYPERLINK(…)" kommt mit Hochkomma an, nicht als Formel', csv.includes('"\'=HYPERLINK(""x"")"'), csv.split('\r\n')[1]);

/* ══ §5 ════════════════════════════════════════════════════════════════════ */
console.log('\n§5 Leitungen aufräumen');
await s.locator('.sp-wrap [data-p-tab="diagnose"]').click();
await s.locator('.sp-wrap [data-p-a="aufraeumen"]').click();
await s.waitForTimeout(250);
gleich('Der Zwischenpunkt ist weg, die Enden bleiben', (await plan()).leitungen.find((l: any) => l.id === 'w1').punkte,
  [{ x: 40, y: 100 }, { x: 240, y: 100 }]);
await s.locator('.sp-wrap [data-a="zurueck"]').click();
await s.waitForTimeout(200);
gleich('EIN Rückgängig bringt ihn zurück', (await plan()).leitungen.find((l: any) => l.id === 'w1').punkte.length, 3);

gleich('Keine Fehler und kein Browserdialog', fehler, []);
await browser.close();
console.log(`\n${ok} bestanden, ${weg} nicht bestanden`);
process.exit(weg ? 1 : 0);
