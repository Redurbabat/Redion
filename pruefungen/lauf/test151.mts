/* Suite 115 — Die Shell navigiert, zeigt und überlagert richtig (RM-5, E78)
 * ============================================================================
 * Drei Zusicherungen der neuen Schicht, jede an echten Daten:
 *
 *   1. NAVIGATION: der Hash trägt die Route. Ein Klick auf eine Seite
 *      öffnet sie, Zurück führt zur Liste, und ein direkter Aufruf von
 *      #/seite/<id> landet ohne Umweg auf der Seite.
 *   2. DARSTELLUNG: die Blöcke des Bestands erscheinen in Reihenfolge und
 *      Art — und eine UNBEKANNTE Blockart wird gezeigt statt verschluckt
 *      (§18). Nutzertext mit spitzen Klammern bleibt Text (§19); React
 *      escapet, und das wird hier BEWIESEN, nicht geglaubt.
 *   3. ÜBERLAGERUNG: das Sheet ist ein echter <dialog> — Escape schliesst
 *      es, und der Fokus kehrt zum auslösenden Knopf zurück (§38). Genau
 *      die zwei Dinge, die der Bestand an dutzenden Stellen von Hand
 *      macht und die dort diese Woche zweimal kaputt waren.
 *
 *   node pruefungen/lauf/test151.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8855;

if (!fs.existsSync(path.join(WURZEL, 'dist-neu/app.html')))
  execSync('npx vite build', { cwd: WURZEL, stdio: 'pipe' });

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const ausNeu = rein === '/app.html' || rein.startsWith('/assets/');
  const basis = ausNeu ? path.join(WURZEL, 'dist-neu') : WURZEL;
  const pfad = path.join(basis, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(basis) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
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
const seite = await browser.newPage({ viewport: { width: 900, height: 800 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

console.log('\n1 · Der Bestand schreibt eine Seite mit allem Drum und Dran');

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
const ids = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  const s = Store.addBlock(null, 'page', { text: 'Navigationsseite', icon: '🧭' });
  Store.addBlock(s.id, 'h1', { text: 'Eine Überschrift' });
  Store.addBlock(s.id, 'text', { text: 'Ein Absatz mit <b>spitzen</b> Klammern' });
  const t = Store.addBlock(s.id, 'todo', { text: 'Eine Aufgabe' });
  Store.updateBlock(t.id, { checked: true });
  Store.addBlock(s.id, 'gibtsnicht-9000', { text: 'Fremder Block' });
  const unter = Store.addBlock(s.id, 'page', { text: 'Unterseite', icon: '🌿' });
  Store.addBlock(unter.id, 'text', { text: 'Tief drin' });
  await Store.flush();
  return { seite: s.id, unter: unter.id };
});
p('Seite und Unterseite stehen', !!(ids as any).seite && !!(ids as any).unter);

console.log('\n2 · Navigation: Liste → Seite → zurück → Direktaufruf');

await seite.goto(`http://localhost:${PORT}/app.html`);
await seite.waitForTimeout(1600);
await seite.click('a.shell-seite:has-text("Navigationsseite")');
await seite.waitForTimeout(600);
const aufSeite = await seite.evaluate(() => ({
  hash: location.hash, text: document.body.innerText }));
p('Der Klick öffnet die Seite', /Eine Überschrift/.test((aufSeite as any).text));
p('… und der Hash trägt die Route',
  (aufSeite as any).hash.startsWith('#/seite/'), (aufSeite as any).hash);

await seite.click('.pv-weg button');
await seite.waitForTimeout(600);
p('Zurück führt zur Liste', /Die Fächer des Bestands/.test(
  await seite.evaluate(() => document.body.innerText)));

await seite.goto(`http://localhost:${PORT}/app.html#/seite/${(ids as any).unter}`);
await seite.waitForTimeout(1600);
p('Ein Direktaufruf mit Kennung landet auf der Unterseite',
  /Tief drin/.test(await seite.evaluate(() => document.body.innerText)));

console.log('\n2b · Der Seitenbaum: Pfeile nur, wo es Unterseiten gibt');

await seite.goto(`http://localhost:${PORT}/app.html`);
await seite.waitForTimeout(1600);
const baum = await seite.evaluate(() => {
  const zeilen = [...document.querySelectorAll('.baum > li')];
  const mit = zeilen.find(z => z.textContent?.includes('Navigationsseite'));
  return {
    zeilen: zeilen.length,
    hatPfeil: !!mit?.querySelector('.baum-pfeil'),
    zu: mit?.querySelector('.baum-pfeil')?.getAttribute('aria-expanded'),
    unterSichtbar: document.body.innerText.includes('Unterseite')
  };
});
p('Der Baum steht', (baum as any).zeilen >= 1, String((baum as any).zeilen));
p('Die Seite mit Unterseite trägt einen Pfeil', (baum as any).hatPfeil === true);
gleich('… zugeklappt, und sagt es (aria-expanded)', (baum as any).zu, 'false');
p('Die Unterseite ist noch nicht sichtbar', (baum as any).unterSichtbar === false);

await seite.evaluate(() => {
  const mit = [...document.querySelectorAll('.baum > li')]
    .find(z => z.textContent?.includes('Navigationsseite'));
  (mit?.querySelector('.baum-pfeil') as HTMLElement)?.click();
});
await seite.waitForTimeout(300);
const auf = await seite.evaluate(() => ({
  unterSichtbar: document.body.innerText.includes('Unterseite'),
  zu: [...document.querySelectorAll('.baum > li')]
    .find(z => z.textContent?.includes('Navigationsseite'))
    ?.querySelector('.baum-pfeil')?.getAttribute('aria-expanded')
}));
p('Aufklappen zeigt die Unterseite', (auf as any).unterSichtbar === true);
gleich('… und der Pfeil sagt es', (auf as any).zu, 'true');

console.log('\n3 · Darstellung: ehrlich und sicher');

await seite.goto(`http://localhost:${PORT}/app.html#/seite/${(ids as any).seite}`);
await seite.waitForTimeout(1600);
const dar = await seite.evaluate(() => ({
  text: document.body.innerText,
  hatB: !!document.querySelector('.pv-text b'),
  todoHaken: (document.querySelector('.pv-todo input') as HTMLInputElement | null)?.checked ?? null,
  unterLink: !!document.querySelector('.pv-unterseite a')
}));
p('Die spitzen Klammern sind TEXT geblieben — kein <b> im Baum (§19)',
  /<b>spitzen<\/b>/.test((dar as any).text) && (dar as any).hatB === false);
gleich('Die erledigte Aufgabe trägt ihren Haken', (dar as any).todoHaken, true);
p('Die unbekannte Blockart wird gezeigt, mit Namen',
  /gibtsnicht-9000/.test((dar as any).text) && /Fremder Block/.test((dar as any).text));
p('Die Unterseite ist ein Link', (dar as any).unterLink === true);

console.log('\n3b · Eine Datenbank in der Seite: Tabelle, nur lesend (RM-6)');

/* Schreiben kann nur der Bestand — also zurück zu index.html dafür. */
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2200);
const dbIds = await seite.evaluate(async () => {
  const gefunden = Object.values<any>(Store.cache.blocks)
    .find(b => b.type === 'page' && b.text === 'Navigationsseite');
  const db = Store.addDatabase(gefunden.id, 'Fahrten', {
    title: { name: 'Titel', type: 'title' },
    km:    { name: 'Kilometer', type: 'number' },
    magie: { name: 'Magie', type: 'formula', formel: 'km * 2' }
  }, 'table');
  const z = Store.addRow(db.collectionId, { km: 12 });
  Store.updateBlock(z.id, { text: 'Nach Norden' });
  await Store.flush();
  return { seite: gefunden.id };
});
await seite.goto(`http://localhost:${PORT}/app.html#/seite/${(dbIds as any).seite}`);
await seite.waitForTimeout(1600);
const tabelle = await seite.evaluate(() => {
  const koepfe = [...document.querySelectorAll('.dbv-tabelle th')].map(x => x.textContent);
  const zellen = [...document.querySelectorAll('.dbv-tabelle td')].map(x => x.textContent);
  return { koepfe, zellen, name: document.querySelector('.dbv-name')?.textContent || '' };
});
p('Die Tabelle steht mit den Spalten des Schemas',
  JSON.stringify((tabelle as any).koepfe) === '["Titel","Kilometer","Magie"]',
  JSON.stringify((tabelle as any).koepfe));
p('Die Zeile zeigt ihre Rohwerte',
  ((tabelle as any).zellen ?? []).includes('Nach Norden') &&
  ((tabelle as any).zellen ?? []).includes('12'),
  JSON.stringify((tabelle as any).zellen));
p('Die Formelspalte LÜGT nicht — sie sagt, dass der Bestand rechnet',
  ((tabelle as any).zellen ?? []).some((z: any) => /rechnet der Bestand/.test(String(z))),
  JSON.stringify((tabelle as any).zellen));
p('Der Datenbankname samt Zeilenzahl steht darüber',
  /Fahrten/.test((tabelle as any).name) && /1 Zeile/.test((tabelle as any).name),
  (tabelle as any).name);

console.log('\n3c · Die Suche: Titel und Inhalt, ehrlich gedeckelt (RM-6)');

await seite.goto(`http://localhost:${PORT}/app.html`);
await seite.waitForSelector('.suche-feld', { timeout: 10000 });
await seite.fill('.suche-feld', 'Tief drin');
await seite.waitForTimeout(400);
const suche = await seite.evaluate(() => {
  const treffer = [...document.querySelectorAll('.suche-treffer li')];
  return { anzahl: treffer.length,
           erste: treffer[0]?.textContent || '',
           auszug: !!treffer[0]?.querySelector('.suche-auszug') };
});
p('Ein Inhaltstreffer findet seine Seite',
  (suche as any).anzahl >= 1 && /Unterseite/.test((suche as any).erste),
  JSON.stringify(suche));
p('… mit Auszug aus dem Inhalt', (suche as any).auszug === true);

await seite.fill('.suche-feld', 'gibtsnichtnirgends12345');
await seite.waitForTimeout(400);
p('Nichts gefunden sagt es ehrlich, mit der Frage im Satz',
  await seite.evaluate(() =>
    /Nichts gefunden zu „gibtsnichtnirgends12345"/.test(document.body.innerText)));

await seite.fill('.suche-feld', 'Navigationsseite');
await seite.waitForTimeout(400);
await seite.click('.suche-treffer a');
await seite.waitForTimeout(600);
p('Ein Klick auf den Treffer öffnet die Seite',
  /Eine Überschrift/.test(await seite.evaluate(() => document.body.innerText)));

console.log('\n3d · Der Papierkorb: sichtbar, aber nur der Bestand darf handeln');

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2200);
await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Weggeworfene Seite' });
  Store.trashBlock(s.id);
  await Store.flush();
});
await seite.goto(`http://localhost:${PORT}/app.html`);
/* Auf den ABSCHNITT warten, nicht eine feste Zeit: einmal reichte die
   Sekunde, einmal nicht — ein Lauf, der vom Wetter abhängt, prüft nichts. */
await seite.waitForSelector('.korb-zeile, .shell-hinweis', { timeout: 10000 });
await seite.waitForTimeout(300);
const korb = await seite.evaluate(() => ({
  text: document.body.innerText,
  imBaum: [...document.querySelectorAll('.baum a')]
    .some(a => a.textContent?.includes('Weggeworfene Seite'))
}));
p('Die weggeworfene Seite steht im Papierkorb-Abschnitt',
  /Papierkorb \(/.test((korb as any).text) &&
  /Weggeworfene Seite/.test((korb as any).text));
p('… aber NICHT im Seitenbaum', (korb as any).imBaum === false);
p('Und die Zuständigkeit steht dabei: handeln kann nur der Bestand',
  /Wiederherstellen und endgültig löschen kann nur der Bestand/.test((korb as any).text));

console.log('\n4 · Das Sheet: Escape schliesst, der Fokus kehrt zurück');

await seite.goto(`http://localhost:${PORT}/app.html`);
await seite.waitForTimeout(1600);
await seite.click('.shell-ueber');
await seite.waitForTimeout(300);
const offen = await seite.evaluate(() => {
  const d = document.querySelector('dialog.ui-sheet') as HTMLDialogElement | null;
  return { offen: d?.open ?? false, text: d?.textContent || '' };
});
gleich('Der ⓘ-Knopf öffnet das Sheet', (offen as any).offen, true);
p('… mit Inhalt', /React-Schicht aus E78/.test((offen as any).text));

await seite.keyboard.press('Escape');
await seite.waitForTimeout(300);
const zu = await seite.evaluate(() => ({
  offen: (document.querySelector('dialog.ui-sheet') as HTMLDialogElement | null)?.open ?? false,
  fokus: document.activeElement?.className || ''
}));
gleich('Escape schliesst es', (zu as any).offen, false);
p('Und der Fokus steht wieder auf dem Knopf (§38)',
  /shell-ueber/.test((zu as any).fokus), (zu as any).fokus);

/* Wieder öffnen: der Zustand draussen muss mitgekommen sein — sonst wäre
   der Dialog nach Escape „offen" im Zustand und liesse sich nie wieder
   aufmachen. Genau dafür horcht Sheet auf `close`. */
await seite.click('.shell-ueber');
await seite.waitForTimeout(300);
gleich('Nach Escape lässt es sich wieder öffnen',
  await seite.evaluate(() =>
    (document.querySelector('dialog.ui-sheet') as HTMLDialogElement | null)?.open ?? false),
  true);

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 115 — Shell: Navigation, Darstellung, Sheet: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
