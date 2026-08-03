/* ============================================================================
 * apps/schreiben/mehrfach/ansicht.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Mehrfach = (() => {

  let gewaehlt = new Set();

  const zeichne = () => {
    document.querySelectorAll('.blk').forEach(el =>
      el.classList.toggle('sel', gewaehlt.has(el.dataset.bid)));
  };

  const leeren = () => { gewaehlt.clear(); zeichne(); };
  const hat = () => gewaehlt.size > 0;
  const ids = () => [...gewaehlt];

  /* Auf schmalen Bildschirmen gibt es in Notion keine Mehrfachauswahl —
     dort ist Ziehen zum Markieren dem Scrollen im Weg. */
  const schmal = () => window.matchMedia('(max-width:700px)').matches;

  const waehle = (id, dazu = false) => {
    if (schmal() && dazu) return;
    if (!dazu) gewaehlt.clear();
    gewaehlt.add(id);
    zeichne();
  };

  const bereich = (vonId, bisId) => {
    if (schmal()) return;
    const alle = [...document.querySelectorAll('.blk')].map(e => e.dataset.bid);
    const a = alle.indexOf(vonId), b = alle.indexOf(bisId);
    if (a < 0 || b < 0) return;
    gewaehlt.clear();
    alle.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => gewaehlt.add(x));
    zeichne();
  };

  const start = () => {
    document.addEventListener('keydown', e => {
      const imText = document.activeElement?.classList?.contains('ct');

      /* Esc wählt den Block unter dem Cursor aus */
      if (e.key === 'Escape' && imText && !document.querySelector('.menu, .overlay')) {
        const blk = document.activeElement.closest('.blk');
        if (blk) { document.activeElement.blur(); waehle(blk.dataset.bid); e.preventDefault(); }
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
        const alle = new Set(p.content || []);
        if (gewaehlt.size === 0) { gewaehlt = new Set([p.content[0]]); }
        else if (gewaehlt.size < alle.size) { gewaehlt = alle; }
        else { gewaehlt = alle; UI.toast('Alle Blöcke dieser Seite ausgewählt'); }
        zeichne();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const alle = [...document.querySelectorAll('.blk')].map(x => x.dataset.bid);
        const jetzt = ids()[ids().length - 1];
        const i = alle.indexOf(jetzt) + (e.key === 'ArrowDown' ? 1 : -1);
        if (alle[i]) { e.preventDefault(); e.shiftKey ? bereich(ids()[0], alle[i]) : waehle(alle[i]); }
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

    document.getElementById('page').addEventListener('click', e => {
      if (e.target.closest('.ct, button, input, a')) { if (!e.shiftKey) leeren(); return; }
      const blk = e.target.closest('.blk');
      if (!blk) { leeren(); return; }
      if (e.shiftKey && hat()) bereich(ids()[0], blk.dataset.bid);
    });
  };

  return { start, waehle, leeren, hat, ids, bereich, schmal };
})();
window.Mehrfach = Mehrfach;


/* ==========================================================================
 * 6. STARTSEITE UND POSTEINGANG
 * ========================================================================*/
