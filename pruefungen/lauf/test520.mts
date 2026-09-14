/* Suite 520 — Gefüllte Formen und geerbte Textfarbe
 * ============================================================================
 * DIESE SUITE STAMMT NICHT AUS EINER LISTE, SONDERN AUS VIER BILDERN.
 * Redur hat am 14. September zwei Folien seiner echten Datei neben Redions
 * Fassung gestellt. Der Unterschied war nicht fein:
 *
 *   Folie 1   Original: dunkelblauer Kasten, weisser Titel darauf
 *             Redion:   KEIN Kasten, schwarzer Titel im Nichts
 *   Folie 2   Original: roter Balken, rotes „PERSON", blaues „Wer ist
 *                       Nidal?", rotes „Basel · Familie · Arbeit",
 *                       graues „4 Kinder"
 *             Redion:   kein Balken, und ALLE VIER Texte schwarz
 *
 * Zwei Ursachen, beide messbar:
 *
 * ─── 1. GEFÜLLTE FORMEN OHNE TEXT KAMEN NICHT AN ────────────────────────────
 * `L151` sagte es voraus: „Redion hat für eine gefüllte PowerPoint-Form
 * keine Marke." Seit E565 hat es eine — die Füllung an der geschlossenen
 * Marke. Es fehlte nur noch der Leser: `a:prstGeom` wurde nirgends gelesen.
 *
 * ─── 2. DIE TEXTFARBE ERBTE NICHT ───────────────────────────────────────────
 * Sie stand nicht im Lauf, sondern im `a:defRPr` des Platzhalters im Layout.
 * `vorgabenLesen` holte von diesem Element bis hierher NUR `sz`.
 *
 * ─── WAS BEWUSST NICHT GERATEN WIRD ─────────────────────────────────────────
 * PowerPoint kennt über hundert Formen, Redion fünf geschlossene und zwei
 * offene. Ein Stern als Rechteck wäre schlimmer als ein Stern, der fehlt und
 * GENANNT wird. §4 misst das an einem `star5`.
 *
 * ─── UND EIN KASTEN HAT MEIST KEINEN RAND ───────────────────────────────────
 * Ein farbiger Kasten hinter einem Titel hat im Original keinen Strich. Ein
 * Rand in der Vorgabefarbe machte ihn um zweieinhalb Punkt grösser und legte
 * einen grauen Saum darum. §5 misst `randlos`.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → gefüllte Formen wieder überspringen:            16 rot (der Kasten fehlt, der Stern auch)
 *   G2 → die Farbe nicht aus `a:defRPr` lesen:           5 rot (alle vier Texte fallen auf Schwarz)
 *   G3 → unbekannte Formen als Rechteck raten:           4 rot (der Stern käme als Rechteck)
 *   G4 → immer einen Rand zeichnen:                      1 rot (§6: der Kasten bekäme einen Strich)
 *   G5 → die Form NACH dem Text eintragen:               1 rot (die Flächen lägen über dem Text)
 *
 *   node pruefungen/lauf/test520.mts
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
const PORT = 9630;
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

  /* Eine gefüllte Form OHNE Text und OHNE Rand — der Kasten hinter dem Titel. */
  const flaeche = (id: number, x: number, y: number, cx: number, cy: number,
                   fuell: string, prst = 'rect', ln = '<a:ln><a:noFill/></a:ln>') =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="F${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="${prst}"><a:avLst/></a:prstGeom>` +
    `<a:solidFill><a:srgbClr val="${fuell}"/></a:solidFill>${ln}</p:spPr>` +
    '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';
  /* Ein Platzhalter OHNE eigene Farbe — sie kommt aus dem Layout. */
  const erbt = (id: number, typ: string, idx: string, text: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="E${id}"/><p:cNvSpPr/>` +
    `<p:nvPr><p:ph type="${typ}" idx="${idx}"/></p:nvPr></p:nvSpPr><p:spPr/>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr/><a:t>${text}</a:t></a:r></a:p>` +
    '</p:txBody></p:sp>';
  const vorgabe = (typ: string, idx: string, y: number, sz: number, farbe: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${60 + Number(idx)}" name="P"/><p:cNvSpPr/>` +
    `<p:nvPr><p:ph type="${typ}" idx="${idx}"/></p:nvPr></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="685800" y="${y}"/><a:ext cx="3657600" cy="457200"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:lstStyle><a:lvl1pPr><a:defRPr sz="${sz * 100}">` +
    `<a:solidFill><a:srgbClr val="${farbe}"/></a:solidFill></a:defRPr></a:lvl1pPr>` +
    '</a:lstStyle><a:p/></p:txBody></p:sp>';
  const huelle = (inhalt: string, wurzel = 'p:sld') =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><${wurzel} ${ns}><p:cSld>` +
    '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + `</p:spTree></p:cSld></${wurzel}>`;
  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + i + '</Relationships>';

  const folie =
    /* Der dunkle Kasten: gefüllt, ohne Rand, ohne Text. */
    flaeche(40, 685800, 685800, 4114800, 2743200, '1B2C4B') +
    /* Ein roter Balken. */
    flaeche(41, 685800, 3657600, 685800, 68580, 'B23A34') +
    /* Eine Ellipse MIT Rand — zwei Punkte stark, grau. */
    flaeche(42, 5486400, 685800, 914400, 914400, 'FFC000', 'ellipse',
      '<a:ln w="25400"><a:solidFill><a:srgbClr val="404040"/></a:solidFill></a:ln>') +
    /* Ein Stern — den kennt Redion NICHT und darf ihn nicht raten. */
    flaeche(43, 5486400, 1828800, 914400, 914400, '70AD47', 'star5') +
    /* Und die vier Texte, die ihre Farbe erben. */
    erbt(51, 'body', '2', 'PERSON') +
    erbt(52, 'title', '0', 'Wer ist Nidal?') +
    erbt(53, 'body', '3', 'Basel Familie Arbeit') +
    erbt(54, 'body', '4', '4 Kinder');

  const dateien = [
    { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>' },
    { name: '_rels/.rels', inhalt: relsDatei(rel('rId1', 'officeDocument', 'ppt/presentation.xml')) },
    { name: 'ppt/presentation.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
      '<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>' +
      '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>' },
    { name: 'ppt/_rels/presentation.xml.rels', inhalt: relsDatei(rel('rId1', 'slide', 'slides/slide1.xml')) },
    { name: 'ppt/slides/slide1.xml', inhalt: huelle(folie) },
    { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml')) },
    { name: 'ppt/slideLayouts/slideLayout1.xml', inhalt: huelle(
        vorgabe('body', '2', 685800, 11, 'B23A34') +
        vorgabe('title', '0', 1143000, 36, '1B2C4B') +
        vorgabe('body', '3', 2400300, 20, 'B23A34') +
        vorgabe('body', '4', 3200400, 16, '6E6E6E'), 'p:sldLayout') },
    { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', inhalt: relsDatei('') },
  ];
  const blob = await Austausch.zipSchreiben(dateien);
  const r = await Einlesen.datei(new File([blob], 'Formen.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
  const marken = (blatt?.marken || []) as any[];
  return {
    hinweis: String(r.hinweis || ''),
    reihe: marken.map(m => m.art),
    formen: marken.filter(m => m.art !== 'text').map(m => ({
      art: m.art, x: Math.round(m.pts[0][0]), y: Math.round(m.pts[0][1]),
      b: Math.round(m.pts[1][0] - m.pts[0][0]), h: Math.round(m.pts[1][1] - m.pts[0][1]),
      fuellung: String(m.fuellung || ''), farbe: String(m.farbe || ''),
      breite: m.breite === undefined ? null : m.breite,
      randlos: m.randlos === true })),
    texte: marken.filter(m => m.art === 'text').map(m => ({
      text: String(m.text), farbe: String(m.farbe || ''), sz: m.fontSize })),
    seiteId: String(r.seite.id),
  };
});

/* ══ §1 DER KASTEN IST DA ════════════════════════════════════════════════ */
console.log('\n§1 Eine gefüllte Form ohne Text kommt an');
{
  const k = erg.formen.find((f: any) => f.fuellung === '#1B2C4B');
  p('Der dunkle Kasten ist da', !!k, JSON.stringify(erg.formen));
  gleich('… als Rechteck', k?.art, 'rectangle');
  /* 685800 EMU = 54 pt; 4114800 = 324 pt breit, 2743200 = 216 hoch. */
  gleich('… an der Stelle aus der Datei', JSON.stringify([k?.x, k?.y]), JSON.stringify([54, 54]));
  gleich('… in seiner Grösse', JSON.stringify([k?.b, k?.h]), JSON.stringify([324, 216]));
  const balken = erg.formen.find((f: any) => f.fuellung === '#B23A34');
  p('Und der rote Balken auch', !!balken, JSON.stringify(erg.formen.map((f: any) => f.fuellung)));
}

/* ══ §2 DIE TEXTFARBE ERBT AUS DEM LAYOUT ════════════════════════════════ */
console.log('\n§2 `a:defRPr` gibt mehr als den Grad her');
{
  const t = (s: string) => erg.texte.find((x: any) => x.text === s);
  gleich('„PERSON" ist rot', t('PERSON')?.farbe, '#B23A34');
  gleich('„Wer ist Nidal?" ist dunkelblau', t('Wer ist Nidal?')?.farbe, '#1B2C4B');
  gleich('„Basel Familie Arbeit" ist rot', t('Basel Familie Arbeit')?.farbe, '#B23A34');
  gleich('„4 Kinder" ist grau', t('4 Kinder')?.farbe, '#6E6E6E');
  /* UND SIE SIND WIRKLICH VERSCHIEDEN — vier Texte, drei Farben. Ohne diese
     Zusage wäre „alle vier schwarz" ebenfalls „alle gleich behandelt". */
  p('Es sind drei verschiedene Farben, nicht eine',
    new Set(erg.texte.map((x: any) => x.farbe)).size === 3,
    JSON.stringify(erg.texte.map((x: any) => x.farbe)));
  gleich('Und der Grad erbt weiter wie seit E558', t('Wer ist Nidal?')?.sz, 36);
}

/* ══ §3 DIE FORM LIEGT UNTER DEM TEXT ════════════════════════════════════ */
console.log('\n§3 Erst die Fläche, dann die Schrift');
{
  const ersterText = erg.reihe.indexOf('text');
  const letzteForm = erg.reihe.lastIndexOf('rectangle');
  p('Alle Flächen stehen vor dem ersten Text',
    letzteForm >= 0 && ersterText >= 0 && letzteForm < ersterText,
    JSON.stringify(erg.reihe));
}

/* ══ §4 EIN STERN WIRD NICHT GERATEN ═════════════════════════════════════ */
console.log('\n§4 Was Redion nicht kennt, wird genannt statt geraten');
{
  gleich('Der grüne Stern ist NICHT als Form angekommen',
    erg.formen.filter((f: any) => f.fuellung === '#70AD47').length, 0);
  p('… und steht im Hinweis', /Formen/.test(erg.hinweis), erg.hinweis);
  /* Vier Formen in der Datei, drei kennt Redion. */
  gleich('Drei Formen sind angekommen', erg.formen.length, 3);
}

/* ══ §5 RAND ODER KEIN RAND ══════════════════════════════════════════════ */
console.log('\n§5 `a:ln` entscheidet, nicht die Vorgabe');
{
  const k = erg.formen.find((f: any) => f.fuellung === '#1B2C4B');
  p('Der Kasten ohne `a:ln`-Farbe ist randlos', k?.randlos === true, JSON.stringify(k));
  const e = erg.formen.find((f: any) => f.art === 'ellipse');
  p('Die Ellipse ist da', !!e, JSON.stringify(erg.formen.map((f: any) => f.art)));
  p('… und NICHT randlos', e?.randlos === false, JSON.stringify(e));
  gleich('… ihr Rand ist grau', e?.farbe, '#404040');
  /* 25400 EMU / 12700 = 2 Punkt. */
  gleich('… und zwei Punkte stark', e?.breite, 2);
}

/* ══ §6 UND SO WIRD ES GEZEICHNET ════════════════════════════════════════ */
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
  return [...svgEl.querySelectorAll('[data-ink-art]')]
    .filter(n => n.getAttribute('data-ink-art') !== 'text')
    .map(n => ({ art: n.getAttribute('data-ink-art') || '',
                 fill: n.getAttribute('fill') || '', stroke: n.getAttribute('stroke') || '' }));
});
console.log('\n§6 Der gezeichnete Knoten trägt Füllung und keinen Strich');
{
  p('Drei gezeichnete Formen', gemalt?.length === 3, JSON.stringify(gemalt));
  const kasten = gemalt?.find(g => g.fill.toLowerCase() === '#1b2c4b');
  p('Der Kasten ist wirklich gefüllt', !!kasten, JSON.stringify(gemalt));
  gleich('… und hat KEINEN Strich', kasten?.stroke, 'none');
  const ellipse = gemalt?.find(g => g.art === 'ellipse');
  gleich('Die Ellipse hat einen', ellipse?.stroke.toLowerCase(), '#404040');
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 520: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
