/* Suite 626 — Ein gemerkter Platz «links» oder «rechts» zerlegt den Dock nicht (E764)
 * ============================================================================
 * Redur, 31. Oktober 2026, Windows-App, mit zwei Bildern des Schreibstudios
 * (eine PDF, Werkzeug Füller):
 *
 *   „wieso ist es bei pdf zeichenn so es sieht nich so gut auch"
 *
 * Auf dem Bild stand unten im Dock: neun Pastelltupfer (die Haftnotizfarben,
 * gestaucht zu Ovalen) und dahinter EIN Knopf „Füller", der die ganze übrige
 * Leiste füllte. Kugelschreiber, Pinsel, Bleistift, Schutzleiter, Leiter, die
 * fünf Tinten, das „+", die drei Breiten, Formen, Kritzeln und das Lineal
 * waren nicht zu sehen — sie lagen rechts ausserhalb, je ein Knopf so breit
 * wie die Leiste.
 *
 * DIE URSACHE war nicht die PDF und nicht der Füller, sondern ein GEMERKTER
 * PLATZ: `zeichnen:leistenlage` = «links» oder «rechts» (E512, gewählt auf
 * einer gewöhnlichen Seite). Die Spaltenform in `bausteine.css` gab jedem
 * Knopf der Tafel `width:100%` UND `display:inline-flex` — mit dem Gewicht
 * (0,4,1), und das schlägt die Gruppenregel `.blatt-werk[data-tool] >
 * .blatt-tafel > [data-gruppe]{display:none}` (0,4,0). Also standen ALLE
 * Gruppen da (auch die Haftnotizfarben, die nach `ordnungAnwenden` ganz vorn
 * liegen), und weil das Studio die Spalte seit E619 nur in eine ZEILE
 * zurückdreht, war jeder Knopf so breit wie die ganze Leiste.
 *
 *   seit E573 (14. September, 4ac55759f): das Studio-Dock verlässt sich auf
 *       die Gruppenregel — mit «links» stehen 37 fremde Knöpfe darin;
 *   seit E619 (19. September, 7270830e3): die Zeile — jeder Knopf 1222 px.
 *   Auf einer gewöhnlichen Seite stand in der Spalte dasselbe Zuviel: beim
 *   Stift auch Formenwahl, Schrift, Auswahl, Laser, Radierer.
 *
 * DIE ZUSAGEN (echte Maus, echte PDF über die Bibliothek, 1900 × 1100 und
 * 1300 × 860, gemerkt «links» und «rechts», dazu «oben» als Vergleich):
 *
 *   §1  Kein Knopf im Dock ist breiter als 120 px.
 *   §2  Beim Stift stehen nur Stifte, Farben, Breiten, Formen-Schalter und
 *       Lineal da — keine Haftnotizfarbe, keine Formenwahl, keine Schrift,
 *       keine Auswahl, kein Laser, kein Radierer.
 *   §3  Alle sechs Stifte und die fünf Tinten stehen im Bild, und an ihrer
 *       Mitte liegt wirklich sie selbst (`elementFromPoint`).
 *   §4  Die Tinten sind rund (Breite = Höhe), nicht gestaucht.
 *   §5  Der Dock ist dieselbe Leiste wie bei «oben»: dieselben sichtbaren
 *       Knöpfe in derselben Folge — der gemerkte Platz ändert im Studio
 *       nichts (E619).
 *   §6  Marker: Farben und Breiten, keine Stifte; Haftnotiz: genau die neun
 *       Pastelle und das „+", keine Tinte.
 *   §7  Gewöhnliche Seite, Platz «links» über den Knopf: die Spalte steht
 *       weiter links am Blatt (E512 bleibt), aber auch dort gilt die
 *       Gruppenregel — beim Stift keine Formenwahl, Schrift, Auswahl.
 *   §8  Keine Seitenfehler.
 *
 * KANN ER ROT WERDEN? Gegen 214c6f5f0 (vor E764): §1 mit 42 Knöpfen zu
 * 1222 px, §2 mit 38 fremden, §3, §4, §5 und §7 rot. Gegenprobe in E764.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test626.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
  '.mjs': 'text/javascript', '.wasm': 'application/wasm'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const abschnitt = (t: string): void => console.log('\n' + t);

/* Eine echte PDF mit zwei Seiten im Querformat — wie Redurs Deckblatt. */
const pdf = (): Buffer => {
  const objs: string[] = ['<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for (let n = 1; n <= 2; n++) {
    const strom = `BT /F1 30 Tf 60 520 Td (Arbeitssicherheit ${n}) Tj ET`;
    objs.push(`<< /Length ${Buffer.byteLength(strom)} >>\nstream\n${strom}\nendstream`);
    objs.push(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 2 0 R >> >> /Contents ${objs.length} 0 R >>`);
  }
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let inhalt = '%PDF-1.4\n'; const stellen: number[] = [];
  objs.forEach((o, i) => { stellen.push(Buffer.byteLength(inhalt)); inhalt += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(inhalt);
  inhalt += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
    stellen.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  inhalt += `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(inhalt);
};

const fehler: string[] = [];
const browser: Browser = await chromium.launch();

const frisch = async (breit: number, hoch: number, lage: string | null): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: breit, height: hoch }, serviceWorkers: 'block' });
  s.setDefaultTimeout(15000);
  s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' && Store.cache.blocks");
  await s.waitForTimeout(900);
  await s.evaluate((l: string | null) => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', Math.max(...(window as any).Rundgang.NEUERUNGEN.map((n: any) => n.nr)));
    /* DER GEMERKTE PLATZ, so wie er auf Redurs Rechner liegt: in `meta`,
       gesetzt irgendwann auf einer gewöhnlichen Seite (E512). */
    if (l) Store.setMeta('zeichnen:leistenlage', l);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(e => e.remove());
  }, lage);
  return s;
};

/** Eine PDF über die Bibliothek einlesen — der Weg, den Redur geht. */
const pdfOeffnen = async (s: Page): Promise<void> => {
  await s.evaluate(() => (window as any).Bibliothek.oeffne(null));
  const wahl = s.waitForEvent('filechooser');
  await s.locator('.bib-studio-import').click();
  await (await wahl).setFiles({ name: 'Arbeitssicherheit.pdf', mimeType: 'application/pdf', buffer: pdf() });
  await s.locator('.document-workspace').waitFor({ timeout: 60000 });
  await s.waitForTimeout(1800);
};

/** Ein Werkzeug oben im Band wählen — mit der Maus, an seiner Mitte. */
const werkzeug = async (s: Page, id: string): Promise<void> => {
  const k = s.locator(`.document-drawingbar [data-document-tool="${id}"]`).first();
  const r = await k.boundingBox();
  if (!r) throw new Error('Werkzeug ' + id + ' nicht im Bild');
  await s.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await s.waitForTimeout(450);
};

type Knopf = { wort: string; gruppe: string; act: string; w: number; h: number; trifft: boolean; imBild: boolean };
/** Alles, was im Dock der aktiven Seite zu sehen ist. */
const dock = (s: Page) => s.evaluate(() => {
  const werk = document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-werk');
  if (!werk) return null;
  const r = werk.getBoundingClientRect();
  const knoepfe = [...werk.querySelectorAll<HTMLElement>('button')]
    .filter(b => { const q = b.getBoundingClientRect(); return q.width > 0 && q.height > 0 && getComputedStyle(b).visibility !== 'hidden'; })
    .map(b => {
      const q = b.getBoundingClientRect();
      const mx = q.left + q.width / 2, my = q.top + q.height / 2;
      const imBild = mx >= r.left && mx <= r.right && mx >= 0 && mx <= innerWidth && my >= 0 && my <= innerHeight;
      const oben = imBild ? document.elementFromPoint(mx, my) : null;
      return {
        wort: (b.getAttribute('aria-label') || b.title || b.textContent || '').trim().slice(0, 40),
        gruppe: b.dataset.gruppe || '', act: b.dataset.act || '',
        w: Math.round(q.width), h: Math.round(q.height),
        trifft: !!oben && (oben === b || b.contains(oben)), imBild
      };
    });
  return { tool: werk.dataset.tool || '', lage: werk.closest<HTMLElement>('.blatt-reihe')?.dataset.lage || '',
    w: Math.round(r.width), h: Math.round(r.height), unten: Math.round(r.bottom), fenster: innerHeight,
    richtung: getComputedStyle(werk).flexDirection, knoepfe };
});

const FREMD_BEIM_STIFT = ['notizfarbe', 'form', 'schrift', 'auswahl', 'laser', 'radierer', 'elemente'];
const STIFTE = ['Füller', 'Kugelschreiber', 'Pinsel', 'Bleistift', 'Schutzleiter', 'Leiter'];

for (const [breit, hoch] of [[1900, 1100], [1300, 860]] as const) {
  /* Der Vergleich: dieselbe PDF ohne gemerkten Platz. */
  const vs = await frisch(breit, hoch, null);
  await pdfOeffnen(vs); await werkzeug(vs, 'stift');
  const vergleich = await dock(vs);
  await vs.close();
  const folge = (d: NonNullable<Awaited<ReturnType<typeof dock>>>): string[] =>
    d.knoepfe.map(k => k.gruppe + ':' + k.wort);

  for (const lage of ['links', 'rechts']) {
    abschnitt(`${breit} × ${hoch}, gemerkt «${lage}» — PDF, Füller`);
    const s = await frisch(breit, hoch, lage);
    await pdfOeffnen(s); await werkzeug(s, 'stift');
    const d = await dock(s);
    if (!d) { p('Der Dock ist da', false); await s.close(); continue; }
    const zuBreit = d.knoepfe.filter(k => k.w > 120);
    p(`§1 kein Knopf breiter als 120 px`, zuBreit.length === 0,
      `${zuBreit.length} zu breit, z. B. ${zuBreit.slice(0, 3).map(k => k.wort + ' ' + k.w).join(', ')}`);
    const fremd = d.knoepfe.filter(k => FREMD_BEIM_STIFT.includes(k.gruppe));
    p(`§2 beim Stift nur sein Zubehör`, fremd.length === 0,
      `${fremd.length} fremd: ${[...new Set(fremd.map(k => k.gruppe))].join(', ')}`);
    for (const name of STIFTE) {
      const k = d.knoepfe.find(x => x.act === 'stilwahl' && x.wort.includes(name));
      p(`§3 «${name}» steht im Bild und ist zu treffen`, !!k && k.imBild && k.trifft,
        k ? `imBild ${k.imBild}, trifft ${k.trifft}, ${k.w} px` : 'nicht sichtbar');
    }
    const tinten = d.knoepfe.filter(k => k.gruppe === 'farbe' && !/neue|weitere|\+/i.test(k.wort) && k.act !== 'farbe');
    p(`§3 die fünf Tinten stehen im Bild und sind zu treffen`,
      tinten.length >= 5 && tinten.every(k => k.imBild && k.trifft),
      `${tinten.length} Tinten, ${tinten.filter(k => k.imBild && k.trifft).length} zu treffen`);
    p(`§4 die Tinten sind rund`, tinten.length >= 5 && tinten.every(k => Math.abs(k.w - k.h) <= 2),
      tinten.map(k => k.w + '×' + k.h).join(' '));
    p(`§5 eine Zeile unten, nicht höher als 120 px`,
      d.richtung === 'row' && d.h <= 120 && d.unten > d.fenster - 60, `${d.richtung} ${d.w}×${d.h}, unten ${d.unten}/${d.fenster}`);
    if (vergleich) gleich(`§5 dieselbe Leiste wie ohne gemerkten Platz`, folge(d), folge(vergleich));

    abschnitt(`${breit} × ${hoch}, «${lage}» — Marker und Haftnotiz`);
    await werkzeug(s, 'marker');
    const m = await dock(s);
    p(`§6 Marker: Farben und Breiten, keine Stifte, nichts zu breit`,
      !!m && m.knoepfe.some(k => k.gruppe === 'farbe') && m.knoepfe.some(k => k.gruppe === 'breite') &&
      !m.knoepfe.some(k => k.gruppe === 'stil' || k.gruppe === 'notizfarbe') && m.knoepfe.every(k => k.w <= 120),
      m ? [...new Set(m.knoepfe.map(k => k.gruppe))].join(',') + ' / max ' + Math.max(...m.knoepfe.map(k => k.w)) : '');
    await werkzeug(s, 'zettel');
    const z = await dock(s);
    const pastelle = z ? z.knoepfe.filter(k => k.gruppe === 'notizfarbe') : [];
    p(`§6 Haftnotiz: genau die neun Pastelle, rund, keine Tinte`,
      !!z && pastelle.length === 9 && pastelle.every(k => Math.abs(k.w - k.h) <= 2) &&
      !z.knoepfe.some(k => k.gruppe === 'farbe' && k.act !== 'farbe'),
      z ? `${pastelle.length} Pastelle ${pastelle.map(k => k.w + '×' + k.h).slice(0, 3).join(' ')}; Gruppen ${[...new Set(z.knoepfe.map(k => k.gruppe))].join(',')}` : '');
    await s.close();
  }
}

/* ── §7 Die gewöhnliche Seite: die Spalte bleibt, das Zuviel geht ────────── */
abschnitt('§7 Gewöhnliche Seite, Platz «links» über den Knopf');
{
  const s = await frisch(1300, 860, null);
  await s.evaluate(async () => {
    const seite = Store.addPage(null, { text: 'Spaltenprobe' });
    Store.updateBlock(seite.id, { wide: true });
    const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'punkte',
      blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(f => setTimeout(f, 1200));
  });
  const stift = s.locator('.blatt-werk [data-wz="stift"]').first();
  await stift.click(); await s.waitForTimeout(300);
  for (let i = 0; i < 6; i++) {
    const jetzt = await s.evaluate(() => document.querySelector<HTMLElement>('.blatt-reihe')?.dataset.lage ?? '');
    if (jetzt === 'links') break;
    await s.locator('.blatt-werk [data-act="lage"]').first().click();
    await s.waitForTimeout(220);
  }
  const spalte = await s.evaluate(() => {
    const reihe = document.querySelector<HTMLElement>('.blatt-reihe')!;
    const werk = reihe.querySelector<HTMLElement>('.blatt-werk')!;
    const sicht = [...werk.querySelectorAll<HTMLElement>('button')]
      .filter(b => { const q = b.getBoundingClientRect(); return q.width > 0 && q.height > 0; });
    const r = reihe.getBoundingClientRect();
    return { lage: reihe.dataset.lage, tool: werk.dataset.tool, w: Math.round(r.width),
      richtung: getComputedStyle(werk).flexDirection,
      gruppen: [...new Set(sicht.map(b => b.dataset.gruppe || ''))].filter(Boolean),
      stifte: sicht.filter(b => b.dataset.act === 'stilwahl').length };
  });
  p('§7 die Spalte steht links, schmal und senkrecht (E512 bleibt)',
    spalte.lage === 'links' && spalte.richtung === 'column' && spalte.w <= 90, JSON.stringify(spalte));
  p('§7 … und zeigt beim Stift kein fremdes Zubehör',
    !spalte.gruppen.some(g => FREMD_BEIM_STIFT.includes(g)), spalte.gruppen.join(','));
  p('§7 … aber alle sechs Stifte', spalte.stifte === 6, String(spalte.stifte));
  await s.close();
}

abschnitt('§8 Ruhe');
gleich('§8 keine Seitenfehler', fehler, []);

await browser.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
