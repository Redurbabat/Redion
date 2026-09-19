/* Suite 449 — Das Gekritzel nimmt, was es überquert; die Treffer nur ihre Seite (E476)
 * ============================================================================
 * Die letzten zwei der 25 ungeprüften Funde aus der Runde nach E473.
 *
 * DER ERSTE IST DATENVERLUST (§9, §51). `kritzelTrifft` fragte: liegt die
 * Marke im KASTEN des Gekritzels? Ein Kasten ist aber keine Wischspur. Wer
 * schräg über die Seite kritzelt — von links oben nach rechts unten, wie
 * über eine Zeile, die quer steht —, spannt einen Kasten über die halbe
 * Seite auf, und ALLES, dessen Mitte darin lag, war weg. Auch was
 * handbreit neben dem Zug stand. Es fiel nie auf, weil ein kurzes
 * Gekritzel einen kleinen Kasten hat.
 *
 * DER ZWEITE KOSTET NUR ZEIT, aber quadratisch und genau beim Rollen:
 * `zeichneStand` rief `trefferMalen()` OHNE Seitenangabe. Die hundertste
 * nachgezogene Seite riss neunundneunzig fertige Trefferschichten ab und
 * baute sie neu auf.
 *
 *   §1 DER FALL, um den es geht: der Kasten des Gekritzels deckt eine
 *      Marke, die der Zug nie berührt hat — sie bleibt.
 *   §2 UND DAS GEWOLLTE geht weiter: was der Zug überquert, ist weg
 *      (Strich wie Kasten), Gesperrtes und Bilder nie.
 *   §3 DIE TREFFER DER SUCHE: eine nachgezogene Seite malt nur ihre
 *      eigene Schicht neu, die der anderen bleiben stehen.
 *   §4 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `kritzelTrifft` wieder den Kasten fragen statt den Weg: die
 *        unbeteiligte Marke ist weg. Gelaufen, rot.
 *   §3 → `trefferMalen(i)` in `zeichneStand` wieder ohne `i`: die alten
 *        Schichten werden ersetzt. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test449.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9569;
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

/* DER TAKT IST NICHT BEIWERK (E636, 19. September 2026). Ein Zug ohne Takt
   feuert alle Punkte in einer Schleife — die Zeitstempel liegen dann
   Mikrosekunden auseinander, `marken.ts` rechnet mit `dt = 1 ms`, und der
   Glätter dämpft seit E504 nach ZEIT. Bei dt = 1 ms glättet er doppelt so
   stark wie bei einem echten Stift. Das ist kein Gerät, das es gibt: 1 ms
   bei diesem Punktabstand wären rund 9500 Punkte je Sekunde.
   Wer misst, ob ein Zug als Gekritzel ERKANNT wird, muss ihn deshalb
   takten. 8 ms sind 125 Hz — mitten im Feld echter Stifte (60–240 Hz). */
type Zug = { art?: string; ziel?: string; halten?: number; takt?: number };
const zug = (s: Page, punkte: number[][], opt: Zug = {}) =>
  s.evaluate(async ({ punkte, opt }: { punkte: number[][]; opt: Zug }) => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken');
    if (!f) throw new Error('keine Zeichenschicht');
    const ctm = f.getScreenCTM();
    if (!ctm) throw new Error('kein CTM');
    const px = (q: number[]) => { const pt = f.createSVGPoint(); pt.x = q[0]!; pt.y = q[1]!; const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const art = opt.art || 'mouse';
    const ev = (typ: string, q: number[]) => { const c = px(q); return new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
      pointerId: 7, pointerType: art, isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
      buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 }); };
    const start = opt.ziel ? f.querySelector(opt.ziel) : f;
    if (!start) throw new Error('Ziel fehlt: ' + opt.ziel);
    start.dispatchEvent(ev('pointerdown', punkte[0]!));
    for (let i = 1; i < punkte.length; i++) {
      f.dispatchEvent(ev('pointermove', punkte[i]!));
      if (opt.takt) await new Promise(r => setTimeout(r, opt.takt));
    }
    if (opt.halten) await new Promise(r => setTimeout(r, opt.halten));
    f.dispatchEvent(ev('pointerup', punkte[punkte.length - 1]!));
    await new Promise(r => setTimeout(r, 400));
  }, { punkte, opt });
const marken = async (s: Page): Promise<any[]> => JSON.parse(await s.evaluate(`(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify((b && b.marken) || []);
})()`) as string);
const mitBlatt = async (liste: unknown[]): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Zeichenziel !== 'undefined'");
  await s.evaluate(async (liste: unknown[]) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:kritzel', true);
    Store.setMeta('zeichnen:formen', true);
    const seite = Store.addPage(null, { text: 'Kritzelblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: liste });
    await Store.flush();
    App.oeffne(seite.id);
  }, liste);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

/* Ein Gekritzel SCHRÄG über die Seite: es zickzackt quer zur Diagonalen
   von (100,100) nach (500,500). Sein Kasten ist damit fast die halbe
   Seite gross — und genau darum ging es. */
const schraegKritzel = (): number[][] => {
  const von = [100, 100], bis = [500, 500];
  const dx = bis[0]! - von[0]!, dy = bis[1]! - von[1]!;
  const laenge = Math.hypot(dx, dy);
  const ex = dx / laenge, ey = dy / laenge;         /* entlang der Diagonalen */
  const qx = -ey, qy = ex;                          /* quer dazu */
  /* Dicht und schmal: Zacken von ±18 Punkten alle zwölf Punkte. Der WEG
     deckt damit ein Band von sechsunddreissig Punkten entlang der
     Diagonalen — der KASTEN aber vierhundert mal vierhundert. Genau
     dieser Unterschied ist der Fund.

     ABGETASTET WIE VON HAND (vier Punkte je Zacke): der Stift glättet den
     Zug (E376), und ein Zickzack aus blossen Eckpunkten käme geglättet
     als Bogen an — dann wäre es kein Gekritzel mehr, und die Prüfung
     prüfte etwas anderes als sie sagt. Nachgemessen mit diesen Zahlen:
     Weg 1716 gegen die Schwelle 1308, und die Diagonale liegt überall
     unter 3,2 Punkten vom Weg.

     UND GETAKTET, seit E636. Diese 1716 sind unter dem Glätter von vor
     E504 gemessen. Seit E504 rechnet er in Zeit, und ohne Takt meldet
     dieser Lauf 1000 Hz — dabei schrumpft derselbe Weg auf 1037 und
     fällt unter die Schwelle. Der Zug wurde dann gar nicht mehr als
     Gekritzel erkannt, und §1 war grün, weil NICHTS gelöscht wurde:
     die schlimmste Sorte grün. `takt: 8` macht daraus 125 Hz. */
  const A = 18, PITCH = 12, SUB = 4;
  const N = Math.round(laenge / PITCH);
  const ecken: number[][] = [];
  for (let i = 0; i <= N; i++) {
    const d = (i / N) * laenge, q = (i % 2 ? 1 : -1) * A;
    ecken.push([von[0]! + ex * d + qx * q, von[1]! + ey * d + qy * q]);
  }
  const pts: number[][] = [];
  for (let i = 0; i < ecken.length - 1; i++)
    for (let k = 0; k < SUB; k++) {
      const t = k / SUB;
      pts.push([ecken[i]![0]! + (ecken[i + 1]![0]! - ecken[i]![0]!) * t,
                ecken[i]![1]! + (ecken[i + 1]![1]! - ecken[i]![1]!) * t]);
    }
  pts.push(ecken[ecken.length - 1]!);
  return pts;
};

/* ═══ §1 Der Fall, um den es geht ══════════════════════════════════════════ */
console.log('\n§1 Was der Zug nie berührt hat, bleibt');
{
  const s = await mitBlatt([
    /* AUF dem Weg, mitten in der Diagonalen. */
    { id: 'drauf', art: 'line', farbe: '#d64545', breite: 2.4, pts: [[290, 290], [310, 310]] },
    /* IM KASTEN, aber weit neben dem Weg — oben rechts. */
    { id: 'daneben', art: 'line', farbe: '#2f7ed8', breite: 2.4, pts: [[430, 140], [480, 160]] },
    /* Ebenfalls im Kasten, unten links. */
    { id: 'daneben2', art: 'rectangle', farbe: '#3aa757', breite: 2.4, pts: [[130, 430], [200, 480]] }
  ]);
  const pfad = schraegKritzel();
  const lage = JSON.parse(await s.evaluate((pts: number[][]) => JSON.stringify({
    kasten: InkGeometry.bounds({ pts, breite: 6 }),
    drin: ['daneben', 'daneben2'].map(id => {
      const b = Object.values(Store.cache.blocks).find((x: any) => x.type === 'blatt' && x.alive) as any;
      const m = b.marken.find((q: any) => q.id === id);
      const k = InkGeometry.bounds({ pts, breite: 6 });
      const c = InkGeometry.bounds(m);
      const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
      return { id, imKasten: cx >= k.x && cx <= k.x + k.width && cy >= k.y && cy <= k.y + k.height };
    })
  }), pfad) as string);
  p('Der Kasten des Gekritzels ist wirklich gross (über 350 × 350) …',
    lage.kasten.width > 350 && lage.kasten.height > 350, JSON.stringify(lage.kasten));
  gleich('… und beide unbeteiligten Marken liegen darin — das war der Fund',
    lage.drin, [{ id: 'daneben', imKasten: true }, { id: 'daneben2', imKasten: true }]);

  await s.click('.blatt-werk [data-wz="stift"]');
  await zug(s, pfad, { takt: 8 });
  const nachher = (await marken(s)).map(m => m.id);
  p('Die Marke AUF dem Weg ist weg', !nachher.includes('drauf'), JSON.stringify(nachher));
  p('Die zwei daneben stehen noch — sie wurden nie überquert',
    nachher.includes('daneben') && nachher.includes('daneben2'), JSON.stringify(nachher));
  p('… und das Gekritzel selbst wurde kein Strich',
    !(await marken(s)).some(m => m.art === 'stift'), JSON.stringify(nachher));
  await s.click('.blatt-werk [data-act="undo"]');
  await s.waitForTimeout(200);
  gleich('Zurück holt die überquerte Marke zurück',
    (await marken(s)).map(m => m.id).sort(), ['daneben', 'daneben2', 'drauf']);
  await s.close();
}

/* ═══ §2 Und das Gewollte geht weiter ══════════════════════════════════════ */
console.log('\n§2 Was der Zug überquert, ist weg');
{
  const gekritzel = (y0: number): number[][] => {
    const pts: number[][] = [];
    for (let z = 0; z < 6; z++) {
      const von = z % 2 ? 300 : 100, bis = z % 2 ? 100 : 300;
      for (let i = 0; i < 10; i++) pts.push([von + (bis - von) * i / 10, y0 + z * 4]);
    }
    return pts;
  };
  const s = await mitBlatt([
    { id: 'strich', art: 'line', farbe: '#111111', breite: 2.4, pts: [[110, 500], [290, 500]] },
    { id: 'kasten', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, pts: [[120, 620], [280, 680]] },
    { id: 'fest', art: 'line', farbe: '#3aa757', breite: 2.4, pts: [[110, 505], [290, 505]], gesperrt: true }
  ]);
  await s.click('.blatt-werk [data-wz="stift"]');
  await zug(s, gekritzel(490), { takt: 8 });
  const n1 = (await marken(s)).map(m => m.id);
  p('Der überkritzelte Strich ist weg', !n1.includes('strich'), JSON.stringify(n1));
  p('… der gesperrte daneben bleibt (E466)', n1.includes('fest'), JSON.stringify(n1));
  await zug(s, gekritzel(630), { takt: 8 });
  const n2 = (await marken(s)).map(m => m.id);
  p('Ein Gekritzel MITTEN durch einen Kasten nimmt ihn', !n2.includes('kasten'), JSON.stringify(n2));
  await s.close();
}

/* ═══ §3 Die Treffer der Suche ═════════════════════════════════════════════ */
console.log('\n§3 Eine nachgezogene Seite malt nur ihre eigene Trefferschicht');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Heft', icon: '📗' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    for (let i = 0; i < 10; i++)
      Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
        marken: [{ id: 'z' + i, art: 'zettel', farbe: '#ffd75e', breite: 2, pts: [[80, 120], [260, 220]], text: 'Ohmsches Gesetz' }] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-find-button')?.click());
  await s.waitForTimeout(500);
  await s.evaluate(() => {
    const f = document.querySelector<HTMLInputElement>('[data-document-find]');
    if (!f) throw new Error('kein Suchfeld');
    f.value = 'Ohm'; f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await s.waitForTimeout(1400);
  /* Ein Stück rollen, damit überhaupt mehrere Seiten gezeichnet sind —
     sonst prüft §3 an einer einzigen, und eine einzige beweist nichts. */
  await s.evaluate(() => {
    const c = document.querySelector<HTMLElement>('.document-center');
    if (c) c.scrollTop = Math.min(c.scrollHeight, c.clientHeight * 2.5);
  });
  await s.waitForTimeout(1600);
  const vorher = Number(await s.evaluate(`document.querySelectorAll('.document-trefferschicht').length`));
  p('Die Suche hat auf mehreren gezeichneten Seiten Treffer', vorher >= 2, String(vorher));
  /* Jede vorhandene Schicht bekommt eine Marke am Knoten selbst. Wird sie
     ersetzt, ist die Marke weg — das ist der ganze Prüfgedanke. */
  await s.evaluate(() => {
    document.querySelectorAll('.document-trefferschicht').forEach((e, k) => { (e as any).__alt = 'a' + k; });
  });
  /* Weit nach unten rollen: die nächsten Seiten werden nachgezogen. */
  await s.evaluate(() => {
    const c = document.querySelector<HTMLElement>('.document-center');
    if (c) c.scrollTop = c.scrollHeight;
  });
  await s.waitForTimeout(1800);
  const danach = JSON.parse(await s.evaluate(`(() => {
    const alle = [...document.querySelectorAll('.document-trefferschicht')];
    return JSON.stringify({ gesamt: alle.length, mitMarke: alle.filter(e => e.__alt).length });
  })()`) as string);
  p('Nach dem Rollen sind mehr Schichten da als vorher',
    danach.gesamt > vorher, JSON.stringify({ vorher, ...danach }));
  gleich('… und KEINE der alten wurde abgerissen und neu gebaut',
    danach.mitMarke, vorher);
  await s.close();
}

console.log('\n§4 Quellen');
p('`kritzelTrifft` misst am Weg, nicht am Kasten',
  /distanceToPolyline\(zug, q\) <= KRITZEL_NAH/.test(lies('src/bereiche/pdf/marken.ts')));
p('`trefferMalen` nimmt eine Seitenangabe, `zeichneStand` gibt sie mit',
  /const trefferMalen = \(nur\?: number\)/.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /if \(treffer\.length\) trefferMalen\(i\);/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Das erzeugte JS trägt beides',
  /KRITZEL_NAH/.test(lies('quell/bereiche/pdf/marken.js'))
  && /trefferMalen\(i\)/.test(lies('quell/bereiche/pdf/document-mode.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
