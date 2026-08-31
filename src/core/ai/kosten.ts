/* ============================================================================
 * core/ai/kosten.ts — was ein KI-Aufruf kostet, BEVOR er läuft
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ai/kosten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/ai/kosten.js`. Wer das .js bearbeitet, verliert die Änderung
 * beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE LÜCKE GAB — und sie war ausgesprochen, nicht vergessen.
 *
 * `agenten.ts:26` sagt es wörtlich:
 *
 *     „Das ist die ehrliche Version eines Kostenlimits — hier zählt es
 *      Schritte statt Geld, weil die lokale KI nichts kostet."
 *
 * Die Annahme stimmte, als sie geschrieben wurde. Damals war Redions KI
 * Ollama und WebLLM. Heute stehen sechs Anbieter in der Liste, zwei davon
 * ausdrücklich `frei: false` — OpenAI und Anthropic. Die Begründung ist
 * stehengeblieben und die Welt darunter hat sich gedreht.
 *
 * ─── DIE DREI KONKRETEN GEFAHREN, GEMESSEN ──────────────────────────────────
 *
 * 1. `embeddingsBauen` schickt JEDE Seite einzeln an eine kostenpflichtige
 *    API. Ein Klick. Keine Zahl vorher, keine Obergrenze, kein Abbruch.
 *    Bei zweitausend Seiten sind das zweitausend Aufrufe.
 * 2. Der normale Chat hat GAR KEIN Limit — weder Tageslimit noch Notaus
 *    noch Zähler. Beides hängt allein an `Agent.laufen`.
 * 3. Bis zu vier Versuche je Anfrage, und `frageKurz` steckt in der
 *    Agentenschleife: dreissig Schritte mal vier Anfragen ist der
 *    Extremfall.
 *
 * ─── WAS DIESE DATEI TUT, UND WAS SIE BEWUSST NICHT TUT ─────────────────────
 *
 * Sie SCHÄTZT und sie RECHNET. Sie ruft nichts auf, sie speichert nichts,
 * sie kennt keinen Anbieter — die Preise kommen als Daten herein.
 *
 * Sie behauptet ausdrücklich NICHT, genau zu sein. Eine Schätzung, die sich
 * als Rechnung ausgibt, ist schlimmer als keine: wer „0,42 CHF" liest und
 * 0,71 bezahlt, glaubt der Zahl nie wieder. Jede Schätzung trägt deshalb
 * ihre Unsicherheit mit, und für ein unbekanntes Modell gibt es KEINE Zahl
 * statt einer geratenen.
 *
 * ─── WARUM DIE PREISLISTE EIN DATUM TRÄGT ───────────────────────────────────
 *
 * Preise ändern sich, und eine Liste im Code veraltet still. Sie trägt
 * deshalb `STAND` — und wer die Zahlen anzeigt, kann sagen, von wann sie
 * sind. Das ist derselbe Gedanke wie `fehlt` im Sicherungs-Manifest: eine
 * Angabe, die nicht sagt, wie sicher sie ist, ist die gefährlichere.
 * ==========================================================================*/

const KiKosten = (() => {

  /**
   * Wann diese Preise nachgesehen wurden.
   *
   * Wer sie anzeigt, nennt dieses Datum dazu. Eine Zahl ohne Datum liest
   * sich wie eine Tatsache und ist eine Momentaufnahme.
   */
  const STAND = '2026-08-31';

  /** Die Währung, in der hier gerechnet wird. */
  const WAEHRUNG = 'USD';

  /**
   * Preis je Million Token, getrennt nach Eingabe und Ausgabe.
   *
   * Die Schlüssel sind Modellnamen, wie die Anbieter sie schreiben. Ein
   * Modell, das hier fehlt, bekommt KEINE Schätzung — siehe `schaetzen`.
   *
   * `0` heisst wirklich null und ist kein „unbekannt": die Modelle mit
   * `:free` und die lokalen kosten nichts.
   */
  const PREISE: Record<string, { ein: number; aus: number }> = {
    /* --- kostenlos, aber mit Kontingent ------------------------------- */
    'llama-3.3-70b-versatile':              { ein: 0, aus: 0 },
    'llama-3.1-8b-instant':                 { ein: 0, aus: 0 },
    'gemma2-9b-it':                         { ein: 0, aus: 0 },
    'meta-llama/llama-3.3-70b-instruct:free': { ein: 0, aus: 0 },
    'google/gemma-2-9b-it:free':            { ein: 0, aus: 0 },
    'mistralai/mistral-7b-instruct:free':   { ein: 0, aus: 0 },
    'gemini-2.0-flash':                     { ein: 0, aus: 0 },
    'gemini-2.0-flash-lite':                { ein: 0, aus: 0 },

    /* --- kostenpflichtig ---------------------------------------------- */
    'gpt-4o-mini':                          { ein: 0.15,  aus: 0.60 },
    'gpt-4o':                               { ein: 2.50,  aus: 10.00 },
    'claude-3-5-haiku-latest':              { ein: 0.80,  aus: 4.00 },
    'claude-sonnet-4-5':                    { ein: 3.00,  aus: 15.00 },

    /* --- Embeddings ---------------------------------------------------- */
    'text-embedding-3-small':               { ein: 0.02,  aus: 0 },
    'text-embedding-004':                   { ein: 0,     aus: 0 }
  };

  /**
   * Aus Text eine Tokenzahl SCHÄTZEN.
   *
   * Vier Zeichen je Token ist die übliche Faustregel für Englisch. Für
   * Deutsch ist sie zu optimistisch — Zusammensetzungen wie
   * „Leitungsdimensionierung" zerfallen in mehr Stücke, als ihre Länge
   * vermuten lässt. Für Code ebenso.
   *
   * Deshalb wird mit 3,6 gerechnet und nicht mit 4: lieber zu viel
   * schätzen als zu wenig. Eine Schätzung, die regelmässig unter dem
   * echten Wert liegt, ist genau die, der man am Monatsende nicht mehr
   * glaubt.
   *
   * Das bleibt eine Schätzung. `unsicherheit()` sagt, wie sehr.
   */
  const ZEICHEN_JE_TOKEN = 3.6;

  const tokenSchaetzen = (text: unknown): number => {
    const s = String(text ?? '');
    if (!s) return 0;
    return Math.ceil(s.length / ZEICHEN_JE_TOKEN);
  };

  /** Dieselbe Schätzung für eine ganze Nachrichtenliste. */
  const tokenAusNachrichten = (nachrichten: unknown): number => {
    if (!Array.isArray(nachrichten)) return tokenSchaetzen(nachrichten);
    let n = 0;
    for (const m of nachrichten) {
      if (!m) continue;
      n += tokenSchaetzen((m as any).content);
      /* Jede Nachricht kostet ein paar Token an Gerüst (Rolle, Trenner).
         Vier ist der übliche Aufschlag; er fällt bei langen Nachrichten
         nicht ins Gewicht und bei zwanzig kurzen sehr wohl. */
      n += 4;
    }
    return n;
  };

  /**
   * Wie unsicher eine Schätzung ist, als Faktor nach oben.
   *
   * 1,35 heisst: es kann bis zu 35 % mehr werden. Der Wert ist nicht aus
   * der Luft gegriffen, sondern der übliche Abstand zwischen der
   * Zeichenregel und echten Tokenizern bei gemischtem Text. Wer eine Zahl
   * anzeigt, zeigt eine SPANNE.
   */
  const unsicherheit = (): number => 1.35;

  type Schaetzung = {
    /** Ist eine Aussage überhaupt möglich? */
    bekannt: boolean;
    modell: string;
    tokenEin: number;
    tokenAus: number;
    /** Der wahrscheinliche Betrag. */
    betrag: number;
    /** Die obere Grenze — was es höchstens werden dürfte. */
    hoechstens: number;
    waehrung: string;
    /** true = dieses Modell kostet nichts. */
    frei: boolean;
    /** Ein Satz für den Menschen. */
    satz: string;
  };

  /**
   * Was ein Aufruf kosten dürfte.
   *
   * @param modell    der Modellname, wie der Anbieter ihn schreibt
   * @param tokenEin  geschätzte Eingabe-Token
   * @param tokenAus  geschätzte Ausgabe-Token (die Deckelung, nicht die
   *                  Hoffnung — man weiss vorher nicht, wie lang die
   *                  Antwort wird)
   * @param preise    zum Überschreiben in Prüfläufen; sonst `PREISE`
   */
  const schaetzen = (modell: string, tokenEin: number, tokenAus: number,
                     preise: Record<string, { ein: number; aus: number }> = PREISE): Schaetzung => {
    const p = preise[modell];
    if (!p) {
      /* KEINE geratene Zahl. Ein unbekanntes Modell bekommt ein ehrliches
         „weiss ich nicht" — und der Aufrufer entscheidet, ob er trotzdem
         will. Eine erfundene Zahl wäre hier das Schlimmste: sie sähe
         genauso aus wie eine echte. */
      return {
        bekannt: false, modell, tokenEin, tokenAus,
        betrag: 0, hoechstens: 0, waehrung: WAEHRUNG, frei: false,
        satz: 'Für „' + modell + '" ist hier kein Preis hinterlegt. Was der ' +
              'Aufruf kostet, lässt sich nicht sagen — die Preisliste ist vom ' +
              STAND + '.'
      };
    }
    const frei = p.ein === 0 && p.aus === 0;
    const betrag = (tokenEin / 1e6) * p.ein + (tokenAus / 1e6) * p.aus;
    const hoechstens = betrag * unsicherheit();
    return {
      bekannt: true, modell, tokenEin, tokenAus,
      betrag, hoechstens, waehrung: WAEHRUNG, frei,
      satz: frei
        ? 'Dieses Modell kostet nichts. (Ein Kontingent kann es trotzdem haben.)'
        : 'Schätzung: rund ' + geld(betrag) + ', höchstens etwa ' + geld(hoechstens) +
          '. Die Tokenzahl ist aus der Textlänge geschätzt, nicht gezählt.'
    };
  };

  /** Ein Betrag als Text. Kleine Beträge brauchen mehr Stellen. */
  const geld = (betrag: number, waehrung = WAEHRUNG): string => {
    if (!Number.isFinite(betrag)) return '–';
    if (betrag === 0) return '0.00 ' + waehrung;
    if (betrag < 0.01) return '< 0.01 ' + waehrung;
    return betrag.toFixed(betrag < 1 ? 3 : 2) + ' ' + waehrung;
  };

  /* ==========================================================================
   * DIE GRENZEN
   * ------------------------------------------------------------------------
   * Vier Grenzen, und sie greifen NACHEINANDER. Die erste, die zuschlägt,
   * gewinnt — und ihr Name steht in der Antwort, damit ein Mensch weiss,
   * WELCHE er ändern muss.
   *
   * Alle vier sind abschaltbar (0 = keine Grenze). Das ist wichtig: wer
   * bewusst viel ausgeben will, soll nicht gegen eine Wand laufen, die ihm
   * jemand anderes gesetzt hat. Redion ist sein Werkzeug.
   * ======================================================================*/

  type Grenzen = {
    /** Höchstbetrag für einen einzelnen Aufruf. 0 = keine Grenze. */
    jeAufruf: number;
    /** Höchstbetrag für einen Agentenlauf. 0 = keine Grenze. */
    jeLauf: number;
    jeTag: number;
    jeMonat: number;
  };

  const VORGABE_GRENZEN: Grenzen = {
    jeAufruf: 0.50, jeLauf: 2.00, jeTag: 5.00, jeMonat: 20.00
  };

  type Stand = {
    /** Was heute schon ausgegeben wurde. */
    heute: number;
    /** Was diesen Monat schon ausgegeben wurde. */
    monat: number;
    /** Was in diesem Agentenlauf schon ausgegeben wurde. */
    lauf: number;
  };

  type Urteil = {
    /** Darf der Aufruf laufen? */
    erlaubt: boolean;
    /** Welche Grenze zuschlug — leer, wenn erlaubt. */
    grenze: '' | 'jeAufruf' | 'jeLauf' | 'jeTag' | 'jeMonat';
    /** Ein Satz, der sagt WAS und WIEVIEL — nicht nur „nein". */
    satz: string;
    /** Die Schätzung, die geprüft wurde. */
    schaetzung: Schaetzung;
  };

  const GRENZ_NAME: Record<string, string> = {
    jeAufruf: 'für einen einzelnen Aufruf',
    jeLauf: 'für einen Agentenlauf',
    jeTag: 'für heute',
    jeMonat: 'für diesen Monat'
  };

  /**
   * Darf dieser Aufruf laufen?
   *
   * Geprüft wird mit `hoechstens`, nicht mit `betrag`. Das ist der
   * Unterschied zwischen einer Grenze und einer Empfehlung: wer bei 5,00
   * deckelt und mit dem wahrscheinlichen Wert rechnet, gibt regelmässig
   * 6,50 aus.
   *
   * Ein UNBEKANNTES Modell wird durchgelassen — mit gesetztem Hinweis. Es
   * zu sperren hiesse, jeden neuen Modellnamen zu blockieren, bis jemand
   * die Preisliste pflegt; das wäre §47 von der anderen Seite. Der Mensch
   * erfährt aber, dass niemand weiss, was es kostet.
   */
  const pruefen = (schaetzung: Schaetzung, grenzen: Grenzen, stand: Stand): Urteil => {
    if (!schaetzung.bekannt || schaetzung.frei) {
      return { erlaubt: true, grenze: '', satz: schaetzung.satz, schaetzung };
    }
    const k = schaetzung.hoechstens;
    const pruefungen: Array<[Urteil['grenze'], number, number]> = [
      ['jeAufruf', grenzen.jeAufruf, k],
      ['jeLauf',   grenzen.jeLauf,   stand.lauf + k],
      ['jeTag',    grenzen.jeTag,    stand.heute + k],
      ['jeMonat',  grenzen.jeMonat,  stand.monat + k]
    ];
    for (const [name, grenze, waere] of pruefungen) {
      if (!grenze || grenze <= 0) continue;
      if (waere <= grenze) continue;
      return {
        erlaubt: false, grenze: name, schaetzung,
        satz: 'Dieser Aufruf würde die Grenze ' + GRENZ_NAME[name!] + ' ' +
              'überschreiten: er käme auf ' + geld(waere) + ' gegen ' +
              geld(grenze) + '. Die Grenzen stehen unter Einstellungen → KI.'
      };
    }
    return { erlaubt: true, grenze: '', satz: schaetzung.satz, schaetzung };
  };

  /* ==========================================================================
   * DAS ZWEITE BUCH: KONTINGENTE, DIE KEIN GELD SIND
   * ------------------------------------------------------------------------
   * Groq, OpenRouter und Gemini kosten nichts und haben trotzdem eine
   * Grenze — Anfragen je Minute, Token je Tag. Wer die überschreitet,
   * bekommt ein 429 und wartet.
   *
   * Redions Bremse ist heute rein REAKTIV: sie wartet auf das 429 und
   * versucht es dann noch einmal. Ein Zähler auf der Absenderseite weiss
   * vorher, dass es gleich klemmt — und kann sagen, wie lange.
   * ======================================================================*/

  type Kontingent = { verbraucht: number; grenze: number; bis: number };

  /**
   * Ein Kontingent fortschreiben.
   *
   * Läuft das Fenster ab, beginnt es von vorn. Das ist die ganze Logik,
   * und sie steht hier, damit sie geprüft werden kann, ohne eine Minute zu
   * warten — `jetzt` kommt herein.
   */
  const kontingentBuchen = (k: Kontingent, wieviel: number, jetzt: number,
                            fensterMs: number): Kontingent => {
    if (!k || jetzt >= k.bis) {
      return { verbraucht: wieviel, grenze: k ? k.grenze : 0, bis: jetzt + fensterMs };
    }
    return { ...k, verbraucht: k.verbraucht + wieviel };
  };

  /** Ist noch Platz im Kontingent? */
  const kontingentFrei = (k: Kontingent, wieviel: number, jetzt: number): boolean => {
    if (!k || !k.grenze || k.grenze <= 0) return true;
    if (jetzt >= k.bis) return true;
    return k.verbraucht + wieviel <= k.grenze;
  };

  /** Wie lange noch, bis das Fenster wieder aufgeht? In Sekunden. */
  const kontingentWartet = (k: Kontingent, jetzt: number): number => {
    if (!k || jetzt >= k.bis) return 0;
    return Math.ceil((k.bis - jetzt) / 1000);
  };

  /* ==========================================================================
   * DAS BUCH: WAS WIRKLICH AUSGEGEBEN WURDE
   * ======================================================================*/

  type Buchung = {
    /** ISO-Tag, `2026-08-31`. */
    tag: string;
    modell: string;
    anbieter: string;
    tokenEin: number;
    tokenAus: number;
    betrag: number;
    /** true = die Tokenzahl kam vom Anbieter, nicht aus der Schätzung. */
    gezaehlt: boolean;
  };

  /**
   * Aus einer Liste Buchungen den Stand rechnen.
   *
   * @param tag    der heutige Tag als `2026-08-31`
   * @param monat  der Monat als `2026-08`
   */
  const standAus = (buchungen: Buchung[], tag: string, monat: string,
                    lauf = 0): Stand => {
    let heute = 0, imMonat = 0;
    for (const b of buchungen || []) {
      if (!b || !Number.isFinite(b.betrag)) continue;
      if (b.tag === tag) heute += b.betrag;
      if (String(b.tag || '').slice(0, 7) === monat) imMonat += b.betrag;
    }
    return { heute, monat: imMonat, lauf };
  };

  /** Was je Anbieter zusammenkam — für die Anzeige. */
  const jeAnbieter = (buchungen: Buchung[], monat?: string): Record<string, number> => {
    const aus: Record<string, number> = Object.create(null);
    for (const b of buchungen || []) {
      if (!b || !Number.isFinite(b.betrag)) continue;
      if (monat && String(b.tag || '').slice(0, 7) !== monat) continue;
      const a = b.anbieter || 'unbekannt';
      aus[a] = (aus[a] || 0) + b.betrag;
    }
    return aus;
  };

  /**
   * Alte Buchungen wegwerfen.
   *
   * Ein Buch, das ewig wächst, ist irgendwann selbst das Problem. Behalten
   * wird, was in den Monatsstand einfliessen kann — der Rest ist Historie
   * und gehört nicht in `meta`.
   */
  const kuerzen = (buchungen: Buchung[], abTag: string): Buchung[] =>
    (buchungen || []).filter(b => b && String(b.tag || '') >= abTag);

  return {
    STAND, WAEHRUNG, PREISE, VORGABE_GRENZEN, ZEICHEN_JE_TOKEN,
    tokenSchaetzen, tokenAusNachrichten, unsicherheit,
    schaetzen, pruefen, geld,
    kontingentBuchen, kontingentFrei, kontingentWartet,
    standAus, jeAnbieter, kuerzen
  };
})();

(window as any).KiKosten = KiKosten;
