/* Suite 539 — Die Linse bricht, aber sie steht niemandem im Weg (E639)
 * ============================================================================
 * Redur hat am 20. September die Apple-TV-App unter iOS 26 geschickt und den
 * Übergang der unteren Leiste haben wollen. Gebaut wurde er auf dem, was schon
 * da war: `#ho-pille` wandert seit E236 von Reiter zu Reiter. Neu ist das GLAS.
 *
 * DIESER LAUF HÄLT DIE VIER SÄTZE, die beim Bauen teuer waren — jeder einzelne
 * von ihnen hat schon einmal etwas gekostet:
 *
 *   §1 SIE LIEGT DARÜBER, ABER SIE FÄNGT NICHTS AB. Eine Linse kann nur
 *      brechen, was hinter ihr liegt, also musste sie über die Knöpfe. Damit
 *      steht sie genau dort, wo der Daumen hintippt. `elementFromPoint` in der
 *      Mitte des aktiven Reiters MUSS den Knopf zurückgeben (§37).
 *   §2 DER FILTER LIEGT GENAU EINMAL IM DOKUMENT. E440 hat am KI-Funken
 *      gezeigt, was mehrere gleiche IDs anrichten; E462 hat daraus für die
 *      Textur die Regel gemacht. Dieselbe Regel, derselbe Wächter.
 *   §3 OHNE BEWEGUNG BLEIBT SIE SICHTBAR. Das ist die Falle aus §55.2: eine
 *      Linse, die bei `prefers-reduced-motion` verschwindet, liesse den
 *      aktiven Reiter unmarkiert — und die Prüfung „keine Bewegung" wäre
 *      trotzdem grün.
 *   §4 DIE FLÄCHE ÜBERLEBT OHNE BRECHUNG. Wo `backdrop-filter:url()` fehlt,
 *      darf NUR die Brechung wegfallen. Deshalb stehen Fläche und Brechung in
 *      zwei Regeln und nicht in einer.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `pointer-events:none` aus `#ho-pille` nehmen: `elementFromPoint`
 *        liefert die Pille statt des Knopfes. Gelaufen am 20. September, rot.
 *   §2 → in `linse.ts` die Wächterzeile `if (document.getElementById(HALTER))
 *        return;` entfernen: zwei Halter. Gelaufen, rot.
 *   §4 → die zwei Regeln in eine zusammenziehen: der Lauf zählt nur noch eine
 *        und wird rot. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test539.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9642;

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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/** Ein Telefon mit der unteren Leiste. Ohne `isMobile` bleibt sie versteckt —
 *  `#handy-oben{display:none}` gilt bis zur Telefonbreite. */
const telefon = async (ruhig: boolean) => {
  const s = await browser.newPage({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    ...(ruhig ? { reducedMotion: 'reduce' as const } : {})
  });
  s.on('pageerror', e => fehler.push(String(e.message).slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForTimeout(2600);
  /* DEN WILLKOMMENSSCHIRM WEGRÄUMEN. Beim ersten Start liegt `wk-fuss` über
     der unteren Leiste — `elementFromPoint` traf ihn statt des Reiters, und
     §1 war rot, ohne dass am Produkt etwas falsch gewesen wäre. Gefunden am
     20. September beim ersten Lauf dieser Suite. */
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage, .wk, [class*="wk-"]')
      .forEach(o => o.remove());
  });
  await s.waitForTimeout(400);
  return s;
};

/* Redion schaltet Bewegung nicht mit `0s` ab, sondern mit `.001ms`
   (`grund.css:182`, der übliche Reset). Gerechnet kommt `1e-06s` heraus.
   Wer hier auf `0s` prüft, prüft eine Schreibweise und nicht die Sache —
   dasselbe macht `test435` §5 mit derselben Hilfsfunktion. */
const sekunden = (w: string): number =>
  Math.max(...String(w).split(',').map(t => parseFloat(t) || 0));

/* ═══ §1 Sie liegt darüber, aber sie fängt nichts ab ════════════════════════*/
console.log('\n§1 Die Linse liegt über den Knöpfen — und im Weg steht sie trotzdem nicht');
{
  const s = await telefon(false);
  const m = await s.evaluate(() => {
    const leiste = document.getElementById('handy-oben');
    const pille = document.getElementById('ho-pille');
    const aktiv = document.querySelector<HTMLElement>('#handy-oben button.an');
    if (!leiste || !pille || !aktiv) return null;
    const ps = getComputedStyle(pille), as_ = getComputedStyle(aktiv);
    const r = aktiv.getBoundingClientRect();
    const mitte = document.elementFromPoint(
      Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
    return {
      pilleZ: Number(ps.zIndex), knopfZ: Number(as_.zIndex),
      durchlass: ps.pointerEvents,
      getroffen: mitte ? (aktiv.contains(mitte) ? 'knopf' : String(mitte.id || mitte.className)) : 'nichts',
      /* §37: der Hauptweg misst 44 px. Die Leiste ist ein Hauptweg. */
      knopfHoch: Math.round(r.height),
      pilleBreit: Math.round(pille.getBoundingClientRect().width),
      knopfBreit: Math.round(r.width)
    };
  });
  p('Es gibt die Leiste, die Linse und einen aktiven Reiter', !!m, JSON.stringify(m));
  if (m) {
    p('Die Linse liegt ÜBER dem Knopf — sonst hätte sie nichts zu brechen',
      m.pilleZ > m.knopfZ, `Linse ${m.pilleZ}, Knopf ${m.knopfZ}`);
    gleich('Sie nimmt keine Berührung an', m.durchlass, 'none');
    gleich('Ein Druck in die Mitte trifft den KNOPF, nicht die Linse', m.getroffen, 'knopf');
    p('Der Reiter ist mit dem Finger zu treffen (44 px, §37)', m.knopfHoch >= 44,
      `${m.knopfHoch} px`);
    p('Und die Linse steht wirklich auf ihm, nicht irgendwo',
      Math.abs(m.pilleBreit - m.knopfBreit) <= 2, `${m.pilleBreit} gegen ${m.knopfBreit}`);
  }
  await s.close();
}

/* ═══ §2 Der Filter liegt genau einmal im Dokument ══════════════════════════*/
console.log('\n§2 Ein Halter, zwei Filter, und kein zweiter Satz davon');
{
  const s = await telefon(false);
  const m = await s.evaluate(() => {
    const halter = document.querySelectorAll('#ru-linse-halter');
    const pille = document.getElementById('ho-pille');
    return {
      halter: halter.length,
      ruhe: document.querySelectorAll('filter#ru-linse-ruhe').length,
      fahrt: document.querySelectorAll('filter#ru-linse-fahrt').length,
      /* Der Halter darf kein Vorleseprogramm aufhalten und keine Fläche
         kosten — dieselbe Auflage wie beim Texturhalter (E462). */
      stumm: halter[0]?.getAttribute('aria-hidden'),
      hoch: halter[0] ? Math.round((halter[0] as HTMLElement).getBoundingClientRect().height) : -1,
      /* Und die Pille RUFT ihn auch wirklich. */
      filterAmGlas: pille ? getComputedStyle(pille).backdropFilter : ''
    };
  });
  gleich('Genau ein Halter', m.halter, 1);
  gleich('Genau ein Ruhe-Filter', m.ruhe, 1);
  gleich('Genau ein Fahrt-Filter', m.fahrt, 1);
  gleich('Der Halter ist für Vorleser unsichtbar', m.stumm, 'true');
  gleich('… und ohne Höhe', m.hoch, 0);
  p('Die Linse ruft den Ruhe-Filter', /ru-linse-ruhe/.test(m.filterAmGlas), m.filterAmGlas);
  await s.close();
}

/* ═══ §3 Ohne Bewegung bleibt sie sichtbar ══════════════════════════════════*/
console.log('\n§3 Ohne Bewegung steht sie still — und bleibt trotzdem da');
{
  const s = await telefon(true);
  const m = await s.evaluate(() => {
    const pille = document.getElementById('ho-pille');
    if (!pille) return null;
    const c = getComputedStyle(pille);
    const vor = getComputedStyle(pille, '::before');
    return {
      reduziert: matchMedia('(prefers-reduced-motion: reduce)').matches,
      uebergang: c.transitionDuration,
      deckung: Number(c.opacity),
      breit: Math.round(pille.getBoundingClientRect().width),
      glanz: Number(vor.opacity)
    };
  });
  p('Die Seite weiss, dass keine Bewegung gewünscht ist', m?.reduziert === true);
  if (m) {
    p('Die Linse bewegt sich nicht mehr', sekunden(m.uebergang) < 0.05, m.uebergang);
    /* DAS IST DER PUNKT DES ABSCHNITTS. Ohne ihn wäre „keine Bewegung" auch
       dann grün, wenn die Linse ganz verschwunden wäre — und der aktive
       Reiter stünde unmarkiert da (§38: nicht nur über Farbe). */
    p('… ist aber SICHTBAR: sie hat Deckung', m.deckung > 0.5, String(m.deckung));
    p('… und Breite', m.breit > 40, `${m.breit} px`);
    p('… und ihr Glanzrand ist auch noch da', m.glanz > 0, String(m.glanz));
  }
  await s.close();
}

/* ═══ §4 Quellen ════════════════════════════════════════════════════════════*/
console.log('\n§4 Quellen: zwei Regeln, nicht eine — und die Quelle ist TypeScript');
{
  const css = lies('quell/schale/stil/bausteine.css');
  /* FLÄCHE UND BRECHUNG IN ZWEI REGELN. Ein Browser, der `url()` in
     `backdrop-filter` nicht kennt, verwirft die ganze Regel, in der es steht.
     Stünde die Fläche in derselben, fiele sie mit weg — und der aktive Reiter
     hätte gar keine Markierung mehr. */
  const flaeche = /#handy-oben #ho-pille\{[^}]*background:color-mix\(/.test(css);
  const brechung = /#handy-oben #ho-pille\{[\s\S]{0,200}?backdrop-filter:url\(#ru-linse-ruhe\)/.test(css);
  const zusammen = /#handy-oben #ho-pille\{[^}]*background:color-mix\([^}]*url\(#ru-linse/.test(css);
  p('Die Fläche steht in einer eigenen Regel', flaeche);
  p('Die Brechung steht in einer eigenen Regel', brechung);
  p('… und die beiden sind NICHT dieselbe Regel', !zusammen);
  p('Die Fahrt hat ihre eigene Regel', /#ho-pille\.faehrt\{[\s\S]{0,160}?url\(#ru-linse-fahrt\)/.test(css));
  p('Ohne Bewegung fällt die Fahrt-Brechung auf die Ruhe zurück',
    /prefers-reduced-motion:reduce\)\{[\s\S]{0,700}?#ho-pille\.faehrt\{[\s\S]{0,180}?url\(#ru-linse-ruhe\)/.test(css));

  p('linse: die Quelle ist TypeScript, das .js ist erzeugt',
    fs.existsSync(path.join(WURZEL, 'src/schale/bedienung/linse.ts')) &&
    /ERZEUGT/.test(lies('quell/schale/bedienung/linse.js')));
  p('index.html lädt linse.js',
    /quell\/schale\/bedienung\/linse\.js/.test(lies('index.html')));
  p('Der GRUNDSTOCK kennt linse.js (§28)',
    /\.\/quell\/schale\/bedienung\/linse\.js/.test(lies('src/dienst/sw.ts')));
  /* Der Halter wird EINMAL gebaut — die Zeile, die das hält. */
  p('`sicherstellen` kehrt um, wenn es den Halter schon gibt',
    /if \(document\.getElementById\(HALTER\)\) return;/.test(lies('src/schale/bedienung/linse.ts')));
}

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
