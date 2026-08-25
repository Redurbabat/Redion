/* Suite 106 — Das Register ist die Wahrheit, auch für Kataloge (L34)
 * ============================================================================
 * CLAUDE.md §8 sagt es in einem Satz: die Register sind die zentrale
 * Wahrheit. Zwei Kataloge hielten sich nicht daran.
 *
 * ERSTENS: Ziffer → Blockart. Notion legt die zehn häufigsten Blockarten
 * auf Strg+Umschalt+Ziffer. Welche Ziffer welche Art meint, stand VIERMAL
 * im Code: dreimal als Literal im Editor (Strg+Umschalt, die Mac-Belegung
 * Strg+Alt, die Mehrfachauswahl) und einmal im Register als `kurz`, wo die
 * Kürzelübersicht es liest.
 *
 * Wer eine Art auf eine andere Ziffer legt, ändert die Übersicht und lässt
 * drei Griffe stehen — oder umgekehrt, und dann zeigt die Übersicht ein
 * Kürzel, das nichts tut.
 *
 * ZWEITENS: die Gruppen des Typmenüs. `TYP_GRUPPEN` in `steuerung.ts`
 * zählt 34 Eigenschaftstypen in fünf Gruppen auf; das Register führt 35.
 * Der Unterschied ist `title` und damit richtig — eine Spalte lässt sich
 * nicht in den Titel verwandeln.
 *
 * ABER: `TYP_GRUPPEN` hatte keine Auffanggruppe. Wer einen Typ ins
 * Register einträgt und diese Liste vergisst, bekommt einen Typ, den es
 * gibt und den niemand auswählen kann. Kein Fehler, keine Meldung — nur
 * ein Eintrag, der im Menü fehlt.
 *
 * §2 prüft deshalb ZWEIERLEI: dass die Auffanggruppe heute leer ist (sonst
 * wäre sie eine Ausrede dafür, die Gliederung nicht zu pflegen), und dass
 * sie greift, wenn doch etwas dazukommt.
 *
 *   node pruefungen/lauf/test142.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8823;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

console.log('\n1 · Ziffer → Blockart kommt aus dem Register');

const ziffern = await seite.evaluate(() => {
  const z = (Register as any).bloecke.zifferZuTyp();
  /* Und die Gegenrichtung: was steht im `kurz`-Feld? */
  const ausKurz: Record<string, string> = {};
  (Register as any).bloecke.alle().forEach((x: any) => {
    const m = /^Ctrl\+Shift\+([0-9])$/.exec(String(x.kurz ?? ''));
    if (m && m[1]) ausKurz[m[1]] = x.id;
  });
  return { z, ausKurz, anzahl: Object.keys(z).length };
});

gleich('Zehn Ziffern sind belegt', (ziffern as any).anzahl, 10);
const soll: Record<string, string> = { '0': 'text', '1': 'h1', '2': 'h2', '3': 'h3',
  '4': 'todo', '5': 'bullet', '6': 'number', '7': 'toggle', '8': 'code', '9': 'page' };
for (const [z, typ] of Object.entries(soll))
  gleich(`Strg+Umschalt+${z} ist ${typ}`, (ziffern as any).z[z], typ);

/* Und die Übersicht, die der Mensch aufschlägt, nennt dieselbe Belegung. */
const uebersicht = await seite.evaluate(() =>
  (Register as any).tasten.flach()
    .filter((k: any) => /Shift 0-9|Shift 0–9/.test(k.taste)).length);
p('Die Kürzelübersicht führt die Ziffernbelegung', (uebersicht as any) >= 1,
  String(uebersicht));

/* DER PUNKT: es gibt keine zweite Zuordnung mehr im Editor. */
const editorTs = fs.readFileSync(path.join(WURZEL, 'src/bereiche/editor/ansicht/editor.ts'), 'utf8');
const kopien = editorTs.split('\n').filter(z =>
  /'0':\s*'text'/.test(z) && !/^\s*(\/\*|\*|\/\/|:)/.test(z)).length;
p('Im Editor steht die Zuordnung höchstens einmal — als Rückfall',
  kopien <= 1, `${kopien} Vorkommen`);
p('… und der Rückfall steht bei `ZIFFER_TYP`',
  /ZIFFER_TYP[\s\S]{0,400}'0':\s*'text'/.test(editorTs));

console.log('\n2 · Das Typmenü lässt nichts hinten runterfallen');

const gruppen = await seite.evaluate(() => {
  const g = (Datenbank as any).typGruppen();
  const genannt = new Set<string>(g.flatMap(([, ids]: any[]) => ids));
  const reg = (Register as any).eigenschaften.alle().map((x: any) => x.id);
  return {
    gruppen: g.map(([name]: any[]) => name),
    genannt: [...genannt],
    imRegister: reg,
    fehlt: reg.filter((id: string) => !genannt.has(id)),
    zuviel: [...genannt].filter(id => !reg.includes(id))
  };
});

p('Es gibt Gruppen im Typmenü', ((gruppen as any).gruppen ?? []).length >= 5,
  JSON.stringify((gruppen as any).gruppen));
gleich('Nur `title` fehlt — und zwar mit Absicht',
  JSON.stringify((gruppen as any).fehlt), '["title"]');
gleich('Und das Menü erfindet keinen Typ, den es nicht gibt',
  JSON.stringify((gruppen as any).zuviel), '[]');

/* Die Auffanggruppe muss heute LEER sein. Wäre sie es nicht, hiesse das:
   jemand hat einen Typ eingetragen und die Gliederung nicht gepflegt. */
p('Heute gibt es keine Auffanggruppe „Weiteres"',
  !((gruppen as any).gruppen ?? []).includes('Weiteres'),
  JSON.stringify((gruppen as any).gruppen));

/* Und sie greift, wenn doch etwas dazukommt — sonst wäre sie tot. */
const mitNeuem = await seite.evaluate(() => {
  const r = (Register as any).eigenschaften;
  const ging = r.melde({ id: 'probefeld', name: 'Probefeld', icon: '🧪' });
  const g = (Datenbank as any).typGruppen();
  const auffang = g.find(([name]: any[]) => name === 'Weiteres');
  return { ging, gruppen: g.map(([n]: any[]) => n),
           imAuffang: auffang ? auffang[1] : [] };
});
p('Ein neuer Typ lässt sich anmelden', (mitNeuem as any).ging === true);
p('… und landet in der Auffanggruppe, statt zu verschwinden',
  ((mitNeuem as any).imAuffang ?? []).includes('probefeld'),
  JSON.stringify((mitNeuem as any).gruppen));

/* Und er ist im gezeichneten Menü wirklich anklickbar. */
const imMenue = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Typmenü' });
  const db = Store.addDatabase(s.id, 'Probe', {
    title: { name: 'Titel', type: 'title' }, a: { name: 'Feld', type: 'text' }
  }, 'table');
  const coll = Store.getCollection(db.collectionId);
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  const anker = document.createElement('div');
  document.body.appendChild(anker);
  (Datenbank as any).typMenue(anker, coll, 'a');
  await new Promise(r => setTimeout(r, 300));
  /* `.menu` ist der Kasten, `.menu-grund` der dunkle Grund DARUNTER — der
     erste Anlauf suchte im Grund und fand null Knöpfe. */
  const knoepfe = [...document.querySelectorAll<HTMLElement>('.menu button[data-t]')]
    .map(b => b.dataset['t']);
  document.querySelectorAll('.menu, .menu-grund, .overlay').forEach(o => o.remove());
  return { knoepfe, hat: knoepfe.includes('probefeld'), wieViele: knoepfe.length };
});
p('Das gezeichnete Menü zeigt den neuen Typ',
  (imMenue as any).hat === true,
  `${(imMenue as any).wieViele} Knöpfe`);

/* ABMELDEN. Als dieser Lauf entstand, hatte `Register.eigenschaften` kein
   `nimmZurueck` — `Register.bloecke` schon, und der Probetyp blieb bis zum
   Neuladen im Katalog. Die Unwucht ist behoben; seither räumt der Lauf mit
   der echten Funktion auf und prüft dabei gleich ihre Grenzen. */
const abgemeldet = await seite.evaluate(() => {
  const r = (Register as any).eigenschaften;
  /* Eingebautes darf NICHT gehen — sonst verlöre jede Textspalte ihr Menü. */
  const eingebaut = r.nimmZurueck('text');
  const ging = r.nimmZurueck('probefeld');
  const nochmal = r.nimmZurueck('probefeld');
  const g = (Datenbank as any).typGruppen();
  return { eingebaut, ging, nochmal,
           gruppen: g.map(([n]: any[]) => n),
           hatProbe: g.some(([, ids]: any[]) => (ids as string[]).includes('probefeld')),
           textNochDa: !!r.eines('text') };
});
gleich('Eine eingebaute Feldart lässt sich NICHT abmelden',
  (abgemeldet as any).eingebaut, false);
p('… und ist noch da', (abgemeldet as any).textNochDa === true);
gleich('Der Probetyp lässt sich abmelden', (abgemeldet as any).ging, true);
gleich('… aber nur einmal', (abgemeldet as any).nochmal, false);
p('Danach ist er aus dem Typmenü verschwunden',
  (abgemeldet as any).hatProbe === false);
p('… und die Auffanggruppe damit auch',
  !((abgemeldet as any).gruppen ?? []).includes('Weiteres'),
  JSON.stringify((abgemeldet as any).gruppen));

console.log('\n3 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 106 — Kataloge aus dem Register: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
