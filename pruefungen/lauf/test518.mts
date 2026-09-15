/* Suite 518 — Drehung: `a:xfrm@rot` kommt an
 * ============================================================================
 * L151 führte den Punkt mit einem Satz, der die Lage genau beschreibt:
 * „Die Marken KÖNNEN drehen — gelesen wird es noch nicht." Dasselbe Muster
 * wie bei `--paper` (E558) und der Ausrichtung (E560): die Fähigkeit war da
 * und nicht angeschlossen.
 *
 *     <a:xfrm rot="2700000"><a:off …/><a:ext …/></a:xfrm>
 *
 *   VORHER   die Form steht gerade, als stünde nichts da
 *   NACHHER  `dreh: 45` an der Marke, und das SVG trägt `rotate(45 …)`
 *
 * ─── DIE EINHEIT IST 60000stel GRAD ─────────────────────────────────────────
 *     5400000 / 60000 =  90°      2700000 / 60000 =  45°
 *    -5400000 / 60000 = -90°  →  270°  (auf 0…360 gebracht)
 * Die Richtung ist dieselbe wie bei SVGs `rotate` und bei Redions `dreh` —
 * es muss nichts gespiegelt werden, nur geteilt. §1 misst alle vier Fälle.
 *
 * ─── DIE DREHUNG ERBT NICHT ─────────────────────────────────────────────────
 * Ein Layout gibt vor, WO ein Platzhalter steht und wie gross er ist; dass
 * er schief steht, ist eine Entscheidung der einzelnen Folie. §3 baut
 * deshalb ein Layout mit gedrehtem Platzhalter und misst, dass die Folie
 * ihn GERADE bekommt.
 *
 * ─── UND ES GILT NICHT NUR FÜR TEXT ─────────────────────────────────────────
 * §2 prüft Bild und Abdeckung mit. Beide gehen durch eine andere Zeile im
 * Leser — bei ihnen bleibt die Erlaubnisliste stehen, weil ein Durchreichen
 * die Bilddaten in den Block legte (siehe E560).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → `rot` gar nicht lesen:                          9 rot (nichts dreht sich mehr)
 *   G2 → durch 60000 teilen vergessen:                   9 rot (5400000 statt 90)
 *   G3 → negative Winkel nicht auf 0…360 bringen:        2 rot (−90 statt 270)
 *   G4 → die Drehung auch erben lassen:                  1 rot (der geerbte Kasten stünde schief)
 *
 *   node pruefungen/lauf/test518.mts
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
const PORT = 9628;
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

  const kasten = (id: number, text: string, y: number, rot: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm${rot ? ` rot="${rot}"` : ''}><a:off x="914400" y="${y}"/>` +
    '<a:ext cx="2743200" cy="457200"/></a:xfrm></p:spPr>' +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1600"/><a:t>${text}</a:t></a:r></a:p>` +
    '</p:txBody></p:sp>';

  /* Eine Abdeckung: kein Text, aber ein Klickschritt — so erkennt der Leser
     sie (E266). `p:timing` liefert den Schritt. */
  const deckel = (id: number, y: number, rot: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="D${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm${rot ? ` rot="${rot}"` : ''}><a:off x="4572000" y="${y}"/>` +
    '<a:ext cx="1828800" cy="457200"/></a:xfrm>' +
    '<a:solidFill><a:srgbClr val="FFCC00"/></a:solidFill></p:spPr>' +
    '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';

  /* EIN KLICK IST EIN `p:cTn` MIT `nodeType="clickEffect"` — nachgesehen in
     `einlesen.ts`, nicht erfunden. Meine erste Fassung hier baute die
     Verschachtelung nach Gefühl und liess das Attribut weg; der Leser fand
     dann keine Abdeckung, und die Zusage zeigte auf den Code statt auf das
     Prüfstück (§45/E21 — auch für Prüfdateien). */
  const timing = (ids: number[]) =>
    '<p:timing><p:tnLst><p:par><p:cTn><p:childTnLst><p:seq><p:cTn><p:childTnLst>' +
    ids.map(id =>
      '<p:par><p:cTn nodeType="clickEffect"><p:childTnLst>' +
      '<p:animEffect transition="out" filter="dissolve">' +
      `<p:cBhvr><p:cTn/><p:tgtEl><p:spTgt spid="${id}"/></p:tgtEl></p:cBhvr></p:animEffect>` +
      '</p:childTnLst></p:cTn></p:par>').join('') +
    '</p:childTnLst></p:cTn></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>';

  const bild = (id: number, rot: string) =>
    `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="B${id}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>` +
    '<p:blipFill><a:blip r:embed="rId9"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
    `<p:spPr><a:xfrm${rot ? ` rot="${rot}"` : ''}><a:off x="457200" y="3657600"/>` +
    '<a:ext cx="914400" cy="914400"/></a:xfrm></p:spPr></p:pic>';

  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + i + '</Relationships>';

  /* Ein winziges echtes PNG (1×1, durchsichtig) — echte Bytes, kein Mock. */
  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBytes = Uint8Array.from(atob(pngB64), c => c.charCodeAt(0));

  const folie =
    kasten(11, 'gerade',   228600,  '') +
    kasten(12, 'neunzig',  1143000, '5400000') +
    kasten(13, 'fuenfundvierzig', 2057400, '2700000') +
    kasten(14, 'minus',    2971800, '-5400000') +
    deckel(21, 1143000, '2700000') +
    bild(31, '5400000');

  const dateien = [
    { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>' },
    { name: '_rels/.rels', inhalt: relsDatei(rel('rId1', 'officeDocument', 'ppt/presentation.xml')) },
    { name: 'ppt/presentation.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
      '<p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst>' +
      '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>' },
    { name: 'ppt/_rels/presentation.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slide', 'slides/slide1.xml') + rel('rId2', 'slide', 'slides/slide2.xml')) },
    { name: 'ppt/slides/slide1.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
      folie + '</p:spTree></p:cSld>' + timing([21]) + '</p:sld>' },
    { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: relsDatei(
      rel('rId9', 'image', '../media/punkt.png')) },
    /* Folie 2 erbt einen GEDREHTEN Platzhalter — und darf gerade bleiben. */
    { name: 'ppt/slides/slide2.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
      '<p:sp><p:nvSpPr><p:cNvPr id="50" name="E"/><p:cNvSpPr/>' +
      '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/>' +
      '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr/><a:t>geerbt</a:t></a:r></a:p>' +
      '</p:txBody></p:sp>' +
      '</p:spTree></p:cSld></p:sld>' },
    { name: 'ppt/slides/_rels/slide2.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml')) },
    { name: 'ppt/slideLayouts/slideLayout1.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout ${ns}><p:cSld><p:spTree>` +
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
      '<p:sp><p:nvSpPr><p:cNvPr id="60" name="P"/><p:cNvSpPr/>' +
      '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>' +
      '<p:spPr><a:xfrm rot="2700000"><a:off x="914400" y="914400"/>' +
      '<a:ext cx="3657600" cy="457200"/></a:xfrm></p:spPr>' +
      '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>' +
      '</p:spTree></p:cSld></p:sldLayout>' },
    { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', inhalt: relsDatei('') },
    { name: 'ppt/media/punkt.png', inhalt: pngBytes },
  ];
  const blob = await Austausch.zipSchreiben(dateien);
  const r = await Einlesen.datei(new File([blob], 'Drehung.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blaetter = (Store.childrenOf(r.seite.id) || []).filter((b: any) => b.type === 'blatt');
  const alle = (i: number) => ((blaetter[i]?.marken || []) as any[])
    .map(m => ({ art: m.art, text: String(m.text || ''), dreh: m.dreh === undefined ? null : m.dreh }));
  return { f1: alle(0), f2: alle(1), seiteId: String(r.seite.id) };
});

const von = (t: string) => erg.f1.find((m: any) => m.text === t);

/* ══ §1 DIE VIER WINKEL ══════════════════════════════════════════════════ */
console.log('\n§1 60000stel Grad, auf 0…360 gebracht');
{
  gleich('Ohne `rot` trägt die Marke gar kein Feld', von('gerade')?.dreh, null);
  gleich('5400000 wird 90', von('neunzig')?.dreh, 90);
  gleich('2700000 wird 45', von('fuenfundvierzig')?.dreh, 45);
  /* -5400000 sind -90°, und das ist dieselbe Drehung wie 270. */
  gleich('-5400000 wird 270, nicht -90', von('minus')?.dreh, 270);
}

/* ══ §2 NICHT NUR TEXT ═══════════════════════════════════════════════════ */
console.log('\n§2 Auch Abdeckung und Bild drehen sich');
{
  const d = erg.f1.find((m: any) => m.art === 'abdeck');
  const b = erg.f1.find((m: any) => m.art === 'bild');
  p('Die Abdeckung ist da', !!d, JSON.stringify(erg.f1.map((m: any) => m.art)));
  gleich('… und steht auf 45', d?.dreh, 45);
  p('Das Bild ist da', !!b, JSON.stringify(erg.f1.map((m: any) => m.art)));
  gleich('… und steht auf 90', b?.dreh, 90);
}

/* ══ §3 DIE DREHUNG ERBT NICHT ═══════════════════════════════════════════ */
console.log('\n§3 Ein gedrehter Platzhalter im Layout vererbt seine Drehung NICHT');
{
  const g = erg.f2.find((m: any) => m.text === 'geerbt');
  p('Der geerbte Kasten ist da', !!g, JSON.stringify(erg.f2));
  gleich('… und steht gerade', g?.dreh, null);
}

/* ══ §4 UND SO WIRD ES GEZEICHNET ════════════════════════════════════════ */
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
  /* DEN KNOTEN BENENNEN: `svg.blatt-marken`, und den gezeichneten davon.
     Ein `find` über alle `svg` trifft ein Symbol (P41). */
  const svgEl = [...document.querySelectorAll('svg.blatt-marken')]
    .find(n => n.getBoundingClientRect().width > 10);
  if (!svgEl) return null;
  const raus: Array<{ text: string; transform: string }> = [];
  for (const g of [...svgEl.querySelectorAll('[data-sid]')]) {
    raus.push({ text: (g.textContent || '').trim().slice(0, 20),
                transform: g.getAttribute('transform') || '' });
  }
  return raus;
});
console.log('\n§4 Der gezeichnete Knoten trägt `rotate`');
{
  p('Es wurden Knoten gefunden', !!gemalt && gemalt.length >= 4,
    JSON.stringify(gemalt?.length));
  const t = (anfang: string) => gemalt?.find(g => g.text.startsWith(anfang))?.transform || '';
  gleich('Der gerade Kasten hat KEINEN transform', t('gerade'), '');
  p('Der 90°-Kasten trägt rotate(90 …)', /^rotate\(90 /.test(t('neunzig')), t('neunzig'));
  p('Der 45°-Kasten trägt rotate(45 …)', /^rotate\(45 /.test(t('fuenfundvierzig')), t('fuenfundvierzig'));
  p('Und der negative trägt rotate(270 …)', /^rotate\(270 /.test(t('minus')), t('minus'));
  /* Und der Drehpunkt ist die Mitte des Kastens, nicht seine Ecke. */
  const m = /^rotate\(90 ([\d.]+) ([\d.]+)\)/.exec(t('neunzig'));
  p('… um die MITTE, nicht um die Ecke',
    !!m && Number(m[1]) > 72 && Number(m[2]) > 90,
    'Drehpunkt ' + (m ? m[1] + '/' + m[2] : '—') + ' — die Ecke wäre 72/90');
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 518: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
