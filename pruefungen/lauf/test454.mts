/* Suite 454 — Verweise treffen die Stelle, auch auf gedrehten Seiten (E481)
 * ============================================================================
 * Zwei Reste aus der Verweis-Liste in L133:
 *
 *   1. „Ziele der PDF innerhalb der Seite (/XYZ mit Koordinaten) — der
 *      Sprung geht zur Seite, nicht zur Stelle darauf." Ein Querverweis
 *      mitten in ein Kapitel landete an dessen Anfang.
 *   2. „PDF-Verweise auf gedrehten Seiten — die Schicht liegt über dem
 *      ungedrehten Papier; eine um 90° gedrehte Seite zeigt ihre Verweise
 *      nicht."
 *
 * Der zweite hatte einen Grund, der zugleich die Lösung war: die Schicht
 * lag NEBEN dem Papier und wurde ihm von Hand nachgemessen — und der
 * gemessene Kasten einer gedrehten Seite ist ihre Hülle, nicht ihr
 * Papier. Jetzt liegt sie IM Papier, mit `inset:0`, und dreht mit.
 *
 *   §1 DER LESER gibt die Stelle: /XYZ, /FitH und /FitR nennen eine Höhe,
 *      /Fit nicht — und dann steht auch keine da.
 *   §2 IM STUDIO rollt ein Verweis mit Stelle weiter als einer ohne.
 *   §3 EINE GEDREHTE SEITE zeigt ihre Verweise, und sie liegen im Papier.
 *   §4 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1, §2 → im Leser den `oben`-Zweig auslassen: keine Stelle mehr, der
 *        Sprung landet oben. Gelaufen, rot.
 *   §3 → in `verweiseMalen` die alte Zeile `if (gedrehtVon(block)) return;`
 *        wieder einsetzen: die gedrehte Seite zeigt nichts. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test454.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const PdfLeser: any; declare const PdfEinlesen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9574;
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

/* EINE PDF MIT VIER ZIELEN AUF SEITE 2, jedes einer anderen Art. Die Seite
   ist 842 hoch, und PDF zählt von UNTEN — /XYZ mit oben=400 liegt also
   442 Punkte unter der Oberkante. */
const pdfBytes = (): Buffer => {
  const objs: string[] = [];
  objs.push('<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>');                        // 1
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');                  // 2
  const s1 = 'BT /F1 14 Tf 50 780 Td (Vier Verweise auf Seite 2) Tj ET\n';
  objs.push(`<< /Length ${Buffer.byteLength(s1)} >>\nstream\n${s1}endstream`);          // 3
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> ' +
            '/Contents 3 0 R /Annots [7 0 R 8 0 R 9 0 R 10 0 R] >>');                   // 4
  const s2 = 'BT /F1 14 Tf 50 780 Td (Seite zwei) Tj ET\n';
  objs.push(`<< /Length ${Buffer.byteLength(s2)} >>\nstream\n${s2}endstream`);          // 5
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 5 0 R >>'); // 6
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 700 250 730] /Border [0 0 0] /Dest [6 0 R /XYZ 0 400 0] >>');   // 7
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 600 250 630] /Border [0 0 0] /Dest [6 0 R /FitH 300] >>');      // 8
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 500 250 530] /Border [0 0 0] /Dest [6 0 R /Fit] >>');           // 9
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 400 250 430] /Border [0 0 0] /Dest [6 0 R /FitR 50 100 300 500] >>'); // 10
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');                                        // 11
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};
const PDF64 = pdfBytes().toString('base64');

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 860 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined' && typeof PdfLeser !== 'undefined'");
await s.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ═══ §1 Der Leser gibt die Stelle ═════════════════════════════════════════ */
console.log('\n§1 Der Leser gibt die Stelle');
{
  const v = await s.evaluate(async (b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const griff = await PdfLeser.oeffne(bytes);
    const liste = await griff.verweise(1);
    griff.schliessen();
    return liste;
  }, PDF64);
  gleich('Vier Verweise auf Seite 1, alle auf Seite 2', v.map((x: any) => x.seite), [2, 2, 2, 2]);
  /* Der Reihe nach von oben: /XYZ (Rect y 700), /FitH (600), /Fit (500), /FitR (400). */
  const nach = (y: number) => v.find((x: any) => Math.abs(x.y - (842 - y - 30)) < 3);
  const xyz = nach(700), fith = nach(600), fit = nach(500), fitr = nach(400);
  p('/XYZ mit oben=400 zeigt auf 442 Punkte unter der Oberkante',
    !!xyz && Math.abs(Number(xyz.zielY) - 442) < 2, JSON.stringify(xyz));
  p('/FitH 300 auf 542', !!fith && Math.abs(Number(fith.zielY) - 542) < 2, JSON.stringify(fith));
  p('/FitR … 500 auf 342 — die Oberkante des Rechtecks',
    !!fitr && Math.abs(Number(fitr.zielY) - 342) < 2, JSON.stringify(fitr));
  p('/Fit nennt keine Stelle — und dann steht auch keine da',
    !!fit && fit.zielY === undefined, JSON.stringify(fit));
}

/* ═══ §2 Im Studio ═════════════════════════════════════════════════════════ */
console.log('\n§2 Ein Verweis mit Stelle rollt weiter');
const seiteId = await s.evaluate(async (b64: string) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const seite = Store.addPage(null, { text: 'Querverweise', icon: '📕' });
  await PdfEinlesen.alsSeiten(new File([bytes], 'quer.pdf', { type: 'application/pdf' }),
    seite.id, { anordnung: 'untereinander', ueberGrenze: 'alle' });
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1600));
  document.querySelector<HTMLElement>('[data-document-action="read"]')?.click();
  await new Promise(r => setTimeout(r, 900));
  return seite.id as string;
}, PDF64);
{
  const lage = () => s.evaluate(() => {
    const c = document.querySelector<HTMLElement>('.document-center')!;
    const zwei = document.querySelector<HTMLElement>('.document-stage[data-stand-nr="1"]');
    return { rolle: Math.round(c.scrollTop), obenSeiteZwei: zwei ? Math.round(zwei.offsetTop) : -1,
      hoehe: zwei ? Math.round(zwei.offsetHeight) : -1 };
  });
  const knoepfe = await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.document-stage[data-stand-nr="0"] button.document-verweis')]
    .map(k => ({ oben: k.style.top, stelle: k.dataset.documentStelle ?? null })));
  gleich('Vier Verweisknöpfe auf Seite 1', knoepfe.length, 4);
  const mitStelle = knoepfe.filter(k => k.stelle !== null).length;
  gleich('Drei davon tragen eine Stelle, einer nicht (/Fit)', mitStelle, 3);
  /* Der /Fit-Verweis: er springt an den Anfang der Seite. */
  await s.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>('.document-stage[data-stand-nr="0"] button.document-verweis')]
      .find(x => !x.dataset.documentStelle);
    k?.click();
  });
  await s.waitForTimeout(1200);
  const ohne = await lage();
  p('Ohne Stelle landet man am Anfang der Seite 2',
    Math.abs(ohne.rolle - ohne.obenSeiteZwei) < 40, JSON.stringify(ohne));
  /* Zurück nach oben, dann der /XYZ-Verweis. */
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-center')!.scrollTop = 0; });
  await s.waitForTimeout(400);
  await s.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>('.document-stage[data-stand-nr="0"] button.document-verweis')]
      .find(x => Math.abs(Number(x.dataset.documentStelle) - 442 / 842) < 0.02);
    k?.click();
  });
  await s.waitForTimeout(1200);
  const mit = await lage();
  const sollRolle = mit.obenSeiteZwei + mit.hoehe * (442 / 842) - 24;
  p('Mit Stelle landet man mitten auf der Seite — und zwar dort, wo das Ziel steht',
    Math.abs(mit.rolle - sollRolle) < 40, JSON.stringify({ ...mit, soll: Math.round(sollRolle) }));
  p('… also deutlich weiter unten als ohne Stelle',
    mit.rolle > ohne.rolle + 200, JSON.stringify({ ohne: ohne.rolle, mit: mit.rolle }));
}

/* ═══ §3 Eine gedrehte Seite ═══════════════════════════════════════════════ */
console.log('\n§3 Eine gedrehte Seite zeigt ihre Verweise');
{
  const r = await s.evaluate(async (id: string) => {
    const erste = DocumentMode.documentsIn(Store.getBlock(id))[0];
    Store.updateBlock(erste.id, { gedreht: 90 });
    await Store.flush();
    App.oeffne(id);
    await new Promise(r2 => setTimeout(r2, 1600));
    document.querySelector<HTMLElement>('[data-document-action="read"]')?.click();
    await new Promise(r2 => setTimeout(r2, 900));
    const stand = document.querySelector<HTMLElement>('.document-stage[data-stand-nr="0"]');
    const schicht = stand?.querySelector<HTMLElement>('.document-verweise');
    const papier = stand?.querySelector<HTMLElement>('.blatt-papier');
    const huelle = stand?.querySelector<HTMLElement>('.blatt-dreh');
    const sr = schicht?.getBoundingClientRect(), pr = papier?.getBoundingClientRect();
    return { gedreht: Number(Store.getBlock(erste.id).gedreht),
      huelleDa: !!huelle, schichtDa: !!schicht,
      anzahl: schicht?.querySelectorAll('.document-verweis').length ?? 0,
      imPapier: !!schicht && schicht.parentElement === papier,
      /* Beide sind vom selben  gedreht, also müssen ihre
         gemessenen Kästen aufeinanderliegen. Der Rahmen des Papiers ist
         ein Pixel je Seite — die Schicht liegt im INNENkasten, also darf
         sie zwei Pixel kleiner sein. */
      quer: !!sr && !!pr && Math.abs(sr.width - pr.width) <= 2.5 && Math.abs(sr.height - pr.height) <= 2.5,
      papierQuer: !!pr && pr.width > pr.height };
  }, seiteId);
  gleich('Die Seite steht auf 90°', r.gedreht, 90);
  p('Sie hat ihre Drehhülle', r.huelleDa === true, JSON.stringify(r));
  p('Und ihre Verweisschicht ist da — vier Kästen', r.schichtDa && r.anzahl === 4, JSON.stringify(r));
  p('… sie liegt IM Papier (E481) und deckt es', r.imPapier === true && r.quer === true, JSON.stringify(r));
  p('… und das Papier steht wirklich quer', r.papierQuer === true, JSON.stringify(r));
}
await s.close();

console.log('\n§4 Quellen');
p('Der Leser liest /XYZ, /FitH und /FitR',
  /art === 'XYZ' \? ziel\[3\]/.test(lies('src/bereiche/pdf/leser.ts'))
  && /zielY\?: number/.test(lies('src/bereiche/pdf/leser.ts')));
p('Das Studio trägt die Stelle am Knopf und rollt dorthin',
  /documentStelle/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Die Schicht liegt im Papier',
  /papier\.appendChild\(schicht\);/.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /\.document-verweise\{position:absolute; inset:0;/.test(lies('quell/schale/stil/bausteine.css')));
p('Das erzeugte JS trägt es',
  /documentStelle/.test(lies('quell/bereiche/pdf/document-mode.js'))
  && /zielY/.test(lies('quell/bereiche/pdf/leser.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
