/* Suite 501 — Der Deckel bekommt seinen Verlauf, und ein neues Markenfeld
 *               übersteht eine Sicherung
 * ============================================================================
 * Der Rest von L153. Redur: „das es die orginale 1:1 öfnnet."
 *
 *   §1 DER VERLAUF WURDE GELESEN UND WEGGEWORFEN. `formFarbe` liest seit
 *      E542 `a:gradFill`, gibt davon aber EINE Farbe zurück — den
 *      kräftigsten Stopp. In Redurs Datei ist der Deckel weiss → `#FFCC00`
 *      in der Mitte → weiss, senkrecht (`a:lin ang="5400000"`); Redion malte
 *      eine gelbe Fläche mit harten Kanten. `formVerlauf` liest ihn jetzt
 *      ganz — und NUR aus `p:spPr`, weil im selben Teilbaum `a:ln` mit
 *      eigener Füllung liegt (der Kommentar an `formFarbe` sagt das selbst).
 *
 *   §2 EIN `<defs>` FÜR DAS BLATT, KEINE GRUPPE UM DIE MARKE. Der nahe
 *      liegende Bau — `<g><defs/><rect/></g>` — hätte vier Stellen gebrochen,
 *      drei davon still: `redraw` schiebt `[data-sid]` mit `insertBefore`
 *      heraus, `updateNode` verschachtelt bei jedem Ziehschritt, der
 *      Radierer liesse die Gruppe stehen, und `test266` prüft ausdrücklich
 *      `tagName === 'rect'`. Nachgelesen, nicht ausprobiert.
 *
 *   §3 UND DER DECKEL DARF NIE UNSICHTBAR WERDEN. Gemessen an einem echten
 *      Browser (`bilder/paint-rueckfall.png`): ein `fill="url(#fehlt)"` malt
 *      GAR NICHTS — ein unsichtbarer Deckel ist eine offene Antwort, also
 *      genau der Schaden, den das Abdeckband verhindern soll. Deshalb immer
 *      `fill="url(#…) #farbe"`, SVGs eigener Rückfall.
 *
 *   §4 EIN NEUES MARKENFELD MUSS EINE SICHERUNG ÜBERSTEHEN. Nachgelesen:
 *      der ganze Weg (Marke → Block → IndexedDB → `.json` → zurück) schreibt
 *      Marken nie feldweise ab, und `Formen.heile` fasst `marken` nicht an.
 *      Einen WÄCHTER dafür gab es aber nicht: `test145` hält ein unbekanntes
 *      BLOCKfeld, `test100` hält die Bytes der Anhänge — keiner hält ein
 *      unbekanntes Feld INNERHALB einer Marke über `exportAll`/`importAll`.
 *      Bis hierher war die Eigenschaft wahr und unbewacht (§35).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle FÜNF am 12./13. September wirklich gefahren, die Zahlen sind GEMESSEN
 * am jetzigen Stand von 29 grün:
 *   §1 → `formVerlauf` immer `null` zurückgeben lassen:  14 grün, 15 rot.
 *   §2 → `verlaufDefs` immer `null` zurückgeben lassen:  24 grün,  5 rot.
 *   §3 → im `abdeck`-Zweig ` ${color}` aus dem `fill` streichen:
 *        28 grün,  1 rot. Nur EINE Zusage — und das ist richtig so: dass ein
 *        `url()` ins Leere gar nichts malt, misst §3 am Browser selbst,
 *        unabhängig davon, was der Zeichner gerade tut.
 *   §4 → in `exportAll` die Marken durch eine Feldliste schicken
 *        (`{id, art, pts, farbe}`):                      24 grün,  5 rot.
 *   §5 → in `verlaufId` das Säubern weglassen:           27 grün,  2 rot.
 *
 *   node pruefungen/lauf/test501.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const Marken: any;
declare const Einlesen: any;
declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9611;
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
const kontext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  'typeof Store !== "undefined" && typeof Marken !== "undefined" && typeof Einlesen !== "undefined"');
await seite.evaluate(() => {
  document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
});
await seite.waitForTimeout(400);

/* ══ §1 DER VERLAUF WIRD GELESEN ═════════════════════════════════════════ */
console.log('\n§1 Der Verlauf einer echten PowerPoint-Abdeckung kommt an');
{
  const erg = await seite.evaluate(async () => {
    /* Eine ECHTE .pptx, mit Redions eigenem ZIP-Schreiber gebaut. Die Folie
       trägt zwei Formen mit `a:gradFill`:
         · der DECKEL — Verlauf in `p:spPr`, drei Stopps, senkrecht
         · die FALLE  — ein anderer Verlauf unter `a:ln`, also die
           Umrisslinie. Wer über den ganzen Teilbaum sucht, nimmt den. */
    const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
               'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" ' +
               'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const kasten = (id: number, x: number, y: number, breite: number, hoehe: number, inneres: string) =>
      `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="F${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
      `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${breite}" cy="${hoehe}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${inneres}</p:spPr>` +
      `<p:txBody><a:bodyPr/><a:lstStyle/><a:p></a:p></p:txBody></p:sp>`;

    const deckelFuellung =
      '<a:gradFill flip="none" rotWithShape="1"><a:gsLst>' +
        '<a:gs pos="0"><a:srgbClr val="FFFFFF"/></a:gs>' +
        '<a:gs pos="50000"><a:srgbClr val="FFCC00"/></a:gs>' +
        '<a:gs pos="100000"><a:srgbClr val="FFFFFF"/></a:gs>' +
      '</a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>' +
      /* DIE FALLE: die Linie hat ihren eigenen Verlauf, in ganz anderen
         Farben. Wer nicht auf `p:spPr` eingrenzt, liest diesen. */
      '<a:ln w="12700"><a:gradFill><a:gsLst>' +
        '<a:gs pos="0"><a:srgbClr val="112233"/></a:gs>' +
        '<a:gs pos="100000"><a:srgbClr val="445566"/></a:gs>' +
      '</a:gsLst><a:lin ang="0"/></a:gradFill></a:ln>';

    const textKasten = (id: number, y: number, text: string) =>
      `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
      `<p:spPr><a:xfrm><a:off x="457200" y="${y}"/><a:ext cx="5486400" cy="457200"/></a:xfrm></p:spPr>` +
      `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/>` +
      `<a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;

    const folie =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
      textKasten(9, 1828800, 'Die Antwort lautet 42') +
      kasten(7, 457200, 1828800, 5486400, 457200, deckelFuellung) +
      /* Eine ZWEITE Abdeckung, einfarbig — sie darf keinen Verlauf bekommen. */
      kasten(8, 457200, 2743200, 5486400, 457200,
        '<a:solidFill><a:srgbClr val="88CCFF"/></a:solidFill>') +
      '</p:spTree></p:cSld>' +
      /* Beide Deckel mit einem Klickschritt, sonst sind es keine Deckel.
         DIE FORM STEHT IM EINLESER: gezählt wird jedes `p:cTn` mit
         `nodeType="clickEffect"` (einlesen.ts, `klickschritte`) — nicht die
         Verschachtelung. Der erste Entwurf baute die volle PowerPoint-
         Verschachtelung OHNE dieses Attribut nach, und es kam keine
         einzige Abdeckung an (§45: nachsehen, nicht nachbauen). */
      '<p:timing><p:tnLst>' +
      '<p:par><p:cTn nodeType="clickEffect"><p:childTnLst>' +
        '<p:animEffect filter="dissolve" transition="out"><p:cBhvr>' +
        '<p:tgtEl><p:spTgt spid="7"/></p:tgtEl></p:cBhvr></p:animEffect>' +
      '</p:childTnLst></p:cTn></p:par>' +
      '<p:par><p:cTn nodeType="clickEffect"><p:childTnLst>' +
        '<p:animEffect filter="dissolve" transition="out"><p:cBhvr>' +
        '<p:tgtEl><p:spTgt spid="8"/></p:tgtEl></p:cBhvr></p:animEffect>' +
      '</p:childTnLst></p:cTn></p:par>' +
      '</p:tnLst></p:timing>' +
      '</p:sld>';

    const praes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
      '<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>' +
      '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>';
    const praesRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>';
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
      { name: 'ppt/slides/slide1.xml', inhalt: folie },
    ]);
    const r = await Einlesen.datei(new File([blob], 'Verlauf.pptx',
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
    const marken = (blatt?.marken || []).filter((m: any) => m.art === 'abdeck');
    const mitVerlauf = marken.find((m: any) => m.verlauf);
    const ohneVerlauf = marken.find((m: any) => !m.verlauf);
    return {
      seiteId: r.seite.id, blattId: blatt?.id, deckel: marken.length,
      verlaufDa: !!mitVerlauf,
      stopps: mitVerlauf?.verlauf?.stopps || [],
      winkel: mitVerlauf?.verlauf?.winkel,
      farbe: mitVerlauf?.farbe,
      einfarbig: ohneVerlauf ? ohneVerlauf.farbe : '',
      einfarbigOhneVerlauf: !!ohneVerlauf && ohneVerlauf.verlauf === undefined,
    };
  });

  gleich('Zwei Abdeckungen kommen an', erg.deckel, 2);
  p('Die verlaufende trägt ihren Verlauf', erg.verlaufDa);
  gleich('… mit drei Stopps', erg.stopps.length, 3);
  p('… in der Reihenfolge 0 / 0,5 / 1',
    JSON.stringify(erg.stopps.map((s: any) => s.pos)) === '[0,0.5,1]',
    JSON.stringify(erg.stopps.map((s: any) => s.pos)));
  p('… in den Farben der Datei, weiss–gelb–weiss',
    JSON.stringify(erg.stopps.map((s: any) => s.farbe)) === '["#FFFFFF","#FFCC00","#FFFFFF"]',
    JSON.stringify(erg.stopps.map((s: any) => s.farbe)));
  gleich('… senkrecht, wie im Original', erg.winkel, 5400000);
  /* DIE FALLE: die Umrisslinie hat einen eigenen Verlauf in #112233/#445566.
     Käme der an, stünde er hier — und der Deckel wäre dunkelblau. */
  p('Der Verlauf der UMRISSLINIE bleibt draussen',
    !JSON.stringify(erg.stopps).includes('112233') &&
    !JSON.stringify(erg.stopps).includes('445566'),
    JSON.stringify(erg.stopps));
  gleich('Die feste Farbe bleibt als Rückfall daneben stehen', erg.farbe, '#FFCC00');
  gleich('Die einfarbige Abdeckung behält ihre Farbe', erg.einfarbig, '#88CCFF');
  p('… und bekommt KEIN leeres Verlauf-Feld angehängt', erg.einfarbigOhneVerlauf);

  /* ══ §2 GEZEICHNET WIRD EIN <rect> MIT VORLAGE AM BLATT ═══════════════ */
  console.log('\n§2 Ein <defs> für das Blatt — und der Knoten bleibt ein <rect>');
  const gemalt = await seite.evaluate((ids: any) => {
    const blatt = Store.getBlock(ids.blattId);
    const marken = blatt.marken || [];
    const mitVerlauf = marken.find((m: any) => m.art === 'abdeck' && m.verlauf);
    const knoten = Marken.zeichneMarke(mitVerlauf);
    const defs = Marken.verlaufDefs(marken);
    const einfarbig = marken.find((m: any) => m.art === 'abdeck' && !m.verlauf);
    return {
      tag: knoten?.tagName?.toLowerCase(),
      istDirekt: !!knoten && knoten.getAttribute('data-sid') === mitVerlauf.id,
      fuellung: knoten?.getAttribute('fill') || '',
      defsDa: !!defs,
      verlaufZahl: defs ? defs.querySelectorAll('linearGradient').length : 0,
      stoppZahl: defs ? defs.querySelectorAll('stop').length : 0,
      /* 5400000 = 90° = senkrecht: die Achse läuft von oben nach unten. */
      achse: defs ? (() => {
        const g = defs.querySelector('linearGradient')!;
        return ['x1', 'y1', 'x2', 'y2'].map(a => Number(g.getAttribute(a))).join(',');
      })() : '',
      einfarbigFuellung: Marken.zeichneMarke(einfarbig)?.getAttribute('fill') || '',
    };
  }, { blattId: erg.blattId });

  gleich('Der Knoten ist und bleibt ein <rect> (test266)', gemalt.tag, 'rect');
  p('… und trägt seine Kennung selbst, nicht eine Gruppe darum', gemalt.istDirekt);
  p('Die Füllung ruft die Vorlage UND nennt die feste Farbe',
    /^url\(#rv-.+\) #FFCC00$/i.test(gemalt.fuellung), gemalt.fuellung);
  p('Es gibt ein <defs> für das Blatt', gemalt.defsDa);
  gleich('… mit genau einem Verlauf — die einfarbige bekommt keinen',
    gemalt.verlaufZahl, 1);
  gleich('… und drei Stopps darin', gemalt.stoppZahl, 3);
  gleich('Die Achse läuft senkrecht (0,5/0 nach 0,5/1)', gemalt.achse, '0.5,0,0.5,1');
  gleich('Die einfarbige Abdeckung bleibt eine einfache Farbe',
    gemalt.einfarbigFuellung, '#88CCFF');

  /* ---- DIE KENNUNG MUSS EINE KENNUNG SEIN --------------------------------
     GEFUNDEN AUF DEM BILD, NICHT IM CODE (§55.1). Im ersten Durchgang waren
     die Deckel SCHWARZ — nicht gelb, nicht durchsichtig. Der Grund: die
     Marke hiess „d1Aufgabe 1 — Übersetzungsverhältnis", und mit einem
     Leerzeichen darin ist `url(#…)` kein gültiger Verweis mehr. Dann greift
     nicht der Rückfall daneben, sondern der ANFANGSWERT von `fill`.
     Eine Markenkennung ist Text aus den Daten; sie darf so heissen. */
  const roh = await seite.evaluate(() => {
    const marke = {
      id: 'x1 Aufgabe — mit Leerzeichen & Ümläut', art: 'abdeck', farbe: '#FFCC00',
      verlauf: { stopps: [{ pos: 0, farbe: '#FFFFFF' }, { pos: 1, farbe: '#FFCC00' }],
                 winkel: 5400000 },
      pts: [[10, 10], [200, 60]] };
    const knoten = Marken.zeichneMarke(marke);
    const defs = Marken.verlaufDefs([marke]);
    const verweis = (knoten?.getAttribute('fill') || '').match(/url\(#([^)]*)\)/)?.[1] || '';
    /* Wirklich malen lassen und nachsehen, was herauskommt. */
    const raum = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    raum.setAttribute('width', '220'); raum.setAttribute('height', '80');
    if (defs) raum.appendChild(defs);
    if (knoten) raum.appendChild(knoten);
    document.body.appendChild(raum);
    const gemalt = knoten ? getComputedStyle(knoten).fill : '';
    raum.remove();
    return { verweis, defsId: defs?.querySelector('linearGradient')?.id || '', gemalt };
  });
  p('Die Kennung der Vorlage ist frei von Leerzeichen und Umlauten',
    /^[A-Za-z0-9_-]+$/.test(roh.verweis), roh.verweis);
  gleich('… und Zeichner und Vorlage nennen dieselbe', roh.verweis, roh.defsId);
  p('Gemalt wird der Verlauf, nicht Schwarz',
    /url\(/.test(roh.gemalt) && !/rgb\(0,\s*0,\s*0\)/.test(roh.gemalt), roh.gemalt);
}

/* ══ §3 OHNE VORLAGE DECKT SIE TROTZDEM ══════════════════════════════════ */
console.log('\n§3 Fehlt die Vorlage, deckt die feste Farbe — nie ein Loch');
{
  const gemessen = await seite.evaluate(() => {
    /* Gemessen am ECHTEN Browser, nicht behauptet: ein `url()` ins Leere
       malt gar nichts. Deshalb steht die Farbe immer daneben. */
    const raum = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    raum.setAttribute('width', '200'); raum.setAttribute('height', '120');
    const mach = (fuellung: string, y: number) => {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', '0'); r.setAttribute('y', String(y));
      r.setAttribute('width', '100'); r.setAttribute('height', '40');
      r.setAttribute('fill', fuellung); raum.appendChild(r); return r;
    };
    const mitRueckfall = mach('url(#gibtEsNicht) #ffcc00', 0);
    const ohneRueckfall = mach('url(#gibtEsNicht)', 60);
    document.body.appendChild(raum);
    const a = getComputedStyle(mitRueckfall).fill;
    const b = getComputedStyle(ohneRueckfall).fill;
    raum.remove();
    return { mitRueckfall: a, ohneRueckfall: b };
  });
  p('Mit Rückfall nennt der Browser die feste Farbe',
    /rgb\(255,\s*204,\s*0\)/.test(gemessen.mitRueckfall), gemessen.mitRueckfall);
  p('Ohne Rückfall steht da nur das leere url() — nichts wird gemalt',
    !/rgb/.test(gemessen.ohneRueckfall), gemessen.ohneRueckfall);
}

/* ══ §4 EIN NEUES MARKENFELD ÜBERSTEHT EINE SICHERUNG ════════════════════ */
console.log('\n§4 Was an einer Marke steht, steht nach der Sicherung noch da');
{
  const rund = await seite.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Rundlauf' });
    const blatt = Store.addBlock(s.id, 'blatt', {
      text: 'Blatt', blattBreite: 960, blattHoehe: 540 });
    const marke = {
      id: 'rund1', art: 'abdeck', farbe: '#FFCC00', schritt: 3,
      verlauf: { stopps: [{ pos: 0, farbe: '#FFFFFF' }, { pos: 0.5, farbe: '#FFCC00' },
                          { pos: 1, farbe: '#FFFFFF' }], winkel: 5400000 },
      /* Und ein Feld, das die App GAR NICHT kennt. Genau darum geht es:
         nicht um `verlauf`, sondern um die Regel dahinter (E72, §18). */
      erfundenesFeld: { tief: ['a', 1, true] },
      pts: [[40, 200], [400, 250]],
    };
    Store.updateBlock(blatt.id, { marken: [marke] });
    await Store.flush?.();

    const text = await Store.exportAll();
    const vorher = JSON.stringify(Store.getBlock(blatt.id).marken);
    /* Alles weg, dann zurück — der Weg aus §13, nur für ein Markenfeld. */
    await Store.importAll(text, 'ersetzen');
    const zurueck = (Store.getBlock(blatt.id)?.marken || [])[0];
    return {
      vorher, zurueck: JSON.stringify(zurueck ? [zurueck] : []),
      schritt: zurueck?.schritt,
      verlaufStopps: zurueck?.verlauf?.stopps?.length,
      verlaufWinkel: zurueck?.verlauf?.winkel,
      erfunden: JSON.stringify(zurueck?.erfundenesFeld),
    };
  });

  p('Die Marke kommt Byte für Byte zurück', rund.vorher === rund.zurueck,
    (rund.vorher || '').slice(0, 90) + '  ≠  ' + (rund.zurueck || '').slice(0, 90));
  gleich('`schritt` ist noch da', rund.schritt, 3);
  gleich('`verlauf` hat noch seine drei Stopps', rund.verlaufStopps, 3);
  gleich('… und seinen Winkel', rund.verlaufWinkel, 5400000);
  gleich('Und ein Feld, das niemand kennt, steht unverändert da (§18)',
    rund.erfunden, '{"tief":["a",1,true]}');
}

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await kontext.close();
await browser.close();
server.close();
console.log(`\nSuite 501: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
