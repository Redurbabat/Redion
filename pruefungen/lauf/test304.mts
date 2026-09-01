/* Suite 304 — Die Meldung deckt am Telefon keinen Knopf mehr zu (L109, E310)
 * ============================================================================
 * Gefunden auf dem Bild zu E308: „📕 1 Karteikarte ist fällig" lag genau über
 * „Als Seite anlegen" und „Schliessen". Nachgemessen am 1. September auf
 * 390 × 844 mit offenem Tagesplan:
 *
 *     Fuss des Fensters   670 – 789
 *     Meldung             730 – 773      beide Knöpfe verdeckt
 *
 * Am Rechner nicht: dort steht der Fuss bei 542 – 604 und die Meldung bei
 * 835 – 878. Die Reparatur gehört deshalb in den Telefon-Zweig und nur
 * dorthin — das war die offene Frage in L109, und sie ist jetzt gemessen
 * statt vermutet.
 *
 *   §1 DIE REGEL steht im Telefon-Zweig, samt ihrer zweiten Zeile.
 *   §2 KEIN KNOPF eines offenen Fensters liegt unter der Meldung.
 *   §3 GEGENPROBE: mit der alten Lage liegt er es sehr wohl.
 *   §4 AM RECHNER bleibt alles, wie es war.
 *   §5 UND DIE MELDUNG IST OBEN WIRKLICH ZU SEHEN.
 *
 * ─── WARUM §5 DER WICHTIGSTE ABSCHNITT IST ──────────────────────────────────
 *
 * „Deckt keinen Knopf mehr zu" wäre auch dann wahr, wenn die Meldung
 * überhaupt nicht mehr erschiene. Das ist die bequemste Art, diese Prüfung
 * zu bestehen, und die schlechteste Art, sie zu erfüllen: eine Meldung, die
 * niemand sieht, ist schlimmer als eine, die im Weg steht.
 *
 * §5 misst deshalb Deckkraft und Lage: sichtbar, im Bild, und oben.
 *
 *   node pruefungen/lauf/test304.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9314;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
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

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Regel steht im Telefon-Zweig');

const css = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf-8');

/**
 * Die Medienbedingung, unter der eine Regel steht.
 *
 * NICHT über einen Ausdruck auf den Dateitext: `@media(max-width:760px){…}`
 * kommt in `bausteine.css` vielfach vor, und der erste Treffer war ein
 * anderer Block mit 92 Zeichen. Gesucht wird deshalb mit einem Klammer-
 * stapel — und wie in test303 kommt JEDE geschweifte At-Regel darauf, sonst
 * beendet ein `@keyframes` den Zweig zu früh.
 *
 * Kommentare fliegen vorher raus. Ohne das enthält der aufgesammelte
 * Selektor alles, was zwischen der vorigen schliessenden Klammer und ihm
 * steht — bei einer Regel mit Kommentar davor also den ganzen Kommentar,
 * und der Vergleich schlägt fehl, obwohl die Regel da ist.
 */
const bedingungVon = (roh: string, selektor: string): string | null => {
  const text = roh.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const glatt = (x: string): string => x.replace(/\s+/g, ' ').trim();
  const stapel: string[] = [];
  const re = /@([a-z-]+)([^{}]*)\{|([^{}]+)\{([^{}]*)\}|\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) stapel.push(m[1] === 'media' ? (m[2] ?? '').trim() : '');
    else if (m[3] !== undefined) {
      if (glatt(m[3]) === selektor) return stapel.filter(Boolean).join(' and ');
    } else stapel.pop();
  }
  return null;
};

const wo = bedingungVon(css, 'body:has(.overlay) #toast');
const woShow = bedingungVon(css, 'body:has(.overlay) #toast.show');
p('Die Regel für das offene Fenster gibt es', wo !== null, String(wo));
p('Und sie steht im Telefon-Zweig', /max-width\s*:\s*760px/.test(wo ?? ''), String(wo));
/* Ohne die zweite Zeile bliebe der Toast in seiner Schiebestellung stehen —
   die Regel wäre da und die Meldung trotzdem unsichtbar. */
p('Samt ihrer zweiten Zeile für den gezeigten Zustand',
  /max-width\s*:\s*760px/.test(woShow ?? ''), String(woShow));
/* Gegenprobe zur Quelltextmessung: ein Selektor, den es nicht gibt, liefert
   `null` — die Messung sagt also nicht zu allem ja. */
p('Ein erfundener Selektor liefert nichts',
  bedingungVon(css, 'body:has(.gibt-es-nicht) #toast') === null);

/* ------------------------------------------------------------------------ */
const browser = await chromium.launch();

/**
 * Ein Fenster öffnen, eine Meldung zeigen, und nachsehen, ob sich
 * Meldung und Knöpfe überschneiden.
 *
 * @param zurueck  Die alte Lage erzwingen — für die Gegenprobe.
 */
const messen = async (telefon: boolean, oeffnen: string, zurueck = false) => {
  const ctx = await browser.newContext(telefon
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  const seite = await ctx.newPage();
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2600);
  const raus = await seite.evaluate(async ({ wie, alt }: { wie: string; alt: boolean }) => {
    const w = globalThis as any;
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    if (alt) {
      const st = document.createElement('style');
      st.textContent =
        '@media(max-width:760px){body:has(.overlay) #toast{' +
        'top:auto!important; bottom:calc(var(--hunten,59px) + 12px)!important;' +
        'transform:translateY(0)!important}}';
      document.head.appendChild(st);
    }
    const [modul, ruf] = wie.split('.') as [string, string];
    w[modul][ruf]();
    await new Promise(r => setTimeout(r, 500));
    w.UI.toast('Eine Meldung, die gerade jetzt kommt');
    await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('toast');
    if (!t) return { fehlt: true, knoepfe: [] as any[], toast: [0, 0], deckkraft: '0', hoehe: 0 };
    const tr = t.getBoundingClientRect();
    const knoepfe = [...document.querySelectorAll('.overlay .fbtns button')].map(k => {
      const r = k.getBoundingClientRect();
      return { text: (k.textContent || '').trim().slice(0, 20),
               ueber: !(r.right < tr.left || r.left > tr.right ||
                        r.bottom < tr.top || r.top > tr.bottom) };
    });
    return { fehlt: false, knoepfe, toast: [Math.round(tr.top), Math.round(tr.bottom)],
             deckkraft: getComputedStyle(t).opacity, hoehe: window.innerHeight };
  }, { wie: oeffnen, alt: zurueck });
  await ctx.close();
  return raus;
};

const FENSTER = ['Plan.tagesplan', 'Plan.wochenrueckblick', 'Plan.uebersicht'];

console.log('\n2 · Kein Knopf liegt am Telefon unter der Meldung');
const amTelefon: Record<string, any> = {};
for (const f of FENSTER) amTelefon[f] = await messen(true, f);

p('Die Fenster haben überhaupt Knöpfe im Fuss',
  FENSTER.filter(f => amTelefon[f].knoepfe.length).length >= 2,
  JSON.stringify(FENSTER.map(f => [f, amTelefon[f].knoepfe.length])));
gleich('Und keiner davon liegt unter der Meldung',
  FENSTER.flatMap(f => amTelefon[f].knoepfe.filter((k: any) => k.ueber)
    .map((k: any) => f + ': ' + k.text)), []);

/* ------------------------------------------------------------------------ */
console.log('\n3 · GEGENPROBE: mit der alten Lage liegt er es sehr wohl');

const alt = await messen(true, 'Plan.tagesplan', true);
p('Mit der alten Lage sind Knöpfe verdeckt',
  alt.knoepfe.some((k: any) => k.ueber),
  JSON.stringify({ toast: alt.toast, knoepfe: alt.knoepfe }));

/* ------------------------------------------------------------------------ */
console.log('\n4 · Am Rechner bleibt alles, wie es war');

const rechner = await messen(false, 'Plan.tagesplan');
gleich('Kein Knopf verdeckt',
  rechner.knoepfe.filter((k: any) => k.ueber).map((k: any) => k.text), []);
/* Und die Meldung steht dort weiterhin UNTEN — die Regel darf nicht
   auslaufen. Am Rechner ist unten Platz, und dort gehört sie hin. */
p('Und die Meldung steht am Rechner weiterhin unten',
  (rechner.toast[0] as number) > rechner.hoehe / 2,
  JSON.stringify({ toast: rechner.toast, hoehe: rechner.hoehe }));

/* ------------------------------------------------------------------------ */
console.log('\n5 · Und die Meldung ist oben wirklich zu sehen');

const tp = amTelefon['Plan.tagesplan'];
p('Sie ist nicht verschwunden', tp.fehlt === false && Number(tp.deckkraft) > 0.9,
  String(tp.deckkraft));
p('Sie steht im oberen Drittel', (tp.toast[0] as number) < tp.hoehe / 3,
  JSON.stringify({ toast: tp.toast, hoehe: tp.hoehe }));
p('Und ganz im Bild', (tp.toast[0] as number) >= 0 && (tp.toast[1] as number) <= tp.hoehe,
  JSON.stringify(tp.toast));

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
