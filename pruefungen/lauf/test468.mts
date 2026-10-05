/* Suite 468 — Ein mehrseitiges Blatt in Seiten zerlegen (E499)
 * ============================================================================
 * L133, letzte offene Zeile unter „Seiten":
 *
 *   „Mehrseitige Notizhefte als EIN Block — ein `blatt` wächst in die Höhe
 *    (E118); Seitengriffe gelten ihm als Ganzem. Ein Heft mit drei
 *    Blattseiten lässt sich nicht seitenweise drehen oder löschen."
 *
 * In GoodNotes ist jede Seite eine Seite. Redions mehrseitiges Blatt ist
 * eine eigene Form und nicht falsch — nur die Seitengriffe können mit ihr
 * nichts anfangen. Der Griff bringt sie in GoodNotes-Form.
 *
 *   §1 DER GRIFF RUHT, wo es nichts zu zerlegen gibt — und sagt warum.
 *   §2 DREI SEITEN WERDEN DREI BLÄTTER, jedes A4, in der richtigen Reihe.
 *   §3 JEDE MARKE LANDET AUF IHRER SEITE, ganz und mit verschobener Höhe;
 *      KEINE geht verloren.
 *   §4 EINE MARKE ÜBER DER GRENZE wird GEZÄHLT und GESAGT, bevor etwas
 *      geschieht — und bleibt danach ganz.
 *   §5 ABBRECHEN ÄNDERT NICHTS.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Drei Gegenproben, alle gelaufen, alle rot gesehen:
 *   §1 → den Ruhezweig im Inspector abschalten: der Griff steht auch bei
 *        einem einseitigen Blatt offen da. Rot in zwei Zusagen.
 *   §3 → das `InkGeometry.move(kopie, 0, -nr * A4)` weglassen: die Marken
 *        der zweiten Seite liegen bei 942 statt bei 100 — also weit
 *        unterhalb ihres Papiers und damit unsichtbar. Rot in drei.
 *   §4 → die Zählung der Grenzgänger weglassen: der Dialog sagt „keine
 *        Marke läuft über eine Seitengrenze", obwohl eine es tut. Rot in
 *        drei.
 *
 *   node pruefungen/lauf/test468.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9588;
const A4 = 841.89;
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

/**
 * Ein Dokument mit EINEM Blatt von drei A4-Seiten und je einer Marke
 * darauf; optional eine vierte, die über die Grenze läuft.
 */
const dreiseitig = async (grenzgaenger = false): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async ({ a4, grenze }: { a4: number; grenze: boolean }) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Notizheft', icon: '📗' });
    const marken: any[] = [
      { id: 'auf-1', art: 'stift', farbe: '#111111', breite: 3, pts: [[60, 100], [300, 140]] },
      { id: 'auf-2', art: 'stift', farbe: '#d64545', breite: 3,
        pts: [[60, a4 + 100], [300, a4 + 140]] },
      { id: 'auf-3', art: 'stift', farbe: '#3aa757', breite: 3,
        pts: [[60, a4 * 2 + 100], [300, a4 * 2 + 140]] }
    ];
    if (grenze) marken.push({ id: 'ueber', art: 'stift', farbe: '#2f7ed8', breite: 3,
      pts: [[400, a4 - 60], [400, a4 + 60]] });
    const blatt = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'kariert',
      blattBreite: 595.28, blattHoehe: a4 * 3, raumVersion: 1, marken });
    Store.addBlock(blatt.id, 'text', { text: 'Mitschrift' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
  }, { a4: A4, grenze: grenzgaenger });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1100);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  return s;
};

/** Was aus dem Speicher geworden ist. */
const stand = (s: Page) => s.evaluate(`(() => {
  const seite = Store.getBlock(App.aktuelleSeite());
  const liste = DocumentMode.documentsIn(seite);
  return JSON.stringify({
    anzahl: liste.length,
    hoehen: liste.map(b => Math.round(Number(b.blattHoehe) || 0)),
    papier: liste.map(b => b.papier),
    marken: liste.map(b => (b.marken || []).map(m => m.id)),
    ys: liste.map(b => (b.marken || []).map(m => Math.round(m.pts[0][1]))),
    kinder: liste.map(b => Store.childrenOf(b.id).length)
  });
})()`).then(x => JSON.parse(x as string));

/* ═══ §1 Der Griff ruht, wo es nichts zu zerlegen gibt ═════════════════════ */
console.log('\n§1 Der Griff ruht, wo nichts zu zerlegen ist');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async (a4: number) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    const seite = Store.addPage(null, { text: 'Einseitig', icon: '📄' });
    const blatt = Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28,
      blattHoehe: a4, raumVersion: 1, marken: [] });
    Store.addBlock(blatt.id, 'text', { text: '' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
  }, A4);
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1100);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  const r = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('[data-document-action="page-split"]');
    return JSON.stringify({ da: !!k, aus: k ? k.disabled : null,
      aria: k ? k.getAttribute('aria-disabled') : null, titel: k ? k.title : '' });
  })()`) as string);
  p('Der Knopf steht da', r.da);
  gleich('… ruht aber', [r.aus, r.aria], [true, 'true']);
  p('… und sagt warum', /schon eine einzelne Seite/.test(String(r.titel)), String(r.titel));
  await s.close();
}
{
  const s = await dreiseitig();
  const r = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('[data-document-action="page-split"]');
    return JSON.stringify({ aus: k ? k.disabled : null, titel: k ? k.title : '' });
  })()`) as string);
  gleich('Beim dreiseitigen Blatt ist er offen', r.aus, false);
  p('… und sein Hinweis nennt den Gewinn',
    /je Seite/.test(String(r.titel)), String(r.titel));
  await s.close();
}

/* ═══ §2 und §3 Zerlegen ═══════════════════════════════════════════════════ */
console.log('\n§2 Drei Seiten werden drei Blätter — §3 mit ihren Marken');
{
  const s = await dreiseitig();
  const davor = await stand(s);
  gleich('Vorher: EIN Blatt, drei A4 hoch, drei Marken',
    [davor.anzahl, davor.hoehen[0], davor.marken[0]],
    [1, Math.round(A4 * 3), ['auf-1', 'auf-2', 'auf-3']]);
  await s.click('[data-document-action="page-split"]');
  await s.waitForSelector('.overlay [data-w="ja"]', { timeout: 5000 });
  const frage = String(await s.evaluate(`document.querySelector('.overlay :is(.finder, .ui-touch-dialog, .ui-touch-action-sheet)').textContent`));
  p('Die Frage sagt, was geschieht', /drei Seiten|3 Seiten/.test(frage), frage.slice(0, 120));
  p('… und dass keine Marke über eine Grenze läuft',
    /Keine Marke läuft/.test(frage), frage.slice(0, 200));
  await s.click('.overlay [data-w="ja"]');
  await s.waitForTimeout(900);
  const danach = await stand(s);
  gleich('Aus einem Blatt sind drei geworden', danach.anzahl, 3);
  gleich('Jedes ist genau A4 hoch', danach.hoehen, [Math.round(A4), Math.round(A4), Math.round(A4)]);
  gleich('Jedes hat das Papier des Originals', danach.papier, ['kariert', 'kariert', 'kariert']);
  gleich('Jede Marke steht auf IHRER Seite', danach.marken, [['auf-1'], ['auf-2'], ['auf-3']]);
  /* DIE HÖHE IST MITGEWANDERT: die Marke der zweiten Seite lag im
     Gesamtblatt bei A4+100 und liegt jetzt bei 100. */
  gleich('Und ihre Höhe ist mitgewandert', danach.ys, [[100], [100], [100]]);
  p('Keine Marke ist verloren gegangen',
    danach.marken.flat().length === davor.marken[0].length,
    JSON.stringify(danach.marken));
  p('Jedes neue Blatt hat eine Zeile zum Schreiben (E118)',
    danach.kinder[1] >= 1 && danach.kinder[2] >= 1, JSON.stringify(danach.kinder));
  await s.close();
}

/* ═══ §4 Die Marke über der Grenze ═════════════════════════════════════════ */
console.log('\n§4 Eine Marke über der Grenze wird gezählt und gesagt');
{
  const s = await dreiseitig(true);
  await s.click('[data-document-action="page-split"]');
  await s.waitForSelector('.overlay [data-w="ja"]', { timeout: 5000 });
  const frage = String(await s.evaluate(`document.querySelector('.overlay :is(.finder, .ui-touch-dialog, .ui-touch-action-sheet)').textContent`));
  p('Die Frage nennt die Zahl', /1 Marke läuft/.test(frage), frage.slice(0, 260));
  p('… und sagt, was mit ihr geschieht',
    /ragen dort über den Rand|ragt|Überstand/.test(frage), frage.slice(0, 300));
  p('… und dass sie nicht verloren ist', /verloren ist er nicht/.test(frage));
  await s.click('.overlay [data-w="ja"]');
  await s.waitForTimeout(900);
  const danach = await stand(s);
  gleich('Vier Marken, keine weg', danach.marken.flat().length, 4);
  /* Ihre Mitte lag in der ersten Seite (A4−60 bis A4+60, Mitte = A4) —
     Math.floor(A4 / A4) = 1, also die ZWEITE Seite. */
  p('Sie liegt auf der Seite, in der ihre Mitte lag',
    danach.marken[1].includes('ueber'), JSON.stringify(danach.marken));
  const ganz = JSON.parse(await s.evaluate(`(() => {
    const seite = Store.getBlock(App.aktuelleSeite());
    const liste = DocumentMode.documentsIn(seite);
    const m = liste.flatMap(b => b.marken || []).find(x => x.id === 'ueber');
    return JSON.stringify({ punkte: m ? m.pts.length : 0, oben: m ? Math.round(m.pts[0][1]) : null,
      unten: m ? Math.round(m.pts[m.pts.length - 1][1]) : null });
  })()`) as string);
  gleich('Sie ist ganz geblieben — beide Punkte da', ganz.punkte, 2);
  p('… und ragt über den Rand hinaus, statt geschnitten zu sein',
    ganz.oben < 0, JSON.stringify(ganz));
  await s.close();
}

/* ═══ §5 Abbrechen ═════════════════════════════════════════════════════════ */
console.log('\n§5 Abbrechen ändert nichts');
{
  const s = await dreiseitig();
  const davor = await stand(s);
  await s.click('[data-document-action="page-split"]');
  await s.waitForSelector('.overlay [data-w="nein"]', { timeout: 5000 });
  await s.click('.overlay [data-w="nein"]');
  await s.waitForTimeout(700);
  const danach = await stand(s);
  gleich('Alles ist, wie es war', [danach.anzahl, danach.hoehen, danach.marken],
    [davor.anzahl, davor.hoehen, davor.marken]);
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const q = lies('src/bereiche/pdf/document-mode.ts');
  p('Das Zerlegen steht an EINER Stelle', (q.match(/const seiteZerlegen = /g) || []).length === 1);
  /* ERST DIE NEUEN, DANN DAS ORIGINAL KÜRZEN — dieselbe Reihenfolge wie
     E496 und E498, und aus demselben Grund. */
  const block = q.slice(q.indexOf('const seiteZerlegen = '));
  const neue = block.indexOf("Store.addBlock(stelle.eltern.id, 'blatt'");
  const kuerzen = block.indexOf('Store.updateBlock(block.id, { blattHoehe: A4');
  p('Erst die neuen Blätter, dann das Original kürzen',
    neue > 0 && kuerzen > neue, `${neue} / ${kuerzen}`);
  p('Keine Marke wird geschnitten — sie wird nur verschoben',
    /InkGeometry\.move\(kopie, 0, -nr \* A4\)/.test(q) && !/splitByCircle[\s\S]{0,200}zerlegen/.test(q));
  p('Der Überstand wird gesagt, nicht verschwiegen (§35)',
    /verloren ist er nicht/.test(q));
  p('Das erzeugte JS trägt es', /page-split/.test(lies('quell/bereiche/pdf/document-mode.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
