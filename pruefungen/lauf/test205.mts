/* Suite 171 — Der Prüfserver hält wirklich an (E132)
 * ============================================================================
 * test101 lief unter Windows fachlich grün durch und endete danach mit einer
 * libuv-Assertion. Der Verdacht lag auf `process.exit()`. Der lag daneben —
 * `process.exit()` war nur die Stelle, an der es auffiel.
 *
 * DER FEHLER: `stopp()` hielt nicht an.
 *
 *     stopp: () => new Promise(f => { server.close(() => f()); })
 *
 * `server.close()` hört nur auf, NEUE Verbindungen anzunehmen. Auf jede
 * bestehende wartet es — und eine Verbindung, die offen ist und nichts tut,
 * geht von sich aus nicht weg. Gemessen mit einer einzigen rohen Verbindung:
 *
 *     alt   stopp() nach 3000 ms aufgelöst?   false   ← hängt
 *     neu   stopp() nach 3000 ms aufgelöst?   true
 *
 * Unter Linux fiel das nie auf, weil `fetch` seine Verbindungen von selbst
 * schliesst. Es genügt ein Client, der es nicht tut.
 *
 * ─── WARUM DIESE PRÜFUNG ROT WERDEN KANN (§55.2) ────────────────────────────
 * §1 misst genau den Unterschied oben, gegen die alte Fassung nachgestellt.
 * Nimmt jemand die Behebung zurück, wartet §1 vergeblich und meldet es.
 * Kein Sleep-Hack: gewartet wird auf das Versprechen, nicht auf die Uhr — die
 * Frist ist nur die Reissleine, damit ein Hänger nicht den ganzen Lauf
 * anhält.
 *
 * Zehn Prüfläufe starten diesen Server. Die Behebung gilt für alle.
 *
 *   node pruefungen/lauf/test205.mts
 * ==========================================================================*/
import net from 'node:net';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const { starte } = await import('../../server/pruefserver.ts');
const UMWELT = { umwelt: { ADRESSE: 'https://redion.example' } };

/** Wartet auf das Versprechen, aber höchstens `frist` Millisekunden. */
const hoechstens = <T,>(versprechen: Promise<T>, frist: number): Promise<boolean> =>
  Promise.race([
    versprechen.then(() => true),
    new Promise<boolean>(f => setTimeout(() => f(false), frist)),
  ]);

/* ==========================================================================
 * §1 · Eine offene, untätige Verbindung darf das Anhalten nicht aufhalten
 * ========================================================================*/
console.log('\n1 · Eine offene, untätige Verbindung darf das Anhalten nicht aufhalten');

const srv1 = await starte(8961, UMWELT);
const draht = net.connect(8961, 'localhost');
await new Promise<void>(f => draht.once('connect', () => f()));
p('Die rohe Verbindung steht', !draht.destroyed);

const angehalten = await hoechstens(srv1.stopp(), 3000);
p('`stopp()` löst auf, obwohl die Verbindung noch offen ist',
  angehalten, 'nach 3000 ms immer noch nicht aufgelöst — genau der alte Fehler');
gleich('Und der Server hört nicht mehr zu', srv1.server.listening, false);
draht.destroy();

/* ==========================================================================
 * §2 · Zweimal anhalten ist dasselbe wie einmal
 * --------------------------------------------------------------------------
 * Der zweite Aufruf rief `close()` auf einem geschlossenen Server. Node
 * meldet dafür `ERR_SERVER_NOT_RUNNING` an einen Rückruf — hier an einen,
 * den niemand las, und das Versprechen wurde nie erfüllt.
 * ========================================================================*/
console.log('\n2 · Zweimal anhalten ist dasselbe wie einmal');

const srv2 = await starte(8962, UMWELT);
const erst = await hoechstens(srv2.stopp(), 3000);
p('Das erste Anhalten geht durch', erst);
let geworfen = '';
const zweit = await hoechstens(
  srv2.stopp().catch((e: unknown) => { geworfen = String(e); }), 3000);
p('Das zweite auch — und ohne zu warten', zweit);
gleich('Es wirft dabei nichts', geworfen, '');

/* ==========================================================================
 * §3 · Danach ist der Port sofort wieder frei
 * --------------------------------------------------------------------------
 * Das ist das ehrliche Signal. `process._getActiveHandles()` taugt dafür
 * NICHT: es führt das Server-Objekt weiter auf, bis der Speicher aufgeräumt
 * wird — beim ersten Messen sah es dadurch so aus, als bliebe der Server
 * offen, obwohl er längst zu war.
 * ========================================================================*/
console.log('\n3 · Danach ist der Port sofort wieder frei');

const srv3 = await starte(8963, UMWELT);
const drahtB = net.connect(8963, 'localhost');
await new Promise<void>(f => drahtB.once('connect', () => f()));
await hoechstens(srv3.stopp(), 3000);
const neuerServer = http.createServer((_q, a) => a.end('x'));
const frei = await new Promise<string>(f => {
  neuerServer.once('error', (e: any) => f('belegt: ' + e.code));
  neuerServer.listen(8963, () => f('frei'));
});
gleich('Ein neuer Server bekommt den Port', frei, 'frei');
await new Promise<void>(f => neuerServer.close(() => f()));
drahtB.destroy();

/* ==========================================================================
 * §4 · Was der Quelltext dazu sagt
 * ========================================================================*/
console.log('\n4 · Was der Quelltext dazu sagt');

const quelle = fs.readFileSync(path.join(WURZEL, 'server/pruefserver.ts'), 'utf8');
p('Der Server beendet seine offenen Verbindungen selbst',
  /closeAllConnections/.test(quelle) && /draht\.destroy\(\)/.test(quelle));
p('Und merkt sich, dass er schon angehalten wurde',
  /if \(anhalten\) return anhalten;/.test(quelle));
p('Ohne Wartezeit — kein `setTimeout` im Anhalten',
  !/setTimeout/.test(quelle.slice(quelle.indexOf('const stopp'),
                                  quelle.indexOf('await new Promise<void>(fertig => { server.listen'))));

const einhundertEins = fs.readFileSync(path.join(WURZEL, 'pruefungen/lauf/test101.mts'), 'utf8');
p('test101 reisst den Prozess nicht mehr ab, sondern setzt `process.exitCode`',
  /process\.exitCode = weg \? 1 : 0/.test(einhundertEins) &&
  !/process\.exit\(weg \? 1 : 0\)/.test(einhundertEins));

console.log(`\n  Suite 171 — Der Prüfserver hält wirklich an: ${ok} ok, ${weg} offen`);
process.exitCode = weg ? 1 : 0;
