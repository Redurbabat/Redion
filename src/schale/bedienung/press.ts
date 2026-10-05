/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/press.ts (npm run bauen:ts). */
/* schale/bedienung/press.ts — jeder Knopf sinkt ein und federt zurück (E702).
 * ERZEUGT: quell/schale/bedienung/press.js (`npm run bauen:ts`).
 * Redur, 27.09., ca. 21:45: „Wie im UI-Kit (Empfohlen)". EIN passiver
 * Zuhörer (Einfangphase) statt rund zwanzig `:active`-Regeln: sofort auf
 * `--press-scale` hinunter (eigene Eigenschaft `scale`, per animate()),
 * mindestens 80 ms unten — das iPhone malt `:active` beim kurzen Tipp oft
 * nie —, zurück auf `--feder-druck`. Nicht: Eingaben, Inseln, eigene
 * Druckbilder (OWN_PRESS, `test581` §8), Schalter (nur `data-gedrueckt`).
 * Weniger Bewegung: nur `data-gedrueckt` (grund.css blendet ab). */

const RedionPress = (() => {

  /** Was einsinkt. */
  const PRESSABLE = [
    'button', '[role="button"]', '[role="tab"]', '[role="menuitem"]', '[role="menuitemradio"]',
    '[role="menuitemcheckbox"]', '[role="option"]', '[role="switch"]', 'summary', 'a.btn',
    '.rb', '.side-item', '.sr', '.ws-btn', '.side-chat', '.hk', '.bib-heft', '.wk-weg',
    '.lw-continue-card',
    /* „Eigene …" in Aussehen ist ein <label> um den Farbwähler (E705) —
       es sinkt wie seine neun Nachbarn, nicht mit einer eigenen Regel. */
    '.au-eigen'
  ].join(',');

  /** Wo nie etwas einsinkt. */
  const NEVER = '[data-kein-druck], .ui-touch-root, .ui-touch-portal, input, textarea, select';

  /** Knöpfe mit EIGENEM Druckbild (je eine `:active`-Regel): Glasknopf und
   *  Zeitmesser (translateY), KI-Leiste und Senden (scale .94/.92), Karte,
   *  Ordnerdeckel (E601/E604), Staffelei, `.hs-tun`, Funkelknopf (E528).
   *  Und die Reiter der unteren Leiste: dort sinkt, wie in der Tab-Leiste
   *  des Kits, nur das ZEICHEN (`SelectionFlow.druecke`, E706) — nicht der
   *  Reiter dazu (E702 × E706, beim Zusammenführen). */
  const OWN_PRESS = [
    '.fbtns button.prim', '[data-rmo~="glass"]', '.rmo-transport button', '#ai .ai-leiste button',
    '#ai-senden', '.rmo-recent-card', '.bib-deckel', '.ru-staff', '.hs-tun', '.ru-funkel',
    '#handy-oben > button[role="tab"]', '[data-eigener-druck]'
  ].join(',');

  /** Schalter: nur der Zustand (der Griff dehnt sich per CSS). */
  const STATE_ONLY = '.schalter, [role="switch"]';

  const MIN_HOLD = 80;
  /** Ab dieser Breite eine Zeile/Karte: `--card-press-scale`. */
  const WIDE = 160;

  type Press = { el: HTMLElement; since: number; pointer: number; anim: Animation | null; turn: number };

  let current: Press | null = null;
  let started = false;
  const running = new WeakMap<HTMLElement, Animation>();
  /** Zähler je Element: ein verspätetes Loslassen hebt keinen neuen Druck auf. */
  const turns = new WeakMap<HTMLElement, number>();

  const canScale = (): boolean => {
    try { return typeof CSS !== 'undefined' && CSS.supports('scale', '1'); } catch { return false; }
  };

  const calm = (): boolean =>
    typeof AppEinstellung !== 'undefined' ? AppEinstellung.wenigBewegung() : false;

  const target = (from: EventTarget | null): HTMLElement | null => {
    const el = from instanceof Element ? from.closest<HTMLElement>(PRESSABLE) : null;
    if (!el || el.closest(NEVER)) return null;
    if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return null;
    return el;
  };

  const scaleOf = (el: HTMLElement): number | null => {
    const s = getComputedStyle(el).scale;
    if (!s || s === 'none') return 1;
    if (/\s/.test(s.trim())) return null;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };

  const token = (name: string, fallback: string): string => {
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
    catch { return fallback; }
  };

  const ms = (name: string, fallback: number): number => {
    const raw = token(name, '');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? (/ms$/.test(raw) ? n : n * 1000) : fallback;
  };

  const press = (el: HTMLElement, pointer: number): void => {
    if (current) release();
    const turn = (turns.get(el) ?? 0) + 1;
    turns.set(el, turn);
    el.setAttribute('data-gedrueckt', '');
    const p: Press = { el, since: performance.now(), pointer, anim: null, turn };
    current = p;
    if (calm() || !canScale() || el.matches(STATE_ONLY) || el.matches(OWN_PRESS)) return;

    const from = scaleOf(el);
    running.get(el)?.cancel();
    const base = scaleOf(el);
    if (from === null || base === null) return;
    const depth = el.getBoundingClientRect().width > WIDE
      ? parseFloat(token('--card-press-scale', '0.985')) || 0.985
      : parseFloat(token('--press-scale', '0.96')) || 0.96;
    p.anim = el.animate([{ scale: String(from) }, { scale: String(base * depth) }],
      { duration: ms('--motion-instant', MIN_HOLD), easing: token('--ease', 'ease-out'), fill: 'forwards' });
    running.set(el, p.anim);
  };

  const release = (): void => {
    const p = current;
    if (!p) return;
    current = null;
    const go = (): void => {
      if (turns.get(p.el) !== p.turn) return;              /* schon wieder gedrückt */
      p.el.removeAttribute('data-gedrueckt');
      if (!p.anim) return;
      const from = scaleOf(p.el);
      p.anim.cancel();
      const base = scaleOf(p.el);
      if (from === null || base === null) return;
      const spring = typeof RedionSpring !== 'undefined'
        ? RedionSpring.token('press') : { easing: token('--feder-druck', 'ease-out'), duration: 575 };
      const back = p.el.animate([{ scale: String(from) }, { scale: String(base) }],
        { duration: spring.duration, easing: spring.easing });
      running.set(p.el, back);
      back.onfinish = () => { if (running.get(p.el) === back) running.delete(p.el); };
    };
    const wait = MIN_HOLD - (performance.now() - p.since);
    if (wait > 0) setTimeout(go, wait); else go();
  };

  const start = (): void => {
    if (started) return;
    started = true;
    window.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const el = target(e.target);
      if (el) press(el, e.pointerId);
    }, { capture: true, passive: true });
    const end = (e: PointerEvent): void => { if (current && current.pointer === e.pointerId) release(); };
    window.addEventListener('pointerup', end, { capture: true, passive: true });
    window.addEventListener('pointercancel', end, { capture: true, passive: true });
    /* Die Tastatur drückt auch (Leertaste, Eingabe) — wie `usePress` im Kit. */
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
      const el = target(document.activeElement);
      if (el && el === document.activeElement) press(el, -1);
    }, { capture: true });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && current?.pointer === -1) release();
    }, { capture: true });
    /* Wer zieht, das Fenster verlässt oder den Fokus verliert, hat losgelassen. */
    window.addEventListener('dragstart', () => release(), { capture: true, passive: true });
    window.addEventListener('blur', () => release());
  };

  return { start, PRESSABLE, OWN_PRESS, STATE_ONLY };
})();

(window as any).RedionPress = RedionPress;
