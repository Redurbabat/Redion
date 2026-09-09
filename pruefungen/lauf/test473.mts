/* Suite 473 — CropBox und /Rotate: die ungeprüfte Zusage (E505)
 * ============================================================================
 * Aus dem Stift-Dossier, Seite 6: „Koordinaten sind eine der häufigsten
 * Fehlerquellen … In der Praxis müssen zusätzlich CropBox, MediaBox,
 * Seitenrotation, Display-Scale, Scrolloffset … berücksichtigt werden."
 *
 * Redion rechnet richtig — es fragt pdf.js nach dem Viewport, und der kennt
 * beides. Nur war das NIRGENDS geprüft: keine einzige der rund zwanzig
 * Prüf-PDFs im Verzeichnis trug je eine `/CropBox` oder ein `/Rotate`; jede
 * hatte `MediaBox [0 0 595 842]` und sonst nichts. Eine Zusage, die nie
 * gefahren wurde, ist eine Behauptung — und genau die Sorte, die beim
 * nächsten Umbau still zerbricht.
 *
 *   §1 EINE BESCHNITTENE SEITE MISST IHREN AUSSCHNITT, nicht ihr Papier.
 *      MediaBox 800×1000, CropBox 600×800 — gespeichert werden 600×800.
 *   §2 UND DER AUSSCHNITT SITZT RICHTIG: ein schwarzes Quadrat, das im
 *      Papier bei (60|840) steht, muss im Ausschnitt bei (10|20) landen.
 *      Das ist der Punkt, an dem ein vergessener CropBox-Ursprung auffällt
 *      — gemessen an echten Pixeln, nicht an einer Zahl im Block.
 *   §3 EINE GEDREHTE SEITE TAUSCHT IHRE KANTEN, und `/Rotate` wird als
 *      solches gemerkt — nicht mit der Drehung verwechselt, die ein MENSCH
 *      der Seite gibt (E467).
 *   §4 EINE MARKE BLEIBT, WO SIE WAR — über das Neuladen hinweg, auf der
 *      beschnittenen wie auf der gedrehten Seite.
 *   §5 DER EXPORT SAGT, WAS ER TUT — sichtbar, nicht nur im `title`. Das
 *      Dossier (S.9, S.18): Flattening ist eine legitime Wahl, aber es soll
 *      eine ENTSCHEIDUNG sein. Der Satz stand bis hierher nur im `title`,
 *      nannte allein den verlorenen Suchtext, und am Telefon gibt es kein
 *      Hover (§37): dort erfuhr niemand etwas.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja, und zwar an der Stelle, an der es zählt: `geometrie` in `leser.ts` auf
 * `seite.view` statt auf den Viewport umgestellt (also die MediaBox statt des
 * Ausschnitts) macht §1 und §2 rot. Gefahren und rot gesehen; siehe E505.
 *
 *   node pruefungen/lauf/test473.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const PdfLeser: any;
declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9593;
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

/* ══ DIE PRÜF-PDF ══════════════════════════════════════════════════════════
   Zwei Seiten, beide mit einem Papier von 800×1000 und einem AUSSCHNITT von
   600×800, dessen Ursprung NICHT bei null liegt: CropBox [50 100 650 900].
   Seite 2 trägt zusätzlich /Rotate 90.

   Auf jeder Seite steht ein schwarzes Quadrat von 40×40 im Papier bei
   (60|840) — also in der PDF-Rechnung von unten links. Im Ausschnitt liegt
   es damit 10 Punkte vom linken Rand und 20 Punkte vom oberen: 60−50 = 10,
   und 900−880 = 20. Genau diese zwei Zahlen prüft §2. */
const pdf = (): Buffer => {
  const inhalt = '0 0 0 rg 60 840 40 40 re f\n';
  const objs: string[] = [];
  objs.push('<< /Type /Pages /Count 2 /Kids [2 0 R 4 0 R] >>');                  /* 1 */
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 800 1000] '
    + '/CropBox [50 100 650 900] /Resources << >> /Contents 3 0 R >>');          /* 2 */
  objs.push(`<< /Length ${Buffer.byteLength(inhalt)} >>\nstream\n${inhalt}endstream`); /* 3 */
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 800 1000] '
    + '/CropBox [50 100 650 900] /Rotate 90 /Resources << >> /Contents 5 0 R >>');/* 4 */
  objs.push(`<< /Length ${Buffer.byteLength(inhalt)} >>\nstream\n${inhalt}endstream`); /* 5 */
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');                                /* 6 */
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};

const browser = await chromium.launch();
const fehler: string[] = [];
const HEX = pdf().toString('hex');

const frisch = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof PdfLeser !== 'undefined'");
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });
  return s;
};

/* ═══ §1 Die beschnittene Seite misst ihren Ausschnitt ═════════════════════ */
console.log('\n§1 Eine beschnittene Seite misst ihren Ausschnitt, nicht ihr Papier');
{
  const s = await frisch();
  const r = JSON.parse(await s.evaluate(`(async () => {
    const hex = '${HEX}';
    const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
    const leser = await PdfLeser.oeffne(bytes);
    const g1 = await leser.geometrie(1);
    const g2 = await leser.geometrie(2);
    leser.schliessen();
    return JSON.stringify({ seiten: leser.seiten, g1, g2 });
  })()`) as string);
  gleich('Die PDF hat zwei Seiten', r.seiten, 2);
  gleich('Seite 1 misst den Ausschnitt (600×800), nicht das Papier (800×1000)',
    [r.g1.bw, r.g1.bh], [600, 800]);
  gleich('… und ist nicht gedreht', r.g1.dreh, 0);
  await s.close();
}

/* ═══ §2 Der Ausschnitt sitzt an der richtigen Stelle ══════════════════════ */
console.log('\n§2 Der Ursprung des Ausschnitts wird mitgerechnet');
{
  const s = await frisch();
  const r = JSON.parse(await s.evaluate(`(async () => {
    const hex = '${HEX}';
    const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
    const leser = await PdfLeser.oeffne(bytes);
    const blob = await leser.alsBild(1);
    leser.schliessen();
    const bild = await createImageBitmap(blob);
    const l = document.createElement('canvas');
    l.width = bild.width; l.height = bild.height;
    const c = l.getContext('2d');
    c.drawImage(bild, 0, 0);
    /* Von Blattpunkten in Bildpunkte: das Bild ist der Ausschnitt. */
    const sx = bild.width / 600, sy = bild.height / 800;
    const dunkel = (x, y) => {
      const d = c.getImageData(Math.round(x * sx), Math.round(y * sy), 1, 1).data;
      return d[0] < 90 && d[1] < 90 && d[2] < 90 && d[3] > 200;
    };
    return JSON.stringify({
      breite: bild.width, hoehe: bild.height,
      /* Das Quadrat: 10..50 von links, 20..60 von oben. */
      imQuadrat: dunkel(30, 40),
      linksDaneben: dunkel(4, 40),
      obenDarueber: dunkel(30, 8),
      rechtsDaneben: dunkel(80, 40),
      /* Und ein Punkt, der NUR im Papier läge, nicht im Ausschnitt: das
         Quadrat säße bei ungerechnetem Ursprung 50 weiter rechts. */
      beiUngerechnetemUrsprung: dunkel(80, 130)
    });
  })()`) as string);
  p('Das Bild hat das Seitenverhältnis des Ausschnitts (3:4)',
    Math.abs(r.breite / r.hoehe - 600 / 800) < 0.01, `${r.breite}×${r.hoehe}`);
  p('Im Quadrat ist es schwarz — es steht bei (10|20) im Ausschnitt', r.imQuadrat);
  p('… links daneben nicht', !r.linksDaneben);
  p('… darüber nicht', !r.obenDarueber);
  p('… und rechts daneben auch nicht', !r.rechtsDaneben);
  p('Bei vergessenem CropBox-Ursprung stünde es woanders — dort ist es hell',
    !r.beiUngerechnetemUrsprung);
  await s.close();
}

/* ═══ §3 Die gedrehte Seite ════════════════════════════════════════════════ */
console.log('\n§3 /Rotate 90 tauscht die Kanten und wird als solches gemerkt');
{
  const s = await frisch();
  const r = JSON.parse(await s.evaluate(`(async () => {
    const hex = '${HEX}';
    const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
    const leser = await PdfLeser.oeffne(bytes);
    const g = await leser.geometrie(2);
    const blob = await leser.alsBild(2);
    leser.schliessen();
    const bild = await createImageBitmap(blob);
    return JSON.stringify({ g, breite: bild.width, hoehe: bild.height });
  })()`) as string);
  gleich('Die gedrehte Seite misst 800×600 — die Kanten des Ausschnitts, getauscht',
    [r.g.bw, r.g.bh], [800, 600]);
  gleich('… und /Rotate steht als 90 am Block', r.g.dreh, 90);
  p('Auch das Bild ist quer', r.breite > r.hoehe, `${r.breite}×${r.hoehe}`);
  await s.close();
}

/* ═══ §4 Eine Marke bleibt, wo sie war ═════════════════════════════════════ */
console.log('\n§4 Eine Marke auf der beschnittenen Seite überlebt das Neuladen');
{
  const s = await frisch();
  await s.evaluate(async () => {
    const seite = Store.addPage(null, { text: 'Beschnittenes Skript' });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForFunction("!!document.getElementById('scroll')", null, { timeout: 15000 });
  await s.evaluate((hex: string) => {
    const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
    const datei = new File([bytes], 'beschnitten.pdf', { type: 'application/pdf' });
    const dt = new DataTransfer();
    dt.items.add(datei);
    document.getElementById('scroll')!.dispatchEvent(
      new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, HEX);
  await s.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 25000 });
  await s.click('.overlay [data-w="untereinander"]');
  /* ÜBER `documentsIn`, nicht über `content`: die Seiten können in einer
     SPALTE liegen (E104 fragt nach der Anordnung), und dann hat die Seite
     genau ein Kind. Dieselbe Tür, die auch das Studio benutzt. */
  await s.waitForFunction(
    "(() => { const id = App.aktuelleSeite && App.aktuelleSeite();"
    + " const b = id ? Store.getBlock(id) : null;"
    + " return !!b && typeof DocumentMode !== 'undefined'"
    + " && DocumentMode.documentsIn(b).length >= 2; })()",
    null, { timeout: 60000 });

  const eingelesen = JSON.parse(await s.evaluate(`(() => {
    const seite = Store.getBlock(App.aktuelleSeite());
    const kinder = DocumentMode.documentsIn(seite).filter(b => b && b.type === 'pdfseite');
    return JSON.stringify(kinder.map(b => ({ bw: b.bw, bh: b.bh, dreh: b.dreh || 0, nr: b.nr })));
  })()`) as string);
  gleich('Beide Seiten sind da', eingelesen.length, 2);
  gleich('Seite 1 trägt den Ausschnitt', [eingelesen[0].bw, eingelesen[0].bh, eingelesen[0].dreh],
    [600, 800, 0]);
  gleich('Seite 2 trägt ihn quer, mit /Rotate 90',
    [eingelesen[1].bw, eingelesen[1].bh, eingelesen[1].dreh], [800, 600, 90]);

  /* Eine Marke auf jede der beiden Seiten — und dann neu laden. */
  await s.evaluate(`(() => {
    const seite = Store.getBlock(App.aktuelleSeite());
    const kinder = DocumentMode.documentsIn(seite).filter(b => b && b.type === 'pdfseite');
    Store.updateBlock(kinder[0].id, { marken: [
      { id: 'm1', art: 'stift', farbe: '#d00000', breite: 3, pts: [[100, 200], [300, 260]] }] });
    Store.updateBlock(kinder[1].id, { marken: [
      { id: 'm2', art: 'stift', farbe: '#0050d0', breite: 3, pts: [[400, 150], [600, 300]] }] });
  })()`);
  await s.evaluate('Store.flush()');
  await s.reload();
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'");
  await s.waitForTimeout(1200);
  const nachher = JSON.parse(await s.evaluate(`(() => {
    const seiten = [];
    const s0 = Store.getBlock(App.aktuelleSeite());
    DocumentMode.documentsIn(s0)
      .filter(b => b && b.type === 'pdfseite')
      .forEach(b => seiten.push({ bw: b.bw, bh: b.bh, dreh: b.dreh || 0,
        marken: (b.marken || []).map(m => ({ id: m.id, pts: m.pts })) }));
    return JSON.stringify(seiten);
  })()`) as string);
  gleich('Nach dem Neuladen misst Seite 1 noch immer den Ausschnitt',
    [nachher[0].bw, nachher[0].bh], [600, 800]);
  gleich('… und ihre Marke liegt Punkt für Punkt, wo sie lag',
    nachher[0].marken[0].pts, [[100, 200], [300, 260]]);
  gleich('Die gedrehte Seite ebenso', [nachher[1].bw, nachher[1].bh, nachher[1].dreh],
    [800, 600, 90]);
  gleich('… mit ihrer Marke', nachher[1].marken[0].pts, [[400, 150], [600, 300]]);
  await s.close();
}

/* ═══ §5 Der Export sagt, was er tut ══════════════════════════════════════ */
console.log('\n§5 Der PDF-Export sagt sichtbar, was er tut');
for (const [wie, breite] of [['am Rechner', 1280], ['am Telefon', 390]] as Array<[string, number]>) {
  const s = await frisch();
  await s.setViewportSize({ width: breite, height: 900 });
  await s.evaluate(`(() => {
    const seite = Store.addPage(null, { text: 'Skript', dokumentModus: true });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    App.oeffne(seite.id);
  })()`);
  await s.waitForSelector('.document-workspace', { timeout: 20000 });
  await s.waitForTimeout(900);
  await s.evaluate(`document.querySelector('[data-document-action="inspector"]')?.click()`);
  await s.waitForTimeout(600);
  const k = JSON.parse(await s.evaluate(`(() => {
    const knopf = document.querySelector('[data-document-action="export-pdf"]');
    const hinweis = document.querySelector('.document-export-hinweis');
    const st = hinweis ? getComputedStyle(hinweis) : null;
    const r = hinweis ? hinweis.getBoundingClientRect() : null;
    return JSON.stringify({
      knopfDa: !!knopf,
      titel: knopf ? String(knopf.getAttribute('title') || '') : '',
      text: hinweis ? String(hinweis.textContent || '') : '',
      sichtbar: !!r && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden',
      groesse: st ? parseFloat(st.fontSize) : 0
    });
  })()`) as string);
  p(`${wie}: der Satz steht sichtbar unter dem Knopf`, k.sichtbar, JSON.stringify(k).slice(0, 160));
  p(`${wie}: … und sagt, dass die Seite darunter ein Bild wird`, /Bild/.test(k.text), k.text);
  p(`${wie}: … und dass die Handschrift eine echte Anmerkung wird (seit E506)`,
    /Anmerkung/.test(k.text), k.text);
  p(`${wie}: … und dass Original und Marken bleiben (§33: keine Angst machen, wo keine ist)`,
    /bleiben/.test(k.text), k.text);
  p(`${wie}: … lesbar, nicht Kleingedrucktes unter 11 px`, k.groesse >= 11, String(k.groesse));
  if (breite === 1280) {
    p('Der `title` nennt jetzt auch die verlorenen Anmerkungen, nicht nur den Text',
      /Anmerkungen/.test(k.titel) && /durchsuchbar/.test(k.titel), k.titel.slice(0, 200));
  }
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const le = lies('src/bereiche/pdf/leser.ts');
  p('Die Geometrie kommt aus dem Viewport — der kennt CropBox und /Rotate',
    /getViewport\(\{\s*scale:\s*1\s*\}\)/.test(le));
  p('… und /Rotate wird getrennt gemerkt, nicht in die Masse gerechnet',
    /dreh:\s*seite\.rotate/.test(le));
  p('Die Nutzer-Drehung ist eine andere Sache und sagt das auch',
    /gedreht.{0,400}dreh|dreh.{0,400}gedreht/s.test(lies('src/core/sheet/space.ts')));
  p('Der Hinweis steht im Aufbau, nicht nur im Stilblatt',
    /document-export-hinweis/.test(lies('src/bereiche/pdf/document-mode.ts'))
    && /\.document-export-hinweis\{/.test(lies('quell/schale/stil/bausteine.css')));
  p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
