/* Suite 603 — Der Kopf: Suche links, rechts nur Zeichen, Motor und Glas als Zustand (E728)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat im Masterprompt vom 29. September 2026
 * (Seite 7, mit seinem Bild auf Seite 15, rot umkreist) geschrieben:
 *
 *     „hier es sollte die sucher nur die emojis dort bleiben und alles
 *      komplet nacht links schieiben, die suche sollte folgende animationen
 *      haben wenn ich mist maus drauf/dürber gehe sollte es die suche sich
 *      drehen wie eine mottor und glass efeckt haben wie beim appel."
 *
 * Gemeint ist der Studio-Kopf `#studio-bar` am Rechner: „Suchen & finden ·
 * Strg P", ◐, „+ PDF öffnen", +, ⌘, ⊞ standen alle rechts. Rechts sollen nur
 * die Zeichen bleiben, die Suche gehört nach links, und unter Zeiger (und
 * Fokus) dreht sich die Lupe einmal wie ein Motor, und die Kapsel wird Glas.
 *
 * DIE URSACHE der Lage war EINE Deklaration: `studio.css` gab
 * `margin-left:auto` der Suchkapsel statt dem ersten Zeichen — die Kapsel
 * schob sich selbst in die rechte Gruppe; die Reihenfolge im DOM stimmte
 * schon. Die Doppelungen hatten drei Ursachen: „PDF öffnen" trug dasselbe
 * `plus` wie „Neu erstellen" und dazu Text; `command` hiess an „Werkzeuge
 * einblenden" etwas anderes als bei „Befehle" (§38, E273); und die rechte
 * Gruppe des Menübands stand bei offener Lade direkt unter denselben Zielen
 * im Kopf (E457 hat das als L117 Punkt 3 offen gelassen).
 *
 * DIE ZUSAGEN:
 *
 *   §1  LAGE bei 1440, 1280, 1024 und 800: die Kapsel steht links neben dem
 *       Navigationsknopf (Abstand ≤ 16 px), links von jedem Zeichen der
 *       rechten Gruppe, und ist mindestens 240 px breit.
 *   §2  RECHTS NUR ZEICHEN: jeder sichtbare Knopf rechts der Kapsel trägt
 *       keinen sichtbaren Text und hat einen Vorlesenamen.
 *   §3  KEIN ZEICHEN ZWEIMAL: jedes `data-sym` im Kopf kommt einmal vor;
 *       „Werkzeuge einblenden" trägt nicht `command` (das bleibt „Befehle"),
 *       sondern `band`; „PDF öffnen" trägt `upload` wie der Tropfen „PDF
 *       einlesen" im +-Menü (E712) und heisst weiter „PDF öffnen".
 *   §4  KEINE ZWEITE REIHE: Lade offen am Rechner — keine sichtbare Suche,
 *       KI, Konto, Glocke, Aufträge im Band; JEDER verborgene Zwilling tut
 *       dasselbe wie sein sichtbarer (dieselbe Funktion, gemessen am
 *       Aufruf) — sonst wäre es „doppelt verstecken, beide laufen weiter".
 *       Die Blase von „Werkzeuge" liegt über dem offenen Band. Am Telefon
 *       (390) bleiben Suche, KI und Konto im Band sichtbar (test40/test384).
 *   §5  MOTOR UND GLAS NUR ALS ZUSTAND: unter Zeiger und Tastenfokus läuft
 *       an der Lupe EINE Drehung (nur transform), die Kapsel wird Glas
 *       (`backdrop-filter` aus `--glas-blur`, nur unter `@supports` mit dem
 *       Präfix-Zwilling); in Ruhe nichts davon. Am Telefon dreht sich `⌕`
 *       beim Drücken und unter dem Tastenfokus. Weniger Bewegung und
 *       „Ruhige Darstellung" ≤ 1 ms; Starker Kontrast und weniger
 *       Transparenz deckend.
 *   §6  DIE SUCHE WÄCHST WEITER AUS DER KAPSEL (E711) — aus ihrem neuen Ort,
 *       per Klick und per Strg P, und der Motor dreht dabei.
 *   §7  44 × 44 für jeden Kopfknopf (§37), kein waagerechter Überlauf von
 *       761 bis 1440 (test54).
 *   §8  EIN TITEL AUCH AM RECHNER (E701 Nr. 7): solange der grosse Titel zu
 *       sehen ist, steht die gleichnamige Krume nicht noch einmal sichtbar
 *       da; rollt er weg, kommt sie zurück.
 *   §9  DIE EINZELDATEI zeigt denselben Kopf.
 *
 * Kein Port: geladen wird über file:// (§6, §29).
 *
 *   node pruefungen/alle.mts 603
 * ==========================================================================*/
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;
const EINZEL = pathToFileURL(path.join(WURZEL, 'redion-einzeldatei.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser: Browser = await chromium.launch();
const fehler: string[] = [];
type Offen = { pc: Page; kontext: BrowserContext };
type Wahl = { breite?: number; hoehe?: number; finger?: boolean; weniger?: boolean; adresse?: string; ort?: string };

const BEREIT = "typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' && typeof Menueband !== 'undefined' && !!Store.cache.blocks && !!document.body.dataset.studioNav";

const oeffnen = async (o: Wahl = {}): Promise<Offen> => {
  const kontext = await browser.newContext({
    viewport: { width: o.breite ?? 1440, height: o.hoehe ?? 900 }, colorScheme: 'dark',
    hasTouch: !!o.finger, isMobile: !!o.finger,
    ...(o.weniger ? { reducedMotion: 'reduce' as const } : {})
  });
  const pc = await kontext.newPage();
  pc.setDefaultTimeout(15000);
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await pc.goto(o.adresse ?? INDEX);
  await pc.waitForFunction(BEREIT);
  await pc.waitForTimeout(900);
  await pc.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    try { Store.setMeta('neuerungenGesehen', Math.max(...Rundgang.NEUERUNGEN.map(n => n.nr))); } catch { /* ohne Rundgang */ }
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    /* Im Lernzentrum steht „PDF öffnen" im Kopf (im Regal ist er
       ausgeblendet, E457 Punkt 5) — also das vollere Bild. */
    if (${JSON.stringify(o.ort ?? 'lernen')} === 'lernen' && typeof Produktwelten !== 'undefined') Produktwelten.lernen('heute');
    else Bibliothek.oeffne(null);
  })()`);
  await pc.waitForTimeout(500);
  await pc.mouse.move(700, 700);
  return { pc, kontext };
};

/* Sichtbarer Text: ein Textknoten, dessen Träger wirklich Fläche hat und
   nicht weggeschnitten ist (ein nur vorgelesenes Wort zählt nicht). */
const SICHTBARER_TEXT = `((knopf) => {
  const raus = [];
  const gang = document.createTreeWalker(knopf, NodeFilter.SHOW_TEXT);
  for (let n = gang.nextNode(); n; n = gang.nextNode()) {
    const t = (n.textContent || '').trim(); if (!t) continue;
    const e = n.parentElement; if (!e) continue;
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
    if (r.width <= 1 || r.height <= 1 || cs.clipPath === 'inset(50%)') continue;
    raus.push(t);
  }
  return raus.join(' ');
})`;

const KOPF = (pc: Page) => pc.evaluate(`(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; };
  const bar = document.getElementById('studio-bar');
  const such = document.getElementById('studio-search'), nav = document.getElementById('studio-nav');
  const sichtbar = (e) => e.getClientRects().length > 0 && e.getBoundingClientRect().width > 0;
  const knoepfe = [...bar.querySelectorAll('button')].filter(sichtbar);
  const s = R(such), n = R(nav);
  const rechts = knoepfe.filter(k => k.getBoundingClientRect().left >= s.r - 1 && k !== such);
  const text = ${SICHTBARER_TEXT};
  return { such: s, nav: n,
    rechts: rechts.map(k => ({ id: k.id, ...R(k), text: text(k), name: k.getAttribute('aria-label') || '' })),
    alle: knoepfe.map(k => ({ id: k.id || k.className, ...R(k) })),
    ueber: document.documentElement.scrollWidth - innerWidth, barUeber: bar.scrollWidth - bar.clientWidth };
})()`) as Promise<any>;

/* ══ §1 Lage ═══════════════════════════════════════════════════════════════ */
console.log('\n§1 Die Suche steht links');
for (const breite of [1440, 1280, 1024, 800]) {
  const { pc, kontext } = await oeffnen({ breite });
  const k = await KOPF(pc);
  const abstand = k.such.x - k.nav.r;
  const links = k.rechts.length > 0 && k.rechts.every((r: any) => r.x >= k.such.r);
  p(`${breite}: die Kapsel steht neben dem Navigationsknopf (Abstand ${abstand} ≤ 16)`, abstand >= 0 && abstand <= 16,
    `Kapsel x ${k.such.x}, Navigation endet ${k.nav.r}`);
  p(`${breite}: … links von jedem Zeichen rechts`, links, JSON.stringify(k.rechts.map((r: any) => r.id + '@' + r.x)));
  p(`${breite}: … und mindestens 240 px breit`, k.such.w >= 240, String(k.such.w));
  await kontext.close();
}

/* ══ §2 Rechts nur Zeichen ═════════════════════════════════════════════════ */
console.log('\n§2 Rechts nur Zeichen, jedes mit Namen');
for (const ort of ['lernen', 'regal']) {
  const { pc, kontext } = await oeffnen({ ort });
  const k = await KOPF(pc);
  const mitText = k.rechts.filter((r: any) => r.text);
  const ohneName = k.rechts.filter((r: any) => !r.name);
  p(`${ort}: rechts der Kapsel trägt kein Knopf sichtbaren Text`, k.rechts.length >= 4 && mitText.length === 0,
    JSON.stringify(mitText.map((r: any) => r.id + ': ' + r.text)));
  p(`${ort}: … und jeder hat einen Vorlesenamen`, ohneName.length === 0, JSON.stringify(ohneName.map((r: any) => r.id)));
  await kontext.close();
}

/* ══ §3 Kein Zeichen zweimal ═══════════════════════════════════════════════ */
console.log('\n§3 Jedes Zeichen einmal, jedes mit einer Bedeutung');
{
  const { pc, kontext } = await oeffnen();
  const z = await pc.evaluate(`(() => {
    const bar = document.getElementById('studio-bar');
    const syms = [...bar.querySelectorAll('[data-sym]')].map(e => e.dataset.sym);
    const doppelt = syms.filter((s, i) => syms.indexOf(s) !== i);
    const tools = document.getElementById('studio-tools'), imp = document.getElementById('studio-import');
    return { syms, doppelt,
      tools: tools.querySelector('[data-sym]')?.dataset.sym, toolsName: tools.getAttribute('aria-label'),
      toolsSvg: !!tools.querySelector('svg.sym'), band: Register.symbole.hat('band'),
      imp: imp.querySelector('[data-sym]')?.dataset.sym, impName: imp.getAttribute('aria-label'), impTitel: imp.title,
      befehle: Register.symbole.hat('command') };
  })()`) as any;
  p('Jedes data-sym im Kopf kommt einmal vor', z.doppelt.length === 0, 'doppelt: ' + z.doppelt.join(',') + ' in ' + z.syms.join(','));
  p('„Werkzeuge einblenden" trägt nicht ⌘ (command heisst „Befehle")', z.tools !== 'command', String(z.tools));
  p('… sondern das neue Strichzeichen „band" aus dem Register', z.tools === 'band' && z.band && z.toolsSvg, JSON.stringify(z));
  p('… und heisst weiter „Werkzeuge einblenden" (test384)', z.toolsName === 'Werkzeuge einblenden', String(z.toolsName));
  p('„PDF öffnen" trägt „upload" — dasselbe Zeichen wie der Tropfen „PDF einlesen" (E712)', z.imp === 'upload', String(z.imp));
  p('… und heisst weiter „PDF öffnen" (Name und Titel, IMPORT_WORT)', z.impName === 'PDF öffnen' && z.impTitel === 'PDF öffnen',
    JSON.stringify([z.impName, z.impTitel]));
  await kontext.close();
}

/* ══ §4 Keine zweite Reihe ═════════════════════════════════════════════════ */
console.log('\n§4 Lade offen: keine zweite Reihe — und die Zwillinge tun dasselbe');
{
  const { pc, kontext } = await oeffnen();
  await pc.click('#studio-tools'); await pc.waitForTimeout(500);
  const v = await pc.evaluate(`(() => {
    const sichtbar = (id) => { const e = document.getElementById(id); return !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().width > 0; };
    return { offen: document.body.dataset.studioTools,
      band: ['mb-suche', 'mb-ki', 'mb-konto', 'mb-glocke', 'mb-auftraege'].filter(sichtbar),
      kopf: ['studio-search', 'studio-account', 'btn-ai'].filter(sichtbar) };
  })()`) as any;
  p('Die Lade ist offen', v.offen === 'offen', String(v.offen));
  p('Im Band steht keine zweite Suche, KI, Konto, Glocke, Aufträge', v.band.length === 0, v.band.join(', '));
  p('… die Ziele stehen eine Zeile darüber (Suche, Konto im Kopf, KI in den Seitenwerkzeugen)', v.kopf.length === 3, v.kopf.join(', '));
  /* Jeder Zwilling ruft dieselbe Funktion. Gezählt wird am Aufruf: die
     Ziele werden kurz ersetzt, beide Knöpfe gedrückt (`click()` erreicht
     auch einen verborgenen), dann kommen die echten zurück. */
  const zwillinge = await pc.evaluate(`(() => {
    const z = {}; const echt = {};
    const fang = (obj, name, key) => { echt[key] = [obj, name, obj[name]]; obj[name] = function () { z[key] = (z[key] || 0) + 1; }; };
    fang(App, 'suche', 'suche'); fang(App, 'arbeitsbereich', 'konto');
    fang(Ansichten, 'posteingang', 'glocke'); fang(AuftragsAnzeige, 'oeffnen', 'auftraege');
    const paare = [['studio-search', 'mb-suche', 'suche'], ['studio-account', 'mb-konto', 'konto'],
                   ['studio-glocke', 'mb-glocke', 'glocke'], ['studio-auftraege', 'mb-auftraege', 'auftraege']];
    const raus = [];
    for (const [a, b, key] of paare) {
      z[key] = 0; document.getElementById(a).click(); const nachA = z[key];
      document.getElementById(b).click(); const nachB = z[key];
      raus.push({ key, kopf: nachA, band: nachB - nachA });
    }
    Object.values(echt).forEach(([o, n, f]) => { o[n] = f; });
    document.querySelectorAll('.overlay,.finder').forEach(e => e.remove());
    /* Die KI: der Kopf-Zwilling ist #btn-ai, beide öffnen dasselbe Fach. */
    const kiAuf = () => document.getElementById('btn-ai').classList.contains('on');
    document.getElementById('mb-ki').click(); const viaBand = kiAuf();
    App.kiPanel(false);
    document.getElementById('btn-ai').click(); const viaKopf = kiAuf();
    App.kiPanel(false);
    raus.push({ key: 'ki', kopf: viaKopf ? 1 : 0, band: viaBand ? 1 : 0 });
    /* Der Fächer der Glocke hängt an beiden (E711). */
    return raus;
  })()`) as Array<{ key: string; kopf: number; band: number }>;
  for (const t of zwillinge)
    p(`Zwilling „${t.key}": Kopf und Band rufen dieselbe Funktion`, t.kopf === 1 && t.band === 1, JSON.stringify(t));
  /* Die Blase von „Werkzeuge" liegt über dem offenen Band. Ein
     Pseudo-Element lässt sich nicht treffen; für die Messung bekommt es
     kurz Zeigerereignisse, dann fragt `elementFromPoint`, wer oben liegt. */
  await pc.hover('#studio-tools'); await pc.waitForTimeout(300);
  const blase = await pc.evaluate(`(() => {
    const st = document.createElement('style'); st.textContent = '#studio-tools::after{pointer-events:auto!important}';
    document.head.append(st);
    const k = document.getElementById('studio-tools'); const r = k.getBoundingClientRect();
    const vor = getComputedStyle(k, '::after');
    /* Mitte UND rechter Rand der Blase: die Ecke des Bandes (Klappe) lag
       zuerst nur über ihrem rechten Ende (Bild, 6. Oktober). */
    const y = r.bottom + 8 + 10;
    const stellen = [r.left + r.width / 2, r.left + r.width / 2 + 56];
    const oben = stellen.map(x => document.elementFromPoint(x, y));
    st.remove();
    return { anzeige: vor.display, oben: oben.map(o => o ? (o.id || o.className || o.tagName) : null), istKnopf: oben.every(o => o === k) };
  })()`) as any;
  p('Die Blase von „Werkzeuge" liegt über dem offenen Band', blase.anzeige === 'block' && blase.istKnopf, JSON.stringify(blase));
  await kontext.close();
}
{
  const { pc, kontext } = await oeffnen({ breite: 390, hoehe: 844, finger: true });
  const t = await pc.evaluate(`['mb-suche', 'mb-ki', 'mb-konto'].map(id => { const e = document.getElementById(id); return e && e.getClientRects().length > 0 && e.getBoundingClientRect().width > 0 ? id : null; }).filter(Boolean)`) as string[];
  p('Telefon: Suche, KI und Konto bleiben im Band sichtbar (die einzige Zeile)', t.length === 3, t.join(', '));
  await kontext.close();
}

/* ══ §5 Motor und Glas ═════════════════════════════════════════════════════ */
console.log('\n§5 Motor und Glas — nur als Zustand');
const MOTOR = (sel: string) => `(() => {
  const k = document.querySelector(${JSON.stringify(sel)}); const svg = k && k.querySelector('[data-sym] > svg');
  if (!svg) return null;
  const an = svg.getAnimations().filter(a => a.playState === 'running' || a.playState === 'finished');
  const kf = an.flatMap(a => a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []);
  const arten = [...new Set(kf.flatMap(x => Object.keys(x).filter(n => !['offset','easing','composite','computedOffset'].includes(n))))];
  const cs = getComputedStyle(k);
  return { namen: an.map(a => a.animationName || '?'), arten, dreh: kf.some(x => /rotate|matrix/.test(String(x.transform || ''))),
    dauer: getComputedStyle(svg).animationDuration, glas: cs.backdropFilter, wglas: cs.getPropertyValue('-webkit-backdrop-filter'), grund: cs.backgroundColor };
})()`;
{
  const { pc, kontext } = await oeffnen();
  const ruhe = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('In Ruhe: keine Drehung, kein Glas', !!ruhe && ruhe.namen.length === 0 && ruhe.glas === 'none', JSON.stringify(ruhe));
  await pc.hover('#studio-search'); await pc.waitForTimeout(120);
  const zeigen = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('Unter dem Zeiger: die Lupe dreht sich (eine Animation mit Drehung)', !!zeigen && zeigen.namen.length === 1 && zeigen.dreh, JSON.stringify(zeigen));
  p('… nur transform', !!zeigen && zeigen.arten.length > 0 && zeigen.arten.every((a: string) => a === 'transform'), JSON.stringify(zeigen?.arten));
  /* Den Präfix-Zwilling kann Chromium nicht zurückmelden: `-webkit-backdrop-
     filter` ist dort nur ein Alias und hat keinen eigenen gerechneten Wert
     (gemessen: ""). Ihn hält die Textprüfung darunter („im selben Block"). */
  p('… und die Kapsel ist Glas (Unschärfe aus --glas-blur)',
    !!zeigen && /blur\(20px\)/.test(zeigen.glas), JSON.stringify([zeigen?.glas, zeigen?.wglas]));
  const lauf = await pc.evaluate(`(() => { const svg = document.querySelector('#studio-search [data-sym] > svg');
    const a = svg.getAnimations()[0]; return a ? a.effect.getTiming().iterations : null; })()`);
  p('… genau EINE Umdrehung, kein Dauerlauf', lauf === 1, String(lauf));
  await pc.mouse.move(700, 700); await pc.waitForTimeout(200);
  await pc.focus('#studio-nav'); await pc.keyboard.press('Tab'); await pc.waitForTimeout(120);
  const fokus = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('Unter dem Tastenfokus ebenso (nie nur Zeigen)', !!fokus && fokus.namen.length === 1 && fokus.dreh && /blur/.test(fokus.glas), JSON.stringify(fokus));
  /* Die Regel: Glas nur unter @supports, mit Präfix-Zwilling im selben Block. */
  const css = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/studio.css'), 'utf8');
  const sup = [...css.matchAll(/@supports\s*\(\(-webkit-backdrop-filter:blur\(1px\)\) or \(backdrop-filter:blur\(1px\)\)\)\s*\{([\s\S]*?\n\})/g)].map(m => m[1] ?? '');
  const glasRegel = sup.find(s => /studio-search/.test(s) && /backdrop-filter:\s*var\(--glas-blur\)/.test(s) && /-webkit-backdrop-filter:\s*var\(--glas-blur\)/.test(s));
  p('Das Glas der Kapsel steht nur unter @supports, mit -webkit-Zwilling, aus der Marke', !!glasRegel);
  const ausserhalb = css.replace(/@supports[^{]*\{[\s\S]*?\n\}/g, '');
  p('… und nirgends ausserhalb davon', !/studio-search[^{}]*\{[^{}]*backdrop-filter/.test(ausserhalb));
  /* Starker Kontrast: deckend. */
  await pc.evaluate(`Aussehen.setzen({ schema: 'kontrast', akzent: '' })`);
  await pc.hover('#studio-search'); await pc.waitForTimeout(150);
  const k = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('Starker Kontrast: unter dem Zeiger deckend, kein Weichzeichner',
    !!k && k.glas === 'none' && !/rgba\([^)]*, 0?\.\d+\)/.test(k.grund), JSON.stringify(k));
  await kontext.close();
}
{
  const { pc, kontext } = await oeffnen();
  const cdp = await pc.context().newCDPSession(pc);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await pc.hover('#studio-search'); await pc.waitForTimeout(150);
  const k = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('Weniger Transparenz: deckend, kein Weichzeichner', !!k && k.glas === 'none' && !/rgba\([^)]*, 0?\.\d+\)/.test(k.grund), JSON.stringify(k));
  await pc.mouse.move(700, 700);
  await pc.evaluate(`document.body.dataset.bewegung = 'ruhig'`);
  await pc.hover('#studio-search'); await pc.waitForTimeout(80);
  const r = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('Ruhige Darstellung: keine Drehung', !!r && r.namen.length === 0, JSON.stringify(r));
  await kontext.close();
}
{
  const { pc, kontext } = await oeffnen({ weniger: true });
  await pc.hover('#studio-search'); await pc.waitForTimeout(80);
  const w = await pc.evaluate(MOTOR('#studio-search')) as any;
  const ms = (d: string) => parseFloat(d) * (d.endsWith('ms') ? 1 : 1000);
  p('Weniger Bewegung: die Drehung dauert höchstens 1 ms', !!w && (w.namen.length === 0 || ms(w.dauer) <= 1), JSON.stringify(w));
  await kontext.close();
}
{
  const { pc, kontext } = await oeffnen({ breite: 390, hoehe: 844, finger: true });
  const r = await pc.evaluate(`(() => { const r = document.getElementById('mb-suche').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`) as number[];
  await pc.mouse.move(r[0]!, r[1]!); await pc.mouse.down(); await pc.waitForTimeout(80);
  const druck = await pc.evaluate(MOTOR('#mb-suche')) as any;
  await pc.mouse.up(); await pc.waitForTimeout(300);
  await pc.evaluate(`document.querySelectorAll('.overlay,.finder').forEach(e => e.remove())`);
  p('Telefon: ⌕ dreht sich beim Drücken (Finger, nicht nur Zeiger)', !!druck && druck.namen.length === 1 && druck.dreh, JSON.stringify(druck));
  p('Telefon: … und wird beim Drücken Glas (Vorgabe c)', !!druck && /blur\(20px\)/.test(druck.glas), JSON.stringify(druck?.glas));
  await pc.evaluate(`document.getElementById('mb-suche').blur()`);
  await pc.keyboard.press('Tab');
  await pc.evaluate(`document.getElementById('mb-suche').focus({ focusVisible: true })`);
  await pc.waitForTimeout(80);
  const fokus = await pc.evaluate(`(() => { const k = document.getElementById('mb-suche'); return { fv: k.matches(':focus-visible'), m: ${MOTOR('#mb-suche')} }; })()`) as any;
  p('Telefon: ⌕ dreht sich unter dem Tastenfokus', !fokus.fv || (!!fokus.m && fokus.m.namen.length === 1), JSON.stringify(fokus));
  await kontext.close();
}

/* ══ §6 Die Suche wächst aus der Kapsel ════════════════════════════════════ */
console.log('\n§6 Die Suche wächst weiter aus der Kapsel — von ihrem neuen Ort');
{
  const { pc, kontext } = await oeffnen();
  const spion = `(() => { window.__aus = null; const g = SelectionFlow.growFrom;
    SelectionFlow.growFrom = function (el, rect) { window.__aus = rect ? { x: Math.round(rect.left), w: Math.round(rect.width) } : null; return g.apply(this, arguments); }; })()`;
  await pc.evaluate(spion);
  const kapsel = await pc.evaluate(`(() => { const r = document.getElementById('studio-search').getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; })()`) as any;
  await pc.click('#studio-search'); await pc.waitForTimeout(150);
  const aus = await pc.evaluate('window.__aus') as any;
  p('Ein Klick lässt die Suche aus dem Rechteck der Kapsel wachsen', !!aus && aus.x === kapsel.x && aus.w === kapsel.w,
    JSON.stringify({ kapsel, aus }));
  const motor = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('… und der Motor dreht dabei', !!motor && motor.namen.length >= 1 && motor.dreh, JSON.stringify(motor));
  await pc.keyboard.press('Escape'); await pc.waitForTimeout(300);
  await pc.evaluate(`document.querySelectorAll('.overlay').forEach(e => e.remove())`);
  await pc.mouse.move(700, 700); await pc.waitForTimeout(200);
  await pc.evaluate(`(() => { window.__aus = null; const a = document.activeElement; if (a && a !== document.body) a.blur(); })()`);
  await pc.keyboard.press('Control+p'); await pc.waitForTimeout(150);
  const aus2 = await pc.evaluate('window.__aus') as any;
  const motor2 = await pc.evaluate(MOTOR('#studio-search')) as any;
  p('Strg P: dieselbe Kapsel, und der Motor dreht (Entscheidung e)', !!aus2 && aus2.x === kapsel.x && !!motor2 && motor2.namen.length >= 1,
    JSON.stringify({ aus2, motor2 }));
  await kontext.close();
}

/* ══ §7 44 × 44, kein Überlauf ═════════════════════════════════════════════ */
console.log('\n§7 Jeder Kopfknopf 44 × 44, kein Überlauf');
for (const breite of [761, 900, 1100, 1440]) {
  const { pc, kontext } = await oeffnen({ breite });
  const k = await KOPF(pc);
  const klein = k.alle.filter((b: any) => b.id !== 'studio-home' && (b.w < 44 || b.h < 44));
  p(`${breite}: jeder Kopfknopf misst mindestens 44 × 44`, klein.length === 0, JSON.stringify(klein));
  p(`${breite}: kein waagerechter Überlauf (Seite und Kopf)`, k.ueber <= 0 && k.barUeber <= 0, `${k.ueber} / ${k.barUeber}`);
  await kontext.close();
}

/* ══ §8 Ein Titel auch am Rechner ══════════════════════════════════════════ */
console.log('\n§8 Ein Titel — die Krume tritt zurück, solange der grosse Titel zu sehen ist');
{
  const { pc, kontext } = await oeffnen({ ort: 'regal' });
  await pc.evaluate(`(async () => {
    const s = Store.addPage(null, { text: 'Dokumente' });
    for (let i = 0; i < 60; i++) Store.addBlock(s.id, 'text', { text: 'Zeile ' + i });
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
  })()`);
  await pc.waitForTimeout(900);
  const krume = (pc: Page) => pc.evaluate(`(() => {
    const k = document.querySelector('#crumb > a:last-child');
    const h = document.querySelector('#page #title') || document.querySelector('#page h1');
    const cs = k ? getComputedStyle(k) : null;
    return { da: !!k, wort: k ? k.textContent.trim() : null, deck: cs ? +cs.opacity : null, sicht: cs ? cs.visibility : null,
             titel: document.getElementById('topbar').hasAttribute('data-titel-sichtbar'),
             h1: h ? Math.round(h.getBoundingClientRect().bottom) : null };
  })()`) as Promise<any>;
  const oben = await krume(pc);
  p('Titel sichtbar: die gleichnamige Krume steht nicht noch einmal sichtbar da', oben.da && (oben.deck === 0 || oben.sicht === 'hidden'), JSON.stringify(oben));
  await pc.evaluate(`(() => { const s = document.getElementById('scroll'); if (s) s.scrollTop = 1200; })()`);
  await pc.waitForTimeout(700);
  const unten = await krume(pc);
  p('Titel weggerollt: die Krume kommt zurück', unten.da && unten.deck === 1 && unten.sicht !== 'hidden', JSON.stringify(unten));
  await kontext.close();
}

/* ══ §9 Die Einzeldatei ════════════════════════════════════════════════════ */
console.log('\n§9 Die Einzeldatei');
{
  const { pc, kontext } = await oeffnen({ adresse: EINZEL });
  const k = await KOPF(pc);
  const abstand = k.such.x - k.nav.r;
  p('Die Einzeldatei: die Kapsel steht links, rechts nur Zeichen',
    abstand >= 0 && abstand <= 16 && k.rechts.every((r: any) => !r.text && r.x >= k.such.r), JSON.stringify({ abstand, rechts: k.rechts.map((r: any) => r.id + ':' + r.text) }));
  await kontext.close();
}

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
process.exit(weg ? 1 : 0);
