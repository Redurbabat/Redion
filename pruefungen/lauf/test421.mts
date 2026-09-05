/* Suite 421 — Die KI baut die Spaltentypen, die es gibt (E428)
 * ============================================================================
 * `TYP_KARTE` in `ki/dienst.ts` übersetzt, was ein Modell schreibt, in
 * Redions Spaltentypen: `zahl` → `number`, `kontrollkästchen` → `checkbox`.
 * Das ist richtig so und KEIN zweiter Katalog — das Register hält die
 * Kennungen, diese Karte fängt die vielen Schreibweisen dafür ab.
 *
 * Gezählt war sie aber unvollständig: 30 Typen stehen im Register, 13
 * erreichte die KI. Die anderen siebzehn fielen still auf `text` zurück:
 *
 *     const typ = TYP_KARTE[roh] || (istTitel ? 'title' : 'text');
 *
 * „Bau mir eine Datenbank mit einer Bewertung und einem Fortschritt" ergab
 * also zwei Textspalten. Kein Fehler, keine Meldung — nur eine Datenbank,
 * die weniger kann, als der Nutzer gesagt hat.
 *
 * SIEBEN DAVON SIND EINFACH NUR VERGESSEN. Sterne, Prozent, Ort,
 * Zeitspanne, Erstellt am, Zuletzt geändert und die laufende Nummer
 * brauchen nichts weiter als ihren Namen.
 * DIE ÜBRIGEN ZEHN BLEIBEN DRAUSSEN, und zwar mit Grund: `relation` und
 * `rollup` brauchen eine Zieldatenbank, die im Plan nicht steht; `gdrive`,
 * `figma`, `githubpr` und `zendesk` brauchen eine eingerichtete Verbindung;
 * `button`, `ki` und `verify` brauchen eine Einstellung, die niemand
 * geraten hat. Eine Spalte, die leer und kaputt entsteht, ist schlechter
 * als eine Textspalte.
 *
 *   §1 Die sieben neuen Typen entstehen wirklich.
 *   §2 Auf Deutsch geschrieben auch — das Modell schreibt deutsch.
 *   §3 Die alten dreizehn gehen weiter.
 *   §4 Ein unbekannter Typ fällt weiter sauber auf Text.
 *   §5 Und die zehn mit Grund draussen bleiben draussen.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → die neuen Zeilen aus `TYP_KARTE` nehmen. Gemessen: sieben
 *           Spalten werden `text`.
 *   §5    → `relation` in die Karte schreiben.
 * Beide gelaufen, Ergebnisse im Bericht zu E428.
 *
 *   node pruefungen/lauf/test421.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9543;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
const s = await browser.newPage({ viewport: { width: 1200, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);

/** Baut eine Datenbank aus einem Plan und gibt die entstandenen Typen aus. */
const bauen = async (spalten: Array<[string, string]>) => JSON.parse(await s.evaluate(`
  JSON.stringify((() => {
    const seite = Store.addPage(null, { text: 'KI-Plan ${Math.random()}' });
    const plan = { name: 'Probe', spalten: ${JSON.stringify(
      spalten.map(([name, typ]) => ({ name, typ })))} };
    const gebaut = KI.datenbankBauenAus(plan, seite.id);
    const coll = Store.getCollection(gebaut.collectionId || gebaut.id ||
                 (gebaut.block && gebaut.block.collectionId));
    if (!coll) return { fehlt: true, gebaut: Object.keys(gebaut || {}) };
    return { typen: Object.values(coll.schema).map(c => c.type),
             namen: Object.values(coll.schema).map(c => c.name) };
  })())`) as string);

/* ==========================================================================
 * §1 · DIE SIEBEN NEUEN TYPEN ENTSTEHEN WIRKLICH
 * ========================================================================*/
console.log('\n§1 Die sieben neuen Typen entstehen');
const NEU: Array<[string, string]> = [
  ['Titel', 'titel'], ['Bewertung', 'sterne'], ['Fortschritt', 'prozent'],
  ['Ort', 'place'], ['Dauer', 'duration'], ['Erstellt', 'created'],
  ['Geändert', 'edited'], ['Nummer', 'uid']
];
const a1 = await bauen(NEU);
p('Die Datenbank ist entstanden', !a1.fehlt, JSON.stringify(a1));
p('Und hat für jede Spalte eine Spalte', a1.typen?.length === NEU.length,
  JSON.stringify(a1.typen));
const SOLL = ['title', 'sterne', 'prozent', 'place', 'duration', 'created', 'edited', 'uid'];
p('Jeder der sieben Typen ist wirklich der Typ',
  JSON.stringify(a1.typen) === JSON.stringify(SOLL),
  `ist ${JSON.stringify(a1.typen)}, soll ${JSON.stringify(SOLL)}`);
/* Der harte Beleg gegen den stillen Rückfall: KEINE der acht ist Text. */
p('Und keine ist still auf Text zurückgefallen',
  (a1.typen || []).filter((t: string) => t === 'text').length === 0,
  JSON.stringify(a1.typen));

/* ==========================================================================
 * §2 · AUF DEUTSCH GESCHRIEBEN AUCH
 * --------------------------------------------------------------------------
 * Das Modell antwortet deutsch, weil die App deutsch fragt. `TYP_KARTE`
 * hatte für `zahl` und `kontrollkästchen` schon deutsche Schlüssel — für
 * die neuen sieben braucht es sie genauso.
 * ========================================================================*/
console.log('\n§2 Auf Deutsch geschrieben auch');
const a2 = await bauen([
  ['Bewertung', 'bewertung'], ['Fortschritt', 'fortschritt'], ['Ort', 'ort'],
  ['Dauer', 'dauer'], ['Erstellt am', 'erstellt'], ['Geändert', 'geändert']
]);
/* Der angehaengte Titel: `datenbankBauenAus` legt eine Titelspalte an, wenn
   der Plan keine nennt — `if (!titelGesetzt) schema.title = …`. Das ist
   richtig, eine Datenbank ohne Titel gibt es nicht, und die Erwartung muss
   ihn mitzaehlen statt ihn als Fehler zu melden. */
const SOLL2 = ['sterne', 'prozent', 'place', 'duration', 'created', 'edited', 'title'];
p('Auch die deutschen Wörter treffen',
  JSON.stringify(a2.typen) === JSON.stringify(SOLL2),
  `ist ${JSON.stringify(a2.typen)}, soll ${JSON.stringify(SOLL2)}`);

/* ==========================================================================
 * §3 · DIE ALTEN DREIZEHN GEHEN WEITER
 * ========================================================================*/
console.log('\n§3 Die alten dreizehn gehen weiter');
/* ZWÖLF JE PLAN, NICHT DREIZEHN. `datenbankBauenAus` nimmt
   `plan.spalten.slice(0, 12)` — eine Grenze, die es seit jeher gibt und die
   dieser Prüflauf zuerst für einen Fehler gehalten hat: der dreizehnte
   Eintrag fiel weg, und „files" fehlte im Ergebnis. Er fehlte nicht, er
   war der dreizehnte. Deshalb zwei Pläne statt einem. */
const a3 = await bauen([
  ['A', 'text'], ['B', 'zahl'], ['C', 'auswahl'], ['D', 'mehrfach'],
  ['E', 'status'], ['F', 'datum'], ['G', 'person'], ['H', 'kontrollkästchen']
]);
const a3b = await bauen([
  ['I', 'url'], ['J', 'e-mail'], ['K', 'telefon'], ['L', 'formel'], ['M', 'dateien']
]);
const SOLL3 = ['text', 'number', 'select', 'multi', 'status', 'date', 'person',
               'checkbox', 'title'];
const SOLL3B = ['url', 'email', 'phone', 'formula', 'files', 'title'];
p('Keine der alten Übersetzungen ist verlorengegangen',
  JSON.stringify(a3.typen) === JSON.stringify(SOLL3),
  `ist ${JSON.stringify(a3.typen)}`);
p('… auch die zweite Hälfte nicht',
  JSON.stringify(a3b.typen) === JSON.stringify(SOLL3B),
  `ist ${JSON.stringify(a3b.typen)}`);
/* Und die Grenze selbst, damit sie niemand für einen Fehler hält: mehr als
   zwölf Spalten aus einem Plan werden nicht gebaut. */
const a3c = await bauen(Array.from({ length: 15 },
  (_z, i) => ['S' + i, 'text'] as [string, string]));
p('Mehr als zwölf Spalten aus einem Plan werden nicht gebaut',
  (a3c.typen || []).length === 13,
  `${(a3c.typen || []).length} Spalten (zwölf plus Titel)`);

/* ==========================================================================
 * §4 · EIN UNBEKANNTER TYP FÄLLT SAUBER AUF TEXT
 * ========================================================================*/
console.log('\n§4 Ein unbekannter Typ fällt sauber auf Text');
const a4 = await bauen([['Etwas', 'quantenfeld'], ['Noch etwas', '']]);
p('Unbekanntes wird Text, nicht undefined',
  JSON.stringify(a4.typen) === JSON.stringify(['text', 'text', 'title']),
  JSON.stringify(a4.typen));
/* UND EINE TITELSPALTE KOMMT IMMER DAZU. Ohne sie gaebe es eine Datenbank,
   deren Zeilen keinen Namen tragen koennen — `zelle` faende nichts, und die
   Tabelle zeigte eine Spalte „Ohne Titel" ueber lauter Leerzeilen. */
p('Und eine Titelspalte kommt dazu, wenn der Plan keine nennt',
  (a4.typen || []).filter((t: string) => t === 'title').length === 1,
  JSON.stringify(a4.typen));

/* ==========================================================================
 * §5 · WAS MIT GRUND DRAUSSEN BLEIBT, BLEIBT DRAUSSEN
 * --------------------------------------------------------------------------
 * Eine Verknüpfung ohne Zieldatenbank, ein Rollup ohne Verknüpfung, ein
 * Knopf ohne Aktion, ein Google-Drive-Feld ohne Verbindung: jede davon
 * entstünde leer und kaputt. Eine Textspalte ist dann die ehrlichere
 * Antwort — sie hält wenigstens, was der Nutzer hineinschreibt.
 * ========================================================================*/
console.log('\n§5 Was mit Grund draussen bleibt, bleibt draussen');
const a5 = await bauen([
  ['V', 'relation'], ['R', 'rollup'], ['K', 'button'], ['G', 'gdrive'],
  ['F', 'figma'], ['P', 'githubpr'], ['Z', 'zendesk'], ['KI', 'ki'], ['PR', 'verify']
]);
p('Alle neun werden Text',
  (a5.typen || []).slice(0, 9).every((t: string) => t === 'text'),
  JSON.stringify(a5.typen));

/* Und die Karte selbst darf nicht heimlich wachsen: die Zahl der erreichten
   Typen steht hier, damit ein späterer Zusatz eine Entscheidung braucht. */
const quelle = fs.readFileSync(path.join(WURZEL, 'src/bereiche/ki/dienst.ts'), 'utf8');
const karte = quelle.slice(quelle.indexOf('const TYP_KARTE'),
                           quelle.indexOf('/** Baut aus einer Beschreibung'));
const ziele = new Set([...karte.matchAll(/:\s*'([a-z]+)'/g)].map(m => m[1]));
p('Die Karte erreicht genau zwanzig Typen', ziele.size === 20,
  `${ziele.size}: ${[...ziele].sort().join(' ')}`);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
