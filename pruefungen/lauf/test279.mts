/* Suite 279 — Der Wissensrang rechnet richtig (E285)
 * ============================================================================
 * Ein Rangverfahren ist die gefährlichste Sorte Code: das Ergebnis sieht
 * IMMER plausibel aus. Eine Liste von Seiten mit Zahlen daneben wirkt
 * richtig, auch wenn die Zahlen aus einer kaputten Rechnung stammen. Es
 * gibt kein „das sieht falsch aus".
 *
 * Deshalb prüft dieser Lauf gegen NACHGERECHNETE Werte und gegen
 * Eigenschaften, die ein kaputter PageRank nicht haben kann:
 *
 *   §1 DIE SUMME ist 1. Das ist die eine Eigenschaft, die Sackgassen-
 *      Fehler zuverlässig verrät — wer sie nicht behandelt, verliert in
 *      jeder Runde Masse.
 *   §2 EIN VON HAND GERECHNETES BEISPIEL. Drei Knoten, eine Kette, die
 *      Lösung steht in der Prüfung und nicht im Code.
 *   §3 DIE RICHTUNG. Drei von vier Kantenarten sind in Redion gar nicht
 *      gerichtet — wer sie als gerichtet nimmt, bekommt ein Ergebnis, das
 *      von der Sortierung zufälliger Kennungen abhängt.
 *   §4 DER GRAD IST NICHT DER RANG. Genau der Unterschied, für den es
 *      PageRank gibt: viele schwache Zeiger schlagen nicht drei starke.
 *   §5 DIE RÄNDER: leer, ein Knoten, Kanten ins Nichts, alles verbunden.
 *   §6 DIE PUNKTE 0–100 samt Frische und Stern.
 *   §7 AM ECHTEN GRAPHEN von `verweise.ts`, nicht am erfundenen.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * Jeder Abschnitt hat eine Gegenprobe, die das GEGENTEIL vorführt: §1 mit
 * einem Lauf, der die Sackgassen absichtlich nicht behandelt (nachgebaut in
 * der Prüfung selbst, nicht im Code); §3 mit demselben Graphen einmal
 * gerichtet und einmal nicht; §4 mit den echten Gradzahlen daneben.
 *
 *   node pruefungen/lauf/test279.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const KnowledgeRank: any; declare const Links: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9057;

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
const nah = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' &&
        typeof (globalThis as any).KnowledgeRank !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Summe bleibt 1 — auch bei lauter Sackgassen');

const summen = await seite.evaluate(() => {
  const K = KnowledgeRank;
  /* Ein Stern: einer zeigt auf fünf, keiner zeigt zurück. Fünf Sackgassen. */
  const stern = K.rank(
    ['m', 'a', 'b', 'c', 'd', 'e'].map(id => ({ id })),
    ['a', 'b', 'c', 'd', 'e'].map(t => ({ source: 'm', target: t, kind: 'link' })),
    { gerichtet: ['link'] });
  /* Gar keine Kante: alles Sackgassen. Der Grenzfall. */
  const staub = K.rank(['x', 'y', 'z'].map(id => ({ id })), []);
  /* Eine Kette, die nirgends zurückführt. */
  const kette = K.rank(['a', 'b', 'c', 'd'].map(id => ({ id })),
    [{ source: 'a', target: 'b', kind: 'link' },
     { source: 'b', target: 'c', kind: 'link' },
     { source: 'c', target: 'd', kind: 'link' }], { gerichtet: ['link'] });
  return {
    sternSumme: stern.summe, sternSack: stern.sackgassen,
    staubSumme: staub.summe, staubSack: staub.sackgassen,
    staubGleich: staub.liste.every((x: any) => Math.abs(x.rang - 1 / 3) < 1e-9),
    ketteSumme: kette.summe, ketteSack: kette.sackgassen,
    /* Gegenprobe: dieselbe Rechnung OHNE Sackgassen-Behandlung, hier in der
       Prüfung nachgebaut. Sie MUSS Masse verlieren — sonst misst §1 nichts. */
    ohneBehandlung: (() => {
      const N = 6, d = 0.85;
      let r = new Array(N).fill(1 / N);
      const aus: number[][] = [[1, 2, 3, 4, 5], [], [], [], [], []];
      for (let runde = 0; runde < 40; runde++) {
        const neu = new Array(N).fill((1 - d) / N);
        for (let i = 0; i < N; i++) {
          if (!aus[i]!.length) continue;
          const teil = d * r[i]! / aus[i]!.length;
          for (const j of aus[i]!) neu[j] += teil;
        }
        r = neu;
      }
      return r.reduce((s, x) => s + x, 0);
    })()
  };
}) as any;

p('Stern mit fünf Sackgassen: Summe ist 1',
  nah(summen.sternSumme, 1), String(summen.sternSumme));
p('… und die fünf Sackgassen werden auch gezählt', summen.sternSack === 5,
  String(summen.sternSack));
p('Ganz ohne Kanten: Summe ist 1', nah(summen.staubSumme, 1), String(summen.staubSumme));
p('… und alle drei stehen gleich — es gibt ja keinen Unterschied',
  summen.staubGleich === true);
p('Kette ohne Rückweg: Summe ist 1', nah(summen.ketteSumme, 1), String(summen.ketteSumme));
p('GEGENPROBE: dieselbe Rechnung ohne Sackgassen-Behandlung VERLIERT Masse',
  summen.ohneBehandlung < 0.5,
  'sie kam auf ' + summen.ohneBehandlung.toFixed(4) + ' statt 1 — genau der Fehler');

/* ------------------------------------------------------------------------ */
console.log('\n2 · Von Hand nachgerechnet');

/* DREI KNOTEN IM KREIS: a → b → c → a, alle Gewichte gleich.
   Aus Symmetrie muss jeder genau 1/3 bekommen — jeder hat genau einen
   Zeiger von genau einem, und alle sind gleichwertig. Das ist der einzige
   Fixpunkt, und er lässt sich ohne Rechnung begründen. */
const handrechnung = await seite.evaluate(() => {
  const K = KnowledgeRank;
  const kreis = K.rank(['a', 'b', 'c'].map(id => ({ id })),
    [{ source: 'a', target: 'b', kind: 'link' },
     { source: 'b', target: 'c', kind: 'link' },
     { source: 'c', target: 'a', kind: 'link' }], { gerichtet: ['link'] });

  /* ZWEI KNOTEN, EINE KANTE a → b, Dämpfung 0,85.
     b ist Sackgasse. Im Fixpunkt gilt mit der Gleichverteilung der
     Sackgassenmasse (N = 2):
        ra = 0,075 + 0,425·rb
        rb = 0,075 + 0,425·rb + 0,85·ra
     Aus ra + rb = 1 folgt rb = 1 − ra, eingesetzt:
        ra = 0,075 + 0,425·(1 − ra)  →  ra·1,425 = 0,5  →  ra = 0,350877…
        rb = 0,649122… */
  const paar = K.rank([{ id: 'a' }, { id: 'b' }],
    [{ source: 'a', target: 'b', kind: 'link' }],
    { gerichtet: ['link'], toleranz: 1e-12, runden: 500 });

  return {
    kreis: kreis.liste.map((x: any) => x.rang),
    kreisRunden: kreis.runden,
    paarA: paar.nachId['a'], paarB: paar.nachId['b'],
    paarSumme: paar.summe
  };
}) as any;

p('Kreis aus drei: jeder bekommt genau ein Drittel',
  handrechnung.kreis.every((r: number) => nah(r, 1 / 3, 1e-7)),
  JSON.stringify(handrechnung.kreis));
p('… und die Rechnung hört von selbst auf, statt hundert Runden zu drehen',
  handrechnung.kreisRunden < 100, String(handrechnung.kreisRunden));
p('Zwei Knoten, eine Kante: a = 0,350877 (von Hand gerechnet)',
  nah(handrechnung.paarA, 0.3508771929, 1e-6), String(handrechnung.paarA));
p('… und b = 0,649123', nah(handrechnung.paarB, 0.6491228070, 1e-6),
  String(handrechnung.paarB));
p('… zusammen wieder 1', nah(handrechnung.paarSumme, 1));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die Richtung — drei von vier Kantenarten haben keine');

const richtung = await seite.evaluate(() => {
  const K = KnowledgeRank;
  const knoten = [{ id: 'a' }, { id: 'b' }];
  /* Eine `relation`-Kante. In `verweise.ts` steht `source` dabei nur
     deshalb vorn, weil 'a' < 'b' — es ist keine Aussage. */
  const kanten = [{ source: 'a', target: 'b', kind: 'relation' }];

  /* Richtig: `relation` gilt als ungerichtet → beide gleich. */
  const richtig = K.rank(knoten, kanten, { gerichtet: ['link'] });
  /* Falsch: `relation` als gerichtet genommen → b gewinnt, nur weil 'a'
     im Alphabet vorn steht. */
  const falsch = K.rank(knoten, kanten, { gerichtet: ['link', 'relation'] });

  /* Und der Beweis, dass es an der Sortierung hängt: dieselbe Beziehung mit
     vertauschten Kennungen. Ungerichtet gerechnet ändert sich NICHTS. */
  const knoten2 = [{ id: 'z' }, { id: 'y' }];
  const kanten2 = [{ source: 'y', target: 'z', kind: 'relation' }];
  const richtig2 = K.rank(knoten2, kanten2, { gerichtet: ['link'] });

  return {
    richtigA: richtig.nachId['a'], richtigB: richtig.nachId['b'],
    falschA: falsch.nachId['a'], falschB: falsch.nachId['b'],
    richtig2Y: richtig2.nachId['y'], richtig2Z: richtig2.nachId['z'],
    /* Die Vorgabe ohne jede Angabe muss dieselbe sein wie `['link']`. */
    vorgabeGleich: (() => {
      const v = K.rank(knoten, kanten);
      return Math.abs(v.nachId['a'] - richtig.nachId['a']) < 1e-12;
    })()
  };
}) as any;

p('Ungerichtet gerechnet stehen beide Enden gleich',
  nah(richtung.richtigA, richtung.richtigB), JSON.stringify(richtung));
p('… und ebenso, wenn die Kennungen andersherum sortieren',
  nah(richtung.richtig2Y, richtung.richtig2Z) &&
  nah(richtung.richtig2Y, richtung.richtigA), JSON.stringify(richtung));
p('GEGENPROBE: als gerichtet genommen gewinnt einer — allein wegen der Sortierung',
  richtung.falschB > richtung.falschA + 0.1,
  'a=' + richtung.falschA + ' b=' + richtung.falschB);
p('Ohne Angabe gilt die Vorgabe `[link]`', richtung.vorgabeGleich === true);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Der Grad ist nicht der Rang — dafür gibt es das Verfahren');

/* WAS DIESER ABSCHNITT BEIM ERSTEN ANLAUF FALSCH MASS.
   Der erste Aufbau war: drei Knoten eines dichten Kerns zeigen auf
   „wichtig", sechs Wegwerfnotizen auf „laut". Erwartung: wichtig gewinnt.
   Gemessen gewann laut, 0,2775 gegen 0,1347.

   Und das war richtig so. Sechs Zeiger SIND mehr Gewicht als drei, wenn
   die drei selbst nur Grundgewicht tragen — und ein Dreieck aus drei
   Knoten verstärkt sich zwar gegenseitig, bekommt aber von aussen nichts.
   Obendrein dritteln die drei ihren Ausfluss auf zwei Nachbarn plus das
   Ziel.

   „Qualität schlägt Menge" ist keine Eigenschaft, die PageRank immer hat.
   Es ist eine, die er hat, WENN die Wenigen wirklich stark sind. Genau
   das baut der Aufbau unten: hinter jeder der drei Naben stehen zehn
   Seiten, und jede Nabe hat genau einen Ausgang. */
const gradProbe = await seite.evaluate(() => {
  const K = KnowledgeRank;
  const knoten: any[] = [{ id: 'wichtig' }, { id: 'laut' },
    { id: 'h1' }, { id: 'h2' }, { id: 'h3' }];
  const kanten: any[] = [];

  /* Drei starke Naben: jede bekommt zehn Zuflüsse und hat GENAU EINEN
     Ausgang — nach „wichtig". Sie geben also fast alles weiter, was sie
     bekommen haben. */
  for (const h of ['h1', 'h2', 'h3']) {
    for (let i = 1; i <= 10; i++) {
      const q = h + 'q' + i;
      knoten.push({ id: q });
      kanten.push({ source: q, target: h, kind: 'link' });
    }
    kanten.push({ source: h, target: 'wichtig', kind: 'link' });
  }

  /* Sechs Wegwerfnotizen: niemand zeigt auf sie, sie zeigen nur auf
     „laut". Mehr Zeiger, weniger dahinter. */
  for (let i = 1; i <= 6; i++) {
    knoten.push({ id: 'w' + i });
    kanten.push({ source: 'w' + i, target: 'laut', kind: 'link' });
  }

  const erg = K.rank(knoten, kanten, { gerichtet: ['link'] });
  const grad: Record<string, number> = {};
  for (const e of kanten) grad[e.target] = (grad[e.target] || 0) + 1;
  return {
    wichtig: erg.nachId['wichtig'], laut: erg.nachId['laut'],
    nabe: erg.nachId['h1'], blatt: erg.nachId['h1q1'],
    gradWichtig: grad['wichtig'], gradLaut: grad['laut'],
    summe: erg.summe, knoten: knoten.length
  };
}) as any;

p('Der GRAD sagt: „laut" hat doppelt so viele Zeiger wie „wichtig"',
  gradProbe.gradLaut === 6 && gradProbe.gradWichtig === 3,
  JSON.stringify({ laut: gradProbe.gradLaut, wichtig: gradProbe.gradWichtig }));
p('Die drei Naben sind wirklich stark — jede über einem Blatt',
  gradProbe.nabe > gradProbe.blatt * 3,
  'Nabe=' + gradProbe.nabe.toFixed(4) + ' Blatt=' + gradProbe.blatt.toFixed(4));
p('Der RANG dreht es um: drei STARKE schlagen sechs schwache',
  gradProbe.wichtig > gradProbe.laut,
  'wichtig=' + gradProbe.wichtig.toFixed(4) + ' laut=' + gradProbe.laut.toFixed(4));
p('… und die Summe stimmt auch bei ' + gradProbe.knoten + ' Knoten',
  nah(gradProbe.summe, 1), String(gradProbe.summe));

/* ------------------------------------------------------------------------ */
console.log('\n5 · Die Ränder');

const raender = await seite.evaluate(() => {
  const K = KnowledgeRank;
  const leer = K.rank([], []);
  const einer = K.rank([{ id: 'a' }], []);
  const insNichts = K.rank([{ id: 'a' }, { id: 'b' }],
    [{ source: 'a', target: 'gibtesnicht', kind: 'link' },
     { source: 'auchnicht', target: 'b', kind: 'link' },
     { source: 'a', target: 'a', kind: 'link' }]);
  const doppelt = K.rank([{ id: 'a' }, { id: 'a' }, { id: 'b' }],
    [{ source: 'a', target: 'b', kind: 'link' }]);
  const gefiltert = K.rank(
    [{ id: 'a', kind: 'page' }, { id: 't', kind: 'tag' }, { id: 'b', kind: 'page' }],
    [{ source: 'a', target: 't', kind: 'tag' }, { source: 'b', target: 't', kind: 'tag' }],
    { ohne: ['tag'] });
  const nullGewicht = K.rank([{ id: 'a' }, { id: 'b' }],
    [{ source: 'a', target: 'b', kind: 'tag' }], { gewicht: { tag: 0 } });
  return {
    leerLeer: leer.liste.length === 0 && leer.summe === 0,
    einerA: einer.nachId['a'], einerAnzahl: einer.liste.length,
    /* `nah` lebt im Prüflauf, nicht im Browser. Rohwerte zurückgeben und
       DRAUSSEN vergleichen — beim ersten Anlauf stand hier ein Aufruf, den
       die Seite nicht kennt. */
    nichtsSumme: insNichts.summe,
    nichtsA: insNichts.nachId['a'], nichtsB: insNichts.nachId['b'],
    doppeltAnzahl: doppelt.liste.length,
    gefiltertAnzahl: gefiltert.liste.length,
    gefiltertA: gefiltert.nachId['a'], gefiltertB: gefiltert.nachId['b'],
    nullGewichtA: nullGewicht.nachId['a'], nullGewichtB: nullGewicht.nachId['b'],
    nullGewichtSack: nullGewicht.sackgassen
  };
}) as any;
p('Leer bleibt leer, ohne zu werfen', raender.leerLeer === true);
p('Ein einziger Knoten bekommt alles',
  nah(raender.einerA, 1) && raender.einerAnzahl === 1, JSON.stringify(raender));
p('Kanten ins Nichts und auf sich selbst fallen weg',
  nah(raender.nichtsSumme, 1) && nah(raender.nichtsA, raender.nichtsB),
  JSON.stringify(raender));
p('Eine doppelte Kennung zählt einmal', raender.doppeltAnzahl === 2,
  String(raender.doppeltAnzahl));
p('`ohne: [tag]` lässt die Tag-Knoten weg — und ihre Kanten mit',
  raender.gefiltertAnzahl === 2 && nah(raender.gefiltertA, raender.gefiltertB),
  JSON.stringify(raender));
p('Gewicht 0 heisst: die Kante gibt es nicht',
  nah(raender.nullGewichtA, raender.nullGewichtB) && raender.nullGewichtSack === 2,
  JSON.stringify(raender));

/* ------------------------------------------------------------------------ */
console.log('\n6 · Von 0 bis 100 — und was Frische und Stern daran ändern');

const punkte = await seite.evaluate(() => {
  const K = KnowledgeRank;
  const jetzt = Date.parse('2026-08-31T12:00:00.000Z');
  const heute = new Date(jetzt - 1 * 86400000).toISOString();
  const alt = new Date(jetzt - 400 * 86400000).toISOString();

  const knoten = [
    { id: 'a', edited: alt }, { id: 'b', edited: alt }, { id: 'c', edited: alt }
  ];
  const kanten = [{ source: 'a', target: 'b', kind: 'link' },
                  { source: 'c', target: 'b', kind: 'link' }];
  const erg = K.rank(knoten, kanten, { gerichtet: ['link'] });
  const ohne = K.punkte(erg, knoten, { jetzt, frische: 0, stern: 0 });

  /* Derselbe Graph, aber `a` wurde gestern angefasst. */
  const frisch = K.punkte(erg,
    [{ id: 'a', edited: heute }, { id: 'b', edited: alt }, { id: 'c', edited: alt }],
    { jetzt });
  /* Und einmal mit Stern an `a`. */
  const stern = K.punkte(erg,
    [{ id: 'a', edited: alt, favorite: true }, { id: 'b', edited: alt },
     { id: 'c', edited: alt }], { jetzt, frische: 0 });

  const holen = (l: any[], id: string) => l.find((x: any) => x.id === id);
  return {
    ohneHoechst: Math.max(...ohne.map((x: any) => x.punkte)),
    ohneB: holen(ohne, 'b').punkte, ohneA: holen(ohne, 'a').punkte,
    /* Ohne Wurzel wäre der Zweite bei ~10; mit Wurzel lesbar über 30. */
    ohneAlesbar: holen(ohne, 'a').punkte > 30,
    frischA: holen(frisch, 'a').punkte, frischAlt: holen(ohne, 'a').punkte,
    sternA: holen(stern, 'a').punkte,
    /* Alles in 0..100, keine Ausreisser. */
    imBereich: ohne.every((x: any) => x.punkte >= 0 && x.punkte <= 100),
    /* Plätze lückenlos und aufsteigend. */
    plaetze: ohne.map((x: any) => x.platz).join(',')
  };
}) as any;
p('Der Höchste bekommt 100', punkte.ohneHoechst === 100 && punkte.ohneB === 100,
  JSON.stringify(punkte));
p('Alles liegt zwischen 0 und 100', punkte.imBereich === true);
p('Die Plätze sind lückenlos', punkte.plaetze === '1,2,3', punkte.plaetze);
p('Die Wurzel macht den Zweiten lesbar statt einstellig',
  punkte.ohneAlesbar === true, String(punkte.ohneA));
p('Frisch bearbeitet zählt mehr als dasselbe von vor einem Jahr',
  punkte.frischA > punkte.frischAlt,
  'frisch=' + punkte.frischA + ' alt=' + punkte.frischAlt);
p('Ein Stern zählt auch', punkte.sternA > punkte.ohneA,
  'stern=' + punkte.sternA + ' ohne=' + punkte.ohneA);

/* ------------------------------------------------------------------------ */
console.log('\n7 · Und am ECHTEN Graphen, nicht am erfundenen');

const echt = await seite.evaluate(async () => {
  /* Ein kleiner, aber echter Bestand: drei Seiten, zwei davon verlinken
     auf die dritte, plus eine Unterseite (Baumkante). */
  const ohm = Store.addPage(null, { text: 'Ohmsches Gesetz' });
  const wechsel = Store.addPage(null, { text: 'Wechselstrom' });
  const kirch = Store.addPage(null, { text: 'Kirchhoff' });
  const unter = Store.addPage(ohm.id, { text: 'Beispielrechnung' });
  Store.addBlock(wechsel.id, 'text', { text: 'siehe [[Ohmsches Gesetz]]' });
  Store.addBlock(kirch.id, 'text', { text: 'baut auf [[Ohmsches Gesetz]] auf' });
  await Store.settled();

  /* Das Modul heisst `Links`, nicht `Verweise` — nachgesehen in
     verweise.ts:1357, nicht geraten. `graphVorbereiten()` gibt
     `{ knoten, kanten, index }`; der ganze Graph steckt in `index`. */
  if (typeof Links === 'undefined' || !Links.graphVorbereiten) {
    return { keinGriff: true };
  }
  const g = Links.graphVorbereiten();
  const nodes = [...(g.index ? g.index.nodes.values() : [])];
  const edges = g.index ? g.index.edges : [];
  const erg = KnowledgeRank.rank(nodes, edges, { gerichtet: ['link'] });
  const pkt = KnowledgeRank.punkte(erg, nodes);
  const finde = (id: string) => pkt.find((x: any) => x.id === id);
  /* Die Kanten, die MEINE vier Seiten betreffen — sonst prüft §7 gegen
     einen Bestand, über den er nichts weiss. */
  const meine = new Set([ohm.id, wechsel.id, kirch.id, unter.id]);
  const meineKanten = edges.filter((e: any) => meine.has(e.source) || meine.has(e.target));
  const aufOhm = edges.filter((e: any) => e.kind === 'link' && e.target === ohm.id).length;

  return {
    keinGriff: false,
    knoten: nodes.length, kanten: edges.length,
    summe: erg.summe,
    /* Redion startet MIT Demo-Inhalten, und die sind dicht verlinkt. Eine
       absolute Platzangabe („Ohm muss unter die ersten zwei") misst also
       den Demo-Bestand mit und sagt über die Rechnung nichts. Gemessen
       wird deshalb RELATIV: wer verlinkt wird, steht über denen, die ihn
       verlinken. Das ist die Aussage des Verfahrens, und sie gilt
       unabhängig davon, was sonst im Bestand liegt. */
    aufOhm,
    meineKanten: meineKanten.length,
    ohm: finde(ohm.id) ? finde(ohm.id).platz : -1,
    wechsel: finde(wechsel.id) ? finde(wechsel.id).platz : -1,
    kirch: finde(kirch.id) ? finde(kirch.id).platz : -1,
    unter: finde(unter.id) ? finde(unter.id).platz : -1,
    ohmPunkte: finde(ohm.id) ? finde(ohm.id).punkte : -1,
    ersteDrei: pkt.slice(0, 3).map((x: any) => {
      const n = nodes.find((y: any) => y.id === x.id);
      return (n ? n.name : x.id) + ' ' + x.punkte;
    })
  };
}) as any;

if (echt.keinGriff) {
  p('`Links.graphVorbereiten` ist erreichbar', false,
    'ohne den Griff lässt sich der echte Graph nicht prüfen');
} else {
  p('Der echte Graph steht und hat Knoten und Kanten',
    echt.knoten > 3 && echt.kanten > 0, JSON.stringify(echt));
  p('… die Summe ist auch dort 1', nah(echt.summe, 1), String(echt.summe));
  p('… die beiden `[[…]]`-Verweise sind wirklich als Kanten angekommen',
    echt.aufOhm >= 2, echt.aufOhm + ' Link-Kanten auf Ohm, ' +
    echt.meineKanten + ' Kanten insgesamt an meinen vier Seiten');
  p('… „Ohmsches Gesetz" steht über BEIDEN Seiten, die darauf verweisen',
    echt.ohm < echt.wechsel && echt.ohm < echt.kirch,
    'Ohm ' + echt.ohm + ' · Wechselstrom ' + echt.wechsel + ' · Kirchhoff ' + echt.kirch);
  p('… und über der eigenen Unterseite, auf die nichts verweist',
    echt.ohm < echt.unter, 'Ohm ' + echt.ohm + ' · Unterseite ' + echt.unter);
  p('… gemessen im ECHTEN Bestand samt Demo-Inhalten',
    echt.knoten > 5, echt.knoten + ' Knoten, ' + echt.kanten + ' Kanten · vorn: ' +
    echt.ersteDrei.join(' | '));
}

/* Grösse: eine Rangberechnung, die bei tausend Knoten spürbar wird, wäre
   in einem Wissensspeicher unbrauchbar. */
const tempo = await seite.evaluate(() => {
  const K = KnowledgeRank;
  const N = 5000;
  const knoten = [];
  for (let i = 0; i < N; i++) knoten.push({ id: 'n' + i });
  const kanten = [];
  for (let i = 0; i < N; i++) {
    kanten.push({ source: 'n' + i, target: 'n' + ((i * 7 + 3) % N), kind: 'link' });
    kanten.push({ source: 'n' + i, target: 'n' + ((i * 13 + 11) % N), kind: 'relation' });
  }
  const t0 = performance.now();
  const erg = K.rank(knoten, kanten, { gerichtet: ['link'] });
  return { ms: performance.now() - t0, summe: erg.summe, runden: erg.runden };
}) as any;
p('5000 Knoten und 10000 Kanten unter einer Sekunde',
  tempo.ms < 1000, Math.round(tempo.ms) + ' ms, ' + tempo.runden + ' Runden');
p('… und die Summe stimmt auch dort', nah(tempo.summe, 1, 1e-5), String(tempo.summe));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 200));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
