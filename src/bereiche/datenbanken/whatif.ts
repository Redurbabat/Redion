/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/whatif.ts (npm run bauen:ts). */
/* ============================================================================
 * whatif.ts — Was wäre, wenn (L28)
 * ----------------------------------------------------------------------------
 * Drei Fragen, die eine Tabelle beantworten können muss, sobald sie rechnet:
 *
 *   Zielwertsuche   „Der Gewinn soll 10 000 sein. Wie hoch muss der Preis?"
 *   Szenarien       „Zeig mir dasselbe für schlecht, normal und gut."
 *   Optimierung     „Bei welchem Preis ist der Gewinn am grössten?"
 *
 * Alle drei laufen über dieselbe kleine Maschine: eine Stellschraube (eine
 * schreibbare Zahlenspalte) und ein Ziel (eine gerechnete Spalte), beide in
 * DERSELBEN ZEILE.
 *
 * DIE WICHTIGSTE REGEL DIESER DATEI: sie schreibt beim Suchen NICHTS.
 *
 * Der naheliegende Weg wäre, den Probewert in die Zelle zu schreiben, die
 * Formel lesen zu lassen und weiterzuprobieren. Damit stünden bei dreissig
 * Schritten neunundzwanzig falsche Werte in den Daten, jeder davon einen
 * Wimpernschlag lang sichtbar, jeder in einer Fassung, jeder im Abgleich —
 * und bricht es in der Mitte ab, bleibt der letzte stehen. Bei einer Suche,
 * die auch scheitern darf, ist das die gefährliche Richtung (§46).
 *
 * Gerechnet wird deshalb auf einer KOPIE der Zeile. `Datenbank.wert` liest
 * `row.props` aus dem übergebenen Satz; ein Satz, den es im Bestand nicht
 * gibt, rechnet genauso. Dasselbe Muster benutzt `dienst.ts` seit Langem für
 * die Regelprüfung („die Zeile MIT dem neuen Wert"). Geschrieben wird erst,
 * wenn ein Mensch das Ergebnis übernimmt.
 * ==========================================================================*/

const WhatIf = (() => {

  /** Wie nah am Ziel „getroffen" heisst — relativ, damit es bei 10 000 000
      genauso stimmt wie bei 0,5. */
  const GENAU = 1e-7;
  /** Wie oft höchstens geprobt wird. Dreissig Halbierungen verkleinern ein
      Suchfenster um den Faktor 10^9 — mehr ist bei `double` nicht drin. */
  const SCHRITTE = 60;

  type Ergebnis =
    | { ok: true; wert: number; erreicht: number; schritte: number }
    | { ok: false; grund: string; schritte: number };

  const zahl = (x: unknown): number => {
    if (typeof x === 'number') return x;
    const n = Number(String(x ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  };

  /**
   * Was die Zielspalte sagen würde, wenn die Stellschraube diesen Wert hätte.
   * Ohne zu schreiben — siehe Kopf.
   */
  const probiere = (coll: any, row: any, stellKey: string, zielKey: string,
                    wert: number): number => {
    const probe = { ...row, props: { ...(row.props || {}), [stellKey]: wert } };
    /* `wertFrisch`, nicht `wert`: die Zwischenspeicher merken sich das
       Ergebnis unter der Zeilenkennung, und die Probezeile trägt dieselbe.
       Mit `wert` kam bei jedem Probewert derselbe Wert zurück — die Suche
       sah eine Gerade, wo eine Kurve ist, und fand nichts (E176). */
    return zahl(Datenbank.wertFrisch(probe, zielKey, coll));
  };

  /** Taugt diese Spalte als Stellschraube? */
  const stellbar = (coll: any, key: string): boolean => {
    const def = coll && coll.schema ? coll.schema[key] : null;
    return !!def && (def.type === 'number' || def.type === 'prozent');
  };

  /** Und diese als Ziel? Gerechnet muss sie sein — sonst gäbe es nichts zu suchen. */
  const zielbar = (coll: any, key: string): boolean => {
    const def = coll && coll.schema ? coll.schema[key] : null;
    return !!def && (def.type === 'formula' || def.type === 'rollup');
  };

  /* ========================================================================
   * 1 · ZIELWERTSUCHE
   * ------------------------------------------------------------------------
   * Gesucht wird die Nullstelle von f(x) = Ziel(x) − Wunsch.
   *
   * ZUERST EIN FENSTER, DANN HALBIEREN. Excel nimmt Newton und scheitert
   * daran regelmässig: eine Formel mit `WENN` hat Sprungstellen, und die
   * Ableitung zeigt dort in die falsche Richtung. Halbieren braucht keine
   * Ableitung — es braucht nur zwei Stellen mit verschiedenem Vorzeichen,
   * und die sucht der erste Teil, indem er das Fenster verdoppelt.
   *
   * WARUM NICHT EINFACH VON 0 BIS 1000: weil niemand weiss, wo die Antwort
   * liegt. Ausgegangen wird vom Wert, der HEUTE in der Zelle steht — der ist
   * die beste Vermutung, die es gibt —, und von dort aus wird das Fenster
   * geöffnet, bis das Vorzeichen kippt oder es zu gross wird.
   * ======================================================================*/
  const zielwert = (coll: any, row: any, stellKey: string, zielKey: string,
                    wunsch: unknown): Ergebnis => {
    const ziel = zahl(wunsch);
    if (!Number.isFinite(ziel))
      return { ok: false, grund: 'Der Zielwert ist keine Zahl.', schritte: 0 };
    if (!coll || !row)
      return { ok: false, grund: 'Zeile oder Tabelle fehlen.', schritte: 0 };
    if (!stellbar(coll, stellKey))
      return { ok: false, grund: 'Die Stellschraube muss eine Zahlenspalte sein.', schritte: 0 };
    if (!zielbar(coll, zielKey))
      return { ok: false, grund: 'Das Ziel muss eine gerechnete Spalte sein — ' +
                                 'eine Zahl, die man einfach hinschreibt, ist schon da.',
               schritte: 0 };

    let schritte = 0;
    const f = (x: number): number => { schritte++; return probiere(coll, row, stellKey, zielKey, x) - ziel; };

    const start = zahl((row.props || {})[stellKey]);
    const x0 = Number.isFinite(start) ? start : 0;
    const f0 = f(x0);
    if (!Number.isFinite(f0))
      return { ok: false, grund: 'Die Zielspalte rechnet gerade nicht — ' +
                                 'sie gibt keine Zahl zurück.', schritte };
    if (Math.abs(f0) <= Math.max(GENAU, Math.abs(ziel) * GENAU))
      return { ok: true, wert: x0, erreicht: f0 + ziel, schritte };

    /* Das Fenster öffnen. Die Schrittweite wächst, weil die Antwort auch
       Millionen entfernt liegen kann; sie beginnt aber klein, damit eine
       Antwort nebenan nicht übersprungen wird. */
    let weite = Math.max(1, Math.abs(x0)) / 2;
    let a = x0, fa = f0, b = x0;
    let gefunden = false;
    for (let i = 0; i < 60 && !gefunden; i++) {
      weite *= 2;
      const links = x0 - weite, rechts = x0 + weite;
      const fl = f(links);
      if (Number.isFinite(fl) && fl * f0 <= 0) { a = links; fa = fl; b = x0; gefunden = true; break; }
      const fr = f(rechts);
      if (Number.isFinite(fr) && fr * f0 <= 0) { a = x0; fa = f0; b = rechts; gefunden = true; break; }
      if (weite > 1e12) break;
    }
    if (!gefunden)
      return { ok: false, grund: 'Kein Wert der Stellschraube führt zu diesem Ziel — ' +
                                 'auch nicht sehr grosse oder sehr kleine.', schritte };

    /* Und jetzt halbieren — BIS DAS FENSTER ZU IST, nicht bis der Rest klein
       genug ist.

       Der erste Anlauf hörte auf, sobald `|f|` unter der Toleranz lag. Die
       ist relativ zum Ziel: bei 2000 sind das 2·10⁻⁴, und heraus kam
       „Preis = 15.999999", wo 16 richtig ist. Rechnerisch einwandfrei und
       für einen Menschen falsch — wer einen Preis sucht, will 16 lesen.

       Halbieren kostet nichts: sechzig Schritte verkleinern das Fenster um
       den Faktor 10¹⁸, mehr als `double` überhaupt unterscheidet. Also
       laufen sie. */
    for (let i = 0; i < SCHRITTE; i++) {
      const m = (a + b) / 2;
      const fm = f(m);
      if (!Number.isFinite(fm))
        return { ok: false, grund: 'Die Zielspalte rechnet bei diesem Wert nicht mehr.', schritte };
      if (fm === 0) return { ok: true, wert: m, erreicht: ziel, schritte };
      if (Math.abs(b - a) <= 1e-12 * Math.max(1, Math.abs(m))) break;
      if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
    }
    const m = (a + b) / 2;
    return { ok: true, wert: m, erreicht: probiere(coll, row, stellKey, zielKey, m), schritte };
  };

  /* ========================================================================
   * 2 · EINFACHE OPTIMIERUNG
   * ------------------------------------------------------------------------
   * „Bei welchem Preis ist der Gewinn am grössten?" — dieselbe Maschine, nur
   * ohne Vorzeichenwechsel: gesucht wird der Hochpunkt zwischen zwei
   * Grenzen, mit dem Goldenen Schnitt.
   *
   * ER BRAUCHT KEINE ABLEITUNG UND KEINE GLATTE KURVE, nur eine, die im
   * Fenster genau einen Gipfel hat. Steht das nicht fest, ist das Ergebnis
   * trotzdem ein Wert, an dem es besser ist als an den Rändern — und mehr
   * verspricht die Oberfläche auch nicht.
   * ======================================================================*/
  const GOLD = (Math.sqrt(5) - 1) / 2;

  const optimum = (coll: any, row: any, stellKey: string, zielKey: string,
                   richtung: 'max' | 'min', von: unknown, bis: unknown): Ergebnis => {
    const u = zahl(von), o = zahl(bis);
    if (!Number.isFinite(u) || !Number.isFinite(o) || u >= o)
      return { ok: false, grund: 'Die Grenzen müssen zwei Zahlen sein, ' +
                                 'die untere kleiner als die obere.', schritte: 0 };
    if (!stellbar(coll, stellKey))
      return { ok: false, grund: 'Die Stellschraube muss eine Zahlenspalte sein.', schritte: 0 };
    if (!zielbar(coll, zielKey))
      return { ok: false, grund: 'Das Ziel muss eine gerechnete Spalte sein.', schritte: 0 };

    let schritte = 0;
    const vz = richtung === 'min' ? -1 : 1;
    const f = (x: number): number => { schritte++; return vz * probiere(coll, row, stellKey, zielKey, x); };

    let a = u, b = o;
    let c = b - GOLD * (b - a), d = a + GOLD * (b - a);
    let fc = f(c), fd = f(d);
    if (!Number.isFinite(fc) || !Number.isFinite(fd))
      return { ok: false, grund: 'Die Zielspalte rechnet in diesem Bereich nicht.', schritte };
    for (let i = 0; i < SCHRITTE && Math.abs(b - a) > 1e-9 * Math.max(1, Math.abs(a)); i++) {
      if (fc > fd) { b = d; d = c; fd = fc; c = b - GOLD * (b - a); fc = f(c); }
      else         { a = c; c = d; fc = fd; d = a + GOLD * (b - a); fd = f(d); }
    }
    const x = (a + b) / 2;
    return { ok: true, wert: x, erreicht: probiere(coll, row, stellKey, zielKey, x), schritte };
  };

  /* ========================================================================
   * 3 · SZENARIEN
   * ------------------------------------------------------------------------
   * Ein Szenario ist ein Satz Werte für dieselben Stellschrauben — „gut",
   * „normal", „schlecht". Es liegt an der SAMMLUNG und nicht an der Zeile:
   * es beschreibt Annahmen, nicht Daten.
   *
   * `zeige` rechnet, ohne zu schreiben. `uebernimm` schreibt — und nur das
   * schreibt in dieser Datei überhaupt.
   * ======================================================================*/
  type Szenario = { name: string; werte: Record<string, number> };

  const szenarien = (coll: any): Szenario[] =>
    Array.isArray(coll && coll.szenarien) ? coll.szenarien : [];

  const merke = (coll: any, name: string, werte: Record<string, unknown>): Szenario[] => {
    const sauber: Record<string, number> = {};
    Object.keys(werte || {}).forEach(k => {
      const n = zahl(werte[k]);
      if (stellbar(coll, k) && Number.isFinite(n)) sauber[k] = n;
    });
    const ohne = szenarien(coll).filter(s => s.name !== name);
    const liste = [...ohne, { name: String(name || 'Ohne Namen'), werte: sauber }];
    Store.updateCollection(coll.id, { szenarien: liste });
    return liste;
  };

  const vergiss = (coll: any, name: string): Szenario[] => {
    const liste = szenarien(coll).filter(s => s.name !== name);
    Store.updateCollection(coll.id, { szenarien: liste });
    return liste;
  };

  /** Was die gerechneten Spalten sagen WÜRDEN. Schreibt nichts. */
  const zeige = (coll: any, row: any, name: string): Record<string, unknown> | null => {
    const s = szenarien(coll).find(x => x.name === name);
    if (!s || !row) return null;
    const probe = { ...row, props: { ...(row.props || {}), ...s.werte } };
    const aus: Record<string, unknown> = {};
    Object.keys(coll.schema || {}).forEach(k => {
      if (zielbar(coll, k)) aus[k] = Datenbank.wertFrisch(probe, k, coll);
    });
    return aus;
  };

  /** Und jetzt wirklich hineinschreiben. */
  const uebernimm = (coll: any, row: any, name: string): boolean => {
    const s = szenarien(coll).find(x => x.name === name);
    if (!s || !row) return false;
    Object.keys(s.werte).forEach(k => Store.setProp(row.id, k, s.werte[k]));
    return true;
  };

  return { zielwert, optimum, probiere, stellbar, zielbar,
           szenarien, merke, vergiss, zeige, uebernimm, GENAU, SCHRITTE };
})();

(window as any).WhatIf = WhatIf;
