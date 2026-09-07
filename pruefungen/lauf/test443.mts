/* Suite 443 — Das Zoom-Fenster ist dieselbe Fläche: gross schreiben, ganze Seite sehen (E470)
 * ============================================================================
 * Sechster Bogen aus Redurs Auftrag vom 7. September (E465). E469 hatte das
 * Zoom-Fenster als „Seite gross plus Übersicht" gebaut — GoodNotes hat einen
 * STREIFEN, in den man in Handschriftgrösse schreibt, während oben die ganze
 * Seite steht. Genau das prüft dieser Lauf, und vor allem die eine Zusage,
 * an der alles hängt:
 *
 *   ES IST DIESELBE ZEICHENFLÄCHE. Das Papier wandert in den Streifen, in
 *   der Bühne bleibt ein stilles Abbild. Zwei Schichten auf demselben Block
 *   hielten zwei Kopien der Marken und überschrieben einander (§51).
 *
 *   §1 DER UMZUG: das echte Papier im Streifen, das Abbild in der Bühne,
 *      genau EINE bedienbare Zeichenfläche.
 *   §2 SCHREIBEN IM STREIFEN: ein Zug landet an der richtigen Stelle des
 *      Blatts — vergrössert gezeichnet, in Blattpunkten gespeichert.
 *   §3 DAS ABBILD ZIEHT NACH: der neue Strich steht auch oben.
 *   §4 FÜHREN: ▼ rückt, ⏎ geht eine Zeile weiter, ein Tipp ins Abbild
 *      stellt den Streifen dorthin, der Rahmen sagt wo.
 *   §5 ZURÜCK: das Papier steht wieder in der Bühne, das Abbild ist weg,
 *      und keine Marke ist verloren.
 *   §6 SEITENWECHSEL mit offenem Streifen.
 *   §7 RECHTE: eine gesperrte Seite lässt ihn nicht auf.
 *   §8 AM TELEFON: Streifen und Griffe sind da und 44 hoch (§37).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → in `lupeUmziehen` das Papier nicht bewegen (nur das Abbild setzen):
 *        der Streifen bleibt leer, der Zug landet nirgends. Gelaufen, rot.
 *   §4 → in `lupeLegen` die Verwandlung weglassen: der Streifen steht still,
 *        der Rahmen wandert nicht. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test443.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9563;
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

const auf = async (handy = false): Promise<{ s: Page; id: string }> => {
  const s = await browser.newPage({ viewport: handy ? { width: 390, height: 844 } : { width: 1360, height: 950 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1 });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  const id = await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Übungsheft', icon: '📕' });
    for (let n = 1; n <= 2; n++) {
      const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert',
        blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
        marken: [{ id: 'alt' + n, art: 'rectangle', farbe: '#d64545', breite: 2.4, pts: [[60, 60], [200, 140]] }] });
      Store.addBlock(b.id, 'text', { text: '' });
    }
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1400));
    document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    return seite.id as string;
  });
  return { s, id };
};

const marken = (s: Page, id: string, nr = 0) => s.evaluate(([id, nr]: [string, number]) =>
  (DocumentMode.documentsIn(Store.getBlock(id))[nr]?.marken || []).map((m: any) => ({ id: m.id, art: m.art, pts: m.pts })),
  [id, nr] as [string, number]);

/* ═══ §1 Der Umzug ═════════════════════════════════════════════════════════ */
console.log('\n§1 Der Umzug: eine Fläche, zwei Sichten');
const { s, id } = await auf();
{
  await s.click('.document-inspector [data-document-action="lupe"]');
  await s.waitForTimeout(700);
  const z = await s.evaluate(() => {
    const ws = document.querySelector<HTMLElement>('.document-workspace');
    const fenster = document.querySelector<HTMLElement>('.document-lupe-fenster');
    const echt = fenster?.querySelector<HTMLElement>('.blatt-papier');
    const abbild = document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-abbild');
    const flaechen = [...document.querySelectorAll<SVGElement>('svg.blatt-marken')];
    const bedienbar = flaechen.filter(f => !f.closest('.blatt-abbild'));
    /* JE GEZEICHNETE SEITE GENAU EINE bedienbare Fläche — das ist die
       Zusage, an der alles hängt. Ein Spiegel der aktiven Seite wäre eine
       mehr, und die zweite Kopie der Marken wäre Datenverlust (§51). */
    const gezeichnet = [...document.querySelectorAll('.document-stage')]
      .filter(st => st.querySelector('.blatt-huelle')).length;
    const aktivBedienbar = [...(document.querySelector('.document-stage[data-aktiv]')
      ?.querySelectorAll<SVGElement>('svg.blatt-marken') || [])].filter(f => !f.closest('.blatt-abbild')).length;
    return {
      an: ws?.dataset.lupe, fenster: !!fenster, echtImFenster: !!echt,
      abbild: !!abbild, abbildHatPapier: !!abbild?.querySelector('.blatt-papier'),
      rahmen: !!abbild?.querySelector('.document-lupe-rahmen'),
      flaechen: flaechen.length, bedienbar: bedienbar.length, gezeichnet, aktivBedienbar,
      imStreifen: fenster?.querySelectorAll('svg.blatt-marken').length ?? -1,
      buehnePapier: !!document.querySelector('.document-stage[data-aktiv] > .blatt-huelle > .blatt-papier'),
      breit: echt ? Math.round(echt.getBoundingClientRect().width) : 0,
      fensterBreit: fenster ? Math.round(fenster.clientWidth) : 0,
      zoom: document.querySelector('.document-zoom-label')?.textContent
    };
  });
  p('Das echte Papier steht im Streifen, nicht mehr in der Bühne', z.an === 'an' && z.fenster && z.echtImFenster && !z.buehnePapier, JSON.stringify(z));
  p('In der Bühne steht das Abbild mit dem Rahmen', z.abbild && z.abbildHatPapier && z.rahmen, JSON.stringify(z));
  p('Je gezeichnete Seite genau EINE bedienbare Zeichenfläche — kein Spiegel (§51)',
    z.bedienbar === z.gezeichnet && z.flaechen === z.gezeichnet + 1, JSON.stringify(z));
  p('Die aktive Seite hat ihre Fläche im Streifen, nicht in der Bühne',
    z.aktivBedienbar === 0 && z.imStreifen === 1, JSON.stringify(z));
  p('Der Streifen zeigt das Papier vergrössert (2,6-fach der Fensterbreite)',
    z.breit > z.fensterBreit * 2.2 && z.breit < z.fensterBreit * 3, JSON.stringify([z.fensterBreit, z.breit]));
  gleich('Die Bühne bleibt bei 100 % — die ganze Seite steht oben', z.zoom, '100 %');
}

/* ═══ §2 Schreiben im Streifen ═════════════════════════════════════════════ */
console.log('\n§2 Schreiben im Streifen');
{
  const vorher = (await marken(s, id)).length;
  await s.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.document-lupe-fenster')!;
    const flaeche = f.querySelector<SVGElement>('svg.blatt-marken')!;
    const r = f.getBoundingClientRect();
    const ev = (typ: string, x: number, y: number, tasten: number): PointerEvent =>
      new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: x, clientY: y,
        pointerId: 11, pointerType: 'mouse', isPrimary: true, button: 0, buttons: tasten, pressure: 0.5 });
    const von: [number, number] = [r.left + 100, r.top + 100];
    const bis: [number, number] = [r.left + 300, r.top + 160];
    flaeche.dispatchEvent(ev('pointerdown', von[0], von[1], 1));
    for (let i = 1; i <= 6; i++)
      flaeche.dispatchEvent(ev('pointermove', von[0] + (bis[0] - von[0]) * i / 6, von[1] + (bis[1] - von[1]) * i / 6, 1));
    flaeche.dispatchEvent(ev('pointerup', bis[0], bis[1], 0));
  });
  await s.waitForTimeout(600);
  const jetzt = await marken(s, id);
  const neu = jetzt.find((m: any) => m.id !== 'alt1');
  p('Ein Zug im Streifen legt GENAU EINEN neuen Strich an', jetzt.length === vorher + 1, JSON.stringify(jetzt.map((m: any) => m.art)));
  /* Fenster 100 px vom Rand, Papier 2,6-fach: 100 px sind rund 28 Blattpunkte
     (100 / (Fensterbreite × 2,6) × 595,28). Grosszügige Grenzen, weil die
     Fensterbreite vom Fenster abhängt — geprüft wird, dass die Zahl NICHT
     die Bildschirmzahl ist und nicht daneben liegt. */
  const ersterPunkt = neu?.pts?.[0];
  p('… und er liegt in Blattpunkten dort, wo der Zeiger war (nicht in Bildschirmpunkten)',
    !!ersterPunkt && ersterPunkt[0] > 8 && ersterPunkt[0] < 60 && ersterPunkt[1] > 8 && ersterPunkt[1] < 60,
    JSON.stringify(ersterPunkt));
  const letzterPunkt = neu?.pts?.[neu.pts.length - 1];
  p('… der Zug läuft nach rechts unten und ist kürzer als auf dem Bildschirm (vergrössert gezeichnet)',
    !!letzterPunkt && !!ersterPunkt && letzterPunkt[0] > ersterPunkt[0] + 20 && letzterPunkt[0] - ersterPunkt[0] < 190,
    JSON.stringify([ersterPunkt, letzterPunkt]));
  p('Die alte Marke ist unberührt', jetzt.some((m: any) => m.id === 'alt1'), JSON.stringify(jetzt.map((m: any) => m.id)));
}

/* ═══ §3 Das Abbild zieht nach ═════════════════════════════════════════════ */
console.log('\n§3 Das Abbild zieht nach');
{
  const z = await s.evaluate(() => {
    const abbild = document.querySelector<HTMLElement>('.blatt-abbild');
    const echt = document.querySelector<HTMLElement>('.document-lupe-fenster svg.blatt-marken');
    return { imAbbild: abbild?.querySelectorAll('[data-sid]').length ?? -1,
      imEchten: echt?.querySelectorAll('[data-sid]').length ?? -1,
      zeiger: abbild ? getComputedStyle(abbild).pointerEvents : null,
      still: abbild ? (abbild as any).inert === true || abbild.hasAttribute('inert') : false };
  });
  gleich('Das Abbild zeigt dieselben Marken wie die echte Fläche', z.imAbbild, z.imEchten);
  p('… und ist still: kein Zeigerweg, nichts zu treffen', z.zeiger === 'none' && z.still, JSON.stringify(z));
}

/* ═══ §4 Führen ════════════════════════════════════════════════════════════ */
console.log('\n§4 Führen: ▼, ⏎ und ein Tipp ins Abbild');
{
  const lage = () => s.evaluate(() => {
    const k = document.querySelector<HTMLElement>('.document-lupe-fenster > *');
    const rahmen = document.querySelector<HTMLElement>('.document-lupe-rahmen');
    return { transform: k?.style.transform || '', rahmenTop: parseFloat(rahmen?.style.top || '0'),
      rahmenLinks: parseFloat(rahmen?.style.left || '0'), rahmenHoch: parseFloat(rahmen?.style.height || '0') };
  });
  const a = await lage();
  p('Am Anfang steht der Streifen oben links', a.rahmenTop < 1 && a.rahmenLinks < 1 && a.rahmenHoch > 3, JSON.stringify(a));
  await s.click('.document-lupe [data-document-action="lupe-runter"]');
  await s.waitForTimeout(250);
  const b = await lage();
  p('▼ rückt den Streifen nach unten — Rahmen und Verwandlung wandern mit',
    b.rahmenTop > a.rahmenTop + 1 && b.transform !== a.transform && /translate\(/.test(b.transform), JSON.stringify([a, b]));
  await s.click('.document-lupe [data-document-action="lupe-weiter"]');
  await s.waitForTimeout(250);
  const c = await lage();
  p('⏎ geht weiter: erst nach rechts in derselben Zeile', c.rahmenLinks > b.rahmenLinks + 1, JSON.stringify([b, c]));
  await s.evaluate(() => {
    const abbild = document.querySelector<HTMLElement>('.blatt-abbild')!;
    const r = abbild.getBoundingClientRect();
    abbild.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true,
      clientX: r.left + r.width * 0.2, clientY: r.top + r.height * 0.7,
      pointerId: 5, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 }));
  });
  await s.waitForTimeout(300);
  const d = await lage();
  p('Ein Tipp ins Abbild bei 70 % Höhe stellt den Streifen dorthin', d.rahmenTop > 45, JSON.stringify(d));
}

/* ═══ §5 Zurück ════════════════════════════════════════════════════════════ */
console.log('\n§5 Zurück');
{
  const vorher = await marken(s, id);
  await s.click('.document-lupe [data-document-action="lupe-zu"]');
  await s.waitForTimeout(600);
  const z = await s.evaluate(() => {
    const stand = document.querySelector<HTMLElement>('.document-stage[data-aktiv]');
    const papier = stand?.querySelector<HTMLElement>('.blatt-huelle > .blatt-papier');
    return { lupe: document.querySelector('.document-lupe') !== null,
      abbild: document.querySelector('.blatt-abbild') !== null,
      inBuehne: !!papier, breite: papier?.style.width || '', transform: papier?.style.transform || '',
      flaechen: [...document.querySelectorAll('.document-stage')].filter(st => st.querySelector('.blatt-huelle')).length
        - document.querySelectorAll('svg.blatt-marken').length,
      zoom: document.querySelector('.document-zoom-label')?.textContent,
      knopf: document.querySelector('.document-lupe-knopf')?.getAttribute('aria-pressed') };
  });
  /* `flaechen` ist hier die DIFFERENZ aus gezeichneten Seiten und Flächen:
     null heisst „jede Seite hat genau ihre eine, keine übrig, keine fehlt". */
  p('Der Streifen ist weg, das Papier steht wieder in der Bühne, ohne Reste',
    !z.lupe && !z.abbild && z.inBuehne && z.breite === '' && z.transform === '' && z.flaechen === 0, JSON.stringify(z));
  gleich('Der Zoom steht wieder auf 100 %', z.zoom, '100 %');
  gleich('Der Schalter sagt es', z.knopf, 'false');
  gleich('Keine Marke ist verloren gegangen', (await marken(s, id)).map((m: any) => m.id), vorher.map((m: any) => m.id));
}

/* ═══ §6 Seitenwechsel ═════════════════════════════════════════════════════ */
console.log('\n§6 Seitenwechsel mit offenem Streifen');
{
  await s.click('.document-inspector [data-document-action="lupe"]');
  await s.waitForTimeout(600);
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-thumbnails [data-document-index="1"]')?.click(); });
  await s.waitForTimeout(900);
  const z = await s.evaluate(() => {
    const fenster = document.querySelector<HTMLElement>('.document-lupe-fenster');
    const abbilder = document.querySelectorAll('.blatt-abbild').length;
    const imFenster = fenster?.querySelectorAll('.blatt-papier').length ?? -1;
    const stand1 = document.querySelector<HTMLElement>('.document-stage[data-stand-nr="1"]');
    return { imFenster, abbilder, aktivHatAbbild: !!stand1?.querySelector('.blatt-abbild'),
      stand0Papier: !!document.querySelector('.document-stage[data-stand-nr="0"] > .blatt-huelle > .blatt-papier'),
      position: document.querySelector('.document-position')?.textContent };
  });
  p('Der Streifen zeigt jetzt die zweite Seite, die erste hat ihr Papier zurück',
    z.imFenster === 1 && z.abbilder === 1 && z.aktivHatAbbild && z.stand0Papier && z.position === 'Seite 2/2', JSON.stringify(z));
  await s.click('.document-lupe [data-document-action="lupe-zu"]');
  await s.waitForTimeout(400);
  gleich('Zu: beide Seiten haben ihr Papier', await s.evaluate(() =>
    document.querySelectorAll('.document-stage > .blatt-huelle > .blatt-papier').length), 2);
}

/* ═══ §7 Rechte ════════════════════════════════════════════════════════════ */
console.log('\n§7 Rechte');
{
  await s.evaluate(async (id: string) => {
    Store.updateBlock(id, { gesperrt: true }); await Store.flush(); App.oeffne(id);
    await new Promise(r => setTimeout(r, 900));
    document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
    await new Promise(r => setTimeout(r, 300));
  }, id);
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-inspector [data-document-action="lupe"]')?.click(); });
  await s.waitForTimeout(400);
  const z = await s.evaluate(() => ({ lupe: !!document.querySelector('.document-lupe'),
    abbild: !!document.querySelector('.blatt-abbild'), an: document.querySelector<HTMLElement>('.document-workspace')?.dataset.lupe }));
  p('Eine gesperrte Seite lässt den Streifen nicht auf', !z.lupe && !z.abbild && z.an !== 'an', JSON.stringify(z));
  await s.evaluate(async (id: string) => { Store.updateBlock(id, { gesperrt: false }); await Store.flush(); }, id);
  await s.close();
}

/* ═══ §8 Am Telefon ════════════════════════════════════════════════════════ */
console.log('\n§8 Am Telefon');
{
  const { s: t } = await auf(true);
  await t.evaluate(() => { document.querySelector<HTMLElement>('.document-inspector [data-document-action="lupe"]')?.click(); });
  await t.waitForTimeout(800);
  const z = await t.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.document-lupe-fenster');
    const griffe = [...document.querySelectorAll<HTMLElement>('.document-lupe-griffe button')];
    return { fenster: f ? Math.round(f.getBoundingClientRect().height) : 0,
      breit: f ? Math.round(f.getBoundingClientRect().width) : 0,
      griffe: griffe.length, kleinster: griffe.length ? Math.min(...griffe.map(g => Math.round(g.getBoundingClientRect().height))) : 0,
      imBild: griffe.every(g => { const r = g.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= -1; }) };
  });
  p('Der Streifen steht auch am Telefon und ist hoch genug zum Schreiben', z.fenster >= 120 && z.breit > 200, JSON.stringify(z));
  p('Sechs Griffe, jeder 44 hoch, alle im Bild (§37)', z.griffe === 6 && z.kleinster >= 44 && z.imBild, JSON.stringify(z));
  await t.close();
}

/* ═══ §9 Eingebunden ═══════════════════════════════════════════════════════ */
console.log('\n§9 Eingebunden');
{
  const dm = lies('src/bereiche/pdf/document-mode.ts');
  p('Der Umzug steht im Zeichner des Dokuments', /const lupeUmziehen/.test(dm) && /lupeFenster\.appendChild\(knoten\)/.test(dm));
  p('Das Abbild entsteht aus dem echten Knoten und wird nachgezogen', /cloneNode\(true\)/.test(dm) && /MutationObserver/.test(dm));
  p('Ein Neuaufbau beginnt ohne Zoom-Fenster', /state\.lupe = false;/.test(dm));
  p('Das Stilblatt kennt Streifen, Abbild und Rahmen',
    /\.document-lupe-fenster\{/.test(lies('quell/schale/stil/bausteine.css')) &&
    /\.blatt-abbild\{/.test(lies('quell/schale/stil/bausteine.css')) &&
    /\.document-lupe-rahmen\{/.test(lies('quell/schale/stil/bausteine.css')));
}

console.log('\n§10 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
