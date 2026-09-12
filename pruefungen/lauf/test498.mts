/* Suite 498 — Eine ZIP öffnen, EINEN Eintrag ersetzen, den Rest unberührt lassen
 * ============================================================================
 * Redur will Word und PowerPoint öffnen, ändern und wieder speichern — und
 * die Originaldatei soll geschützt bleiben. `.docx` und `.pptx` sind
 * ZIP-Pakete; „einen Absatz ändern" heisst also: EINEN Eintrag ersetzen und
 * alle anderen so zurückschreiben, wie sie waren.
 *
 * DAS GING BISHER NICHT, und zwar aus zwei Gründen:
 *   · Der Leser entpackte immer. `holen`/`alsBlob` geben Klartext, `eintrag`
 *     nur Zahlen — die rohen, noch gepackten Bytes kamen nie heraus.
 *   · Der Schreiber schrieb immer Methode 0. Ein fremder Deflate-Eintrag
 *     liess sich nicht durchreichen; er hätte entpackt und ungepackt neu
 *     abgelegt werden müssen. Aus einer 40-KB-Vorlage wäre so eine
 *     300-KB-Datei geworden, mit jedem eingebetteten Bild unkomprimiert.
 *
 * Diese Suite prüft das Durchreichen an einem Archiv, das WIRKLICH gepackte
 * Einträge enthält — mit Methode 0 allein wäre sie wertlos, weil dann roh
 * und gepackt dieselbe Zahl sind und jede Verwechslung unsichtbar bliebe.
 *
 *   §1 DER LESER GIBT DIE ROHEN BYTES HERAUS, ohne zu entpacken.
 *   §2 DIE RUNDREISE: ein Eintrag geändert, alle anderen Byte für Byte
 *      gleich — und die neue Datei ist wieder lesbar.
 *   §3 DAS GEPACKTE BLEIBT GEPACKT. Die neue Datei ist nicht grösser
 *      geworden, und die durchgereichten Einträge tragen weiter Methode 8.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `rohBytes` aus `einlesen.ts` entfernen.
 *   §2 → im Schreiber `versatz += kopf.length + laenge` statt `gepackt`:
 *        jeder Versatz nach dem ersten gepackten Eintrag zeigt ins Leere.
 *   §3 → `methode` im Kopf wieder fest auf 0: die Bytes werden als
 *        „gespeichert" ausgewiesen und beim Lesen nicht mehr entpackt.
 *
 *   node pruefungen/lauf/test498.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Austausch: any;
declare const Einlesen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9608;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Austausch !== "undefined" && typeof Einlesen !== "undefined"');

const ergebnis = await seite.evaluate(async () => {
  /* Ein Archiv mit WIRKLICH gepackten Einträgen bauen. Redions Schreiber
     packt nicht, also wird hier mit dem Browser gepackt und das Ergebnis
     als durchgereichter Eintrag eingesetzt — derselbe Weg, den später eine
     fremde .docx nimmt. */
  const enc = new TextEncoder();
  const packe = async (text: string) => {
    const roh = enc.encode(text);
    const strom = new Blob([roh]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const gepackt = new Uint8Array(await new Response(strom).arrayBuffer());
    return { roh, gepackt };
  };
  /* Lang und wiederholt, damit Deflate wirklich etwas zu tun hat: bei zehn
     Zeichen wäre gepackt grösser als roh, und der Lauf prüfte das Gegenteil
     von dem, was er behauptet. */
  const langA = 'Absatz A. '.repeat(400);
  const langB = 'Absatz B. '.repeat(400);
  const a = await packe(langA);
  const b = await packe(langB);

  const crc = (x: Uint8Array) => Austausch.crc32(x);
  const urArchiv = await Austausch.zipSchreiben([
    { name: '[Content_Types].xml', inhalt: '<Types/>' },
    { name: 'word/document.xml', roh: a.gepackt, methode: 8, crc: crc(a.roh), groesse: a.roh.length },
    { name: 'word/media/bild1.png', roh: b.gepackt, methode: 8, crc: crc(b.roh), groesse: b.roh.length }
  ]);

  /* ══ §1 Der Leser gibt die rohen Bytes heraus ══════════════════════════ */
  const leser = await Einlesen.zipLesen(await urArchiv.arrayBuffer());
  const rohDoc = leser.rohBytes('word/document.xml');
  const rohBild = leser.rohBytes('word/media/bild1.png');
  const klarDoc = await leser.text('word/document.xml');

  /* ══ §2 Die Rundreise ══════════════════════════════════════════════════ */
  const neuerText = '<w:document>GEÄNDERT</w:document>';
  const neu = await Austausch.zipSchreiben([
    { name: '[Content_Types].xml', inhalt: '<Types/>' },
    /* der geänderte Eintrag: gewöhnlich geschrieben */
    { name: 'word/document.xml', inhalt: neuerText },
    /* der fremde Eintrag: Byte für Byte durchgereicht */
    { name: 'word/media/bild1.png', roh: rohBild.roh, methode: rohBild.methode,
      crc: rohBild.crc, groesse: rohBild.groesse }
  ]);
  const zurueck = await Einlesen.zipLesen(await neu.arrayBuffer());

  return {
    /* §1 */
    rohIstGepackt: rohDoc.gepackt < rohDoc.groesse,
    rohMethode: rohDoc.methode,
    rohGroesse: rohDoc.groesse,
    rohLaenge: rohDoc.roh.length,
    klarWarRichtig: klarDoc === langA,
    /* §2 */
    namenGleich: JSON.stringify(zurueck.namen) === JSON.stringify(leser.namen),
    neuerInhalt: await zurueck.text('word/document.xml'),
    durchgereichtGleich: (await zurueck.text('word/media/bild1.png')) === langB,
    /* §3 */
    methodeNachher: zurueck.eintrag('word/media/bild1.png').methode,
    /* UND DIE METHODE IM LOKALEN KOPF, aus den Bytes gelesen.
       Die erste Fassung dieser Suite prüfte nur `eintrag()`, und das liest
       aus dem VERZEICHNIS. Die Gegenprobe — Methode im lokalen Kopf fest
       auf 0 — blieb deshalb grün: Redions eigener Leser sieht ins
       Verzeichnis und entpackt weiter richtig. Andere Entpacker tun das
       nicht; Word und der Windows-Explorer lesen den lokalen Kopf. Eine
       Zusage, die den halben Fehler nicht sieht, ist keine. */
    methodeLokal: await (async () => {
      const bytes = new Uint8Array(await neu.arrayBuffer());
      const d = new DataView(bytes.buffer);
      /* Den lokalen Kopf des dritten Eintrags über sein Verzeichnis finden:
         die Suche nach der Signatur allein träfe auch Bytes im Inhalt. */
      let eocd = -1;
      for (let i = d.byteLength - 22; i >= 0; i--)
        if (d.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      let z = d.getUint32(eocd + 16, true);
      const gesucht = 'word/media/bild1.png';
      for (let n = 0; n < d.getUint16(eocd + 10, true); n++) {
        const nl = d.getUint16(z + 28, true);
        const name = new TextDecoder().decode(bytes.subarray(z + 46, z + 46 + nl));
        if (name === gesucht) {
          const versatz = d.getUint32(z + 42, true);
          return d.getUint16(versatz + 8, true);
        }
        z += 46 + nl + d.getUint16(z + 30, true) + d.getUint16(z + 32, true);
      }
      return -1;
    })(),
    groesseVorher: urArchiv.size,
    groesseNachher: neu.size,
    rohSummeB: b.roh.length
  };
});

console.log('\n§1 Der Leser gibt die rohen Bytes heraus, ohne zu entpacken');
p('Die Bytes sind wirklich gepackt, nicht nur so genannt',
  ergebnis.rohIstGepackt, ergebnis.rohLaenge + ' gepackt / ' + ergebnis.rohGroesse + ' roh');
p('Die Methode kommt mit (8 = Deflate)', ergebnis.rohMethode === 8, String(ergebnis.rohMethode));
p('Die Rohgrösse ist die vor dem Packen',
  ergebnis.rohGroesse === 4000, String(ergebnis.rohGroesse));
p('… und `text()` liefert daneben weiterhin den Klartext', ergebnis.klarWarRichtig);

console.log('\n§2 Die Rundreise: einer geändert, der Rest unberührt');
p('Alle Einträge sind wieder da, in derselben Reihenfolge', ergebnis.namenGleich);
p('Der geänderte Eintrag trägt den neuen Text',
  ergebnis.neuerInhalt === '<w:document>GEÄNDERT</w:document>', String(ergebnis.neuerInhalt));
p('Der durchgereichte Eintrag ist unverändert lesbar', ergebnis.durchgereichtGleich);

console.log('\n§3 Das Gepackte bleibt gepackt');
p('Der durchgereichte Eintrag trägt weiter Methode 8 — im Verzeichnis',
  ergebnis.methodeNachher === 8, String(ergebnis.methodeNachher));
p('… und im lokalen Kopf, den fremde Entpacker lesen',
  ergebnis.methodeLokal === 8, String(ergebnis.methodeLokal));
p('Die neue Datei ist nicht auf Rohgrösse aufgeblasen',
  ergebnis.groesseNachher < ergebnis.rohSummeB,
  ergebnis.groesseNachher + ' Byte gegen ' + ergebnis.rohSummeB + ' Byte allein für den einen Eintrag');

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await kontext.close();
await browser.close();
server.close();
console.log(`\nSuite 498: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
