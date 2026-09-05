/* Suite 422 — Jeder Ereignisname kommt aus dem Katalog (E429)
 * ============================================================================
 * `kern/ereignisse/arten.ts` sagt selbst, wozu es die Datei gibt:
 *
 *   > Deshalb stehen die Namen hier, und man schreibt `ARTEN.seiteGeaendert`
 *   > statt der Zeichenkette. Ein Tippfehler ist dann sofort `undefined`
 *   > und fällt auf.
 *
 * Gezählt waren es NEUNZEHN Stellen, die den Namen als rohe Zeichenkette
 * schreiben — und an zweien davon war genau der Fehler eingetreten, vor dem
 * die Datei warnt:
 *
 *     arten.ts    appStartet: 'app.startet'      mit PUNKT
 *     start.ts    melde('app:startet')           mit DOPPELPUNKT
 *
 * Zwei Namen für dasselbe Ereignis. Wer über `ARTEN.appStartet` horcht,
 * hört nie etwas — und weil `melde` den Wert für spätere Zuhörer aufhebt
 * (`nachreichen`), bekäme er ihn auch nicht nachgereicht. Der Katalogeintrag
 * war unerreichbar, und niemand konnte es merken: ein Zuhörer, der nichts
 * hört, sieht aus wie ein Ereignis, das nicht eingetreten ist.
 *
 * Die übrigen siebzehn waren nicht falsch, nur ungeschützt: die ganze
 * Familie `auftrag.*` stand gar nicht im Katalog. Ein Tippfehler dort wäre
 * still — `horche('auftrag.beended')` wartet für immer.
 *
 *   §1 Kein roher Ereignisname mehr im Quelltext.
 *   §2 Jeder benutzte Name steht im Katalog.
 *   §3 Kein Katalogeintrag wird von einer Schreibweise unterlaufen.
 *   §4 Und die Ereignisse feuern wirklich unter ihrem Katalognamen.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → eine Stelle zurück auf die rohe Zeichenkette.
 *   §3    → `melde(ARTEN.appStartet)` zurück auf `melde('app:startet')`.
 *   §4    → den Aufruf in `start.ts` ganz entfernen.
 * Alle gelaufen, Ergebnisse im Bericht zu E429.
 *
 *   node pruefungen/lauf/test422.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9544;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* ---- Quelltext einlesen -------------------------------------------------- */
const dateien: string[] = [];
const sammeln = (d: string): void => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const voll = path.join(d, e.name);
    if (e.isDirectory()) sammeln(voll);
    else if (e.name.endsWith('.ts')) dateien.push(voll);
  }
};
sammeln(path.join(WURZEL, 'src'));
const ARTEN_DATEI = path.join(WURZEL, 'src/kern/ereignisse/arten.ts');
const artenText = fs.readFileSync(ARTEN_DATEI, 'utf8');
const katalog = new Map<string, string>();
for (const m of artenText.matchAll(/(\w+)\s*:\s*'([a-z][a-z.:_\-]+)'/g))
  katalog.set(m[1] as string, m[2] as string);

/* Die vier Wege, auf denen ein Ereignisname in den Bus geht. */
const RUFE = /\b(melde|horche|einmal|frage)\(\s*(?:ARTEN\.(\w+)|'([a-z][a-z.:_\-]+)')/g;
type Stelle = { datei: string; zeile: number; roh: string | null; konst: string | null };
const stellen: Stelle[] = [];
for (const f of dateien) {
  if (f === ARTEN_DATEI) continue;
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(RUFE))
    stellen.push({ datei: path.relative(WURZEL, f), zeile: t.slice(0, m.index).split('\n').length,
                   roh: (m[3] as string) ?? null, konst: (m[2] as string) ?? null });
}

/* ==========================================================================
 * §1 · KEIN ROHER EREIGNISNAME MEHR IM QUELLTEXT
 * ========================================================================*/
console.log('\n§1 Kein roher Ereignisname mehr im Quelltext');
p('Der Wächter sieht überhaupt Aufrufe', stellen.length >= 15, String(stellen.length));
p('Und er kennt den Katalog', katalog.size >= 30, String(katalog.size) + ' Arten');
const rohe = stellen.filter(s => s.roh);
p('Keiner schreibt den Namen als Zeichenkette',
  rohe.length === 0,
  rohe.slice(0, 6).map(s => `${s.datei}:${s.zeile} '${s.roh}'`).join(' | '));

/* ==========================================================================
 * §2 · JEDER BENUTZTE NAME STEHT IM KATALOG
 * ========================================================================*/
console.log('\n§2 Jeder benutzte Name steht im Katalog');
const unbekannt = stellen.filter(s => s.konst && !katalog.has(s.konst));
p('Keine Stelle ruft eine Art, die es nicht gibt',
  unbekannt.length === 0,
  unbekannt.map(s => `${s.datei}:${s.zeile} ARTEN.${s.konst}`).join(' | '));
/* Und die Familie, die vorher gar nicht im Katalog stand. */
for (const n of ['auftragAngelegt', 'auftragBeginnt', 'auftragSchritt',
                 'auftragBeendet', 'auftragFehler', 'einstellungGeaendert'])
  p(`Die Art ${n} steht im Katalog`, katalog.has(n),
    n + ' fehlt');

/* ==========================================================================
 * §3 · KEIN KATALOGEINTRAG WIRD VON EINER SCHREIBWEISE UNTERLAUFEN
 * --------------------------------------------------------------------------
 * Der eigentliche Befund. `arten.ts` sagte `app.startet`, `start.ts` meldete
 * `app:startet`. Beide Wörter sind dieselben, nur das Trennzeichen ist ein
 * anderes — und damit sind es ZWEI Ereignisse, von denen eines niemanden
 * erreicht. Gesucht wird deshalb nicht nach Gleichheit, sondern nach
 * „gleich bis auf Punkt und Doppelpunkt".
 * ========================================================================*/
console.log('\n§3 Kein Katalogeintrag wird von einer Schreibweise unterlaufen');
const flach = (n: string) => n.replace(/[.:_-]/g, '');
const kollisionen: string[] = [];
for (const [k, wert] of katalog) {
  for (const s of stellen) {
    if (!s.roh || s.roh === wert) continue;
    if (flach(s.roh) === flach(wert))
      kollisionen.push(`${s.datei}:${s.zeile} '${s.roh}' gegen ARTEN.${k} = '${wert}'`);
  }
}
p('Keine Stelle schreibt einen Katalognamen anders',
  kollisionen.length === 0, kollisionen.join(' | '));

/* ==========================================================================
 * §4 · UND DIE EREIGNISSE FEUERN WIRKLICH
 * --------------------------------------------------------------------------
 * Alles darüber ist Lesen. Diese Zeilen sehen nach, ob beim Start wirklich
 * etwas ankommt — und zwar unter dem Namen, der im Katalog steht.
 * ========================================================================*/
console.log('\n§4 Und die Ereignisse feuern wirklich');
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

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1100, height: 800 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Ereignisse !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(900);
/* `nachreichen` gibt einem späten Zuhörer das, was schon gemeldet wurde —
   genau deshalb lässt sich der Start noch nachträglich prüfen. */
const angekommen = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const raus = {};
  for (const k of ['appStartet', 'appSteht']) {
    const name = ARTEN[k];
    let da = false;
    const ab = Ereignisse.horche(name, () => { da = true; }, { nachreichen: true });
    ab();
    raus[k] = { name, da };
  }
  return raus;
})())`) as string);
p('Beim Start kommt app.startet an unter seinem Katalognamen',
  angekommen.appStartet?.da === true, JSON.stringify(angekommen.appStartet));
p('Und app.steht auch', angekommen.appSteht?.da === true,
  JSON.stringify(angekommen.appSteht));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
