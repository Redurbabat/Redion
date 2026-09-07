/* Suite 457 — Treffer und Verweise sitzen genauer (E484)
 * ============================================================================
 * Zwei Näherungen aus L133, beide „stimmt ungefähr" — und ungefähr ist
 * bei einem Treffer zu wenig:
 *
 *   · „Treffer-Kästen sind eine Näherung — anteilig nach Zeichen im Stück
 *     der Textebene, nicht gemessen; bei sehr ungleichen Buchstaben
 *     („iiii" neben „WWWW") sitzt der Kasten ein paar Punkte daneben."
 *   · „Verweise auf Striche antippen — ein Strich trägt seinen Verweis,
 *     ist aber dünn; ein Kasten um ihn ist der bessere Träger."
 *
 * Der Kasten wäre allerdings falsch: ein Bogen über eine halbe Seite
 * hätte einen Kasten über die halbe Seite, und der finge alles ein, was
 * daneben steht — dieselbe Lehre wie E476. Also derselbe WEG, nur
 * breiter: eine durchsichtige Kopie des Pfades mit 24 Punkten Strich.
 *
 *   §1 DER TREFFERKASTEN wird gemessen: bei „iiiiWWWW" sitzt der Treffer
 *      auf „WWWW" rechts und nicht in der Mitte.
 *   §2 EIN VERWEIS AM STRICH hat eine Trefffläche — zehn Punkte daneben
 *      trifft ihn noch, hundert nicht mehr.
 *   §3 OHNE VERWEIS bleibt der Strich, was er war.
 *   §4 EINE FORM bekommt kein Feld — sie ist seit E353 in ihrer Fläche
 *      greifbar.
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `anteil` wieder durch `bis/len` ersetzen: der Kasten sitzt in der
 *        Mitte. Gelaufen, rot.
 *   §2 → das Trefffeld nicht anlegen: daneben trifft nichts mehr.
 *        Gelaufen, rot.
 *
 *   node pruefungen/lauf/test457.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const PdfEinlesen: any;
declare const PdfLeser: any; declare const Dateien: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9577;
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

/* Eine PDF mit einem Stück Text, in dem schmale und breite Buchstaben
   nebeneinander stehen — genau der Fall aus L133. */
const pdfBytes = (): Buffer => {
  const objs: string[] = [];
  objs.push('<< /Type /Pages /Count 1 /Kids [4 0 R] >>');
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const s1 = 'BT /F1 24 Tf 50 700 Td (iiiiWWWW) Tj ET\n';
  objs.push(`<< /Length ${Buffer.byteLength(s1)} >>\nstream\n${s1}endstream`);
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 3 0 R >>');
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

/* ═══ §1 Der Trefferkasten wird gemessen ═══════════════════════════════════ */
console.log('\n§1 Der Trefferkasten wird gemessen, nicht gezählt');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof PdfEinlesen !== 'undefined'");
  await s.evaluate(async (b64: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const seite = Store.addPage(null, { text: 'Breite Buchstaben', icon: '📕' });
    await PdfEinlesen.alsSeiten(new File([bytes], 'breit.pdf', { type: 'application/pdf' }),
      seite.id, { anordnung: 'untereinander', ueberGrenze: 'alle' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1600));
    document.querySelector<HTMLElement>('[data-document-action="read"]')?.click();
    await new Promise(r => setTimeout(r, 700));
  }, PDF64);
  /* Was die Messung sagt: „iiii" ist viel schmaler als „WWWW". */
  const anteil = Number(await s.evaluate(`(() => {
    const ganz = InkGeometry.textWidth('iiiiWWWW', 1);
    return InkGeometry.textWidth('iiii', 1) / ganz;
  })()`));
  p('Gemessen macht „iiii" weniger als ein Drittel des Stücks aus (gezählt wären es 50 %)',
    anteil > 0.05 && anteil < 0.34, String(Math.round(anteil * 1000) / 1000));
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-find-button')?.click());
  await s.waitForTimeout(400);
  await s.evaluate(() => {
    const f = document.querySelector<HTMLInputElement>('[data-document-find]')!;
    f.value = 'WWWW'; f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await s.waitForTimeout(1400);
  const t = JSON.parse(await s.evaluate(`(() => {
    const e = document.querySelector('.document-treffer');
    return JSON.stringify(e ? { links: parseFloat(e.style.left), breit: parseFloat(e.style.width) } : null);
  })()`) as string);
  p('Es gibt einen Treffer', !!t, JSON.stringify(t));
  /* Das Stück beginnt bei x = 50 von 595 (8,4 %) und ist rund 22 % breit.
     „WWWW" beginnt also NICHT in seiner Mitte, sondern im ersten Drittel
     dahinter — bei rund 12 % der Seite statt bei rund 14,5 %. */
  /* DAS STÜCK SELBST MESSEN statt Zahlen hinschreiben: der Leser sagt,
     wo es steht und wie breit es ist. So bleibt die Prüfung richtig, auch
     wenn jemand die Schriftgrösse der Probe-PDF ändert. */
  const stueck = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'pdfseite');
    return JSON.stringify({ suchtext: String(b.suchtext || '').slice(0, 20) });
  })()`) as string);
  p('Die Seite trägt den Text', /iiiiWWWW/.test(String(stueck.suchtext)), JSON.stringify(stueck));
  const lage = JSON.parse(await s.evaluate(`(async () => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'pdfseite');
    const roh = await Dateien.alsBlob(b.quelleId);
    const griff = await PdfLeser.oeffne(new Uint8Array(await roh.arrayBuffer()));
    const st = (await griff.textMitLage(1)).find(x => /iiiiWWWW/.test(String(x.s)));
    griff.schliessen();
    return JSON.stringify({ x: st.x / 595 * 100, w: st.w / 595 * 100 });
  })()`) as string);
  const gezaehlt = lage.x + lage.w * 0.5;      /* was die alte Rechnung ergäbe */
  const gemessen = lage.x + lage.w * anteil;   /* was die Messung ergibt */
  p('Der Kasten sitzt näher an der Messung als an der Zählung',
    !!t && Math.abs(t.links - gemessen) < Math.abs(t.links - gezaehlt),
    JSON.stringify({ ist: t?.links, gemessen: Math.round(gemessen * 10) / 10, gezaehlt: Math.round(gezaehlt * 10) / 10 }));
  p('… und er reicht bis ans Ende des Stücks',
    !!t && Math.abs((t.links + t.breit) - (lage.x + lage.w)) < 1.5,
    JSON.stringify({ ende: t ? Math.round((t.links + t.breit) * 10) / 10 : null,
                     stueckEnde: Math.round((lage.x + lage.w) * 10) / 10 }));
  await s.close();
}

/* ═══ §2 Ein Verweis am Strich ═════════════════════════════════════════════ */
console.log('\n§2 Ein Verweis am Strich hat eine Trefffläche');
const mitBlatt = async (marken: unknown[]): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async (marken: unknown[]) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Verweisblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken });
    await Store.flush();
    App.oeffne(seite.id);
  }, marken);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};
{
  const s = await mitBlatt([
    { id: 'mitVerweis', art: 'stift', farbe: '#2f7ed8', breite: 2, href: 'https://example.org/x',
      pts: [[100, 200], [200, 200], [300, 200]], pressure: [0.6, 0.6, 0.6] },
    { id: 'ohne', art: 'stift', farbe: '#111111', breite: 2,
      pts: [[100, 500], [200, 500], [300, 500]], pressure: [0.6, 0.6, 0.6] }
  ]);
  const bau = JSON.parse(await s.evaluate(`(() => {
    const mit = document.querySelector('.blatt-marken [data-sid="mitVerweis"]');
    const ohne = document.querySelector('.blatt-marken [data-sid="ohne"]');
    return JSON.stringify({
      mitTag: mit ? mit.tagName.toLowerCase() : null,
      feld: mit ? mit.querySelectorAll('.blatt-verweisfeld').length : 0,
      feldBreite: mit && mit.querySelector('.blatt-verweisfeld')
        ? mit.querySelector('.blatt-verweisfeld').getAttribute('stroke-width') : null,
      feldFarbe: mit && mit.querySelector('.blatt-verweisfeld')
        ? mit.querySelector('.blatt-verweisfeld').getAttribute('stroke') : null,
      verweis: mit ? mit.getAttribute('data-verweis') : null,
      ohneTag: ohne ? ohne.tagName.toLowerCase() : null,
      ohneFeld: ohne ? ohne.querySelectorAll('.blatt-verweisfeld').length : 0
    });
  })()`) as string);
  gleich('Der Strich mit Verweis steht in einer Gruppe', bau.mitTag, 'g');
  gleich('… mit genau einem Trefffeld', bau.feld, 1);
  gleich('… 24 Punkte breit', bau.feldBreite, '24');
  gleich('… und durchsichtig — es malt nichts', bau.feldFarbe, 'transparent');
  gleich('Die Kennung sitzt an der Gruppe, der Verweis auch', bau.verweis, 'aussen');

  /* Und der Tipp: zehn Punkte neben dem Strich. */
  const treffer = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('svg.blatt-marken');
    const ctm = f.getScreenCTM();
    const px = (x, y) => { const pt = f.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(ctm); };
    const probe = (x, y) => {
      const c = px(x, y);
      const el = document.elementFromPoint(c.x, c.y);
      return !!(el && el.closest && el.closest('[data-sid="mitVerweis"]'));
    };
    return JSON.stringify({ drauf: probe(200, 200), knapp: probe(200, 210),
      zwanzig: probe(200, 220), weit: probe(200, 300) });
  })()`) as string);
  p('Auf dem Strich trifft es', treffer.drauf === true, JSON.stringify(treffer));
  p('Zehn Punkte daneben auch — das war vorher zu weit', treffer.knapp === true, JSON.stringify(treffer));
  /* Das Feld ist 24 breit und liegt auf dem UMRISS des Strichs — es
     reicht also rund zwölf Punkte über dessen Mitte hinaus, nicht weiter.
     Gemessen: zehn treffen, zwanzig nicht. Die Grenze dazwischen genau zu
     behaupten wäre eine Zahl, die vom Rundungsverhalten des Browsers
     abhängt und beim nächsten Bildschirm anders läge. */
  p('Zwanzig Punkte daneben nicht mehr', treffer.zwanzig === false, JSON.stringify(treffer));
  p('Hundert erst recht nicht — die Fläche ist begrenzt', treffer.weit === false, JSON.stringify(treffer));
  await s.close();
}

/* ═══ §3 und §4 ════════════════════════════════════════════════════════════ */
console.log('\n§3 Ohne Verweis bleibt alles, wie es war');
{
  const s = await mitBlatt([
    { id: 'ohne', art: 'stift', farbe: '#111111', breite: 2, pts: [[100, 500], [300, 500]], pressure: [0.6, 0.6] },
    { id: 'formMit', art: 'rectangle', farbe: '#2f7ed8', breite: 3, href: 'https://example.org/y',
      pts: [[100, 600], [300, 700]] }
  ]);
  const r = JSON.parse(await s.evaluate(`(() => {
    const ohne = document.querySelector('.blatt-marken [data-sid="ohne"]');
    const form = document.querySelector('.blatt-marken [data-sid="formMit"]');
    return JSON.stringify({
      ohneTag: ohne ? ohne.tagName.toLowerCase() : null,
      ohneFeld: ohne ? ohne.querySelectorAll('.blatt-verweisfeld').length : 0,
      formTag: form ? form.tagName.toLowerCase() : null,
      formFeld: form ? form.querySelectorAll('.blatt-verweisfeld').length : 0,
      formTreffer: form ? form.getAttribute('pointer-events') : null });
  })()`) as string);
  gleich('Ein Strich ohne Verweis bleibt ein Pfad', r.ohneTag, 'path');
  gleich('… ohne Trefffeld', r.ohneFeld, 0);
  console.log('\n§4 Eine Form braucht kein Feld');
  gleich('Ein Rechteck mit Verweis bleibt ein Rechteck', r.formTag, 'rect');
  gleich('… ohne Trefffeld', r.formFeld, 0);
  gleich('… und ist in seiner Fläche greifbar (E353)', r.formTreffer, 'all');
  await s.close();
}

console.log('\n§5 Quellen');
p('Das Trefffeld steht in `marken.ts`',
  /class', 'blatt-verweisfeld'/.test(lies('src/bereiche/pdf/marken.ts'))
  && /cloneNode\(false\) as SVGElement/.test(lies('src/bereiche/pdf/marken.ts')));
p('Der Trefferkasten wird gemessen',
  /const anteil = \(text: string, bis2: number\): number/.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /InkGeometry\.textWidth\(text\.slice\(0, bis2\), 1\)/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Das erzeugte JS trägt beides',
  /blatt-verweisfeld/.test(lies('quell/bereiche/pdf/marken.js'))
  && /textWidth/.test(lies('quell/bereiche/pdf/document-mode.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
