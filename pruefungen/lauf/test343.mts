/* Suite 343 — Die Schrift: Füller, Kugelschreiber, Pinsel (E351)
 * ============================================================================
 * Redur: „dass du die Schrift, Linie und so alles fertig machst — es sollte
 * wie GoodNotes sein."
 *
 * Bis E351 gab es EINEN Stift mit EINER Breite je Strich: der Druck aller
 * Punkte wurde gemittelt, und nach dem Vereinfachen wurde ohnehin jeder
 * Druckwert zum Durchschnitt. Ein Füller konnte nie anschwellen. Jetzt:
 *
 *   1 · DER FÜLLER FOLGT DEM DRUCK — je Punkt eine Breite, gezeichnet als
 *       Fläche; der Druck überlebt das Vereinfachen.
 *   2 · OHNE DRUCKSENSOR ZÄHLT DAS TEMPO — langsam ist dick, schnell dünn.
 *   3 · ALTE MARKEN SEHEN AUS WIE IMMER (§53.3, E125).
 *   4 · DREI STIFTE — der Knopf wechselt, der Kugelschreiber bleibt der alte
 *       Strich, der Pinsel schwillt stärker, die Wahl überlebt das Neuladen.
 *   5 · DER MARKER AM LINEAL ZIEHT GERADE.
 *   6 · EIGENE FARBEN — der Farbwähler des Browsers hinter der Farbwahl
 *       (E486), gemerkt als Tupfer; auf und zu ohne neue Farbe übernimmt
 *       er nichts (E708).
 *   7 · DER DRUCKWEG zeichnet den Füller genauso.
 *   8 · AM TELEFON sind die neuen Knöpfe Fingerknöpfe.
 *
 *   node pruefungen/lauf/test343.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Marken: any;
declare const Werkzeuge: any; declare const InkGeometry: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9347;

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
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
type Seite = import('playwright').Page;

const kontext = async (handy = false) => {
  const ktx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForTimeout(2800);
  /* Ein A4-Blatt auf einer Seite — die Zeichenschicht mit Leiste. */
  const blattId = await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Schriftprobe', icon: '✍' });
    const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'liniert' });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    return b.id as string;
  });
  return { ktx, pg, blattId };
};

/** Einen Strich mit synthetischen Zeigerereignissen ziehen — Punkte im
    BLATTRAUM, Druck je Punkt, wahlweise als Stift oder Maus. Zwischen den
    Punkten kann gewartet werden (Tempo). */
const strich = (pg: Seite, punkte: Array<[number, number, number]>, art: 'pen' | 'mouse',
                pause = 0) =>
  pg.evaluate(async ([punkte, art, pause]: [Array<[number, number, number]>, string, number]) => {
    const svg = document.querySelector<SVGSVGElement>('.blatt-marken');
    if (!svg) throw new Error('keine Zeichenschicht');
    const ctm = svg.getScreenCTM();
    if (!ctm) throw new Error('kein CTM');
    const zu = (x: number, y: number) => {
      const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
      const c = pt.matrixTransform(ctm);
      return { clientX: c.x, clientY: c.y };
    };
    const ev = (typ: string, x: number, y: number, druck: number) =>
      new PointerEvent(typ, { ...zu(x, y), pointerType: art, pressure: druck, isPrimary: true,
        button: typ === 'pointerup' ? 0 : 0, buttons: typ === 'pointerup' ? 0 : 1,
        pointerId: 7, bubbles: true, cancelable: true });
    const [x0, y0, d0] = punkte[0]!;
    svg.dispatchEvent(ev('pointerdown', x0, y0, d0));
    for (let i = 1; i < punkte.length; i++) {
      const [x, y, d] = punkte[i]!;
      if (pause > 0) await new Promise(f => setTimeout(f, pause));
      svg.dispatchEvent(ev('pointermove', x, y, d));
    }
    const [xe, ye, de] = punkte[punkte.length - 1]!;
    svg.dispatchEvent(ev('pointerup', xe, ye, de));
    await new Promise(f => setTimeout(f, 150));
  }, [punkte, art, pause] as [Array<[number, number, number]>, string, number]);

const letzteMarke = (pg: Seite, blattId: string) => pg.evaluate((id: string) => {
  const b = Store.getBlock(id);
  const m = (b.marken || [])[b.marken.length - 1] || null;
  if (!m) return null;
  const node = document.querySelector<SVGElement>(`.blatt-marken [data-sid="${m.id}"]`);
  return {
    art: m.art, stil: m.stil ?? null, farbe: m.farbe, n: m.pts.length,
    druck: (m.pressure || []).map(Number),
    tag: node?.tagName, fill: node?.getAttribute('fill'), stroke: node?.getAttribute('stroke'),
    sw: node?.getAttribute('stroke-width'), inkStil: node?.getAttribute('data-ink-stil'),
    opacity: node?.getAttribute('opacity')
  };
}, blattId);

const werkzeug = (pg: Seite, wz: string) => pg.click(`.blatt-werk [data-wz="${wz}"]`);

/* ======================================================================== */
console.log('\n1 · Der Füller folgt dem Druck — je Punkt eine Breite, als Fläche');
const { ktx, pg, blattId } = await kontext();
await pg.evaluate(() => { Store.setMeta('zeichnen:stift', 'fueller'); App.zeichneSeite(); });
await pg.waitForTimeout(500);
await werkzeug(pg, 'stift');
/* Ein Bogen: leicht → fest → leicht, 13 Punkte mit Stiftdruck.
   IN SCHREIBTEMPO (E704): 150 ms je Schritt von rund 25 pt, unter
   0,25 pt/ms. Vorher kamen alle 13 Meldungen in derselben Millisekunde —
   300 pt in 12 ms, rund 8 m/s. Seit E704 macht das Tempo einen Füller mit
   Sensor bis 35 % dünner (Redur: „schnelle Striche bis ~35 % dünner"), und
   diese Hand wäre der schnellste Strich überhaupt: der Gipfel läge dann
   unter der Grundbreite. Die Zusage hier gilt dem DRUCK; das Tempo hält
   `test583` §5/§6 und `test561` §6. */
const bogen: Array<[number, number, number]> = Array.from({ length: 13 }, (_v, i) => {
  const t = i / 12;
  return [120 + t * 300, 200 + Math.sin(t * Math.PI) * 60, 0.15 + Math.sin(t * Math.PI) * 0.8];
});
await strich(pg, bogen, 'pen', 150);
let m = await letzteMarke(pg, blattId);
p('Ein Strich ist da', !!m && m.art === 'stift', JSON.stringify(m));
gleich('… mit dem Stil „fueller"', m?.stil, 'fueller');
p('Der Druck ist je Punkt erhalten: leicht am Anfang, fest in der Mitte', !!m && m.druck.length === m.n && Math.min(...m.druck) < 0.35 && Math.max(...m.druck) > 0.8, JSON.stringify(m?.druck));
p('Gezeichnet als Fläche (fill), nicht als Strich', !!m && m.tag === 'path' && m.fill !== 'none' && m.fill === m.farbe, JSON.stringify({ fill: m?.fill, farbe: m?.farbe, stil: m?.inkStil }));
gleich('… mit der Stilmarke am Knoten', m?.inkStil, 'fueller');
/* Und die Fläche ist in der Mitte wirklich breiter als am Anfang: ein
   Punkt neben der Mittellinie liegt in der Mitte IN der Fläche, am dünnen
   Anfang daneben. */
const breite = await pg.evaluate((id: string) => {
  const b = Store.getBlock(id); const m = b.marken[b.marken.length - 1];
  const node = document.querySelector<SVGGeometryElement>(`.blatt-marken [data-sid="${m.id}"]`);
  const svg = document.querySelector<SVGSVGElement>('.blatt-marken');
  if (!node || !svg) return null;
  const drin = (x: number, y: number) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return node.isPointInFill(pt); };
  /* WIE HOCH IST DIE FLÄCHE WIRKLICH (E504)? Hier stand ein einziger
     Punkt in festem Abstand („liegt 0,9·Breite über der Mittellinie noch
     drin?"). Das misst nicht die Breite, sondern ob die Kontur an genau
     diesem Eckpunkt gerade nach oben ausbeult — ein Gehrungsartefakt, das
     mit jedem geänderten Punktabstand kippt. Genau das ist bei E504
     passiert: die Fläche wurde am Druckgipfel MESSBAR DICKER (3,35 statt
     3,30 pt), und die alte Zusage wurde trotzdem rot.

     Jetzt wird die Höhe abgetastet: von der Mittellinie nach oben und
     unten, bis nichts mehr drin ist. Das ist die Zahl, die der Satz
     behauptet, und sie ist gegen den Punktabstand unempfindlich. */
  const hoehe = (q: number[]) => {
    let oben = 0, unten = 0;
    for (let d = 0.05; d <= 6; d += 0.05) { if (drin(q[0]!, q[1]! - d)) oben = d; }
    for (let d = 0.05; d <= 6; d += 0.05) { if (drin(q[0]!, q[1]! + d)) unten = d; }
    return Math.round((oben + unten) * 100) / 100;
  };
  /* VERGLICHEN WIRD MIT EINEM INNEREN PUNKT, nie mit dem ersten.
     Der erste Punkt ist die SPITZE der Kontur — dort läuft sie aus, egal
     welcher Druck dort steht. Gegen ihn gemessen bliebe die Zusage auch
     dann grün, wenn der Druck gar nicht mehr wirkte: die Gegenprobe mit
     festem Druck (0,5 an jeder Stelle) lief genau so durch. Jetzt steht
     der Druckgipfel gegen die leichteste Stelle DAZWISCHEN, und dort
     entscheidet wirklich der Druck. */
  const innen = m.pressure.slice(1, -1);
  const leichtI = 1 + innen.indexOf(Math.min(...innen));
  const gipfel = m.pts[m.pressure.indexOf(Math.max(...m.pressure))];
  return { amGipfel: hoehe(gipfel), amLeichten: hoehe(m.pts[leichtI]),
           amAnfang: hoehe(m.pts[0]), grund: Number(m.breite),
           mitteMitte: drin(gipfel[0], gipfel[1]) };
}, blattId);
p('In der Mitte ist die Fläche breit, an der leichten Stelle schmal',
  !!breite && breite.mitteMitte && breite.amGipfel > breite.grund
    /* 1,3 ist gemessen und nicht gegriffen: der Fueller schwillt bei
       Druck 0,92 gegen 0,36 um den Faktor (0,5+0,92)/(0,5+0,36) = 1,65,
       und die Kappen runden das auf 1,48 ab. Die Gegenprobe — Druck
       ueberall 0,5 — kommt auf 0,9. Die Schwelle liegt dazwischen, mit
       Luft nach beiden Seiten. */
    && breite.amGipfel > breite.amLeichten * 1.3,
  JSON.stringify(breite));

/* ======================================================================== */
console.log('\n2 · Ohne Drucksensor zählt das Tempo — langsam dick, schnell dünn');
/* Erste Hälfte: kleine Schritte mit Pause (langsam). Zweite Hälfte: grosse
   Schritte ohne Pause (schnell). Die Maus meldet immer 0,5. */
const langsam: Array<[number, number, number]> = Array.from({ length: 10 }, (_v, i) => [100 + i * 4, 400, 0.5]);
await pg.evaluate(async ([punkte]: [Array<[number, number, number]>]) => {
  const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
  const ctm = svg.getScreenCTM()!;
  const zu = (x: number, y: number) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
  const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'mouse', pressure: 0.5, isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 9, bubbles: true, cancelable: true });
  svg.dispatchEvent(ev('pointerdown', punkte[0]![0], punkte[0]![1]));
  for (let i = 1; i < punkte.length; i++) { await new Promise(f => setTimeout(f, 16)); svg.dispatchEvent(ev('pointermove', punkte[i]![0], punkte[i]![1])); }
  /* schnell: 10 Schritte à 30 Punkte, ohne Pause */
  let x = punkte[punkte.length - 1]![0];
  for (let i = 0; i < 10; i++) { x += 30; svg.dispatchEvent(ev('pointermove', x, 400)); }
  svg.dispatchEvent(ev('pointerup', x, 400));
  await new Promise(f => setTimeout(f, 150));
}, [langsam] as [Array<[number, number, number]>]);
m = await letzteMarke(pg, blattId);
const halb = Math.floor((m?.druck.length ?? 0) / 2);
const vorn = (m?.druck ?? []).slice(0, halb), hinten = (m?.druck ?? []).slice(halb);
const mittel = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
p('Der langsame Anfang ist dicker als das schnelle Ende', vorn.length > 1 && hinten.length > 1 && mittel(vorn) > mittel(hinten) + 0.15, `vorn ${mittel(vorn).toFixed(2)}, hinten ${mittel(hinten).toFixed(2)} · ${JSON.stringify(m?.druck)}`);
p('… und keiner der Werte ist die tote 0,5 der Maus', !!m && m.druck.every((v: number) => Math.abs(v - 0.5) > 0.01), JSON.stringify(m?.druck));

/* ======================================================================== */
console.log('\n3 · Alte Marken sehen aus wie immer');
const alt = await pg.evaluate((id: string) => {
  const b = Store.getBlock(id);
  const marke = { id: 'alt-e125', art: 'stift', farbe: '#2f7ed8', breite: 2.4,
    pts: [[100, 600], [140, 610], [180, 590], [220, 620], [260, 600]], pressure: [0.2, 0.9, 0.2, 0.9, 0.2] };
  Store.updateBlock(id, { marken: [...(b.marken || []), marke] });
  App.zeichneSeite();
  return new Promise(f => setTimeout(() => {
    const node = document.querySelector<SVGElement>('.blatt-marken [data-sid="alt-e125"]');
    f({ tag: node?.tagName, fill: node?.getAttribute('fill'), sw: node?.getAttribute('stroke-width'), stil: node?.getAttribute('data-ink-stil') });
  }, 500));
}, blattId);
/* Erwartet: derselbe Strich wie seit E125 — Durchschnittsdruck 0,48 →
   Faktor 0,65 + 0,48·0,7 = 0,986 → 2,4 · 0,986 = 2,366. */
p('Ein Strich ohne Stil bleibt ein Strich: fill none, eine Breite', (alt as any).tag === 'path' && (alt as any).fill === 'none' && Math.abs(Number((alt as any).sw) - 2.366) < 0.01 && !(alt as any).stil, JSON.stringify(alt));

/* ======================================================================== */
console.log('\n4 · Sechs Stifte — die Reihe zeigt sie, die Wahl bleibt');
/* Seit E359 zeigt auch der Rechner nur das Zubehoer des Werkzeugs: der
   Stil-Knopf steht erst, wenn der Stift gewaehlt ist — wie am Telefon (§8). */
await werkzeug(pg, 'stift');
/* SEIT E512 IST ES EINE REIHE, KEIN WECHSELKNOPF. Redur wollte sehen,
   welche Stifte es gibt, statt sie zu erraten — also steht jeder als
   eigener Knopf da, und der geführte trägt `on`. */
const knopf = await pg.evaluate(() => {
  const alle = [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-act="stilwahl"]')];
  const k = document.querySelector<HTMLElement>('.blatt-werk [data-act="stilwahl"].on');
  return { da: alle.length > 0, zahl: alle.length, stil: k?.dataset.stil, wort: k?.textContent?.trim() };
});
p('Die Stiftreihe steht in der Leiste, und der Füller ist geführt',
  knopf.da && knopf.stil === 'fueller' && /Füller/.test(String(knopf.wort)), JSON.stringify(knopf));
p('… mit einem Knopf je Stift', knopf.zahl === 6, JSON.stringify(knopf));
await pg.click('.blatt-werk [data-act="stilwahl"][data-stil="kugel"]');
await pg.waitForTimeout(150);
const nachKlick = await pg.evaluate(() => ({
  stil: document.querySelector<HTMLElement>('.blatt-werk [data-act="stilwahl"].on')?.dataset.stil,
  meta: Store.getMeta('zeichnen:stift'),
  werkzeug: document.querySelector('.blatt-marken')?.getAttribute('data-tool')
}));
gleich('Ein Tipp auf den Kugelschreiber: er führt', nachKlick.stil, 'kugel');
gleich('… gemerkt', nachKlick.meta, 'kugel');
gleich('… und der Stift ist das Werkzeug', nachKlick.werkzeug, 'stift');
await strich(pg, bogen.map(([x, y, d]) => [x, y + 250, d] as [number, number, number]), 'pen');
m = await letzteMarke(pg, blattId);
p('Der Kugelschreiber schreibt den alten Strich: kein Stil, fill none', !!m && m.stil === null && m.fill === 'none', JSON.stringify(m));
await pg.click('.blatt-werk [data-act="stilwahl"][data-stil="pinsel"]');
await pg.waitForTimeout(150);
await strich(pg, bogen.map(([x, y, d]) => [x, y + 400, d] as [number, number, number]), 'pen');
m = await letzteMarke(pg, blattId);
gleich('Ein Tipp auf den Pinsel: er zeichnet', m?.stil, 'pinsel');
p('… als Fläche mit leichter Transparenz', !!m && m.fill !== 'none' && Number(m.opacity) > 0.8 && Number(m.opacity) < 1, JSON.stringify(m));
p('Der Pinsel schwillt stärker als der Füller', await pg.evaluate(() => Marken.druckFaktor('pinsel', 0.9) > Marken.druckFaktor('fueller', 0.9) && Marken.druckFaktor('pinsel', 0.1) < Marken.druckFaktor('fueller', 0.1)));
await pg.evaluate(() => App.zeichneSeite());
await pg.waitForTimeout(400);
const nachNeu = await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-act="stilwahl"].on')?.dataset.stil);
gleich('Nach dem Neuzeichnen steht der Pinsel noch', nachNeu, 'pinsel');

/* ======================================================================== */
console.log('\n5 · Der Marker am Lineal zieht gerade');
await werkzeug(pg, 'marker');
await pg.click('.blatt-werk [data-act="lineal"]');
const wackel: Array<[number, number, number]> = Array.from({ length: 12 }, (_v, i) => [100 + i * 25, 700 + (i % 2 ? 9 : -9), 0.5]);
await strich(pg, wackel, 'pen');
m = await letzteMarke(pg, blattId);
p('Ein wackliger Marker mit Lineal hat genau zwei Punkte', !!m && m.art === 'marker' && m.n === 2, JSON.stringify({ art: m?.art, n: m?.n }));
await pg.click('.blatt-werk [data-act="lineal"]');
await strich(pg, wackel.map(([x, y, d]) => [x, y + 40, d] as [number, number, number]), 'pen');
m = await letzteMarke(pg, blattId);
p('Ohne Lineal bleibt der Marker Freihand', !!m && m.art === 'marker' && m.n > 2, JSON.stringify({ n: m?.n }));

/* ======================================================================== */
console.log('\n6 · Eigene Farben — der Farbwähler des Browsers, gemerkt als Tupfer');
/* DER WEG GEHT SEIT E486 ÜBER EINE WAHL. Das „+" öffnet nicht mehr direkt
   den Farbwähler des Systems, sondern ein Feld mit allem, was Farbe ist —
   Farbwähler zuoberst, darunter die Farbsätze. Der Grund steht in E486:
   die Zubehörzeile der Leiste fasst keinen fünfzehnten Knopf, und GoodNotes
   geht denselben Weg. Diese Zusage prüft weiter dasselbe, nur einen Tipp
   später. */
const farbe = await pg.evaluate(async () => {
  document.querySelector<HTMLElement>('.blatt-werk [data-act="farbe"]')?.click();
  await new Promise(f => setTimeout(f, 250));
  document.querySelector<HTMLElement>('.overlay [data-w="waehlen"]')?.click();
  await new Promise(f => setTimeout(f, 150));
  const feld = document.querySelector<HTMLInputElement>('input[type="color"]');
  if (!feld) return { feld: false };
  /* AUF UND ZU OHNE NEUE FARBE ÜBERNIMMT NICHTS (E708). Seit E708 übernimmt
     der Wähler beim Schliessen (`change`). Ein `change` mit dem Wert, mit
     dem er aufging, ist keine Wahl: kein Tupfer, nichts gemerkt, die
     Palette bleibt offen — gleich, ob ein Browser es beim blossen Auf- und
     Zumachen meldet. */
  const eigene = (): string => JSON.stringify([...document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe-eigen')].map(t => t.dataset.c));
  const merk = (): string => JSON.stringify(Store.getMeta('zeichnen:farben') ?? null);
  const vorLeer = { eigen: eigene(), meta: merk(), wert: feld.value };
  feld.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(f => setTimeout(f, 150));
  const leer = { offen: feld.isConnected, eigen: eigene() === vorLeer.eigen, meta: merk() === vorLeer.meta,
    wert: vorLeer.wert, eigenNach: eigene(), metaNach: merk() };
  feld.value = '#8e44ad';
  feld.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(f => setTimeout(f, 150));
  const tupfer = document.querySelector<HTMLElement>('.blatt-werk .blatt-farbe-eigen');
  return { feld: true, leer, tupfer: tupfer?.dataset.c, an: tupfer?.classList.contains('on'), meta: Store.getMeta('zeichnen:farben') };
});
p('Der Knopf öffnet einen Farbwähler', (farbe as any).feld, JSON.stringify(farbe));
{
  const leer = (farbe as any).leer;
  p('… und ohne neue Farbe auf und zu übernimmt er nichts (kein Tupfer, nichts gemerkt, die Palette bleibt offen)',
    !!leer && leer.offen === true && leer.eigen === true && leer.meta === true, JSON.stringify(leer));
}
gleich('Die gewählte Farbe steht als Tupfer', (farbe as any).tupfer, '#8e44ad');
p('… ist markiert und gemerkt', (farbe as any).an === true && Array.isArray((farbe as any).meta) && (farbe as any).meta.includes('#8e44ad'), JSON.stringify(farbe));
await werkzeug(pg, 'stift');
await strich(pg, [[100, 780, 0.5], [130, 790, 0.6], [160, 780, 0.5], [190, 790, 0.4]], 'pen');
m = await letzteMarke(pg, blattId);
gleich('Der nächste Strich trägt die eigene Farbe', m?.farbe, '#8e44ad');
await pg.evaluate(() => App.zeichneSeite());
await pg.waitForTimeout(400);
const tupferNachNeu = await pg.evaluate(() => [...document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe-eigen')].map(t => t.dataset.c));
gleich('Der Tupfer überlebt das Neuzeichnen', tupferNachNeu, ['#8e44ad']);

/* ======================================================================== */
console.log('\n7 · Der Druckweg zeichnet den Füller genauso');
/* Der Ausdruck (werkzeuge.ts, `markenAlsSvg`) ruft denselben Zeichner
   `Marken.zeichneMarke` wie der Bildschirm — hier wird der Zeichner mit
   einer Füller-Marke gerufen, und der Quelltext des Druckwegs muss ihn
   weiterhin benutzen. */
const druck = await pg.evaluate(() => {
  const node = Marken.zeichneMarke({ id: 'd1', art: 'stift', stil: 'fueller', farbe: '#2f7ed8', breite: 2.4,
    pts: [[10, 10], [40, 20], [70, 10], [100, 25]], pressure: [0.2, 0.8, 0.9, 0.3] });
  return { tag: node?.tagName, fill: node?.getAttribute('fill'), stil: node?.getAttribute('data-ink-stil'),
           d: String(node?.getAttribute('d') || '').slice(0, 20) };
});
p('Der gemeinsame Zeichner liefert für den Füller eine gefüllte Fläche', druck.tag === 'path' && druck.fill === '#2f7ed8' && druck.stil === 'fueller' && /^M/.test(druck.d), JSON.stringify(druck));
const druckQuelle = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf8');
p('Der Druckweg ruft weiterhin Marken.zeichneMarke', /markenAlsSvg[\s\S]{0,600}Marken\.zeichneMarke/.test(druckQuelle));
await ktx.close();

/* ======================================================================== */
console.log('\n8 · Am Telefon sind die neuen Knöpfe Fingerknöpfe');
{
  const { ktx: k2, pg: p2 } = await kontext(true);
  /* Seit E356 stehen Stift-Stil und Farben am Telefon nur beim Stift. */
  await werkzeug(p2, 'stift');
  const masse = await p2.evaluate(() => {
    const r = (sel: string) => { const e = document.querySelector<HTMLElement>(sel); const b = e?.getBoundingClientRect(); return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null; };
    return { stil: r('.blatt-werk [data-act="stilwahl"]'), farbe: r('.blatt-werk [data-act="farbe"]') };
  });
  p('Der Stift-Knopf ist mindestens 44 px hoch', !!masse.stil && masse.stil.h >= 44, JSON.stringify(masse));
  p('Der Farb-Knopf ist mindestens 30 px gross', !!masse.farbe && masse.farbe.w >= 30 && masse.farbe.h >= 30, JSON.stringify(masse));
  await k2.close();
}

console.log('');
p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
