/* Suite 98 — Wem gehört die Taste? Redion gegen Browser und System (L20)
 * ============================================================================
 * `LUECKEN.md` L20 nennt als offen: „Konflikte mit Browser und
 * Betriebssystem systematisch prüfen." Das ist keine Meinungsfrage und
 * auch keine Liste zum Abschreiben — es ist messbar.
 *
 * WIE HIER GEMESSEN WIRD
 *
 *   Ein Tastendruck wird abgeschickt und danach `defaultPrevented`
 *   abgelesen. Ist es `true`, hat Redion die Taste an sich genommen und
 *   der Browser tut sein Übliches nicht. Ist es `false`, gewinnt der
 *   Browser — und wer Strg R in einer Tabelle drückt, um nach rechts zu
 *   füllen, lädt stattdessen die Seite neu.
 *
 *   Das ist etwas anderes, als die Kürzelliste zu zählen. Die Liste sagt,
 *   was gemeint ist. Dieser Lauf sagt, was passiert.
 *
 * DIE DREI GRUPPEN, und warum sie getrennt stehen
 *
 *   MUSS GENOMMEN WERDEN — Redion belegt die Taste, und der Browser täte
 *   sonst etwas Störendes. Strg P druckt sonst, Strg S lädt sonst herunter.
 *
 *   DARF NICHT GENOMMEN WERDEN — Strg C, Strg V, Strg X, Strg A gehören
 *   dem Menschen. Wer sie global abfängt, nimmt ihm das Kopieren aus einem
 *   Textfeld. Diese Gruppe ist die wichtigere von beiden: eine Taste zu
 *   wenig zu nehmen ist ein Ärgernis, eine zu viel ist ein Datenverlust
 *   in Zeitlupe.
 *
 *   KANN NICHT GENOMMEN WERDEN — Strg T und Strg W. Der Browser gibt sie
 *   nicht her, egal was die Seite versucht, und dann geschieht BEIDES:
 *   Redion schliesst seinen Reiter, der Browser das Fenster darüber.
 *   Redion hatte sie gebunden; jetzt liegen seine eigenen Reiter auf
 *   Strg Alt N und Strg Alt W.
 *
 *   Und hier die ehrliche Grenze dieses Laufs: dass der Browser sie nicht
 *   hergibt, kann er NICHT zeigen. Playwright schickt Tastendrücke an die
 *   Seite, nicht an die Browseroberfläche. Also wird nicht bewiesen,
 *   sondern ausgewichen — und §2 hält fest, dass sie wieder frei sind.
 *
 *   node pruefungen/lauf/test134.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8805;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  /* Kein offenes Fenster — sonst antwortet die Fokusfalle statt der App. */
  document.querySelectorAll('.overlay, .menu-grund').forEach(o => o.remove());
});

/**
 * Eine Taste wirklich abschicken und ablesen, wer sie bekommt.
 *
 * NICHT über `keyboard.press`: das erzeugt einen echten Tastendruck, und
 * ob der Browser danach wirklich gedruckt hätte, lässt sich nicht ablesen.
 * Ein gebautes Ereignis trägt `defaultPrevented`, und genau danach wird
 * gefragt — nach der Absicht der App, nicht nach der Reaktion des
 * Browserfensters.
 */
const taste = (k: string, opt: Record<string, boolean> = {}) => seite.evaluate(
  ({ k, opt }) => {
    const e = new KeyboardEvent('keydown', Object.assign({
      key: k, code: 'Key' + k.toUpperCase(),
      ctrlKey: true, bubbles: true, cancelable: true
    }, opt));
    document.body.dispatchEvent(e);
    return e.defaultPrevented;
  }, { k, opt });

console.log('\n1 · Diese nimmt Redion dem Browser ab — und muss es');

const NIMMT: Array<[string, Record<string, boolean>, string]> = [
  ['n', {},              'Neue Seite (Browser: neues Fenster)'],
  ['p', {},              'Suchen (Browser: drucken)'],
  ['k', {},              'Suchen (Browser: Adressleiste in Firefox)'],
  ['j', {},              'KI-Panel (Browser: Downloads)'],
  ['f', {},              'Auf der Seite suchen (Browser: eigene Suche)'],
  ['l', {},              'Link kopieren (Browser: Adressleiste)'],
  ['[', {},              'Zurück'],
  [']', {},              'Vorwärts'],
  ['\\', {},             'Seitenleiste'],
  [',', {},              'Einstellungen'],
  ['l', { shiftKey: true }, 'Hell/Dunkel'],
  ['u', { shiftKey: true }, 'Eine Ebene nach oben (Browser: Quelltext)'],
  ['d', { shiftKey: true }, 'Seite verdoppeln (Browser: Lesezeichen für alle Tabs)'],
  ['b', { shiftKey: true }, 'Papierkorb (Browser: Lesezeichenleiste)'],
  ['o', { shiftKey: true }, 'Was Redion kann (Browser: Datei öffnen)']
];
for (const [k, opt, was] of NIMMT) {
  const genommen = await taste(k, opt);
  p(`Strg${opt['shiftKey'] ? ' Shift' : ''} ${k.toUpperCase()} gehört Redion — ${was}`,
    genommen === true);
}

console.log('\n2 · Und diese lässt sie in Ruhe — die wichtigere Hälfte');
/* Wer Strg C global abfängt, nimmt dem Menschen das Kopieren aus jedem
   Textfeld. Diese vier gehören ihm, und der Editor greift sie nur, wenn
   wirklich Blöcke ausgewählt sind — nicht beim blossen Tippen. */
const RUHE: Array<[string, Record<string, boolean>, string]> = [
  ['c', {}, 'Kopieren'],
  ['v', {}, 'Einfügen'],
  ['x', {}, 'Ausschneiden'],
  ['a', {}, 'Alles markieren'],
  ['r', {}, 'Neu laden — in der Tabelle belegt, aber nicht global'],
  ['s', {}, 'Speichern — Redion speichert von selbst'],
  ['t', {}, 'Neuer Reiter — Redions eigene liegen auf Strg Alt N'],
  ['w', {}, 'Reiter schliessen — Redions eigene auf Strg Alt W']
];
for (const [k, opt, was] of RUHE) {
  const genommen = await taste(k, opt);
  p(`Strg ${k.toUpperCase()} bleibt beim Browser — ${was}`, genommen === false,
    genommen ? 'Redion nimmt sie' : '');
}

console.log('\n2b · Redions eigene Reiter liegen daneben');
/* Gebunden waren sie auf Strg T und Strg W. Der Browser gibt die nicht
   her — `preventDefault` bleibt dort wirkungslos —, also geschah beides:
   Redion schloss seinen Reiter, und der Browser das Fenster darüber.
   Nachweisen lässt sich das hier nicht, weil Playwright Tastendrücke an
   die Seite schickt und nicht an die Browseroberfläche. Also wird nicht
   bewiesen, sondern ausgewichen — und §2 hält fest, dass die zwei wieder
   beim Browser liegen. */
for (const [k, was] of [['n', 'Neuer Reiter'], ['w', 'Reiter schliessen']] as [string, string][]) {
  const genommen = await taste(k, { altKey: true });
  p(`Strg Alt ${k.toUpperCase()} gehört Redion — ${was}`, genommen === true);
}
const uebersichtReiter = await seite.evaluate(() => {
  const g = (Register as any).tasten.alle()
    .find((x: any) => x[0].startsWith('Fenster'));
  return (g?.[1] ?? []).map((x: any) => x[0]);
});
p('Und die Übersicht nennt sie auch so',
  (uebersichtReiter as string[]).includes('Strg Alt N') &&
  (uebersichtReiter as string[]).includes('Strg Alt W'),
  JSON.stringify(uebersichtReiter));
p('… und verspricht Strg T und Strg W nicht mehr',
  !(uebersichtReiter as string[]).some(t => t === 'Strg T' || t === 'Strg W'),
  JSON.stringify(uebersichtReiter));

console.log('\n3 · Ohne Strg passiert nichts von alledem');
/* Ein Handler, der die Umschalttaste vergisst, frisst gewöhnliche
   Buchstaben. Das fällt beim Tippen sofort auf — und wäre trotzdem nicht
   geprüft gewesen. */
for (const k of ['n', 'p', 'k', 'f', 'j']) {
  const genommen = await taste(k, { ctrlKey: false } as any);
  p(`Ein blosses „${k}" wird nicht abgefangen`, genommen === false);
}

console.log('\n4 · Was die Übersicht verspricht, gilt auch');
/* Die Kürzelübersicht ist die Liste, die ein Mensch liest. Wenn sie ein
   Kürzel führt, das nichts tut, ist sie schlimmer als keine Liste. */
const uebersicht = await seite.evaluate(() => {
  const t = (Register as any).tasten;
  const flach = t.flach();
  return {
    anzahl: flach.length,
    /* Die Gruppe „Fenster" sagt ausdrücklich, dass Notion das nur in der
       Desktop-App hat — dort stehen Strg T und Strg W für REDIONS eigene
       Reiter, nicht für die des Browsers. */
    fenstergruppe: t.gruppen().find((g: string) => g.startsWith('Fenster')) ?? '',
    doppelte: t.doppelte(),
    strgR: flach.filter((x: any) => /strg r$/i.test(x.taste)).map((x: any) => x.gruppe)
  };
});
p('Die Übersicht führt über hundert Kürzel',
  Number((uebersicht as any).anzahl) > 120, String((uebersicht as any).anzahl));
p('Innerhalb einer Gruppe ist keine Taste doppelt belegt',
  ((uebersicht as any).doppelte ?? []).length === 0,
  JSON.stringify((uebersicht as any).doppelte).slice(0, 200));
/* Der ehrliche Umgang mit dem, was der Browser nicht hergibt: die Gruppe
   sagt es im Namen, statt es zu verschweigen. */
p('Die Reiter-Gruppe sagt im Namen, dass sie dem Browser gehört',
  /Desktop-App/.test((uebersicht as any).fenstergruppe),
  JSON.stringify((uebersicht as any).fenstergruppe));
/* Strg R darf nur in der Tabelle stehen. Stünde es unter „Allgemein",
   wäre es ein Versprechen, das der Browser bricht. */
p('Strg R steht nur dort, wo eine Tabelle den Fokus hat',
  ((uebersicht as any).strgR ?? []).every((g: string) => /Tabellen/.test(g)),
  JSON.stringify((uebersicht as any).strgR));

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 98 — Wem gehört die Taste: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
