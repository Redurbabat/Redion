/* Suite 611 — Drehen, Spiegeln, Ziehen und Schieben zapfen nichts an (E746, L253 Punkt 4)
 * ============================================================================
 * Eine Handlung, die nur die LAGE eines Teils ändert, darf die Netzliste des
 * Plans nicht ändern. Auf `main` (97d156b03) tat sie es: Drehen, Spiegeln und
 * Ziehen mit der Maus führten ALLE Leitungen des Plans neu
 * (`leitungenNachziehen`), jede als Winkel von Ende zu Ende — auch die, die
 * mit dem Teil nichts zu tun hatten —, und der neue Weg konnte eine Klemme
 * anzapfen, die vorher frei war.
 *
 * Gemessen beim Bau von `test608` (L253 Punkt 4): nach dem Drehen des alten
 * FI läuft b2 5 px neben N2 vorbei, und N und N2 sind ein Netz. Gemessen am
 * 11. Oktober im Plan „Drehstrom, FI und Übertrager" (den die Bilder der
 * Übernahme zeigen): F1 gedreht, und aus sechs Netzen um den FI wird EINES —
 * L und N der Quelle G2 verbunden, „beide Anschlüsse hängen am selben Netz",
 * nichts mehr gerechnet. Die Motorleitung w4, die mit dem FI nichts zu tun
 * hat, verlor dabei ihren gezeichneten Weg unter dem Klemmenbrett.
 *
 * WAS DIESER LAUF VERLANGT, JE HANDLUNG
 *
 *   · die Netzliste (Klemmen UND Leitungen, aus `Stromfluss.netze`) ist
 *     dieselbe wie vorher;
 *   · jede Leitung, die an keinem bewegten Teil hängt, behält ihre
 *     gespeicherten Punkte Byte für Byte;
 *   · jede Leitung fasst danach genau die Klemmen, die sie vorher fasste —
 *     gefragt bei der Netzliste selbst, mit der Leitung allein im Plan;
 *   · jedes angebundene Ende liegt auf der Klemme, die es meint (E738: der
 *     gespeicherte Name bleibt, auch der alte).
 *
 *   §1 „Drehstrom, FI und Übertrager": F1 drehen
 *   §2 … F1 spiegeln
 *   §3 … F1 mit der Maus ziehen
 *   §4 … F1 mit der Pfeiltaste schieben, einmal fein, einmal mit Umschalt
 *   §5 … ein anderes Teil drehen (T1) und eines ziehen (M1)
 *   §6 Der alte FI aus `test608`: Pfeiltaste, Drehen (der Fall „5 px neben
 *      N2"), Spiegeln, Ziehen — und der gespeicherte alte Name bleibt
 *   §7 Die Regel im Modell ist die der Netzliste (`Schaltplan.kontakte`)
 *   §8 Rückgängig nach dem Drehen gibt den Plan Byte für Byte zurück
 *   §9 Gibt es keinen sauberen Weg, sagt die Fläche es — und nur dann
 *   §10 Beim Ziehen rechnet die Fläche billig, beim Loslassen einmal voll —
 *       und gespeichert ist das Ergebnis der vollen Suche (Durchsicht, Fund 1)
 *   §11 Landet die EIGENE Klemme eines bewegten Teils auf einer fremden
 *       Leitung (oder verlässt sie eine), sagt die Fläche es (Fund 2)
 *   §12 Der alte Plan A aus `test608`: ein unbeteiligtes Teil drehen heilt
 *       die Enden neben ihrer Klemme — und keine geheilte zapft an (Fund 3)
 *   §13 Während eines Zugs wird nichts gespeichert: keine Taste, kein Knopf,
 *       Strg+Z nicht, die Schreibpause nicht, losgelassen ausserhalb und ein
 *       zweiter Finger beenden den Zug richtig, Escape bricht ab; eine
 *       Leitung über der Palette verfällt, eine Fläche, die nicht mehr im
 *       Dokument steht, speichert nichts (zweite Durchsicht, Fund 1)
 *   §14 Echte Maus, echte Tasten: Escape bricht einen Zug mit Teilen, einen
 *       Rahmen und eine Leitung ab; Rückgängig und Wiederholen tun im Zug
 *       nichts, weder an der Fläche noch am Seitenverlauf; ein offenes Menü
 *       schliesst zuerst; Vorlage und Bild verweigern im Zug; der Hinweis
 *       eines Beispiels nur, wenn es eingesetzt wurde; und nach einem echten
 *       Klick nehmen echte Tasten die Fläche (dritte Durchsicht)
 *
 * KANN DIESE SUITE ROT WERDEN? (§55.2) Ja — gegen 97d156b03 ist sie rot in
 * §1, §2, §3, §4, §5, §6, §7 und §9; die Zahl steht in E746. Die zwei Gegenproben
 * (wieder alle Leitungen neu führen; die Prüfung gegen das Anzapfen
 * herausnehmen) stehen ebenfalls dort. §10 und §11 kamen mit der Durchsicht
 * und sind gegen fcb6d35fa (den ersten Stand von E746) rot: dort rechnete
 * jede Mausbewegung voll, und eine eigene Klemme auf einer fremden Leitung
 * blieb still. §12 ist eine Abdeckung, kein Fund — rot wird sie, wenn das
 * Heilen fehlt oder eine geheilte Leitung ihren ersten Weg nimmt, ohne zu
 * prüfen (beide Gegenproben in E746).
 * §13 kam mit der zweiten Durchsicht und ist gegen 478791f5f rot mit 137
 * von 171 — alle 34 Fehlschläge in §13; der abgebrochene Finger, die Leitung
 * über der Palette und die neu gezeichnete Seite sind dort grün: sie decken
 * das neue Horchen am Dokument ab, keine Lücke von damals. Mit ihr kam auch §10s „genau EINE": bis dahin `slice(-(n+1))`, das
 * immer n + 1 Einträge hat; rot wird die Zusage jetzt, wenn das Loslassen
 * zweimal voll sucht. Die Gegenproben 10–20 stehen in E746.
 * §14 kam mit der dritten Durchsicht und ist gegen a8533763b rot mit 189 von
 * 207 — alle 18 Fehlschläge in §14. Grün sind dort die Leitung (ihr Anfassen
 * zeichnet die Fläche nicht neu, der Fokus bleibt auf ihr — eine Abdeckung),
 * das offene Menü (rot wird es, wenn Escape im Zug ein Menü übergeht) und
 * was nach dem Loslassen gilt.
 *
 *   node pruefungen/lauf/test611.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Schaltplan: any; declare const Stromfluss: any; declare const Register: any;
declare const UI: any; declare const KONSTANTEN: any;

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
/* Port 0: der Rechner vergibt einen freien (test400 zählt keinen festen dazu). */
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
 * DIE PLÄNE
 * --------------------------------------------------------------------------
 * W ist der Plan „Drehstrom, FI und Übertrager" aus den Bildern der
 * Übernahme (E738): Drehstrom mit Klemmenbrett, FI mit Lampe, Übertrager mit
 * Klingel — drei Stromkreise, zwölf Leitungen, jede Bindung im heutigen
 * Format. B ist der alte FI aus `test608`, Wort für Wort: die untere Leitung
 * trägt das alte „N" und endet am Ort, der heute N2 heisst.
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
    W: { art: 'stromlauf-aufgeloest', breite: 860, hoehe: 400, texte: [], ebenen,
      teile: [T('G1', 'drehstromquelle', 40, 40), T('M1', 'motor-klemmenbrett', 40, 240),
              T('G2', 'wechselspannung', 300, 240), T('F1', 'fi-schutzschalter', 400, 60),
              T('E1', 'lampe', 370, 240),
              T('G4', 'wechselspannung', 560, 40), T('T1', 'transformator', 660, 40),
              T('H1', 'klingel', 760, 50)],
      leitungen: [
        L('w1', [[50,120],[50,240]], 'G1','L1','M1','U1'),
        L('w2', [[80,120],[80,190],[90,190],[90,240]], 'G1','L2','M1','V1'),
        L('w3', [[110,120],[110,200],[130,200],[130,240]], 'G1','L3','M1','W1'),
        L('w4', [[170,120],[170,160],[220,160],[220,370],[50,370],[50,330]], 'G1','PE','M1','PE'),
        L('f1', [[330,240],[330,30],[410,30],[410,60]], 'G2','L','F1','1'),
        L('f2', [[330,300],[330,330],[480,330],[480,20],[450,20],[450,60]], 'G2','N','F1','N'),
        L('f3', [[410,130],[410,190],[400,190],[400,240]], 'F1','2','E1','X1'),
        L('f4', [[450,130],[450,310],[400,310],[400,300]], 'F1','N2','E1','X2'),
        L('t1', [[590,40],[590,20],[680,20],[680,40]], 'G4','L','T1','1U'),
        L('t2', [[590,100],[590,130],[680,130],[680,110]], 'G4','N','T1','1V'),
        L('t3', [[710,40],[710,30],[790,30],[790,50]], 'T1','2U','H1','X1'),
        L('t4', [[710,110],[710,140],[790,140],[790,110]], 'T1','2V','H1','X2')
      ] },
    B: { art: 'stromlauf-aufgeloest', breite: 600, hoehe: 500, texte: [], ebenen,
      teile: [T('G1', 'wechselspannung', 100, 100), T('F1', 'fi-schutzschalter', 300, 100),
              T('E1', 'lampe', 300, 300)],
      leitungen: [
        L('b1', [[130, 100], [130, 60], [310, 60], [310, 100]], 'G1', 'L', 'F1', '1'),
        L('b2', [[130, 160], [70, 160], [70, 30], [350, 30], [350, 100]], 'G1', 'N', 'F1', 'N'),
        L('b3', [[310, 170], [310, 240], [330, 240], [330, 300]], 'F1', '2', 'E1', 'X1'),
        L('b4', [[350, 170], [350, 400], [330, 400], [330, 360]], 'F1', 'N', 'E1', 'X2')
      ] },
    /* Zwei Lampen übereinander: E1:X2 bei (130,160), E2:X1 bei (130,200).
       Vier Raster nach unten, und E1:X2 liegt AUF E2:X1 — dann gibt es
       keinen Weg für p1, der E2:X1 nicht berührt (§9). */
    P: { art: 'stromlauf-aufgeloest', breite: 400, hoehe: 400, texte: [], ebenen,
      teile: [T('E1', 'lampe', 100, 100), T('E2', 'lampe', 100, 200)],
      leitungen: [L('p1', [[130, 160], [300, 160]], 'E1', 'X2')] },
    /* Die Probe der Durchsicht (Fund 2): q läuft senkrecht bei x = 250 von
       E1:X2 nach E2:X1, R1 steht daneben bei (200,200). Gedreht liegt R1:1 bei
       (250,230) — AUF q; noch einmal gedreht ist es wieder weg. */
    Q: { art: 'stromlauf-aufgeloest', breite: 400, hoehe: 400, texte: [], ebenen,
      teile: [T('E1', 'lampe', 220, 50), T('E2', 'lampe', 220, 300), T('R1', 'widerstand', 200, 200)],
      leitungen: [L('q', [[250, 110], [250, 300]], 'E1', 'X2', 'E2', 'X1')] },
    /* Plan A aus test608, Wort für Wort (a1–a6: alte Stecker, Steckdosen und
       Schukos, jedes Leitungsende NEBEN der Klemme, die es meint — L253
       Punkt 7), und dazu vier Teile, jedes mit einem Zweck:
         R9  ein Widerstand ohne Leitung — das unbeteiligte Teil, das gedreht wird;
         R8  ein Widerstand, liegend, dessen freie Klemme 1 bei (710,300) genau
             auf dem nächstliegenden geheilten Weg von a5 liegt (senkrecht bei
             x = 710 auf X5:L) — ohne Prüfung zapfte die Heilung sie an;
         E8, E9 mit z1  eine Leitung, die richtig auf ihren Klemmen liegt — sie
             darf sich nicht rühren, nur die geheilten dürfen es. */
    A: { art: 'stromlauf-aufgeloest', breite: 1100, hoehe: 700, texte: [], ebenen,
      teile: [T('G1', 'wechselspannung', 100, 200),
              T('X1', 'stecker', 300, 100), T('X2', 'stecker', 500, 100),
              T('X3', 'steckdose', 300, 400), T('X4', 'steckdose', 500, 400),
              T('X5', 'steckdose-schuko', 700, 400), T('X6', 'steckdose-schuko', 900, 400),
              T('R9', 'widerstand', 1000, 100), { ...T('R8', 'widerstand', 660, 270), drehung: 90 },
              T('E8', 'lampe', 820, 180), T('E9', 'lampe', 920, 180)],
      leitungen: [
        L('a1', [[130, 200], [130, 60], [320, 60], [320, 100]], 'G1', 'L', 'X1', '1'),
        L('a2', [[130, 260], [60, 260], [60, 40], [600, 40], [600, 100], [520, 100]], 'G1', 'N', 'X2', '1'),
        L('a3', [[130, 200], [330, 200], [330, 400]], 'G1', 'L', 'X3', 'L'),
        L('a4', [[130, 260], [130, 500], [620, 500], [620, 400], [530, 400]], 'G1', 'N', 'X4', 'L'),
        L('a5', [[130, 150], [730, 150], [730, 400]], null, null, 'X5', 'L'),
        L('a6', [[130, 260], [130, 560], [1000, 560], [1000, 400], [930, 400]], 'G1', 'N', 'X6', 'L'),
        L('z1', [[850, 240], [850, 280], [950, 280], [950, 240]], 'E8', 'X2', 'E9', 'X2')
      ] }
  };`;

/* Welche HEUTIGE Klemme jedes Ende meint. In W ist das der gespeicherte
   Name; in B steht es so in test608 (b4 trägt „N" und meint N2). */
const SOLL_B: Record<string, { von?: [string, string]; nach?: [string, string] }> = {
  b1: { von: ['G1', 'L'], nach: ['F1', '1'] }, b2: { von: ['G1', 'N'], nach: ['F1', 'N'] },
  b3: { von: ['F1', '2'], nach: ['E1', 'X1'] }, b4: { von: ['F1', 'N2'], nach: ['E1', 'X2'] }
};
/* In A meint jedes alte Ende das heutige L (test608 §5, E738). */
const SOLL_A: Record<string, { von?: [string, string]; nach?: [string, string] }> = {
  a1: { von: ['G1', 'L'], nach: ['X1', 'L'] }, a2: { von: ['G1', 'N'], nach: ['X2', 'L'] },
  a3: { von: ['G1', 'L'], nach: ['X3', 'L'] }, a4: { von: ['G1', 'N'], nach: ['X4', 'L'] },
  a5: { nach: ['X5', 'L'] }, a6: { von: ['G1', 'N'], nach: ['X6', 'L'] }
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
  const w = window as any;
  // eslint-disable-next-line no-new-func
  w.plaene = new Function(quelle);
  /* Jede Meldung mitschreiben — §9 fragt, ob das Nachziehen etwas gemeldet hat. */
  w.meldungen = [] as string[];
  const toast = UI.toast.bind(UI);
  UI.toast = (...a: any[]) => { w.meldungen.push(String(a[0])); return toast(...a); };

  /** Welche Klemmen fasst eine Leitung? Die Netzliste selbst sagt es — mit
      der Leitung ALLEIN im Plan, damit kein Nachbar mitzählt. */
  const klemmenDer = (plan: any, l: any): string[] => {
    const ni = Stromfluss.netze({ ...plan, leitungen: [l] });
    const netz = ni.leitungNetz[l.id];
    const raus = new Set<string>();
    (ni.klemmen as any[]).forEach(k => {
      if (!k.intern && ni.netzVon.get(k.schluessel) === netz) raus.add(k.teil + ':' + k.nr);
    });
    return [...raus].sort();
  };
  w.klemmenDer = klemmenDer;

  /** Der Zustand eines Planblocks, wie die Ablage ihn JETZT hält. */
  w.zustand = (bid: string) => {
    const plan = Store.getBlock(bid).plan;
    const ni = Stromfluss.netze(plan);
    const g = new Map<number, Set<string>>();
    const dazu = (n: number, name: string) => { if (!g.has(n)) g.set(n, new Set()); g.get(n)!.add(name); };
    (ni.klemmen as any[]).forEach(k => { if (!k.intern) dazu(ni.netzVon.get(k.schluessel), k.teil + ':' + k.nr); });
    Object.keys(ni.leitungNetz).forEach(id => dazu(ni.leitungNetz[id], 'l:' + id));
    const teilung = [...g.values()].map(s => [...s].sort().join(' ')).sort();
    const punkte: Record<string, string> = {};
    const klemmen: Record<string, string[]> = {};
    const bindung: Record<string, any> = {};
    (plan.leitungen as any[]).forEach(l => {
      punkte[l.id] = JSON.stringify(l.punkte);
      klemmen[l.id] = klemmenDer(plan, l);
      bindung[l.id] = { vonTeil: l.vonTeil, vonNr: l.vonNr, nachTeil: l.nachTeil, nachNr: l.nachNr };
    });
    const teile: Record<string, any> = {};
    (plan.teile as any[]).forEach(t => { teile[t.id] = { x: t.x, y: t.y, drehung: t.drehung, gespiegelt: t.gespiegelt }; });
    return { teilung, punkte, klemmen, bindung, teile, json: JSON.stringify(plan) };
  };

  /** Liegt jedes Ende auf der Klemme, die es meint? Gibt die Abweichler. */
  w.endenAbweichend = (bid: string, soll: any) => {
    const plan = Store.getBlock(bid).plan;
    const teil = (tid: string) => (plan.teile as any[]).find(t => t.id === tid);
    const raus: string[] = [];
    (plan.leitungen as any[]).forEach(l => {
      const s = soll[l.id] || {
        von: l.vonTeil ? [l.vonTeil, l.vonNr] : undefined,
        nach: l.nachTeil ? [l.nachTeil, l.nachNr] : undefined
      };
      const pruef = (ende: [string, string] | undefined, punkt: any, wo: string) => {
        if (!ende) return;
        const o = Schaltplan.anschlussOrt(teil(ende[0]), ende[1]);
        if (!o || o.x !== punkt.x || o.y !== punkt.y)
          raus.push(`${l.id}.${wo} bei ${punkt.x},${punkt.y}, ${ende[0]}:${ende[1]} bei ${o ? o.x + ',' + o.y : '—'}`);
      };
      pruef(s.von, l.punkte[0], 'von');
      pruef(s.nach, l.punkte[l.punkte.length - 1], 'nach');
    });
    return raus;
  };

  /** Welche dieser Leitungen laufen mitten durch ein Zeichen? Der Kasten
      gedreht um die Mitte des ungedrehten Zeichens, einen Punkt nach innen —
      hier unabhängig vom Code nachgerechnet. */
  w.durchZeichen = (bid: string, ids: string[]) => {
    const plan = Store.getBlock(bid).plan;
    const ks = (plan.teile as any[]).map(t => {
      const z = Register.fachzeichen.holen(t.zeichen);
      const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
      const cx = t.x + z.w / 2, cy = t.y + z.h / 2;
      return { id: t.id, x1: cx - m.w / 2 + 1, y1: cy - m.h / 2 + 1, x2: cx + m.w / 2 - 1, y2: cy + m.h / 2 - 1 };
    });
    const raus: string[] = [];
    (plan.leitungen as any[]).filter(l => ids.includes(l.id)).forEach(l => {
      for (let i = 0; i + 1 < l.punkte.length; i++) {
        const a = l.punkte[i], b = l.punkte[i + 1];
        for (const k of ks) {
          const quer = a.y === b.y
            ? a.y > k.y1 && a.y < k.y2 && Math.max(Math.min(a.x, b.x), k.x1) < Math.min(Math.max(a.x, b.x), k.x2)
            : a.x > k.x1 && a.x < k.x2 && Math.max(Math.min(a.y, b.y), k.y1) < Math.min(Math.max(a.y, b.y), k.y2);
          if (quer) { raus.push(l.id + ' durch ' + k.id); return; }
        }
      }
    });
    return raus;
  };

  /** Kleinster Abstand einer Klemme zu einer (rechtwinkligen) Leitung. */
  w.abstand = (bid: string, lid: string, tid: string, nr: string) => {
    const plan = Store.getBlock(bid).plan;
    const l = (plan.leitungen as any[]).find(x => x.id === lid);
    const k = Schaltplan.anschlussOrt((plan.teile as any[]).find(t => t.id === tid), nr);
    let best = Infinity;
    for (let i = 0; i + 1 < l.punkte.length; i++) {
      const a = l.punkte[i], b = l.punkte[i + 1];
      const qx = Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), k.x));
      const qy = Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), k.y));
      best = Math.min(best, Math.max(Math.abs(qx - k.x), Math.abs(qy - k.y)));
    }
    return best;
  };
}, PLAENE);

const NAH = await seite.evaluate(() => Register.fachzeichen.NAH as number);

const oeffne = async (welcher: 'W' | 'B' | 'P' | 'Q' | 'A'): Promise<string> => {
  const id = await seite.evaluate(async (wer: string) => {
    const plan = (window as any).plaene()[wer];
    const s = Store.addPage(null, { text: 'Plan ' + wer });
    const b = Store.addBlock(s.id, 'schaltplan', { text: 'Plan ' + wer, plan });
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
const zustand = (bid: string): Promise<any> => seite.evaluate((b: string) => (window as any).zustand(b), bid);

/** Ein Teil anklicken (wählt es aus) — Mitte seines Kastens. */
const waehle = async (tid: string): Promise<void> => {
  const box = await seite.locator(`.sp-wrap svg .sp-teil[data-id="${tid}"]`).boundingBox();
  if (!box) throw new Error('Teil nicht gefunden: ' + tid);
  await seite.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await seite.waitForTimeout(450);    // kein Doppeltipp (400 ms)
};
const taste = async (key: string, shiftKey = false): Promise<void> => {
  await seite.evaluate(([k, s]: [string, boolean]) => {
    const el = document.querySelector<HTMLElement>('.sp-wrap');
    if (!el) throw new Error('keine Planfläche');
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey: s, bubbles: true, cancelable: true }));
  }, [key, shiftKey] as [string, boolean]);
  await seite.waitForTimeout(250);
};
const ziehe = async (tid: string, dx: number, dy: number): Promise<void> => {
  const box = await seite.locator(`.sp-wrap svg .sp-teil[data-id="${tid}"]`).boundingBox();
  if (!box) throw new Error('Teil nicht gefunden: ' + tid);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await seite.mouse.move(x, y);
  await seite.mouse.down();
  for (let i = 1; i <= 8; i++) await seite.mouse.move(x + dx * i / 8, y + dy * i / 8);
  await seite.mouse.up();
  await seite.waitForTimeout(450);
};

/**
 * Eine Handlung und ihre vier Zusagen. `bewegt` sind die Teile, die sich
 * bewegen; eine Leitung, die an keinem davon hängt, ist eine FREMDE.
 */
const handlung = async (name: string, bid: string, bewegt: string[], tu: () => Promise<void>,
                        soll: Record<string, any> = {}): Promise<{ vor: any; nach: any }> => {
  const vor = await zustand(bid);
  await tu();
  const nach = await zustand(bid);
  const gewandert = bewegt.filter(t => JSON.stringify(vor.teile[t]) !== JSON.stringify(nach.teile[t]));
  p(`${name}: das Teil hat sich wirklich bewegt`, gewandert.length === bewegt.length,
    bewegt.map(t => t + ' ' + JSON.stringify(vor.teile[t]) + ' → ' + JSON.stringify(nach.teile[t])).join(' | '));
  const anders = (a: string[], b: string[]) => a.filter(x => !b.includes(x));
  p(`${name}: die Netzliste ist dieselbe`, JSON.stringify(nach.teilung) === JSON.stringify(vor.teilung),
    'neu: ' + anders(nach.teilung, vor.teilung).join(' | ') + ' · weg: ' + anders(vor.teilung, nach.teilung).join(' | '));
  const fremde = Object.keys(vor.bindung).filter(id => {
    const b = vor.bindung[id];
    return !bewegt.includes(b.vonTeil) && !bewegt.includes(b.nachTeil);
  });
  if (fremde.length) {
    const geaendert = fremde.filter(id => vor.punkte[id] !== nach.punkte[id]);
    p(`${name}: die ${fremde.length} fremden Leitungen behalten ihre Punkte Byte für Byte`, geaendert.length === 0,
      geaendert.map(id => `${id} ${vor.punkte[id]} → ${nach.punkte[id]}`).join(' | '));
  }
  const zapft = Object.keys(vor.klemmen).filter(id =>
    JSON.stringify(vor.klemmen[id]) !== JSON.stringify(nach.klemmen[id]));
  p(`${name}: jede Leitung fasst genau die Klemmen von vorher`, zapft.length === 0,
    zapft.map(id => `${id}: ${vor.klemmen[id].join(',')} → ${nach.klemmen[id].join(',')}`).join(' | '));
  const abw: string[] = await seite.evaluate(([b, s]: [string, any]) => (window as any).endenAbweichend(b, s),
    [bid, soll] as [string, any]);
  p(`${name}: jedes angebundene Ende liegt auf der Klemme, die es meint`, abw.length === 0, abw.join(' | '));
  return { vor, nach };
};

/* ==========================================================================
 * DER PLAN „DREHSTROM, FI UND ÜBERTRAGER"
 * ========================================================================*/
const blockW = await oeffne('W');
await seite.waitForTimeout(300);
const startW = await zustand(blockW);
const abwStart = await seite.evaluate((b: string) => (window as any).endenAbweichend(b, {}), blockW);
p('Vorbedingung: in W liegt jedes Ende auf seiner Klemme (sonst gälte §1 für einen anderen Plan)',
  abwStart.length === 0, abwStart.join(' | '));
const einzeln = Object.keys(startW.klemmen).filter(id => startW.klemmen[id].length !== 2);
p('Vorbedingung: jede Leitung in W fasst genau ihre zwei Klemmen', einzeln.length === 0,
  einzeln.map(id => id + ': ' + startW.klemmen[id].join(',')).join(' | '));

/* ==========================================================================
 * §1 · F1 drehen
 * ========================================================================*/
console.log('\n1 · Den FI drehen');
await waehle('F1');
const dreh = await handlung('F1 gedreht', blockW, ['F1'], () => taste('r'));
const quer1: string[] = await seite.evaluate((b: string) =>
  (window as any).durchZeichen(b, ['f1', 'f2', 'f3', 'f4']), blockW);
p('Kein neu geführter Weg läuft mitten durch ein Zeichen (das Bild zeigte f2 quer durch die Lampe)',
  quer1.length === 0, quer1.join(' | '));
p('Die Motorleitung w4 behält ihren Weg unter dem Klemmenbrett',
  dreh.nach.punkte.w4 === startW.punkte.w4, dreh.nach.punkte.w4);
const fiNetz = await seite.evaluate((b: string) => {
  const e = Stromfluss.rechne(Store.getBlock(b).plan, {});
  return { ok: e.ok, lampe: e.werte && e.werte.E1 ? e.werte.E1.fliesst : null,
           kurz: (e.anschlussfehler || []).filter((f: any) => f.art === 'l-n').length };
}, blockW);
p('Nach dem Drehen rechnet der Kreis, die Lampe leuchtet, kein L–N-Kurzschluss',
  fiNetz.ok && fiNetz.lampe === true && fiNetz.kurz === 0, JSON.stringify(fiNetz));

/* ==========================================================================
 * §8 (hier, weil der Zustand gerade passt) · Rückgängig nach dem Drehen
 * ========================================================================*/
console.log('\n8 · Rückgängig');
await seite.evaluate(() => {
  const el = document.querySelector<HTMLElement>('.sp-wrap')!;
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }));
});
await seite.waitForTimeout(300);
const zurueck = await zustand(blockW);
/* Verglichen werden Punkte, Lagen und Bindungen, nicht der ganze Block: die
   Fläche liest den Plan beim Öffnen mit `Schaltplan.lesen` (heilen, rasten),
   und der Verlauf hält DIESE Form — der rohe Block vor der ersten Handlung
   ist eine andere Schreibweise desselben Plans. */
const kern = (z: any) => JSON.stringify([z.punkte, z.teile, z.bindung]);
p('Strg+Z nach dem Drehen gibt Punkte, Lagen und Bindungen Byte für Byte zurück',
  kern(zurueck) === kern(startW), kern(zurueck).slice(0, 300));
await seite.evaluate(() => {
  const el = document.querySelector<HTMLElement>('.sp-wrap')!;
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true }));
});
await seite.waitForTimeout(300);
p('… und Umschalt+Strg+Z holt das Drehen wieder', kern(await zustand(blockW)) === kern(dreh.nach));

/* ==========================================================================
 * §2 · F1 spiegeln
 * ========================================================================*/
console.log('\n2 · Den FI spiegeln');
await waehle('F1');
await handlung('F1 gespiegelt', blockW, ['F1'], () => taste('h'));
await waehle('F1');
await handlung('F1 zurückgedreht (dreimal r)', blockW, ['F1'], async () => {
  await taste('r'); await taste('r'); await taste('r');
});

/* ==========================================================================
 * §3 · F1 mit der Maus ziehen
 * ========================================================================*/
console.log('\n3 · Den FI mit der Maus ziehen');
await handlung('F1 gezogen', blockW, ['F1'], () => ziehe('F1', 30, 30));

/* ==========================================================================
 * §4 · F1 mit der Pfeiltaste schieben
 * ========================================================================*/
console.log('\n4 · Den FI mit der Pfeiltaste schieben');
await waehle('F1');
await handlung('F1 Pfeil rechts', blockW, ['F1'], () => taste('ArrowRight'));
await handlung('F1 Umschalt+Pfeil hoch', blockW, ['F1'], () => taste('ArrowUp', true));

/* ==========================================================================
 * §5 · Ein anderes Teil
 * ========================================================================*/
console.log('\n5 · Ein anderes Teil drehen und ziehen');
await waehle('T1');
await handlung('T1 gedreht', blockW, ['T1'], () => taste('r'));
await handlung('M1 gezogen', blockW, ['M1'], () => ziehe('M1', 0, 25));

/* ==========================================================================
 * §6 · Der alte FI aus test608
 * --------------------------------------------------------------------------
 * Genau die Folge aus test608 §5 — Pfeiltaste, dann Drehen —, nur dass hier
 * die Netze GLEICH NACH DEM DREHEN gelten müssen. test608 prüft sie erst,
 * wenn der FI wieder an seinem Platz steht, weil sie auf main hier rot waren.
 * ========================================================================*/
console.log('\n6 · Der alte FI aus test608');
const blockB = await oeffne('B');
await seite.waitForTimeout(300);
const startB = await zustand(blockB);
const eingabeB = await seite.evaluate(() => JSON.stringify((window as any).plaene().B));
p('Das Öffnen schreibt nichts: die Ablage hält den alten Plan Byte für Byte',
  JSON.stringify(JSON.parse(startB.json)) === JSON.stringify(JSON.parse(eingabeB)));
gleich('Vorher: N und N2 sind zwei Netze, jedes an seiner Leitung',
  startB.teilung.filter((g: string) => g.includes('F1:N')),
  ['E1:X2 F1:N2 l:b4', 'F1:N G1:N l:b2']);
await waehle('F1');
await handlung('alter FI, Pfeil rechts', blockB, ['F1'], () => taste('ArrowRight'), SOLL_B);
const fiDreh = await handlung('alter FI gedreht', blockB, ['F1'], () => taste('r'), SOLL_B);
const ab: number = await seite.evaluate((b: string) => (window as any).abstand(b, 'b2', 'F1', 'N2'), blockB);
p(`b2 läuft nicht mehr neben N2 vorbei: Abstand über NAH (${NAH} px)`, ab > NAH, `Abstand ${ab} px`);
const quer6: string[] = await seite.evaluate((b: string) =>
  (window as any).durchZeichen(b, ['b1', 'b2', 'b3', 'b4']), blockB);
p('Kein neu geführter Weg läuft mitten durch ein Zeichen', quer6.length === 0, quer6.join(' | '));
p('N und N2 sind gleich nach dem Drehen zwei Netze',
  !fiDreh.nach.teilung.some((g: string) => g.split(' ').includes('F1:N') && g.split(' ').includes('F1:N2')),
  fiDreh.nach.teilung.join(' | '));
const fiB = await seite.evaluate((b: string) => {
  const e = Stromfluss.rechne(Store.getBlock(b).plan, {});
  return { ok: e.ok, lampe: e.werte && e.werte.E1 ? e.werte.E1.fliesst : null,
           funde: (e.anschlussfehler || []).map((f: any) => f.art) };
}, blockB);
p('Der gedrehte FI: die Lampe leuchtet, kein Fehlerstrom gemeldet',
  fiB.ok && fiB.lampe === true && !fiB.funde.some((a: string) => /^fi-/.test(a)), JSON.stringify(fiB));
await waehle('F1');
await handlung('alter FI gespiegelt', blockB, ['F1'], () => taste('h'), SOLL_B);
await handlung('alter FI gezogen', blockB, ['F1'], () => ziehe('F1', 40, 20), SOLL_B);
const nachB = await zustand(blockB);
gleich('Der gespeicherte Name der unteren Leitung bleibt das alte „N" (E738)', nachB.bindung.b4.vonNr, 'N');

/* ==========================================================================
 * §7 · Die Regel im Modell ist die der Netzliste
 * --------------------------------------------------------------------------
 * Das Nachziehen prüft seine Wege mit `Schaltplan.kontakte` — einer Regel,
 * die im Bereich der Blöcke stehen muss, weil die Planfläche die Netzliste
 * (bereiche/elektro) nicht rufen darf (§5, test537). Zwei Regeln für
 * dasselbe laufen auseinander, wenn niemand sie vergleicht: hier wird für
 * JEDE Leitung beider Pläne im Endzustand die Antwort des Modells gegen die
 * der Netzliste gehalten — Klemmen mit der Leitung allein, Leitungen paarweise.
 * ========================================================================*/
console.log('\n7 · Die Regel im Modell ist die der Netzliste');
const regel = await seite.evaluate((bids: string[]) => {
  if (typeof Schaltplan.kontakte !== 'function') return null;
  const abw: string[] = [];
  let klemmenZahl = 0, paare = 0, beruehrt = 0;
  bids.forEach(bid => {
    const plan = Store.getBlock(bid).plan;
    (plan.leitungen as any[]).forEach(l => {
      const k = Schaltplan.kontakte(plan, l);
      const soll = (window as any).klemmenDer(plan, l);
      klemmenZahl += soll.length;
      if (JSON.stringify(k.klemmen) !== JSON.stringify(soll))
        abw.push(`${l.id}: Modell ${k.klemmen.join(',')} · Netzliste ${soll.join(',')}`);
      (plan.leitungen as any[]).forEach(m => {
        if (m.id <= l.id) return;
        paare++;
        /* Ohne Teile UND ohne Bindungen: sonst verbände die Netzliste zwei
           Leitungen, die am selben (nicht mehr vorhandenen) Klemmennamen
           hängen — b2 und b4 tragen beide „N" —, und das ist keine Berührung. */
        const nur = (x: any) => ({ id: x.id, ebene: x.ebene, punkte: x.punkte });
        const ni = Stromfluss.netze({ ...plan, teile: [], leitungen: [nur(l), nur(m)] });
        const zusammen = ni.leitungNetz[l.id] === ni.leitungNetz[m.id];
        if (zusammen) beruehrt++;
        if (zusammen !== k.leitungen.includes(m.id))
          abw.push(`${l.id}–${m.id}: Modell ${k.leitungen.includes(m.id)} · Netzliste ${zusammen}`);
      });
    });
  });
  /* Und ein erfundener Fall, in dem beide etwas finden MÜSSEN — sonst wäre
     „beide sagen nichts" auch eine Übereinstimmung (§55.2). */
  const t = (id: string, zeichen: string, x: number, y: number) =>
    ({ id, zeichen, x, y, drehung: 0, gespiegelt: false, bmk: id, nummern: {}, gruppe: '', ebene: 'plan' });
  const probe = { art: 'stromlauf-aufgeloest', breite: 400, hoehe: 300, texte: [], ebenen: [],
    teile: [t('R1', 'widerstand', 100, 100)],
    leitungen: [{ id: 'q1', ebene: 'plan', punkte: [{ x: 50, y: 0 }, { x: 50, y: 250 }] },
                { id: 'q2', ebene: 'plan', punkte: [{ x: 0, y: 80 }, { x: 50, y: 80 }] }] };
  const lage = Schaltplan.anschluesseVon(probe.teile[0]);
  probe.leitungen[0]!.punkte = [{ x: lage[0].x + 4, y: 0 }, { x: lage[0].x + 4, y: 250 }];
  probe.leitungen[1]!.punkte = [{ x: 0, y: 80 }, { x: lage[0].x + 4, y: 80 }];
  const kp = Schaltplan.kontakte(probe, probe.leitungen[0]);
  return { abw, klemmenZahl, paare, beruehrt,
           probe: { klemmen: kp.klemmen, leitungen: kp.leitungen, netzliste: (window as any).klemmenDer(probe, probe.leitungen[0]) } };
}, [blockW, blockB]);
p('Schaltplan.kontakte gibt es', !!regel);
if (regel) {
  p(`Für jede Leitung: dieselben Klemmen wie die Netzliste (${regel.klemmenZahl} Klemmen), ` +
    `und für jedes Paar dieselbe Berührung (${regel.paare} Paare, ${regel.beruehrt} berührt)`,
    regel.abw.length === 0, regel.abw.slice(0, 6).join(' | '));
  p('Die Probe: eine Leitung 4 px neben einer Klemme fasst sie — im Modell wie in der Netzliste',
    regel.probe.klemmen.length >= 1 && JSON.stringify(regel.probe.klemmen) === JSON.stringify(regel.probe.netzliste),
    JSON.stringify(regel.probe));
  p('… und die Leitung, die auf ihr endet, berührt sie', regel.probe.leitungen.includes('q2'),
    JSON.stringify(regel.probe.leitungen));
} else { weg += 3; console.log('  ✗ (3 Zusagen übersprungen — es gibt kein Schaltplan.kontakte)'); }

/* ==========================================================================
 * §9 · Gibt es keinen sauberen Weg, sagt die Fläche es
 * --------------------------------------------------------------------------
 * Wer ein Teil so hinstellt, dass die Klemme, an der eine Leitung hängt, auf
 * einer fremden Klemme liegt, verbindet beide — kein Weg kann das ändern,
 * denn das Ende selbst liegt dort. Das ist die Lage, nicht das Nachziehen;
 * aber die Netzliste ändert sich, und das darf nicht still geschehen (§35).
 * Und umgekehrt: bei allen Handlungen oben (§1–§6) gab es einen Weg, also
 * auch keine Meldung — sonst wäre die Meldung ein Rauschen, das niemand
 * mehr liest.
 * ========================================================================*/
console.log('\n9 · Gibt es keinen sauberen Weg, sagt die Fläche es');
const vorP: string[] = await seite.evaluate(() => (window as any).meldungen.slice());
p('§1–§6: kein einziges Mal „liess sich nicht nachziehen"',
  !vorP.some(m => /nachziehen/.test(m)), vorP.join(' | '));
p('§1–§6: auch keine Meldung, dass eine Klemme jetzt etwas anderes berührt',
  !vorP.some(m => /berührt jetzt|nicht mehr|liegt jetzt auf/.test(m)), vorP.join(' | '));
const blockP = await oeffne('P');
await seite.waitForTimeout(300);
await waehle('E1');
for (let i = 0; i < 3; i++) await taste('ArrowDown');
const nachDrei: string[] = await seite.evaluate(() => (window as any).meldungen.slice());
p('Drei Raster nach unten: p1 findet einen Weg, keine Meldung',
  nachDrei.length === vorP.length, nachDrei.slice(vorP.length).join(' | '));
await taste('ArrowDown');
const nachVier: string[] = await seite.evaluate(() => (window as any).meldungen.slice());
p('Das vierte Raster legt E1:X2 auf E2:X1 — und die Fläche meldet es',
  nachVier.slice(nachDrei.length).some(m => /nachziehen/.test(m)), nachVier.slice(nachDrei.length).join(' | ') || '(keine Meldung)');
const abwP: string[] = await seite.evaluate((b: string) => (window as any).endenAbweichend(b, {}), blockP);
p('… und p1 hängt weiter an E1:X2', abwP.length === 0, abwP.join(' | '));

const nachVierText = nachVier.slice(nachDrei.length).join(' | ');
p('… und sie sagt, WAS: E2:X1 berührt jetzt die Leitung an E1:X2',
  /E2:X1 berührt jetzt die Leitung an E1:X2/.test(nachVierText), nachVierText || '(keine Meldung)');

/* ==========================================================================
 * Gemeinsam für §10–§12: ziehen in PLANEINHEITEN statt in Bildpunkten, und
 * ein Spion auf `Schaltplan.nachziehen`, der jede Rechnung mitschreibt.
 * ========================================================================*/
/** Bildschirmpunkt zu einem Planpunkt — die Umkehrung von `ortAus`. */
const bildpunkt = async (bid: string): Promise<(x: number, y: number) => [number, number]> => {
  await seite.locator('.sp-wrap svg.sp-flaeche').last().scrollIntoViewIfNeeded();
  const r = await seite.evaluate((b: string) => {
    const s = [...document.querySelectorAll('.sp-wrap svg.sp-flaeche')].pop()!.getBoundingClientRect();
    const plan = Store.getBlock(b).plan;
    return { l: s.left, t: s.top, sx: s.width / plan.breite, sy: s.height / plan.hoehe };
  }, bid);
  return (x: number, y: number) => [r.l + x * r.sx, r.t + y * r.sy];
};
/**
 * Zieht von Planpunkt `von` um `d` Planeinheiten, in `schritte` Bewegungen.
 * `vorLoslassen` läuft, während die Maus noch unten ist.
 */
const zieheGenau = async (bid: string, von: [number, number], d: [number, number], schritte: number,
                          vorLoslassen?: () => Promise<void>): Promise<void> => {
  const bild = await bildpunkt(bid);
  const [x0, y0] = bild(von[0], von[1]);
  await seite.mouse.move(x0, y0);
  await seite.mouse.down();
  for (let i = 1; i <= schritte; i++) {
    const [x, y] = bild(von[0] + d[0] * i / schritte, von[1] + d[1] * i / schritte);
    await seite.mouse.move(x, y);
  }
  if (vorLoslassen) await vorLoslassen();
  await seite.mouse.up();
  await seite.waitForTimeout(450);
};
await seite.evaluate(() => {
  const w = window as any;
  w.aufrufe = [] as boolean[];
  w.nachziehenEcht = Schaltplan.nachziehen;
  Schaltplan.nachziehen = (...a: any[]) => {
    w.aufrufe.push(!!(a[3] && a[3].schnell));
    return w.nachziehenEcht(...a);
  };
});
const meldungenJetzt = (): Promise<string[]> => seite.evaluate(() => (window as any).meldungen.slice());
const aufrufeJetzt = (): Promise<boolean[]> => seite.evaluate(() => (window as any).aufrufe.slice());

/* ==========================================================================
 * §10 · Beim Ziehen billig, beim Loslassen einmal voll (Durchsicht, Fund 1)
 * --------------------------------------------------------------------------
 * Bis zur Durchsicht rechnete jede Mausbewegung die volle Wegsuche — Z- und
 * Hakenwege eingeschlossen. Gemessen (messungen §103): F1 im Plan W um
 * 120 × 60 px in 60 Bewegungen gezogen, bei vierfach gedrosselter CPU je
 * Bewegung im Median 23,9 bis 29,4 ms, höchstens 126,8 bis 217,3 ms (drei
 * Läufe). Seither rechnet eine
 * Bewegung nur die billigen Wege (`schnell`), eine Bewegung innerhalb
 * desselben Rasters gar nichts, und erst das Loslassen sucht einmal voll.
 *
 * Gezogen wird F1 in einem frischen Plan W um 30 × 40 Planeinheiten — an
 * eine Stelle, an der die billigen Wege NICHT reichen (f2 und f4 fänden
 * dort nur Stufe 3 und zapften an — gemessen im Modell, messungen §103;
 * die Zusage „taugt nicht" hält es fest). Sonst bewiese die Zusage
 * „gespeichert ist die volle Suche" nichts: sie wäre auch mit einem
 * gespeicherten Zwischenbild wahr.
 * ========================================================================*/
console.log('\n10 · Ziehen billig, Loslassen voll');
const blockW2 = await oeffne('W');
await seite.waitForTimeout(300);
const vorW2 = await zustand(blockW2);
const meldVor10 = await meldungenJetzt();
const SCHRITTE = 24;
let aufrufeImZug: boolean[] = [];
let aufrufeAbAnfassen: boolean[] = [];
const zug10 = await handlung('F1 gezogen, 30 × 40 in 24 Bewegungen', blockW2, ['F1'], async () => {
  const a0 = (await aufrufeJetzt()).length;
  /* Angefasst bei (430,92): mitten im Kasten des FI (400…460 × 60…130), und
     weit genug von einer Rasterkante, dass 30 × 40 genau 3 × 4 Raster sind. */
  await zieheGenau(blockW2, [430, 92], [30, 40], SCHRITTE, async () => {
    aufrufeImZug = (await aufrufeJetzt()).slice(a0);
  });
  aufrufeAbAnfassen = (await aufrufeJetzt()).slice(a0);
});
/* Was NACH dem Loslassen gerechnet wurde: alle Rechnungen seit dem Anfassen,
   weniger die, die schon vor dem Loslassen standen. Hier stand bis zur
   zweiten Durchsicht `slice(-(n + 1))` — das hat immer n + 1 Einträge, und
   „genau eine" prüfte damit nichts: zwei volle Suchen beim Loslassen wären
   durchgegangen. */
const aufrufeLos = aufrufeAbAnfassen.slice(aufrufeImZug.length);
const lage10 = zug10.nach.teile.F1;
p('Der FI steht danach 30 × 40 weiter (genau drei und vier Raster)',
  lage10.x === 430 && lage10.y === 100, JSON.stringify(lage10));
p(`Während des Ziehens rechnet jede Bewegung billig (${aufrufeImZug.length} Rechnungen, keine volle)`,
  aufrufeImZug.length > 0 && aufrufeImZug.every(b => b), JSON.stringify(aufrufeImZug));
p(`… und nur, wenn ein Teil über ein Raster wandert: ${aufrufeImZug.length} Rechnungen auf ${SCHRITTE} Bewegungen`,
  aufrufeImZug.length > 0 && aufrufeImZug.length <= 8, `${aufrufeImZug.length} Rechnungen`);
p('Beim Loslassen genau EINE Rechnung, und sie ist die volle Suche',
  aufrufeLos.length === 1 && aufrufeLos[0] === false,
  `nach dem Loslassen ${JSON.stringify(aufrufeLos)} (true = billig, false = voll)`);
const pruef10 = await seite.evaluate(([bid, vorJson]: [string, string]) => {
  const w = window as any;
  const nach = Store.getBlock(bid).plan;
  const f = (nach.teile as any[]).find(t => t.id === 'F1');
  /* Unabhängig nachgerechnet: der Plan von vor dem Zug, so gelesen, wie die
     Fläche ihn liest, F1 an die Endlage, dann einmal nachziehen. Was dabei
     angezapft wird, sagt die Netzliste selbst (je Leitung allein, wie oben),
     nicht das Modell, das hier geprüft wird. */
  const rechne = (schnell: boolean) => {
    /* Ohne `Schaltplan.nachziehen` (main vor E746) gibt es nichts
       nachzurechnen — dann sind beide Zusagen unten rot, nicht der Lauf weg. */
    if (typeof w.nachziehenEcht !== 'function') return { punkte: '(kein Schaltplan.nachziehen)', aenderungen: -1 };
    const plan = Schaltplan.lesen({ plan: JSON.parse(vorJson) });
    const vorKlemmen = (plan.leitungen as any[]).map(l => JSON.stringify(w.klemmenDer(plan, l)));
    const v = Schaltplan.vorherMerken(plan);
    const t = (plan.teile as any[]).find(x => x.id === 'F1');
    t.x = f.x; t.y = f.y;
    w.nachziehenEcht(plan, v, ['F1'], { heilen: true, schnell });
    const aenderungen = (plan.leitungen as any[])
      .filter((l, i) => JSON.stringify(w.klemmenDer(plan, l)) !== vorKlemmen[i]).length;
    return { punkte: JSON.stringify((plan.leitungen as any[]).map(l => [l.id, l.punkte])), aenderungen };
  };
  return { gespeichert: JSON.stringify((nach.leitungen as any[]).map(l => [l.id, l.punkte])),
           voll: rechne(false), schnell: rechne(true) };
}, [blockW2, vorW2.json] as [string, string]);
p('An dieser Lage taugen die billigen Wege nicht: sie zapften an (sonst prüfte die nächste Zusage nichts)',
  pruef10.schnell.aenderungen > 0 && pruef10.schnell.punkte !== pruef10.voll.punkte,
  `billig ${pruef10.schnell.aenderungen} Änderungen, gleich voll: ${pruef10.schnell.punkte === pruef10.voll.punkte}`);
p('Gespeichert ist das Ergebnis der VOLLEN Suche, Byte für Byte — kein Zwischenbild',
  pruef10.gespeichert === pruef10.voll.punkte && pruef10.voll.aenderungen === 0,
  `gespeichert ${pruef10.gespeichert.slice(0, 240)} · voll ${pruef10.voll.punkte.slice(0, 240)}`);
const meldNach10 = (await meldungenJetzt()).slice(meldVor10.length);
p('Und das Ziehen meldet nichts — es gab einen sauberen Weg', meldNach10.length === 0, meldNach10.join(' | '));

/* ==========================================================================
 * §11 · Die EIGENE Klemme auf einer fremden Leitung (Durchsicht, Fund 2)
 * --------------------------------------------------------------------------
 * Das Nachziehen führt nur Leitungen, die am bewegten Teil hängen. Landet
 * aber die eigene Klemme des Teils auf einer fremden Leitung, verbindet die
 * Netzliste sie über den Ort — gemessen in der Durchsicht, auf main wie
 * nach E746: R1 gedreht, und aus {E1:X2 E2:X1} wird {E1:X2 E2:X1 R1:1},
 * ohne ein Wort. Verhindert wird das nicht (vielleicht ist es gewollt), aber
 * gesagt — und zwar, welche Klemme jetzt was berührt. Auch beim Verlassen,
 * beim Schieben mit der Pfeiltaste und beim Ziehen (dort erst beim Loslassen).
 * ========================================================================*/
console.log('\n11 · Die eigene Klemme auf einer fremden Leitung');
const blockQ = await oeffne('Q');
await seite.waitForTimeout(300);
const qVor = await zustand(blockQ);
gleich('Vorher: q verbindet E1:X2 und E2:X1, R1 hängt an nichts',
  qVor.teilung.filter((g: string) => g.includes('l:q')), ['E1:X2 E2:X1 l:q']);
await waehle('R1');
let m0 = (await meldungenJetzt()).length;
await taste('r');
const q1 = await zustand(blockQ);
let neu11 = (await meldungenJetzt()).slice(m0);
p('Gedreht: R1:1 liegt auf q — die Netzliste ändert sich wirklich (sonst prüfte das hier nichts)',
  q1.teilung.includes('E1:X2 E2:X1 R1:1 l:q'), q1.teilung.join(' | '));
p('… die Fläche lässt die Lage, wie der Mensch sie wollte (R1 ist gedreht, nichts verhindert)',
  q1.teile.R1.drehung === 90 && q1.punkte.q === qVor.punkte.q, JSON.stringify(q1.teile.R1));
p('… und sie sagt es: „R1:1 berührt jetzt die Leitung E1:X2–E2:X1"',
  neu11.length === 1 && /R1:1 berührt jetzt die Leitung E1:X2–E2:X1/.test(neu11[0] ?? ''),
  neu11.join(' | ') || '(keine Meldung)');
m0 = (await meldungenJetzt()).length;
await taste('r');
const q2 = await zustand(blockQ);
neu11 = (await meldungenJetzt()).slice(m0);
p('Noch einmal gedreht: R1:1 ist wieder weg, und die Fläche sagt auch das',
  !q2.teilung.some((g: string) => g.includes('R1:')  && g.includes('l:q'))
  && neu11.length === 1 && /R1:1 berührt die Leitung E1:X2–E2:X1 nicht mehr/.test(neu11[0] ?? ''),
  q2.teilung.join(' | ') + ' · ' + (neu11.join(' | ') || '(keine Meldung)'));
/* Jetzt bei 180°: beide Klemmen bei x = 220. Drei Raster nach rechts, und
   beide liegen auf q — erst beim dritten. */
m0 = (await meldungenJetzt()).length;
await taste('ArrowRight'); await taste('ArrowRight');
const nachZwei = (await meldungenJetzt()).slice(m0);
p('Pfeiltaste, zwei Raster: R1 berührt q noch nicht, keine Meldung', nachZwei.length === 0, nachZwei.join(' | '));
await taste('ArrowRight');
const q3 = await zustand(blockQ);
neu11 = (await meldungenJetzt()).slice(m0);
p('Das dritte Raster legt R1:1 und R1:2 auf q — die Fläche nennt beide',
  q3.teilung.includes('E1:X2 E2:X1 R1:1 R1:2 l:q') && neu11.length === 1
  && /R1:1 berührt jetzt/.test(neu11[0] ?? '') && /R1:2 berührt jetzt/.test(neu11[0] ?? ''),
  q3.teilung.join(' | ') + ' · ' + (neu11.join(' | ') || '(keine Meldung)'));
/* Und mit der Maus: R1 drei Raster zurück. Gemeldet wird beim Loslassen,
   nicht bei jeder Bewegung. R1 steht bei (230,200), 180° gedreht — sein
   Kasten ist 230…270 × 200…260; angefasst links unten, abseits von q. */
m0 = (await meldungenJetzt()).length;
let waehrend = -1;
await zieheGenau(blockQ, [236, 252], [-30, 0], 9, async () => {
  waehrend = (await meldungenJetzt()).length - m0;
});
const q4 = await zustand(blockQ);
neu11 = (await meldungenJetzt()).slice(m0);
p('Mit der Maus zurückgezogen: R1 berührt q nicht mehr',
  q4.teile.R1.x === 200 && !q4.teilung.some((g: string) => g.includes('R1:') && g.includes('l:q')),
  JSON.stringify(q4.teile.R1) + ' · ' + q4.teilung.join(' | '));
p('… während des Ziehens keine Meldung, beim Loslassen genau eine, die beide Klemmen nennt',
  waehrend === 0 && neu11.length === 1 && /R1:1 berührt die Leitung E1:X2–E2:X1 nicht mehr/.test(neu11[0] ?? '')
  && /R1:2 berührt/.test(neu11[0] ?? ''),
  `während ${waehrend} · ` + (neu11.join(' | ') || '(keine Meldung)'));

/* ==========================================================================
 * §12 · Der alte Plan A: Heilen, ohne anzuzapfen (Durchsicht, Fund 3)
 * --------------------------------------------------------------------------
 * Die eine Ausnahme von „fremde Leitungen bleiben Byte für Byte": liegt das
 * Ende einer Leitung NEBEN der Klemme, die es meint (ein Plan von vor E735,
 * L253 Punkt 7), rückt es beim Drehen, Spiegeln und Ziehen IRGENDEINES Teils
 * an die Klemme (E738, test608 §5) — mit derselben Prüfung wie jeder neue
 * Weg. test611 hatte das bis zur Durchsicht nicht abgedeckt: mit `heilen`
 * aus blieb er grün (79/79), nur test608 wurde rot. Hier wird ein Teil
 * gedreht, an dem KEINE Leitung hängt (R9).
 * ========================================================================*/
console.log('\n12 · Der alte Plan A: heilen, ohne anzuzapfen');
const blockA = await oeffne('A');
await seite.waitForTimeout(300);
const aVor = await zustand(blockA);
const abwVorA: string[] = await seite.evaluate(([b, s]: [string, any]) => (window as any).endenAbweichend(b, s),
  [blockA, SOLL_A] as [string, any]);
const zuHeilen = [...new Set(abwVorA.map(x => x.split('.')[0]!))].sort();
gleich('Vorbedingung: a1–a6 enden neben ihrer Klemme, z1 liegt richtig', zuHeilen, ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']);
const m12 = (await meldungenJetzt()).length;
await waehle('R9');
await taste('r');
const aNach = await zustand(blockA);
p('R9 ist gedreht', aNach.teile.R9.drehung === 90, JSON.stringify(aNach.teile.R9));
const andersA = (a: string[], b: string[]) => a.filter(x => !b.includes(x));
p('Die Netzliste ist dieselbe', JSON.stringify(aNach.teilung) === JSON.stringify(aVor.teilung),
  'neu: ' + andersA(aNach.teilung, aVor.teilung).join(' | ') + ' · weg: ' + andersA(aVor.teilung, aNach.teilung).join(' | '));
const geaendertA = Object.keys(aVor.punkte).filter(id => aVor.punkte[id] !== aNach.punkte[id]).sort();
gleich('Genau die sechs Leitungen mit einem Ende neben der Klemme ändern sich — z1 bleibt Byte für Byte',
  geaendertA, zuHeilen);
const zapftA = Object.keys(aVor.klemmen).filter(id => JSON.stringify(aVor.klemmen[id]) !== JSON.stringify(aNach.klemmen[id]));
p('Keine geheilte Leitung zapft an: jede fasst genau die Klemmen von vorher', zapftA.length === 0,
  zapftA.map(id => `${id}: ${aVor.klemmen[id].join(',')} → ${aNach.klemmen[id].join(',')}`).join(' | '));
const abwNachA: string[] = await seite.evaluate(([b, s]: [string, any]) => (window as any).endenAbweichend(b, s),
  [blockA, SOLL_A] as [string, any]);
p('Jedes Ende liegt danach auf der Klemme, die es meint (L)', abwNachA.length === 0, abwNachA.join(' | '));
const r8 = await seite.evaluate((b: string) => {
  const plan = Store.getBlock(b).plan;
  const ni = Stromfluss.netze(plan);
  const a5 = ni.leitungNetz.a5;
  return ni.netzVon.get('k:R8:1') === a5;
}, blockA);
p('a5 läuft nicht über die freie Klemme R8:1, die auf ihrem nächsten Weg liegt', !r8);
const meldA = (await meldungenJetzt()).slice(m12);
p('Und das Heilen meldet nichts — es hat nichts an der Schaltung geändert', meldA.length === 0, meldA.join(' | '));

/* ==========================================================================
 * §13 · Während eines Zugs wird nichts gespeichert (zweite Durchsicht, Fund 1)
 * --------------------------------------------------------------------------
 * Die Zwischenbilder eines Zugs sind die billigen Wege, und an der Stelle aus
 * §10 zapfen sie an. §10 hält, dass beim LOSLASSEN die volle Suche
 * gespeichert wird. Die zweite Durchsicht fand, dass das nicht reicht: alles,
 * was WÄHREND des Zugs über `aendere` geht, speicherte das Zwischenbild und
 * merkte es als Rückgängig-Schritt. Gemessen gegen 478791f5f (Sonde der
 * Durchsicht, F1 an die Stelle aus §10, Maus noch unten, zweimal „h"): nach
 * dem Loslassen stimmt die Netzliste, aber das zweite Strg+Z bringt
 * {E1:X2 F1:N F1:N2 G2:N} zurück — ohne ein Wort. Dazu fand das Nachmessen
 * vier Wege mehr: die Ablage hält den Plan der Fläche als DASSELBE Objekt
 * (`updateBlock` übernimmt den Verweis), und die nächste Schreibpause schrieb
 * das Zwischenbild in die IndexedDB, ohne dass jemand eine Taste drückte;
 * losgelassen ausserhalb der Fläche, endete der Zug nie, und die nächste
 * Pfeiltaste speicherte ihn; ein zweiter Finger fing einen neuen Zug an und
 * liess den ersten liegen; Strg+Z mitten im Zug legte das Zwischenbild auf
 * den Stapel des Wiederholens.
 *
 * Verlangt wird, je Weg: während des Zugs hält die Ablage den Stand von vor
 * dem Zug Byte für Byte; nach dem Loslassen ist das Ergebnis der vollen
 * Suche gespeichert (unabhängig nachgerechnet wie in §10) mit der Netzliste
 * von vorher; und jeder Schritt in drei Mal Strg+Z und drei Mal Umschalt+
 * Strg+Z ist frei von Anzapfungen — Netzliste und Klemmen jeder Leitung wie
 * vorher. Die Tasten zählen während des Zugs nicht (die Wahl steht in E746);
 * Escape bricht den Zug ab.
 * ========================================================================*/
console.log('\n13 · Während eines Zugs wird nichts gespeichert');
await seite.evaluate(() => {
  const w = window as any;
  /** Die volle Suche, unabhängig von der Fläche: der Plan von vorher, so
      gelesen, wie die Fläche ihn liest, F1 an die Lage, einmal nachziehen. */
  w.vollNach = (vorJson: string, x: number, y: number): string => {
    const plan = Schaltplan.lesen({ plan: JSON.parse(vorJson) });
    const v = Schaltplan.vorherMerken(plan);
    const t = (plan.teile as any[]).find(q => q.id === 'F1');
    t.x = x; t.y = y;
    w.nachziehenEcht(plan, v, ['F1'], { heilen: true });
    return JSON.stringify((plan.leitungen as any[]).map(l => [l.id, l.punkte]));
  };
  /** Was die IndexedDB für einen Block hält — an `Store` vorbei (wie test104). */
  w.ausDerIdb = (bid: string): Promise<any> => new Promise(fertig => {
    const a = indexedDB.open(KONSTANTEN.ABLAGE_NAME);
    a.onsuccess = () => {
      const db = a.result;
      const r = db.transaction(['blocks'], 'readonly').objectStore('blocks').get(bid);
      r.onsuccess = () => { fertig(r.result ? r.result.plan : null); db.close(); };
      r.onerror = () => { fertig(null); db.close(); };
    };
    a.onerror = () => fertig(null);
  });
  /** Die Netzliste eines beliebigen Plans, gruppiert wie in `zustand`. */
  w.teilungVon = (plan: any): string[] => {
    const ni = Stromfluss.netze(plan);
    const g = new Map<number, Set<string>>();
    const dazu = (n: number, name: string) => { if (!g.has(n)) g.set(n, new Set()); g.get(n)!.add(name); };
    (ni.klemmen as any[]).forEach(k => { if (!k.intern) dazu(ni.netzVon.get(k.schluessel), k.teil + ':' + k.nr); });
    Object.keys(ni.leitungNetz).forEach(id => dazu(ni.leitungNetz[id], 'l:' + id));
    return [...g.values()].map(s => [...s].sort().join(' ')).sort();
  };
});
const strg = async (key: string, shiftKey = false): Promise<void> => {
  await seite.evaluate(([k, s]: [string, boolean]) => {
    const el = document.querySelector<HTMLElement>('.sp-wrap');
    if (!el) throw new Error('keine Planfläche');
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, ctrlKey: true, shiftKey: s, bubbles: true, cancelable: true }));
  }, [key, shiftKey] as [string, boolean]);
  await seite.waitForTimeout(250);
};
const leitungenVon = (z: any): string =>
  JSON.stringify((JSON.parse(z.json).leitungen as any[]).map(l => [l.id, l.punkte]));
/** Weicht ein Zustand von der Netzliste und den Klemmen je Leitung ab? */
const abweichungen = (z: any, start: any): string[] => {
  const raus: string[] = [];
  const neu = z.teilung.filter((g: string) => !start.teilung.includes(g));
  if (neu.length) raus.push('Netz neu: ' + neu.join(' | '));
  Object.keys(start.klemmen).forEach(id => {
    if (JSON.stringify(z.klemmen[id]) !== JSON.stringify(start.klemmen[id]))
      raus.push(`${id}: ${(start.klemmen[id] || []).join(',')} → ${(z.klemmen[id] || ['(weg)']).join(',')}`);
  });
  return raus;
};
const mausZug = async (bid: string, schritte = SCHRITTE): Promise<void> => {
  const bild = await bildpunkt(bid);
  const [x0, y0] = bild(430, 92);
  await seite.mouse.move(x0, y0);
  await seite.mouse.down();
  for (let i = 1; i <= schritte; i++) {
    const [x, y] = bild(430 + 30 * i / schritte, 92 + 40 * i / schritte);
    await seite.mouse.move(x, y);
  }
};

type Zug13 = {
  vorher?: (bid: string) => Promise<void>;     // vor dem Zug (ohne F1 zu wählen, wenn `direkt`)
  direkt?: boolean;                            // F1 nicht vorher anklicken — der Zug wählt es selbst
  ziehen?: (bid: string) => Promise<void>;     // statt des Mauszugs
  waehrend: (bid: string, start: any) => Promise<void>;
  loslassen?: (bid: string) => Promise<void>;  // statt `mouse.up`
  danach?: (bid: string) => Promise<void>;     // nach dem Loslassen, vor dem Verlauf
  f1?: (t: any) => boolean;                    // wie F1 danach dastehen muss
};
const zugMit = async (name: string, o: Zug13): Promise<void> => {
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  if (o.vorher) await o.vorher(bid);
  if (!o.direkt) await waehle('F1');
  const start = await zustand(bid);
  if (o.ziehen) await o.ziehen(bid); else await mausZug(bid);
  await o.waehrend(bid, start);
  const mitte = await zustand(bid);
  p(`${name}: während des Zugs hält die Ablage den Stand von vor dem Zug Byte für Byte`,
    mitte.json === start.json, abweichungen(mitte, start).join(' | ') || 'anders, ohne neue Anzapfung');
  if (o.loslassen) await o.loslassen(bid); else await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  const f = nach.teile.F1;
  p(`${name}: F1 steht danach, wie der Zug es will (430,100, nicht gedreht, nicht gespiegelt)`,
    !!f && f.x === 430 && f.y === 100 && (o.f1 ? o.f1(f) : f.drehung === 0 && !f.gespiegelt), JSON.stringify(f));
  if (f) {
    const voll: string = await seite.evaluate(([j, x, y]: [string, number, number]) =>
      (window as any).vollNach(j, x, y), [start.json, f.x, f.y] as [string, number, number]);
    p(`${name}: gespeichert ist das Ergebnis der vollen Suche, Byte für Byte`, leitungenVon(nach) === voll,
      `gespeichert ${leitungenVon(nach).slice(0, 200)} · voll ${voll.slice(0, 200)}`);
  }
  const abwNach = abweichungen(nach, start);
  p(`${name}: die Netzliste ist die von vorher, jede Leitung fasst ihre Klemmen`, abwNach.length === 0, abwNach.join(' | '));
  if (o.danach) await o.danach(bid);
  const verlauf: string[] = [];
  for (let i = 1; i <= 3; i++) {
    await strg('z');
    abweichungen(await zustand(bid), start).forEach(a => verlauf.push(`Strg+Z ${i}: ${a}`));
  }
  for (let i = 1; i <= 3; i++) {
    await strg('z', true);
    abweichungen(await zustand(bid), start).forEach(a => verlauf.push(`Umschalt+Strg+Z ${i}: ${a}`));
  }
  p(`${name}: jeder Schritt in Rückgängig und Wiederholen ist frei von Anzapfungen (3 + 3 Schritte)`,
    verlauf.length === 0, verlauf.slice(0, 4).join(' | '));
};

/* Die Probe der Durchsicht, wörtlich: zweimal „h", die Maus noch unten. */
await zugMit('„h h" im Zug', { waehrend: async () => { await taste('h'); await taste('h'); } });
await zugMit('„r r" im Zug', { waehrend: async () => { await taste('r'); await taste('r'); } });
await zugMit('Entf im Zug', { waehrend: async () => { await taste('Delete'); } });
await zugMit('Pfeil rechts im Zug', { waehrend: async () => { await taste('ArrowRight'); } });
/* Ein Knopf der Leiste mitten im Zug — so klickt ein zweiter Finger oder die
   Eingabetaste auf einem Knopf, der den Fokus hat. */
await zugMit('Knopf „Spiegeln" im Zug', { waehrend: async () => {
  await seite.evaluate(() => (document.querySelector('.sp-wrap .sp-fuss button[data-a="spiegeln"]') as HTMLButtonElement | null)?.click());
  await seite.waitForTimeout(250);
} });
/* Strg+Z mitten im Zug, mit einem Schritt davor (T1 gedreht): der Schritt
   bleibt, und das Wiederholen bringt kein Zwischenbild zurück. */
await zugMit('Strg+Z im Zug', {
  vorher: async () => { await waehle('T1'); await taste('r'); },
  waehrend: async () => { await strg('z'); }
});
/* Und Umschalt+Strg+Z mitten im Zug, mit einem Schritt zum Wiederholen
   (T1 gedreht und zurückgenommen): das Zwischenbild käme sonst auf den
   Stapel des Rückgängig. */
await zugMit('Umschalt+Strg+Z im Zug', {
  vorher: async () => { await waehle('T1'); await taste('r'); await strg('z'); },
  waehrend: async () => { await strg('z', true); }
});
/* Die Ablage im Zug: eine gewöhnliche Handlung (T1 drehen) und gleich danach
   der Zug, in EINER Bewegung an die Stelle — die Schreibpause (400 ms) läuft
   ab, während die Maus unten ist. */
await zugMit('Schreibpause im Zug', {
  vorher: async () => { await waehle('T1'); await taste('r'); },
  direkt: true,
  ziehen: async (bid) => mausZug(bid, 1),
  waehrend: async (bid, start) => {
    await seite.waitForTimeout(900);
    const t: string[] = await seite.evaluate(async (b: string) => {
      const w = window as any;
      return w.teilungVon(await w.ausDerIdb(b));
    }, bid);
    p('Schreibpause im Zug: auch die IndexedDB hält keine Anzapfung, nur den Stand von vor dem Zug',
      JSON.stringify(t) === JSON.stringify(start.teilung), t.filter(g => !start.teilung.includes(g)).join(' | ') || 'anders');
  }
});
/* Losgelassen über der Palette, ausserhalb der Fläche: der Zug endet trotzdem,
   mit der vollen Suche — und danach speichert eine gewöhnliche Handlung
   (T1 drehen) kein liegengebliebenes Zwischenbild. */
await zugMit('Losgelassen ausserhalb', {
  waehrend: async () => {},
  loslassen: async () => {
    const pal = await seite.locator('.sp-wrap .sp-palette').boundingBox();
    if (!pal) throw new Error('keine Palette');
    await seite.mouse.move(pal.x + pal.width / 2, pal.y + Math.min(200, pal.height / 2));
    await seite.mouse.up();
  },
  danach: async () => { await waehle('T1'); await taste('r'); }
});
/* Ein zweiter Finger: der erste zieht F1 an die Stelle, der zweite tippt T1.
   Der Zug des ersten endet richtig (volle Suche), bevor der zweite zählt. */
const cdp = await ktx.newCDPSession(seite);
let fingerBei: [number, number] = [0, 0];
await zugMit('Zweiter Finger im Zug', {
  ziehen: async (bid) => {
    const bild = await bildpunkt(bid);
    const [x0, y0] = bild(430, 92);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
    for (let i = 1; i <= SCHRITTE; i++) {
      fingerBei = bild(430 + 30 * i / SCHRITTE, 92 + 40 * i / SCHRITTE);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: fingerBei[0], y: fingerBei[1], id: 1 }] });
    }
    await seite.waitForTimeout(150);
  },
  waehrend: async () => {},
  loslassen: async () => {
    const box = await seite.locator('.sp-wrap svg .sp-teil[data-id="T1"]').boundingBox();
    if (!box) throw new Error('T1 nicht gefunden');
    const t1: [number, number] = [box.x + box.width / 2, box.y + box.height / 2];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart',
      touchPoints: [{ x: fingerBei[0], y: fingerBei[1], id: 1 }, { x: t1[0], y: t1[1], id: 2 }] });
    await seite.waitForTimeout(60);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: t1[0], y: t1[1], id: 2 }] });
    await seite.waitForTimeout(150);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: fingerBei[0], y: fingerBei[1], id: 1 }] });
  },
  danach: async () => { await waehle('T1'); await taste('r'); }
});
/* Der Browser bricht den Finger ab (`pointercancel`, etwa wenn eine Geste des
   Systems übernimmt): der Zug endet wie beim Loslassen, mit der vollen Suche.
   Das ist keine Lücke von 478791f5f — dort horchte die Bühne auf
   `pointercancel` —, sondern hält, dass das Horchen am Dokument es auch tut. */
await zugMit('Abgebrochener Finger', {
  ziehen: async (bid) => {
    const bild = await bildpunkt(bid);
    const [x0, y0] = bild(430, 92);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
    for (let i = 1; i <= SCHRITTE; i++) {
      fingerBei = bild(430 + 30 * i / SCHRITTE, 92 + 40 * i / SCHRITTE);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: fingerBei[0], y: fingerBei[1], id: 1 }] });
    }
    await seite.waitForTimeout(150);
  },
  waehrend: async () => {},
  loslassen: async () => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); },
  danach: async () => { await waehle('T1'); await taste('r'); }
});
await cdp.detach();

/* Escape bricht den Zug ab: nichts gespeichert, kein Rückgängig-Schritt, und
   das Bild ist wieder das von vor dem Zug. */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await waehle('F1');
  const start = await zustand(bid);
  const bildVor: string = await seite.evaluate(() => document.querySelector('.sp-wrap svg.sp-flaeche')?.outerHTML ?? '');
  await mausZug(bid);
  const bildMitte: string = await seite.evaluate(() => document.querySelector('.sp-wrap svg.sp-flaeche')?.outerHTML ?? '');
  await taste('Escape');
  const bildEsc: string = await seite.evaluate(() => document.querySelector('.sp-wrap svg.sp-flaeche')?.outerHTML ?? '');
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  const zurueckAus: boolean = await seite.evaluate(() =>
    !!(document.querySelector('.sp-wrap button[data-a="zurueck"]') as HTMLButtonElement | null)?.disabled);
  p('Escape im Zug: das Bild war unterwegs ein anderes (sonst prüfte das hier nichts)', bildMitte !== bildVor);
  p('Escape im Zug: das Bild ist sofort wieder das von vor dem Zug, Zeichen für Zeichen', bildEsc === bildVor,
    `${bildEsc.length} gegen ${bildVor.length} Zeichen`);
  p('Escape im Zug: auch nach dem Loslassen ist nichts gespeichert — die Ablage Byte für Byte wie vorher',
    nach.json === start.json, JSON.stringify(nach.teile.F1));
  p('Escape im Zug: kein Rückgängig-Schritt (der Knopf bleibt aus)', zurueckAus);
}

/* Seit das Loslassen am Dokument gehorcht wird, kommt es auch ausserhalb der
   Fläche an — eine LEITUNG, die dort losgelassen wird, verfällt, statt bis
   neben den Plan zu reichen. (478791f5f bekam dieses Loslassen gar nicht;
   das ist eine Abdeckung des neuen Horchens, keine Lücke von damals.) */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await seite.locator('.sp-wrap button[data-wz="leitung"]').click();
  await seite.waitForTimeout(250);
  const start = await zustand(bid);
  const bild = await bildpunkt(bid);
  const [x0, y0] = bild(700, 300);
  await seite.mouse.move(x0, y0);
  await seite.mouse.down();
  for (let i = 1; i <= 6; i++) { const [x, y] = bild(700 + 10 * i, 300); await seite.mouse.move(x, y); }
  const pal = await seite.locator('.sp-wrap .sp-palette').boundingBox();
  if (!pal) throw new Error('keine Palette');
  await seite.mouse.move(pal.x + pal.width / 2, pal.y + Math.min(200, pal.height / 2));
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  p('Eine Leitung, losgelassen über der Palette, verfällt — keine neue Leitung, die Ablage Byte für Byte wie vorher',
    nach.json === start.json, `${Object.keys(start.punkte).length} → ${Object.keys(nach.punkte).length} Leitungen`);
  await seite.locator('.sp-wrap button[data-wz="zeigen"]').click();
  await seite.waitForTimeout(250);
}

/* Zeichnet die Seite sich mitten im Zug neu (etwa weil ein anderes Fenster
   den Block geändert hat), ist die alte Fläche nicht mehr im Dokument: ihr
   Loslassen speichert nichts mehr — sonst schriebe sie über die Ablage, die
   die neue Fläche schon zeigt. Auch das ist eine Abdeckung des neuen
   Horchens (478791f5f hörte das Loslassen der alten Fläche nicht). */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await waehle('F1');
  const start = await zustand(bid);
  await mausZug(bid);
  await seite.evaluate(() => { App.zeichneSeite(); });
  await seite.waitForTimeout(300);
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  p('Neu gezeichnet im Zug: das Loslassen der alten Fläche speichert nichts — die Ablage Byte für Byte wie vorher',
    nach.json === start.json, JSON.stringify(nach.teile.F1));
}

/* ==========================================================================
 * §14 · Echte Maus, echte Tasten (dritte Durchsicht)
 * --------------------------------------------------------------------------
 * §13 schickt seine Tasten an die Fläche (`taste`, `strg`: Fokus auf
 * `.sp-wrap`, dann `dispatchEvent`). Die dritte Durchsicht fuhr dieselben
 * Wege mit ECHTER Maus und ECHTER Tastatur (`mouse.down`, `keyboard.press`)
 * und fand: im Zug steht der Fokus gar nicht auf der Fläche, sondern auf der
 * Seite (`body`). Das Anfassen zeichnet die Fläche neu (`male`), der Knoten
 * unter dem Zeiger ist danach ein anderer, und der Browser setzt den Fokus
 * beim `mousedown` auf die Seite, weil er an einem Knoten ausserhalb des
 * Dokuments keinen fokussierbaren Vorfahren findet. Gemessen auf a8533763b
 * mit der Sonde der Durchsicht: Escape brach weder einen Zug mit Teilen noch
 * einen Rahmen ab — der Zug lief weiter und wurde beim Loslassen
 * gespeichert; Strg+Z im Zug nahm der Seitenverlauf (E682), der die Seite neu
 * baute und den Zug still verwarf (F1 danach bei 400,60). Das Nachmessen fand
 * dazu: nach einem echten Klick auf ein Teil drehte ein echtes „r" nichts —
 * der Fokus blieb auf der Seite —, und Umschalt+Strg+Z (der Browser meldet
 * „Z") und Strg+Y nahm auch mit dem Fokus auf der Fläche der Seitenverlauf.
 * „Als Vorlage speichern" und „Als Bild speichern" lasen mitten im Zug das
 * Zwischenbild (L253 Punkt 9), und der Hinweis eines Beispiels erschien, auch
 * wenn das Beispiel im Zug gar nicht eingesetzt worden war.
 *
 * Verlangt wird, alles mit echter Eingabe — keine Taste an die Wurzel
 * geschickt; nur den Fokus auf einen Knopf setzt der Lauf selbst, wie ihn
 * die Tabulatortaste dorthin brächte: Escape bricht einen Zug mit Teilen,
 * einen Rahmen und eine Leitung ab (das Bild sofort wie vorher, nichts
 * gespeichert, kein Rückgängig-Schritt); Strg+Z, Umschalt+Strg+Z und Strg+Y
 * tun im Zug nichts, weder an der Fläche noch am Seitenverlauf, und der Zug
 * wird beim Loslassen gespeichert wie sonst; ist im Zug ein Menü offen,
 * schliesst Escape erst das Menü (ein Druck, ein Fenster), der nächste Druck
 * bricht ab; Vorlage und Bild verweigern im Zug und sagen es, nach dem
 * Loslassen gehen sie und nehmen den gespeicherten Plan; der Hinweis eines
 * Beispiels erscheint nur, wenn es eingesetzt wurde; und nach einem echten
 * Klick nehmen echte Tasten die Fläche — „r", Strg+Z, Umschalt+Strg+Z,
 * Strg+Y, ohne dass der Seitenverlauf etwas tut.
 * ========================================================================*/
console.log('\n14 · Echte Maus, echte Tasten');
const fokusJetzt = (): Promise<string> => seite.evaluate(() => {
  const a = document.activeElement as HTMLElement | null;
  return a ? a.tagName + (typeof a.className === 'string' && a.className ? '.' + a.className.split(' ')[0] : '') : 'null';
});
const bildDerFlaeche = (): Promise<string> =>
  seite.evaluate(() => document.querySelector('.sp-wrap svg.sp-flaeche')?.outerHTML ?? '');
const f1ImBild = (): Promise<string | null> => seite.evaluate(() =>
  document.querySelector('.sp-wrap svg .sp-teil[data-id="F1"]')?.getAttribute('transform') ?? null);
const zurueckKnopfAus = (): Promise<boolean> => seite.evaluate(() =>
  !!(document.querySelector('.sp-wrap button[data-a="zurueck"]') as HTMLButtonElement | null)?.disabled);
const gewaehlt = (): Promise<number> => seite.evaluate(() => {
  const m = /(\d+) gewählt/.exec(document.querySelector('.sp-wrap .sp-auswahl')?.textContent ?? '');
  return m ? Number(m[1]) : 0;
});
/** Die Fläche zeichnen lassen und merken, ob sie danach noch DIESELBE ist. */
const markiere = (): Promise<void> => seite.evaluate(() => {
  const el = document.querySelector<HTMLElement>('.sp-wrap');
  if (el) el.dataset.probe = 'alt';
});
const dieselbeFlaeche = (): Promise<{ flaechen: number; marke: string | null }> => seite.evaluate(() => ({
  flaechen: document.querySelectorAll('.sp-wrap').length,
  marke: document.querySelector<HTMLElement>('.sp-wrap')?.dataset.probe ?? null
}));
/** Einem Knopf den Fokus geben (wie die Tabulatortaste) und ihn mit der
    ECHTEN Eingabetaste drücken. */
const mitEingabe = async (wahl: string): Promise<void> => {
  const da = await seite.evaluate((w: string) => {
    const b = document.querySelector<HTMLElement>(w);
    if (b) b.focus();
    return !!b && document.activeElement === b;
  }, wahl);
  if (!da) throw new Error('Knopf nicht fokussierbar: ' + wahl);
  await seite.keyboard.press('Enter');
  await seite.waitForTimeout(300);
};
/** Steht eine Frage offen (der Fokus in einem Feld ausserhalb der Fläche),
    wird sie mit echter Tastatur beantwortet. Gibt zurück, ob eine offen war. */
const frageBeantworten = async (antwort: string): Promise<boolean> => {
  const offen = await seite.waitForFunction(() => {
    const a = document.activeElement;
    return a instanceof HTMLInputElement && !a.closest('.sp-wrap');
  }, null, { timeout: 3000 }).then(() => true, () => false);
  if (!offen) return false;
  await seite.keyboard.type(antwort);
  await seite.keyboard.press('Enter');
  await seite.waitForTimeout(400);
  return true;
};
const VORLAGEN = 'elektro:planvorlagen';
const vorlagenZahl = (): Promise<number> => seite.evaluate((k: string) => (Store.getMeta(k, []) || []).length, VORLAGEN);
const downloads: any[] = [];
seite.on('download', d => { downloads.push(d); });

/* a · Escape bricht einen Zug mit Teilen ab. */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await waehle('F1');
  const start = await zustand(bid);
  const bildVor = await bildDerFlaeche();
  await mausZug(bid);
  console.log('    Fokus im Zug (echte Maus): ' + await fokusJetzt());
  const bildMitte = await bildDerFlaeche();
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(200);
  const bildEsc = await bildDerFlaeche();
  const f1Esc = await f1ImBild();
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  p('Echte Maus, echtes Escape — Zug mit Teilen: das Bild war unterwegs ein anderes (sonst prüfte das hier nichts)',
    bildMitte !== bildVor);
  p('Echte Maus, echtes Escape — Zug mit Teilen: das Bild ist sofort wieder das von vor dem Zug, Zeichen für Zeichen',
    bildEsc === bildVor, `F1 im Bild nach Escape: ${f1Esc}`);
  p('Echte Maus, echtes Escape — Zug mit Teilen: nach dem Loslassen nichts gespeichert, die Ablage Byte für Byte wie vorher',
    nach.json === start.json, JSON.stringify(nach.teile.F1));
  p('Echte Maus, echtes Escape — Zug mit Teilen: kein Rückgängig-Schritt (der Knopf bleibt aus)', await zurueckKnopfAus());
}

/* b · Escape bricht einen Rahmen ab. Zuerst ohne Escape: derselbe Rahmen
   wählt H1 — sonst bewiese „nichts gewählt" nichts. */
{
  const rahmen = async (bid: string, vorLoslassen?: () => Promise<void>): Promise<void> => {
    const bild = await bildpunkt(bid);
    const m = await seite.evaluate(() => Register.fachzeichen.masse('klingel', 0) as { w: number; h: number });
    /* H1 steht bei (760,50). Angefasst rechts unterhalb, auf leerer Fläche,
       aufgezogen bis (745,15): darin liegt H1 ganz, keine Leitung ganz. */
    const von: [number, number] = [Math.min(855, 760 + m.w + 10), Math.min(395, 50 + m.h + 10)];
    const [x0, y0] = bild(von[0], von[1]);
    await seite.mouse.move(x0, y0);
    await seite.mouse.down();
    for (let i = 1; i <= 8; i++) {
      const [x, y] = bild(von[0] + (745 - von[0]) * i / 8, von[1] + (15 - von[1]) * i / 8);
      await seite.mouse.move(x, y);
    }
    if (vorLoslassen) await vorLoslassen();
    await seite.mouse.up();
    await seite.waitForTimeout(450);
  };
  const bidA = await oeffne('W');
  await seite.waitForTimeout(300);
  await rahmen(bidA);
  const ohne = await gewaehlt();
  p('Ein Rahmen um H1, ohne Escape, wählt H1 (die Gegenprobe zur nächsten Zusage)', ohne === 1, `${ohne} gewählt`);

  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  const bildVor = await bildDerFlaeche();
  let bildMitte = '', bildEsc = '';
  await rahmen(bid, async () => {
    bildMitte = await bildDerFlaeche();
    await seite.keyboard.press('Escape');
    await seite.waitForTimeout(200);
    bildEsc = await bildDerFlaeche();
  });
  const mit = await gewaehlt();
  p('Echte Maus, echtes Escape — Rahmen: unterwegs stand der Rahmen im Bild', bildMitte !== bildVor);
  p('Echte Maus, echtes Escape — Rahmen: der Rahmen ist sofort weg, das Bild wie vor dem Zug', bildEsc === bildVor,
    `${bildEsc.length} gegen ${bildVor.length} Zeichen`);
  p('Echte Maus, echtes Escape — Rahmen: nach dem Loslassen ist nichts gewählt', mit === 0, `${mit} gewählt`);
}

/* c · Escape bricht eine Leitung ab. Zuerst ohne Escape: dieselbe Leitung
   entsteht. */
{
  const leitung = async (bid: string, vorLoslassen?: () => Promise<void>): Promise<void> => {
    const bild = await bildpunkt(bid);
    const [x0, y0] = bild(700, 300);
    await seite.mouse.move(x0, y0);
    await seite.mouse.down();
    for (let i = 1; i <= 6; i++) { const [x, y] = bild(700 + 10 * i, 300); await seite.mouse.move(x, y); }
    if (vorLoslassen) await vorLoslassen();
    await seite.mouse.up();
    await seite.waitForTimeout(450);
  };
  const werkzeug = async (wz: string): Promise<void> => {
    await seite.locator(`.sp-wrap button[data-wz="${wz}"]`).click();
    await seite.waitForTimeout(250);
  };
  const bidA = await oeffne('W');
  await seite.waitForTimeout(300);
  await werkzeug('leitung');
  await leitung(bidA);
  const ohne = Object.keys((await zustand(bidA)).punkte).length;
  p('Eine Leitung von (700,300) nach (760,300), ohne Escape, entsteht (die Gegenprobe zur nächsten Zusage)', ohne === 13,
    `${ohne} Leitungen`);
  await werkzeug('zeigen');

  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await werkzeug('leitung');
  const start = await zustand(bid);
  const bildVor = await bildDerFlaeche();
  let bildMitte = '', bildEsc = '';
  await leitung(bid, async () => {
    bildMitte = await bildDerFlaeche();
    await seite.keyboard.press('Escape');
    await seite.waitForTimeout(200);
    bildEsc = await bildDerFlaeche();
  });
  const nach = await zustand(bid);
  p('Echte Maus, echtes Escape — Leitung: unterwegs stand die gestrichelte Vorschau im Bild', bildMitte !== bildVor);
  p('Echte Maus, echtes Escape — Leitung: die Vorschau ist sofort weg, das Bild wie vor dem Zug', bildEsc === bildVor,
    `${bildEsc.length} gegen ${bildVor.length} Zeichen`);
  p('Echte Maus, echtes Escape — Leitung: keine neue Leitung, die Ablage Byte für Byte wie vorher', nach.json === start.json,
    `${Object.keys(start.punkte).length} → ${Object.keys(nach.punkte).length} Leitungen`);
  await werkzeug('zeigen');
}

/* d · Rückgängig und Wiederholen im Zug tun nichts — mit einem Schritt
   davor (T1 gedreht), damit die Fläche etwas zurückzunehmen HÄTTE, und nach
   dem Zaun des Seitenverlaufs (700 ms, wie test568), damit auch er etwas
   hätte. */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await waehle('T1');
  await taste('r');
  await seite.waitForTimeout(800);
  await waehle('F1');
  await markiere();
  const start = await zustand(bid);
  const m0 = (await meldungenJetzt()).length;
  await mausZug(bid);
  const f1Zug = await f1ImBild();
  const imZug: string[] = [];
  for (const k of ['Control+z', 'Control+Shift+Z', 'Control+y']) {
    await seite.keyboard.press(k);
    await seite.waitForTimeout(300);
    const fl = await dieselbeFlaeche();
    const mitte = await zustand(bid);
    const f1 = await f1ImBild();
    if (fl.flaechen !== 1 || fl.marke !== 'alt') imZug.push(`${k}: die Fläche ist neu gezeichnet (${fl.flaechen} Flächen, Marke ${fl.marke})`);
    if (mitte.json !== start.json) imZug.push(`${k}: die Ablage hat sich geändert (T1 ${JSON.stringify(mitte.teile.T1)}, F1 ${JSON.stringify(mitte.teile.F1)})`);
    if (f1 !== f1Zug) imZug.push(`${k}: F1 im Bild ${f1} statt ${f1Zug}`);
  }
  p(`Echte Maus, echtes Strg+Z, Umschalt+Strg+Z, Strg+Y im Zug: nichts geschieht — dieselbe Fläche, die Ablage wie vorher, F1 weiter bei ${f1Zug}`,
    imZug.length === 0, imZug.join(' | '));
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  const f = nach.teile.F1;
  p('… und nach dem Loslassen ist der Zug gespeichert: F1 bei 430,100', !!f && f.x === 430 && f.y === 100, JSON.stringify(f));
  if (f) {
    const voll: string = await seite.evaluate(([j, x, y]: [string, number, number]) =>
      (window as any).vollNach(j, x, y), [start.json, f.x, f.y] as [string, number, number]);
    p('… mit dem Ergebnis der vollen Suche, Byte für Byte', leitungenVon(nach) === voll,
      `gespeichert ${leitungenVon(nach).slice(0, 160)} · voll ${voll.slice(0, 160)}`);
  }
  p('… und der Schritt davor steht noch: T1 gedreht', nach.teile.T1?.drehung === 90, JSON.stringify(nach.teile.T1));
  const fl = await dieselbeFlaeche();
  p('… und die Fläche ist dieselbe wie vor dem Zug (die Seite wurde nicht neu gebaut)', fl.flaechen === 1 && fl.marke === 'alt',
    `${fl.flaechen} Flächen, Marke ${fl.marke}`);
  const seitenMeld = (await meldungenJetzt()).slice(m0).filter(t => /rückgängig|wiederhol/i.test(t));
  p('… und der Seitenverlauf hat nichts gemeldet', seitenMeld.length === 0, seitenMeld.join(' | '));
}

/* e · Ist im Zug ein Menü offen, schliesst Escape erst das Menü; der
   nächste Druck bricht den Zug ab. */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await waehle('F1');
  const start = await zustand(bid);
  const bildVor = await bildDerFlaeche();
  await mausZug(bid);
  const f1Zug = await f1ImBild();
  await mitEingabe('.sp-wrap button[data-a="mehr"]');
  const menueAuf = await seite.evaluate(() => !!document.querySelector('.menu [data-m="vorlage"]'));
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(200);
  const menueNach1 = await seite.evaluate(() => !!document.querySelector('.menu'));
  const f1Nach1 = await f1ImBild();
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(200);
  const bildNach2 = await bildDerFlaeche();
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  p('Menü im Zug: „…" öffnet mit der Eingabetaste sein Menü (sonst prüfte das hier nichts)', menueAuf);
  p('Menü im Zug: das erste Escape schliesst das Menü — und nur das, der Zug läuft weiter',
    !menueNach1 && f1Nach1 === f1Zug, `Menü noch offen: ${menueNach1}, F1 im Bild ${f1Nach1} (im Zug ${f1Zug})`);
  p('Menü im Zug: das zweite Escape bricht den Zug ab — das Bild wie vor dem Zug', bildNach2 === bildVor,
    `${bildNach2.length} gegen ${bildVor.length} Zeichen`);
  p('Menü im Zug: nach dem Loslassen nichts gespeichert', nach.json === start.json, JSON.stringify(nach.teile.F1));
}

/* f · „Als Vorlage speichern" im Zug verweigert und sagt es; nach dem
   Loslassen geht es und nimmt den gespeicherten Plan. */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await waehle('F1');
  const v0 = await vorlagenZahl();
  const m0 = (await meldungenJetzt()).length;
  await mausZug(bid);
  await mitEingabe('.sp-wrap button[data-a="mehr"]');
  await mitEingabe('.menu [data-m="vorlage"]');
  const abgelehnt = (await meldungenJetzt()).slice(m0).filter(t => /loslassen/i.test(t) && /Vorlage/.test(t));
  const fragte = abgelehnt.length ? false : await frageBeantworten('Im Zug');
  const vZug = await vorlagenZahl();
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  p('Vorlage im Zug: keine Vorlage gespeichert', vZug === v0, `${v0} → ${vZug} Vorlagen${fragte ? ' (der Name wurde mitten im Zug erfragt)' : ''}`);
  p('Vorlage im Zug: die Fläche sagt, warum', abgelehnt.length === 1, abgelehnt.join(' | ') || '(keine Meldung)');

  /* Nach dem Loslassen: die Auswahl leeren (echtes Escape — der Fokus steht
     jetzt auf der Fläche), dann derselbe Weg. */
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(250);
  await mitEingabe('.sp-wrap button[data-a="mehr"]');
  await mitEingabe('.menu [data-m="vorlage"]');
  const fragteNach = await frageBeantworten('Nach dem Zug');
  const vNach = await vorlagenZahl();
  const gleich = await seite.evaluate(([b, k]: [string, string]) => {
    const plan = Store.getBlock(b).plan;
    const liste = Store.getMeta(k, []) || [];
    const v = liste[liste.length - 1];
    if (!v) return 'keine Vorlage';
    const x0 = Math.min(...(plan.teile as any[]).map(t => t.x));
    const y0 = Math.min(...(plan.teile as any[]).map(t => t.y));
    const soll = JSON.stringify((plan.leitungen as any[]).map(l => (l.punkte as any[]).map(q => ({ x: q.x - x0, y: q.y - y0 }))));
    const ist = JSON.stringify((v.leitungen as any[]).map(l => l.punkte));
    return soll === ist ? '' : `Vorlage ${ist.slice(0, 160)} · Plan ${soll.slice(0, 160)}`;
  }, [bid, VORLAGEN] as [string, string]);
  p('Vorlage nach dem Loslassen: der Name wird erfragt, und eine Vorlage mehr steht da', fragteNach && vNach === vZug + 1,
    `gefragt: ${fragteNach}, ${vZug} → ${vNach} Vorlagen`);
  p('… und ihre Leitungen sind die gespeicherten (die volle Suche), Punkt für Punkt', gleich === '', gleich);
}

/* g · „Als Bild speichern" im Zug verweigert und sagt es; nach dem
   Loslassen geht es und zeigt den gespeicherten Plan. */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await waehle('F1');
  const d0 = downloads.length;
  const m0 = (await meldungenJetzt()).length;
  await mausZug(bid);
  await mitEingabe('.sp-wrap button[data-a="mehr"]');
  await mitEingabe('.menu [data-m="svg"]');
  await seite.waitForTimeout(500);
  const dZug = downloads.length;
  const abgelehnt = (await meldungenJetzt()).slice(m0).filter(t => /loslassen/i.test(t) && /Bild/.test(t));
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  p('Bild im Zug: nichts heruntergeladen', dZug === d0, `${dZug - d0} Downloads`);
  p('Bild im Zug: die Fläche sagt, warum', abgelehnt.length === 1, abgelehnt.join(' | ') || '(keine Meldung)');

  await mitEingabe('.sp-wrap button[data-a="mehr"]');
  const kommt = seite.waitForEvent('download', { timeout: 5000 }).then(d => d, () => null);
  await mitEingabe('.menu [data-m="svg"]');
  const dl = await kommt;
  let inhalt = '';
  if (dl) { const pfad = await dl.path(); if (pfad) inhalt = fs.readFileSync(pfad, 'utf8'); }
  const soll: string = await seite.evaluate((b: string) => '<?xml version="1.0" encoding="UTF-8"?>' +
    Schaltplan.alsSvg(Store.getBlock(b).plan, { raster: false, anschluesse: false })
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), bid);
  p('Bild nach dem Loslassen: ein Download, und er zeigt den gespeicherten Plan, Zeichen für Zeichen',
    !!dl && inhalt === soll, dl ? `${inhalt.length} gegen ${soll.length} Zeichen` : 'kein Download');
}

/* h · Der Hinweis eines Beispiels erscheint nur, wenn es eingesetzt wurde.
   Plan P hat kein Netz (sonst sagte die Fläche „Das Netz steht schon"). */
{
  const bid = await oeffne('P');
  await seite.waitForTimeout(300);
  const start = await zustand(bid);
  const beispiel = await seite.evaluate(() => (Schaltplan.BEISPIELE as any[])[0] as { id: string; hinweis: string });
  const m0 = (await meldungenJetzt()).length;
  const box = await seite.locator('.sp-wrap svg .sp-teil[data-id="E1"]').boundingBox();
  if (!box) throw new Error('E1 nicht gefunden');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await seite.mouse.move(x, y);
  await seite.mouse.down();
  for (let i = 1; i <= 8; i++) await seite.mouse.move(x + 60 * i / 8, y);
  await mitEingabe('.sp-wrap button[data-a="netz"]');
  await mitEingabe(`.menu [data-s="${beispiel.id}"]`);
  const mitte = await zustand(bid);
  const hinweis = (await meldungenJetzt()).slice(m0).filter(t => t === beispiel.hinweis);
  await seite.mouse.up();
  await seite.waitForTimeout(450);
  const nach = await zustand(bid);
  p('Beispiel im Zug: nicht eingesetzt — die Ablage im Zug wie vorher', mitte.json === start.json,
    `${Object.keys(start.teile).length} → ${Object.keys(mitte.teile).length} Teile`);
  p('Beispiel im Zug: und sein Hinweis erscheint nicht (er versprach ein Beispiel, das nicht da ist)', hinweis.length === 0,
    hinweis.join(' | '));
  p('Beispiel im Zug: nach dem Loslassen ist E1 gezogen, und kein Teil kam dazu',
    Object.keys(nach.teile).length === 2 && nach.teile.E1.x !== start.teile.E1.x, JSON.stringify(nach.teile));
}

/* i · Nach einem echten Klick nehmen echte Tasten die Fläche. */
{
  const bid = await oeffne('W');
  await seite.waitForTimeout(300);
  await seite.waitForTimeout(800);           // der Zaun des Seitenverlaufs
  await waehle('T1');
  const fokus = await fokusJetzt();
  await markiere();
  const m0 = (await meldungenJetzt()).length;
  const dreh = async (): Promise<number> => (await zustand(bid)).teile.T1?.drehung ?? -1;
  const folge: string[] = [];
  const schritt = async (k: string, soll: number): Promise<void> => {
    await seite.keyboard.press(k);
    await seite.waitForTimeout(300);
    const d = await dreh();
    const fl = await dieselbeFlaeche();
    if (d !== soll) folge.push(`${k}: T1 ${d}° statt ${soll}°`);
    if (fl.flaechen !== 1 || fl.marke !== 'alt') folge.push(`${k}: die Fläche ist neu gezeichnet (Marke ${fl.marke})`);
  };
  await schritt('r', 90);
  p(`Nach einem echten Klick auf T1 steht der Fokus auf der Fläche (${fokus}), und ein echtes „r" dreht T1`,
    fokus === 'DIV.sp-wrap' && folge.length === 0, folge.join(' | '));
  await schritt('Control+z', 0);
  await schritt('Control+Shift+Z', 90);
  await schritt('Control+z', 0);
  await schritt('Control+y', 90);
  p('… echtes Strg+Z, Umschalt+Strg+Z, Strg+Z, Strg+Y nimmt die Fläche: 0°, 90°, 0°, 90° — dieselbe Fläche',
    folge.length === 0, folge.join(' | '));
  const seitenMeld = (await meldungenJetzt()).slice(m0).filter(t => /rückgängig|wiederhol/i.test(t));
  p('… und der Seitenverlauf hat nichts gemeldet', seitenMeld.length === 0, seitenMeld.join(' | '));
}

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
