/* ============================================================================
 * test576 — EIN Glas statt vier (E695)
 * ----------------------------------------------------------------------------
 * Redur, 27. September 2026: „Weiter an die animationen übergangen glass
 * efeck usw alles verbessern".
 *
 * GEMESSEN VOR DEM BAUEN (messungen.md §69). §16 hat ein Rezept für
 * schwebende Flächen — `--bg-schwebend`, `--glas-blur`, `--glas-rand` —, und
 * es sass auf genau einer Klasse (`.rb.glas`). Daneben standen drei andere:
 *
 *   Menüs, Finder, Auswahlleiste   88 % deckend + blur(8px)  — kaum Glas
 *   untere Leiste am Telefon       blur(20px) saturate(1.6)
 *   PDF-Werkzeugleiste             blur(8px), nur unter @supports(unpräfixiert)
 *
 * Am Rechner war im Leerlauf KEIN EINZIGES Element sichtbar verwischt. Und
 * zwei Stellen setzten `backdrop-filter` ohne den Zwilling
 * `-webkit-backdrop-filter` — Safari auf dem iPhone las bis Fassung 18 nur
 * den Präfix, dort gab es an diesen Stellen gar kein Glas. Das iPhone ist
 * das Zielgerät (§37).
 *
 * WAS DIESER LAUF HÄLT
 *   §1  Jedes `backdrop-filter` hat im SELBEN Block seinen Zwilling
 *       `-webkit-backdrop-filter` mit demselben Wert (iPhone).
 *   §2  Glas der Oberfläche kommt aus den Marken: `var(--glas-blur)`,
 *       `var(--schleier-blur)` oder `none`. Was davon abweicht, ist ein
 *       ZIERSTÜCK mit Namen und Grund in der Liste unten — und die Liste darf
 *       nur schrumpfen.
 *   §3  Kein durchscheinendes Glas ohne Unschärfe: jede Stelle mit
 *       `var(--glas-blur)` steht unter einem `@supports`, das den Präfix
 *       mitfragt. Wo es keine Unschärfe gibt, bleibt die Fläche deckend —
 *       72 % Deckkraft ohne Weichzeichner ist kein Glas, sondern ein Muster.
 *   §4  Ein offenes Menü IST das Glas aus §16: dieselbe Unschärfe
 *       (`--glas-blur`) wie jede schwebende Leiste, und die DICHTE Fläche
 *       (`--bg-schwebend-dicht`), weil es Schrift trägt — im Hell- UND im
 *       Dunkelmodus. Die Regel dahinter: Fläche mit Zeichen leicht, Fläche
 *       mit Schrift dicht; die Dichte ist aus §5 gerechnet, nicht geschätzt.
 *   §5  Und es bleibt lesbar — AUCH die stille Schrift (Gruppentitel,
 *       Kürzel): der Kontrast, gemessen an den
 *       GERENDERTEN Pixeln über grossen weissen, schwarzen, roten und blauen
 *       Flächen, liegt überall bei 4,5 oder mehr (§38). Gemessen wird das
 *       Bild, nicht die Farbwerte — eine Rechnung über `rgba` kennt die
 *       Unschärfe nicht (L206).
 *   §6  Am Telefon trägt die untere Leiste dieselbe Unschärfe, und ihre
 *       Beschriftung bleibt über demselben Muster lesbar.
 *   §7  Wer weniger Transparenz will, bekommt deckende Flächen: kein
 *       Weichzeichner, volle Deckkraft (§38, `prefers-reduced-transparency`).
 *
 *   node pruefungen/alle.mts 576
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const STIL = path.join(WURZEL, 'quell/schale/stil');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* ==========================================================================
 * Ein kleiner Leser für Stilblätter.
 * --------------------------------------------------------------------------
 * Er muss wissen, in WELCHEM Block eine Deklaration steht — sonst liesse
 * sich weder „derselbe Block" (§1) noch „unter @supports" (§3) prüfen. Ein
 * `grep` nach `backdrop-filter` fände auch die Bedingung in
 * `@supports(backdrop-filter:blur(8px))` und hielte sie für eine
 * Deklaration (das hat die erste Zählung getan, messungen.md §69).
 * ======================================================================== */
type Dekl = { datei: string; kontext: string[]; eigenschaft: string; wert: string };
const lesen = (datei: string, roh: string): Dekl[] => {
  const css = roh
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/url\(\s*["']?data:[^)]*\)/g, 'url(data)')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
  const raus: Dekl[] = [];
  const stapel: string[] = [];
  let ab = 0;
  const nimm = (stueck: string) => {
    const t = stueck.trim();
    const i = t.indexOf(':');
    if (!t || i < 1 || t.includes('{')) return;
    raus.push({ datei, kontext: stapel.slice(), eigenschaft: t.slice(0, i).trim().toLowerCase(),
                wert: t.slice(i + 1).replace(/!important/g, '').replace(/\s+/g, ' ').trim() });
  };
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { stapel.push(css.slice(ab, i).replace(/\s+/g, ' ').trim()); ab = i + 1; }
    else if (c === ';') { nimm(css.slice(ab, i)); ab = i + 1; }
    else if (c === '}') { nimm(css.slice(ab, i)); stapel.pop(); ab = i + 1; }
  }
  return raus;
};
const alle: Dekl[] = fs.readdirSync(STIL).filter(f => f.endsWith('.css'))
  .flatMap(f => lesen(f, fs.readFileSync(path.join(STIL, f), 'utf8')));
const glas = alle.filter(d => d.eigenschaft === 'backdrop-filter');
const ort = (d: Dekl) => `${d.datei}: ${d.kontext[d.kontext.length - 1] ?? '?'}`.slice(0, 110);

/* ==========================================================================
 * §1 · Jedes Glas hat seinen Zwilling fürs iPhone
 * ======================================================================== */
console.log('\n1 · Jedes Glas hat seinen -webkit-Zwilling');
p('Der Leser findet Glas in den Stilblättern', glas.length >= 8, `${glas.length} Stellen`);
const ohneZwilling = glas.filter(d => !alle.some(w =>
  w.datei === d.datei && w.eigenschaft === '-webkit-backdrop-filter' &&
  w.kontext.join('|') === d.kontext.join('|') && w.wert === d.wert));
p('Jedes `backdrop-filter` hat im selben Block `-webkit-backdrop-filter` mit demselben Wert',
  ohneZwilling.length === 0, ohneZwilling.map(d => `${ort(d)} → ${d.wert}`).join(' · '));

/* ==========================================================================
 * §2 · Glas der Oberfläche kommt aus den Marken
 * --------------------------------------------------------------------------
 * DIE ZIERSTÜCKE. Sie sind kein Glas der Oberfläche, sondern gebaute
 * Einzelstücke mit eigenem Grund. Jeder Eintrag nennt Stelle, Wert und
 * Entscheidung. Die Liste darf SCHRUMPFEN; wer etwas dazuschreibt, schreibt
 * eine zweite Glassorte und braucht dafür eine Entscheidung (§34).
 * ======================================================================== */
console.log('\n2 · Glas kommt aus den Marken');
const MARKEN = new Set(['none', 'var(--glas-blur)', 'var(--schleier-blur)']);
const ZIER: Array<{ stelle: string; wert: string; grund: string }> = [
  { stelle: '#ho-pille', wert: 'saturate(1.5) brightness(1.08)',
    grund: 'die Linse der unteren Leiste in Ruhe (E639) — sie bricht, statt zu verwischen' },
  { stelle: '#ho-pille', wert: 'url(#ru-linse-fahrt) saturate(1.55) brightness(1.13)',
    grund: 'dieselbe Linse in Fahrt (E646), mit dem SVG-Verzerrer' },
  { stelle: '.ru-fach-art', wert: 'blur(4px)',
    grund: 'das Etikett auf dem Ordnerblatt — ein Aufkleber, keine schwebende Fläche' },
  { stelle: '.rmo-orb-karte', wert: 'blur(8px)',
    grund: 'die Glaskugel neben „Redion KI" (ANIMATIONEN-ZUORDNUNG.md) — ein Schmuckstück' }
];
const istZier = (d: Dekl) => ZIER.some(z =>
  z.wert === d.wert && d.kontext.some(k => k.includes(z.stelle)));
const fremd = glas.filter(d => !MARKEN.has(d.wert) && !istZier(d));
p('Jedes Glas der Oberfläche benutzt eine Marke oder steht als Zierstück in der Liste',
  fremd.length === 0, fremd.map(d => `${ort(d)} → ${d.wert}`).join(' · '));
const unbenutzt = ZIER.filter(z => !glas.some(d => d.wert === z.wert && d.kontext.some(k => k.includes(z.stelle))));
p('Und kein Zierstück steht nur noch auf dem Papier (die Liste schrumpft mit)',
  unbenutzt.length === 0, unbenutzt.map(z => `${z.stelle}: ${z.wert}`).join(' · '));

/* ==========================================================================
 * §3 · Kein durchscheinendes Glas ohne Unschärfe
 * ======================================================================== */
console.log('\n3 · Glas nur, wo es Unschärfe gibt');
const rezept = glas.filter(d => d.wert === 'var(--glas-blur)');
p('Das Rezept wird an mehr als einer Stelle benutzt', rezept.length >= 3, `${rezept.length} Stellen`);
const ungeschuetzt = rezept.filter(d =>
  !d.kontext.some(k => /^@supports/.test(k) && /-webkit-backdrop-filter/.test(k) && /(^|[^-])backdrop-filter/.test(k)));
p('Jede Stelle mit `--glas-blur` steht unter `@supports`, das auch den Präfix fragt',
  ungeschuetzt.length === 0, ungeschuetzt.map(ort).join(' · '));

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
const browser = await chromium.launch();

/** Die App öffnen, im gewünschten Modus, mit einem MUSTER hinter der Oberfläche.
 *
 *  DAS MUSTER IST DER SCHLIMMSTE FALL, NICHT DER SCHÖNSTE. Grosse, harte
 *  Flächen in Weiss, Schwarz, Rot und Blau — breiter als die Unschärfe, damit
 *  sie sie NICHT zu einem mittleren Grau verrührt. Über feinen Streifen wäre
 *  jedes Glas lesbar; über einer schwarzen Fläche im Hellmodus nicht jedes. */
const oeffnen = async (breite: number, hoehe: number, thema: 'light' | 'dark', weniger = false) => {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe }, colorScheme: thema });
  const pg = await ctx.newPage();
  if (weniger) {
    const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  }
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page'));
  await pg.evaluate(async (t: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    /* DAS THEMA ÜBER DIE APP, NICHT ÜBER DAS ATTRIBUT. Der erste Anlauf
       setzte `data-theme` von Hand — und `Aussehen` setzte es kurz danach
       auf das gespeicherte Schema zurück (`aussehen.ts:113`). Hell und
       dunkel lieferten daraufhin Ziffer für Ziffer dieselben Kontraste: es
       war beide Male dunkel. `App.theme` setzt Attribut, Schema und Merker
       zusammen. */
    App.theme(t);
    const s = Store.addPage(null, { text: 'Glas' });
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 700));
    document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
    const muster = document.createElement('div');
    muster.id = 't576-muster';
    muster.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;display:grid;' +
      'grid-template-columns:repeat(4,1fr);grid-auto-rows:120px;';
    for (let i = 0; i < 64; i++) {
      const z = document.createElement('div');
      z.style.background = ['#ffffff', '#000000', '#e02020', '#1f5cff'][(i + Math.floor(i / 4)) % 4]!;
      muster.appendChild(z);
    }
    document.body.appendChild(muster);
    /* Alles, was sonst davorliegt, durchsichtig — das Muster soll das sein,
       was UNTER dem Glas liegt, nicht die Seite. */
    for (const s2 of ['#app', '#main', '#scroll', '#page', 'body']) {
      const el = document.querySelector<HTMLElement>(s2);
      if (el) el.style.background = 'transparent';
    }
  }, thema);
  await pg.waitForTimeout(200);
  const gilt = await pg.evaluate(() => document.documentElement.dataset['theme']);
  if (gilt !== thema) console.log(`    ! Thema gilt nicht: gewünscht ${thema}, ist ${gilt}`);
  return { ctx, pg };
};

/** EINE FARBE, WIE DER BROWSER SIE MALT — als [r, g, b, a] mit 0…255.
 *
 *  Nicht per Muster aus dem Text gelesen: `color-mix()` liefert
 *  `color(srgb 0.97 0.97 0.96 / 0.88)`, nicht `rgba(…)`. Der erste Anlauf
 *  dieses Laufs las daraus „Deckkraft 1" — bei einem Menü, das 0,88 hat.
 *  Eine 1×1-Leinwand rechnet jede Schreibweise so um, wie sie gemalt würde. */
const farbwert = (pg: Page, css: string) => pg.evaluate((c: string) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = c; g.fillRect(0, 0, 1, 1);
  return Array.from(g.getImageData(0, 0, 1, 1).data);
}, css);
const deckkraft = async (pg: Page, css: string) => ((await farbwert(pg, css))[3] ?? 255) / 255;

/** Werte, wie der Browser sie für dieses Element WIRKLICH rechnet. */
const marke = (pg: Page, name: string) => pg.evaluate((n: string) => {
  const t = document.createElement('div');
  t.style.cssText = n.startsWith('--bg') ? `background:var(${n})` : `backdrop-filter:var(${n})`;
  document.body.appendChild(t);
  const s = getComputedStyle(t);
  const w = n.startsWith('--bg') ? s.backgroundColor : s.backdropFilter;
  t.remove();
  return w;
}, name);

/** Kontrast der Schrift gegen JEDES Pixel ihres Grundes — der schlimmste
 *  Rand zählt, nicht der Durchschnitt. Die Schrift wird dafür unsichtbar
 *  gemacht (sie selbst ist kein Grund), das Bild wird im Browser über eine
 *  Leinwand ausgelesen. */
const kontrast = async (pg: Page, wahl: string, textWahl: string) => {
  const kasten = await pg.evaluate(([w, tw]: string[]) => {
    const el = document.querySelector(w!) as HTMLElement | null;
    const tx = document.querySelector(tw!) as HTMLElement | null;
    if (!el || !tx) return null;
    const farbe = getComputedStyle(tx).color;
    const st = document.createElement('style');
    st.id = 't576-leise';
    st.textContent = `${w} *, ${w}{color:transparent!important;text-shadow:none!important}` +
      `${w} svg, ${w} img{visibility:hidden!important}`;
    document.head.appendChild(st);
    const r = el.getBoundingClientRect();
    return { x: r.left + 8, y: r.top + 8, w: r.width - 16, h: r.height - 16, farbe };
  }, [wahl, textWahl]);
  if (!kasten || kasten.w < 10 || kasten.h < 10) return null;
  await pg.waitForTimeout(80);
  const bild = await pg.screenshot({ clip: { x: kasten.x, y: kasten.y, width: kasten.w, height: kasten.h } });
  await pg.evaluate(() => document.getElementById('t576-leise')?.remove());
  return pg.evaluate(async ([b64, farbe]: string[]) => {
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
    /* Die Schriftfarbe ebenfalls über die Leinwand — `color(srgb …)` hätte
       sonst Werte zwischen 0 und 1 geliefert, als wären es 0 bis 255. */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cg = cv.getContext('2d')!; cg.fillStyle = farbe!; cg.fillRect(0, 0, 1, 1);
    const m = Array.from(cg.getImageData(0, 0, 1, 1).data);
    const Lt = L(m[0]!, m[1]!, m[2]!);
    const werte: number[] = [];
    for (let i = 0; i < d.length; i += 16) {
      const Lb = L(d[i]!, d[i + 1]!, d[i + 2]!);
      werte.push((Math.max(Lt, Lb) + 0.05) / (Math.min(Lt, Lb) + 0.05));
    }
    werte.sort((a, b) => a - b);
    return { schlimmster: +werte[Math.floor(werte.length * 0.01)]!.toFixed(2),
             mitte: +werte[Math.floor(werte.length / 2)]!.toFixed(2), proben: werte.length };
  }, [bild.toString('base64'), kasten.farbe]);
};

/* Mit Gruppentitel UND Kürzeln: beide tragen die STILLE Schrift
   (`--text-dim`), und die ist auf Glas der schwache Fall. Der erste Anlauf
   mass nur die Hauptschrift — und hätte ein Menü für lesbar erklärt, dessen
   Kürzel man über einer dunklen Fläche nicht mehr erkennt. */
const MENUE = '<div class="grp">Glas</div>' +
  ['Umbenennen', 'Verschieben', 'Duplizieren', 'In den Papierkorb', 'Kopieren', 'Teilen']
    .map((t, i) => `<button><span class="mi">•</span>${t}<span class="ms">Strg+${i + 1}</span></button>`).join('');

/* ==========================================================================
 * §4 + §5 · Das Menü IST das Glas aus §16, und es bleibt lesbar
 * ======================================================================== */
for (const thema of ['light', 'dark'] as const) {
  const wort = thema === 'light' ? 'hell' : 'dunkel';
  console.log(`\n4 · Das Menü ist das Glas (${wort})`);
  const { ctx, pg } = await oeffnen(1280, 900, thema);
  await pg.evaluate((h: string) => { UI.menu(h, 300, 180); }, MENUE);
  await pg.waitForTimeout(400);
  const soll = { flaeche: await marke(pg, '--bg-schwebend-dicht'), blur: await marke(pg, '--glas-blur') };
  const ist = await pg.evaluate(() => {
    const m = document.querySelector('.menu') as HTMLElement | null;
    if (!m) return null;
    const s = getComputedStyle(m);
    return { flaeche: s.backgroundColor, blur: s.backdropFilter, webkit: (s as any).webkitBackdropFilter ?? '' };
  });
  p('Das Menü ist offen', !!ist);
  p(`Seine Fläche ist die dichte Glasfläche \`--bg-schwebend-dicht\` (${wort})`, ist?.flaeche === soll.flaeche,
    `ist ${ist?.flaeche} · soll ${soll.flaeche}`);
  p(`Seine Unschärfe ist \`--glas-blur\` (${wort})`, ist?.blur === soll.blur,
    `ist ${ist?.blur} · soll ${soll.blur}`);
  const alpha = ist ? await deckkraft(pg, ist.flaeche) : 1;
  /* NICHT „unter 0,8". So stand es im ersten Anlauf, als Schätzung — und §5
     hat sie widerlegt: bei 74 % hatte die stille Schrift dunkel 1,43 : 1.
     Wie dicht das Glas sein muss, entscheidet die Lesbarkeit; hier wird nur
     gehalten, dass es überhaupt Glas ist. */
  p(`Und es scheint durch — Deckkraft unter 1 (${wort})`, alpha < 0.995, `Deckkraft ${alpha.toFixed(2)}`);

  console.log(`\n5 · Das Menü bleibt lesbar (${wort})`);
  const k = await kontrast(pg, '.menu', '.menu button');
  if (k) console.log(`    gemessen: schlimmster ${k.schlimmster} : 1 · Mitte ${k.mitte} : 1 · ${k.proben} Proben`);
  p(`Die Schrift erreicht über dem schlimmsten Pixel 4,5 : 1 (${wort}, §38)`,
    !!k && k.schlimmster >= 4.5, k ? `schlimmster ${k.schlimmster} · Mitte ${k.mitte} · ${k.proben} Proben` : 'nicht messbar');
  for (const [was, wahl] of [['Gruppentitel', '.menu .grp'], ['Kürzel', '.menu .ms']] as const) {
    const ks = await kontrast(pg, '.menu', wahl);
    if (ks) console.log(`    ${was}: schlimmster ${ks.schlimmster} : 1 · Mitte ${ks.mitte} : 1`);
    p(`Auch die stille Schrift (${was}) erreicht 4,5 : 1 (${wort})`, !!ks && ks.schlimmster >= 4.5,
      ks ? `schlimmster ${ks.schlimmster} · Mitte ${ks.mitte}` : 'nicht messbar');
  }
  await ctx.close();
}

/* ==========================================================================
 * §6 · Die untere Leiste am Telefon
 * ======================================================================== */
for (const thema of ['light', 'dark'] as const) {
  const wort = thema === 'light' ? 'hell' : 'dunkel';
  console.log(`\n6 · Die untere Leiste am Telefon (${wort})`);
  const { ctx, pg } = await oeffnen(390, 844, thema);
  const blur = await marke(pg, '--glas-blur');
  const ist = await pg.evaluate(() => {
    const n = document.querySelector('#handy-oben') as HTMLElement | null;
    if (!n) return null;
    const s = getComputedStyle(n);
    return { blur: s.backdropFilter, flaeche: s.backgroundColor, sicht: n.getBoundingClientRect().height > 0 };
  });
  p(`Die Leiste ist da (${wort})`, !!ist?.sicht);
  p(`Sie trägt dieselbe Unschärfe wie das Menü (\`--glas-blur\`, ${wort})`, ist?.blur === blur,
    `ist ${ist?.blur} · soll ${blur}`);
  /* Gemessen wird ein NICHT gewählter Knopf: er trägt `--text-dim`, die
     schwächste Schrift der Leiste. Der gewählte liegt auf der Linse und ist
     heller — wer ihn misst, misst den leichten Fall. */
  const k = await kontrast(pg, '#handy-oben', '#handy-oben > button:not(.an):not([aria-current="page"])');
  if (k) console.log(`    gemessen: schlimmster ${k.schlimmster} : 1 · Mitte ${k.mitte} : 1 · ${k.proben} Proben`);
  p(`Ihre Beschriftung erreicht über dem Muster 4,5 : 1 (${wort})`, !!k && k.schlimmster >= 4.5,
    k ? `schlimmster ${k.schlimmster} · Mitte ${k.mitte}` : 'nicht messbar');
  await ctx.close();
}

/* ==========================================================================
 * §7 · Weniger Transparenz heisst: kein Glas
 * ======================================================================== */
console.log('\n7 · Weniger Transparenz');
{
  const { ctx, pg } = await oeffnen(1280, 900, 'dark', true);
  const gilt = await pg.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches);
  p('Der Browser meldet `prefers-reduced-transparency: reduce`', gilt === true);
  await pg.evaluate((h: string) => { UI.menu(h, 300, 180); }, MENUE);
  await pg.waitForTimeout(300);
  const m = await pg.evaluate(() => {
    const el = document.querySelector('.menu') as HTMLElement | null;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { blur: s.backdropFilter, flaeche: s.backgroundColor };
  });
  const a = m ? await deckkraft(pg, m.flaeche) : 0;
  p('Das Menü hat dann keine Unschärfe', m?.blur === 'none', String(m?.blur));
  p('Und ist voll deckend', a === 1, `${m?.flaeche}`);
  await ctx.close();
}
{
  const { ctx, pg } = await oeffnen(390, 844, 'dark', true);
  const n = await pg.evaluate(() => {
    const el = document.querySelector('#handy-oben') as HTMLElement | null;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { blur: s.backdropFilter, flaeche: s.backgroundColor };
  });
  const a = n ? await deckkraft(pg, n.flaeche) : 0;
  p('Auch die Telefonleiste ist dann deckend und scharf', n?.blur === 'none' && a === 1,
    JSON.stringify(n));
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
