/* Suite 149 — Die Präsentation zeigt, was auf der Seite steht (E109, L38)
 * ============================================================================
 * `Werkzeuge.praesentation` baut Folien über eine EIGENE Kette von
 * Blockarten, getrennt von der des Exports. Dass es zwei gibt, ist nicht
 * falsch: Folien sind ein anderes Medium als Fliesstext. Falsch war, dass
 * die eine mitwuchs und die andere beim Stand von damals stehen blieb.
 *
 * Was auf einer Folie nicht vorkam: Tabelle, Datenbank, PDF-Seite, A4-Blatt.
 * Und schlimmer: `sammle` stieg in Spalten gar nicht erst hinab. Eine
 * Schulaufgabe liegt seit E104 IMMER in Spalten — als Vortrag war sie also
 * vollständig leer. Nicht kaputt, nicht gemeldet: leer.
 *
 * DER WIEDERKEHRENDE BEFUND DIESES PROJEKTS ist nicht „etwas vergessen",
 * sondern „an einer Stelle getan und an der Nachbarstelle nicht" — und diese
 * Suite ist dafür da, dass die Nachbarstelle diesmal mitkommt.
 *
 *   node pruefungen/lauf/test183.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8928;

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

const PNG_ROT = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAF0lEQVQI12P8' +
                'z8Dwn4EIwESMolGFxCkEAFN8Aze9ZlBFAAAAAElFTkSuQmCC';

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1400, height: 900 });
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

/* Eine Schulaufgabe wie E104 sie baut, plus eine einfache Tabelle. */
const gebaut = await seite.evaluate(async (b64: string) => {
  const s = Store.addPage(null, { text: 'Vortrag' });

  const roh = atob(b64);
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  const satz = await Dateien.ablegen(
    new File([bytes], 'seite-1.png', { type: 'image/png' }),
    { blockId: s.id, abgeleitet: true });

  Store.addBlock(s.id, 'h1', { text: 'Erste Folie' });
  Store.addBlock(s.id, 'text', { text: 'Ein gewöhnlicher Satz.' });

  Store.addBlock(s.id, 'h1', { text: 'Die Aufgabe' });
  const c = Store.addBlock(s.id, 'columns', { text: '', spalten: 2 });
  const links = Store.addBlock(c.id, 'spalte', { text: '' });
  const rechts = Store.addBlock(c.id, 'spalte', { text: '' });
  const pdf = Store.addBlock(links.id, 'pdfseite', {
    text: '', nr: 7, vonSeiten: 9, bw: 595, bh: 842,
    bildDateiId: satz.id, quelleId: 'q1',
    marken: [{ id: 'p1', art: 'stift', farbe: '#d64545', breite: 2.4,
               pts: [[80, 300], [500, 340]] }] });
  const blatt = Store.addBlock(rechts.id, 'blatt', {
    text: '', blattBreite: 595, blattHoehe: 842,
    marken: [{ id: 'b1', art: 'stift', farbe: '#2f7ed8', breite: 5,
               pts: [[60, 100], [520, 180]] }] });
  Store.addBlock(blatt.id, 'text', { text: 'Meine Antwort: x = 11' });

  Store.addBlock(s.id, 'h1', { text: 'Die Zahlen' });
  /* Das Feld heisst `rows` — nachgesehen in `tabelleHtml`, nicht geraten
     (E21). Der erste Entwurf schrieb `zeilen`, und die Tabelle stand dann
     zwar da, aber leer: eine Prüfung, die nur `querySelectorAll('table')`
     zählt, hätte das durchgewinkt. */
  Store.addBlock(s.id, 'table', {
    text: '', rows: [['Jahr', 'Wert'], ['2025', '12'], ['2026', '19']] });

  App.oeffne(s.id);
  return { seite: s.id, pdf: pdf.id, blatt: blatt.id };
}, PNG_ROT);
await seite.waitForTimeout(600);

/* ==========================================================================
 * §1 · Die Folien entstehen überhaupt
 * ========================================================================*/
console.log('\n1 · Die Folien entstehen überhaupt');

await seite.evaluate((sid: string) => Werkzeuge.praesentation(Store.getBlock(sid)),
  gebaut.seite);
await seite.waitForSelector('.praesi .folie', { timeout: 20000 });

const folienZahl = await seite.evaluate(() =>
  Number((document.querySelector('.praesi-leiste span')?.textContent || '0/0')
    .split('/')[1]));
/* DREI, nicht vier: die Seite beginnt mit einer Überschrift 1, und eine
   Trennung ganz am Anfang lässt die leere Auftaktfolie weg — so gebaut, und
   richtig so. Der erste Entwurf erwartete vier und zählte die Auftaktfolie
   mit, die es gar nicht gibt. */
gleich('Drei Folien — Erste, Aufgabe, Zahlen', folienZahl, 3);

const folie1 = await seite.evaluate(() =>
  document.querySelector('.praesi .folie')?.textContent || '');
p('Die erste zeigt ihren Satz', /gewöhnlicher Satz/.test(folie1), folie1.slice(0, 60));

/* ==========================================================================
 * §2 · Die Aufgabenfolie ist nicht leer
 * --------------------------------------------------------------------------
 * DER PUNKT DIESER SUITE. Vorher sammelte `sammle` den Spaltenblock ein und
 * stieg nicht hinab; auf der Folie stand daraufhin nichts.
 * ========================================================================*/
console.log('\n2 · Die Aufgabenfolie ist nicht leer');

await seite.evaluate(() =>
  (document.querySelector('.praesi-leiste [data-a="zurueck"]') as HTMLElement)?.click());
await seite.waitForTimeout(300);

const aufgabe = await seite.evaluate(() => {
  const f = document.querySelector('.praesi .folie')!;
  return {
    titel: f.querySelector('h1')?.textContent || '',
    html: f.innerHTML,
    blaetter: f.querySelectorAll('.folie-blatt').length,
    bilder: f.querySelectorAll('.folie-blatt img').length,
    striche: f.querySelectorAll('.folie-blatt svg.marken path').length,
    spalten: f.querySelectorAll('.folie-spalte').length,
    obenLinks: Math.round((f.querySelectorAll('.folie-blatt')[0]
      ?.getBoundingClientRect().top) || 0),
    obenRechts: Math.round((f.querySelectorAll('.folie-blatt')[1]
      ?.getBoundingClientRect().top) || 0),
    hoechstes: Math.round(Math.max(...[...f.querySelectorAll('.folie-blatt')]
      .map(x => x.getBoundingClientRect().height))),
    hoehen: [...f.querySelectorAll('.folie-blatt')]
      .map(x => Math.round(x.getBoundingClientRect().height)),
    breiten: [...f.querySelectorAll('.folie-blatt')]
      .map(x => Math.round(x.getBoundingClientRect().width)),
    bildHoehe: Math.round((f.querySelector('.folie-blatt img') as HTMLElement)
      ?.getBoundingClientRect().height || 0),
    bildEcken: getComputedStyle(
      f.querySelector('.folie-blatt img') as HTMLElement).borderTopLeftRadius,
    folieHoehe: Math.round(f.getBoundingClientRect().height),
    text: f.textContent || ''
  };
});

gleich('Es ist die Aufgabenfolie', aufgabe.titel, 'Die Aufgabe');
p('Sie ist nicht leer', aufgabe.text.replace(/\s/g, '').length > 20,
  JSON.stringify(aufgabe.text.slice(0, 60)));
gleich('Zwei Blätter stehen darauf', aufgabe.blaetter, 2);
gleich('Und zwar nebeneinander, in zwei Spalten', aufgabe.spalten, 2);
p('Sie liegen auf derselben Höhe',
  Math.abs(aufgabe.obenLinks - aufgabe.obenRechts) < 8,
  `${aufgabe.obenLinks} gegen ${aufgabe.obenRechts}`);
p('Und passen zusammen in die Folie',
  aufgabe.hoechstes <= aufgabe.folieHoehe,
  `${aufgabe.hoechstes} px Blatt in ${aufgabe.folieHoehe} px Folie`);
/* ZWEI GLEICH GROSSE A4-SEITEN MÜSSEN GLEICH HOCH STEHEN. Taten sie nicht:
   442 gegen 541 px, weil `.praesi img{max-height:52vh}` das Seitenbild
   deckelte und damit sein Seitenverhältnis brach. Mit Augen gesehen, dann
   gemessen (§55). */
const [h1, h2] = [aufgabe.hoehen[0] ?? 0, aufgabe.hoehen[1] ?? 0];
const b1 = aufgabe.breiten[0] ?? 1;
p('Beide sind gleich hoch — es sind zwei A4-Seiten',
  Math.abs(h1 - h2) <= 2, `${h1} gegen ${h2}`);
p('Und ihre Höhe folgt der Breite im A4-Verhältnis',
  Math.abs(h1 / b1 - 842 / 595) < 0.05, `${b1} × ${h1}`);
/* UND DAS BILD FÜLLT SEINEN KASTEN. Das Seitenverhältnis am Kasten allein
   genügt nicht: `.praesi img{max-height:52vh}` deckelt weiterhin das Bild
   DARIN, und dann steht die Seite oben im Kasten und unten bleibt Papier
   übrig. Auf dem Bildschirm sieht das aus wie eine falsch beschnittene
   Seite. Der Kasten misst hier also nichts — das Bild muss gemessen
   werden. */
p('Das Seitenbild füllt seinen Kasten aus',
  Math.abs(aufgabe.bildHoehe - h1) <= 2,
  `Bild ${aufgabe.bildHoehe} px in einem Kasten von ${h1} px`);
p('Und hat keine runden Ecken — ein Aufgabenblatt hat keine',
  aufgabe.bildEcken === '0px', aufgabe.bildEcken);
gleich('Eines davon mit dem Seitenbild', aufgabe.bilder, 1);
gleich('Und beide Striche sind da', aufgabe.striche, 2);
p('Die Antwort vom Notizblatt steht darauf',
  /Meine Antwort: x = 11/.test(aufgabe.text));
p('Der Spaltenblock selbst steht NICHT als Kasten darauf',
  !/spalten-block/.test(aufgabe.html));

/* GEGENPROBE: die Striche sind die gespeicherten, nicht neu erfundene. */
p('Gegenprobe: der rote Strich hat die gespeicherten Punkte',
  /M80 300 L500 340/.test(aufgabe.html),
  (aufgabe.html.match(/d="M[^"]{0,30}/) || [''])[0]);

/* ==========================================================================
 * §3 · Und die Tabelle ebenso
 * ========================================================================*/
console.log('\n3 · Und die Tabelle ebenso');

await seite.evaluate(() =>
  (document.querySelector('.praesi-leiste [data-a="zurueck"]') as HTMLElement)?.click());
await seite.waitForTimeout(300);

const zahlen = await seite.evaluate(() => {
  const f = document.querySelector('.praesi .folie')!;
  return { titel: f.querySelector('h1')?.textContent || '',
           tabellen: f.querySelectorAll('table').length,
           text: f.textContent || '' };
});

gleich('Es ist die Zahlenfolie', zahlen.titel, 'Die Zahlen');
gleich('Eine Tabelle steht darauf', zahlen.tabellen, 1);
p('Mit ihren Werten', /2026/.test(zahlen.text) && /19/.test(zahlen.text),
  zahlen.text.slice(0, 80));

await seite.keyboard.press('Escape');
await seite.waitForTimeout(300);
gleich('Escape beendet den Vortrag',
  await seite.evaluate(() => document.querySelectorAll('.praesi').length), 0);

/* ==========================================================================
 * §4 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n4 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const werk = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/wissen/werkzeuge.ts'), 'utf8'));

/* DIE REGEL IST UMGEZOGEN (E297), und dieser Punkt mit ihr. Bis dahin stand
   sie mitten im Vortragsmodus in `werkzeuge.ts`; seit es einen zweiten Weg
   gibt — den .pptx-Export —, steht sie in `src/core/slides/folien.ts` und
   wird von beiden geholt. Zwei Teilungen, die auseinanderlaufen, wären
   schlimmer als eine gewesen.

   Der Punkt prüft deshalb ZWEI Dinge statt einem: dass die Regel im Kern
   steht, und dass der Vortragsmodus sie dort abholt statt eine eigene zu
   führen. Nur das zusammen ist die Zusage, die hier gemeint war. */
const kern = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/core/slides/folien.ts'), 'utf8'));
p('Spalten bleiben Spalten und zeichnen ihren Inhalt selbst — im Kern',
  /\['columns', 'columns3', 'blatt'\]/.test(kern) ||
  /\['columns','columns3','blatt'\]/.test(kern));
p('Und der Vortragsmodus holt die Regel dort ab',
  /Folien\.teilen\(/.test(werk));
p('Und `folieBlock` weiss, wie eine Spalte aussieht',
  /folie-spalten/.test(werk) && /folie-spalte/.test(werk));
p('Die Striche kommen auch hier aus einer Stelle',
  (werk.match(/markenAlsSvg\(b, b/g) || []).length >= 2);
p('Für den Bildschirm genügt die blob-Adresse',
  /bilderSammeln\(p, false\)/.test(werk));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
