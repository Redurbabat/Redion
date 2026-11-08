/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/schaltplan.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/bloecke/arten/schaltplan.ts — Schaltpläne zeichnen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/schaltplan.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/bloecke/arten/schaltplan.js`.
 * ----------------------------------------------------------------------------
 * EIN SCHALTPLAN IST EIN NORMALER BLOCK
 *
 * Kein zweites Dokumentmodell, keine eigene Datei, kein eigener Speicher: der
 * Plan liegt in `block.plan` und läuft damit durch Papierkorb, Sicherung,
 * Wiederherstellung, Versionen und den optionalen Abgleich wie jeder andere
 * Block. Das ist dieselbe Entscheidung wie beim Whiteboard (E138) und der
 * Grund, warum ein Schaltplan in einer `.redion`-Sicherung einfach mitkommt,
 * ohne dass jemand daran gedacht haben muss.
 *
 * DIE SYMBOLE STEHEN NICHT HIER. Sie stehen in `register/fachzeichen.js`, und
 * dieser Editor kennt nur deren Kennungen. Eine zweite Symbolliste neben dem
 * Register wäre L34 in gross: sie würde auseinanderlaufen, und niemand
 * bemerkte es, bis ein Plan ein Symbol zeigt, das der Lernmodus nicht kennt.
 *
 * WAS IM PLAN STEHT
 *
 *   art        welcher Plantyp — Stromlauf, Installation, Klemmen, …
 *   teile      die gesetzten Symbole: Kennung, Ort, Drehung, Betriebsmittel
 *   leitungen  die Verbindungen, als Liste von Rasterpunkten
 *   texte      freie Beschriftungen
 *   ebenen     Aufgabe und Lösung getrennt ein- und ausblendbar
 *
 * ALLES RASTET EIN. Symbole und Leitungspunkte liegen auf Vielfachen von
 * `Register.fachzeichen.RASTER`. Das ist keine Bequemlichkeit, sondern die
 * Bedingung dafür, dass eine Leitung einen Anschluss überhaupt TRIFFT — ohne
 * Raster müsste man auf den Pixel genau zielen, und ein Plan mit Leitungen,
 * die fast am Anschluss enden, sieht richtig aus und ist es nicht.
 * ==========================================================================*/

const Schaltplan = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /**
   * `U_L` wird zu U mit tiefgestelltem L.
   *
   * Eine Beschriftung im Plan ist eine Zeichenkette, und eine Zeichenkette
   * hat keine Tiefstellung — der Unterstrich steht seit jeher dafür. Im Bild
   * soll er aber nicht dastehen: `X_L − X_C` liest sich als vier Zeichen mit
   * Strichen dazwischen, `X` mit tiefem `L` minus `X` mit tiefem `C` als
   * eine Differenz zweier Grössen.
   *
   * ERST ESCAPEN, DANN AUSZEICHNEN — in dieser Reihenfolge liegt die ganze
   * Sicherheit (§19). Das `<tspan>` kommt NACH dem Escapen hinein, also kann
   * aus einer Beschriftung kein Element werden. Umgekehrt wäre es ein Loch,
   * durch das jeder Plantext beliebiges SVG einschleusen könnte.
   */
  /* WELCHE ZEICHEN TIEFGESTELLT WERDEN, und warum die alte Liste zu kurz war.
   *
   * Hier stand `[A-Za-zÄÖÜäöüß0-9]`. Das ist die deutsche Tastatur, nicht die
   * Physik. Im Heft steht `R_ϑ` (Widerstand bei der Temperatur ϑ), `S_Δ`
   * (Scheinleistung in Dreieckschaltung) und `AF_%` (relativer Anzeigefehler)
   * — 42 Stellen, an denen der Unterstrich als Unterstrich stehen blieb.
   *
   * Ein sichtbarer Unterstrich in einer Formel ist kein Schönheitsfehler: er
   * sieht aus wie ein Zeichen der Formel. `R_ϑ` liest sich als „R Unterstrich
   * Theta", und es gibt keine solche Grösse.
   *
   * `\p{L}` nimmt jeden Buchstaben JEDER Schrift, `\p{N}` jede Ziffer, und
   * `%` steht ausdrücklich dabei, weil es keins von beidem ist. Was nicht
   * dazugehört — Leerzeichen, Klammern, Rechenzeichen — beendet die
   * Tiefstellung weiterhin. Und weil `esc` VORHER läuft, kann durch die
   * Erweiterung kein Zeichen hereinkommen, das vorher draussen war.
   *
   * Dieselbe Zeile steht in `schaltplan.ts`, `skizzen.ts` und
   * `formelheft.ts`. test244 vergleicht die drei — auseinanderlaufen ist
   * genau der Weg, auf dem dieser Fehler entstanden ist.
   */
  const tief = (wert: unknown): string =>
    esc(wert).replace(/_([\p{L}\p{N}%]+)/gu,
      '<tspan baseline-shift="sub" font-size="0.72em">$1</tspan>');

  const R = (): number => (typeof Register !== 'undefined' && Register.fachzeichen)
    ? Register.fachzeichen.RASTER : 10;

  /** Auf das Raster runden — die eine Stelle, an der das passiert. */
  const rasten = (v: number): number => Math.round(v / R()) * R();

  /** Zahl mit Vorsatz. Die Regel steht in `Stromfluss`; hier nur der Zugang. */
  const zeigeZahl = (wert: number, einheit: string): string =>
    (typeof Stromfluss !== 'undefined' && Stromfluss.zeige)
      ? Stromfluss.zeige(wert, einheit)
      : `${wert} ${einheit}`;

  type Teil = {
    id: string; zeichen: string; x: number; y: number;
    drehung: number; gespiegelt: boolean;
    /** Betriebsmittelkennzeichen wie K1, S1, F1 (Punkt 19). */
    bmk: string;
    /** Überschriebene Anschlussnummern (Punkt 18): Vorgabe → eigener Text. */
    nummern: Record<string, string>;
    /** Zu welcher Gruppe der Teil gehört (Punkt 29), leer heisst keine. */
    gruppe: string;
    /** Auf welcher Ebene er liegt (Punkt 48). */
    ebene: string;
    /** Zahlen des Bauteils; U, Ri, Imax und Q gehören der Zeichnung. */
    werte?: Record<string, number>;
    /** Ein lesbarer Name neben dem normgerechten BMK, etwa „Hauptschütz"
        (E767, aus Redurs ZIP). Höchstens 120 Zeichen; fehlt, wenn leer. */
    beschriftung?: string;
    /** Die Spalte (0–29) des alten Relais-Rasters, aus dem das Teil
        eingelesen wurde — eine Lage, keine behauptete Verdrahtung (E767). */
    legacySpalte?: number;
  };
  type Punkt = { x: number; y: number };
  type Leitung = {
    id: string; punkte: Punkt[]; ebene: string;
    /** Woran die Enden hängen — für das Mitziehen beim Verschieben. */
    vonTeil?: string; vonNr?: string; nachTeil?: string; nachNr?: string;
    /** Selbst gezeichnete Stromschiene (E762): welcher Leiter — L1, L2, L3,
        N oder PE. Fehlt bei jeder gewöhnlichen Leitung und bei allen Plänen
        von vor E762; die Netzliste liest es nicht (eine Schiene ist eine
        Leitung wie jede andere), nur das Bild zeichnet sie kräftiger. */
    schiene?: string;
  };
  type Text = { id: string; x: number; y: number; t: string; ebene: string };
  type Ebene = { id: string; name: string; farbe: string; sichtbar: boolean };
  type Plan = {
    art: string; breite: number; hoehe: number;
    teile: Teil[]; leitungen: Leitung[]; texte: Text[]; ebenen: Ebene[];
    batterieUebung?: { id: string; plus: string; minus: string; teile: string[] };
    /** Die Originalbytes einer alten Relais-.sch (Base64, genau 4320 Byte =
        5760 Zeichen) samt Spaltentiteln und dem, was NICHT gesichert ist —
        nie eine behauptete Netzliste (E767, E769). */
    relaisLegacy?: RelaisLegacy;
  };
  type RelaisLegacy = { name: string; format: string; roh: string; txtRoh: string; texte: string[];
    verifiziert: boolean; bearbeitet: boolean; nichtVerifiziert: string[]; texteBearbeitet?: boolean };

  /* ------------------------------------------------------------------------
   * DIE PLANARTEN (Punkte 31–40)
   * ------------------------------------------------------------------------
   * Sie unterscheiden sich nicht im Speicherformat — ein Plan ist ein Plan —,
   * sondern in dem, was sie VORSCHLAGEN: welche Symbolgruppen oben stehen,
   * ob Stromschienen vorgezeichnet werden, wie das Blatt liegt. Eine eigene
   * Datenform je Art hätte zehn Formate ergeben, die alle dasselbe können.
   * ----------------------------------------------------------------------*/
  const ARTEN: Array<{
    id: string; name: string; erklaerung: string;
    gruppen: string[]; schienen?: 'steuer' | 'haupt' | 'keine'; quer?: boolean;
  }> = [
    { id: 'stromlauf-aufgeloest', name: 'Stromlaufplan, aufgelöst',
      erklaerung: 'Jeder Stromkreis für sich, von oben nach unten. Kontakte stehen dort, wo sie wirken — nicht beim Gerät.',
      gruppen: ['kontakte', 'schalter', 'relais', 'schutz', 'melder'], schienen: 'steuer' },
    { id: 'stromlauf-zusammenhaengend', name: 'Stromlaufplan, zusammenhängend',
      erklaerung: 'Alle Teile eines Geräts stehen beieinander. Übersichtlich bei kleinen Schaltungen.',
      gruppen: ['relais', 'kontakte', 'schalter', 'motoren'], schienen: 'steuer' },
    { id: 'hauptstromkreis', name: 'Hauptstromkreis',
      erklaerung: 'Der Leistungsteil: Zuleitung, Schutz, Schütz, Motor. Drei Aussenleiter.',
      gruppen: ['schutz', 'relais', 'motoren', 'leitungen'], schienen: 'haupt' },
    { id: 'installationsplan', name: 'Installationsplan',
      erklaerung: 'Was wo im Raum sitzt — Leuchten, Schalter, Steckdosen im Grundriss.',
      gruppen: ['schalter', 'melder', 'stecker'], schienen: 'keine', quer: true },
    { id: 'uebersichtsplan', name: 'Übersichtsplan',
      erklaerung: 'Die Anlage grob, einpolig gezeichnet. Für den ersten Blick.',
      gruppen: ['schutz', 'motoren', 'quellen'], schienen: 'keine' },
    { id: 'klemmenplan', name: 'Klemmenplan',
      erklaerung: 'Welche Ader auf welche Klemme. Die Trennstelle zwischen Schrank und Anlage.',
      gruppen: ['stecker', 'leitungen'], schienen: 'keine' },
    { id: 'verdrahtungsplan', name: 'Verdrahtungsplan',
      erklaerung: 'Wie im Schrank wirklich verdrahtet wird — Ader für Ader.',
      gruppen: ['stecker', 'relais', 'schutz'], schienen: 'keine' },
    { id: 'anschlussplan', name: 'Anschlussplan',
      erklaerung: 'Die äusseren Anschlüsse eines Geräts, ohne sein Innenleben.',
      gruppen: ['motoren', 'stecker', 'leitungen'], schienen: 'keine' },
    { id: 'blockschaltbild', name: 'Blockschaltbild',
      erklaerung: 'Baugruppen als Kästen mit Pfeilen dazwischen. Wirkung statt Verdrahtung.',
      gruppen: ['quellen', 'motoren', 'messen'], schienen: 'keine', quer: true },
    { id: 'funktionsplan', name: 'Funktionsplan',
      erklaerung: 'Was die Steuerung tun soll, als Ablauf — noch ohne Bauteile.',
      gruppen: ['kontakte', 'relais'], schienen: 'keine', quer: true },
    { id: 'aufbauplan', name: 'Schaltschrank-Aufbau',
      erklaerung: 'Wo im Schrank welches Gerät sitzt. Massstäblich auf der Hutschiene.',
      gruppen: ['schutz', 'relais', 'stecker'], schienen: 'keine', quer: true }
  ];

  const artVon = (id: string) => ARTEN.find(a => a.id === id) || ARTEN[0]!;

  /** Die Leiter, die man als Schiene selbst zeichnen kann (E762). */
  const SCHIENEN = ['L1', 'L2', 'L3', 'N', 'PE'];

  /* ------------------------------------------------------------------------
   * EBENEN (Punkte 48, 49)
   * ------------------------------------------------------------------------
   * Zwei genügen und sind der ganze Zweck: was die Aufgabe stellt, und was
   * man selbst gelöst hat. Wer die Lösung ausblendet, sieht wieder die reine
   * Aufgabe — ohne dass etwas gelöscht wurde und ohne zweite Datei.
   * ----------------------------------------------------------------------*/
  const EBENEN_VORGABE: Ebene[] = [
    { id: 'plan',   name: 'Plan',   farbe: 'var(--text)', sichtbar: true },
    { id: 'aufgabe', name: 'Aufgabe', farbe: '#c2410c',   sichtbar: true },
    { id: 'loesung', name: 'Lösung', farbe: '#15803d',    sichtbar: true }
  ];

  /* Kennungen kommen aus `core/helpers/ids.js` — dieselben wie überall sonst,
     damit ein Planteil in einer Sicherung nicht anders aussieht als ein Block. */
  const uid = (): string => (typeof Ids !== 'undefined' && Ids.short)
    ? 'sp' + Ids.short()
    : 'sp' + Math.floor(performance.now() * 1000).toString(36);

  /** Ein leerer Plan der gewünschten Art. */
  const neuerPlan = (art = 'stromlauf-aufgeloest'): Plan => {
    const a = artVon(art);
    return {
      art: a.id,
      breite: a.quer ? 1000 : 800,
      hoehe: a.quer ? 600 : 700,
      teile: [], leitungen: [], texte: [],
      ebenen: EBENEN_VORGABE.map(e => ({ ...e }))
    };
  };

  /**
   * Den Plan aus einem Block lesen — und dabei heilen.
   *
   * Ein Block kann aus einer alten Sicherung kommen, aus einem Import oder
   * aus einer Fassung, die es noch nicht gab. Statt bei fehlenden Feldern zu
   * werfen, werden sie ergänzt: ein Plan ohne Ebenen bekommt die Vorgabe, ein
   * Teil ohne Drehung steht auf null. Ein Editor, der an einem alten Plan
   * abstürzt, ist schlimmer als einer, der ihn ergänzt.
   */
  /** E767: die Originalbytes einer Relais-.sch nur, wenn sie wirklich eine
      sind (Länge der Rohbytes, Liste der Spaltentitel); alles andere gekürzt. */
  const relaisLegacyLesen = (r: unknown): { relaisLegacy: RelaisLegacy } | null => {
    if (!r || typeof r !== 'object') return null;
    const o = r as Record<string, unknown>;
    if (typeof o.roh !== 'string' || o.roh.length !== 5760 || !Array.isArray(o.texte)) return null;
    return { relaisLegacy: {
      name: String(o.name || '').slice(0, 150),
      format: 'Relais-Schaltplan 9×30',
      roh: o.roh,
      txtRoh: typeof o.txtRoh === 'string' && o.txtRoh.length <= 22000 ? o.txtRoh : '',
      texte: o.texte.slice(0, 30).map(v => String(v).slice(0, 200)),
      verifiziert: o.verifiziert === true,
      bearbeitet: o.bearbeitet === true,
      texteBearbeitet: o.texteBearbeitet === true,
      nichtVerifiziert: Array.isArray(o.nichtVerifiziert)
        ? o.nichtVerifiziert.slice(0, 8).map(v => String(v).slice(0, 240)) : []
    } };
  };

  const lesen = (block: any): Plan => {
    const roh = (block && block.plan) || {};
    const a = artVon(String(roh.art || ''));
    return {
      art: a.id,
      breite: Number(roh.breite) || (a.quer ? 1000 : 800),
      hoehe: Number(roh.hoehe) || (a.quer ? 600 : 700),
      teile: (Array.isArray(roh.teile) ? roh.teile : []).map((t: any) => ({
        id: String(t.id || uid()),
        zeichen: String(t.zeichen || ''),
        x: rasten(Number(t.x) || 0), y: rasten(Number(t.y) || 0),
        drehung: Number(t.drehung) || 0,
        gespiegelt: !!t.gespiegelt,
        bmk: String(t.bmk || ''),
        nummern: (t.nummern && typeof t.nummern === 'object') ? t.nummern : {},
        gruppe: String(t.gruppe || ''),
        ebene: String(t.ebene || 'plan'),
        /* E767: nur gültige Werte; ein alter Plan bekommt keines der Felder. */
        ...(typeof t.beschriftung === 'string' && t.beschriftung.trim()
          ? { beschriftung: t.beschriftung.trim().slice(0, 120) } : {}),
        ...(Number.isInteger(t.legacySpalte) && t.legacySpalte >= 0 && t.legacySpalte < 30
          ? { legacySpalte: t.legacySpalte as number } : {}),
        ...(t.werte && typeof t.werte === 'object' && !Array.isArray(t.werte)
          ? { werte: Object.fromEntries(Object.entries(t.werte).filter(([, v]) =>
              typeof v === 'number' && Number.isFinite(v))) } : {})
      })).filter((t: Teil) => t.zeichen),
      leitungen: (Array.isArray(roh.leitungen) ? roh.leitungen : []).map((l: any) => ({
        id: String(l.id || uid()),
        punkte: (Array.isArray(l.punkte) ? l.punkte : [])
          .map((p: any) => ({ x: rasten(Number(p.x) || 0), y: rasten(Number(p.y) || 0) })),
        ebene: String(l.ebene || 'plan'),
        vonTeil: l.vonTeil ? String(l.vonTeil) : undefined,
        vonNr: l.vonNr ? String(l.vonNr) : undefined,
        nachTeil: l.nachTeil ? String(l.nachTeil) : undefined,
        nachNr: l.nachNr ? String(l.nachNr) : undefined,
        /* Nur gesetzt, wenn es eine bekannte Schiene ist — ein Plan von vor
           E762 bekommt kein neues Feld, auch kein leeres (§9). */
        ...(SCHIENEN.includes(String(l.schiene)) ? { schiene: String(l.schiene) } : {})
      })).filter((l: Leitung) => l.punkte.length >= 2),
      texte: (Array.isArray(roh.texte) ? roh.texte : []).map((x: any) => ({
        id: String(x.id || uid()),
        x: rasten(Number(x.x) || 0), y: rasten(Number(x.y) || 0),
        t: String(x.t || ''), ebene: String(x.ebene || 'plan')
      })).filter((x: Text) => x.t),
      ebenen: (Array.isArray(roh.ebenen) && roh.ebenen.length
        ? roh.ebenen.map((e: any) => ({
            id: String(e.id || 'plan'), name: String(e.name || 'Plan'),
            farbe: String(e.farbe || 'var(--text)'), sichtbar: e.sichtbar !== false
          }))
        : EBENEN_VORGABE.map(e => ({ ...e }))),
      ...(relaisLegacyLesen(roh.relaisLegacy) ?? {}),
      ...(roh.batterieUebung && typeof roh.batterieUebung === 'object' &&
           Array.isArray(roh.batterieUebung.teile)
        ? { batterieUebung: {
            id: String(roh.batterieUebung.id || ''),
            plus: String(roh.batterieUebung.plus || ''),
            minus: String(roh.batterieUebung.minus || ''),
            teile: roh.batterieUebung.teile.map(String).slice(0, 64),
            ...(Array.isArray(roh.batterieUebung.ausgaenge) ? {
              ausgaenge: roh.batterieUebung.ausgaenge.slice(0, 8).map((x: any) => ({
                id: String(x.id || ''), name: String(x.name || ''),
                zielU: Number(x.zielU) || 0, zielI: Number(x.zielI) || 0
              }))
            } : {})
          } } : {})
    };
  };

  /* ------------------------------------------------------------------------
   * DIE FORTLAUFENDE NUMMERIERUNG (Punkt 20)
   * ------------------------------------------------------------------------
   * Ein neues Schütz heisst K1, das nächste K2. Der Buchstabe kommt aus dem
   * Register (`kennbuchstabe`), die Zahl aus dem Plan: die kleinste, die noch
   * frei ist. NICHT „Anzahl plus eins" — wer K2 löscht und ein neues Schütz
   * setzt, bekäme sonst noch einmal K3, und im Plan fehlte K2 für immer.
   * ----------------------------------------------------------------------*/
  const naechstesBmk = (plan: Plan, zeichenId: string): string => {
    const z = (typeof Register !== 'undefined' && Register.fachzeichen)
      ? Register.fachzeichen.holen(zeichenId) : null;
    const buchstabe = (z && z.kennbuchstabe) || '';
    if (!buchstabe) return '';
    const belegt = new Set<number>();
    plan.teile.forEach(t => {
      const m = /^([A-Za-z]+)(\d+)$/.exec(t.bmk || '');
      if (m && m[1] === buchstabe) belegt.add(Number(m[2]));
    });
    let n = 1;
    while (belegt.has(n)) n++;
    return buchstabe + n;
  };

  /* ------------------------------------------------------------------------
   * WO LIEGT EIN ANSCHLUSS AUF DER FLÄCHE
   * ------------------------------------------------------------------------
   * Die Drehung rechnet das Register (`anschlussLage`); hier kommt nur die
   * Lage des Teils dazu. Zwei Stellen, eine Rechnung.
   * ----------------------------------------------------------------------*/
  const anschlussOrt = (t: Teil, nr: string): Punkt | null => {
    if (typeof Register === 'undefined' || !Register.fachzeichen) return null;
    const lage = Register.fachzeichen.anschlussLage(t.zeichen, nr, t.drehung, t.gespiegelt);
    if (!lage) return null;
    return { x: t.x + lage.x, y: t.y + lage.y };
  };

  /**
   * Welche Klemme meint ein gespeichertes Leitungsende an diesem Teil?
   * (E738, L252) Der Auflöser steht im Register (`klemmeFuer`); hier kommt
   * nur die Lage des Teils dazu, wie bei `anschlussOrt`. Gibt den heutigen
   * Namen zurück — oder den gespeicherten, wenn das Register ihn nicht kennt
   * (dann ändert sich gegenüber vorher nichts).
   */
  const klemmeFuer = (t: Teil | null | undefined, nr: string | undefined,
                      punkt?: Punkt | null): string | undefined => {
    if (!t || !nr || typeof Register === 'undefined' || !Register.fachzeichen
        || typeof Register.fachzeichen.klemmeFuer !== 'function') return nr;
    const r = Register.fachzeichen.klemmeFuer(t.zeichen, nr,
      punkt ? { x: punkt.x - t.x, y: punkt.y - t.y } : null, t.drehung, t.gespiegelt);
    return r ? r.nr : nr;
  };

  /** Alle Anschlüsse eines Teils mit ihrer Lage — für Einrasten und Anzeige. */
  const anschluesseVon = (t: Teil): Array<{ nr: string; anzeige: string } & Punkt> => {
    if (typeof Register === 'undefined' || !Register.fachzeichen) return [];
    const z = Register.fachzeichen.holen(t.zeichen);
    if (!z) return [];
    return z.anschluesse.map((a: any) => {
      const o = anschlussOrt(t, a.nr);
      return { nr: a.nr, anzeige: t.nummern[a.nr] ?? a.nr, x: o ? o.x : t.x, y: o ? o.y : t.y };
    });
  };

  /**
   * Der nächste Anschluss zu einem Punkt, wenn er nahe genug ist (Punkt 23).
   *
   * `FANG` ist bewusst gross: eine Maus trifft einen 10-px-Punkt nicht
   * zuverlässig, und ein Finger schon gar nicht. Lieber ein Anschluss zu
   * viel gefangen als eine Leitung, die daneben endet und im Bild aussieht,
   * als wäre sie angeschlossen.
   */
  const FANG = 14;
  const fangeAnschluss = (plan: Plan, p: Punkt, radius = FANG):
      { teil: string; nr: string; x: number; y: number } | null => {
    let beste: { teil: string; nr: string; x: number; y: number } | null = null;
    let weite = Math.max(0, radius) ** 2;
    plan.teile.forEach(t => anschluesseVon(t).forEach(a => {
      const d = (a.x - p.x) * (a.x - p.x) + (a.y - p.y) * (a.y - p.y);
      if (d <= weite) { weite = d; beste = { teil: t.id, nr: a.nr, x: a.x, y: a.y }; }
    }));
    return beste;
  };

  /* ------------------------------------------------------------------------
   * RECHTWINKLIG FÜHREN (Punkt 14)
   * ------------------------------------------------------------------------
   * Zwischen zwei Punkten gibt es zwei rechtwinklige Wege: erst waagrecht,
   * dann senkrecht — oder umgekehrt. Genommen wird der, der zuerst in die
   * LÄNGERE Richtung läuft. Das trifft, was man beim Zeichnen erwartet: ein
   * weit rechts liegender Anschluss wird waagrecht angefahren, ein weit
   * unten liegender senkrecht.
   * ----------------------------------------------------------------------*/
  const rechtwinklig = (a: Punkt, b: Punkt): Punkt[] => {
    if (a.x === b.x || a.y === b.y) return [a, b];
    const waagrechtZuerst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
    const ecke = waagrechtZuerst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
    return [a, ecke, b];
  };

  /* ------------------------------------------------------------------------
   * NACHZIEHEN, OHNE ANZUZAPFEN (E746, L253 Punkt 4)
   * ------------------------------------------------------------------------
   * Dreht, spiegelt, zieht oder schiebt jemand ein Teil, müssen die Leitungen
   * mit, die daran hängen. Bis E746 führte die Planfläche dabei beim Drehen,
   * Spiegeln und Ziehen ALLE Leitungen des Plans neu, jede als Winkel von
   * Ende zu Ende — und ein neuer Weg konnte eine Klemme anzapfen, die vorher
   * frei war. Gemessen: nach dem Drehen des alten FI lief b2 5 px neben N2
   * vorbei (test608), und im Plan „Drehstrom, FI und Übertrager" waren
   * danach L und N der Quelle EIN Netz. Eine Handlung, die nur die Lage
   * ändern sollte, änderte die Schaltung — das ist der Fall, gegen den §51
   * steht.
   *
   * Seither gilt, in dieser Reihenfolge:
   *
   *   1. Neu geführt wird nur, was an einem bewegten Teil hängt. Jede andere
   *      Leitung behält ihre Punkte Byte für Byte — mit EINER Ausnahme, die
   *      E738 beschreibt und test608 §5 misst: liegt ihr gezeichnetes Ende
   *      NEBEN der Klemme, die es meint (ein Plan von vor E735, L253
   *      Punkt 7), rückt es beim Drehen, Spiegeln und Ziehen an die Klemme,
   *      wie bisher — und mit derselben Prüfung wie jeder neue Weg.
   *   2. Ein neuer Weg muss genau das berühren, was die Leitung vorher
   *      berührte: dieselben Klemmen, dieselben Leitungen, nach der Regel der
   *      Netzliste. Probiert wird in fester Reihenfolge — der alte Weg, wenn
   *      beide Enden geblieben sind · der alte Weg mit nachgerückten
   *      Endstücken (so bleibt eine gezeichnete Führung erhalten) · der
   *      Winkel wie bisher (`rechtwinklig`) · der andere Winkel · Z-Wege
   *      über das Raster, die kürzesten zuerst, dann die nächsten zur Mitte ·
   *      Hakenwege mit vier Strecken. Der erste, der passt UND durch kein
   *      Zeichen läuft, gilt; läuft jeder passende durch ein Zeichen, der
   *      erste passende. (Eine Leitung quer durch die Lampe sah nach dem
   *      Drehen des FI aus, als hinge sie an ihr — das Bild hat es gezeigt,
   *      nicht die Netzliste.) Der alte Weg selbst gilt immer, wenn er passt:
   *      was der Mensch so gezeichnet hat, bleibt.
   *   3. Passt keiner, gilt der erste, der nichts NEUES berührt (Stufe 2 —
   *      er verliert höchstens eine Berührung, die es vorher gab). Geht auch
   *      das nicht, weil schon das Ende neben einer fremden Klemme liegt,
   *      gilt der mit den wenigsten neuen Berührungen (Stufe 3). Der Bericht
   *      sagt je Leitung, welche Stufe es war; die Planfläche meldet 2 und 3.
   *
   * Beim Ziehen mit der Maus fällt das je Bewegung an. Dort rechnet die
   * Fläche deshalb `schnell` — nur der alte Weg, die nachgerückten
   * Endstücke und die zwei Winkel, keine Z- und Hakenwege — und erst beim
   * Loslassen einmal voll, vom Anfassen aus. Gespeichert wird nur das
   * Ergebnis der vollen Suche (E746, Fund der Durchsicht: auf vierfach
   * gedrosselter CPU brauchte jede Bewegung im Median 24 bis 29 ms,
   * messungen §103).
   *
   * Was es NICHT verhindert: wer ein Teil so hinstellt, dass SEINE Klemme
   * auf einer fremden Leitung liegt, verbindet es — das ist der Weg, auf dem
   * die Netzliste über den Ort fängt („der Ort fängt die Fälle, in denen
   * jemand eine Leitung von Hand an eine Klemme geschoben hat"). Das ist die
   * Lage, nicht das Nachziehen, und vielleicht ist es gewollt. Still bleibt
   * es aber nicht: `veraendert` vergleicht danach, was jede Leitung berührt
   * und welche Klemmen aufeinanderliegen, mit dem Stand von vorher, und die
   * Planfläche sagt, was sich geändert hat (§35, §51).
   * ----------------------------------------------------------------------*/

  /** Die Fangweite der Netzliste — dieselbe Zahl wie dort (Register, E738). */
  const NAH = (): number => (typeof Register !== 'undefined' && Register.fachzeichen
    && typeof Register.fachzeichen.NAH === 'number') ? Register.fachzeichen.NAH : 6;

  /**
   * Liegt `p` auf der Strecke a–b, mit der Fangweite der Netzliste?
   *
   * DIESELBE Regel wie `aufStrecke` in simulation.ts (`netze()`), und sie
   * steht mit Absicht zweimal: die Planfläche darf die Netzliste nicht rufen
   * (§5 Regel 1, `test537` zählt jeden Griff nach `Stromfluss`). Zwei Regeln
   * für dasselbe laufen auseinander, wenn niemand sie vergleicht — `test611`
   * §7 hält für jede Leitung zweier Pläne die Antwort dieser Regel gegen die
   * der Netzliste. Wer eine der beiden ändert, ändert beide.
   */
  const nahAnStrecke = (p: Punkt, a: Punkt, b: Punkt): boolean => {
    const nah = NAH();
    if (Math.abs(a.y - b.y) <= 1 && Math.abs(p.y - a.y) <= nah)
      return p.x >= Math.min(a.x, b.x) - nah && p.x <= Math.max(a.x, b.x) + nah;
    if (Math.abs(a.x - b.x) <= 1 && Math.abs(p.x - a.x) <= nah)
      return p.y >= Math.min(a.y, b.y) - nah && p.y <= Math.max(a.y, b.y) + nah;
    return false;
  };

  type Klemmort = { teil: string; nr: string; x: number; y: number; name: string };

  /** Alle Klemmen des Plans mit ihrem Ort — so, wie die Netzliste sie sieht. */
  const klemmorte = (plan: Plan): Klemmort[] => {
    const raus: Klemmort[] = [];
    plan.teile.forEach(t => anschluesseVon(t).forEach(a =>
      raus.push({ teil: String(t.id), nr: a.nr, x: a.x, y: a.y, name: String(t.id) + ':' + a.nr })));
    return raus;
  };

  /** Welche Klemme meint ein Leitungsende, und brauchte es dafür einen alten
      Namen oder Ort? Wie `endeVon` in der Netzliste (E738). */
  const endeGenau = (plan: Plan, teil: string, nr: string, p: Punkt | undefined):
      { nr: string; frueher: boolean } => {
    const t = plan.teile.find(x => String(x.id) === teil);
    const F = (typeof Register !== 'undefined') ? Register.fachzeichen : null;
    if (!t || !F || typeof F.klemmeFuer !== 'function') return { nr, frueher: false };
    const r = F.klemmeFuer(t.zeichen, nr, p ? { x: p.x - t.x, y: p.y - t.y } : null,
                           t.drehung, t.gespiegelt);
    return r || { nr, frueher: false };
  };

  /** Was eine Leitung berührt: Klemmen als „Teil:Nr", Leitungen als Kennung. */
  type Beruehrung = { klemmen: string[]; leitungen: string[] };

  const leitungenBeruehren = (pa: Punkt[], pb: Punkt[]): boolean => {
    for (const p of pa)
      for (let s = 0; s + 1 < pb.length; s++) if (nahAnStrecke(p, pb[s]!, pb[s + 1]!)) return true;
    for (const p of pb)
      for (let s = 0; s + 1 < pa.length; s++) if (nahAnStrecke(p, pa[s]!, pa[s + 1]!)) return true;
    return false;
  };

  /**
   * Was berührt die Leitung `l`, wenn sie über `punkte` läuft? Die Regel der
   * Netzliste, Schritt für Schritt: erst die gespeicherte Bindung (über den
   * Auflöser), dann der Ort — jeder Punkt und jede Strecke gegen jede Klemme,
   * ausser denen, die ein Ende mit altem Namen nicht fassen darf —, und
   * zuletzt die anderen Leitungen (ein Ende oder Knick auf einer Strecke).
   *
   * Mit `erlaubt` bricht sie ab, sobald etwas berührt wird, das nicht darin
   * steht, und gibt null — so kostet ein Weg, der eine fremde Klemme streift,
   * nur die Rechnung bis zu dieser Klemme. Das braucht die lange Liste der
   * Hakenwege unten.
   */
  const pruefeBeruehrung = (plan: Plan, l: Leitung, punkte: Punkt[], orte: Klemmort[],
                            andere: Leitung[],
                            erlaubt?: { klemmen: Set<string>; leitungen: Set<string> }): Beruehrung | null => {
    const nah = NAH();
    const klemmen = new Set<string>();
    const nicht = new Set<string>();
    const enden: Array<[string | undefined, string | undefined, Punkt | undefined]> = [
      [l.vonTeil, l.vonNr, punkte[0]], [l.nachTeil, l.nachNr, punkte[punkte.length - 1]]];
    for (const [tid, nr, p] of enden) {
      if (!tid || !nr) continue;
      const teil = String(tid);
      const r = endeGenau(plan, teil, nr, p);
      const name = teil + ':' + r.nr;
      if (erlaubt && !erlaubt.klemmen.has(name)) return null;
      klemmen.add(name);
      if (r.frueher) orte.forEach(k => { if (k.teil === teil && k.nr !== r.nr) nicht.add(k.name); });
    }
    for (const k of orte) {
      if (nicht.has(k.name) || klemmen.has(k.name)) continue;
      let trifft = punkte.some(p => Math.abs(p.x - k.x) <= nah && Math.abs(p.y - k.y) <= nah);
      for (let i = 0; !trifft && i + 1 < punkte.length; i++) trifft = nahAnStrecke(k, punkte[i]!, punkte[i + 1]!);
      if (!trifft) continue;
      if (erlaubt && !erlaubt.klemmen.has(k.name)) return null;
      klemmen.add(k.name);
    }
    const leitungen: string[] = [];
    for (const m of andere) {
      if (m.id === l.id || !leitungenBeruehren(punkte, m.punkte)) continue;
      if (erlaubt && !erlaubt.leitungen.has(m.id)) return null;
      leitungen.push(m.id);
    }
    return { klemmen: [...klemmen].sort(), leitungen: leitungen.sort() };
  };
  const beruehrung = (plan: Plan, l: Leitung, punkte: Punkt[], orte: Klemmort[],
                      andere: Leitung[]): Beruehrung =>
    pruefeBeruehrung(plan, l, punkte, orte, andere) ?? { klemmen: [], leitungen: [] };

  /** Was eine gespeicherte Leitung im Plan berührt — für Prüfläufe (test611 §7). */
  const kontakte = (plan: Plan, l: Leitung): Beruehrung =>
    beruehrung(plan, l, l.punkte, klemmorte(plan), plan.leitungen);

  /** Was VOR einer Lageänderung feststeht. */
  type Vorher = {
    /** Welche Klemme jedes Leitungsende meint (E738, L252) — gefragt, solange
        Leitung und Teil noch zueinander passen. */
    klemmen: Map<string, { von: string | undefined; nach: string | undefined }>;
    /** Die Punkte jeder Leitung, als Kopie. */
    punkte: Map<string, Punkt[]>;
    /** Was jede Leitung berührt — daran misst sich jeder neue Weg. */
    beruehrt: Map<string, Beruehrung>;
    /** Welche Klemmen zweier Teile aufeinanderliegen („A|B", sortiert). */
    aufeinander: Set<string>;
  };

  /**
   * Klemmen zweier verschiedener Teile, die mit der Fangweite der Netzliste
   * aufeinanderliegen. Die Netzliste verbindet sie NICHT — Klemmen hängen nur
   * über Leitungen zusammen —, aber gezeichnet sehen sie verbunden aus. Wer
   * ein Teil so hinstellt, soll es wissen (`veraendert`).
   */
  const klemmenAufeinander = (orte: Klemmort[]): Set<string> => {
    const nah = NAH();
    const raus = new Set<string>();
    for (let i = 0; i < orte.length; i++)
      for (let j = i + 1; j < orte.length; j++) {
        const a = orte[i]!, b = orte[j]!;
        if (a.teil === b.teil || Math.abs(a.x - b.x) > nah || Math.abs(a.y - b.y) > nah) continue;
        raus.add(a.name < b.name ? a.name + '|' + b.name : b.name + '|' + a.name);
      }
    return raus;
  };

  /**
   * Vor dem Drehen, Spiegeln, Schieben oder beim Anfassen zum Ziehen.
   *
   * WELCHE KLEMME MEINT JEDES LEITUNGSENDE? (E738) Gefragt wird VOR der
   * Änderung: der Auflöser entscheidet zuerst am Ort, und nach dem Schieben
   * oder Drehen liegt das Ende nicht mehr an seiner Klemme. Beim alten FI ist
   * das der ganze Unterschied — `N` unten ist N2, `N` ohne Ort ist das obere
   * N. Gespeichert wird der Name nicht um; nur die Punkte rücken.
   */
  const vorherMerken = (plan: Plan): Vorher => {
    const orte = klemmorte(plan);
    const teil = (id: string | undefined): Teil | undefined =>
      id === undefined ? undefined : plan.teile.find(t => String(t.id) === String(id));
    const klemmen = new Map<string, { von: string | undefined; nach: string | undefined }>();
    const punkte = new Map<string, Punkt[]>();
    const beruehrt = new Map<string, Beruehrung>();
    plan.leitungen.forEach(l => {
      const n = l.punkte.length;
      klemmen.set(l.id, {
        von: l.vonTeil ? klemmeFuer(teil(l.vonTeil), l.vonNr, l.punkte[0]) : undefined,
        nach: l.nachTeil ? klemmeFuer(teil(l.nachTeil), l.nachNr, l.punkte[n - 1]) : undefined
      });
      punkte.set(l.id, l.punkte.map(p => ({ x: p.x, y: p.y })));
      beruehrt.set(l.id, beruehrung(plan, l, l.punkte, orte, plan.leitungen));
    });
    return { klemmen, punkte, beruehrt, aufeinander: klemmenAufeinander(orte) };
  };

  /**
   * Was hat sich nach einer Lageänderung an den Berührungen geändert,
   * gemessen an `vorher`? Je Leitung die Klemmen und Leitungen, die sie jetzt
   * berührt und vorher nicht (oder umgekehrt) — nach derselben Regel wie die
   * Netzliste, also genau die Änderungen, die die Netzliste ändern können —,
   * und dazu Klemmen, die jetzt aufeinanderliegen oder nicht mehr.
   *
   * Das Nachziehen sorgt dafür, dass eine NACHGEZOGENE Leitung dasselbe
   * berührt wie vorher. Was es nicht verhindern kann (und nicht soll): dass
   * die eigene Klemme eines bewegten Teils auf einer fremden Leitung landet
   * oder sie verlässt — gemessen in der Durchsicht: R1 gedreht, und R1:1 lag
   * auf der Leitung E1:X2–E2:X1, ohne ein Wort. Diese Liste sagt es.
   * Ein Leitungspaar steht nur einmal darin (bei der kleineren Kennung).
   */
  type Aenderung =
    | { art: 'klemme'; leitung: string; klemme: string; jetzt: boolean }
    | { art: 'leitung'; leitung: string; andere: string; jetzt: boolean }
    | { art: 'aufeinander'; klemme: string; andere: string; jetzt: boolean };
  const veraendert = (plan: Plan, vorher: Vorher): Aenderung[] => {
    const orte = klemmorte(plan);
    const raus: Aenderung[] = [];
    plan.leitungen.forEach(l => {
      const vor = vorher.beruehrt.get(l.id);
      if (!vor) return;
      const jetzt = beruehrung(plan, l, l.punkte, orte, plan.leitungen);
      jetzt.klemmen.forEach(k => { if (!vor.klemmen.includes(k)) raus.push({ art: 'klemme', leitung: l.id, klemme: k, jetzt: true }); });
      vor.klemmen.forEach(k => { if (!jetzt.klemmen.includes(k)) raus.push({ art: 'klemme', leitung: l.id, klemme: k, jetzt: false }); });
      jetzt.leitungen.forEach(m => { if (l.id < m && !vor.leitungen.includes(m)) raus.push({ art: 'leitung', leitung: l.id, andere: m, jetzt: true }); });
      vor.leitungen.forEach(m => { if (l.id < m && !jetzt.leitungen.includes(m)
        && plan.leitungen.some(x => x.id === m)) raus.push({ art: 'leitung', leitung: l.id, andere: m, jetzt: false }); });
    });
    const auf = klemmenAufeinander(orte);
    const paar = (s: string, jetzt: boolean): Aenderung => {
      const [a, b] = s.split('|');
      return { art: 'aufeinander', klemme: a ?? '', andere: b ?? '', jetzt };
    };
    auf.forEach(s => { if (!vorher.aufeinander.has(s)) raus.push(paar(s, true)); });
    vorher.aufeinander.forEach(s => { if (!auf.has(s)) raus.push(paar(s, false)); });
    return raus;
  };

  const gleicherPunkt = (a: Punkt, b: Punkt): boolean => a.x === b.x && a.y === b.y;
  const ohneDoppel = (ps: Punkt[]): Punkt[] =>
    ps.filter((p, i) => i === 0 || !gleicherPunkt(p, ps[i - 1]!));
  const allesRechtwinklig = (ps: Punkt[]): boolean =>
    ps.every((p, i) => i === 0 || p.x === ps[i - 1]!.x || p.y === ps[i - 1]!.y);

  /**
   * Der alte Weg mit nachgerückten Endstücken. Läuft das letzte Stück
   * senkrecht in die Klemme, wandert sein Knick waagrecht mit; läuft es
   * waagrecht, senkrecht. Alles dazwischen bleibt, wie es gezeichnet ist —
   * wer ein Teil um ein Raster schiebt, will seine Leitung nicht als neuen
   * Winkel quer durch den Plan wiederfinden. Gibt null, wenn dabei eine
   * schräge Strecke entstünde.
   */
  const gleitend = (alt: Punkt[], a: Punkt, b: Punkt): Punkt[] | null => {
    const n = alt.length;
    if (n < 2) return null;
    if (n === 2) return (a.x === b.x || a.y === b.y) ? [a, b] : null;
    const q = alt.map(p => ({ x: p.x, y: p.y }));
    const ruecke = (ende: number, nachbar: number, ziel: Punkt): boolean => {
      const e = alt[ende]!, m = alt[nachbar]!;
      if (gleicherPunkt(e, ziel)) return true;
      if (e.y === m.y && e.x !== m.x) q[nachbar]!.y = ziel.y;
      else if (e.x === m.x && e.y !== m.y) q[nachbar]!.x = ziel.x;
      else return false;
      q[ende] = { x: ziel.x, y: ziel.y };
      return true;
    };
    if (!ruecke(0, 1, a) || !ruecke(n - 1, n - 2, b)) return null;
    const r = ohneDoppel(q);
    return r.length >= 2 && allesRechtwinklig(r) ? r : null;
  };

  /** Der andere der zwei Winkel zwischen a und b — null, wenn es nur die Gerade gibt. */
  const andererWinkel = (a: Punkt, b: Punkt): Punkt[] | null => {
    if (a.x === b.x || a.y === b.y) return null;
    const ecke = rechtwinklig(a, b)[1]!;
    return [a, ecke.x === b.x ? { x: a.x, y: b.y } : { x: b.x, y: a.y }, b];
  };

  /**
   * Z-Wege über das Raster: waagrecht–senkrecht–waagrecht mit dem
   * senkrechten Stück bei jedem x, senkrecht–waagrecht–senkrecht mit dem
   * waagrechten bei jedem y, innerhalb des Blatts. Auch Umwege (das
   * Mittelstück ausserhalb der Enden), denn manchmal liegt zwischen den
   * Enden eine Klemme quer. Geordnet: kürzester Weg zuerst, dann der nächste
   * zur Mitte, dann waagrecht vor senkrecht, dann die Lage — fest, damit
   * dieselbe Handlung immer denselben Weg gibt.
   */
  const zWege = (a: Punkt, b: Punkt, breite: number, hoehe: number): Punkt[][] => {
    const r = R();
    const liste: Array<{ weg: Punkt[]; laenge: number; abstand: number; art: number; m: number }> = [];
    const mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
    if (a.y !== b.y) for (let mx = 0; mx <= breite; mx += r) {
      if (mx === a.x || mx === b.x) continue;
      liste.push({ weg: [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b],
                   laenge: Math.abs(mx - a.x) + Math.abs(b.y - a.y) + Math.abs(b.x - mx),
                   abstand: Math.abs(mx - mx0), art: 0, m: mx });
    }
    if (a.x !== b.x) for (let my = 0; my <= hoehe; my += r) {
      if (my === a.y || my === b.y) continue;
      liste.push({ weg: [a, { x: a.x, y: my }, { x: b.x, y: my }, b],
                   laenge: Math.abs(my - a.y) + Math.abs(b.x - a.x) + Math.abs(b.y - my),
                   abstand: Math.abs(my - my0), art: 1, m: my });
    }
    liste.sort((p, q) => p.laenge - q.laenge || p.abstand - q.abstand || p.art - q.art || p.m - q.m);
    return liste.map(e => e.weg);
  };

  /**
   * Hakenwege mit vier Strecken: waagrecht–senkrecht–waagrecht–senkrecht und
   * senkrecht–waagrecht–senkrecht–waagrecht. Sie braucht es, wenn eine Klemme
   * nur von einer Seite frei anzufahren ist — beim gedrehten und dann
   * gespiegelten FI liegt N oben in der rechten Spalte, darunter 3 und 1, und
   * links daneben in derselben Zeile N2: jeder Z-Weg dorthin streift eine
   * davon (gemessen in test611 §2, bevor es sie gab). Gesucht wird in einem
   * Fenster von zehn Rastern um die Enden, geordnet wie die Z-Wege.
   */
  const hakenWege = (a: Punkt, b: Punkt, breite: number, hoehe: number): Punkt[][] => {
    const r = R();
    const rand = 10 * r;
    const werte = (u: number, v: number, max: number): number[] => {
      const raus: number[] = [];
      const lo = Math.max(0, Math.ceil((Math.min(u, v) - rand) / r) * r);
      const hi = Math.min(max, Math.max(u, v) + rand);
      for (let w = lo; w <= hi; w += r) raus.push(w);
      return raus;
    };
    const xs = werte(a.x, b.x, breite), ys = werte(a.y, b.y, hoehe);
    const mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
    const liste: Array<{ weg: Punkt[]; laenge: number; abstand: number; art: number; x: number; y: number }> = [];
    for (const x1 of xs) {
      if (x1 === a.x || x1 === b.x) continue;
      for (const y1 of ys) {
        if (y1 === a.y || y1 === b.y) continue;
        const laenge = Math.abs(x1 - a.x) + Math.abs(y1 - a.y) + Math.abs(b.x - x1) + Math.abs(b.y - y1);
        const abstand = Math.abs(x1 - mx0) + Math.abs(y1 - my0);
        liste.push({ weg: [a, { x: x1, y: a.y }, { x: x1, y: y1 }, { x: b.x, y: y1 }, b],
                     laenge, abstand, art: 0, x: x1, y: y1 });
        liste.push({ weg: [a, { x: a.x, y: y1 }, { x: x1, y: y1 }, { x: x1, y: b.y }, b],
                     laenge, abstand, art: 1, x: x1, y: y1 });
      }
    }
    liste.sort((p, q) => p.laenge - q.laenge || p.abstand - q.abstand || p.art - q.art
      || p.x - q.x || p.y - q.y);
    return liste.map(e => e.weg);
  };

  /**
   * Die Kästen der Zeichen, gedreht wie gezeichnet (um die Mitte des
   * ungedrehten Zeichens, wie `anschlussLage` dreht), um einen Punkt nach
   * innen verkleinert: ein Weg, der eine Klemme am Rand anfährt oder an der
   * Kante entlangläuft, liegt nicht DARIN.
   */
  type Kasten = { x1: number; y1: number; x2: number; y2: number };
  const kaesten = (plan: Plan): Kasten[] => {
    if (typeof Register === 'undefined' || !Register.fachzeichen) return [];
    const raus: Kasten[] = [];
    plan.teile.forEach(t => {
      const z = Register.fachzeichen.holen(t.zeichen);
      if (!z) return;
      const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
      const cx = t.x + z.w / 2, cy = t.y + z.h / 2;
      raus.push({ x1: cx - m.w / 2 + 1, y1: cy - m.h / 2 + 1, x2: cx + m.w / 2 - 1, y2: cy + m.h / 2 - 1 });
    });
    return raus;
  };
  /** Läuft ein Weg mitten durch ein Zeichen? */
  const durchZeichen = (w: Punkt[], ks: Kasten[]): boolean => {
    for (let i = 0; i + 1 < w.length; i++) {
      const a = w[i]!, b = w[i + 1]!;
      const xa = Math.min(a.x, b.x), xb = Math.max(a.x, b.x);
      const ya = Math.min(a.y, b.y), yb = Math.max(a.y, b.y);
      for (const k of ks) {
        if (a.y === b.y ? (a.y > k.y1 && a.y < k.y2 && Math.max(xa, k.x1) < Math.min(xb, k.x2))
                        : (a.x > k.x1 && a.x < k.x2 && Math.max(ya, k.y1) < Math.min(yb, k.y2))) return true;
      }
    }
    return false;
  };

  /** Je neu geführte Leitung: welche Stufe (1 passt genau, 2 nichts Neues, 3 am wenigsten Neues). */
  type Bericht = Array<{ id: string; stufe: 1 | 2 | 3 }>;

  /**
   * Die Leitungen nach einer Lageänderung nachziehen (E746).
   *
   * `teile` sind die Kennungen der bewegten Teile. `heilen` rückt zusätzlich
   * jedes gebundene Ende, das neben seiner Klemme liegt, an die Klemme (beim
   * Drehen, Spiegeln, Ziehen — so schon vor E746; die Pfeiltaste tat es nie).
   * `ohne` sind Leitungen, die der Mensch selbst mitgeschoben hat — sie
   * fasst das Nachziehen nicht an. `vonVorn` setzt erst alle Leitungen auf
   * die Punkte von `vorher` zurück: beim Ziehen mit der Maus wird bei jeder
   * Bewegung vom Anfassen aus gerechnet, nicht vom letzten Zwischenstand.
   * `schnell` probiert nur die billigen Wege (alter Weg, nachgerückte
   * Endstücke, die zwei Winkel) und lässt Z- und Hakenwege aus — für die
   * Bilder WÄHREND des Ziehens. Passt dort keiner, gilt dieselbe Rangfolge
   * wie sonst (Stufe 2, dann 3); gespeichert wird so ein Zwischenbild nie,
   * die Planfläche rechnet beim Loslassen voll.
   */
  const nachziehen = (plan: Plan, vorher: Vorher, teile: Iterable<string>,
                      wie: { heilen?: boolean; ohne?: Set<string>; vonVorn?: boolean;
                             schnell?: boolean } = {}): Bericht => {
    if (wie.vonVorn) plan.leitungen.forEach(l => {
      const p = vorher.punkte.get(l.id);
      if (p) l.punkte = p.map(q => ({ x: q.x, y: q.y }));
    });
    const bewegt = new Set<string>([...teile].map(String));
    const heilen = !!wie.heilen;
    const teil = (id: string | undefined): Teil | undefined =>
      id === undefined ? undefined : plan.teile.find(t => String(t.id) === String(id));

    /* 1 · Wer wird neu geführt, und wo gehören seine Enden hin? */
    const auftrag: Array<{ l: Leitung; a: Punkt; b: Punkt }> = [];
    plan.leitungen.forEach(l => {
      if (wie.ohne && wie.ohne.has(l.id)) return;
      const alt = l.punkte;
      if (alt.length < 2) return;
      const k = vorher.klemmen.get(l.id);
      const vonBewegt = !!l.vonTeil && bewegt.has(String(l.vonTeil));
      const nachBewegt = !!l.nachTeil && bewegt.has(String(l.nachTeil));
      const ort = (tid: string | undefined, nr: string | undefined, rueck: Punkt, mit: boolean): Punkt => {
        if (!tid || !mit) return rueck;
        const t = teil(tid);
        const o = t ? anschlussOrt(t, nr ?? '') : null;
        return o || rueck;
      };
      const a = ort(l.vonTeil, k?.von ?? l.vonNr, alt[0]!, vonBewegt || heilen);
      const b = ort(l.nachTeil, k?.nach ?? l.nachNr, alt[alt.length - 1]!, nachBewegt || heilen);
      const geblieben = gleicherPunkt(a, alt[0]!) && gleicherPunkt(b, alt[alt.length - 1]!);
      /* Eine fremde Leitung, deren Enden liegen, wo sie hingehören: kein Punkt ändert sich. */
      if (!vonBewegt && !nachBewegt && geblieben) return;
      auftrag.push({ l, a, b });
    });

    /* 2 · Der Reihe nach führen. Geprüft wird gegen alles, was schon steht:
           die Leitungen, die bleiben, und die schon neu geführten. Eine noch
           offene prüft ihrerseits gegen diese hier, wenn sie dran ist — so
           wird jedes Paar genau einmal verglichen. */
    const orte = klemmorte(plan);
    const ks = kaesten(plan);
    const offen = new Set(auftrag.map(x => x.l.id));
    const breite = Number(plan.breite) || 1000, hoehe = Number(plan.hoehe) || 700;
    const bericht: Bericht = [];
    auftrag.forEach(({ l, a, b }) => {
      const alt = l.punkte;
      const vor = vorher.beruehrt.get(l.id) || { klemmen: [], leitungen: [] };
      const vorK = new Set(vor.klemmen), vorL = new Set(vor.leitungen);
      const fertig = plan.leitungen.filter(m => m.id !== l.id && !offen.has(m.id));
      const wahl: { zweit: Punkt[] | null; dritt: { weg: Punkt[]; neu: number } | null } =
        { zweit: null, dritt: null };
      const passt = (w: Punkt[]): boolean => {
        const k = beruehrung(plan, l, w, orte, fertig);
        const kSet = new Set(k.klemmen), lSet = new Set(k.leitungen);
        const neuK = k.klemmen.filter(x => !vorK.has(x)).length;
        const wegK = vor.klemmen.filter(x => !kSet.has(x)).length;
        let neuL = 0, wegL = 0;
        fertig.forEach(m => {
          const jetzt = lSet.has(m.id), frueher = vorL.has(m.id);
          if (jetzt && !frueher) neuL++;
          if (!jetzt && frueher) wegL++;
        });
        if (!neuK && !wegK && !neuL && !wegL) return true;
        if (!neuK && !neuL && !wahl.zweit) wahl.zweit = w;
        if (!wahl.dritt || neuK + neuL < wahl.dritt.neu) wahl.dritt = { weg: w, neu: neuK + neuL };
        return false;
      };
      const probiert = new Set<string>();
      const neu = (w: Punkt[] | null): w is Punkt[] => {
        if (!w || w.length < 2) return false;
        const s = JSON.stringify(w);
        if (probiert.has(s)) return false;
        probiert.add(s);
        return true;
      };
      /* Passt ein Weg, gilt er, wenn er durch kein Zeichen läuft. Läuft er
         durch eines, wird er gemerkt (`notfalls`) und weitergesucht. */
      let gewaehlt: Punkt[] | null = null;
      let notfalls: Punkt[] | null = null;
      const nimm = (w: Punkt[]): boolean => {
        /* Auch ein Weg, der AUF einer anderen Leitung entlangläuft, ist nur
           ein Notfall (E762, „alle leiter gehen übereinander"): er passt —
           er berührte sie ja schon vorher, etwa die Schiene, an der er
           endet —, aber zwei Striche aufeinander liest niemand. */
        if (!durchZeichen(w, ks) && !ueberlappt(w, plan.leitungen, l.id)) { gewaehlt = w; return true; }
        if (!notfalls) notfalls = w;
        return false;
      };
      const unveraendert = gleicherPunkt(a, alt[0]!) && gleicherPunkt(b, alt[alt.length - 1]!);
      if (unveraendert && neu(alt) && passt(alt)) gewaehlt = alt;
      const zuerst: Array<Punkt[] | null> = [
        gleitend(alt, a, b), ohneDoppel(rechtwinklig(a, b)), andererWinkel(a, b)];
      if (!gewaehlt) for (const w of zuerst) if (neu(w) && passt(w) && nimm(w)) break;
      /* Beim Ziehen (`schnell`) ist hier Schluss: die Z- und Hakenwege sind
         die teuren — gemessen bis 217 ms je Bewegung bei vierfach
         gedrosselter CPU (messungen §103). */
      if (!gewaehlt && !wie.schnell)
        for (const w of zWege(a, b, breite, hoehe)) if (neu(w) && passt(w) && nimm(w)) break;
      /* Die Hakenwege sind viele: hier zählt nur, ob einer GENAU passt, und
         wer etwas Neues streift, ist nach der ersten fremden Klemme draussen. */
      if (!gewaehlt && !wie.schnell) {
        const erlaubt = { klemmen: vorK, leitungen: vorL };
        for (const w of hakenWege(a, b, breite, hoehe)) {
          if (!neu(w)) continue;
          const k = pruefeBeruehrung(plan, l, w, orte, fertig, erlaubt);
          if (!k) continue;
          const fehlt = vor.klemmen.some(x => !k.klemmen.includes(x))
            || fertig.some(m => vorL.has(m.id) && !k.leitungen.includes(m.id));
          if (!fehlt) { if (nimm(w)) break; continue; }
          if (!wahl.zweit) wahl.zweit = w;
        }
      }
      if (!gewaehlt && notfalls) gewaehlt = notfalls;
      let stufe: 1 | 2 | 3 = 1;
      if (!gewaehlt) {
        stufe = wahl.zweit ? 2 : 3;
        gewaehlt = wahl.zweit || (wahl.dritt ? wahl.dritt.weg : null) || alt;
      }
      l.punkte = gewaehlt.map(p => ({ x: p.x, y: p.y }));
      offen.delete(l.id);
      bericht.push({ id: l.id, stufe });
    });
    return bericht;
  };

  /* ------------------------------------------------------------------------
   * NICHTS ÜBEREINANDER, LEITER SCHIEBEN, ALLES DREHEN (E762)
   * ------------------------------------------------------------------------
   * Redur, 31. Oktober 2026: „alle leiter gehen übereinander es sollte nicht
   * so sein und ich sollte alles umdrehen können". Drei Rechnungen, alle
   * ohne ein einziges Ereignis — die Planfläche ruft sie, die Prüfläufe
   * können sie auch ohne Zeiger fragen.
   * ----------------------------------------------------------------------*/

  /** Liegen zwei Strecken auf derselben Linie und teilen ein Stück (> 0)? */
  const streckenAufeinander = (a: Punkt, b: Punkt, c: Punkt, d: Punkt): boolean => {
    if (a.y === b.y && c.y === d.y && a.y === c.y)
      return Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) > 0;
    if (a.x === b.x && c.x === d.x && a.x === c.x)
      return Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) - Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) > 0;
    return false;
  };
  /** Läuft der Weg `w` irgendwo AUF einer anderen Leitung entlang? */
  const ueberlappt = (w: Punkt[], andere: Leitung[], ohne?: string): boolean => {
    for (const m of andere) {
      if (m.id === ohne) continue;
      for (let i = 0; i + 1 < w.length; i++)
        for (let k = 0; k + 1 < m.punkte.length; k++)
          if (streckenAufeinander(w[i]!, w[i + 1]!, m.punkte[k]!, m.punkte[k + 1]!)) return true;
    }
    return false;
  };
  /** Alle Paare von Strecken verschiedener Leitungen, die aufeinanderliegen —
      für die Messung (messungen.md) und die Prüfläufe. */
  const ueberlappungen = (plan: Plan): number => {
    let n = 0;
    plan.leitungen.forEach((l, i) => plan.leitungen.slice(i + 1).forEach(m => {
      for (let a = 0; a + 1 < l.punkte.length; a++)
        for (let b = 0; b + 1 < m.punkte.length; b++)
          if (streckenAufeinander(l.punkte[a]!, l.punkte[a + 1]!, m.punkte[b]!, m.punkte[b + 1]!)) n++;
    }));
    return n;
  };

  /**
   * EINE NEUE LEITUNG FÜHREN (E762).
   *
   * Bis hier zog die Fläche jede neue Leitung als `rechtwinklig` — den Winkel,
   * der zuerst in die längere Richtung läuft — und prüfte nichts. Von der
   * Klemme zur Schiene lief der zweite Schenkel darum AUF der Schiene, und
   * eine Leitung quer durch den Plan fasste unterwegs jede Klemme, über die
   * ihr Winkel lief: S2:4 nach E2:X2 berührte S3:4 und E2:X1 — zwei Netze
   * verbunden, die niemand verbunden hatte, und im Bild sah es aus wie
   * gewollt.
   *
   * Jetzt gilt derselbe Massstab wie beim Nachziehen (E746): ein Weg darf
   * nur berühren, was gemeint ist — die Klemmen an seinen Enden und die
   * Leitungen, auf denen ein Ende liegt (dort ist die Verbindung gewollt).
   * Probiert wird in fester Reihenfolge: die zwei Winkel, die Z-Wege, die
   * Hakenwege. Der erste, der nichts Fremdes berührt, auf keiner Leitung
   * entlangläuft und durch kein Zeichen geht, gilt; sonst der erste ohne
   * Fremdes; sonst der Winkel wie bisher. `schnell` lässt die Hakenwege aus
   * und nimmt nur die ersten vierzig Z-Wege — für die Vorschau beim Ziehen.
   */
  const leitungFuehren = (plan: Plan, a: Punkt, b: Punkt,
                          vonFang?: { teil: string; nr: string } | null,
                          nachFang?: { teil: string; nr: string } | null,
                          wie: { schnell?: boolean } = {}): Punkt[] => {
    const erster = ohneDoppel(rechtwinklig(a, b));
    if (gleicherPunkt(a, b)) return erster;
    const l: Leitung = { id: '\u0000neu', punkte: [], ebene: 'plan' };
    if (vonFang) { l.vonTeil = vonFang.teil; l.vonNr = vonFang.nr; }
    if (nachFang) { l.nachTeil = nachFang.teil; l.nachNr = nachFang.nr; }
    const klemmen = new Set<string>();
    if (vonFang) klemmen.add(vonFang.teil + ':' + endeGenau(plan, vonFang.teil, vonFang.nr, a).nr);
    if (nachFang) klemmen.add(nachFang.teil + ':' + endeGenau(plan, nachFang.teil, nachFang.nr, b).nr);
    const leitungen = new Set<string>();
    plan.leitungen.forEach(m => {
      for (let i = 0; i + 1 < m.punkte.length; i++)
        if (nahAnStrecke(a, m.punkte[i]!, m.punkte[i + 1]!) || nahAnStrecke(b, m.punkte[i]!, m.punkte[i + 1]!)) {
          leitungen.add(m.id); return;
        }
    });
    /* Eine Klemme, die mitten auf einer dieser Leitungen liegt, berührt der
       Weg über die Leitung ohnehin — sie ist kein fremder Griff. */
    const orte = klemmorte(plan);
    const ks = kaesten(plan);
    const erlaubt = { klemmen, leitungen };
    const breite = Number(plan.breite) || 1000, hoehe = Number(plan.hoehe) || 700;
    let ohneFremdes: Punkt[] | null = null;
    const probiert = new Set<string>();
    const pruefe = (w: Punkt[] | null): boolean => {
      if (!w || w.length < 2) return false;
      const sch = JSON.stringify(w);
      if (probiert.has(sch)) return false;
      probiert.add(sch);
      if (!pruefeBeruehrung(plan, l, w, orte, plan.leitungen, erlaubt)) return false;
      if (ueberlappt(w, plan.leitungen)) return false;
      if (!ohneFremdes) ohneFremdes = w;
      return !durchZeichen(w, ks);
    };
    for (const w of [erster, andererWinkel(a, b)]) if (pruefe(w)) return w!;
    const zw = zWege(a, b, breite, hoehe);
    for (const w of (wie.schnell ? zw.slice(0, 40) : zw)) if (pruefe(w)) return w;
    if (!wie.schnell) for (const w of hakenWege(a, b, breite, hoehe)) if (pruefe(w)) return w;
    return ohneFremdes || erster;
  };

  /** Doppelte Punkte und Punkte mitten auf einer Geraden heraus (die Enden bleiben). */
  const vereinfachen = (ps: Punkt[]): Punkt[] => {
    const q = ohneDoppel(ps);
    const raus: Punkt[] = [];
    q.forEach((p, i) => {
      if (i === 0 || i === q.length - 1) { raus.push(p); return; }
      const a = raus[raus.length - 1]!, b = q[i + 1]!;
      if ((a.x === p.x && p.x === b.x) || (a.y === p.y && p.y === b.y)) return;
      raus.push(p);
    });
    return raus;
  };

  /**
   * EINE STRECKE QUER SCHIEBEN (E762, „leiterschieben").
   *
   * Die Strecke `i` (von Punkt i zu i+1) wandert um `d` quer zu ihrer
   * Richtung: eine waagrechte nach oben oder unten, eine senkrechte nach
   * links oder rechts. Ist sie die erste oder letzte Strecke, bekommt das
   * Ende einen Stich, damit es auf seiner Klemme bleibt. Gibt die neuen
   * Punkte zurück — oder null, wenn der neue Weg etwas anderes berührte als
   * der alte (E746: eine Handlung, die nur die Lage ändert, verbindet nichts
   * Neues und trennt nichts).
   */
  const streckeSchieben = (plan: Plan, vorher: Vorher, lid: string, i: number, d: number): Punkt[] | null => {
    const l = plan.leitungen.find(x => x.id === lid);
    const alt = vorher.punkte.get(lid);
    if (!l || !alt || i < 0 || i + 1 >= alt.length) return null;
    const waag = alt[i]!.y === alt[i + 1]!.y;
    if (!waag && alt[i]!.x !== alt[i + 1]!.x) return null;
    const q = alt.map(p => ({ x: p.x, y: p.y }));
    let a = i, b = i + 1;
    if (a === 0) { q.unshift({ ...q[0]! }); a++; b++; }
    if (b === q.length - 1) q.push({ ...q[q.length - 1]! });
    if (waag) { q[a]!.y += d; q[b]!.y += d; } else { q[a]!.x += d; q[b]!.x += d; }
    const neu = vereinfachen(q);
    if (!d) return alt.map(p => ({ x: p.x, y: p.y }));
    const vor = vorher.beruehrt.get(lid) || { klemmen: [], leitungen: [] };
    const andere = plan.leitungen.filter(x => x.id !== lid);
    const k = pruefeBeruehrung(plan, l, neu, klemmorte(plan), andere,
      { klemmen: new Set(vor.klemmen), leitungen: new Set(vor.leitungen) });
    if (!k) return null;
    if (vor.klemmen.some(x => !k.klemmen.includes(x)) || vor.leitungen.some(x => !k.leitungen.includes(x))) return null;
    return neu;
  };

  /**
   * TEILE, LEITUNGEN UND TEXTE ALS GRUPPE UMFORMEN (E762, „alles umdrehen").
   *
   * Bis hier drehte „R" jedes gewählte Teil an seinem eigenen Ort, und
   * Leitungen und Texte drehten gar nicht. Jetzt wandert alles, was gewählt
   * ist, mit derselben Abbildung `T`: die Mitte jedes Teils (um die das
   * Register dreht, `gedreht`), jeder Punkt jeder Leitung, der Anker jedes
   * Texts (die Schrift selbst bleibt waagrecht — lesbar). Die Drehung eines
   * Teils folgt der Abbildung: gedreht +90°, gespiegelt (360 − d) mit
   * umgelegtem Spiegel, denn das Register spiegelt zuerst und dreht dann.
   *
   * Leitungen zu Teilen ausserhalb der Auswahl zieht dieselbe Stelle nach
   * wie beim Drehen eines Teils (`nachziehen`, E746); eine gewählte Leitung
   * zwischen zwei gewählten Teilen liegt danach genau auf ihren Klemmen und
   * bleibt, wie sie ist.
   */
  type Umformung = 'drehen' | 'spiegeln';
  const gruppeUmformen = (plan: Plan, ids: Set<string>, art: Umformung,
                          T?: (p: Punkt) => Punkt): { teile: string[]; bericht: Bericht; vorher: Vorher } => {
    const vorher = vorherMerken(plan);
    const F = (typeof Register !== 'undefined') ? Register.fachzeichen : null;
    const teile = plan.teile.filter(t => ids.has(t.id));
    const leitungen = plan.leitungen.filter(l => ids.has(l.id));
    const texte = plan.texte.filter(x => ids.has(x.id));
    let abb = T;
    if (!abb) {
      /* Die Mitte der Auswahl, auf dem Raster — so landet jeder Rasterpunkt
         wieder auf einem. */
      const xs: number[] = [], ys: number[] = [];
      teile.forEach(t => {
        const z = F ? F.holen(t.zeichen) : null;
        const m = F ? F.masse(t.zeichen, t.drehung) : { w: 0, h: 0 };
        const cx = t.x + (z ? z.w : 0) / 2, cy = t.y + (z ? z.h : 0) / 2;
        xs.push(cx - m.w / 2, cx + m.w / 2); ys.push(cy - m.h / 2, cy + m.h / 2);
      });
      leitungen.forEach(l => l.punkte.forEach(p => { xs.push(p.x); ys.push(p.y); }));
      texte.forEach(x => { xs.push(x.x); ys.push(x.y); });
      if (!xs.length) return { teile: [], bericht: [], vorher };
      const g = { x: rasten((Math.min(...xs) + Math.max(...xs)) / 2), y: rasten((Math.min(...ys) + Math.max(...ys)) / 2) };
      abb = art === 'drehen'
        ? (p: Punkt) => ({ x: g.x - (p.y - g.y), y: g.y + (p.x - g.x) })
        : (p: Punkt) => ({ x: 2 * g.x - p.x, y: p.y });
    }
    teile.forEach(t => {
      const z = F ? F.holen(t.zeichen) : null;
      const w = z ? z.w : 0, h = z ? z.h : 0;
      const c = abb!({ x: t.x + w / 2, y: t.y + h / 2 });
      const d = ((Number(t.drehung) || 0) % 360 + 360) % 360;
      if (art === 'drehen') t.drehung = (d + 90) % 360;
      else { t.drehung = (360 - d) % 360; t.gespiegelt = !t.gespiegelt; }
      t.x = rasten(c.x - w / 2); t.y = rasten(c.y - h / 2);
    });
    leitungen.forEach(l => { l.punkte = l.punkte.map(p => { const q = abb!(p); return { x: rasten(q.x), y: rasten(q.y) }; }); });
    texte.forEach(x => { const q = abb!(x); x.x = rasten(q.x); x.y = rasten(q.y); });
    const ids2 = teile.map(t => t.id);
    const bericht = ids2.length ? nachziehen(plan, vorher, ids2, { heilen: true }) : [];
    return { teile: ids2, bericht, vorher };
  };

  /** Den ganzen Plan um 90° drehen: Breite und Höhe tauschen, alles mit. */
  const planDrehen = (plan: Plan): { bericht: Bericht; vorher: Vorher } => {
    const H = Number(plan.hoehe) || 700, W = Number(plan.breite) || 800;
    const alle = new Set<string>([...plan.teile.map(t => t.id), ...plan.leitungen.map(l => l.id), ...plan.texte.map(x => x.id)]);
    const r = gruppeUmformen(plan, alle, 'drehen', p => ({ x: H - p.y, y: p.x }));
    plan.breite = H; plan.hoehe = W;
    return { bericht: r.bericht, vorher: r.vorher };
  };

  /* ------------------------------------------------------------------------
   * VERBINDUNGSPUNKTE UND KREUZUNGEN (Punkte 15, 16)
   * ------------------------------------------------------------------------
   * Der Unterschied ist der wichtigste im ganzen Plan: mit Punkt sind die
   * Leitungen verbunden, ohne kreuzen sie sich nur. Wer ihn nicht sieht,
   * liest die Schaltung falsch.
   *
   * Ein Punkt wird gezeichnet, wo ein Leitungsende oder ein Knick auf einer
   * ANDEREN Leitung liegt — dort ist die Verbindung gewollt. Wo sich zwei
   * Strecken bloss überschneiden, ohne dass eine dort endet oder knickt,
   * entsteht KEIN Punkt: das ist eine Kreuzung, und sie bekommt stattdessen
   * eine Lücke in der waagrechten Leitung.
   * ----------------------------------------------------------------------*/
  const aufStrecke = (p: Punkt, a: Punkt, b: Punkt): boolean => {
    if (a.x === b.x) return p.x === a.x && p.y > Math.min(a.y, b.y) && p.y < Math.max(a.y, b.y);
    if (a.y === b.y) return p.y === a.y && p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x);
    return false;
  };

  const verbindungspunkte = (plan: Plan): Punkt[] => {
    const raus: Punkt[] = [];
    const schon = new Set<string>();
    const merke = (p: Punkt) => {
      const k = p.x + ':' + p.y;
      if (!schon.has(k)) { schon.add(k); raus.push(p); }
    };
    plan.leitungen.forEach(l => {
      l.punkte.forEach((p, i) => {
        /* Nur Enden und Knicke zählen — ein Punkt mitten in der eigenen
           geraden Strecke ist kein Anschluss, sondern ein Zwischenpunkt. */
        const istEnde = i === 0 || i === l.punkte.length - 1;
        const istKnick = !istEnde;
        if (!istEnde && !istKnick) return;
        plan.leitungen.forEach(andere => {
          if (andere.id === l.id) return;
          for (let k = 0; k + 1 < andere.punkte.length; k++) {
            if (aufStrecke(p, andere.punkte[k]!, andere.punkte[k + 1]!)) { merke(p); return; }
          }
        });
      });
    });
    /* Und wo drei oder mehr Leitungen denselben Endpunkt teilen. */
    const zaehler = new Map<string, number>();
    plan.leitungen.forEach(l => [l.punkte[0], l.punkte[l.punkte.length - 1]].forEach(p => {
      if (!p) return;
      const k = p.x + ':' + p.y;
      zaehler.set(k, (zaehler.get(k) || 0) + 1);
    }));
    zaehler.forEach((n, k) => {
      if (n < 3) return;
      const [x, y] = k.split(':').map(Number);
      merke({ x: x!, y: y! });
    });
    return raus;
  };

  /**
   * Wo kreuzen sich zwei Leitungen, OHNE verbunden zu sein (Punkt 16)?
   *
   * Genau dort, wo eine waagrechte und eine senkrechte Strecke sich schneiden
   * und an dieser Stelle kein Verbindungspunkt liegt. Gezeichnet wird die
   * Lücke in der waagrechten — so herum ist es üblich, und wichtiger: immer
   * gleich, damit ein Plan nicht mal so und mal so aussieht.
   */
  const kreuzungen = (plan: Plan): Punkt[] => {
    const punkte = new Set(verbindungspunkte(plan).map(p => p.x + ':' + p.y));
    const raus: Punkt[] = [];
    const strecken: Array<{ a: Punkt; b: Punkt; id: string }> = [];
    plan.leitungen.forEach(l => {
      for (let i = 0; i + 1 < l.punkte.length; i++)
        strecken.push({ a: l.punkte[i]!, b: l.punkte[i + 1]!, id: l.id });
    });
    strecken.forEach(s1 => {
      if (s1.a.y !== s1.b.y) return;                 /* nur waagrechte */
      strecken.forEach(s2 => {
        if (s2.id === s1.id || s2.a.x !== s2.b.x) return;  /* nur senkrechte */
        const x = s2.a.x, y = s1.a.y;
        const imX = x > Math.min(s1.a.x, s1.b.x) && x < Math.max(s1.a.x, s1.b.x);
        const imY = y > Math.min(s2.a.y, s2.b.y) && y < Math.max(s2.a.y, s2.b.y);
        if (imX && imY && !punkte.has(x + ':' + y)) raus.push({ x, y });
      });
    });
    return raus;
  };

  /* ------------------------------------------------------------------------
   * DAS BILD
   * ----------------------------------------------------------------------*/

  /** Die Leitung als Pfad — mit Lücken an jeder Kreuzung ohne Verbindung. */
  const leitungPfad = (l: Leitung, luecken: Punkt[]): string => {
    const teile: string[] = [];
    for (let i = 0; i + 1 < l.punkte.length; i++) {
      const a = l.punkte[i]!, b = l.punkte[i + 1]!;
      if (a.y !== b.y) { teile.push(`M${a.x},${a.y} L${b.x},${b.y}`); continue; }
      /* Waagrechte Strecke: die Lücken der Reihe nach aussparen. */
      const drin = luecken.filter(p => p.y === a.y &&
        p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x))
        .map(p => p.x).sort((x, y) => (a.x < b.x ? x - y : y - x));
      let von = a.x;
      const schritt = a.x < b.x ? 1 : -1;
      drin.forEach(x => {
        teile.push(`M${von},${a.y} L${x - 5 * schritt},${a.y}`);
        von = x + 5 * schritt;
      });
      teile.push(`M${von},${a.y} L${b.x},${b.y}`);
    }
    return teile.join(' ');
  };

  /** Der ganze Plan als SVG. Reine Darstellung — keine Ereignisse. */
  /**
   * Was die Simulation zum Zeichnen beisteuert. Die Zahlen kommen aus
   * `Stromfluss.rechne` — hier wird nur gemalt, nicht gerechnet. Wer beides
   * in einer Datei hat, ändert irgendwann die Formel, um das Bild zu
   * retten, und dann stimmt das Bild und die Rechnung nicht mehr.
   */
  type Strombild = {
    netzStrom: number[];
    leitungNetz: Record<string, number>;
    werte: Record<string, { U: number; I: number; P: number;
                            fliesst: boolean; helligkeit?: number;
                            richtung?: 'vor' | 'rueck' | 'keine' | 'wechselnd';
                            richtungstext?: string;
                            vonKlemme?: string; nachKlemme?: string }>;
    /** Die einzelnen Glieder mehrteiliger Bauteile. Ohne sie steht an einem
        Klemmenbrett keine Zahl: `werte` hält dort den Eintrag mit dem
        grössten STROM, und das ist oft eine Brücke mit ihrem Milliohm. */
    teilwerte?: Record<string, Record<string, { U: number; I: number; P: number;
                                                fliesst: boolean }>>;
    maxStrom: number;
  };

  const alsSvg = (plan: Plan, opt: {
    raster?: boolean; anschluesse?: boolean; bmk?: boolean; nummern?: boolean;
    auswahl?: Set<string>; nurEbenen?: string[];
    /** Ist gesetzt, wenn die Simulation läuft. */
    strom?: Strombild;
    /** Messwerte als Text an die Bauteile schreiben. */
    messwerte?: boolean;
    /**
     * Ein Bauteil hervorheben (Punkt 80) — das, nach dem gefragt ist.
     *
     * In einer Aufgabe steht „gesucht: der Strom durch R2", und dann muss
     * man R2 im Plan auch FINDEN. Ohne Hervorhebung sucht man in einer
     * Zeichnung mit acht Bauteilen erst einmal, und die Aufgabe fängt mit
     * einer Suchübung an, die niemand gestellt hat.
     */
    hervor?: string;
    /**
     * Je Leitung einen breiten, durchsichtigen Fangpfad mitzeichnen
     * (Punkt 59). Nur für Aufgaben, bei denen man Leitungen antippt — im
     * Editor würde er das Ziehen stören.
     */
    tippbar?: boolean;
  } = {}): string => {
    const sichtbar = (ebene: string): boolean => {
      if (opt.nurEbenen) return opt.nurEbenen.includes(ebene);
      const e = plan.ebenen.find(x => x.id === ebene);
      return !e || e.sichtbar;
    };
    const farbeVon = (ebene: string): string =>
      (plan.ebenen.find(x => x.id === ebene) || { farbe: 'var(--text)' }).farbe;

    const teile: string[] = [];

    /* Raster (Punkt 21) — als Muster, damit auch ein grosser Plan schnell
       zeichnet. Ein Punkt je Rasterzelle statt tausend einzelner Kreise. */
    if (opt.raster !== false) {
      teile.push(
        `<defs><pattern id="sp-raster" width="${R()}" height="${R()}" patternUnits="userSpaceOnUse">` +
        `<circle cx="0.5" cy="0.5" r="0.7" fill="currentColor" opacity=".22"/></pattern></defs>` +
        `<rect width="${plan.breite}" height="${plan.hoehe}" fill="url(#sp-raster)"/>`);
    }

    /* Der Lichtschein einer leuchtenden Lampe. Einmal erklärt, überall
       benutzt — hundert einzelne Verläufe wären hundertmal dieselbe
       Rechenarbeit für den Browser. */
    if (opt.strom) teile.push(
      `<defs><radialGradient id="sp-schein">` +
      `<stop offset="0%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity=".85"/>` +
      `<stop offset="60%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity=".25"/>` +
      `<stop offset="100%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity="0"/>` +
      `</radialGradient></defs>`);

    const luecken = kreuzungen(plan);

    /* Wie schnell die Striche laufen sollen. Der Strom spannt viele
       Grössenordnungen — von der Meldeleuchte mit 10 mA bis zum Motor mit
       10 A —, deshalb geht die Geschwindigkeit über den Logarithmus. Linear
       stünde die Meldeleuchte still, während der Motor flimmert. */
    const tempo = (strom: number, max: number): number => {
      if (!(strom > 0) || !(max > 0)) return 0;
      const anteil = Math.log10(1 + strom * 1000) / Math.log10(1 + max * 1000);
      return 1.6 - 1.25 * Math.max(0, Math.min(1, anteil));   /* Sekunden je Runde */
    };

    /* Leitungen zuerst — Symbole liegen darüber und decken die Enden sauber ab. */
    plan.leitungen.forEach(l => {
      if (!sichtbar(l.ebene)) return;
      const d = leitungPfad(l, luecken);
      if (!d) return;
      const gewaehlt = opt.auswahl && opt.auswahl.has(l.id);
      /* Eine selbst gezeichnete Schiene (E762) ist kräftiger — wie die
         Sammelschiene im Lehrmittel. Was sie ist, sagt ihre Beschriftung,
         nicht die Breite (§38). Pläne ohne Schiene zeichnen wie bisher. */
      teile.push(`<path class="sp-leitung${l.schiene ? ' sp-schiene' : ''}${gewaehlt ? ' sp-gewaehlt' : ''}" data-id="${esc(l.id)}" ` +
        `d="${d}" fill="none" stroke="${farbeVon(l.ebene)}" stroke-width="${l.schiene ? 3.5 : 2}" ` +
        `stroke-linecap="round"/>`);

      /* Und darüber, wenn die Simulation läuft, der fliessende Strich.
         Er ersetzt die Leitung nicht, sondern legt sich darauf: bleibt die
         Bewegung aus (Systemeinstellung „weniger Bewegung"), ist die Leitung
         immer noch als stromführend zu erkennen — an der Strichelung, nicht
         nur an der Farbe. §38 verlangt genau das. */
      if (!opt.strom) return;
      const netz = opt.strom.leitungNetz[l.id];
      if (typeof netz !== 'number') return;
      const i = opt.strom.netzStrom[netz] || 0;
      if (!(i > 1e-9)) return;
      const s = tempo(i, opt.strom.maxStrom);
      teile.push(`<path class="sp-fluss" data-id="${esc(l.id)}" d="${d}" fill="none" ` +
        `stroke-width="3" stroke-linecap="butt" ` +
        `style="animation-duration:${s.toFixed(2)}s"><title>${zeigeZahl(i, 'A')}</title></path>`);
    });

    /* Verbindungspunkte (Punkt 15) */
    verbindungspunkte(plan).forEach(p => teile.push(
      `<circle class="sp-knoten" cx="${p.x}" cy="${p.y}" r="4" fill="currentColor"/>`));

    /* Griffe zum Antippen (Punkt 59) — je Leitung EIN Punkt auf ihrer Mitte,
       nicht ein breiter Strich über ihrer ganzen Länge.
       ------------------------------------------------------------------
       Der Strich war der erste Versuch, und er kann nicht funktionieren:
       zwei Leitungsbahnen liegen 16 Einheiten auseinander, am Bildschirm
       sind das gemessene 7 px. Ein Fangstrich, der §37 mit seinen 44 px
       genügt, würde sechs Nachbarn mitfangen — und dann tippt man auf eine
       Leitung und markiert eine andere. Das ist schlimmer als ein zu
       kleines Ziel, denn es sieht nicht nach einem Fehler aus.
       Die Punkte stehen dagegen weit auseinander, sie sind SICHTBAR (man
       weiss also, wohin zu tippen ist), und ihre Grösse hängt über
       `vector-effect` nicht am Massstab des Plans. */
    if (opt.tippbar) {
      const gesetzt: Array<{ x: number; y: number }> = [];
      plan.leitungen.forEach(l => {
        if (!sichtbar(l.ebene)) return;
        const pkte = l.punkte || [];
        if (pkte.length < 2) return;
        /* Die LÄNGSTE Teilstrecke — nicht der Mittelpunkt der Punktliste.
           Bei einer Leitung, die kurz absteigt und dann weit quer läuft,
           sässe der Griff sonst in der Ecke. */
        let best = 0, laenge = -1;
        for (let i = 0; i + 1 < pkte.length; i++) {
          const a = pkte[i]!, b = pkte[i + 1]!;
          const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d2 > laenge) { laenge = d2; best = i; }
        }
        const a = pkte[best]!, b = pkte[best + 1]!;

        /* Und jetzt eine Stelle AUF dieser Strecke suchen, die weit genug
           von allen bisherigen Griffen weg ist. Zuerst sass jeder auf der
           Mitte, und nachgemessen lagen dann drei Griffe auf 7 px beisammen
           — man tippt auf den einen und trifft den anderen. Das ist
           schlimmer als ein zu kleines Ziel, weil es nicht nach einem Fehler
           aussieht.
           Probiert werden elf Stellen von einem Ende zum anderen, und
           genommen wird die mit dem grössten Abstand zum nächsten Nachbarn. */
        let wahlX = (a.x + b.x) / 2, wahlY = (a.y + b.y) / 2, weiteste = -1;
        for (let k = 0; k <= 10; k++) {
          const t = 0.12 + k * 0.076;      /* 0,12 bis 0,88 — nie ganz am Ende */
          const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
          let naechster = Infinity;
          gesetzt.forEach(g => {
            const d = Math.hypot(g.x - x, g.y - y);
            if (d < naechster) naechster = d;
          });
          if (naechster > weiteste) { weiteste = naechster; wahlX = x; wahlY = y; }
        }
        gesetzt.push({ x: wahlX, y: wahlY });
        const gewaehlt = opt.auswahl && opt.auswahl.has(l.id);
        teile.push(`<circle class="sp-griff${gewaehlt ? ' sp-gewaehlt' : ''}" ` +
          `data-id="${esc(l.id)}" cx="${Math.round(wahlX)}" cy="${Math.round(wahlY)}" ` +
          `r="9"><title>Leitung antippen</title></circle>`);
      });
    }

    /* Symbole */
    plan.teile.forEach(t => {
      if (!sichtbar(t.ebene)) return;
      const farbe = farbeVon(t.ebene);
      const svg = (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen.alsSvg(t.zeichen, {
            farbe, drehung: t.drehung, gespiegelt: t.gespiegelt })
        : '';
      if (!svg) return;
      const innen = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      const gewaehlt = opt.auswahl && opt.auswahl.has(t.id);
      const mass = Register.fachzeichen.masse(t.zeichen, 0);

      /* Was die Simulation über dieses Bauteil weiss. */
      const w = opt.strom ? opt.strom.werte[t.id] : undefined;
      const vh = (typeof Stromfluss !== 'undefined' && Stromfluss.verhalten)
        ? Stromfluss.verhalten(t.zeichen) : null;

      /* Leuchtet es? Der Schein sitzt UNTER dem Symbol, damit die Linien
         darüber lesbar bleiben. Die Stärke folgt der Leistung, nicht dem
         Strom — eine Lampe an halber Spannung ist ein Viertel so hell, und
         genau das soll man an der Reihenschaltung sehen können. */
      let schein = '';
      if (w && typeof w.helligkeit === 'number' && w.helligkeit > 0.01) {
        const h = Math.min(1, w.helligkeit);
        schein = `<circle class="sp-leuchtet" cx="${mass.w / 2}" cy="${mass.h / 2}" ` +
          `r="${Math.max(mass.w, mass.h) * 0.75}" fill="url(#sp-schein)" ` +
          `stroke="none" opacity="${(0.25 + 0.65 * h).toFixed(2)}"/>`;
      }

      /* Messwerte anschreiben. Beim Messgerät steht der Wert, den es misst;
         bei allem anderen Spannung und Strom, weil das die zwei Zahlen sind,
         nach denen in jeder Aufgabe gefragt wird. */
      let anzeige = '';
      if (w && opt.messwerte !== false && opt.strom) {
        const art = vh ? vh.art : '';
        /* MEHRTEILIGE BAUTEILE BRAUCHEN EINEN ANDEREN GRIFF.
           -----------------------------------------------------------------
           An einem Klemmenbrett, einer Drehstromquelle und einem Übertrager
           stand bisher GAR KEINE Zahl — die Liste unten kannte ihre Art
           nicht. Das war der Fehler, und er fiel auf einem Bild auf.

           WELCHES GLIED ABER? `werte` hält je Bauteil den Eintrag mit dem
           grössten STROM, und am Klemmenbrett in Stern ist das nachgemessen:

               U1–U2   230 V    3.833312 A   881.642 W
               V1–V2   230 V    3.833312 A   881.657 W
               W1–W2   230 V    3.833312 A   881.642 W
               U2–V2   0.0038 V 3.833312 A     0.015 W   (Brücke)
               V2–W2   0.0038 V 3.833312 A     0.015 W   (Brücke)

           Alle fünf führen DENSELBEN Strom — der Unterschied steht in der
           siebten Stelle. Welches Glied „den grössten Strom" hat, entscheidet
           damit das Rundungsrauschen, und beim nächsten Plan kann es die
           Brücke sein. Die zeigt dann 0,004 V und behauptet, am Motor liege
           nichts an.

           Nach der LEISTUNG liegen dieselben fünf fünf Grössenordnungen
           auseinander: 881 W gegen 0,015 W. Das ist kein knapperes Rennen,
           sondern gar keines. Deshalb wird danach ausgewählt — nicht weil
           der Strom die falsche Zahl wäre, sondern weil er hier nicht
           unterscheidet.

           Dazu die Summe über alle Glieder, denn nach der Gesamtleistung des
           Motors wird in jeder Aufgabe gefragt.

           BEIM ÜBERTRAGER WIRD NICHT SUMMIERT. Dort sind die beiden Seiten
           nicht zwei Verbraucher, sondern derselbe Leistungsfluss einmal
           hinein und einmal hinaus. Summiert stand am Klingeltrafo „12 W",
           während die Klingel daneben 6 W zeigte — auch das vom Bild. */
        const glieder = opt.strom.teilwerte?.[t.id];
        let stark = w;
        let summeP = 0;
        if (glieder) {
          Object.keys(glieder).forEach(k => {
            const g = glieder[k]!;
            summeP += g.P;
            if (g.P > stark.P) stark = g as typeof w;
          });
        }
        /* Der Übertrager zeigt die durchgehende Leistung, nicht die Summe
           seiner zwei Seiten. */
        if (art === 'uebertrager') summeP = Math.max(w.P, stark.P);
        const zeilen = art === 'volt' ? [zeigeZahl(Math.abs(w.U), 'V')]
          : art === 'ampere' ? [zeigeZahl(Math.abs(w.I), 'A')]
          : art === 'quelle' ? [zeigeZahl(Math.abs(w.U), 'V'), zeigeZahl(Math.abs(w.I), 'A')]
          : (art === 'widerstand' || art === 'spule')
            ? [zeigeZahl(Math.abs(w.U), 'V'), zeigeZahl(Math.abs(w.I), 'A'),
               zeigeZahl(w.P, 'W')]
          : (art === 'mehrteilig' || art === 'uebertrager')
            ? [zeigeZahl(Math.abs(stark.U), 'V'), zeigeZahl(Math.abs(stark.I), 'A'),
               zeigeZahl(summeP, 'W')]
          : [];
        anzeige = zeilen.map((s, i) =>
          `<text class="sp-messwert" x="${mass.w / 2}" y="${mass.h + 14 + i * 12}" ` +
          `text-anchor="middle" font-size="10" stroke="none">${esc(s)}</text>`).join('');
      }

      /* Die Stromrichtung (Punkt 31).
         -----------------------------------------------------------------
         Der Pfeil sitzt am BAUTEIL und nicht an der Leitung, und das ist
         keine Bequemlichkeit: gerechnet wird der Strom durch einen ZWEIG.
         Ein Netz kann aus fünf Leitungen bestehen, durch die ganz
         verschieden viel fliesst; ein Pfeil auf einer davon wäre geraten.
         Am Bauteil ist er gemessen.

         GLEICHSTROM BEKOMMT EINEN PFEIL, WECHSELSTROM ZWEI. Das ist der
         ganze Unterschied, und er steckt in der FORM, nicht in der Farbe —
         §38 [hart]. Ein einzelner Pfeil an 230 V wäre eine Behauptung, die
         nicht stimmt: dort kehrt der Strom hundertmal je Sekunde um (50 volle
         Perioden, zwei Nulldurchgänge je Periode). Der
         Doppelpfeil sagt genau das, und der Text darunter sagt es in
         Worten, für den, der ihn antippt.

         Der Pfeil steht NEBEN dem Bauteil. Wie weit, rechnet sich aus der
         GRÖSSE des Symbols und steht nicht fest: mit festen 14 Einheiten lag
         er beim ersten Bild mitten in der Lampe, weil deren Kreis 60 breit
         ist. Gefunden auf dem Bild, nicht im Prüflauf — ein Pfeil war ja da.
         Und er weicht nach der Seite aus, auf der die Messwerte NICHT
         stehen; die hängen unter dem Symbol. */
      let pfeil = '';
      if (w && w.fliesst && w.richtung && w.richtung !== 'keine'
          && w.vonKlemme && w.nachKlemme) {
        const kl = anschluesseVon(t);
        const va = kl.find(k => k.nr === w.vonKlemme);
        const nb = kl.find(k => k.nr === w.nachKlemme);
        if (va && nb) {
          const ax = va.x - t.x, ay = va.y - t.y;
          const bx = nb.x - t.x, by = nb.y - t.y;
          const rueck = w.richtung === 'rueck';
          const dx = rueck ? ax - bx : bx - ax;
          const dy = rueck ? ay - by : by - ay;
          const laenge = Math.hypot(dx, dy);
          /* Liegen beide Klemmen aufeinander, gibt es keine Achse und damit
             keine Richtung zu zeigen. Lieber nichts als einen Pfeil, der
             irgendwohin zeigt. */
          if (laenge > 1) {
            const ux = dx / laenge, uy = dy / laenge;
            /* So weit hinaus, dass das Symbol frei bleibt — quer zur
               Stromachse gemessen, plus ein Finger Luft. */
            const weg = Math.abs(uy) * mass.w / 2 + Math.abs(ux) * mass.h / 2 + 12;
            const mx = (ax + bx) / 2 + uy * weg;
            const my = (ay + by) / 2 - ux * weg;
            const grad = Math.atan2(dy, dx) * 180 / Math.PI;
            /* Ein Pfeil bei Gleichstrom, zwei bei Wechselstrom. Die zwei
               stehen mit Abstand auseinander und nicht Kopf an Kopf: als
               Doppelspitze an einem Strich sahen sie am Bildschirm aus wie
               ein dicker Pfeil, und damit wäre der Unterschied wieder weg. */
            const d = w.richtung === 'wechselnd'
              ? 'M-13,0 H13 M13,0 L6,-5 M13,0 L6,5 M-13,0 L-6,-5 M-13,0 L-6,5'
              : 'M-12,0 H7 M7,0 L0,-5 M7,0 L0,5';
            pfeil = `<g class="sp-richtung" transform="translate(${mx.toFixed(1)} ` +
              `${my.toFixed(1)}) rotate(${grad.toFixed(1)})">` +
              `<path d="${d}" fill="none"/>` +
              (w.richtungstext ? `<title>${esc(w.richtungstext)}</title>` : '') +
              `</g>`;
          }
        }
      }

      teile.push(
        `<g class="sp-teil${gewaehlt ? ' sp-gewaehlt' : ''}` +
        `${w && w.fliesst ? ' sp-fuehrt' : ''}` +
        `${opt.hervor === t.id ? ' sp-gesucht' : ''}" data-id="${esc(t.id)}" ` +
        `transform="translate(${t.x} ${t.y})" fill="none" stroke="${farbe}" ` +
        `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        /* Eine unsichtbare Fläche, damit auch die Lücken im Symbol greifbar
           sind — ein Kontakt besteht fast nur aus Linien, und Linien trifft
           man mit dem Finger nicht. */
        `<rect x="-4" y="-4" width="${mass.w + 8}" height="${mass.h + 8}" ` +
        `fill="transparent" stroke="none"/>` + schein + innen + anzeige + pfeil +
        (opt.anschluesse ? anschluesseVon(t).map(a =>
          `<circle class="sp-punkt" data-teil="${esc(t.id)}" data-nr="${esc(a.nr)}" ` +
          `cx="${a.x - t.x}" cy="${a.y - t.y}" r="4" fill="${farbe}" stroke="none" opacity=".5"/>`).join('') : '') +
        (opt.nummern ? anschluesseVon(t).map(a =>
          `<text x="${a.x - t.x + 6}" y="${a.y - t.y - 4}" font-size="9" fill="${farbe}" ` +
          `stroke="none" opacity=".8">${esc(a.anzeige)}</text>`).join('') : '') +
        (opt.bmk !== false && t.bmk
          ? `<text x="${mass.w + 6}" y="12" font-size="12" fill="${farbe}" stroke="none" ` +
            `font-weight="600">${esc(t.bmk)}</text>` : '') +
        /* E767: die Beschriftung unter dem BMK, gekürzt; der volle Text im Titel. */
        (t.beschriftung
          ? `<text class="sp-teil-beschriftung" x="${mass.w + 6}" y="27" font-size="11" ` +
            `fill="${farbe}" stroke="none" opacity=".84">${esc(t.beschriftung.length > 38 ? t.beschriftung.slice(0, 37) + '…' : t.beschriftung)}` +
            `<title>${esc(t.beschriftung)}</title></text>` : '') +
        `</g>`);
    });

    /* Freie Beschriftungen (Punkt 47) */
    plan.texte.forEach(x => {
      if (!sichtbar(x.ebene)) return;
      /* Ein gewählter Text trägt die Auswahl wie Teil und Leitung (E762:
         der Rahmen fasst jetzt auch Texte, und was gewählt ist, muss man
         sehen). Ungewählt zeichnet er wie bisher. */
      const gewaehlt = !!(opt.auswahl && opt.auswahl.has(x.id));
      teile.push(`<text class="sp-text${gewaehlt ? ' sp-gewaehlt' : ''}" data-id="${esc(x.id)}" x="${x.x}" y="${x.y}" ` +
        `font-size="13" fill="${farbeVon(x.ebene)}" stroke="none">${tief(x.t)}</text>`);
    });

    return `<svg class="sp-flaeche" viewBox="0 0 ${plan.breite} ${plan.hoehe}" ` +
      `width="${plan.breite}" height="${plan.hoehe}">` + teile.join('') + '</svg>';
  };

  /* ------------------------------------------------------------------------
   * DIE STROMSCHIENEN
   * ------------------------------------------------------------------------
   * Ein Stromlaufplan beginnt immer gleich: oben L, unten N. Wer das jedes
   * Mal von Hand zieht, verliert Zeit an etwas, das nie anders ist.
   * ----------------------------------------------------------------------*/
  const schienenBauen = (plan: Plan): void => {
    const a = artVon(plan.art);
    if (!a.schienen || a.schienen === 'keine') return;
    const rand = 40;
    const mach = (y: number, beschriftung: string) => {
      plan.leitungen.push({
        id: uid(), ebene: 'plan',
        punkte: [{ x: rand, y }, { x: plan.breite - rand, y }]
      });
      plan.texte.push({ id: uid(), x: rand - 26, y: y + 4, t: beschriftung, ebene: 'plan' });
    };
    if (a.schienen === 'steuer') {
      mach(40, 'L1'); mach(plan.hoehe - 40, 'N');
    } else {
      mach(40, 'L1'); mach(60, 'L2'); mach(80, 'L3'); mach(plan.hoehe - 40, 'PE');
    }
  };

  /* --- Das Netz und die Beispielschaltungen (E262) --------------------------
   * Redur: „füge dort alle Leitungen wie L1 und N ein, damit ich direkt
   * testen kann — oder für eine Türklingel; es sollte direkt dort sein,
   * also im Code."
   *
   * `schienenBauen` (oben) zeichnet nur Striche — zum ZEICHNEN. Hier
   * entsteht das NETZ ZUM RECHNEN: dieselben Schienen, aber an eine echte
   * Quelle gebunden, damit die Simulation sofort etwas zu rechnen hat.
   * Ein Zweig, dessen Leitung auf einer Schiene ENDET, ist verbunden — die
   * Simulation zapft Sammelschienen ausdrücklich an (simulation.ts,
   * netzInfo). Und darauf bauen die Beispielschaltungen aus dem Lehrmittel:
   * fertig verdrahtet, ein Klick, Strom drücken, schalten.
   * ------------------------------------------------------------------------*/

  /** L1 oben, N unten, links die Quelle dazwischen. Gibt die Geometrie
   *  zurück, damit ein Beispiel seine Zweige daran hängen kann. */
  const netzBauen = (plan: Plan, ebene = 'plan', volt?: number):
      { oben: number; unten: number; quelle: any } => {
    const oben = rasten(40);
    const unten = rasten(plan.hoehe - 40);
    const gy = rasten((oben + unten) / 2 - 30);
    const rechts = rasten(plan.breite - 20);
    const quelle: any = {
      id: uid(), zeichen: 'wechselspannung', x: 20, y: gy,
      drehung: 0, gespiegelt: false,
      bmk: naechstesBmk(plan, 'wechselspannung'),
      nummern: {}, gruppe: '', ebene
    };
    if (typeof volt === 'number') quelle.werte = { U: volt };
    plan.teile.push(quelle);
    const kx = quelle.x + 30;
    plan.leitungen.push(
      { id: uid(), ebene, vonTeil: quelle.id, vonNr: 'L',
        punkte: [{ x: kx, y: gy }, { x: kx, y: oben }, { x: rechts, y: oben }] },
      { id: uid(), ebene, vonTeil: quelle.id, vonNr: 'N',
        punkte: [{ x: kx, y: gy + 60 }, { x: kx, y: unten }, { x: rechts, y: unten }] });
    plan.texte.push(
      { id: uid(), x: kx + 14, y: oben - 8, t: 'L1', ebene },
      { id: uid(), x: kx + 14, y: unten - 8, t: 'N', ebene });
    return { oben, unten, quelle };
  };

  /** Die eingebauten Beispiele. Namen erscheinen im Menü, der Hinweis im
   *  Toast nach dem Einfügen — er sagt, WOMIT man jetzt spielen kann. */
  const BEISPIELE: Array<{ id: string; name: string; hinweis: string }> = [
    { id: 'ausschaltung', name: 'Ausschaltung — eine Lampe, ein Schalter',
      hinweis: 'Strom drücken, dann auf S1 tippen: E1 leuchtet.' },
    { id: 'wechselschaltung', name: 'Wechselschaltung — Treppenhaus',
      hinweis: 'Strom drücken — JEDER der beiden Schalter schaltet die Lampe.' },
    { id: 'tuerklingel', name: 'Türklingel — Taster und Klingel (12 V)',
      hinweis: 'Strom drücken, S1 gedrückt halten: die Klingel bekommt 12 V.' }
  ];

  const beispielBauen = (plan: Plan, id: string, ebene = 'plan'): boolean => {
    const teil = (zeichen: string, x: number, y: number, drehung = 0): any => {
      const t: any = { id: uid(), zeichen, x: rasten(x), y: rasten(y), drehung,
        gespiegelt: false, bmk: naechstesBmk(plan, zeichen),
        nummern: {}, gruppe: '', ebene };
      plan.teile.push(t); return t;
    };
    const draht = (punkte: Array<{ x: number; y: number }>,
                   von?: any, vonNr?: string, nach?: any, nachNr?: string): void => {
      const l: any = { id: uid(), ebene, punkte: punkte.map(p => ({ x: rasten(p.x), y: rasten(p.y) })) };
      if (von) { l.vonTeil = von.id; l.vonNr = vonNr; }
      if (nach) { l.nachTeil = nach.id; l.nachNr = nachNr; }
      plan.leitungen.push(l);
    };

    if (id === 'ausschaltung') {
      const n = netzBauen(plan, ebene);
      const s = teil('ch-schema0', 380, 140);   /* 3 oben (400,140), 4 unten (400,200) */
      const h = teil('lampe', 370, 320);        /* X1 (400,320), X2 (400,380) */
      draht([{ x: 400, y: n.oben }, { x: 400, y: 140 }], undefined, undefined, s, '3');
      draht([{ x: 400, y: 200 }, { x: 400, y: 320 }], s, '4', h, 'X1');
      draht([{ x: 400, y: 380 }, { x: 400, y: n.unten }], h, 'X2');
      return true;
    }
    if (id === 'wechselschaltung') {
      const n = netzBauen(plan, ebene);
      /* S1 steht auf dem Kopf (180°): sein 3 zeigt zur L1-Schiene, seine
         korrespondierenden 1/2 nach unten zu S2. So laufen beide
         Korrespondierenden als gerade Strecken — keine Leitung kreuzt
         einen Anschluss (die test239-Lehre). */
      const s1 = teil('ch-schema3', 350, 120, 180); /* 3 (380,120) · 1 (400,180) · 2 (360,180) */
      const s2 = teil('ch-schema3', 350, 300);      /* 1 (360,300) · 2 (400,300) · 3 (380,360) */
      const h = teil('lampe', 350, 440);            /* X1 (380,440), X2 (380,500) */
      draht([{ x: 380, y: n.oben }, { x: 380, y: 120 }], undefined, undefined, s1, '3');
      draht([{ x: 400, y: 180 }, { x: 400, y: 300 }], s1, '1', s2, '2');
      draht([{ x: 360, y: 180 }, { x: 360, y: 300 }], s1, '2', s2, '1');
      draht([{ x: 380, y: 360 }, { x: 380, y: 440 }], s2, '3', h, 'X1');
      draht([{ x: 380, y: 500 }, { x: 380, y: n.unten }], h, 'X2');
      return true;
    }
    if (id === 'tuerklingel') {
      /* 12 V wie am Klingeltrafo — die Quelle trägt den Wert selbst. */
      const n = netzBauen(plan, ebene, 12);
      const s = teil('taster-schliesser', 380, 140); /* 3 (400,140), 4 (400,200) */
      const p = teil('klingel', 370, 320);           /* X1 (400,320), X2 (400,380) */
      draht([{ x: 400, y: n.oben }, { x: 400, y: 140 }], undefined, undefined, s, '3');
      draht([{ x: 400, y: 200 }, { x: 400, y: 320 }], s, '4', p, 'X1');
      draht([{ x: 400, y: 380 }, { x: 400, y: n.unten }], p, 'X2');
      return true;
    }
    return false;
  };

  return {
    ARTEN, artVon, EBENEN_VORGABE, neuerPlan, lesen, alsSvg, rasten,
    naechstesBmk, anschlussOrt, anschluesseVon, klemmeFuer, fangeAnschluss, rechtwinklig,
    kontakte, vorherMerken, nachziehen, veraendert, verbindungspunkte, kreuzungen, leitungPfad, schienenBauen,
    netzBauen, BEISPIELE, beispielBauen, uid, esc,
    SCHIENEN, leitungFuehren, ueberlappt, ueberlappungen, streckeSchieben, gruppeUmformen, planDrehen
  };
})();

(window as any).Schaltplan = Schaltplan;
