/* Suite 393 — „Zurück" und „Vor" rollen am Telefon nicht weg (E396, Audit F14)
 * ============================================================================
 * GEMESSEN AM 4. SEPTEMBER bei 390 × 844, im Dokumentmodus mit einem
 * A4-Blatt: DREIZEHN Werkzeuge, alle 44 px hoch (§37 stimmt), in einer
 * 368 px breiten Leiste mit 636 px Inhalt.
 *
 *   im Bild ohne Wischen   Schreiben · Auswahl · Stift · Marker · Form ·
 *                          Abdecken · Haftnotiz
 *   erst nach dem Wischen  Text · Fachzeichen · Bild · Radieren ·
 *                          RÜCKGÄNGIG · WIEDERHOLEN
 *
 * Die letzten zwei sind die Griffe, die man beim Schreiben von Hand am
 * häufigsten braucht — und sie sind keine Werkzeuge: sie ändern nicht, was
 * der Finger tut, sie nehmen zurück. Am Rechner stehen sie seit E359 in
 * einer eigenen Zeile; am Telefon gibt es keine zweite Zeile.
 *
 *   §1 Beide stehen im Bild, ohne zu wischen — an allen drei Hochformaten.
 *   §2 Und an BEIDEN Enden des Rollwegs (das hält die 44 px im Stilblatt).
 *   §3 Sie decken, was darunter durchrollt.
 *   §4 Am Rechner kleben sie nicht — die Gegenprobe.
 *   §5 Kein Knopf der Leiste ist unter 44 px (§37).
 *
 *   node pruefungen/lauf/test393.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9419;
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

const browser: Browser = await chromium.launch();

/** Eine Seite mit A4-Blatt im Dokumentmodus — dort steht die Blattleiste. */
const mitBlatt = async (w: number, h: number, handy = true): Promise<Page> => {
  const s = await browser.newPage(handy
    ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: w, height: h } });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await s.waitForFunction(`typeof App === 'object' && typeof DocumentMode === 'object'`,
                          null, { timeout: 20000 });
  await s.waitForTimeout(700);
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  await s.evaluate(`(async () => {
    App.neueSeite(); await new Promise(r => setTimeout(r, 450));
    Store.addBlock(App.aktuelleSeite(), 'block', { type: 'blatt', text: '' });
    App.zeichneSeite(); await new Promise(r => setTimeout(r, 450));
    DocumentMode.toggle(Store.getBlock(App.aktuelleSeite()), true);
    await new Promise(r => setTimeout(r, 700));
  })()`);
  await s.waitForSelector('.blatt-werk', { timeout: 10000 });
  await s.waitForTimeout(400);
  return s;
};

/** Stehen die zwei im Bild? Und wie sehen sie aus? */
/* SEIT E464 STANDEN DIE ZWEI IN DER ZEICHENLEISTE des Schreibtischs
   (`.document-drawingbar`); SEIT E572 stehen sie in der schwebenden Kapsel
   `.document-ink-history` über dem Papier — so zeigt es Redurs Referenz,
   und die Kapsel rollt nicht mit dem Werkzeugband mit.

   DIE ZUSAGE BLEIBT WÖRTLICH DIESELBE: im Bild, ohne zu wischen. Geändert
   ist nur, WO gesucht und WOGEGEN gemessen wird — und das zweite ist die
   ehrlichere Frage: „im Bild" heisst im FENSTER, nicht im Kasten der Leiste.
   Ein Knopf, der brav innerhalb seiner Leiste sitzt, während die Leiste
   neben dem Bildschirm steht, war nach der alten Rechnung „drin". Genau das
   ist mit E572 passiert: gemessen stand die Kapsel bei x = 1440 in einem
   1440 px breiten Fenster, und die alte Rechnung hätte es nie gemeldet.
   Die neue meldet es. */
const LAGE = `(() => {
  const l = document.querySelector('.document-drawingbar') || document.querySelector('.blatt-werk');
  const lr = l.getBoundingClientRect();
  const wurzel = document.querySelector('.document-studio') || document;
  const eins = (a) => {
    const b = wurzel.querySelector('[data-document-action="ink-' + a + '"]') || l.querySelector('[data-act="' + a + '"]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    return { drin: r.right <= window.innerWidth + 1 && r.left >= -1
                   && r.bottom <= window.innerHeight + 1 && r.top >= -1
                   && r.width > 1 && r.height > 1,
             links: Math.round(r.left), rechts: Math.round(r.right),
             oben: Math.round(r.top), unten: Math.round(r.bottom),
             breit: Math.round(r.width), hoch: Math.round(r.height), fenster: window.innerHeight,
             klebt: cs.position === 'sticky',
             deckt: cs.opacity === '1' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)',
             aus: b.disabled };
  };
  const kn = [...l.querySelectorAll('button')]
    .filter(b => getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().width > 1);
  return { undo: eins('undo'), redo: eins('redo'),
           roll: Math.round(l.scrollLeft), max: l.scrollWidth - l.clientWidth,
           zuKlein: kn.filter(b => { const r = b.getBoundingClientRect();
                                     return r.height < 44 || r.width < 44; })
                      .map(b => (b.dataset.act || b.dataset.wz || '?')) };
})()`;
type Knopf = { drin: boolean; links: number; rechts: number; oben: number; unten: number;
               breit: number; hoch: number; fenster: number; klebt: boolean;
               deckt: boolean; aus: boolean } | null;
type Lage = { undo: Knopf; redo: Knopf; roll: number; max: number; zuKlein: string[] };

/* ==========================================================================
 * §1 · Beide stehen im Bild, ohne zu wischen
 * ========================================================================*/
console.log('\n1 · Zurück und Vor stehen da, ohne zu wischen');
for (const [w, h] of [[360, 800], [390, 844], [428, 926]] as const) {
  const s = await mitBlatt(w, h);
  const l = await s.evaluate(LAGE) as Lage;
  p(`${w}×${h}: die Leiste rollt überhaupt`, l.max > 0, `${l.max} px Rollweg`);
  p(`${w}×${h}: „Zurück" im Bild`, !!l.undo && l.undo.drin,
    l.undo ? JSON.stringify(l.undo) : 'fehlt');
  p(`${w}×${h}: „Vor" im Bild`, !!l.redo && l.redo.drin,
    l.redo ? `${l.redo.links}…${l.redo.rechts}` : 'fehlt');
  await s.close();
}

/* ==========================================================================
 * §2 · Und an beiden Enden des Rollwegs
 * --------------------------------------------------------------------------
 * DER ABSCHNITT, DER DIE ZAHL IM STILBLATT HÄLT. `right: 44px` ist die
 * Knopfbreite ohne die Lücke; mit 48 klaffte ein Spalt, durch den die
 * Werkzeuge durchblitzten. Wer die Masse ändert, wird hier rot.
 * ========================================================================*/
console.log('\n2 · Auch ganz links und ganz rechts im Rollweg');
{
  const s = await mitBlatt(390, 844);
  const links = await s.evaluate(LAGE) as Lage;
  gleich('Ganz links: beide im Bild',
         [links.undo?.drin, links.redo?.drin], [true, true]);
  /* SIE STEHEN NEBENEINANDER. Bis E572 mussten sie sich BERÜHREN, weil sie
     im rollenden Band klebten und ein Spalt die Werkzeuge hätte durchblitzen
     lassen (E396). In der eigenen Kapsel gibt es nichts mehr, was durchrollt;
     dort ist ein paar Pixel Luft richtig. Geprüft wird deshalb, was die
     Zusage wirklich meint: sie gehören zusammen, also liegen sie dicht
     beieinander und in dieser Reihenfolge. */
  p('… und sie liegen dicht beieinander, Zurück vor Vor',
    !!links.undo && !!links.redo
    && links.redo.links >= links.undo.rechts - 1 && links.redo.links - links.undo.rechts <= 8,
    links.undo && links.redo ? `${links.undo.rechts} → ${links.redo.links}` : 'fehlt');

  await s.evaluate(`(() => { const l = document.querySelector('.document-drawingbar') || document.querySelector('.blatt-werk');
                             l.scrollLeft = l.scrollWidth; })()`);
  await s.waitForTimeout(400);
  const rechts = await s.evaluate(LAGE) as Lage;
  p('Ganz rechts ist wirklich ganz rechts', rechts.roll === rechts.max,
    `${rechts.roll} von ${rechts.max}`);
  gleich('Ganz rechts: beide im Bild',
         [rechts.undo?.drin, rechts.redo?.drin], [true, true]);
  await s.close();
}

/* ==========================================================================
 * §3 · Sie decken, was darunter durchrollt
 * --------------------------------------------------------------------------
 * GEFUNDEN AUF DEM BILD, NICHT IN EINER MESSUNG (§55.3): die zwei sind
 * meistens abgeschaltet, und `button[disabled]{opacity:.4}` — eine Regel für
 * JEDEN Knopf der App — machte auch ihren Hintergrund durchsichtig. Die
 * Werkzeuge darunter schienen durch, es sah aus wie ein Doppeldruck.
 * ========================================================================*/
console.log('\n3 · Und sie sind nicht durchsichtig');
{
  const s = await mitBlatt(390, 844);
  const l = await s.evaluate(LAGE) as Lage;
  p('„Zurück" ist gerade abgeschaltet — der interessante Fall',
    !!l.undo && l.undo.aus);
  p('… deckt aber trotzdem', !!l.undo && l.undo.deckt);
  p('„Vor" ebenso', !!l.redo && l.redo.deckt);
  await s.close();
}

/* ==========================================================================
 * §4 · Am Rechner kleben sie nicht — die Gegenprobe
 * --------------------------------------------------------------------------
 * Dort gibt es seit E359 zwei Zeilen; ein klebender Knopf wäre ein
 * Fremdkörper und würde die zweite Zeile überdecken.
 * ========================================================================*/
console.log('\n4 · Am Rechner klebt nichts');
{
  const s = await mitBlatt(1360, 900, false);
  const l = await s.evaluate(LAGE) as Lage;
  gleich('Weder „Zurück" noch „Vor" klebt',
         [l.undo?.klebt, l.redo?.klebt], [false, false]);
  gleich('Und es gibt dort auch nichts zu rollen', l.max, 0);
  await s.close();
}

/* ==========================================================================
 * §5 · Kein Knopf unter 44 px (§37)
 * ========================================================================*/
console.log('\n5 · Die Fingerziele bleiben gross genug');
{
  const s = await mitBlatt(360, 800);
  const l = await s.evaluate(LAGE) as Lage;
  gleich('Kein sichtbarer Knopf ist kleiner als 44 px', l.zuKlein, []);
  await s.close();
}

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
