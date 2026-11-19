/* Suite 641 — der Schalter zeigt, wie er steht, und die Leitung kommt aus der Klemme (E787, E788)
 * ============================================================================
 * Redur, 15. November 2026: „ich will das du die schalterzeichnen
 * verbessers also wenn ich eine schalter klicke sollte sich ändern … und
 * verbessere alles damit ich schneller zeichne können".
 *
 * Bis hierher stand jeder Schalter in der Simulation in seiner Ruhelage —
 * geschlossen sah aus wie offen, und nur der laufende Strich auf der
 * Leitung verriet die Stellung. Und jede Leitung verlangte zuerst den
 * Werkzeugwechsel auf „Leitung" und danach zurück.
 *
 *   §1 Register: jedes Zeichen mit Bild je Stellung hat genau so viele
 *      Bilder wie die Simulation Stellungen kennt; jedes Bild ersetzt nur
 *      vorhandene Striche; zwei Stellungen sehen nie gleich aus; ohne
 *      Stellung zeichnet jedes Zeichen genau wie vorher (Ruhelage, E128).
 *   §2 Wechselschaltung in der Planfläche: Strom an, auf S1 klicken — die
 *      Klinge liegt anders, der Name der Stellung steht darunter und
 *      wechselt, die Lampe folgt, und die Klinge zieht sich nach (Klasse
 *      sp-umgelegt nur am umgelegten Schalter).
 *   §3 Ausserhalb der Simulation: keine Klinge, kein Stellungsname —
 *      Zeichen für Zeichen wie vorher.
 *   §4 Die Simulation meldet die Stellung, in der sie gerechnet hat
 *      (`Ergebnis.stellungen`), auch die eines Kontakts, den eine Spule hält.
 *   §5 Leitung aus der Klemme: im Zeigen-Werkzeug von einer Klemme zur
 *      anderen ziehen gibt EINE neue Leitung mit beiden Enden auf ihren
 *      Klemmen; das Teil bleibt liegen; das Werkzeug bleibt „Zeigen".
 *      Wer das Teil am Körper fasst, verschiebt es weiter.
 *   §6 Weniger Bewegung: die Klinge steht sofort (keine Animation).
 *
 * Gegen den Stand vor E787/E788 rot: §1 (kein `hatStellungsbild`), §2 (die
 * Klinge bleibt), §4 (kein `stellungen`), §5 (das Teil wandert statt einer
 * Leitung).
 *
 *   node pruefungen/lauf/test641.mts
 * ==========================================================================*/
import { chromium, type Page } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Register: any;
declare const Stromfluss: any; declare const Schaltplan: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

const aufmachen = async (o: { ruhig?: boolean; plan: 'wechsel' | 'zwei' }): Promise<Page> => {
  const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 },
    ...(o.ruhig ? { reducedMotion: 'reduce' as const } : {}) });
  const s = await ktx.newPage();
  s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await s.goto(INDEX);
  await s.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
  await s.evaluate(async (art) => {
    Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
    Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
    const plan = { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 500, teile: [] as any[], leitungen: [], texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] };
    if (art === 'wechsel') Schaltplan.beispielBauen(plan, 'wechselschaltung', 'plan');
    else plan.teile.push(
      { id: 'q1', zeichen: 'ausschalter', x: 200, y: 200, drehung: 0, gespiegelt: false, bmk: 'S1', nummern: {}, gruppe: '', ebene: 'plan' },
      { id: 'h1', zeichen: 'lampe', x: 480, y: 200, drehung: 0, gespiegelt: false, bmk: 'E1', nummern: {}, gruppe: '', ebene: 'plan' });
    const sp = Store.addPage(null, { text: 'Plan 641', icon: '⚡' });
    (window as any).__bid = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan }).id;
    await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  }, o.plan);
  await s.waitForSelector('.sp-wrap svg.sp-flaeche');
  await s.locator('.sp-wrap').first().scrollIntoViewIfNeeded();
  await s.waitForTimeout(400);
  return s;
};

/* ══ §1 ════════════════════════════════════════════════════════════════════ */
console.log('\n§1 Register: ein Bild je Stellung');
const R = await aufmachen({ plan: 'zwei' });
const r1 = await R.evaluate(() => {
  const fz = Register.fachzeichen;
  if (typeof fz.hatStellungsbild !== 'function') return { gibt: false } as any;
  const pfade = (svg: string): string[] => [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]!);
  const ids: string[] = fz.alle().map((z: any) => z.id).filter((id: string) => fz.hatStellungsbild(id));
  const falsch: string[] = [];
  ids.forEach(id => {
    const n = Stromfluss.stellungenVon(id).length;
    const z = fz.holen(id);
    const bilder: string[][] = [];
    for (let i = 0; i < n; i++) {
      const svg = fz.alsSvg(id, { stellung: i });
      const d = pfade(svg);
      if (d.length !== z.pfad.length) falsch.push(`${id}: Stellung ${i} hat ${d.length} statt ${z.pfad.length} Striche`);
      if (!/class="sp-klinge"/.test(svg)) falsch.push(`${id}: Stellung ${i} ohne Klinge`);
      bilder.push(d);
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
      if (bilder[i]!.join('|') === bilder[j]!.join('|')) falsch.push(`${id}: Stellung ${i} und ${j} sehen gleich aus`);
    /* Mehr Bilder als Stellungen? Dann zeigte eine Stellung die falsche. */
    const svgUeber = fz.alsSvg(id, { stellung: n });
    if (pfade(svgUeber).join('|') !== bilder[n - 1]!.join('|')) falsch.push(`${id}: Stellung ${n} (zu gross) gibt nicht die letzte`);
    if (n < 2) falsch.push(`${id}: die Simulation kennt ${n} Stellungen`);
    /* Ohne Stellung: wie vorher. */
    const ohne = pfade(fz.alsSvg(id, {}));
    if (ohne.join('|') !== z.pfad.join('|')) falsch.push(`${id}: ohne Stellung nicht wie das Register`);
  });
  /* Jeder Handschalter der Simulation hat ein Bild — sonst bliebe er stumm. */
  const hand = ['ausschalter', 'taster-schliesser', 'taster-oeffner', 'wechselschalter', 'kreuzschalter',
    'serienschalter', 'hauptschalter', 'ch-schema0', 'ch-schema1', 'ch-schema2', 'ch-schema3', 'ch-schema6',
    'schliesser', 'oeffner', 'wechsler', 'schuetz-schliesser', 'schuetz-oeffner', 'schuetz-hauptkontakt'];
  const ohneBild = hand.filter(id => !fz.hatStellungsbild(id));
  /* Ruhelage der Norm: wo das Zeichen eine Stellung zeigt, ist Stellung 0 genau das Zeichen. */
  const normRuhe = ['ausschalter', 'ch-schema0', 'schliesser', 'oeffner', 'wechselschalter', 'ch-schema3', 'taster-schliesser'];
  const ruheAnders = normRuhe.filter(id => pfade(fz.alsSvg(id, { stellung: 0 })).join('|') !== fz.holen(id).pfad.join('|'));
  return { gibt: true, anzahl: ids.length, falsch, ohneBild, ruheAnders };
});
p('Register.fachzeichen.hatStellungsbild gibt es', r1.gibt);
p('Jeder der 18 Handschalter und Kontakte hat ein Bild je Stellung', r1.gibt && !r1.ohneBild.length, JSON.stringify(r1.ohneBild));
p('Anzahl Bilder = Anzahl Stellungen, nur vorhandene Striche, alle verschieden', r1.gibt && !r1.falsch.length, (r1.falsch || []).slice(0, 6).join(' · '));
p('Wo die Norm eine Stellung zeigt, ist Stellung 0 genau das Zeichen', r1.gibt && !r1.ruheAnders.length, JSON.stringify(r1.ruheAnders));

/* ══ §5 ════════════════════════════════════════════════════════════════════ */
console.log('\n§5 Leitung aus der Klemme (Zeigen-Werkzeug)');
const schirm = (s: Page, x: number, y: number) => s.evaluate(([x, y]) => {
  const svg = document.querySelector<SVGSVGElement>('.sp-wrap svg.sp-flaeche')!;
  const m = svg.getScreenCTM()!; const q = new DOMPoint(x, y).matrixTransform(m);
  return { x: q.x, y: q.y };
}, [x, y] as const);
const klemmen = await R.evaluate(() => {
  const blk = Store.getBlock((window as any).__bid);
  const plan = blk ? Schaltplan.lesen(blk) : null;
  const q = plan.teile.find((t: any) => t.id === 'q1'), h = plan.teile.find((t: any) => t.id === 'h1');
  return { q: Schaltplan.anschluesseVon(q), h: Schaltplan.anschluesseVon(h), qx: q.x, qy: q.y };
}).catch(() => null);
if (!klemmen) p('Plan gelesen', false, 'Store.state.blocks nicht gefunden');
else {
  const a = klemmen.q[1]!, b = klemmen.h[0]!;     /* S1 unten → E1 oben */
  const pa = await schirm(R, a.x, a.y), pb = await schirm(R, b.x, b.y);
  await R.mouse.move(pa.x, pa.y);
  await R.waitForTimeout(80);
  const hinweis = await R.evaluate(() => !!document.querySelector('.sp-wrap .sp-klemme-ring') &&
    !!document.querySelector('.sp-wrap .sp-klemme-nah'));
  p('Über der Klemme: Ring und Fadenkreuz', hinweis);
  await R.mouse.down();
  await R.mouse.move((pa.x + pb.x) / 2, pa.y + 40, { steps: 6 });
  await R.mouse.move(pb.x, pb.y, { steps: 6 });
  await R.mouse.up();
  await R.waitForTimeout(300);
  const nach = await R.evaluate(() => {
    const blk = Store.getBlock((window as any).__bid);
    const plan = Schaltplan.lesen(blk);
    const q = plan.teile.find((t: any) => t.id === 'q1');
    const wz = document.querySelector('.sp-wrap [data-wz][aria-pressed="true"], .sp-wrap [data-wz].on, .sp-wrap [data-wz][aria-checked="true"]') as HTMLElement | null;
    return { leitungen: plan.leitungen.map((l: any) => ({ von: l.vonTeil, vonNr: l.vonNr, nach: l.nachTeil, nachNr: l.nachNr })),
             qx: q.x, qy: q.y, wz: wz?.dataset.wz || '' };
  });
  p('Genau eine neue Leitung', nach.leitungen.length === 1, JSON.stringify(nach.leitungen));
  const l = nach.leitungen[0] || {};
  p('… von S1 an ihrer Klemme zu E1 an ihrer Klemme', l.von === 'q1' && l.nach === 'h1' && l.vonNr === a.nr && l.nachNr === b.nr, JSON.stringify(l));
  p('S1 bleibt liegen', nach.qx === klemmen.qx && nach.qy === klemmen.qy, `${nach.qx},${nach.qy}`);
  p('Das Werkzeug bleibt „Zeigen"', !nach.wz || nach.wz === 'zeigen', nach.wz);
  /* Am Körper gefasst: das Teil wandert. */
  const k = await R.evaluate(() => {
    const g = document.querySelector('.sp-wrap .sp-teil[data-id="h1"]')!.getBoundingClientRect();
    return { x: g.left + g.width / 2, y: g.top + g.height / 2 };
  });
  await R.mouse.move(k.x, k.y); await R.mouse.down();
  await R.mouse.move(k.x + 60, k.y + 40, { steps: 8 }); await R.mouse.up();
  await R.waitForTimeout(300);
  const gewandert = await R.evaluate(() => {
    const blk = Store.getBlock((window as any).__bid);
    const plan = Schaltplan.lesen(blk);
    const h = plan.teile.find((t: any) => t.id === 'h1');
    return { x: h.x, y: h.y, n: plan.leitungen.length };
  });
  p('Am Körper gefasst, wandert das Teil (und es entsteht keine Leitung)', (gewandert.x !== 480 || gewandert.y !== 200) && gewandert.n === 1, JSON.stringify(gewandert));
}

/* ══ §2 ════════════════════════════════════════════════════════════════════ */
console.log('\n§2 Wechselschaltung: klicken legt die Klinge um');
const W = await aufmachen({ plan: 'wechsel' });
const bild = (s: Page) => s.evaluate(() => {
  const w = [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!;
  return [...w.querySelectorAll<SVGGElement>('.sp-teil')].map(g => ({
    id: g.dataset.id!, stellung: g.getAttribute('data-stellung'),
    klinge: [...g.querySelectorAll('.sp-klinge')].map(x => x.getAttribute('d')).join('|'),
    name: g.querySelector('.sp-stellung')?.textContent || '',
    umgelegt: g.classList.contains('sp-umgelegt'),
    hell: g.querySelector('.sp-leuchtet') ? 1 : 0, bmk: g.querySelector('text')?.textContent || ''
  }));
});
const vorStrom = await bild(W);
p('Ohne Simulation: keine Klinge, kein Stellungsname (§3)', vorStrom.every(t => !t.klinge && !t.name && t.stellung === null),
  JSON.stringify(vorStrom.filter(t => t.klinge || t.name)));
await W.locator('.sp-wrap [data-a="simulation"]').last().click();
await W.waitForTimeout(400);
const b0 = await bild(W);
const schalter = b0.filter(t => t.stellung !== null);
p('In der Simulation tragen beide Wechselschalter Klinge und Stellung', schalter.length === 2 && schalter.every(t => t.klinge && t.name),
  JSON.stringify(b0));
const s1 = schalter[0];
if (s1) {
  const box = await W.evaluate((id) => {
    const g = document.querySelector(`.sp-wrap .sp-teil[data-id="${CSS.escape(id)}"]`)!.getBoundingClientRect();
    return { x: g.left + g.width / 2, y: g.top + g.height / 2 };
  }, s1.id);
  const hellVor = b0.reduce((a, t) => a + t.hell, 0);
  await W.mouse.click(box.x, box.y);
  await W.waitForTimeout(60);
  const b1 = await bild(W);
  const s1n = b1.find(t => t.id === s1.id)!;
  p('Nach dem Klick: andere Stellung', s1n.stellung !== s1.stellung, `${s1.stellung} → ${s1n.stellung}`);
  p('… die Klinge liegt anders', s1n.klinge !== s1.klinge, `${s1.klinge} → ${s1n.klinge}`);
  p('… und der Name darunter wechselt', s1n.name !== s1.name && !!s1n.name, `${s1.name} → ${s1n.name}`);
  p('… die Lampe folgt (leuchtet ↔ dunkel)', b1.reduce((a, t) => a + t.hell, 0) !== hellVor, String(hellVor));
  p('Nur der umgelegte Schalter zieht seine Klinge nach', s1n.umgelegt && b1.filter(t => t.umgelegt).length === 1,
    JSON.stringify(b1.filter(t => t.umgelegt).map(t => t.id)));
  const anim = await W.evaluate((id) => {
    const k = document.querySelector(`.sp-wrap .sp-teil[data-id="${CSS.escape(id)}"] .sp-klinge`);
    return k ? getComputedStyle(k).animationName : '';
  }, s1.id);
  p('… mit der Animation sp-klinge-legen', anim === 'sp-klinge-legen', anim);
  /* Zurück: wieder wie am Anfang. */
  await W.mouse.click(box.x, box.y);
  await W.waitForTimeout(60);
  const b2 = await bild(W);
  const s1z = b2.find(t => t.id === s1.id)!;
  p('Zweiter Klick: wieder die erste Stellung und Klinge', s1z.stellung === s1.stellung && s1z.klinge === s1.klinge);
  /* §4: die Simulation meldet die Stellung */
  const st = await W.evaluate(() => {
    const blk = Store.getBlock((window as any).__bid);
    const plan = Schaltplan.lesen(blk);
    const s = plan.teile.find((t: any) => /wechsel|schema3/.test(t.zeichen));
    const e = Stromfluss.rechne(plan, { [s.id]: 1 });
    return { hat: !!e.stellungen, wert: e.stellungen ? e.stellungen[s.id] : null };
  });
  console.log('\n§4 Die Simulation meldet ihre Stellung');
  p('Ergebnis.stellungen enthält die Handstellung', st.hat && st.wert === 1, JSON.stringify(st));
}
/* §4b: ein Kontakt, den eine Spule hält — über die Zeichnung mit gesetzter Stellung */
const kontakt = await W.evaluate(() => {
  const plan = { art: 'stromlauf-aufgeloest', breite: 300, hoehe: 200, leitungen: [], texte: [],
    ebenen: [{ id: 'plan', name: 'Plan', farbe: '#000', sichtbar: true }],
    teile: [{ id: 'k', zeichen: 'schliesser', x: 50, y: 50, drehung: 0, gespiegelt: false, bmk: 'K1', nummern: {}, gruppe: '', ebene: 'plan' }] };
  const ruhe = Schaltplan.alsSvg(plan, { stellungen: { k: 0 } });
  const an = Schaltplan.alsSvg(plan, { stellungen: { k: 1 }, stellungsnamen: { k: Stromfluss.stellungenVon('schliesser')[1].name } });
  const d = (s: string) => (s.match(/class="sp-klinge"[^>]*d="([^"]+)"/) || [])[1];
  return { ruhe: d(ruhe), an: d(an), name: (an.match(/class="sp-stellung"[^>]*>([^<]+)</) || [])[1] };
});
p('Ein Schützkontakt in Stellung 1 zeichnet zu, mit „geschlossen" darunter',
  kontakt.ruhe === 'M20,44 L32,14' && kontakt.an === 'M20,44 L20,16' && kontakt.name === 'geschlossen', JSON.stringify(kontakt));

/* ══ §6 ════════════════════════════════════════════════════════════════════ */
console.log('\n§6 Weniger Bewegung');
const Q = await aufmachen({ plan: 'wechsel', ruhig: true });
await Q.locator('.sp-wrap [data-a="simulation"]').last().click();
await Q.waitForTimeout(300);
const ruhig = await Q.evaluate(async () => {
  const g = [...document.querySelectorAll<SVGGElement>('.sp-wrap .sp-teil[data-stellung]')][0];
  if (!g) return 'kein Schalter';
  const r = g.getBoundingClientRect();
  g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
  await new Promise(f => setTimeout(f, 50));
  const k = document.querySelector('.sp-wrap .sp-umgelegt .sp-klinge');
  return k ? getComputedStyle(k).animationName : 'nicht umgelegt';
});
p('Die Klinge steht sofort (keine Animation)', ruhig === 'none', ruhig);

p('Keine Seitenfehler', !fehler.length, fehler.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${ok} bestanden, ${weg} nicht`);
process.exit(weg ? 1 : 0);
