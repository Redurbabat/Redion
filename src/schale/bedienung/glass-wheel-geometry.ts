/* Reine Rad-Geometrie. Keine Ablage, kein DOM, keine laufende Animation. */
const GlassWheelGeometry = (() => {
  const wrap = (value: number, count: number): number => count > 0
    ? ((Math.round(value) % count) + count) % count : -1;
  const step = (count: number): number => 360 / Math.max(1, Math.min(8, count));
  const delta = (from: number, to: number): number => ((to - from + 540) % 360 + 360) % 360 - 180;
  const distance = (index: number, selected: number, count: number): number => {
    if (count < 1) return 0;
    return ((index - selected + count / 2) % count + count) % count - count / 2;
  };
  const positions = (count: number, rotation: number): Array<{index: number; angle: number}> => {
    if (count < 1) return [];
    const increment = step(count), raw = Math.round(-rotation / increment);
    const selected = wrap(raw, count), residual = rotation + raw * increment;
    return Array.from({length: count}, (_, index) => ({index,
      offset: distance(index, selected, count)}))
      .filter(item => count <= 8 || Math.abs(item.offset) <= 3)
      .map(item => ({index:item.index,angle:-90 + item.offset * increment + residual}));
  };
  const settle = (rotation: number, velocity: number, count: number, reduced = false): number => {
    if (count <= 1) return 0;
    const increment = step(count);
    const coast = reduced ? 0 : Math.max(-2 * increment, Math.min(2 * increment, velocity * 140));
    return Math.round((rotation + coast) / increment) * increment;
  };
  return {wrap,step,delta,distance,positions,settle};
})();
