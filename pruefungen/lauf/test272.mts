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
/* AUS DER QUELLE, NICHT AUS DEM ERZEUGTEN (E715). Die Beschreibung ist ein
   Kommentar („HIER STAND `an('hl-seiten', …)`"), und Kommentare reisen seit
   E715 nicht mehr ins erzeugte .js mit. Die Quelle trägt Code UND
   Kommentar — sie sieht also alles, was das .js je zeigen konnte, und mehr. */
const schaleTs = lies('src/schale/aufbau/schale.ts');
const indexHtml = lies('index.html');
p('Die tote Verdrahtung hl-seiten ist noch beschrieben, nicht heimlich weg',
  schaleTs.includes('hl-seiten') === !indexHtml.includes('id="hl-seiten"'),
  'Verdrahtung und Markup müssen zusammen gehen oder zusammen fehlen');

/* ==========================================================================
 * §8 — Gegenproben (§55.2)
 * ========================================================================*/
console.log('\n8 · Die Gegenproben — kann dieser Lauf überhaupt rot werden?');

/* (a) Ein Eintrag ohne tun muss in §1 auffallen.

   HIER STAND EIN SCHMUGGELWEG, UND ER IST ZUGEMAUERT (E277, L87).
   Die alte Fassung schob einen Eintrag ohne `tun` ueber `meldeLieferant()`
   ein — ausdruecklich, weil dieser Weg als EINZIGER nicht prüfte, waehrend
   `melde()` es tat. Der Kommentar nannte das damals seinen eigenen Befund:
   „die zwei Wege sind verschieden streng".

   Seit L87 sind sie es nicht mehr. `alle()` siebt auch die Lieferanten
   (register/menueband.ts, `brauchbar`), und der Eintrag kommt gar nicht
   mehr an — die Gegenprobe wurde rot, WEIL das Loch zu ist.

   Sie prueft deshalb jetzt den PRUEFER statt den Weg: §1 sammelt die
   Eintraege und verlangt `typeof e.tun === 'function'`. Dieselbe Bedingung
   laeuft hier ueber eine Liste, der ein kaputter Eintrag beigelegt wurde.
   Faende sie ihn nicht, waere §1 blind — und genau das soll dieser Punkt
   ausschliessen.

   Dazu die zweite Haelfte: der Weg selbst muss dicht BLEIBEN. Ein
   Lieferant mit `tun: null` darf im Band nicht ankommen. */
const gegenTun = await seite.evaluate(() => {
  /* Der Pruefer aus §1, auf eine Liste mit einem kaputten Eintrag. */
  const echte = Register.menueband.alle()
    .map((e: any) => ({ id: String(e.id ?? ''), tunArt: typeof e.tun }));
  const mitKaputtem = [...echte, { id: 'gegenprobe-ohne-tun', tunArt: 'object' }];
  const findetIhn = mitKaputtem.filter(e => e.tunArt !== 'function').length === 1;
  const echteSauber = echte.filter((e: any) => e.tunArt !== 'function').length === 0;

  /* Und: der Lieferantenweg bleibt dicht. */
  const schmuggel = () => ([{ reiter: 'ansicht', gruppe: 'Gegenprobe',
    id: 'gegenprobe-ohne-tun', name: 'Gegenprobe', zeichen: 'dots',
    tun: null }] as any);
  Register.menueband.meldeLieferant(schmuggel);
  let durchgekommen = false;
  for (const g of Register.menueband.inReiter('ansicht'))
    for (const e of g.eintraege)
      if (e.id === 'gegenprobe-ohne-tun') durchgekommen = true;
  Register.menueband.nimmZurueckLieferant(schmuggel);

  return findetIhn && echteSauber && !durchgekommen;
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
   den wir von Hand wieder sichtbar machen, steht garantiert über.

   UND ZWAR AN EINEM SCHMALEN FENSTER (E272 Phase F). Seit die Seitenleiste
   am Rechner weg ist, hat das Band 240 Pixel mehr — bei 1280 verbirgt dann
   die FÜNFZEHNERREGEL und nicht mehr die Breite, und der wieder
   eingeblendete Knopf passte mit 16 Pixeln Luft hinein. Die Gegenprobe
   mass danach nichts mehr, obwohl sie grün gewesen wäre, hätte man das
   Vorzeichen umgedreht. Bei 820 px beisst die Breite wieder. */
await seite.setViewportSize({ width: 820, height: 900 });
await seite.waitForTimeout(500);
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
await seite.setViewportSize({ width: 1280, height: 900 });
await seite.waitForTimeout(400);
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
    /* `arbeitswelt` stand hier als Dublette von `workspace` — den Eintrag
       gibt es seit der Workspace-Auflösung (6. September) nicht mehr; das
       Modul heisst „Seiten & Wissen" und steht selbst unter „Daten".
       `bibliothek` (Platz unten) öffnet das Regal wie `bibliothekOben`;
       `app-bib` ist seither die Liste „Alle Seiten" und kein Doppel. */
    lernwelt: 'heute', notizhefte: 'app-notizhefte',
    hilfe: 'app-kann', vorlagen: 'app-markt', bibliothek: 'bibliothekOben',
    papierkorb: 'papierkorbFuss',
    /* Seit E393: `zeitmesser` und `w-zeit` riefen beide `Zeitmesser.panel()`
       und standen unter zwei Überschriften in der Lade. Der Weg ist nicht
       weg — er heisst jetzt `w-zeit`, mit dem Hinweis, der etwas sagt. */
    zeitmesser: 'w-zeit'
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
  /* UND WIEDER ABRAEUMEN. Das Fantasiemodul blieb bis zum Ende des Laufs
     stehen und tauchte in §15 als „Weg, der nichts tut" auf — richtig
     gemessen, falscher Gegenstand. Eine Gegenprobe, die ihren Zustand
     liegen laesst, verseucht jeden Punkt danach. */
  try { Register.module.nimmZurueck?.('gibtesnicht'); } catch { /* ohne Ruecknahme bleibt es */ }
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

/* ==========================================================================
 * §13 — Die Datei-Flaeche haengt an echten Diensten (E272 Phase G)
 * --------------------------------------------------------------------------
 * Der eine Satz, um den es hier geht: die Flaeche erfindet NICHTS. Jede
 * Zeile ruft einen Dienst, den es schon gibt — sonst waere sie eine zweite
 * Sicherungsmaschine, ein zweiter Erstellkatalog, ein zweiter Exportweg.
 * ========================================================================*/
console.log('\n13 · Die Datei-Flaeche (E272 Phase G)');

const bsGrund = await seite.evaluate(() => {
  const B = (window as any).Backstage;
  if (!B) return null;
  B.oeffne('info');
  const w = document.getElementById('backstage');
  const nav = w?.querySelector('.bst-nav');
  return {
    da: !!w,
    istOverlay: !!w?.classList.contains('overlay'),
    /* `fokus.ts` legt Rolle und aria-modal auf, weil es eine `.overlay` ist
       — es tut das im MutationObserver, also erst nach einem Takt. */
    faecher: B.faecher().map((f: any) => f.id),
    navKnoepfe: nav ? nav.querySelectorAll('.bst-nav-knopf').length : -1,
    /* Genau eines ist gewaehlt, und es ist das verlangte. */
    gewaehlt: [...(nav?.querySelectorAll('.bst-nav-knopf.ist-an') ?? [])]
      .map(k => (k as HTMLElement).dataset['bst'])
  };
}) as any;

p('Es gibt ein Modul „Backstage"', !!bsGrund, 'window.Backstage fehlt');
p('Die Flaeche ist eine `.overlay` (damit `fokus.ts` sie kennt)',
  !!bsGrund?.istOverlay);
p('Sie hat neun Faecher', (bsGrund?.faecher?.length ?? 0) === 9,
  (bsGrund?.faecher ?? []).join(', '));
p('Jedes Fach hat einen Knopf in der Spalte',
  bsGrund?.navKnoepfe === bsGrund?.faecher?.length,
  bsGrund?.navKnoepfe + ' Knoepfe / ' + bsGrund?.faecher?.length + ' Faecher');
p('Genau EINES ist gewaehlt, und zwar das verlangte',
  bsGrund?.gewaehlt?.length === 1 && bsGrund?.gewaehlt?.[0] === 'info',
  (bsGrund?.gewaehlt ?? []).join(','));
/* Die Sektion heisst NICHT „Senden": `Mail.senden` gibt es nicht
   (Matrix Teil 3). Ein Knopf, der nichts sendet, ist §47. */
p('Es gibt kein Fach „senden" — nur „weitergeben"',
  !bsGrund?.faecher?.includes('senden')
  && bsGrund?.faecher?.includes('weitergeben'),
  (bsGrund?.faecher ?? []).join(', '));

/* Tastatur und Fokus (§38). `fokus.ts` legt es auf, nicht diese Datei —
   geprueft wird trotzdem hier, denn wer die Flaeche einmal auf eine feste
   Wurzel mit `hidden` umbaut, verliert alles davon auf einen Schlag. */
const bsFokus = await seite.evaluate(async () => {
  await new Promise(f => setTimeout(f, 120));
  const w = document.getElementById('backstage');
  return {
    rolle: w?.getAttribute('role'),
    modal: w?.getAttribute('aria-modal'),
    fokusDrin: !!w && w.contains(document.activeElement),
    /* Alles ausserhalb ist stillgelegt — sonst tabbt man hinter die
       Flaeche in eine Seite, die niemand mehr sieht. */
    hinterStill: [...document.body.children]
      .filter(k => k.id !== 'backstage' && !k.classList.contains('menu-grund'))
      .every(k => (k as HTMLElement).inert)
  };
}) as any;
p('Sie ist ein Dialog fuer Vorleseprogramme', bsFokus?.rolle === 'dialog',
  String(bsFokus?.rolle));
p('… mit aria-modal', bsFokus?.modal === 'true', String(bsFokus?.modal));
p('Der Fokus steht in der Flaeche', bsFokus?.fokusDrin === true);
p('Und alles dahinter ist stillgelegt', bsFokus?.hinterStill === true);

/* Esc schliesst — `schale.ts` raeumt `.overlay` weg, ohne dass diese
   Datei einen eigenen Tastenhorcher braucht. */
await seite.keyboard.press('Escape');
await seite.waitForTimeout(120);
const bsZu = await seite.evaluate(() => !document.getElementById('backstage'));
p('Esc schliesst sie wieder', bsZu === true);

/* ── „Neu" nimmt den ECHTEN Katalog ────────────────────────────────────
   Die Gegenprobe steht gleich darunter: faellt ein Weg aus `ERSTELLEN`
   weg, muss die Liste messbar schrumpfen. */
const bsNeu = await seite.evaluate(() => {
  const B = (window as any).Backstage;
  B.oeffne('neu');
  const kacheln = [...document.querySelectorAll('#backstage .bst-kachel')]
    .map(k => String((k as HTMLElement).dataset['bstTun'] ?? ''));
  const wege = App.erstellenWege().map((w: any) => 'neu:' + w.id);
  B.schliesse();
  return { kacheln, wege };
}) as any;
p('„Neu" zeigt genau die Wege aus `App.erstellenWege()`',
  bsNeu.kacheln.length === bsNeu.wege.length
  && bsNeu.wege.every((w: string) => bsNeu.kacheln.includes(w)),
  bsNeu.kacheln.length + ' Kacheln / ' + bsNeu.wege.length + ' Wege');

const bsNeuGegen = await seite.evaluate(() => {
  const B = (window as any).Backstage;
  const echt = App.erstellenWege;
  /* Einen Weg herausnehmen — als haette diese Fassung ihn nicht geladen. */
  (App as any).erstellenWege = () => echt().slice(1);
  B.oeffne('neu');
  const nachher = document.querySelectorAll('#backstage .bst-kachel').length;
  B.schliesse();
  (App as any).erstellenWege = echt;
  B.oeffne('neu');
  const wieder = document.querySelectorAll('#backstage .bst-kachel').length;
  B.schliesse();
  return { nachher, wieder };
}) as any;
p('Gegenprobe: faellt ein Weg weg, schrumpft „Neu" messbar',
  bsNeuGegen.nachher === bsNeuGegen.wieder - 1,
  'ohne einen Weg ' + bsNeuGegen.nachher + ', mit ' + bsNeuGegen.wieder
  + ' — gleich hiesse: „Neu" fuehrt eine eigene Liste');

/* ── „Drucken" ohne offene Seite verspricht nichts (§47) ──────────────── */
const bsDruck = await seite.evaluate(async () => {
  const B = (window as any).Backstage;
  Bibliothek.oeffne();
  await new Promise(f => setTimeout(f, 260));
  B.oeffne('drucken');
  const ohne = [...document.querySelectorAll('#backstage .bst-zeile')]
    .map(z => String((z as HTMLElement).dataset['bstTun'] ?? ''));
  B.schliesse();
  const s1 = Store.rootPages()[0];
  if (s1) App.oeffne(s1.id);
  await new Promise(f => setTimeout(f, 260));
  B.oeffne('drucken');
  const mit = [...document.querySelectorAll('#backstage .bst-zeile')]
    .map(z => String((z as HTMLElement).dataset['bstTun'] ?? ''));
  B.schliesse();
  return { ohne, mit };
}) as any;
p('Ohne offene Seite gibt es keinen Druck-Knopf (§47)',
  !bsDruck.ohne.includes('druck:seite'), bsDruck.ohne.join(', '));
p('Mit offener Seite schon', bsDruck.mit.includes('druck:seite'),
  bsDruck.mit.join(', '));

/* ── „Informationen" zeigt den ECHTEN Sicherungsstand ─────────────────── */
const bsInfo = await seite.evaluate(async () => {
  const B = (window as any).Backstage;
  Store.setMeta('sicherung:zuletzt', new Date(Date.now() - 12 * 86400000).toISOString());
  Store.setMeta('sicherung:art', 'redion');
  B.oeffne('info');
  await new Promise(f => setTimeout(f, 360));
  const text = document.getElementById('backstage')?.textContent ?? '';
  const stufe = document.querySelector('#backstage .bst-fakt.ist-erinnern')
             || document.querySelector('#backstage .bst-fakt.ist-warnen');
  const platz = document.getElementById('bst-platz')?.textContent ?? '';
  B.schliesse();
  Store.setMeta('sicherung:zuletzt', '');
  return { zwoelf: /12 Tagen/.test(text), art: /redion/.test(text),
           stufeDa: !!stufe, platzGemessen: !/wird gemessen/.test(platz), platz };
}) as any;
p('Der Sicherungsstand ist der echte, nicht ein Platzhalter',
  bsInfo.zwoelf && bsInfo.art, JSON.stringify(bsInfo).slice(0, 140));
/* §38: die Warnstufe ist nicht NUR Farbe — der Satz sagt sie auch. */
p('Eine alte Sicherung traegt zusaetzlich eine Stufe', bsInfo.stufeDa === true);
p('Der Platz wird nachgetragen (oder ehrlich verschwiegen)',
  bsInfo.platzGemessen === true, bsInfo.platz);

/* ── Der Knopf in der Reiterzeile ist KEIN Reiter ─────────────────────── */
const bsKnopf = await seite.evaluate(() => {
  const k = document.getElementById('mb-datei');
  const inTablist = !!document.querySelector('#menueband .mb-tabs #mb-datei');
  return { da: !!k, rolle: k?.getAttribute('role'),
           popup: k?.getAttribute('aria-haspopup'), inTablist,
           breit: Math.round(k?.getBoundingClientRect().width ?? 0),
           hoch: Math.round(k?.getBoundingClientRect().height ?? 0) };
}) as any;
p('„Datei" steht in der Reiterzeile', bsKnopf.da === true);
p('… aber NICHT in der tablist', bsKnopf.inTablist === false);
p('… und gibt sich nicht als Reiter aus', !bsKnopf.rolle,
  String(bsKnopf.rolle));
p('… sondern sagt an, dass er einen Dialog oeffnet',
  bsKnopf.popup === 'dialog', String(bsKnopf.popup));
p('Er ist gross genug zum Treffen', bsKnopf.breit >= 44 && bsKnopf.hoch >= 30,
  bsKnopf.breit + '×' + bsKnopf.hoch);

/* ── Und die Bindungen sind im Quelltext echt ─────────────────────────── */
const bsQuelle = lies('src/schale/aufbau/backstage.ts');
p('Kein eigener Erstellcode — „Neu" ruft `App.erstellenWeg`',
  /App\.erstellenWeg\(/.test(bsQuelle) && !/Store\.addPage\(/.test(bsQuelle));
p('Keine zweite Sicherungsmaschine — es ruft `App.sicherungSpeichern`',
  /App\.sicherungSpeichern\(/.test(bsQuelle)
  && !/exportAll|JSON\.stringify\(Store/.test(bsQuelle));
/* Der Klammer-Auf im Muster ist nicht Zierde: die Datei ERWAEHNT
   `Mail.senden` in ihrem Kopf, um zu erklaeren, warum es die Sektion
   „Senden" nicht gibt. Ein Muster ohne Klammer machte den eigenen
   Merksatz zum Fehler — und man haette ihn geloescht statt behalten. */
p('Kein erfundener Sendeweg — `Mail.senden(` wird nirgends gerufen',
  !/Mail\.senden\s*\(/.test(bsQuelle));

/* ==========================================================================
 * §14 — Die Kontextkante (E272 Phase F)
 * --------------------------------------------------------------------------
 * Der eine Satz: die Kante kennt keinen Bereich beim Namen. Was in ihr
 * steht, meldet der Bereich selbst an (`Register.kontext`), und die Schale
 * fragt nur nach dem Schauplatz.
 * ========================================================================*/
console.log('\n14 · Die Kontextkante (E272 Phase F)');

const kanteGrund = await seite.evaluate(async () => {
  const p1 = Store.rootPages()[0];
  if (p1) App.oeffne(p1.id);
  await new Promise(f => setTimeout(f, 420));
  const k = document.getElementById('kante');
  const knoepfe = [...(k?.querySelectorAll('.k-knopf') ?? [])];
  return {
    da: !!k, versteckt: k?.hidden !== false,
    breit: Math.round(k?.getBoundingClientRect().width ?? 0),
    bereich: (window as any).Kontextkante.bereichJetzt(),
    /* JEDER Knopf hat einen hoerbaren Namen und ein gezeichnetes Zeichen —
       54 Pixel tragen kein Wort, also muss beides stimmen (§38, E202). */
    ohneNamen: knoepfe.filter(b => !b.getAttribute('aria-label')).length,
    ohneZeichen: knoepfe.filter(b => !b.querySelector('svg')).length,
    /* 42 × 42: die Fingerregel gilt fuer Finger, und unter 761 px gibt es
       die Kante nicht (test114 misst bei 428 und 390). */
    zuKlein: knoepfe.filter(b => {
      const r = b.getBoundingClientRect();
      return r.width < 42 || r.height < 42;
    }).length,
    ids: knoepfe.map(b => (b as HTMLElement).dataset['k']),
    /* Die Seitenleiste ist am Rechner weg — das ist die andere Haelfte. */
    seitenleiste: Math.round(document.getElementById('sidebar')?.getBoundingClientRect().width ?? -1)
  };
}) as any;

p('Die Kante steht da', kanteGrund.da && !kanteGrund.versteckt);
/* 184 STATT 54 (Studio, E440): die Kante trägt Beschriftungen und lässt
   sich ziehen (148–260, kompakt 62). Die Wahrheit steht am Regler. */
const reglerBreite = Number(await seite.evaluate(
  `document.getElementById('studio-divider')?.getAttribute('aria-valuenow')`));
p('Sie ist so breit, wie der Studio-Regler sagt', kanteGrund.breit === reglerBreite,
  kanteGrund.breit + ' gegen ' + reglerBreite);
p('Die Seitenleiste ist am Rechner weg', kanteGrund.seitenleiste === 0,
  String(kanteGrund.seitenleiste));
p('Eine offene Seite ist der Bereich „editor"', kanteGrund.bereich === 'editor',
  String(kanteGrund.bereich));
p('Jeder Knopf hat einen hoerbaren Namen', kanteGrund.ohneNamen === 0,
  kanteGrund.ohneNamen + ' ohne aria-label');
p('Jeder Knopf hat ein gezeichnetes Zeichen', kanteGrund.ohneZeichen === 0,
  kanteGrund.ohneZeichen + ' ohne SVG — fehlt der Name in Register.symbole?');
p('Und ist gross genug zum Treffen', kanteGrund.zuKlein === 0,
  kanteGrund.zuKlein + ' unter 42 px');
/* IM RUHIGEN MODUS STEHT UNTEN NUR „EINSTELLUNGEN" (6. September). Die KI
   liegt in der Werkzeuglade, „Neu" ist der Knopf im Studio-Kopf — beide
   sind da, nur nicht als dritter und vierter Knopf einer Leiste, die
   ruhig sein soll. Gemessen wird deshalb der WEG, nicht der Platz. */
p('Unten steht „Einstellungen", und der Werkzeuggriff ist da',
  ['einstellungen', 'mehr-werkzeuge'].every((x: string) => kanteGrund.ids.includes(x)),
  (kanteGrund.ids ?? []).join(', '));
const kiNeu = await seite.evaluate(async () => {
  (document.querySelector('#kante .k-knopf[data-k="mehr-werkzeuge"]') as HTMLElement | null)?.click();
  await new Promise(f => setTimeout(f, 200));
  const inLade = [...document.querySelectorAll('#kanten-lade .kl-koerper .kl-zeile b')]
    .map(b => (b.textContent || '').trim());
  (document.querySelector('#kanten-lade .kl-zu') as HTMLElement | null)?.click();
  const neu = document.getElementById('studio-create');
  return { ki: inLade.includes('Lokale KI'),
           neu: !!neu && neu.getBoundingClientRect().width > 0 };
}) as any;
p('… die KI liegt in der Werkzeuglade', kiNeu.ki === true);
p('… und „Neu" steht im Studio-Kopf', kiNeu.neu === true);

/* JEDER GEMELDETE BEREICH LIEFERT ETWAS. Eine Kante, die in einem Bereich
   leer bleibt, ist ein Streifen ohne Zweck. */
const kanteBereiche = await seite.evaluate(() => {
  const raus: Record<string, number> = {};
  for (const b of Register.kontext.bereiche()) raus[b] = Register.kontext.fuer(b).length;
  return raus;
}) as Record<string, number>;
console.log('    ' + JSON.stringify(kanteBereiche));
p('Jeder gemeldete Bereich liefert mindestens einen Knopf',
  Object.values(kanteBereiche).every(n => n > 0),
  JSON.stringify(kanteBereiche));
p('Und es sind mindestens sechs Bereiche',
  Object.keys(kanteBereiche).length >= 6,
  Object.keys(kanteBereiche).join(', '));

/* GEGENPROBE: einen Lieferanten abmelden, und der Punkt muss es merken. */
/* GEZÄHLT WIRD IN DER LADE (6. September): im ruhigen Modus zeichnet die
   Kante die Griffe des Ortes nicht als Knöpfe, sondern hinter „Werkzeuge"
   — die Zahl der Knöpfe bliebe also immer zwei, und diese Gegenprobe
   könnte nie rot werden (§55.2). Also die Lade auf, zählen, zu; abmelden;
   noch einmal. */
const kanteGegen = await seite.evaluate(async () => {
  const zaehle = async (): Promise<number> => {
    (document.querySelector('#kante .k-knopf[data-k="mehr-werkzeuge"]') as HTMLElement | null)?.click();
    await new Promise(f => setTimeout(f, 200));
    const n = document.querySelectorAll('#kanten-lade .kl-koerper .kl-zeile').length;
    (document.querySelector('#kanten-lade .kl-zu') as HTMLElement | null)?.click();
    await new Promise(f => setTimeout(f, 100));
    return n;
  };
  const vorher = Register.kontext.fuer('editor').length;
  const gezeichnetVorher = await zaehle();
  Register.kontext.nimmZurueck('editor', 'fassungen');
  (window as any).Kontextkante.zeichne();
  await new Promise(f => setTimeout(f, 200));
  const gezeichnet = await zaehle();
  return { vorher, nachher: Register.kontext.fuer('editor').length, gezeichnetVorher, gezeichnet };
}) as any;
p('Gegenprobe: ein abgemeldeter Knopf verschwindet aus der Kante',
  kanteGegen.nachher === kanteGegen.vorher - 1
  && kanteGegen.gezeichnet === kanteGegen.gezeichnetVorher - 1,
  JSON.stringify(kanteGegen) + ' — bliebe die Zahl gleich, zeichnete die '
  + 'Kante eine eigene Liste statt des Registers');

/* ELEKTRO LIEST DIESELBE QUELLE WIE SEINE STARTSEITE (Redurs Entscheid:
   kein eigener Reiter). Das ist der Punkt, an dem eine zweite Liste
   auffallen wuerde. */
const kanteElektro = await seite.evaluate(() => {
  /* NUR DIE, DEREN `zeigen()` ZUSAGT — genau die Frage, die auch
     `elektro/start.ts:66` stellt: „gibt es das Modul ueberhaupt?". Der
     erste Anlauf verglich alle acht und wurde rot, weil `e-rechner` und
     `e-plan` sich im Pruefstand selbst abmelden. Das ist §47 bei der
     Arbeit und kein Fehler; der Punkt hat die falsche Liste gezaehlt. */
  const ausRegister: string[] = [];
  for (const g of (Register.menueband.inReiter('elektro') || []))
    for (const e of (g.eintraege || [])) {
      let zeigt = true;
      try { zeigt = typeof e.zeigen !== 'function' || !!e.zeigen(); }
      catch { zeigt = false; }
      if (zeigt) ausRegister.push(String(e.id));
    }
  const inKante = Register.kontext.fuer('elektro').map((k: any) => String(k.id));
  return { ausRegister, inKante };
}) as any;
p('Die Elektro-Kante ist der Reiter „elektro" aus dem Register',
  kanteElektro.ausRegister.length > 0
  && kanteElektro.ausRegister.every((id: string) => kanteElektro.inKante.includes(id)),
  kanteElektro.ausRegister.join(', ') + ' → ' + kanteElektro.inKante.join(', '));

/* DIE LADE: auf, Fokus hinein, Esc, und der Baum wieder zu Hause. */
const kanteLade = await seite.evaluate(async () => {
  const knopf = document.querySelector<HTMLElement>('#kante .k-knopf[data-k="seiten"]');
  knopf?.click();
  await new Promise(f => setTimeout(f, 260));
  const l = document.getElementById('kanten-lade');
  return {
    offen: !!l && !l.hidden,
    breit: Math.round(l?.getBoundingClientRect().width ?? 0),
    /* DER ECHTE BAUM, hineingeschoben und nicht kopiert. Zwei Baeume
       waeren zwei Zustaende. */
    baumDrin: !!l?.querySelector('#tree'),
    baeume: document.querySelectorAll('#tree').length,
    knopfAn: knopf?.getAttribute('aria-expanded'),
    /* Sie liegt UNTER dem Band und nicht darueber (auf dem Bild deckte sie
       „Datei", „Gehen" und „Start" zu). */
    ueberBand: (l?.getBoundingClientRect().top ?? 0)
               < (document.getElementById('menueband')?.getBoundingClientRect().bottom ?? 0) - 1
  };
}) as any;
p('Die Lade geht auf', kanteLade.offen === true);
p('… und ist 252 px breit', kanteLade.breit === 252, String(kanteLade.breit));
p('… und liegt UNTER dem Menüband', kanteLade.ueberBand === false);
p('Der Seitenbaum steht darin — und es gibt nur einen',
  kanteLade.baumDrin === true && kanteLade.baeume === 1,
  kanteLade.baeume + ' Baeume');
p('Der Knopf sagt an, dass er offen ist', kanteLade.knopfAn === 'true',
  String(kanteLade.knopfAn));

/* NICHTS DAVOR STEHEN LASSEN. Die Kante gibt Esc bewusst ab, wenn ein
   Dialog oder Menue offen ist — wer beides gleichzeitig schliesst, gibt
   einem Tastendruck zwei Wirkungen. Aus frueheren Paragrafen kann noch
   eines herumliegen; dann misst dieser Punkt die falsche Sache. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove());
});
await seite.waitForTimeout(120);
await seite.keyboard.press('Escape');
await seite.waitForTimeout(220);
const kanteZu = await seite.evaluate(() => ({
  zu: document.getElementById('kanten-lade')?.hidden === true,
  baumHeim: document.getElementById('tree')?.parentElement?.id === 'sidebar',
  baeume: document.querySelectorAll('#tree').length
})) as any;
p('Esc schliesst die Lade', kanteZu.zu === true);
p('Und der Baum ist wieder zu Hause — sonst zeichnet die Seitenleiste ins Nichts',
  kanteZu.baumHeim === true && kanteZu.baeume === 1, JSON.stringify(kanteZu));

/* AM TELEFON GIBT ES SIE NICHT. 54 von 390 Pixeln waeren ein Siebtel des
   Bildes, und die untere Fuenferleiste (E236/E240) traegt dort die
   Navigation. */
await seite.setViewportSize({ width: 390, height: 844 });
await seite.waitForTimeout(500);
const kanteHandy = await seite.evaluate(() => {
  (window as any).Kontextkante.zeichne();
  const k = document.getElementById('kante');
  return { versteckt: k?.hidden === true,
           breit: Math.round(k?.getBoundingClientRect().width ?? 0),
           datei: (() => { const d = document.getElementById('mb-datei');
                           return d ? getComputedStyle(d).display : 'weg'; })() };
}) as any;
p('Am Telefon ist die Kante aus', kanteHandy.versteckt === true
  && kanteHandy.breit === 0, JSON.stringify(kanteHandy));
p('Und „Datei" auch — dort fuehrt der Weg ueber das R-Blatt',
  kanteHandy.datei === 'none', String(kanteHandy.datei));
await seite.setViewportSize({ width: 1280, height: 900 });
await seite.waitForTimeout(400);

/* Und im Quelltext: die Schale kennt keinen Bereich beim Namen (§5). */
const kanteQuelle = lies('src/schale/aufbau/context-rail.ts');
p('Die Kante nennt keinen Bereich beim Namen (§5)',
  !/'(editor|pdf|bibliothek|elektro|aufgaben|datenbank)'\s*:/.test(kanteQuelle)
  && !/inReiter\(/.test(kanteQuelle));
/* Der Zuweisung nachgehen und nicht dem Wort: die Datei ERWAEHNT
   `innerHTML` in ihrem Kopf, um zu sagen, dass sie es nicht benutzt.
   Derselbe Fehler wie bei `Mail.senden(` in §13 — ein Muster ohne
   Gleichheitszeichen macht den eigenen Merksatz zum Verstoss. */
p('Und baut ihr HTML ohne `innerHTML =` (§19)',
  !/innerHTML\s*=/.test(kanteQuelle));

/* ==========================================================================
 * §15 — Jeder Weg in „Gehen" bewirkt wirklich etwas
 * --------------------------------------------------------------------------
 * DER PUNKT, DEN ES VORHER NICHT GAB, UND DER EINEN FEHLER GEFUNDEN HAETTE.
 *
 * `w-agenten` und `w-bespr` riefen `App.reiterWechseln('chat')` — das schaltet
 * den MODUS DER SEITENLEISTE um. Seit Phase F ist die am Rechner
 * `display:none`. Der Klick tat also etwas, nur sah es niemand. Kein
 * Prueflauf konnte das melden: die Kennung war da, der Name war da, `tun`
 * war eine Funktion, und werfen tat sie auch nicht.
 *
 * Gemessen wird deshalb die WIRKUNG: nach dem Klick muss sich mindestens
 * eines geaendert haben — eine Ueberlagerung ist da, der Schauplatz ist ein
 * anderer, die Krume ist eine andere, oder der Inhalt der Seite ist ein
 * anderer. Das ist dieselbe Frage, die test248 §4 fuer „Elektro" stellt,
 * nur fuer alle 45 Wege.
 * ========================================================================*/
console.log('\n15 · Jeder Weg in „Gehen" bewirkt wirklich etwas');

/* WAS NICHTS BEWIRKEN DARF, UND WARUM — namentlich, nicht als Muster.
   Eine Ausnahmeliste, die man mit einem Regex fuellt, waechst von selbst;
   eine mit Begruendung muss man verteidigen. */
const OHNE_WIRKUNG: Record<string, string> = {
  /* Der Dateiwaehler des Browsers laesst sich im Pruefstand nicht oeffnen —
     `showOpenFilePicker` braucht eine echte Nutzergeste. */
  'w-import': 'oeffnet den Dateiwaehler des Browsers',
  /* `Recognition.scan()` will Kamera oder Datei — beides braucht eine
     echte Nutzergeste, die ein Prueflauf nicht vortaeuschen darf. */
  'erkennung': 'braucht Kamera oder Dateiwaehler',
  /* Sie sind schon da: ein Klick auf den Ort, an dem man steht, aendert
     nichts, und das ist richtig. Der Lauf beginnt auf der Startansicht. */
  'heute': 'man steht schon dort',
  'app-heute': 'man steht schon dort'
};

const wege = await seite.evaluate(() => {
  const raus: string[] = [];
  for (const g of Register.menueband.inReiter('gehen'))
    for (const e of g.eintraege) raus.push(String(e.id));
  return raus;
}) as string[];

const wirkungslos: string[] = [];
const geprueft: string[] = [];
for (const id of wege) {
  if (OHNE_WIRKUNG[id]) continue;
  const erg = await seite.evaluate(async (kennung: string) => {
    /* Sauberer Anfang: nichts von vorhin darf als Wirkung durchgehen. */
    /* SAUBERER ANFANG, UND ZWAR IMMER DERSELBE. Ohne ihn misst der Punkt
       „bin ich schon da?" statt „bewirkt der Weg etwas?" — und welcher Ort
       gerade offen ist, haengt dann davon ab, welcher Weg vorher dran war.
       Genau daran haben `bibliothekOben` und `aufgaben` im ersten Anlauf
       gehangen: mal gruen, mal rot, je nach Reihenfolge. */
    document.querySelectorAll('.overlay, .menu, .menu-grund, .zm-feld').forEach(x => x.remove());
    (window as any).Backstage?.schliesse?.();
    try { App.kiPanel(false); } catch { /* ohne KI-Panel geht es auch */ }
    try { (globalThis as any).Ansichten?.start?.(); } catch { /* … */ }
    await new Promise(f => setTimeout(f, 420));
    /* REDION HAT MEHR FLAECHEN ALS ÜBERLAGERUNGEN, und der erste Anlauf
       kannte nur die. Er meldete vier Wege als wirkungslos, die alle vier
       arbeiten: `App.kiPanel()` schaltet eine KLASSE an `#ai`,
       `Zeitmesser.panel()` baut ein `.zm-feld` (kein `.overlay`), und
       „Seiten-Peek" ist wieder etwas anderes. Vier Fehlalarme auf eine
       richtige Frage — genau die Sorte, die man abschaltet und danach den
       echten Fall nicht mehr sieht (§55.2).

       Die Flaechen stehen deshalb NAMENTLICH da. Wer eine neue baut, muss
       sie hier eintragen; das ist der Preis dafuer, dass dieser Punkt
       nicht auf `body.innerHTML.length` ausweicht — die Zahl aendert sich
       auch, wenn nur eine Uhr weiterlaeuft, und dann waere alles gruen. */
    const stand = () => ({
      lagen: document.querySelectorAll('.overlay, .menu, .menu-grund').length,
      /* Das KI-Panel und die Peek-Spalte schalten nur eine Klasse um. */
      ki: document.getElementById('ai')?.className || '',
      peek: document.querySelectorAll('.peek, .peek-mobil').length,
      /* Der Zeitmesser baut ein eigenes schwebendes Feld (E268). */
      zm: document.querySelectorAll('.zm-feld').length,
      /* Und alles, was sich sonst als Dialog ausgibt. */
      dialoge: document.querySelectorAll('[role="dialog"]').length,
      koerper: document.body.className,
      wo: (() => { try { return String(App.schauplatz()); } catch { return '?'; } })(),
      krume: (document.getElementById('crumb')?.textContent || '').trim(),
      /* Nur der Anfang: eine Seite mit Zeitangabe aendert sich sonst von
         selbst, und dann waere jeder Weg gruen. */
      inhalt: (document.getElementById('page')?.textContent || '').slice(0, 200)
    });
    const vorher = stand();
    let e: any = null;
    for (const g of Register.menueband.inReiter('gehen'))
      for (const x of g.eintraege) if (x.id === kennung) e = x;
    if (!e) return { kennung, da: false, wirkt: false };
    let warf = '';
    try { e.tun(); } catch (f) { warf = String(f).slice(0, 80); }
    await new Promise(f => setTimeout(f, 420));
    const nachher = stand();
    return {
      kennung, da: true, warf,
      wirkt: JSON.stringify(nachher) !== JSON.stringify(vorher)
    };
  }, id) as any;
  geprueft.push(id);
  if (!erg.wirkt) wirkungslos.push(id + (erg.warf ? ' (' + erg.warf + ')' : ''));
}
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove());
});

console.log('    (' + geprueft.length + ' Wege geklickt, '
  + Object.keys(OHNE_WIRKUNG).length + ' mit Begruendung uebergangen)');
p('Es wurden ueberhaupt Wege geprueft', geprueft.length >= 35,
  String(geprueft.length));
p('Kein Weg in „Gehen" tut nichts', wirkungslos.length === 0,
  wirkungslos.slice(0, 8).join(' · '));

/* GEGENPROBE: ein Weg, dessen `tun` nichts tut, muss auffallen. Ohne sie
   waere „kein Weg tut nichts" auch dann gruen, wenn die Messung blind ist. */
const gegenWirkung = await seite.evaluate(async () => {
  const echt = Register.menueband.melde({
    reiter: 'gehen', gruppe: 'Weiteres', id: 'probe-leer', name: 'Leerlauf',
    zeichen: 'dots', tun: () => {}
  });
  if (!echt) return { gemeldet: false, wirkt: true };
  const lagen = () => document.querySelectorAll('.overlay, .menu, .menu-grund').length;
  const wo = () => { try { return String(App.schauplatz()); } catch { return '?'; } };
  const v = { l: lagen(), w: wo() };
  let e: any = null;
  for (const g of Register.menueband.inReiter('gehen'))
    for (const x of g.eintraege) if (x.id === 'probe-leer') e = x;
  e?.tun();
  await new Promise(f => setTimeout(f, 300));
  const wirkt = lagen() > v.l || wo() !== v.w;
  Register.menueband.nimmZurueck('probe-leer');
  return { gemeldet: true, wirkt };
}) as any;
p('Gegenprobe: ein Weg mit leerem `tun` wird als wirkungslos erkannt',
  gegenWirkung.gemeldet && gegenWirkung.wirkt === false,
  JSON.stringify(gegenWirkung) + ' — waere er „wirksam", misst §15 nichts');

/* ==========================================================================
 * §16 · Jeder Bildschirm sagt, wo er ist (E273)
 * --------------------------------------------------------------------------
 * `App.schauplatz()` ist die einzige Frage, die die Kontextkante stellt.
 * Wer sie nicht beantwortet, bekommt keine leere Kante — er bekommt die des
 * VORIGEN Bildschirms. Gemessen war das: von „Meine Aufgaben" auf „Start"
 * geklickt, und links standen weiter Tagesplan, Wochenrueckblick und
 * Faellig. Sechs Bildschirme in `bereiche/datenbanken/ansichten/dienst.ts`
 * zeichneten sich selbst in `#page`, ohne `zeigeSonder`.
 *
 * Kein Pruefpunkt konnte das melden: die Kante war voll, die Knoepfe taten
 * etwas, nichts warf. Nur der Ort war falsch.
 *
 * Dieser Punkt prueft es fuer JEDEN Weg: nach dem Klick muss der Schauplatz
 * der sein, der zu diesem Bildschirm gehoert — und nicht der von vorher.
 * ========================================================================*/
/* DIE ÜBERSCHRIFT SCHREIBT SICH „16 · …", NICHT „§16 — …".
   test225 prüft, dass jeder Verweis der Doku („test272 §16") auf einen
   Abschnitt zeigt, den es gibt, und erkennt Abschnitte an drei
   Schreibweisen — eine davon ist `\n<Nummer> · `. Der erste Wurf hier
   stand mit Paragraphenzeichen und Gedankenstrich da; test225 fand ihn
   nicht und wurde rot. Die Prüfung hatte recht: die Datei schreibt ihre
   fünfzehn anderen Abschnitte genau so. */
console.log('\n16 · Jeder Bildschirm sagt, wo er ist (E273)');

const ORTE: Array<[string, string, string]> = [
  /* Aufruf, erwarteter Schauplatz, Name fuer die Ausgabe */
  ['Ansichten.start()',       'heute',       'Start'],
  ['Ansichten.posteingang()', 'posteingang', 'Posteingang'],
  ['Ansichten.termine()',     'kalender',    'Termine'],
  ['Ansichten.seiten()',      'bibliothek',  'Seiten'],
  ['Ansichten.kompass()',     'kompass',     'Kompass'],
  ['Ansichten.mehr()',        'mehr',        'Mehr'],
  ['Notebook.oeffnen()',      'notizhefte',  'Notizhefte'],
  ['Bibliothek.oeffne()',     'bibliothek',  'Dokumente'],
  ['Bibliothek.aufgaben()',   'aufgaben',    'Aufgaben']
];

for (const [ruf, soll, name] of ORTE) {
  const r = await seite.evaluate(async (ruf: string) => {
    /* IMMER VOM SELBEN ORT AUS STARTEN. Ohne diesen Schritt misst der Punkt
       bei einem Bildschirm, der zufaellig schon richtig stand, nichts. */
    try { (globalThis as any).Notebook.oeffnen(); } catch { /* … */ }
    await new Promise(f => setTimeout(f, 180));
    const vorher = String(App.schauplatz());
    try { (0, eval)(ruf); } catch (e) { return { fehler: String(e) }; }
    await new Promise(f => setTimeout(f, 240));
    return { vorher, nachher: String(App.schauplatz()) };
  }, ruf) as any;
  p(name + ' meldet „' + soll + '"',
    !r.fehler && r.nachher === soll,
    r.fehler ? r.fehler : 'vorher ' + r.vorher + ', nachher ' + r.nachher);
}

/* GEGENPROBE (§55.2): ein Bildschirm, der sich selbst in `#page` zeichnet,
   ohne `zeigeSonder` — genau die Bauart der sechs von vorher. Der Punkt
   muss ihn als „steht noch auf dem alten Ort" erkennen. */
const gegenOrt = await seite.evaluate(async () => {
  try { (globalThis as any).Notebook.oeffnen(); } catch { /* … */ }
  await new Promise(f => setTimeout(f, 180));
  const vorher = String(App.schauplatz());
  /* So sah `Ansichten.posteingang()` vor E273 aus. */
  const wrap = document.getElementById('page');
  if (wrap) { App.setzeSeite(null); wrap.innerHTML = '<div class="home"><h1>Falsch</h1></div>'; }
  await new Promise(f => setTimeout(f, 240));
  return { vorher, nachher: String(App.schauplatz()) };
}) as any;
p('Gegenprobe: ohne `zeigeSonder` bleibt der Schauplatz stehen',
  gegenOrt.vorher === gegenOrt.nachher && gegenOrt.nachher === 'notizhefte',
  JSON.stringify(gegenOrt) + ' — waere er hier schon richtig, misst §16 nichts');

/* Und die Kante muss auf jedem dieser Orte wirklich etwas anbieten.
   Ein Schauplatz ohne einen einzigen Knopf ist kein Fehler an sich — die
   Kante zeigt dann nur ihren festen Fuss —, aber fuer die sechs oben war
   genau das der Zustand, den E273 beheben sollte. */
const kanten = await seite.evaluate(() => {
  const raus: Record<string, number> = {};
  /* `workspace` stand hier bis zur Workspace-Auflösung (6. September);
     seine Griffe wohnen jetzt bei `bibliothek` und `aufgaben`. */
  for (const b of ['heute', 'posteingang', 'kalender', 'bibliothek',
                   'kompass', 'mehr', 'notizhefte', 'aufgaben'])
    raus[b] = (Register.kontext.fuer(b) || []).length;
  return raus;
}) as any;
for (const b of Object.keys(kanten))
  p('Die Kante von „' + b + '" hat Knöpfe', Number(kanten[b]) > 0,
    String(kanten[b]));

/* ==========================================================================
 * §17 · KEIN KNOPF STEHT DA, DER NICHTS TUN KANN (E277, L68)
 * --------------------------------------------------------------------------
 * §15 prueft die Wege in „Gehen": jeder muss etwas bewirken. Dieser Punkt
 * prueft die andere Haelfte — Knoepfe, die dastehen, OBWOHL sie auf diesem
 * Bildschirm gar nichts koennen.
 *
 * Gemessen auf fuenf Bildschirmen: „•••" und der Stern standen auf jedem,
 * auch auf Notizhefte, Posteingang, Kompass und Start. Beide pruefen beim
 * Klick, ob es ueberhaupt eine Seite gibt (schale.ts an('btn-page-menu')
 * mit `if (p)`, an('btn-fav') mit `if (!seiteId) return`) — ohne Seite
 * passiert also nichts, lautlos.
 *
 * Der KI-Knopf daneben bleibt: `kiPanel()` geht ueberall.
 * ========================================================================*/
console.log('\n17 · Kein Knopf steht da, der nichts tun kann (E273/E277)');

const KOPFKNOEPFE = await seite.evaluate(async () => {
  const sichtbar = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && el.offsetParent !== null;
  };
  const messen = () => ({
    wo: String(App.schauplatz()),
    menue: sichtbar('btn-page-menu'),
    stern: sichtbar('btn-fav'),
    ki:    sichtbar('btn-ai')
  });
  const raus: any[] = [];

  const s = Store.addPage(null, { text: 'Knopfprobe' });
  App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 300));
  raus.push(messen());

  for (const ruf of ['Notebook.oeffnen()', 'Ansichten.posteingang()',
                     'Ansichten.kompass()', 'Ansichten.start()']) {
    try { (0, eval)(ruf); } catch { /* … */ }
    await new Promise(f => setTimeout(f, 300));
    raus.push(messen());
  }
  return raus;
}) as any[];

const mitSeite = KOPFKNOEPFE[0];
const ohneSeite = KOPFKNOEPFE.slice(1);
p('Mit offener Seite stehen „•••" und der Stern da',
  mitSeite.menue === true && mitSeite.stern === true, JSON.stringify(mitSeite));
p('Ohne Seite verschwindet „•••" auf jedem Bildschirm',
  ohneSeite.every(x => x.menue === false),
  JSON.stringify(ohneSeite.filter(x => x.menue).map(x => x.wo)));
p('Und der Stern ebenso',
  ohneSeite.every(x => x.stern === false),
  JSON.stringify(ohneSeite.filter(x => x.stern).map(x => x.wo)));
p('Der KI-Knopf bleibt überall — er kann überall etwas',
  KOPFKNOEPFE.every(x => x.ki === true),
  JSON.stringify(KOPFKNOEPFE.map(x => x.wo + ':' + x.ki)));

/* GEGENPROBE (§55.2): die Messung muss einen sichtbaren Knopf auch sehen.
   Ohne sie waere „ueberall verschwunden" auch dann gruen, wenn die Messung
   grundsaetzlich `false` liefert — etwa weil `offsetParent` in einer
   veraenderten Schale immer null ist. */
const gegenKnopf = await seite.evaluate(async () => {
  const k = document.getElementById('btn-page-menu');
  if (!k) return { ging: false, grund: 'Knopf gibt es nicht' };
  k.hidden = false;                        /* von Hand wieder herzeigen */
  await new Promise(f => setTimeout(f, 120));
  const st = getComputedStyle(k);
  const sah = st.display !== 'none' && k.offsetParent !== null;
  k.hidden = true;
  return { ging: sah, grund: st.display };
}) as any;
p('Gegenprobe: ein sichtbarer Knopf wird auch als sichtbar gemessen',
  gegenKnopf.ging === true,
  JSON.stringify(gegenKnopf) + ' — sonst misst §17 nur Nullen');

await browser.close();
server.close();
console.log('\n  Suite 272 — Kein Griff geht verloren: ' + ok + ' ok, ' + weg + ' offen');
process.exit(weg ? 1 : 0);
