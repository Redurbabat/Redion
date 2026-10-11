/* Suite 608 — Alte Klemmennamen bleiben gültig (E738, L252)
 * ============================================================================
 * Mit dem Elektro-Bogen (E735, E737) haben vier Zeichen, die es auf `main`
 * schon gab, andere Klemmen bekommen:
 *
 *     stecker            '1' bei x=20          → L bei x=10, N bei x=30
 *     fi-schutzschalter  zweimal 'N'           → N oben, N2 unten
 *     steckdose          L bei x=30            → L bei x=20, N bei x=40
 *     steckdose-schuko   L bei x=30            → L bei x=10, N bei x=30, PE bei x=50
 *
 * Eine Leitung speichert ihre Bindung als `vonTeil`/`vonNr` und dazu ihre
 * Punkte. Ein Plan, der VOR der Änderung gespeichert wurde, rechnete danach
 * anders, ohne dass es jemand sah — gemessen am 11. Oktober mit einer Sonde
 * gegen `main` (1575a1835) und gegen den Übernahme-Commit ohne Auflöser:
 *
 *   · die Leitung am Stecker '1' fiel ab (den Namen gibt es nicht mehr, und
 *     der alte Ort liegt 10 px neben beiden neuen Klemmen, NAH ist 6);
 *   · am Schuko lag die alte L-Leitung jetzt auf N — L und N verbunden,
 *     und KEINE Meldung, weil eine Steckdose keine Leiterrolle hat;
 *   · eine waagrecht von rechts kommende Leitung zapfte die neuen Klemmen
 *     N und PE an;
 *   · am FI band die alte untere 'N'-Leitung über den Namen an das OBERE N
 *     und über den Ort an N2 — der Neutralleiterpol war überbrückt, und ein
 *     gesunder Lampenkreis meldete „löst aus" mit 435 mA Fehlerstrom: dem
 *     ganzen Lampenstrom.
 *
 * Die Reparatur ist Weg 2 aus der Lücke: die alten Namen gelten beim LESEN
 * weiter, die gespeicherten Daten bleiben, wie sie sind (darum zweimal
 * gelesen gleich — idempotent ohne eigene Vorkehrung). EIN Auflöser im
 * Register, `Register.fachzeichen.klemmeFuer`, und drei Stellen, die ihn
 * fragen: die Netzliste, `anschlussLage` und das Nachziehen der Leitungen
 * beim Schieben, Drehen und Ziehen.
 *
 *   §1 Der Auflöser: Ort vor Name, alte Namen als Zweitnamen
 *   §2 Alte Steckvorrichtungen: dieselben Netze wie auf main, neue Klemmen allein
 *   §3 Der alte FI: N und N2 getrennt, der gesunde Kreis löst NICHT aus
 *   §4 Die gespeicherten Daten bleiben, wie sie sind
 *   §5 Schieben, Drehen, Ziehen: jedes Leitungsende auf der richtigen Klemme
 *   §6 Alle anderen Zeichen: der Auflöser ändert nichts
 *
 * KANN DIESE SUITE ROT WERDEN? (§55.2) Ja: gegen den Übernahme-Commit ohne
 * Auflöser ist sie rot in §1, §2, §3 und §5 — die Zeilen stehen im
 * Commit „test608 (rot)".
 *
 *   node pruefungen/lauf/test608.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Schaltplan: any; declare const Stromfluss: any; declare const Register: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
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
/* Port 0: der Rechner vergibt einen freien (test400 zählt das mit). */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

/* ==========================================================================
 * DIE PLÄNE IM ALTEN FORMAT
 * --------------------------------------------------------------------------
 * So, wie `main` sie vor der Übernahme gespeichert hätte. Die Koordinaten
 * sind absichtlich gewählt: a1 fällt senkrecht auf den alten Stecker-
 * anschluss, a2 und a4 kommen WAAGRECHT von rechts (und laufen damit über
 * die neue N-Klemme), a5 fällt senkrecht auf den alten Schuko-Anschluss
 * (dort liegt heute N), a6 läuft waagrecht über PE auf N. a5 hat am Anfang
 * keine Bindung — sie zapft a1 an, wie eine Sammelschiene.
 * ========================================================================*/
const PLAENE = `
  const T = (id, zeichen, x, y) => ({ id, zeichen, x, y, drehung: 0, gespiegelt: false,
                                      bmk: id, nummern: {}, gruppe: '', ebene: 'plan' });
  const L = (id, punkte, vonTeil, vonNr, nachTeil, nachNr) => {
    const l = { id, ebene: 'plan', punkte: punkte.map(([x, y]) => ({ x, y })) };
    if (vonTeil) { l.vonTeil = vonTeil; l.vonNr = vonNr; }
    if (nachTeil) { l.nachTeil = nachTeil; l.nachNr = nachNr; }
    return l;
  };
  const ebenen = [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }];
  return {
    A: { art: 'stromlauf-aufgeloest', breite: 1100, hoehe: 700, texte: [], ebenen,
      teile: [T('G1', 'wechselspannung', 100, 200),
              T('X1', 'stecker', 300, 100), T('X2', 'stecker', 500, 100),
              T('X3', 'steckdose', 300, 400), T('X4', 'steckdose', 500, 400),
              T('X5', 'steckdose-schuko', 700, 400), T('X6', 'steckdose-schuko', 900, 400)],
      leitungen: [
        L('a1', [[130, 200], [130, 60], [320, 60], [320, 100]], 'G1', 'L', 'X1', '1'),
        L('a2', [[130, 260], [60, 260], [60, 40], [600, 40], [600, 100], [520, 100]], 'G1', 'N', 'X2', '1'),
        L('a3', [[130, 200], [330, 200], [330, 400]], 'G1', 'L', 'X3', 'L'),
        L('a4', [[130, 260], [130, 500], [620, 500], [620, 400], [530, 400]], 'G1', 'N', 'X4', 'L'),
        L('a5', [[130, 150], [730, 150], [730, 400]], null, null, 'X5', 'L'),
        L('a6', [[130, 260], [130, 560], [1000, 560], [1000, 400], [930, 400]], 'G1', 'N', 'X6', 'L')
      ] },
    B: { art: 'stromlauf-aufgeloest', breite: 600, hoehe: 500, texte: [], ebenen,
      teile: [T('G1', 'wechselspannung', 100, 100), T('F1', 'fi-schutzschalter', 300, 100),
              T('E1', 'lampe', 300, 300)],
      leitungen: [
        L('b1', [[130, 100], [130, 60], [310, 60], [310, 100]], 'G1', 'L', 'F1', '1'),
        L('b2', [[130, 160], [70, 160], [70, 30], [350, 30], [350, 100]], 'G1', 'N', 'F1', 'N'),
        L('b3', [[310, 170], [310, 240], [330, 240], [330, 300]], 'F1', '2', 'E1', 'X1'),
        L('b4', [[350, 170], [350, 400], [330, 400], [330, 360]], 'F1', 'N', 'E1', 'X2')
      ] }
  };`;

/* Welche HEUTIGE Klemme jedes Leitungsende meint — die Antwort, an der §5
   misst. Aus dem alten Plan abgelesen, nicht aus dem Code. */
const SOLL_ENDEN: Record<string, { von?: [string, string]; nach?: [string, string] }> = {
  a1: { von: ['G1', 'L'], nach: ['X1', 'L'] }, a2: { von: ['G1', 'N'], nach: ['X2', 'L'] },
  a3: { von: ['G1', 'L'], nach: ['X3', 'L'] }, a4: { von: ['G1', 'N'], nach: ['X4', 'L'] },
  a5: { nach: ['X5', 'L'] },                   a6: { von: ['G1', 'N'], nach: ['X6', 'L'] },
  b1: { von: ['G1', 'L'], nach: ['F1', '1'] }, b2: { von: ['G1', 'N'], nach: ['F1', 'N'] },
  b3: { von: ['F1', '2'], nach: ['E1', 'X1'] }, b4: { von: ['F1', 'N2'], nach: ['E1', 'X2'] }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const seite = await ktx.newPage();
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://127.0.0.1:${PORT}/index.html`);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Stromfluss !== 'undefined'
  && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
await seite.evaluate((quelle: string) => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta('neuerungenGesehen', 99);
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
    .forEach(el => el.remove());
  // eslint-disable-next-line no-new-func
  (window as any).altePlaene = new Function(quelle);
  /** Die Netze eines Plans als sortierte Gruppen „Teil:Klemme". */
  (window as any).gruppen = (plan: any): string[] => {
    const ni = Stromfluss.netze(plan);
    const g = new Map<number, string[]>();
    (ni.klemmen as any[]).forEach(k => {
      if (k.intern) return;
      const n = ni.netzVon.get(k.schluessel);
      if (!g.has(n)) g.set(n, []);
      const name = k.teil + ':' + k.nr;
      if (!g.get(n)!.includes(name)) g.get(n)!.push(name);
    });
    return [...g.values()].map(x => x.sort().join(' ')).sort();
  };
}, PLAENE);

/* ==========================================================================
 * §1 · Der Auflöser: Ort vor Name, alte Namen als Zweitnamen
 * ========================================================================*/
console.log('\n1 · Der Auflöser im Register');

const aufl = await seite.evaluate(() => {
  const F = Register.fachzeichen;
  if (typeof F.klemmeFuer !== 'function') return null;
  const k = (id: string, nr: string, punkt?: { x: number; y: number }, dreh = 0, sp = false) => {
    const r = F.klemmeFuer(id, nr, punkt, dreh, sp);
    return r ? r.nr : null;
  };
  return {
    stecker1:      k('stecker', '1'),
    stecker1Ort:   k('stecker', '1', { x: 20, y: 0 }),
    fiUntenAlt:    k('fi-schutzschalter', 'N', { x: 50, y: 70 }),
    fiObenAlt:     k('fi-schutzschalter', 'N', { x: 50, y: 0 }),
    fiOhneOrt:     k('fi-schutzschalter', 'N'),
    fiN2:          k('fi-schutzschalter', 'N2', { x: 50, y: 70 }),
    /* Gedreht: der Ort wird in derselben Drehung verglichen, in der die
       Klemmen liegen. 90° um die Mitte (30,35) — aus (50,70) wird (-5,55). */
    fiUntenGedreht: k('fi-schutzschalter', 'N', F.anschlussLage('fi-schutzschalter', 'N2', 90, false), 90),
    schukoAlt:     k('steckdose-schuko', 'L', { x: 30, y: 0 }),
    schukoNeuN:    k('steckdose-schuko', 'N', { x: 30, y: 0 }),
    dosenAlt:      k('steckdose', 'L', { x: 30, y: 0 }),
    unbekanntNr:   k('stecker', 'gibtsnicht'),
    unbekanntZ:    k('gibtesnicht', '1'),
    lageStecker1:  F.anschlussLage('stecker', '1'),
    lageL:         F.anschlussLage('stecker', 'L'),
    lageUnbekannt: F.anschlussLage('stecker', 'gibtsnicht')
  };
});
p('Register.fachzeichen.klemmeFuer gibt es', !!aufl);
if (aufl) {
  gleich('Stecker: der alte Name „1" ist heute L', aufl.stecker1, 'L');
  gleich('… auch am alten Ort (x=20, zwischen L und N)', aufl.stecker1Ort, 'L');
  gleich('FI: „N" am alten UNTEREN Ort ist heute N2 — der Ort entscheidet', aufl.fiUntenAlt, 'N2');
  gleich('FI: „N" am oberen Ort bleibt N', aufl.fiObenAlt, 'N');
  gleich('FI: „N" ohne Ort bleibt N (der Name gilt, wo der Ort nichts sagt)', aufl.fiOhneOrt, 'N');
  gleich('FI: der heutige Name N2 bleibt N2', aufl.fiN2, 'N2');
  gleich('FI gedreht: der alte untere Ort wird mitgedreht', aufl.fiUntenGedreht, 'N2');
  gleich('Schuko: „L" am alten Ort (heute liegt dort N) bleibt L', aufl.schukoAlt, 'L');
  gleich('Schuko: eine heutige N-Leitung an derselben Stelle bleibt N', aufl.schukoNeuN, 'N');
  gleich('Steckdose: „L" am alten Ort bleibt L', aufl.dosenAlt, 'L');
  gleich('Ein unbekannter Klemmenname bleibt unbekannt — nichts wird erfunden', aufl.unbekanntNr, null);
  gleich('Ein unbekanntes Zeichen gibt null', aufl.unbekanntZ, null);
  gleich('anschlussLage kennt den alten Namen: „1" liegt bei L', aufl.lageStecker1, aufl.lageL);
  /* Hier stand `|| z.anschluesse[0]`: ein unbekannter Name rastete an der
     ERSTEN Klemme ein, und die Leitung war mit etwas verbunden, das niemand
     gezogen hatte. */
  gleich('anschlussLage erfindet für einen unbekannten Namen keine Klemme', aufl.lageUnbekannt, null);
} else {
  weg += 14;
  console.log('  ✗ (14 Zusagen übersprungen — es gibt keinen Auflöser)');
}

/* ==========================================================================
 * §2 · Alte Steckvorrichtungen: dieselben Netze wie auf main
 * --------------------------------------------------------------------------
 * Gemessen auf main (1575a1835) mit derselben Planbeschreibung:
 *   { G1:L X1:1 X3:L X5:L }   { G1:N X2:1 X4:L X6:L }
 * Umbenannt ('1' → L) ist das die erste Hälfte des Solls; die zweite ist,
 * dass jede NEUE Klemme allein steht — an ihr hing vorher nichts, also darf
 * auch jetzt nichts an ihr hängen.
 * ========================================================================*/
console.log('\n2 · Alte Steckvorrichtungen');

const netzeA = await seite.evaluate(() =>
  (window as any).gruppen((window as any).altePlaene().A));
const SOLL_A = ['G1:L X1:L X3:L X5:L', 'G1:N X2:L X4:L X6:L',
  'X1:N', 'X2:N', 'X3:N', 'X4:N', 'X5:N', 'X5:PE', 'X6:N', 'X6:PE'].sort();
gleich('Die Netze sind die von main, mit den neuen Namen', netzeA, SOLL_A);
const inNetz = (gr: string[], a: string, b: string) => gr.some(g => g.split(' ').includes(a) && g.split(' ').includes(b));
p('Stecker X1: die Leitung hängt an L und fällt nicht ab', inNetz(netzeA, 'G1:L', 'X1:L'));
p('Stecker X2: von rechts kommend zapft sie N NICHT an', !inNetz(netzeA, 'G1:N', 'X2:N'));
p('Schuko X5: L und N sind NICHT verbunden', !inNetz(netzeA, 'X5:L', 'X5:N'));
p('Schuko X6: von rechts kommend hängen N und PE nicht am Neutralleiter',
  !inNetz(netzeA, 'G1:N', 'X6:N') && !inNetz(netzeA, 'G1:N', 'X6:PE'));
p('Steckdose X4: von rechts kommend zapft sie N nicht an', !inNetz(netzeA, 'G1:N', 'X4:N'));

/* ==========================================================================
 * §3 · Der alte FI: N und N2 getrennt, der gesunde Kreis löst nicht aus
 * --------------------------------------------------------------------------
 * Auf main waren oben und unten dieselbe Klemme (`k:F1:N` zweimal) — das ist
 * der Fehler, den E735 behoben hat, und darum die eine gewollte Abweichung
 * von main: die untere Leitung hängt an N2.
 * ========================================================================*/
console.log('\n3 · Der alte Fehlerstrom-Schutzschalter');

const fi = await seite.evaluate(() => {
  const plan = (window as any).altePlaene().B;
  const gr = (window as any).gruppen(plan);
  const e = Stromfluss.rechne(plan, {});
  const pole = (e.teilwerte && e.teilwerte.F1) || {};
  let re = 0, im = 0;
  Object.keys(pole).forEach(k => { re += pole[k].Ire; im += pole[k].Iim; });
  const aus = Stromfluss.rechne(plan, { F1: 1 });
  return {
    gr, ok: e.ok, funde: (e.anschlussfehler || []).map((f: any) => f.art),
    lampe: e.werte.E1 ? { fliesst: e.werte.E1.fliesst, I: e.werte.E1.Ibetrag } : null,
    nPol: pole['N–N2'] ? pole['N–N2'].Ibetrag : null,
    fehlstrom: Math.hypot(re, im),
    ausgeloestLeuchtet: aus.werte.E1 ? aus.werte.E1.fliesst : null
  };
});
gleich('Die Netze: N oben, N2 unten, jedes an seiner Leitung', fi.gr,
  ['E1:X1 F1:2', 'E1:X2 F1:N2', 'F1:1 G1:L', 'F1:3', 'F1:4', 'F1:N G1:N'].sort());
p('N und N2 sind ZWEI Netze', !inNetz(fi.gr, 'F1:N', 'F1:N2'));
p('Der Kreis rechnet', fi.ok);
p('Die Lampe leuchtet', !!fi.lampe && fi.lampe.fliesst, JSON.stringify(fi.lampe));
p('Der Neutralleiter läuft durch den Pol N–N2 — derselbe Strom wie in der Lampe',
  fi.nPol !== null && !!fi.lampe && Math.abs(fi.nPol - fi.lampe.I) < 1e-6,
  `Pol ${fi.nPol} A, Lampe ${fi.lampe ? fi.lampe.I : '—'} A`);
p('Die Zeigersumme durch den FI ist null (unter 1 mA)', fi.fehlstrom < 0.001,
  `${(fi.fehlstrom * 1000).toFixed(1)} mA`);
p('Ein gesunder Kreis meldet KEINEN Fehlerstrom',
  !fi.funde.some((a: string) => /^fi-/.test(a)), 'gemeldet: ' + (fi.funde.join(', ') || '(nichts)'));
p('Ausgelöst trennt er wirklich — auch den Neutralleiter', fi.ausgeloestLeuchtet === false);

/* ==========================================================================
 * Die Pläne als Blöcke in der App — für §4 und §5
 * ========================================================================*/
const oeffne = async (welcher: 'A' | 'B'): Promise<string> => {
  const id = await seite.evaluate(async (w: string) => {
    const plan = (window as any).altePlaene()[w];
    const s = Store.addPage(null, { text: 'Alter Plan ' + w });
    const b = Store.addBlock(s.id, 'schaltplan', { text: 'Alt ' + w, plan });
    await Store.flush();
    App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return b.id;
  }, welcher);
  await seite.waitForSelector('.sp-wrap .sp-teil');
  return id;
};
/** Der Plan, wie die Ablage ihn JETZT hält. */
const gespeichert = (id: string): Promise<any> =>
  seite.evaluate((i: string) => JSON.parse(JSON.stringify(Store.getBlock(i).plan)), id);

/** Liegt jedes Leitungsende auf der Klemme, die es meint? Gibt die Abweichler. */
const endenPruefen = (id: string): Promise<string[]> =>
  seite.evaluate(([i, soll]: [string, any]) => {
    const plan = Store.getBlock(i).plan;
    const teil = (tid: string) => (plan.teile as any[]).find(t => t.id === tid);
    const raus: string[] = [];
    (plan.leitungen as any[]).forEach(l => {
      const s = soll[l.id];
      if (!s) return;
      const pruef = (ende: [string, string] | undefined, punkt: any, wo: string) => {
        if (!ende) return;
        const o = Schaltplan.anschlussOrt(teil(ende[0]), ende[1]);
        if (!o || o.x !== punkt.x || o.y !== punkt.y)
          raus.push(`${l.id}.${wo} liegt bei ${punkt.x},${punkt.y}, ${ende[0]}:${ende[1]} bei ${o ? o.x + ',' + o.y : '—'}`);
      };
      pruef(s.von, l.punkte[0], 'von');
      pruef(s.nach, l.punkte[l.punkte.length - 1], 'nach');
    });
    return raus;
  }, [id, SOLL_ENDEN] as [string, any]);

/** Ein Teil anklicken (wählt es aus) — Mitte seines Kastens. */
const waehle = async (tid: string): Promise<void> => {
  const box = await seite.locator(`.sp-wrap svg .sp-teil[data-id="${tid}"]`).boundingBox();
  if (!box) throw new Error('Teil nicht gefunden: ' + tid);
  await seite.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await seite.waitForTimeout(450);    // kein Doppeltipp (400 ms)
};
const taste = async (key: string): Promise<void> => {
  await seite.evaluate((k: string) => {
    const el = document.querySelector<HTMLElement>('.sp-wrap');
    if (!el) throw new Error('keine Planfläche');
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  }, key);
  await seite.waitForTimeout(200);
};
const ziehe = async (tid: string, dx: number, dy: number): Promise<void> => {
  const box = await seite.locator(`.sp-wrap svg .sp-teil[data-id="${tid}"]`).boundingBox();
  if (!box) throw new Error('Teil nicht gefunden: ' + tid);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await seite.mouse.move(x, y);
  await seite.mouse.down();
  for (let i = 1; i <= 6; i++) await seite.mouse.move(x + dx * i / 6, y + dy * i / 6);
  await seite.mouse.up();
  await seite.waitForTimeout(450);
};

/* ==========================================================================
 * §4 · Die gespeicherten Daten bleiben, wie sie sind
 * ========================================================================*/
console.log('\n4 · Die gespeicherten Daten bleiben, wie sie sind');

const blockB = await oeffne('B');
await seite.waitForTimeout(300);
const geladenB = await gespeichert(blockB);
const b4 = (geladenB.leitungen as any[]).find(l => l.id === 'b4');
gleich('Nach dem Öffnen trägt die untere FI-Leitung weiter „N"', b4 && b4.vonNr, 'N');
gleich('… und ihre Punkte sind unverändert', b4 && b4.punkte[0], { x: 350, y: 170 });
const zweimal = await seite.evaluate((i: string) => {
  const plan = Store.getBlock(i).plan;
  return JSON.stringify((window as any).gruppen(plan)) === JSON.stringify((window as any).gruppen(plan));
}, blockB);
p('Zweimal gelesen gibt zweimal dasselbe Netz (idempotent)', zweimal);

/* ==========================================================================
 * §5 · Schieben, Drehen, Ziehen: jedes Ende auf der richtigen Klemme
 * --------------------------------------------------------------------------
 * Ohne Auflöser fragte das Nachziehen `anschlussOrt(teil, 'N')` — und das
 * ist beim alten FI das OBERE N. Die untere Leitung sprang nach dem
 * Verschieben auf den Eingang; der Plan sah verdrahtet aus, wo er es nicht
 * war.
 *
 * DIE NETZE PRÜFT ER ERST, WENN DER FI WIEDER AN SEINEM PLATZ STEHT.
 * Drehen führt ALLE Leitungen des Plans neu als Winkel vom einen Ende zum
 * anderen (`leitungenNachziehen`, so schon auf main), und beim gedrehten
 * FI läuft der neue Weg von b2 5 px neben N2 vorbei — angezapft. Das ist
 * ein Befund über das Nachziehen, nicht über die Namen (L253), und der
 * erste Stand dieses Laufs hat ihn mitgemessen: „N und N2 weiter zwei
 * Netze" war nach dem Drehen auch MIT Auflöser rot. Deshalb: hin (schieben,
 * drehen), Enden prüfen, zurück (dreimal drehen, zurückschieben), dann die
 * Netze; das Ziehen mit der Maus zuletzt.
 * ========================================================================*/
console.log('\n5 · Schieben, Drehen, Ziehen');

const lage = (i: string) => seite.evaluate((b: string) => {
  const f = (Store.getBlock(b).plan.teile as any[]).find(t => t.id === 'F1');
  return { x: f.x, y: f.y, drehung: f.drehung };
}, i);

await waehle('F1');
await taste('ArrowRight');
let abw = await endenPruefen(blockB);
p('FI mit der Pfeiltaste geschoben: jedes Ende auf seiner Klemme', abw.length === 0, abw.join(' | '));
await taste('r');
abw = await endenPruefen(blockB);
p('FI gedreht: jedes Ende auf seiner Klemme', abw.length === 0, abw.join(' | '));
const hin = await lage(blockB);
p('Der FI hat sich wirklich bewegt und gedreht', hin.drehung === 90 && hin.x === 310,
  JSON.stringify(hin));
for (let i = 0; i < 3; i++) await taste('r');
await taste('ArrowLeft');
abw = await endenPruefen(blockB);
p('Zurückgedreht und zurückgeschoben: jedes Ende auf seiner Klemme', abw.length === 0, abw.join(' | '));
const zurueck = await seite.evaluate((i: string) => {
  const plan = Store.getBlock(i).plan;
  const f = (plan.teile as any[]).find(t => t.id === 'F1');
  const e = Stromfluss.rechne(plan, {});
  return { gr: (window as any).gruppen(plan), lage: { x: f.x, y: f.y, drehung: f.drehung },
           funde: (e.anschlussfehler || []).map((x: any) => x.art),
           lampe: e.werte.E1 ? e.werte.E1.fliesst : null,
           vonNr: (plan.leitungen as any[]).find(l => l.id === 'b4').vonNr };
}, blockB);
gleich('Der FI steht wieder an seinem Platz', zurueck.lage, { x: 300, y: 100, drehung: 0 });
p('Danach sind N und N2 weiter zwei Netze', !inNetz(zurueck.gr, 'F1:N', 'F1:N2'), zurueck.gr.join(' | '));
p('Die Lampe leuchtet weiter', zurueck.lampe === true);
p('Und der gesunde Kreis meldet weiter keinen Fehlerstrom',
  !zurueck.funde.some((a: string) => /^fi-/.test(a)), zurueck.funde.join(', ') || '(nichts)');
gleich('Auch nach dem Bearbeiten steht in der Ablage der alte Name', zurueck.vonNr, 'N');
await ziehe('F1', 60, 40);
abw = await endenPruefen(blockB);
p('FI mit der Maus gezogen: jedes Ende auf seiner Klemme', abw.length === 0, abw.join(' | '));
const gezogen = await lage(blockB);
p('Er ist dabei wirklich gewandert', gezogen.x !== 300 || gezogen.y !== 100, JSON.stringify(gezogen));

const blockA = await oeffne('A');
await seite.waitForTimeout(300);
for (const tid of ['X2', 'X4', 'X5']) {
  await waehle(tid);
  await taste('r');
}
abw = await endenPruefen(blockA);
p('Stecker, Steckdose und Schuko gedreht: jedes Ende auf L', abw.length === 0, abw.join(' | '));
await ziehe('X6', -40, 60);
abw = await endenPruefen(blockA);
p('Schuko mit der Maus gezogen: jedes Ende auf L', abw.length === 0, abw.join(' | '));
const nachA = await seite.evaluate((i: string) => (window as any).gruppen(Store.getBlock(i).plan), blockA);
p('Danach hängt am Schuko X5 weiter nichts an N', !inNetz(nachA, 'G1:L', 'X5:N') && !inNetz(nachA, 'X5:L', 'X5:N'),
  nachA.join(' | '));
p('Und am Stecker X1 hängt die Leitung weiter an L', inNetz(nachA, 'G1:L', 'X1:L'), nachA.join(' | '));

/* ==========================================================================
 * §6 · Alle anderen Zeichen: der Auflöser ändert nichts
 * ========================================================================*/
console.log('\n6 · Alle anderen Zeichen');

const rest = await seite.evaluate(() => {
  const F = Register.fachzeichen;
  if (typeof F.klemmeFuer !== 'function') return null;
  const mitFrueher: string[] = [];
  const abweichend: string[] = [];
  (F.alle() as any[]).forEach(z => {
    if (z.frueher) mitFrueher.push(z.id);
    (z.anschluesse as any[]).forEach((a, i) => {
      /* Ein Zeichen mit zweimal demselben Namen (die Leitersymbole L1…PE)
         meint mit dem Namen die ERSTE — so wie vorher. */
      const erste = (z.anschluesse as any[]).findIndex(b => b.nr === a.nr);
      const r = F.klemmeFuer(z.id, a.nr, { x: a.x, y: a.y });
      if (!r || r.nr !== a.nr) abweichend.push(`${z.id}:${a.nr}→${r ? r.nr : 'null'}`);
      const lage = F.anschlussLage(z.id, a.nr);
      const soll = (z.anschluesse as any[])[erste];
      if (!lage || lage.x !== soll.x || lage.y !== soll.y) abweichend.push(`${z.id}:${a.nr}@${i} Lage`);
    });
  });
  return { mitFrueher: mitFrueher.sort(), abweichend, anzahl: F.alle().length };
});
p('Es gibt einen Auflöser für §6', !!rest);
if (rest) {
  gleich('Genau die vier geänderten Zeichen tragen „frueher"', rest.mitFrueher,
    ['fi-schutzschalter', 'steckdose', 'steckdose-schuko', 'stecker']);
  p(`Jede heutige Klemme aller ${rest.anzahl} Zeichen löst zu sich selbst auf`,
    rest.abweichend.length === 0, rest.abweichend.slice(0, 6).join(' | '));
} else weg += 2;

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
