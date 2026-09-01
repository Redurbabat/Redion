/* ============================================================================
 * register/context.js — was am Rand steht, sagt der Bereich selbst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/context.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/context.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WOFÜR ES DAS GIBT (E272 Phase F).
 *
 * Die Kontextkante ist die 54 px schmale Spalte links vom Inhalt. Was darin
 * steht, hängt davon ab, wo man ist: auf einer Seite die Seitenwerkzeuge, im
 * PDF die Stifte, in einer Datenbank Ansichten und Filter, in Elektro die
 * acht Fachwerkzeuge.
 *
 * SIE STEHT NICHT IN DER SCHALE. Der Prototyp hat dafür zwei feste Listen —
 * CONTEXT_RAIL und CONTEXT_PANELS —, in denen jeder Bereich einmal
 * vorkommt. Das wäre in Redion genau die Kopplung, die §5 verbietet: die
 * Schale müsste den Editor, das PDF, die Datenbanken und Elektro namentlich
 * kennen, und ein neuer Bereich hiesse eine Änderung in der Schale.
 *
 * Hier ist es umgekehrt. Jeder Bereich meldet SICH an, die Kante fragt nur
 * nach dem Schauplatz und zeichnet, was zurückkommt. Die Kante kennt keinen
 * einzigen Bereich beim Namen.
 *
 * ZWEI FORMEN, UND DER UNTERSCHIED IST WICHTIG
 *
 *   · Ein Knopf mit `tun` HANDELT sofort. „Fokus", „Drucken", „Neu".
 *   · Ein Knopf mit `liefern` ÖFFNET DIE LADE und zeigt, was `liefern()`
 *     zurückgibt. „Blöcke", „Ansichten", „Fassungen" — Listen, die sich
 *     dauernd ändern und deshalb erst beim Öffnen entstehen dürfen.
 *
 * Beides zusammen ist erlaubt und heisst: klicken handelt, die Lade zeigt
 * mehr. Keines von beidem ist ein Fehler und wird abgewiesen.
 *
 * EIN KAPUTTER LIEFERANT DARF DIE KANTE NIE LEEREN.
 *
 * `fuer()` fängt jeden Fehler aus `zeigen()` einzeln ab und lässt den
 * Eintrag dann weg — nicht die ganze Liste. Ein Bereich, der beim Laden
 * einen Fehler hat, nimmt sonst die Bedienung aller anderen mit. Dasselbe
 * gilt für `liefern()`: wirft es, gibt es eine leere Lade mit einem Satz,
 * und nicht eine Kante, die verschwindet.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

/** Eine Zeile in der Lade. */
interface KontextZeile {
  id: string;
  name: string;
  /** Der zweite, kleinere Satz darunter. Weglassen ist besser als füllen. */
  unter?: string;
  zeichen?: string;
  /** Steht sie gerade als gewählt da? Nur Bild — die Wahrheit liegt im Bereich. */
  an?: boolean;
  tun: () => void;
}

/** Ein Knopf an der Kante. */
interface KontextKnopf {
  /** Der Schauplatz, für den er gilt — `App.schauplatz()`. */
  bereich: string;
  id: string;
  name: string;
  /** Ein Strichzeichen aus `Register.symbole`. Kein Emoji (E202). */
  zeichen: string;
  /** Kleiner steht weiter oben. Ohne Angabe: Reihenfolge der Anmeldung. */
  rang?: number;
  /** Fehlt sie, ist der Knopf immer da. */
  zeigen?: () => boolean;
  /** Handelt sofort. Bekommt den Knopf, an dem geklickt wurde — ein Menü
      braucht einen Ort, und den kennt die Kante (L95). Wer ihn nicht
      braucht, schreibt weiterhin `() => …`. */
  tun?: (anker?: HTMLElement) => void;
  /** Füllt die Lade. */
  liefern?: () => KontextZeile[];
}

const RegisterKontext = (() => {

  const LISTE: KontextKnopf[] = [];
  /** Lieferanten: sie werden bei JEDEM `fuer()` gefragt, nicht einmal. */
  const LIEFERANTEN: Array<{ bereich: string; fn: () => KontextKnopf[] }> = [];
  /** Wer den Arbeitsstapel füllt — die Liste unten in der Lade. */
  const stapelQuellen: (() => KontextZeile[])[] = [];

  /**
   * Einen Knopf anmelden.
   *
   * Abgewiesen wird nur, was nicht funktionieren KANN: ohne Bereich, ohne
   * Kennung, ohne Namen, ohne Zeichen — oder ohne beides, `tun` und
   * `liefern`, denn dann tut der Knopf nichts.
   *
   * `bereich + id` ist der Schlüssel, nicht `id` allein: „Filter" gibt es
   * in der Datenbank und in den Aufgaben, und das sind zwei Knöpfe.
   */
  const melde = (knopf: KontextKnopf): boolean => {
    if (!knopf || !knopf.bereich || !knopf.id || !knopf.name || !knopf.zeichen)
      return false;
    if (typeof knopf.tun !== 'function' && typeof knopf.liefern !== 'function')
      return false;
    if (LISTE.some(x => x.bereich === knopf.bereich && x.id === knopf.id))
      return false;
    LISTE.push(knopf);
    return true;
  };

  /**
   * Einen LIEFERANTEN anmelden — eine Liste, die erst beim Fragen entsteht.
   *
   * WARUM ES DAS BRAUCHT, UND ZWAR GEMESSEN. Elektro meldete seine acht
   * Werkzeuge beim Laden einzeln an, aus `inReiter('elektro')`. In der
   * Kante standen dann sechs. Der Grund: `Register.menueband.alle()` wendet
   * `zeigen()` schon selbst an, und `zeigen()` fragt „ist das Modul da?" —
   * beim Laden von `elektro/start.js` war `Electrical` noch nicht geladen.
   * Zwei Werkzeuge waren damit für immer weg, und niemand hätte es
   * gemerkt: sechs Knöpfe sehen aus wie sechs Knöpfe.
   *
   * Ein Lieferant fragt bei jedem Zeichnen neu. Was später geladen wird,
   * ist dann auch später da.
   */
  const meldeLieferant = (bereich: string, fn: () => KontextKnopf[]): boolean => {
    if (!bereich || typeof fn !== 'function') return false;
    if (LIEFERANTEN.some(l => l.bereich === bereich && l.fn === fn)) return false;
    LIEFERANTEN.push({ bereich, fn });
    return true;
  };

  const nimmZurueck = (bereich: string, id: string): boolean => {
    const i = LISTE.findIndex(x => x.bereich === bereich && x.id === id);
    if (i < 0) return false;
    LISTE.splice(i, 1);
    return true;
  };

  /**
   * Die Knöpfe eines Schauplatzes, in der Reihenfolge, in der sie stehen.
   *
   * `rang` sortiert; ohne Rang zählt die Anmeldereihenfolge. `sort` ist in
   * modernen Browsern stabil, gleiche Ränge behalten also ihre Folge — das
   * ist zugesichert und keine Beobachtung.
   */
  const fuer = (bereich: string): KontextKnopf[] => {
    if (!bereich) return [];
    const roh = LISTE.filter(k => k.bereich === bereich);
    for (const l of LIEFERANTEN) {
      if (l.bereich !== bereich) continue;
      try {
        const teil = l.fn();
        if (Array.isArray(teil)) for (const k of teil) {
          if (!k || !k.id || !k.name || !k.zeichen) continue;
          if (typeof k.tun !== 'function' && typeof k.liefern !== 'function') continue;
          if (roh.some(x => x.id === k.id)) continue;     /* kein Doppel */
          roh.push({ ...k, bereich });
        }
      } catch { /* ein kaputter Lieferant nimmt nicht die anderen mit */ }
    }
    return roh
      .filter(k => {
        if (typeof k.zeigen !== 'function') return true;
        try { return !!k.zeigen(); }
        catch { return false; }   /* ein kaputtes zeigen() nimmt EINEN Knopf */
      })
      .slice()
      .sort((a, b) => (a.rang ?? 500) - (b.rang ?? 500));
  };

  /**
   * Die Zeilen eines Knopfes holen — mit Netz.
   *
   * Der Aufrufer bekommt IMMER eine Liste, nie eine Ausnahme. Was schief
   * ging, steht als Zeile darin: eine leere Lade ohne Erklärung ist
   * schlimmer als eine mit einem Satz.
   */
  const zeilen = (knopf: KontextKnopf): KontextZeile[] => {
    if (!knopf || typeof knopf.liefern !== 'function') return [];
    try {
      const raus = knopf.liefern();
      return Array.isArray(raus) ? raus.filter(z => z && z.id && z.name) : [];
    } catch {
      return [{ id: 'fehler', name: 'Lässt sich gerade nicht laden.',
                tun: () => {} }];
    }
  };

  /** Wer etwas zum Arbeitsstapel beisteuert. */
  const meldeStapel = (fn: () => KontextZeile[]): boolean => {
    if (typeof fn !== 'function' || stapelQuellen.includes(fn)) return false;
    stapelQuellen.push(fn);
    return true;
  };

  /**
   * Der Arbeitsstapel — was gerade offen ist.
   *
   * KEIN NEUES DATENMODELL. Er ist eine ANSICHT auf das, was es schon gibt
   * (offene Reiter, zuletzt geöffnet, angeheftet). Wer hier etwas speichert,
   * hat einen zweiten Bestand angelegt, den niemand sichert.
   */
  const stapel = (): KontextZeile[] => {
    const raus: KontextZeile[] = [];
    for (const q of stapelQuellen) {
      try {
        const teil = q();
        if (Array.isArray(teil)) raus.push(...teil.filter(z => z && z.id && z.name));
      } catch { /* eine kaputte Quelle nimmt nicht die anderen mit */ }
    }
    return raus;
  };

  /** Welche Schauplätze überhaupt jemand angemeldet hat. */
  const bereiche = (): string[] => {
    const raus: string[] = [];
    for (const k of LISTE) if (!raus.includes(k.bereich)) raus.push(k.bereich);
    for (const l of LIEFERANTEN) if (!raus.includes(l.bereich)) raus.push(l.bereich);
    return raus;
  };

  return { melde, meldeLieferant, nimmZurueck, fuer, zeilen,
           meldeStapel, stapel, bereiche,
           alle: () => LISTE.slice(), anzahl: () => LISTE.length };
})();

(window as any).Register.kontext = RegisterKontext;
