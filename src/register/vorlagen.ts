/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/vorlagen.ts (npm run bauen:ts). */
/* ============================================================================
 * register/vorlagen.js — die Vorlagengalerie
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/vorlagen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/vorlagen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Eine Vorlage ist kein Bild, sondern ein Programm: sie legt Seiten,
 * Datenbanken, Ansichten und Beispielzeilen an. Deshalb steht hier nicht der
 * Inhalt, sondern der Verweis auf die Funktion, die ihn baut — und die
 * Fassungsnummer, ohne die es später kein Update geben kann.
 *
 * Eine neue Vorlage: ein Eintrag hier und eine Funktion im Bereich Vorlagen.
 * Danach steht sie in der Galerie, in der Befehlspalette und im Rundgang.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.vorlagen = (() => {

  /* Eine Vorlage bringt mindestens eine Kennung mit; was sonst noch
     drinsteht, weiss der Bereich Vorlagen. `any` an dieser einen Stelle ist
     die Grenze zum alten Code (CLAUDE.md §52) und keine Bequemlichkeit. */
  type Vorlage = { id: string; [k: string]: any };

  const LISTE: Vorlage[] = [];

  const melde = (eintrag: Vorlage): boolean => {
    if (!eintrag || !eintrag.id) return false;
    if (LISTE.some(x => x.id === eintrag.id)) return false;
    LISTE.push(eintrag);
    return true;
  };

  /** Was der Bereich Vorlagen selbst mitbringt. */
  const ausDerGalerie = (): Vorlage[] => {
    try { return (typeof Galerie !== 'undefined' && Galerie.VORLAGEN) ? Galerie.VORLAGEN : []; }
    catch { return []; }
  };

  const alle = (): Vorlage[] => {
    const eigene = new Set(LISTE.map(x => x.id));
    return [...ausDerGalerie().filter(v => !eigene.has(v.id)), ...LISTE];
  };

  const eines = (id: string): Vorlage | null => alle().find(x => x.id === id) || null;

  /** Die Fassung einer Vorlage — für Updates auf eingesetzten Seiten. */
  const fassung = (id: string): number => {
    try { return (typeof Fassung !== 'undefined') ? Fassung.jetzige(id) : 1; }
    catch { return 1; }
  };

  /**
   * Eine Vorlage einsetzen. Geht über den Bereich, damit der Vermerk
   * „stammt aus Vorlage X, Fassung Y" auf der Seite landet.
   */
  const bauen = (id: string): any => {
    const v = eines(id);
    if (!v) {
      if (typeof Reporter !== 'undefined') Reporter.warn('Register/vorlagen', 'Unbekannt: ' + id);
      return null;
    }
    try {
      const ausGalerie = (typeof Galerie !== 'undefined') ? Galerie.bauen(id) : null;
      if (ausGalerie) return ausGalerie;
      /* EINE GEMELDETE VORLAGE BAUT SICH SELBST (E677). `melde` gab es seit
         jeher, doch `bauen` fragte nur die Galerie — und die kennt nur ihre
         eigene Liste: eine Vorlage aus einem Bereich stand im Register und
         war trotzdem nicht baubar. Den Vermerk „stammt aus Vorlage X" setzt
         Fassung, damit auch diese Seiten später ein Update bekommen. */
      const s = v.bauen ? v.bauen() : null;
      return (s && typeof Fassung !== 'undefined' && Fassung.markiere) ? Fassung.markiere(s, id) : s;
    }
    catch (e) {
      const grund = e instanceof Error ? e.message : String(e);
      if (typeof Reporter !== 'undefined') Reporter.error('Register/vorlagen', id + ': ' + grund, e);
      return null;
    }
  };

  const suche = (text: unknown): Vorlage[] => {
    const t = String(text || '').toLowerCase();
    if (!t) return alle();
    return alle().filter(v => (v.name || '').toLowerCase().includes(t) ||
                              (v.text || '').toLowerCase().includes(t));
  };

  return { alle, eines, fassung, bauen, suche, melde, anzahl: () => alle().length };
})();
