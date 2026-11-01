/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/relais-kern.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/bloecke/arten/relais-kern.ts — alte Relais-Dateien lesen (E769)
 * ----------------------------------------------------------------------------
 * Aus Redurs ZIP vom 1. November 2026, getypt (die ZIP trug `@ts-nocheck`)
 * und in den Bereich der Planfläche gelegt (§5 Regel 1: kein Griff über
 * `window` in einen fremden Bereich).
 *
 * WAS ES KANN
 *   · eine .sch des Programms „Relais" lesen: genau 4320 Byte, 270 Felder
 *     zu je vier Int32 (Kennung, Code, a, b) in 9 Zeilen × 30 Spalten;
 *   · die passende .txt lesen: genau 30 Felder `[Text]`, windows-1252;
 *   · daraus einen NEUTRALEN Plan machen — Bauteile auf dem Raster, mit
 *     `legacySpalte`, und die Originalbytes in `relaisLegacy` (E767).
 *
 * WAS ES NICHT BEHAUPTET
 *   Die Verdrahtung des alten Formats ist nicht entschlüsselt: was `a` und
 *   `b` eines Leitungsfelds bedeuten, steht nirgends. Die kurzen Strecken im
 *   neutralen Plan sind Lagehinweise, ohne Bindung an eine Klemme, und
 *   `relaisLegacy.verifiziert` ist `false`, bis ein Mensch die Verdrahtung
 *   geprüft und freigegeben hat. Vorher startet die Simulation nicht.
 *
 * Wird NICHT beim Start geladen: `planflaeche.ts` hängt es mit der
 * Werkstatt ein, wenn sie zum ersten Mal geöffnet wird.
 * ==========================================================================*/

const RelaisKern = (() => {

  type Feld = { zeile: number; spalte: number; id: number; code: number; a: number; b: number };
  type Sch = { felder: Feld[]; roh: string };

  /** Code des alten Formats → Zeichen in Redion. 0 ist ein leeres Feld,
      1 ein Leitungsstück. */
  const CODES: Readonly<Record<number, string | null>> = Object.freeze({
    0: null, 1: 'leitung', 2: 'taster-schliesser', 4: 'taster-oeffner',
    8: 'ausschalter', 16: 'lampe', 32: 'spule',
    64: 'schuetz-schliesser', 128: 'schuetz-oeffner',
    256: 'spule-anzugsverzoegert', 512: 'schuetz-schliesser',
    1024: 'schuetz-oeffner', 2048: 'spule-abfallverzoegert',
    4096: 'schuetz-schliesser', 8192: 'schuetz-oeffner'
  });
  const SPULEN = new Set([32, 256, 2048]);
  const KONTAKTE = new Set([64, 128, 512, 1024, 4096, 8192]);
  const sichereZahl = (v: number): boolean => Number.isSafeInteger(v) && v >= 0 && v <= 10000000;

  const alsBytes = (v: ArrayBuffer | Uint8Array): Uint8Array =>
    v instanceof Uint8Array ? v : new Uint8Array(v);

  const ausBase64 = (b64: string): Uint8Array => {
    if (typeof b64 !== 'string' || b64.length > 100000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(b64))
      throw new Error('Ungültige Base64-Schaltungsdaten.');
    const s = atob(b64);
    return Uint8Array.from(s, c => c.charCodeAt(0));
  };
  const zuBase64 = (daten: ArrayBuffer | Uint8Array): string => {
    const u = alsBytes(daten);
    let s = '';
    for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]!);
    return btoa(s);
  };

  const leseSch = (eingabe: ArrayBuffer | Uint8Array): Sch => {
    const roh = alsBytes(eingabe);
    if (roh.byteLength !== 4320) throw new Error('Eine Relais-.sch-Datei muss genau 4320 Byte enthalten.');
    const sicht = new DataView(roh.buffer, roh.byteOffset, roh.byteLength);
    const felder: Feld[] = [];
    for (let i = 0; i < 270; i++) {
      const code = sicht.getInt32(i * 16 + 4, true);
      if (!Object.prototype.hasOwnProperty.call(CODES, code))
        throw new Error('Unbekannter Bauteilcode ' + code + ' in Rasterfeld ' + (i + 1) + '.');
      felder.push({ zeile: Math.floor(i / 30), spalte: i % 30, id: sicht.getInt32(i * 16, true), code,
        a: sicht.getInt32(i * 16 + 8, true), b: sicht.getInt32(i * 16 + 12, true) });
    }
    return { felder, roh: zuBase64(roh) };
  };

  const leseText = (eingabe: string | ArrayBuffer | Uint8Array | null): string[] => {
    if (eingabe == null || eingabe === '') return Array<string>(30).fill('');
    let s: string;
    if (typeof eingabe === 'string') s = eingabe;
    else {
      const u = alsBytes(eingabe);
      if (u.length > 16384) throw new Error('Die Beschriftungsdatei ist zu gross.');
      s = new TextDecoder('windows-1252').decode(u);
    }
    const treffer = [...s.matchAll(/\[([^\]\r\n]*)\]/g)];
    if (treffer.length !== 30 || treffer.map(x => x[0]).join('') !== s.trim())
      throw new Error('Die alte Beschriftungsdatei muss genau 30 [Text]-Felder enthalten.');
    return treffer.map(x => String(x[1] ?? '').slice(0, 200));
  };

  const neuerLeererPlan = (): any =>
    (typeof Schaltplan !== 'undefined' && typeof Schaltplan.neuerPlan === 'function')
      ? Schaltplan.neuerPlan('stromlauf-aufgeloest')
      : { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 700, teile: [], leitungen: [], texte: [],
          ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] };

  /** Der neutrale Plan: Lage ja, Verdrahtung nein (siehe Kopf). */
  const neutralerPlan = (sch: Sch, beschriftungen: string[] | null, name: string, txtRoh = ''): any => {
    if (!sch || !Array.isArray(sch.felder) || sch.felder.length !== 270)
      throw new Error('Die Schaltungsdaten sind unvollständig.');
    const teile: any[] = [], leitungen: any[] = [], texte: any[] = [];
    const titel = beschriftungen && beschriftungen.length === 30 ? beschriftungen : Array<string>(30).fill('');
    const zaehler: Record<number, number> = {};
    sch.felder.forEach((f, i) => {
      const x = 35 + f.spalte * 70, y = 35 + f.zeile * 90;
      if (f.code === 0) return;
      if (f.code === 1) {
        leitungen.push({ id: 'rl' + i, ebene: 'plan', punkte: [{ x: x + 20, y: y + 15 }, { x: x + 20, y: y + 40 }] });
        return;
      }
      const familie = SPULEN.has(f.code) || KONTAKTE.has(f.code) ? 'K' : f.code === 16 ? 'H' : 'S';
      zaehler[f.code] = (zaehler[f.code] ?? 0) + 1;
      const n = sichereZahl(f.id) && f.id > 0 ? f.id : zaehler[f.code];
      teile.push({ id: 'rc' + i, zeichen: CODES[f.code], x, y, drehung: 0, gespiegelt: false,
        bmk: familie + n, nummern: {}, gruppe: '', ebene: 'plan', legacySpalte: f.spalte,
        ...(SPULEN.has(f.code) && f.code !== 32 ? { werte: { T: 3 } } : {}) });
    });
    titel.forEach((t, spalte) => {
      if (t) texte.push({ id: 'rt' + spalte, x: 35 + spalte * 70, y: 15, t, ebene: 'plan' });
    });
    const plan = neuerLeererPlan();
    plan.breite = 2200; plan.hoehe = 870;
    plan.teile = teile; plan.leitungen = leitungen; plan.texte = texte;
    plan.relaisLegacy = {
      name: String(name || 'Import').slice(0, 150), format: 'Relais-Schaltplan 9×30',
      roh: sch.roh, txtRoh: typeof txtRoh === 'string' ? txtRoh : '', texte: titel.slice(),
      verifiziert: false, bearbeitet: false, texteBearbeitet: false,
      nichtVerifiziert: [
        'Die Leitungsführung des Originals ist nicht entschlüsselt: die kurzen Strecken sind Lagehinweise, keine Verbindungen.',
        'Kennung, Statusfelder und Versorgung des Originals sind nicht vollständig dokumentiert.'
      ]
    };
    return plan;
  };

  const vorlage = (v: { name: string; sch: string; txt: string }): any => {
    if (!v || typeof v.name !== 'string') throw new Error('Unbekannte Relais-Vorlage.');
    return neutralerPlan(leseSch(ausBase64(v.sch)), leseText(ausBase64(v.txt)), v.name, v.txt);
  };

  /**
   * Zwei wirklich verdrahtete Lehrbeispiele (Selbsthaltung, Treppenhaus mit
   * abfallverzögertem Relais) — in Redion gebaut, KEINE Behauptung über die
   * Drähte der Originaldateien. Sie sind sofort simulierbar.
   */
  const lehrbeispiel = (art: 'selbsthaltung' | 'treppenhaus'): any => {
    if (art !== 'selbsthaltung' && art !== 'treppenhaus') throw new Error('Unbekanntes Lehrbeispiel.');
    const p = neuerLeererPlan();
    p.breite = 800; p.hoehe = 700;
    const n: { oben: number; unten: number } = Schaltplan.netzBauen(p);
    const teil = (zeichen: string, bmk: string, x: number, y: number, werte?: Record<string, number>): any => {
      const t: any = { id: Schaltplan.uid(), zeichen, bmk, x, y, drehung: 0, gespiegelt: false,
        nummern: {}, gruppe: '', ebene: 'plan' };
      if (werte) t.werte = werte;
      p.teile.push(t);
      return t;
    };
    const draht = (punkte: Array<{ x: number; y: number }>, von: any, vonNr: string | null,
                   nach?: any, nachNr?: string): void => {
      const l: any = { id: Schaltplan.uid(), punkte, ebene: 'plan' };
      if (von && vonNr) { l.vonTeil = von.id; l.vonNr = vonNr; }
      if (nach && nachNr) { l.nachTeil = nach.id; l.nachNr = nachNr; }
      p.leitungen.push(l);
    };
    const treppe = art === 'treppenhaus';
    const spule = teil(treppe ? 'spule-abfallverzoegert' : 'spule', 'K1', 220, 430, treppe ? { T: 3 } : undefined);
    const start = teil('taster-schliesser', 'S1', 220, 240);
    const kontakt = teil('schuetz-schliesser', 'K1', 500, 240);
    const lampe = teil('lampe', 'H1', 490, 430);
    if (!treppe) {
      const stop = teil('taster-oeffner', 'S2', 220, 100);
      const halten = teil('schuetz-schliesser', 'K1', 380, 240);
      draht([{ x: 240, y: n.oben }, { x: 240, y: 100 }], null, null, stop, '1');
      draht([{ x: 240, y: 160 }, { x: 240, y: 200 }, { x: 240, y: 240 }], stop, '2', start, '3');
      draht([{ x: 240, y: 200 }, { x: 400, y: 200 }, { x: 400, y: 240 }], null, null, halten, '13');
      draht([{ x: 400, y: 300 }, { x: 400, y: 380 }, { x: 240, y: 380 }], halten, '14');
      draht([{ x: 240, y: 300 }, { x: 240, y: 430 }], start, '4', spule, 'A1');
      p.texte.push({ id: Schaltplan.uid(), x: 550, y: 160, t: 'Start S1 / Stopp S2', ebene: 'plan' });
    } else {
      draht([{ x: 240, y: n.oben }, { x: 240, y: 240 }], null, null, start, '3');
      draht([{ x: 240, y: 300 }, { x: 240, y: 430 }], start, '4', spule, 'A1');
      p.texte.push({ id: Schaltplan.uid(), x: 550, y: 160, t: 'K1: Ausschaltverzögerung 3 s', ebene: 'plan' });
    }
    draht([{ x: 240, y: 490 }, { x: 240, y: n.unten }], spule, 'A2');
    draht([{ x: 520, y: n.oben }, { x: 520, y: 240 }], null, null, kontakt, '13');
    draht([{ x: 520, y: 300 }, { x: 520, y: 430 }], kontakt, '14', lampe, 'X1');
    draht([{ x: 520, y: 490 }, { x: 520, y: n.unten }], lampe, 'X2');
    return p;
  };

  /** Einen Spaltentitel ändern; die Originalbytes der .txt bleiben in `txtRoh`. */
  const spalteBeschriften = (plan: any, spalte: number, titel: string): string => {
    const meta = plan?.relaisLegacy;
    if (!meta || !Array.isArray(meta.texte) || !Number.isInteger(spalte) || spalte < 0 || spalte >= 30)
      throw new Error('Ungültige Originalspalte.');
    const text = String(titel || '').trim().slice(0, 200);
    meta.texte[spalte] = text;
    meta.texteBearbeitet = true;
    meta.bearbeitet = true;
    const id = 'rt' + spalte;
    const da = (plan.texte as any[]).find(x => x.id === id);
    if (da) {
      if (text) da.t = text; else plan.texte = (plan.texte as any[]).filter(x => x.id !== id);
    } else if (text) plan.texte.push({ id, x: 35 + spalte * 70, y: 15, t: text, ebene: 'plan' });
    return text;
  };

  return { CODES, leseSch, leseText, neutralerPlan, vorlage, lehrbeispiel, spalteBeschriften,
    ausBase64, zuBase64 };
})();

(window as any).RelaisKern = RelaisKern;
