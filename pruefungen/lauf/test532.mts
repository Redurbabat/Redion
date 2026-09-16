/* Suite 532 — Die Decke über der Folie: das Studio wird ruhig (E612, L121.5)
 * ============================================================================
 * Redur, 16. September 2026, mit einem Bild des Schreibstudios: „hier sieht es
 * sehr viel aus und haben nicht so viel Platz für Bearbeiten, und räume es auf
 * und will nicht so viel Sachen sehen aber trotzdem alles machen kann".
 *
 * GEMESSEN, NICHT GESCHÄTZT. Am laufenden Programm, 1440 × 852, Foliensatz
 * mit eingelesener Datei — von der Oberkante bis zur ersten Folie:
 *
 *     Reiterleiste (offene Dokumente)     48 px
 *     Dokument-Kopfzeile                  48 px
 *     Folienband (35 Reiter + 74 Fläche) 110 px
 *     Polster + Dateikarte + Hinweis      95 px
 *     ────────────────────────────────────────
 *                                        301 px
 *
 * Und davon liess sich nichts wegklicken. Das ist Schritt 3 und 5 aus
 * `doku/AUFTRAG-01-ruhiges-band.md` (L121).
 *
 * DIESER LAUF IST DIE DECKE, die L121 Punkt 5 seit dem 3. September fordert:
 * „damit die Leiste nicht in einem halben Jahr wieder zuwächst. Sie ist ja
 * nicht aus Absicht so geworden."
 *
 *   §1 DIE DECKE: im Ruhezustand ≤ 160 px über der Folie — und der Griff
 *      (die Reiterzeile) bleibt stehen, sonst wäre es Löschen statt Klappen.
 *   §2 ALLES BLEIBT ERREICHBAR: ein Klick holt die Fläche zurück, mit
 *      denselben Gruppen wie in der alten Fassung.
 *   §3 DER ZEICHNEN-FALL (E552): die Zeichenleiste wohnt IM Band. Ein
 *      Zustand „Reiter Zeichnen + zugeklappt" darf nicht entstehen, sonst
 *      steht jemand ohne Werkzeuge da (§47).
 *   §4 DIE DATEIKARTE IST NICHT GELÖSCHT, sondern im Details-Fenster.
 *   §5 DIE GEGENPROBE — ohne sie ist §1 wertlos: mit `data-ruhig="aus"`
 *      muss die alte Höhe zurückkommen. Eine Decke, die auch dann gilt,
 *      wenn gar nichts gebaut wurde, misst nichts.
 *   §6 Keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 * Vor dem Bauen war §1 rot mit 301 gegen 160, §4 und §5 ebenso. §6 war schon
 * vorher grün — genau deshalb steht er da: er ist die Gegenrichtung.
 *
 *   node pruefungen/lauf/test532.mts
 *   node pruefungen/alle.mts 532
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Folienvorlagen: any; declare const Ruhig: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9549;

/** Die Decke über der Folie.
 *
 *  GEMESSEN, nicht gewählt: 301 px vorher, 160 px nachher. Die Decke steht
 *  auf 175 und nicht auf 160 — eine Decke, die genau auf dem Messwert
 *  sitzt, wird beim ersten geänderten Rand rot, ohne dass etwas zugewachsen
 *  wäre. Fünfzehn Pixel Luft.
 *
 *  UND SIE IST TROTZDEM ENG GENUG: wer nur die Bandfläche wieder aufklappen
 *  lässt, steht bei 234; wer nur die Dateikarte zurückstellt, bei 237.
 *  Beide Eingriffe sind also einzeln gehütet, nicht nur zusammen. */
const DECKE = 175;

const TYPEN: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let rein = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  if (rein === '/') rein = '/index.html';
  const datei = path.join(WURZEL, rein);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); res.end('weg'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
  res.end(fs.readFileSync(datei));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1440, height: 852 } });
const seite: Page = await ktx.newPage();
seite.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
seite.on('dialog', d => d.dismiss().catch(() => {}));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(230);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}

/* Ein Foliensatz MIT eingelesener Datei — erst dann gibt es die Dateikarte.
   `originalKnopf` verlangt einen `file`-Block mit `dateiId` und `original`
   (abgelesen in document-mode.ts:1143–1147, nicht geraten). */
const deck = await seite.evaluate(() => {
  const d = Folienvorlagen.neuePraesentation('titelInhalt');
  Folienvorlagen.neueFolie(d.id, 'zweiInhalte');
  Store.addBlock(d.id, 'file',
    { dateiId: 'probe-1', text: 'Band 1 Kapitel 4.ppsx', original: true });
  return d.id;
});
const oeffne = async (): Promise<void> => {
  await seite.evaluate((x: string) => App.oeffne(x), deck);
  await seite.waitForTimeout(1700);
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen').forEach(o => o.remove());
  });
};
const ruhigSetzen = async (wert: string): Promise<void> => {
  await seite.evaluate((w: string) => {
    if (typeof Ruhig !== 'undefined' && Ruhig.setzen) Ruhig.setzen(w !== 'aus');
    document.body.dataset['ruhig'] = w;
  }, wert);
  await oeffne();
  /* AUF EINEN BEFEHLS-REITER STELLEN. Der Reiter wird je Seite gemerkt
     (`folienbandReiter:<id>`), und nach §3 stünde sonst „Zeichnen" —
     dort ist die Fläche zu Recht 0, und die Messung logäe um 16 px.
     Gefunden, weil §6 mit 285 statt 301 rot war. */
  await seite.evaluate(() => {
    /* NUR KLICKEN, WENN ER NICHT SCHON GEWÄHLT IST. Ein Klick auf den
       aktiven Reiter ist seit E612 der Klapp-Griff — der Helfer hätte
       sonst genau das aufgeklappt, was §1 zugeklappt messen will.
       Gefunden, weil §1 mit 224 px und „Fläche 74“ rot war. */
    const soll = document.querySelector<HTMLElement>('[data-fb-reiter="praesentation"]');
    if (soll && soll.getAttribute('aria-selected') !== 'true') soll.click();
  });
  await seite.waitForTimeout(400);
};

/** Alles, was dieser Lauf wissen will — in einer Messung. */
const lage = () => seite.evaluate(() => {
  const sicht = (e: Element | null): boolean => {
    if (!e) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
  };
  const alle = (w: string): Element[] => [...document.querySelectorAll(w)];
  const hoch = (w: string): number => {
    const e = document.querySelector(w);
    return e ? Math.round(e.getBoundingClientRect().height) : 0;
  };
  const rk = document.querySelector('#reiterleiste');
  const tb = document.querySelector('.document-topbar');
  const oben = rk ? rk.getBoundingClientRect().top
                  : (tb ? tb.getBoundingClientRect().top : 0);
  const buehne = document.querySelector('.document-stage');
  return {
    /* DIE ZAHL: von der Oberkante bis zur ersten Folie. */
    chrome: buehne ? Math.round(buehne.getBoundingClientRect().top - oben) : -1,
    stage: hoch('.document-stage'),
    reiterzeile: hoch('.folienband-reiter'),
    flaeche: hoch('.folienband-flaeche'),
    topbar: hoch('.document-topbar'),
    zeichenleiste: hoch('.document-drawingbar'),
    werkzeuge: alle('.document-drawingbar [data-document-tool]').filter(sicht).length,
    aktiv: document.querySelector('.folienband-reiter [aria-selected="true"]')
      ?.getAttribute('data-fb-reiter') || '—',
    klappDa: alle('.folienband-reiter [data-fb-klapp]').filter(sicht).length,
    klappWort: document.querySelector('[data-fb-klapp]')?.getAttribute('aria-label') || '',
    klappOffen: document.querySelector('[data-fb-klapp]')?.getAttribute('aria-expanded') || '',
    gruppen: alle('.folienband-flaeche .mb-gruppe-titel, .folienband-flaeche .kicker')
      .filter(sicht).map(e => (e.textContent || '').trim()).filter(Boolean),
    karteUeberBlatt: alle('.document-center > .document-source-master').filter(sicht).length,
    hinweisUeberBlatt: alle('.document-center > .document-copy-label').filter(sicht).length,
    karteImInspector: alle('.document-inspector .document-original, .document-inspector [data-document-original]')
      .filter(sicht).length,
    fenster: innerHeight
  };
});

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Die Decke über der Folie');
await ruhigSetzen('an');
const ruhig = await lage();
console.log(`     Chrome über der Folie: ${ruhig.chrome} px von ${ruhig.fenster} · ` +
            `Folie bekommt ${ruhig.stage} px`);
p(`Im Ruhezustand höchstens ${DECKE} px über der Folie`,
  ruhig.chrome > 0 && ruhig.chrome <= DECKE, `${ruhig.chrome} px`);
p('… die Bandfläche ist zugeklappt', ruhig.flaeche === 0, `${ruhig.flaeche} px`);
p('… ABER die Reiterzeile bleibt als Griff stehen', ruhig.reiterzeile > 0,
  `${ruhig.reiterzeile} px`);
p('… und die Kopfzeile auch — sie ist der Weg hinaus', ruhig.topbar > 0,
  `${ruhig.topbar} px`);
/* DAS ZEICHEN, DASS DA NOCH ETWAS IST (Lehre aus E383). Ohne es sagt die
   Reiterzeile nicht, dass sich etwas aufklappen lässt — beim Hinsehen
   (§55.3) war genau das der Eindruck. */
gleich('Ein Klapp-Zeichen steht in der Reiterzeile', ruhig.klappDa, 1);
p('… und es sagt, was es tut', /aufklappen/i.test(ruhig.klappWort), ruhig.klappWort);
gleich('… und es sagt, dass zu ist', ruhig.klappOffen, 'false');

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Ein Klick holt alles zurück (nichts ist gelöscht)');
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('[data-fb-klapp]')?.click();
});
await seite.waitForTimeout(500);
const perZeichen = await lage();
p('Das Klapp-Zeichen öffnet das Band', perZeichen.flaeche > 0, `${perZeichen.flaeche} px`);
gleich('… und sagt jetzt, dass offen ist', perZeichen.klappOffen, 'true');
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('[data-fb-klapp]')?.click();
});
await seite.waitForTimeout(500);
await seite.evaluate(() => {
  const r = document.querySelector<HTMLElement>('.folienband-reiter [aria-selected="true"]');
  r?.click();
});
await seite.waitForTimeout(500);
const auf = await lage();
p('Ein Klick auf den gewählten Reiter klappt die Fläche auf', auf.flaeche > 0,
  `${auf.flaeche} px`);
p('… und die Gruppen stehen darin', auf.gruppen.length > 0, JSON.stringify(auf.gruppen));
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('.folienband-reiter [aria-selected="true"]')?.click();
});
await seite.waitForTimeout(500);
gleich('… ein zweiter Klick klappt wieder zu', (await lage()).flaeche, 0);

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Der Zeichnen-Fall: niemand steht ohne Werkzeuge da (E552)');
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('[data-fb-reiter="zeichnen"]')?.click();
});
await seite.waitForTimeout(600);
const zeichnen = await lage();
gleich('Der Reiter „Zeichnen" ist gewählt', zeichnen.aktiv, 'zeichnen');
p('… und die Zeichenleiste steht da', zeichnen.zeichenleiste > 0,
  `${zeichnen.zeichenleiste} px`);
p('… mit ihren Werkzeugen', zeichnen.werkzeuge >= 10, String(zeichnen.werkzeuge));

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Die Dateikarte ist nicht gelöscht, sondern umgezogen');
await ruhigSetzen('an');
const nachUmzug = await lage();
gleich('Über dem Blatt steht sie nicht mehr', nachUmzug.karteUeberBlatt, 0);
gleich('… auch der Hinweissatz nicht', nachUmzug.hinweisUeberBlatt, 0);
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
});
await seite.waitForTimeout(700);
const mitInspector = await lage();
p('… aber im Details-Fenster steht sie — das ist „nichts entfernt"',
  mitInspector.karteImInspector > 0, String(mitInspector.karteImInspector));
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
});
await seite.waitForTimeout(400);

/* ── 5 ────────────────────────────────────────────────────────────────── */
/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · Die Gegenprobe: ohne Ruhe ist alles wie vorher');
await ruhigSetzen('aus');
const laut = await lage();
console.log(`     Chrome ohne Ruhe: ${laut.chrome} px`);
p('Ohne Ruhe ist die Fläche offen', laut.flaeche > 0, `${laut.flaeche} px`);
p('… die Dateikarte steht wieder über dem Blatt (E464)',
  laut.karteUeberBlatt === 1, String(laut.karteUeberBlatt));
p(`… und die Chrome ist deutlich höher als die Decke von ${DECKE}`,
  laut.chrome > DECKE, `${laut.chrome} px`);

/* ── 6 ────────────────────────────────────────────────────────────────── */
console.log('\n6 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await ktx.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
