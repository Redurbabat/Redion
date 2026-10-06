/* Suite 596 — Kein toter Knopf (E720)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur, PDF vom 29. September 2026, Seite 21, zum
 * Lernzentrum:
 *
 *     „beim fählermeldung habe ich keien buttons efeck also wie bein
 *      tagesrunde … und ausserdem bei der Neue karte, Prüfungsfokus … und
 *      bei alle wo eine buttons gibt füge das im enscheideung und claude.md"
 *
 * „Tagesrunde · Starten" leuchtet unter dem Zeiger, die Buchstaben platzen
 * auf, der Rand glimmt. „Fehlertraining · Trainieren", „Neue Karten ·
 * Lernen", „Prüfungsfokus" und die Trainer-Kachel taten NICHTS — derselbe
 * Grund, derselbe Rand, dieselbe Farbe vor und unter dem Zeiger.
 *
 * ZWEI URSACHEN, beide gemessen, bevor gebaut wurde (messungen §90):
 *   (a) `lernwelt.css` schreibt die geteilten Hover-Regeln als
 *       `.lernwelt :where(… .lw-study-actions button …):hover` (0,2,0). Die
 *       Grundregel jedes Knopfes, etwa `.lernwelt .lw-study-actions button`
 *       (0,2,1), wiegt mehr — die Hover-Erklärung kommt nie an. Das traf
 *       nicht vier Knöpfe, sondern siebzehn in fünf Ansichten (der Plan
 *       hatte zwanzig geschätzt; gezählt hat es §1, messungen §90).
 *   (b) Nur die Tagesrunde ist ein Funkel. Der Funkel hat keinen Zustand
 *       für `data-gedrueckt` (press.ts, E702) — ein kurzer Tipp am iPhone
 *       malt `:active` oft gar nicht, also sah man nichts.
 *
 * DIESER LAUF PRÜFT DIE ZUSAGEN ALS ZAHLEN:
 *
 *   §1 KEIN TOTER KNOPF. In den Ansichten Heute, Lernen, Fehler, Lernweg,
 *      Prüfungen und Fortschritt, am Rechner (1440 × 900), hell und
 *      dunkel: jeder sichtbare, freigegebene Knopf ändert unter dem Zeiger
 *      mindestens eine gemalte Eigenschaft (an sich, an `::before`/`::after`
 *      oder an einem direkten Kind). Gemessen nach dem Ende der Übergänge.
 *   §2 TASTENFOKUS. Die fünf Knöpfe der Lernzentrale zeigen unter
 *      `:focus-visible` einen Ring von mindestens 2 px.
 *   §3 DIE FÜNF SIND EIN BAUTEIL. Tagesrunde, Fehlertraining, Neue Karten,
 *      Prüfungsfokus und Trainer sind `.ru-funkel` mit Buchstaben in
 *      `.ru-funkel-b`; ihre Wörter und Vorlesenamen bleiben dieselben.
 *   §4 DERSELBE SCHEIN. Unter dem Zeiger hat „Trainieren" Grund, Rand,
 *      Schein (`::before`), Licht (`::after`) und Buchstabenlauf der
 *      „Starten"-Taste — Wert für Wert.
 *   §5 IN RUHE EINE LAUTE FLÄCHE. Ohne Zeiger trägt nur „Starten" den
 *      dunklen Funkelgrund mit Schein; die vier anderen ruhen als
 *      Umrissknöpfe ohne Schein und ohne glimmende Buchstaben (E701,
 *      „Genau eine je Bild").
 *   §6 DRUCK MIT DER MAUS. Maus unten: `data-gedrueckt` steht, und der
 *      Knopf sieht anders aus als in Ruhe.
 *   §7 EIN KURZER TIPP. Am Telefon (390 × 844, Touch, `hover: none`):
 *      (a) Fingertipp ab und sofort wieder auf setzt `data-gedrueckt` an
 *      allen fünf; (b) `data-gedrueckt` ALLEIN — ohne Zeiger, ohne
 *      `:active` — ändert, was man sieht; (c) nach dem Loslassen klebt
 *      kein Schein.
 *   §8 KEIN KLEBENDER SCHEIN. Am Telefon behalten die KI-Werkzeuge
 *      (`#ai .ai-quick button.ru-funkel`) nach einem Tipp keinen Schein:
 *      Rand und `::before` stehen wieder auf ihrem Ruhewert — und auch ein
 *      ERZWUNGENES `:hover` (wie es am iPhone nach dem Tipp kleben bleibt)
 *      malt auf einem Gerät ohne Zeiger nichts.
 *   §9 EIN GESPERRTER KNOPF BLEIBT STILL. Mit leerem Bestand (keine
 *      Fehler, keine Karten — der Anfang jedes neuen Lernenden) stehen
 *      „Starten · 0", „Trainieren · 0" und „Lernen · 0" gesperrt da. Unter
 *      dem Zeiger und mit `data-gedrueckt` darf ein gesperrter Knopf in
 *      keiner Ansicht anders aussehen als in Ruhe — kein Licht (`::after`),
 *      kein Buchstabenlauf, kein Rand, kein Grund. Sonst wirkt ein toter
 *      Knopf lebendig, und das ist das Gegenteil von §1 (Durchsicht vom
 *      6. Oktober: „Trai  en · 0" mit hellblauem Schein, gesperrt).
 *  §10 IN ALLEN ZEHN SCHEMATA. (a) In Ruhe trägt „Starten" ein Zeichen,
 *      das die stillen Funkel nicht tragen: Schein oder glimmende
 *      Buchstaben (§5) — und im Starken Kontrast, wo #101010 auf Schwarz
 *      kaum 1,04 : 1 hat, dazu eines mit Gewicht: einen Grund mit 1,5 : 1
 *      gegen die stillen oder einen Rand von mindestens 2 px, der sich mit
 *      3 : 1 vom Grund darunter abhebt (E701 §1: EINE laute Fläche). (b) Gedrückt (`data-gedrueckt`) liest sich die Schrift
 *      aller fünf mit 4,5 : 1 oder mehr gegen den Grund, den sie dann hat
 *      — ein Fingertipp darf das Wort nicht wegwischen.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Gegen den Stand 1bfaca53 (claude/morgen-besser-2) rot — die Zeilen
 *   stehen im Commit „test596 (rot)". Die Gegenproben zu E720 stehen im
 *   Commit dazu: `:is` zurück auf `:where` → §1 rot; die Regeln für
 *   `[data-gedrueckt]` heraus → §7 rot.
 *
 *   node pruefungen/lauf/test596.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
/* Ein freier Port vom System (L205) — kein fester. */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (s: Page, ms: number) => s.waitForTimeout(ms);

const oeffnen = async (handy: boolean, thema: 'light' | 'dark'): Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    ...(handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {})
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate((t: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    App.theme(t);
  }, thema);
  await s.mouse.move(2, 2);
  return { ctx, s };
};

/* Ein Bestand, in dem jede Lernzentrale-Kachel etwas zu tun hat: zwei
   Fehler, eine fällige Karte, drei neue, eine Prüfung. */
const BESTAND = async () => {
  const fach = Store.addPage(null, { text: 'Elektrotechnik' });
  const vorbei = new Date(Date.now() - 2 * 86400000).toISOString();
  const at = new Date(Date.now() - 3 * 86400000).toISOString();
  const fehler = (text: string, n: string) => Store.addBlock(fach.id, 'flashcard', {
    text, sr: { ease: 2.3, intervall: 1, wdh: 1, faellig: vorbei },
    reviewVerlauf: { [n]: { id: n, at, rating: 1, algorithm: 'sm2' } } });
  fehler('Ohmsches Gesetz :: U = R · I', 'f1');
  fehler('Leistung :: P = U · I', 'f2');
  Store.addBlock(fach.id, 'flashcard', { text: 'Arbeit :: W = P · t',
    sr: { ease: 2.5, intervall: 3, wdh: 2, faellig: vorbei },
    reviewVerlauf: { r1: { id: 'r1', at, rating: 4, algorithm: 'sm2' } } });
  for (const q of ['Widerstand :: Ohm', 'Spannung :: Volt', 'Strom :: Ampere'])
    Store.addBlock(fach.id, 'flashcard', { text: q });
  await Store.flush();
};

/* Übergänge auf null, damit der Endzustand sofort gemessen wird. Die
   Bewegungen (`animation`) bleiben — der Buchstabenlauf IST ein Zustand. */
const OHNE_UEBERGANG = `(() => { const st = document.createElement('style'); st.id = 't596-ohne';
  st.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important}';
  document.head.append(st); })()`;

/** Was „gemalt" ist: am Knopf, an seinen zwei Pseudo-Elementen und an seinen
 *  direkten Kindern. Als Zeichenkette, damit jeder `evaluate` dieselbe hat. */
const BILD = `window.__bild = (el) => {
  const k = getComputedStyle(el), v = getComputedStyle(el, '::before'), n = getComputedStyle(el, '::after');
  const teil = (c) => [c.backgroundColor, c.backgroundImage, c.borderTopColor, c.borderBottomColor, c.color,
    c.boxShadow, c.outlineStyle, c.outlineColor, c.transform, c.scale, c.translate, c.filter, c.opacity,
    c.textDecorationLine, c.textShadow].join('|');
  const kinder = [...el.children].slice(0, 40).map(c => { const s = getComputedStyle(c);
    return [s.color, s.opacity, s.transform, s.filter, s.animationName, s.textShadow, s.stroke].join('|'); }).join('#');
  return teil(k) + '§' + teil(v) + '§' + teil(n) + '§' + kinder;
};
window.__name = (el) => ((el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ')).slice(0, 36);
window.__sichtbar = (el) => { const r = el.getBoundingClientRect(); if (r.width < 6 || r.height < 6) return false;
  const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) return false;
  if (el.closest('[inert], details:not([open]) > :not(summary)')) return false;
  return !!el.offsetParent || cs.position === 'fixed'; };`;

/* ══ §1 Kein toter Knopf ══════════════════════════════════════════════════ */
const ANSICHTEN = ['heute', 'lernen', 'fehler', 'lernweg', 'pruefungen', 'fortschritt'] as const;
const zensus: Record<string, string> = {};
for (const thema of ['dark', 'light'] as const) {
  console.log(`\n§1 Kein toter Knopf — Rechner, ${thema === 'dark' ? 'dunkel' : 'hell'}`);
  const { ctx, s } = await oeffnen(false, thema);
  await s.evaluate(BESTAND);
  await s.evaluate(OHNE_UEBERGANG);
  await s.evaluate(BILD);
  let totGesamt = 0;
  for (const ansicht of ANSICHTEN) {
    await s.evaluate(async (a: string) => { Produktwelten.lernen(a as never); await new Promise(r => setTimeout(r, 900)); }, ansicht);
    await s.mouse.move(2, 2); await warte(s, 120);
    const anzahl = await s.evaluate(() => {
      const w = window as any;
      const liste = [...document.querySelectorAll<HTMLButtonElement>('.lernwelt button')]
        .filter(b => !b.disabled && w.__sichtbar(b));
      document.querySelectorAll('[data-t596]').forEach(x => x.removeAttribute('data-t596'));
      liste.forEach((b, i) => b.setAttribute('data-t596', String(i)));
      return liste.length;
    });
    const tote: string[] = [];
    let geprueft = 0;
    for (let i = 0; i < anzahl; i++) {
      const vor = await s.evaluate((i: number) => {
        const w = window as any;
        const b = document.querySelector<HTMLElement>(`[data-t596="${i}"]`);
        if (!b) return null;
        b.scrollIntoView({ block: 'center', inline: 'center' });
        const r = b.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const oben = document.elementFromPoint(x, y);
        return { x, y, frei: !!oben && (oben === b || b.contains(oben)), bild: w.__bild(b), name: w.__name(b) };
      }, i);
      if (!vor || !vor.frei) continue;
      await s.mouse.move(2, 2); await warte(s, 40);
      const ruhe = await s.evaluate((i: number) => (window as any).__bild(document.querySelector(`[data-t596="${i}"]`)), i);
      await s.mouse.move(vor.x, vor.y); await warte(s, 60);
      const zeiger = await s.evaluate((i: number) => {
        const b = document.querySelector(`[data-t596="${i}"]`)!;
        return { bild: (window as any).__bild(b), hover: b.matches(':hover') };
      }, i);
      geprueft++;
      if (zeiger.hover && zeiger.bild === ruhe) tote.push(vor.name);
    }
    await s.mouse.move(2, 2);
    totGesamt += tote.length;
    zensus[thema + ':' + ansicht] = tote.length + '/' + geprueft;
    p(`${thema === 'dark' ? 'dunkel' : 'hell'} · ${ansicht}: jeder Knopf antwortet unter dem Zeiger (${geprueft} geprüft)`,
      geprueft > 0 && tote.length === 0, tote.length + ' tot: ' + tote.join(' · '));
  }
  await ctx.close();
  console.log(`  Zählung ${thema}: ${totGesamt} tote Knöpfe — ` +
    ANSICHTEN.map(a => a + ' ' + zensus[thema + ':' + a]).join(', '));
}

/* ══ §2–§6 Die Lernzentrale ═══════════════════════════════════════════════ */
const FUENF = ['[data-lw-train="today"]', '[data-lw-train="errors"]', '[data-lw-train="new"]',
  ':is([data-lw-train="exam"], [data-lw-nav="pruefungen"])', '.lw-trainer-kachel > button'];
for (const thema of ['dark', 'light'] as const) {
  const t = thema === 'dark' ? 'dunkel' : 'hell';
  console.log(`\n§2–§6 Die Lernzentrale — Rechner, ${t}`);
  const { ctx, s } = await oeffnen(false, thema);
  await s.evaluate(BESTAND);
  await s.evaluate(OHNE_UEBERGANG);
  await s.evaluate(BILD);
  await s.evaluate(async () => { Produktwelten.lernen('lernen'); await new Promise(r => setTimeout(r, 1000)); });
  await s.mouse.move(2, 2); await warte(s, 150);

  /* §2 Tastenfokus */
  const ringe: string[] = [];
  for (const sel of FUENF) {
    await s.keyboard.press('Shift');
    const r = await s.evaluate((sel: string) => {
      const b = document.querySelector<HTMLElement>('.lw-study-actions ' + sel);
      if (!b) return 'fehlt';
      b.focus();
      const cs = getComputedStyle(b);
      const umriss = cs.outlineStyle !== 'none' ? parseFloat(cs.outlineWidth) : 0;
      const ring = [...cs.boxShadow.matchAll(/(-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px/g)]
        .map(m => Math.abs(parseFloat(m[4] ?? '0'))).reduce((a, b) => Math.max(a, b), 0);
      return b.matches(':focus-visible') && Math.max(umriss, ring) >= 2 ? '' : `fokus ${b.matches(':focus-visible')} · umriss ${umriss} · ring ${ring}`;
    }, sel);
    if (r) ringe.push(sel + ': ' + r);
  }
  p(`${t} §2: alle fünf zeigen unter dem Tastenfokus einen Ring ≥ 2 px`, ringe.length === 0, ringe.join(' | '));
  await s.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  /* §3 Ein Bauteil */
  const bau = await s.evaluate((liste: string[]) => liste.map(sel => {
    const b = document.querySelector<HTMLElement>('.lw-study-actions ' + sel);
    return b ? { funkel: b.classList.contains('ru-funkel'), buchstaben: b.querySelectorAll('.ru-funkel-b').length,
      text: (b.textContent || '').trim().replace(/\s+/g, ' ') } : null;
  }), FUENF);
  p(`${t} §3: alle fünf sind .ru-funkel mit Buchstaben`, bau.every(b => b && b.funkel && b.buchstaben > 3), JSON.stringify(bau));
  p(`${t} §3: die Wörter bleiben (Starten, Trainieren, Lernen, Prüfungen öffnen/Üben, Kapitel anlegen/Üben)`,
    /^Starten · \d+$/.test(bau[0]?.text ?? '') && /^Trainieren · \d+$/.test(bau[1]?.text ?? '') &&
    /^Lernen · \d+$/.test(bau[2]?.text ?? '') && /^(Prüfungen öffnen|Üben · \d+)$/.test(bau[3]?.text ?? '') &&
    /^(Kapitel anlegen|Üben · \d+)$/.test(bau[4]?.text ?? ''), bau.map(b => b?.text).join(' | '));

  /* §5 In Ruhe eine laute Fläche */
  const ruhe = await s.evaluate((liste: string[]) => liste.map(sel => {
    const b = document.querySelector<HTMLElement>('.lw-study-actions ' + sel);
    if (!b) return { schein: true, glimmt: true, grund: 'fehlt' };
    const cs = getComputedStyle(b);
    const glimmt = [...b.querySelectorAll('.ru-funkel-b')].some(x => getComputedStyle(x).animationName.includes('glimmen'));
    return { schein: cs.boxShadow !== 'none', glimmt, grund: cs.backgroundColor };
  }), FUENF);
  p(`${t} §5: in Ruhe ist nur „Starten" laut (Schein oder glimmende Buchstaben)`,
    (ruhe[0]?.schein || ruhe[0]?.glimmt) && ruhe.slice(1).every(r => !r.schein && !r.glimmt), JSON.stringify(ruhe));

  /* §4 Derselbe Schein */
  const unterZeiger = async (sel: string) => {
    const box = await s.locator('.lw-study-actions ' + sel).boundingBox();
    if (!box) return null;
    await s.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await warte(s, 80);
    const b = await s.evaluate((sel: string) => {
      const k = document.querySelector<HTMLElement>('.lw-study-actions ' + sel)!;
      const cs = getComputedStyle(k), v = getComputedStyle(k, '::before'), n = getComputedStyle(k, '::after');
      const brief = k.querySelector('.ru-funkel-b');
      return { grund: cs.backgroundColor, rand: cs.borderTopColor, schrift: cs.color, schein: v.boxShadow,
        licht: n.opacity, lauf: brief ? getComputedStyle(brief).animationName : 'keine Buchstaben' };
    }, sel);
    await s.mouse.move(2, 2); await warte(s, 60);
    return b;
  };
  const tages = await unterZeiger(FUENF[0]!);
  const fehl = await unterZeiger(FUENF[1]!);
  p(`${t} §4: „Trainieren" unter dem Zeiger = „Starten" unter dem Zeiger (Grund, Rand, Schrift, Schein, Licht, Lauf)`,
    !!tages && JSON.stringify(tages) === JSON.stringify(fehl), `Starten ${JSON.stringify(tages)} · Trainieren ${JSON.stringify(fehl)}`);

  /* §6 Druck mit der Maus */
  const druck: string[] = [];
  for (const sel of FUENF.slice(0, 3)) {
    await s.evaluate(() => { (window as any).__weg = (e: Event) => { e.stopImmediatePropagation(); e.preventDefault(); };
      window.addEventListener('click', (window as any).__weg, true); });
    const box = await s.locator('.lw-study-actions ' + sel).boundingBox();
    if (!box) { druck.push(sel + ' fehlt'); continue; }
    const vor = await s.evaluate((sel: string) => (window as any).__bild(document.querySelector('.lw-study-actions ' + sel)), sel);
    await s.mouse.move(box.x + 6, box.y + box.height / 2);
    const zeiger = await s.evaluate((sel: string) => (window as any).__bild(document.querySelector('.lw-study-actions ' + sel)), sel);
    await s.mouse.down(); await warte(s, 40);
    const unten = await s.evaluate((sel: string) => { const b = document.querySelector('.lw-study-actions ' + sel)!;
      return { gedrueckt: b.hasAttribute('data-gedrueckt'), bild: (window as any).__bild(b) }; }, sel);
    await s.mouse.up(); await s.mouse.move(2, 2); await warte(s, 150);
    await s.evaluate(() => window.removeEventListener('click', (window as any).__weg, true));
    if (!unten.gedrueckt || unten.bild === zeiger || unten.bild === vor) druck.push(sel + ` gedrückt=${unten.gedrueckt} sichtbar=${unten.bild !== zeiger}`);
  }
  p(`${t} §6: Maus unten — data-gedrueckt und ein sichtbarer Unterschied`, druck.length === 0, druck.join(' | '));
  await ctx.close();
}

/* ══ §7 Ein kurzer Tipp am Telefon ════════════════════════════════════════
   Drei Messungen, weil das iPhone `:active` beim kurzen Tipp oft gar nicht
   malt und die Nachbildung es trotzdem tut:
     (a) der echte Tipp (CDP) setzt `data-gedrueckt` an allen fünf;
     (b) `data-gedrueckt` ALLEIN — ohne Zeiger, ohne `:active`, ohne
         Übergang — ändert, was man sieht (Grund, Rand, Schein, Licht,
         Massstab). Das ist der Zustand, der den Tipp 80 ms lang trägt;
     (c) nach dem Loslassen steht jeder wieder in Ruhe — kein Schein, der
         unter dem Finger kleben bleibt. */
for (const thema of ['dark', 'light'] as const) {
  const t = thema === 'dark' ? 'dunkel' : 'hell';
  console.log(`\n§7 Ein kurzer Tipp — Telefon, ${t}`);
  const { ctx, s } = await oeffnen(true, thema);
  await s.evaluate(BESTAND);
  await s.evaluate(BILD);
  await s.evaluate(async () => { Produktwelten.lernen('lernen'); await new Promise(r => setTimeout(r, 1000)); });
  p(`${t} §7: das Telefon meldet (hover: none) — die Nachbildung ist ein Tastgerät`,
    await s.evaluate(() => matchMedia('(hover: none)').matches));
  const cdp = await ctx.newCDPSession(s);
  const tipps: string[] = [], allein: string[] = [], kleben: string[] = [];
  const MALEN = `(b) => { const c = getComputedStyle(b), v = getComputedStyle(b, '::before'), n = getComputedStyle(b, '::after');
    return [c.backgroundColor, c.backgroundImage, c.borderTopColor, c.boxShadow, c.scale, c.transform, c.filter,
      v.boxShadow, v.opacity, n.opacity, n.filter].join('|'); }`;
  for (const sel of FUENF) {
    const ort = await s.evaluate((sel: string) => {
      const b = document.querySelector<HTMLElement>('.lw-study-actions ' + sel);
      if (!b) return null;
      b.scrollIntoView({ block: 'center' });
      const r = b.getBoundingClientRect();
      (window as any).__weg = (e: Event) => { e.stopImmediatePropagation(); e.preventDefault(); };
      window.addEventListener('click', (window as any).__weg, true);
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, sel);
    if (!ort) { tipps.push(sel + ' fehlt'); continue; }
    await warte(s, 500);
    const ruhe = await s.evaluate(`(${MALEN})(document.querySelector('.lw-study-actions ${sel.replace(/'/g, "\\'")}'))`);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ort.x, y: ort.y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const gesetzt = await s.evaluate((sel: string) => document.querySelector('.lw-study-actions ' + sel)!.hasAttribute('data-gedrueckt'), sel);
    if (!gesetzt) tipps.push(sel);
    await warte(s, 900);
    const danach = await s.evaluate(`(${MALEN})(document.querySelector('.lw-study-actions ${sel.replace(/'/g, "\\'")}'))`);
    if (danach !== ruhe) kleben.push(sel);
    await s.evaluate(() => window.removeEventListener('click', (window as any).__weg, true));
    /* (b) der Zustand allein */
    const b = await s.evaluate(`(() => { const b = document.querySelector('.lw-study-actions ${sel.replace(/'/g, "\\'")}');
      const st = document.createElement('style'); st.textContent = '*,*::before,*::after{transition:none!important}';
      document.head.append(st); const m = ${MALEN}; const vor = m(b);
      b.setAttribute('data-gedrueckt', ''); const unten = m(b); b.removeAttribute('data-gedrueckt'); st.remove();
      return vor !== unten; })()`);
    if (!b) allein.push(sel);
  }
  p(`${t} §7a: der echte Tipp setzt data-gedrueckt an allen fünf`, tipps.length === 0, tipps.join(' | '));
  p(`${t} §7b: data-gedrueckt allein zeigt sich an allen fünf (ohne Zeiger, ohne :active)`, allein.length === 0,
    allein.length + ' ohne Bild: ' + allein.join(' | '));
  p(`${t} §7c: nach dem Loslassen stehen alle fünf wieder in Ruhe — nichts klebt`, kleben.length === 0, kleben.join(' | '));
  await ctx.close();
}

/* ══ §8 Kein klebender Schein an den KI-Werkzeugen ════════════════════════ */
{
  console.log('\n§8 Kein klebender Schein — KI-Werkzeuge am Telefon');
  const { ctx, s } = await oeffnen(true, 'dark');
  await s.evaluate(async () => {
    const note = Store.addPage(null, { text: 'Notiz für die KI' });
    Store.addBlock(note.id, 'text', { text: 'Ein Satz.' });
    await Store.flush(); App.oeffne(note.id); App.kiPanel(true);
  });
  await s.waitForSelector('#ai.open');
  /* Seit E724 keine Schublade: die KI-Werkzeuge stehen im leeren Chat
     (`.ai-start`), ohne Aufklappen. Fehlt der Block, ist §8 rot statt
     stumm grün über einem Knopf, den niemand sieht. */
  p('§8: die KI-Werkzeuge stehen ohne Schublade im leeren Chat', await s.evaluate(() =>
    !document.getElementById('ai-tools') && !!document.querySelector('#ai .ai-start .ai-quick button.ru-funkel')));
  await warte(s, 400);
  const cdp = await ctx.newCDPSession(s);
  const ort = await s.evaluate(() => {
    const b = [...document.querySelectorAll<HTMLElement>('#ai .ai-start .ai-quick button.ru-funkel')].find(x => x.getBoundingClientRect().height > 20);
    if (!b) return null;
    b.setAttribute('data-t596', 'chip');
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    (window as any).__weg = (e: Event) => { e.stopImmediatePropagation(); e.preventDefault(); };
    window.addEventListener('click', (window as any).__weg, true);
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, name: (b.textContent || '').trim() };
  });
  if (!ort) p('§8: ein KI-Werkzeug ist zu sehen', false, 'keins gefunden');
  else {
    await warte(s, 300);
    const lies = () => s.evaluate(() => { const b = document.querySelector('[data-t596="chip"]')!;
      return { rand: getComputedStyle(b).borderTopColor, schein: getComputedStyle(b, '::before').boxShadow,
        licht: getComputedStyle(b, '::after').opacity }; });
    const ruhe = await lies();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ort.x, y: ort.y }] });
    await warte(s, 30);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await warte(s, 900);
    const nach = await lies();
    p(`§8: „${ort.name}" trägt nach dem Tipp wieder seinen Ruheschein (Rand, ::before, ::after)`,
      JSON.stringify(nach) === JSON.stringify(ruhe), `ruhe ${JSON.stringify(ruhe)} · nach ${JSON.stringify(nach)}`);
    /* Die Nachbildung lässt `:hover` nach dem Tipp fallen, das iPhone
       nicht: dort bleibt es kleben, bis man woanders hintippt (das Bild
       der Karte, karte-ki/handy-auf.png). Deshalb wird `:hover` hier
       ERZWUNGEN — auf einem Gerät ohne Zeiger darf es nichts malen. */
    await s.evaluate(() => { const st = document.createElement('style'); st.id = 't596-ohne';
      st.textContent = '*,*::before,*::after{transition:none!important}'; document.head.append(st); });
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-t596="chip"]' });
    const still = await lies();
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
    const erzwungen = await lies();
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
    p(`§8: ein klebendes :hover malt am Telefon keinen Schein („${ort.name}")`,
      JSON.stringify(erzwungen) === JSON.stringify(still), `ruhe ${JSON.stringify(still)} · :hover ${JSON.stringify(erzwungen)}`);
  }
  await ctx.close();
}

/* ══ §9 Ein gesperrter Knopf bleibt still ═════════════════════════════════
   §1 zählt nur freigegebene Knöpfe — genau deshalb sah er den gesperrten
   Funkel nicht, der unter dem Zeiger aufleuchtete. Hier die Gegenseite:
   leerer Bestand, jeder sichtbare GESPERRTE Knopf der Lernwelt, Ruhe gegen
   Zeiger und gegen `data-gedrueckt`. Die Bewegungen bleiben an (der
   Buchstabenlauf ist ein Zustand), nur die Übergänge sind null. */
for (const thema of ['dark', 'light'] as const) {
  const t = thema === 'dark' ? 'dunkel' : 'hell';
  console.log(`\n§9 Ein gesperrter Knopf bleibt still — Rechner, ${t}, leerer Bestand`);
  const { ctx, s } = await oeffnen(false, thema);
  /* Die Beispielseiten bringen Lernkarten mit — weg damit (Papierkorb),
     damit auch „Starten · 0" und „Lernen · 0" gesperrt dastehen. */
  await s.evaluate(async () => {
    for (const b of Object.values(Store.cache.blocks) as any[])
      if (b && b.alive !== false && b.type === 'flashcard') Store.trashBlock(b.id);
    await Store.flush();
  });
  await s.evaluate(OHNE_UEBERGANG);
  await s.evaluate(BILD);
  const laut: string[] = [];
  let geprueft = 0;
  const namen = new Set<string>();
  for (const ansicht of ANSICHTEN) {
    await s.evaluate(async (a: string) => { Produktwelten.lernen(a as never); await new Promise(r => setTimeout(r, 900)); }, ansicht);
    await s.mouse.move(2, 2); await warte(s, 120);
    const anzahl = await s.evaluate(() => {
      const w = window as any;
      const liste = [...document.querySelectorAll<HTMLButtonElement>('.lernwelt button')]
        .filter(b => b.disabled && w.__sichtbar(b));
      document.querySelectorAll('[data-t596]').forEach(x => x.removeAttribute('data-t596'));
      liste.forEach((b, i) => b.setAttribute('data-t596', String(i)));
      return liste.length;
    });
    for (let i = 0; i < anzahl; i++) {
      const vor = await s.evaluate((i: number) => {
        const w = window as any;
        const b = document.querySelector<HTMLElement>(`[data-t596="${i}"]`);
        if (!b) return null;
        b.scrollIntoView({ block: 'center', inline: 'center' });
        const r = b.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const oben = document.elementFromPoint(x, y);
        return { x, y, frei: !!oben && (oben === b || b.contains(oben)), name: w.__name(b) };
      }, i);
      if (!vor || !vor.frei) continue;
      await s.mouse.move(2, 2); await warte(s, 40);
      const ruhe = await s.evaluate((i: number) => (window as any).__bild(document.querySelector(`[data-t596="${i}"]`)), i);
      await s.mouse.move(vor.x, vor.y); await warte(s, 60);
      const zeiger = await s.evaluate((i: number) => {
        const b = document.querySelector(`[data-t596="${i}"]`)!;
        return { bild: (window as any).__bild(b), hover: b.matches(':hover') };
      }, i);
      await s.mouse.move(2, 2); await warte(s, 40);
      const druck = await s.evaluate((i: number) => {
        const b = document.querySelector(`[data-t596="${i}"]`)!;
        b.setAttribute('data-gedrueckt', ''); const bild = (window as any).__bild(b); b.removeAttribute('data-gedrueckt');
        return bild;
      }, i);
      geprueft++; namen.add(ansicht + ':' + vor.name);
      const was: string[] = [];
      if (!zeiger.hover) was.push('kein :hover gemessen');
      else if (zeiger.bild !== ruhe) was.push('Zeiger');
      if (druck !== ruhe) was.push('data-gedrueckt');
      if (was.length) laut.push(`${ansicht}: „${vor.name}" (${was.join(', ')})`);
    }
  }
  const funkel = [...namen].filter(n => /Starten · 0|Trainieren · 0|Lernen · 0/.test(n));
  p(`${t} §9: mit leerem Bestand stehen die gesperrten Funkel da (Starten, Trainieren, Lernen · 0)`,
    funkel.length >= 3, [...namen].join(' · '));
  p(`${t} §9: kein gesperrter Knopf ändert sich unter Zeiger oder Druck (${geprueft} geprüft)`,
    geprueft > 0 && laut.length === 0, laut.length + ' laut: ' + laut.join(' | '));
  await ctx.close();
}

/* ══ §10 In allen zehn Schemata ═════════════════════════════════════════ */
const SCHEMATA = ['standard', 'hell', 'nacht', 'wald', 'sand', 'papier', 'kontrast', 'rose', 'touchkit-hell', 'touchkit-dunkel'];
const FARBE = `(() => {
  window.__rgb = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
    const q = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: q[0], g: q[1], b: q[2], a: q[3] ?? 1 }; };
  window.__ueber = (o, u) => ({ r: o.r * o.a + u.r * (1 - o.a), g: o.g * o.a + u.g * (1 - o.a), b: o.b * o.a + u.b * (1 - o.a), a: 1 });
  window.__lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  window.__kontrast = (a, b) => { const x = window.__lum(a), y = window.__lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  /* Der Grund unter einem Element: Vorfahren von innen nach aussen, bis einer deckt. */
  window.__unter = (el) => { const sch = [];
    for (let e = el.parentElement; e; e = e.parentElement) { const c = window.__rgb(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) { sch.push(c); if (c.a >= 1) break; } }
    let g = { r: 255, g: 255, b: 255, a: 1 }; for (const c of sch.reverse()) g = window.__ueber(c, g); return g; };
  /* Der Grund eines Knopfes, wie er gemalt wird: Farbe, darüber die Bildschichten
     (je Schicht die erste Farbe des Verlaufs — die Rezepte hier sind einfarbig). */
  window.__grund = (el) => { const cs = getComputedStyle(el); let g = window.__unter(el);
    const c = window.__rgb(cs.backgroundColor); if (c && c.a > 0) g = window.__ueber(c, g);
    const schichten = String(cs.backgroundImage || '').split(/,\\s*(?=(?:linear|radial|conic)-gradient)/).reverse();
    for (const sch of schichten) { const f = window.__rgb((sch.match(/rgba?\\([^)]+\\)/) || [''])[0]); if (f && f.a > 0) g = window.__ueber(f, g); }
    return g; };
  window.__schrift = (el) => { const b = el.querySelector('.ru-funkel-b') || el; const f = window.__rgb(getComputedStyle(b).color);
    return f ? window.__ueber(f, window.__grund(el)) : null; };
})()`;
{
  console.log('\n§10 In allen zehn Schemata — Rechner, Lernzentrale');
  const { ctx, s } = await oeffnen(false, 'dark');
  await s.evaluate(BESTAND);
  await s.evaluate(OHNE_UEBERGANG);
  await s.evaluate(FARBE);
  const ruheFehlt: string[] = [], druckFehlt: string[] = [];
  for (const schema of SCHEMATA) {
    await s.evaluate(async (sch: string) => { Aussehen.setzen({ schema: sch } as never);
      Produktwelten.lernen('lernen'); await new Promise(r => setTimeout(r, 700)); }, schema);
    await s.mouse.move(2, 2); await warte(s, 80);
    const m = await s.evaluate((liste: string[]) => {
      const w = window as any;
      const knopf = (sel: string) => document.querySelector<HTMLElement>('.lw-study-actions ' + sel);
      const start = knopf(liste[0]!), still = knopf(liste[1]!);
      if (!start || !still) return null;
      const a = w.__grund(start), b = w.__grund(still);
      const cs = getComputedStyle(start), cs2 = getComputedStyle(still);
      const rand = parseFloat(cs.borderTopWidth), rand2 = parseFloat(cs2.borderTopWidth);
      const randKontrast = w.__kontrast(w.__ueber(w.__rgb(cs.borderTopColor), w.__unter(start)), w.__unter(start));
      const leuchtet = (k: HTMLElement) => getComputedStyle(k).boxShadow !== 'none' ||
        [...k.querySelectorAll('.ru-funkel-b')].some(x => /glimmen/.test(getComputedStyle(x).animationName));
      const ruhe = { grund: +w.__kontrast(a, b).toFixed(2), rand, rand2, randKontrast: +randKontrast.toFixed(2),
        zeichen: leuchtet(start) && !leuchtet(still) };
      const druck = liste.map(sel => { const k = knopf(sel); if (!k) return { sel, wert: 0 };
        k.setAttribute('data-gedrueckt', ''); const t = w.__schrift(k), g = w.__grund(k); k.removeAttribute('data-gedrueckt');
        return { sel, wert: t ? +w.__kontrast(t, g).toFixed(2) : 0 }; });
      return { ruhe, druck };
    }, FUENF);
    if (!m) { ruheFehlt.push(schema + ': Knöpfe fehlen'); continue; }
    const r = m.ruhe;
    const gewicht = r.grund >= 1.5 || (r.rand >= 2 && r.rand > r.rand2 && r.randKontrast >= 3);
    if (!r.zeichen || (schema === 'kontrast' && !gewicht))
      ruheFehlt.push(`${schema}: Zeichen ${r.zeichen}, Grund ${r.grund} : 1, Rand ${r.rand}/${r.rand2} px, Randkontrast ${r.randKontrast}`);
    const schwach = m.druck.filter(d => d.wert < 4.5);
    if (schwach.length) druckFehlt.push(schema + ': ' + schwach.map(d => d.sel.replace(/\[data-lw-train="|"\]/g, '') + ' ' + d.wert).join(', '));
    console.log(`    ${schema}: Ruhe ${JSON.stringify(r)} · Druck ${m.druck.map(d => d.wert).join(' / ')}`);
  }
  p('§10a: in Ruhe hebt sich „Starten" in allen zehn Schemata von den stillen Funkeln ab (im Starken Kontrast mit 3 : 1)', ruheFehlt.length === 0, ruheFehlt.join(' | '));
  p('§10b: gedrückt liest sich die Schrift aller fünf mit ≥ 4,5 : 1 — in allen zehn Schemata', druckFehlt.length === 0, druckFehlt.join(' | '));
  await ctx.close();
}

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
