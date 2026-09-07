/* Suite 441 — Suche und Verweise im Dokument: Textschicht mit Lage, Treffer, PDF-Verweise, eigene Verweise (E468)
 * ============================================================================
 * Vierter Bogen aus Redurs Auftrag vom 7. September (E465): was GoodNotes'
 * Suche im Dokument und seine Links können.
 *
 *   §1 DER LESER: `textMitLage` gibt jedes Stück mit Kasten in Blattpunkten,
 *      `verweise` die Link-Anmerkungen — nach draussen und ins Dokument.
 *   §2 DIE SUCHE IM STUDIO: 🔍 klappt die Leiste auf, ein Wort findet seine
 *      Stellen, Enter springt von Treffer zu Treffer, die Treffer sitzen
 *      DORT, wo der Text steht; Strg F öffnet, Escape schliesst.
 *   §3 DIE VERWEISE DER PDF: als Schicht über der Seite — eine Adresse als
 *      Link mit noopener, ein Ziel im Dokument als Sprung; beim Annotieren
 *      weg.
 *   §4 EIGENE VERWEISE: der Auswahl eine Adresse oder [[eine Seite]] geben;
 *      im Lesemodus antippen öffnet sie.
 *   §5 SICHERHEIT (§19): javascript: wird kein Verweis; leer nimmt ihn weg.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → in `suchen` (document-mode.ts) jeden Treffer ohne Kasten anlegen:
 *        die Treffer haben keine Lage mehr. Gelaufen am 7. September, rot.
 *   §5 → in `verweisSetzen` (marken.ts) die Prüfung mit `Sanitize.url`
 *        auslassen: `javascript:` wird ein Verweis. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test441.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const PdfLeser: any; declare const PdfEinlesen: any; declare const Dialog: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9561;
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

/* EINE ECHTE PDF MIT TEXT UND ZWEI LINK-ANMERKUNGEN, von Hand gebaut wie in
   test437: Seite 1 mit „Ohm, Ohm, Ohm", einem Verweis nach draussen und
   einem auf Seite 2. Keine Bibliothek — pdf.js liest sie wie jede andere. */
const pdfBytes = (): Buffer => {
  const objs: string[] = [];
  objs.push('<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>');                      // 1
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');                // 2
  const s1 = 'BT /F1 24 Tf 50 770 Td (Reihenschaltung: R = R1 + R2) Tj ET\n' +
             'BT /F1 14 Tf 50 700 Td (Ohm, Ohm, Ohm) Tj ET\n' +
             'BT /F1 12 Tf 50 650 Td (Weiter zu Seite 2) Tj ET\n';
  objs.push(`<< /Length ${Buffer.byteLength(s1)} >>\nstream\n${s1}endstream`);        // 3
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 3 0 R /Annots [7 0 R 8 0 R] >>'); // 4
  const s2 = 'BT /F1 24 Tf 50 770 Td (Kapitel 2: Parallelschaltung) Tj ET\n';
  objs.push(`<< /Length ${Buffer.byteLength(s2)} >>\nstream\n${s2}endstream`);        // 5
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 5 0 R >>'); // 6
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 640 200 665] /Border [0 0 0] /A << /S /URI /URI (https://example.org/ohm) >> >>'); // 7
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 690 200 715] /Border [0 0 0] /Dest [6 0 R /XYZ 0 842 0] >>'); // 8
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');                                     // 9
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};
const PDF64 = pdfBytes().toString('base64');

const browser = await chromium.launch();
const fehler: string[] = [];

const frisch = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1360, height: 900 } });
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
  return s;
};
const lage = (s: Page) => s.evaluate(() => ({
  leiste: !(document.querySelector<HTMLElement>('.document-findbar')?.hidden ?? true),
  zahl: document.querySelector('.document-find-zahl')?.textContent || '',
  position: document.querySelector('.document-position')?.textContent || '',
  treffer: [...document.querySelectorAll<HTMLElement>('.document-treffer')].map(t => ({
    stand: t.closest<HTMLElement>('.document-stage')?.dataset.standNr, links: t.style.left, oben: t.style.top, aktiv: t.classList.contains('ist-aktiv'), seite: t.classList.contains('ist-seite') })),
  fokus: document.activeElement?.getAttribute('data-document-find') !== null && document.activeElement?.tagName === 'INPUT'
}));

/* ═══ §1 Der Leser ═════════════════════════════════════════════════════════ */
console.log('\n§1 Der Leser: Text mit Lage, Verweise');
const s = await frisch();
{
  const r = await s.evaluate(async (b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const griff = await PdfLeser.oeffne(bytes);
    const stuecke = await griff.textMitLage(1);
    const verweise = await griff.verweise(1);
    const text = await griff.text(1);
    griff.schliessen();
    return { stuecke, verweise, text };
  }, PDF64);
  const ohm = r.stuecke.find((x: any) => String(x.s).includes('Ohm'));
  p('Der Text hat Stücke mit Kasten in Blattpunkten', r.stuecke.length >= 3 && !!ohm, JSON.stringify(r.stuecke.slice(0, 4)));
  p('„Ohm, Ohm, Ohm" steht bei x≈50, oben ≈ 128 (842 − 700 − 14), 14 hoch',
    !!ohm && Math.abs(ohm.x - 50) < 2 && Math.abs(ohm.y - 128) < 4 && Math.abs(ohm.h - 14) < 2 && ohm.w > 60, JSON.stringify(ohm));
  gleich('Zwei Verweise auf Seite 1', r.verweise.length, 2);
  const aussen = r.verweise.find((v: any) => v.url), innen = r.verweise.find((v: any) => v.seite);
  p('… einer nach draussen, mit Kasten [50, 177, 150, 25]', !!aussen && aussen.url === 'https://example.org/ohm' &&
    Math.abs(aussen.x - 50) < 1 && Math.abs(aussen.y - 177) < 1 && Math.abs(aussen.w - 150) < 1 && Math.abs(aussen.h - 25) < 1, JSON.stringify(aussen));
  p('… einer auf Seite 2', !!innen && innen.seite === 2, JSON.stringify(innen));
  p('`text` bleibt, was es war (E107)', /Reihenschaltung/.test(r.text) && /Ohm, Ohm, Ohm/.test(r.text));
}

/* ═══ §2 Die Suche im Studio ═══════════════════════════════════════════════ */
console.log('\n§2 Die Suche im Studio');
const seiteId = await s.evaluate(async (b64: string) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const seite = Store.addPage(null, { text: 'Skript mit Verweisen', icon: '📕' });
  await PdfEinlesen.alsSeiten(new File([bytes], 'skript.pdf', { type: 'application/pdf' }), seite.id, { anordnung: 'untereinander', ueberGrenze: 'alle' });
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1500));
  return seite.id as string;
}, PDF64);
{
  gleich('Die PDF ist als zwei Seiten im Studio', await s.evaluate((id: string) => DocumentMode.documentsIn(Store.getBlock(id)).map((b: any) => b.type + b.nr), seiteId), ['pdfseite1', 'pdfseite2']);
  gleich('Die Suchleiste ist zu, der Knopf sagt es', await s.evaluate(() => [!(document.querySelector<HTMLElement>('.document-findbar')?.hidden ?? true), document.querySelector('[data-document-action="find"]')?.getAttribute('aria-expanded')]), [false, 'false']);
  await s.click('[data-document-action="find"]');
  await s.waitForTimeout(200);
  let l = await lage(s);
  p('🔍 klappt die Leiste auf, das Feld hat den Fokus', l.leiste && l.fokus, JSON.stringify(l));
  await s.fill('.document-findbar input', 'ohm');
  await s.waitForTimeout(900);
  l = await lage(s);
  gleich('„ohm" findet drei Stellen', l.zahl, '3 Treffer');
  /* DREI KÄSTEN, DREI WÖRTER: der erste bei x ≈ 8 % (50 von 595), die
     anderen weiter rechts in derselben Zeile — nicht ein Kasten über der
     ganzen Zeile (das Bild vom 7. September zeigte den). */
  const x = l.treffer.map(t => parseFloat(t.links));
  p('… alle auf Seite 1, der erste bei x ≈ 8 % (50 von 595), die anderen rechts davon, auf einer Höhe',
    l.treffer.length === 3 && l.treffer.every(t => t.stand === '0' && !t.seite) && Math.abs(x[0]! - 8.4) < 1.5 && x[1]! > x[0]! + 4 && x[2]! > x[1]! + 4 &&
    new Set(l.treffer.map(t => t.oben)).size === 1 && parseFloat(l.treffer[0]!.oben) > 14 && parseFloat(l.treffer[0]!.oben) < 17, JSON.stringify(l.treffer));
  p('Noch keiner ist der aktive', l.treffer.every(t => !t.aktiv));
  await s.press('.document-findbar input', 'Enter');
  await s.waitForTimeout(300);
  l = await lage(s);
  p('Enter: der erste ist aktiv, die Zahl sagt 1/3', l.zahl === '1/3' && l.treffer.filter(t => t.aktiv).length === 1 && l.treffer[0]!.aktiv, JSON.stringify(l));
  await s.press('.document-findbar input', 'Enter');
  await s.waitForTimeout(200);
  gleich('Nochmal Enter: 2/3', (await lage(s)).zahl, '2/3');
  await s.press('.document-findbar input', 'Shift+Enter');
  await s.waitForTimeout(200);
  gleich('Umschalt+Enter: zurück auf 1/3', (await lage(s)).zahl, '1/3');
  await s.fill('.document-findbar input', 'parallel');
  await s.waitForTimeout(900);
  await s.press('.document-findbar input', 'Enter');
  await s.waitForTimeout(500);
  l = await lage(s);
  p('„parallel" steht auf Seite 2 — Enter springt hin, der Treffer steht dort', l.zahl === '1/1' && l.position === 'Seite 2/2' && l.treffer.some(t => t.stand === '1' && t.aktiv), JSON.stringify(l));
  await s.fill('.document-findbar input', 'xyzzy');
  await s.waitForTimeout(700);
  gleich('Nichts gefunden sagt es', (await lage(s)).zahl, 'Nichts gefunden');
  await s.press('.document-findbar input', 'Escape');
  await s.waitForTimeout(200);
  l = await lage(s);
  p('Escape schliesst die Leiste und nimmt die Treffer weg', !l.leiste && l.treffer.length === 0, JSON.stringify(l));
  await s.click('.document-center');
  await s.keyboard.press('Control+f');
  await s.waitForTimeout(200);
  l = await lage(s);
  p('Strg F öffnet sie wieder, mit Fokus im Feld', l.leiste && l.fokus, JSON.stringify(l));
  await s.press('.document-findbar input', 'Escape');
}

/* ═══ §3 Die Verweise der PDF ══════════════════════════════════════════════ */
console.log('\n§3 Die Verweise der PDF');
{
  /* Im LESEMODUS — beim Annotieren ist die Schicht mit Absicht weg. */
  await s.evaluate(() => { document.querySelector<HTMLElement>('[data-document-action="read"]')?.click(); document.querySelector<HTMLElement>('.document-thumbnails [data-document-index="0"]')?.click(); });
  await s.waitForTimeout(600);
  const v = await s.evaluate(() => {
    const stand = document.querySelector<HTMLElement>('.document-stage[data-stand-nr="0"]');
    const schicht = stand?.querySelector<HTMLElement>('.document-verweise');
    const papier = stand?.querySelector<HTMLElement>('.blatt-papier');
    const a = schicht?.querySelector<HTMLAnchorElement>('a.document-verweis');
    const k = schicht?.querySelector<HTMLButtonElement>('button.document-verweis');
    const sr = schicht?.getBoundingClientRect(), pr = papier?.getBoundingClientRect();
    return { da: !!schicht, anzahl: schicht?.querySelectorAll('.document-verweis').length,
      href: a?.getAttribute('href'), target: a?.target, rel: a?.rel, ziel: k?.dataset.documentIndex,
      /* SEIT E481 LIEGT SIE IM PAPIER, mit `inset:0` — also auf dessen
         INNENKASTEN, nicht auf dem Rahmen darum. Das ist die richtigere
         Deckung: das Seitenbild liegt auch im Innenkasten, und die
         Prozentwerte der Verweise beziehen sich darauf. Gemessen wird
         deshalb gegen `clientWidth` und den Rahmen als Versatz. */
      deckt: !!sr && !!pr && !!papier
        && Math.abs(sr.left - (pr.left + papier.clientLeft)) < 1.5
        && Math.abs(sr.top - (pr.top + papier.clientTop)) < 1.5
        && Math.abs(sr.width - papier.clientWidth) < 1.5,
      imPapier: !!schicht && schicht.parentElement === papier,
      links: a?.style.left, oben: a?.style.top, display: schicht ? getComputedStyle(schicht).display : null,
      modus: document.querySelector<HTMLElement>('.document-workspace')?.dataset.documentTools };
  });
  gleich('Zwei Verweise liegen über Seite 1', v.anzahl, 2);
  p('… der nach draussen als Link mit noopener', v.href === 'https://example.org/ohm' && v.target === '_blank' && /noopener/.test(String(v.rel)), JSON.stringify(v));
  gleich('… der ins Dokument als Sprung auf Seite 2', v.ziel, '1');
  p('Die Schicht deckt genau das Papier', v.deckt, JSON.stringify(v));
  p('… und liegt IM Papier, nicht daneben (E481)', v.imPapier === true, JSON.stringify(v));
  p('Der Kasten sitzt bei x ≈ 8 %, oben ≈ 21 % (177 von 842)', Math.abs(parseFloat(String(v.links)) - 8.4) < 1 && Math.abs(parseFloat(String(v.oben)) - 21) < 1, JSON.stringify([v.links, v.oben]));
  p('Im Lesemodus ist sie da', v.modus === 'closed' && v.display !== 'none', JSON.stringify([v.modus, v.display]));
  await s.click('.document-stage[data-stand-nr="0"] button.document-verweis');
  await s.waitForTimeout(500);
  gleich('Ein Tipp auf den inneren Verweis führt zu Seite 2', (await lage(s)).position, 'Seite 2/2');
  await s.evaluate(() => { document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click(); });
  await s.waitForTimeout(300);
  gleich('Beim Annotieren ist die Schicht weg — sie finge sonst den Stift', await s.evaluate(() => getComputedStyle(document.querySelector('.document-stage[data-stand-nr="0"] .document-verweise')!).display), 'none');
  await s.evaluate(() => { document.querySelector<HTMLElement>('[data-document-action="read"]')?.click(); });
  await s.waitForTimeout(300);
  p('… und im Lesemodus wieder da', await s.evaluate(() => getComputedStyle(document.querySelector('.document-stage[data-stand-nr="0"] .document-verweise')!).display !== 'none'));
}

/* ═══ §4 Eigene Verweise ═══════════════════════════════════════════════════ */
console.log('\n§4 Eigene Verweise');
const blattSeite = await s.evaluate(async () => {
  Store.addPage(null, { text: 'Zielseite', icon: '🎯' });
  const seite = Store.addPage(null, { text: 'Aufgabenblatt', icon: '📝' });
  const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
    marken: [{ id: 'r1', art: 'rectangle', farbe: '#d64545', breite: 2.4, pts: [[100, 200], [300, 300]] }] });
  Store.addBlock(b.id, 'text', { text: '' });
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1200));
  document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click();
  await new Promise(r => setTimeout(r, 300));
  return seite.id as string;
});
/** Eine Marke im Studio wählen: Auswahlwerkzeug, dann ein Tipp in ihre Mitte. */
const waehle = async (sid: string, x: number, y: number): Promise<void> => {
  await s.evaluate(([sid, x, y]: [string, number, number]) => {
    document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-wz="select"]')?.click();
    const f = document.querySelector<SVGSVGElement>('.document-stage[data-aktiv] svg.blatt-marken')!;
    const pt = f.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(f.getScreenCTM()!);
    const el = f.querySelector('[data-sid="' + sid + '"]') || f;
    const ev = (typ: string) => new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
      pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1 });
    el.dispatchEvent(ev('pointerdown')); f.dispatchEvent(ev('pointerup'));
  }, [sid, x, y] as [string, number, number]);
  await s.waitForTimeout(300);
};
const marke = (id: string) => s.evaluate((id: string) => {
  const b = DocumentMode.documentsIn(Store.getBlock(App.aktuelleSeite()))[0];
  const m = (b.marken || []).find((x: any) => x.id === id);
  const n = document.querySelector<SVGElement>('.blatt-marken [data-sid="' + id + '"]');
  return { href: m?.href, zielSeite: m?.zielSeite, verweis: n?.getAttribute('data-verweis'), zeiger: n?.getAttribute('pointer-events'), titel: n?.querySelector('title')?.textContent };
}, id);
{
  await waehle('r1', 200, 250);
  gleich('Das Rechteck ist gewählt, der Verweis-Knopf frei', await s.evaluate(() => [document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length, (document.querySelector('.document-stage[data-aktiv] .blatt-werk [data-act="verweis"]') as HTMLButtonElement)?.disabled]), [1, false]);
  await s.evaluate(() => { Dialog.frage = async () => 'https://example.org/aufgabe'; document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-act="verweis"]')?.click(); });
  await s.waitForTimeout(500);
  let m = await marke('r1');
  p('Die Adresse hängt an der Marke; der Knoten ist greifbar und sagt sie', m.href === 'https://example.org/aufgabe' && m.verweis === 'aussen' && m.zeiger === 'all' && m.titel === 'https://example.org/aufgabe', JSON.stringify(m));
  await s.evaluate(() => { (window as any).__geoeffnet = null; window.open = ((u: string) => { (window as any).__geoeffnet = u; return null; }) as any; document.querySelector<HTMLElement>('[data-document-action="read"]')?.click(); });
  await s.waitForTimeout(300);
  await s.evaluate(() => { document.querySelector<SVGElement>('.blatt-marken [data-sid="r1"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });
  await s.waitForTimeout(200);
  gleich('Im Lesemodus öffnet ein Tipp die Adresse (neues Fenster, noopener)', await s.evaluate(() => (window as any).__geoeffnet), 'https://example.org/aufgabe');
  await s.evaluate(() => { document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click(); });
  await s.waitForTimeout(300);
  await waehle('r1', 200, 250);
  await s.evaluate(() => { Dialog.frage = async () => '[[Zielseite]]'; document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-act="verweis"]')?.click(); });
  await s.waitForTimeout(500);
  m = await marke('r1');
  const zielId = await s.evaluate(() => (Object.values(Store.cache.blocks) as any[]).find((x: any) => x.type === 'page' && x.text === 'Zielseite')?.id);
  p('[[Zielseite]] wird die Kennung der Seite, die Adresse ist weg', !!zielId && m.zielSeite === zielId && m.href === undefined && m.verweis === 'seite' && /Zielseite/.test(String(m.titel)), JSON.stringify(m));
  await s.evaluate(() => { document.querySelector<HTMLElement>('[data-document-action="read"]')?.click(); });
  await s.waitForTimeout(300);
  await s.evaluate(() => { document.querySelector<SVGElement>('.blatt-marken [data-sid="r1"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });
  await s.waitForTimeout(600);
  gleich('Ein Tipp öffnet die Zielseite', await s.evaluate(() => App.aktuelleSeite()), zielId);
}

/* ═══ §5 Sicherheit ════════════════════════════════════════════════════════ */
console.log('\n§5 Sicherheit (§19)');
{
  await s.evaluate(async (id: string) => { App.oeffne(id); await new Promise(r => setTimeout(r, 900)); document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click(); await new Promise(r => setTimeout(r, 300)); }, blattSeite);
  await waehle('r1', 200, 250);
  await s.evaluate(() => { Dialog.frage = async () => 'javascript:alert(1)'; document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-act="verweis"]')?.click(); });
  await s.waitForTimeout(500);
  let m = await marke('r1');
  p('javascript: wird kein Verweis — die Seite bleibt das Ziel', m.href === undefined && !!m.zielSeite, JSON.stringify(m));
  await s.evaluate(() => { Dialog.frage = async () => 'data:text/html,hallo'; document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-act="verweis"]')?.click(); });
  await s.waitForTimeout(500);
  m = await marke('r1');
  p('data: auch nicht', m.href === undefined && !!m.zielSeite, JSON.stringify(m));
  await s.evaluate(() => { Dialog.frage = async () => ''; document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk [data-act="verweis"]')?.click(); });
  await s.waitForTimeout(500);
  m = await marke('r1');
  p('Leer nimmt den Verweis weg', m.href === undefined && m.zielSeite === undefined && m.verweis === null, JSON.stringify(m));
}
await s.close();

/* ═══ §6 Eingebunden ═══════════════════════════════════════════════════════ */
console.log('\n§6 Eingebunden');
{
  p('Der Leser kennt textMitLage und verweise', /textMitLage, verweise, schliessen/.test(lies('src/bereiche/pdf/leser.ts')));
  p('pdf.js liest die Anmerkungen ohne eval (§19)', /getAnnotations\(\)/.test(lies('src/bereiche/pdf/leser.ts')) && /isEvalSupported: false/.test(lies('src/bereiche/pdf/leser.ts')));
  p('Der Verweis prüft mit Sanitize.url und lässt nur http, https, mailto', /Sanitize\.url\(wert\)/.test(lies('src/bereiche/pdf/marken.ts')) && /\^\(https\?:\|mailto:\)/.test(lies('src/bereiche/pdf/marken.ts')));
  p('Das Stilblatt kennt Suchleiste, Treffer und Verweisschicht', /\.document-findbar\{/.test(lies('quell/schale/stil/bausteine.css')) && /\.document-treffer\{/.test(lies('quell/schale/stil/bausteine.css')) && /\.document-verweise\{/.test(lies('quell/schale/stil/bausteine.css')));
}

console.log('\n§7 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
