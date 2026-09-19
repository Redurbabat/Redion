/* Suite 526 — Die Rundreise einer .docx: was hineingeht, kommt wieder heraus
 * ============================================================================
 * Redur, 12. September 2026: „ich will das redion auch die anderen datein
 * auch öffnen kann z.B. word und powerpoint daten, und dort direkt wie die
 * pdf bearbeiten kann … aber wichtig die originale datei wird immer
 * geschützt." Und am 15. September, als eine der fünf Messlatten (E594):
 * „stark wie word beim text schreiben bearbeiten".
 *
 * Das ist Bogen O7 aus `AUFGABEN.md` — und derselbe Weg, den `test525` für
 * `.pptx` geht, nur auf `word/document.xml`.
 *
 * ─── WAS AM 15. SEPTEMBER 2026 GEMESSEN WURDE ───────────────────────────────
 * Eine fremde `.docx` mit Überschrift, farbigem Absatz, gemischten Läufen,
 * einer Tabelle, einem Bild und `docProps` — eingelesen und wieder ausgegeben:
 *
 *     Original 7 Einträge, 2284 Bytes   Export 6 Einträge, 5718 Bytes
 *     docProps/core.xml                 WEG   (Titel, Autor)
 *     word/media/image1.png             WEG   (das ganze Bild)
 *     Farbe CC0000                      WEG
 *     Text: 7 Stellen                   9 — „probe" und „probe.docx" stehen
 *                                           mit im Dokument: der DATEIANHANG
 *                                           ist Inhalt geworden
 *     word/document.xml                 komplett neu geschrieben
 *
 * Fett, kursiv und die Tabelle überlebten — sie gehen über Markdown und
 * werden neu geschrieben. Alles andere nicht.
 *
 *   §1 DAS ORIGINAL HÄNGT DRAN.
 *   §2 DIE RUNDREISE: jeder Eintrag steht wieder da, alles ausser dem
 *      Dokument Byte für Byte gleich.
 *   §3 DER ANHANG IST KEIN ABSATZ.
 *   §4 GEÄNDERTER TEXT KOMMT AN — und nur der Text ändert sich.
 *   §5 WAS NICHT GEHT, WIRD GESAGT (§35).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → den Durchreichweg in `alsWord` überspringen: sofort fehlen Bild und
 *        `docProps`, genau wie in der Messung oben.
 *   §4 → die Textersetzung weglassen: der Absatz trägt wieder sein altes Wort.
 *   Beide Gegenproben wurden gefahren, bevor der Weg gebaut wurde.
 *
 *   node pruefungen/lauf/test526.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Austausch: any;
declare const Einlesen: any;
declare const Store: any;
declare const UI: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
/* 9641 UND NICHT 9626 (E630). Die Zahl war doppelt vergeben — sie gehörte
   schon einem älteren Lauf, und dessen Port steht in ENTSCHEIDUNGEN.md.
   Zwei Läufe mit derselben Zahl können nie nebeneinander laufen, und ein
   Ergebnis, das aus dem falschen Grund rot ist, ist schlimmer als eines,
   das grün lügt (test400). */
const PORT = 9641;
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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
seite.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  'typeof Austausch !== "undefined" && typeof Einlesen !== "undefined" && typeof Store !== "undefined"');
await seite.waitForTimeout(600);

const ergebnis = JSON.parse(await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay,#rg-willkommen,#rg-einladung').forEach(n => n.remove());

  /* ══ EINE FREMDE .docx, mit dem Browser gepackt ═══════════════════════════
     Aus eigenem XML, nicht mit Redions Schreiber — sonst prüfte die Suite,
     ob Redion sich selbst versteht, statt ob sie fremde Dateien schützt. */
  const enc = new TextEncoder();
  const packe = async (text: string | Uint8Array) => {
    const roh = typeof text === 'string' ? enc.encode(text) : text;
    const strom = new Blob([roh as any]).stream()
      .pipeThrough(new (window as any).CompressionStream('deflate-raw'));
    const gepackt = new Uint8Array(await new Response(strom).arrayBuffer());
    return { name: '', roh: gepackt, methode: 8, crc: Austausch.crc32(roh), groesse: roh.length };
  };
  const png = Uint8Array.from(atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADAQEBGN2NsAAAAABJRU5ErkJggg=='),
    c => c.charCodeAt(0));
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const inhalte: Record<string, string> = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Default Extension="png" ContentType="image/png"/>'
      + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
      + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      + '</Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
      + '</Relationships>',
    'word/document.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document ' + W + '><w:body>'
      + '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Redurs Bericht</w:t></w:r></w:p>'
      + '<w:p><w:r><w:rPr><w:b/><w:color w:val="CC0000"/></w:rPr>'
      + '<w:t>Ein farbiger, fetter Absatz.</w:t></w:r></w:p>'
      + '<w:p/>'
      + '<w:p><w:r><w:t>Ein zweiter Absatz mit </w:t></w:r>'
      + '<w:r><w:rPr><w:i/></w:rPr><w:t>kursivem</w:t></w:r>'
      + '<w:r><w:t> Teil.</w:t></w:r></w:p>'
      + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc>'
      + '<w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
      + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>'
      + '</w:body></w:document>',
    'word/_rels/document.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>'
      + '</Relationships>',
    'word/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:styles ' + W + '><w:style w:type="paragraph" w:styleId="Heading1">'
      + '<w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style></w:styles>',
    'docProps/core.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"'
      + ' xmlns:dc="http://purl.org/dc/elements/1.1/">'
      + '<dc:title>Redurs Probebericht</dc:title><dc:creator>Redur</dc:creator></cp:coreProperties>'
  };
  const teile: any[] = [];
  for (const [name, text] of Object.entries(inhalte)) {
    const t = await packe(text); t.name = name; teile.push(t);
  }
  const b = await packe(png); b.name = 'word/media/image1.png'; teile.push(b);
  const original = await Austausch.zipSchreiben(teile);

  /* ══ EINLESEN ═══════════════════════════════════════════════════════════ */
  const datei = new File([original], 'Redurs Bericht.docx',
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const rein = await Einlesen.datei(datei);
  await Store.flush();
  const seiteId = rein?.seite?.id || rein?.id || '';
  const kinder = seiteId ? Store.childrenOf(seiteId) : [];

  /* Die Meldungen der Ausgabe mitschneiden — sie sind das, was ein Mensch
     sieht (§35). */
  const meldungen: string[] = [];
  const echt = UI?.toast;
  if (UI) UI.toast = (t: unknown) => { meldungen.push(String(t)); };

  const seitenBlock = seiteId ? Store.getBlock(seiteId) : null;
  const raus = seitenBlock ? await Austausch.alsWord(seitenBlock) : null;

  const lies = async (quelle: Blob) => {
    const z = await Einlesen.zipLesen(await quelle.arrayBuffer());
    const out: Record<string, string> = {};
    for (const n of z.namen) {
      if (/\.(png|jpg|jpeg|gif)$/i.test(n)) { out[n] = 'BILD:' + (z.eintrag(n)?.groesse ?? 0); continue; }
      out[n] = await z.text(n);
    }
    return out;
  };
  const vorher = await lies(original);
  const nachher = raus ? await lies(raus) : {};
  const texte = (xml: string) => (xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
    .map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, ''));

  /* ══ EINEN ABSATZ ÄNDERN und noch einmal ausgeben ═══════════════════════ */
  let nachAenderung: Record<string, string> = {};
  let gesetzt = '';
  const mitSpur = kinder.find((k: any) => k && k.quelle && typeof k.text === 'string');
  if (mitSpur && seitenBlock) {
    gesetzt = 'Ein ganz neuer Satz.';
    Store.updateBlock(mitSpur.id, { text: gesetzt });
    await Store.flush();
    const zweiter = await Austausch.alsWord(Store.getBlock(seiteId));
    if (zweiter) nachAenderung = await lies(zweiter);
  }
  if (UI && echt) UI.toast = echt;

  return JSON.stringify({
    hinweis: String(rein?.hinweis || ''),
    kinder: kinder.map((k: any) => ({ typ: k.type, text: String(k.text || '').slice(0, 40),
      original: !!k.original, spur: k.quelle ? JSON.stringify(k.quelle) : '' })),
    vorherNamen: Object.keys(vorher).sort(),
    nachherNamen: Object.keys(nachher).sort(),
    gleich: Object.keys(vorher).filter(n => nachher[n] === vorher[n]).sort(),
    texteVorher: texte(vorher['word/document.xml'] || ''),
    texteNachher: texte(nachher['word/document.xml'] || ''),
    texteNachAenderung: texte(nachAenderung['word/document.xml'] || ''),
    gesetzt,
    farbeNachher: /w:color w:val="CC0000"/.test(nachher['word/document.xml'] || ''),
    tabelleNachher: (nachher['word/document.xml'] || '').includes('<w:tbl>'),
    farbeNachAenderung: /w:color w:val="CC0000"/.test(nachAenderung['word/document.xml'] || ''),
    andersNachAenderung: Object.keys(vorher)
      .filter(n => nachAenderung[n] !== undefined && nachAenderung[n] !== vorher[n]).sort(),
    dokumentNachAenderung: String(nachAenderung['word/document.xml'] || ''),
    wohlgeformt: (() => {
      const x = nachAenderung['word/document.xml'];
      if (!x) return false;
      try {
        const d = new DOMParser().parseFromString(x, 'application/xml');
        return d.getElementsByTagName('parsererror').length === 0
          && !!d.getElementsByTagName('w:document')[0];
      } catch { return false; }
    })(),
    meldungen
  });
}) as string);

console.log('\n1 · Das Original hängt dran');
p('Die Seite trägt den Anhang an Platz 0',
  ergebnis.kinder[0]?.typ === 'file' && ergebnis.kinder[0]?.original === true,
  JSON.stringify(ergebnis.kinder[0]));
p('Und die Absätze daneben', ergebnis.kinder.length >= 4,
  JSON.stringify(ergebnis.kinder.map((k: any) => k.typ)));
p('Mindestens ein Absatz trägt eine Rückspur',
  ergebnis.kinder.some((k: any) => k.spur),
  JSON.stringify(ergebnis.kinder.map((k: any) => k.spur)));

console.log('\n2 · Die Rundreise: kein Eintrag geht verloren');
const fehlend = ergebnis.vorherNamen.filter((n: string) => !ergebnis.nachherNamen.includes(n));
p('Jeder Eintrag der Originaldatei steht wieder da', fehlend.length === 0,
  'fehlt: ' + fehlend.join(', '));
p('Das Bild ist noch drin', ergebnis.nachherNamen.includes('word/media/image1.png'));
p('Die Dateiangaben sind noch drin', ergebnis.nachherNamen.includes('docProps/core.xml'));
const sollGleich = ergebnis.vorherNamen.filter((n: string) => n !== 'word/document.xml');
const nichtGleich = sollGleich.filter((n: string) => !ergebnis.gleich.includes(n));
p('Alles ausser dem Dokument ist unverändert', nichtGleich.length === 0,
  'anders: ' + nichtGleich.join(', '));

console.log('\n3 · Der Anhang ist kein Absatz');
p('Der Dateiname steht nirgends im Dokument',
  !ergebnis.texteNachher.some((t: string) => /\.docx/.test(t)),
  JSON.stringify(ergebnis.texteNachher));

console.log('\n4 · Ohne Änderung bleibt alles, mit Änderung kommt sie an');
p('Der Text ist unverändert',
  JSON.stringify(ergebnis.texteNachher) === JSON.stringify(ergebnis.texteVorher),
  JSON.stringify(ergebnis.texteVorher) + ' → ' + JSON.stringify(ergebnis.texteNachher));
p('Die Farbe ist noch da', ergebnis.farbeNachher);
p('Und die Tabelle auch', ergebnis.tabelleNachher);
p('Ein geänderter Absatz kommt in der Datei an',
  !!ergebnis.gesetzt && ergebnis.texteNachAenderung.includes(ergebnis.gesetzt),
  ergebnis.gesetzt + ' · ' + JSON.stringify(ergebnis.texteNachAenderung));
p('… und die Farbe bleibt dabei stehen', ergebnis.farbeNachAenderung);
p('Nur das Dokument ist anders, sonst kein Eintrag',
  ergebnis.andersNachAenderung.length === 1
  && ergebnis.andersNachAenderung[0] === 'word/document.xml',
  JSON.stringify(ergebnis.andersNachAenderung));
p('Das geänderte Dokument trägt weiter seinen XML-Vorspann',
  /^<\?xml /.test(ergebnis.dokumentNachAenderung),
  JSON.stringify(ergebnis.dokumentNachAenderung.slice(0, 40)));
p('… und ist wohlgeformtes XML', ergebnis.wohlgeformt);

console.log('\n5 · Was nicht geht, wird gesagt');
p('Das Einlesen sagt, dass die Umwandlung Grenzen hat',
  ergebnis.hinweis.length > 10, JSON.stringify(ergebnis.hinweis).slice(0, 120));
p('Und die Ausgabe meldet, was übernommen wurde',
  ergebnis.meldungen.some((m: string) => /vollständig erhalten/.test(m)),
  JSON.stringify(ergebnis.meldungen));

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 2).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
