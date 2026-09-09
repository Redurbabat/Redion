/* Suite 481 — Red-ur: die Chronik in Redion (E514)
 * ============================================================================
 * Redur, 9. September 2026:
 *
 *   „speicher das alles im problemw.md … dann will ich, dass du eine ur.md
 *    erstellst und dort alles speicherst als ein 2. Gehirn … es sollte auch
 *    im Redion sichtbar sein: wenn ich bei der Redion in der Suche 'Red-ur'
 *    schreibe, sollte dort direkt die Daten sich öffnen, aber mit
 *    Zugangscode 733877, und dort solltest du die Graphen verwenden,
 *    3D-Ansichten und so."
 *
 *   §1 EINE QUELLE, DREI ANSICHTEN. `chronik/chronik.json` hält die Daten;
 *      UR.md, PROBLEME.md und die App lesen dieselbe. Wer eine von Hand
 *      ändert, wird beim nächsten Lauf überschrieben — und `chronik.mts
 *      --pruefen` sagt es vorher.
 *   §2 „Red-ur" ÖFFNET DIE TÜR — und nur „Red-ur". Ein Treffer, der bei
 *      jedem „red" aufspringt, wäre eine Überraschung statt einer Tür.
 *   §3 DER CODE STEHT DAVOR. Ohne ihn kein Fenster.
 *   §4 GRAPHEN UND DER STAPEL DER TAGE — mit Zahlen an den Balken, weil
 *      eine Höhe allein nur Augen haben (§38).
 *   §5 DIE VIER ANSICHTEN zeigen, was in der Quelle steht — gezählt, nicht
 *      geglaubt.
 *   §6 KEIN CODE IN UR.md. Das war Redurs Grenze.
 *   §7 QUELLEN.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → eine Zeile in UR.md ändern: `chronik.mts --pruefen` wird rot.
 *   §2 → `trifft` auf `includes` umstellen: „red" öffnet die Tür.
 *   §4 → die Zahl am Balken weglassen: §4 wird rot.
 *
 *   node pruefungen/lauf/test481.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9601;
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

const frisch = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Chronik !== 'undefined'");
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
  });
  return s;
};

/* ═══ §1 Eine Quelle, drei Ansichten ═══════════════════════════════════════ */
console.log('\n§1 Eine Quelle, drei Ansichten');
{
  p('Die Quelle gibt es', fs.existsSync(path.join(WURZEL, 'chronik/chronik.json')));
  p('UR.md und PROBLEME.md auch',
    fs.existsSync(path.join(WURZEL, 'UR.md')) && fs.existsSync(path.join(WURZEL, 'PROBLEME.md')));
  /* DAS IST DIE EIGENTLICHE ZUSAGE: die erzeugten Dateien passen zur
     Quelle. Sonst stünde in UR.md etwas anderes als in der App. */
  let aktuell = true;
  try { execFileSync('node', [path.join(WURZEL, 'chronik.mts'), '--pruefen'], { cwd: WURZEL }); }
  catch { aktuell = false; }
  p('Die erzeugten Dateien passen zur Quelle', aktuell,
    'node chronik.mts läuft lassen');
  p('Beide sagen, dass sie erzeugt sind',
    /ERZEUGT — NICHT VON HAND ÄNDERN/.test(lies('UR.md'))
    && /ERZEUGT — NICHT VON HAND ÄNDERN/.test(lies('PROBLEME.md')));
}

/* ═══ §2 „Red-ur" öffnet die Tür — und nur das ════════════════════════════ */
console.log('\n§2 Der Suchbegriff');
{
  const s = await frisch();
  const t = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    exakt: Chronik.trifft('Red-ur'), klein: Chronik.trifft('redur'),
    luecke: Chronik.trifft('red ur'), unterstrich: Chronik.trifft('Red_ur'),
    kurz: Chronik.trifft('red'), lang: Chronik.trifft('redurbabat'),
    leer: Chronik.trifft(''), fremd: Chronik.trifft('Rechnung')
  }))()`) as string);
  p('„Red-ur" trifft', t.exakt && t.klein && t.luecke && t.unterstrich, JSON.stringify(t));
  p('… und sonst nichts', !t.kurz && !t.lang && !t.leer && !t.fremd, JSON.stringify(t));

  await s.evaluate(`App.suche()`);
  await s.waitForTimeout(300);
  await s.evaluate(`(() => { const i = document.querySelector('.overlay #q');
    i.value = 'Red-ur'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await s.waitForTimeout(400);
  p('Die Suche zeigt die Tür', await s.evaluate(`!!document.querySelector('[data-chr-tuer]')`));
  await s.evaluate(`(() => { const i = document.querySelector('.overlay #q');
    i.value = 'Willkommen'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await s.waitForTimeout(400);
  p('Bei einem gewöhnlichen Wort steht sie nicht da',
    await s.evaluate(`!document.querySelector('[data-chr-tuer]')`));
  await s.close();
}

/* ═══ §3 Der Code steht davor ══════════════════════════════════════════════ */
console.log('\n§3 Der Zugangscode');
{
  const s = await frisch();
  /* Ohne Code darf kein Fenster da sein — auch nicht nach dem Klick auf
     die Tür. `oeffnen` wartet auf die Frage; hier wird nur nachgesehen,
     dass NICHTS aufgeht, solange nichts eingegeben ist. */
  await s.evaluate(`void Chronik.oeffnen()`);
  await s.waitForTimeout(500);
  p('Ohne Code kein Fenster', await s.evaluate(`!document.querySelector('.chr-fenster')`));
  p('… aber eine Frage', await s.evaluate(
    `!!document.querySelector('.overlay input') || !!document.querySelector('[role="dialog"]')`));
  p('Der Code ist sechs Zeichen lang', await s.evaluate(`Chronik.CODE_LAENGE`) === 6);
  /* UND DAS STEHT AUCH SO IM QUELLTEXT: ein Türschild, kein Schloss. */
  p('Der Quelltext sagt selbst, dass es kein Schloss ist',
    /TÜRSCHILD, KEIN SCHLOSS/.test(lies('src/bereiche/chronik/chronik.ts')));
  await s.close();
}

/* ═══ §4 Graphen und der Stapel ════════════════════════════════════════════ */
console.log('\n§4 Graphen und der Stapel der Tage');
{
  const s = await frisch();
  await s.evaluate(`Chronik.zeigen()`);
  await s.waitForTimeout(400);
  const r = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    graphen: document.querySelectorAll('.chr-graph').length,
    balken: document.querySelectorAll('.chr-balken').length,
    werte: document.querySelectorAll('.chr-wert').length,
    namen: document.querySelectorAll('.chr-name').length,
    platten: document.querySelectorAll('.chr-platte').length,
    tage: (window.ChronikDaten || {}).tage.length,
    /* Jeder Graph sagt einem Vorleser, was er zeigt (§38). */
    ohneNamen: [...document.querySelectorAll('.chr-graph svg')]
      .filter(x => !x.getAttribute('aria-label')).length
  }))()`) as string);
  p('Vier Graphen', r.graphen === 4, JSON.stringify(r));
  p('Jeder Balken trägt seine Zahl und seinen Namen',
    r.balken > 0 && r.werte === r.balken && r.namen === r.balken, JSON.stringify(r));
  p('… und jeder Graph sagt einem Vorleser, was er zeigt', r.ohneNamen === 0, JSON.stringify(r));
  p('Der Stapel hat eine Platte je Tag', r.platten === r.tage && r.tage > 0, JSON.stringify(r));
  /* DIE TIEFE IST ECHT: die Platten liegen hintereinander, nicht
     übereinander. Gemessen an ihrer Lage auf dem Glas. */
  const tiefe = JSON.parse(await s.evaluate(`(() => {
    const pl = [...document.querySelectorAll('.chr-platte')].map(x => {
      const r = x.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), b: Math.round(r.width) };
    });
    return JSON.stringify(pl);
  })()`) as string) as Array<{ x: number; y: number; b: number }>;
  p('Die Platten liegen versetzt — die Tiefe ist zu sehen',
    tiefe.length > 1 && tiefe.every((q, i) => i === 0
      || (q.y > (tiefe[i - 1] as any).y && q.x !== (tiefe[i - 1] as any).x)),
    JSON.stringify(tiefe));
  p('… und die hintere ist kleiner als die vordere — echte Perspektive',
    tiefe.length > 1 && (tiefe[tiefe.length - 1] as any).b < (tiefe[0] as any).b,
    JSON.stringify(tiefe.map(q => q.b)));
  await s.close();
}

/* ═══ §5 Die vier Ansichten ════════════════════════════════════════════════ */
console.log('\n§5 Die vier Ansichten zeigen, was in der Quelle steht');
{
  const s = await frisch();
  await s.evaluate(`Chronik.zeigen()`);
  await s.waitForTimeout(300);
  gleich('Vier Reiter', await s.evaluate(
    `[...document.querySelectorAll('[data-chr-ansicht]')].map(b => b.dataset.chrAnsicht)`),
    ['uebersicht', 'tage', 'probleme', 'wissen']);
  await s.evaluate(`document.querySelector('[data-chr-ansicht="probleme"]').click()`);
  await s.waitForTimeout(250);
  const zahlP = JSON.parse(await s.evaluate(`JSON.stringify({
    gezeigt: document.querySelectorAll('.chr-problem').length,
    inDerQuelle: (window.ChronikDaten || {}).probleme.length })`) as string);
  p('Jedes Problem der Quelle steht da', zahlP.gezeigt === zahlP.inDerQuelle && zahlP.gezeigt > 0,
    JSON.stringify(zahlP));
  await s.evaluate(`document.querySelector('[data-chr-ansicht="tage"]').click()`);
  await s.waitForTimeout(250);
  const zahlT = JSON.parse(await s.evaluate(`JSON.stringify({
    tage: document.querySelectorAll('.chr-tag').length,
    inDerQuelle: (window.ChronikDaten || {}).tage.length,
    nachrichten: document.querySelectorAll('.chr-nachricht').length,
    quellNachrichten: (window.ChronikDaten || {}).tage
      .reduce((n, t) => n + (t.nachrichten || []).length, 0),
    /* JEDE NACHRICHT 1:1 — das war Redurs Wort. Wenn hier gekürzt würde,
       stünde im Anriss etwas anderes als im Zitat. */
    wortlaute: [...document.querySelectorAll('.chr-wort')].length })`) as string);
  p('Jeder Tag steht da', zahlT.tage === zahlT.inDerQuelle, JSON.stringify(zahlT));
  p('Jede Nachricht steht da — und jede mit ihrem Wortlaut',
    zahlT.nachrichten === zahlT.quellNachrichten && zahlT.wortlaute === zahlT.nachrichten,
    JSON.stringify(zahlT));
  /* UND SIE IST WIRKLICH 1:1. Verglichen wird gegen die Quelle, nicht
     gegen eine Abschrift. */
  const wortlaut = await s.evaluate(`(() => {
    const q = (window.ChronikDaten || {}).tage.flatMap(t => t.nachrichten || []);
    const d = [...document.querySelectorAll('.chr-wort')].map(x => x.textContent);
    return q.length === d.length && q.every((m, i) => m.wortlaut === d[i]);
  })()`);
  p('Der gezeigte Wortlaut ist Zeichen für Zeichen der der Quelle', wortlaut);
  await s.evaluate(`document.querySelector('[data-chr-ansicht="wissen"]').click()`);
  await s.waitForTimeout(250);
  p('Die Arbeitsweise steht mit ihren Grundsätzen da',
    Number(await s.evaluate(`document.querySelectorAll('.chr-tag h4').length`)) >= 7);
  await s.close();
}

/* ═══ §6 Kein Code in UR.md ════════════════════════════════════════════════ */
console.log('\n§6 Kein Quelltext in der Chronik');
{
  const ur = lies('UR.md');
  /* Redurs Grenze war ausdrücklich: „alles, wirklich alles, ausser Code
     kommt nicht dort hin". Gemessen an dem, was ein Codeblock ist. */
  p('UR.md enthält keinen Codeblock', !/^```/m.test(ur));
  p('… und keine Quelltextzeile mit Semikolon-Ende',
    !/^\s{4,}\S.*;\s*$/m.test(ur));
  p('PROBLEME.md ebenso', !/^```/m.test(lies('PROBLEME.md')));
}

/* ═══ §7 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§7 Quellen');
p('Der Erzeuger steht im Verzeichnis', fs.existsSync(path.join(WURZEL, 'chronik.mts')));
p('Die Chronik ist ein eigener Bereich',
  fs.existsSync(path.join(WURZEL, 'src/bereiche/chronik/chronik.ts')));
p('Die Daten sind erzeugt und sagen es',
  /ERZEUGT — NICHT VON HAND ÄNDERN/.test(lies('src/bereiche/chronik/daten.ts')));
p('index.html lädt beides, die Daten zuerst',
  lies('index.html').indexOf('chronik/daten.js') < lies('index.html').indexOf('chronik/chronik.js')
  && lies('index.html').includes('chronik/chronik.js'));
p('Der Dienst kennt beide Dateien',
  /chronik\/daten\.js/.test(lies('src/dienst/sw.ts'))
  && /chronik\/chronik\.js/.test(lies('src/dienst/sw.ts')));
p('Die Suche geht über EINE Tür (§8)',
  /Chronik\.trifft\(roh\)/.test(lies('src/schale/aufbau/schale.ts'))
  && /Chronik\.oeffnen\(\)/.test(lies('src/schale/aufbau/schale.ts')));
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
