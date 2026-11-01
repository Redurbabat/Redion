/* Suite 632 — Die Schaltplanfläche aus Redurs ZIP: Palette zu, ein Menü,
 *             Kürzel, Ziehen aus Palette und Studio, Kontextleiste,
 *             Schnellkarte, Elektro Studio (E770)
 * ============================================================================
 * Redur am 1. November 2026, Fragebogen „1:1 übernehmen": „Alle Funktionen
 * 1:1, sauber gebaut". Das ersetzt seine früheren Antworten „Palette offen
 * lassen" und „keine Schnellkarte" (E770).
 *
 *   §1 Die Palette ist beim Öffnen ZU; „▦ Bauteile", `B` und `/` öffnen sie.
 *   §2 Ein Menü „✦ Bereiche ▾" statt „🔋 Batterien" und „📐".
 *   §3 `1`–`5` wählen die Werkzeuge; die Kürzel stehen in Register.tasten.
 *   §4 Ein Bauteil aus der Palette auf den Plan ziehen: genau EIN neues Teil,
 *      genau EIN Schritt im Verlauf; Escape bricht ab, nichts entsteht.
 *   §5 Die Kontextleiste über der Auswahl dreht und löscht — und fängt
 *      danach keinen Zug auf der Fläche ab (der Fund aus test625 §4b).
 *   §6 Die Schnellkarte ändert die Beschriftung über `aendere`.
 *   §7 Das Elektro Studio (Alt+Umschalt+E) ersetzt die Palette und setzt ein.
 *   §8 Sauber: kein „BABAT", kein `!important`, kein `window.confirm`.
 *
 * Gegen den Stand vor E770 (a6472d3f7) rot: dort ist die Palette offen,
 * es gibt kein „Bereiche" und keinen Ziehweg.
 *
 *   node pruefungen/lauf/test632.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Register: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

/* ══ §8 zuerst: ohne Browser ═══════════════════════════════════════════════ */
console.log('\n§8 Sauber gebaut');
const quelle = fs.readFileSync(path.join(WURZEL, 'src/bereiche/bloecke/arten/planflaeche.ts'), 'utf8');
const stil = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/schaltatelier.css'), 'utf8');
const pruef = fs.readFileSync(path.join(WURZEL, 'src/bereiche/bloecke/arten/schaltplan-pruefung.ts'), 'utf8');
p('Kein „BABAT" in Planfläche, Prüfkern und Stilblatt (§1)', !/babat/i.test(quelle + stil + pruef));
gleich('Kein `!important` im Stilblatt (ohne Kommentare gezählt)', (stil.replace(/\/\*[\s\S]*?\*\//g, '').match(/!important/g) || []).length, 0);
p('Kein `window.confirm` und kein `@ts-nocheck`', !/window\.confirm|@ts-nocheck/.test(quelle + pruef));
p('Keine englischen Zustandswörter am Schalter (§3)', !/STANDBY|POWER ON/.test(quelle));

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 } });
const s = await ktx.newPage();
s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
s.on('dialog', d => { fehler.push('DIALOG ' + d.message().slice(0, 60)); d.dismiss().catch(() => {}); });
await s.goto(INDEX);
await s.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
const blockId = await s.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
  Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
  const sp = Store.addPage(null, { text: 'Plan 632', icon: '⚡' });
  const b = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
    teile: [{ id: 'k1', zeichen: 'spule', x: 200, y: 200, drehung: 0, bmk: 'K1', nummern: {} }],
    leitungen: [], texte: [], ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] } });
  await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  return b.id as string;
});
const plan = () => s.evaluate((id: string) => JSON.parse(JSON.stringify(Store.getBlock(id).plan)), blockId);
const offen = () => s.evaluate(() => !(document.querySelector('.sp-wrap .sp-palette') as HTMLElement).hidden);
const flaecheFokus = async (): Promise<void> => {
  await s.locator('.sp-wrap').first().evaluate((w: HTMLElement) => w.focus({ preventScroll: true }));
};

/* ══ §1 ════════════════════════════════════════════════════════════════════ */
console.log('\n§1 Die Palette ist zu und geht auf');
gleich('Beim Öffnen ist die Palette zu', await offen(), false);
await s.locator('.sp-wrap [data-a="palette-toggle"]').click();
gleich('„▦ Bauteile" öffnet sie', await offen(), true);
gleich('… und meldet es mit aria-expanded', await s.locator('.sp-wrap [data-a="palette-toggle"]').getAttribute('aria-expanded'), 'true');
await flaecheFokus(); await s.keyboard.press('b');
gleich('`B` schliesst sie wieder', await offen(), false);
await flaecheFokus(); await s.keyboard.press('/');
await s.waitForTimeout(150);
gleich('`/` öffnet sie und setzt den Fokus in die Suche', [await offen(),
  await s.evaluate(() => !!document.activeElement?.closest('.sp-palette') && (document.activeElement as HTMLElement).tagName)], [true, 'INPUT']);

/* ══ §2 ════════════════════════════════════════════════════════════════════ */
console.log('\n§2 Ein Menü „Bereiche"');
gleich('Kein eigener Knopf mehr für Batterien und Formelheft im Kopf',
  await s.locator('.sp-wrap .sp-kopf [data-a="batterie-labor"], .sp-wrap .sp-kopf [data-a="heft"]').count(), 0);
const bereiche = s.locator('.sp-wrap [data-a="bereiche"]');
gleich('„✦ Bereiche ▾" ist ein Menüknopf', [await bereiche.count(), await bereiche.getAttribute('aria-haspopup')], [1, 'menu']);
await bereiche.click();
const eintraege = await s.locator('[data-bereich]').allTextContents();
p('Das Menü trägt Relais, Batterien, Prüfzentrum, Studio und Formelheft',
  ['Relais', 'Batterie', 'Prüfzentrum', 'Studio', 'Formelheft'].every(w => eintraege.some(t => t.includes(w))), eintraege.join(' | '));
await s.locator('[data-bereich="batterien"]').click();
await s.waitForTimeout(200);
gleich('„Batterielabor" öffnet das Batteriefach', await s.evaluate(() =>
  !(document.querySelector('.sp-wrap .sp-batterie-fach:not(.sp-relais-fach)') as HTMLElement).hidden), true);
/* Das Fach schwebt über dem Plan (wie in der ZIP) — wieder zu, damit §4 die Palette trifft. */
await bereiche.click();
await s.locator('[data-bereich="batterien"]').click();
await s.waitForTimeout(200);
gleich('Ein zweites Mal schliesst es', await s.evaluate(() =>
  (document.querySelector('.sp-wrap .sp-batterie-fach:not(.sp-relais-fach)') as HTMLElement).hidden), true);

/* ══ §3 ════════════════════════════════════════════════════════════════════ */
console.log('\n§3 1–5 wählen Werkzeuge');
const gedrueckt = () => s.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.sp-wrap [data-wz][aria-pressed="true"]')].map(b => b.dataset.wz));
await flaecheFokus(); await s.keyboard.press('2');
gleich('`2` ist die Leitung', await gedrueckt(), ['leitung']);
await flaecheFokus(); await s.keyboard.press('4');
gleich('`4` ist die Stromschiene', await gedrueckt(), ['schiene']);
await flaecheFokus(); await s.keyboard.press('1');
gleich('`1` ist wieder Zeigen', await gedrueckt(), ['zeigen']);
const tasten = await s.evaluate(() => JSON.stringify(Register.tasten.alle()));
p('Register.tasten kennt die Schaltplan-Kürzel (§8)',
  ['Schaltplan', 'Bauteilpalette', 'Elektro Studio', 'Prüfzentrum', 'Strom ein'].every(w => tasten.includes(w)));

/* ══ §4 ════════════════════════════════════════════════════════════════════ */
console.log('\n§4 Aus der Palette auf den Plan ziehen');
if (!(await offen())) await s.locator('.sp-wrap [data-a="palette-toggle"]').click();
await s.locator('.sp-wrap .sp-palette input').first().fill('Lampe');
await s.waitForTimeout(200);
const karte = s.locator('.sp-wrap .sp-palette [data-sym="lampe"]').first();
gleich('Die Palette hat eine Karte „Lampe"', await karte.count(), 1);
const ziehe = async (abbrechen: boolean): Promise<void> => {
  await s.evaluate(() => document.querySelector('.sp-wrap .sp-buehne')?.scrollIntoView({ block: 'center' }));
  await s.waitForTimeout(100);
  await karte.scrollIntoViewIfNeeded();
  const k = await karte.boundingBox();
  const b = await s.locator('.sp-wrap .sp-buehne').boundingBox();
  if (!k || !b) return;
  await s.mouse.move(k.x + k.width / 2, k.y + k.height / 2);
  await s.mouse.down();
  const zy = Math.max(b.y, 0) + (Math.min(b.y + b.height, 860) - Math.max(b.y, 0)) * 0.5;
  for (let i = 1; i <= 8; i++) await s.mouse.move(k.x + k.width / 2 + (b.x + b.width * 0.7 - k.x - k.width / 2) * i / 8, k.y + k.height / 2 + (zy - k.y - k.height / 2) * i / 8);
  if (abbrechen) await s.keyboard.press('Escape');
  await s.mouse.up();
  await s.waitForTimeout(250);
};
const vorher = (await plan()).teile.length;
await ziehe(true);
gleich('Escape bricht ab: kein neues Teil', (await plan()).teile.length, vorher);
await ziehe(false);
const nachher = await plan();
gleich('Gezogen: genau EIN neues Teil, eine Lampe', [nachher.teile.length, nachher.teile.at(-1)?.zeichen], [vorher + 1, 'lampe']);
p('… auf dem Raster', nachher.teile.at(-1)?.x % 10 === 0 && nachher.teile.at(-1)?.y % 10 === 0, JSON.stringify(nachher.teile.at(-1)));
gleich('Kein Geist bleibt stehen', await s.locator('.sp-platziergeist').count(), 0);
await s.locator('.sp-wrap [data-a="zurueck"]').click();
gleich('Ein Rückgängig nimmt genau dieses Teil zurück', (await plan()).teile.length, vorher);
/* Wie in der ZIP bleibt das gezogene Zeichen danach gewählt (ein Tipp setzt
   noch eines); `1` legt es weg und steht wieder auf Zeigen. */
await flaecheFokus(); await s.keyboard.press('1');

/* ══ §5 ════════════════════════════════════════════════════════════════════ */
console.log('\n§5 Die Kontextleiste');
await s.locator('.sp-wrap [data-a="palette-toggle"]').click();
await s.evaluate(() => document.querySelector('.sp-wrap')?.scrollIntoView({ block: 'center' }));
const k1 = s.locator('.sp-wrap .sp-buehne g[data-id="k1"]');
const kb = await k1.boundingBox();
if (kb) { await s.mouse.click(kb.x + kb.width / 2, kb.y + kb.height / 2); }
await s.waitForTimeout(250);
gleich('Nach dem Antippen steht die Kontextleiste da', await s.locator('.sp-wrap .sp-kontextleiste:not([hidden]) [data-kontext]').count() >= 5, true);
const dreh0 = (await plan()).teile.find((t: any) => t.id === 'k1')?.drehung ?? 0;
await s.locator('.sp-wrap .sp-kontextleiste [data-kontext="drehen"]').click();
gleich('„↻" dreht um 90°', ((await plan()).teile.find((t: any) => t.id === 'k1')?.drehung ?? 0) - dreh0, 90);
await s.keyboard.press('Escape');
await s.waitForTimeout(150);
/* Der Fund aus test625 §4b: nach einer Auswahl kam ein gezogener Draht nicht
   an. Hier: Leitung wählen, zweimal ziehen, zwei Leitungen. */
await flaecheFokus(); await s.keyboard.press('2');
const bu = (await s.locator('.sp-wrap .sp-buehne').boundingBox())!;
const zieh = async (y: number): Promise<void> => {
  await s.mouse.move(bu.x + 80, bu.y + y); await s.mouse.down();
  for (let i = 1; i <= 6; i++) await s.mouse.move(bu.x + 80 + i * 30, bu.y + y);
  await s.mouse.up(); await s.waitForTimeout(150);
};
const l0 = (await plan()).leitungen.length;
await zieh(60); await zieh(100);
gleich('Zwei gezogene Leitungen kommen beide an', (await plan()).leitungen.length - l0, 2);
await flaecheFokus(); await s.keyboard.press('1');

/* ══ §6 ════════════════════════════════════════════════════════════════════ */
console.log('\n§6 Die Schnellkarte');
await s.evaluate(() => document.querySelector('.sp-wrap')?.scrollIntoView({ block: 'center' }));
const kb2 = await k1.boundingBox();
if (kb2) { await s.mouse.click(kb2.x + kb2.width / 2, kb2.y + kb2.height / 2); }
await s.waitForTimeout(300);
const sk = s.locator('.sp-wrap .sp-schnellkarte:not([hidden])');
gleich('Ein Tipp auf das Bauteil öffnet die Schnellkarte', await sk.count(), 1);
const feld = sk.locator('input[name="beschriftung"], input[data-sk="beschriftung"], input').first();
if (await feld.count()) { await feld.fill('Hauptschütz'); await feld.press('Enter'); await s.waitForTimeout(250); }
gleich('Die Beschriftung steht im Plan', (await plan()).teile.find((t: any) => t.id === 'k1')?.beschriftung, 'Hauptschütz');

/* ══ §7 ════════════════════════════════════════════════════════════════════ */
console.log('\n§7 Das Elektro Studio');
await s.keyboard.press('Escape');
await flaecheFokus(); await s.keyboard.press('Alt+Shift+E');
await s.waitForTimeout(300);
gleich('Alt+Umschalt+E öffnet das Studio, die Palette ist zu', [await s.evaluate(() =>
  !(document.querySelector('.sp-wrap .sp-studio') as HTMLElement).hidden), await offen()], [true, false]);
const studioSym = s.locator('.sp-wrap .sp-studio [data-st-symbol]').first();
if (!(await studioSym.count())) {
  const tab = s.locator('.sp-wrap .sp-studio [data-st-tab="einsetzen"], .sp-wrap .sp-studio button').filter({ hasText: /Einfügen|Einsetzen/ }).first();
  if (await tab.count()) await tab.click();
  await s.waitForTimeout(200);
}
gleich('Das Studio zeigt einsetzbare Zeichen', (await s.locator('.sp-wrap .sp-studio [data-st-symbol]').count()) > 3, true);

gleich('Keine Fehler und kein Browserdialog', fehler, []);
await browser.close();
console.log(`\n${ok} bestanden, ${weg} nicht bestanden`);
process.exit(weg ? 1 : 0);
