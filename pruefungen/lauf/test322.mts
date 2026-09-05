/* Suite 322 — Die Lückensuche lernt Absicht und Alter (L105 Punkt 4 und 5, E329)
 * ============================================================================
 * Zwei der sechs Arten waren schwach, und beide aus demselben Grund: ihnen
 * fehlte eine Angabe, die es längst gab.
 *
 *   Punkt 4: „‚Wichtig, aber verstaubt' kennt keine Absicht. Ein Archiv ist
 *            verstaubt, weil es ein Archiv ist. Redion weiss nicht, welche
 *            Seiten fertig sind; ein Feld dafür gibt es nicht."
 *
 *            Das zweite stimmte nicht. `gesperrt` gibt es seit langem —
 *            `editor.ts` liest es, in den Einstellungen steht der Schalter
 *            „Seite gegen Bearbeiten gesperrt". Nur fragte die Lückensuche
 *            nie danach.
 *
 *   Punkt 5: „Die dünnen Themen sind die schwächste Art. Sie stehen
 *            absichtlich unter der Schwelle und werden nie gezählt. Damit
 *            sind sie beinahe Zierde — entweder sie bekommen eine bessere
 *            Regel (etwa: ein Schlagwort, das einmal vorkommt UND älter als
 *            ein Vierteljahr ist), oder sie entfallen."
 *
 *   §1 EINE GESPERRTE SEITE VERSTAUBT NICHT — und eine offene schon.
 *   §2 EINE GESPERRTE INSEL BLEIBT EINE INSEL. Fertig heisst nicht auffindbar.
 *   §3 EIN FRISCHES SCHLAGWORT zählt nicht, ein liegengebliebenes schon.
 *   §4 DER DECKEL IST AN DER INSEL GEEICHT, nicht am Geist — der erste
 *      Anlauf eichte falsch, und §4 sagte es sofort.
 *   §5 GEGENPROBE: ohne gesperrte Seite und ohne altes Schlagwort ändert
 *      sich gegenüber vorher gar nichts.
 *   §6 AM LAUFENDEN PROGRAMM: das Feld kommt wirklich bis in den Kern.
 *
 *   node pruefungen/lauf/test322.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const KnowledgeGaps: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9520;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

const JETZT = Date.UTC(2026, 8, 1, 12, 0, 0);
const TAG = 86400000;

const kern = await pc.evaluate(({ jetzt, TAG }: { jetzt: number; TAG: number }) => {
  const vorTagen = (n: number) => new Date(jetzt - n * TAG).toISOString();

  /* Zwei wichtige Seiten, beide seit 200 Tagen nicht angefasst. Die eine
     ist gesperrt, die andere nicht. Sonst sind sie gleich. */
  const seiten = [
    { id: 'a', titel: 'Fertiges Archiv', text: '', edited: vorTagen(200),
      grad: 3, rang: 80, gesperrt: true },
    { id: 'b', titel: 'Liegengeblieben', text: '', edited: vorTagen(200),
      grad: 3, rang: 80, gesperrt: false },
    /* Zwei Inseln, beide gesperrt bzw. offen — für §2. */
    { id: 'i1', titel: 'Gesperrte Insel', text: '', edited: vorTagen(200),
      grad: 0, rang: 5, gesperrt: true },
    { id: 'i2', titel: 'Offene Insel', text: '', edited: vorTagen(200),
      grad: 0, rang: 5, gesperrt: false },
    /* Zwei Träger für Schlagwörter: einer frisch, einer alt. */
    { id: 'f', titel: 'Frisch', text: '', edited: vorTagen(3), grad: 2, rang: 10 },
    { id: 'g', titel: 'Alt', text: '', edited: vorTagen(200), grad: 2, rang: 10 }
  ];
  const themen = [
    { tag: 'frischesthema', seiten: ['f'] },
    { tag: 'altesthema', seiten: ['g'] }
  ];
  const befund = KnowledgeGaps.finden(seiten, [], themen, { jetzt });

  const nachArt = (art: string) => befund.funde.filter((f: any) => f.art === art);

  /* Und dieselbe Lage OHNE Sperre und OHNE altes Schlagwort — die
     Gegenprobe für §5. */
  const ohne = KnowledgeGaps.finden(
    seiten.map(s => ({ ...s, gesperrt: false })),
    [], [{ tag: 'frischesthema', seiten: ['f'] }], { jetzt });

  return {
    verstaubt: nachArt('verstaubt').map((f: any) => f.titel),
    inseln: nachArt('insel').map((f: any) => f.titel),
    themen: nachArt('thema').map((f: any) => ({
      titel: f.titel, staerke: f.staerke, satz: f.satz })),
    schwelle: KnowledgeGaps.VORGABE.schwelle,
    themaTage: KnowledgeGaps.THEMA_TAGE,
    /* Für §4: ein Geist ist immer stärker als ein einsames Schlagwort. */
    geistZwei: KnowledgeGaps.staerkeGeist(2),
    themaMax: KnowledgeGaps.staerkeThema(100000),
    inselMax: KnowledgeGaps.staerkeInsel(100000),
    ohneVerstaubt: ohne.funde.filter((f: any) => f.art === 'verstaubt').length,
    ohneThemaGezaehlt: ohne.funde
      .filter((f: any) => f.art === 'thema' && f.staerke >= KnowledgeGaps.VORGABE.schwelle).length
  };
}, { jetzt: JETZT, TAG });

/* ------------------------------------------------------------------------ */
console.log('\n1 · Eine gesperrte Seite verstaubt nicht');

/* BEIDE SEITEN SIND GLEICH ALT UND GLEICH WICHTIG. Der einzige Unterschied
   ist die Sperre — also muss der einzige Unterschied im Ergebnis genau
   daher kommen. */
gleich('Nur die offene Seite gilt als verstaubt',
  kern.verstaubt, ['Liegengeblieben']);
p('Das gesperrte Archiv steht NICHT dabei',
  !kern.verstaubt.includes('Fertiges Archiv'), JSON.stringify(kern.verstaubt));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Eine gesperrte Insel bleibt eine Insel');

/* HIER GILT DIE SPERRE AUSDRÜCKLICH NICHT. „Fertig" heisst nicht
   „auffindbar" — eine Seite, auf die kein Verweis zeigt, findet niemand,
   auch wenn sie fertig ist. */
gleich('Beide Inseln stehen da',
  [...kern.inseln].sort(), ['Gesperrte Insel', 'Offene Insel']);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Ein frisches Schlagwort zählt nicht, ein altes schon');

const frisch = kern.themen.find((t: any) => t.titel === '#frischesthema');
const alt = kern.themen.find((t: any) => t.titel === '#altesthema');

p('Beide werden gezeigt', !!frisch && !!alt,
  JSON.stringify(kern.themen.map((t: any) => t.titel)));
p('Das frische bleibt unter der Schwelle',
  (frisch?.staerke || 0) < kern.schwelle,
  frisch?.staerke + ' gegen ' + kern.schwelle);
p('Das alte erreicht sie',
  (alt?.staerke || 0) >= kern.schwelle,
  alt?.staerke + ' gegen ' + kern.schwelle);
/* DER SATZ MUSS ES AUCH SAGEN. Zwei verschiedene Urteile mit demselben
   Text wären eine Zahl, die dem Satz widerspricht. */
p('Und der Satz nennt beim alten die Tage',
  /seit \d+ Tagen/.test(alt?.satz || ''), alt?.satz);
p('Beim frischen aber nicht',
  !/seit \d+ Tagen/.test(frisch?.satz || ''), frisch?.satz);
gleich('Die Grenze ist ein Vierteljahr', kern.themaTage, 90);
/* DIE ÄLTESTEN ZUERST — sonst wirft der Schnitt bei dreissig gerade die
   liegengebliebenen weg und behält die frischen. */
gleich('Das alte steht vor dem frischen',
  kern.themen.map((t: any) => t.titel), ['#altesthema', '#frischesthema']);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Ein Schlagwort überholt nie einen Geist');

/* GEEICHT AN DER INSEL, NICHT AM GEIST — und genau das hat dieser Punkt
   berichtigt. Der erste Entwurf deckelte bei 70 mit der Begründung „nie
   stärker als ein Geist"; `staerkeGeist(1)` ist aber nur 40. Ein Geist mit
   EINER Quelle ist selbst eine schwache Aussage.

   Was stimmt: ein Geist mit ZWEI Quellen (60) ist ein Fehler und liegt über
   allem, was ein einsames Schlagwort je erreicht. */
p('Auch das älteste Schlagwort bleibt unter einem Geist mit zwei Quellen',
  kern.themaMax < kern.geistZwei,
  kern.themaMax + ' gegen ' + kern.geistZwei);
p('… und über der Schwelle, sonst wäre die Art wieder Zierde',
  kern.themaMax >= kern.schwelle, String(kern.themaMax));
gleich('Gedeckelt wie eine Insel', [kern.themaMax, kern.inselMax], [55, 55]);

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE: ohne Sperre und ohne Alter bleibt alles wie vorher');

/* Vor E329 war das der EINZIGE Zustand: verstaubt fragte nicht nach der
   Sperre, und dünne Themen waren nie zählbar. */
gleich('Ohne Sperre verstauben beide wichtigen Seiten', kern.ohneVerstaubt, 2);
gleich('Und ein frisches Schlagwort zählt weiterhin nicht',
  kern.ohneThemaGezaehlt, 0);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Am laufenden Programm');

/* NICHT NUR DEN KERN PRÜFEN. Der Kern kann `gesperrt` lesen und es hilft
   nichts, wenn der Bereich es nie hineinreicht — genau der Fehler, den E93
   einmal gekostet hat. */
const durchgereicht = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const w = globalThis as any;

  const s = Store.addPage(null, { text: 'Gesperrtes Werk' });
  Store.updateBlock(s.id, { gesperrt: true });
  await Store.flush();

  /* `Wissensluecken.sammeln()` ist GENAU das, was der Bereich dem Kern
     übergibt — kein Nachbau und kein untergeschobener Aufruf. Der erste
     Anlauf hier fing `KnowledgeGaps.finden` ab und griff daneben, weil das
     Modul `Wissensluecken` heisst und nicht `Luecken`. Den echten Sammler
     zu fragen ist ohnehin die geradere Messung. */
  const { seiten } = w.Wissensluecken.sammeln();
  const meine = seiten.find((x: any) => x.titel === 'Gesperrtes Werk');
  return { da: !!meine, gesperrt: meine ? meine.gesperrt : null,
           felder: meine ? Object.keys(meine).sort() : [],
           wieViele: seiten.length };
});

p('Der Bereich reicht die Seite überhaupt weiter', durchgereicht.da,
  durchgereicht.wieViele + ' Seiten: ' + JSON.stringify(durchgereicht.felder));
p('… mit `gesperrt` unter ihren Feldern',
  durchgereicht.felder.includes('gesperrt'),
  JSON.stringify(durchgereicht.felder));
gleich('… und zwar mit gesetztem `gesperrt`', durchgereicht.gesperrt, true);

/* ------------------------------------------------------------------------ */
gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
