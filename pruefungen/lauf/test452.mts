/* Suite 452 — „Seite als Bild" nimmt die Fotos mit (E479, L133)
 * ============================================================================
 * Ein Foto auf der Seite fehlte auf dem gesicherten PNG. Zwei Gründe, beide
 * GEMESSEN und nicht geraten:
 *
 *   1. `zeichneMarke` setzt das `<image>` erst nach, wenn die Adresse aus
 *      der Ablage da ist — `outerHTML` gleich danach hat den Platzhalter.
 *   2. Und selbst mit Adresse hilft es nicht: ein SVG, das über ein `<img>`
 *      auf die Leinwand kommt, darf NICHTS nachladen. Eine `blob:`-Adresse
 *      bleibt darin leer.
 *
 * Was geht, ist `data:`. Was NICHT geht, ist `foreignObject` (womit der
 * getippte Text eines Blatts käme): es zeichnet zwar, TRÜBT aber die
 * Leinwand — danach schlägt `toBlob` fehl und das Sichern ginge gar nicht
 * mehr. Diese drei Messungen stehen in §1, damit niemand sie ein zweites
 * Mal machen muss und damit auffällt, wenn ein Browser sie ändert.
 *
 *   §1 DIE DREI MESSUNGEN am Browser selbst.
 *   §2 EIN FOTO auf der Seite steht im gesicherten Bild — Pixel gemessen.
 *   §3 … auch ein gedrehtes, und an der richtigen Stelle.
 *   §4 UND DER REST BLEIBT: Seitenbild und Striche kommen weiter mit.
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2, §3 → `alsBildMarke` immer null: das Foto fehlt wieder. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test452.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const Dateien: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9572;
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
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined' && typeof Dateien !== 'undefined'");

/* ═══ §1 Die drei Messungen ════════════════════════════════════════════════ */
console.log('\n§1 Was ein SVG auf der Leinwand darf');
{
  const m = await s.evaluate(async () => {
    const laden = (u: string) => new Promise<HTMLImageElement>((f, x) => {
      const i = new Image(); i.onload = () => f(i); i.onerror = () => x(new Error('load')); i.src = u;
    });
    const c = document.createElement('canvas'); c.width = 20; c.height = 20;
    const g = c.getContext('2d')!; g.fillStyle = '#ff0000'; g.fillRect(0, 0, 20, 20);
    const roh: Blob = await new Promise(f => c.toBlob(b => f(b!), 'image/png'));
    const blobUrl = URL.createObjectURL(roh);
    const datenUrl = c.toDataURL('image/png');
    const probe = async (href: string) => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
        '<rect width="40" height="40" fill="#ffffff"/>' +
        '<image href="' + href + '" x="10" y="10" width="20" height="20"/></svg>';
      const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      try {
        const bild = await laden(u);
        const c2 = document.createElement('canvas'); c2.width = 40; c2.height = 40;
        const g2 = c2.getContext('2d')!; g2.drawImage(bild, 0, 0);
        const px = g2.getImageData(20, 20, 1, 1).data;
        let getruebt = false;
        try { c2.toDataURL(); } catch { getruebt = true; }
        return { rot: px[0]! > 200 && px[1]! < 80 && px[2]! < 80, getruebt };
      } catch { return { rot: false, getruebt: false, fehler: true }; }
      finally { URL.revokeObjectURL(u); }
    };
    const fo = async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30">' +
        '<foreignObject x="0" y="0" width="60" height="30">' +
        '<div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject></svg>';
      const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      try {
        const bild = await laden(u);
        const c2 = document.createElement('canvas'); c2.width = 60; c2.height = 30;
        c2.getContext('2d')!.drawImage(bild, 0, 0);
        try { c2.toDataURL(); return { getruebt: false }; } catch { return { getruebt: true }; }
      } catch { return { getruebt: false, fehler: true }; }
      finally { URL.revokeObjectURL(u); }
    };
    URL.revokeObjectURL(blobUrl);
    return { blob: await probe(blobUrl), daten: await probe(datenUrl), fremd: await fo() };
  });
  /* NUR DIE TRAGENDE MESSUNG WIRD BEHAUPTET. Die zwei anderen werden
     gezeigt: geht `blob:` eines Tages doch, ist der Umweg überflüssig,
     aber nichts kaputt — dafür soll kein Prüflauf rot werden. */
  p('`data:` im SVG kommt auf der Leinwand an — darauf ruht die Lösung',
    m.daten.rot === true, JSON.stringify(m.daten));
  p('… und trübt die Leinwand nicht (sonst schlüge das Sichern fehl)',
    m.daten.getruebt === false, JSON.stringify(m.daten));
  console.log('     gemessen · blob: im SVG kommt an: ' + m.blob.rot +
              ' · foreignObject trübt: ' + m.fremd.getruebt);
}

/* ═══ Ein Dokument mit einem echten Foto ═══════════════════════════════════ */
const bauen = (dreh: number | null) => s.evaluate(async (dreh: number | null) => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const alt = (window as any).__seite;
  if (alt) Store.trashBlock(alt);
  /* Ein grünes Quadrat als echte Datei in der Ablage. */
  const c = document.createElement('canvas'); c.width = 40; c.height = 40;
  const g = c.getContext('2d')!; g.fillStyle = '#00c000'; g.fillRect(0, 0, 40, 40);
  const roh: Blob = await new Promise(f => c.toBlob(b => f(b!), 'image/png'));
  const seite = Store.addPage(null, { text: 'Bildblatt' });
  const satz = await Dateien.ablegen(new File([roh], 'gruen.png', { type: 'image/png' }), {});
  const marke: any = { id: 'foto', art: 'bild', dateiId: satz.id, pts: [[100, 100], [300, 300]] };
  if (dreh !== null) marke.dreh = dreh;
  const blatt = Store.addBlock(seite.id, 'blatt', {
    text: '', blattBreite: 400, blattHoehe: 600, raumVersion: 1,
    marken: [marke, { id: 'strich', art: 'line', farbe: '#0000ff', breite: 8, pts: [[40, 520], [360, 520]] }] });
  Store.updateBlock(seite.id, { dokumentModus: true });
  (window as any).__seite = seite.id;
  (window as any).__blatt = blatt.id;
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1400));
  return blatt.id as string;
}, dreh);

/** Das gesicherte PNG einlesen und an ein paar Stellen die Farbe messen. */
const farben = (stellen: number[][]) => s.evaluate(async (stellen: number[][]) => {
  const block = Store.getBlock((window as any).__blatt);
  const blob = await DocumentMode.seiteAlsBild(block);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  try {
    const bild = await new Promise<HTMLImageElement>((f, x) => {
      const i = new Image(); i.onload = () => f(i); i.onerror = () => x(new Error('load')); i.src = url;
    });
    const c = document.createElement('canvas'); c.width = bild.width; c.height = bild.height;
    const g = c.getContext('2d')!; g.drawImage(bild, 0, 0);
    return { masse: [bild.width, bild.height],
      punkte: stellen.map(q => { const d = g.getImageData(q[0]!, q[1]!, 1, 1).data; return [d[0], d[1], d[2]]; }) };
  } finally { URL.revokeObjectURL(url); }
}, stellen);

/* ═══ §2 Das Foto steht im Bild ════════════════════════════════════════════ */
console.log('\n§2 Ein Foto auf der Seite steht im gesicherten Bild');
{
  await bauen(null);
  /* Das Blatt ist 400×600, das Bild wird doppelt gerechnet: 800×1200.
     Das Foto liegt bei 100..300 → 200..600 im Bild. */
  const r = await farben([[400, 400], [100, 100], [400, 1040]]);
  gleich('Das Bild hat die doppelte Blattgrösse', r?.masse, [800, 1200]);
  const gruen = r?.punkte[0] as number[];
  p('In der Mitte des Fotos steht Grün', !!gruen && gruen[1]! > 150 && gruen[0]! < 120 && gruen[2]! < 120,
    JSON.stringify(gruen));
  const weiss = r?.punkte[1] as number[];
  p('Daneben ist das Papier weiss', !!weiss && weiss[0]! > 240 && weiss[1]! > 240 && weiss[2]! > 240,
    JSON.stringify(weiss));
  const blau = r?.punkte[2] as number[];
  p('Und der Strich ist weiterhin da (blau)', !!blau && blau[2]! > 150 && blau[0]! < 120,
    JSON.stringify(blau));
}

/* ═══ §3 Auch gedreht ══════════════════════════════════════════════════════ */
console.log('\n§3 Auch ein gedrehtes Foto, an seiner Stelle');
{
  await bauen(45);
  /* Um 45° gedreht liegt die Mitte weiter dort, die Ecken des ungedrehten
     Kastens aber nicht mehr im Bild. */
  const r = await farben([[400, 400], [230, 230], [400, 180]]);
  const mitte = r?.punkte[0] as number[];
  p('Die Mitte des Fotos ist grün', !!mitte && mitte[1]! > 150 && mitte[0]! < 120, JSON.stringify(mitte));
  const ecke = r?.punkte[1] as number[];
  p('Die Ecke des ungedrehten Kastens ist frei — es steht wirklich schief',
    !!ecke && ecke[0]! > 200 && ecke[1]! > 200 && ecke[2]! > 200, JSON.stringify(ecke));
  const oben = r?.punkte[2] as number[];
  p('Und über der Mitte, wo die gedrehte Ecke hinzeigt, ist es grün',
    !!oben && oben[1]! > 150 && oben[0]! < 120, JSON.stringify(oben));
}

/* ═══ §4 Der Rest bleibt ═══════════════════════════════════════════════════ */
console.log('\n§4 Was vorher mitkam, kommt weiter mit');
{
  const r = await s.evaluate(async () => {
    const seite = Store.addPage(null, { text: 'PDF-Blatt', icon: '📕' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    const b = Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 400, bh: 600,
      quelleId: 'q', raumVersion: 1,
      marken: [{ id: 'r1', art: 'rectangle', farbe: '#d64545', breite: 10, pts: [[60, 60], [340, 200]] }] });
    await Store.flush();
    const blob = await DocumentMode.seiteAlsBild(Store.getBlock(b.id));
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    try {
      const bild = await new Promise<HTMLImageElement>((f, x) => {
        const i = new Image(); i.onload = () => f(i); i.onerror = () => x(new Error('load')); i.src = url;
      });
      const c = document.createElement('canvas'); c.width = bild.width; c.height = bild.height;
      const g = c.getContext('2d')!; g.drawImage(bild, 0, 0);
      const d = g.getImageData(120, 120, 1, 1).data;   /* auf der Kante des Rechtecks */
      return { masse: [bild.width, bild.height], kante: [d[0], d[1], d[2]] };
    } finally { URL.revokeObjectURL(url); }
  });
  gleich('Eine PDF-Seite ohne Bildmarke lässt sich weiter sichern', r?.masse, [800, 1200]);
  const kante = r?.kante as number[];
  p('… und ihre Formen stehen darauf (rot)', !!kante && kante[0]! > 150 && kante[1]! < 120,
    JSON.stringify(kante));
}
await s.close();

console.log('\n§5 Quellen');
p('`seiteAlsBild` liest die Bildmarken als Daten',
  /const alsBildMarke = \(m: any\): string \| null/.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /readAsDataURL\(roh\)/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Das erzeugte JS trägt es', /alsBildMarke/.test(lies('quell/bereiche/pdf/document-mode.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
