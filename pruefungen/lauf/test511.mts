/* Suite 511 — Eine Gruppe ist kein Loch: was in ihr liegt, kommt an
 * ============================================================================
 * Redur: „verbesser für die pptx öfnnen".
 *
 * Untersucht wurde der ganze Leser; der schwerste Fund hat Datenverlust-Rang
 * (§46 Nr. 3) und kommt deshalb zuerst.
 *
 * ─── WAS GEMESSEN WURDE, BEVOR ETWAS GEBAUT WURDE ───────────────────────────
 * An einer eigens gebauten .pptx, gegen den alten Leser:
 *
 *   · gruppierter Deckel (`p:grpSp` mit `p:sp` darin)
 *       →  Marken = [{art:'text', text:'Die Antwort ist 42'}]
 *       →  DIE ABDECKUNG FEHLT. DIE ANTWORT STEHT OFFEN.
 *   · Gruppe mit Text und Bild  →  0 Marken
 *   · Tabelle (`p:graphicFrame` mit `a:tbl`), 2 × 2 Zellen  →  0 Marken
 *   · und der Hinweis sagte: „1 Folien übernommen"
 *     Kein Wort davon, dass etwas fehlt.
 *
 * Der Grund: die Schleife lief über `baum.children` und kannte genau zwei
 * Marken, `p:sp` und `p:pic`. Ein `p:grpSp` fällt durch beide Siebe — mit
 * allem, was darin liegt.
 *
 * DAS IST DERSELBE FEHLER WIE E541, eine Verschachtelung tiefer. Dort waren
 * es Formen ohne Text, die übersprungen wurden — und Abdeckungen haben
 * keinen. Die Folie sah beide Male vollständig aus.
 *
 * ─── UND DIE ZWEITE HÄLFTE: SAGEN, WAS FEHLT ────────────────────────────────
 * §11 sagt es für die Sicherung: „eine Sicherung, die nicht sagt, was sie
 * auslässt, ist die gefährlichste Sorte". Für einen Import gilt es genauso.
 * Der Hinweis zählt jetzt auch das Weggelassene — Tabellen, Diagramme,
 * Formen mit unbekanntem Umriss, zu tief verschachtelte Gruppen.
 *
 * Was NICHT gezählt wird: eine Form ohne Text UND ohne Fläche. Sonst zählte
 * jeder unsichtbare Platzhalter mit, und eine Zahl, die immer dasteht, liest
 * niemand mehr.
 *
 * ─── DIE KINDKOORDINATEN ────────────────────────────────────────────────────
 * Eine Gruppe darf ihren Inhalt verschieben UND skalieren: `a:off`/`a:ext`
 * ist der Kasten aussen, `a:chOff`/`a:chExt` das System innen. Sind beide
 * gleich — der Normalfall —, ändert die Abbildung nichts. §3 baut deshalb
 * ausdrücklich eine Gruppe, bei der sie NICHT gleich sind: eine halb so
 * grosse Innenwelt, also Faktor zwei.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Sie IST vor der Reparatur rot:                     sie konnte es nicht sein — sie ist mit dem Bogen entstanden; gemessen wurde der alte Zustand mit einem eigenen Skript (Deckel weg, 0 Marken, Hinweis schweigt)
 * Dazu nach der Reparatur:
 *   G1 → die Gruppen-Rekursion ausschalten:            7 grün,  9 rot  (Folie 1 hat GAR KEINE Marken mehr)
 *   G2 → die Kindkoordinaten nicht abbilden:           13 grün, 3 rot  (Kinder stehen bei (0,0) und (72,36) — den Innenkoordinaten)
 *   G3 → das Weggelassene nicht in den Hinweis:        13 grün, 3 rot  (der Hinweis liest wieder „3 Folien übernommen, 1 Antworten zugedeckt", Punkt)
 *
 *   node pruefungen/lauf/test511.mts
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
const PORT = 9621;
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

  const textKasten = (id: number, x: number, y: number, cx: number, cy: number, text: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/>` +
    `<a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;

  /* Eine Abdeckung: Fläche, keine Schrift — und ein Klickschritt dazu. */
  const deckel = (id: number, x: number, y: number, cx: number, cy: number) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="D${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    '<a:solidFill><a:srgbClr val="FFCC00"/></a:solidFill></p:spPr>' +
    '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';

  const klick = (spid: number) =>
    '<p:par><p:cTn nodeType="clickEffect"><p:childTnLst>' +
      '<p:animEffect filter="dissolve" transition="out"><p:cBhvr>' +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr></p:animEffect>` +
    '</p:childTnLst></p:cTn></p:par>';

  /* FOLIE 1 — der Fall, der die Antwort aufdeckte:
     Text und Deckel liegen ZUSAMMEN in einer Gruppe. Innen- und Aussenmass
     sind gleich, also verschiebt die Gruppe nichts. */
  const gruppeEins =
    '<p:grpSp><p:nvGrpSpPr><p:cNvPr id="20" name="G1"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
    '<a:grpSpPr><a:xfrm><a:off x="457200" y="1828800"/><a:ext cx="5486400" cy="914400"/>' +
    '<a:chOff x="457200" y="1828800"/><a:chExt cx="5486400" cy="914400"/></a:xfrm></a:grpSpPr>' +
    textKasten(9, 457200, 1828800, 5486400, 457200, 'Die Antwort ist 42') +
    deckel(7, 457200, 1828800, 5486400, 457200) +
    '</p:grpSp>';

  /* FOLIE 2 — die Gruppe SKALIERT: aussen doppelt so gross wie innen.
     Ein Kind bei chOff sitzt danach bei off; ein Kind eine Innenbreite
     weiter rechts sitzt zwei Aussenbreiten weiter. */
  const gruppeZwei =
    '<p:grpSp><p:nvGrpSpPr><p:cNvPr id="30" name="G2"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
    '<a:grpSpPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="3657600" cy="1828800"/>' +
    '<a:chOff x="0" y="0"/><a:chExt cx="1828800" cy="914400"/></a:xfrm></a:grpSpPr>' +
    /* Kind genau auf dem Nullpunkt der Innenwelt → landet auf off. */
    textKasten(31, 0, 0, 914400, 457200, 'Ecke') +
    /* Kind auf halber Innenbreite → landet auf off + halbe Aussenbreite. */
    textKasten(32, 914400, 457200, 914400, 457200, 'Mitte') +
    '</p:grpSp>';

  /* FOLIE 3 — was NICHT ankommt, aber genannt werden muss. */
  const tabelle =
    '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="40" name="Tab"/>' +
    '<p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>' +
    '<p:xfrm><a:off x="457200" y="457200"/><a:ext cx="5486400" cy="1828800"/></p:xfrm>' +
    '<a:graphic><a:graphicData><a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>Spannung</a:t>' +
    '</a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
  const gefuellteForm =
    '<p:sp><p:nvSpPr><p:cNvPr id="41" name="Pfeil"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' +
    '<p:spPr><a:xfrm><a:off x="457200" y="2743200"/><a:ext cx="914400" cy="457200"/></a:xfrm>' +
    '<a:prstGeom prst="rightArrow"/><a:solidFill><a:srgbClr val="00AA55"/></a:solidFill></p:spPr>' +
    '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';

  const folie = (inhalt: string, timing = '') =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + '</p:spTree></p:cSld>' +
    (timing ? '<p:timing><p:tnLst>' + timing + '</p:tnLst></p:timing>' : '') + '</p:sld>';

  const praes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
    '<p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/>' +
    '<p:sldId id="258" r:id="rId3"/></p:sldIdLst>' +
    '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>';
  const praesRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/></Relationships>';
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
    { name: 'ppt/slides/slide1.xml', inhalt: folie(gruppeEins, klick(7)) },
    { name: 'ppt/slides/slide2.xml', inhalt: folie(gruppeZwei) },
    { name: 'ppt/slides/slide3.xml', inhalt: folie(tabelle + gefuellteForm) },
  ]);
  const r = await Einlesen.datei(new File([blob], 'Gruppen.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blaetter = (Store.childrenOf(r.seite.id) || []).filter((b: any) => b.type === 'blatt');
  const marken = (i: number) => (blaetter[i]?.marken || []) as any[];
  return {
    hinweis: String(r.hinweis || ''),
    blaetter: blaetter.length,
    /* Folie 1 */
    f1: marken(0).map(m => ({ art: m.art, text: m.text, schritt: m.schritt })),
    /* Folie 2 — die Lagen, auf einen Punkt gerundet */
    f2: marken(1).map(m => ({ art: m.art, text: m.text,
      x: Math.round(m.point ? m.point[0] : 0), y: Math.round(m.point ? m.point[1] : 0) })),
    /* Die Masse der Folie, um die Rechnung nachvollziehen zu können */
    mass: { b: blaetter[0]?.blattBreite, h: blaetter[0]?.blattHoehe },
    f3: marken(2).length,
  };
});

/* ══ §1 DER GRUPPIERTE DECKEL KOMMT AN ═══════════════════════════════════ */
console.log('\n§1 Eine Abdeckung in einer Gruppe deckt weiter zu');
{
  gleich('Drei Folien angekommen', erg.blaetter, 3);
  const arten = erg.f1.map((m: any) => m.art).sort();
  p('Folie 1 hat Text UND Abdeckung', arten.join(',') === 'abdeck,text',
    JSON.stringify(erg.f1));
  const deckel = erg.f1.find((m: any) => m.art === 'abdeck');
  p('DIE ANTWORT IST ZUGEDECKT — der Fund dieses Bogens', !!deckel,
    'ohne sie stünde „Die Antwort ist 42" offen auf der Folie');
  p('… und sie trägt ihren Klickschritt', Number(deckel?.schritt) > 0,
    String(deckel?.schritt));
  const text = erg.f1.find((m: any) => m.art === 'text');
  gleich('… und der Text daneben ist der richtige', text?.text, 'Die Antwort ist 42');
}

/* ══ §2 EINE SKALIERTE GRUPPE RECHNET IHRE KINDER UM ═════════════════════ */
console.log('\n§2 Kindkoordinaten: `a:chOff`/`a:chExt` werden abgebildet');
{
  gleich('Beide Kinder der Gruppe sind da', erg.f2.length, 2);
  const ecke = erg.f2.find((m: any) => m.text === 'Ecke');
  const mitte = erg.f2.find((m: any) => m.text === 'Mitte');
  /* DIE RECHNUNG, UND SIE HAT MICH BEIM ERSTEN LAUF KORRIGIERT.
     Hier stand „erwartet (360, 144)", und der Lauf meldete 216. Nachgerechnet
     hatte der CODE recht:

       aussen  off  = 914400 / 914400 EMU  = (72, 72) pt
               ext  = 3657600 × 1828800    = 288 × 144 pt
       innen   chOff= 0 / 0                = (0, 0) pt
               chExt= 1828800 × 914400     = 144 × 72 pt
       Faktor  sx = 288/144 = 2      sy = 144/72 = 2

       Kind „Ecke"  bei (0, 0) pt     → 72 + 0·2  = 72  | 72 + 0·2  = 72
       Kind „Mitte" bei (72, 36) pt   → 72 + 72·2 = 216 | 72 + 36·2 = 144

     Mein Fehler war, 914400 EMU für die halbe AUSSENbreite zu halten; es
     sind 72 pt, also die halbe INNENbreite. §45/E21 gilt auch für
     Kopfrechnen: nachrechnen, nicht schätzen. */
  p('Das Kind auf dem Nullpunkt sitzt auf der Gruppenecke',
    ecke && Math.abs(ecke.x - 72) <= 1 && Math.abs(ecke.y - 72) <= 1,
    JSON.stringify(ecke) + ' — erwartet (72, 72)');
  p('Das Kind auf halber Innenbreite sitzt doppelt so weit vom Rand',
    mitte && Math.abs(mitte.x - 216) <= 1 && Math.abs(mitte.y - 144) <= 1,
    JSON.stringify(mitte) + ' — erwartet (216, 144)');
  /* Die Gegenprobe im Prüflauf selbst: OHNE Abbildung stünde „Mitte" bei
     (72, 36) — also da, wo die Innenwelt es hat. Der Unterschied ist gross
     genug, dass keine Rundung ihn verwischt. */
  p('… und nicht bei den Innenkoordinaten', mitte && mitte.x !== 72,
    'ohne Abbildung stünde (72, 36) statt (216, 144)');
}

/* ══ §3 WAS FEHLT, STEHT IM HINWEIS ══════════════════════════════════════ */
console.log('\n§3 Der Hinweis sagt auch, was NICHT ankam (§11)');
{
  console.log('     Hinweis: ' + erg.hinweis);
  p('Er nennt die Folien', /3 Folien übernommen/.test(erg.hinweis), erg.hinweis);
  p('Er nennt die zugedeckten Antworten', /Antwort/.test(erg.hinweis), erg.hinweis);
  p('Er sagt, dass etwas NICHT übernommen wurde',
    /NICHT übernommen/.test(erg.hinweis), erg.hinweis);
  p('… und nennt die Tabelle', /Tabelle/.test(erg.hinweis), erg.hinweis);
  /* „Formen" UND NICHT MEHR „gefüllte Formen" (E566). Bis dahin fiel jede
     gefüllte Form ohne Text durch und wurde so gezählt. Seit E566 kommen
     die fünf Umrisse an, die Redion kennt — gezählt wird nur noch, was
     Redion NICHT kennt, und das ist nicht mehr nur „gefüllt". Der Lauf hat
     die Umbenennung gemeldet, statt sie durchrutschen zu lassen. */
  p('… und die Form, deren Umriss Redion nicht kennt',
    /NICHT übernommen:[^·]*Formen/.test(erg.hinweis), erg.hinweis);
  gleich('Folie 3 bringt folgerichtig nichts mit', erg.f3, 0);
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 511: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
