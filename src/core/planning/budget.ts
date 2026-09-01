/* ============================================================================
 * core/planning/budget.ts — „Ich habe heute 45 Minuten. Was mache ich?"
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/planning/budget.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/planning/budget.js`.
 * ----------------------------------------------------------------------------
 * REIN: keine Uhr, keine Ablage, kein DOM. Die Zeit kommt als ZAHL herein —
 * „in wie vielen Tagen ist das fällig" —, nie als Datum. Damit lässt sich die
 * Rechnung prüfen, ohne einen Browser zu starten und ohne auf Mitternacht zu
 * warten.
 *
 * ─── WAS DER TAGESPLAN VORHER RECHNETE ──────────────────────────────────────
 *
 * `planen/dienst.ts:329` rechnete bis heute:
 *
 *     const minuten = (heutige.length + spaet.length) * geschaetzt;
 *
 * Jede Aufgabe dauert gleich lang, und gewarnt wurde bei mehr als acht
 * Stunden. Beides ist die stille Fassung von „ich weiss es nicht": sieben
 * Aufgaben ergeben immer 3 h 30 min, egal ob es sieben Häkchen oder sieben
 * Aufsätze sind, und die Acht-Stunden-Schranke springt bei sechzehn Aufgaben
 * an — also nie, und wenn doch, dann zu spät.
 *
 * ─── DIE ZWEI RECHNUNGEN, UND WARUM ES ZWEI SIND ────────────────────────────
 *
 * 1 · VERTEILEN — was von HEUTE in die vorhandenen Minuten passt.
 * 2 · MACHBARKEIT — ob sich das über die nächsten Tage überhaupt ausgeht.
 *
 * Die zweite ist die wichtige. Dass heute nicht alles hineinpasst, ist der
 * Normalfall und keine Nachricht; es passt nie alles in einen Tag. Eine
 * Anzeige, die das meldet, wird nach dem zweiten Mal nicht mehr gelesen.
 *
 * Eine Nachricht ist erst: „Bis Freitag fehlen dir 85 Minuten." Denn dann
 * ist eine FRIST in Gefahr, und dagegen kann man heute etwas tun — statt es
 * am Donnerstagabend zu merken.
 *
 * ─── WARUM DIE MACHBARKEIT WIRKLICH STIMMT ──────────────────────────────────
 *
 * Sie ist kein geratener Schwellwert, sondern die bekannte Machbarkeits-
 * bedingung für „earliest deadline first" auf einer Maschine mit
 * unterbrechbarer Arbeit:
 *
 *     Ein Satz Arbeiten mit Fristen ist genau dann zu schaffen, wenn für
 *     JEDE Frist gilt: die gesamte bis dahin fällige Arbeit passt in die
 *     bis dahin vorhandene Zeit.
 *
 * Beides ist hier gegeben: Lernen und Aufgaben lassen sich unterbrechen und
 * am nächsten Tag fortsetzen, und es gibt einen Menschen, nicht zwei. Die
 * Bedingung ist damit nicht nur hinreichend, sondern notwendig — was sie
 * meldet, IST unmöglich, und was sie durchlässt, geht sich wirklich aus.
 *
 * Deshalb kann diese Anzeige schweigen, ohne etwas zu verschweigen.
 *
 * ─── UND WARUM NICHT ALLES AUF HEUTE ────────────────────────────────────────
 *
 * Eine Aufgabe über 200 Minuten, fällig in fünf Tagen, gehört nicht ganz auf
 * heute und auch nicht auf übermorgen-alles. Sie gehört mit ihrer TAGESRATE
 * hinein — 200 / 5 = 40 Minuten. Das ist der Unterschied zwischen einem
 * Planer und einer Liste.
 * ==========================================================================*/

const Budget = (() => {

  /** Ein Ding, das Zeit kostet. */
  type Posten = {
    id: string;
    titel: string;
    art: string;
    /** Wie lange es INSGESAMT noch dauert, in Minuten. */
    minuten: number;
    /** In wie vielen Tagen fällig. 0 = heute, negativ = überfällig,
        null = ohne Frist. Nie ein Datum — siehe Kopf. */
    frist: number | null;
    /** Darf über mehrere Tage verteilt werden. */
    teilbar: boolean;
    /** Ein Termin: die Zeit ist ohnehin weg, ob geplant oder nicht. */
    fest: boolean;
    /** Nur für Posten OHNE Frist: was zuerst drankommt. */
    gewicht: number;
  };

  type Zuteilung = { posten: Posten; minuten: number; ganz: boolean; grund: string };
  type Draussen  = { posten: Posten; grund: string };
  type Tag = {
    zuteilung: Zuteilung[];
    draussen: Draussen[];
    verplant: number;
    rest: number;
    festMinuten: number;
    ueberzogen: number;
  };

  type Engpass = {
    tag: number; bedarf: number; kapazitaet: number; fehlt: number; posten: string[];
  };
  type Machbarkeit = {
    machbar: boolean;
    engpaesse: Engpass[];
    /** Das kleinste Tagesbudget, mit dem sich alles ausgeht. */
    noetigProTag: number;
    ueberfaellig: number;
    ueberfaelligMinuten: number;
  };

  const zahl = (w: unknown, ersatz = 0): number => {
    const n = Number(w);
    return Number.isFinite(n) ? n : ersatz;
  };

  /**
   * Aus irgendwas einen Posten machen.
   *
   * Die Vorgabe für `minuten` ist 25 und nicht 0: ein Posten ohne Schätzung
   * kostet trotzdem Zeit, und mit 0 verschwände er lautlos aus jeder
   * Rechnung — er wäre im Plan, im Bedarf und im Engpass unsichtbar.
   */
  const lesen = (roh: any, vorgabeMinuten = 25): Posten => {
    const f = roh?.frist;
    return {
      id: String(roh?.id ?? ''),
      titel: String(roh?.titel ?? roh?.text ?? 'Ohne Titel'),
      art: String(roh?.art ?? 'aufgabe'),
      minuten: Math.max(1, Math.round(zahl(roh?.minuten, vorgabeMinuten))),
      frist: (f === null || f === undefined || f === '') ? null : Math.round(zahl(f, 0)),
      teilbar: roh?.teilbar !== false,
      fest: roh?.fest === true,
      gewicht: zahl(roh?.gewicht, 0)
    };
  };

  const aufRaster   = (m: number, r: number): number => Math.ceil(m / r) * r;
  const abRaster    = (m: number, r: number): number => Math.floor(m / r) * r;

  /* ==========================================================================
   * 1 · VERTEILEN — der heutige Tag
   * ========================================================================*/
  const verteilen = (roh: any[], budgetMin: number, opt: any = {}): Tag => {
    const raster  = Math.max(1, Math.round(zahl(opt?.raster, 5)));
    const mindest = Math.max(1, Math.round(zahl(opt?.mindestBlock, 10)));
    const posten  = (Array.isArray(roh) ? roh : [])
      .map(p => lesen(p, Math.max(1, Math.round(zahl(opt?.vorgabeMinuten, 25)))));

    const zuteilung: Zuteilung[] = [];
    const draussen: Draussen[] = [];
    let rest = Math.max(0, Math.round(zahl(budgetMin, 0)));

    /* Feste Termine von heute nehmen ihre Zeit zuerst. Sie zu planen wäre
       verkehrt herum: sie finden statt, ob im Plan oder nicht. Ein Termin
       von gestern dagegen kostet heute nichts mehr. */
    const feste = posten.filter(p => p.fest && p.frist === 0);
    let festMinuten = 0;
    for (const p of feste) {
      festMinuten += p.minuten;
      zuteilung.push({ posten: p, minuten: p.minuten, ganz: true, grund: 'fest' });
    }
    const ueberzogen = Math.max(0, festMinuten - rest);
    rest = Math.max(0, rest - festMinuten);

    const nimm = (p: Posten, will: number, grund: string): void => {
      if (rest <= 0) { draussen.push({ posten: p, grund: 'kein Rest' }); return; }
      if (will <= rest) {
        zuteilung.push({ posten: p, minuten: will, ganz: will >= p.minuten, grund });
        rest -= will;
        return;
      }
      if (!p.teilbar) { draussen.push({ posten: p, grund: 'am Stück' }); return; }
      /* Ein Splitter ist kein Plan. Wer sich sieben Minuten Rest als
         „Aufsatz schreiben" hinschreibt, macht ihn nicht. */
      const stueck = abRaster(rest, raster);
      if (stueck < Math.min(mindest, p.minuten)) {
        draussen.push({ posten: p, grund: 'zu wenig Rest' });
        return;
      }
      zuteilung.push({ posten: p, minuten: stueck, ganz: false, grund });
      rest -= stueck;
    };

    /* Mit Frist: die dringendste zuerst, und nur die TAGESRATE. */
    const mitFrist = posten.filter(p => !p.fest && p.frist !== null)
      .sort((a, b) => (a.frist as number) - (b.frist as number) || a.minuten - b.minuten);
    for (const p of mitFrist) {
      const tage = Math.max(1, (p.frist as number) + 1);
      const rate = p.teilbar
        ? Math.min(p.minuten, aufRaster(Math.ceil(p.minuten / tage), raster))
        : p.minuten;
      nimm(p, rate, (p.frist as number) < 0 ? 'überfällig' : 'Frist');
    }

    /* Ohne Frist: was übrig bleibt, nach Gewicht, kurze zuerst. */
    const ohneFrist = posten.filter(p => !p.fest && p.frist === null)
      .sort((a, b) => b.gewicht - a.gewicht || a.minuten - b.minuten);
    for (const p of ohneFrist) nimm(p, p.minuten, 'wenn Zeit bleibt');

    const verplant = zuteilung.reduce((s, z) => s + z.minuten, 0);
    return { zuteilung, draussen, verplant, rest, festMinuten, ueberzogen };
  };

  /* ==========================================================================
   * 2 · MACHBARKEIT — die nächsten Tage
   * ========================================================================*/
  const machbarkeit = (roh: any[], tagesbudget: number, opt: any = {}): Machbarkeit => {
    const budget   = Math.max(0, Math.round(zahl(tagesbudget, 0)));
    const horizont = Math.max(0, Math.round(zahl(opt?.horizont, 30)));
    const posten   = (Array.isArray(roh) ? roh : [])
      .map(p => lesen(p, Math.max(1, Math.round(zahl(opt?.vorgabeMinuten, 25)))));

    /* Feste Termine sind keine Arbeit, sondern fehlende Kapazität. */
    const festAmTag = new Map<number, number>();
    for (const p of posten) {
      if (!p.fest || p.frist === null) continue;
      const t = Math.max(0, p.frist);
      if (t > horizont) continue;
      festAmTag.set(t, (festAmTag.get(t) || 0) + p.minuten);
    }

    /** Wieviel Zeit steht von heute bis einschliesslich `tag` zur Verfügung? */
    const kapazitaetBis = (tag: number, b: number): number => {
      let k = 0;
      for (let t = 0; t <= tag; t++) k += Math.max(0, b - (festAmTag.get(t) || 0));
      return k;
    };

    /* Überfälliges ist auf HEUTE fällig — nicht auf gestern. Sonst
       verschöbe sich die ganze Rechnung in die Vergangenheit. */
    const arbeit = posten
      .filter(p => !p.fest && p.frist !== null && (p.frist as number) <= horizont)
      .map(p => ({ p, tag: Math.max(0, p.frist as number) }))
      .sort((a, b) => a.tag - b.tag || b.p.minuten - a.p.minuten);

    const engpaesseBei = (b: number): Engpass[] => {
      const raus: Engpass[] = [];
      const titel: string[] = [];
      let bedarf = 0, i = 0;
      for (const tag of [...new Set(arbeit.map(a => a.tag))].sort((x, y) => x - y)) {
        while (i < arbeit.length && (arbeit[i] as any).tag <= tag) {
          bedarf += (arbeit[i] as any).p.minuten;
          titel.push((arbeit[i] as any).p.titel);
          i++;
        }
        const kap = kapazitaetBis(tag, b);
        if (bedarf > kap)
          raus.push({ tag, bedarf, kapazitaet: kap, fehlt: bedarf - kap, posten: titel.slice() });
      }
      return raus;
    };

    const engpaesse = engpaesseBei(budget);

    /* Das kleinste Tagesbudget, mit dem es sich ausgeht. Die Kapazität
       wächst mit dem Budget, also lässt sich die Grenze halbieren statt
       geraten. Die Obergrenze ist sicher gross genug: mit ihr passt schon
       an Tag 0 die ganze Arbeit samt allen festen Terminen. */
    const gesamt = arbeit.reduce((s, a) => s + a.p.minuten, 0);
    const festGesamt = [...festAmTag.values()].reduce((s, m) => s + m, 0);
    let tief = 0, hoch = gesamt + festGesamt;
    while (tief < hoch) {
      const mitte = Math.floor((tief + hoch) / 2);
      if (engpaesseBei(mitte).length) tief = mitte + 1; else hoch = mitte;
    }

    const spaet = posten.filter(p => !p.fest && p.frist !== null && (p.frist as number) < 0);
    return {
      machbar: engpaesse.length === 0,
      engpaesse,
      noetigProTag: tief,
      ueberfaellig: spaet.length,
      ueberfaelligMinuten: spaet.reduce((s, p) => s + p.minuten, 0)
    };
  };

  /* ==========================================================================
   * 3 · SÄTZE — damit die Anzeige nichts dazuerfindet
   * ========================================================================*/
  const tagWort = (tag: number): string =>
    tag <= 0 ? 'heute' : tag === 1 ? 'morgen' : tag === 2 ? 'übermorgen'
             : 'in ' + tag + ' Tagen';

  const dauerWort = (minuten: number): string => {
    const m = Math.max(0, Math.round(zahl(minuten, 0)));
    if (m < 60) return m + ' Min.';
    const std = Math.floor(m / 60), rest = m % 60;
    return rest ? std + ' Std. ' + rest + ' Min.' : std + ' Std.';
  };

  /**
   * KEIN Punkt am Ende.
   *
   * `dauerWort` endet auf eine Abkürzung — „1 Std. 55 Min." —, und die
   * bringt ihren Punkt schon mit. Der angehängte zweite stand im Bild als
   * „…55 Min.." da. Keine Prüfung hatte ihn; man sieht so etwas nur.
   */
  /**
   * Dieselbe Dauer, kurz — für die Kennzahlkarten.
   *
   * „1 Std. 30 Min." brach dort auf zwei Zeilen um und schob die
   * Beschriftung nach unten aus der Karte. Eine Uhrzeit liest sich ohnehin
   * so: 1 Std 30.
   */
  const dauerKurz = (minuten: number): string => {
    const m = Math.max(0, Math.round(zahl(minuten, 0)));
    if (m < 60) return m + ' Min.';
    const std = Math.floor(m / 60), rest = m % 60;
    return rest ? std + ' Std ' + rest : std + ' Std';
  };

  const engpassSatz = (e: Engpass): string =>
    'Bis ' + tagWort(e.tag) + ' fehlen ' + dauerWort(e.fehlt);

  /**
   * Der eine Satz für die Oberfläche — oder KEINER.
   *
   * Leer, wenn sich alles ausgeht. Das ist der ganze Zweck: eine Warnung,
   * die bei gewöhnlichem Gebrauch anspringt, ist keine.
   */
  const satz = (m: Machbarkeit): string => {
    if (!m || m.machbar) return '';
    /* Der engste Engpass ist der, an dem es zuerst reisst. */
    const erster = m.engpaesse[0];
    if (!erster) return '';
    return engpassSatz(erster) + ' Nötig wären ' + dauerWort(m.noetigProTag) + ' am Tag.';
  };

  return { verteilen, machbarkeit, lesen, satz, engpassSatz, tagWort, dauerWort,
           dauerKurz };
})();

(window as any).Budget = Budget;
