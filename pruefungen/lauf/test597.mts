/* Suite 597 — Ein Menü je Ding: Rechtsklick, „…", Tastatur und Langdruck aus EINER Quelle (E721)
 * ============================================================================
 * Redur, Masterprompt vom 29. September 2026, Seite 19 (seine Notiz unter
 * dem Foto der Bibliothekskarten, auf dem er den ☆ oben rechts eingekreist
 * hat, wörtlich):
 *
 *     „Hier füge ... und oder beim rechts klicke sollte es mir zeigen
 *      löschen"
 *
 * und darunter: „Für den rechts klick bei eine dokument oder eine text usw
 * wo es passen kann". Seite 13: „… und auch die rechtsk klickt sollte hier
 * für die ordner haben ."
 *
 * Gemeint ist: an der eingekreisten Stelle ein echtes „…", und derselbe
 * Inhalt auf Rechtsklick, mit der Tastatur (Kontextmenü-Taste, Umschalt+F10)
 * und mit dem Finger (lang drücken). EINE Quelle für die Aktionen eines
 * Dings — nicht fünf Listen, die einander nicht kennen.
 *
 *   §1  Bei 1440 und 390: jeder Deckel der Bibliothek hat einen GESCHWISTER-
 *       Knopf `button.bib-deckel-mehr` (kein Knopf im Knopf), nicht
 *       aria-hidden, sein Name enthält den Namen des Dings, er misst
 *       mindestens 44 × 44 und sitzt im oberen rechten Viertel des Deckels.
 *       (Rot: ein <i aria-hidden> von 20 × 20 IM Kartenknopf.)
 *   §2  Rechtsklick auf eine Karte → `defaultPrevented` und ein Menü mit
 *       GENAU denselben Einträgen wie ihr „…". (Rot: das Browsermenü.)
 *   §3  Umschalt+F10 und die Kontextmenü-Taste auf einer fokussierten Karte
 *       → role=menu, der erste Eintrag hat den Fokus, Pfeil ab und Ende
 *       erreichen „In den Papierkorb" (rot markiert, zuletzt), Escape
 *       schliesst genau EINE Ebene, und der Fokus steht wieder auf der Karte.
 *   §4  Am Telefon: 600 ms lang drücken → das Menü; nach dem Loslassen ist
 *       KEINE Seite aufgegangen. (Rot: kein Menü, die Seite öffnete sich.)
 *   §5  Regal und Tabelle: dieselben Einträge auf Rechtsklick.
 *       (Rot: null Aktionen.)
 *   §6  Ein Name mit Anführungszeichen und <b> bleibt Text im Namen des
 *       „…" (§19).
 *   §7  EINE Quelle: Umbenennen und Papierkorb aus dem „…" der Bibliothek,
 *       aus dem Ablagebaum, aus dem ⋯ der Notizhefte und aus dem Seitenmenü
 *       gehen alle durch `Register.aktionen.tun`; und was `fuer()` für einen
 *       Ordner liefert, steht im Menü der Karte.
 *   §8  Was gilt, steht da — und nur das: eine PDF hat kein „Blick hinein",
 *       ein Heft hat „In Fach verschieben", ein Fach nicht.
 *   §9  Rot heisst Gefahr: jeder `data-gefahr`-Eintrag hat genau die Farbe
 *       `--gefahr` — in Bibliothek, Notizheften und Seitenmenü, bei 1440
 *       und 390, hell und dunkel. (Rot: am Rechner nie rot.)
 *   §10 Entf auf einer fokussierten Karte und auf einer Zeile des
 *       Ablagebaums → Papierkorb mit Frist und eine Meldung mit
 *       „Rückgängig". (Rot: Entf tat nichts — obwohl das Seitenmenü
 *       „· Entf" verspricht.)
 *   §11 Ablagebaum: Rechtsklick, Umschalt+F10 und Kontextmenü-Taste auf
 *       einer Zeile → dasselbe Menü wie das „…" der Karte; Escape gibt den
 *       Fokus an die Zeile zurück.
 *   §12 Seitenleiste: Rechtsklick auf eine Zeile → das Seitenmenü (dasselbe
 *       wie ihr ⋯); das ⋯ hat einen Namen.
 *   §13 Notizhefte: Rechtsklick auf Heft und Fach → ihre Einträge; am
 *       Telefon lang drücken und ohne Bewegung loslassen → das Menü.
 *   §14 `UI.wahl` — die EINE Auswahlliste: aria-expanded am Anker kippt,
 *       ✓ und aria-current am gewählten Eintrag, Pfeiltasten, Enter wählt,
 *       Escape gibt den Fokus zurück, Namen bleiben Text.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Er war es: eingecheckt als „test597 (rot)" gegen 73a956937 (morgen-besser-2
 * mit ordner-bearbeiten), bevor E721 gebaut war. Die Gegenproben stehen im
 * Commit von E721.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test597.mts
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

type Bestand = { ordner: string; kind: string; seite: string; pdf: string; zitat: string;
                 fach: string; heft: string };
type Auf = { s: Page; k: BrowserContext } & Bestand;

/** Ein Ordner „Kabelkunde" mit einer Unterseite, eine Seite „Notizen",
 *  eine PDF „Datenblatt", eine Seite mit Anführungszeichen und <b> im
 *  Namen, und in den Notizheften ein Fach „Elektrotechnik" mit einem Heft. */
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
  const ids = await s.evaluate<any>(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('bibForm', 'deckel');
    Store.setMeta('bibOrdner', '');
    Store.setMeta('bibBaumSichtbar', true);
    Store.setMeta('heft:reiter', 'dokumente');
    Store.setMeta('heft:fach', '');
    App.theme(${o.dunkel ? "'dark'" : "'light'"});
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    const ordner = Store.addPage(null, { text: 'Kabelkunde', icon: '📁' });
    const kind = Store.addPage(ordner.id, { text: 'Leitungen' });
    Store.addPage(ordner.id, { text: 'Absicherung' });
    const seite = Store.addPage(null, { text: 'Notizen', zuletztGeoeffnet: new Date().toISOString() });
    Store.addBlock(seite.id, 'text', { text: 'Ein Satz.' });
    const pdf = Store.addPage(null, { text: 'Datenblatt' });
    Store.addBlock(pdf.id, 'pdfseite', { seite: 1 });
    const zitat = Store.addPage(null, { text: 'Zitat "x" <b>fett</b>' });
    const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '\\u{1F5C2}', heftArt: 'fach' });
    const heft = Store.addPage(fach.id, { text: 'Kapitel 2' });
    Store.addBlock(heft.id, 'blatt', { papier: 'blanko' });
    await Store.flush();
    App.zeichneBaum();
    return { ordner: ordner.id, kind: kind.id, seite: seite.id, pdf: pdf.id, zitat: zitat.id,
             fach: fach.id, heft: heft.id };
  })()`) as Bestand;
  return { s, k, ...ids };
};

const zurBibliothek = async (s: Page, form = 'deckel'): Promise<void> => {
  await s.evaluate<any>(`Store.setMeta('bibForm', ${JSON.stringify(form)}); Store.setMeta('bibOrdner', ''); Store.setMeta('bibBaumSichtbar', true); Bibliothek.oeffne('')`);
  await s.waitForSelector(form === 'deckel' ? '.bib-gitter .bib-deckel' : form === 'regal' ? '.bib-heft, .bib-hand' : '.bib-zeile[data-id]', { timeout: 20000 });
  await s.evaluate<any>(`(() => { const d = document.querySelector('details.bib-ablage-baum'); if (d) d.open = true; })()`);
  await s.evaluate<any>(`document.querySelectorAll('.menu').forEach(m => m.remove())`);
  await s.waitForTimeout(350);
};

/** Die Notizhefte öffnen — mit `fach` gleich in diesem Fach (dort liegt das Heft). */
const zuNotizheften = async (s: Page, fach = ''): Promise<void> => {
  await s.evaluate<any>(`Store.setMeta('heft:reiter', 'dokumente'); Store.setMeta('heft:fach', ${JSON.stringify(fach)}); Notebook.oeffnen()`);
  await s.waitForSelector('.nh-karte', { timeout: 20000 });
  await s.evaluate<any>(`document.querySelectorAll('.menu').forEach(m => m.remove())`);
  await s.waitForTimeout(300);
};

/** Die Kennungen der Einträge im offenen Menü, in ihrer Reihenfolge. */
const menueIds = (s: Page): Promise<string[]> => s.evaluate<any>(`(() => {
  const m = document.querySelector('.menu');
  if (!m) return [];
  return [...m.querySelectorAll('button[data-a]')].map(b => b.getAttribute('data-a'));
})()`) as Promise<string[]>;

const zu = async (s: Page): Promise<void> => {
  await s.evaluate<any>(`document.querySelectorAll('.menu,.menu-grund').forEach(m => m.remove())`);
  await s.waitForTimeout(120);
};

/** Mitte eines Elements im Fenster. */
const mitte = (s: Page, sel: string): Promise<{ x: number; y: number } | null> => s.evaluate<any>(`(() => {
  const e = document.querySelector(${JSON.stringify(sel)});
  if (!e) return null;
  e.scrollIntoView({ block: 'center' });
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`) as Promise<{ x: number; y: number } | null>;

/** Ein Rechtsklick wie ein Mensch, und ob jemand das Browsermenü verhindert hat. */
const rechtsklick = async (s: Page, sel: string): Promise<{ verhindert: boolean; menue: boolean }> => {
  await zu(s);
  await s.evaluate<any>(`window.__cm597 = null; if (!window.__cmHoerer597) { window.__cmHoerer597 = true;
    window.addEventListener('contextmenu', e => { window.__cm597 = e.defaultPrevented; }); }`);
  const m = await mitte(s, sel);
  if (!m) return { verhindert: false, menue: false };
  await s.mouse.click(m.x, m.y, { button: 'right' });
  await s.waitForTimeout(300);
  return await s.evaluate<any>(`({ verhindert: window.__cm597 === true, menue: !!document.querySelector('.menu') })`) as
    { verhindert: boolean; menue: boolean };
};

/** Lang drücken mit echten Berührungen (CDP), dann loslassen. */
const halten = async (a: Auf, sel: string, ms = 650): Promise<boolean> => {
  const m = await mitte(a.s, sel);
  if (!m) return false;
  const cdp = await a.k.newCDPSession(a.s);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: m.x, y: m.y }] });
  await a.s.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await a.s.waitForTimeout(500);
  await cdp.detach();
  return true;
};

const gefahrFarbe = (s: Page): Promise<{ soll: string; ist: string[] }> => s.evaluate<any>(`(() => {
  const probe = document.createElement('span');
  probe.style.color = 'var(--gefahr)';
  document.body.appendChild(probe);
  const soll = getComputedStyle(probe).color;
  probe.remove();
  const ist = [...document.querySelectorAll('.menu [data-gefahr]')].map(b => getComputedStyle(b).color);
  return { soll, ist };
})()`) as Promise<{ soll: string; ist: string[] }>;

/* ══ §1 – §3, §5 – §11 am Rechner ═════════════════════════════════════════ */
const r = await aufmachen();
await zurBibliothek(r.s);

console.log('\n§1 · Ein echtes „…" oben rechts an jedem Deckel (1440 × 900)');
const deckelPruefen = async (s: Page): Promise<any> => s.evaluate<any>(`(() => {
  const karten = [...document.querySelectorAll('.bib-gitter .bib-deckel[data-id]')];
  const fehlt = [];
  for (const k of karten) {
    const name = k.getAttribute('title') || '';
    const zelle = k.parentElement;
    const knopf = zelle ? [...zelle.children].find(x => x.classList && x.classList.contains('bib-deckel-mehr')) : null;
    const drinnen = k.querySelector('.bib-deckel-mehr');
    if (!knopf) { fehlt.push(name + ': kein Geschwister' + (drinnen ? ' (' + drinnen.tagName + ' im Knopf, aria-hidden=' + drinnen.getAttribute('aria-hidden') + ')' : '')); continue; }
    if (knopf.tagName !== 'BUTTON') { fehlt.push(name + ': ' + knopf.tagName); continue; }
    if (knopf.getAttribute('aria-hidden') === 'true') { fehlt.push(name + ': aria-hidden'); continue; }
    const benannt = (knopf.getAttribute('aria-label') || '');
    if (!benannt.includes(name)) { fehlt.push(name + ': Name „' + benannt + '"'); continue; }
    const kr = knopf.getBoundingClientRect();
    if (kr.width < 44 || kr.height < 44) { fehlt.push(name + ': ' + Math.round(kr.width) + '×' + Math.round(kr.height)); continue; }
    const blatt = (k.querySelector('.bib-deckel-blatt') || k).getBoundingClientRect();
    const cx = kr.left + kr.width / 2, cy = kr.top + kr.height / 2;
    if (cx < blatt.left + blatt.width / 2 || cy > blatt.top + blatt.height / 2 || cx > blatt.right + 4 || cy < blatt.top - 4)
      fehlt.push(name + ': Mitte ' + Math.round(cx - blatt.left) + ',' + Math.round(cy - blatt.top) + ' im Deckel ' + Math.round(blatt.width) + '×' + Math.round(blatt.height));
  }
  return { zahl: karten.length, fehlt };
})()`);
const d1 = await deckelPruefen(r.s);
p(`Jeder der ${d1.zahl} Deckel hat ein benanntes „…" ≥ 44 × 44 oben rechts, NEBEN dem Kartenknopf`,
  d1.zahl >= 4 && d1.fehlt.length === 0, d1.fehlt.slice(0, 4).join(' | '));
const imKnopf = await r.s.evaluate<any>(`document.querySelectorAll('.bib-deckel .bib-deckel-mehr, .bib-deckel button').length`);
gleich('Kein Knopf und kein Menügriff steckt IM Kartenknopf', imKnopf, 0);

console.log('\n§2 · Rechtsklick auf eine Karte = dasselbe Menü wie ihr „…"');
const kartenSel = (id: string): string => `.bib-deckel[data-id="${id}"]`;
const mehrSel = (id: string): string => `.bib-zelle:has(> .bib-deckel[data-id="${id}"]) > .bib-deckel-mehr`;
const rk2 = await rechtsklick(r.s, kartenSel(r.ordner));
p('Rechtsklick auf den Ordner verhindert das Browsermenü', rk2.verhindert);
p('… und öffnet ein Menü', rk2.menue);
const ids2rk = await menueIds(r.s);
await zu(r.s);
await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(r.ordner))})?.click()`);
await r.s.waitForTimeout(300);
const ids2mehr = await menueIds(r.s);
p('Das „…" öffnet ein Menü mit „In den Papierkorb"', ids2mehr.includes('papierkorb'), JSON.stringify(ids2mehr));
gleich('Rechtsklick und „…" zeigen GENAU dieselben Einträge', ids2rk, ids2mehr);
const rk2b = await rechtsklick(r.s, kartenSel(r.seite));
const ids2s = await menueIds(r.s);
p('Auch eine Seite: Rechtsklick → Menü mit „In den Papierkorb"', rk2b.verhindert && ids2s.includes('papierkorb'), JSON.stringify(ids2s));
await zu(r.s);

console.log('\n§3 · Mit der Tastatur: Umschalt+F10 und Kontextmenü-Taste');
const tastenMenue = async (taste: string): Promise<any> => {
  await zu(r.s);
  await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(kartenSel(r.seite))})?.focus()`);
  await r.s.keyboard.press(taste);
  await r.s.waitForTimeout(300);
  return r.s.evaluate<any>(`(() => {
    const m = document.querySelector('.menu');
    const a = document.activeElement;
    const eintraege = m ? [...m.querySelectorAll('[role="menuitem"]')] : [];
    return { menue: !!m, rolle: m?.getAttribute('role') || null, name: m?.getAttribute('aria-label') || '',
             fokusErster: !!a && eintraege[0] === a, fokusDrin: !!(m && a && m.contains(a)), zahl: eintraege.length };
  })()`);
};
const t3a = await tastenMenue('Shift+F10');
p('Umschalt+F10 öffnet ein Menü mit role=menu', t3a.menue && t3a.rolle === 'menu', JSON.stringify(t3a));
p('… mit Namen „Aktionen für …"', /Aktionen für/.test(t3a.name), t3a.name);
p('… und der erste Eintrag hat den Fokus', t3a.fokusErster, JSON.stringify(t3a));
await r.s.keyboard.press('ArrowDown');
const t3zweiter = await r.s.evaluate<any>(`(() => { const e = [...document.querySelectorAll('.menu [role="menuitem"]')]; return e.indexOf(document.activeElement); })()`);
gleich('Pfeil ab geht zum zweiten Eintrag (und nicht zur Karte dahinter)', t3zweiter, 1);
await r.s.keyboard.press('End');
const t3ende = await r.s.evaluate<any>(`(() => { const a = document.activeElement; return { text: (a?.textContent || '').trim(), gefahr: a?.hasAttribute('data-gefahr') || false,
  letzter: [...document.querySelectorAll('.menu [role="menuitem"]')].pop() === a }; })()`);
p('Ende erreicht „In den Papierkorb" — rot markiert, als letzter Eintrag',
  /Papierkorb/.test(t3ende.text) && t3ende.gefahr && t3ende.letzter, JSON.stringify(t3ende));
await r.s.keyboard.press('Home');
const t3home = await r.s.evaluate<any>(`[...document.querySelectorAll('.menu [role="menuitem"]')].indexOf(document.activeElement)`);
gleich('Pos1 zurück zum ersten', t3home, 0);
await r.s.keyboard.press('Escape');
await r.s.waitForTimeout(200);
const t3esc = await r.s.evaluate<any>(`({ menue: !!document.querySelector('.menu'), bib: !!document.querySelector('.bib-gitter'),
  fokus: document.activeElement?.matches?.(${JSON.stringify(kartenSel(r.seite))}) || false })`);
p('Escape schliesst genau das Menü — die Bibliothek bleibt', !t3esc.menue && t3esc.bib, JSON.stringify(t3esc));
p('… und der Fokus steht wieder auf der Karte', t3esc.fokus, JSON.stringify(t3esc));
const t3b = await tastenMenue('ContextMenu');
p('Die Kontextmenü-Taste öffnet dasselbe Menü, Fokus im Menü', t3b.menue && t3b.rolle === 'menu' && t3b.fokusErster, JSON.stringify(t3b));
await r.s.keyboard.press('Tab');
await r.s.waitForTimeout(150);
p('Tab schliesst das Menü', !(await r.s.evaluate<any>(`!!document.querySelector('.menu')`)));
await zu(r.s);

console.log('\n§5 · Regal und Tabelle haben dieselben Aktionen');
await zurBibliothek(r.s, 'regal');
const rk5 = await rechtsklick(r.s, `.bib-hand[data-id], .bib-heft[data-id]`);
const ids5 = await menueIds(r.s);
p('Regal: Rechtsklick → Menü mit „In den Papierkorb"', rk5.verhindert && ids5.includes('papierkorb'), JSON.stringify({ rk5, ids5 }));
await zu(r.s);
await zurBibliothek(r.s, 'liste');
const rk5b = await rechtsklick(r.s, `.bib-zeile[data-id="${r.seite}"]`);
const ids5b = await menueIds(r.s);
p('Tabelle: Rechtsklick → Menü mit „In den Papierkorb"', rk5b.verhindert && ids5b.includes('papierkorb'), JSON.stringify({ rk5b, ids5b }));
await zu(r.s);
await zurBibliothek(r.s, 'deckel');

console.log('\n§6 · Ein Name mit Anführungszeichen und <b> bleibt Text (§19)');
const t6 = await r.s.evaluate<any>(`(() => {
  const k = document.querySelector('.bib-deckel[data-id="${r.zitat}"]');
  const knopf = k?.parentElement?.querySelector(':scope > .bib-deckel-mehr');
  return { name: knopf?.getAttribute('aria-label') || null, fett: !!k?.parentElement?.querySelector('b b, .bib-deckel-mehr b') };
})()`);
p('Der Name des „…" enthält den Namen wörtlich', !!t6.name && t6.name.includes('Zitat "x" <b>fett</b>'), JSON.stringify(t6));
p('… und es entsteht kein <b>-Element daraus', !t6.fett);

console.log('\n§7 · EINE Quelle: Umbenennen und Papierkorb gehen alle durch Register.aktionen.tun');
await r.s.evaluate<any>(`(() => {
  window.__tun597 = [];
  const R = window.Register && window.Register.aktionen;
  if (R && typeof R.tun === 'function' && !R.__spion) {
    const alt = R.tun;
    R.tun = function (id, ding, ort) { window.__tun597.push(id + '@' + (ort && ort.kontext || '?')); return alt.apply(this, arguments); };
    R.__spion = true;
  }
  window.__frage597 = UI.frage;
  let n = 0;
  UI.frage = async () => 'Neu ' + (++n);
})()`);
const menueWahl = async (s: Page, id: string): Promise<boolean> => s.evaluate<any>(`(() => {
  const b = [...document.querySelectorAll('.menu button[data-a]')].find(x => x.getAttribute('data-a') === ${JSON.stringify(id)});
  if (!b) return false; b.click(); return true;
})()`) as Promise<boolean>;
// a) das „…" der Bibliothek
await zu(r.s);
await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(r.ordner))})?.click()`);
await r.s.waitForTimeout(250);
await menueWahl(r.s, 'umbenennen');
await r.s.waitForTimeout(500);
// b) der Ablagebaum
await zurBibliothek(r.s);
const rk7 = await rechtsklick(r.s, `.ru-baum-zeile[data-baum-id="${r.seite}"]`);
await menueWahl(r.s, 'umbenennen');
await r.s.waitForTimeout(500);
// c) das Seitenmenü
await r.s.evaluate<any>(`App.seitenMenue(document.getElementById('btn-page-menu') || document.body, Store.getBlock('${r.pdf}'))`);
await r.s.waitForTimeout(250);
await menueWahl(r.s, 'rename');
await r.s.waitForTimeout(500);
// d) das ⋯ der Notizhefte (das Heft liegt im Fach)
await zuNotizheften(r.s, r.fach);
await r.s.evaluate<any>(`document.querySelector('[data-mehr="${r.heft}"]')?.click()`);
await r.s.waitForTimeout(250);
await menueWahl(r.s, 'umbenennen');
await r.s.waitForTimeout(500);
const spur7 = await r.s.evaluate<any>(`window.__tun597 || []`) as string[];
const umben = spur7.filter(x => x.startsWith('umbenennen@'));
p('Umbenennen aus „…", Ablagebaum, Seitenmenü und Notizheften — 4 von 4 durch Register.aktionen.tun',
  umben.length === 4, JSON.stringify(spur7) + ' · Baum-Rechtsklick ' + JSON.stringify(rk7));
const namen7 = await r.s.evaluate<any>(`['${r.ordner}','${r.seite}','${r.pdf}','${r.heft}'].map(i => Store.getBlock(i)?.text)`) as string[];
p('… und alle vier Namen sind wirklich neu', namen7.every(x => /^Neu \d$/.test(x || '')), JSON.stringify(namen7));
// Papierkorb: Bibliothek, Seitenmenü, Notizhefte
await r.s.evaluate<any>(`window.__tun597 = []`);
const opfer = await r.s.evaluate<any>(`(() => [Store.addPage(null, { text: 'Weg A' }).id, Store.addPage(null, { text: 'Weg B' }).id])()`) as string[];
await zurBibliothek(r.s);
await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(opfer[0]!))})?.click()`);
await r.s.waitForTimeout(250);
await menueWahl(r.s, 'papierkorb');
await r.s.waitForTimeout(300);
await r.s.evaluate<any>(`App.seitenMenue(document.getElementById('btn-page-menu') || document.body, Store.getBlock('${opfer[1]}'))`);
await r.s.waitForTimeout(250);
await menueWahl(r.s, 'del');
await r.s.waitForTimeout(300);
const heft2 = await r.s.evaluate<any>(`(() => { const h = Store.addPage('${r.fach}', { text: 'Weg C' }); Store.addBlock(h.id, 'blatt', { papier: 'blanko' }); return h.id; })()`) as string;
await zuNotizheften(r.s, r.fach);
await r.s.evaluate<any>(`document.querySelector('[data-mehr="${heft2}"]')?.click()`);
await r.s.waitForTimeout(250);
await menueWahl(r.s, 'papierkorb');
await r.s.waitForTimeout(300);
const spur7b = await r.s.evaluate<any>(`window.__tun597 || []`) as string[];
const korb7 = await r.s.evaluate<any>(`[${JSON.stringify(opfer[0])}, ${JSON.stringify(opfer[1])}, ${JSON.stringify(heft2)}].map(i => { const b = Store.getBlock(i); return !!b && b.alive === false && !!b.trashedAt; })`) as boolean[];
p('Papierkorb aus „…", Seitenmenü und Notizheften — 3 von 3 durch Register.aktionen.tun',
  spur7b.filter(x => x.startsWith('papierkorb@')).length === 3, JSON.stringify(spur7b));
gleich('… und alle drei liegen mit Frist im Papierkorb', korb7, [true, true, true]);
await r.s.evaluate<any>(`Store.setMeta('heft:fach', ''); UI.frage = window.__frage597`);
await zurBibliothek(r.s);
const f7 = await r.s.evaluate<any>(`(() => {
  const R = window.Register && window.Register.aktionen;
  if (!R) return null;
  return R.fuer(Store.getBlock('${r.ordner}'), { kontext: 'bibliothek', art: 'ordner' }).map(a => a.id);
})()`) as string[] | null;
await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(r.ordner))})?.click()`);
await r.s.waitForTimeout(250);
const ids7 = await menueIds(r.s);
p('Register.aktionen.fuer(Ordner) ist die Liste der Karte — nichts mehr, nichts weniger',
  !!f7 && JSON.stringify(f7) === JSON.stringify(ids7), JSON.stringify({ f7, ids7 }));
await zu(r.s);

console.log('\n§8 · Was gilt, steht da — und nur das');
const rk8 = await rechtsklick(r.s, kartenSel(r.pdf));
const ids8pdf = await menueIds(r.s);
p('PDF: Menü da, aber kein „Blick hinein"', rk8.menue && !ids8pdf.includes('blick') && ids8pdf.includes('oeffnen'), JSON.stringify(ids8pdf));
await rechtsklick(r.s, kartenSel(r.ordner));
const ids8ordner = await menueIds(r.s);
p('Ordner: „Öffnen" (hinein), „Als Seite bearbeiten" und „Blick hinein"',
  ['hinein', 'als-seite', 'blick'].every(x => ids8ordner.includes(x)), JSON.stringify(ids8ordner));
await zu(r.s);
await zuNotizheften(r.s, r.fach);
const rk8h = await rechtsklick(r.s, `.bib-deckel[data-id="${r.heft}"], .nh-zeile-auf[data-id="${r.heft}"]`);
const ids8heft = await menueIds(r.s);
p('Heft: Rechtsklick → „In Fach verschieben" und „Farbe"', rk8h.verhindert && ids8heft.includes('fach') && ids8heft.includes('farbe'), JSON.stringify(ids8heft));
await zuNotizheften(r.s);
const rk8f = await rechtsklick(r.s, `.nh-fach [data-fach="${r.fach}"]`);
const ids8fach = await menueIds(r.s);
p('Fach: Rechtsklick → „Blick hinein", aber kein „In Fach verschieben"', rk8f.verhindert && ids8fach.includes('blick') && !ids8fach.includes('fach'), JSON.stringify(ids8fach));
await zu(r.s);

console.log('\n§9 · Rot heisst Gefahr — am Rechner, hell');
const rotPruefen = async (s: Page, wo: string): Promise<void> => {
  const g = await gefahrFarbe(s);
  p(`${wo}: ${g.ist.length} Gefahr-Eintrag/Einträge in genau --gefahr (${g.soll})`,
    g.ist.length >= 1 && g.ist.every(c => c === g.soll), JSON.stringify(g));
};
await zurBibliothek(r.s);
await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(r.ordner))})?.click()`);
await r.s.waitForTimeout(250);
await rotPruefen(r.s, 'Bibliothek, Rechner hell');
await zu(r.s);
await zuNotizheften(r.s, r.fach);
await r.s.evaluate<any>(`document.querySelector('[data-mehr="${r.heft}"]')?.click()`);
await r.s.waitForTimeout(250);
await rotPruefen(r.s, 'Notizhefte, Rechner hell');
await zu(r.s);
await r.s.evaluate<any>(`App.seitenMenue(document.getElementById('btn-page-menu') || document.body, Store.getBlock('${r.seite}'))`);
await r.s.waitForTimeout(250);
await rotPruefen(r.s, 'Seitenmenü, Rechner hell');
await zu(r.s);

console.log('\n§10 · Entf auf einer fokussierten Karte und einer Baumzeile');
const entfOpfer = await r.s.evaluate<any>(`[Store.addPage(null, { text: 'Entf A' }).id, Store.addPage(null, { text: 'Entf B' }).id]`) as string[];
await zurBibliothek(r.s);
await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(kartenSel(entfOpfer[0]!))})?.focus()`);
await r.s.keyboard.press('Delete');
await r.s.waitForTimeout(400);
const t10a = await r.s.evaluate<any>(`(() => { const b = Store.getBlock('${entfOpfer[0]}');
  const t = document.querySelector('#toast'); const k = t?.querySelector('.toast-aktion');
  return { alive: b?.alive, frist: !!b?.trashedAt, meldung: (t?.textContent || '').slice(0, 80), rueck: k ? (k.textContent || '').trim() : null }; })()`);
p('Entf auf der Karte → Papierkorb mit Frist', t10a.alive === false && t10a.frist, JSON.stringify(t10a));
p('… und eine Meldung mit „Rückgängig"', t10a.rueck === 'Rückgängig', JSON.stringify(t10a));
await zurBibliothek(r.s);
await r.s.evaluate<any>(`document.querySelector('.ru-baum-zeile[data-baum-id="${entfOpfer[1]}"]')?.focus()`);
await r.s.keyboard.press('Delete');
await r.s.waitForTimeout(400);
const t10b = await r.s.evaluate<any>(`(() => { const b = Store.getBlock('${entfOpfer[1]}'); return { alive: b?.alive, frist: !!b?.trashedAt }; })()`);
p('Entf auf der Zeile des Ablagebaums → Papierkorb mit Frist', t10b.alive === false && t10b.frist, JSON.stringify(t10b));
p('Entf in einem Eingabefeld legt nichts weg (ein Feld ist kein Ding)', await (async () => {
  const vor = await r.s.evaluate<any>(`Store.trashed().length`) as number;
  await r.s.evaluate<any>(`(() => { const i = document.createElement('input'); i.id = 'probe597'; i.value = 'abc';
    (document.querySelector('.bib-gitter') || document.body).appendChild(i); i.focus(); })()`);
  await r.s.keyboard.press('Delete');
  await r.s.waitForTimeout(250);
  const nach = await r.s.evaluate<any>(`Store.trashed().length`) as number;
  await r.s.evaluate<any>(`document.getElementById('probe597')?.remove()`);
  return vor === nach;
})());

console.log('\n§11 · Ablagebaum: Rechtsklick und Tastatur');
await zurBibliothek(r.s);
const rk11 = await rechtsklick(r.s, `.ru-baum-zeile[data-baum-id="${r.ordner}"]`);
const ids11 = await menueIds(r.s);
await zu(r.s);
await r.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(r.ordner))})?.click()`);
await r.s.waitForTimeout(250);
const ids11karte = await menueIds(r.s);
await zu(r.s);
p('Rechtsklick auf die Baumzeile verhindert das Browsermenü und öffnet ein Menü', rk11.verhindert && rk11.menue, JSON.stringify(rk11));
gleich('… mit denselben Einträgen wie das „…" der Karte', ids11, ids11karte);
await r.s.evaluate<any>(`document.querySelector('.ru-baum-zeile[data-baum-id="${r.ordner}"]')?.focus()`);
await r.s.keyboard.press('Shift+F10');
await r.s.waitForTimeout(250);
const t11 = await r.s.evaluate<any>(`({ menue: document.querySelector('.menu')?.getAttribute('role') || null,
  drin: !!document.querySelector('.menu')?.contains(document.activeElement),
  haspopup: document.querySelector('.ru-baum-zeile[data-baum-id="${r.ordner}"]')?.getAttribute('aria-haspopup') })`);
p('Umschalt+F10 auf der Zeile → role=menu, Fokus im Menü', t11.menue === 'menu' && t11.drin, JSON.stringify(t11));
p('Die Zeile sagt, dass sie ein Menü hat (aria-haspopup=menu)', t11.haspopup === 'menu', JSON.stringify(t11));
await r.s.keyboard.press('Escape');
await r.s.waitForTimeout(200);
const t11esc = await r.s.evaluate<any>(`document.activeElement?.getAttribute('data-baum-id') || document.activeElement?.className || ''`);
gleich('Escape gibt den Fokus an die Baumzeile zurück', t11esc, r.ordner);
await r.s.evaluate<any>(`document.querySelector('.ru-baum-zeile[data-baum-id="${r.ordner}"]')?.focus()`);
await r.s.keyboard.press('ContextMenu');
await r.s.waitForTimeout(250);
p('Die Kontextmenü-Taste auf der Zeile öffnet es auch', await r.s.evaluate<any>(`document.querySelector('.menu')?.getAttribute('role') === 'menu'`));
await zu(r.s);

console.log('\n§12 · Seitenleiste: Rechtsklick → Seitenmenü, das ⋯ hat einen Namen');
/* Am Rechner steht der Seitenbaum in der Lade der Kante („Seiten"), nicht
   in einer festen Leiste — dort wird er geöffnet. */
await r.s.evaluate<any>(`document.querySelector('#kante .k-knopf[data-k="seiten"]')?.click()`);
await r.s.waitForTimeout(500);
/* „Notizen" heisst seit §7 anders — gesucht wird der Name, den es JETZT hat. */
const name12 = await r.s.evaluate<any>(`Store.getBlock('${r.seite}').text`) as string;
const zeile12 = await r.s.evaluate<any>(`(() => {
  const z = [...document.querySelectorAll('#tree .row')].find(x => (x.querySelector('.nm')?.textContent || '') === ${JSON.stringify(name12)});
  if (!z) return null;
  z.setAttribute('data-probe597', '1');
  const mehr = [...z.querySelectorAll('.act button')].find(b => (b.textContent || '').trim() === '⋯');
  return { name: mehr?.getAttribute('aria-label') || '', titel: mehr?.getAttribute('title') || '' };
})()`);
p(`Das ⋯ der Zeile heisst „Aktionen für „${name12}““`, !!zeile12 && zeile12.name === 'Aktionen für „' + name12 + '“', JSON.stringify(zeile12));
const rk12 = await rechtsklick(r.s, '#tree .row[data-probe597]');
const t12 = await r.s.evaluate<any>(`({ suche: !!document.querySelector('.menu .menu-suche input'), rename: !!document.querySelector('.menu [data-a="rename"]') })`);
p('Rechtsklick auf die Zeile → das Seitenmenü (mit Suche und „Umbenennen")', rk12.verhindert && t12.suche && t12.rename, JSON.stringify({ rk12, t12 }));
await zu(r.s);

console.log('\n§14 · UI.wahl — die eine Auswahlliste');
await r.s.evaluate<any>(`(() => {
  const a = document.createElement('button'); a.id = 'anker597'; a.textContent = 'Form'; a.style.cssText = 'position:fixed;left:300px;top:200px;z-index:9';
  document.body.appendChild(a); a.focus();
  window.__wahl597 = null;
  UI.wahl({ anker: a, titel: 'Form wählen', gruppen: [{ name: 'Form', optionen: [
    { id: 'deckel', name: 'Deckel', zeichen: 'grid', aktiv: true },
    { id: 'regal', name: 'Regal <b>x</b>', zeichen: 'book' },
    { id: 'liste', name: 'Tabelle' }] }], beiWahl: id => { window.__wahl597 = id; } });
})()`).catch(() => {});
await r.s.waitForTimeout(250);
const t14 = await r.s.evaluate<any>(`(() => {
  const m = document.querySelector('.menu');
  const a = document.getElementById('anker597');
  const aktiv = m?.querySelector('[aria-current="true"]');
  return { menue: m?.getAttribute('role') || null, offen: a?.getAttribute('aria-expanded'),
    aktiv: aktiv ? (aktiv.textContent || '').trim() : null, haken: !!aktiv && /✓/.test(aktiv.textContent || ''),
    fokus: !!m && m.contains(document.activeElement), fett: !!m?.querySelector('b'),
    text: [...(m?.querySelectorAll('[role="menuitemradio"]') || [])].map(x => (x.textContent || '').replace('✓', '').trim()) };
})()`);
p('UI.wahl öffnet ein Menü (role=menu), der Anker sagt aria-expanded=true', t14.menue === 'menu' && t14.offen === 'true', JSON.stringify(t14));
p('Der gewählte Eintrag trägt ✓ und aria-current', t14.haken && /Deckel/.test(t14.aktiv || ''), JSON.stringify(t14));
p('Der Fokus steht im Menü', t14.fokus, JSON.stringify(t14));
p('„<b>x</b>" bleibt Text', !t14.fett && (t14.text || []).includes('Regal <b>x</b>'), JSON.stringify(t14.text));
await r.s.keyboard.press('ArrowDown');
await r.s.keyboard.press('Enter');
await r.s.waitForTimeout(250);
const t14b = await r.s.evaluate<any>(`({ wahl: window.__wahl597, offen: document.getElementById('anker597')?.getAttribute('aria-expanded'),
  menue: !!document.querySelector('.menu'), fokus: document.activeElement?.id || '' })`);
p('Pfeil ab, Enter → „regal" gewählt, Menü zu, aria-expanded=false, Fokus am Anker',
  t14b.wahl === 'regal' && t14b.offen === 'false' && !t14b.menue && t14b.fokus === 'anker597', JSON.stringify(t14b));
await r.s.evaluate<any>(`UI.wahl({ anker: document.getElementById('anker597'), titel: 'x', gruppen: [{ name: '', optionen: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B', aktiv: true }] }], beiWahl: () => {} })`).catch(() => {});
await r.s.waitForTimeout(200);
const t14fokus = await r.s.evaluate<any>(`(document.activeElement?.textContent || '').trim()`);
p('Ohne erste Wahl steht der Fokus auf dem gewählten Eintrag', /B/.test(t14fokus), t14fokus);
await r.s.keyboard.press('Escape');
await r.s.waitForTimeout(150);
gleich('Escape gibt den Fokus an den Anker zurück', await r.s.evaluate<any>(`document.activeElement?.id || ''`), 'anker597');
await r.k.close();

/* ══ §9 dunkel am Rechner ═════════════════════════════════════════════════ */
const rd = await aufmachen({ dunkel: true });
await zurBibliothek(rd.s);
console.log('\n§9 · Rot heisst Gefahr — am Rechner, dunkel');
await rd.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(rd.ordner))})?.click()`);
await rd.s.waitForTimeout(250);
await rotPruefen(rd.s, 'Bibliothek, Rechner dunkel');
await zu(rd.s);
await rd.s.evaluate<any>(`App.seitenMenue(document.getElementById('btn-page-menu') || document.body, Store.getBlock('${rd.seite}'))`);
await rd.s.waitForTimeout(250);
await rotPruefen(rd.s, 'Seitenmenü, Rechner dunkel');
await rd.k.close();

/* ══ §1, §4, §9, §13 am Telefon ═══════════════════════════════════════════ */
const h = await aufmachen({ handy: true, dunkel: true });
await zurBibliothek(h.s);
console.log('\n§1 · Das „…" am Telefon (390 × 844)');
const d1h = await deckelPruefen(h.s);
p(`Jeder der ${d1h.zahl} Deckel hat ein benanntes „…" ≥ 44 × 44 oben rechts`, d1h.zahl >= 4 && d1h.fehlt.length === 0, d1h.fehlt.slice(0, 4).join(' | '));

console.log('\n§4 · Lang drücken öffnet das Menü — und keine Seite');
const vorher4 = await h.s.evaluate<any>(`App.aktuelleSeite()`);
await h.s.evaluate<any>(`document.querySelectorAll('.menu,.menu-grund').forEach(m => m.remove())`);
await halten(h, kartenSel(h.seite));
const t4 = await h.s.evaluate<any>(`({ menue: !!document.querySelector('.menu'), blatt: !!document.querySelector('.menu.blatt'),
  seite: App.aktuelleSeite(), bib: !!document.querySelector('.bib-gitter'),
  ids: [...document.querySelectorAll('.menu button[data-a]')].map(b => b.getAttribute('data-a')) })`);
p('Nach 650 ms Drücken und Loslassen steht das Menü (als Blatt)', t4.menue && t4.blatt, JSON.stringify(t4));
p('… mit „In den Papierkorb"', (t4.ids || []).includes('papierkorb'), JSON.stringify(t4.ids));
p('… und es ist KEINE Seite aufgegangen', t4.seite === vorher4 && t4.bib, JSON.stringify({ vorher4, t4 }));
console.log('\n§9 · Rot heisst Gefahr — am Telefon');
await rotPruefen(h.s, 'Bibliothek, Telefon dunkel');
await zu(h.s);
await halten(h, kartenSel(h.seite), 120);
const t4kurz = await h.s.evaluate<any>(`({ menue: !!document.querySelector('.menu') })`);
p('Ein kurzes Tippen öffnet kein Menü', !t4kurz.menue, JSON.stringify(t4kurz));
await zu(h.s);

console.log('\n§13 · Notizhefte am Telefon: lang drücken, ohne Bewegung loslassen → das Menü');
await zuNotizheften(h.s);
const heftSel = `.nh-karte:not(.nh-fach) .bib-deckel[data-id="${h.heft}"]`;
const fachDa = await h.s.evaluate<any>(`!!document.querySelector('.nh-fach [data-fach="${h.fach}"]')`);
if (fachDa) {
  await halten(h, `.nh-fach [data-fach="${h.fach}"]`);
  const t13 = await h.s.evaluate<any>(`({ ids: [...document.querySelectorAll('.menu button[data-a]')].map(b => b.getAttribute('data-a')), fach: localStorage.getItem('x') })`);
  p('Fach: lang drücken → sein Menü (mit „Blick hinein" und „In den Papierkorb")',
    t13.ids.includes('blick') && t13.ids.includes('papierkorb'), JSON.stringify(t13));
  await rotPruefen(h.s, 'Notizhefte, Telefon dunkel');
  await zu(h.s);
} else p('Das Fach steht im Regal', false);
await h.s.evaluate<any>(`Store.setMeta('heft:fach', '${h.fach}'); Notebook.oeffnen()`);
await h.s.waitForTimeout(500);
const heftDa = await h.s.evaluate<any>(`!!document.querySelector(${JSON.stringify(heftSel)})`);
if (heftDa) {
  await halten(h, heftSel);
  const t13h = await h.s.evaluate<any>(`({ ids: [...document.querySelectorAll('.menu button[data-a]')].map(b => b.getAttribute('data-a')),
    offen: document.querySelector('.nh-blatt, .studio') ? true : false })`);
  p('Heft: lang drücken → sein Menü (mit „In Fach verschieben")', t13h.ids.includes('fach'), JSON.stringify(t13h));
  await zu(h.s);
} else p('Das Heft steht im Fach', false);
await h.s.evaluate<any>(`Store.setMeta('heft:fach', '')`);
await h.k.close();

/* ══ §9 alle zehn Schemata ═════════════════════════════════════════════ */
const sk = await aufmachen();
await zurBibliothek(sk.s);
console.log('\n§9 · Rot heisst Gefahr — in allen zehn Schemata (auch Touch Kit und Starker Kontrast)');
const schemata = await sk.s.evaluate<any>(`(Aussehen.SCHEMATA || []).map(x => x.id)`) as string[];
const proSchema: Record<string, string> = {};
for (const sch of schemata) {
  await sk.s.evaluate<any>(`Aussehen.setzen({ schema: ${JSON.stringify(sch)}, akzent: '' })`);
  await sk.s.waitForTimeout(80);
  await zu(sk.s);
  await sk.s.evaluate<any>(`document.querySelector(${JSON.stringify(mehrSel(sk.ordner))})?.click()`);
  await sk.s.waitForTimeout(200);
  const g = await sk.s.evaluate<any>(`(() => {
    /* \`color(srgb r g b / a)\` (aus color-mix) trägt Anteile 0–1, \`rgb()\` 0–255. */
    const hell = c => { const teil = /^color\\(srgb/.test(c); const [r, g, b] = (c.match(/\\d*\\.?\\d+/g) || []).map(Number).map(v => { const x = teil ? v : v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const probe = document.createElement('span'); probe.style.color = 'var(--gefahr)'; document.body.appendChild(probe);
    const soll = getComputedStyle(probe).color; probe.remove();
    const b = document.querySelector('.menu [data-gefahr]');
    if (!b) return { soll, ist: null, kontrast: 0 };
    const ist = getComputedStyle(b).color;
    /* Der Grund des Menüs, so wie er gemalt ist: die erste deckende Fläche darunter. */
    let el = b, grund = '';
    while (el) { const c = getComputedStyle(el).backgroundColor; const a = c.match(/[\\d.]+/g) || [];
      if (c && c !== 'transparent' && (a.length < 4 || Number(a[3]) >= 0.85)) { grund = c; break; } el = el.parentElement; }
    const x = hell(ist), y = hell(grund || 'rgb(255,255,255)');
    return { soll, ist, grund, kontrast: Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100 };
  })()`) as { soll: string; ist: string | null; grund?: string; kontrast: number };
  proSchema[sch] = (g.ist === g.soll ? '' : 'FALSCH ') + g.kontrast;
  p(`${sch}: der Papierkorb steht in --gefahr (${g.soll}), Kontrast ${g.kontrast} : 1 auf ${g.grund}`,
    !!g.ist && g.ist === g.soll && g.kontrast >= 4.5, JSON.stringify(g));
}
p('Es waren zehn Schemata', schemata.length === 10, JSON.stringify(schemata));
console.log('   Kontrast je Schema:', JSON.stringify(proSchema));
await sk.k.close();

await browser.close();
server.close();

gleich('Keine Ausnahme auf der Seite', fehler, []);
console.log(`\n  Suite 597 — Ein Menü je Ding: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
