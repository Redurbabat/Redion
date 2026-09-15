/* Suite 521 — Die Schriftart: `a:latin` und das Schriftpaar des Themas
 * ============================================================================
 * Gemessen an Redurs echter Datei, beide Folien, JEDES Stück Text: das
 * Original steht durchgehend in einer Serifenschrift, Redion zeigte alles
 * serifenlos. Nach den Farben (E566) war das der grösste verbliebene
 * Unterschied — und er betrifft jedes Wort auf jeder Folie.
 *
 * ─── DIE DATEI NENNT EINEN NAMEN, DIE MARKE KENNT FÜNF FAMILIEN ─────────────
 *     standard · serif · mono · hand · schmal
 * Eine Zuordnung ist damit unvermeidlich eine NÄHERUNG. Sie ist bewusst so
 * gebaut, dass sie in EINE Richtung irrt: was nicht erkannt wird, bleibt
 * `standard` — also genau das, was heute schon passiert. Schlechter als
 * jetzt kann es nicht werden. §4 misst das an einer erfundenen Schrift.
 *
 * ─── DREI WEGE, IN DIESER REIHENFOLGE ───────────────────────────────────────
 *     1. `a:rPr > a:latin@typeface`    im Lauf selbst
 *     2. dasselbe im `a:defRPr` des Platzhalters im Layout
 *     3. `+mj-lt` / `+mn-lt`  →  das Schriftpaar aus `theme1.xml`
 *
 * Der dritte ist KEIN Sonderfall: PowerPoint schreibt fast immer `+mn-lt`
 * statt eines Namens. Ohne ihn bliebe fast jede Folie serifenlos — und
 * genau daran ist die erste Fassung dieses Prüfstücks gescheitert: ich
 * hatte das `+mj-lt` gar nicht hineingeschrieben, und die Probe zeigte
 * `schrift: null`. Der Code hatte recht (P43, P32, P41 — dasselbe Muster
 * zum vierten Mal).
 *
 * ─── WAS INNERHALB EINES ABSATZES NICHT GEHT ────────────────────────────────
 * Die Marke hat EINE Schriftfamilie für alle ihre Stücke. Zwei Schriften in
 * einer Zeile lassen sich also nicht ausdrücken; zwischen ABSÄTZEN geht es,
 * und darum steht die Schrift in `gleichFormat` und NICHT in `laeufeNoetig`.
 * §5 misst beides.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → `a:latin` gar nicht lesen:                      12 rot (alles fällt auf serifenlos zurück)
 *   G2 → `+mj-lt` nicht gegen das Thema auflösen:        2 rot (der geerbte Kasten bliebe serifenlos)
 *   G3 → alles Unbekannte als `serif` raten:             5 rot (Arial und die erfundene Schrift würden Serifen)
 *   G4 → die Schrift aus `gleichFormat` nehmen:          2 rot (die zwei Absätze würden EINE Marke)
 *
 *   node pruefungen/lauf/test521.mts
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
const PORT = 9631;
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

  /* Ein Kasten, dessen Lauf die Schrift SELBST nennt. */
  const eigen = (id: number, text: string, y: number, schrift: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="457200" y="${y}"/><a:ext cx="5486400" cy="457200"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1600">` +
    (schrift ? `<a:latin typeface="${schrift}"/>` : '') +
    `</a:rPr><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
  /* Ein Platzhalter, der sie ERBT — über `+mj-lt` aus dem Thema. */
  const erbt = (id: number, idx: string, text: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="E${id}"/><p:cNvSpPr/>` +
    `<p:nvPr><p:ph type="body" idx="${idx}"/></p:nvPr></p:nvSpPr><p:spPr/>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr/><a:t>${text}</a:t></a:r></a:p>` +
    '</p:txBody></p:sp>';
  /* Ein Kasten mit ZWEI Absätzen in verschiedenen Schriften. */
  const zweiAbsaetze =
    '<p:sp><p:nvSpPr><p:cNvPr id="70" name="Z"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' +
    '<p:spPr><a:xfrm><a:off x="457200" y="3657600"/><a:ext cx="5486400" cy="914400"/></a:xfrm></p:spPr>' +
    '<p:txBody><a:bodyPr/><a:lstStyle/>' +
    '<a:p><a:r><a:rPr sz="1600"><a:latin typeface="Georgia"/></a:rPr><a:t>mit Serifen</a:t></a:r></a:p>' +
    '<a:p><a:r><a:rPr sz="1600"><a:latin typeface="Arial"/></a:rPr><a:t>ohne Serifen</a:t></a:r></a:p>' +
    '</p:txBody></p:sp>';
  const vorgabe = (idx: string, y: number, schrift: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${80 + Number(idx)}" name="P"/><p:cNvSpPr/>` +
    `<p:nvPr><p:ph type="body" idx="${idx}"/></p:nvPr></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="457200" y="${y}"/><a:ext cx="5486400" cy="457200"/></a:xfrm></p:spPr>` +
    '<p:txBody><a:bodyPr/><a:lstStyle><a:lvl1pPr><a:defRPr sz="1600">' +
    `<a:latin typeface="${schrift}"/></a:defRPr></a:lvl1pPr>` +
    '</a:lstStyle><a:p/></p:txBody></p:sp>';

  const huelle = (inhalt: string, wurzel = 'p:sld') =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><${wurzel} ${ns}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + `</p:spTree></p:cSld></${wurzel}>`;
  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + i + '</Relationships>';

  const folie =
    eigen(10, 'Georgia sagt Serifen', 228600, 'Georgia') +
    eigen(11, 'Arial sagt nichts', 685800, 'Arial') +
    eigen(12, 'Consolas sagt Schreibmaschine', 1143000, 'Consolas') +
    eigen(13, 'Arial Narrow sagt schmal', 1600200, 'Arial Narrow') +
    eigen(14, 'Comic Sans MS sagt Handschrift', 2057400, 'Comic Sans MS') +
    /* Eine Schrift, die es nicht gibt — sie darf NICHT geraten werden. */
    eigen(15, 'Erfundene Schrift', 2514600, 'Wolkenkuckucksheim Pro') +
    /* Und eine, die ihren Namen verrät, ohne in der Liste zu stehen. */
    eigen(16, 'Noto Serif Display sagt Serifen', 2971800, 'Noto Serif Display') +
    /* Der geerbte Fall: `+mj-lt` im Layout, Georgia im Thema. */
    erbt(20, '5', 'geerbt aus dem Thema') +
    zweiAbsaetze;

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
      vorgabe('5', 3200400, '+mj-lt'), 'p:sldLayout') },
    { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slideMaster', '../slideMasters/slideMaster1.xml')) },
    { name: 'ppt/slideMasters/slideMaster1.xml', inhalt: huelle('', 'p:sldMaster') },
    { name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', inhalt: relsDatei(
      rel('rId1', 'theme', '../theme/theme1.xml')) },
    { name: 'ppt/theme/theme1.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme ${ns} name="T">` +
      '<a:themeElements><a:clrScheme name="C"/><a:fontScheme name="F">' +
      '<a:majorFont><a:latin typeface="Georgia"/></a:majorFont>' +
      '<a:minorFont><a:latin typeface="Calibri"/></a:minorFont>' +
      '</a:fontScheme></a:themeElements></a:theme>' },
  ];
  const blob = await Austausch.zipSchreiben(dateien);
  const r = await Einlesen.datei(new File([blob], 'Schrift.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
  const marken = ((blatt?.marken || []) as any[]).filter(m => m.art === 'text');
  return {
    texte: marken.map(m => ({ text: String(m.text).slice(0, 24),
      schrift: m.schrift === undefined ? null : String(m.schrift) })),
    seiteId: String(r.seite.id),
  };
});

const von = (anfang: string) => erg.texte.find((t: any) => t.text.startsWith(anfang));

/* ══ §1 DER LAUF NENNT SIE SELBST ════════════════════════════════════════ */
console.log('\n§1 `a:latin@typeface` im Lauf');
{
  gleich('Georgia wird `serif`', von('Georgia')?.schrift, 'serif');
  gleich('Consolas wird `mono`', von('Consolas')?.schrift, 'mono');
  gleich('Arial Narrow wird `schmal`', von('Arial Narrow')?.schrift, 'schmal');
  gleich('Comic Sans MS wird `hand`', von('Comic Sans')?.schrift, 'hand');
}

/* ══ §2 ARIAL TRÄGT GAR KEIN FELD ════════════════════════════════════════ */
console.log('\n§2 Was `standard` ist, bekommt kein Feld');
{
  /* Arial IST die Vorgabe — ein Feld dafür wäre Ballast, und eine alte
     Marke ohne das Feld verhält sich genauso. */
  gleich('Arial trägt kein `schrift`', von('Arial sagt')?.schrift, null);
}

/* ══ §3 `+mj-lt` WIRD GEGEN DAS THEMA AUFGELÖST ══════════════════════════ */
console.log('\n§3 Das Schriftpaar aus `theme1.xml`');
{
  /* Das Layout sagt `+mj-lt`, das Thema sagt dafür Georgia — also Serifen.
     PowerPoint schreibt fast immer so; ohne diesen Weg bliebe fast jede
     Folie serifenlos. */
  gleich('Der geerbte Kasten bekommt `serif`', von('geerbt aus dem Thema')?.schrift, 'serif');
}

/* ══ §4 UNBEKANNTES WIRD NICHT GERATEN ═══════════════════════════════════ */
console.log('\n§4 Die Näherung irrt nur in EINE Richtung');
{
  gleich('Eine erfundene Schrift trägt kein Feld', von('Erfundene Schrift')?.schrift, null);
  /* Aber ein Name, der es selbst sagt, wird erkannt — auch ohne Liste. */
  gleich('„Noto Serif Display" wird trotzdem `serif`',
    von('Noto Serif Display')?.schrift, 'serif');
}

/* ══ §5 ZWEI ABSÄTZE, ZWEI SCHRIFTEN ═════════════════════════════════════ */
console.log('\n§5 Zwischen Absätzen geht es, innerhalb nicht');
{
  const a = von('mit Serifen');
  const b = von('ohne Serifen');
  p('Beide Absätze sind eigene Marken', !!a && !!b,
    JSON.stringify(erg.texte.map((t: any) => t.text)));
  gleich('… der erste mit Serifen', a?.schrift, 'serif');
  gleich('… der zweite ohne', b?.schrift, null);
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
  return [...svgEl.querySelectorAll('text')].map(t => ({
    text: (t.textContent || '').trim().slice(0, 24),
    familie: t.getAttribute('font-family') || '' }));
});
console.log('\n§6 Der gezeichnete Knoten trägt den Schriftstapel');
{
  const f = (anfang: string) => gemalt?.find(g => g.text.startsWith(anfang))?.familie || '';
  p('Georgia zeichnet mit Georgia', /Georgia/.test(f('Georgia')), f('Georgia'));
  p('Der geerbte Kasten auch', /Georgia/.test(f('geerbt aus dem Thema')), f('geerbt aus dem Thema'));
  p('Consolas zeichnet mit einem Schreibmaschinenstapel',
    /mono|Consolas|Menlo/.test(f('Consolas')), f('Consolas'));
  p('Und Arial mit dem Standardstapel',
    /system-ui|sans-serif/.test(f('Arial sagt')), f('Arial sagt'));
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 521: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
