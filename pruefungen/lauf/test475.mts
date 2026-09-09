/* Suite 475 — Die Neigung des Stifts (E507)
 * ============================================================================
 * Aus dem Stift-Dossier, Seite 5 und 8: Pointer Events Level 3 liefert
 * `tiltX`, `tiltY`, `twist`, `altitudeAngle` und `azimuthAngle`. Als
 * Beispiel nennt das Dossier ausdrücklich „ein Pencil-Shading-Modell
 * anhand des Tilt-Winkels" — den Bleistift, den man flach hält, um zu
 * schattieren.
 *
 * Redion las von alldem NICHTS: `tiltX`, `tiltY`, `twist`,
 * `altitudeAngle` und `azimuthAngle` kamen im ganzen `src/` kein einziges
 * Mal vor. Wer den Apple Pencil flach hielt, bekam denselben schmalen
 * Strich wie bei senkrechtem Stift.
 *
 *   §1 DIE NEIGUNG WIRD GELESEN UND GEMERKT — je Punkt eine Zahl von 0
 *      (senkrecht) bis 1 (flach), im Feld `neigung`.
 *   §2 NUR VOM ECHTEN STIFT. Maus und Finger melden keine Neigung, und
 *      dann steht auch keine im Papier: kein Feld, keine Migration, kein
 *      erfundener Wert (§9).
 *   §3 DER BLEISTIFT SCHATTIERT: flach gehalten wird der Strich BREITER
 *      und weicher — gemessen an der Fläche, nicht behauptet.
 *   §4 ALTER BESTAND BLEIBT, WIE ER WAR. Eine Marke ohne `neigung` sieht
 *      aus wie vorher, Punkt für Punkt.
 *   §5 DER DRUCK SAGT, WOHER ER KOMMT. `druckArt` unterscheidet den
 *      gemessenen Sensordruck vom Tempo-Ersatz für Maus und Finger — das
 *      Dossier (S.5, S.17) verlangt, beides nicht zu vermischen.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vor dem Bauen war sie es in §1, §3 und §5. Die Gegenproben danach stehen
 * in ENTSCHEIDUNGEN.md unter E507.
 *
 *   node pruefungen/lauf/test475.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9595;
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

const mitBlatt = async (stil = 'bleistift'): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    Store.setMeta('zeichnen:stift', '${stil}');
    const seite = Store.addPage(null, { text: 'Neigung' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  })()`);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(500);
  await s.click('.blatt-werk [data-wz="stift"]');
  return s;
};

/**
 * Einen Strich ziehen. `neig` ist der Neigungswinkel in Grad, den der Stift
 * meldet (0 = senkrecht); `art` die Zeigerart.
 */
const zug = async (s: Page, neig: number, art = 'pen', y0 = 120): Promise<any> =>
  JSON.parse(await s.evaluate(`(() => {
    const flaeche = document.querySelector('.blatt-marken');
    const k = flaeche.getBoundingClientRect();
    const ev = (typ, dx, buttons) => flaeche.dispatchEvent(new PointerEvent(typ,
      { bubbles: true, cancelable: true,
        clientX: k.left + 60 + dx, clientY: k.top + ${y0},
        pointerId: 41, pointerType: '${art}', isPrimary: true, button: 0, buttons,
        pressure: 0.6, tiltX: ${neig}, tiltY: 0 }));
    ev('pointerdown', 0, 1);
    for (let i = 1; i <= 14; i++) ev('pointermove', i * 12, 1);
    ev('pointerup', 168, 0);
    const seite = Store.getBlock(App.aktuelleSeite());
    const blatt = Store.getBlock(seite.content[0]);
    const m = (blatt.marken || [])[blatt.marken.length - 1];
    if (!m) return JSON.stringify({ da: false });
    const node = document.querySelector('[data-sid="' + m.id + '"]');
    /* Die wirkliche Höhe der Fläche in der Mitte des Strichs — dieselbe
       Messung wie in test343: nach oben und unten laufen, bis nichts mehr
       drin ist. */
    const svg = document.querySelector('.blatt-marken');
    let hoehe = 0;
    if (node && node.isPointInFill) {
      const mitte = m.pts[Math.floor(m.pts.length / 2)];
      const pt = svg.createSVGPoint();
      const drin = (x, y) => { pt.x = x; pt.y = y; return node.isPointInFill(pt); };
      let oben = 0, unten = 0;
      for (let d = 0.05; d <= 12; d += 0.05) { if (drin(mitte[0], mitte[1] - d)) oben = d; }
      for (let d = 0.05; d <= 12; d += 0.05) { if (drin(mitte[0], mitte[1] + d)) unten = d; }
      hoehe = Math.round((oben + unten) * 100) / 100;
    }
    return JSON.stringify({ da: true, id: m.id, art: m.art, stil: m.stil || '',
      punkte: m.pts.length, neigung: m.neigung || null, druckArt: m.druckArt || null,
      hoehe, deckkraft: node ? node.getAttribute('opacity') : null });
  })()`) as string);

/* ═══ §1/§2 Die Neigung wird gelesen ═══════════════════════════════════════ */
console.log('\n§1 Die Neigung wird gelesen und gemerkt');
{
  const s = await mitBlatt();
  const flach = await zug(s, 60);
  p('Es ist ein Strich entstanden', flach.da && flach.art === 'stift', JSON.stringify(flach));
  p('Er trägt ein Neigungsfeld', Array.isArray(flach.neigung), JSON.stringify(flach.neigung));
  p('… mit einer Zahl je Punkt', Array.isArray(flach.neigung)
    && flach.neigung.length === flach.punkte,
    `${flach.neigung ? flach.neigung.length : 0} zu ${flach.punkte}`);
  p('… und die Zahlen liegen zwischen 0 und 1',
    Array.isArray(flach.neigung) && flach.neigung.every((v: number) => v >= 0 && v <= 1),
    JSON.stringify(flach.neigung));
  p('Bei 60° gemeldeter Neigung steht dort etwa zwei Drittel',
    Array.isArray(flach.neigung) && flach.neigung[0]! > 0.55 && flach.neigung[0]! < 0.8,
    String(flach.neigung && flach.neigung[0]));
  await s.close();
}

console.log('\n§2 Nur vom echten Stift');
{
  const s = await mitBlatt();
  const maus = await zug(s, 0, 'mouse');
  p('Mit der Maus entsteht ein Strich', maus.da);
  gleich('… aber ohne Neigungsfeld — kein erfundener Wert', maus.neigung, null);
  const senkrecht = await zug(s, 0, 'pen', 300);
  gleich('Ein senkrecht gehaltener Stift meldet auch keine Neigung', senkrecht.neigung, null);
  await s.close();
}

/* ═══ §3 Der Bleistift schattiert ══════════════════════════════════════════ */
console.log('\n§3 Flach gehalten schattiert der Bleistift');
{
  const s = await mitBlatt('bleistift');
  const steil = await zug(s, 5, 'pen', 150);
  const flach = await zug(s, 65, 'pen', 400);
  console.log(`     Fläche: steil ${steil.hoehe} pt · flach ${flach.hoehe} pt`);
  p('Beide Striche sind Flächen', steil.hoehe > 0 && flach.hoehe > 0,
    JSON.stringify({ steil: steil.hoehe, flach: flach.hoehe }));
  p('Flach gehalten ist der Strich deutlich breiter',
    flach.hoehe > steil.hoehe * 1.4, `${steil.hoehe} → ${flach.hoehe}`);
  p('… und weicher: die Deckkraft sinkt',
    Number(flach.deckkraft) < Number(steil.deckkraft),
    `${steil.deckkraft} → ${flach.deckkraft}`);
  await s.close();
}

/* ═══ §4 Alter Bestand ═════════════════════════════════════════════════════ */
console.log('\n§4 Eine Marke ohne Neigung sieht aus wie immer');
{
  const s = await mitBlatt('bleistift');
  const r = JSON.parse(await s.evaluate(`(() => {
    const seite = Store.getBlock(App.aktuelleSeite());
    const blatt = Store.getBlock(seite.content[0]);
    const alt = { id: 'alt', art: 'stift', stil: 'bleistift', farbe: '#333333', breite: 3,
      pts: [[60, 500], [120, 510], [180, 505], [240, 520]],
      pressure: [0.5, 0.5, 0.5, 0.5] };
    Store.updateBlock(blatt.id, { marken: [alt] });
    App.zeichneSeite();
    return JSON.stringify({ gemalt: true });
  })()`) as string);
  p('Die alte Marke lässt sich setzen', r.gemalt);
  await s.waitForTimeout(600);
  const alt = JSON.parse(await s.evaluate(`(() => {
    const node = document.querySelector('[data-sid="alt"]');
    const seite = Store.getBlock(App.aktuelleSeite());
    const blatt = Store.getBlock(seite.content[0]);
    const m = blatt.marken[0];
    return JSON.stringify({ da: !!node, d: node ? node.getAttribute('d') : '',
      deck: node ? node.getAttribute('opacity') : null,
      feld: m.neigung === undefined ? 'fehlt' : 'da' });
  })()`) as string);
  p('Sie wird gezeichnet', alt.da && alt.d.length > 20);
  gleich('… und bekommt kein Neigungsfeld nachgeschoben', alt.feld, 'fehlt');
  gleich('… und behält die Bleistift-Deckkraft von 0,72', alt.deck, '0.72');
  await s.close();
}

/* ═══ §5 Woher der Druck kommt ═════════════════════════════════════════════ */
console.log('\n§5 Der Druck sagt, woher er kommt');
{
  const s = await mitBlatt('fueller');
  const stift = await zug(s, 20, 'pen', 150);
  const maus = await zug(s, 0, 'mouse', 400);
  gleich('Ein Stiftstrich sagt: gemessen', stift.druckArt, 'stift');
  gleich('Ein Mausstrich sagt: aus dem Tempo gerechnet', maus.druckArt, 'tempo');
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const m = lies('src/bereiche/pdf/marken.ts');
  p('Die Neigung wird aus tiltX/tiltY gelesen', /tiltX/.test(m) && /tiltY/.test(m));
  p('… und nur beim Stift — alles andere kehrt vorher um',
    /neigungAus[\s\S]{0,300}pointerType !== 'pen'\) return -1;/.test(m));
  p('Der Bleistift benutzt sie', /druckFaktor\(String\(mark\.stil\), [^)]*, *neig|neigung/.test(m));
  p('Das erzeugte JS trägt es', /tiltX/.test(lies('quell/bereiche/pdf/marken.js')));
  p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
