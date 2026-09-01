/* Suite 296 — Escape schliesst das oberste Fenster (E302, L105 Punkt 1)
 * ============================================================================
 * DIESE SUITE HAT IHRE BEHAUPTUNG GEWECHSELT, und das ist ihr Wert.
 *
 * L105 Punkt 1 sagt: „Redion hat KEINEN gemeinsamen Escape-Griff für
 * `.overlay`. Der Wissensgraph und das Schlagwortregister schliessen bis
 * heute nicht auf Escape — man muss danebenklicken."
 *
 * Gebaut wurde daraufhin ein gemeinsamer Griff in `schale/ueberlagerung/`.
 * Beim Nachmessen zeigte sich: ES GIBT IHN LÄNGST. Er steht seit E272 Phase G
 * in `schale.ts` und nimmt das LETZTE `.menu`, sonst das letzte `.overlay` —
 * die Begründung dort ist sogar ausführlich („die oberste, nicht die erste").
 * Der neue Griff war eine zweite Zuständigkeit für dieselbe Sache und wurde
 * wieder ausgebaut; die Lücke ist berichtigt.
 *
 * ZWEI DINGE HABEN DAS VERSCHLEIERT, und beide gehören hierher:
 *
 *   Die Lücke wurde 2026 aus dem Gedächtnis geschrieben, nicht gemessen.
 *   `verweise.ts` hat zwei Treffer auf „Escape" — beide in der Linkvorschau.
 *   Daraus wurde „der Graph schliesst nicht", ohne die Schale anzusehen.
 *
 *   Und der erste Entwurf DIESER Prüfung war blind, auf genau dieselbe Art
 *   wie das Modul, das sie prüfen sollte: beide fragten `offsetParent !==
 *   null`, um zu wissen, ob ein Fenster sichtbar ist. Für ein Element mit
 *   `position:fixed` ist `offsetParent` IMMER null — und `.overlay` ist
 *   fixed. Die Prüfung zählte null offene Fenster, „Escape schliesst es"
 *   war 0 === 0 und damit grün. Eine Prüfung, die den Fehler des Geprüften
 *   teilt, sieht ihn nicht.
 *
 * Was hier ab jetzt bewacht wird, ist der BESTEHENDE Griff:
 *
 *   §1 DIE FENSTER AUS L105 schliessen auf Escape — gemessen, nicht geglaubt.
 *   §2 GENAU EINES, nicht zwei — auch wenn zwei übereinanderliegen.
 *   §3 EIN EIGENER GRIFF und der gemeinsame schliessen zusammen nur eines.
 *   §4 OHNE FENSTER TUT ESCAPE NICHTS.
 *   §5 DER ZÄHLER: wie viele Dateien ohne eigenen Griff daran hängen.
 *
 *   node pruefungen/lauf/test296.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Links: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9096;

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const a = Store.addPage(null, { text: 'Ohmsches Gesetz', icon: '⚡' });
  Store.addBlock(a.id, 'text', { text: 'Siehe [[Leistung]] und #elektro' });
  const b = Store.addPage(null, { text: 'Leistung', icon: '💡' });
  Store.addBlock(b.id, 'text', { text: 'Zurück zu [[Ohmsches Gesetz]] #elektro' });
  await Store.flush();
  App.oeffne(a.id);
  await new Promise(r => setTimeout(r, 700));
});

/* SICHTBAR HEISST: es nimmt Platz ein. NICHT `offsetParent !== null` — das
   ist für jedes `position:fixed` null, und `.overlay` ist fixed. Genau daran
   ist der erste Entwurf dieser Prüfung blind geworden. */
const offen = () => pc.evaluate(() =>
  [...document.querySelectorAll('.overlay')].filter(o => {
    const r = (o as HTMLElement).getBoundingClientRect();
    const st = getComputedStyle(o);
    return r.width > 0 && r.height > 0 && st.display !== 'none' &&
           st.visibility !== 'hidden';
  }).length);

const escape = async () => { await pc.keyboard.press('Escape'); await pc.waitForTimeout(400); };

/* ==========================================================================
 * §1 · Die Fenster aus L105
 * --------------------------------------------------------------------------
 * §55.2 — kann das rot werden? Ja: nimmt man den Griff in `schale.ts` heraus,
 * fällt jeder zweite Punkt hier. Gegengeprüft am 1. September 2026, indem
 * genau die vier Zeilen auskommentiert wurden.
 * ========================================================================*/
console.log('\n1 · Die Fenster aus L105 schliessen auf Escape');

await pc.evaluate(() => Links.graph());
await pc.waitForTimeout(900);
p('Der Wissensgraph geht auf', await offen() === 1, String(await offen()));
await escape();
p('Und Escape schliesst ihn', await offen() === 0, String(await offen()));

await pc.evaluate(() => Links.tagRegister());
await pc.waitForTimeout(700);
p('Das Schlagwortregister geht auf', await offen() === 1, String(await offen()));
await escape();
p('Und Escape schliesst es', await offen() === 0, String(await offen()));

/* ==========================================================================
 * §2 · Genau eines, nicht zwei
 * ========================================================================*/
console.log('\n2 · Genau eines, nicht zwei');

await pc.evaluate(() => {
  for (const name of ['unten', 'oben']) {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.dataset.probe = name;
    o.innerHTML = '<div class="finder" style="width:300px;padding:20px">' + name + '</div>';
    document.body.appendChild(o);
  }
});
await pc.waitForTimeout(200);
p('Zwei Fenster liegen übereinander', await offen() === 2, String(await offen()));
await escape();
const nachEinem = await pc.evaluate(() =>
  [...document.querySelectorAll('.overlay')].map(o => (o as HTMLElement).dataset.probe));
p('Escape nimmt nur das obere', JSON.stringify(nachEinem) === '["unten"]',
  JSON.stringify(nachEinem));
await escape();
p('Und der zweite Druck das untere', await offen() === 0, String(await offen()));

/* ==========================================================================
 * §3 · Ein eigener Griff behält Vorrang
 * --------------------------------------------------------------------------
 * DAS IST DER GEFÄHRLICHE FALL, und der Grund für die zwei Zuhörer. Etwa
 * zwanzig Fenster bringen ihren eigenen Escape-Griff mit, und manche hängen
 * daran mehr als ein `remove()` — der Eingabedialog löst ein Versprechen auf.
 * Käme dieser Griff ihm zuvor, bliebe der Aufrufer für immer warten.
 * ========================================================================*/
console.log('\n3 · Ein eigener Griff behält Vorrang');

const eigen = await pc.evaluate(async () => {
  const spur: string[] = [];
  for (const name of ['unten2', 'oben2']) {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.dataset.probe = name;
    o.innerHTML = '<div class="finder" style="width:300px;padding:20px">' + name + '</div>';
    document.body.appendChild(o);
  }
  const oben = document.querySelector<HTMLElement>('[data-probe="oben2"]')!;
  /* Ein eigener Griff, wie ihn zwanzig Fenster haben: an `document`, ohne
     `preventDefault`, und er räumt selbst auf. */
  const griff = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    spur.push('eigener Griff');
    oben.remove();
    document.removeEventListener('keydown', griff);
  };
  document.addEventListener('keydown', griff);
  (window as any).__spur = spur;
  return true;
});
p('Zwei Proben mit eigenem Griff stehen', eigen && await offen() === 2);
await escape();
const nachEigen = await pc.evaluate(() => ({
  uebrig: [...document.querySelectorAll('.overlay')].map(o => (o as HTMLElement).dataset.probe),
  spur: (window as any).__spur
}));
p('Der eigene Griff lief', JSON.stringify(nachEigen.spur) === '["eigener Griff"]',
  JSON.stringify(nachEigen.spur));
p('UND DAS DARUNTER BLIEB STEHEN — nicht zwei auf einen Druck',
  JSON.stringify(nachEigen.uebrig) === '["unten2"]', JSON.stringify(nachEigen.uebrig));
await escape();
p('Der nächste Druck nimmt dann das untere', await offen() === 0, String(await offen()));

/* ==========================================================================
 * §4 · Ohne Fenster tut Escape nichts
 * ========================================================================*/
console.log('\n4 · Ohne Fenster tut Escape nichts');

const vorher = await pc.evaluate(() => ({
  seite: App.aktuelleSeite(),
  kinder: document.body.children.length
}));
await escape();
await escape();
const nachher = await pc.evaluate(() => ({
  seite: App.aktuelleSeite(),
  kinder: document.body.children.length
}));
p('Die offene Seite bleibt offen', vorher.seite === nachher.seite);
p('Und am Seitenaufbau ändert sich nichts',
  vorher.kinder === nachher.kinder, `${vorher.kinder} → ${nachher.kinder}`);

/* ==========================================================================
 * §5 · Der Zähler
 * --------------------------------------------------------------------------
 * Kein Prüfpunkt, der rot wird, sondern eine Zahl im Bericht: wie viele
 * Dateien legen ein `.overlay` an, ohne einen eigenen Escape-Griff zu haben?
 * Vor E302 waren es 34 — und genau die hingen ohne diesen Griff in der Luft.
 * ========================================================================*/
console.log('\n5 · Der Zähler');

const zaehle = (): { dateien: number; ohne: number; stellen: number } => {
  const dateien: string[] = [];
  const lauf = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const pf = path.join(d, e.name);
      if (e.isDirectory()) lauf(pf);
      else if (e.name.endsWith('.ts')) dateien.push(pf);
    }
  };
  lauf(path.join(WURZEL, 'src'));
  let mit = 0, ohne = 0, stellen = 0;
  for (const f of dateien) {
    const t = fs.readFileSync(f, 'utf-8');
    const n = (t.match(/className\s*=\s*'overlay|className = "overlay|class="overlay/g) || []).length;
    if (!n) continue;
    stellen += n;
    if (/Escape/.test(t)) mit++; else ohne++;
  }
  return { dateien: mit + ohne, ohne, stellen };
};
const z = zaehle();
console.log(`   ${z.stellen} Stellen legen ein .overlay an, in ${z.dateien} Dateien.`);
console.log(`   ${z.ohne} davon haben keinen eigenen Escape-Griff — sie hängen`);
console.log('   seit E272 am gemeinsamen aus der Schale.');
p('Es gibt überhaupt Fenster zu zählen', z.stellen > 50, String(z.stellen));
/* Und der Griff steht dort, wo diese Suite ihn behauptet — an genau EINER
   Stelle. Ein zweiter wäre eine zweite Zuständigkeit für dieselbe Sache. */
const schale = fs.readFileSync(
  path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf-8');
const stellen = (schale.match(/letztes\('\.overlay'\)/g) || []).length;
p('Der gemeinsame Griff steht genau einmal in der Schale', stellen === 1,
  String(stellen));
p('Und niemand sonst hält einen zweiten',
  !fs.existsSync(path.join(WURZEL, 'src/schale/ueberlagerung/flucht.ts')));

/* ========================================================================== */
console.log('\n6 · Keine Fehler auf dem Weg');
p('Keine unbehandelten Ausnahmen', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} — Suite 296 (E302: Escape schliesst das oberste Fenster)`);
process.exit(weg ? 1 : 0);
