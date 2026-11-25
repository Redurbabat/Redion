/* Suite 656 — Ein Knoten der Gedankenkarte bricht nicht mitten im Wort (E818)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Eine neue Gedankenkarte mit dem Thema „Zentrales
 * Thema" zeigte den Mittelknoten 48 px breit und vierzeilig: „Zentr / ales /
 * Them / a". Gesehen am 25. November 2026 im BILD des Startfensters, nicht
 * in einem Lauf (§55.1).
 *
 * Der Grund: `.gk-kn` ist absolut gesetzt in `.gk-welt`, und `.gk-welt` ist
 * selbst absolut und hat nur absolut gesetzte Kinder — sie ist 0 px breit.
 * Ein absolut gesetztes Element ohne Breite schrumpft auf
 * min(max(kleinste Breite, verfügbare Breite), grösste Breite); verfügbar
 * sind 0 px, also gilt die kleinste Breite, und `overflow-wrap:anywhere`
 * macht die kleinste Breite zu wenigen Buchstaben. Auf der Fläche stand die
 * Antwort schon (`seitenansichten.css`: `.gk-auf-flaeche .gk-kn
 * {width:max-content}`); in der Seite fehlte sie.
 *
 *   §1 KURZES THEMA, EINE ZEILE. „Zentrales Thema" (Wurzel) und
 *      „Unterthema mit Text" (Kind) stehen je in einer Zeile, und der Text
 *      ist so breit wie gemessen ohne Umbruch.
 *   §2 LANGES THEMA BLEIBT IN DER DECKE. Ein Thema aus 90 Zeichen wird nicht
 *      breiter als `max-width` (260 px Wurzel, 230 px Kind) und bricht an
 *      Wortgrenzen: keine Zeile beginnt mitten in einem Wort.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja: gegen den Stand ohne `width:max-content` an `.gk-kn` ist §1 rot (die
 * Wurzel misst 48 px und vier Zeilen). §2 hält die Gegenseite: eine
 * Reparatur mit `white-space:nowrap` würde die Decke sprengen.
 *
 * Er lädt über file://, damit `test400` keinen neuen Port zählt.
 *
 *   node pruefungen/lauf/test656.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* Redions Dienste sind Konstanten klassischer Skripte, keine Felder von
   `globalThis` — im Browser direkt mit Namen ansprechen. */
declare const Store: any, App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const LANG = 'Ein sehr langes Thema mit vielen Wörtern, damit der Knoten an seine Decke stösst und umbricht';

const browser = await chromium.launch();
try {
  const seite = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const fehler: string[] = [];
  seite.on('pageerror', e => fehler.push(e.message));
  await seite.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
  await seite.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache
    && typeof App !== 'undefined', null, { timeout: 30000 });
  await seite.waitForTimeout(800);


  const messen = () => seite.evaluate(() => [...document.querySelectorAll<HTMLElement>('.gk-kn')].map(kn => {
    const t = kn.querySelector<HTMLElement>('.gk-txt')!;
    const r = t.getBoundingClientRect();
    const zeile = parseFloat(getComputedStyle(t).lineHeight) || 20;
    /* Breite des Texts in EINER Zeile, gemessen an einem Zwilling. */
    const z = t.cloneNode(true) as HTMLElement;
    z.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;width:auto';
    kn.appendChild(z); const voll = z.getBoundingClientRect().width; z.remove();
    /* Wo beginnt jede gezeichnete Zeile? Über Zeichenrechtecke. */
    const text = t.textContent || '';
    const anfang: number[] = []; let letzteOben = -1;
    const node = t.firstChild;
    if (node && node.nodeType === 3) for (let i = 0; i < text.length; i++) {
      const rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1);
      const o = Math.round(rg.getBoundingClientRect().top);
      if (o > letzteOben + 2) { anfang.push(i); letzteOben = o; }
    }
    const mittenImWort = anfang.slice(1).filter(i => /\S/.test(text[i - 1] ?? ' ') && /\S/.test(text[i] ?? ' '));
    return { text, breite: Math.round(kn.getBoundingClientRect().width), zeilen: Math.round(r.height / zeile),
      txtBreite: r.width, voll, wurzel: kn.classList.contains('gk-wurzel'),
      decke: parseFloat(getComputedStyle(kn).maxWidth), mittenImWort: mittenImWort.length };
  }));

  console.log('\n§0 Eine frisch angelegte Karte (wie „/mindmap" und das Startfenster)');
  await seite.evaluate(() => {
    document.querySelectorAll('[role=dialog],.overlay').forEach(e => e.remove());
    document.querySelectorAll('[inert]').forEach(e => e.removeAttribute('inert'));
    const s = App.neueSeite();
    setTimeout(() => { Store.addBlock(s.id, 'mindmap', { text: 'Zentrales Thema' }); App.zeichneSeite(); }, 80);
  });
  await seite.waitForTimeout(1200);
  const frisch = (await messen()).find(m => m.wurzel);
  p('frische Wurzel gezeichnet', !!frisch);
  if (frisch) {
    p(`„${frisch.text}" steht in einer Zeile`, frisch.zeilen === 1, `${frisch.zeilen} Zeilen, ${frisch.breite} px breit`);
    p('und bricht nicht mitten im Wort', frisch.mittenImWort === 0, `${frisch.mittenImWort} Brüche`);
  }

  /* Eine Seite mit einer Gedankenkarte: Wurzel, ein kurzes und ein langes Kind. */
  await seite.evaluate((lang) => {
    document.querySelectorAll('[role=dialog],.overlay').forEach(e => e.remove());
    document.querySelectorAll('[inert]').forEach(e => e.removeAttribute('inert'));
    const s = App.neueSeite();
    /* Das Feld heisst `karte` (gedankenkarte.ts, `leseKarte`); ohne
       `sicht` passt die Fläche die Karte ein — wie bei einer neuen. */
    Store.addBlock(s.id, 'mindmap', { text: '', karte: {
      knoten: [{ id: 'w', text: 'Zentrales Thema', eltern: null },
               { id: 'k656a', text: 'Unterthema mit Text', eltern: 'w' },
               { id: 'k656b', text: lang, eltern: 'w' }],
      verbindungen: [], aufbau: 'karte' } });
    App.zeichneSeite();
  }, LANG);
  await seite.waitForTimeout(900);
  const mass = await messen();

  console.log('\n§1 Kurzes Thema in einer Zeile');
  const kurz = mass.filter(m => m.text === 'Zentrales Thema' || m.text === 'Unterthema mit Text');
  p('zwei kurze Knoten gezeichnet', kurz.length === 2, JSON.stringify(mass.map(m => m.text.slice(0, 20))));
  for (const m of kurz) {
    p(`„${m.text}" steht in einer Zeile`, m.zeilen === 1, `${m.zeilen} Zeilen, ${m.breite} px breit`);
    p(`„${m.text}" ist so breit wie sein Text`, m.txtBreite >= m.voll - 1, `${m.txtBreite.toFixed(1)} gegen ${m.voll.toFixed(1)}`);
  }

  console.log('\n§2 Langes Thema bleibt in der Decke');
  const lang = mass.find(m => m.text === LANG);
  p('langer Knoten gezeichnet', !!lang);
  if (lang) {
    p('nicht breiter als max-width', lang.breite <= lang.decke + 0.5, `${lang.breite} gegen ${lang.decke}`);
    p('bricht um (mehr als eine Zeile)', lang.zeilen > 1, `${lang.zeilen} Zeilen`);
    p('keine Zeile beginnt mitten im Wort', lang.mittenImWort === 0, `${lang.mittenImWort} Brüche`);
  }
  p('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
} finally {
  await browser.close();
}
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
