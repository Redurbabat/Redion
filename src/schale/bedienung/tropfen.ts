/* schale/bedienung/tropfen.ts — ein Knopf fliesst in sein Menü und zurück (E712).
 * ERZEUGT: quell/schale/bedienung/tropfen.js (`npm run bauen:ts`, test105).
 * Redur, 27.09., ca. 22:05, zum Video „LIQUID GLASS": „Schau mal das auch an
 * ich will das auch haben". Nur die Flüssigkeit: Kreise, die sich teilen und
 * vereinen — nur `transform`/`opacity` auf Federbahnen (RedionSpring, E702),
 * das Zähe ist EIN Filter (`Linse.TROPFEN`) auf einer Bühne, die nur steht,
 * solange es fliesst. Ohne Bewegung („Ruhig", System) keine Bühne. */

type TropfenRechteck = { left: number; top: number; width: number; height: number };

const Tropfen = (() => {

  const still = (): boolean =>
    typeof AppEinstellung !== 'undefined' ? AppEinstellung.wenigBewegung()
      : window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const mitte = (r: TropfenRechteck): { x: number; y: number } =>
    ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

  /** Die Bühne umschliesst nur den Weg; der Filter steht, solange sie steht. */
  const buehne = (alle: TropfenRechteck[]): { el: HTMLElement; goo: HTMLElement; ox: number; oy: number; weg: () => void } => {
    const zurueck = typeof Linse !== 'undefined' ? Linse.tropfenLeihen() : (): void => {};
    const RAND = 40;
    const l = Math.min(...alle.map(r => r.left)) - RAND;
    const t = Math.min(...alle.map(r => r.top)) - RAND;
    const r = Math.max(...alle.map(q => q.left + q.width)) + RAND;
    const b = Math.max(...alle.map(q => q.top + q.height)) + RAND;
    const el = document.createElement('div');
    el.className = 'ru-tropfen-buehne';
    el.setAttribute('aria-hidden', 'true');
    el.style.left = l + 'px';
    el.style.top = t + 'px';
    el.style.width = (r - l) + 'px';
    el.style.height = (b - t) + 'px';
    const goo = document.createElement('div');
    goo.className = 'ru-tropfen-goo';
    el.append(goo);
    document.body.append(el);
    return { el, goo, ox: l, oy: t, weg: () => { el.remove(); zurueck(); } };
  };

  /** Ein Kreis auf der Bühne, in seiner Ruhelage `d` px gross. */
  const kreis = (goo: HTMLElement, d: number): HTMLElement => {
    const k = document.createElement('span');
    k.className = 'ru-tropfen-kreis';
    k.style.width = k.style.height = d + 'px';
    goo.append(k);
    return k;
  };

  /** Die Federbahn als Keyframes: von a nach b, Skala von s0 nach s1. */
  const bahn = (a: { x: number; y: number }, b: { x: number; y: number }, s0: number, s1: number,
                feder: 'snappy' | 'smooth' | 'bouncy' = 'snappy'): { kf: Keyframe[]; dauer: number } => {
    const f = RedionSpring.sample(RedionSpring.preset(feder), 0, 1, 0, 16);
    const kf = f.values.map((v, i) => ({
      offset: Math.min(1, (i * 16) / f.duration),
      transform: `translate(${(a.x + (b.x - a.x) * v).toFixed(2)}px,${(a.y + (b.y - a.y) * v).toFixed(2)}px) ` +
                 `scale(${Math.max(0.01, s0 + (s1 - s0) * v).toFixed(4)})`
    }));
    (kf[kf.length - 1] as Keyframe).offset = 1;
    return { kf, dauer: f.duration };
  };

  const DURCHMESSER = 44;

  /** Aus dem Knopf `von` fliessen Tropfen zu `nach`; gibt die Ankunft (ms). */
  const teilen = (von: TropfenRechteck, nach: TropfenRechteck[], verzug = 40): number => {
    if (still() || !nach.length) return 0;
    const { el, goo, ox, oy, weg } = buehne([von, ...nach]);
    const d0 = Math.max(24, Math.min(von.width, von.height));
    const m = mitte(von);
    const lokal = (p: { x: number; y: number }, d: number) => ({ x: p.x - ox - d / 2, y: p.y - oy - d / 2 });

    /* Der Tropfen am Knopf schwillt an und gibt sich aus. */
    const mutter = kreis(goo, d0);
    const mp = lokal(m, d0);
    const kurve = getComputedStyle(document.documentElement).getPropertyValue('--ease-enter').trim() || 'ease-out';
    mutter.animate([
      { transform: `translate(${mp.x}px,${mp.y}px) scale(0.85)`, opacity: 1 },
      { transform: `translate(${mp.x}px,${mp.y}px) scale(1.18)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${mp.x}px,${mp.y}px) scale(0.2)`, opacity: 0 }
    ], { duration: verzug + 360, easing: kurve, fill: 'both' });

    let ankunft = 0;
    nach.forEach((z, i) => {
      const k = kreis(goo, DURCHMESSER);
      const a = lokal(m, DURCHMESSER), b = lokal(mitte(z), DURCHMESSER);
      const w = bahn(a, b, d0 / DURCHMESSER, Math.min(z.width, z.height) / DURCHMESSER);
      const start = verzug + i * 34;
      k.animate(w.kf, { duration: w.dauer, delay: start, easing: 'linear', fill: 'both' });
      ankunft = Math.max(ankunft, start + Math.round(w.dauer * 0.62));
    });
    /* Übergabe an die echten Knöpfe; spätestens dann weg (verborgener Reiter). */
    const aus = el.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: 140, delay: ankunft, easing: 'linear', fill: 'both' });
    aus.finished.then(weg).catch(weg);
    setTimeout(weg, ankunft + 6000);
    return ankunft;
  };

  /** Die Tropfen an `von` (und die Scheibe `flaeche`) fliessen in `nach`. */
  const vereinen = (von: TropfenRechteck[], nach: TropfenRechteck, flaeche: TropfenRechteck | null = null): void => {
    if (still() || !von.length) return;
    const { el, goo, ox, oy, weg } = buehne([nach, ...von, ...(flaeche ? [flaeche] : [])]);
    const exit = getComputedStyle(document.documentElement).getPropertyValue('--ease-exit').trim() || 'ease-in';
    if (flaeche) {
      const g = document.createElement('div');
      g.className = 'ru-tropfen-geist';
      g.style.left = (flaeche.left - ox) + 'px';
      g.style.top = (flaeche.top - oy) + 'px';
      g.style.width = flaeche.width + 'px';
      g.style.height = flaeche.height + 'px';
      el.prepend(g);
      const sx = Math.max(0.05, nach.width / flaeche.width), sy = Math.max(0.05, nach.height / flaeche.height);
      const dx = nach.left - flaeche.left, dy = nach.top - flaeche.top;
      g.animate([
        { transform: 'none', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, opacity: 0 }
      ], { duration: 240, easing: exit, fill: 'both' });
    }
    const d1 = Math.max(24, Math.min(nach.width, nach.height));
    const ziel = mitte(nach);
    const lokal = (p: { x: number; y: number }, d: number) => ({ x: p.x - ox - d / 2, y: p.y - oy - d / 2 });
    let ende = 0;
    von.forEach((q, i) => {
      const k = kreis(goo, DURCHMESSER);
      const a = lokal(mitte(q), DURCHMESSER), b = lokal(ziel, DURCHMESSER);
      const w = bahn(a, b, Math.min(q.width, q.height) / DURCHMESSER, d1 / DURCHMESSER);
      const start = (von.length - 1 - i) * 26;
      k.animate(w.kf, { duration: w.dauer, delay: start, easing: 'linear', fill: 'both' });
      ende = Math.max(ende, start + Math.round(w.dauer * 0.6));
    });
    const mutter = kreis(goo, d1);
    const mp = lokal(ziel, d1);
    mutter.animate([
      { transform: `translate(${mp.x}px,${mp.y}px) scale(0.3)`, opacity: 0 },
      { transform: `translate(${mp.x}px,${mp.y}px) scale(1.12)`, opacity: 1, offset: 0.7 },
      { transform: `translate(${mp.x}px,${mp.y}px) scale(1)`, opacity: 0 }
    ], { duration: ende + 160, easing: 'linear', fill: 'both' });
    const aus = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, delay: ende, easing: 'linear', fill: 'both' });
    aus.finished.then(weg).catch(weg);
    setTimeout(weg, ende + 6000);
  };

  /** Die Scheibe wächst aus dem Knopf; der Inhalt blendet nach (Rechner). */
  const wachsen = (flaeche: HTMLElement, aus: TropfenRechteck): Animation[] => {
    if (still()) return [];
    const r = flaeche.getBoundingClientRect();
    if (!r.width || !r.height) return [];
    const sx = Math.max(0.05, aus.width / r.width), sy = Math.max(0.05, aus.height / r.height);
    const dx = aus.left - r.left, dy = aus.top - r.top;
    const f = RedionSpring.sample(RedionSpring.preset('snappy'), 0, 1, 0, 16);
    const kf = f.values.map((v, i) => ({
      offset: Math.min(1, (i * 16) / f.duration),
      transform: `translate(${(dx * (1 - v)).toFixed(2)}px,${(dy * (1 - v)).toFixed(2)}px) ` +
                 `scale(${(sx + (1 - sx) * v).toFixed(4)},${(sy + (1 - sy) * v).toFixed(4)})`
    }));
    (kf[kf.length - 1] as Keyframe).offset = 1;
    flaeche.style.transformOrigin = '0 0';
    const lauf = [
      flaeche.animate(kf, { duration: f.duration, easing: 'linear' }),
      flaeche.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 110, easing: 'linear' })
    ];
    [...flaeche.children].forEach(kind => {
      if (!(kind instanceof HTMLElement) || kind.classList.contains('ru-tropfen-kopf')) return;
      lauf.push(kind.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 170, delay: 110, easing: 'linear', fill: 'backwards' }));
    });
    return lauf;
  };

  return { still, teilen, vereinen, wachsen };
})();

(window as any).Tropfen = Tropfen;
