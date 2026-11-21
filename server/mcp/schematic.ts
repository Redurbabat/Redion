/* Schaltpläne für den Cloud-MCP (Redur, 21. November 2026: „ich will das
 * die über mcp auf alles zugreif haben komplet alles auch schalt plan
 * erstelle").
 *
 * Eine KI nennt Bauteile und Verbindungen in Klemmen („K1:A1 → S1:14");
 * hier entsteht daraus `block.plan` genau in der Form, die
 * `Schaltplan.lesen` (src/bereiche/bloecke/arten/schaltplan.ts) liest:
 * Teile auf dem Raster, Leitungen als Rasterpunkte, deren Enden AUF den
 * Anschlüssen liegen und `vonTeil/vonNr/nachTeil/nachNr` tragen.
 *
 * Die Anschlusslagen kommen aus dem Register der App (fachzeichen-katalog.ts,
 * erzeugt) — hier steht keine eigene Drehmatrix.
 */
import { SYMBOLE, RASTER, type Symbol } from './fachzeichen-katalog.ts';

export class SchematicError extends Error {}
const fail = (m: string): never => { throw new SchematicError(m); };

/** Die Planarten der App (schaltplan.ts ARTEN). Ein unbekannter Wert fiele
 *  dort still auf die erste zurück — hier wird er abgewiesen. */
export const PLAN_ARTEN = ['stromlauf-aufgeloest', 'stromlauf-zusammenhaengend', 'hauptstromkreis',
  'installationsplan', 'uebersichtsplan', 'klemmenplan', 'verdrahtungsplan', 'anschlussplan',
  'blockschaltbild', 'funktionsplan', 'aufbauplan'] as const;
const QUER = new Set(['installationsplan', 'blockschaltbild', 'funktionsplan', 'aufbauplan']);
const SCHIENEN = ['L1', 'L2', 'L3', 'N', 'PE'];
const EBENEN = [
  { id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true },
  { id: 'aufgabe', name: 'Aufgabe', farbe: '#c2410c', sichtbar: true },
  { id: 'loesung', name: 'Lösung', farbe: '#15803d', sichtbar: true },
];
export const LIMITS = { teile: 200, verbindungen: 400, texte: 100 };

const symbol = (id: string): Symbol | undefined => SYMBOLE.find(s => s.id === id);
const rasten = (v: number) => Math.round(v / RASTER) * RASTER;
const zahl = (v: unknown, name: string, min = -20000, max = 20000): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) fail(name + ' muss eine Zahl zwischen ' + min + ' und ' + max + ' sein.');
  return n;
};
const kurz = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';

export type Point = { x: number; y: number };
export type SchematicInput = {
  art?: unknown; teile?: unknown; verbindungen?: unknown; texte?: unknown;
};
export type Plan = Record<string, unknown> & {
  art: string; breite: number; hoehe: number; teile: any[]; leitungen: any[]; texte: any[]; ebenen: any[];
};

/** Symbole für die KI, gefiltert. */
export const listSymbols = (gruppe: string, suche: string) => {
  const q = suche.toLocaleLowerCase();
  return SYMBOLE.filter(s => (!gruppe || s.gruppe === gruppe) &&
    (!q || (s.id + ' ' + s.name + ' ' + s.erklaerung).toLocaleLowerCase().includes(q)))
    .map(s => ({ id: s.id, name: s.name, gruppe: s.gruppe, kennbuchstabe: s.kennbuchstabe,
      breite: s.w, hoehe: s.h, anschluesse: s.anschluesse, erklaerung: s.erklaerung }));
};
export const symbolGroups = () => [...new Set(SYMBOLE.map(s => s.gruppe))];

/** Baut einen Plan aus der Eingabe der KI. `prefix` macht Kennungen eindeutig. */
export const buildPlan = (input: SchematicInput, prefix: string): { plan: Plan; warnungen: string[] } => {
  const warnungen: string[] = [];
  const art = input.art === undefined ? 'stromlauf-aufgeloest' : String(input.art);
  if (!(PLAN_ARTEN as readonly string[]).includes(art)) fail('Unbekannte Planart „' + art + '“. Erlaubt: ' + PLAN_ARTEN.join(', '));
  const rohTeile = Array.isArray(input.teile) ? input.teile : fail('teile muss eine Liste sein.');
  if (rohTeile.length > LIMITS.teile) fail('Höchstens ' + LIMITS.teile + ' Bauteile.');
  const rohVerb = input.verbindungen === undefined ? [] : Array.isArray(input.verbindungen) ? input.verbindungen : fail('verbindungen muss eine Liste sein.');
  if (rohVerb.length > LIMITS.verbindungen) fail('Höchstens ' + LIMITS.verbindungen + ' Verbindungen.');
  const rohTexte = input.texte === undefined ? [] : Array.isArray(input.texte) ? input.texte : fail('texte muss eine Liste sein.');
  if (rohTexte.length > LIMITS.texte) fail('Höchstens ' + LIMITS.texte + ' Texte.');

  /* Teile: Betriebsmittelkennzeichen wie in der App — kleinste freie Nummer. */
  const belegt = new Map<string, Set<number>>();
  const merkeBmk = (bmk: string) => {
    const m = /^([A-Za-z]+)(\d+)$/.exec(bmk);
    if (m) { const s = belegt.get(m[1]!) ?? new Set(); s.add(Number(m[2])); belegt.set(m[1]!, s); }
  };
  rohTeile.forEach((t: any) => merkeBmk(kurz(t?.bmk, 20)));
  const naechstes = (b: string) => {
    if (!b) return '';
    const s = belegt.get(b) ?? new Set<number>();
    let n = 1; while (s.has(n)) n++;
    s.add(n); belegt.set(b, s);
    return b + n;
  };
  const teile: any[] = [];
  const nachName = new Map<string, any>();
  rohTeile.forEach((roh: any, i: number) => {
    if (!roh || typeof roh !== 'object') fail('Bauteil ' + (i + 1) + ' ist kein Objekt.');
    const z = symbol(String(roh.zeichen ?? ''));
    if (!z) fail('Unbekanntes Schaltzeichen „' + String(roh.zeichen) + '“ (Bauteil ' + (i + 1) + '). redion_list_symbols zeigt alle.');
    const drehung = roh.drehung === undefined ? 0 : zahl(roh.drehung, 'drehung', 0, 270);
    if (![0, 90, 180, 270].includes(drehung)) fail('drehung muss 0, 90, 180 oder 270 sein.');
    const bmk = kurz(roh.bmk, 20) || naechstes(z!.kennbuchstabe);
    const teil: any = {
      id: prefix + 't' + i.toString(36), zeichen: z!.id,
      x: rasten(zahl(roh.x, 'x')), y: rasten(zahl(roh.y, 'y')),
      drehung, gespiegelt: roh.gespiegelt === true, bmk, nummern: {}, gruppe: '', ebene: 'plan',
    };
    const beschriftung = kurz(roh.beschriftung, 120);
    if (beschriftung) teil.beschriftung = beschriftung;
    if (roh.werte && typeof roh.werte === 'object' && !Array.isArray(roh.werte)) {
      const werte = Object.fromEntries(Object.entries(roh.werte).filter(([k, v]) =>
        k.length <= 20 && typeof v === 'number' && Number.isFinite(v)).slice(0, 20));
      if (Object.keys(werte).length) teil.werte = werte;
    }
    teile.push(teil);
    const ref = kurz(roh.ref, 40);
    for (const name of [ref, bmk, teil.id]) {
      if (!name) continue;
      if (nachName.has(name) && nachName.get(name) !== teil) fail('Der Name „' + name + '“ gehört zwei Bauteilen.');
      nachName.set(name, teil);
    }
  });

  /* Klemmen: „K1:A1" — Teil über ref, BMK oder Kennung, Nummer wie im Zeichen. */
  const klemme = (text: unknown, wo: string): { teil: any; nr: string; p: Point } => {
    const s = String(text ?? '');
    const i = s.lastIndexOf(':');
    if (i <= 0) fail(wo + ': „' + s + '“ ist keine Klemme. Form: BMK:Anschluss, z. B. K1:A1.');
    const teil = nachName.get(s.slice(0, i)) ?? fail(wo + ': kein Bauteil „' + s.slice(0, i) + '“.');
    const nr = s.slice(i + 1);
    const z = symbol(teil.zeichen)!;
    const lage = z.lagen[teil.drehung + (teil.gespiegelt ? 'g' : '')]?.[nr];
    if (!lage) fail(wo + ': ' + teil.bmk + ' (' + z.name + ') hat keinen Anschluss „' + nr + '“. Anschlüsse: ' + z.anschluesse.join(', '));
    /* Auf das Raster, wie `Schaltplan.lesen` jeden Leitungspunkt rastet.
       Einige gedrehte Zeichen haben Klemmen zwischen den Rasterpunkten (65);
       die App fasst sie dort über ihre Nähe (Register.fachzeichen.NAH). */
    return { teil, nr, p: { x: rasten(teil.x + lage![0]), y: rasten(teil.y + lage![1]) } };
  };
  const leitungen: any[] = [];
  rohVerb.forEach((v: any, i: number) => {
    const wo = 'Verbindung ' + (i + 1);
    if (!v || typeof v !== 'object') fail(wo + ' ist kein Objekt.');
    const a = klemme(v.von, wo), b = klemme(v.nach, wo);
    let punkte: Point[];
    if (Array.isArray(v.punkte) && v.punkte.length) {
      if (v.punkte.length > 50) fail(wo + ': höchstens 50 Zwischenpunkte.');
      punkte = [a.p, ...v.punkte.map((p: any) => ({ x: rasten(zahl(p?.x, 'x')), y: rasten(zahl(p?.y, 'y')) })), b.p];
    } else if (a.p.x === b.p.x || a.p.y === b.p.y) {
      punkte = [a.p, b.p];
    } else {
      /* Rechtwinklig: senkrecht, waagrecht auf halber Höhe, senkrecht. */
      const my = rasten((a.p.y + b.p.y) / 2);
      punkte = [a.p, { x: a.p.x, y: my }, { x: b.p.x, y: my }, b.p];
    }
    punkte = punkte.filter((p, k) => k === 0 || p.x !== punkte[k - 1]!.x || p.y !== punkte[k - 1]!.y);
    if (punkte.length < 2) { warnungen.push(wo + ': beide Enden liegen auf demselben Punkt — weggelassen.'); return; }
    const l: any = { id: prefix + 'l' + i.toString(36), punkte, ebene: 'plan',
      vonTeil: a.teil.id, vonNr: a.nr, nachTeil: b.teil.id, nachNr: b.nr };
    if (v.schiene !== undefined) {
      if (!SCHIENEN.includes(String(v.schiene))) fail(wo + ': schiene muss ' + SCHIENEN.join(', ') + ' sein.');
      l.schiene = String(v.schiene);
    }
    leitungen.push(l);
  });
  const texte = rohTexte.map((x: any, i: number) => {
    const t = kurz(x?.t ?? x?.text, 200);
    if (!t) fail('Text ' + (i + 1) + ' ist leer.');
    return { id: prefix + 'x' + i.toString(36), x: rasten(zahl(x.x, 'x')), y: rasten(zahl(x.y, 'y')), t, ebene: 'plan' };
  });

  /* Das Blatt umfasst alles, mit Rand — mindestens die Vorgabe der Art. */
  let maxX = 0, maxY = 0;
  teile.forEach(t => { const z = symbol(t.zeichen)!; const quer = t.drehung === 90 || t.drehung === 270;
    maxX = Math.max(maxX, t.x + (quer ? z.h : z.w)); maxY = Math.max(maxY, t.y + (quer ? z.w : z.h)); });
  leitungen.forEach(l => l.punkte.forEach((p: Point) => { maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }));
  texte.forEach(t => { maxX = Math.max(maxX, t.x + 100); maxY = Math.max(maxY, t.y + 20); });
  const quer = QUER.has(art);
  const plan: Plan = {
    art, breite: Math.max(quer ? 1000 : 800, rasten(maxX + 60)), hoehe: Math.max(quer ? 600 : 700, rasten(maxY + 60)),
    teile, leitungen, texte, ebenen: EBENEN.map(e => ({ ...e })),
  };
  return { plan, warnungen };
};

/** Ein Plan als lesbare Übersicht für die KI. */
export const describePlan = (plan: any) => {
  const teile = Array.isArray(plan?.teile) ? plan.teile : [];
  const name = new Map<string, string>(teile.map((t: any) => [String(t.id), String(t.bmk || t.id)]));
  return {
    art: String(plan?.art || ''),
    teile: teile.map((t: any) => ({ bmk: String(t.bmk || ''), zeichen: String(t.zeichen || ''),
      x: Number(t.x) || 0, y: Number(t.y) || 0, drehung: Number(t.drehung) || 0,
      ...(t.beschriftung ? { beschriftung: String(t.beschriftung) } : {}) })),
    verbindungen: (Array.isArray(plan?.leitungen) ? plan.leitungen : []).map((l: any) => ({
      von: l.vonTeil ? (name.get(String(l.vonTeil)) ?? l.vonTeil) + ':' + l.vonNr : null,
      nach: l.nachTeil ? (name.get(String(l.nachTeil)) ?? l.nachTeil) + ':' + l.nachNr : null,
      ...(l.schiene ? { schiene: l.schiene } : {}) })),
    texte: (Array.isArray(plan?.texte) ? plan.texte : []).map((x: any) => ({ x: x.x, y: x.y, t: x.t })),
  };
};
