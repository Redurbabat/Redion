/* Suite 180 — Die Produktwelten haben Platz, und sie sagen, was sie meinen
 * ============================================================================
 * Diese Suite ist aus vier Bildern entstanden, nicht aus einem Prüfgedanken
 * (§55). Beim Ansehen der Bibliothek am 25. August fielen der Reihe nach auf:
 *
 *   1. Drei von sechs Zählern sagten nicht mehr, was ihre Zahl bedeutet:
 *      „Inhalts…", „PDF-…", „White…". Die Zahl stimmte, die Beschriftung
 *      hatte 46 px und brauchte bis zu 86.
 *   2. Vier graue Striche am rechten Rand gehörten zu einer Seite, die gar
 *      nicht gezeichnet war. Ein Klick darauf tat nichts.
 *   3. Fünf von sieben Such-Platzhaltern brachen ab. Ein Platzhalter ist der
 *      einzige Hinweis darauf, wonach man suchen kann.
 *   4. Und die Ursache unter 1 und 3: am Telefon blieben von 390 px genau
 *      240 für den Inhalt übrig — `#page.wide` schlug mit seiner Kennung
 *      jede Klassenregel der Produktwelten.
 *
 * KEINE dieser vier Sachen konnte ein bestehender Prüflauf sehen, und die
 * ersten beiden sieht man nur mit Augen. Diese Suite misst sie deshalb in
 * Zahlen — damit sie beim nächsten Mal nicht wieder das Ansehen braucht.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle vier Punkte waren vor dem 25. August rot; die Gegenproben unten sind
 * einzeln auf einem Abzug des Baums zurückgenommen worden. §1 misst zudem
 * die Gegenrichtung: ein Kasten DARF nicht die ganze Breite fressen.
 *
 *   node pruefungen/lauf/test214.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8973;

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

const ANSICHTEN = ['uebersicht', 'bibliothek', 'aufgaben', 'kalender',
                   'datenbanken', 'whiteboards', 'wiki', 'vorlagen'];

const browser = await chromium.launch();
const fehler: string[] = [];

/** Alles, was eine Ansicht über sich verrät — in einem Durchgang. */
const messen = async (seite: any, ansicht: string): Promise<any> => {
  await seite.evaluate((a: string) => { (globalThis as any).Produktwelten.workspace(a); }, ansicht);
  await seite.waitForTimeout(650);
  return seite.evaluate((a: string) => {
    const welt = document.querySelector<HTMLElement>('.produkt-welt');
    const shell = document.querySelector<HTMLElement>('.aw-shell');
    const feld = document.querySelector<HTMLInputElement>('.aw-suche-eingabe');

    /* EIN PLATZHALTER IST KEIN ELEMENT — `scrollWidth` sagt über ihn nichts.
       Gemessen wird der Text in derselben Schrift in einer unsichtbaren
       Spanne; das ist die einzige Zahl, die mit dem vergleichbar ist, was
       das Feld hergibt. */
    let platzNoetig = 0;
    if (feld) {
      const mess = document.createElement('span');
      mess.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      mess.style.font = getComputedStyle(feld).font;
      mess.textContent = feld.placeholder;
      document.body.appendChild(mess);
      platzNoetig = Math.ceil(mess.getBoundingClientRect().width);
      mess.remove();
    }

    const engeLabel = [...document.querySelectorAll<HTMLElement>('.aw-zaehler-label')]
      .filter(l => l.scrollWidth > l.clientWidth + 1)
      .map(l => (l.textContent || '').trim());

    /* DIESELBE FRAGE FÜR DIE HANDLUNGSKACHELN (E228). Die Zählerkarten
       bekamen im August ihre Breite nach der eigenen Spalte; die Kacheln
       „Schnell starten" behielten `repeat(4, 1fr)` und standen sieben von
       acht abgeschnitten da — „Whit…", „Scan…", „Sich…".
       Sie umbrechen (`white-space:normal`), abgeschnitten wird also immer
       ein einzelnes WORT, das in keine Zeile passt. `scrollWidth` sieht
       genau das. */
    const engeAktion = [...document.querySelectorAll<HTMLElement>('.aw-aktion-text')]
      .filter(l => l.scrollWidth > l.clientWidth + 1)
      .map(l => (l.textContent || '').trim());

    return {
      ansicht: a,
      fenster: document.documentElement.clientWidth,
      weltBreite: welt ? Math.round(welt.clientWidth) : 0,
      shellBreite: shell ? Math.round(shell.getBoundingClientRect().width) : 0,
      platzhalter: feld?.placeholder || '',
      feldBreite: feld ? Math.round(feld.clientWidth) : 0,
      platzNoetig,
      engeLabel,
      engeAktion,
      aktionen: document.querySelectorAll('.aw-aktion').length,
      zaehler: document.querySelectorAll('.aw-zaehler').length,
      randToc: !!document.getElementById('rand-toc')
    };
  }, ansicht);
};

for (const [name, breite, hoehe, mindestens] of
     [['Rechner', 1280, 900, .60], ['Telefon', 390, 844, .82]] as [string, number, number, number][]) {

  const seite = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  seite.on('pageerror', (e: any) => fehler.push(`PAGEERROR(${name}): ` + String(e.message).slice(0, 120)));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2700);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
  });

  /* Vorher eine Seite öffnen, die genug Überschriften für den
     Gliederungsstreifen hat — sonst prüft §4 nichts. */
  await seite.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Lange Seite', icon: '📘' });
    ['Erstens', 'Zweitens', 'Drittens', 'Viertens'].forEach(t =>
      Store.addBlock(s.id, 'h1', { text: t }));
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 800));
  });
  const streifenVorher = await seite.evaluate(() => !!document.getElementById('rand-toc'));

  const stand: any[] = [];
  for (const ansicht of ANSICHTEN) stand.push(await messen(seite, ansicht));

  console.log(`\n${name} · ${breite} × ${hoehe}`);

  /* ── §1 · Der Inhalt bekommt den Bildschirm ─────────────────────────────
     GEMESSEN WIRD DAS GERÜST, NICHT DER RAHMEN. Die erste Fassung nahm
     `welt.clientWidth` — und `clientWidth` ZÄHLT DIE INNENABSTÄNDE MIT. Mit
     den 60 px, die dieser Punkt finden sollte, meldete er weiter 390 von 390
     und blieb grün. `.aw-shell` ist das erste Element ohne eigenen Abstand
     und damit die einzige Zahl, die den Verlust sieht: 270 statt 366. */
  const engste = stand.reduce((a, b) => a.shellBreite <= b.shellBreite ? a : b);
  p(`Der Inhalt bekommt mindestens ${Math.round(mindestens * 100)} % der Breite`,
    engste.shellBreite >= breite * mindestens,
    `${engste.ansicht}: ${engste.shellBreite} von ${breite}`);
  /* Gegenrichtung: er darf auch nicht über den Rand hinausstehen. */
  p('Und steht nicht über den Rand hinaus',
    stand.every(s => s.shellBreite <= breite), JSON.stringify(stand.map(s => s.shellBreite)));

  /* ── §2 · Jeder Zähler sagt, was seine Zahl bedeutet ──────────────────── */
  const mitZaehlern = stand.filter(s => s.zaehler > 0);
  p('Es gibt überhaupt Zähler zu prüfen', mitZaehlern.length > 0,
    JSON.stringify(stand.map(s => [s.ansicht, s.zaehler])));
  const enge = stand.flatMap(s => s.engeLabel.map((t: string) => `${s.ansicht}: ${t}`));
  gleich('Keine Zähler-Beschriftung ist abgeschnitten', enge, []);

  /* ── §2b · Und keine Handlungskachel (E228) ───────────────────────────── */
  const mitAktionen = stand.filter(s => s.aktionen > 0);
  p('Es gibt überhaupt Kacheln zu prüfen', mitAktionen.length > 0,
    JSON.stringify(stand.map(s => [s.ansicht, s.aktionen])));
  const engeK = stand.flatMap(s => s.engeAktion.map((t: string) => `${s.ansicht}: ${t}`));
  gleich('Keine Kachel-Beschriftung ist abgeschnitten', engeK, []);

  /* ── §3 · Jeder Platzhalter steht ganz da ─────────────────────────────── */
  const mitFeld = stand.filter(s => s.platzhalter);
  p('Es gibt überhaupt Suchfelder zu prüfen', mitFeld.length >= 5, `${mitFeld.length}`);
  const kurz = mitFeld
    .filter(s => s.platzNoetig > s.feldBreite - 18)
    .map(s => `${s.ansicht}: ${s.platzNoetig} in ${s.feldBreite}`);
  gleich('Kein Such-Platzhalter bricht ab', kurz, []);

  /* ── §4 · Der Gliederungsstreifen bleibt bei seiner Seite ─────────────── */
  p('Auf der Seite selbst steht der Streifen', streifenVorher,
    'ohne ihn prüft der nächste Punkt nichts');
  const uebrig = stand.filter(s => s.randToc).map(s => s.ansicht);
  gleich('In keiner Produktwelt bleibt er stehen', uebrig, []);

  await seite.close();
}

/* ==========================================================================
 * §6 · Eins ist eine andere Zahl als zwei (E231)
 * --------------------------------------------------------------------------
 * In der Bibliothek stand unter jeder Seite mit genau einem Kind
 * „1 Einträge" — zwei davon waren im Bildschirmfoto gleichzeitig zu sehen.
 *
 * GEPRÜFT WIRD DER FALL, DER DEN FEHLER ZEIGT. Der übliche Bestand hat
 * Seiten mit null oder vielen Kindern; genau eins kommt selten vor, und
 * darum ist es jahrelang niemandem aufgefallen. Die Prüfung legt den Fall
 * deshalb selbst an.
 *
 * Gefragt wird nicht nach der einen Zeile, sondern nach dem MUSTER: steht
 * irgendwo „1 " gefolgt von einem Mehrzahlwort? Damit fällt auch der
 * nächste Vergesser auf, nicht nur dieser.
 *
 *     Gegenbeweis, alte Zeile eingesetzt:  ["1 Einträge"]
 *     jetzt:                               keine
 * ========================================================================*/
console.log('\n6 · Eins ist eine andere Zahl als zwei');

const einzahl = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await einzahl.goto(`http://localhost:${PORT}/index.html`);
await einzahl.waitForTimeout(2600);
const grammatik = await einzahl.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  const s = Store.addPage(null, { text: 'Genau eins', icon: '📄' });
  Store.addBlock(s.id, 'text', { text: 'Ein einziger Block' });
  await Store.flush();
  /* SEIT DEM 6. SEPTEMBER (E457) öffnet `Produktwelten.bibliothek()` das
     Dokumentregal — dort steht kein Zähler mehr unter der Seite, sondern
     der Deckel. Die Zeile „1 Eintrag" gehört zur Sammlung „Dateien & PDFs"
     (arbeitswelt.ts, `zahlWort(page.blockAnzahl, 'Eintrag', 'Einträge')`),
     und die wohnt jetzt in der Bibliothek unter `#dateien-pdfs`. */
  await (globalThis as any).Arbeitswelt.oeffnen('bibliothek');
  await new Promise(r => setTimeout(r, 1400));
  const text = (document.querySelector('#main') as HTMLElement)?.innerText || '';
  const zeilen = text.split('\n');
  const i = zeilen.findIndex(z => /Genau eins/.test(z));
  return {
    zeile: i >= 0 ? zeilen.slice(i, i + 2).join(' | ') : '(nicht gefunden)',
    /* „1 " und danach ein Wort, das auf eine Mehrzahl-Endung ausgeht. */
    falsch: [...new Set([...text.matchAll(/\b1 ([A-ZÄÖÜ][a-zäöüß]+(?:e|en|er|se|s))\b/g)]
      .map(m => m[0]))]
  };
});
await einzahl.close();

p('Der Fall mit genau einem Kind steht in der Liste',
  /Genau eins/.test(grammatik.zeile), grammatik.zeile);
p('… und heisst „1 Eintrag", nicht „1 Einträge"',
  /1 Eintrag\b/.test(grammatik.zeile), grammatik.zeile);
gleich('Nirgends steht „1" vor einem Mehrzahlwort', grammatik.falsch, []);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
