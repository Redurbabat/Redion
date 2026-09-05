/* Suite 415 — Ein Katalog für die Ansichten, nicht fünf (E422)
 * ============================================================================
 * Auf dem Bild `db-pivot` stand über der Tabelle ein Reiter namens „Ansicht".
 * Nicht „Pivot" — „Ansicht". Der Grund war kein Tippfehler, sondern §8:
 *
 *   > Keine doppelten Kataloge einführen. Ein zweiter Katalog für dasselbe
 *   > läuft mit dem ersten auseinander, und niemand merkt, welcher gilt.
 *
 * Es gab VIER weitere Kataloge neben `register/ansichten.ts`, und alle vier
 * kannten dieselben elf von dreizehn Arten:
 *
 *   kern/ablage/indexdb.ts        `namen`         der Name einer neuen Ansicht
 *   datenbanken/steuerung.ts      `ICO`           das Zeichen im Reiter
 *   datenbanken/steuerung.ts      `LAYOUT_NAMEN`  der Name im Ansichtsmenü
 *   datenbanken/steuerung.ts      `LAY_ICON`      das Zeichen im Ansichtsmenü
 *
 * `pivot` und `raster` fehlten in allen vieren. Im Register stehen sie seit
 * jeher — mit Zeichen und Namen. Vier Kataloge, ein richtiger, und die drei
 * Stellen, an denen es auffiel, waren die Stellen, die ein Nutzer sieht.
 *
 *   §1 Jede der dreizehn Arten hat einen deutschen Namen — keine Kennung,
 *      kein „Ansicht".
 *   §2 Und jede ihr eigenes Zeichen.
 *   §3 Der Name kommt WIRKLICH aus dem Register: eine Änderung dort ändert
 *      die Oberfläche.
 *   §4 Es gibt keinen zweiten Katalog mehr im Quelltext.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → `pivot` aus dem Register nehmen → beide rot.
 *   §3    → die Register-Abfrage durch eine feste Liste ersetzen.
 *   §4    → eine der vier Karten wieder einsetzen.
 * Alle gelaufen, Ergebnisse im Bericht zu E422.
 *
 *   node pruefungen/lauf/test415.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9537;

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
const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);

/* Für JEDE Art eine Ansicht anlegen und ablesen, was im Reiter steht.
   Kein Klickweg — geprüft wird, was der Nutzer LIEST. */
const reiter = await s.evaluate(`(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  const seite = Store.addPage(null, { text: 'Katalogprobe' });
  const { collectionId } = Store.addDatabase(seite.id, 'Katalog', {
    titel: { name: 'Sache', type: 'title' }
  }, 'table');
  const arten = Register.ansichten.alle().map(x => x[0]);
  /* Die erste Ansicht ist schon da (table); die übrigen dazu. */
  for (const a of arten) if (a !== 'table') Store.addView(collectionId, a);
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(f => setTimeout(f, 1100));
  const gelesen = [...document.querySelectorAll('.db-tab')]
    .filter(b => b.textContent.trim() !== '+')
    .map(b => ({ zeichen: (b.querySelector('span') || {}).textContent || '',
                 text: b.textContent.replace((b.querySelector('span') || {}).textContent || '', '').trim() }));
  return { arten, gelesen,
           registerNamen: arten.map(a => Register.ansichten.name(a)),
           registerIcons: arten.map(a => Register.ansichten.icon(a)),
           seite: seite.id, coll: collectionId };
})()`) as any;

/* ==========================================================================
 * §1 · JEDE ART HAT EINEN DEUTSCHEN NAMEN
 * ========================================================================*/
console.log('\n§1 Jede Art trägt einen deutschen Namen');
p('Es gibt dreizehn Arten', reiter.arten.length === 13, String(reiter.arten.length));
p('Und für jede einen Reiter', reiter.gelesen.length === 13,
  `${reiter.gelesen.length} Reiter zu ${reiter.arten.length} Arten`);
/* Kein Reiter heisst wie seine Kennung — das wäre englischer Code im Bild
   eines Menschen (§3). */
const roh = reiter.gelesen
  .map((g: any, i: number) => ({ ...g, art: reiter.arten[i] }))
  .filter((g: any) => g.text === g.art);
p('Keiner heisst wie seine Kennung', roh.length === 0,
  JSON.stringify(roh.map((g: any) => g.art)));
/* Und keiner heisst „Ansicht" — der Rückfall, wenn ein Katalog die Art
   nicht kennt. Genau das stand über der Pivot-Tabelle. */
const generisch = reiter.gelesen.filter((g: any) => g.text === 'Ansicht');
p('Und keiner heisst bloss „Ansicht"', generisch.length === 0,
  JSON.stringify(reiter.gelesen.map((g: any) => g.text)));
p('Jeder Name steht so auch im Register',
  reiter.gelesen.every((g: any, i: number) => g.text === reiter.registerNamen[i]),
  JSON.stringify(reiter.gelesen.map((g: any, i: number) =>
    g.text + '/' + reiter.registerNamen[i])));

/* ==========================================================================
 * §2 · UND JEDE IHR EIGENES ZEICHEN
 * ========================================================================*/
console.log('\n§2 Und jede ihr eigenes Zeichen');
p('Jeder Reiter trägt ein Zeichen',
  reiter.gelesen.every((g: any) => String(g.zeichen).trim().length > 0),
  JSON.stringify(reiter.gelesen.map((g: any) => g.zeichen)));
/* Nicht alle dasselbe: der Rückfall ist ▦, und wenn ein Katalog eine Art
   nicht kennt, bekommen alle unbekannten dieses eine Zeichen. */
p('Und es ist das des Registers',
  reiter.gelesen.every((g: any, i: number) => g.zeichen === reiter.registerIcons[i]),
  JSON.stringify(reiter.gelesen.map((g: any, i: number) =>
    g.zeichen + '/' + reiter.registerIcons[i])));
/* Zwei Arten teilen sich 🧮 (Raster und Dashboard) — das ist im Register so
   gewollt. Elf verschiedene Zeichen bei dreizehn Arten ist also richtig. */
p('Mindestens elf verschiedene Zeichen',
  new Set(reiter.gelesen.map((g: any) => g.zeichen)).size >= 11,
  String(new Set(reiter.gelesen.map((g: any) => g.zeichen)).size));

/* ==========================================================================
 * §3 · DER NAME KOMMT WIRKLICH AUS DEM REGISTER
 * --------------------------------------------------------------------------
 * Der eigentliche Punkt. „Der Name stimmt" hiesse auch dann etwas, wenn ihn
 * ein zweiter Katalog liefert, der zufällig gleich gefüllt ist — und genau
 * so war es jahrelang. Geprüft wird deshalb die VERBINDUNG: das Register
 * ändern und nachsehen, ob die Oberfläche folgt.
 * ========================================================================*/
console.log('\n§3 Der Name kommt wirklich aus dem Register');
const gefolgt = await s.evaluate(`(async () => {
  const liste = Register.ansichten.alle();
  const eintrag = liste.find(x => x[0] === 'pivot');
  const alt = eintrag[2];
  eintrag[2] = 'Kreuztabelle';
  const v = Store.addView(${JSON.stringify(reiter.coll)}, 'pivot');
  const neuerName = v.name;
  eintrag[2] = alt;
  return { neuerName, alt };
})()`) as any;
p('Eine neue Ansicht bekommt den Namen aus dem Register',
  gefolgt.neuerName === 'Kreuztabelle',
  JSON.stringify(gefolgt));
p('… und das Register steht danach wieder wie vorher',
  gefolgt.alt === 'Pivot', JSON.stringify(gefolgt));

/* ==========================================================================
 * §4 · ES GIBT KEINEN ZWEITEN KATALOG MEHR
 * --------------------------------------------------------------------------
 * Gesucht wird die FORM, nicht der Name: eine Objektliteral-Karte, die
 * `table:` und `calendar:` nebeneinander auf Zeichenketten abbildet. Das ist
 * eng genug, um nichts anderes zu treffen, und weit genug, um eine
 * umbenannte Karte zu finden.
 * ========================================================================*/
console.log('\n§4 Es gibt keinen zweiten Katalog mehr');
const dateien: string[] = [];
const sammeln = (d: string): void => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const voll = path.join(d, e.name);
    if (e.isDirectory()) sammeln(voll);
    else if (e.name.endsWith('.ts')) dateien.push(voll);
  }
};
sammeln(path.join(WURZEL, 'src'));
/* EINE KARTE MIT KLEINGESCHRIEBENEN ASCII-WERTEN IST KEIN KATALOG.
   `ANSICHT_ZEICHEN` in `steuerung.ts` bildet die dreizehn Arten auf
   Strichzeichen-KENNUNGEN ab — grid, boxChecked, compass —, und zwar mit
   geschriebenem Grund: „Emoji stehen im Ansichtenregister; an der Kante
   sind sie verboten (E202)". Das ist eine Übersetzung in ein anderes
   Zeichensystem, keine zweite Liste von Namen.
   Unterschieden wird an den WERTEN: was ein Mensch liest, fängt gross an
   („Tabelle") oder ist kein ASCII („▦", "📅"). Was der Code liest, ist ein
   kleingeschriebener Bezeichner. Ohne diese Trennung meldet der Wächter
   eine gesunde Karte, und dann wird er abgeschaltet — derselbe Fehler wie
   bei `formel` in `test294` (E412). */
const menschlich = (wert: string) => /^[A-Z]/.test(wert) || /[^\x20-\x7e]/.test(wert);
const doppelt: string[] = [];
for (const f of dateien) {
  if (f.endsWith(path.join('register', 'ansichten.ts'))) continue;   /* der echte */
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\{[^{}]*\btable\s*:\s*'[^']*'[^{}]*\}/g)) {
    if (!/\bcalendar\s*:\s*'/.test(m[0])) continue;
    const werte = [...m[0].matchAll(/:\s*'([^']*)'/g)].map(x => x[1] as string);
    if (!werte.some(menschlich)) continue;
    doppelt.push(path.relative(WURZEL, f) + ': ' + m[0].slice(0, 50).replace(/\s+/g, ' '));
  }
}
p('Der Wächter sieht überhaupt Dateien', dateien.length > 100, String(dateien.length));
p('Keine zweite Ansichtskarte im Quelltext', doppelt.length === 0,
  doppelt.slice(0, 4).join(' | '));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
