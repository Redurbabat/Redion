/* Suite 600 — Bibliothek: eine Wahl je Kategorie, und EINE Suche, die ihren Bereich kennt (E725)
 * ============================================================================
 * Redur, Masterprompt vom 29. September 2026, Seite 13 (OneNote), unter dem
 * Foto der Bibliothek — die Wege „Meine Ablage · Zuletzt geöffnet ·
 * Favoriten · Alle PDFs · Sammlungen ⌄" und die Artenchips „Alle · PDF ·
 * Whiteboards · Blätter · Datenbanken · Karteikarten · Ordner · Dateien ·
 * Seiten" grün umkreist, das Feld „Dokument suchen …" rot durchgestrichen,
 * wörtlich:
 *
 *     „hier habe ich sehr viel zum sehe ich sollte von jeder kategorie nur
 *      eine sehen und die anderen alles unterdem das beim ^ … und die
 *      sucher hier sollte es bei der ganz obe such integriert sein beim
 *      suche wenn ich bei eine pdf oder eine dokument bin sollte mir wie es
 *      jetzt ist mir zeiget wo ich suchen will und lösche es von dem
 *      biblotek seite …"
 *
 * Und seine Zustimmung vom 3. Oktober: „die Suchleiste ‚Dokument suchen‘
 * der Bibliotheksseite in die globale Suche überführen".
 *
 *   §1  EINE WAHL JE KATEGORIE — in Deckel, Regal und Liste, bei 1440 und
 *       390: genau ein sichtbarer Wähler für den Ort (`[data-orte]`), einer
 *       für die Art (`[data-art-wahl]`), einer für die Form
 *       (`[data-form-wahl]`), alle drei in EINER Zeile und 44 px hoch.
 *       Keine Wege-Zeile, keine Artenchips, kein Sammlungsfeld, kein
 *       zweiter Ortsfilter (⚟ der Liste). Jede frühere Wahl steht in einem
 *       Menü, je Ort genau EIN Name (§43): die vier Wege, die übrigen Orte,
 *       die sechs Sammlungen, die vorhandenen Arten, die drei Formen — und
 *       die Formen NICHT mehr im Ortsmenü. Enter und Leertaste öffnen,
 *       Pfeile wandern, Escape schliesst und gibt den Fokus zurück.
 *       (Rot: drei Bänke, der Ort zweimal.)
 *   §2  INHALT ZUERST: bei 390 × 844 liegt der erste Deckel im ersten Bild,
 *       am Rechner stehen höchstens zehn Bedienelemente über dem Raster,
 *       und ein leeres „Zuletzt geöffnet" zeigt nichts — keine Attrappen
 *       „Neue Seite" und „PDF öffnen". (Rot: 931 von 844, 19 Elemente.)
 *   §3  KEINE ZWEITE SUCHE: kein Suchfeld auf der Bibliotheksseite, in
 *       keiner Form; die Lupe der Liste öffnet die EINE Suche, im Bereich
 *       Bibliothek. (Rot: „Dokument suchen …" und „Seiten durchsuchen …".)
 *   §4  DIE SUCHE KENNT IHREN BEREICH: in der Bibliothek geht Strg P (und
 *       die Kapsel, am Telefon ⌕) mit [Bibliothek · Überall] auf, Vorgabe
 *       Bibliothek; ein Wort, das nur im INHALT steht, findet Regaldokumente
 *       (der alte Titelfilter fand 0); im Ordner heisst der Bereich
 *       „In ‚Ordner‘" und findet nur, was darin liegt. In einer PDF geht
 *       sie mit [Dieses Dokument · Alle Dokumente · Überall] auf, Vorgabe
 *       aus der gemerkten Wahl der Suchleiste (auch aus dem alten
 *       Wahrheitswert); „Dieses Dokument" meldet DIESELBE Zahl wie die
 *       Suchleiste und öffnet sie mit Enter auf Treffer 1. Auf einer
 *       gewöhnlichen Seite steht keine Zeile. (Rot: keine Zeile, nirgends.)
 *   §5  DIE SUCHLEISTE IM DOKUMENT trägt dieselben drei Bereiche — als
 *       Umschalter mit gezeichneten Zeichen statt 📚, 44 px; „Überall"
 *       öffnet die Suche mit dem Wort, und sie findet es. (Rot: 📚.)
 *   §6  ESCAPE: ein Druck, eine Ebene — Menü vor Bibliothek, Suche vor
 *       Suchleiste.
 *   §7  BEWEGUNG: das Ortsmenü steht an seiner Pille (E712) und geht mit
 *       Bewegung auf — mit „weniger Bewegung" wie mit „Ruhige Darstellung"
 *       ohne Wachsen. (Dieser Abschnitt war schon vorher grün; er hält,
 *       dass das neue Menü die Regel nicht bricht, und seine erste Zeile
 *       beweist, dass die Messung Bewegung überhaupt sehen kann.)
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Er war es: eingecheckt als „test600 (rot)" gegen den Stand nach dem
 * Zusammenführen von claude/menue-eine-quelle, bevor E725 gebaut war. Die
 * Gegenproben (Wege-Zeile zurück → §1 rot; Bereich weg → §4 rot) stehen im
 * Commit von E725.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test600.mts
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

/* Die Orte, je mit EINEM Namen (Entscheidung a), in dieser Reihenfolge. */
const ORTE = ['Meine Ablage', 'Zuletzt geöffnet', 'Favoriten', 'Alle PDFs', 'Geteilt', 'Privat',
              'Ausbildung', 'In Datenbanken', 'Alle'];
const ORT_IDS = ['ablage', 'kuerzlich', 'favoriten', 'pdf', 'geteilt', 'privat', 'schule', 'datenbank', 'alle'];
const FORMEN = ['Als Dokumente', 'Nach Heften ordnen', 'Als Tabelle'];

type Bestand = { ordner: string; absicherung: string; notizen: string; pdf: string; skript: string; tafel: string };
type Auf = { s: Page; k: BrowserContext } & Bestand;

/**
 * Ein Ordner „Kabelkunde" mit „Absicherung" (das Wort „Leitungsschutz" steht
 * NUR im Inhalt) und „Leitungen"; draussen „Notizen" (dasselbe Wort, auch
 * nur im Inhalt), eine PDF „Datenblatt" mit vier Seiten (das Wort auf drei),
 * eine zweite PDF „Skript B" (das Wort auf einer Seite) und ein Whiteboard
 * „Tafelbild" — damit es mehr als eine Art gibt. Kein Titel trägt das Wort.
 */
const aufmachen = async (o: { handy?: boolean; dunkel?: boolean; wenig?: boolean } = {}): Promise<Auf> => {
  const k = await browser.newContext({
    viewport: o.handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: !!o.handy, isMobile: !!o.handy, colorScheme: o.dunkel ? 'dark' : 'light',
    reducedMotion: o.wenig ? 'reduce' : 'no-preference'
  });
  const s = await k.newPage();
  s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined' && typeof Bibliothek !== 'undefined' && typeof DocumentMode !== 'undefined' && (document.getElementById('tree')?.children.length || 0) > 0",
    null, { timeout: 30000 });
  const ids = await s.evaluate<any>(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('bibForm', 'deckel');
    Store.setMeta('bibOrdner', '');
    Store.setMeta('bibBaumSichtbar', false);
    Store.setMeta('dokFindAlle', false);
    App.theme(${o.dunkel ? "'dark'" : "'light'"});
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    /* Ein leeres „Zuletzt geöffnet": nichts ist WIRKLICH geöffnet worden. */
    Object.values(Store.cache.blocks).forEach(b => { if (b && b.zuletztGeoeffnet) Store.updateBlock(b.id, { zuletztGeoeffnet: '' }); });
    const ordner = Store.addPage(null, { text: 'Kabelkunde', icon: '📁' });
    const absicherung = Store.addPage(ordner.id, { text: 'Absicherung' });
    Store.addBlock(absicherung.id, 'text', { text: 'Der Leitungsschutz trennt bei Überlast.' });
    Store.addPage(ordner.id, { text: 'Leitungen' });
    const notizen = Store.addPage(null, { text: 'Notizen', favorite: true });
    Store.addBlock(notizen.id, 'text', { text: 'Morgen den Leitungsschutz wiederholen.' });
    const mach = (name, icon, texte) => {
      const seite = Store.addPage(null, { text: name, icon });
      texte.forEach((t, i) => Store.addBlock(seite.id, 'pdfseite',
        { text: '', nr: i + 1, vonSeiten: texte.length, bw: 595, bh: 842,
          quelleId: 'q-' + name, raumVersion: 1, suchtext: t }));
      Store.updateBlock(seite.id, { dokumentModus: true });
      return seite;
    };
    const pdf = mach('Datenblatt', '📕', ['Leitungsschutz Teil eins', 'Etwas anderes', 'Leitungsschutz Teil zwei', 'Der Leitungsschutzschalter']);
    const skript = mach('Skript B', '📗', ['Hier steht Leitungsschutz noch einmal']);
    const tafel = Store.addPage(null, { text: 'Tafelbild' });
    Store.addBlock(tafel.id, 'whiteboard', {});
    await Store.flush();
    App.zeichneBaum();
    return { ordner: ordner.id, absicherung: absicherung.id, notizen: notizen.id, pdf: pdf.id,
             skript: skript.id, tafel: tafel.id };
  })()`) as Bestand;
  return { s, k, ...ids };
};

const zurBibliothek = async (s: Page, form = 'deckel', ordner = ''): Promise<void> => {
  await s.evaluate<any>(`(() => { document.querySelectorAll('.overlay,.menu,.menu-grund').forEach(e => e.remove());
    Store.setMeta('bibForm', ${JSON.stringify(form)}); Store.setMeta('bibOrdner', ${JSON.stringify(ordner)});
    Bibliothek.oeffne(${JSON.stringify(ordner)}); })()`);
  await s.waitForSelector(form === 'deckel' ? '.bib-gitter .bib-deckel' : form === 'regal' ? '.bib-heft, .bib-hand, .bib-leer' : '.bib-zeile[data-id]',
    { timeout: 20000 });
  await s.evaluate<any>(`window.scrollTo(0, 0); document.getElementById('scroll') && (document.getElementById('scroll').scrollTop = 0)`);
  await s.waitForTimeout(450);
};

const zu = async (s: Page): Promise<void> => {
  await s.evaluate<any>(`document.querySelectorAll('.menu,.menu-grund,.overlay').forEach(m => m.remove())`);
  await s.waitForTimeout(150);
};

/** Was im offenen Menü steht: Kennung, Name ohne Haken, gewählt, Gruppe. */
const menue = (s: Page): Promise<{ da: boolean; rolle: string; eintraege: Array<{ id: string; name: string; an: string; gruppe: string }>;
  fokus: string; grp: string[] }> => s.evaluate<any>(`(() => {
  const m = [...document.querySelectorAll('.menu')].pop();
  if (!m) return { da: false, rolle: '', eintraege: [], fokus: '', grp: [] };
  const eintraege = [...m.querySelectorAll('[data-wahl]')].map(b => {
    const g = b.closest('[role="group"]');
    const lb = g && g.getAttribute('aria-labelledby') ? document.getElementById(g.getAttribute('aria-labelledby')) : null;
    return { id: b.getAttribute('data-wahl'), name: (b.textContent || '').replace('✓', '').trim(),
             an: b.getAttribute('aria-checked') || '', gruppe: lb ? (lb.textContent || '').trim() : '' };
  });
  return { da: true, rolle: m.getAttribute('role') || '', eintraege,
           fokus: document.activeElement && document.activeElement.getAttribute('data-wahl') || '',
           grp: [...m.querySelectorAll('.grp')].map(g => (g.textContent || '').trim()) };
})()`) as any;

/** Die sichtbaren Bedienelemente in `.bib`, die ganz über dem ersten Deckel liegen. */
const ueberDemRaster = (s: Page): Promise<{ y: number; hoch: number; zahl: number; namen: string[] }> => s.evaluate<any>(`(() => {
  const erster = document.querySelector('.bib-gitter .bib-deckel');
  const sichtbar = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  if (!erster) return { y: -1, hoch: innerHeight, zahl: 99, namen: [] };
  const oben = erster.getBoundingClientRect().top;
  const el = [...document.querySelectorAll('.bib button, .bib a[href], .bib input, .bib select, .bib summary, .bib [role=button]')]
    .filter(e => sichtbar(e) && e.getBoundingClientRect().bottom <= oben + 1);
  return { y: Math.round(oben), hoch: innerHeight, zahl: el.length,
           namen: el.map(e => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || e.tagName).trim().slice(0, 22)) };
})()`) as any;

/** Die Bereichszeile der offenen Suche. */
const bereichZeile = (s: Page): Promise<{ suche: boolean; ids: string[]; namen: string[]; an: string; filterSichtbar: boolean }> => s.evaluate<any>(`(() => {
  const f = document.querySelector('.finder.such');
  const g = f && f.querySelector('.such-bereich [role="radiogroup"]');
  const radios = g ? [...g.querySelectorAll('[role="radio"]')] : [];
  const filter = f && f.querySelector('.such-filter');
  return { suche: !!f, ids: radios.map(r => r.getAttribute('data-seg-wahl')),
           namen: radios.map(r => (r.textContent || '').trim()),
           an: (radios.find(r => r.getAttribute('aria-checked') === 'true') || { getAttribute: () => '' }).getAttribute('data-seg-wahl') || '',
           filterSichtbar: !!filter && filter.getBoundingClientRect().height > 0 };
})()`) as any;

/** Die Titel der Treffer in der offenen Suche. */
const trefferTitel = (s: Page): Promise<string[]> => s.evaluate<any>(`
  [...document.querySelectorAll('#res button[data-i]')].map(b => {
    const t = b.querySelector('span[style] > span');
    return ((t && t.textContent) || '').trim();
  })`) as Promise<string[]>;

/* Fehlt ein Element (gegen den alten Stand), bleibt der Lauf stehen statt
   abzubrechen — jede rote Zeile soll gedruckt werden. */
const fokus = (s: Page, sel: string): Promise<unknown> =>
  s.evaluate<any>(`document.querySelector(${JSON.stringify(sel)})?.focus()`);
const klick = async (s: Page, sel: string): Promise<void> => {
  const el = await s.$(sel);
  if (el) await el.click({ timeout: 4000 }).catch(() => {});
};
const tippe = async (s: Page, wort: string, warte = 700): Promise<void> => {
  if (await s.$('#q')) await s.fill('#q', wort);
  await s.waitForTimeout(warte);
};

const suchtaste = async (s: Page): Promise<void> => {
  await s.evaluate<any>(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
  await s.keyboard.press('Control+p');
  await s.waitForSelector('.finder.such #q', { timeout: 8000 }).catch(() => {});
  await s.waitForTimeout(350);
};

const imDokument = async (s: Page, id: string): Promise<void> => {
  await zu(s);
  await s.evaluate<any>(`App.oeffne(${JSON.stringify(id)})`);
  await s.waitForSelector('.document-workspace', { timeout: 20000 });
  await s.waitForTimeout(900);
};

/* ══ §1 Eine Wahl je Kategorie ═══════════════════════════════════════════ */
console.log('\n§1 Eine Wahl je Kategorie — Ort, Art, Form, je ein Wähler in einer Zeile');
for (const handy of [false, true]) {
  const g = handy ? '390' : '1440';
  const a = await aufmachen({ handy, dunkel: handy });
  const { s } = a;
  for (const form of ['deckel', 'regal', 'liste']) {
    await zurBibliothek(s, form);
    const w = await s.evaluate<any>(`(() => {
      const sichtbar = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const alle = sel => [...document.querySelectorAll(sel)].filter(sichtbar);
      const ort = alle('.bib [data-orte]'), art = alle('.bib [data-art-wahl]'), form = alle('.bib [data-form-wahl]');
      const r = x => x[0] ? x[0].getBoundingClientRect() : null;
      const a = r(ort), b = r(art), c = r(form);
      return { ort: ort.length, art: art.length, form: form.length,
        alt: alle('.bib-studio-wege, [data-studio-weg], .bib-arten, .bib-studio-optionen, .bib-studio-sammlungen, .bib [data-a="filter"]').length,
        zeile: !!(a && b && c) && Math.abs(a.top - b.top) < 4 && Math.abs(a.top - c.top) < 4,
        hoehen: [a, b, c].map(x => x ? Math.round(x.height) : 0),
        breiten: [a, b, c].map(x => x ? Math.round(x.width) : 0),
        popup: [ort[0], art[0], form[0]].map(x => x ? x.getAttribute('aria-haspopup') : ''),
        ueberlauf: document.documentElement.scrollWidth > innerWidth + 1 };
    })()`);
    gleich(`${g} ${form}: genau EIN Ort-Wähler`, w.ort, 1);
    gleich(`${g} ${form}: genau EIN Art-Wähler`, w.art, 1);
    gleich(`${g} ${form}: genau EIN Form-Wähler`, w.form, 1);
    gleich(`${g} ${form}: keine Wege-Zeile, keine Artenchips, kein Sammlungsfeld, kein zweiter Ortsfilter`, w.alt, 0);
    p(`${g} ${form}: Ort, Art und Form stehen in EINER Zeile`, w.zeile, JSON.stringify(w));
    p(`${g} ${form}: jede Pille misst 44 × 44 (§37)`, w.hoehen.every((h: number) => h >= 44) && w.breiten.every((x: number) => x >= 44),
      JSON.stringify({ h: w.hoehen, b: w.breiten }));
    gleich(`${g} ${form}: alle drei sagen, dass sie ein Menü haben`, w.popup, ['menu', 'menu', 'menu']);
    p(`${g} ${form}: kein waagrechter Überlauf`, !w.ueberlauf);
  }

  /* Das Ortsmenü: mit der Tastatur geöffnet, alle Namen, je einer. */
  await zurBibliothek(s, 'deckel');
  await fokus(s, '.bib [data-orte]');
  await s.keyboard.press('Enter');
  await s.waitForTimeout(450);
  const m = await menue(s);
  /* AM TELEFON IST ES EIN BLATT VON UNTEN (`role=dialog`, E702) — das Muster
     des Kits für eine Auswahl am Telefon; seine Einträge bleiben
     `menuitemradio` mit ✓. Die Pfeiltasten gehören dem Menü am Rechner. */
  const rolleOk = (r: string): boolean => handy ? ['menu', 'dialog'].includes(r) : r === 'menu';
  p(`${g}: Enter öffnet das Ortsmenü (${handy ? 'Blatt' : 'role=menu'})`, m.da && rolleOk(m.rolle), JSON.stringify({ da: m.da, rolle: m.rolle }));
  gleich(`${g}: … und der Ort-Wähler sagt aria-expanded=true`,
    await s.evaluate<any>(`document.querySelector('.bib [data-orte]')?.getAttribute('aria-expanded')`), 'true');
  const orte = m.eintraege.filter(e => !e.id.startsWith('sammlung:'));
  gleich(`${g}: die Orte, je mit EINEM Namen, in dieser Reihenfolge`, orte.map(e => e.name), ORTE);
  gleich(`${g}: … ihre Kennungen`, orte.map(e => e.id), ORT_IDS);
  const namen = m.eintraege.map(e => e.name);
  /* Eine leere Liste hat auch keine Doppel (§55.2) — erst zählen. */
  p(`${g}: kein Name steht zweimal im Menü`, namen.length >= ORTE.length && new Set(namen).size === namen.length, JSON.stringify(namen));
  const sammlungen = await s.evaluate<any>(`Arbeitswelt.sammlungen.map(a => a.name)`) as string[];
  gleich(`${g}: die sechs Sammlungen stehen als eigene Gruppe darin`,
    m.eintraege.filter(e => e.id.startsWith('sammlung:')).map(e => e.name), sammlungen);
  p(`${g}: … mit den Überschriften „Orte" und „Sammlungen"`, m.grp.includes('Orte') && m.grp.includes('Sammlungen'), JSON.stringify(m.grp));
  p(`${g}: die Formen stehen NICHT mehr im Ortsmenü (Entscheidung b)`, namen.length >= ORTE.length && !FORMEN.some(f => namen.includes(f)), JSON.stringify(namen));
  gleich(`${g}: der Fokus steht auf dem gewählten Ort`, m.fokus, 'ablage');
  gleich(`${g}: … und nur er ist gewählt`, orte.filter(e => e.an === 'true').map(e => e.id), ['ablage']);
  if (!handy) {
    await s.keyboard.press('ArrowDown');
    await s.waitForTimeout(120);
    gleich(`${g}: Pfeil ab wandert zum nächsten Ort`, (await menue(s)).fokus, 'kuerzlich');
  }
  await s.keyboard.press('Escape');
  await s.waitForTimeout(250);
  const nachEsc = await s.evaluate<any>(`({ menue: !!document.querySelector('.menu'),
    fokus: document.activeElement?.hasAttribute('data-orte') || false,
    exp: document.querySelector('.bib [data-orte]')?.getAttribute('aria-expanded') })`);
  p(`${g}: Escape schliesst das Menü, der Fokus steht wieder auf dem Ort-Wähler`, !nachEsc.menue && nachEsc.fokus, JSON.stringify(nachEsc));
  gleich(`${g}: … und aria-expanded fällt zurück`, nachEsc.exp, 'false');

  /* Ein Ort wählen: Favoriten, dann „Alle PDFs". */
  await klick(s, '.bib [data-orte]');
  await s.waitForTimeout(400);
  await klick(s, '.menu [data-wahl="favoriten"]');
  await s.waitForTimeout(500);
  const fav = await s.evaluate<any>(`({ pille: (document.querySelector('.bib [data-orte]')?.textContent || '').trim(),
    deckel: [...document.querySelectorAll('.bib-gitter .bib-deckel')].map(d => d.getAttribute('data-id')) })`);
  p(`${g}: „Favoriten" gewählt — die Pille sagt es`, /^Favoriten/.test(fav.pille), fav.pille);
  p(`${g}: … und das Regal zeigt die Favoriten`, fav.deckel.includes(a.notizen) && !fav.deckel.includes(a.tafel), JSON.stringify(fav.deckel));
  await klick(s, '.bib [data-orte]');
  await s.waitForTimeout(400);
  await klick(s, '.menu [data-wahl="pdf"]');
  await s.waitForTimeout(500);
  const pdfs = await s.evaluate<any>(`({ ort: (document.querySelector('.bib [data-orte]')?.textContent || '').trim(),
    art: (document.querySelector('.bib [data-art-wahl]')?.textContent || '').trim(),
    arten: [...document.querySelectorAll('.bib-gitter .bib-deckel')].map(d => d.getAttribute('data-art')) })`);
  p(`${g}: „Alle PDFs" — die Ortspille sagt „Alle PDFs", die Artpille „PDF"`,
    /^Alle PDFs/.test(pdfs.ort) && /^PDF/.test(pdfs.art), JSON.stringify(pdfs));
  p(`${g}: … und nur PDFs stehen im Regal`, pdfs.arten.length >= 2 && pdfs.arten.every((x: string) => x === 'pdf'), JSON.stringify(pdfs.arten));

  /* Die Art: mit der Leertaste, mit Zahlen. */
  await zurBibliothek(s, 'deckel');
  await s.evaluate<any>(`(() => { document.querySelector('.bib [data-orte]')?.click(); })()`);
  await s.waitForTimeout(350);
  await s.evaluate<any>(`document.querySelector('.menu [data-wahl="alle"]')?.click()`);
  await s.waitForTimeout(500);
  await fokus(s, '.bib [data-art-wahl]');
  await s.keyboard.press(' ');
  await s.waitForTimeout(450);
  const am = await menue(s);
  p(`${g}: die Leertaste öffnet das Artmenü`, am.da && rolleOk(am.rolle), JSON.stringify({ da: am.da, rolle: am.rolle }));
  const artIds = am.eintraege.map(e => e.id);
  p(`${g}: … mit „Alle Arten" und den vorhandenen Arten`,
    artIds[0] === 'alle' && ['pdf', 'board', 'ordner', 'seite'].every(x => artIds.includes(x)), JSON.stringify(am.eintraege));
  p(`${g}: … jede mit ihrer Zahl`, am.eintraege.length >= 5 && am.eintraege.every(e => /\d/.test(e.name)), JSON.stringify(am.eintraege.map(e => e.name)));
  await klick(s, '.menu [data-wahl="board"]');
  await s.waitForTimeout(500);
  const wb = await s.evaluate<any>(`({ art: (document.querySelector('.bib [data-art-wahl]')?.textContent || '').trim(),
    arten: [...document.querySelectorAll('.bib-gitter .bib-deckel')].map(d => d.getAttribute('data-art')),
    fokus: document.activeElement?.hasAttribute('data-art-wahl') || false })`);
  p(`${g}: „Whiteboards" gewählt — die Pille sagt es, das Regal zeigt nur Whiteboards`,
    /^Whiteboards/.test(wb.art) && wb.arten.length >= 1 && wb.arten.every((x: string) => x === 'board'), JSON.stringify(wb));
  p(`${g}: … und der Fokus steht wieder auf der Artpille`, wb.fokus);

  /* Die Form: drei Formen, nur hier. */
  await fokus(s, '.bib [data-form-wahl]');
  await s.keyboard.press('Enter');
  await s.waitForTimeout(450);
  const fm = await menue(s);
  gleich(`${g}: der Formknopf öffnet die drei Formen`, fm.eintraege.map(e => e.name), FORMEN);
  gleich(`${g}: … ihre Kennungen`, fm.eintraege.map(e => e.id), ['deckel', 'regal', 'liste']);
  await klick(s, '.menu [data-wahl="liste"]');
  await s.waitForTimeout(600);
  const li = await s.evaluate<any>(`({ form: Store.getMeta('bibForm'), tab: !!document.querySelector('.bib-tab') })`);
  p(`${g}: „Als Tabelle" wird gemerkt und gezeigt`, li.form === 'liste' && li.tab, JSON.stringify(li));

  /* AUSBILDUNG IST EIN ORT, KEIN ENDE (Fund des Bogens): die Schulansicht
     hatte keinen Ort-Wähler, und `Bibliothek.oeffne()` blieb in ihr — wer
     „Ausbildung" wählte, kam bis zum Neuladen nicht zurück in die Ablage. */
  await zurBibliothek(s, 'deckel');
  await klick(s, '.bib [data-orte]');
  await s.waitForTimeout(400);
  await klick(s, '.menu [data-wahl="schule"]');
  await s.waitForTimeout(700);
  const sch = await s.evaluate<any>(`({ schule: !!document.querySelector('.school-home, .school-empty'),
    ort: (document.querySelector('[data-orte]')?.textContent || '').trim(),
    h: Math.round(document.querySelector('[data-orte]')?.getBoundingClientRect().height || 0) })`);
  p(`${g}: in „Ausbildung" steht derselbe Ort-Wähler`, sch.schule && /^Ausbildung/.test(sch.ort) && sch.h >= 44, JSON.stringify(sch));
  await klick(s, '[data-orte]');
  await s.waitForTimeout(400);
  await klick(s, '.menu [data-wahl="ablage"]');
  await s.waitForTimeout(700);
  p(`${g}: … und er führt zurück in die Ablage`,
    await s.evaluate<any>(`!!document.querySelector('.bib-gitter .bib-deckel') && !document.querySelector('.school-home, .school-empty')`));

  /* Eine Sammlung aus dem Ortsmenü. */
  await zurBibliothek(s, 'deckel');
  await klick(s, '.bib [data-orte]');
  await s.waitForTimeout(400);
  await klick(s, '.menu [data-wahl="sammlung:whiteboards"]');
  await s.waitForTimeout(900);
  p(`${g}: eine Sammlung aus dem Ortsmenü öffnet sie`, /#whiteboards$/.test(await s.evaluate<any>(`location.hash`) as string),
    await s.evaluate<any>(`location.hash`) as string);
  await a.k.close();
}

/* ══ §2 Inhalt zuerst ═══════════════════════════════════════════════════ */
console.log('\n§2 Inhalt zuerst — der erste Deckel im ersten Bild, wenig darüber');
for (const handy of [false, true]) {
  const g = handy ? '390 × 844' : '1440 × 900';
  const a = await aufmachen({ handy });
  await zurBibliothek(a.s, 'deckel');
  const u = await ueberDemRaster(a.s);
  console.log(`   ${g}: erster Deckel bei y=${u.y}, ${u.zahl} Bedienelemente darüber: ${u.namen.join(' | ')}`);
  p(`${g}: der erste Deckel liegt im ersten Bild`, u.y >= 0 && u.y < u.hoch, `y ${u.y} von ${u.hoch}`);
  p(`${g}: höchstens zehn Bedienelemente über dem Raster`, u.zahl <= 10, String(u.zahl));
  const leer = await a.s.evaluate<any>(`({ recent: !!document.querySelector('.rmo-recent'),
    attrappen: document.querySelectorAll('[data-rmo-new], [data-rmo-import]').length })`);
  p(`${g}: ein leeres „Zuletzt geöffnet" zeigt nichts — keine Attrappen`, !leer.recent && leer.attrappen === 0, JSON.stringify(leer));
  /* Und wenn wirklich etwas geöffnet wurde, steht es da. */
  await a.s.evaluate<any>(`Store.updateBlock(${JSON.stringify(a.notizen)}, { zuletztGeoeffnet: new Date().toISOString() })`);
  await zurBibliothek(a.s, 'deckel');
  p(`${g}: … ein wirklich geöffnetes Dokument steht unter „Zuletzt geöffnet"`,
    await a.s.evaluate<any>(`!!document.querySelector('.rmo-recent [data-rmo-open=${JSON.stringify(a.notizen)}]')`));
  const u2 = await ueberDemRaster(a.s);
  p(`${g}: … und auch dann höchstens zehn darüber`, u2.zahl <= 10, String(u2.zahl) + ': ' + u2.namen.join(' | '));
  await a.k.close();
}

/* ══ §3 Keine zweite Suche ══════════════════════════════════════════════ */
console.log('\n§3 Keine zweite Suche auf der Bibliotheksseite');
{
  const a = await aufmachen();
  const { s } = a;
  for (const form of ['deckel', 'regal', 'liste']) {
    await zurBibliothek(s, form);
    const f = await s.evaluate<any>(`({ suchfelder: document.querySelectorAll('.bib input[type=search], #bib-suche, #bib-studio-suche').length,
      felder: [...document.querySelectorAll('.bib input')].filter(e => e.getBoundingClientRect().width > 0).length })`);
    p(`${form}: kein Suchfeld auf der Bibliotheksseite`, f.suchfelder === 0 && f.felder === 0, JSON.stringify(f));
  }
  await zurBibliothek(s, 'liste');
  await klick(s, '.bib [data-a="suche"]');
  await s.waitForTimeout(500);
  const z = await bereichZeile(s);
  p('Die Lupe der Liste öffnet die EINE Suche …', z.suche && await s.evaluate<any>(`!document.getElementById('bib-suche')`));
  gleich('… im Bereich Bibliothek', z.an, 'bibliothek');
  await a.k.close();
}

/* ══ §4 Die Suche kennt ihren Bereich ═══════════════════════════════════ */
console.log('\n§4 Die Suche kennt ihren Bereich');
for (const handy of [false, true]) {
  const g = handy ? '390' : '1440';
  const a = await aufmachen({ handy, dunkel: !handy });
  const { s } = a;
  await zurBibliothek(s, 'deckel');
  if (handy) {
    await s.evaluate<any>(`document.getElementById('mb-suche')?.click()`);
    await s.waitForTimeout(500);
  } else await suchtaste(s);
  const z = await bereichZeile(s);
  gleich(`${g}, Bibliothek (${handy ? '⌕' : 'Strg P'}): die Suche geht mit [Bibliothek · Überall] auf`, z.ids, ['bibliothek', 'ueberall']);
  gleich(`${g}: … die Namen`, z.namen, ['Bibliothek', 'Überall']);
  gleich(`${g}: … Vorgabe Bibliothek`, z.an, 'bibliothek');
  /* EIN „Überall" im Kopf (Fund aus dem Bild): der Ortsfilter der Seiten
     hiess in seiner Vorgabe ebenfalls „Überall" — neben „In ‚Kabelkunde‘"
     las sich das wie ein Widerspruch. */
  const ueberall = await s.evaluate<any>(`[...document.querySelectorAll('.finder.such .such-bereich [role=radio], .finder.such .such-filter option:checked')]
    .filter(e => (e.textContent || '').trim() === 'Überall').length`);
  gleich(`${g}: „Überall" steht im Kopf der Suche genau einmal`, ueberall, 1);
  await tippe(s, 'Leitungsschutz');
  const t = await trefferTitel(s);
  /* IM BEREICH Bibliothek — ohne Bereich fand die Schalensuche das immer,
     das Regalfeld daneben fand 0 (es prüfte nur Titel). */
  p(`${g}: im Bereich Bibliothek findet ein Wort, das nur im Inhalt steht, Regaldokumente`,
    z.an === 'bibliothek' && ['Absicherung', 'Notizen', 'Datenblatt'].every(x => t.includes(x)), JSON.stringify({ an: z.an, t }));
  gleich(`${g}: … und der Fokus bleibt im Suchfeld`, await s.evaluate<any>(`document.activeElement?.id`), 'q');
  await zu(s);

  if (!handy) {
    await klick(s, '#studio-search');
    await s.waitForTimeout(500);
    gleich(`${g}: die Kapsel öffnet dieselbe Zeile`, (await bereichZeile(s)).an, 'bibliothek');
    await zu(s);
  }

  /* Im Ordner. */
  await zurBibliothek(s, 'deckel', a.ordner);
  if (handy) { await s.evaluate<any>(`document.getElementById('mb-suche')?.click()`); await s.waitForTimeout(500); }
  else await suchtaste(s);
  const zo = await bereichZeile(s);
  gleich(`${g}, im Ordner: der Bereich heisst „In ‚Kabelkunde‘"`, zo.namen, ['In ‚Kabelkunde‘', 'Überall']);
  await tippe(s, 'Leitungsschutz');
  const to = await trefferTitel(s);
  gleich(`${g}: … und findet nur, was darin liegt`, to, ['Absicherung']);
  await klick(s, '.finder.such [data-seg-wahl="ueberall"]');
  await s.waitForTimeout(600);
  const tu = await trefferTitel(s);
  const uan = (await bereichZeile(s)).an;
  p(`${g}: „Überall" findet auch, was draussen liegt`, uan === 'ueberall' && tu.includes('Notizen') && tu.includes('Absicherung'), JSON.stringify({ uan, tu }));
  gleich(`${g}: … und der Fokus kehrt ins Suchfeld zurück`, await s.evaluate<any>(`document.activeElement?.id`), 'q');
  await zu(s);

  /* Auf einer gewöhnlichen Seite: keine Zeile. */
  await s.evaluate<any>(`App.oeffne(${JSON.stringify(a.notizen)})`);
  await s.waitForTimeout(700);
  await suchtaste(s);
  const zs = await bereichZeile(s);
  p(`${g}, gewöhnliche Seite: die Suche geht auf, ohne Bereichszeile`, zs.suche && zs.ids.length === 0, JSON.stringify(zs));
  await zu(s);

  /* In einer PDF — die Vorgabe kommt aus der gemerkten Wahl der Suchleiste. */
  await imDokument(s, a.pdf);
  await s.evaluate<any>(`Store.setMeta('dokFindAlle', false)`);
  await suchtaste(s);
  const zd = await bereichZeile(s);
  gleich(`${g}, PDF: die Suche geht mit [Dieses Dokument · Alle Dokumente · Überall] auf`, zd.ids, ['dokument', 'dokumente', 'ueberall']);
  gleich(`${g}: … die Namen`, zd.namen, ['Dieses Dokument', 'Alle Dokumente', 'Überall']);
  gleich(`${g}: … Vorgabe „Dieses Dokument" (gemerkt: false)`, zd.an, 'dokument');
  p(`${g}: … und die Seitenfilter stehen dort nicht, wo sie nichts bedeuten`, !zd.filterSichtbar);
  await tippe(s, 'Leitungsschutz', 1400);
  const zahlen = await s.evaluate<any>(`(() => {
    const row = document.querySelector('#res [data-dokument-zahl]');
    const fb = document.querySelector('.document-findbar');
    return { suche: row ? Number(row.getAttribute('data-dokument-zahl')) : -1,
             leiste: (document.querySelector('.document-find-zahl')?.textContent || '').trim(),
             leisteOffen: !!fb && !fb.hidden };
  })()`);
  gleich(`${g}: „Dieses Dokument" meldet 3 Treffer`, zahlen.suche, 3);
  p(`${g}: … dieselbe Zahl wie die Suchleiste (sie ist der Motor)`, zahlen.leisteOffen && zahlen.leiste.startsWith(String(zahlen.suche)), JSON.stringify(zahlen));
  await s.keyboard.press('Enter');
  await s.waitForTimeout(900);
  const nachEnter = await s.evaluate<any>(`(() => {
    const fb = document.querySelector('.document-findbar');
    const feld = fb && fb.querySelector('input');
    return { suche: !!document.querySelector('.finder.such'), offen: !!fb && !fb.hidden,
             wort: feld ? feld.value : '', zahl: (document.querySelector('.document-find-zahl')?.textContent || '').trim(),
             fokus: !!feld && document.activeElement === feld };
  })()`);
  p(`${g}: Enter schliesst die Suche und öffnet die Suchleiste mit dem Wort`,
    !nachEnter.suche && nachEnter.offen && nachEnter.wort === 'Leitungsschutz', JSON.stringify(nachEnter));
  gleich(`${g}: … auf Treffer 1`, nachEnter.zahl, '1/3');
  p(`${g}: … und der Fokus steht im Feld der Suchleiste`, nachEnter.fokus);

  await imDokument(s, a.pdf);
  await s.evaluate<any>(`Store.setMeta('dokFindAlle', true)`);   /* der alte Wahrheitswert */
  await suchtaste(s);
  gleich(`${g}: der alte Wert „true" heisst „Alle Dokumente"`, (await bereichZeile(s)).an, 'dokumente');
  await tippe(s, 'Leitungsschutz', 900);
  const td = await s.evaluate<any>(`[...document.querySelectorAll('#res button[data-i]')].map(b => b.textContent)`) as string[];
  const tdan = (await bereichZeile(s)).an;
  p(`${g}: „Alle Dokumente" findet die Stellen in beiden PDFs`, tdan === 'dokumente' &&
    td.some(x => /Skript B/.test(x) && /Seite 1/.test(x)) && td.some(x => /Datenblatt/.test(x) && /Seite/.test(x)), JSON.stringify({ tdan, td }));
  await klick(s, '.finder.such [data-seg-wahl="dokument"]');
  await s.waitForTimeout(300);
  gleich(`${g}: eine Wahl in der Suche wird gemerkt — dieselbe Erinnerung wie in der Suchleiste`,
    await s.evaluate<any>(`Store.getMeta('dokFindAlle')`), false);
  await zu(s);
  await s.evaluate<any>(`Store.setMeta('dokFindAlle', 'ueberall')`);
  await suchtaste(s);
  gleich(`${g}: gemerkt „Überall" → Vorgabe Überall`, (await bereichZeile(s)).an, 'ueberall');
  await a.k.close();
}

/* ══ §5 Die Suchleiste im Dokument ══════════════════════════════════════ */
console.log('\n§5 Die Suchleiste im Dokument trägt dieselben drei Bereiche');
for (const handy of [false, true]) {
  const g = handy ? '390' : '1440';
  const a = await aufmachen({ handy });
  const { s } = a;
  await imDokument(s, a.pdf);
  await s.evaluate<any>(`document.querySelector('.document-find-button')?.click()`);
  await s.waitForTimeout(400);
  const l = await s.evaluate<any>(`(() => {
    const fb = document.querySelector('.document-findbar');
    const g = fb && fb.querySelector('[role="radiogroup"]');
    const radios = g ? [...g.querySelectorAll('[role="radio"]')] : [];
    return { ids: radios.map(r => r.getAttribute('data-seg-wahl')),
      namen: radios.map(r => (r.textContent || '').trim()),
      an: (radios.find(r => r.getAttribute('aria-checked') === 'true') || { getAttribute: () => '' }).getAttribute('data-seg-wahl'),
      zeichen: radios.map(r => !!r.querySelector('svg')),
      masse: radios.map(r => { const q = r.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height), Math.round(q.right)]; }),
      alt: !!document.querySelector('[data-document-action="find-alle"]'),
      emoji: (fb && fb.textContent || '').includes('📚'),
      ueberlauf: fb ? fb.scrollWidth > fb.clientWidth + 1 : true, breite: innerWidth };
  })()`);
  gleich(`${g}: die Suchleiste trägt einen Umschalter mit drei Bereichen`, l.ids, ['dokument', 'dokumente', 'ueberall']);
  p(`${g}: … mit Namen (auch für den Vorleser)`, l.namen.join('|').includes('Dieses Dokument') && l.namen.join('|').includes('Alle Dokumente') && l.namen.join('|').includes('Überall'), JSON.stringify(l.namen));
  gleich(`${g}: … Vorgabe aus der gemerkten Wahl`, l.an, 'dokument');
  p(`${g}: … mit gezeichneten Zeichen statt 📚`, l.zeichen.every(Boolean) && !l.emoji && !l.alt, JSON.stringify(l));
  p(`${g}: … jede Wahl 44 × 44 und im Bild (§37)`, l.masse.length === 3 && l.masse.every((m: number[]) => (m[0] ?? 0) >= 44 && (m[1] ?? 0) >= 44 && (m[2] ?? 0) <= l.breite),
    JSON.stringify(l.masse));
  p(`${g}: … und die Leiste läuft nicht über`, !l.ueberlauf);
  await s.fill('.document-findbar input', 'Leitungsschutz');
  await s.waitForTimeout(700);
  await klick(s, '.document-findbar [data-seg-wahl="dokumente"]');
  await s.waitForTimeout(500);
  const liste = await s.evaluate<any>(`({ offen: !document.querySelector('.document-find-liste')?.hidden,
    funde: [...document.querySelectorAll('.document-find-fund')].map(f => f.textContent),
    merk: Store.getMeta('dokFindAlle') })`);
  p(`${g}: „Alle Dokumente" zeigt die Stellen der anderen PDF`, liste.offen && liste.funde.some((x: string) => /Skript B/.test(x)), JSON.stringify(liste));
  gleich(`${g}: … und wird gemerkt wie der alte Schalter (true)`, liste.merk, true);
  await klick(s, '.document-findbar [data-seg-wahl="ueberall"]');
  await s.waitForTimeout(900);
  const ue = await bereichZeile(s);
  const ueWort = await s.evaluate<any>(`document.getElementById('q')?.value || ''`);
  p(`${g}: „Überall" öffnet die EINE Suche mit dem Wort`, ue.suche && ueWort === 'Leitungsschutz', JSON.stringify({ ue, ueWort }));
  gleich(`${g}: … im Bereich Überall`, ue.an, 'ueberall');
  const tt = await trefferTitel(s);
  p(`${g}: … und sie sucht das Wort sofort (nicht „Zuletzt")`, tt.includes('Absicherung') && tt.includes('Notizen'), JSON.stringify(tt));
  await a.k.close();
}

/* ══ §6 Escape: ein Druck, eine Ebene ═══════════════════════════════════ */
console.log('\n§6 Escape — ein Druck, eine Ebene');
{
  const a = await aufmachen();
  const { s } = a;
  await zurBibliothek(s, 'deckel');
  await fokus(s, '.bib [data-art-wahl]');
  await s.keyboard.press('Enter');
  await s.waitForTimeout(400);
  await s.keyboard.press('Escape');
  await s.waitForTimeout(250);
  const e1 = await s.evaluate<any>(`({ menue: !!document.querySelector('.menu'), bib: !!document.querySelector('.bib-gitter'),
    fokus: document.activeElement?.hasAttribute('data-art-wahl') || false })`);
  p('Bibliothek: Escape nimmt das Menü und lässt die Bibliothek stehen; der Fokus geht an die Pille',
    !e1.menue && e1.bib && e1.fokus, JSON.stringify(e1));
  await imDokument(s, a.pdf);
  await suchtaste(s);
  await tippe(s, 'Leitungsschutz', 1300);
  await s.keyboard.press('Escape');
  await s.waitForTimeout(350);
  const e2 = await s.evaluate<any>(`({ suche: !!document.querySelector('.finder.such'),
    leiste: !document.querySelector('.document-findbar')?.hidden })`);
  p('Dokument: der erste Druck nimmt die Suche, die Suchleiste bleibt', !e2.suche && e2.leiste, JSON.stringify(e2));
  await s.keyboard.press('Escape');
  await s.waitForTimeout(350);
  p('… der zweite nimmt die Suchleiste', await s.evaluate<any>(`!!document.querySelector('.document-findbar')?.hidden`));
  await a.k.close();
}

/* ══ §7 Bewegung ════════════════════════════════════════════════════════ */
console.log('\n§7 Das Ortsmenü geht mit Bewegung auf — und ruhig ohne Wachsen');
const waechst = async (s: Page): Promise<{ laeuft: number; skala: boolean }> => {
  await zu(s);
  await klick(s, '.bib [data-orte]');
  await s.waitForTimeout(40);
  const r = await s.evaluate<any>(`(() => {
    const m = document.querySelector('.menu');
    if (!m) return { laeuft: -1, skala: false };
    const an = m.getAnimations({ subtree: false });
    return { laeuft: an.length, skala: an.some(x => { try { return x.effect.getKeyframes().some(k => /scale|translate/.test(String(k.transform || ''))); } catch { return false; } }) };
  })()`);
  await s.waitForTimeout(400);
  return r;
};
{
  const a = await aufmachen();
  await zurBibliothek(a.s, 'deckel');
  const n = await waechst(a.s);
  /* Die Gegenseite: ohne sie sagte „kein Wachsen" unten immer ja (§55.2). */
  p('Gewöhnliche Bewegung: das Ortsmenü geht mit Bewegung auf — die Messung kann sie sehen', n.laeuft > 0 && n.skala, JSON.stringify(n));
  await a.s.evaluate<any>(`Einstellungen.S('bewegung', 'ruhig')`);
  await zurBibliothek(a.s, 'deckel');
  const r = await waechst(a.s);
  p('„Ruhige Darstellung": es geht ohne Wachsen auf', r.laeuft === 0 || !r.skala, JSON.stringify(r));
  await a.s.evaluate<any>(`Einstellungen.S('bewegung', 'normal')`);
  await a.k.close();
}
{
  const a = await aufmachen({ wenig: true });
  await zurBibliothek(a.s, 'deckel');
  const r = await waechst(a.s);
  p('„Weniger Bewegung" im System: es geht ohne Wachsen auf', r.laeuft === 0 || !r.skala, JSON.stringify(r));
  await a.k.close();
}

/* ══ Seitenfehler ═══════════════════════════════════════════════════════ */
console.log('\nSeitenfehler');
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 4).join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
