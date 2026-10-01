/* Suite 585 — Das Material des Touch Kits überall, wo man wählt (E706)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat am 27. September um ca. 21:47 die
 * Vorschau der Tab-Leiste aus seinem Touch Kit geschickt und geschrieben:
 *
 *     „ich will das du auch das ¨berla nutze will wo es nötig ich also beim
 *      stift übergangen usw"
 *
 * Gemeint ist das „Material": EINE Fläche hinter der Wahl, von einer Feder
 * oder vom Finger verschoben, unterwegs ein wenig gedehnt, gehalten
 * angehoben, mit einer Druckfeder auf den Zeichen. Dazu um ca. 21:45 seine
 * Wahl „Untere Leiste besser lesbar" — die Linse über dem aktiven Reiter
 * in Ruhe fast klar.
 *
 * DIESER LAUF PRÜFT DIE ZUSAGEN ALS ZAHLEN, NICHT ALS „SIEHT GUT AUS":
 *
 *   §1 DIE FEDERN DES KITS. `SelectionFlow` führt die Federn `knapp` (Kit
 *      „snappy", 0,36 s, Schwung 0,14) und `druck` (Kit „press", 0,32 s,
 *      0,3) unter diesen Namen; die Pille der unteren Leiste schwingt
 *      höchstens 1 % über und kommt genau an.
 *   §2 IN RUHE LESBAR. Der Name des aktiven Reiters hebt sich unter der
 *      Linse mit mindestens 4,5 : 1 ab — an den Bildpunkten gemessen, hell
 *      und dunkel.
 *   §3 DIE PILLE LÄSST SICH ZIEHEN. Gehalten hebt sie sich, folgt dem
 *      Finger, der Reiter darunter leuchtet vor; losgelassen wählt sie den
 *      Reiter darunter — mit GENAU EINEM Klick, und `aria-selected` stimmt.
 *      Ein Tipp bleibt ein Tipp. Escape bricht das Ziehen ab. Über das Ende
 *      hinaus gibt sie nach wie ein Gummiband.
 *   §4 DIE ZEICHEN SINKEN EIN UND FEDERN ZURÜCK (auf der Druckfeder, mit
 *      Nachschwingen).
 *   §5 DIE UMSCHALTER: Seite/Fläche/Redion, die Wege im Regal, die Reiter
 *      von „Aussehen", die Reiter von „Heute", die Liste der Einstellungen
 *      — die Wahl fliegt vom alten zum neuen Knopf, statt zu springen, und
 *      landet genau dort. Der Zustand steht SOFORT am Knopf, das Ziel ist
 *      unterwegs nie leer.
 *   §6 DIE STIFTLEISTE: Farben, Breiten und Stifte fliegen je in ihrer
 *      Gruppe; der Werkzeugflug fährt auf der Feder des Kits (er schwingt
 *      über und dehnt sich zwischen Nachbarn).
 *   §7 OHNE BEWEGUNG: bei `prefers-reduced-motion` UND bei „Ruhige
 *      Darstellung" fliegt nichts, die Pille springt, nichts dehnt oder
 *      hebt sich — und die Auswahl stimmt trotzdem.
 *   §8 TASTATUR UND VORLESER MERKEN NICHTS: Rollen, `aria-*` und die
 *      Pfeiltasten des Umschalters bleiben, wie sie waren.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja — gegen den Grundstand 515451f9 (vor E706) fällt er in §1 bis §7.
 * Die Zahlen stehen im Commit „test585 (rot)".
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser. Ein
 * `as HTMLElement` darin ist ein Syntaxfehler, und ein Akzentzeichen in einem
 * Kommentar INNERHALB einer Schablone beendet sie mitten im Satz.
 *
 *   node pruefungen/lauf/test585.mts
 * ==========================================================================*/
import { chromium, type Page, type CDPSession } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

/* `listen(0)` statt einer festen Zahl (L205). */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (ms: number) => new Promise(f => setTimeout(f, ms));

type Auf = { pc: Page; cdp: CDPSession; zu: () => Promise<void> };
const aufmachen = async (o: { handy?: boolean; ruhig?: boolean; dunkel?: boolean } = {}): Promise<Auf> => {
  const kontext = await browser.newContext({
    viewport: o.handy === false ? { width: 1440, height: 900 } : { width: 390, height: 844 },
    hasTouch: o.handy !== false, isMobile: o.handy !== false,
    colorScheme: o.dunkel ? 'dark' : 'light',
    ...(o.ruhig ? { reducedMotion: 'reduce' as const } : {})
  });
  const pc = await kontext.newPage();
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 150)));
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pc.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && !!document.querySelector("#page")');
  await pc.waitForTimeout(1600);
  await pc.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    App.theme(${o.dunkel ? "'dark'" : "'light'"});
  })()`);
  await pc.waitForTimeout(400);
  const cdp = await kontext.newCDPSession(pc);
  return { pc, cdp, zu: () => kontext.close() };
};

const mitte = (pc: Page, wahl: string) => pc.evaluate(`(() => {
  const e = document.querySelector(${JSON.stringify(wahl)});
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, links: r.left, breite: r.width };
})()`) as Promise<{ x: number; y: number; links: number; breite: number } | null>;

const finger = (cdp: CDPSession, typ: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
  cdp.send('Input.dispatchTouchEvent', {
    type: typ, touchPoints: typ === 'touchEnd' ? [] : [{ x, y }]
  });

/* Zählt, wie oft ein Klick auf einen Reiter der unteren Leiste bis zum
   Dokument durchkommt — der Weg, den `schale.ts` für den Wechsel geht. */
/* EIN Horcher je Seite; spätere Aufrufe setzen nur die Zahlen zurück (ein
   zweiter Horcher zählte jeden Klick doppelt — so ist es beim Bauen dieses
   Laufs passiert). */
const klickZaehler = `(() => {
  if (window.__t585) { window.__t585.klicks = {}; return; }
  window.__t585 = { klicks: {} };
  document.addEventListener('click', function (e) {
    const k = e.target && e.target.closest ? e.target.closest('#handy-oben > button') : null;
    if (k) window.__t585.klicks[k.id] = (window.__t585.klicks[k.id] || 0) + 1;
  });
})()`;

/* Folgt einer kurzlebigen Fläche in einer Reihe, Bild für Bild. */
const flugBeobachten = (sel: string, dauer = 750) => `(async () => {
  const orte = []; const dehnung = []; let gesehen = 0; let leer = 0; let wartend = 0;
  let laeuft = true; let letzte = null;
  const takt = function () {
    const f = document.querySelector('.ru-flug');
    if (f) {
      gesehen++;
      const r = f.getBoundingClientRect();
      letzte = { l: r.left, t: r.top, b: r.width, h: r.height };
      if (!orte.length || Math.abs(orte[orte.length - 1] - (r.left + r.top)) > 0.4) orte.push(r.left + r.top);
      const m = getComputedStyle(f).transform.match(/matrix\\(([-\\d.e]+),\\s*[-\\d.e]+,\\s*[-\\d.e]+,\\s*([-\\d.e]+)/);
      if (m) dehnung.push(Number(m[1]) / Math.max(0.001, Number(m[2])));
      const z = document.querySelector('.ru-wartet,.ru-wartet-rand');
      if (z) {
        wartend++;
        /* Leer hiesse: die Wahl HAT einen Grund (--ru-grund), und davon
           steht unterwegs nichts da. Eine Wahl, die nur ein Strich ist
           (Aussehen), behält ihre Schrift; ihr Strich fliegt. */
        const leise = /rgba\\([^)]*,\\s*0\\)|transparent/;
        const g = getComputedStyle(z).backgroundColor;
        const eigen = getComputedStyle(z).getPropertyValue('--ru-grund').trim();
        if (z.classList.contains('ru-wartet') && eigen && !leise.test(eigen) && leise.test(g)) leer++;
      }
    }
    if (laeuft) requestAnimationFrame(takt);
  };
  requestAnimationFrame(takt);
  await new Promise(function (f) { setTimeout(f, ${dauer}); });
  laeuft = false;
  const ziel = document.querySelector(${JSON.stringify(sel)});
  const zr = ziel ? ziel.getBoundingClientRect() : null;
  return { gesehen: gesehen, orte: orte.length, leer: leer, wartend: wartend,
           dehnungMax: dehnung.length ? Math.max.apply(null, dehnung) : 1,
           letzte: letzte, ziel: zr ? { l: zr.left, t: zr.top, b: zr.width, h: zr.height } : null,
           bleibt: document.querySelectorAll('.ru-flug').length,
           traeger: document.querySelectorAll('.ru-traeger').length };
})()`;

type Flug = { gesehen: number; orte: number; leer: number; wartend: number; dehnungMax: number;
  letzte: { l: number; t: number; b: number; h: number } | null;
  ziel: { l: number; t: number; b: number; h: number } | null; bleibt: number; traeger: number };

const flugPruefen = (name: string, f: Flug) => {
  p(name + ': die Wahl fliegt (eine Fläche, viele Zwischenorte)', f.gesehen > 0 && f.orte >= 6,
    f.gesehen + ' Bilder, ' + f.orte + ' Orte');
  p(name + ': … und landet genau auf der neuen Wahl',
    !!f.letzte && !!f.ziel && Math.abs(f.letzte.l - f.ziel.l) <= 2 && Math.abs(f.letzte.t - f.ziel.t) <= 2,
    JSON.stringify({ letzte: f.letzte, ziel: f.ziel }));
  p(name + ': … das Ziel ist unterwegs nie leer (es leuchtet vor)', f.leer === 0, f.leer + ' leere Bilder');
  p(name + ': … und danach ist die Fläche wieder weg', f.bleibt === 0 && f.traeger === 0,
    f.bleibt + ' Flächen, ' + f.traeger + ' Träger');
};

/* ══════════════════════════════════════════════════════════════════════════
 * §1 DIE FEDERN DES KITS
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n1 · Die Federn des Touch Kits');
{
  const a = await aufmachen();
  const federn = await a.pc.evaluate(`(() => {
    const F = SelectionFlow.FEDERN || {};
    return { knapp: F.knapp || null, druck: F.druck || null };
  })()`) as any;
  p('Die Feder „knapp" ist die des Kits (snappy: 0,36 s, Schwung 0,14)',
    federn.knapp && federn.knapp.dauer === 0.36 && federn.knapp.schwung === 0.14, JSON.stringify(federn.knapp));
  p('Die Feder „druck" ist die des Kits (press: 0,32 s, Schwung 0,3)',
    federn.druck && federn.druck.dauer === 0.32 && federn.druck.schwung === 0.3, JSON.stringify(federn.druck));

  /* Die Bahn der Pille, wie sie dem Compositor übergeben wird — über ZWEI
     Wege (rund 150 px): beim Nachbarn ist das Überschwingen der Kit-Feder
     (0,5 % des Weges) kleiner als die Genauigkeit, mit der die Bahn endet. */
  const bahn = await a.pc.evaluate(`(async () => {
    document.getElementById('hl-dok').click();
    await new Promise(function (f) { setTimeout(f, 700); });
    const pille = document.getElementById('ho-pille');
    document.getElementById('hl-lernen').click();
    await new Promise(function (f) { setTimeout(f, 30); });
    /* Die Bahn ist die Animation mit transform-Keyframes; eine
       Stil-Überblendung (Deckkraft) zählt hier nicht mit. */
    const an = pille.getAnimations().find(function (x) {
      return x.effect && x.effect.getKeyframes().some(function (k) { return !!k.transform; }); });
    const xs = an ? an.effect.getKeyframes().map(function (k) {
      return new DOMMatrixReadOnly(String(k.transform || 'none')).m41; }) : [];
    await new Promise(function (f) { setTimeout(f, 800); });
    const ziel = document.getElementById('hl-lernen').offsetLeft;
    const von = xs.length ? xs[0] : ziel;
    const ueber = xs.length ? Math.max.apply(null, xs.map(function (x) { return (x - ziel) * Math.sign(ziel - von); })) : 0;
    return { bilder: xs.length, von: von, ziel: ziel, ueber: ueber,
             steht: Math.round(pille.getBoundingClientRect().left),
             soll: Math.round(document.getElementById('hl-lernen').getBoundingClientRect().left) };
  })()`) as any;
  p('Die Pille fährt eine Federbahn (Keyframes auf dem Compositor)', bahn.bilder >= 20, String(bahn.bilder));
  p('Sie schwingt wie die Kit-Feder ein wenig über — aber höchstens 1 % des Weges ('
    + bahn.ueber.toFixed(2) + ' px über ' + Math.round(Math.abs(bahn.ziel - bahn.von)) + ' px)',
    bahn.ueber > 0.05 && bahn.ueber <= Math.abs(bahn.ziel - bahn.von) * 0.01 + 0.01,
    bahn.ueber.toFixed(2) + ' px über ' + Math.round(Math.abs(bahn.ziel - bahn.von)) + ' px Weg');
  p('… und steht danach genau am Reiter', Math.abs(bahn.steht - bahn.soll) <= 1, bahn.steht + ' statt ' + bahn.soll);
  await a.zu();
}

/* ══════════════════════════════════════════════════════════════════════════
 * §2 IN RUHE LESBAR — der aktive Name unter der Linse
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n2 · Der aktive Name ist in Ruhe lesbar (≥ 4,5 : 1)');

/** Kontrast im Kasten des aktiven Namens: dunkelster gegen hellsten
 *  Bildpunkt. Die Schrift IST einer davon — gemessen wird, was das Auge
 *  sieht, samt der Linse darüber. */
const namenKontrast = async (pc: Page) => {
  const k = await pc.evaluate(`(() => {
    const b = document.querySelector('#handy-oben > button[aria-selected="true"] b');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  })()`) as { x: number; y: number; w: number; h: number } | null;
  if (!k || k.w < 4 || k.h < 4) return null;
  const bild = await pc.screenshot({ clip: { x: k.x, y: k.y, width: k.w, height: k.h } });
  return pc.evaluate(`(async () => {
    const img = new Image();
    img.src = 'data:image/png;base64,${bild.toString('base64')}';
    await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const lin = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = [];
    for (let i = 0; i < d.length; i += 4) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
    L.sort(function (a, b) { return a - b; });
    const lo = L[Math.floor(L.length * 0.005)], hi = L[Math.floor(L.length * 0.995)];
    return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100;
  })()`) as Promise<number>;
};

for (const dunkel of [false, true]) {
  const a = await aufmachen({ dunkel });
  await a.pc.evaluate(`document.getElementById('hl-dok').click()`);
  await a.pc.waitForTimeout(1500);
  const wert = await namenKontrast(a.pc);
  p(`${dunkel ? 'Dunkel' : 'Hell'}: „Dokumente" unter der Linse mit mindestens 4,5 : 1 (gemessen ${wert} : 1)`,
    wert !== null && wert >= 4.5, String(wert));
  await a.zu();
}

/* ══════════════════════════════════════════════════════════════════════════
 * §3 DIE PILLE LÄSST SICH ZIEHEN
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n3 · Die Pille lässt sich mit dem Daumen ziehen');
{
  const a = await aufmachen();
  await a.pc.evaluate(`document.getElementById('hl-dok').click()`);
  await a.pc.waitForTimeout(900);
  await a.pc.evaluate(klickZaehler);

  const von = (await mitte(a.pc, '#hl-dok'))!;
  const nach = (await mitte(a.pc, '#hl-bespr'))!;
  await finger(a.cdp, 'touchStart', von.x, von.y);
  await warte(50);
  const schritte = 12;
  const pilleMitte = () => a.pc.evaluate(`(() => { const r = document.getElementById('ho-pille').getBoundingClientRect(); return r.left + r.width / 2; })()`) as Promise<number>;
  let zwischen = { finger: 0, pille: 0 };
  for (let i = 1; i <= schritte; i++) {
    const x = von.x + (nach.x - von.x) * i / schritte;
    await finger(a.cdp, 'touchMove', x, von.y);
    await warte(24);
    if (i === 5) { await warte(120); zwischen = { finger: x, pille: await pilleMitte() }; }
  }
  await warte(160);                                    /* der Finger ruht */
  const gehalten = await a.pc.evaluate(`(() => {
    const l = document.getElementById('handy-oben');
    const pille = document.getElementById('ho-pille');
    const r = pille.getBoundingClientRect();
    const m = new DOMMatrixReadOnly(getComputedStyle(pille).transform);
    const vor = l.querySelector('[data-anvisiert]');
    return { gehalten: l.hasAttribute('data-gehalten'), hub: m.d, mitte: r.left + r.width / 2,
             vor: vor ? vor.id : null,
             ring: getComputedStyle(pille, '::after').opacity,
             gewaehlt: (l.querySelector('button[aria-selected="true"]') || {}).id };
  })()`) as any;
  p('Gehalten: die Leiste sagt es (data-gehalten)', gehalten.gehalten, JSON.stringify(gehalten));
  p('… die Pille hebt sich (Kit: 1,08 bis 1,12)', gehalten.hub >= 1.05 && gehalten.hub <= 1.13, String(gehalten.hub));
  /* 1:1 — gemessen als WEG, nicht als Ort: gegriffen wird sie dort, wo sie
     war, als die Schwelle von 10 px überschritten war (Kit: „so the slop
     does not make it jump"); dieser Abstand bleibt, der Weg ist derselbe. */
  const fingerWeg = nach.x - zwischen.finger, pillenWeg = gehalten.mitte - zwischen.pille;
  p('… sie folgt dem Finger 1:1', Math.abs(pillenWeg - fingerWeg) <= 3 && Math.abs(gehalten.mitte - nach.x) <= 24,
    'Finger ' + Math.round(fingerWeg) + ' px, Pille ' + Math.round(pillenWeg) + ' px, Abstand ' + Math.round(gehalten.mitte - nach.x));
  p('… der Reiter darunter leuchtet vor', gehalten.vor === 'hl-bespr', String(gehalten.vor));
  p('… und der Ring um die gehobene Fläche ist da', Number(gehalten.ring) > 0.5, String(gehalten.ring));
  p('… gewählt ist noch der alte Reiter (nichts wechselt, solange man hält)',
    gehalten.gewaehlt === 'hl-dok', String(gehalten.gewaehlt));

  await finger(a.cdp, 'touchEnd');
  await warte(900);
  const danach = await a.pc.evaluate(`(() => {
    const l = document.getElementById('handy-oben');
    const pille = document.getElementById('ho-pille');
    const ziel = document.getElementById('hl-bespr');
    return { gewaehlt: Array.from(l.querySelectorAll('button[aria-selected="true"]')).map(function (b) { return b.id; }),
             klicks: window.__t585.klicks, gehalten: l.hasAttribute('data-gehalten'),
             vor: l.querySelectorAll('[data-anvisiert]').length,
             steht: Math.round(pille.getBoundingClientRect().left), soll: Math.round(ziel.getBoundingClientRect().left),
             animationen: pille.getAnimations().length,
             hub: new DOMMatrixReadOnly(getComputedStyle(pille).transform).d };
  })()`) as any;
  p('Losgelassen über „Termine": Termine ist gewählt — genau einer',
    danach.gewaehlt.length === 1 && danach.gewaehlt[0] === 'hl-bespr', JSON.stringify(danach.gewaehlt));
  p('… über GENAU EINEN Klick auf „Termine", keinen anderen',
    JSON.stringify(danach.klicks) === '{"hl-bespr":1}', JSON.stringify(danach.klicks));
  p('… die Pille steht dort und ruht', Math.abs(danach.steht - danach.soll) <= 1 && danach.animationen === 0,
    danach.steht + ' statt ' + danach.soll + ', ' + danach.animationen + ' Animationen');
  p('… sie ist wieder abgesetzt (keine Hebung, kein Vorleuchten)',
    !danach.gehalten && danach.vor === 0 && Math.abs(danach.hub - 1) < 0.002,
    JSON.stringify({ g: danach.gehalten, v: danach.vor, h: danach.hub }));

  /* Ein Tipp bleibt ein Tipp. */
  await a.pc.evaluate(klickZaehler);
  const lernen = (await mitte(a.pc, '#hl-lernen'))!;
  await finger(a.cdp, 'touchStart', lernen.x, lernen.y);
  await warte(60);
  await finger(a.cdp, 'touchEnd');
  await warte(900);
  const tipp = await a.pc.evaluate(`({ klicks: window.__t585.klicks,
    gewaehlt: (document.querySelector('#handy-oben button[aria-selected="true"]') || {}).id })`) as any;
  p('Ein Tipp wählt wie immer — ein Klick, der richtige Reiter',
    tipp.gewaehlt === 'hl-lernen' && JSON.stringify(tipp.klicks) === '{"hl-lernen":1}', JSON.stringify(tipp));

  /* Gummiband: über das rechte Ende hinaus gibt sie nach. */
  const mehr = (await mitte(a.pc, '#hl-mehr'))!;
  const start = (await mitte(a.pc, '#hl-bespr'))!;
  await a.pc.evaluate(klickZaehler);
  await finger(a.cdp, 'touchStart', start.x, start.y);
  await warte(40);
  for (let i = 1; i <= 10; i++) {
    await finger(a.cdp, 'touchMove', start.x + (388 - start.x) * i / 10, start.y);
    await warte(24);
  }
  await warte(160);
  const band = await a.pc.evaluate(`(() => {
    const r = document.getElementById('ho-pille').getBoundingClientRect();
    return r.left + r.width / 2;
  })()`) as number;
  p('Über das Ende hinaus gibt sie nach wie ein Gummiband (bleibt hinter dem Finger)',
    band > mehr.x && band < 388 - 10 && band <= mehr.x + mehr.breite / 2,
    'Mitte ' + Math.round(band) + ', Finger 388, letzter Reiter ' + Math.round(mehr.x));

  /* Escape bricht das Ziehen ab: nichts wechselt. */
  await a.pc.keyboard.press('Escape');
  await warte(80);
  await finger(a.cdp, 'touchEnd');
  await warte(900);
  const abbruch = await a.pc.evaluate(`({ klicks: window.__t585.klicks,
    gehalten: document.getElementById('handy-oben').hasAttribute('data-gehalten'),
    gewaehlt: (document.querySelector('#handy-oben button[aria-selected="true"]') || {}).id,
    steht: Math.round(document.getElementById('ho-pille').getBoundingClientRect().left),
    soll: Math.round(document.getElementById('hl-lernen').getBoundingClientRect().left) })`) as any;
  p('Escape bricht das Ziehen ab — kein Wechsel, kein Klick, die Pille kehrt zurück',
    abbruch.gewaehlt === 'hl-lernen' && JSON.stringify(abbruch.klicks) === '{}' && !abbruch.gehalten
      && Math.abs(abbruch.steht - abbruch.soll) <= 1, JSON.stringify(abbruch));

  /* ══════════════════════════════════════════════════════════════════════
   * §4 DIE ZEICHEN SINKEN EIN UND FEDERN ZURÜCK
   * ════════════════════════════════════════════════════════════════════ */
  console.log('\n4 · Die Zeichen sinken ein und federn zurück');
  const start4 = (await mitte(a.pc, '#hl-start'))!;
  await finger(a.cdp, 'touchStart', start4.x, start4.y);
  await warte(120);
  const drin = await a.pc.evaluate(`(() => {
    const z = document.querySelector('#hl-start .ho-z');
    return parseFloat(getComputedStyle(z).scale);
  })()`) as number;
  p('Gedrückt sinkt das Zeichen ein (Kit: 0,9)', drin > 0.85 && drin < 0.95, String(drin));
  await finger(a.cdp, 'touchEnd');
  await warte(30);
  const zurueck = await a.pc.evaluate(`(() => {
    const z = document.querySelector('#hl-start .ho-z');
    const an = z.getAnimations()[0];
    const werte = an ? an.effect.getKeyframes().map(function (k) { return parseFloat(k.scale); }) : [];
    return { werte: werte.length, hoechster: werte.length ? Math.max.apply(null, werte) : 0 };
  })()`) as any;
  /* Druckfeder des Kits (Schwung 0,3) von 0,9 aus: rund 4,6 % des Weges
     über 1 hinaus, also etwa 1,0046. */
  p('Losgelassen federt es zurück — auf der Druckfeder, mit Nachschwingen über 1',
    zurueck.werte >= 20 && zurueck.hoechster > 1.002 && zurueck.hoechster < 1.02, JSON.stringify(zurueck));
  await warte(900);
  const ruht = await a.pc.evaluate(`parseFloat(getComputedStyle(document.querySelector('#hl-start .ho-z')).scale) || 1`) as number;
  p('… und steht danach wieder bei 1', Math.abs(ruht - 1) < 0.002, String(ruht));
  await a.zu();
}

/* ══════════════════════════════════════════════════════════════════════════
 * §5 DIE UMSCHALTER
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n5 · Die Umschalter: die Wahl fliegt, statt zu springen');
{
  /* Seite · Fläche · Redion — am Telefon und am Rechner. */
  for (const handy of [true, false]) {
    const a = await aufmachen({ handy });
    await a.pc.evaluate(`(async () => {
      const seite = Store.addPage(null, { text: 'Drei Ansichten' });
      Store.addBlock(seite.id, 'text', { text: 'Ein Absatz, damit die Seite nicht leer ist.' });
      await Store.flush();
      App.oeffne(seite.id);
    })()`);
    await a.pc.waitForSelector('.ru-seg [data-seg-wahl="flaeche"]', { timeout: 15000 });
    await a.pc.waitForTimeout(700);
    const beob = a.pc.evaluate(flugBeobachten('.ru-seg [aria-checked="true"]'));
    const sofort = await a.pc.evaluate(`(() => {
      document.querySelector('.ru-seg [data-seg-wahl="flaeche"]').click();
      const k = document.querySelector('.ru-seg [data-seg-wahl="flaeche"]');
      return k ? k.getAttribute('aria-checked') : 'weg';
    })()`) as string;
    const f = await beob as Flug;
    const g = handy ? 'Telefon' : 'Rechner';
    p(`${g}, Seite → Fläche: der Zustand steht sofort am Knopf (aria-checked)`, sofort === 'true' || sofort === 'weg', sofort);
    flugPruefen(`${g}, Seite → Fläche`, f);
    await a.zu();
  }

  /* Die Bibliothek zeigt seit der konsolidierten Suche nur den aktiven Weg.
     Die übrigen Wege bleiben über denselben Menüknopf erreichbar; hier
     zählt die echte Zustandsänderung statt eines Flugs zwischen Knöpfen,
     die es auf der Hauptfläche nicht mehr gibt. */
  {
    const a = await aufmachen();
    await a.pc.evaluate(`Bibliothek.oeffne()`);
    await a.pc.waitForSelector('.bib-studio-wege [data-studio-wege]', { timeout: 15000 });
    const vorher = await a.pc.locator('.bib-studio-wege button').count();
    await a.pc.locator('[data-studio-wege]').click();
    await a.pc.locator('.menu [data-studio-weg="kuerzlich"]').click();
    const nachher = await a.pc.locator('[data-studio-wege]').textContent();
    p('Dokumente: nur ein aktiver Weg steht in der Hauptfläche', vorher === 1, String(vorher));
    p('Dokumente: Zuletzt geöffnet ist im Menü erreichbar und wird aktiv',
      !!nachher && /Zuletzt geöffnet/.test(nachher), String(nachher));
    await a.zu();
  }

  /* Die Reiter von „Aussehen" — am Rechner. */
  {
    const a = await aufmachen({ handy: false });
    await a.pc.evaluate(`Aussehen.dialog()`);
    await a.pc.waitForSelector('.au-reiter [data-r="schrift"]', { timeout: 15000 });
    await a.pc.waitForTimeout(500);
    const beob = a.pc.evaluate(flugBeobachten('.au-reiter button.an'));
    await a.pc.evaluate(`document.querySelector('.au-reiter [data-r="schrift"]').click()`);
    flugPruefen('Aussehen, Farben → Schrift und Layout', await beob as Flug);
    await a.zu();
  }

  /* Die Reiter von „Heute" — am Rechner. */
  {
    const a = await aufmachen({ handy: false });
    await a.pc.evaluate(`Produktwelten.lernen('heute')`);
    await a.pc.waitForSelector('.lw-nav > button', { timeout: 15000 });
    await a.pc.waitForTimeout(900);
    const beob = a.pc.evaluate(flugBeobachten('.lw-nav > button.is-active', 1000));
    await a.pc.evaluate(`document.querySelectorAll('.lw-nav > button')[1].click()`);
    flugPruefen('Heute, erster → zweiter Reiter', await beob as Flug);
    await a.zu();
  }

  /* Die Liste der Einstellungen — am Rechner, senkrecht. */
  {
    const a = await aufmachen({ handy: false });
    await a.pc.evaluate(`Einstellungen.oeffne()`);
    await a.pc.waitForSelector('.einst-nav button[data-b]', { timeout: 15000 });
    await a.pc.waitForTimeout(600);
    const beob = a.pc.evaluate(flugBeobachten('.einst-nav button.on'));
    await a.pc.evaluate(`(() => {
      const alle = Array.from(document.querySelectorAll('.einst-nav button[data-b]'));
      const i = alle.findIndex(function (b) { return b.classList.contains('on'); });
      (alle[i + 1] || alle[0]).click();
    })()`);
    flugPruefen('Einstellungen, eine Zeile tiefer', await beob as Flug);
    await a.zu();
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * §6 DIE STIFTLEISTE
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n6 · Die Stiftleiste: Zubehör und Werkzeug auf der Feder des Kits');
const stiftSeite = async (a: Auf) => {
  await a.pc.evaluate(`(async () => {
    const seite = Store.addPage(null, { text: 'Materialprobe' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  })()`);
  await a.pc.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await a.pc.waitForTimeout(500);
  await a.pc.click('.blatt-werk [data-wz="stift"]');
  await a.pc.waitForTimeout(700);
};
for (const handy of [false, true]) {
  const a = await aufmachen({ handy });
  await stiftSeite(a);
  const g = handy ? 'Telefon' : 'Rechner';

  const beobF = a.pc.evaluate(flugBeobachten('.blatt-werk .blatt-farbe.on'));
  const farbe = await a.pc.evaluate(`(() => {
    const alle = Array.from(document.querySelectorAll('.blatt-werk .blatt-farbe:not(.blatt-farbe-eigen)'));
    const i = alle.findIndex(function (b) { return b.classList.contains('on'); });
    const k = alle[i + 1] || alle[0];
    k.click();
    return k.classList.contains('on');
  })()`) as boolean;
  p(`${g}: die neue Farbe ist sofort gewählt (on am Knopf)`, farbe);
  flugPruefen(`${g}, Farbe → Nachbarfarbe`, await beobF as Flug);
  await a.pc.waitForTimeout(300);

  const beobB = a.pc.evaluate(flugBeobachten('.blatt-werk .blatt-strich.on'));
  await a.pc.evaluate(`(() => {
    const alle = Array.from(document.querySelectorAll('.blatt-werk .blatt-strich'));
    const i = alle.findIndex(function (b) { return b.classList.contains('on'); });
    (alle[i + 1] || alle[0]).click();
  })()`);
  flugPruefen(`${g}, Breite → nächste Breite`, await beobB as Flug);
  await a.pc.waitForTimeout(300);

  const beobS = a.pc.evaluate(flugBeobachten('.blatt-werk [data-act="stilwahl"].on'));
  await a.pc.evaluate(`(() => {
    const alle = Array.from(document.querySelectorAll('.blatt-werk [data-act="stilwahl"]'));
    const i = alle.findIndex(function (b) { return b.classList.contains('on'); });
    (alle[i + 1] || alle[0]).click();
  })()`);
  flugPruefen(`${g}, Stift → nächster Stift`, await beobS as Flug);
  await a.pc.waitForTimeout(300);

  /* Der Werkzeugflug (E640/E647): dieselbe Fläche, jetzt auf der Kit-Feder. */
  if (!handy) {
    const wz = await a.pc.evaluate(`(async () => {
      document.querySelector('.blatt-werk [data-wz="marker"]').click();
      await new Promise(function (f) { requestAnimationFrame(function () { f(); }); });
      const flug = document.querySelector('.bw-flug');
      const an = flug ? flug.getAnimations()[0] : null;
      if (!an) return null;
      const bilder = an.effect.getKeyframes().map(function (k) { return new DOMMatrixReadOnly(String(k.transform || 'none')); });
      const erster = bilder[0].m41;
      return { bilder: bilder.length,
               ueber: Math.max.apply(null, bilder.map(function (m) { return -m.m41 * Math.sign(erster); })),
               dehnung: Math.max.apply(null, bilder.map(function (m) { return m.a; })) };
    })()`) as any;
    /* Das Überschwingen der Kit-Feder ist hier kleiner als ein halbes
       Pixel und liegt hinter dem Ende der Bahn; sichtbar ist die Dehnung. */
    p('Der Werkzeugwechsel fliegt auf der Kit-Feder und dehnt sich zwischen Nachbarn in Flugrichtung',
      !!wz && wz.bilder >= 20 && wz.dehnung > 1.01 && wz.dehnung <= 1.25, JSON.stringify(wz));
    p('… und landet ohne Rückwärtsschritt über einen halben Pixel', !!wz && wz.ueber < 0.5, JSON.stringify(wz));
  }
  await a.zu();
}

/* ══════════════════════════════════════════════════════════════════════════
 * §7 OHNE BEWEGUNG
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n7 · Ohne Bewegung: nichts fliegt, nichts dehnt sich, die Wahl stimmt');
for (const art of ['reduce', 'ruhig'] as const) {
  const a = await aufmachen({ ruhig: art === 'reduce' });
  if (art === 'ruhig') await a.pc.evaluate(`document.body.dataset.bewegung = 'ruhig'`);
  const name = art === 'reduce' ? 'prefers-reduced-motion' : '„Ruhige Darstellung"';
  await a.pc.evaluate(`document.getElementById('hl-dok').click()`);
  await a.pc.waitForTimeout(700);
  const tipp = await a.pc.evaluate(`(async () => {
    const pille = document.getElementById('ho-pille');
    let hoechst = 0;
    let laeuft = true;
    const takt = function () { hoechst = Math.max(hoechst, pille.getAnimations().length); if (laeuft) requestAnimationFrame(takt); };
    requestAnimationFrame(takt);
    document.getElementById('hl-bespr').click();
    await new Promise(function (f) { setTimeout(f, 500); });
    laeuft = false;
    return { animationen: hoechst,
             steht: Math.round(pille.getBoundingClientRect().left),
             soll: Math.round(document.getElementById('hl-bespr').getBoundingClientRect().left) };
  })()`) as any;
  p(`${name}: die Pille springt, statt zu fahren — und steht richtig`,
    tipp.animationen === 0 && Math.abs(tipp.steht - tipp.soll) <= 1, JSON.stringify(tipp));

  /* Gezogen: keine Hebung, keine Dehnung — und trotzdem gewählt. */
  const von = (await mitte(a.pc, '#hl-bespr'))!;
  const nach = (await mitte(a.pc, '#hl-start'))!;
  await finger(a.cdp, 'touchStart', von.x, von.y);
  await warte(40);
  for (let i = 1; i <= 10; i++) { await finger(a.cdp, 'touchMove', von.x + (nach.x - von.x) * i / 10, von.y); await warte(24); }
  await warte(120);
  const m = await a.pc.evaluate(`(() => { const m = new DOMMatrixReadOnly(getComputedStyle(document.getElementById('ho-pille')).transform); return { a: m.a, d: m.d }; })()`) as any;
  p(`${name}: gehalten hebt und dehnt sich nichts`, Math.abs(m.a - 1) < 0.002 && Math.abs(m.d - 1) < 0.002, JSON.stringify(m));
  await finger(a.cdp, 'touchEnd');
  await warte(200);
  const nachZug = await a.pc.evaluate(`(() => ({
    gewaehlt: (document.querySelector('#handy-oben button[aria-selected="true"]') || {}).id,
    animationen: document.getElementById('ho-pille').getAnimations().length }))()`) as any;
  p(`${name}: losgelassen ist „Heute" gewählt, ohne Fahrt`,
    nachZug.gewaehlt === 'hl-start' && nachZug.animationen === 0, JSON.stringify(nachZug));

  /* Umschalter: kein Flug, der Zustand trotzdem sofort. */
  await a.pc.evaluate(`(async () => {
    const seite = Store.addPage(null, { text: 'Ruhig' });
    Store.addBlock(seite.id, 'text', { text: 'Absatz.' });
    await Store.flush();
    App.oeffne(seite.id);
  })()`);
  await a.pc.waitForSelector('.ru-seg [data-seg-wahl="flaeche"]', { timeout: 15000 });
  await a.pc.waitForTimeout(600);
  const beob = a.pc.evaluate(flugBeobachten('.ru-seg [aria-checked="true"]', 500));
  await a.pc.evaluate(`document.querySelector('.ru-seg [data-seg-wahl="flaeche"]').click()`);
  const f = await beob as Flug;
  const gewaehlt = await a.pc.evaluate(`(document.querySelector('.ru-seg [aria-checked="true"]') || {}).dataset`) as any;
  p(`${name}: Seite → Fläche fliegt nicht`, f.gesehen === 0 && f.wartend === 0, JSON.stringify(f));
  p(`${name}: … und „Fläche" ist trotzdem gewählt`, !!gewaehlt && gewaehlt.segWahl === 'flaeche', JSON.stringify(gewaehlt));
  await a.zu();
}

/* ══════════════════════════════════════════════════════════════════════════
 * §8 TASTATUR UND VORLESER MERKEN NICHTS
 * ════════════════════════════════════════════════════════════════════════ */
console.log('\n8 · Tastatur und Vorleser bleiben, wie sie waren');
{
  const a = await aufmachen();
  const rollen = await a.pc.evaluate(`(() => {
    const l = document.getElementById('handy-oben');
    const tabs = Array.from(l.querySelectorAll('button'));
    return { rolle: l.getAttribute('role'), tabs: tabs.filter(function (b) { return b.getAttribute('role') === 'tab'; }).length,
             gewaehlt: tabs.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; }).length,
             pille: document.getElementById('ho-pille').getAttribute('aria-hidden') };
  })()`) as any;
  p('Die untere Leiste bleibt eine Reiterliste mit fünf Reitern, einer gewählt, die Pille verborgen',
    rollen.rolle === 'tablist' && rollen.tabs === 5 && rollen.gewaehlt === 1 && rollen.pille === 'true', JSON.stringify(rollen));

  await a.pc.evaluate(`(async () => {
    const seite = Store.addPage(null, { text: 'Tasten' });
    Store.addBlock(seite.id, 'text', { text: 'Absatz.' });
    await Store.flush();
    App.oeffne(seite.id);
  })()`);
  await a.pc.waitForSelector('.ru-seg [data-seg-wahl]', { timeout: 15000 });
  await a.pc.waitForTimeout(600);
  await a.pc.focus('.ru-seg [aria-checked="true"]');
  const beob = a.pc.evaluate(flugBeobachten('.ru-seg [aria-checked="true"]'));
  await a.pc.keyboard.press('ArrowRight');
  const f = await beob as Flug;
  const seg = await a.pc.evaluate(`(() => {
    const g = document.querySelector('.ru-seg');
    return { rolle: g.getAttribute('role'),
             gewaehlt: Array.from(g.querySelectorAll('[aria-checked="true"]')).map(function (k) { return k.dataset.segWahl; }),
             stopps: Array.from(g.querySelectorAll('[role="radio"]')).filter(function (k) { return k.tabIndex === 0; }).length };
  })()`) as any;
  p('Der Umschalter bleibt eine Radiogruppe mit einem Tabstopp; → wählt den nächsten',
    seg.rolle === 'radiogroup' && seg.gewaehlt.length === 1 && seg.stopps === 1, JSON.stringify(seg));
  p('… und die Wahl fliegt auch mit der Tastatur', f.gesehen > 0 && f.orte >= 6, JSON.stringify({ g: f.gesehen, o: f.orte }));
  await a.zu();
}

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
