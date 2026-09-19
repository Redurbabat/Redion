/* Suite 535 — Die Strichprobe zeigt den Strich (E623, W4-Rest)
 * ============================================================================
 * `.blatt-strich i` hiess „Strichprobe" und war keine. GEMESSEN am
 * 19. September 2026 an der laufenden App:
 *
 *     bausteine.css   .blatt-strich i{ background:currentColor }
 *
 * `currentColor` ist die TEXTFARBE DES KNOPFES — nicht die gewählte Tinte.
 * Und eine Deckung hatte der Balken gar nicht. Er sagte also „dick", und
 * genau das ist die eine Eigenschaft, die man einem Strich ohnehin ansieht;
 * der Unterschied zwischen einem Bleistiftstrich und einem Markerstrich
 * derselben Zahl steckt in Farbe und Deckung.
 *
 * DAZU EIN ZWEITER FUND, der beim Nachsehen herausfiel: die Deckung stand
 * VIERMAL im Quelltext — am Bildschirm beim Pinsel, beim Bleistift und beim
 * Marker, und noch einmal im PDF-Export —, obwohl der Kommentar über
 * `alsAnnotation` seit E506 behauptet, Farbe, Breite, Druckkurve und
 * Deckkraft stünden „hier und nirgends sonst (§8)". Zwei Rechnungen mit
 * denselben Zahlen gehen genau so lange gut, bis jemand eine davon ändert.
 *
 * ─── DIE ZUSAGEN DIESES LAUFS ──────────────────────────────────────────────
 *   §1 DIE PROBE TRÄGT DIE TINTE: wer die Farbe wechselt, sieht es auf der
 *      Kachel — und zwar dieselbe Farbe, die der Strich bekäme.
 *   §2 DIE PROBE TRÄGT DIE DECKUNG DES STIFTS: Bleistift 0,72 · Pinsel 0,92
 *      · Marker 0,32 · sonst voll.
 *   §3 EINE QUELLE: die Zahl auf der Kachel ist dieselbe, die der echte
 *      Strich auf dem Blatt trägt. Gemessen am gezeichneten SVG, nicht am
 *      Quelltext.
 *   §4 Keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 * Ja, und sie WAR es: mit `background:currentColor` und ohne `opacity` sind
 * §1 und §2 rot, §3 fällt mit. Gegengeprüft, indem die zwei Zeilen in
 * `staerkenBeschriften` wieder herausgenommen wurden.
 *
 *   node pruefungen/lauf/test535.mts
 *   node pruefungen/alle.mts 535
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9636;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml',
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

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const pg: Page = await ktx.newPage();
pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
pg.on('dialog', d => d.dismiss().catch(() => {}));
await pg.goto(`http://localhost:${PORT}/index.html`);
await pg.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
await pg.waitForTimeout(900);
const blattId = await pg.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
    .forEach(n => n.remove());
  const s = Store.addPage(null, { text: 'Strichprobe', icon: '🖋️' });
  Store.updateBlock(s.id, { wide: true });
  const b = Store.addBlock(s.id, 'blatt', {
    text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 841.89,
    raumVersion: 1, marken: []
  });
  Store.addBlock(b.id, 'text', { text: '' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 1100));
  return b.id;
});
await pg.click('.blatt-werk [data-wz="stift"]');
await pg.waitForTimeout(350);

/** Was auf den drei Kacheln steht und wie sie aussehen. */
const probe = () => pg.evaluate(() => {
  const striche = [...document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-strich')];
  return striche.map(k => {
    const i = k.querySelector<HTMLElement>('i');
    const st = i ? getComputedStyle(i) : null;
    return {
      grund: st?.backgroundColor ?? '',
      deckung: st ? Math.round(parseFloat(st.opacity) * 100) / 100 : -1,
      hoehe: i ? Math.round(i.getBoundingClientRect().height) : -1,
      name: (k.querySelector('.strich-name')?.textContent || '').trim(),
      mm: (k.querySelector('.strich-mm')?.textContent || '').trim()
    };
  });
});

/* ═══ §1 Die Probe trägt die Tinte ═════════════════════════════════════════ */
console.log('\n§1 Die Probe trägt die Tinte, nicht die Textfarbe');
const schwarz = await probe();
console.log('    ' + JSON.stringify(schwarz[1]));
p('Drei Kacheln', schwarz.length === 3, String(schwarz.length));
p('Jede trägt eine Farbe', schwarz.every(s => /^rgba?\(/.test(s.grund)), schwarz[0]?.grund);
/* Die zweite Farbe der Reihe ist Rot — sie wird geklickt, nicht gesetzt. */
const roteFarbe = await pg.evaluate(() => {
  const tupfer = [...document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe')]
    .filter(k => k.getClientRects().length > 0);
  const rot = tupfer[1];
  if (!rot) return '';
  rot.click();
  return String(rot.dataset['c'] || '');
});
await pg.waitForTimeout(300);
const nachFarbe = await probe();
console.log(`    gewählt: ${roteFarbe} → Probe: ${nachFarbe[1]?.grund}`);
p('Nach dem Farbwechsel ist die Probe eine andere Farbe',
  nachFarbe[1]?.grund !== schwarz[1]?.grund, `${schwarz[1]?.grund} → ${nachFarbe[1]?.grund}`);
/* Und zwar GENAU die gewählte: die Farbe des Tupfers, in rgb() umgerechnet. */
const gewaehltRgb = await pg.evaluate((hex: string) => {
  const d = document.createElement('div');
  d.style.color = hex; document.body.appendChild(d);
  const s = getComputedStyle(d).color; d.remove(); return s;
}, roteFarbe);
gleich('… und zwar genau die gewählte', nachFarbe[1]?.grund, gewaehltRgb);

/* ═══ §1b Die Probe liegt auf Papier, nicht auf der Leiste ════════════════ */
console.log('\n§1b Ein schwarzer Strich auf schwarzem Grund ist keine Probe');
/* GEMESSEN am 19. September 2026: schwarze Tinte ist rgb(17,17,17), die
   Leiste im Dunkelmodus rgb(32,32,32) — Kontrast 1,1 zu 1, also nichts zu
   sehen. Mit `currentColor` fiel das nie auf, weil die Textfarbe immer zum
   Grund passte. Die Abhilfe ist zugleich die ehrlichere Anzeige: die Probe
   liegt auf Papier, so wie der Strich später auch. */
/* SCHWARZE TINTE ZURÜCK — sie ist der schlimmste Fall gegen eine dunkle
   Leiste, und §1 hat gerade auf Rot gestellt. Mit Rot wäre die Messung
   milder und die Zusage weicher. */
await pg.evaluate(() => {
  const erster = document.querySelector<HTMLElement>('.blatt-werk .blatt-farbe');
  erster?.click();
});
await pg.waitForTimeout(280);
const aufPapier = await pg.evaluate(() => {
  const i = document.querySelector<HTMLElement>('.blatt-strich i');
  if (!i) return null;
  const st = getComputedStyle(i);
  const zahl = (farbe: string): number[] =>
    (farbe.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  const hell = (farbe: string): number => {
    const [r = 0, g = 0, b = 0] = zahl(farbe);
    const k = [r, g, b].map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * (k[0] ?? 0) + 0.7152 * (k[1] ?? 0) + 0.0722 * (k[2] ?? 0);
  };
  /* Der Grund HINTER dem Knopf — dort, wo die Probe ohne Papier läge. */
  let hinter = '', n: Element | null = i.closest('button');
  while (n && (!hinter || hinter === 'rgba(0, 0, 0, 0)')) {
    hinter = getComputedStyle(n as HTMLElement).backgroundColor;
    n = n.parentElement;
  }
  const papier = getComputedStyle(document.querySelector<HTMLElement>('.blatt-papier')
    || document.body).backgroundColor;
  const kontrast = (a: string, b: string): number => {
    const x = hell(a), y = hell(b);
    return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 10) / 10;
  };
  return {
    schatten: st.boxShadow,
    tinte: st.backgroundColor,
    hinter, papier,
    gegenLeiste: kontrast(st.backgroundColor, hinter),
    gegenPapier: kontrast(st.backgroundColor, papier)
  };
});
console.log('    ' + JSON.stringify(aufPapier));
p('Die Probe trägt einen Papiergrund', !!aufPapier && aufPapier.schatten !== 'none',
  aufPapier?.schatten);
p('… und der Strich hebt sich davon ab (mindestens 7 zu 1)',
  (aufPapier?.gegenPapier ?? 0) >= 7, `${aufPapier?.gegenPapier} zu 1`);
p('… was er ohne Papier nicht täte — das war der Fund',
  (aufPapier?.gegenLeiste ?? 99) < 1.5, `gegen die Leiste ${aufPapier?.gegenLeiste} zu 1`);

/* ═══ §2 Die Probe trägt die Deckung des Stifts ════════════════════════════ */
console.log('\n§2 Die Probe trägt die Deckung des Stifts');
const stiftDeckung = async (stil: string): Promise<number> => {
  await pg.click(`.blatt-werk [data-act="stilwahl"][data-stil="${stil}"]`);
  await pg.waitForTimeout(280);
  return (await probe())[1]?.deckung ?? -1;
};
const bleistift = await stiftDeckung('bleistift');
p('Bleistift: 0,72', bleistift === 0.72, String(bleistift));
const pinsel = await stiftDeckung('pinsel');
p('Pinsel: 0,92', pinsel === 0.92, String(pinsel));
const fueller = await stiftDeckung('fueller');
p('Füller: voll deckend', fueller === 1, String(fueller));
await pg.click('.blatt-werk [data-wz="marker"]');
await pg.waitForTimeout(300);
const marker = (await probe())[1]?.deckung ?? -1;
p('Marker: 0,32', marker === 0.32, String(marker));
/* UND DIE ZAHL AUF DER KACHEL FOLGT DEM WERKZEUG (E616): der Marker zieht
   das Vierfache, also steht dort 3,2 mm und nicht 0,8. */
const mmMarker = (await probe())[1]?.mm ?? '';
p('Beim Marker steht die vierfache Zahl auf der Kachel (E616)', mmMarker === '3,4 mm', mmMarker);

/* ═══ §3 Eine Quelle: Kachel und Blatt sagen dasselbe ══════════════════════ */
console.log('\n§3 Die Kachel zeigt, was das Blatt bekommt (eine Quelle, §8)');
/* ZURÜCK ZUM STIFT. §2 endet beim Marker, und die Stiftkacheln gehören
   zum Stift — beim Marker sind sie weg (E356, Gruppen je Werkzeug). Ohne
   diese Zeile wartet der Lauf dreissig Sekunden auf einen Knopf, den
   niemand versteckt hat: er gehört dort einfach nicht hin. */
await pg.click('.blatt-werk [data-wz="stift"]');
await pg.waitForTimeout(300);
for (const [stil, soll] of [['bleistift', 0.72], ['pinsel', 0.92]] as const) {
  await pg.click(`.blatt-werk [data-act="stilwahl"][data-stil="${stil}"]`);
  await pg.waitForTimeout(280);
  const kachel = (await probe())[1]?.deckung ?? -1;
  /* EINEN ECHTEN STRICH ZIEHEN und seine Deckung am SVG ablesen — nicht im
     Quelltext nachschauen. Genau dafür ist der Lauf da. */
  const blatt = await pg.locator('.blatt-papier').first().boundingBox();
  if (!blatt) { p(`Blatt gefunden (${stil})`, false); continue; }
  const y = blatt.y + 60 + (stil === 'pinsel' ? 40 : 0);
  await pg.mouse.move(blatt.x + 60, y);
  await pg.mouse.down();
  await pg.mouse.move(blatt.x + 220, y + 30, { steps: 8 });
  await pg.mouse.up();
  await pg.waitForTimeout(400);
  const amBlatt = await pg.evaluate((s: string) => {
    const pfade = [...document.querySelectorAll<SVGElement>(`[data-ink-stil="${s}"]`)];
    const letzter = pfade[pfade.length - 1];
    return letzter ? Number(letzter.getAttribute('opacity')) : -1;
  }, stil);
  p(`${stil}: Kachel ${kachel} = Blatt ${amBlatt}`, kachel === amBlatt && amBlatt === soll,
    `Kachel ${kachel}, Blatt ${amBlatt}, soll ${soll}`);
}

/* ═══ §4 Der Radierer hat eine Grösse — auch ohne Studio (E624) ═══════════ */
console.log('\n§4 Drei Grössen und ein Haken, auf der gewöhnlichen Seite');
await pg.click('.blatt-werk [data-wz="radierer"]');
await pg.waitForTimeout(350);
const radierer = () => pg.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const sicht = (e: Element) => (e as HTMLElement).getClientRects().length > 0;
  const groessen = [...w.querySelectorAll<HTMLElement>('[data-eraser-size]')].filter(sicht);
  const haken = w.querySelector<HTMLElement>('[data-act="radierauto"]');
  return {
    anzahl: groessen.length,
    werte: groessen.map(k => Number(k.dataset.eraserSize)),
    markiert: groessen.filter(k => k.getAttribute('aria-pressed') === 'true')
      .map(k => Number(k.dataset.eraserSize)),
    /* §37: die Radierergrössen sind die einzigen Leistenknöpfe mit echten
       44 x 44 px — das war der Fund aus E576 und bleibt gemessen. */
    masse: groessen.map(k => {
      const r = k.getBoundingClientRect();
      return Math.round(r.width) + '×' + Math.round(r.height);
    }),
    hakenDa: !!haken && sicht(haken),
    hakenAn: haken?.getAttribute('aria-pressed') === 'true',
    hakenName: haken?.getAttribute('aria-label') ?? ''
  };
});
const r0 = await radierer();
console.log('    ' + JSON.stringify(r0));
gleich('Drei Grössen, auch ohne Studio', r0.werte, [5, 14, 28]);
gleich('… genau eine ist markiert', r0.markiert.length, 1);
p('… und jede misst 44 × 44 px (§37)', r0.masse.every(m => m === '44×44'), r0.masse.join(' '));
p('Der Haken steht daneben', r0.hakenDa);
p('… und sagt, was er tut', /automatisch/i.test(r0.hakenName), r0.hakenName);
p('… und ist zu Beginn aus', r0.hakenAn === false);

/* Eine andere Grösse wählen — die Markierung wandert. */
await pg.click('.blatt-werk [data-eraser-size="28"]');
await pg.waitForTimeout(250);
const r1 = await radierer();
gleich('Eine gewählte Grösse ist die gewählte', r1.markiert, [28]);

/* DER HAKEN SCHALTET WIRKLICH — gemessen am RADIERKREIS auf dem Blatt,
   nicht am Knopf und nicht an einer Schnittstelle. Der Kreis trägt
   `r = radierRadius()`, und das ist genau die Zahl, mit der radiert wird:
   `eraserSize ?? max(5, Strichbreite × 3)`. Wer stattdessen `aria-pressed`
   prüft, prüft die Beschriftung. */
const radiusJetzt = async (): Promise<number> => {
  const blatt = await pg.locator('.blatt-papier').first().boundingBox();
  if (!blatt) return -1;
  await pg.mouse.move(blatt.x + 120, blatt.y + 200);
  await pg.mouse.down();
  await pg.waitForTimeout(120);
  const r = await pg.evaluate(() => {
    const k = document.querySelector<SVGElement>('.blatt-radierkreis');
    return k ? Number(k.getAttribute('r')) : -1;
  });
  await pg.mouse.up();
  await pg.waitForTimeout(120);
  return r;
};
const mitZahl = await radiusJetzt();
await pg.click('.blatt-werk [data-act="radierauto"]');
await pg.waitForTimeout(250);
const r2 = await radierer();
p('Der Haken lässt sich einschalten', r2.hakenAn === true);
gleich('… und keine Grösse ist dann markiert', r2.markiert.length, 0);
const mitAuto = await radiusJetzt();
console.log(`    Radius: gewählt ${mitZahl} → automatisch ${mitAuto}`);
p('… und der Radierer rechnet wirklich anders', mitZahl !== mitAuto && mitAuto > 0,
  `${mitZahl} → ${mitAuto}`);
await pg.click('.blatt-werk [data-act="radierauto"]');
await pg.waitForTimeout(250);
const r3 = await radierer();
p('Abgewählt kommt die gemerkte Grösse zurück', r3.markiert.join() === '28',
  r3.markiert.join());
const zurueck = await radiusJetzt();
p('… und der Radius mit ihr', zurueck === mitZahl, `${zurueck} statt ${mitZahl}`);

/* ═══ §5 Keine Seitenfehler ════════════════════════════════════════════════ */
console.log('\n§5 Keine Seitenfehler');
p('Die Seite meldet keinen Fehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

void blattId;
await ktx.close();
await browser.close();
server.close();
console.log(`\n${ok} gut, ${weg} weg`);
process.exit(weg === 0 ? 0 : 1);
