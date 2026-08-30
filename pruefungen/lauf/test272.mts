/* Suite 272 — Kein Griff geht verloren (E272, Premium-Schale)
 * ============================================================================
 * Die Schale wird umgebaut: Menüband mit neun Reitern, ein Reiter „Gehen"
 * statt der Seitenleiste, eine Kontextkante am linken Rand, „Datei" als
 * Backstage-Fläche. Alles Sichtbare ändert sich.
 *
 * Genau deshalb gibt es diesen Lauf. Er prüft NICHT, wie es aussieht — dafür
 * sind test247 und test248 da. Er prüft das eine, was ein Umbau der Schale
 * lautlos kaputtmachen kann und was danach niemand vermisst, bis er es
 * braucht: DASS JEDER FUNKTIONSGRIFF NOCH ERREICHBAR IST.
 *
 * Der Masterprompt nennt es §2.1, CLAUDE.md §46 sagt es kürzer: Funktionen
 * zuerst, Aussehen danach. Die Umzugsliste dazu steht in
 * doku/PREMIUM-SHELL-MATRIX.md.
 *
 * Der Lauf ist ABSICHTLICH schon vor dem Umbau grün. Er misst den Bestand von
 * heute; wächst das Band in den Phasen D–F, wachsen die Zahlen mit, und ein
 * verlorener Eintrag wird rot. Ein Netz, das man erst nach dem Sturz spannt,
 * ist keines.
 *
 * §1  Jeder Bandeintrag ist vollständig — Kennung, Name, Zeichen, lebendes tun.
 * §2  Keine Kennung zweimal.
 * §3  Jedes Modul aus `Register.module` hat einen lebenden Griff.
 * §4  Der Reiter „Einfügen" deckt `Register.bloecke` vollständig.
 * §5  Die acht Elektro-Griffe sind über `inReiter('elektro')` erreichbar.
 * §6  Kein Reiter ist leer, und das Band zeigt genau die Reiter des Registers.
 * §7  Die zwölf Stellen, an denen der Umbau lautlos brechen kann.
 * §8  Gegenproben — kann dieser Lauf überhaupt rot werden?
 * §9  Bau-Hygiene.
 * §10 Die Gold-Marken sind gerechnet, nicht geschätzt.
 * §11 Die 15er-Regel — und nichts geht dabei verloren.
 * §12 „Gehen" deckt die Register, und der Schauplatz sagt, wo man ist.
 *
 *   node pruefungen/lauf/test272.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Register: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9050;

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
const lies = (rel: string): string =>
  fs.existsSync(path.join(WURZEL, rel))
    ? fs.readFileSync(path.join(WURZEL, rel), 'utf8') : '';

console.log('\nSuite 272 — Kein Griff geht verloren (E272)');

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof App !== 'undefined' &&
  typeof (window as any).Register !== 'undefined' &&
  !!(window as any).Register?.menueband,
  null, { timeout: 30000 });
await seite.waitForTimeout(1100);

/* EINE OFFENE SEITE IST BEDINGUNG, NICHT KULISSE.
   `BRAUCHT_SEITE` (register/menueband.ts:647) streicht ohne offene Seite die
   Reiter start, einfuegen und zeichnen KOMPLETT — von 117 Einträgen sähe der
   Lauf dann 22 und wäre trotzdem grün gewesen. Gemessen, nicht geschätzt. */
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const s = Store.addPage(null, { text: 'Ohmsches Gesetz' });
  Store.addBlock(s.id, 'text', { text: 'U = R · I' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(700);

/* ==========================================================================
 * §1 — Jeder Bandeintrag ist vollständig
 * ========================================================================*/
console.log('\n1 · Jeder Eintrag hat Kennung, Name, Zeichen und ein lebendes tun');

const alle = await seite.evaluate(() => {
  const raus: any[] = [];
  for (const r of Register.menueband.reiter()) {
    for (const g of Register.menueband.inReiter(r.id)) {
      for (const e of g.eintraege) {
        raus.push({
          reiter: r.id, gruppe: g.gruppe, id: String(e.id ?? ''),
          name: String(e.name ?? ''), zeichen: String(e.zeichen ?? ''),
          hatProbe: !!e.probe, tunArt: typeof e.tun
        });
      }
    }
  }
  return raus;
}) as { reiter: string; gruppe: string; id: string; name: string;
        zeichen: string; hatProbe: boolean; tunArt: string }[];

p('Das Band liefert überhaupt Einträge', alle.length > 0, String(alle.length));
console.log('    (gezählt: ' + alle.length + ' Einträge in ' +
  new Set(alle.map(e => e.reiter)).size + ' Reitern)');

const ohneId = alle.filter(e => !e.id);
p('Jeder Eintrag hat eine Kennung', ohneId.length === 0,
  ohneId.map(e => e.reiter + '/' + e.gruppe).join(', '));

const ohneName = alle.filter(e => !e.name.trim());
p('Jeder Eintrag hat einen hörbaren Namen', ohneName.length === 0,
  ohneName.map(e => e.id).join(', '));

/* Ein Farbtupfer trägt kein Zeichen, sondern eine `probe` — das ist erlaubt
   und ausdrücklich so gebaut (register/menueband.ts:65-72). Nur wer WEDER
   Zeichen NOCH Probe hat, steht als leerer Knopf da. */
const ohneBild = alle.filter(e => !e.zeichen && !e.hatProbe);
p('Jeder Eintrag zeigt ein Zeichen oder eine Probe', ohneBild.length === 0,
  ohneBild.map(e => e.id).join(', '));

const ohneTun = alle.filter(e => e.tunArt !== 'function');
p('Jedes tun ist wirklich eine Funktion', ohneTun.length === 0,
  ohneTun.map(e => e.id + ':' + e.tunArt).join(', '));

/* ==========================================================================
 * §2 — Keine Kennung zweimal
 * ========================================================================*/
console.log('\n2 · Keine Kennung zweimal');

const gesehen = new Map<string, string[]>();
for (const e of alle) {
  const liste = gesehen.get(e.id) ?? [];
  liste.push(e.reiter + '/' + e.gruppe);
  gesehen.set(e.id, liste);
}
const doppelt = [...gesehen.entries()].filter(([, wo]) => wo.length > 1);
p('Keine Bandkennung kommt doppelt vor', doppelt.length === 0,
  doppelt.map(([id, wo]) => id + ' (' + wo.join(' + ') + ')').join('; '));

/* ==========================================================================
 * §3 — Jedes Modul hat einen lebenden Griff
 * ========================================================================*/
console.log('\n3 · Jedes Modul aus Register.module hat einen lebenden Griff');

const module_ = await seite.evaluate(() => {
  const raus: any[] = [];
  for (const m of Register.module.alle()) {
    raus.push({ id: String(m.id ?? ''), name: String(m.name ?? ''),
                tunArt: typeof m.oeffnen });
  }
  return raus;
}) as { id: string; name: string; tunArt: string }[];

p('Das Modulregister ist gefüllt', module_.length > 0, String(module_.length));
console.log('    (gezählt: ' + module_.length + ' Module)');
const moduleOhneGriff = module_.filter(m => m.tunArt !== 'function');
p('Jedes Modul lässt sich öffnen', moduleOhneGriff.length === 0,
  moduleOhneGriff.map(m => m.id + ':' + m.tunArt).join(', '));

/* ==========================================================================
 * §4 — Einfügen deckt das Blockregister
 * ========================================================================*/
console.log('\n4 · Der Reiter „Einfügen" deckt Register.bloecke vollständig');

const deckung = await seite.evaluate(() => {
  const imBand = new Set<string>();
  for (const g of Register.menueband.inReiter('einfuegen'))
    for (const e of g.eintraege) imBand.add(String(e.id ?? ''));
  const fehlend: string[] = [];
  let erwartet = 0;
  for (const b of Register.bloecke.alle()) {
    if (!b || !b.id || b.aktion) continue;   /* Aktionen sind keine Blockarten */
    erwartet++;
    if (!imBand.has('blk-' + b.id)) fehlend.push(String(b.id));
  }
  return { erwartet, fehlend, imBand: imBand.size };
}) as { erwartet: number; fehlend: string[]; imBand: number };

p('Das Blockregister ist gefüllt', deckung.erwartet > 0, String(deckung.erwartet));
console.log('    (gezählt: ' + deckung.erwartet + ' Blockarten, ' +
  deckung.imBand + ' Einträge im Reiter)');
p('Jede Blockart steht im Reiter „Einfügen"', deckung.fehlend.length === 0,
  deckung.fehlend.join(', '));

/* ==========================================================================
 * §5 — Die Elektro-Griffe
 * ========================================================================*/
console.log('\n5 · Die Elektro-Griffe bleiben über inReiter(\'elektro\') erreichbar');

/* WARUM DAS EIN EIGENER PARAGRAPH IST: Redur hat entschieden, dass es keinen
   eigenen Elektro-Reiter im Band gibt. Die acht Einträge behalten trotzdem
   `reiter: 'elektro'` — weil `bereiche/elektro/start.ts:64-66` seine acht
   Kacheln daraus liest. Wer beim Umbau das Feld ändert statt der Reiterliste,
   leert die Elektro-Startseite, und kein anderer Lauf merkt es. */
const elektro = await seite.evaluate(() => {
  const raus: string[] = [];
  for (const g of Register.menueband.inReiter('elektro'))
    for (const e of g.eintraege) raus.push(String(e.id ?? ''));
  return raus;
}) as string[];

console.log('    (gefunden: ' + elektro.length + ' Einträge)');
for (const id of ['e-rechner', 'e-formelheft', 'e-dreieck', 'e-sinus',
                  'e-ueben', 'e-pruefung', 'e-arbeitsplatz', 'e-plan'])
  p('„' + id + '" ist über inReiter(\'elektro\') erreichbar', elektro.includes(id));

/* ==========================================================================
 * §6 — Kein Reiter ist leer
 * ========================================================================*/
console.log('\n6 · Kein Reiter ist leer, und das Band zeigt die Reiter des Registers');

const reiterZahlen = await seite.evaluate(() => {
  const raus: Record<string, number> = {};
  for (const r of Register.menueband.reiter()) {
    let n = 0;
    for (const g of Register.menueband.inReiter(r.id)) n += g.eintraege.length;
    raus[String(r.id)] = n;
  }
  return raus;
}) as Record<string, number>;

for (const [id, n] of Object.entries(reiterZahlen)) {
  console.log('    ' + id.padEnd(12) + String(n).padStart(3) + ' Einträge');
  p('Der Reiter „' + id + '" ist nicht leer', n > 0);
}

const imBildschirm = await seite.evaluate(() =>
  [...document.querySelectorAll('#menueband [role="tab"]')]
    .map(k => String((k as HTMLElement).dataset['mbReiter'] ?? '')));
p('Das Band zeigt genau die Reiter des Registers',
  imBildschirm.length === Object.keys(reiterZahlen).length &&
  imBildschirm.every(id => id in reiterZahlen),
  'Bildschirm: ' + imBildschirm.join(',') +
  ' | Register: ' + Object.keys(reiterZahlen).join(','));

/* ==========================================================================
 * §7 — Die Stellen, an denen der Umbau lautlos brechen kann
 * ========================================================================*/
console.log('\n7 · Was beim Umbau lautlos brechen kann (doku/PREMIUM-SHELL-MATRIX.md, Teil 6)');

const dom = await seite.evaluate(() => ({
  crumb: !!document.getElementById('crumb'),
  page: !!document.getElementById('page'),
  komm: !!document.getElementById('btn-komm'),
  auto: !!document.getElementById('btn-auto'),
  zumInhalt: (document.getElementById('zum-inhalt') as HTMLAnchorElement | null)?.getAttribute('href') ?? '',
  ruhigBleibt: document.querySelectorAll('[data-ruhig="bleibt"]').length,
  ruhigMehr: document.querySelectorAll('[data-ruhig="mehr"]').length,
  ruhigSchalter: document.querySelectorAll('[data-ruhig="schalter"]').length
})) as { crumb: boolean; page: boolean; komm: boolean; auto: boolean;
         zumInhalt: string; ruhigBleibt: number; ruhigMehr: number; ruhigSchalter: number };

/* Kopfleiste.pfad() steigt bei `if (!c) return` aus, wenn #crumb fehlt — und
   danach zeichnet niemand mehr btn-fav, btn-komm, btn-lock und btn-auto. */
p('#crumb steht noch da (sonst verstummen vier Kopfknöpfe)', dom.crumb);
/* Das Seitenmenü führt zwei Einträge über einen Klick auf diese zwei Knöpfe
   aus (schale.ts:604/605). Ohne sie sterben zwei Menüeinträge mit. */
p('#btn-komm steht noch da (das Seitenmenü klickt ihn an)', dom.komm);
p('#btn-auto steht noch da (das Seitenmenü klickt ihn an)', dom.auto);
/* Die Sprungmarke für die Tastatur ist nur bei Fokus sichtbar — ein falsches
   Ziel merkt sonst niemand. */
p('#page heisst noch #page (Ziel der Sprungmarke)', dom.page);
p('Die Sprungmarke zeigt auf #page', dom.zumInhalt === '#page', dom.zumInhalt);
/* Die ruhige Fassung lebt ausschliesslich im Markup; ruhig.ts setzt nur das
   Attribut am body. Wer Knöpfe umbaut und die Marken vergisst, hat einen
   Mehr-Knopf, der nichts mehr ausblendet — ohne jeden Fehler. */
p('Die Marken der ruhigen Fassung sind noch am Markup',
  dom.ruhigBleibt > 0 && dom.ruhigMehr > 0 && dom.ruhigSchalter > 0,
  'bleibt ' + dom.ruhigBleibt + ', mehr ' + dom.ruhigMehr +
  ', schalter ' + dom.ruhigSchalter);

/* Die zwei toten Verdrahtungen aus der Matrix. Sie sind HEUTE tot; der Lauf
   hält fest, dass sie es sind, damit Phase J sie wirklich entfernt und nicht
   nur verschiebt. Wird die Zeile gelöscht UND das Element bleibt fort, dreht
   sich diese Prüfung in Phase J um. */
const schaleJs = lies('quell/schale/aufbau/schale.js');
const indexHtml = lies('index.html');
p('Die tote Verdrahtung hl-seiten ist noch beschrieben, nicht heimlich weg',
  schaleJs.includes('hl-seiten') === !indexHtml.includes('id="hl-seiten"'),
  'Verdrahtung und Markup müssen zusammen gehen oder zusammen fehlen');

/* ==========================================================================
 * §8 — Gegenproben (§55.2)
 * ========================================================================*/
console.log('\n8 · Die Gegenproben — kann dieser Lauf überhaupt rot werden?');

/* (a) Ein untergeschobener Eintrag ohne tun muss in §1 auffallen.
   NICHT ueber `melde()` — das prueft `typeof tun === 'function'` selbst und
   weist den Eintrag ab (register/menueband.ts:609). Der ungeprueften Weg ist
   `meldeLieferant()`: was ein Lieferant zurueckgibt, wandert bei :654
   ungefiltert in `alle()`. Das ist zugleich der Befund — die zwei Wege sind
   verschieden streng.

   Der Lieferant entwaffnet sich selbst ueber eine Schaltmarke, weil es fuer
   Lieferanten kein `nimmZurueck` gibt. Ein Prueflauf, der das Register
   verschmutzt zuruecklaesst, macht den naechsten Paragraphen rot. */
const gegenTun = await seite.evaluate(() => {
  (window as any).__gegenprobe272 = true;
  Register.menueband.meldeLieferant(() => (window as any).__gegenprobe272
    ? [{ reiter: 'ansicht', gruppe: 'Gegenprobe', id: 'gegenprobe-ohne-tun',
         name: 'Gegenprobe', zeichen: 'dots', tun: null }]
    : []);
  let gefunden = false;
  for (const g of Register.menueband.inReiter('ansicht'))
    for (const e of g.eintraege)
      if (e.id === 'gegenprobe-ohne-tun') gefunden = typeof e.tun !== 'function';
  (window as any).__gegenprobe272 = false;
  return gefunden;
}) as boolean;
p('Gegenprobe: ein Eintrag ohne tun waere in §1 aufgefallen', gegenTun,
  'dann prueft §1 gar nichts');

/* (b) Und er ist danach wirklich weg — sonst haette die Gegenprobe selbst
   einen Eintrag hinterlassen und §2 beim naechsten Lauf rot gemacht. */
const wiederWeg = await seite.evaluate(() => {
  for (const g of Register.menueband.inReiter('ansicht'))
    for (const e of g.eintraege)
      if (e.id === 'gegenprobe-ohne-tun') return false;
  return true;
}) as boolean;
p('… und der Lieferant hat sich selbst entwaffnet', wiederWeg);

/* (c) Eine erfundene Blockart muss §4 rot machen. Dasselbe Muster wie
   test122:109-118 gegen das Formelregister. */
const gegenBlock = await seite.evaluate(() => {
  Register.bloecke.melde({ id: 'gibtesnicht', name: 'Gibt es nicht',
                           gruppe: 'Grundlegend', icon: '▫' });
  const imBand = new Set<string>();
  for (const g of Register.menueband.inReiter('einfuegen'))
    for (const e of g.eintraege) imBand.add(String(e.id ?? ''));
  /* Wenn `melde` den Eintrag aufnimmt, MUSS er auch im Band stehen — dann
     misst §4 wirklich die Deckung und nicht eine leere Menge. */
  const kennt = Register.bloecke.alle().some((b: any) => b && b.id === 'gibtesnicht');
  Register.bloecke.nimmZurueck('gibtesnicht');
  return { kennt, imBand: imBand.has('blk-gibtesnicht') };
}) as { kennt: boolean; imBand: boolean };
p('Gegenprobe: eine nachgemeldete Blockart erscheint in „Einfügen"',
  !gegenBlock.kennt || gegenBlock.imBand,
  'das Blockregister kennt sie, das Band zeigt sie nicht — §4 misst dann nichts');

/* (d) Und die Zählung selbst: ein Reiter, den es nicht gibt, liefert nichts. */
const leererReiter = await seite.evaluate(() =>
  Register.menueband.inReiter('gibtesnicht').length) as number;
p('Gegenprobe: ein erfundener Reiter liefert keine Gruppen', leererReiter === 0);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

/* ==========================================================================
 * §9 — Bau-Hygiene
 * ========================================================================*/
console.log('\n9 · Bau-Hygiene');
p('Die Umzugsliste liegt in der Doku',
  lies('doku/PREMIUM-SHELL-MATRIX.md').includes('Premium-Schale'));
p('… und nennt die gemessene Zahl der Bandeinträge',
  /\b141\b/.test(lies('doku/PREMIUM-SHELL-MATRIX.md')));
p('ENTSCHEIDUNGEN.md hält E272 fest',
  /^E272 — /m.test(lies('ENTSCHEIDUNGEN.md')));

/* ==========================================================================
 * §10 — Die Gold-Marken sind gerechnet, nicht geschätzt (E272 Phase B)
 * ========================================================================*/
console.log('\n10 · Die Gold-Marken (E272)');

/* WARUM DAS HIER STEHT UND NICHT IN test245: dort wird am laufenden Bild
   gemessen — was nichts einfärbt, hat auch nichts zu messen. Die Gold-Marken
   sind in Phase B eingeführt und in Phase C erst benutzt. Zwischen beiden
   liegt genau die Lücke, in der sich ein unlesbarer Wert einnisten kann.

   Gemessen werden deshalb die WERTE, die der Browser für `:root` liefert —
   in beiden Themen, mit derselben WCAG-Rechnung wie test127 und test245. */

const wcag = (a: string, b: string): number => {
  const kanal = (x: number): number => {
    const c = x / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const licht = (h: string): number => {
    const t = h.trim().replace('#', '');
    const v = t.length === 3 ? t.split('').map(c => c + c).join('') : t;
    const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16),
          bl = parseInt(v.slice(4, 6), 16);
    return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(bl);
  };
  const la = licht(a), lb = licht(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const markenLesen = async (thema: string) => {
  await seite.evaluate((t: string) =>
    document.documentElement.setAttribute('data-theme', t), thema);
  await seite.waitForTimeout(250);
  return await seite.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    const w = (n: string): string => s.getPropertyValue(n).trim();
    return {
      gold: w('--gold'), bright: w('--gold-bright'), deep: w('--gold-deep'),
      tinte: w('--gold-tinte'), bg: w('--bg'), karte: w('--bg-card'),
      schale: w('--schale-grund'), schaleText: w('--schale-text'),
      schaleStill: w('--schale-still')
    };
  }) as Record<string, string>;
};

for (const thema of ['light', 'dark']) {
  const m = await markenLesen(thema);
  const wo = thema === 'light' ? 'Hellmodus' : 'Dunkelmodus';

  p(wo + ': die vier Gold-Marken sind da',
    !!m['gold'] && !!m['bright'] && !!m['deep'] && !!m['tinte'],
    JSON.stringify(m));

  /* GOLD ALS TINTE muss 4,5 schaffen — auf dem Grund UND auf der Karte.
     Genau hier scheiterte im Hellmodus der Entwurfswert #caa85e mit 2,26;
     deshalb gibt es `--gold-tinte` überhaupt. */
  const tinteGrund = wcag(m['tinte'] ?? '#000', m['bg'] ?? '#fff');
  const tinteKarte = wcag(m['tinte'] ?? '#000', m['karte'] ?? '#fff');
  p(wo + ': --gold-tinte ist auf dem Grund lesbar', tinteGrund >= 4.5,
    tinteGrund.toFixed(2) + ' — nötig 4,5');
  p(wo + ': --gold-tinte ist auch auf der Karte lesbar', tinteKarte >= 4.5,
    tinteKarte.toFixed(2) + ' — nötig 4,5');

  /* GOLD ALS RAHMEN braucht 3,0 (Bedienelement), nicht 4,5. */
  const deepKarte = wcag(m['deep'] ?? '#000', m['karte'] ?? '#fff');
  p(wo + ': --gold-deep taugt als Rahmen und Fokusring', deepKarte >= 3.0,
    deepKarte.toFixed(2) + ' — nötig 3,0');

  /* DIE SCHALENFLÄCHE ist in beiden Themen dieselbe dunkle Fläche. Ihre
     Schrift und der aktive Reiter müssen darauf lesbar sein. */
  const st = wcag(m['schaleText'] ?? '#fff', m['schale'] ?? '#000');
  const ss = wcag(m['schaleStill'] ?? '#fff', m['schale'] ?? '#000');
  const br = wcag(m['bright'] ?? '#fff', m['schale'] ?? '#000');
  p(wo + ': --schale-text ist auf der Schalenfläche lesbar', st >= 4.5,
    st.toFixed(2));
  p(wo + ': --schale-still reicht für Gruppentitel', ss >= 4.5, ss.toFixed(2));
  p(wo + ': --gold-bright trägt den aktiven Reiter', br >= 4.5, br.toFixed(2));
}

/* GEGENPROBE: die Rechnung selbst. Zwei Werte, deren Verhältnis bekannt ist —
   Schwarz auf Weiss sind 21, Weiss auf Weiss ist 1. Ohne diesen Punkt könnte
   `wcag` immer 21 liefern und alle Prüfungen oben wären dauerhaft grün. */
p('Gegenprobe: die Kontrastrechnung rechnet wirklich',
  Math.abs(wcag('#000000', '#ffffff') - 21) < 0.01 &&
  Math.abs(wcag('#ffffff', '#ffffff') - 1) < 0.01,
  wcag('#000000', '#ffffff').toFixed(2) + ' / ' + wcag('#ffffff', '#ffffff').toFixed(2));

/* Und die Masse der Schale — sie stehen modusfrei in grund.css. */
const masse = await seite.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return ['--shell-reiter-h', '--shell-band-h', '--kante-b', '--kante-knopf',
          '--kanten-lade-b', '--backstage-nav-b']
    .map(n => n + '=' + s.getPropertyValue(n).trim());
}) as string[];
p('Die sechs Masse der Schale sind gesetzt',
  masse.every(x => /=\d+px$/.test(x)), masse.join(' · '));
console.log('    ' + masse.join(' · '));

await seite.evaluate(() => document.documentElement.removeAttribute('data-theme'));

/* ==========================================================================
 * §11 — Die 15er-Regel, bei jeder Breite und in jedem Reiter (E272 Phase D)
 * ========================================================================*/
console.log('\n11 · Die 15er-Regel (E272)');

/* WARUM MEHRERE BREITEN. test247 misst die Bandhöhe bei EINER Fensterbreite
   — 1440 —, und genau dort passte „Start" zufällig in eine Zeile. Bei 1280
   und 1366 waren es 223 px statt 143. Der Kommentar dort warnt sogar vor
   dieser Kippkante und misst dann selbst nur eine Seite davon (L88).

   Hier wird deshalb über drei Breiten und alle Reiter gemessen. Und nicht
   nur die Höhe: dass ein Befehl aus dem Band verschwindet, ist nur dann in
   Ordnung, wenn er im „•••" wieder auftaucht. */

const bandLage = async (breite: number, reiter: string) => {
  await seite.setViewportSize({ width: breite, height: 950 });
  await seite.waitForTimeout(160);
  await seite.evaluate((r: string) => {
    Store.setMeta('bandZu', false);
    Store.setMeta('bandZu:welt', false);
    Store.setMeta('bandReiter', r);
    (window as any).Menueband.zeichne();
  }, reiter);
  /* Zwei Bilder abwarten: der Überlauf misst per rAF, und vorher stehen die
     Zeichen noch nicht im Baum — dann sind die Knöpfe schmaler, als sie
     werden. Genau dieser Fehler steckte im ersten Entwurf. */
  await seite.evaluate(() => new Promise<void>(f =>
    requestAnimationFrame(() => requestAnimationFrame(() => f()))));
  await seite.waitForTimeout(120);
  return await seite.evaluate(() => {
    const w = document.getElementById('menueband');
    const band = w?.querySelector('.mb-band') as HTMLElement | null;
    const knoepfe = band
      ? [...band.querySelectorAll('.mb-knopf[data-band]')] as HTMLElement[] : [];
    const probe = (k: HTMLElement): boolean => !!k.querySelector('.mb-probe');
    const sichtbar = knoepfe.filter(k => !k.hidden);
    const letzte = sichtbar[sichtbar.length - 1];
    const stil = band ? getComputedStyle(band) : null;
    const innenRechts = band && stil
      ? band.getBoundingClientRect().right - (parseFloat(stil.paddingRight) || 0)
      : 0;
    return {
      hoch: Math.round(w?.getBoundingClientRect().height || 0),
      bandHoch: Math.round(band?.getBoundingClientRect().height || 0),
      alle: knoepfe.length,
      sichtbar: sichtbar.length,
      befehleSichtbar: sichtbar.filter(k => !probe(k)).length,
      verborgen: knoepfe.filter(k => k.hidden).map(k => k.dataset['band'] || ''),
      mehrDa: !(w?.querySelector('.mb-mehr') as HTMLElement | null)?.hidden,
      /* Steht der letzte sichtbare Knopf noch INNERHALB des Bandes? */
      ueberstand: letzte
        ? Math.round(letzte.getBoundingClientRect().right - innenRechts) : 0,
      /* UND DIE ZWEITE FRAGE, die die erste nicht beantwortet: steht
         ÜBERHAUPT etwas über den Rand?
         `ueberstand` misst den letzten Knopf, dessen `hidden` false ist.
         Wirkt `hidden` aber gar nicht — weil eine CSS-Regel `display`
         setzt und das Browser-Stilblatt schlägt —, dann stehen die
         verborgenen Knöpfe sichtbar da und der gemessene ist trotzdem
         brav am Platz. Genau dieser Fehler war in Phase D wirklich drin,
         und die Gegenprobe dazu blieb grün.
         `scrollWidth` beantwortet die Frage, für die es taugt: ragt
         Inhalt über den Kasten hinaus? */
      randUeberlauf: band ? Math.max(0, band.scrollWidth - band.clientWidth) : 0
    };
  });
};

const REITER_ALLE = ['gehen', 'start', 'einfuegen', 'zeichnen', 'verlauf',
                     'ueberpruefen', 'ansicht', 'hilfe'];
let zuHoch = 0, zuViele = 0, ueberstehend = 0, ohneMehr = 0, gemessen = 0;
let randRaus = 0;

/* 2400 IST KEIN ZIERWERT, SONDERN DER EINZIGE, BEI DEM DIE 15er-REGEL
   ÜBERHAUPT MESSBAR IST. Bei 1280 bis 1440 greift immer schon die Breite:
   mehr als zwölf Knöpfe passen dort gar nicht nebeneinander, und die Zahl
   15 wird nie erreicht. Die Gegenprobe zeigte es — `HOECHSTENS` auf 99
   gesetzt, und der Lauf blieb grün: die Prüfung konnte nicht rot werden
   und prüfte damit nichts (§55.2).
   Auf einem breiten Bildschirm passen rund zwanzig; dort entscheidet
   wirklich die Regel und nicht der Platz. */
for (const breite of [1280, 1366, 1440, 2400]) {
  for (const r of REITER_ALLE) {
    const m = await bandLage(breite, r);
    if (!m.alle) continue;          /* ein Reiter ohne Knöpfe hat nichts zu messen */
    gemessen++;
    if (m.hoch > 130) { zuHoch++; console.log(`    zu hoch: ${breite}px ${r} = ${m.hoch}px`); }
    if (m.befehleSichtbar > 15) { zuViele++; console.log(`    zu viele: ${breite}px ${r} = ${m.befehleSichtbar}`); }
    if (m.ueberstand > 2) { ueberstehend++; console.log(`    steht über: ${breite}px ${r} = ${m.ueberstand}px`); }
    if (m.verborgen.length && !m.mehrDa) { ohneMehr++; console.log(`    verborgen ohne „•••": ${breite}px ${r}`); }
    if (m.randUeberlauf > 1) { randRaus++; console.log(`    ragt über den Rand: ${breite}px ${r} = ${m.randUeberlauf}px`); }
  }
}

p('Es wurde wirklich über alle Reiter und Breiten gemessen', gemessen >= 20,
  String(gemessen) + ' Messungen');
p('Das Band bleibt in EINER Zeile — bei 1280, 1366 und 1440', zuHoch === 0,
  String(zuHoch) + ' Fälle über 130 px');
p('Nie mehr als fünfzehn Befehle sichtbar', zuViele === 0,
  String(zuViele) + ' Fälle');
p('Kein sichtbarer Knopf steht über den Rand hinaus', ueberstehend === 0,
  String(ueberstehend) + ' Fälle');
p('Wo etwas verborgen ist, steht auch das „•••"', ohneMehr === 0,
  String(ohneMehr) + ' Fälle');
p('Und nichts ragt über den Rand des Bandes hinaus', randRaus === 0,
  String(randRaus) + ' Fälle');

/* UND DER EIGENTLICHE PUNKT: was aus dem Band verschwindet, ist im „•••"
   wieder da. Ohne diese Zeile wäre die 15er-Regel eine Löschregel. */
await seite.setViewportSize({ width: 1280, height: 950 });
const imMehr = await (async () => {
  const m = await bandLage(1280, 'einfuegen');
  await seite.click('#menueband .mb-mehr');
  await seite.waitForTimeout(260);
  const inLade = await seite.evaluate(() =>
    [...document.querySelectorAll('#mb-mehr-lade [data-band]')]
      .map(b => (b as HTMLElement).dataset['band'] || ''));
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(160);
  return { verborgen: m.verborgen, inLade };
})();
p('Der Reiter „Einfügen" verbirgt überhaupt etwas', imMehr.verborgen.length > 0,
  String(imMehr.verborgen.length));
p('Und jedes Verborgene steht im „•••"',
  imMehr.verborgen.every(id => imMehr.inLade.includes(id)),
  'fehlt: ' + imMehr.verborgen.filter(id => !imMehr.inLade.includes(id)).slice(0, 6).join(', '));
console.log('    (' + imMehr.verborgen.length + ' verborgen, ' +
  imMehr.inLade.length + ' in der Lade)');

/* GEGENPROBE: die Messung des Überstands muss anschlagen KÖNNEN. Ein Knopf,
   den wir von Hand wieder sichtbar machen, steht garantiert über. */
const gegenUeberstand = await seite.evaluate(() => {
  const band = document.querySelector('.mb-band') as HTMLElement | null;
  const verborgen = band
    ? [...band.querySelectorAll('.mb-knopf[data-band][hidden]')] as HTMLElement[] : [];
  const letzter = verborgen[verborgen.length - 1];
  if (!letzter || !band) return -1;
  /* AUCH DIE GRUPPE. Der erste Anlauf blendete nur den Knopf ein und mass
     -1272 px — seine ganze Gruppe war ebenfalls `hidden`, also blieb er
     ohne Aussehen und ohne Rechteck. Eine Gegenprobe, die den Zustand
     nicht wirklich herstellt, beweist nichts. */
  const gruppe = letzter.closest('.mb-gruppe') as HTMLElement | null;
  const gruppeWar = gruppe ? gruppe.hidden : false;
  if (gruppe) gruppe.hidden = false;
  letzter.hidden = false;
  const stil = getComputedStyle(band);
  const innenRechts = band.getBoundingClientRect().right - (parseFloat(stil.paddingRight) || 0);
  const ueber = Math.round(letzter.getBoundingClientRect().right - innenRechts);
  letzter.hidden = true;
  if (gruppe) gruppe.hidden = gruppeWar;
  return ueber;
}) as number;
p('Gegenprobe: ein wieder eingeblendeter Knopf steht messbar über',
  gegenUeberstand > 2, String(gegenUeberstand) + ' px');

await seite.setViewportSize({ width: 1360, height: 950 });

/* ==========================================================================
 * §12 — „Gehen" deckt die Register (E272 Phase E)
 * ========================================================================*/
console.log('\n12 · „Gehen" deckt die Register');

const gehen = await seite.evaluate(() => {
  const imBand = new Set<string>();
  for (const g of Register.menueband.inReiter('gehen'))
    for (const e of g.eintraege) imBand.add(String(e.id ?? ''));

  /* Was AUS SICHT DES BENUTZERS ein Ort ist. Drei Modul-Einträge sind
     keiner und stehen deshalb nicht drin — sie sagen das im Register
     selbst („KEIN EIGENER BILDSCHIRM") oder schalten einen Modus auf der
     offenen Seite. */
  const KEIN_ORT = ['lebensbereiche', 'dokumentmodus', 'editor'];
  /* Und was zweimal dasselbe tut: links fällt weg, rechts bleibt. */
  const DOPPELT: Record<string, string> = {
    lernwelt: 'heute', arbeitswelt: 'workspace', notizhefte: 'app-notizhefte',
    hilfe: 'app-kann', vorlagen: 'app-markt', bibliothek: 'app-bib',
    papierkorb: 'papierkorbFuss'
  };

  const fehlendeModule: string[] = [];
  for (const m of Register.module.alle()) {
    const id = String(m?.id ?? '');
    if (!id || KEIN_ORT.includes(id)) continue;
    const ziel = DOPPELT[id] || id;
    if (!imBand.has(ziel)) fehlendeModule.push(id + (DOPPELT[id] ? ' → ' + ziel : ''));
  }

  const fehlendeWege: string[] = [];
  let wegeGeprueft = 0;
  for (const platz of ['oben', 'apps', 'fuss', 'unten']) {
    for (const e of Register.navigation.anPlatz(platz)) {
      const id = String(e?.id ?? '');
      if (!id || typeof e.tun !== 'function') continue;   /* Überschriften */
      wegeGeprueft++;
      const ziel = DOPPELT[id] || id;
      if (!imBand.has(ziel)) fehlendeWege.push(id + '/' + platz);
    }
  }
  return { imBand: imBand.size, fehlendeModule, fehlendeWege, wegeGeprueft };
}) as { imBand: number; fehlendeModule: string[]; fehlendeWege: string[]; wegeGeprueft: number };

console.log('    (' + gehen.imBand + ' Einträge in „Gehen", ' +
  gehen.wegeGeprueft + ' Navigationswege geprüft)');
p('„Gehen" ist gefüllt', gehen.imBand > 20, String(gehen.imBand));
p('Jedes Modul, das ein ORT ist, steht in „Gehen"',
  gehen.fehlendeModule.length === 0, gehen.fehlendeModule.join(', '));
p('Und jeder Weg der Seitenleiste ebenfalls',
  gehen.fehlendeWege.length === 0, gehen.fehlendeWege.join(', '));

/* DIE FÜNF EINTRÄGE AUF PLATZ `unten` SIND ALLE DOPPELT — nachgemessen.
   Die Phase-A-Matrix behauptete, „Gehen" bringe fünf Wege zurück, die
   `seitenleiste.ts:733` wegfiltert. Gemessen stimmt der erste Teil (sie
   werden gefiltert), der zweite nicht: jeder der fünf führt zu einem Ziel,
   das anderswo schon steht.

       vorlagen      → Galerie.oeffne()        = app-markt
       bibliothek    → Bibliothek.oeffne()     = app-bib
       papierkorb    → App.papierkorb()        = papierkorbFuss
       hilfe         → Rundgang.uebersicht()   = app-kann
       einstellungen → Einstellungen.oeffne()  = Modul „einstellungen"

   Gefunden hat es eine Gegenprobe: den Platz `unten` aus der Schleife
   genommen — und der Lauf blieb grün. Es ist also nichts verlorengegangen,
   als sie unsichtbar waren, und es kommt auch nichts zurück. Die Matrix ist
   berichtigt.

   Geprüft wird deshalb, was wirklich zutrifft: das Ziel ist erreichbar. */
p('Der Weg „Einstellungen" ist über „Gehen" erreichbar',
  await seite.evaluate(() => {
    for (const g of Register.menueband.inReiter('gehen'))
      for (const e of g.eintraege) if (e.id === 'einstellungen') return true;
    return false;
  }));

/* GEGENPROBE: eine erfundene Kennung im Modulregister muss auffallen.
   Ohne sie prüft der Abgleich oben nur, dass zwei Listen leer sind. */
const gegenGehen = await seite.evaluate(() => {
  Register.module.melde({ id: 'gibtesnicht', name: 'Gibt es nicht', icon: '?',
                          was: 'Nur für die Gegenprobe', oeffnen: () => {} });
  const imBand = new Set<string>();
  for (const g of Register.menueband.inReiter('gehen'))
    for (const e of g.eintraege) imBand.add(String(e.id ?? ''));
  const kennt = Register.module.alle().some((m: any) => m && m.id === 'gibtesnicht');
  return { kennt, imBand: imBand.has('gibtesnicht') };
}) as { kennt: boolean; imBand: boolean };
p('Gegenprobe: ein nachgemeldetes Modul erscheint in „Gehen"',
  !gegenGehen.kennt || gegenGehen.imBand,
  'das Modulregister kennt es, „Gehen" zeigt es nicht — dann misst §12 nichts');

/* Der Schauplatz — die Grundlage der Kontextkante (Phase F). */
const schauplaetze = await seite.evaluate(async () => {
  const gehoert: string[] = [];
  const horcher = (e: Event) => gehoert.push(String((e as CustomEvent).detail));
  window.addEventListener('redion:schauplatz', horcher);
  const warte = (): Promise<void> => new Promise(f => setTimeout(f, 260));
  const raus: Record<string, string> = {};
  Bibliothek.oeffne();          await warte(); raus['bibliothek'] = App.schauplatz();
  App.papierkorb();             await warte(); raus['papierkorb'] = App.schauplatz();
  const s1 = Store.rootPages()[0];
  if (s1) App.oeffne(s1.id);    await warte(); raus['seite'] = App.schauplatz();
  window.removeEventListener('redion:schauplatz', horcher);
  return { raus, gehoert };
}) as { raus: Record<string, string>; gehoert: string[] };

console.log('    ' + JSON.stringify(schauplaetze.raus));
p('Eine offene Seite meldet sich als „seite"', schauplaetze.raus['seite'] === 'seite',
  String(schauplaetze.raus['seite']));
p('Die Bibliothek meldet sich als „bibliothek"',
  schauplaetze.raus['bibliothek'] === 'bibliothek', String(schauplaetze.raus['bibliothek']));
p('Ein Bereich ohne eigenen Namen bekommt trotzdem eine Kennung',
  !!schauplaetze.raus['papierkorb'] && schauplaetze.raus['papierkorb'] !== 'leer',
  String(schauplaetze.raus['papierkorb']));
/* NUR WECHSEL, UND KEINE DOPPELUNG. Der erste Anlauf erwartete drei
   Ereignisse für drei Aufrufe und wurde rot — zu Recht, aber nicht wegen
   eines Fehlers: „Papierkorb" wird IN der Bibliothek gezeichnet
   (`Bibliothek.oeffne()` mit Filter), der Schauplatz bleibt also
   `bibliothek`. Dass dann kein zweites Ereignis kommt, ist genau der
   Vertrag: gemeldet wird der WECHSEL, nicht der Aufruf. Ein Horcher, der
   bei jedem Klick neu zeichnet, wäre das Gegenteil von dem, wofür die
   Kante das Ereignis braucht. */
p('Jeder Wechsel wird als Ereignis gemeldet',
  schauplaetze.gehoert.length >= 2, schauplaetze.gehoert.join(' → '));
p('… und derselbe Schauplatz nicht zweimal hintereinander',
  schauplaetze.gehoert.every((x, i) => i === 0 || x !== schauplaetze.gehoert[i - 1]),
  schauplaetze.gehoert.join(' → '));

await browser.close();
server.close();
console.log('\n  Suite 272 — Kein Griff geht verloren: ' + ok + ' ok, ' + weg + ' offen');
process.exit(weg ? 1 : 0);
