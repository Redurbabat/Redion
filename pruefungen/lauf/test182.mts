/* Suite 148 — Eine beschriebene Seite lässt sich weitergeben (E108)
 * ============================================================================
 * Redurs Satz war „die aufgaben lösen". Danach kommt: abgeben. Und genau da
 * hörte Redion auf — wer eine Schulaufgabe mit Strg + P druckte, bekam die
 * Notizzeilen und NICHTS von dem Blatt, auf dem sie stehen. Kein Seitenbild,
 * keinen einzigen Strich.
 *
 * Nicht hässlich, sondern leer. `seiteAlsHtml` kennt eine Kette von
 * Blockarten, und `pdfseite` und `blatt` standen nicht darin; beide haben
 * keinen `text`, fielen also durch jede Bedingung hindurch.
 *
 * DIESE SUITE DRUCKT NICHT WIRKLICH — sie liest, was im Druckrahmen steht.
 * Das ist genau die Frage: was der Drucker bekommt, steht in diesem
 * Dokument, und ob der Drucker danach Papier auswirft, ist Sache des
 * Druckers.
 *
 *   node pruefungen/lauf/test182.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9513;

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
const seite = await browser.newPage({ acceptDownloads: true });
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

/* --------------------------------------------------------------------------
 * Eine Schulaufgabe, wie E104 sie baut: je Seite ein Spaltenblock mit der
 * PDF-Seite links und einem Notizblatt rechts. Auf beiden ein Strich, im
 * Blatt eine getippte Antwort.
 *
 * Das „Seitenbild" ist hier ein winziges echtes PNG. Ein PDF zu rastern
 * dauerte Sekunden und prüfte nichts von dem, worum es hier geht — dass das
 * Bild im Druckdokument LANDET, hängt nicht daran, woher es kam.
 * ------------------------------------------------------------------------*/
const PNG_ROT = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAF0lEQVQI12P8' +
                'z8Dwn4EIwESMolGFxCkEAFN8Aze9ZlBFAAAAAElFTkSuQmCC';

const gebaut = await seite.evaluate(async (b64: string) => {
  const s = Store.addPage(null, { text: 'Schulaufgabe Woche 12' });

  const roh = atob(b64);
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  const satz = await Dateien.ablegen(
    new File([bytes], 'seite-1.png', { type: 'image/png' }),
    { blockId: s.id, abgeleitet: true });

  const c = Store.addBlock(s.id, 'columns', { text: '', spalten: 2 });
  const links = Store.addBlock(c.id, 'spalte', { text: '' });
  const rechts = Store.addBlock(c.id, 'spalte', { text: '' });

  const pdf = Store.addBlock(links.id, 'pdfseite', {
    text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842,
    bildDateiId: satz.id, quelleId: 'q1',
    suchtext: 'Aufgabe 1: Loese 3x + 12 = 45',
    marken: [{ id: 'p1', art: 'stift', farbe: '#d64545', breite: 2.4,
               pts: [[80, 300], [500, 340]] }] });

  const blatt = Store.addBlock(rechts.id, 'blatt', {
    text: '', blattBreite: 595, blattHoehe: 842,
    marken: [{ id: 'b1', art: 'stift', farbe: '#2f7ed8', breite: 5,
               pts: [[60, 100], [520, 180], [300, 400]] }] });
  Store.addBlock(blatt.id, 'text', { text: 'x = 11, denn 3 mal 11 sind 33' });

  App.oeffne(s.id);
  return { seite: s.id, pdf: pdf.id, blatt: blatt.id, datei: satz.id };
}, PNG_ROT);
await seite.waitForTimeout(600);

/* Was der Drucker bekäme: der Rahmen wird gebaut, aber `print()` abgefangen. */
const druckDoc = await seite.evaluate(async (sid: string) => {
  const rahmenVorher = document.querySelectorAll('iframe').length;
  /* `print()` würde den Lauf anhalten — also stillgelegt. */
  const echt = window.HTMLIFrameElement;
  void echt;
  const p2 = Store.getBlock(sid);
  /* Den Rahmen selbst bauen lassen und dann auslesen, bevor er verschwindet. */
  const fertig = new Promise<string>(loese => {
    const beobachter = new MutationObserver(() => {
      const rahmen = [...document.querySelectorAll('iframe')];
      if (rahmen.length <= rahmenVorher) return;
      const d = (rahmen[rahmen.length - 1] as HTMLIFrameElement).contentDocument;
      if (d && d.body && d.body.innerHTML) {
        beobachter.disconnect();
        loese(d.documentElement.outerHTML);
      }
    });
    beobachter.observe(document.body, { childList: true, subtree: true });
  });
  /* Drucken auslösen, aber den Dialog nicht öffnen. */
  const alteFenster = Object.getOwnPropertyDescriptor(Window.prototype, 'print');
  void alteFenster;
  Werkzeuge.drucken(p2);
  const html = await Promise.race([fertig,
    new Promise<string>(l => setTimeout(() => l(''), 15000))]);
  return html;
}, gebaut.seite);

/* ==========================================================================
 * §1 · Das Druckdokument enthält die Seite
 * ========================================================================*/
console.log('\n1 · Das Druckdokument enthält die Seite');

p('Es gibt überhaupt ein Druckdokument', druckDoc.length > 200,
  druckDoc.length + ' Zeichen');
p('Mit dem Titel der Seite', /Schulaufgabe Woche 12/.test(druckDoc));
p('Das Seitenbild steht darin — als Daten-Adresse, nicht als blob',
  /<img[^>]+src="data:image\/png;base64,/.test(druckDoc),
  (druckDoc.match(/<img[^>]{0,60}/) || ['(kein img)'])[0]);
p('Gegenprobe: keine blob-Adresse, die nach der Sitzung tot wäre',
  !/src="blob:/.test(druckDoc));
p('Und die getippte Antwort ist dabei',
  /x = 11, denn 3 mal 11 sind 33/.test(druckDoc));

/* ==========================================================================
 * §2 · Und die Striche — von beiden Blättern
 * ========================================================================*/
console.log('\n2 · Und die Striche — von beiden Blättern');

const pfade = (druckDoc.match(/<path[^>]*>/g) || []);
gleich('Zwei Striche stehen im Dokument', pfade.length, 2);
p('Als SVG, nicht als Bild — dann bleiben sie beim Drucken scharf',
  /<svg[^>]+class="marken"/.test(druckDoc));
p('Der rote von der PDF-Seite',
  pfade.some(x => /#d64545/.test(x)), pfade.join(' | ').slice(0, 120));
p('Der blaue vom Notizblatt', pfade.some(x => /#2f7ed8/.test(x)));
p('Mit den gespeicherten Punkten, nicht mit Bildschirmpunkten',
  /M80 300 L500 340/.test(druckDoc), (druckDoc.match(/d="M[^"]{0,40}/) || [''])[0]);
p('Der Zeichenraum ist der der Seite',
  /viewBox="0 0 595 842"/.test(druckDoc));

/* ==========================================================================
 * §3 · Nichts drängelt und nichts wird zerschnitten
 * ========================================================================*/
console.log('\n3 · Nichts drängelt und nichts wird zerschnitten');

p('Eine Seite wird beim Umbruch nicht zerschnitten',
  /page-break-inside:\s*avoid/.test(druckDoc) || /break-inside:\s*avoid/.test(druckDoc));
p('Die Zeichenschicht liegt über dem Bild',
  /\.marken\{position:absolute/.test(druckDoc.replace(/\s/g, ' ')) ||
  /marken\{position:absolute/.test(druckDoc));
p('Spalten stehen untereinander, nicht als Gitter',
  !/spalten-block/.test(druckDoc));

/* ==========================================================================
 * §4 · Der gewöhnliche Export erfindet kein Bild
 * --------------------------------------------------------------------------
 * `seiteAlsHtml` bedient auch Archiv und Veröffentlichen. Eine blob-Adresse
 * wäre dort nach der Sitzung tot (E98), und ein Schulskript hat in einer
 * öffentlichen Seite ohnehin nichts verloren. Was es aber nicht sein darf,
 * ist STILL: vorher kam eine PDF-Seite dort gar nicht vor.
 * ========================================================================*/
console.log('\n4 · Der gewöhnliche Export erfindet kein Bild');

const alsHtml = await seite.evaluate((sid: string) =>
  Werkzeuge.seiteAlsHtml(Store.getBlock(sid)), gebaut.seite);

p('Die PDF-Seite kommt darin vor', /Seite 1 von 1/.test(alsHtml), alsHtml.slice(0, 200));
p('Aber ohne Bild', !/<img/.test(alsHtml));
p('Und ohne blob-Adresse', !/blob:/.test(alsHtml));
p('Die Antwort auf dem Notizblatt steht drin',
  /x = 11/.test(alsHtml));

/* ==========================================================================
 * §4b · Und die HTML-Datei, die wirklich herauskommt
 * --------------------------------------------------------------------------
 * §4 ruft `seiteAlsHtml` auf und liest das Ergebnis — das ist die FUNKTION.
 * Die Datei, die ein Mensch bekommt, entsteht daneben in `htmlExport`, mit
 * Kopf, Stil und Rahmen darum. Bei E111 hat sich gezeigt, was zwischen
 * Absicht und Artefakt passieren kann: das Manifest einer `.redion` behauptete
 * „vollständig", während zwei Dateien fehlten, weil die Zahl aus einer
 * anderen Quelle kam als das Archiv.
 *
 * Wo es ein Artefakt gibt, muss die Prüfung das Artefakt aufmachen. Also:
 * herunterladen und lesen.
 * ========================================================================*/
console.log('\n4b · Und die HTML-Datei, die wirklich herauskommt');

const listenSeite = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Ausgabeprobe' });
  Store.addBlock(s.id, 'h2', { text: 'Meine Loesungen' });
  Store.addBlock(s.id, 'number', { text: 'x = 11' });
  Store.addBlock(s.id, 'number', { text: '2/3' });
  Store.addBlock(s.id, 'number', { text: '44 cm' });
  Store.addBlock(s.id, 'text', { text: 'Dazwischen ein Satz.' });
  Store.addBlock(s.id, 'bullet', { text: 'Punkt eins' });
  Store.addBlock(s.id, 'bullet', { text: 'Punkt zwei' });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 7, vonSeiten: 9,
    bw: 595, bh: 842, quelleId: 'q', suchtext: 'Aufgabenblatt 7' });
  /* Ein Block, der beweist, dass Nutzertext escaped wird (§19). */
  Store.addBlock(s.id, 'text', { text: '<script>alert(1)</script> & "Anführung"' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForTimeout(400);

const [herunter] = await Promise.all([
  seite.waitForEvent('download', { timeout: 60000 }),
  seite.evaluate((x: string) => { Werkzeuge.htmlExport(Store.getBlock(x)); }, listenSeite),
]);
const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-html-'));
const datei = path.join(ordner, herunter.suggestedFilename());
await herunter.saveAs(datei);
const ausgabe = fs.readFileSync(datei, 'utf8');

p('Eine Datei kommt heraus', ausgabe.length > 200, ausgabe.length + ' Zeichen');

/* NUMMERIERT BLEIBT NUMMERIERT. Jeder Listeneintrag ging seit jeher als
   nacktes `<li>` hinaus, ohne `<ul>`/`<ol>` darum: die Nummern gingen
   verloren, und das Ergebnis war ungültiges HTML. Aufgefallen im Druckbild
   (E108), weil dort zum ersten Mal jemand eine nummerierte Antwort abgeben
   wollte. */
gleich('Die drei Antworten stehen in EINER nummerierten Liste',
  (ausgabe.match(/<ol>/g) || []).length, 1);
p('Mit ihren drei Einträgen',
  /<ol><li>x = 11<\/li><li>2\/3<\/li><li>44 cm<\/li><\/ol>/.test(ausgabe),
  (ausgabe.match(/<ol>[\s\S]{0,80}/) || [''])[0]);
gleich('Die Aufzählung daneben ist eine eigene Liste',
  (ausgabe.match(/<ul>/g) || []).length, 1);
p('Der Satz dazwischen steht NICHT in einer Liste',
  /<\/ol><p>Dazwischen ein Satz\.<\/p><ul>/.test(ausgabe));

/* Wohlgeformt: jede geöffnete Liste wird geschlossen. */
gleich('Jede Liste wird geschlossen',
  (ausgabe.match(/<(ul|ol)>/g) || []).length,
  (ausgabe.match(/<\/(ul|ol)>/g) || []).length);
gleich('Und jeder Eintrag',
  (ausgabe.match(/<li>/g) || []).length,
  (ausgabe.match(/<\/li>/g) || []).length);
p('Kein Eintrag steht ausserhalb einer Liste',
  !/(<\/(p|h\d|div)>|<body>)\s*<li>/.test(ausgabe));

p('Die PDF-Seite kommt vor', /Seite 7 von 9/.test(ausgabe));
p('Aber ohne Bild — eine blob-Adresse wäre hier tot (E98)',
  !/<img/.test(ausgabe));

/* §19: Nutzertext darf niemals roh in der Ausgabe stehen. */
p('Nutzertext ist escaped',
  !/<script>alert\(1\)<\/script>/.test(ausgabe) && /&lt;script&gt;/.test(ausgabe),
  (ausgabe.match(/.{0,40}script.{0,40}/) || [''])[0]);
p('Auch Ampersand und Anführungszeichen',
  /&amp;/.test(ausgabe) && /&quot;/.test(ausgabe));

fs.rmSync(ordner, { recursive: true, force: true });

/* ==========================================================================
 * §5 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n5 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const werk = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/wissen/werkzeuge.ts'), 'utf8'));

p('Die Striche kommen aus Marken.zeichneMarke — einer Stelle (§34)',
  /Marken\.zeichneMarke\(m\)/.test(werk));
/* ZWEI ANLÄUFE, ZWEI FALSCHE ZEUGEN, und beide lehrreich.
   Der erste zählte `const raus = ` und verlangte genau eins — davon gibt es
   in dieser Datei drei, der Name ist eine gewöhnliche Vokabel.
   Der zweite zählte `b.type === 'callout'` und verlangte genau eins — davon
   gibt es zwei, und die zweite ist berechtigt: die Präsentation (`folieBlock`)
   setzt Folien und nicht Fliesstext, mit ganz anderem Aufbau. Sie ist ein
   eigener Fall, kein abgeschriebener.
   Was hier zu zeigen ist, ist enger: INNERHALB von `seiteAlsHtml` gibt es die
   Kette einmal, und der Druckweg baut keine zweite daneben. */
const seiteAlsHtmlCode = werk.slice(
  werk.indexOf('const seiteAlsHtml = ('),
  werk.indexOf('const alsDatenAdresse'));
gleich('In `seiteAlsHtml` steht die Kette genau einmal',
  (seiteAlsHtmlCode.match(/b\.type === 'callout'/g) || []).length, 1);
p('Und der Druckweg wiederholt sie nicht',
  !/b\.type === 'callout'/.test(werk.slice(werk.indexOf('const drucken = '))));
p('Der Druckweg hat keine eigene Kette, sondern einen Haken',
  /sonderfall\?: \(b: any/.test(werk) && /sonderfall\(b, tiefe, raus\)/.test(werk));
p('Und der Druckweg wartet auf die Bilder',
  /await bilderSammeln\(p\)/.test(werk));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
