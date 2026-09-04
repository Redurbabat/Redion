/* Suite 55 — Ein Anführungszeichen im Text darf kein Attribut werden
 * ----------------------------------------------------------------------------
 * WAS HIER GEFUNDEN WURDE, und warum es keiner der 59 anderen Läufe bemerkt
 * hat: die App baut ihre Oberfläche fast überall aus Zeichenketten und setzt
 * sie mit `innerHTML` ein. Dabei geht der Text des Nutzers durch ein `esc` —
 * jedes Modul hat sein eigenes, fünfzig Stück insgesamt.
 *
 * **Zwanzig davon liessen das Anführungszeichen durch.** Sie ersetzten `&`,
 * `<` und `>`, aber nicht `"`. Das ist harmlos, solange der Text zwischen zwei
 * Marken steht. Es ist nicht harmlos, sobald er in einem Attribut landet — und
 * das tat er an 41 Stellen:
 *
 *     `<input value="${esc(block.text)}">`
 *
 * Wer einen Knopf so beschriftet:
 *
 *     " onfocus="…" autofocus="
 *
 * schliesst damit `value` und schreibt zwei eigene Attribute dahinter. Der
 * Browser sieht kein `<script>` — er sieht ein gültiges `onfocus` und führt es
 * aus, sobald das Feld den Fokus bekommt. Nachgestellt und bestätigt: der
 * Handler lief.
 *
 * DAS IST IN EINER APP OHNE SERVER KEIN KLEINES PROBLEM, sondern ein grösseres
 * als anderswo. Der Text kommt aus einer eingelesenen Markdown-Datei, aus einer
 * geteilten Seite, aus dem Abgleich mit dem freiwilligen Server oder aus dem
 * Clipper. Und was der eingeschleuste Handler erreicht, ist alles: die Notizen
 * liegen im selben Fenster, der KI-Schlüssel im selben `localStorage`.
 *
 * `quell/kern/sicherheit/saeubern.js` hätte das verhindert. Die Datei ist 162
 * Zeilen lang, geprüft, und **wird von keiner einzigen Stelle der App
 * aufgerufen** — nur von ihrem eigenen Prüflauf (test85). Ein Sicherheitsnetz,
 * das niemand aufgehängt hat.
 *
 * DIESER LAUF PRÜFT DAS VERHALTEN, nicht den Quelltext (das tut test87): er
 * legt Seiten und Knöpfe mit Anführungszeichen an, zeichnet sie und sieht im
 * fertigen DOM nach, ob irgendwo ein Ereignis-Attribut steht, das dort nicht
 * hingehört.
 *
 *   node pruefungen/lauf/test90.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 9501;

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.webmanifest': 'application/manifest+json', '.png': 'image/png',
              '.ico': 'image/x-icon' };

const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = _dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !_da(pfad)) { b.writeHead(404); b.end(); return; }
  const endung = pfad.slice(pfad.lastIndexOf('.'));
  b.writeHead(200, { 'Content-Type': TYP[endung] || 'application/octet-stream' });
  b.end(_lies(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: any[] = [];
seite.on('pageerror', e => fehler.push(e.message));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined',
                            null, { timeout: 20000 });

/* Der Text, der die Grenze überschreitet, wenn sie nicht dicht ist. Er trägt
   absichtlich kein `<` — dass `<script>` abgefangen wird, war nie das Problem.
   HIER STAND EIN ECHTER FEHLER: der Umzug hatte `window.` auch INNERHALB dieser
   Zeichenkette zu `(window as any).` gemacht. Das ist Quelltext für den
   Browser, nicht für TypeScript — der eingeschleuste Handler wäre an `as`
   gescheitert, und Abschnitt 4 wäre auch bei einem echten Loch grün geblieben. */
const GIFT = '" onfocus="window.__geerbt=1" onmouseover="window.__geerbt=1" autofocus="';

console.log('\n1 · Ein Seitentitel und Überschriften mit Anführungszeichen');

/* NACHGEMESSEN, statt angenommen: der Seitentitel allein rührt keine der
   Attributstellen an — im Grundzustand zeichnet niemand ihn in ein Attribut.
   Der Abschnitt blieb deshalb auch dann grün, als alle zwanzig Dateien
   zurückgedreht waren. Er prüfte nichts.
   Die beiden Stellen, an denen ein Titel WIRKLICH in einem Attribut landet,
   sind `title="${esc(…)}"` in der Reiterleiste und im Randstreifen. Beide
   zeichnen nur unter Bedingungen — die Reiterleiste, wenn Reiter offen sind,
   der Streifen erst ab drei Überschriften. Also werden beide hergestellt. */
await seite.evaluate((gift) => {
  const p1 = Store.addPage(null, { text: 'Anfang ' + gift + ' Ende' });
  ['h1', 'h2', 'h3'].forEach((t, i) =>
    Store.addBlock(p1.id, t, { text: 'Überschrift ' + i + ' ' + gift }));
  App.oeffne(p1.id);
}, GIFT);
await seite.waitForTimeout(400);

/* Die beiden bedingten Zeichner von Hand anstossen — beide stehen auf der
   öffentlichen Fläche ihres Moduls.
   ECHTER FEHLER, den erst TypeScript sichtbar gemacht hat: hier stand `Reiter`.
   Ein Modul dieses Namens gibt es nicht — die Reiterleiste heisst `Fenster`
   (`src/schale/aufbau/reiter.ts`). `typeof Reiter` war also immer 'undefined',
   die Leiste wurde nie gezeichnet, und die Hälfte dessen, was der Kommentar
   oben verspricht, ist nie geprüft worden. */
await seite.evaluate(() => {
  if (typeof Inhaltsflaeche !== 'undefined') Inhaltsflaeche.streifen();
  if (typeof Fenster !== 'undefined') { Fenster.neuerReiter?.(); Fenster.zeichnen?.(); }
});
await seite.waitForTimeout(300);

p('Der Randstreifen ist wirklich gezeichnet',
  await seite.evaluate(() => !!document.querySelector('#rand-toc [title]')));

const nachHandlern = async () => seite.evaluate(() => {
  const raus: any[] = [];
  document.querySelectorAll('*').forEach(el => {
    for (const a of el.attributes)
      if (/^on/i.test(a.name ?? '')) raus.push(el.tagName.toLowerCase() + '[' + a.name + '="' + a.value + '"]');
  });
  return raus;
});

p('Kein eingeschleustes Ereignis-Attribut im Baum',
  (await nachHandlern()).length === 0, (await nachHandlern()).slice(0, 3).join(' · '));

/* Der Titel muss trotzdem lesbar dastehen — Sicherheit, die den Text
   verstümmelt, ist keine Lösung, sondern Datenverlust. */
const sichtbar = await seite.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('#tree .row span, .crumbs *, #page *')]
    .map(e => e.textContent).join(' '));
p('Das Anführungszeichen steht sichtbar im Titel, unverändert',
  (sichtbar ?? '').includes('" onfocus='), 'gefunden: ' + sichtbar.slice(0, 80));

console.log('\n2 · Ein Knopf, so beschriftet — und sein Einstellfenster');

/* WICHTIG: Der Knopf allein reicht nicht. Seine Beschriftung landet beim
   Zeichnen zwischen zwei Marken, nicht in einem Attribut — dort war nie ein
   Loch. Das Attribut steht im EINSTELLFENSTER:
       `<input id="kt" value="${esc(block.text)}">`
   Beim ersten Schreiben dieses Laufs fehlte das Öffnen, und der Abschnitt
   blieb auch dann grün, als die Lücke absichtlich wieder eingebaut war. Eine
   Prüfung, die nicht rot werden kann, prüft nichts.
   `knopfAusfuehren` öffnet das Fenster von selbst, wenn der Knopf noch keine
   Aktion hat — genau der Weg, den auch ein Mensch nimmt. */
await seite.evaluate(async (gift) => {
  const p2 = Store.addPage(null, { text: 'Knopfseite' });
  const k = Store.addBlock(p2.id, 'button', { text: gift, aktionen: [] });
  App.oeffne(p2.id);
  await Blocks.knopfAusfuehren(Store.getBlock(k.id));
}, GIFT);
await seite.waitForTimeout(500);

p('Das Einstellfenster ist wirklich offen',
  await seite.evaluate(() => !!document.querySelector('#kt')));
p('Auch als Knopf-Beschriftung entsteht kein Attribut',
  (await nachHandlern()).length === 0, (await nachHandlern()).slice(0, 2).join(' · '));
p('Das Feld zeigt die Beschriftung vollständig',
  await seite.evaluate((g) => document.querySelector<HTMLInputElement>('#kt')?.value === g, GIFT));

await seite.evaluate(() => document.querySelector('.overlay')?.remove());

console.log('\n3 · Ein Link, dessen Adresse ein Anführungszeichen enthält');

await seite.evaluate(() => {
  const p3 = Store.addPage(null, { text: 'Linkseite' });
  Store.addBlock(p3.id, 'text',
    { text: '[klick](https://beispiel.ch" onmouseover="window.__geerbt=1' + ')' });
  App.oeffne(p3.id);
});
await seite.waitForTimeout(400);
p('Auch aus einer Markdown-Adresse entsteht kein Attribut',
  (await nachHandlern()).length === 0);

/* Der Beweis, dass der Lauf überhaupt etwas messen kann: alles anfassen,
   worauf ein Handler feuern würde. Bliebe `__geerbt` auch bei einer echten
   Lücke leer, wäre der Lauf wertlos. */
console.log('\n4 · Nichts davon läuft');
await seite.evaluate(() => {
  document.querySelectorAll<HTMLElement>('a, input, button, .ct').forEach(el => {
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    try { el.focus(); } catch {}
  });
});
await seite.waitForTimeout(300);
p('window.__geerbt ist nach Hovern und Fokussieren nicht gesetzt',
  await seite.evaluate(() => (window as any).__geerbt) === undefined);

/* ---------------------------------------------------------------------------
 * 5 · Die Quelle direkt gefragt
 * ---------------------------------------------------------------------------
 * Die Abschnitte darüber prüfen das Ergebnis. Dieser prüft das Werkzeug:
 * `Blocks.esc` und `Blocks.inline` stehen auf der öffentlichen Fläche, also
 * lassen sie sich direkt fragen — ohne den Umweg über ein Fenster, in dem
 * eine dritte Stelle den Fehler zufällig auffangen könnte.
 * ------------------------------------------------------------------------ */
console.log('\n5 · esc und inline direkt gefragt');

const escProbe = await seite.evaluate(() => Blocks.esc('a"b<c>d&e'));
p('esc ersetzt das Anführungszeichen', escProbe === 'a&quot;b&lt;c&gt;d&amp;e',
  'ist: ' + escProbe);

/* HIER WÄRE FAST EINE FALSCHE PRÜFUNG STEHENGEBLIEBEN. Der erste Versuch
   suchte mit /onmouseover=/ im erzeugten Text — und wurde rot, obwohl die
   Ausgabe richtig war: dort steht `onmouseover=&quot;`, also der Wortlaut
   INNERHALB des href-Wertes, harmlos. Ob ein Attribut entsteht, entscheidet
   nicht die Zeichenkette, sondern der Parser. Also wird geparst. */
const linkProbe = await seite.evaluate(() => {
  const d = document.createElement('div');
  d.innerHTML = Blocks.inline('[k](https://a" onmouseover="x' + ')');
  const a = d.querySelector('a');
  return { attribute: a ? [...a.attributes].map(x => x.name) : [],
           href: a?.getAttribute('href'), roh: d.innerHTML };
});
p('Aus der Adresse entsteht kein zweites Attribut',
  !linkProbe.attribute.some(n => /^on/i.test(n)),
  'Attribute: ' + linkProbe.attribute.join(', '));
p('Das Anführungszeichen bleibt im href stehen, statt es zu schliessen',
  linkProbe.href === 'https://a" onmouseover="x', 'ist: ' + linkProbe.href);

const echterLink = await seite.evaluate(() => Blocks.inline('[k](https://beispiel.ch)'));
p('Ein gewöhnlicher Link funktioniert unverändert',
  (echterLink ?? '').includes('href="https://beispiel.ch"'), 'ist: ' + echterLink);

p('Kein JS-Fehler in der Konsole', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();

console.log(`\n  Suite 55 — Anführungszeichen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
