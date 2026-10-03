/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/editor/mehrfach.ts (npm run bauen:ts). */
/* ============================================================================
 * apps/schreiben/mehrfach/ansicht.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/editor/mehrfach.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/editor/mehrfach.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Mehrfach = (() => {

  let gewaehlt = new Set<string>();

  /**
   * Die Kennungen aller Blöcke der Seite, in der Reihenfolge, in der sie
   * dastehen.
   *
   * EIN FUND DES UMZUGS. Vorher stand hier zweimal
   * `[...document.querySelectorAll('.blk')].map(e => e.dataset.bid)` — und
   * `dataset.bid` ist `string | undefined`. Ein `.blk` ohne `data-bid` (den
   * gibt es beim Zeichnen für den Bruchteil einer Sekunde) schob ein
   * `undefined` in die Liste, und `alle.indexOf(jetzt)` zählte ab da eins
   * daneben: Pfeiltaste runter sprang einen Block zu weit. Jetzt fallen
   * solche Einträge heraus.
   */
  const alleKennungen = (): string[] =>
    [...document.querySelectorAll<HTMLElement>('.blk')]
      .map(e => e.dataset['bid'])
      .filter((x): x is string => !!x);

  const zeichne = (): void => {
    document.querySelectorAll<HTMLElement>('.blk').forEach(el =>
      el.classList.toggle('sel', !!el.dataset['bid'] && gewaehlt.has(el.dataset['bid'])));
  };

  const leeren = (): void => { gewaehlt.clear(); zeichne(); };
  const hat = (): boolean => gewaehlt.size > 0;
  const ids = (): string[] => [...gewaehlt];

  /* Auf schmalen Bildschirmen gibt es in Notion keine Mehrfachauswahl —
     dort ist Ziehen zum Markieren dem Scrollen im Weg.
     760 und nicht 700: „schmal" soll überall dasselbe heissen. Die 700
     stand hier als letzte von sieben Stellen, und ein Bildschirm von
     730 px hätte Telefonleisten gezeigt und trotzdem Ziehen erlaubt. */
  const schmal = (): boolean =>
    window.matchMedia('(max-width:' +
      ((typeof KONSTANTEN !== 'undefined' && KONSTANTEN.TELEFON_BREITE) || 760) +
      'px)').matches;

  const waehle = (id: string | undefined, dazu = false): void => {
    if (!id) return;
    if (schmal() && dazu) return;
    if (!dazu) gewaehlt.clear();
    gewaehlt.add(id);
    zeichne();
  };

  const bereich = (vonId: string | undefined, bisId: string | undefined): void => {
    if (schmal() || !vonId || !bisId) return;
    const alle = alleKennungen();
    const a = alle.indexOf(vonId), b = alle.indexOf(bisId);
    if (a < 0 || b < 0) return;
    gewaehlt.clear();
    alle.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => gewaehlt.add(x));
    zeichne();
  };

  const start = (): void => {
    document.addEventListener('keydown', e => {
      const imFokus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const imText = !!imFokus?.classList.contains('ct');

      /* Esc wählt den Block unter dem Cursor aus */
      if (e.key === 'Escape' && imFokus && imText && !document.querySelector('.menu, .overlay')) {
        const blk = imFokus.closest<HTMLElement>('.blk');
        if (blk) { imFokus.blur(); waehle(blk.dataset['bid']); e.preventDefault(); }
        return;
      }
      if (!hat()) return;

      if (e.key === 'Escape') { leeren(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        Verlauf.merke(true);
        ids().forEach(id => { Store.trashBlock(id); Store.purgeBlock(id); });
        leeren(); App.zeichneSeite();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        Verlauf.merke(true);
        ids().forEach(id => {
          const b = Store.getBlock(id);
          if (!b) return;
          const daten = Store.baum(id);
          Store.baumEinfuegen(daten, b.parentId);
        });
        leeren(); App.zeichneSeite();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const p = Store.getBlock(App.aktuelleSeite());
        if (!p) return;
        /* Erst der eigene Block, dann die Geschwister, dann die ganze Seite —
           genau die Stufen, die Notion durchläuft. */
        const alle = new Set<string>(p.content || []);
        /* EIN FUND DES UMZUGS. Hier stand `new Set([p.content[0]])`. Auf
           einer leeren Seite ist `p.content[0]` `undefined` — die Auswahl
           enthielt dann ein Nichts, `hat()` sagte trotzdem „ja", und die
           nächste Löschtaste rief `Store.trashBlock(undefined)`. */
        const erster = (p.content || [])[0];
        if (gewaehlt.size === 0) { if (!erster) return; gewaehlt = new Set([erster]); }
        else if (gewaehlt.size < alle.size) { gewaehlt = alle; }
        else { gewaehlt = alle; UI.toast('Alle Blöcke dieser Seite ausgewählt'); }
        zeichne();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const alle = alleKennungen();
        const jetzt = ids()[ids().length - 1];
        if (!jetzt) return;
        const i = alle.indexOf(jetzt) + (e.key === 'ArrowDown' ? 1 : -1);
        const ziel = alle[i];
        if (ziel) { e.preventDefault(); e.shiftKey ? bereich(ids()[0], ziel) : waehle(ziel); }
        return;
      }
      if (e.key === 'Enter') {
        const id = ids()[0];
        leeren();
        const ct = document.querySelector(`[data-bid="${id}"] .ct`);
        if (ct) { e.preventDefault(); Blocks.cursorAnsEnde(ct); }
        return;
      }
    });

    /* Ohne `#page` gibt es keine Blöcke zum Auswählen — dann tut dieses
       Modul nichts, statt beim Start zu werfen und alles danach mitzureissen
       (derselbe Fund wie in `hinweis.ts`). */
    document.getElementById('page')?.addEventListener('click', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel) return;
      if (ziel.closest('.ct, button, input, a')) { if (!e.shiftKey) leeren(); return; }
      const blk = ziel.closest<HTMLElement>('.blk');
      if (!blk) { leeren(); return; }
      if (e.shiftKey && hat()) bereich(ids()[0], blk.dataset['bid']);
    });
  };

  return { start, waehle, leeren, hat, ids, bereich, schmal };
})();
(window as any).Mehrfach = Mehrfach;


/* ==========================================================================
 * 6. STARTSEITE UND POSTEINGANG
 * ========================================================================*/
