/* Suite 200 — Dieselbe Rechtefrage, einmal beantwortet (L50, E181)
 * ============================================================================
 * `Arbeitswelt` und `Lebensbereiche` zeigen dieselben Aufgaben, Dateien und
 * Seiten aus zwei Richtungen. E169 hat gemessen, dass sie dasselbe sagen —
 * bis auf einen Fall, der eine ganze Ansicht leer machte.
 *
 * Beim Nachsehen für L50 stellte sich heraus: die RECHTEFRAGE stand zweimal
 * da, in zwei Funktionen mit demselben Namen und zwei Antworten:
 *
 *     arbeitswelt     pageId ? Konten.darf(a, pageId) : Konten.darf(a)
 *     lebensbereiche  !!pageId && Konten.darf(a, pageId)
 *
 * Bei leerer Seitenkennung sagte die eine „frag den Arbeitsbereich" und die
 * andere „nein". Das ist L34 in Reinform: ein Wert an zwei Stellen, nichts
 * erzwingt Gleichheit, die Abweichung sieht man erst spät — und hier hiesse
 * „spät": ein Block ist in der einen Ansicht sichtbar und in der anderen
 * nicht, und niemand weiss warum.
 *
 * Diese Suite hält die EINE Antwort fest — und dass beide Module sie
 * benutzen.
 *
 *   node pruefungen/lauf/test234.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8991;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* ==========================================================================
 * §1 · Es gibt sie, und sie ist erreichbar
 * ========================================================================*/
console.log('\n1 · Es gibt sie, und sie ist erreichbar');

const da = await seite.evaluate(() => ({
  modul: typeof Lesefrage !== 'undefined',
  aktiv: typeof Lesefrage !== 'undefined' && typeof Lesefrage.aktiv === 'function',
  erlaubt: typeof Lesefrage !== 'undefined' && typeof Lesefrage.erlaubt === 'function',
  /* Und die Feldrechte gibt es weiterhin — beim ersten Anlauf wurde ihre
     Datei überschrieben, weil sie auch `rechte.ts` heisst. */
  feldrechte: typeof Feldrechte !== 'undefined'
}));
p('`Lesefrage` ist geladen', da.modul);
p('Und bietet `aktiv` und `erlaubt`', da.aktiv && da.erlaubt);
p('Und `Feldrechte` gibt es unverändert daneben', da.feldrechte);

/* ==========================================================================
 * §2 · Was „aktiv" wirklich heisst
 * --------------------------------------------------------------------------
 * EIN ERSTER ANLAUF WOLLTE `Konten` DURCH EINE ATTRAPPE ERSETZEN und mass
 * damit nichts: `Konten` ist ein `const` auf oberster Ebene, und
 * `window.Konten = …` legt sich nur daneben. `typeof Konten` sieht weiter
 * das Original.
 *
 * Also wird gemessen, was messbar ist — und dabei kommt heraus, dass „aktiv"
 * nicht heisst „es gibt Konten", sondern „das Modul ist geladen". Das war
 * bei `rechteAktiv` und `rightsActive` schon so; es steht jetzt wenigstens
 * geschrieben.
 * ========================================================================*/
console.log('\n2 · Was „aktiv" wirklich heisst');

const stand = await seite.evaluate(() => ({
  aktiv: Lesefrage.aktiv(),
  kontenDa: typeof Konten !== 'undefined',
  darfDa: typeof Konten !== 'undefined' && typeof Konten.darf === 'function'
}));
gleich('Das Kontenmodul ist geladen', stand.kontenDa, true);
gleich('Und damit gilt die Frage als aktiv', stand.aktiv, stand.darfDa);

/* ==========================================================================
 * §3 · Die eine Regel, an drei Fällen gemessen
 * --------------------------------------------------------------------------
 * Verglichen wird gegen `Konten.darf` selbst — das ist die Instanz, die
 * antwortet, und der Unterschied zwischen ihr und `Lesefrage` ist genau die
 * Regel, um die es geht.
 *
 * DER MITTLERE FALL IST DER, DER DIE LÜCKE AUSMACHT. `Konten.darf(a, '')`
 * fällt auf die OFFENE SEITE zurück — es antwortet über eine Seite, nach
 * der niemand gefragt hat. `Lesefrage` sagt nein und fragt gar nicht erst.
 * ========================================================================*/
console.log('\n3 · Die eine Regel, an drei Fällen gemessen');

const drei = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Eine Seite' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));
  return {
    seite: s.id,
    mitSeite:   [Lesefrage.erlaubt('lesen', s.id), Konten.darf('lesen', s.id)],
    leer:       [Lesefrage.erlaubt('lesen', ''),   Konten.darf('lesen', '')],
    ohne:       [Lesefrage.erlaubt('lesen'),       Konten.darf('lesen')]
  };
});

gleich('Mit Seitenkennung antwortet sie wie `Konten.darf`',
  drei.mitSeite[0], drei.mitSeite[1]);
gleich('Ohne Kennung ebenso — die Werkstattfrage',
  drei.ohne[0], drei.ohne[1]);
gleich('Bei LEERER Kennung sagt sie nein', drei.leer[0], false);
p('Und `Konten.darf` hätte hier über die offene Seite geantwortet',
  drei.leer[1] === true,
  'Konten.darf(lesen, "") = ' + drei.leer[1] +
  ' — genau der Unterschied, um den es geht');

/* ==========================================================================
 * §4 · Und beide Module benutzen sie
 * --------------------------------------------------------------------------
 * Ohne diesen Abschnitt bewiese alles davor nur, dass es die Funktion gibt.
 * Gemessen wird am Quelltext: keine eigene Fassung mehr, sondern der Aufruf.
 * ========================================================================*/
console.log('\n4 · Und beide Module benutzen sie');

const lies = (p2: string) => fs.readFileSync(path.join(WURZEL, p2), 'utf8');
const arbeit = lies('src/bereiche/wissen/arbeitswelt.ts');
const leben  = lies('src/bereiche/wissen/lebensbereiche.ts');

p('Die Arbeitswelt fragt `Lesefrage`', /Lesefrage\.erlaubt/.test(arbeit));
p('Die Lebensbereiche auch', /Lesefrage\.erlaubt/.test(leben));
p('Und keiner schreibt die Regel noch einmal ab',
  !/Konten\.darf\(aktion/.test(arbeit) && !/Konten\.darf\(aktion/.test(leben),
  'eine eigene Fassung der Rechtefrage im Modul');
/* Und der Quelltext der einen Fassung sagt, was er tut. */
const quelle = lies('src/kern/zugang/lesefrage.ts');
p('Die eine Fassung unterscheidet leer und weggelassen',
  /pageId === undefined/.test(quelle) && /!!pageId/.test(quelle));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
