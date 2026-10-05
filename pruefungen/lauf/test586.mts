/* Suite 586 — Der Löschen-Knopf zerfliesst, überall wo gelöscht wird (E709)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat am 27. September um ca. 22:02 ein Video
 * geschickt (ein runder Knopf mit rotem Papierkorb zerfliesst in „Confirm"
 * und „Cancel") und geschrieben:
 *
 *     „Ich will das du löschen button so ist überla wo etwas zum löschen
 *      eine buton gibt"
 *
 * Das Vorbild ist DeleteButton aus seinem Touch Kit. In Redion ist es
 * nachgebaut, nicht geladen (E699: keine Insel beim Start): EIN Helfer
 * (`RedionDelete`, schale/bedienung/delete.ts + stil/loeschen.css), EIN
 * Klebefilter je Dokument, nur an, solange es fliesst.
 *
 * DIE ZUSAGEN, als Zahlen:
 *
 *   §1 DER HELFER IST DA UND GELADEN — Skript, Blatt, GRUNDSTOCK, Start.
 *   §2 JEDER RUNDE LÖSCHEN-KNOPF MACHT MIT — jedes `🗑` als eigener Knopf
 *      im Quelltext trägt `data-loeschknopf`; Menüeinträge nicht (ein
 *      Menüeintrag ist kein runder Knopf). Und die zwei `confirm()`, die
 *      der Knopf ersetzt, sind weg; „Papierkorb leeren" fragt weiter. Und
 *      jeder nennt, WAS er löscht — kein nacktes „Löschen" als Name
 *      (Durchsicht 5. Oktober).
 *   §3 DER PAPIERKORB (Rechner, dunkel): ein Druck öffnet „Endgültig
 *      löschen" / „Abbrechen", der Fokus steht auf „Abbrechen", gelöscht
 *      ist nichts; EIN Filter im Dokument, an während des Fliessens, aus
 *      in Ruhe; Escape schliesst NUR das Paar (der Papierkorb bleibt offen);
 *      zurück fliesst die Flüssigkeit in die Grösse des Knopfs (32 px in
 *      der dichten Zeile), und im ersten Bild ohne sie steht der Knopf ganz
 *      da — kein Sprung, kein Blinken (Nachtrag 3. Oktober, im Bildstreifen
 *      gesehen); „Abbrechen" und gleich wieder gedrückt lässt das neue Paar
 *      offen; ein Doppelklick löscht nicht; die rote Pille löscht genau einmal,
 *      ohne Browser-Frage, und der Fokus bleibt in der Liste. Durchsicht
 *      5. Oktober: der Knopf nennt die Seite; unter dem ruhenden Zeiger kommt
 *      die rote Pille ganz (nicht aus dem Durchsichtigen) und bleibt lesbar
 *      (≥ 4,5 : 1); schliesst das Paar von selbst, steht der Fokus wieder am
 *      Knopf.
 *   §4 DIE MASSE (§37): Kreis rund, Pillen mindestens 44 px hoch, und
 *      jedes Wort passt in seine Pille (Luft ≥ 24 px).
 *   §5 DIE BEREICHE IN DEN EINSTELLUNGEN (Telefon, hell): Druck daneben
 *      schliesst; „Löschen" nimmt den Bereich weg; das Paar heisst für
 *      Vorleser „Bereich „Schule" löschen", ohne das Wort zu doppeln.
 *   §6 WENIGER BEWEGUNG: kein Filter, das Paar blendet nur auf — und die
 *      Tastatur (Enter öffnet, Enter auf „Abbrechen" schliesst, Fokus zurück).
 *   §7 WO DER KNOPF ANDERS WOHNT (Rechner, dunkel; Durchsicht 5. Oktober):
 *      in der Seitenleiste der Bedingten Farbe liegen die Pillen obenauf,
 *      „Abbrechen" lässt die Leiste offen, „Löschen" nimmt eine Regel, und
 *      der Fokus bleibt in der neu gezeichneten Leiste; die
 *      Chatliste der KI zeigt ihren Knopf am Rechner erst beim Überfahren,
 *      wie vor E709, und von dort öffnet er das Paar.
 *
 * KANN DAS ROT WERDEN? (§55.2) Ja — gegen den Stand b3cf193 (vor E709) fällt
 * §1 bis §6: es gibt weder den Helfer noch ein `data-loeschknopf`, und der
 * Papierkorb fragt mit `confirm()`.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test586.mts             alles, mit Browser
 *   node pruefungen/lauf/test586.mts --dateien   nur §1 und §2, ohne Browser
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Einstellungen: any;
declare const Datenbank: any; declare const KI: any;
import { chromium, type Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const lies = (rel: string): string => {
  try { return fs.readFileSync(path.join(WURZEL, rel), 'utf8'); } catch { return ''; }
};

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* ==========================================================================
 * §1 · Der Helfer ist da und geladen
 * ========================================================================*/
console.log('\n§1 · Der Helfer ist da und geladen');
const index = lies('index.html');
const sw = lies('src/dienst/sw.ts');
const helfer = lies('src/schale/bedienung/delete.ts');
const blatt = lies('quell/schale/stil/loeschen.css');
p('src/schale/bedienung/delete.ts gibt es', helfer.includes('const RedionDelete'));
p('quell/schale/stil/loeschen.css gibt es', blatt.includes('.ru-loesch-goo'));
p('index.html lädt das Skript (defer)', index.includes('<script src="quell/schale/bedienung/delete.js" defer></script>'));
p('index.html verlinkt das Blatt', index.includes('<link rel="stylesheet" href="quell/schale/stil/loeschen.css">'));
p('Beide stehen im GRUNDSTOCK (offline, §28)',
  sw.includes("'./quell/schale/bedienung/delete.js'") && sw.includes("'./quell/schale/stil/loeschen.css'"));
p('start.ts startet ihn — der einzige Einstiegspunkt (§7)', lies('src/start.ts').includes('RedionDelete.start()'));
/* EINE feste Kennung, keine je Knopf — seit dem Zusammenführen der zweiten
   Welle die EINE der App: der Knopf baut keinen Filter mehr, er leiht
   `Linse.TROPFEN` (#ru-linse-tropfen, test589 §15). Vorher stand hier
   `GOO_ID = 'ru-loesch-goo'`; die Zusage ist dieselbe, nur mit weniger
   Filtern im Dokument. */
p('EIN Filter im Dokument (eine feste Kennung, keine je Knopf)',
  /Linse\.tropfenLeihen\(\)/.test(helfer) && !/createElementNS\([^)]*'filter'/.test(helfer) &&
  !/useId|uid\b/.test(helfer));
p('Der Filter hängt am Fliessen, nicht an der Ruhe',
  /\.ru-loesch\[data-fliesst\] \.ru-loesch-goo\{[^}]*filter: url\(#ru-linse-tropfen\)/.test(blatt) &&
  !/^\.ru-loesch-goo\{[^}]*filter:/m.test(blatt));
p('Kein React, keine Insel: der Helfer ist Redions eigenes TypeScript',
  helfer !== '' && !/React|Inseln\.|islands/.test(helfer));

/* ==========================================================================
 * §2 · Jeder runde Löschen-Knopf macht mit
 * ========================================================================*/
console.log('\n§2 · Jeder runde Löschen-Knopf macht mit');
const alleTs = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? alleTs(path.join(d, e.name)) : e.name.endsWith('.ts') ? [path.join(d, e.name)] : []);
const dateien = alleTs(path.join(WURZEL, 'src')).filter(f => !f.includes(path.join('src', 'islands')));
const ohne: string[] = [];
let mit = 0;
for (const f of dateien) {
  const t = fs.readFileSync(f, 'utf8');
  const rel = path.relative(WURZEL, f);
  /* Ein 🗑 als EIGENER Knopf: `<button …>🗑</button>` oder eine Tat-Stelle
     `<span class="… weg" …>🗑</span>`. Menüzeilen tragen `<span class="mi">🗑`. */
  for (const m of t.matchAll(/<(button|span)\b([^<>]*)>🗑<\/\1>/g)) {
    if (/class="mi"/.test(m[2] ?? '')) continue;
    if (/data-loeschknopf/.test(m[2] ?? '')) mit++; else ohne.push(rel + ': ' + m[0].slice(0, 70));
  }
  /* Gebaute Knöpfe: `x.textContent = '🗑'` braucht das Merkmal davor. */
  for (const m of t.matchAll(/(\w+)\.textContent = '🗑';/g)) {
    const vor = t.slice(Math.max(0, (m.index ?? 0) - 400), m.index ?? 0);
    if (vor.includes(m[1] + '.dataset.loeschknopf')) mit++; else ohne.push(rel + ': ' + m[0]);
  }
}
/* Die Chatliste trägt ein gezeichnetes ✕ statt 🗑 — auch sie löscht. */
const kiDienst = lies('src/bereiche/ki/dienst.ts');
p('Der Löschen-Knopf der Chatliste macht mit', /class="ki-weg"[^>]*data-loeschknopf/.test(kiDienst));
p('Kein runder Löschen-Knopf ohne `data-loeschknopf`', ohne.length === 0, ohne.slice(0, 6).join(' | '));
p('Und es sind alle bekannten Stellen (mindestens 22)', mit >= 22, String(mit));
const schale = lies('src/schale/aufbau/schale.ts');
/* Kommentare zählen nicht — dort darf stehen, was hier früher stand. */
const purge = schale.slice(schale.indexOf("s.dataset.a === 'purge'"), schale.indexOf("s.dataset.a === 'purge'") + 900)
  .replace(/\/\*[\s\S]*?\*\//g, '');
p('Der Papierkorb fragt beim einzelnen Endgültig-Löschen nicht mehr mit confirm()',
  purge.length > 0 && !purge.includes('confirm('));
p('„Papierkorb leeren" behält seine Frage (viele Dinge auf einmal)',
  /data-a="alle"\]'\)\) \{[\s\S]{0,300}confirm\(/.test(schale));
const erw = lies('src/bereiche/einstellungen/erweiterungen.ts');
p('Erweiterung entfernen: die Frage stellt der Knopf, nicht confirm()',
  !/wirklich entfernen\?/.test(erw) && erw.includes('data-loeschknopf="Entfernen"'));
/* Durchsicht 5. Oktober: zwei Knöpfe hiessen für Vorleser nur „Löschen" —
   das Paar sagte dann „Löschen: Löschen", und WAS gelöscht wird, stand
   nirgends. Ein Name aus dem nackten Wort zählt nicht. */
const nackt: string[] = [];
for (const f of dateien) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/<(?:button|span)\b[^<>]*data-loeschknopf[^<>]*>/g))
    if (/(?:aria-label|title)="(?:Löschen|Entfernen)"/.test(m[0])) nackt.push(path.relative(WURZEL, f) + ': ' + m[0].slice(0, 80));
}
p('Jeder runde Löschen-Knopf nennt, WAS er löscht (kein nacktes „Löschen" als Name)', nackt.length === 0,
  nackt.slice(0, 4).join(' | '));

/* `--dateien`: nur §1 und §2, ohne Browser (für den schnellen Lauf und
   für Gegenproben ohne Browser-Schloss). */
if (process.argv.includes('--dateien')) {
  console.log(`\n${ok} von ${ok + weg} Prüfungen grün (nur Dateien)`);
  process.exit(weg ? 1 : 0);
}

/* ==========================================================================
 * Der Browser
 * ========================================================================*/
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
const fehler: string[] = [];
let fragen = 0;

const aufmachen = async (o: { handy?: boolean; ruhig?: boolean; dunkel?: boolean }): Promise<{ pc: Page; zu: () => Promise<void> }> => {
  const kontext = await browser.newContext({
    viewport: o.handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: !!o.handy, isMobile: !!o.handy,
    colorScheme: o.dunkel ? 'dark' : 'light',
    ...(o.ruhig ? { reducedMotion: 'reduce' as const } : {})
  });
  const pc = await kontext.newPage();
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 150)));
  pc.on('dialog', d => { fragen++; void d.dismiss(); });
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pc.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && !!document.querySelector("#page")');
  await pc.waitForTimeout(1500);
  await pc.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    App.theme(${o.dunkel ? "'dark'" : "'light'"});
  })()`);
  await pc.waitForTimeout(300);
  return { pc, zu: () => kontext.close() };
};

const papierkorbFuellen = (pc: Page) => pc.evaluate(() => {
  for (const n of ['Nachtfahrt', 'Skizzen', 'Einkauf']) {
    /* addPage(Eltern, Felder) — vorher stand das Objekt als Eltern da, und
       die drei Seiten hiessen „Ohne Titel" (Durchsicht 5. Oktober). */
    const s = Store.addPage(null, { text: n });
    Store.trashBlock(s.id);
  }
  App.papierkorb();
});
/* Ein Text oder null — nie 30 s auf etwas warten, das es nicht gibt. */
const text = (pc: Page, wahl: string) =>
  pc.evaluate((w: string) => document.querySelector(w)?.textContent ?? null, wahl) as Promise<string | null>;
/* Drücken, wenn es das Ziel gibt; sonst false (der Punkt danach wird rot). */
const druecke = async (pc: Page, wahl: string, doppelt = false): Promise<boolean> => {
  const l = pc.locator(wahl).first();
  if (await l.count() === 0) return false;
  if (doppelt) await l.dblclick({ timeout: 3000 }); else await l.click({ timeout: 3000 });
  return true;
};
const zahl = (pc: Page) => pc.evaluate(() => Store.trashed().length) as Promise<number>;
const zustand = (pc: Page) => pc.evaluate(() => {
  const t = document.querySelector<HTMLElement>('[data-loesch-offen]');
  const l = document.querySelector<HTMLElement>('.ru-loesch');
  const goo = l?.querySelector<HTMLElement>('.ru-loesch-goo');
  const a = document.activeElement;
  return {
    offen: !!l?.hasAttribute('data-auf'),
    expanded: t?.getAttribute('aria-expanded') ?? null,
    fokusAbbrechen: !!a?.classList.contains('ru-loesch-nein'),
    /* am Knopf — oder an seiner Zeile, wenn der Knopf selbst ein <span> ist */
    fokusKnopf: !!a && a !== document.body &&
      (a.hasAttribute('data-loeschknopf') || !!a.querySelector('[data-loeschknopf]')),
    fokusImFenster: !!a && a !== document.body && !!a.closest('.overlay'),
    filterZahl: document.querySelectorAll('filter#ru-linse-tropfen').length,
    filter: goo ? getComputedStyle(goo).filter : '',
    sichtbar: goo ? getComputedStyle(goo).visibility : '',
    overlays: document.querySelectorAll('.overlay').length,
    ruhig: !!l?.hasAttribute('data-ruhig')
  };
});

/* ==========================================================================
 * §3 · Der Papierkorb, Rechner, dunkel
 * ========================================================================*/
console.log('\n§3 · Der Papierkorb (Rechner, dunkel)');
{
  const { pc, zu } = await aufmachen({ dunkel: true });
  await papierkorbFuellen(pc);
  await pc.waitForTimeout(500);
  const vorher = await zahl(pc);
  p('Drei Seiten liegen im Papierkorb', vorher === 3, String(vorher));
  const knopf = pc.locator('.pk-tat[data-a="purge"]').first();
  p('Der Endgültig-Löschen-Knopf trägt data-loeschknopf',
    await knopf.getAttribute('data-loeschknopf') === 'Endgültig löschen');
  /* Das Aufgehen Bild für Bild (Durchsicht 5. Oktober): am Rechner ruht der
     Zeiger nach dem Druck auf der roten Pille (sie liegt, wo der Kreis war).
     Bei der Übergabe von der Flüssigkeit an die CSS-Pille blendete deren
     Fläche über den Übergang fürs Überfahren aus dem Durchsichtigen ein —
     ein, zwei Bilder lang war die Pille leer (Bildstreifen vom 3. Oktober,
     753 ms). Gemessen wird die Deckkraft der Fläche im ersten Bild ohne
     Fliessen. */
  await pc.evaluate(() => {
    const w = window as unknown as { __aufBilder: Array<{ ms: number; fliesst: boolean; deck: number }> };
    w.__aufBilder = [];
    const los = performance.now();
    const bild = (): void => {
      const l = document.querySelector('.ru-loesch[data-auf]');
      const ja = l?.querySelector<HTMLElement>('.ru-loesch-ja');
      if (l && ja) {
        /* Die Deckkraft aus rgb()/rgba() ODER color(srgb … / a) — ein
           color-mix() kommt als color(srgb …) zurück; was keine Farbe ist,
           zählt als durchsichtig. */
        const s = getComputedStyle(ja).backgroundColor;
        const c = s.match(/^color\(srgb\s+[^/)]+(?:\/\s*([\d.]+))?\)/);
        const r = s.match(/^rgba?\(([^)]+)\)/);
        const t = (r?.[1] ?? '').split(/[ ,/]+/).filter(Boolean).map(Number);
        const deck = c ? (c[1] !== undefined ? Number(c[1]) : 1) : r ? (t.length > 3 ? (t[3] ?? 0) : 1) : 0;
        w.__aufBilder.push({ ms: Math.round(performance.now() - los), fliesst: l.hasAttribute('data-fliesst'), deck });
      }
      if (performance.now() - los < 1300) requestAnimationFrame(bild);
    };
    requestAnimationFrame(bild);
  });
  await druecke(pc, '.pk-tat[data-a="purge"]');
  await pc.waitForTimeout(120);
  const z1 = await zustand(pc);
  p('Ein Druck öffnet das Paar', z1.offen && z1.expanded === 'true', JSON.stringify(z1));
  p('Der Fokus steht auf „Abbrechen" (die sichere Wahl)', z1.fokusAbbrechen);
  /* Für Vorleser nennt das Paar, WAS endgültig weggeht (Durchsicht
     5. Oktober; vorher hiess es „Endgültig löschen: Endgültig löschen").
     Gelesen wird der Name des Paars und der roten Pille — nicht ein
     aria-label am <span>: das ginge in den Namen der Zeile ein, die selbst
     ein <button> ist und zurückholt. */
  const pkName = await pc.evaluate(() => ({
    paar: document.querySelector('.ru-loesch-paar')?.getAttribute('aria-label') ?? null,
    ja: document.querySelector('.ru-loesch-ja')?.getAttribute('aria-label') ?? null,
    zeile: document.querySelector('.pk-tat[data-a="purge"]')?.closest('button')?.getAttribute('aria-label') ?? null }));
  const seite = /^„(Nachtfahrt|Skizzen|Einkauf)“ endgültig löschen$/;
  p('Er nennt die Seite, die endgültig weggeht', seite.test(pkName.paar ?? '') && seite.test(pkName.ja ?? '') &&
    pkName.zeile === null, JSON.stringify(pkName));
  p('Gelöscht ist noch nichts, gefragt hat der Browser nicht', await zahl(pc) === 3 && fragen === 0,
    `${await zahl(pc)} im Papierkorb, ${fragen} Browser-Fragen`);
  p('Die rote Pille heisst „Endgültig löschen"',
    (await text(pc, '.ru-loesch-ja .ru-loesch-wort')) === 'Endgültig löschen');
  p('EIN Klebefilter im Dokument', z1.filterZahl === 1, String(z1.filterZahl));
  p('Während es fliesst, ist er an', /url\(/.test(z1.filter) && z1.sichtbar === 'visible', z1.filter + ' ' + z1.sichtbar);
  await pc.waitForTimeout(900);
  const z2 = await zustand(pc);
  p('In Ruhe ist er aus (keine Flüssigkeit, CSS-Pillen)', !/url\(/.test(z2.filter) || z2.sichtbar === 'hidden',
    z2.filter + ' ' + z2.sichtbar);
  type AufBild = { ms: number; fliesst: boolean; deck: number };
  const aufBilder = await pc.evaluate(() => (window as unknown as { __aufBilder: AufBild[] }).__aufBilder);
  const uebergabe = aufBilder.find((b, i) => i > 0 && !b.fliesst && !!aufBilder[i - 1]?.fliesst);
  p('Am Rechner kommt die rote Pille unter dem Zeiger ganz, nicht aus dem Durchsichtigen',
    !!uebergabe && uebergabe.deck >= 0.99,
    `erstes Bild ohne Fliessen: ${JSON.stringify(uebergabe)}, ${aufBilder.length} Bilder`);
  /* Und lesbar unter dem Zeiger: eine rote Tönung unter dem roten Wort nahm
     ihm im dunklen Standard den Kontrast (3,94 : 1, in „Wald" 3,81). */
  const zeiger = await pc.evaluate(() => {
    const ja = document.querySelector<HTMLElement>('.ru-loesch-ja');
    const wort = ja?.querySelector<HTMLElement>('.ru-loesch-wort:not(.ru-loesch-schmier)');
    if (!ja || !wort) return { hover: false, kontrast: 0 };
    /* rgb()/rgba() ODER color(srgb r g b / a) (so kommt ein color-mix()
       zurück, Kanäle 0–1). Was keine Farbe ist, gilt als durchsichtig — dann
       misst der Punkt nichts und bleibt rot (früher las er es als Schwarz). */
    const farbe = (s: string): number[] => {
      const c = s.match(/^color\(srgb\s+([^/)]+)(?:\/\s*([\d.]+))?\)/);
      if (c) {
        const k = (c[1] ?? '').trim().split(/\s+/).map(Number);
        return [(k[0] ?? 0) * 255, (k[1] ?? 0) * 255, (k[2] ?? 0) * 255, c[2] !== undefined ? Number(c[2]) : 1];
      }
      const r = s.match(/^rgba?\(([^)]+)\)/);
      if (!r) return [0, 0, 0, 0];
      const t = (r[1] ?? '').split(/[ ,/]+/).filter(Boolean).map(Number);
      return [t[0] ?? 0, t[1] ?? 0, t[2] ?? 0, t.length > 3 ? (t[3] ?? 0) : 1];
    };
    const lum = (c: number[]): number => {
      const f = (v: number): number => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0] ?? 0) + 0.7152 * f(c[1] ?? 0) + 0.0722 * f(c[2] ?? 0);
    };
    const g = farbe(getComputedStyle(ja).backgroundColor);
    if ((g[3] ?? 0) < 0.99) return { hover: ja.matches(':hover'), kontrast: 0 };
    const a = lum(farbe(getComputedStyle(wort).color)), b = lum(g);
    return { hover: ja.matches(':hover'), kontrast: Math.round((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) * 100) / 100 };
  });
  p('Unter dem ruhenden Zeiger ist „Endgültig löschen" lesbar (mindestens 4,5 : 1)',
    zeiger.hover && zeiger.kontrast >= 4.5, JSON.stringify(zeiger));

  /* §4 · Masse */
  const mass = await pc.evaluate(() => {
    const kEl = document.querySelector<HTMLElement>('.pk-tat[data-loeschknopf]');
    const jaEl = document.querySelector<HTMLElement>('.ru-loesch-ja');
    const neinEl = document.querySelector<HTMLElement>('.ru-loesch-nein');
    if (!kEl || !jaEl || !neinEl) return { kb: 0, kh: -1, ja: 0, nein: 0, jaB: 0, rund: '', luftJa: -1, luftNein: -1 };
    const k = kEl.getBoundingClientRect(), ja = jaEl.getBoundingClientRect(), nein = neinEl.getBoundingClientRect();
    /* Luft neben dem Wort: Breite der Pille minus Breite des Worts (Layout,
       ohne Verwandlung) — „Endgültig löschen" darf nicht über die Pille laufen. */
    const luft = (b: HTMLElement): number =>
      b.offsetWidth - (b.querySelector<HTMLElement>('.ru-loesch-wort:not(.ru-loesch-schmier)')?.offsetWidth ?? 1e4);
    return { kb: k.width, kh: k.height, ja: ja.height, nein: nein.height, jaB: ja.width,
             rund: getComputedStyle(kEl).borderRadius, luftJa: luft(jaEl), luftNein: luft(neinEl) };
  });
  console.log('\n§4 · Die Masse (§37)');
  p('Der Kreis ist rund (Breite = Höhe)', Math.abs(mass.kb - mass.kh) < 1 && mass.kb >= 32, JSON.stringify(mass));
  p('„Endgültig löschen" und „Abbrechen" sind mindestens 44 px hoch', mass.ja >= 44 && mass.nein >= 44,
    JSON.stringify(mass));
  p('Jedes Wort passt in seine Pille, mit Luft an beiden Seiten', mass.luftJa >= 24 && mass.luftNein >= 24,
    JSON.stringify(mass));

  /* Das Zurückfliessen Bild für Bild (Nachtrag 3. Oktober): im Bildstreifen
     schloss die Flüssigkeit als 44-px-Kreis über dem 32-px-Knopf und sprang
     dann, und im ersten Bild danach stand der Knopf blass da (sein Zeichen
     und seine Fläche blendeten über die Übergänge fürs Überfahren ein). Die
     Maus geht vorher weg, damit kein Überfahren mitmisst. */
  await pc.mouse.move(4, 4);
  await pc.evaluate(() => {
    const w = window as unknown as { __loeschBilder: unknown[] };
    w.__loeschBilder = [];
    const t = document.querySelector<HTMLElement>('[data-loesch-offen]');
    const los = performance.now();
    const bild = (): void => {
      const l = document.querySelector('.ru-loesch');
      const kreis = l?.querySelector<HTMLElement>('.ru-loesch-blob-a .ru-loesch-stueck:not(.ru-loesch-mitte):not(.ru-loesch-ende)');
      w.__loeschBilder.push({
        ms: Math.round(performance.now() - los),
        schicht: !!l,
        kreis: kreis ? Math.round(kreis.getBoundingClientRect().width * 10) / 10 : 0,
        zeichen: t ? getComputedStyle(t, '::before').opacity : '',
        flaeche: t ? getComputedStyle(t).backgroundColor : ''
      });
      if (performance.now() - los < 1000) requestAnimationFrame(bild);
    };
    requestAnimationFrame(bild);
  });
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(600);
  const z3 = await zustand(pc);
  p('Escape schliesst das Paar …', !z3.offen && await pc.locator('.ru-loesch').count() === 0);
  p('… und NUR das Paar: der Papierkorb bleibt offen', z3.overlays === 1, String(z3.overlays));
  p('Der Fokus ist zurück am runden Knopf (an seiner Zeile)', z3.fokusKnopf);
  await pc.waitForTimeout(500);
  type Bild = { ms: number; schicht: boolean; kreis: number; zeichen: string; flaeche: string };
  const bilder = await pc.evaluate(() => (window as unknown as { __loeschBilder: Bild[] }).__loeschBilder);
  const letzteMit = [...bilder].reverse().find(b => b.schicht);
  const ersteOhne = bilder.find((b, i) => i > 0 && !b.schicht && !!bilder[i - 1]?.schicht);
  const ruhe = bilder[bilder.length - 1];
  p('Zurück fliesst die Flüssigkeit in die Grösse des Knopfs (dichte Zeile, 32 px)',
    !!letzteMit && letzteMit.kreis > 0 && Math.abs(letzteMit.kreis - mass.kb) <= 3,
    `zuletzt ${letzteMit?.kreis} px bei ${letzteMit?.ms} ms, der Knopf ${mass.kb} px, ${bilder.length} Bilder`);
  p('Die Übergabe blinkt nicht: im ersten Bild danach steht der Knopf ganz da',
    !!ersteOhne && !!ruhe && parseFloat(ersteOhne.zeichen) >= 0.99 && ersteOhne.flaeche === ruhe.flaeche,
    JSON.stringify({ ersteOhne, ruhe }));

  /* „Abbrechen", und noch während es zurückfliesst (480 ms) wieder gedrückt:
     der alte Abschluss nahm dem Knopf sonst `data-loesch-offen` und
     `aria-expanded` weg, während das neue Paar offen war. */
  await druecke(pc, '.pk-tat[data-a="purge"]');
  await pc.waitForTimeout(500);
  await druecke(pc, '.ru-loesch-nein');
  await pc.waitForTimeout(100);
  await druecke(pc, '.pk-tat[data-a="purge"]');
  await pc.waitForTimeout(700);
  const z4 = await zustand(pc);
  p('Abbrechen und gleich wieder gedrückt: das neue Paar bleibt offen, der Knopf gehört ihm',
    z4.offen && z4.expanded === 'true', JSON.stringify(z4));
  /* Schliesst das Paar von selbst (Grösse ändern, Rollen, ein Druck
     daneben), während der Fokus in ihm steht (auf „Abbrechen"): die Pillen
     werden `inert`, und der Fokus fiel auf den body (Durchsicht 5. Oktober).
     Er gehört dann zurück an den Knopf. */
  const vorGroesse = await zustand(pc);
  await pc.evaluate(() => window.dispatchEvent(new Event('resize')));
  await pc.waitForTimeout(600);
  const z5 = await zustand(pc);
  p('Schliesst es von selbst (Grösse geändert), steht der Fokus wieder am Knopf, nicht auf dem body',
    vorGroesse.fokusAbbrechen && !z5.offen && z5.fokusKnopf && z5.overlays === 1,
    JSON.stringify({ vorher: vorGroesse.fokusAbbrechen, offen: z5.offen, knopf: z5.fokusKnopf, fenster: z5.overlays }));

  await druecke(pc, '.pk-tat[data-a="purge"]', true);
  await pc.waitForTimeout(150);
  p('Ein Doppelklick löscht nicht', await zahl(pc) === 3, String(await zahl(pc)));
  await pc.waitForTimeout(700);
  const gedrueckt = await druecke(pc, '.ru-loesch-ja');
  p('Die rote Pille ist da', gedrueckt);
  await pc.waitForTimeout(500);
  p('Die rote Pille löscht genau eines', await zahl(pc) === 2, String(await zahl(pc)));
  p('Ohne Browser-Frage (confirm)', fragen === 0, String(fragen));
  p('Der Fokus fällt nicht auf den body, er bleibt im Papierkorb', (await zustand(pc)).fokusImFenster);
  p('Das Paar ist weg', await pc.locator('.ru-loesch').count() === 0);
  await zu();
}

/* ==========================================================================
 * §5 · Die Bereiche in den Einstellungen, Telefon, hell
 * ========================================================================*/
console.log('\n§5 · Die Bereiche in den Einstellungen (Telefon, hell)');
{
  const { pc, zu } = await aufmachen({ handy: true });
  await pc.evaluate(() => {
    Store.setMeta('bereiche', [{ id: 'b-a', name: 'Schule', icon: '🎓' }, { id: 'b-b', name: 'Werkstatt', icon: '🔧' }]);
    Einstellungen.oeffne('bereiche');
  });
  await pc.waitForTimeout(700);
  const k = pc.locator('[data-bereich-weg="b-a"]');
  p('Der Knopf der Bereiche trägt data-loeschknopf', await k.getAttribute('data-loeschknopf') !== null);
  const r = await k.boundingBox();
  p('Der Kreis hat 44 px (§37)', !!r && r.width >= 43.5 && r.height >= 43.5, JSON.stringify(r));
  await druecke(pc, '[data-bereich-weg="b-a"]');
  await pc.waitForTimeout(150);
  p('Ein Tipp öffnet das Paar', (await zustand(pc)).offen);
  /* Für Vorleser nennt das Paar, was gelöscht wird — ohne das Wort zu
     doppeln (vorher „Löschen: Bereich „Schule" löschen"). */
  const namen = await pc.evaluate(() => ({
    paar: document.querySelector('.ru-loesch-paar')?.getAttribute('aria-label') ?? null,
    ja: document.querySelector('.ru-loesch-ja')?.getAttribute('aria-label') ?? null }));
  p('Das Paar nennt, was gelöscht wird, ohne das Wort zu doppeln',
    namen.paar === 'Bereich „Schule“ löschen' && namen.ja === 'Bereich „Schule“ löschen', JSON.stringify(namen));
  await pc.mouse.click(20, 120);
  await pc.waitForTimeout(600);
  p('Ein Tipp daneben schliesst es, nichts ist weg',
    !(await zustand(pc)).offen &&
    (await pc.evaluate(() => (Store.getMeta('bereiche', []) || []).length)) === 2);
  await druecke(pc, '[data-bereich-weg="b-a"]');
  await pc.waitForTimeout(800);
  await druecke(pc, '.ru-loesch-ja');
  await pc.waitForTimeout(500);
  const rest = await pc.evaluate(() => (Store.getMeta('bereiche', []) || []).map((b: any) => b.id).join(','));
  p('„Löschen" nimmt genau diesen Bereich weg', rest === 'b-b', rest);
  await zu();
}

/* ==========================================================================
 * §6 · Weniger Bewegung und die Tastatur
 * ========================================================================*/
console.log('\n§6 · Weniger Bewegung und die Tastatur');
{
  const { pc, zu } = await aufmachen({ ruhig: true });
  await papierkorbFuellen(pc);
  await pc.waitForTimeout(500);
  await druecke(pc, '.pk-tat[data-a="purge"]');
  await pc.waitForTimeout(80);
  const z = await zustand(pc);
  p('Weniger Bewegung: das Paar ist da, ohne Flüssigkeit', z.offen && z.ruhig && !/url\(/.test(z.filter),
    JSON.stringify(z));
  await pc.keyboard.press('Enter');
  await pc.waitForTimeout(300);
  const z2 = await zustand(pc);
  p('Enter auf „Abbrechen" schliesst, der Fokus ist zurück', !z2.offen && z2.fokusKnopf, JSON.stringify(z2));
  p('Und nichts ist gelöscht', await zahl(pc) === 3, String(await zahl(pc)));
  await zu();
}

/* ==========================================================================
 * §7 · Wo der Knopf anders wohnt (Rechner, dunkel) — Durchsicht 5. Oktober
 * --------------------------------------------------------------------------
 * Die Bedingte Farbe einer Datenbank liegt in einer Seitenleiste
 * (`.db-leiste`, z-index 620, ein Druck ausserhalb schliesst sie): das Paar
 * lag im body darunter (580) — der Knopf wurde durchsichtig, die Pillen
 * sah niemand, löschen ging nicht mehr. Und die Chatliste der KI zeigt ihre
 * Griffe am Rechner erst beim Überfahren (bausteine.css); die Spezifität
 * von loeschen.css überstimmte das — der Knopf stand immer da, und beim
 * Überfahren schob der Stern ihn unter dem Zeiger weg.
 * ========================================================================*/
console.log('\n§7 · Wo der Knopf anders wohnt (Rechner, dunkel)');
{
  const { pc, zu } = await aufmachen({ dunkel: true });
  const sicher = async (wahl: string): Promise<boolean> => { try { return await druecke(pc, wahl); } catch { return false; } };
  const obenauf = () => pc.evaluate(() => {
    const auf = (sel: string): boolean => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const m = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!m && (m === el || el.contains(m));
    };
    return { ja: auf('.ru-loesch-ja'), nein: auf('.ru-loesch-nein') };
  });
  await pc.evaluate(() => {
    const s = Store.addBlock(null, 'page', { text: 'DB-Probe' });
    const db = Store.addDatabase(s.id, 'Tickets', { title: { name: 'Titel', type: 'title' } });
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'R1' });
    const view: any = Object.values(Store.cache.views).find((v: any) => v.collectionId === c.id);
    view.farbregeln = [{ key: 'title', op: 'contains', wert: 'R', farbe: 'red' },
                       { key: 'title', op: 'contains', wert: 'S', farbe: 'blue' }];
    (window as any).__v = view;
    Datenbank.farbregelPanel(c, view, null);
  });
  await pc.waitForTimeout(600);
  const regeln = () => pc.evaluate(() => ((window as any).__v.farbregeln || []).length) as Promise<number>;
  await sicher('.fr-zeile [data-loeschknopf]');
  await pc.waitForTimeout(800);
  const f1 = await obenauf();
  p('Bedingte Farbe (Seitenleiste): die Pillen liegen obenauf, nicht unter der Leiste', f1.ja && f1.nein, JSON.stringify(f1));
  const abgebrochen = await sicher('.ru-loesch-nein');
  await pc.waitForTimeout(600);
  const f2 = await pc.evaluate(() => ({ leiste: document.querySelectorAll('.db-leiste').length,
                                         schicht: document.querySelectorAll('.ru-loesch').length }));
  p('„Abbrechen" schliesst nur das Paar — die Seitenleiste bleibt, die Regeln auch',
    abgebrochen && f2.leiste === 1 && f2.schicht === 0 && await regeln() === 2,
    JSON.stringify({ abgebrochen, ...f2, regeln: await regeln() }));
  await sicher('.fr-zeile [data-loeschknopf]');
  await pc.waitForTimeout(800);
  const geloescht = await sicher('.ru-loesch-ja');
  await pc.waitForTimeout(500);
  p('„Löschen" nimmt dort genau eine Regel weg', geloescht && await regeln() === 1, String(await regeln()));
  /* Die Leiste zeichnet sich nach dem Löschen NEU (eine neue <aside>) — der
     Fokus fiel auf den body. Er gehört in die neue Leiste, an den nächsten
     Löschen-Knopf. */
  await pc.waitForTimeout(600);
  const fokusNach = await pc.evaluate(() => {
    const a = document.activeElement;
    return { body: a === document.body, leiste: !!a?.closest('.db-leiste'), knopf: !!a?.hasAttribute('data-loeschknopf') };
  });
  p('… und der Fokus bleibt in der neu gezeichneten Leiste, am nächsten Löschen-Knopf',
    !fokusNach.body && fokusNach.leiste && fokusNach.knopf, JSON.stringify(fokusNach));
  await pc.evaluate(() => document.querySelectorAll('.db-leiste').forEach(x => x.remove()));

  await pc.evaluate(() => {
    Store.setMeta('chats', [{ id: 'c1', titel: 'Referat Zellbiologie', wann: Date.now(), verlauf: [] },
                            { id: 'c2', titel: 'Ferienplanung', wann: Date.now() - 1000, verlauf: [] }]);
    KI.verlauf();
  });
  await pc.waitForTimeout(700);
  await pc.mouse.move(4, 4);
  await pc.waitForTimeout(200);
  const zeig = () => pc.evaluate(() => {
    const w = document.querySelector<HTMLElement>('.ki-chat .ki-weg');
    return w ? getComputedStyle(w).display : null;
  });
  const ruhend = await zeig();
  p('Chatliste am Rechner: der Löschen-Knopf erscheint erst beim Überfahren (wie vor E709)', ruhend === 'none', String(ruhend));
  await pc.hover('.ki-chat').catch(() => {});
  await pc.waitForTimeout(150);
  const ueber = await zeig();
  const geoeffnet = await sicher('.ki-chat .ki-weg');
  await pc.waitForTimeout(800);
  const c3 = await obenauf();
  p('… beim Überfahren ist er da, ein Druck öffnet das Paar, und es liegt obenauf',
    !!ueber && ueber !== 'none' && geoeffnet && (await zustand(pc)).offen && c3.ja && c3.nein,
    JSON.stringify({ ueber, geoeffnet, ...c3 }));
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(500);
  await zu();
}

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
