/* Suite 307 — Der Deckel zeigt die Seite (L61, E313)
 * ============================================================================
 * `Vorschau.miniatur` liest TEXT. Genau die Seiten, die man am Bild am
 * schnellsten wiedererkennt — ein eingelesenes PDF, ein Foto —, haben kaum
 * welchen; ihr Deckel stand weiss da, mit dem Wort „PDF" darauf.
 *
 * ─── WARUM NICHTS GERENDERT UND NICHTS GESPEICHERT WIRD ─────────────────────
 *
 * L61 schlug vor, beim Speichern ein kleines Bild MITZUSCHREIBEN. Das wäre
 * eine Speicheränderung (§9) und hätte einen zweiten Bestand erzeugt, der
 * veralten kann: ein Vorschaubild von gestern zeigt die Seite von gestern.
 *
 * Die allermeisten dieser Seiten HABEN das Bild schon: eine eingelesene
 * PDF-Seite trägt `bildDateiId`, ein Bildblock `dateiId`. Die Vorschau zeigt
 * also den INHALT und nicht eine Kopie davon — sie kann nicht veralten, sie
 * kostet kein Byte, und sie reist mit der Sicherung mit, weil die Datei es
 * tut.
 *
 *   §1 `bildDatei` FINDET die Datei, und zwar die erste.
 *   §2 GEGENPROBE: eine Textseite hat keine, und der Deckel kein Bild.
 *   §3 IM FENSTER trägt der Deckel ein echtes Bild aus der Ablage.
 *   §4 UND EINE TOTE KENNUNG hinterlässt kein kaputtes Bildzeichen.
 *
 *   node pruefungen/lauf/test307.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9318;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

const gebaut = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();

  /* Echte Bytes, kein Platzhalter — sonst prüft §3 nur, ob ein `img` im
     Baum steht, und nicht, ob ein Bild ankommt. */
  const male = (): Promise<Blob> => {
    const c = document.createElement('canvas');
    c.width = 120; c.height = 170;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff'; g.fillRect(0, 0, 120, 170);
    g.fillStyle = '#2563eb'; g.fillRect(0, 0, 120, 26);
    return new Promise(r => c.toBlob(b => r(b!), 'image/png'));
  };

  const pdf = Store.addPage(null, { text: 'Skript' });
  const datei = await w.Dateien.ablegen(await male(), { name: 'seite1.png', blockId: pdf.id });
  Store.addBlock(pdf.id, 'pdfseite', { nr: 1, bildDateiId: datei.id });
  Store.addBlock(pdf.id, 'pdfseite', { nr: 2, bildDateiId: 'zweite-datei-gibt-es-nicht' });

  const nurText = Store.addPage(null, { text: 'Nur Text' });
  Store.addBlock(nurText.id, 'text', { text: 'Hier steht nur etwas geschrieben.' });

  /* Eine Seite, deren Bild es NICHT mehr gibt — die Datei ist weg, die
     Kennung steht noch am Block. */
  const tot = Store.addPage(null, { text: 'Verlorenes Bild' });
  Store.addBlock(tot.id, 'pdfseite', { nr: 1, bildDateiId: 'gibt-es-nicht-mehr' });

  /* Und eine tief verschachtelte, damit die Tiefengrenze etwas zu tun hat. */
  const tief = Store.addPage(null, { text: 'Tief' });
  const s1 = Store.addBlock(tief.id, 'toggle', { text: 'Ebene 1' });
  const s2 = Store.addBlock(s1.id, 'toggle', { text: 'Ebene 2' });
  const s3 = Store.addBlock(s2.id, 'toggle', { text: 'Ebene 3' });
  Store.addBlock(s3.id, 'pdfseite', { nr: 1, bildDateiId: datei.id });

  await Store.flush();
  return { pdf: pdf.id, nurText: nurText.id, tot: tot.id, tief: tief.id,
           datei: datei.id };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · `bildDatei` findet die Datei, und zwar die erste');

const gefunden = await pc.evaluate((g: any) => {
  const V = (globalThis as any).Vorschau;
  return {
    pdf: V.bildDatei(g.pdf),
    text: V.bildDatei(g.nurText),
    tot: V.bildDatei(g.tot),
    tiefMit: V.bildDatei(g.tief, 6),
    tiefOhne: V.bildDatei(g.tief, 2)
  };
}, gebaut);

gleich('Die erste PDF-Seite gewinnt, nicht die zweite', gefunden.pdf, gebaut.datei);
p('Auch tief unten wird sie gefunden', gefunden.tiefMit === gebaut.datei, String(gefunden.tiefMit));
p('Aber nicht jenseits der Tiefengrenze — sonst läuft es über den ganzen Baum',
  gefunden.tiefOhne === null, String(gefunden.tiefOhne));

/* ------------------------------------------------------------------------ */
console.log('\n2 · GEGENPROBE: eine Textseite hat keine');

p('Eine Seite nur aus Text liefert nichts', gefunden.text === null, String(gefunden.text));
/* Und eine mit toter Kennung liefert sie schon — die Datei fehlt erst beim
   Nachtragen auf. Das ist ehrlich: der Block SAGT, er habe ein Bild. */
p('Eine tote Kennung wird geliefert wie jede andere',
  gefunden.tot === 'gibt-es-nicht-mehr', String(gefunden.tot));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Im Fenster trägt der Deckel ein echtes Bild');

const deckel = await pc.evaluate(async () => {
  const w = globalThis as any;
  w.Bibliothek.oeffne();
  await new Promise(r => setTimeout(r, 1400));
  const karten = [...document.querySelectorAll('.bib-deckel')].map(k => {
    const bild = k.querySelector<HTMLImageElement>('.bib-deckel-bild');
    return {
      titel: (k.querySelector('.bib-deckel-name b')?.textContent || '').trim(),
      hatBild: !!bild,
      src: bild ? String(bild.src).slice(0, 5) : '',
      breit: bild ? Math.round(bild.getBoundingClientRect().width) : 0,
      naturBreite: bild ? bild.naturalWidth : 0
    };
  });
  return karten;
});

const skript = deckel.find((k: any) => k.titel === 'Skript');
const text = deckel.find((k: any) => k.titel === 'Nur Text');
p('Es gibt beide Deckel', !!skript && !!text,
  JSON.stringify(deckel.map((k: any) => k.titel)));
p('Der Skript-Deckel trägt ein Bild', skript?.hatBild === true, JSON.stringify(skript));
p('Und zwar eines aus der Ablage, keine Data-URL (§14)',
  skript?.src === 'blob:', String(skript?.src));
p('Das Bild ist wirklich geladen — nicht nur eingehängt',
  (skript?.naturBreite || 0) === 120, String(skript?.naturBreite));
p('Und es füllt den Deckel', (skript?.breit || 0) > 80, String(skript?.breit));
/* DIE GEGENPROBE, DIE ZÄHLT: hätte jeder Deckel ein Bild, wäre der Punkt
   darüber wertlos. */
p('Der Text-Deckel trägt keines', text?.hatBild === false, JSON.stringify(text));

/* ------------------------------------------------------------------------ */
console.log('\n4 · Eine tote Kennung hinterlässt kein kaputtes Bildzeichen');

const totKarte = deckel.find((k: any) => k.titel === 'Verlorenes Bild');
p('Der Deckel mit der toten Kennung zeigt kein Bild mehr',
  totKarte && totKarte.hatBild === false, JSON.stringify(totKarte));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
