/* Suite 512 — Ein Absatz hat sein eigenes Format, nicht das des Kastens
 * ============================================================================
 * Redur: „verbesser für die pptx öfnnen". E555 hat den Datenverlust behoben
 * (Gruppen); dies ist der Punkt, den man beim Öffnen als ERSTES sieht.
 *
 * ─── WAS GEMESSEN WURDE, BEVOR ETWAS GEBAUT WURDE ───────────────────────────
 * Der Leser nahm `txBody.getElementsByTagName('a:rPr')[0]` — den ersten Lauf
 * der ersten Zeile — für den GANZEN Kasten. An einer eigens gebauten Datei:
 *
 *   „klein"(12 pt) + „GROSS"(36 pt, fett, blau)
 *        →  EINE Marke „klein GROSS", fontSize 12, fett false
 *   Titel mit `srgbClr CC0000`
 *        →  Marke ohne `farbe`-Feld, zeichnet also schwarz
 *   drei Absätze auf lvl 0/1/2 mit `buChar`
 *        →  EINE Marke, flacher Block, keine Einrückung, keine Zeichen
 *
 * ─── DIE REGEL: AUFTEILEN NUR, WENN ES ETWAS BRINGT ─────────────────────────
 * Absätze, die sich in NICHTS unterscheiden, bleiben EINE Marke mit `\n`
 * dazwischen — genau wie bisher. Das ist der häufige Fall, und dort ist eine
 * Marke die bessere: wer den Textkasten im Editor schiebt, schiebt den
 * Kasten und nicht eine Zeile.
 *
 * Aufgeteilt wird erst, wenn Grad, Gewicht, Farbe oder Ebene auseinandergehen.
 * Dann ist EINE Marke schlicht falsch.
 *
 * ─── DIE HÖHEN KOMMEN VOM ZEICHNER ──────────────────────────────────────────
 * `InkGeometry.textLayout` ist dieselbe Rechnung, die das Blatt später
 * benutzt, samt Umbruch an `breiteBox`. Eine eigene Schätzung („Grad mal
 * 1,25") liefe bei jedem umbrechenden Absatz in den nächsten hinein — §4
 * misst genau diesen Fall mit einem absichtlich viel zu langen Absatz.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → wieder den ersten `a:rPr` des Kastens nehmen:   15 grün, 9 rot  ({"text":"klein\\nGROSS","sz":12,"fett":false,"farbe":""} — der alte Zustand, wörtlich)
 *   G2 → nie aufteilen (immer eine Marke):               6 rot, dann Abbruch — bei einer statt drei Marken greift §3 ins Leere
 *   G3 → die Höhe schätzen statt rechnen:                23 grün, 1 rot  („18 pt Abstand" statt über 40 — der zweite Absatz läuft in den ersten)
 *   G4 → immer aufteilen (auch bei gleichem Format):     22 grün, 2 rot  (drei gleiche Absätze werden drei Marken statt einer)
 *
 *   node pruefungen/lauf/test512.mts
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
const PORT = 9622;
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

  /** Ein Kasten mit beliebig vielen Absätzen. */
  const kasten = (id: number, x: number, y: number, cx: number, cy: number,
                  absaetze: string, ph = '') =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/>` +
    `<p:nvPr>${ph}</p:nvPr></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/>${absaetze}</p:txBody></p:sp>`;

  const abs = (text: string, o: { sz?: number; b?: boolean; farbe?: string;
                                  lvl?: number; bu?: string } = {}) =>
    '<a:p>' +
    (o.lvl !== undefined || o.bu
      ? `<a:pPr${o.lvl !== undefined ? ` lvl="${o.lvl}"` : ''}>` +
        (o.bu ? `<a:buChar char="${o.bu}"/>` : '') + '</a:pPr>'
      : '') +
    '<a:r><a:rPr' + (o.sz ? ` sz="${o.sz * 100}"` : '') + (o.b ? ' b="1"' : '') + '>' +
    (o.farbe ? `<a:solidFill><a:srgbClr val="${o.farbe}"/></a:solidFill>` : '') +
    `</a:rPr><a:t>${text}</a:t></a:r></a:p>`;

  /* FOLIE 1 — gemischte Grade im selben Kasten, dazu ein roter Titel. */
  const f1 =
    kasten(2, 457200, 228600, 5486400, 685800,
      abs('Roter Titel', { sz: 32, b: true, farbe: 'CC0000' }),
      '<p:ph type="title"/>') +
    kasten(3, 457200, 1371600, 5486400, 1371600,
      abs('klein', { sz: 12 }) + abs('GROSS', { sz: 36, b: true, farbe: '0000FF' }));

  /* FOLIE 2 — drei Gliederungsebenen mit Aufzählungszeichen. */
  const f2 = kasten(4, 457200, 457200, 5486400, 1828800,
    abs('Erster Punkt', { sz: 20, lvl: 0, bu: '•' }) +
    abs('Unterpunkt', { sz: 18, lvl: 1, bu: '–' }) +
    abs('Tiefer', { sz: 16, lvl: 2, bu: '·' }));

  /* FOLIE 3 — DREI ABSÄTZE MIT GLEICHEM FORMAT. Sie sollen EINE Marke
     bleiben; aufteilen brächte hier nichts und nähme dem Editor den Kasten. */
  const f3 = kasten(5, 457200, 457200, 5486400, 1828800,
    abs('Eins', { sz: 20 }) + abs('Zwei', { sz: 20 }) + abs('Drei', { sz: 20 }));

  /* FOLIE 4 — ein ABSICHTLICH viel zu langer Absatz vor einem kurzen.
     Er bricht um; eine geschätzte Zeilenhöhe liesse den nächsten in ihn
     hineinlaufen. */
  const lang = 'Ein sehr langer Absatz der ganz sicher umbricht weil er ' +
    'viel mehr Woerter enthaelt als in eine einzige Zeile dieser Breite passen ' +
    'und deshalb mindestens zwei oder drei Zeilen braucht';
  const f4 = kasten(6, 457200, 457200, 2743200, 2286000,
    abs(lang, { sz: 14 }) + abs('Danach', { sz: 28, b: true }));

  const folie = (inhalt: string) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + '</p:spTree></p:cSld></p:sld>';

  const ids = [1, 2, 3, 4];
  const praes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
    '<p:sldIdLst>' + ids.map((n, i) => `<p:sldId id="${255 + n}" r:id="rId${i + 1}"/>`).join('') +
    '</p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/></p:presentation>';
  const praesRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    ids.map((n, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${n}.xml"/>`).join('') +
    '</Relationships>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>';
  const types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="xml" ContentType="application/xml"/></Types>';

  const blob = await Austausch.zipSchreiben([
    { name: '[Content_Types].xml', inhalt: types },
    { name: '_rels/.rels', inhalt: rels },
    { name: 'ppt/presentation.xml', inhalt: praes },
    { name: 'ppt/_rels/presentation.xml.rels', inhalt: praesRels },
    { name: 'ppt/slides/slide1.xml', inhalt: folie(f1) },
    { name: 'ppt/slides/slide2.xml', inhalt: folie(f2) },
    { name: 'ppt/slides/slide3.xml', inhalt: folie(f3) },
    { name: 'ppt/slides/slide4.xml', inhalt: folie(f4) },
  ]);
  const r = await Einlesen.datei(new File([blob], 'Absaetze.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blaetter = (Store.childrenOf(r.seite.id) || []).filter((b: any) => b.type === 'blatt');
  const texte = (i: number) => ((blaetter[i]?.marken || []) as any[])
    .filter(m => m.art === 'text')
    .map(m => ({ text: m.text, sz: m.fontSize, fett: !!m.fett, farbe: m.farbe || '',
                 x: Math.round(m.point ? m.point[0] : 0),
                 y: Math.round(m.point ? m.point[1] : 0),
                 breite: Math.round(m.breiteBox || 0) }));
  return { titel: blaetter[0]?.text || '',
           f1: texte(0), f2: texte(1), f3: texte(2), f4: texte(3) };
});

/* ══ §1 GEMISCHTE GRADE IM SELBEN KASTEN ════════════════════════════════ */
console.log('\n§1 „klein"(12) und „GROSS"(36) sind zwei Absätze, nicht einer');
{
  const klein = erg.f1.find((m: any) => /klein/.test(m.text));
  const gross = erg.f1.find((m: any) => /GROSS/.test(m.text));
  p('Beide Absätze sind da', !!klein && !!gross, JSON.stringify(erg.f1));
  gleich('„klein" ist 12 pt', klein?.sz, 12);
  gleich('„GROSS" ist 36 pt — nicht 12', gross?.sz, 36);
  p('… und fett', gross?.fett, JSON.stringify(gross));
  gleich('… und blau', gross?.farbe, '#0000FF');
  p('„GROSS" steht UNTER „klein"', (gross?.y ?? 0) > (klein?.y ?? 0),
    klein?.y + ' → ' + gross?.y);
}

/* ══ §2 DIE FARBE DES TITELS ════════════════════════════════════════════ */
console.log('\n§2 Ein roter Titel kommt rot an');
{
  const t = erg.f1.find((m: any) => /Roter Titel/.test(m.text));
  gleich('Der Titel ist rot', t?.farbe, '#CC0000');
  gleich('… und 32 pt', t?.sz, 32);
  p('… und fett', t?.fett);
  gleich('Und er ist der Seitentitel geworden', erg.titel, 'Roter Titel');
}

/* ══ §3 GLIEDERUNGSEBENEN UND AUFZÄHLUNGSZEICHEN ════════════════════════ */
console.log('\n§3 Drei Ebenen, drei Einrückungen, drei Zeichen');
{
  gleich('Drei Marken', erg.f2.length, 3);
  const [a, b, c] = erg.f2 as any[];
  p('Jede trägt ihr Aufzählungszeichen',
    /^•/.test(a?.text) && /^–/.test(b?.text) && /^·/.test(c?.text),
    JSON.stringify(erg.f2.map((m: any) => m.text)));
  p('Jede Ebene rückt weiter ein', a.x < b.x && b.x < c.x,
    [a.x, b.x, c.x].join(' < '));
  p('… und die Kastenbreite schrumpft entsprechend',
    a.breite > b.breite && b.breite > c.breite, [a.breite, b.breite, c.breite].join(' > '));
  p('Die Grade bleiben je Absatz', a.sz === 20 && b.sz === 18 && c.sz === 16,
    [a.sz, b.sz, c.sz].join(', '));
}

/* ══ §4 GLEICHES FORMAT BLEIBT EINE MARKE ═══════════════════════════════ */
console.log('\n§4 Drei gleiche Absätze bleiben EIN Kasten (aufteilen bringt nichts)');
{
  gleich('Genau eine Marke', erg.f3.length, 1);
  gleich('… mit allen drei Zeilen', erg.f3[0]?.text, 'Eins\nZwei\nDrei');
  gleich('… und ihrem Grad', erg.f3[0]?.sz, 20);
}

/* ══ §5 EIN UMBRECHENDER ABSATZ SCHIEBT DEN NÄCHSTEN RICHTIG WEITER ═════ */
console.log('\n§5 Die Höhe kommt vom Zeichner, nicht aus einer Schätzung');
{
  gleich('Zwei Marken', erg.f4.length, 2);
  const [lang, kurz] = erg.f4 as any[];
  /* Der lange Absatz ist 14 pt und bricht in einem 216-pt-Kasten um. Eine
     Schätzung „14 · 1,25 = 17,5" wäre die Höhe EINER Zeile; er braucht
     mehrere. Der Abstand muss also deutlich grösser sein als 17,5. */
  const abstand = (kurz?.y ?? 0) - (lang?.y ?? 0);
  p('Der zweite Absatz steht deutlich weiter unten als eine Zeile',
    abstand > 40, abstand + ' pt Abstand — eine einzelne Zeile wären ~17,5');
  p('… und sie überlappen nicht', abstand > 0, String(abstand));
  gleich('Der lange ist 14 pt', lang?.sz, 14);
  gleich('Der kurze ist 28 pt', kurz?.sz, 28);
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 512: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
