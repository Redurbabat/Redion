/* ============================================================================
 * test582 — Glas, wo es passt (E703)
 * ----------------------------------------------------------------------------
 * Redur, 27. September 2026, ca. 16:45 UTC: „du muss mehr im redion arbeiten
 * du kannst auch die oberfläche bischen ruhige machen ohne etwas lösche also
 * eine funktionen und ich will das es flüssigere animationen , glass efeck
 * usw alles haben dann bessere stift efeckte beim zeichnen bessere farben".
 * Und ca. 21:45 UTC, im Fragebogen: „Starker Kontrast ohne Glas".
 *
 * `test576` hält E695: EIN Glas, zwei Dichten, der Zwilling fürs iPhone,
 * lesbar über dem schlimmsten Grund. Dieser Lauf hält, WO das Glas steht und
 * wo nicht — und dass es auf dem Bild wirklich Glas ist.
 *
 * WAS DIESER LAUF HÄLT
 *   §1  Die Unschärfe ist echt. Die kopflose Chromium-Schale malt jede
 *       Filterkette mit `blur` NICHT (SoftwareRenderer): auf jedem Bild von
 *       `bilder.mts` und in jeder Messung von `test576` lag die Seite scharf
 *       hinter dem Glas. Mit dem GPU-Weg (SwiftShader) ist sie verwischt.
 *       Gemessen wird die Rampe über einer harten Schwarz-Weiss-Kante.
 *   §2  Glas kommt als Scheibe, nicht als Nebel: ein Menü, ein Finder, das
 *       Blatt am Telefon blenden NICHT über `opacity` ein — sonst liegt die
 *       Seite in den ersten Bildern scharf hinter der Schrift. Die Scheibe
 *       gleitet, der Inhalt blendet.
 *   §3  Die zwei schwebenden Werkzeugleisten sind Glas: der Dock im
 *       Dokument und die schwebende Zeichenleiste (unten, frei, links,
 *       rechts). Dicht, weil sie Wörter tragen — und lesbar über dem
 *       schlimmsten Grund.
 *   §4  EIN Schalter macht alles Glas deckend: weniger Transparenz, mehr
 *       Kontrast, erzwungene Farben, Redions „Hoher Kontrast" und das
 *       Schema „Starker Kontrast".
 *   §5  „Starker Kontrast" hat GAR kein Glas — auch die Linse nicht, auch
 *       kein Zierstück —, und der gewählte Reiter bleibt trotzdem markiert.
 *   §6  Nie Glas auf Glas, und was nur meldet (Toast, schwebender Lader),
 *       liegt nie auf einem Werkzeug (Dock, Kapsel Zurück/Vor).
 *   §7  Grenzen, gemessen und aufgeschrieben (messungen.md §75): im Ruhen
 *       höchstens drei Glasflächen und ein Viertel des Telefons, mit offenem
 *       Menü höchstens 60 %, nie eine Unschärfe über (fast) den ganzen
 *       Telefonbildschirm, und die Unschärfe wird nie animiert.
 *   §8  Eine Lichtkante für alles Glas (`--glas-kante`, aus dem Touch Kit
 *       als Marke, ohne React).
 *   §9  Das leichte Glas folgt dem Schema — und seine Zeichen halten 3 : 1
 *       über dem schlimmsten Grund, in allen zehn Schemata (L221).
 *   §10 Lesbar in allen zehn Schemata, gemessen an Pixeln: Menü (auch die
 *       stille Schrift), Telefonleiste, Dock.
 *   §11 Der Präfix steht zuerst. lightningcss fasst „backdrop-filter;
 *       -webkit-backdrop-filter" zu EINER Zeile mit Präfix zusammen, und
 *       Chrome hat dann kein Glas (L222 Punkt 3) — in Redions eigenen
 *       Blättern steht der Zwilling deshalb VOR der unpräfixierten Zeile.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ──────────────────────────────────
 * Er WAR es: rot eingecheckt gegen den Grundstand 515451f (commit
 * „test582 (rot)"). Die Gegenproben stehen in E703.
 *
 * Kein fester Port (`listen(0)`, wie test400 es empfiehlt). Läuft unter der
 * Sperre für Browserläufe, weil er Bildschirmbilder misst.
 *
 *   node pruefungen/alle.mts 582
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const App: any, Store: any, UI: any, Aussehen: any, DocumentMode: any,
  Lader: any, Dialog: any, Rundgang: any, Einstellungen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const STIL = path.join(WURZEL, 'quell/schale/stil');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* DER GPU-WEG (E703). Die kopflose Schale von Chromium setzt ihre Bilder mit
   dem SoftwareRenderer zusammen, und der LÄSST jede Filterkette aus, in der
   `blur` steht — gemessen: `brightness(.5)` allein gibt 128, zusammen mit
   `blur` 255, und eine harte Kante bleibt hart. Mit SwiftShader als
   Grafikkarte ist die Unschärfe echt. „unsafe" erlaubt nur WebGL auf
   SwiftShader; für eine Prüfseite auf 127.0.0.1 ist das gleichgültig.
   Dieselben vier Schalter stehen in `bilder.mts` und `test576`. */
const GPU_WEG = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist', '--enable-gpu-compositing'];

/* ==========================================================================
 * Ein kleiner Leser für Stilblätter (derselbe wie in test576): er muss
 * wissen, in WELCHEM Block eine Deklaration steht, und hier auch, an
 * welcher STELLE im Block (§11).
 * ======================================================================== */
type Dekl = { datei: string; kontext: string[]; eigenschaft: string; wert: string; nr: number };
const lesen = (datei: string, roh: string): Dekl[] => {
  const css = roh
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/url\(\s*["']?data:[^)]*\)/g, 'url(data)')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
  const raus: Dekl[] = [];
  const stapel: string[] = [];
  let ab = 0, nr = 0;
  const nimm = (stueck: string) => {
    const t = stueck.trim();
    const i = t.indexOf(':');
    if (!t || i < 1 || t.includes('{')) return;
    raus.push({ datei, kontext: stapel.slice(), eigenschaft: t.slice(0, i).trim().toLowerCase(),
                wert: t.slice(i + 1).replace(/!important/g, '').replace(/\s+/g, ' ').trim(), nr: nr++ });
  };
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { stapel.push(css.slice(ab, i).replace(/\s+/g, ' ').trim()); ab = i + 1; }
    else if (c === ';') { nimm(css.slice(ab, i)); ab = i + 1; }
    else if (c === '}') { nimm(css.slice(ab, i)); stapel.pop(); ab = i + 1; }
  }
  return raus;
};

/* ==========================================================================
 * §11 · Der Präfix steht zuerst (Dateien, ohne Browser)
 * ======================================================================== */
console.log('\n11 · Der Präfix steht zuerst');
{
  const blaetter = fs.readdirSync(STIL).filter(f => f.endsWith('.css'))
    .map(f => ({ name: f, roh: fs.readFileSync(path.join(STIL, f), 'utf8') }));
  const bruecke = path.join(WURZEL, 'src/islands/bridge.css');
  if (fs.existsSync(bruecke)) blaetter.push({ name: 'src/islands/bridge.css', roh: fs.readFileSync(bruecke, 'utf8') });
  const alle = blaetter.flatMap(b => lesen(b.name, b.roh));
  const glas = alle.filter(d => d.eigenschaft === 'backdrop-filter');
  p('Der Leser findet das Glas in Redions eigenen Blättern', glas.length >= 10, `${glas.length} Stellen`);
  const verkehrt = glas.filter(d => alle.some(w =>
    w.datei === d.datei && w.eigenschaft === '-webkit-backdrop-filter' &&
    w.kontext.join('|') === d.kontext.join('|') && w.nr > d.nr));
  p('In jedem Block steht `-webkit-backdrop-filter` VOR `backdrop-filter` (sonst fasst lightningcss sie zusammen, L222)',
    verkehrt.length === 0,
    verkehrt.map(d => `${d.datei}: ${(d.kontext[d.kontext.length - 1] ?? '?').slice(0, 60)}`).join(' · '));
}

/* ==========================================================================
 * §1 (Dateien) · Bilder und Glaswächter nehmen den GPU-Weg
 * ======================================================================== */
console.log('\n1 · Die Unschärfe ist echt');
for (const datei of ['bilder.mts', 'pruefungen/lauf/test576.mts']) {
  const text = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  const fehlt = GPU_WEG.filter(s => !text.includes(`'${s}'`));
  p(`\`${datei}\` startet Chromium mit dem GPU-Weg (echte Unschärfe auf dem Bild)`, fehlt.length === 0,
    'fehlt: ' + fehlt.join(' '));
}

/* ==========================================================================
 * Ab hier der Browser
 * ======================================================================== */
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
const browser: Browser = await chromium.launch({ args: GPU_WEG });

type Wie = { media?: Array<{ name: string; value: string }>; erzwungen?: boolean;
             schema?: string; kontrast?: boolean };
/** Die App öffnen: Thema über die App (nicht über das Attribut — `Aussehen`
 *  setzte es sonst zurück, E695), dazu wahlweise ein Schema, Redions „Hoher
 *  Kontrast", eine Medienabfrage oder erzwungene Farben. */
const oeffnen = async (breite: number, hoehe: number, thema: 'light' | 'dark', wie: Wie = {}) => {
  const handy = breite < 800;
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe }, colorScheme: thema,
    isMobile: handy, hasTouch: handy, forcedColors: wie.erzwungen ? 'active' : 'none' });
  const pg = await ctx.newPage();
  if (wie.media) {
    const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Emulation.setEmulatedMedia', { features: wie.media });
  }
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page'), null, { timeout: 30000 });
  await pg.evaluate(async ([t, schema, kontrast]) => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99999);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(el => el.remove());
    App.theme(t);
    if (schema) Aussehen.setzen({ schema });
    /* „Hoher Kontrast" so, wie die Einstellung ihn schaltet (wie test34):
       das Attribut von Hand zu setzen, hielt nur, bis `Einstellungen.anwenden`
       das nächste Mal lief — und das schrieb unter Last „normal" zurück
       (gesehen: der Rechnerteil rot, der Telefonteil grün, im selben Lauf). */
    if (kontrast) { Store.setMeta('kontrast', true); Einstellungen.anwenden(); }
    const s = Store.addPage(null, { text: 'Glas' });
    for (const x of ['Energie und Arbeit', 'Wer fehlt, holt die Messwerte ab.', 'Tafelbild fotografiert.'])
      Store.addBlock(s.id, 'text', { text: x });
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 600));
    document.querySelectorAll('#rg-willkommen, .overlay, #rg-einladung, #rg-neu').forEach(x => x.remove());
  }, [thema, wie.schema ?? '', !!wie.kontrast] as const);
  await pg.waitForTimeout(150);
  return { ctx, pg };
};

/** Eine Seite mit Zeichenblatt; die Leiste in der gewünschten Lage. */
const blattSeite = (pg: Page, lage: string) => pg.evaluate(async (lage: string) => {
  Store.setMeta('zeichnen:leistenlage', lage);
  const s = Store.addPage(null, { text: 'Tafelbild' });
  Store.addBlock(s.id, 'blatt', { text: '' });
  await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('#rg-willkommen, .overlay, #rg-einladung, #rg-neu').forEach(x => x.remove());
  return s.id;
}, lage);

/** Dieselbe Seite im Dokumentmodus — dort schwebt der Dock (E619). */
const dokument = async (pg: Page) => {
  await blattSeite(pg, 'oben');
  await pg.evaluate(async () => {
    DocumentMode.toggle(Store.getBlock(App.aktuelleSeite()), true);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('#rg-willkommen, .overlay, #rg-einladung, #rg-neu').forEach(x => x.remove());
  });
  await pg.waitForSelector('body[data-dokument="an"] .blatt-reihe', { timeout: 10000 });
  await pg.waitForTimeout(200);
};
const DOCK = 'body[data-dokument="an"] .document-stage[data-aktiv]>.blatt-huelle>.blatt-reihe';

/** DER SCHLIMMSTE GRUND, NICHT DER SCHÖNSTE (wie in test576): vier breite,
 *  harte Streifen in Weiss, Schwarz, Rot und Blau — breiter als die
 *  Unschärfe, damit sie sie NICHT zu Grau verrührt. Papier und Leinwand
 *  werden unsichtbar, alles davor durchsichtig: unter dem Glas liegt dann
 *  genau das Muster. */
const MUSTER = 'linear-gradient(90deg,#ffffff 0 25%,#000000 0 50%,#e02020 0 75%,#1f5cff 0)';
const muster = (pg: Page) => pg.evaluate((m: string) => {
  const st = document.createElement('style');
  st.id = 't582-muster';
  st.textContent =
    `body,#app,#main,#page,.blatt-huelle,.document-stage,.document-body,.document-studio,.document-workspace{background:transparent!important}` +
    `#scroll,.document-center{background:${m}!important;background-attachment:fixed!important}` +
    `.blatt-papier,.blatt-papier *,canvas,#page .blk:not(.b-blatt){visibility:hidden!important}`;
  document.head.appendChild(st);
}, MUSTER);

/** EINE FARBE, WIE DER BROWSER SIE MALT — als [r, g, b, a] (test576). */
const farbwert = (pg: Page, css: string) => pg.evaluate((c: string) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = c; g.fillRect(0, 0, 1, 1);
  return Array.from(g.getImageData(0, 0, 1, 1).data);
}, css);
const deckkraft = async (pg: Page, css: string) => ((await farbwert(pg, css))[3] ?? 255) / 255;

/** Eine Marke so, wie der Browser sie für die Seite rechnet (am body). */
const marke = (pg: Page, name: string) => pg.evaluate((n: string) => {
  const t = document.createElement('div');
  t.style.cssText = n.startsWith('--bg') ? `background:var(${n})`
    : n === '--glas-kante' ? `box-shadow:var(${n})` : `backdrop-filter:var(${n})`;
  document.body.appendChild(t);
  const s = getComputedStyle(t);
  const w = n.startsWith('--bg') ? s.backgroundColor : n === '--glas-kante' ? s.boxShadow : s.backdropFilter;
  t.remove();
  return w;
}, name);

type Stil = { bf: string; bg: string; schatten: string; sicht: boolean; x: number; y: number; w: number; h: number };
const stil = (pg: Page, wahl: string) => pg.evaluate((w: string): Stil | null => {
  const el = [...document.querySelectorAll<HTMLElement>(w)].find(e => e.getBoundingClientRect().width > 0) ?? null;
  if (!el) return null;
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { bf: s.backdropFilter, bg: s.backgroundColor, schatten: s.boxShadow,
           sicht: r.width > 0 && r.height > 0, x: r.x, y: r.y, w: r.width, h: r.height };
}, wahl);

/** Kontrast einer Schriftfarbe gegen JEDES Pixel einer Fläche — der
 *  schlimmste Rand zählt (1-%-Wert), nicht der Durchschnitt. Alles IN der
 *  Fläche wird unsichtbar (Knöpfe, Tupfer, Schrift), gemessen wird also die
 *  Glasfläche selbst über dem, was darunter liegt. */
const kontrast = async (pg: Page, flaeche: string, farbe: string) => {
  const kasten = await pg.evaluate((w: string) => {
    const el = [...document.querySelectorAll<HTMLElement>(w)].find(e => e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const st = document.createElement('style');
    st.id = 't582-leise';
    st.textContent = `${w} *{visibility:hidden!important} ${w}::before,${w}::after{visibility:hidden!important}`;
    document.head.appendChild(st);
    const r = el.getBoundingClientRect();
    /* 8 px nach innen: die Kante (Lichtkante, Radius) ist kein Grund der Schrift. */
    return { x: Math.max(0, r.left + 8), y: Math.max(0, r.top + 8),
             w: Math.min(innerWidth, r.right - 8) - Math.max(0, r.left + 8),
             h: Math.min(innerHeight, r.bottom - 8) - Math.max(0, r.top + 8) };
  }, flaeche);
  if (!kasten || kasten.w < 10 || kasten.h < 6) return null;
  await pg.waitForTimeout(80);
  const bild = await pg.screenshot({ clip: { x: kasten.x, y: kasten.y, width: kasten.w, height: kasten.h } });
  await pg.evaluate(() => document.getElementById('t582-leise')?.remove());
  return pg.evaluate(async ([b64, f]: string[]) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = (r: number, gg: number, bb: number) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(bb);
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cg = cv.getContext('2d')!; cg.fillStyle = f!; cg.fillRect(0, 0, 1, 1);
    const m = Array.from(cg.getImageData(0, 0, 1, 1).data);
    const Lt = L(m[0]!, m[1]!, m[2]!);
    const werte: number[] = [];
    for (let i = 0; i < d.length; i += 16) {
      const Lb = L(d[i]!, d[i + 1]!, d[i + 2]!);
      werte.push((Math.max(Lt, Lb) + 0.05) / (Math.min(Lt, Lb) + 0.05));
    }
    werte.sort((a, b) => a - b);
    return { schlimmster: +werte[Math.floor(werte.length * 0.01)]!.toFixed(2),
             mitte: +werte[Math.floor(werte.length / 2)]!.toFixed(2) };
  }, [bild.toString('base64'), farbe]);
};
const farbeVon = (pg: Page, wahl: string) => pg.evaluate((w: string) => {
  const el = [...document.querySelectorAll<HTMLElement>(w)].find(e => e.getBoundingClientRect().width > 0);
  return el ? getComputedStyle(el).color : 'rgb(128,128,128)';
}, wahl);

/** Jede SICHTBARE Fläche mit Unschärfe, mit Kasten und Wert. */
type Glas = { name: string; bf: string; x: number; y: number; w: number; h: number; uebergang: string; teil: boolean };
const glasZaehlen = (pg: Page) => pg.evaluate((): Glas[] => {
  const raus: Glas[] = [];
  for (const el of document.querySelectorAll<HTMLElement>('body *')) {
    for (const pseudo of [null, '::before', '::after']) {
      const s = getComputedStyle(el, pseudo);
      const bf = s.backdropFilter;
      if (!bf || bf === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue;
      if (!(r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth)) continue;
      const name = (el.id ? '#' + el.id : el.tagName.toLowerCase()) +
        (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (pseudo ?? '');
      /* Ein TEIL einer anderen Glasfläche (die Linse IN der Leiste) ist
         keine zweite Fläche, sondern ihr Zierstück (E639/E646). */
      const teil = !!el.parentElement?.closest('#handy-oben') && el.id === 'ho-pille';
      /* WAS DIE UNSCHÄRFE BEWEGT. `transition-property` ist ohne Angabe
         `all` mit 0 s — das bewegt nichts. Gezählt wird ein Übergang erst
         mit Dauer, und eine Animation, deren Bilder `backdrop-filter`
         tragen. */
      const eig = s.transitionProperty.split(',').map(x => x.trim());
      const dauer = s.transitionDuration.split(',').map(x => parseFloat(x) || 0);
      const bewegt = eig.filter((e, i) => (e === 'all' || /backdrop-filter/.test(e)) && (dauer[i % dauer.length] ?? 0) > 0);
      for (const a of el.getAnimations({ subtree: false })) {
        const k = (a.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
        if (k.some(f => 'backdropFilter' in f || 'webkitBackdropFilter' in f)) bewegt.push('@' + (a as CSSAnimation).animationName);
      }
      raus.push({ name, bf, x: r.x, y: r.y, w: r.width, h: r.height, teil, uebergang: bewegt.join(' ') });
    }
  }
  return raus;
});
const schneiden = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;

const MENUE = '<div class="grp">Glas</div>' +
  ['Umbenennen', 'Verschieben', 'Duplizieren', 'In den Papierkorb', 'Kopieren', 'Teilen']
    .map((t, i) => `<button><span class="mi">•</span>${t}<span class="ms">Strg+${i + 1}</span></button>`).join('');
const menueAuf = (pg: Page, x = 300, y = 180) => pg.evaluate(([h, x, y]) => {
  document.querySelectorAll('.menu,.menu-grund').forEach(e => e.remove());
  UI.menu(h, x, y);
}, [MENUE, x, y] as const);

/* ==========================================================================
 * §1 (Browser) · Die Rampe über einer harten Kante
 * ======================================================================== */
{
  const { ctx, pg } = await oeffnen(1000, 700, 'dark');
  await pg.evaluate(() => {
    const k = document.createElement('div');
    k.id = 't582-kante';
    k.style.cssText = 'position:fixed;inset:0;z-index:0;display:grid;grid-template-columns:1fr 1fr';
    k.innerHTML = '<div style="background:#fff"></div><div style="background:#000"></div>';
    document.body.appendChild(k);
    for (const w of ['#app', '#main', '#scroll', '#page', 'body'])
      (document.querySelector(w) as HTMLElement | null)?.style.setProperty('background', 'transparent');
  });
  await menueAuf(pg, 400, 200);
  await pg.waitForTimeout(450);
  const rampe = await pg.evaluate(async () => {
    const m = document.querySelector('.menu') as HTMLElement;
    const st = document.createElement('style');
    st.textContent = '.menu *{visibility:hidden!important}';
    document.head.appendChild(st);
    return m.getBoundingClientRect().toJSON();
  });
  await pg.waitForTimeout(80);
  const y = Math.round(rampe.y + rampe.height / 2);
  const bild = await pg.screenshot({ clip: { x: 420, y, width: 160, height: 1 } });
  const werte = await pg.evaluate(async (b64: string) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = 1;
    const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, 1).data;
    const r: number[] = []; for (let i = 0; i < d.length; i += 4) r.push(d[i]!);
    return r;
  }, bild.toString('base64'));
  const hoch = Math.max(...werte), tief = Math.min(...werte);
  const oben = tief + (hoch - tief) * 0.9, unten = tief + (hoch - tief) * 0.1;
  const a = werte.findIndex(v => v <= oben), b = werte.findIndex(v => v <= unten);
  const breite = a >= 0 && b >= 0 ? b - a : 0;
  console.log(`    Rampe über der Kante: ${breite} px (von ${hoch} nach ${tief}) · ${werte.filter((_, i) => i % 10 === 0).join(',')}`);
  p('Hinter einem Menü wird eine harte Schwarz-Weiss-Kante zur Rampe von mindestens 12 px (die Unschärfe ist echt)',
    breite >= 12, `Rampe ${breite} px`);
  await ctx.close();
}

/* ==========================================================================
 * §2 · Glas kommt als Scheibe, nicht als Nebel
 * ======================================================================== */
console.log('\n2 · Glas kommt als Scheibe');
/** Alles, was läuft, auf den ersten Augenblick stellen — und nachsehen. */
const ersterAugenblick = (pg: Page, wahl: string) => pg.evaluate((w: string) => {
  const el = document.querySelector(w) as HTMLElement | null;
  if (!el) return null;
  getComputedStyle(el).opacity;
  const eigene = el.getAnimations();
  const kinder = [...el.children].flatMap(k => k.getAnimations());
  for (const a of [...eigene, ...kinder]) { a.pause(); a.currentTime = 0; }
  const s = getComputedStyle(el);
  const erstes = el.firstElementChild as HTMLElement | null;
  return {
    bf: s.backdropFilter, deck: +s.opacity, form: s.transform, laeuft: eigene.length,
    nebel: eigene.some(a => (a.effect as KeyframeEffect).getKeyframes().some(k => 'opacity' in k && +(k['opacity'] as string) < 1)),
    inhalt: erstes ? +getComputedStyle(erstes).opacity : 1
  };
}, wahl);
for (const [wo, breite, hoehe] of [['Rechner', 1280, 900], ['Telefon', 390, 844]] as const) {
  const { ctx, pg } = await oeffnen(breite, hoehe, 'dark');
  await menueAuf(pg);
  const m = await ersterAugenblick(pg, '.menu');
  p(`${wo}: das Menü ist Glas`, !!m && m.bf !== 'none', JSON.stringify(m));
  p(`${wo}: es kommt an — im ersten Augenblick ist es verschoben (die Ankunft bleibt)`, !!m && m.laeuft > 0 && m.form !== 'none',
    JSON.stringify(m));
  p(`${wo}: die Scheibe ist vom ersten Bild an da (Deckkraft 1, keine opacity im Ankommen)`,
    !!m && m.deck === 1 && !m.nebel, JSON.stringify(m));
  p(`${wo}: der Inhalt blendet ein, nicht die Scheibe`, !!m && m.inhalt < 0.5, JSON.stringify(m));
  if (wo === 'Rechner') {
    await pg.evaluate(() => { document.querySelectorAll('.menu,.menu-grund').forEach(e => e.remove());
      (window as any).__t582 = Dialog.frage('Name der Seite', 'Physik'); });
    /* Seit E710 zeichnet die Frage den Dialog des Kits (eine Insel, einen
       Augenblick später); die Zusage gilt für ihn genauso. Ohne Inseln
       bleibt es der Finder. */
    const FRAGE = '.overlay :is(.finder, .ui-touch-dialog)';
    await pg.waitForSelector(FRAGE, { timeout: 5000 }).catch(() => {});
    const f = await ersterAugenblick(pg, FRAGE);
    p('Rechner: der Finder (Frage) kommt ebenso als Scheibe', !!f && f.bf !== 'none' && f.deck === 1 && !f.nebel && f.form !== 'none',
      JSON.stringify(f));
  }
  await ctx.close();
}

/* ==========================================================================
 * §3 · Die zwei schwebenden Werkzeugleisten sind Glas
 * ======================================================================== */
for (const thema of ['dark', 'light'] as const) {
  const wort = thema === 'light' ? 'hell' : 'dunkel';
  for (const [wo, breite, hoehe] of [['Rechner', 1280, 900], ['Telefon', 390, 844]] as const) {
    console.log(`\n3 · Der Dock im Dokument ist Glas (${wo}, ${wort})`);
    const { ctx, pg } = await oeffnen(breite, hoehe, thema);
    await dokument(pg);
    const soll = { bg: await marke(pg, '--bg-schwebend-dicht'), bf: await marke(pg, '--glas-blur') };
    const d = await stil(pg, DOCK);
    const werk = await stil(pg, `${DOCK} .blatt-werk`);
    p(`${wo}, ${wort}: der Dock trägt die Unschärfe \`--glas-blur\``, d?.bf === soll.bf, `ist ${d?.bf} · soll ${soll.bf}`);
    p(`${wo}, ${wort}: … und die dichte Fläche (er trägt Wörter)`, d?.bg === soll.bg, `ist ${d?.bg} · soll ${soll.bg}`);
    p(`${wo}, ${wort}: die Rollfläche darin deckt nicht ab (sonst wäre das Glas zugedeckt)`,
      !!werk && (await deckkraft(pg, werk.bg)) === 0, werk?.bg ?? 'keine Rollfläche');
    await muster(pg);
    const farbe = await farbeVon(pg, `${DOCK} .blatt-werk button:not(.on) .wort, ${DOCK} .blatt-werk button:not(.on)`);
    const k = await kontrast(pg, DOCK, farbe);
    if (k) console.log(`    Beschriftung ${farbe}: schlimmster ${k.schlimmster} : 1 · Mitte ${k.mitte} : 1`);
    p(`${wo}, ${wort}: die Beschriftung des Docks hält über dem schlimmsten Grund 4,5 : 1`,
      !!k && k.schlimmster >= 4.5, k ? `schlimmster ${k.schlimmster}` : 'nicht messbar');
    await ctx.close();
  }
}
{
  console.log('\n3 · Die schwebende Zeichenleiste ist Glas (unten, frei, links, rechts)');
  const { ctx, pg } = await oeffnen(1280, 900, 'dark');
  const soll = { bg: await marke(pg, '--bg-schwebend-dicht'), bf: await marke(pg, '--glas-blur') };
  for (const lage of ['unten', 'frei', 'links', 'rechts', 'oben']) {
    await blattSeite(pg, lage);
    const r = await stil(pg, `.blatt-reihe[data-lage="${lage}"]`);
    if (lage === 'oben') {
      p('Oben, am Blatt angesetzt (der Normalfall), bleibt die Leiste deckend — sie schwebt nicht',
        !!r && r.bf === 'none', JSON.stringify(r?.bf));
      continue;
    }
    p(`Lage „${lage}": Unschärfe und dichte Fläche`, !!r && r.bf === soll.bf && r.bg === soll.bg,
      `ist ${r?.bf} / ${r?.bg}`);
    if (lage === 'unten') {
      const vor = await pg.evaluate(() => {
        const el = document.querySelector('.blatt-reihe[data-lage="unten"]');
        return el ? getComputedStyle(el, '::before').display : 'fehlt';
      });
      p('Lage „unten": kein deckender Rollverlauf (`::before` in `--bg-card`) auf dem Glas', vor === 'none', vor);
      await muster(pg);
      const farbe = await farbeVon(pg, '.blatt-reihe[data-lage="unten"] .blatt-werk button:not(.on)');
      const k = await kontrast(pg, '.blatt-reihe[data-lage="unten"]', farbe);
      if (k) console.log(`    Zeichen ${farbe}: schlimmster ${k.schlimmster} : 1 · Mitte ${k.mitte} : 1`);
      p('Lage „unten": ihre Zeichen und Wörter halten über dem schlimmsten Grund 4,5 : 1',
        !!k && k.schlimmster >= 4.5, k ? `schlimmster ${k.schlimmster}` : 'nicht messbar');
      await pg.evaluate(() => document.getElementById('t582-muster')?.remove());
    }
  }
  await ctx.close();
}

/* ==========================================================================
 * §4 · Ein Schalter macht alles Glas deckend
 * ======================================================================== */
const SCHALTER: Array<[string, Wie]> = [
  ['weniger Transparenz (System)', { media: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] }],
  ['mehr Kontrast (System)', { media: [{ name: 'prefers-contrast', value: 'more' }] }],
  ['erzwungene Farben (System)', { erzwungen: true }],
  ['„Hoher Kontrast" (Redion)', { kontrast: true }],
  ['Schema „Starker Kontrast"', { schema: 'kontrast' }]
];
for (const [name, wie] of SCHALTER) {
  console.log(`\n4 · Deckend bei ${name}`);
  {
    const { ctx, pg } = await oeffnen(1280, 900, 'dark', wie);
    await dokument(pg);
    await menueAuf(pg);
    await pg.waitForTimeout(300);
    const m = await stil(pg, '.menu');
    const d = await stil(pg, DOCK);
    const blur = await marke(pg, '--glas-blur');
    p(`${name}: \`--glas-blur\` ist \`none\``, blur === 'none', blur);
    p(`${name}: das Menü ist deckend und scharf`, !!m && m.bf === 'none' && (await deckkraft(pg, m.bg)) === 1,
      JSON.stringify(m && { bf: m.bf, bg: m.bg }));
    p(`${name}: der Dock im Dokument ist deckend und scharf`, !!d && d.bf === 'none' && (await deckkraft(pg, d.bg)) === 1,
      JSON.stringify(d && { bf: d.bf, bg: d.bg }));
    await ctx.close();
  }
  {
    const { ctx, pg } = await oeffnen(390, 844, 'dark', wie);
    const n = await stil(pg, '#handy-oben');
    const l = await stil(pg, '#handy-oben #ho-pille');
    p(`${name}: die Telefonleiste ist deckend und scharf`, !!n && n.bf === 'none' && (await deckkraft(pg, n.bg)) === 1,
      JSON.stringify(n && { bf: n.bf, bg: n.bg }));
    p(`${name}: die Linse bricht nicht und ist eine volle Fläche`, !!l && l.bf === 'none' && (await deckkraft(pg, l.bg)) === 1,
      JSON.stringify(l && { bf: l.bf, bg: l.bg }));
    await ctx.close();
  }
}

/* ==========================================================================
 * §5 · „Starker Kontrast" ohne Glas — gar keines
 * ======================================================================== */
console.log('\n5 · Starker Kontrast: kein Glas, und der Reiter bleibt markiert');
{
  const { ctx, pg } = await oeffnen(390, 844, 'dark', { schema: 'kontrast' });
  const schema = await pg.evaluate(() => document.documentElement.dataset['schema'] ?? '');
  p('Das Schema steht am Wurzelelement (`data-schema`), damit das Blatt es fragen kann', schema === 'kontrast', schema);
  await pg.evaluate(() => {
    /* Die Zierstücke gibt es nur an ihren Orten (Ordnerblatt, KI-Kopf) —
       hier als Proben mit genau ihren Klassen. */
    const a = document.createElement('span'); a.className = 'ru-fach-art'; a.textContent = 'PDF';
    a.style.cssText = 'position:fixed;left:20px;top:200px';
    document.body.appendChild(a);
    const ai = document.createElement('div'); ai.id = 'ai';
    ai.innerHTML = '<div class="ai-head"><div class="rmo-orb-karte"></div></div>';
    ai.style.cssText = 'position:fixed;left:20px;top:260px;display:block';
    document.body.appendChild(ai);
  });
  await menueAuf(pg, 0, 0);
  await pg.waitForTimeout(400);
  const g = await glasZaehlen(pg);
  p('Mit offenem Blatt, Leiste, Linse und beiden Zierstücken: keine einzige Fläche mit Unschärfe',
    g.length === 0, g.map(x => `${x.name}: ${x.bf}`).join(' · '));
  await pg.evaluate(() => document.querySelectorAll('.menu,.menu-grund').forEach(e => e.remove()));
  const n = await stil(pg, '#handy-oben');
  const l = await stil(pg, '#handy-oben #ho-pille');
  const hell = (c: number[]) => 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
  const ln = n ? hell(await farbwert(pg, n.bg)) : 0, ll = l ? hell(await farbwert(pg, l.bg)) : 0;
  const ring = !!l && /inset/.test(l.schatten);
  p('Der gewählte Reiter bleibt sichtbar markiert: eine volle Fläche, die sich abhebt, mit Rand',
    !!l && l.sicht && Math.abs(ll - ln) >= 8 && ring, `Leiste ${n?.bg} · Linse ${l?.bg} · Schatten ${l?.schatten}`);
  await pg.evaluate(() => { Store.setMeta('rundgangGesehen', false); Rundgang.willkommen(true); });
  await pg.waitForTimeout(400);
  const w = await stil(pg, '#rg-willkommen');
  p('Auch der Schleier hinter dem Willkommen ist ohne Unschärfe', !!w && w.bf === 'none', w?.bf);
  await ctx.close();
}

/* ==========================================================================
 * §6 · Nie Glas auf Glas — und was meldet, liegt nicht auf einem Werkzeug
 * ======================================================================== */
console.log('\n6 · Ein Stapel am unteren Rand');
const stapel = async (pg: Page, szene: string) => {
  await pg.evaluate(() => {
    Lader.schweben({ art: 'presse', text: 'Seite 17 von 30 wird vorbereitet …' });
    UI.toast('Gespeichert — Markierung auf Seite 2', 60000);
  });
  await pg.waitForTimeout(700);
  /* ERST WENN SIE HEREIN SIND (E714). Die Frage unten galt nach 700 ms
     WANDZEIT. Über dem Zeichenblatt setzt SwiftShader (der GPU-Weg oben)
     das erste Bild mit Glas manchmal erst nach rund 500 ms zusammen — die
     Probe zählte 3 bis 4 Bilder in 700 ms, und das Hereinkommen von Toast
     und Lader hatte erst 17 bis 33 ms seiner Zeit hinter sich: Deckkraft
     0,06, einmal 0. Dann war `melder` leer, und die Zeile rot — in rund zwei
     von vier Läufen, je nachdem, was der Rechner daneben tat.
     Gewartet wird jetzt, bis ihre endlichen Animationen fertig sind (die
     Klumpen im Lader kreisen ohne Ende und zählen nicht), höchstens 8 s.
     Die Zusage „in 700 ms da" bleibt — gemessen auf der Uhr der Animation
     selbst, nicht auf der des Prüfrechners: jede, die nach 700 ms noch
     läuft, endet samt Verzögerung bei höchstens 700 ms. Läuft keine mehr,
     wird nicht gewartet, und die Frage unten gilt wie vorher. Was gar nicht
     erst erscheint (kein `.show`, kein Lader), bleibt dort rot.
     UND DER ZUSTAND STEHT BEI 700 MS (E714, Durchsicht). Die Frage unten
     kommt jetzt erst nach dem Warten — ein Toast, dem `.show` erst NACH
     700 ms gesetzt würde (eine Verzögerung im Code, während der Lader über
     dem Zeichenblatt noch hereinkommt), wäre dort grün geworden, wo die alte
     Zeile rot war. Deshalb wird hier, VOR dem Warten, festgehalten, ob der
     Toast `.show` trägt und der Lader im Dokument hängt. Beides setzt der
     Code sofort (`UI.toast`, `Lader.schweben`), ohne auf ein Bild zu warten
     — also hängt es nicht an SwiftShader, und es bleibt die Zusage von
     vorher: in 700 ms da. */
  const herein = await pg.evaluate(async () => {
    const zeigt = !!document.getElementById('toast')?.classList.contains('show');
    const wer = [document.getElementById('toast'), document.querySelector('.ru-lader-schwebt')]
      .filter((e): e is HTMLElement => !!e);
    const endlich = wer.flatMap(e => e.getAnimations({ subtree: true }))
      .filter(a => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)));
    const laengste = Math.max(0, ...endlich.map(a => Math.round(Number(a.effect?.getComputedTiming().endTime))));
    const t0 = performance.now();
    await Promise.race([Promise.all(endlich.map(a => a.finished.catch(() => null))),
      new Promise(f => setTimeout(f, 8000))]);
    return { zeigt, elemente: wer.length, animationen: endlich.length, laengste,
             offen: endlich.filter(a => a.playState !== 'finished').length,
             gewartet: Math.round(performance.now() - t0) };
  });
  p(`${szene}: Toast und Lader kommen auf ihrer eigenen Uhr in höchstens 700 ms herein`,
    herein.zeigt && herein.elemente === 2 && herein.laengste <= 700 && herein.offen === 0,
    JSON.stringify(herein));
  const k = await pg.evaluate(() => {
    const box = (w: string) => [...document.querySelectorAll<HTMLElement>(w)]
      .filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0; })
      .map(e => { const r = e.getBoundingClientRect(); return { name: w, x: r.x, y: r.y, w: r.width, h: r.height }; });
    return { werkzeuge: [...box('.blatt-reihe[data-lage="unten"]'), ...box('body[data-dokument="an"] .document-stage[data-aktiv]>.blatt-huelle>.blatt-reihe'),
                         ...box('.document-ink-history'), ...box('#handy-oben')],
             melder: [...box('#toast.show'), ...box('.ru-lader-schwebt')], hoehe: innerHeight };
  });
  p(`${szene}: Toast und Lader sind da`, k.melder.length >= 2, JSON.stringify(k.melder));
  const auf = k.melder.flatMap(m => k.werkzeuge.filter(w => schneiden(m, w)).map(w => `${m.name} auf ${w.name}`));
  p(`${szene}: nichts, was meldet, liegt auf einem Werkzeug`, auf.length === 0, auf.join(' · '));
  const unter = k.melder.flatMap((m, i) => k.melder.slice(i + 1).filter(n => schneiden(m, n)).map(n => `${m.name} auf ${n.name}`));
  p(`${szene}: und nichts, was meldet, auf einem anderen`, unter.length === 0, unter.join(' · '));
  p(`${szene}: alles bleibt im Bild`, k.melder.every(m => m.y >= 0 && m.y + m.h <= k.hoehe), JSON.stringify(k.melder));
  const g = (await glasZaehlen(pg)).filter(x => !x.teil);
  const doppelt = g.flatMap((a, i) => g.slice(i + 1).filter(b => schneiden(a, b)).map(b => `${a.name} × ${b.name}`));
  p(`${szene}: keine Glasfläche liegt auf einer anderen`, doppelt.length === 0, doppelt.join(' · '));
};
{
  const { ctx, pg } = await oeffnen(1280, 900, 'dark');
  await blattSeite(pg, 'unten');
  await stapel(pg, 'Rechner, Zeichenleiste unten');
  await ctx.close();
}
{
  const { ctx, pg } = await oeffnen(1280, 900, 'dark');
  await dokument(pg);
  await stapel(pg, 'Rechner, Dokument');
  await ctx.close();
}
{
  const { ctx, pg } = await oeffnen(390, 844, 'dark');
  await dokument(pg);
  await stapel(pg, 'Telefon, Dokument');
  await ctx.close();
}
{
  const { ctx, pg } = await oeffnen(390, 844, 'light');
  await blattSeite(pg, 'unten');
  await stapel(pg, 'Telefon, Zeichenleiste unten');
  await ctx.close();
}
{
  /* EIN OFFENES BLATT IST AUCH EIN WERKZEUG. Beim Einlesen einer PDF lag
     die Karte des Laders auf den Einträgen des Blatts „Seite" (z 901 über
     600). Der Lader hat `pointer-events:none` — `elementFromPoint` sähe ihn
     nicht —, also zählt die Schichtung: er muss UNTER dem Blatt liegen. */
  const { ctx, pg } = await oeffnen(390, 844, 'dark');
  await pg.evaluate(() => { Lader.schweben({ art: 'presse', text: 'Seite 6 von 30 wird vorbereitet …' }); });
  await menueAuf(pg, 0, 0);
  await pg.waitForTimeout(450);
  const z = await pg.evaluate(() => {
    const l = document.querySelector<HTMLElement>('.ru-lader-schwebt');
    const m = document.querySelector<HTMLElement>('.menu.blatt');
    const zahl = (e: HTMLElement | null) => (e ? +getComputedStyle(e).zIndex || 0 : -1);
    const r = (e: HTMLElement | null) => e?.getBoundingClientRect();
    const a = r(l), b = r(m);
    const schneidet = !!a && !!b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { lader: zahl(l), blatt: zahl(m), schneidet };
  });
  p('Telefon, Menü-Blatt offen: der Lader liegt nicht AUF dem Blatt (darunter oder daneben)',
    z.blatt > 0 && (!z.schneidet || z.lader < z.blatt), JSON.stringify(z));
  await ctx.close();
}

/* ==========================================================================
 * §7 · Grenzen, gemessen (messungen.md §75)
 * ======================================================================== */
console.log('\n7 · Grenzen für Glas am Telefon');
{
  const { ctx, pg } = await oeffnen(390, 844, 'dark');
  const bild = 390 * 844;
  const flaeche = (g: Glas[]) => g.filter(x => !x.teil).reduce((s, x) => s + x.w * x.h, 0) / bild;
  const zeige = (g: Glas[]) => g.map(x => `${x.name} ${Math.round(x.w)}×${Math.round(x.h)}`).join(' | ');
  const alleSzenen: Glas[] = [];
  const ruhe = async (szene: string) => {
    const g = await glasZaehlen(pg);
    alleSzenen.push(...g);
    const n = g.filter(x => !x.teil).length, a = flaeche(g);
    console.log(`    ${szene}: ${n} Flächen, ${(a * 100).toFixed(1)} % · ${zeige(g)}`);
    p(`${szene}: höchstens drei Glasflächen und ein Viertel des Bildschirms`, n <= 3 && a <= 0.25,
      `${n} Flächen, ${(a * 100).toFixed(1)} %`);
  };
  await ruhe('Leerlauf (Textseite)');
  await blattSeite(pg, 'unten');
  await ruhe('Zeichenblatt, Leiste unten');
  await dokument(pg);
  await ruhe('Dokument mit Dock');
  await pg.evaluate(async () => { document.body.removeAttribute('data-dokument'); App.oeffne(App.aktuelleSeite()); await new Promise(f => setTimeout(f, 300)); });
  await menueAuf(pg, 0, 0);
  await pg.waitForTimeout(450);
  {
    const g = await glasZaehlen(pg);
    alleSzenen.push(...g);
    const a = flaeche(g);
    console.log(`    Menü offen: ${(a * 100).toFixed(1)} % · ${zeige(g)}`);
    p('Mit offenem Menü-Blatt höchstens 60 % des Bildschirms unter Glas', a <= 0.6, `${(a * 100).toFixed(1)} %`);
  }
  await pg.evaluate(() => { document.querySelectorAll('.menu,.menu-grund').forEach(e => e.remove());
    Store.setMeta('rundgangGesehen', false); Rundgang.willkommen(true); });
  await pg.waitForTimeout(450);
  const w = await glasZaehlen(pg);
  alleSzenen.push(...w);
  const gross = w.filter(x => x.w * x.h >= 0.9 * bild);
  console.log(`    Willkommen: ${zeige(w)}`);
  p('Nie eine Unschärfe über 90 % des Telefonbildschirms (der Schleier des Willkommens dimmt nur)',
    gross.length === 0, zeige(gross));
  const bewegt = alleSzenen.filter(x => x.uebergang !== '');
  p('Keine Glasfläche überblendet ihre Unschärfe (kein `transition: all`, kein `backdrop-filter` im Übergang)',
    bewegt.length === 0, bewegt.map(x => `${x.name}: ${x.uebergang}`).join(' · '));
  const radius = Math.max(0, ...[...(await marke(pg, '--glas-blur')).matchAll(/blur\(([\d.]+)px\)/g)].map(m => +(m[1] ?? 0)));
  p('Die Unschärfe ist die eine Marke und höchstens 20 px (gemessen: 40 px kostet ein Viertel mehr)', radius > 0 && radius <= 20,
    `${radius} px`);
  await ctx.close();
}

/* ==========================================================================
 * §8 · Eine Lichtkante für alles Glas
 * ======================================================================== */
for (const thema of ['dark', 'light'] as const) {
  const wort = thema === 'light' ? 'hell' : 'dunkel';
  console.log(`\n8 · Die Lichtkante (${wort})`);
  {
    const { ctx, pg } = await oeffnen(1280, 900, thema);
    const kante = await marke(pg, '--glas-kante');
    p(`\`--glas-kante\` ist gesetzt (${wort}): Licht oben, Rückwurf unten, Haarlinie`,
      (kante.match(/inset/g) ?? []).length >= 3, kante);
    await dokument(pg);
    await menueAuf(pg);
    await pg.evaluate(() => {
      const a = document.createElement('div'); a.className = 'auswahlleiste'; a.innerHTML = '<button>B</button>';
      a.style.cssText = 'position:fixed;left:600px;top:120px'; document.body.appendChild(a);
    });
    await pg.waitForTimeout(300);
    for (const [was, w] of [['Menü', '.menu'], ['Auswahlleiste', '.auswahlleiste'], ['Dock', DOCK]] as const) {
      const s = await stil(pg, w);
      p(`${was} trägt die Lichtkante (${wort})`, !!s && kante !== 'none' && s.schatten.startsWith(kante),
        `${s?.schatten}`);
    }
    await ctx.close();
  }
  {
    const { ctx, pg } = await oeffnen(390, 844, thema);
    const kante = await marke(pg, '--glas-kante');
    const s = await stil(pg, '#handy-oben');
    p(`Die Telefonleiste trägt dieselbe Lichtkante (${wort})`, !!s && kante !== 'none' && s.schatten.startsWith(kante),
      `${s?.schatten}`);
    await ctx.close();
  }
}

/* ==========================================================================
 * §9 + §10 · Zehn Schemata: das Glas folgt, und es bleibt lesbar
 * ======================================================================== */
const SCHEMATA: string[] = await (async () => {
  const { ctx, pg } = await oeffnen(800, 600, 'dark');
  const ids = await pg.evaluate(() => (Aussehen.SCHEMATA ?? []).map((s: { id: string }) => s.id));
  await ctx.close();
  return ids.length ? ids : ['standard', 'hell', 'nacht', 'wald', 'sand', 'papier', 'kontrast', 'rose', 'touchkit-hell', 'touchkit-dunkel'];
})();
p('Es sind zehn Schemata', SCHEMATA.length === 10, SCHEMATA.join(', '));

/** KONTRAST ZWEIER FARBEN, wie der Browser sie malt (ohne Glas). */
const zweiFarben = (pg: Page, vorne: string, hinten: string) => pg.evaluate(([a, b]: string[]) => {
  const px = (c: string) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const g = cv.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, 1, 1); g.fillStyle = c; g.fillRect(0, 0, 1, 1);
    return Array.from(g.getImageData(0, 0, 1, 1).data); };
  const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c: number[]) => 0.2126 * lin(c[0]!) + 0.7152 * lin(c[1]!) + 0.0722 * lin(c[2]!);
  const x = L(px(a!)), y = L(px(b!));
  return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2);
}, [vorne, hinten]);

/* DIE FARBE DES SCHEMAS IST NICHT DAS GLAS. Wo eine Schrift schon auf der
   VOLLEN Karte ihres Schemas unter 5 : 1 bleibt, hat Glas keinen Platz
   mehr, ohne unter 4,5 zu fallen — das ist eine Farbfrage und gehört dem
   Farbzweig (claude/bessere-farben), nicht der Dichte. Diese Liste nennt
   jede solche Stelle mit ihrer Lücke; dort darf das Glas höchstens 0,8
   nehmen. Die Liste darf nur schrumpfen: ein Eintrag, den keine Messung
   mehr braucht, macht den Lauf rot. */
const SCHEMAFARBE: Record<string, string> = {
  /* Hier stand `sand: 'L226: --text-dim #66655f auf der Sand-Karte #efe6d6'`.
     Seit E705 hat Sands stille Schrift auf der Karte 5,31 : 1; der Eintrag
     wurde nicht mehr gebraucht und ist gestrichen (beim Zusammenführen von
     E703 mit E705, L226 Punkt 1). */
};
const gebraucht = new Set<string>();
const lesbar = async (pg: Page, id: string, was: string, k: { schlimmster: number; mitte: number } | null, farbe: string) => {
  const opak = await zweiFarben(pg, farbe, await marke(pg, '--bg-card'));
  console.log(`    ${id} · ${was} ${farbe}: schlimmster ${k?.schlimmster ?? '–'} · Mitte ${k?.mitte ?? '–'} · auf voller Karte ${opak}`);
  if (SCHEMAFARBE[id] && opak < 5) {
    gebraucht.add(id);
    p(`${id}: ${was} — schon auf der vollen Karte nur ${opak} : 1 (${SCHEMAFARBE[id]}); das Glas nimmt höchstens 0,8`,
      !!k && k.schlimmster >= opak - 0.8, k ? `schlimmster ${k.schlimmster} · Mitte ${k.mitte} · voll ${opak}` : 'nicht messbar');
    return;
  }
  p(`${id}: ${was} 4,5 : 1 über dem schlimmsten Grund`, !!k && k.schlimmster >= 4.5,
    k ? `schlimmster ${k.schlimmster} · Mitte ${k.mitte} · voll ${opak}` : 'nicht messbar');
};
{
  console.log('\n9 + 10 · Am Rechner: leichtes Glas, Menü und Dock in allen zehn Schemata');
  const { ctx, pg } = await oeffnen(1280, 900, 'dark');
  await dokument(pg);
  await muster(pg);
  await pg.evaluate(() => {
    /* DAS LEICHTE GLAS MIT ZEICHEN (L221): `.rb.glas` ist das Rezept aus §16,
       hier mit einem gezeichneten Zeichen, wie Redion es malt. */
    const b = document.createElement('button');
    b.className = 'rb glas zeichen'; b.id = 't582-leicht';
    b.style.cssText = 'position:fixed;left:470px;top:300px;width:340px;height:120px;z-index:950';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 12h16" stroke="currentColor" stroke-width="2"/></svg>';
    document.body.appendChild(b);
  });
  for (const id of SCHEMATA) {
    await pg.evaluate((id: string) => Aussehen.setzen({ schema: id }), id);
    await pg.waitForTimeout(120);
    const glasAn = (await marke(pg, '--glas-blur')) !== 'none';
    const leicht = await farbwert(pg, await marke(pg, '--bg-schwebend'));
    const karte = await farbwert(pg, await marke(pg, '--bg-card'));
    const gleichTon = leicht.slice(0, 3).every((v, i) => Math.abs(v - (karte[i] ?? 0)) <= 2);
    const a = (leicht[3] ?? 255) / 255;
    p(`${id}: das leichte Glas ist die Karte des Schemas, durchscheinend${glasAn ? '' : ' (hier deckend: kein Glas)'}`,
      gleichTon && (glasAn ? a > 0.6 && a < 0.8 : a === 1), `leicht ${leicht.join(',')} · Karte ${karte.join(',')}`);
    const zeichen = await farbeVon(pg, '#t582-leicht');
    const kl = await kontrast(pg, '#t582-leicht', zeichen);
    p(`${id}: Zeichen auf leichtem Glas halten 3 : 1 über dem schlimmsten Grund (L221)`, !!kl && kl.schlimmster >= 3,
      kl ? `schlimmster ${kl.schlimmster} · Mitte ${kl.mitte}` : 'nicht messbar');
    await menueAuf(pg);
    await pg.waitForTimeout(350);
    for (const [was, w] of [['Schrift', '.menu button'], ['Gruppentitel', '.menu .grp'], ['Kürzel', '.menu .ms']] as const) {
      const f = await farbeVon(pg, w);
      await lesbar(pg, id, `Menü, ${was},`, await kontrast(pg, '.menu', f), f);
    }
    await pg.evaluate(() => document.querySelectorAll('.menu,.menu-grund').forEach(e => e.remove()));
    const fd = await farbeVon(pg, `${DOCK} .blatt-werk button:not(.on) .wort, ${DOCK} .blatt-werk button:not(.on)`);
    await lesbar(pg, id, 'Dock, Beschriftung', await kontrast(pg, DOCK, fd), fd);
  }
  await ctx.close();
}
{
  console.log('\n10 · Am Telefon: die untere Leiste in allen zehn Schemata');
  const { ctx, pg } = await oeffnen(390, 844, 'dark');
  await muster(pg);
  for (const id of SCHEMATA) {
    await pg.evaluate((id: string) => Aussehen.setzen({ schema: id }), id);
    await pg.waitForTimeout(120);
    const f = await farbeVon(pg, '#handy-oben > button:not(.an):not([aria-current="page"])');
    await lesbar(pg, id, 'Telefonleiste, Namen', await kontrast(pg, '#handy-oben', f), f);
  }
  await ctx.close();
}
{
  const ueber = Object.keys(SCHEMAFARBE).filter(id => !gebraucht.has(id));
  p('Die Liste der Schemafarben ist so kurz wie möglich (jeder Eintrag wird noch gebraucht)', ueber.length === 0,
    'nicht mehr gebraucht, bitte streichen: ' + ueber.join(', '));
}

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
