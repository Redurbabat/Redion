/* Suite 590 — Die Zeitpille und die Balkenkarte (E713)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat am 27. September um ca. 22:05 ein Video
 * geschickt („LIQUID GLASS") und geschrieben:
 *
 *     „Schau mal das auch an ich will das auch haben"
 *
 * Zwei Szenen daraus haben in Redion einen echten Ort (Karte der Szenen:
 * scratchpad `redion-map/liquid-redion-map.txt`, ### 02 und ### 06):
 *
 *   02 EXPAND — eine dunkle Pille „läuft gerade", die zur Karte aufgeht.
 *      In Redion ist das der ZEITMESSER (E268): nach ✕ lief die Uhr bisher
 *      UNSICHTBAR weiter — `Zeitmesser.stand()` sagte `laeuft:true`, auf dem
 *      Schirm stand nichts. Das Feld hatte kein Escape, und am Telefon schien
 *      der Seitentext durch seine Fläche.
 *   06 MEASURE — eine Karte mit Balken, die einmal wachsen, einer Zahl, die
 *      hochzählt, und einem gewählten Tag mit Hinweis. In Redion ist das der
 *      Verlauf der Lernwelt (`historie()`, „Letzte 7 Tage", „Wochenverlauf",
 *      „Monatsverlauf"): bisher sieben stumme `<progress>`, nicht wählbar.
 *
 * DIESER LAUF PRÜFT ZUSAGEN ALS ZAHLEN, NICHT ALS „SIEHT GUT AUS":
 *
 *   §1 DIE PILLE. Läuft die Uhr und ist das Feld zu, steht eine Pille da:
 *      ein Knopf mit Uhrzeit und Seite, mindestens 44 px hoch (§37), über
 *      der unteren Leiste und nicht auf ihr, deckend (sie ruht, E703).
 *      Ohne laufende Uhr gibt es keine.
 *   §2 DER TROPFEN WIRD KARTE. Ein Tipp auf die Pille öffnet das Feld, und
 *      zwar AUS der Pille: im ersten Bild ist die Karte kleiner als am Ende
 *      und steht bei der Pille; bewegt werden nur `transform` und `opacity`;
 *      nach der Fahrt steht sie ruhig an ihrem Platz. Der Fokus geht hinein.
 *   §3 ESCAPE. Escape schliesst das Feld (§38) — zurück in die Pille, und
 *      der Fokus kehrt zur Pille zurück. Die Uhr läuft weiter (E268 §6).
 *   §4 DIE KARTE. Die Seite ist der Titel; der Timer hat einen Fortschritt
 *      (role=progressbar, echter Wert); Pause ↔ Weiter wechselt AN ORT UND
 *      STELLE (derselbe Knopf, das Zeichen tauscht: zwei Figuren, eine
 *      sichtbar); Beenden nimmt die Pille mit.
 *   §5 AM TELEFON DECKEND. Das Feld hat am Telefon einen deckenden Boden —
 *      kein Seitentext scheint mehr durch.
 *   §6 OHNE BEWEGUNG. Mit „weniger Bewegung" und mit „Ruhige Darstellung"
 *      geht die Karte sofort auf: keine laufende Animation, kein Versatz.
 *   §7 DIE BALKENKARTE. Der Verlauf ist eine Gruppe mit Namen; jeder Tag ist
 *      ein Knopf mit Datum und Zahl im Namen; die Höhen folgen den ECHTEN
 *      Zahlen; die Balken wachsen einmal (nur `transform`) und ruhen dann.
 *   §8 EIN TAG WIRD GEWÄHLT. Tipp wählt (aria-pressed), ein Hinweis nennt
 *      „Wochentag · N Wiederholungen" und bleibt in der Karte; → und ←,
 *      Pos1 und Ende wandern, ein Tabstopp für die ganze Reihe.
 *   §9 DIE ZAHL ZÄHLT HOCH — und steht am Ende auf dem echten Wert; ohne
 *      Bewegung steht sie sofort dort.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Gegen den Stand b3cf1933 (vor E713) fällt er in §1–§9: es gibt keine
 * Pille, kein Escape, keinen deckenden Boden, keine Knöpfe im Verlauf.
 * Die Gegenproben stehen im Bericht zu E713.
 *
 *   node pruefungen/alle.mts 590
 * ==========================================================================*/
import { chromium, type Page } from 'playwright';
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

type Auf = { pc: Page; zu: () => Promise<void> };
const aufmachen = async (o: { handy?: boolean; weniger?: boolean; ruhig?: boolean; dunkel?: boolean } = {}): Promise<Auf> => {
  const kontext = await browser.newContext({
    viewport: o.handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: !!o.handy, isMobile: !!o.handy,
    colorScheme: o.dunkel ? 'dark' : 'light',
    ...(o.weniger ? { reducedMotion: 'reduce' as const } : {})
  });
  const pc = await kontext.newPage();
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 150)));
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  const bereit = 'typeof App !== "undefined" && typeof Store !== "undefined" && typeof Zeitmesser !== "undefined" && !!document.querySelector("#page")';
  await pc.waitForFunction(bereit);
  await pc.waitForTimeout(1400);
  /* Lädt der Browser die Seite unter Last einmal neu (gesehen in §6: „Execution
     context was destroyed"), wird die Einrichtung EINMAL wiederholt — sie ist
     Vorbereitung, keine Zusage. */
  for (let versuch = 0; ; versuch++) {
    try { await einrichten(pc, o); break; } catch (e) {
      if (versuch > 0 || !/context was destroyed|navigation/i.test(String(e))) throw e;
      await pc.waitForLoadState('load');
      await pc.waitForFunction(bereit);
      await pc.waitForTimeout(1400);
    }
  }
  await pc.waitForTimeout(700);
  return { pc, zu: () => kontext.close() };
};

const einrichten = (pc: Page, o: { ruhig?: boolean; dunkel?: boolean }): Promise<unknown> =>
  pc.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    App.theme(${o.dunkel ? "'dark'" : "'light'"});
    ${o.ruhig ? "document.body.dataset.bewegung = 'ruhig';" : ''}
    const s = Store.addPage(null, { text: 'Elektrotechnik Skript' });
    Store.addBlock(s.id, 'text', { text: 'U = R · I, und daraus P = U · I. Die Leistung steigt mit dem Strom.' });
    /* ECHTE Wiederholungen über sieben Tage: 3 5 2 6 9 7 4, zusammen 36. */
    const tage = [3, 5, 2, 6, 9, 7, 4];
    let n = 0;
    for (let d = 6; d >= 0; d--) {
      for (let k = 0; k < tage[6 - d]; k++) {
        const at = new Date(); at.setDate(at.getDate() - d); at.setHours(9 + k % 8, 10 + k);
        const c = Store.addBlock(s.id, 'flashcard', { text: 'Frage ' + (++n) + ' :: Antwort ' + n });
        Store.updateBlock(c.id, { reviewVerlauf: [{ id: 'r' + n, at: at.toISOString(), rating: 3 }],
          sr: { wdh: 1, faellig: new Date(Date.now() + 86400000).toISOString() } });
      }
    }
    await Store.flush();
    App.oeffne(s.id);
    window.__seite = s.id;
  })()`);

type Kasten = { x: number; y: number; b: number; h: number; unten: number; rechts: number } | null;
const kasten = (pc: Page, wahl: string): Promise<Kasten> => pc.evaluate(`(() => {
  const e = document.querySelector(${JSON.stringify(wahl)});
  if (!e) return null;
  const r = e.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: r.left, y: r.top, b: r.width, h: r.height, unten: r.bottom, rechts: r.right };
})()`) as Promise<Kasten>;

const deckkraft = (pc: Page, wahl: string): Promise<number> => pc.evaluate(`(() => {
  const e = document.querySelector(${JSON.stringify(wahl)});
  if (!e) return -1;
  const f = getComputedStyle(e).backgroundColor;
  const m = f.match(/rgba?\\(([^)]+)\\)/);
  if (!m) return -1;
  const t = m[1].split(/[ ,\\/]+/).filter(Boolean);
  return t.length > 3 ? Number(t[3]) : 1;
})()`) as Promise<number>;

/* Nur `transform` und `opacity` — gelesen aus den LAUFENDEN Animationen.
   Gezählt wird die FAHRT (Web-Animationen); die Zier des Dreierblocks
   (E535, `rmo-…`: Linien, die sich zeichnen) und Übergänge beim Anfassen
   der Tasten sind nicht die Fahrt. */
const bewegteEigenschaften = (pc: Page, wahl: string): Promise<string[]> => pc.evaluate(`(() => {
  const e = document.querySelector(${JSON.stringify(wahl)});
  if (!e) return ['(fehlt)'];
  const raus = new Set();
  for (const a of e.getAnimations({ subtree: true })) {
    if (String(a.animationName || '').startsWith('rmo-')) continue;
    if (a.transitionProperty) continue;
    const eff = a.effect;
    if (!eff || !eff.getKeyframes) continue;
    for (const k of eff.getKeyframes()) for (const n of Object.keys(k))
      if (!['offset', 'computedOffset', 'easing', 'composite'].includes(n)) raus.add(n);
  }
  return [...raus];
})()`) as Promise<string[]>;

/* ══ §1–§5 · Telefon, dunkel ════════════════════════════════════════════ */
{
  const a = await aufmachen({ handy: true, dunkel: true });
  /* Bricht ein Schritt ab (etwa ohne Pille, vor E713), zählt das als EIN
     Fehler, und der Lauf geht weiter — damit er rot ZÄHLT, statt zu stürzen. */
  try {
  console.log('\n1 · Die Pille');
  p('Ohne laufende Uhr gibt es keine Pille', await kasten(a.pc, '#zm-pille') === null);
  await a.pc.evaluate(`(() => { Zeitmesser.panel(); Zeitmesser.start('timer', 25 * 60); })()`);
  await a.pc.waitForTimeout(1300);
  await a.pc.evaluate(`document.querySelector('.zm-feld [data-zm="zu"]')?.click()`);
  await a.pc.waitForTimeout(1100);
  const pille = await kasten(a.pc, '#zm-pille');
  const leiste = await kasten(a.pc, '#handy-oben');
  const text = await a.pc.evaluate(`(() => {
    const e = document.querySelector('#zm-pille');
    return e ? { text: (e.textContent || '').replace(/\\s+/g, ' ').trim(), name: e.getAttribute('aria-label') || '',
      knopf: e.tagName === 'BUTTON', feld: !!document.querySelector('.zm-feld'), laeuft: Zeitmesser.stand().laeuft } : null;
  })()`) as any;
  p('Feld zu, Uhr läuft — und jetzt steht eine Pille da', !!pille && text?.laeuft && !text?.feld, JSON.stringify(text));
  p('Sie ist ein Knopf, zeigt Restzeit und Seite und hat einen Namen',
    !!text?.knopf && /\d\d:\d\d/.test(text?.text || '') && /Elektrotechnik/.test(text?.text || '') && /Zeitmesser/.test(text?.name || ''),
    JSON.stringify(text));
  p('Mindestens 44 px hoch (§37)', !!pille && pille.h >= 44, JSON.stringify(pille));
  p('Über der unteren Leiste, nicht auf ihr', !!pille && !!leiste && pille.unten <= leiste.y + 0.5,
    JSON.stringify({ pille, leiste }));
  p('Deckend — sie ruht, also kein Glas (E703)', await deckkraft(a.pc, '#zm-pille') >= 0.9);

  console.log('\n2 · Der Tropfen wird Karte');
  const vorher = await kasten(a.pc, '#zm-pille');
  const flug = await a.pc.evaluate(`(async () => {
    const pille = document.querySelector('#zm-pille');
    pille.click();
    const feld = document.querySelector('.zm-feld');
    if (!feld) return null;
    await new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f)));
    const r1 = feld.getBoundingClientRect();
    const anims = feld.getAnimations({ subtree: true }).length;
    await new Promise(f => setTimeout(f, 1300));
    const r2 = feld.getBoundingClientRect();
    const fokus = feld.contains(document.activeElement);
    const pilleSichtbar = !!pille.isConnected && getComputedStyle(pille).visibility !== 'hidden' && !pille.hidden
      && Number(getComputedStyle(pille).opacity) > 0.05;
    const ruhe = feld.getAnimations({ subtree: true }).filter(x => x.playState === 'running'
      && !(x.animationName || '').startsWith('rmo-')).length;
    return { r1: { b: r1.width, h: r1.height, x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 },
             r2: { b: r2.width, h: r2.height, x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 },
             anims, fokus, pilleSichtbar, ruhe };
  })()`) as any;
  p('Das Feld geht auf', !!flug);
  /* Die Pille ist breit (Uhr und Seite), die Karte hoch: gemessen wird die
     FLÄCHE — im ersten Bild höchstens die Hälfte der Karte — und die Höhe. */
  p('Im ersten Bild ist die Karte kleiner als am Ende — sie wächst aus der Pille',
    !!flug && flug.r1.b * flug.r1.h < flug.r2.b * flug.r2.h * 0.5 && flug.r1.h < flug.r2.h * 0.8, JSON.stringify(flug));
  p('… und steht dabei bei der Pille', !!flug && !!vorher &&
    Math.abs(flug.r1.y - (vorher.y + vorher.h / 2)) < Math.abs(flug.r2.y - (vorher.y + vorher.h / 2)) + 1,
    JSON.stringify({ flug: flug?.r1, pille: vorher }));
  p('Nach der Fahrt steht sie ruhig (keine laufende Bewegung ausser der Lampe)', !!flug && flug.ruhe === 0,
    JSON.stringify(flug));
  p('Die Pille ist fort, solange die Karte offen ist', !!flug && !flug.pilleSichtbar);
  p('Der Fokus ist in der Karte', !!flug && flug.fokus);
  const bewegt: string[] = [];
  await a.pc.evaluate(`document.querySelector('.zm-feld [data-zm="zu"]')?.click()`);
  await a.pc.waitForTimeout(900);
  await a.pc.evaluate(`document.querySelector('#zm-pille')?.click()`);
  await a.pc.waitForTimeout(90);
  bewegt.push(...await bewegteEigenschaften(a.pc, '.zm-feld'));
  await a.pc.waitForTimeout(1200);
  p('Bewegt werden nur transform und opacity',
    bewegt.length > 0 && bewegt.every(n => n === 'transform' || n === 'opacity' || n === 'scale'),
    JSON.stringify(bewegt));

  console.log('\n3 · Escape');
  await a.pc.keyboard.press('Escape');
  await a.pc.waitForTimeout(1000);
  const nachEsc = await a.pc.evaluate(`(() => ({
    feld: !!document.querySelector('.zm-feld'),
    pille: !!document.querySelector('#zm-pille') && !document.querySelector('#zm-pille').hidden,
    fokus: document.activeElement && document.activeElement.id,
    laeuft: Zeitmesser.stand().laeuft }))()`) as any;
  p('Escape schliesst das Feld', !nachEsc.feld, JSON.stringify(nachEsc));
  p('… zurück in die Pille, die Uhr läuft weiter', nachEsc.pille && nachEsc.laeuft, JSON.stringify(nachEsc));
  p('… und der Fokus kehrt zur Pille zurück', nachEsc.fokus === 'zm-pille', JSON.stringify(nachEsc));

  console.log('\n4 · Die Karte');
  await a.pc.evaluate(`document.querySelector('#zm-pille')?.click()`);
  await a.pc.waitForTimeout(1100);
  const karte = await a.pc.evaluate(`(() => {
    const f = document.querySelector('.zm-feld');
    const leiste = f?.querySelector('[role="progressbar"]');
    return { titel: (f?.querySelector('.zm-titel')?.textContent || '').trim(),
      rolle: !!leiste, wert: Number(leiste?.getAttribute('aria-valuenow') || 0),
      hoechst: Number(leiste?.getAttribute('aria-valuemax') || 0),
      text: leiste?.getAttribute('aria-valuetext') || '' };
  })()`) as any;
  p('Die Seite ist der Titel der Karte', karte.titel === 'Elektrotechnik Skript', JSON.stringify(karte));
  p('Der Timer zeigt seinen Fortschritt mit echtem Wert (Sekunden von 1500)',
    karte.rolle && karte.hoechst === 1500 && karte.wert >= 1 && karte.wert < 1500 && /von 25/.test(karte.text),
    JSON.stringify(karte));
  const tausch = await a.pc.evaluate(`(async () => {
    const f = document.querySelector('.zm-feld');
    const k = f.querySelector('[data-zm="pause"]');
    k.click();
    await new Promise(r => setTimeout(r, 900));
    const k2 = f.querySelector('[data-zm="pause"]');
    const sicht = fig => { const e = k2.querySelector('[data-figur="' + fig + '"]'); return e ? Number(getComputedStyle(e).opacity) : -1; };
    return { gleich: k === k2, wort: (k2.textContent || '').trim(), zustand: f.querySelector('.rmo-transport')?.getAttribute('data-zustand'),
      pause: sicht('pause'), weiter: sicht('weiter'), pausiert: Zeitmesser.stand().pausiert };
  })()`) as any;
  p('Pause wechselt an Ort und Stelle — derselbe Knopf, jetzt „Weiter"',
    tausch.gleich && /Weiter/.test(tausch.wort) && tausch.zustand === 'pausiert' && tausch.pausiert, JSON.stringify(tausch));
  p('Das Zeichen tauscht: das Dreieck steht, die Balken sind fort', tausch.weiter > 0.9 && tausch.pause >= 0 && tausch.pause < 0.1,
    JSON.stringify(tausch));
  await a.pc.evaluate(`document.querySelector('.zm-feld [data-zm="stopp"]')?.click()`);
  await a.pc.evaluate(`document.querySelector('.zm-feld [data-zm="zu"]')?.click()`);
  await a.pc.waitForTimeout(900);
  p('Beenden nimmt die Pille mit', await kasten(a.pc, '#zm-pille') === null);

  console.log('\n5 · Am Telefon deckend');
  await a.pc.evaluate(`Zeitmesser.panel()`);
  await a.pc.waitForTimeout(600);
  const boden = await deckkraft(a.pc, '.zm-feld');
  p('Das Feld hat am Telefon einen deckenden Boden (kein Text scheint durch)', boden === 1, String(boden));
  await a.pc.evaluate(`document.querySelector('.zm-feld [data-zm="zu"]')?.click()`);
  } catch (e) { p('§1–§5 laufen bis zum Ende durch', false, String(e).split('\n')[0]); }
  await a.zu();
}

/* ══ §6 · Ohne Bewegung ═════════════════════════════════════════════════ */
console.log('\n6 · Ohne Bewegung');
for (const art of ['weniger', 'ruhig'] as const) {
  const a = await aufmachen({ handy: true, weniger: art === 'weniger', ruhig: art === 'ruhig' });
  await a.pc.evaluate(`(() => { Zeitmesser.start('stoppuhr'); })()`);
  await a.pc.waitForTimeout(700);
  const sofort = await a.pc.evaluate(`(async () => {
    const pille = document.querySelector('#zm-pille');
    if (!pille) return null;
    pille.click();
    const f = document.querySelector('.zm-feld');
    await new Promise(r => requestAnimationFrame(() => r(null)));
    const laufend = f ? f.getAnimations().filter(x => x.playState === 'running').length : -1;
    const t = f ? getComputedStyle(f).transform : '';
    Zeitmesser.stopp();
    return { laufend, t };
  })()`) as any;
  p((art === 'weniger' ? '„Weniger Bewegung"' : '„Ruhige Darstellung"') + ': die Karte ist sofort da, ohne Fahrt',
    !!sofort && sofort.laufend === 0 && (sofort.t === 'none' || sofort.t === 'matrix(1, 0, 0, 1, 0, 0)'), JSON.stringify(sofort));
  await a.zu();
}

/* ══ §7–§9 · Die Balkenkarte, am Rechner ════════════════════════════════ */
{
  const a = await aufmachen({ handy: false, dunkel: false });
  try {
  console.log('\n7 · Die Balkenkarte');
  await a.pc.evaluate(`Lernwelt.oeffnen('fortschritt')`);
  await a.pc.waitForTimeout(80);
  const frueh = await a.pc.evaluate(`(() => {
    const k = document.querySelector('.lw-history');
    const s = k?.querySelector('.lw-verlauf-summe');
    const anims = k ? k.getAnimations({ subtree: true }) : [];
    const props = new Set();
    for (const x of anims) for (const f of (x.effect?.getKeyframes?.() || []))
      for (const n of Object.keys(f)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(n)) props.add(n);
    return { summe: Number((s?.textContent || '').replace(/[^0-9]/g, '')), anims: anims.length, props: [...props] };
  })()`) as any;
  await a.pc.waitForTimeout(1600);
  const karte = await a.pc.evaluate(`(() => {
    const k = document.querySelector('.lw-history');
    if (!k) return null;
    const tage = [...k.querySelectorAll('button[data-lw-tag]')];
    const hoehe = b => { const s = b.querySelector('.lw-verlauf-saeule i'); return s ? s.getBoundingClientRect().height : 0; };
    return { rolle: k.getAttribute('role'), name: k.getAttribute('aria-label') || '',
      anzahl: tage.length, namen: tage.map(b => b.getAttribute('aria-label') || ''),
      hoehen: tage.map(hoehe), stopps: tage.filter(b => b.tabIndex === 0).length,
      summe: Number((k.querySelector('.lw-verlauf-summe')?.textContent || '').replace(/[^0-9]/g, '')),
      ruhe: k.getAnimations({ subtree: true }).filter(x => x.playState === 'running').length,
      monat: document.querySelectorAll('.lw-history')[1]?.querySelectorAll('button[data-lw-tag]').length || 0 };
  })()`) as any;
  p('Der Verlauf ist eine Gruppe mit Namen', karte?.rolle === 'group' && /7 Tage/.test(karte?.name || ''), JSON.stringify(karte?.rolle));
  p('Jeder Tag ist ein Knopf — 7 im Wochen-, 30 im Monatsverlauf', karte?.anzahl === 7 && karte?.monat === 30,
    JSON.stringify({ w: karte?.anzahl, m: karte?.monat }));
  p('Jeder Knopf nennt Datum und Zahl', !!karte && karte.namen.every((n: string) => /^\d{1,2}\.\d{1,2}\.\d{4}: \d+ Wiederholung/.test(n)),
    JSON.stringify(karte?.namen?.slice(0, 2)));
  const h = (karte?.hoehen || []) as number[];
  const zahlen = [3, 5, 2, 6, 9, 7, 4];
  const verh = h.length === 7 && h[4]! > 0 ? h.map(x => x / h[4]!) : [];
  p('Die Höhen folgen den echten Zahlen (3 5 2 6 9 7 4)',
    verh.length === 7 && verh.every((v, i) => Math.abs(v - zahlen[i]! / 9) < 0.06), JSON.stringify(h.map(x => Math.round(x))));
  p('Die Balken wachsen einmal — bewegt wird nur transform',
    frueh.anims > 0 && frueh.props.length > 0 && frueh.props.every((n: string) => n === 'transform' || n === 'opacity'),
    JSON.stringify(frueh));
  p('… und ruhen danach', karte?.ruhe === 0, String(karte?.ruhe));

  console.log('\n8 · Ein Tag wird gewählt');
  await a.pc.locator('.lw-history').first().locator('button[data-lw-tag="4"]').click();
  await a.pc.waitForTimeout(700);
  const wahl = await a.pc.evaluate(`(() => {
    const k = document.querySelector('.lw-history');
    const t = k.querySelector('.lw-verlauf-tipp');
    const kr = k.getBoundingClientRect(), tr = t ? t.getBoundingClientRect() : null;
    return { gedrueckt: [...k.querySelectorAll('button[aria-pressed="true"]')].map(b => b.dataset.lwTag),
      tipp: t && !t.hidden ? (t.textContent || '').replace(/\\s+/g, ' ').trim() : '',
      drin: !!tr && tr.left >= kr.left - 0.5 && tr.right <= kr.right + 0.5,
      fokus: document.activeElement?.dataset?.lwTag };
  })()`) as any;
  p('Tipp wählt den Tag (aria-pressed)', JSON.stringify(wahl.gedrueckt) === '["4"]', JSON.stringify(wahl));
  p('Der Hinweis nennt „Wochentag · 9 Wiederholungen"', /^[A-Z][a-z]\.? · 9 Wiederholungen$/.test(wahl.tipp), wahl.tipp);
  p('… und bleibt in der Karte', wahl.drin, JSON.stringify(wahl));
  await a.pc.keyboard.press('ArrowRight');
  await a.pc.waitForTimeout(250);
  const rechts = await a.pc.evaluate(`[...document.querySelector('.lw-history').querySelectorAll('button[aria-pressed="true"]')].map(b => b.dataset.lwTag).join() + '|' + document.activeElement?.dataset?.lwTag + '|' + (document.querySelector('.lw-history .lw-verlauf-tipp')?.textContent || '')`) as string;
  p('→ wandert zum nächsten Tag (Wahl, Fokus und Hinweis)', /^5\|5\|.*7 Wiederholungen/.test(rechts), rechts);
  await a.pc.keyboard.press('Home');
  await a.pc.waitForTimeout(200);
  const anfang = await a.pc.evaluate(`document.activeElement?.dataset?.lwTag`) as string;
  await a.pc.keyboard.press('End');
  await a.pc.waitForTimeout(200);
  const ende = await a.pc.evaluate(`document.activeElement?.dataset?.lwTag + '|' + [...document.querySelector('.lw-history').querySelectorAll('button')].filter(b => b.tabIndex === 0).length`) as string;
  p('Pos1 und Ende springen an die Enden; ein Tabstopp für die Reihe', anfang === '0' && ende === '6|1', anfang + ' / ' + ende);

  console.log('\n9 · Die Zahl zählt hoch');
  p('Kurz nach dem Öffnen steht sie noch unter dem Ziel', frueh.summe < 36, String(frueh.summe));
  p('… und am Ende auf dem echten Wert (36 in 7 Tagen)', karte?.summe === 36, String(karte?.summe));
  await a.zu();
  const b = await aufmachen({ handy: false, weniger: true });
  await b.pc.evaluate(`Lernwelt.oeffnen('fortschritt')`);
  await b.pc.waitForTimeout(60);
  const still = await b.pc.evaluate(`(() => {
    const k = document.querySelector('.lw-history');
    return { summe: Number((k?.querySelector('.lw-verlauf-summe')?.textContent || '').replace(/[^0-9]/g, '')),
      laufend: k ? k.getAnimations({ subtree: true }).filter(x => x.playState === 'running').length : -1 };
  })()`) as any;
  p('Ohne Bewegung: die Zahl steht sofort, kein Balken fährt', still.summe === 36 && still.laufend === 0, JSON.stringify(still));
  await b.zu();
  } catch (e) { p('§7–§9 laufen bis zum Ende durch', false, String(e).split('\n')[0]); }
}

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
