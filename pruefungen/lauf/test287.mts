/* Suite 287 — Vor dem Ersetzen ein Netz (E292, L101 Punkt 3)
 * ============================================================================
 * Der VERSCHLÜSSELTE Einspielweg schreibt seit jeher eine Sicherheitskopie,
 * bevor er ersetzt:
 *
 *     krypto.ts:935   await sicherungSchreiben();   // Netz unter dem Seil
 *
 * Der OFFENE Weg tat es nicht (`schale.ts:2033`, `Store.importAll` direkt).
 * Das ist genau verkehrt herum zur Gefahr: den offenen Weg benutzen mehr
 * Leute, und „Ersetzen" löscht alles, was nicht in der Sicherung steht.
 *
 *   §1 ERSETZEN schreibt vorher eine Kopie.
 *   §2 GEGENPROBE: DAZULEGEN schreibt keine — dort wird nichts gelöscht.
 *   §3 DER DIALOG sagt es vorher, statt zu überraschen.
 *   §4 DIE INHALTE kommen trotzdem an.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §1 war vor E292 rot: `sicherung:zuletzt` blieb beim Ersetzen unverändert.
 * §2 ist die Gegenprobe, ohne die §1 auch mit „schreibe IMMER eine Kopie"
 * grün wäre — und das wäre eine Datei im Download-Ordner, die niemand
 * bestellt hat.
 *
 *   node pruefungen/lauf/test287.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Krypto: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9071;

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

const browser = await chromium.launch();
const kontext = await browser.newContext({ acceptDownloads: true });
const seite = await kontext.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' && typeof (globalThis as any).Krypto !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1400);

/* Eine kleine, echte Sicherung bauen — aus dem Bestand selbst. */
const sicherung = await seite.evaluate(() => {
  document.getElementById('rg-willkommen')?.remove();
  Store.addBlock(null, 'page', { text: 'Seite aus der Sicherung' });
  return Store.exportAll();
}) as string;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-e292-'));
const datei = path.join(tmp, 'sicherung.json');
fs.writeFileSync(datei, sicherung);

/* Danach etwas anlegen, das NUR im Bestand steht — beim Ersetzen muss es weg. */
await seite.evaluate(() => {
  Store.addBlock(null, 'page', { text: 'Nur im Bestand, verschwindet beim Ersetzen' });
});

/* GEMESSEN WIRD DIE DATEI, NICHT DIE MARKE IN `meta`.
   Die erste Fassung las `sicherung:zuletzt` — und war rot, obwohl die
   Sicherheitskopie geschrieben wurde. Der Grund ist derselbe Vorgang, um
   den es hier geht: „Ersetzen" ersetzt AUCH `meta`, also überschreibt es
   die Marke unmittelbar wieder mit dem Stand aus der Sicherung. Eine
   Prüfung, die aus dem falschen Grund rot ist, sagt nichts.

   Der Download ist der direkte Beleg: eine Datei liegt danach da, mit
   Namen. `acceptDownloads` steht oben. */
const downloads: string[] = [];
seite.on('download', d => { downloads.push(d.suggestedFilename()); });

const einspielen = async (knopf: 'ersetzen' | 'zusammenfuehren') => {
  const vorher = await seite.evaluate(() =>
    String(Store.getMeta('sicherung:zuletzt', '') || '')) as string;
  const zuvorGeladen = downloads.length;
  /* ÜBER DEN DATEI-WÄHLER, NICHT ÜBER EINEN SELEKTOR. `sicherungLaden`
     legt das `<input type=file>` an und klickt es, ohne es ins Dokument zu
     hängen (`schale.ts:2113`) — ein Selektor findet es deshalb nie.
     Playwright fängt stattdessen den Wähler ab, und das ist ohnehin näher
     an dem, was ein Mensch tut. */
  await seite.evaluate(() => {
    document.querySelectorAll('.overlay,.menu').forEach(e => e.remove());
    Store.setMeta('sicherung:zuletzt', '');
  });
  const [waehler] = await Promise.all([
    seite.waitForEvent('filechooser', { timeout: 10000 }),
    seite.evaluate(() => { App.sicherungLaden(); })
  ]);
  /* Der Download darf nicht auf die Uhr warten — er wird angenommen und
     weggelegt, gemessen wird die Marke in `meta`. */
  const download = kontext.waitForEvent('page', { timeout: 1 }).catch(() => null);
  await waehler.setFiles(datei);
  const wahlKnopf = seite.locator('.overlay button[data-w="' + knopf + '"]');
  let dialogText = '';
  try {
    await wahlKnopf.waitFor({ state: 'visible', timeout: 8000 });
    dialogText = await seite.evaluate(() =>
      String(document.querySelector('.overlay')?.textContent || ''));
    await wahlKnopf.click();
  } catch {
    dialogText = await seite.evaluate(() =>
      String(document.querySelector('.overlay')?.textContent || ''));
  }
  await seite.waitForTimeout(2600);
  void download;
  const nachher = await seite.evaluate(() =>
    String(Store.getMeta('sicherung:zuletzt', '') || '')) as string;
  return { vorher, nachher, dialogText,
           neue: downloads.slice(zuvorGeladen) };
};

/* ------------------------------------------------------------------------ */
console.log('\n1 · Ersetzen schreibt vorher eine Kopie');

const ers = await einspielen('ersetzen');
p('Vor dem Einspielen stand keine Marke', ers.vorher === '', ers.vorher);
p('Beim Ersetzen wird genau eine Datei geschrieben', ers.neue.length === 1,
  JSON.stringify(ers.neue));
p('… und sie heisst nach einer Redion-Sicherung',
  /^redion-sicherung-\d{4}-\d{2}-\d{2}\./.test(ers.neue[0] || ''),
  JSON.stringify(ers.neue));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Der Dialog sagt es vorher');

p('Der Ersetzen-Knopf kündigt die Sicherheitskopie an',
  /Sicherheitskopie/.test(ers.dialogText),
  ers.dialogText.replace(/\s+/g, ' ').slice(0, 200));

/* ------------------------------------------------------------------------ */
console.log('\n4 · Die Inhalte kommen trotzdem an');

const inhalt = await seite.evaluate(() => {
  const alle = Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b && b.alive && b.type === 'page');
  return {
    ausSicherung: alle.some((b: any) => (b.text || '').includes('aus der Sicherung')),
    nurBestand: alle.some((b: any) => (b.text || '').includes('Nur im Bestand'))
  };
}) as any;

p('Die Seite aus der Sicherung ist da', inhalt.ausSicherung === true);
p('… und die, die nur im Bestand stand, ist weg — Ersetzen hat ersetzt',
  inhalt.nurBestand === false);

/* ------------------------------------------------------------------------ */
console.log('\n2 · GEGENPROBE: Dazulegen schreibt keine Kopie');

const zus = await einspielen('zusammenfuehren');
p('Beim Dazulegen wird gar keine Datei geschrieben', zus.neue.length === 0,
  JSON.stringify(zus.neue));
p('… denn dort wird nichts gelöscht — eine Kopie hätte niemand bestellt',
  zus.neue.length === 0);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
