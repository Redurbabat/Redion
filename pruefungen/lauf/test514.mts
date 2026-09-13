/* Suite 514 — Das Farbthema: woher eine `schemeClr` ihren Wert hat
 * ============================================================================
 * Redur: „ich will das die orginale pptx so wie es sich öfnnen".
 *
 * E558 hat Lage, Grad und Hintergrund geerbt — und dabei EINE Quelle
 * ausdrücklich liegen lassen: `theme1.xml`. Der Grund war richtig (eine
 * geratene Farbe ist schlimmer als keine), die Folge aber teuer: PowerPoint
 * schreibt Farben fast nie als `srgbClr`, sondern als `schemeClr`. Jede
 * Vorlage von der Stange tut es. Bis hierher kamen sie alle als „keine
 * Farbe" an — der Hintergrund weiss, der Text schwarz, ein Verlauf gar nicht.
 *
 * ─── DIE ERSTE STUFE IST DIE, DIE MAN VERGISST ──────────────────────────────
 * `<a:schemeClr val="bg1"/>` steht NICHT im Thema. `bg1` gehört der
 * Folienwelt und wird erst über `p:clrMap` im Master zu einem Themennamen:
 *
 *     bg1  →  clrMap.bg1 = "lt1"  →  clrScheme.lt1  →  #FFFFFF
 *
 * §2 baut deshalb eine Zuordnung, die ABSICHTLICH vertauscht ist
 * (bg1="dk1", tx1="lt1"). Wer die Stufe auslässt, bekommt genau die
 * verkehrte Farbe — und nicht etwa gar keine, was auffiele.
 *
 * ─── DIE ZAHLEN IN §3 SIND NICHT MEINE ──────────────────────────────────────
 * `lumMod`/`lumOff` prüft die Suite gegen die veröffentlichten Felder aus
 * PowerPoints eigener Farbauswahl zum Office-Thema:
 *
 *     accent1 #4472C4  „Dunkler 25 %"  (lumMod 75000)             #2F5597
 *     accent1 #4472C4  „Heller 40 %"   (lumMod 60000 lumOff 40000) #8FAADC
 *     accent1 #4472C4  „Dunkler 50 %"  (lumMod 50000)             #203864
 *
 * Das ist der Punkt: die Zusage kommt von Microsoft, nicht aus meiner
 * eigenen Rechnung. Eine Prüfung, die den Code gegen sich selbst hält,
 * hält nichts (§55.2).
 *
 * ─── WAS BEWUSST NICHT GERECHNET WIRD ───────────────────────────────────────
 * `alpha` (Durchsichtigkeit — die Markenschicht hat kein Gegenstück),
 * `satMod`, `hueMod` und `phClr` (die Farbe des Platzhalters, der eine
 * Vorlage benutzt — sie steht nirgends). §4 misst, dass `phClr` leer bleibt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → `schemeClr` gar nicht auflösen:                 8 rot (jede Farbe leer)
 *   G2 → `p:clrMap` überspringen:                        2 rot (der Grund fehlt in beiden Richtungen)
 *   G3 → `lumMod`/`lumOff` nicht rechnen:                4 rot (dreimal dieselbe Grundfarbe)
 *   G4 → `phClr` auch auflösen (auf irgendwas):          1 rot
 *
 *   node pruefungen/lauf/test514.mts
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
const PORT = 9624;
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

  /* Ein Textkasten, dessen Farbe eine THEMENFARBE ist. */
  const textFarbig = (id: number, text: string, inneres: string, y: number) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="457200" y="${y}"/><a:ext cx="7772400" cy="457200"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="2000"><a:solidFill>` +
    inneres + '</a:solidFill></a:rPr>' + `<a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;

  const huelle = (inhalt: string, bg = '', wurzel = 'p:sld', clrMap = '') =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><${wurzel} ${ns}><p:cSld>` +
    bg + '<p:spTree>' +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + `</p:spTree></p:cSld>${clrMap}</${wurzel}>`;

  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    i + '</Relationships>';

  /* DAS THEMA. `lt1`/`dk1` stehen als `sysClr` da — genau wie in jeder
     echten Datei; der Wert steckt in `lastClr`, nicht in `val`. */
  const thema = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<a:theme ${ns} name="Pruef"><a:themeElements><a:clrScheme name="Pruef">` +
    '<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>' +
    '<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' +
    '<a:dk2><a:srgbClr val="44546A"/></a:dk2>' +
    '<a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>' +
    '<a:accent1><a:srgbClr val="4472C4"/></a:accent1>' +
    '<a:accent2><a:srgbClr val="ED7D31"/></a:accent2>' +
    '<a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>' +
    '<a:accent4><a:srgbClr val="FFC000"/></a:accent4>' +
    '<a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>' +
    '<a:accent6><a:srgbClr val="70AD47"/></a:accent6>' +
    '<a:hlink><a:srgbClr val="0563C1"/></a:hlink>' +
    '<a:folHlink><a:srgbClr val="954F72"/></a:folHlink>' +
    '</a:clrScheme></a:themeElements></a:theme>';

  /* DIE ZUORDNUNG IST ABSICHTLICH VERTAUSCHT: bg1 zeigt auf dk1 (schwarz),
     tx1 auf lt1 (weiss). Wer `p:clrMap` überspringt und `bg1` unmittelbar
     im Thema sucht, findet dort gar nichts — und wer „bg1 heisst hell"
     annimmt, bekommt Weiss statt Schwarz. */
  const clrMap = '<p:clrMap bg1="dk1" tx1="lt1" bg2="lt2" tx2="dk2" accent1="accent1" ' +
    'accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" ' +
    'accent6="accent6" hlink="hlink" folHlink="folHlink"/>';

  const bauen = async (folieInhalt: string, bg: string, name: string) => {
    const dateien = [
      { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>' },
      { name: '_rels/.rels', inhalt: relsDatei(rel('rId1', 'officeDocument', 'ppt/presentation.xml')) },
      { name: 'ppt/presentation.xml', inhalt:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
        '<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>' +
        '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>' },
      { name: 'ppt/_rels/presentation.xml.rels', inhalt: relsDatei(rel('rId1', 'slide', 'slides/slide1.xml')) },
      { name: 'ppt/slides/slide1.xml', inhalt: huelle(folieInhalt) },
      { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: relsDatei(
        rel('rId1', 'slideLayout', '../slideLayouts/slideLayout4.xml')) },
      { name: 'ppt/slideLayouts/slideLayout4.xml', inhalt: huelle('', '', 'p:sldLayout') },
      { name: 'ppt/slideLayouts/_rels/slideLayout4.xml.rels', inhalt: relsDatei(
        rel('rId1', 'slideMaster', '../slideMasters/slideMaster2.xml')) },
      /* Der Master trägt den Hintergrund UND die Zuordnung; das Thema hängt
         über seine `.rels` daran — und heisst absichtlich `theme7.xml`. */
      { name: 'ppt/slideMasters/slideMaster2.xml', inhalt: huelle('', bg, 'p:sldMaster', clrMap) },
      { name: 'ppt/slideMasters/_rels/slideMaster2.xml.rels', inhalt: relsDatei(
        rel('rId1', 'theme', '../theme/theme7.xml')) },
      { name: 'ppt/theme/theme7.xml', inhalt: thema },
    ];
    const blob = await Austausch.zipSchreiben(dateien);
    const r = await Einlesen.datei(new File([blob], name + '.pptx',
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
    return {
      grund: String((blatt as any)?.grundfarbe || ''),
      texte: ((blatt?.marken || []) as any[]).filter(m => m.art === 'text')
        .map(m => ({ text: String(m.text), farbe: String(m.farbe || '') })),
    };
  };

  const bgThema = (name: string) =>
    `<p:bg><p:bgPr><a:solidFill><a:schemeClr val="${name}"/></a:solidFill>` +
    '<a:effectLst/></p:bgPr></p:bg>';

  /* Eine Folie mit fünf Kästen: pur, drei Abwandlungen und `phClr`. */
  const folie =
    textFarbig(11, 'pur',      '<a:schemeClr val="accent1"/>', 228600) +
    textFarbig(12, 'dunkler25', '<a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr>', 914400) +
    textFarbig(13, 'heller40',  '<a:schemeClr val="accent1"><a:lumMod val="60000"/><a:lumOff val="40000"/></a:schemeClr>', 1600200) +
    textFarbig(14, 'dunkler50', '<a:schemeClr val="accent1"><a:lumMod val="50000"/></a:schemeClr>', 2286000) +
    textFarbig(15, 'platzhalter', '<a:schemeClr val="phClr"/>', 2971800) +
    textFarbig(16, 'verweis',  '<a:schemeClr val="hlink"/>', 3657600) +
    textFarbig(17, 'systemfarbe', '<a:sysClr val="windowText" lastClr="123456"/>', 4343400);

  const a = await bauen(folie, bgThema('bg1'), 'Thema');
  /* Und dieselbe Datei mit `tx1` als Grund — die Zuordnung schickt ihn auf
     `lt1`, also Weiss. Verwechselt jemand die Stufen, kommt Schwarz. */
  /* Derselbe `phClr`-Kasten noch einmal auf HELLEM Grund — siehe §4. */
  const b = await bauen(
    textFarbig(15, 'platzhalter', '<a:schemeClr val="phClr"/>', 2971800),
    bgThema('tx1'), 'Vertauscht');
  return { a, b };
});

const farbeVon = (t: string): string =>
  (erg.a.texte.find((m: any) => m.text === t)?.farbe || '').toLowerCase();

/* ══ §1 EINE THEMENFARBE KOMMT ÜBERHAUPT AN ══════════════════════════════ */
console.log('\n§1 `schemeClr` wird aufgelöst statt liegen gelassen');
{
  gleich('Die pure Akzentfarbe ist da', farbeVon('pur'), '#4472c4');
  gleich('Eine Systemfarbe kommt aus `lastClr`', farbeVon('systemfarbe'), '#123456');
  gleich('Und ein Verweis aus `hlink`', farbeVon('verweis'), '#0563c1');
  p('Alle sieben Kästen sind da', erg.a.texte.length === 7,
    JSON.stringify(erg.a.texte.map((m: any) => m.text)));
}

/* ══ §2 DIE ZUORDNUNG DES MASTERS IST EINE EIGENE STUFE ══════════════════ */
console.log('\n§2 `bg1` ist kein Themenname — er geht über `p:clrMap`');
{
  /* Die Zuordnung sagt bg1="dk1", und dk1 ist Schwarz. */
  gleich('Der Grund folgt der Zuordnung, nicht dem Namen', erg.a.grund.toLowerCase(), '#000000');
  /* Und tx1="lt1", also Weiss — verwechselt jemand die Stufen, käme hier
     Schwarz heraus, und §2 wäre zweimal dieselbe Zusage. */
  gleich('Und in die andere Richtung ebenso', erg.b.grund.toLowerCase(), '#ffffff');
}

/* ══ §3 DIE ABWANDLUNGEN, GEGEN POWERPOINTS EIGENE FELDER ════════════════ */
console.log('\n§3 `lumMod`/`lumOff` — gemessen an PowerPoints Farbauswahl');
{
  gleich('„Dunkler 25 %" (lumMod 75000)', farbeVon('dunkler25'), '#2f5597');
  gleich('„Heller 40 %" (lumMod 60000 + lumOff 40000)', farbeVon('heller40'), '#8faadc');
  gleich('„Dunkler 50 %" (lumMod 50000)', farbeVon('dunkler50'), '#203864');
  /* Die drei sind nicht dieselbe Farbe — sonst würde eine Abwandlung, die
     gar nicht rechnet, hier grün stehen. */
  p('Und die drei sind wirklich verschieden',
    new Set([farbeVon('pur'), farbeVon('dunkler25'), farbeVon('heller40'),
             farbeVon('dunkler50')]).size === 4,
    JSON.stringify([farbeVon('pur'), farbeVon('dunkler25'), farbeVon('heller40'), farbeVon('dunkler50')]));
}

/* ══ §4 `phClr` BLEIBT LEER ══════════════════════════════════════════════ */
console.log('\n§4 Was niemand kennen kann, bleibt leer (§11)');
{
  /* GEMESSEN AUF HELLEM GRUND, UND DAS IST KEIN AUSWEICHEN.
     Auf der ersten Datei (Grund schwarz) kam hier `#ffffff` heraus — nicht
     weil `phClr` geraten worden wäre, sondern weil die Lesbarkeitsregel aus
     E558 danach greift: ein Absatz OHNE Farbe bekommt auf dunklem Grund
     ausdrücklich Weiss. Die erste Fassung dieser Zusage hat die zwei Dinge
     verwechselt und wäre rot gewesen, obwohl der Code recht hatte.
     Auf hellem Grund kippt die Tinte nicht — dort ist „keine Farbe"
     wirklich sichtbar als „keine Farbe". */
  const hell = (erg.b.texte.find((m: any) => m.text === 'platzhalter')?.farbe || '');
  gleich('`phClr` wird NICHT geraten', hell, '');
  p('… und der Kasten ist trotzdem da', erg.b.texte.length === 1,
    JSON.stringify(erg.b.texte));
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();

console.log(`\nSuite 514: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
