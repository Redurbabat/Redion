/* Suite 293 — Folien haben eine Regel, und die steht einmal (E297, L69)
 * ============================================================================
 * L69: „Es gibt keinen Weg zu einer .pptx-Datei." Der Vortragsmodus ist
 * gebaut und geprüft, aber die Berufsschule verlangt oft eine ABGABE — eine
 * Datei hochladen oder auf dem Schul-PC öffnen. Dafür gab es nichts.
 *
 * Die Lücke sagt auch, warum das machbar ist: „ist wie .docx/.xlsx ein ZIP
 * mit XML, und den eigenen ZIP-Schreiber gibt es schon. Der Aufwand liegt im
 * Folien-XML, nicht im Container." Das hat gestimmt.
 *
 * ZUERST ABER DIE REGEL. Wo eine Folie anfängt, stand NUR im Vortragsmodus.
 * Der neue Weg hätte sie abschreiben müssen — und zwei Teilungen, die
 * auseinanderlaufen, sind schlimmer als eine: der Vortrag zeigte dann etwas
 * anderes als die abgegebene Datei, und gemerkt hätte man es in der Schule.
 * Sie steht jetzt in `core/slides/folien.ts`, und beide holen sie dort.
 *
 *   §1 DIE REGEL: Trennlinie und Überschrift 1/2 beginnen eine Folie.
 *   §2 DIE ZEILEN: was kein Text ist, wird BENANNT statt weggelassen.
 *   §3 DER VORTRAGSMODUS holt sie aus demselben Kern.
 *   §4 DIE .pptx-TEILE hängen zusammen — Beziehungen, Typen, XML.
 *   §5 DER GANZE WEG: eine echte Seite, ein echtes Archiv, der Text darin.
 *
 * ─── WAS HIER NICHT GEMESSEN WIRD (§35) ─────────────────────────────────────
 * Dass PowerPoint die Datei öffnet. Ein echtes PowerPoint gibt es hier nicht,
 * und LibreOffice läuft im Prüfcontainer nicht — nachgemessen am 1. September
 * 2026: es lädt dort nicht einmal eine `.txt` („source file could not be
 * loaded"). Geprüft wird deshalb die STRUKTUR, streng: jede Beziehung zeigt
 * auf eine Datei, die es gibt; jeder Teil hat seinen Content-Type; jedes XML
 * ist wohlgeformt. Das steht auch in LUECKEN.md, damit es niemand für mehr
 * hält, als es ist.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §4 misst gegen eine LISTE von Pflichtteilen und prüft jede rId einzeln —
 * ein vergessenes Layout oder ein Tippfehler im Ziel fällt sofort auf. §1
 * und §2 haben je eine Gegenprobe: eine Seite ohne Trenner ergibt EINE
 * Folie, und ein leerer Block erzeugt KEINE Zeile.
 *
 *   node pruefungen/lauf/test293.mts
 * ==========================================================================*/
declare const Store: any; declare const Folien: any;
declare const Austausch: any; declare const Einlesen: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9079;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' && typeof (globalThis as any).Folien !== 'undefined' &&
        typeof (globalThis as any).Austausch !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1200);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Regel: wo eine Folie anfängt');

const regel = await seite.evaluate(() => {
  /* Ein erfundener Baum, ohne Ablage — der Kern kennt sie nicht. */
  const baum: Record<string, any[]> = {
    seite: [
      { id: 'a', type: 'text', text: 'Einleitung' },
      { id: 'b', type: 'h1', text: 'Erstes Kapitel' },
      { id: 'c', type: 'bullet', text: 'Punkt eins' },
      { id: 'd', type: 'divider' },
      { id: 'e', type: 'text', text: 'Nach dem Strich' },
      { id: 'f', type: 'h2', text: 'Zweites Kapitel' },
      { id: 'g', type: 'text', text: 'Zum Schluss' }
    ],
    c: [{ id: 'c1', type: 'bullet', text: 'Unterpunkt' }]
  };
  const kinderVon = (id: string) => baum[id] || [];
  const f = Folien.teilen({ id: 'seite', type: 'page', text: 'Vortrag' }, kinderVon);

  /* Gegenprobe: dieselbe Seite ohne Trenner. */
  const ohne = Folien.teilen({ id: 'seite', type: 'page', text: 'Vortrag' },
    (id: string) => (baum[id] || []).filter((b: any) => !Folien.TRENNT.includes(b.type)));

  return {
    zahl: f.length,
    titel: f.map((x: any) => x.titel),
    /* Der Unterpunkt muss auf Tiefe 1 unter seinem Punkt stehen. */
    tiefen: (f[1]?.eintraege || []).map((e: any) => [e.block.id, e.tiefe]),
    ohneZahl: ohne.length,
    ohneTitel: ohne[0]?.titel
  };
}) as any;

gleich('Vier Folien: Einleitung, Kapitel 1, nach dem Strich, Kapitel 2',
  regel.zahl, 4);
gleich('Und sie heissen richtig', regel.titel,
  ['Vortrag', 'Erstes Kapitel', '', 'Zweites Kapitel']);
gleich('Ein Unterpunkt steht eine Stufe tiefer', regel.tiefen,
  [['c', 0], ['c1', 1]]);
gleich('GEGENPROBE: ohne Trenner ist es EINE Folie', regel.ohneZahl, 1);
gleich('… und sie trägt den Seitentitel', regel.ohneTitel, 'Vortrag');

/* ------------------------------------------------------------------------ */
console.log('\n2 · Die Zeilen: was kein Text ist, wird benannt');

const zeilen = await seite.evaluate(() => {
  const baum: Record<string, any[]> = {
    s: [
      { id: '1', type: 'text', text: 'Ein **fetter** Satz mit `Code`' },
      { id: '2', type: 'bullet', text: 'Ein Punkt' },
      { id: '3', type: 'todo', text: 'Offen', checked: false },
      { id: '4', type: 'image', src: 'x.png', text: 'Schaltbild' },
      { id: '5', type: 'table' },
      { id: '6', type: 'text', text: '   ' },
      { id: '7', type: 'columns' }
    ],
    '5': [{ id: '5a', type: 'tr' }, { id: '5b', type: 'tr' }],
    '7': [{ id: '7a', type: 'spalte' }],
    '7a': [{ id: '7a1', type: 'text', text: 'In der Spalte' }]
  };
  const kinderVon = (id: string) => baum[id] || [];
  const f = Folien.teilen({ id: 's', type: 'page', text: 'T' }, kinderVon);
  return { zeilen: Folien.alsZeilen(f[0], kinderVon) };
}) as any;

const texte = zeilen.zeilen.map((z: any) => z.text);
p('Auszeichnung ist weg — PowerPoint bekommt Text, keine Sterne',
  texte.includes('Ein fetter Satz mit Code'), JSON.stringify(texte));
p('Ein Punkt bekommt sein Zeichen', texte.includes('• Ein Punkt'), JSON.stringify(texte));
p('Eine offene Aufgabe ihr Kästchen',
  texte.some((t: string) => t.startsWith('☐')), JSON.stringify(texte));
p('Ein Bild wird BENANNT statt weggelassen',
  texte.includes('[Bild: Schaltbild]'), JSON.stringify(texte));
p('Eine Tabelle nennt ihre Zeilenzahl',
  texte.includes('[Tabelle, 2 Zeilen]'), JSON.stringify(texte));
p('Und was in einer Spalte steht, geht nicht verloren',
  texte.includes('In der Spalte'), JSON.stringify(texte));
p('GEGENPROBE: ein leerer Block erzeugt KEINE Zeile',
  !texte.some((t: string) => !t.trim()), JSON.stringify(texte));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Der Vortragsmodus holt sie aus demselben Kern');

const werkzeuge = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf-8');
p('Der Vortragsmodus ruft `Folien.teilen`',
  /Folien\.teilen\s*\(/.test(werkzeuge), 'kein Aufruf in werkzeuge.js');
p('Und hat keine eigene Trennregel mehr',
  !/b\.type === 'divider' \|\| b\.type === 'h1'/.test(werkzeuge),
  'die alte Regel steht noch in werkzeuge.js');

/* ------------------------------------------------------------------------ */
console.log('\n4 · Die .pptx-Teile hängen zusammen');

const struktur = await seite.evaluate(() => {
  const teile = Austausch.pptxTeile([
    { titel: 'Erste', zeilen: [{ text: 'Eins', tiefe: 0, art: 'text' }] },
    { titel: '', zeilen: [] }
  ]);
  const nach: Record<string, string> = {};
  for (const t of teile) nach[t.name] = t.inhalt;

  /* Jedes XML wohlgeformt? Der Browser hat einen Parser. */
  const kaputt: string[] = [];
  const parser = new DOMParser();
  for (const [name, inhalt] of Object.entries(nach)) {
    const d = parser.parseFromString(inhalt, 'application/xml');
    if (d.getElementsByTagName('parsererror').length) kaputt.push(name);
  }

  /* Jede Beziehung muss auf eine Datei zeigen, die es gibt. */
  const offen: string[] = [];
  for (const [name, inhalt] of Object.entries(nach)) {
    if (!name.endsWith('.rels')) continue;
    /* `_rels/.rels` gehört zur Wurzel, `ppt/_rels/x.rels` zu `ppt/`. */
    const basis = name.slice(0, name.lastIndexOf('_rels/'));
    const d = parser.parseFromString(inhalt, 'application/xml');
    for (const r of Array.from(d.getElementsByTagName('Relationship'))) {
      const ziel = r.getAttribute('Target') || '';
      /* Relative Pfade auflösen — `../` und alles. */
      const teileWeg = (basis + ziel).split('/');
      const rein: string[] = [];
      for (const s of teileWeg) {
        if (s === '..') rein.pop();
        else if (s && s !== '.') rein.push(s);
      }
      const voll = rein.join('/');
      if (!(voll in nach)) offen.push(name + ' → ' + ziel + ' (= ' + voll + ')');
    }
  }

  /* Jeder XML-Teil braucht seinen Content-Type. */
  const typen = parser.parseFromString(nach['[Content_Types].xml'] || '', 'application/xml');
  const genannt = new Set(Array.from(typen.getElementsByTagName('Override'))
    .map(o => (o.getAttribute('PartName') || '').replace(/^\//, '')));
  const ohneTyp = Object.keys(nach)
    .filter(n => n.endsWith('.xml') && n !== '[Content_Types].xml' && !genannt.has(n));

  return { namen: Object.keys(nach).sort(), kaputt, offen, ohneTyp };
}) as any;

const PFLICHT = ['[Content_Types].xml', '_rels/.rels', 'ppt/presentation.xml',
  'ppt/_rels/presentation.xml.rels', 'ppt/slideMasters/slideMaster1.xml',
  'ppt/slideMasters/_rels/slideMaster1.xml.rels', 'ppt/slideLayouts/slideLayout1.xml',
  'ppt/slideLayouts/_rels/slideLayout1.xml.rels', 'ppt/theme/theme1.xml',
  'ppt/slides/slide1.xml', 'ppt/slides/_rels/slide1.xml.rels',
  'ppt/slides/slide2.xml', 'ppt/slides/_rels/slide2.xml.rels'];
gleich('Alle Pflichtteile sind da',
  PFLICHT.filter(n => !struktur.namen.includes(n)), []);
gleich('Jedes XML ist wohlgeformt', struktur.kaputt, []);
gleich('Jede Beziehung zeigt auf eine Datei, die es gibt', struktur.offen, []);
gleich('Jeder XML-Teil hat seinen Content-Type', struktur.ohneTyp, []);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Der ganze Weg: echte Seite, echtes Archiv');

const rundlauf = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Elektrotechnik — Vortrag' });
  Store.addBlock(s.id, 'text', { text: 'Worum es geht' });
  Store.addBlock(s.id, 'h1', { text: 'Ohmsches Gesetz' });
  Store.addBlock(s.id, 'bullet', { text: 'U = R · I' });
  Store.addBlock(s.id, 'divider', {});
  Store.addBlock(s.id, 'bullet', { text: 'P = U · I' });
  await Store.flush();

  const erg = await Austausch.alsPowerPoint(Store.getBlock(s.id));
  const zip = await Einlesen.zipLesenAusBlob(erg.blob);
  const namen = zip.namen.slice().sort();
  const folie1 = await zip.text('ppt/slides/slide1.xml') || '';
  const folie2 = await zip.text('ppt/slides/slide2.xml') || '';
  const praesi = await zip.text('ppt/presentation.xml') || '';
  return { folien: erg.folien, groesse: erg.blob.size, namen,
           folie1, folie2, praesi };
}) as any;

gleich('Drei Folien aus dieser Seite', rundlauf.folien, 3);
p('Das Archiv hat Inhalt', rundlauf.groesse > 3000, rundlauf.groesse + ' Bytes');
p('Und lässt sich mit Redions eigenem ZIP-Leser wieder öffnen',
  rundlauf.namen.length >= 13, String(rundlauf.namen.length) + ' Einträge');
p('Der Seitentitel steht auf der ersten Folie',
  /Elektrotechnik/.test(rundlauf.folie1), rundlauf.folie1.slice(0, 160));
p('Die Überschrift wurde zur zweiten Folie',
  /Ohmsches Gesetz/.test(rundlauf.folie2), rundlauf.folie2.slice(0, 160));
p('Und der Punkt darunter steht dort auch',
  /U = R/.test(rundlauf.folie2), rundlauf.folie2.slice(0, 300));
p('Die Foliengrösse ist 16:9',
  /cx="12192000"\s+cy="6858000"/.test(rundlauf.praesi), rundlauf.praesi.slice(0, 200));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
