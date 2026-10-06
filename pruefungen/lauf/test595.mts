/* Suite 595 — Das Herz ist ein Knopf (E719)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur, PDF vom 29. September 2026, Seiten 21/22,
 * zum Foto der Lernzentrale mit der Karte „fällige Fehler 2":
 *
 *     „die herz beim hier funktionier nicht also wenn ich das klicke
 *      passiert nichts, behebe das problem"
 *
 * Das Herz oben rechts in jeder Kennzahlkarte der Lernwelt sah aus wie ein
 * runder Knopf — ein Herz im Ring, das beim Zeigen schlägt. Es war keiner:
 * ein `<span class="rmo-heart" aria-hidden="true">` mit
 * `pointer-events:none` auf einem `<article>` ohne Rolle (E534, Redurs
 * Statistik-Vorlage). Ein Klick traf die Karte, und nichts geschah. Im
 * Datenmodell gab es auch nichts zu schalten: `favorite` steht nur an
 * Seiten.
 *
 * Die Vorgabe des Plans (Redur hat die Frage 7 der Schlussliste nicht
 * beantwortet): das Herz merkt die KENNZAHL — „Lieblingskennzahl". Sie
 * steht je Lernendem in `Store` meta (`lernwelt:<aktor>:kennzahlen`) und
 * erscheint auf „Heute" in einem Streifen „Gemerkt".
 *
 * DIESER LAUF PRÜFT DIE ZUSAGEN ALS ZAHLEN:
 *
 *   §1 EIN ECHTER KNOPF. Das Herz der Karte „fällige Fehler" ist ein
 *      `<button>`, nicht `aria-hidden`, mindestens 44 × 44, mit
 *      `aria-pressed="false"` und dem Namen „Zu Favoriten: fällige
 *      Fehler"; an seiner Mitte liegt ER (elementFromPoint), nicht die
 *      Karte.
 *   §2 DIE MAUS SCHALTET. Ein Klick: `aria-pressed="true"`, Name „Aus
 *      Favoriten: fällige Fehler", die Form ist ein HERZ (nicht das Band
 *      der Seitenfavoriten) und gefüllt — offen gegen gefüllt, auch ohne
 *      Farbe zu unterscheiden (Methode test433 §4).
 *   §3 ES WIRD GEMERKT. `Lernwelt.modelle.kennzahlenGemerkt()` enthält
 *      `faellige-fehler`; auf „Heute" steht ein Streifen „Gemerkt" mit
 *      derselben Zahl wie in der Lernzentrale, und sein Herz ist gefüllt.
 *   §4 ES ÜBERLEBT DAS NEULADEN — Knopf gedrückt, Streifen da.
 *   §5 EIN ZWEITER KLICK (im Streifen) NIMMT BEIDES WEG.
 *   §6 TASTATUR UND FINGER. Enter und Leertaste schalten; ein Fingertipp
 *      am Telefon (CDP) schaltet; der Fokus ist sichtbar.
 *   §7 SCHEITERT DAS SCHREIBEN, kehrt der Knopf zurück und sagt es (Toast).
 *   §8 OHNE BEWEGUNG springt nichts — weder mit „weniger Bewegung" noch
 *      mit `body[data-bewegung="ruhig"]`; der Zustand wechselt trotzdem.
 *   §9 EINMALIGE ZAHLEN BEKOMMEN KEIN ECHTES HERZ: die Karten im Ergebnis
 *      einer Prüfungssimulation tragen keinen Knopf; ihr Schmuck bleibt,
 *      wie er war (aria-hidden, L241 — Redur entscheidet, ob er geht).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Gegen den Stand 1bfaca53 (claude/morgen-besser-2) rot — die Zeilen
 *   stehen im Commit „test595 (rot)". Die Gegenproben zu E719 stehen im
 *   Commit dazu.
 *
 *   node pruefungen/lauf/test595.mts
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

const oeffnen = async (opt: { handy?: boolean; weniger?: boolean; ctx?: BrowserContext } = {}):
  Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = opt.ctx ?? await browser.newContext({
    viewport: opt.handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    ...(opt.handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    reducedMotion: opt.weniger ? 'reduce' : 'no-preference'
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    App.theme('dark');
  });
  await s.mouse.move(2, 2);
  return { ctx, s };
};

/* Zwei fällige Fehler, eine fällige Karte, drei neue. */
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
const ansicht = (s: Page, a: string) => s.evaluate(async (a: string) => { Produktwelten.lernen(a as never); await new Promise(r => setTimeout(r, 1000)); }, a);

/** Die Karte „fällige Fehler" und ihr Herz, so wie sie gerade stehen. */
const HERZ = () => {
  const karte = [...document.querySelectorAll<HTMLElement>('.lw-learning .stat-karte.lw-metrik')]
    .find(k => /^fällige Fehler$/.test((k.querySelector(':scope > span:not([class])')?.textContent ||
      [...k.querySelectorAll(':scope > span')].map(x => x.textContent).find(t => /fällige Fehler/.test(t || '')) || '').trim()));
  if (!karte) return null;
  const herz = karte.querySelector<HTMLElement>(':scope > .lw-kennzahl-merk') ||
    karte.querySelector<HTMLElement>(':scope > .rmo-heart');
  if (!herz) return { karte: true, herz: null, x: 0, y: 0 };
  herz.setAttribute('data-t595', 'herz');
  herz.scrollIntoView({ block: 'center' });
  const r = herz.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const oben = document.elementFromPoint(x, y);
  const pfad = herz.querySelector('svg path');
  return {
    karte: true, tag: herz.tagName, versteckt: herz.getAttribute('aria-hidden'),
    zeiger: getComputedStyle(herz).pointerEvents, breite: Math.round(r.width), hoehe: Math.round(r.height),
    gedrueckt: herz.getAttribute('aria-pressed'), name: herz.getAttribute('aria-label'),
    getroffen: oben ? (oben === herz || herz.contains(oben) ? 'HERZ' : oben.tagName + '.' + String(oben.className).split(' ')[0]) : 'nichts',
    x, y, fuellung: pfad?.getAttribute('fill') ?? null, strich: pfad?.getAttribute('stroke') ?? null,
    form: pfad?.getAttribute('d') ?? null, zahl: (karte.querySelector('strong')?.textContent || '').trim(),
    platzt: herz.classList.contains('platzt')
  };
};
const gemerkt = (s: Page) => s.evaluate(() => {
  const f = (window as any).Lernwelt?.modelle?.kennzahlenGemerkt;
  return typeof f === 'function' ? f() as string[] : null;
});
const STREIFEN = () => {
  const st = document.querySelector<HTMLElement>('.lw-gemerkt');
  if (!st) return null;
  const karten = [...st.querySelectorAll<HTMLElement>('.stat-karte.lw-metrik')];
  return {
    titel: (st.querySelector('h2, h3, p')?.textContent || '').trim(),
    karten: karten.map(k => ({ name: [...k.querySelectorAll(':scope > span')].map(x => (x.textContent || '').trim()).filter(Boolean).join(' '),
      zahl: (k.querySelector('strong')?.textContent || '').trim(),
      gedrueckt: k.querySelector(':scope > .lw-kennzahl-merk')?.getAttribute('aria-pressed') ?? null }))
  };
};

/* ══ §1–§5 Rechner ══════════════════════════════════════════════════════ */
console.log('\n§1 Ein echter Knopf');
const { ctx, s } = await oeffnen();
await s.evaluate(BESTAND);
await ansicht(s, 'lernen');
const h1 = await s.evaluate(HERZ);
p('Die Karte „fällige Fehler" steht in der Lernzentrale', !!h1?.karte, JSON.stringify(h1));
p('Ihr Herz ist ein <button>', h1?.tag === 'BUTTON', JSON.stringify(h1));
p('… nicht versteckt (kein aria-hidden) und nicht durchklickbar', !!h1 && h1.versteckt !== 'true' && h1.zeiger !== 'none',
  `aria-hidden=${h1?.versteckt} pointer-events=${h1?.zeiger}`);
p('… mindestens 44 × 44 (§37)', (h1?.breite ?? 0) >= 44 && (h1?.hoehe ?? 0) >= 44, `${h1?.breite} × ${h1?.hoehe}`);
p('… aria-pressed="false" und „Zu Favoriten: fällige Fehler"',
  h1?.gedrueckt === 'false' && h1?.name === 'Zu Favoriten: fällige Fehler', `${h1?.gedrueckt} · ${h1?.name}`);
p('… und an seiner Mitte liegt ER, nicht die Karte', h1?.getroffen === 'HERZ', String(h1?.getroffen));

console.log('\n§2 Die Maus schaltet');
const zahlZentrale = h1?.zahl ?? '';
if (h1?.tag === 'BUTTON') await s.mouse.click(h1.x, h1.y);
else if (h1) await s.mouse.click(h1.x, h1.y);
await warte(s, 400);
const h2 = await s.evaluate(HERZ);
p('Ein Klick: aria-pressed="true", „Aus Favoriten: fällige Fehler"',
  h2?.gedrueckt === 'true' && h2?.name === 'Aus Favoriten: fällige Fehler', `${h2?.gedrueckt} · ${h2?.name}`);
const formen = await s.evaluate(() => {
  const M = (window as any).Merkzeichen;
  return { band: M?.BAND ?? null, herz: M?.HERZ ?? null };
});
p('Die Form ist ein Herz — nicht das Band der Seitenfavoriten', !!h2?.form && !!formen.herz && h2.form === formen.herz && h2.form !== formen.band,
  `d=${String(h2?.form).slice(0, 30)} · HERZ=${String(formen.herz).slice(0, 30)}`);
p('Gemerkt ist gefüllt, und der Umriss bleibt derselbe (ohne Farbe zu unterscheiden)',
  h1?.fuellung === 'none' && h2?.fuellung === 'currentColor' && h1?.strich === 'currentColor' && h2?.strich === 'currentColor',
  `vorher ${h1?.fuellung}/${h1?.strich} · nachher ${h2?.fuellung}/${h2?.strich}`);
p('Der Kranz springt beim Anhaken auf (E460)', h2?.platzt === true || await s.evaluate(() =>
  !!document.querySelector('[data-t595="herz"].ist-an')), String(h2?.platzt));

console.log('\n§3 Es wird gemerkt');
await s.evaluate(() => Store.flush());
const liste3 = await gemerkt(s);
p('Lernwelt.modelle.kennzahlenGemerkt() enthält „faellige-fehler"', !!liste3 && liste3.includes('faellige-fehler'), JSON.stringify(liste3));
await ansicht(s, 'heute');
const st3 = await s.evaluate(STREIFEN);
p('Auf „Heute" steht ein Streifen „Gemerkt"', !!st3 && /Gemerkt/.test(st3.titel), JSON.stringify(st3));
const k3 = st3?.karten.find(k => /fällige Fehler/.test(k.name));
p('… mit „fällige Fehler" und derselben Zahl wie in der Lernzentrale', !!k3 && k3.zahl === zahlZentrale,
  `Streifen ${k3?.zahl} · Lernzentrale ${zahlZentrale}`);
p('… und sein Herz ist gedrückt', k3?.gedrueckt === 'true', String(k3?.gedrueckt));

console.log('\n§4 Es überlebt das Neuladen');
await s.reload();
await s.waitForFunction(() => typeof App !== 'undefined' && (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await s.evaluate(() => document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove()));
await ansicht(s, 'heute');
const st4 = await s.evaluate(STREIFEN);
p('Nach dem Neuladen steht der Streifen noch da', !!st4 && st4.karten.some(k => /fällige Fehler/.test(k.name)), JSON.stringify(st4));
await ansicht(s, 'lernen');
const h4 = await s.evaluate(HERZ);
p('… und das Herz in der Lernzentrale ist gedrückt', h4?.gedrueckt === 'true', String(h4?.gedrueckt));

console.log('\n§5 Ein zweiter Klick nimmt beides weg');
await ansicht(s, 'heute');
const imStreifen = await s.evaluate(() => {
  const b = [...document.querySelectorAll<HTMLElement>('.lw-gemerkt .stat-karte.lw-metrik')]
    .find(k => /fällige Fehler/.test(k.textContent || ''))?.querySelector<HTMLElement>(':scope > .lw-kennzahl-merk');
  if (!b) return null;
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
if (imStreifen) { await s.mouse.click(imStreifen.x, imStreifen.y); await warte(s, 500); }
p('Das Herz im Streifen ist zu treffen', !!imStreifen);
const st5 = await s.evaluate(STREIFEN);
p('Der Streifen ist weg (keine gemerkte Kennzahl mehr)', imStreifen !== null && st5 === null, JSON.stringify(st5));
const liste5 = await gemerkt(s);
p('… und die Liste ist leer', Array.isArray(liste5) && !liste5.includes('faellige-fehler'), JSON.stringify(liste5));

/* ══ §6 Tastatur ════════════════════════════════════════════════════════ */
console.log('\n§6 Tastatur und Finger');
await ansicht(s, 'lernen');
await s.evaluate(HERZ);
await s.keyboard.press('Shift');
await s.evaluate(() => document.querySelector<HTMLElement>('[data-t595="herz"]')?.focus());
const fokus = await s.evaluate(() => { const b = document.querySelector<HTMLElement>('[data-t595="herz"]');
  if (!b || document.activeElement !== b) return null; const cs = getComputedStyle(b);
  return { sichtbar: b.matches(':focus-visible'), umriss: cs.outlineStyle !== 'none' ? parseFloat(cs.outlineWidth) : 0 }; });
p('Der Tastenfokus steht sichtbar auf dem Herz (Umriss ≥ 2 px)', !!fokus && fokus.sichtbar && fokus.umriss >= 2, JSON.stringify(fokus));
await s.keyboard.press('Enter'); await warte(s, 350);
const nachEnter = await s.evaluate(HERZ);
p('Enter merkt', nachEnter?.gedrueckt === 'true', String(nachEnter?.gedrueckt));
await s.evaluate(() => document.querySelector<HTMLElement>('[data-t595="herz"]')?.focus());
await s.keyboard.press('Space'); await warte(s, 350);
const nachLeer = await s.evaluate(HERZ);
p('Die Leertaste nimmt es wieder weg', nachLeer?.gedrueckt === 'false', String(nachLeer?.gedrueckt));

/* ══ §7 Ein Schreiben, das scheitert ═══════════════════════════════════ */
console.log('\n§7 Scheitert das Schreiben, kehrt der Knopf zurück');
await s.evaluate(() => {
  (window as any).__alt = Store.metaListeAendern;
  (Store as any).metaListeAendern = () => Promise.reject(new Error('Prüflauf: die Ablage sagt nein'));
  /* Nicht entfernen — `UI.toast` schreibt in #toast; fehlt es, geht die
     Meldung in die Konsole (hinweis.ts). Nur den alten Text leeren. */
  const t = document.getElementById('toast'); if (t) { t.textContent = ''; t.classList.remove('show'); }
});
const h7 = await s.evaluate(HERZ);
if (h7?.tag === 'BUTTON') await s.mouse.click(h7.x, h7.y);
await warte(s, 600);
const n7 = await s.evaluate(() => {
  const b = document.querySelector('[data-t595="herz"]') ||
    [...document.querySelectorAll('.lw-learning .stat-karte.lw-metrik')].find(k => /fällige Fehler/.test(k.textContent || ''))?.querySelector(':scope > .lw-kennzahl-merk');
  const toast = [...document.querySelectorAll<HTMLElement>('.toast, #toast, .ui-toast, [role="status"], [role="alert"]')]
    .map(t => (t.textContent || '').trim()).filter(t => /nicht gemerkt|nicht gespeichert|nicht merken/i.test(t));
  return { gedrueckt: b?.getAttribute('aria-pressed') ?? null, toast };
});
await s.evaluate(() => { (Store as any).metaListeAendern = (window as any).__alt; });
p('Der Knopf steht wieder auf „nicht gemerkt"', h7?.tag === 'BUTTON' && n7.gedrueckt === 'false', JSON.stringify(n7));
p('… und ein Hinweis sagt, dass es nicht gemerkt wurde', n7.toast.length > 0, JSON.stringify(n7.toast));
await ctx.close();

/* ══ §6b Finger ══════════════════════════════════════════════════════════ */
{
  const { ctx: c2, s: t } = await oeffnen({ handy: true });
  await t.evaluate(BESTAND);
  await ansicht(t, 'lernen');
  const h = await t.evaluate(HERZ);
  const cdp = await c2.newCDPSession(t);
  if (h) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: h.x, y: h.y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await warte(t, 500);
  const n = await t.evaluate(HERZ);
  p('Am Telefon: ein Fingertipp merkt', n?.gedrueckt === 'true', JSON.stringify({ tag: h?.tag, vor: h?.gedrueckt, nach: n?.gedrueckt }));
  p('Am Telefon: das Herz misst 44 × 44', (n?.breite ?? 0) >= 44 && (n?.hoehe ?? 0) >= 44, `${n?.breite} × ${n?.hoehe}`);
  await c2.close();
}

/* ══ §8 Ohne Bewegung ═══════════════════════════════════════════════════ */
console.log('\n§8 Ohne Bewegung springt nichts');
for (const art of ['weniger', 'ruhig'] as const) {
  const { ctx: c3, s: t } = await oeffnen({ weniger: art === 'weniger' });
  if (art === 'ruhig') await t.evaluate(() => { document.body.dataset['bewegung'] = 'ruhig'; });
  await t.evaluate(BESTAND);
  await ansicht(t, 'lernen');
  const h = await t.evaluate(HERZ);
  const still = await t.evaluate(() => {
    const b = document.querySelector<HTMLElement>('[data-t595="herz"]');
    if (!b || b.tagName !== 'BUTTON') return null;
    b.click();
    const lauf = [...b.querySelectorAll('*')].map(x => getComputedStyle(x).animationName).filter(n => n && n !== 'none');
    return { gedrueckt: b.getAttribute('aria-pressed'), lauf };
  });
  p(`${art === 'weniger' ? '„weniger Bewegung"' : 'data-bewegung="ruhig"'}: der Zustand wechselt`, still?.gedrueckt === 'true', JSON.stringify({ tag: h?.tag, still }));
  p(`${art === 'weniger' ? '„weniger Bewegung"' : 'data-bewegung="ruhig"'}: und nichts springt (keine laufende Bewegung im Herz)`,
    !!still && still.lauf.length === 0, JSON.stringify(still?.lauf));
  await c3.close();
}

/* ══ §9 Einmalige Zahlen ════════════════════════════════════════════════ */
console.log('\n§9 Einmalige Zahlen bekommen kein echtes Herz');
{
  const { ctx: c4, s: t } = await oeffnen();
  await t.evaluate(BESTAND);
  await ansicht(t, 'pruefungen');
  await t.evaluate(async () => {
    Lernwelt.simulationStarten('t595-keine');
    for (let i = 0; i < 60 && !document.querySelector('.lw-simulation-result'); i++) {
      const b = document.querySelector<HTMLElement>('[data-lw-action="simulation-reveal"]') ||
        document.querySelector<HTMLElement>('[data-lw-sim-answer="right"]');
      if (!b) break;
      b.click();
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 600));
  });
  const sim = await t.evaluate(() => {
    const karten = [...document.querySelectorAll<HTMLElement>('.lw-simulation-result .stat-karte.lw-metrik')];
    return { karten: karten.length,
      knoepfe: karten.filter(k => k.querySelector(':scope > button, :scope > .lw-kennzahl-merk')).length,
      schmuck: karten.filter(k => k.querySelector(':scope > .rmo-heart[aria-hidden="true"]')).length };
  });
  p('Das Ergebnis der Simulation steht da, mit Kennzahlen', sim.karten >= 3, JSON.stringify(sim));
  p('… keine davon trägt einen Merkknopf', sim.karten >= 3 && sim.knoepfe === 0, JSON.stringify(sim));
  p('… ihr Schmuck bleibt, wie er war (aria-hidden, L241)', sim.karten >= 3 && sim.schmuck === sim.karten, JSON.stringify(sim));
  await c4.close();
}

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
