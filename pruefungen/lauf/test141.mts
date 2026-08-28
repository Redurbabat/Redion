/* Suite 105 — Eine Telefongrenze, nicht drei (L34)
 * ============================================================================
 * DER FUND. „Das ist ein Telefon" stand mit drei verschiedenen Zahlen da:
 *
 *     768   KONSTANTEN.TELEFON_BREITE → AppEinstellung.amTelefon()
 *     760   38 CSS-Regeln, UI.amTelefon(), Tabellenblock, Raster
 *     700   sechs matchMedia-Aufrufe im TypeScript, drei CSS-Blöcke
 *
 * Gemessen, was das anrichtete — bei jedem Fenster zwischen 701 und 760 px:
 *
 *     Telefonleisten        sichtbar   (die CSS sagt ab 760: Telefon)
 *     Rechner-Seitenleiste  daneben    (die CSS sagt ab 700: Schublade)
 *
 * Auf dem Bildschirm hiess das: die Telefon-Pillen lagen ÜBER dem Logo
 * der Seitenleiste, und die untere Leiste überdeckte „Neuer Chat". Zwei
 * Entwürfe übereinander gezeichnet.
 *
 * Und es ist keine Randbreite: ein halbierter Bildschirm, ein kleines
 * Tablet, ein verkleinertes Browserfenster liegen alle darin.
 *
 * WAS DIESER LAUF PRÜFT. Nicht, dass irgendwo 760 steht — das wäre eine
 * Behauptung über den Quelltext. Sondern dass an fünf Breiten rund um die
 * Grenze ALLE Antworten übereinstimmen: die Konstante, die CSS, die
 * Leisten und die Seitenleiste.
 *
 * §3 ist der eigentliche Punkt: bei keiner Breite dürfen Telefonleisten
 * und feste Seitenleiste gleichzeitig da sein.
 *
 *   node pruefungen/lauf/test141.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8821;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];

/** Was die App bei dieser Breite über sich sagt — und was man sieht. */
const beiBreite = async (breite: number) => {
  const s = await browser.newPage({ viewport: { width: breite, height: 900 } });
  s.on('pageerror', e => fehler.push(`${breite}px: ${e.message}`));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForTimeout(1800);
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
       über alles und fängt Klicks ab (E132). */
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });
  const r = await s.evaluate(() => {
    const sichtbar = (id: string): boolean => {
      const el = document.getElementById(id);
      if (!el) return false;
      const st = getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden';
    };
    const sb = document.getElementById('sidebar');
    return {
      /* Die drei, die früher auseinandergingen */
      konstante: (KONSTANTEN as any).TELEFON_BREITE,
      appSagt:   (AppEinstellung as any).amTelefon(),
      uiSagt:    (UI as any).amTelefon(),
      cssSagt:   matchMedia('(max-width: 760px)').matches,
      /* Und was daraus wird */
      leisteOben:  sichtbar('handy-oben'),
      /* Seit E236 steht die Navigation selbst unten; die schwebende
         Leiste `#handy-unten` gibt es nicht mehr. */
      leisteUnten: sichtbar('handy-oben'),
      seitenleiste: sb ? getComputedStyle(sb).position : 'fehlt'
    };
  });
  await s.close();
  return r;
};

const BREITEN = [390, 700, 730, 760, 761, 900];
const lage: Record<number, any> = {};
for (const b of BREITEN) lage[b] = await beiBreite(b);

console.log('\n1 · Die Konstante ist die Grenze, und sie ist 760');
gleich('KONSTANTEN.TELEFON_BREITE steht auf 760', lage[390].konstante, 760);
/* Sie muss zur CSS passen — `max-width: 760px` schliesst 760 EIN. */
p('Bei genau 760 px gilt noch Telefon',
  lage[760].cssSagt === true && lage[760].appSagt === true,
  `CSS ${lage[760].cssSagt}, App ${lage[760].appSagt}`);
p('Bei 761 px nicht mehr',
  lage[761].cssSagt === false && lage[761].appSagt === false,
  `CSS ${lage[761].cssSagt}, App ${lage[761].appSagt}`);

console.log('\n2 · Alle drei Antworten sagen dasselbe');
/* Vorher: bei 730 sagte die CSS „Telefon", `AppEinstellung` sagte „Telefon"
   (768), und die Seitenleiste verhielt sich wie am Rechner (700). */
for (const b of BREITEN) {
  const l = lage[b];
  p(`${b} px: Konstante, UI und CSS stimmen überein`,
    l.appSagt === l.cssSagt && l.uiSagt === l.cssSagt,
    `App ${l.appSagt}, UI ${l.uiSagt}, CSS ${l.cssSagt}`);
}

console.log('\n3 · Nie beide Entwürfe gleichzeitig');
/* DER PUNKT. Telefonleisten UND feste Seitenleiste zusammen heisst: die
   Pillen liegen über dem Logo, die untere Leiste über „Neuer Chat".
   Genau das war zwischen 701 und 760 px der Fall. */
for (const b of BREITEN) {
  const l = lage[b];
  const telefon = l.leisteOben || l.leisteUnten;
  const rechnerLeiste = l.seitenleiste === 'relative' || l.seitenleiste === 'static';
  p(`${b} px: nicht Telefonleisten UND Rechner-Seitenleiste`,
    !(telefon && rechnerLeiste),
    `Leisten ${telefon ? 'da' : 'weg'}, Seitenleiste ${l.seitenleiste}`);
}

console.log('\n4 · Und jede Breite hat genau einen Entwurf');
for (const b of BREITEN) {
  const l = lage[b];
  const telefon = l.leisteOben && l.leisteUnten;
  p(`${b} px: ${l.cssSagt ? 'Telefon' : 'Rechner'} — und zwar ganz`,
    l.cssSagt ? (telefon && l.seitenleiste === 'fixed')
              : (!l.leisteOben && !l.leisteUnten),
    `oben ${l.leisteOben}, unten ${l.leisteUnten}, Leiste ${l.seitenleiste}`);
}

console.log('\n4b · Die Schublade beginnt unter den Pillen, nicht dahinter');
/* DIESELBE LEHRE, EINE REGEL WEITER OBEN. Bei `#main` steht sie seit E58
   im Kommentar: „`--hoben` STATT EINER ZAHL. Hier stand `60px`, und die
   Leiste darüber war 76 px hoch." Angewandt war sie dort — und bei der
   Schublade nicht: sie begann bei 60, die Leiste endet bei 80.
   Die obersten 20 px waren die Zeile „Suchen", halb dahinter. Am iPhone,
   wo die Kerbe 47 px dazulegt, wären es anderthalb Zeilen. */
const schublade = await browser.newPage({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
schublade.on('pageerror', e => fehler.push('Schublade: ' + e.message));
await schublade.goto(`http://localhost:${PORT}/index.html`);
await schublade.waitForTimeout(1800);
const sl = await schublade.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  document.body.classList.add('side-offen');
  const sb = document.getElementById('sidebar');
  sb?.classList.remove('collapsed');
  const oben = document.getElementById('handy-oben');
  const r = sb?.getBoundingClientRect();
  const ro = oben?.getBoundingClientRect();
  /* Und die erste SICHTBARE Zeile darin — sie ist es, die verschwand.
     Nicht einfach `querySelector`: die Logozeile steht auch im Blatt, ist
     am Telefon aber ausgeblendet und meldet trotzdem ein Rechteck bei 0.
     Der erste Anlauf mass sie und meldete „N Redion beginnt bei 0 px" —
     ein roter Punkt für ein Element, das niemand sieht. */
  const sichtbareZeilen = [...(sb?.querySelectorAll('button, a') ?? [])]
    .filter(el => {
      const st = getComputedStyle(el);
      const rr = el.getBoundingClientRect();
      return st.display !== 'none' && st.visibility !== 'hidden' && rr.height > 8;
    })
    .sort((a, b2) => a.getBoundingClientRect().top - b2.getBoundingClientRect().top);
  /* Die LETZTE sichtbare Zeile — sie ist es, die seit E236 verschwinden
     könnte, weil die Leiste unten steht. */
  const letzteZeile = sichtbareZeilen[sichtbareZeilen.length - 1];
  const rz = letzteZeile?.getBoundingClientRect();
  return {
    leisteUnten: ro ? Math.round(ro.bottom) : -1,
    leisteOben: ro ? Math.round(ro.top) : -1,
    schubladeOben: r ? Math.round(r.top) : -1,
    schubladeUnten: r ? Math.round(r.bottom) : -1,
    letzteZeileUnten: rz ? Math.round(rz.bottom) : -1,
    zeileText: (letzteZeile?.textContent ?? '').trim().slice(0, 24),
    zTiefe: sb ? Number(getComputedStyle(sb).zIndex) : -1,
    zLeiste: oben ? Number(getComputedStyle(oben).zIndex) : -1
  };
});
await schublade.close();

p('Die Pillenleiste liegt über der Schublade',
  (sl as any).zLeiste > (sl as any).zTiefe,
  `Leiste ${(sl as any).zLeiste}, Schublade ${(sl as any).zTiefe}`);
/* SEIT E236 STEHT DIE LEISTE UNTEN — und damit dreht sich diese Messung um.
   Die Frage ist dieselbe geblieben und die einzige, die zählt: verdeckt
   die Schublade einen Weg, oder liegt sie sauber daneben?

   Vorher: die Schublade musste UNTER der Leiste beginnen.
   Jetzt: sie muss ÜBER ihr enden — ihre letzte Zeile darf die Leiste nicht
   erreichen, sonst tippt man auf „Heute" und trifft die Schublade.

   Der Fund, der diesen Punkt entstehen liess, gilt unverändert: die Leiste
   rechnet die Kerbe des Geräts mit, die Schublade muss es auch. */
p('Die Schublade endet über der Wegeleiste',
  (sl as any).schubladeUnten <= (sl as any).leisteOben,
  `Schublade endet bei ${(sl as any).schubladeUnten} px, ` +
  `die Leiste beginnt bei ${(sl as any).leisteOben} px`);
p('… und ihre letzte Zeile liegt ganz darüber',
  (sl as any).letzteZeileUnten <= (sl as any).leisteOben,
  `„${(sl as any).zeileText}" endet bei ${(sl as any).letzteZeileUnten} px, ` +
  `die Leiste beginnt bei ${(sl as any).leisteOben} px`);

console.log('\n5 · Im Quelltext steht keine zweite Grenze mehr');
/* Sechs `matchMedia('(max-width: 700px)')` im TypeScript und drei
   `@media(max-width:700px)` in der CSS waren die Quelle des Bandes. */
const suche = (ordner: string, endung: RegExp): string[] => {
  const treffer: string[] = [];
  const geh = (o: string) => {
    for (const e of fs.readdirSync(o, { withFileTypes: true })) {
      const voll = path.join(o, e.name);
      if (e.isDirectory()) { geh(voll); continue; }
      if (!endung.test(e.name)) continue;
      const t = fs.readFileSync(voll, 'utf8');
      /* Nur echte Grenzen, keine Kommentare, die die alte Zahl erklären. */
      t.split('\n').forEach((z, i) => {
        if (/^\s*(\/\*|\*|\/\/)/.test(z)) return;
        if (/max-width:\s*700px/.test(z))
          treffer.push(`${path.relative(WURZEL, voll)}:${i + 1}`);
      });
    }
  };
  geh(path.join(WURZEL, ordner));
  return treffer;
};
const imTs = suche('src', /\.ts$/);
const imCss = suche('quell/schale/stil', /\.css$/);
p('Kein `max-width: 700px` mehr im TypeScript', imTs.length === 0, imTs.join(', '));
p('… und keines in der CSS', imCss.length === 0, imCss.join(', '));

console.log('\n6 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 105 — Eine Telefongrenze: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
