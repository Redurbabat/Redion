/* Suite 474 — Handschrift wird eine echte /Ink-Annotation (E506)
 * ============================================================================
 * Aus dem Stift-Dossier, Seite 20 — der Schlusssatz des ganzen Textes:
 *
 *   „Für portable PDF-Handschrift sollte man Roh-Ink und PDF-Ink als zwei
 *    verschiedene Datenmodelle behandeln. … das Austauschmodell sollte eine
 *    saubere standardisierte /Ink-Annotation plus explizites Appearance
 *    enthalten."
 *
 * Redions PDF-Export war bis hierher ein Fotoalbum: jede Seite ein JPEG,
 * jede Handschrift Teil des Bildes. In der Datenverlust-Pyramide des
 * Dossiers (S.6) die unterste Stufe — „bewahrt im Extremfall nur Pixel;
 * keine editierbare Stroke-Semantik mehr".
 *
 *   §1 EINE HANDSCHRIFT IST EINE ANNOTATION. Subtype /Ink, an der Seite
 *      in /Annots, mit /Rect, /InkList und /C.
 *   §2 SIE HAT EIN EIGENES AUSSEHEN (/AP /N) — sonst rekonstruiert jeder
 *      Leser den Strich selbst, und ISO lässt offen, wie er die Punkte
 *      verbindet (Dossier S.4).
 *   §3 DIE PUNKTE STIMMEN. /InkList steht im Default User Space: Ursprung
 *      unten links, y nach oben. Ein Strich, der auf dem Blatt oben liegt,
 *      muss in der PDF ein grosses y haben.
 *   §4 WAS NICHT ANNOTATION WIRD, BLEIBT IM BILD — und zwar vollständig.
 *      Das Abdeckband besonders: eine Annotation, die man wegschieben
 *      kann, deckt nichts ab.
 *   §5 NICHTS STEHT ZWEIMAL DA. Was Annotation wurde, ist nicht auch noch
 *      ins Bild gemalt.
 *   §6 EINE GEDREHTE SEITE dreht ihre Annotationen mit.
 *   §7 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vor dem Bauen war sie es in §1 bis §3, §5 und §6 — es gab keine einzige
 * Annotation. Die Gegenproben nach dem Bauen stehen in ENTSCHEIDUNGEN.md
 * unter E506.
 *
 *   node pruefungen/lauf/test474.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const PdfFremd: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9594;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/**
 * Eine Seite mit einem Blatt, darauf die übergebenen Marken — und das
 * fertige PDF, mit pdf.js WIEDER AUFGEMACHT.
 *
 * Zurückgelesen wird mit derselben Bibliothek, die auch Adobe-Dateien liest;
 * §13 verlangt echte Bytes, nicht „sieht gut aus". Was `getAnnotations`
 * herausgibt, ist genau das, was ein fremder Leser sähe.
 */
const machen = async (marken: any[], gedreht = 0): Promise<any> => {
  const s: Page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  const raus = JSON.parse(await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const seite = Store.addPage(null, { text: 'Ausfuhr', dokumentModus: true });
    const blatt = Store.addBlock(seite.id, 'blatt', { text: '',
      blattBreite: 400, blattHoehe: 600, raumVersion: 1,
      gedreht: ${gedreht}, marken: ${JSON.stringify(marken)} });
    await Store.flush();
    const blob = await DocumentMode.alsPdf([Store.getBlock(blatt.id)]);
    if (!blob) return JSON.stringify({ ok: false });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    /* Zurücklesen — mit pdf.js, nicht mit einem eigenen Parser. */
    const lib = await PdfFremd.laden();
    const doc = await lib.getDocument({ data: bytes.slice() }).promise;
    const sPdf = await doc.getPage(1);
    const vp = sPdf.getViewport({ scale: 1 });
    const annots = await sPdf.getAnnotations();
    /* Und das Seitenbild, um nachzusehen, was IM Bild steht. */
    const leinwand = document.createElement('canvas');
    leinwand.width = Math.round(vp.width); leinwand.height = Math.round(vp.height);
    /* OHNE ANNOTATIONEN. pdf.js malt sie sonst von sich aus mit — und
       dann saehe dieses Bild genauso aus wie das gedruckte, und der
       Unterschied, um den es hier geht, waere unsichtbar. */
    await sPdf.render({ canvasContext: leinwand.getContext('2d'), viewport: vp,
                        annotationMode: 0 }).promise;
    const c = leinwand.getContext('2d');
    const farbeBei = (x, y) => {
      const d = c.getImageData(Math.round(x), Math.round(vp.height - y), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    /* DASSELBE NOCH EINMAL, ABER MIT ANNOTATIONEN. pdf.js malt die
       Erscheinungsbilder nur, wenn man es sagt: intent print. Der
       Unterschied zwischen beiden Bildern IST der Beweis — was im ersten
       fehlt und im zweiten steht, ist Annotation und nicht Bild. */
    const l2 = document.createElement('canvas');
    l2.width = leinwand.width; l2.height = leinwand.height;
    await sPdf.render({ canvasContext: l2.getContext('2d'), viewport: vp,
                        intent: 'print', annotationMode: 2 }).promise;
    const c2 = l2.getContext('2d');
    const mitAnnot = (x, y) => {
      const d = c2.getImageData(Math.round(x), Math.round(vp.height - y), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    return JSON.stringify({
      ok: true, bytes: bytes.length,
      seite: { breite: Math.round(vp.width), hoehe: Math.round(vp.height) },
      /* WIE pdf.js inkLists HERAUSGIBT, haengt an seiner Fassung: mal
         eine Liste von {x,y}, mal ein flaches Zahlenfeld. Beides wird hier
         auf Paare gebracht, statt eine der beiden Formen zu erraten. */
      annots: annots.map(a => {
        const paare = (l) => {
          const feld = Array.from(l || []);
          if (!feld.length) return [];
          if (typeof feld[0] === 'object') return feld.map(q => [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10]);
          const raus = [];
          for (let i = 0; i + 1 < feld.length; i += 2)
            raus.push([Math.round(feld[i] * 10) / 10, Math.round(feld[i + 1] * 10) / 10]);
          return raus;
        };
        return {
          typ: a.subtype, rect: (a.rect || []).map(v => Math.round(v * 10) / 10),
          listen: (a.inkLists || []).map(paare),
          farbe: a.color ? Array.from(a.color) : null,
          schluessel: Object.keys(a).join(','),
          inhalt: String((a.contentsObj && a.contentsObj.str) || a.contents || '')
        };
      }),
      /* Zwei Sonden ins gerenderte Bild, in Default-User-Space-Punkten. */
      probe: {
        beiStrich: farbeBei(120, 500),
        beiAbdeck: farbeBei(300, 200),
        leer: farbeBei(380, 40)
      },
      gedruckt: {
        beiStrich: mitAnnot(120, 500),
        beiMarker: mitAnnot(180, 393),
        leer: mitAnnot(380, 40)
      }
    });
  })()`) as string);
  await s.close();
  return raus;
};

const STRICH = { id: 'a', art: 'stift', stil: 'fueller', farbe: '#cc0000', breite: 3,
  pts: [[60, 80], [120, 100], [180, 96], [240, 120]],
  pressure: [0.3, 0.8, 0.9, 0.5] };
const MARKER = { id: 'b', art: 'marker', farbe: '#ffcc00', breite: 4,
  pts: [[60, 200], [300, 210]], pressure: [0.6, 0.6] };
const ABDECK = { id: 'c', art: 'abdeck', farbe: '#000000', breite: 2,
  pts: [[250, 380], [350, 430]] };
const TEXT = { id: 'd', art: 'text', farbe: '#0033aa', point: [60, 320], fontSize: 14,
  text: 'Notiz' };

/* ═══ §1–§3 Die Annotation ═════════════════════════════════════════════════ */
console.log('\n§1 Eine Handschrift ist eine echte /Ink-Annotation');
const r = await machen([STRICH, MARKER, ABDECK, TEXT]);
p('Das PDF ist entstanden und liess sich wieder öffnen', r.ok && r.bytes > 1000,
  JSON.stringify({ ok: r.ok, bytes: r.bytes }));
gleich('Die Seite misst 400 × 600', [r.seite.breite, r.seite.hoehe], [400, 600]);
gleich('Zwei Annotationen: der Stift und der Marker', r.annots.length, 2);
gleich('… beide vom Subtype Ink', r.annots.map((a: any) => a.typ), ['Ink', 'Ink']);
p('Der Stift trägt seine Farbe (204|0|0)',
  JSON.stringify(r.annots[0].farbe) === JSON.stringify([204, 0, 0]),
  JSON.stringify(r.annots[0].farbe));
p('… und sagt, was er ist', /Handschrift/.test(r.annots[0].inhalt), r.annots[0].inhalt);
p('Der Marker sagt es auch', /Marker/.test(r.annots[1].inhalt), r.annots[1].inhalt);

console.log('\n§2 Sie hat ein eigenes Aussehen — und es malt wirklich');
p('Mit Annotationen gedruckt steht der Stift da, und zwar rot',
  r.gedruckt.beiStrich[0] > 150 && r.gedruckt.beiStrich[1] < 120 && r.gedruckt.beiStrich[2] < 120,
  JSON.stringify(r.gedruckt.beiStrich));
p('… der Marker auch, gelb und durchscheinend',
  r.gedruckt.beiMarker[0] > 200 && r.gedruckt.beiMarker[1] > 180 && r.gedruckt.beiMarker[2] < 220,
  JSON.stringify(r.gedruckt.beiMarker));
p('… und die leere Ecke bleibt leer',
  r.gedruckt.leer.every((v: number) => v > 230), JSON.stringify(r.gedruckt.leer));

console.log('\n§3 Die Punkte stehen im Default User Space');
{
  const l = r.annots[0].listen;
  gleich('Ein Strich, vier Punkte', [l.length, l[0].length], [1, 4]);
  gleich('Der erste Punkt: aus Blatt (60|80) wird PDF (60|520)', l[0][0], [60, 520]);
  gleich('Der letzte: aus (240|120) wird (240|480)', l[0][3], [240, 480]);
  p('Alle y sind gross — der Strich liegt oben auf dem Blatt, also oben in der PDF',
    (l[0] as number[][]).every(q => q[1]! > 400), JSON.stringify(l[0]));
  const rect = r.annots[0].rect;
  p('Das /Rect umschliesst den Strich', rect[0] <= 60 && rect[1] <= 480
    && rect[2] >= 240 && rect[3] >= 520, JSON.stringify(rect));
}

/* ═══ §4/§5 Bild und Doppelung ═════════════════════════════════════════════ */
console.log('\n§4 Was nicht Annotation wird, bleibt im Bild');
p('Das Abdeckband steht im Bild — dunkel, wo es liegt',
  r.probe.beiAbdeck[0] < 100 && r.probe.beiAbdeck[1] < 100 && r.probe.beiAbdeck[2] < 100,
  JSON.stringify(r.probe.beiAbdeck));
p('Eine leere Ecke bleibt weiss',
  r.probe.leer.every((v: number) => v > 230), JSON.stringify(r.probe.leer));

console.log('\n§5 Nichts steht zweimal da');
p('Wo der Stift läuft, ist das BILD weiss — er ist nur noch Annotation',
  r.probe.beiStrich.every((v: number) => v > 230), JSON.stringify(r.probe.beiStrich));

/* ═══ §6 Die gedrehte Seite ════════════════════════════════════════════════ */
console.log('\n§6 Eine gedrehte Seite dreht ihre Annotationen mit');
{
  const d = await machen([STRICH], 90);
  gleich('Die Seite steht quer', [d.seite.breite, d.seite.hoehe], [600, 400]);
  gleich('Es ist weiterhin eine Ink-Annotation', d.annots.map((a: any) => a.typ), ['Ink']);
  const q = d.annots[0].listen[0];
  /* Blatt (60|80), Blatt 400×600, Drehung 90 im Uhrzeigersinn:
     dx = -140, dy = -220 → rx = 220, ry = -140 → Leinwand (520|60)
     → Default User Space (520 | 400-60 = 340). */
  gleich('Der erste Punkt wandert mit der Drehung auf (520|340)', q[0], [520, 340]);
  p('… und alle Punkte liegen in der Seite',
    (q as number[][]).every(w => w[0]! >= 0 && w[0]! <= 600 && w[1]! >= 0 && w[1]! <= 400),
    JSON.stringify(q));
}

/* ═══ §7 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§7 Quellen');
{
  const w = lies('src/core/export/pdfWriter.ts');
  const m = lies('src/bereiche/pdf/marken.ts');
  const geo = lies('src/core/ink/geometry.ts');
  p('Der Schreiber schreibt /Subtype /Ink mit /InkList und /AP',
    /\/Subtype \/Ink/.test(w) && /\/InkList/.test(w) && /\/AP << \/N /.test(w));
  p('… und setzt das Druck-Kennzeichen /F 4', /\/F 4/.test(w));
  p('… und die BBox des Aussehens ist das Rect der Annotation',
    /\/BBox \[' *\n?\s*\+ z\(x0\)/.test(w) || /BBox[\s\S]{0,120}z\(x0\)/.test(w));
  p('Die Breitenregel steht in `marken.ts`, nicht im Export (§8)',
    /alsAnnotation/.test(m) && /druckFaktor/.test(m)
    && !/druckFaktor/.test(lies('src/bereiche/pdf/document-mode.ts')));
  p('Die Kontur wird EINMAL gerechnet — `outline` und `outlinePunkte` teilen sie',
    /const seiten = \(raw: unknown, halfWidths/.test(geo)
    && /outlinePunkte/.test(geo));
  p('Das Abdeckband ist ausdrücklich KEINE Annotation', /abdeck/i.test(m)
    && /wegschieben|abgedeckt/.test(m));
  p('Das erzeugte JS trägt es', /\/Subtype \/Ink/.test(lies('quell/core/export/pdfWriter.js')));
  p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
