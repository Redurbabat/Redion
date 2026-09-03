/* Suite 363 — Was ein langer Import kostet, steht vorher da (E373, L114 P7)
 * ============================================================================
 * BEFUND aus L114 Punkt 7: „Je Seite rund 0,35 s und 200 KB; vierzig Skripte
 * à 80 Seiten sind rund zwanzig Minuten im Tab. Der Fortschritt steht in der
 * Zeile; eine Schätzung VOR dem Start fehlt."
 *
 * Der Fortschritt sagt, WO man ist. Er sagt nicht, wie lange es noch dauert
 * — und das ist die Frage, die man vor dem Anfangen hat.
 *
 * §1 REIN: der Kern kennt weder Uhr noch Ablage noch DOM.
 * §2 RECHNEN von Hand nachgerechnet.
 * §3 SCHWEIGEN im Normalfall — die wichtigste Zusage dieses Bogens.
 * §4 DER SATZ ist deutsch, gerundet und nennt seine Grundlage.
 * §5 LERNEN: ein Lauf verschiebt die Zahl, zehn Läufe beruhigen sie.
 * §6 KAPUTTE ERFAHRUNG aus der Ablage macht nichts kaputt.
 * §7 AM ECHTEN IMPORT: die Schätzung steht am Auftrag.
 * §8 UND SIE SCHWEIGT bei drei Dateien auch dort.
 * §9 GELERNT WIRD aus dem, was wirklich passiert ist.
 * §10 BAU-HYGIENE.
 *
 *   node pruefungen/lauf/test363.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const ArchivImport: any;
declare const Austausch: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9387;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const QUELLE = path.join(WURZEL, 'src/core/jobs/estimate.ts');
const GEBAUT = path.join(WURZEL, 'quell/core/jobs/estimate.js');

(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(GEBAUT, 'utf-8'));
const S = (globalThis as any).Schaetzer;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Rein: weder Uhr noch Ablage noch DOM');

const quelle = fs.readFileSync(QUELLE, 'utf-8');
const code = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
p('Der Kern ist geladen',
  !!S && typeof S.schaetze === 'function' && typeof S.lerne === 'function');
gleich('Keine Uhr im Kern',
  ['new Date', 'Date.now', 'performance.now', 'setTimeout'].filter(w => code.includes(w)), []);
gleich('Keine Ablage im Kern',
  ['Store.', 'getMeta', 'setMeta', 'localStorage', 'indexedDB'].filter(w => code.includes(w)), []);
gleich('Kein DOM im Kern',
  ['document.', 'innerHTML', 'querySelector', 'addEventListener'].filter(w => code.includes(w)), []);

console.log('\n2 · Rechnen, von Hand nachgerechnet');

const e0 = S.frisch();
gleich('Die Art kommt aus dem Namen',
  ['a.pdf', 'b.PNG', 'c.md', 'd.csv', 'e.docx', 'f.bin'].map((n: string) => S.artVon(n)),
  ['pdf', 'bild', 'text', 'tabelle', 'office', 'sonst']);

/* Eine PDF von 2 MB bei 200 KB je Seite sind 10 Seiten. */
gleich('Seiten aus Bytes', S.seitenAus(2 * 1024 * 1024, e0), 10);
p('Nie null Seiten — ein PDF ohne Seite gibt es nicht', S.seitenAus(1, e0) === 1);

/* 10 Seiten × 350 ms + 40 ms fürs Öffnen = 3540 ms. Von Hand. */
const s2 = S.schaetze([{ art: 'pdf', bytes: 2 * 1024 * 1024 }], e0);
gleich('Eine PDF: Öffnen plus Seiten', s2.ms, 10 * 350 + 40);
gleich('Und die Seiten stehen dabei', s2.seiten, 10);

/* 100 Textdateien × 3.4 ms = 340 ms. */
const s2b = S.schaetze(Array.from({ length: 100 }, () => ({ art: 'text', bytes: 4000 })), e0);
gleich('Hundert Notizen sind billig', s2b.ms, 340);
gleich('Und haben keine Seiten', s2b.seiten, 0);

/* Redurs Fall aus L114: vierzig Skripte à 80 Seiten. */
const skripte = Array.from({ length: 40 }, () => ({ art: 'pdf', bytes: 80 * 200 * 1024 }));
const s2c = S.schaetze(skripte, e0);
gleich('Vierzig Skripte à 80 Seiten sind 3200 Seiten', s2c.seiten, 3200);
p('… und das sind rund neunzehn Minuten',
  Math.abs(s2c.ms / 60000 - 18.7) < 0.5, 'gerechnet ' + (s2c.ms / 60000).toFixed(1) + ' min');

console.log('\n3 · Im Normalfall SCHWEIGT die Schätzung');

/* DIE GEGENPROBE, DIE ES BRAUCHT. E284, E286, E288, E289 und E290 sind alle
   in dieselbe Falle gelaufen: eine Anzeige, die immer etwas anzeigt, wird
   nicht gelesen. Deshalb steht dieser Abschnitt vor allen anderen. */
gleich('Drei Bilder sagen nichts', S.satz(S.schaetze(
  [{ art: 'bild', bytes: 900000 }, { art: 'bild', bytes: 700000 }, { art: 'bild', bytes: 500000 }], e0)), '');
gleich('Fünfzig Notizen sagen nichts', S.satz(S.schaetze(
  Array.from({ length: 50 }, () => ({ art: 'text', bytes: 3000 })), e0)), '');
gleich('Eine kurze PDF sagt nichts', S.satz(S.schaetze(
  [{ art: 'pdf', bytes: 3 * 200 * 1024 }], e0)), '');
p('Aber vierzig Skripte sagen etwas', S.satz(s2c).length > 0);
p('Die Schwelle liegt bei zwanzig Sekunden', S.SCHWELLE_MS === 20000);
gleich('Genau an der Schwelle noch still', S.dauerSatz(19999), '');
p('Und einen Hauch darüber nicht mehr', S.dauerSatz(20001).length > 0);

console.log('\n4 · Der Satz ist deutsch, gerundet, und nennt seine Grundlage');

gleich('Eine halbe Minute', S.dauerSatz(25000), 'rund eine halbe Minute');
gleich('Vier Minuten', S.dauerSatz(4 * 60000), 'rund 4 Minuten');
gleich('Gut eine Stunde', S.dauerSatz(65 * 60000), 'gut eine Stunde');
gleich('Drei Stunden', S.dauerSatz(3 * 3600000), 'rund 3 Stunden');
p('Ohne echten Lauf steht die Vermutung dabei',
  S.satz(s2c).includes('noch ohne Messung'), S.satz(s2c));
const gelernt = S.lerne(e0, { jeArt: { text: { dateien: 10, ms: 40 } } });
p('Nach einem Lauf nicht mehr',
  !S.satz(S.schaetze(skripte, gelernt)).includes('noch ohne Messung'));
p('Der Satz nennt die Seiten, wenn es welche gibt',
  S.satz(s2c).includes('3200 PDF-Seiten'), S.satz(s2c));

console.log('\n5 · Lernen: erst schnell, dann ruhig');

/* Der erste Lauf zählt ganz — die Startzahl ist nur ein Anfang. */
const l1 = S.lerne(S.frisch(), { jeArt: { text: { dateien: 100, ms: 1000 } } });
gleich('Der erste Lauf ersetzt die Startzahl', Math.round(l1.jeDatei.text * 10) / 10, 10);
gleich('Und wird gezählt', l1.laeufe, 1);

/* Nach acht Läufen verschiebt einer noch ein Achtel. */
let l = S.frisch();
for (let i = 0; i < 12; i++) l = S.lerne(l, { jeArt: { text: { dateien: 10, ms: 100 } } });
gleich('Zwölf gleiche Läufe pendeln sich ein', Math.round(l.jeDatei.text), 10);
const vorher = l.jeDatei.text;
const nachAusreisser = S.lerne(l, { jeArt: { text: { dateien: 1, ms: 400 } } }).jeDatei.text;
p('Ein Ausreisser verschiebt nur ein Achtel',
  nachAusreisser > vorher && nachAusreisser < vorher + (400 - vorher) / 4,
  'von ' + vorher.toFixed(1) + ' auf ' + nachAusreisser.toFixed(1));

const mitPdf = S.lerne(S.frisch(),
  { pdf: { seiten: 100, bytes: 100 * 150 * 1024, ms: 100 * 500 } });
gleich('Die Seitenzeit kommt aus den Seiten, nicht aus den Dateien',
  Math.round(mitPdf.jeSeite), 500);
gleich('Und die Bytes je Seite auch', Math.round(mitPdf.bytesJeSeite / 1024), 150);
gleich('Ein Lauf ohne PDFs lässt die Seitenzahl in Ruhe',
  S.lerne(S.frisch(), { jeArt: { text: { dateien: 5, ms: 20 } } }).jeSeite, S.STARTWERT.jeSeite);

console.log('\n6 · Kaputte Erfahrung macht nichts kaputt');

const boese = S.ausAblage({ jeDatei: { text: -5, pdf: 'viel', bild: null },
                            jeSeite: 0, bytesJeSeite: 1e12, laeufe: -3 });
gleich('Negative Zahl fällt auf den Startwert', boese.jeDatei.text, S.STARTWERT.jeDatei.text);
gleich('Zeichenkette auch', boese.jeDatei.pdf, S.STARTWERT.jeDatei.pdf);
gleich('Null auch', boese.jeSeite, S.STARTWERT.jeSeite);
gleich('Negative Laufzahl wird null', boese.laeufe, 0);
p('Und gar nichts geht auch', S.ausAblage(null).laeufe === 0 &&
  S.ausAblage('unsinn').jeSeite === S.STARTWERT.jeSeite);
p('Ein Prototyp-Angriff kommt nicht durch',
  !(({} as any).__proto__.jeSeite) &&
  S.ausAblage(JSON.parse('{"__proto__":{"jeSeite":9}}')).jeSeite === S.STARTWERT.jeSeite);

/* ========================================================================= */
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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined' &&
  typeof (window as any).ArchivImport !== 'undefined' &&
  typeof (window as any).Schaetzer !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1100);

console.log('\n7 · Am echten Import: die Schätzung steht am Auftrag');

/* Eine ZIP mit vorgetäuschten PDFs: der Schätzer liest nur Name und
   Rohgrösse aus dem Verzeichnis, entpackt nichts und öffnet nichts. Genau
   das ist der Punkt — vor dem Start ist noch keine Seite gerendert. */
const gross = await seite.evaluate(async () => {
  const dateien: Array<{ name: string; inhalt: string }> = [];
  /* 12 „Skripte" à rund 1,6 MB = je 8 Seiten bei 200 KB — zusammen 96
     Seiten, also über der Schwelle. */
  for (let i = 0; i < 12; i++)
    dateien.push({ name: 'Skripte/Skript' + i + '.pdf', inhalt: 'x'.repeat(8 * 200 * 1024) });
  const blob = await Austausch.zipSchreiben(dateien);
  const f = new File([blob], 'Semester.zip', { type: 'application/zip' });
  const s = await ArchivImport.schaetzung(f, f.name);
  return { ms: s ? s.ms : 0, seiten: s ? s.seiten : 0, dateien: s ? s.dateien : 0, satz: s ? s.satz : null };
});
gleich('Zwölf Skripte werden gezählt', gross.dateien, 12);
gleich('Und ihre Seiten aus der Rohgrösse geschätzt', gross.seiten, 96);
p('Die Schätzung liegt über der Schwelle', gross.ms > 20000, gross.ms + ' ms');
p('Und der Satz nennt Seiten und Zeit',
  !!gross.satz && gross.satz.includes('96 PDF-Seiten') && gross.satz.includes('Minute'),
  String(gross.satz));

console.log('\n8 · Und sie schweigt bei drei Dateien auch dort');

const klein = await seite.evaluate(async () => {
  const dateien = [1, 2, 3].map(i => ({ name: 'Notizen/N' + i + '.md', inhalt: '# Titel ' + i }));
  const blob = await Austausch.zipSchreiben(dateien);
  const f = new File([blob], 'Kleinkram.zip', { type: 'application/zip' });
  const s = await ArchivImport.schaetzung(f, f.name);
  return { satz: s ? s.satz : null, dateien: s ? s.dateien : 0 };
});
gleich('Drei Dateien werden gezählt', klein.dateien, 3);
gleich('Aber es steht kein Satz da', klein.satz, '');

console.log('\n9 · Gelernt wird aus dem, was wirklich passiert ist');

const lernlauf = await seite.evaluate(async () => {
  Store.setMeta('importErfahrung', null);
  const vorher = ArchivImport.erfahrungLesen();
  const dateien = Array.from({ length: 25 }, (_, i) =>
    ({ name: 'Lern/Notiz' + i + '.md', inhalt: '# Notiz ' + i + '\n\nText.\n'.repeat(5) }));
  const blob = await Austausch.zipSchreiben(dateien);
  const f = new File([blob], 'Lernlauf.zip', { type: 'application/zip' });
  await ArchivImport.importZip(f, null, { still: true });
  const nachher = ArchivImport.erfahrungLesen();
  return { vorLaeufe: vorher.laeufe, nachLaeufe: nachher.laeufe,
           vorText: vorher.jeDatei.text, nachText: nachher.jeDatei.text,
           seiteUnveraendert: vorher.jeSeite === nachher.jeSeite };
});
gleich('Vorher gab es keinen Lauf', lernlauf.vorLaeufe, 0);
gleich('Nachher genau einen', lernlauf.nachLaeufe, 1);
p('Und die Textzahl ist eine gemessene, keine geerbte',
  lernlauf.nachText !== lernlauf.vorText,
  'vorher ' + lernlauf.vorText + ', nachher ' + lernlauf.nachText);
p('Die Seitenzahl blieb unangetastet — es waren keine PDFs dabei',
  lernlauf.seiteUnveraendert);

console.log('\n10 · Bau-Hygiene');

const js = fs.readFileSync(GEBAUT, 'utf-8');
const archiv = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/dateien/archiveImport.js'), 'utf-8');
p('Das erzeugte estimate.js gibt es', js.includes('ERZEUGT') && js.includes('Schaetzer'));
p('Die Herkunft jedes Startwerts steht in der Quelle',
  /GEMESSEN am 3\. September/.test(quelle) && /NICHT selbst gemessen/.test(quelle));
p('Der Import misst an der Arbeitsstelle, statt hinterher zu schätzen',
  /performance\.now\(\)/.test(archiv) && archiv.includes('buchen('));
p('Gelernt wird nur aus einem Lauf, der etwas getan hat',
  /!ergebnis\.abgebrochen && ergebnis\.dokumente > 0/.test(archiv.replace(/\s+/g, ' ')));
p('Die Datei steht im Dienststock und in index.html',
  fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8').includes('core/jobs/estimate.js') &&
  fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8').includes('core/jobs/estimate.js'));
p('Die Einzeldatei kennt den Schätzer',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8').includes('Schaetzer'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
