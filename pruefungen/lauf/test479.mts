/* Suite 479 — Ein verlorenes Zeigerende darf die Fläche nicht töten (E512)
 * ============================================================================
 * Redur, 8. September:
 *
 *   „Schau mal, wenn ich nach 5, 6 Minuten die Webseite nutze und der Stift
 *    funktioniert nicht mehr — auch Maus beim Zeichnen. Ich musste wieder
 *    neu laden."
 *
 * ─── DER FUND ───────────────────────────────────────────────────────────────
 * Es lag nicht an der Zeit. Gemessen wurde zuerst gegen die naheliegende
 * Vermutung: alle zehn wiederkehrenden Uhren der App (von 3 s bis 24 h)
 * einzeln ausgelöst und danach gezeichnet — jede einzelne unschuldig. Auch
 * dreissig Runden Zeichnen mit Seitenwechsel und Neuzeichnen dazwischen
 * blieben grün.
 *
 * Es liegt an EINEM verlorenen Ereignis. `aktiverZeiger` merkt sich, welcher
 * Zeiger den Zug führt (E354, damit ein zweiter Finger ihn nicht kapert).
 * Kommt für diesen Zeiger nie ein `pointerup` oder `pointercancel` an —
 * weil der Stift die Reichweite verlässt, weil der Griff verlorengeht, weil
 * das Ende auf einem anderen Element landet —, dann bleibt die Kennung für
 * IMMER stehen. Von da an wird jeder andere Zeiger abgewiesen:
 *
 *     if (aktiverZeiger !== null && aktiverZeiger !== e.pointerId) return;
 *
 * Gemessen: ein Stiftzug ohne Abheben, danach vier weitere Züge mit Maus und
 * Stift — die Zahl der Marken blieb bei 1. Die Fläche war tot, und nur das
 * Neuladen half. Genau Redurs Bild.
 *
 *   §1 EIN VERLORENES ENDE HEILT SICH. Der nächste Aufsetzer nach einer
 *      Weile übernimmt, statt abgewiesen zu werden — und die begonnene
 *      Handschrift wird ABGESCHLOSSEN, nicht weggeworfen (§51).
 *   §2 DER SCHUTZ AUS E354 BLEIBT: ein zweiter Finger MITTEN im Zug kapert
 *      ihn weiterhin nicht.
 *   §3 EIN ENDE, DAS WOANDERS LANDET, wird trotzdem gehört.
 *   §4 QUELLEN.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vor der Reparatur war §1 rot (die Marken blieben bei 1) und §3 rot.
 * §2 war vorher grün und muss es bleiben — sie hält die Richtung, in die
 * die Reparatur nicht ziehen darf.
 *
 *   node pruefungen/lauf/test479.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9599;
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
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');
const browser = await chromium.launch();
const fehler: string[] = [];

const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    Store.setMeta('zeichnen:stift', 'kugel');
    const a = Store.addPage(null, { text: 'Dauerblatt' });
    Store.addBlock(a.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(a.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.click('.blatt-werk [data-wz="stift"]');
  return s;
};

/* Die Werkstatt: Züge fahren, wahlweise ohne Abheben, und Marken zählen. */
const WERKSTATT = `
  const f = document.querySelector('.blatt-marken');
  const ctm = f.getScreenCTM();
  const px = (q) => { const pt = f.createSVGPoint(); pt.x = q[0]; pt.y = q[1];
    const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
  const ev = (typ, q, t, id, art) => { const c = px(q);
    const e = new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
      pointerId: id, pointerType: art, isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
      buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 });
    Object.defineProperty(e, 'timeStamp', { value: t });
    return e; };
  const zaehle = () => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    return ((b && b.marken) || []).length;
  };
  const zug = async (nr, id, art, mitEnde) => {
    let t = 1000 + nr * 4000; const y = 60 + nr * 26;
    f.dispatchEvent(ev('pointerdown', [80, y], t, id, art));
    for (let i = 1; i <= 8; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [80 + i * 16, y], t, id, art)); }
    if (mitEnde) f.dispatchEvent(ev('pointerup', [80 + 128, y], t + 16.7, id, art));
    await new Promise(r => setTimeout(r, 240));
    return zaehle();
  };
`;

/* ═══ §1 Ein verlorenes Ende heilt sich ════════════════════════════════════ */
console.log('\n§1 Ein verlorenes Ende heilt sich');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(async () => {
    ${WERKSTATT}
    const schritte = [];
    schritte.push(['ein gewöhnlicher Zug', await zug(1, 1, 'mouse', true)]);
    /* DAS VERLORENE ENDE: ein Stift setzt auf, fährt — und hebt nie ab. */
    schritte.push(['Stift ohne Abheben', await zug(2, 7, 'pen', false)]);
    /* Und jetzt will ein Mensch weiterzeichnen. Er hebt ab, schaut hin und
       tippt neu — das dauert. Eine halbe Sekunde ist dafür wenig, und
       genau darauf ist die Verwaist-Grenze eingestellt. (Keine schrägen
       Anführungszeichen hier: sie beenden das Textstück drumherum.) */
    await new Promise(r => setTimeout(r, 700));
    schritte.push(['danach mit der Maus', await zug(3, 1, 'mouse', true)]);
    schritte.push(['und noch einmal', await zug(4, 1, 'mouse', true)]);
    schritte.push(['und mit einem neuen Stift', await zug(5, 8, 'pen', true)]);
    return JSON.stringify(schritte);
  })()`) as string) as Array<[string, number]>;
  const zahlen = r.map(x => x[1]);
  p('Der erste Zug steht', zahlen[0] === 1, JSON.stringify(r));
  /* SOLANGE DER STIFT (aus Sicht der App) AUFLIEGT, ist sein Zug offen und
     noch nicht abgelegt — das ist richtig so und darf nicht anders sein. */
  p('Der Zug ohne Abheben ist noch offen, also noch nicht abgelegt',
    zahlen[1] === 1, JSON.stringify(r));
  /* UND ER GEHT NICHT VERLOREN. Der nächste Aufsetzer übernimmt und
     SCHLIESST ihn ab: aus einer abgelegten Marke werden drei, nicht zwei.
     Ein Verwerfen wäre eine Zeile Handschrift weniger (§51). */
  p('Der nächste Zug übernimmt — und der abgebrochene ist dabei mitgekommen',
    zahlen[2] === 3, JSON.stringify(r));
  p('… und danach geht es normal weiter', zahlen[3] === 4, JSON.stringify(r));
  p('… auch mit einem neuen Stift', zahlen[4] === 5, JSON.stringify(r));
  await s.close();
}

/* ═══ §2 Der Schutz aus E354 bleibt ════════════════════════════════════════ */
console.log('\n§2 Ein zweiter Finger kapert den Zug weiterhin nicht');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(async () => {
    ${WERKSTATT}
    /* Ein Zug läuft. MITTEN darin setzt ein zweiter Zeiger auf und fährt
       woanders hin. Er darf den Strich nicht übernehmen. */
    let t = 5000;
    f.dispatchEvent(ev('pointerdown', [80, 300], t, 1, 'mouse'));
    for (let i = 1; i <= 5; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [80 + i * 16, 300], t, 1, 'mouse')); }
    /* Der Eindringling — unmittelbar, nicht nach einer Pause. */
    f.dispatchEvent(ev('pointerdown', [400, 600], t + 8, 3, 'mouse'));
    f.dispatchEvent(ev('pointermove', [500, 600], t + 20, 3, 'mouse'));
    f.dispatchEvent(ev('pointerup', [500, 600], t + 30, 3, 'mouse'));
    /* Der echte Zug läuft weiter und hebt ab. */
    for (let i = 6; i <= 10; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [80 + i * 16, 300], t, 1, 'mouse')); }
    f.dispatchEvent(ev('pointerup', [80 + 160, 300], t + 16.7, 1, 'mouse'));
    await new Promise(r => setTimeout(r, 300));
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    const m = (b && b.marken) || [];
    return JSON.stringify({ marken: m.length, punkte: m[0] ? m[0].pts.length : 0,
      letzterX: m[0] ? m[0].pts[m[0].pts.length - 1][0] : null });
  })()`) as string);
  p('Genau EIN Strich ist entstanden, nicht zwei', r.marken === 1, JSON.stringify(r));
  p('… und er läuft bis zum Ende durch — der Eindringling hat ihn nicht abgeschnitten',
    r.letzterX !== null && r.letzterX > 200, JSON.stringify(r));
  await s.close();
}

/* ═══ §3 Ein Ende, das woanders landet ═════════════════════════════════════ */
console.log('\n§3 Ein Ende, das woanders landet, wird trotzdem gehört');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(async () => {
    ${WERKSTATT}
    let t = 9000;
    f.dispatchEvent(ev('pointerdown', [80, 200], t, 5, 'pen'));
    for (let i = 1; i <= 8; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [80 + i * 16, 200], t, 5, 'pen')); }
    /* Das Abheben landet auf dem DOKUMENT, nicht auf der Zeichenschicht —
       so, wie es passiert, wenn der Griff verlorengegangen ist. */
    const e = new PointerEvent('pointerup', { bubbles: true, cancelable: true,
      clientX: 10, clientY: 10, pointerId: 5, pointerType: 'pen', isPrimary: true,
      button: 0, buttons: 0, pressure: 0 });
    document.body.dispatchEvent(e);
    await new Promise(r => setTimeout(r, 300));
    const eins = zaehle();
    const zwei = await zug(11, 1, 'mouse', true);
    return JSON.stringify({ nachDemFremdenEnde: eins, danachGezeichnet: zwei });
  })()`) as string);
  p('Der Strich ist abgeschlossen', r.nachDemFremdenEnde === 1, JSON.stringify(r));
  p('… und die Fläche nimmt sofort den nächsten Zug an — ohne Wartezeit',
    r.danachGezeichnet === 2, JSON.stringify(r));
  await s.close();
}

/* ═══ §4 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§4 Quellen');
p('Die Zeichenschicht hört das Ende auch am Fenster',
  /addEventListener\('pointerup', beiEndeGlobal/.test(lies('src/bereiche/pdf/marken.ts')));
p('Ein verwaister Zeiger wird beim nächsten Aufsetzen übernommen',
  /VERWAIST_MS/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das erzeugte JS trägt beides',
  /beiEndeGlobal/.test(lies('quell/bereiche/pdf/marken.js'))
  && /VERWAIST_MS/.test(lies('quell/bereiche/pdf/marken.js')));
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
