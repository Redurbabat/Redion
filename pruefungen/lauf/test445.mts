/* Suite 445 — Die kleinen GoodNotes-Reste: Dreieck erkennen, Bild aus der Ablage, mehrere PDFs, Rand-Vorschub (E472)
 * ============================================================================
 * Siebter Bogen aus Redurs Auftrag vom 7. September (E465). Vier Reste aus
 * `LUECKEN.md` L133, jeder klein, jeder täglich im Weg:
 *
 *   §1 DAS DREIECK WIRD ERKANNT. Wer ein Dreieck zieht und hält, bekommt
 *      eins — bisher kannte die Formerkennung nur Linie, Rechteck, Ellipse,
 *      obwohl es die Dreieck-Marke seit E465 gibt. Nur AUFRECHTE Dreiecke:
 *      die Marke ist gleichschenklig mit der Spitze oben und kann keine
 *      andere Lage beschreiben.
 *   §2 EIN BILD AUS DER ZWISCHENABLAGE wird eine Seite (Strg V).
 *   §3 MEHRERE PDFs AUF EINMAL — wer ein Semester einliest, hat selten eine
 *      Datei.
 *   §4 DER STREIFEN RÜCKT AM RAND MIT: wer im Zoom-Fenster bis an den
 *      rechten Rand schreibt, sieht die nächste Stelle ohne Knopfdruck.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `shapes.ts` die Dreieckprüfung überspringen: der Zug bleibt ein
 *        Strich. Gelaufen am 7. September, rot.
 *   §4 → in `lupeRandWeiter` die Randbedingung umdrehen: der Streifen rückt
 *        immer oder nie. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test445.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const InkShapes: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9565;
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

const pdfBytes = (name: string): Buffer => {
  const objs: string[] = [];
  objs.push('<< /Type /Pages /Count 1 /Kids [4 0 R] >>');
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const stream = `BT /F1 24 Tf 50 770 Td (${name}) Tj ET\n`;
  objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 3 0 R >>');
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};

const browser = await chromium.launch();
const fehler: string[] = [];
const s: Page = await browser.newPage({ viewport: { width: 1360, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof InkShapes !== 'undefined' && typeof DocumentMode !== 'undefined'");
const seiteId = await s.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  Store.setMeta('zeichnen:formen', true);
  const seite = Store.addPage(null, { text: 'Formen und Reste', icon: '📕' });
  const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko',
    blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
  Store.addBlock(b.id, 'text', { text: '' });
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1300));
  document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click();
  await new Promise(r => setTimeout(r, 300));
  document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
  await new Promise(r => setTimeout(r, 300));
  return seite.id as string;
});

/* ═══ §1 Das Dreieck ═══════════════════════════════════════════════════════ */
console.log('\n§1 Das Dreieck wird erkannt');
{
  const formen = await s.evaluate(() => {
    /* Drei Züge, jeder von Hand gezogen gedacht: ein aufrechtes Dreieck,
       dasselbe auf dem Kopf, und ein Kreis (der bleibt eine Ellipse). */
    const kante = (a: number[], b: number[], n: number): number[][] => {
      const aus: number[][] = [];
      for (let i = 0; i < n; i++) aus.push([a[0]! + (b[0]! - a[0]!) * i / n + (i % 2 ? 0.6 : -0.6),
                                            a[1]! + (b[1]! - a[1]!) * i / n + (i % 3 ? 0.5 : -0.5)]);
      return aus;
    };
    const dreieck = (spitzeOben: boolean): number[][] => {
      const A = spitzeOben ? [150, 60] : [50, 60];
      const B = spitzeOben ? [250, 260] : [250, 60];
      const C = spitzeOben ? [50, 260] : [150, 260];
      return [...kante(A, B, 16), ...kante(B, C, 16), ...kante(C, A, 16), [A[0]!, A[1]!]];
    };
    const kreis: number[][] = [];
    for (let i = 0; i <= 40; i++) kreis.push([150 + Math.cos(i / 40 * 2 * Math.PI) * 90, 160 + Math.sin(i / 40 * 2 * Math.PI) * 90]);
    const rechteck = [...kante([60, 60], [260, 60], 12), ...kante([260, 60], [260, 240], 12),
                      ...kante([260, 240], [60, 240], 12), ...kante([60, 240], [60, 60], 12), [60, 60]];
    return {
      auf: InkShapes.recognize(dreieck(true)),
      um: InkShapes.recognize(dreieck(false)),
      kreis: InkShapes.recognize(kreis),
      rechteck: InkShapes.recognize(rechteck)
    };
  });
  p('Ein aufrechtes Dreieck wird ein Dreieck, mit dem Kasten seines Zugs',
    formen.auf?.art === 'triangle' && Math.abs(formen.auf.pts[0][0] - 50) < 6 && Math.abs(formen.auf.pts[1][1] - 260) < 6,
    JSON.stringify(formen.auf));
  /* BIS E478 STAND HIER: „Ein Dreieck auf dem Kopf bleibt ein Strich — die
     Marke kann es nicht (L133)." Sie kann es seit E478: `dreh` steht an
     jeder Marke (E466) und die Geometrie rechnet damit (E474), also
     bekommt ein gedrehtes Dreieck seinen Winkel statt einer Absage. Die
     Zeile ist nicht gestrichen, sondern umgedreht — wer sie sucht, soll
     finden, warum sie sich geändert hat. */
  p('Ein Dreieck auf dem Kopf wird ein Dreieck mit dreh ≈ 180 (E478)',
    formen.um?.art === 'triangle' && Math.abs(Math.abs(formen.um.dreh) - 180) < 6,
    JSON.stringify(formen.um));
  gleich('Ein Kreis bleibt eine Ellipse', formen.kreis?.art, 'ellipse');
  gleich('Ein Rechteck bleibt ein Rechteck', formen.rechteck?.art, 'rectangle');
  /* Und einmal der ganze Weg: auf dem Blatt gezogen und gehalten. */
  await s.evaluate(async () => {
    const f = document.querySelector<SVGSVGElement>('.document-stage[data-aktiv] svg.blatt-marken')!;
    document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-wz="stift"]')?.click();
    const ctm = f.getScreenCTM()!;
    const punkt = (x: number, y: number): { x: number; y: number } => {
      const pt = f.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(ctm);
    };
    const ev = (typ: string, x: number, y: number, tasten: number): PointerEvent => {
      const c = punkt(x, y);
      return new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
        pointerId: 21, pointerType: 'mouse', isPrimary: true, button: 0, buttons: tasten, pressure: 0.5 });
    };
    const bahn: number[][] = [];
    const kante = (a: number[], b: number[], n: number): void => {
      for (let i = 0; i < n; i++) bahn.push([a[0]! + (b[0]! - a[0]!) * i / n, a[1]! + (b[1]! - a[1]!) * i / n]);
    };
    kante([300, 400], [400, 560], 14); kante([400, 560], [200, 560], 14); kante([200, 560], [300, 400], 14);
    bahn.push([300, 400]);
    f.dispatchEvent(ev('pointerdown', bahn[0]![0]!, bahn[0]![1]!, 1));
    for (const q of bahn.slice(1)) f.dispatchEvent(ev('pointermove', q[0]!, q[1]!, 1));
    /* HALTEN: erst nach 450 ms (E355) wird aus dem Zug eine Form. */
    await new Promise(r => setTimeout(r, 700));
    f.dispatchEvent(ev('pointerup', 300, 400, 0));
    await new Promise(r => setTimeout(r, 400));
  });
  const marken = await s.evaluate((id: string) =>
    (DocumentMode.documentsIn(Store.getBlock(id))[0]?.marken || []).map((m: any) => m.art), seiteId);
  gleich('Auf dem Blatt gezogen und gehalten: ein Dreieck', marken, ['triangle']);
}

/* ═══ §2 Bild aus der Zwischenablage ═══════════════════════════════════════ */
console.log('\n§2 Ein Bild aus der Zwischenablage wird eine Seite');
{
  const vorher = await s.evaluate((id: string) => DocumentMode.documentsIn(Store.getBlock(id)).length, seiteId);
  await s.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 240; c.height = 160;
    const g = c.getContext('2d')!; g.fillStyle = '#2f7ed8'; g.fillRect(0, 0, 240, 160);
    const blob: Blob = await new Promise(f => c.toBlob(b => f(b as Blob), 'image/png'));
    const datei = new File([blob], 'ablage.png', { type: 'image/png' });
    const daten = new DataTransfer();
    daten.items.add(datei);
    document.querySelector<HTMLElement>('.document-workspace')!
      .dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: daten }));
    await new Promise(r => setTimeout(r, 1500));
  });
  const jetzt = await s.evaluate((id: string) => DocumentMode.documentsIn(Store.getBlock(id))
    .map((b: any) => b.herkunft === 'bild' ? 'bild:' + b.bildName : b.type), seiteId);
  p('Strg V mit einem Bild legt eine Bildseite an', jetzt.length === vorher + 1 && jetzt.includes('bild:ablage.png'), JSON.stringify(jetzt));
  /* Text in der Ablage geht weiter dorthin, wo der Fokus steht. */
  await s.evaluate(async () => {
    const daten = new DataTransfer();
    daten.setData('text/plain', 'nur Text');
    document.querySelector<HTMLElement>('.document-workspace')!
      .dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: daten }));
    await new Promise(r => setTimeout(r, 600));
  });
  gleich('Text in der Ablage legt keine Seite an', await s.evaluate((id: string) =>
    DocumentMode.documentsIn(Store.getBlock(id)).length, seiteId), vorher + 1);
}

/* ═══ §3 Mehrere PDFs auf einmal ═══════════════════════════════════════════ */
console.log('\n§3 Mehrere PDFs auf einmal');
{
  p('Der Wähler nimmt mehrere Dateien', /input\.multiple = true/.test(lies('src/bereiche/pdf/einlesen.ts')));
  const vorher = await s.evaluate((id: string) => DocumentMode.documentsIn(Store.getBlock(id)).length, seiteId);
  const waehler = s.waitForEvent('filechooser');
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-inspector [data-document-action="import"]')?.click(); });
  const chooser = await waehler;
  p('… und er ist auf „mehrere" gestellt', chooser.isMultiple());
  await chooser.setFiles([
    { name: 'Skript A.pdf', mimeType: 'application/pdf', buffer: pdfBytes('Skript A') },
    { name: 'Skript B.pdf', mimeType: 'application/pdf', buffer: pdfBytes('Skript B') }
  ]);
  /* Die erste Datei fragt nach der Anordnung, die zweite folgt ihr. */
  await s.waitForSelector('.overlay .fh', { timeout: 8000 }).catch(() => {});
  await s.evaluate(() => {
    const knopf = [...document.querySelectorAll<HTMLElement>('.overlay button')]
      .find(b => /untereinander|Nur die Seiten|nur die seiten/i.test(b.textContent || ''));
    (knopf || document.querySelector<HTMLElement>('.overlay button'))?.click();
  });
  await s.waitForTimeout(6000);
  const jetzt = await s.evaluate((id: string) => DocumentMode.documentsIn(Store.getBlock(id)).length, seiteId);
  const anhaenge = await s.evaluate((id: string) => Store.childrenOf(id).filter((b: any) => b.type === 'file').map((b: any) => b.text), seiteId);
  p('Beide PDFs sind eingelesen — zwei Seiten mehr', jetzt === vorher + 2, JSON.stringify([vorher, jetzt]));
  p('… und beide Originale liegen als Anhang oben', anhaenge.includes('Skript A.pdf') && anhaenge.includes('Skript B.pdf'), JSON.stringify(anhaenge));
  p('Es wurde nur EINMAL nach der Anordnung gefragt', await s.evaluate(() => document.querySelectorAll('.overlay').length) === 0);
}

/* ═══ §4 Der Streifen rückt am Rand mit ════════════════════════════════════ */
console.log('\n§4 Der Streifen rückt am Rand mit');
{
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-thumbnails [data-document-index="0"]')?.click(); });
  await s.waitForTimeout(500);
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-inspector [data-document-action="lupe"]')?.click(); });
  await s.waitForTimeout(700);
  const rahmen = () => s.evaluate(() => parseFloat(document.querySelector<HTMLElement>('.document-lupe-rahmen')?.style.left || '-1'));
  const a = await rahmen();
  /* Ein Strich, der IN DER MITTE endet: der Streifen bleibt stehen. */
  await s.evaluate(async () => {
    const f = document.querySelector<HTMLElement>('.document-lupe-fenster')!;
    const flaeche = f.querySelector<SVGElement>('svg.blatt-marken')!;
    const r = f.getBoundingClientRect();
    const ev = (typ: string, x: number, y: number, t: number) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: x, clientY: y, pointerId: 31, pointerType: 'mouse', isPrimary: true, button: 0, buttons: t, pressure: 0.5 });
    flaeche.dispatchEvent(ev('pointerdown', r.left + 60, r.top + 60, 1));
    flaeche.dispatchEvent(ev('pointermove', r.left + r.width * 0.4, r.top + 70, 1));
    flaeche.dispatchEvent(ev('pointerup', r.left + r.width * 0.4, r.top + 70, 0));
    await new Promise(x => setTimeout(x, 400));
  });
  const b = await rahmen();
  gleich('Ein Strich, der in der Mitte endet, rückt nichts', b, a);
  /* Und einer, der am rechten Rand endet: der Streifen geht weiter. */
  await s.evaluate(async () => {
    const f = document.querySelector<HTMLElement>('.document-lupe-fenster')!;
    const flaeche = f.querySelector<SVGElement>('svg.blatt-marken')!;
    const r = f.getBoundingClientRect();
    const ev = (typ: string, x: number, y: number, t: number) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: x, clientY: y, pointerId: 32, pointerType: 'mouse', isPrimary: true, button: 0, buttons: t, pressure: 0.5 });
    flaeche.dispatchEvent(ev('pointerdown', r.left + r.width * 0.5, r.top + 90, 1));
    flaeche.dispatchEvent(ev('pointermove', r.right - 12, r.top + 95, 1));
    flaeche.dispatchEvent(ev('pointerup', r.right - 12, r.top + 95, 0));
    await new Promise(x => setTimeout(x, 500));
  });
  const c = await rahmen();
  p('Ein Strich bis an den rechten Rand rückt den Streifen weiter', c > b + 1, JSON.stringify([a, b, c]));
  /* Mit der Hand (kein Zeichenwerkzeug) rückt nichts. */
  await s.evaluate(async () => {
    /* DIE LEISTE BLEIBT IN DER BÜHNE (E470): nur das Papier zieht in den
       Streifen um, die Werkzeugleiste gehört zur Hülle und schwebt im
       Studio ohnehin unten. Sie wird deshalb dort gesucht, wo sie ist. */
    document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-wz="schreiben"]')?.click();
    const f = document.querySelector<HTMLElement>('.document-lupe-fenster')!;
    const flaeche = f.querySelector<SVGElement>('svg.blatt-marken')!;
    const r = f.getBoundingClientRect();
    flaeche.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true,
      clientX: r.right - 10, clientY: r.top + 100, pointerId: 33, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 0 }));
    await new Promise(x => setTimeout(x, 300));
  });
  gleich('Mit der Hand rückt nichts — nur ein Strich zählt', await rahmen(), c);
}
await s.close();

/* ═══ §5 Eingebunden ═══════════════════════════════════════════════════════ */
console.log('\n§5 Eingebunden');
{
  p('Die Formerkennung kennt das Dreieck', /'triangle'/.test(lies('src/core/ink/shapes.ts')) && /aufrecht/.test(lies('src/core/ink/shapes.ts')));
  p('Das Studio hört auf die Zwischenablage', /addEventListener\('paste'/.test(lies('src/bereiche/pdf/document-mode.ts')));
  p('Der Streifen hat seinen Rand-Vorschub', /function lupeRandWeiter/.test(lies('src/bereiche/pdf/document-mode.ts')));
}

console.log('\n§6 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
