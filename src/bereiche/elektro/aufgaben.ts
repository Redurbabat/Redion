/* ============================================================================
 * bereiche/elektro/aufgaben.ts — Übungen, die sich selbst erzeugen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/elektro/aufgaben.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/elektro/aufgaben.js`.
 * ----------------------------------------------------------------------------
 * WARUM KEINE AUFGABENSAMMLUNG
 *
 * Der naheliegende Weg wäre eine Liste: dreihundert Fragen, von Hand
 * geschrieben, mit Antworten daneben. Sie hat drei Nachteile, und der dritte
 * ist der schlimme.
 *
 *   Sie ist nach zwei Wochen durch. Wer sie zweimal gemacht hat, kennt die
 *   Reihenfolge und nicht den Stoff.
 *
 *   Sie veraltet. Kommt ein Symbol ins Register, fehlt es in den Aufgaben,
 *   und niemand merkt es — es fehlt ja nur eine Frage, die es nie gab.
 *
 *   Sie kann falsch sein. Eine von Hand geschriebene Antwort ist eine zweite
 *   Wahrheit neben der im Register. Zwei Wahrheiten laufen auseinander, und
 *   dann lernt jemand etwas Falsches und bekommt dafür einen Haken.
 *
 * Deshalb ERZEUGT dieses Modul die Aufgaben aus dem, was ohnehin da ist:
 *
 *   Register.fachzeichen     100 Symbole mit Namen, Gruppe, Anschlüssen
 *   Register.elektroformeln  ~50 Formeln, die sich lösen lassen
 *   Stromfluss               rechnet jede gezeichnete Schaltung
 *
 * Eine Frage nach dem Namen eines Symbols kann damit nicht falsch sein: die
 * Antwort kommt aus derselben Zeile, aus der die Palette den Namen nimmt.
 * Und kommt morgen ein Symbol dazu, gibt es morgen Fragen dazu.
 *
 * DER ZUFALL IST GESÄT
 *
 * `Math.random()` wäre bequem und würde jede Prüfung wertlos machen: eine
 * Aufgabe, die bei jedem Lauf anders ist, lässt sich nicht nachrechnen. Der
 * Zufall kommt deshalb aus einem Startwert. Derselbe Startwert gibt dieselbe
 * Aufgabe — im Prüflauf, im Unterricht und beim Nachbesprechen einer Prüfung.
 * ==========================================================================*/

const Elektroaufgaben = (() => {

  /* ------------------------------------------------------------------------
   * DER GESÄTE ZUFALL
   * ------------------------------------------------------------------------
   * mulberry32 — klein, schnell, und für Aufgaben mehr als gut genug. Er ist
   * kein Kryptozufall und soll keiner sein; er soll REPRODUZIERBAR sein.
   * ----------------------------------------------------------------------*/
  const wuerfel = (saat: number) => {
    let a = saat >>> 0;
    const naechste = (): number => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      /** Eine ganze Zahl von 0 bis `n-1`. */
      bis: (n: number): number => Math.floor(naechste() * n),
      /** Ein Element aus der Liste. */
      aus: <T>(liste: T[]): T => liste[Math.floor(naechste() * liste.length)]!,
      /** Die Liste gemischt — als Kopie, das Original bleibt heil. */
      misch: <T>(liste: T[]): T[] => {
        const k = liste.slice();
        for (let i = k.length - 1; i > 0; i--) {
          const j = Math.floor(naechste() * (i + 1));
          const h = k[i]!; k[i] = k[j]!; k[j] = h;
        }
        return k;
      },
      /** Eine „schöne" Zahl aus einem Bereich — Aufgaben mit 47,3819 Ω übt niemand. */
      wert: (von: number, bis: number): number => {
        const stufen = [1, 1.2, 1.5, 1.8, 2, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
        const kandidaten: number[] = [];
        for (let e = -3; e <= 6; e++)
          for (const s of stufen) {
            const w = s * Math.pow(10, e);
            if (w >= von && w <= bis) kandidaten.push(Number(w.toPrecision(3)));
          }
        if (!kandidaten.length) return Number(((von + bis) / 2).toPrecision(3));
        return kandidaten[Math.floor(naechste() * kandidaten.length)]!;
      }
    };
  };

  /* ------------------------------------------------------------------------
   * WAS EINE AUFGABE IST
   * ----------------------------------------------------------------------*/
  type Antwortart = 'wahl' | 'text' | 'zahl' | 'zeichnen' | 'zeigen';

  type Aufgabe = {
    /** Woher sie kommt — für den Prüfungsmodus und die Statistik. */
    art: string;
    /** Wie geantwortet wird. */
    antwortart: Antwortart;
    /** Die Frage im Klartext. */
    frage: string;
    /** Ein Symbol, das zur Frage gezeigt wird (Kennung aus `fachzeichen`). */
    zeichen?: string;
    /** Ein Plan, der zur Frage gezeigt wird. */
    plan?: any;
    /** Bei `wahl`: die Möglichkeiten, in gemischter Reihenfolge. */
    optionen?: string[];
    /** Bei `wahl`: Symbolkennungen zu den Möglichkeiten, wenn Bilder gezeigt werden. */
    optionZeichen?: string[];
    /** Die richtige Antwort. Bei `zahl` eine Zahl, sonst Text. */
    loesung: string;
    /** Bei `zahl`: erlaubte Abweichung in Prozent. */
    toleranz?: number;
    /** Die Einheit, in der geantwortet wird. */
    einheit?: string;
    /** Warum das die Antwort ist — wird NACH dem Antworten gezeigt. */
    erklaerung: string;
    /** Der Rechenweg, wenn es einen gibt. */
    weg?: string[];
    /** Wie schwer, 1 bis 3. Der Prüfungsmodus mischt danach. */
    stufe: number;
    /** Der Startwert, aus dem sie entstanden ist — macht sie wiederholbar. */
    saat: number;
  };

  /* Die Register geben `any` zurück, und aus `any[]` leitet `w.aus` ein
     `unknown` ab. Die Form wird deshalb HIER einmal benannt statt an zwanzig
     Stellen zugesichert — das ist die Grenze zum alten Code (CLAUDE.md §52),
     und sie gehört an eine Stelle. */
  type Zeichen = {
    id: string; name: string; gruppe: string; kennbuchstabe: string;
    erklaerung: string; anschluesse: Array<{ nr: string; x: number; y: number }>;
    [k: string]: unknown;
  };
  type Fachzeichen = {
    alle: () => Zeichen[]; holen: (id: string) => Zeichen | null;
    inGruppe: (g: string) => Zeichen[];
    gruppen: () => Array<[string, string, string]>;
    gruppenName: (g: string) => string;
  };
  type Formel = {
    id: string; kapitel: string; schreibweise: string; erklaerung: string;
    groessen: Array<{ zeichen: string; name: string; einheit: string }>;
    loese: Record<string, unknown>;
  };
  type Formeln = {
    alle: () => Formel[]; holen: (id: string) => Formel | null;
    loesbarNach: (id: string) => string[];
    rechne: (id: string, gesucht: string, werte: Record<string, number>) =>
      { ok: boolean; wert: number; weg?: string[]; fehler?: string };
  };

  const FZ = (): Fachzeichen | null =>
    (typeof Register !== 'undefined' && Register.fachzeichen)
      ? Register.fachzeichen as Fachzeichen : null;
  const FORMELN = (): Formeln | null =>
    (typeof Register !== 'undefined' && Register.elektroformeln)
      ? Register.elektroformeln as Formeln : null;

  /* ------------------------------------------------------------------------
   * DIE ARTEN
   * ------------------------------------------------------------------------
   * Jede Art ist eine Funktion, die aus einem Würfel eine Aufgabe macht.
   * Neue Arten tragen sich in `ARTEN` ein — dieselbe Regel wie bei den
   * Registern (CLAUDE.md §8): eine Liste, kein verstreutes Sonderfallgeflecht.
   * ----------------------------------------------------------------------*/
  type Macher = (w: ReturnType<typeof wuerfel>, saat: number) => Aufgabe | null;

  /** Symbol sehen, Namen wählen (Punkt 2). */
  const zeichenName: Macher = (w, saat) => {
    const fz = FZ(); if (!fz) return null;
    const alle = fz.alle();
    if (alle.length < 4) return null;
    const richtig = w.aus(alle);
    /* Die Ablenker kommen möglichst aus DERSELBEN Gruppe. Vier Symbole aus
       vier Gruppen sind keine Frage, sondern ein Bilderrätsel — der Schalter
       zwischen drei Motoren ist erkannt, bevor man ihn angesehen hat. */
    const nachbarn = fz.inGruppe(richtig.gruppe).filter((x: any) => x.id !== richtig.id);
    const fremde = alle.filter((x: any) => x.gruppe !== richtig.gruppe);
    const ablenker = w.misch(nachbarn).slice(0, 3);
    while (ablenker.length < 3 && fremde.length) {
      const k = w.aus(fremde);
      if (!ablenker.some((x: any) => x.id === k.id)) ablenker.push(k);
    }
    const auswahl = w.misch([richtig, ...ablenker]);
    return {
      art: 'zeichen-name', antwortart: 'wahl',
      frage: 'Wie heisst dieses Fachzeichen?',
      zeichen: richtig.id,
      optionen: auswahl.map((x: any) => x.name),
      loesung: richtig.name,
      erklaerung: richtig.erklaerung,
      stufe: nachbarn.length >= 3 ? 2 : 1, saat
    };
  };

  /** Namen lesen, Symbol wählen (Punkt 3) — die Gegenrichtung. */
  const nameZeichen: Macher = (w, saat) => {
    const fz = FZ(); if (!fz) return null;
    const alle = fz.alle();
    if (alle.length < 4) return null;
    const richtig = w.aus(alle);
    const nachbarn = fz.inGruppe(richtig.gruppe).filter((x: any) => x.id !== richtig.id);
    const ablenker = w.misch(nachbarn).slice(0, 3);
    while (ablenker.length < 3) {
      const k = w.aus(alle);
      if (k.id !== richtig.id && !ablenker.some((x: any) => x.id === k.id)) ablenker.push(k);
    }
    const auswahl = w.misch([richtig, ...ablenker]);
    return {
      art: 'name-zeichen', antwortart: 'wahl',
      frage: `Welches Zeichen ist „${richtig.name}"?`,
      optionen: auswahl.map((x: any) => x.name),
      optionZeichen: auswahl.map((x: any) => x.id),
      loesung: richtig.name,
      erklaerung: richtig.erklaerung,
      stufe: 2, saat
    };
  };

  /** Zu welcher Gruppe gehört es (Punkt 6). */
  const zeichenGruppe: Macher = (w, saat) => {
    const fz = FZ(); if (!fz) return null;
    const gruppen = fz.gruppen();
    if (gruppen.length < 4) return null;
    const richtig = w.aus(fz.alle());
    const andere = gruppen.filter((g: any) => g[0] !== richtig.gruppe);
    const auswahl = w.misch([richtig.gruppe, ...w.misch(andere).slice(0, 3).map((g: any) => g[0])]);
    return {
      art: 'zeichen-gruppe', antwortart: 'wahl',
      frage: `Zu welcher Gruppe gehört „${richtig.name}"?`,
      zeichen: richtig.id,
      optionen: auswahl.map((g: string) => fz.gruppenName(g)),
      loesung: fz.gruppenName(richtig.gruppe),
      erklaerung: `${richtig.name} steht bei „${fz.gruppenName(richtig.gruppe)}". ${richtig.erklaerung}`,
      stufe: 1, saat
    };
  };

  /** Die Anschlussnummern eines Bauteils (Punkt 58). */
  const anschluesse: Macher = (w, saat) => {
    const fz = FZ(); if (!fz) return null;
    /* Nur Bauteile, deren Nummern etwas bedeuten — bei einem Symbol mit
       „1" und „2" ist die Frage keine. */
    const taugt = fz.alle().filter((x: any) =>
      (x.anschluesse || []).length >= 2 &&
      (x.anschluesse || []).some((a: any) => a.nr && !/^[12]$/.test(a.nr)));
    if (taugt.length < 4) return null;
    const richtig = w.aus(taugt);
    const nummern = (richtig.anschluesse as any[]).map(a => a.nr).join(', ');
    /* Zwei verschiedene Bauteile können DIESELBE Anschlussliste haben — „1, 2"
       gibt es ein Dutzend Mal. Zwei gleich lautende Möglichkeiten sind keine
       Frage, sondern ein Fehler: was immer man anklickt, eine davon ist
       richtig und die Prüfung sagt trotzdem Nein. */
    const ablenker: string[] = [];
    for (const x of w.misch(taugt.filter(y => y.id !== richtig.id))) {
      const kandidat = (x.anschluesse as any[]).map(a => a.nr).join(', ');
      if (kandidat !== nummern && !ablenker.includes(kandidat)) ablenker.push(kandidat);
      if (ablenker.length === 3) break;
    }
    if (ablenker.length < 3) return null;
    const auswahl = w.misch([nummern, ...ablenker]);
    return {
      art: 'anschluesse', antwortart: 'wahl',
      frage: `Welche Anschlussnummern hat „${richtig.name}"?`,
      zeichen: richtig.id,
      optionen: auswahl,
      loesung: nummern,
      erklaerung: `${richtig.name} hat die Anschlüsse ${nummern}. ${richtig.erklaerung}`,
      stufe: 3, saat
    };
  };

  /** Das Kennbuchstabe-Spiel (Punkt 19 als Frage). */
  const kennbuchstabe: Macher = (w, saat) => {
    const fz = FZ(); if (!fz) return null;
    const mitBuchstabe = fz.alle().filter((x: any) => x.kennbuchstabe);
    if (mitBuchstabe.length < 4) return null;
    const richtig = w.aus(mitBuchstabe);
    const buchstaben = [...new Set(mitBuchstabe.map((x: any) => x.kennbuchstabe))] as string[];
    if (buchstaben.length < 4) return null;
    const auswahl = w.misch([richtig.kennbuchstabe,
      ...w.misch(buchstaben.filter(b => b !== richtig.kennbuchstabe)).slice(0, 3)]);
    return {
      art: 'kennbuchstabe', antwortart: 'wahl',
      frage: `Welchen Kennbuchstaben trägt „${richtig.name}" im Betriebsmittelkennzeichen?`,
      zeichen: richtig.id,
      optionen: auswahl,
      loesung: richtig.kennbuchstabe,
      erklaerung: `${richtig.name} bekommt den Kennbuchstaben ${richtig.kennbuchstabe} — ` +
        `also ${richtig.kennbuchstabe}1, ${richtig.kennbuchstabe}2 und so weiter.`,
      stufe: 2, saat
    };
  };

  /* ------------------------------------------------------------------------
   * RECHENAUFGABEN (Punkte 61–90)
   * ------------------------------------------------------------------------
   * Sie entstehen aus dem Formelregister: eine Formel wählen, eine gesuchte
   * Grösse wählen, für die übrigen schöne Werte würfeln — und die Antwort
   * vom Register selbst ausrechnen lassen.
   *
   * Das ist der Punkt: die Musterlösung wird nicht danebengeschrieben,
   * sondern GERECHNET, mit demselben Code, der auch im Formelheft rechnet.
   * Eine Aufgabe mit falscher Musterlösung kann so nicht entstehen.
   * ----------------------------------------------------------------------*/
  const BEREICHE: Record<string, [number, number]> = {
    U: [1, 400], I: [0.01, 63], R: [1, 100000], P: [1, 10000],
    t: [0.1, 24], W: [1, 100], l: [1, 200], A: [0.75, 35],
    n: [1, 20], f: [16, 400], C: [1e-6, 1e-3], L: [0.001, 1]
  };

  /**
   * Dasselbe noch einmal, aber nach der EINHEIT.
   *
   * Die Tabelle oben trifft `I`, aber nicht `I₁`, `I₂` oder `I_N` — und
   * genau die kommen in Reihen-, Parallel- und Drehstromformeln vor. Ohne
   * diese zweite Tabelle fielen sie in den Auffangbereich und ergaben
   * Aufgaben mit 254 Ampere. Die Einheit steht ohnehin an jeder Grösse, und
   * sie ist die verlässlichere Auskunft: was in Ampere gemessen wird, ist
   * ein Strom, wie auch immer sein Formelzeichen aussieht.
   */
  const BEREICH_EINHEIT: Record<string, [number, number]> = {
    V: [0.1, 1000], A: [1e-4, 100], Ω: [0.1, 1e6], W: [0.1, 20000],
    Hz: [1, 1000], s: [1e-3, 100000], F: [1e-9, 0.01], H: [1e-4, 10],
    'kWh': [0.01, 5000], 'mm²': [0.5, 240], m: [0.5, 1000], 'V/A': [0.1, 1e6]
  };

  const rechnen: Macher = (w, saat) => {
    const R = FORMELN(); if (!R) return null;
    const alle = R.alle().filter((f: any) => Object.keys(f.loese || {}).length);
    if (!alle.length) return null;

    /* Bis zu zwölf Versuche: nicht jede Würfelung ergibt eine sinnvolle
       Aufgabe (eine Division durch fast null, ein Ergebnis von 4e-9). Wer
       das nicht abfängt, stellt Fragen, die niemand beantworten kann. */
    for (let versuch = 0; versuch < 30; versuch++) {
      const f = w.aus(alle);
      const loesbar = R.loesbarNach(f.id) as string[];
      if (!loesbar.length) continue;
      const gesucht = w.aus(loesbar);
      const einheitVon = (z: string): string =>
        (f.groessen.find(g => g.zeichen === z) || { einheit: '' }).einheit || '';
      const werte: Record<string, number> = {};
      (f.groessen as any[]).forEach(g => {
        if (g.zeichen === gesucht) return;
        const b = BEREICHE[g.zeichen] || [1, 100];
        werte[g.zeichen] = w.wert(b[0], b[1]);
      });
      const erg = R.rechne(f.id, gesucht, werte);
      if (!erg || !erg.ok) continue;
      const wert = erg.wert;
      if (!Number.isFinite(wert)) continue;

      /* Und jetzt der Punkt, den der erste Entwurf übersehen hat: die
         EINZELNEN Werte waren plausibel (82 kΩ ist ein Widerstand, 3,9 A ist
         ein Strom), ihre KOMBINATION war es nicht — heraus kam eine Aufgabe
         mit 320 000 V. Wer so etwas rechnet, lernt nicht rechnen, sondern
         gewöhnt sich ab, das Ergebnis anzusehen. Und genau das Ansehen ist
         im Beruf die einzige Sicherung gegen einen Zahlendreher.

         Also muss auch das ERGEBNIS in seinem Bereich liegen. Der Bereich ist
         grosszügig gefasst (Faktor 3 nach beiden Seiten), damit es noch
         Aufgaben gibt — aber 320 kV fällt heraus. */
      /* Negative Ergebnisse fallen ganz weg. Keine der Grössen hier kann
         kleiner als null sein — ein Strom von −5,48 A ist kein schwieriger
         Fall, sondern ein Vorzeichen aus einer Formel, die in dieser
         Richtung nicht gemeint war. Im Unterricht ist er nur verwirrend. */
      if (wert <= 0) continue;

      /* Erst nach dem Formelzeichen, dann nach der Einheit. Beim Zeichen ist
         ein Faktor 3 Spielraum sinnvoll (die Tabelle nennt den ÜBLICHEN
         Bereich, nicht den möglichen); bei der Einheit nicht, denn die
         Bänder dort sind schon weit. Mit Spielraum kam 254 A durch, und
         254 A gibt es in keiner Lehrlingsaufgabe. */
      const nachZeichen = BEREICHE[gesucht];
      const nachEinheit = BEREICH_EINHEIT[einheitVon(gesucht)];
      if (nachZeichen) {
        if (wert < nachZeichen[0] / 3 || wert > nachZeichen[1] * 3) continue;
      } else if (nachEinheit) {
        if (wert < nachEinheit[0] || wert > nachEinheit[1]) continue;
      } else if (wert < 1e-6 || wert > 1e7) continue;

      const gegeben = (f.groessen as any[])
        .filter(g => g.zeichen !== gesucht)
        .map(g => `${g.zeichen} = ${werte[g.zeichen]} ${g.einheit}`.trim())
        .join(', ');

      const aufgabe: Aufgabe = {
        art: 'rechnen', antwortart: 'zahl',
        frage: `${f.schreibweise}\nGegeben: ${gegeben}\nGesucht: ${gesucht}`,
        loesung: String(Number(wert.toPrecision(6))),
        toleranz: 1,
        einheit: einheitVon(gesucht),
        erklaerung: f.erklaerung,
        stufe: f.groessen.length > 3 ? 3 : 2, saat
      };
      /* `weg` wird nur GESETZT, wenn es einen gibt — ein gesetztes undefined
         ist bei `exactOptionalPropertyTypes` etwas anderes als ein fehlendes
         Feld, und die Oberfläche fragt „gibt es einen Rechenweg?". */
      if (erg.weg && erg.weg.length) aufgabe.weg = erg.weg;
      return aufgabe;
    }
    return null;
  };

  /* ------------------------------------------------------------------------
   * EINHEITEN UMRECHNEN (Punkte 67–70)
   * ------------------------------------------------------------------------
   * Der Fehler, der im Beruf am meisten kostet, ist nicht die falsche Formel,
   * sondern das falsche Komma. 30 mA und 30 A trennen einen Fehlerstrom-
   * schutzschalter von einem Kabelbrand.
   * ----------------------------------------------------------------------*/
  const VORSAETZE: Array<[string, number]> = [
    ['p', 1e-12], ['n', 1e-9], ['µ', 1e-6], ['m', 1e-3], ['', 1],
    ['k', 1e3], ['M', 1e6], ['G', 1e9]
  ];
  const GROESSEN: Array<[string, string, string[]]> = [
    ['A', 'Strom',      ['µ', 'm', '', 'k']],
    ['V', 'Spannung',   ['m', '', 'k']],
    ['Ω', 'Widerstand', ['m', '', 'k', 'M']],
    ['W', 'Leistung',   ['m', '', 'k', 'M']],
    ['F', 'Kapazität',  ['p', 'n', 'µ', 'm']],
    ['H', 'Induktivität', ['µ', 'm', '']],
    ['Hz', 'Frequenz',  ['', 'k', 'M']],
    ['s', 'Zeit',       ['n', 'µ', 'm', '']]
  ];

  const faktor = (vorsatz: string): number =>
    (VORSAETZE.find(v => v[0] === vorsatz) || ['', 1])[1] as number;

  /** Zahl ohne Rundungsmüll — 0.1+0.2 darf hier nicht auftauchen. */
  const sauber = (x: number): number => Number(x.toPrecision(12));

  const umrechnen: Macher = (w, saat) => {
    const [einheit, name, erlaubt] = w.aus(GROESSEN);
    const von = w.aus(erlaubt);
    /* Höchstens ZWEI Stufen auseinander. „120 µA sind wie viel kA" stand hier
       im ersten Entwurf und ist keine Aufgabe aus dem Beruf, sondern eine
       Zehnerpotenz-Übung mit neun Nullen. Wer umrechnet, geht mA → A → kA —
       und der Fehler, der etwas kostet, passiert bei EINEM Schritt. */
    const abstand = (a: string, b: string) =>
      Math.abs(Math.log10(faktor(a) / faktor(b)));
    const nah = erlaubt.filter(x => x !== von && abstand(x, von) <= 6.5);
    if (!nah.length) return null;
    const nach = w.aus(nah);
    const zahl = w.wert(1, 1000);
    const wert = sauber(zahl * faktor(von) / faktor(nach));
    if (!Number.isFinite(wert) || wert === 0) return null;
    return {
      art: 'umrechnen', antwortart: 'zahl',
      frage: `${name}: ${zahl} ${von}${einheit} sind wie viel ${nach}${einheit}?`,
      loesung: String(wert),
      toleranz: 0.01,
      einheit: nach + einheit,
      erklaerung: `${von || 'Ohne Vorsatz'}${einheit} ist ${faktor(von)} ${einheit}, ` +
        `${nach || 'ohne Vorsatz'}${einheit} ist ${faktor(nach)} ${einheit}. ` +
        `Also mal ${sauber(faktor(von) / faktor(nach))}.`,
      /* Der Schritt „in die Grundeinheit" und der Schritt „in die Zieleinheit"
         sind derselbe, wenn das Ziel die Grundeinheit IST. Zweimal dieselbe
         Zeile sieht aus wie ein Fehler im Rechenweg. */
      weg: (nach === '')
        ? [`${zahl} ${von}${einheit}`,
           `= ${zahl} · ${faktor(von)} ${einheit}`,
           `= ${wert} ${einheit}`]
        : [`${zahl} ${von}${einheit}`,
           `= ${zahl} · ${faktor(von)} ${einheit} = ${sauber(zahl * faktor(von))} ${einheit}`,
           `= ${wert} ${nach}${einheit}`],
      stufe: Math.abs(Math.log10(faktor(von) / faktor(nach))) > 3 ? 3 : 2, saat
    };
  };

  /* ------------------------------------------------------------------------
   * SCHALTUNGSAUFGABEN (Punkte 51–60, 91–98)
   * ------------------------------------------------------------------------
   * Sie brauchen einen Plan, und der wird ebenfalls erzeugt — aus einer
   * Vorlage, aus der ein Stück entfernt wird. Die Musterlösung ist das, was
   * entfernt wurde; auch hier gibt es keine zweite Wahrheit.
   * ----------------------------------------------------------------------*/

  /** Baut einen kleinen Stromlaufplan aus einer Bauteilliste. */
  const planBauen = (teile: Array<[string, string]>,
                     draehte: Array<[number, string, number, string]>): any => {
    const SP = (typeof Schaltplan !== 'undefined') ? Schaltplan : null;
    if (!SP) return null;
    const plan = SP.neuerPlan('stromlauf-aufgeloest');
    plan.breite = 620; plan.hoehe = 360;
    plan.teile = []; plan.leitungen = []; plan.texte = [];
    /* Senkrecht gelesen: die Bauteile stehen in einer Spalte übereinander,
       weil dann jede Leitung eine gerade Strecke ist und keine zufällig
       durch einen fremden Anschluss läuft. Genau der Fehler ist beim ersten
       Bau von test239 §11 passiert. */
    teile.forEach(([zeichen, bmk], i) => {
      plan.teile.push({
        id: 't' + (i + 1), zeichen, bmk,
        x: 60 + (i % 3) * 180, y: 40 + Math.floor(i / 3) * 140,
        drehung: 0, gespiegelt: false, nummern: {}, gruppe: '', ebene: 'plan'
      });
    });
    const ort = (i: number, nr: string) => {
      const t = plan.teile[i];
      if (!t) return { x: 0, y: 0 };
      const a = SP.anschluesseVon(t).find((x: any) => x.nr === nr);
      return a ? { x: a.x, y: a.y } : { x: t.x, y: t.y };
    };
    draehte.forEach(([a, an, b, bn], i) => {
      const A = ort(a, an), B = ort(b, bn);
      /* Ein eigener Korridor je Leitung — sonst überlappen sich zwei und
         sind damit EINE. Die Simulation meldet das („überbrückt"), aber eine
         Aufgabe mit dieser Meldung ist eine kaputte Aufgabe. */
      const y = 20 + i * 12;
      const ta = plan.teile[a], tb = plan.teile[b];
      if (!ta || !tb) return;
      plan.leitungen.push({
        id: 'l' + (i + 1), ebene: 'plan',
        punkte: (A.x === B.x) ? [A, B] : [A, { x: A.x, y }, { x: B.x, y }, B],
        vonTeil: ta.id, vonNr: an, nachTeil: tb.id, nachNr: bn
      });
    });

    /* Und jetzt die Blattgrösse auf das ZUSAMMENSCHRUMPFEN, was wirklich
       darauf steht.
       -----------------------------------------------------------------
       Ohne das ist der Plan 620 × 360 gross, egal ob drei Bauteile darauf
       stehen oder zehn. In der Aufgabenspalte des Arbeitsplatzes — 280 px
       breit — wird daraus ein Bild, auf dem die Betriebsmittelkennzeichen
       drei Pixel hoch sind. Und die Frage lautet ausgerechnet „welches
       Betriebsmittel ist das?".

       Gemessen beim ersten Bild: die Zeichnung nutzte etwa ein Drittel der
       Fläche, der Rest war Luft, und die Luft wurde mitskaliert. */
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    const dazu = (x: number, y: number) => {
      if (x < x1) x1 = x; if (x > x2) x2 = x;
      if (y < y1) y1 = y; if (y > y2) y2 = y;
    };
    (plan.teile as any[]).forEach(t => {
      const m = (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen.masse(t.zeichen, t.drehung) : { w: 60, h: 60 };
      dazu(t.x, t.y);
      /* Rechts steht das Betriebsmittelkennzeichen NEBEN dem Symbol —
         `alsSvg` schreibt es bei `mass.w + 6`. Ohne diesen Zuschlag wäre es
         genau das, was abgeschnitten würde. */
      dazu(t.x + m.w + 34, t.y + m.h + 4);
    });
    (plan.leitungen as any[]).forEach(l =>
      (l.punkte as any[]).forEach(pt => dazu(pt.x, pt.y)));
    if (Number.isFinite(x1)) {
      const rand = 24;
      const dx = x1 - rand, dy = y1 - rand;
      (plan.teile as any[]).forEach(t => { t.x -= dx; t.y -= dy; });
      (plan.leitungen as any[]).forEach(l =>
        (l.punkte as any[]).forEach(pt => { pt.x -= dx; pt.y -= dy; }));
      plan.breite = Math.max(120, Math.round(x2 - x1 + rand * 2));
      plan.hoehe = Math.max(120, Math.round(y2 - y1 + rand * 2));
    }
    return plan;
  };

  /** Vorlagen für Schaltungsaufgaben — Bauteile, Drähte, Text. */
  const SCHALTUNGEN: Array<{
    name: string; wozu: string; stufe: number;
    teile: Array<[string, string]>;
    draehte: Array<[number, string, number, string]>;
  }> = [
    { name: 'Ausschaltung', wozu: 'Eine Leuchte von einer Stelle schalten.', stufe: 1,
      teile: [['wechselspannung', 'G1'], ['ch-schema0', 'S1'], ['lampe', 'E1']],
      draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'X1'], [2, 'X2', 0, 'N']] },
    { name: 'Serienschaltung zweier Leuchten',
      wozu: 'Zwei Leuchten in Reihe — beide bekommen die halbe Spannung.', stufe: 2,
      teile: [['wechselspannung', 'G1'], ['lampe', 'E1'], ['lampe', 'E2']],
      draehte: [[0, 'L', 1, 'X1'], [1, 'X2', 2, 'X1'], [2, 'X2', 0, 'N']] },
    { name: 'Parallelschaltung zweier Leuchten',
      wozu: 'Zwei Leuchten parallel — jede bekommt die volle Spannung.', stufe: 2,
      teile: [['wechselspannung', 'G1'], ['lampe', 'E1'], ['lampe', 'E2']],
      draehte: [[0, 'L', 1, 'X1'], [0, 'L', 2, 'X1'], [1, 'X2', 0, 'N'], [2, 'X2', 0, 'N']] },
    { name: 'Wechselschaltung (Schema 3)',
      wozu: 'Eine Leuchte von zwei Stellen schalten.', stufe: 2,
      teile: [['wechselspannung', 'G1'], ['ch-schema3', 'S1'], ['ch-schema3', 'S2'],
              ['lampe', 'E1']],
      draehte: [[0, 'L', 1, '3'], [1, '1', 2, '1'], [1, '2', 2, '2'],
                [2, '3', 3, 'X1'], [3, 'X2', 0, 'N']] },
    { name: 'Selbsthaltung', wozu: 'Start drücken, loslassen, das Schütz hält sich.', stufe: 3,
      teile: [['wechselspannung', 'G1'], ['taster-oeffner', 'S0'], ['taster-schliesser', 'S1'],
              ['schuetz-schliesser', 'K1'], ['spule', 'K1']],
      draehte: [[0, 'L', 1, '1'], [1, '2', 2, '3'], [1, '2', 3, '13'],
                [2, '4', 4, 'A1'], [3, '14', 4, 'A1'], [4, 'A2', 0, 'N']] },
    { name: 'Motor mit Schütz und Überlastrelais',
      wozu: 'Ein Motor wird nicht von Hand geschaltet, sondern über ein Schütz.', stufe: 3,
      teile: [['wechselspannung', 'G1'], ['leitungsschutzschalter', 'F1'],
              ['schuetz-hauptkontakt', 'K1'], ['motor-wechselstrom', 'M1']],
      draehte: [[0, 'L', 1, '1'], [1, '2', 2, '1'], [2, '2', 3, 'U1'],
                [3, 'U2', 0, 'N']] },
    /* --- Die Verknüpfungen (Punkt 95) ------------------------------------
       UND und ODER sind im Steuerstromkreis keine Theorie, sondern zwei
       Zeichnungen: hintereinander heisst UND, nebeneinander heisst ODER.
       Wer das einmal gezeichnet hat, braucht keine Wahrheitstabelle mehr. */
    { name: 'UND-Verknüpfung',
      wozu: 'Zwei Kontakte HINTEREINANDER: die Spule zieht nur an, wenn beide zu sind.',
      stufe: 2,
      teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
              ['taster-schliesser', 'S2'], ['spule', 'K1'], ['signalleuchte', 'H1']],
      draehte: [[0, 'L', 1, '3'], [1, '4', 2, '3'], [2, '4', 3, 'A1'],
                [3, 'A2', 0, 'N'], [2, '4', 4, 'X1'], [4, 'X2', 0, 'N']] },
    { name: 'ODER-Verknüpfung',
      wozu: 'Zwei Kontakte NEBENEINANDER: einer genügt, damit die Spule anzieht.',
      stufe: 2,
      teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
              ['taster-schliesser', 'S2'], ['spule', 'K1'], ['signalleuchte', 'H1']],
      draehte: [[0, 'L', 1, '3'], [0, 'L', 2, '3'], [1, '4', 3, 'A1'],
                [2, '4', 3, 'A1'], [3, 'A2', 0, 'N'], [3, 'A1', 4, 'X1'],
                [4, 'X2', 0, 'N']] },
    /* --- Zeitrelais und Meldung (Punkte 92, 96) --------------------------- */
    { name: 'Zeitrelais, anzugsverzögert',
      wozu: 'Nach dem Einschalten vergeht Zeit, bevor der Kontakt schliesst.',
      stufe: 3,
      teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
              ['spule-anzugsverzoegert', 'K1'], ['schuetz-schliesser', 'K1'],
              ['signalleuchte', 'H1']],
      draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'A1'], [2, 'A2', 0, 'N'],
                [0, 'L', 3, '13'], [3, '14', 4, 'X1'], [4, 'X2', 0, 'N']] },
    { name: 'Schützschaltung mit Meldeleuchte',
      wozu: 'Die Leuchte zeigt an, dass das Schütz angezogen hat.', stufe: 3,
      teile: [['wechselspannung', 'G1'], ['taster-oeffner', 'S0'],
              ['taster-schliesser', 'S1'], ['spule', 'K1'],
              ['schuetz-schliesser', 'K1'], ['signalleuchte', 'H1']],
      draehte: [[0, 'L', 1, '1'], [1, '2', 2, '3'], [2, '4', 3, 'A1'],
                [3, 'A2', 0, 'N'], [0, 'L', 4, '13'], [4, '14', 5, 'X1'],
                [5, 'X2', 0, 'N']] },
    /* --- Und zwei aus dem Schweizer Bauplan (Punkte 91, 97) --------------- */
    { name: 'Treppenhausautomat',
      wozu: 'Von mehreren Stellen drücken, das Licht geht nach einer Zeit von selbst aus.',
      stufe: 2,
      teile: [['wechselspannung', 'G1'], ['bp-minuterie', 'K1'],
              ['taster-schliesser', 'S1'], ['taster-schliesser', 'S2'],
              ['lampe', 'E1']],
      draehte: [[0, 'L', 1, '1'], [1, '2', 4, 'X1'], [4, 'X2', 0, 'N'],
                [0, 'L', 2, '3'], [0, 'L', 3, '3'], [2, '4', 1, '1'],
                [3, '4', 1, '1']] },
    { name: 'Sonnerie mit Drucktaster',
      wozu: 'Die Türklingel — der einfachste Kreis, den es im Haus gibt.', stufe: 1,
      teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
              ['bp-sonnerie', 'H1']],
      draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'X1'], [2, 'X2', 0, 'N']] }
  ];

  /** Welches Bauteil fehlt im Plan (Punkt 51). */
  const planLuecke: Macher = (w, saat) => {
    const fz = FZ(); if (!fz || typeof Schaltplan === 'undefined') return null;
    const v = w.aus(SCHALTUNGEN);
    const plan = planBauen(v.teile, v.draehte);
    if (!plan) return null;
    /* Ein Bauteil herausnehmen — aber nie die Quelle: ein Plan ohne Quelle
       ist keine Aufgabe, sondern ein Rätsel. */
    const wahl: Array<{ t: any; i: number }> = (plan.teile as any[])
      .map((t: any, i: number) => ({ t, i }))
      .filter(x => x.t.zeichen !== 'wechselspannung');
    if (!wahl.length) return null;
    const raus = w.aus(wahl);
    const fehlt = fz.holen(raus.t.zeichen);
    if (!fehlt) return null;
    plan.teile.splice(raus.i, 1);
    /* Und die Leitungen, die daran hingen — sonst zeigen sie ins Leere und
       die Aufgabe verrät durch die Lücke, was fehlt. */
    plan.leitungen = plan.leitungen.filter(
      (l: any) => l.vonTeil !== raus.t.id && l.nachTeil !== raus.t.id);

    /* Die Ablenker müssen an DIESER Stelle überhaupt stehen können. Beim
       ersten Bild lauteten drei von vier Möglichkeiten „Betätigung: Drücken",
       „Betätigung: Drehen" und „Betätigung: Schlüssel" — Beischriften ohne
       einen einzigen Anschluss. Sie stammten aus derselben Gruppe wie der
       gesuchte Schalter, und die Auswahl war damit keine Frage mehr: wer
       weiss, dass ein Bauteil Klemmen braucht, hat sie ohne Nachdenken.

       Also: mindestens zwei Anschlüsse, sonst kein Ablenker. */
    const anschliessbar = (x: Zeichen) => (x.anschluesse || []).length >= 2;
    const gleicheGruppe = fz.inGruppe(fehlt.gruppe)
      .filter(x => x.id !== fehlt.id && anschliessbar(x));
    const ablenker = w.misch(gleicheGruppe).slice(0, 3);
    const rest = w.misch(fz.alle().filter(anschliessbar));
    for (const k of rest) {
      if (ablenker.length >= 3) break;
      if (k.id !== fehlt.id && !ablenker.some(x => x.id === k.id)) ablenker.push(k);
    }
    if (ablenker.length < 3) return null;
    const auswahl = w.misch([fehlt, ...ablenker]);
    return {
      art: 'plan-luecke', antwortart: 'wahl',
      frage: `${v.name}: ${v.wozu}\nWelches Bauteil fehlt in diesem Plan (${raus.t.bmk})?`,
      plan,
      optionen: auswahl.map((x: any) => x.name),
      optionZeichen: auswahl.map((x: any) => x.id),
      loesung: fehlt.name,
      erklaerung: `${raus.t.bmk} ist ein ${fehlt.name}. ${fehlt.erklaerung}`,
      stufe: v.stufe, saat
    };
  };

  /** Was tut diese Schaltung (Punkt 55, umgekehrt). */
  const planFunktion: Macher = (w, saat) => {
    if (typeof Schaltplan === 'undefined') return null;
    const v = w.aus(SCHALTUNGEN);
    const plan = planBauen(v.teile, v.draehte);
    if (!plan) return null;
    const andere = w.misch(SCHALTUNGEN.filter(x => x.name !== v.name)).slice(0, 3);
    const auswahl = w.misch([v, ...andere]);
    return {
      art: 'plan-funktion', antwortart: 'wahl',
      frage: 'Was ist das für eine Schaltung?',
      plan,
      optionen: auswahl.map(x => x.name),
      loesung: v.name,
      erklaerung: v.wozu,
      stufe: v.stufe, saat
    };
  };

  /** Betriebsmittel benennen (Punkt 57). */
  const bmkBenennen: Macher = (w, saat) => {
    const fz = FZ(); if (!fz || typeof Schaltplan === 'undefined') return null;
    const v = w.aus(SCHALTUNGEN);
    const plan = planBauen(v.teile, v.draehte);
    if (!plan) return null;
    const t = w.aus(plan.teile as any[]);
    const zeichen = fz.holen(t.zeichen);
    if (!zeichen) return null;
    /* Vier Möglichkeiten, wie überall — eine Frage mit drei Antworten ist
       leichter als eine mit vier, und wer Aufgaben mischt, will sie gleich
       schwer. Schaltungen mit zu wenig Betriebsmitteln fallen deshalb weg. */
    const alleBmk = [...new Set((plan.teile as any[]).map(x => x.bmk))] as string[];
    if (alleBmk.length < 4) return null;
    return {
      art: 'bmk-benennen', antwortart: 'wahl',
      frage: `${v.name}: Welches Betriebsmittel ist der/die/das „${zeichen.name}"?`,
      plan,
      /* EINMAL mischen und dann entscheiden. Der erste Entwurf rief `w.misch`
         in der Bedingung und noch einmal im Zweig — und weil jeder Aufruf den
         Würfel weiterdreht, prüfte die Bedingung eine andere Mischung als die
         zurückgegebene. Die richtige Antwort hätte fehlen können. */
      optionen: w.misch([t.bmk, ...w.misch(alleBmk.filter(b => b !== t.bmk)).slice(0, 3)]),
      loesung: t.bmk,
      erklaerung: `${t.bmk} ist ${zeichen.name}. Der Kennbuchstabe ` +
        `${zeichen.kennbuchstabe} sagt schon, um welche Art Bauteil es geht.`,
      stufe: 2, saat
    };
  };

  /**
   * Messaufgabe (Punkt 98): wohin gehört das Messgerät?
   *
   * Das ist die Frage, bei der im Beruf etwas kaputtgeht. Ein Amperemeter
   * parallel zur Last ist ein Kurzschluss über das Messgerät — deshalb steht
   * es hier als eigene Art und nicht als eine Wahlmöglichkeit unter vielen.
   */
  const messenWo: Macher = (w, saat) => {
    const geraet = w.aus(['Amperemeter', 'Voltmeter']);
    const strom = geraet === 'Amperemeter';
    const optionen = w.misch([
      'in Reihe mit dem Verbraucher',
      'parallel zum Verbraucher',
      'zwischen L und PE',
      'parallel zur Quelle und in Reihe zum Verbraucher zugleich'
    ]);
    return {
      art: 'messen-wo', antwortart: 'wahl',
      frage: `Wie wird ein ${geraet} angeschlossen?`,
      optionen,
      loesung: strom ? 'in Reihe mit dem Verbraucher' : 'parallel zum Verbraucher',
      erklaerung: strom
        ? 'Ein Amperemeter misst den Strom, der DURCH es hindurchfliesst — es muss ' +
          'also im Stromweg liegen. Sein Innenwiderstand ist fast null; parallel ' +
          'geschaltet wäre es ein Kurzschluss.'
        : 'Ein Voltmeter misst den Unterschied ZWISCHEN zwei Punkten — es liegt ' +
          'also daneben. Sein Innenwiderstand ist sehr hoch; in Reihe geschaltet ' +
          'würde es den Stromkreis unterbrechen.',
      stufe: 2, saat
    };
  };

  /** Alle Arten, die es gibt. Neue tragen sich hier ein (§8). */
  const ARTEN: Array<{ id: string; name: string; gruppe: string; mach: Macher }> = [
    { id: 'zeichen-name',   name: 'Zeichen benennen',      gruppe: 'Fachzeichen', mach: zeichenName },
    { id: 'name-zeichen',   name: 'Zeichen erkennen',      gruppe: 'Fachzeichen', mach: nameZeichen },
    { id: 'zeichen-gruppe', name: 'Gruppe zuordnen',       gruppe: 'Fachzeichen', mach: zeichenGruppe },
    { id: 'anschluesse',    name: 'Anschlüsse kennen',     gruppe: 'Fachzeichen', mach: anschluesse },
    { id: 'kennbuchstabe',  name: 'Kennbuchstaben',        gruppe: 'Fachzeichen', mach: kennbuchstabe },
    { id: 'rechnen',        name: 'Rechnen',               gruppe: 'Rechnen',     mach: rechnen },
    { id: 'umrechnen',      name: 'Einheiten umrechnen',   gruppe: 'Rechnen',     mach: umrechnen },
    { id: 'plan-luecke',    name: 'Fehlendes Bauteil',     gruppe: 'Schaltungen', mach: planLuecke },
    { id: 'plan-funktion',  name: 'Schaltung erkennen',    gruppe: 'Schaltungen', mach: planFunktion },
    { id: 'bmk-benennen',   name: 'Betriebsmittel finden', gruppe: 'Schaltungen', mach: bmkBenennen },
    { id: 'messen-wo',      name: 'Richtig messen',        gruppe: 'Messen',      mach: messenWo }
  ];

  const artVon = (id: string) => ARTEN.find(a => a.id === id) || null;
  const gruppen = (): string[] => [...new Set(ARTEN.map(a => a.gruppe))];

  /**
   * Eine Aufgabe erzeugen.
   *
   * `saat` macht sie wiederholbar: derselbe Startwert gibt dieselbe Aufgabe.
   * Ohne Startwert wird einer gezogen — dann steht er im Ergebnis, sodass man
   * dieselbe Aufgabe später wieder herstellen kann.
   */
  const erzeuge = (artId?: string, saat?: number): Aufgabe | null => {
    const s = (typeof saat === 'number') ? saat : Math.floor(Math.random() * 2147483647);
    const w = wuerfel(s);
    const art = artId ? artVon(artId) : null;
    if (artId && !art) return null;
    /* Ohne Wunsch: eine Art würfeln. Schlägt sie fehl (weil ein Register
       fehlt), die nächste versuchen — statt nichts zu liefern. */
    /* Eine Art darf `null` liefern, wenn die Würfelung keine FAIRE Aufgabe
       ergibt — etwa wenn eine Schaltung zu wenig Betriebsmittel für vier
       Antwortmöglichkeiten hat. Dann wird mit einem anderen Startwert
       weitergewürfelt und nicht aufgegeben: wer „Betriebsmittel finden"
       auswählt, bekommt sonst einen leeren Bildschirm und weiss nicht, ob
       die App kaputt ist oder er etwas falsch gemacht hat. */
    if (art) {
      for (let i = 0; i < 40; i++) {
        const versuchSaat = s + i * 7919;
        const a = art.mach(wuerfel(versuchSaat), versuchSaat);
        if (a) return a;
      }
      return null;
    }
    for (const k of w.misch(ARTEN)) {
      for (let i = 0; i < 8; i++) {
        const versuchSaat = s + i * 7919;
        const a = k.mach(wuerfel(versuchSaat), versuchSaat);
        if (a) return a;
      }
    }
    return null;
  };

  /**
   * Eine Reihe von Aufgaben — für den Prüfungsmodus (Punkt 99).
   *
   * Die Arten werden REIHUM genommen und nicht gewürfelt: bei zehn Aufgaben
   * aus vier Arten will man vier Arten sehen und nicht siebenmal dieselbe.
   * Das ist der Unterschied zwischen einer Prüfung und einem Glücksspiel.
   */
  const reihe = (anzahl: number, opt: {
    arten?: string[]; saat?: number; stufe?: number;
  } = {}): Aufgabe[] => {
    const s0 = (typeof opt.saat === 'number') ? opt.saat
             : Math.floor(Math.random() * 2147483647);
    const w = wuerfel(s0);
    const erlaubt = (opt.arten && opt.arten.length)
      ? ARTEN.filter(a => opt.arten!.includes(a.id))
      : ARTEN;
    if (!erlaubt.length) return [];
    const reihenfolge = w.misch(erlaubt);
    const raus: Aufgabe[] = [];
    let versuche = 0;
    while (raus.length < anzahl && versuche < anzahl * 12) {
      const art = reihenfolge[raus.length % reihenfolge.length]!;
      const a = art.mach(wuerfel(s0 + versuche * 7919), s0 + versuche * 7919);
      versuche++;
      if (!a) continue;
      if (opt.stufe && a.stufe !== opt.stufe) continue;
      /* Keine zwei gleichen Fragen in einer Prüfung. */
      if (raus.some(x => x.frage === a.frage)) continue;
      raus.push(a);
    }
    return raus;
  };

  /**
   * Eine Antwort prüfen.
   *
   * Bei Zahlen wird mit Toleranz verglichen und das Komma als Dezimaltrenner
   * angenommen — wer „0,5" tippt, meint eine halbe und nicht fünf.
   */
  const pruefe = (aufgabe: Aufgabe, antwort: unknown): {
    richtig: boolean; hinweis: string;
  } => {
    if (!aufgabe) return { richtig: false, hinweis: 'Keine Aufgabe.' };
    const roh = String(antwort ?? '').trim();
    if (!roh) return { richtig: false, hinweis: 'Da steht noch nichts.' };

    if (aufgabe.antwortart === 'zahl') {
      const zahl = Number(roh.replace(',', '.').replace(/\s/g, ''));
      if (!Number.isFinite(zahl))
        return { richtig: false, hinweis: 'Das ist keine Zahl.' };
      const soll = Number(aufgabe.loesung);
      const tol = (aufgabe.toleranz ?? 1) / 100;
      const richtig = Math.abs(zahl - soll) <= Math.abs(soll) * tol + 1e-12;
      if (richtig) return { richtig: true, hinweis: 'Richtig.' };
      /* Der häufigste Fehler ist ein Faktor tausend. Das zu SAGEN ist mehr
         wert als ein rotes Kreuz: der Rechenweg war richtig, das Komma nicht. */
      const verhaeltnis = soll !== 0 ? zahl / soll : 0;
      for (const [name, f] of [['tausendmal zu gross', 1000], ['tausendmal zu klein', 0.001],
                               ['hundertmal zu gross', 100], ['hundertmal zu klein', 0.01],
                               ['zehnmal zu gross', 10], ['zehnmal zu klein', 0.1]] as
                              Array<[string, number]>) {
        if (Math.abs(verhaeltnis - f) <= f * 0.02)
          return { richtig: false,
                   hinweis: `Fast — der Wert ist ${name}. Sieh dir die Einheit an.` };
      }
      return { richtig: false, hinweis: `Richtig wäre ${aufgabe.loesung} ${aufgabe.einheit || ''}`.trim() };
    }

    const gleich = roh.toLowerCase() === String(aufgabe.loesung).toLowerCase();
    return gleich
      ? { richtig: true, hinweis: 'Richtig.' }
      : { richtig: false, hinweis: `Richtig wäre „${aufgabe.loesung}".` };
  };

  return { ARTEN, artVon, gruppen, erzeuge, reihe, pruefe,
           SCHALTUNGEN, planBauen, wuerfel };
})();

(window as any).Elektroaufgaben = Elektroaufgaben;
