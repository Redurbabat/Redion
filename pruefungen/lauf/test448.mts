/* Suite 448 — Was der Finger trifft: die drei Flächen unter 44 px (E475, §37)
 * ============================================================================
 * §37 ist hart im Kern: „44 px Mindestgrösse auf den Hauptwegen." L133
 * führte seit dem 7. September drei Stellen, die es nicht waren. GEMESSEN
 * am Telefon (390×780, die Seite 344×487 gerendert), nicht geschätzt:
 *
 *     Verweis einer PDF      6,9 px hoch
 *     Regler der Strichstärke  16 px hoch  (die Klappe darum 44 — er nicht)
 *     Papierauswahl im Seitenmenü  36 px
 *
 * Zwei davon sind eine Zeile CSS. Der Verweis ist es nicht: ihn selbst zu
 * vergrössern hiesse, die halbe Seite unter blaue Kästen zu legen. Deshalb
 * wächst nur seine TREFFFLÄCHE — und nie über die Hälfte des Abstands zum
 * nächsten Verweis, denn eine Fläche, die den Nachbarn verschluckt,
 * tauscht „nicht getroffen" gegen „das Falsche getroffen".
 *
 *   §1 DIE DREI MASSE am Telefon.
 *   §2 DIE NACHBARSCHAFTSREGEL: zwei enge Verweise teilen den Abstand
 *      genau in der Mitte — lückenlos, aber ohne einander zu decken.
 *   §3 DER SICHTBARE VERWEIS bleibt so gross, wie er in der PDF steht.
 *   §4 UND SIE TRÄGT: ein Tipp in der Luft über dem Verweis landet auf ihm.
 *   §5 QUELLEN und keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1, §2, §4 → `verweisLuft` als leere Funktion: der Verweis ist wieder
 *        7 px, der Tipp daneben trifft nichts. Gelaufen, rot.
 *   §1 → `height:var(--touch-min)` am Regler entfernt: 16 px. Gelaufen, rot.
 *   §1 → `min-height` an der Papierauswahl entfernt: 36 px. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test448.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9568;
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

/* Ein Dokument mit drei Verweisen: zwei eng untereinander (wie in einem
   Inhaltsverzeichnis, 26 Punkte Zeilenabstand) und einer allein. */
const s: Page = await browser.newPage({ viewport: { width: 390, height: 780 },
  deviceScaleFactor: 2, hasTouch: true, isMobile: true });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
await s.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const seite = Store.addPage(null, { text: 'Verweisblatt', icon: '📕' });
  Store.updateBlock(seite.id, { dokumentModus: true });
  Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842, quelleId: 'q', raumVersion: 1,
    verweise: [
      { x: 80, y: 200, w: 160, h: 12, url: 'https://example.org/eins' },
      { x: 80, y: 226, w: 200, h: 12, url: 'https://example.org/zwei' },
      { x: 80, y: 400, w: 60, h: 11, url: 'https://example.org/allein' }] });
  await Store.flush();
  App.oeffne(seite.id);
});
await s.waitForSelector('.document-workspace', { timeout: 15000 });
await s.waitForTimeout(1600);

/* ═══ §1 Die drei Masse ════════════════════════════════════════════════════ */
console.log('\n§1 Die drei Masse am Telefon');
{
  /* Der Regler: die Stufe antippen, die schon gewählt ist — so geht die
     Klappe auf (E465). */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk .blatt-strich.on')?.click());
  await s.waitForTimeout(500);
  const regler = JSON.parse(await s.evaluate(`(() => {
    const l = document.querySelector('.blatt-werk label.blatt-staerke');
    const i = l && l.querySelector('input');
    if (!l || !i) return 'null';
    return JSON.stringify({ auf: l.classList.contains('auf'),
      klappe: Math.round(l.getBoundingClientRect().height),
      regler: Math.round(i.getBoundingClientRect().height) });
  })()`) as string);
  p('Die Klappe des Reglers ist offen', regler?.auf === true, JSON.stringify(regler));
  p('Der Ziehbereich des Reglers misst 44 px (gemessen waren es 16)',
    regler?.regler >= 44, JSON.stringify(regler));

  /* Die Papierauswahl im Seitenmenü. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(700);
  const papier = Number(await s.evaluate(`(() => {
    const e = document.querySelector('[data-document-papier]');
    return e ? Math.round(e.getBoundingClientRect().height) : 0;
  })()`));
  p('Die Papierauswahl misst 44 px (gemessen waren es 36)', papier >= 44, String(papier));
  const zuKlein = JSON.parse(await s.evaluate(`(() => JSON.stringify(
    [...document.querySelectorAll('.document-inspector button, .document-inspector select')]
      .map(b => ({ was: b.dataset.documentAction || b.tagName.toLowerCase(), h: Math.round(b.getBoundingClientRect().height) }))
      .filter(k => k.h > 0 && k.h < 44)))()`) as string);
  gleich('Und im ganzen Seitenmenü steht nichts mehr unter 44 px', zuKlein, []);

  /* Der freistehende Verweis — im Lesemodus, sonst liegt die Schicht still.
     Und das Seitenmenü wieder zu: am Telefon deckt es die Seite. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="read"]')?.click());
  await s.waitForTimeout(900);
  const v = JSON.parse(await s.evaluate(`(() => JSON.stringify(
    [...document.querySelectorAll('.document-verweis')].map(e => {
      const r = e.getBoundingClientRect(), b = getComputedStyle(e, '::before');
      return { h: Math.round(r.height * 10) / 10, w: Math.round(r.width),
        treffH: Math.round(parseFloat(b.height) || 0), treffB: Math.round(parseFloat(b.width) || 0),
        oben: Math.round(r.top), unten: Math.round(r.bottom) };
    })))()`) as string) as any[];
  p('Es sind drei Verweise da', v.length === 3, JSON.stringify(v));
  p('Der Verweis selbst ist unter 10 px hoch — das war der Fund',
    v.every(x => x.h < 10), JSON.stringify(v.map(x => x.h)));
  p('Der freistehende Verweis hat 44 px Trefffläche in beide Richtungen',
    v[2]?.treffH >= 44 && v[2]?.treffB >= 44, JSON.stringify(v[2]));
}

/* ═══ §2 Die Nachbarschaftsregel ═══════════════════════════════════════════ */
console.log('\n§2 Zwei enge Verweise teilen den Abstand in der Mitte');
{
  const n = JSON.parse(await s.evaluate(`(() => {
    const e = [...document.querySelectorAll('.document-verweis')];
    const kasten = (x) => { const r = x.getBoundingClientRect();
      const h = parseFloat(x.style.getPropertyValue('--verweis-hoch')) || 0;
      return { oben: r.top, unten: r.bottom, tOben: r.top - h, tUnten: r.bottom + h, luft: h }; };
    const a = kasten(e[0]), b = kasten(e[1]);
    return JSON.stringify({ a, b, spalt: b.oben - a.unten });
  })()`) as string);
  p('Die zwei stehen wirklich eng (unter 15 px Abstand)', n.spalt > 0 && n.spalt < 15, JSON.stringify(n));
  p('Keine Trefffläche deckt den Nachbarn zu',
    n.a.tUnten <= n.b.oben + 0.5 && n.b.tOben >= n.a.unten - 0.5, JSON.stringify(n));
  p('… und zwischen ihnen bleibt keine tote Zone: sie stossen in der Mitte an',
    Math.abs(n.a.tUnten - n.b.tOben) <= 1.5, JSON.stringify({ aUnten: n.a.tUnten, bOben: n.b.tOben }));
  p('Beide sind trotzdem gewachsen', n.a.luft >= 3 && n.b.luft >= 3, JSON.stringify({ a: n.a.luft, b: n.b.luft }));
}

/* ═══ §3 Der sichtbare Verweis bleibt, was er ist ══════════════════════════ */
console.log('\n§3 Der sichtbare Verweis bleibt so gross wie in der PDF');
{
  /* 12 Punkte von 842 auf einer 487 px hohen Seite = 6,9 px. Wäre der
     Kasten selbst gewachsen, läge die halbe Seite unter Blau. */
  const h = Number(await s.evaluate(`(() => {
    const e = document.querySelector('.document-verweis');
    return Math.round(e.getBoundingClientRect().height * 10) / 10;
  })()`));
  p('Er ist weiter 7 px hoch, nicht 44', h > 5 && h < 9, String(h));
}

/* ═══ §4 Und sie trägt ═════════════════════════════════════════════════════ */
console.log('\n§4 Ein Tipp in der Luft über dem Verweis landet auf ihm');
{
  const treffer = JSON.parse(await s.evaluate(`(() => {
    const e = [...document.querySelectorAll('.document-verweis')];
    const allein = e[2];
    const r = allein.getBoundingClientRect();
    const probe = (dx, dy) => {
      const el = document.elementFromPoint(r.left + r.width / 2 + dx, r.top + r.height / 2 + dy);
      return el === allein || (el && el.closest && el.closest('.document-verweis') === allein);
    };
    return JSON.stringify({
      mitte: probe(0, 0),
      obenDrueber: probe(0, -16),
      untenDrunter: probe(0, 16),
      danebenLinks: probe(-20, 0),
      weitWeg: probe(0, -60),
      /* Wenn etwas fehlschlägt, soll dastehen, WAS im Weg lag. */
      obendrauf: document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).slice(0, 3)
        .map(el => el.tagName + '.' + String(el.className).slice(0, 26)),
      rect: { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
    });
  })()`) as string);
  p('Die Mitte trifft', treffer.mitte === true, JSON.stringify(treffer));
  p('16 px darüber trifft auch — dort ist der Verweis selbst nicht mehr',
    treffer.obenDrueber === true, JSON.stringify(treffer));
  p('… und 16 px darunter', treffer.untenDrunter === true, JSON.stringify(treffer));
  p('… und 20 px daneben', treffer.danebenLinks === true, JSON.stringify(treffer));
  p('60 px weg trifft nicht mehr — die Fläche ist begrenzt',
    treffer.weitWeg === false, JSON.stringify(treffer));
}

await s.close();

console.log('\n§5 Quellen');
p('`verweisLuft` steht in `document-mode.ts` und wird beim Legen gerufen',
  /const verweisLuft = /.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /verweisLuft\(schicht\);/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Das erzeugte JS trägt es', /verweisLuft/.test(lies('quell/bereiche/pdf/document-mode.js')));
p('Das Stilblatt kennt die Trefffläche und die Reglerhöhe',
  /\.document-verweis::before/.test(lies('quell/schale/stil/bausteine.css'))
  && /label\.blatt-staerke input\{ height:var\(--touch-min\)/.test(lies('quell/schale/stil/bausteine.css')));
p('… und die Papierauswahl misst 44', /\.document-inspector select\{ min-height:var\(--touch-min\)/.test(lies('quell/schale/stil/pdf-studio.css')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
