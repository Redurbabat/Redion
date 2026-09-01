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
  /* SEIT E327 IST DAS EIN AUFTRAG, und die Sperre gegen zwei gleichzeitige
     Läufe steckt jetzt in seiner KENNUNG statt in einer Map im Tab —
     `pdfbild-` + Kennung des Originals. Zwei Klicks finden denselben
     Auftrag, und `Store.auftragNehmen` gibt ihn nur einem. Der Fall, den
     dieser Abschnitt misst, ist damit strenger geworden: er hält jetzt auch
     zwischen zwei TABS. */
  const auftragsId = a?.auftrag?.id || b?.auftrag?.id || '';
  if (auftragsId) {
    const bis = Date.now() + 90000;
    for (;;) {
      const j = await Auftraege.einer(auftragsId);
      if (j && JobModell.beendet(j)) break;
      if (Date.now() > bis) throw new Error('Auftrag wurde nicht fertig');
      await new Promise(r => setTimeout(r, 120));
    }
  }
  await new Promise(r => setTimeout(r, 300));

  /* ZWEITER TEIL, und er misst die ANDERE Hälfte. Oben schlug die Nachfrage
     nicht an; hier muss sie es. Damit das nicht an der Uhr hängt, steht die
     Maschine still: dann bleibt der erste Auftrag auf `wartet` liegen, und
     der zweite Aufruf hat gar keine Wahl, als ihn zu finden. */
  Auftraege.stopp();
  const zwei = (Object.values(Store.cache.blocks) as any[])
    .find(b => b.type === 'pdfseite' && b.quelleId === satz.id && Number(b.nr) === 2);
  /* Das alte Bild WIRKLICH wegräumen und nicht nur die Verweisung kappen.
     Sonst legt die Gerüststange selbst die Leiche, gegen die dieser
     Abschnitt misst — und die Zeile „Keine Dateileiche“ wäre rot aus dem
     falschen Grund. Beim echten Fall (`.json`-Sicherung ohne Anhänge) ist
     die Datei ohnehin fort. */
  if (zwei) {
    if (zwei.bildDateiId) await Dateien.weg(zwei.bildDateiId);
    Store.updateBlock(zwei.id, { bildDateiId: null });
  }
  const c = await PdfEinlesen.neuBerechnen(satz.id);
  const d = await PdfEinlesen.neuBerechnen(satz.id);
  await Auftraege.start();
  const idCD = c?.auftrag?.id || '';
  if (idCD) {
    const bis2 = Date.now() + 90000;
    for (;;) {
      const j = await Auftraege.einer(idCD);
      if (j && JobModell.beendet(j)) break;
      if (Date.now() > bis2) throw new Error('Zweiter Auftrag wurde nicht fertig');
      await new Promise(r => setTimeout(r, 120));
    }
  }
  await new Promise(r => setTimeout(r, 300));

  const alle = await Store.dateiAlle();
  const bilder = alle.filter((d: any) => d.abgeleitet);
  const bloecke = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive !== false && b.quelleId === satz.id);
  const benutzt = new Set(bloecke.map(b => b.bildDateiId).filter(Boolean));
  return {
    vorherDateien,
    /* Beide Aufrufe meinen DENSELBEN Auftrag — das ist der Nachweis,
       den vorher `seiten` erbrachte. */
    idA: a?.auftrag?.id || '', idB: b?.auftrag?.id || '',
    /* Und der serielle Fall: der erste legt an, der zweite findet. */
    idC: c?.auftrag?.id || '', idD: d?.auftrag?.id || '',
    ersterLegteAn: !c?.schon, zweiterFandIhn: !!d?.schon,
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
p('Beide Aufrufe meinen denselben Auftrag',
  !!doppelt.idA && doppelt.idA === doppelt.idB,
  doppelt.idA + ' / ' + doppelt.idB);
/* NACHGEMESSEN STATT BEHAUPTET, und die erste Fassung dieser Zeile lag
   falsch: sie erwartete, dass einer der beiden gleichzeitigen Aufrufe den
   anderen FINDET. Tut er nicht. Beide fragen `Auftraege.einer` — eine
   Ablage-Lesung —, bevor einer von beiden angelegt hat, und beide legen
   an. Was hier schützt, ist die KENNUNG: zweimal `anlegen` unter
   `pdfbild-<Original>` ergibt EINEN Satz, und die Pacht in
   `Store.auftragNehmen` gibt ihn nur einem Läufer. Der Beleg dafür steht
   darüber — zwei Bilder, keine Leiche. */
p('Der serielle Fall dagegen findet: der erste legt an',
  doppelt.ersterLegteAn, JSON.stringify(doppelt.ersterLegteAn));
p('Und der zweite hat ihn GEFUNDEN, nicht neu angelegt',
  doppelt.zweiterFandIhn, JSON.stringify(doppelt.zweiterFandIhn));
p('Auch sie meinen denselben Auftrag',
  !!doppelt.idC && doppelt.idC === doppelt.idD,
  doppelt.idC + ' / ' + doppelt.idD);

/* ==========================================================================
 * §5 · Der Fortschritt zählt EINE Sache (E116, seit E327 am Auftrag)
 * --------------------------------------------------------------------------
 * E116 räumte „Seite 80 von 1" ab: gezählt wurden zwei verschiedene Dinge
 * gegeneinander — die Nummer der Seite IM DOKUMENT gegen die Länge der
 * RESTLISTE. Die Zusage seither: beide Zahlen meinen dasselbe.
 *
 * WO DER SATZ HEUTE STEHT, hat sich mit E327 geändert. Vorher schrieb
 * `neuBerechnen` ihn selbst in einen Melder am Bildschirm; seither ist das
 * Zurückholen ein Auftrag, und sein Läufer schweigt mit Absicht — er läuft
 * dort, wo die Pacht liegt, und das muss nicht der Tab sein, in dem geklickt
 * wurde. Der Text reist als `auftrag.schritt` durch den Ereignisbus und wird
 * in JEDEM Tab angezeigt (Fenster aus E322).
 *
 * Diese Prüfung horcht deshalb dort, wo der Satz wirklich entsteht. Am
 * `#toast` zu lauschen wäre seit E327 grün gewesen, weil dort NIE etwas
 * ankommt — eine Prüfung, die nichts mehr messen kann, ist schlimmer als
 * keine.
 * ========================================================================*/
console.log('\n5 · Der Fortschritt zählt EINE Sache');

const zaehlung = await seite.evaluate(async () => {
  /* Mitschreiben, was der Läufer meldet. `auftrag.schritt` trägt
     `{id, art, schritt, schritte, text}` (maschine.ts:316). */
  const gesehen: string[] = [];
  const ab = Ereignisse.horche('auftrag.schritt', (d: any) => {
    if (d && d.art === 'pdf-bilder' && d.text) gesehen.push(String(d.text));
  });

  const s = (Object.values(Store.cache.blocks) as any[])
    .find(b => b.type === 'pdfseite' && b.quelleId && b.bildDateiId);
  if (!s) { ab(); return { keine: true, gesehen: [], name: '' }; }
  /* Das Bild der ZWEITEN Seite wegnehmen — dann ist genau eine offen, und
     ihre Nummer im Dokument ist 2, die Restliste aber 1 lang. Genau die
     Lage, in der „Seite 2 von 1" stand. */
  const zwei = (Object.values(Store.cache.blocks) as any[])
    .find(b => b.type === 'pdfseite' && b.quelleId === s.quelleId && Number(b.nr) === 2);
  if (zwei) Store.updateBlock(zwei.id, { bildDateiId: null });

  const erg = await PdfEinlesen.neuBerechnen(s.quelleId);
  const auftragsId = erg?.auftrag?.id || '';
  if (auftragsId) {
    const bis = Date.now() + 90000;
    for (;;) {
      const j = await Auftraege.einer(auftragsId);
      if (j && JobModell.beendet(j)) break;
      if (Date.now() > bis) { ab(); throw new Error('Auftrag wurde nicht fertig'); }
      await new Promise(r => setTimeout(r, 120));
    }
  }
  await new Promise(r => setTimeout(r, 120));
  ab();
  const satz = await Store.dateiHolen(s.quelleId);
  return { keine: false, gesehen, name: String(satz?.name || '') };
});

p('Es gab eine Seite zum Rechnen', !zaehlung.keine);
const fortschritt = (zaehlung.gesehen || [])
  .filter((t: string) => /Seite \d+ von \d+/.test(t));
p('Der Fortschritt hat gemeldet', fortschritt.length >= 1,
  JSON.stringify(zaehlung.gesehen));
p('Und nie mehr gezählt, als es zu rechnen gab',
  fortschritt.length >= 1 && fortschritt.every((t: string) => {
    const m = t.match(/Seite (\d+) von (\d+)/);
    return !!m && Number(m[1]) <= Number(m[2]);
  }), fortschritt.join(' | '));
/* DIE EINE OFFENE SEITE IST DIE ZWEITE VON ZWEIEN. Beide Zahlen sind die
   des Dokuments — die Restliste (1 lang) taucht in keiner davon auf. Diese
   Zeile ist der eigentliche Beleg gegen „Seite 2 von 1": wäre die zweite
   Zahl wieder die Restlistenlänge, stünde hier „von 1". */
gleich('Sie hiess „Seite 2 von 2"',
  fortschritt[0]?.replace(/^.*?Seite /, 'Seite '), 'Seite 2 von 2');
/* UND DER NAME DES DOKUMENTS STEHT IN JEDEM SCHRITT, nicht nur im ersten
   (E327). `hilfe.schritt(stand, text)` ERSETZT den Text; ohne diese Zusage
   stand im Auftragsfenster nach der ersten Seite nur noch eine nackte
   Zählung, und bei zwei laufenden Skripten sind zwei solche Zeilen nicht
   auseinanderzuhalten. Gefunden auf dem Bild, nicht von einem Prüflauf. */
p('Und jeder Schritt nennt das Dokument beim Namen',
  !!zaehlung.name && fortschritt.length >= 1 &&
  fortschritt.every((t: string) => t.includes(zaehlung.name)),
  zaehlung.name + ' — ' + fortschritt.join(' | '));

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
/* DIESE ZEILE PRÜFTE BIS E327 EINE MAP IM TAB — `laufendeRechnungen`. Die
   gibt es nicht mehr, und sie fehlt nicht: eine Sperre im Arbeitsspeicher
   eines Tabs hält gegen den zweiten Tab gar nichts. Seither steckt sie in
   der KENNUNG des Auftrags, und die liegt in der Ablage. Die Prüfung ist
   damit strenger geworden, nicht schwächer — aber sie musste mitziehen,
   sonst hätte sie nach dem Umbau nur noch das Fehlen von totem Code
   gemeldet. */
p('Der laufende Auftrag hängt an einer festen Kennung',
  /const auftragsId = \(quelleId: string\): string =>/.test(el) &&
  /'pdfbild-' \+ quelleId/.test(el));
p('Und `neuBerechnen` fragt sie ab, bevor es anlegt',
  /const schon = await Auftraege\.einer\(id\);/.test(el) &&
  /if \(schon && !JobModell\.beendet\(schon\)\) return \{ auftrag: schon, schon: true \};/.test(el));
p('Es gibt keine Sperre im Arbeitsspeicher mehr',
  !/laufendeRechnungen/.test(el));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
