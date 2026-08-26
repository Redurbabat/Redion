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
  /**
 * `wege` ist die einzige Antwortart, bei der IN den Plan getippt wird: die
 * Antwort ist eine MENGE von Leitungskennungen, aufsteigend sortiert und mit
 * Komma verbunden. Sortiert, weil die Reihenfolge des Antippens keine
 * Bedeutung hat und ein Vergleich sonst von ihr abhinge.
 */
type Antwortart = 'wahl' | 'text' | 'zahl' | 'zeichnen' | 'zeigen' | 'wege';

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
    /**
     * Die Schalterstellungen, für die die Antwort gilt — Teilkennung → Nummer.
     *
     * Sie stehen zusätzlich im Fragetext („S1: offen, S2: geschlossen"),
     * weil die Zeichnung sie NICHT zeigt: ein Schalter hat im Register nur
     * einen Pfad und sieht offen wie geschlossen gleich aus (L61). Als
     * Daten stehen sie hier, damit ein Prüflauf die Antwort nachrechnen
     * kann, ohne den Fragetext zu zerpflücken.
     */
    stellungen?: Record<string, number>;
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

  /**
   * Baut einen kleinen Stromlaufplan aus einer Bauteilliste.
   *
   * DER WEG DER LEITUNGEN IST DAS GANZE PROBLEM.
   * -------------------------------------------------------------------------
   * Der erste Entwurf legte jede Leitung in einen eigenen waagrechten Korridor
   * bei `y = 20 + i · 12` und die Bauteile in ein Raster darüber und darunter.
   * Das sah auf dem Bild ordentlich aus — und war elektrisch Unsinn: die
   * Korridore liefen mitten durch die Bauteilreihe, und eine Leitung, die
   * durch einen Anschluss läuft, IST mit ihm verbunden.
   *
   * Nachgemessen mit `Stromfluss` waren ZEHN von zwölf Schaltungen an der
   * Quelle kurzgeschlossen und zwei überbrückt. Aufgefallen ist es erst, als
   * eine Aufgabenart die Schaltung wirklich rechnen musste: „Leuchtet es?"
   * sagte bei einer richtig gestellten Wechselschaltung Nein.
   *
   * Deshalb jetzt eine Führung, die es nicht KANN:
   *
   *   · Alle Bauteile stehen in EINER Reihe, 200 px auseinander. Damit hat
   *     kein Anschluss dieselbe x-Stelle wie ein anderer — ein Bauteil ist
   *     höchstens 60 breit.
   *   · Über der Reihe und unter ihr liegt je ein BAND, in dem kein Bauteil
   *     steht. Jede Leitung bekommt darin ihre eigene Höhe.
   *   · Ein Anschluss OBEN am Bauteil wird nach oben herausgeführt, einer
   *     UNTEN nach unten. Nie durch das eigene Bauteil hindurch — das war
   *     der zweite Weg, auf dem ein Schalter überbrückt wurde.
   *   · Muss eine Leitung von oben nach unten, geht sie über eine freie
   *     Spalte rechts neben allen Bauteilen.
   *
   * Zwei Leitungen kreuzen sich dabei durchaus. Das ist erlaubt und richtig:
   * `Stromfluss` verbindet nur, wo ein PUNKT auf einer Strecke liegt, nicht
   * wo sich zwei Strecken schneiden — genau der Unterschied zwischen
   * Verbindungspunkt und Kreuzung, den jeder Schaltplan kennt.
   */
  const planBauen = (teile: Array<[string, string]>,
                     draehte: Array<[number, string, number, string]>): any => {
    const SP = (typeof Schaltplan !== 'undefined') ? Schaltplan : null;
    if (!SP) return null;
    const plan = SP.neuerPlan('stromlauf-aufgeloest');
    plan.teile = []; plan.leitungen = []; plan.texte = [];

    const REIHE_Y = 260;          /* Oberkante der Bauteilreihe */
    const ABSTAND = 200;          /* zwischen zwei Bauteilen */
    teile.forEach(([zeichen, bmk], i) => {
      plan.teile.push({
        id: 't' + (i + 1), zeichen, bmk,
        x: 60 + i * ABSTAND, y: REIHE_Y,
        drehung: 0, gespiegelt: false, nummern: {}, gruppe: '', ebene: 'plan'
      });
    });

    /* Wie hoch ist das höchste Bauteil? Darunter beginnt das untere Band. */
    let maxH = 60;
    (plan.teile as any[]).forEach(t => {
      const m = (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen.masse(t.zeichen, 0) : { w: 60, h: 60 };
      if (m.h > maxH) maxH = m.h;
    });
    const UNTEN_Y = REIHE_Y + maxH;
    const rechts = 60 + teile.length * ABSTAND + 40;   /* freie Spalte */

    const ort = (i: number, nr: string) => {
      const t = plan.teile[i];
      if (!t) return { x: 0, y: 0, obenDran: true };
      const a = (SP.anschluesseVon(t) as any[]).find(x => x.nr === nr);
      if (!a) return { x: t.x, y: t.y, obenDran: true };
      /* Sitzt der Anschluss in der oberen oder in der unteren Hälfte? Danach
         richtet sich, wohin er herausgeführt wird. */
      return { x: a.x, y: a.y, obenDran: (a.y - t.y) < maxH / 2 };
    };

    draehte.forEach(([a, an, b, bn], i) => {
      const A = ort(a, an), B = ort(b, bn);
      const ta = plan.teile[a], tb = plan.teile[b];
      if (!ta || !tb) return;
      /* Eigene Höhe je Leitung, damit sich zwei nie überlagern — und mit
         Abstand von der Reihe, damit keine an einem Bauteil entlangläuft. */
      const obenBahn  = REIHE_Y - 40 - i * 16;
      const untenBahn = UNTEN_Y + 40 + i * 16;

      let punkte: Array<{ x: number; y: number }>;
      if (A.x === B.x && A.obenDran === B.obenDran) {
        punkte = [{ x: A.x, y: A.y }, { x: B.x, y: B.y }];
      } else if (A.obenDran && B.obenDran) {
        punkte = [{ x: A.x, y: A.y }, { x: A.x, y: obenBahn },
                  { x: B.x, y: obenBahn }, { x: B.x, y: B.y }];
      } else if (!A.obenDran && !B.obenDran) {
        punkte = [{ x: A.x, y: A.y }, { x: A.x, y: untenBahn },
                  { x: B.x, y: untenBahn }, { x: B.x, y: B.y }];
      } else {
        /* Von oben nach unten: aussen herum, über die freie Spalte rechts. */
        const oben = A.obenDran ? A : B;
        const unten = A.obenDran ? B : A;
        const spalte = rechts + i * 16;
        punkte = [
          { x: oben.x, y: oben.y }, { x: oben.x, y: obenBahn },
          { x: spalte, y: obenBahn }, { x: spalte, y: untenBahn },
          { x: unten.x, y: untenBahn }, { x: unten.x, y: unten.y }
        ];
      }
      plan.leitungen.push({
        id: 'l' + (i + 1), ebene: 'plan', punkte,
        vonTeil: ta.id, vonNr: an, nachTeil: tb.id, nachNr: bn
      });
    });

    /* Und jetzt die Blattgrösse auf das ZUSAMMENSCHRUMPFEN, was wirklich
       darauf steht.
       -----------------------------------------------------------------
       Ohne das ist der Plan so gross wie das Vorgabeblatt, egal ob drei
       Bauteile darauf stehen oder zehn. In der Aufgabenspalte des
       Arbeitsplatzes — 280 px breit — wird daraus ein Bild, auf dem die
       Betriebsmittelkennzeichen drei Pixel hoch sind. Und die Frage lautet
       ausgerechnet „welches Betriebsmittel ist das?". */
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

  /**
   * Eine Brücke über zwei Klemmen desselben Bauteils — SICHTBAR gezeichnet.
   *
   * Warum das eine eigene Funktion ist und nicht drei Zeilen an drei Stellen:
   * weil es an allen drei Stellen zuerst falsch war. Die Brücke wurde mit
   * Punkten weit ausserhalb des Blattes eingetragen — {-900,-900} —, weil die
   * Simulation über die KLEMMENANGABE verbindet und die Geometrie dafür nicht
   * braucht. Gerechnet stimmte alles. Nur im Bild war nichts zu sehen.
   *
   * Eine Aufgabe „diese Leuchte ist überbrückt — leuchtet sie?" über einen
   * Plan, in dem die Brücke fehlt, ist nicht schwer, sondern unlösbar. Kein
   * Prüflauf konnte das melden: er las dieselbe Netzliste wie die Simulation,
   * und die war richtig. Gesehen hat es erst ein Bildschirmfoto (§55).
   *
   * Der Weg führt unter dem Bauteil herum, auf einer Bahn UNTERHALB aller
   * Bahnen, die `planBauen` vergeben hat. Eine reine Kreuzung verbindet in
   * `Stromfluss.netze` nichts; nur ein Knick auf einer fremden Strecke tut
   * es, und den kann es dort unten nicht geben.
   */
  const bruecke = (plan: any, teil: any, vonNr: string, nachNr: string,
                   id: string): boolean => {
    if (typeof Schaltplan === 'undefined') return false;
    const kl = Schaltplan.anschluesseVon(teil) as any[];
    const a = kl.find(k => String(k.nr) === vonNr);
    const b = kl.find(k => String(k.nr) === nachNr);
    if (!a || !b) return false;
    let tiefste = 0;
    (plan.leitungen as any[]).forEach(l =>
      (l.punkte as any[]).forEach(pt => { if (pt.y > tiefste) tiefste = pt.y; }));
    const bahn = Math.max(tiefste, a.y, b.y) + 26;
    plan.leitungen.push({ id, ebene: 'plan',
      punkte: [{ x: a.x, y: a.y }, { x: a.x, y: bahn },
               { x: b.x, y: bahn }, { x: b.x, y: b.y }],
      vonTeil: teil.id, vonNr, nachTeil: teil.id, nachNr });
    /* Das Blatt wurde beim Bauen auf seinen Inhalt geschrumpft. Wächst der
       Inhalt danach, muss das Blatt mitwachsen — sonst wird genau die neue
       Leitung abgeschnitten. */
    plan.hoehe = Math.max(Number(plan.hoehe) || 0, Math.round(bahn + 24));
    return true;
  };

  /** Eine Beschriftung an ein Bauteil schreiben (nutzt Punkt 47). */
  const anschreiben = (plan: any, teil: any, text: string, id: string): void => {
    if (!Array.isArray(plan.texte)) plan.texte = [];
    plan.texte.push({ id, ebene: 'plan', x: teil.x, y: teil.y - 10, t: text });
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
    /* Zwei Zweige, jeder mit eigenem Schalter. Der Fall, an dem sich zeigt,
       ob jemand einen Plan liest oder nur die Umrisse erkennt: bei einem
       offenen und einem geschlossenen Schalter ist der halbe Plan ohne
       Wirkung, und man sieht es ihm nicht an.
       Dazugekommen, weil `plan-stromweg` sonst nur zwei Schaltungen ergab:
       fast alle anderen sind eine einzige Reihe, und in einer Reihe liegt
       entweder jede Leitung auf dem Weg oder keine. */
    { name: 'Zwei Leuchten, je ein eigener Schalter',
      wozu: 'Zwei Zweige nebeneinander — jeder Schalter bedient nur seinen.',
      stufe: 2,
      teile: [['wechselspannung', 'G1'], ['ch-schema0', 'S1'], ['lampe', 'E1'],
              ['ch-schema0', 'S2'], ['lampe', 'E2']],
      draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'X1'], [2, 'X2', 0, 'N'],
                [0, 'L', 3, '3'], [3, '4', 4, 'X1'], [4, 'X2', 0, 'N']] },
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
    /* Der erste Entwurf führte L ZUSÄTZLICH direkt auf Klemme 1 der Minuterie.
       Damit lagen die Taster zwischen L und L und schalteten nichts — die
       Simulation meldete es als „überbrückt", und sie hatte recht. Der
       Treppenhausautomat wird hier deshalb so gezeichnet, wie er ist: die
       Taster SIND der einzige Weg zur Minuterie. */
    { name: 'Treppenhausautomat',
      wozu: 'Von mehreren Stellen drücken, das Licht geht nach einer Zeit von selbst aus.',
      stufe: 2,
      teile: [['wechselspannung', 'G1'], ['bp-minuterie', 'K1'],
              ['taster-schliesser', 'S1'], ['taster-schliesser', 'S2'],
              ['lampe', 'E1']],
      draehte: [[0, 'L', 2, '3'], [0, 'L', 3, '3'],
                [2, '4', 1, '1'], [3, '4', 1, '1'],
                [1, '2', 4, 'X1'], [4, 'X2', 0, 'N']] },
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

  /* ------------------------------------------------------------------------
   * AUFGABEN, DIE DIE SIMULATION BEANTWORTET (Punkte 52, 53, 59)
   * ------------------------------------------------------------------------
   * Bis hierher kam die Musterlösung aus dem Register. Bei diesen drei kommt
   * sie aus `Stromfluss` — und das ist eine Stufe stärker: die Aufgabe wird
   * GEBAUT, dann GERECHNET, und was herauskommt, ist die Antwort. Es gibt
   * keine Stelle, an der jemand eine falsche Lösung hätte hinschreiben
   * können, weil niemand eine hinschreibt.
   *
   * Und mehr noch: eine Aufgabe, die nicht funktioniert, wird verworfen. Ein
   * eingebauter Fehler, der die Schaltung nicht kaputtmacht, ist kein Fehler
   * — und wird nicht gestellt.
   * ----------------------------------------------------------------------*/

  const SF = () => (typeof Stromfluss !== 'undefined') ? Stromfluss : null;

  /**
   * Die Schalterstellung suchen, bei der die Schaltung TUT, was sie soll.
   *
   * „Alle Schalter auf die letzte Stellung" klingt wie „alle zu" und ist es
   * nicht: bei einem Öffner ist die letzte Stellung OFFEN, und ein
   * Steuerstromkreis mit gedrücktem Not-Halt leuchtet zu Recht nicht. Eine
   * Aufgabe, die daraufhin verworfen wird, ist eine Aufgabe zu wenig.
   *
   * Gesucht wird deshalb gierig: jeden Schalter der Reihe nach durchprobieren
   * und die Stellung behalten, die es heller macht. Zwei Durchgänge, weil
   * eine Selbsthaltung erst zündet, wenn zwei Schalter zugleich stimmen.
   */
  const besteStellung = (plan: any): Record<string, number> => {
    const sf = SF();
    const stand: Record<string, number> = {};
    if (!sf) return stand;
    const schalter = (plan.teile as any[]).filter(t => sf.stellungenVon(t.zeichen).length > 1);
    /* Bewertet wird die WIRKUNG, nicht die Helligkeit: sonst fände die Suche
       bei einer Selbsthaltung nie eine Stellung, weil dort nichts leuchtet. */
    const hellMit = (s: Record<string, number>): number => {
      const e = leuchtet(plan, s);
      if (!e.ok) return -1;
      return e.hell + Math.min(1, e.strom * 10);
    };
    for (let runde = 0; runde < 2; runde++) {
      schalter.forEach(t => {
        const st = sf.stellungenVon(t.zeichen);
        let beste = stand[t.id] ?? 0;
        let bestHell = hellMit(Object.assign({}, stand, { [t.id]: beste }));
        for (let i = 0; i < st.length; i++) {
          const h = hellMit(Object.assign({}, stand, { [t.id]: i }));
          if (h > bestHell) { bestHell = h; beste = i; }
        }
        stand[t.id] = beste;
      });
    }
    return stand;
  };

  /**
   * Tut diese Schaltung etwas, bei diesen Schalterstellungen?
   *
   * „Leuchtet es" ist die anschauliche Frage, aber nicht die allgemeine: eine
   * Selbsthaltung treibt eine Spule, ein Motorabgang einen Motor, und beide
   * haben keine Helligkeit. Zurückgegeben wird deshalb BEIDES — die grösste
   * Helligkeit und der grösste Strom durch einen Verbraucher. `wirkt` fasst
   * es zusammen: die Schaltung tut etwas.
   */
  const leuchtet = (plan: any, stellung: Record<string, number>): {
    ok: boolean; hell: number; strom: number; quellStrom: number;
    wirkt: boolean; warnungen: number; texte: string[];
  } => {
    const sf = SF();
    if (!sf) return { ok: false, hell: 0, strom: 0, quellStrom: 0, wirkt: false, warnungen: 0, texte: [] };
    const e = sf.rechne(plan, stellung);
    if (!e || !e.ok) return { ok: false, hell: 0, strom: 0, quellStrom: 0, wirkt: false,
                              warnungen: 1, texte: [String((e && e.fehler) || '')] };
    let hell = 0, strom = 0, quellStrom = 0;
    (plan.teile as any[]).forEach(t => {
      const vh = sf.verhalten(t.zeichen);
      if (!vh || vh.art !== 'quelle') return;
      const w3 = e.werte[t.id];
      if (w3) quellStrom = Math.max(quellStrom, Math.abs(w3.I));
    });
    (plan.teile as any[]).forEach(t => {
      const vh = sf.verhalten(t.zeichen);
      if (!vh || (vh.art !== 'widerstand' && vh.art !== 'spule')) return;
      const w2 = e.werte[t.id];
      if (!w2) return;
      if (typeof w2.helligkeit === 'number' && w2.helligkeit > hell) hell = w2.helligkeit;
      const i = Math.abs(w2.I);
      if (i > strom) strom = i;
    });
    return { ok: true, hell, strom, quellStrom,
             wirkt: hell > 0.02 || strom > 1e-4,
             warnungen: (e.warnungen || []).length,
             texte: (e.warnungen || []).slice() };
  };

  /**
   * Wie sich eine Schaltung über ALLE Schalterstellungen verhält, als kurze
   * Zeichenkette: `H` volle Helligkeit, `h` schwach, `s` es fliesst etwas,
   * `.` nichts, `x` nicht rechenbar.
   *
   * Warum nicht einfach „leuchtet es?": weil das zu wenig ist. Bei einer
   * Wechselschaltung leuchtet die Lampe auch dann noch, wenn ein Draht
   * fehlt — man muss nur den anderen Schalter umlegen. Die Schaltung ist
   * trotzdem kaputt: sie lässt sich nicht mehr von beiden Stellen bedienen.
   * Und beim Zeitrelais brachte ein falscher Draht die Leuchte zum Brennen,
   * nur eben dauernd statt verzögert.
   *
   * Zwei Pläne mit demselben Muster sind für den Lernenden dieselbe
   * Schaltung. Genau das ist der Massstab, den eine Aufgabe „welche Leitung
   * fehlt" braucht — sonst hat sie zwei richtige Antworten.
   */
  const muster = (plan: any): string => {
    const sf = SF();
    if (!sf) return '';
    const schalter = (plan.teile as any[]).filter(t => {
      const vh = sf.verhalten(t.zeichen);
      return vh && vh.art === 'schalter' && !vh.folgtSpule;
    });
    let liste: Array<Record<string, number>> = [{}];
    for (const t of schalter) {
      const st = sf.stellungenVon(t.zeichen);
      const neu: Array<Record<string, number>> = [];
      for (const bisher of liste)
        for (let i = 0; i < st.length; i++) neu.push({ ...bisher, [t.id]: i });
      liste = neu;
      if (liste.length > 64) break;      /* Deckel gegen zu viele Schalter */
    }
    return liste.map(st => {
      const e = leuchtet(plan, st);
      return !e.ok ? 'x' : e.hell > 0.8 ? 'H' : e.hell > 0.02 ? 'h'
           : e.strom > 1e-4 ? 's' : '.';
    }).join('');
  };

  /** Welche Leitung fehlt (Punkt 52). */
  const planLeitung: Macher = (w, saat) => {
    if (typeof Schaltplan === 'undefined' || !SF()) return null;
    for (let versuch = 0; versuch < 14; versuch++) {
      const v = w.aus(SCHALTUNGEN);
      const ganz = planBauen(v.teile, v.draehte);
      if (!ganz || (ganz.leitungen as any[]).length < 3) continue;

      /* Erst nachsehen, ob der VOLLSTÄNDIGE Plan überhaupt leuchtet — sonst
         beweist das Fehlen der Leitung nichts. */
      const alleZu = besteStellung(ganz);
      const vorher = leuchtet(ganz, alleZu);
      if (!vorher.ok || !vorher.wirkt) continue;

      const raus = w.aus(ganz.leitungen as any[]);
      if (!raus.vonTeil || !raus.nachTeil) continue;
      const kaputt = planBauen(v.teile, v.draehte);
      kaputt.leitungen = (kaputt.leitungen as any[]).filter((l: any) => l.id !== raus.id);

      /* Die Leitung muss WIRKLICH nötig sein — und zwar über alle Stellungen,
         nicht nur bei der einen, die vorhin am besten war. Zuerst stand hier
         der Vergleich bei EINER Stellung, und bei drei von zweihundert
         Würfelungen kam damit eine Wechselschaltung heraus, bei der man den
         fehlenden Draht durch Umlegen des anderen Schalters ersetzen konnte.
         Die Aufgabe zeigte dann einen Plan, dem nichts anzusehen war. */
      const sollMuster = muster(ganz);
      const kaputtMuster = muster(kaputt);
      if (kaputtMuster === sollMuster) continue;

      const name = (id: string) =>
        ((kaputt.teile as any[]).concat(ganz.teile as any[])
          .find((t: any) => t.id === id) || { bmk: id }).bmk;
      const richtig = `${name(raus.vonTeil)}:${raus.vonNr} — ${name(raus.nachTeil)}:${raus.nachNr}`;

      /* Ablenker: andere Klemmenpaare aus demselben Plan, die es so nicht gibt.
         Eine Leitung hat KEINE Richtung. „G1:L — E1:X1" und „E1:X1 — G1:L"
         sind derselbe Draht, und standen sie beide da, gäbe es zwei richtige
         Antworten — eine davon mit rotem Kreuz. Nachgemessen betraf das 56
         von 600 Würfelungen. Der Schlüssel für die Menge ist deshalb das
         SORTIERTE Paar; angezeigt wird die Schreibweise der Aufgabe. */
      const klemmen: string[] = [];
      (ganz.teile as any[]).forEach(t => {
        const liste = Schaltplan.anschluesseVon(t) as any[];
        liste.forEach(a => klemmen.push(`${t.bmk}:${a.nr}`));
      });
      const schluessel = (x: string, y: string) => [x, y].slice().sort().join(' ');
      const paare = new Map<string, string>();
      paare.set(schluessel(`${name(raus.vonTeil)}:${raus.vonNr}`,
                          `${name(raus.nachTeil)}:${raus.nachNr}`), richtig);
      /* Ein Ablenker darf die Schaltung NICHT wiederherstellen. Beim
         Zeitrelais tat einer genau das: er verband die Leuchte mit der
         Spulenklemme, sie leuchtete, und das Verhaltensmuster war dasselbe
         wie beim heilen Plan — also eine zweite richtige Antwort, die ein
         rotes Kreuz bekommen hätte.
         Die Klemme wird dabei über die KLEMME gesucht, nicht über den Namen:
         bei einem Schütz heissen Spule und Kontakt beide K1, und nur eines
         von beiden hat die Klemme 14. */
      const klemmeFinden = (text: string): { teil: any; nr: string } | null => {
        const bmk = text.split(':')[0];
        const nr = text.split(':').slice(1).join(':');
        const gleiche = (kaputt.teile as any[]).filter(t => String(t.bmk) === bmk);
        const passt = gleiche.find(t =>
          (Schaltplan.anschluesseVon(t) as any[]).some(a => String(a.nr) === nr));
        return passt ? { teil: passt, nr } : null;
      };
      const stelltWiederHer = (text: string): boolean => {
        const [a, b] = text.split(' — ');
        if (!a || !b) return false;
        const ka = klemmeFinden(a), kb = klemmeFinden(b);
        if (!ka || !kb) return false;
        const probe = JSON.parse(JSON.stringify(kaputt));
        probe.leitungen.push({ id: 'probe', ebene: 'plan',
          punkte: [{ x: -2000, y: -2000 }, { x: -1980, y: -2000 }],
          vonTeil: ka.teil.id, vonNr: ka.nr, nachTeil: kb.teil.id, nachNr: kb.nr });
        return muster(probe) === sollMuster;
      };

      for (const a of w.misch(klemmen)) {
        if (paare.size >= 4) break;
        for (const b of w.misch(klemmen)) {
          if (paare.size >= 4) break;
          if (a === b || a.split(':')[0] === b.split(':')[0]) continue;
          const s = schluessel(a, b);
          if (paare.has(s)) continue;
          if (stelltWiederHer(`${a} — ${b}`)) continue;
          paare.set(s, `${a} — ${b}`);
        }
      }
      if (paare.size < 4) continue;

      /* Einmal mischen, einmal verwenden. Zweimal `w.misch` — einmal in der
         Bedingung, einmal im Zweig — prüft eine ANDERE Reihenfolge als die,
         die herauskommt; derselbe Fehler hat in dieser Datei schon einmal
         eine Aufgabe ohne ihre eigene Lösung erzeugt. */
      const auswahl = w.misch([...paare.values()]);

      return {
        art: 'plan-leitung', antwortart: 'wahl',
        frage: `${v.name}: ${v.wozu}\nEine Leitung fehlt. Welche?`,
        plan: kaputt, stellungen: alleZu,
        optionen: auswahl.includes(richtig)
          ? auswahl
          : [richtig, ...auswahl.filter(x => x !== richtig).slice(0, 3)],
        loesung: richtig,
        /* Was ohne die Leitung noch geht, steht in den beiden Mustern — und
           es ist nicht immer „gar nichts". Bei einer Wechselschaltung fehlt
           ein Draht, und die Lampe leuchtet trotzdem: man muss nur den
           ANDEREN Schalter umlegen. Hier stand zuerst pauschal „der
           Stromkreis ist offen", und bei drei von zweihundert Würfelungen
           war das schlicht falsch — nachprüfbar falsch, denn wer im Plan
           umschaltet, sieht die Lampe angehen. Eine Erklärung, die der
           Lernende widerlegen kann, ist schlimmer als keine. */
        erklaerung: (() => {
          const geht = (m: string) => [...m].filter(c => c !== '.' && c !== 'x').length;
          const a = geht(sollMuster), b = geht(kaputtMuster);
          if (b === 0)
            return `Ohne die Verbindung ${richtig} ist der Stromkreis offen — ` +
                   `nachgerechnet: mit ihr leuchtet es, ohne sie nicht.`;
          return `Ohne die Verbindung ${richtig} arbeitet die Schaltung nicht ` +
                 `mehr vollständig: nachgerechnet führen statt ${a} nur noch ` +
                 `${b} von ${sollMuster.length} Schalterstellungen zum Ziel. ` +
                 `Dass es überhaupt noch leuchtet, heisst nicht, dass alles ` +
                 `stimmt.`;
        })(),
        stufe: 3, saat
      };
    }
    return null;
  };

  /** Was stimmt hier nicht (Punkt 53). */
  const planFehler: Macher = (w, saat) => {
    if (typeof Schaltplan === 'undefined' || !SF()) return null;

    /* `tun` gibt zurück, WO der Schaden sitzt — nicht bloss, ob er gelang.
       Ohne diesen Satz lautete jede Erklärung gleich („mit dem heilen Plan
       leuchtet es, mit diesem nicht"), und ein Lernender, der die Aufgabe
       falsch hatte, erfuhr nicht, wonach er hätte suchen sollen. */
    type Schaden = { name: string; tun: (plan: any) => string | null };
    for (let versuch = 0; versuch < 14; versuch++) {
      const v = w.aus(SCHALTUNGEN);
      const heil = planBauen(v.teile, v.draehte);
      if (!heil) continue;
      const alleZu = besteStellung(heil);
      const vorher = leuchtet(heil, alleZu);
      if (!vorher.ok || !vorher.wirkt) continue;

      const bmkVon = (plan: any, id: string): string => {
        const t = (plan.teile as any[]).find(x => x.id === id);
        return t ? String(t.bmk || t.zeichen) : '?';
      };

      const schaeden: Schaden[] = [
        { name: 'Eine Leitung ist unterbrochen.', tun: plan => {
            const l = (plan.leitungen as any[]);
            if (l.length < 2) return null;
            const weg = l.splice(Math.floor(l.length / 2), 1)[0];
            return `zwischen ${bmkVon(plan, weg.vonTeil)}:${weg.vonNr} und ` +
                   `${bmkVon(plan, weg.nachTeil)}:${weg.nachNr} fehlt die Leitung`;
          } },
        { name: 'Der Verbraucher ist überbrückt.', tun: plan => {
            const last = (plan.teile as any[]).find(t => {
              const vh = SF()!.verhalten(t.zeichen);
              return vh && vh.art === 'widerstand';
            });
            if (!last) return null;
            const vh = SF()!.verhalten(last.zeichen)!;
            if (!bruecke(plan, last, String(vh.von), String(vh.nach), 'kurz')) return null;
            return `über ${last.bmk} liegt eine Leitung von ${vh.von} nach ${vh.nach}`;
          } },
        { name: 'Der Schalter ist überbrückt und schaltet nichts mehr.', tun: plan => {
            const sch = (plan.teile as any[]).find(t => {
              const vh = SF()!.verhalten(t.zeichen);
              return vh && vh.art === 'schalter' && !vh.folgtSpule;
            });
            if (!sch) return null;
            const st = SF()!.stellungenVon(sch.zeichen);
            const paar = st.find(x => x.zu.length)?.zu[0];
            if (!paar) return null;
            if (!bruecke(plan, sch, String(paar[0]), String(paar[1]), 'kurz')) return null;
            return `über ${sch.bmk} liegt eine Leitung von ${paar[0]} nach ${paar[1]}`;
          } },
        /* Der vierte Schaden ist erst hier dazugekommen. Vorher stand
           „Die Quelle liefert zu wenig Spannung" nur als Möglichkeit da und
           war in 120 Startwerten kein einziges Mal die Lösung — wer das
           merkt, hat geschenkt eine von vier Möglichkeiten weniger. Jetzt
           gibt es den Fall wirklich: halbe Spannung, und die Leuchte
           bekommt ein Viertel der Leistung. */
        { name: 'Die Quelle liefert zu wenig Spannung.', tun: plan => {
            const q = (plan.teile as any[]).find(t => {
              const vh = SF()!.verhalten(t.zeichen);
              return vh && vh.art === 'quelle';
            });
            if (!q) return null;
            const vh = SF()!.verhalten(q.zeichen)!;
            const soll = typeof vh.wert === 'number' ? vh.wert : 230;
            const ist = Math.round(soll * 0.4);
            q.werte = { ...(q.werte || {}), U: ist };
            /* Und das MUSS im Plan stehen. Ohne die Beschriftung sah die
               Zeichnung völlig heil aus, und „die Quelle liefert zu wenig
               Spannung" war aus ihr nicht abzulesen — nur durch Ausschluss
               zu erraten. Aufgefallen ist es auf einem Bildschirmfoto, nicht
               in einer Prüfung: gerechnet stimmte ja alles. */
            anschreiben(plan, q, `${ist} V (Soll ${soll} V)`, 'spannung');
            return `${q.bmk} führt statt ${soll} V nur ${ist} V`;
          } }
      ];

      const schaden = w.aus(schaeden);
      const kaputt = planBauen(v.teile, v.draehte);
      const ort = schaden.tun(kaputt);
      if (!ort) continue;
      const nachher = leuchtet(kaputt, alleZu);

      /* NUR wenn der Schaden wirklich einer ist. Ein „Fehler", nach dem alles
         weiterläuft, ist keiner — und eine Aufgabe darüber wäre eine Falle
         ohne Lösung. Das prüft die Simulation, nicht ein Kommentar. */
      const wirklichKaputt = !nachher.ok
        || !nachher.wirkt
        || nachher.hell < vorher.hell * 0.5
        || nachher.strom < vorher.strom * 0.5
        || nachher.warnungen > vorher.warnungen;
      if (!wirklichKaputt) continue;

      /* Alle vier Schäden stehen zur Wahl, keiner davon nur zum Ausschliessen:
         jeder ist in irgendeinem Startwert wirklich die Lösung. */
      const auswahl = schaeden.map(x => x.name);

      /* Was die Simulation zum Nachher sagt, in einem Satz. Eine Zahl steht
         nur da, wo sie etwas bedeutet — beim Kurzschluss nicht, siehe die
         Begründung weiter unten bei planLeuchtet.
         Der Satz wird an den WARNUNGSTEXTEN abgelesen, nicht an ihrer Zahl.
         Zuerst stand hier nur `warnungen > vorher.warnungen`, und damit
         bekam auch die fehlende Leitung den Satz „der Strom findet einen
         Weg an der Last vorbei" — eine entfernte Leitung kann gar keinen
         Weg schaffen. Gemeldet worden war „Anschluss hängt an keiner
         Leitung", also das genaue Gegenteil. */
      const neu = nachher.texte.filter(t => !vorher.texte.includes(t));
      const folge = !nachher.ok
        ? 'der Plan lässt sich gar nicht mehr durchrechnen'
        : neu.some(t => /überbrückt/.test(t))
        ? 'der Strom findet einen Weg an der Last vorbei'
        : neu.some(t => /an keiner Leitung/.test(t))
        ? 'ein Anschluss hängt jetzt frei und der Kreis ist offen'
        : nachher.hell < 0.02
        ? 'es fliesst kein Strom mehr durch die Leuchte'
        : `die Leuchte bekommt noch ${Math.round(nachher.hell * 100)} % ` +
          `statt ${Math.round(vorher.hell * 100)} % der Nennleistung`;

      return {
        art: 'plan-fehler', antwortart: 'wahl',
        frage: `${v.name}: ${v.wozu}\nDiese Schaltung tut nicht, was sie soll. Woran liegt es?`,
        plan: kaputt, stellungen: alleZu,
        optionen: w.misch(auswahl),
        loesung: schaden.name,
        erklaerung: `Sieh hin: ${ort}. Nachgerechnet heisst das — ${folge}.`,
        stufe: 3, saat
      };
    }
    return null;
  };

  /** Leuchtet es bei diesen Schalterstellungen (Punkte 59, 60)? */
  const planLeuchtet: Macher = (w, saat) => {
    if (typeof Schaltplan === 'undefined' || !SF()) return null;
    for (let versuch = 0; versuch < 14; versuch++) {
      const v = w.aus(SCHALTUNGEN);
      const plan = planBauen(v.teile, v.draehte);
      if (!plan) continue;
      /* Nur Pläne mit von Hand schaltbaren Bauteilen — sonst gibt es nichts
         zu stellen und die Frage hat nur eine mögliche Antwort. */
      const schalter = (plan.teile as any[]).filter(t => {
        const vh = SF()!.verhalten(t.zeichen);
        return vh && vh.art === 'schalter' && !vh.folgtSpule;
      });
      if (!schalter.length) continue;

      const stellung: Record<string, number> = {};
      const beschreibung: string[] = [];
      schalter.forEach(t => {
        const st = SF()!.stellungenVon(t.zeichen);
        const nr = w.bis(st.length);
        stellung[t.id] = nr;
        beschreibung.push(`${t.bmk}: ${st[nr]!.name}`);
      });
      /* In jedem vierten Fall wird der Verbraucher überbrückt. Dann IST die
         richtige Antwort „die Sicherung löst aus" — und sie steht nicht mehr
         als Möglichkeit da, die nie zutrifft. Eine Antwort, die es nie gibt,
         ist eine geschenkte Ausschlussmöglichkeit; und schlimmer: sie
         verspricht einen Fall, den die App gar nicht kennt.
         Ob es wirklich ein Kurzschluss ist, sagt der gerechnete Quellstrom
         und nicht die Absicht. */
      let kurz = false;
      if (w.bis(4) === 0) {
        const last = (plan.teile as any[]).find(t => {
          const vh = SF()!.verhalten(t.zeichen);
          return vh && vh.art === 'widerstand' && /X1/.test(String(vh.von || ''));
        });
        const vh = last ? SF()!.verhalten(last.zeichen) : null;
        if (last && vh)
          kurz = bruecke(plan, last, String(vh.von), String(vh.nach), 'kurz');
      }

      /* Und in jedem fünften der übrigen Fälle liegt zu wenig Spannung an.
         Aus demselben Grund wie oben: „Ja, aber schwächer als normal" stand
         als vierte Möglichkeit da und war in 120 Würfelungen NIE die Lösung.
         Auffallen konnte das keiner Zählung — es fiel auf, weil ein
         absichtlich verstellter Schwellwert (0,8 auf 0,4) den Prüflauf NICHT
         rot machte. Eine Schwelle, die nichts trennt, trennt nichts, weil
         zwischen ihren Seiten kein einziger Fall liegt.
         Eine Lampe an halber Spannung leuchtet mit einem Viertel der
         Leistung — sichtbar dunkler, aber sie brennt. */
      let schwach = false;
      if (!kurz && w.bis(5) === 0) {
        const q = (plan.teile as any[]).find(t => {
          const vh = SF()!.verhalten(t.zeichen);
          return vh && vh.art === 'quelle';
        });
        const vh = q ? SF()!.verhalten(q.zeichen) : null;
        if (q && vh) {
          const soll = typeof vh.wert === 'number' ? vh.wert : 230;
          /* Zwischen 40 % und 65 % der Nennspannung — das ergibt 16 % bis
             42 % Licht. Der Abstand zur Schwelle bei 80 % ist ABSICHT und
             kein Zufall: bei 79 % gegen 81 % wäre die Frage „voll oder
             schwächer?" ein Münzwurf, und eine Aufgabe, die man nicht
             entscheiden KANN, ist keine Aufgabe. Der Prüflauf misst genau
             diesen Abstand mit. */
          const teil = 0.40 + w.bis(6) * 0.05;
          q.werte = { ...(q.werte || {}), U: Math.round(soll * teil) };
          q.spannungSoll = soll;
          anschreiben(plan, q, `${Math.round(soll * teil)} V (Soll ${soll} V)`, 'spannung');
          schwach = true;
        }
      }
      const e = leuchtet(plan, stellung);
      if (kurz) {
        /* Ein Kurzschluss zählt erst als einer, wenn der Quellstrom wirklich
           über der grössten üblichen Sicherung liegt. */
        if (!e.ok || e.quellStrom < 16) continue;
        return {
          art: 'plan-leuchtet', antwortart: 'wahl',
          frage: `${v.name}\nStellungen: ${beschreibung.join(', ')}\n` +
            `Leuchtet die Leuchte?`,
          plan, stellungen: stellung,
          optionen: w.misch(['Ja, mit voller Helligkeit.', 'Ja, aber schwächer als normal.',
                             'Nein, es bleibt dunkel.', 'Die Sicherung löst aus.']),
          loesung: 'Die Sicherung löst aus.',
          /* Hier steht bewusst KEINE Amperezahl. Die Simulation rechnet mit
             einer idealen Quelle ohne Innenwiderstand; heraus kommen dann
             Hunderttausende Ampere. Das ist kein Messwert, sondern das, was
             eine Division durch fast Null eben ergibt. Einem Lernenden diese
             Zahl zu nennen wäre schlimmer, als gar keine zu nennen — er
             würde sie sich merken. Was wirklich gilt: den Strom begrenzt
             nur noch die Leitung, und der Wert hängt an der Schleifen-
             impedanz der Anlage, nicht am Plan. */
          erklaerung: 'Die Leuchte ist überbrückt — der Strom nimmt den Weg ' +
            'daran vorbei und findet keinen Widerstand mehr vor. Begrenzt ' +
            'wird er dann nur noch vom Leitungswiderstand, und er steigt ' +
            'weit über jeden Nennstrom. Abschalten kann das nur die ' +
            'Sicherung.',
          stufe: 3, saat
        };
      }
      if (!e.ok) continue;
      /* Nur fragen, wo es überhaupt etwas zu leuchten GIBT. Bei einer
         Selbsthaltung wäre „Leuchtet die Leuchte?" eine Fangfrage über ein
         Bauteil, das gar nicht im Plan steht. */
      const hatLeuchte = (plan.teile as any[]).some(t => {
        const vh = SF()!.verhalten(t.zeichen);
        return vh && vh.art === 'widerstand' && /X1/.test(String(vh.von || ''));
      });
      if (!hatLeuchte) continue;

      const antwort = e.hell > 0.8 ? 'Ja, mit voller Helligkeit.'
        : e.hell > 0.02 ? 'Ja, aber schwächer als normal.'
        : 'Nein, es bleibt dunkel.';
      /* Wenn die Spannung abgesenkt wurde, MUSS auch etwas dazwischen
         herauskommen. Tut es das nicht — weil der Schalter offen ist und die
         Leuchte ohnehin dunkel bleibt —, ist die Absenkung nicht zu sehen,
         und die Aufgabe würde eine Besonderheit behaupten, die keine ist. */
      if (schwach && antwort !== 'Ja, aber schwächer als normal.') continue;

      const q = (plan.teile as any[]).find(t => t.spannungSoll);
      return {
        art: 'plan-leuchtet', antwortart: 'wahl',
        frage: `${v.name}\nStellungen: ${beschreibung.join(', ')}` +
          (schwach && q ? `\nDie Quelle führt nur ${q.werte.U} V statt ${q.spannungSoll} V.` : '') +
          `\nLeuchtet die Leuchte?`,
        plan, stellungen: stellung,
        optionen: w.misch(['Ja, mit voller Helligkeit.', 'Ja, aber schwächer als normal.',
                           'Nein, es bleibt dunkel.', 'Die Sicherung löst aus.']),
        loesung: antwort,
        erklaerung: `${v.wozu} Nachgerechnet ergibt sich ` +
          (e.hell > 0.02 ? `${Math.round(e.hell * 100)} % der Nennleistung.`
                         : 'kein Strom durch die Leuchte.') +
          (schwach ? ' Die Leistung geht mit dem QUADRAT der Spannung: halbe ' +
                     'Spannung heisst ein Viertel Licht, nicht die Hälfte.' : ''),
        stufe: schalter.length > 1 ? 3 : 2, saat
      };
    }
    return null;
  };

  /**
   * Den Stromweg selbst markieren (Punkt 59).
   *
   * Die einzige Aufgabenart, bei der man IN den Plan tippt statt eine
   * Möglichkeit anzukreuzen. Und die einzige, bei der Raten nichts bringt:
   * bei vier Möglichkeiten trifft man mit einem Viertel Wahrscheinlichkeit,
   * bei acht Leitungen mit einem Zweihundertsechsundfünfzigstel.
   *
   * WIE DIE LÖSUNG ENTSTEHT — und warum nicht so, wie zuerst gedacht.
   *
   * Der erste Bau las `netzStrom` über `leitungNetz` ab, also genau die
   * Zahlen, mit denen der Schaltplan-Block die Striche wandern lässt (E187).
   * Nachgemessen kam bei ELF von zwölf Schaltungen „alles oder nichts"
   * heraus, und übrig blieb eine einzige Schaltung — dieselbe Zeichnung in
   * jeder Aufgabe.
   *
   * Der Grund steht in `simulation.ts`: `netzStrom[netz]` ist der GRÖSSTE
   * Strom irgendeines Bauteils, das dieses Netz berührt, nicht der Strom
   * durch eine bestimmte Leitung. Ein toter Abzweig, der mit einem Ende an
   * einem stromführenden Knoten hängt, liegt im selben Netz und liest
   * denselben Wert.
   *
   * Und der Strom durch eine EINZELNE Leitung ist gar nicht bestimmt: zwei
   * ideale Leitungen zwischen denselben zwei Knoten teilen sich den Strom in
   * einem Verhältnis, das aus den Knotenspannungen nicht folgt. Das ist
   * Physik und kein Mangel der Rechnung.
   *
   * Bestimmt ist dagegen, ob eine Leitung AUF dem Weg liegt: schneide sie
   * durch, und sieh nach, ob sich etwas ändert. Genau das meint ein
   * Elektriker mit Stromweg, und genau das rechnet diese Funktion — ein
   * Durchgang je Leitung, bei höchstens zehn Leitungen keine Frage von
   * Rechenzeit.
   */
  const planStromweg: Macher = (w, saat) => {
    if (typeof Schaltplan === 'undefined' || !SF()) return null;
    for (let versuch = 0; versuch < 14; versuch++) {
      const v = w.aus(SCHALTUNGEN);
      const plan = planBauen(v.teile, v.draehte);
      if (!plan) continue;
      const alle = (plan.leitungen as any[]).map(l => String(l.id));
      /* Unter drei Leitungen ist die Aufgabe zu klein, über zehn wird das
         Antippen zur Fleissarbeit. */
      if (alle.length < 3 || alle.length > 10) continue;

      const schalter = (plan.teile as any[]).filter(t => {
        const vh = SF()!.verhalten(t.zeichen);
        return vh && vh.art === 'schalter' && !vh.folgtSpule;
      });
      const stellung: Record<string, number> = {};
      const beschreibung: string[] = [];
      schalter.forEach(t => {
        const st = SF()!.stellungenVon(t.zeichen);
        const nr = w.bis(st.length);
        stellung[t.id] = nr;
        beschreibung.push(`${t.bmk}: ${st[nr]!.name}`);
      });

      const wirkung = (p: any): string => {
        const e = SF()!.rechne(p, stellung);
        if (!e || !e.ok) return 'x';
        /* Was die Schaltung TUT: der Strom durch jedes Bauteil, gerundet.
           Zwei Pläne mit demselben Abdruck verhalten sich gleich.

           UNTER EINEM NANOAMPERE IST NICHTS. Die Rechnung setzt zwischen
           jeden Knoten und Masse einen winzigen Leitwert (GMIN), sonst wäre
           die Matrix bei einem offenen Kontakt nicht lösbar. Heraus kommen
           dann Ströme wie 4,184e-10 A — Rechenrauschen, kein Strom.
           Ohne diese Schwelle verglich der Abdruck genau dieses Rauschen:
           beim Treppenhausautomaten mit offenem Automaten galten VIER
           Leitungen als „am Stromweg beteiligt", obwohl die Leuchte in
           jedem Fall dunkel blieb und nirgends etwas floss. Dieselbe
           Schwelle benutzt `simulation.ts` selbst. */
        const SCHWELLE = 1e-9;
        return (p.teile as any[]).map(t => {
          const x = e.werte[t.id];
          if (!x) return '-';
          const i = Math.abs(x.I);
          return i < SCHWELLE ? '0' : i.toPrecision(4);
        }).join('|');
      };

      const heil = wirkung(plan);
      if (heil === 'x') continue;
      const aufDemWeg = alle.filter(id => {
        const ohne = { ...plan,
          leitungen: (plan.leitungen as any[]).filter(l => String(l.id) !== id) };
        return wirkung(ohne) !== heil;
      });
      /* Weder „alles" noch „nichts" ist eine Aufgabe: im ersten Fall tippt
         man einfach alles an, im zweiten gar nichts, und beides wäre ohne
         Nachdenken richtig.
         Und eine EINZELNE Leitung ist auch keine: dann tippt man irgendwo
         hin und hat mit einiger Wahrscheinlichkeit recht. Nachgemessen war
         das bei 66 von 120 Würfelungen der Fall — die Bedingung „nicht
         alles, nicht nichts" allein ist zu schwach. Verlangt sind mindestens
         zwei auf dem Weg und zwei daneben; erst dann ist es eine
         Unterscheidung. */
      const daneben = alle.length - aufDemWeg.length;
      if (aufDemWeg.length < 2 || daneben < 2) continue;

      /* Rand für die Griffe. Das Blatt wurde beim Bauen auf seinen Inhalt
         geschrumpft; die Griffe sitzen zwar AUF den Leitungen, ragen aber mit
         ihrem Radius darüber hinaus, und zwei standen halb ausserhalb des
         Bildes. Gesehen auf einem Bildschirmfoto, nicht in einer Zahl. */
      plan.breite = (Number(plan.breite) || 0) + 70;
      plan.hoehe = (Number(plan.hoehe) || 0) + 70;
      (plan.teile as any[]).forEach(t => { t.x += 35; t.y += 35; });
      (plan.leitungen as any[]).forEach(l =>
        (l.punkte as any[]).forEach(pt => { pt.x += 35; pt.y += 35; }));

      return {
        art: 'plan-stromweg', antwortart: 'wege',
        frage: `${v.name}\nStellungen: ${beschreibung.join(', ')}\n` +
          `Tippe die Leitungen an, die am Stromweg beteiligt sind.`,
        plan, stellungen: stellung,
        loesung: aufDemWeg.slice().sort().join(','),
        erklaerung: `${v.wozu} Von ${alle.length} Leitungen liegen ` +
          `${aufDemWeg.length} auf dem Weg: schneidet man eine davon durch, ` +
          `ändert sich etwas. Die übrigen hängen an einem offenen Kontakt ` +
          `oder in einem Zweig, der nirgends hinführt — Spannung kann dort ` +
          `anliegen, für die Wirkung der Schaltung zählen sie nicht.`,
        stufe: schalter.length > 1 ? 3 : 2, saat
      };
    }
    return null;
  };

  /**
   * Steuerstromkreis und Hauptstromkreis auseinanderhalten (Punkt 60).
   *
   * In der Praxis sind das zwei Blätter: der Steuerstromkreis mit Tastern,
   * Spulen und Hilfskontakten, der Hauptstromkreis mit Schützhauptkontakten
   * und dem Motor. Wer beides für dasselbe hält, sucht den Motorfehler in
   * der Steuerung.
   *
   * Gefragt wird nach EINEM Betriebsmittel, damit die Antwort eine
   * Entscheidung ist und keine Aufzählung. Zugeordnet wird nach dem, was das
   * Bauteil TUT — nicht nach seinem Namen: eine Spule steuert, ein Motor
   * arbeitet, ein Hilfskontakt meldet.
   */
  const kreisZuordnen: Macher = (w, saat) => {
    if (!SF()) return null;
    const STEUER = ['spule', 'schalter'];
    for (let versuch = 0; versuch < 14; versuch++) {
      const v = w.aus(SCHALTUNGEN);
      const plan = planBauen(v.teile, v.draehte);
      if (!plan) continue;
      const teile = (plan.teile as any[]).filter(t => {
        const vh = SF()!.verhalten(t.zeichen);
        return vh && vh.art !== 'quelle';
      });
      if (teile.length < 2) continue;
      const t = w.aus(teile);
      const vh = SF()!.verhalten(t.zeichen)!;
      const z = Register.fachzeichen.holen(t.zeichen);
      const steuert = STEUER.includes(String(vh.art));
      const antwort = steuert ? 'Steuerstromkreis' : 'Hauptstromkreis';
      return {
        art: 'kreis-zuordnen', antwortart: 'wahl',
        frage: `${v.name}\nWohin gehört ${t.bmk}` +
          (z ? ` (${z.name})` : '') + `?`,
        plan, stellungen: {},
        optionen: w.misch(['Steuerstromkreis', 'Hauptstromkreis']),
        loesung: antwort,
        erklaerung: steuert
          ? `${t.bmk} schaltet oder hält — es entscheidet, WANN etwas ` +
            `passiert, und trägt selbst keine Arbeitsleistung. Solche ` +
            `Betriebsmittel stehen im Steuerstromkreis.`
          : `${t.bmk} setzt Leistung um — hier fliesst der Strom, der die ` +
            `Arbeit macht. Das ist der Hauptstromkreis; die Steuerung ` +
            `entscheidet nur, ob er fliessen darf.`,
        stufe: 2, saat
      };
    }
    return null;
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
    { id: 'plan-leitung',   name: 'Fehlende Leitung',      gruppe: 'Schaltungen', mach: planLeitung },
    { id: 'plan-fehler',    name: 'Fehler suchen',         gruppe: 'Schaltungen', mach: planFehler },
    { id: 'plan-leuchtet',  name: 'Leuchtet es?',          gruppe: 'Schaltungen', mach: planLeuchtet },
    { id: 'plan-stromweg',  name: 'Stromweg markieren',   gruppe: 'Schaltungen', mach: planStromweg },
    { id: 'kreis-zuordnen', name: 'Steuern oder arbeiten', gruppe: 'Schaltungen', mach: kreisZuordnen },
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

    /* Eine Menge von Leitungen. Verglichen wird als MENGE, nicht als Text:
       die Reihenfolge des Antippens bedeutet nichts. Und der Hinweis nennt
       beide Sorten Fehler getrennt — wer drei Leitungen vergessen hat, hat
       ein anderes Missverständnis als wer drei zu viel angetippt hat. */
    if (aufgabe.antwortart === 'wege') {
      const menge = (x: string) =>
        new Set(x.split(',').map(y => y.trim()).filter(Boolean));
      const soll = menge(String(aufgabe.loesung));
      const ist = menge(roh);
      const fehlen = [...soll].filter(x => !ist.has(x)).length;
      const zuviel = [...ist].filter(x => !soll.has(x)).length;
      if (!fehlen && !zuviel) return { richtig: true, hinweis: 'Richtig.' };
      const teile: string[] = [];
      if (fehlen) teile.push(`${fehlen} ${fehlen === 1 ? 'Leitung fehlt' : 'Leitungen fehlen'}`);
      if (zuviel) teile.push(`${zuviel} zu viel`);
      return { richtig: false, hinweis: teile.join(', ') + '.' };
    }

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
