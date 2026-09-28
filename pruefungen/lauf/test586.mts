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
 *      der Knopf ersetzt, sind weg; „Papierkorb leeren" fragt weiter.
 *   §3 DER PAPIERKORB (Rechner, dunkel): ein Druck öffnet „Endgültig
 *      löschen" / „Abbrechen", der Fokus steht auf „Abbrechen", gelöscht
 *      ist nichts; EIN Filter im Dokument, an während des Fliessens, aus
 *      in Ruhe; Escape schliesst NUR das Paar (der Papierkorb bleibt offen);
 *      ein Doppelklick löscht nicht; die rote Pille löscht genau einmal,
 *      ohne Browser-Frage, und der Fokus bleibt in der Liste.
 *   §4 DIE MASSE (§37): Kreis rund, Pillen mindestens 44 px hoch.
 *   §5 DIE BEREICHE IN DEN EINSTELLUNGEN (Telefon, hell): Druck daneben
 *      schliesst; „Löschen" nimmt den Bereich weg.
 *   §6 WENIGER BEWEGUNG: kein Filter, das Paar blendet nur auf — und die
 *      Tastatur (Enter öffnet, Enter auf „Abbrechen" schliesst, Fokus zurück).
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
p('EIN Filter im Dokument (eine feste Kennung, keine je Knopf)',
  (helfer.match(/GOO_ID = 'ru-loesch-goo'/g) || []).length === 1 && !/useId|uid\b/.test(helfer));
p('Der Filter hängt am Fliessen, nicht an der Ruhe',
  /\.ru-loesch\[data-fliesst\] \.ru-loesch-goo\{[^}]*filter: url\(#ru-loesch-goo\)/.test(blatt) &&
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
    const s = Store.addPage({ text: n });
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
    filterZahl: document.querySelectorAll('filter#ru-loesch-goo').length,
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
  await druecke(pc, '.pk-tat[data-a="purge"]');
  await pc.waitForTimeout(120);
  const z1 = await zustand(pc);
  p('Ein Druck öffnet das Paar', z1.offen && z1.expanded === 'true', JSON.stringify(z1));
  p('Der Fokus steht auf „Abbrechen" (die sichere Wahl)', z1.fokusAbbrechen);
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

  /* §4 · Masse */
  const mass = await pc.evaluate(() => {
    const kEl = document.querySelector<HTMLElement>('.pk-tat[data-loeschknopf]');
    const jaEl = document.querySelector<HTMLElement>('.ru-loesch-ja');
    const neinEl = document.querySelector<HTMLElement>('.ru-loesch-nein');
    if (!kEl || !jaEl || !neinEl) return { kb: 0, kh: -1, ja: 0, nein: 0, jaB: 0, rund: '' };
    const k = kEl.getBoundingClientRect(), ja = jaEl.getBoundingClientRect(), nein = neinEl.getBoundingClientRect();
    return { kb: k.width, kh: k.height, ja: ja.height, nein: nein.height, jaB: ja.width,
             rund: getComputedStyle(kEl).borderRadius };
  });
  console.log('\n§4 · Die Masse (§37)');
  p('Der Kreis ist rund (Breite = Höhe)', Math.abs(mass.kb - mass.kh) < 1 && mass.kb >= 32, JSON.stringify(mass));
  p('„Endgültig löschen" und „Abbrechen" sind mindestens 44 px hoch', mass.ja >= 44 && mass.nein >= 44,
    JSON.stringify(mass));

  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(600);
  const z3 = await zustand(pc);
  p('Escape schliesst das Paar …', !z3.offen && await pc.locator('.ru-loesch').count() === 0);
  p('… und NUR das Paar: der Papierkorb bleibt offen', z3.overlays === 1, String(z3.overlays));
  p('Der Fokus ist zurück am runden Knopf (an seiner Zeile)', z3.fokusKnopf);

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

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
