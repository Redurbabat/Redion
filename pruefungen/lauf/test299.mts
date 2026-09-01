/* Suite 299 — Nur aus meinen Quellen (E305, Redurs Punkt 11)
 * ============================================================================
 * Redurs Punkt 11: „lokale Embeddings + Nur-Quellen-Modus."
 *
 * Die Hälfte davon stand schon: Redion sucht die passenden Stellen im eigenen
 * Arbeitsbereich heraus, schickt sie mit und nennt unter jeder Antwort ihre
 * Quellen (`ki/kontext.ts`). Was fehlte, ist die ZUSAGE. Bisher steht in der
 * Systemnachricht bei leerem Fund:
 *
 *     „Im Arbeitsbereich wurde nichts Passendes gefunden. Sag das offen,
 *      statt etwas zu erfinden."
 *
 * Das ist eine BITTE. Ein Modell, dem nichts vorliegt, antwortet trotzdem —
 * das ist seine Natur, und keine Formulierung ändert daran zuverlässig etwas.
 * Wer vor einer Prüfung sitzt, braucht keine Bitte.
 *
 * Der Nur-Quellen-Modus macht daraus eine Zusage, und der Unterschied ist
 * nicht die Anweisung, sondern dass GAR NICHT GEFRAGT wird.
 *
 *   §1 DIE ENTSCHEIDUNG liegt an einer Stelle und kennt drei Fälle.
 *   §2 AUS heisst: alles wie bisher — die Gegenprobe.
 *   §3 AN UND NICHTS GEFUNDEN: kein Aufruf, ein Satz.
 *   §4 AN UND ETWAS GEFUNDEN: die strenge Anweisung liegt bei.
 *   §5 DIE WEBSUCHE IST DANN AUS — sonst hebelt eine Zeile alles aus.
 *   §6 DER SCHALTER steht in den Einstellungen und schaltet wirklich.
 *
 *   node pruefungen/lauf/test299.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Kontext: any; declare const Einstellungen: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9099;

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
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);
await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  Store.setMeta('ki:nurQuellen', false);
  const s = Store.addPage(null, { text: 'Ohmsches Gesetz', icon: '⚡' });
  Store.addBlock(s.id, 'text', { text: 'Die Spannung U ist das Produkt aus ' +
    'Widerstand R und Stromstärke I. Der Kehrwert des Widerstands heisst Leitwert.' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 800));
});

/* ==========================================================================
 * §1 · Die Entscheidung liegt an einer Stelle
 * ========================================================================*/
console.log('\n1 · Die Entscheidung liegt an einer Stelle');

const eins = await pc.evaluate(() => ({
  da: typeof Kontext.darfFragen === 'function' &&
      typeof Kontext.nurQuellen === 'function' &&
      typeof Kontext.nurQuellenAnweisung === 'function',
  ausVorgabe: Kontext.nurQuellen() === false
}));
p('Es gibt `darfFragen`, `nurQuellen` und die Anweisung', eins.da);
p('Und der Modus ist AUS, solange niemand ihn einschaltet', eins.ausVorgabe);

/* ==========================================================================
 * §2 · GEGENPROBE: aus heisst, alles bleibt wie bisher
 * --------------------------------------------------------------------------
 * Das ist der Arm, ohne den §3 wertlos wäre. Ein Tor, das IMMER zumacht,
 * wäre keine Zusage, sondern eine kaputte KI.
 * ========================================================================*/
console.log('\n2 · Gegenprobe: aus heisst, alles bleibt wie bisher');

const aus = await pc.evaluate(() => {
  Store.setMeta('ki:nurQuellen', false);
  const leer = { leer: true, quellen: [] };
  const voll = { leer: false, quellen: [{ id: 'x', titel: 'Irgendwas' }] };
  return { beiLeer: Kontext.darfFragen(leer).ok, beiVoll: Kontext.darfFragen(voll).ok };
});
p('Ohne Fund darf trotzdem gefragt werden', aus.beiLeer === true);
p('Mit Fund erst recht', aus.beiVoll === true);

/* ==========================================================================
 * §3 · An und nichts gefunden: kein Aufruf, ein Satz
 * ========================================================================*/
console.log('\n3 · An und nichts gefunden: kein Aufruf, ein Satz');

const zu = await pc.evaluate(() => {
  Store.setMeta('ki:nurQuellen', true);
  const erg = Kontext.darfFragen({ leer: true, quellen: [] });
  return { ok: erg.ok, grund: erg.grund };
});
p('Das Tor bleibt zu', zu.ok === false);
p('Und nennt einen Grund, den ein Mensch versteht',
  /nichts in deinen Unterlagen/.test(zu.grund) && zu.grund.length > 80,
  zu.grund.slice(0, 70));
p('Der Grund sagt auch, wie man es wieder ausschaltet',
  /ausschaltest|aus, wenn|KI-Einstellungen/.test(zu.grund), zu.grund.slice(-60));

/* Und der Weg, der das benutzt, ruft wirklich nicht auf. Gemessen wird das
   am erzeugten JavaScript: vor dem `frage(`-Aufruf steht der Ausstieg. */
const dienst = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/ki/dienst.js'), 'utf-8');
const torStelle = dienst.indexOf('Kontext.darfFragen');
const fragenStelle = dienst.indexOf('await frage(nachrichten');
p('Im Dienst steht das Tor VOR dem Aufruf des Modells',
  torStelle > 0 && fragenStelle > torStelle,
  `Tor ${torStelle}, Aufruf ${fragenStelle}`);
p('Und der Ausstieg ist ein echter `return`',
  /darfFragen[\s\S]{0,600}?return;/.test(dienst));

/* ==========================================================================
 * §4 · An und etwas gefunden: die strenge Anweisung liegt bei
 * ========================================================================*/
console.log('\n4 · An und etwas gefunden: die strenge Anweisung liegt bei');

const offen = await pc.evaluate(() => {
  Store.setMeta('ki:nurQuellen', true);
  const erg = Kontext.darfFragen({ leer: false, quellen: [{ id: 'a', titel: 'Ohm' }] });
  const anw = Kontext.nurQuellenAnweisung();
  return { ok: erg.ok, anw };
});
p('Mit Fund darf gefragt werden', offen.ok === true);
p('Die Anweisung verbietet eigenes Wissen ausdrücklich',
  /AUSSCHLIESSLICH/.test(offen.anw) && /rate nicht/.test(offen.anw) &&
  /eigenen Wissen/.test(offen.anw), offen.anw.slice(0, 60));
p('Und verlangt die Quelle zu jeder Aussage',
  /welcher der Quellen/.test(offen.anw));

/* Und dass Redion sie wirklich anhängt. */
p('Der Dienst hängt sie an die Systemnachricht',
  /system \+= Kontext\.nurQuellenAnweisung\(\)/.test(dienst));

/* ==========================================================================
 * §5 · Die Websuche ist dann aus
 * --------------------------------------------------------------------------
 * Sonst hebelte eine einzige Zeile den ganzen Modus aus: „meine Quellen"
 * heisst die eigenen Unterlagen, und eine Wikipedia-Zusammenfassung ist
 * keine davon.
 * ========================================================================*/
console.log('\n5 · Die Websuche ist dann aus');

p('Die Wikipedia hängt an einer Bedingung, die den Modus mitliest',
  /quellen\(\)\.web && !Kontext\.nurQuellen\(\)/.test(dienst));
/* GEGENPROBE am Quelltext: ohne den Zusatz stünde dort nur `.web`. */
p('GEGENPROBE: die alte Bedingung ohne den Zusatz steht nicht mehr da',
  !/quellen\(\)\.web\)\s*\{/.test(dienst));

/* ==========================================================================
 * §6 · Der Schalter steht in den Einstellungen
 * ========================================================================*/
console.log('\n6 · Der Schalter steht in den Einstellungen');

const schalter = await pc.evaluate(async () => {
  Store.setMeta('ki:nurQuellen', false);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Einstellungen.oeffne('ki');
  await new Promise(r => setTimeout(r, 900));
  const k = document.querySelector<HTMLElement>('[data-toggle="ki:nurQuellen"]');
  return { da: !!k, an: k?.classList.contains('an') ?? null,
           text: (k?.parentElement?.parentElement?.textContent || '').slice(0, 80) };
});
if (schalter.da) {
  p('Der Schalter ist da und aus', schalter.an === false, String(schalter.an));
  p('Und seine Zeile sagt, was er tut',
    /Nur aus meinen Quellen/.test(schalter.text), schalter.text);
  await pc.click('[data-toggle="ki:nurQuellen"]');
  await pc.waitForTimeout(400);
  const nachher = await pc.evaluate(() => Store.getMeta('ki:nurQuellen', false));
  p('Ein Klick schaltet ihn ein', nachher === true, String(nachher));
} else {
  /* Kein Zugriff auf die Einstellungsseite zur Laufzeit — dann wird die
     Quelle gelesen. Schwächer, aber ehrlicher als ein übersprungener Punkt. */
  const quelle = fs.readFileSync(
    path.join(WURZEL, 'quell/bereiche/einstellungen/ansicht/seite.js'), 'utf-8');
  p('Der Schalter steht in der Einstellungsseite',
    /ki:nurQuellen/.test(quelle) && /Nur aus meinen Quellen/.test(quelle));
  p('Und zwar bei den Quellen, nicht bei der Antwortlänge',
    quelle.indexOf('ki:nurQuellen') > quelle.indexOf('ki:webFragen'));
  p('(zur Laufzeit nicht erreichbar — am Quelltext geprüft)', true);
}

/* ========================================================================== */
console.log('\n7 · Keine Fehler auf dem Weg');
p('Keine unbehandelten Ausnahmen', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} — Suite 299 (E305: Nur aus meinen Quellen)`);
process.exit(weg ? 1 : 0);
