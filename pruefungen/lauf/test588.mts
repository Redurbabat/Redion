/* Suite 588 — Die Suche wächst aus der Kapsel, die Meldungen stapeln sich (E711)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat am 27. September um ca. 22:05 ein Video
 * „LIQUID GLASS" geschickt und geschrieben:
 *
 *     „Schau mal das auch an ich will das auch haben"
 *
 * und um ca. 22:10: „… eien komplet besseren webseit sehen ohne eine
 * funktione löschen bessere ordnungen bessere übergagnge besssere efeckten".
 * Zwei Szenen daraus gehören hierher: 07 SEARCH (die Suchkapsel wächst zum
 * Feld, die Treffer kommen nacheinander, die Auswahl GLEITET mit den
 * Pfeiltasten, ein „↵ Enter"-Chip) und 08 MERGE (Meldungen als Stapel, der
 * sich auffächert und wieder zusammenfliesst).
 *
 * DIESER LAUF PRÜFT DIE ZUSAGEN ALS MESSUNGEN, NICHT ALS „SIEHT GUT AUS":
 *
 *   §1 DIE SUCHE WÄCHST AUS DER KAPSEL. Ein Klick auf `#studio-search`
 *      lässt `.finder.such` aus dem Rechteck der Kapsel aufgehen (eine
 *      laufende Web-Animation, die NUR `transform`/`opacity` bewegt) und
 *      steht danach genau an ihrem Ruheort.
 *   §2 DIE TREFFER KOMMEN NACHEINANDER — nur die neuen, mit wachsender
 *      Verzögerung; ein Treffer, der schon dastand, kommt nicht noch einmal.
 *   §3 DIE AUSWAHL GLEITET. EINE Marke (`.ru-marke`) in `#res`; ↓ baut die
 *      Liste NICHT neu (dieselben Knöpfe `[data-i]`), die Marke fährt auf
 *      der Kit-Feder zur neuen Zeile, über mehrere Zwischenorte, und kommt
 *      genau an. Am Rechner trägt sie den Chip „↵ Enter". `#q` bleibt.
 *   §4 DASSELBE IN DER BEFEHLSPALETTE UND IM MENÜ MIT SUCHE (§8: EIN
 *      Helfer, `SelectionFlow.highlight`).
 *   §5 RUHIG: ohne Aufgehen, ohne Staffel, die Marke springt.
 *   §6 DER STAPEL. Drei Meldungen hintereinander → `#toast` sagt die
 *      neueste (die Live-Region bleibt EINE), die zwei davor stehen lesbar
 *      daneben; höchstens drei; eine Wiederholung stapelt nicht; ein
 *      Fortschritt (E116) stapelt sich nicht selbst; Escape räumt ab.
 *   §7 DIE GLOCKE. Ein Klick öffnet WEITER den Posteingang (§43: derselbe
 *      Griff). Beim Zeigen fächern die letzten drei Meldungen auf, mit
 *      „Alle gelesen" (E276: gelesen, nicht leeren) und „Posteingang
 *      öffnen"; „Alle gelesen" lässt alle Meldungen stehen.
 *   §8 DAS ZÄHE ZUSAMMENFLIESSEN. EIN Goo-Filter im Dokument, in Ruhe an
 *      keinem Element, nur während des Zusammenfliessens an EINER Ebene.
 *   §9 DER POSTEINGANG: die Benachrichtigungen als Glaskarten (Quelle als
 *      kleine Marke, Text, Zeit) — ohne eigene Unschärfe je Karte.
 *   §10 AM TELEFON: langes Drücken auf die Glocke fächert auf und öffnet
 *      NICHT zusätzlich den Posteingang; der Stapel steht über der Leiste.
 *   §11 DURCHSICHT (Nachtrag, 4. Oktober): der Fächer geht auch wieder zu —
 *      ein Klick oder Tipp daneben, der Fokus geht hinaus (Tab, Strg P);
 *      nach „Alle gelesen" mit der Tastatur bleibt der Fokus im Kopf, die
 *      Glocke steht, bis die Karten in ihr sind, und sie sagt mit
 *      `aria-expanded`, ob der Fächer offen ist. EIN Escape tut EINES. Die
 *      Schrift auf der Marke (Zeile, Kürzel, Ausschnitt, Stern, „↵ Enter")
 *      hält 4,5 : 1 in allen zehn Schemata, so gemessen, wie sie gemalt wird
 *      (Deckkraft und Tönung mitgerechnet). Am Telefon wischt ein Finger
 *      eine Karte des Stapels weg (das stand zugesagt, geprüft war es
 *      nicht) — aber ein Zug, der unter einer Meldung auf einer Fläche
 *      beginnt, die ihre Finger selbst nimmt (`touch-action:none`: das
 *      Blatt mit dem Stift, die Tafel), kommt dort an und bleibt ein Strich.
 *   §12 VIERTE DURCHSICHT (5. Oktober): die Akzent-Marke bleibt in der Suche
 *      und der Palette. Im Menü mit Suche heisst `.on` „das gilt jetzt"
 *      („Quelle wechseln") — diese Zeile behält ihre Fläche und bleibt
 *      lesbar (≥ 4,5 : 1), hell und dunkel. Ruht der Zeiger auf der Glocke,
 *      geht der Fächer EINMAL auf und bleibt (er flackerte), und er deckt
 *      die Blase der Glocke (E462) nicht halb zu: solange er offen ist,
 *      geht sie.
 *   §13 FÜNFTE DURCHSICHT (5. Oktober): der Fächer deckt die Reihe direkt
 *      unter der Glocke nicht zu („KI", „Favorit" in der Kopfzeile der
 *      Seite). Wer von der Glocke dorthin will, klickt sie; wer in den
 *      Fächer will, kommt über die Reihe hinweg hinein. Eine grosse Fläche
 *      unter der Glocke schiebt ihn nicht weg.
 *   §14 SECHSTE DURCHSICHT (5. Oktober): wer am Telefon unter einer Meldung
 *      LANGE drückt und dann zieht, zieht, was darunter liegt (die Kladde in
 *      der Bibliothek, ein Block, eine Marke im PDF — gehoben wird dort nach
 *      400 bis 500 ms) — der Stapel nimmt ihm den Zug nicht weg, und die
 *      Meldung bleibt stehen. Ein schnelles Schnippen nimmt sie weiter weg.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Gegen den Stand b3cf1933 (vor E711) fällt sie in §1–§10: es gibt weder die
 * Marke noch den Stapel noch den Fächer. Gegenproben stehen im Commit E711.
 * §11 fiel gegen 556ffdaa (E711 vor der Durchsicht) — siehe den Commit
 * „test588 (rot): … Durchsicht". §12 fiel gegen denselben Stand und gegen
 * die Reparatur der Durchsicht — siehe „test588 (rot): Vierte Durchsicht".
 * §13 fiel gegen die Reparatur der vierten Durchsicht — siehe „test588 (rot):
 * Fünfte Durchsicht". §14 fiel gegen deren Endstand (f73a2938) — siehe
 * „test588 (rot): Sechste Durchsicht".
 *
 *   node pruefungen/lauf/test588.mts
 * ==========================================================================*/
import { chromium, type Page, type CDPSession } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

/* `listen(0)` statt einer festen Zahl (L205). */
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

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

type Auf = { pc: Page; cdp: CDPSession; zu: () => Promise<void> };
const aufmachen = async (o: { handy?: boolean; ruhig?: boolean; dunkel?: boolean } = {}): Promise<Auf> => {
  const kontext = await browser.newContext({
    viewport: o.handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: !!o.handy, isMobile: !!o.handy,
    colorScheme: o.dunkel ? 'dark' : 'light'
  });
  const pc = await kontext.newPage();
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 150)));
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pc.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && !!document.querySelector("#page")');
  await pc.waitForTimeout(1600);
  await pc.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    App.theme(${o.dunkel ? "'dark'" : "'light'"});
    document.body.dataset.bewegung = ${o.ruhig ? "'ruhig'" : "''"};
    /* Die Elektro-Seiten ZUERST, danach neun andere: dann stehen sie nicht
       unter „Zuletzt" (acht Seiten), und das Tippen bringt NEUE Zeilen. */
    for (const t of ['Elektrotechnik Skript', 'Elektro Prüfung Notizen', 'Elektrische Felder']) {
      Store.addPage(null, { text: t });
    }
    await new Promise(f => setTimeout(f, 30));
    for (let k = 1; k <= 9; k++) { Store.addPage(null, { text: 'Notiz ' + k }); await new Promise(f => setTimeout(f, 3)); }
    await Store.flush();
    const t = document.getElementById('toast');
    if (t) { t.classList.remove('show'); t.textContent = ''; }
  })()`);
  await pc.waitForTimeout(400);
  const cdp = await kontext.newCDPSession(pc);
  return { pc, cdp, zu: () => kontext.close() };
};

/* Die Oberkante eines Elements Bild für Bild, bis es ruht oder die Zeit um ist. */
const bahn = (pc: Page, wahl: string, ms = 700) => pc.evaluate(`new Promise(fertig => {
  const orte = []; const t0 = performance.now();
  const schritt = () => {
    const e = document.querySelector(${JSON.stringify(wahl)});
    if (e) orte.push(Math.round(e.getBoundingClientRect().top * 10) / 10);
    if (performance.now() - t0 < ${ms}) requestAnimationFrame(schritt); else fertig(orte);
  };
  requestAnimationFrame(schritt);
})`) as Promise<number[]>;

const rechteck = (pc: Page, wahl: string) => pc.evaluate(`(() => {
  const e = document.querySelector(${JSON.stringify(wahl)});
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { l: r.left, t: r.top, b: r.width, h: r.height };
})()`) as Promise<{ l: number; t: number; b: number; h: number } | null>;

/* ==========================================================================
 * §1–§4 · AM RECHNER, HELL
 * ========================================================================*/
{
  const a = await aufmachen({ handy: false });
  const { pc } = a;

  console.log('\n§1 Die Suche wächst aus der Kapsel');
  await pc.click('#studio-search');
  const auf = await pc.evaluate(`(() => {
    const f = document.querySelector('.finder.such');
    if (!f) return null;
    const an = f.getAnimations().filter(x => x instanceof Animation && x.effect && x.effect.getKeyframes);
    const kf = an.flatMap(x => x.effect.getKeyframes());
    const art = new Set(kf.flatMap(k => Object.keys(k).filter(n => !['offset','easing','composite','computedOffset'].includes(n))));
    return { wa: an.filter(x => !x.animationName).length, arten: [...art], erster: kf[0] ? String(kf[0].transform || '') : '' };
  })()`) as any;
  p('Ein Klick auf die Kapsel lässt die Suche aus ihr aufgehen (Web-Animation)',
    !!auf && auf.wa >= 1 && /scale|translate/.test(auf.erster), JSON.stringify(auf));
  p('… und bewegt dabei nur transform/opacity',
    !!auf && auf.arten.length > 0 && auf.arten.every((n: string) => n === 'transform' || n === 'opacity'), JSON.stringify(auf?.arten));
  await pc.waitForTimeout(1100);
  const ruht = await pc.evaluate(`(() => {
    const f = document.querySelector('.finder.such');
    return f ? { laeuft: f.getAnimations().filter(x => x.playState === 'running').length,
                 tr: getComputedStyle(f).transform } : null;
  })()`) as any;
  p('Danach steht sie ruhig an ihrem Ort', !!ruht && ruht.laeuft === 0 && (ruht.tr === 'none' || ruht.tr === 'matrix(1, 0, 0, 1, 0, 0)'),
    JSON.stringify(ruht));
  p('#q bleibt das Suchfeld und hat den Fokus',
    await pc.evaluate(`document.activeElement && document.activeElement.id === 'q'`));

  console.log('\n§2 Die Treffer kommen nacheinander');
  /* In EINEM Zug (wie Einfügen): sonst brächte schon „E" die Zeilen, und
     jeder weitere Buchstabe liesse sie zu Recht stehen. */
  await pc.fill('#q', 'Elektr');
  await pc.waitForTimeout(60);
  const staffel = await pc.evaluate(`(() => {
    const rows = [...document.querySelectorAll('#res > button[data-i]')];
    return rows.map(r => ({ kommt: r.classList.contains('ru-kommt'),
      verz: parseFloat(getComputedStyle(r).animationDelay) || 0 }));
  })()`) as any[];
  const neue = staffel.filter(x => x.kommt);
  p('Mindestens drei Treffer kommen als neue Zeilen', neue.length >= 3, JSON.stringify(staffel));
  p('… nacheinander: die Verzögerung wächst', neue.length >= 3 && neue.every((x, k) => k === 0 || x.verz > neue[k - 1].verz),
    JSON.stringify(neue));
  await pc.waitForTimeout(500);
  await pc.keyboard.type('o', { delay: 10 });
  await pc.waitForTimeout(60);
  const zweit = await pc.evaluate(`(() => {
    const rows = [...document.querySelectorAll('#res > button[data-i]')];
    return { alle: rows.length, neu: rows.filter(r => r.classList.contains('ru-kommt')).length };
  })()`) as any;
  p('Was schon dastand, kommt beim nächsten Buchstaben nicht noch einmal', zweit.alle >= 2 && zweit.neu === 0,
    JSON.stringify(zweit));

  console.log('\n§3 Die Auswahl gleitet');
  await pc.waitForTimeout(400);
  await pc.evaluate(`window.__t588 = [...document.querySelectorAll('#res > button[data-i]')]`);
  const marke0 = await pc.evaluate(`(() => {
    const m = document.querySelectorAll('#res > .ru-marke');
    const on = document.querySelector('#res > button.on');
    if (m.length !== 1 || !on) return { zahl: m.length };
    const a = m[0].getBoundingClientRect(), b = on.getBoundingClientRect();
    return { zahl: 1, versteckt: m[0].getAttribute('aria-hidden'), dt: Math.abs(a.top - b.top), dh: Math.abs(a.height - b.height),
             taste: (m[0].querySelector('.ru-marke-taste') || {}).textContent || '' };
  })()`) as any;
  p('EINE Marke in #res, vor dem Vorleser verborgen, auf der gewählten Zeile',
    marke0.zahl === 1 && marke0.versteckt === 'true' && marke0.dt < 1.5 && marke0.dh < 1.5, JSON.stringify(marke0));
  p('Am Rechner trägt sie den Chip „↵ Enter"', /↵/.test(marke0.taste) && /Enter/.test(marke0.taste), marke0.taste);
  const lauf = bahn(pc, '#res > .ru-marke', 650);
  await pc.keyboard.press('ArrowDown');
  const orte = await lauf;
  const nach = await pc.evaluate(`(() => {
    const rows = [...document.querySelectorAll('#res > button[data-i]')];
    const gleich = rows.length === window.__t588.length && rows.every((r, k) => r === window.__t588[k]);
    const on = document.querySelector('#res > button.on');
    const m = document.querySelector('#res > .ru-marke');
    if (!m || !on) return { gleich, i: on ? on.dataset.i : null, dt: 99, dh: 99 };
    const a = m.getBoundingClientRect(), b = on.getBoundingClientRect();
    return { gleich, i: on.dataset.i, dt: Math.abs(a.top - b.top), dh: Math.abs(a.height - b.height) };
  })()`) as any;
  p('↓ baut die Liste NICHT neu — dieselben Knöpfe [data-i]', nach.gleich, JSON.stringify(nach));
  p('… die Wahl ist die nächste Zeile (.on)', nach.i === '1', JSON.stringify(nach));
  const zwischen = new Set(orte.slice(0, -1)).size;
  p('… und die Marke GLEITET dorthin (mindestens 5 Zwischenorte)', zwischen >= 5, JSON.stringify(orte.slice(0, 24)));
  p('… und kommt genau an', nach.dt < 1.5 && nach.dh < 1.5, JSON.stringify(nach));
  /* Umlenken mitten im Flug: ↑, und 60 ms später ↓ — sie landet, wo die Wahl ist. */
  await pc.keyboard.press('ArrowUp');
  await pc.waitForTimeout(60);
  await pc.keyboard.press('ArrowDown');
  await pc.waitForTimeout(800);
  const um = await pc.evaluate(`(() => {
    const on = document.querySelector('#res > button.on');
    const m = document.querySelector('#res > .ru-marke');
    if (!m || !on) return { i: on ? on.dataset.i : null, dt: 99 };
    return { i: on.dataset.i, dt: Math.abs(m.getBoundingClientRect().top - on.getBoundingClientRect().top) };
  })()`) as any;
  p('Umgelenkt mitten im Flug landet sie bei der Wahl', um.i === '1' && um.dt < 1.5, JSON.stringify(um));
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(200);

  console.log('\n§4 Dasselbe in der Befehlspalette und im Menü mit Suche');
  await pc.evaluate(`Werkzeuge.palette()`);
  await pc.waitForTimeout(700);
  await pc.evaluate(`window.__t588 = [...document.querySelectorAll('#cr > button[data-i]')]`);
  const pLauf = bahn(pc, '#cr > .ru-marke', 600);
  await pc.keyboard.press('ArrowDown');
  const pOrte = await pLauf;
  const pal = await pc.evaluate(`(() => {
    const rows = [...document.querySelectorAll('#cr > button[data-i]')];
    const on = document.querySelector('#cr > button.on');
    const m = document.querySelectorAll('#cr > .ru-marke');
    return { gleich: rows.every((r, k) => r === window.__t588[k]), marken: m.length, i: on && on.dataset.i,
             dt: m[0] && on ? Math.abs(m[0].getBoundingClientRect().top - on.getBoundingClientRect().top) : -1 };
  })()`) as any;
  p('Palette: EINE Marke, ↓ ohne Neuaufbau, sie gleitet und landet',
    pal.marken === 1 && pal.gleich && pal.i === '1' && new Set(pOrte.slice(0, -1)).size >= 4 && pal.dt < 1.5 && pal.dt >= 0,
    JSON.stringify({ ...pal, orte: pOrte.length }));
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(200);
  await pc.evaluate(`window.__m588 = UI.menuMitSuche('<button>Eins</button><button>Zwei</button><button>Drei</button>', 300, 200, {})`);
  await pc.waitForTimeout(400);
  const mLauf = bahn(pc, '.menu .menu-liste > .ru-marke', 600);
  await pc.keyboard.press('ArrowDown');
  const mOrte = await mLauf;
  const men = await pc.evaluate(`(() => {
    const j = document.querySelector('.menu .menu-liste button.jetzt');
    const m = document.querySelectorAll('.menu .menu-liste > .ru-marke');
    return { marken: m.length, text: j && j.textContent,
             dt: m[0] && j ? Math.abs(m[0].getBoundingClientRect().top - j.getBoundingClientRect().top) : -1 };
  })()`) as any;
  p('Menü mit Suche: die Marke folgt .jetzt und gleitet', men.marken === 1 && men.text === 'Zwei' &&
    new Set(mOrte.slice(0, -1)).size >= 4 && men.dt >= 0 && men.dt < 1.5, JSON.stringify({ ...men, orte: mOrte.length }));
  await pc.evaluate(`window.__m588 && window.__m588.remove()`);

  /* ========================================================================
   * §6 · DER STAPEL
   * ======================================================================*/
  console.log('\n§6 Drei Meldungen stapeln sich');
  await pc.evaluate(`(() => { UI.toast('Eins gespeichert'); UI.toast('Zwei verschoben'); UI.toast('Drei kopiert'); })()`);
  await pc.waitForTimeout(700);
  const st = await pc.evaluate(`(() => {
    const t = document.getElementById('toast');
    const alt = [...document.querySelectorAll('#ru-toast-stapel .ru-toast-alt')];
    const tr = t.getBoundingClientRect();
    return { neu: t.textContent, show: t.classList.contains('show'), live: t.getAttribute('aria-live'),
             alt: alt.map(x => x.textContent), sicht: alt.map(x => Number(getComputedStyle(x).opacity)),
             versteckt: document.getElementById('ru-toast-stapel')?.getAttribute('aria-hidden'),
             deckt: alt.some(x => { const r = x.getBoundingClientRect(); return r.bottom > tr.top + 1 && r.top < tr.bottom - 1; }),
             griff: alt.map(x => getComputedStyle(x).pointerEvents) };
  })()`) as any;
  p('#toast sagt die neueste und bleibt die EINE Live-Region', st.neu === 'Drei kopiert' && st.show && st.live === 'polite',
    JSON.stringify(st));
  p('… die zwei davor stehen lesbar daneben, die neuere zuerst',
    JSON.stringify(st.alt) === JSON.stringify(['Zwei verschoben', 'Eins gespeichert']) && st.sicht.every((x: number) => x > 0.5),
    JSON.stringify(st));
  p('… ohne die neueste zu verdecken, vor dem Vorleser verborgen (sie wurden schon angesagt)',
    !st.deckt && st.versteckt === 'true', JSON.stringify(st));
  p('… und am Rechner greifen sie nicht nach dem Zeiger (wie #toast)', st.griff.every((x: string) => x === 'none'),
    JSON.stringify(st.griff));
  await pc.evaluate(`UI.toast('Vier fertig')`);
  await pc.waitForTimeout(300);
  const st4 = await pc.evaluate(`[...document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)')].map(x => x.textContent)`) as string[];
  p('Höchstens drei: die älteste geht', JSON.stringify(st4) === JSON.stringify(['Drei kopiert', 'Zwei verschoben']),
    JSON.stringify(st4));
  await pc.evaluate(`UI.toast('Vier fertig')`);
  await pc.waitForTimeout(300);
  const st5 = await pc.evaluate(`[...document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)')].map(x => x.textContent)`) as string[];
  p('Eine Wiederholung stapelt sich nicht', JSON.stringify(st5) === JSON.stringify(['Drei kopiert', 'Zwei verschoben']),
    JSON.stringify(st5));
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(500);
  const leer = await pc.evaluate(`({ show: document.getElementById('toast').classList.contains('show'),
    alt: document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length })`) as any;
  p('Escape räumt den Stapel ab (ohne offenes Fenster)', !leer.show && leer.alt === 0, JSON.stringify(leer));
  await pc.evaluate(`(() => { window.__h588 = UI.toast('Lade Seite 1 von 9', 60000); window.__h588.textContent = 'Lade Seite 2 von 9'; })()`);
  await pc.waitForTimeout(200);
  const fort = await pc.evaluate(`({ neu: document.getElementById('toast').textContent,
    alt: document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length })`) as any;
  p('Ein Fortschritt (E116) stapelt sich nicht selbst', fort.neu === 'Lade Seite 2 von 9' && fort.alt === 0, JSON.stringify(fort));
  await pc.evaluate(`window.__h588.remove()`);

  /* ========================================================================
   * §7–§9 · DIE GLOCKE, DAS ZUSAMMENFLIESSEN, DER POSTEINGANG
   * ======================================================================*/
  console.log('\n§7 Die Glocke');
  await pc.evaluate(`(() => {
    Werkzeuge.posteingangMelden({ text: 'Erinnerung: Elektro lernen', quelle: 'Erinnerungen' });
    Werkzeuge.posteingangMelden({ text: 'Automation lief: 3 Zeilen', quelle: 'Automation' });
    Werkzeuge.posteingangMelden({ text: 'Karteikarten fällig: 12', quelle: 'Lernen' });
  })()`);
  await pc.waitForTimeout(500);
  const gl = await rechteck(pc, '#studio-glocke');
  p('Die Glocke steht mit drei ungelesenen da', !!gl && gl.b > 0, JSON.stringify(gl));
  if (gl) {
    await pc.mouse.move(gl.l + gl.b / 2, gl.t + gl.h / 2);
    await pc.waitForTimeout(700);
  }
  const f = await pc.evaluate(`(() => {
    const f = document.getElementById('ru-glocken-faecher');
    if (!f || f.hidden) return null;
    const k = [...f.querySelectorAll('.ru-meldung')];
    const knoepfe = [...f.querySelectorAll('button')].map(b => (b.getAttribute('aria-label') || b.textContent || '').trim());
    const r = f.getBoundingClientRect();
    return { karten: k.map(x => x.textContent), knoepfe, sicht: r.width > 0 && Number(getComputedStyle(f).opacity) > 0.9,
             klein: [...f.querySelectorAll('button')].filter(b => b.offsetHeight < 44).length };
  })()`) as any;
  p('Beim Zeigen fächern die letzten drei Meldungen auf, die neueste zuerst',
    !!f && f.sicht && f.karten.length === 3 && /Karteikarten/.test(f.karten[0]) && /Elektro/.test(f.karten[2]), JSON.stringify(f));
  p('… mit „Alle gelesen" und „Posteingang öffnen" (44 px)',
    !!f && f.knoepfe.some((x: string) => /Alle gelesen/.test(x)) && f.knoepfe.some((x: string) => /Posteingang öffnen/.test(x))
    && f.klein === 0, JSON.stringify(f));
  await pc.mouse.move(700, 600);
  await pc.waitForTimeout(700);
  p('Der Zeiger geht, der Fächer geht', await pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); return !f || f.hidden; })()`));
  if (gl) await pc.mouse.click(gl.l + gl.b / 2, gl.t + gl.h / 2);
  await pc.waitForTimeout(700);
  p('Ein Klick auf die Glocke öffnet WEITER den Posteingang (§43)',
    await pc.evaluate(`/Posteingang/.test((document.querySelector('#page h1') || {}).textContent || '')`));

  console.log('\n§9 Der Posteingang als Glaskarten');
  const pe = await pc.evaluate(`(() => {
    const k = [...document.querySelectorAll('#page .pe-karte[data-meld]')];
    const s = k[0] ? getComputedStyle(k[0]) : null;
    return { zahl: k.length, quelle: k.map(x => (x.querySelector('.pe-quelle') || {}).textContent || ''),
             radius: s ? parseFloat(s.borderTopLeftRadius) : 0, schatten: s ? s.boxShadow : '',
             unschaerfe: s ? (s.backdropFilter || 'none') : '', hoehe: k[0] ? k[0].getBoundingClientRect().height : 0 };
  })()`) as any;
  p('Jede Benachrichtigung ist eine Karte mit ihrer Quelle als Marke',
    pe.zahl === 3 && pe.quelle.join('|') === 'Lernen|Automation|Erinnerungen', JSON.stringify(pe));
  p('… Glas: runde Ecke, Lichtkante, KEINE eigene Unschärfe je Karte, mindestens 44 px',
    pe.radius >= 12 && /inset/.test(pe.schatten) && pe.unschaerfe === 'none' && pe.hoehe >= 44, JSON.stringify(pe));

  console.log('\n§8 „Alle gelesen" fliesst zusammen');
  if (gl) {
    await pc.evaluate(`document.getElementById('studio-glocke').dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))`);
    await pc.mouse.move(gl.l + gl.b / 2, gl.t + gl.h / 2);
    await pc.waitForTimeout(700);
  }
  const vorher = await pc.evaluate(`({
    filter: document.querySelectorAll('filter#ru-linse-tropfen').length,
    an: [...document.querySelectorAll('*')].filter(e => /ru-linse-tropfen/.test(getComputedStyle(e).filter)).length,
    zahl: Werkzeuge.meldungen().length })`) as any;
  p('In Ruhe: höchstens EIN Goo-Filter im Dokument, an keinem Element', vorher.filter <= 1 && vorher.an === 0, JSON.stringify(vorher));
  const goo = pc.evaluate(`new Promise(fertig => {
    let max = 0; const t0 = performance.now();
    const schritt = () => {
      const n = [...document.querySelectorAll('.ru-goo-an')].filter(e => /ru-linse-tropfen/.test(getComputedStyle(e).filter)).length;
      max = Math.max(max, n);
      if (performance.now() - t0 < 900) requestAnimationFrame(schritt); else fertig(max);
    };
    requestAnimationFrame(schritt);
  })`) as Promise<number>;
  if (await pc.locator('#ru-glocken-faecher [data-faecher="gelesen"]').isVisible())
    await pc.click('#ru-glocken-faecher [data-faecher="gelesen"]');
  const gooMax = await goo;
  await pc.waitForTimeout(400);
  const danach = await pc.evaluate(`({
    filter: document.querySelectorAll('filter#ru-linse-tropfen').length,
    an: [...document.querySelectorAll('*')].filter(e => /ru-linse-tropfen/.test(getComputedStyle(e).filter)).length,
    zahl: Werkzeuge.meldungen().length, gelesen: Werkzeuge.meldungen().every(m => m.gelesen),
    faecher: (() => { const f = document.getElementById('ru-glocken-faecher'); return !!f && !f.hidden; })() })`) as any;
  p('Während des Zusammenfliessens trägt genau EINE Ebene den Goo-Filter', gooMax === 1, String(gooMax));
  p('Danach wieder an keinem Element, und der Fächer ist zu', danach.an === 0 && danach.filter <= 1 && !danach.faecher,
    JSON.stringify(danach));
  p('„Alle gelesen" liest, es löscht nicht (E276)', danach.gelesen && danach.zahl === vorher.zahl, JSON.stringify(danach));
  await a.zu();
}

/* ==========================================================================
 * §5 · RUHIG
 * ========================================================================*/
{
  console.log('\n§5 Ruhig: ohne Aufgehen, ohne Staffel, die Marke springt');
  const a = await aufmachen({ handy: false, ruhig: true });
  const { pc } = a;
  await pc.click('#studio-search');
  await pc.keyboard.type('Elektr', { delay: 20 });
  await pc.waitForTimeout(80);
  const r = await pc.evaluate(`(() => {
    const f = document.querySelector('.finder.such');
    return { an: f.getAnimations().filter(x => x.playState === 'running' && !x.animationName).length,
             kommt: document.querySelectorAll('#res .ru-kommt').length };
  })()`) as any;
  await pc.keyboard.press('ArrowDown');
  await pc.waitForTimeout(40);
  const r2 = await pc.evaluate(`(() => {
    const on = document.querySelector('#res > button.on');
    const m = document.querySelector('#res > .ru-marke');
    return { an: m ? m.getAnimations().length : -1,
             dt: m && on ? Math.abs(m.getBoundingClientRect().top - on.getBoundingClientRect().top) : -1 };
  })()`) as any;
  p('Ruhig geht die Suche ohne Aufgehen und ohne Staffel auf', r.an === 0 && r.kommt === 0, JSON.stringify(r));
  p('… und die Marke springt an die Wahl (keine Bahn)', r2.an === 0 && r2.dt >= 0 && r2.dt < 1.5, JSON.stringify(r2));
  await a.zu();
}

/* ==========================================================================
 * §10 · AM TELEFON, DUNKEL
 * ========================================================================*/
{
  console.log('\n§10 Am Telefon');
  const a = await aufmachen({ handy: true, dunkel: true });
  const { pc, cdp } = a;
  await pc.evaluate(`(() => { UI.toast('Eins gespeichert'); UI.toast('Zwei verschoben'); UI.toast('Drei kopiert'); })()`);
  await pc.waitForTimeout(700);
  const st = await pc.evaluate(`(() => {
    const t = document.getElementById('toast').getBoundingClientRect();
    const leiste = document.getElementById('handy-oben');
    const lr = leiste ? leiste.getBoundingClientRect() : null;
    const alt = [...document.querySelectorAll('#ru-toast-stapel .ru-toast-alt')].map(x => x.getBoundingClientRect());
    return { zahl: alt.length, ueberLeiste: !lr || alt.every(r => r.bottom <= lr.top + 1),
             imBild: alt.every(r => r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth),
             ueberToast: alt.every(r => r.bottom <= t.top + 1) };
  })()`) as any;
  p('Der Stapel steht über #toast und über der unteren Leiste, ganz im Bild',
    st.zahl === 2 && st.ueberLeiste && st.imBild && st.ueberToast, JSON.stringify(st));
  await pc.evaluate(`(() => {
    Werkzeuge.posteingangMelden({ text: 'Erinnerung: Elektro lernen', quelle: 'Erinnerungen' });
    Werkzeuge.posteingangMelden({ text: 'Karteikarten fällig: 12', quelle: 'Lernen' });
  })()`);
  await pc.waitForTimeout(500);
  const glocke = await pc.evaluate(`(() => {
    const g = [...document.querySelectorAll('#mb-glocke, #studio-glocke')].find(e => e.getBoundingClientRect().width > 0 && !e.hidden);
    if (!g) return null;
    g.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = g.getBoundingClientRect();
    return { id: g.id, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`) as any;
  p('Am Telefon gibt es eine sichtbare Glocke', !!glocke, JSON.stringify(glocke));
  if (glocke) {
    const vorH1 = await pc.evaluate(`(document.querySelector('#page h1') || {}).textContent || ''`);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: glocke.x, y: glocke.y }] });
    await pc.waitForTimeout(650);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pc.waitForTimeout(500);
    const lang = await pc.evaluate(`(() => {
      const f = document.getElementById('ru-glocken-faecher');
      return { auf: !!f && !f.hidden, karten: f ? f.querySelectorAll('.ru-meldung').length : 0,
               h1: (document.querySelector('#page h1') || {}).textContent || '' };
    })()`) as any;
    p('Langes Drücken fächert auf …', lang.auf && lang.karten === 2, JSON.stringify(lang));
    p('… und öffnet NICHT zusätzlich den Posteingang', lang.h1 === vorH1, JSON.stringify({ vorH1, h1: lang.h1 }));
    await pc.keyboard.press('Escape');
    await pc.waitForTimeout(400);
    p('Escape schliesst den Fächer', await pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); return !f || f.hidden; })()`));
  }
  await a.zu();
}

/* ==========================================================================
 * §11 · DURCHSICHT (Nachtrag zu E711, 4. Oktober): der Fächer geht auch
 * wieder zu, die Marke ist lesbar, und der Stapel nimmt keinem Strich den Zug
 * ========================================================================*/
{
  console.log('\n§11 Durchsicht: der Fächer geht zu, die Marke ist lesbar, der Strich kommt an');
  const a = await aufmachen({ handy: false });
  const { pc } = a;
  const faecherZu = () => pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); return !f || f.hidden; })()`) as Promise<boolean>;
  const offenUndDrin = () => pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); return !!f && !f.hidden && f.contains(document.activeElement); })()`) as Promise<boolean>;
  const erweitert = () => pc.evaluate(`document.getElementById('studio-glocke').getAttribute('aria-expanded')`) as Promise<string | null>;
  await pc.evaluate(`(() => {
    Werkzeuge.posteingangMelden({ text: 'Erinnerung: Elektro lernen', quelle: 'Erinnerungen' });
    Werkzeuge.posteingangMelden({ text: 'Karteikarten fällig: 12', quelle: 'Lernen' });
  })()`);
  await pc.waitForTimeout(300);
  /* Mit der Tastatur auf (↓ auf der Glocke); die Glocke sagt, dass er offen ist. */
  await pc.focus('#studio-glocke');
  await pc.keyboard.press('ArrowDown');
  await pc.waitForTimeout(500);
  const aufT = await offenUndDrin();
  const ariaAuf = await erweitert();
  /* Ein Klick daneben schliesst ihn. */
  await pc.mouse.click(700, 700);
  await pc.waitForTimeout(450);
  const ariaZu = await erweitert();
  p('Rechner: ein Klick daneben schliesst den Fächer', aufT && await faecherZu(), JSON.stringify({ aufT }));
  p('… und die Glocke sagt es (aria-expanded true → false)', ariaAuf === 'true' && ariaZu === 'false', JSON.stringify({ ariaAuf, ariaZu }));
  /* Der Fokus verlässt den Fächer (Tab bis hinaus): er schliesst sich. */
  await pc.focus('#studio-glocke');
  await pc.keyboard.press('ArrowDown');
  await pc.waitForTimeout(500);
  for (let n = 0; n < 6; n++) await pc.keyboard.press('Tab');
  await pc.waitForTimeout(450);
  const tab = await pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); return { zu: !f || f.hidden, drin: !!f && f.contains(document.activeElement) }; })()`) as any;
  p('Verlässt der Fokus den Fächer (Tab), geht er zu', tab.zu && !tab.drin, JSON.stringify(tab));
  /* Strg P aus dem offenen Fächer: die Suche steht vorn, der Fächer liegt nicht darüber. */
  await pc.focus('#studio-glocke');
  await pc.keyboard.press('ArrowDown');
  await pc.waitForTimeout(500);
  await pc.keyboard.press('Control+p');
  await pc.waitForTimeout(500);
  const strgP = await pc.evaluate(`({ such: !!document.querySelector('.overlay .finder.such'), zu: (() => { const f = document.getElementById('ru-glocken-faecher'); return !f || f.hidden; })() })`) as any;
  p('Strg P aus dem offenen Fächer: die Suche ist da, der Fächer zu', strgP.such && strgP.zu, JSON.stringify(strgP));
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(300);
  /* Mit der Maus aufgefächert (der Fokus steht NICHT darin), dann Strg P:
     das Fenster liegt vorn, der Fächer nicht darüber — er ist ein Menü der
     Glocke, kein Fenster über den Fenstern. */
  const gl11 = await rechteck(pc, '#studio-glocke');
  if (gl11) await pc.mouse.move(gl11.l + gl11.b / 2, gl11.t + gl11.h / 2);
  await pc.waitForTimeout(700);
  const ueber = await pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher');
    if (!f || f.hidden) return null; const r = f.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 30 }; })()`) as { x: number; y: number } | null;
  await pc.keyboard.press('Control+p');
  await pc.waitForTimeout(500);
  /* Gemessen wird, was GEMALT wird, nicht der Treffer (`elementFromPoint`
     überspringt den Fächer, sobald `fokus.ts` ihn hinter dem Fenster träge
     macht — gemalt wird er trotzdem, test244 kennt das vom Toast). */
  const vorn = await pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); const o = document.querySelector('.overlay');
    const offen = !!f && !f.hidden && getComputedStyle(f).display !== 'none';
    return { such: !!o && !!o.querySelector('.finder.such'), offen,
             zf: f ? Number(getComputedStyle(f).zIndex) : null, zo: o ? Number(getComputedStyle(o).zIndex) : null }; })()`) as any;
  p('Mit der Maus aufgefächert, dann Strg P: die Suche liegt vorn, der Fächer nicht darüber',
    !!ueber && vorn.such && (!vorn.offen || vorn.zf < vorn.zo), JSON.stringify({ ueber, vorn }));
  await pc.keyboard.press('Escape');
  await pc.mouse.move(700, 700);
  await pc.waitForTimeout(500);
  /* „Alle gelesen" mit der Tastatur: danach steht der Fokus wieder im Kopf —
     an der Glocke, oder (ist nichts mehr ungelesen, geht die Glocke weg) an
     ihrem Nachbarn. Nie im Leeren (`body`). */
  await pc.focus('#studio-glocke');
  await pc.keyboard.press('ArrowDown');
  await pc.waitForTimeout(500);
  await pc.focus('#ru-glocken-faecher [data-faecher="gelesen"]');
  /* Die Glocke nimmt die Karten auf: sie steht, solange sie fliessen (sonst
     flögen sie ins Leere — und, weil der Kopf nachrückt, in den Knopf
     daneben), und geht erst danach, weil nichts mehr ungelesen ist. */
  const ort0 = await rechteck(pc, '#studio-glocke');
  const glockeWaehrend = pc.evaluate(`new Promise(fertig => {
    const orte = []; const t0 = performance.now();
    const schritt = () => {
      const g = document.getElementById('studio-glocke'); const r = g.getBoundingClientRect();
      if (document.querySelector('#ru-glocken-faecher.fliesst')) orte.push(Math.round(r.width) + '@' + Math.round(r.left));
      if (performance.now() - t0 < 700) requestAnimationFrame(schritt); else fertig(orte);
    };
    requestAnimationFrame(schritt);
  })`) as Promise<string[]>;
  await pc.keyboard.press('Enter');
  const waehrend = await glockeWaehrend;
  await pc.waitForTimeout(600);
  const nachFluss = await pc.evaluate(`document.getElementById('studio-glocke').hidden`) as boolean;
  p('„Alle gelesen": die Glocke steht, solange die Karten in sie fliessen, an ihrem Ort — und geht danach',
    !!ort0 && waehrend.length >= 5 && waehrend.every(w => w === Math.round(ort0.b) + '@' + Math.round(ort0.l)) && nachFluss,
    JSON.stringify({ ort0, waehrend: waehrend.slice(0, 6), bilder: waehrend.length, nachFluss }));
  const fokus = await pc.evaluate(`(() => { const a = document.activeElement; const g = document.getElementById('studio-glocke');
    return { zu: (() => { const f = document.getElementById('ru-glocken-faecher'); return !f || f.hidden; })(),
      wo: a ? (a.id || a.tagName) : null, imKopf: !!a && a !== document.body && !!g.parentElement && g.parentElement.contains(a),
      sichtbar: !!a && a.getBoundingClientRect().width > 0 }; })()`) as any;
  p('„Alle gelesen" mit der Tastatur: der Fächer geht zu, der Fokus bleibt im Kopf (Glocke oder Nachbar), nicht im Leeren',
    fokus.zu && fokus.imKopf && fokus.sichtbar, JSON.stringify(fokus));

  /* Ein Escape tut EINES (test296 §3): schliesst es die Suche, bleibt der
     Stapel stehen; erst das nächste räumt ihn ab. */
  await pc.evaluate(`(() => { UI.toast('Eins gespeichert', 9000); UI.toast('Zwei verschoben', 9000); })()`);
  await pc.waitForTimeout(400);
  await pc.click('#studio-search');
  await pc.waitForTimeout(500);
  const esc0 = await pc.evaluate(`document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length`) as number;
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(400);
  const esc1 = await pc.evaluate(`({ such: !!document.querySelector('.finder.such'), show: document.getElementById('toast').classList.contains('show'),
    alt: document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length })`) as any;
  await pc.keyboard.press('Escape');
  await pc.waitForTimeout(400);
  const esc2 = await pc.evaluate(`({ show: document.getElementById('toast').classList.contains('show'),
    alt: document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length })`) as any;
  p('Escape in der offenen Suche schliesst NUR die Suche — der Stapel bleibt', !esc1.such && esc1.show && esc0 >= 1 && esc1.alt === esc0, JSON.stringify({ esc0, ...esc1 }));
  p('… das nächste Escape räumt den Stapel ab', !esc2.show && esc2.alt === 0, JSON.stringify(esc2));

  /* Die Schrift auf der Marke (Zeile, Kürzel, Ausschnitt, Stern, „↵ Enter")
     gegen die Fläche der Marke, so wie sie gemalt wird: Deckkraft (auch die
     der Eltern bis zur Zeile) und die getönte Fläche des Chips mitgerechnet.
     4,5 : 1 in allen zehn Schemata. */
  const schemata = await pc.evaluate(`Aussehen.SCHEMATA.map(s => s.id)`) as string[];
  const MESSEN = `(liste) => {
    const rgb = c => (c.match(/[\\d.]+/g) || []).map(Number);
    const mix = (fg, a, bg) => [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a));
    const L = x => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
      return .2126 * f(x[0]) + .7152 * f(x[1]) + .0722 * f(x[2]); };
    const kon = (a, b) => { const l1 = L(a), l2 = L(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
    const m = document.querySelector(liste + ' > .ru-marke'), on = document.querySelector(liste + ' > button.on');
    if (!m || !on) return null;
    const grund = rgb(getComputedStyle(m).backgroundColor);
    const werte = {};
    const lies = (name, el, unter = grund) => {
      if (!el || !el.offsetWidth) return;
      const s = getComputedStyle(el); if (s.visibility === 'hidden') return;
      let a = 1; for (let e = el; e && e !== on.parentElement; e = e.parentElement) a *= Number(getComputedStyle(e).opacity);
      const c = rgb(s.color); a *= (c[3] ?? 1);
      werte[name] = Math.round(kon(mix(c, a, unter), unter) * 100) / 100;
    };
    lies('zeile', on.querySelector('span:nth-child(2) > span') || on.querySelector('span:nth-child(2)') || on);
    on.querySelectorAll('.pth, .snip').forEach((el, k) => lies('klein' + k, el));
    lies('stern', on.querySelector('.fest'));
    const t = m.querySelector('.ru-marke-taste');
    if (t && t.offsetWidth) { const b = rgb(getComputedStyle(t).backgroundColor); lies('taste', t, mix(b, b[3] ?? 1, grund)); }
    return werte;
  }`;
  const schlecht: string[] = [];
  for (const s of schemata) {
    await pc.evaluate(`Aussehen.setzen({ schema: ${JSON.stringify(s)} })`);
    await pc.waitForTimeout(120);
    await pc.evaluate(`Werkzeuge.palette()`);
    await pc.waitForTimeout(500);
    await pc.keyboard.press('Control+Enter');   /* die erste Zeile angeheftet: der Stern steht da */
    await pc.waitForTimeout(200);
    const pal1 = await pc.evaluate(`(${MESSEN})('#cr')`) as Record<string, number> | null;
    await pc.keyboard.press('Control+Enter');   /* zurück, wie es war */
    await pc.waitForTimeout(150);
    await pc.keyboard.press('ArrowDown');
    await pc.waitForTimeout(700);
    const pal = await pc.evaluate(`(${MESSEN})('#cr')`) as Record<string, number> | null;
    await pc.keyboard.press('Escape');
    await pc.waitForTimeout(150);
    await pc.click('#studio-search');
    await pc.waitForTimeout(500);
    await pc.keyboard.type('Elektr', { delay: 5 });
    await pc.waitForTimeout(400);
    await pc.keyboard.press('ArrowDown');
    await pc.waitForTimeout(700);
    const such = await pc.evaluate(`(${MESSEN})('#res')`) as Record<string, number> | null;
    await pc.keyboard.press('Escape');
    await pc.waitForTimeout(150);
    const alle = { ...Object.fromEntries(Object.entries(pal1 || {}).map(([k, v]) => ['fest-' + k, v])), ...(pal || {}),
                   ...Object.fromEntries(Object.entries(such || {}).map(([k, v]) => ['suche-' + k, v])) };
    const zuWenig = Object.entries(alle).filter(([, v]) => v < 4.5);
    if (!pal1 || !pal || !such || !('taste' in alle) || !('fest-stern' in alle) || zuWenig.length)
      schlecht.push(s + ' ' + JSON.stringify(zuWenig.length ? zuWenig : alle));
  }
  await pc.evaluate(`Aussehen.setzen({ schema: 'standard' })`);
  p('Schrift auf der Marke ≥ 4,5 : 1 in allen ' + schemata.length + ' Schemata (Zeile, Kürzel, Ausschnitt, Stern, „↵ Enter")',
    schemata.length >= 10 && schlecht.length === 0, schlecht.slice(0, 4).join(' · '));
  await a.zu();

  /* Telefon: langes Drücken öffnet, ein Tipp daneben schliesst. */
  const h = await aufmachen({ handy: true, dunkel: true });
  await h.pc.evaluate(`(() => { Werkzeuge.posteingangMelden({ text: 'Eins', quelle: 'A' }); Werkzeuge.posteingangMelden({ text: 'Zwei', quelle: 'B' }); })()`);
  await h.pc.waitForTimeout(400);
  const g = await h.pc.evaluate(`(() => {
    const g = [...document.querySelectorAll('#mb-glocke, #studio-glocke')].find(e => e.getBoundingClientRect().width > 0 && !e.hidden);
    if (!g) return null; g.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`) as { x: number; y: number } | null;
  if (g) {
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x, y: g.y }] });
    await h.pc.waitForTimeout(650);
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await h.pc.waitForTimeout(500);
    const auf2 = !(await h.pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); return !f || f.hidden; })()`));
    await h.pc.touchscreen.tap(195, 640);
    await h.pc.waitForTimeout(500);
    const zu2 = await h.pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher'); return !f || f.hidden; })()`);
    p('Telefon: ein Tipp daneben schliesst den Fächer', auf2 && zu2, JSON.stringify({ auf2, zu2 }));
  } else p('Telefon: ein Tipp daneben schliesst den Fächer', false, 'keine Glocke');

  /* Ein waagerechter Finger-Zug über eine Karte des Stapels nimmt sie weg. */
  const zug = async (x0: number, y: number, dx: number): Promise<void> => {
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
    for (let i = 1; i <= 15; i++) {
      await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / 15, y }] });
      await h.pc.waitForTimeout(16);
    }
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await h.pc.waitForTimeout(400);
  };
  /* Über einer Textseite (der häufigste Grund unter den Karten): ein
     Schnippen zur Seite. Der Browser darf den Inhalt dabei rollen und
     bricht den Zug dann ab (`pointercancel`) — das Schnippen zählt trotzdem. */
  await h.pc.evaluate(`(async () => {
    const page = Store.addPage(null, { text: 'Lesen unter dem Stapel', icon: '📄' });
    for (let k = 0; k < 30; k++) Store.addBlock(page.id, 'text', { text: 'Zeile ' + k + ' mit gewöhnlichem Text, der nur senkrecht rollt.' });
    await Store.flush(); App.oeffne(page.id);
  })()`);
  await h.pc.waitForTimeout(900);
  await h.pc.evaluate(`(() => { UI.toast('Eins gespeichert', 9000); UI.toast('Zwei verschoben', 9000); })()`);
  await h.pc.waitForTimeout(600);
  const karte = await h.pc.evaluate(`(() => { const e = document.querySelector('#ru-toast-stapel .ru-toast-alt'); if (!e) return null;
    const r = e.getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 }; })()`) as { x: number; y: number } | null;
  if (karte) {
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: karte.x, y: karte.y }] });
    for (let i = 1; i <= 6; i++) {
      await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: karte.x + i * 30, y: karte.y }] });
      await h.pc.waitForTimeout(8);
    }
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await h.pc.waitForTimeout(500);
  }
  p('Telefon: ein Schnippen zur Seite nimmt eine Karte des Stapels weg', !!karte &&
    await h.pc.evaluate(`document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length === 0`), JSON.stringify(karte));
  await h.pc.keyboard.press('Escape');
  await h.pc.waitForTimeout(300);

  /* Ein Strich auf der Tafel, der unter der Meldung beginnt, kommt an — die
     Tafel nimmt ihre Finger selbst (`touch-action:none`), der Stapel darf sie
     ihr nicht wegnehmen. Die echte Tafel (`whiteboard`), mit dem Finger. */
  const tafel = await h.pc.evaluate(`(async () => {
    const page = Store.addPage(null, { text: 'Tafel unter der Meldung', icon: '🖍' });
    for (let k = 0; k < 14; k++) Store.addBlock(page.id, 'text', { text: 'Zeile ' + k + ' über der Tafel, damit sie tiefer liegt.' });
    const block = Store.addBlock(page.id, 'whiteboard', { text: 'Skizze' });
    for (let k = 0; k < 14; k++) Store.addBlock(page.id, 'text', { text: 'Zeile ' + k + ' unter der Tafel.' });
    await Store.flush();
    App.oeffne(page.id);
    await new Promise(r => setTimeout(r, 900));
    return block.id;
  })()`) as string;
  await h.pc.evaluate(`UI.toast('Gespeichert', 20000)`);
  await h.pc.waitForTimeout(500);
  const lage = await h.pc.evaluate(`(() => {
    const t = document.getElementById('toast').getBoundingClientRect();
    const f = document.querySelector('.wb-flaeche');
    if (!f) return null;
    const r = f.getBoundingClientRect();
    let e = f.parentElement; while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement;
    if (e) e.scrollTop += (r.top + r.height / 2) - (t.top + t.height / 2);
    const x = t.left + 40, y = t.top + t.height / 2;
    const unter = [...document.elementsFromPoint(x, y)].find(n => !n.closest('#toast, #ru-toast-stapel'));
    return { x, y, unterTafel: !!unter && !!unter.closest('.wb-flaeche'), ta: unter ? getComputedStyle(unter.closest('.wb-flaeche') || unter).touchAction : '' };
  })()`) as { x: number; y: number; unterTafel: boolean; ta: string } | null;
  const vorStriche = await h.pc.evaluate(`(Store.getBlock(${JSON.stringify(tafel)}).shapes || []).filter(s => s.art === 'stift').length`) as number;
  if (lage?.unterTafel) await zug(lage.x, lage.y, 170);
  await h.pc.waitForTimeout(300);
  const strich = await h.pc.evaluate(`(() => {
    const s = (Store.getBlock(${JSON.stringify(tafel)}).shapes || []).filter(s => s.art === 'stift');
    const l = s[s.length - 1];
    const xs = l ? l.pts.map(q => Array.isArray(q) ? q[0] : q.x) : [];
    return { zahl: s.length, breite: xs.length ? Math.round(Math.max(...xs) - Math.min(...xs)) : 0,
             toast: document.getElementById('toast').classList.contains('show'),
             verschoben: document.getElementById('toast').style.translate || '' };
  })()`) as any;
  p('Telefon: ein Strich auf der Tafel, der unter der Meldung beginnt, kommt ganz an',
    !!lage?.unterTafel && strich.zahl === vorStriche + 1 && strich.breite >= 120, JSON.stringify({ lage, vorStriche, strich }));
  p('… und die Meldung bleibt stehen (der Strich ist kein Wischen)', strich.toast && !strich.verschoben, JSON.stringify(strich));
  await h.zu();
}

/* ==========================================================================
 * §12 · VIERTE DURCHSICHT (5. Oktober): die Akzent-Marke bleibt in ihren
 * zwei Listen. `.ru-marke-traeger > button.on` machte JEDE Liste mit Marke
 * zur Akzentliste — auch das Menü mit Suche, wo `.on` nicht „die Wahl der
 * Pfeile" heisst, sondern „das gilt jetzt" („Quelle wechseln" in der
 * Datenbank, steuerung.ts). Dort verlor die Zeile ihre Fläche: welche Quelle
 * jetzt gilt, war nicht mehr zu sehen. Und am Rechner flackerte der Fächer,
 * solange der Zeiger auf der Glocke ruhte.
 * ========================================================================*/
{
  console.log('\n§12 Vierte Durchsicht: die jetzige Wahl bleibt markiert, der Fächer flackert nicht, keine halbe Blase');
  const LESEN = `(() => {
    /* \`color-mix()\` kommt als \`color(srgb r g b / a)\` mit Werten 0–1 zurück
       (die Fläche des Menüs) — so gelesen wie \`rgb()\`, sonst wäre sie schwarz. */
    const rgb = c => { const z = (c.match(/[\\d.]+/g) || []).map(Number);
      return /^color\\(srgb/.test(c) ? [z[0] * 255, z[1] * 255, z[2] * 255, z[3] ?? 1] : z; };
    const L = x => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
      return .2126 * f(x[0]) + .7152 * f(x[1]) + .0722 * f(x[2]); };
    const kon = (a, b) => { const l1 = L(a), l2 = L(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
    const mix = (fg, a, bg) => [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a));
    /* Der Grund hinter der Zeile, Schicht für Schicht bis zum ersten deckenden. */
    const grund = el => {
      const schichten = [];
      for (let e = el; e; e = e.parentElement) {
        const c = rgb(getComputedStyle(e).backgroundColor);
        if (c.length && (c[3] ?? 1) > 0) { schichten.push(c); if ((c[3] ?? 1) >= 1) break; }
      }
      const seite = [document.body, document.documentElement].map(e => rgb(getComputedStyle(e).backgroundColor))
        .find(c => c.length && (c[3] ?? 1) >= 1);
      let g = seite ? seite.slice(0, 3) : [255, 255, 255];
      for (const c of schichten.reverse()) g = mix(c, c[3] ?? 1, g);
      return g;
    };
    const m = document.querySelector('.menu'); if (!m) return null;
    const on = m.querySelector('.menu-liste > button.on'); if (!on) return null;
    const c = rgb(getComputedStyle(on).color), g = grund(on), f = rgb(getComputedStyle(on).backgroundColor);
    return { jetzt: on.classList.contains('jetzt'), flaeche: f.length > 0 && (f[3] ?? 1) > 0,
             kontrast: Math.round(kon(mix(c, c[3] ?? 1, g), g) * 100) / 100,
             marke: !!m.querySelector('.menu-liste > .ru-marke') };
  })()`;
  for (const dunkel of [false, true]) {
    const a = await aufmachen({ dunkel });
    const { pc } = a;
    /* Dieselbe Form wie „Quelle wechseln" (steuerung.ts): die jetzige Quelle
       trägt `.on`, die Pfeile wählen mit `.jetzt` — zwei verschiedene Dinge. */
    await pc.evaluate(`UI.menuMitSuche(
      '<button data-c="a"><span class="mi">⛁</span>Aufgaben</button>' +
      '<button data-c="b" class="on"><span class="mi">⛁</span>Projekte</button>' +
      '<button data-c="c"><span class="mi">⛁</span>Lesestoff</button>',
      200, 200, { platzhalter: 'Datenquelle suchen …', kopf: '<div class="grp">Quelle wechseln</div>' })`);
    await pc.waitForTimeout(600);
    const s = await pc.evaluate(LESEN) as { jetzt: boolean; flaeche: boolean; kontrast: number; marke: boolean } | null;
    const wo = dunkel ? 'dunkel' : 'hell';
    p(`Menü mit Suche (${wo}): die jetzige Wahl (.on) behält ihre Fläche`, !!s && !s.jetzt && s.marke && s.flaeche, JSON.stringify(s));
    p(`… und ihre Schrift ist lesbar (≥ 4,5 : 1, ${wo})`, !!s && s.kontrast >= 4.5, JSON.stringify(s));
    if (!dunkel) {
      /* DER ZEIGER RUHT AUF DER GLOCKE. Die Karten fliegen aus der Glocke —
         also im ersten Bild UNTER dem Zeiger hervor. Für den Browser verliess
         er damit die Glocke, kam beim Wegfliegen zurück, und der Fächer ging
         zu und wieder auf, immer wieder (gesehen in den Streifen: ein
         Fächer, der flackert). Er geht EINMAL auf und bleibt.
         Und die Blase der Glocke (E462, „Posteingang, 3 ungelesen") steht
         genau dort, wo der Fächer aufgeht: er deckte sie zur Hälfte zu,
         „…ngelesen" ragte rechts heraus. Solange er offen ist, sagt ER, was
         in der Glocke liegt — die Blase geht. */
      await pc.keyboard.press('Escape');
      await pc.evaluate(`(() => { Werkzeuge.posteingangMelden({ text: 'Erinnerung: Elektro lernen', quelle: 'Erinnerungen' });
        Werkzeuge.posteingangMelden({ text: 'Karteikarten fällig: 12', quelle: 'Lernen' });
        const t = document.getElementById('toast'); if (t) t.classList.remove('show'); })()`);
      await pc.waitForTimeout(400);
      const gl = await rechteck(pc, '#studio-glocke');
      const ruhe = pc.evaluate(`new Promise(fertig => {
        let auf = 0, zu = 0, neu = 0, war = false, karte = null, blase = null;
        const t0 = performance.now();
        const schritt = () => {
          const f = document.getElementById('ru-glocken-faecher'), g = document.getElementById('studio-glocke');
          const offen = !!f && !f.hidden;
          if (offen && !war) auf++;
          if (!offen && war) zu++;
          war = offen;
          const k = f && f.querySelector('.ru-meldung');
          if (offen && k && karte && k !== karte) neu++;
          if (k) karte = k;
          const t = performance.now() - t0;
          if (t > 120 && t < 200 && blase === null) blase = getComputedStyle(g, '::after').display;
          if (t < 2600) requestAnimationFrame(schritt);
          else fertig({ auf, zu, neu, offen, vorher: blase, blase: getComputedStyle(g, '::after').display, zeigt: g.matches(':hover') });
        };
        requestAnimationFrame(schritt);
      })`) as Promise<{ auf: number; zu: number; neu: number; offen: boolean; vorher: string | null; blase: string; zeigt: boolean }>;
      if (gl) await pc.mouse.move(gl.l + gl.b / 2, gl.t + gl.h / 2);
      const r = await ruhe;
      p('Der Zeiger ruht auf der Glocke: der Fächer geht EINMAL auf und bleibt (kein Zu und Wieder-auf)',
        !!gl && r.auf === 1 && r.zu === 0 && r.neu === 0 && r.offen && r.zeigt, JSON.stringify(r));
      p('… erst die Blase, dann der Fächer — und mit offenem Fächer keine halb verdeckte Blase',
        !!gl && r.vorher === 'block' && r.offen && r.zeigt && r.blase === 'none', JSON.stringify(r));
      await pc.mouse.move(700, 700);
      await pc.waitForTimeout(500);
    }
    await a.zu();
  }
}

/* ==========================================================================
 * §13 · FÜNFTE DURCHSICHT (5. Oktober): der Fächer deckt die Reihe unter
 * der Glocke nicht zu. Er ging 8 px unter der Glocke auf, 340 × 242 px, und
 * lag am Rechner über „KI" und „Favorit" in der Kopfzeile der Seite. Wer auf
 * der Glocke verweilte und dann dorthin wollte — der kürzeste Weg, die
 * Knöpfe stehen direkt darunter —, fuhr in den Fächer, und solange der
 * Zeiger darauf lag, blieb er offen: ein Klick traf eine Meldung statt „KI".
 * Ein Weg, der vorher ging, war länger geworden („ohne eine funktione
 * löschen"). Gemessen am Treffer (`elementFromPoint`), nicht am Rechteck.
 * ========================================================================*/
{
  console.log('\n§13 Fünfte Durchsicht: der Fächer deckt die Knöpfe unter der Glocke nicht zu');
  const a = await aufmachen({});
  const { pc } = a;
  await pc.evaluate(`(() => {
    const s = Object.values(Store.cache.blocks).find(b => b.type === 'page' && b.text === 'Elektrotechnik Skript');
    if (s) App.oeffne(s.id);
    Werkzeuge.posteingangMelden({ text: 'Erinnerung: Elektro lernen', quelle: 'Erinnerungen' });
    Werkzeuge.posteingangMelden({ text: 'Karteikarten fällig: 12', quelle: 'Lernen' });
    const t = document.getElementById('toast'); if (t) t.classList.remove('show');
  })()`);
  await pc.waitForTimeout(700);
  const gl = await rechteck(pc, '#studio-glocke');
  const mitte = gl ? { x: gl.l + gl.b / 2, y: gl.t + gl.h / 2 } : { x: 0, y: 0 };
  /* Was direkt unter der Glocke steht und vom Fächer überlagert werden
     KÖNNTE: kleine Ziele (≤ 56 px hoch) in der Reihe darunter, waagerecht im
     Bereich des Fächers. Frei heisst: der Treffer in ihrer Mitte sind sie. */
  const REIHE = `(() => {
    const g = document.getElementById('studio-glocke').getBoundingClientRect();
    const f = document.getElementById('ru-glocken-faecher');
    const fr = f && !f.hidden ? f.getBoundingClientRect() : null;
    const ziele = [...document.querySelectorAll('button, a[href], [role="button"]')].filter(e => {
      if (!(e instanceof HTMLElement) || e.offsetParent === null || (f && f.contains(e))) return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.height <= 56 && r.top >= g.bottom - 2 && r.bottom <= g.bottom + 96
        && r.left < g.right && r.right > g.right - 340;
    });
    return { offen: !!fr, oben: fr ? Math.round(fr.top) : null, unten: fr ? Math.round(fr.bottom) : null,
      gUnten: Math.round(g.bottom), vh: innerHeight,
      ziele: ziele.map(e => { const r = e.getBoundingClientRect();
        const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { id: e.id || e.className.toString().slice(0, 20), frei: !!t && e.contains(t),
          x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }) };
  })()`;
  await pc.mouse.move(mitte.x, mitte.y);
  await pc.waitForTimeout(900);
  const r1 = await pc.evaluate(REIHE) as { offen: boolean; oben: number | null; unten: number | null; gUnten: number; vh: number;
    ziele: { id: string; frei: boolean; x: number; y: number }[] };
  const ki = r1.ziele.find(z => z.id === 'btn-ai');
  p('Zeigen auf die Glocke fächert auf — und „KI" steht in der Reihe darunter (sonst prüfte das nichts)',
    !!gl && r1.offen && !!ki, JSON.stringify(r1));
  p('Kein Knopf der Reihe unter der Glocke liegt unter dem Fächer (der Treffer in seiner Mitte ist er selbst)',
    r1.offen && r1.ziele.length > 0 && r1.ziele.every(z => z.frei), JSON.stringify(r1.ziele));
  p('… und der Fächer bleibt bei der Glocke und ganz im Bild (höchstens 96 px darunter)',
    r1.offen && r1.oben !== null && r1.unten !== null && r1.oben - r1.gUnten <= 96 && r1.oben > r1.gUnten && r1.unten <= r1.vh,
    JSON.stringify({ oben: r1.oben, unten: r1.unten, gUnten: r1.gUnten }));
  /* Der Weg von der Glocke zu „KI": der Zeiger ruht dort, dann ein Klick. */
  if (ki) {
    for (let k = 1; k <= 6; k++) {
      await pc.mouse.move(mitte.x + (ki.x - mitte.x) * k / 6, mitte.y + (ki.y - mitte.y) * k / 6);
      await pc.waitForTimeout(16);
    }
    await pc.waitForTimeout(450);
    await pc.mouse.down(); await pc.mouse.up();
    await pc.waitForTimeout(400);
  }
  const r2 = await pc.evaluate(`({ ki: !!document.getElementById('btn-ai')?.classList.contains('on'),
    faecher: (() => { const f = document.getElementById('ru-glocken-faecher'); return !!f && !f.hidden; })(),
    titel: document.title })`) as { ki: boolean; faecher: boolean; titel: string };
  p('Von der Glocke direkt zu „KI" und klicken: die KI geht auf, der Fächer ist zu', !!ki && r2.ki && !r2.faecher, JSON.stringify(r2));
  /* Und wer IN den Fächer will, kommt weiter hinein: über die Reihe hinweg,
     in weniger als den 280 ms, nach denen er zugeht. */
  await pc.evaluate(`document.getElementById('btn-ai')?.classList.contains('on') && App.kiPanel ? App.kiPanel(false) : 0`);
  await pc.mouse.move(700, 700); await pc.waitForTimeout(500);
  await pc.mouse.move(mitte.x, mitte.y); await pc.waitForTimeout(900);
  const karte = await rechteck(pc, '#ru-glocken-faecher .ru-meldung');
  if (karte) {
    const zx = karte.l + karte.b / 2, zy = karte.t + karte.h / 2;
    for (let k = 1; k <= 8; k++) {
      await pc.mouse.move(mitte.x + (zx - mitte.x) * k / 8, mitte.y + (zy - mitte.y) * k / 8);
      await pc.waitForTimeout(16);
    }
  }
  await pc.waitForTimeout(500);
  const r3 = await pc.evaluate(`(() => { const f = document.getElementById('ru-glocken-faecher');
    const k = f && f.querySelector('.ru-meldung'); const r = k && k.getBoundingClientRect();
    const t = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { offen: !!f && !f.hidden, aufKarte: !!t && !!k && k.contains(t) }; })()`) as { offen: boolean; aufKarte: boolean };
  p('Von der Glocke in den Fächer (über die Reihe hinweg): er bleibt offen, der Zeiger liegt auf der Karte', !!karte && r3.offen && r3.aufKarte,
    JSON.stringify(r3));
  await pc.mouse.move(700, 700);
  await pc.waitForTimeout(400);
  /* Nur die REIHE zählt: eine grosse Fläche, die unter der Glocke beginnt
     und weit hinunter reicht (eine Karte, ein Bild), schiebt den Fächer
     nicht von der Glocke weg — sonst stünde er irgendwo auf der Seite. */
  await pc.evaluate(`(() => { const g = document.getElementById('studio-glocke').getBoundingClientRect();
    const b = document.createElement('button'); b.id = 't588-gross'; b.textContent = 'Grosse Fläche';
    b.style.cssText = 'position:fixed;z-index:5;left:' + (g.right - 300) + 'px;top:' + (g.bottom + 4) + 'px;width:300px;height:220px';
    document.body.appendChild(b); })()`);
  await pc.mouse.move(mitte.x, mitte.y); await pc.waitForTimeout(900);
  const r4 = await pc.evaluate(REIHE) as { offen: boolean; oben: number | null; gUnten: number };
  p('Eine grosse Fläche unter der Glocke schiebt den Fächer nicht weg (höchstens 96 px darunter)',
    r4.offen && r4.oben !== null && r4.oben - r4.gUnten <= 96, JSON.stringify({ offen: r4.offen, oben: r4.oben, gUnten: r4.gUnten }));
  await pc.evaluate(`document.getElementById('t588-gross')?.remove()`);
  await pc.mouse.move(700, 700);
  await pc.waitForTimeout(400);
  await a.zu();
}

/* ==========================================================================
 * §14 · SECHSTE DURCHSICHT (5. Oktober): ein langer Druck unter einer
 * Meldung gehört dem, was darunter liegt. Die Karten und `#toast` sind
 * `pointer-events:none`; der Finger landet auf dem Inhalt darunter. Der
 * Stapel fing jeden waagerechten Zug über 12 px ab und hielt ihn an
 * (`stopPropagation` im Einfangen) — auch den, der nach langem Drücken
 * etwas trägt. In `test360` kam so die Kladde am Finger nicht mehr im Fach
 * an. Ein Schnippen fängt sofort an; wer erst lange hält, hebt etwas.
 * Gemessen an einer Fläche, die wie die Kladde ihre Bewegung selbst nimmt
 * (`touchmove` mit `preventDefault`, `touch-action` bleibt `auto`).
 * ========================================================================*/
{
  console.log('\n§14 Sechste Durchsicht: ein langer Druck unter einer Meldung trägt, was darunter liegt');
  const h = await aufmachen({ handy: true });
  await h.pc.evaluate(`(async () => {
    const page = Store.addPage(null, { text: 'Tragen unter dem Stapel', icon: '📄' });
    await Store.flush(); App.oeffne(page.id);
  })()`);
  await h.pc.waitForTimeout(700);
  await h.pc.evaluate(`(() => { UI.toast('Eins gespeichert', 9000); UI.toast('Zwei verschoben', 9000); })()`);
  await h.pc.waitForTimeout(600);
  /* Unter der Karte eine Fläche, die nach langem Drücken trägt (wie die
     Kladde: ihre eigenen Horcher, keine Sperre über `touch-action`). */
  const karte = await h.pc.evaluate(`(() => {
    const e = document.querySelector('#ru-toast-stapel .ru-toast-alt'); if (!e) return null;
    const r = e.getBoundingClientRect();
    const f = document.createElement('div'); f.id = 't588-traeger';
    f.style.cssText = 'position:fixed;z-index:5;left:' + r.left + 'px;top:' + (r.top - 10) + 'px;width:' + r.width + 'px;height:' + (r.height + 20) + 'px;background:transparent';
    window.t588Zug = { bewegt: 0, los: false };
    f.addEventListener('pointermove', () => { window.t588Zug.bewegt++; });
    f.addEventListener('pointerup', () => { window.t588Zug.los = true; });
    f.addEventListener('touchmove', ev => ev.preventDefault(), { passive: false });
    document.body.appendChild(f);
    return { x: r.left + 40, y: r.top + r.height / 2 };
  })()`) as { x: number; y: number } | null;
  if (karte) {
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: karte.x, y: karte.y }] });
    await h.pc.waitForTimeout(600);
    for (let i = 1; i <= 6; i++) {
      await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: karte.x + i * 20, y: karte.y }] });
      await h.pc.waitForTimeout(16);
    }
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await h.pc.waitForTimeout(500);
  }
  const r14 = await h.pc.evaluate(`({ ...window.t588Zug,
    karten: document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length,
    verschoben: document.querySelector('#ru-toast-stapel .ru-toast-alt')?.style.translate || '' })`) as
    { bewegt: number; los: boolean; karten: number; verschoben: string };
  p('Telefon: lange gedrückt, dann gezogen — der Zug kommt bei dem an, was unter der Meldung liegt',
    !!karte && r14.bewegt >= 5 && r14.los, JSON.stringify(r14));
  p('… und die Meldung bleibt stehen (der Zug war kein Wischen)', !!karte && r14.karten === 1 && !r14.verschoben,
    JSON.stringify(r14));
  /* Und das Schnippen gilt weiter — auch über dieser Fläche. */
  if (karte) {
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: karte.x, y: karte.y }] });
    for (let i = 1; i <= 6; i++) {
      await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: karte.x + i * 30, y: karte.y }] });
      await h.pc.waitForTimeout(8);
    }
    await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await h.pc.waitForTimeout(500);
  }
  p('… ein schnelles Schnippen nimmt sie aber weiter weg', !!karte &&
    await h.pc.evaluate(`document.querySelectorAll('#ru-toast-stapel .ru-toast-alt:not(.geht)').length === 0`));
  await h.zu();
}

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
