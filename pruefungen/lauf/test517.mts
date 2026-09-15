/* Suite 517 — Textbreite: exakt messen statt schätzen (L155)
 * ============================================================================
 * `InkGeometry.textWidth` rechnete die Breite aus einer Tabelle von
 * Buchstabenbreiten. Sie steuert den Umbruch JEDER Textmarke in Redion — und
 * sie war nachweislich zu niedrig. Gefunden bei E561, durch ein Bild:
 *
 *     „ mittendrin, der über mehrere"   echt 15,02 em   geschätzt 13,09
 *     ganze Zeile bei 18 pt             echt 688 pt     geschätzt 611 pt
 *                                       Kasten: 636 pt
 *
 * Eine Zeile, die den Kasten füllt, lief um rund ein Achtel darüber hinaus.
 *
 * ─── WARUM KEINE BESSERE KONSTANTE ──────────────────────────────────────────
 * Die Abweichung schwankt je nach Text zwischen 0,99 und 1,15. Ein einziger
 * Faktor verschöbe den Fehler nur. Der Browser weiss es genau:
 * `canvas.measureText` fragt dieselbe Schrift, die nachher zeichnet.
 *
 * ─── DIE EIGENSCHAFT, AUF DIE ES ANKOMMT ────────────────────────────────────
 * §3 prüft nicht eine Zahl, sondern eine ZUSAGE ÜBER ALLE ZEILEN: keine
 * gezeichnete Zeile darf breiter sein als ihr Kasten. Gemessen mit
 * `getComputedTextLength` am echten SVG, über mehrere Texte und Kästen.
 * Das ist der Satz, den der alte Weg gebrochen hat — nicht „13,09 gegen
 * 15,02", sondern „Text steht ausserhalb seines Kastens".
 *
 * ─── UND DIE TABELLE BLEIBT ─────────────────────────────────────────────────
 * In Node gibt es kein Canvas. Die Schätzung bleibt als Rückfall, und
 * `gemessenAn()` sagt, welcher Weg gerade gilt — §1 misst beides.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   G1 → wieder schätzen statt messen:                   2 rot — und die zweite nennt die Zeilen: a2 164,2 in 160 · a6 202,2 in 200
 *   G2 → beim Messen die Schriftfamilie ignorieren:      2 rot (alle fünf Familien liefern 242)
 *   G3 → den Cache nie leeren, aber falsch füllen:       3 rot (auch Fett und Normal fallen zusammen)
 *
 *   node pruefungen/lauf/test517.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const App: any;
declare const Marken: any;
declare const InkGeometry: any;
declare const Store: any;
declare const Einlesen: any;
declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9627;
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


/* ══ §1 IM BROWSER WIRD GEMESSEN, NICHT GESCHÄTZT ════════════════════════ */
console.log('\n§1 Der Weg, der gerade gilt');
{
  const erg = await seite.evaluate(() => {
    const stapel = InkGeometry.schriftStapel('standard');
    const c = document.createElement('canvas').getContext('2d')!;
    const echt = (t: string, fett: boolean, grad: number) => {
      c.font = `${fett ? 700 : 400} ${grad}px ${stapel}`;
      return c.measureText(t).width;
    };
    /* Die alte Tabelle, wörtlich nachgebaut — damit die Suite zeigen kann,
       WIE WEIT sie danebenlag, statt es nur zu behaupten. */
    const schaetz = (t: string, fett: boolean, grad: number) => {
      let w = 0;
      for (const ch of t) {
        let f = 1;
        if (" .,:;'|!ijltIfr".includes(ch)) f = 0.55;
        else if ('mwMW'.includes(ch)) f = 1.55;
        else if ((ch >= 'A' && ch <= 'Z') || 'ÄÖÜ'.includes(ch)) f = 1.25;
        w += 0.55 * f * (fett ? 1.06 : 1);
      }
      return w * grad;
    };
    const probe = ' mittendrin, der über mehrere';
    return {
      weg: InkGeometry.gemessenAn(),
      redion: InkGeometry.textWidth(probe, 18, 'standard', false),
      echt: echt(probe, false, 18),
      alteSchaetzung: schaetz(probe, false, 18),
      leer: InkGeometry.textWidth('', 18, 'standard', false),
      /* Zweimal dieselbe Frage muss dieselbe Antwort geben (Cache). */
      zweimalGleich: InkGeometry.textWidth(probe, 18, 'standard', false)
                  === InkGeometry.textWidth(probe, 18, 'standard', false),
      /* Und die Grösse muss linear durchschlagen: bei 100 gemessen, geteilt. */
      doppelt: InkGeometry.textWidth(probe, 36, 'standard', false),
    };
  });
  gleich('Im Browser wird gemessen', erg.weg, 'gemessen');
  p('Redions Breite ist die echte Breite',
    Math.abs(erg.redion - erg.echt) < 0.5,
    'Redion ' + erg.redion.toFixed(2) + ' — Canvas ' + erg.echt.toFixed(2));
  p('… und die alte Schätzung lag deutlich darunter',
    erg.alteSchaetzung < erg.echt * 0.95,
    'geschätzt ' + erg.alteSchaetzung.toFixed(0) + ' — echt ' + erg.echt.toFixed(0));
  gleich('Leerer Text ist null breit', erg.leer, 0);
  p('Zweimal gefragt, zweimal dieselbe Zahl', erg.zweimalGleich === true, '');
  p('Doppelter Grad, doppelte Breite',
    Math.abs(erg.doppelt - erg.redion * 2) < 0.5,
    erg.doppelt.toFixed(2) + ' gegen ' + (erg.redion * 2).toFixed(2));
}

/* ══ §2 JEDE SCHRIFTFAMILIE WIRD EIGEN GEMESSEN ══════════════════════════ */
console.log('\n§2 Fünf Familien, fünf Breiten');
{
  const erg = await seite.evaluate(() => {
    const probe = 'Handbuch für Millimeter';
    const breiten: Record<string, number> = {};
    for (const f of InkGeometry.SCHRIFTEN)
      breiten[f.id] = Math.round(InkGeometry.textWidth(probe, 20, f.id, false) * 100) / 100;
    return { breiten, fett: Math.round(InkGeometry.textWidth(probe, 20, 'standard', true) * 100) / 100,
             normal: Math.round(InkGeometry.textWidth(probe, 20, 'standard', false) * 100) / 100 };
  });
  const werte = Object.values(erg.breiten);
  p('Es sind fünf Familien', werte.length === 5, JSON.stringify(erg.breiten));
  p('… und sie liefern verschiedene Breiten',
    new Set(werte).size >= 4, JSON.stringify(erg.breiten));
  p('Schreibmaschine ist breiter als Schmal',
    (erg.breiten.mono || 0) > (erg.breiten.schmal || 0),
    'mono ' + erg.breiten.mono + ' — schmal ' + erg.breiten.schmal);
  p('Fett ist breiter als normal', erg.fett > erg.normal,
    'fett ' + erg.fett + ' — normal ' + erg.normal);
}

/* ══ §3 KEINE ZEILE STEHT AUSSERHALB IHRES KASTENS ═══════════════════════ */
console.log('\n§3 Die Zusage über ALLE Zeilen (das war der Bruch)');
{
  const erg = await seite.evaluate(async () => {
    /* DAS BLATT ENTSTEHT AUF DEM ECHTEN WEG, über das Einlesen — ein von
       Hand gesetzter `blatt`-Block hing an keiner Seite, und die Probe fand
       0 Zeilen. Eine Zusage auf einer leeren Liste ist grün und wertlos;
       gefangen hat es erst die zweite Zusage darunter (§55.2). */
    const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const rel = (id: string, typ: string, ziel: string) =>
      `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${typ}" Target="${ziel}"/>`;
    const relsDatei = (i: string) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + i + '</Relationships>';
    const dateien = [
      { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>' },
      { name: '_rels/.rels', inhalt: relsDatei(rel('rId1', 'officeDocument', 'ppt/presentation.xml')) },
      { name: 'ppt/presentation.xml', inhalt:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
        '<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>' +
        '<p:sldSz cx="5486400" cy="7772400"/></p:presentation>' },
      { name: 'ppt/_rels/presentation.xml.rels', inhalt: relsDatei(rel('rId1', 'slide', 'slides/slide1.xml')) },
      { name: 'ppt/slides/slide1.xml', inhalt:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
        '</p:spTree></p:cSld></p:sld>' },
      { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: relsDatei('') },
    ];
    const blob = await Austausch.zipSchreiben(dateien);
    const r = await Einlesen.datei(new File([blob], 'Breite.pptx',
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    const blatt = (Store.childrenOf(r.seite.id) || []).find((b: any) => b.type === 'blatt');
    /* Sechs Marken: verschiedene Texte, Kästen und Grade — darunter der
       Fall aus E561 mit gemischtem Format. */
    const marken = [
      { id: 'a1', art: 'text', point: [20, 20], breiteBox: 300, fontSize: 16,
        text: 'Ein Satz mit einem hervorgehobenen Wort mittendrin, der über mehrere Zeilen läuft.' },
      { id: 'a2', art: 'text', point: [20, 160], breiteBox: 160, fontSize: 22,
        text: 'Kurze Kästen brechen härter um, das ist der eigentliche Härtefall.' },
      { id: 'a3', art: 'text', point: [20, 320], breiteBox: 420, fontSize: 12, fett: true,
        text: 'FETTE GROSSBUCHSTABEN WAREN DER SCHLIMMSTE FALL DER ALTEN SCHÄTZUNG.' },
      { id: 'a4', art: 'text', point: [20, 420], breiteBox: 260, fontSize: 18, schrift: 'mono',
        text: 'Schreibmaschine misst anders als die Standardschrift.' },
      { id: 'a5', art: 'text', point: [20, 540], breiteBox: 300, fontSize: 16,
        text: 'Mit Laeufen gemischt:', laeufe: [
          { text: 'klein ', sz: 12 }, { text: 'GROSS UND FETT ', sz: 30, fett: true },
          { text: 'und wieder klein, lang genug zum Umbrechen.', sz: 12 }] },
      { id: 'a6', art: 'text', point: [20, 700], breiteBox: 200, fontSize: 14,
        text: 'Einwortzeileohnejedeleerstelleüberbreite' },
    ];
    Store.updateBlock(blatt.id, { marken });
    return String(r.seite.id);
  });
  await seite.evaluate((sid: string) => App.oeffne(sid), erg);
  await seite.waitForTimeout(1200);
  for (let versuch = 0; versuch < 8; versuch++) {
    await seite.evaluate(() => {
      document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
    });
    await seite.waitForTimeout(200);
    if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
  }
  await seite.waitForTimeout(900);
  const zeilen = await seite.evaluate(() => {
    /* DEN KNOTEN BENENNEN, NICHT DEN ERSTEN BREITEN NEHMEN. Ein `find` über
       alle `svg` traf ein Symbol von 25 px mit null Texten — die Probe fand
       dann 0 Zeilen und die Zusage darüber wurde auf der leeren Liste grün.
       Gesucht ist die Markenschicht des BLATTS, und die heisst so. */
    const svgEl = [...document.querySelectorAll('svg.blatt-marken')]
      .find(n => n.getBoundingClientRect().width > 10);
    if (!svgEl) return null;
    const raus: Array<{ id: string; text: string; laenge: number; kasten: number }> = [];
    for (const t of [...svgEl.querySelectorAll('text')]) {
      const gruppe = t.closest('[data-sid]');
      const sid = (gruppe as HTMLElement | null)?.dataset?.sid || '';
      /* `breiteBox` steht nicht im DOM — die Kastenbreite kommt aus der
         unsichtbaren Fläche, die die Marke zum Greifen hat. */
      const flaeche = gruppe?.querySelector('rect');
      const kasten = Number(flaeche?.getAttribute('width') || 0);
      for (const sp of [...t.querySelectorAll('tspan')]) {
        const laenge = (sp as SVGTextContentElement).getComputedTextLength?.() || 0;
        raus.push({ id: sid, text: (sp.textContent || '').slice(0, 20),
                    laenge: Math.round(laenge * 10) / 10, kasten });
      }
      if (!t.querySelector('tspan')) {
        raus.push({ id: sid, text: (t.textContent || '').slice(0, 20),
          laenge: Math.round(((t as SVGTextContentElement).getComputedTextLength?.() || 0) * 10) / 10,
          kasten });
      }
    }
    return raus;
  });
  p('Es wurden Zeilen gefunden', !!zeilen && zeilen.length >= 6,
    JSON.stringify(zeilen?.length));
  /* Ein Kasten hat `pad` links und rechts; die Zeile darf also höchstens
     Kastenbreite minus zwei Polster breit sein. Die Polsterbreite hängt am
     Grad, deshalb wird gegen die volle Kastenbreite geprüft — das ist die
     schwächere, aber unbestreitbare Schranke: darüber steht Text WIRKLICH
     ausserhalb. */
  const drueber = (zeilen || []).filter(z => z.kasten > 0 && z.laenge > z.kasten);
  p('KEINE Zeile ist breiter als ihr Kasten', drueber.length === 0,
    drueber.length + ' von ' + (zeilen?.length || 0) + ': ' + JSON.stringify(drueber.slice(0, 4)));
  /* Und die Zeilen sind nicht zufällig alle winzig — sonst wäre die Zusage
     oben umsonst grün. */
  const volle = (zeilen || []).filter(z => z.kasten > 0 && z.laenge > z.kasten * 0.5);
  p('… und mindestens vier Zeilen füllen ihren Kasten zur Hälfte',
    volle.length >= 4, volle.length + ' Zeilen');
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 517: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
