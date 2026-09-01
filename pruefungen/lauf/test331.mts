/* Suite 331 — Nicht nur Karteikarten (L106 Punkt 1, E339)
 * ============================================================================
 * L106 Punkt 1: „Die Karteikarten sind die einzige Quelle. Prüfungsergebnisse,
 * Elektro-Aufgaben, der Lernpfad und die Simulationen sind auch Belege für
 * Können, und keiner davon zählt mit."
 *
 * EINE PRÜFUNGSSIMULATION IST SOGAR DER BESSERE BELEG. Eine Karteikarte wird
 * SELBST BEWERTET — man sagt sich selbst, ob man es wusste. Eine Simulation
 * zählt richtig und falsch, ohne dass man sich etwas vormachen kann. Sie
 * nicht mitzuzählen hiess, die härtere Auskunft wegzuwerfen und die weichere
 * zu behalten.
 *
 *   §1 DIE ÜBERSETZUNG einzeln, mit allem was schiefgehen kann.
 *   §2 EIN BELEG IST KEINE KARTE — sonst stünde „20 Karten" bei zwölf.
 *   §3 DIE SIMULATION KOMMT AN im Thema, das sie meint.
 *   §4 UND DER SATZ SAGT, WOHER die Belege kommen.
 *   §5 GEGENPROBE: ohne Simulation ändert sich nichts, und der Satz
 *      schweigt über die Herkunft.
 *   §6 DIE THEMEN TREFFEN SICH — die eine Stelle, an der es schiefgehen kann.
 *
 *   node pruefungen/lauf/test331.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9334;

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
await pc.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Übersetzung, einzeln');

const uebersetzt = await pc.evaluate(() => {
  const B = (globalThis as any).Belege;
  const eins = B.ausSimulationen([{
    id: 'sim-1', titel: 'Probeklausur', beendet: '2026-08-20T10:00:00.000Z',
    themen: [{ thema: 'Ohmsches Gesetz', gesamt: 10, fehler: 2 },
             { thema: 'Leistung', gesamt: 4, fehler: 0 }]
  }]);
  return {
    zahl: eins.length,
    themen: eins.map((k: any) => k.thema).sort(),
    quellen: [...new Set(eins.map((k: any) => k.quelle))],
    ohm: (() => {
      const k = eins.find((x: any) => x.thema === 'Ohmsches Gesetz');
      return { belege: k.reviewVerlauf.length,
               richtig: k.reviewVerlauf.filter((r: any) => r.rating >= 3).length,
               zeiten: [...new Set(k.reviewVerlauf.map((r: any) => r.at))],
               kennungen: new Set(k.reviewVerlauf.map((r: any) => r.id)).size };
    })(),
    /* UND WAS KEINE ÜBERSETZUNG ERGIBT, jedes einzeln. */
    leer:        B.ausSimulationen([]).length,
    keinArray:   B.ausSimulationen(null).length,
    ohneDatum:   B.ausSimulationen([{ id: 'x', themen: [{ thema: 'A', gesamt: 3 }] }]).length,
    kaputtDatum: B.ausSimulationen([{ id: 'x', beendet: 'bald', themen: [{ thema: 'A', gesamt: 3 }] }]).length,
    ohneThemen:  B.ausSimulationen([{ id: 'x', beendet: '2026-08-20T10:00:00.000Z' }]).length,
    nullFragen:  B.ausSimulationen([{ id: 'x', beendet: '2026-08-20T10:00:00.000Z',
                                      themen: [{ thema: 'A', gesamt: 0 }] }]).length,
    /* Mehr Fehler als Fragen ist eine kaputte Datei — nicht mehr Fehler. */
    zuVieleFehler: (() => {
      const k = B.ausSimulationen([{ id: 'x', beendet: '2026-08-20T10:00:00.000Z',
        themen: [{ thema: 'A', gesamt: 3, fehler: 99 }] }])[0];
      return { belege: k.reviewVerlauf.length,
               richtig: k.reviewVerlauf.filter((r: any) => r.rating >= 3).length };
    })(),
    themaLeer: B.themaAus('   '),
    themaLang: B.themaAus('x'.repeat(300)).length
  };
});

gleich('Zwei Themen, zwei Sätze', uebersetzt.zahl, 2);
gleich('Und sie heissen wie in der Simulation',
  uebersetzt.themen, ['Leistung', 'Ohmsches Gesetz']);
gleich('Alle tragen die Quelle „pruefung"', uebersetzt.quellen, ['pruefung']);
gleich('Zehn Fragen ergeben zehn Belege', uebersetzt.ohm.belege, 10);
gleich('Davon acht richtig', uebersetzt.ohm.richtig, 8);
gleich('Alle zur selben Zeit', uebersetzt.ohm.zeiten, ['2026-08-20T10:00:00.000Z']);
/* JEDER BELEG BRAUCHT SEINE EIGENE KENNUNG — `verlaufVon` in kompetenz.ts
   liest ein Objekt ODER eine Liste, und bei gleichen Kennungen fielen in
   der Objektform neun von zehn weg. */
gleich('Und jeder eine eigene Kennung', uebersetzt.ohm.kennungen, 10);
gleich('Eine leere Liste ergibt nichts', uebersetzt.leer, 0);
gleich('Kein Array auch nicht', uebersetzt.keinArray, 0);
/* OHNE DATUM KEIN BELEG: `kompetenz.ts` ordnet Antworten in Zeitfenster
   ein (E328), und was keine Zeit trägt, fällt dort heraus — hier aber
   nicht. Zwei verschiedene Grundgesamtheiten. */
gleich('Ohne Datum kein Beleg', uebersetzt.ohneDatum, 0);
gleich('Mit unlesbarem Datum auch nicht', uebersetzt.kaputtDatum, 0);
gleich('Ohne Themen nichts', uebersetzt.ohneThemen, 0);
gleich('Ein Thema mit null Fragen zählt nicht', uebersetzt.nullFragen, 0);
gleich('Mehr Fehler als Fragen ergibt drei Belege, alle falsch',
  uebersetzt.zuVieleFehler, { belege: 3, richtig: 0 });
gleich('Ein leeres Thema heisst „Ohne Thema"', uebersetzt.themaLeer, 'Ohne Thema');
gleich('Und ein sehr langes wird gekürzt wie bei den Karten',
  uebersetzt.themaLang, 120);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Ein Beleg ist keine Karte');

/* DIE STILLE FALSCHAUSSAGE, gegen die dieser Bogen gebaut ist: „20 Karten"
   bei zwölf Karten. Der Kern kennt die Arten nicht beim Namen, aber er
   hält auseinander, was gezählt wird. */
const gezaehlt = await pc.evaluate(() => {
  const K = (globalThis as any).Kompetenz;
  const karte = (i: number) => ({
    id: 'k' + i, thema: 'Elektro',
    reviewVerlauf: [{ id: 'r' + i, at: '2026-08-01T10:00:00.000Z', rating: 4 }]
  });
  const beleg = { id: 'b1', thema: 'Elektro', quelle: 'pruefung',
    reviewVerlauf: [1, 2, 3, 4].map(n =>
      ({ id: 'p' + n, at: '2026-08-02T10:00:00.000Z', rating: 4 })) };
  const nur = K.jeThema([karte(1), karte(2), karte(3)],
                        { jetzt: Date.parse('2026-08-10T10:00:00.000Z') })[0];
  const mit = K.jeThema([karte(1), karte(2), karte(3), beleg],
                        { jetzt: Date.parse('2026-08-10T10:00:00.000Z') })[0];
  return { nurKarten: nur.karten, nurBelege: nur.belege, nurQuellen: nur.quellen,
           mitKarten: mit.karten, mitBelege: mit.belege, mitQuellen: mit.quellen };
});

gleich('Drei Karten, drei Belege', 
  { k: gezaehlt.nurKarten, b: gezaehlt.nurBelege }, { k: 3, b: 3 });
/* VIER BELEGE MEHR, ABER KEINE KARTE MEHR. */
gleich('Mit der Prüfung: immer noch drei Karten', gezaehlt.mitKarten, 3);
gleich('Aber sieben Belege', gezaehlt.mitBelege, 7);
gleich('Und die Herkunft steht in Zahlen da',
  gezaehlt.mitQuellen, { karte: 3, pruefung: 4 });
gleich('Ohne Prüfung nennt sie nur die eine Art',
  gezaehlt.nurQuellen, { karte: 3 });

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die Simulation kommt im richtigen Thema an');

const angekommen = await pc.evaluate(async () => {
  const S: any = (globalThis as any).eval('Store');
  const w = globalThis as any;
  const seite = S.addPage(null, { text: 'Elektrotechnik' });
  for (let i = 0; i < 3; i++) {
    const k = S.addBlock(seite.id, 'flashcard',
      { text: 'Frage ' + i, lernThema: 'Ohmsches Gesetz' });
    const v: any = {};
    for (let j = 0; j < 5; j++)
      v['r' + j] = { at: new Date(Date.now() - (j + 1) * 86400000).toISOString(), rating: 4 };
    S.updateBlock(k.id, { reviewVerlauf: v,
      sr: { wdh: 3, intervall: 10, zuletzt: new Date(Date.now() - 86400000).toISOString(),
            faellig: new Date(Date.now() + 5 * 86400000).toISOString() } });
  }
  await S.flush();
  const themaVon = (st: any, name: string) =>
    st.topics.find((t: any) => t.label === name) || null;
  const ohne = w.Learning.statistics();
  const konto = w.Konten && w.Konten.aktiv ? w.Konten.aktiv() : null;
  const schluessel = 'lernwelt:' + ((konto && konto.id) || 'lokal') + ':simulationen';
  S.setMeta(schluessel, [{
    id: 'sim-1', titel: 'Probeklausur', beendet: new Date().toISOString(),
    richtig: 8, gesamt: 10, dauerMin: 20,
    themen: [{ thema: 'Ohmsches Gesetz', gesamt: 10, fehler: 2 }]
  }]);
  const mit = w.Learning.statistics();
  return {
    ohneBelege: ohne.belege, mitBelege: mit.belege,
    ohneThema: themaVon(ohne, 'Ohmsches Gesetz'),
    mitThema: themaVon(mit, 'Ohmsches Gesetz'),
    schluessel
  };
});

gleich('Ohne Simulation: 15 Belege', angekommen.ohneBelege, 15);
/* ZEHN DAZU — und zwar im Thema, nicht daneben. */
gleich('Mit Simulation: 25', angekommen.mitBelege, 25);
gleich('Das Thema hatte 15', angekommen.ohneThema.belege, 15);
gleich('Und hat jetzt 25', angekommen.mitThema.belege, 25);
/* DIE ZAHL DER KARTEN BLEIBT — im Thema stehen drei Karten, nicht vier. */
gleich('Es sind weiterhin drei Karten', angekommen.mitThema.total, 3);
/* UND DIE SICHERHEIT SINKT, weil zwei Fragen falsch waren. Das ist der
   Beleg dafür, dass die Prüfung wirklich mitrechnet und nicht nur
   danebensteht. */
p('Die Sicherheit sinkt durch die zwei Fehler',
  angekommen.mitThema.sicherheit < angekommen.ohneThema.sicherheit,
  angekommen.ohneThema.sicherheit + ' -> ' + angekommen.mitThema.sicherheit);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Und der Satz sagt, woher die Belege kommen');

const satz = String(angekommen.mitThema.kompetenzSatz || '');
p('Er nennt die Karteikarten', /15 aus Karteikarten/.test(satz), satz);
p('Und die Prüfungssimulationen', /10 aus Prüfungssimulationen/.test(satz), satz);
p('Als eigener Satz am Ende', /Die Belege: /.test(satz), satz);
/* ZWEI KLAMMERN HINTEREINANDER WAREN DER ERSTE WURF, und sie standen so
   auf dem Bildschirm: „(15 aus Karteikarten, 10 aus …) (roh 92 % — …)".
   Beides gültig, zusammen unlesbar. Gesehen hat es kein Prüflauf. */
p('Und nicht als zweite Klammer mitten hinein',
  !/\) \(/.test(satz), satz);
/* UND KEIN ZWEITES „Davon" — der Satz davor endet auf „Davon dürfte heute
   noch X % sitzen". */
gleich('Nur ein „Davon" im ganzen Satz',
  (satz.match(/Davon/g) || []).length, 1);

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE: ohne Simulation schweigt die Herkunft');

/* EINE ANGABE, DIE IMMER DASTEHT, WIRD NICHT GELESEN. Solange alles aus
   Karteikarten kommt, wäre „Die Belege: 15 aus Karteikarten" eine Zeile,
   die nichts sagt. */
const stiller = String(angekommen.ohneThema.kompetenzSatz || '');
p('Der Satz ohne Simulation nennt keine Herkunft',
  !/Die Belege:/.test(stiller), stiller);
p('Und auch nicht das Wort Karteikarten',
  !/Karteikarten/.test(stiller), stiller);
p('Er sagt aber sehr wohl etwas', stiller.length > 30, stiller);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Die Themen treffen sich');

/* DIE EINE STELLE, AN DER ES SCHIEFGEHEN KANN. `learning.ts` nennt ein
   Thema über `topicLabel`, `lernwelt.ts` über `themaVon`. Beide bevorzugen
   dasselbe und fallen auf denselben Seitentitel zurück; sie unterscheiden
   sich nur im Kürzen. Wäre das anders, landete der Beleg unter einem
   zweiten Thema — und die Zahl stimmte in BEIDEN nicht. */
const treffen = await pc.evaluate(async () => {
  const S: any = (globalThis as any).eval('Store');
  const w = globalThis as any;
  /* Eine Karte OHNE eigenes Thema — dann entscheidet der Seitentitel, und
     das ist der Fall, in dem die beiden Funktionen auseinandergehen
     könnten. */
  const seite = S.addPage(null, { text: 'Wechselstrom' });
  const k = S.addBlock(seite.id, 'flashcard', { text: 'Was ist Blindleistung?' });
  S.updateBlock(k.id, { reviewVerlauf: {
    a: { at: new Date(Date.now() - 86400000).toISOString(), rating: 4 } } });
  await S.flush();
  const vorher = w.Learning.statistics().topics.find((t: any) => t.label === 'Wechselstrom');
  const konto = w.Konten && w.Konten.aktiv ? w.Konten.aktiv() : null;
  const schluessel = 'lernwelt:' + ((konto && konto.id) || 'lokal') + ':simulationen';
  const alt = S.getMeta(schluessel, []);
  S.setMeta(schluessel, alt.concat([{
    id: 'sim-2', titel: 'Zweite', beendet: new Date().toISOString(),
    richtig: 5, gesamt: 6, dauerMin: 9,
    themen: [{ thema: 'Wechselstrom', gesamt: 6, fehler: 1 }]
  }]));
  const nachher = w.Learning.statistics().topics.find((t: any) => t.label === 'Wechselstrom');
  const alleThemen = w.Learning.statistics().topics.map((t: any) => t.label);
  return { vorher: vorher && vorher.belege, nachher: nachher && nachher.belege,
           karten: nachher && nachher.total, alleThemen };
});

gleich('Die Karte allein hat einen Beleg', treffen.vorher, 1);
/* SECHS DAZU, im SELBEN Thema. Gäbe es zwei Themen, stünde hier 1. */
gleich('Mit der Simulation sind es sieben', treffen.nachher, 7);
gleich('Und es ist weiterhin EINE Karte', treffen.karten, 1);
p('Es gibt kein zweites „Wechselstrom" daneben',
  treffen.alleThemen.filter((t: string) => t === 'Wechselstrom').length === 1,
  JSON.stringify(treffen.alleThemen));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
