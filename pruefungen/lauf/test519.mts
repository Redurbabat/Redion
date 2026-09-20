/* Suite 519 — Tabellen: `a:tbl` als Gitter auf der Folie
 * ============================================================================
 * Der letzte grosse Posten aus L151. Bis hierher wurde eine Tabelle
 * übersprungen und nur GENANNT: „NICHT übernommen: 1 Tabellen" (E555).
 *
 * ─── WARUM KEIN TABELLENBLOCK ───────────────────────────────────────────────
 * Redion HAT einen Tabellenblock. Eine Folie ist aber ein BLATT mit Marken,
 * kein Editor. Die Tabelle zum Block zu machen hiesse, sie von der Folie zu
 * nehmen und woanders hinzulegen — die Folie sähe dann anders aus als das
 * Original, und genau das war der Sinn von E555 bis E563. Also bleibt sie,
 * wo sie ist: ein Rechteck und ein Text je Zelle.
 *
 * ─── DIE MASSE STEHEN IM GITTER, NICHT AN DEN ZELLEN ────────────────────────
 *     <a:tblGrid><a:gridCol w="2286000"/>×3     je 180 pt
 *     <a:tr h="457200">                          je  36 pt
 *     Rahmen bei 914400 / 1143000 EMU        =  (72, 90) pt
 * Eine Zelle hat KEINE eigene Lage. Sie ergibt sich aus der Summe der
 * Spalten links von ihr und der Zeilen über ihr. §1 rechnet das nach.
 *
 * ─── UND EIN `p:graphicFrame` TRÄGT `p:xfrm`, NICHT `a:xfrm` ────────────────
 * Derselbe Inhalt, ein anderer Namensraum. `formLage` findet ihn nicht.
 *
 * ─── DER FEHLER, DEN DIESE SUITE FESTHÄLT ───────────────────────────────────
 * Die Schleife, die aus Objekten Marken baut, hat KEINEN Auffangfall: was
 * weder Text noch Abdeckung ist, gilt als Bild. Beim ersten Lauf sass die
 * Rechteckprüfung versehentlich im Abdeckzweig — die zehn Zellen fielen
 * durch, landeten im Bildzweig und legten ZEHN LEERE ANHÄNGE an. Der
 * Hinweis sagte „10 Bilder aus 1 Dateien", und auf dem Blatt fehlte das
 * Gitter. §4 misst genau das, und G5 fährt es noch einmal.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → Tabellen wieder überspringen:                   20 rot (die Tabelle fehlt ganz)
 *   G2 → `gridSpan` ignorieren:                          3 rot (die breite Zelle wäre 180 statt 540)
 *   G3 → `hMerge`-Zellen NICHT überspringen:             4 rot (zwölf Rechtecke statt zehn)
 *   G4 → die Zellfüllung weglassen:                      2 rot (§5: keine gefüllte, zehn `none`)
 *   G5 → den Rechteckzweig hinter den Bildzweig setzen:  2 rot — und zwar §4: „10 Bilder aus 1 Dateien"
 *
 *   node pruefungen/lauf/test519.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const App: any;
declare const Store: any;
declare const Einlesen: any;
declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9647;   // war 9629 — geteilt mit test429 (E643)
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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof Einlesen !== "undefined"');
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(230);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}


const erg = await seite.evaluate(async () => {
  const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

  const zelle = (text: string, fuell: string, farbe: string, fett: boolean, span = 0) =>
    `<a:tc${span ? ` gridSpan="${span}"` : ''}><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r>` +
    `<a:rPr sz="1400"${fett ? ' b="1"' : ''}>` +
    (farbe ? `<a:solidFill><a:srgbClr val="${farbe}"/></a:solidFill>` : '') +
    `</a:rPr><a:t>${text}</a:t></a:r></a:p></a:txBody>` +
    `<a:tcPr>${fuell ? `<a:solidFill><a:srgbClr val="${fuell}"/></a:solidFill>` : ''}</a:tcPr></a:tc>`;
  const verschluckt = () =>
    '<a:tc hMerge="1"><a:txBody><a:bodyPr/><a:lstStyle/><a:p/></a:txBody><a:tcPr/></a:tc>';

  const tabelle =
    '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="20" name="Tab"/>' +
    '<p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>' +
    '<p:xfrm><a:off x="914400" y="1143000"/><a:ext cx="6858000" cy="1828800"/></p:xfrm>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl>' +
    '<a:tblPr firstRow="1"/><a:tblGrid>' +
    '<a:gridCol w="2286000"/><a:gridCol w="2286000"/><a:gridCol w="2286000"/></a:tblGrid>' +
    '<a:tr h="457200">' + zelle('Leitung', '1F4E79', 'FFFFFF', true) +
      zelle('Querschnitt', '1F4E79', 'FFFFFF', true) +
      zelle('Absicherung', '1F4E79', 'FFFFFF', true) + '</a:tr>' +
    '<a:tr h="457200">' + zelle('NYM-J 3x1,5', '', '', false) +
      zelle('1,5 mm2', '', '', false) + zelle('B16', '', '', false) + '</a:tr>' +
    '<a:tr h="457200">' + zelle('NYM-J 5x2,5', 'DEEAF6', '', false) +
      zelle('2,5 mm2', 'DEEAF6', '', false) + zelle('B20', 'DEEAF6', '', false) + '</a:tr>' +
    /* Eine Zelle über alle drei Spalten, und die zwei verschluckten daneben. */
    '<a:tr h="457200">' + zelle('Hinweis breit', 'FFF2CC', '7F6000', true, 3) +
      verschluckt() + verschluckt() + '</a:tr>' +
    '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';

  /* Und ein Diagramm — das bleibt übersprungen und MUSS genannt werden. */
  const diagramm =
    '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="30" name="Dia"/>' +
    '<p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>' +
    '<p:xfrm><a:off x="914400" y="3657600"/><a:ext cx="1828800" cy="914400"/></p:xfrm>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">' +
    '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId8"/>' +
    '</a:graphicData></a:graphic></p:graphicFrame>';

  const huelle = (inhalt: string) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + '</p:spTree></p:cSld></p:sld>';
  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + i + '</Relationships>';

  const dateien = [
    { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>' },
    { name: '_rels/.rels', inhalt: relsDatei(rel('rId1', 'officeDocument', 'ppt/presentation.xml')) },
    { name: 'ppt/presentation.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
      '<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>' +
      '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>' },
    { name: 'ppt/_rels/presentation.xml.rels', inhalt: relsDatei(rel('rId1', 'slide', 'slides/slide1.xml')) },
    { name: 'ppt/slides/slide1.xml', inhalt: huelle(tabelle + diagramm) },
    { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: relsDatei('') },
  ];
  const blob = await Austausch.zipSchreiben(dateien);
  const r = await Einlesen.datei(new File([blob], 'Tabelle.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
  const marken = (blatt?.marken || []) as any[];
  return {
    hinweis: String(r.hinweis || ''),
    kaesten: marken.filter(m => m.art === 'rectangle').map(m => ({
      x: Math.round(m.pts[0][0]), y: Math.round(m.pts[0][1]),
      b: Math.round(m.pts[1][0] - m.pts[0][0]), h: Math.round(m.pts[1][1] - m.pts[0][1]),
      fuellung: String(m.fuellung || '') })),
    texte: marken.filter(m => m.art === 'text').map(m => ({
      text: String(m.text), x: Math.round(m.point[0]), y: Math.round(m.point[1]),
      breite: Math.round(m.breiteBox || 0), farbe: String(m.farbe || ''), fett: !!m.fett })),
    arten: marken.map(m => m.art),
    seiteId: String(r.seite.id),
  };
});

/* ══ §1 DIE LAGE KOMMT AUS DEM GITTER ════════════════════════════════════ */
console.log('\n§1 Spaltenbreiten und Zeilenhöhen summiert');
{
  /* Rahmen bei 914400/1143000 EMU = (72, 90) pt. Spalten je 2286000 = 180 pt,
     Zeilen je 457200 = 36 pt. Also: Zeile 1 auf y 90, Zeile 2 auf 126, … */
  gleich('Zehn Zellen — neun einzeln plus die verbundene', erg.kaesten.length, 10);
  const k = erg.kaesten;
  gleich('Die erste Zelle sitzt auf der Ecke des Rahmens',
    JSON.stringify([k[0]?.x, k[0]?.y]), JSON.stringify([72, 90]));
  gleich('… und ist 180 × 36 gross',
    JSON.stringify([k[0]?.b, k[0]?.h]), JSON.stringify([180, 36]));
  gleich('Die zweite Spalte beginnt 180 weiter rechts', k[1]?.x, 252);
  gleich('Die dritte auf 432', k[2]?.x, 432);
  gleich('Die zweite Zeile beginnt 36 weiter unten', k[3]?.y, 126);
  gleich('Und die vierte auf 198', k[9]?.y, 198);
}

/* ══ §2 FÜLLUNG UND TEXTFARBE ════════════════════════════════════════════ */
console.log('\n§2 Was die Zelle mitbringt, kommt an');
{
  const k = erg.kaesten;
  gleich('Die Kopfzeile ist dunkelblau gefüllt', k[0]?.fuellung, '#1F4E79');
  gleich('Die zweite Zeile gar nicht', k[3]?.fuellung, '');
  gleich('Die dritte hellblau', k[6]?.fuellung, '#DEEAF6');
  const t = (s: string) => erg.texte.find((x: any) => x.text === s);
  gleich('Der Kopfzeilentext ist weiss', t('Leitung')?.farbe, '#FFFFFF');
  p('… und fett', t('Leitung')?.fett === true, JSON.stringify(t('Leitung')));
  /* OHNE DIE FÜLLUNG WÄRE DAS WEISS AUF WEISS — genau der Fall aus E558,
     eine Ebene tiefer. Die zwei Zusagen gehören deshalb zusammen. */
  p('Weisser Text steht auf gefülltem Grund, nicht auf Weiss',
    k[0]?.fuellung !== '' && t('Leitung')?.farbe === '#FFFFFF',
    'Füllung ' + k[0]?.fuellung + ', Text ' + t('Leitung')?.farbe);
}

/* ══ §3 VERBUNDENE ZELLEN ════════════════════════════════════════════════ */
console.log('\n§3 `gridSpan` macht eine breite Zelle, `hMerge` gar keine');
{
  const breit = erg.kaesten.find(k => k.b > 200);
  p('Es gibt genau eine breite Zelle',
    erg.kaesten.filter(k => k.b > 200).length === 1, JSON.stringify(erg.kaesten.map(k => k.b)));
  gleich('… und sie ist 540 breit (3 × 180)', breit?.b, 540);
  gleich('… mit ihrer eigenen Füllung', breit?.fuellung, '#FFF2CC');
  /* Zehn Rechtecke, nicht zwölf: die zwei verschluckten Zellen bekommen
     keins. Ein Rechteck darüber wäre ein Strich mitten durch die
     verbundene Zelle. */
  p('Die zwei verschluckten Nachbarn bekommen KEIN Rechteck',
    erg.kaesten.length === 10, erg.kaesten.length + ' Rechtecke');
}

/* ══ §4 KEINE GEISTER-ANHÄNGE ════════════════════════════════════════════ */
console.log('\n§4 Zellen sind keine Bilder (der Fehler aus dem ersten Lauf)');
{
  p('Der Hinweis nennt KEINE Bilder', !/Bilder/.test(erg.hinweis), erg.hinweis);
  gleich('Und es gibt keine Bildmarke',
    erg.arten.filter((a: string) => a === 'bild').length, 0);
  /* Das Diagramm bleibt übersprungen — und wird GENANNT (E555). */
  p('Das Diagramm steht im Hinweis', /Diagramme/.test(erg.hinweis), erg.hinweis);
  p('… und „Tabellen" steht NICHT mehr darin', !/Tabellen/.test(erg.hinweis), erg.hinweis);
}

/* ══ §5 UND SO WIRD ES GEZEICHNET ════════════════════════════════════════ */
await seite.evaluate((sid: string) => App.oeffne(sid), erg.seiteId);
await seite.waitForTimeout(1200);
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(200);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}
const gemalt = await seite.evaluate(() => {
  const svgEl = [...document.querySelectorAll('svg.blatt-marken')]
    .find(n => n.getBoundingClientRect().width > 10);
  if (!svgEl) return null;
  return [...svgEl.querySelectorAll('rect[data-ink-art="rectangle"]')].map(r => ({
    fill: r.getAttribute('fill') || '', stroke: r.getAttribute('stroke') || '',
    b: Math.round(Number(r.getAttribute('width'))) }));
});
console.log('\n§5 Die Rechtecke tragen ihre Füllung im SVG');
{
  p('Zehn gezeichnete Rechtecke', gemalt?.length === 10, JSON.stringify(gemalt?.length));
  const gefuellt = (gemalt || []).filter(r => r.fill !== 'none');
  p('Sieben davon sind gefüllt (3 Kopf + 3 Band + 1 Hinweis)',
    gefuellt.length === 7, gefuellt.length + ': ' + JSON.stringify(gefuellt.map(r => r.fill)));
  p('Die ungefüllten sagen ausdrücklich `none`',
    (gemalt || []).filter(r => r.fill === 'none').length === 3,
    JSON.stringify((gemalt || []).map(r => r.fill)));
  p('Und alle haben einen Rahmenstrich',
    (gemalt || []).every(r => r.stroke && r.stroke !== 'none'),
    JSON.stringify((gemalt || []).map(r => r.stroke).slice(0, 3)));
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 519: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
