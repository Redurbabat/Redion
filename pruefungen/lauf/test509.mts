/* Suite 509 — Der gelbe Deckel deckt auf, statt weiterzuschalten
 * ============================================================================
 * Redur, wörtlich: „wenn ich die gelbe antworten klicke geht es weiter und
 * zeigt mir nicht die antwort".
 *
 * Sein Satz stimmt aufs Wort, und die Ursache ist nicht der Deckel, sondern
 * der KNOPF. Es gibt nämlich ZWEI Vorträge, und sie heissen beide
 * „Präsentieren":
 *
 *   · `Werkzeuge.praesentation` — der FOLIENvortrag (E266, E544). Ein Tipp
 *     auf eine Abdeckung deckt sie auf, der Schrittzähler zählt mit.
 *     Gemessen: Treffer am Deckel, danach `data-auf="1"`, Füllung 0, und die
 *     Folie bleibt 1/2. RICHTIG.
 *
 *   · `zeigenAn` — der DOKUMENTvortrag (E493) mit Laserpointer, gebaut für
 *     ein PDF an der Wand. Er legt `.document-zeigen-flaeche` über alles
 *     (`inset:0`, `z-index:40`) — und die schluckt jeden Zeiger. Gemessen:
 *     an der Stelle des Deckels liegt `DIV.document-zeigen-flaeche`, nicht
 *     das `rect`; ein Tipp rechts davon schaltet von „Folie 1/2" auf
 *     „Folie 2/2", und der Deckel bleibt zu.
 *
 * Das Band startete längst den ersten (`pv-zeigen`), der Knopf in der
 * Dokumentleiste IMMER den zweiten — auch bei einem Foliensatz. Zwei Knöpfe
 * mit demselben Namen, zwei verschiedene Sachen: genau der Fehler, den ein
 * Nutzer nicht auseinanderhalten KANN. Er hat den genommen, der dasteht.
 *
 * Der Laserpointer bleibt, wo er hingehört: beim PDF und beim Heft. §4 misst
 * das — ohne diesen Abschnitt wäre die Reparatur eine weggenommene Funktion.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle drei gefahren, die Zahlen sind GEMESSEN:
 *   G1 → die Weiche wieder herausnehmen (immer `zeigenAn`):   2 rot, dann Abbruch — ohne Folienvortrag gibt es keinen Deckel zu klicken
 *   G2 → die Weiche auf JEDES Dokument gehen lassen:          17 grün,  4 rot  (auch das Notizheft bekam den Folienvortrag)
 *   G3 → im Folienvortrag den Deckel-Zweig ausschalten:       18 grün,  3 rot  („ist ‚2 / 2‘, soll ‚1 / 2‘“ — Redurs Satz, wörtlich)
 *   G4 → den Zierstrich wieder als Abdeckmarke bauen:         14 grün,  7 rot  (SIEBEN Zierdeckel in acht Layouts)
 *
 *   node pruefungen/lauf/test509.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;
declare const Folienvorlagen: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9619;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1440, height: 852 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(230);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}

/* Ein Foliensatz mit einem gelben Deckel auf der ERSTEN Folie, und ein
   Notizheft als Gegenprobe. */
const ids = await seite.evaluate(() => {
  const deck = Folienvorlagen.neuePraesentation('titelInhalt');
  Folienvorlagen.neueFolie(deck.id, 'zweiInhalte');
  const blaetter = (Store.childrenOf(deck.id) || []).filter((b: any) => b.type === 'blatt');
  const marken = (Array.isArray(blaetter[0].marken) ? blaetter[0].marken : []).slice();
  /* Gross genug, um ihn sicher zu treffen — ein 7-px-Streifen wäre eine
     Messung des Zufalls. */
  marken.push({ id: 'deckel-1', art: 'abdeck', farbe: '#ffcc00',
                pts: [[100, 260], [640, 420]] });
  Store.updateBlock(blaetter[0].id, { marken });
  const heft = Store.addPage(null, { text: 'Notizheft', icon: '📓' });
  Store.addBlock(heft.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.addBlock(heft.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.updateBlock(heft.id, { dokumentModus: true });
  return { deck: deck.id, heft: heft.id };
});
const oeffne = async (id: string) => {
  await seite.evaluate((x: string) => App.oeffne(x), id);
  await seite.waitForTimeout(1700);
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen').forEach(o => o.remove());
  });
};
/** Den Knopf drücken, den Redur gedrückt hat: „▶ Präsentieren" in der Leiste. */
const vortragStarten = async () => {
  await seite.evaluate(() => {
    const k = document.querySelector<HTMLElement>(
      '.document-topbar [data-document-action="praesentieren"]');
    if (k) { k.click(); return; }
    /* Am schmalen Fenster steht er in der Ansichtsklappe (E493). */
    document.querySelector<HTMLElement>('[data-document-action="view"]')?.click();
    document.querySelector<HTMLElement>(
      '.document-commandbar [data-document-action="praesentieren"]')?.click();
  });
  await seite.waitForTimeout(1400);
};
const raus = async () => {
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(600);
  await seite.evaluate(() => {
    document.querySelector<HTMLElement>('[data-document-action="praesentieren-aus"]')?.click();
    document.querySelectorAll<HTMLElement>('.praesi').forEach(o => o.remove());
  });
  await seite.waitForTimeout(400);
};

/* ══ §1 IM FOLIENSATZ STARTET DER KNOPF DEN FOLIENVORTRAG ════════════════ */
console.log('\n§1 „▶ Präsentieren" öffnet bei Folien den Folienvortrag');
await oeffne(ids.deck);
await vortragStarten();
{
  const m = await seite.evaluate(() => ({
    praesi: !!document.querySelector('.praesi'),
    dokZeigen: document.querySelector('.document-workspace')
      ?.getAttribute('data-document-zeigen') || '—',
    /* DER SCHLUCKSCHIRM. Genau er hat Redurs Klick gefressen. */
    schluckflaeche: !!document.querySelector('.document-zeigen-flaeche'),
    deckel: document.querySelectorAll('.praesi [data-ink-art="abdeck"]').length,
    stand: (document.querySelector('.praesi-leiste span')?.textContent || '').trim(),
  }));
  p('Der Folienvortrag ist offen', m.praesi);
  p('… und der Dokumentvortrag NICHT', m.dokZeigen !== 'an', m.dokZeigen);
  p('… also liegt auch kein Schluckschirm über der Folie', !m.schluckflaeche);
  p('Der gelbe Deckel ist da', m.deckel >= 1, String(m.deckel));
  p('… und der Zähler zählt Folien', /1\s*\/\s*2/.test(m.stand), m.stand);
}

/* ══ §2 EIN KLICK AUF DEN DECKEL ZEIGT DIE ANTWORT ═══════════════════════ */
console.log('\n§2 Ein Klick auf den Deckel deckt auf — und schaltet NICHT weiter');
{
  const vor = await seite.evaluate(() => {
    const d = document.querySelector<SVGElement>('.praesi [data-ink-art="abdeck"]');
    if (!d) return null;
    const r = d.getBoundingClientRect();
    const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
    const el = document.elementFromPoint(x, y);
    return {
      x, y, breit: Math.round(r.width), hoch: Math.round(r.height),
      /* Was liegt WIRKLICH an der Stelle? Das ist die Frage, an der der
         Dokumentvortrag scheiterte. */
      anDerStelle: el ? el.tagName + ' [' + (el.getAttribute?.('data-ink-art') || '—') + ']' : 'nichts',
      trifftDenDeckel: !!el && el.closest?.('[data-ink-art="abdeck"]') === d,
      fuellung: getComputedStyle(d as any).fillOpacity,
      auf: d.getAttribute('data-auf'),
      stand: (document.querySelector('.praesi-leiste span')?.textContent || '').trim(),
    };
  }) as any;
  p('Der Deckel ist gross genug zum Treffen', vor && vor.breit > 40 && vor.hoch > 10,
    vor ? vor.breit + ' × ' + vor.hoch + ' px' : 'kein Deckel');
  p('An seiner Stelle liegt WIRKLICH er selbst', vor?.trifftDenDeckel,
    vor?.anDerStelle);
  p('… und er ist zugedeckt', Number(vor?.fuellung) > 0, String(vor?.fuellung));

  await seite.mouse.click(vor.x, vor.y);
  await seite.waitForTimeout(900);
  const nach = await seite.evaluate(() => {
    const d = document.querySelector<SVGElement>('.praesi [data-ink-art="abdeck"]');
    return {
      auf: d?.getAttribute('data-auf') ?? '(weg)',
      fuellung: d ? getComputedStyle(d as any).fillOpacity : '—',
      stand: (document.querySelector('.praesi-leiste span')?.textContent || '').trim(),
    };
  });
  gleich('Danach ist er aufgedeckt', nach.auf, '1');
  p('… und die Antwort ist zu sehen (Füllung 0)', Number(nach.fuellung) === 0,
    String(nach.fuellung));
  gleich('UND DIE FOLIE IST DIESELBE — Redurs Satz', nach.stand, vor.stand);
}

/* ══ §3 DANEBEN SCHALTET WEITER — SONST KÄME MAN NIE VORAN ═══════════════ */
console.log('\n§3 Ein Klick daneben blättert weiter');
{
  const vor = await seite.evaluate(() =>
    (document.querySelector('.praesi-leiste span')?.textContent || '').trim());
  /* Weit weg vom Deckel: unten rechts in der Folie, aber nicht auf der
     Leiste (die liegt unten mittig und ist Bedienung, keine Folie). */
  await seite.mouse.click(1300, 200);
  await seite.waitForTimeout(900);
  const nach = await seite.evaluate(() =>
    (document.querySelector('.praesi-leiste span')?.textContent || '').trim());
  p('Von 1 auf 2', /2\s*\/\s*2/.test(nach), vor + ' → ' + nach);
}
await raus();

/* ══ §4 BEIM HEFT BLEIBT DER LASERPOINTER ════════════════════════════════ */
console.log('\n§4 Ein Notizheft behält den Dokumentvortrag (E493) — nichts weggenommen');
{
  await oeffne(ids.heft);
  await vortragStarten();
  const m = await seite.evaluate(() => ({
    praesi: !!document.querySelector('.praesi'),
    dokZeigen: document.querySelector('.document-workspace')
      ?.getAttribute('data-document-zeigen') || '—',
    schluckflaeche: !!document.querySelector('.document-zeigen-flaeche'),
    rausKnopf: !!document.querySelector('.document-zeigen-raus'),
  }));
  gleich('Der Dokumentvortrag ist an', m.dokZeigen, 'an');
  p('… mit seiner Zeigefläche (das ist der Laserpointer)', m.schluckflaeche);
  p('… und einem Weg hinaus', m.rausKnopf);
  p('Der Folienvortrag ist NICHT gestartet', !m.praesi);
  await raus();
}

/* ══ §5 EIN ZIERSTRICH IST KEINE ANTWORT ═════════════════════════════════
 * DER ZWEITE FUND DIESES BOGENS, und er kam aus einer Zahl, die nicht passte:
 * ein Deckel, den die Zusage mit 540 × 160 Punkten angelegt hatte, wurde als
 * 207 × 7 px gezeichnet. Nachgemessen war es gar nicht ihrer — es war der
 * blaue Zierstrich unter der Überschrift des Layouts, und der stand als
 * ERSTER im Baum.
 *
 * `folien.ts` baute ihn als `art:'abdeck'` („als flache Abdeckmarke in
 * Akzentfarbe", E548). Das war mein Kurzschluss: eine Abdeckmarke ist
 * gefüllt, eine `rectangle` nicht — also nahm ich die gefüllte. Aber
 * `abdeck` heisst nicht „gefüllter Kasten", es heisst EINE ZUGEDECKTE
 * ANTWORT (E266): anklickbar, `cursor:pointer`, und beim Tipp verschwindet
 * die Füllung. Jede Folie trug also eine Antwort, die es nie gab — und ein
 * Klick darauf löschte den Strich.
 *
 * Eine `line` mit Strichstärke tut dasselbe fürs Auge und behauptet nichts.
 * ═══════════════════════════════════════════════════════════════════════ */
console.log('\n§5 Der Zierstrich eines Layouts ist eine Linie, keine Antwort');
{
  const m = await seite.evaluate(() => {
    const arten: Record<string, number> = {};
    let deckel = 0, linien = 0;
    /* ALLE acht Layouts, nicht nur das eine aus dem Aufbau oben — die
       Abkürzung „eines reicht schon" ist genau die, die den Fehler
       hereingelassen hat. */
    for (const l of (Folienvorlagen.alle() || [])) {
      const marken = Folienvorlagen.marken(l.id, 960, 540) || [];
      for (const mk of marken) {
        const a = String(mk.art);
        arten[a] = (arten[a] || 0) + 1;
        if (a === 'abdeck') deckel++;
        if (a === 'line') linien++;
      }
    }
    return { arten, deckel, linien, layouts: (Folienvorlagen.alle() || []).length };
  });
  p('Alle acht Layouts durchgesehen', m.layouts >= 8, String(m.layouts));
  p('… und sie tragen überhaupt Marken',
    Object.values(m.arten).reduce((a: number, b: any) => a + Number(b), 0) >= 8,
    JSON.stringify(m.arten));
  gleich('KEIN Layout trägt eine Abdeckmarke', m.deckel, 0);
  p('… aber es gibt Zierstriche, und die sind Linien', m.linien >= 1,
    String(m.linien) + ' Linien, Arten: ' + JSON.stringify(m.arten));
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 509: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
