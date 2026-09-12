/* Suite 499 — O3: eine fremde PowerPoint-Datei öffnen
 * ============================================================================
 * Redur: „bei der powerpoint daten will ich es 1:1 wie powerpoint haben."
 * Der erste Schritt dahin ist, eine fremde `.pptx` überhaupt lesen zu können
 * — das ging bisher gar nicht (`LUECKEN.md`: „DOCX/PPTX-Import" offen). Eine
 * `.pptx` lief in den Zweig „sonstige Datei" und wurde ein reiner Anhang.
 *
 * EINE FOLIE IST EIN `blatt`-BLOCK. Kein neuer Blocktyp: das A4-Blatt trägt
 * schon `blattBreite`/`blattHoehe` und die Zeichenschicht `Marken`, und damit
 * Textkästen, Bilder, Verschieben, Drehen und hundert Schritte rückgängig.
 *
 *   §1 DAS MASS STIMMT. EMU → Blattpunkte, 12700 je Punkt. Eine 16:9-Folie
 *      ist 960 × 540 pt, und die Objekte sitzen dort, wo sie im XML stehen.
 *   §2 DIE REIHENFOLGE KOMMT AUS `sldIdLst`, NICHT AUS DEN DATEINAMEN.
 *      `slide10.xml` steht in der Zeichensortierung vor `slide2.xml`; eine
 *      Präsentation in falscher Ordnung ist schlimmer als eine, die nicht
 *      aufgeht. Diese Suite legt die Dateien deshalb absichtlich verkehrt an.
 *   §3 BILDER KOMMEN MIT, als eigener Dateisatz am richtigen Block.
 *   §4 DAS ORIGINAL BLEIBT (E538), auch für `.pptx`.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `emuZuPunkt` durch `Number(wert)` ersetzen: jede Lage 12700-fach.
 *   §2 → die Folienpfade statt aus `sldIdLst` aus `zip.namen` sortieren.
 *   §3 → den `p:pic`-Zweig in `pptxLesen` überspringen.
 *
 *   node pruefungen/lauf/test499.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any;
declare const Einlesen: any;
declare const Austausch: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9609;
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
await seite.waitForFunction('typeof Store !== "undefined" && typeof Einlesen !== "undefined" && typeof Austausch !== "undefined"');
await seite.evaluate(() => {
  document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
});
await seite.waitForTimeout(400);

const e = await seite.evaluate(async () => {
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  /* EMU je Punkt: 12700. Ein Titel bei 1 Zoll / 0,5 Zoll, 8 Zoll breit. */
  const pt = (n: number) => Math.round(n * 12700);
  const folie = (titel: string, inhalt: string, mitBild: boolean) =>
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"' +
    ' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"' +
    ' xmlns:r="' + R + '"><p:cSld><p:spTree>' +
      '<p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>' +
        '<p:spPr><a:xfrm><a:off x="' + pt(72) + '" y="' + pt(36) + '"/>' +
        '<a:ext cx="' + pt(576) + '" cy="' + pt(60) + '"/></a:xfrm></p:spPr>' +
        '<p:txBody><a:p><a:r><a:rPr sz="4000" b="1"/><a:t>' + titel + '</a:t></a:r></a:p></p:txBody></p:sp>' +
      '<p:sp><p:spPr><a:xfrm><a:off x="' + pt(72) + '" y="' + pt(144) + '"/>' +
        '<a:ext cx="' + pt(576) + '" cy="' + pt(200) + '"/></a:xfrm></p:spPr>' +
        '<p:txBody><a:p><a:r><a:rPr sz="2000"/><a:t>' + inhalt + '</a:t></a:r>' +
        '<a:br/><a:r><a:t>zweite Zeile</a:t></a:r></a:p></p:txBody></p:sp>' +
      (mitBild ? '<p:pic><p:blipFill><a:blip r:embed="rIdBild"/></p:blipFill>' +
        '<p:spPr><a:xfrm><a:off x="' + pt(300) + '" y="' + pt(300) + '"/>' +
        '<a:ext cx="' + pt(160) + '" cy="' + pt(120) + '"/></a:xfrm></p:spPr></p:pic>' : '') +
    '</p:spTree></p:cSld></p:sld>';

  /* Ein winziges echtes PNG (1×1, rot) — Base64 von Hand, damit der Lauf
     keine zweite Maschine braucht. */
  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const png = Uint8Array.from(atob(pngB64), c => c.charCodeAt(0));

  /* DIE FALLE ABSICHTLICH STELLEN — und sie muss auch ZUSCHNAPPEN.
     Der erste Versuch benannte nur die zweite Folie `slide10.xml`. Das
     genügte nicht: `[slide1, slide10, slide2]` sortiert sich zufällig genau
     so, wie `sldIdLst` sie auflistet, und die Gegenprobe „nach Dateinamen
     statt nach sldIdLst" blieb grün. Eine Prüfung, die immer „passt schon"
     sagt, ist keine (§55.2).
     Jetzt laufen die beiden Ordnungen wirklich auseinander:
       sldIdLst       slide2 → slide10 → slide1   (Erste, Zweite, Dritte)
       Dateinamen     slide1 → slide10 → slide2   (Dritte, Zweite, Erste) */
  const praes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"' +
    ' xmlns:r="' + R + '">' +
    '<p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/>' +
    '<p:sldId id="258" r:id="rId3"/></p:sldIdLst>' +
    '<p:sldSz cx="12192000" cy="6858000"/></p:presentation>';
  const praesRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="' + R + '/slide" Target="slides/slide2.xml"/>' +
    '<Relationship Id="rId2" Type="' + R + '/slide" Target="slides/slide10.xml"/>' +
    '<Relationship Id="rId3" Type="' + R + '/slide" Target="slides/slide1.xml"/>' +
    '</Relationships>';
  const bildRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rIdBild" Type="' + R + '/image" Target="../media/bild1.png"/>' +
    '</Relationships>';

  const blob = await Austausch.zipSchreiben([
    { name: '[Content_Types].xml', inhalt: '<Types/>' },
    { name: '_rels/.rels', inhalt: '<Relationships/>' },
    { name: 'ppt/presentation.xml', inhalt: praes },
    { name: 'ppt/_rels/presentation.xml.rels', inhalt: praesRels },
    /* Namen und Inhalte absichtlich über Kreuz — siehe die Falle oben. */
    { name: 'ppt/slides/slide2.xml',  inhalt: folie('Erste Folie', 'Inhalt eins', false) },
    { name: 'ppt/slides/slide10.xml', inhalt: folie('Zweite Folie', 'Inhalt zwei', true) },
    { name: 'ppt/slides/slide1.xml',  inhalt: folie('Dritte Folie', 'Inhalt drei', false) },
    { name: 'ppt/slides/_rels/slide10.xml.rels', inhalt: bildRels },
    { name: 'ppt/media/bild1.png', inhalt: png }
  ]);
  const f = new File([blob], 'Vortrag.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });

  const vorher = (await Store.dateiAlle()).length;
  const r = await Einlesen.datei(f);
  const alle = await Store.dateiAlle();
  const kinder = Store.childrenOf(r.seite.id) || [];
  const blaetter = kinder.filter((b: any) => b.type === 'blatt');
  const zwei = blaetter[1];
  const marken = (zwei?.marken || []) as any[];
  const titelMarke = marken.find(m => m.art === 'text' && /Zweite/.test(m.text || ''));
  const bildMarke  = marken.find(m => m.art === 'bild');
  const bildSatz   = bildMarke ? alle.find((d: any) => d.id === bildMarke.dateiId) : null;
  const anhang = kinder.find((b: any) => b.type === 'file' && b.original);

  return {
    hinweis: String(r.hinweis || ''),
    anzahl: blaetter.length,
    reihenfolge: blaetter.map((b: any) => b.text),
    breite: zwei?.blattBreite, hoehe: zwei?.blattHoehe,
    titelX: titelMarke?.point?.[0], titelY: titelMarke?.point?.[1],
    titelBreite: titelMarke?.breiteBox, titelGrad: titelMarke?.fontSize, titelFett: !!titelMarke?.fett,
    umbruchDa: marken.some(m => m.art === 'text' && /zweite Zeile/.test(m.text || '')),
    bildDa: !!bildMarke, bildPts: bildMarke?.pts,
    bildSatzBlock: bildSatz ? bildSatz.blockId === zwei.id : false,
    bildNurEinmal: marken.filter(m => m.art === 'bild').length,
    neueDateien: alle.length - vorher,
    anhangDa: !!anhang, anhangName: anhang?.text || ''
  };
});

console.log('\n§1 Das Mass stimmt: EMU → Blattpunkte');
p('Die Folie ist 960 pt breit (16:9)', e.breite === 960, String(e.breite));
p('… und 540 pt hoch', e.hoehe === 540, String(e.hoehe));
p('Der Titel sitzt bei 72 / 36 pt, wo er im XML steht',
  e.titelX === 72 && e.titelY === 36, e.titelX + ' / ' + e.titelY);
p('Seine Kastenbreite ist 576 pt', e.titelBreite === 576, String(e.titelBreite));
p('Der Schriftgrad kommt aus `sz` (Hundertstelpunkte): 4000 → 40',
  e.titelGrad === 40, String(e.titelGrad));
p('Fett wird übernommen', e.titelFett);
p('Der harte Umbruch `a:br` wird zur Zeile', e.umbruchDa);

console.log('\n§2 Die Reihenfolge kommt aus sldIdLst, nicht aus den Dateinamen');
p('Drei Folien', e.anzahl === 3, String(e.anzahl));
p('… in der Ordnung der Präsentation, nicht in der der Dateinamen',
  JSON.stringify(e.reihenfolge) === JSON.stringify(['Erste Folie', 'Zweite Folie', 'Dritte Folie']),
  JSON.stringify(e.reihenfolge));

console.log('\n§3 Bilder kommen mit');
p('Die Folie mit dem Bild hat eine Bildmarke', e.bildDa);
p('… genau eine', e.bildNurEinmal === 1, String(e.bildNurEinmal));
p('… an der Stelle aus dem XML (300/300 bis 460/420)',
  JSON.stringify(e.bildPts) === JSON.stringify([[300, 300], [460, 420]]), JSON.stringify(e.bildPts));
p('Der Dateisatz hängt an DIESEM Blatt (E99)', e.bildSatzBlock);

console.log('\n§4 Das Original bleibt (E538)');
p('Die .pptx liegt als Anhang dabei', e.anhangDa && e.anhangName === 'Vortrag.pptx', e.anhangName);
p('Zwei neue Dateisätze: das Original und das Bild', e.neueDateien === 2, String(e.neueDateien));
p('Der Hinweis nennt Folien und Original', /Folien/.test(e.hinweis) && /Original/.test(e.hinweis), e.hinweis);

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await kontext.close();
await browser.close();
server.close();
console.log(`\nSuite 499: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
