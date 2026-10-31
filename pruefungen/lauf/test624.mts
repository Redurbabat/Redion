/* Suite 624 — Die Schaltplanfläche: Vollbild, Zoom, Leiter schieben, nichts
 * übereinander, alles drehen, Schienen selber zeichnen, flüssig, radieren (E759)
 * ============================================================================
 * Redur, 31. Oktober 2026, unter einem Bild der Planfläche („Stromlaufplan,
 * aufgelöst", L1 oben, N unten, G1, E1, E2, S2, S3):
 *
 *   „hier beim schalterzeichen ist es nicht so gut ich kann nicht es volmodu
 *    öfnne zommen, leiterschieben, und alle leiter gehen übereinander es
 *    sollte nicht so sein und ich sollte alles umdrehen können und die l und
 *    n selber zeichnen können dann flüsiger behebe das"
 *
 * und am selben Tag dazu:
 *
 *   „Und für lösche auch verbesser das auch also ich sollte wie beim löschen
 *    von pdf dort auch so haben entweder mir finger oder masud oder stift oder
 *    nur eienzeäne leiter"
 *
 * DIE ZUSAGEN — jede mit ECHTER Eingabe (Maus, Tastatur, CDP-Berührung mit
 * zwei Fingern, CDP-Stift), nie über einen Aufruf in die Fläche:
 *
 *   §0  Alte Pläne sehen aus wie vorher: das SVG der fünf Pläne aus test611
 *       (W, B, P, Q, A) ist Zeichen für Zeichen das vom Stand vor E759
 *       (sha256, abgelesen am Stand ab2567a48, bevor eine Zeile geändert war).
 *   §1  Vollbild: ⛶ im Kopf und die Taste F öffnen die Fläche über den ganzen
 *       Bildschirm; ein sichtbarer Schliessknopf (≥ 44 px) und Escape führen
 *       zurück; Plan und Auswahl bleiben; das Menü „…" liegt im Vollbild
 *       obenauf. Am Telefon (390 × 844) dasselbe.
 *   §2  Zoom und Verschieben: + / − / „Alles zeigen" und die Prozentzahl;
 *       Strg+Rad zoomt um den Zeiger (der Planpunkt darunter bleibt stehen);
 *       zwei Finger ziehen auseinander (zoomt) und gemeinsam (verschiebt); die
 *       mittlere Maustaste und Leertaste+Ziehen verschieben; das Rad
 *       verschiebt, wenn gezoomt ist. Bei 200 % trifft ein Klick das Teil,
 *       ein Zug um 40 Planeinheiten setzt es um genau 40, und eine gezogene
 *       Leitung bindet genau die zwei Klemmen.
 *   §3  Leiter schieben: eine gewählte Leitung an einer Strecke quer ziehen —
 *       rechtwinklig, beide Enden auf ihren Klemmen, die Netzliste gleich;
 *       auf eine fremde Leitung lässt sie sich nicht ziehen; die Endstrecke
 *       bekommt einen Stich; ein Strg+Z gibt den Plan Byte für Byte zurück.
 *   §4  Nichts übereinander: im nachgebauten Plan aus Redurs Bild, mit der
 *       Maus gezeichnet, liegt keine Strecke auf einer anderen Leitung, und
 *       eine Leitung von S2:4 nach E2:X2 fasst genau diese zwei Klemmen (der
 *       erste Winkel lief über S3:4 und E2:X1). Eine Kreuzung ohne Verbindung
 *       hat keinen Punkt. Die eingebauten Beispiele haben keine Überlappung.
 *   §5  Alles drehen: eine Auswahl aus Teilen, Leitungen und Text dreht als
 *       GRUPPE um ihre Mitte (jeder Abstand um 90° gedreht), spiegelt als
 *       Gruppe, die Netzliste bleibt, ein Strg+Z genügt; ein einzelnes Teil
 *       dreht wie bisher an Ort und Stelle; „Ganzen Plan drehen" tauscht
 *       Breite und Höhe und behält die Netzliste.
 *   §6  L und N selber zeichnen: das Werkzeug „Schiene" zieht L1 und N als
 *       gerade Linien mit Beschriftung; Teile hängen daran wie an den
 *       erzeugten Schienen — die Simulation lässt E1 leuchten; `lesen`
 *       behält die Art der Schiene.
 *   §7  Flüssig: beim Ziehen eines Teils, einer Strecke und beim Zoomen wird
 *       das SVG nicht neu gebaut (kein neuer `svg.sp-flaeche` zwischen der
 *       ersten Bewegung und dem Loslassen).
 *   §8  Radieren wie im PDF: über die Fläche wischen löscht, was der Kreis
 *       berührt — mit Maus, Finger und Stift; „Nur Leiter" löscht nie ein
 *       Teil; ein Tipp löscht eine einzelne Leitung; ein Wisch ist EIN
 *       Rückgängig-Schritt; der Kreis und das Berührte sind beim Wischen zu
 *       sehen; die Netzliste der übrigen Leitungen bleibt.
 *   §9  Ruhe: keine Seitenfehler.
 *
 * Kein Port: geladen wird über file:// — test400 zählt nichts Neues.
 *
 *   node pruefungen/lauf/test624.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, CDPSession, BrowserContext } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Schaltplan: any;
declare const Stromfluss: any; declare const Register: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const ADRESSE = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));
const nahe = (a: number, b: number, d: number): boolean => Math.abs(a - b) <= d;
const abschnitt = (s: string): void => console.log('\n' + s);
const warte = (ms: number) => new Promise(f => setTimeout(f, ms));

/* Die Pläne aus test611, Wort für Wort (W, B, P, Q, A), dazu L (zwei Lampen,
   eine Leitung mit einer Mittelstrecke, eine fremde freie Leitung, ein Text),
   S (Redurs Bild: L1, N, G1, S2, S3, E1, E2 — ohne Leitungen, die zeichnet der
   Lauf mit der Maus) und R (eine Quelle und eine Lampe ohne Schienen). */
const PLAENE = `
  const T = (id, zeichen, x, y, drehung = 0) => ({ id, zeichen, x, y, drehung, gespiegelt: false,
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
    P: { art: 'stromlauf-aufgeloest', breite: 400, hoehe: 400, texte: [], ebenen,
      teile: [T('E1', 'lampe', 100, 100), T('E2', 'lampe', 100, 200)],
      leitungen: [L('p1', [[130, 160], [300, 160]], 'E1', 'X2')] },
    Q: { art: 'stromlauf-aufgeloest', breite: 400, hoehe: 400, texte: [], ebenen,
      teile: [T('E1', 'lampe', 220, 50), T('E2', 'lampe', 220, 300), T('R1', 'widerstand', 200, 200)],
      leitungen: [L('q', [[250, 110], [250, 300]], 'E1', 'X2', 'E2', 'X1')] },
    A: { art: 'stromlauf-aufgeloest', breite: 1100, hoehe: 700, texte: [], ebenen,
      teile: [T('G1', 'wechselspannung', 100, 200),
              T('X1', 'stecker', 300, 100), T('X2', 'stecker', 500, 100),
              T('X3', 'steckdose', 300, 400), T('X4', 'steckdose', 500, 400),
              T('X5', 'steckdose-schuko', 700, 400), T('X6', 'steckdose-schuko', 900, 400),
              T('R9', 'widerstand', 1000, 100), T('R8', 'widerstand', 660, 270, 90),
              T('E8', 'lampe', 820, 180), T('E9', 'lampe', 920, 180)],
      leitungen: [
        L('a1', [[130, 200], [130, 60], [320, 60], [320, 100]], 'G1', 'L', 'X1', '1'),
        L('a2', [[130, 260], [60, 260], [60, 40], [600, 40], [600, 100], [520, 100]], 'G1', 'N', 'X2', '1'),
        L('a3', [[130, 200], [330, 200], [330, 400]], 'G1', 'L', 'X3', 'L'),
        L('a4', [[130, 260], [130, 500], [620, 500], [620, 400], [530, 400]], 'G1', 'N', 'X4', 'L'),
        L('a5', [[130, 150], [730, 150], [730, 400]], null, null, 'X5', 'L'),
        L('a6', [[130, 260], [130, 560], [1000, 560], [1000, 400], [930, 400]], 'G1', 'N', 'X6', 'L'),
        L('z1', [[850, 240], [850, 280], [950, 280], [950, 240]], 'E8', 'X2', 'E9', 'X2')
      ] },
    L: { art: 'stromlauf-aufgeloest', breite: 600, hoehe: 400, ebenen,
      texte: [{ id: 'tx', x: 200, y: 330, t: 'Probe', ebene: 'plan' }],
      teile: [T('E1', 'lampe', 100, 100), T('E2', 'lampe', 300, 100)],
      leitungen: [
        L('k1', [[130, 160], [130, 220], [330, 220], [330, 160]], 'E1', 'X2', 'E2', 'X2'),
        L('k3', [[100, 280], [400, 280]])
      ] },
    S: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 700, ebenen,
      texte: [{ id: 'tL', x: 64, y: 32, t: 'L1', ebene: 'plan' }, { id: 'tN', x: 64, y: 652, t: 'N', ebene: 'plan' }],
      teile: [T('G1', 'wechselspannung', 20, 320), T('S2', 'ch-schema0', 180, 140),
              T('E1', 'lampe', 170, 320), T('S3', 'ch-schema0', 480, 140), T('E2', 'lampe', 470, 320)],
      leitungen: [
        L('nL', [[50, 320], [50, 40], [780, 40]], 'G1', 'L'),
        L('nN', [[50, 380], [50, 660], [780, 660]], 'G1', 'N')
      ] },
    R: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 700, ebenen, texte: [], leitungen: [],
      teile: [T('G1', 'wechselspannung', 60, 300), T('E1', 'lampe', 400, 300)] }
  };`;

/* §0: das SVG der alten Pläne, abgelesen am Stand vor E759. */
const SVG_VORHER: Record<string, string> = {
  W: '0aa92759b26b0f8614aba5ec', B: 'b4b765ca491282f3fb0f1ac5', P: 'b0df59f093ce7bba9d845d76',
  Q: '413bf94c2655ba2cab7d5d1b', A: '88cb56a380f96add456f6361'
};

const browser = await chromium.launch();
const fehler: string[] = [];

type Auf = { ctx: BrowserContext; s: Page; cdp: CDPSession };
/* Zuerst die Windows-App (Redur, 31. Oktober): Electron lädt dieselbe Seite
   in einem Fenster von 1300 × 860 (mindestens 860 breit) — Maus, Rad,
   Trackpad, Tastatur, keine Berührung. Der Rechner hier ist deshalb ohne
   `hasTouch`; Finger fährt ein eigener Kontext. */
const aufmachen = async (o: { handy?: boolean; touch?: boolean; dunkel?: boolean; breite?: number; hoehe?: number } = {}): Promise<Auf> => {
  const ctx = await browser.newContext({
    viewport: o.handy ? { width: 390, height: 844 } : { width: o.breite ?? 1440, height: o.hoehe ?? 900 },
    hasTouch: !!(o.handy || o.touch), isMobile: !!o.handy, colorScheme: o.dunkel ? 'dark' : 'light'
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await s.goto(ADRESSE);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Stromfluss !== 'undefined'
    && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
  await s.waitForTimeout(1200);
  await s.evaluate((quelle: string) => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 1e9);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
    const w = window as any;
    // eslint-disable-next-line no-new-func
    w.plaene = new Function(quelle);
    /** Die Netzliste als sortierte Teilung: Klemmen und Leitungen je Netz. */
    w.teilung = (plan: any): string[] => {
      const ni = Stromfluss.netze(plan);
      const g = new Map<number, Set<string>>();
      const dazu = (n: number, name: string) => { if (!g.has(n)) g.set(n, new Set()); g.get(n)!.add(name); };
      (ni.klemmen as any[]).forEach(k => { if (!k.intern) dazu(ni.netzVon.get(k.schluessel), k.teil + ':' + k.nr); });
      Object.keys(ni.leitungNetz).forEach(id => dazu(ni.leitungNetz[id], 'l:' + id));
      return [...g.values()].map(x => [...x].sort().join(' ')).sort();
    };
    /** Welche Klemmen fasst eine Leitung allein? (die Netzliste sagt es) */
    w.klemmenDer = (plan: any, lid: string): string[] => {
      const l = (plan.leitungen as any[]).find(x => x.id === lid);
      if (!l) return [];
      const ni = Stromfluss.netze({ ...plan, leitungen: [l] });
      const netz = ni.leitungNetz[l.id];
      const raus = new Set<string>();
      (ni.klemmen as any[]).forEach(k => {
        if (!k.intern && ni.netzVon.get(k.schluessel) === netz) raus.add(k.teil + ':' + k.nr);
      });
      return [...raus].sort();
    };
    /** Strecken zweier verschiedener Leitungen, die aufeinander liegen. */
    w.ueberlappungen = (plan: any): string[] => {
      const st: Array<{ id: string; a: any; b: any }> = [];
      (plan.leitungen as any[]).forEach(l => {
        for (let i = 0; i + 1 < l.punkte.length; i++) st.push({ id: l.id, a: l.punkte[i], b: l.punkte[i + 1] });
      });
      const raus: string[] = [];
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
        const s = st[i]!, t = st[j]!;
        if (s.id === t.id) continue;
        if (s.a.y === s.b.y && t.a.y === t.b.y && s.a.y === t.a.y) {
          const lo = Math.max(Math.min(s.a.x, s.b.x), Math.min(t.a.x, t.b.x));
          const hi = Math.min(Math.max(s.a.x, s.b.x), Math.max(t.a.x, t.b.x));
          if (hi - lo > 0) raus.push(s.id + '|' + t.id + ' y=' + s.a.y);
        } else if (s.a.x === s.b.x && t.a.x === t.b.x && s.a.x === t.a.x) {
          const lo = Math.max(Math.min(s.a.y, s.b.y), Math.min(t.a.y, t.b.y));
          const hi = Math.min(Math.max(s.a.y, s.b.y), Math.max(t.a.y, t.b.y));
          if (hi - lo > 0) raus.push(s.id + '|' + t.id + ' x=' + s.a.x);
        }
      }
      return raus;
    };
    w.sha = async (t: string): Promise<string> => {
      const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
      return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
    };
  }, PLAENE);
  if (o.dunkel) await s.evaluate(() => App.theme('dark'));
  const cdp = await ctx.newCDPSession(s);
  return { ctx, s, cdp };
};

const oeffne = async (s: Page, wer: string): Promise<string> => {
  const id = await s.evaluate(async (w2: string) => {
    const plan = (window as any).plaene()[w2];
    const seite = Store.addPage(null, { text: 'Plan ' + w2 });
    const b = Store.addBlock(seite.id, 'schaltplan', { text: 'Plan ' + w2, plan });
    await Store.flush();
    App.zeichneBaum(); App.oeffne(seite.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
    return b.id;
  }, wer);
  await s.waitForSelector('.sp-wrap .sp-teil');
  await s.locator('.sp-wrap svg.sp-flaeche').last().scrollIntoViewIfNeeded();
  await s.waitForTimeout(200);
  return id;
};
const plan = (s: Page, bid: string): Promise<any> => s.evaluate((b: string) => Store.getBlock(b).plan, bid);
/** Der Plan als Text mit sortierten Schlüsseln — „Byte für Byte" heisst hier:
    dieselben Felder mit denselben Werten. Die Reihenfolge der Schlüssel ist
    keine Information (der Block hält den Plan so, wie der Lauf ihn angelegt
    hat; nach einer Änderung so, wie `lesen` ihn schreibt). */
const normal = (x: any): string => JSON.stringify(x, (_k, v) =>
  v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const planText = async (s: Page, bid: string): Promise<string> => normal(await plan(s, bid));
const teilung = (s: Page, bid: string): Promise<string[]> =>
  s.evaluate((b: string) => (window as any).teilung(Store.getBlock(b).plan), bid);
/** Planpunkt → Bildschirmpunkt, über die Matrix des SVG (gilt bei jedem Zoom). */
const bild = async (s: Page, x: number, y: number): Promise<[number, number]> =>
  s.evaluate(([px, py]: [number, number]) => {
    const svg = [...document.querySelectorAll<SVGSVGElement>('.sp-wrap svg.sp-flaeche')].pop()!;
    const m = svg.getScreenCTM()!;
    const q = new DOMPoint(px, py).matrixTransform(m);
    return [q.x, q.y] as [number, number];
  }, [x, y] as [number, number]);
/** Bildschirmpunkt → Planpunkt. */
const planpunkt = async (s: Page, x: number, y: number): Promise<[number, number]> =>
  s.evaluate(([px, py]: [number, number]) => {
    const svg = [...document.querySelectorAll<SVGSVGElement>('.sp-wrap svg.sp-flaeche')].pop()!;
    const q = new DOMPoint(px, py).matrixTransform(svg.getScreenCTM()!.inverse());
    return [q.x, q.y] as [number, number];
  }, [x, y] as [number, number]);
const massstab = (s: Page): Promise<number> => s.evaluate(() => {
  const svg = [...document.querySelectorAll<SVGSVGElement>('.sp-wrap svg.sp-flaeche')].pop()!;
  return svg.getScreenCTM()!.a;
});
const klemme = (s: Page, bid: string, tid: string, nr: string): Promise<{ x: number; y: number }> =>
  s.evaluate(([b, t, n]: string[]) => {
    const pl = Store.getBlock(b!).plan;
    return Schaltplan.anschlussOrt((pl.teile as any[]).find(x => x.id === t), n);
  }, [bid, tid, nr]);
const klick = async (s: Page, sel: string): Promise<boolean> => {
  const l = s.locator(sel).last();
  if (!(await l.count())) return false;
  try { await l.click({ timeout: 2000 }); } catch { return false; }
  await s.waitForTimeout(150);
  return true;
};
/** Mit der Maus von Planpunkt zu Planpunkt ziehen, in Schritten. */
const zieheMaus = async (s: Page, von: [number, number], nach: [number, number], schritte = 8,
                         knopf: 'left' | 'middle' = 'left', vorLoslassen?: () => Promise<void>): Promise<void> => {
  const [x0, y0] = await bild(s, von[0], von[1]);
  const [x1, y1] = await bild(s, nach[0], nach[1]);
  await s.mouse.move(x0, y0);
  await s.mouse.down({ button: knopf });
  for (let i = 1; i <= schritte; i++) await s.mouse.move(x0 + (x1 - x0) * i / schritte, y0 + (y1 - y0) * i / schritte);
  if (vorLoslassen) await vorLoslassen();
  await s.mouse.up({ button: knopf });
  await s.waitForTimeout(450);
};
const finger = (cdp: CDPSession, typ: 'touchStart' | 'touchMove' | 'touchEnd', pkte: Array<[number, number]>) =>
  cdp.send('Input.dispatchTouchEvent', {
    type: typ, touchPoints: typ === 'touchEnd' ? [] : pkte.map(([x, y], i) => ({ x, y, id: i + 1 }))
  });
const stift = (cdp: CDPSession, typ: 'mousePressed' | 'mouseMoved' | 'mouseReleased', x: number, y: number) =>
  cdp.send('Input.dispatchMouseEvent', {
    type: typ, x, y, pointerType: 'pen', button: typ === 'mouseMoved' ? 'none' : 'left',
    buttons: typ === 'mouseReleased' ? 0 : 1, clickCount: typ === 'mouseMoved' ? 0 : 1, force: 0.5
  });
const taste = async (s: Page, k: string): Promise<void> => { await s.keyboard.press(k); await s.waitForTimeout(250); };
/** Ein Teil anklicken, mitten in seinem Kasten; danach kein Doppeltipp. */
const waehle = async (s: Page, tid: string): Promise<void> => {
  const box = await s.locator(`.sp-wrap svg .sp-teil[data-id="${tid}"]`).last().boundingBox();
  if (!box) throw new Error('Teil fehlt: ' + tid);
  await s.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await s.waitForTimeout(450);
};
const svgZaehler = async (s: Page): Promise<void> => s.evaluate(() => {
  const w = window as any;
  w.neueSvg = 0;
  w.svgBeobachter?.disconnect();
  w.svgBeobachter = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n instanceof SVGSVGElement || (n instanceof Element && n.querySelector('svg.sp-flaeche'))) w.neueSvg++;
  })));
  w.svgBeobachter.observe(document.querySelector('.sp-wrap')!, { childList: true, subtree: true });
});
const neueSvg = (s: Page): Promise<number> => s.evaluate(() => (window as any).neueSvg as number);

/* ==========================================================================
 * §0 Alte Pläne sehen aus wie vorher
 * ========================================================================*/
const A1 = await aufmachen();
const T = await aufmachen({ touch: true });
{
  const s = A1.s;
  abschnitt('§0 Alte Pläne sehen aus wie vorher (SVG Zeichen für Zeichen)');
  const hashes = await s.evaluate(async () => {
    const w = window as any;
    const raus: Record<string, string> = {};
    for (const k of ['W', 'B', 'P', 'Q', 'A']) {
      const pl = Schaltplan.lesen({ plan: w.plaene()[k] });
      raus[k] = await w.sha(Schaltplan.alsSvg(pl, { raster: true, anschluesse: true, auswahl: new Set() }));
    }
    return raus;
  });
  for (const k of Object.keys(SVG_VORHER)) gleich(`§0 Plan ${k}: das SVG ist das von vorher`, hashes[k], SVG_VORHER[k]);
}

/* ==========================================================================
 * §1 Vollbild
 * ========================================================================*/
{
  const s = A1.s;
  abschnitt('§1 Vollbild am Rechner (1440 × 900)');
  const bid = await oeffne(s, 'L');
  const vorher = await planText(s, bid);
  await waehle(s, 'E1');
  p('§1a im Kopf steht ein Knopf „Vollbild"', await s.locator('.sp-kopf [data-a="vollbild"]').count() > 0);
  await klick(s, '.sp-kopf [data-a="vollbild"]');
  await s.waitForTimeout(400);
  const r = await s.evaluate(() => {
    const w = [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!;
    const b = w.getBoundingClientRect();
    const zu = w.querySelector<HTMLElement>('[data-a="vollbild-zu"]');
    const zb = zu ? zu.getBoundingClientRect() : null;
    const svg = w.querySelector('svg.sp-flaeche')!.getBoundingClientRect();
    return { voll: w.classList.contains('sp-voll'), l: b.left, t: b.top, r: b.right, u: b.bottom,
             iw: innerWidth, ih: innerHeight, zu: zb ? { w: zb.width, h: zb.height, sichtbar: zb.width > 0 } : null,
             oben: zb ? document.elementFromPoint(zb.left + zb.width / 2, zb.top + zb.height / 2)?.closest('[data-a="vollbild-zu"]') === zu : false,
             flaeche: svg.width * svg.height, gewaehlt: !!w.querySelector('.sp-teil.sp-gewaehlt[data-id="E1"]') };
  });
  p('§1b die Fläche deckt den ganzen Bildschirm', r.voll && nahe(r.l, 0, 1) && nahe(r.t, 0, 1) && nahe(r.r, r.iw, 1) && nahe(r.u, r.ih, 1),
    JSON.stringify(r));
  p('§1c ein sichtbarer Schliessknopf, mindestens 44 × 44, obenauf', !!r.zu && r.zu.w >= 44 && r.zu.h >= 44 && r.oben, JSON.stringify(r.zu));
  p('§1d die Zeichnung wird grösser (mehr als die halbe Fläche des Bildschirms)', r.flaeche > 0.5 * r.iw * r.ih * 0.5, String(r.flaeche));
  p('§1e die Auswahl bleibt', r.gewaehlt);
  /* Das Menü „…" liegt im Vollbild obenauf. */
  await klick(s, '.sp-kopf [data-a="mehr"]');
  const menue = await s.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    if (!m) return false;
    const b = m.getBoundingClientRect();
    return document.elementFromPoint(b.left + b.width / 2, b.top + 12)?.closest('.menu') === m;
  });
  p('§1f das Menü „…" liegt im Vollbild obenauf', menue);
  await s.keyboard.press('Escape'); await s.waitForTimeout(250);
  /* Escape: erst die Auswahl, dann das Vollbild. */
  await s.mouse.click(5, 450); await s.waitForTimeout(100);
  await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
  await taste(s, 'Escape'); await taste(s, 'Escape');
  const zu1 = await s.evaluate(() => [...document.querySelectorAll('.sp-wrap')].pop()!.classList.contains('sp-voll'));
  p('§1g Escape führt zurück', !zu1);
  /* Die Taste F öffnet, der Schliessknopf schliesst. */
  await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
  await taste(s, 'f');
  const auf2 = await s.evaluate(() => [...document.querySelectorAll('.sp-wrap')].pop()!.classList.contains('sp-voll'));
  p('§1h die Taste F öffnet das Vollbild', auf2);
  await klick(s, '.sp-wrap [data-a="vollbild-zu"]');
  await s.waitForTimeout(300);
  const zu2 = await s.evaluate(() => [...document.querySelectorAll('.sp-wrap')].pop()!.classList.contains('sp-voll'));
  p('§1i der Schliessknopf führt zurück', !zu2);
  gleich('§1j der Plan ist unverändert', await planText(s, bid), vorher);
}
{
  abschnitt('§1 Vollbild am Telefon (390 × 844)');
  const H = await aufmachen({ handy: true });
  const s = H.s;
  await oeffne(s, 'L');
  await s.locator('.sp-kopf [data-a="vollbild"]').last().scrollIntoViewIfNeeded().catch(() => {});
  await klick(s, '.sp-kopf [data-a="vollbild"]');
  await s.waitForTimeout(400);
  const r = await s.evaluate(() => {
    const w = [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!;
    const b = w.getBoundingClientRect();
    const zu = w.querySelector<HTMLElement>('[data-a="vollbild-zu"]');
    const zb = zu?.getBoundingClientRect();
    const knoepfe = [...w.querySelectorAll<HTMLElement>('.sp-zoom button')].map(x => x.getBoundingClientRect())
      .map(x => Math.min(x.width, x.height));
    return { voll: w.classList.contains('sp-voll'), l: b.left, t: b.top, r: b.right, u: b.bottom, iw: innerWidth, ih: innerHeight,
             zu: zb ? Math.min(zb.width, zb.height) : 0,
             oben: zb ? document.elementFromPoint(zb.left + zb.width / 2, zb.top + zb.height / 2)?.closest('[data-a="vollbild-zu"]') === zu : false,
             knoepfe };
  });
  p('§1k am Telefon deckt die Fläche den Bildschirm', r.voll && nahe(r.l, 0, 1) && nahe(r.t, 0, 1) && nahe(r.r, r.iw, 1) && nahe(r.u, r.ih, 1), JSON.stringify(r));
  p('§1l am Telefon ist der Schliessknopf ≥ 44 px und obenauf', r.zu >= 44 && r.oben, JSON.stringify(r));
  p('§1m am Telefon sind die Zoomknöpfe ≥ 44 px', r.knoepfe.length >= 3 && r.knoepfe.every(x => x >= 44), JSON.stringify(r.knoepfe));
  await klick(s, '.sp-wrap [data-a="vollbild-zu"]');
  const zu = await s.evaluate(() => [...document.querySelectorAll('.sp-wrap')].pop()!.classList.contains('sp-voll'));
  p('§1n am Telefon führt der Schliessknopf zurück', !zu);
  await H.ctx.close();
}

/* ==========================================================================
 * §2 Zoom und Verschieben
 * ========================================================================*/
{
  const s = A1.s;
  abschnitt('§2 Zoom und Verschieben');
  const bid = await oeffne(s, 'L');
  const m0 = await massstab(s);
  const wert = async () => (await s.locator('.sp-zoomwert').last().textContent().catch(() => '')) || '';
  p('§2a die Prozentzahl steht da und sagt 100 %', /100\s*%/.test(await wert()), await wert());
  await klick(s, '.sp-wrap [data-a="zoom-plus"]');
  const m1 = await massstab(s);
  p('§2b + zoomt hinein', m1 > m0 * 1.1, `${m0} → ${m1}`);
  p('§2c die Prozentzahl folgt', Number((await wert()).replace(/\D/g, '')) > 100, await wert());
  await klick(s, '.sp-wrap [data-a="zoom-minus"]');
  await klick(s, '.sp-wrap [data-a="zoom-minus"]');
  p('§2d − zoomt hinaus', (await massstab(s)) < m0 * 0.95, String(await massstab(s)));
  await klick(s, '.sp-wrap [data-a="zoom-alles"]');
  p('§2e „Alles zeigen" kehrt zum ganzen Plan zurück', nahe(await massstab(s), m0, m0 * 0.02) && /100\s*%/.test(await wert()), await wert());

  /* Strg+Rad um den Zeiger. */
  const [cx, cy] = await bild(s, 300, 200);
  await s.mouse.move(cx, cy);
  await svgZaehler(s);
  const vorPunkt = await planpunkt(s, cx, cy);
  await s.keyboard.down('Control');
  for (let i = 0; i < 4; i++) { await s.mouse.wheel(0, -120); await s.waitForTimeout(40); }
  await s.keyboard.up('Control');
  await s.waitForTimeout(200);
  const m2 = await massstab(s);
  const nachPunkt = await planpunkt(s, cx, cy);
  p('§2f Strg+Rad zoomt hinein', m2 > m0 * 1.3, `${m0} → ${m2}`);
  p('§2g der Planpunkt unter dem Zeiger bleibt stehen', nahe(vorPunkt[0], nachPunkt[0], 1.5) && nahe(vorPunkt[1], nachPunkt[1], 1.5),
    JSON.stringify([vorPunkt, nachPunkt]));
  gleich('§7a beim Zoomen wird das SVG nicht neu gebaut', await neueSvg(s), 0);
  const scrollVor = await s.evaluate(() => (document.querySelector('#page')?.closest('[class*="scroll"], main') as HTMLElement | null)?.scrollTop ?? scrollY);
  /* Das Rad verschiebt, wenn gezoomt ist. */
  const [ex0, ey0] = await bild(s, 300, 200);
  await s.mouse.wheel(0, 100); await s.waitForTimeout(200);
  const [ex1, ey1] = await bild(s, 300, 200);
  p('§2h das Rad verschiebt den gezoomten Plan', nahe(ex0, ex1, 2) && ey1 < ey0 - 40, JSON.stringify([ex0, ey0, ex1, ey1]));
  void scrollVor;
  /* Mittlere Maustaste. */
  const vorTeile = JSON.stringify((await plan(s, bid)).teile);
  const [mx0, my0] = await bild(s, 300, 200);
  await zieheMaus(s, await planpunkt(s, mx0, my0), await planpunkt(s, mx0 + 100, my0 + 30), 6, 'middle');
  const [mx1, my1] = await bild(s, 300, 200);
  p('§2i die mittlere Maustaste verschiebt', nahe(mx1 - mx0, 100, 6) && nahe(my1 - my0, 30, 6), JSON.stringify([mx1 - mx0, my1 - my0]));
  gleich('§2j … und bewegt kein Teil', JSON.stringify((await plan(s, bid)).teile), vorTeile);
  /* Leertaste + Ziehen auf leerer Fläche. */
  await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
  const [lx0, ly0] = await bild(s, 300, 200);
  await s.keyboard.down(' ');
  const leer = await planpunkt(s, lx0, ly0 - 0);
  await zieheMaus(s, [leer[0] + 150, leer[1] - 30], [leer[0] + 150 + 60 / m2, leer[1] - 30 + 40 / m2], 6);
  await s.keyboard.up(' ');
  const [lx1, ly1] = await bild(s, 300, 200);
  p('§2k Leertaste + Ziehen verschiebt', nahe(lx1 - lx0, 60, 8) && nahe(ly1 - ly0, 40, 8), JSON.stringify([lx1 - lx0, ly1 - ly0]));
  const auswahlNachLeer = await s.locator('.sp-wrap .sp-gewaehlt').count();
  gleich('§2l … und zieht keinen Rahmen auf', auswahlNachLeer, 0);

  /* Zwei Finger: auseinander zoomt, gemeinsam verschiebt — in einem
     Kontext mit Berührung (ein Rechner mit Bildschirm zum Anfassen). */
  {
  const s = T.s, cdp = T.cdp;
  const bid = await oeffne(s, 'L');
  const vorTeile = JSON.stringify((await plan(s, bid)).teile);
  const [fx, fy] = await bild(s, 300, 200);
  const z0 = await massstab(s);
  await finger(cdp, 'touchStart', [[fx - 40, fy], [fx + 40, fy]]);
  for (let i = 1; i <= 8; i++) { await finger(cdp, 'touchMove', [[fx - 40 - i * 10, fy], [fx + 40 + i * 10, fy]]); await warte(16); }
  await finger(cdp, 'touchEnd', []);
  await s.waitForTimeout(250);
  const z1 = await massstab(s);
  p('§2m zwei Finger auseinander zoomen hinein', z1 > z0 * 1.6, `${z0} → ${z1}`);
  gleich('§2n … und bewegen kein Teil', JSON.stringify((await plan(s, bid)).teile), vorTeile);
  const [gx0, gy0] = await bild(s, 300, 200);
  await finger(cdp, 'touchStart', [[gx0 - 50, gy0], [gx0 + 50, gy0]]);
  for (let i = 1; i <= 8; i++) { await finger(cdp, 'touchMove', [[gx0 - 50 + i * 10, gy0 + i * 5], [gx0 + 50 + i * 10, gy0 + i * 5]]); await warte(16); }
  await finger(cdp, 'touchEnd', []);
  await s.waitForTimeout(250);
  const [gx1, gy1] = await bild(s, 300, 200);
  p('§2o zwei Finger gemeinsam verschieben', nahe(gx1 - gx0, 80, 8) && nahe(gy1 - gy0, 40, 8), JSON.stringify([gx1 - gx0, gy1 - gy0]));
  }

  /* Bei 200 % trifft alles genau. */
  await klick(s, '.sp-wrap [data-a="zoom-alles"]');
  await klick(s, '.sp-wrap [data-a="zoom-plus"]'); await klick(s, '.sp-wrap [data-a="zoom-plus"]');
  await klick(s, '.sp-wrap [data-a="zoom-plus"]');
  const zm = (await massstab(s)) / m0;
  p('§2p nach dreimal + ist der Plan mindestens doppelt so gross', zm >= 1.9, String(zm));
  /* E1 liegt bei (100,100)–(160,160); seine Mitte muss im Bild sein. */
  const [e1x, e1y] = await bild(s, 130, 130);
  const imBild = await s.evaluate(([x, y]: [number, number]) =>
    document.elementFromPoint(x, y)?.closest('.sp-teil')?.getAttribute('data-id') ?? '', [e1x, e1y] as [number, number]);
  if (imBild !== 'E1') {
    /* Falls nicht im Bild: mit „Alles zeigen" zurück und um E1 zoomen. */
    await klick(s, '.sp-wrap [data-a="zoom-alles"]');
    const [qx, qy] = await bild(s, 130, 130);
    await s.mouse.move(qx, qy);
    await s.keyboard.down('Control');
    for (let i = 0; i < 4; i++) { await s.mouse.wheel(0, -120); await s.waitForTimeout(40); }
    await s.keyboard.up('Control');
  }
  const [hx, hy] = await bild(s, 130, 130);
  await s.mouse.click(hx, hy); await s.waitForTimeout(450);
  p('§2q bei Zoom trifft ein Klick das Teil', await s.locator('.sp-wrap .sp-teil.sp-gewaehlt[data-id="E1"]').count() > 0);
  const e1vor = (await plan(s, bid)).teile.find((t: any) => t.id === 'E1');
  await svgZaehler(s);
  await zieheMaus(s, [130, 130], [170, 130], 10, 'left', async () => {
    gleich('§7b beim Ziehen eines Teils wird das SVG nicht neu gebaut', await neueSvg(s), 0);
  });
  const e1nach = (await plan(s, bid)).teile.find((t: any) => t.id === 'E1');
  gleich('§2r bei Zoom setzt ein Zug um 40 Planeinheiten das Teil um genau 40', [e1nach.x - e1vor.x, e1nach.y - e1vor.y], [40, 0]);
  /* Leitung ziehen bei Zoom: von E1:X1 nach E2:X1 (E2 liegt bei 300,100). */
  await klick(s, '.sp-wrap [data-a="zoom-alles"]');
  await klick(s, '.sp-kopf [data-wz="leitung"]');
  const k1 = await klemme(s, bid, 'E1', 'X1');
  const k2 = await klemme(s, bid, 'E2', 'X1');
  await klick(s, '.sp-wrap [data-a="zoom-plus"]');
  await zieheMaus(s, [k1.x, k1.y], [k2.x + 3, k2.y + 2], 10);
  const neu = (await plan(s, bid)).leitungen.find((l: any) => !['k1', 'k3'].includes(l.id));
  gleich('§2s bei Zoom bindet eine gezogene Leitung genau die zwei Klemmen',
    neu ? [neu.vonTeil, neu.vonNr, neu.nachTeil, neu.nachNr] : null, ['E1', 'X1', 'E2', 'X1']);
  await klick(s, '.sp-kopf [data-wz="zeigen"]');
  await klick(s, '.sp-wrap [data-a="zoom-alles"]');
}

/* ==========================================================================
 * §3 Leiter schieben
 * ========================================================================*/
{
  const s = A1.s;
  abschnitt('§3 Leiter schieben');
  const bid = await oeffne(s, 'L');
  const vorJson = await planText(s, bid);
  const vorNetz = await teilung(s, bid);
  /* Die Mittelstrecke von k1 (y = 220) anklicken und 40 nach unten ziehen. */
  await s.mouse.click(...(await bild(s, 230, 220))); await s.waitForTimeout(450);
  p('§3a ein Klick auf die Strecke wählt die Leitung', await s.locator('.sp-wrap .sp-leitung.sp-gewaehlt[data-id="k1"]').count() > 0);
  await svgZaehler(s);
  await zieheMaus(s, [230, 220], [230, 260], 8, 'left', async () => {
    gleich('§7c beim Ziehen einer Strecke wird das SVG nicht neu gebaut', await neueSvg(s), 0);
  });
  const k1 = (await plan(s, bid)).leitungen.find((l: any) => l.id === 'k1');
  gleich('§3b die Strecke liegt 40 tiefer, die Enden bleiben', k1.punkte, [{ x: 130, y: 160 }, { x: 130, y: 260 }, { x: 330, y: 260 }, { x: 330, y: 160 }]);
  gleich('§3c die Netzliste ist dieselbe', await teilung(s, bid), vorNetz);
  /* Auf k3 (y = 280) darf sie nicht: das wäre eine neue Verbindung. */
  await zieheMaus(s, [230, 260], [230, 280], 4);
  const k1b = (await plan(s, bid)).leitungen.find((l: any) => l.id === 'k1');
  p('§3d auf eine fremde Leitung lässt sie sich nicht ziehen', !k1b.punkte.some((q: any) => q.y === 280), JSON.stringify(k1b.punkte));
  gleich('§3e … die Netzliste bleibt', await teilung(s, bid), vorNetz);
  /* Die Endstrecke (senkrecht bei x = 130) quer ziehen: ein Stich hält das Ende. */
  await zieheMaus(s, [130, 200], [160, 200], 6);
  const k1c = (await plan(s, bid)).leitungen.find((l: any) => l.id === 'k1');
  const rechtwinklig = k1c.punkte.every((q: any, i: number) => i === 0 || q.x === k1c.punkte[i - 1].x || q.y === k1c.punkte[i - 1].y);
  p('§3f die Endstrecke wandert, das Ende bleibt auf E1:X2', k1c.punkte[0].x === 130 && k1c.punkte[0].y === 160
    && k1c.punkte.some((q: any) => q.x === 160) && rechtwinklig, JSON.stringify(k1c.punkte));
  gleich('§3g … die Netzliste bleibt', await teilung(s, bid), vorNetz);
  /* Rückgängig: drei Züge, drei Schritte. */
  await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
  await taste(s, 'Control+z'); await taste(s, 'Control+z'); await taste(s, 'Control+z');
  gleich('§3h Strg+Z gibt den Plan Byte für Byte zurück', await planText(s, bid), vorJson);
}

/* ==========================================================================
 * §4 Nichts übereinander
 * ========================================================================*/
{
  const s = A1.s;
  abschnitt('§4 Nichts übereinander — Redurs Plan, mit der Maus gezeichnet');
  const bid = await oeffne(s, 'S');
  await klick(s, '.sp-kopf [data-wz="leitung"]');
  /* Wie man zeichnet: von der Klemme zur Schiene, von Klemme zu Klemme. */
  const zuege: Array<[[number, number], [number, number]]> = [
    [[200, 140], [260, 40]],   // S2:3 → L1
    [[200, 200], [200, 320]],  // S2:4 → E1:X1
    [[200, 380], [120, 660]],  // E1:X2 → N
    [[500, 140], [440, 40]],   // S3:3 → L1
    [[500, 200], [500, 320]],  // S3:4 → E2:X1
    [[500, 380], [560, 660]]   // E2:X2 → N
  ];
  for (const [a, b] of zuege) await zieheMaus(s, a, b, 8);
  const ueber = await s.evaluate((b: string) => (window as any).ueberlappungen(Store.getBlock(b).plan), bid);
  gleich('§4a keine Strecke liegt auf einer anderen Leitung', ueber, []);
  const pl = await plan(s, bid);
  p('§4b sechs Leitungen gezeichnet', pl.leitungen.length === 8, String(pl.leitungen.length));
  /* Und quer hinüber: S2:4 → E2:X2. Der erste Winkel lief über S3:4 und E2:X1. */
  await zieheMaus(s, [200, 200], [500, 380], 10);
  const pl2 = await plan(s, bid);
  const quer = pl2.leitungen[pl2.leitungen.length - 1];
  const fasst = await s.evaluate(([b, l]: string[]) => (window as any).klemmenDer(Store.getBlock(b!).plan, l), [bid, quer.id]);
  gleich('§4c die Querleitung fasst genau S2:4 und E2:X2', fasst, ['E2:X2', 'S2:4']);
  gleich('§4d … und liegt auf keiner anderen', await s.evaluate((b: string) => (window as any).ueberlappungen(Store.getBlock(b).plan), bid), []);
  /* Kreuzung ohne Verbindung: kein Punkt dort. */
  const knoten = await s.evaluate(() => [...document.querySelectorAll('.sp-wrap svg .sp-knoten')].map(c =>
    c.getAttribute('cx') + ',' + c.getAttribute('cy')));
  const kreuz = await s.evaluate((b: string) => Schaltplan.kreuzungen(Store.getBlock(b).plan).map((q: any) => q.x + ',' + q.y), bid);
  p('§4e an einer Kreuzung ohne Verbindung steht kein Punkt', kreuz.every((k: string) => !knoten.includes(k)), JSON.stringify({ kreuz, knoten }));
  await klick(s, '.sp-kopf [data-wz="zeigen"]');
  /* Die eingebauten Beispiele. */
  const bsp = await s.evaluate(() => {
    const w = window as any;
    return (Schaltplan.BEISPIELE as any[]).map(b => {
      const pl3 = Schaltplan.neuerPlan('stromlauf-aufgeloest');
      Schaltplan.beispielBauen(pl3, b.id);
      return b.id + ':' + w.ueberlappungen(pl3).length;
    });
  });
  p('§4f die eingebauten Beispiele haben keine Überlappung', bsp.every((x: string) => x.endsWith(':0')), JSON.stringify(bsp));
}

/* ==========================================================================
 * §5 Alles drehen
 * ========================================================================*/
{
  const s = A1.s;
  abschnitt('§5 Alles drehen');
  const bid = await oeffne(s, 'L');
  const vorJson = await planText(s, bid);
  const vorNetz = await teilung(s, bid);
  /* Alle Punkte relativ zu E1:X1: Klemmen, Leitungspunkte, der Text. */
  const geometrie = async (): Promise<Array<[number, number]>> => s.evaluate((b: string) => {
    const pl = Store.getBlock(b).plan;
    const ref = Schaltplan.anschlussOrt(pl.teile.find((t: any) => t.id === 'E1'), 'X1');
    const raus: Array<[number, number]> = [];
    ['E1', 'E2'].forEach(id => ['X1', 'X2'].forEach(nr => {
      const o = Schaltplan.anschlussOrt(pl.teile.find((t: any) => t.id === id), nr);
      raus.push([o.x - ref.x, o.y - ref.y]);
    }));
    ['k1', 'k3'].forEach(id => pl.leitungen.find((l: any) => l.id === id).punkte.forEach((q: any) => raus.push([q.x - ref.x, q.y - ref.y])));
    const t = pl.texte.find((x: any) => x.id === 'tx');
    raus.push([t.x - ref.x, t.y - ref.y]);
    return raus;
  }, bid);
  const g0 = await geometrie();
  /* Rahmen um alles mit der Maus. */
  await zieheMaus(s, [60, 60], [480, 360], 8);
  const gew = await s.locator('.sp-wrap .sp-gewaehlt').count();
  p('§5a der Rahmen fasst Teile, Leitungen und den Text', gew >= 5, String(gew));
  await taste(s, 'r');
  const g1 = await geometrie();
  /* Drehen im Uhrzeigersinn: (x, y) → (−y, x). */
  gleich('§5b jeder Abstand ist um 90° gedreht (Teile, Leitungen, Text)', g1, g0.map(([x, y]) => [y === 0 ? 0 : -y, x]));
  gleich('§5c die Netzliste bleibt', await teilung(s, bid), vorNetz);
  const abw = await s.evaluate((b: string) => {
    const pl = Store.getBlock(b).plan;
    const k1 = pl.leitungen.find((l: any) => l.id === 'k1');
    const a = Schaltplan.anschlussOrt(pl.teile.find((t: any) => t.id === 'E1'), 'X2');
    const e = Schaltplan.anschlussOrt(pl.teile.find((t: any) => t.id === 'E2'), 'X2');
    const q0 = k1.punkte[0], q1 = k1.punkte[k1.punkte.length - 1];
    return [q0.x - a.x, q0.y - a.y, q1.x - e.x, q1.y - e.y];
  }, bid);
  gleich('§5d die Enden liegen auf ihren Klemmen', abw, [0, 0, 0, 0]);
  await taste(s, 'h');
  const g2 = await geometrie();
  gleich('§5e Spiegeln als Gruppe: jeder Abstand gespiegelt', g2, g1.map(([x, y]) => [x === 0 ? 0 : -x, y]));
  gleich('§5f die Netzliste bleibt', await teilung(s, bid), vorNetz);
  await taste(s, 'Control+z'); await taste(s, 'Control+z');
  gleich('§5g zwei Strg+Z geben den Plan Byte für Byte zurück', await planText(s, bid), vorJson);
  /* Ein einzelnes Teil dreht an Ort und Stelle, wie bisher. */
  await s.mouse.click(5, 450); await s.waitForTimeout(100);
  await waehle(s, 'E2');
  await taste(s, 'r');
  const e2 = (await plan(s, bid)).teile.find((t: any) => t.id === 'E2');
  gleich('§5h ein einzelnes Teil dreht an Ort und Stelle', [e2.x, e2.y, e2.drehung], [300, 100, 90]);
  await taste(s, 'Control+z');
  /* Den ganzen Plan drehen. */
  await klick(s, '.sp-kopf [data-a="mehr"]');
  const da = await klick(s, '.menu [data-m="plandrehen"]');
  p('§5i „Ganzen Plan drehen" steht im Menü „…"', da);
  await s.waitForTimeout(300);
  const pl = await plan(s, bid);
  gleich('§5j Breite und Höhe sind getauscht', [pl.breite, pl.hoehe], [400, 600]);
  gleich('§5k die Netzliste bleibt', await teilung(s, bid), vorNetz);
  const g3 = await geometrie();
  gleich('§5l jeder Abstand ist um 90° gedreht', g3, g0.map(([x, y]) => [y === 0 ? 0 : -y, x]));
  const drin = await s.evaluate((b: string) => {
    const p2 = Store.getBlock(b).plan;
    const pkte = [...p2.leitungen.flatMap((l: any) => l.punkte), ...p2.texte, ...p2.teile];
    return pkte.every((q: any) => q.x >= 0 && q.y >= 0 && q.x <= p2.breite && q.y <= p2.hoehe);
  }, bid);
  p('§5m alles liegt auf dem gedrehten Blatt', drin);
}

/* ==========================================================================
 * §6 L und N selber zeichnen
 * ========================================================================*/
{
  const s = A1.s;
  abschnitt('§6 L und N selber zeichnen');
  const bid = await oeffne(s, 'R');
  p('§6a das Werkzeug „Schiene" steht im Kopf', await klick(s, '.sp-kopf [data-wz="schiene"]'));
  p('§6b im Fuss steht die Wahl L1 … PE', await s.locator('.sp-fuss [data-schiene]').count() >= 5);
  await klick(s, '.sp-fuss [data-schiene="L1"]');
  await zieheMaus(s, [40, 100], [700, 104], 10);
  await klick(s, '.sp-fuss [data-schiene="N"]');
  await zieheMaus(s, [40, 560], [700, 556], 10);
  const pl = await plan(s, bid);
  const schienen = (pl.leitungen as any[]).filter(l => l.schiene).map(l => [l.schiene, l.punkte]);
  gleich('§6c zwei gerade Schienen, L1 und N', schienen,
    [['L1', [{ x: 40, y: 100 }, { x: 700, y: 100 }]], ['N', [{ x: 40, y: 560 }, { x: 700, y: 560 }]]]);
  p('§6d jede trägt ihre Beschriftung', ['L1', 'N'].every(t => (pl.texte as any[]).some(x => x.t === t)), JSON.stringify(pl.texte));
  /* Die Teile daran hängen, wie an den erzeugten Schienen. */
  await klick(s, '.sp-kopf [data-wz="leitung"]');
  const g = { L: await klemme(s, bid, 'G1', 'L'), N: await klemme(s, bid, 'G1', 'N'),
              X1: await klemme(s, bid, 'E1', 'X1'), X2: await klemme(s, bid, 'E1', 'X2') };
  await zieheMaus(s, [g.L.x, g.L.y], [g.L.x, 100], 6);
  await zieheMaus(s, [g.N.x, g.N.y], [g.N.x, 560], 6);
  await zieheMaus(s, [g.X1.x, g.X1.y], [g.X1.x, 100], 6);
  await zieheMaus(s, [g.X2.x, g.X2.y], [g.X2.x, 560], 6);
  await klick(s, '.sp-kopf [data-wz="zeigen"]');
  const hell = await s.evaluate((b: string) => {
    const e = Stromfluss.rechne(Store.getBlock(b).plan, {}, {});
    return e && e.ok ? (e.werte.E1 ? e.werte.E1.helligkeit : -1) : 'fehler: ' + (e && e.fehler);
  }, bid);
  p('§6e E1 leuchtet an den selbst gezeichneten Schienen', typeof hell === 'number' && hell > 0.5, String(hell));
  const gelesen = await s.evaluate((b: string) =>
    (Schaltplan.lesen(Store.getBlock(b)).leitungen as any[]).filter(l => l.schiene).map(l => l.schiene), bid);
  gleich('§6f `lesen` behält die Art der Schiene', gelesen, ['L1', 'N']);
}

/* ==========================================================================
 * §8 Radieren wie im PDF
 * ========================================================================*/
{
  const s = A1.s, cdp = A1.cdp;
  abschnitt('§8 Radieren — Maus, Finger, Stift, nur Leiter');
  {
  const bid = await oeffne(s, 'L');
  const vorJson = await planText(s, bid);
  await klick(s, '.sp-kopf [data-wz="radieren"]');
  p('§8a im Fuss stehen die Arten „Alles" und „Nur Leiter"',
    await s.locator('.sp-fuss [data-radiermodus="alles"]').count() > 0 && await s.locator('.sp-fuss [data-radiermodus="leiter"]').count() > 0);
  p('§8b und drei Grössen', await s.locator('.sp-fuss [data-radiergroesse]').count() === 3);
  await klick(s, '.sp-fuss [data-radiermodus="leiter"]');
  /* Mit der Maus quer über k1 (y = 220), E2 nicht, k3 (y = 280), und E1 gestreift. */
  let kreis = false, markiert = 0, waehrend = 0;
  await zieheMaus(s, [140, 150], [200, 300], 12, 'left', async () => {
    kreis = await s.locator('.sp-wrap .sp-radierkreis').count() > 0;
    markiert = await s.locator('.sp-wrap .sp-weg').count();
    waehrend = (await plan(s, bid)).leitungen.length;
  });
  const nach1 = await plan(s, bid);
  p('§8c beim Wischen ist der Kreis zu sehen', kreis);
  p('§8d … und das Berührte ist markiert', markiert >= 2, String(markiert));
  p('§8e gelöscht wird erst beim Loslassen', waehrend === 2, String(waehrend));
  gleich('§8f „Nur Leiter": beide Leitungen weg', nach1.leitungen.map((l: any) => l.id), []);
  gleich('§8g … kein Teil gelöscht, auch E1 nicht, das der Kreis streifte', nach1.teile.map((t: any) => t.id), ['E1', 'E2']);
  await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
  await taste(s, 'Control+z');
  gleich('§8h ein Wisch ist EIN Rückgängig-Schritt', await planText(s, bid), vorJson);
  /* Ein Tipp auf k3 löscht nur k3; ein Tipp auf E1 löscht nichts. */
  await s.mouse.click(...(await bild(s, 360, 280))); await s.waitForTimeout(400);
  gleich('§8i ein Tipp löscht eine einzelne Leitung', (await plan(s, bid)).leitungen.map((l: any) => l.id), ['k1']);
  await s.mouse.click(...(await bild(s, 130, 130))); await s.waitForTimeout(400);
  gleich('§8j „Nur Leiter": ein Tipp auf ein Teil löscht nichts', (await plan(s, bid)).teile.map((t: any) => t.id), ['E1', 'E2']);
  const netzVor = await teilung(s, bid);
  void netzVor;
  /* Mit dem Stift über k1. */
  const [sa, sb] = await bild(s, 230, 200), [sc, sd] = await bild(s, 230, 240);
  await stift(cdp, 'mouseMoved', sa, sb);
  await stift(cdp, 'mousePressed', sa, sb);
  for (let i = 1; i <= 6; i++) { await stift(cdp, 'mouseMoved', sa + (sc - sa) * i / 6, sb + (sd - sb) * i / 6); await warte(16); }
  await stift(cdp, 'mouseReleased', sc, sd);
  await s.waitForTimeout(400);
  gleich('§8k mit dem Stift gewischt: k1 weg', (await plan(s, bid)).leitungen.map((l: any) => l.id), []);
  await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
  await taste(s, 'Control+z'); await taste(s, 'Control+z');
  gleich('§8l zurück auf den Anfang', await planText(s, bid), vorJson);
  /* „Alles" mit dem Finger quer durch E2 (300,100)–(360,160) — im Kontext
     mit Berührung. Die Wahl des Radierers ist gemerkt (Store.meta) und gilt
     dort nicht: jeder Kontext ist ein eigenes Profil. */
  }
  {
  const s = T.s, cdp = T.cdp;
  const bid = await oeffne(s, 'L');
  const vorJson = await planText(s, bid);
  await klick(s, '.sp-kopf [data-wz="radieren"]');
  await klick(s, '.sp-fuss [data-radiermodus="alles"]');
  const [fa, fb] = await bild(s, 290, 130), [fc, fd] = await bild(s, 370, 130);
  await finger(cdp, 'touchStart', [[fa, fb]]);
  for (let i = 1; i <= 8; i++) { await finger(cdp, 'touchMove', [[fa + (fc - fa) * i / 8, fb + (fd - fb) * i / 8]]); await warte(16); }
  await finger(cdp, 'touchEnd', []);
  await s.waitForTimeout(400);
  const nach3 = await plan(s, bid);
  gleich('§8m „Alles" mit dem Finger: E2 weg, E1 bleibt', nach3.teile.map((t: any) => t.id), ['E1']);
  gleich('§8n … die Leitungen, die der Kreis nicht berührte, bleiben', nach3.leitungen.map((l: any) => l.id), ['k1', 'k3']);
  await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
  await taste(s, 'Control+z');
  gleich('§8o ein Strg+Z holt E2 zurück', await planText(s, bid), vorJson);
  await klick(s, '.sp-kopf [data-wz="zeigen"]');
  }
}

/* ==========================================================================
 * §10 Die Fenster der Windows-App: 1300 × 860 (Vorgabe) und 860 × 700
 * (die kleinste Breite) — Vollbild, auch ohne die Vollbild-Schnittstelle
 * (die feste Ebene allein), Strg+Rad und ein Treffer bei Zoom.
 * ========================================================================*/
for (const [breite, hoehe] of [[1300, 860], [860, 700]] as Array<[number, number]>) {
  abschnitt(`§10 Fenster ${breite} × ${hoehe}`);
  const F = await aufmachen({ breite, hoehe });
  const s = F.s;
  const bid = await oeffne(s, 'L');
  for (const ohneApi of [false, true]) {
    const wie = ohneApi ? 'ohne Vollbild-Schnittstelle' : 'mit Vollbild-Schnittstelle';
    if (ohneApi) await s.evaluate(() => { (document.documentElement as any).requestFullscreen = undefined; });
    await klick(s, '.sp-kopf [data-a="vollbild"]');
    await s.waitForTimeout(400);
    const r = await s.evaluate(() => {
      const w = [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!;
      const b = w.getBoundingClientRect();
      const zu = w.querySelector<HTMLElement>('[data-a="vollbild-zu"]');
      const zb = zu?.getBoundingClientRect();
      return { voll: w.classList.contains('sp-voll'), l: b.left, t: b.top, r: b.right, u: b.bottom,
               iw: innerWidth, ih: innerHeight, zu: zb ? Math.min(zb.width, zb.height) : 0,
               oben: zb ? document.elementFromPoint(zb.left + zb.width / 2, zb.top + zb.height / 2)?.closest('[data-a="vollbild-zu"]') === zu : false };
    });
    p(`§10a ${breite}: Vollbild ${wie} deckt das Fenster`, r.voll && nahe(r.l, 0, 1) && nahe(r.t, 0, 1) && nahe(r.r, r.iw, 1) && nahe(r.u, r.ih, 1), JSON.stringify(r));
    p(`§10b ${breite}: der Schliessknopf ist da, ≥ 44 px, obenauf`, r.zu >= 44 && r.oben, JSON.stringify(r));
    /* Im Vollbild: Strg+Rad um den Zeiger, dann ein Klick trifft E2. */
    const m0 = await massstab(s);
    const [qx, qy] = await bild(s, 330, 130);
    await s.mouse.move(qx, qy);
    await s.keyboard.down('Control');
    for (let i = 0; i < 3; i++) { await s.mouse.wheel(0, -120); await s.waitForTimeout(40); }
    await s.keyboard.up('Control');
    await s.waitForTimeout(150);
    p(`§10c ${breite}: Strg+Rad zoomt im Vollbild`, (await massstab(s)) > m0 * 1.4, `${m0} → ${await massstab(s)}`);
    const [hx, hy] = await bild(s, 330, 130);
    await s.mouse.click(hx, hy); await s.waitForTimeout(450);
    p(`§10d ${breite}: bei Zoom trifft ein Klick E2`, await s.locator('.sp-wrap .sp-teil.sp-gewaehlt[data-id="E2"]').count() > 0);
    await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!.focus());
    await taste(s, 'Escape'); await taste(s, 'Escape');
    const zu = await s.evaluate(() => [...document.querySelectorAll('.sp-wrap')].pop()!.classList.contains('sp-voll'));
    p(`§10e ${breite}: Escape führt zurück (${wie})`, !zu);
    await klick(s, '.sp-wrap [data-a="zoom-alles"]');
  }
  void bid;
  await F.ctx.close();
}

abschnitt('§9 Ruhe');
gleich('§9 keine Seitenfehler', fehler, []);

await browser.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
