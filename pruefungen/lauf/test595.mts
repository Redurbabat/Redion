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
 *      Karte; schon in Ruhe ist er ein offenes HERZ, und daneben steht
 *      kein zweites, gemaltes.
 *   §2 DIE MAUS SCHALTET. Ein Klick: `aria-pressed="true"`, Name „Aus
 *      Favoriten: fällige Fehler", die Form ist ein HERZ (nicht das Band
 *      der Seitenfavoriten) und gefüllt — offen gegen gefüllt, auch ohne
 *      Farbe zu unterscheiden (Methode test433 §4).
 *   §3 ES WIRD GEMERKT. `Lernwelt.modelle.kennzahlenGemerkt()` enthält
 *      `faellige-fehler`; auf „Heute" steht ein Streifen „Gemerkt" mit
 *      derselben Zahl wie in der Lernzentrale, und sein Herz ist gefüllt.
 *   §4 ES ÜBERLEBT DAS NEULADEN — Knopf gedrückt, Streifen da.
 *   §5 EIN ZWEITER KLICK (im Streifen) NIMMT BEIDES WEG — und wer mit der
 *      Tastatur im Streifen ein Herz löst, behält den Fokus: er springt
 *      auf das nächste Herz im Streifen, und wenn der Streifen ganz weg
 *      ist, auf eine Stelle in der Lernwelt (nie auf <body>, §38).
 *   §6 TASTATUR UND FINGER. Enter und Leertaste schalten; ein Fingertipp
 *      am Telefon (CDP) schaltet; der Fokus ist sichtbar — und sein Ring
 *      liegt ganz in der Karte, statt an ihrem Rand abgeschnitten zu werden.
 *   §7 SCHEITERT DAS SCHREIBEN, kehrt der Knopf zurück und sagt es (Toast).
 *      Und das Zurück nimmt nur die EIGENE Änderung zurück: was ein
 *      anderer Tab inzwischen gemerkt hat, bleibt stehen (§16).
 *   §8 OHNE BEWEGUNG springt nichts — weder mit „weniger Bewegung" noch
 *      mit `body[data-bewegung="ruhig"]`; der Zustand wechselt trotzdem.
 *   §9 EINMALIGE ZAHLEN BEKOMMEN KEIN ECHTES HERZ: die Karten im Ergebnis
 *      einer Prüfungssimulation tragen keinen Knopf; ihr Schmuck bleibt,
 *      wie er war (aria-hidden, L241 — Redur entscheidet, ob er geht).
 *  §10 JEDES HERZ SAGT, WAS ES MERKT (§38, Durchsicht vom 10. Oktober).
 *      Ein Vorlesename steht ohne seine Ansicht da: „Zu Favoriten: fällig"
 *      sagt nicht, WAS fällig ist, und im Streifen „Gemerkt" auf Heute
 *      fehlt die Ansicht auch dem Auge. Also nennt jedes Herz der Lernwelt
 *      ein Ding — ein Hauptwort (gross geschrieben) —, und im Streifen
 *      steht über der Zahl derselbe Name wie im Herz.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Gegen den Stand 1bfaca53 (claude/morgen-besser-2) rot — die Zeilen
 *   stehen im Commit „test595 (rot)". Die Gegenproben zu E719 stehen im
 *   Commit dazu. §10 kam mit der Durchsicht vom 10. Oktober und war gegen
 *   ca4b23190 rot mit fünf Namen ohne Ding — Commit „test596/test595
 *   (rot): Das Wort bleibt lesbar …".
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
const doppelt = await s.evaluate(() => [...document.querySelectorAll('.lw-learning .stat-karte.lw-metrik')]
  .filter(k => k.querySelector(':scope > .lw-kennzahl-merk') && k.querySelector(':scope > .rmo-heart')).length);
p('… und kein zweites, gemaltes Herz daneben (die Attrappe ist ersetzt, nicht verdoppelt)', doppelt === 0, doppelt + ' Karten mit zwei Herzen');
const herzD = await s.evaluate(() => (window as any).Merkzeichen?.HERZ ?? null);
p('… und schon in Ruhe ist es ein offenes HERZ (nicht das Band)', !!herzD && h1?.form === herzD && h1?.fuellung === 'none',
  `d=${String(h1?.form).slice(0, 24)} fill=${h1?.fuellung}`);

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

/* §5b Der Fokus bleibt, wenn der Streifen sich ändert (Durchsicht vom
   6. Oktober: Leertaste im Streifen → document.activeElement = BODY). */
await ansicht(s, 'lernen');
for (const id of ['faellige-fehler', 'neue-karten']) {
  await s.evaluate((id: string) => document.querySelector<HTMLElement>(`.lw-learning [data-lw-merk="${id}"]`)?.click(), id);
  await warte(s, 250);
}
await s.evaluate(() => Store.flush());
await ansicht(s, 'heute');
await s.keyboard.press('Shift');
const fokusWo = () => s.evaluate(() => {
  const a = document.activeElement as HTMLElement | null;
  return { tag: a?.tagName ?? null, merk: a?.dataset?.lwMerk ?? null,
    imStreifen: !!a?.closest('.lw-gemerkt'), inLernwelt: !!a?.closest('.lernwelt'),
    streifen: !!document.querySelector('.lw-gemerkt') };
});
await s.evaluate(() => document.querySelector<HTMLElement>('.lw-gemerkt [data-lw-merk="faellige-fehler"]')?.focus());
const f0 = await fokusWo();
p('§5b: das Herz „fällige Fehler" im Streifen hat den Tastenfokus', f0.merk === 'faellige-fehler' && f0.imStreifen, JSON.stringify(f0));
await s.keyboard.press('Space'); await warte(s, 400);
const f1 = await fokusWo();
p('§5b: Leertaste löst es — der Fokus springt auf das nächste Herz im Streifen, nicht auf <body>',
  f1.tag === 'BUTTON' && f1.imStreifen && f1.merk === 'neue-karten', JSON.stringify(f1));
await s.keyboard.press('Space'); await warte(s, 400);
const f2 = await fokusWo();
p('§5b: das letzte Herz gelöst — der Streifen ist weg, der Fokus steht in der Lernwelt, nicht auf <body>',
  !f2.streifen && f2.tag !== 'BODY' && f2.tag !== null && f2.inLernwelt, JSON.stringify(f2));
await s.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

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
/* Der Ring liegt GANZ in der Karte. Die Karte schneidet ab (overflow), und
   ein Herz bei 1 px vom Rand mit 2 px Umriss, 2 px Abstand und Schein
   darum wurde oben und rechts gekappt (Durchsicht vom 6. Oktober). */
const ring = await s.evaluate(() => {
  const b = document.querySelector<HTMLElement>('[data-t595="herz"]');
  const k = b?.closest<HTMLElement>('.stat-karte');
  if (!b || !k) return null;
  const cs = getComputedStyle(b);
  const umriss = cs.outlineStyle !== 'none' ? parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset || '0') : 0;
  const schein = [...cs.boxShadow.matchAll(/(?:^|,)\s*(?:rgba?\([^)]*\)\s*)?(-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px(?![^,]*inset)/g)]
    .map(m => Math.abs(parseFloat(m[1] ?? '0')) + parseFloat(m[4] ?? '0') + parseFloat(m[3] ?? '0') / 2)
    .reduce((a, x) => Math.max(a, x), 0);
  const aus = Math.max(umriss, schein);
  const r = b.getBoundingClientRect(), q = k.getBoundingClientRect();
  const kc = getComputedStyle(k);
  const schneidet = kc.overflow !== 'visible' || kc.overflowX !== 'visible' || kc.contain.includes('paint');
  return { aus: +aus.toFixed(1), schneidet, oben: +(r.top - aus - q.top).toFixed(1), rechts: +(q.right - (r.right + aus)).toFixed(1),
    links: +(r.left - aus - q.left).toFixed(1) };
});
p('… und der Fokusring liegt ganz in der Karte (nicht abgeschnitten)',
  !!ring && (!ring.schneidet || (ring.oben >= 0 && ring.rechts >= 0 && ring.links >= 0)), JSON.stringify(ring));
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
/* §7b Das Zurück überschreibt keinen anderen Tab. Die Nachbildung: das
   erste Schreiben rechnet wie das echte im Zwischenspeicher, dann merkt
   „ein anderer Tab" die Kennzahl „streak" (echt geschrieben), und erst
   danach scheitert die Transaktion. Ein Zurück mit dem Stand vom Klick
   (`setMeta(…, vorher)`) würde „streak" wieder löschen. */
await s.evaluate(() => {
  const echt = Store.metaListeAendern;
  (window as any).__alt = echt;
  let erster = true;
  (Store as any).metaListeAendern = (k: string, f: (l: any[]) => any[]) => {
    if (!erster) return echt(k, f);
    erster = false;
    const jetzt = Store.getMeta(k, []);
    Store.setMeta(k, f(Array.isArray(jetzt) ? jetzt : []));
    return echt(k, (l: any[]) => l.includes('streak') ? l : [...l, 'streak'])
      .then(() => Promise.reject(new Error('Prüflauf: die Ablage sagt nein')));
  };
});
const h7b = await s.evaluate(HERZ);
if (h7b?.tag === 'BUTTON') await s.mouse.click(h7b.x, h7b.y);
await warte(s, 700);
await s.evaluate(() => { (Store as any).metaListeAendern = (window as any).__alt; });
await s.evaluate(() => Store.flush());
const liste7b = await gemerkt(s);
p('§7b: nach dem Zurück steht „streak" (der andere Tab) noch da, „faellige-fehler" nicht',
  Array.isArray(liste7b) && liste7b.includes('streak') && !liste7b.includes('faellige-fehler'), JSON.stringify(liste7b));
await s.evaluate(async () => {
  const k = Object.keys(Store.cache.meta).find(k => /^lernwelt:.*:kennzahlen$/.test(k));
  if (k) await Store.metaListeAendern(k, (l: any[]) => l.filter(x => x !== 'streak'));
});
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

/* ══ §10 Jedes Herz sagt, was es merkt ══════════════════════════════════
   Alle Herzen der vier Ansichten mit Kennzahlen werden gedrückt (ein Klick
   wie von Hand), dann zeigt Heute den Streifen mit allen. Ein Hauptwort
   erkennt man im Deutschen am grossen Anfangsbuchstaben — „fällig", „neu",
   „noch instabil" haben keins. */
console.log('\n§10 Jedes Herz sagt, was es merkt');
{
  const { ctx: c5, s: t } = await oeffnen();
  await t.evaluate(BESTAND);
  const herzen = new Map<string, string>();
  for (const a of ['heute', 'lernen', 'fehler', 'fortschritt']) {
    await ansicht(t, a);
    const hier = await t.evaluate(async () => {
      for (const h of [...document.querySelectorAll<HTMLElement>('.lernwelt [data-lw-merk]')]) {
        if (h.getAttribute('aria-pressed') === 'true') continue;
        h.click();
        await new Promise(r => setTimeout(r, 40));
      }
      await new Promise(r => setTimeout(r, 200));
      return [...document.querySelectorAll<HTMLElement>('.lernwelt [data-lw-merk]')].map(h => ({
        id: h.dataset['lwMerk'] || '', name: (h.getAttribute('aria-label') || '').replace(/^(Zu|Aus) Favoriten: /, '') }));
    });
    for (const h of hier) if (h.id) herzen.set(h.id, h.name);
  }
  const katalog = await t.evaluate(() => (window as any).Lernwelt?.modelle?.kennzahlen?.()?.length ?? 0);
  p(`§10: alle Kennzahlen des Katalogs haben ein Herz bekommen (${herzen.size} von ${katalog})`,
    katalog >= 20 && herzen.size === katalog, [...herzen.keys()].join(', '));
  const ohneDing = [...herzen].filter(([, name]) => !/(^|[\s-])\p{Lu}/u.test(name)).map(([id, name]) => `„${name}" (${id})`);
  await ansicht(t, 'heute');
  const streifen = await t.evaluate(() => [...document.querySelectorAll<HTMLElement>('.lw-gemerkt .stat-karte.lw-metrik')].map(k => ({
    etikett: [...k.querySelectorAll(':scope > span')].map(x => (x.textContent || '').trim()).filter(Boolean).join(' '),
    herz: (k.querySelector(':scope > .lw-kennzahl-merk')?.getAttribute('aria-label') || '').replace(/^(Zu|Aus) Favoriten: /, '') })));
  const anders = streifen.filter(k => k.etikett !== k.herz).map(k => `„${k.etikett}" ≠ „${k.herz}"`);
  p(`§10: jedes Herz nennt ein Ding — ein Hauptwort im Vorlesenamen (${herzen.size} geprüft)`,
    herzen.size > 0 && ohneDing.length === 0, ohneDing.length + ' ohne: ' + ohneDing.join(' · '));
  p(`§10: im Streifen „Gemerkt" steht über jeder Zahl der Name ihres Herzens (${streifen.length} Karten)`,
    streifen.length === herzen.size && anders.length === 0, anders.join(' · '));
  await c5.close();
}

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
