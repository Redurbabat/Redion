/* Suite 515 — Ausrichtung: `a:pPr@algn` und der Knopf dafür
 * ============================================================================
 * L151 führte „Ausrichtung" seit E540 als offen, mit dem Satz „die Textmarke
 * hat kein Feld dafür; alles kommt linksbündig an". Das war richtig — und
 * es war zugleich der Grund, warum REDION SELBST keinen zentrierten Text
 * kannte. Eine fehlende Eigenschaft ist nie nur eine Importlücke.
 *
 * ─── DESHALB PRÜFT DIESE SUITE ZWEI WEGE ────────────────────────────────────
 *   §1 · aus der Datei     `<a:pPr algn="ctr"/>`  →  Marke `ausricht: mitte`
 *   §2 · gezeichnet        SVG-Anker und `x` je Zeile
 *   §3 · der Knopf         antippen schaltet weiter, Auswahl folgt
 *   §4 · was NICHT geht    Blocksatz kommt links an, und das ist Absicht
 *   §5 · der Knopf         er steht SICHTBAR in der Leiste und schaltet im Kreis
 *
 * ─── WARUM `just` NICHT `mitte` WIRD ────────────────────────────────────────
 * PowerPoint kennt fünf Werte, Redion drei. `just` (Blocksatz) und `dist`
 * brauchen gestreckte Wortabstände; die hat die Markenschicht nicht. Links
 * ist die Kante, die der Blocksatz mit ihr TEILT — zentriert wäre an jeder
 * einzelnen Zeile falsch. Eine Näherung in die richtige Richtung ist besser
 * als eine in die falsche.
 *
 * ─── UND DIE ZEILEN MÜSSEN ZUSAMMENBLEIBEN ──────────────────────────────────
 * Ein umbrechender Absatz hat mehrere `tspan`. Bekommt nur der erste das
 * neue `x`, laufen die Zeilen auseinander — die zweite stünde wieder links.
 * §2 misst deshalb ALLE `tspan` eines Kastens, nicht den ersten.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → `algn` gar nicht lesen:                        10 rot (§1, §2, §3 fallen zusammen)
 *   G2 → den Anker setzen, aber `x` nicht verschieben:  3 rot (Anker stimmt, die Zeile sitzt links)
 *   G3 → nur der ersten Zeile das neue `x` geben:       1 rot ([216,42] — die zweite Zeile bleibt zurück)
 *   G4 → `just` auf `mitte` abbilden:                   2 rot
 *   G5 → den Knopf weglassen:                          7 rot (§5 vollständig)
 *
 *   node pruefungen/lauf/test515.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const App: any;
declare const Marken: any;
declare const Store: any;
declare const Einlesen: any;
declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9625;
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

  /* Ein Kasten mit einer Ausrichtung. `breit` steuert, ob der Text umbricht. */
  const kasten = (id: number, algn: string, text: string, y: number) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="457200" y="${y}"/><a:ext cx="4572000" cy="457200"/></a:xfrm></p:spPr>` +
    '<p:txBody><a:bodyPr/><a:lstStyle/>' +
    `<a:p>${algn ? `<a:pPr algn="${algn}"/>` : ''}<a:r><a:rPr sz="1600"/><a:t>${text}</a:t></a:r></a:p>` +
    '</p:txBody></p:sp>';

  const huelle = (inhalt: string) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + '</p:spTree></p:cSld></p:sld>';
  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + i + '</Relationships>';

  /* Ein Absatz mit ZWEI Ausrichtungen — der muss aufgeteilt werden. */
  const zweiAbsaetze =
    `<p:sp><p:nvSpPr><p:cNvPr id="40" name="Z"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    '<p:spPr><a:xfrm><a:off x="457200" y="3429000"/><a:ext cx="4572000" cy="914400"/></a:xfrm></p:spPr>' +
    '<p:txBody><a:bodyPr/><a:lstStyle/>' +
    '<a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1600"/><a:t>zentriert</a:t></a:r></a:p>' +
    '<a:p><a:r><a:rPr sz="1600"/><a:t>linksbuendig</a:t></a:r></a:p>' +
    '</p:txBody></p:sp>';

  const folie =
    kasten(11, '',    'ohne Angabe', 228600) +
    kasten(12, 'l',   'links', 685800) +
    kasten(13, 'ctr', 'mitte', 1143000) +
    kasten(14, 'r',   'rechts', 1600200) +
    kasten(15, 'just', 'blocksatz', 2057400) +
    kasten(16, 'dist', 'verteilt', 2514600) +
    /* Ein langer zentrierter Absatz, der UMBRICHT — §2 misst seine Zeilen. */
    kasten(17, 'ctr', 'Dieser zentrierte Absatz ist lang genug, dass er umbricht und mehr als eine Zeile hat.', 2971800) +
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
    { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: relsDatei('') },
  ];
  const blob = await Austausch.zipSchreiben(dateien);
  const r = await Einlesen.datei(new File([blob], 'Ausrichtung.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
  const marken = ((blatt?.marken || []) as any[]).filter(m => m.art === 'text')
    .map(m => ({ text: String(m.text), ausricht: String(m.ausricht || ''),
                 x: Math.round(m.point ? m.point[0] : 0),
                 breite: Math.round(m.breiteBox || 0) }));

  return { marken, seiteId: String(r.seite.id) };
});

/* ── §2 MISST DAS ECHTE SVG, NICHT DAS DATENMODELL ────────────────────────
   Eine Marke kann ein Feld tragen, das niemand malt. Die Seite wird deshalb
   wirklich geöffnet und der gezeichnete Knoten befragt — keine Nachbildung
   (§30: keine Mocks, wenn die echte App geprüft werden kann). */
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
  const lies = (anfang: string) => {
    const knoten = [...document.querySelectorAll('svg text')]
      .find(t => (t.textContent || '').trim().startsWith(anfang));
    if (!knoten) return null;
    return { anker: knoten.getAttribute('text-anchor') || 'start',
             x: Math.round(Number(knoten.getAttribute('x'))),
             zeilenX: [...knoten.querySelectorAll('tspan')]
               .map(t => Math.round(Number(t.getAttribute('x')))) };
  };
  return { links: lies('links'), mitte: lies('mitte'), rechts: lies('rechts'),
           umbruch: lies('Dieser zentrierte') };
});

/* ══ §1 WAS IN DER DATEI STEHT, KOMMT AN ═════════════════════════════════ */
console.log('\n§1 `a:pPr@algn` wird gelesen');
{
  const von = (t: string) => erg.marken.find((m: any) => m.text.startsWith(t))?.ausricht;
  gleich('Ohne Angabe bleibt das Feld leer', von('ohne Angabe'), '');
  gleich('`algn="l"` ebenso — links ist die Vorgabe', von('links'), '');
  gleich('`algn="ctr"` wird `mitte`', von('mitte'), 'mitte');
  gleich('`algn="r"` wird `rechts`', von('rechts'), 'rechts');
}

/* ══ §2 UND WIRD AUCH SO GEZEICHNET ══════════════════════════════════════ */
console.log('\n§2 Der SVG-Anker folgt — gemessen am gezeichneten Knoten');
{
  /* Kasten: x = 36 pt, Breite = 360 pt, pad = round(16 · 0,35) = 6. */
  gleich('Links hat gar keinen Anker (das ist die Vorgabe)', gemalt.links?.anker, 'start');
  gleich('… und sitzt auf x + pad', gemalt.links?.x, 42);
  gleich('Mitte bekommt `middle`', gemalt.mitte?.anker, 'middle');
  gleich('… und sitzt auf der Mitte des Kastens', gemalt.mitte?.x, 216);
  gleich('Rechts bekommt `end`', gemalt.rechts?.anker, 'end');
  gleich('… und sitzt auf der rechten Kante minus pad', gemalt.rechts?.x, 390);
  /* DER FALL, DER SONST DURCHRUTSCHT: ein umbrechender Absatz. */
  p('Ein umbrechender Absatz hat mehr als eine Zeile',
    (gemalt.umbruch?.zeilenX.length || 0) > 1, JSON.stringify(gemalt.umbruch));
  p('… und ALLE Zeilen sitzen auf derselben Mitte',
    !!gemalt.umbruch && gemalt.umbruch.zeilenX.every((x: number) => x === 216),
    JSON.stringify(gemalt.umbruch?.zeilenX));
}

/* ══ §3 ZWEI AUSRICHTUNGEN TEILEN DEN KASTEN ═════════════════════════════ */
console.log('\n§3 Ein Kasten mit zwei Ausrichtungen wird zwei Marken');
{
  const zentriert = erg.marken.find((m: any) => m.text === 'zentriert');
  const links = erg.marken.find((m: any) => m.text === 'linksbuendig');
  p('Beide Absätze sind eigene Marken', !!zentriert && !!links,
    JSON.stringify(erg.marken.map((m: any) => m.text)));
  gleich('… und der erste ist zentriert', zentriert?.ausricht, 'mitte');
  gleich('… der zweite nicht', links?.ausricht, '');
}

/* ══ §4 BLOCKSATZ KOMMT LINKS AN — MIT ABSICHT ═══════════════════════════ */
console.log('\n§4 Was Redion nicht kann, nähert es in die richtige Richtung');
{
  const von = (t: string) => erg.marken.find((m: any) => m.text.startsWith(t))?.ausricht;
  gleich('`just` wird NICHT `mitte`', von('blocksatz'), '');
  gleich('`dist` ebenso', von('verteilt'), '');
}

/* ══ §5 DER KNOPF IN DER LEISTE ══════════════════════════════════════════ */
console.log('\n§5 Und Redion kann es jetzt selbst — der Knopf in der Zeichenleiste');
{
  /* EINE FEHLENDE EIGENSCHAFT IST NIE NUR EINE IMPORTLÜCKE. Solange die
     Textmarke kein Feld für die Ausrichtung hatte, konnte auch niemand in
     Redion einen Text zentrieren. Der Knopf ist deshalb Teil desselben
     Bogens, nicht ein späterer. */
  /* IM DOKUMENTSTUDIO LIEGT DIE SCHRIFTGRUPPE HINTER `···` (E552) — samt
     `fett` und `rahmen`. Das ist Absicht: die schwebende Leiste unten hat
     nicht Platz für alles. Gemessen wurde es, nicht angenommen: vorher ist
     der Knopf `display:none` und 0 × 0, nachher 61 × 44.

     UND DESHALB FRAGT §5 NICHT NUR, OB ER IM DOM STEHT. Ein Knopf im DOM,
     den man nie zu sehen bekommt, ist keine Funktion — genau der Fall, den
     §55.1 meint. */
  const vorher = await seite.evaluate(() => {
    const b = document.querySelector<HTMLElement>('[data-act="ausricht"]');
    return b ? Math.round(b.getBoundingClientRect().width) : -1;
  });
  gleich('Vor „···" ist er eingeklappt (wie `fett` auch)', vorher, 0);
  await seite.evaluate(() =>
    document.querySelector<HTMLElement>('[data-document-action="ink-options"]')?.click());
  await seite.waitForTimeout(400);
  const knopf = await seite.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('[data-act="ausricht"]');
    if (!b) return { da: false, jetzt: '', breite: 0, hoehe: 0, sichtbar: false, imBild: false };
    const r = b.getBoundingClientRect();
    const st = getComputedStyle(b);
    return { da: true, jetzt: b.dataset.ausricht || '',
      breite: Math.round(r.width), hoehe: Math.round(r.height),
      sichtbar: r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden',
      imBild: r.left >= 0 && r.right <= 1280 && r.top >= 0 && r.bottom <= 900 };
  });
  p('Nach „···" steht er wirklich da', knopf.sichtbar === true, JSON.stringify(knopf));
  p('… und ganz im Bild', knopf.imBild === true, JSON.stringify(knopf));
  /* §37: 44 px auf den Hauptwegen. Ein Knopf in der Werkzeugleiste ist einer. */
  p('… und misst mindestens 44 px (§37)', knopf.hoehe >= 44,
    knopf.hoehe + ' px hoch, ' + knopf.breite + ' px breit');
  gleich('… und beginnt auf „links"', knopf.jetzt, 'links');
  /* Antippen schaltet weiter — wie die Schriftart daneben. */
  const nach = await seite.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('[data-act="ausricht"]');
    b?.click();
    const c = document.querySelector<HTMLButtonElement>('[data-act="ausricht"]');
    return c?.dataset.ausricht || '';
  });
  gleich('Antippen schaltet auf „mitte"', nach, 'mitte');
  const rundum = await seite.evaluate(() => {
    const weg: string[] = [];
    for (let i = 0; i < 2; i++) {
      document.querySelector<HTMLButtonElement>('[data-act="ausricht"]')?.click();
      weg.push(document.querySelector<HTMLButtonElement>('[data-act="ausricht"]')?.dataset.ausricht || '');
    }
    return weg;
  });
  p('… dann „rechts", dann wieder „links"',
    rundum[0] === 'rechts' && rundum[1] === 'links', JSON.stringify(rundum));
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 515: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
