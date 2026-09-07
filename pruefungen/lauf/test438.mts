/* Suite 438 — Zeichnen wie GoodNotes: Dreieck, rundes Rechteck, Bleistift, freie Stärke, Tasten (E465)
 * ============================================================================
 * Redur, 7. September, mit dem GoodNotes-Dossier: „der PDF-Teil, wie die
 * bearbeitet wird, die Stifte usw. — alles 1:1". Dieser Lauf hält den
 * ersten Bogen davon:
 *
 *   §1 ZWEI FORMEN MEHR: Dreieck und rundes Rechteck stehen im Zubehör,
 *      lassen sich aufziehen, liegen als Marke im Block und sind für die
 *      Auswahl in ihrer Fläche greifbar.
 *   §2 DER BLEISTIFT: vierter Stift, schwillt weniger als der Füller,
 *      zeichnet eine durchscheinende Fläche mit rauer Kante — und der
 *      Wechsel Füller → Kugel → Pinsel bleibt, wie test343 ihn kennt.
 *   §3 DIE FREIE STÄRKE: ein Regler in einer Klappe unter den drei Stufen; sein Wert ist
 *      die Stärke des nächsten Strichs, und eine Stufe stellt ihn nach.
 *   §4 DIE TASTEN: P, 2, H, E, S, V, T, A, N, M, R wechseln das Werkzeug —
 *      nur, solange niemand tippt; die Übersicht (`register/tasten`) nennt
 *      dieselben Buchstaben wie der Griff.
 *   §5 Am Telefon: der Regler misst 44 hoch, wie alles in der Leiste.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `marken.ts` den Zweig `art === 'triangle'` entfernen: das
 *        Dreieck wird nicht gezeichnet. Gelaufen am 7. September 2026, rot.
 *   §4 → `document.addEventListener('keydown', kuerzel)` weglassen: kein
 *        Buchstabe wechselt mehr. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test438.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9558;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine Seite mit einem A4-Blatt, ausserhalb des Schreibstudios — dort steht
 *  die Blattleiste mit allem Zubehör offen. */
const mitBlatt = async (handy = false): Promise<Page> => {
  const s = await browser.newPage(handy
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Zeichenziel !== 'undefined'");
  await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:stift', 'fueller');
    Store.setMeta('zeichnen:form', 'line');
    const seite = Store.addPage(null, { text: 'Probeblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  })()`);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};
/** Einen Zug mit dem Zeiger über das Blatt — in Blattpunkten. */
/** Einen Zug mit synthetischen Zeigerereignissen fahren — Punkte im Blattraum.
 *  Eine ECHTE Funktion, keine Zeichenkette: eine Zeichenkette wertet Playwright
 *  nur aus und ruft sie nicht mit dem Argument — der erste Entwurf zog damit
 *  nichts, ohne Fehler. */
const zug = (s: Page, von: number[], bis: number[], art = 'mouse') =>
  s.evaluate(async ({ von, bis, art }: { von: number[]; bis: number[]; art: string }) => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken');
    if (!f) throw new Error('keine Zeichenschicht');
    const ctm = f.getScreenCTM();
    if (!ctm) throw new Error('kein CTM');
    const px = (q: number[]) => { const pt = f.createSVGPoint(); pt.x = q[0]!; pt.y = q[1]!; const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const a = px(von), b = px(bis);
    const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: x, clientY: y,
      pointerId: 7, pointerType: art, isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
      buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 });
    f.dispatchEvent(ev('pointerdown', a.x, a.y));
    const n = 12;
    for (let i = 1; i <= n; i++) f.dispatchEvent(ev('pointermove', a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n));
    f.dispatchEvent(ev('pointerup', b.x, b.y));
    await new Promise(r => setTimeout(r, 500));
  }, { von, bis, art });
const MARKEN = `(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify((b && b.marken) || []);
})()`;

/* ═══ §1 Dreieck und rundes Rechteck ═══════════════════════════════════════ */
console.log('\n§1 Dreieck und rundes Rechteck');
{
  const s = await mitBlatt();
  const zubehoer = await s.evaluate(`[...document.querySelectorAll('.blatt-werk [data-act="formart"]')].map(k => k.dataset.form)`) as string[];
  gleich('Sieben Formen im Zubehör (die Kurve kam mit E483 dazu)', zubehoer, ['line', 'arrow', 'rectangle', 'ellipse', 'triangle', 'roundrect', 'curve']);
  const bau = JSON.parse(await s.evaluate(`(() => {
    const d = Marken.zeichneMarke({ id: 't', art: 'triangle', farbe: '#d64545', breite: 2.4, pts: [[10, 10], [110, 90]] });
    const r = Marken.zeichneMarke({ id: 'r', art: 'roundrect', farbe: '#2f7ed8', breite: 2.4, pts: [[10, 10], [130, 70]] });
    return JSON.stringify({
      dreieck: d ? { tag: d.tagName, punkte: (d.getAttribute('points') || '').trim().split(/\\s+/).length, fill: d.getAttribute('fill'), treffer: d.getAttribute('pointer-events') } : null,
      rund: r ? { tag: r.tagName, rx: Number(r.getAttribute('rx')), treffer: r.getAttribute('pointer-events') } : null
    });
  })()`) as string);
  p('Das Dreieck ist ein Polygon mit drei Ecken, leer gefüllt, in der Fläche greifbar',
    bau.dreieck?.tag === 'polygon' && bau.dreieck.punkte === 3 && bau.dreieck.fill === 'none' && bau.dreieck.treffer === 'all', JSON.stringify(bau.dreieck));
  p('Das runde Rechteck ist ein Rechteck mit Rundung (ein Sechstel der kurzen Seite)',
    bau.rund?.tag === 'rect' && bau.rund.rx === 10 && bau.rund.treffer === 'all', JSON.stringify(bau.rund));

  /* Aufziehen mit dem Werkzeug — die Marke landet im Block. */
  await s.click('.blatt-werk [data-wz="formen"]');
  await s.click('.blatt-werk [data-act="formart"][data-form="triangle"]');
  await s.waitForTimeout(200);
  const jetzt = await s.evaluate(`Zeichenziel.jetzt()`);
  gleich('Ein Tipp auf „Dreieck" führt das Werkzeug', jetzt, 'triangle');
  await zug(s, [100, 100], [260, 240]);
  await s.click('.blatt-werk [data-act="formart"][data-form="roundrect"]');
  await zug(s, [300, 100], [500, 200]);
  const marken = JSON.parse(await s.evaluate(MARKEN) as string) as any[];
  gleich('Zwei Marken im Block: Dreieck und rundes Rechteck', marken.map(m => m.art), ['triangle', 'roundrect']);
  p('… mit zwei Punkten, wie jede Zweipunkt-Form', marken.every(m => Array.isArray(m.pts) && m.pts.length === 2));
  p('Beide stehen als Knoten in der Schicht',
    await s.evaluate(`document.querySelectorAll('.blatt-marken [data-ink-art="triangle"], .blatt-marken [data-ink-art="roundrect"]').length`) === 2);
  /* Die Auswahl trifft das Dreieck in seiner Fläche — nicht nur am Rand. */
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [180, 200], [181, 201]);
  const gewaehlt = await s.evaluate(`document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length`);
  p('Ein Tipp in die Fläche des Dreiecks wählt es', Number(gewaehlt) >= 1, String(gewaehlt));
  await s.close();
}

/* ═══ §2 Der Bleistift ═════════════════════════════════════════════════════ */
console.log('\n§2 Der Bleistift');
{
  const s = await mitBlatt();
  await s.click('.blatt-werk [data-wz="stift"]');
  const stifte = await s.evaluate(`Marken.STIFTE.map(st => st.id)`) as string[];
  gleich('Vier Stifte, der Bleistift zuletzt', stifte, ['fueller', 'kugel', 'pinsel', 'bleistift']);
  p('Der Bleistift schwillt weniger als der Füller — und dünner ist er auch',
    await s.evaluate(`Marken.druckFaktor('bleistift', 0.9) < Marken.druckFaktor('fueller', 0.9) && Marken.druckFaktor('bleistift', 0.1) < Marken.druckFaktor('fueller', 0.1)`));
  const knoten = JSON.parse(await s.evaluate(`(() => {
    const n = Marken.zeichneMarke({ id: 'b', art: 'stift', stil: 'bleistift', farbe: '#111111', breite: 2.4,
      pts: [[10, 10], [40, 30], [80, 20], [120, 40]], pressure: [0.4, 0.6, 0.5, 0.7] });
    return JSON.stringify(n ? { tag: n.tagName, deckung: n.getAttribute('opacity'), koernung: n.getAttribute('stroke-dasharray'), stil: n.getAttribute('data-ink-stil'), flaeche: /^M/.test(n.getAttribute('d') || '') && n.getAttribute('fill') === '#111111' } : null);
  })()`) as string);
  p('Er zeichnet eine Fläche wie der Füller, durchscheinend und mit rauer Kante',
    knoten?.tag === 'path' && knoten.flaeche && knoten.deckung === '0.72' && !!knoten.koernung && knoten.stil === 'bleistift', JSON.stringify(knoten));
  /* Der Knopf wechselt weiter Füller → Kugel → Pinsel → Bleistift → Füller. */
  const reihe: string[] = [];
  for (let n = 0; n < 4; n++) {
    await s.click('.blatt-werk [data-act="stil"]');
    reihe.push(await s.evaluate(`document.querySelector('.blatt-werk [data-act="stil"]').dataset.stil`) as string);
  }
  gleich('Der Knopf wechselt: Kugel, Pinsel, Bleistift, wieder Füller', reihe, ['kugel', 'pinsel', 'bleistift', 'fueller']);
  await s.click('.blatt-werk [data-act="stil"]'); await s.click('.blatt-werk [data-act="stil"]'); await s.click('.blatt-werk [data-act="stil"]');
  gleich('… und merkt sich den Bleistift', await s.evaluate(`Store.getMeta('zeichnen:stift')`), 'bleistift');
  await zug(s, [100, 400], [300, 420]);
  const marken = JSON.parse(await s.evaluate(MARKEN) as string) as any[];
  p('Ein gezogener Strich trägt den Stil „bleistift" und seine Druckwerte',
    marken.length === 1 && marken[0].art === 'stift' && marken[0].stil === 'bleistift' && Array.isArray(marken[0].pressure), JSON.stringify(marken[0] || null).slice(0, 80));
  await s.close();
}

/* ═══ §3 Die freie Stärke ══════════════════════════════════════════════════ */
console.log('\n§3 Die freie Stärke');
{
  const s = await mitBlatt();
  await s.click('.blatt-werk [data-wz="stift"]');
  const REGLER = `(() => {
    const l = document.querySelector('.blatt-werk .blatt-staerke');
    const i = l && l.querySelector('input');
    const r = l && l.getBoundingClientRect();
    const w = document.querySelector('.blatt-werk').getBoundingClientRect();
    return JSON.stringify(i ? { da: true, gruppe: l.dataset.gruppe, min: i.min, max: i.max, wert: i.value, sichtbar: r.width > 0 && r.height > 0,
      name: i.getAttribute('aria-label'), lage: getComputedStyle(l).position, unterhalb: r.top >= w.bottom - 8, leiste: Math.round(w.height) } : { da: false });
  })()`;
  /* DIE KLAPPE (E465 Nachtrag): zu, bis die gewaehlte Stufe ein zweites
     Mal getippt wird — wie in GoodNotes. In der Zeile hatte der Regler die
     Leiste bei 596 px auf drei Reihen gehoben (test351). */
  let regler = JSON.parse(await s.evaluate(REGLER) as string);
  p('Der Regler ist da, aber zu — die Leiste bleibt zwei Zeilen',
    regler.da && regler.gruppe === 'breite' && !regler.sichtbar && regler.leiste < 100, JSON.stringify(regler));
  await s.click('.blatt-werk .blatt-strich.on');
  regler = JSON.parse(await s.evaluate(REGLER) as string);
  p('Die gewählte Stufe nochmal getippt: der Regler von 0,5 bis 12 hängt unter der Leiste, mit Vorlesenamen',
    regler.da && regler.min === '0.5' && regler.max === '12' && regler.sichtbar && !!regler.name && regler.lage === 'absolute' && regler.unterhalb && regler.leiste < 100, JSON.stringify(regler));
  await s.evaluate(`(() => { const i = document.querySelector('.blatt-werk .blatt-staerke input'); i.value = '7.5'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  gleich('Der Regler setzt die Stärke sofort', await s.evaluate(`Zeichenziel.jetztDicke()`), 7.5);
  gleich('… keine Stufe ist mehr markiert', await s.evaluate(`document.querySelectorAll('.blatt-werk .blatt-strich.on').length`), 0);
  gleich('… und die Zahl daneben sagt es', await s.evaluate(`document.querySelector('.blatt-werk .blatt-staerke output').textContent`), '7,5');
  await zug(s, [100, 300], [300, 320]);
  const marken = JSON.parse(await s.evaluate(MARKEN) as string) as any[];
  gleich('Der nächste Strich hat genau diese Stärke', marken[0]?.breite, 7.5);
  await s.click('.blatt-werk .blatt-strich[data-b="5"]');
  gleich('Eine Stufe stellt den Regler nach', await s.evaluate(`document.querySelector('.blatt-werk .blatt-staerke input').value`), '5');
  await s.evaluate(`document.querySelector('.blatt-werk .blatt-staerke input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  gleich('Escape schliesst die Klappe', await s.evaluate(`getComputedStyle(document.querySelector('.blatt-werk .blatt-staerke')).display`), 'none');
  await s.click('.blatt-werk .blatt-strich.on');
  await s.click('.blatt-werk [data-wz="marker"]');
  gleich('Ein anderes Werkzeug schliesst sie auch', await s.evaluate(`document.querySelectorAll('.blatt-werk .blatt-staerke.auf').length`), 0);
  await s.close();
}

/* ═══ §4 Die Tasten ════════════════════════════════════════════════════════ */
console.log('\n§4 Die Tasten wie GoodNotes');
{
  const s = await mitBlatt();
  await s.click('.blatt-werk [data-wz="stift"]');
  const drueck = async (taste: string): Promise<string> => {
    await s.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
    await s.keyboard.press(taste);
    await s.waitForTimeout(120);
    return await s.evaluate(`Zeichenziel.jetzt()`) as string;
  };
  gleich('H — der Marker', await drueck('h'), 'marker');
  gleich('E — der Radierer', await drueck('e'), 'radierer');
  gleich('V — die Auswahl', await drueck('v'), 'select');
  gleich('T — der Text', await drueck('t'), 'text');
  gleich('A — das Abdeckband', await drueck('a'), 'abdeck');
  gleich('N — die Haftnotiz', await drueck('n'), 'zettel');
  gleich('M — das Fachzeichen', await drueck('m'), 'zeichen');
  gleich('S — die Form (die zuletzt gewählte: Linie)', await drueck('s'), 'line');
  gleich('P — der Stift', await drueck('p'), 'stift');
  await drueck('2');
  gleich('2 — der Bleistift: Stift mit Stil', await s.evaluate(`document.querySelector('.blatt-werk [data-act="stil"]').dataset.stil`), 'bleistift');
  gleich('… und der Stift führt', await s.evaluate(`Zeichenziel.jetzt()`), 'stift');
  await drueck('r');
  gleich('R — das Lineal liegt an', await s.evaluate(`document.querySelector('.blatt-werk [data-act="lineal"]').getAttribute('aria-pressed')`), 'true');
  /* Wer tippt, tippt — kein Buchstabe wechselt das Werkzeug. */
  await s.evaluate(`(() => { const i = document.createElement('input'); i.id = 'probe-feld'; document.body.append(i); i.focus(); })()`);
  await s.keyboard.press('h');
  await s.waitForTimeout(120);
  gleich('Im Eingabefeld bleibt H ein Buchstabe', await s.evaluate(`Zeichenziel.jetzt()`), 'stift');
  gleich('… und steht im Feld', await s.evaluate(`document.getElementById('probe-feld').value`), 'h');
  /* Die Übersicht sagt dasselbe wie der Griff. */
  const register = JSON.parse(await s.evaluate(`JSON.stringify(Register.tasten.alle().find(g => g[0] === 'Blatt und PDF') || null)`) as string);
  p('Die Übersicht hat die Gruppe „Blatt und PDF"', !!register);
  const imRegister = new Set((register?.[1] || []).map((k: string[]) => String(k[0]).toLowerCase()));
  const imGriff = Object.keys(await s.evaluate(`Marken.TASTEN`) as Record<string, string>);
  p('Jeder Buchstabe des Griffs steht in der Übersicht', imGriff.every(t => imRegister.has(t)), imGriff.filter(t => !imRegister.has(t)).join(', '));
  await s.close();
}

/* ═══ §5 Am Telefon ════════════════════════════════════════════════════════ */
console.log('\n§5 Am Telefon');
{
  const s = await mitBlatt(true);
  await s.evaluate(`document.querySelector('.blatt-werk [data-wz="stift"]').click()`);
  await s.waitForTimeout(300);
  await s.evaluate(`document.querySelector('.blatt-werk .blatt-strich.on').click()`);
  await s.waitForTimeout(200);
  const mass = JSON.parse(await s.evaluate(`(() => {
    const l = document.querySelector('.blatt-werk .blatt-staerke');
    const r = l.getBoundingClientRect();
    return JSON.stringify({ hoch: Math.round(r.height), da: r.width > 0, gruppeSichtbar: getComputedStyle(l).display !== 'none', lage: getComputedStyle(l).position });
  })()`) as string);
  /* AM TELEFON IN DER ZEILE, NICHT DARUNTER: die Zeile rollt (`overflow-x:auto`)
     und schnitte eine haengende Klappe ab. */
  p('Der Regler steht beim Stift auch am Telefon in der Zeile, 44 hoch (§37)', mass.da && mass.gruppeSichtbar && mass.hoch >= 44 && mass.lage === 'static', JSON.stringify(mass));
  await s.close();
}

console.log('\n§6 Eingebunden');
p('FORMEN kennt Dreieck und rundes Rechteck', /'triangle'/.test(lies('src/bereiche/pdf/marken.ts')) && /'roundrect'/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das erzeugte JS auch', /'triangle'/.test(lies('quell/bereiche/pdf/marken.js')));
p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
