/* Suite 282 — Wissenslücken: was FEHLT, nicht was da ist (E288)
 * ============================================================================
 * Redion konnte sagen, was in einem Bestand steht. Was NICHT darin steht,
 * konnte es nicht sagen — und der Wissensrang aus E285 war 400 Zeilen
 * gerechneter PageRank, den kein Mensch je zu sehen bekam.
 *
 *   §1 DIE SECHS ARTEN werden gefunden, jede mit ihrer Stärke.
 *   §2 GEISTER WERDEN ZUSAMMENGEFASST — drei Verweise sind ein Fund.
 *   §3 GEZÄHLT WIRD NUR, WAS ÜBER DER SCHWELLE LIEGT.
 *   §4 SORTIERT WIRD NACH STÄRKE, nicht nach Art.
 *   §5 FRAGEN: Überschriften und Code bleiben draussen.
 *   §6 KARTEIKARTEN sind keine offenen Fragen.
 *   §7 GEGEN DEN ECHTEN BESTAND — und der Rang ist wirklich verdrahtet.
 *   §8 DIE ANSICHT: Zahl, Knöpfe, und kein rohes HTML aus Nutzertext.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §3 ist der Abschnitt, um den es geht, und er ist auch der, der am
 * leichtesten immer grün wäre. Deshalb misst er BEIDE Richtungen: ein
 * gesunder Bestand zählt null, und ein einziger Geist mit zwei Quellen
 * macht daraus eins. Ohne die erste Hälfte hätte ich zum dritten Mal in
 * derselben Woche eine Anzeige gebaut, die immer etwas anzeigt (E284, E286).
 *
 * §6 ist die zweite Stelle, an der ein Fehler teuer wäre: dieselbe Frage
 * wird einmal als Karteikarte und einmal als Absatz abgelegt. Gefunden
 * werden darf nur die zweite.
 *
 *   node pruefungen/lauf/test282.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const KnowledgeGaps: any; declare const Wissensluecken: any;
declare const Links: any; declare const Register: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9061;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' &&
        typeof (globalThis as any).KnowledgeGaps !== 'undefined' &&
        typeof (globalThis as any).Wissensluecken !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1500);

/* Ein fester Zeitpunkt, damit „seit 200 Tagen" prüfbar ist, ohne zu warten. */
const JETZT = Date.parse('2026-08-31T12:00:00.000Z');
const vorTagen = (n: number): string =>
  new Date(JETZT - n * 86400000).toISOString();

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die sechs Arten, jede mit ihrer Stärke');

const arten = await seite.evaluate(({ jetzt, alt, frisch }: any) => {
  const G = KnowledgeGaps;
  const seiten = [
    { id: 'a', titel: 'Ohmsches Gesetz', text: 'Siehe [[Widerstand]].',
      edited: alt, grad: 4, rang: 80 },
    { id: 'b', titel: 'Frische Insel', text: 'Nichts.', edited: frisch, grad: 0, rang: 5 },
    { id: 'c', titel: 'Alte Insel', text: 'Auch nichts.', edited: alt, grad: 0, rang: 5 },
    { id: 'd', titel: 'Mit Frage', text: 'Warum kippt die Spannung unter Last?',
      edited: frisch, grad: 2, rang: 10 }
  ];
  const verweise = [
    { vonId: 'a', vonTitel: 'Ohmsches Gesetz', ziel: 'Widerstand', status: 'fehlt' },
    { vonId: 'd', vonTitel: 'Mit Frage', ziel: 'Widerstand', status: 'fehlt' },
    { vonId: 'b', vonTitel: 'Frische Insel', ziel: 'Widerstand', status: 'fehlt' },
    { vonId: 'a', vonTitel: 'Ohmsches Gesetz', ziel: 'Strom', status: 'mehrdeutig',
      kandidaten: 3 }
  ];
  const themen = [{ tag: 'einmalig', seiten: ['a'] }, { tag: 'oft', seiten: ['a', 'd'] }];
  const b = G.finden(seiten, verweise, themen, { jetzt });
  const nach = (art: string) => b.funde.filter((f: any) => f.art === art);
  return {
    geist: nach('geist').map((f: any) => ({ t: f.titel, s: f.staerke, q: (f.quellen || []).length })),
    mehrdeutig: nach('mehrdeutig').map((f: any) => ({ t: f.titel, s: f.staerke })),
    thema: nach('thema').map((f: any) => ({ t: f.titel, s: f.staerke })),
    frage: nach('frage').map((f: any) => ({ t: f.titel, s: f.staerke })),
    verstaubt: nach('verstaubt').map((f: any) => ({ t: f.titel, s: f.staerke })),
    insel: nach('insel').map((f: any) => ({ t: f.titel, s: f.staerke })),
    /* Die Stärkefunktionen einzeln, damit ein Fehler sich nicht hinter
       einer Kette versteckt. */
    g1: G.staerkeGeist(1), g3: G.staerkeGeist(3), g9: G.staerkeGeist(9),
    m2: G.staerkeMehrdeutig(2), m5: G.staerkeMehrdeutig(5),
    th: G.staerkeThema(),
    vHoch: G.staerkeVerstaubt(80, 300, 90), vKnapp: G.staerkeVerstaubt(80, 91, 90),
    iFrisch: G.staerkeInsel(2), iAlt: G.staerkeInsel(300)
  };
}, { jetzt: JETZT, alt: vorTagen(300), frisch: vorTagen(2) }) as any;

p('Ein Geist, drei Quellen — nicht drei Geister',
  arten.geist.length === 1 && arten.geist[0].q === 3, JSON.stringify(arten.geist));
p('… und er ist stark, weil mehrere darauf zeigen',
  arten.geist[0]?.s === 80, String(arten.geist[0]?.s));
p('Ein einzelner Verweis ins Leere ist schwächer',
  arten.g1 === 40 && arten.g3 === 80 && arten.g9 === 100,
  [arten.g1, arten.g3, arten.g9].join('/'));
p('Ein mehrdeutiger Verweis ist IMMER stark — ein falscher Weg ist schlimmer als keiner',
  arten.m2 === 80 && arten.m5 === 95 && arten.mehrdeutig[0]?.s === 85,
  [arten.m2, arten.m5, arten.mehrdeutig[0]?.s].join('/'));
p('Ein Schlagwort an einer Seite ist eine Beobachtung, keine Lücke',
  arten.th === 25 && arten.thema.length === 1 && arten.thema[0].t === '#einmalig',
  JSON.stringify(arten.thema));
p('Die Frage wird gefunden', arten.frage.length === 1 &&
  arten.frage[0].t === 'Warum kippt die Spannung unter Last?',
  JSON.stringify(arten.frage));
p('Wichtig und 300 Tage alt: sehr stark. Wichtig und knapp über der Frist: weniger',
  arten.vHoch === 80 && arten.vKnapp < arten.vHoch,
  arten.vHoch + ' gegen ' + arten.vKnapp);
p('Nur die ALTE Insel ist ein Fund — eine frische Seite ist keine Lücke',
  arten.insel.length === 2 && arten.iFrisch === 10 && arten.iAlt === 50,
  JSON.stringify(arten.insel) + ' ' + arten.iFrisch + '/' + arten.iAlt);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Verstaubt braucht BEIDES — Rang und Zeit');

const verstaubt = await seite.evaluate(({ jetzt, alt, frisch }: any) => {
  const G = KnowledgeGaps;
  const lauf = (rang: number, edited: string) =>
    G.finden([{ id: 'x', titel: 'X', text: '', edited, grad: 3, rang }], [], [], { jetzt })
      .funde.filter((f: any) => f.art === 'verstaubt').length;
  return {
    beides: lauf(80, alt),      /* wichtig UND alt  -> Fund */
    nurAlt: lauf(20, alt),      /* alt, aber egal   -> kein Fund */
    nurWichtig: lauf(80, frisch)/* wichtig, aber frisch -> kein Fund */
  };
}, { jetzt: JETZT, alt: vorTagen(300), frisch: vorTagen(2) }) as any;

p('Wichtig UND lange nicht angefasst ist ein Fund', verstaubt.beides === 1);
p('GEGENPROBE: alt allein reicht nicht — sonst wäre jede Altnotiz eine Lücke',
  verstaubt.nurAlt === 0, String(verstaubt.nurAlt));
p('GEGENPROBE: wichtig allein auch nicht', verstaubt.nurWichtig === 0,
  String(verstaubt.nurWichtig));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Gezählt wird nur, was über der Schwelle liegt');

const zaehlen = await seite.evaluate(({ jetzt, frisch }: any) => {
  const G = KnowledgeGaps;
  /* Ein GESUNDER Bestand: drei verbundene Seiten, ein Schlagwort an einer
     davon, keine toten Verweise, keine Fragen. */
  const gesund = G.finden(
    [{ id: 'a', titel: 'A', text: 'Siehe [[B]].', edited: frisch, grad: 2, rang: 60 },
     { id: 'b', titel: 'B', text: 'Siehe [[C]].', edited: frisch, grad: 2, rang: 50 },
     { id: 'c', titel: 'C', text: 'Ende.', edited: frisch, grad: 2, rang: 40 }],
    [{ vonId: 'a', vonTitel: 'A', ziel: 'B', status: 'eindeutig' },
     { vonId: 'b', vonTitel: 'B', ziel: 'C', status: 'eindeutig' }],
    [{ tag: 'nurhier', seiten: ['a'] }], { jetzt });
  /* Derselbe Bestand mit EINEM Geist, auf den zwei Seiten zeigen. */
  const krank = G.finden(
    [{ id: 'a', titel: 'A', text: 'Siehe [[B]] und [[Fehlt]].', edited: frisch, grad: 2, rang: 60 },
     { id: 'b', titel: 'B', text: 'Siehe [[Fehlt]].', edited: frisch, grad: 2, rang: 50 }],
    [{ vonId: 'a', vonTitel: 'A', ziel: 'B', status: 'eindeutig' },
     { vonId: 'a', vonTitel: 'A', ziel: 'Fehlt', status: 'fehlt' },
     { vonId: 'b', vonTitel: 'B', ziel: 'Fehlt', status: 'fehlt' }],
    [], { jetzt });
  const leer = G.finden([], [], [], { jetzt });
  return {
    gesundGezaehlt: gesund.gezaehlt, gesundGesamt: gesund.gesamt,
    gesundSatz: gesund.satz,
    krankGezaehlt: krank.gezaehlt, krankSatz: krank.satz,
    leerGezaehlt: leer.gezaehlt, leerSatz: leer.satz
  };
}, { jetzt: JETZT, frisch: vorTagen(2) }) as any;

p('Ein gesunder Bestand zählt NULL — auch wenn eine Beobachtung darin steht',
  zaehlen.gesundGezaehlt === 0 && zaehlen.gesundGesamt > 0,
  zaehlen.gesundGezaehlt + ' von ' + zaehlen.gesundGesamt);
p('… und sagt das im Klartext statt eine leere Liste zu zeigen',
  /Nichts Auffälliges/.test(zaehlen.gesundSatz), zaehlen.gesundSatz);
p('GEGENPROBE: EIN Geist mit zwei Quellen macht daraus eine gezählte Lücke',
  zaehlen.krankGezaehlt === 1, String(zaehlen.krankGezaehlt));
p('… und der Satz nennt sie „deutlich"', /Deutlich/.test(zaehlen.krankSatz),
  zaehlen.krankSatz);
p('Ein leerer Bestand hat keine Lücken und behauptet auch keine',
  zaehlen.leerGezaehlt === 0 && /Keine Lücken/.test(zaehlen.leerSatz),
  zaehlen.leerSatz);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Sortiert wird nach Stärke, nicht nach Art');

const sortiert = await seite.evaluate(({ jetzt, frisch }: any) => {
  const b = KnowledgeGaps.finden(
    [{ id: 'a', titel: 'A', text: '', edited: frisch, grad: 1, rang: 1 }],
    [{ vonId: 'a', vonTitel: 'A', ziel: 'Weg', status: 'fehlt' },
     { vonId: 'a', vonTitel: 'A', ziel: 'Doppelt', status: 'mehrdeutig', kandidaten: 4 }],
    [{ tag: 'einmal', seiten: ['a'] }], { jetzt });
  return {
    reihe: b.funde.map((f: any) => f.art),
    staerken: b.funde.map((f: any) => f.staerke)
  };
}, { jetzt: JETZT, frisch: vorTagen(2) }) as any;

p('Der mehrdeutige Verweis steht vorn, der schwache Themen-Fund hinten',
  sortiert.reihe[0] === 'mehrdeutig' &&
  sortiert.reihe[sortiert.reihe.length - 1] === 'thema',
  JSON.stringify(sortiert.reihe));
p('… und die Stärken fallen wirklich monoton',
  sortiert.staerken.every((s: number, i: number) =>
    i === 0 || s <= sortiert.staerken[i - 1]),
  JSON.stringify(sortiert.staerken));

/* ------------------------------------------------------------------------ */
console.log('\n5 · Fragen: Überschriften und Code bleiben draussen');

const fragen = await seite.evaluate(() => {
  const G = KnowledgeGaps;
  return {
    ausUeberschrift: G.fragenAus('## Warum kippt die Spannung?').length,
    ausAbsatz: G.fragenAus('Warum kippt die Spannung unter Last?').length,
    ausCode: G.fragenAus('```\nconst x = a ? b : c; // Warum eigentlich das hier?\n```').length,
    nachCode: G.fragenAus('```\nx ? y : z\n```\nWarum kippt die Spannung unter Last?').length,
    zuKurz: G.fragenAus('Wie?').length,
    imFliesstext: G.fragenAus(
      'Das steht so im Buch. Warum kippt die Spannung unter Last? Das bleibt offen.').length,
    doppelt: G.fragenAus('Warum das so ist?\nWarum das so ist?').length,
    ausListe: G.fragenAus('- Warum kippt die Spannung unter Last?').length,
    /* Die Auszeichnung darf nicht im Titel landen (§55.1: beim Hinsehen
       stand da wörtlich `Statusübergänge**`). */
    ohneStern: G.fragenAus('**Statusübergänge** — von welchem Wert zu welchem?')[0]?.text,
    ohneCode: G.ohneMarkierung('Was macht `foo()` hier?'),
    /* Und der Unterschied, der die Liste rettet: eine Frage, die ALLEIN
       auf ihrer Zeile steht, wiegt mehr als eine, die zitiert wird. */
    allein: G.fragenAus('Warum kippt die Spannung unter hoher Last ab?')[0],
    zitiert: G.fragenAus(
      'Die Antwort auf die Frage „Warum kippt die Spannung unter hoher Last ab?" ' +
      'steht unten.')[0],
    sAllein: G.staerkeFrage(45, true), sZitiert: G.staerkeFrage(45, false)
  };
}) as any;

p('Eine Überschrift ist eine Gliederung, keine offene Frage',
  fragen.ausUeberschrift === 0, String(fragen.ausUeberschrift));
p('GEGENPROBE: derselbe Satz als Absatz WIRD gefunden', fragen.ausAbsatz === 1,
  String(fragen.ausAbsatz));
p('Ein `?` im Code ist keine Frage', fragen.ausCode === 0, String(fragen.ausCode));
p('… und nach dem Codeblock geht es normal weiter', fragen.nachCode === 1,
  String(fragen.nachCode));
p('„Wie?" ist zu kurz, um gemeint gewesen zu sein', fragen.zuKurz === 0);
p('Eine Frage mitten im Fliesstext wird gefunden', fragen.imFliesstext === 1,
  String(fragen.imFliesstext));
p('Dieselbe Frage zweimal ist ein Fund', fragen.doppelt === 1, String(fragen.doppelt));
p('Auch in einer Aufzählung', fragen.ausListe === 1, String(fragen.ausListe));
p('Die Auszeichnung landet NICHT im Titel',
  fragen.ohneStern === 'Statusübergänge — von welchem Wert zu welchem?',
  String(fragen.ohneStern));
p('… auch keine Code-Häkchen', fragen.ohneCode === 'Was macht foo() hier?',
  String(fragen.ohneCode));
p('Eine Frage allein auf ihrer Zeile gilt als gestellt',
  fragen.allein?.ganzeZeile === true, JSON.stringify(fragen.allein));
p('… eine zitierte nur als erwähnt', fragen.zitiert?.ganzeZeile === false,
  JSON.stringify(fragen.zitiert));
p('GEGENPROBE: und die zitierte wiegt weniger — sonst besteht die Liste aus Zitaten',
  fragen.sZitiert < fragen.sAllein && fragen.sZitiert < 40,
  fragen.sAllein + ' gegen ' + fragen.sZitiert);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Eine Karteikarte ist keine offene Frage');

const karten = await seite.evaluate(async () => {
  /* Zwei Seiten mit DEMSELBEN Fragetext — einmal als Karteikarte,
     einmal als Absatz. Nur die zweite darf auftauchen. */
  const frage = 'Wie gross ist der Widerstand bei doppelter Spannung?';
  const s1 = Store.addBlock(null, 'page', { text: 'Kartei-Seite' });
  Store.addBlock(s1.id, 'flashcard', { text: frage + ' :: Gleich gross.' });
  const s2 = Store.addBlock(null, 'page', { text: 'Absatz-Seite' });
  Store.addBlock(s2.id, 'text', { text: frage });

  const t1 = Wissensluecken.seitentext(s1.id);
  const t2 = Wissensluecken.seitentext(s2.id);
  /* `jeArt` hochgesetzt: der Demobestand bringt selbst schon mehr als
     dreissig Fragen mit, und mit der Vorgabe fiele die eben angelegte unter
     den Schnitt. Genau das war beim ersten Lauf rot — und es hat den
     Schnitt selbst verbessert (er ordnet jetzt vor dem Schneiden). */
  const b = Wissensluecken.befund({ jeArt: 5000 });
  const meine = b.funde.filter((f: any) => f.art === 'frage' &&
    String(f.titel).indexOf('doppelter Spannung') >= 0);
  return {
    s1: s1.id, s2: s2.id,
    kartenTextDrin: t1.indexOf('doppelter Spannung') >= 0,
    absatzTextDrin: t2.indexOf('doppelter Spannung') >= 0,
    treffer: meine.length,
    trefferSeite: meine[0] ? meine[0].seiteId : ''
  };
}) as any;

p('Der Text der Karteikarte wird beim Sammeln WEGGELASSEN',
  karten.kartenTextDrin === false);
p('GEGENPROBE: derselbe Text als Absatz ist sehr wohl dabei',
  karten.absatzTextDrin === true);
p('Also genau EIN Fund für diese Frage, nicht zwei', karten.treffer === 1,
  String(karten.treffer));
p('… und zwar auf der Absatz-Seite', karten.trefferSeite === karten.s2,
  karten.trefferSeite + ' statt ' + karten.s2);

const doppelseitig = await seite.evaluate(({ jetzt, frisch }: any) => {
  const frage = 'Wie stelle ich den Auslösestrom am FI-Schalter richtig ein?';
  const b = KnowledgeGaps.finden(
    [{ id: 'a', titel: 'Erste', text: frage, edited: frisch, grad: 2, rang: 1 },
     { id: 'b', titel: 'Zweite', text: frage, edited: frisch, grad: 2, rang: 1 }],
    [], [], { jetzt });
  const f = b.funde.filter((x: any) => x.art === 'frage');
  return { zahl: f.length, quellen: f[0] ? (f[0].quellen || []).length : 0,
           satz: f[0] ? f[0].satz : '' };
}, { jetzt: JETZT, frisch: vorTagen(2) }) as any;
p('Dieselbe Frage auf zwei Seiten ist EIN Fund mit zwei Quellen',
  doppelseitig.zahl === 1 && doppelseitig.quellen === 2,
  JSON.stringify(doppelseitig));
p('… und der Satz sagt das auch', /zwei Seiten|2 Seiten/.test(doppelseitig.satz),
  doppelseitig.satz);

/* ------------------------------------------------------------------------ */
console.log('\n7 · Gegen den echten Bestand — und der Rang ist verdrahtet');

const echt = await seite.evaluate(() => {
  const gesammelt = Wissensluecken.sammeln();
  const mitRang = gesammelt.seiten.filter((s: any) => s.rang > 0).length;
  const hoechster = gesammelt.seiten.reduce((m: number, s: any) =>
    Math.max(m, s.rang || 0), 0);
  const b = Wissensluecken.befund();
  return {
    seiten: gesammelt.seiten.length,
    verweise: gesammelt.verweise.length,
    themen: gesammelt.themen.length,
    mitRang, hoechster,
    /* Jeder Fund trägt einen Satz und eine Stärke — kein stummer Eintrag. */
    alleMitSatz: b.funde.every((f: any) => typeof f.satz === 'string' && f.satz.length > 5),
    alleMitStaerke: b.funde.every((f: any) =>
      typeof f.staerke === 'number' && f.staerke >= 0 && f.staerke <= 100),
    gezaehlt: b.gezaehlt, gesamt: b.gesamt
  };
}) as any;

p('Der echte Bestand liefert Seiten', echt.seiten > 0, String(echt.seiten));
p('DER RANG IST WIRKLICH VERDRAHTET — E285 war bis hier ungenutzt',
  echt.mitRang > 0 && echt.hoechster === 100,
  echt.mitRang + ' Seiten mit Rang, höchster ' + echt.hoechster);
p('Jeder Fund trägt einen Satz im Klartext', echt.alleMitSatz === true);
p('… und eine Stärke zwischen 0 und 100', echt.alleMitStaerke === true);
p('Gezählt wird höchstens, was gefunden wurde', echt.gezaehlt <= echt.gesamt,
  echt.gezaehlt + '/' + echt.gesamt);

/* ------------------------------------------------------------------------ */
console.log('\n8 · Die Ansicht');

const ansicht = await seite.evaluate(async () => {
  /* Ein Titel, der HTML enthält. Steht er ungeschützt im Overlay, entsteht
     daraus ein Element — genau das darf §19 nicht zulassen. */
  const boese = Store.addBlock(null, 'page',
    { text: '<img src=x onerror=alert(1)>Böse Seite' });
  Store.addBlock(boese.id, 'text', { text: 'Zeigt auf [[Gibt Es Nicht 4711]].' });
  const zweite = Store.addBlock(null, 'page', { text: 'Zweite Quelle' });
  Store.addBlock(zweite.id, 'text', { text: 'Zeigt auch auf [[Gibt Es Nicht 4711]].' });

  const b = Wissensluecken.befund();
  Wissensluecken.zeigen();
  await new Promise(r => setTimeout(r, 400));
  const box = document.querySelector('.wl-box');
  const kopf = box?.querySelector('#wl-titel em');
  const funde = box?.querySelectorAll('.wl-fund') || [];
  const anlegen = box?.querySelectorAll('[data-anlegen]') || [];
  const staerken = [...(box?.querySelectorAll('.wl-staerke') || [])]
    .map(e => (e.textContent || '').trim());
  return {
    da: !!box,
    kopfZahl: kopf ? kopf.textContent : '',
    erwartet: String(b.gezaehlt),
    funde: funde.length,
    anlegenKnopf: anlegen.length,
    /* Die Stärke muss als ZAHL dastehen und nicht nur als Farbe (§38). */
    staerkenSindZahlen: staerken.length > 0 &&
      staerken.every(t => /^\d+$/.test(t)),
    /* Kein eingeschleustes Element aus dem Titel. */
    keinBild: !box?.querySelector('img[src="x"]'),
    /* Aber der Text steht sehr wohl lesbar da. */
    textDa: (box?.textContent || '').indexOf('Böse Seite') >= 0 ||
            (box?.textContent || '').indexOf('Gibt Es Nicht 4711') >= 0,
    /* Der Geist muss ihn gefunden haben — zwei Quellen. */
    geist: b.funde.filter((f: any) =>
      f.art === 'geist' && f.titel === 'Gibt Es Nicht 4711')
      .map((f: any) => ({ s: f.staerke, q: (f.quellen || []).length }))
  };
}) as any;

p('Das Fenster steht', ansicht.da === true);
p('Die Zahl im Kopf ist die GEZÄHLTE, nicht die gesamte',
  ansicht.kopfZahl === ansicht.erwartet,
  ansicht.kopfZahl + ' statt ' + ansicht.erwartet);
p('Funde stehen in der Liste', ansicht.funde > 0, String(ansicht.funde));
p('Ein Geist bekommt einen „Seite anlegen"-Knopf', ansicht.anlegenKnopf > 0,
  String(ansicht.anlegenKnopf));
p('Die Stärke steht als Zahl da, nicht nur als Farbe (§38)',
  ansicht.staerkenSindZahlen === true);
p('Ein Seitentitel mit HTML wird ESCAPED — kein eingeschleustes Element (§19)',
  ansicht.keinBild === true);
p('… und ist trotzdem lesbar', ansicht.textDa === true);
p('Der neue Geist wurde gefunden, mit beiden Quellen',
  ansicht.geist.length === 1 && ansicht.geist[0].q === 2 && ansicht.geist[0].s === 60,
  JSON.stringify(ansicht.geist));

const band = await seite.evaluate(() => {
  const e = Register.menueband.eines('w-luecken');
  return { da: !!e, name: e ? e.name : '', reiter: e ? e.reiter : '' };
}) as any;
p('Der Weg dorthin steht im Menüband', band.da === true, JSON.stringify(band));
p('… unter „Überprüfen"', band.reiter === 'ueberpruefen', band.reiter);

/* ------------------------------------------------------------------------ */
console.log('\n9 · Ein Schnitt, der sich verschweigt, liest sich wie Vollständigkeit');

const schnitt = await seite.evaluate(({ jetzt, frisch }: any) => {
  const G = KnowledgeGaps;
  /* Fünfzig Geister, aber nur zehn dürfen gezeigt werden. */
  const verweise = [];
  for (let i = 0; i < 50; i++)
    verweise.push({ vonId: 'a', vonTitel: 'A', ziel: 'Geist ' + i, status: 'fehlt' });
  const eng = G.finden(
    [{ id: 'a', titel: 'A', text: '', edited: frisch, grad: 1, rang: 1 }],
    verweise, [], { jetzt, jeArt: 10 });
  const weit = G.finden(
    [{ id: 'a', titel: 'A', text: '', edited: frisch, grad: 1, rang: 1 }],
    verweise, [], { jetzt, jeArt: 500 });

  /* Und: geschnitten wird nach STÄRKE. Der Geist, auf den drei Seiten
     zeigen, muss die Auswahl überleben, auch wenn er zuletzt kommt. */
  const gemischt = [];
  for (let i = 0; i < 20; i++)
    gemischt.push({ vonId: 'a', vonTitel: 'A', ziel: 'Schwach ' + i, status: 'fehlt' });
  for (const von of ['a', 'b', 'c'])
    gemischt.push({ vonId: von, vonTitel: von.toUpperCase(), ziel: 'Zzz Stark',
                    status: 'fehlt' });
  const auswahl = G.finden(
    [{ id: 'a', titel: 'A', text: '', edited: frisch, grad: 1, rang: 1 }],
    gemischt, [], { jetzt, jeArt: 3 });

  return {
    engZahl: eng.funde.length, engWeg: eng.abgeschnitten, engSatz: eng.satz,
    weitZahl: weit.funde.length, weitWeg: weit.abgeschnitten, weitSatz: weit.satz,
    starkDrin: auswahl.funde.some((f: any) => f.titel === 'Zzz Stark')
  };
}, { jetzt: JETZT, frisch: vorTagen(2) }) as any;

p('Zehn von fünfzig werden gezeigt', schnitt.engZahl === 10, String(schnitt.engZahl));
p('… und die anderen vierzig werden GENANNT, nicht verschwiegen',
  schnitt.engWeg === 40 && /Weitere 40/.test(schnitt.engSatz), schnitt.engSatz);
p('GEGENPROBE: passt alles hinein, wird auch nichts behauptet',
  schnitt.weitZahl === 50 && schnitt.weitWeg === 0 && !/Weitere/.test(schnitt.weitSatz),
  schnitt.weitSatz);
p('Geschnitten wird nach STÄRKE — der starke Geist überlebt, obwohl er hinten steht',
  schnitt.starkDrin === true);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
