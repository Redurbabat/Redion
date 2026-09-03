/* Suite 285 — Das Dokument ist die Seite (E296)
 * ============================================================================
 * Redurs Satz war: „Ich will, dass die PDF nicht im Bereich sich öffnet, es
 * sollte so wie GoodNotes die PDF öffnen."
 *
 * Nachgesehen, was im Bild stand: über dem Arbeitsraum stand der ganze
 * Seitenkopf — ein Symbol in Emoji-Größe, der Titel als Überschrift und die
 * Werkzeugzeile „Cover · Volle Breite · Dokumentmodus". Auf 1440×900 nahm
 * das die oberen 380 der 900 Pixel. Darunter lag ein festes Dreispaltenraster
 * mit 190 px Miniaturen und 280 px Inspector, die auch dann standen, wenn sie
 * nichts zu sagen hatten. Der PDF-Seite blieb rund die Hälfte der Fläche, und
 * bei 100 % Zoom war sie so hoch wie die volle Breite der Mitte — also
 * dreimal höher als der Kasten, in dem sie lag.
 *
 * E296 dreht die Verhältnisse um: das Dokument IST die Seite.
 *
 *   §1 KEIN SEITENKOPF mehr — und der Titel geht trotzdem nicht verloren.
 *   §2 DIE GANZE SEITE passt ins Bild; erst der Zoom macht daraus Rollen.
 *   §3 DIE HÖHE MISST SICH SELBST, auch nach einer Fensteränderung.
 *   §4 BEIDE SEITENSPALTEN: zu, auf, und wieder zu.
 *   §5 EINE FRISCH EINGELESENE PDF öffnet als Dokument — beim ersten Mal.
 *   §6 DAS SCHLOSS steht da, wenn es etwas zu sagen hat, und sonst nicht.
 *   §7 AM TELEFON steht kein abgeschnittener Name in der Kopfzeile.
 *
 *   node pruefungen/lauf/test285.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9067;

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

/* Eine echte, kleine PDF — nach dem Bauer aus test177, auf eine Seite
   gekürzt. Keine Attrappe: sie geht durch denselben pdf.js, der auch Redurs
   Vorlesungsskripte liest. */
const machPdf = (): Buffer => {
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const strom = ['BT /F1 30 Tf 60 740 Td (Grundlagen) Tj ET',
                 'BT /F1 16 Tf 60 700 Td (Ohmsches Gesetz) Tj ET',
                 '2 w 30 30 535 782 re S'].join('\n');
  const roh = Buffer.from(strom, 'latin1');
  const inhalt = neu(Buffer.concat([
    Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
    Buffer.from('\nendstream', 'latin1')]));
  const kind = neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
    `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`);
  objekte[seitenNr - 1] = Buffer.from(
    `<< /Type /Pages /Count 1 /Kids [${kind} 0 R] >>`, 'latin1');
  const wurzel = neu(`<< /Type /Catalog /Pages ${seitenNr} 0 R >>`);

  let aus = Buffer.from('%PDF-1.4\n', 'latin1');
  const stellen: number[] = [];
  objekte.forEach((o, i) => {
    stellen.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), o,
                         Buffer.from('\nendobj\n', 'latin1')]);
  });
  const xref = aus.length;
  let tab = `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  stellen.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  tab += `trailer\n<< /Size ${objekte.length + 1} /Root ${wurzel} 0 R >>\n` +
         `startxref\n${xref}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};
const PDF_HEX = machPdf().toString('hex');

const browser = await chromium.launch();
const fehler: string[] = [];

/* Vier Seiten mit Dokumentblöcken, im Dokumentmodus geöffnet. Ohne echte
   Seitenbilder — die Miniaturen zeigen dann „PDF", was für die Masse
   unerheblich ist und den Lauf um zwanzig Sekunden kürzt. */
const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const s = Store.addPage(null, { text: 'Elektrotechnik – Skript', icon: '📕' });
  for (let nr = 1; nr <= 4; nr++)
    Store.addBlock(s.id, 'pdfseite', { text: '', suchtext: 'Ohm', nr, vonSeiten: 4,
      bw: 595, bh: 842, quelleId: 'skript-1' });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1400));
  return s.id;
})()`;

const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR (Rechner): ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
const seitenId = await pc.evaluate(AUFBAU) as string;
await pc.waitForSelector('.document-workspace', { timeout: 20000 });

/* ==========================================================================
 * §1 · Kein Seitenkopf mehr — und der Name geht trotzdem nicht verloren
 * --------------------------------------------------------------------------
 * §55.2 — kann das rot werden? Vor E296 hingen unter `#page` vier Kinder:
 * `pg-icon`, `title`, `pg-tools` und der Arbeitsraum. Die erste Zeile wäre
 * gefallen. Und der Titel stand nirgends in der Dokumentkopfzeile, also auch
 * die dritte.
 * ========================================================================*/
console.log('\n1 · Kein Seitenkopf mehr — und der Name bleibt');

const eins = await pc.evaluate(() => {
  const seite = document.getElementById('page');
  const titel = document.querySelector('.document-title') as HTMLElement | null;
  return {
    kinder: [...(seite?.children || [])].map(e => (e as HTMLElement).id ||
      String((e as HTMLElement).className).split(' ')[0]),
    seitenklasse: String(seite?.className || ''),
    titelText: (titel?.textContent || '').trim(),
    titelBreit: Math.round(titel?.getBoundingClientRect().width || 0)
  };
});

gleich('Unter der Seite hängt genau ein Kind: der Arbeitsraum',
  eins.kinder, ['document-workspace']);
p('Und die Seite trägt die Dokumentklasse',
  /document-page/.test(eins.seitenklasse), eins.seitenklasse);
gleich('Der Name steht in der Kopfzeile des Dokuments',
  eins.titelText, 'Elektrotechnik – Skript');
p('Und ist dort wirklich zu sehen', eins.titelBreit > 80, `${eins.titelBreit} px`);

/* Die Gegenprobe: dieselbe Seite OHNE Dokumentmodus hat den Kopf, und dann
   gibt es dort keine Dokumentkopfzeile. Ohne diesen Arm wäre §1 auch grün,
   wenn der Kopf überall fehlte — und das wäre ein Verlust, kein Gewinn. */
const gegen = await pc.evaluate(async (id: string) => {
  Store.updateBlock(id, { dokumentModus: false });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  const seite = document.getElementById('page');
  const namen = [...(seite?.children || [])].map(e => (e as HTMLElement).id ||
    String((e as HTMLElement).className).split(' ')[0]);
  Store.updateBlock(id, { dokumentModus: true });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 900));
  return { namen, docTitelDanach: !!document.querySelector('.document-title') };
}, seitenId);

p('GEGENPROBE: ohne Dokumentmodus steht der Kopf wieder da',
  ['pg-icon', 'title', 'pg-tools'].every(n => gegen.namen.includes(n)),
  gegen.namen.join(', '));
p('Und der Arbeitsraum ist dann weg',
  !gegen.namen.includes('document-workspace'), gegen.namen.join(', '));
p('Zurück im Dokumentmodus steht die Kopfzeile wieder', gegen.docTitelDanach);

/* ==========================================================================
 * §2 · DIE ROLLE: alle Seiten untereinander, die Breite gibt das Mass (E299)
 * --------------------------------------------------------------------------
 * DIESER ABSCHNITT HAT SEINE BEHAUPTUNG GEWECHSELT, und das ist der Punkt.
 *
 * E296 baute den Dokumentmodus so, dass EINE Seite ganz ins Bild passt und
 * `‹ ›` die naechste holt. Redur hat danach gesagt, was er wirklich will:
 *
 *     „ich sollte wie one note unendlich schrolen haben … pdf sollte ich
 *      weder nach unten noch nach rechts die seite wechseln koennen … die
 *      pdf seiten sollte wie goodnotes sich ganz oeffnen komplett wie one
 *      note so"
 *
 * Ein Skript liest man durch. Die Rolle traegt deshalb ALLE Seiten
 * untereinander, und die BREITE gibt das Mass — auf Fensterhoehe geschrumpft
 * (432 px von 1360) liest sich kein Text.
 *
 * DIE SEITEN, DIE MAN NICHT SIEHT, WERDEN NICHT GEZEICHNET. Achtzig
 * Zeichenschichten auf einmal sind kein Dokument mehr, sondern ein stehender
 * Browser. Jede bekommt zuerst nur ihren Platz in der richtigen Hoehe.
 *
 * §55.2 — kann das rot werden? Jeder Punkt hier war vor E299 rot: es gab
 * genau einen `.document-stage`, die Rollhoehe war die Fensterhoehe, und das
 * Blatt hatte 432 px statt 1324.
 * ========================================================================*/
console.log('\n2 · Die Rolle: alle Seiten untereinander');

const zwei = await pc.evaluate(() => {
  const mitte = document.querySelector('.document-center') as HTMLElement | null;
  const papier = document.querySelector('.document-stage .blatt-papier') as HTMLElement | null;
  const leiste = document.querySelector('.document-stage .blatt-reihe') as HTMLElement | null;
  return {
    staende: document.querySelectorAll('.document-stage').length,
    gezeichnet: document.querySelectorAll('.document-stage .blatt-papier').length,
    mitteHoch: mitte?.clientHeight || 0,
    mitteBreit: mitte?.clientWidth || 0,
    rollHoch: mitte?.scrollHeight || 0,
    papierHoch: Math.round(papier?.getBoundingClientRect().height || 0),
    papierBreit: Math.round(papier?.getBoundingClientRect().width || 0),
    leisteHoch: Math.round(leiste?.getBoundingClientRect().height || 0),
    original: (document.querySelector('.document-original')?.textContent || '').trim()
  };
});

gleich('Für jede der vier Seiten steht ein Platz in der Rolle', zwei.staende, 4);
gleich('Gezeichnet ist aber nur die erste — der Rest wartet auf den Blick',
  zwei.gezeichnet, 1);
p('Es gibt ein Blatt mit echter Ausdehnung',
  zwei.papierHoch > 200 && zwei.papierBreit > 140, JSON.stringify(zwei));
p('Das Seitenverhältnis stimmt noch (A4)',
  Math.abs(zwei.papierBreit / zwei.papierHoch - 595 / 842) < 0.02,
  `${zwei.papierBreit}/${zwei.papierHoch}`);
p('Die BREITE gibt das Mass — das Blatt füllt die Mitte fast ganz',
  zwei.papierBreit >= zwei.mitteBreit - 60,
  `${zwei.papierBreit} px von ${zwei.mitteBreit} px`);
p('Und man rollt wirklich: die Rolle ist höher als das Fenster',
  zwei.rollHoch > zwei.mitteHoch * 2,
  `Inhalt ${zwei.rollHoch}, sichtbar ${zwei.mitteHoch}`);
p('Ganz oben steht das Original', /Original/.test(zwei.original), zwei.original);
p('Die Zeichenleiste passt in eine oder zwei Zeilen',
  zwei.leisteHoch > 0 && zwei.leisteHoch < 130, `${zwei.leisteHoch} px`);

/* Und beim Rollen wird nachgezogen — das ist der Kern des Ganzen. */
const gerollt = await pc.evaluate(async () => {
  const mitte = document.querySelector('.document-center') as HTMLElement;
  mitte.scrollTop = mitte.scrollHeight * 0.6;
  await new Promise(r => setTimeout(r, 800));
  return {
    gezeichnet: document.querySelectorAll('.document-stage .blatt-papier').length,
    position: (document.querySelector('.document-position')?.textContent || ''),
    markiert: (document.querySelector('.document-thumbnail.is-selected')?.textContent || '').trim()
  };
});

p('Beim Rollen kommen weitere Seiten dazu', gerollt.gezeichnet > 1,
  String(gerollt.gezeichnet));
p('Die Seitenzahl folgt dem Blick — ohne dass man geblättert hätte',
  !/Seite 1\//.test(gerollt.position), gerollt.position);
p('Und die Miniatur daneben auch', /Seite [2-9]/.test(gerollt.markiert),
  gerollt.markiert);

/* `‹ ›` wechseln nichts mehr, sie SPRINGEN. */
const gesprungen = await pc.evaluate(async () => {
  const mitte = document.querySelector('.document-center') as HTMLElement;
  mitte.scrollTop = 0;
  await new Promise(r => setTimeout(r, 400));
  const vorRoll = mitte.scrollTop;
  (document.querySelector('[data-document-action="next"]') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 900));
  return { vorRoll, nachRoll: mitte.scrollTop,
           staende: document.querySelectorAll('.document-stage').length,
           position: (document.querySelector('.document-position')?.textContent || '') };
});

p('Das › rollt zur nächsten Seite, statt die Ansicht zu wechseln',
  gesprungen.nachRoll > gesprungen.vorRoll + 100,
  `${gesprungen.vorRoll} → ${gesprungen.nachRoll}`);
gleich('Und alle vier Plätze stehen dabei weiter da', gesprungen.staende, 4);
p('Die Anzeige sagt jetzt Seite 2', /Seite 2\//.test(gesprungen.position),
  gesprungen.position);

const gezoomt = await pc.evaluate(async () => {
  const mitte = document.querySelector('.document-center') as HTMLElement;
  mitte.scrollTop = 0;
  const regler = document.querySelector('[data-document-zoom]') as HTMLInputElement | null;
  if (!regler) return null;
  const vorher = Math.round(
    document.querySelector('.blatt-papier')!.getBoundingClientRect().width);
  regler.value = '60';
  regler.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  const gemessen = { vorher, schmal: Math.round(
    document.querySelector('.blatt-papier')!.getBoundingClientRect().width) };
  regler.value = '100';
  regler.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  return gemessen;
});

p('GEGENPROBE: mit 60 % wird das Blatt schmaler', !!gezoomt &&
  gezoomt.schmal < gezoomt.vorher - 100, JSON.stringify(gezoomt));
gleich('Der Zoom hat die Dokumentkoordinate nicht angefasst',
  await pc.evaluate(() => Store.childrenOf(
    document.querySelector<HTMLElement>('.document-workspace')!.dataset['pageId']!)[0].bw), 595);

/* ==========================================================================
 * §3 · Die Höhe misst sich selbst
 * --------------------------------------------------------------------------
 * In der CSS stand `calc(100vh - 150px)`; die 150 waren der Seitenkopf plus
 * die Leisten darüber. Der Kopf ist weg, also wäre jede feste Zahl eine
 * andere Lücke — und sie wäre schon vorher falsch geworden, sobald das
 * Menüband einmal umbricht. Der Arbeitsraum fragt jetzt, wo er anfängt.
 *
 * §55.2 — kann das rot werden? Ja, in beide Richtungen: eine zu kleine Zahl
 * lässt unten einen Streifen stehen, eine zu grosse schiebt das Fenster über
 * den Rand. Der zweite Arm ändert die Fenstergrösse und misst erneut; ohne
 * den Rollstand-Griff bliebe die alte Höhe stehen.
 * ========================================================================*/
console.log('\n3 · Die Höhe misst sich selbst');

const messeRaum = () => pc.evaluate(() => {
  const raum = document.querySelector('.document-workspace') as HTMLElement | null;
  const r = raum?.getBoundingClientRect();
  return { unten: Math.round(r?.bottom || 0), fenster: window.innerHeight,
           hoch: Math.round(r?.height || 0),
           ueberlaufY: document.documentElement.scrollHeight - document.documentElement.clientHeight };
});

const hoch900 = await messeRaum();
p('Der Arbeitsraum endet dicht über dem unteren Fensterrand',
  hoch900.fenster - hoch900.unten >= 0 && hoch900.fenster - hoch900.unten <= 24,
  `${hoch900.fenster - hoch900.unten} px Rest`);
p('Und die Seite rollt dabei nicht senkrecht', hoch900.ueberlaufY <= 1,
  `${hoch900.ueberlaufY} px`);

await pc.setViewportSize({ width: 1440, height: 700 });
await pc.waitForTimeout(350);
const hoch700 = await messeRaum();
p('Nach dem Verkleinern des Fensters stimmt es wieder',
  hoch700.fenster - hoch700.unten >= 0 && hoch700.fenster - hoch700.unten <= 24,
  `${hoch700.fenster - hoch700.unten} px Rest bei ${hoch700.fenster}`);
p('GEGENPROBE: der Arbeitsraum ist dabei WIRKLICH kleiner geworden',
  hoch700.hoch < hoch900.hoch - 100, `${hoch900.hoch} → ${hoch700.hoch}`);
await pc.setViewportSize({ width: 1440, height: 900 });
await pc.waitForTimeout(350);

/* ==========================================================================
 * §4 · Beide Seitenspalten: zu, auf, und wieder zu
 * --------------------------------------------------------------------------
 * Der Schliessknopf in den Panels war am Rechner mit `display:none`
 * ausgeblendet — dort standen die Spalten ja dauerhaft. Jetzt holt man sie,
 * und dann muss man sie auch weglegen können (§47).
 * ========================================================================*/
console.log('\n4 · Beide Seitenspalten: zu, auf, wieder zu');

/* Der Rundgang meldet sich nach ein paar Sekunden von selbst und faengt
   dann jeden Klick ab („intercepts pointer events"). `rundgangGesehen` war
   beim Aufbau noch nicht gesetzt, als er eingeplant wurde. */
const aufraeumen = () => pc.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
});

const sicht = (wahl: string) => pc.evaluate((w: string) => {
  const el = document.querySelector(w) as HTMLElement | null;
  const r = el?.getBoundingClientRect();
  return { da: !!el, breit: Math.round(r?.width || 0), links: Math.round(r?.left || 0),
           rechts: Math.round(r?.right || 0) };
}, wahl);

const grundMitte = await sicht('.document-center');
const grundRaum = await sicht('.document-workspace');
p('In der Grundstellung bekommt die Mitte den ganzen Arbeitsraum',
  grundMitte.breit >= grundRaum.breit - 4,
  `Mitte ${grundMitte.breit} im Raum ${grundRaum.breit}`);
gleich('Und keine der Spalten liegt offen',
  [(await sicht('.document-thumbnails.is-open')).da,
   (await sicht('.document-inspector.is-open')).da], [false, false]);

await aufraeumen();
await pc.click('.document-topbar [data-document-action="thumbnails"]');
await pc.waitForSelector('.document-thumbnails.is-open', { timeout: 8000 });
await pc.waitForTimeout(250);
const mitMini = await sicht('.document-center');
const mini = await sicht('.document-thumbnails.is-open');
p('Das ☰ holt die Miniaturen — und sie stehen links vom Dokument',
  mini.breit > 100 && mini.rechts <= mitMini.links + 2,
  `${JSON.stringify(mini)} vs ${JSON.stringify(mitMini)}`);
p('Die Mitte wird dafür schmaler statt überdeckt',
  mitMini.breit < grundMitte.breit - 100,
  `${grundMitte.breit} → ${mitMini.breit}`);

await aufraeumen();
await pc.click('.document-thumbnails.is-open [data-document-action="thumbnails-close"]');
await pc.waitForTimeout(350);
gleich('Und das ✕ im Panel legt sie wieder weg',
  (await sicht('.document-thumbnails.is-open')).da, false);
gleich('Danach hat die Mitte wieder den ganzen Raum',
  (await sicht('.document-center')).breit >= grundRaum.breit - 4, true);

await aufraeumen();
await pc.click('.document-topbar [data-document-action="inspector"]');
await pc.waitForSelector('.document-inspector.is-open', { timeout: 8000 });
await pc.waitForTimeout(250);
const mitInsp = await sicht('.document-center');
const insp = await sicht('.document-inspector.is-open');
p('Das ⓘ holt den Inspector — und er steht rechts vom Dokument',
  insp.breit > 150 && insp.links >= mitInsp.rechts - 2,
  `${JSON.stringify(insp)} vs ${JSON.stringify(mitInsp)}`);
await aufraeumen();
await pc.click('.document-inspector.is-open [data-document-action="inspector-close"]');
await pc.waitForTimeout(350);
gleich('Und das ✕ darin legt ihn wieder weg',
  (await sicht('.document-inspector.is-open')).da, false);

/* ==========================================================================
 * §6 · Das Schloss steht da, wenn es etwas zu sagen hat
 * --------------------------------------------------------------------------
 * Der Hinweis „Diese Seite ist gegen Bearbeiten gesperrt" stand im
 * Seitenkopf. Der ist weg — also muss die Auskunft mitgehen, sonst ist das
 * ein stiller Verlust.
 *
 * §55.2 — die Gegenprobe ist hier die WICHTIGERE Hälfte. Ein Schloss, das
 * bei jeder Seite steht, sagt nichts; das ist die Regel, an der E284, E286,
 * E288, E289 und E290 gestolpert sind.
 * ========================================================================*/
console.log('\n6 · Das Schloss steht da, wenn es etwas zu sagen hat');

const schloss = await pc.evaluate(async (id: string) => {
  const lies = () => {
    const el = document.querySelector('.document-locked') as HTMLElement | null;
    return { da: !!el, text: (el?.textContent || '').trim(),
             sprechblase: el?.getAttribute('title') || '' };
  };
  const ohne = lies();
  Store.updateBlock(id, { gesperrt: true });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  const mit = lies();
  Store.updateBlock(id, { gesperrt: false });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  return { ohne, mit, wiederOhne: lies() };
}, seitenId);

gleich('GEGENPROBE: bei einer gewöhnlichen Seite steht kein Schloss da',
  schloss.ohne.da, false);
p('Bei einer gesperrten Seite schon', schloss.mit.da);
p('Und nicht nur als Zeichen — das Wort steht daneben (§38)',
  /Gesperrt/.test(schloss.mit.text), schloss.mit.text);
p('Die Sprechblase sagt, wie man sie wieder freigibt',
  /Normale Seite/.test(schloss.mit.sprechblase), schloss.mit.sprechblase);
gleich('Nach dem Freigeben ist es wieder weg', schloss.wiederOhne.da, false);

/* ==========================================================================
 * §5 · Eine frisch eingelesene PDF öffnet als Dokument
 * --------------------------------------------------------------------------
 * Der ganze Weg, wie Redur ihn geht: die Datei fällt auf die Seite. Nicht
 * `PdfEinlesen.alsSeiten` direkt — das prüfte den Umwandler und liesse die
 * Verdrahtung offen (derselbe Grund wie in test177 §2).
 *
 * §55.2 — der zweite Arm ist die Bedingung, die den Griff erträglich macht:
 * wer den Dokumentmodus einmal VERLASSEN hat, wird beim nächsten Einlesen
 * nicht wieder hineingezogen. Eine Ansicht, die sich gegen die Entscheidung
 * des Nutzers wieder einschaltet, ist keine Hilfe (§47).
 * ========================================================================*/
console.log('\n5 · Eine frisch eingelesene PDF öffnet als Dokument');

const einlesen = async (hex: string): Promise<void> => {
  await pc.evaluate((h: string) => {
    const bytes = Uint8Array.from((h.match(/../g) || []).map(x => parseInt(x, 16)));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'skript.pdf', { type: 'application/pdf' }));
    document.getElementById('scroll')!.dispatchEvent(
      new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, hex);
  const wahl = pc.locator('.overlay [data-w="untereinander"]');
  try { await wahl.waitFor({ timeout: 8000 }); await wahl.click(); }
  catch { /* ohne Anordnungsfrage geht es direkt weiter */ }
};

const frisch = await pc.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Vorlesung 3', icon: '📄' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  return s.id;
}) as string;
await pc.waitForFunction(() => !!document.getElementById('scroll'), null, { timeout: 15000 });

await einlesen(PDF_HEX);
await pc.waitForFunction(
  (id: string) => Store.childrenOf(id).some((b: any) => b.type === 'pdfseite'),
  frisch, { timeout: 40000 });
await pc.waitForTimeout(900);

const nachEinlesen = await pc.evaluate((id: string) => ({
  modus: Store.getBlock(id)?.dokumentModus === true,
  arbeitsraum: !!document.querySelector('.document-workspace'),
  seiten: Store.childrenOf(id).filter((b: any) => b.type === 'pdfseite').length
}), frisch);

p('Aus der PDF ist mindestens eine Seite geworden', nachEinlesen.seiten >= 1,
  String(nachEinlesen.seiten));
p('Die Seite steht danach auf Dokumentmodus', nachEinlesen.modus);
p('Und der Arbeitsraum ist wirklich zu sehen', nachEinlesen.arbeitsraum);

/* Und jetzt die Bedingung: wer ihn verlassen hat, bleibt draussen. */
await pc.evaluate(async (id: string) => {
  Store.updateBlock(id, { dokumentModus: false });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 600));
}, frisch);
await einlesen(PDF_HEX);
await pc.waitForFunction(
  (id: string) => Store.childrenOf(id).filter((b: any) => b.type === 'pdfseite').length >= 2,
  frisch, { timeout: 40000 });
await pc.waitForTimeout(900);

const zweitesMal = await pc.evaluate((id: string) => ({
  modus: Store.getBlock(id)?.dokumentModus,
  arbeitsraum: !!document.querySelector('.document-workspace')
}), frisch);

gleich('GEGENPROBE: nach dem Verlassen bleibt es beim zweiten Einlesen aus',
  zweitesMal.modus, false);
gleich('Und der Arbeitsraum kommt nicht von selbst zurück',
  zweitesMal.arbeitsraum, false);

/* ==========================================================================
 * §7 · Am Telefon steht kein abgeschnittener Name in der Kopfzeile
 * --------------------------------------------------------------------------
 * Mit Augen gefunden (§55.1): auf 390 px blieben dem Titel rund dreissig
 * Pixel, und er stand als „E." da — derselbe Fehler wie die abgeschnittene
 * Zahl beim Tabellenblock, wo aus 634 eine 34 wurde. Ein abgeschnittener
 * Name ist schlimmer als keiner. Er steht ohnehin eine Zeile darüber im Pfad.
 *
 * Dazu ein zweiter Fund: das Zoom-Label „100 %" stand da, obwohl der Regler
 * dazu am Telefon ausgeblendet ist — eine Anzeige ohne Griff (§47).
 * ========================================================================*/
console.log('\n7 · Am Telefon');

const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2700);
await handy.evaluate(AUFBAU);
await handy.waitForSelector('.document-workspace', { timeout: 20000 });

const telefon = await handy.evaluate(() => {
  const breit = (w: string) => Math.round(
    (document.querySelector(w) as HTMLElement | null)?.getBoundingClientRect().width || 0);
  const kopf = document.querySelector('.document-topbar') as HTMLElement | null;
  const k = kopf?.getBoundingClientRect();
  return {
    titel: breit('.document-title'), zoomLabel: breit('.document-zoom-label'),
    regler: breit('[data-document-zoom]'),
    kopfRechts: Math.round(k?.right || 0), fenster: window.innerWidth,
    /* NUR DIE SICHTBAREN (E384). Seit `‹ ›` am Telefon aus der Leiste
       fallen, standen zwei Nullen in der Liste — und §37 misst Daumen-
       flaechen, also das, was man wirklich treffen kann. Ein Knopf, den es
       nicht gibt, ist kein zu kleiner Knopf. */
    knoepfe: [...document.querySelectorAll<HTMLElement>('.document-topbar button')]
      .filter(b => b.offsetParent !== null)
      .map(b => Math.round(Math.min(b.getBoundingClientRect().width,
                                    b.getBoundingClientRect().height))),
    mitte: breit('.document-center'),
    ueberlaufX: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
});

/* SEIT E384 STEHT ER DA — und das ist die Behebung, nicht der Rueckfall.
   Hier stand `gleich(…, telefon.titel, 0)`, mit dem Grund von E296: auf
   390 px blieben ihm dreissig Pixel, er stand als „E." im Bild, „und er
   steht ohnehin eine Zeile darueber im Pfad". Dieser Pfad ist die Brotkrume
   in `#topbar`, und die faellt seit E384 im Dokumentmodus weg — ohne
   Gegenmassnahme hiesse das Dokument am Telefon nirgends mehr beim Namen.
   E384 macht ihm Platz (`‹ ›` gehen dafuer) und misst 115 statt 30. */
p('Der Name des Dokuments steht am Telefon in der Leiste',
  telefon.titel > 0, 'Breite: ' + telefon.titel);
p('Und breit genug für einen Namen statt für „E."',
  telefon.titel > 100, 'Breite: ' + telefon.titel);
gleich('Und das Zoom-Label auch nicht — es gibt keinen Regler dazu',
  [telefon.zoomLabel, telefon.regler], [0, 0]);
p('Die Kopfzeile bleibt im Bild',
  telefon.kopfRechts <= telefon.fenster + 1,
  `${telefon.kopfRechts} von ${telefon.fenster}`);
p('Ihre Knöpfe sind mindestens 44 px gross (§37)',
  telefon.knoepfe.length >= 4 && telefon.knoepfe.every(x => x >= 44),
  JSON.stringify(telefon.knoepfe));
p('Das Dokument bekommt fast die ganze Breite', telefon.mitte >= 350,
  `${telefon.mitte} von 390 px`);
p('Und nichts läuft seitlich über', telefon.ueberlaufX <= 1, `${telefon.ueberlaufX} px`);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
