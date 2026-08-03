/* ============================================================================
 * kern/helfer/objekte.js — Objekte kopieren, vergleichen, tief anfassen
 * ----------------------------------------------------------------------------
 * Vier Handgriffe, die überall gebraucht werden und die man überall ein
 * bisschen anders falsch macht:
 *
 *   kopie(x)          eine Kopie, die keine Verbindung zum Original hat
 *   gleich(a, b)      Vergleich nach Inhalt, nicht nach Identität
 *   hole(o, pfad)     tief lesen, ohne bei jedem Schritt zu prüfen
 *   setze(o, pfad, w) tief schreiben, Zwischenebenen anlegen
 *
 * Warum das zählt: `Object.assign` und `{...x}` kopieren nur die erste
 * Ebene. Wer damit ein Schema kopiert und dann eine Spalte ändert, ändert
 * sie im Original mit — und sucht den Fehler an der falschen Stelle.
 * `JSON.stringify`-Vergleich wiederum ist von der Reihenfolge der Schlüssel
 * abhängig: zwei gleiche Objekte gelten als verschieden, nur weil sie in
 * anderer Reihenfolge entstanden sind.
 * ==========================================================================*/

const Objekte = (() => {

  const istObjekt = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

  /** Eine tiefe Kopie. Daten, keine Klassen — mehr braucht Redion nicht. */
  const kopie = (x) => {
    if (x === null || typeof x !== 'object') return x;
    if (x instanceof Date) return new Date(x.getTime());
    if (Array.isArray(x)) return x.map(kopie);
    const raus = {};
    for (const k of Object.keys(x)) raus[k] = kopie(x[k]);
    return raus;
  };

  /**
   * Vergleich nach Inhalt — unabhängig von der Reihenfolge der Schlüssel.
   * `{a:1,b:2}` und `{b:2,a:1}` sind hier gleich; über JSON wären sie es nicht.
   */
  const gleich = (a, b) => {
    if (a === b) return true;
    if (a instanceof Date || b instanceof Date)
      return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object')
      return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((x, i) => gleich(x, b[i]));
    }
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && gleich(a[k], b[k]));
  };

  const teile = (pfad) => Array.isArray(pfad)
    ? pfad
    : String(pfad || '').split('.').filter(x => x !== '');

  /** Tief lesen. Fehlt unterwegs etwas, kommt der Ersatzwert. */
  const hole = (o, pfad, ersatz = undefined) => {
    let z = o;
    for (const k of teile(pfad)) {
      if (z === null || z === undefined) return ersatz;
      z = z[k];
    }
    return z === undefined ? ersatz : z;
  };

  /** Tief schreiben. Fehlende Zwischenebenen entstehen als Objekte. */
  const setze = (o, pfad, wert) => {
    const p = teile(pfad);
    if (!p.length) return wert;
    let z = o;
    for (let i = 0; i < p.length - 1; i++) {
      if (!istObjekt(z[p[i]]) && !Array.isArray(z[p[i]])) z[p[i]] = {};
      z = z[p[i]];
    }
    if (wert === undefined) delete z[p[p.length - 1]];
    else z[p[p.length - 1]] = wert;
    return o;
  };

  /**
   * Zwei Objekte tief zusammenlegen. `b` sticht `a`.
   * Arrays werden ersetzt, nicht verschmolzen — beim Verschmelzen von Listen
   * kommt fast nie das heraus, was jemand erwartet.
   */
  const misch = (a, b) => {
    if (!istObjekt(a) || !istObjekt(b)) return kopie(b === undefined ? a : b);
    const raus = kopie(a);
    for (const k of Object.keys(b)) {
      raus[k] = (istObjekt(raus[k]) && istObjekt(b[k])) ? misch(raus[k], b[k]) : kopie(b[k]);
    }
    return raus;
  };

  /** Was hat sich geändert? Gibt die Pfade zurück, nicht nur „ja/nein". */
  const unterschiede = (a, b, pfad = []) => {
    const raus = [];
    if (gleich(a, b)) return raus;
    if (!istObjekt(a) || !istObjekt(b)) { raus.push(pfad.join('.') || '(alles)'); return raus; }
    const namen = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of namen) raus.push(...unterschiede(a[k], b[k], [...pfad, k]));
    return raus;
  };

  /** Leere Felder herauswerfen — für Ausgaben, die knapp sein sollen. */
  const ohneLeere = (o) => {
    if (!istObjekt(o)) return o;
    const raus = {};
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v) && !v.length) continue;
      raus[k] = istObjekt(v) ? ohneLeere(v) : v;
    }
    return raus;
  };

  /** Nur diese Felder behalten. */
  const nur = (o, felder) => {
    const raus = {};
    (felder || []).forEach(k => { if (k in (o || {})) raus[k] = o[k]; });
    return raus;
  };

  /** Alles ausser diesen Feldern. */
  const ohne = (o, felder) => {
    const weg = new Set(felder || []);
    const raus = {};
    Object.keys(o || {}).forEach(k => { if (!weg.has(k)) raus[k] = o[k]; });
    return raus;
  };

  /** Eine Liste nach einem Schlüssel gruppieren. */
  const gruppiere = (liste, schluessel) => {
    const raus = {};
    (liste || []).forEach(x => {
      const k = typeof schluessel === 'function' ? schluessel(x) : hole(x, schluessel);
      (raus[k] = raus[k] || []).push(x);
    });
    return raus;
  };

  return { istObjekt, kopie, gleich, hole, setze, misch, unterschiede,
           ohneLeere, nur, ohne, gruppiere };
})();

window.Objekte = Objekte;
