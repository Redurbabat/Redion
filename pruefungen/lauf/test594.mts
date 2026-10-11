/* Suite 594 — Ordner bearbeiten: Name, Farbe, Symbol, Verschieben, Papierkorb (E718)
 * ============================================================================
 * Redur, Masterprompt vom 29. September 2026, Seite 13 (seine Notiz unter
 * dem Foto der Bibliothek, wörtlich):
 *
 *     „hier beiM BIBLOTEK KANN ich wie beim biblotek die ordner farbe oder
 *      die ordner selbst nicht bearbeiten, behebe das problem und auch die
 *      rechtsk klickt sollte hier für die ordner haben ."
 *
 * und Seite 19: „Hier füge ... und oder beim rechts klicke sollte es mir
 * zeigen löschen". „wie beim biblotek" heisst: wie bei den Notizheften, wo
 * ein Fach im ⋯ „Umbenennen" und „Farbe" AN ORT UND STELLE kann (E672).
 *
 * Dieser Lauf hält die FUNKTIONEN dahinter — dass Umbenennen, Farbe,
 * Symbol, Verschieben und Löschen in der Bibliothek WIRKLICH gehen und
 * keine Daten kosten. Der Rechtsklick, das echte „…" und die Tastatur im
 * Menü gehören dem Zweig `claude/menue-eine-quelle`, der diese Griffe ruft.
 *
 *   §1  Umbenennen aus dem ⌄ einer Ordnerkarte — an der Wurzel UND drinnen
 *       (über den Ablagebaum hineingegangen): man bleibt in der Bibliothek,
 *       der Name steht neu in Karte, Ablagebaum und Seitenleiste, ohne
 *       Neuladen. (Rot: das Menü öffnete den Ordner als Seite, E380.)
 *   §2  „   " ist kein Name: der alte bleibt, eine Meldung sagt warum, und
 *       es wird noch einmal gefragt.
 *   §3  Steuerzeichen und Zeilenumbrüche fliegen hinaus: „A␇B⏎C" → „AB C"
 *       (über `UI.frage`, weil man ein BEL nicht tippen kann).
 *   §4  Gleicher Name im selben Ordner → die Frage; „Anderen Namen wählen"
 *       fragt neu, „Trotzdem so nennen" speichert.
 *   §5  DIESELBEN Regeln im ⋯ der Notizhefte und im Seitenmenü (EIN Weg).
 *   §6  Nach dem Neuladen steht der Name noch da.
 *   §7  Farbe aus dem ⌄ → Karte, Ablagebaum UND Seitenleiste sofort, hell
 *       und dunkel. (Rot: die Seitenleiste blieb leer bis zum nächsten Zeichnen.)
 *   §8  Farbe und Name aus den Notizheften → die Seitenleiste sofort.
 *   §9  Ein eigenes Symbol steht auf Karte, Baum und Seitenleiste, auch
 *       nach dem Neuladen.
 *   §10 Was nicht in `Farben` steht, erreicht das Markup nicht; ein Symbol
 *       wird escaped (§19).
 *   §11 Einen Ordner in der Seitenleiste auf sein eigenes Kind ziehen →
 *       abgewiesen, keine Ausnahme, beide bleiben, parentId unverändert.
 *       (Rot: RangeError, ein Ring, beide weg aus der Leiste.)
 *   §12 Verschieben über den Wähler geht weiter.
 *   §13 Papierkorb aus der Bibliothek → trashedAt, aus dem Inhalt des
 *       Elternteils, ein Protokolleintrag, eine Meldung mit einem echten
 *       „Rückgängig"-Knopf (44 px, benannt, mit der Tastatur erreichbar),
 *       der alles zurückholt — an derselben Stelle. Am Rechner und am Telefon.
 *   §14 Die Kinder eines weggelegten Ordners stehen nicht mehr in Alle,
 *       Zuletzt, Favoriten und an der Wurzel des Baums — und kommen mit ihm
 *       zurück.
 *   §15 „Löschen" im Blockmenü auf einer Unterseite und auf einer Datenbank
 *       → Papierkorb samt Kindern, nach dem Neuladen noch zurückzuholen.
 *       (Rot: WEG — trashBlock + purgeBlock, nicht in Store.trashed().)
 *       Dazu die zwei Wege, die die Durchsicht vom 6. Oktober fand: das ⋯
 *       der Datenbank selbst („Datenbank löschen" — ein `confirm()`, dann
 *       purge) und Entf auf einer Mehrfachauswahl (`Mehrfach`, purge).
 *       Beide → Papierkorb, ohne Browser-Rückfrage, nach dem Neuladen noch da.
 *   §16 Rechte (§26, L102): wer auf DIESER Seite nur lesen darf, kann sie
 *       weder umbenennen noch in den Papierkorb legen — gefragt wird gegen
 *       die angefasste Seite, nicht gegen die offene. Wer bearbeiten darf,
 *       kann es weiter.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Er war es: eingecheckt als „test594 (rot)" gegen 1bfaca53, bevor E718
 * gebaut war. Die Gegenproben stehen im Commit von E718.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test594.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];

type Bestand = { ordner: string; kind: string; enkel: string; unter: string; zwilling: string;
                 fach: string; heft: string };
type Auf = { s: Page; k: BrowserContext } & Bestand;

/** Ein Ordner „Kabelkunde" (mit Unterordner „Leitungen", darin „Querschnitte"),
 *  ein Geschwister „Zwilling", und ein Fach „Elektrotechnik" mit einem Heft. */
const aufmachen = async (o: { handy?: boolean; dunkel?: boolean } = {}): Promise<Auf> => {
  const k = await browser.newContext({
    viewport: o.handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: !!o.handy, isMobile: !!o.handy, colorScheme: o.dunkel ? 'dark' : 'light'
  });
  const s = await k.newPage();
  s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined' && typeof Bibliothek !== 'undefined' && (document.getElementById('tree')?.children.length || 0) > 0",
    null, { timeout: 30000 });
  const ids = await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('bibForm', 'deckel');
    Store.setMeta('bibOrdner', '');
    Store.setMeta('bibBaumSichtbar', true);
    Store.setMeta('heft:reiter', 'dokumente');
    Store.setMeta('heft:fach', '');
    App.theme(${o.dunkel ? "'dark'" : "'light'"});
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    const ordner = Store.addPage(null, { text: 'Kabelkunde', icon: '📁' });
    const kind = Store.addPage(ordner.id, { text: 'Leitungen', icon: '📁' });
    const enkel = Store.addPage(kind.id, { text: 'Querschnitte' });
    const unter = Store.addPage(ordner.id, { text: 'Absicherung', favorite: true, zuletztGeoeffnet: new Date().toISOString() });
    const zwilling = Store.addPage(null, { text: 'Zwilling' });
    Store.updateBlock(ordner.id, { aufgeklappt: true });
    const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '\\u{1F5C2}', heftArt: 'fach' });
    const heft = Store.addPage(fach.id, { text: 'Kapitel 2' });
    Store.addBlock(heft.id, 'blatt', { papier: 'blanko' });
    await Store.flush();
    App.zeichneBaum();
    return { ordner: ordner.id, kind: kind.id, enkel: enkel.id, unter: unter.id, zwilling: zwilling.id,
             fach: fach.id, heft: heft.id };
  })()`) as Bestand;
  return { s, k, ...ids };
};

const zurBibliothek = async (s: Page, ordner = ''): Promise<void> => {
  /* Mit Ziel: `Bibliothek.oeffne()` ohne Angabe bliebe im Ordner, in den man
     zuletzt hineinging (der Zustand lebt im Speicher, nicht nur im Merker). */
  await s.evaluate(`Store.setMeta('bibOrdner', ${JSON.stringify(ordner)}); Store.setMeta('bibBaumSichtbar', true); Bibliothek.oeffne(${JSON.stringify(ordner)})`);
  await s.waitForSelector('.bib-gitter .bib-deckel', { timeout: 20000 });
  await s.evaluate(`(() => { const d = document.querySelector('details.bib-ablage-baum'); if (d) d.open = true; })()`);
  await s.waitForTimeout(400);
};

/** Das ⌄-Menü einer Karte öffnen und einen Eintrag drücken. */
const kartenMenue = async (s: Page, id: string, eintrag: string): Promise<boolean> => {
  await s.evaluate(`document.querySelectorAll('.menu').forEach(m => m.remove())`);
  await s.evaluate(`document.querySelector('.bib-deckel[data-id="${id}"] .bib-deckel-mehr')?.click()`);
  await s.waitForTimeout(250);
  return await s.evaluate(`(() => {
    const b = [...document.querySelectorAll('.menu button[data-a]')].find(x => x.getAttribute('data-a') === ${JSON.stringify(eintrag)});
    if (!b) return false; b.click(); return true;
  })()`) as boolean;
};

/** Eine Frage beantworten, wie ein Mensch: warten, Strg+A, tippen, Enter. */
const antworte = async (s: Page, text: string): Promise<boolean> => {
  const da = await s.waitForSelector('.overlay #fq', { timeout: 4000, state: 'visible' }).then(() => true, () => false);
  if (!da) return false;
  await s.locator('.overlay #fq').last().focus();
  await s.keyboard.press('Control+A');
  if (text) await s.keyboard.type(text); else await s.keyboard.press('Backspace');
  await s.keyboard.press('Enter');
  await s.waitForTimeout(450);
  return true;
};
const frageOffen = (s: Page): Promise<boolean> =>
  s.waitForSelector('.overlay #fq', { timeout: 2500, state: 'visible' }).then(() => true, () => false);
const wahlKnopf = async (s: Page, w: string): Promise<boolean> => {
  const da = await s.waitForSelector(`.overlay [data-w="${w}"]`, { timeout: 4000, state: 'visible' }).then(() => true, () => false);
  if (!da) return false;
  await s.click(`.overlay [data-w="${w}"]`);
  await s.waitForTimeout(450);
  return true;
};

/** Wie der Ordner gerade überall dasteht. */
const UEBERALL = (id: string) => `(() => {
  const karte = document.querySelector('.bib-deckel[data-id="${id}"]');
  const knoten = document.querySelector('.ru-baum-zeile[data-baum-id="${id}"]');
  const zeilen = [...document.querySelectorAll('#sidebar .row')];
  const b = Store.getBlock('${id}');
  const zeile = zeilen.find(r => (r.querySelector('.nm')?.textContent || '').trim() === (b?.text || '').trim()) || null;
  return {
    text: b ? b.text : null,
    karte: karte ? (karte.querySelector('.bib-deckel-name b')?.textContent || '') : null,
    karteFarbe: karte ? karte.getAttribute('data-farbe') : 'KEINE KARTE',
    karteSymbol: karte ? (karte.querySelector('.bib-deckel-symbol')?.textContent || '') : null,
    knoten: knoten ? (knoten.querySelector('.ru-baum-name')?.textContent || '').trim() : null,
    knotenFarbe: knoten ? knoten.getAttribute('data-farbe') : 'KEIN KNOTEN',
    knotenSymbol: knoten ? (knoten.querySelector('.ru-baum-zeichen')?.textContent || '') : null,
    zeile: zeile ? (zeile.querySelector('.nm')?.textContent || '').trim() : null,
    zeileFarbe: zeile ? zeile.getAttribute('data-farbe') : 'KEINE ZEILE',
    zeileSymbol: zeile ? (zeile.querySelector('.ico')?.textContent || '').trim() : null,
    inBib: !!document.querySelector('.bib-gitter'),
    seite: App.aktuelleSeite(),
    ordnerMeta: Store.getMeta('bibOrdner', '')
  };
})()`;

console.log('\n' + '─'.repeat(60));
console.log('Suite 594 — Ordner bearbeiten (E718)');
console.log('─'.repeat(60));

/* ══ Rechner, hell ══════════════════════════════════════════════════════ */
const a = await aufmachen();
const s = a.s;
await zurBibliothek(s);
const seiteVorher = await s.evaluate('App.aktuelleSeite()');

/* ── §1 ─────────────────────────────────────────────────────────────── */
console.log('\n§1 Umbenennen bleibt in der Bibliothek — an der Wurzel und drinnen');
p('Das ⌄ der Karte bietet „Umbenennen" an', await kartenMenue(s, a.ordner, 'umbenennen'));
const gefragt1 = await antworte(s, 'Kabel und Leitungen');
p('Es kommt eine Frage nach dem Namen (kein Sprung auf die Seite)', gefragt1);
const n1 = await s.evaluate(UEBERALL(a.ordner)) as any;
console.log('    ' + JSON.stringify({ text: n1.text, karte: n1.karte, knoten: n1.knoten, zeile: n1.zeile, inBib: n1.inBib }));
p('Man bleibt in der Bibliothek, die offene Seite ist dieselbe', n1.inBib && n1.seite === seiteVorher,
  'inBib=' + n1.inBib + ' seite=' + n1.seite);
gleich('Der neue Name ist gespeichert', n1.text, 'Kabel und Leitungen');
gleich('… und steht sofort auf der Karte, im Ablagebaum und in der Seitenleiste',
  [n1.karte, n1.knoten, n1.zeile], ['Kabel und Leitungen', 'Kabel und Leitungen', 'Kabel und Leitungen']);
/* Drinnen: über den Ablagebaum in den Ordner, dann den Unterordner umbenennen. */
await s.evaluate(`document.querySelector('.ru-baum-zeile[data-baum-id="${a.ordner}"]')?.click()`);
await s.waitForTimeout(600);
const drin = await s.evaluate(`Store.getMeta('bibOrdner', '')`);
p('Ein Klick im Ablagebaum geht in den Ordner', drin === a.ordner, String(drin));
p('Drinnen bietet das ⌄ des Unterordners „Umbenennen" an', await kartenMenue(s, a.kind, 'umbenennen'));
await antworte(s, 'Leitungen neu');
const n1b = await s.evaluate(UEBERALL(a.kind)) as any;
p('… und man bleibt IN diesem Ordner der Bibliothek', n1b.inBib && n1b.ordnerMeta === a.ordner && n1b.seite === seiteVorher,
  JSON.stringify({ inBib: n1b.inBib, ordner: n1b.ordnerMeta, seite: n1b.seite }));
gleich('… mit dem neuen Namen auf der Karte und im Baum', [n1b.text, n1b.karte, n1b.knoten],
  ['Leitungen neu', 'Leitungen neu', 'Leitungen neu']);
await zurBibliothek(s);

/* ── §2 ─────────────────────────────────────────────────────────────── */
console.log('\n§2 Leer ist kein Name');
await kartenMenue(s, a.ordner, 'umbenennen');
await antworte(s, '   ');
const meldung2 = await s.evaluate(`document.getElementById('toast')?.textContent || ''`) as string;
const nochmal2 = await frageOffen(s);
p('Eine Meldung sagt, warum', /mindestens ein Zeichen/.test(meldung2), meldung2);
p('… und es wird noch einmal gefragt', nochmal2);
if (nochmal2) { await s.keyboard.press('Escape'); await s.waitForTimeout(400); }
gleich('Der alte Name bleibt', await s.evaluate(`Store.getBlock('${a.ordner}').text`), 'Kabel und Leitungen');

/* ── §3 ─────────────────────────────────────────────────────────────── */
console.log('\n§3 Steuerzeichen und Zeilenumbrüche fliegen hinaus');
await s.evaluate(`window.__frage594 = UI.frage; UI.frage = async () => 'A\\u0007B\\nC\\u2028  '`);
await kartenMenue(s, a.ordner, 'umbenennen');
await s.waitForTimeout(500);
await s.evaluate(`UI.frage = window.__frage594`);
gleich('„A␇B⏎C" wird als „AB C" gespeichert', await s.evaluate(`Store.getBlock('${a.ordner}').text`), 'AB C');
/* Die Durchsicht vom 6. Oktober: Richtungs-Überschreiber (U+202A–202E,
   U+2066–2069) drehen einen Namen in der Anzeige um, ohne dass man es
   sieht — und die 200er-Grenze schnitt nach Codepunkten, also mitten in
   ein zusammengesetztes Zeichen (👨‍👩‍👧 sind fünf). */
const s3 = await s.evaluate(`(() => {
  const fam = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
  const lang = App.nameSaeubern('a'.repeat(199) + fam + 'b');
  return { bidi: App.nameSaeubern('Rechnung\u202Efdp.exe\u2066x\u2069'),
           ganz: lang.endsWith(fam), schwanz: lang.slice(199) === fam, laenge: [...new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(lang)].length };
})()`) as any;
gleich('Richtungs-Überschreiber fliegen hinaus', s3.bidi, 'Rechnungfdp.exex');
gleich('Die 200er-Grenze zählt Schriftzeichen und schneidet keines entzwei', [s3.ganz, s3.schwanz, s3.laenge], [true, true, 200]);
await s.evaluate(`Store.updateBlock('${a.ordner}', { text: 'Kabelkunde' }); App.zeichneBaum()`);
await zurBibliothek(s);

/* ── §4 ─────────────────────────────────────────────────────────────── */
console.log('\n§4 Derselbe Name im selben Ordner');
await kartenMenue(s, a.ordner, 'umbenennen');
await antworte(s, 'zwilling');
const titel4 = await s.evaluate(`document.querySelector('.overlay')?.textContent || ''`) as string;
p('Die Frage nennt den Namen, der schon da ist', /Zwilling/.test(titel4), titel4.slice(0, 120));
p('„Anderen Namen wählen" steht da und fragt neu', await wahlKnopf(s, 'anders') && await frageOffen(s));
await antworte(s, 'Einzeln');
gleich('… und der andere Name wird gespeichert', await s.evaluate(`Store.getBlock('${a.ordner}').text`), 'Einzeln');
await kartenMenue(s, a.ordner, 'umbenennen');
await antworte(s, 'Zwilling');
p('„Trotzdem so nennen" steht da', await wahlKnopf(s, 'trotzdem'));
gleich('… und speichert den gleichen Namen', await s.evaluate(`Store.getBlock('${a.ordner}').text`), 'Zwilling');
await kartenMenue(s, a.ordner, 'umbenennen');
await antworte(s, 'Zwilling');
p('Unverändert gelassen: keine zweite Frage, nichts geschrieben',
  !(await s.waitForSelector('.overlay [data-w="trotzdem"]', { timeout: 1200 }).then(() => true, () => false)));
await s.evaluate(`Store.updateBlock('${a.ordner}', { text: 'Kabelkunde' }); App.zeichneBaum()`);

/* ── §5 ─────────────────────────────────────────────────────────────── */
console.log('\n§5 Dieselben Regeln in den Notizheften und im Seitenmenü');
await s.evaluate('Notebook.oeffnen()');
await s.waitForSelector('.nh-regal', { timeout: 20000 });
await s.waitForTimeout(400);
await s.evaluate(`document.querySelector('[data-mehr-fach="${a.fach}"]')?.click()`);
await s.waitForTimeout(250);
await s.evaluate(`[...document.querySelectorAll('.menu button[data-k]')].find(x => x.getAttribute('data-k') === 'name')?.click()`);
await antworte(s, '   ');
const nh5 = await s.evaluate(`document.getElementById('toast')?.textContent || ''`) as string;
p('Notizhefte, Fach: „   " → dieselbe Meldung', /mindestens ein Zeichen/.test(nh5), nh5);
if (await frageOffen(s)) { await s.keyboard.press('Escape'); await s.waitForTimeout(400); }
gleich('… und das Fach behält seinen Namen', await s.evaluate(`Store.getBlock('${a.fach}').text`), 'Elektrotechnik');
await s.evaluate(`window.__frage594 = UI.frage; UI.frage = async () => '  Strom\\u0000kunde '`);
/* Das Heft liegt im Fach: erst hinein, dann sein ⋯. */
await s.evaluate(`Store.setMeta('heft:fach', '${a.fach}'); Notebook.oeffnen()`);
await s.waitForSelector(`[data-mehr="${a.heft}"]`, { timeout: 8000 }).catch(() => {});
await s.evaluate(`document.querySelector('[data-mehr="${a.heft}"]')?.click()`);
await s.waitForTimeout(250);
await s.evaluate(`[...document.querySelectorAll('.menu button[data-k]')].find(x => x.getAttribute('data-k') === 'name')?.click()`);
await s.waitForTimeout(500);
await s.evaluate(`UI.frage = window.__frage594`);
gleich('Notizhefte, Heft: Steuerzeichen und Ränder fliegen hinaus', await s.evaluate(`Store.getBlock('${a.heft}').text`), 'Stromkunde');
await s.evaluate(`App.seitenMenue(document.getElementById('btn-page-menu') || document.body, Store.getBlock('${a.zwilling}'))`);
await s.waitForTimeout(300);
await s.evaluate(`[...document.querySelectorAll('.menu button[data-a]')].find(x => x.getAttribute('data-a') === 'rename')?.click()`);
await antworte(s, '   ');
const sm5 = await s.evaluate(`document.getElementById('toast')?.textContent || ''`) as string;
p('Seitenmenü: „   " → dieselbe Meldung', /mindestens ein Zeichen/.test(sm5), sm5);
if (await frageOffen(s)) { await s.keyboard.press('Escape'); await s.waitForTimeout(400); }
gleich('… und die Seite behält ihren Namen', await s.evaluate(`Store.getBlock('${a.zwilling}').text`), 'Zwilling');

/* ── §6 ─────────────────────────────────────────────────────────────── */
console.log('\n§6 Nach dem Neuladen');
await s.evaluate(`Store.flush()`);
await s.reload();
await s.waitForFunction("typeof Store !== 'undefined' && !!Store.getBlock && (document.getElementById('tree')?.children.length || 0) > 0", null, { timeout: 30000 });
await s.waitForTimeout(600);
gleich('Der umbenannte Unterordner heisst nach dem Neuladen noch so',
  await s.evaluate(`Store.getBlock('${a.kind}')?.text`), 'Leitungen neu');
gleich('… und das Heft auch', await s.evaluate(`Store.getBlock('${a.heft}')?.text`), 'Stromkunde');
await s.evaluate(`document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove())`);

/* ── §7 ─────────────────────────────────────────────────────────────── */
console.log('\n§7 Farbe aus dem ⌄ — überall sofort');
await zurBibliothek(s);
const farbe = async (seite: Page, id: string, f: string): Promise<any> => {
  await kartenMenue(seite, id, 'farbe');
  await seite.waitForTimeout(250);
  await seite.evaluate(`[...document.querySelectorAll('button[data-farbe]')].find(x => x.getAttribute('data-farbe') === '${f}')?.click()`);
  await seite.waitForTimeout(500);
  return seite.evaluate(UEBERALL(id));
};
const f7 = await farbe(s, a.ordner, 'red');
gleich('Hell: Karte, Ablagebaum und Seitenleiste tragen „red" — ohne weiteres Zeichnen',
  [f7.karteFarbe, f7.knotenFarbe, f7.zeileFarbe], ['red', 'red', 'red']);

/* ── §8 ─────────────────────────────────────────────────────────────── */
console.log('\n§8 Farbe und Name aus den Notizheften → die Seitenleiste sofort');
await s.evaluate(`Store.setMeta('heft:fach', ''); Notebook.oeffnen()`);
await s.waitForSelector('.nh-regal', { timeout: 20000 });
await s.waitForTimeout(400);
await s.evaluate(`document.querySelector('[data-mehr-fach="${a.fach}"]')?.click()`);
await s.waitForTimeout(250);
await s.evaluate(`[...document.querySelectorAll('.menu button[data-k]')].find(x => x.getAttribute('data-k') === 'farbe')?.click()`);
await s.waitForTimeout(250);
await s.evaluate(`[...document.querySelectorAll('button[data-farbe]')].find(x => x.getAttribute('data-farbe') === 'blue')?.click()`);
await s.waitForTimeout(500);
const f8 = await s.evaluate(UEBERALL(a.fach)) as any;
gleich('Die Fach-Farbe steht sofort in der Seitenleiste', f8.zeileFarbe, 'blue');
await s.evaluate(`document.querySelector('[data-mehr-fach="${a.fach}"]')?.click()`);
await s.waitForTimeout(250);
await s.evaluate(`[...document.querySelectorAll('.menu button[data-k]')].find(x => x.getAttribute('data-k') === 'name')?.click()`);
await antworte(s, 'Strom');
const f8b = await s.evaluate(UEBERALL(a.fach)) as any;
gleich('Der neue Fach-Name steht sofort in der Seitenleiste', [f8b.text, f8b.zeile], ['Strom', 'Strom']);

/* ── §9 ─────────────────────────────────────────────────────────────── */
console.log('\n§9 Ein eigenes Symbol steht überall');
await s.evaluate(`Store.updateBlock('${a.ordner}', { icon: '⚡' }); App.zeichneBaum()`);
await zurBibliothek(s);
const i9 = await s.evaluate(UEBERALL(a.ordner)) as any;
gleich('Karte, Ablagebaum und Seitenleiste zeigen ⚡', [i9.karteSymbol, i9.knotenSymbol, i9.zeileSymbol], ['⚡', '⚡', '⚡']);
const standard9 = await s.evaluate(`(() => {
  const k = document.querySelector('.bib-deckel[data-id="${a.zwilling}"]');
  return k ? !!k.querySelector('.bib-deckel-symbol') : null;
})()`);
p('Eine Seite ohne eigenes Symbol (📄) bekommt keines auf die Karte', standard9 === false, String(standard9));
await s.evaluate('Store.flush()');
await s.reload();
await s.waitForFunction("typeof Store !== 'undefined' && (document.getElementById('tree')?.children.length || 0) > 0", null, { timeout: 30000 });
await s.waitForTimeout(600);
await s.evaluate(`document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove())`);
await zurBibliothek(s);
const i9b = await s.evaluate(UEBERALL(a.ordner)) as any;
gleich('… auch nach dem Neuladen', [i9b.karteSymbol, i9b.knotenSymbol], ['⚡', '⚡']);

/* ── §10 ────────────────────────────────────────────────────────────── */
console.log('\n§10 Nur bekannte Farben, Symbole escaped (§19)');
await s.evaluate(`Store.updateBlock('${a.ordner}', { color: '"><b>x</b>', icon: '<img src=x onerror=window.__boese594=1>' }); App.zeichneBaum()`);
await zurBibliothek(s);
const b10 = await s.evaluate(`(() => {
  const k = document.querySelector('.bib-deckel[data-id="${a.ordner}"]');
  const kn = document.querySelector('.ru-baum-zeile[data-baum-id="${a.ordner}"]');
  return { farbe: k ? k.getAttribute('data-farbe') : 'KEINE KARTE', markup: k ? k.outerHTML : '',
           baum: kn ? kn.outerHTML : '', boese: !!window.__boese594 };
})()`) as any;
p('Ein unbekannter Farbwert erzeugt kein Attribut', b10.farbe === null, String(b10.farbe));
p('… und kein <b> im Markup, kein <img> aus dem Symbol, nichts ausgeführt',
  !b10.markup.includes('<b>x</b>') && !b10.markup.includes('<img src=x') && !b10.baum.includes('<img src=x') && !b10.boese);
await s.evaluate(`Store.updateBlock('${a.ordner}', { color: '', icon: '📁' }); App.zeichneBaum()`);

/* ── §11 ────────────────────────────────────────────────────────────── */
console.log('\n§11 Ein Ordner auf sein eigenes Kind gezogen');
const fehlerVor11 = fehler.length;
await s.evaluate(`Store.updateBlock('${a.ordner}', { aufgeklappt: true }); App.zeichneBaum()`);
await s.waitForTimeout(300);
const r11 = await s.evaluate(`(() => {
  const zeilen = [...document.querySelectorAll('#sidebar .row')];
  const kindName = Store.getBlock('${a.kind}').text;
  const ziel = zeilen.find(r => (r.querySelector('.nm')?.textContent || '').trim() === kindName);
  if (!ziel) return { ziel: false };
  const dt = new DataTransfer();
  dt.setData('text/seite', '${a.ordner}');
  try { ziel.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); }
  catch (e) { return { ziel: true, wurf: String(e && e.message || e) }; }
  return { ziel: true, wurf: '' };
})()`) as any;
await s.waitForTimeout(500);
const n11 = await s.evaluate(`(() => {
  const zeilen = [...document.querySelectorAll('#sidebar .row .nm')].map(x => (x.textContent || '').trim());
  return { eltern: Store.getBlock('${a.ordner}').parentId ?? null, kindEltern: Store.getBlock('${a.kind}').parentId,
           ordnerDa: zeilen.includes(Store.getBlock('${a.ordner}').text), kindDa: zeilen.includes(Store.getBlock('${a.kind}').text),
           meldung: document.getElementById('toast')?.textContent || '' };
})()`) as any;
console.log('    ' + JSON.stringify({ r11, n11, neueFehler: fehler.slice(fehlerVor11) }));
p('Die Kind-Zeile war da (der Wurf ist echt)', r11.ziel);
p('Keine Ausnahme (kein RangeError)', !r11.wurf && fehler.length === fehlerVor11, r11.wurf || fehler.slice(fehlerVor11).join(' · '));
gleich('parentId bleibt, wie es war (kein Ring)', [n11.eltern, n11.kindEltern], [null, a.ordner]);
p('Beide stehen weiter in der Seitenleiste', n11.ordnerDa && n11.kindDa, JSON.stringify(n11));
p('Eine Meldung sagt, warum nichts geschah', /nicht in sich selbst/.test(n11.meldung), n11.meldung);

/* ── §12 ────────────────────────────────────────────────────────────── */
console.log('\n§12 Verschieben über den Wähler geht weiter');
await s.evaluate(`Werkzeuge.verschiebenNach(Store.getBlock('${a.zwilling}'))`);
await s.waitForSelector('#vq', { timeout: 4000 });
await s.fill('#vq', 'Kabelkunde');
await s.waitForTimeout(250);
await s.evaluate(`document.querySelector('#vr button[data-id="${a.ordner}"]')?.click()`);
await s.waitForTimeout(400);
gleich('„Zwilling" liegt danach im Ordner', await s.evaluate(`Store.getBlock('${a.zwilling}').parentId`), a.ordner);
p('… und steht in seinem Inhalt', await s.evaluate(`Store.getBlock('${a.ordner}').content.includes('${a.zwilling}')`));

/* ── §13 ────────────────────────────────────────────────────────────── */
console.log('\n§13 Papierkorb aus der Bibliothek, mit Rückgängig');
await zurBibliothek(s, a.ordner);
const index13 = await s.evaluate(`Store.getBlock('${a.ordner}').content.indexOf('${a.kind}')`) as number;
p('Das ⌄ des Unterordners bietet „In den Papierkorb" an', await kartenMenue(s, a.kind, 'papierkorb'));
await s.waitForTimeout(400);
const t13 = await s.evaluate(`(() => {
  const b = Store.getBlock('${a.kind}');
  const t = document.getElementById('toast');
  const k = t ? t.querySelector('button.toast-aktion') : null;
  const r = k ? k.getBoundingClientRect() : null;
  const prot = typeof Protokoll !== 'undefined' ? Protokoll.alle().filter(e => e.art === 'seite-weg' && JSON.stringify(e).includes('${a.kind}')).length : -1;
  return { alive: b.alive, trashedAt: !!b.trashedAt, imInhalt: Store.getBlock('${a.ordner}').content.includes('${a.kind}'),
           prot, meldung: t ? (t.textContent || '') : '', knopf: k ? (k.textContent || '').trim() : null,
           hoehe: r ? Math.round(r.height) : 0, zeiger: k ? getComputedStyle(k).pointerEvents : '',
           loeschknopf: !!document.querySelector('.menu [data-loeschknopf]'),
           tab: k ? k.tabIndex : -9, trashed: Store.trashed().some(x => x.id === '${a.kind}') };
})()`) as any;
console.log('    ' + JSON.stringify(t13));
p('Der Ordner liegt im Papierkorb, mit Zeitstempel (trashedAt)', t13.alive === false && t13.trashedAt && t13.trashed, JSON.stringify(t13));
p('… ist aus dem Inhalt seines Elternteils heraus', !t13.imInhalt);
p('… und das Protokoll hat einen Eintrag', t13.prot >= 1, String(t13.prot));
p('Die Meldung nennt ihn und seine Unterseiten', /„Leitungen neu" und 1 Unterseite liegen im Papierkorb/.test(t13.meldung), t13.meldung);
gleich('… und trägt EINEN echten Knopf „Rückgängig"', t13.knopf, 'Rückgängig');
p('… 44 px hoch, greifbar, mit der Tastatur erreichbar', t13.hoehe >= 44 && t13.zeiger === 'auto' && t13.tab >= 0,
  JSON.stringify({ h: t13.hoehe, z: t13.zeiger, tab: t13.tab }));
p('Wegzulegen ist umkehrbar — kein Löschknopf (E709 gilt nur dem Endgültigen)', !t13.loeschknopf);
/* Ein offenes Fenster legt `#toast` still (Fokus, `inert`): dann darf dort
   kein Knopf stehen, der nichts tut. Nach Escape ist er wieder da. */
await s.evaluate(`App.papierkorb()`);
await s.waitForTimeout(500);
const tot13 = await s.evaluate(`(() => {
  const t = document.getElementById('toast');
  const k = t ? t.querySelector('button.toast-aktion') : null;
  return { inert: !!(t && t.inert), sichtbar: !!(k && k.getClientRects().length && getComputedStyle(k).visibility !== 'hidden'),
           satz: (t && t.textContent || '').includes('im Papierkorb') };
})()`) as any;
p('Steht ein Fenster offen, ist `#toast` still und zeigt keinen toten Knopf (nur den Satz)',
  !tot13.inert || (!tot13.sichtbar && tot13.satz), JSON.stringify(tot13));
await s.keyboard.press('Escape');
await s.waitForTimeout(400);
p('… nach Escape steht „Rückgängig" wieder da', await s.evaluate(`(() => {
  const k = document.querySelector('#toast button.toast-aktion');
  return !!(k && k.getClientRects().length && !document.getElementById('toast').inert);
})()`));
await s.click('#toast button.toast-aktion', { timeout: 3000 }).catch(() => {});
await s.waitForTimeout(500);
const z13 = await s.evaluate(`(() => {
  const b = Store.getBlock('${a.kind}');
  App.zeichneBaum();
  return { alive: b.alive, trashedAt: b.trashedAt || null, index: Store.getBlock('${a.ordner}').content.indexOf('${a.kind}'),
           karte: !!document.querySelector('.bib-deckel[data-id="${a.kind}"]') };
})()`) as any;
gleich('„Rückgängig" holt ihn zurück: lebendig, ohne Stempel, an derselben Stelle, wieder auf der Karte',
  [z13.alive, z13.trashedAt, z13.index, z13.karte], [true, null, index13, true]);
await s.waitForTimeout(200);
const zeile13 = await s.evaluate(`[...document.querySelectorAll('#sidebar .row .nm')].some(x => (x.textContent || '').trim() === 'Leitungen neu')`);
p('… und die Zeile in der Seitenleiste ist wieder da', zeile13);

/* ── §14 ────────────────────────────────────────────────────────────── */
console.log('\n§14 Die Kinder eines weggelegten Ordners');
await zurBibliothek(s);
await kartenMenue(s, a.ordner, 'papierkorb');
await s.waitForTimeout(500);
const k14 = await s.evaluate(`(() => {
  const alle = Bibliothek.alleSeiten().map(x => x.id);
  const kinder = ['${a.kind}', '${a.enkel}', '${a.unter}'];
  return { inAlle: kinder.filter(k => alle.includes(k)).length,
           zuletzt: Bibliothek.alleSeiten().filter(x => x.zuletztGeoeffnet && kinder.includes(x.id)).length,
           favoriten: Bibliothek.alleSeiten().filter(x => x.favorite && kinder.includes(x.id)).length,
           baum: kinder.filter(k => document.querySelector('.ru-baum-zeile[data-baum-id="' + k + '"]')).length,
           karten: kinder.filter(k => document.querySelector('.bib-deckel[data-id="' + k + '"]')).length };
})()`) as any;
console.log('    ' + JSON.stringify(k14));
gleich('Weder in Alle, Zuletzt, Favoriten noch im Baum oder als Karte an der Wurzel',
  [k14.inAlle, k14.zuletzt, k14.favoriten, k14.baum, k14.karten], [0, 0, 0, 0, 0]);
await s.click('#toast button.toast-aktion', { timeout: 3000 }).catch(() => {});
await s.waitForTimeout(500);
await zurBibliothek(s);
const k14b = await s.evaluate(`(() => {
  const alle = Bibliothek.alleSeiten().map(x => x.id);
  return ['${a.kind}', '${a.enkel}', '${a.unter}'].filter(k => alle.includes(k)).length;
})()`) as number;
gleich('Mit dem Ordner kommen alle drei zurück', k14b, 3);

/* ── §15 ────────────────────────────────────────────────────────────── */
console.log('\n§15 Blockmenü „Löschen" auf einer Unterseite und einer Datenbank');
const b15 = await s.evaluate(`(async () => {
  const seite = Store.addPage(null, { text: 'Elternseite 594' });
  const text = Store.addBlock(seite.id, 'text', { text: 'Davor' });
  const unter = Store.addPage(seite.id, { text: 'Unterseite 594' });
  Store.addBlock(unter.id, 'text', { text: 'Inhalt der Unterseite' });
  const enkel = Store.addPage(unter.id, { text: 'Enkelseite 594' });
  const db = Store.addDatabase(seite.id, 'Tabelle 594');
  await Store.flush();
  App.oeffne(seite.id);
  return { seite: seite.id, text: text.id, unter: unter.id, enkel: enkel.id, db: db.block.id };
})()`) as any;
await s.waitForTimeout(900);
const loesche = async (id: string): Promise<string> => {
  await s.evaluate(`document.querySelectorAll('.menu').forEach(m => m.remove())`);
  await s.evaluate(`Blocks.blockMenue(document.querySelector('[data-id="${id}"]') || document.body, Store.getBlock('${id}'))`);
  await s.waitForTimeout(250);
  return await s.evaluate(`(() => {
    const k = document.querySelector('.menu button[data-a="del"]');
    if (!k) return '';
    const t = (k.textContent || '').trim(); k.click(); return t;
  })()`) as string;
};
const label15 = await loesche(b15.unter);
p('Der Eintrag heisst, was er tut: „In den Papierkorb"', /In den Papierkorb/.test(label15), label15);
await loesche(b15.db);
await s.waitForTimeout(400);
const v15 = await s.evaluate(`(() => ({
  unter: Store.getBlock('${b15.unter}') ? Store.getBlock('${b15.unter}').alive : 'WEG',
  imKorb: Store.trashed().some(x => x.id === '${b15.unter}'),
  enkel: Store.getBlock('${b15.enkel}') ? 'da' : 'WEG',
  db: Store.getBlock('${b15.db}') ? Store.getBlock('${b15.db}').alive : 'WEG',
  dbImKorb: Store.papierkorbBloecke().some(x => x.id === '${b15.db}')
}))()`) as any;
console.log('    ' + JSON.stringify(v15));
gleich('Unterseite und Datenbank liegen im Papierkorb, die Enkelseite ist noch da',
  [v15.unter, v15.imKorb, v15.enkel, v15.db, v15.dbImKorb], [false, true, 'da', false, true]);
/* Das ⋯ der Datenbank selbst: „Datenbank löschen". Ein `confirm()` wird
   bejaht, damit der alte Weg auch wirklich löscht — und gezählt, weil der
   neue keinen mehr braucht (umkehrbar heisst: nicht vorher fragen). */
let dialoge15 = 0;
s.on('dialog', d => { dialoge15++; void d.accept(); });
const db2 = await s.evaluate(`(async () => {
  const db = Store.addDatabase('${b15.seite}', 'Zweite Tabelle 594');
  Store.addRow(db.collectionId, {});
  const unter2 = Store.addPage('${b15.seite}', { text: 'Ausgewählte Unterseite 594' });
  const enkel2 = Store.addPage(unter2.id, { text: 'Ausgewählte Enkelseite 594' });
  await Store.flush();
  App.zeichneSeite();
  return { db: db.block.id, coll: db.block.collectionId, unter2: unter2.id, enkel2: enkel2.id };
})()`) as any;
await s.waitForTimeout(700);
await s.evaluate(`document.querySelectorAll('.menu').forEach(m => m.remove())`);
const dbKnopf = await s.evaluate(`(() => {
  const k = document.querySelector('.blk[data-bid="${db2.db}"] button[data-a="menu"]');
  if (!k) return false; k.click(); return true;
})()`);
await s.waitForTimeout(300);
const dbDel = await s.evaluate(`(() => {
  const k = document.querySelector('.menu button[data-a="del"]');
  if (!k) return ''; const t = (k.textContent || '').trim(); k.click(); return t;
})()`) as string;
await s.waitForTimeout(500);
const v15b = await s.evaluate(`(() => ({
  db: Store.getBlock('${db2.db}') ? Store.getBlock('${db2.db}').alive : 'WEG',
  imKorb: Store.papierkorbBloecke().some(x => x.id === '${db2.db}'),
  sammlung: !!Store.getCollection('${db2.coll}'),
  meldung: document.getElementById('toast')?.textContent || '',
  rueck: !!document.querySelector('#toast button.toast-aktion')
}))()`) as any;
console.log('    ' + JSON.stringify({ knopf: dbKnopf, eintrag: dbDel, dialoge: dialoge15, ...v15b }));
p('Das ⋯ der Datenbank hat seinen Eintrag, und er heisst, was er tut', dbKnopf && /Papierkorb/.test(dbDel), dbDel);
gleich('„Datenbank löschen" legt in den Papierkorb, die Sammlung bleibt, ohne Browser-Rückfrage',
  [v15b.db, v15b.imKorb, v15b.sammlung, dialoge15], [false, true, true, 0]);
p('… und die Meldung bietet „Rückgängig"', v15b.rueck, v15b.meldung);
/* Entf auf einer Mehrfachauswahl (`Mehrfach`, Esc in einem Textblock). */
await s.evaluate(`document.querySelectorAll('.menu').forEach(m => m.remove()); Mehrfach.waehle('${db2.unter2}')`);
await s.waitForTimeout(200);
await s.keyboard.press('Delete');
await s.waitForTimeout(500);
const v15c = await s.evaluate(`(() => ({
  unter: Store.getBlock('${db2.unter2}') ? Store.getBlock('${db2.unter2}').alive : 'WEG',
  imKorb: Store.trashed().some(x => x.id === '${db2.unter2}'),
  enkel: Store.getBlock('${db2.enkel2}') ? 'da' : 'WEG'
}))()`) as any;
console.log('    ' + JSON.stringify(v15c));
gleich('Entf auf einer Mehrfachauswahl legt in den Papierkorb, samt Enkelseite',
  [v15c.unter, v15c.imKorb, v15c.enkel], [false, true, 'da']);
await s.evaluate('Store.flush()');
await s.reload();
await s.waitForFunction("typeof Store !== 'undefined' && (document.getElementById('tree')?.children.length || 0) > 0", null, { timeout: 30000 });
await s.waitForTimeout(600);
gleich('Beide nach dem Neuladen noch da (im Papierkorb)',
  await s.evaluate(`[!!Store.getBlock('${db2.db}'), !!Store.getBlock('${db2.unter2}'), !!Store.getBlock('${db2.enkel2}')]`), [true, true, true]);
const r15 = await s.evaluate(`(async () => {
  const da = !!Store.getBlock('${b15.unter}') && !!Store.getBlock('${b15.db}');
  if (da) { Store.restoreBlock('${b15.unter}'); Store.restoreBlock('${b15.db}'); await Store.flush(); }
  const eltern = Store.getBlock('${b15.seite}');
  return { da, inhalt: eltern ? eltern.content.includes('${b15.unter}') && eltern.content.includes('${b15.db}') : false,
           kinder: (Store.getBlock('${b15.unter}')?.content || []).length };
})()`) as any;
gleich('Nach dem Neuladen noch da und zurückzuholen, samt Inhalt', [r15.da, r15.inhalt, r15.kinder >= 2], [true, true, true]);

/* ── §16 ────────────────────────────────────────────────────────────── */
console.log('\n§16 Rechte: gefragt wird die angefasste Seite (§26, L102)');
await s.evaluate(`document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu,.menu').forEach(e => e.remove())`);
const r16 = await s.evaluate(`(async () => {
  const lese = Store.addPage(null, { text: 'Nur zum Lesen 594' });
  const kind = Store.addPage(lese.id, { text: 'Kind zum Lesen 594' });
  const darf = Store.addPage(null, { text: 'Zum Bearbeiten 594' });
  const ich = Konten.aktiv().id;
  Store.updateBlock(lese.id, { freigaben: { [ich]: 'lesen' } });
  Store.updateBlock(darf.id, { freigaben: { [ich]: 'edit' } });
  await Store.flush();
  App.oeffne(darf.id);   /* offen ist eine Seite, auf der man DARF */
  return { lese: lese.id, kind: kind.id, darf: darf.id };
})()`) as any;
await s.waitForTimeout(500);
await s.evaluate(`void App.umbenennen(Store.getBlock('${r16.lese}'))`);
const frage16 = await frageOffen(s);
const meldung16 = await s.evaluate(`document.getElementById('toast')?.textContent || ''`) as string;
if (frage16) { await s.keyboard.press('Escape'); await s.waitForTimeout(400); }
p('Nur lesen: Umbenennen fragt gar nicht erst nach einem Namen', !frage16);
p('… und sagt, warum', /Recht/.test(meldung16), meldung16);
await s.evaluate(`App.inPapierkorb(Store.getBlock('${r16.kind}'))`);
await s.waitForTimeout(300);
const meldung16b = await s.evaluate(`document.getElementById('toast')?.textContent || ''`) as string;
gleich('Nur lesen (geerbt): das Kind bleibt, wo es ist', await s.evaluate(`Store.getBlock('${r16.kind}').alive`), true);
p('… mit einer Meldung, die es sagt', /Recht/.test(meldung16b), meldung16b);
await s.evaluate(`App.inPapierkorb(Store.getBlock('${r16.darf}'))`);
await s.waitForTimeout(300);
gleich('Bearbeiten: in den Papierkorb geht weiter', await s.evaluate(`Store.getBlock('${r16.darf}').alive`), false);
p('Keine Ausnahme im Browser (Rechner)', fehler.length === 0, fehler.slice(0, 3).join(' · '));
await a.k.close();

/* ══ Rechner, dunkel: §7 noch einmal ═══════════════════════════════════ */
console.log('\n§7 (dunkel) Farbe aus dem ⌄ — überall sofort');
const d = await aufmachen({ dunkel: true });
await zurBibliothek(d.s);
const f7d = await farbe(d.s, d.ordner, 'green');
gleich('Dunkel: Karte, Ablagebaum und Seitenleiste tragen „green"',
  [f7d.karteFarbe, f7d.knotenFarbe, f7d.zeileFarbe], ['green', 'green', 'green']);
await d.k.close();

/* ══ Telefon ═══════════════════════════════════════════════════════════ */
console.log('\n§1/§13 (Telefon) Umbenennen und Papierkorb mit Rückgängig');
const h = await aufmachen({ handy: true, dunkel: true });
await zurBibliothek(h.s);
await kartenMenue(h.s, h.ordner, 'umbenennen');
await antworte(h.s, 'Kabel am Telefon');
const h1 = await h.s.evaluate(UEBERALL(h.ordner)) as any;
p('Telefon: Umbenennen bleibt in der Bibliothek, der Name steht auf der Karte',
  h1.inBib && h1.text === 'Kabel am Telefon' && h1.karte === 'Kabel am Telefon', JSON.stringify({ inBib: h1.inBib, text: h1.text, karte: h1.karte }));
await kartenMenue(h.s, h.zwilling, 'papierkorb');
await h.s.waitForTimeout(500);
const h13 = await h.s.evaluate(`(() => {
  const k = document.querySelector('#toast button.toast-aktion');
  if (!k) return null;
  const r = k.getBoundingClientRect();
  const mitte = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { h: Math.round(r.height), b: Math.round(r.width), drin: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
           trifft: mitte === k || k.contains(mitte) };
})()`) as any;
p('Telefon: „Rückgängig" ist 44 px hoch, im Bild und obenauf', !!h13 && h13.h >= 44 && h13.b >= 44 && h13.drin && h13.trifft,
  JSON.stringify(h13));
if (h13) await h.s.tap('#toast button.toast-aktion');
await h.s.waitForTimeout(500);
gleich('… und ein Tipp darauf holt die Seite zurück', await h.s.evaluate(`Store.getBlock('${h.zwilling}').alive`), true);
p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 3).join(' · '));
await h.k.close();

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
