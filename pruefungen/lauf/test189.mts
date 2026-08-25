/* Suite 155 — Was nach dem Erfolgsfall kommt (E115, E116)
 * ============================================================================
 * Die PDF-Arbeit E103–E110 hat den Weg gebaut, auf dem alles klappt. Diese
 * Suite prüft den Weg daneben: zweimal geklickt, mittendrin neu gezeichnet,
 * abgebrochen, lange gewartet.
 *
 * Fünf Befunde aus dem Gegenlesen, alle hier nachgestellt:
 *
 *   E115  `Marken.schicht` meldete seinen `pagehide`-Zuhörer nie ab —
 *         gemessen 4 vorher, 84 nach zwanzig Neuzeichnungen.
 *   E115  Ein Strich, der gerade gezogen wird, war verloren, wenn der Block
 *         in diesem Moment neu gezeichnet wurde. Und das kommt von selbst:
 *         beim PDF-Einlesen nach jeder Seite, beim Abgleich bei jeder
 *         fremden Änderung.
 *   E116  „Aus dem Original zurückholen" hatte keine Sperre gegen sich
 *         selbst — zwei Klicks, zwei Läufe, eine Dateileiche.
 *   E116  Der Fortschritt zählte zwei Dinge gegeneinander: „Seite 80 von 1".
 *   E116  Der Fortschritts-Melder verstummte nach der ersten fremden
 *         Meldung — im langen Lauf, für den er da ist.
 *
 *   node pruefungen/lauf/test189.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8943;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

/* Vor allem anderen: mitzählen, wer sich am Fenster anmeldet. Muss VOR dem
   Laden geschehen — die Schichten melden sich beim Zeichnen an. */
await seite.addInitScript(() => {
  (window as any).__pagehide = 0;
  const echt = window.addEventListener.bind(window);
  window.addEventListener = function (art: string, ...rest: any[]) {
    if (art === 'pagehide') (window as any).__pagehide++;
    return (echt as any)(art, ...rest);
  } as any;
});

await seite.setViewportSize({ width: 1300, height: 850 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · Zuhörer wachsen nicht mit jedem Neuzeichnen (E115)
 * ========================================================================*/
console.log('\n1 · Zuhörer wachsen nicht mit jedem Neuzeichnen');

const zuhoerer = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Vier Schichten' });
  Store.addBlock(s.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.addBlock(s.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 1, bw: 595, bh: 842, quelleId: 'q' });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 2, bw: 595, bh: 842, quelleId: 'q' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 400));

  const vorher = (window as any).__pagehide;
  const flaechenVorher = document.querySelectorAll('svg.blatt-marken').length;
  for (let i = 0; i < 20; i++) {
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 12));
  }
  await new Promise(r => setTimeout(r, 200));
  return {
    vorher, nachher: (window as any).__pagehide,
    flaechenVorher,
    flaechenNachher: document.querySelectorAll('svg.blatt-marken').length,
  };
});

gleich('Es sind vier Zeichenflächen da', zuhoerer.flaechenVorher, 4);
gleich('Nach zwanzig Neuzeichnungen immer noch vier', zuhoerer.flaechenNachher, 4);
gleich('Und kein einziger Zuhörer ist dazugekommen',
  zuhoerer.nachher, zuhoerer.vorher);
p('Es gibt überhaupt höchstens einen', zuhoerer.nachher <= 1,
  'gezählt: ' + zuhoerer.nachher);

/* ==========================================================================
 * §2 · Ein Strich überlebt das Neuzeichnen (E115)
 * --------------------------------------------------------------------------
 * Zwischen `pointerdown` und `pointerup` steht der Strich nur im Speicher
 * der Schicht. Wird der Block genau dann neu gezeichnet, erreicht `pointerup`
 * die alten Zuhörer nicht mehr — die Fläche ist abgehängt und der Zeiger-Fang
 * gelöst. Genau das passiert beim PDF-Einlesen nach jeder fertigen Seite.
 * ========================================================================*/
console.log('\n2 · Ein Strich überlebt das Neuzeichnen');

const strich = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Malen' });
  const bl = Store.addBlock(s.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 400));

  /* Auf „Malen" stellen — sonst geht der Zeiger an der Schicht vorbei. */
  (document.querySelector('.blatt-werk [data-wz="stift"]') as HTMLElement)?.click();
  const f = document.querySelector('svg.blatt-marken') as SVGSVGElement;
  if (!f) return { fehlt: true };

  const kasten = f.getBoundingClientRect();
  const zeiger = (art: string, x: number, y: number) =>
    f.dispatchEvent(new PointerEvent(art, {
      pointerId: 1, isPrimary: true, bubbles: true, cancelable: true,
      clientX: kasten.left + x, clientY: kasten.top + y }));

  zeiger('pointerdown', 40, 40);
  for (let i = 1; i <= 8; i++) zeiger('pointermove', 40 + i * 20, 40 + i * 12);
  /* KEIN pointerup. Stattdessen: neu zeichnen, wie es das PDF-Einlesen tut. */
  const vorher = (Store.getBlock(bl.id).marken || []).length;
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 300));

  const m = Store.getBlock(bl.id).marken || [];
  return {
    fehlt: false, vorher, nachher: m.length,
    punkte: m[0] ? m[0].pts.length : 0,
    imBild: document.querySelectorAll('svg.blatt-marken [data-sid]').length,
  };
});

p('Die Zeichenfläche war da', !strich.fehlt);
gleich('Vor dem Neuzeichnen war noch nichts gespeichert', strich.vorher, 0);
gleich('Danach steht genau ein Strich im Block', strich.nachher, 1);
p('Und er hat alle seine Punkte', (strich.punkte ?? 0) >= 8, String(strich.punkte));
gleich('Er ist auch wieder zu sehen', strich.imBild, 1);

/* ==========================================================================
 * §3 · Der Melder verstummt nicht (E116)
 * ========================================================================*/
console.log('\n3 · Der Melder verstummt nicht');

const melder = await seite.evaluate(async () => {
  const t = document.getElementById('toast');
  const m = UI.toast('Fortschritt beginnt …', 120000);
  await new Promise(r => setTimeout(r, 50));
  /* Eine fremde Meldung dazwischen — sie setzt `toastTimer` neu und nimmt
     dem Fortschritt seine 120 Sekunden weg: übrig bleiben ihre eigenen 2600.
     UND DANN MUSS MAN WARTEN. Ohne das Warten steht `show` noch, und die
     alte Fassung schriebe brav weiter — die Gegenprobe wäre grün und
     bedeutungslos (gemessen, §55.2). Der Fehler beginnt erst, wenn die
     FREMDE Uhr abgelaufen ist. */
  UI.toast('Etwas ganz anderes');
  await new Promise(r => setTimeout(r, 50));
  const dazwischen = t?.textContent || '';
  await new Promise(r => setTimeout(r, 2900));
  const nachAblauf = { sichtbar: !!t?.classList.contains('show') };
  m.textContent = 'Seite 7 von 80 wird gerechnet …';
  await new Promise(r => setTimeout(r, 50));
  return {
    dazwischen, nachAblauf,
    text: t?.textContent || '',
    sichtbar: !!t?.classList.contains('show'),
  };
});

gleich('Die fremde Meldung war kurz zu sehen', melder.dazwischen, 'Etwas ganz anderes');
p('Und ihre eigene Uhr ist danach abgelaufen', !melder.nachAblauf.sichtbar);
gleich('Danach schreibt der Fortschritt weiter',
  melder.text, 'Seite 7 von 80 wird gerechnet …');
p('Und er ist auch wirklich sichtbar', melder.sichtbar);

/* ==========================================================================
 * §4 · Zweimal klicken rechnet einmal (E116)
 * --------------------------------------------------------------------------
 * Jede bildlose Seite hat ihren eigenen Knopf. Zwei Klicks starteten zwei
 * vollständige Läufe über dieselbe Liste — und das Seitenbild des Verlierers
 * blieb als fertiger Datei-Satz mit LEBENDEM `blockId` liegen, wo
 * `Dateien.verwaist()` es grundsätzlich nicht findet.
 * ========================================================================*/
console.log('\n4 · Zweimal klicken rechnet einmal');

const doppelt = await seite.evaluate(async () => {
  /* Ein echtes, kleines PDF — von Hand gebaut, damit die Prüfung nichts
     herunterladen muss. Zwei Seiten genügen. */
  const teile: string[] = [];
  const objekte = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R ' +
      '/Resources << /Font << /F1 7 0 R >> >> >>',
    null, /* Strom 1 */
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 6 0 R ' +
      '/Resources << /Font << /F1 7 0 R >> >> >>',
    null, /* Strom 2 */
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stroeme = ['BT /F1 24 Tf 20 100 Td (Eins) Tj ET',
                   'BT /F1 24 Tf 20 100 Td (Zwei) Tj ET'];
  let pdf = '%PDF-1.4\n';
  const orte: number[] = [];
  objekte.forEach((o, i) => {
    orte.push(pdf.length);
    if (o === null) {
      const st = stroeme[i === 3 ? 0 : 1]!;
      pdf += (i + 1) + ' 0 obj\n<< /Length ' + st.length + ' >>\nstream\n' +
             st + '\nendstream\nendobj\n';
    } else {
      pdf += (i + 1) + ' 0 obj\n' + o + '\nendobj\n';
    }
  });
  const xref = pdf.length;
  pdf += 'xref\n0 ' + (objekte.length + 1) + '\n0000000000 65535 f \n' +
    orte.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<< /Size ' + (objekte.length + 1) + ' /Root 1 0 R >>\nstartxref\n' +
    xref + '\n%%EOF';
  teile.push(pdf);
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;

  const s = Store.addPage(null, { text: 'Zweimal' });
  App.oeffne(s.id);
  const satz = await Dateien.ablegen(
    new File([bytes], 'zwei.pdf', { type: 'application/pdf' }), {});
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 1, bw: 200, bh: 200, quelleId: satz.id });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 2, bw: 200, bh: 200, quelleId: satz.id });

  const vorherDateien = (await Store.dateiAlle()).length;
  /* Zwei Klicks, so schnell wie ein Mensch nie klicken könnte — das ist der
     schärfste Fall und der einzige, der ohne Sperre sicher schiefgeht. */
  const [a, b] = await Promise.all([
    PdfEinlesen.neuBerechnen(satz.id),
    PdfEinlesen.neuBerechnen(satz.id),
  ]);
  await new Promise(r => setTimeout(r, 400));

  const alle = await Store.dateiAlle();
  const bilder = alle.filter((d: any) => d.abgeleitet);
  const bloecke = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive !== false && b.quelleId === satz.id);
  const benutzt = new Set(bloecke.map(b => b.bildDateiId).filter(Boolean));
  return {
    vorherDateien,
    seitenA: a?.seiten, seitenB: b?.seiten,
    /* Zwei Seiten, also genau zwei abgeleitete Dateien. */
    bilder: bilder.length,
    /* Und jede davon wird von einem Block auch WIRKLICH benutzt. */
    leichen: bilder.filter((d: any) => !benutzt.has(d.id)).length,
    mitBild: bloecke.filter(b => b.bildDateiId).length,
  };
});

gleich('Es gab vorher nur das Original', doppelt.vorherDateien, 1);
gleich('Beide Seiten haben ein Bild bekommen', doppelt.mitBild, 2);
gleich('Und es entstanden genau zwei Seitenbilder', doppelt.bilder, 2);
gleich('Keine Dateileiche', doppelt.leichen, 0);
p('Beide Aufrufe melden dasselbe Ergebnis',
  doppelt.seitenA === doppelt.seitenB,
  doppelt.seitenA + ' / ' + doppelt.seitenB);

/* ==========================================================================
 * §5 · Der Fortschritt zählt EINE Sache (E116)
 * ========================================================================*/
console.log('\n5 · Der Fortschritt zählt EINE Sache');

const zaehlung = await seite.evaluate(async () => {
  /* Mitschreiben, was der Melder sagt — der Balken selbst ist geteilt. */
  const gesehen: string[] = [];
  const echt = document.getElementById('toast');
  const beob = new MutationObserver(() => {
    const t = echt?.textContent || '';
    if (t && gesehen[gesehen.length - 1] !== t) gesehen.push(t);
  });
  if (echt) beob.observe(echt, { childList: true, characterData: true, subtree: true });

  const s = (Object.values(Store.cache.blocks) as any[])
    .find(b => b.type === 'pdfseite' && b.quelleId && b.bildDateiId);
  if (!s) return { keine: true, gesehen: [] };
  /* Das Bild der ZWEITEN Seite wegnehmen — dann ist genau eine offen, und
     ihre Nummer im Dokument ist 2. Genau die Lage, in der „Seite 2 von 1"
     stand. */
  const zwei = (Object.values(Store.cache.blocks) as any[])
    .find(b => b.type === 'pdfseite' && b.quelleId === s.quelleId && Number(b.nr) === 2);
  if (zwei) Store.updateBlock(zwei.id, { bildDateiId: null });
  await PdfEinlesen.neuBerechnen(s.quelleId);
  await new Promise(r => setTimeout(r, 200));
  beob.disconnect();
  return { keine: false, gesehen };
});

p('Es gab eine Seite zum Rechnen', !zaehlung.keine);
const fortschritt = (zaehlung.gesehen || []).filter((t: string) => /^Seite \d+ von \d+/.test(t));
p('Der Fortschritt hat gemeldet', fortschritt.length >= 1, JSON.stringify(zaehlung.gesehen));
p('Und nie mehr gezählt, als es zu rechnen gab',
  fortschritt.every((t: string) => {
    const m = t.match(/^Seite (\d+) von (\d+)/);
    return !!m && Number(m[1]) <= Number(m[2]);
  }), fortschritt.join(' | '));
gleich('Die eine offene Seite hiess „Seite 1 von 1"',
  fortschritt[0], 'Seite 1 von 1 wird gerechnet …');

/* ==========================================================================
 * §6 · Scheitert es, kommt der Knopf zurück (E116)
 * ========================================================================*/
console.log('\n6 · Scheitert es, kommt der Knopf zurück');

const knopf = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Ohne Original' });
  Store.addBlock(s.id, 'pdfseite', {
    text: '', nr: 1, bw: 595, bh: 842, quelleId: 'gibt-es-nicht' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 400));
  const k = document.querySelector('.pdfs-neu') as HTMLButtonElement | null;
  if (!k) return { fehlt: true };
  k.click();
  const gleichDanach = { gesperrt: k.disabled, text: k.textContent || '' };
  await new Promise(r => setTimeout(r, 800));
  const jetzt = document.querySelector('.pdfs-neu') as HTMLButtonElement | null;
  return { fehlt: false, gleichDanach,
           gesperrt: jetzt ? jetzt.disabled : null,
           text: jetzt ? (jetzt.textContent || '') : '' };
});

p('Der Knopf war da', !knopf.fehlt);
p('Beim Klick sperrt er sich', knopf.gleichDanach?.gesperrt === true);
gleich('Und sagt, dass er rechnet', knopf.gleichDanach?.text, 'wird gerechnet …');
gleich('Danach ist er wieder anfassbar', knopf.gesperrt, false);
gleich('Und beschriftet wie vorher', knopf.text, 'Aus dem Original zurückholen');

/* ==========================================================================
 * §7 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n7 · Was der Quelltext verspricht');

const mk = fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/marken.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const el = fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/einlesen.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

gleich('In `schicht` hängt kein `pagehide` mehr',
  (mk.match(/addEventListener\('pagehide'/g) || []).length, 1);
p('Der eine, den es gibt, steht ausserhalb von `schicht`',
  mk.indexOf("addEventListener('pagehide'") < mk.indexOf('const schicht ='),
  mk.indexOf("addEventListener('pagehide'") + ' vs ' + mk.indexOf('const schicht ='));
p('Es gibt ein Verzeichnis der lebenden Schichten',
  /const lebende = new Set/.test(mk));
p('Und `neuBerechnen` merkt sich, was läuft',
  /const laufendeRechnungen = new Map/.test(el) &&
  /laufendeRechnungen\.get\(quelleId\)/.test(el));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
