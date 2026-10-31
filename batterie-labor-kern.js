/* Batterieanlagen: reine Netzprüfung für die Zeichenübungen.
 * Keine ideale Parallelschaltung ungleicher Spannungen, keine Lade-/Entladekurve.
 * Im Browser und mit node --test verwendbar. */
(function (wurzel) {
  'use strict';

  const fehler = (grund) => ({ ok: false, grund });
  const idMinus = (i) => 'n' + i;
  const idPlus = (i) => 'p' + i;
  const AUS_MINUS = 'aus-';
  const AUS_PLUS = 'aus+';

  function reiheParallel(anzahl, inReihe) {
    if (!Number.isInteger(anzahl) || anzahl < 1 ||
        !Number.isInteger(inReihe) || inReihe < 1 || anzahl % inReihe)
      throw new Error('Die Zellen müssen vollständig auf gleich lange Zweige verteilt werden.');
    const leitungen = [];
    const zweige = anzahl / inReihe;
    for (let z = 0; z < zweige; z++) {
      const von = z * inReihe;
      leitungen.push([AUS_MINUS, idMinus(von)]);
      for (let k = 1; k < inReihe; k++)
        leitungen.push([idPlus(von + k - 1), idMinus(von + k)]);
      leitungen.push([idPlus(von + inReihe - 1), AUS_PLUS]);
    }
    return leitungen;
  }

  function gleichung(loesung, rechte) {
    const n = rechte.length;
    const a = loesung.map((r, i) => [...r, rechte[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++)
        if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
      if (Math.abs(a[p][c]) < 1e-11) return null;
      [a[c], a[p]] = [a[p], a[c]];
      const teiler = a[c][c];
      for (let j = c; j <= n; j++) a[c][j] /= teiler;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const faktor = a[r][c];
        for (let j = c; j <= n; j++) a[r][j] -= faktor * a[c][j];
      }
    }
    return a.map(r => r[n]);
  }

  function pruefen(zellen, leitungen) {
    if (!Array.isArray(zellen) || !zellen.length || zellen.length > 32)
      return fehler('Keine gültige Anzahl von Batteriezellen.');
    if (!Array.isArray(leitungen)) return fehler('Die Verbindungen sind ungültig.');
    const ids = [AUS_MINUS, AUS_PLUS];
    zellen.forEach((_, i) => ids.push(idMinus(i), idPlus(i)));
    const bekannt = new Set(ids);
    const eltern = new Map(ids.map(x => [x, x]));
    const finde = (id) => {
      let p = id;
      while (eltern.get(p) !== p) p = eltern.get(p);
      while (id !== p) {
        const alt = eltern.get(id);
        eltern.set(id, p);
        id = alt;
      }
      return p;
    };
    for (const paar of leitungen) {
      if (!Array.isArray(paar) || paar.length !== 2 ||
          !bekannt.has(paar[0]) || !bekannt.has(paar[1]) ||
          paar[0] === paar[1]) return fehler('Eine Leitung hat ungültige Endpunkte.');
      eltern.set(finde(paar[0]), finde(paar[1]));
    }
    const n = finde(AUS_MINUS), p = finde(AUS_PLUS);
    if (n === p) return fehler('Kurzschluss: Ausgang + und − sind direkt verbunden.');
    const kanten = [];
    for (let i = 0; i < zellen.length; i++) {
      const z = zellen[i], a = finde(idMinus(i)), b = finde(idPlus(i));
      if (!z || !Number.isFinite(z.u) || z.u <= 0 ||
          !Number.isFinite(z.maxA) || z.maxA <= 0)
        return fehler('Die Nenndaten einer Zelle sind ungültig.');
      if (a === b) return fehler('Kurzschluss an Zelle ' + (i + 1) + '.');
      kanten.push({ a, b, i, r: Number.isFinite(z.ri) && z.ri > 0 ? z.ri : 1 });
    }
    // Nur gleichartige Zellen: andernfalls entstehen innere Ausgleichsströme.
    if (zellen.some(z => Math.abs(z.u - zellen[0].u) > 1e-8))
      return fehler('Für unterschiedliche Zellspannungen ist diese Übungsrechnung nicht geeignet.');

    const ad = new Map();
    const add = (a, b, richtung) => {
      if (!ad.has(a)) ad.set(a, []);
      ad.get(a).push({ zu: b, richtung });
    };
    kanten.forEach(k => { add(k.a, k.b, 1); add(k.b, k.a, -1); });
    const tiefen = new Map([[n, 0]]);
    const offen = [n];
    while (offen.length) {
      const a = offen.shift();
      for (const { zu, richtung } of ad.get(a) || []) {
        const tiefe = tiefen.get(a) + richtung;
        if (tiefen.has(zu) && tiefen.get(zu) !== tiefe)
          return fehler('Zellen sind gegenpolig verbunden oder bilden eine widersprüchliche Schleife.');
        if (!tiefen.has(zu)) { tiefen.set(zu, tiefe); offen.push(zu); }
      }
    }
    if (!tiefen.has(p)) return fehler('Ausgang + und − sind noch nicht über Zellen verbunden.');
    if (tiefen.get(p) <= 0) return fehler('Die Polarität am Ausgang ist vertauscht.');
    if (kanten.some(k => !tiefen.has(k.a) || !tiefen.has(k.b)))
      return fehler('Nicht alle Zellen sind an die Batterieanlage angeschlossen.');

    // Jede Zelle muss auf einem vollständigen, korrekt gepolten Zweig liegen.
    const erreicht = (start, rueckwaerts) => {
      const gesehen = new Set([start]), q = [start];
      while (q.length) {
        const a = q.shift();
        for (const k of kanten) {
          const von = rueckwaerts ? k.b : k.a;
          const nach = rueckwaerts ? k.a : k.b;
          if (von === a && !gesehen.has(nach)) { gesehen.add(nach); q.push(nach); }
        }
      }
      return gesehen;
    };
    const vonMinus = erreicht(n, false), nachPlus = erreicht(p, true);
    if (kanten.some(k => !vonMinus.has(k.a) || !nachPlus.has(k.b)))
      return fehler('Mindestens eine Zelle liegt in einem offenen Nebenast.');

    const orte = [...new Set(kanten.flatMap(k => [k.a, k.b]))].filter(id => id !== n);
    const index = new Map(orte.map((id, i) => [id, i]));
    const matrix = orte.map(() => orte.map(() => 0));
    const strom = orte.map(id => id === p ? 1 : 0);
    for (const k of kanten) {
      const g = 1 / k.r;
      const a = index.get(k.a), b = index.get(k.b);
      if (a !== undefined) matrix[a][a] += g;
      if (b !== undefined) matrix[b][b] += g;
      if (a !== undefined && b !== undefined) {
        matrix[a][b] -= g; matrix[b][a] -= g;
      }
    }
    const v = gleichung(matrix, strom);
    if (!v) return fehler('Das Leitungsnetz lässt sich nicht eindeutig berechnen.');
    const perAmpere = kanten.map(k =>
      Math.abs(((index.has(k.b) ? v[index.get(k.b)] : 0) -
                (index.has(k.a) ? v[index.get(k.a)] : 0)) / k.r));
    if (perAmpere.some(x => !Number.isFinite(x) || x < 0))
      return fehler('Die Stromaufteilung ist ungültig.');
    const innenBekannt = zellen.every(z => Number.isFinite(z.ri) && z.ri > 0);
    const kapBekannt = zellen.every(z => Number.isFinite(z.ah) && z.ah > 0);
    const schrank = (feld) => Math.min(...perAmpere.map((anteil, i) =>
      anteil < 1e-10 ? Infinity : zellen[i][feld] / anteil));
    const maxA = schrank('maxA');
    const ah = kapBekannt ? schrank('ah') : null;
    return {
      ok: true,
      reihe: tiefen.get(p),
      u: tiefen.get(p) * zellen[0].u,
      ri: innenBekannt ? v[index.get(p)] : null,
      maxA,
      ah,
      anteile: perAmpere,
      alle: zellen.length
    };
  }

  /* Die echte Redion-Planfläche liefert Netze. Keine zweite Geometrie und
   * keine zweite Definition von Kreuzung/Verbindung: genau die Netzliste
   * des bestehenden Elektrozeichners gilt auch für die Batterieübung. */
  function ausPlan(plan, netze) {
    const uebung = plan && plan.batterieUebung;
    if (!uebung || !Array.isArray(uebung.teile) ||
        !uebung.teile.length || uebung.teile.length > 32)
      return fehler('Keine Batterieübung in diesem Schaltplan.');
    const teile = Array.isArray(plan.teile) ? plan.teile : [];
    const nachId = new Map(teile.map(t => [String(t.id), t]));
    if (!nachId.has(uebung.plus) || !nachId.has(uebung.minus) ||
        nachId.get(uebung.plus).zeichen !== 'klemme' ||
        nachId.get(uebung.minus).zeichen !== 'klemme')
      return fehler('Die beiden Ausgangsklemmen X+ und X− fehlen.');
    if (!netze || !(netze.netzVon instanceof Map))
      return fehler('Die Netzliste steht nicht zur Verfügung.');
    const zellen = [];
    const punkte = [
      { id: AUS_MINUS, klemme: 'k:' + uebung.minus + ':1' },
      { id: AUS_MINUS, klemme: 'k:' + uebung.minus + ':2' },
      { id: AUS_PLUS, klemme: 'k:' + uebung.plus + ':1' },
      { id: AUS_PLUS, klemme: 'k:' + uebung.plus + ':2' }
    ];
    for (let i = 0; i < uebung.teile.length; i++) {
      const t = nachId.get(uebung.teile[i]);
      if (!t || t.zeichen !== 'batterie')
        return fehler('Eine Zelle der Aufgabe wurde entfernt oder ersetzt.');
      const w = t.werte || {};
      const maxA = Number(w.Imax);
      if (!Number.isFinite(maxA) || maxA <= 0)
        return fehler('Bei ' + (t.bmk || 'einer Zelle') + ' fehlt der zulässige Strom Imax.');
      zellen.push({
        u: Number(w.U), ri: w.Ri == null ? null : Number(w.Ri),
        maxA, ah: w.Q == null ? null : Number(w.Q)
      });
      punkte.push(
        { id: idMinus(i), klemme: 'k:' + t.id + ':−' },
        { id: idPlus(i), klemme: 'k:' + t.id + ':+' }
      );
    }
    const nachNetz = new Map();
    for (const p of punkte) {
      const nr = netze.netzVon.get(p.klemme);
      if (nr === undefined) return fehler('Ein Anschluss ist in der Netzliste nicht vorhanden.');
      const liste = nachNetz.get(nr) || [];
      liste.push(p.id);
      nachNetz.set(nr, liste);
    }
    const leitungen = [];
    nachNetz.forEach(liste => {
      for (let i = 1; i < liste.length; i++)
        if (liste[0] !== liste[i]) leitungen.push([liste[0], liste[i]]);
    });
    return pruefen(zellen, leitungen);
  }

  const api = { pruefen, ausPlan, reiheParallel, idMinus, idPlus, AUS_MINUS, AUS_PLUS };
  wurzel.BatterieKern = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
