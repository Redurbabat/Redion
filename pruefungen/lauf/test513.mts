/* Suite 513 — Layout und Master: woran eine Folie ihr Aussehen erbt
 * ============================================================================
 * Redur: „ich will das die orginale pptx so wie es sich öfnnen ohne etwas
 * löschen oder etwas".
 *
 * DIE GRÖSSTE EINZELNE URSACHE, warum eine Folie NICHT aussieht wie im
 * Original, stand bis hierher nicht einmal in L151: Layout und Master wurden
 * überhaupt nicht gelesen. PowerPoint schreibt in das Folien-XML nur, was
 * die Folie SELBST ändert; alles andere erbt sie.
 *
 * ─── WAS DAS HEISST, GEMESSEN AN EINER FOLIE OHNE EIGENE ANGABEN ────────────
 * Eine Folie, die nur `<p:ph type="title"/>` und ihren Text trägt — genau
 * das schreibt PowerPoint, wenn man in eine Vorlage tippt:
 *
 *   VORHER   Lage geraten (breite · 0,08 / hoehe · 0,1), Grad geraten (40),
 *            Hintergrund weiss
 *   NACHHER  Lage aus dem Layout, Grad aus dem Layout, Hintergrund aus dem
 *            Master
 *
 * ─── DIE KETTE IST ZWEISTUFIG, UND SIE LÄUFT ÜBER `.rels` ───────────────────
 *     Folie  →  ihr Layout  →  dessen Master
 * Jede Stufe gewinnt gegen die darüber. Verbunden wird über `r:id`, nicht
 * über Dateinamen: `slide7.xml` muss nicht `slideLayout7.xml` benutzen. §3
 * baut deshalb ausdrücklich eine Datei, in der die Nummern NICHT passen.
 *
 * ─── WAS BEWUSST NICHT GEERBT WIRD ──────────────────────────────────────────
 * Eine Themenfarbe (`schemeClr`) bleibt liegen: ohne `theme1.xml` ist sie
 * gar nicht auflösbar, und eine falsche Hintergrundfarbe wäre schlimmer als
 * keine — sie macht den Text unlesbar, und man sieht nicht, woher sie kommt.
 * §4 misst, dass sie wirklich liegen bleibt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → die Erbkette gar nicht lesen:                  5 rot (Lage, Grad, Hintergrund)
 *   G2 → nur das Layout, nicht den Master:              1 rot (der Hintergrund fehlt)
 *   G3 → `ctrTitle` nicht auf `title` abbilden:         2 rot (der Titel erbt nichts)
 *   G4 → auch Themenfarben als Hintergrund nehmen:      1 rot (liefert "#bg2")
 *   G5 → die Tinte nicht am Kontrast kippen lassen:     2 rot (schwarz bleibt schwarz)
 *
 *   node pruefungen/lauf/test513.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const Einlesen: any;
declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9623;
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

  /* Ein Platzhalter MIT Lage und Grad — so steht er im Layout. */
  const vorgabe = (typ: string, idx: string, x: number, y: number,
                   cx: number, cy: number, sz: number) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${10 + Number(idx)}" name="P"/><p:cNvSpPr/>` +
    `<p:nvPr><p:ph type="${typ}" idx="${idx}"/></p:nvPr></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:lstStyle><a:lvl1pPr><a:defRPr sz="${sz * 100}"/></a:lvl1pPr>` +
    '</a:lstStyle><a:p/></p:txBody></p:sp>';

  /* Eine Folie, die NUR den Platzhaltertyp und ihren Text trägt — keine
     Lage, kein Grad. Genau das schreibt PowerPoint beim Tippen in eine
     Vorlage. */
  const erbt = (typ: string, idx: string, text: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${30 + Number(idx)}" name="E"/><p:cNvSpPr/>` +
    `<p:nvPr><p:ph type="${typ}" idx="${idx}"/></p:nvPr></p:nvSpPr><p:spPr/>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr/><a:t>${text}</a:t></a:r></a:p>` +
    '</p:txBody></p:sp>';

  const huelle = (inhalt: string, bg = '', wurzel = 'p:sld') =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><${wurzel} ${ns}><p:cSld>` +
    bg + '<p:spTree>' +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + `</p:spTree></p:cSld></${wurzel}>`;

  const bgFest = '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="102A43"/></a:solidFill>' +
    '<a:effectLst/></p:bgPr></p:bg>';
  const bgThema = '<p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg2"/></a:solidFill>' +
    '<a:effectLst/></p:bgPr></p:bg>';

  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (inhalt: string) =>
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    inhalt + '</Relationships>';

  /* DIE NUMMERN PASSEN ABSICHTLICH NICHT: slide1 benutzt slideLayout9,
     und das benutzt slideMaster3. Wer über Dateinamen rät, findet nichts. */
  const dateien = [
    { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="xml" ContentType="application/xml"/></Types>' },
    { name: '_rels/.rels', inhalt: relsDatei(rel('rId1', 'officeDocument', 'ppt/presentation.xml')) },
    { name: 'ppt/presentation.xml', inhalt:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
      '<p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst>' +
      '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>' },
    { name: 'ppt/_rels/presentation.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slide', 'slides/slide1.xml') + rel('rId2', 'slide', 'slides/slide2.xml')) },

    /* Folie 1 — erbt alles. */
    { name: 'ppt/slides/slide1.xml', inhalt: huelle(
      erbt('ctrTitle', '0', 'Geerbter Titel') + erbt('body', '1', 'Geerbter Text')) },
    { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slideLayout', '../slideLayouts/slideLayout9.xml')) },

    /* Folie 2 — überschreibt die Lage selbst; das Layout darf nicht gewinnen. */
    { name: 'ppt/slides/slide2.xml', inhalt: huelle(
      `<p:sp><p:nvSpPr><p:cNvPr id="40" name="X"/><p:cNvSpPr/>` +
      '<p:nvPr><p:ph type="title" idx="0"/></p:nvPr></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="2743200" y="2286000"/><a:ext cx="1828800" cy="457200"/>' +
      '</a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1100"/>' +
      '<a:t>Eigene Lage</a:t></a:r></a:p></p:txBody></p:sp>') },
    { name: 'ppt/slides/_rels/slide2.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slideLayout', '../slideLayouts/slideLayout9.xml')) },

    /* DAS LAYOUT: Titel bei (36, 18) pt in 44 pt; Text bei (72, 144) pt in
       18 pt. Es gibt KEINEN Hintergrund an — der kommt vom Master. */
    { name: 'ppt/slideLayouts/slideLayout9.xml', inhalt: huelle(
      vorgabe('title', '0', 457200, 228600, 7772400, 914400, 44) +
      vorgabe('body', '1', 914400, 1828800, 6858000, 2286000, 18),
      '', 'p:sldLayout') },
    { name: 'ppt/slideLayouts/_rels/slideLayout9.xml.rels', inhalt: relsDatei(
      rel('rId1', 'slideMaster', '../slideMasters/slideMaster3.xml')) },

    /* DER MASTER: er bringt den Hintergrund UND eine Vorgabe, die das
       Layout nicht hat — `body#2`. */
    { name: 'ppt/slideMasters/slideMaster3.xml', inhalt: huelle(
      vorgabe('body', '2', 457200, 4114800, 8229600, 457200, 12),
      bgFest, 'p:sldMaster') },
  ];

  const blob = await Austausch.zipSchreiben(dateien);
  const r = await Einlesen.datei(new File([blob], 'Vorlage.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blaetter = (Store.childrenOf(r.seite.id) || []).filter((b: any) => b.type === 'blatt');
  const marken = (i: number) => ((blaetter[i]?.marken || []) as any[])
    .filter(m => m.art === 'text')
    .map(m => ({ text: m.text, sz: m.fontSize, farbe: String(m.farbe || ''),
                 x: Math.round(m.point ? m.point[0] : 0),
                 y: Math.round(m.point ? m.point[1] : 0),
                 breite: Math.round(m.breiteBox || 0) }));

  /* Und derselbe Master mit einer THEMENFARBE — die darf nicht ankommen. */
  const dateien2 = dateien.map(d => d.name === 'ppt/slideMasters/slideMaster3.xml'
    ? { name: d.name, inhalt: huelle(vorgabe('body', '2', 457200, 4114800, 8229600, 457200, 12),
        bgThema, 'p:sldMaster') }
    : d);
  const blob2 = await Austausch.zipSchreiben(dateien2);
  const r2 = await Einlesen.datei(new File([blob2], 'Thema.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blatt2 = (Store.childrenOf(r2.seite.id) || []).find((b: any) => b.type === 'blatt');

  /* ── §5: DIESELBE FOLIE AUF DREI GRÜNDEN ────────────────────────────────
     Ein Absatz OHNE eigene Farbe zeichnet `#111111`. Auf einem dunklen
     Grund ist das unsichtbar — also muss die Tinte kippen, aber nur dann.
     Gemessen wird an der Kante: `#767676` erreicht gegen `#111111` nur
     4,16:1 und muss kippen, `#888888` erreicht 5,33:1 und darf nicht. */
  const aufGrund = async (rgb: string, name: string) => {
    const d = dateien.map(x => x.name === 'ppt/slideMasters/slideMaster3.xml'
      ? { name: x.name, inhalt: huelle(
          vorgabe('body', '2', 457200, 4114800, 8229600, 457200, 12),
          '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="' + rgb + '"/></a:solidFill>' +
          '<a:effectLst/></p:bgPr></p:bg>', 'p:sldMaster') }
      : x);
    const b = await Austausch.zipSchreiben(d);
    const r = await Einlesen.datei(new File([b], name + '.pptx',
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    const bl = (Store.childrenOf(r.seite.id) || []).find((x: any) => x.type === 'blatt');
    const m = ((bl?.marken || []) as any[]).find(x => x.art === 'text' && /Geerbter Titel/.test(x.text));
    return String(m?.farbe || '');
  };

  return {
    titelSeite: blaetter[0]?.text || '',
    grundfarbe: (blaetter[0] as any)?.grundfarbe || '',
    f1: marken(0), f2: marken(1),
    themaFarbe: (blatt2 as any)?.grundfarbe || '',
    tinteDunkel: await aufGrund('102A43', 'Dunkel'),
    tinteKante:  await aufGrund('767676', 'Kante'),
    tinteHell:   await aufGrund('888888', 'Hell'),
    tinteWeiss:  await aufGrund('FFFFFF', 'Weiss'),
  };
});

/* ══ §1 LAGE UND GRAD KOMMEN AUS DEM LAYOUT ══════════════════════════════ */
console.log('\n§1 Eine Folie ohne eigene Angaben erbt Lage und Grad');
{
  const titel = erg.f1.find((m: any) => /Geerbter Titel/.test(m.text));
  const text = erg.f1.find((m: any) => /Geerbter Text/.test(m.text));
  p('Beide Kästen sind da', !!titel && !!text, JSON.stringify(erg.f1));
  /* Layout: Titel bei 457200/228600 EMU = (36, 18) pt, 44 pt Grad. */
  p('Der Titel sitzt an der Stelle aus dem Layout',
    titel && Math.abs(titel.x - 36) <= 1 && Math.abs(titel.y - 18) <= 1,
    JSON.stringify(titel) + ' — erwartet (36, 18)');
  gleich('… und in seinem Grad', titel?.sz, 44);
  /* Layout: Text bei 914400/1828800 = (72, 144) pt, 18 pt. */
  p('Der Textkasten ebenso',
    text && Math.abs(text.x - 72) <= 1 && Math.abs(text.y - 144) <= 1,
    JSON.stringify(text) + ' — erwartet (72, 144)');
  gleich('… und in seinem Grad', text?.sz, 18);
  /* Ohne Vererbung wären es 0,08 · 960 = 77 und 0,1 · 540 = 54, und der
     Grad wäre die geratene 40 bzw. 20. Die Zahlen liegen weit genug
     auseinander, dass kein Zufall sie trifft. */
  p('Und NICHT auf der geratenen Stelle (77 / 54)',
    titel && titel.x !== 77 && titel.y !== 54, JSON.stringify(titel));
}

/* ══ §2 DIE FOLIE GEWINNT GEGEN DAS LAYOUT ═══════════════════════════════ */
console.log('\n§2 Was die Folie selbst angibt, bleibt ihres');
{
  const eigen = erg.f2[0] as any;
  /* 2743200/2286000 EMU = (216, 180) pt, Grad 11. */
  p('Die eigene Lage gilt',
    eigen && Math.abs(eigen.x - 216) <= 1 && Math.abs(eigen.y - 180) <= 1,
    JSON.stringify(eigen) + ' — erwartet (216, 180)');
  gleich('… und der eigene Grad', eigen?.sz, 11);
  p('… also NICHT die Lage aus dem Layout (36 / 18)',
    eigen && eigen.x !== 36, JSON.stringify(eigen));
}

/* ══ §3 DER HINTERGRUND KOMMT AUS DEM MASTER ═════════════════════════════ */
console.log('\n§3 Der Hintergrund erbt sich über zwei Stufen');
{
  gleich('Die Folie hat die Farbe des Masters', erg.grundfarbe, '#102A43');
  p('Und der Seitentitel ist der geerbte Titel', /Geerbter Titel/.test(erg.titelSeite),
    erg.titelSeite);
}

/* ══ §4 EINE THEMENFARBE BLEIBT LIEGEN ═══════════════════════════════════ */
console.log('\n§4 `schemeClr` wird NICHT geraten (§11: lieber nichts als falsch)');
{
  gleich('Kein Hintergrund aus einer Themenfarbe', erg.themaFarbe, '');
}

/* ══ §5 DIE TINTE MUSS AUF DEM GEERBTEN GRUND LESBAR BLEIBEN ═════════════ */
console.log('\n§5 Schwarz auf Dunkelblau wäre unsichtbar — der Kontrast entscheidet');
{
  /* Ein Absatz ohne eigene Farbe zeichnet `#111111` (marken.ts:11). Genau
     dieser Fall war der Preis von §3: bis E558 war jedes Blatt weiss, seit
     E558 kann es dunkel sein — und dann ist die gewohnte Tinte weg.

     Die Zahlen sind gerechnet, nicht gefühlt (WCAG-Kontrast gegen #111111):
        #102A43 → 1,29:1   kippt
        #767676 → 4,16:1   kippt (knapp unter 4,5)
        #888888 → 5,33:1   bleibt
        #ffffff → 18,88:1  bleibt */
  gleich('Auf dunklem Grund wird die Tinte weiss', erg.tinteDunkel, '#ffffff');
  gleich('Knapp unter 4,5:1 kippt sie noch (#767676)', erg.tinteKante, '#ffffff');
  gleich('Knapp darüber nicht mehr (#888888)', erg.tinteHell, '');
  gleich('Und auf Weiss ändert sich gar nichts', erg.tinteWeiss, '');
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 513: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
