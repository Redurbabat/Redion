/* Suite 584 — Bessere Farben (E705)
 * ============================================================================
 * Redur, 27. September 2026, ca. 16:45 UTC: „… bessere stift efeckte beim
 * zeichnen bessere farben". Im Fragebogen um ca. 21:45 UTC gewählt:
 * „9 ruhigere Akzentfarben", „Leichter kühler Ton im Dunkeln", „Starker
 * Kontrast ohne Glas" (hier: schwarze Schrift auf Gelb). Und schon um
 * ca. 11:27 UTC: „… dort aollte ich die fraben ändern kann" — die Farben
 * bleiben in „Aussehen" wählbar, und was man wählt, muss lesbar bleiben.
 *
 * Gemessen wird am GERECHNETEN Stil der echten App (file://, kein Port),
 * nicht an den Zeilen im Stilblatt: eine Marke, die im Stilblatt steht und
 * von einem Inline-Wert überstimmt wird, ist nicht die Farbe auf dem
 * Bildschirm. Jede Farbe läuft durch eine 1×1-Leinwand, damit auch
 * `color-mix(…)` als Zahl ankommt.
 *
 *   §1  JEDE Akzentfarbe bringt lesbare Begleiter mit — in allen zehn
 *       Schemata, mit dem Schema-Akzent, den neun neuen, den acht alten
 *       und drei festen eigenen (#ffd400, #5cbf8a, #e0a33a): Schrift auf
 *       dem Akzent und auf dem Überfahren ≥ 4,5; Akzent-Tinte ≥ 4,5 auf
 *       Grund UND Karte; die Tinte im Farbton des Akzents (≤ 20°).
 *   §2  „Starker Kontrast": schwarze Schrift auf dem gelben Hauptknopf,
 *       ≥ 7 : 1 (test510 verlangt dort 7).
 *   §3  Eine eigene Farbe lässt keine violetten Reste: Tinte, Überfahren
 *       und Tönung tragen ihren Ton — und „wie im Schema" räumt alle fünf
 *       Inline-Werte wieder ab (test47 hält das für `--accent`).
 *   §4  Die neun Notion-Farben: jede Textfarbe ≥ 4,5 auf Grund, Karte und
 *       Überfahren aller zehn Schemata und auf ihrer eigenen Tönung; die
 *       Schrift auf jeder Tönung ≥ 7.
 *   §5  Die Statusfarben: Gefahr, Erfolg, Warnung, Info ≥ 4,5 auf Grund,
 *       Karte und Überfahren aller zehn; Weiss auf Rot (echte
 *       `.glocke-zahl`) ≥ 4,5 in allen zehn.
 *   §6  „Aussehen": neun Farben mit NAMEN und „Aa" in lesbarer Schrift, eine
 *       gewählt (aria-pressed), das Feld „Eigene …" mit Farbwähler, eine
 *       früher gespeicherte alte Farbe gilt weiter und steht als gewählt da;
 *       die Schemakarten zeigen die Farben, die wirklich gelten (Standard
 *       und Hell mit Akzentpunkt).
 *   §7  Eingaben im Dunkeln sind dunkel: `color-scheme` an Kästchen und
 *       Feldern folgt dem Grundton — die Wurzel bleibt `normal` (test579 §4).
 *   §8  Diagramme: die gezeichneten Reihen je Grundton — Sättigung ≥ 0,10,
 *       Nachbarn ΔE_OK ≥ 0,15 (die Reihenfolge ist fest, Nachbarn stehen
 *       nebeneinander), keine zwei ΔE_OK < 0,06, im Dunkeln jede ≥ 3 : 1 auf
 *       dem Grund; und beim Wechsel des Grundtons färben sie um.
 *   §9  Whiteboard und Gedankenkarte im Hellen: Schrift ≥ 4,5, Striche und
 *       Äste ≥ 3 auf dem Grund — und die gespeicherte Farbe bleibt, wie sie
 *       war; im Dunkeln wird genau sie gezeichnet.
 *   §10 Die Leiter: Standard dunkel ist EIN kühler Ton (Farbton 230–280°,
 *       Sättigung 0,003–0,015) von Grund bis „gedrückt"; jedes Schema mit
 *       eigenem Grund hat gedämpfte Schrift ≥ 4,5 (Grund, Karte,
 *       Überfahren) und Beiwerk ≥ 3 — im Ton seines Grundes.
 *   §11 Keine feste Signalfarbe in den Stilblättern: jede bunte Farbe
 *       (OKLCH-Sättigung ≥ 0,06) in einer Farbeigenschaft ausserhalb der
 *       Markendateien steht auf der Liste der Papier- und Bildfarben.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Gegen den Grundstand 515451f9 ist sie rot, und zwar in jedem Abschnitt —
 * die Zahlen stehen im Commit „test584 (rot)".
 *
 * Gegenproben (je einmal rot gesehen, dann zurückgenommen — siehe E705):
 *   G1  In `aussehen.ts` die Zeile `setze('--auf-accent', …)` streichen
 *       → §1 fällt: 110 von 210 Paaren (Standard mit #5cbf8a: 2,26).
 *   G2  In `dunkel.css` `--gefahr` zurück auf #ef4444 → §5 fällt in sechs
 *       dunklen Schemata (Standard 3,67 auf dem Überfahren).
 *   G3  In `grund.css` die zwei `color-scheme`-Zeilen streichen → §7 fällt
 *       (30 Felder „normal").
 *   G4  In `werkzeuge.css` `#e03e3e` zurück an `.btn.rot` → §11 fällt.
 *
 *   node pruefungen/alle.mts 584
 * ==========================================================================*/
import { chromium, type Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* ── Die Farbrechnung, einmal für Node und einmal für die Seite ───────────
   Dieselben Formeln wie `Farben` in src/core/helpers/colors.ts — aber
   bewusst NICHT von dort geholt: ein Wächter, der mit dem Code rechnet, den
   er prüft, sagt „passt" zu jedem Rechenfehler. */
const RECHNUNG = `
  const lin = v => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const Y = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const kontrastRgb = (a, b) => { const x = Y(a), y = Y(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const lab = c => {
    const r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  };
  const lch = c => { const [L, a, b] = lab(c); let h = Math.atan2(b, a) * 180 / Math.PI; if (h < 0) h += 360; return [L, Math.hypot(a, b), h]; };
  const dE = (x, y) => { const a = lab(x), b = lab(y); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
  const tonAbstand = (h1, h2) => { const d = Math.abs(h1 - h2) % 360; return d > 180 ? 360 - d : d; };
`;

const SEITE = `
  window.__f584 = (() => {
    ${RECHNUNG}
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    /* Eine CSS-Farbe als [r, g, b, a 0…1] — über die Leinwand, damit auch
       color(srgb …), oklab(…) und color-mix(…) als Zahl ankommen. */
    const rgba = css => {
      cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = String(css); cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], Math.round(d[3] / 255 * 1000) / 1000];
    };
    const auf = (vorn, hinten) => { const v = rgba(vorn), h = rgba(hinten), a = v[3];
      return [0, 1, 2].map(i => v[i] * a + h[i] * (1 - a)); };
    const kontrast = (vorn, hinten) => Math.round(kontrastRgb(auf(vorn, hinten), rgba(hinten).slice(0, 3)) * 100) / 100;
    /* Was der Browser für var(--name) ausrechnet, als Farbe. */
    const token = name => {
      const i = document.createElement('i'); i.style.color = 'var(' + name + ')';
      document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c;
    };
    const lchVon = css => lch(rgba(css));
    return { rgba, kontrast, token, lchVon, dE: (a, b) => dE(rgba(a), rgba(b)), tonAbstand };
  })();
`;
/** So heisst die Rechnung in der Seite — nur als Typ, für den Prüfer. */
type F584 = {
  rgba(css: string): number[]; kontrast(vorn: string, hinten: string): number;
  token(name: string): string; lchVon(css: string): number[];
  dE(a: string, b: string): number; tonAbstand(a: number, b: number): number;
};

/* ==========================================================================
 * §11 · ohne Browser: keine feste Signalfarbe in den Stilblättern
 * ======================================================================== */
const node = new Function(RECHNUNG + 'return { lch, kontrastRgb };')() as {
  lch(c: number[]): number[]; kontrastRgb(a: number[], b: number[]): number;
};
const hexZuRgb = (h: string): number[] | null => {
  let t = h.slice(1);
  if (t.length === 3 || t.length === 4) t = t.split('').map(c => c + c).join('');
  if (t.length !== 6 && t.length !== 8) return null;
  return [0, 2, 4].map(i => parseInt(t.slice(i, i + 2), 16));
};
/* DIE LISTE DER ERLAUBTEN BUNTEN FARBEN — Farben, die auf PAPIER oder in
   einem BILD stehen, nicht auf Redions Oberfläche. Sie wechseln mit keinem
   Schema, weil ihr Grund keines hat (E573: das Blatt ist Papier, E260).
   Wer eine Zeile hinzufügt, schreibt den Grund dazu. */
const ERLAUBT: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\.blatt-(laser|note-preview|auswahl|griff)/, 'Werkzeuge auf dem Blatt (Papier, E573)'],
  [/^\.document-(laser|lupe|treffer|verweis|region)/, 'Werkzeuge und Treffer auf dem Dokument (Papier)'],
  [/^\.ru-(staff|fach)/, 'die gemalte Staffelei und die Fächer (Bild, E609)'],
  [/^\.cover-textur-/, 'Buchdeckel (Bild)'],
  /* `.studio-orb` stand hier bis E727 — eine Scheibe mit fester Farbe als
     „Mond". Das Gestirn trägt nur noch Zeichen aus dem Register in
     `currentColor`; die Ausnahme ist gestrichen, die Liste schrumpft. */
  [/^\.rmo-(liquid|orb)|^\.bib-studio-miniatur/, 'Zierbilder der Bewegung (RedionMotion)'],
  [/#ho-pille/, 'die Linse der unteren Leiste (E639, gehört zum Material)'],
  [/--sp-(strom|schein)|\.sp-start/, 'der Stromschalter mit Glühfaden (RedionMotion, ein Bild von Licht)'],
  [/(^|\s)\.ru-(geste|drucker)|\.rmo-ticket/, 'die gezeichnete Hand, der Drucker, das Ticket (Bilder)'],
  [/^#ai \.ai-compose::before|^\.ki-aktivitaet/, 'der Schimmer, solange die KI arbeitet (Zier der Bewegung)'],
  [/^#page mark/, 'Suchtreffer im Text: Textmarker-Gelb, wie auf Papier, in beiden Modi'],
];
const MARKENDATEIEN = new Set(['dunkel.css', 'hell.css', 'grund.css', 'marken.css']);
console.log('\n§11 · Keine feste Signalfarbe in den Stilblättern');
const stilOrdner = path.join(WURZEL, 'quell/schale/stil');
const funde: string[] = [];
let gezaehlt = 0;
for (const datei of fs.readdirSync(stilOrdner).filter(f => f.endsWith('.css')).sort()) {
  if (MARKENDATEIEN.has(datei)) continue;
  const css = fs.readFileSync(path.join(stilOrdner, datei), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const wahl = (m[1] ?? '').trim().replace(/\s+/g, ' ');
    if (/^(from|to|\d+%)/.test(wahl)) continue;             /* Stufen in @keyframes zählen mit ihrem Namen nicht */
    for (const decl of (m[2] ?? '').split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim(), wert = decl.slice(i + 1);
      if (!/^(--|color|background|border|outline|fill|stroke|box-shadow|text-shadow|caret|accent|text-decoration)/.test(prop)) continue;
      const farben: number[][] = [];
      for (const h of wert.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) { const c = hexZuRgb(h); if (c) farben.push(c); }
      for (const r of wert.match(/rgba?\([^)]*\)/g) ?? []) {
        const z = (r.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        if (z.length === 3) farben.push(z);
      }
      for (const c of farben) {
        gezaehlt++;
        if ((node.lch(c)[1] ?? 0) < 0.06) continue;
        if (ERLAUBT.some(([re]) => re.test(wahl) || re.test(prop))) continue;
        funde.push(`${datei}: ${wahl.slice(0, 50)} { ${prop} }`);
      }
    }
  }
}
p(`Keine bunte Farbe von Hand ausserhalb der Liste (${gezaehlt} Farbwerte gelesen)`,
  gezaehlt > 500 && funde.length === 0, `${funde.length}: ` + funde.slice(0, 8).join(' · '));

/* ==========================================================================
 * Die echte App
 * ======================================================================== */
const browser = await chromium.launch();
const kontext = await browser.newContext({ viewport: { width: 1300, height: 900 } });
await kontext.addInitScript({ content: SEITE });
const seite: Page = await kontext.newPage();
const jsFehler: string[] = [];
seite.on('pageerror', e => jsFehler.push(e.message.slice(0, 200)));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && typeof Aussehen !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(1200);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay,#rg-willkommen,#rg-einladung,.produkt-onboarding-lage').forEach(e => e.remove());
});

const SCHEMATA: string[] = await seite.evaluate(() => (Aussehen.SCHEMATA as Array<{ id: string }>).map(s => s.id));
p('Zehn Schemata zum Durchmessen', SCHEMATA.length === 10, String(SCHEMATA.length));
const NEUN = ['#7552dc', '#4364d6', '#0071b2', '#00787e', '#007d46', '#986000', '#c04020', '#ba3c77', '#686d73'];
const ALTE = ['#2eaadc', '#6c8cff', '#5cbf8a', '#e0a33a', '#e06a94', '#9a6dd7', '#ff7369', '#8a8a8a'];
const EIGENE = ['#ffd400', '#5cbf8a', '#e0a33a'];

/* ==========================================================================
 * §1 · Jede Akzentfarbe bringt lesbare Begleiter mit
 * ======================================================================== */
console.log('\n§1 · Jede Akzentfarbe bringt lesbare Begleiter mit (10 Schemata × 21 Farben)');
const s1 = await seite.evaluate(({ schemata, farben }) => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  const schlecht: string[] = [];
  let gemessen = 0, exakt = 0, eigenGesetzt = 0;
  for (const sch of schemata) {
    for (const akz of ['', ...farben]) {
      Aussehen.setzen({ schema: sch, akzent: akz });
      const a = f.token('--accent'), auf = f.token('--auf-accent'), hover = f.token('--accent-hover');
      const tinte = f.token('--accent-text'), bg = f.token('--bg'), karte = f.token('--bg-card');
      const werte = {
        aufAkzent: f.kontrast(auf, a), aufHover: f.kontrast(auf, hover),
        tinteGrund: f.kontrast(tinte, bg), tinteKarte: f.kontrast(tinte, karte),
      };
      gemessen++;
      if (akz) {
        eigenGesetzt++;
        const soll = f.rgba(akz).slice(0, 3).join(','), ist = f.rgba(a).slice(0, 3).join(',');
        if (soll === ist) exakt++;
      }
      const la = f.lchVon(a), lt = f.lchVon(tinte);
      const ton = (la[1] ?? 0) >= 0.04 && (lt[1] ?? 0) >= 0.02 ? f.tonAbstand(la[2] ?? 0, lt[2] ?? 0) : 0;
      const zuWenig = Object.entries(werte).filter(([, k]) => k < 4.5).map(([n, k]) => n + ' ' + k);
      if (ton > 20) zuWenig.push('Ton der Tinte ' + Math.round(ton) + '° weg');
      if (zuWenig.length) schlecht.push(`${sch}/${akz || 'Schema'}: ${zuWenig.join(', ')}`);
    }
  }
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  return { schlecht, gemessen, exakt, eigenGesetzt };
}, { schemata: SCHEMATA, farben: [...NEUN, ...ALTE, ...EIGENE] });
p(`Alle ${s1.gemessen} Paare lesbar: Schrift auf Akzent und Überfahren, Tinte auf Grund und Karte, im selben Ton`,
  s1.gemessen === 210 && s1.schlecht.length === 0, `${s1.schlecht.length} schlecht: ` + s1.schlecht.slice(0, 6).join(' · '));
p('Die gewählte Farbe bleibt genau die gewählte', s1.exakt === s1.eigenGesetzt, `${s1.exakt}/${s1.eigenGesetzt}`);

/* ==========================================================================
 * §2 · Starker Kontrast: schwarze Schrift auf Gelb
 * ======================================================================== */
console.log('\n§2 · „Starker Kontrast": schwarze Schrift auf dem gelben Hauptknopf');
const s2 = await seite.evaluate(() => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  Aussehen.setzen({ schema: 'kontrast', akzent: '' });
  const k = document.createElement('button');
  k.className = 'btn prim'; k.textContent = 'Speichern';
  document.body.appendChild(k);
  const cs = getComputedStyle(k);
  const aus = { fg: cs.color, bg: cs.backgroundColor, k: f.kontrast(cs.color, cs.backgroundColor) };
  k.remove();
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  return aus;
});
p('Der Hauptknopf ist gelb und schwarz beschriftet', s2.bg === 'rgb(255, 212, 0)' && s2.fg === 'rgb(0, 0, 0)',
  `${s2.fg} auf ${s2.bg}`);
p('… mit mindestens 7 : 1', s2.k >= 7, String(s2.k));

/* ==========================================================================
 * §3 · Eine eigene Farbe lässt keine violetten Reste
 * ======================================================================== */
console.log('\n§3 · Eine eigene Farbe lässt keine violetten Reste');
const s3 = await seite.evaluate(() => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  const aus: Record<string, number> = {};
  Aussehen.setzen({ schema: 'standard', akzent: '#007d46' });
  const ton = f.lchVon(f.token('--accent'))[2] ?? 0;
  for (const n of ['--accent-text', '--accent-hover', '--accent-schwach']) aus[n] = Math.round(f.tonAbstand(ton, f.lchVon(f.token(n))[2] ?? 0));
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  const w = document.documentElement.style;
  const reste = ['--accent', '--auf-accent', '--accent-text', '--accent-hover', '--accent-schwach']
    .filter(n => w.getPropertyValue(n).trim() !== '');
  return { aus, reste };
});
p('Grün gewählt: Tinte, Überfahren und Tönung sind grün (≤ 20°)', Object.values(s3.aus).every(d => d <= 20),
  JSON.stringify(s3.aus));
p('„wie im Schema" lässt keinen Inline-Wert zurück', s3.reste.length === 0, s3.reste.join(', '));

/* ==========================================================================
 * §4 · Die neun Notion-Farben
 * ======================================================================== */
console.log('\n§4 · Die neun Notion-Farben in allen zehn Schemata');
const s4 = await seite.evaluate((schemata) => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  const NAMEN = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];
  const schlecht: string[] = [];
  let min = 99, minWo = '';
  for (const sch of schemata) {
    Aussehen.setzen({ schema: sch, akzent: '' });
    const flaechen = ['--bg', '--bg-card', '--bg-hover'].map(n => f.token(n));
    const text = f.token('--text');
    for (const n of NAMEN) {
      const c = f.token('--c-' + n), b = f.token('--b-' + n);
      const ks = [...flaechen.map(x => f.kontrast(c, x)), f.kontrast(c, b)];
      const k = Math.min(...ks);
      if (k < min) { min = k; minWo = sch + '/' + n; }
      if (k < 4.5) schlecht.push(`${sch}/${n} ${k}`);
      const t = f.kontrast(text, b);
      if (t < 7) schlecht.push(`${sch}/Schrift auf b-${n} ${t}`);
    }
  }
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  return { schlecht, min: Math.round(min * 100) / 100, minWo };
}, SCHEMATA);
p('Jede Textfarbe ≥ 4,5 auf Grund, Karte, Überfahren und eigener Tönung; Schrift auf jeder Tönung ≥ 7',
  s4.schlecht.length === 0, `${s4.schlecht.length}: ` + s4.schlecht.slice(0, 8).join(' · '));
console.log(`    (knappste Stelle: ${s4.minWo} ${s4.min} : 1)`);

/* ==========================================================================
 * §5 · Die Statusfarben
 * ======================================================================== */
console.log('\n§5 · Gefahr, Erfolg, Warnung, Info — und Weiss auf Rot');
const s5 = await seite.evaluate((schemata) => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  const schlecht: string[] = [];
  const glocke: Record<string, number> = {};
  for (const sch of schemata) {
    Aussehen.setzen({ schema: sch, akzent: '' });
    const flaechen = ['--bg', '--bg-card', '--bg-hover'].map(n => f.token(n));
    for (const n of ['--gefahr', '--erfolg', '--warnung', '--info']) {
      const k = Math.min(...flaechen.map(x => f.kontrast(f.token(n), x)));
      if (k < 4.5) schlecht.push(`${sch}${n} ${k}`);
    }
    const z = document.createElement('i');
    z.className = 'glocke-zahl'; z.textContent = '3';
    document.body.appendChild(z);
    const cs = getComputedStyle(z);
    glocke[sch] = f.kontrast(cs.color, cs.backgroundColor);
    z.remove();
  }
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  return { schlecht, glocke };
}, SCHEMATA);
p('Jede Statusfarbe ≥ 4,5 auf Grund, Karte und Überfahren aller zehn', s5.schlecht.length === 0,
  `${s5.schlecht.length}: ` + s5.schlecht.slice(0, 8).join(' · '));
const glockeMin = Math.min(...Object.values(s5.glocke));
p('Weiss auf Rot an der Glocke ≥ 4,5 in allen zehn', Object.keys(s5.glocke).length === 10 && glockeMin >= 4.5,
  JSON.stringify(s5.glocke));

/* ==========================================================================
 * §6 · „Aussehen": neun Farben mit Namen, und Karten, die nicht lügen
 * ======================================================================== */
console.log('\n§6 · „Aussehen": neun Farben mit Namen und „Aa"');
await seite.evaluate(() => { Aussehen.setzen({ schema: 'standard', akzent: '' }); Aussehen.dialog(); });
await seite.waitForTimeout(400);
const s6 = await seite.evaluate(() => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  const felder = [...document.querySelectorAll<HTMLElement>('.au-akzente [data-akz]:not([data-akz=""])')];
  const namen = felder.map(b => (b.querySelector('.au-akz-name')?.textContent || '').trim());
  const aa = felder.map(b => {
    const pr = b.querySelector<HTMLElement>('.au-akz-probe');
    if (!pr) return 0;
    const cs = getComputedStyle(pr);
    return (pr.textContent || '').trim() === 'Aa' ? f.kontrast(cs.color, cs.backgroundColor) : 0;
  });
  const eigen = document.querySelector('.au-akzente label input[type="color"]');
  const eigenName = (eigen?.closest('label')?.textContent || '').trim();
  const zurueck = document.querySelector('.au-akzente [data-akz=""]');
  /* Die Karten: jeder Akzentpunkt hat eine Farbe; Standard und Hell zeigen
     den Grund, der wirklich gilt. */
  const punkte = [...document.querySelectorAll<HTMLElement>('.au-karte .au-probe b')]
    .map(b => f.rgba(getComputedStyle(b).backgroundColor)[3] ?? 0);
  /* Grund, Seitenfläche, Akzentpunkt und Schriftstrich der Karte — gegen
     das, was der Browser für dieses Schema WIRKLICH rechnet. */
  const karte = (id: string): string => ['', ' i', ' b', ' u'].map(t =>
    getComputedStyle(document.querySelector<HTMLElement>(`.au-karte[data-s="${id}"] .au-probe${t}`) ?? document.body)
      .backgroundColor).join(' | ');
  const echt = (): string => ['--bg', '--bg-side', '--accent', '--text'].map(n => f.token(n)).join(' | ');
  const standardKarte = karte('standard'), hellKarte = karte('hell');
  const w = document.documentElement;
  const standardEcht = echt();
  w.dataset['theme'] = 'light';
  const hellEcht = echt();
  w.dataset['theme'] = 'dark';
  return { namen, aa, eigen: !!eigen, eigenName, zurueck: !!zurueck, punkte,
           standardKarte, standardEcht, hellKarte, hellEcht };
});
p('Neun Farben, jede mit ihrem Namen', JSON.stringify(s6.namen) ===
  JSON.stringify(['Violett', 'Indigo', 'Blau', 'Türkis', 'Grün', 'Bernstein', 'Koralle', 'Rosa', 'Graphit']),
  JSON.stringify(s6.namen));
p('Jede zeigt „Aa" in der Schrift, die auf ihr stehen wird (≥ 4,5)', s6.aa.length === 9 && s6.aa.every(k => k >= 4.5),
  JSON.stringify(s6.aa));
p('Das Feld „Eigene …" mit Farbwähler und Namen, und „wie im Schema" bleiben', s6.eigen && /Eigene/.test(s6.eigenName) && s6.zurueck,
  JSON.stringify([s6.eigen, s6.eigenName, s6.zurueck]));
p('Jede Schemakarte hat einen Akzentpunkt (auch Standard und Hell)', s6.punkte.length === 10 && s6.punkte.every(a => a > 0),
  JSON.stringify(s6.punkte));
p('Die Karten „Standard" und „Hell" zeigen Grund, Fläche, Akzent und Schrift, die wirklich gelten',
  s6.standardKarte === s6.standardEcht && s6.hellKarte === s6.hellEcht,
  `Standard ${s6.standardKarte} / ${s6.standardEcht} · Hell ${s6.hellKarte} / ${s6.hellEcht}`);
/* Wählen per Klick, und eine ALTE gespeicherte Farbe gilt weiter. */
/* Ein echter Klick, wenn es die Scheibe gibt — fehlt sie, meldet der Punkt
   darunter es, statt dass der ganze Lauf an einer Zeitgrenze abbricht. */
if (await seite.locator('.au-akzente [data-akz="#00787e"]').count()) await seite.click('.au-akzente [data-akz="#00787e"]');
await seite.waitForTimeout(300);
const s6b = await seite.evaluate(() => {
  const gewaehlt = [...document.querySelectorAll('.au-akzente [aria-pressed="true"]')]
    .map(b => (b.querySelector('.au-akz-name')?.textContent || b.textContent || '').trim());
  const akz = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  return { gewaehlt, akz };
});
p('Ein Klick auf „Türkis" wählt genau Türkis (aria-pressed) und setzt es', JSON.stringify(s6b.gewaehlt) === '["Türkis"]' && s6b.akz === '#00787e',
  JSON.stringify(s6b));
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('.overlay [data-a="zu"]')?.click();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Aussehen.setzen({ schema: 'standard', akzent: '#2eaadc' });
  Aussehen.dialog();
});
await seite.waitForTimeout(400);
const s6c = await seite.evaluate(() => ({
  akz: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  eigen: !!document.querySelector('.au-akzente .au-eigen.an'),
  name: (document.querySelector('.au-akzente .au-eigen .au-akz-name')?.textContent || '').trim(),
}));
p('Eine früher gespeicherte alte Farbe (#2eaadc) gilt weiter und steht als gewählt da',
  s6c.akz === '#2eaadc' && s6c.eigen && s6c.name.length > 0, JSON.stringify(s6c));
await seite.evaluate(() => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Aussehen.setzen({ schema: 'standard', akzent: '' });
});

/* ==========================================================================
 * §7 · Eingaben im Dunkeln sind dunkel
 * ======================================================================== */
console.log('\n§7 · Kästchen und Felder folgen dem Grundton');
const s7 = await seite.evaluate((schemata) => {
  const falsch: string[] = [];
  const box = document.createElement('input'); box.type = 'checkbox';
  const datum = document.createElement('input'); datum.type = 'date';
  const wahl = document.createElement('select');
  document.body.append(box, datum, wahl);
  for (const sch of schemata) {
    Aussehen.setzen({ schema: sch, akzent: '' });
    const soll = document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark';
    for (const el of [box, datum, wahl]) {
      const ist = getComputedStyle(el).colorScheme;
      if (ist !== soll) falsch.push(`${sch}: ${el.tagName.toLowerCase()}${el instanceof HTMLInputElement ? '[' + el.type + ']' : ''} ${ist}`);
    }
  }
  box.remove(); datum.remove(); wahl.remove();
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  return { falsch, wurzel: getComputedStyle(document.documentElement).colorScheme };
}, SCHEMATA);
p('Kästchen, Datum und Auswahl tragen in allen zehn den Grundton ihres Schemas', s7.falsch.length === 0,
  `${s7.falsch.length}: ` + s7.falsch.slice(0, 6).join(' · '));
p('… und die Wurzel bleibt „normal" (test579 §4)', s7.wurzel === 'normal', s7.wurzel);

/* ==========================================================================
 * §8 · Diagramme: unterscheidbare Reihen je Grundton
 * ======================================================================== */
console.log('\n§8 · Diagramme: gezeichnete Reihen je Grundton');
await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Diagramm-Probe 584' });
  Store.addBlock(s.id, 'chart', { text: 'Stunden', chartTyp: 'column',
    daten: 'A: 6\nB: 4\nC: 3\nD: 2\nE: 2,5\nF: 1\nG: 1,5\nH: 5' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
});
const reihen = (modus: string): Promise<{ farben: string[]; grund: string }> => seite.evaluate(async (m) => {
  Aussehen.setzen({ schema: m === 'light' ? 'hell' : 'standard', akzent: '' });
  await new Promise(r => setTimeout(r, 150));
  const farben = [...document.querySelectorAll<SVGElement>('.chart rect.ch-teil')].map(r => getComputedStyle(r).fill);
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  return { farben, grund: f.token('--bg') };
}, modus);
const pruefeReihen = async (modus: string, name: string): Promise<string[]> => {
  const r = await reihen(modus);
  const m = await seite.evaluate(({ farben, grund, modus: md }) => {
    const f = (globalThis as unknown as { __f584: F584 }).__f584;
    const satt = farben.map(c => Math.round((f.lchVon(c)[1] ?? 0) * 1000) / 1000);
    let dmin = 99, nmin = 99;
    for (let i = 0; i < farben.length; i++) for (let j = i + 1; j < farben.length; j++)
      dmin = Math.min(dmin, f.dE(farben[i] ?? '', farben[j] ?? ''));
    for (let i = 0; i + 1 < farben.length; i++) nmin = Math.min(nmin, f.dE(farben[i] ?? '', farben[i + 1] ?? ''));
    const aufGrund = farben.map(c => f.kontrast(c, grund));
    return { satt, dmin: Math.round(dmin * 1000) / 1000, nmin: Math.round(nmin * 1000) / 1000,
             aufGrund, dunkel: md === 'dark' };
  }, { ...r, modus });
  p(`${name}: acht Reihen gezeichnet`, r.farben.length === 8, String(r.farben.length));
  p(`${name}: jede Reihe bunt (Sättigung ≥ 0,10)`, m.satt.every(s => s >= 0.10), JSON.stringify(m.satt));
  p(`${name}: Nachbarn ΔE_OK ≥ 0,15, keine zwei unter 0,06`, m.nmin >= 0.15 && m.dmin >= 0.06,
    `Nachbarn ${m.nmin}, alle ${m.dmin}`);
  if (m.dunkel) p(`${name}: jede ≥ 3 : 1 auf dem Grund`, m.aufGrund.every(k => k >= 3), JSON.stringify(m.aufGrund));
  return r.farben;
};
const dunkleReihen = await pruefeReihen('dark', 'Dunkel');
const helleReihen = await pruefeReihen('light', 'Hell');
p('Beim Wechsel des Grundtons färben die gezeichneten Reihen um', JSON.stringify(dunkleReihen) !== JSON.stringify(helleReihen));

/* ==========================================================================
 * §9 · Whiteboard und Gedankenkarte im Hellen
 * ======================================================================== */
console.log('\n§9 · Whiteboard und Gedankenkarte: lesbar im Hellen, gespeichert wie vorher');
const s9 = await seite.evaluate(async () => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  const pal = GfxShapes.PALETTE as ReadonlyArray<[string, string]>;
  const formen: Array<Record<string, unknown>> = [];
  pal.forEach(([c, n], i) => {
    formen.push({ id: 't' + i, art: 'text', x: 20 + i * 100, y: 40, farbe: c, text: n });
    formen.push({ id: 's' + i, art: 'stift', farbe: c, pts: [[20 + i * 100, 80], [80 + i * 100, 90]] });
    formen.push({ id: 'n' + i, art: 'notiz', x: 20 + i * 100, y: 120, w: 90, h: 50, farbe: c, text: n });
  });
  Aussehen.setzen({ schema: 'hell', akzent: '' });
  const s = Store.addPage(null, { text: 'Flächen-Probe 584' });
  const wb = Store.addBlock(s.id, 'whiteboard', { text: 'Skizze', shapes: formen, hoehe: 240 });
  const knoten: Array<Record<string, unknown>> = [{ id: 'w', text: 'Mitte', eltern: null }];
  for (let i = 0; i < 8; i++) knoten.push({ id: 'a' + i, text: 'Ast ' + i, eltern: 'w', seite: i % 2 ? 'links' : 'rechts' });
  Store.addBlock(s.id, 'mindmap', { karte: { aufbau: 'karte', sicht: { x: 0, y: 0, z: 1 }, knoten } });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1400));
  const grund = f.token('--bg');
  const hell = { schrift: [] as number[], strich: [] as number[], zettel: [] as string[], ast: [] as number[], rand: [] as number[] };
  pal.forEach(([c], i) => {
    const t = document.querySelector<SVGElement>(`.wb [data-sid="t${i}"]`);
    const st = [...document.querySelectorAll<SVGElement>(`.wb [data-sid="s${i}"]`)].find(e => getComputedStyle(e).stroke !== 'transparent' && e.getAttribute('stroke') !== 'transparent');
    const n = document.querySelector<SVGElement>(`.wb rect[data-sid="n${i}"]`);
    hell.schrift.push(t ? f.kontrast(getComputedStyle(t).fill, grund) : 0);
    hell.strich.push(st ? f.kontrast(getComputedStyle(st).stroke, grund) : 0);
    hell.zettel.push(n ? f.rgba(getComputedStyle(n).fill).slice(0, 3).join(',') + '=' + f.rgba(c).slice(0, 3).join(',') : 'fehlt');
  });
  document.querySelectorAll<SVGElement>('.gk-linien path').forEach(pa => {
    const s2 = getComputedStyle(pa).stroke;
    if (s2 && s2 !== 'none' && !pa.classList.contains('gk-verb-fang')) hell.ast.push(f.kontrast(s2, grund));
  });
  document.querySelectorAll<HTMLElement>('.gk-kn:not(.gk-wurzel)').forEach(k => hell.rand.push(f.kontrast(getComputedStyle(k).borderTopColor, grund)));
  /* Im Dunkeln: genau die gespeicherte Farbe. */
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  await new Promise(r => setTimeout(r, 100));
  const dunkel = pal.map(([c], i) => {
    const t = document.querySelector<SVGElement>(`.wb [data-sid="t${i}"]`);
    return t ? f.rgba(getComputedStyle(t).fill).slice(0, 3).join(',') === f.rgba(c).slice(0, 3).join(',') : false;
  });
  const gespeichert = (Store.getBlock(wb.id).shapes as Array<{ id: string; farbe: string }>)
    .filter(x => /^t/.test(x.id)).map(x => x.farbe);
  return { hell, dunkel, gespeichert, palette: pal.map(x => x[0]) };
});
p('Whiteboard-Schrift im Hellen ≥ 4,5 in allen acht Farben', s9.hell.schrift.length === 8 && s9.hell.schrift.every(k => k >= 4.5),
  JSON.stringify(s9.hell.schrift));
p('Whiteboard-Striche im Hellen ≥ 3', s9.hell.strich.length === 8 && s9.hell.strich.every(k => k >= 3),
  JSON.stringify(s9.hell.strich));
p('Die Zettel behalten ihre helle Füllung (die gespeicherte Farbe)', s9.hell.zettel.every(z => z.split('=')[0] === z.split('=')[1]),
  JSON.stringify(s9.hell.zettel.slice(0, 3)));
p('Gedankenkarte: Äste und Knotenränder im Hellen ≥ 3', s9.hell.ast.length >= 8 && s9.hell.ast.every(k => k >= 3) &&
  s9.hell.rand.length >= 8 && s9.hell.rand.every(k => k >= 3), JSON.stringify({ ast: s9.hell.ast, rand: s9.hell.rand }));
p('Im Dunkeln wird genau die gespeicherte Farbe gezeichnet', s9.dunkel.every(Boolean), JSON.stringify(s9.dunkel));
p('Gespeichert ist unverändert die Palette (§9, E414)', JSON.stringify(s9.gespeichert) === JSON.stringify(s9.palette),
  JSON.stringify(s9.gespeichert));

/* ==========================================================================
 * §10 · Die Leiter: ein kühler Ton, und gedämpfte Schrift im Ton des Schemas
 * ======================================================================== */
console.log('\n§10 · Die Leiter');
const s10 = await seite.evaluate((schemata) => {
  const f = (globalThis as unknown as { __f584: F584 }).__f584;
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  const kuehl = ['--bg', '--bg-side', '--bg-card', '--bg-hover', '--bg-press'].map(n => {
    const [, C, h] = f.lchVon(f.token(n));
    return { n, C: Math.round((C ?? 0) * 10000) / 10000, h: Math.round(h ?? 0) };
  });
  const schlecht: string[] = [];
  const toene: string[] = [];
  for (const sch of schemata) {
    Aussehen.setzen({ schema: sch, akzent: '' });
    const eigen = document.documentElement.style.getPropertyValue('--bg').trim() !== '';
    const flaechen = ['--bg', '--bg-card', '--bg-hover'].map(n => f.token(n));
    const dim = f.token('--text-dim'), faint = f.token('--text-faint');
    const kd = Math.min(...flaechen.map(x => f.kontrast(dim, x)));
    const kf = Math.min(...flaechen.slice(0, 2).map(x => f.kontrast(faint, x)));
    if (kd < 4.5) schlecht.push(`${sch} gedämpft ${kd}`);
    if (kf < 3) schlecht.push(`${sch} Beiwerk ${kf}`);
    const g = f.lchVon(f.token('--bg')), d = f.lchVon(dim);
    if (eigen && (g[1] ?? 0) >= 0.01 && (d[1] ?? 0) < 0.005) toene.push(`${sch}: gedämpft ohne Ton (C ${(d[1] ?? 0).toFixed(4)})`);
    else if (eigen && (g[1] ?? 0) >= 0.01 && f.tonAbstand(g[2] ?? 0, d[2] ?? 0) > 35)
      toene.push(`${sch}: gedämpft ${Math.round(d[2] ?? 0)}° gegen Grund ${Math.round(g[2] ?? 0)}°`);
  }
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  return { kuehl, schlecht, toene };
}, SCHEMATA);
p('Standard dunkel ist EIN kühler Ton von Grund bis „gedrückt" (230–280°, Sättigung 0,003–0,015)',
  s10.kuehl.every(x => x.C >= 0.003 && x.C <= 0.015 && x.h >= 230 && x.h <= 280), JSON.stringify(s10.kuehl));
p('Gedämpfte Schrift ≥ 4,5 und Beiwerk ≥ 3 in allen zehn', s10.schlecht.length === 0, s10.schlecht.join(' · '));
p('Gedämpfte Schrift trägt den Ton ihres Schemas (Mitternacht, Wald, Sand, Rosé …)', s10.toene.length === 0, s10.toene.join(' · '));

console.log(`\n${ok}/${ok + weg} bestanden`);
console.log(jsFehler.length ? 'JS-Fehler:\n  ' + jsFehler.join('\n  ') : 'Keine JS-Fehler.');
await browser.close();
process.exit(weg || jsFehler.length ? 1 : 0);
