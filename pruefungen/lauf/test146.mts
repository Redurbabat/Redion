/* Suite 110 — Erfolg heisst: es ist passiert (A3–A6, D4, D7, D10 · E76)
 * ============================================================================
 * Sieben Stellen meldeten Erfolg, ohne hinzusehen. Sie stammen aus dem
 * grossen Durchgang „sagt eines, tut ein anderes" vom 8. August; jede hier
 * geprüfte Zusicherung war an dem Tag nachweislich falsch:
 *
 *   D7   Der Sichern-Knopf zeigte „✓ Gesichert" auch nach dem Alert
 *        „Es wurde nichts geschrieben" — `sicherungSpeichern` fing den
 *        Fehler intern und kehrte regulär zurück; `.then(() => fertig(true))`
 *        kann Rückkehr nicht von Erfolg unterscheiden.
 *   A3   Der KI-Agent meldete „15 Einträge gefüllt", auch wenn jede Zeile
 *        am Spaltenrecht abprallte oder die KI nichts gab.
 *   A4   „Gesichert: foto.jpg" erschien während der PRÜFSUMME — das Archiv
 *        war noch nicht gebaut, geschweige denn heruntergeladen.
 *   A5   Der Verschlüsseln-Dialog versprach „den ganzen Bestand"; die
 *        Anhänge fehlten, und das Manifest sagte es nur verschlüsselt.
 *   A6   Die Schublade endete 24 px UNTER dem Bildschirmrand, weil eine
 *        Regel für eine Leiste rechnete, die es nicht mehr gibt.
 *   D4   `setMeta` verschluckte Schreibfehler mit `.catch(() => {})` —
 *        „gespeichert", das beim Neuladen weg ist.
 *   D10  Die E-Taste im Mail-Bereich legte die Zeile lokal weg und meldete
 *        „Archiviert", auch wenn Gmail ablehnte — und bei .eml-Mails KONNTE
 *        Gmail nur ablehnen.
 *
 *   node pruefungen/lauf/test146.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8837;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

console.log('\n1 · Der Sichern-Knopf glaubt nicht mehr jedem Rückkehrer (D7)');

/* Der gesunde Weg: ohne Anhänge läuft der JSON-Zweig, und der sagt jetzt
   ausdrücklich `true`. */
const gesund = await seite.evaluate(async () => {
  const r = await App.sicherungSpeichern();
  return { r };
});
gleich('Eine gelungene Sicherung sagt `true`', (gesund as any).r, true);

/* Der kranke Weg: ein Anhang liegt da, aber das Packen wirft. Der Alert
   erscheint (Playwright drückt ihn weg), `sicherungSpeichern` kehrt REGULÄR
   zurück — und muss dabei `false` sagen. Vorher kam hier `undefined`, und
   der Knopf zeigte den Haken. */
const krank = await seite.evaluate(async () => {
  await Store.dateiPut({ id: 'krank-d1', name: 'kaputt.bin', groesse: 3,
    typ: 'application/octet-stream', blockId: null, teile: 1, angekommen: 1,
    zustand: 'fertig', angelegt: Store.now(), fertigAm: Store.now() });
  await Store.stueckPut({ id: 'krank-s1', datei: 'krank-d1', nr: 0,
    blob: new Blob(['abc']) });
  const echt = (Austausch as any).zipSchreiben;
  (Austausch as any).zipSchreiben = () => { throw new Error('Absichtlich kaputt'); };
  const r = await App.sicherungSpeichern();
  (Austausch as any).zipSchreiben = echt;
  return { r };
});
gleich('Eine gescheiterte Sicherung sagt `false` — trotz gefangenem Fehler',
  (krank as any).r, false);

/* Und der Knopf wertet genau das aus. */
const dienstTs = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/datenbanken/ansichten/dienst.ts'), 'utf8');
p('Der Knopf prüft den Rückgabewert, nicht die blosse Rückkehr',
  /\.then\(\(gut: unknown\) => fertig\(gut !== false\)\)/.test(dienstTs));

console.log('\n2 · Der KI-Agent zählt Gefülltes, nicht Angefasstes (A3)');

const kiZaehlt = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'KI-Zählung' });
  const db = Store.addDatabase(s.id, 'Zaehlprobe', {
    title: { name: 'Titel', type: 'title' },
    zus:   { name: 'Kurz',  type: 'text' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  const z1 = Store.addRow(c.id, { title: 'Eins' });
  const echt = (KI as any).frageKurz;

  (KI as any).frageKurz = async () => 'Eine Antwort';
  const voll = await (Datenbank as any).kiFeldFuellenFuer(z1, 'zus', c);
  const wert1 = Store.getBlock(z1.id)?.props?.zus;

  (KI as any).frageKurz = async () => '';
  const leer2 = await (Datenbank as any).kiFeldFuellenFuer(z1, 'zus', c);
  const wert2 = Store.getBlock(z1.id)?.props?.zus;

  let geworfen = false, zelle3 = '';
  (KI as any).frageKurz = async () => { throw new Error('KI weg'); };
  try { await (Datenbank as any).kiFeldFuellenFuer(z1, 'zus', c); }
  catch { geworfen = true; zelle3 = Store.getBlock(z1.id)?.props?.zus; }

  (KI as any).frageKurz = echt;
  return { voll, wert1, leer2, wert2, geworfen, zelle3 };
});
const kz = kiZaehlt as any;
gleich('Eine echte Antwort zählt als gefüllt', kz.voll, true);
gleich('… und steht in der Zelle', kz.wert1, 'Eine Antwort');
gleich('Eine leere Antwort zählt NICHT', kz.leer2, false);
gleich('… die Zelle sagt es ehrlich', kz.wert2, '(keine Antwort)');
gleich('Ein KI-Fehler wird geworfen, nicht verbucht', kz.geworfen, true);
gleich('… und die Zelle bleibt nicht auf „denkt nach" stehen', kz.zelle3, '(Fehler)');

console.log('\n3 · Die Worte stimmen wieder (A4, A5, D10)');

const schaleTs = fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf8');
p('Der Fortschritts-Toast sagt „Geprüft", nicht „Gesichert" (A4)',
  /UI\.toast\('Geprüft: ' \+ name\.replace/.test(schaleTs) &&
  !/UI\.toast\('Gesichert: ' \+ name\.replace/.test(schaleTs));

/* Der Verschlüsseln-Dialog, wirklich geöffnet. */
const dialogText = await seite.evaluate(() => {
  (Krypto as any).dialog();
  const o = document.querySelector('.overlay');
  const text = o?.textContent || '';
  o?.remove();
  return text;
});
p('Der Dialog verspricht nicht mehr „den ganzen Bestand" (A5)',
  !/Der ganze Bestand/.test(String(dialogText)));
p('… sondern sagt, dass Anhänge fehlen und wo sie hingehören',
  /Dateianhänge/.test(String(dialogText)) && /\.redion/.test(String(dialogText)),
  String(dialogText).slice(0, 200));

const mailTs = fs.readFileSync(path.join(WURZEL, 'src/bereiche/verbinden/mail.ts'), 'utf8');
p('Die E-Taste wartet auf Gmail, bevor die Zeile verschwindet (D10)',
  /if \(taste === 'e'\) await archivieren\(r\.props\.mid\);/.test(mailTs));
p('… und `versuche()` schluckt dort nichts mehr',
  !/versuche\(\(\) => archivieren/.test(mailTs));
p('Eine .eml-Mail sagt „nur hier", statt so zu tun, als ginge es an Gmail',
  /nur hier — hinter dieser Mail steht kein Gmail-Konto/.test(mailTs));

console.log('\n4 · Die Schublade endet am Bildschirmrand (A6)');

const handy = await browser.newPage({ viewport: { width: 390, height: 844 } });
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2200);
const schublade = await handy.evaluate(() => {
  document.body.classList.add('side-offen');
  const sb = document.getElementById('sidebar');
  if (!sb) return null;
  const r = sb.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, innen: innerHeight };
});
p('Es gibt die Schublade', schublade !== null);
p('Ihre Unterkante liegt auf dem Rand, nicht darunter',
  !!schublade && (schublade as any).bottom <= (schublade as any).innen + 1,
  JSON.stringify(schublade));
p('… und sie beginnt unter der Kopfzeile, wie immer',
  !!schublade && (schublade as any).top > 0, JSON.stringify(schublade));
await handy.close();

console.log('\n5 · setMeta verschluckt Schreibfehler nicht mehr (D4)');

const meta = await seite.evaluate(async () => {
  const echt = IDBObjectStore.prototype.put;
  (IDBObjectStore.prototype as any).put = function (...a: any[]) {
    if (this.name !== 'meta') return (echt as any).apply(this, a);
    const anfrage: any = { onsuccess: null, onerror: null,
      error: new DOMException('Absichtlich kaputt', 'UnknownError') };
    setTimeout(() => { if (anfrage.onerror) anfrage.onerror({ target: anfrage }); }, 0);
    return anfrage;
  };
  Store.setMeta('probe146', 'wichtig');
  await new Promise(r => setTimeout(r, 300));
  const toast = document.getElementById('toast')?.textContent || '';
  const imSpeicher = Store.getMeta('probe146', '');
  (IDBObjectStore.prototype as any).put = echt;
  return { toast, imSpeicher };
});
p('Der Mensch erfährt es', /Einstellung/.test((meta as any).toast),
  JSON.stringify((meta as any).toast));
gleich('Die Sitzung arbeitet mit dem Wert weiter', (meta as any).imSpeicher, 'wichtig');

const idbTs = fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');
p('Der leere `.catch(() => {})` an setMeta ist weg',
  !/setMeta = \(k: any, v: any\): void => \{ cache\.meta\[k\] = v; put\('meta', \{ k, v \}\)\.catch\(\(\) => \{\}\); \};/.test(idbTs));

console.log('\n6 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 110 — Erfolg heisst: es ist passiert: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
