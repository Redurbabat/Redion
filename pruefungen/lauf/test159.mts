/* Suite 123 — Automationen: der sonst-Zweig ist erstklassig (L16)
 * ============================================================================
 * Bisher hiess „sonst": zwei gespiegelte Aktions-Bedingungen von Hand —
 * und wenn die Bedingungen der Automation nicht trafen, lief schlicht GAR
 * NICHTS. Jetzt hat die Automation neben `dann` eine Schwesterliste
 * `sonst`: treffen die Bedingungen zu, läuft `dann`; treffen sie nicht,
 * läuft `sonst`. Der Verlauf notiert den Zweig, die Vorschau zeigt ihn,
 * und ein sonst OHNE Bedingungen sagt ehrlich, dass es nie liefe.
 *
 * Die Feldnamen `dann` und `sonst` sind deutsch, weil sie so gespeichert
 * werden (§53.3) — `dann` gab es schon, `sonst` fehlt einfach bei alten
 * Automationen, und fehlen heisst leer. Rückwärts kompatibel ohne
 * Migration.
 *
 *   node pruefungen/lauf/test159.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8873;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Eine Datenbank: Status (Text) · Stufe (Text) · Vermerk (Text).
   Die Automation: wenn sich die Stufe ändert — NUR WENN Status = "offen" —
   dann Vermerk = "im Plan", sonst Vermerk = "ausser der Reihe". */
const ids = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Zweigprobe' });
  const db = Store.addDatabase(s.id, 'Aufträge', {
    title:   { name: 'Titel',   type: 'title' },
    status:  { name: 'Status',  type: 'text' },
    stufe:   { name: 'Stufe',   type: 'text' },
    vermerk: { name: 'Vermerk', type: 'text' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  c.automationen = [{
    id: 'sonst01', name: 'Zweigprobe', an: true,
    wenn: { art: 'prop-geaendert', key: 'stufe' },
    bedingungen: [{ key: 'status', op: 'ist', wert: 'offen' }],
    dann:  [{ art: 'setze-prop', key: 'vermerk', wert: 'im Plan' }],
    sonst: [{ art: 'setze-prop', key: 'vermerk', wert: 'ausser der Reihe' }]
  }];
  Store.updateCollection(c.id, { automationen: c.automationen });
  return { coll: c.id, statusK: 'status', stufeK: 'stufe', vermerkK: 'vermerk' };
});

console.log('\n1 · Bedingung trifft: der dann-Zweig läuft, der sonst-Zweig nicht');

const dann = await seite.evaluate(async (s: any) => {
  const row = Store.addRow(s.coll, { title: 'Zeile eins', status: 'offen' });
  Store.setProp(row.id, s.stufeK, 'B');       /* Auslöser */
  await new Promise(r => setTimeout(r, 400));
  return ((Store.getBlock(row.id) || {}).props || {})[s.vermerkK] || '';
}, ids);
gleich('Vermerk sagt „im Plan"', dann, 'im Plan');

console.log('\n2 · Bedingung trifft NICHT: der sonst-Zweig läuft — vorher lief gar nichts');

const sonst = await seite.evaluate(async (s: any) => {
  const row = Store.addRow(s.coll, { title: 'Zeile zwei', status: 'gesperrt' });
  Store.setProp(row.id, s.stufeK, 'C');       /* Auslöser */
  await new Promise(r => setTimeout(r, 400));
  const a = (Store.getCollection(s.coll).automationen || [])[0] || {};
  return {
    vermerk: ((Store.getBlock(row.id) || {}).props || {})[s.vermerkK] || '',
    verlauf: (a.verlauf || [])[0] || {}
  };
}, ids);
gleich('Vermerk sagt „ausser der Reihe"', (sonst as any).vermerk, 'ausser der Reihe');
gleich('Der Verlauf notiert den Zweig', (sonst as any).verlauf.zweig, 'sonst');

console.log('\n3 · Eine alte Automation ohne sonst läuft wie immer');

const alt = await seite.evaluate(async (s: any) => {
  const c = Store.getCollection(s.coll);
  c.automationen = [{
    id: 'alt0001', name: 'Alt', an: true,
    wenn: { art: 'prop-geaendert', key: s.stufeK },
    bedingungen: [{ key: s.statusK, op: 'ist', wert: 'offen' }],
    dann: [{ art: 'setze-prop', key: s.vermerkK, wert: 'altbekannt' }]
    /* kein sonst-Feld — wie jede vor E85 angelegte Automation */
  }];
  Store.updateCollection(c.id, { automationen: c.automationen });
  const rowJa = Store.addRow(s.coll, { title: 'Alt ja', status: 'offen' });
  Store.setProp(rowJa.id, s.stufeK, 'D');
  const rowNein = Store.addRow(s.coll, { title: 'Alt nein', status: 'zu' });
  Store.setProp(rowNein.id, s.stufeK, 'D');
  await new Promise(r => setTimeout(r, 400));
  return {
    ja:   ((Store.getBlock(rowJa.id) || {}).props || {})[s.vermerkK] || '',
    nein: ((Store.getBlock(rowNein.id) || {}).props || {})[s.vermerkK] || ''
  };
}, ids);
gleich('Bedingung trifft: läuft', (alt as any).ja, 'altbekannt');
gleich('Bedingung trifft nicht: läuft nichts — wie eh und je', (alt as any).nein, '');

console.log('\n4 · Die Liste zeigt beide Zweige');

await seite.evaluate((s: any) => {
  const c = Store.getCollection(s.coll);
  c.automationen = [{
    id: 'sonst02', name: 'Anzeige', an: true,
    wenn: { art: 'prop-geaendert', key: s.stufeK },
    bedingungen: [{ key: s.statusK, op: 'ist', wert: 'offen' }],
    dann:  [{ art: 'setze-prop', key: s.vermerkK, wert: 'x' }],
    sonst: [{ art: 'melden', text: 'daneben' }]
  }];
  Store.updateCollection(c.id, { automationen: c.automationen });
  Datenbank.automationenMenue(document.body, c, null, null);
}, ids);
await seite.waitForTimeout(400);
const liste = await seite.evaluate(() => {
  const z = document.querySelector('.auto-zeile .auto-text span');
  return z ? z.textContent || '' : '';
});
p('„Dann:" steht da', liste.includes('Dann:'), liste.slice(0, 120));
p('„Sonst:" steht daneben', liste.includes('Sonst:'), liste.slice(0, 120));
await seite.evaluate(() => document.querySelector('.overlay')?.remove());

console.log('\n5 · Im Anlege-Dialog: die Aktion wandert per Häkchen in den sonst-Zweig');

const dialog = await seite.evaluate(async (s: any) => {
  const c = Store.getCollection(s.coll);
  Datenbank.automationenMenue(document.body, c, null, null);
  await new Promise(r => setTimeout(r, 200));
  (document.querySelector('.overlay [data-a="neu"]') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 300));
  const o = document.querySelector('.overlay');
  if (!o) return null;
  const sonstKasten = o.querySelector<HTMLInputElement>('#adsonst');
  /* Ohne Bedingungen muss der ehrliche Hinweis da sein — ein sonst-Zweig
     ohne Bedingungen liefe nie. */
  const hinweis = o.querySelector('#sonst-hinweis');
  return { kastenDa: !!sonstKasten, hinweisDa: !!hinweis,
           hinweisText: hinweis ? (hinweis.textContent || '') : '' };
}, ids);
p('Das Häkchen „in den sonst-Zweig" gibt es', !!dialog && (dialog as any).kastenDa);
p('Ohne Bedingungen steht der ehrliche Hinweis da',
  !!dialog && (dialog as any).hinweisDa &&
  /Bedingung/.test((dialog as any).hinweisText),
  dialog ? (dialog as any).hinweisText.slice(0, 80) : 'kein Dialog');

/* Und die Speicherung: eine Aktion mit Häkchen landet in `sonst`. */
const gespeichert = await seite.evaluate(async (s: any) => {
  const o = document.querySelector('.overlay');
  if (!o) return null;
  (o.querySelector<HTMLInputElement>('#an') as HTMLInputElement).value = 'Dialogprobe';
  /* Auslöser: Eigenschaft gesetzt — Stufe */
  const aw = o.querySelector<HTMLInputElement>('#aw');
  if (aw) { aw.value = 'prop-geaendert'; aw.dispatchEvent(new Event('change', { bubbles: true })); }
  await new Promise(r => setTimeout(r, 150));
  const ak = o.querySelector<HTMLInputElement>('#ak');
  if (ak) ak.value = s.stufeK;
  /* Aktion 1 (dann): Vermerk setzen */
  const ad = o.querySelector<HTMLInputElement>('#ad');
  if (ad) { ad.value = 'setze-prop'; ad.dispatchEvent(new Event('change', { bubbles: true })); }
  await new Promise(r => setTimeout(r, 150));
  const adk2 = o.querySelector<HTMLInputElement>('#adk2');
  if (adk2) adk2.value = s.vermerkK;
  const adv = o.querySelector<HTMLInputElement>('#adv');
  if (adv) adv.value = 'eins';
  (o.querySelector('[data-a="mehr"]') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 150));
  /* Aktion 2 (sonst): melden */
  const ad2 = o.querySelector<HTMLInputElement>('#ad');
  if (ad2) { ad2.value = 'melden'; ad2.dispatchEvent(new Event('change', { bubbles: true })); }
  await new Promise(r => setTimeout(r, 150));
  const adv2 = o.querySelector<HTMLInputElement>('#adv');
  if (adv2) adv2.value = 'zwei';
  const kasten = o.querySelector<HTMLInputElement>('#adsonst');
  if (kasten) kasten.checked = true;
  (o.querySelector('[data-a="ok"]') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 250));
  const c = Store.getCollection(s.coll);
  const a = (c.automationen || []).find((x: any) => x.name === 'Dialogprobe');
  return a ? { dann: (a.dann || []).map((d: any) => d.art),
               sonst: (a.sonst || []).map((d: any) => d.art) } : null;
}, ids);
p('Die Automation wurde angelegt', !!gespeichert);
gleich('Aktion eins steht im dann-Zweig',
  JSON.stringify((gespeichert as any)?.dann), JSON.stringify(['setze-prop']));
gleich('Aktion zwei steht im sonst-Zweig',
  JSON.stringify((gespeichert as any)?.sonst), JSON.stringify(['melden']));
await seite.evaluate(() => document.querySelector('.overlay')?.remove());

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
