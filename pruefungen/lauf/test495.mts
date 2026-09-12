/* Suite 495 — Glühfaden und Kartenring waren angemeldet, aber nie gebaut (E529)
 * ============================================================================
 * Redur, 12. September: „arbeite an redion selbständig weiter … du musst alles
 * im redion einsetzen und dabei wirklich alles".
 *
 * Der Bogen davor hat Redurs CSS-Vorlage MOTIVISCH übertragen und sagt das in
 * `doku/ANIMATIONEN-ZUORDNUNG.md` auch selbst: „keine Zusage, den gesamten
 * Originalcode bereits vollständig umgesetzt zu haben". Zwei Einträge der
 * Wirkungstabelle standen dabei völlig leer:
 *
 *   filament  — angemeldet auf `.sp-start`, aber `motion.ts` baute kein
 *               Markup. Übrig blieb ein 13 × 6 px grosses `::before`.
 *   carousel  — die Ring-CSS in `motion.css` zeigte auf `.rmo-carousel`, und
 *               dieses Element hat NIEMAND erzeugt. Toter Stil.
 *
 * Gefunden durch Abzählen: sechs `ensure(`-Aufrufe in `motion.ts`, keiner für
 * die beiden. Das ist die Sorte Lücke, die kein Auge sieht — es fehlt ja
 * nichts, was vorher da war.
 *
 *   §1 DAS MARKUP ENTSTEHT: Glas, Wendel und zwei Drähte am Schaltknopf;
 *      fünf Karten auf einem Kreis im leeren Regal.
 *   §2 DER FADEN GLÜHT NUR BEI STROM. `.an` und nur `.an`.
 *   §3 DER RING DREHT SICH, und die Karten stehen wirklich im Kreis —
 *      jede um 360°/5 weitergedreht, keine zwei auf demselben Winkel.
 *   §4 WENIGER BEWEGUNG HEISST KEINE BEWEGUNG.
 *   §5 NICHTS DAVON IST BEDIENBAR: Schmuck nimmt keine Klicks und keine
 *      Vorleseaufmerksamkeit (§38).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → die zwei `ensure(`-Aufrufe wieder entfernen: der Zustand von vorher.
 *   §2 → `.an` aus der Glüh-Regel nehmen.
 *   §3 → `rotateY(…var(--rmo-index))` durch einen festen Winkel ersetzen.
 *
 *   node pruefungen/lauf/test495.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9605;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine Prüffläche mit den ECHTEN Klassen der App, im echten Stilblatt. */
const buehne = async (ruhig: boolean) => {
  const kontext = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    reducedMotion: ruhig ? 'reduce' : 'no-preference'
  });
  const seite = await kontext.newPage();
  seite.on('pageerror', e => fehler.push(e.message));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2600);
  await seite.evaluate(() => {
    document.getElementById('rg-willkommen')?.remove();
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const flaeche = document.getElementById('scroll') || document.body;
    flaeche.innerHTML =
      '<button class="sp-start" data-a="simulation">Strom einschalten</button>' +
      '<button class="sp-start an" data-a="simulation">Strom ausschalten</button>' +
      '<div class="bib-leer">Hier ist noch nichts.</div>';
    (window as any).RedionMotion?.decorate?.(document);
  });
  await seite.waitForTimeout(500);
  return { kontext, seite };
};

const { kontext, seite } = await buehne(false);

/* ══ §1 DAS MARKUP ENTSTEHT ══════════════════════════════════════════════ */
console.log('\n§1 Glühfaden und Kartenring werden wirklich gebaut');
{
  const m = await seite.evaluate(() => ({
    filamente: document.querySelectorAll('.sp-start > .rmo-filament').length,
    wendel: document.querySelectorAll('.rmo-filament > .rmo-filament-wendel').length,
    beine: document.querySelectorAll('.rmo-filament > .rmo-filament-bein').length,
    ringe: document.querySelectorAll('.bib-leer > .rmo-carousel').length,
    karten: document.querySelectorAll('.rmo-carousel > .rmo-ring-karte').length
  }));
  gleich('Beide Schaltknöpfe bekommen einen Glühfaden', m.filamente, 2);
  gleich('Jeder Faden hat eine Wendel', m.wendel, 2);
  gleich('… und zwei Zuleitungen', m.beine, 4);
  gleich('Das leere Regal bekommt einen Ring', m.ringe, 1);
  gleich('Mit fünf Karten', m.karten, 5);
}

/* ══ §2 NUR BEI STROM ════════════════════════════════════════════════════ */
console.log('\n§2 Der Faden glüht nur, wenn Strom fliesst');
{
  const m = await seite.evaluate(() => {
    const lese = (wahl: string) => {
      const w = document.querySelector(wahl + ' .rmo-filament-wendel');
      if (!w) return null;
      const s = getComputedStyle(w);
      return { schatten: s.boxShadow, name: s.animationName };
    };
    return { aus: lese('.sp-start:not(.an)'), an: lese('.sp-start.an') };
  });
  p('Ausgeschaltet steht die Wendel still',
    m.aus?.name === 'none', JSON.stringify(m.aus));
  p('Eingeschaltet glüht sie — und zwar sichtbar anders',
    m.an?.name === 'rmo-gluehen' && m.an.schatten !== m.aus?.schatten,
    JSON.stringify(m.an));
}

/* ══ §3 EIN RING, KEIN STAPEL ════════════════════════════════════════════ */
console.log('\n§3 Die Karten stehen im Kreis, und er dreht sich');
{
  const m = await seite.evaluate(() => {
    const ring = document.querySelector('.rmo-carousel') as HTMLElement | null;
    const karten = [...document.querySelectorAll('.rmo-ring-karte')] as HTMLElement[];
    return {
      dreht: ring ? getComputedStyle(ring).animationName : '-',
      dauer: ring ? getComputedStyle(ring).animationDuration : '-',
      /* Jede Karte trägt ihren eigenen Index; ohne den läge alles auf 0°. */
      indizes: karten.map(k => k.style.getPropertyValue('--rmo-index')),
      /* Und wirklich verschiedene Matrizen — der Index allein beweist nichts. */
      verschieden: new Set(karten.map(k => getComputedStyle(k).transform)).size
    };
  });
  gleich('Der Ring dreht sich', m.dreht, 'rmo-ring-drehen');
  gleich('Fünf verschiedene Winkel', m.indizes, ['0', '1', '2', '3', '4']);
  gleich('… und fünf wirklich verschiedene Lagen im Raum', m.verschieden, 5);
}

/* ══ §5 SCHMUCK BLEIBT SCHMUCK ═══════════════════════════════════════════ */
console.log('\n§5 Nichts davon nimmt Klicks oder Vorleseaufmerksamkeit');
{
  const m = await seite.evaluate(() => {
    const alle = [...document.querySelectorAll('.rmo-filament, .rmo-carousel, .rmo-ring-karte')];
    return {
      versteckt: alle.every(e => e.getAttribute('aria-hidden') === 'true'),
      durchlaessig: [...document.querySelectorAll('.rmo-filament, .rmo-carousel')]
        .every(e => getComputedStyle(e).pointerEvents === 'none'),
      /* Der Knopf muss weiterhin seine Beschriftung tragen (§38). */
      knopftext: (document.querySelector('.sp-start.an')?.textContent || '').trim()
    };
  });
  p('Alles Neue ist vor Vorleseprogrammen verborgen', m.versteckt);
  p('… und lässt Klicks durch', m.durchlaessig);
  gleich('Der Schaltknopf sagt weiterhin, was er tut', m.knopftext, 'Strom ausschalten');
}
await kontext.close();

/* ══ §4 WENIGER BEWEGUNG ═════════════════════════════════════════════════ */
console.log('\n§4 Wer weniger Bewegung will, bekommt keine');
{
  const { kontext: k2, seite: s2 } = await buehne(true);
  const m = await s2.evaluate(() => ({
    ring: getComputedStyle(document.querySelector('.rmo-carousel')!).animationName,
    wendel: getComputedStyle(document.querySelector('.sp-start.an .rmo-filament-wendel')!).animationName
  }));
  gleich('Der Ring steht still', m.ring, 'none');
  gleich('Die Wendel auch', m.wendel, 'none');
  await k2.close();
}

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
