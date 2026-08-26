/* Suite 245 — die Marken: Masse, Radien, Zeiten, Farben in beiden Modi (E198/E199)
 * ============================================================================
 * `dunkel.css` warnt seit E44 in seinem eigenen Kopf:
 *
 *     „Wer hier eine Variable ergänzt, muss sie deshalb auch in `hell.css`
 *      ergänzen. Sonst zeigt der Hellmodus an dieser einen Stelle den
 *      dunklen Wert, und das fällt erst jemandem auf, der hell arbeitet."
 *
 * Eine Warnung im Kommentar ist keine Prüfung. Beim ersten Nachzählen war
 * genau eine Marke betroffen — `--bg-active`, ein weisser Schleier, der im
 * Hellmodus auf weissem Grund gelegen hätte. Sie wurde nirgends benutzt,
 * war also kein sichtbarer Fehler, sondern eine geladene Waffe.
 *
 * Diese Suite prüft vier Dinge:
 *
 * §1 JEDE MARKE GIBT ES IN BEIDEN MODI. Im Quelltext und im laufenden
 *    Browser — der Quelltext sagt, was gemeint war, der Browser, was
 *    ankommt.
 *
 * §2 DIE LEITER IST VOLLSTÄNDIG. Zehn Abstände, sechs Radien, vier Zeiten.
 *    Eine Lücke darin heisst, dass irgendwo wieder eine feste Zahl steht.
 *
 * §3 DIE KONTRASTE STIMMEN, GEMESSEN. Nicht „sieht gut aus", sondern die
 *    WCAG-Rechnung auf den Werten, die der Browser wirklich liefert. Genau
 *    hier fand E142 den unlesbaren Knopf und E199 den Auftragswert #7C5CFF,
 *    der mit 4,35 knapp unter der Grenze liegt.
 *
 * §4 WER KEINE BEWEGUNG WILL, BEKOMMT KEINE (§62 des Auftrags).
 *
 * Starten:
 *
 *   node pruefungen/lauf/test245.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8965;

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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* --------------------------------------------------------------------------
 * Die Marken aus dem Quelltext lesen.
 *
 * ACHTUNG, hier lag beim ersten Anlauf ein Messfehler: `hell.css` schreibt
 * mehrere Marken in EINE Zeile (`--c-default:#37352f; --c-gray:#787774; …`).
 * Ein Ausdruck mit `^` am Zeilenanfang fand davon nur die erste und meldete
 * vierzehn fehlende Marken, von denen dreizehn gar nicht fehlten.
 * ------------------------------------------------------------------------*/
const markenAus = (datei: string, block: string): Record<string, string> => {
  const s = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  const i = s.indexOf(block);
  if (i < 0) return {};
  const bis = s.indexOf('\n}', i);
  const raus: Record<string, string> = {};
  for (const m of s.slice(i, bis).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    raus[m[1] as string] = (m[2] as string).trim();
  }
  return raus;
};

console.log('\n1 · Jede Marke gibt es in beiden Modi');

const dunkel = markenAus('quell/schale/stil/dunkel.css', ':root{');
const hell   = markenAus('quell/schale/stil/hell.css', 'html[data-theme="light"]{');
const skala  = markenAus('quell/schale/stil/grund.css', ':root{');

p('Der Dunkelmodus bringt seine Marken mit', Object.keys(dunkel).length > 30,
  `${Object.keys(dunkel).length}`);
const nurDunkel = Object.keys(dunkel).filter(x => !(x in hell));
p('Keine Marke fehlt im Hellmodus', nurDunkel.length === 0, nurDunkel.join(', '));
/* Der Hellmodus darf eine Marke aus der MODUSFREIEN Leiter überschreiben —
   `--glas-rand` ist genau so ein Fall: der Innenrand ist auf dunklem Grund
   aus Licht und auf hellem aus Schatten. Was er nicht darf, ist eine Marke
   erfinden, die es sonst nirgends gibt. */
const nurHell = Object.keys(hell).filter(x => !(x in dunkel) && !(x in skala));
p('Und keine gibt es nur im Hellmodus', nurHell.length === 0, nurHell.join(', '));

/* Eine Marke, die in beiden Modi DENSELBEN Wert hat, gehört nicht in die
   Modusdateien, sondern in die modusfreie Leiter. Sonst muss man sie zweimal
   pflegen, ohne etwas davon zu haben. */
/* AUSNAHMEN, und jede braucht einen Grund.
   `--auf-accent` ist begrifflich modusabhängig: welche Schrift auf der
   Akzentfläche lesbar ist, hängt am Akzent, und der ist es. Dass heute in
   beiden Modi Weiss herauskommt, ist ein Ergebnis der Messung, keine
   Eigenschaft der Marke. Sie nach `grund.css` zu schieben hiesse, diesen
   Zusammenhang zu verstecken — und beim nächsten helleren Akzent fällt es
   niemandem auf. */
const DOPPELT_ERLAUBT = new Set(['--auf-accent']);
const gleich = Object.keys(dunkel)
  .filter(x => hell[x] === dunkel[x] && !DOPPELT_ERLAUBT.has(x));
p('Keine Marke steht zweimal mit demselben Wert', gleich.length === 0,
  gleich.join(', ') + ' — gehört nach grund.css');

console.log('\n2 · Die Leiter ist vollständig');

const abstaende = Array.from({ length: 10 }, (_, i) => `--space-${i + 1}`);
const fehlendeAbstaende = abstaende.filter(x => !(x in skala));
p('Zehn Abstände', fehlendeAbstaende.length === 0, fehlendeAbstaende.join(', '));

const radien = ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl',
                '--radius-2xl', '--radius-pill'];
const fehlendeRadien = radien.filter(x => !(x in skala));
p('Sechs Radien', fehlendeRadien.length === 0, fehlendeRadien.join(', '));

const zeiten = ['--motion-instant', '--motion-fast', '--motion-normal', '--motion-slow'];
const fehlendeZeiten = zeiten.filter(x => !(x in skala));
p('Vier Zeiten', fehlendeZeiten.length === 0, fehlendeZeiten.join(', '));
p('Und eine gemeinsame Kurve', '--ease' in skala);

/* Die Abstände müssen aufsteigen. Eine Leiter mit einer verdrehten Sprosse
   ist schlimmer als keine: man greift danach und fällt. */
const werte = abstaende.map(x => parseInt(skala[x] ?? '0', 10));
const steigt = werte.every((v, i) => i === 0 || v > (werte[i - 1] as number));
p('Die Abstände steigen lückenlos', steigt, werte.join(' · '));

console.log('\n3 · Die Kontraste, gemessen');

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2200);

/* Die Rechnung steht hier und nicht im Browser: eine Prüfung, die ihr
   Urteil aus dem Geprüften bezieht, prüft nichts. */
const leuchte = (farbe: string): number => {
  const m = farbe.match(/rgba?\(([^)]+)\)/);
  const t = m ? (m[1] as string).split(',').map(Number)
             : [0, 0, 0];
  const v = [t[0] ?? 0, t[1] ?? 0, t[2] ?? 0].map(x => x / 255)
    .map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * (v[0] as number) + 0.7152 * (v[1] as number) + 0.0722 * (v[2] as number);
};
const kontrast = (a: string, b: string): number => {
  const l1 = leuchte(a), l2 = leuchte(b);
  const [h, l] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (h + 0.05) / (l + 0.05);
};

/** Eine Marke als echte rgb-Zeichenkette, so wie der Browser sie liefert. */
const holeFarben = async (modus: 'dark' | 'light', namen: string[]) => {
  await seite.evaluate(m => { document.documentElement.dataset.theme = m; }, modus);
  await seite.waitForTimeout(120);
  return seite.evaluate((ns: string[]) => {
    const probe = document.createElement('span');
    probe.style.position = 'fixed'; probe.style.left = '-9999px';
    document.body.appendChild(probe);
    const raus: Record<string, string> = {};
    for (const n of ns) {
      probe.style.color = `var(${n})`;
      raus[n] = getComputedStyle(probe).color;
    }
    probe.remove();
    return raus;
  }, namen);
};

const gebraucht = ['--bg', '--bg-side', '--bg-card', '--text', '--text-dim',
                   '--text-faint', '--accent', '--accent-hover', '--accent-text',
                   '--auf-accent', '--gefahr', '--erfolg', '--warnung', '--info',
                   '--bg-active'];

for (const modus of ['dark', 'light'] as const) {
  const f = await holeFarben(modus, gebraucht);
  const wie = modus === 'dark' ? 'dunkel' : 'hell';
  const leer = gebraucht.filter(n => !f[n] || f[n] === 'rgba(0, 0, 0, 0)');
  p(`${wie}: jede Marke kommt im Browser an`, leer.length === 0, leer.join(', '));

  const k = (a: string, b: string) => kontrast(f[a] as string, f[b] as string);

  p(`${wie}: Fliesstext auf dem Grund ≥ 4,5`, k('--text', '--bg') >= 4.5,
    k('--text', '--bg').toFixed(2));
  p(`${wie}: gedämpfter Text auf dem Grund ≥ 4,5`, k('--text-dim', '--bg') >= 4.5,
    k('--text-dim', '--bg').toFixed(2));
  p(`${wie}: schwacher Text ≥ 3,0 (nur Beiwerk)`, k('--text-faint', '--bg') >= 3.0,
    k('--text-faint', '--bg').toFixed(2));
  /* DIE STELLE, AN DER E142 EINEN UNLESBAREN KNOPF FAND. */
  p(`${wie}: Schrift auf der Akzentfläche ≥ 4,5`, k('--auf-accent', '--accent') >= 4.5,
    k('--auf-accent', '--accent').toFixed(2));
  p(`${wie}: … auch beim Überfahren`, k('--auf-accent', '--accent-hover') >= 4.5,
    k('--auf-accent', '--accent-hover').toFixed(2));
  p(`${wie}: die Akzentfläche selbst ≥ 3,0`, k('--accent', '--bg') >= 3.0,
    k('--accent', '--bg').toFixed(2));
  /* DIE TINTE MUSS AUCH AUF DER KARTE REICHEN, und das ist die Stelle, an
     der #8B6DFF durchfiel: 5,03 auf dem Grund, aber 4,45 auf der Karte.
     Wer nur gegen den Grund misst, übersieht genau die Hälfte der Fälle. */
  p(`${wie}: die Akzent-Tinte auf dem Grund ≥ 4,5`, k('--accent-text', '--bg') >= 4.5,
    k('--accent-text', '--bg').toFixed(2));
  p(`${wie}: … und auf der Karte`, k('--accent-text', '--bg-card') >= 4.5,
    k('--accent-text', '--bg-card').toFixed(2));
  /* GEMESSEN WIRD DER FARBTON, NICHT DIE HELLIGKEIT.
     Der erste Anlauf verglich hier den Kontrast und meldete 1,37 — also
     rot. Das war ein Fehler in der Prüfung, nicht in den Farben: Kontrast
     misst den Helligkeitsunterschied, und Rot und Violett sind ähnlich
     hell. Ein Mensch unterscheidet sie trotzdem sofort, weil sie sich im
     TON unterscheiden.
     Worum es E44 ging, war: „Sichern" darf nicht aussehen wie „Löschen".
     Das ist eine Frage des Tons. Also wird der Ton gemessen — mindestens
     40 Grad auseinander auf dem Farbkreis. */
  const ton = (farbe: string): number => {
    const m = farbe.match(/rgba?\(([^)]+)\)/);
    const t = m ? (m[1] as string).split(',').map(Number) : [0, 0, 0];
    const [r, g, b] = [(t[0] ?? 0) / 255, (t[1] ?? 0) / 255, (t[2] ?? 0) / 255];
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d === 0) return 0;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; return h < 0 ? h + 360 : h;
  };
  const abstand = (a: number, b: number): number => {
    const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d;
  };
  const tonAbstand = abstand(ton(f['--gefahr'] as string), ton(f['--accent'] as string));
  p(`${wie}: Gefahr und Akzent liegen im Ton weit auseinander`,
    tonAbstand >= 40, `${Math.round(tonAbstand)}°`);
}

console.log('\n4 · Die Oberfläche trägt Zeichen, keine Emoji');

/* §71 DES AUFTRAGS: „Professionelle Hauptoberfläche nicht mit Emojis bauen.
   Emoji nur wenn Nutzerdaten selbst Emoji-Icons enthalten."
 *
 * Die Grenze verläuft zwischen SCHALE und INHALT:
 *
 *   Schale   Seitenleiste, Kopfleiste, Reiter, Werkzeugleisten. Das ist
 *            Redions Oberfläche, und sie gehört Redion.
 *   Inhalt   das Zeichen einer Seite, das Symbol einer Vorlage, was ein
 *            Mensch selbst gesetzt hat. Das gehört ihm.
 *
 * Geprüft wird deshalb NUR die Schale — namentlich, nicht pauschal. Ein
 * pauschales „nirgends ein Emoji" wäre schnell geschrieben und falsch: es
 * würde jede Seite rot machen, die jemand mit 🧳 benannt hat. */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

await seite.evaluate(() => {
  /* Der Rundgang legt sich sonst über alles. */
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
});
await seite.waitForTimeout(400);

const schale = await seite.evaluate(() => {
  const orte = ['#sidebar .side-nav', '#sidebar .side-fuss', '#sidebar .side-reiter',
                '#sidebar .side-top', '#topbar'];
  const treffer: string[] = [];
  let knoepfe = 0, mitZeichen = 0;
  for (const ort of orte) {
    const wurzel = document.querySelector(ort);
    if (!wurzel) { treffer.push(`${ort}: gibt es nicht`); continue; }
    wurzel.querySelectorAll('button').forEach(b => {
      knoepfe++;
      if (b.querySelector('svg.sym')) mitZeichen++;
      const t = (b.textContent || '').trim();
      if (t) treffer.push(`${ort} → ${t.slice(0, 24)}`);
    });
  }
  return { treffer, knoepfe, mitZeichen };
});

/* Erst die Gegenprobe, dass überhaupt etwas gemessen wurde: fände der
   Ausdruck keine Knöpfe, wäre er ewig grün. */
p('Die Schale hat Knöpfe zum Messen', schale.knoepfe >= 20, `${schale.knoepfe}`);
p('Und fast alle tragen ein Zeichen aus dem Register',
  schale.mitZeichen >= schale.knoepfe * 0.7,
  `${schale.mitZeichen} von ${schale.knoepfe}`);
const mitEmoji = schale.treffer.filter(t => EMOJI.test(t));
p('Kein Emoji in Seitenleiste und Kopfleiste', mitEmoji.length === 0,
  mitEmoji.slice(0, 4).join(' | '));

/* UND DIE ZEICHEN SIND WIRKLICH DA. Ein `data-sym`, das niemand gefüllt
   hat, ist eine leere Stelle — und die sieht man im Bild nicht, weil da
   ohnehin nichts steht. Genau deshalb wird sie gezählt. */
const leere = await seite.evaluate(() =>
  [...document.querySelectorAll('[data-sym]')]
    .filter(e => !e.querySelector('svg'))
    .map(e => (e as HTMLElement).dataset.sym || '?'));
p('Keine Stelle bleibt ohne Zeichen', leere.length === 0,
  leere.slice(0, 6).join(', '));

const symbole = await seite.evaluate(() => {
  const R = (globalThis as any).Register;
  if (!R || !R.symbole) return null;
  return { anzahl: R.symbole.alle().length,
           leerBeiUnbekannt: R.symbole.alsSvg('gibtesnicht') === '',
           hatStrich: R.symbole.alsSvg('search').includes('currentColor') };
});
p('Das Symbolregister ist da', !!symbole);
p('Es kennt genug Zeichen', (symbole?.anzahl ?? 0) >= 30, `${symbole?.anzahl}`);
p('Ein unbekannter Name gibt nichts zurück statt eines Kästchens',
  symbole?.leerBeiUnbekannt === true);
p('Die Zeichen nehmen die Farbe ihrer Zeile', symbole?.hatStrich === true);

console.log('\n5 · Wer keine Bewegung will, bekommt keine');

await seite.emulateMedia({ reducedMotion: 'reduce' });
await seite.waitForTimeout(150);
const ruhig = await seite.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return ['--motion-instant', '--motion-fast', '--motion-normal', '--motion-slow']
    .map(n => s.getPropertyValue(n).trim());
});
p('Alle vier Dauern fallen auf ~0', ruhig.every(x => x === '1ms'), ruhig.join(' · '));

await seite.emulateMedia({ reducedMotion: 'no-preference' });
await seite.waitForTimeout(150);
const normal = await seite.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return s.getPropertyValue('--motion-normal').trim();
});
p('Und ohne die Bitte bleiben sie stehen', normal === '200ms', normal);

console.log('\nFehler auf der Seite:', fehler.length ? fehler.join(' | ') : 'keine');
p('Keine Fehler auf der Seite', !fehler.length, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
