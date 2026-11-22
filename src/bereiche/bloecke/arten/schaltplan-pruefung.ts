/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/schaltplan-pruefung.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/bloecke/arten/schaltplan-pruefung.ts — der Kern des Prüfzentrums
 * ----------------------------------------------------------------------------
 * Aus Redurs ZIP vom 1. November 2026 (dort `quell/bereiche/elektro/
 * planpruefung.js`, handgeschriebenes JavaScript) — hier getypt und neben
 * der Planfläche, die ihn ruft (§54, §5 Regel 1). E771.
 *
 * REINE ANALYSE. Nichts hier schreibt in einen Block; `vereinfachen` ändert
 * nur die Kopie, die ihm die Planfläche gibt, und die Planfläche legt sie
 * über `aendere` zurück — also rückgängig zu machen.
 *
 * DIE NETZE KOMMEN AUS `Stromfluss.netze`, die offenen Klemmen aus der
 * Rechnung selbst (E747, mit Brücken und Sternpunkt). Ein zweites
 * Verbindungsmodell gibt es hier nicht: die Fusszeile und das Prüfzentrum
 * sagen über eine offene Klemme dasselbe, weil sie denselben Satz lesen.
 *
 * NACHGELADEN wie die Relais-Werkstatt (E769): erst, wenn jemand das
 * Prüfzentrum öffnet. Ein Hinweis hier ist keine Sicherheitsabnahme.
 * ==========================================================================*/

type PruefPunkt = { x: number; y: number; nr?: string };
type PruefStufe = 'fehler' | 'warnung' | 'hinweis';
type PruefMeldung = { stufe: PruefStufe; art: string; text: string; id: string; x: number | null; y: number | null };
type PruefNetz = { nummer: number; klemmen: { teil: string; nr: string }[]; leitungen: string[] };
type PruefBauteil = { zeichen: string; name: string; anzahl: number; kennzeichen: string[] };
type PruefErgebnis = {
  zaehler: Record<PruefStufe, number>;
  punkte: PruefMeldung[];
  bauteile: PruefBauteil[];
  netze: PruefNetz[];
  statistik: { teile: number; leitungen: number; texte: number; netze: number };
};
type PruefHilfen = {
  anschluesseVon?: (t: any) => PruefPunkt[];
  holeSymbol?: (id: string) => { name?: string } | null | undefined;
  netze?: (plan: any) => any;
  /** Die Sätze „… hängt an keiner Leitung." aus der Rechnung (E747). */
  offeneKlemmen?: (plan: any) => string[];
};

const Planpruefung = (() => {
  const feld = (v: unknown): any[] => Array.isArray(v) ? v : [];
  const pos = (p: any): boolean => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const key = (p: PruefPunkt): string => `${p.x}:${p.y}`;
  const gleich = (a: PruefPunkt, b: PruefPunkt): boolean => a.x === b.x && a.y === b.y;
  const aufStrecke = (p: any, a: any, b: any): boolean => {
    if (!pos(p) || !pos(a) || !pos(b)) return false;
    const kreuz = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
    if (Math.abs(kreuz) > 0.00001) return false;
    return p.x >= Math.min(a.x, b.x) - 0.00001 && p.x <= Math.max(a.x, b.x) + 0.00001 &&
           p.y >= Math.min(a.y, b.y) - 0.00001 && p.y <= Math.max(a.y, b.y) + 0.00001;
  };
  const zwischen = (a: PruefPunkt, p: PruefPunkt, b: PruefPunkt): boolean =>
    aufStrecke(p, a, b) && !gleich(a, p) && !gleich(p, b);
  const ort = (p: PruefPunkt): string => `${Math.round(p.x)}, ${Math.round(p.y)}`;

  /** Punkte, die nie entfernt werden dürfen: Klemmen und Berührungen. */
  const schutzpunkte = (plan: any, anschluesseVon: (t: any) => PruefPunkt[]): Set<string> => {
    const schuetzen = new Set<string>();
    feld(plan.teile).forEach(t => {
      try { feld(anschluesseVon(t)).forEach(p => { if (pos(p)) schuetzen.add(key(p)); }); }
      catch { /* unvollständiges Symbol: nichts schützen, nichts melden */ }
    });
    /* Ein innerer Knoten, den eine andere Leitung berührt, verbindet — ihn
       zu entfernen trennte elektrisch, was gezeichnet verbunden ist. */
    const leitungen = feld(plan.leitungen);
    for (const l of leitungen) {
      const ps = feld(l.punkte);
      for (let i = 1; i + 1 < ps.length; i++) {
        const p = ps[i];
        if (!pos(p)) continue;
        for (const andere of leitungen) {
          if (andere === l) continue;
          const weg = feld(andere.punkte);
          if (weg.some(q => pos(q) && gleich(q, p)) ||
              weg.some((a, j) => j + 1 < weg.length && aufStrecke(p, a, weg[j + 1]))) {
            schuetzen.add(key(p)); break;
          }
        }
      }
    }
    return schuetzen;
  };

  /** „Leitungen aufräumen": überflüssige Zwischenpunkte weg, Enden bleiben. */
  const vereinfachen = (plan: any, anschluesseVon?: (t: any) => PruefPunkt[]): { geaendert: number; entfernt: number } => {
    const schuetzen = schutzpunkte(plan, anschluesseVon || (() => []));
    let entfernt = 0, geaendert = 0;
    feld(plan.leitungen).forEach(l => {
      const alt = feld(l.punkte);
      if (alt.length < 3 || !alt.every(pos)) return;
      const neu: PruefPunkt[] = alt.map(p => ({ ...p }));
      for (let i = neu.length - 2; i >= 1; i--) {
        const p = neu[i], a = neu[i - 1], b = neu[i + 1];
        if (!p || !a || !b || schuetzen.has(key(p))) continue;
        if (gleich(a, p) || gleich(p, b) || zwischen(a, p, b)) { neu.splice(i, 1); entfernt++; }
      }
      if (neu.length >= 2 && neu.length !== alt.length) { l.punkte = neu; geaendert++; }
    });
    return { geaendert, entfernt };
  };

  const analysieren = (plan: any, hilfen: PruefHilfen = {}): PruefErgebnis => {
    const teile = feld(plan?.teile), leitungen = feld(plan?.leitungen), texte = feld(plan?.texte);
    const anschluesseVon = hilfen.anschluesseVon || (() => []);
    const holeSymbol = hilfen.holeSymbol || (() => null);
    const punkte: PruefMeldung[] = [];
    const melden = (stufe: PruefStufe, art: string, text: string, id?: unknown, o?: any): void => {
      punkte.push({ stufe, art, text, id: String(id || ''),
        x: pos(o) ? o.x : null, y: pos(o) ? o.y : null });
    };
    const ids = new Set<string>();
    for (const t of [...teile, ...leitungen, ...texte]) {
      if (!t || !t.id) continue;
      if (ids.has(t.id)) melden('fehler', 'doppelte-id', `Kennung ${String(t.id)} ist mehrfach vorhanden.`, t.id, t);
      ids.add(t.id);
    }
    const teileAnOrt = new Map<string, any>();
    for (const t of teile) {
      if (!t || !pos(t)) { melden('warnung', 'koordinate', 'Bauteil ohne gültige Koordinaten.', t?.id); continue; }
      const k = key(t), vorher = teileAnOrt.get(k);
      if (vorher) melden('warnung', 'ueberlagerung',
        `${t.bmk || t.zeichen || 'Bauteil'} liegt genau auf ${vorher.bmk || vorher.zeichen || 'einem weiteren Bauteil'}.`, t.id, t);
      else teileAnOrt.set(k, t);
      if (!holeSymbol(t.zeichen)) melden('warnung', 'symbol', `Unbekanntes Fachzeichen: ${String(t.zeichen || 'ohne Kennung')}.`, t.id, t);
      if (t.x < 0 || t.y < 0 || t.x > Number(plan.breite) || t.y > Number(plan.hoehe))
        melden('hinweis', 'ausserhalb', `${t.bmk || t.zeichen || 'Bauteil'} liegt ausserhalb des Planblatts.`, t.id, t);
    }
    const teileNachId = new Map(teile.filter(t => t?.id).map(t => [t.id, t]));
    const pruefeKlemmenbezug = (l: any, p: PruefPunkt, teilId: unknown, nr: unknown): void => {
      if (!hilfen.anschluesseVon || (!teilId && !nr)) return;
      const teil = teileNachId.get(teilId);
      let anschluss: PruefPunkt | undefined;
      try {
        anschluss = teil && feld(anschluesseVon(teil)).find(a => a?.nr === nr);
      } catch {
        // Ungültige Symbole können keinen gültigen Klemmenbezug liefern.
      }
      if (!nr || !anschluss || !pos(anschluss)) {
        melden('fehler', 'klemmenbezug-fehlt',
          'Leitungsende verweist auf eine fehlende Klemme (' + String(teil?.bmk || teilId || 'ohne Bauteil') +
          ', ' + String(nr || 'ohne Nummer') + ').', l.id, p);
      } else if (!gleich(p, anschluss)) {
        melden('fehler', 'klemmenbezug-versetzt',
          'Leitungsende trifft die zugeordnete Klemme ' +
          String(teil.bmk || teil.id) + ':' + String(nr) + ' nicht.', l.id, p);
      }
    };
    const schuetzen = schutzpunkte(plan, anschluesseVon);
    const verbindungAmEnde = (l: any, p: PruefPunkt): boolean => {
      for (const t of teile) {
        try { if (feld(anschluesseVon(t)).some(a => pos(a) && gleich(a, p))) return true; }
        catch { /* nur ein Hinweis, kein Absturz */ }
      }
      for (const andere of leitungen) if (andere !== l) {
        const ps = feld(andere.punkte);
        for (let i = 0; i < ps.length - 1; i++) if (aufStrecke(p, ps[i], ps[i + 1])) return true;
      }
      return false;
    };
    for (const l of leitungen) {
      const ps = feld(l?.punkte);
      if (ps.length < 2 || !ps.every(pos)) {
        melden('fehler', 'leitung-ungueltig', 'Leitung hat weniger als zwei gültige Punkte.', l?.id); continue;
      }
      for (let i = 0; i < ps.length - 1; i++) {
        const a = ps[i], b = ps[i + 1];
        if (gleich(a, b)) melden('warnung', 'nullsegment', `Null-Länge bei ${ort(a)}.`, l.id, a);
        else if (a.x !== b.x && a.y !== b.y)
          melden('warnung', 'diagonal', `Schräges Leitungsstück bei ${ort(a)} – ${ort(b)}.`, l.id, a);
      }
      for (let i = 1; i < ps.length - 1; i++) {
        if (!schuetzen.has(key(ps[i])) && zwischen(ps[i - 1], ps[i], ps[i + 1])) {
          melden('hinweis', 'redundant', 'Gerades Leitungsstück enthält einen entfernbaren Zwischenpunkt.', l.id, ps[i]);
          break;
        }
      }
      const erster = ps[0], letzter = ps[ps.length - 1];
      pruefeKlemmenbezug(l, erster, l.vonTeil, l.vonNr);
      pruefeKlemmenbezug(l, letzter, l.nachTeil, l.nachNr);
      const enden: Array<[PruefPunkt, unknown]> = [
        [erster, l.vonTeil || l.vonNr], [letzter, l.nachTeil || l.nachNr],
      ];
      for (const [p, bezug] of enden) {
        if (!bezug && !verbindungAmEnde(l, p))
          melden('hinweis', 'offenes-ende', 'Offenes Leitungsende bei ' + ort(p) + ' (gegebenenfalls beabsichtigt).', l.id, p);
      }
    }
    /* E747 IN EINEM SATZ: die offenen Klemmen meldet die Rechnung, nicht
       eine zweite Geometrie hier. Dieselben Wörter wie in der Fusszeile. */
    if (typeof hilfen.offeneKlemmen === 'function') {
      try {
        hilfen.offeneKlemmen(plan).forEach(satz => {
          const bmk = satz.split(':')[0] || '';
          const t = teile.find(x => x && (x.bmk === bmk || x.zeichen === bmk));
          melden('warnung', 'offene-klemme', satz, t?.id, t);
        });
      } catch { melden('hinweis', 'netzliste', 'Offene Klemmen konnten für diesen Plan nicht bestimmt werden.'); }
    }
    let netzListe: PruefNetz[] = [];
    if (typeof hilfen.netze === 'function') {
      try {
        const n = hilfen.netze(plan);
        const gruppen = new Map<number, PruefNetz>();
        const gruppe = (nr: number): PruefNetz => {
          let g = gruppen.get(nr);
          if (!g) { g = { nummer: nr, klemmen: [], leitungen: [] }; gruppen.set(nr, g); }
          return g;
        };
        for (const k of feld(n.klemmen)) {
          const nr = n.netzVon.get(k.schluessel);
          if (typeof nr === 'number') gruppe(nr).klemmen.push({ teil: String(k.teil), nr: String(k.nr) });
        }
        for (const l of leitungen) {
          const nr = n.leitungNetz[l.id];
          if (typeof nr === 'number') gruppe(nr).leitungen.push(String(l.id));
        }
        netzListe = [...gruppen.values()].sort((a, b) => a.nummer - b.nummer);
      } catch { melden('hinweis', 'netzliste', 'Netzliste konnte für diesen Plan nicht berechnet werden.'); }
    }
    const bestand = new Map<string, PruefBauteil>();
    teile.forEach(t => {
      const typ = String(t?.zeichen || 'unbekannt');
      let b = bestand.get(typ);
      if (!b) { b = { zeichen: typ, name: holeSymbol(typ)?.name || typ, anzahl: 0, kennzeichen: [] }; bestand.set(typ, b); }
      b.anzahl++;
      if (t?.bmk) b.kennzeichen.push(String(t.bmk));
    });
    const bauteile = [...bestand.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const zaehler: Record<PruefStufe, number> = { fehler: 0, warnung: 0, hinweis: 0 };
    punkte.forEach(p => { zaehler[p.stufe]++; });
    return { zaehler, punkte, bauteile, netze: netzListe,
      statistik: { teile: teile.length, leitungen: leitungen.length, texte: texte.length, netze: netzListe.length } };
  };

  /* CSV GEGEN FORMEL-EINSCHLEUSUNG: ein Feld, das mit = + @ - Tab oder
     Wagenrücklauf beginnt, bekommt ein Hochkomma — sonst rechnete eine
     Tabellensoftware einen BMK „=HYPERLINK(…)" aus. */
  const csvFeld = (v: unknown): string => {
    let s = String(v ?? '');
    if (/^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const csv = (zeilen: unknown[][]): string =>
    '﻿' + zeilen.map(z => z.map(csvFeld).join(';')).join('\r\n') + '\r\n';
  const bauteileCsv = (r: PruefErgebnis): string => csv([
    ['Fachzeichen', 'Name', 'Anzahl', 'Betriebsmittelkennzeichen'],
    ...r.bauteile.map(b => [b.zeichen, b.name, b.anzahl, b.kennzeichen.join(', ')])]);
  const netzeCsv = (r: PruefErgebnis): string => csv([
    ['Netz', 'Bauteilklemmen', 'Leitungskennungen'],
    ...r.netze.map(n => [n.nummer, n.klemmen.map(k => `${k.teil}:${k.nr}`).join(', '), n.leitungen.join(', ')])]);
  const STUFE: Record<PruefStufe, string> = { fehler: 'FEHLER', warnung: 'WARNUNG', hinweis: 'HINWEIS' };
  const berichtText = (r: PruefErgebnis): string => [
    'Redion · Schaltplan-Prüfbericht',
    `Bauteile: ${r.statistik.teile} | Leitungen: ${r.statistik.leitungen} | Netze: ${r.statistik.netze}`,
    `Fehler: ${r.zaehler.fehler} | Warnungen: ${r.zaehler.warnung} | Hinweise: ${r.zaehler.hinweis}`,
    'Hinweise zur Zeichnung — keine elektrische Sicherheitsabnahme.',
    '',
    ...r.punkte.map(p => `[${STUFE[p.stufe]}] ${p.text}${p.id ? ` (${p.id})` : ''}`)].join('\n') + '\n';

  const berichtJson = (ergebnis: PruefErgebnis): string =>
    JSON.stringify({ format: 'redion-schaltplan-pruefbericht', version: 1, ...ergebnis }, null, 2) + '\n';

  return { analysieren, vereinfachen, bauteileCsv, netzeCsv, berichtText, berichtJson };
})();

/* Nachgeladen: die Planfläche fragt nach `window.Planpruefung`, weil eine
   `const` im Skript-Gültigkeitsbereich kein Feld von `window` wird. */
(window as any).Planpruefung = Planpruefung;
