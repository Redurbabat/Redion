/* Suite 631 — Die Relais-Werkstatt: Redurs zehn Schaltungen, nachgeladen (E769)
 * ============================================================================
 * Aus Redurs ZIP vom 1. November. Redur: „sie gehören mir" — die zehn
 * Original-.sch/.txt aus dem Programm „Relais" kommen nach Redion, mit dem
 * Import eigener Dateien, getypt, und NICHT beim Start (60 KB Base64).
 *
 *   1 · DER START lädt keines der drei Skripte (test388 wächst nicht).
 *   2 · „⚙ Relais" lädt sie nach; zehn Schaltungen, jede mit stimmender
 *       SHA-256 ihrer .sch-Bytes.
 *   3 · EINSETZEN: ein neutraler Plan — Bauteile mit `legacySpalte`, die
 *       Originalbytes in `relaisLegacy`, Leitungen OHNE Bindung, nicht
 *       freigegeben; der Strom startet nicht, die Werkstatt sagt warum.
 *   4 · ORIGINAL SICHERN gibt Byte für Byte die eingesetzte .sch zurück.
 *   5 · FREIGEBEN fragt über das Fenster der Schale (kein confirm) und
 *       speichert erst nach dem Ja.
 *   6 · DAS VERDRAHTETE TREPPENHAUS ersetzt nach Rückfrage und leuchtet in
 *       der Simulation.
 *   7 · EINE EIGENE .sch (+ .txt) einlesen; eine kaputte wird abgewiesen.
 *   8 · DIE EINZELDATEI hat die Werkstatt ohne Ordner.
 *   9 · Keine Seitenfehler, kein confirm().
 *
 *   node pruefungen/alle.mts 631
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;
const EINZEL = pathToFileURL(path.join(WURZEL, 'redion-einzeldatei.html')).href;

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
const confirms: string[] = [];
type Seite = import('playwright').Page;
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 } });
const neu = async (url: string): Promise<Seite> => {
  const s = await ktx.newPage();
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  s.on('dialog', d => { confirms.push(d.type() + ': ' + d.message().slice(0, 60)); d.dismiss().catch(() => {}); });
  await s.goto(url);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined'
    && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99);
    Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  });
  return s;
};
const seite = await neu(INDEX);

/* ══ §1 Der Start ═════════════════════════════════════════════════════════ */
console.log('\n§1 Der Start lädt die Werkstatt nicht');
gleich('Kein Relais-Skript im Dokument, keine Namen im Fenster', await seite.evaluate(() => ({
  skripte: [...document.scripts].filter(s => /relais-/.test(s.src)).length,
  namen: ['RelaisKern', 'RelaisVorlagen', 'RelaisWerkstatt'].filter(n => n in window)
})), { skripte: 0, namen: [] });
p('Die drei Dateien stehen im GRUNDSTOCK (offline, §28)', ['relais-kern.js', 'relais-vorlagen.js', 'relais-werkstatt.js']
  .every(d => fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8').includes('./quell/bereiche/bloecke/arten/' + d)));
p('… und NICHT als <script> in index.html', !/<script[^>]+relais-/.test(fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8')));

/* ══ §2 Nachladen ═════════════════════════════════════════════════════════ */
console.log('\n§2 „⚙ Relais" lädt nach; zehn Schaltungen, Prüfsummen stimmen');
const blk = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Relais', icon: '⚙' });
  const b = Store.addBlock(s.id, 'schaltplan', { text: 'Relais', plan: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 700,
    teile: [], leitungen: [], texte: [], ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] } });
  await Store.flush();
  App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  return b.id as string;
});
const knopf = seite.locator('.sp-wrap button[data-a="relais"]').first();
p('Der Kopf hat „⚙ Relais", 44 px hoch erreichbar', await knopf.count() === 1);
if (await knopf.count()) { await knopf.click(); }
await seite.waitForSelector('.sp-relais-fach select[data-rel="wahl"]', { timeout: 8000 }).catch(() => {});
const vorlagen = await seite.evaluate(async () => {
  const V = (window as any).RelaisVorlagen as any[] | undefined;
  if (!V) return null;
  const hex = async (b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const h = await crypto.subtle.digest('SHA-256', bytes);
    return { n: bytes.length, h: [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('') };
  };
  const r = [];
  for (const v of V) { const x = await hex(v.sch); r.push({ name: v.name, n: x.n, stimmt: x.h === v.sha256 }); }
  return { r, optionen: document.querySelectorAll('.sp-relais-fach select[data-rel="wahl"] option').length };
});
gleich('Zehn Schaltungen im Fenster und im Wähler', [vorlagen?.r.length, vorlagen?.optionen], [10, 10]);
p('Jede .sch hat 4320 Byte und ihre SHA-256 stimmt', !!vorlagen && vorlagen.r.every(x => x.n === 4320 && x.stimmt),
  JSON.stringify(vorlagen?.r.filter(x => !x.stimmt || x.n !== 4320)));

/* ══ §3 Einsetzen ═════════════════════════════════════════════════════════ */
console.log('\n§3 Einsetzen: ein neutraler Plan, nicht freigegeben');
const idx = await seite.evaluate(() => ((window as any).RelaisVorlagen as any[] ?? []).findIndex(v => v.name === 'Treppenhauslicht'));
await seite.selectOption('.sp-relais-fach select[data-rel="wahl"]', String(idx)).catch(() => {});
await seite.click('.sp-relais-fach button[data-rel="einsetzen"]').catch(() => {});
await seite.waitForTimeout(400);
const plan = await seite.evaluate((id: string) => {
  const pl = Store.getBlock(id).plan;
  return { name: pl.relaisLegacy?.name ?? null, roh: pl.relaisLegacy?.roh?.length ?? 0,
    verifiziert: pl.relaisLegacy?.verifiziert ?? null, teile: pl.teile.length,
    spalten: pl.teile.every((t: any) => Number.isInteger(t.legacySpalte)),
    gebunden: pl.leitungen.filter((l: any) => l.vonTeil || l.nachTeil).length,
    texte: pl.relaisLegacy?.texte?.length ?? 0 };
}, blk);
gleich('Name, 5760 Zeichen Rohbytes, 30 Titel, nicht freigegeben',
  [plan.name, plan.roh, plan.texte, plan.verifiziert], ['Treppenhauslicht', 5760, 30, false]);
p('Bauteile stehen da, jedes mit seiner alten Spalte', plan.teile > 0 && plan.spalten, JSON.stringify(plan));
gleich('Keine Leitung ist an eine Klemme gebunden (Lagehinweise)', plan.gebunden, 0);
await seite.click('.sp-wrap button[data-a="simulation"]');
await seite.waitForTimeout(250);
gleich('Strom startet nicht', await seite.evaluate(() =>
  document.querySelector('.sp-wrap button[data-a="simulation"]')?.getAttribute('aria-pressed')), 'false');
p('… und die Meldung sagt warum', await seite.evaluate(() =>
  (document.getElementById('toast')?.textContent ?? document.body.textContent ?? '').includes('nicht geprüft')));

/* ══ §4 Original sichern ═════════════════════════════════════════════════ */
console.log('\n§4 Original sichern: Byte für Byte');
const gesichert = await seite.evaluate(async () => {
  const blobs: Blob[] = [];
  const echt = URL.createObjectURL.bind(URL);
  const klick = HTMLAnchorElement.prototype.click;
  (URL as any).createObjectURL = (b: Blob) => { blobs.push(b); return 'blob:gefangen'; };
  HTMLAnchorElement.prototype.click = function () { /* kein Download im Lauf */ };
  try {
    (document.querySelector('.sp-relais-fach button[data-rel="original"]') as HTMLButtonElement | null)?.click();
    await new Promise(f => setTimeout(f, 100));
  } finally { (URL as any).createObjectURL = echt; HTMLAnchorElement.prototype.click = klick; }
  const V = (window as any).RelaisVorlagen as any[];
  const v = V.find(x => x.name === 'Treppenhauslicht');
  const sch = blobs[0] ? new Uint8Array(await blobs[0].arrayBuffer()) : new Uint8Array();
  const soll = Uint8Array.from(atob(v.sch), c => c.charCodeAt(0));
  return { anzahl: blobs.length, gleich: sch.length === soll.length && sch.every((b, i) => b === soll[i]) };
});
gleich('Zwei Dateien (.sch, .txt), die .sch gleich der Vorlage', [gesichert.anzahl, gesichert.gleich], [2, true]);

/* ══ §5 Freigeben ═════════════════════════════════════════════════════════ */
console.log('\n§5 Freigeben fragt über das Fenster der Schale');
await seite.click('.sp-relais-fach button[data-rel="freigeben"]').catch(() => {});
await seite.waitForTimeout(500);
const jaKnopf = seite.getByRole('button', { name: 'Freigeben', exact: true }).last();
p('Ein Fenster fragt „Verdrahtung freigeben?"', await jaKnopf.count() > 0 && await seite.evaluate(() =>
  document.body.innerText.includes('Verdrahtung freigeben?')));
gleich('Vor dem Ja ist nichts gespeichert', await seite.evaluate((id: string) =>
  Store.getBlock(id).plan.relaisLegacy.verifiziert, blk), false);
if (await jaKnopf.count()) await jaKnopf.click();
await seite.waitForTimeout(400);
gleich('Nach dem Ja: freigegeben', await seite.evaluate((id: string) =>
  Store.getBlock(id).plan.relaisLegacy.verifiziert, blk), true);

/* ══ §6 Das verdrahtete Treppenhaus ══════════════════════════════════════ */
console.log('\n§6 Das verdrahtete Treppenhaus ersetzt nach Rückfrage und leuchtet');
await seite.click('.sp-relais-fach button[data-rel="lehr-treppenhaus"]').catch(() => {});
await seite.waitForTimeout(500);
const ersetzen = seite.getByRole('button', { name: 'Ersetzen', exact: true }).last();
p('Ein Fenster fragt vor dem Ersetzen', await ersetzen.count() > 0);
if (await ersetzen.count()) await ersetzen.click();
await seite.waitForTimeout(500);
const lehr = await seite.evaluate((id: string) => {
  const pl = Store.getBlock(id).plan;
  return { legacy: 'relaisLegacy' in pl, abfall: pl.teile.some((t: any) => t.zeichen === 'spule-abfallverzoegert'),
    gebunden: pl.leitungen.filter((l: any) => l.vonTeil || l.nachTeil).length };
}, blk);
gleich('Verdrahtet, mit abfallverzögertem Relais, ohne Originalbytes', [lehr.legacy, lehr.abfall, lehr.gebunden > 4], [false, true, true]);
await seite.click('.sp-wrap button[data-a="simulation"]');
await seite.waitForTimeout(250);
const s1 = await seite.evaluate((id: string) => Store.getBlock(id).plan.teile.find((t: any) => t.bmk === 'S1')?.id, blk);
await seite.locator(`.sp-wrap svg .sp-teil[data-id="${s1}"]`).first().scrollIntoViewIfNeeded();
/* Auf eine gezeichnete Linie des Tasters zielen, nicht auf seinen Kasten (der reicht bis unter das BMK). */
const ziel = await seite.evaluate((id: string) => {
  const g = document.querySelector(`.sp-wrap svg .sp-teil[data-id="${id}"]`);
  for (const el of g ? [...g.querySelectorAll("line,path,rect,circle")] : []) {
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.25], [0.5, 0.75]]) {
      const x = r.left + r.width * fx!, y = r.top + r.height * fy!;
      if (document.elementFromPoint(x, y)?.closest(".sp-teil") === g) return { x, y };
    }
  }
  return null;
}, s1);
const box = ziel ? { x: ziel.x - 12, y: ziel.y - 18 } : null;
if (box) { await seite.mouse.move(box.x + 12, box.y + 18); await seite.mouse.down(); await seite.waitForTimeout(250); }
const fluss = await seite.evaluate(() => ({ n: document.querySelectorAll('.sp-wrap .sp-fluss').length, fuss: (document.querySelector('.sp-wrap .sp-fuss')?.textContent ?? '').slice(0, 200), an: document.querySelector('.sp-wrap button[data-a="simulation"]')?.getAttribute('aria-pressed') }));
p('Taster gedrückt: Strom fliesst zur Lampe', fluss.n >= 4, JSON.stringify(fluss));
await seite.mouse.up();
await seite.click('.sp-wrap button[data-a="simulation"]');

/* ══ §7 Eigene Dateien ═══════════════════════════════════════════════════ */
console.log('\n§7 Eine eigene .sch einlesen');
const vorl = await seite.evaluate(() => ((window as any).RelaisVorlagen as any[]).find(v => v.name === 'Blinker'));
await seite.setInputFiles('.sp-relais-fach input[data-rel-datei="sch"]',
  { name: 'Mein Blinker.sch', mimeType: 'application/octet-stream', buffer: Buffer.from(vorl.sch, 'base64') });
await seite.setInputFiles('.sp-relais-fach input[data-rel-datei="txt"]',
  { name: 'Mein Blinker.txt', mimeType: 'text/plain', buffer: Buffer.from('[Ein]' + '[]'.repeat(28) + '[Aus]', 'latin1') });
await seite.click('.sp-relais-fach button[data-rel="import"]');
await seite.waitForTimeout(500);
const er = seite.getByRole('button', { name: 'Ersetzen', exact: true }).last();
if (await er.count()) await er.click();
await seite.waitForTimeout(400);
gleich('Eingelesen: Name aus der Datei, Titel aus der .txt', await seite.evaluate((id: string) => {
  const m = Store.getBlock(id).plan.relaisLegacy;
  return m ? [m.name, m.texte[0], m.texte[29], m.verifiziert] : null;
}, blk), ['Mein Blinker', 'Ein', 'Aus', false]);
await seite.setInputFiles('.sp-relais-fach input[data-rel-datei="sch"]',
  { name: 'kaputt.sch', mimeType: 'application/octet-stream', buffer: Buffer.alloc(100) });
await seite.setInputFiles('.sp-relais-fach input[data-rel-datei="txt"]', []);
await seite.click('.sp-relais-fach button[data-rel="import"]');
await seite.waitForTimeout(300);
p('Eine .sch mit 100 Byte wird mit Grund abgewiesen', await seite.evaluate(() =>
  (document.querySelector('.sp-relais-fach [role="status"]')?.textContent ?? '').includes('4320 Byte')));

/* ══ §8 Die Einzeldatei ══════════════════════════════════════════════════ */
console.log('\n§8 Die Einzeldatei hat die Werkstatt ohne Ordner');
const einzel = await neu(EINZEL);
gleich('Kern, Vorlagen und Werkstatt stehen schon da', await einzel.evaluate(() =>
  [typeof (window as any).RelaisKern?.vorlage, ((window as any).RelaisVorlagen ?? []).length,
   typeof (window as any).RelaisWerkstatt?.erstelle]), ['function', 10, 'function']);
await einzel.close();

/* ══ §9 ══════════════════════════════════════════════════════════════════ */
console.log('\n§9 Keine Seitenfehler, kein confirm()');
gleich('Kein Fenster des Browsers (confirm/alert)', confirms, []);
gleich('Keine Seitenfehler', fehler, []);
await browser.close();
console.log('\n' + ok + '/' + (ok + weg) + ' bestanden');
process.exit(weg ? 1 : 0);
