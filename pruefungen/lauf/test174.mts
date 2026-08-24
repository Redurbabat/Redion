/* Suite 140 — Das A4-Blatt: ein Strich liegt überall gleich (E100)
 * ============================================================================
 * Der Block `blatt` ist ein Blatt Papier in A4, auf das man schreiben UND
 * malen kann: der Text sind gewöhnliche Redion-Blöcke darin, die Striche
 * liegen auf einer SVG-Schicht darüber.
 *
 * DIE FRAGE, AN DER ALLES HÄNGT: liegt ein Strich nach dem Speichern
 * wirklich dort, wo er gezogen wurde — auch bei anderer Fensterbreite?
 *
 * Die vorhandene Zeichenfläche beantwortet das mit Nein, ohne es zu sagen:
 * sie rechnet in rohen Bildschirmpunkten (`getBoundingClientRect`), und bei
 * halber Breite liegt jeder gespeicherte Strich doppelt so weit rechts.
 * Kein Fehler, keine Meldung — nur verrutscht. Das Blatt rechnet deshalb in
 * Blattpunkten über die Bildschirmmatrix des SVG.
 *
 *   node pruefungen/lauf/test174.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8919;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1400, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

const bau = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Blattprobe' });
  const b = Store.addBlock(s.id, 'blatt', { text: '' });
  Store.addBlock(b.id, 'text', { text: 'Aufgabe 1' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  return { seite: s.id, blatt: b.id };
});

console.log('\n1 · Das Blatt steht: Papier, Text darin, Zeichenschicht darüber');
const steht = await seite.evaluate(() => ({
  papier: !!document.querySelector('.blatt-papier'),
  marken: !!document.querySelector('svg.blatt-marken'),
  viewBox: document.querySelector('svg.blatt-marken')?.getAttribute('viewBox') || '(keine)',
  textDrin: (document.querySelector('.blatt-inhalt')?.textContent || '').includes('Aufgabe 1'),
  /* Zu Beginn wird geschrieben — die Schicht muss durchlässig sein. */
  durchlaessig: getComputedStyle(document.querySelector('svg.blatt-marken')!).pointerEvents
}));
p('Ein Blatt Papier ist da', (steht as any).papier);
p('Mit einer Zeichenschicht darüber', (steht as any).marken);
p('Die Schicht rechnet in Blattpunkten (viewBox)',
  /^0 0 595(\.\d+)? 84[12](\.\d+)?$/.test((steht as any).viewBox), (steht as any).viewBox);
p('Der Text steht auf dem Papier', (steht as any).textDrin);
gleich('Anfangs schreibt man durch die Schicht hindurch',
  (steht as any).durchlaessig, 'none');

console.log('\n2 · Derselbe Strich bei drei Fensterbreiten');

/* Zieht mit dem Zeiger von der Mitte des Papiers ein Stück nach rechts
   unten — in ANTEILEN des Papiers, nicht in Pixeln. Dann muss überall
   derselbe Blattpunkt herauskommen. */
const strichZiehen = async (vonX: number, vonY: number, bisX: number, bisY: number) => {
  const kasten = await seite.locator('.blatt-papier').boundingBox();
  if (!kasten) return null;
  const px = (ax: number) => kasten.x + kasten.width * ax;
  const py = (ay: number) => kasten.y + kasten.height * ay;
  await seite.mouse.move(px(vonX), py(vonY));
  await seite.mouse.down();
  for (let i = 1; i <= 6; i++)
    await seite.mouse.move(px(vonX + (bisX - vonX) * i / 6), py(vonY + (bisY - vonY) * i / 6));
  await seite.mouse.up();
  await seite.waitForTimeout(250);
  return true;
};

const malenAn = async () => {
  await seite.evaluate(() => {
    ([...document.querySelectorAll<HTMLElement>('.blatt-werk button')]
      .find(b => b.dataset.wz === 'stift'))?.click();
  });
};

const ersterPunkt = async (): Promise<number[] | null> =>
  seite.evaluate((id: string) => {
    const m = (Store.getBlock(id) || {}).marken || [];
    return m.length ? m[m.length - 1].pts[0] : null;
  }, bau.blatt);

const messungen: Array<{ breite: number; punkt: number[] | null }> = [];
for (const fenster of [1400, 900, 400]) {
  await seite.setViewportSize({ width: fenster, height: 900 });
  await seite.waitForTimeout(500);
  await seite.evaluate((arg: any) => { App.oeffne(arg.seite); }, bau);
  await seite.waitForTimeout(500);
  await malenAn();
  await strichZiehen(0.30, 0.30, 0.60, 0.55);
  messungen.push({ breite: fenster, punkt: await ersterPunkt() });
}
console.log('   ' + JSON.stringify(messungen));

p('Bei jeder Breite wurde ein Strich gespeichert',
  messungen.every(m => Array.isArray(m.punkt) && m.punkt.length === 2),
  JSON.stringify(messungen));

if (messungen.every(m => Array.isArray(m.punkt))) {
  const xs: number[] = messungen.map(m => Number((m.punkt as number[])[0]));
  const ys: number[] = messungen.map(m => Number((m.punkt as number[])[1]));
  const spanneX = Math.max(...xs) - Math.min(...xs);
  const spanneY = Math.max(...ys) - Math.min(...ys);
  console.log('   Abweichung: x ' + spanneX.toFixed(2) + ' pt, y ' + spanneY.toFixed(2) + ' pt');
  /* 2 pt sind 0,7 mm — das ist die Ungenauigkeit des Zeigers auf einem
     schmalen Fenster, nicht die der Rechnung. Wer in Bildschirmpunkten
     rechnete, läge bei 400 statt 1400 px um ein VIELFACHES daneben. */
  p('Der Startpunkt liegt überall auf demselben Blattpunkt (unter 2 pt)',
    spanneX < 2 && spanneY < 2,
    'x ' + spanneX.toFixed(2) + ' pt, y ' + spanneY.toFixed(2) + ' pt');
  p('Und er liegt wirklich im Blatt, nicht am Rand',
    xs.every(x => x > 100 && x < 400) && ys.every(y => y > 150 && y < 500),
    JSON.stringify({ xs, ys }));
}

console.log('\n3 · Beim Malen wird nicht die ganze Fläche neu gebaut');
await seite.setViewportSize({ width: 1200, height: 900 });
await seite.waitForTimeout(400);
await seite.evaluate((arg: any) => { App.oeffne(arg.seite); }, bau);
await seite.waitForTimeout(500);
await malenAn();
await seite.evaluate(() => {
  const svg = document.querySelector('svg.blatt-marken')!;
  let neu = 0;
  const w = new MutationObserver(ms => ms.forEach(m => { neu += m.addedNodes.length; }));
  w.observe(svg, { childList: true });
  (window as any).__stopp = () => { w.disconnect(); return neu; };
  return true;
});
/* Nicht 0,7 bis 0,8: ein A4-Blatt ist bei 1200 px Breite rund 1700 px
   hoch — der untere Teil liegt ausserhalb des Fensters, und der Zeiger
   käme dort nie an. Gemessen: der Strich wurde gar nicht erst gezogen. */
await strichZiehen(0.25, 0.20, 0.70, 0.38);
const zugefuegt = await seite.evaluate(() => (window as any).__stopp());
console.log('   neue Knoten während eines Strichs: ' + zugefuegt);
p('Ein Strich fügt genau EINEN Knoten hinzu', zugefuegt === 1,
  zugefuegt + ' Knoten — das Whiteboard baut hier alles neu');

console.log('\n4 · Die Striche überleben das Neuladen');
const vorher = await seite.evaluate((id: string) =>
  ((Store.getBlock(id) || {}).marken || []).length, bau.blatt);
await seite.reload();
await seite.waitForTimeout(2600);
const nachher = await seite.evaluate(async (arg: any) => {
  App.oeffne(arg.seite);
  await new Promise(r => setTimeout(r, 700));
  const b = Store.getBlock(arg.blatt) || {};
  return {
    marken: (b.marken || []).length,
    raumVersion: b.raumVersion,
    gezeichnet: document.querySelectorAll('svg.blatt-marken path[data-sid]').length
  };
}, bau);
console.log('   ' + JSON.stringify(nachher));
gleich('Alle Striche sind noch da', (nachher as any).marken, vorher);
gleich('… und werden auch wieder gezeichnet', (nachher as any).gezeichnet, vorher);
gleich('Die Raumfassung steht in den Daten', (nachher as any).raumVersion, 1);

console.log('\n5 · Der Radierer nimmt genau einen Strich weg');
const nachRadieren = await seite.evaluate(async (arg: any) => {
  ([...document.querySelectorAll<HTMLElement>('.blatt-werk button')]
    .find(b => b.dataset.wz === 'radierer'))?.click();
  const pfad = document.querySelector<SVGPathElement>('svg.blatt-marken path[data-sid]');
  const k = pfad!.getBoundingClientRect();
  pfad!.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, isPrimary: true, pointerId: 1,
    clientX: k.left + k.width / 2, clientY: k.top + k.height / 2 }));
  await new Promise(r => setTimeout(r, 300));
  return {
    marken: ((Store.getBlock(arg.blatt) || {}).marken || []).length,
    gezeichnet: document.querySelectorAll('svg.blatt-marken path[data-sid]').length
  };
}, bau);
gleich('Ein Strich weniger in den Daten', (nachRadieren as any).marken, vorher - 1);
gleich('… und einer weniger im Bild', (nachRadieren as any).gezeichnet, vorher - 1);

console.log('\n6 · Am Telefon: eine Zeile, erreichbare Flächen, kein Überstand');
/* §37 verlangt zu jeder Telefonleiste eine MESSUNG. Mit Wörtern brauchte
   diese Leiste bei 390 px drei Zeilen und verdeckte das halbe Papier —
   mit Augen gesehen, von keinem Prüflauf gemeldet (E81-Klasse). */
await seite.setViewportSize({ width: 390, height: 780 });
await seite.waitForTimeout(500);
await seite.evaluate((arg: any) => { App.oeffne(arg.seite); }, bau);
await seite.waitForTimeout(700);
const handy = await seite.evaluate(() => {
  const leiste = document.querySelector<HTMLElement>('.blatt-werk');
  if (!leiste) return null;
  const k = leiste.getBoundingClientRect();
  const knoepfe = [...leiste.querySelectorAll<HTMLElement>('button')];
  const masse = knoepfe.map(b => {
    const r = b.getBoundingClientRect();
    return { h: Math.round(r.height), b: Math.round(r.width) };
  });
  return {
    hoehe: Math.round(k.height),
    zeilen: Math.round(k.height / 44),
    kleinste: Math.min(...masse.map(m => Math.min(m.h, m.b))),
    ueberDenRand: Math.round(k.right) > document.documentElement.clientWidth,
    rollbar: leiste.scrollWidth > leiste.clientWidth,
    erreichbar: leiste.scrollWidth - leiste.clientWidth >= 0
  };
});
console.log('   ' + JSON.stringify(handy));
p('Die Leiste ist eine Zeile hoch (unter 60 px)',
  !!handy && (handy as any).hoehe < 60, JSON.stringify(handy));
p('Jede Fläche ist mindestens 44 px gross',
  !!handy && (handy as any).kleinste >= 44,
  'kleinste ' + (handy as any)?.kleinste + ' px');
p('Nichts steht über den rechten Rand hinaus',
  !!handy && !(handy as any).ueberDenRand);
p('Was nicht ins Bild passt, ist durch Rollen erreichbar',
  !!handy && (handy as any).erreichbar);

await seite.setViewportSize({ width: 1200, height: 900 });
await seite.waitForTimeout(300);

console.log('\n7 · Der Quelltext rechnet über die Bildschirmmatrix');
const raum = fs.readFileSync(path.join(WURZEL, 'src/core/sheet/space.ts'), 'utf8');
/* OHNE Kommentare messen: der Kopf dieser Datei ZITIERT die alte Rechnung
   als Beispiel. Der erste Zeuge fiel darauf herein und meldete einen
   Fehler, den es nicht gab — ein Zeuge, der Kommentare liest, bezeugt
   Prosa statt Code. */
const raumCode = raum.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
p('Die Umrechnung geht über getScreenCTM', raumCode.includes('getScreenCTM('));
p('Und im Code steht kein getBoundingClientRect',
  !raumCode.includes('getBoundingClientRect'),
  'im Kommentar darf es stehen, im Code nicht');
/* DIE ZEICHENSCHICHT LIEGT SEIT E103 IN `marken.ts`. Sie war zuerst hier im
   Blatt; als die PDF-Seite dieselbe brauchte, wurde sie herausgelöst statt
   abgeschrieben. Diese zwei Zeugen zeigen jetzt dorthin — dieselbe Zusage,
   eine Stelle statt zwei. Der Punkt darunter hält fest, dass das Blatt
   wirklich keine eigene Kopie mehr hat: zwei Kopien laufen auseinander, und
   die vergessene ist die, auf der gerade jemand malt (§34). */
const markenQ = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/pdf/marken.ts'), 'utf8');
p('Nur der Hauptzeiger malt', markenQ.includes('e.isPrimary'));
p('Abbrechen schliesst den Strich ab', markenQ.includes('pointercancel'));

const blattQ = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/bloecke/arten/blatt.ts'), 'utf8');
const blattCode = blattQ.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
p('Das Blatt hält keine zweite Zeichenschicht mehr',
  !blattCode.includes('pointerdown') && !blattCode.includes('pointermove'));
p('Sondern nimmt dieselbe wie die PDF-Seite',
  blattCode.includes('Marken.schicht('));

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
