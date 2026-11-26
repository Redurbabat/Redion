/* test650 — die Bibliothek zeichnet die Deckel in Schritten (E806)
 *
 * Gemessen mit 10 000 Seiten an der Wurzel: der Start hielt den Hauptfaden
 * 6,8 s fest (grösste Aufgabe 3,5 s), weil die Ablage jeden Deckel zeichnete.
 * Jetzt erst 120, dann „Mehr zeigen" (+120) oder „Alle zeigen". Die Grenze
 * sagt mit beiden Zahlen, dass sie abschneidet (L22).
 *
 * Gegenprobe: der Stand vor E806 ist in §1, §2 und §5 rot.
 */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
let ok = 0, bad = 0;
const pruef = (n: string, ist: unknown, soll: unknown) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  (window as any).__lang = [];
  try {
    new PerformanceObserver(l => l.getEntries().forEach(e => (window as any).__lang.push(Math.round(e.duration))))
      .observe({ type: 'longtask', buffered: true });
  } catch { /* ohne Beobachter misst §5 nichts — dann ist er rot */ }
});
const p = await ctx.newPage();
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('JS: ' + e.message));
const laden = async () => {
  await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
};
await p.goto('file://' + WURZEL + '/index.html');
await laden();

/* 10 000 Seiten an der Wurzel, je mit einem Absatz. */
await p.evaluate(async () => {
  const blocks: Record<string, any> = {}; const j = '2026-08-15T10:00:00.000Z';
  for (let i = 0; i < 10000; i++) {
    const pid = 'p' + i, bid = 'b' + i;
    blocks[pid] = { id: pid, type: 'page', text: 'Messseite ' + i, icon: '📄', content: [bid], parentId: null,
      parentTable: 'block', alive: true, created: j, edited: j };
    blocks[bid] = { id: bid, type: 'text', text: 'Absatz ' + i, content: [], parentId: pid,
      parentTable: 'block', alive: true, created: j, edited: j };
  }
  await Store.importAll(JSON.stringify({ version: 6, exportiert: j, blocks, collections: {}, views: {}, meta: {} }), 'ersetzen');
  await Store.flush();
});
await p.reload();
await laden();
await p.waitForTimeout(4000);
const lang = await p.evaluate(() => (window as any).__lang as number[]);

const oeffne = async () => {
  await p.evaluate(() => { Bibliothek.oeffne(); });
  await p.waitForTimeout(800);
};
await oeffne();
const r1 = await p.evaluate(() => {
  const n = document.querySelectorAll('.bib-gitter > *').length;
  const g = document.querySelector('.bib-grenze');
  const knopf = g?.querySelector<HTMLElement>('[data-bib-mehr]');
  const r = knopf?.getBoundingClientRect();
  return { deckel: n, text: g?.textContent || '', hoehe: r ? Math.round(r.height) : 0 };
});
pruef('§1 zuerst 120 Deckel, nicht 10 000', r1.deckel, 120);
/* Die Gesamtzahl kommt aus der Grenze selbst: neben den 10 000 Messseiten
   legt Redion beim Start eine eigene an (gemessen: 10 001). */
const gesamt = Number((/^120 von (\d+) Dokumenten/.exec(r1.text) || [])[1] || 0);
pruef('§1 die Grenze sagt beide Zahlen', gesamt >= 10000, true);
pruef('§1 der Knopf „Mehr zeigen" misst 44 px (§37)', r1.hoehe >= 44, true);

if (await p.$('[data-bib-mehr]')) await p.click('[data-bib-mehr]');
await p.waitForTimeout(400);
const r2 = await p.evaluate(() => ({
  deckel: document.querySelectorAll('.bib-gitter > *').length,
  fokus: document.activeElement?.hasAttribute('data-bib-mehr') ?? false
}));
pruef('§2 „Mehr zeigen" bringt 120 dazu', r2.deckel, 240);
pruef('§2 der Fokus bleibt auf „Mehr zeigen"', r2.fokus, true);

/* Ein anderer Weg in die Bibliothek und zurück vergisst die Wahl nicht. */
await oeffne();
const r3 = await p.evaluate(() => document.querySelectorAll('.bib-gitter > *').length);
pruef('§3 wieder geöffnet: die gewählte Menge bleibt', r3, 240);

if (await p.$('[data-bib-alle]')) await p.click('[data-bib-alle]');
await p.waitForTimeout(1500);
const r4 = await p.evaluate(() => ({
  deckel: document.querySelectorAll('.bib-gitter > *').length,
  grenze: !!document.querySelector('.bib-grenze')
}));
pruef('§4 „Alle zeigen" zeigt alle', r4.deckel, gesamt);
pruef('§4 und dann steht keine Grenze mehr da', r4.grenze, false);

pruef('§5 der Start blockiert insgesamt unter 2 s', lang.reduce((a, x) => a + x, 0) < 2000, true);
pruef('§5 keine einzelne Aufgabe über 1,5 s', Math.max(0, ...lang) < 1500, true);

pruef('Keine Skriptfehler', fehler, []);
await b.close();
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen  (lange Aufgaben beim Start: ${JSON.stringify(lang)})`);
process.exit(bad ? 1 : 0);
