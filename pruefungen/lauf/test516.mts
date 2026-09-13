/* Suite 516 — Gemischte Läufe INNERHALB eines Absatzes
 * ============================================================================
 * Der letzte Punkt aus L151, bei dem beim Öffnen sichtbar etwas verlorenging.
 * E557 hat das Format je ABSATZ gelesen und dabei selbst festgehalten, was
 * offen bleibt: „Innerhalb eines Absatzes bleibt es beim ersten Lauf."
 *
 *     <a:r><a:rPr sz="1200"/><a:t>klein </a:t></a:r>
 *     <a:r><a:rPr sz="3600" b="1"/><a:t>GROSS</a:t></a:r>
 *
 *   VORHER   eine Marke „klein GROSS", 12 pt, nicht fett
 *   NACHHER  zwei Stücke in einer Zeile, 12 pt und 36 pt fett
 *
 * ─── DER ALTE WEG MUSS UNBERÜHRT BLEIBEN ────────────────────────────────────
 * Das ist die eigentliche Zusage dieser Suite, nicht der neue Satz. Eine
 * Marke ohne `laeufe` — also JEDE, die je geschrieben wurde — geht weiter
 * durch `textLines` wie seit E360. §4 misst das an einer von Hand gebauten
 * Marke, nicht an einer eingelesenen: eine Satzänderung, die alte Notizen
 * anders zeichnet, wäre der teuerste Fehler dieses Projekts (§9, §51).
 *
 * Und ein Absatz, dessen Läufe ALLE dasselbe Format haben, bekommt gar kein
 * `laeufe` — der Normalfall bleibt damit wörtlich der alte Fall. §3 misst es.
 *
 * ─── UND DIE STÜCKE WERDEN NICHT GERECHNET, SONDERN GELEGT ──────────────────
 * Die erste Fassung gab jedem Stück ein ABSOLUTES `x` aus `textWidth`. Das
 * Bild hat sie widerlegt, und keine Zusage hatte es gesehen: „Wort" lief
 * mitten in „mittendrin" hinein. `textWidth` ist eine Schätzung aus
 * Buchstabenbreiten und liegt um bis zu 15 % daneben (nachgemessen, L155).
 * Jetzt trägt nur das ERSTE Stück einer Zeile ein `x`; die übrigen fliessen,
 * und SVG setzt sie mit den echten Massen des Browsers. §5 misst deshalb
 * `getStartPositionOfChar`, nicht das Attribut.
 *
 * ─── DIE ZEILENHÖHE IST DIE DES GRÖSSTEN STÜCKS ─────────────────────────────
 * Eine Zeile mit 12 pt und 36 pt ist 36 pt hoch. Rechnet man mit 12, läuft
 * die nächste Zeile in die grosse Schrift hinein — §2 misst die Höhe des
 * Kastens gegen beide Zahlen.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → nur den ersten Lauf lesen (der alte Zustand):   16 rot (der alte Zustand, wörtlich)
 *   G2 → die Zeilenhöhe vom Grundgrad nehmen:            2 rot (23 pt statt 53)
 *   G3 → `laeufe` IMMER anhängen, auch bei einem Format: 1 rot (der Normalfall trüge dann `laeufe`)
 *   G4 → die Stücke ohne eigenes `font-size` zeichnen:   2 rot (beide Stücke ohne Grad)
 *   G5 → jedem Stück ein gerechnetes `x` geben:          3 rot (beide auf x = 40)
 *
 *   node pruefungen/lauf/test516.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const App: any;
declare const InkGeometry: any;
declare const Store: any;
declare const Einlesen: any;
declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9626;
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

  const lauf = (text: string, sz: number, fett = false, farbe = '') =>
    `<a:r><a:rPr sz="${sz * 100}"${fett ? ' b="1"' : ''}>` +
    (farbe ? `<a:solidFill><a:srgbClr val="${farbe}"/></a:solidFill>` : '') +
    `</a:rPr><a:t>${text}</a:t></a:r>`;

  const kasten = (id: number, inneres: string, y: number, cx = 6858000) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="T${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="457200" y="${y}"/><a:ext cx="${cx}" cy="914400"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:lstStyle/><a:p>${inneres}</a:p></p:txBody></p:sp>`;

  const huelle = (inhalt: string) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    inhalt + '</p:spTree></p:cSld></p:sld>';
  const rel = (id: string, typ: string, ziel: string) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
  const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + i + '</Relationships>';

  const folie =
    /* 11 — der Fall aus L151: zwei Grade in einer Zeile. */
    kasten(11, lauf('klein ', 12) + lauf('GROSS', 36, true), 228600) +
    /* 12 — drei Farben in einer Zeile, gleicher Grad. */
    kasten(12, lauf('rot ', 16, false, 'CC0000') + lauf('gruen ', 16, false, '2E7D32') +
               lauf('blau', 16, false, '1565C0'), 1371600) +
    /* 13 — ALLE Läufe gleich: das ist der Normalfall und darf KEIN
       `laeufe` bekommen. */
    kasten(13, lauf('eins ', 16) + lauf('zwei ', 16) + lauf('drei', 16), 2286000) +
    /* 14 — ein harter Umbruch mittendrin, danach ein anderer Grad. */
    kasten(14, lauf('oben', 14) + '<a:br/>' + lauf('unten gross', 28), 3200400);

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
  const r = await Einlesen.datei(new File([blob], 'Laeufe.pptx',
    { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
  const marken = ((blatt?.marken || []) as any[]).filter(m => m.art === 'text')
    .map(m => ({ text: String(m.text), fontSize: m.fontSize, fett: !!m.fett,
                 laeufe: Array.isArray(m.laeufe)
                   ? m.laeufe.map((l: any) => ({ text: l.text, sz: l.sz, fett: !!l.fett, farbe: l.farbe || '' }))
                   : null,
                 hoehe: Math.round(InkGeometry.textLayout(
                   { ...m, point: m.point })?.height || 0) }));

  /* ── §4: DER ALTE WEG, an einer VON HAND gebauten Marke ohne `laeufe`.
     Nicht an einer eingelesenen — die trägt das Feld ja gerade. */
  const alt = { art: 'text', point: [0, 0], text: 'eine ganz gewoehnliche Notiz, die umbricht weil sie lang ist',
                fontSize: 16, breiteBox: 200 };
  const altL = InkGeometry.textLayout(alt);
  return { marken, seiteId: String(r.seite.id),
    alteMarke: { zeilen: altL?.lines?.length || 0, hoehe: Math.round(altL?.height || 0),
                 hatZeilen: !!altL?.zeilen } };
});

const von = (t: string) => erg.marken.find((m: any) => m.text.startsWith(t));

/* ══ §1 ZWEI FORMATE IN EINER ZEILE ══════════════════════════════════════ */
console.log('\n§1 „klein GROSS" behält beide Grade');
{
  const m = von('klein');
  p('Die Marke trägt ihre Läufe', !!m?.laeufe, JSON.stringify(m));
  gleich('… es sind zwei', m?.laeufe?.length, 2);
  gleich('… der erste in 12 pt', m?.laeufe?.[0]?.sz, 12);
  gleich('… der zweite in 36 pt', m?.laeufe?.[1]?.sz, 36);
  p('… und der zweite ist fett, der erste nicht',
    m?.laeufe?.[1]?.fett === true && m?.laeufe?.[0]?.fett === false, JSON.stringify(m?.laeufe));
  /* Der Text bleibt derselbe — nichts geht verloren, nichts kommt dazu. */
  gleich('Der Text ist unverändert', m?.text, 'klein GROSS');

  const f = von('rot');
  gleich('Drei Farben werden drei Läufe', f?.laeufe?.length, 3);
  p('… mit ihren eigenen Farben',
    f?.laeufe?.[0]?.farbe === '#CC0000' && f?.laeufe?.[2]?.farbe === '#1565C0',
    JSON.stringify(f?.laeufe));
}

/* ══ §2 DIE ZEILENHÖHE FOLGT DEM GRÖSSTEN STÜCK ══════════════════════════ */
console.log('\n§2 Eine Zeile mit 12 und 36 pt ist 36 pt hoch');
{
  const m = von('klein');
  /* GERECHNET, NICHT GESCHÄTZT: pad = round(12 · 0,35) = 4, eine Zeile,
     Zeilenhöhe = 36 · 1,25 = 45  →  4 · 2 + 45 = 53.
     Mit dem Grundgrad wären es 4 · 2 + 12 · 1,25 = 23.

     MEINE ERSTE FASSUNG STAND HIER ALS „> 19,2" — und die Gegenprobe G2
     lieferte 23, also grün. Eine Schwelle, die der Fehlerfall überspringt,
     ist keine Zusage. Jetzt steht die Zahl da, die herauskommen MUSS. */
  gleich('Der Kasten ist genau 53 pt hoch (4·2 + 36·1,25)', m?.hoehe, 53);
  p('… und NICHT die 23 aus dem Grundgrad',
    (m?.hoehe || 0) !== 23, m?.hoehe + ' pt');
}

/* ══ §3 DER NORMALFALL BLEIBT WÖRTLICH DER ALTE ══════════════════════════ */
console.log('\n§3 Gleiches Format in allen Läufen → gar kein `laeufe`');
{
  const m = von('eins');
  p('Der Kasten ist da', !!m, JSON.stringify(erg.marken.map((x: any) => x.text)));
  gleich('… und trägt KEIN `laeufe`', m?.laeufe, null);
  gleich('… sein Text ist zusammengesetzt', m?.text, 'eins zwei drei');
  gleich('… und sein Grad der gemeinsame', m?.fontSize, 16);
}

/* ══ §4 EINE ALTE MARKE WIRD GENAU WIE FRÜHER GESETZT ════════════════════ */
console.log('\n§4 Eine Marke ohne `laeufe` geht den alten Weg (§9)');
{
  gleich('Sie bekommt gar keine Stückzeilen', erg.alteMarke.hatZeilen, false);
  /* 16 pt, Kasten 200 breit, pad = round(16 · 0,35) = 6, `TEXT_ZEILE` = 1,25
     (`geometry.ts:238` — NACHGESEHEN, nicht erinnert: meine erste Fassung
     rechnete hier mit 1,35 und meldete „72 — erwartet 77". Der Code hatte
     recht. Genau die Sorte Fehler, die P32 schon einmal gekostet hat). */
  p('Sie bricht wie immer um', erg.alteMarke.zeilen >= 3,
    erg.alteMarke.zeilen + ' Zeilen');
  p('… und ihre Höhe ist Zeilen × Grad × Zeilenmass',
    erg.alteMarke.hoehe === Math.round(6 * 2 + erg.alteMarke.zeilen * 16 * 1.25),
    erg.alteMarke.hoehe + ' — erwartet ' + Math.round(12 + erg.alteMarke.zeilen * 16 * 1.25));
}

/* ══ §5 UND SO WIRD ES WIRKLICH GEZEICHNET ═══════════════════════════════ */
await seite.evaluate((sid: string) => App.oeffne(sid), erg.seiteId);
await seite.waitForTimeout(1200);
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(200);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}
/* ERST SICHTBAR MACHEN, DANN MESSEN. `getStartPositionOfChar` und `getBBox`
   geben 0 zurück, solange der Knoten nicht gelayoutet ist — und das Blatt
   liegt beim Öffnen unterhalb des Fensters. Eine Messung an einem nicht
   gezeichneten Knoten ist keine Messung. */
await seite.evaluate(() => {
  const t = [...document.querySelectorAll('svg text')]
    .find(n => (n.textContent || '').trim().startsWith('klein'));
  t?.scrollIntoView({ block: 'center' });
});
await seite.waitForTimeout(600);
const gemalt = await seite.evaluate(() => {
  /* ES GIBT ZWEI PASSENDE KNOTEN, und der erste ist der falsche: seine
     `<svg>` misst 0 × 0 (die Vorschau in der Folienliste), die zweite
     978 × 549. Ein `find` ohne diese Bedingung misst an einem Knoten, den
     niemand sieht — und bekommt lauter Nullen zurück, ohne dass etwas
     kaputt wäre. Genau das hat diese Zusage zuerst getan. */
  const knoten = [...document.querySelectorAll('svg text')]
    .filter(t => (t.textContent || '').trim().startsWith('klein'))
    .find(t => (t.closest('svg')?.getBoundingClientRect().width || 0) > 10);
  if (!knoten) return null;
  return [...knoten.querySelectorAll('tspan')].map(t => {
    /* DIE ECHTE STELLE, nicht das Attribut. Nur das erste Stück einer Zeile
       trägt ein `x`; die übrigen fliessen, und ihre Lage kennt erst der
       Zeichner. `getStartPositionOfChar` fragt genau ihn. */
    let echtX = -1, echtY = -1, wie = '';
    try {
      const p0 = (t as SVGTextContentElement).getStartPositionOfChar(0);
      echtX = Math.round(p0.x); echtY = Math.round(p0.y); wie = 'char';
    } catch (e) { wie = 'fehler: ' + String((e as Error).message).slice(0, 60); }
    if (echtX < 0) {
      try { const b = (t as unknown as SVGGraphicsElement).getBBox();
        echtX = Math.round(b.x); echtY = Math.round(b.y); wie += ' bbox'; } catch { /* nichts */ }
    }
    return { text: t.textContent || '', grad: t.getAttribute('font-size') || '',
      gewicht: t.getAttribute('font-weight') || '',
      hatX: t.hasAttribute('x'), echtX, echtY, wie };
  });
});
console.log('\n§5 Jedes Stück bekommt sein eigenes `tspan`');
{
  p('Es sind zwei Stücke', gemalt?.length === 2, JSON.stringify(gemalt));
  gleich('… das erste in 12', gemalt?.[0]?.grad, '12');
  gleich('… das zweite in 36', gemalt?.[1]?.grad, '36');
  gleich('… und fett', gemalt?.[1]?.gewicht, '700');
  /* `gemalt.length >= 2` GEHÖRT IN DIE BEDINGUNG, nicht nur `!!gemalt`.
     Ohne das stürzte die Gegenprobe G1 hier ab (`Cannot read properties of
     undefined`) statt rot zu werden — und ein Absturz ist kein
     Prüfergebnis: er verschluckt die Zahl, auf die es ankommt. */
  p('Nur das erste Stück trägt ein `x` — die übrigen fliessen',
    !!gemalt && gemalt.length >= 2 && gemalt[0]!.hatX && !gemalt[1]!.hatX,
    JSON.stringify(gemalt?.map(g => g.hatX)));
  /* UND DAS IST DER PUNKT DER GANZEN ÄNDERUNG: gemessen wird, wo der
     Zeichner die Stücke WIRKLICH hinsetzt. Die erste Fassung gab jedem
     Stück ein gerechnetes `x` aus `textWidth` — und `textWidth` ist eine
     Schätzung, die um bis zu 15 % danebenliegt (L155). Auf dem Bild lief
     „Wort" mitten in „mittendrin" hinein. */
  p('… das zweite steht RECHTS vom ersten, nicht darunter',
    !!gemalt && gemalt.length >= 2
      && gemalt[1]!.echtX > gemalt[0]!.echtX && gemalt[1]!.echtY === gemalt[0]!.echtY,
    JSON.stringify(gemalt));
  /* Und es überlappt nicht: das zweite beginnt hinter dem Ende des ersten. */
  p('… und überlappt es nicht',
    !!gemalt && gemalt.length >= 2 && gemalt[1]!.echtX >= gemalt[0]!.echtX + 20,
    JSON.stringify(gemalt?.map(g => g.echtX)));
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 516: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
