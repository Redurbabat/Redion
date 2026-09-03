/* Suite 368 — Der Merkzettel klont nicht mehr, er friert ein (E378)
 * ============================================================================
 * BEFUND, GEMESSEN NACH E376 UND E377:
 *
 *   `snapshot()` klonte die GANZE Seite — bei JEDEM Aufsetzen des Stifts,
 *   und `commit()` schrieb sie danach zweimal als Zeichenkette aus, nur um
 *   die Frage „hat sich etwas geändert?" zu beantworten.
 *
 *       400 Striche   4,28 ms klonen + 3,74 ms vergleichen =  8,0 ms
 *       800 Striche  11,96 ms klonen + 11,46 ms vergleichen = 23,4 ms
 *
 *   23 ms sind fast drei Bilder bei 120 Hz — jedes Mal beim Aufsetzen und
 *   noch einmal beim Abheben. Und zwar umso mehr, je voller die Seite ist:
 *   genau die Seite, auf der man am längsten geschrieben hat, wird am
 *   zähesten.
 *
 * DIE ANTWORT IST EINE REGEL, NICHT EINE OPTIMIERUNG:
 *
 *     Eine Marke, die in `marks` steht, wird nie mehr von innen geändert.
 *     Sie wird ERSETZT.
 *
 * Dann braucht der Merkzettel die Marken nicht zu klonen — er braucht nur
 * die Liste. Und damit die Regel keine Behauptung bleibt, FRIERT `snapshot()`
 * ein, was es weggibt: wer danach doch von innen ändert, bekommt in
 * `"use strict"` einen Fehler statt eines stillen Datenverlusts.
 *
 * Denn still wäre er: der Merkzettel zeigte schon die Änderung, und
 * „Zurück" holte nichts zurück. Das ist §51 in einem Satz.
 *
 * §1 DIE REGEL STEHT IM QUELLTEXT — flach, eingefroren, ersetzt.
 * §2 SECHS WEGE, DIE FRÜHER ÄNDERTEN: tun, zurück, und der alte Wert ist da.
 * §3 UND ES KOSTET NICHT MEHR DIE GANZE SEITE — auf der echten Seite gemessen.
 *
 *   node pruefungen/lauf/test368.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Dialog: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9399;
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};
const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const rein = decodeURIComponent((req.url || '/').split('?')[0] || '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); res.end('weg'); return;
  }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] || 'application/octet-stream' });
  res.end(fs.readFileSync(datei));
});
await new Promise<void>(fertig => server.listen(PORT, fertig));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

console.log('\n1 · Die Regel steht im Quelltext');

const ohneWorte = (x: string): string => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const js = ohneWorte(fs.readFileSync(path.join(WURZEL, 'quell/bereiche/pdf/marken.js'), 'utf-8'));
p('Der Merkzettel klont nicht mehr die ganze Seite',
  !/const snapshot = \(\) => clone\(marks\)/.test(js));
p('… er nimmt die Liste flach', /const snapshot = [\s\S]{0,200}marks\.slice\(\)/.test(js));
p('… und friert ein, was er weggibt', /const snapshot = [\s\S]{0,400}Object\.freeze/.test(js));
p('… auch die Punktlisten, nicht nur die Marke',
  /const snapshot = [\s\S]{0,400}Object\.freeze\(mark\.pts\)/.test(js));
p('Der Vergleich schreibt nicht mehr zweimal die ganze Seite aus',
  !/JSON\.stringify\(before\) === JSON\.stringify\(marks\)/.test(js));
p('… sondern bricht beim ersten Unterschied ab', /listenGleich/.test(js));
p('Zurückholen klont auch nicht mehr',
  !/marks\.splice\(0, marks\.length, \.\.\.clone\(next\)\)/.test(js));

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', (e: Error) => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1000);
const blattId = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  const s = Store.addPage(null, { text: 'Merkzettel' });
  const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
  App.oeffne(s.id);
  return b.id as string;
});
await seite.waitForTimeout(900);

console.log('\n2 · Wege, die früher änderten: tun, zurück, alter Wert da');

/* FARBE UND BREITE hält bereits `test345` §4 (E353) — ein Strich wählen,
   umfärben, zweimal zurück. Hier stehen die Wege, die dort NICHT vorkommen
   und die beim Einfrieren aufgefallen sind: der Textkasten (E360), die
   Haftnotiz (E267) und die Drehung eines Fachzeichens (E-Punkt 42). Der
   letzte hat den Merkzettel wirklich rot gemacht: `Cannot assign to read
   only property 'drehung'`. */
const kasten = (await seite.locator('.blatt-marken').boundingBox())!;
const marken = (): Promise<any[]> => seite.evaluate((id: string) =>
  ((Store.getBlock(id)?.marken || []) as any[]).map(m => ({ ...m })), String(blattId));
const zurueck = async (): Promise<void> => {
  await seite.click('.blatt-werk [data-act="undo"]');
  await seite.waitForTimeout(250);
};
const antwortet = (text: string | null): Promise<void> => seite.evaluate((t: string | null) => {
  (Dialog as any).mehrzeilig = async () => t;
  (Dialog as any).frage = async () => t;
}, text);

/* a) DER TEXTKASTEN (E360) */
await antwortet('Hallo Welt');
await seite.click('.blatt-werk [data-wz="text"]');
await seite.mouse.click(kasten.x + 120, kasten.y + 120);
await seite.waitForTimeout(500);
const textMarke = (await marken()).find(m => m.art === 'text');
p('Ein Textkasten ist entstanden', !!textMarke && textMarke.text === 'Hallo Welt',
  JSON.stringify(textMarke || null).slice(0, 100));
if (textMarke) {
  await antwortet('Anderer Text');
  /* AUF DEN KNOTEN ZIELEN, NICHT AUF DEN GESETZTEN PUNKT: `point` ist die
     linke OBERE Ecke des Kastens, und der Kasten steht in Blattkoordinaten,
     nicht in Bildschirmkoordinaten. Ein Tipp daneben öffnete nichts — und
     die Zusage darunter sagte trotzdem „ja", weil sich nichts geändert
     hatte. Genau die Sorte Prüfung, die §55.2 meint. */
  const feld = await seite.locator('.blatt-marken [data-ink-art="text"]').first().boundingBox();
  p('Der Textkasten ist auf der Fläche zu treffen', !!feld, JSON.stringify(feld));
  if (feld) await seite.mouse.click(feld.x + feld.width / 2, feld.y + feld.height / 2);
  await seite.waitForTimeout(600);
  const jetzt = (await marken()).find(m => m.id === textMarke.id);
  p('Der Text lässt sich ändern', jetzt?.text === 'Anderer Text', String(jetzt?.text));
  await zurueck();
  gleich('… und Zurück holt den alten Text zurück',
    (await marken()).find(m => m.id === textMarke.id)?.text, 'Hallo Welt');
}

/* b) DIE HAFTNOTIZ (E267) */
await antwortet('Merke!');
await seite.click('.blatt-werk [data-wz="zettel"]');
await seite.mouse.move(kasten.x + 60, kasten.y + 300);
await seite.mouse.down();
await seite.mouse.move(kasten.x + 200, kasten.y + 380);
await seite.mouse.up();
await seite.waitForTimeout(600);
const zettel = (await marken()).find(m => m.art === 'zettel');
p('Eine Haftnotiz ist entstanden und trägt ihren Text',
  !!zettel && zettel.text === 'Merke!', JSON.stringify(zettel || null).slice(0, 100));

/* c) DAS FACHZEICHEN — die Stelle, die der eingefrorene Merkzettel gefunden
   hat. Der WEG wird hier nicht gefahren: das Werkzeug öffnet einen Wähler,
   und `test242` fährt ihn bereits ganz (Tipp dreht, Drehung steht im Block).
   Hier steht nur, dass die Stelle nicht mehr ändert, sondern ersetzt — der
   Fehler, den sie warf, war `Cannot assign to read only property 'drehung'`. */
p('Die Drehung eines Fachzeichens wird ersetzt, nicht geändert',
  !/vorhanden\.drehung\s*=/.test(js) && /drehung:\s*\(\(Number\(vorhanden\.drehung\)/.test(js));

console.log('\n3 · Und es kostet nicht mehr die ganze Seite');

/* Ein Strich auf einer LEEREN Seite gegen einen auf einer VOLLEN. Klonte der
   Merkzettel noch, wüchse der Preis mit der Seite — genau das war der Befund. */
const zeitFuerEinenStrich = async (): Promise<number> => {
  await seite.click('.blatt-werk [data-wz="stift"]');
  return await seite.evaluate((k: { x: number; y: number }) => {
    const flaeche = document.querySelector('.blatt-marken')!;
    const senden = (typ: string, x: number, y: number): void => {
      flaeche.dispatchEvent(new PointerEvent(typ, { pointerId: 1, isPrimary: true,
        pointerType: 'pen', clientX: x, clientY: y, bubbles: true, pressure: 0.5 }));
    };
    const t0 = performance.now();
    for (let n = 0; n < 12; n++) {
      senden('pointerdown', k.x + 40, k.y + 400 + n);
      for (let i = 1; i <= 6; i++) senden('pointermove', k.x + 40 + i * 20, k.y + 400 + n);
      senden('pointerup', k.x + 160, k.y + 400 + n);
    }
    return performance.now() - t0;
  }, { x: kasten.x, y: kasten.y });
};
const leer = await zeitFuerEinenStrich();
await seite.evaluate((id: string) => {
  const b = Store.getBlock(id);
  const viele = (b.marken || []).slice();
  for (let m = 0; m < 500; m++) {
    const pts: number[][] = [];
    for (let i = 0; i < 20; i++) pts.push([(m % 20) * 25 + i, Math.floor(m / 20) * 18 + Math.sin(i) * 4]);
    viele.push({ id: 'voll' + m, art: 'stift', farbe: '#111', breite: 2, pts,
                 pressure: pts.map(() => 0.5), stil: 'fueller' });
  }
  Store.updateBlock(id, { marken: viele });
  App.zeichneSeite?.();
}, String(blattId));
await seite.waitForTimeout(1500);
const voll = await zeitFuerEinenStrich();
console.log(`     zwölf Striche: leere Seite ${leer.toFixed(0)} ms · volle Seite (500+) ${voll.toFixed(0)} ms`);
p('Eine volle Seite kostet nicht ein Vielfaches einer leeren',
  voll < Math.max(60, leer * 4), `leer ${leer.toFixed(0)} ms, voll ${voll.toFixed(0)} ms`);

p('Keine Fehler auf der Seite — jede vergessene Stelle stünde hier',
  fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
