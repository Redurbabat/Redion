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
 *   §7 GEDEHNT WIRD NUR ZWISCHEN NACHBARN (E641). Eine Brücke spannt sich
 *      zwischen Dingen, die sich fast berühren; über vier Reiter hinweg
 *      wäre sie ein Schlauch.
 *   §5 IM STUDIO FLIEGT DER WECHSEL. Der Grund sitzt am Knopf und kann
 *      nicht verrutschen; nur der Übergang bekommt eine kurzlebige Fläche,
 *      die von Stift zu Radierer fliegt (E640). Unten ist es Glas, dort
 *      eine gefüllte Fläche — der Satz dahinter ist derselbe.
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
declare const Store: any; declare const App: any;
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
const telefon = async (ruhig: boolean, ohneDurchsicht = false) => {
  const s = await browser.newPage({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    ...(ruhig ? { reducedMotion: 'reduce' as const } : {})
  });
  /* `prefers-reduced-transparency` gibt es nicht als Kontext-Option, wohl
     aber über `emulateMedia`. Ohne diesen Weg liesse sich der Fall gar nicht
     prüfen — und eine Regel, die niemand prüft, ist eine Absicht. */
  if (ohneDurchsicht) {
    /* Die LAUFZEIT kann `reducedTransparency` — nachgeprüft, nicht vermutet.
       Die mitgelieferten Typen von Playwright 1.56 kennen es noch nicht.
       Deshalb genau diese eine Erweiterung und kein `any` über die ganze
       Seite (§52.7): fällt das Merkmal eines Tages weg, sagt es der
       Typprüfer hier und nicht irgendwo im Lauf. */
    type Medien = Parameters<typeof s.emulateMedia>[0] &
      { reducedTransparency?: 'reduce' | 'no-preference' };
    await s.emulateMedia({ reducedTransparency: 'reduce' } as Medien);
  }
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
console.log('\n§2 Ein Halter, EIN Filter, und kein zweiter Satz davon');
{
  const s = await telefon(false);
  const m = await s.evaluate(() => {
    const halter = document.querySelectorAll('#ru-linse-halter');
    const pille = document.getElementById('ho-pille');
    return {
      halter: halter.length,
      ruhe: document.querySelectorAll('filter#ru-linse-ruhe').length,
      fahrt: document.querySelectorAll('filter#ru-linse-fahrt').length,
      alleLinsen: document.querySelectorAll('#ru-linse-halter filter').length,
      /* Der Halter darf kein Vorleseprogramm aufhalten und keine Fläche
         kosten — dieselbe Auflage wie beim Texturhalter (E462). */
      stumm: halter[0]?.getAttribute('aria-hidden'),
      hoch: halter[0] ? Math.round((halter[0] as HTMLElement).getBoundingClientRect().height) : -1,
      /* Und die Pille RUFT ihn auch wirklich. */
      filterAmGlas: pille ? getComputedStyle(pille).backdropFilter : ''
    };
  });
  gleich('Genau ein Halter', m.halter, 1);
  gleich('Genau ein Fahrt-Filter', m.fahrt, 1);
  /* ══ UND KEINEN RUHE-FILTER MEHR (E646) ════════════════════════════════
     Hier stand „Genau ein Ruhe-Filter". Seit die Fläche im Stillstand
     nicht mehr bricht, ruft ihn kein Stilblatt mehr — ein Filter, den
     niemand nennt, ist eine Zeile, die aussieht, als täte sie etwas.
     Diese Zeile hält fest, dass er nicht zurückkommt, ohne dass jemand es
     merkt. */
  gleich('Und keinen Ruhe-Filter mehr — er wurde von niemandem gerufen', m.ruhe, 0);
  gleich('Der Halter hält genau diesen einen Filter', m.alleLinsen, 1);
  gleich('Der Halter ist für Vorleser unsichtbar', m.stumm, 'true');
  gleich('… und ohne Höhe', m.hoch, 0);
  /* ══ IM RUHEZUSTAND WIRD NICHT GEBROCHEN (E646) ════════════════════════
     Hier stand „Die Linse ruft den Ruhe-Filter". Seit E646 tut sie das
     nicht mehr: die Brechung lief bisher auch im Stillstand und machte aus
     der Fläche einen hellen Ring — Redurs Punkt 5 („weniger wie eine
     umrandete einzelne Taste"). Sie läuft jetzt nur während der Fahrt.

     GLAS BLEIBT SIE TROTZDEM, und genau das wird hier geprüft: ohne
     `saturate`/`brightness` wäre sie eine gewöhnliche Fläche, und die
     Zusage aus E639 („eine Linse, keine Farbe") wäre still verlorengegangen. */
  p('Im Ruhezustand bricht sie nicht', !/url\(/.test(m.filterAmGlas), m.filterAmGlas);
  p('… tastet den Hintergrund aber weiter ab',
    /saturate/.test(m.filterAmGlas) && /brightness/.test(m.filterAmGlas), m.filterAmGlas);
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
  /* SEIT E646 STEHT DIE BRECHUNG NUR NOCH AN `.faehrt` — die Regel „Fläche
     und Brechung nicht in derselben Regel" gilt damit erst recht, und sie
     wird hier weiter geprüft: ein Browser ohne `url()` in `backdrop-filter`
     verwirft die Fahrt-Regel und behält die Fläche. */
  const zusammen = /#handy-oben #ho-pille\{[^}]*background:color-mix\([^}]*url\(#ru-linse/.test(css);
  p('Die Fläche steht in einer eigenen Regel', flaeche);
  p('Die Brechung steht NICHT in derselben Regel wie die Fläche', !zusammen);
  p('Die Fahrt hat ihre eigene Regel', /#ho-pille\.faehrt\{[\s\S]{0,160}?url\(#ru-linse-fahrt\)/.test(css));
  /* OHNE BEWEGUNG FÄLLT DIE FAHRT-BRECHUNG WEG — auf dieselbe Fläche wie
     im Ruhezustand, und die trägt seit E646 gar kein `url()` mehr. Vorher
     stand hier `url(#ru-linse-ruhe)`; das wäre jetzt eine Brechung, die es
     im Ruhezustand nicht gibt. */
  const ohneBewegung = css.match(/prefers-reduced-motion:reduce\)\{[\s\S]{0,900}?#ho-pille\.faehrt\{([\s\S]{0,260}?)\}/);
  p('Ohne Bewegung fällt die Fahrt-Brechung weg',
    !!ohneBewegung && !/url\(/.test(ohneBewegung[1] ?? '') && /saturate/.test(ohneBewegung[1] ?? ''),
    (ohneBewegung?.[1] ?? 'nicht gefunden').slice(0, 120));

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

/* ═══ §7 Gedehnt wird nur zwischen Nachbarn ════════════════════════════════*/
console.log('\n§7 Die Brücke spannt sich zwischen Nachbarn — nicht über vier Reiter');
{
  /* ─── WARUM DAS EINE REGEL IST UND KEIN GESCHMACK ────────────────────────
     Das Design-System sagt es an zwei Stellen: dehnen darf sich die Fläche
     zwischen Zielen, die sich fast berühren, und bei weiten Wegen gar
     nicht. Eine Brücke spannt sich zwischen zwei Dingen, die nah
     beieinander liegen; über vier Reiter hinweg ist sie keine Brücke mehr.
     E639 hatte es genau umgekehrt — je weiter der Sprung, desto stärker
     die Dehnung —, und der weiteste Weg der Leiste bekam die grösste
     Verformung. E641 hat es gedreht. */
  const s = await telefon(false);
  const messen = async (vonNr: number, nachNr: number) => {
    await s.evaluate((nr) => {
      const k = document.querySelectorAll<HTMLElement>('#handy-oben button')[nr];
      k?.click();
    }, vonNr);
    await s.waitForTimeout(700);
    await s.evaluate(() => {
      (globalThis as any).__dehn = [];
      const p2 = document.getElementById('ho-pille');
      /* ══ DIE DEHNUNG STECKT IM `transform` (E646) ══════════════════════
         Hier wurde `--dehnung` gelesen. Seit E646 rechnet `SelectionFlow`
         die Dehnung in die Keyframes hinein — eine benutzerdefinierte
         Eigenschaft in der Bahn zöge die ganze Bewegung zurück auf den
         Hauptfaden, und genau das sollte sie ja verlassen. Gelesen wird
         deshalb der erste Wert der Matrix, und das ist scaleX. */
      const takt = () => {
        if (p2) {
          const m2 = getComputedStyle(p2).transform.match(/matrix\(([-\d.]+)/);
          (globalThis as any).__dehn.push(m2 ? Number(m2[1]) : 1);
        }
        requestAnimationFrame(takt);
      };
      takt();
    });
    await s.evaluate((nr) => {
      const k = document.querySelectorAll<HTMLElement>('#handy-oben button')[nr];
      k?.click();
    }, nachNr);
    await s.waitForTimeout(500);
    return await s.evaluate(() =>
      Math.max(...((globalThis as any).__dehn as number[])));
  };
  /* Nachbar: Reiter 0 → 1. */
  const nah = await messen(0, 1);
  /* Weit: Reiter 0 → 4, der weiteste Weg, den diese Leiste hat. */
  const fern = await messen(0, 4);
  p('Zum Nachbarn spannt sich eine Brücke', nah > 1.05, `Dehnung ${nah}`);
  p('… und sie bleibt bescheiden (keine Gummiband-Oberfläche)', nah <= 1.3,
    `Dehnung ${nah}`);
  p('Über vier Reiter wird NICHT gedehnt', fern <= 1.001, `Dehnung ${fern}`);
  await s.close();
}

/* ═══ §6 Ohne Durchsicht: geprüft an der Quelle, nicht an der Seite ════════*/
console.log('\n§6 Ohne Durchsicht: kein Glas, aber eine Auswahl');
{
  /* ─── WARUM HIER DIE QUELLE GEPRÜFT WIRD UND NICHT DIE SEITE ─────────────
     Am 20. September nachgemessen: der Chromium dieses Projekts kennt
     `prefers-reduced-transparency` NICHT. Weder `emulateMedia` noch der
     Startschalter `--force-prefers-reduced-transparency` bringen
     `matchMedia(...).matches` auf `true` — beides ausprobiert, beides
     `false`.

     Eine Zusage, die den Zustand nicht herstellen kann, den sie prüft, wäre
     also IMMER rot. Das wäre kein Wächter, sondern eine Dauerbeschwerde
     (§55.2). Geprüft wird deshalb, dass die Regel DASTEHT und das Richtige
     sagt — weniger, als ich wollte, aber wahr. Dass sie auch wirkt, ist
     ungemessen und steht als L203 in `LUECKEN.md`. */
  const css = lies('quell/schale/stil/bausteine.css');
  const block = css.split('prefers-reduced-transparency:reduce)')[1] || '';
  const bis = block.slice(0, 900);
  p('Es gibt eine Regel für „keine Durchsicht"', block.length > 0);
  p('Die Leiste gibt ihr Glas ab', /#handy-oben\{[^}]*backdrop-filter:none/.test(bis), bis.slice(0, 120));
  p('Die Linse auch — in Ruhe wie in Fahrt',
    /#ho-pille,\s*\n?\s*#handy-oben #ho-pille\.faehrt\{[\s\S]{0,220}?backdrop-filter:none/.test(bis));
  /* DAS IST DER PUNKT. Ohne ihn stünde „kein Glas" auch dann, wenn die
     Auswahl ganz verschwände — und der aktive Reiter wäre unmarkiert (§38). */
  p('… aber die Fläche bleibt: die Regel setzt einen Grund',
    /#ho-pille,[\s\S]{0,260}?background:var\(--bg-hover\)/.test(bis), bis.slice(0, 200));
  p('Und der Glanzrand geht aus — er ist reines Glas',
    /#ho-pille::before,[\s\S]{0,140}?opacity:0/.test(bis));
}

/* ═══ §5 Im Studio wandert sie auch — und springt nicht ═════════════════════*/
console.log('\n§5 Die Werkzeugwahl wandert von Stift zu Radierer, statt zu springen');
{
  /* DIESELBE BAUFORM, ZWEITER ORT (E640). Unten ist es Glas, hier eine
     gefüllte Fläche — aber der Satz dahinter ist derselbe: EIN Ding, das
     sich bewegt, statt zweier, die auftauchen und verschwinden. Deshalb
     steht die Prüfung hier und nicht in einer eigenen Suite: was an zwei
     Stellen verschieden geprüft wird, läuft auseinander (§8). */
  const pg = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  pg.on('pageerror', e => fehler.push(String(e.message).slice(0, 140)));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await pg.waitForTimeout(900);
  await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(n => n.remove());
    const seite = Store.addPage(null, { text: 'Wanderprobe', icon: '🧭' });
    /* BREIT, damit die Leiste ihre volle Zeile hat (Behälterabfrage, E359). */
    Store.updateBlock(seite.id, { wide: true });
    const blatt = Store.addBlock(seite.id, 'blatt', {
      text: '', papier: 'punkte', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: []
    });
    Store.addBlock(blatt.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(f => setTimeout(f, 1100));
  });
  await pg.waitForTimeout(500);

  const ruhe = await pg.evaluate(() => {
    const a2 = document.querySelector<HTMLElement>('.blatt-werk button[data-wz].on');
    return {
      werkzeug: a2?.dataset['wz'] || '',
      /* IM RUHEZUSTAND TRÄGT DEN GRUND DER KNOPF. Das ist der Kern der
         Bauform: eine gespeicherte Stelle daneben veraltet bei jedem
         Umbruch — ein Grund am Knopf kann das gar nicht. */
      grund: a2 ? getComputedStyle(a2).backgroundColor : '',
      /* Und es fliegt nichts herum, wenn nichts passiert. */
      fluege: document.querySelectorAll('.bw-flug').length
    };
  });
  /* FRISCH GEÖFFNET GILT „Schreiben", nicht der Stift — nachgesehen, nicht
     angenommen. Der erste Entwurf dieser Zeile stand auf „stift" und war
     aus genau diesem Grund rot. */
  gleich('Im Ruhezustand gilt „Schreiben"', ruhe.werkzeug, 'schreiben');
  p('Der Knopf trägt seinen Grund selbst',
    !/rgba\(0, 0, 0, 0\)|transparent/.test(ruhe.grund), ruhe.grund);
  gleich('Und es fliegt nichts herum', ruhe.fluege, 0);

  /* JETZT DER PUNKT DES ABSCHNITTS: der Weg dazwischen. Beim Wechsel fliegt
     EINE Fläche vom alten zum neuen Werkzeug. Gezählt werden die
     verschiedenen Orte, die sie unterwegs einnimmt — springt sie, ist es
     einer; wandert sie, sind es viele. Die Schwelle steht bewusst niedrig:
     unter Volllast der ganzen Suite malt der Browser wenige Bilder, und
     daran soll kein Punkt scheitern (die Lehre aus `test114` §17). */
  await pg.evaluate(() => {
    (globalThis as any).__flug = { orte: [] as number[], gesehen: 0, wartet: 0 };
    const takt = () => {
      const f = document.querySelector<HTMLElement>('.bw-flug');
      if (f) {
        (globalThis as any).__flug.gesehen++;
        (globalThis as any).__flug.orte.push(Math.round(f.getBoundingClientRect().left));
      }
      if (document.querySelector('.blatt-werk .bw-wartet'))
        (globalThis as any).__flug.wartet++;
      requestAnimationFrame(takt);
    };
    takt();
  });
  await pg.click('.blatt-werk [data-wz="radierer"]').catch(() => {});
  await pg.waitForTimeout(900);
  const weg = await pg.evaluate(() => {
    const a2 = document.querySelector<HTMLElement>('.blatt-werk button[data-wz].on')!;
    const f = (globalThis as any).__flug;
    const einzig = [...new Set(f.orte as number[])];
    return {
      werkzeug: a2.dataset['wz'], gesehen: f.gesehen, wartet: f.wartet,
      orte: einzig.length,
      spanne: einzig.length ? Math.max(...einzig) - Math.min(...einzig) : 0,
      /* Danach ist die Fläche WEG und der Grund wieder am Knopf. */
      uebrig: document.querySelectorAll('.bw-flug').length,
      grund: getComputedStyle(a2).backgroundColor,
      wartetNoch: document.querySelectorAll('.blatt-werk .bw-wartet').length
    };
  });
  gleich('Nach dem Klick gilt der Radierer', weg.werkzeug, 'radierer');
  p('Eine Fläche ist geflogen', weg.gesehen > 0, `${weg.gesehen} Bilder lang`);
  p('… und hat UNTERWEGS Stellen eingenommen, statt zu springen',
    weg.orte >= 3, `${weg.orte} verschiedene Orte über ${weg.spanne} px`);
  p('… das Ziel hat solange schwach vorgeleuchtet (§38)', weg.wartet > 0,
    `${weg.wartet} Bilder lang`);
  gleich('Danach ist keine Fläche mehr übrig', weg.uebrig, 0);
  gleich('… und keiner wartet mehr', weg.wartetNoch, 0);
  p('Der Grund sitzt wieder am Werkzeug',
    !/rgba\(0, 0, 0, 0\)|transparent/.test(weg.grund), weg.grund);

  /* ── SCHNELL HINTEREINANDER: EINE FLÄCHE, NICHT DREI ──────────────────
     Wer A → B → C tippt, soll EINE Fläche sehen, die ihre Richtung ändert.
     Eine Warteschlange verbietet das Design-System ausdrücklich, und ohne
     diesen Punkt merkt es niemand: zwei Flächen nebeneinander sieht man
     erst, wenn man schnell genug tippt. Gezählt wird die HÖCHSTZAHL
     gleichzeitiger Flächen über alle Bilder. */
  await pg.evaluate(() => {
    (globalThis as any).__viele = 0;
    const takt = () => {
      const n = document.querySelectorAll('.bw-flug').length;
      if (n > (globalThis as any).__viele) (globalThis as any).__viele = n;
      requestAnimationFrame(takt);
    };
    takt();
  });
  for (const wz of ['stift', 'marker', 'select']) {
    await pg.click(`.blatt-werk [data-wz="${wz}"]`).catch(() => {});
    await pg.waitForTimeout(60);
  }
  await pg.waitForTimeout(900);
  const schnell = await pg.evaluate(() => ({
    hoechstens: (globalThis as any).__viele as number,
    uebrig: document.querySelectorAll('.bw-flug').length,
    wartet: document.querySelectorAll('.blatt-werk .bw-wartet').length,
    werkzeug: document.querySelector<HTMLElement>('.blatt-werk button[data-wz].on')?.dataset['wz'],
    markiert: document.querySelectorAll('.blatt-werk button[data-wz].on').length
  }));
  p('Drei Wechsel schnell hintereinander: nie mehr als EINE Fläche unterwegs',
    schnell.hoechstens <= 1, `höchstens ${schnell.hoechstens} gleichzeitig`);
  gleich('Am Ende gilt das zuletzt Getippte', schnell.werkzeug, 'select');
  gleich('… und zwar genau eines', schnell.markiert, 1);
  gleich('Nichts fliegt mehr', schnell.uebrig, 0);
  gleich('Und niemand leuchtet mehr blass vor', schnell.wartet, 0);
  await pg.close();
}

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
