/* Suite 440 — Seiten wie GoodNotes: einfügen, duplizieren, drehen, schieben, Lesezeichen, löschen (E467)
 * ============================================================================
 * Dritter Bogen aus Redurs Auftrag vom 7. September (E465): das Seitenmenü
 * von GoodNotes im Inspector des Schreibstudios.
 *
 *   §1 EINFÜGEN: „Seite danach" legt ein leeres Blatt hinter die Seite, mit
 *      dem Papier aus der Auswahl; die Reihenfolge ist die des Inhalts.
 *   §2 DUPLIZIEREN: die Kopie einer PDF-Seite hat eine eigene Kennung, die
 *      Marken darauf — und ein EIGENES Seitenbild, nicht das geteilte.
 *   §3 DREHEN: `gedreht` in 90°-Schritten; die Seite steht quer, der Zeiger
 *      findet trotzdem in Blattpunkte; viermal ist wieder aufrecht.
 *   §4 SCHIEBEN: nach unten, nach oben — im `content` der Eltern, und der
 *      Stand folgt der Seite. Am Rand passiert nichts.
 *   §5 LESEZEICHEN: ein Feld an der Seite, das Zeichen an der Miniatur, die
 *      Liste im Inspector springt hin.
 *   §6 LÖSCHEN: in den Papierkorb, nie endgültig; die letzte Seite bleibt.
 *   §7 RECHTE: ein gesperrtes Dokument lässt nur das Lesezeichen zu.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §3 → `SheetSpace.drehHuelle` gibt immer `inhalt` zurück: keine Huelle,
 *        nichts steht quer. Gelaufen am 7. September, rot.
 *   §2 → in `seiteDuplizieren` das Kopieren des Bildes ausgelassen: die Kopie
 *        teilt sich die `bildDateiId`. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test440.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const Dateien: any; declare const SheetSpace: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9560;
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

/* Ein 1×1-PNG: klein, aber eine echte Datei in der Ablage — §2 braucht ein
   Seitenbild, das kopiert werden kann. */
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** Ein Skript mit drei PDF-Seiten im Schreibstudio, Inspector offen. */
const mitSkript = async (): Promise<{ s: Page; seiteId: string }> => {
  const s = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined' && typeof Dateien !== 'undefined'");
  const seiteId = await s.evaluate(async (png: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('heft:papier', 'blanko');
    const seite = Store.addPage(null, { text: 'Skript Seiten', icon: '📕' });
    const bloecke: any[] = [];
    for (let nr = 1; nr <= 3; nr++)
      bloecke.push(Store.addBlock(seite.id, 'pdfseite', { text: '', suchtext: 'Ohm ' + nr, nr, vonSeiten: 3,
        bw: 595, bh: 842, quelleId: 'q', raumVersion: 1,
        marken: nr === 1 ? [{ id: 'm1', art: 'line', farbe: '#d64545', breite: 2.4, pts: [[100, 100], [300, 100]] }] : [] }));
    const bytes = Uint8Array.from(atob(png), c => c.charCodeAt(0));
    const satz = await Dateien.ablegen(new File([bytes], 'seite-1.png', { type: 'image/png' }), { blockId: bloecke[0].id, abgeleitet: true });
    Store.updateBlock(bloecke[0].id, { bildDateiId: satz.id });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1400));
    return seite.id as string;
  }, PNG);
  await s.click('[data-document-action="inspector"]');
  await s.waitForTimeout(300);
  return { s, seiteId };
};

/** Die Seiten in der Reihenfolge, die das Studio zeigt. */
const reihe = (s: Page, seiteId: string) => s.evaluate((id: string) =>
  DocumentMode.documentsIn(Store.getBlock(id)).map((b: any) => b.type === 'pdfseite' ? 'pdf' + b.nr : b.type + ':' + (b.papier || '')), seiteId);
const lage = (s: Page) => s.evaluate(() => ({
  buehnen: document.querySelectorAll('.document-stage').length,
  position: document.querySelector('.document-position')?.textContent || '',
  titel: document.querySelector('.document-inspector-seite .document-section-title')?.textContent || ''
}));
const tue = async (s: Page, action: string): Promise<void> => {
  await s.click(`.document-inspector [data-document-action="${action}"]`);
  await s.waitForTimeout(500);
};
const springe = async (s: Page, i: number): Promise<void> => {
  await s.evaluate((i: number) => { document.querySelector<HTMLElement>('.document-thumbnails [data-document-index="' + i + '"]')?.click(); }, i);
  await s.waitForTimeout(400);
};

/* ═══ §1 Einfügen ══════════════════════════════════════════════════════════ */
console.log('\n§1 Einfügen');
const { s, seiteId } = await mitSkript();
{
  gleich('Drei PDF-Seiten, drei Bühnen', await reihe(s, seiteId), ['pdf1', 'pdf2', 'pdf3']);
  const knoepfe = await s.evaluate(() => [...document.querySelectorAll('.document-seite-knoepfe button')].map(b => (b as HTMLElement).dataset.documentAction));
  /* ZEHN SEIT E469: Bild als Seite, PDF hier einfügen, Als Bild sichern. */
  gleich('Das Seitenmenü hat zehn Griffe', knoepfe, ['page-add', 'page-duplicate', 'page-rotate', 'page-up', 'page-down', 'page-bookmark', 'page-delete', 'page-add-image', 'page-add-pdf', 'page-export-image']);
  const hoch = await s.evaluate(() => Math.min(...[...document.querySelectorAll('.document-seite-knoepfe button')].map(b => b.getBoundingClientRect().height)));
  p('… und jeder misst 44 (§37)', hoch >= 44, String(hoch));
  await s.selectOption('.document-inspector select[data-document-papier]', 'kariert');
  await tue(s, 'page-add');
  gleich('„Seite danach" legt ein kariertes Blatt hinter Seite 1', await reihe(s, seiteId), ['pdf1', 'blatt:kariert', 'pdf2', 'pdf3']);
  const l = await lage(s);
  p('Vier Bühnen, der Stand auf der neuen Seite', l.buehnen === 4 && l.position === 'Seite 2/4' && l.titel.startsWith('Seite 2 von 4'), JSON.stringify(l));
  p('Das neue Blatt hat eine Zeile zum Schreiben (E118)', await s.evaluate((id: string) => {
    const b = DocumentMode.documentsIn(Store.getBlock(id))[1];
    return Store.childrenOf(b.id).length === 1 && b.parentId === id;
  }, seiteId));
}

/* ═══ §2 Duplizieren ═══════════════════════════════════════════════════════ */
console.log('\n§2 Duplizieren');
{
  await springe(s, 0);
  const vorher = await s.evaluate((id: string) => { const b = DocumentMode.documentsIn(Store.getBlock(id))[0]; return { id: b.id, bild: b.bildDateiId }; }, seiteId);
  await tue(s, 'page-duplicate');
  await s.waitForTimeout(900);
  gleich('Die Kopie steht hinter dem Original', await reihe(s, seiteId), ['pdf1', 'pdf1', 'blatt:kariert', 'pdf2', 'pdf3']);
  const kopie = await s.evaluate(async (id: string) => {
    const b = DocumentMode.documentsIn(Store.getBlock(id))[1];
    const satz = b.bildDateiId ? await Store.dateiHolen(b.bildDateiId) : null;
    return { id: b.id, bild: b.bildDateiId, marken: (b.marken || []).length, quelle: b.quelleId, nr: b.nr,
      dateiDa: !!satz, dateiBlock: satz?.blockId, lesezeichen: b.lesezeichen };
  }, seiteId);
  p('… mit eigener Kennung, derselben Quelle und der Marke darauf', kopie.id !== vorher.id && kopie.quelle === 'q' && kopie.nr === 1 && kopie.marken === 1, JSON.stringify(kopie));
  p('… und einem EIGENEN Seitenbild, das an der Kopie hängt', !!kopie.bild && kopie.bild !== vorher.bild && kopie.dateiDa && kopie.dateiBlock === kopie.id, JSON.stringify({ vorher, kopie }));
  p('Das Original behält seins', await s.evaluate(async (bild: string) => !!(await Store.dateiHolen(bild)), vorher.bild));
  const l = await lage(s);
  gleich('Der Stand steht auf der Kopie', l.position, 'Seite 2/5');
}

/* ═══ §3 Drehen ════════════════════════════════════════════════════════════ */
console.log('\n§3 Drehen');
{
  await tue(s, 'page-rotate');
  const d = await s.evaluate((id: string) => {
    const b = DocumentMode.documentsIn(Store.getBlock(id))[1];
    const stand = document.querySelector<HTMLElement>('.document-stage[data-stand-nr="1"]');
    const huelle = stand?.querySelector<HTMLElement>('.blatt-dreh');
    const papier = huelle?.querySelector<HTMLElement>('.blatt-papier');
    const r = huelle?.getBoundingClientRect();
    const svg = stand?.querySelector<SVGSVGElement>('svg.blatt-marken');
    const sr = svg?.getBoundingClientRect();
    const mitte = svg && sr ? SheetSpace.zuBlatt(svg, { clientX: sr.left + sr.width / 2, clientY: sr.top + sr.height / 2 }) : null;
    const ecke = svg && sr ? SheetSpace.zuBlatt(svg, { clientX: sr.left + sr.width - 1, clientY: sr.top + 1 }) : null;
    return { gedreht: b.gedreht, huelle: huelle?.dataset.gedreht, quer: !!r && r.width > r.height * 1.2,
      papierTransform: papier ? getComputedStyle(papier).transform !== 'none' : false, mitte, ecke,
      titel: document.querySelector('.document-inspector-seite .document-section-title')?.textContent };
  }, seiteId);
  gleich('Die Seite trägt `gedreht: 90`', d.gedreht, 90);
  p('… steht in einer Drehhülle quer (breiter als hoch), das Papier gedreht', d.huelle === '90' && d.quer && d.papierTransform, JSON.stringify(d));
  p('Der Zeiger findet in Blattpunkte: die Mitte ist die Mitte', !!d.mitte && Math.abs(d.mitte[0] - 297.5) < 6 && Math.abs(d.mitte[1] - 421) < 6, JSON.stringify(d.mitte));
  /* Um 90° im Uhrzeigersinn gedreht liegt die Blatt-Ecke (0,0) rechts oben. */
  p('… und die rechte obere Bildschirmecke ist die linke obere Blattecke', !!d.ecke && d.ecke[0] < 8 && d.ecke[1] < 8, JSON.stringify(d.ecke));
  p('Der Titel sagt es', String(d.titel).includes('90°'), String(d.titel));
  await tue(s, 'page-rotate'); await tue(s, 'page-rotate'); await tue(s, 'page-rotate');
  const zurueck = await s.evaluate((id: string) => {
    const b = DocumentMode.documentsIn(Store.getBlock(id))[1];
    return { gedreht: b.gedreht, huellen: document.querySelectorAll('.document-stage[data-stand-nr="1"] .blatt-dreh').length };
  }, seiteId);
  gleich('Viermal gedreht ist wieder aufrecht — ohne Hülle', [zurueck.gedreht, zurueck.huellen], [0, 0]);
}

/* ═══ §4 Schieben ══════════════════════════════════════════════════════════ */
console.log('\n§4 Schieben');
{
  await tue(s, 'page-down');
  gleich('Nach unten: die Kopie steht hinter dem Blatt', await reihe(s, seiteId), ['pdf1', 'blatt:kariert', 'pdf1', 'pdf2', 'pdf3']);
  gleich('… und der Stand folgt ihr', (await lage(s)).position, 'Seite 3/5');
  p('Auch der Inhalt der Seite hat die Reihenfolge', await s.evaluate((id: string) => {
    const c = Store.getBlock(id).content.map((x: string) => Store.getBlock(x)).filter((b: any) => b && b.alive !== false);
    return c[1].type === 'blatt' && c[2].type === 'pdfseite' && c[2].nr === 1;
  }, seiteId));
  await tue(s, 'page-up');
  gleich('Nach oben: wieder davor', await reihe(s, seiteId), ['pdf1', 'pdf1', 'blatt:kariert', 'pdf2', 'pdf3']);
  await springe(s, 0);
  p('Ein Sprung über die Miniatur zieht das Seitenmenü nach', (await lage(s)).titel.startsWith('Seite 1 von 5'), (await lage(s)).titel);
  await tue(s, 'page-up');
  gleich('Die erste Seite bleibt die erste', await reihe(s, seiteId), ['pdf1', 'pdf1', 'blatt:kariert', 'pdf2', 'pdf3']);
}

/* ═══ §5 Lesezeichen ═══════════════════════════════════════════════════════ */
console.log('\n§5 Lesezeichen');
{
  await springe(s, 3);
  await tue(s, 'page-bookmark');
  const z = await s.evaluate((id: string) => {
    const b = DocumentMode.documentsIn(Store.getBlock(id))[3];
    return { feld: b.lesezeichen, liste: [...document.querySelectorAll('.document-lesezeichen [data-document-index]')].map(k => (k as HTMLElement).dataset.documentIndex),
      miniatur: !!document.querySelector('.document-thumbnails [data-document-index="3"].hat-lesezeichen .document-thumbnail-mark'),
      knopf: document.querySelector('.document-inspector [data-document-action="page-bookmark"]')?.getAttribute('aria-pressed') };
  }, seiteId);
  p('Das Lesezeichen ist ein Feld an der Seite, der Knopf gedrückt', z.feld === true && z.knopf === 'true', JSON.stringify(z));
  gleich('… die Liste im Inspector führt es', z.liste, ['3']);
  p('… und die Miniatur trägt das Zeichen', z.miniatur);
  await springe(s, 0);
  await s.click('.document-lesezeichen [data-document-index="3"]');
  await s.waitForTimeout(500);
  gleich('Ein Tipp in der Liste springt hin', (await lage(s)).position, 'Seite 4/5');
  await tue(s, 'page-bookmark');
  gleich('Nochmal: weg, Liste weg', await s.evaluate((id: string) => [DocumentMode.documentsIn(Store.getBlock(id))[3].lesezeichen, document.querySelectorAll('.document-lesezeichen').length], seiteId), [false, 0]);
}

/* ═══ §6 Löschen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Löschen');
{
  await springe(s, 1);
  const weg = await s.evaluate((id: string) => DocumentMode.documentsIn(Store.getBlock(id))[1].id, seiteId);
  await tue(s, 'page-delete');
  gleich('Die Kopie ist aus dem Dokument', await reihe(s, seiteId), ['pdf1', 'blatt:kariert', 'pdf2', 'pdf3']);
  p('… aber nur im Papierkorb, nicht weg (§9)', await s.evaluate((id: string) => { const b = Store.getBlock(id); return !!b && b.alive === false && !!b.trashedAt; }, weg));
  gleich('Vier Bühnen', (await lage(s)).buehnen, 4);
  /* Die letzte Seite bleibt. */
  const einzel = await s.evaluate(async () => {
    const seite = Store.addPage(null, { text: 'Einzelblatt', icon: '📕' });
    Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842, quelleId: 'e', raumVersion: 1 });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush(); App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1000));
    return seite.id as string;
  });
  await s.click('[data-document-action="inspector"]').catch(() => {});
  await s.waitForTimeout(300);
  await tue(s, 'page-delete');
  gleich('Die letzte Seite lässt sich nicht löschen', await reihe(s, einzel), ['pdf1']);
}

/* ═══ §7 Rechte ════════════════════════════════════════════════════════════ */
console.log('\n§7 Rechte');
{
  await s.evaluate(async (id: string) => { Store.updateBlock(id, { gesperrt: true }); await Store.flush(); App.zeichneSeite(); await new Promise(r => setTimeout(r, 800)); }, seiteId);
  await s.evaluate((id: string) => { App.oeffne(id); }, seiteId);
  await s.waitForTimeout(1000);
  await s.click('[data-document-action="inspector"]').catch(() => {});
  await s.waitForTimeout(300);
  const r = await s.evaluate(() => [...document.querySelectorAll('.document-seite-knoepfe button')].map(b => (b as HTMLButtonElement).disabled));
  /* SEIT E473 IST AUCH DAS LESEZEICHEN GESPERRT: es schreibt in den Block,
     also gilt dieselbe Prüfung wie für jeden anderen Seitengriff (§26).
     „Als Bild sichern" bleibt an — es ändert nichts. */
  gleich('Gesperrt: alles aus ausser Sichern', r, [true, true, true, true, true, true, true, true, true, false]);
  await s.evaluate(() => { const k = document.querySelector<HTMLButtonElement>('.document-inspector [data-document-action="page-add"]'); if (k) { k.disabled = false; k.click(); } });
  await s.waitForTimeout(500);
  gleich('… und ein erzwungener Tipp ändert nichts', await reihe(s, seiteId), ['pdf1', 'blatt:kariert', 'pdf2', 'pdf3']);
}
await s.close();

/* ═══ §8 Eingebunden ═══════════════════════════════════════════════════════ */
console.log('\n§8 Eingebunden');
{
  p('SheetSpace kennt gedrehtVon, masseVon, drehHuelle', /gedrehtVon, masseVon, drehHuelle/.test(lies('src/core/sheet/space.ts')));
  p('Beide Zeichner nehmen die Drehhülle', /drehHuelle\(block, flur\)/.test(lies('src/bereiche/pdf/seite.ts')) && /drehHuelle\(block, papier\)/.test(lies('src/bereiche/bloecke/arten/blatt.ts')));
  p('documentsIn sortiert nicht mehr nach nr (E467)', !/return found\.sort/.test(lies('src/bereiche/pdf/document-mode.ts')));
  p('Das Stilblatt kennt die Drehhülle und das Seitenmenü', /\.blatt-dreh\{/.test(lies('quell/schale/stil/bausteine.css')) && /\.document-seite-knoepfe/.test(lies('quell/schale/stil/bausteine.css')));
}

console.log('\n§9 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
