/* Suite 202 — Eine Erinnerung, die man schon kennt (E184)
 * ============================================================================
 * „kannst du die ‚1 Karte ist fällig'-Meldung weg machen, das kommt immer."
 *
 * Sie kam wirklich immer: bei jedem Öffnen und bei jedem Neuladen, 1,8
 * Sekunden nach dem Start, quer über den unteren Bildschirmrand — auch über
 * einen gerade geöffneten Dialog. Wer an Redion arbeitet, sah sie vierzigmal
 * am Tag, und der einzige Ausweg war, die ganze Meldung abzuschalten.
 *
 * Der Schalter dafür ist richtig und bleibt. Falsch war die Häufigkeit: eine
 * Erinnerung, die man schon kennt, ist keine Erinnerung mehr, sondern Lärm —
 * und Lärm bringt einen dazu, auch das Nützliche abzuschalten.
 *
 * Diese Suite hält drei Dinge fest:
 *   · beim ERSTEN Mal am Tag kommt sie
 *   · beim zweiten Mal am selben Tag nicht mehr
 *   · und der Merker wird NUR gesetzt, wenn wirklich etwas zu melden war
 *
 * Der dritte ist der, den man leicht falsch baut: ein Start um 8 Uhr ohne
 * fällige Karten dürfte die Meldung um 14 Uhr nicht verschlucken.
 *
 *   node pruefungen/lauf/test236.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const Einstellungen: any; declare const Werkzeuge: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8995;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
/* EIN Kontext, mehrere Seiten — `newPage()` am Browser öffnet einen NEUEN
   Kontext mit eigener IndexedDB, und dann misst man Playwrights Trennung
   statt Redions Merker. */
const kontext = await browser.newContext();
const seite = await kontext.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Fällige Karten herstellen, damit es überhaupt etwas zu melden gibt.
   Nachgesehen in `Werkzeuge.faellig`: eine Karte ohne `sr` gilt als fällig. */
const wieViele = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta('neuerungenGesehen', 99);
  const s = Store.addPage(null, { text: 'Karten für die Prüfung' });
  Store.addBlock(s.id, 'flashcard', { text: 'Frage eins', rueck: 'Antwort eins' });
  Store.addBlock(s.id, 'flashcard', { text: 'Frage zwei', rueck: 'Antwort zwei' });
  return Werkzeuge.faellig().length;
});
p('Es gibt fällige Karten — sonst misst der Rest nichts', wieViele > 0, String(wieViele));

/* ==========================================================================
 * §1 · Die Einstellung gibt es weiterhin — und sie wird HIER eingeschaltet
 * --------------------------------------------------------------------------
 * DIE VORGABE IST SEIT E409 AUS, und das ist Redurs Entscheidung: „mache die
 * 1 kqrt ist fählig komplet weg". Der Streifen stand bei jedem ersten Start
 * des Tages unten in der Mitte — auch über jedem Bildschirmfoto.
 *
 * Diese Suite prüft aber nicht die VORGABE, sondern die FUNKTION: kommt die
 * Meldung einmal am Tag und nicht öfter. Also schaltet sie den Schalter
 * ausdrücklich ein, statt sich auf einen Vorgabewert zu verlassen.
 *
 * Vorher stand hier `Einstellungen.V('kartenMelden', true)` — der Prüflauf
 * brachte seine EIGENE Vorgabe mit und hielt den Schalter deshalb für an,
 * während der Code ihn längst für aus hielt. Der Punkt blieb grün, die vier
 * darunter wurden rot, und die Meldung „ist '', soll '2026-09-05'" sah aus
 * wie ein kaputter Merker statt wie eine geänderte Vorgabe.
 *
 * Dass die Vorgabe AUS ist, prüft `test404 §7` — dort gehört es hin. */
console.log('\n1 · Die Einstellung gibt es weiterhin');

await seite.evaluate(() => { Store.setMeta('kartenMelden', true); });
const schalter = await seite.evaluate(() => ({
  an: Einstellungen.V('kartenMelden', false),
  text: [...document.querySelectorAll('*')].length > 0
}));
p('Der Schalter „kartenMelden" lässt sich einschalten', schalter.an === true,
  String(schalter.an));
void schalter.text;

/* ==========================================================================
 * §2 · Beim ersten Mal am Tag kommt sie
 * ========================================================================*/
console.log('\n2 · Beim ersten Mal am Tag kommt sie');

const heute = new Date().toISOString().slice(0, 10);
/* Der Merker wird beim Laden oben schon gesetzt worden sein — für eine
   saubere Messung wird er gelöscht und `start()` neu angestossen. */
const ersteRunde = await seite.evaluate(async () => {
  Store.setMeta('kartenGemeldet', '');
  { const t2 = document.getElementById('toast');
      if (t2) { t2.classList.remove('show'); t2.textContent = ''; } }
  Einstellungen.start();
  await new Promise(f => setTimeout(f, 2200));
  return {
    merker: Store.getMeta('kartenGemeldet', ''),
    streifen: (() => { const t2 = document.getElementById('toast');
      return t2 && t2.classList.contains('show') ? (t2.textContent || '') : ''; })()
  };
});
gleich('Der Merker trägt das heutige Datum', ersteRunde.merker, heute);
p('Der Streifen ist da und nennt die Zahl',
  /Karteikarte(n)? (ist|sind) fällig/.test(ersteRunde.streifen),
  JSON.stringify(ersteRunde.streifen));
p('… und die Zahl stimmt', new RegExp('🎴 ' + wieViele + ' ').test(ersteRunde.streifen),
  ersteRunde.streifen + ' / faellig=' + wieViele);

/* ==========================================================================
 * §3 · Beim zweiten Mal am selben Tag nicht mehr — das war die Bitte
 * ========================================================================*/
console.log('\n3 · Beim zweiten Mal am selben Tag nicht mehr');

const zweiteRunde = await seite.evaluate(async () => {
  { const t2 = document.getElementById('toast');
      if (t2) { t2.classList.remove('show'); t2.textContent = ''; } }
  Einstellungen.start();
  await new Promise(f => setTimeout(f, 2200));
  return (() => { const t2 = document.getElementById('toast');
      return t2 && t2.classList.contains('show') ? (t2.textContent || '') : ''; })();
});
p('Kein zweiter Streifen am selben Tag',
  !/Karteikarte/.test(zweiteRunde), JSON.stringify(zweiteRunde));

/* Und über einen echten Neustart der Seite, nicht nur über `start()` —
   das ist der Fall, über den sich beschwert wurde. */
await seite.reload();
await seite.waitForTimeout(3200);
const nachNeuladen = await seite.evaluate(() => {
  const t2 = document.getElementById('toast');
  return t2 && t2.classList.contains('show') ? (t2.textContent || '') : '';
});
p('Auch nach echtem Neuladen kein Streifen',
  !/Karteikarte/.test(nachNeuladen), JSON.stringify(nachNeuladen));

/* ==========================================================================
 * §4 · Ein neuer Tag meldet wieder
 * ========================================================================*/
console.log('\n4 · Ein neuer Tag meldet wieder');

const morgen = await seite.evaluate(async () => {
  Store.setMeta('kartenGemeldet', '2020-01-01');   /* „gestern" */
  { const t2 = document.getElementById('toast');
      if (t2) { t2.classList.remove('show'); t2.textContent = ''; } }
  Einstellungen.start();
  await new Promise(f => setTimeout(f, 2200));
  return {
    merker: Store.getMeta('kartenGemeldet', ''),
    streifen: (() => { const t2 = document.getElementById('toast');
      return t2 && t2.classList.contains('show') ? (t2.textContent || '') : ''; })()
  };
});
p('Nach einem Tageswechsel kommt sie wieder',
  /Karteikarte(n)? (ist|sind) fällig/.test(morgen.streifen),
  JSON.stringify(morgen.streifen));
gleich('Und der Merker steht wieder auf heute', morgen.merker, heute);

/* ==========================================================================
 * §5 · Ohne fällige Karten wird KEIN Merker gesetzt
 * ------------------------------------------------------------------------
 * Der Fall, den man leicht falsch baut: würde der Merker unbedingt gesetzt,
 * verschlucke ein Start um 8 Uhr ohne fällige Karten die Meldung um 14 Uhr.
 * ========================================================================*/
console.log('\n5 · Ohne fällige Karten kein Merker');

const ohne = await seite.evaluate(async () => {
  /* Alle Karten in den Papierkorb — dann ist nichts mehr fällig. */
  const karten = Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b.type === 'flashcard' && b.alive !== false);
  karten.forEach((k: any) => Store.trashBlock(k.id));
  Store.setMeta('kartenGemeldet', '');
  { const t2 = document.getElementById('toast');
      if (t2) { t2.classList.remove('show'); t2.textContent = ''; } }
  Einstellungen.start();
  await new Promise(f => setTimeout(f, 2200));
  return {
    faellig: Werkzeuge.faellig().length,
    merker: Store.getMeta('kartenGemeldet', ''),
    streifen: (() => { const t2 = document.getElementById('toast');
      return t2 && t2.classList.contains('show') ? (t2.textContent || '') : ''; })()
  };
});
gleich('Jetzt ist nichts mehr fällig', ohne.faellig, 0);
p('Kein Streifen', !/Karteikarte/.test(ohne.streifen), JSON.stringify(ohne.streifen));
gleich('Und der Merker bleibt leer — der Tag ist nicht verbraucht', ohne.merker, '');

/* ==========================================================================
 * §6 · Wer die Meldung abschaltet, bekommt sie auch am ersten Tag nicht
 * ========================================================================*/
console.log('\n6 · Der Schalter sperrt weiterhin');

const aus = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Noch mehr Karten' });
  Store.addBlock(s.id, 'flashcard', { text: 'Frage drei', rueck: 'Antwort drei' });
  Einstellungen.S('kartenMelden', false);
  Store.setMeta('kartenGemeldet', '');
  { const t2 = document.getElementById('toast');
      if (t2) { t2.classList.remove('show'); t2.textContent = ''; } }
  Einstellungen.start();
  await new Promise(f => setTimeout(f, 2200));
  return {
    faellig: Werkzeuge.faellig().length,
    merker: Store.getMeta('kartenGemeldet', ''),
    streifen: (() => { const t2 = document.getElementById('toast');
      return t2 && t2.classList.contains('show') ? (t2.textContent || '') : ''; })()
  };
});
p('Es wäre etwas zu melden — sonst misst dieser Abschnitt nichts', aus.faellig > 0, String(aus.faellig));
p('Ausgeschaltet kommt nichts', !/Karteikarte/.test(aus.streifen), JSON.stringify(aus.streifen));
gleich('Und der Merker wird nicht verbraucht', aus.merker, '');

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
