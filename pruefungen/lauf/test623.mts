/* Suite 623 — Klassisch bewegt sich wie am 13. Oktober (E757)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat am 30. Oktober 2026 im Fragebogen die
 * Antwort „Klassische Bewegungen vom 13. Okt." gewählt. Die Beschreibung, die
 * er dabei las:
 *
 *     „Die 'Liquid Glass'-Änderungen von Codex (20./21. Okt.) im klassischen
 *      Design zurücknehmen: Knöpfe heben sich schräg statt gerade, kein Glas
 *      und kein Federn am Suchfeld, Einstellungsfenster ohne neues
 *      Einfliegen."
 *
 * Nicht gewählt hat er, die Zusätze der Zielleiste zurückzunehmen (die Blase
 * mit dem Namen `.ho-ziel-vorschau` und der Ziehgriff `#handy-oben::before`
 * bleiben), und das Glass Wheel (`body[data-ui-shell="glass-wheel"]`) ist
 * seine freiwillige Wahl und bleibt, wie es heute aussieht.
 *
 * SEIT REDURS ENTSCHEIDUNG VOM 24. NOVEMBER 2026 (E815, „iOS gilt überall")
 * gelten diese Zusagen von oben NICHT mehr; sie sind unten umgeschrieben und
 * stehen so in der Prüfung:
 *   · §3a/§3b „Das Fenster fliegt nicht ein": jetzt blendet es ein — am
 *     Rechner `einst-einblenden` (0,98 → 1), am Telefon `einst-blatt-hoch`
 *     (von unten). Unter „Ruhige Darstellung" und reduzierter Bewegung
 *     läuft nichts mehr.
 *   · §2 „alter Schatten" der unteren Leiste: jetzt EINE Innen-Lichtkante
 *     (wie test655 §1), nicht mehr der doppelte Ring mit drei Innenlinien.
 *   · §2 „ohne eigenen Übergang" am Zeichen: jetzt federt es (Übergang über
 *     0 s); unter „Ruhige Darstellung" bleibt es ohne Übergang.
 *   · §2 „schrumpft nicht über transform (scale .92)": der gedrückte Reiter
 *     bekommt die Kit-Feder aus E702 (Zeichen 1,08 und 2 px hoch), nicht
 *     mehr „kein transform". Dass er nicht schrumpft, bleibt gemessen.
 * Alles andere in diesem Lauf gilt unverändert.
 *
 * Die Liquid-Glass-Regeln stehen in `quell/schale/stil/studio.css` in zwei
 * Blöcken („REDION LIQUID GLASS / BEWEGUNG (Oktober 2026)" und „REDION MOTION
 * / FEINSCHLIFF (zweite Etappe, 21. Oktober 2026)"), gekommen mit
 * a3917c13d (Pull Request #122, codex/apple-glass-20oct). Sie galten für
 * `body[data-schale="premium"]` — und das ist JEDER Start von Redion: die
 * klassische Schale trug sie mit.
 *
 * DIE SOLL-WERTE sind abgelesen, nicht ausgedacht: am Stand 020f51ce1
 * (13. Oktober 2026, „vorher"), in genau diesem Lauf, über file:// mit
 * frischem Profil, hell, ohne reduzierte Bewegung (E757, messungen.md).
 * Die Werte des Glass Wheel stammen vom Stand de375a43f (29. Oktober, „heute",
 * Glass Wheel eingeschaltet) — sie müssen bleiben.
 *
 * DIE ZUSAGEN
 *   §1  Rechner 1440 × 900, klassisch: keine `--liquid-*`-Marken; die
 *       Knöpfe des Kopfs (`.studio-icon`, `#studio-create`) haben den
 *       Übergang vom 13. Oktober und heben sich unter dem Zeiger SCHRÄG
 *       (translate 2, −2); das Suchfeld hat kein Glas, keinen Schatten und
 *       federt nicht; die Knöpfe der Kante rücken nicht; das Menü am „+"
 *       fährt mit seiner alten Kurve; die Filterpille der Bibliothek hat ihren
 *       alten Übergang.
 *   §2  Telefon 390 × 844, klassisch: die untere Leiste hat ihren alten
 *       Schatten; das Zeichen des aktiven Reiters steht (kein `scale(1.1)`,
 *       kein Heben, kein Übergang), sein Wort auch; ein gedrückter Reiter
 *       schrumpft nicht über `transform` (der Druck des Kits läuft über
 *       `scale`, E702, und bleibt).
 *   §3  Einstellungen, an beiden Breiten: kein Einfliegen
 *       (`redion-settings-arrive`), der alte Schatten, kein Akzentstrich am
 *       gewählten Bereich, kein Rücken unter dem Zeiger.
 *   §4  Was bleibt: der Ziehgriff über der Leiste und die Namensblase der
 *       Zielleiste (Codex, Workspace 2.0) stehen im klassischen Design.
 *   §5  Glass Wheel EIN (`GlassWheel.setMode('glass-wheel')`): alles aus
 *       §1–§3 ist dort Liquid Glass wie heute — Marken, Glas am Suchfeld,
 *       gerades Heben, Feder 1,005, Einfliegen, Akzentstrich, 1,1 am Reiter.
 *       Und zurück auf klassisch (ohne Neuladen) ist es wieder der 13. Oktober.
 *   §6  Die Quelle: jede Regel der beiden Blöcke hängt am Glass Wheel, und
 *       zwar über `:where(…)` — Gewicht null, damit die Kaskade im Glass
 *       Wheel Bit für Bit dieselbe bleibt (§39: `:where()` NICHT um den
 *       Knopf-Teil eines Zustands, nur um die Schale). Ausgenommen ist genau
 *       eine Regel: der sichtbare Tastenfokus der Ergebniszeilen (§38) ist
 *       eine Verbesserung, keine Bewegung, und gilt weiter überall.
 *   §7  Ruhe: keine Seitenfehler.
 *
 * Kein Port: geladen wird über file:// — test400 zählt nichts Neues.
 * ==========================================================================*/
import { chromium, type BrowserContext, type CDPSession, type Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const App: any; declare const Store: any; declare const GlassWheel: any;
declare const Einstellungen: any; declare const Bibliothek: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), 'ist ' + JSON.stringify(ist) + ' · soll ' + JSON.stringify(soll));
const warte = (ms: number) => new Promise(f => setTimeout(f, ms));

/* ══ DIE WERTE VOM 13. OKTOBER (020f51ce1, hell) ════════════════════════════ */
const ALT = {
  /* Kopf am Rechner: quell/schale/stil/studio.css am 13. Oktober,
     `.studio-icon{transition:transform var(--motion-fast) var(--ease)}` und
     `.studio-icon:is(:hover,:focus-visible){transform:translate(2px,-2px)}`. */
  knopfUebergang: 'transform 0.14s cubic-bezier(0.2, 0.8, 0.3, 1)',
  knopfUeber: 'matrix(1, 0, 0, 1, 2, -2)',
  sucheUebergang: 'transform 0.08s cubic-bezier(0.2, 0.8, 0.3, 1), background 0.14s cubic-bezier(0.2, 0.8, 0.3, 1), border-color 0.14s cubic-bezier(0.2, 0.8, 0.3, 1)',
  sucheGlas: 'none',
  sucheSchatten: 'none',
  sucheUeber: 'none',
  kanteUeber: 'none',
  menueAnimation: 'none',
  menueDauer: '0s',
  menueKurve: 'ease',
  /* die Glaskante des Menüs (`--glas-kante`) und sein alter Wurf */
  menueSchatten: 'rgba(255, 255, 255, 0.95) 0px 1px 0px 0px inset, rgba(15, 15, 15, 0.05) 0px -1px 0px 0px inset, rgba(15, 15, 15, 0.1) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.16) 0px 12px 36px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
  pilleUebergang: 'background 0.14s cubic-bezier(0.2, 0.8, 0.3, 1), border-color 0.14s cubic-bezier(0.2, 0.8, 0.3, 1)',
  pilleUeber: 'none',
  /* Telefon */
  zeichenAn: 'none',
  wortAn: 'none',
  /* Einstellungen */
  einstSchatten: 'rgba(15, 15, 15, 0.12) 0px 8px 28px 0px',
  navAnSchatten: 'none',
  navAnLage: 'static',
  navUeber: 'none'
};
/* ══ DIE WERTE DES GLASS WHEEL (de375a43f, hell) — sie bleiben ═════════════ */
const GLAS = {
  dauer: '200ms',
  sucheGlas: 'saturate(1.8) blur(20px)',
  knopfUeber: 'matrix(1, 0, 0, 1, 0, -2)',
  sucheUeber: 'matrix(1.005, 0, 0, 1.005, 0, -2)',
  kanteUeber: 'matrix(1, 0, 0, 1, 3, 0)',
  einstAnimation: 'redion-settings-arrive',
  einstDauer: '0.796s',
  zeichenAn: 'matrix(1.1, 0, 0, 1.1, 0, -2)',
  wortAn: 'matrix(1, 0, 0, 1, 0, -1)'
};
/* ══ DAS JETZT GEWOLLTE (E815, Redurs Entscheidung A vom 24. November) ═════ */
const JETZT = {
  /* Am Rechner blendet das Fenster ein (0,98 → 1, 200 ms), am Telefon fährt
     das Blatt von unten (quell/schale/stil/einstellungen.css). */
  einstRechner: 'einst-einblenden',
  einstTelefon: 'einst-blatt-hoch',
  /* Die untere Leiste: EINE Innen-Lichtkante oben, dazu der weiche Schatten
     (bausteine.css/studio.css, Telefon). Wie in test655 §1. */
  leisteSchatten: 'rgba(255, 255, 255, 0.22) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.19) 0px 12px 30px 0px',
  /* Der gedrückte Reiter: die Kit-Feder aus E702 (translateY(-2px) scale(1.08)). */
  gedrueckt: [1.08, 0, 0, 1.08, 0, -2]
};
const MATRIX = (s: unknown): number[] | null => {
  const m = String(s ?? '').match(/^matrix\(([^)]+)\)$/);
  return m && m[1] ? m[1].split(',').map(Number) : null;
};
const nahe = (ist: number[] | null, soll: number[]): boolean =>
  !!ist && ist.length === soll.length && ist.every((v, i) => Math.abs(v - (soll[i] ?? NaN)) < 0.01);
/** Einstellungsfenster öffnen, während „Ruhige Darstellung" oder reduzierte
 *  Bewegung gilt; zurückgeben, welche Animation läuft (E815). */
const einstOhneBewegung = async (a: Auf, wie: 'ruhig' | 'reduziert'): Promise<string | null> => {
  if (wie === 'ruhig') await a.pc.evaluate(() => document.body.setAttribute('data-bewegung', 'ruhig'));
  else await a.cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await warte(150);
  await a.pc.evaluate(() => Einstellungen.oeffne());
  await warte(60);
  const s = await stil(a.pc, '.einst-fenster');
  await a.pc.keyboard.press('Escape');
  await warte(400);
  await a.pc.evaluate(() => document.querySelectorAll('.overlay').forEach(e => e.remove()));
  if (wie === 'ruhig') await a.pc.evaluate(() => document.body.removeAttribute('data-bewegung'));
  else await a.cdp.send('Emulation.setEmulatedMedia', { features: [] });
  await warte(200);
  return s?.animation ?? null;
};
const MARKEN = ['--liquid-ease', '--liquid-duration', '--liquid-highlight', '--liquid-accent-glow'];

/* ══ AUFBAU ═════════════════════════════════════════════════════════════════ */
const fehler: string[] = [];
const browser = await chromium.launch();
type Auf = { ctx: BrowserContext; pc: Page; cdp: CDPSession };
const aufmachen = async (handy: boolean): Promise<Auf> => {
  const ctx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: handy, isMobile: handy, colorScheme: 'light', reducedMotion: 'no-preference'
  });
  const pc = await ctx.newPage();
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await pc.goto(INDEX);
  await pc.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined'
    && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
  await pc.waitForTimeout(1200);
  await pc.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 1e9);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
    App.theme('light');
  });
  await pc.waitForTimeout(500);
  /* Gegenprobe (§55.2): ein kaputter Stand, eingespritzt — dann müssen die
     umgeschriebenen Zeilen ROT werden. Ohne Umgebungsvariable nichts. */
  const gegen = process.env['GEGENPROBE_CSS'];
  if (gegen) await pc.addStyleTag({ content: gegen });
  return { ctx, pc, cdp: await ctx.newCDPSession(pc) };
};

/** Die berechneten Werte des ersten sichtbaren Treffers. */
const stil = (pc: Page, sel: string, pseudo: string | null = null) => pc.evaluate(([s, ps]) => {
  const e = Array.from(document.querySelectorAll<HTMLElement>(s)).find(x => x.getClientRects().length > 0);
  if (!e) return null;
  const c = getComputedStyle(e, ps);
  return { transform: c.transform, transition: c.transition, dauer: c.transitionDuration,
    animation: c.animationName, animDauer: c.animationDuration, animKurve: c.animationTimingFunction,
    glas: c.backdropFilter, schatten: c.boxShadow, lage: c.position, inhalt: c.content, breite: c.width };
}, [sel, pseudo] as [string, string | null]);
const mitte = (pc: Page, sel: string) => pc.evaluate((s: string) => {
  const e = Array.from(document.querySelectorAll<HTMLElement>(s)).find(x => x.getClientRects().length > 0);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, sel);
/** Den Zeiger darüber führen, bis jede Bewegung steht, und lesen, was der
 *  Knopf UNTER dem Zeiger zeigt (`:hover`, nicht irgendein Treffer). */
const ueber = async (pc: Page, sel: string) => {
  const m = await mitte(pc, sel);
  if (!m) return { fehlt: sel };
  await pc.mouse.move(m.x, m.y, { steps: 3 });
  await warte(700);
  const s = await pc.evaluate((q: string) => {
    const e = Array.from(document.querySelectorAll<HTMLElement>(q)).find(x => x.matches(':hover'));
    return e ? { transform: getComputedStyle(e).transform, transition: getComputedStyle(e).transition } : null;
  }, sel);
  await pc.mouse.move(720, 895);
  await warte(450);
  return s ?? { nichtUnterDemZeiger: sel };
};
const marken = (pc: Page) => pc.evaluate((namen: string[]) =>
  namen.map(n => getComputedStyle(document.body).getPropertyValue(n).trim()), MARKEN);

/** Einstellungen öffnen: im ersten Augenblick die Ankunft, nach einer Sekunde
 *  der Schatten und die gewählte Zeile. */
const einstellungen = async (pc: Page, mitZeiger: boolean) => {
  await pc.evaluate(() => Einstellungen.oeffne());
  await warte(40);
  const frueh = await stil(pc, '.einst-fenster');
  await warte(1000);
  const spaet = await stil(pc, '.einst-fenster');
  const an = await stil(pc, '.einst-nav button.on');
  let navUeber: unknown = null;
  if (mitZeiger) navUeber = await ueber(pc, '.einst-nav button:not(.on)');
  await pc.keyboard.press('Escape');
  await warte(400);
  await pc.evaluate(() => document.querySelectorAll('.overlay').forEach(e => e.remove()));
  return { frueh, spaet, an, navUeber };
};

/* ══ DIE MESSUNG AM RECHNER (klassisch oder Glass Wheel) ═════════════════════ */
const rechnerMessen = async (pc: Page) => {
  const m: Record<string, any> = {};
  m.marken = await marken(pc);
  m.knopf = await stil(pc, '#studio-bar .studio-icon');
  m.knopfUeber = await ueber(pc, '#studio-bar .studio-icon');
  m.neu = await stil(pc, '#studio-create');
  m.neuUeber = await ueber(pc, '#studio-create');
  m.suche = await stil(pc, '#studio-bar .studio-search');
  m.sucheUeber = await ueber(pc, '#studio-bar .studio-search');
  m.kanteUeber = await ueber(pc, '#kante .k-knopf');
  /* Das Menü am „+": angeklickt, im ersten Augenblick gelesen. */
  const plus = await mitte(pc, '#studio-create');
  if (plus) {
    await pc.mouse.click(plus.x, plus.y);
    await warte(30);
    m.menue = await stil(pc, '.menu');
    await pc.keyboard.press('Escape');
    await warte(400);
    await pc.evaluate(() => document.querySelectorAll('.menu,.menu-grund').forEach(e => e.remove()));
  }
  m.einst = await einstellungen(pc, true);
  /* Die Filterpille der Bibliothek. */
  await pc.evaluate(() => Bibliothek.oeffne());
  await warte(900);
  m.pille = await stil(pc, '.bib-pille');
  m.pilleUeber = await ueber(pc, '.bib-pille');
  return m;
};
const handyMessen = async (a: Auf) => {
  const m: Record<string, any> = {};
  m.marken = await marken(a.pc);
  m.leiste = await stil(a.pc, '#handy-oben');
  m.zeichenAn = await stil(a.pc, '#handy-oben > button.an .ho-z');
  m.wortAn = await stil(a.pc, '#handy-oben > button.an b');
  /* Ein gedrückter Reiter. Ein echter Finger über CDP setzte `:active` nicht
     (gemessen am Stand 020f51ce1: 160 ms Auflegen, `matches(':active')`
     blieb falsch; warum, ist nicht untersucht). Deshalb setzt der Lauf
     den Zustand über die Werkzeuge des Browsers (`CSS.forcePseudoState`)
     und liest, was die Kaskade dann zeigt. Gemessen nur, wenn der Reiter
     dabei wirklich `:active` ist — sonst misst es nichts (§55.2). */
  await a.pc.evaluate(() => {
    document.querySelector('#handy-oben > button:not(.an)')?.setAttribute('data-p623', '');
  });
  await a.cdp.send('DOM.enable'); await a.cdp.send('CSS.enable');
  const { root } = await a.cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await a.cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-p623]' });
  if (nodeId) {
    await a.cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
    await warte(500);
    m.gedrueckt = await a.pc.evaluate(() => {
      const k = document.querySelector<HTMLElement>('[data-p623]');
      const z = k?.querySelector<HTMLElement>('.ho-z');
      return k && z ? { aktiv: k.matches(':active'), transform: getComputedStyle(z).transform } : null;
    });
    await a.cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  }
  await a.pc.evaluate(() => document.querySelector('[data-p623]')?.removeAttribute('data-p623'));
  await warte(300);
  m.einst = await einstellungen(a.pc, false);
  return m;
};

/* ══ §1 RECHNER, KLASSISCH ══════════════════════════════════════════════════ */
console.log('Suite 623 — Klassisch bewegt sich wie am 13. Oktober (E757)');
console.log('─'.repeat(60));
const r = await aufmachen(false);
gleich('Klassisch heisst: kein Glass Wheel', await r.pc.evaluate(() => document.body.dataset['uiShell'] ?? null), null);
const rk = await rechnerMessen(r.pc);
console.log('\n§1 Rechner 1440 × 900, klassisch');
gleich('Keine `--liquid-*`-Marken', rk.marken, ['', '', '', '']);
gleich('`.studio-icon` hat den Übergang vom 13. Oktober', rk.knopf?.transition, ALT.knopfUebergang);
gleich('… und hebt sich unter dem Zeiger schräg (2, −2)', rk.knopfUeber?.transform, ALT.knopfUeber);
gleich('`#studio-create` hat den Übergang vom 13. Oktober', rk.neu?.transition, ALT.knopfUebergang);
gleich('… und hebt sich unter dem Zeiger schräg (2, −2)', rk.neuUeber?.transform, ALT.knopfUeber);
gleich('Das Suchfeld hat kein Glas', rk.suche?.glas, ALT.sucheGlas);
gleich('… keinen Glasschatten', rk.suche?.schatten, ALT.sucheSchatten);
gleich('… den Übergang vom 13. Oktober', rk.suche?.transition, ALT.sucheUebergang);
gleich('… und federt unter dem Zeiger nicht', rk.sucheUeber?.transform, ALT.sucheUeber);
gleich('Ein Knopf der Kante rückt unter dem Zeiger nicht', rk.kanteUeber?.transform, ALT.kanteUeber);
gleich('Das Menü am „+" kommt mit seiner alten Animation',
  [rk.menue?.animation, rk.menue?.animDauer, rk.menue?.animKurve], [ALT.menueAnimation, ALT.menueDauer, ALT.menueKurve]);
gleich('… und seinem alten Schatten', rk.menue?.schatten, ALT.menueSchatten);
gleich('Die Filterpille der Bibliothek hat ihren alten Übergang', rk.pille?.transition, ALT.pilleUebergang);
gleich('… und hebt sich unter dem Zeiger wie damals', rk.pilleUeber?.transform, ALT.pilleUeber);

/* ══ §3a EINSTELLUNGEN AM RECHNER ═══════════════════════════════════════════ */
console.log('\n§3a Einstellungen am Rechner, klassisch');
gleich('Das Fenster blendet ein (E815, iOS): einst-einblenden', rk.einst.frueh?.animation, JETZT.einstRechner);
gleich('… in 200 ms, Skalierung 0,98 → 1', rk.einst.frueh?.animDauer, '0.2s');
gleich('… und unter „Ruhige Darstellung" läuft nichts', await einstOhneBewegung(r, 'ruhig'), 'none');
gleich('… und bei reduzierter Bewegung läuft nichts', await einstOhneBewegung(r, 'reduziert'), 'none');
gleich('… und trägt den alten Schatten', rk.einst.spaet?.schatten, ALT.einstSchatten);
gleich('Der gewählte Bereich hat keinen Akzentstrich', rk.einst.an?.schatten, ALT.navAnSchatten);
gleich('… und keine eigene Lage', rk.einst.an?.lage, ALT.navAnLage);
gleich('Ein anderer Bereich rückt unter dem Zeiger nicht', (rk.einst.navUeber as any)?.transform, ALT.navUeber);

/* ══ §5a RECHNER, GLASS WHEEL ═══════════════════════════════════════════════ */
console.log('\n§5a Rechner, Glass Wheel EIN: Liquid Glass wie heute');
const gwDa = await r.pc.evaluate(() => typeof GlassWheel !== 'undefined' && GlassWheel.setMode('glass-wheel') === true);
p('Das Glass Wheel lässt sich einschalten', gwDa);
if (gwDa) {
  await warte(600);
  const rg = await rechnerMessen(r.pc);
  gleich('Die Marke `--liquid-duration` ist da', rg.marken[1], GLAS.dauer);
  p('… und alle vier `--liquid-*` sind gesetzt', rg.marken.every((w: string) => w !== ''), JSON.stringify(rg.marken));
  gleich('Das Suchfeld ist Glas', rg.suche?.glas, GLAS.sucheGlas);
  gleich('… und federt unter dem Zeiger auf 1,005', rg.sucheUeber?.transform, GLAS.sucheUeber);
  gleich('`.studio-icon` hebt sich gerade', rg.knopfUeber?.transform, GLAS.knopfUeber);
  gleich('`#studio-create` hebt sich gerade', rg.neuUeber?.transform, GLAS.knopfUeber);
  gleich('Ein Knopf der Kante rückt 3 px', rg.kanteUeber?.transform, GLAS.kanteUeber);
  gleich('Die Einstellungen fliegen ein', [rg.einst.frueh?.animation, rg.einst.frueh?.animDauer], [GLAS.einstAnimation, GLAS.einstDauer]);
  p('… und der gewählte Bereich trägt den Akzentstrich', /inset$/.test(String(rg.einst.an?.schatten)) && String(rg.einst.an?.schatten).includes('3px 0px 0px 0px'),
    String(rg.einst.an?.schatten));
  /* Und zurück — ohne Neuladen. */
  await r.pc.evaluate(() => GlassWheel.setMode('classic'));
  await warte(500);
  gleich('Zurück auf klassisch: die Marken sind wieder weg', await marken(r.pc), ['', '', '', '']);
  gleich('… das Suchfeld ist wieder ohne Glas', (await stil(r.pc, '#studio-bar .studio-search'))?.glas, ALT.sucheGlas);
  gleich('… und der Knopf hebt sich wieder schräg', (await ueber(r.pc, '#studio-bar .studio-icon') as any)?.transform, ALT.knopfUeber);
}
await r.ctx.close();

/* ══ §2 TELEFON, KLASSISCH ══════════════════════════════════════════════════ */
const h = await aufmachen(true);
const hk = await handyMessen(h);
console.log('\n§2 Telefon 390 × 844, klassisch');
gleich('Keine `--liquid-*`-Marken', hk.marken, ['', '', '', '']);
gleich('Die untere Leiste hat EINE Lichtkante und den Schatten von heute (E815, iOS)', hk.leiste?.schatten, JETZT.leisteSchatten);
p('… und genau EINE Innenlinie im Schatten (kein doppelter Ring)',
  (String(hk.leiste?.schatten ?? '').match(/inset/g) ?? []).length === 1, String(hk.leiste?.schatten));
gleich('Das Zeichen des aktiven Reiters steht (kein scale 1,1, kein Heben)', hk.zeichenAn?.transform, ALT.zeichenAn);
const zeichenDauer = parseFloat(String(hk.zeichenAn?.dauer ?? '0'));
p('… und federt: die Feder läuft (Übergang über 0 s, E815)', zeichenDauer > 0, String(hk.zeichenAn?.dauer));
{
  await h.pc.evaluate(() => document.body.setAttribute('data-bewegung', 'ruhig'));
  await warte(200);
  const ruhig = await stil(h.pc, '#handy-oben > button.an .ho-z');
  await h.pc.evaluate(() => document.body.removeAttribute('data-bewegung'));
  await warte(200);
  gleich('… unter „Ruhige Darstellung" ohne Übergang', ruhig?.dauer, '0s');
}
gleich('Das Wort des aktiven Reiters hebt sich nicht', hk.wortAn?.transform, ALT.wortAn);
p('Der Finger liegt wirklich auf einem Reiter (`:active`) — sonst misst das Folgende nichts', hk.gedrueckt?.aktiv === true,
  JSON.stringify(hk.gedrueckt));
p('… und sein Zeichen wächst nicht über 1,08 hinaus, hebt sich 2 px: die Kit-Feder (E702, E815)',
  nahe(MATRIX(hk.gedrueckt?.transform), JETZT.gedrueckt), String(hk.gedrueckt?.transform));

/* ══ §3b EINSTELLUNGEN AM TELEFON ═══════════════════════════════════════════ */
console.log('\n§3b Einstellungen am Telefon, klassisch');
gleich('Das Blatt fährt von unten herein (E815, iOS): einst-blatt-hoch', hk.einst.frueh?.animation, JETZT.einstTelefon);
gleich('… unter „Ruhige Darstellung" fährt es nicht', await einstOhneBewegung(h, 'ruhig'), 'none');
gleich('… und bei reduzierter Bewegung fährt es nicht', await einstOhneBewegung(h, 'reduziert'), 'none');
gleich('… und trägt den alten Schatten', hk.einst.spaet?.schatten, ALT.einstSchatten);
gleich('Der gewählte Bereich hat keinen Akzentstrich', hk.einst.an?.schatten, ALT.navAnSchatten);

/* ══ §4 WAS BLEIBT ══════════════════════════════════════════════════════════ */
console.log('\n§4 Was bleibt: die Zusätze der Zielleiste (Workspace 2.0)');
/* E813-Nachtrag (Redur, 24. November 2026: „Weg, wie iOS"): über der Leiste
   steht KEIN Griffstrich mehr. Gemessen wird, ob `::before` etwas malt —
   Inhalt, Fläche mit Farbe oder Bild, Breite und Deckkraft. */
const griff = await h.pc.evaluate(() => {
  const e = Array.from(document.querySelectorAll<HTMLElement>('#handy-oben')).find(x => x.getClientRects().length > 0);
  if (!e) return null;
  const c = getComputedStyle(e, '::before');
  return { inhalt: c.content, bg: c.backgroundColor, bild: c.backgroundImage, breite: c.width, deckkraft: c.opacity };
});
const griffMalt = !!griff && griff.inhalt !== 'none' && griff.inhalt !== 'normal' && parseFloat(griff.deckkraft) > 0
  && parseFloat(griff.breite) > 0
  && (griff.bild !== 'none' || (griff.bg !== 'rgba(0, 0, 0, 0)' && griff.bg !== 'transparent'));
p('Über der Leiste steht KEIN Griffstrich (Redur, 24. November, E813-Nachtrag)', griff !== null && !griffMalt, JSON.stringify(griff));
p('Die Namensblase der Zielleiste ist gebaut', await h.pc.evaluate(() => !!document.querySelector('#ho-ziele > .ho-ziel-vorschau')));

/* ══ §5b TELEFON, GLASS WHEEL ═══════════════════════════════════════════════ */
console.log('\n§5b Telefon, Glass Wheel EIN: Liquid Glass wie heute');
const gwHandy = await h.pc.evaluate(() => typeof GlassWheel !== 'undefined' && GlassWheel.setMode('glass-wheel') === true);
p('Das Glass Wheel lässt sich einschalten', gwHandy);
if (gwHandy) {
  await warte(800);
  const hg = await handyMessen(h);
  gleich('Die Marke `--liquid-duration` ist da', hg.marken[1], GLAS.dauer);
  gleich('Das Zeichen des aktiven Reiters ist 1,1 und gehoben', hg.zeichenAn?.transform, GLAS.zeichenAn);
  gleich('… sein Wort gehoben', hg.wortAn?.transform, GLAS.wortAn);
  gleich('Die Einstellungen fliegen ein', hg.einst.frueh?.animation, GLAS.einstAnimation);
}
await h.ctx.close();

/* ══ §6 DIE QUELLE ══════════════════════════════════════════════════════════ */
console.log('\n§6 Die Quelle: Liquid Glass hängt am Glass Wheel, mit Gewicht null');
const studio = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/studio.css'), 'utf8');
const anfang = studio.indexOf('REDION LIQUID GLASS / BEWEGUNG');
const ende = studio.indexOf('WORKSPACE 2.0 · SICHTBARE SEITENWERKZEUGE');
p('Beide Blöcke stehen in studio.css, vor den Seitenwerkzeugen', anfang > 0 && ende > anfang && studio.includes('REDION MOTION / FEINSCHLIFF'),
  `anfang ${anfang} · ende ${ende}`);
/* Die eine Ausnahme: der sichtbare Fokus der Ergebniszeilen (§38). Er
   bleibt Wort für Wort, wie er war — an derselben Stelle, mit demselben
   Gewicht —, damit sich der Fokus im klassischen Design nicht ändert. */
const FOKUS = /body\[data-schale="premium"\] \.finder \.res > button:focus-visible,\s*body\[data-schale="premium"\] \.menu\[role="menu"\] button:focus-visible\s*\{\s*outline: 2px solid var\(--accent-text\);\s*outline-offset: -2px;\s*\}/;
/* Ab dem `/*` des Kopfkommentars geschnitten, nicht ab seinem Titel —
   sonst gälte der Rest des Kommentars als Regeltext. */
const roh = studio.slice(studio.lastIndexOf('/*', anfang), studio.lastIndexOf('/*', ende)).replace(/\/\*[\s\S]*?\*\//g, '');
p('Der Tastenfokus der Ergebniszeilen gilt weiter überall (§38), unverändert', FOKUS.test(roh));
const block = roh.replace(FOKUS, '');
const schale = block.match(/body\[data-schale="premium"\][^\s,{]*/g) ?? [];
const ohneRad = schale.filter(s => !s.includes(':where([data-ui-shell="glass-wheel"])'));
p(`Jede andere Regel nennt das Glass Wheel (${schale.length} Stellen)`, schale.length > 40 && ohneRad.length === 0,
  `${ohneRad.length} ohne: ` + ohneRad.slice(0, 3).join(' | '));
p('… und nie mit Gewicht: kein `[data-ui-shell="glass-wheel"]` ausserhalb von `:where(…)`',
  !/(?<!:where\()\[data-ui-shell="glass-wheel"\]/.test(block));

/* ══ §7 RUHE ════════════════════════════════════════════════════════════════ */
console.log('\n§7 Ruhe');
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
process.exit(weg ? 1 : 0);
