/* Suite 525 — Die Rundreise einer .pptx: was hineingeht, kommt wieder heraus
 * ============================================================================
 * Redur, 12. September 2026: „ich will das redion auch die anderen datein
 * auch öffnen kann z.B. word und powerpoint daten, und dort direkt wie die
 * pdf bearbeiten kann … aber wichtig die originale datei wird immer
 * geschützt." Und: „bei der powerpoint daten will ich es 1:1 wie powerpoint
 * haben."
 *
 * Das ist Bogen O5 aus `AUFGABEN.md`: geänderte Folien zurück, der Rest der
 * Originaldatei unangetastet.
 *
 * ─── WAS AM 15. SEPTEMBER 2026 GEMESSEN WURDE ───────────────────────────────
 * Eine fremde `.pptx` mit zwei Folien, einem Bild, einer gefüllten Form, einem
 * eigenen Thema und `docProps` — eingelesen und wieder ausgegeben:
 *
 *     Original 16 Einträge        Export 15 Einträge
 *     docProps/core.xml           WEG   (Titel, Autor, Fassung)
 *     docProps/app.xml            WEG
 *     ppt/media/image1.png        WEG   (das ganze Bild)
 *     2 Folien                    3     (der Dateianhang wurde eine Folie)
 *     Text „Erste Folie"          „probe" + „[Datei: probe.pptx]"
 *     Füllfarbe FFCC00            WEG
 *     Thema „Redur-Thema"         überschrieben
 *
 * Es überlebte also NICHTS ausser der Endung. `alsPowerPoint` baut eine
 * frische Datei aus Text — für eine selbst geschriebene Präsentation ist das
 * richtig, für eine eingelesene ist es Datenverlust.
 *
 *   §1 DAS ORIGINAL HÄNGT DRAN und wird beim Einlesen nicht angefasst.
 *   §2 DIE RUNDREISE: jeder Eintrag der Originaldatei steht wieder da, und
 *      alles ausser den Folien Byte für Byte gleich.
 *   §3 DER ANHANG IST KEINE FOLIE.
 *   §4 GEÄNDERTER TEXT KOMMT AN — und nur der Text ändert sich.
 *   §5 WAS NICHT ZURÜCKGESCHRIEBEN WERDEN KANN, WIRD GESAGT, nicht
 *      verschwiegen (§35).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → den Durchreichweg in `alsPowerPoint` überspringen: sofort fehlen
 *        Bild und `docProps`, genau wie in der Messung oben.
 *   §4 → die Textersetzung weglassen: die Folie trägt wieder das alte Wort.
 *   Beide Gegenproben wurden gefahren, bevor der Weg gebaut wurde.
 *
 *   node pruefungen/lauf/test525.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Austausch: any;
declare const Einlesen: any;
declare const Store: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
/* 9640 UND NICHT 9625 (E630). Die Zahl war doppelt vergeben — sie gehörte
   schon einem älteren Lauf, und dessen Port steht in ENTSCHEIDUNGEN.md.
   Zwei Läufe mit derselben Zahl können nie nebeneinander laufen, und ein
   Ergebnis, das aus dem falschen Grund rot ist, ist schlimmer als eines,
   das grün lügt (test400). */
const PORT = 9640;
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

  /* ══ EINE FREMDE .pptx, mit dem Browser gepackt ═══════════════════════════
     Nicht mit Redions Schreiber gebaut, sondern aus eigenem XML — sonst
     prüfte die Suite, ob Redion sich selbst versteht, und nicht, ob sie
     fremde Dateien schützt. Gepackt wird mit `CompressionStream`, damit die
     Einträge WIRKLICH Methode 8 tragen (derselbe Weg wie in `test498`). */
  const enc = new TextEncoder();
  const packe = async (text: string | Uint8Array) => {
    const roh = typeof text === 'string' ? enc.encode(text) : text;
    const strom = new Blob([roh as any]).stream().pipeThrough(new (window as any).CompressionStream('deflate-raw'));
    const gepackt = new Uint8Array(await new Response(strom).arrayBuffer());
    return { name: '', roh: gepackt, methode: 8, crc: Austausch.crc32(roh), groesse: roh.length };
  };
  const png = Uint8Array.from(atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADAQEBGN2NsAAAAABJRU5ErkJggg=='),
    c => c.charCodeAt(0));

  const leerBaum = '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/>'
    + '<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>';
  const folie = (titel: string, extra: string) =>
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
    + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
    + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
    + '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>'
    + '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Titel"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
    + '<p:spPr><a:xfrm><a:off x="838200" y="500000"/><a:ext cx="10515600" cy="1200000"/></a:xfrm>'
    + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
    + '<a:solidFill><a:srgbClr val="FFCC00"/></a:solidFill></p:spPr>'
    + '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="de-DE" sz="4000" b="1"/>'
    + '<a:t>' + titel + '</a:t></a:r></a:p></p:txBody></p:sp>'
    + extra + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  const bild = '<p:pic><p:nvPicPr><p:cNvPr id="3" name="Bild"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>'
    + '<p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
    + '<p:spPr><a:xfrm><a:off x="1000000" y="2200000"/><a:ext cx="2000000" cy="2000000"/></a:xfrm>'
    + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
  const rels = (inhalt: string) =>
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + inhalt + '</Relationships>';
  const rel = (id: string, art: string, ziel: string) =>
    '<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/'
    + art + '" Target="' + ziel + '"/>';
  const farben = ['dk1:000000', 'lt1:FFFFFF', 'dk2:44546A', 'lt2:E7E6E6', 'accent1:4472C4',
    'accent2:ED7D31', 'accent3:A5A5A5', 'accent4:FFC000', 'accent5:5B9BD5', 'accent6:70AD47',
    'hlink:0563C1', 'folHlink:954F72']
    .map(x => { const [n, v] = x.split(':'); return '<a:' + n + '><a:srgbClr val="' + v + '"/></a:' + n + '>'; })
    .join('');
  const dreimal = (x: string) => x + x + x;
  const inhalte: Record<string, string> = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Default Extension="png" ContentType="image/png"/>'
      + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
      + '<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
      + '<Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
      + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      + '</Types>',
    '_rels/.rels': rels(rel('rId1', 'officeDocument', 'ppt/presentation.xml')
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'),
    'ppt/presentation.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
      + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
      + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
      + '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
      + '<p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId3"/></p:sldIdLst>'
      + '<p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>',
    'ppt/_rels/presentation.xml.rels': rels(
      rel('rId1', 'slideMaster', 'slideMasters/slideMaster1.xml')
      + rel('rId2', 'slide', 'slides/slide1.xml')
      + rel('rId3', 'slide', 'slides/slide2.xml')
      + rel('rId4', 'theme', 'theme/theme1.xml')),
    'ppt/slides/slide1.xml': folie('Erste Folie', bild),
    'ppt/slides/slide2.xml': folie('Zweite Folie', ''),
    'ppt/slides/_rels/slide1.xml.rels': rels(
      rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml')
      + rel('rId2', 'image', '../media/image1.png')),
    'ppt/slides/_rels/slide2.xml.rels': rels(rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml')),
    'ppt/slideLayouts/slideLayout1.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
      + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
      + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">'
      + leerBaum + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>',
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels': rels(
      rel('rId1', 'slideMaster', '../slideMasters/slideMaster1.xml')),
    'ppt/slideMasters/slideMaster1.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
      + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
      + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
      + leerBaum + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1"'
      + ' accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5"'
      + ' accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
      + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>',
    'ppt/slideMasters/_rels/slideMaster1.xml.rels': rels(
      rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml')
      + rel('rId2', 'theme', '../theme/theme1.xml')),
    'ppt/theme/theme1.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Redur-Thema">'
      + '<a:themeElements><a:clrScheme name="Redur">' + farben + '</a:clrScheme>'
      + '<a:fontScheme name="Redur"><a:majorFont><a:latin typeface="Calibri Light"/>'
      + '<a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'
      + '<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>'
      + '</a:fontScheme><a:fmtScheme name="Redur">'
      + '<a:fillStyleLst>' + dreimal('<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>') + '</a:fillStyleLst>'
      + '<a:lnStyleLst>' + dreimal('<a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>') + '</a:lnStyleLst>'
      + '<a:effectStyleLst>' + dreimal('<a:effectStyle><a:effectLst/></a:effectStyle>') + '</a:effectStyleLst>'
      + '<a:bgFillStyleLst>' + dreimal('<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>') + '</a:bgFillStyleLst>'
      + '</a:fmtScheme></a:themeElements></a:theme>',
    'docProps/core.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"'
      + ' xmlns:dc="http://purl.org/dc/elements/1.1/">'
      + '<dc:title>Redurs Probevortrag</dc:title><dc:creator>Redur</dc:creator>'
      + '<cp:revision>3</cp:revision></cp:coreProperties>'
  };
  const teile: any[] = [];
  for (const [name, text] of Object.entries(inhalte)) {
    const t = await packe(text); t.name = name; teile.push(t);
  }
  const b = await packe(png); b.name = 'ppt/media/image1.png'; teile.push(b);
  const original = await Austausch.zipSchreiben(teile);

  /* ══ EINLESEN ═══════════════════════════════════════════════════════════ */
  const datei = new File([original], 'Redurs Vortrag.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  const rein = await Einlesen.datei(datei);
  await Store.flush();
  const seiteId = rein?.seite?.id || rein?.id || '';
  const kinder = seiteId ? Store.childrenOf(seiteId) : [];

  /* ══ AUSGEBEN ═══════════════════════════════════════════════════════════ */
  const seitenBlock = seiteId ? Store.getBlock(seiteId) : null;
  const raus = seitenBlock ? await Austausch.alsPowerPoint(seitenBlock) : null;

  /* ══ BEIDE ARCHIVE LESEN und vergleichen ════════════════════════════════ */
  const lies = async (quelle: Blob) => {
    const z = await Einlesen.zipLesen(await quelle.arrayBuffer());
    const raus: Record<string, string> = {};
    for (const n of z.namen) {
      if (/\.(png|jpg|jpeg|gif)$/i.test(n)) { raus[n] = 'BILD:' + (z.eintrag(n)?.groesse ?? 0); continue; }
      raus[n] = await z.text(n);
    }
    return raus;
  };
  const vorher = await lies(original);
  const nachher = raus ? await lies(raus.blob) : {};
  const texte = (xml: string) => (xml.match(/<a:t>([^<]*)<\/a:t>/g) || [])
    .map(t => t.replace(/<\/?a:t>/g, ''));

  /* ══ EINE FOLIE ÄNDERN und noch einmal ausgeben ═════════════════════════ */
  const blaetter = kinder.filter((k: any) => k.type === 'blatt');
  let nachAenderung: Record<string, string> = {};
  let gesetzt = '';
  if (blaetter.length && seitenBlock) {
    const erst = blaetter[0];
    const marken = Array.isArray(erst.marken) ? erst.marken.slice() : [];
    const textMarke = marken.find((m: any) => m && typeof m.text === 'string' && m.text.length);
    if (textMarke) {
      gesetzt = 'Geänderte Folie';
      Store.updateBlock(erst.id, { marken: marken.map((m: any) =>
        m === textMarke ? { ...m, text: gesetzt } : m) });
      await Store.flush();
      const zweiter = await Austausch.alsPowerPoint(Store.getBlock(seiteId));
      nachAenderung = await lies(zweiter.blob);
    }
  }

  return JSON.stringify({
    hinweis: String(rein?.hinweis || ''),
    kinder: kinder.map((k: any) => ({ typ: k.type, text: String(k.text || '').slice(0, 40),
      original: !!k.original, marken: Array.isArray(k.marken) ? k.marken.length : 0 })),
    vorherNamen: Object.keys(vorher).sort(),
    nachherNamen: Object.keys(nachher).sort(),
    gleich: Object.keys(vorher).filter(n => nachher[n] === vorher[n]).sort(),
    folienVorher: Object.keys(vorher).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).length,
    folienNachher: Object.keys(nachher).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).length,
    texteVorher: texte(vorher['ppt/slides/slide1.xml'] || ''),
    texteNachher: texte(nachher['ppt/slides/slide1.xml'] || ''),
    texteNachAenderung: texte(nachAenderung['ppt/slides/slide1.xml'] || ''),
    nachAenderungFuellung: /srgbClr val="FFCC00"/.test(nachAenderung['ppt/slides/slide1.xml'] || ''),
    nachAenderungBild: /<p:pic>/.test(nachAenderung['ppt/slides/slide1.xml'] || ''),
    nachAenderungLage: /<a:off x="838200" y="500000"\/>/.test(nachAenderung['ppt/slides/slide1.xml'] || ''),
    andersNachAenderung: Object.keys(vorher)
      .filter(n => nachAenderung[n] !== undefined && nachAenderung[n] !== vorher[n]).sort(),
    folieNachAenderung: String(nachAenderung['ppt/slides/slide1.xml'] || ''),
    folieWohlgeformt: (() => {
      const x = nachAenderung['ppt/slides/slide1.xml'];
      if (!x) return false;
      try {
        const d = new DOMParser().parseFromString(x, 'application/xml');
        return d.getElementsByTagName('parsererror').length === 0
          && !!d.getElementsByTagName('p:sld')[0];
      } catch { return false; }
    })(),
    gesetzt,
    fuellungNachher: /srgbClr val="FFCC00"/.test(nachher['ppt/slides/slide1.xml'] || ''),
    bildNachher: /<p:pic>/.test(nachher['ppt/slides/slide1.xml'] || ''),
    themaNachher: /Redur-Thema/.test(nachher['ppt/theme/theme1.xml'] || ''),
    hinweisAusgabe: String((raus && raus.hinweis) || '')
  });
}) as string);

console.log('\n1 · Das Original hängt dran');
p('Die Seite trägt den Anhang an Platz 0',
  ergebnis.kinder[0]?.typ === 'file' && ergebnis.kinder[0]?.original === true,
  JSON.stringify(ergebnis.kinder[0]));
p('Und zwei Folien daneben',
  ergebnis.kinder.filter((k: any) => k.typ === 'blatt').length === 2,
  JSON.stringify(ergebnis.kinder.map((k: any) => k.typ)));

console.log('\n2 · Die Rundreise: kein Eintrag geht verloren');
const fehlend = ergebnis.vorherNamen.filter((n: string) => !ergebnis.nachherNamen.includes(n));
p('Jeder Eintrag der Originaldatei steht wieder da', fehlend.length === 0,
  'fehlt: ' + fehlend.join(', '));
p('Das Bild ist noch drin',
  ergebnis.nachherNamen.includes('ppt/media/image1.png'));
p('Die Dateiangaben sind noch drin',
  ergebnis.nachherNamen.includes('docProps/core.xml'));
p('Das eigene Thema ist unverändert', ergebnis.themaNachher);
/* ALLES AUSSER DEN FOLIEN muss Byte für Byte gleich sein — sonst ist es
   kein Durchreichen, sondern ein Neuschreiben, das zufällig gleich aussieht. */
const sollGleich = ergebnis.vorherNamen.filter((n: string) => !/^ppt\/slides\/slide\d+\.xml$/.test(n));
const nichtGleich = sollGleich.filter((n: string) => !ergebnis.gleich.includes(n));
p('Alles ausser den Folien ist unverändert', nichtGleich.length === 0,
  'anders: ' + nichtGleich.join(', '));

console.log('\n3 · Der Anhang ist keine Folie');
p('Zwei Folien hinein, zwei Folien heraus',
  ergebnis.folienVorher === 2 && ergebnis.folienNachher === 2,
  ergebnis.folienVorher + ' → ' + ergebnis.folienNachher);
p('Und der Dateiname steht auf keiner Folie',
  !ergebnis.texteNachher.some((t: string) => /\.pptx/.test(t)),
  JSON.stringify(ergebnis.texteNachher));

console.log('\n4 · Ohne Änderung bleibt der Text, mit Änderung kommt sie an');
p('Der Text der ersten Folie ist unverändert',
  JSON.stringify(ergebnis.texteNachher) === JSON.stringify(ergebnis.texteVorher),
  JSON.stringify(ergebnis.texteVorher) + ' → ' + JSON.stringify(ergebnis.texteNachher));
p('Die gefüllte Form hat ihre Farbe behalten', ergebnis.fuellungNachher);
p('Und das Bild steht noch auf der Folie', ergebnis.bildNachher);
/* ══ DER GEÄNDERTE TEXT KOMMT AN (E593, Bogen O5b) ═════════════════════════
   Möglich wird das durch eine Rückspur, die beim EINLESEN entsteht: jede
   Textmarke, die genau EINEM Absatz mit genau EINEM Lauf entspricht,
   bekommt `quelle: { sp, p }` — die Kennung ihrer Form und die Nummer ihres
   Absatzes. Zurückgeschrieben wird nur, was diese Spur trägt.

   WARUM NICHT MEHR: bei Gruppen, Tabellen und geerbten Platzhaltern wäre
   ein Zuordnen nach Reihenfolge ein Raten, und es schriebe Text in die
   FALSCHE Form. Ein falscher Text ist schlimmer als ein fehlender (§51).
   Was keine Spur hat, bleibt stehen — und die Ausgabe sagt es. */
p('Ein geänderter Titel kommt in der Datei an',
  !!ergebnis.gesetzt && ergebnis.texteNachAenderung.includes(ergebnis.gesetzt),
  ergebnis.gesetzt + ' · ' + JSON.stringify(ergebnis.texteNachAenderung));
p('… und der alte Text steht nicht mehr darin',
  !ergebnis.texteNachAenderung.includes('Erste Folie'),
  JSON.stringify(ergebnis.texteNachAenderung));
/* UND NUR DER TEXT. Die Folie behält ihre Füllung, ihr Bild und ihre Masse —
   sonst wäre aus dem Ändern eines Wortes ein Neuschreiben geworden. */
p('Die Folie behält dabei Füllung, Bild und Masse',
  ergebnis.nachAenderungFuellung && ergebnis.nachAenderungBild
  && ergebnis.nachAenderungLage,
  JSON.stringify([ergebnis.nachAenderungFuellung, ergebnis.nachAenderungBild,
    ergebnis.nachAenderungLage]));
/* UND DIE ANDEREN EINTRÄGE AUCH. Geändert werden darf genau eine Folie. */
p('Nur die geänderte Folie ist anders, sonst kein Eintrag',
  ergebnis.andersNachAenderung.length === 1
  && ergebnis.andersNachAenderung[0] === 'ppt/slides/slide1.xml',
  JSON.stringify(ergebnis.andersNachAenderung));
/* ══ DIE ZWEI DINGE, DIE EINE DATEI STILL UNLESBAR MACHEN ══════════════════
   Ein neu geschriebenes XML ohne Vorspann und ein XML mit einem Fehler
   darin sehen beide harmlos aus — und PowerPoint öffnet beide nicht. Der
   Serialisierer des Browsers behält den Vorspann; geprüft wird es
   trotzdem, weil „behält ihn" eine Annahme über einen fremden Baustein
   ist (§45, E21). */
p('Die geänderte Folie trägt weiter ihren XML-Vorspann',
  /^<\?xml /.test(ergebnis.folieNachAenderung),
  JSON.stringify(ergebnis.folieNachAenderung.slice(0, 40)));
p('… und ist wohlgeformtes XML', ergebnis.folieWohlgeformt);

console.log('\n5 · Was nicht geht, wird gesagt');
p('Das Einlesen sagt, dass die Umwandlung Grenzen hat',
  ergebnis.hinweis.length > 10, JSON.stringify(ergebnis.hinweis).slice(0, 120));
/* DER WICHTIGSTE SATZ DIESER SUITE. Ein stilles Weglassen wäre das
   Schlimmere — der Nutzer speichert, sieht eine Datei und glaubt, seine
   Änderung sei darin. */
p('Und die Ausgabe sagt, dass die Änderungen noch nicht darin stehen',
  /noch nicht/.test(ergebnis.hinweisAusgabe), JSON.stringify(ergebnis.hinweisAusgabe));
p('… und sagt zugleich, dass das Original vollständig ist',
  /vollständig erhalten/.test(ergebnis.hinweisAusgabe));

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 2).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
