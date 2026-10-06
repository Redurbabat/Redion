/* Suite 602 — Das Gestirn: ein Hell/Dunkel-Schalter mit einer Regel (E727)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat im Masterprompt vom 29. September 2026
 * (Seite 23, mit einem Foto auf Seite 24) über den runden Knopf im
 * Studio-Kopf geschrieben:
 *
 *     „das hier für das sieht so nicht gut aus , es seiht noch nicht 100
 *      fetig aus, also finde für hier ewas kreatives aus,"
 *
 * Gemeint ist `#studio-theme` im Studio-Kopf `#studio-bar` (am Rechner ab
 * 761 px), zwischen der Suchkapsel und „+". Darin sass `span.studio-orb`:
 * eine 19-px-Scheibe, deren „Sichel" ein `box-shadow: inset …` in einer
 * festen Farbe war (#656079). Ein Mond entsteht so nur, wenn diese Farbe
 * gleich dem Grund der Leiste ist — in keinem der sechs dunklen Schemata
 * war sie es, und man sah eine halb beleuchtete Kugel: genau das Foto.
 *
 * UND DARUNTER EIN ZWEITER FEHLER. Dieselbe Funktion gab es dreimal mit
 * drei Regeln: der Knopf (`StudioSchale.themaWechseln`, merkt das Schema je
 * Grundton und behält den Akzent), `App.theme` (Strg⇧L, ◐ in der
 * Seitenleiste, Menüband „Hell / Dunkel", Befehlspalette, Backstage — sprang
 * immer auf Hell/Standard und merkte nichts) und die Staffelei in
 * Einstellungen → Aussehen (eine Kopie, die den Akzent zurücksetzte). Wer
 * „Mitternacht" hatte und Strg⇧L zweimal drückte, landete bei „Standard".
 * §8: „Zwei Umschalter, eine Regel" — E462 hatte genau das versprochen.
 *
 * DIE ZUSAGEN:
 *
 *   §1  EIN WEG. Von „Mitternacht" und „Touch Kit dunkel" aus führt jede
 *       Tür hin und zurück wieder ins Ausgangsschema: der Klick auf das
 *       Gestirn, Strg⇧L, `App.theme()`, ◐ in der Seitenleiste, die
 *       Staffelei, die Kachel „Dunkel", der Menüband-Eintrag „Hell /
 *       Dunkel" — und gemischt (hin mit der einen, zurück mit der anderen).
 *       Hin landet jede im gemerkten hellen Schema, und der eigene Akzent
 *       bleibt überall derselbe (Entscheidung b).
 *   §2  EIN SCHALTER. `role="switch"`, `aria-checked` sagt in allen zehn
 *       Schemata, ob gerade dunkel gilt; der Name bleibt „Dunkles Schema"
 *       (wie die Staffelei), das Kürzel steht in `aria-keyshortcuts`, und
 *       die Blase der Symbolreihe zeigt genau diesen Namen.
 *   §3  ZWEI ZEICHEN AUS DEM REGISTER. Sonne und Mond sind `svg.sym` aus
 *       `Register.symbole` (nur Striche), keine `.studio-orb`, kein
 *       Hexwert in den Regeln des Gestirns; das sichtbare Zeichen steht in
 *       allen zehn Schemata mit mindestens 3 : 1 gegen die Leiste (§38,
 *       Nicht-Text).
 *   §4  ES BEWEGT SICH — UND NUR TRANSFORM/OPACITY. Nach dem Klick laufen
 *       Übergänge an den Zeichen; die gerechnete Lage ist in Hell und
 *       Dunkel verschieden (vorher: dieselbe Matrix in beiden). Unter
 *       „weniger Bewegung" und „Ruhige Darstellung" höchstens 1 ms — der
 *       Zustand stimmt trotzdem.
 *   §5  44 × 44, und die Tastatur schaltet: Tab erreicht ihn, Leertaste
 *       und Enter schalten (§37, §38).
 *   §6  IN RUHE NEUTRAL. Das Zeichen trägt `--text-dim`, keine
 *       Akzentfläche (E701: kein zweiter violetter Fleck); unter Zeiger und
 *       Tastenfokus tönt es sich mit `--accent-text` (Farbe als Zustand).
 *   §7  DIE EINZELDATEI. `redion-einzeldatei.html` zeigt dasselbe Gestirn
 *       und schaltet.
 *
 * Kein Port: geladen wird über file:// — `index.html` per Doppelklick und
 * die Einzeldatei, so wie Redion startet (§6, §29).
 *
 *   node pruefungen/alle.mts 602
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
type Wahl = { breite?: number; weniger?: boolean; adresse?: string };

const BEREIT = "typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' && typeof Aussehen !== 'undefined' && !!Store.cache.blocks && !!document.body.dataset.studioNav";

const oeffnen = async (o: Wahl = {}): Promise<Offen> => {
  const kontext = await browser.newContext({
    viewport: { width: o.breite ?? 1440, height: 900 }, colorScheme: 'dark',
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
    Bibliothek.oeffne(null);
    /* Kontrast nach WCAG, über dem Grund der Leiste zusammengesetzt. */
    window.__rgb = (s) => { const m = String(s).match(/[\\d.]+/g) || ['0','0','0']; return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] }; };
    window.__lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    window.__kontrast = (a, b) => { const x = window.__lum(a), y = window.__lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    window.__grund = (el) => { for (let e = el; e; e = e.parentElement) { const c = window.__rgb(getComputedStyle(e).backgroundColor); if (c.a > 0.5) return c; } return { r: 0, g: 0, b: 0, a: 1 }; };
  })()`);
  await pc.waitForTimeout(400);
  return { pc, kontext };
};

const zustand = (pc: Page): Promise<{ schema: string; akzent: string; theme: string }> => pc.evaluate(`(() => {
  const e = Aussehen.einstellung();
  return { schema: e.schema, akzent: e.akzent || '', theme: document.documentElement.dataset.theme || '' };
})()`) as Promise<{ schema: string; akzent: string; theme: string }>;

/* ══ §1 Ein Weg ════════════════════════════════════════════════════════════ */
console.log('\n§1 Ein Weg — jede Tür hin und zurück, und das Schema bleibt');
{
  const { pc, kontext } = await oeffnen();
  type Tuer = { name: string; tun: (pc: Page) => Promise<void> };
  const taste = async (pc: Page): Promise<void> => {
    await pc.evaluate(`(() => { const a = document.activeElement; if (a && a !== document.body) a.blur(); })()`);
    await pc.keyboard.press('Control+Shift+L');
  };
  const staffelei = async (pc: Page): Promise<void> => {
    await pc.evaluate(`Aussehen.dialog()`);
    await pc.waitForTimeout(200);
    await pc.evaluate(`document.querySelector('.ru-staff').click()`);
    await pc.waitForTimeout(100);
    await pc.evaluate(`document.querySelectorAll('.overlay').forEach(o => o.remove())`);
  };
  const TUEREN: Tuer[] = [
    { name: 'Klick auf das Gestirn', tun: async pc => { await pc.click('#studio-theme'); } },
    { name: 'Strg⇧L', tun: taste },
    { name: 'App.theme()', tun: async pc => { await pc.evaluate('App.theme()'); } },
    { name: '◐ in der Seitenleiste', tun: async pc => { await pc.evaluate(`document.getElementById('btn-theme').click()`); } },
    { name: 'die Staffelei', tun: staffelei },
    { name: 'die Kachel „Dunkel"', tun: async pc => { await pc.evaluate(`Schnellkacheln.KACHELN.find(k => k.id === 'dunkel').tun()`); } },
    { name: 'Menüband „Hell / Dunkel"', tun: async pc => { await pc.evaluate(`Register.menueband.eines('a-hell').tun()`); } }
  ];
  const paare: Array<[Tuer, Tuer]> = TUEREN.map(t => [t, t] as [Tuer, Tuer]);
  paare.push([TUEREN[1]!, TUEREN[0]!], [TUEREN[0]!, TUEREN[2]!], [TUEREN[4]!, TUEREN[1]!]);
  for (const start of ['nacht', 'touchkit-dunkel']) {
    for (const [hin, zurueck] of paare) {
      await pc.evaluate(`(() => {
        Store.setMeta('studio:schema-light', 'papier');
        Store.setMeta('studio:schema-dark', 'standard');
        Aussehen.setzen({ schema: ${JSON.stringify(start)}, akzent: '#5cbf8a' });
      })()`);
      await pc.waitForTimeout(60);
      await hin.tun(pc); await pc.waitForTimeout(120);
      const mitte = await zustand(pc);
      await zurueck.tun(pc); await pc.waitForTimeout(120);
      const ende = await zustand(pc);
      const wege = hin === zurueck ? hin.name : hin.name + ' hin, ' + zurueck.name + ' zurück';
      p(`${start}: ${wege} — hin hell im gemerkten Schema „papier", zurück wieder „${start}", Akzent bleibt`,
        mitte.theme === 'light' && mitte.schema === 'papier' && mitte.akzent === '#5cbf8a' &&
        ende.theme === 'dark' && ende.schema === start && ende.akzent === '#5cbf8a',
        `hin ${JSON.stringify(mitte)} · zurück ${JSON.stringify(ende)}`);
    }
  }
  /* Ohne gemerktes Schema: Hell bzw. Standard, wie bisher. */
  await pc.evaluate(`(() => { Store.setMeta('studio:schema-light', null); Aussehen.setzen({ schema: 'wald', akzent: '' }); })()`);
  await pc.evaluate('App.theme()'); await pc.waitForTimeout(100);
  const ohne = await zustand(pc);
  p('Ohne gemerktes helles Schema führt App.theme() nach „Hell"', ohne.schema === 'hell' && ohne.theme === 'light', JSON.stringify(ohne));
  /* Mit Ziel: App.theme('light') auf Hell bleibt, wo es ist. */
  await pc.evaluate(`(() => { Aussehen.setzen({ schema: 'sand', akzent: '' }); App.theme('light'); })()`);
  const bleibt = await zustand(pc);
  p("App.theme('light') auf einem hellen Schema ändert nichts", bleibt.schema === 'sand' && bleibt.theme === 'light', JSON.stringify(bleibt));
  await pc.evaluate(`App.theme('dark')`);
  const dunkel = await zustand(pc);
  p("App.theme('dark') wechselt ins gemerkte dunkle Schema (wald)", dunkel.schema === 'wald' && dunkel.theme === 'dark', JSON.stringify(dunkel));
  await kontext.close();
}

/* ══ §2 Ein Schalter ═══════════════════════════════════════════════════════ */
console.log('\n§2 Ein Schalter — role, aria-checked, ein Name');
const SCHEMATA: string[] = await (async () => {
  const { pc, kontext } = await oeffnen();
  const ids = await pc.evaluate('Aussehen.SCHEMATA.map(s => s.id)') as string[];
  await kontext.close();
  return ids;
})();
p('Es sind zehn Schemata', SCHEMATA.length === 10, SCHEMATA.join(','));
{
  const { pc, kontext } = await oeffnen();
  const falsch: string[] = [];
  const namen = new Set<string>();
  let rolle = '', kuerzel = '';
  for (const id of SCHEMATA) {
    const m = await pc.evaluate(`(() => {
      Aussehen.setzen({ schema: ${JSON.stringify(id)}, akzent: '' });
      const k = document.getElementById('studio-theme');
      return { rolle: k.getAttribute('role') || '', an: k.getAttribute('aria-checked'), name: k.getAttribute('aria-label') || '',
               kuerzel: k.getAttribute('aria-keyshortcuts') || '', dunkel: document.documentElement.dataset.theme !== 'light' };
    })()`) as { rolle: string; an: string | null; name: string; kuerzel: string; dunkel: boolean };
    if (m.an !== String(m.dunkel)) falsch.push(`${id}: aria-checked ${m.an} bei dunkel=${m.dunkel}`);
    namen.add(m.name); rolle = m.rolle; kuerzel = m.kuerzel;
  }
  p('role="switch"', rolle === 'switch', rolle || '(keine)');
  p('aria-checked sagt in allen zehn Schemata, ob dunkel gilt', falsch.length === 0, falsch.join(' · ') || '');
  p('Der Name bleibt in allen Schemata „Dunkles Schema"', namen.size === 1 && namen.has('Dunkles Schema'), [...namen].join(' | '));
  p('Das Kürzel steht in aria-keyshortcuts', /Control\+Shift\+L/.test(kuerzel), kuerzel || '(keins)');
  await pc.hover('#studio-theme'); await pc.waitForTimeout(250);
  const blase = await pc.evaluate(`(() => { const k = document.getElementById('studio-theme');
    return { inhalt: getComputedStyle(k, '::after').content.replace(/^"|"$/g, ''), name: k.getAttribute('aria-label') }; })()`) as { inhalt: string; name: string };
  p('Die Blase zeigt genau den Namen', blase.inhalt === blase.name && !!blase.name, JSON.stringify(blase));
  await kontext.close();
}

/* ══ §3 Zwei Zeichen aus dem Register ══════════════════════════════════════ */
console.log('\n§3 Sonne und Mond aus dem Register, sichtbar in jedem Schema');
{
  const { pc, kontext } = await oeffnen();
  const z = await pc.evaluate(`(() => {
    const k = document.getElementById('studio-theme');
    const svgs = [...k.querySelectorAll('svg.sym')];
    const syms = [...k.querySelectorAll('[data-sym]')].map(e => e.dataset.sym);
    return { anzahl: svgs.length, syms, orb: !!document.querySelector('.studio-orb'),
      nurStrich: svgs.every(s => s.getAttribute('fill') === 'none' && s.getAttribute('stroke') === 'currentColor'),
      ausRegister: [...k.querySelectorAll('[data-sym]')].every(e => e.innerHTML === Register.symbole.alsSvg(e.dataset.sym, 18) ||
        e.innerHTML === Register.symbole.alsSvg(e.dataset.sym, Number(e.dataset.symGroesse) || 18)) };
  })()`) as { anzahl: number; syms: string[]; orb: boolean; nurStrich: boolean; ausRegister: boolean };
  p('Zwei Zeichen im Knopf: Sonne und Mond', z.anzahl === 2 && z.syms.includes('sun') && z.syms.includes('moon'), JSON.stringify(z));
  p('… aus Register.symbole, nur Striche', z.ausRegister && z.nurStrich, JSON.stringify(z));
  p('Keine .studio-orb mehr im Baum', !z.orb);
  const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
  p('… und keine im HTML', !/studio-orb/.test(html));
  const css = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/studio.css'), 'utf8');
  const regeln = [...css.matchAll(/([^{}]*studio-gestirn[^{}]*)\{([^{}]*)\}/g)].map(m => m[2] ?? '');
  p('Die Regeln des Gestirns stehen in studio.css', regeln.length >= 3, String(regeln.length));
  p('… ohne einen einzigen Hexwert (nur Marken)', regeln.length > 0 && regeln.every(r => !/#[0-9a-f]{3,8}\b/i.test(r)),
    regeln.filter(r => /#[0-9a-f]{3,8}\b/i.test(r)).join(' | ').slice(0, 160));
  p('Keine Regel für .studio-orb mehr', !/\.studio-orb/.test(css));
  const schwach: string[] = [];
  for (const id of SCHEMATA) {
    const m = await pc.evaluate(`(() => {
      Aussehen.setzen({ schema: ${JSON.stringify(id)}, akzent: '' });
      const k = document.getElementById('studio-theme');
      const sichtbar = [...k.querySelectorAll('[data-sym]')].filter(e => +getComputedStyle(e).opacity > 0.5);
      const z = sichtbar[0] || k;
      const farbe = window.__rgb(getComputedStyle(z).color);
      return { sichtbar: sichtbar.map(e => e.dataset.sym), k: +window.__kontrast(farbe, window.__grund(k)).toFixed(2) };
    })()`) as { sichtbar: string[]; k: number };
    if (m.sichtbar.length !== 1 || m.k < 3) schwach.push(`${id}: ${m.sichtbar.join('+') || 'nichts'} ${m.k}`);
  }
  p('In allen zehn Schemata genau EIN Zeichen sichtbar, ≥ 3 : 1 gegen die Leiste', schwach.length === 0, schwach.join(' · '));
  await kontext.close();
}

/* ══ §4 Bewegung ═══════════════════════════════════════════════════════════ */
console.log('\n§4 Es bewegt sich — nur transform/opacity, und ohne Bewegung sofort');
const lage = (pc: Page) => pc.evaluate(`(() => {
  const k = document.getElementById('studio-theme');
  const s = k.querySelector('.studio-gestirn-sonne'), m = k.querySelector('.studio-gestirn-mond');
  const cs = (e) => e ? getComputedStyle(e) : null;
  const f = (e) => { const c = cs(e); return c ? { tr: c.transform, op: c.opacity, art: c.transitionProperty, dauer: c.transitionDuration } : null; };
  return { sonne: f(s), mond: f(m), an: k.getAttribute('aria-checked'), orb: (() => { const o = k.querySelector('.studio-orb'); return o ? getComputedStyle(o).transform : null; })() };
})()`) as Promise<any>;
{
  const { pc, kontext } = await oeffnen();
  await pc.evaluate(`Aussehen.setzen({ schema: 'standard', akzent: '' })`);
  await pc.waitForTimeout(800);
  const dunkel = await lage(pc);
  await pc.click('#studio-theme');
  await pc.waitForTimeout(60);
  const unterwegs = await pc.evaluate(`(() => {
    const k = document.getElementById('studio-theme');
    const an = [...k.querySelectorAll('*')].flatMap(e => e.getAnimations()).filter(a => a.playState === 'running');
    return { laufen: an.length, arten: [...new Set(an.map(a => a.transitionProperty || a.animationName || '?'))] };
  })()`) as { laufen: number; arten: string[] };
  await pc.waitForTimeout(900);
  const hell = await lage(pc);
  const tr = (x: any) => x?.sonne ? x.sonne.tr + ' / ' + x.mond.tr : 'orb ' + x?.orb;
  p('Nach dem Klick laufen Übergänge an den Zeichen', unterwegs.laufen >= 2, JSON.stringify(unterwegs));
  p('… nur transform und opacity', unterwegs.arten.length > 0 && unterwegs.arten.every(a => a === 'transform' || a === 'opacity'), JSON.stringify(unterwegs.arten));
  p('Die gerechnete Lage ist in Hell und Dunkel verschieden', tr(dunkel) !== tr(hell), `dunkel ${tr(dunkel)} · hell ${tr(hell)}`);
  p('Dunkel steht der Mond, hell die Sonne (opacity)', dunkel.mond?.op === '1' && dunkel.sonne?.op === '0' && hell.sonne?.op === '1' && hell.mond?.op === '0',
    JSON.stringify({ dunkel: [dunkel.sonne?.op, dunkel.mond?.op], hell: [hell.sonne?.op, hell.mond?.op] }));
  p('Die Übergangsliste nennt nur transform/opacity',
    !!hell.sonne && [hell.sonne.art, hell.mond.art].every((a: string) => a.split(',').every(x => ['transform', 'opacity'].includes(x.trim()))),
    JSON.stringify([hell.sonne?.art, hell.mond?.art]));
  /* Ruhige Darstellung: das Attribut, das seite.ts setzt. */
  await pc.evaluate(`document.body.dataset.bewegung = 'ruhig'`);
  await pc.click('#studio-theme'); await pc.waitForTimeout(30);
  const ruhig = await lage(pc);
  p('Ruhige Darstellung: höchstens 1 ms, und der Zustand stimmt sofort',
    !!ruhig.sonne && parseFloat(ruhig.sonne.dauer) * (ruhig.sonne.dauer.endsWith('ms') ? 1 : 1000) <= 1 &&
    ruhig.an === 'true' && ruhig.mond.op === '1', JSON.stringify(ruhig));
  await kontext.close();
}
{
  const { pc, kontext } = await oeffnen({ weniger: true });
  await pc.evaluate(`Aussehen.setzen({ schema: 'standard', akzent: '' })`);
  await pc.click('#studio-theme'); await pc.waitForTimeout(30);
  const w = await lage(pc);
  const ms = (d: string) => Math.max(...d.split(',').map(x => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000)));
  p('Weniger Bewegung: höchstens 1 ms, und der Zustand stimmt sofort',
    !!w.sonne && ms(w.sonne.dauer) <= 1 && ms(w.mond.dauer) <= 1 && w.an === 'false' && w.sonne.op === '1', JSON.stringify(w));
  await kontext.close();
}

/* ══ §5 Grösse und Tastatur ════════════════════════════════════════════════ */
console.log('\n§5 44 × 44, und die Tastatur schaltet');
{
  const { pc, kontext } = await oeffnen();
  const g = await pc.evaluate(`(() => { const r = document.getElementById('studio-theme').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })()`) as number[];
  p('Das Gestirn misst mindestens 44 × 44', g[0]! >= 44 && g[1]! >= 44, g.join(' × '));
  await pc.focus('#studio-search'); await pc.keyboard.press('Tab');
  const da = await pc.evaluate(`document.activeElement && document.activeElement.id`);
  p('Tab von der Suche erreicht das Gestirn', da === 'studio-theme', String(da));
  const vor = await pc.evaluate(`document.documentElement.dataset.theme`);
  await pc.keyboard.press(' '); await pc.waitForTimeout(100);
  const nachLeer = await pc.evaluate(`document.documentElement.dataset.theme`);
  await pc.keyboard.press('Enter'); await pc.waitForTimeout(100);
  const nachEnter = await pc.evaluate(`document.documentElement.dataset.theme`);
  p('Leertaste schaltet, Enter schaltet zurück', vor !== nachLeer && nachEnter === vor, `${vor} → ${nachLeer} → ${nachEnter}`);
  await kontext.close();
}

/* ══ §6 In Ruhe neutral ════════════════════════════════════════════════════ */
console.log('\n§6 In Ruhe neutral, getönt als Zustand');
for (const schema of ['standard', 'hell']) {
  const { pc, kontext } = await oeffnen();
  await pc.evaluate(`Aussehen.setzen({ schema: ${JSON.stringify(schema)}, akzent: '' })`);
  await pc.mouse.move(700, 600); await pc.waitForTimeout(700);
  const farbe = (zustandName: string) => pc.evaluate(`(() => {
    const k = document.getElementById('studio-theme');
    const z = [...k.querySelectorAll('[data-sym]')].find(e => +getComputedStyle(e).opacity > 0.5) || k;
    const probe = document.createElement('i'); document.body.append(probe);
    probe.style.color = 'var(--text-dim)'; const dim = getComputedStyle(probe).color;
    probe.style.color = 'var(--accent-text)'; const akz = getComputedStyle(probe).color; probe.remove();
    return { zustand: ${JSON.stringify('')} + ${JSON.stringify(zustandName)}, farbe: getComputedStyle(z).color, dim, akz,
             grund: getComputedStyle(k).backgroundColor, bild: getComputedStyle(k).backgroundImage };
  })()`) as Promise<{ zustand: string; farbe: string; dim: string; akz: string; grund: string; bild: string }>;
  const ruhe = await farbe('Ruhe');
  p(`${schema}: in Ruhe trägt das Zeichen --text-dim, keine Fläche dahinter`,
    ruhe.farbe === ruhe.dim && (/rgba\(0, 0, 0, 0\)|transparent/.test(ruhe.grund)) && ruhe.bild === 'none', JSON.stringify(ruhe));
  await pc.hover('#studio-theme'); await pc.waitForTimeout(700);
  const zeigen = await farbe('Zeigen');
  p(`${schema}: unter dem Zeiger tönt es sich mit --accent-text`, zeigen.farbe === zeigen.akz, JSON.stringify(zeigen));
  await pc.mouse.move(700, 600);
  await pc.focus('#studio-search'); await pc.keyboard.press('Tab'); await pc.waitForTimeout(700);
  const fokus = await farbe('Fokus');
  p(`${schema}: unter dem Tastenfokus ebenso`, fokus.farbe === fokus.akz, JSON.stringify(fokus));
  await kontext.close();
}

/* ══ §7 Die Einzeldatei ════════════════════════════════════════════════════ */
console.log('\n§7 Die Einzeldatei');
{
  const { pc, kontext } = await oeffnen({ adresse: EINZEL });
  const e = await pc.evaluate(`(() => { const k = document.getElementById('studio-theme');
    return { svgs: k.querySelectorAll('svg.sym').length, rolle: k.getAttribute('role'), orb: !!k.querySelector('.studio-orb') }; })()`) as { svgs: number; rolle: string | null; orb: boolean };
  const vor = await pc.evaluate(`document.documentElement.dataset.theme`);
  await pc.click('#studio-theme'); await pc.waitForTimeout(150);
  const nach = await pc.evaluate(`document.documentElement.dataset.theme`);
  p('Die Einzeldatei zeigt das Gestirn (zwei Zeichen, role=switch) und schaltet',
    e.svgs === 2 && e.rolle === 'switch' && !e.orb && vor !== nach, JSON.stringify({ ...e, vor, nach }));
  await kontext.close();
}

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
process.exit(weg ? 1 : 0);
