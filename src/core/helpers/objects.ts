/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/objects.ts (npm run bauen:ts). */
/* ============================================================================
 * core/helpers/objects.ts — Objekte kopieren, vergleichen, tief anfassen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/objects.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/objects.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Vier Handgriffe, die überall gebraucht werden und die man überall ein
 * bisschen anders falsch macht:
 *
 *   clone(x)          eine Kopie, die keine Verbindung zum Original hat
 *   equal(a, b)       Vergleich nach Inhalt, nicht nach Identität
 *   get(o, pfad)      tief lesen, ohne bei jedem Schritt zu prüfen
 *   set(o, pfad, w)   tief schreiben, Zwischenebenen anlegen
 *
 * Warum das zählt: `Object.assign` und `{...x}` kopieren nur die erste
 * Ebene. Wer damit ein Schema kopiert und dann eine Spalte ändert, ändert
 * sie im Original mit — und sucht den Fehler an der falschen Stelle.
 * `JSON.stringify`-Vergleich wiederum ist von der Reihenfolge der Schlüssel
 * abhängig: zwei gleiche Objekte gelten als verschieden, nur weil sie in
 * anderer Reihenfolge entstanden sind.
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27. Auch die
 * öffentliche Schnittstelle ist umgestellt: aus `Objekte.kopie()` wurde
 * `Objects.clone()`.
 *
 * Das war der einfachste Fall der ganzen Migration: gemessen **null** Aufrufe
 * in Produktivcode und neun in `test85.mjs`. Die Zuordnung, falls jemand die
 * alte Fassung sucht:
 *
 *   istObjekt → isObject      kopie → clone         gleich → equal
 *   hole → get                setze → set           misch → merge
 *   unterschiede → differences                      ohneLeere → withoutEmpty
 *   nur → pick                ohne → omit           gruppiere → groupBy
 *
 * ─── WARUM HIER `any` STEHT ─────────────────────────────────────────────────
 *
 * Diese Datei fasst beliebige Daten an — Schemata, Zeilen, gespeicherte
 * Sätze, alles, was durch die Ablage geht. Ein enger Typ wäre hier keine
 * Zusage, sondern eine Behauptung: er würde etwas versprechen, was zur
 * Laufzeit niemand einhält. `any` an der Grenze zu ungetypten Daten ist
 * genau der Fall, den `CLAUDE.md` §52 erlaubt. Innerhalb der Funktionen
 * wird trotzdem geprüft, bevor zugegriffen wird.
 * ==========================================================================*/

const Objects = (() => {

  const isObject = (x: unknown): boolean =>
    x !== null && typeof x === 'object' && !Array.isArray(x);

  /** Eine tiefe Kopie. Daten, keine Klassen — mehr braucht Redion nicht. */
  const clone = <T>(x: T): T => {
    if (x === null || typeof x !== 'object') return x;
    if (x instanceof Date) return new Date(x.getTime()) as unknown as T;
    if (Array.isArray(x)) return x.map(clone) as unknown as T;
    const out: Record<string, any> = {};
    for (const k of Object.keys(x)) out[k] = clone((x as Record<string, any>)[k]);
    return out as unknown as T;
  };

  /**
   * Vergleich nach Inhalt — unabhängig von der Reihenfolge der Schlüssel.
   * `{a:1,b:2}` und `{b:2,a:1}` sind hier gleich; über JSON wären sie es nicht.
   */
  const equal = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a instanceof Date || b instanceof Date)
      return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object')
      return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((x: any, i: number) => equal(x, b[i]));
    }
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && equal(a[k], b[k]));
  };

  const parts = (path: unknown): string[] => Array.isArray(path)
    ? path
    : String(path || '').split('.').filter(x => x !== '');

  /** Tief lesen. Fehlt unterwegs etwas, kommt der Ersatzwert. */
  const get = (o: any, path: unknown, fallback: any = undefined): any => {
    let z = o;
    for (const k of parts(path)) {
      if (z === null || z === undefined) return fallback;
      z = z[k];
    }
    return z === undefined ? fallback : z;
  };

  /** Tief schreiben. Fehlende Zwischenebenen entstehen als Objekte. */
  const set = (o: any, path: unknown, value: any): any => {
    const p = parts(path);
    if (!p.length) return value;
    let z = o;
    for (let i = 0; i < p.length - 1; i++) {
      /* `?? ''` nur wegen `noUncheckedIndexedAccess`: i läuft bis length-2,
         der Zugriff kann nicht danebengehen. */
      const k = p[i] ?? '';
      if (!isObject(z[k]) && !Array.isArray(z[k])) z[k] = {};
      z = z[k];
    }
    const last = p[p.length - 1] ?? '';
    if (value === undefined) delete z[last];
    else z[last] = value;
    return o;
  };

  /**
   * Zwei Objekte tief zusammenlegen. `b` sticht `a`.
   * Arrays werden ersetzt, nicht verschmolzen — beim Verschmelzen von Listen
   * kommt fast nie das heraus, was jemand erwartet.
   */
  const merge = (a: any, b: any): any => {
    if (!isObject(a) || !isObject(b)) return clone(b === undefined ? a : b);
    const out = clone(a);
    for (const k of Object.keys(b)) {
      out[k] = (isObject(out[k]) && isObject(b[k])) ? merge(out[k], b[k]) : clone(b[k]);
    }
    return out;
  };

  /** Was hat sich geändert? Gibt die Pfade zurück, nicht nur „ja/nein". */
  const differences = (a: any, b: any, path: string[] = []): string[] => {
    const out: string[] = [];
    if (equal(a, b)) return out;
    if (!isObject(a) || !isObject(b)) { out.push(path.join('.') || '(alles)'); return out; }
    const names = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of names) out.push(...differences(a[k], b[k], [...path, k]));
    return out;
  };

  /** Leere Felder herauswerfen — für Ausgaben, die knapp sein sollen. */
  const withoutEmpty = (o: any): any => {
    if (!isObject(o)) return o;
    const out: Record<string, any> = {};
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v) && !v.length) continue;
      out[k] = isObject(v) ? withoutEmpty(v) : v;
    }
    return out;
  };

  /** Nur diese Felder behalten. */
  const pick = (o: any, fields: string[]): Record<string, any> => {
    const out: Record<string, any> = {};
    (fields || []).forEach(k => { if (k in (o || {})) out[k] = o[k]; });
    return out;
  };

  /** Alles ausser diesen Feldern. */
  const omit = (o: any, fields: string[]): Record<string, any> => {
    const drop = new Set(fields || []);
    const out: Record<string, any> = {};
    Object.keys(o || {}).forEach(k => { if (!drop.has(k)) out[k] = o[k]; });
    return out;
  };

  /** Eine Liste nach einem Schlüssel gruppieren. */
  const groupBy = (list: any[], key: unknown): Record<string, any[]> => {
    const out: Record<string, any[]> = {};
    (list || []).forEach((x: any) => {
      const k = typeof key === 'function' ? key(x) : get(x, key);
      (out[k] = out[k] || []).push(x);
    });
    return out;
  };

  return { isObject, clone, equal, get, set, merge, differences,
           withoutEmpty, pick, omit, groupBy };
})();

(window as any).Objects = Objects;
