/* Suite 291 — Zwei stumme Stellen sagen jetzt etwas (E295)
 * ============================================================================
 * Zwei Dinge waren gebaut, geprüft und richtig — und schlugen im Alltag
 * trotzdem nie an, weil niemand sie rief bzw. anzeigte.
 *
 * L104 PUNKT 2 · `KiBuch.laufBeginnen()` wurde nie gerufen.
 * `KiBuch` führt vier Grenzen: je Aufruf, je Lauf, je Tag, je Monat. Die
 * zweite war die einzige, die im Alltag nie anschlug — `laufStand` begann
 * beim Laden der Seite bei null und lief dann durch, weil niemand ihn
 * zurücksetzte. Sie FUNKTIONIERTE (test281 §3 misst das); sie hatte nur nie
 * einen Anfang. Der Anfang ist jetzt der Start der Agentenschleife.
 *
 * L106 PUNKT 7 · Der Kalender-Hinweis erreichte die Oberfläche nicht.
 * Seit E290 trägt jeder Termin `regelUnklar`, wenn an seiner
 * Wiederholungsregel etwas nicht gelesen werden konnte. Angezeigt wurde es
 * nirgends — und ein Hinweis, den niemand sieht, ist derselbe Stillstand wie
 * vorher.
 *
 *   §1 LAUFBEGINNEN setzt den Laufstand wirklich zurück.
 *   §2 UND WIRD IM ECHTEN LAUF GERUFEN — nicht nur im Prüflauf.
 *   §3 DER KALENDER-HINWEIS wird gesammelt und EINMAL gesagt.
 *   §4 GEGENPROBE: eine gewöhnliche Regel meldet nichts.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §2 war vor E295 rot: kein einziger Aufruf von `laufBeginnen` stand
 * ausserhalb von `buch.ts`. §4 ist die Gegenprobe zu §3 — ein Hinweis, der
 * bei jedem Kalender erscheint, wird nach dem dritten Mal nicht mehr gelesen,
 * und genau diese Falle hat diese Woche fünfmal zugeschnappt (E284, E286,
 * E288, E289, E290).
 *
 *   node pruefungen/lauf/test291.mts
 * ==========================================================================*/
declare const KiBuch: any; declare const Wiederholung: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9077;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof (globalThis as any).KiBuch !== 'undefined' &&
        typeof (globalThis as any).Wiederholung !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1200);

/* ------------------------------------------------------------------------ */
console.log('\n1 · laufBeginnen setzt den Laufstand zurück');

const stand = await seite.evaluate(() => {
  KiBuch.laufBeginnen();
  const amAnfang = KiBuch.laufAusgabe();
  /* `buchen(modell, anbieter, tokenEin, tokenAus)` — die Reihenfolge steht
     in `buch.ts:124`, geraten hatte ich ein Objekt. Der Betrag kommt aus
     `KiKosten.schaetzen`, also muss das Modell eines sein, das der Preisplan
     kennt — sonst ist `bekannt` falsch und der Betrag null. */
  KiBuch.buchen('gpt-4o-mini', 'openai', 100000, 50000);
  const nachEiner = KiBuch.laufAusgabe();
  KiBuch.buchen('gpt-4o-mini', 'openai', 100000, 50000);
  const nachZwei = KiBuch.laufAusgabe();
  KiBuch.laufBeginnen();
  const nachRuecksetzen = KiBuch.laufAusgabe();
  return { amAnfang, nachEiner, nachZwei, nachRuecksetzen };
}) as any;

gleich('Am Anfang steht der Laufstand auf null', stand.amAnfang, 0);
p('Eine Buchung hebt ihn', stand.nachEiner > 0, String(stand.nachEiner));
p('Eine zweite hebt ihn weiter', stand.nachZwei > stand.nachEiner,
  `${stand.nachEiner} → ${stand.nachZwei}`);
gleich('Und `laufBeginnen` setzt ihn wieder auf null', stand.nachRuecksetzen, 0);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Und wird im ECHTEN Lauf gerufen, nicht nur hier');

/* GEMESSEN WIRD AM ERZEUGTEN JAVASCRIPT, nicht an der Quelle: der Browser
   lädt `quell/`, und eine Zeile, die nur in `src/` steht, wirkt nicht. */
const agenten = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/ki/agenten.js'), 'utf-8');
p('Die Agentenschleife ruft `laufBeginnen`',
  /KiBuch\.laufBeginnen\s*\(\s*\)/.test(agenten),
  'kein Aufruf in quell/bereiche/ki/agenten.js');

/* Und ausserhalb von `buch.ts` überhaupt — die eigentliche Behauptung von
   L104 Punkt 2 war „wird NIRGENDS gerufen". */
const quellDateien = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? quellDateien(path.join(dir, e.name))
    : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []);
const rufer = quellDateien(path.join(WURZEL, 'quell'))
  .filter(f => !f.endsWith('ki/buch.js'))
  .filter(f => /laufBeginnen\s*\(/.test(fs.readFileSync(f, 'utf-8')))
  .map(f => path.relative(WURZEL, f));
p('Es gibt mindestens einen Rufer ausserhalb von buch.js',
  rufer.length >= 1, rufer.join(', ') || 'keiner');

/* ------------------------------------------------------------------------ */
console.log('\n3 · Der Kalender-Hinweis wird gesammelt und einmal gesagt');

/* Gemessen an der Quelle des Kerns: `regelUnklar` entsteht dort, und die
   Anzeige liest genau dieses Feld. Der Kern selbst ist rein und braucht
   keinen Kalenderdienst. */
const unklar = await seite.evaluate(() => {
  /* `ausrollen(start, rrule, opt)` — drei Argumente, kein Objekt; und das
     Feld heisst `nichtVerstanden`, nicht `unklar` (`wiederholung.ts:246`).
     `jetzt` wird mitgegeben, sonst hinge der Abschnitt am Kalender des
     Rechners: `bisTage` zählt von JETZT, und ein Start in der Vergangenheit
     ergäbe je nach Datum eine andere Zahl. */
  const jetzt = Date.parse('2026-09-01T00:00:00Z');
  const mit = Wiederholung.ausrollen('20260901T080000',
    'FREQ=WEEKLY;BYDAY=MO;BYHOUR=9', { bisTage: 30, jetzt });
  const ohne = Wiederholung.ausrollen('20260901T080000',
    'FREQ=WEEKLY;BYDAY=MO', { bisTage: 30, jetzt });
  return { mitUnklar: mit.nichtVerstanden || [], ohneUnklar: ohne.nichtVerstanden || [],
           mitZahl: (mit.termine || []).length, ohneZahl: (ohne.termine || []).length };
}) as any;

p('Eine Regel mit unbekanntem Teil meldet ihn beim Namen',
  unklar.mitUnklar.some((x: string) => /BYHOUR/i.test(String(x))),
  JSON.stringify(unklar.mitUnklar));
p('Und liefert trotzdem Termine — kein Totalausfall',
  unklar.mitZahl > 0, String(unklar.mitZahl));

/* Dass der Hinweis auch WIRKLICH ANGEZEIGT wird, steht in der erzeugten
   Kalenderdatei: ohne diese Zeile bliebe er ein Feld, das niemand liest. */
const kalender = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/verbinden/kalender.js'), 'utf-8');
p('Der Kalender zeigt den Hinweis wirklich an',
  /regelUnklar/.test(kalender) && /UI\.banner/.test(kalender),
  'kein regelUnklar/UI.banner in quell/bereiche/verbinden/kalender.js');
/* Gesucht wird das Muster, nicht eine Zeilennummer: eine Menge anlegen,
   `regelUnklar` hineinschütten, dann EIN Banner. `regelUnklar` steht auch
   weiter oben in der Datei (dort ENTSTEHT es), deshalb wird ab dem `new Set`
   gelesen und nicht ab dem ersten Vorkommen. */
const abSet = kalender.slice(kalender.lastIndexOf('new Set'));
p('Und sagt ihn EINMAL, nicht je Termin — gesammelt in einer Menge',
  /regelUnklar/.test(abSet.slice(0, 600)) && /UI\.banner/.test(abSet.slice(0, 1200)),
  abSet.slice(0, 200).replace(/\s+/g, ' '));

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: eine gewöhnliche Regel meldet nichts');

gleich('Eine Regel ohne unbekannte Teile ist still', unklar.ohneUnklar, []);
p('Und liefert dieselben Termine', unklar.ohneZahl > 0, String(unklar.ohneZahl));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
