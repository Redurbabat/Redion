/* Suite 323 — Der Merker der Lückenansicht (L105 Punkt 3, E330)
 * ============================================================================
 * L105 sagte: „Die Ansicht rechnet bei jedem Öffnen neu … bei zehntausend
 * Seiten wird es spürbar, und es gibt keinen Fortschrittsbalken. Genau
 * dafür gibt es seit E286 die Auftragsmaschine."
 *
 * GEMESSEN, BEVOR GEBAUT WURDE:
 *
 *     Seiten   sammeln   finden
 *         63     28 ms    12 ms
 *       1763    173 ms    28 ms
 *
 * Sechsundachtzig Prozent liegen im SAMMELN, und 173 ms sind kein Auftrag.
 * Also ein Merker und keine Maschine — die Begründung steht in E330.
 *
 * EIN MERKER IST EINE GEFAHR, KEIN GEWINN, wenn er zu lange hält. Diese
 * Suite misst deshalb vor allem, dass er VERFÄLLT:
 *
 *   §1 ER HÄLT, solange sich nichts ändert.
 *   §2 ER VERFÄLLT bei jeder Art von Änderung — anlegen, ändern, wegwerfen.
 *   §3 UND AUCH DANN, wenn zwei Blöcke in derselben Millisekunde wandern.
 *      Genau dafür steht die Summe im Abdruck.
 *   §4 WAS NICHT GEMERKT WIRD: `erledigt` und die Zeit gehen ins FINDEN,
 *      nicht ins Sammeln — ein gemerkter Befund wäre falsch, sobald ein
 *      Tag vergeht.
 *   §5 UND DER BEFUND BLEIBT RICHTIG: dieselben Funde mit und ohne Merker.
 *
 *   node pruefungen/lauf/test323.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9326;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

const messung = await pc.evaluate(async () => {
  const w = globalThis as any;
  const W = w.Wissensluecken;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());

  /* Ein kleiner Bestand mit allem, was die Lückensuche interessiert. */
  const a = Store.addPage(null, { text: 'Alpha' });
  const b = Store.addPage(null, { text: 'Beta' });
  Store.addBlock(a.id, 'text', { text: 'Siehe [[Beta]] und [[Gamma]]. #alleine' });
  Store.addBlock(b.id, 'text', { text: 'Wie hängt das mit Alpha zusammen?' });
  await Store.flush();

  W.vergessen();

  /* ── §1: hält er? ─────────────────────────────────────────────────────── */
  const eins = W.gesammelt();
  const zwei = W.gesammelt();
  const abdruck1 = W.abdruck();

  /* ── §2: verfällt er? Drei Arten von Änderung. ───────────────────────── */
  Store.updateBlock(a.id, { text: 'Alpha, umbenannt' });
  const nachAendern = W.gesammelt();
  const abdruck2 = W.abdruck();

  const c = Store.addPage(null, { text: 'Gamma' });
  const nachAnlegen = W.gesammelt();
  const abdruck3 = W.abdruck();

  Store.trashBlock(c.id);
  const nachWegwerfen = W.gesammelt();
  const abdruck4 = W.abdruck();

  /* ── §3: zwei Blöcke, dieselbe Millisekunde ──────────────────────────
     Von Hand am Zwischenspeicher gedreht, weil `updateBlock` immer die
     echte Uhr nimmt. Gemessen wird nur `abdruck()`, und der LIEST bloss —
     hier wird also nichts umgangen, sondern eine Lage hergestellt, die im
     Alltag selten und im Abgleich gewöhnlich ist: zwei Blöcke, die im
     selben Zug denselben Stempel bekommen. */
  const alle = Object.keys(Store.cache.blocks);
  const x = alle[0] || '', y = alle[1] || '';
  const bx = Store.cache.blocks[x], by = Store.cache.blocks[y];
  const merkeX = bx.edited, merkeY = by.edited;
  /* Beide auf denselben, ÄLTEREN Stempel: Zahl gleich, Neuester gleich
     (der steht woanders), Summe anders. */
  const alt = new Date(Date.parse(merkeX) - 5000).toISOString();
  bx.edited = alt; by.edited = alt;
  const abdruckGleicheMs = W.abdruck();
  /* Und jetzt EINEN davon um eine Millisekunde vor — Zahl und Neuester
     bleiben, nur die Summe wandert. */
  bx.edited = new Date(Date.parse(alt) + 1).toISOString();
  const abdruckEineMsSpaeter = W.abdruck();
  bx.edited = merkeX; by.edited = merkeY;

  /* ── §4/§5: was NICHT gemerkt wird ───────────────────────────────────── */
  W.vergessen();
  const jetzt = Date.now();
  const kalt = W.befund({ jetzt });
  const warm = W.befund({ jetzt });
  /* Dieselbe Sammlung, aber ein Jahr später — muss andere Funde geben,
     denn „verstaubt" und „Insel" hängen an der Zeit. */
  const spaeter = W.befund({ jetzt: jetzt + 400 * 86400000 });

  return {
    haelt: eins === zwei,
    nachAendernNeu: nachAendern !== eins,
    nachAnlegenNeu: nachAnlegen !== nachAendern,
    nachWegwerfenNeu: nachWegwerfen !== nachAnlegen,
    abdruecke: [abdruck1, abdruck2, abdruck3, abdruck4],
    gleicheMs: abdruckGleicheMs, eineMsSpaeter: abdruckEineMsSpaeter,
    kaltGezaehlt: kalt.gezaehlt, warmGezaehlt: warm.gezaehlt,
    kaltFunde: kalt.funde.length, warmFunde: warm.funde.length,
    spaeterFunde: spaeter.funde.length,
    kaltArten: kalt.funde.map((f: any) => f.art).sort(),
    warmArten: warm.funde.map((f: any) => f.art).sort()
  };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Er hält, solange sich nichts ändert');

/* DASSELBE OBJEKT, nicht nur derselbe Inhalt. Ein Vergleich auf Gleichheit
   des Inhalts wäre auch dann grün, wenn jedes Mal neu gerechnet würde —
   also blind für genau das, was hier gemessen werden soll. */
p('Zweimal gesammelt ergibt dasselbe Objekt', messung.haelt);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Er verfällt bei jeder Art von Änderung');

p('Nach dem Ändern eines Blocks', messung.nachAendernNeu);
p('Nach dem Anlegen einer Seite', messung.nachAnlegenNeu);
p('Nach dem Wegwerfen einer Seite', messung.nachWegwerfenNeu);
/* UND DER ABDRUCK SELBST muss sich jedes Mal bewegen — sonst hinge das
   Verfallen an etwas anderem und die drei Punkte oben wären Zufall. */
const abd = messung.abdruecke;
p('Und jeder Abdruck unterscheidet sich vom vorigen',
  abd[0] !== abd[1] && abd[1] !== abd[2] && abd[2] !== abd[3],
  JSON.stringify(abd));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Auch zwei Blöcke in derselben Millisekunde');

/* DIE SUMME IST DER GRUND. Ohne sie wären diese beiden Abdrücke gleich:
   dieselbe Zahl von Blöcken, derselbe neueste Stempel — und trotzdem hat
   sich einer bewegt. */
p('Ein Block eine Millisekunde weiter ergibt einen anderen Abdruck',
  messung.gleicheMs !== messung.eineMsSpaeter,
  messung.gleicheMs + '  gegen  ' + messung.eineMsSpaeter);
p('Die beiden unterscheiden sich NUR in der Summe',
  messung.gleicheMs.split('|').slice(0, 2).join('|') ===
  messung.eineMsSpaeter.split('|').slice(0, 2).join('|'),
  messung.gleicheMs + '  gegen  ' + messung.eineMsSpaeter);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Was NICHT gemerkt wird');

/* DER BEFUND WIRD NICHT GEMERKT, nur das Sammeln. Ein Jahr später sind
   dieselben Seiten verstaubt, die es heute nicht sind — ein gemerkter
   Befund wäre schlicht falsch. */
p('Ein Jahr später sieht der Befund anders aus',
  messung.spaeterFunde !== messung.kaltFunde,
  messung.spaeterFunde + ' gegen ' + messung.kaltFunde);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Und der Befund bleibt richtig');

gleich('Kalt und warm zählen gleich',
  messung.warmGezaehlt, messung.kaltGezaehlt);
gleich('Und finden dieselben Arten', messung.warmArten, messung.kaltArten);
p('Es wurde überhaupt etwas gefunden — sonst wäre §5 leer und grün',
  messung.kaltFunde > 0, String(messung.kaltFunde));

/* ------------------------------------------------------------------------ */
/* Und im Quelltext: der Merker hängt am Abdruck und nicht an einer Uhr. */
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/luecken.ts'), 'utf-8');
p('Der Merker vergleicht Abdrücke, nicht Zeitspannen',
  /merker\.abdruck === jetzt/.test(quelle) && !/merker[\s\S]{0,80}Date\.now\(\) -/.test(quelle));
p('Und `befund` sammelt über den Merker',
  /const \{ seiten, verweise, themen \} = gesammelt\(\);/.test(quelle));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
