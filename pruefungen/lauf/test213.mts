/* Suite 179 — Die Suche findet auch, was nicht im Blocktext steht (§28)
 * ============================================================================
 * §28 des Auftrags zählt zwölf Dinge auf, die die globale Suche finden soll.
 * Zehn davon sind Blocktext oder stehen in `suchtext`/`ocrText` daneben. Zwei
 * lagen ausserhalb, und L55 hielt das fest:
 *
 *   DER DATEINAME     steht im Fach `dateien`, nicht am Block
 *   DIE QUELLENANGABE steht unter `quiz.source.title` bzw.
 *                     `learningPackage.license`, eine Ebene tiefer
 *
 * Beim Nachmessen zeigte sich, dass L55 in der Überschrift zu weit ging: ein
 * abgelegter Anhang IST auffindbar, weil jeder Weg, der eine Datei anlegt,
 * den Namen auch als Blocktext setzt. Verloren geht er erst, wenn jemand den
 * Text überschreibt — und genau dieser Fall wird hier geprüft.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Nachgemessen, nicht behauptet. Vor E147 waren §2 und §3 rot; die
 * Gegenproben unten sind einzeln auf einem Abzug des Baums zurückgenommen
 * worden. §1 ist die Gegenrichtung: es darf nicht plötzlich alles gefunden
 * werden, sonst prüfte die Suite nur, dass die Suche etwas zurückgibt.
 *
 *   node pruefungen/lauf/test213.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8972;

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
const seite = await browser.newPage({ viewport: { width: 1300, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
});

/* Der Bestand: drei Anhänge und eine Lernkarte, alle auf dem echten Weg. */
const gebaut = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Ablage', icon: '📁' });

  const ablegen = async (dateiname: string, blockText: string): Promise<string> => {
    const datei = new File([new Uint8Array([1, 2, 3, 4])], dateiname, { type: 'application/pdf' });
    const b = Store.addBlock(s.id, 'file', { text: blockText, typ: datei.type });
    const satz = await (globalThis as any).Dateien.ablegen(datei, { blockId: b.id, name: dateiname });
    Store.updateBlock(b.id, { dateiId: satz.id });
    return b.id;
  };

  /* Einer mit dem Namen im Text — so legt jeder Weg im Produkt an. */
  const mitNamen = await ablegen('Rechnung-2026-08.pdf', 'Rechnung-2026-08.pdf');
  /* Und einer, dessen Text jemand überschrieben hat. DAS ist der Fall aus
     L55: der Name lebt nur noch im Fach `dateien`. */
  const umbenannt = await ablegen('Mietvertrag-Wohnung.pdf', 'Der Vertrag von damals');

  /* Eine Lernkarte in der Form, die `electrical.ts` wirklich schreibt —
     nachgesehen, nicht geraten. */
  const karte = Store.addBlock(s.id, 'flashcard', {
    text: 'Was ist R? :: Der Widerstand',
    quiz: { options: ['a', 'b'], correct: 0,
      source: { title: 'Ohmsches Gesetz, algebraische Definition',
                edition: 'SI Brochure, 9th edition', license: 'CC0-1.0' } },
    learningPackage: { key: 'elektro', packageId: 'redion.elektro', license: 'CC-BY-4.0' }
  });
  /* EINE ZWEITE SEITE, DIE DAS WORT IM TEXT HAT. Ohne sie prüft §4 nichts:
     `Kontext.kandidaten` gibt für ein Wort, das es NIE gesehen hat, `null`
     zurück — „nicht sicher eingrenzbar, alles prüfen" — und die Suche findet
     den Anhang dann auch ohne Index. Gefährlich wird es erst, wenn das Wort
     anderswo vorkommt: dann grenzt der Beschleuniger auf jene Seiten ein,
     und eine Seite, die es nur im Dateinamen trägt, fällt heraus.
     Gemessen: mit der eigenen Wortliste im Index fehlt sie. */
  const andere = Store.addPage(null, { text: 'Notizen', icon: '📝' });
  Store.addBlock(andere.id, 'text', { text: 'Der Mietvertrag ist unterschrieben.' });

  await Store.flush();
  return { seite: s.id, andere: andere.id, mitNamen, umbenannt, karte: karte.id };
});

const suche = async (wort: string): Promise<any[]> =>
  seite.evaluate((w: string) => (Store.search(w) || []).map((t: any) => ({
    seite: String(t.page?.text || ''), treffer: String(t.treffer || ''),
    blockId: String(t.blockId || ''), schnipsel: String(t.snippet || '').slice(0, 70)
  })), wort);

/* ==========================================================================
 * §1 · Die Gegenrichtung: was es nicht gibt, wird nicht gefunden
 * --------------------------------------------------------------------------
 * Steht bewusst zuerst. Eine Suche, die auf alles etwas zurückgibt, würde
 * jeden Punkt darunter grün machen, ohne irgendetwas zu können.
 * ========================================================================*/
console.log('\n1 · Was es nicht gibt, wird nicht gefunden');
gleich('Ein erfundener Dateiname ergibt nichts',
  (await suche('Steuererklaerung-1998')).length, 0);
gleich('Eine erfundene Quelle ergibt nichts',
  (await suche('Handbuch der Nichtse')).length, 0);

/* ==========================================================================
 * §2 · Dateinamen
 * ========================================================================*/
console.log('\n2 · Dateinamen');

const imText = await suche('Rechnung-2026');
gleich('Der Anhang mit Namen im Text wird gefunden', imText.length, 1);
gleich('… und zwar auf seiner Seite', imText[0]?.seite, 'Ablage');

/* DER EIGENTLICHE FALL AUS L55. Der Blocktext heisst „Der Vertrag von
   damals"; der Dateiname steht nur noch im Fach `dateien`. */
const nurImFach = await suche('Mietvertrag-Wohnung');
gleich('Auch der umbenannte Anhang wird gefunden', nurImFach.length, 1);
gleich('… und der Treffer zeigt auf seinen Block',
  nurImFach[0]?.blockId, gebaut.umbenannt);
p('… und nennt den Dateinamen im Schnipsel',
  /Mietvertrag-Wohnung/.test(String(nurImFach[0]?.schnipsel || '')),
  nurImFach[0]?.schnipsel);

/* Der überschriebene Text bleibt natürlich auch auffindbar. */
gleich('Der neue Blocktext geht dabei nicht verloren',
  (await suche('Vertrag von damals')).length, 1);

/* ==========================================================================
 * §3 · Quellenangaben
 * ========================================================================*/
console.log('\n3 · Quellenangaben');

const quelle = await suche('Ohmsches Gesetz');
gleich('Der Quellentitel einer Lernkarte wird gefunden', quelle.length, 1);
gleich('… und zeigt auf die Karte', quelle[0]?.blockId, gebaut.karte);

gleich('Die Ausgabe der Quelle auch',
  (await suche('SI Brochure')).length, 1);
gleich('Und die Lizenz des Pakets',
  (await suche('CC-BY-4.0')).length, 1);

/* ==========================================================================
 * §4 · Beide Suchen geben dieselbe Antwort
 * --------------------------------------------------------------------------
 * Das ist der Punkt, an dem E124 einmal schiefging: `Store.search` fand
 * PDF-Text, der Beschleuniger in `Kontext` nicht — zwei Suchen mit zwei
 * Antworten. Seit E147 entscheidet EINE Funktion, was durchsuchbar ist.
 * ========================================================================*/
console.log('\n4 · Beide Suchen geben dieselbe Antwort');

const beide = await seite.evaluate((ids: any) => {
  const K = (globalThis as any).Kontext;
  if (!K?.kandidaten) return null;
  const frag = (wort: string): any => {
    const kand = K.kandidaten(wort);
    return {
      /* `null` heisst „nicht sicher eingrenzbar, alles prüfen". Das ist kein
         Fehler, aber auch kein Beleg — deshalb sucht §4 nach einem Wort, das
         der Index sicher kennt. */
      kandidaten: kand === null ? null : kand.map(String),
      treffer: (Store.search(wort) || []).map((t: any) => String(t.page?.id || ''))
    };
  };
  return {
    name: frag('Mietvertrag'),
    erfunden: frag('Steuererklaerung-1998'),
    seite: ids.seite, andere: ids.andere
  };
}, gebaut);

p('Der Beschleuniger ist da', !!beide, 'Kontext.kandidaten fehlt');
if (beide) {
  p('Das Wort steht wirklich im Index, nicht bloss im Nichts',
    Array.isArray(beide.name.kandidaten), JSON.stringify(beide.name.kandidaten));
  p('Er kennt die Notizseite', (beide.name.kandidaten || []).includes(beide.andere),
    JSON.stringify(beide.name.kandidaten));
  p('UND die Ablage, die das Wort nur im Dateinamen trägt',
    (beide.name.kandidaten || []).includes(beide.seite),
    JSON.stringify(beide.name.kandidaten));
  gleich('Und die echte Suche findet beide', beide.name.treffer.length, 2);
  /* Die Gegenrichtung: bei einem erfundenen Wort DARF er leer sein. */
  p('Bei einem erfundenen Wort grenzt er auf nichts ein',
    beide.erfunden.kandidaten === null || beide.erfunden.kandidaten.length === 0,
    JSON.stringify(beide.erfunden.kandidaten));
  gleich('Und die echte Suche findet dort auch nichts', beide.erfunden.treffer.length, 0);
}

/* ==========================================================================
 * §5 · Ein gelöschter Anhang wird nicht mehr gefunden
 * --------------------------------------------------------------------------
 * Ein Verzeichnis, das nur wächst, findet Dateien, die es nicht mehr gibt —
 * und schickt den Menschen auf einen Block, an dem nichts hängt.
 * ========================================================================*/
console.log('\n5 · Ein gelöschter Anhang wird nicht mehr gefunden');

const geloescht = await seite.evaluate(async (ids: any) => {
  const b = Store.getBlock(ids.umbenannt);
  await Store.dateiWeg(String(b?.dateiId || ''));
  Store.trashBlock(ids.umbenannt);
  Store.purgeBlock(ids.umbenannt);
  await Store.flush();
  return (Store.search('Mietvertrag-Wohnung.pdf') || []).length;
}, gebaut);
gleich('Nach dem Löschen ist der Name weg', geloescht, 0);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
