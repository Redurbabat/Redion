/* Suite 300 — Verknüpfungen haben eine Art (E306, Redurs Punkt 12)
 * ============================================================================
 * Redurs Punkt 12: „Typed Relations."
 *
 * Nachgemessen, was Redion hat: die Spalte `relation` kennt ein Ziel
 * (`ziel`), eine Gegenspalte (`gegen`) und je Seite eine Grenze (`limit`).
 * Das IST eine Art — man muss sie nur aussprechen. Und beim Aussprechen kam
 * ein Fehler heraus, den vorher niemand sehen konnte:
 *
 *     DIE GEGENSEITE HAT IHRE EIGENE GRENZE, UND SIE GALT NICHT.
 *
 * `relationSetzen` trug auf der Gegenseite mit `[...liste, row.id]` ein —
 * angehängt, ohne zu fragen, wie viele drüben erlaubt sind. Eine Verknüpfung,
 * die auf beiden Seiten „nur eine" heisst, wurde damit drüben stillschweigend
 * zu „beliebig viele": zwei Zeilen konnten dieselbe Zielzeile für sich
 * beanspruchen, und beide sahen richtig aus.
 *
 *   §1 DIE ART wird aus den zwei Grenzen abgelesen, und zwar richtig.
 *   §2 DER FEHLER: 1:1 hielt drüben nicht.
 *   §3 UND DER VERDRÄNGTE ZEIGT NICHT INS LEERE.
 *   §4 GEGENPROBE: n:m sammelt weiter, wie es soll.
 *   §5 DIE ART STEHT IM EINRICHTEN-FENSTER.
 *
 *   node pruefungen/lauf/test300.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Datenbank: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9101;

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
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

/* Zwei Sammlungen, wechselseitig verknüpft, BEIDE Seiten auf „nur eine".
   Das ist der Fall, den Redion nie eingehalten hat: ein Fach hat genau eine
   Fachlehrerin, und eine Fachlehrerin unterrichtet genau ein Fach. */
const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const seite = Store.addPage(null, { text: 'Schule', icon: '🏫' });
  const a = Store.addDatabase(seite.id, 'Fächer',
    { title: { name: 'Name', type: 'title' } });
  const b = Store.addDatabase(seite.id, 'Lehrpersonen',
    { title: { name: 'Name', type: 'title' } });
  const faecher = Store.getCollection(a.collectionId);
  const lehrer  = Store.getCollection(b.collectionId);
  faecher.schema['lehrer'] = { name: 'Fachlehrerin', type: 'relation',
    ziel: lehrer.id, gegen: 'fach', limit: 1 };
  lehrer.schema['fach'] = { name: 'Fach', type: 'relation',
    ziel: faecher.id, gegen: 'lehrer', limit: 1 };
  Store.updateCollection(faecher.id, { schema: faecher.schema });
  Store.updateCollection(lehrer.id, { schema: lehrer.schema });
  const f1 = Store.addRow(faecher.id, { title: 'Elektrotechnik' });
  const f2 = Store.addRow(faecher.id, { title: 'Mathematik' });
  const l1 = Store.addRow(lehrer.id,  { title: 'Frau Meier' });
  await Store.flush();
  return { faecher: faecher.id, lehrer: lehrer.id,
           f1: f1.id, f2: f2.id, l1: l1.id };
})()`;

const ids = await pc.evaluate(AUFBAU) as any;

/* ==========================================================================
 * §1 · Die Art wird abgelesen
 * ========================================================================*/
console.log('\n1 · Die Art wird aus den zwei Grenzen abgelesen');

const arten = await pc.evaluate((x: any) => {
  const f = Store.getCollection(x.faecher);
  const l = Store.getCollection(x.lehrer);
  const eins = Datenbank.relationsart(f, 'lehrer');
  /* Für die anderen drei Fälle die Grenzen kurz verstellen und wieder
     zurück — gemessen wird die Ableitung, nicht der Bestand. */
  l.schema['fach'].limit = 0;
  const einsZuN = Datenbank.relationsart(f, 'lehrer');
  f.schema['lehrer'].limit = 0;
  const nZuN = Datenbank.relationsart(f, 'lehrer');
  l.schema['fach'].limit = 1;
  const nZuEins = Datenbank.relationsart(f, 'lehrer');
  const ohneGegen = (() => {
    const merk = f.schema['lehrer'].gegen;
    f.schema['lehrer'].gegen = '';
    const a = Datenbank.relationsart(f, 'lehrer');
    f.schema['lehrer'].gegen = merk;
    return a;
  })();
  f.schema['lehrer'].limit = 1;
  l.schema['fach'].limit = 1;
  return { eins, einsZuN, nZuN, nZuEins, ohneGegen,
           satz: Datenbank.relationsartSatz('1:1') };
}, ids);

gleich('Beide Seiten begrenzt heisst 1:1', arten.eins, '1:1');
gleich('Nur hier begrenzt heisst 1:n', arten.einsZuN, '1:n');
gleich('Keine Seite begrenzt heisst n:n', arten.nZuN, 'n:n');
gleich('Nur drüben begrenzt heisst n:1', arten.nZuEins, 'n:1');
gleich('Ohne Gegenspalte ist es einseitig', arten.ohneGegen, 'einseitig');
p('Und die Art hat einen Satz im Klartext',
  /Genau eine/.test(arten.satz) && arten.satz.length > 30, arten.satz);

/* ==========================================================================
 * §2 · Der Fehler: 1:1 hielt drüben nicht
 * --------------------------------------------------------------------------
 * §55.2 — kann das rot werden? Es WAR rot: gegen den Stand von heute Morgen
 * stand danach `["<f1>","<f2>"]` in der Spalte der Lehrerin. Beide Fächer
 * hatten dieselbe Lehrerin für sich, und die Ansicht zeigte je nach
 * Blickrichtung etwas anderes.
 * ========================================================================*/
console.log('\n2 · Der Fehler: 1:1 hielt drüben nicht');

const nachher = await pc.evaluate((x: any) => {
  const f = Store.getCollection(x.faecher);
  /* Erst bekommt Elektrotechnik die Lehrerin … */
  Datenbank.relationSetzen(Store.getBlock(x.f1), 'lehrer', f, [x.l1]);
  const nachErst = {
    f1: Store.getBlock(x.f1).props?.lehrer || [],
    l1: Store.getBlock(x.l1).props?.fach || []
  };
  /* … dann beansprucht Mathematik dieselbe. */
  Datenbank.relationSetzen(Store.getBlock(x.f2), 'lehrer', f, [x.l1]);
  return { nachErst,
    f1: Store.getBlock(x.f1).props?.lehrer || [],
    f2: Store.getBlock(x.f2).props?.lehrer || [],
    l1: Store.getBlock(x.l1).props?.fach || [] };
}, ids);

gleich('Nach dem ersten Eintrag steht es auf beiden Seiten',
  [nachher.nachErst.f1, nachher.nachErst.l1], [[ids.l1], [ids.f1]]);
gleich('Die Lehrerin hat danach GENAU EIN Fach', nachher.l1, [ids.f2]);
gleich('Und zwar das zuletzt eingetragene', nachher.f2, [ids.l1]);

/* ==========================================================================
 * §3 · Und der Verdrängte zeigt nicht ins Leere
 * --------------------------------------------------------------------------
 * Das ist der Teil, der beim Reparieren leicht vergessen wird: die alte
 * Verbindung muss auf BEIDEN Seiten weg. Ein Fach, das weiterhin auf seine
 * Lehrerin zeigt, während die Lehrerin es nicht mehr kennt, ist der
 * schlechtere Zustand — die Ansicht zeigt dann je nach Blickrichtung etwas
 * anderes (§46).
 * ========================================================================*/
console.log('\n3 · Und der Verdrängte zeigt nicht ins Leere');

gleich('Elektrotechnik hat seine Lehrerin verloren', nachher.f1, []);

/* ==========================================================================
 * §4 · GEGENPROBE: n:m sammelt weiter
 * --------------------------------------------------------------------------
 * Ohne diesen Arm wäre §2 auch grün, wenn die Gegenseite IMMER auf einen
 * Eintrag zusammengestrichen würde — und das wäre kein 1:1, sondern eine
 * kaputte Verknüpfung.
 * ========================================================================*/
console.log('\n4 · Gegenprobe: n:m sammelt weiter');

const viele = await pc.evaluate((x: any) => {
  const f = Store.getCollection(x.faecher);
  const l = Store.getCollection(x.lehrer);
  f.schema['lehrer'].limit = 0;
  l.schema['fach'].limit = 0;
  Store.updateCollection(f.id, { schema: f.schema });
  Store.updateCollection(l.id, { schema: l.schema });
  Store.setProp(x.f1, 'lehrer', []);
  Store.setProp(x.f2, 'lehrer', []);
  Store.setProp(x.l1, 'fach', []);
  Datenbank.relationSetzen(Store.getBlock(x.f1), 'lehrer', f, [x.l1]);
  Datenbank.relationSetzen(Store.getBlock(x.f2), 'lehrer', f, [x.l1]);
  return { art: Datenbank.relationsart(f, 'lehrer'),
           l1: (Store.getBlock(x.l1).props?.fach || []).slice().sort(),
           f1: Store.getBlock(x.f1).props?.lehrer || [] };
}, ids);

gleich('Jetzt ist es n:n', viele.art, 'n:n');
gleich('Die Lehrerin hat BEIDE Fächer', viele.l1, [ids.f1, ids.f2].sort());
gleich('Und Elektrotechnik behält seine Lehrerin', viele.f1, [ids.l1]);

/* ==========================================================================
 * §5 · Die Art steht im Einrichten-Fenster
 * ========================================================================*/
console.log('\n5 · Die Art steht im Einrichten-Fenster');

const fenster = await pc.evaluate(async (x: any) => {
  const f = Store.getCollection(x.faecher);
  f.schema['lehrer'].limit = 1;
  const l = Store.getCollection(x.lehrer);
  l.schema['fach'].limit = 1;
  Store.updateCollection(f.id, { schema: f.schema });
  Store.updateCollection(l.id, { schema: l.schema });
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Datenbank.relationEinrichten(f, 'lehrer');
  await new Promise(r => setTimeout(r, 500));
  const el = document.querySelector('.rel-art');
  return { da: !!el, text: (el?.textContent || '').replace(/\s+/g, ' ').trim() };
}, ids);

p('Das Fenster nennt die Art', fenster.da);
p('Und zwar diese hier: 1:1', /1:1/.test(fenster.text), fenster.text.slice(0, 80));
p('Mit einem Satz, der sie erklärt',
  /Genau eine/.test(fenster.text), fenster.text.slice(0, 110));

/* ========================================================================== */
console.log('\n6 · Keine Fehler auf dem Weg');
p('Keine unbehandelten Ausnahmen', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} — Suite 300 (E306: Verknüpfungen mit Art)`);
process.exit(weg ? 1 : 0);
