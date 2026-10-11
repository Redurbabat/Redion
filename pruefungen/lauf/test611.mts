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
 *
 * KANN DIESE SUITE ROT WERDEN? (§55.2) Ja — gegen 97d156b03 ist sie rot in
 * §1, §2, §3, §4, §5, §6, §7 und §9; die Zahl steht in E746. Die zwei Gegenproben
 * (wieder alle Leitungen neu führen; die Prüfung gegen das Anzapfen
 * herausnehmen) stehen ebenfalls dort.
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
declare const UI: any;

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
      leitungen: [L('p1', [[130, 160], [300, 160]], 'E1', 'X2')] }
  };`;

/* Welche HEUTIGE Klemme jedes Ende meint. In W ist das der gespeicherte
   Name; in B steht es so in test608 (b4 trägt „N" und meint N2). */
const SOLL_B: Record<string, { von?: [string, string]; nach?: [string, string] }> = {
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

const oeffne = async (welcher: 'W' | 'B' | 'P'): Promise<string> => {
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

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
