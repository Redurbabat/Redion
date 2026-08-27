/* ============================================================================
 * rechenweg.js — Jede Rechnung zeigt ihren Weg
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/electrical/rechenweg.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/electrical/rechenweg.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * Redur, mehrfach und wörtlich: der Lösungsweg muss immer gezeigt werden.
 *
 * `ElectricalCalculations` gab bis heute `{ value, unit, formula }` zurück —
 * also „U = I · R" und „1,64 V". Was fehlte, ist der Schritt dazwischen:
 * „= 3,19 · 0,541". Wer nur Formel und Ergebnis sieht, kann nicht nachprüfen,
 * ob er dasselbe gerechnet hätte, und lernt nichts. In einer Prüfung wird
 * ohnehin der Weg bewertet und nicht die Zahl.
 *
 * DIE EINGESETZTE ZEILE WIRD NICHT VON HAND GESCHRIEBEN. Sie entsteht aus
 * denselben Werten, mit denen gerechnet wird — sonst laufen die beiden
 * auseinander, und zwar still. Genau diese Sorte Fehler ist heute schon
 * dreimal vorgekommen (leere Miniatur, zu früh gelesene Form, Anhangsgrösse
 * aus dem falschen Speicher).
 *
 * ZWEI WÄCHTER, UND BEIDE HABEN SICH SCHON BEWÄHRT
 *
 * 1. Ein Name in der Formel ohne Wert wird gemeldet. Sonst bliebe er als
 *    Buchstabe in der eingesetzten Zeile stehen und sähe aus wie Absicht.
 *
 * 2. Die gezeigte Zeile muss das gezeigte Ergebnis TRAGEN. Zahlen werden beim
 *    Anzeigen gerundet, und eine zu kurz gerundete Zahl macht aus der Rechnung
 *    eine andere. Beim ersten Entwurf stand ϱ = 0,0178 als „0,018" da —
 *    0,018 · 2 · 38 / 2,5 ergibt 0,547 statt 0,541. Wer die Zeile mit dem
 *    Taschenrechner nachrechnet, muss auf das kommen, was danebensteht; sonst
 *    sucht er den Fehler bei sich.
 *
 * KEIN eval() (§20). Hier wird nichts zerlegt und nichts ausgeführt: die
 * Rechnung ist eine gewöhnliche Funktion, die Formel ist Text daneben, und
 * der zweite Wächter ruft dieselbe Funktion noch einmal mit gerundeten
 * Zahlen. Es gibt nichts zu unterschieben.
 * ==========================================================================*/

type RwWerte = Record<string, number>;

type RwSchritt = {
  /** Was in diesem Schritt ausgerechnet wird — „Strom aus der Leistung". */
  titel: string;
  /** Ein Halbsatz daneben, wo es einen braucht — „Hin- und Rückweg". */
  hinweis?: string;
  /** Die Formel, wie sie im Formelheft steht — „I = P / (U · cosφ)". */
  formel: string;
  /** Dieselbe rechte Seite mit eingesetzten Zahlen — „696 / (230 · 0,95)". */
  eingesetzt: string;
  wert: number;
  einheit: string;
  /** Wo das nachzuschlagen ist, wenn es dort steht. */
  quelle?: string;
};

type RwWeg = {
  titel: string;
  schritte: RwSchritt[];
  /** Der letzte Schritt noch einmal, als das, was gefragt war. */
  ergebnis: { wert: number; einheit: string; name: string };
  /** Eine zweite Rechnung, die dasselbe von der anderen Seite zeigt. */
  gegenprobe?: RwSchritt;
  /** Was angenommen wurde, ohne dass es in der Aufgabe stand. */
  annahmen: string[];
};

const Rechenweg = (() => {

  /**
   * Eine Zahl, wie ein Mensch sie schreibt.
   *
   * `toLocaleString` OHNE `maximumFractionDigits` rundet auf drei Nachkomma-
   * stellen — unabhängig davon, was `toFixed` vorher gemacht hat. Genau daran
   * ist die erste Fassung gescheitert: aus 0,0178 wurde „0,018".
   *
   * de-CH schreibt den Dezimaltrenner als Punkt und den Tausendertrenner als
   * Apostroph. Das ist nachgemessen und kein Versehen.
   */
  const zahl = (n: number): string => {
    if (!Number.isFinite(n)) return '—';
    const abs = Math.abs(n);
    const stellen = abs === 0 ? 0 : abs < 0.01 ? 5 : abs < 1 ? 4 : abs < 100 ? 3 : 1;
    return Number(n.toFixed(stellen))
      .toLocaleString('de-CH', { maximumFractionDigits: stellen });
  };

  /** Dieselbe Zahl zurück, wie sie GEZEIGT wird — für den zweiten Wächter. */
  const wieGezeigt = (n: number): number => {
    const t = zahl(n).replace(/[’']/g, '').replace(',', '.');
    const z = Number(t);
    return Number.isFinite(z) ? z : n;
  };

  /** Die rechte Seite einer Formel, oder sie ganz, wenn kein „=" darin steht. */
  const rechteSeite = (formel: string): string =>
    formel.includes('=') ? formel.slice(formel.indexOf('=') + 1).trim() : formel;

  /**
   * Namen durch Zahlen ersetzen — von LANG nach KURZ.
   *
   * Sonst macht „φ" aus „cosφ" eine Zahl und lässt „cos" stehen. Das ist kein
   * erfundener Fall: „cosφ" und „φ" stehen in derselben Formelsammlung.
   */
  const einsetzen = (formel: string, werte: RwWerte): string => {
    let raus = rechteSeite(formel);
    for (const name of Object.keys(werte).sort((a, b) => b.length - a.length))
      raus = raus.split(name).join(zahl(werte[name] as number));
    return raus;
  };

  /** Welcher Name steht in der Formel, aber nicht in den Werten? */
  const fehlende = (formel: string, werte: RwWerte): string[] => {
    let rest = rechteSeite(formel);
    for (const name of Object.keys(werte).sort((a, b) => b.length - a.length))
      rest = rest.split(name).join(' ');
    return rest.replace(/[\d\s.,()·+\-*/÷×√²³^%]/g, '').split('').filter(Boolean);
  };

  /**
   * Ein Schritt des Wegs.
   *
   * `rechnen` bekommt DIESELBEN Werte, die auch eingesetzt werden. Damit kann
   * die gezeigte Zeile nicht von der Rechnung abweichen — es gibt nur eine
   * Quelle für beide.
   */
  const schritt = (
    titel: string, formel: string, werte: RwWerte,
    rechnen: (v: RwWerte) => number, einheit: string,
    zusatz: { hinweis?: string; quelle?: string } = {}
  ): RwSchritt => {
    const offen = fehlende(formel, werte);
    if (offen.length) throw new Error(
      'In „' + formel + '" steht ' + offen.join('') + ', wofür kein Wert übergeben wurde.');

    const wert = rechnen(werte);

    /* Zweiter Wächter: dieselbe Rechnung mit den Zahlen, wie sie DASTEHEN. */
    const gerundet: RwWerte = {};
    for (const [k, v] of Object.entries(werte)) gerundet[k] = wieGezeigt(v);
    const nachgerechnet = rechnen(gerundet);
    const abweichung = wert === 0
      ? Math.abs(nachgerechnet)
      : Math.abs((nachgerechnet - wert) / wert);
    if (Number.isFinite(abweichung) && abweichung > 0.005) throw new Error(
      '„' + formel + '": nachgerechnet ergibt die gezeigte Zeile ' +
      zahl(nachgerechnet) + ' ' + einheit + ', danebensteht ' + zahl(wert) + ' ' +
      einheit + ' — die Zahlen sind zu kurz gerundet.');

    return {
      titel,
      ...(zusatz.hinweis ? { hinweis: zusatz.hinweis } : {}),
      formel,
      eingesetzt: einsetzen(formel, werte),
      wert,
      einheit,
      ...(zusatz.quelle ? { quelle: zusatz.quelle } : {})
    };
  };

  /* ======================================================================== *
   * DIE AUFGABEN
   * ------------------------------------------------------------------------ *
   * Eine Aufgabe ist mehr als eine Formel: sie hat eine Reihenfolge, eine
   * Gegenprobe und Annahmen. Der Spannungsfall ist die erste, weil sie in
   * Redurs Alltag jede Woche vorkommt und weil sie im abgenommenen Entwurf
   * ausgeschrieben steht.
   * ======================================================================== */

  /** Spezifischer Widerstand in Ω·mm²/m. */
  const RHO = { kupfer: 0.0178, aluminium: 0.0278 };

  /**
   * Spannungsfall einer Wechselstromleitung.
   *
   * Der Faktor 2 ist der Hin- UND Rückweg. Er wird gern vergessen, und dann
   * kommt die Hälfte heraus — deshalb steht er als Hinweis am Schritt und
   * nicht nur in der Formel.
   */
  const spannungsfall = (e: {
    leistungW: number; spannungV: number; cosPhi?: number;
    laengeM: number; querschnittMm2: number;
    werkstoff?: 'kupfer' | 'aluminium'; grenzeProzent?: number;
  }): RwWeg => {
    const cos = e.cosPhi === undefined ? 1 : e.cosPhi;
    const werkstoff = e.werkstoff || 'kupfer';
    const rho = RHO[werkstoff];
    const grenze = e.grenzeProzent === undefined ? 3 : e.grenzeProzent;

    const s1 = schritt('Strom aus der Leistung', 'I = P / (U · cosφ)',
      { P: e.leistungW, U: e.spannungV, 'cosφ': cos },
      v => (v['P'] as number) / ((v['U'] as number) * (v['cosφ'] as number)), 'A');

    const s2 = schritt('Widerstand der Leitung', 'R = ϱ · 2 · l / A',
      { 'ϱ': rho, l: e.laengeM, A: e.querschnittMm2 },
      v => (v['ϱ'] as number) * 2 * (v['l'] as number) / (v['A'] as number), 'Ω',
      { hinweis: 'Hin- und Rückweg' });

    const s3 = schritt('Spannungsfall', 'ΔU = I · R · cosφ',
      { I: s1.wert, R: s2.wert, 'cosφ': cos },
      v => (v['I'] as number) * (v['R'] as number) * (v['cosφ'] as number), 'V');

    const s4 = schritt('In Prozent', 'ΔU% = ΔU / U · 100',
      { 'ΔU': s3.wert, U: e.spannungV },
      v => (v['ΔU'] as number) / (v['U'] as number) * 100, '%');

    const probe = schritt('Gegenprobe über die Verlustleistung', 'PV = I² · R',
      { I: s1.wert, R: s2.wert },
      v => (v['I'] as number) ** 2 * (v['R'] as number), 'W');

    return {
      titel: 'Spannungsfall der Leitung',
      schritte: [s1, s2, s3, s4],
      ergebnis: { wert: s4.wert, einheit: '%', name: 'Spannungsfall' },
      gegenprobe: probe,
      annahmen: [
        'Werkstoff ' + (werkstoff === 'kupfer' ? 'Kupfer' : 'Aluminium') +
          ', ϱ = ' + zahl(rho) + ' Ω·mm²/m bei 20 °C',
        cos === 1 ? 'Rein ohmsche Last, cos φ = 1' : 'cos φ = ' + zahl(cos),
        'Zulässig sind ' + zahl(grenze) + ' %',
        /* EHRLICH BLEIBEN: das hier ist die Näherung aus dem Formelheft und
           nicht die vollständige Rechnung mit dem Blindanteil der Leitung.
           Für Installationsleitungen ist der Unterschied klein; ihn zu
           verschweigen wäre trotzdem falsch. */
        'Näherungsformel ohne den induktiven Anteil der Leitung'
      ]
    };
  };

  /** Hält die Leitung die Grenze? Eine Zeile, die man vorlesen kann. */
  const urteil = (weg: RwWeg, grenzeProzent = 3): { haelt: boolean; satz: string } => {
    const haelt = weg.ergebnis.wert <= grenzeProzent;
    return {
      haelt,
      satz: haelt
        ? zahl(weg.ergebnis.wert) + ' % von zulässigen ' + zahl(grenzeProzent) + ' % — hält'
        : zahl(weg.ergebnis.wert) + ' % über zulässigen ' + zahl(grenzeProzent) +
          ' % — zu viel, grösserer Querschnitt nötig'
    };
  };

  /**
   * Der Weg als Text, den man in eine Seite einfügen kann.
   *
   * Kein HTML: das ist der Text, den „als Text übernehmen" in ein Notizblatt
   * schreibt, und der muss in einem Editor lesbar bleiben, der kein Markup
   * kann. Die Darstellung auf dem Bildschirm baut ein Bereich; hier steht
   * nur, was drinsteht.
   */
  const alsText = (weg: RwWeg): string => {
    const zeilen = [weg.titel, ''];
    weg.schritte.forEach((s, i) => {
      zeilen.push((i + 1) + '. ' + s.titel + (s.hinweis ? ' (' + s.hinweis + ')' : ''));
      zeilen.push('   ' + s.formel);
      zeilen.push('   = ' + s.eingesetzt + ' = ' + zahl(s.wert) + ' ' + s.einheit);
      zeilen.push('');
    });
    if (weg.gegenprobe) {
      const g = weg.gegenprobe;
      zeilen.push(g.titel);
      zeilen.push('   ' + g.formel + ' = ' + g.eingesetzt + ' = ' + zahl(g.wert) + ' ' + g.einheit);
      zeilen.push('');
    }
    if (weg.annahmen.length) {
      zeilen.push('Angenommen:');
      weg.annahmen.forEach(a => zeilen.push('   · ' + a));
    }
    return zeilen.join('\n').trim();
  };

  return { schritt, zahl, einsetzen, spannungsfall, urteil, alsText, RHO };
})();

(window as any).Rechenweg = Rechenweg;
