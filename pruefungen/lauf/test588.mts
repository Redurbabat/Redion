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
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Gegen den Stand b3cf1933 (vor E711) fällt sie in §1–§10: es gibt weder die
 * Marke noch den Stapel noch den Fächer. Gegenproben stehen im Commit E711.
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
    filter: document.querySelectorAll('filter#ru-goo').length,
    an: [...document.querySelectorAll('*')].filter(e => /ru-goo/.test(getComputedStyle(e).filter)).length,
    zahl: Werkzeuge.meldungen().length })`) as any;
  p('In Ruhe: höchstens EIN Goo-Filter im Dokument, an keinem Element', vorher.filter <= 1 && vorher.an === 0, JSON.stringify(vorher));
  const goo = pc.evaluate(`new Promise(fertig => {
    let max = 0; const t0 = performance.now();
    const schritt = () => {
      const n = [...document.querySelectorAll('.ru-goo-an')].filter(e => /ru-goo/.test(getComputedStyle(e).filter)).length;
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
    filter: document.querySelectorAll('filter#ru-goo').length,
    an: [...document.querySelectorAll('*')].filter(e => /ru-goo/.test(getComputedStyle(e).filter)).length,
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

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
