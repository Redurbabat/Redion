/* Suite 528 — Folienübergänge: was in der .pptx steht, läuft im Vortrag (E600)
 * ============================================================================
 * Redur: „bei der powerpoint daten will ich es 1:1 wie powerpoint haben."
 * E594 hat daraus eine Reihenfolge gemacht; „Folienmaster und Übergänge" ist
 * Punkt 2 darin. Dieser Lauf hält die Übergänge.
 *
 * GEMESSEN VOR DEM BAU: eine `.pptx` mit drei Folien — `p:fade spd="slow"`,
 * `p:push dir="l" spd="fast"` und einem `mc:AlternateContent` mit
 * `p14:prism` und einem `p:fade` als Rückfall — eingelesen:
 *
 *     uebergang: [null, null, null]
 *
 * Nichts davon kam an. Gegen diesen Stand sind §1 und §2 rot.
 *
 * §1 GELESEN WIRD, WAS DASTEHT — Art, Dauer, Richtung, und bei einem Effekt,
 *    den Redion nicht kann, der ECHTE Name daneben (`statt`).
 * §2 IM VORTRAG LÄUFT ER: die Folie trägt beim Blättern ihre Marke und ihre
 *    Dauer.
 * §3 EIN SCHRITT INNERHALB DER FOLIE LÖST KEINEN ÜBERGANG AUS — eine
 *    Abdeckung aufzudecken ist kein Blättern (dieselbe Trennung wie in
 *    PowerPoint).
 * §4 DIE ORIGINALDATEI BEHÄLT IHRE ÜBERGÄNGE. Redion bildet sie nur ab; was
 *    wieder herausgeht, ist das Original (E592).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `uebergangLesen` nicht aufrufen: `uebergang` ist wieder `null`.
 *   §2 → die vier Zeilen in `zeichne()` weglassen: die Folie trägt nichts.
 *   §3 → den Übergang an `weiter()` hängen statt an `zeichne()`: dann trägt
 *        die Folie ihn auch nach einem blossen Schritt.
 *   Alle drei wurden gefahren.
 * ==========================================================================*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
declare const Store: any;
declare const App: any;
declare const Einlesen: any;
declare const Austausch: any;
declare const Werkzeuge: any;
const WURZEL = resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((q, a) => {
  const f = resolve(WURZEL, '.' + (q.url?.split('?')[0] || '/index.html'));
  if (!f.startsWith(WURZEL) || !existsSync(f) || statSync(f).isDirectory()) { a.writeHead(404).end(); return; }
  a.setHeader('Content-Type', (TYP[extname(f)] || 'application/octet-stream') + '; charset=utf-8');
  a.end(readFileSync(f));
});
await new Promise<void>(d => server.listen(0, '127.0.0.1', d));
const port = (server.address() as { port: number }).port;
let ok = 0, weg = 0;
const pr = (n: string, b: unknown, zusatz = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (zusatz ? ' — ' + zusatz : '')); }
};
const fehler: string[] = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction('typeof Store !== "undefined" && typeof Einlesen !== "undefined"'
    + ' && typeof Austausch !== "undefined" && typeof Werkzeuge !== "undefined"');
  await page.waitForTimeout(600);

  console.log('\n1 · Gelesen wird, was in der Datei steht');
  const rein = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,#rg-willkommen,#rg-einladung').forEach(n => n.remove());
    const enc = new TextEncoder();
    /* Eine fremde `.pptx` aus eigenem XML, mit dem Browser gepackt — nicht
       mit Redions Schreiber gebaut (derselbe Weg wie test525). */
    const packe = async (text: string) => {
      const roh = enc.encode(text);
      const strom = new Blob([roh as any]).stream()
        .pipeThrough(new (window as any).CompressionStream('deflate-raw'));
      const gepackt = new Uint8Array(await new Response(strom).arrayBuffer());
      return { roh: gepackt, methode: 8, crc: Austausch.crc32(roh), groesse: roh.length };
    };
    const folie = (titel: string, uebergang: string) =>
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
      + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
      + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
      + '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>'
      + '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Titel"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
      + '<p:spPr><a:xfrm><a:off x="838200" y="500000"/><a:ext cx="10515600" cy="1200000"/></a:xfrm>'
      + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'
      + '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="de-DE" sz="4000"/>'
      + '<a:t>' + titel + '</a:t></a:r></a:p></p:txBody></p:sp>'
      + '</p:spTree></p:cSld>' + uebergang
      + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
    const rels = (inhalt: string) =>
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + inhalt + '</Relationships>';
    const rel = (id: string, typ: string, ziel: string) =>
      `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
    const teile: Record<string, string> = {
      '[Content_Types].xml':
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
        + '<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        + '<Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        + '<Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        + '</Types>',
      '_rels/.rels': rels(rel('rId1', 'officeDocument', 'ppt/presentation.xml')),
      'ppt/presentation.xml':
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        + '<p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId3"/>'
        + '<p:sldId id="258" r:id="rId4"/></p:sldIdLst>'
        + '<p:sldSz cx="12192000" cy="6858000"/></p:presentation>',
      'ppt/_rels/presentation.xml.rels': rels(
        rel('rId2', 'slide', 'slides/slide1.xml') + rel('rId3', 'slide', 'slides/slide2.xml')
        + rel('rId4', 'slide', 'slides/slide3.xml')),
      'ppt/slides/slide1.xml': folie('Eins', '<p:transition spd="slow"><p:fade/></p:transition>'),
      'ppt/slides/slide2.xml': folie('Zwei', '<p:transition spd="fast"><p:push dir="l"/></p:transition>'),
      'ppt/slides/slide3.xml': folie('Drei',
        '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">'
        + '<mc:Choice xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" Requires="p14">'
        + '<p:transition spd="slow" p14:dur="1600"><p14:prism isInverted="1"/></p:transition></mc:Choice>'
        + '<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback>'
        + '</mc:AlternateContent>'),
      'ppt/slides/_rels/slide1.xml.rels': rels(''),
      'ppt/slides/_rels/slide2.xml.rels': rels(''),
      'ppt/slides/_rels/slide3.xml.rels': rels(''),
    };
    const liste: any[] = [];
    for (const [name, text] of Object.entries(teile)) liste.push({ name, ...(await packe(text)) });
    const blob = await Austausch.zipSchreiben(liste);
    const datei = new File([blob], 'uebergaenge.pptx',
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const ergebnis = await Einlesen.datei(datei);
    await Store.flush();
    const kinder = Store.childrenOf(ergebnis.seite.id).filter((k: any) => k.type === 'blatt');
    return JSON.stringify({ seite: ergebnis.seite.id, blaetter: kinder.map((k: any) => k.id),
      uebergang: kinder.map((k: any) => k.uebergang ?? null) });
  });
  const d = JSON.parse(rein as string);
  const u = d.uebergang;
  pr('Alle drei Folien bringen einen Übergang mit', u.length === 3 && u.every(Boolean),
    JSON.stringify(u));
  pr('`fade spd="slow"` wird „blenden" mit 1000 ms',
    u[0]?.art === 'blenden' && u[0]?.dauer === 1000, JSON.stringify(u[0]));
  pr('`push dir="l" spd="fast"` wird „schieben" nach links mit 400 ms',
    u[1]?.art === 'schieben' && u[1]?.dauer === 400 && u[1]?.richtung === 'l', JSON.stringify(u[1]));
  /* Der dritte ist der lehrreiche: der ECHTE Effekt ist `p14:prism`, den
     Redion nicht kann. Genommen wird der Rückfall, den die Datei selbst
     anbietet — und der echte Name steht daneben, statt dass „fade" so täte,
     als sei das gemeint gewesen. */
  pr('Ein Effekt, den Redion nicht kann, nimmt den Rückfall der Datei',
    u[2]?.art === 'blenden' && u[2]?.original === 'fade', JSON.stringify(u[2]));
  pr('… und nennt den echten Namen daneben', u[2]?.statt === 'prism', JSON.stringify(u[2]));

  console.log('\n2 · Im Vortrag läuft er');
  await page.evaluate(id => App.oeffne(id), d.seite);
  await page.waitForTimeout(500);
  await page.evaluate(async id => {
    const p = Store.getBlock(id);
    await Werkzeuge.praesentation(p);
  }, d.seite);
  await page.waitForTimeout(600);
  /* WIE VIELE FOLIEN HAT DER VORTRAG — und tragen sie, was sie sollen?
     `Folien.teilen` macht aus der SEITE eine erste Folie (ihr Titel) und
     hängt die `blatt`-Blöcke dahinter. Der erste Übergang gehört deshalb
     zur ZWEITEN Folie. Gemessen, nicht angenommen: der erste Entwurf dieses
     Laufs erwartete ihn auf Folie 1 und bekam „null". */
  const stand = await page.evaluate(() =>
    document.querySelector('.praesi-leiste span')?.textContent ?? '');
  pr('Der Vortrag zeigt die Titelfolie und die drei Folien der Datei',
    /1 \/ 4/.test(String(stand)), JSON.stringify(stand));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  const ersteFolie = await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.praesi .folie');
    return f ? { art: f.dataset.uebergang ?? null, richtung: f.dataset.uebergangRichtung ?? null,
      dauer: getComputedStyle(f).getPropertyValue('--ueb-dauer').trim(),
      name: getComputedStyle(f).animationName } : null;
  });
  pr('Die erste Folie der Datei trägt ihren Übergang', ersteFolie?.art === 'blenden',
    JSON.stringify(ersteFolie));
  pr('… mit ihrer Dauer als Stellschraube', ersteFolie?.dauer === '1000ms',
    JSON.stringify(ersteFolie));
  pr('… und das Stilblatt macht daraus wirklich eine Animation',
    !!ersteFolie && ersteFolie.name !== 'none' && ersteFolie.name !== '',
    JSON.stringify(ersteFolie?.name));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  const zweiteFolie = await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.praesi .folie');
    return f ? { art: f.dataset.uebergang ?? null, richtung: f.dataset.uebergangRichtung ?? null,
      dauer: getComputedStyle(f).getPropertyValue('--ueb-dauer').trim() } : null;
  });
  pr('Die zweite Folie der Datei schiebt herein, aus der Richtung der Datei',
    zweiteFolie?.art === 'schieben' && zweiteFolie?.richtung === 'l',
    JSON.stringify(zweiteFolie));
  pr('… und zwar schnell (400 ms), weil `spd="fast"` dasteht',
    zweiteFolie?.dauer === '400ms', JSON.stringify(zweiteFolie));

  console.log('\n3 · Ein Schritt innerhalb der Folie ist kein Blättern');
  /* Eine Abdeckung mit Schrittnummer auf die dritte Folie legen, dorthin
     blättern und EINEN Schritt machen. Die Folie darf sich dabei nicht neu
     aufbauen — und damit auch nicht neu hereinwandern. */
  await page.evaluate(() => { (document.querySelector('.praesi [data-a="zu"]') as HTMLElement)?.click(); });
  await page.waitForTimeout(300);
  await page.evaluate(async ([drittes]) => {
    const b = Store.getBlock(drittes);
    Store.updateBlock(drittes, { marken: [...(b.marken || []),
      { id: 'deck1', art: 'abdeck', pts: [[40, 40], [300, 200]], schritt: 1 }] });
    await Store.flush();
  }, [d.blaetter[2]]);
  await page.evaluate(async id => { await Werkzeuge.praesentation(Store.getBlock(id)); }, d.seite);
  await page.waitForTimeout(500);
  await page.keyboard.press('End');
  await page.waitForTimeout(500);
  const vorSchritt = await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.praesi .folie');
    return { marke: f?.dataset.uebergang ?? null,
      knoten: (f as any)?.__nr ?? null,
      zaehler: document.querySelector('.praesi-leiste span')?.textContent ?? '' };
  });
  await page.evaluate(() => { const f = document.querySelector<HTMLElement>('.praesi .folie');
    if (f) f.dataset.probe = 'derselbe'; });
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(400);
  const nachSchritt = await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.praesi .folie');
    return { probe: f?.dataset.probe ?? null,
      zaehler: document.querySelector('.praesi-leiste span')?.textContent ?? '' };
  });
  pr('Die letzte Folie hat einen Schritt (End springt auf „alles aufgedeckt")',
    /Schritt/.test(vorSchritt.zaehler), JSON.stringify(vorSchritt));
  pr('Ein Schritt zurück baut die Folie NICHT neu auf — kein zweiter Übergang',
    nachSchritt.probe === 'derselbe' && /Schritt 0/.test(nachSchritt.zaehler),
    JSON.stringify(nachSchritt));
  await page.evaluate(() => { (document.querySelector('.praesi [data-a="zu"]') as HTMLElement)?.click(); });
  await page.waitForTimeout(250);

  console.log('\n4 · Die Originaldatei behält ihre Übergänge');
  const raus = await page.evaluate(async id => {
    const blob = await Austausch.alsPowerPoint(Store.getBlock(id));
    const puffer = await (blob.blob ?? blob).arrayBuffer();
    const leser = await Einlesen.zipLesen(puffer);
    const t1 = await leser.text('ppt/slides/slide1.xml');
    const t2 = await leser.text('ppt/slides/slide2.xml');
    const t3 = await leser.text('ppt/slides/slide3.xml');
    return JSON.stringify({ eins: /<p:fade\/>/.test(t1 || ''),
      zwei: /<p:push dir="l"\/>/.test(t2 || ''),
      drei: /p14:prism/.test(t3 || '') });
  }, d.seite);
  const r = JSON.parse(raus as string);
  pr('Das Blenden steht unverändert in der ausgegebenen Datei', r.eins);
  pr('Das Schieben samt Richtung auch', r.zwei);
  pr('Und der Effekt, den Redion nur nähert, steht im Original weiter da', r.drei);

  console.log('\n5 · Keine Seitenfehler');
  pr('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' · '));
} catch (e) {
  weg++;
  console.log('  ✗ Der Lauf ist abgebrochen — ' + String((e as Error)?.message || e));
} finally {
  await browser.close();
  server.close();
}
console.log('\n' + (ok + weg) + ' Zusicherungen · ' + ok + ' grün · ✗=' + weg);
process.exit(weg ? 1 : 0);
