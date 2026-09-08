/* Suite 442 — Import und Export wie GoodNotes: Bilder als Seiten, PDF an einer Stelle, Seite als Bild, Zoom-Fenster (E469)
 * ============================================================================
 * Fünfter und letzter Bogen aus Redurs Auftrag vom 7. September (E465).
 *
 *   §1 BILDER ALS SEITEN: PNG/JPG werden `pdfseite`-Blöcke ohne Quelle,
 *      A4-breit, so hoch wie das Bild; grosse Bilder werden auf 2480 px
 *      gebracht; das Bild ist Nutzerdaten (nicht abgeleitet).
 *   §2 PDF AN EINER STELLE: `anStelle` fügt die Seiten hinter der Seite ein,
 *      die man ansieht — untereinander, ohne Rückfrage.
 *   §3 SEITE ALS BILD: Papier, Seitenbild und Marken als PNG, doppelt so
 *      gross wie Blattpunkte; gedreht, wie die Seite steht.
 *   §4 ZOOM-FENSTER: der Schalter im Inspector macht es auf und zu. Was es
 *      kann, hält seit E470 `test443` fest — dort zieht das Papier in den
 *      Streifen um, hier steht nur der Weg dorthin.
 *   §5 RECHTE: gesperrt lässt nur das Sichern zu.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `bilderAlsSeiten` die Höhe fest auf A4: das Querbild wird
 *        hochkant. Gelaufen am 7. September, rot.
 *   §2 → in `alsSeiten` die Stelle ignorieren (immer −1): die Seiten
 *        landen am Ende. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test442.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const PdfEinlesen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9562;
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

/* Eine kleine PDF mit zwei Seiten, von Hand (wie test437). */
const pdfBytes = (): Buffer => {
  const objs: string[] = [];
  objs.push('<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>');
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  for (let n = 1; n <= 2; n++) {
    const s = `BT /F1 24 Tf 50 770 Td (Eingefuegt ${n}) Tj ET\n`;
    objs.push(`<< /Length ${Buffer.byteLength(s)} >>\nstream\n${s}endstream`);
    objs.push(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents ${objs.length} 0 R >>`);
  }
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};
const PDF64 = pdfBytes().toString('base64');

const browser = await chromium.launch();
const fehler: string[] = [];
const s: Page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined' && typeof PdfEinlesen !== 'undefined'");
await s.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});
const reihe = (id: string) => s.evaluate((id: string) =>
  DocumentMode.documentsIn(Store.getBlock(id)).map((b: any) => b.type === 'pdfseite' ? (b.herkunft === 'bild' ? 'bild' : 'pdf') + ':' + b.nr + (b.quelleId ? '@' + String(b.quelleId).slice(0, 2) : '') : b.type), id);

/* ═══ §1 Bilder als Seiten ═════════════════════════════════════════════════ */
console.log('\n§1 Bilder als Seiten');
const seiteId = await s.evaluate(async () => {
  const seite = Store.addPage(null, { text: 'Skizzenheft', icon: '📕' });
  Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842, quelleId: 'q1', raumVersion: 1 });
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1200));
  return seite.id as string;
});
{
  const r = await s.evaluate(async (id: string) => {
    const png = async (w: number, h: number, farbe: string, name: string): Promise<File> => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d')!; g.fillStyle = farbe; g.fillRect(0, 0, w, h);
      const blob: Blob = await new Promise(f => c.toBlob(b => f(b as Blob), 'image/png'));
      return new File([blob], name, { type: 'image/png' });
    };
    const dateien = [await png(300, 200, '#d64545', 'quer.png'), await png(200, 300, '#2f7ed8', 'hoch.png'), await png(3000, 1000, '#3aa757', 'riesig.png')];
    const ids = await PdfEinlesen.bilderAlsSeiten(dateien, id, { elternId: id, index: 1 });
    const bloecke = ids.map((x: string) => Store.getBlock(x));
    const saetze = await Promise.all(bloecke.map((b: any) => Store.dateiHolen(b.bildDateiId)));
    return { ids, bloecke: bloecke.map((b: any) => ({ type: b.type, herkunft: b.herkunft, bw: b.bw, bh: b.bh, nr: b.nr, von: b.vonSeiten, name: b.bildName, breite: b.bildBreite, quelle: b.quelleId, label: DocumentMode.sourceLabel(b) })),
      saetze: saetze.map((x: any, i: number) => ({ da: !!x, block: x?.blockId === ids[i], abgeleitet: x?.abgeleitet, typ: x?.typ, groesse: x?.groesse })) };
  }, seiteId);
  gleich('Drei Bilder wurden drei Seiten hinter Seite 1', await reihe(seiteId), ['pdf:1@q1', 'bild:1', 'bild:2', 'bild:3']);
  const [q, h, g] = r.bloecke;
  p('Das Querbild: A4-breit, 396,85 hoch (595,28 × 200/300), ohne Quelle, Herkunft „bild"',
    q.bw === 595.28 && Math.abs(q.bh - 396.85) < 0.02 && q.herkunft === 'bild' && !q.quelle && q.name === 'quer.png', JSON.stringify(q));
  p('Das Hochbild: 892,92 hoch', Math.abs(h.bh - 892.92) < 0.02, JSON.stringify(h));
  p('Das Riesenbild wurde auf 2480 px gebracht — als WebP', g.breite === 2480 && r.saetze[2]?.typ === 'image/webp', JSON.stringify([g.breite, r.saetze[2]]));
  p('Die Bilder hängen an ihren Blöcken und sind KEINE abgeleiteten Dateien (sie kommen in die Sicherung)',
    r.saetze.every((x: any) => x.da && x.block && x.abgeleitet === false), JSON.stringify(r.saetze));
  gleich('Die Beschriftung sagt „Bild · Name"', [q.label, h.label], ['Bild · quer.png', 'Bild · hoch.png']);
  await s.evaluate(async () => { App.zeichneSeite(); await new Promise(r => setTimeout(r, 900)); });
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-thumbnails [data-document-index="1"]')?.click(); });
  await s.waitForTimeout(900);
  const bild = await s.evaluate(() => {
    const st = document.querySelector<HTMLElement>('.document-stage[data-stand-nr="1"]');
    const img = st?.querySelector<HTMLImageElement>('.blatt-papier img');
    const papier = st?.querySelector<HTMLElement>('.blatt-papier');
    const r = papier?.getBoundingClientRect();
    return { img: !!img && img.src.startsWith('blob:'), quer: !!r && r.width > r.height * 1.3, mini: document.querySelector('.document-thumbnails [data-document-index="1"] .document-thumbnail-label')?.textContent };
  });
  p('Die Bildseite zeigt ihr Bild und steht quer; die Miniatur heisst „Bild · quer.png"', bild.img && bild.quer && bild.mini === 'Bild · quer.png', JSON.stringify(bild));
  /* DIE KOPIE EINER BILDSEITE BLEIBT NUTZERDATEI (E471). Eine PDF-Seite darf
     ihr Bild aus der Quelle zurückholen, eine Bildseite hat keine Quelle —
     mit `abgeleitet: true` wäre die Kopie nach dem Einspielen leer (§11). */
  const kopie = await s.evaluate(async () => {
    const stelle = document.querySelector<HTMLElement>('.document-inspector [data-document-action="page-duplicate"]');
    stelle?.click();
    await new Promise(r => setTimeout(r, 1200));
    const b = DocumentMode.documentsIn(Store.getBlock(App.aktuelleSeite())).find((x: any, i: number) => x.herkunft === 'bild' && i > 1);
    const satz = b?.bildDateiId ? await Store.dateiHolen(b.bildDateiId) : null;
    return { da: !!b, abgeleitet: satz?.abgeleitet, eigen: !!satz && satz.blockId === b.id };
  });
  p('Eine verdoppelte Bildseite behält ihr Bild als Nutzerdatei, nicht als abgeleitetes',
    kopie.da && kopie.abgeleitet === false && kopie.eigen, JSON.stringify(kopie));
}

/* ═══ §2 PDF an einer Stelle ═══════════════════════════════════════════════ */
console.log('\n§2 PDF an einer Stelle');
{
  await s.evaluate(async ([id, b64]: [string, string]) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    await PdfEinlesen.alsSeiten(new File([bytes], 'zusatz.pdf', { type: 'application/pdf' }), id, { anStelle: { elternId: id, index: 1 }, ueberGrenze: 'alle' });
    await Store.flush();
  }, [seiteId, PDF64] as [string, string]);
  const r = await reihe(seiteId);
  /* SIEBEN, NICHT SECHS: §1 hat die erste Bildseite verdoppelt (der
     Prüfpunkt für E471), also stehen vier Bildseiten dahinter. */
  p('Die zwei Seiten stehen hinter Seite 1, vor den Bildern, mit eigener Quelle',
    r.length === 7 && r[0] === 'pdf:1@q1' && r[1]!.startsWith('pdf:1@') && r[2]!.startsWith('pdf:2@') && r[1] !== 'pdf:1@q1' && r[3]!.startsWith('bild:'), JSON.stringify(r));
  const merk = await s.evaluate(() => ({ regel: Store.getMeta('pdfAnordnung'), overlays: document.querySelectorAll('.overlay').length }));
  p('Untereinander, ohne Rückfrage — die Merkregel blieb unberührt', (merk.regel === undefined || merk.regel === null) && merk.overlays === 0, JSON.stringify(merk));
  p('Das Original liegt als Anhang oben auf der Seite', await s.evaluate((id: string) => { const c = Store.getBlock(id).content.map((x: string) => Store.getBlock(x)); return c[0]?.type === 'file' && c[0]?.original === true; }, seiteId));
}

/* ═══ §3 Seite als Bild ════════════════════════════════════════════════════ */
console.log('\n§3 Seite als Bild');
{
  const r = await s.evaluate(async (id: string) => {
    const messen = async (blob: Blob | null, punkte: [number, number][]): Promise<any> => {
      if (!blob) return { blob: false };
      const bmp = await createImageBitmap(blob);
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      const g = c.getContext('2d')!; g.drawImage(bmp, 0, 0);
      const farben = punkte.map(([x, y]) => Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 3));
      return { blob: true, typ: blob.type, w: bmp.width, h: bmp.height, farben };
    };
    const blatt = { type: 'blatt', blattBreite: 595.28, blattHoehe: 841.89, marken: [{ id: 'r1', art: 'rectangle', farbe: '#d64545', breite: 6, pts: [[100, 200], [300, 300]] }] };
    const aufrecht = await messen(await DocumentMode.seiteAlsBild(blatt), [[200, 500], [400, 500]]);
    const gedreht = await messen(await DocumentMode.seiteAlsBild({ ...blatt, gedreht: 90 }), [[1683 - 500, 200]]);
    const bildSeite = DocumentMode.documentsIn(Store.getBlock(id)).find((b: any) => b.herkunft === 'bild');
    const mitBild = await messen(await DocumentMode.seiteAlsBild(bildSeite), [[600, 400]]);
    return { aufrecht, gedreht, mitBild };
  }, seiteId);
  p('Ein Blatt wird ein PNG von 1191 × 1684', r.aufrecht.blob && r.aufrecht.typ === 'image/png' && r.aufrecht.w === 1191 && r.aufrecht.h === 1684, JSON.stringify(r.aufrecht));
  const [kante, innen] = r.aufrecht.farben as number[][];
  p('… der rote Rahmen steht an seiner Kante, innen ist es weiss', !!kante && kante[0]! > 150 && kante[1]! < 120 && !!innen && innen.every((v: number) => v > 240), JSON.stringify(r.aufrecht.farben));
  p('Um 90° gedreht ist es 1684 × 1191, die Kante gedreht mit', r.gedreht.w === 1684 && r.gedreht.h === 1191 && r.gedreht.farben[0][0] > 150 && r.gedreht.farben[0][1] < 120, JSON.stringify(r.gedreht));
  p('Eine Bildseite nimmt ihr Bild mit (rot, 1191 × 794)', r.mitBild.w === 1191 && r.mitBild.h === 794 && r.mitBild.farben[0][0] > 150 && r.mitBild.farben[0][2] < 120, JSON.stringify(r.mitBild));
  const knopf = await s.evaluate(() => { document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click(); return new Promise(r => setTimeout(r, 300)).then(() => [...document.querySelectorAll('.document-seite-knoepfe button')].map(b => (b as HTMLElement).dataset.documentAction)); });
  gleich('Das Seitenmenü hat jetzt dreizehn Griffe (Kamera E482, anderes Dokument E496, zerlegen E499)', knopf, ['page-add', 'page-duplicate', 'page-rotate', 'page-up', 'page-down', 'page-bookmark', 'page-delete', 'page-add-image', 'page-add-camera', 'page-add-pdf', 'page-export-image', 'page-to-doc', 'page-split']);
}

/* ═══ §4 Zoom-Fenster ══════════════════════════════════════════════════════ */
console.log('\n§4 Zoom-Fenster');
{
  /* SEIT E470 IST ES DER STREIFEN, in den man schreibt — das Papier zieht
     um, in der Bühne bleibt ein Abbild. Was es kann, hält `test443` fest;
     hier bleibt nur der Weg, der zu G5 gehört: der Schalter im Inspector
     macht es auf und wieder zu. Die alten Punkte (Seite auf 250 %, das
     Band in der kleinen Übersicht) prüften einen Bau, den es nicht mehr
     gibt — sie stehen jetzt als das da, was sie meinten. */
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-thumbnails [data-document-index="0"]')?.click(); });
  await s.waitForTimeout(400);
  const lage = () => s.evaluate(() => ({
    an: document.querySelector<HTMLElement>('.document-workspace')?.dataset.lupe,
    panel: !!document.querySelector('.document-lupe'),
    fenster: !!document.querySelector('.document-lupe-fenster'),
    abbild: !!document.querySelector('.blatt-abbild'),
    knopf: document.querySelector('.document-lupe-knopf')?.getAttribute('aria-pressed')
  }));
  await s.click('.document-inspector [data-document-action="lupe"]');
  await s.waitForTimeout(600);
  let l = await lage();
  p('Der Schalter im Inspector öffnet das Zoom-Fenster', l.an === 'an' && l.panel && l.fenster && l.abbild && l.knopf === 'true', JSON.stringify(l));
  await s.click('.document-lupe [data-document-action="lupe-zu"]');
  await s.waitForTimeout(400);
  l = await lage();
  p('✕ schliesst es wieder, ohne Reste', l.an === 'aus' && !l.panel && !l.abbild && l.knopf === 'false', JSON.stringify(l));
  await s.click('.document-inspector [data-document-action="lupe"]');
  await s.waitForTimeout(400);
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-center')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  await s.waitForTimeout(300);
  gleich('Escape schliesst es auch', (await lage()).panel, false);
}

/* ═══ §5 Rechte ════════════════════════════════════════════════════════════ */
console.log('\n§5 Rechte');
{
  await s.evaluate(async (id: string) => { Store.updateBlock(id, { gesperrt: true }); await Store.flush(); App.oeffne(id); await new Promise(r => setTimeout(r, 900)); document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click(); await new Promise(r => setTimeout(r, 300)); }, seiteId);
  const r = await s.evaluate(() => ['page-add-image', 'page-add-pdf', 'page-export-image'].map(a => (document.querySelector('.document-inspector [data-document-action="' + a + '"]') as HTMLButtonElement)?.disabled));
  gleich('Gesperrt: Bild und PDF einfügen aus, Sichern an', r, [true, true, false]);
}
await s.close();

/* ═══ §6 Eingebunden ═══════════════════════════════════════════════════════ */
console.log('\n§6 Eingebunden');
{
  p('Der Import kennt anStelle und Bilder als Seiten', /anStelle\?: \{ elternId: string; index: number \}/.test(lies('src/bereiche/pdf/einlesen.ts')) && /bilderAlsSeiten, bilderWaehlen/.test(lies('src/bereiche/pdf/einlesen.ts')));
  /* Die Ausfuhr trägt seit E473 auch `freigeben` — geprüft wird der Name,
     nicht seine Stelle in der Zeile. */
  p('Das Studio kennt Seite als Bild und das Zoom-Fenster', /seiteAlsBild[,\s}]/.test(lies('src/bereiche/pdf/document-mode.ts')) && /const lupeSetzen/.test(lies('src/bereiche/pdf/document-mode.ts')));
  p('Das Stilblatt kennt den Streifen', /\.document-lupe\{/.test(lies('quell/schale/stil/bausteine.css')) && /\.document-lupe-fenster\{/.test(lies('quell/schale/stil/bausteine.css')));
}

console.log('\n§7 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
