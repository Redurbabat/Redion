/* Suite 186 — Der Weg zurück zur Quelle (§44)
 * ============================================================================
 * §44 des Auftrags steht in einem Satz und zwei Beispielen:
 *
 *     Jedes abgeleitete Wissensobjekt sollte, wenn vorhanden,
 *     zurückspringen können.
 *
 *         Karte → PDF → Seite 14 → Ausschnitt
 *         Aufgabe → Meeting → 00:07
 *
 * NACHGESEHEN, was davon schon dastand: die Angabe war vollständig da. Seit
 * E129/E130 trägt jedes abgeleitete Objekt einen `sourceRef` mit Seite,
 * Block, Art, Seitenzahl und sogar dem Ausschnitt. Gelesen hat sie nur der
 * Dokumentmodus — und zwar in die ANDERE Richtung: „welche Karten gehören zu
 * dieser PDF-Seite".
 *
 * Der Weg zurück fehlte. Die Karte wusste, woher sie kam; man kam nur nicht
 * hin. Genau das ist §44, und genau das baut E155.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §4 ist die Gegenrichtung und die wichtigere Hälfte: ein Block OHNE Quelle
 * darf keinen Knopf bekommen, und eine Quelle, die es nicht mehr gibt, auch
 * nicht. Ein Knopf, der ins Leere führt, ist schlimmer als keiner — genau
 * das war die Lehre aus E118.
 *
 *   node pruefungen/lauf/test220.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8978;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
});

/* ==========================================================================
 * §1 · Eine Karte aus einer PDF-Seite trägt ihre Herkunft
 * ========================================================================*/
console.log('\n1 · Eine Karte aus einer PDF-Seite trägt ihre Herkunft');

const gebaut = await seite.evaluate(async () => {
  /* Ein Skript mit vier Seiten, wie es das Einlesen anlegt. */
  const skript = Store.addPage(null, { text: 'Elektrotechnik Skript', icon: '📕' });
  const seiten = [1, 2, 3, 14].map(nr =>
    Store.addBlock(skript.id, 'pdfseite', { nr, suchtext: 'Inhalt von Seite ' + nr }));
  const vierzehn = seiten[3];

  /* Und eine Lernseite mit einer Karte, die aus Seite 14 stammt. NACHGESEHEN,
     wie `learning.ts` den Verweis schreibt: `sourceRef` UND `lernquelle`,
     mit kind, pageId, blockId, label, pageNumber und region. */
  const lernen = Store.addPage(null, { text: 'Meine Karten', icon: '🎴' });
  const quelle = { version: 1, kind: 'pdfseite', pageId: skript.id, blockId: vierzehn!.id,
    label: 'Elektrotechnik Skript', pageNumber: 14,
    region: { x: .1, y: .2, width: .5, height: .25 }, createdAt: Store.now() };
  const karte = Store.addBlock(lernen.id, 'flashcard',
    { text: 'Was steht auf Seite 14? :: Der Querschnitt', sourceRef: quelle, lernquelle: quelle });

  /* Eine Notiz OHNE Quelle auf derselben Seite — für §4. */
  const ohne = Store.addBlock(lernen.id, 'text', { text: 'Einfach so getippt.' });

  /* Und eine Karte, deren Quelle es nicht mehr gibt — ebenfalls für §4. */
  const totId = Store.uid();
  const tot = Store.addBlock(lernen.id, 'flashcard', {
    text: 'Verwaist :: ja',
    sourceRef: { version: 1, kind: 'pdfseite', pageId: skript.id, blockId: totId,
      label: 'Weg', pageNumber: 99, createdAt: Store.now() } });

  await Store.flush();
  App.oeffne(lernen.id);
  await new Promise(r => setTimeout(r, 900));
  return { skript: skript.id, vierzehn: vierzehn!.id, lernen: lernen.id,
    karte: karte.id, ohne: ohne.id, tot: tot.id };
});

const marken = await seite.evaluate((ids: any) => {
  const finde = (bid: string) =>
    document.querySelector<HTMLElement>(`[data-bid="${bid}"] .quell-marke`);
  const k = finde(ids.karte);
  return {
    karteHat: !!k, karteText: (k?.textContent || '').trim(), karteTitel: k?.title || '',
    ohneHat: !!finde(ids.ohne),
    totHat: !!finde(ids.tot),
    /* Und die Daten dahinter — damit §1 nicht bloss ein Etikett prüft. */
    ref: Store.getBlock(ids.karte)?.sourceRef || null
  };
}, gebaut);

p('Die Karte trägt einen Rücksprung', marken.karteHat);
gleich('Er sagt, wohin er führt', marken.karteText, '↩ PDF · Seite 14');
p('Und erklärt sich beim Darüberfahren',
  /entstanden/.test(marken.karteTitel), marken.karteTitel);
p('Der Ausschnitt steht in den Daten',
  !!marken.ref?.region && marken.ref.region.width === .5, JSON.stringify(marken.ref?.region));
gleich('Und die Seitenzahl', marken.ref?.pageNumber, 14);

/* ==========================================================================
 * §2 · Ein Klick führt wirklich dorthin
 * --------------------------------------------------------------------------
 * Das ist der ganze Punkt von §44. Ein Verweis, der nur gespeichert ist,
 * hilft niemandem.
 * ========================================================================*/
console.log('\n2 · Ein Klick führt wirklich dorthin');

const gesprungen = await seite.evaluate(async (ids: any) => {
  const vorher = String(App.aktuelleSeite() || '');
  document.querySelector<HTMLElement>(`[data-bid="${ids.karte}"] .quell-marke`)?.click();
  await new Promise(r => setTimeout(r, 1200));
  const ziel = document.querySelector(`[data-bid="${ids.vierzehn}"]`);
  return {
    vorher, nachher: String(App.aktuelleSeite() || ''),
    zielImBild: !!ziel,
    /* `zeigeBlock` hebt den Zielblock kurz hervor — daran ist ablesbar, dass
       nicht bloss die Seite geöffnet, sondern die STELLE angesprungen wurde. */
    hervorgehoben: !!document.querySelector('.hebe-hervor'),
    dokumentModus: Store.getBlock(ids.skript)?.dokumentModus === true
  };
}, gebaut);

p('Vorher stand die Lernseite offen', gesprungen.vorher === gebaut.lernen, gesprungen.vorher);
gleich('Danach das Skript', gesprungen.nachher, gebaut.skript);
p('Die vierzehnte Seite steht im Bild', gesprungen.zielImBild);
p('Und ist kurz hervorgehoben', gesprungen.hervorgehoben);

/* ==========================================================================
 * §3 · Auch aus einer Besprechung heraus (Aufgabe → Meeting)
 * --------------------------------------------------------------------------
 * Das zweite Beispiel aus §44. Die Zeitmarke im Transkript trägt seit E152
 * ihren `audioRef`; hier geht es um den Weg von der Notiz zur Besprechung.
 * ========================================================================*/
console.log('\n3 · Auch aus einer Besprechung heraus');

const ausMeeting = await seite.evaluate(async () => {
  const bespr = Store.addPage(null, { text: 'Bauleitung KW 35', icon: '🎙', besprechung: true });
  const zeile = Store.addBlock(bespr.id, 'text', { text: '01:02 · Verteiler versetzen' });
  const arbeit = Store.addPage(null, { text: 'Offene Punkte' });
  const quelle = { version: 1, kind: 'block', pageId: bespr.id, blockId: zeile.id,
    label: 'Bauleitung KW 35', createdAt: Store.now() };
  const aufgabe = Store.addBlock(arbeit.id, 'todo',
    { text: 'Verteiler UV3 versetzen', sourceRef: quelle, lernquelle: quelle });
  await Store.flush();
  App.oeffne(arbeit.id);
  await new Promise(r => setTimeout(r, 900));
  const marke = document.querySelector<HTMLElement>(`[data-bid="${aufgabe.id}"] .quell-marke`);
  const text = (marke?.textContent || '').trim();
  marke?.click();
  await new Promise(r => setTimeout(r, 1100));
  return { text, offen: String(App.aktuelleSeite() || ''), bespr: bespr.id,
    zeileImBild: !!document.querySelector(`[data-bid="${zeile.id}"]`) };
});

p('Auch eine Aufgabe bekommt den Rücksprung', !!ausMeeting.text, ausMeeting.text);
gleich('Er nennt die Besprechung beim Namen', ausMeeting.text, '↩ Bauleitung KW 35');
gleich('Und der Klick öffnet sie', ausMeeting.offen, ausMeeting.bespr);
p('Mit der Zeile, aus der die Aufgabe kam', ausMeeting.zeileImBild);

/* ==========================================================================
 * §4 · Kein Knopf ohne Ziel
 * --------------------------------------------------------------------------
 * Die Gegenrichtung, und die wichtigere Hälfte. Ein Block ohne Quelle darf
 * keinen bekommen; eine Quelle, die es nicht mehr gibt, auch nicht. Ein
 * Knopf, der ins Leere führt, ist schlimmer als keiner (E118).
 * ========================================================================*/
console.log('\n4 · Kein Knopf ohne Ziel');
p('Eine einfach getippte Notiz bekommt keinen', !marken.ohneHat);
p('Und eine Karte mit verschwundener Quelle auch nicht', !marken.totHat);

/* Und die Gegenprobe zur Gegenprobe: die verwaiste Karte IST da, es fehlt
   nur ihr Ziel. Sonst prüfte der Punkt darüber, dass die Karte fehlt. */
const verwaist = await seite.evaluate((ids: any) => {
  App.oeffne(ids.lernen);
  return { karteDa: !!Store.getBlock(ids.tot), refDa: !!Store.getBlock(ids.tot)?.sourceRef };
}, gebaut);
p('Die verwaiste Karte gibt es sehr wohl', verwaist.karteDa);
p('Und ihre Quellenangabe steht noch in den Daten', verwaist.refDa);

/* ==========================================================================
 * §5 · Die Angabe übersteht eine Sicherung
 * --------------------------------------------------------------------------
 * Ein Rücksprung, der beim Sichern verlorengeht, ist keiner. `sourceRef`
 * liegt am normalen Block und reist deshalb mit — geprüft, nicht vermutet.
 * ========================================================================*/
console.log('\n5 · Die Angabe übersteht eine Sicherung');

const nachSicherung = await seite.evaluate(async (ids: any) => {
  const paket = await Store.exportAll();
  const text = typeof paket === 'string' ? paket : JSON.stringify(paket);
  const wieder = JSON.parse(text);
  /* `blocks` IST EINE ZUORDNUNG, KEINE LISTE. Mein erster Entwurf rief
     `.find(…)` darauf und bekam „bloecke.find is not a function". Nachgesehen
     in `indexdb.ts`: gesichert wird `cache.blocks`, und das ist ein Objekt
     mit der Kennung als Schlüssel. */
  const karte = (wieder.blocks || {})[ids.karte];
  return {
    imPaket: !!karte,
    refImPaket: !!karte?.sourceRef,
    seiteImPaket: String(karte?.sourceRef?.pageNumber ?? ''),
    ausschnittImPaket: !!karte?.sourceRef?.region
  };
}, gebaut);
p('Die Karte steht in der Sicherung', nachSicherung.imPaket);
p('Mit ihrer Quellenangabe', nachSicherung.refImPaket);
gleich('Samt Seitenzahl', nachSicherung.seiteImPaket, '14');
p('Und samt Ausschnitt', nachSicherung.ausschnittImPaket);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
